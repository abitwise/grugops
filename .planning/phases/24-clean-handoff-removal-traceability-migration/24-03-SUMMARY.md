---
phase: 24-clean-handoff-removal-traceability-migration
plan: 03
subsystem: testing
tags: [traceability, render, freshness-gate, typescript, fail-closed, note-refs, markdown]

# Dependency graph
requires:
  - phase: 20-shared-verified-context
    provides: context-io.ts render()/readContext/atomicWrite + the shared-context note schema
  - phase: 23-parallel-execution
    provides: now-running-freshness.ts — the standalone plans-rooted fail-closed gate template
provides:
  - scripts/trace-render.ts — deterministic note-refs → plans/traceability.md render (D-01 Option A)
  - scripts/trace-freshness.ts — fail-closed standalone trace-render drift gate (D-03)
  - package.json freshness:traceability script (standalone, not folded into freshness / check-foundation-guards)
  - traceability render emits ticket ids verbatim (unblocks the Plan 24-05 validator re-point, A2)
affects: [24-05, validate-agent-factory, traceability, MIGR-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "render-family: GENERATED header + deterministic at-then-id sort + cell() pipe-escape + single trailing newline + atomicWrite + isMain guard"
    - "plans/-rooted fail-closed freshness gate: realpath temp mirror → mirror-spawn render → byte-compare → exit 1 STALE on any mismatch OR any non-clean regen; greenfield vacuous pass"

key-files:
  created:
    - scripts/trace-render.ts
    - scripts/trace-render.js
    - scripts/trace-render.test.ts
    - scripts/trace-freshness.ts
    - scripts/trace-freshness.js
    - scripts/trace-freshness.test.ts
  modified:
    - package.json

key-decisions:
  - "trace-render is a NEW standalone scripts/trace-render.ts (not an extension of context-io.ts) — matches the standalone-gate precedent (D-discretion/A4)"
  - "the freshness gate's greenfield vacuous trigger keys on the SOURCE (no .grugops/context/ notes tree), mirroring now-running-freshness's !existsSync(claimedDir) — NOT on the absence of the derived plans/traceability.md, so the seed template never trips the gate before any notes exist"
  - "ticket id = a <PREFIX>-<number> ref whose prefix is not a reserved structural prefix (EPIC/FEAT/NFR/ADR/RISK/REL/INC/UAT); refs classified into the five columns by deterministic prefix/shape"

patterns-established:
  - "render-family clone (context-io.ts render → trace-render.ts): deterministic, zero-token, byte-reproducible"
  - "plans/-rooted standalone fail-closed freshness gate (now-running-freshness.ts → trace-freshness.ts)"

requirements-completed: [MIGR-03]

# Metrics
duration: 12min
completed: 2026-06-22
status: complete
---

# Phase 24 Plan 03: Traceability Migration onto Note Refs Summary

**plans/traceability.md migrated onto shared-context note refs — it now SURVIVES as a deterministic, byte-reproducible render of note refs (Requirement | Code | Tests | UAT | Release keyed by ticket id) gated fail-closed by a standalone freshness:traceability twin of now-running-freshness.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-22T23:33:00Z
- **Completed:** 2026-06-22T23:41:00Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments
- `scripts/trace-render.ts`: clones the context-io.ts `render()` shape (GENERATED do-not-hand-edit header, deterministic at-then-id sort, `cell()` pipe-escape, single trailing newline, `atomicWrite`, `isMain` guard); columns become Requirement | Code | Tests | UAT | Release (D-04) keyed by ticket id, sourced from each note's `refs` (D-06); ticket ids emitted verbatim so the Plan 24-05 validator `trace.includes(id)` re-point stays minimal (A2).
- `scripts/trace-freshness.ts`: clone of now-running-freshness.ts re-rooted from `.grugops/queue/` to the notes → `plans/` trace; regenerates `plans/traceability.md` into a realpath-resolved temp mirror, byte-compares the committed file, exits 1 naming the file + STALE on any mismatch OR any non-clean regen (fail-closed, D-03); greenfield vacuous pass when no `.grugops/context/` notes tree exists.
- `package.json` `freshness:traceability` standalone script — NOT the committed-`.js` `freshness` kind and NOT folded into `check-foundation-guards.ts` (D-03), matching the now-running / context / catalog standalone-gate precedent.
- 10 new tests (6 render behaviors + 4 gate cases) all green over the COMMITTED `.js`; both committed `.js` are faithful tsc builds (`npm run freshness` exits 0, now 20 files).

## Task Commits

Each task was committed atomically:

1. **Task 1: scripts/trace-render.ts + .test.ts (note refs → plans/traceability.md, D-01/D-04/D-06)** — `be396d7` (feat)
2. **Task 2: scripts/trace-freshness.ts + .test.ts + freshness:traceability script (D-03 fail-closed)** — `40759b7` (feat)

_TDD note: per the now-running idiom, the test imports the committed `.js`, so the `.js` was built before the first green run (test-first contract held via build-then-run)._

## Files Created/Modified
- `scripts/trace-render.ts` — deterministic note-refs → plans/traceability.md render (D-01 Option A)
- `scripts/trace-render.js` — committed faithful tsc build of the render
- `scripts/trace-render.test.ts` — 6 behaviors (row-keyed / byte-reproducible / GENERATED header / pipe-escape / verbatim ids / greenfield)
- `scripts/trace-freshness.ts` — fail-closed plans/-rooted trace-render drift gate (D-03)
- `scripts/trace-freshness.js` — committed faithful tsc build of the gate
- `scripts/trace-freshness.test.ts` — 4 cases (fresh / STALE / vacuous / fail-closed)
- `package.json` — added the standalone `freshness:traceability` script

## Decisions Made
- **trace-render is a new standalone file** rather than an extension of `context-io.ts` — the planner left this to discretion (A4/D-discretion); the standalone choice matches the now-running / context / catalog gate precedent and keeps the render-family one-file-per-render.
- **The freshness gate's greenfield trigger keys on the SOURCE** (`!existsSync(.grugops/context)`), exactly mirroring now-running-freshness's `!existsSync(claimedDir)`. This is the correct interpretation of D-03's "no notes / no traceability.md yet → vacuous pass": in this repo `plans/traceability.md` exists as the hand-maintained seed template but no notes exist, so the gate vacuous-passes and the seed template is never compared against a render. Once notes carrying ticket refs land, the render takes over the file and the gate enforces byte-equality.
- **Ref→column classification is deterministic and prefix-anchored:** a ticket id is `<PREFIX>-<number>` where the prefix is not one of the reserved structural prefixes (EPIC/FEAT/NFR/ADR/RISK/REL/INC/UAT); UAT/REL/NFR/EPIC/FEAT route by prefix, test-shaped refs route to Tests, path/PR-shaped refs route to Code.

## Deviations from Plan

None - plan executed exactly as written. Both tasks followed the cited analogs (context-io.ts render() and now-running-freshness.ts/.test.ts) and met every acceptance criterion.

## Issues Encountered
None. The render compiled clean on the first build; all 10 tests passed on the first green run; the full non-e2e suite went from 451 → 461 passing with no regression.

## Known Stubs

- **`plans/traceability.md` is still the hand-maintained EMPTY seed template** (header + FORMAT comment, zero data rows, old 10-column shape) — NOT yet a render output. This is INTENTIONAL and correct for this greenfield repo: there are no `.grugops/context/` notes here, so the freshness gate vacuous-passes and the render has nothing to emit. The seed is replaced by the GENERATED 5-column render the first time notes carrying ticket refs are published (D-01 Option A: the file survives, regenerated from notes). No action required this plan — the render + gate are the migration; the live file flips on first note publication in a real project.

## Threat Flags

None — this track introduces no new network/auth/file-access surface beyond the existing render-family pattern. The threat register's three mitigate dispositions (T-24-03-STALE / T-24-03-SILENT / T-24-03-FAB) are all satisfied by the fail-closed gate: a non-clean regen NEVER reports fresh, and traceability.md survives as a proven render of note refs.

## Next Phase Readiness
- Plan 24-05's `validate-agent-factory.ts` trace re-point (D-04/A2) is unblocked: the render emits ticket ids verbatim in its rows, so the existing `trace.includes(id)` substring check stays minimal (path + key unchanged, only the row source changes).
- This track is independent of the rewire/delete ordering (all-new files, no SCAN-set/kit overlap); it touches only `package.json` (the new standalone script), no `install/*` overlap.

## Self-Check: PASSED

- All 6 created files exist on disk (trace-render.{ts,js,test.ts}, trace-freshness.{ts,js,test.ts}).
- Both task commits exist (be396d7, 40759b7).
- The `freshness:traceability` script is present in package.json.

---
*Phase: 24-clean-handoff-removal-traceability-migration*
*Completed: 2026-06-22*
