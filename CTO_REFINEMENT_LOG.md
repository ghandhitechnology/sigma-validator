# CTO Refinement Sprint Log — Round 2

**Date:** 2026-07-01 KST (round 2)  
**Sprint:** Product refinement — verdict consistency + history UX  
**Base:** Frontend v2.2 (skeleton loading, share links, error UX from round 1)

---

## Changes Made

### 1. Verdict Badge Now Mirrors Actual Decision (bug fix)

**Problem:** The score-ring verdict badge used its own parallel threshold system that didn't match the Kill/Test/Scale decision logic. A case scoring 72 with weak demand (60/100) would show "Proceed to evidence" in the badge but "TEST" in the decision panel. Two different verdicts on the same page — confusing and wrong.

The old badge logic:
```js
// Independent thresholds — disconnected from decisionFor()
let verdict = score>=72 ? 'Proceed to evidence' : score>=48 ? 'Run harder tests' : 'Reject or rebuild';
```

The decision logic (`decisionFor`):
```js
// Uses score + axis sub-scores + slop count
if (score>=72 && demand>=65 && slops<=1) return 'scale';
if (score<45 || diff<40) return 'kill';
return 'test';
```

These diverged constantly. A score-72, weak-demand case got "Proceed to evidence" in the ring but "TEST" in the panel.

**Fix:** The verdict badge now calls `decisionFor(data)` directly — same function the decision panel uses. Labels are:
- `scale` → "Proceed to evidence"
- `test` → "Test further"
- `kill` → "Reconsider the case"

The score ring badge and the decision panel now speak with one voice.

---

### 2. History Items Show Verdict by Color

**Problem:** The local archive listed evaluations as bare numbers — "72", "48", "31". No way to tell at a glance which were wins, which were kills, which needed more testing. You had to click each one and re-run to remember.

**Fix:** 
- `saveHistory()` now stores the `decisionFor()` verdict alongside the score (`verdict: "scale"|"test"|"kill"`)
- Added `version: 1` to history schema for future migration safety
- `renderHistory()` color-codes the score number:
  - **Green** (`var(--green)`) = SCALE — this one had legs
  - **Amber** (`var(--amber)`) = TEST — needs more evidence  
  - **Red** (`var(--red)`) = KILL — reconsider the premise
- Backward-compatible: old history items without `verdict` default to amber (test)

**Result:** You can scan the archive in half a second and know which ideas survived scrutiny.

---

### 3. "Copy Link" Added to Command Palette (⌘K)

**Problem:** The share link feature (added in round 1) was only accessible via the "Copy link" button in the results sidebar. Keyboard users and command-palette users couldn't discover it.

**Fix:** Added `link` command to `COMMANDS` array — triggers `copyShareLink()`. Type ⌘K, type "link", hit Enter.

---

## What Was Not Changed

- **No new dependencies.** Single HTML file remains.
- **No API key or secret changes.**
- **No breaking changes.** Old history items without `verdict` field render fine (default to amber).
- **No backend changes.** Backend v2.1 is stable.

---

## Cumulative Improvement Summary (Rounds 1 + 2)

| Round | Change | Type |
|---|---|---|
| 1 | Loading skeleton in results area | UX |
| 1 | Shareable report link button | Feature |
| 1 | Error display in results area (not just near button) | UX |
| 1 | Structured error messages by code (RATE_LIMITED, UPSTREAM_TIMEOUT) | Bug fix |
| 1 | Draft restoration toast on page load | UX |
| 2 | Verdict badge now mirrors actual Kill/Test/Scale decision | Bug fix |
| 2 | History items color-coded by verdict (green/amber/red) | UX |
| 2 | "Copy link" in command palette (⌘K) | Discoverability |
| 2 | History schema v1 with `verdict` field | Data |

---

## Remaining Backlog (from audit + observation)

| # | Item | Priority |
|---|---|---|
| 1 | Streaming response (SSE + JSON mode compat check) | P2 — Week 4 |
| 2 | Report viewer page (HTML page at shared URL, not JSON) | P1 — Week 2 |
| 3 | Email capture form | P1 — Week 3 |
| 4 | "How was this?" feedback button | P2 |
| 5 | Readiness meter tooltip (show found/missing signals) | P3 |
| 6 | Multi-language (English prompt) | P3 |
| 7 | PWA offline mode | P3 |

---

*End of refinement log. Ship it.*
