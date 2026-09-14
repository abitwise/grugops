---
phase: 32-board-projector-cli-dashboard
plan: 08
subsystem: infra
tags: [typescript, board-grammar, validator, gates, vitest, markdown]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "scripts/board-model.ts — parseBoard, boardColumnName, boardHasColumn, kebab, the three D-05 heading suffixes (plans 32-02, 32-05)"
  - phase: 32-board-projector-cli-dashboard
    provides: "agent-factory/contracts/board.md — the normative grammar the comment is the agent-facing copy of (plan 32-01)"
  - phase: 32-board-projector-cli-dashboard
    provides: "the comment-blanking pre-pass, so a board's own documentation block contributes nothing to the parse (plan 32-02)"
provides:
  - "One board grammar in the tree: validate-agent-factory.ts imports boardHasColumn / parseBoard / kebab instead of declaring its own"
  - "Two defect fixes named as deviations rather than discovered later — the Blocked heading normalizes, a non-canonical suffix opens no phantom column"
  - "Both board twins state the canonical heading, row, ID and update forms where an agent editing the board is already looking"
  - "A phase-close gate sweep recorded honestly, with one pre-existing red named rather than fabricated green"
  - "32-VALIDATION.md marked up from real runs, including three planned commands that selected zero tests"
affects: [board-grammar, validator, documentation-gates, phase-33]

actuals:
  tokens: 19575
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A grammar has exactly one reader; a second module asks it rather than restating it"
    - "A live witness for a derived property is derived too — a hand-named module goes stale on the first legitimate edit and reports the staleness as a defect"
    - "A vacuous verification is a finding: `vitest -t` exits 0 when the filter selects nothing"

key-files:
  created:
    - 32-08-RED-baseline.txt
    - 32-08-GREEN-proof.txt
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/board-corpus.test.ts
    - scripts/check-foundation-guards.test.ts
    - plans/board.md
    - agent-factory/seed/plans/board.md
    - agent-factory/contracts/board.md
    - .planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md

key-decisions:
  - "The eight-fixture sweep is a REGRESSION instrument, not a deviation instrument — no fixture board carries either heading the two deviations concern, so its zero differences prove nothing about them and the proof file says so"
  - "scripts/board-corpus.test.ts's hand-typed comment spans (from: 4, to: 51) are DERIVED from the file rather than bumped, with an empty-span refusal so a derived span cannot degrade into an assertion over nothing"
  - "check-foundation-guards.test.ts's LANG-07 live witness is DERIVED over every non-test module rather than naming validate-agent-factory.ts, which this plan emptied"
  - "The frozen column table's one pre-existing twin difference (`Ready for Dev`) is left alone: the same plan that asks the twins' tables to match also forbids editing the table, and the table is what another gate anchors on"
  - "check:diff-disposition's red is recorded as pre-existing and out of scope, verified by running the gate on a detached worktree at the pre-plan commit rather than assumed from the file names"

patterns-established:
  - "Deviation naming: a behaviour change made deliberately during an extraction is asserted by its own RED case and written into the contract, not left for a verification round to find"
  - "Proof-file honesty: a zero-difference comparison states what it CANNOT see, so nobody reads it as evidence for a claim it does not support"

requirements-completed: [DASH-01, DASH-08]

coverage:
  - id: D1
    description: "scripts/board-model.ts is the only board grammar in the tree — the validator's inline boardColumnName/boardHasColumn pair and its local kebab are deleted and imported"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#declares no local `boardColumnName` — the helper is imported, not restated"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#carries no bare prefix-match membership spelling"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#`kebab` has exactly ONE declaration across the validator and board-model"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#imports the grammar from ./board-model.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "The two named deviations: `## Blocked (visible, time-tracked)` normalizes to `Blocked`, and `## Columns (spec §6.1)` opens no phantom column"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#DEVIATION 1: `## Blocked (visible, time-tracked)` names the column `Blocked`"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#DEVIATION 2: `## Columns (spec §6.1)` opens no column, so a ticket claiming it is refused"
        status: pass
      - kind: manual_procedural
        ref: "32-08-RED-baseline.txt §1 — both cases recorded failing before the extraction"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-03 stays pinned and both board↔ticket messages are byte-identical through the extraction"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#WR-03 stays pinned: column `In` does not match `## In Development (WIP 0/3)`"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#keeps both board↔ticket messages byte-identical through the extraction"
        status: pass
      - kind: other
        ref: "git diff -U0 scripts/validate-agent-factory.ts | grep -E '^[-+].*(is not a board column|does not match column)' — no output"
        status: pass
    human_judgment: false
  - id: D4
    description: "The eight-fixture validator sweep is unchanged by the extraction, block by block"
    requirement: DASH-01
    verification:
      - kind: other
        ref: "32-08-RED-baseline.txt §3 vs 32-08-GREEN-proof.txt §3 — diff of the two sweeps, 16/16 blocks, 0 differences"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both board twins state the canonical heading, row, ID and `_Updated:` forms and point at the normative contract, with the column table frozen"
    requirement: DASH-01
    verification:
      - kind: other
        ref: "grep -cE '^[-+]\\| ' over git diff of both twins — 0 table lines changed"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon — exit 0, boardColumns derives 13 names, no derivation refusal"
        status: pass
      - kind: unit
        ref: "node -e parseBoard over both twins — 13 columns, 0 unparsed"
        status: pass
      - kind: integration
        ref: "install/install.test.ts — 136 passed, git status --porcelain install/ empty"
        status: pass
    human_judgment: false
  - id: D6
    description: "CONTRACT_N and BOARD_COLUMN_N flow through as partSize derivations when the third contract file landed, with no literal edited"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts — 62 passed with CONTRACT_N = partSize(\"contracts\") unchanged; the gate reports `contracts 3`"
        status: pass
    human_judgment: false
  - id: D7
    description: "No runtime dependency and no installer change across the whole phase"
    requirement: DASH-08
    verification:
      - kind: other
        ref: "git diff --exit-code caeb9335..HEAD -- package-lock.json — exit 0 across the entire phase"
        status: pass
      - kind: other
        ref: "node -e \"process.exit(require('./package.json').dependencies===undefined?0:1)\" — exit 0"
        status: pass
      - kind: other
        ref: "git status --porcelain install/ — no output"
        status: pass
    human_judgment: false
  - id: D8
    description: "The phase closes with the CI-equivalent gate set green"
    requirement: DASH-08
    verification:
      - kind: e2e
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — exit 0, 74 files, 4687 passed / 2 skipped"
        status: pass
      - kind: other
        ref: "build, typecheck, check:build-parity, 9 freshness gates, 10 check:* gates, foundation-guards, kit-refs, validator, dashboard-readonly — all exit 0"
        status: pass
      - kind: other
        ref: "npm run check:diff-disposition — exit 1, PRE-EXISTING (identical finding set at 6d59ed1e), logged to deferred-items.md"
        status: fail
    human_judgment: true
    rationale: "One gate in the sweep is red. It is verified pre-existing and names no file this plan touched, but 'the whole gate set is green' is not literally true and a human should decide whether Phase 32 closes with that red outstanding."
  - id: D9
    description: "32-VALIDATION.md marked up from actual runs, wave_0_complete: true, Windows fs.watch recorded UNKNOWN - verify"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md §Mark-up Record — all 25 rows run, 3 zero-selecting filters corrected and disclosed"
        status: pass
    human_judgment: false

duration: 42 min
completed: 2026-09-14
status: complete
commits: 5
plan_head_before: 6d59ed1ead733cdc94ee15dfb49e08e91694465f
---

# Phase 32 Plan 08: One Board Grammar and the Phase Close Summary

**The validator's second copy of the column grammar is deleted and imported from `scripts/board-model.ts`, both board twins now state the canonical heading/row/ID/update forms with their gate-anchored column table untouched, and the phase closes on a gate sweep whose one red is named as pre-existing rather than fabricated green.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-09-14T16:09Z
- **Completed:** 2026-09-14T16:51Z
- **Tasks:** 3
- **Files modified:** 13 (10 modified, 3 created)

## Accomplishments

- `checkTickets()` asks the grammar instead of answering for it. The two inline helpers at `:735-741`, the WR-03 comment above them and the local `kebab` at `:250-256` are gone; the file imports `boardHasColumn`, `parseBoard` and `kebab` from `./board-model.js`. `kebab` now has exactly one declaration in the tree, asserted by a test rather than by inspection.
- Both defect fixes the swap makes are **named** — in a RED case each, in the contract's Headings section, and here. `## Blocked (visible, time-tracked)` used to leave a ticket in the Blocked column reported as being in no board column; `## Columns (spec §6.1)` used to create a phantom column a ticket could claim and pass.
- Both board twins' 48-line documentation comment is replaced by a short agent-facing copy of `agent-factory/contracts/board.md`: three heading suffixes, the row grammar with its opaque parenthetical and trailer, the ID form and the epic/feature second class, the `_Updated:` shape, and one sentence saying the indentation is no longer what keeps the example out of the board.
- The column table another gate anchors on did not move a byte. `grep -cE '^[-+]\| '` over the twins' diff prints `0`.
- Two hand-typed literals that this plan's legitimate edits broke were **derived** rather than bumped: `board-corpus.test.ts`'s comment spans and `check-foundation-guards.test.ts`'s LANG-07 live witness.
- The phase-close sweep ran 25 gates and the full suite. Everything is green except `check:diff-disposition`, which was already red before this plan and is recorded as such.

## Task Commits

1. **Task 1 (RED): the second board grammar** — `28e67a13` (test)
2. **Task 1 (GREEN): delete the validator's grammar, import the authority** — `054a34a2` (refactor)
3. **Task 2: both board twins state the canonical forms** — `62085394` (docs)
4. **Task 2 (deviation): derive LANG-07's live witness** — `3951a557` (test)
5. **Task 3: the validation map marked up from actual runs** — `074ee333` (docs)

## Files Created/Modified

- `scripts/validate-agent-factory.ts` / `.js` — 20 lines removed, 13 added; one import, one `parseBoard` call, two messages untouched
- `scripts/validate.test.ts` — eight new cases: two deviations, one WR-03 pin, four source-shape absences, one message-byte pin
- `scripts/board-corpus.test.ts` — `DOC_BLOCKS` spans derived from the files, with an empty-span refusal
- `scripts/check-foundation-guards.test.ts` — LANG-07's live witness derived over every non-test module
- `plans/board.md`, `agent-factory/seed/plans/board.md` — comment rewritten, table frozen
- `agent-factory/contracts/board.md` — the two deviations recorded side by side in a table
- `32-08-RED-baseline.txt`, `32-08-GREEN-proof.txt` — the eight-fixture sweep before and after, and what it cannot see
- `.planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md` — 25 rows run, `wave_0_complete: true`, mark-up record appended
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — the one out-of-scope red

## Decisions Made

**The eight-fixture sweep proves a regression did not happen, and nothing about the deviations.** All eight fixture boards carry the same four headings (`Ready`, `In Development`, `In Review`, `Done`), every one of which is legal under both the old strip and D-05's three forms. So the post-extraction sweep is byte-identical in 16/16 blocks — and neither named deviation is reachable through it. The plan asked for every difference to be classified as a deviation or a regression; the difference set is empty, which makes the classification vacuous. `32-08-GREEN-proof.txt` §3 states that out loud rather than reporting a clean pass, because reading a zero-difference sweep as "the deviations did not occur" inverts what it measures. The deviations are measured instead by two behavioural cases on boards built to carry the two headings the fixtures lack.

**A hand-named witness for a derived property is a trap.** Two literals broke on this plan's legitimate edits, and both were fixed by deriving rather than by bumping. `board-corpus.test.ts` sliced the board comment as `from: 4, to: 51`; the rewritten comment is five lines longer and the PREMISE case failed on `:51 should close it`. `check-foundation-guards.test.ts` read `validate-agent-factory.ts` for a `.replace(` line containing `##`; task 1 deleted it and the case failed on `must still carry the board-heading replace`. Neither failure had anything to do with the property the case measures. Both are now read off the tree, with an explicit non-empty premise so a derivation cannot silently degrade into an assertion over nothing.

**The frozen table's pre-existing twin difference stays.** See the deviations section — the plan's two criteria for the table contradict each other, and the freeze wins.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `scripts/board-corpus.test.ts` pinned the board comment at lines 4-51**

- **Found during:** Task 2
- **Issue:** `DOC_BLOCKS` carried hand-typed spans. The rewritten comment is 53 lines, so the PREMISE case failed with `plans/board.md:51 should close it: expected '  kept because it reads better; it is…' to be '-->'`. The failure names a line number, not a property.
- **Fix:** The span is derived from the first `<!--` … `-->` pair in each file, and the PREMISE case gained two assertions refusing an absent or unclosed comment — a derived span can be empty where a typed one could only be wrong.
- **Files modified:** `scripts/board-corpus.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-corpus.test.ts scripts/board-model.test.ts scripts/board-tracer.test.ts` — 191 passed
- **Committed in:** `62085394`

**2. [Rule 1 - Bug] `check-foundation-guards.test.ts`'s LANG-07 case read a module task 1 emptied**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** `the widening admits NO live site` needed a live module whose line the widened heading recogniser recognises but which bounds no scan — the conjunction doing the work. It found that module by name: `validate-agent-factory.ts`, whose `/^##\s+/` task 1 deleted. `AssertionError: validate-agent-factory.ts must still carry the board-heading replace: expected undefined to be defined`.
- **Fix:** The witness is derived over every non-test module in the tree, with a PREMISE that the recognised set is non-empty and an assertion that at least one member contributes no site. Six modules qualify today (`audit-model`, `check-imperative-lexicon`, `frontmatter`, `generate-catalog`, `generate-guarantees`, `validate-agent-factory` — which still carries `startsWith("## Commit")`), one of which is the owner, so the conjunction is measured over five witnesses instead of one.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts` — 286 passed; full suite exit 0
- **Committed in:** `3951a557`

**3. [Rule 4-adjacent - plan premise corrected] The plan's two table criteria contradict each other**

- **Found during:** Task 2
- **Issue:** The plan requires (a) the comment block byte-identical between the twins with "the two known prose differences" as the only remaining diff, and (b) `diff` of the two twins' column-table regions to yield no output. One of the two known differences **is** a table row — the seed says `analysis and design recorded as typed notes per Workflow 16,` where the live board says `handoffs complete,` — and the same plan freezes that table because `check-imperative-lexicon.ts:663` anchors a derived part on it. Criteria (a) and (b) cannot both hold without editing the frozen table.
- **Resolution:** The freeze wins, and no table byte was touched. After the rewrite the twins differ by **exactly one** line — that pre-existing `Ready for Dev` row — because making the comment byte-identical necessarily removed the in-comment difference (`moves, e.g.` vs `moves. Example row shape`). The invariant this task actually holds is asserted mechanically: `grep -cE '^[-+]\| '` over the twins' git diff prints `0`, so this task changed no table line in either file. No user decision was needed; the plan's own freeze is the stronger constraint and it was honoured.
- **Files modified:** none beyond the planned two
- **Verification:** `npm run check:imperative-lexicon` exit 0, `boardColumns 13`, no derivation refusal

**4. [Rule 2 - Missing critical] `32-VALIDATION.md` carried three commands that select zero tests**

- **Found during:** Task 3
- **Issue:** `vitest -t` is a substring filter over test titles and exits **0** when it selects nothing. Three planned rows named titles the implementations never used — `32-01-02` (`-t "read seam"`, 0 of 74), `32-01-03` (`-t "end-to-end"`, 0 of 74), `32-04-01` (`-t "admits"`, 0 of 34). Each would have been marked green on its exit code while measuring nothing.
- **Fix:** The filters are corrected to titles that exist, the corrected runs' counts are what the Status column carries, and the correction is disclosed in a `## Mark-up Record` section rather than done quietly.
- **Files modified:** `.planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md`
- **Committed in:** `074ee333`

### Documented Plan-Premise Corrections

**D-06's "first import from `scripts/`" is factually wrong.** `board-model.js` is the **fourth**. `./kit-model.js`, `./checkpoints.js` and `./context-io.js` were already imported at `:59`, `:64` and `:71`. The plan's own `<planner_assumptions>` flagged this from 32-RESEARCH; it is recorded here as the plan's acceptance criteria require, and in `32-08-GREEN-proof.txt` §6. The work is unchanged.

---

**Total deviations:** 4 (1 blocking, 1 bug, 1 plan-premise contradiction resolved in favour of the stronger constraint, 1 missing-critical verification gap)
**Impact on plan:** Two were caused by this plan's own correct edits breaking hand-typed literals in neighbouring tests; both were fixed by deriving, which is strictly stronger than what was there. One resolved a contradiction between two of the plan's criteria without touching the frozen artifact. One closed a verification hole that would have recorded three vacuous passes. No scope creep: `install/` is untouched, `package-lock.json` is byte-unchanged, and no dependency was added.

## Issues Encountered

**`npm run check:diff-disposition` exits 1, and it is not this phase's.** Findings name five workflow documents — `05-pr-quality-gate.md`, `06-uat-pack.md`, `16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md` — whose last commits are all Phase 31 (`49bb4cd5`, `9af0c0fe`, `c08eb3f4`, `84d5369d`). Verified pre-existing rather than assumed: the gate was run on a detached worktree at `6d59ed1e`, the commit before this plan began, and returned the **identical** finding set. No file this plan changed appears in the findings. CI wires the gate at `.github/workflows/ci.yml:473`. Logged to `deferred-items.md` and the windows ledger; **not** marked green and **not** fixed here, per the scope boundary.

**A protected-branch note.** `.planning/config.json` sets `use_worktrees: false` and every plan in this phase committed directly to `main`, which is what the orchestrator instructed for this run. `git.allow_default_branch_commits` is not set in the project config, so the executor's protected-branch assertion would ordinarily halt. It was not drift — `main` was the deliberate, instructed target — so the plan proceeded and the gap is recorded here rather than papered over. Setting the flag would make the intent explicit for future runs.

## The DASH Requirement Trail

Each statement, the plan that landed it, and an automated command that demonstrates it. A requirement with no named command is not closed.

| Req | Plan(s) | Automated command |
|-----|---------|-------------------|
| DASH-01 | 32-01, 32-02, **32-08** | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` (99 passed — includes the four source-shape absences proving the inline pair is deleted) and `scripts/board-tracer.test.ts -t "board-model — the heading grammar (D-05)"` (23 passed) |
| DASH-02 | 32-02, 32-04 | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-oracle.test.ts` (14 passed) and `scripts/board-corpus.test.ts -t "the LIVE half is admitted"` (2 passed) |
| DASH-03 | 32-05 | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "conflict kinds"` (2 passed) and `-t "golden"` (6 passed) |
| DASH-04 | 32-03 | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts` (22 passed) |
| DASH-05 | 32-03, 32-07 | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts -t "torn"` (2 passed) and `scripts/board-dashboard.test.ts -t "non-tty"` (2 passed) |
| DASH-06 | 32-06 | `npm run check:dashboard-readonly` (exit 0) and `scripts/board-readonly.test.ts` (24 passed) |
| DASH-07 | 32-07 | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts -t "exit"` (16 passed) |
| DASH-08 | 32-05, 32-06, **32-08** | `git diff --exit-code caeb9335..HEAD -- package-lock.json` (exit 0, phase-wide), `node -e "process.exit(require('./package.json').dependencies===undefined?0:1)"` (exit 0), `git status --porcelain install/` (no output), and `scripts/board-readonly.test.ts -t "no socket"` (4 passed) |

`package.json` did gain two `scripts` entries across the phase — `dashboard` and `check:dashboard-readonly`, both required by D-16 and D-21. It gained no `dependencies` key, and `package-lock.json` is byte-identical to its pre-phase state.

## The Phase-Close Gate Sweep

Every command below was run. Nothing is recorded that was not.

| Command | Result |
|---------|--------|
| `npm run build` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run check:build-parity` | exit 0 |
| `npm run freshness` | exit 0 — 65 committed `.js` match a rebuild |
| `npm run freshness:context` · `:catalog` · `:adapters` · `:skill-twins` · `:guarantees` · `:hook-manifest` · `:queue` · `:traceability` | exit 0 (8 gates) |
| `npm run check:imperative-lexicon` | exit 0 — `boardColumns 13`, `contracts 3`, no derivation refusal |
| `npm run check:banned-claims` · `check:public-docs` · `check:claim-anchors` · `check:nul-bytes` | exit 0 |
| `npm run check:audit-register` · `check:residual-citations` · `check:platform-shapes` | exit 0 |
| `npm run check:dashboard-readonly` | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — `ALL CHECKS PASSED` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — 74 files, 4687 passed, 2 skipped |
| `npm run check:diff-disposition` | **exit 1 — PRE-EXISTING**, identical finding set at `6d59ed1e`, five Phase-31 workflow documents, logged to `deferred-items.md` |
| `npm test` (bare) | **NOT RUN** by design — it is `vitest run` with no exclude and triggers the live claude-CLI e2e lane |
| `npm run test:e2e` | **NOT RUN** — same lane; recorded as `UNKNOWN - verify` for this plan |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 32 is code-complete.** All eight DASH requirements have a named automated command behind them, `32-VALIDATION.md` is marked up from real runs with `wave_0_complete: true`, and the full suite is green.
- **One outstanding red before ship:** `check:diff-disposition`. It predates this phase, but CI runs it, so it will red a PR. The remedy is disposition rows under `docs/audit/29-style-dispositions/` for five Phase-31 workflow edits, three of which owe a `companion` cell.
- **Windows `fs.watch` stays `UNKNOWN - verify`** pending Phase 33 / CAP-02. The mandatory poll floor is the fallback by construction; nothing in this phase asserts Windows watch behaviour.
- **Manual UAT still owed:** the live TTY redraw (`npm run dashboard` in a real terminal, edit `plans/board.md`, confirm a calm refresh within ~1 s). A pty is not modelled in the suite.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- All four created files exist on disk: `32-08-RED-baseline.txt`, `32-08-GREEN-proof.txt`, `deferred-items.md`, `32-08-SUMMARY.md`.
- All six commits reachable: `28e67a13`, `054a34a2`, `62085394`, `3951a557`, `074ee333`, `b13cb891`.
- `commits: 5` in the frontmatter is `git rev-list --count 6d59ed1e..HEAD` measured at SUMMARY-write time, before the SUMMARY commit itself.
- Every task's `<acceptance_criteria>` re-run and passing, except the one plan criterion resolved as a contradiction (Task 2's twin-table `diff`), documented under Deviations.
- Plan-level `<verification>`: all six checks green; the phase-close sweep's one red is `check:diff-disposition`, recorded as pre-existing.
