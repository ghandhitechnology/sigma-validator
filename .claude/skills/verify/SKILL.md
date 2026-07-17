---
name: verify
description: Runtime verification for SIGMA locale routes, browser persistence, and Pages API behavior.
---

# Verify SIGMA

1. Prefer `npx wrangler pages dev public --port 8788` when Wrangler is already installed. Do not download it without approval.
2. If Wrangler is unavailable, run `node .claude/skills/verify/server.mjs`; this dependency-free harness serves `public/` and routes `/api/evaluate` through the actual Pages handler with empty bindings. For a deterministic successful evaluation path, use `SIGMA_VERIFY_MOCK_AI=1 PORT=8789 node .claude/skills/verify/server.mjs`; the mock is verification-only and still exercises the real request, prompt selection, normalization, cache, and report code through HTTP.
3. Drive these browser flows in a clean profile:
   - `/` shows two language choices with no `sigmaLocale`.
   - Select Korean, enter a draft, switch to English, and confirm the draft and preference survive.
   - Revisit `/` and confirm it redirects to the saved locale.
   - Clear the preference and confirm `/` shows the selector again.
   - Submit a valid-length idea on both locale routes; without a key, each page should show its localized `API_KEY_MISSING` state.
   - Resize to 390×844 and confirm `document.documentElement.scrollWidth <= innerWidth`.
4. Capture one selector screenshot and one mobile workbench screenshot. Inspect console/network output; a 500 for the deliberate missing-key probe is expected, but CSP violations and failed static assets are not.
5. At the HTTP surface, capture `/api/evaluate` health, English/Korean short-input responses, an English malformed-JSON response, and static security headers.

The fallback harness calls no external AI. Use its deterministic mock to verify the success contract; a real model judgment still requires the configured Cloudflare environment and should be reported as unexercised when credentials are unavailable.
