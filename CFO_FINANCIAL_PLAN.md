# SIGMA CFO Financial Plan

Date: 2026-06-29 KST  
Status: Pre-launch — zero users, zero revenue  
Prepared for: Founder review

---

## 1. Unit Economics: Cost Per Validation

### DeepSeek API Token Profile

| Component | Tokens (est.) | Cost Rate | Cost |
|---|---|---|---|
| System prompt (Korean, 7-axis + JSON schema) | ~800 input | $0.14/1M | $0.000112 |
| User idea (avg founder pitch, Korean) | ~300 input | $0.14/1M | $0.000042 |
| JSON response (7 axes + slops + summary) | ~1,500 output | $0.28/1M | $0.000420 |
| **Total per validation** | **~2,600 tokens** | — | **$0.000574** |

**Range:** $0.00048 (short idea) to $0.00078 (long idea + full 2,000-token output).

### Infrastructure Costs

| Line item | Cost | Notes |
|---|---|---|
| Cloudflare Pages hosting | $0/month | Free tier: 100k req/day, 1 build/min |
| Cloudflare Pages Functions | $0/month | 100k req/day included; SIGMA uses one POST endpoint |
| Domain (sigmavalidator.com) | ~$12/year | Standard .com renewal |
| GitHub source hosting | $0/month | Public repo, free Actions minutes |
| Analytics (Cloudflare Web Analytics) | $0/month | Included; privacy-first, no cookie banner needed |
| **Total fixed cost** | **$1/month** | Essentially just the domain |

### Key Ratios

- **1 dollar buys 1,742 validations**
- **10 dollars buys 17,422 validations** — more than any side project will ever need
- **Breakeven on a $9/mo subscription:** 15,679 calls/user/month — impossible to exceed
- **Marginal cost is effectively zero.** This is an almost pure-margin software product.

---

## 2. Monetization Model

### Philosophy

SIGMA is a side project, not a funded startup. The pricing should reflect that: cheap enough that no indie hacker thinks twice, high enough to filter out trolls and signal seriousness. The free tier exists for distribution — every free user is a potential evangelist. The paid tier converts power users.

### Pricing Tiers

#### Tier 0 — Free

| What you get | Limit |
|---|---|
| Validations per month | **5** |
| Seven-axis report | Full |
| Slop detection | Full |
| Kill/Test/Scale verdict | Full |
| Founder memo export | Full |
| Local archive | Last 8 reports |

**Purpose:** Acquisition. A founder validates their first idea, gets a brutally honest report, and either shares it or comes back with a revised idea. Five validations/month is enough for a serious founder evaluating one idea from multiple angles or testing a few variants. It is not enough for serial idea-spamming.

#### Tier 1 — Founder ($7/month or $59/year)

| What you get | Details |
|---|---|
| Validations per month | **50** |
| Everything in Free | Plus |
| Priority queue | Skip the line during peak load (future) |
| Extended report | Additional axis detail, deeper slop analysis |
| Batch compare | Validate up to 3 variants side-by-side |
| Export formats | Markdown, JSON, PDF (future) |

**Price point rationale:** $7 is the "one coffee" price. It undercuts the standard indie SaaS $9–$12 range just enough to feel like a no-brainer, but not so low that it signals junk. At 50 validations/month the API cost is $0.03 — a 99.6% margin.

**Annual discount ($59 = $4.92/month):** Locks in committed founders. The 30% discount is standard but meaningful. Annual subscribers have near-zero churn for a side project.

#### Tier 2 — Workbench ($19/month or $149/year)

| What you get | Details |
|---|---|
| Validations per month | **Unlimited** |
| Everything in Founder | Plus |
| Custom axes | Define your own evaluation criteria |
| Team sharing | Up to 3 seats, shared archive |
| Early access | New features before public rollout |
| Founder badge | Profile link on sigmavalidator.com (future) |

**Price point rationale:** $19 is "serious tool" territory without being enterprise-priced. Targets accelerators, startup clubs, and founders evaluating multiple ideas in parallel. Unlimited validations is the headline feature — even at 500 validations/month, the API cost is $0.29.

### What We Don't Charge For (Yet)

| Feature | Why free |
|---|---|
| Public report sharing | Distribution engine — every shared report is free marketing |
| Copy/paste founder memo | Core value prop; friction here kills word-of-mouth |
| Browser-based (no account required) | Reduces signup friction to zero; account comes later |
| Open source code | Builds trust with technical founders |

### When to Introduce Paid Tiers

Do **not** gate anything on day one. The sequencing:

1. **Phase 0 (now):** Everything free. Collect usage data. No Stripe integration.
2. **Phase 1 (100+ organic users, 20+ shared reports):** Introduce Free tier with 5/month limit. Existing users grandfathered for 30 days.
3. **Phase 2 (10+ paid conversions):** Add Stripe Checkout. Introduce Founder tier.
4. **Phase 3 (50+ paid users, clear power-user pattern):** Add Workbench tier.

**Why wait:** Premature monetization kills word-of-mouth in the indie hacker community. SIGMA's growth engine is "try it, get a brutal report, share it." If the first thing a visitor sees is a paywall, growth stalls before it starts.

### Payment Infrastructure

| Item | Provider | Cost |
|---|---|---|
| Payment processing | Stripe Checkout | 2.9% + $0.30 per transaction |
| Subscription management | Stripe Billing | Included in processing fee |
| Invoicing | Stripe Invoicing (future) | 0.4% per invoice |

On a $7/month subscription: Stripe takes $0.50 (2.9% of $7 = $0.20 + $0.30). Net revenue: $6.50. Still >99% margin after processing.

---

## 3. Revenue Scenarios

### Assumptions (common to all scenarios)

- **Launch date:** July 2026 (soft launch per CMO plan)
- **Free-to-paid conversion rate:** 3–5% (industry standard for freemium dev tools)
- **Average revenue per paying user (ARPU):** $7/month (Founder tier dominant)
- **Monthly churn (paid):** 5–8% (side projects have higher churn than enterprise SaaS)
- **All costs are effectively zero** — revenue ≈ profit

### Scenario A — Conservative: "Slow Burn"

**Story:** Launches quietly. A few dozen indie hackers try it. Some share reports. Growth is word-of-mouth only, no paid acquisition. The founder maintains it as a weekend project.

| Month | Free Users | Paying Users | MRR | Cumulative Revenue |
|---|---|---|---|---|
| 1 (Jul) | 30 | 0 | $0 | $0 |
| 2 (Aug) | 60 | 0 | $0 | $0 |
| 3 (Sep) | 100 | 3 | $21 | $21 |
| 4 (Oct) | 130 | 5 | $35 | $91 |
| 5 (Nov) | 160 | 7 | $49 | $189 |
| 6 (Dec) | 180 | 8 | $56 | $301 |
| 7 (Jan) | 200 | 9 | $63 | $427 |
| 8 (Feb) | 220 | 10 | $70 | $567 |
| 9 (Mar) | 240 | 11 | $77 | $721 |
| 10 (Apr) | 260 | 12 | $84 | $888 |
| 11 (May) | 280 | 13 | $91 | $1,069 |
| 12 (Jun) | 300 | 15 | $105 | $1,279 |

**6-month total: $301 | 12-month total: $1,279**  
**Annual API cost at 15 paying users × 20 calls/mo: $0.17**  
**Net profit: ~$1,267** (subtracting $12 domain)

### Scenario B — Moderate: "Indie Darling"

**Story:** A well-timed Show HN or Reddit post hits. A few influential indie hackers share their SIGMA reports. The "brutally honest" positioning resonates. Maybe a Korean startup community picks it up. 100–200 free signups per month after the initial spike.

| Month | Free Users | Paying Users | MRR | Cumulative Revenue |
|---|---|---|---|---|
| 1 (Jul) | 80 | 0 | $0 | $0 |
| 2 (Aug) | 200 | 5 | $35 | $35 |
| 3 (Sep) | 400 | 15 | $105 | $245 |
| 4 (Oct) | 600 | 25 | $175 | $595 |
| 5 (Nov) | 800 | 35 | $245 | $1,085 |
| 6 (Dec) | 1,000 | 50 | $350 | $1,785 |
| 7 (Jan) | 1,200 | 60 | $420 | $2,835 |
| 8 (Feb) | 1,400 | 70 | $490 | $4,035 |
| 9 (Mar) | 1,600 | 80 | $560 | $5,395 |
| 10 (Apr) | 1,800 | 90 | $630 | $6,895 |
| 11 (May) | 2,000 | 100 | $700 | $8,545 |
| 12 (Jun) | 2,200 | 110 | $770 | $10,345 |

**6-month total: $1,785 | 12-month total: $10,345**  
**Annual API cost at 110 paying users × 25 calls/mo: $1.58**  
**Net profit: ~$10,333**

### Scenario C — Ambitious: "Every Founder's First Stop"

**Story:** SIGMA becomes the default first step in the indie hacker playbook. "Validate with SIGMA before you write a line of code" becomes a meme. University entrepreneurship programs adopt it. An accelerator partners. A paid conversion loop forms: validate idea → share brutal report → someone else tries it → subscribes.

| Month | Free Users | Paying Users | MRR | Cumulative Revenue |
|---|---|---|---|---|
| 1 (Jul) | 150 | 0 | $0 | $0 |
| 2 (Aug) | 500 | 20 | $140 | $140 |
| 3 (Sep) | 1,200 | 60 | $420 | $980 |
| 4 (Oct) | 2,500 | 120 | $840 | $2,660 |
| 5 (Nov) | 4,000 | 180 | $1,260 | $5,300 |
| 6 (Dec) | 6,000 | 250 | $1,750 | $9,050 |
| 7 (Jan) | 8,000 | 320 | $2,240 | $13,810 |
| 8 (Feb) | 10,000 | 400 | $2,800 | $19,410 |
| 9 (Mar) | 12,000 | 480 | $3,360 | $25,770 |
| 10 (Apr) | 14,000 | 560 | $3,920 | $32,970 |
| 11 (May) | 16,000 | 640 | $4,480 | $41,090 |
| 12 (Jun) | 18,000 | 720 | $5,040 | $50,210 |

**6-month total: $9,050 | 12-month total: $50,210**  
**Annual API cost at 720 paying users × 30 calls/mo: $12.41**  
**Net profit: ~$50,198**

### Scenario Comparison at a Glance

| Metric | Conservative | Moderate | Ambitious |
|---|---|---|---|
| Free users at 6 months | 180 | 1,000 | 6,000 |
| Paying users at 6 months | 8 | 50 | 250 |
| 6-month revenue | $301 | $1,785 | $9,050 |
| Paying users at 12 months | 15 | 110 | 720 |
| 12-month revenue | $1,279 | $10,345 | $50,210 |
| 12-month API cost | $0.17 | $1.58 | $12.41 |
| 12-month net profit | $1,267 | $10,333 | $50,198 |
| Monthly time commitment | 2–4 hrs | 5–10 hrs | 15–25 hrs |

### Reality Check: What "Ambitious" Actually Requires

The ambitious scenario ($50K ARR) is not a passive outcome. It requires:

- Consistent content creation (1–2 posts/week on X, Reddit, Indie Hackers)
- At least one viral moment (Show HN front page, or major Korean community pickup)
- Product iteration based on user feedback (account system, shareable URLs, report improvements)
- Possibly a small ad budget ($50–100/month) to amplify organic traction
- 15–25 hours/month of founder attention

This is achievable for a dedicated side project but crosses into "second job" territory. The moderate scenario ($10K ARR) is more realistic for a weekend-maintained project.

---

## 4. Biggest Financial Risk & Hedges

### Risk: DeepSeek API Dependency (Critical)

**The threat:** SIGMA has a single-point-of-failure architecture. The entire product is one Cloudflare Pages Function that calls one API endpoint (`api.deepseek.com/chat/completions`). If DeepSeek:

1. **Raises prices 10×** — from $0.14/$0.28 per 1M tokens to $1.40/$2.80. Unit cost jumps from $0.0006 to $0.006 per call. Still cheap at small scale, but erodes the "near-zero cost" narrative and makes unlimited-tier pricing riskier.

2. **Deprecates `deepseek-chat` or changes the API** — breaking change requiring a code update and possibly prompt re-engineering.

3. **Restricts API access** — geo-blocking, capacity limits, or terms-of-service changes that exclude certain use cases.

4. **Experiences extended downtime** — SIGMA becomes a white screen.

**Probability:** Medium. DeepSeek is a Chinese company operating under both Chinese AI regulations and international pressure. Their API pricing is aggressively below market (OpenAI GPT-4o is ~10× more expensive). Sustaining those prices is not guaranteed.

**Impact if it happens:** Critical. SIGMA stops working entirely until a replacement model is integrated.

### Hedge Strategy

#### Short-term (now)

| Action | Cost | Timeline |
|---|---|---|
| Abstract the model call behind a single function signature | $0 (code) | Already done — `evaluate.js` is one file |
| Store the system prompt as a configurable constant, not hardcoded in logic | $0 (code) | 30 minutes of refactoring |
| Set DeepSeek API usage alerts in Cloudflare dashboard | $0 | 15 minutes |

#### Medium-term (before first paid user)

| Action | Cost | Timeline |
|---|---|---|
| **Add model fallback** — if DeepSeek fails, try a secondary provider | $0 (code) | 2–3 hours |
| Test with alternative models: | | |
| — DeepSeek V3 (cheaper, may be sufficient for structured JSON) | $0.07/$0.14 per 1M | Test now |
| — OpenAI GPT-4o-mini ($0.15/$0.60 per 1M) | ~3× current cost | Test now |
| — Anthropic Claude Haiku ($0.25/$1.25 per 1M) | ~5× current cost | Test now |
| — Open-source via Groq (Llama 4, free tier available) | $0 | Test now |
| Build a `MODEL_PROVIDER` env var to switch providers without redeploy | $0 (code) | 1 hour |
| **Pre-buy DeepSeek credits** — lock in current pricing for 12 months | ~$20–50 | When first paid user signs up |

#### Long-term (if product grows)

| Action | Cost | Rationale |
|---|---|---|
| Multi-model router — try cheapest model first, escalate if quality drops | $0 (code) | Quality arbitrage |
| Evaluate running a local model (Llama 4, Qwen 3) for the structured JSON task | $0 (code, if free inference available) | Eliminates API dependency for basic cases |
| Monitor response quality automatically — compare scores across models, flag drift | $0 (code) | Prevents silent quality degradation |

### Secondary Risk: Cloudflare Pages Function Timeout

Cloudflare Pages Functions have a **10-second CPU time limit** on the free tier. DeepSeek API calls typically respond in 2–5 seconds, but under load or with long ideas (high max_tokens), the function could time out.

**Hedge:** Set a shorter `max_tokens` (current 2000 is generous; 1200 may be sufficient). Monitor latency. If timeout becomes an issue, upgrade to Cloudflare Workers Paid ($5/month for 10M requests, no CPU limit change but faster cold starts).

### Tertiary Risk: Competitor Replication

SIGMA is technically simple: one HTML file, one API function, one LLM prompt. Anyone can clone the repo and launch a copy in 30 minutes.

**This is not a financial risk — it's a moat question.** The hedge is non-technical:

- **Brand:** "SIGMA" + "Kill/Test/Scale" as a recognizable decision framework
- **Report quality:** The prompt engineering and tone are the product; clones will feel cheap
- **Community:** Shared reports, public teardowns, and founder testimonials create switching cost
- **Distribution:** First-mover in the "brutally honest validator" niche

**Financial implication:** Do not spend money on code defensibility. Spend time on content and community.

---

## 5. Cash Flow & Runway

### Current Position

| Item | Amount |
|---|---|
| Cash on hand (founder) | Assumed: personal funds sufficient for $100/year |
| Monthly burn rate | $0 (excluding domain, which is $12/year) |
| DeepSeek API credits | $0 currently — needs $10–20 initial deposit |
| Runway | Infinite — no meaningful costs |

### Capital Requirements

**SIGMA does not need funding.** It needs users.

If the ambitious scenario materializes ($50K ARR), the only cost increase would be:

- Stripe fees: ~$1,500/year at $50K volume
- Possible Cloudflare Workers Paid: $60/year
- Domain renewal: $12/year
- DeepSeek API: ~$150/year at 720 users × 30 calls/month

Total annual cost at $50K ARR: **~$1,722**, or 3.4% of revenue. Margin: **96.6%**.

This is an extraordinarily capital-efficient business. The constraint is not money — it's attention, distribution, and product quality.

### When to Consider Funding

Only if the founder wants to:

1. **Quit day job and go full-time** — requires ~$3,000–5,000/month personal runway
2. **Hire a part-time developer** — $2,000–4,000/month
3. **Run paid acquisition at scale** — $500–2,000/month ad spend

At that point, SIGMA would have proven product-market fit and the conversation shifts from "side project" to "startup." But this is a 12–18 month horizon, not a now-problem.

---

## 6. Recommended First Financial Actions

### This Week (Cost: $0)

- [ ] Open a DeepSeek API account and deposit $10 (≈17,000 validations)
- [ ] Set the API key as a Cloudflare Pages secret
- [ ] Add a usage counter (free, stored in localStorage) to track daily validations
- [ ] Buy `sigmavalidator.com` (~$12)

### This Month (Cost: $0–12)

- [ ] Add Cloudflare Web Analytics (free, one line of JS)
- [ ] Set up a Stripe account (no cost until first transaction)
- [ ] Build the "5 free validations this month" counter in the UI (no Stripe integration yet — just a localStorage counter and a "coming soon" upgrade button)
- [ ] Draft the pricing page content (`/pricing`) as a static HTML section

### Before First Paid User (Cost: $0–50)

- [ ] Implement Stripe Checkout for Founder tier ($7/month + $59/year)
- [ ] Set up Stripe Customer Portal for self-service cancellation
- [ ] Add model fallback (DeepSeek → GPT-4o-mini)
- [ ] Pre-buy $50 DeepSeek credits to lock in pricing
- [ ] Write a "SIGMA is now paid (here's why)" launch post

### After 10 Paying Users

- [ ] Review churn data — if <5% monthly, pricing is right; if >10%, survey why
- [ ] Consider adding Workbench tier ($19/month)
- [ ] Evaluate annual plan uptake — if <20% of paid users, increase discount or add annual-only features

---

## 7. CFO Verdict

### The Numbers

| Metric | Value |
|---|---|
| Cost per validation | **$0.00057** |
| Gross margin | **~99.7%** at any scale |
| Monthly fixed cost | **$1** (domain amortized) |
| Breakeven users (at $7/mo) | **1 paying user** |
| Capital required | **$0** (founder's DeepSeek credits and domain purchase) |
| Best-case 12-month profit | **$50,000** (ambitious) |
| Realistic 12-month profit | **$10,000** (moderate) |
| Worst-case 12-month loss | **$62** (domain + DeepSeek credits, no users) |

### The Strategic Truth

SIGMA's unit economics are absurdly good — among the best of any SaaS product. The API cost per validation is so low (1/20th of a cent) that the business has effectively zero marginal cost. Even if DeepSeek raises prices 10×, the unit cost would still be under 1 cent per call.

**This is not a business constrained by costs. It is a business constrained by distribution.**

The financial plan is therefore simple: spend nothing on infrastructure, charge a price that feels trivial to the target audience ($7/month), and invest every available hour into content, community, and word-of-mouth. The product will make money the moment the first person subscribes.

**Recommendation:** Launch free. Prove people care. Gate when there's evidence of demand. Do not over-engineer the monetization before there are users to monetize.

---

*This is a living document. Revise after 30 days of live usage with real conversion data.*
