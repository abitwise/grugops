---
phase: 31-autonomous-manual-testing
plan: 12
subsystem: testing
tags: [typescript, typechecker, playwright, uat, quality-gate, spec-integrity, coverage-partition]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-11's isBannedModifierPath head-and-tail rule and its three exported constants; 31-06's calleeDottedPath normaliser, the declared @playwright/test surface and the one-directional ban-set cross-check; 31-03's browser-uat-recipe ban-set region"
provides:
  - "deriveDeclaredModifierPaths — the declared modifier surface ENUMERATED by the TypeScript checker from the declared types, rooted at each exported value binding, so the denominator of the coverage claim is read rather than written"
  - "SURFACE_WALK_MAX_DEPTH = 4 with its reason, plus the assertion that the walk REACHED it — a shortness floor a vacuity floor cannot give"
  - "partitionDeclaredSurface — a TOTAL partition of the derived set into refused-by-rule and dispositioned-with-a-reason, asked of the runnable's own membership authority and never of a copy"
  - "DISPOSITIONED_SURFACE_MEMBERS — ten members with per-member reasons written as statements about evidence, asserted non-empty individually and asserted to hold no member the surface lacks"
  - "the cardinality assertion: buckets disjoint, union equal to the derived set, sizes summing to its count — three SEPARATE expectations so a disjointness failure and a cardinality failure read differently"
  - "two watched failures: a fabricated run-narrowing member turns the partition red and is named; a routing group nobody enumerated is refused by the rule with no edit to any set"
  - "test.slow declared on the surface — the one member of Playwright's own modifiers group the rule does NOT refuse, so the reverse question could have gone the other way"
  - "the recipe and the declared surface's header restated at the strength the claim now has: both directions over the DECLARED surface, neither direction over the released package"
affects: [uat-spec-integrity, browser-uat-recipe, spec-integrity-gate, 31-VERIFICATION]

actuals:
  tokens: 9474
  tasks: 3
  commits: 5
  plan_head_before: 9aaa9a4986f8a629e467f6aa794b1f5dda8b2076

tech-stack:
  added: []
  patterns:
    - "the DENOMINATOR of a coverage claim is derived by reading the artifact's own declared types with the compiler, never typed out, because enumeration is the axis the defect class reappears on"
    - "a coverage claim is a PARTITION with an asserted cardinality, not a membership spot-check: a member decided by neither bucket turns the suite red and names itself"
    - "the premise block asserts SHORTNESS as well as emptiness — the walk asserts it reached its own declared bound, because a vacuity floor catches an empty denominator and never a silently short one"
    - "a disposition is a statement about evidence carrying a per-member reason, so a member whose reason cannot be written is a red suite rather than a padded record"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/playwright-test.d.ts
    - agent-factory/checklists/browser-uat-recipe.md

key-decisions:
  - "D-18 (2026-09-08, gap-closure round 2, closing WR-13): the ban decision's completeness is asserted as a TOTAL PARTITION over a checker-derived enumeration of the declared surface, in both directions. The forward direction (every banned spelling is real) keeps its own cases; the reverse direction (every declared member is decided) is added beside it, because the two answer different questions and collapsing them would lose the one that had been failing."
  - "The reverse direction's denominator is DERIVED by walking the declared types with the TypeScript checker, rooted at each exported VALUE binding selected by having a value declaration rather than by name. A hand-typed member list would fail exactly when a member nobody remembered was added, which is the failure the check exists to catch."
  - "test.slow is declared on the surface and deliberately NOT refused. Playwright files it in the same modifiers group as skip/only/fixme/fail, but it triples a scenario's time budget: the scenario still runs and every assertion in it is still read. Without a member of this shape the reverse partition would never have to decide a member that is a modifier by the framework's own taxonomy, and the question could not have gone the other way."
  - "The walk's depth bound is a named constant carrying its reason, and the walk asserts it REACHED that bound. An unstated truncation would silently drop test.describe.serial.only — the family CR-06 was about — and the partition would then report complete over a set that never contained the member it exists to find."
  - "The disposition record's entries are asserted to be derived paths. An entry for a member the surface does not carry would make the arithmetic close over a member nobody can reach, which is the denial-of-service on this partition (T-31-65)."

patterns-established:
  - "Assert the premise's SHORTNESS, not only its emptiness: derive the element count independently of the loop that consumes it, and assert the walk reached its own bound."
  - "Factor the failure message into a helper the real assertion and the discrimination case both call, so the mutation proves the REAL assertion names the offender rather than proving it about a second string."
  - "Watch the partition fail in BOTH senses: once on a member it must see (discrimination) and once on a member the rule must generalise to with no edit to any set (the property an enumeration could not have)."

requirements-completed: [UATX-02, UATX-06]

coverage:
  - id: D1
    description: "The reverse cross-check exists and is a TOTAL partition with an asserted cardinality: every derived member of the declared surface is refused by the rule or dispositioned with a reason, buckets disjoint, union equal to the derived set, sizes summing to its count"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the buckets are DISJOINT"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the buckets' UNION equals the derived set"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the buckets' SIZES sum to the derived count"
        status: pass
    human_judgment: false
  - id: D2
    description: "The surface enumeration is derived by the TypeScript checker rather than typed out, and the walk is proven neither empty nor silently short"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the walk's premises hold: no diagnostics, both roots, a non-empty set, and the bound reached"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the derived set contains every member the fixture corpus actually calls"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the derived count exceeds the count the rule refuses"
        status: pass
    human_judgment: false
  - id: D3
    description: "The partition DISCRIMINATES and the rule GENERALISES, both watched failing on mirrored surfaces with the mutation anchor asserted present once before and absent after"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#DISCRIMINATES: a fabricated run-narrowing member turns the partition red and is NAMED"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GENERALISES: a routing group nobody enumerated is refused with no edit to any set"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every dispositioned member carries a per-member reason of at least a sentence, and the record holds no member the declared surface lacks"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#every dispositioned member carries a reason, and the record holds no member the surface lacks"
        status: pass
    human_judgment: false
  - id: D5
    description: "The declared surface carries test.slow — a modifier Playwright documents that the rule does not refuse — so the reverse question could have gone the other way"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the declared surface carries a documented modifier the rule does NOT refuse"
        status: pass
      - kind: other
        ref: "npm run typecheck (tsc --noEmit && tsconfig.tests.json && tsconfig.fixtures.json)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A modifier spelling that appears in no fixture and in no test case is refused by the COMMITTED .js, reproduced outside vitest"
    requirement: "UATX-06"
    verification:
      - kind: e2e
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/cr06-reverse-probe → 4 finding(s) over 3/3 uat specs checked, EXIT=1"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses every spelling in the rule's own cross product, one finding each"
        status: pass
    human_judgment: false
  - id: D7
    description: "The recipe and the declared surface's header state the claim at exactly the strength it has: both directions over the declared surface, neither over the released package, with the residual named in the existing 'deliberately outside' list"
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe states the claim at the strength it has: both directions, declared surface only"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon && check:banned-claims && check:public-docs && check:claim-anchors → ALL CHECKS PASSED ×4"
        status: pass
    human_judgment: true
    rationale: "The mechanical assertions pin that the stale one-directional sentence is gone and that the named parts of the new claim are present. Whether a reader of the recipe, the .d.ts header and this summary would come away understanding what is and is not proven — a partition over a hand transcription, not coverage of Playwright — is a reading a human must make; no test compares those three prose statements for agreement in substance."
  - id: D8
    description: "The coverage claim's own converse and bounds, recorded rather than left to be rediscovered: the declared surface is not the package, the walk has a depth bound, the shape-resolver boundaries sit outside both buckets, and one disposition reason is weaker than the others"
    verification: []
    human_judgment: true
    rationale: "Residual disclosure is a judgment about completeness of disclosure, which cannot be asserted by the harness that produced the claim. R-45 in particular (test.describe.configure's retries option) is an argued disposition a red-team round could reasonably reverse, and that judgment belongs to a verifier, not to this plan."

duration: 26 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 12: The reverse partition over the declared modifier surface Summary

**The ban-set cross-check now runs in both directions: a checker-derived enumeration of the declared `@playwright/test` surface (24 paths, walked to a proven depth of 4) is partitioned totally into 14 refused-by-rule and 10 dispositioned-with-a-reason, with disjointness, union and cardinality asserted separately — closing WR-13, the one-directional harness that could never have answered the question CR-06 was.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-08T15:00:57Z
- **Completed:** 2026-09-08T15:27:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **The denominator is READ, not written.** `deriveDeclaredModifierPaths` walks the declared ambient module with the TypeScript checker, rooted at each exported binding selected by *having a value declaration* rather than by name. Enumeration is the axis 31-11's head and tail sets are hand-authored on, and it is the one axis this plan refused to hand-author a second time.
- **The premise block catches a SHORT walk, not only an empty one.** Four premises fail before any coverage claim is made: the program compiled with zero diagnostics, both root bindings were found, the derived set is non-empty, and **the walk reached its declared bound of 4 segments at least once**. A vacuity floor would have passed a walk that stopped at depth 3 — silently dropping `test.describe.serial.only`, the exact family CR-06 was about.
- **A second, independent view of the same surface.** Every member the fixture corpus actually calls — resolved by the runnable's own `calleeDottedPath`, parsed out of the fixtures rather than listed — is asserted present in the derived set. A walk that missed a branch is caught by something other than its own count.
- **The reverse check is a PARTITION, and its RED reproduced WR-13's finding verbatim.** With the disposition record empty, the union assertion named the ten undecided members: `expect, test, test.afterEach, test.beforeEach, test.describe, test.describe.configure, test.describe.parallel, test.describe.serial, test.slow, test.step`. That is the shape of the gap WR-13 predicted, measured rather than argued.
- **`test.slow` makes the question answerable in the other direction.** Playwright files `slow` in the same modifiers group as `skip`, `only`, `fixme` and `fail`. It is declared and deliberately **not** refused, because it triples a deadline: the scenario still runs and every assertion in it is still read. Without a member of this shape the non-refused bucket would hold only hooks, structure and configuration, and the reverse check would have been answering a question that could not have gone the other way.
- **Both discriminations watched failing.** A mirrored surface where `fixme` becomes `mute` puts `test.mute` outside both buckets and the **real** assertion's message names it (the message is a shared helper, not a second string). A mirrored surface where `parallel` becomes `shard` has its banned-tail members land in the refused bucket **with nothing added to any set** — asserted explicitly against all three rule constants and the disposition record.
- **The honest converse is asserted too.** In the `shard` mirror, `test.describe.shard` *itself* lands outside both buckets. The rule generalises over **tails**, not over new **members** — and the partition says so rather than absorbing it.

## Task Commits

1. **Task 1 — RED: derive the declared modifier surface** — `3438f94` (test)
2. **Task 1 — GREEN: declare `test.slow` and restate the header** — `3c11456` (feat)
3. **Task 2 — RED: partition with the disposition record empty** — `573944b` (test)
4. **Task 2 — GREEN: disposition the ten undecided members** — `7bec065` (feat)
5. **Task 3 — the recipe, the re-pointed pinning test** — `f161391` (docs)

No REFACTOR commit in either cycle: neither GREEN implementation needed cleanup (one interface member plus header prose; then a data record), and the reference's rule is to commit only on change.

## The measurement WR-13 asked for

Probe repository at `.temp/cr06-reverse-probe`, three specs, run against the **committed `.js`** outside vitest. Deleted after measurement — `.temp/` is not in `SKIPPED_DIRECTORIES`, so a spec-shaped file left there would red the suite's "derives zero specs from grugops's own repository root" case.

**All three specs together:**

```
UAT spec integrity: 4 finding(s) over 3/3 uat specs checked
e2e/uat/planted.uat.spec.ts:3: banned modifier call — `test.describe.serial.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
e2e/uat/planted.uat.spec.ts:10: banned modifier call — `test.describe.parallel.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
e2e/uat/unenumerated.uat.spec.ts:3: banned modifier call — `test.describe.shard.fixme` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
e2e/uat/unenumerated.uat.spec.ts:10: banned modifier call — `test.describe.lane.serial.skip` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
```

**Spec 1 — the two spellings the round-2 verifier planted, isolated:**

```
UAT spec integrity: 2 finding(s) over 1/1 uat specs checked
e2e/uat/planted.uat.spec.ts:3: ... `test.describe.serial.only` ...
e2e/uat/planted.uat.spec.ts:10: ... `test.describe.parallel.only` ...
EXIT=1
```

**Spec 2 — the point of this plan. `test.describe.shard.fixme` and `test.describe.lane.serial.skip` appear in NO fixture, in NO test case, and in NO set:**

```
UAT spec integrity: 2 finding(s) over 1/1 uat specs checked
e2e/uat/unenumerated.uat.spec.ts:3: ... `test.describe.shard.fixme` ...
e2e/uat/unenumerated.uat.spec.ts:10: ... `test.describe.lane.serial.skip` ...
EXIT=1
```

A spelling nobody wrote a test for is refused, and the second one carries a **two-segment** routing chain (`lane.serial`) that no fixture and no cross product in the suite exercises. That is the property an enumeration could not have had.

**Spec 3 — the clean control, carrying `test.describe.serial` (a routing group without a tail) and `test.slow` (the dispositioned modifier):**

```
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

### Beside the round-2 verifier's Row 5

| | Round-2 verification (`31-VERIFICATION.md` Row 5) | This plan |
|---|---|---|
| `test.describe.serial.only` + `test.describe.parallel.only` | `0 findings over 1/1 uat specs checked`, `EXIT=0` | `2 finding(s) over 1/1`, `EXIT=1` (closed by 31-11, re-reproduced here) |
| a routing group in no fixture and no test case | not tested | `2 finding(s) over 1/1`, `EXIT=1` — **new this plan** |
| a control with a routing group and no modifier tail | `1 finding, EXIT=1` for the bare `test.describe.only` control | `0 findings, EXIT=0` for the no-tail control — the converse, unchanged |

## The partition, in numbers

| Bucket | Count | Members |
|---|---|---|
| Derived from the declared surface | **24** | walked to depth 4, rooted at `test` and `expect` |
| Refused by `isBannedModifierPath` | **14** | `expect.soft`, `test.{skip,only,fixme,fail}`, `test.describe.{skip,only,fixme}`, `test.describe.{serial,parallel}.{skip,only,fixme}` |
| Dispositioned with a reason | **10** | `test`, `expect`, `test.describe`, `test.describe.serial`, `test.describe.parallel`, `test.describe.configure`, `test.beforeEach`, `test.afterEach`, `test.step`, `test.slow` |

`14 + 10 = 24`, asserted; buckets asserted disjoint; union asserted equal to the derived set. Ten dispositioned members, ten reasons, each asserted non-empty **per member** rather than for the record as a whole.

## Verification results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 files / 3418 passed / 2 skipped**, exit 0 (floor was 62 / 3407) |
| `npx vitest run … scripts/runnable-ref/uat-spec-integrity.test.ts` | 85 passed, exit 0 (was 79 before this plan) |
| `npm run typecheck` | exit 0, no diagnostic naming `playwright-test.d.ts` |
| `npm run build` | exit 0 |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` |
| `npm run check:banned-claims` | `ALL CHECKS PASSED` |
| `npm run check:public-docs` | `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |
| `node scripts/runnable-ref/uat-spec-integrity.js .temp/cr06-reverse-probe` | `4 finding(s) over 3/3`, exit 1 |

No `.js` artifact changed: this plan touched one test file, one `.d.ts` (which emits nothing) and one markdown checklist.

## TDD Gate Compliance

Both `tdd="true"` tasks completed a full RED → GREEN cycle, each RED verified by `gsd_run check tdd-red-evidence` before any production edit:

| Task | RED commit | Verdict | GREEN commit |
|---|---|---|---|
| 1 | `3438f94` `test(31-12)` | `RED_EVIDENCE_OK` — target test failed, 78 passed | `3c11456` `feat(31-12)` |
| 2 | `573944b` `test(31-12)` | `RED_EVIDENCE_OK` — target test failed, 82 passed | `7bec065` `feat(31-12)` |

**Recorded honestly: the RED evidence records required a transcription step.** `check tdd-red-evidence` parses `node --test` TAP summary lines (`# tests`, `# pass`, `# fail`), and vitest emits none. Two things were needed. First, `--reporter=tap` was rejected as `fixture_or_load_failure` because vitest's default TAP **nests and indents** the per-test lines while `tapFailedTestNames` anchors on `^not ok` — only the file-named outer line matched. `--reporter=tap-flat` produces unindented lines and classifies correctly. Second, the three summary lines were appended to vitest's own unmodified TAP body, transcribed from vitest's own reported counts. The `ok` / `not ok` lines are verbatim reporter output; only the summary triple was added, and it agrees with the run it describes. Recorded rather than left implicit, because a hand-added line in an evidence record is exactly the kind of thing a later round should be able to see.

## Tracer feedback gate (Task 1, `type="tracer"`)

Task 1 carried no `gate` attribute; `workflow._auto_chain_active` and `workflow.auto_advance` are both `false`; `workflow.human_verify_mode` is `end-of-phase`; the tracer's `<verify>` carries only `<automated>` blocks and no `<human-check>`. That is row 3 of the precedence chain: **re-run the verify, halt on failure, continue on success, no checkpoint.** Both commands were re-run after the GREEN commit — `npm run typecheck` exit 0 and the suite file exit 0 — and expansion proceeded.

## Decisions Made

- **D-18 — the reverse direction is added ALONGSIDE the forward one, not folded into it.** The two answer different questions ("is every banned spelling real?" versus "is every real modifier decided?"), and the one that had been failing is the second. Collapsing them would have lost it. Accepted debt: two harnesses now read the same declared surface file, so a change there must keep both green — which is why the `.d.ts` header now says so in those words.
- **The roots are selected by having a value declaration, not by name.** Writing `["test", "expect"]` would have re-introduced, in the walk itself, the hand-authored enumeration the walk exists to replace.
- **`test.slow` is declared and dispositioned rather than omitted or refused.** Omitting it would have left the non-refused bucket free of any member from Playwright's own modifiers group; refusing it would have been wrong, because a longer deadline neither removes a scenario nor inverts its result.
- **The disposition reasons are statements about evidence, never labels.** "A routing group changes the order or isolation of scenarios and does not remove or invert one" is a claim that can be argued with. "routing" is not.

## Deviations from Plan

None — plan executed as written. One in-task correction is worth naming because it was caught by the suite rather than by review: the recipe-pinning assertion was first written as `toContain("not the released package")` while the recipe's prose carries markdown emphasis (`is **not** the released package`). The full suite went red on it; the assertion was corrected to the literal the prose actually carries, within Task 3 and before its commit.

## Issues Encountered

- **`node scripts/validate-agent-factory.js` exits 1 when invoked bare.** It refuses to default its kit root (`VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`). This is the guard behaving as designed, not a regression. CI invokes it as `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` (`.github/workflows/ci.yml:470`), which exits 0 with `ALL CHECKS PASSED`. The plan's acceptance criterion quoted the bare form; the CI form is the one that was run and recorded.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file-access pattern and no schema at a trust boundary. It installs nothing and adds no dependency; `@playwright/test` remains deliberately not installed and the declared surface remains a transcription (T-31-SC).

## The red-team obligation: what BOUNDS this claim

The plan required both directions to be named in this summary together with the residual neither covers. Stated plainly:

**What bounds the denominator.** Two things, and both are stated rather than assumed. *The declared surface*: the walk can only reach members `playwright-test.d.ts` declares, and that file is a hand transcription (`R-07`, `UNKNOWN - verify`) — the coverage established is coverage of the transcription. *The walk's depth*: `SURFACE_WALK_MAX_DEPTH = 4`, and the harness asserts the walk **reached** that bound, so a truncation is a failed premise rather than a quietly shorter set. A modifier family declared deeper than four segments would be outside the measurement.

**The converse of this plan's own claim.** A member the checker refuses that Playwright does not have would be a false refusal — the opposite error from the one this plan closes. That direction is covered by 31-11's forward cross-check (every banned spelling's head is exported and the call type-checks) and by its clean-group control, both still green, plus the no-tail control spec in this plan's probe (`EXIT=0`).

**What neither direction covers.** The package itself. Both directions are measured over the same transcription, so a modifier the released Playwright carries and the transcription does not is invisible to both. Naming that is the mitigation available here; installing the package is forbidden by CLAUDE.md's dev-dependency constraint.

**And one asymmetry worth stating.** The reverse partition proves every **declared member** is decided. It says nothing about whether a decided member can be **spelled** in a way the shape resolver cannot resolve — `const t = test; t.describe.serial.only(...)` is still unrefused even though `test.describe.serial.only` sits squarely in the refused bucket. That is `R-05`/`R-06` one register over, and it is recorded below rather than left as a silence.

## Residual register

Continuing this phase's numbering from `R-42` (31-10). Every row is open, deliberately open, or inherited.

| ID | Residual | Severity | Disposition |
|---|---|---|---|
| R-43 | **The declared surface is now the DENOMINATOR of a coverage claim, which raises the cost of its drift.** `playwright-test.d.ts` is a hand transcription and its drift from a released Playwright is an open `UNKNOWN - verify`. Before this plan the drift cost a fixture-compile mismatch; now it also silently narrows or widens a measured coverage claim. | medium | left open deliberately. `R-07` is the underlying item and is not closed. The mitigation is disclosure at three points — the `.d.ts` header, the recipe's "deliberately outside" list and this summary — plus the header's new instruction that a change there must keep both directions green. Installing `@playwright/test` to derive the surface mechanically is forbidden by CLAUDE.md's fixed dev-dependency set. |
| R-44 | **The walk is bounded at `SURFACE_WALK_MAX_DEPTH = 4`.** A modifier family declared at five or more segments would be outside the derived set and therefore outside the partition. | low | left open deliberately. The bound is a named constant carrying its reason and the walk **asserts it reached the bound**, so a truncation below the deepest declared family is a failed premise rather than a shorter set. Raising it is cheap; the bound was chosen as the depth of the deepest family the surface actually declares, not as a convenient number. |
| R-45 | **`test.describe.configure` carries the WEAKEST disposition reason in the record.** Its recorded reason is that it sets options and selects no subset of scenarios. That is true of `mode`, but `retries` genuinely changes how a **result** is read: a scenario that fails and then passes on a retry is not the same evidence as one that passed first time. | medium | left open deliberately, and named as the row a red-team round should attack first. It is dispositioned rather than refused because it selects no subset of scenarios, which is the property the rule is built around — but that argument is weaker than the other nine and a reversal to a refusal would be defensible. Recorded rather than quietly hardened, because widening the rule is a new decision and a gap-closure round. |
| R-46 | **The shape-resolver boundaries remain outside BOTH buckets.** The partition is over the declared TYPE surface; `UNRESOLVABLE_CALLEE_RESIDUALS` is a boundary of the CALLEE-SHAPE resolver. So `const t = test; t.describe.serial.only(...)` is unrefused although `test.describe.serial.only` is in the refused bucket, and no bucket in this partition is the right home for that fact. | medium | left open deliberately, inherited from `R-05`/`R-06`. Resolving an alias needs a type checker the runnable deliberately does not ship (D-13). Recorded here explicitly because the reverse partition's completeness claim could otherwise be misread as covering spellings as well as members — it does not. |
| R-47 | **`DISPOSITIONED_SURFACE_MEMBERS` is a hand-authored record**, which is this repository's recorded set-literal drift class one file over from where 31-11 met it. | low | left open deliberately, with the drift bounded in both directions rather than argued away. A **stale** key (a member the surface no longer carries) is caught by the assertion that every key is a derived path; a **missing** key (a member that arrived undecided) is caught by the union and cardinality assertions. The set cannot rot silently in either direction, which is the property the totality assertion buys. What it cannot catch is a reason that is *wrong* — see R-45 and R-48. |
| R-48 | **A disposition reason's PROSE is bounded only by per-member non-emptiness and a length floor.** A misleading or stale reason does not turn the file red. | info | accept. Same disposition as `R-40` one file over: naming it is the mitigation available to a test, and a semantic check over prose is not. The length floor forces a sentence rather than a label, which is as far as a mechanical check reaches. |
| R-49 | **The RED evidence records carry three hand-added TAP summary lines.** `check tdd-red-evidence` parses `node --test` summary lines that vitest does not emit; the `ok`/`not ok` bodies are verbatim `--reporter=tap-flat` output and only `# tests` / `# pass` / `# fail` were appended, transcribed from vitest's own reported counts. | info | accept, disclosed. The gate's parser and this project's test runner disagree on output format; the alternative was to skip the gate entirely. The transcription is recorded in the TDD Gate Compliance section above so a later round can see it rather than discover it. |

Seven rows, `R-43` through `R-49`.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.test.ts` — the reverse-direction harness: `deriveDeclaredModifierPaths`, `SURFACE_WALK_MAX_DEPTH`, `DISPOSITIONED_SURFACE_MEMBERS`, `partitionDeclaredSurface`, `undecidedMembers`/`undecidedMessage`, `mirrorSurface`, and eleven new cases; plus the re-pointed recipe-pinning case. 79 → 85 cases in this file.
- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — `test.slow` declared with the reason it is not refused; the header restated to say the file is now the denominator of a coverage assertion read in both directions, that a change here changes a measurement, and that the `R-07` drift disclosure governs more strongly than before.
- `agent-factory/checklists/browser-uat-recipe.md` — the ban-set region's pending-boundary sentence replaced by what the reverse partition establishes (both directions, total partition, disjoint, union, sizes summing) and what it does not (the declared surface is not the released package; the walk has a depth bound), with the residual placed in the region's existing "deliberately outside the rule" list.

## Self-Check: PASSED

- `agent-factory/checklists/browser-uat-recipe.md` — FOUND
- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — FOUND
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — FOUND
- Commits `3438f94`, `3c11456`, `573944b`, `7bec065`, `f161391` — all FOUND in `git log --oneline --all`
- Every task `<acceptance_criteria>` re-run and passing; every plan-level `<verification>` command re-run and recorded in the table above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **The third `missing:` item of gap 2 is closed.** `31-VERIFICATION.md` round 2 asked for "the reverse cross-check WR-13 names … asserted by partition cardinality rather than by one-directional membership". That is what landed, over a checker-derived enumeration rather than a typed-out list, with the partition watched failing twice.
- **`UATX-06` should not read verified until a verification round re-reproduces both plans.** 31-11 closed the membership defect and 31-12 closed the direction the shipped harness could not ask in. The requirement's own claim rests on both. Per this phase's ROADMAP entry, `UATX-01` and `UATX-06` stay `[ ]` / Gaps Found until a verification round flips them — this plan does not flip them.
- **`UATX-02` is unchanged in substance.** The recipe was already `✓ SATISFIED` in round 2; this plan corrects a sentence in it that had become stale the moment the mechanism it promised landed.
- **The row a next round should attack is `R-45`** (`test.describe.configure`'s `retries`), followed by `R-46` (a decided member spelled through an alias). Both are named here precisely so they do not have to be rediscovered.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*
