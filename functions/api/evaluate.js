// SIGMA Evaluation API — Cloudflare Pages Function
// 7-axis startup idea validation via DeepSeek V4

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
- type: 함정 유형 (예: "순환 논리", "시장 과大盘", "기술 과신", "수익 모델 부재", "경쟁 망각")
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

export async function onRequestPost({ request, env }) {
  try {
    const { idea } = await request.json();
    if (!idea || idea.trim().length < 10) {
      return json({ error: '아이디어가 너무 짧습니다.' }, 400);
    }

    const apiKey = env?.DEEPSEEK_API_KEY || (await getApiKey());
    if (!apiKey) {
      return json({ error: 'API 키가 설정되지 않았습니다.' }, 500);
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
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

    if (!response.ok) {
      const errText = await response.text();
      return json({ error: `DeepSeek API 오류: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return json({ error: '빈 응답을 받았습니다.' }, 500);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return json({ error: 'JSON 파싱 실패', raw: content }, 500);
      }
    }

    // Validate structure
    if (!parsed.axes || !Array.isArray(parsed.axes)) {
      return json({ error: '응답 구조 오류', raw: content }, 500);
    }

    // Ensure 7 axes
    if (parsed.axes.length !== 7) {
      // Pad or trim
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

    return json(parsed);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Fallback: read from env file if not in CF env
async function getApiKey() {
  try {
    const fs = await import('fs/promises');
    const env = await fs.readFile('/Users/pyu/.hermes/.env', 'utf-8');
    const match = env.match(/DEEPSEEK_API_KEY=(.+)/);
    return match?.[1]?.trim();
  } catch {
    return null;
  }
}