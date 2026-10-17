---
phase: 32-board-projector-cli-dashboard
plan: 41
subsystem: testing
tags: [gap-closure, gate-sweep, broken-windows-ledger, override-draft, human-decision, round-4-cap]

# Dependency graph
requires:
  - phase: 32-40
    provides: the round-4 adversarial review — the findings register (F-14..F-22), the created-versus-inherited ratio, and the round ledger this plan's decision is taken on
  - phase: 32-38
    provides: the eight post-verification fix commits whose product this round measured
provides:
  - a manifest-derived gate sweep in which every repository gate is RUN and recorded with its command, exit code and headline output, including the gates that were RED before this phase began
  - the regression lane recorded as three numbers and tabulated against six prior measurement points
  - every carried and undecidable ledger item re-measured on this tree with its overlap against this round's changed-file set stated as a number
  - both `.planning/WINDOWS.md` residual representations reconciled by identifier to a printed symmetric difference of zero
  - five ready-to-paste `overrides:` blocks, one per still-open phase must-have, applied nowhere
  - THE HUMAN'S CLOSE DECISION for Phase 32, recorded verbatim, with an owner for every one of the 18 open items
affects: [32-verification, phase-32.1, phase-33, gsd-verify-work]

# Actuals (#2632) — chars/4 over the realized diff, NOT a harness token count.
actuals:
  tokens: 20153
  tasks: 3
  commits: 3
plan_head_before: b27040d57528e2379e27fbd8a96517494c9a915e

tech-stack:
  added: []
  patterns:
    - "A ledger owner is joined to the residual register BY ROW IDENTIFIER rather than by adding a field the register's schema does not carry"
    - "A close decision records the human's words verbatim and marks any reading of them as a reading"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-41-GATES.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-41-OVERRIDE-DRAFT.md
    - .planning/phases/32-board-projector-cli-dashboard/32-41-SUMMARY.md
  modified:
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Phase 32 closes by Option C `defer-to-next-phase`: the human chose to carry the open items into a new sub-phase inserted before Phase 33, not to accept the drafted override and not to authorise a fifth-round fix"
  - "16 of the 18 open items are re-homed to Phase 32.1; the two Windows/CAP-02 halves keep the Phase 33 owner a prior decision already recorded; 0 items are left unowned"
  - "`.planning/WINDOWS.md` is left byte-unchanged by the decision: its row schema carries no owner field, so ownership lives in `deferred-items.md` keyed by ledger row id"
  - "`requirements-completed` is deliberately empty — this plan completes no requirement and is forbidden by its own acceptance criteria from marking one"

patterns-established:
  - "Round-cap close: when a phase spends its gap-closure round cap, the closing plan measures, drafts the override text, and puts the choice to a human rather than starting round N+1"
  - "Owner assignment is an 18-against-18 equality (items enumerated versus items with an owner), checkable rather than asserted"

requirements-completed: []   # DELIBERATELY EMPTY — see "Deviations from Plan". The plan's `requirements: [DASH-01..DASH-08]` names the requirements this plan BEARS ON; its own acceptance criteria forbid changing any requirement checkbox, and the phase's verification is `gaps_found`.

coverage:
  - id: D1
    description: "Every repository gate run from a row set DERIVED from package.json, each row recording its command, exit code and headline output, with the carried RED gates re-measured rather than described"
    verification:
      - kind: other
        ref: "32-41-GATES.txt — 16 manifest-derived gate rows, each with command + exit code + headline"
        status: pass
      - kind: other
        ref: "npm run check:nul-bytes (re-run at Task 3 over every document this plan wrote) — exit 0, ALL CHECKS PASSED, 2285 tracked files scanned"
        status: pass
    human_judgment: false
  - id: D2
    description: "The regression lane recorded as three numbers and set beside six prior measurement points, with the verdict HELD"
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 75 files, 5163 passed, 2 skipped, exit 0 (32-41-GATES.txt section 6)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every carried and undecidable ledger item re-measured on this tree with its overlap against this round's changed-file set stated as a number"
    verification:
      - kind: other
        ref: "deferred-items.md sections 'Carried items RE-MEASURED during plan 32-41' and 'The three items the fix pass could not decide'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both .planning/WINDOWS.md residual representations reconciled by comparing every row identifier, printing three numbers"
    verification:
      - kind: other
        ref: "identifier-set comparison re-run at Task 3: A=210, B=210, |symmetric difference|=0, 0 duplicates, derived open=197 waived=0 fixed=13"
        status: pass
    human_judgment: false
  - id: D5
    description: "Five ready-to-paste `overrides:` blocks, one per still-open must-have, each stating what the residual IS and what it is NOT — applied nowhere"
    verification: []
    human_judgment: true
    rationale: "A drafted override is text a human accepts or declines; whether each block states the residual without softening is exactly the judgment the checkpoint exists to put in front of a person. The human read them and chose NOT to accept them."
  - id: D6
    description: "The human's close decision for Phase 32 recorded verbatim, with the named owner and an owner for every open item"
    verification: []
    human_judgment: true
    rationale: "A decision is the human's to make and cannot be proven by a test; what IS mechanically checked is that the record changed no status line — asserted by `git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md` returning no output."

# Metrics
duration: 14h 6m (wall clock across an overnight human checkpoint; agent working time far shorter)
completed: 2026-09-17
status: complete
---

# Phase 32 Plan 41: Round-4 Close — Gate Sweep, Ledger Reconciliation, and the Human's Close Decision Summary

**Round 4 of Phase 32's four-round cap ends with every manifest-named gate re-measured, all 18 open items reconciled to a printed zero across both ledger representations, five override blocks drafted and left unapplied, and the human choosing Option C — the open items are carried into a new sub-phase rather than overridden or fixed in a fifth round.**

## Performance

- **Duration:** 14h 6m wall clock (2026-09-16T20:22Z → 2026-09-17T10:28Z), most of it the human checkpoint standing open overnight
- **Tasks:** 3 of 3
- **Files modified:** 4 (2 created, 2 modified) plus this SUMMARY

## Accomplishments

- **A gate sweep nobody recalled.** Task 1 derived the gate row set from `package.json` rather than from memory, ran all 16, and recorded each with its command, exit code and headline — the carried RED gate included, re-measured rather than described. The regression lane reads 75 files / 5163 passed / exit 0 and is tabulated against six prior measurement points; the verdict is HELD, no shrunken suite hiding behind a green tick.
- **The carried ledger re-measured with an overlap number per item.** Task 2 re-ran or re-read each carried and undecidable item on this tree and stated, as a number, the overlap between each item's own file set and this round's changed-file set. `check:diff-disposition` is still RED at 78 findings over the same five Phase-31 documents, overlap **0** — neither a regression of this round nor quietly absorbed into it. The two-instrument disagreement round 3 recorded (77 versus 78) did not reproduce, and that is stated rather than smoothed.
- **Both ledger representations reconciled by identifier, not by count.** 11 rows (ids 200–210) appended to `.planning/WINDOWS.md`, then the markdown table's id column compared against the JSON array's id field: A=210, B=210, **|symmetric difference| = 0**, zero duplicates, frontmatter counters re-derived from the JSON rather than trusted. Re-run at Task 3 after the ownership section landed: unchanged.
- **Five override blocks drafted and applied nowhere.** One per still-open phase must-have, each naming what the residual IS and what it is NOT, with `accepted_by`/`accepted_at` left as placeholders because a human fills those. The draft also caught that `32-VERIFICATION.md`'s own drafted DASH-03 block is for a residual now measured CLOSED and must not be pasted as written.
- **The human decided, and the decision is recorded in their own words.** Option C, `defer-to-next-phase`. All 18 open items now carry an owner: 16 re-homed to Phase 32.1, 2 keeping Phase 33, 0 unowned.

## Task Commits

1. **Task 1: the gate sweep derived from the manifest, regression lane beside every prior round** — `b6f6bd45` (docs)
2. **Task 2: the carried ledger re-measured, residual representations reconciled, the override drafted** — `aff1ad83` (docs)
3. **Task 3: the human's Option C decision recorded, every open item given an owner** — `637edbce` (docs)

**Commits measured, not narrated:** `git rev-list --count b27040d5..HEAD` = **3**, with the ledger base `b27040d57528e2379e27fbd8a96517494c9a915e` recorded in the frontmatter as `plan_head_before` so the same instrument can be re-run.

## Files Created/Modified

- `.planning/phases/32-board-projector-cli-dashboard/32-41-GATES.txt` — 16 manifest-derived gate rows, the four-round regression-lane table, per-file case counts, the build-parity proof, and this round's changed-file set on both a narrow and a wide base
- `.planning/phases/32-board-projector-cli-dashboard/32-41-OVERRIDE-DRAFT.md` — five `overrides:` blocks, the must-have-to-finding map, and the 18-items-against-18-homes equality
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — carried items re-measured, the three undecidable items given rows, the new residual this round produced, and (Task 3) the ownership section
- `.planning/WINDOWS.md` — 11 residual rows (200–210) in both representations, reconciled; **byte-unchanged by Task 3**

## The Decision (Task 3)

**Chosen option id, verbatim:** `defer-to-next-phase` (Option C)

**The human's own words, verbatim:**

> defer to new sub-phase before next phase.

**The named owner:** **Phase 32.1 (new sub-phase, to be inserted before Phase 33 — not yet in ROADMAP).**

**Stated as a reading rather than as the human's words:** the owner name above is the orchestrator's interpretation of that sentence — a NEW sub-phase of Phase 32, inserted before Phase 33, which does not exist in `ROADMAP.md` yet. **This plan did not create it.** Inserting a phase is a separate roadmap operation (`/gsd-phase insert`) the orchestrator runs after this plan closes.

**What was NOT chosen, recorded so a later reader is not left to infer it:**

- **Option A was not chosen.** The five blocks in `32-41-OVERRIDE-DRAFT.md` remain a DRAFT, applied nowhere, with both placeholders unfilled. No override was accepted against any must-have.
- **Option B was not chosen.** No fifth-round fix is authorised and no finding was named for one.
- **Option D was not available.** The register records eight open findings (F-14..F-21), so "nothing is open" was never on the table.

**The three things the checkpoint required, all presented before any option was recommended:** the eight open findings with severity, requirement and created-versus-inherited verdict; the round-4 ratio **5 of 8 (0.63)** set beside round 1 (1 of 3, 0.33), round 2 (4 of 5, 0.80) and round 3 (2 of 5, 0.40) — **the ratio ROSE against round 3**, which is the number the options turned on; and the five override blocks read as written.

### Ownership of all 18 open items

| # | Open item | WINDOWS.md row | Owner |
|---|---|---|---|
| 1 | F-14 a quoted identifier's C1 byte deleted before the reader sees it | 200 | Phase 32.1 |
| 2 | F-15 the split-reader refusal enumerates ONE import shape | 201 | Phase 32.1 |
| 3 | F-16 regular-expression literals are not blanked | 202 | Phase 32.1 |
| 4 | F-17 template-literal dynamic import invisible to scanner AND oracle | 203 | Phase 32.1 |
| 5 | F-18 the bare arm's refusal relocated onto a single predicate | 204 | Phase 32.1 |
| 6 | F-19 the one-authority rule enumerates reads by identifier TEXT | 205 | Phase 32.1 |
| 7 | F-20 one consumer still uses the unresolved spelling | 206 | Phase 32.1 |
| 8 | F-21 the step counter's separator alphabet excludes five shell shapes | 207 | Phase 32.1 |
| 9 | carried: `check:diff-disposition` RED, 78 findings over 5 Phase-31 documents | 176 | Phase 32.1 |
| 10 | carried: the live claude-CLI e2e lane, `UNKNOWN - verify` | 183 | Phase 32.1 |
| 11 | carried: WR-07's CI-topology half | 186, 193 | **Phase 33 (unchanged)** |
| 12 | carried: the PRODUCTION-file census exemption | 194 | Phase 32.1 |
| 13 | carried: a key spelling assembled at RUNTIME | 184 | Phase 32.1 |
| 14 | carried: `board-tracer.test.ts` as the 9th registry exemption | 210 | Phase 32.1 |
| 15 | undecidable: a runtime writer value or a future `node_modules` dependency | 208 | Phase 32.1 |
| 16 | undecidable: the `windows-latest` delivery band | 186, 193 | **Phase 33 (unchanged)** |
| 17 | undecidable: a module reached through a NESTED RUNNER | 207 (= F-21) | Phase 32.1 |
| 18 | NEW: `32-40` attributes the WR-04 fix to `7aea94f0`; it is `7a3ae592` | 209 | Phase 32.1 |

```
items enumerated .....................................  18
items re-homed to Phase 32.1 .........................  16
items keeping an owner a prior decision recorded .....   2   (items 11 and 16)
items left with no owner .............................   0
```

Items 11 and 16 do not move because Option C's own stated condition is that the owning phase must genuinely touch the same surface: both are halves of the Windows measurement, Phase 33 owns the `windows-latest` leg and CAP-02, and that ownership was recorded before this decision by `.planning/WINDOWS.md` rows 186 and 193. Re-homing them would overwrite a recorded owner with a phase that cannot take the measurement.

## Decisions Made

- **Ownership is recorded in `deferred-items.md`, not by mutating `.planning/WINDOWS.md` rows.** The register's schema is `id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at` in both representations and carries **no owner field**. Inventing one would have meant editing 16 rows twice over in a register this plan spent Task 2 reconciling, for a field no consumer reads. Ownership is joined to the register by ROW IDENTIFIER — the same key the reconciliation asserts on — and `.planning/WINDOWS.md` is byte-unchanged by Task 3.
- **Three items moved from a conditional owner to a named one, and the prior wording is preserved rather than replaced.** The remedies are unchanged: item 12's honest fix is still to stop writing the two ticket key words into that module's prose rather than to narrow the predicate; item 13's is still a different instrument rather than one more resolution arm; item 17's is still a canonical form rather than a wider alphabet. Only the phase carrying them changed.

## Deviations from Plan

### 1. [Rule 2 — Missing critical / no-fabrication] `requirements-completed` left EMPTY against the template's "copy verbatim" instruction

- **Found during:** Task 3, writing this SUMMARY.
- **Issue:** The SUMMARY template says to copy the plan's `requirements:` array verbatim into `requirements-completed`, and to run `requirements.mark-complete` on those IDs. This plan's `requirements:` field is `[DASH-01 … DASH-08]` — all eight phase requirements. But the plan's own acceptance criteria state that **no requirement checkbox may be changed by this task under any option**, the phase's verification stands at `gaps_found`, and eight findings are open against those exact requirements. Claiming all eight complete would be a fabricated gate result, which this project's CLAUDE.md forbids outright.
- **Fix:** `requirements-completed: []`, with the reason written inline in the frontmatter, and the `requirements.mark-complete` step **skipped**. The plan's `requirements:` field is read as the requirements this plan BEARS ON, not the ones it completes. Marking them is the verifier's call in its own pass.
- **Verification:** `git status --porcelain -- .planning/REQUIREMENTS.md` → no output, asserted before and after.
- **Committed in:** this SUMMARY's own commit.

---

**Total deviations:** 1 (1 no-fabrication / plan-constraint conflict).
**Impact on plan:** None on scope. The deviation preserves the plan's hardest constraint against a generic template instruction that would have violated it.

## Issues Encountered

- **The roadmap plan-progress verb would flip Phase 32 to `Complete`.** With this SUMMARY on disk the phase reads 34 plans / 34 summaries, and `roadmap.update-plan-progress` sets `Complete` with a date on that equality. The plan forbids a phase-status change under every option, and this repository has already had one premature `Complete` in this phase that had to be reverted. Handled at the state-update step: the plan-count tick is kept, any status flip is reverted to `In Progress`, and the revert is recorded in the tracking commit.
- **No other issue.** No gate that was green went red, no test was skipped to make a number, and no production file was touched by this plan.

## Known Stubs

None produced by this plan. It changes no production code and writes no placeholder — `git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json` over this plan's range is clean. The 18 OPEN items above are pre-existing residuals with named owners, each already carried as a `.planning/WINDOWS.md` ledger row, not new stubs introduced here.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 32 is NOT marked complete by this plan, deliberately.** Its verification stands where the verifier left it. What changed is that the phase now has a recorded human decision on how it closes, and every open item has an owner.
- **The orchestrator's next move is a roadmap operation this plan deliberately did not perform:** insert Phase 32.1 before Phase 33 (`/gsd-phase insert`), seeded from the 16 items re-homed to it in the ownership table above.
- **Phase 33's scope is unchanged** and still carries the two Windows/CAP-02 halves (items 11 and 16).
- **The drafted override blocks stay on disk unapplied.** If a later reader reaches for them, note the correction recorded in `32-41-OVERRIDE-DRAFT.md` § 0: the DASH-03 block drafted in `32-VERIFICATION.md` covers a residual now measured CLOSED and must not be pasted as written.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-17*

## Self-Check: PASSED

Run 2026-09-17, after the tracking commit.

```
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-41-GATES.txt
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-41-OVERRIDE-DRAFT.md
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-41-SUMMARY.md
FOUND: .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
FOUND: .planning/WINDOWS.md
FOUND commit: b6f6bd45  (Task 1)
FOUND commit: aff1ad83  (Task 2)
FOUND commit: 637edbce  (Task 3 — the decision)
FOUND commit: 2cc2a559  (this SUMMARY)
FOUND commit: 868f36e3  (STATE + ROADMAP tracking)
```

**The three assertions this plan exists to make, re-run at close rather than recalled:**

```
$ git diff --stat aff1ad83..HEAD -- .planning/WINDOWS.md
(no output — the residual register is byte-unchanged by Task 3)

$ git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
(no output — every tracking write is committed, none is a status flip)

$ npm run check:nul-bytes
ALL CHECKS PASSED — 2285 tracked files scanned, exit 0
```

**The one roadmap write, stated so it is not mistaken for a status flip.** `roadmap.update-plan-progress 32` moved the Phase 32 progress row from `33/34` to `34/34` and ticked `32-41-PLAN.md` from `[ ]` to `[x]`. It returned `"status": "In Progress", "complete": false` — the verb did NOT mark the phase complete, so nothing had to be reverted. The Phase 32 checkbox in the phase list is still `- [ ]`, and `STATE.md`'s `status:` line is unchanged.
