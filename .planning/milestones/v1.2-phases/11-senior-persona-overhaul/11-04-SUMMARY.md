---
phase: 11-senior-persona-overhaul
plan: 04
subsystem: testing
tags: [posix-sh, guard, voice-lint, foundation-guards, awk, byte-ceiling, fail-proof-harness]

# Dependency graph
requires:
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "check-foundation-guards.sh aggregator + fail-proof harness; guard_voice / guard_adapter_size templates; ship-GREEN+fail-on-mutation pattern"
  - phase: 11-senior-persona-overhaul (plans 01/02/03)
    provides: "the clean 16-role senior rewrite the guards ship GREEN against"
provides:
  - "guard_voice expanded from 3 curated surfaces to all 16 roles, with a narrow marker refinement so the all-16 scan ships GREEN (no /grug or Scribe voice-meta false positive)"
  - "guard_caveman_preserved (D-06) — positive inverse of guard_voice: asserts every role keeps a non-empty markered caveman prompt block so a rewrite cannot sand the grug voice off"
  - "guard_role_size (D-07) — per-file two-tier byte ceiling (locked constants) so a bloated rewrite fails red; orchestrator outlier + ba-pm BA headroom"
  - "fail-proof harness extended: sanded-caveman (D-06 RED) + oversized-role (D-07 RED) fixtures + CR-01/CR-02 missing-role cases + a refinement-accept case; GUARD_INPUTS covers all 16 roles; smoke stays GREEN"
affects: [phase-12-bdd-tdd, phase-14-security, phase-15-gate, senior-persona-rewrites]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Positive-inverse guard: keep the fenced block, assert non-empty + markered (D-06 inverts guard_voice's strip-and-scan-remainder)"
    - "Per-file documented byte ceilings via a POSIX-sh case lookup (no flat number, no live-computed tautology)"
    - "Narrow marker refinement via a separate per-phrase awk gsub (neutralize accepted clear-voice phrasings before the marker grep — robust to new prose, does NOT re-engineer the fence anchor)"

key-files:
  created: []
  modified:
    - "scripts/check-foundation-guards.sh"
    - "scripts/check-foundation-guards.test.sh"

key-decisions:
  - "D-06 CAVEMAN_MARKERS = VOICE_MARKERS idioms + ^You\\b — the clean caveman blocks are clipped second-person imperatives carrying NO literal grug idiom, so reusing VOICE_MARKERS verbatim would have shipped guard_caveman_preserved RED on the clean tree; ^You\\b is the universal caveman cadence that distinguishes a real block from a sanded professional-prose rewrite"
  - "D-05 refinement is a separate per-phrase awk gsub (neutralize /grug, grug voice, grug wink) rather than a per-line grep -v — robust so a bare grug-smash on the SAME line as an accepted phrase still trips, and resilient to NEW clear-voice grug prose a senior rewrite might add"
  - "D-07 per-file ceilings are the plan's locked 2026-06-10 constants (FAIL +12% / WARN +6%; ba-pm +20%/+12%); ba-pm's live 3291B sits between its WARN (3075) and FAIL (3294) so it emits an advisory WARN — build stays GREEN"

patterns-established:
  - "Ship-GREEN-against-current-content: when the plan's stated marker set conflicts with the actual clean tree, extend the marker to honor the plan's INTENT (block preserved + un-sandable) while keeping the guard green — never let a new guard ship RED"
  - "Refinement-accept fixture: prove a marker refinement is NARROW not WEAKENED by asserting the accepted phrasing stays GREEN while the original bare-violation fixture still fails RED"

requirements-completed: [PERS-01]

# Metrics
duration: 18min
completed: 2026-06-10
---

# Phase 11 Plan 04: Senior-persona mechanical guards (D-05/D-06/D-07) Summary

**Three guard changes that make PERS-01's amended success criteria mechanically true — guard_voice expanded to all 16 roles (with a narrow false-positive refinement), a new guard_caveman_preserved that blocks voice-sanding, and a new per-file guard_role_size byte ceiling — all shipping GREEN with planted-violation RED proofs.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- **D-05 voice expansion:** `guard_voice` now scans all 16 role files (via a shared `ROLE_FILES` list; `_role-switch-protocol.md` correctly excluded). The marker refinement lands FIRST so the expanded scan ships GREEN — a separate per-phrase `awk gsub` neutralizes the 3 verified clean-tree false positives (`/grug` brand literal, "grug voice"/"grug wink" Scribe voice-meta) before the marker grep, while a bare `grug smash` still fails. The fence anchor is NOT re-engineered (D-10 forward-compat).
- **D-06 caveman-preserved:** new `guard_caveman_preserved` (positive inverse of `guard_voice`) keeps only the fenced `## Caveman prompt` block and asserts it is non-empty AND markered for every one of the 16 roles, so the senior rewrite cannot flatten the grug voice into professional prose. CR-02 presence-first.
- **D-07 role-size:** new `guard_role_size` mirrors `guard_adapter_size` — per-file two-tier WARN→FAIL byte ceilings hard-coded from the locked 2026-06-10 baseline (orchestrator outlier 7041/6664; ba-pm BA headroom 3294/3075; CR-01 missing-file fail-red). Byte-based, not line-based.
- **Fail-proof harness:** `GUARD_INPUTS` grew to all 16 roles; added a sanded-caveman fixture (D-06 RED → "no caveman marker"), an oversized-role fixture (D-07 RED → "bloated"), CR-01/CR-02 missing-role cases for both new guards, and a refinement-accept case proving the D-05 narrowing is real (clear-voice `/grug` + grug-meta stays GREEN while the bare-grug fixture still fails RED). Smoke over the real tree stays GREEN; harness is hermetic.

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand guard_voice to all 16 (D-05) + add guard_caveman_preserved (D-06)** - `0ba2d4d` (feat)
2. **Task 2: Add guard_role_size with locked per-file ceilings (D-07)** - `084a8e6` (feat)
3. **Task 3: Extend fail-proof harness — sanded-caveman + oversized-role + expanded GUARD_INPUTS** - `149242f` (test)

## Files Created/Modified
- `scripts/check-foundation-guards.sh` - Added `ROLE_FILES` (the shared 16-role scan list), expanded `VOICE_FILES`/refined the voice scan (D-05), added `guard_caveman_preserved` (D-06) and `guard_role_size` (D-07), both registered in the run block.
- `scripts/check-foundation-guards.test.sh` - Expanded `GUARD_INPUTS` to all 16 roles; added the D-06 sanded-caveman RED fixture, the D-07 oversized-role RED fixture, CR-01/CR-02 missing-role cases for the new guards, and the D-05 refinement-accept case.

## Decisions Made
- **D-06 marker set extended to `VOICE_MARKERS | ^You\b`** (see Deviations) — the clean caveman blocks carry no literal grug idiom; `^You\b` is the universal terse-imperative cadence that distinguishes a real caveman block from a sanded professional-prose rewrite. Verified: all 16 clean blocks hit, a flowing professional-prose block does not.
- **D-05 refinement implemented as a separate per-phrase `awk gsub`** (not a per-line `grep -v`) so a real violation on the same line as an accepted phrasing still trips, and so new clear-voice grug prose a senior rewrite might add stays green without weakening the catch.
- **D-07 ceilings = the plan's locked constants verbatim.** ba-pm's live 3291B falls between its WARN (3075) and FAIL (3294), so it emits an advisory WARN; this does not fail the build (WARN is two-tier advisory), and it documents that ba-pm is the one role legitimately gaining BA judgment via PERS-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / Rule 3 - Blocking] D-06 marker set extended beyond literal VOICE_MARKERS reuse so guard_caveman_preserved ships GREEN**
- **Found during:** Task 1 (guard_caveman_preserved)
- **Issue:** The plan (D-06 / PATTERNS Group B) directed reusing `VOICE_MARKERS` verbatim as the caveman-preserved marker set. Empirically, NONE of the 16 clean-tree caveman blocks contain a literal `VOICE_MARKERS` idiom (`grug`, `me think`, `smash`, etc.) — the caveman voice in these blocks is the terse clipped second-person imperative ("You are X. You do not Y."). Reusing `VOICE_MARKERS` as-is would have shipped `guard_caveman_preserved` RED on the clean tree, violating the plan's own must-have ("ships GREEN, D-06") and the known-quirk "guards MUST ship GREEN against this current content (Phase-10 ship-GREEN discipline)."
- **Fix:** Defined `CAVEMAN_MARKERS="$VOICE_MARKERS|^You\\b"` — the explicit grug idioms PLUS `^You\b`, the universal caveman cadence the clean blocks use. This honors the plan's D-06 INTENT (assert the block is preserved and un-sandable) while shipping GREEN. The Context's D-06 Claude's-Discretion note ("which markers count as 'still grug' — reuse / **align with** the existing VOICE_MARKERS list") explicitly grants this latitude.
- **Files modified:** scripts/check-foundation-guards.sh
- **Verification:** All 16 clean blocks hit `CAVEMAN_MARKERS`; a sanded professional-prose block does not (Task 3 sanded-caveman fixture proves the guard fails RED → "no caveman marker"); `sh scripts/check-foundation-guards.sh` exits 0.
- **Committed in:** 0ba2d4d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 ship-GREEN correctness fix honoring the plan's stated intent)
**Impact on plan:** Necessary to satisfy the plan's own "ships GREEN" must-have and the ship-GREEN known-quirk; no scope creep — the guard still fails RED on a sanded block (proven), so D-06's protection is intact. No new sections, no role-content edits, no architectural change.

## Issues Encountered
- The Task 2 verify command's `[a-z-]+` role-path regex undercounts the distinct paths as 15 because it cannot match the digit in `qe-e2e.md`. This is cosmetic: `ROLE_FILES` genuinely expands to 16 at runtime (confirmed by counting the expansion and by the guard printing 16 role lines), and a digit-aware `[a-z0-9-]+` regex counts 16. The guard's PASS gate does not depend on the echoed count.

## User Setup Required
None - no external service configuration required. All guard work is POSIX sh / stdlib (no npm deps; TS pivot HELD).

## Next Phase Readiness
- PERS-01's amended mechanical success criteria are now enforced in code: voice discipline over all 16, caveman voice un-sandable, and per-file token-economy ceilings — all GREEN with provable RED.
- The senior substrate guards are in place for Phases 12–17 to write into a guarded environment.
- Remaining Phase 11 work (PERS-02 BA deepening if any, PERS-03 WR-05 marker close, audit L170 reconciliation) is owned by Plan 11-05 per this plan's `requirements` frontmatter (PERS-01 only here).

## Self-Check: PASSED

- FOUND: `.planning/phases/11-senior-persona-overhaul/11-04-SUMMARY.md`
- FOUND: commit `0ba2d4d` (Task 1)
- FOUND: commit `084a8e6` (Task 2)
- FOUND: commit `149242f` (Task 3)
- VERIFIED: `sh scripts/check-foundation-guards.sh` exits 0 (ALL CHECKS PASSED)
- VERIFIED: `sh scripts/check-foundation-guards.test.sh` exits 0 (ALL CHECKS PASSED)

---
*Phase: 11-senior-persona-overhaul*
*Completed: 2026-06-10*
