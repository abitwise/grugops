---
phase: 32-board-projector-cli-dashboard
plan: 37
subsystem: testing
tags: [adversarial-review, gap-closure, verification, board-projector, dash-06, ledger]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-31..32-36 — the five canonical-form cutovers this round re-measures independently"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-VERIFICATION.md, 32-REVIEW.md, 32-23-ADVERSARIAL-REVIEW.md and 32-24-RED-baseline.txt — the four oracles whose every recorded reproduction is re-run"
provides:
  - "32-37-ADVERSARIAL-REVIEW.md — the round-3 self-review: premise, 31 re-measured reproductions, 17 reachability/sibling-arm rows, the neighbour-variation pass, a manifest-derived gate sweep, 5 OPEN findings with reproductions, a ledger asserted total, two balanced probe arithmetics"
  - "A created-versus-inherited ratio of 2 of 5 — the first fall in this phase, from round 2's 4 of 5"
  - "Five new residual ledger rows (195-199) and five round-2 rows (187-191) closed on measured evidence"
  - "Both carried items re-measured and still carried, with 32-35's recorded check:diff-disposition count corrected from 77 to 78"
affects: [verification, phase-32-round-4, phase-33-windows-portability]

actuals:
  tokens: 26933
  tasks: 3
  commits: 5
  plan_head_before: d417401369e09f7253f1106dd5a77ae3256e40d2

tech-stack:
  added: []
  patterns:
    - "A harness self-test is printed beside every measurement it produces: four of this pass's own instruments returned a false result before they returned a true one, and each is recorded in the report rather than quietly repaired"
    - "A ledger whose row count exceeds its inventory count states the arithmetic that reconciles them instead of collapsing the duplicated rows"
    - "Residual-ledger reconciliation asserts MEMBERSHIP and STATUS across both representations, not membership alone"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-37-ADVERSARIAL-REVIEW.md
  modified:
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Every finding recorded OPEN with a reproduction; no source file touched, because a closure applied at the end of a round in a plan that does not own the file is how the previous round's first finding was made"
  - "32-35's recorded check:diff-disposition count of 77 is corrected to 78 rather than repeated: the count never moved, the earlier instrument counted `(added)` finding lines only"
  - "The plan's own Task 2 verify command `node scripts/validate-agent-factory.js` exits 1 by design (the C3 no-false-green guard); recorded as a fourth harness-premise failure and as Deviation 1, not as a red gate"
  - "The ledger prints 15 rows against a 13-item inventory and shows `15 - 1 - 1 = 13`, because WR-03 and WR-04 each appear under two names in the verifier's frontmatter and the plan requires the duplication be named"

patterns-established:
  - "Assert the harness's own premise with a POSITIVE control: an instrument that cannot return a positive is indistinguishable from a passing measurement"
  - "Ask a relocated refusal which authority holds it NOW and whether that authority is at least as strong, per stolen refusal rather than per partition"
  - "Ask of every derived predicate which axis is still an enumeration: this round derived two axes of three authorities and left the third hand-written in each"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08]

coverage:
  - id: D1
    description: "The harness's own premise is asserted and printed before any transcript: build, typecheck, build-parity and freshness all exit 0, and 65/65 committed .js match a rebuild of their sources"
    requirement: "DASH-08"
    verification:
      - kind: other
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every recorded reproduction from all four prior documents is re-run against the rebuilt committed .js and carries a measured verdict — 31 prior reproductions re-measured, 30 closed, 1 open"
    requirement: "DASH-06"
    verification:
      - kind: other
        ref: "13 plants into the committed scripts/board-read.js + npm run check:dashboard-readonly, restored clean after each (32-37-ADVERSARIAL-REVIEW.md sections 1.1-1.4)"
        status: pass
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 75 files, 5120 passed, 2 skipped, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The three baseline rows that were already refused before this round are answered per spelling, naming which authority refuses them now and whether the acquisitions PREMISE case is among the failures"
    requirement: "DASH-06"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md section 1.4 — file://, C:\\ and import(/abs/) moved from the builtin allow-list to the foreign branch, 6/6/2 failing cases to 98, PREMISE not-red to red"
        status: pass
    human_judgment: false
  - id: D4
    description: "All fourteen of the verifier's behavioural spot-checks re-run verbatim with old and new results side by side: six recorded FAIL now pass, none of the eight recorded PASS regressed"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md section 2"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every new refusal branch carries a written reachability answer and a sibling-arm answer, derived from the seven changed source files rather than from the plans — 17 rows"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md section 3; suite membership derived by `npx vitest list --exclude '**/scripts/e2e/**'` (69 files), CI wiring read out of ci.yml:102,174,242,517"
        status: pass
    human_judgment: true
    rationale: "Whether each written sibling-arm answer is the RIGHT question for that branch is a judgment about adequacy of adversarial coverage, not a property any command asserts"
  - id: D6
    description: "Five findings, every one OPEN with a severity, a file, a created-or-inherited attribution and a runnable reproduction; the created-versus-inherited ratio stated as a number (2 of 5)"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md sections 6-7; each finding's reproduction block was run to produce the transcript printed beside it"
        status: pass
    human_judgment: true
    rationale: "Severity assignment and the created-versus-inherited attribution are judgments; the reproductions under them are measured, but whether five is the right number of findings cannot be asserted by a command"
  - id: D7
    description: "A gate sweep whose row set is derived from package.json rather than recalled: 20 rows, 19 exit 0, check:diff-disposition exit 1 with zero overlap with this round's 19 changed files"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md section 5; row set derived by reading package.json's scripts keys prefixed check:/freshness"
        status: pass
    human_judgment: false
  - id: D8
    description: "The round ledger is total against a stated inventory (15 printed rows, 13 inventory items, the duplication arithmetic printed), and both probe arithmetics balance (7+5=12; 31=31=31, 0 dropped)"
    verification:
      - kind: other
        ref: "32-37-ADVERSARIAL-REVIEW.md sections 8 and 10; prohibition counts derived from the seven plans' own must_haves.prohibitions blocks"
        status: pass
    human_judgment: false
  - id: D9
    description: "Both carried items re-measured and still carried, with a correction to a recorded measurement: check:diff-disposition is 78 findings, not the 77 32-35 recorded"
    verification:
      - kind: other
        ref: "npm run check:diff-disposition — exit 1, headline `78 finding(s) over 39 elements`, per-file distribution 38/25/10/3/2 derived from the gate's own finding lines"
        status: pass
    human_judgment: false
  - id: D10
    description: "Both representations of .planning/WINDOWS.md agree after this round's rows are appended, asserted on membership AND status"
    verification:
      - kind: other
        ref: "identifier-by-identifier comparison of the Markdown table against the JSON block: 199 compared, 199 table rows, 199 json rows, 0 membership disagreements, 0 status disagreements"
        status: pass
    human_judgment: false
  - id: D11
    description: "The live claude-CLI end-to-end lane was not run and its state is recorded UNKNOWN - verify with its reason"
    verification: []
    human_judgment: true
    rationale: "Unmeasured by design — the lane spends tokens on an authenticated box and can hang. The record is the deliverable; a human decides whether the lane needs running before the phase closes. Ledger row 183."

duration: 43 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 37: Gap-Closure Round 3 Adversarial Self-Review Summary

**Thirty-one prior reproductions re-measured against the artifact a host runs — thirty closed, including all three verifier blockers and all five of round 2's own findings — with the created-versus-inherited ratio falling for the first time in this phase to 2 of 5, and four failures of this pass's OWN harness caught and recorded before any of them could report a false PASS.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-09-16T13:04:25Z
- **Completed:** 2026-09-16T13:47:29Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified — all planning artifacts; zero source files)

## Accomplishments

- **The harness's own premise failed FOUR times, and every failure is in the report rather than quietly repaired.** A recovery count taken over `JSON.stringify(parsedDocument)` reported 0 on every input including a planted positive control — because `JSON.stringify` re-escapes a control character back into printable text, which is *the same defect as the finding it was measuring*. A stray `./--` file was read by every row of one table. A `watch` handle stub missing `on()` reported an empty armed set on a pristine tree. And this plan's own `<verify>` command, `node scripts/validate-agent-factory.js`, exits 1 by design. Three of the four would have reported a PASS. Each corrected instrument now prints a self-test beside its result.
- **All six of the verifier's FAILING spot-checks now pass, and none of its eight PASSING rows regressed.** The absolute-path specifier and the member-path binding both exit 1 with the write-detection PREMISE case among the failures; the id-vs-stem fabrication is replaced by an honest sentence; a symlinked entry no longer un-arms its siblings; the stale watch record is cleared; and a raw C0 planted at four sites is recovered by neither channel, measured with an instrument that was proved able to find one.
- **The one-edit re-green is dead, measured by paying for it.** Applying the exact edit the failing message suggests (`"process.report"` into `EXPECTED_GLOBAL_MEMBER_PATHS`, count 10 to 11) leaves the guard at exit 1. Paying the second pinned decision as well leaves it at exit 1, now refusing `process.report.writeReport` — a path that did not exist on this tree before the round.
- **No relocated refusal landed on a weaker predicate, and that was measured per stolen refusal.** `file://` and `C:\` left the builtin allow-list for the foreign branch: 6 failing cases became 98, and the acquisitions PREMISE case went from *not* among the failures to among them. One spelling (`data:`) carries `UNKNOWN - verify` for its case-count comparison rather than an assumed answer.
- **Five findings, every one OPEN with a reproduction, and two of the five created by this round's own fixes.** F-09 (a refusal message whose quoted TAB evidence the sanitizer strips, so it denies that a valid `key: value` line is one) and F-12 (a `row-without-file` sentence asserting a join that did not happen, for a duplicate-id loser) are the F-05 and F-06 fixes' sibling arms. F-10, F-11 and F-13 are inherited: three authorities that each derived two axes this round and left the third — scope, target regex, specifier position — hand-written.
- **A recorded measurement is corrected rather than repeated.** `check:diff-disposition` is 78 findings over the same five Phase-31 documents, identical to rounds 1 and 2. 32-35 recorded 77 and attributed the difference to a movement; the count never moved, and the earlier instrument counted `(added)` finding lines only.
- **Both residual representations agree on membership AND status** — 199 identifiers compared, 199 rows each half, 0 membership disagreements, 0 status disagreements — after five round-2 rows were closed on measured evidence and five new rows appended.

## Task Commits

1. **Task 1: Assert the harness's own premise, then re-run every recorded reproduction** — `6603626c` (docs)
2. **Task 2: Ask the two questions per new refusal branch, and run the neighbour-variation pass** — `0779cd67` (docs)
3. **Task 2 correction: record the fourth premise failure** — `bcbb730f` (docs)
4. **Task 3: The round ledger asserted total, the carried items re-measured, both representations reconciled** — `8b074b5e` (docs)

**Plan metadata:** the final `docs(32-37): complete the round-3 adversarial self-review plan` commit. Its hash is deliberately NOT quoted here: this SUMMARY is inside that commit, so any hash written in it names a commit that the write itself replaces. `git log --oneline -1` after the plan closes is the honest way to read it.

## Files Created/Modified

- `.planning/phases/32-board-projector-cli-dashboard/32-37-ADVERSARIAL-REVIEW.md` — the round-3 self-review in twelve sections: the premise and its four failures, 31 re-measured reproductions, the fourteen spot-checks re-run verbatim, 17 reachability/sibling-arm rows, the neighbour-variation pass with the relocation table, the manifest-derived gate sweep, five OPEN findings, the ratio, the ledger, both carried items, both probe arithmetics, the residual reconciliation, and a closing section naming what the document does not say
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — both carried items re-measured and left carried, including the correction to 32-35's recorded finding count
- `.planning/WINDOWS.md` — rows 187-191 marked fixed on measured evidence; rows 184, 185, 192, 193 and 194 left open each with a measurement; rows 195-199 appended for this round's five findings; both representations reconciled

## Decisions Made

- **Nothing was fixed here.** The plan owns no source file, and this repository has a recorded incident of a closure applied at the end of a round in a plan that did not own the file becoming the next round's first finding. `git diff --exit-code -- scripts/ agent-factory/ docs/ .planning/REQUIREMENTS.md .planning/ROADMAP.md` is exit 0.
- **32-35's recorded count of 77 was corrected in place rather than repeated**, because carrying a number that was never true is exactly the drift the re-measurement exists to catch.
- **The ledger prints 15 rows against a 13-item inventory and shows the arithmetic** rather than collapsing two rows, because the plan requires that a duplicated inventory item be named and given its own dispositions — and in both cases (WR-03, WR-04) the two names have *different* answers.
- **Row 191 (F-07) is marked fixed and the mixed-spelling residual is appended as a NEW row (197)** rather than folded back into 191, so the ledger records what was closed and what replaced it as two facts instead of one hedge.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's Task 2 verify command is unrunnable as written**

- **Found during:** Task 2 (running the plan's own `<verify>` block)
- **Issue:** `node scripts/validate-agent-factory.js` exits 1 with `ERROR  VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. The validator does not FAIL; it REFUSES to run. Defaulting the kit root to `.` is how a validator reports green over a tree it never examined, and the tool treats an unset `VALIDATE_KIT_ROOT` as a hard error by design (`scripts/validate-agent-factory.ts:31-33`). The plan's `<fails_when>` reads "non-zero exit from any of the three — a gate this round touched is red at the end of the round", which would have produced a finding about a guard working exactly as intended.
- **Fix:** ran all three spellings and recorded all three exits. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` (the spelling `ci.yml:517` uses) → exit 0, `ALL CHECKS PASSED`. `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` (round 2's sweep spelling) → exit 0, `ALL CHECKS PASSED`. Both are in the gate sweep beside the bare spelling's exit 1 and its reason.
- **Files modified:** `32-37-ADVERSARIAL-REVIEW.md` only (the gate sweep and the harness-premise table, which grew from three rows to four)
- **Verification:** the three exits are printed in the report; no source file was touched
- **Committed in:** `bcbb730f`

**2. [Rule 1 - Bug] Four defects in this pass's own measuring instruments**

- **Found during:** Tasks 1 and 2
- **Issue:** a `JSON.stringify`-based recovery count structurally incapable of finding a control character; a stray `./--` file read by every row of one table because Node does not strip `--` from `process.argv`; a `watch` handle stub missing `on()`, which made `arm()` record a watch failure for every directory on a pristine tree; and the validator invocation above. Three of the four would have reported a PASS.
- **Fix:** each instrument corrected and given a printed self-test — a positive control that must find a planted control character, a clean control that must find none, a key-position control, and a pristine-tree control that must arm four directories. The stray `./--` was removed; `git status --short` confirms nothing tracked was touched.
- **Files modified:** none tracked (scratchpad harnesses under `$T`) plus the report
- **Verification:** the self-test transcripts are printed in `32-37-ADVERSARIAL-REVIEW.md` § 0.2
- **Committed in:** `6603626c`, `bcbb730f`

**3. [Rule 2 - Missing Critical] The standard `update_requirements` close-out step was SKIPPED**

- **Found during:** plan close-out
- **Issue:** the execute-plan workflow's `update_requirements` step marks this plan's declared requirements complete in `.planning/REQUIREMENTS.md`. This plan's `must_haves.prohibitions` say it "decides no requirement checkbox, no phase status and no verification verdict", and its Task 3 `<verify>` asserts `git diff --exit-code -- … .planning/REQUIREMENTS.md`. Running the step would have violated both.
- **Fix:** the step was not run. `requirements-completed` in this SUMMARY's frontmatter copies the plan's own `requirements:` array verbatim as the template requires; no checkbox and no traceability row was touched.
- **Files modified:** none — `.planning/REQUIREMENTS.md` is byte-identical to `HEAD`
- **Verification:** `git diff --exit-code -- .planning/REQUIREMENTS.md` → exit 0
- **Committed in:** n/a (a file deliberately not changed)

**A pre-existing discrepancy was found while confirming that, and is surfaced rather than corrected.** `.planning/REQUIREMENTS.md` marks **DASH-03, DASH-05 and DASH-08 as `[x]` / `Complete`** against a verification that marks all eight incomplete. `git log` names the cause: `f8c84e06 docs(32-33): complete the presence-derivation gap-closure plan` — a sibling gap-closure plan's ordinary `update_requirements` step, run on a phase whose standing verdict is `gaps_found`. The commit before it in that file's history is `7c1ff44d docs(phase-32): revert premature Complete requirements after gaps found`, so this is the second occurrence in this phase. **This plan corrects nothing**: reverting a status line here would be an executor deciding a verdict, which is the act the prohibition exists to prevent regardless of which direction it runs. It is recorded in `32-37-ADVERSARIAL-REVIEW.md` § 12 for the verifier.

**4. [Rule 3 - Blocking] The plan's Task 3 verify names `.planning/ROADMAP.md`, which sequential-mode close-out must write**

- **Found during:** plan close-out
- **Issue:** Task 3's `<verify>` asserts `git diff --exit-code -- scripts/ agent-factory/ docs/ .planning/REQUIREMENTS.md .planning/ROADMAP.md`, and its `<fails_when>` reads "this plan modified a source file, the requirements file or the roadmap, any of which would be deciding a verdict that belongs to the verifier". The dispatching orchestrator's sequential-mode instruction says the opposite for one of those files: "You DO update STATE.md and ROADMAP.md yourself at the end (sequential mode) … Do NOT flip the phase to Complete yourself."
- **Fix:** the verify was run and recorded GREEN over the four files where the prohibition is substantive — `scripts/`, `agent-factory/`, `docs/` and `.planning/REQUIREMENTS.md` are byte-identical to `d4174013` across the whole plan. `roadmap update-plan-progress 32` was then run as instructed, and what it changed was measured rather than assumed: this plan's own checkbox `[ ]` → `[x]`, and the progress cell `29/30` → `30/30`. **The Phase 32 checkbox is still `[ ]` and the status cell still reads `In Progress`** — the verdict the `<fails_when>` protects is untouched, which is what the prohibition is actually about.
- **Files modified:** `.planning/ROADMAP.md` (two lines, both about plan 32-37's own completion)
- **Verification:** `git diff --exit-code d4174013..HEAD -- scripts/ agent-factory/ docs/ .planning/REQUIREMENTS.md package.json` → exit 0; `sed -n '101p' .planning/ROADMAP.md` → `- [ ] **Phase 32: …**`; the status row reads `| 32. … | v2.1 | 30/30 | In Progress|  |`
- **Committed in:** the plan-metadata commit

---

**Total deviations:** 4 auto-fixed (2 blocking, 1 bug, 1 missing-critical).
**Impact on plan:** none on scope. Deviations 1 and 2 are about the measuring apparatus rather than the subject, and both are recorded in the report as evidence rather than corrected out of sight — which is the point the plan makes when it names "assert the harness's own premise" a standing probe. Deviations 3 and 4 are the plan's own prohibitions meeting workflow close-out steps: for `.planning/REQUIREMENTS.md` the prohibition wins outright and the step was skipped; for `.planning/ROADMAP.md` the orchestrator's sequential-mode instruction is explicit and the substantive half of the prohibition — no phase status, no verdict — is preserved and measured.

## Known Stubs

None. This plan produced no code.

## Issues Encountered

- **Every `--json` probe initially reported zero control code points recovered, including the positive control.** Resolved by replacing the instrument (see Deviation 2). This is the single most important thing that happened in this plan: without the positive control, four rows of this document would have reported CLOSED on an instrument that cannot return anything else.
- **`node scripts/validate-agent-factory.js` exiting 1** — resolved as Deviation 1.
- **`gsd-tools windows status | head -N` produces an EPIPE stack trace** after the tool has already written the ledger. Cosmetic and pre-existing; every append and every `fixed` transition was confirmed applied by re-reading `.planning/WINDOWS.md` directly. Not a defect of this round and not recorded as a finding against Phase 32.

## Threat Flags

None. This plan created no network endpoint, no auth path, no file-access pattern and no schema change. Every probe ran on a disposable copy outside the repository root, and every plant into a tracked file was restored with a recorded `git diff --exit-code`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**This plan decides nothing.** It changes neither `.planning/REQUIREMENTS.md`, nor the Phase 32 status line, nor any DASH-0x checkbox. The verifier decides those from this evidence in a separate pass.

**Round position: this was round 3 of a hard cap of 4. One round remains.** What round 4 would face, if it happens, is stated in the report's closing section and summarised here:

- **F-09 and F-12** are sentence-quality defects with an owner and a one-file blast radius — short, bounded edits in `scripts/board-dashboard.ts` and `scripts/board-model.ts`. The risk they carry is the one this phase has paid for three times: fixing the arm the finding names and not the arm beside it.
- **F-10, F-11 and F-13** are one shape three times over — an authority that derived two of its three axes this round and left the third as an enumeration. Widening any of those three enumerations by one entry is the move that produced round 2's findings, and this document predicts where the next escape would be. The alternative is a canonical form for the third axis, which is a larger change than a cap of 4 should absorb without a human decision about its cost.
- **Carried into whatever comes next:** `check:diff-disposition` red at 78 findings over five Phase-31 documents (ledger row 176, zero overlap with this phase); the live claude-CLI e2e lane `UNKNOWN - verify` (row 183); WR-07's CI-topology half owned by Phase 33 / CAP-02 (row 193); and the census's runtime-assembled blind spot (row 184) and production-file exemption (row 194).

**None of the five findings is a bypass of a safety invariant**, which is the material difference from every prior round of this phase. The three routes DASH-06 turns on were all planted here and all exit 1 with the write-detection mechanism among the failures.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*

## Self-Check: PASSED

- `32-37-ADVERSARIAL-REVIEW.md`, `32-37-SUMMARY.md`, `deferred-items.md` and `.planning/WINDOWS.md` all exist on disk (`[ -f ]` → FOUND for all four).
- All four task commits exist in history: `6603626c`, `0779cd67`, `bcbb730f`, `8b074b5e`.
- `commits: 5` is MEASURED — `git rev-list --count d4174013..HEAD` → `5` (four task commits plus this plan-metadata commit), taken from the plan ledger recorded before the first commit, not narrated.
- `npm run check:nul-bytes` → exit 0, and the gate names no `32-37` artifact.
