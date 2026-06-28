# SIGMA Validator — CTO Technical Audit

**Date:** 2026-06-29 KST  
**Auditor:** CTO (architecture review)  
**Scope:** Full codebase — `functions/api/evaluate.js`, `public/index.html`, `wrangler.toml`, `.github/workflows/deploy.yml`, `README.md`

---

## 1. Architecture Inventory

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Single HTML file (~1,200 lines) | Vanilla JS, no framework, no build step |
| **CSS** | Inline `<style>` block, custom properties | No Tailwind/purge; hand-crafted design system |
| **Client state** | `localStorage` | Draft persistence + 8-item history ring buffer |
| **Backend** | Single Cloudflare Pages Function | `functions/api/evaluate.js` — one POST endpoint |
| **AI provider** | DeepSeek Chat API (`deepseek-chat`) | `temperature=0.3`, `max_tokens=2000`, JSON mode |
| **Secrets** | `wrangler pages secret put DEEPSEEK_API_KEY` | Dead-code fallback reads local `.env` via `fs/promises` (won't work in Workers) |
| **Deployment** | GitHub Actions → `cloudflare/pages-action@v1` | Push-to-deploy on `main` |
| **Hosting** | Cloudflare Pages | `sigma-validator.pages.dev` |
| **Database** | None | All persistence is client-side `localStorage` |
| **Analytics** | None | Zero observability |
| **Auth** | None | Open access |

### Request Flow

```
User types idea → POST /api/evaluate → Cloudflare Pages Function
  → DeepSeek API (chat/completions)
  → Parse JSON response → Validate 7 axes → Return to client
  → Client renders radar chart, axes, slops, decision panels
  → localStorage saves history (ring buffer, max 8)
```

### DeepSeek API Call (critical path)

```js
// functions/api/evaluate.js lines 60-72
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [...],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  }),
});
```

Single fetch. No retries. No timeout. No streaming.

---

## 2. Strengths

| Strength | Why it matters |
|---|---|
| **Zero-build frontend** | No webpack/vite/esbuild. Edits ship instantly. This is a competitive advantage for a 1-person project. |
| **Single Cloudflare Pages Function** | No routing, no middleware, no framework overhead. Cold starts are fast (~50-100ms). Free tier covers substantial traffic. |
| **CORS headers correct** | `Access-Control-Allow-Origin: *` on both POST and OPTIONS. Won't break cross-origin embeds later. |
| **JSON mode on DeepSeek** | `response_format: { type: 'json_object' }` — prevents markdown wrapping, reducing parse failures. |
| **Client-side resilience** | `localStorage` draft survives refreshes. History ring buffer works offline. The app is a PWA candidate. |
| **Good UX design** | Command palette (⌘K), keyboard shortcuts (/ to focus, ⌘↩ to submit), animations, responsive grid. |
| **Minimal dependencies** | Zero npm packages for production. No supply-chain attack surface. |
| **GitHub Actions deployment** | Push-to-deploy is correct for this stage. No manual wrangler steps. |

---

## 3. Weaknesses & Risks

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| **C1** | No retry logic on DeepSeek API | `evaluate.js:60` | Any transient error (429, 503, DNS, timeout) fails the entire request. User sees "Validation failed" and leaves. |
| **C2** | No rate limiting | Entire function | Anyone can POST in a loop and burn API credits. No per-IP or global throttle. |
| **C3** | `getApiKey()` fallback is dead code | `evaluate.js:105-114` | `import('fs/promises')` fails in Cloudflare Workers runtime. The function silently returns `null`, then returns HTTP 500. If `env.DEEPSEEK_API_KEY` is ever unset, the fallback does nothing. This is a silent production risk. |

### High

| # | Issue | Location | Impact |
|---|---|---|---|
| **H1** | No input length cap | `evaluate.js:49` (only `>10` char check) | A 10,000-character idea burns ~2,500 input tokens per call at DeepSeek's pricing. |
| **H2** | No response caching | Entire function | Identical idea re-submitted = new paid API call. Common behavior in validation tools (user tweaks one word, resubmits). |
| **H3** | No observability | Entire system | Zero metrics. Cannot answer: "how many evaluations today?", "what's the error rate?", "what's the average score?" |
| **H4** | No shareable report URLs | `index.html` | Reports live only in `localStorage` of one browser. No way to send a report to a co-founder or tweet it. This is the #1 growth blocker per CMO report. |
| **H5** | No CSP / security headers | Response | No `Content-Security-Policy`, `X-Content-Type-Options`, or `X-Frame-Options`. Low risk for a static site but easy to fix. |

### Medium

| # | Issue | Location | Impact |
|---|---|---|---|
| **M1** | Mono-file frontend | `index.html` | ~1,200 lines in one file. Hard to maintain, impossible to test. Splitting into modules would require a build step or ES modules served from Pages. |
| **M2** | No streaming | `evaluate.js:60, index.html` | DeepSeek supports SSE streaming. User waits 8-25 seconds for full response with no progress indication beyond a CSS animation. |
| **M3** | Error messages leak internals | `evaluate.js:94` | `return json({ error: e.message }, 500)` — can expose stack traces in production. |
| **M4** | History limited to 8 | `index.html:saveHistory()` | localStorage limit (~5MB) means this is fine, but no server-side history means lost reports. |
| **M5** | No email capture | Entire system | CMO report calls this out. No way to notify users of features or build a launch list. |

### Low

| # | Issue | Location |
|---|---|---|
| **L1** | `getApiKey()` regex is brittle | `evaluate.js:109` — `env.match(/DEEPSEEK_API_KEY=(.+)/)` — grabs everything after `=` including trailing whitespace/newlines |
| **L2** | Axis padding uses hardcoded fallback names | `evaluate.js:83-91` — pads missing axes with "분석 불가" and score 50 |
| **L3** | No TypeScript | Entire codebase — JS only |
| **L4** | No automated tests | Zero test coverage |

---

## 4. DeepSeek API Robustness Analysis

### Current state

```js
// Single fetch, no retry, no timeout, no fallback
const response = await fetch('https://api.deepseek.com/chat/completions', { ... });
if (!response.ok) {
  return json({ error: `DeepSeek API 오류: ${response.status}` }, 500);
}
```

**What can go wrong:**

| Failure mode | Current behavior | Frequency (estimated) |
|---|---|---|
| 429 Rate Limit | HTTP 500 returned to user | Occasional (DeepSeek rate limits are per-minute) |
| 503 Service Unavailable | HTTP 500 returned to user | Rare but happens during maintenance |
| 502/504 Gateway Error | HTTP 500 returned to user | Rare (DeepSeek infra) |
| DNS resolution failure | `fetch` throws, caught by `catch(e)` | Extremely rare (CF edge) |
| Connection timeout | `fetch` hangs until CF worker timeout (30s) or OS timeout | Rare but catastrophic — user waits 30s |
| Empty `choices[0].message.content` | HTTP 500 "빈 응답" | Rare but observed with some models |
| Response is not valid JSON | Falls through to regex extraction | ~5-10% of responses (before JSON mode was added) |
| Response has wrong structure (e.g., 5 axes instead of 7) | Padded with fallback values | ~2-5% of responses |
| `response_format` not supported by model | Falls back to text, JSON parse fails | Only if model changes |
| Token limit exceeded (idea too long) | DeepSeek truncates response silently or errors | Moderate for long Korean text |

### Recommended improvements

#### 4.1 Retry with exponential backoff (P0)

```js
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) return response;

      // Only retry on 429, 5xx
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      return response; // Non-retryable error
    } catch (e) {
      if (attempt < maxRetries && e.name !== 'AbortError') {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
}
```

#### 4.2 Timeout (P0)

Add `AbortController` with 25-second timeout. DeepSeek typically responds in 5-15 seconds. 25s gives headroom for retries without hitting the CF Worker 30-second limit.

#### 4.3 Structured error codes (P1)

Instead of `{ error: "message" }`, return:

```json
{
  "error": true,
  "code": "UPSTREAM_TIMEOUT",
  "message": "The AI service is taking too long. Please try again.",
  "retryable": true
}
```

Error codes: `INVALID_INPUT`, `RATE_LIMITED`, `UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT`, `PARSE_ERROR`, `API_KEY_MISSING`.

#### 4.4 Fallback model (P2 — future)

If `deepseek-chat` returns persistent 5xx, fall back to `deepseek-chat` with `temperature=0.7` as a last resort, or return a graceful "service degraded" response.

#### 4.5 Streaming (P2)

DeepSeek supports `stream: true`. For the client, this would mean rendering axes as they arrive instead of waiting for all 7. Requires:
- Server: `response_format` with streaming (may conflict — need to check)
- Client: `EventSource` or `fetch` with `ReadableStream`

**Verdict on streaming:** Hold for Week 3-4. JSON mode + streaming may conflict (some providers don't support both). The UX improvement is real but the implementation is non-trivial.

---

## 5. Top 7 Technical Improvements (Prioritized by Impact/Effort)

### #1 — Retry + Timeout for DeepSeek API
**Impact:** Critical | **Effort:** ~30 min | **Risk reduction:** Eliminates ~80% of transient failures

- Add `fetchWithRetry` wrapper (3 attempts, exponential backoff with jitter)
- Add 25-second `AbortController` timeout
- Return structured error codes
- **Ship in:** 1 hour with testing

### #2 — Rate Limiting
**Impact:** High | **Effort:** ~2 hours | **Cost protection:** Prevents API credit burn

- Simplest approach: in-memory `Map<IP, {count, resetTime}>` with 10 requests/minute/IP
- Better approach: Cloudflare WAF rate limiting rule (GUI, no code)
- Best approach (for analytics too): Workers KV with IP-based counters
- **Ship in:** 1 day with KV setup

### #3 — Response Caching with Workers KV
**Impact:** High | **Effort:** ~3 hours | **Cost savings:** 20-40% fewer API calls

- Key: `SHA-256(idea.trim().toLowerCase())` with TTL of 24 hours
- Store full parsed response in KV
- Cache hit = instant response, zero API cost
- Common scenario: user iterates on the same idea (tweaks one word → new cache key, but exact resubmission → hit)
- **Ship in:** 1 day with KV binding

### #4 — Input Validation & Hardening
**Impact:** Medium | **Effort:** ~1 hour | **Cost + security**

- Max input: 3,000 characters (enforced server-side)
- Server-side truncation with warning in response
- Block obviously empty/malicious input
- Remove `getApiKey()` dead code (the `fs/promises` fallback — it cannot work in Workers, remove it to avoid confusion)
- **Ship in:** 1 hour

### #5 — Shareable Report URLs
**Impact:** High (growth) | **Effort:** ~5 hours | **Growth:** Enables social sharing, co-founder collaboration

- New function: `functions/api/report.js` or extend existing evaluate
- On evaluation: store result in KV with a short ID (nanoid, 8 chars)
- New route: `GET /r/:id` → render a minimal report page (or redirect to main page with data preloaded)
- `index.html`: Add "Get shareable link" button, copy URL to clipboard
- KV key: `report:{id}` → `{ idea, result, createdAt }`
- TTL: 30 days (generous for sharing, auto-cleanup)
- **Ship in:** 1 week (requires new function + KV + frontend changes)

### #6 — Basic Analytics with Workers KV
**Impact:** Medium | **Effort:** ~4 hours | **Observability:** Answers "is anyone using this?"

Track:
- Total evaluations (counter)
- Daily evaluations (date-keyed counter)
- Average score (running average)
- Error rate (error counter / total)
- Unique IPs (approximate, 24h window)

Store as KV counters:
- `analytics:total` → number
- `analytics:2026-06-29` → number
- `analytics:scores:sum` → number (for average)
- `analytics:errors:total` → number

Simple dashboard: `GET /api/analytics` (or just log to console in CF dashboard)
**Ship in:** 2-3 days with KV

### #7 — Security Headers
**Impact:** Low (but free) | **Effort:** ~15 min | **Security posture**

Add to all responses:
```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

**Ship in:** 30 minutes (add to `json()` helper + static asset headers in `wrangler.toml` or `_headers` file)

---

## 6. Four-Week Feature Roadmap

### Week 1: Reliability Sprint (June 29 – July 5)
**Theme:** "The validator never fails silently."

| Task | Effort | Priority |
|---|---|---|
| Add retry + timeout to DeepSeek API call | 1h | P0 |
| Add structured error codes (client can show better messages) | 30m | P0 |
| Add server-side input validation (max 3,000 chars) | 30m | P0 |
| Remove dead `getApiKey()` fallback code | 10m | P0 |
| Add basic rate limiting (in-memory or WAF) | 2h | P0 |
| Add security headers | 30m | P1 |
| Add response caching (KV) | 3h | P1 |
| Update frontend to show retry-aware error messages | 1h | P1 |

**Total:** ~9 hours of focused work.  
**Deliverable:** SIGMA v2.1 — robust API, zero silent failures.

### Week 2: Sharing Sprint (July 6 – July 12)
**Theme:** "A report that stays in your browser isn't a report."

| Task | Effort | Priority |
|---|---|---|
| Create Workers KV namespace for reports | 30m | P0 |
| Build `GET /r/:id` function — render stored report | 2h | P0 |
| Extend evaluate function to store reports in KV | 1h | P0 |
| Add "Copy shareable link" button to frontend | 1h | P0 |
| Style the shared report page (minimal, on-brand) | 2h | P0 |
| Add `/r/:id` redirect for social unfurling (og:title, og:description) | 1h | P1 |
| Test share flow end-to-end | 1h | P0 |

**Total:** ~8.5 hours.  
**Deliverable:** Every evaluation gets a permanent shareable URL. Users can tweet their Kill/Test/Scale verdicts.

### Week 3: Growth Foundation (July 13 – July 19)
**Theme:** "We can measure it, and we can reach the people who use it."

| Task | Effort | Priority |
|---|---|---|
| Add analytics counters in KV (evaluations, errors, scores) | 2h | P0 |
| Build simple `/api/analytics` endpoint (admin-only) | 1h | P0 |
| Add basic email capture (form + KV storage, no mail service yet) | 3h | P1 |
| Buy & connect custom domain (`sigmavalidator.com`) | 1h | P0 |
| Add `_headers` for custom domain CSP | 15m | P1 |
| Add Google Analytics or Cloudflare Web Analytics (zero-code) | 30m | P1 |

**Total:** ~8 hours.  
**Deliverable:** Custom domain live, analytics running, email list started.

### Week 4: Polish & Performance (July 20 – July 26)
**Theme:** "It should feel fast, even when it's slow."

| Task | Effort | Priority |
|---|---|---|
| Investigate DeepSeek streaming + JSON mode compatibility | 2h | P1 |
| If viable: implement streaming response (SSE → client-side progressive render) | 4h | P1 |
| Split `index.html` JS into modules (no build step — just `<script type="module">`) | 2h | P2 |
| Add "How was this?" feedback button (logs to analytics) | 1h | P2 |
| Performance audit: test on slow 3G, optimize render | 1h | P2 |
| Write 5 public teardown examples using SIGMA output | 2h | P2 |

**Total:** ~12 hours.  
**Deliverable:** Streaming responses (if viable), cleaner codebase, feedback loop live.

### Post-Week-4: Backlog (Not Scheduled)

| Idea | Why later |
|---|---|
| User accounts / auth | Needs database, adds complexity. Only when user base demands it. |
| "Submit for public teardown" | Needs moderation queue. High-touch. Wait for 100+ users. |
| Multi-language support | English market is bigger but needs prompt translation. Wait for traction. |
| A/B testing framework | No traffic to split yet. |
| Paid tier / API | Not until there's clear value demonstrated. |
| PWA (offline mode with service worker) | Useful for indie hackers on the go. Low priority until shareable URLs are done. |
| D1 database for history | KV is enough for reports. D1 adds SQL complexity. Wait until analytics outgrow KV. |

---

## 7. Additional Technical Notes

### 7.1 The `getApiKey()` Problem

```js
// functions/api/evaluate.js:105-114
async function getApiKey() {
  try {
    const fs = await import('fs/promises');  // ❌ Cannot work in Workers
    const env = await fs.readFile('/Users/pyu/.hermes/.env', 'utf-8');
    const match = env.match(/DEEPSEEK_API_KEY=(.+)/);
    return match?.[1]?.trim();
  } catch {
    return null;
  }
}
```

This is dead code in production. `import('fs/promises')` throws in the Cloudflare Workers runtime (no Node.js `fs` module). The `catch` block returns `null`. If `env.DEEPSEEK_API_KEY` is ever unset, the function will silently fail with HTTP 500 and the message "API 키가 설정되지 않았습니다."

**Fix:** Remove this function entirely. The only supported path is `env.DEEPSEEK_API_KEY` from Cloudflare Pages secrets. Add a startup check: if the env var is missing, log a clear error.

### 7.2 localStorage Schema

Current schema:
```json
[
  {
    "score": 72,
    "summary": "...",
    "idea": "...",
    "at": "2026-06-29T..."
  }
]
```

No versioning. If the schema changes, old data may break silently. Add a `version: 1` field.

### 7.3 Prompt Engineering Notes

The Korean system prompt is solid but could be improved:

- The `response_format: { type: 'json_object' }` parameter is doing most of the heavy lifting for JSON compliance
- Consider adding a fallback: "If the response is too long, prioritize axes over slops"
- The prompt doesn't instruct the model to handle edge cases (non-business ideas, jokes, test inputs) — this leads to hallucinated scores for obviously bad inputs

### 7.4 Cost Estimate

At DeepSeek's current pricing (approximately):
- Input: ~$0.14/1M tokens
- Output: ~$0.28/1M tokens
- Per evaluation: ~1,000 input tokens (system prompt + idea) + ~500 output tokens = ~$0.00028

With caching: 30% hit rate = ~30% cost reduction.  
With rate limiting: prevents abuse but doesn't change per-user cost.  
At 1,000 evaluations/day: ~$0.28/day = ~$8.40/month. Very sustainable.

### 7.5 Workers KV Cost Note

Cloudflare Workers KV (free tier):
- 100,000 reads/day
- 1,000 writes/day
- 1 GB stored

At 1,000 evaluations/day with caching: well within free tier.  
Reports stored: 1,000 writes/day = borderline. Shareable reports would push writes past free tier quickly at scale. At $0.50/million writes, this is negligible even at 10x scale.

---

## 8. Decision Summary

| Decision | Recommendation | Rationale |
|---|---|---|
| **Add retry logic?** | Yes, P0 — ship this week | Single biggest reliability win. 30 minutes of work. |
| **Add rate limiting?** | Yes, P0 — ship this week | Protects API credits. Use Cloudflare WAF for instant, KV for better. |
| **Add caching?** | Yes, P1 — ship Week 1 | 30% cost reduction for near-zero effort with KV. |
| **Shareable URLs?** | Yes, P0 — ship Week 2 | #1 growth feature. CMO report is correct. |
| **Streaming?** | P2 — investigate Week 4 | High UX value but conflicts with JSON mode. Validate first. |
| **Email capture?** | P1 — ship Week 3 | Needed for launch list. Simple KV storage, no mail service yet. |
| **Framework migration?** | No — not yet | Single HTML file is a feature, not a bug. Revisit at 5,000+ lines. |
| **TypeScript?** | No — not yet | JS with JSDoc is enough. TS adds build step friction for a solo project. |
| **Database?** | KV is enough | Workers KV covers caching, reports, analytics, and email. D1 is overkill for now. |
| **Custom domain?** | Yes — buy sigmavalidator.com now | CMO recommendation is sound. Connect in Week 3 after sharing is stable. |

---

## 9. Architecture North Star (6-Month Vision)

```
┌──────────────────────────────────────────────────┐
│                   CDN / Edge                      │
│  Cloudflare Pages (static + functions)            │
├──────────────────────────────────────────────────┤
│  public/                                         │
│  ├── index.html          (minimal shell)         │
│  ├── app.js              (ES module, split)      │
│  └── style.css           (extracted, cached)     │
├──────────────────────────────────────────────────┤
│  functions/api/                                  │
│  ├── evaluate.js         (validate + cache)      │
│  ├── report.js            (shareable reports)    │
│  └── analytics.js         (usage counters)       │
├──────────────────────────────────────────────────┤
│  Workers KV                                       │
│  ├── cache:{hash}         (response cache, 24h)  │
│  ├── report:{id}          (shareable, 30d)       │
│  ├── analytics:*          (counters)             │
│  └── emails:*             (captured emails)      │
├──────────────────────────────────────────────────┤
│  External                                         │
│  ├── DeepSeek API          (primary)             │
│  └── (future) fallback LLM (if DeepSeek down)   │
└──────────────────────────────────────────────────┘
```

**Principles:**
1. No build step unless necessary
2. KV-first, not DB-first
3. Every API call is cached when possible
4. Every report has a URL
5. Every error tells the user what to do next

---

*End of audit. Recommendations are ordered by Week 1 → Week 4 priority. Start with retry logic today.*
