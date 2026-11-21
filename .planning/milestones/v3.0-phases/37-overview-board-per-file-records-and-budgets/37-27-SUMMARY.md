---
phase: 37-overview-board-per-file-records-and-budgets
plan: 27
subsystem: testing
tags: [trace, hand-trace-scan, scan-1, gap-round-1, regression, kit-prose]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plans 37-20 to 37-26 (gap round 1: CR-02/EXIT-1, CR-01/READ-1, WR-01, WR-02, WR-05, READ-1 tables, IN-03)"
provides:
  - "HAND_TRACE_PATTERNS widened from the truth: three patterns (edit/hand-edit/modify verbs; `trace row|rows|matrix|column|columns` without the word traceability)"
  - "trace-instructions.test.ts: KNOWN_VIOLATIONS and RENDERED_WORDING corpora, Gap 3 scan-set membership, paragraph mode for wrapped prose"
  - "WF02 Done condition, WF03 When to use and the commit-convention example name the rendered trace (D-02)"
  - "Gap round 1 regression record: full suite, 17 gates, CR-01/CR-02 reproductions, fresh scratch install, closing four-class table"
affects: [phase-37-verification, phase-43-worked-examples]

actuals:
  tokens: 8292
  tasks: 2
  commits: 2
plan_head_before: a046041cd2d1e55f6864d2108415259da632d22a
plan_head_after: 5a56c30cf71e2d73abbcabea4274b62df7dd11ee

tech-stack:
  added: []
  patterns:
    - "A permanent prose scan carries a positive corpus of every known violating sentence and a negative corpus of the sanctioned wording"
    - "A prose scan runs in line mode and paragraph mode (non-blank runs outside fences; heading, HTML comment start, table row and list marker start a new paragraph)"

key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-model.test.ts
    - scripts/trace-instructions.test.ts
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/_commit-convention.md
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "The WF03 rewording is two sentences, not the plan's one 43-word sentence, because the WP-03 descriptive bound is 25 words (check-imperative-lexicon); the meaning is unchanged"
  - "Paragraph mode follows the plan's rule literally: only a heading, an HTML comment start, a table row or a list-item marker line starts a new paragraph, so a plain line after a comment joins it"
  - "examples/ stays outside the hand-trace scan set in round 1; an open deferred-items.md entry names the six ranges for human triage (Phase 43 candidate)"

patterns-established:
  - "SCAN-1 closure: derive the pattern from the truth, pin the corpus, assert the derived scan set holds the files that carried the known violations"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "HAND_TRACE_PATTERNS has three patterns derived from the truth; every KNOWN_VIOLATIONS row matches, no RENDERED_WORDING row or rendered index line matches"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#KNOWN_VIOLATIONS row matches at least one pattern"
        status: pass
      - kind: unit
        ref: "scripts/trace-model.test.ts#has exactly three members, case-insensitive and without the g flag, each matching its own control line"
        status: pass
    human_judgment: false
  - id: D2
    description: "No kit file (77 tracked markdown files under agent-factory/ plus AGENTS.md) tells an agent to write the trace by hand, in line or paragraph mode; the three Gap 3 sentences are reworded"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#zero lines and zero paragraphs across the scan set match any pattern"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#paragraph mode reports seed.md:3-4, line mode reports nothing"
        status: pass
    human_judgment: false
  - id: D3
    description: "Gap round 1 regression: full non-e2e suite shows only the 20 baseline failures and all 17 gates exit 0"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (129 files, 9,478 tests, 20 failed = 37-BASELINE.md)"
        status: pass
      - kind: other
        ref: "Task 2 gate chain (17 commands, every exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "37-VERIFICATION.md CR-01 and CR-02 reproductions against the committed .js now exit 2 (and state-check exit 1 trace-not-compared for CR-01); a fresh scratch install runs the three runnables with exit 0"
    verification:
      - kind: other
        ref: "node <scratchpad>/repro/repro.mjs <checkout> <scratch> (CR-01, CR-02 against the committed runnables)"
        status: pass
      - kind: other
        ref: "GRUGOPS_HOME=$S/kit HOME=$S/home node install/install.js --yes --target $S/repo --claude, then trace-render, state-check, state-roll --dry-run"
        status: pass
    human_judgment: false
  - id: D5
    description: "Open deferred-items.md entry for the worked examples that still show the retired hand-kept trace matrix"
    verification: []
    human_judgment: true
    rationale: "The entry is for human triage: whether to rewrite examples/ in Phase 43 or as a quick fix is a scope decision, not something a test decides"

duration: 36min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 27: Gap 3 (SCAN-1) and the gap round 1 gate Summary

**The hand-trace scan now has three patterns derived from the truth ("no kit file tells an agent to write the trace by hand"), a corpus that holds every known violating sentence, and a paragraph mode for wrapped prose. The three kit sentences it used to miss name the rendered trace. Gap round 1 closes with the full suite showing only the 20 baseline failures, all 17 gates exiting 0, the verifier's CR-01 and CR-02 reproductions exiting 2, and a fresh scratch install whose three runnables exit 0.**

## Performance

- **Duration:** 36 min (about 31 of them the full suite)
- **Started:** 2026-10-23T16:48:10Z
- **Completed:** 2026-10-23T17:24:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- HAND_TRACE_PATTERNS grew from 2 to 3. Pattern 1 gained nine verbs (edit, edits, edited, hand-edit, hand-edits, hand-edited, modify, modifies, modified). The new pattern 3, `/\btrace (row|rows|matrix|column|columns)\b/i`, names the retired matrix shape without the word traceability. The docstring now states the truth the patterns come from.
- scripts/trace-instructions.test.ts gained KNOWN_VIOLATIONS (9 rows, the three pre-fix kit sentences verbatim among them), RENDERED_WORDING (6 rows, plus the rendered index sentence derived from `renderTraceIndex([])`), a Gap 3 scan-set membership case, and `paragraphHitsIn` beside `hitsIn`. The zero-hit case now asserts zero line hits and zero paragraph hits over the 77-file set.
- WF02:41, WF03:9 and `_commit-convention.md`:52 now name the rendered trace. `git diff --stat` over the three files: `3 files changed, 3 insertions(+), 3 deletions(-)`.
- Gap round 1 closed on evidence: the second full run of the round, every gate, both verifier reproductions and a fresh scratch install.

## Task Commits

1. **Task 1: Widen the scan from the truth, prove it on the known sentences, fix the kit text** - `ec2a5f89` (test)
2. **Task 2: Gap round 1 gate (regression, gates, reproductions, scratch install, deferred items)** - `5a56c30c` (docs)

## Task 1 evidence

### RED run (the widened scan before the kit text changed)

`npx vitest run scripts/trace-instructions.test.ts`: 1 failed, 29 passed. Only the zero-hit case failed, and it named exactly the three Gap 3 lines, in both modes:

- Lines: `agent-factory/_commit-convention.md:52`, `agent-factory/workflows/02-idea-to-epics.md:41`, `agent-factory/workflows/03-epic-to-tickets.md:9`
- Paragraphs: `agent-factory/_commit-convention.md:52-52`, `agent-factory/workflows/02-idea-to-epics.md:40-41` (the `## Done condition` heading joins its first line), `agent-factory/workflows/03-epic-to-tickets.md:8-9`
- `expected { lineHits: 3, paragraphHits: 3 } to deeply equal { lineHits: +0, paragraphHits: +0 }`

No other line or paragraph in the 77 files matched, so no further kit text needed rewording. This agrees with the planning trial.

### Rewordings

- 02-idea-to-epics.md Done condition: `The product decisions are recorded as typed notes per Workflow 16, and the epic and feature ids they publish as refs feed the trace render.`
- 03-epic-to-tickets.md When to use: `grug make tickets small — each one has value, scope, acceptance, test notes, size, priority, and epic and feature ids before it can be pulled. Those ids are published as refs on a note (Workflow 16), so the trace render gives the ticket a trace file.` (split from the plan's single sentence, see Deviations)
- _commit-convention.md third example: `` `docs(board): grug move ABC-001 into In Review, commit rendered trace` ``

### Regenerated files

`npm run generate:adapters`, `generate:catalog` and `generate:skill-twins` were run after each kit edit. None changed a tracked file: docs/catalog/README.md regenerated byte-identical (it does not copy these sentences), and skill twins reported `0 written, 7 already identical`. Nothing extra was committed. `freshness:runnable-embeds` exits 0, so HAND_TRACE_PATTERNS reaches no embedded closure.

### Mutation proofs (working tree only, after the Task 1 commit, each reverted with `git checkout --`)

| Mutation | Result |
|----------|--------|
| (1) the old WF02 sentence put back | 1 failed: the zero-hit case, naming `agent-factory/workflows/02-idea-to-epics.md:41` (line) and `:40-41` (paragraph) |
| (2) pattern 3 deleted from trace-model.ts, rebuilt | 8 failed: `there are exactly three patterns`, the three verbatim corpus rows, `trace rows are written`, `add a trace row`, `write trace row`, and the wrapped WF02 paragraph row |
| (3) `paragraphHitsIn` returns `[]` | 3 failed: both wrapped positive rows, and the joined control in the heading/comment case |

After the reverts `git status --porcelain` was empty (apart from the pre-existing untracked research cache) and the two test files ran 81 passed.

### Task 1 verify

- `npm run build && npm run typecheck`: exit 0. `npx vitest run scripts/trace-instructions.test.ts scripts/trace-model.test.ts`: 81 passed.
- `freshness:adapters`, `freshness:catalog`, `freshness:skill-twins`, `freshness:runnable-embeds`, `freshness` (87 outputs fresh), `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` (`ALL CHECKS PASSED`): chain exit 0.
- check-imperative-lexicon, check-banned-claims, check-claim-anchors, check-kit-refs, check-nul-bytes: chain exit 0 (after the WF03 split; see Deviations).
- Tracer gate: interactive run, `human_verify_mode` end-of-phase, automated-only verify, re-run passed, so Task 2 ran with no checkpoint.

## Gap round 1 regression record (Task 2)

### Full non-e2e suite

`npx vitest run --exclude '**/scripts/e2e/**'` (one worker by config), started 19:52:55 local, 1,833 s. **Test files: 6 failed, 123 passed (129). Tests: 20 failed, 9,456 passed, 2 skipped (9,478).** The 20 failures are exactly the 20 cases of 37-BASELINE.md: installer-fs-census (1), canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 and the six 31-29 cases (7), harness-instance-ledger (4) and uat-gate-exit-contract (5). The same 20 failed in plan 37-24's mid-point run (127 files, 9,234 tests). No failure is new, so no earlier gap plan needed a fix. `pgrep -fl vitest` was empty after the run.

### Gates (run once before the suite, on the committed Task 1 tree)

| Gate | Exit |
|------|------|
| `npm run freshness` | 0 |
| `npm run freshness:traceability` | 0 |
| `npm run freshness:runnable-embeds` | 0 |
| `npm run freshness:hook-manifest` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run freshness:host-entries` | 0 |
| `node scripts/check-state-paths.js` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `node scripts/check-nul-bytes.js` | 0 |
| `node scripts/check-imperative-lexicon.js` | 0 |
| `node scripts/check-banned-claims.js` | 0 |
| `node scripts/check-claim-anchors.js` | 0 |
| `node scripts/check-kit-refs.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` | 0, `ALL CHECKS PASSED` |
| `node scripts/runnable-ref/state-check.js .` | 0 |

No gate run left a tracked file modified.

### The verifier's reproductions, against the committed .js

A scratchpad script (`repro/repro.mjs`) copied the committed trace-render.js, state-check.js and state-roll.js alone into an empty host directory, built each repository with the D-14 layout marker and one sealed note naming ABC-1 in `.grugops/context/taskA/notes/`, rendered it (exit 0), then set the mode to 000 inside a `try` and restored 0755 in `finally`.

| Reproduction | Before round 1 (37-VERIFICATION.md) | Now |
|--------------|-------------------------------------|-----|
| CR-01 premise | n/a | ABC-1.md rendered; state-check exit 0 |
| CR-01 trace-render write, notes directory at 000 | exit 0, ABC-1.md REMOVED | **exit 2**, `the notes could not be read completely ... nothing was written or removed` and `UNREADABLE TASK .grugops/context/taskA: EACCES ...` on stderr; ABC-1.md kept byte-identical; index unchanged |
| CR-01 trace-render `--check` | exit 0 `The trace is fresh` | **exit 2**, same stderr |
| CR-01 state-check with the marker | exit 0 `The trace is fresh`, `No findings` | **exit 1**, `FINDING .grugops/context/taskA: the trace was not compared ... (trace-not-compared)`; `--json` `trace.compared` false, findings `trace-not-compared\|.grugops/context/taskA`; no fresh line |
| CR-02 trace-render write, `.grugops/context` at 000 | exit 1 with a node:fs stack trace | **exit 2**, `the context root .grugops/context cannot be listed (EACCES). The trace render did not run.`; no V8 stack frame |
| CR-02 trace-render `--check` | exit 1 with a stack trace | **exit 2**, same message, no stack frame |
| CR-02 state-check with the marker | exit 2 | exit 2, `... The state check did not run.` |

### Fresh scratch install

S = the scratchpad `inst/` directory. `git init "$S/repo"`, then from the checkout `GRUGOPS_HOME="$S/kit" HOME="$S/home" node install/install.js --yes --target "$S/repo" --claude`: exit 0, `== install complete ==`. `tools/grugops/` holds state-check.js, state-roll.js and trace-render.js (with host-protection.js, reference-check.js, test-skip-integrity.js, uat-spec-integrity.js and LICENSE). The real `~/.grugops` kept its mtime (Oct 18 22:31).

| Runnable on the fresh target | Exit | Output |
|------------------------------|------|--------|
| `trace-render.js "$S/repo"` | 0 | `Rendered the trace: 0 task(s) and 0 note(s) read; ... 0 file(s) written, 0 file(s) removed.` |
| `state-check.js "$S/repo"` | 0 | `TRACE The trace is fresh: ...`, `No findings.`; `--json`: `"ok":true,"marker":"valid","enforced":true,"findings":[]`, `trace.compared` true; no `runnable-version-skew` |
| `state-roll.js "$S/repo" --dry-run` | 0 | `Nothing to roll ...` twice, `Dry run: nothing would move; nothing was written.` |

### Every pin the round moved, with its final value

| Pin | File | Moves | Final | Plan(s) |
|-----|------|-------|-------|---------|
| `NON_TEST_MODULE_COUNT` (LANG-07) | scripts/check-foundation-guards.test.ts | 108 -> 109 -> 110 | 110 | 37-20, 37-24 |
| `scripts/`-scoped corpus (two sites) | scripts/check-foundation-guards.test.ts | 69 -> 70 -> 71 | 71 | 37-20, 37-24 |
| comparison count | scripts/check-foundation-guards.test.ts | 69 * 3 -> 70 * 3 -> 71 * 3 | 71 * 3 | 37-20, 37-24 |
| `TRIPWIRE_MODULES` | scripts/check-foundation-guards.test.ts | 79 -> 80 | 80 | 37-26 |
| `SCRIPTS_CHMOD_COUNT` | install/mode-census.test.ts | 33 -> 37 -> 39 | 39 | 37-21 (with 37-20's two calls), 37-26 |
| `SCRIPTS_TEST_FILE_COUNT` | install/mode-census.test.ts | 79 -> 80 | 80 | 37-26 |
| decider manifest hash of scripts/context-io.js | hooks/hook-entry.ts (+ .js) | regenerated | 13 module hashes, fresh | 37-21 |
| `TRACE_RENDER_READ_SITES`, `STATE_CHECK_READ_SITES`, `STATE_ROLL_READ_SITES` (new) | scripts/runnable-ref/read-sites.test.ts | new | 16, 19, 11; `UNREACHED_SITES` size 0 | 37-25 |
| `VALIDATOR_READ_SITES` (new) | scripts/validate-read-sites.test.ts | new | 5 | 37-26 |
| ticket agreement accepted list | the WR-01 agreement corpus | 3 -> 8 | 8 | 37-22 |
| `HAND_TRACE_PATTERNS` length | scripts/trace-instructions.test.ts, scripts/trace-model.test.ts | 2 -> 3 | 3 | 37-27 |

Every move was re-derived with a recorded reason. No guard predicate was changed.

### Deviations recorded by each plan of the round

| Plan | Deviations |
|------|------------|
| 37-20 | 3 auto-fixed: state-roll's handler names a proven progress roll (Rule 2); module-count pins re-derived (Rule 3); the write-mode stdout-throw row uses an unrendered repository (Rule 1, test strength) |
| 37-21 | 3 auto-fixed (Rule 3): hook decider manifest regenerated for the new context-io.js hash; scripts chmod census 33 -> 37; embed regeneration via `tsc --noEmitOnError false` (process only); plus 1 placement note |
| 37-22 | 1 auto-fixed (Rule 3, process: the same embed regeneration sequence) and 1 ordering note (Task 2 committed before its mutation proofs) |
| 37-23 | 2: a third state-rules case that encoded the second answer was rewritten (Rule 1); the mutated build needed `--noEmitOnError false` (proof only) |
| 37-24 | 2 auto-fixed (Rule 3): LANG-07 module-count pins re-derived; the freshness-gate mirror got a `GATE_SCRIPTS` list held equal to the gate's import closure |
| 37-25 | 4 auto-fixed: exit-1 rows must add a finding line, exit-2 rows must not reach the backstop, unlisted modes are run and must fire nothing (Rule 2, test strength); trace-render's fixture needed two more links and an extra trace file (Rule 3) |
| 37-26 | 4 auto-fixed: census pins moved because files landed (Rule 3); the fixture ticket comes from a fixture file (Rule 3); the IN-03 control pins today's exact output (Rule 2); a failed budget-pass read carries its code (Rule 1, wording) |
| 37-27 | 2 (below) |

### Closing table: the four defect classes

| Class | Site | Plan | Test | Final state |
|-------|------|------|------|-------------|
| READ-1 | trace-model `collectTraceNotes` failed tasks and the I/O skip arms (unopenable, not-a-regular-file, above-ceiling, vanished), live and archive roots | 37-21 | CR-01 sequence and the arm table (trace-render.test.ts, state-check.test.ts) | a read failure stops the render (exit 2, nothing written) and is trace-not-compared in state-check; unsealed/unparseable stay trust skips |
| READ-1 | context-io `readRawNotesWithSkips` absence test | 37-21 | context-io walk case; mutation (c) | only ENOENT is absent |
| READ-1 | trace-render `readTask` and state-check `readTraceTask` realpath of the notes directory | 37-21 | CR-01 task-directory rows | stops the render / trace-not-compared |
| READ-1 | every node:fs read site of trace-render (16), state-check (19), state-roll (11), under all 95 calling paths | 37-25 | scripts/runnable-ref/read-sites.test.ts (162 rows, pins, two-sided equalities, `UNREACHED_SITES` 0) | every failure exit 2 by name or an added finding; state-check's realpath of its own directory fixed (was a pass) |
| READ-1 | state-check reading its sibling runnables | 37-24 | the mode-000 and FIFO sibling cases | `runnable-version-skew` naming `unopenable` / `not-a-regular-file` |
| READ-1 | validator: all 5 read sites under 18 calls; IN-03 `directoryFindings`; the layout marker | 37-26 | scripts/validate-read-sites.test.ts; validate.test.ts IN-03 cases | ENOENT alone is absent; an unreachable directory or marker is a named ERROR |
| READ-1 | trace-model.js, state-rules.js, trace-freshness.js | 37-25 | zero-site assertions | no read site |
| READ-1 (out of scope) | checkTickets opens a FIFO ticket path with `readFileSync` (hang) | — | — | open, deferred-items.md (37-27 note: still open after 37-26) |
| READ-1 (out of scope) | note files opened through symbolic links without a realpath check (WR-04) | — | — | open, 37-REVIEW-DISPOSITION.md |
| EXIT-1 | trace-render `listTasks` (CR-02) and the symbolic-link follow-up statSync | 37-20 | CR-02 cases, TR-6 row | exit 2 by name |
| EXIT-1 | top level of trace-render, state-check (output tail), state-roll | 37-20 | scripts/runnable-ref/runnable-exit-contract.test.ts (stdout-throw rows, census) | process-level handler maps any throw to exit 2 |
| EXIT-1 | trace-freshness `freshnessVerdict` | 37-20 | trace-freshness behavior case | exit 2 read as could-not-run, no re-render remedy |
| EXIT-1 | WF05:41, WF09:22, scripts/trace-render.ts `childExitCode` | 37-20 | evidence / existing cases | compliant, unchanged |
| EXIT-1 (out of scope) | reference-check, test-skip-integrity, uat-spec-integrity, board-dashboard, host-protection, check-state-paths with state-path-scan | — | — | open, deferred-items.md `EXIT-1 siblings outside phase 37` |
| AUTH-1 | ticket shape: trace `ID_SHAPE` vs board `TICKET_ID` (WR-01) | 37-22 | agreement corpus, syntax-tree case | `isTicketId` from board-model is the one answer, embedded and passed in |
| AUTH-1 | dated progress entries: `progressEntries` vs `planProgressRoll` (WR-02) | 37-23 | Task 1 cases, the agreement table, the census | one fence-aware classifier through `sectionEndIndex` |
| AUTH-1 | three runnables with independent copies (WR-05) | 37-24 | the stamp cases in state-check.test.ts | `RUNNABLE_SET_STAMP` generated in each region; `runnable-version-skew` on mismatch |
| AUTH-1 (out of scope) | board-read `parseTraceability` and checkTickets read the old matrix (WR-03); WR-06 duplicate refusal | — | — | open, 37-REVIEW-DISPOSITION.md |
| SCAN-1 | HAND_TRACE_PATTERNS (needed `traceability`) | 37-27 | trace-model.test.ts, trace-instructions.test.ts corpora | three patterns from the truth |
| SCAN-1 | trace-instructions.test.ts scan (no corpus, line mode only) | 37-27 | KNOWN_VIOLATIONS, RENDERED_WORDING, paragraph mode, Gap 3 membership | 77 files, zero line and zero paragraph hits |
| SCAN-1 | trace-model.test.ts rendered index vs the patterns | 37-27 (kept) | CROSS-PLAN index cases | passes with three patterns |
| SCAN-1 | WF02:41, WF03:9, `_commit-convention.md`:52 | 37-27 | the zero-hit case | reworded to the rendered form |
| SCAN-1 | other permanent prose scans (check-imperative-lexicon, check-banned-claims, check-claim-anchors, check-kit-refs) | — | run as gates, exit 0 | not in the class (other truths) |
| SCAN-1, kit-adjacent | README.md, install/README.md, CONTRIBUTING.md, CLAUDE.md, skills/, .claude/, .agents/, .github/, .opencode/, .pi/, memory-bank/, scripts/runnable-ref/*.md, docs/GUARANTEES.md, docs/faq.md, docs/dogfood-human-runbook.md, docs/catalog/README.md, docs/design/shared-install.md | 37-27 (search) | re-run search below | clean in both modes |
| SCAN-1, kit-adjacent | examples/01 to 05 trace sections (six ranges) | — | re-run search | out of round 1 scope, open in deferred-items.md `The worked examples still show the retired hand-kept trace matrix` |
| SCAN-1, kit-adjacent | docs/pre-v3-state-layout.md:4, CHANGELOG.md:24 | — | — | not in the class: accurate history of the pre-v3 layout |
| SCAN-1, kit-adjacent | docs/initial/ (14 line hits), docs/audit/ (93), scripts/fixtures/ (178) | — | — | not in the class: retired-design source documents, disposition records, test inputs |

The kit-adjacent search was re-run in Task 2 with the committed patterns and the test's paragraph rule over the 719 tracked markdown files outside agent-factory/, AGENTS.md and .planning/: 288 line hits and 277 paragraph hits, all in the rows above (CHANGELOG 1/1, docs/pre-v3-state-layout.md 1/1, docs/initial 14/4, docs/audit 93/90, scripts/fixtures 178/178, examples/05 1/3). The line counts equal the planning measurement.

The CI-reachability item (two older red gates ahead of the phase-37 lines in `ci.yml`) stays with the human, outside this round (D-17).

## Files Created/Modified
- `scripts/trace-model.ts` (+ `.js`) - HAND_TRACE_PATTERNS with three patterns and a docstring that states the truth they come from
- `scripts/trace-model.test.ts` - three-member assertion and a control line for pattern 3
- `scripts/trace-instructions.test.ts` - the two corpora, Gap 3 membership, `paragraphHitsIn`, the line-and-paragraph zero-hit case
- `agent-factory/workflows/02-idea-to-epics.md`, `agent-factory/workflows/03-epic-to-tickets.md`, `agent-factory/_commit-convention.md` - one line each, reworded to the rendered trace
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md` - the worked-examples entry and two round notes

## Decisions Made
- The WF03 rewording is two sentences (see Deviations 1).
- Paragraph mode follows the plan's rule literally (see Deviations 2).
- examples/ stays outside the scan set in round 1 and is recorded open for the human.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's WF03 wording broke the WP-03 sentence bound**
- **Found during:** Task 1 (the prose-gate chain)
- **Issue:** the plan's single sentence was 43 words. `check-imperative-lexicon` failed with `03-epic-to-tickets.md:9 — WP-03 [descriptive-sentence-too-long] 43 words, bound 25` and its remedy is to split the sentence (never to narrow the scan set).
- **Fix:** two sentences with the same meaning: `... size, priority, and epic and feature ids before it can be pulled. Those ids are published as refs on a note (Workflow 16), so the trace render gives the ticket a trace file.` RENDERED_WORDING holds both. Still one changed line; the diff stat stays 3/3.
- **Files modified:** agent-factory/workflows/03-epic-to-tickets.md, scripts/trace-instructions.test.ts
- **Verification:** check-imperative-lexicon exit 0; the trace tests 81 passed; zero line and zero paragraph hits
- **Committed in:** ec2a5f89

**2. [Rule 1 - Test correctness] My first heading/comment seed contradicted the plan's paragraph rule**
- **Found during:** Task 1 (first run of the new test)
- **Issue:** I first seeded a comment line above a plain line and expected no join. The plan's rule makes only the second line's kind decide a break (a heading, an HTML comment start, a table row or a list marker starts a new paragraph), so a plain line after a comment joins it. The scanner was right; the seed was wrong.
- **Fix:** the case now holds the rendered index (comment above `# Traceability`), a comment line above a heading, a plain line above a comment line, and a control where the same two plain lines with no paragraph start do join and are a hit. Fixed before the commit; the scanner was not changed.
- **Files modified:** scripts/trace-instructions.test.ts
- **Committed in:** ec2a5f89

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 test correctness). **Impact on plan:** no scope change; no pattern narrowed and no corpus row dropped.

## Issues Encountered
- `check-diff-disposition` (not in this plan's gate list; already open in deferred-items.md) went from 707 to 720 findings. The 13 new findings are exactly the clauses of the two reworded workflow lines (02-idea-to-epics.md:40-41: 4, 03-epic-to-tickets.md:9: 9), measured by diffing its output at a046041c (a detached scratch worktree, removed afterwards) against HEAD. Recorded as a note on that entry; the disposition decision stays with the human.
- The SDK has no `git.base-branch` or `check evaluation-scope` query in this install. Commits went to `main` under `.planning/config.json` `git.allow_default_branch_commits: true`, as every earlier plan of the round did. The evaluation-scope self-check is `UNKNOWN - verify`; `git merge-base --is-ancestor` confirms both task commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Gap round 1 (plans 37-20 to 37-27) is complete. The orchestrator runs code review, regression and the verifier next. ROADMAP/REQUIREMENTS rows were not flipped by this plan.
- Open for the human: the worked-examples entry, the EXIT-1 siblings, the checkTickets FIFO hang, the quadratic progress classifier, the ubuntu census scope, the 720 diff-disposition findings, the CI-reachability item, and the 37-REVIEW-DISPOSITION.md rows outside D-17.

## Self-Check: PASSED
- FOUND: scripts/trace-model.ts, scripts/trace-model.js, scripts/trace-model.test.ts, scripts/trace-instructions.test.ts, agent-factory/workflows/02-idea-to-epics.md, agent-factory/workflows/03-epic-to-tickets.md, agent-factory/_commit-convention.md, deferred-items.md
- FOUND commits (ancestors of HEAD): ec2a5f89, 5a56c30c
- Task 1 acceptance: the trace tests pass with three patterns, both corpora, membership, both wrapped rows and zero line/paragraph hits; RED and all three mutation proofs recorded; diff stat `3 files changed, 3 insertions(+), 3 deletions(-)`; adapters/catalog/skill-twins freshness exit 0
- Task 2 acceptance: suite failures only among the 20 baseline cases; every gate exit 0; both reproductions' trace-render runs exit 2, CR-01 state-check exit 1 trace-not-compared; the three runnables exit 0 on the scratch install; the four-class table with the kit-adjacent rows under SCAN-1; the deferred entry names the six ranges; no tracked file left modified by the gate runs
- evaluation-scope check: `UNKNOWN - verify` (query not available in this SDK)

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
