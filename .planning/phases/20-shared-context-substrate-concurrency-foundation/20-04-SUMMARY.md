---
phase: 20-shared-context-substrate-concurrency-foundation
plan: 04
subsystem: testing
tags: [foundation-guard, grep-guard, github-actions, ci-matrix, windows, atomic-write, context-substrate, vitest]

# Dependency graph
requires:
  - phase: 20-01
    provides: "context-io.ts sanctioned write path + atomicWrite unlink-then-rename Windows branch + SC-2 concurrent-writer/render tests"
provides:
  - "guard_context_writes — the seventh foundation guard, registered in check-foundation-guards.ts as a clone of guard_wr05; fails RED on any raw .grugops/context/ write bypassing context-io.ts; auto-wires into the §14 PR-quality gate via the existing aggregator (no forked gate logic)"
  - "SC-5 fail-proof oracle: planted raw-write fires (nonzero + SCTX-05) in both token-then-path and path-then-token shapes; legitimate prose naming context-io.ts/the path stays GREEN; real-tree smoke stays GREEN"
  - ".github/workflows/ci.yml — created honestly (it did not exist); os matrix [ubuntu-latest, windows-latest] on Node 22 running the vitest suite (e2e lane excluded) so the SC-2 Windows unlink-then-rename branch executes on a real Windows runner; freshness gates + foundation-guard aggregator run on the ubuntu leg"
affects: [phase-21-verify-stamp, phase-23-parallel-wr05-inversion, phase-24-handoff-deletion, phase-26-dogfood-equivalence-oracle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Foundation-guard clone (D-09): new guard = guardWr05() shape — explicit SCAN set (never repo-wide grep), shared grepFiles helper, pass/fail into the shared FAILS counter, clear voice, folds into the single-source §14 gate"
    - "Token-vs-prose calibration (RESEARCH A3): CTX_WRITE_RE matches a real write TOKEN (writeFileSync/appendFileSync/\\bWrite\\b/shell redirect/echo) co-occurring with .grugops/context/ on one line in EITHER order — never the prose word 'write'; the real-tree smoke is the forcing function"
    - "OS-matrix CI for a platform-specific code branch: scope the freshness/path-sensitive gates to one OS, scope the other OS to the platform branch it uniquely exercises"

key-files:
  created:
    - ".github/workflows/ci.yml"
  modified:
    - "scripts/check-foundation-guards.ts"
    - "scripts/check-foundation-guards.js"
    - "scripts/check-foundation-guards.test.ts"

key-decisions:
  - "Calibrated planted-fire and prose-stays-green guard tests against WORKFLOW files (no byte ceiling) rather than role files, so guard_context_writes is proven in isolation and the assertion is not masked/false-failed by guard_role_size"
  - "CTX_SCAN = the 17 shipped roles (reuse ROLE_FILES) + the 16 shipped workflows — explicit, never a repo-wide grep (mirrors guard_wr05's explicit scan set)"
  - "CI uses npm ci (committed package-lock.json present) for deterministic dev-dep install; installs NO new package"
  - "true-NFS atomicity left honestly UNKNOWN - verify in a workflow comment; Windows-green does NOT imply NFS-green; DOGF-02 (Phase 26) is the real concurrency oracle"

patterns-established:
  - "Guard clone via shared grepFiles + explicit SCAN set + shared FAILS counter — single-source gate extension, never a forked gate"
  - "No-fabrication guard proof: a guard must demonstrably FIRE on a planted violation AND stay GREEN on the real tree AND not false-positive on sanctioned prose"

requirements-completed: [SCTX-05]

# Metrics
duration: 5min
completed: 2026-06-17
---

# Phase 20 Plan 04: guard_context_writes + windows-latest CI leg Summary

**Seventh foundation guard `guard_context_writes` (SCTX-05) greps shipped role/workflow text for raw `.grugops/context/` writes that bypass `context-io.ts`, fails RED on a planted bypass and stays GREEN on the real tree, auto-wiring into the §14 gate; plus a real `.github/workflows/ci.yml` os-matrix that executes the SC-2 Windows unlink-then-rename branch on a genuine windows-latest runner.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-17T10:17:56Z
- **Completed:** 2026-06-17T10:22:38Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Registered `guardContextWrites()` in `scripts/check-foundation-guards.ts` as a clone of `guardWr05()` — explicit `CTX_SCAN` set (17 roles + 16 workflows, never a repo-wide grep), shared `grepFiles` helper, `pass`/`fail` folding into the shared `FAILS` counter, clear voice. It folds into the existing exit tail, so it auto-wires into the §14 PR-quality gate through the aggregator with NO forked gate logic.
- `CTX_WRITE_RE` fires when a `.grugops/context/` path co-occurs on one line with a real write TOKEN (`writeFileSync`/`appendFileSync`/`\bWrite\b`/shell `>`|`>>`/`echo`) in EITHER order; calibrated to a token, not the prose word "write" (RESEARCH Assumption A3 — the same token-vs-prose care guard_wr05 needed).
- Extended the fail-proof oracle (`check-foundation-guards.test.ts`): SC-5 planted raw-write fires (nonzero + `SCTX-05`) in both token-then-path (`writeFileSync('.grugops/context/...')`) and path-then-token (`echo ... >> .grugops/context/...`) shapes; a calibration case proves prose naming `context-io.ts` + the path stays GREEN (no false positive); the real-tree smoke stays GREEN. Mirrored the 16 workflow SCAN files into `GUARD_INPUTS`.
- Created `.github/workflows/ci.yml` honestly (it did NOT exist — RESEARCH's `[ASSUMED]` was false): os matrix `[ubuntu-latest, windows-latest]` on Node 22, `npm ci` → `npm run build` → vitest with the live claude-CLI e2e lane excluded. The windows-latest leg executes the SC-2 `unlinkSync`-then-`renameSync` `atomicWrite` branch on a real Windows runner; the ubuntu leg additionally runs the three freshness gates + the foundation-guard aggregator. A comment honestly leaves true-NFS atomicity `UNKNOWN - verify` (DOGF-02/Phase 26).
- Regenerated and committed the fresh `scripts/check-foundation-guards.js`; `npm run freshness` is green (no drift between committed `.js` and a `tsc` rebuild).

## Task Commits

Each task was committed atomically:

1. **Task 1: Register guard_context_writes (clone guard_wr05) + extend fail-proof oracle** - `5d4e0ba` (feat)
2. **Task 2: Add the windows-latest CI leg for the SC-2 Windows branch** - `539573d` (ci)

**Plan metadata:** (final docs commit below)

## Files Created/Modified
- `.github/workflows/ci.yml` - GitHub Actions CI: os matrix [ubuntu-latest, windows-latest] on Node 22, vitest (e2e excluded), freshness+guards on ubuntu, Windows executes the SC-2 atomic-write branch
- `scripts/check-foundation-guards.ts` - Added `guardContextWrites()` (SCTX-05), `CTX_WRITE_RE`, `CTX_SCAN` (ROLE_FILES + 16 workflows); registered the call in the run-all block; header prose updated to seven guards
- `scripts/check-foundation-guards.js` - Regenerated committed build output (freshness green)
- `scripts/check-foundation-guards.test.ts` - Added the 16 workflow SCAN files to GUARD_INPUTS; added SC-5 planted-raw-write (two shapes) + prose-stays-green calibration cases

## Decisions Made
- Calibration and planted-fire tests target WORKFLOW files (no byte ceiling) rather than role files, so `guard_context_writes` is proven in isolation — a role-file plant would also trip `guard_role_size` and mask/false-fail the real assertion.
- `CTX_SCAN` reuses `ROLE_FILES` for the 17 roles and lists the 16 workflows explicitly — never a repo-wide grep (mirrors `guard_wr05`'s explicit scan set, D-09).
- CI uses `npm ci` because a `package-lock.json` is committed (deterministic dev-dep install); no new package is added (threat T-20-SC honored).
- true-NFS atomicity is honestly carried as `UNKNOWN - verify` in a workflow comment; a Windows-green run proves the Windows code branch executes, not NFS atomicity (DOGF-02/Phase 26 is the real oracle).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Initial calibration test appended to a near-ceiling role file, tripping guard_role_size instead of proving guard_context_writes**
- **Found during:** Task 1 (test extension / running the fail-proof oracle)
- **Issue:** The first "prose stays GREEN" calibration case appended prose to `agent-factory/roles/software-engineer.md` (already 3295B, ceiling 3307B). The ~95B append pushed it to 3384B, so `guard_role_size` (not `guard_context_writes`) failed the run — a false negative that would have wrongly suggested the new guard false-positives on prose. The forcing-function test caught it.
- **Fix:** Moved both the planted-raw-write fire test and the prose-stays-green calibration test to WORKFLOW files (`02-idea-to-epics.md`, `03-epic-to-tickets.md`), which have no byte ceiling, isolating the assertion to `guard_context_writes`.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts` → 25/25 pass; real-tree aggregator exits 0 (ALL CHECKS PASSED).
- **Committed in:** `5d4e0ba` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix corrected a test-design flaw that would have masked the guard's true behavior; it tightened the proof rather than changing scope. No scope creep.

## Issues Encountered
- The repo has no installed YAML linter (PyYAML/js-yaml/actionlint all absent). Validated `ci.yml` structurally instead: no tabs in indentation, consistent 2-space indent, and all required keys present (`name`, `on`, `jobs`, `runs-on`, `strategy.matrix.os`, `steps`, the two `actions/*` uses, `node-version: 22`, `npm ci`, `npm run build`). YAML is valid by inspection.

## User Setup Required
None - no external service configuration required. (The CI workflow runs on GitHub-hosted runners when pushed/PR'd; no secrets or local setup are needed for the Phase 20 work.)

## Next Phase Readiness
- SCTX-05 delivered and proven: the substrate's write path is now mechanically enforced before any role uses it (Phase 21+ can wire roles to `context-io.ts` knowing a raw-write bypass fails the gate).
- The SC-2 cross-platform claim is now real, not asserted: the Windows unlink-then-rename branch runs on `windows-latest` CI.
- Honest residual: true-NFS atomicity remains `UNKNOWN - verify` (DOGF-02/Phase 26). This is the documented carve-out, not a gap introduced here.

## Self-Check: PASSED

- FOUND: `.github/workflows/ci.yml`
- FOUND: `scripts/check-foundation-guards.ts` (contains `guardContextWrites`)
- FOUND: `scripts/check-foundation-guards.js` (contains `guardContextWrites`; freshness green)
- FOUND: `scripts/check-foundation-guards.test.ts` (7× `SCTX-05`)
- FOUND: `.planning/phases/20-shared-context-substrate-concurrency-foundation/20-04-SUMMARY.md`
- FOUND commit: `5d4e0ba` (Task 1)
- FOUND commit: `539573d` (Task 2)

---
*Phase: 20-shared-context-substrate-concurrency-foundation*
*Completed: 2026-06-17*
