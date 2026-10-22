---
phase: 37-overview-board-per-file-records-and-budgets
verified: 2026-10-22T21:30:00Z
status: gaps_found
score: 9/13 must-haves verified
covered_files:
  - ".github/workflows/ci.yml"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-01-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-01-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-02-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-02-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-03-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-03-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-04-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-04-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-05-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-05-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-06-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-06-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-07-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-07-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-08-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-08-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-09-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-09-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-10-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-10-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-11-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-11-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-12-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-12-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-13-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-13-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-14-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-14-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-15-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-15-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-16-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-16-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-17-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-17-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-18-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-18-SUMMARY.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-19-PLAN.md"
  - ".planning/phases/37-overview-board-per-file-records-and-budgets/37-19-SUMMARY.md"
  - "agent-factory/_commit-convention.md"
  - "agent-factory/contracts/board.md"
  - "agent-factory/workflows/02-idea-to-epics.md"
  - "agent-factory/workflows/03-epic-to-tickets.md"
  - "install/state-layout.ts"
  - "scripts/board-model.ts"
  - "scripts/board-read.ts"
  - "scripts/runnable-ref/state-check.ts"
  - "scripts/runnable-ref/state-roll.ts"
  - "scripts/runnable-ref/trace-render.ts"
  - "scripts/state-rules.ts"
  - "scripts/trace-model.ts"
  - "scripts/validate-agent-factory.ts"
covered_digest: "v3:sha256:0e00fd6c10aabf345d7c1f844b6aa47db7b748329ffda9e270faa2f1efa187c6"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
gaps:
  - truth: "Honest freshness (37-06, 37-07, 37-08, 37-09; threat T-37-30; CLAUDE.md no-fabrication): an incomplete read of the notes is never reported as a fresh trace, and a could-not-run is never read as a pass"
    status: failed
    reason: "CR-01 reproduced. A task whose notes directory cannot be read (EACCES) is caught and counted, but it is treated as 'this ticket has no notes'. The write mode of trace-render.js then REMOVES that ticket's rendered trace file and drops its index line, exit 0. Afterwards both `trace-render.js --check` and `state-check.js` print 'The trace is fresh' with 'No findings', exit 0, marker valid, while the line 'UNREADABLE TASK ...' is shown beside them. Workflow 05 commits the rendered files on the PR branch, so the removal is committed. T-37-30 is the exact threat 'state-check reporting a host's trace as fresh when it did not compare'."
    artifacts:
      - path: "scripts/runnable-ref/trace-render.ts"
        issue: "failedTasks and the I/O skip arms (unopenable, not-a-regular-file, above-ceiling, vanished) do not stop the write mode or turn --check into a finding; the compare runs on the partial read"
      - path: "scripts/runnable-ref/state-check.ts"
        issue: "traceReport raises no finding and no could-not-run for a failed task; trace.compared stays true"
      - path: "scripts/trace-model.ts"
        issue: "collectTraceNotes returns failedTasks but compareTraceTree/planTraceTree have no notion of an incomplete read"
    missing:
      - "write mode: when any task failed or an I/O skip arm fired, write and remove nothing and exit 2 (could not run)"
      - "--check and state-check: a failed task is exit 2 / a named finding, never a fresh pass; trace.compared false"
      - "a test that renders, makes a task unreadable, re-renders, and asserts the old trace file still exists and the exit code is not 0 (existing tests only cover a refused task NAME)"
  - truth: "Exit contract (37-06, 37-07, header of trace-render.ts): trace-render exits 2 when it could not run, and trace-freshness maps only exit 1 to stale"
    status: failed
    reason: "CR-02 reproduced. A context root that exists but cannot be listed (mode 000) makes trace-render.js, in write mode and with --check, die with an uncaught node:fs EACCES stack trace and exit 1 (the 'finding' code), while state-check.js on the same tree correctly exits 2. scripts/trace-freshness.ts reads exit 1 as stale and tells the user to re-render and commit. The gate still fails closed (no false pass), but the code and the remedy are wrong."
    artifacts:
      - path: "scripts/runnable-ref/trace-render.ts"
        issue: "listTasks calls readdirSync with no try/catch, outside collectTraceNotes' per-task try; no top-level catch converts an unexpected throw to exit 2"
    missing:
      - "catch the listing error and call couldNotRun (exit 2), and wrap the hand-written top level in a try/catch that does the same"
      - "a test for an unreadable context root in both modes"
  - truth: "SPLIT-03 at workflow level (37-15, 37-17): no workflow tells an agent to append to the trace by hand, and the commit convention names the rendered trace files instead of the old word"
    status: partial
    reason: "Roles are clean (no role file instructs a hand append; every role's Trace updates section names the render). But three stale sentences remain outside the permanent scan, because its patterns need the word 'traceability': agent-factory/workflows/02-idea-to-epics.md:41 'the trace rows are appended' (Done condition, contradicting the same file's Trace updates section at line 31-32); agent-factory/workflows/03-epic-to-tickets.md:9 'a trace row before it can be pulled'; agent-factory/_commit-convention.md:52 example commit 'write trace row'. 37-SECURITY.md records the first two as T-37-27 (open, below threshold). The roadmap SC wording ('no role tells an agent') holds; the 37-17 truth ('no workflow tells an agent to append to the trace by hand') does not."
    artifacts:
      - path: "agent-factory/workflows/02-idea-to-epics.md"
        issue: "line 41 says the trace rows are appended"
      - path: "agent-factory/workflows/03-epic-to-tickets.md"
        issue: "line 9 makes 'a trace row' a pull precondition"
      - path: "agent-factory/_commit-convention.md"
        issue: "line 52 example commit message says 'write trace row'"
    missing:
      - "reword the three sentences to the rendered-from-refs form, regenerate adapters/catalog/skill-twins, and widen scripts/trace-instructions.test.ts with a pattern for passive 'trace row(s) ... appended/written/added' wording"
deferred: []
advisory: []
human_verification:
  - test: "CI reachability of the new own-tree gates"
    expected: "On a pushed branch the ubuntu 'Freshness gates + repo gates' step reaches `node scripts/runnable-ref/state-check.js .` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`"
    why_human: "Both lines sit AFTER `node scripts/check-diff-disposition.js` and `node scripts/check-flip-manifest.js` in one `run: |` block (bash -e, fail-fast). Both of those exit 1 on this tree today (pre-existing, not phase-37 caused; confirmed by running them). So on CI the two phase-37 lines are wired but unreachable until a human decides how to clear the two older reds (disposition rows or a moved base; flip-manifest reading an archived phase-33 file). Locally both phase-37 commands exit 0."
  - test: "Live host run of the PR-gate and daily-sweep sub-steps (planned non-blocking item, 37-VALIDATION Manual-Only, 37-19 'Human verification pending')"
    expected: "On a real host remote: trace-render exits 0, state-check prints the marker valid and exits 0, and the workflow step records the exit code without blocking the gate"
    why_human: "Needs a live CI run on a host remote; nothing has been pushed. The local half (scratch install with GRUGOPS_HOME and HOME set, then both runnables) was run by this verifier and passed (see Behavioral Spot-Checks)."
---

# Phase 37: Overview board, per-file records and budgets - Verification Report

**Phase Goal:** State files stay small: the board is a one-line-per-ticket overview, NFRs and traceability are one file per record with one-line indexes, and byte budgets are checked both in grugops and in every host repo.
**Verified:** 2026-10-22T21:30:00Z
**Status:** gaps_found
**Re-verification:** No, initial verification

## Summary

The phase goal is delivered in its core: the contract-first board overview, per-file NFR and trace records with one-line indexes, the nine budgets in one authority, the validator (WARN unmigrated, FAIL migrated), three single-file host runnables (`state-check`, `trace-render`, `state-roll`), the archive and move-only rules, the seventh reader source, and the own-tree marker all exist, are wired, and work when exercised. The five roadmap success criteria hold. Three narrower plan-level truths do not hold, two of them on the trace path, and one of those (CR-01) lets a runnable report a trace as fresh after an incomplete read, which is the very outcome threat T-37-30 was written to prevent. That is why the status is `gaps_found` and not `passed`.

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | SC1 (SPLIT-01, SPLIT-07): board contract changed first; board is one short row per ticket per column, at most one `_Updated:` line, blocked reasons in the ticket body; closed 8-key set | VERIFIED | Commit order efadaf11 (D-14/D-15 in CONTEXT), f8ff84f2 (contract), b879f7f0 (constants) precede every reader/seed/validator/role edit. `agent-factory/contracts/board.md` has `## Overview and budgets`, `### Budgets` table, `## Blocked` and `## Board notes` body sections. `TICKET_KEY_COUNT = 8` unchanged (board-model.ts:974). Seed board has the overview form row and the OVERVIEW comment. |
| 2  | SC2 (SPLIT-02, SPLIT-03): each NFR its own file, each ticket its own rendered trace file, both with one-line indexes; no role tells an agent to append to traceability by hand | VERIFIED (roles); see gap 3 for workflow residue | `grep` of `agent-factory/roles/*.md`: every `## Trace updates` publishes refs and names `tools/grugops/trace-render.js`; zero hand-append instruction. Fresh install: `memory-bank/plans/nfr/`, `traceability/`, `archive/` seeded; NFR index checked both ways by state-check (planted file without line -> `nfr-unindexed-file`; line without file -> `nfr-missing-file`, exit 1 under the marker). |
| 3  | SC3 (SPLIT-04): validator enforces all nine budgets, WARN unmigrated, FAIL migrated | VERIFIED | `BUDGETS` has 9 keys, `BUDGET_COUNT = 9`; `scripts/state-rules.ts` owns the rules; `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` exits 0 bare and with `--strict`; validate.test.ts (passed) grows a copy of the own memory-bank past `BUDGETS.boardBytes`: exit 1 with marker, exit 0 + WARNING without. |
| 4  | SC4 (SPLIT-05): `tools/grugops/state-check.js` on hosts, budgets generated from the layout module, freshness-gated, checks budgets and index-to-file integrity, called by PR gate and daily sweep | VERIFIED | `npm run freshness:runnable-embeds`: 3 targets fresh. Installer materializes 7 runnables (scratch install listed state-check, state-roll, trace-render beside the four). WF05 step 3 and WF09 steps 1-2 call trace-render then state-check; D-12 wording present (exit 1 recorded as `observation`, exit 2 / no exit code = could-not-run). state-check AST read-only test passes. |
| 5  | SC5 (SPLIT-06): progress rolls into an archive when over budget; `queue/done/` and `50-decisions/` move-only | VERIFIED | Scratch run: 25 Done rows -> state-check printed `ROLLABLE`, `state-roll` moved 5 rows to `memory-bank/plans/archive/board-done.md` with a line-conservation proof, re-check clean. WF09 states move-only (`.grugops/archive/queue-done/`, `memory-bank/plans/archive/decisions/`), no squash or prune; state-check prints live/archived counts and flags a name in both. No prune/squash wording for either folder anywhere in `agent-factory/`. |
| 6  | Contract-first decisions D-14/D-15/D-16: marker `memory-bank/plans/.layout` = `layout: v3`; seventh reader source `boardArchive`; snapshot version 3; seven conflict kinds | VERIFIED | `LAYOUT_MARKER_REL`, `LAYOUT_MARKER_CONTENT = "layout: v3"` in state-layout.ts; `SCHEMA_VERSION = 3`, `CONFLICT_KIND_COUNT = 7` in board-model.ts; contract `## The Done archive` section; board-read/board-model/board-corpus/board-readonly tests pass. |
| 7  | Host runnables are single-file, builtins-only; fresh install is valid | VERIFIED | Scratch install (GRUGOPS_HOME and HOME in scratch): marker `layout: v3`, `state-check.js .` exit 0 "No findings", `trace-render.js . --check` exit 0. state-check.test.ts, trace-render.test.ts, state-roll.test.ts (host-emulation copies) pass. |
| 8  | Severity follows the marker (D-04/D-05) in state-check | VERIFIED | Same scratch repo, board grown past budget: marker present -> `FINDING ... (BUDGETS.boardBytes)` exit 1; marker removed -> `LAYOUT` WARN line, exit 0. |
| 9  | D-06 / 37-19: own repo carries the marker, validator FAIL mode non-vacuous, own state in v3 forms | VERIFIED | `memory-bank/plans/.layout` = `layout: v3` (commit 9cffa7ab); `state-check.js .` and validator exit 0; own board/nfr-catalog/traceability are the seed forms; `nfr/`, `archive/`, `traceability/` tracked via `.gitkeep`. |
| 10 | Honest freshness: an incomplete read is never reported as a fresh trace (T-37-30, 37-07, 37-09) | FAILED (BLOCKER) | See Gap 1. Reproduced in a scratch repo: after `chmod 000` on a task's `notes/`, `trace-render.js` exit 0 `REMOVED memory-bank/plans/traceability/ABC-1.md`; then `--check` exit 0 and `state-check.js` exit 0 "The trace is fresh ... No findings" with `ok: true`, `trace.compared: true`. |
| 11 | Exit contract: trace-render exits 2 for could-not-run (37-06, 37-07) | FAILED | See Gap 2. Context root mode 000: `trace-render.js` and `--check` both exit 1 with a node:fs stack trace; state-check exits 2 on the same tree. |
| 12 | No workflow or commit convention tells an agent to append to the trace by hand (37-15, 37-17) | PARTIAL (WARNING-level, listed as gap) | See Gap 3. Three residual sentences. |
| 13 | 37-19: CI runs state-check and the validator on the own tree, so CI proves FAIL mode | PRESENT, REACHABILITY UNCERTAIN (WARNING, human) | Lines present in `.github/workflows/ci.yml:605-606`, asserted by a test, and exit 0 locally; but they follow `check-diff-disposition` (exit 1) and `check-flip-manifest` (exit 1) in one fail-fast block. Not counted in the score. |

**Score:** 9/13 truths verified (truths 10, 11, 12 failed or partial; truth 13 unreached on CI and routed to a human).

### CR-01 and CR-02: do they break a must-have?

- **CR-01: yes, it breaks a must-have.** Reproduced with the committed `.js` in a scratch repo. No plan truth is violated literally in the "counted and named" sense (37-06: "a task whose read throws is caught, counted and named, never swallowed"; it is named). But the same phase promised, in 37-09 and in threat T-37-30 (disposition: mitigate, SECURITY marks it closed), that state-check does not report a trace as fresh when it did not compare, and 37-07/37-08 promised no vacuous compare. With an unreadable task, state-check says "The trace is fresh ... No findings" and exits 0 on a migrated repo, and the write mode deletes a tracked audit-trail file and its index row, which Workflow 05 then commits. The rendered files are derived data, so the loss is recoverable by re-render, but the gate meanwhile reports a pass it did not earn. That is the "never fake a passing gate" constraint. While the directory stays unreadable and before the destructive render, state-check does report `trace-stale` exit 1, so the false pass appears only after the sanctioned render has run once. The 37-SECURITY audit closed T-37-30 on tests that never cover this arm.
- **CR-02: yes, a narrower must-have is broken (the exit-2 contract), with no false pass.** `trace-freshness` still fails closed (exit 1 for a stale tree or a could-not-run). The wrong exit code and the wrong remedy text are the harm.

### Other review findings (37-REVIEW.md), re-checked against the code

| Finding | Re-checked | Effect on must-haves |
| ------- | ---------- | -------------------- |
| WR-01 ticket-ID shape wider than the board's | Reproduced: refs `ABC-1`, `CWE-79` and a 300-letter ref gave `CWE-79.md` as a ticket trace file, 2 files written, then exit 2 (ENAMETOOLONG) | Breaks the "refusals run before the first write" claim in the trace-render header; also makes `CWE-79` a ticket. WARNING. |
| WR-02 ROLLABLE vs state-roll refusal on a fenced dated heading | Reproduced: state-check prints `ROLLABLE progress`, state-roll exits 2 "sits inside a fenced block" | WF09 would fail daily on that input; no pass is faked. WARNING. |
| WR-03 board-read still reads the old matrix shape for the new index | Not re-run; consistent with `parseTraceability` mapping cells to title/status | Published snapshot carries link markup as title/status. 37-12's "one TraceRow per index line" still holds. WARNING. |
| WR-04, WR-05, WR-06, IN-01..IN-05 | Not individually reproduced; none maps to a must-have truth | Open per 37-REVIEW-DISPOSITION.md. WR-05 (runnable version skew) is a real operational risk for Phase 38 hosts. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `install/state-layout.ts` | BUDGETS (9), marker, archive paths | VERIFIED | Lines 107-172; constants-only; pins tested two-sided |
| `scripts/state-rules.ts` | one owner of every budget rule | VERIFIED | Imported by validator, embedded in runnables; tests pass (426 tests across 9 files) |
| `scripts/trace-model.ts` | trace model, HAND_TRACE_PATTERNS | VERIFIED | Wired into trace-render and state-check by generation |
| `scripts/runnable-ref/state-check.js` / `.ts` | host checker | VERIFIED | Installed, exits 0/1 as contracted; trace arm has Gap 1 |
| `scripts/runnable-ref/trace-render.js` / `.ts` | host renderer | PARTIAL | Works on readable input; Gaps 1 and 2 on unreadable input |
| `scripts/runnable-ref/state-roll.js` / `.ts` | host roll | VERIFIED | Scratch roll of 5 Done rows proven; WR-02 edge noted |
| `scripts/generate-runnable-embeds.ts`, `runnable-embeds-freshness.ts` | generation + freshness gate | VERIFIED | `freshness:runnable-embeds` green |
| `scripts/trace-freshness.ts` | directory-compare gate | VERIFIED | `freshness:traceability` green; maps exit codes correctly given its input |
| `agent-factory/contracts/board.md` | overview, budgets, marker, Done archive | VERIFIED | Sections present |
| Seeds (`board.md`, `nfr-catalog.md`, `traceability.md`, `60-progress.md`, `.layout`, keepers) | v3 forms | VERIFIED | Tracked; own tree matches seed bytes |
| Roles and workflows | trace rendered, NFR per file, overview rule | VERIFIED with Gap 3 residue | Roles clean; WF02:41, WF03:9, _commit-convention.md:52 stale |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| state-layout.ts | validator, runnables | import / generated region | WIRED | embeds fresh |
| WF05 / WF09 | trace-render, state-check, state-roll | documented commands | WIRED | text present; live host run pending |
| installer RUNNABLES | tools/grugops/*.js | materialization | WIRED | 7 files in scratch install; uninstall mirror tested |
| state-roll | board-read | boardArchive source | WIRED | archive rows place tickets; tests pass |
| ci.yml | state-check, validator | run block lines 605-606 | WIRED but behind two pre-existing reds | see human item 1 |

### Data-Flow Trace (Level 4)

Not applicable to UI data. Trace data flow checked: published sealed notes -> `readRawNotesWithSkips` -> `buildTraceRows` -> per-ticket files and index (real data, FLOWING on readable input; incomplete-read arm is Gap 1).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Embed freshness | `npm run -s freshness:runnable-embeds` | 3 targets fresh, exit 0 | PASS |
| Trace freshness (own tree) | `npm run -s freshness:traceability` | fresh, exit 0 | PASS |
| Committed .js equals build | `npm run -s freshness` | 86 .js files fresh, exit 0 | PASS |
| Repo gates | check-state-paths, check-foundation-guards, check-nul-bytes, check-kit-refs, check-imperative-lexicon, check-banned-claims, check-claim-anchors | all exit 0 | PASS |
| Own tree, FAIL mode | `node scripts/runnable-ref/state-check.js .`; `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js [--strict]` | exit 0 each | PASS |
| Targeted suites (1 worker) | state-rules, trace-model, trace-instructions, trace-freshness, generate-runnable-embeds, state-layout, state-roll, trace-render, state-check | 9 files, 426 tests passed | PASS |
| Wider suites (1 worker) | validate, board-read, board-model, board-corpus, board-tracer, board-readonly, check-state-paths, nonblocking-reader-parity, context-io-writer-set | 1132 passed, 2 failed; both failures are the two `context-io-writer-set` baseline cases in 37-BASELINE.md (archived phase-31 record) | PASS (no new failure) |
| Scratch install + runnables | install into scratch target (GRUGOPS_HOME, HOME in scratch); `state-check.js .`, `trace-render.js . --check` | exit 0, marker valid | PASS |
| Marker severity | oversize board with and without `.layout` | exit 1 / exit 0 + WARN | PASS |
| NFR index both directions | planted file / planted line | named findings, exit 1 | PASS |
| Roll | 25 Done rows -> `state-roll.js` | 5 rows moved, proven, re-check clean | PASS |
| CR-01 | unreadable `notes/` then render, `--check`, state-check | file REMOVED exit 0; then fresh exit 0 | FAIL (Gap 1) |
| CR-02 | unreadable `.grugops/context` | trace-render exit 1 + stack; state-check exit 2 | FAIL (Gap 2) |

Full regression: the orchestrator's 37-19 phase-gate run (125 files, 9,141 tests, 1 worker) showed only the 20 baseline failures; no non-planning file changed between that run's code and HEAD. I did not repeat the full run. No vitest process was left running.

### Probe Execution

Step 7c: SKIPPED. No `probe-*.sh` is declared by any phase-37 plan, and none exists under `scripts/*/tests/`.

### Requirements Coverage

All seven IDs appear in plan frontmatter (37-01 .. 37-19) and in REQUIREMENTS.md, mapped to Phase 37; no orphans.

| Requirement | Source Plans | Status | Evidence |
| ----------- | ------------ | ------ | -------- |
| SPLIT-01 | 37-01, 02, 10, 11, 12, 13, 14, 16, 19 | SATISFIED | Truth 1, 5, 6; contract-first order confirmed from git |
| SPLIT-02 | 37-05, 13, 14, 16, 18, 19 | SATISFIED | Truth 2; NFR integrity exercised both directions |
| SPLIT-03 | 37-06..09, 14..18 | PARTIAL | Rendering and indexes work; roles clean; Gap 1 (incomplete read), Gap 3 (workflow residue) |
| SPLIT-04 | 37-01, 02, 03, 04, 19 | SATISFIED | Truth 3, 8, 9 |
| SPLIT-05 | 37-03, 04, 05, 09, 13, 16, 19 | SATISFIED for the runnable and its workflow wiring; CI reachability is human item 1 | Truth 4, 7 |
| SPLIT-06 | 37-05, 10, 11, 13, 16, 19 | SATISFIED | Truth 5 |
| SPLIT-07 | 37-01, 12 | SATISFIED | Truth 1; refusal of extra keys covered by board-read tests |

REQUIREMENTS.md currently marks SPLIT-03 Complete; the orchestrator should hold that until Gaps 1 and 3 are closed or overridden.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `scripts/runnable-ref/trace-render.ts` | ~841, 953-970 | incomplete read treated as absence | BLOCKER | Gap 1 |
| `scripts/runnable-ref/trace-render.ts` | ~810-815 | uncaught readdirSync | BLOCKER (narrow) | Gap 2 |
| `agent-factory/workflows/02-idea-to-epics.md` | 41 | "the trace rows are appended" | WARNING | Gap 3 |
| `agent-factory/workflows/03-epic-to-tickets.md` | 9 | "a trace row before it can be pulled" | WARNING | Gap 3 |
| `agent-factory/_commit-convention.md` | 52 | example commit "write trace row" | WARNING | Gap 3 |
| `.github/workflows/ci.yml` | 605-606 | wired after two red gates in a fail-fast block | WARNING | human item 1 |

Debt markers: a `TBD|FIXME|XXX` scan (with `-a`) over the 120 non-planning, non-compiled files changed since 33177831^ found none. Known pre-existing reds, not counted as phase-37 gaps: `check-diff-disposition` (exit 1, 707 findings per deferred-items.md), `check-flip-manifest` (exit 1), and the 20 baseline test failures.

### Human Verification Required

1. **CI reachability.** Decide how to clear `check-diff-disposition` and `check-flip-manifest` (or reorder the block) so a push reaches `state-check.js .` and the validator. Expected: both phase-37 lines run on CI. Why human: needs a decision on 707 disposition rows or a moved base, and a push.
2. **Live host run (planned, non-blocking).** Push a branch from a scratch host remote and confirm the PR-gate step runs `node tools/grugops/state-check.js .` and records its exit code without blocking. The local half passed here.

### Security note on the permanent scan (answer to the auditor)

`scripts/trace-instructions.test.ts` uses `HAND_TRACE_PATTERNS` (trace-model.ts:40-43), which require the word "traceability". Passive wording that says "trace row(s)" without that word (WF02:41, WF03:9, `_commit-convention.md:52`) passes the scan. Against SPLIT-03 as the roadmap words it ("no role instructs"), roles pass. Against 37-16/37-17's "no workflow tells an agent to append to the trace by hand", WF02:41 does not pass. The scan is a narrower guard than the truth; Gap 3 asks for it to be widened.

### Gaps Summary

Three gaps, all small and local. Gap 1 is the one that matters: make an unreadable task or note a could-not-run in `trace-render` (write mode refuses before removing anything) and a named finding or exit 2 in `--check` and `state-check`, with the missing test. Gap 2 is a missing try/catch around the context-root listing. Gap 3 is three sentences plus a wider scan pattern. Warnings WR-01 (ticket-ID shape and pre-write refusal), WR-02 (ROLLABLE vs fenced heading) and WR-05 (runnable version skew, relevant to Phase 38) should be planned in the same gap round; the rest of 37-REVIEW.md stays open per its disposition file. Closing these should lift the score to 12/13, with truth 13 (CI reachability) left to the two human items.

---

_Verified: 2026-10-22T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
