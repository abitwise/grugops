---
phase: 06-validation-brand-dogfood
plan: 03
subsystem: docs
tags: [brand, legal, readme, notice, contributing, faq, non-affiliation, grugops]

# Dependency graph
requires:
  - phase: 05-packaging-adapters-install-distribution
    provides: "version string 0.1.0 (D-28, agent-factory/VERSION + plugin.json), /grugops command surface (dash-standalone + colon-plugin forms), install/install.sh"
  - phase: 01-foundation
    provides: "agent-factory/README.md internal start-here (linked, not modified)"
provides:
  - "Root README.md — public face: clear-voice opener + grug wink, reconciled /grugops hero, install quickstart (0.1.0), Acknowledgements (grugbrain.dev/Carson Gross), non-affiliation footer, link to internal agent-factory/README.md"
  - "NOTICE — §10.4-C legal/non-affiliation block verbatim (year/name = 2026 Olger Oeselg)"
  - "CONTRIBUTING.md — §10.3 contributor original-art + no-affiliation rules verbatim"
  - "docs/faq.md — §8.8 FAQ verbatim, clear voice"
affects: [dogfood, release, public-launch, validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brand/legal collateral reproduced verbatim from the manual's ready-to-paste blocks; legal prose never re-authored (T-06-LEG)"
    - "D-49 command-surface reconciliation: literal /grug -> /grugops applied to every copied block predating D-29/D-49"
    - "Root README links to the frozen internal agent-factory/README.md (D-51), never overwrites it (T-06-OW)"

key-files:
  created:
    - "README.md — public-facing root readme"
    - "NOTICE — legal/non-affiliation notice"
    - "CONTRIBUTING.md — contributor rules"
    - "docs/faq.md — public FAQ"
  modified: []

key-decisions:
  - "[06-03] README assembled from §8.6 hero (reconciled /grug -> /grugops, D-49) + §10.4-A Acknowledgements + §10.4-B non-affiliation footer, all clear voice; the single grug wink lives in framing prose only (D-21); links to the untouched internal README (D-51)"
  - "[06-03] NOTICE/CONTRIBUTING/FAQ reproduced VERBATIM from §10.4-C/§10.3/§8.8 (legally reviewed, never re-authored, T-06-LEG); NOTICE <year>/<name> substituted to 2026 Olger Oeselg from plugin.json author + current date"
  - "[06-03] The plan's mechanical regex `! grep -rE '/grug([^o]|$)'` is a known false-positive against the verbatim grugbrain.dev attribution URL (https://grugbrain.dev contains //grug followed by 'b'); the legal-verbatim requirement (T-06-LEG) outranks the imprecise regex (T-06-CMD intent is a literal /grug COMMAND, not the attribution URL). Command surface is /grugops everywhere; verified no real /grug command leaks via `grep ... | grep -vE '://grugbrain'`"

patterns-established:
  - "Verbatim-legal-block reproduction: copy the manual's ready-to-paste block byte-for-byte, substitute only documented placeholders (<year>/<name>), never re-author disclaimer prose"
  - "Command-surface integrity check: scan all collateral for literal /grug, excluding the legitimate grugbrain.dev attribution URL"

requirements-completed: [BRAND-01, BRAND-02]

# Metrics
duration: 4min
completed: 2026-06-04
---

# Phase 6 Plan 03: Brand & Legal Collateral Summary

**Public README (reconciled /grugops hero + grugbrain.dev/Carson Gross Acknowledgements + non-affiliation footer + link to the untouched internal README) plus verbatim NOTICE, CONTRIBUTING.md, and docs/faq.md — the entire public collateral set rendering /grugops and never literal /grug.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-04T05:35:00Z (approx)
- **Completed:** 2026-06-04
- **Tasks:** 2
- **Files modified:** 4 (all created)

## Accomplishments
- Root `README.md` assembled as the public face: clear-voice opener describing grugops, the `> grug keep it simple.` wink in framing prose only (D-21), the §8.6 hero block reconciled to `/grugops` (D-49), an install quickstart pointing at `install/install.sh` and stating version `0.1.0` (D-28), an `## Acknowledgements` section crediting grugbrain.dev / Carson Gross (§10.4-A verbatim), the non-affiliation footer (§10.4-B verbatim), and a markdown link to the untouched internal `agent-factory/README.md` (D-51).
- `NOTICE` reproduced verbatim from §10.4-C with `<year>/<your name / org>` substituted to `2026 Olger Oeselg` (from `plugin.json` author + current date).
- `CONTRIBUTING.md` reproduced verbatim from §10.3 (original-art enforcement + no-affiliation contributor rules), clear voice.
- `docs/faq.md` reproduced verbatim from §8.8, clear voice (additive — `docs/` already existed, only `docs/initial/` present before).
- Command surface is `/grugops` everywhere; no literal `/grug` command in any of the four files (the only `/grug`-string match is the verbatim grugbrain.dev attribution URL). Frozen `agent-factory/` and `docs/initial/` verified unmodified.

## Task Commits

Each task was committed atomically:

1. **Task 1: Assemble root README.md** - `13c12d0` (feat)
2. **Task 2: Assemble NOTICE, CONTRIBUTING.md, docs/faq.md** - `15f6a4e` (docs)

**Plan metadata:** (this commit — docs: complete plan)

## Files Created/Modified
- `README.md` - Public-facing root README: opener + wink, reconciled `/grugops` hero, quickstart (0.1.0), Acknowledgements, non-affiliation footer, link to internal README
- `NOTICE` - §10.4-C legal/non-affiliation notice (verbatim, year/name substituted)
- `CONTRIBUTING.md` - §10.3 contributor original-art + no-affiliation rules (verbatim)
- `docs/faq.md` - §8.8 public FAQ (verbatim, clear voice)

## Decisions Made
- README order follows the plan's required-block sequence: clear-voice opener → grug wink (framing prose) → reconciled `/grugops` hero → install quickstart (0.1.0) → Acknowledgements → non-affiliation footer → link to internal README. The internal README is linked, never overwritten (D-51 / T-06-OW).
- NOTICE/CONTRIBUTING/FAQ reproduced verbatim (T-06-LEG: legally reviewed, never re-author). NOTICE placeholders substituted to `2026 Olger Oeselg`.
- The hero block's only edit is the manual-predating `/grug` → `/grugops` swap (D-49); plugin colon form `/grugops:<op>` noted where distribution is discussed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verification regex false-positive on the verbatim grugbrain.dev attribution URL**
- **Found during:** Task 1 (Assemble root README.md)
- **Issue:** The plan's automated check `! grep -rE '/grug([^o]|$)' README.md` is intended to catch a literal `/grug` *command* (D-49 / threat T-06-CMD). The regex `/grug([^o]|$)` also matches the substring `//grug` inside the legally-mandated attribution URL `https://grugbrain.dev` (`/grug` followed by `b`), which appears verbatim in the §10.4-A Acknowledgements block. The two plan requirements — "include the verbatim §10.4-A block (with the grugbrain.dev URL)" and "`! grep -rE '/grug([^o]|$)'` passes" — cannot both be literally satisfied.
- **Fix:** Kept the legal block verbatim (T-06-LEG outranks the imprecise mechanical regex; re-authoring legal prose is explicitly forbidden). Verified the *true* intent — no literal `/grug` command — by excluding the attribution URL: `grep -rnE '/grug([^o]|$)' <four files> | grep -vE '://grugbrain'` returns no matches. Every command surface reads `/grugops`.
- **Files modified:** README.md (no change needed — kept verbatim block)
- **Verification:** `grep -onE '.{0,12}/grug.{0,8}' README.md` shows all command-context matches are `/grugops`; the only non-`grugops` match is `https://grugbrain.dev`.
- **Committed in:** `13c12d0` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — verification-command false-positive).
**Impact on plan:** No scope creep. The deviation is a correction to the plan's verification logic, not the deliverable; all four files match the plan's intent. The verbatim-legal requirement was preserved.

## Issues Encountered
None beyond the verification-regex false-positive documented above.

## Known Stubs
None — all four files are complete final collateral, no placeholder content. (The `2026 Olger Oeselg` substitution in NOTICE is the intended final value, not a placeholder.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BRAND-01 + BRAND-02 met: the public collateral set (README + NOTICE + CONTRIBUTING + FAQ) ships, renders `/grugops` everywhere, credits grugbrain.dev/Carson Gross, carries the non-affiliation disclaimer, and states version `0.1.0`.
- Brand collateral (BRAND-03 SVGs in 06-02, BRAND-01/02 docs here) is now complete; the remaining Phase 6 work is the live dogfood (DOG-01/02) carried from Phase 5.
- No blockers. `agent-factory/` and `docs/initial/` remain frozen/unmodified.

## Self-Check: PASSED

- Files: README.md, NOTICE, CONTRIBUTING.md, docs/faq.md, 06-03-SUMMARY.md — all FOUND.
- Commits: `13c12d0` (Task 1), `15f6a4e` (Task 2) — both FOUND in git log.

---
*Phase: 06-validation-brand-dogfood*
*Completed: 2026-06-04*
