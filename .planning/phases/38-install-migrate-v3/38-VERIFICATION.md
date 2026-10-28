---
phase: 38-install-migrate-v3
verified: 2026-10-28T21:30:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - ".planning/phases/38-install-migrate-v3/38-01-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-01-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-02-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-02-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-03-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-03-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-04-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-04-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-05-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-05-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-06-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-06-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-07-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-07-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-08-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-08-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-09-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-09-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-10-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-10-SUMMARY.md"
  - ".planning/phases/38-install-migrate-v3/38-11-PLAN.md"
  - ".planning/phases/38-install-migrate-v3/38-11-SUMMARY.md"
  - "docs/pre-v3-state-layout.md"
  - "install/install.js"
  - "install/install.ts"
  - "install/state-migrate.js"
  - "install/state-migrate.ts"
covered_digest: "v3:sha256:f4530053119840ea2985181c7c88f25cc4a6141c783dbe04c07307b116371c53"
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "A code span holding `<!-- RUN -->` in a Done board row no longer blocks the Done roll (board stays over 24,576 bytes on the real repository)"
    addressed_in: "Phase 37 state rules (deferred-items.md finding C); not scheduled in a later phase"
    evidence: "Not a Phase 38 criterion: criterion 5 asks only that before/after sizes be recorded. Logged open in deferred-items.md."
---

# Phase 38: install --migrate v3 Verification Report

**Phase Goal:** A user with an old-layout repo moves it to the v3 layout with one command that deletes nothing, proves nothing was lost, and is safe to run twice
**Verified:** 2026-10-28T21:30:00Z
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

Verified against the code and by re-running the migration myself on a fresh scratch copy of the real repository
(skytalix) at the post-review-fix HEAD (`28b295a0`), not from SUMMARY claims.

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `install --migrate --dry-run` prints every planned move and split with per-file byte counts and leaves the repo unchanged; `install --migrate` then moves the repo to v3 (MIGRATE-01) | VERIFIED | `--dry-run` parsed at `install/install.ts:361`; `migrateListing` at `state-migrate.ts:3059`. My run: dry run exit 0, 1,044 stdout lines, tree digest (sha256 over all non-.git files) identical before/after. Real run exit 0: `plans/` gone, `memory-bank/plans/` present, `.layout` = `layout: v3`. `install/migrate-v3-dryrun.test.ts` passes. |
| 2 | Originals unchanged in `memory-bank/plans/archive/pre-v3/`, split files new, board trailers verbatim in ticket bodies, nothing deleted or rewritten in place (MIGRATE-02, MIGRATE-05) | VERIFIED | `archive/pre-v3/` holds `board.md` (896,930 bytes = original size), `traceability.md`, `nfr-catalog.md`, plus notes/updates files and `tickets/`. Per-original check over all 8,842 recorded files (`plans/**`, `60-progress.md`, `.grugops/context/**`): 0 missing; every sha256 found at its home (same path under `memory-bank/plans/`, or the `archive/pre-v3/` copy). 148 live tickets carry a `## Board notes` section. Verbatim trailer rule is covered by `state-migrate.test.ts` (passes) and the planner's `cutRow`. |
| 3 | Migration proves every original line appears in the split output or the archive; on proof failure it rolls back and says why (MIGRATE-03) | VERIFIED | `proveStateMigrate` (`state-migrate.ts:2826`) plus install-side per-original proof; fault-injected rollback at every commit step in `install/migrate-v3-rollback.test.ts` (R1..R8, passes: 171/171 in the targeted run). Real-data run printed no proof failure; CR-01 (comment-opening `_Updated:` line made live ghost rows) and WR-02/WR-04 (leftovers after undo) were found by review, fixed with regression tests that failed before the fix. |
| 4 | Detects old/new/both/neither, refuses "both" and non-empty `queue/claimed/`, writes a layout marker, second run is a byte-identical no-op (MIGRATE-04) | VERIFIED | `migrateLayoutRefusal` (`install.ts:6978`), `claimedQueueRefusal`, `stateLayout()`; cases S1..S7 in `migrate-v3-states.test.ts` pass. Real run: second `--migrate` exit 0, "Nothing to do.", tree digest identical (SECOND-RUN-IDENTICAL). A `.gitkeep` in `claimed/` is correctly not a claim (dogfood finding A, fixed). |
| 5 | With the opt-in flag, finished-ticket context folders move (unchanged) to a separate archive and trace rendering still reads them; run on a copy of cli-chess-example under scratch `GRUGOPS_HOME` with before/after sizes recorded (MIGRATE-06, MIGRATE-07) | VERIFIED | My post-fix run: `--archive-done-context --dry-run` exit 0 (667 move / 355 keep); real run moved 667 folders to `.grugops/archive/context/` (355 kept live); 0 byte mismatches against the originals; `trace-render.js --check` exit 0 ("trace is fresh: 1022 tasks, 873 notes"); `state-check` trace compared with 0 findings; a second archive run left the tree digest identical. `HOME` and `GRUGOPS_HOME` were scratch dirs. `38-DOGFOOD.md` records before/after sizes (board 885,097 -> 221,821; traceability 2,173,038 -> 5,677 index + 113 rendered files; NFR 419,122 -> 23,284 + 13 files). |
| 6 | On an installed v2.x two-root repo still holding the pre-v3 board, `--migrate` moves it to v3; the "already migrated ... Nothing to do." short-circuit no longer answers that layout; a test pins it (MIGRATE-04 / WR-04) | VERIFIED | The short-circuit at `install.ts:7987` now sits behind `layout.isMigrated && state !== "pre-v3"`. Pinned by `agents-record.test.ts` WR-04 (`:938` asserts the string is absent) and `migrate-v3.test.ts`; both pass (agents-record is part of the full-suite gate, which matches baseline). |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

### Dogfood versus the review fixes (the orchestrator's question)

`38-DOGFOOD.md` ran before the review fixes (CR-01 and WR-03 change what moves and what is kept). That left
criteria 2, 3, 4 and 5 formally unproven on real data at the final HEAD. I closed it by re-running the whole
sequence at `28b295a0` on a fresh scratch copy (migrate, second migrate, archive, second archive): all exit 0,
dry runs and second runs byte-identical, 0 missing originals, trace fresh. The numbers differ from the
dogfood record (this copy is a newer skytalix commit: 1,022 context folders, 667 moved / 355 kept, board
223,657 bytes after) because of the newer source repo and the WR-03 reopened-ticket rule, not because of a
failure. The record in `38-DOGFOOD.md` is still the one the requirement points to; it does not describe the
final code's counts. This is a documentation staleness, not a goal gap.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/state-migrate.ts` / `.js` | Pure planner, proof, listing, context-archive selection | VERIFIED | 3,358 lines; exports `planStateMigrate`, `proveStateMigrate`, `migrateListing`, `planContextArchive`; committed `.js` fresh |
| `install/install.ts` / `.js` | `--migrate` v3 arm, state machine, undo journal, `--dry-run`, `--archive-done-context` | VERIFIED | Wired into the main flow (pre-check at ~7860, state arms, context archive); `npm run build` leaves tree clean, `npm run freshness` "All build outputs fresh: 88 committed .js" |
| `docs/pre-v3-state-layout.md`, `CHANGELOG.md` | User docs | VERIFIED | Present; refusal list updated by review fixes; CHANGELOG describes `--migrate` and the opt-in flag |
| Test files `install/migrate-v3*.test.ts`, `state-migrate.test.ts` | Pin each behavior | VERIFIED | 7 files, 171 tests passed (run by me with scratch `GRUGOPS_HOME`/`HOME`) |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| arg parse `--migrate/--dry-run/--archive-done-context` | pre-check and state arms | WIRED | `install.ts:361-387`, flag reaches `stateMigrateRefusals` and `readContextArchive` |
| `planStateMigrate` | `proveStateMigrate` and commit journal | WIRED | plan built in the pre-check, proven before commit; undo on failure |
| commit | kit-source trace render | WIRED | real run printed "trace render ... written", `trace-render.js --check` exit 0 |
| `layout.isMigrated` arm | WR-04 repair | WIRED | guarded by `state !== "pre-v3"` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Targeted migrate tests | `GRUGOPS_HOME=scratch HOME=scratch npx vitest run install/migrate-v3 install/state-migrate.test.ts` | 7 files, 171 passed | PASS |
| Build and freshness | `npm run build`; `npm run freshness` | clean tree; 88 .js fresh | PASS |
| Dry run changes nothing | install `--migrate --dry-run` on scratch copy | exit 0, digest equal | PASS |
| Migrate, then re-run | install `--migrate` twice | exit 0 both, second digest equal | PASS |
| Context archive, then re-run | `--archive-done-context` twice | exit 0, 667 moved, 0 mismatches, 2nd run digest equal | PASS |
| Trace after archive | `trace-render.js . --check`, `state-check.js .` | exit 0, trace fresh, 0 trace findings | PASS |
| Full non-e2e suite (orchestrator's recorded run, not re-run) | `regression-gate.log` | 20 failed = the 20 in `38-BASELINE.md` | accepted as given |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MIGRATE-01 | 38-03, 38-09 | `--migrate` and `--dry-run` listing | SATISFIED | Truth 1 |
| MIGRATE-02 | 38-03, 38-04, 38-05 | Originals kept unchanged in `archive/pre-v3/`, splits are new files | SATISFIED | Truth 2 |
| MIGRATE-03 | 38-02, 38-03, 38-06 | Line-conservation proof, rollback on failure | SATISFIED | Truth 3 |
| MIGRATE-04 | 38-03, 38-07, 38-08 | State detection, refusals, marker, idempotent re-run, WR-04 | SATISFIED | Truths 4, 6 |
| MIGRATE-05 | 38-02, 38-03 | Board trailers verbatim | SATISFIED | Truth 2 |
| MIGRATE-06 | 38-10 | Opt-in context folder move | SATISFIED | Truth 5 |
| MIGRATE-07 | 38-11 | Dogfood with sizes recorded | SATISFIED | Truth 5, `38-DOGFOOD.md` |

All seven IDs appear in REQUIREMENTS.md (marked Complete, traceability table maps each to Phase 38). No orphaned
requirement.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `install/state-migrate.ts` | - | IN-01 `parseNfrIndex` embedded, unused | Info | Open Info finding in 38-REVIEW-DISPOSITION.md; no goal impact |
| `install/*` | - | IN-02..IN-05 (U+FEFF literal, doc says "split" for traceability, trailing newline when last `_Updated:` removed, duplicate refusal text) | Info | Open, recorded, no goal impact |

No TBD/FIXME/XXX debt markers in the phase's changed code (the `XXXXXX` hits are `mkdtemp` template text).

### Advisory / Known Residuals (not gaps)

- The real repository's board stays over its 24,576-byte budget after migrate (221,821 bytes in the dogfood;
  223,657 in my rerun) because ABC-109's `<!-- RUN -->` code span blocks the Done roll (deferred-items.md finding C,
  a Phase 37 state-rules question). Criterion 5 requires only that sizes be recorded, which they are. Migrate prints
  219 over-budget notes and still writes the marker, by design.
- Gate failures `check-diff-disposition` and `check-flip-manifest` are pre-existing (recorded in 38-DOGFOOD.md).
- WR-05 residual: the commit plan writes a `TARGET` path raw; a `TARGET` containing TAB/newline is out of the finding's scope.
- `38-DOGFOOD.md` pre-dates CR-01/WR-03; consider a short addendum with the post-fix counts above.

### Human Verification Required

None. The behaviors are deterministic filesystem outcomes that I exercised directly.

### Gaps Summary

No gaps. All six ROADMAP criteria hold in the code and on real data at the final HEAD. The migration keeps every original byte-identical,
refuses the hazard states, rolls back on a failed proof or step, and a second run changes nothing.

---

_Verified: 2026-10-28T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
