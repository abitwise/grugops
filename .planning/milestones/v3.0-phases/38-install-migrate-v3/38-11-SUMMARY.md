---
phase: 38-install-migrate-v3
plan: 11
subsystem: install
tags: [install, migrate, dogfood, docs, changelog, phase-gate]

requires:
  - phase: 38-install-migrate-v3
    provides: "install --migrate v3 state move (38-02 to 38-09) and --archive-done-context (38-10)"
provides:
  - "38-DOGFOOD.md: the MIGRATE-07 record of the whole migration on scratch copies of the real pre-v3 repository (three runs, commands, exit codes, digests, before and after sizes, findings) and the phase gate"
  - "Two installer fixes found by the dogfood: a keeper file in the claimed queue is not a claim; the context archive on a v3 repository renders the trace after its moves"
  - "User docs for what --migrate does now (docs/pre-v3-state-layout.md), the --dry-run and --archive-done-context flags (install/README.md), and the Unreleased changelog lines"
affects: [phase-37-state-rules, v3.0-release, install-docs]

actuals:
  tokens: 12390
  tasks: 3
  commits: 5
plan_head_before: 4e727ea07f5f262aa1d461d17e0cb09e8f3e23c8
plan_head_after: 5c32d2b9b6a8a1760e13bed8f59a9f2c02e65481

tech-stack:
  added: []
  patterns:
    - "A dogfood that finds a defect in this phase's code fixes it under the deviation rules and re-runs the whole sequence on a fresh scratch copy; every run is recorded"
    - "Any install arm that moves a context folder renders the trace afterwards, because the renderer's ref order depends on which root holds a task"

key-files:
  created:
    - .planning/phases/38-install-migrate-v3/38-DOGFOOD.md
    - .planning/phases/38-install-migrate-v3/deferred-items.md
  modified:
    - install/install.ts
    - install/install.js
    - install/migrate-v3-states.test.ts
    - install/migrate-v3-context.test.ts
    - install/installer-fs-census.test.ts
    - docs/pre-v3-state-layout.md
    - install/README.md
    - CHANGELOG.md

key-decisions:
  - "A dot-named regular file (for example .gitkeep) in .grugops/queue/claimed/ is a keeper, not a claim; a dot-named directory, a link, or an entry that cannot be asked about still counts as a claim (fix 6cbaa209)"
  - "Reverses a plan 38-10 key decision: on a v3 repository with a valid marker, --archive-done-context now renders the trace after its moves, and a failed render takes its added files away and undoes the moves; a run that moves nothing renders nothing. The 38-10 premise (the trace does not depend on which root holds a task) holds on the frozen fixture only (fix 2f8f8b65)"
  - "The board stays over budget after migrate on the real repository (221,821 bytes against 24,576) because one Done row holds `<!-- RUN -->` inside a code span and the phase 37 state rules read it as a comment, so the Done roll is skipped; deferred to the phase 37 state rules (deferred-items.md, UNKNOWN - verify)"
  - "check-diff-disposition (721 findings, unchanged since phase 37, no agent-factory/ file changed in phase 38) and check-flip-manifest (archived phase 33 manifest) stay red as pre-existing gates, recorded as known in the phase gate and never marked passing"

patterns-established:
  - "The phase gate is recorded as a section of the dogfood record: commit, suite totals compared test by test with the baseline, and each gate's exit code"

requirements-completed: [MIGRATE-07, MIGRATE-01, MIGRATE-06]

coverage:
  - id: D1
    description: "The whole migration ran on a scratch copy of the real pre-v3 repository under scratch GRUGOPS_HOME and HOME (dry run, migrate, per-file check, second migrate, kit tools, context archive, second archive run), recorded with before and after sizes"
    requirement: MIGRATE-07
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/38-install-migrate-v3/38-DOGFOOD.md (run C)"
        status: pass
    human_judgment: true
    rationale: "The record was reviewed by the human at the Task 1 tracer checkpoint and approved; the real-repository run is not repeatable in CI"
  - id: D2
    description: "A keeper file in the claimed queue no longer refuses the migrate"
    requirement: MIGRATE-01
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S3b)"
        status: pass
    human_judgment: false
  - id: D3
    description: "--archive-done-context on a v3 repository renders the trace after its moves and undoes them on a failed render"
    requirement: MIGRATE-06
    verification:
      - kind: integration
        ref: "install/migrate-v3-context.test.ts#(C6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "docs/pre-v3-state-layout.md, install/README.md and CHANGELOG.md describe the state move, every refusal, the undo, --dry-run and --archive-done-context"
    requirement: MIGRATE-01
    verification:
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js && check-imperative-lexicon && check-banned-claims && check-claim-anchors && check-state-paths && check-kit-refs (all exit 0)"
        status: pass
    human_judgment: true
    rationale: "Whether the prose is clear and complete for a user is a reading judgment the gates do not make"
  - id: D5
    description: "Phase gate: the full non-e2e suite fails exactly the 20 baseline tests, and build, typecheck, freshness, build parity and the strict validator exit 0"
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (20 failed = 38-BASELINE.md set; 10,429 passed)"
        status: pass
    human_judgment: false

duration: 81min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 11: Dogfood, docs and phase gate Summary

**The whole v3 migrate ran clean on a scratch copy of the real pre-v3 repository after two dogfood-found installer fixes (a `.gitkeep` claim refusal, and a stale trace after the v3-layout context archive). The user docs, the README flags and the changelog now describe the state move. The phase gate fails exactly the 20 baseline tests.**

## Performance

- **Duration:** about 81 min (plan base 17:37Z, last task commit 18:58Z plus the 23-minute suite)
- **Started:** 2026-10-28T17:37:51Z
- **Completed:** 2026-10-28T19:21:30Z
- **Tasks:** 3 of 3
- **Files modified:** 10

## Accomplishments

- MIGRATE-07: three recorded runs on fresh scratch copies of the user's local copy. Run C completed cleanly: the dry run left the tree unchanged; every original was found at its home (0 failures before and after the context archive); the second `--migrate` and the second archive run left the tree byte-identical; `trace-render --check` exits 0 after both. The board went from 885,097 to 221,821 bytes, and 657 context folders moved.
- Two defects found by the dogfood were fixed and covered by tests: (S3b) and (C6).
- docs/pre-v3-state-layout.md now covers the state move from start to end: the pre-check with every refusal by name, the move and where the originals go (D-17, D-21), the Board notes, orphan notes, board updates and NFR notes files, the roll, the proof, the undo, the trace render, the marker written last, the second run, the dry run, and `--archive-done-context` with the D-20 and D-22 rule. The handoffs and `--check` sections were also updated. The sentence saying the state move "arrives later" is gone.
- install/README.md documents `--dry-run` and `--archive-done-context`, describes the v3 state move in the `--migrate` section, and notes that `--backup-edited-kit` may be needed. CHANGELOG.md has two Added lines and one Changed line.
- Phase gate recorded in 38-DOGFOOD.md `## Phase gate`.

## Task Commits

1. **Task 1: dogfood tracer** (approved by the human at the checkpoint): `6cbaa209` (fix), `2f8f8b65` (fix), `e3aba780` (test)
2. **Task 2: user docs and changelog**: `9ae115fb` (docs)
3. **Task 3: phase gate**: `5c32d2b9` (test)

**Plan metadata:** the docs(38-11) completion commit that follows this file

## Files Created/Modified

- `.planning/phases/38-install-migrate-v3/38-DOGFOOD.md`: the MIGRATE-07 record and the phase gate
- `.planning/phases/38-install-migrate-v3/deferred-items.md`: findings C (code-span comment blocks the Done roll) and B-residual (trace order depends on the context root)
- `install/install.ts` / `install/install.js`: claimedQueueRefusal keeper rule; runContextArchive renders the trace after its moves and undoes them if the render fails
- `install/migrate-v3-states.test.ts`: case (S3b)
- `install/migrate-v3-context.test.ts`: case (C6); (C4) now expects the render line
- `install/installer-fs-census.test.ts`: discardRenderedTrace's callers name runContextArchive
- `docs/pre-v3-state-layout.md`, `install/README.md`, `CHANGELOG.md`: the docs

## Decisions Made

See key-decisions in the frontmatter. Of note: plan 38-10's "the v3-layout context archive runs no render" is reversed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A `.gitkeep` in the claimed queue refused every migrate**
- **Found during:** Task 1 (run A, step A1, exit 3)
- **Issue:** claimedQueueRefusal (plan 38-07) counted git's keeper file as a held claim.
- **Fix:** a dot-named regular file is a keeper, as in the kit's context and record listings; a dot-named directory, a link, or an entry that cannot be asked about still counts.
- **Files modified:** install/install.ts, install/install.js, install/migrate-v3-states.test.ts
- **Verification:** (S3b); the whole sequence was re-run on a fresh scratch copy (run B)
- **Committed in:** 6cbaa209

**2. [Rule 1 - Bug] `--archive-done-context` on a v3 repository left 58 trace files stale**
- **Found during:** Task 1 (run B, step B8: trace-render --check exit 1, state-check 58 trace-stale)
- **Issue:** the renderer reads the live root, then the archive root, so moving a folder can reorder a ticket's refs. Plan 38-10 ran no render on that path.
- **Fix:** the v3-layout arm renders the trace after its moves. A failed render takes its added files away and undoes the moves. A run that moves nothing renders nothing.
- **Files modified:** install/install.ts, install/install.js, install/migrate-v3-context.test.ts, install/installer-fs-census.test.ts
- **Verification:** (C6) plants a sealed note so that a move reorders a trace file, and asserts that `trace-render --check` exits 0; run C, step C7b, exits 0
- **Committed in:** 2f8f8b65
- **Reverses:** a plan 38-10 key decision ("On the v3 layout with a valid marker the flag runs the context archive alone (no render, no marker)"). Its premise was wrong on real data.

**3. [Commit subject rule] Two commits use `fix(38-11):` subjects**
- The plan says commit subjects start `docs(38-11):` or `test(38-11):`. Commits 6cbaa209 and 2f8f8b65 are code fixes, so they use `fix(38-11):` instead.

**4. [Rule 1 - Stale doc] CHANGELOG sentence removed**
- The existing Unreleased line said that `--migrate` on a pre-v3 repository "seeds nothing under memory-bank/plans/". That was false after this phase, so it was removed in 9ae115fb, beside the one new Changed line.

---

**Total deviations:** 2 auto-fixed bugs (Rule 1), 1 stale doc sentence, 1 commit-subject exception.
**Impact on plan:** both code fixes were needed for MIGRATE-07 to complete on real data. No scope creep.

## Issues Encountered

- **Board still over budget after migrate (finding C, deferred):** 221,821 bytes against 24,576, with 205 Done rows against a budget of 20. One Done row (ABC-109) holds `<!-- RUN -->` inside a code span. The phase 37 state rules read that as an HTML comment, so the migrate skipped the Done roll with a note, as designed, and `state-roll.js` exits 2. A probe on a separate copy showed that, with the row's text replaced, the roll moves 185 rows and leaves 36,959 bytes, still over budget. Logged open in deferred-items.md (`UNKNOWN - verify`: whether a code span should count as a comment).
- **Pre-existing red gates:** `check-diff-disposition` (721 findings, unchanged; phase 38 touched no `agent-factory/` file) and `check-flip-manifest` (archived manifest). Both were red before phase 38. They are recorded in the phase gate, not marked passing.
- The local copy at /home/olger/projects/public/skytalix was only read: `git status --porcelain` printed 0 lines before and after, and HEAD stayed at `64394974`.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 38 is complete: 11 of 11 plans have a SUMMARY. It is ready for `/gsd-verify-work 38`.
- Open for a human or a later phase: finding C (phase 37 comment rule and code spans), trace order independence from the context root, and the two pre-existing red gates.

## Self-Check: PASSED

- FOUND: 38-DOGFOOD.md, deferred-items.md, docs/pre-v3-state-layout.md, install/README.md, CHANGELOG.md
- FOUND commits: 6cbaa209, 2f8f8b65, e3aba780, 9ae115fb, 5c32d2b9
- Acceptance: `archive-done-context` in the doc 3 (needs at least 1); `--dry-run` in the README 3 (needs at least 1); "arrives with the v3 migrate step" 0; `^## Phase gate` 1; branch `main`; DOGFOOD exit-code lines 23 (needs at least 6); GRUGOPS_HOME lines 4

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
