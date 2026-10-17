---
phase: 32-board-projector-cli-dashboard
plan: 14
subsystem: testing
tags: [adversarial-review, ast, safety-guard, node-fs, verification, dash-06]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "the five gap-closure fixes of round 1 (32-09, 32-10, 32-12, 32-13, 32-11) and the verifier's own reproduction transcripts in 32-VERIFICATION.md"
provides:
  - "32-14-ADVERSARIAL-REVIEW.md — every verifier transcript re-measured against the rebuilt committed .js, with the command that produced each cell"
  - "Six reachability sections answering how each gate is REACHED, what its predicate's input is assembled from, at which positions it is asked, and which legitimate inputs each changed arm was probed with"
  - "A 13-row reachable-branch table with zero UNPROVEN rows, distinguishing branches executed here from branches cited to a green named case"
  - "A seven-attempt neighbour-variation set, two of which bypassed"
  - "F-02 CLOSED: the fs namespace RE-ENTRY rule asked at all FOUR positions a member name enters fsSymbols, not two — mutation-proven with two mutants"
  - "F-03 and F-01 recorded OPEN with reproductions, and logged to .planning/WINDOWS.md"
  - "A package.json-derived gate sweep with the one pre-existing red cited rather than absorbed"
affects: [phase-32-verification-round-2, board-projector, dash-06]

actuals:
  tokens: 15218
  tasks: 3
  commits: 3
plan_head_before: 2a55b0b02e44b8734d940fd9e9a98d17155af2ec

tech-stack:
  added: []
  patterns:
    - "Ask WHERE a predicate is asked, not only what it refuses: enumerate every syntactic position that can introduce the value the predicate governs, then check each"
    - "Route every introduction of a governed value through one helper, and mutation-prove the helper at each position SEPARATELY (delete the rule → N red; revert one position → exactly that position's rows red)"
    - "Differential fs-op counting under `node --trace-event-categories node.fs.sync` to measure 'how many read attempts' without a privileged tracer"
    - "Separate `measured here` from `cited to a green case` in an evidence table, rather than flattening both into `proven`"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-14-ADVERSARIAL-REVIEW.md
  modified:
    - scripts/board-readonly.test.ts
    - .planning/ROADMAP.md
    - .planning/WINDOWS.md

key-decisions:
  - "F-02 is closed by asking the EXISTING runtime-derived NAMESPACE_REENTRY_MEMBERS predicate at the two positions it was not asked at, through one `noteFsMember` chokepoint — no new rule, no denylist, no third set."
  - "F-03 (`process.getBuiltinModule(\"node:\" + \"fs\")`) is left OPEN. Closing it needs constant folding or a callee denylist; the second is the heuristic-per-counter-example shape the file's own docblock refuses, and neither is a small closure. The 4-round budget is what makes recording it safe."
  - "F-01 is left OPEN because its fix belongs in scripts/check-foundation-guards.test.ts, a file no plan in this round owns — a fifth fix in a sixth file is what the round budget forbids."
  - "The review separates branches EXECUTED in this round from branches CITED to a green named case. Four of thirteen rows are cited; flattening them into one `proven` column is the conflation this repository has been burned by."
  - "REQUIREMENTS.md is byte-unchanged and the Phase 32 milestone checkbox stays unchecked. The review's verdict line states what was measured, never what it concludes about the phase."

patterns-established:
  - "Position census: for a predicate governing a value, enumerate the syntactic positions that introduce that value and assert the predicate is asked at each — the F-02 class"
  - "Per-position mutation: one mutant per arm plus one mutant per position, so a chokepoint is shown load-bearing at each site separately rather than only in aggregate"

requirements-completed: []

coverage:
  - id: D1
    description: "Every reproduction the verifier recorded — CR-01's guard probe, CR-02's chmod run, CR-04's symlink run, CR-05's escape planting, CR-06's file read, and CR-03's previously-unexecuted case — has a measured post-fix result beside its pre-fix one, taken from the rebuilt committed .js"
    requirement: "DASH-01"
    verification:
      - kind: integration
        ref: "32-14-ADVERSARIAL-REVIEW.md section 1 — six rows, each with the command that produced its cell"
        status: pass
      - kind: integration
        ref: "npm run build && npm run check:build-parity → exit 0, 'no tracked build output moved when tsc ran' (recorded as the harness's own premise in section 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All five behavioral spot-checks re-run verbatim, including the two that previously PASSED, with no regression in either"
    requirement: "DASH-07"
    verification:
      - kind: e2e
        ref: "node scripts/board-dashboard.js <fixture> --once --json → exactly 1 parseable line, schemaVersion 1"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js <fixture> --once → exit 0 with 9 conflicts (the committed golden's own conflict set)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/board-*.test.ts scripts/validate.test.ts → 9 files, 548 tests (was 8 files, 352)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every new refusal branch this round added is shown reachable by an input that takes it, or recorded UNPROVEN — the table has 13 rows and ZERO UNPROVEN"
    requirement: "DASH-05"
    verification:
      - kind: integration
        ref: "32-14-ADVERSARIAL-REVIEW.md section 4 — 9 rows executed in this round, 4 cited to a green named case, 0 unproven"
        status: pass
    human_judgment: false
  - id: D4
    description: "F-02 closed: the fs namespace re-entry rule is asked at the named-import and named-re-export positions, so a writer reached through `import { promises } from \"node:fs\"` is refused by the mechanism rather than caught by a cardinality pin"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#fs acquisition is REFUSED: import { promises } from \"node:fs\" — a NAMED IMPORT of a namespace re-entry member"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#fs acquisition is REFUSED: export { promises } from \"node:fs\" — the same re-entry as a NAMED RE-EXPORT"
        status: pass
      - kind: integration
        ref: "the plant re-run post-fix: opaqueFsAcquisitions ['scripts/board-read.js: promises as fsp'], npm run check:dashboard-readonly exit 1"
        status: pass
      - kind: other
        ref: "MUTANT E (delete the re-entry arm) → exactly 4 red; MUTANT F (revert only positions 3 and 4) → exactly the 2 new rows red"
        status: pass
    human_judgment: false
  - id: D5
    description: "The neighbour-variation set is attempted and every attempt recorded with its result, including the two that bypassed"
    requirement: "DASH-05"
    verification:
      - kind: integration
        ref: "32-14-ADVERSARIAL-REVIEW.md section 5 — ENOTDIR, a two-byte invalid UTF-8 sequence, two symlink-chain shapes, a re-opening frontmatter region, and two fs-namespace shapes outside the enumeration"
        status: pass
    human_judgment: false
  - id: D6
    description: "The gate sweep's row set is derived from package.json's scripts object; the one pre-existing red is cited with its evidence and re-derived rather than absorbed; the zero-dependency invariant is recorded as a checkable line"
    requirement: "DASH-08"
    verification:
      - kind: integration
        ref: "20 gates run, 19 exit 0; check:diff-disposition exit 1 with its 78 findings re-derived to five Phase-31 workflow documents and zero files this round touched"
        status: pass
      - kind: integration
        ref: "require('./package.json').dependencies === undefined; devDependencies = @types/node, typescript, vitest"
        status: pass
    human_judgment: false
  - id: D7
    description: "F-03 and F-01 are left OPEN with reproductions rather than omitted, and the review's verdict line says the round ends with open findings"
    verification:
      - kind: other
        ref: "32-14-ADVERSARIAL-REVIEW.md section 6 (F-03, F-01) and section 8 (verdict line); both logged to .planning/WINDOWS.md as ids 180-182"
        status: pass
    human_judgment: true
    rationale: "Whether F-03 — a shipped safety gate that exits 0 over a module that writes files, via a documented and bounded residual — is an acceptable state in which to close Phase 32 is a risk acceptance a human owns. No test can make that judgment, and this plan deliberately does not make it either."
  - id: D8
    description: "Nothing in the tracking files claims a completion the verifier has not decided"
    verification:
      - kind: other
        ref: "git diff --exit-code -- .planning/REQUIREMENTS.md → exit 0, run while the change was still uncommitted; grep -c '^- \\[ \\] \\*\\*Phase 32:' .planning/ROADMAP.md → 1; grep -c '^| DASH-0[1-8] | Phase 32 | Gaps Found |' .planning/REQUIREMENTS.md → 8"
        status: pass
    human_judgment: false

duration: 34 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 14: Adversarial Re-Verification of Gap-Closure Round 1 Summary

**All six of the verifier's findings reproduce as CLOSED against the rebuilt committed `.js` — and the round's own neighbour probe found the previous fix one register too narrow again: the fs re-entry rule 32-11 added was asked at two of the four positions a member name enters the symbol set, so `import { promises } from "node:fs"` reached every writer in `node:fs` while `opaqueFsAcquisitions` stayed empty and only a cardinality pin stood in the way.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-14T23:26:05Z
- **Completed:** 2026-09-15T00:00:00Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **Every verifier transcript re-measured against the rebuilt artifact, with the build-parity premise recorded first.** CR-01's destructure probe now reds the gate through `opaqueFsAcquisitions`; CR-02's EACCES now produces a `[stale] STALE: tickets (never read, EACCES)` badge, one `readErrors` entry and **zero** `row-without-file` conflicts (was 8 fabricated); CR-04's symlink leaks **0 marker bytes on stdout and 0 on stderr** (was 1 and 1); CR-05's two escape reproductions produce **0 control code points** on stderr (was 3 and 4); CR-06's second reader is gone from both the `.ts` and the committed `.js`.
- **CR-03 was executed for the first time.** The verifier read the code but did not run it. Run here: a board carrying one `0xE9` byte reports `unreadable`/`ENCODING`, and the read count was measured **differentially** under `node --trace-event-categories node.fs.sync` — the undecodable tree and a valid-UTF-8 tree of identical length both report `open=36 read=36 stat=56`, so a decode failure costs exactly one read and the "3 reads + 6 stats forever" half of CR-03 is closed too.
- **A live bypass of the phase's load-bearing safety control, found and closed (F-02).** `promises` and `default` are themselves namespaces holding every writer in `node:fs`. Plan 32-11 refused them at a property access and at a string-literal element access. A **named import** and a **named re-export** were never asked. Measured pre-fix: the plant left `opaqueFsAcquisitions` empty and the mutating intersection empty (`promises` matches none of the 16 write-class stems); the guard reddened only on the cardinality pin, whose own message invites a maintainer to add the symbol to `EXPECTED_CLOSURE_FS_SYMBOLS` and re-green the guard **in one edit** over a full writer.
- **The fix is the same predicate asked where it was not asked**, through one `noteFsMember` chokepoint, over the same runtime-derived set. Two mutants prove it discriminates per position: MUTANT E (delete the re-entry arm) reds exactly 4 rows; MUTANT F (revert only the two new positions) reds exactly the 2 new rows and nothing else.
- **A second bypass measured and left open honestly (F-03).** `process.getBuiltinModule("node:" + "fs")` plus a `writeFileSync` call, planted into the committed `scripts/board-read.js`, leaves `npm run check:dashboard-readonly` at **exit 0, 57/57 green, over a module that writes files.** 32-11 named this residual from the shape of the rule; it had never been executed. It is executed here, and the assertion holds.
- **Six reachability sections and a 13-row branch table with zero UNPROVEN rows.** Four rows are marked **cited** rather than measured-here, because "a case exists and is green" and "I watched this branch take an input" are different evidence.
- **A `package.json`-derived gate sweep**: 20 gates, 19 green. `check:diff-disposition`'s red is cited to `deferred-items.md`'s detached-worktree evidence at `6d59ed1e` **and re-derived** — its 78 findings name five Phase-31 workflow documents and zero files this round touched.

## Task Commits

1. **Task 1: re-run every verifier transcript against the rebuilt artifact** — `e83c8566` (docs)
2. **Task 2: reachability, the branch table, the neighbour set, and the F-02 closure** — `c181fe84` (fix)
3. **Task 3: the gate sweep and bookkeeping that stops short of claiming completion** — `3670d9ec` (docs)

**Plan metadata:** the `docs(32-14)` commit that carries this file.

_Measured, not narrated: `git rev-list --count 2a55b0b0..HEAD` = 3 at the time this summary was written, which is the three task commits. This file's own commit brings the plan to 4._

## Files Created/Modified

- `.planning/phases/32-board-projector-cli-dashboard/32-14-ADVERSARIAL-REVIEW.md` (created) — nine sections: the harness premise, the six-row before/after table, the five spot-checks, six reachability sections, the branch table, the neighbour set, the three findings, the gate sweep, the round-budget verdict, and a what-to-check-first note.
- `scripts/board-readonly.test.ts` (modified, +53/-11) — `noteFsMember`, the re-entry predicate asked at all four positions, and two new `ACQUISITION_SHAPES` rows (`ACQUISITION_SHAPE_COUNT` 6 → 8, moved as named rows).
- `.planning/ROADMAP.md` (modified) — 32-14's box ticked and three `Scope moved` notes. The milestone checklist entry and the phase status are untouched.
- `.planning/WINDOWS.md` (modified) — F-03, F-01 and the stale `deferred-items.md` entry logged as open (ids 180–182).

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: **F-02 was closed by asking the existing predicate at the missing positions, not by adding a rule.** The alternative — a third check keyed on "named imports of dangerous names" — would have been a fourth spelling of a question the file already answers in two places, which is the shape this repository has spent eight rounds on twice.

The second: **F-03 and F-01 are recorded open rather than closed, and the round says so in its verdict line.** The pressure at the end of a round is to omit a finding. The 4-round cap is what makes recording it safe; the plan named this as the single behaviour it exists to prevent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The fs re-entry rule was asked at two of four positions (F-02)**

- **Found during:** Task 2, the neighbour-variation probe (N5a)
- **Issue:** `NAMESPACE_REENTRY_MEMBERS` was consulted at a property access and a string-literal element access on an fs namespace, but not at a named import or a named re-export from an fs specifier. `import { promises as fsp } from "node:fs"; fsp.writeFile(p, "x")` planted into the committed `scripts/board-read.js` therefore produced an EMPTY `opaqueFsAcquisitions` and an empty mutating intersection; the guard reddened only on the MEMBERS/COUNT cardinality pin, which a maintainer can clear in one edit.
- **Fix:** one `noteFsMember(name, sourceText)` helper asking the same runtime-derived set at all four positions; the computed-key arm keeps its own refusal because it carries no name to ask about. Two `ACQUISITION_SHAPES` rows added with their sources; `ACQUISITION_SHAPE_COUNT` 6 → 8.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** the plant is now refused by the mechanism (`opaqueFsAcquisitions: ["scripts/board-read.js: promises as fsp"]`, exit 1); unplanted gate 59/59 green with `EXPECTED_CLOSURE_FS_SYMBOLS` unmoved at 6; MUTANT E reds exactly 4, MUTANT F exactly 2; typecheck and build parity exit 0; full suite 74 files / 4811 passed.
- **Committed in:** `c181fe84`

This is the plan's explicitly authorised case: a bypass closeable inside a file this round already owns (`scripts/board-readonly.test.ts`, plan 32-11). No production code was modified by this plan.

### Documented departures from the plan's literal wording

- **CR-02's acceptance criterion names a `readErrors` length of 1; the measured length is 2.** One entry is the tickets EACCES (the substantive claim, measured with `select(.source == "tickets")` → 1). The second is the fixture's own deliberately tampered claim record, present before and after and unrelated. `32-09-SUMMARY.md` recorded the identical departure. Stated in the review file rather than smoothed over.
- **Task 1's criterion "CR-01's row records a non-empty `opaqueFsAcquisitions`" is met, but `fsSymbols` and `bareSpecifiers` correctly did NOT move** — which is the point rather than a regression, and is written out in the review's "honest departures" block.
- **Three of CR-01's four red cases are collateral, not independent detections.** With the probe in the committed closure, the mirror-based cases inherit it. Counting 4 reds as 4 detections would overstate the evidence, so the review says so.
- **The executor's `requirements.mark-complete` step was deliberately NOT run.** This plan's Task 3 forbids any change to `.planning/REQUIREMENTS.md`, and `git diff --exit-code` on that file was run while the change set was still uncommitted (exit 0) so the check is not vacuous.

---

**Total deviations:** 1 auto-fixed (Rule 2), 4 wording departures recorded.
**Impact on plan:** the auto-fix closed a live bypass of the phase's stated safety centrepiece, inside a file the round already owns, with mutation-proven discrimination. No production code changed and no published shape moved.

## Known Stubs

None. No placeholder, no `TODO`/`FIXME`, no skipped test was introduced. The suite's 2 skipped cases are pre-existing root-privilege skips.

## Open Residuals (recorded, not closed)

- **F-03 — `npm run check:dashboard-readonly` exits 0 over a writer acquired through `process.getBuiltinModule("node:" + "fs")`.** Named by 32-11 from the shape of the rule; **measured here for the first time**. Bounded by: reaching it requires an attacker who can already add a module to the dashboard's import closure and rebuild the committed `.js` past `check:build-parity`. Logged to `.planning/WINDOWS.md`.
- **F-01 — the `check:*` CI-reachability derivation cannot see `check:dashboard-readonly`.** `scripts/check-foundation-guards.test.ts:12009` extracts `node scripts/*.js` from each `check:*` command and skips the script when that does not match; `check:dashboard-readonly` is `npx vitest run …`, so it is skipped, while the comment beside the skip describes only `check:build-parity`. **No live bypass** — the file is in the default vitest suite CI runs unconditionally at `ci.yml:174` — but the mechanical proof of reachability is absent for exactly the gate it matters most for. Out of round budget: the fix belongs in a file no plan here owns.
- **`deferred-items.md`'s `check:nul-bytes` entry is STALE.** The gate is green (2043 files); the literal ESC was removed by user commit `888a1302` during this round. The entry still reads `status: open`. Not edited from a plan that owns neither the file nor the fix.
- **`check:diff-disposition` remains RED and pre-existing**, five Phase-31 workflow documents, unchanged finding set, no file this round touched.
- **The hard-link residual (32-10)** and **the `same-file key-set` census boundary (32-12)** are unchanged by this plan and remain as those plans recorded them.

## Threat Flags

None. No new endpoint, auth path, file-access pattern or schema at a trust boundary. The one code change narrows an existing refusal rule's blind spots.

## Issues Encountered

- **Executing on `main`.** The generic executor protocol treats a commit on the default branch as fatal. This project's `.planning/config.json` sets `git.branching_strategy: "none"`, the orchestrator dispatched this plan as a sequential executor on the main working tree, and every preceding Phase 32 plan committed the same way. Recorded rather than silently accepted, as 32-11 did.
- **`analyzeModule` is not exported from `scripts/board-readonly.test.ts`,** so the three sets CR-01's row asks for could not be read out of a direct call. Rather than re-implement the derivation (a second spelling is the defect class this phase exists to remove), the probe was planted into the committed `scripts/board-read.js` and the **real gate** was run, with the sets read out of the gate's own failure output and the file restored and sha256-verified. That is a stronger instrument than the verifier's re-derivation, and the review says which one it used.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Round 2 of verification can start from `32-14-ADVERSARIAL-REVIEW.md` section 9**, which names in order the six things to check first, beginning with the build-parity premise and F-03's reproduction.
- **Two findings are open.** A verifier deciding Phase 32 should weigh F-03 explicitly: the DASH-06 gate is green over a module that writes files, through a bounded and documented route. That is a risk acceptance, not a test result.
- **Nothing here claims phase completion.** `.planning/REQUIREMENTS.md` is byte-unchanged (all eight DASH rows still read `Gaps Found`, all eight checkboxes still `[ ]`), and the Phase 32 milestone entry in `.planning/ROADMAP.md` is still unchecked.
- **Round budget: 1 of 4 used.** Three rounds remain under the cap recorded after Phase 31.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- `.planning/phases/32-board-projector-cli-dashboard/32-14-ADVERSARIAL-REVIEW.md` — FOUND on disk.
- `scripts/board-readonly.test.ts` — FOUND, carries `noteFsMember` and `ACQUISITION_SHAPE_COUNT = 8`.
- Commits `e83c8566`, `c181fe84`, `3670d9ec` — all resolve in `git log`.
- `git rev-list --count 2a55b0b0..HEAD` = 3 at write time, matching `actuals.commits`.
- Plan verification steps re-run at close: build + typecheck + build-parity exit 0; `npx vitest run --exclude '**/scripts/e2e/**'` 74 files / 4811 passed / 2 skipped; `npm run check:dashboard-readonly` 59 passed; validator and foundation guards `ALL CHECKS PASSED`; `git diff --exit-code -- .planning/REQUIREMENTS.md` exit 0.
- Working tree carries only the four pre-existing user files this executor was told not to touch.
