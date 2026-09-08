---
phase: 31-autonomous-manual-testing
plan: 11
subsystem: testing
tags: [typescript, ast, playwright, uat, quality-gate, spec-integrity]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-02's uat-spec-integrity runnable and its D-14 arm-(c) ban; 31-06's calleeDottedPath normaliser and the fixtures typecheck target; 31-03's browser-uat-recipe ban-set region"
provides:
  - "isBannedModifierPath — the ONE membership authority for D-14 arm (c), deciding a resolved dotted path by its head and tail segments rather than by exact membership in a list"
  - "BANNED_MODIFIER_HEADS / BANNED_MODIFIER_TAILS / BANNED_EXACT_PATHS — the rule's three exported constants, quoted by value in the recipe under a both-directions equality test"
  - "the deletion of BANNED_CONSTRUCTS, so no enumerable list of banned dotted paths survives anywhere in the runnable"
  - "test.fail decided (WR-12): the inverting modifier joins the banned tail set"
  - "modifier-family.uat.spec.ts and modifier-group-clean.uat.spec.ts — the routed-modifier fixture and its false-positive control, both inside the fixtures typecheck target"
  - "the declared @playwright/test surface extended with serial, parallel, configure and fail, with a header that states it is now read by a coverage-adjacent claim"
  - "D-17 recorded as a dated gap-closure decision in 31-CONTEXT.md, in the source beside the rule, and here"
affects: [31-12, uat-spec-integrity, browser-uat-recipe, spec-integrity-gate]

actuals:
  tokens: 20986
  tasks: 3
  commits: 5
  plan_head_before: 4059314fd5dda11f144e993d8e8e008266a6653a

tech-stack:
  added: []
  patterns:
    - "membership by RULE over a normalised value, with exactly one function answering the question and the call site asking rather than comparing"
    - "the acceptance corpus GENERATED from the predicate's own constants, declared as evidence and never as a second authority"
    - "the CONVERSE asserted beside the refusal: a false-positive control proving the rule is not a blanket refusal"

key-files:
  created:
    - scripts/runnable-ref/fixtures/modifier-family.uat.spec.ts
    - scripts/runnable-ref/fixtures/modifier-group-clean.uat.spec.ts
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/playwright-test.d.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-17 (2026-09-08, gap-closure round 2, extending D-14 arm (c)): a modifier call is refused when its dotted path's HEAD segment is a banned head AND its TAIL segment is a banned modifier segment, or when the whole path is a banned exact path. The routing segments in between do not change what the tail does to the evidence, so a new one needs no new member. BANNED_CONSTRUCTS is deleted; isBannedModifierPath is the only function that answers membership."
  - "WR-12: the inverting modifier test.fail joins the banned tail set. It runs the scenario and reports a failed assertion as a pass, which is worse for the evidence than removal, so it is decided rather than left silently undecided."
  - "The finding sentence is one sentence true of the WHOLE banned family. The shipped wording said the call removes the scenario, which is false of the inverting modifier; branching would have created a second emission point, so the sentence names both harms instead."
  - "The mutation-fixture corpus is DERIVED from disk by whether a fixture carries a mutation region, replacing a hand-typed list of four filenames."
  - "Completeness against the real Playwright surface stays a ONE-DIRECTIONAL claim, stated in the recipe, in the source and here, until plan 31-12 lands the reverse partition."

patterns-established:
  - "One authority per question, asserted over the artifact's own parsed source: the arm-(c) if-condition is asserted to BE the single call to the authority, and the rule's constants are asserted to be read nowhere else."
  - "Deleting the weaker duplicate rather than keeping it beside the rule: no enumerable ban list survives, and a runtime scan over the module's exports asserts none was reintroduced."

requirements-completed: [UATX-02, UATX-06]

coverage:
  - id: D1
    description: "Membership for D-14 arm (c) is decided by a head-and-tail rule over the resolved dotted path, with exactly one authority and no surviving enumerable ban list"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the arm-(c) call site is exactly one call to the membership authority"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the three rule constants are read ONLY inside the membership authority"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#no exported constant is an enumerable list of banned dotted paths"
        status: pass
    human_judgment: false
  - id: D2
    description: "The two spellings the round-2 verifier reproduced at exit 0 are refused by the committed .js at exit 1, one finding each"
    requirement: "UATX-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the spec 31-VERIFICATION.md round 2 ran exits 1 with one finding per planted spelling"
        status: pass
      - kind: e2e
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/cr06-probe"
        status: pass
    human_judgment: false
  - id: D3
    description: "The inverting modifier test.fail is decided rather than silently undecided (WR-12), and the finding sentence is true of the whole banned family"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses test.fail — an inverted scenario is worse evidence than a removed one"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#exports the rule as a head set, a tail set and an exact-path set"
        status: pass
    human_judgment: false
  - id: D4
    description: "The refusal corpus is generated from the rule's own cross product with its size computed from the constants, and the converse is asserted by a false-positive control"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses every spelling in the rule's own cross product, one finding each"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses nothing when a routing segment carries no banned tail"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two new fixtures compile inside the fixtures typecheck target; the banned family yields one finding per construct and zero once mutated; the control yields zero and is asserted to still carry its shapes"
    requirement: "UATX-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the modifier-family fixture yields exactly two findings, one per routed spelling"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the clean-group fixture yields zero findings and really carries the shapes it claims"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D6
    description: "The recipe states the rule and quotes the three constants by value, asserted equal to the exports in both directions, and names the one-directional boundary and the plan that closes it"
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's three quoted lists equal the exported constants, in both directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe states the one-directional boundary and names the plan that closes it"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-17 recorded as a dated gap-closure decision in 31-CONTEXT.md by insertion only, citing D-14 as the decision it extends, with no existing decision renumbered or removed"
    requirement: "UATX-06"
    verification:
      - kind: other
        ref: "git diff --numstat b306e19^..b306e19 -- .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md → 49 insertions, 0 deletions"
        status: pass
    human_judgment: true
    rationale: "The insertions-only property and the presence of D-14/D-16/D-17 are mechanically checked, but whether the three recorded copies (context file, source comment, this summary) actually AGREE in substance is a reading a human must make; no test compares their prose."
  - id: D8
    description: "The rule's completeness against the real Playwright modifier surface is a one-directional claim, and the boundary is written into the recipe, the source and the declared surface's header rather than implied"
    verification: []
    human_judgment: true
    rationale: "The disclosure's ADEQUACY — whether a reader of any of the three files would understand what is and is not proven — is a judgment. The reverse partition that would make it a measured claim is plan 31-12's scope, not this plan's."

duration: 103 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 11: Modifier membership by rule, not by list Summary

**`BANNED_CONSTRUCTS` deleted and replaced by a head-and-tail rule over the resolved dotted path with a single authority, closing CR-06: `test.describe.serial.only` and `test.describe.parallel.only` now exit 1 where the committed `.js` reported `0 findings over 1/1 uat specs checked` at exit 0.**

## Performance

- **Duration:** 103 min
- **Started:** 2026-09-08T12:30:00Z
- **Completed:** 2026-09-08T14:13:29Z
- **Tasks:** 3
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- **The membership question became a rule.** `isBannedModifierPath(dottedPath)` refuses a path whose head segment is in `BANNED_MODIFIER_HEADS` and whose tail segment is in `BANNED_MODIFIER_TAILS`, or whose whole path is in `BANNED_EXACT_PATHS`. Every routing segment in between — `describe`, `serial`, `parallel`, or whatever Playwright adds next — needs no new member.
- **The two spellings the round-2 verifier planted are refused**, reproduced against the committed `.js` on the verifier's own probe shape, before and after (transcripts below).
- **One authority, asserted over the artifact's own parsed source.** The arm-(c) `if` condition IS the single call to the authority — no `&&`, no null comparison, no membership test of its own — and the three rule constants are asserted to be read nowhere else in the module. A runtime scan over the module's exports asserts no enumerable list of banned dotted paths survives.
- **The inverting modifier is decided (WR-12).** `test.fail` joins the tail set, and the finding sentence was corrected: it claimed the call "removes the scenario", which is false of `test.fail`.
- **The corpus is generated, and the converse is asserted.** 33 spellings from the head × routing-chain × tail cross product plus the exact paths are each refused with exactly one finding, with the corpus size computed from the constants; a false-positive control proves routing segments without a banned tail, a `configure` call, a plain `test(...)` and an assertion chain are refused nothing.
- **The claim and the mechanism have one source.** The recipe states the rule and quotes the three constants by value, one labelled line each, anchored on the constant's own name and asserted equal to the exports in both directions — watched failing.

## Task Commits

1. **Task 1 — RED: reproduce the two spellings at exit 0** — `97f3fc6` (test)
2. **Task 1 — GREEN: decide membership by rule** — `6c42bac` (feat)
3. **Task 2 — type-checked fixtures and the declared-surface extension** — `3233f4c` (test)
4. **Task 3 — the recipe, the re-anchored equality, and D-17** — `b306e19` (docs)
5. **Deviation fix — the tree-wide module pin 67 → 69** — `9f092b5` (fix)

No REFACTOR commit: the GREEN implementation needed no cleanup, and the reference's rule is to commit only on change.

## The measurement CR-06 asked for

Probe repository at `.temp/cr06-probe`, in the shape the round-2 verifier used: a resolvable `typescript` and a spec under a `uat/` segment.

**Before (committed `.js` at `4059314`):**

```
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

**After (committed `.js` at HEAD):**

```
UAT spec integrity: 2 finding(s) over 1/1 uat specs checked
e2e/uat/probe.uat.spec.ts:3: banned modifier call — `test.describe.serial.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
e2e/uat/probe.uat.spec.ts:10: banned modifier call — `test.describe.parallel.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
```

**The control, `test.describe.only` alone — one finding and exit 1 BOTH before and after**, which is what shows the change is in membership and not in shape resolution:

```
# before (4059314)
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/probe.uat.spec.ts:3: banned modifier call — `test.describe.only` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
EXIT=1

# after (HEAD)
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/probe.uat.spec.ts:3: banned modifier call — `test.describe.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
```

**WR-12, `test.fail` alone:** `0 findings … EXIT=0` before, `1 finding(s) … EXIT=1` after.

**The false-positive control** (`test.describe.serial(...)` and `test.describe.parallel(...)` without a banned tail): `0 findings over 1/1 uat specs checked`, `EXIT=0`, after.

**Assumption A1, measured rather than inferred.** Before changing anything, `calleeDottedPath` was called directly against a parsed source carrying all seven spellings. It returned `test.describe.serial.only`, `test.describe.parallel.only`, `test.fail`, `test.describe.serial`, `test.describe.parallel`, `test.describe.configure`, `test` — exactly the paths the rule reasons about. The gap was in membership alone, as CR-06 said.

**Assumption A3, re-measured rather than inherited.** `grep` across tracked non-audit sources found consumers of the deleted constant only in the runnable, its test and the recipe's prose. No consumer outside `scripts/runnable-ref/` imported it.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` — `BANNED_CONSTRUCTS` deleted; the three rule constants and `isBannedModifierPath` added; the arm-(c) call site reduced to one call; the finding sentence corrected; the header sentence naming "the ONE set the recipe quotes" rewritten to name the authority.
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — 11 new cases for the rule, the corpus, the converse and the two one-authority source assertions; every consumer of the deleted constant re-pointed; the surface partition's input derived from the rule; the recipe equality re-anchored on the three constants; the mutation-fixture corpus derived from disk.
- `scripts/runnable-ref/fixtures/modifier-family.uat.spec.ts` — the two planted spellings in one marked mutation region over a structurally identical unnarrowed twin.
- `scripts/runnable-ref/fixtures/modifier-group-clean.uat.spec.ts` — the false-positive control; no mutation region, because nothing in it is refused.
- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — `serial`, `parallel`, `configure` on `Describe`, `fail` on `Test`; header rewritten to state the coverage-adjacent use, name 31-12, and keep the `UNKNOWN - verify` drift disclosure.
- `scripts/check-foundation-guards.test.ts` — `NON_TEST_MODULE_COUNT` 67 → 69 with a ledger entry naming both new corpus files and their reason.
- `agent-factory/checklists/browser-uat-recipe.md` — the ban-set region rewritten to state the rule and quote the three constants by value; the one-directional boundary added to the "deliberately outside" list.
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-17, by insertion only.

## Decisions Made

See `key-decisions` in the frontmatter. D-17 is recorded in three places that must agree: `31-CONTEXT.md` under `### Loud skip and AST ban`, the comment beside the rule in `scripts/runnable-ref/uat-spec-integrity.ts`, and this summary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The finding sentence misstated the harm for the inverting modifier**
- **Found during:** Task 1 (Movement 3, reading the `test.fail` probe output)
- **Issue:** The shipped sentence read "`test.fail` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised." Both clauses are false of `test.fail`: the scenario IS exercised, and the lane is green because the acceptance criterion failed. Banning a construct under a sentence that misstates what it does is the claim-broader-than-the-mechanism defect this file exists to avoid.
- **Fix:** One sentence true of the whole banned family — "decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed." Branching would have created a second emission point and a second place reasoning about the tail set, so the sentence names both harms instead.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts` / `.js`
- **Verification:** All four probe transcripts above; 74/74 in the checker's suite. No test asserted the old wording (checked by grep before changing it).
- **Committed in:** `6c42bac`

**2. [Rule 3 - Blocking] `test.fail` had to be declared on the Playwright surface in Task 1, not Task 2**
- **Found during:** Task 1 (re-pointing the ban-set/surface partition at the rule)
- **Issue:** The plan assigns the declared-surface extension to Task 2, but Task 1's own acceptance criterion requires the checker's test file to exit 0, and the re-pointed partition compiles every rule-decided spelling whose head the surface exports. `test.fail` is one of them, and the stub declared no `fail`.
- **Fix:** The `fail` member landed in Task 1's GREEN commit with its own comment; `serial`, `parallel`, `configure` and the header rewrite stayed in Task 2 as planned.
- **Files modified:** `scripts/runnable-ref/fixtures/playwright-test.d.ts`
- **Verification:** `npm run typecheck` exits 0 at both commits.
- **Committed in:** `6c42bac` (the `fail` member), `3233f4c` (the rest)

**3. [Rule 3 - Blocking] The tree-wide module pin had to move from 67 to 69**
- **Found during:** Post-Task-3 full-suite run
- **Issue:** `scripts/check-foundation-guards.test.ts` pins `NON_TEST_MODULE_COUNT` two-sided against `git ls-files '*.ts'`, deliberately counting the fixture corpus. Task 2's two fixtures moved the derived count to 69 and turned six LANG-07 cases red. This was found by the full suite, not by the checker's own test file — running only the plan's named test file would have shipped it.
- **Fix:** Pin moved to 69 with a `67 -> 69` ledger entry naming both files, their standing, and the fact that neither declares a frontmatter parser nor locates a section, in the voice the six previous entries use.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 286/286 in that file; 62 files / 3353 passed / 2 skipped tree-wide.
- **Committed in:** `9f092b5`

**4. [Rule 1 - Bug] Two bare-demonstrative sentences in the rewritten recipe region**
- **Found during:** Task 3 (`npm run check:imperative-lexicon`)
- **Issue:** `guard_sentence_form` WP-06 flagged two sentences opening "That is …" with no antecedent inside them.
- **Fix:** Both rewritten to name their antecedent ("Matching the head-and-tail pair rather than the whole literal path is what makes this a rule…", "An inverted scenario is worse for the evidence than a removed one…"). The scan set was not narrowed.
- **Files modified:** `agent-factory/checklists/browser-uat-recipe.md`
- **Verification:** `ALL CHECKS PASSED`.
- **Committed in:** `b306e19`

**5. [Rule 2 - Missing Critical] The mutation-fixture list was a hand-typed set literal**
- **Found during:** Task 2 (adding the new fixture to the mutation harness)
- **Issue:** The mutation loop iterated four filenames typed out in the test. A fixture added later carries a mutation region no case ever runs — this repository's recorded set-literal drift, in the very harness that proves each finding is caused by the construct it names.
- **Fix:** The corpus is derived from disk by the one question that decides membership (does the fixture carry a `MUTATE-REMOVE-START` region?), with a vacuity floor and an asserted partition against the fixtures on disk. Measured before and after: the derived set is exactly the four previous members plus the new one.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** the derived loop runs 5 mutation cases; all pass.
- **Committed in:** `3233f4c`

**6. [Rule 3 - Blocking] The plan's validator verify command cannot run as written**
- **Found during:** Task 3 verification
- **Issue:** `node scripts/validate-agent-factory.js` exits 1 with `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. This is the script's own invocation contract and is unrelated to this plan's changes.
- **Fix:** Run as `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.js`, which exits 0 with `ALL CHECKS PASSED`. No source change.
- **Files modified:** none
- **Verification:** exit 0.
- **Committed in:** n/a

---

**Total deviations:** 6 (2 missing-critical, 3 blocking, 1 bug). **Impact:** all six were necessary for correctness or to run the plan's own verification. Deviations 1 and 5 are the two that widen this plan slightly beyond its written scope, and both are corrections of exactly the defect classes this phase is closing — a claim broader than the mechanism, and a hand-maintained set. No scope creep beyond that.

## Process deviations, recorded rather than left implicit

**Committing on `main`.** The executor protocol refuses commits on a protected branch absent `git.allow_default_branch_commits`. This project sets `git.branching_strategy: "none"`, worktrees are disabled, the orchestrator explicitly dispatched this plan as a sequential executor on `main`, and every prior plan of this phase is committed there. The five commits above are on `main`. The configuration flag was NOT set — changing project configuration is not this plan's business.

**RED evidence and the classifier's own premise.** `gsd_run check tdd-red-evidence` returned `INVALID_RED (zero_tests_discovered)` for the real RED run. That verdict is about the TRANSCRIPT FORMAT, not the RED phase, and the harness's premise was asserted rather than assumed: fed a synthetic FLAT node:test-shaped TAP transcript carrying `# tests / # pass / # fail`, the same classifier returns `RED_EVIDENCE_OK`. Vitest emits NESTED TAP with no such summary block, so the parser reads zero tests. The transcript was **not** reformatted to make the gate parse it — laundering a harness's input is how a false verification premise gets recorded as a pass. `workflow.tdd_mode` is `false` in this project's config, so the gate is advisory here. The RED evidence itself is direct: at `97f3fc6`, 11 target cases failed on assertions for the planned behaviour and 58 pre-existing cases still passed, so the failure was the membership gap and not a load, parse or discovery error.

## TDD Gate Compliance

| Gate | Commit | Status |
|---|---|---|
| RED | `97f3fc6` `test(31-11): add failing cases for the modifier-family membership rule` | Pass — 11 target cases failed, 58 passed |
| GREEN | `6c42bac` `feat(31-11): decide banned modifier calls by rule…` | Pass — 69/69 |
| REFACTOR | none | Not needed; no cleanup was made, so no commit |

The RED commit precedes the GREEN commit. Task 2's fixture commit is also `test(...)`-scoped and lands after both.

## Tracer feedback gate (Task 1, `type="tracer"`)

Evaluated in the documented precedence order. The task carries no `gate="blocking-human"`; auto mode is inactive (`workflow.auto_advance` and `workflow._auto_chain_active` both `false`); `workflow.human_verify_mode` is `end-of-phase`; and Task 1's `<verify>` carries only `<automated>` blocks with no `<human-check>`. That is the interactive / `end-of-phase` / automated-only row, so the gate re-ran the tracer's three verify commands rather than synthesizing a checkpoint. All three passed, so expansion continued. No checkpoint was suppressed by judgment — the row was selected by reading the three inputs.

## Issues Encountered

**The probe repository lives inside the repository the checker walks.** The plan specifies `.temp/cr06-probe/` and `.temp/` is gitignored, but `SKIPPED_DIRECTORIES` is `node_modules`, `.git`, `dist`, `tools` — not `.temp`. A resident probe is therefore derived as one of grugops's OWN uat specs, which turns the existing case `derives zero specs from grugops's own repository root (the fixtures are not a corpus here)` red. Reproduced twice and diagnosed rather than worked around. The probes are throwaway by the plan's own description, so they were built, measured, and removed; the suite is green with them absent. **Anyone re-running this plan's `<verification>` block must run the probe command and the suite in that order, and delete `.temp/cr06-*` in between.** Widening `SKIPPED_DIRECTORIES` was NOT done: that set is D-05's decided input boundary and changing it is a new decision, not an execution fix.

## Known Stubs

None. Nothing in this plan is placeholder, hardcoded-empty or awaiting a data source.

## Boundary this plan does NOT close (the red-team obligation, stated rather than left to be discovered)

Ask which set the new predicate enumerates. It enumerates a **head set** and a **tail set**, and both are hand-authored — that is the axis on which this defect class can reappear for a third time. What is proven here is one-directional: every spelling the rule refuses is a construct the declared surface carries. What is NOT proven here is the converse — that every real modifier on that surface is refused. Plan `31-12` lands the reverse partition, with a vacuity floor over the walk depth, precisely because the family CR-06 was about lives at the deepest level.

Two further bounds, disclosed at the strength they are used:

- The **declared surface is not the package.** `playwright-test.d.ts` is a hand transcription and its drift from a released Playwright is an open `UNKNOWN - verify` (`R-07`). This plan made it load-bearing for a coverage-adjacent claim, which raises the cost of that drift; its header now says so.
- `UNRESOLVABLE_CALLEE_RESIDUALS` is unchanged. An aliased binding and a computed member are still not refused, still disclosed, and still pinned by assertions.

## Verification results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | 62 files, **3353 passed / 2 skipped (3355)** — above the 62 / 3318 floor |
| `npm run build` | exit 0 |
| `npm run typecheck` (three targets) | exit 0 |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` |
| `npm run check:banned-claims` | `ALL CHECKS PASSED` |
| `npm run check:public-docs` | `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |
| `node scripts/runnable-ref/uat-spec-integrity.js .temp/cr06-probe` | 2 findings, exit 1 |
| `node scripts/runnable-ref/uat-spec-integrity.js .temp/cr06-clean` | 0 findings, exit 0 |
| `git diff --numstat b306e19^..b306e19 -- 31-CONTEXT.md` | `49 0` — insertions only |

`npm run check:diff-disposition` still reports its 75 pre-existing findings, all in `agent-factory/workflows/{05-pr-quality-gate,06-uat-pack,17-task-claim,18-context-compaction}.md` and owned by plans 31-05/06/08 (recorded by 31-09 in `deferred-items.md`). **This plan owes no disposition row, and that is a measured boundary rather than an assumption:** the gate's watched corpus is the 40-file LANG-03 safety-surface union (17 roles + 19 workflows + 4 residue), and `agent-factory/checklists/browser-uat-recipe.md` is a checklist and not a member. No `docs/audit/29-style-dispositions/31-11.md` was created.

## The discriminations, watched failing

- **The recipe equality.** Dropping `fail` from the recipe's quoted tail list turned `the recipe's three quoted lists equal the exported constants, in both directions` red and left the other 73 green. Restored immediately.
- **The membership rule.** The 11 RED cases at `97f3fc6` failed against the pre-fix committed `.js` and pass at `6c42bac`, with the control passing at both.
- **The mutation contract.** Deleting `modifier-family.uat.spec.ts`'s marked region drops its count from 2 to 0, so neither finding came from the scenario, the selectors or the assertions.

## Self-Check: PASSED

- `scripts/runnable-ref/fixtures/modifier-family.uat.spec.ts` — FOUND
- `scripts/runnable-ref/fixtures/modifier-group-clean.uat.spec.ts` — FOUND
- Commits `97f3fc6`, `6c42bac`, `3233f4c`, `b306e19`, `9f092b5` — all present in `git log`
- `git rev-list --count 4059314..HEAD` = **5**, equal to the `commits:` recorded in the frontmatter

## Next Phase Readiness

- **Ready for `31-12`.** Its dependency is satisfied: `BANNED_MODIFIER_HEADS`, `BANNED_MODIFIER_TAILS`, `BANNED_EXACT_PATHS` and `isBannedModifierPath` are exported and are the axes its reverse partition bounds; the declared surface now carries `serial`, `parallel`, `configure` and `fail`, so the reverse check has something to find; and the recipe already names 31-12 as the plan that closes the one-directional boundary.
- **`UATX-06` is not closed by this plan alone.** The membership defect CR-06 named is closed and re-reproducible, but the requirement's own claim ("the recipe's claim matches exactly what the checker decides") rests on a coverage direction 31-12 supplies. The requirement should not read verified until both plans have landed and a verification round has re-reproduced them.
- **`UATX-01` / CR-05 is a sibling and is untouched here.** It is plan `31-10`'s scope.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*
