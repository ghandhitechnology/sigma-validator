// SIGMA Evaluation API v2.1 — Cloudflare Pages Function
// 7-axis startup idea validation via DeepSeek V4
// v2.1: retry + timeout + rate limit + caching + analytics + KV reports + security headers

const AXES = [
  { name: '문제 진실성', question: '이 문제가 진짜 존재하는가?', icon: '🎯' },
  { name: '해결책 타당성', question: '이 해결책이 문제를 해결하는가?', icon: '🏗️' },
  { name: '수익 가능성', question: '돈을 벌 수 있는 구조인가?', icon: '💰' },
  { name: '시장 규모', question: '충분히 큰 시장인가?', icon: '📊' },
  { name: '차별성', question: '경쟁자 대비 무엇이 다른가?', icon: '🔥' },
  { name: '실행 가능성', question: '실제로 만들 수 있는가?', icon: '🛡️' },
  { name: '확장성', question: '성장할 수 있는가?', icon: '⚡' },
];

const SYSTEM_PROMPT = `당신은 SIGMA라는 창업 아이디어 검증 시스템입니다.
주어진 창업 아이디어를 7개의 축으로 엄격하게 분석하여 JSON으로 응답하세요.

7개 축:
1. 문제 진실성 — 이 문제가 진짜 존재하는가? (대상 사용자가 실제로 겪는 고통인가?)
2. 해결책 타당성 — 이 해결책이 문제를 해결하는가? (논리적 인과관계가 성립하는가?)
3. 수익 가능성 — 돈을 벌 수 있는 구조인가? (단위 경제가 맞는가?)
4. 시장 규모 — 충분히 큰 시장인가? (TAM/SAM/SOM이 의미 있는가?)
5. 차별성 — 경쟁자 대비 무엇이 다른가? (진입장벽이 있는가?)
6. 실행 가능성 — 실제로 만들 수 있는가? (기술/자원/복잡도가 현실적인가?)
7. 확장성 — 성장할 수 있는가? (스케일 모델이 존재하는가?)

각 축마다 0-100 점수와 2-4문장 분석을 작성하세요.

또한 아이디어에서 발견되는 "Slop"(함정/오류/과장)을 식별하세요:
- type: 함정 유형 (예: "순환 논리", "시장 과대", "기술 과신", "수익 모델 부재", "경쟁 망각")
- severity: "fatal" | "warn" | "minor"
- description: 구체적 설명

응답 형식 (반드시 JSON):
{
  "overall_score": 0-100,
  "summary": "1-2문장 요약",
  "axes": [
    { "name": "축 이름", "question": "질문", "score": 0-100, "analysis": "분석 내용" }
  ],
  "slops": [
    { "type": "함정 유형", "severity": "fatal|warn|minor", "description": "설명" }
  ]
}

**중요:**
- 한국어로 작성하세요.
- 정직하게 평가하세요. 점수는 관대하지 않습니다.
- 분석은 구체적이고 근거 기반이어야 합니다.
- Slop이 없으면 빈 배열을 반환하세요.
- 반드시 JSON만 응답하세요. 마크다운 금지.`;

const MAX_INPUT_CHARS = 3000;
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 25000;
const CACHE_TTL_SECONDS = 86400; // 24 hours
const REPORT_TTL_SECONDS = 2592000; // 30 days
const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_WINDOW_MS = 60000; // 1 minute

// ── Rate limiter (in-memory, per-worker) ────────────────────────────
// Resets when the worker cold-starts. Sufficient for free-tier scale.
const rateMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (entry && now - entry.reset > RATE_WINDOW_MS) {
    rateMap.delete(ip);
    return true;
  }
  if (!entry) {
    rateMap.set(ip, { count: 1, reset: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

// ── Retry with exponential backoff + jitter ─────────────────────────
async function fetchWithRetry(url, options, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) return response;

      // Retry only on retryable status codes
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      return response; // Non-retryable
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries && e.name !== 'AbortError') {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (e.name === 'AbortError') {
        throw new Error('UPSTREAM_TIMEOUT');
      }
      throw e;
    }
  }
  throw lastError || new Error('UPSTREAM_ERROR');
}

// ── Caching ──────────────────────────────────────────────────────────
async function cipherHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Analytics ────────────────────────────────────────────────────────
async function trackAnalytics(env, score, isError) {
  if (!env?.SIGMA_ANALYTICS) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const total = parseInt(await env.SIGMA_ANALYTICS.get('total') || '0') + 1;
    const daily = parseInt(await env.SIGMA_ANALYTICS.get(`day:${today}`) || '0') + 1;
    const scoreSum = parseInt(await env.SIGMA_ANALYTICS.get('score_sum') || '0') + (score || 0);
    const errors = parseInt(await env.SIGMA_ANALYTICS.get('errors') || '0') + (isError ? 1 : 0);

    await Promise.all([
      env.SIGMA_ANALYTICS.put('total', String(total)),
      env.SIGMA_ANALYTICS.put(`day:${today}`, String(daily)),
      env.SIGMA_ANALYTICS.put('score_sum', String(scoreSum)),
      env.SIGMA_ANALYTICS.put('errors', String(errors)),
    ]);
  } catch { /* analytics should never block the request */ }
}

// ── Helper: nano ID ──────────────────────────────────────────────────
function nanoid(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) result += chars[bytes[i] % chars.length];
  return result;
}

// ── Main handler ─────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Rate limit check
  if (!checkRateLimit(ip)) {
    return json({
      error: true,
      code: 'RATE_LIMITED',
      message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
    }, 429);
  }

  let idea;
  try {
    const body = await request.json();
    idea = body.idea;
  } catch {
    return json({ error: true, code: 'INVALID_JSON', message: 'JSON 파싱 오류입니다.' }, 400);
  }

  if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
    return json({
      error: true,
      code: 'INPUT_TOO_SHORT',
      message: '아이디어가 너무 짧습니다. 최소 10자 이상 입력하세요.',
    }, 400);
  }

  if (idea.length > MAX_INPUT_CHARS) {
    idea = idea.slice(0, MAX_INPUT_CHARS);
  }

  // Check cache
  let cacheKey = null;
  if (env?.SIGMA_CACHE) {
    try {
      cacheKey = await cipherHash(idea.trim().toLowerCase());
      const cached = await env.SIGMA_CACHE.get(cacheKey);
      if (cached) {
        await trackAnalytics(env, JSON.parse(cached).overall_score || 0, false);
        return json(JSON.parse(cached));
      }
    } catch { /* cache miss — proceed */ }
  }

  // API key
  const apiKey = env?.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return json({
      error: true,
      code: 'API_KEY_MISSING',
      message: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
    }, 500);
  }

  // Call DeepSeek
  let response;
  try {
    response = await fetchWithRetry('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `다음 창업 아이디어를 분석하세요:\n\n${idea}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });
  } catch (e) {
    await trackAnalytics(env, 0, true);
    return json({
      error: true,
      code: e.message === 'UPSTREAM_TIMEOUT' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
      message: e.message === 'UPSTREAM_TIMEOUT'
        ? 'AI 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
        : 'AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
    }, 502);
  }

  if (!response.ok) {
    await trackAnalytics(env, 0, true);
    const statusCode = response.status === 429 ? 429 : 502;
    return json({
      error: true,
      code: response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR',
      message: `AI 서비스 오류 (${response.status}). 잠시 후 다시 시도해주세요.`,
      retryable: true,
    }, statusCode);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    await trackAnalytics(env, 0, true);
    return json({
      error: true,
      code: 'EMPTY_RESPONSE',
      message: 'AI 서비스가 빈 응답을 반환했습니다. 다시 시도해주세요.',
      retryable: true,
    }, 502);
  }

  // Parse response
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      await trackAnalytics(env, 0, true);
      return json({
        error: true,
        code: 'PARSE_ERROR',
        message: 'AI 응답을 해석할 수 없습니다.',
        retryable: true,
      }, 502);
    }
  }

  // Validate structure
  if (!parsed.axes || !Array.isArray(parsed.axes)) {
    await trackAnalytics(env, 0, true);
    return json({
      error: true,
      code: 'INVALID_STRUCTURE',
      message: 'AI 응답 구조가 올바르지 않습니다.',
      retryable: true,
    }, 502);
  }

  // Ensure 7 axes
  if (parsed.axes.length !== 7) {
    if (parsed.axes.length > 7) parsed.axes = parsed.axes.slice(0, 7);
    else {
      while (parsed.axes.length < 7) {
        parsed.axes.push({
          name: AXES[parsed.axes.length].name,
          question: AXES[parsed.axes.length].question,
          score: 50,
          analysis: '분석 불가',
        });
      }
    }
  }

  // Store in cache
  if (env?.SIGMA_CACHE && cacheKey) {
    try {
      await env.SIGMA_CACHE.put(cacheKey, JSON.stringify(parsed), {
        expirationTtl: CACHE_TTL_SECONDS,
      });
    } catch { /* non-blocking */ }
  }

  // Generate shareable report ID and store
  if (env?.SIGMA_REPORTS) {
    try {
      const reportId = nanoid(8);
      const report = {
        idea: idea.slice(0, 500),
        result: parsed,
        reportId,
        createdAt: new Date().toISOString(),
      };
      await env.SIGMA_REPORTS.put(`report:${reportId}`, JSON.stringify(report), {
        expirationTtl: REPORT_TTL_SECONDS,
      });
      parsed.reportId = reportId;
    } catch { /* non-blocking */ }
  }

  await trackAnalytics(env, parsed.overall_score || 0, false);

  return json(parsed);
}

// ── Report retrieval ─────────────────────────────────────────────────
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get('report');

  if (reportId && env?.SIGMA_REPORTS) {
    try {
      const raw = await env.SIGMA_REPORTS.get(`report:${reportId}`);
      if (raw) return json(JSON.parse(raw));
    } catch { /* not found */ }
    return json({ error: true, code: 'NOT_FOUND', message: '리포트를 찾을 수 없습니다.' }, 404);
  }

  // Analytics summary (admin-only stub — expand later)
  if (url.searchParams.get('analytics') && env?.SIGMA_ANALYTICS) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [total, daily, scoreSum, errors] = await Promise.all([
        env.SIGMA_ANALYTICS.get('total'),
        env.SIGMA_ANALYTICS.get(`day:${today}`),
        env.SIGMA_ANALYTICS.get('score_sum'),
        env.SIGMA_ANALYTICS.get('errors'),
      ]);
      return json({
        total: parseInt(total || '0'),
        today: parseInt(daily || '0'),
        avgScore: total ? Math.round(parseInt(scoreSum || '0') / parseInt(total)) : 0,
        errors: parseInt(errors || '0'),
      });
    } catch { /* fall through */ }
  }

  return json({ ok: true, version: '2.1' });
}

// ── CORS preflight ───────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, {
    headers: securityHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }),
  });
}

// ── JSON response helper ─────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: securityHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }),
  });
}

// ── Security headers ─────────────────────────────────────────────────
function securityHeaders(extra = {}) {
  return {
    ...extra,
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}
