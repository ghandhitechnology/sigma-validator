# Frontend Humanization & Redesign — SIGMA

Date: 2026-07-22
Status: approved-by-user-request (auto mode; user directive: "humanize the design, improve the frontend significantly, make it production-grade")

## Problem

The current site works but looks and reads like it was generated, not designed:

1. **Fonts fight each other.** Three families are mixed with no system: a Latin-only
   serif (Iowan Old Style) for headlines/scores, system sans for body, monospace for
   score ranges. On the Korean page the serif covers only digits/Latin, so a single
   headline renders in two unrelated fonts.
2. **AI-flavored copy.** Slogan kickers ("그럴듯한 말은 증거가 아닙니다. 데이터로 보여주세요."),
   middot trust badges ("묵료 · 회원가입 없음 · …" / "Free · No signup · …"), and fake
   quantification ("0 근거 신호 · 0 위험 신호 · 초안 준비도") read as generated filler.
3. **Everything competes.** Kicker + H1 + lede + composer card + stat row + chips +
   trust line + how-it-works + score bands stack up above the fold, nearly all of it
   in bordered boxes. No visual priority, no footer, page ends abruptly.

## Constraints (sacred)

- `public/assets/app.js` — **no changes**. All element `id`s it queries must keep
  existing and keep their roles.
- `public/assets/locales/{ko,en}.js` — key structure unchanged; only string *values* change.
- `public/assets/locale-selector.js`, `functions/api/evaluate.js` — untouched.
- No build step stays no build step: plain HTML/CSS/JS, one external font stylesheet
  (Pretendard Variable via jsDelivr CDN) as the only new dependency.

## Design direction

A quiet, confident, single-purpose tool. One typeface, one accent color, one column.
The composer is the hero; everything else is subordinate. Copy reads like a person
who builds things wrote it — short, plain, specific.

### Typography (fixes the font fight at the root)

- **One family everywhere:** Pretendard Variable (covers Korean + Latin + numerals
  with one consistent voice), system sans fallback. Serif eliminated entirely.
- Mono stack only for the raw-JSON panel.
- Scale: H1 `clamp(30px, 5vw, 44px)`, weight 700, letter-spacing −0.02em,
  line-height 1.18 (Korean-safe). Body 15.5px / 1.65. Numbers use
  `font-variant-numeric: tabular-nums` instead of a separate mono font.

### Color

Warm paper base kept, temperature unified:

- bg `#FAF9F6`, surface `#FFFFFF`, surface-2 `#F4F2EC`
- ink `#1C1B17`, ink-2 `#44423B`, muted `#7A766B`
- lines as warm alpha black (`.09` / `.16`), not cool grays
- **one accent:** deep brass `#8C6D1F` + soft wash `#F2ECDA` (evolution of the
  current gold; the Σ seal keeps brand continuity)
- semantic status colors muted to one lightness family: kill `#B23B2E`,
  test `#A06E0B`, scale `#2F7A4E`
- heavy navy panel removed; primary buttons use ink, not navy — one theme, not two.

### Layout

- Single column, `.frame` max-width 880px (was 1080). Consistent at every section.
- Hero shrinks to: H1 + one plain sentence. Kicker deleted.
- Composer: quieter chips, bigger textarea (220px), actions row, **trust line deleted**.
  The `composer-meta` stat row (words/signals/risk/readiness) stays in the DOM
  (app.js writes to it — sacred) but is hidden via CSS.
- Explainer becomes a calm two-column block: numbered steps (no boxes) + score bands
  as simple rows with status dots.
- Results: score panel becomes a white card (ring + tabular number + verdict pill +
  summary + actions); radar beside it; panels as clean stacked sections.
- New quiet footer: privacy note + author credit (human touch), on all three pages.

### Motion & atmosphere

- Subtle staggered fade-up on intro + composer (CSS only, no JS).
- Button hover lift + press feedback, focus-visible rings, existing sweep loader kept.
- `prefers-reduced-motion` respected (already present, kept).

### Copy rewrite (both languages)

Principles: no slogans, no middot badge lists, no feature-bragging. Say what the
tool does in plain sentences. Representative changes:

| Where | Before | After (ko) |
|---|---|---|
| kicker | 그럴듯한 말은 증거가 아닙니다. 데이터로 보여주세요. | *(deleted)* |
| trust line | 묣료 · 회원가입 없음 · 아이디어는 이 브라우저에만 저장됩니다. | *(deleted; footer carries one plain sentence)* |
| footer | — | 입력한 내용은 이 브라우저에만 저장됩니다. · SIGMA — Andy Ha |
| verdict labels | 근거 확보 단계로 진행 / 추가 검증 필요 / 아이디어 재검토 필요 | 밀어붙여도 좋습니다 / 더 확인이 필요합니다 / 멈추는 편이 낫습니다 |
| radar title | 아이디어 평가 형태 | 영역별 균형 |
| weak spots | 논리가 흔들리는 지점 | 흔들리는 부분 |
| samples label | 예시로 시작하기: | 예시: |

English equivalents mirror the same voice ("Test your idea before you build it."
stays; lede becomes one plain sentence; verdict pills become "Good to push /
Needs more proof / Better to stop").

## Files changed

1. `public/assets/styles.css` — full rewrite (all-slop file; git history is the rollback).
2. `public/index.html` — selector page: same tokens, humanized note, footer.
3. `public/ko/index.html`, `public/en/index.html` — copy rewrite; delete kicker +
   trust line; add footer; add font stylesheet link. **No `id` removed, no element
   reordered.**
4. `public/assets/locales/ko.js`, `public/assets/locales/en.js` — string values only
   (run/loading button labels, verdict labels).
5. `docs/screenshot-home.png`, `docs/screenshot-report.png` — regenerated.

## Verification

- `node --check` on locale files.
- Serve `public/` locally; headless-Chrome screenshots of `/`, `/ko/`, `/en/`.
- Report view verified with a stubbed `/api/evaluate` response (mock fetch page,
  not committed) so skeleton → rendered report flow is exercised without an API key.
- Responsive spot-check at 390px.
- Keyboard flows intact by construction (no JS/markup-order changes).
