---
phase: 37-overview-board-per-file-records-and-budgets
plan: 04
subsystem: state-budgets
tags: [host-runnable, state-check, budgets, json-output, output-sanitization, read-only-proof, typescript-compiler-api]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-02: scripts/state-rules.ts (doneRowFindings, indexLineFindings, fileBytesFinding, budgetEntryNames, unmeasuredFinding, formatMarkerWarning) and checkBudgets in the validator"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-03: the embed generator, its freshness gate, and state-check measuring the board"
provides:
  - state-check.js checks every D-10 budget in checkBudgets' call order, under the marker's severity
  - "`--json`: one document { ok, marker, enforced, findings } and nothing else on stdout"
  - stripControlChars in scripts/state-rules.ts, embedded in state-check and used by its text and JSON output
  - Outside-root refusal by realpath for every state path, directory and record entry
  - A syntax-tree proof that state-check.ts calls no file-mutating API and opens nothing for writing
affects: [37-05, 37-09, 37-13, 37-19]

actuals:
  tokens: 19852
  tasks: 1
  commits: 2
plan_head_before: 152089ab23f7710fc8adef41c3ebeb68608d1373
plan_head_after: 58644f67f9821846a483ada1ff91ffccfbc9fc71

tech-stack:
  added: []
  patterns:
    - "A host runnable sanitizes findings once, right after sorting, and both output forms print from those sanitized findings, so text and JSON cannot disagree"
    - "Every state path goes through one locate() step (realpath, then a prefix check against realpath(root)) before it is stat'ed, read, listed or measured"
    - "A read-only claim is proved by walking every call expression in the runnable's syntax tree, with mutated-copy checks that the walk sees a rename, a write-flag open and a computed member call"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/state-rules.test.ts

key-decisions:
  - "The sanitizer, stripControlChars(text, multiLine), lives in scripts/state-rules.ts (import-free) and is embedded, so a later validator or runnable can use the same rule; the validator's own output is unchanged in this plan"
  - "A missing index file is a finding by name in state-check (indexEntryBytes, measured null), as plan 37-03 made a missing board a finding: state-check has no required-file check, so an absent required file must not read as clean. The validator still leaves this to its required-file error"
  - "A path that resolves outside realpath(root) is a finding by name: the board, an index file, a ticket/NFR/trace directory, a record entry or the progress file. An outside-root marker is an invalid marker by name, so findings stay warnings"
  - "Record entries are still measured by lstat on their path in the tree, as the validator does: a link inside the root is `not a regular file`, a link that leaves the root is `outside the repository root`"
  - "An unknown `--` option or a second root argument is exit 2 with usage, never a pass"
  - "Each JSON finding carries rel, key, measured, budget, unit, line (null when absent) and note (null when absent)"

patterns-established:
  - "Host-runnable tests stage FIFOs, symlinks and control-character file names through scripts/check-platform-shapes.ts (stageShapeOrSkip, stageSymlinkOrSkip, stageNameOrSkip), so a host that cannot build one prints a counted skip line"

requirements-completed: [SPLIT-05, SPLIT-04]

coverage:
  - id: D1
    description: "Each BUDGETS key broken alone prints one line naming BUDGETS.<key>: WARN with exit 0 and no marker, FINDING with exit 1 and the D-14 marker; the planter table is typed over the BUDGETS keys and sized against BUDGET_COUNT; a clean repository with a .gitkeep in each record directory prints `No findings.`"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — every BUDGETS key, under the marker's severity (plan 37-04, D-04, D-05, D-10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "`--json` prints exactly one JSON document { ok, marker, enforced, findings }; ok is false exactly when the exit code is 1; exit 2 with --json prints nothing on stdout; an unknown option is exit 2"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js --json — one document { ok, marker, enforced, findings } and nothing else (D-12)"
        status: pass
      - kind: other
        ref: "node scripts/runnable-ref/state-check.js . --json prints {\"ok\":true,\"marker\":\"absent\",\"enforced\":false,\"findings\":[]} and exits 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "A ticket file named with ESC, BEL, DEL and a C1 character prints with them removed in the text and the JSON; a root argument with control characters is echoed on stderr with them removed; stripControlChars removes all 65 control code points and keeps tab and newline only for multi-line values"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — every printed value is sanitized (T-37-07)"
        status: pass
      - kind: unit
        ref: "scripts/state-rules.test.ts#stripControlChars: control characters on the way out (plan 37-04, T-37-07)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A ticket directory, a ticket entry or the board linked outside the root is reported as outside the root and never measured; a link inside the root is not called outside; a FIFO at the board path is exit 2 naming it; a FIFO in the ticket directory is a finding by name, in bounded time"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — a path that resolves outside the root is refused by name, never measured"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — a FIFO at a state path never hangs the check (T-37-31)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The syntax tree of state-check.ts calls no write, rename, unlink, rm, rmdir, mkdir, copyFile, symlink, truncate or appendFile API, calls nothing through a computed member, imports node:fs and node:path only, and opens descriptors with O_RDONLY only"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.ts is read-only: its syntax tree calls no file-mutating API (SPLIT-05 concurrency)"
        status: pass
      - kind: other
        ref: "mutation: appending a renameSync call, an O_RDWR open and a computed-member call turned three of its five cases red; the file was restored"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 04: state-check enforces every budget Summary

**`state-check.js` now checks all nine D-10 budgets with the validator's own rules and in checkBudgets' call order. It refuses by name any state path that resolves outside the repository root. It prints every value through one embedded control-character sanitizer, emits a `--json` document `{ ok, marker, enforced, findings }`, and a test walks its syntax tree to prove it never writes.**

## Performance

- **Duration:** about 25 min
- **Started:** 2026-10-22T08:43:30Z
- **Completed:** 2026-10-22T09:08:47Z
- **Tasks:** 1 (TDD: RED commit, then GREEN)
- **Files modified:** 8

## Accomplishments

- **The embed row.** The state-check row in `EMBED_SPECS` now also embeds:
  - from install/state-layout.ts: `TICKETS_REL`, `NFR_DIR_REL`, `TRACE_DIR_REL`, `TRACEABILITY_REL`, `NFR_CATALOG_REL` and `PROGRESS_REL`;
  - from scripts/state-rules.ts: `doneRowFindings`, `indexLineFindings`, `fileBytesFinding`, `budgetEntryNames` and the new `stripControlChars`.

  EMBED_SPEC_COUNT is unchanged at 1. The region is regenerated, and the freshness gate passes.
- **The checks.** state-check follows checkBudgets' call order and inputs:
  1. the board: bytes, row characters, `_Updated:` lines and Done rows;
  2. the two index files, measured on comment-blanked lines;
  3. every name the embedded `budgetEntryNames` keeps from the raw listing of the ticket, NFR and trace directories, measured by lstat size;
  4. `60-progress.md`, where a missing file counts as clean.

  The hand-written part filters no name itself: `endsWith(".md")` appears 0 times outside the region.
- **The root boundary.** `locate()` runs realpath on each path and compares the result with realpath(root) plus a separator. A path outside the root is reported by name and never read, listed or measured. Only `ENOENT` counts as absent. Any other resolution error on a required file is exit 2. On a directory or record it is a finding by name.
- **Sanitized output.** `stripControlChars(text, multiLine)` removes all 65 control code points: C0, DEL and C1. The findings are sanitized once, right after `sortFindings`, and the text lines and the JSON document both print from those sanitized findings. Every stderr diagnostic goes through the same rule, including the echoed root argument.
- **`--json`.** stdout carries one line, `{ ok, marker: "absent"|"valid"|"invalid", enforced, findings }`, and nothing else. Each finding carries `rel`, `key`, `measured`, `budget`, `unit`, `line` and `note`. `ok` is `exitCode !== 1`. On grugops's own tree the output is `{"ok":true,"marker":"absent","enforced":false,"findings":[]}`.
- **The read-only proof.** The test parses `state-check.ts`, generated region included, with the TypeScript compiler API and walks every call expression. It refuses:
  - any write, rename, unlink, rm, rmdir, mkdir, copyFile, cp, symlink, link, truncate, appendFile, chmod/chown/utimes or write-stream call (the two standard-stream writes are allowed);
  - any computed-member call;
  - any import other than `node:fs` and `node:path`;
  - any `open`/`openSync` whose flag is not `O_RDONLY` or `"r"`.

## Task Commits

1. **Task 1 RED: failing cases for every budget, --json, sanitized output, links, FIFOs and the read-only proof:** `21d1257b` (test)
2. **Task 1 GREEN: state-check enforces every budget, prints sanitized values, emits --json, and proves it writes nothing:** `58644f67` (feat)

**Plan metadata:** recorded in the docs(37-04) completion commit.

## TDD Gate Compliance

- RED `21d1257b` comes before GREEN `58644f67`. There is no REFACTOR commit.
- **RED run:** 28 tests failed and 88 passed across state-check.test.ts and state-rules.test.ts.
  - 14 failures were AssertionErrors on the planned behavior: the budget lines were missing, and the outside-root, sanitized and FIFO-entry findings were absent.
  - 4 were `JSON.parse` SyntaxErrors, because the 37-03 program ignored `--json` and printed text. That is the missing behavior itself, not a fixture fault.
  - The rest failed because the stub `stripControlChars` returned its input unchanged.
- **Cases already green before GREEN:** the FIFO-at-board case (37-03 already stat'ed before opening) and the read-only syntax-tree cases, which are proofs and not new behavior. The syntax-tree cases were then shown to catch a mutation, as described above.
- **Not run:** the tdd-red-evidence classifier. `workflow.tdd_mode` is false, and the plan is `type: execute` with a `tdd="true"` task. Instead, the semantic assessment above comes from the real run.

## Files Created/Modified

- `scripts/runnable-ref/state-check.ts`, `.js`: the new header, and the hand-written part rewritten (locate, readState, readMarker, boardFindings, indexFindings, sizeFinding, directoryFindings, printableFinding, the JSON branch), plus the regenerated region.
- `scripts/runnable-ref/state-check.test.ts`: about 30 new cases. The 37-03 `repo()` helper now plants both index files.
- `scripts/generate-runnable-embeds.ts`, `.js`: the extended row and its doc comment.
- `scripts/state-rules.ts`, `.js`, `scripts/state-rules.test.ts`: `stripControlChars` and 4 unit tests.

## Decisions Made

See `key-decisions` above. The main ones:

- The sanitizer lives in state-rules.ts.
- A missing index file is a finding by name.
- An outside-root marker is an invalid marker.
- Record entries are measured by lstat on their path in the tree, as the validator does.
- An unknown option is exit 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The new FIFO cases spawned mkfifo directly, which turned the mkfifo census red**
- **Found during:** Task 1 (related-census run)
- **Issue:** `uat-gate-exit-contract.test.ts` requires that no test module spawns `mkfifo` itself, so every FIFO goes through the platform-shape corpus and a host that cannot make one prints a counted skip.
- **Fix:** the FIFO cases now use `stageShapeOrSkip("FIFO", …)` with a `skipLine` warning. The symlink cases use `stageSymlinkOrSkip`, and the control-character name case uses `stageNameOrSkip`, in place of `it.skipIf(win32)`.
- **Files modified:** scripts/runnable-ref/state-check.test.ts
- **Verification:** uat-gate-exit-contract.test.ts is back to its 5 baseline failures, and the mkfifo census case passes.
- **Committed in:** 58644f67

**2. [Rule 2 - Missing critical] A missing index file is a finding, and the 37-03 `repo()` helper plants both index files**
- **Found during:** Task 1
- **Issue:** state-check has no required-file check. Without a finding, a missing traceability.md or nfr-catalog.md would read as clean.
- **Fix:** the missing file is an `unmeasuredFinding` under `indexEntryBytes`. Since the 37-03 board cases measure the board alone, their helper now plants both index files.
- **Files modified:** scripts/runnable-ref/state-check.ts, scripts/runnable-ref/state-check.test.ts
- **Committed in:** 21d1257b (helper), 58644f67 (rule)

**3. [Rule 2 - Missing critical] Unknown options are refused**
- **Found during:** Task 1
- **Issue:** a mistyped `--jsno` would have run the text form and exited 0.
- **Fix:** exit 2 with `Usage: node state-check.js <repo-root> [--json]`. A second root argument is exit 2 as well.
- **Committed in:** 58644f67

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical). **Impact:** no scope change.

**Census pins:** none moved. No file was added, so the pins in check-foundation-guards, check-state-paths, nonblocking-reader-parity and mode-census held, and all of them passed unchanged.

## Issues Encountered

- **Bootstrap order.** `npm run generate:runnable-embeds` compiles first and runs the committed generator `.js`. The new hand-written part named embeds that did not exist yet, so neither step could run. The fix: temporary `declare` placeholders inside the region, then `npm run build` to emit the new generator, then the generator run, which replaced the region and removed every placeholder (0 `declare` lines left).
- One vitest run was moved to the background by the harness's 120 s limit. No second vitest process was started while it ran.

## Verification

- `npm run build`, `npm run typecheck`: exit 0.
- Plan verification 1, `npx vitest run scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/state-rules.test.ts scripts/validate.test.ts scripts/check-state-paths.test.ts scripts/nonblocking-reader-parity.test.ts scripts/check-foundation-guards.test.ts install/mode-census.test.ts --maxWorkers=1`: 8 files, 699 passed. This run came before the platform-shape fix, which touched only state-check.test.ts. After the fix, the same set minus validate.test.ts, plus check-platform-shapes.test.ts, gave 8 files and 542 passed.
- Related censuses: board-readonly, uat-gate-exit-contract, context-io, context-io-writer-set, freshness, host-protection and uat-spec-integrity. 14 failed, all in the 37-BASELINE list (2 + 7 + 5). Nothing new.
- Plan verification 2:
  - `npm run freshness`: exit 0.
  - `node scripts/runnable-embeds-freshness.js`: 1 target fresh.
  - `npm run freshness:hook-manifest`: exit 0.
- Plan verification 3, all exit 0:
  - `node scripts/check-state-paths.js`
  - `node scripts/check-foundation-guards.js`
  - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`
  - `node scripts/check-nul-bytes.js`
- Acceptance criteria:
  - The JSON `ok && marker === "absent"` probe on the own tree: exit 0.
  - The mutating-API grep on state-check.ts: 0.
  - `export function budgetEntryNames` in state-check.ts: 1.
  - `endsWith(".md")` outside the region: 0.
- Not run: the full non-e2e suite (project rule: plans 37-08, 37-13 and 37-19 run it).

## User Setup Required

None.

## Next Phase Readiness

- state-check is still not copied into `tools/grugops/` by the installer. RUNNABLES and its mirror are unchanged, as the plan did not ask for it.
- Plans 37-05 and 37-09 can add EMBED_SPECS rows. Their runnables can embed `stripControlChars` for their own output.
- The validator still prints file names unsanitized. A follow-up could route its budget lines through `stripControlChars`.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All eight modified key files exist on disk. Commits 21d1257b and 58644f67 are ancestors of HEAD. Every acceptance criterion and plan verification command above passed.
