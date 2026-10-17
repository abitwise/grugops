---
phase: 32-board-projector-cli-dashboard
plan: 39
subsystem: api
tags: [board-projector, prototype-pollution, own-property-lookup, discriminated-union, naming, typescript-ast, gap-closure]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-38's presence-branch derivation, the `### The presence table` contract heading, and the spawned-CLI `--once --json` harnesses in scripts/board-dashboard.test.ts and scripts/board-tracer.test.ts"
provides:
  - "`admitted-under-this-id` — the presence discriminant renamed to state what its lookup measured, at a site set derived by a text-forcing tree-wide search, with the published document proved byte-identical to the committed golden"
  - "A suite case that DERIVES every `admitted-under-…` spelling in the tree and requires the set to equal the exported array's members in both directions, so a half-done rename reds naming file and line"
  - "`configView`'s limit map and `scrub`'s accumulator built without a prototype, so a dial column spelled like a prototype member reaches `column-missing` and a prototype-spelled key reaches a consumer's parse as an own property"
  - "A derived inventory of every object/Map/Set accumulator in the two projector modules, with a per-site verdict on whether it can receive a content-derived key"
  - "One own-property authority over the toolchain check-script register, with the read set derived by TypeScript parse, its size asserted, and the prefix premise the unreachability rests on turned into a failing assertion"
affects: [32-40, 32-41, board-projector verification round 4]

actuals:
  tokens: 21781   # chars/4 over the realized diff 7aea94f0..HEAD (87123 chars of changed lines)
  tasks: 3
  commits: 4      # MEASURED: git rev-list --count 7aea94f0..HEAD — 3 task commits + this docs commit
plan_head_before: 7aea94f0b2e2634a855a2625dd69ea9700f2d00b

tech-stack:
  added: []
  patterns:
    - "A rename is landed at a DERIVED site set: the suite walks the tree, collects every spelling of the renamed family, and requires that set to equal the exported array's members in both directions — the scan term itself derived from the array, so it moves with the next rename"
    - "A build-and-return accumulator that takes content-derived keys is built with `Object.create(null)`; the shape matches what the code means, instead of a key filter bolted onto a shape that does not"
    - "One accessor per register lookup, with the parse asserting that nothing else reads the register — three guarded copies of one rule is the same drift shape one register down"
    - "The premise an `unreachable` claim rests on is written as a failing assertion over the live set, never as a sentence in a docblock"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-39-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-39-GREEN-proof.txt
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-model.test.ts
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-read.test.ts
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-dashboard.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The presence arm is renamed `admitted-under-this-id`, not the review's `admitted` or `declared-by-a-document`. `admitted` is ambiguous against the sibling `admitted-under-another-id`, which is also an admitted record; `declared-by-a-document` states the right fact but drops the symmetry a reader uses to tell the pair apart. The lookup is `byId.get(id)`, whose subject is THIS identifier, so the chosen name states the lookup's subject and reads as the sibling's converse."
  - "`agent-factory/contracts/board.md` needed NO prose correction. Its presence table's first row already reads `A document declares it.` — the fact the lookup measures. The contract was read rather than assumed on the strength of a zero-hit search, and the code was moved to agree with the document rather than the reverse."
  - "The `.planning/` occurrences of the old spelling (13 files) are listed and NOT rewritten: an audit record states what was true when it was written, and this repository's standing rule is that such a record is annotated, never rewritten. The suite's derived-site walk excludes `.planning/` for that stated reason."
  - "The three raw reads of `TOOLCHAIN_CHECK_SCRIPTS` are routed through ONE accessor asking `Object.hasOwn`, not three guarded copies. The review's whole reason for filing IN-03 is that one copy of a rule was fixed and another was not; three spellings inside one file is that same shape one register down. The parse asserts exactly one read of the register exists."
  - "The accumulator set was DERIVED by TypeScript parse (15 candidates across the two modules) rather than taken from the review's two. Exactly two can receive a content-derived key by property assignment, and they are the two the review named — this time as a measurement, not a borrowed conclusion. Every Map and Set found is safe by construction."

patterns-established:
  - "Two-stage RED for chained defects: fix the upstream one alone and re-run, so the downstream one is observed in isolation instead of being inferred from the pair"
  - "One planted spelling per fixture tree when two plants would collapse onto one key — otherwise each case measures the other's plant"

requirements-completed: []  # DASH-03, DASH-06, DASH-07 and DASH-08 are DECLARED by this plan and deliberately NOT marked. The plan's own prohibition reserves that call for the round-4 verifier, and a premature flip already had to be reverted once in this phase.

coverage:
  - id: D1
    description: "The presence discriminant is renamed `admitted-under-this-id` at every site derived by a text-forcing tree-wide search, with the two-sided pin moved in the same commit and the old spelling at zero occurrences in source, compiled output, contract and kit markdown (DASH-03)"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#carries NO `admitted-under-…` spelling the exported array does not declare, at any DERIVED site"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#has the expected MEMBERS, in the order the derivation asks them"
        status: pass
      - kind: other
        ref: "RED: 5 target assertions failed against unchanged production code, 148 of 153 green (32-39-RED-baseline.txt §1.4); discrimination: a planted half-done rename reds naming scripts/board-model.js:950 (32-39-GREEN-proof.txt §1.3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The rename moved no published shape: the normalised `--once --json` document over scripts/fixtures/board-snapshot is byte-identical to the committed golden before and after, and `schemaVersion` is 2 both times (DASH-07, D-19)"
    requirement: DASH-07
    verification:
      - kind: other
        ref: "node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json -> sha256 5c33782368eab1622c3b41c493955a28059d7a9f1abe4edc2c9de803ef00f6a1 before and after, === expected-snapshot.json both times (32-39-GREEN-proof.txt §1.4)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — the committed golden freezes schemaVersion 2 byte for byte (D-19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A dial naming a wip limit for a column spelled like a prototype member reaches the `column-missing` conflict arm, and the sibling arm — the same spelling WITH a heading on the board — raises no conflict and takes part in the limit comparison (DASH-03, D-10, D-23)"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#raises `column-missing` for a prototype-spelled column with NO heading on the board"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#SIBLING ARM: raises NO `column-missing` when that heading IS on the board, and the limit is compared"
        status: pass
      - kind: other
        ref: "RED, measured live on a disposable tree: the pre-fix run published exactly ONE conflict (`In Review`, the control) and none for the prototype-spelled column (32-39-RED-baseline.txt §2.2); 3 of 4 new cases red against the pre-fix compiled twin (§2.4)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A snapshot key spelled like a prototype member survives the serializing chokepoint as an own property of the published document a consumer's parse recovers, with the value path and the sanitizing rule asserted beside it (DASH-07, D-18)"
    requirement: DASH-07
    verification:
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#a SPAWNED run's parsed document carries the prototype-spelled KEY as an own property"
        status: pass
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#SIBLING ARM — the VALUE path: a prototype-spelled string value survives unchanged"
        status: pass
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#SIBLING ARM — the sanitizer still runs: a key that BECOMES prototype-spelled lands too"
        status: pass
      - kind: other
        ref: "RED, isolated by fixing only the dial: the conflict appeared and the key was STILL absent from the published document (32-39-RED-baseline.txt §2.3); 2 of 4 new cases red against the pre-fix compiled twin (§2.4)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every read of the toolchain check-script register asks own-property membership through one authority, the read set is derived by TypeScript parse and its size asserted, and the prefix premise the unreachability rests on is a failing assertion (DASH-06, D-21)"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#IN-03: every read of the toolchain register is own-property guarded, at a DERIVED site set"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#IN-03: a bare prototype-member name is NOT registered, and a recorded one still is"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#IN-03: the premise the unreachability rests on is an ASSERTION, not a sentence"
        status: pass
      - kind: other
        ref: "RED: the parse named all three unguarded reads by line and `classifyCheckScriptTargets(\"__proto__\", …)` returned a toolchain row where it must return null (32-39-RED-baseline.txt §3.3); live answers diffed IDENTICAL before and after, 11 rows (32-39-GREEN-proof.txt §3.3)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The repository's gates are unmoved by this plan: build parity, freshness, the read-only dashboard guard, the control-byte gate, the foundation guards and the kit structure validator (DASH-08)"
    requirement: DASH-08
    verification:
      - kind: other
        ref: "npm run build && npm run typecheck && npm run check:build-parity -> exit 0; npm run freshness -> 65/65 fresh"
        status: pass
      - kind: other
        ref: "npm run check:dashboard-readonly -> 175 passed; npm run check:nul-bytes -> ALL CHECKS PASSED"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js -> ALL CHECKS PASSED; VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js -> ALL CHECKS PASSED"
        status: pass
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' -> 75 files, 5163 passed, 2 skipped (5151 + 12 new; the arithmetic closes)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Whether closing these three Info findings is enough to move 32-VERIFICATION.md's requirements, and whether this round created the next bypass as the per-round ratio in this phase's history would predict"
    verification: []
    human_judgment: true
    rationale: "This phase's recorded history is that four prior rounds each shipped a defect created by the previous round's fix, and the ratio has never fallen. A green suite is not proof of a safety invariant. Only an independent verifier reproducing against this tree can answer it, and this plan deliberately flips no requirement checkbox and no phase status. This is the LAST round the four-round cap allows."

duration: 37 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 39: Round-4 gap closure — the three Info findings the fix pass declined Summary

**The presence discriminant now states what its lookup measured and moved at a derived, counted site set with the published document proved byte-identical; two accumulators that silently ate a prototype-spelled key are prototype-free, with both defects measured live before the fix and each fix's sibling arm asserted; and the toolchain register's three raw reads are one own-property authority the parse pins at exactly one.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-09-16T18:32:36Z
- **Completed:** 2026-09-16T19:09:23Z
- **Tasks:** 3
- **Files modified:** 10 modified, 2 created

## Accomplishments

- **IN-01 closed, and the site set was measured rather than recalled.** `presenceOf` returned a kind spelled "under its stem" whenever `byId.has(id)` — a lookup that decides some admitted document declares THIS identifier and decides nothing about the name the directory gave it. The observable is on the tree: `ABC-901.md` declaring `id: ABC-902` reaches that arm for `ABC-902` carrying a record whose stem is `ABC-901`, which plan 32-38's own converse probe asserts as a PREMISE. Renamed to `admitted-under-this-id` at all 18 sites in one commit — a count derived with `grep -a` over every tracked file BEFORE any edit, which is how the plan's recalled 4/4/8 was found to be two sites short (5/4/9: a docblock line and the case 32-38 added).
- **The rename is now guarded by a DERIVED assertion rather than by care.** A new case walks the tree, collects every `admitted-under-…` spelling with its file and line, and requires the set to equal the exported array's `admitted-under-` members in BOTH directions, with the scan term itself derived from the array. A planted half-done rename reds naming `scripts/board-model.js:950`. Two `PREMISE:` vacuity floors guard the walk.
- **The published shape is proved unmoved, not asserted unmoved.** The `--once --json` document over `scripts/fixtures/board-snapshot`, normalised the way the golden case normalises it, is byte-identical before and after — sha256 `5c337823…` both times, equal to the committed golden's own bytes — with `schemaVersion` 2 both times and `git status --short scripts/fixtures/` silent.
- **IN-02 closed at both accumulators, each defect measured LIVE first.** A disposable tree whose dial names limits for `__proto__` and for `In Review`, with headings for neither, published exactly ONE conflict before the fix: `In Review`. The ordinary column is the control — the arm was reached and reporting, and the prototype-spelled one was resolved by disappearing, which D-10 forbids. The chokepoint defect was then ISOLATED by fixing only the dial and re-running: the conflict appeared and the key was still missing from the published document.
- **Both sibling arms asserted, which is where this phase keeps losing rounds.** A prototype-spelled column that IS a heading raises no `column-missing` and its limit takes part in the comparison (`wip-limit` 7/5). A prototype-spelled string VALUE survives unchanged — and stays green through the RED run, which is how that is known rather than assumed. A key that only BECOMES prototype-spelled after `sanitizeCell` removes a control code point still lands, planted in its own tree so the two plants cannot measure each other.
- **The accumulator set was derived, not taken from the review's two.** A TypeScript parse over both modules found 15 object/Map/Set accumulators; exactly two can receive a content-derived key by property assignment, and they are the two the review named. Every Map and Set is safe by construction. The inventory with per-site verdicts is in the GREEN proof.
- **IN-03 closed, and the two copies of the rule stop disagreeing.** The three raw reads of `TOOLCHAIN_CHECK_SCRIPTS` — derived by parse, confirming the plan's three at the exact lines it named — now go through one accessor asking `Object.hasOwn`, exactly the question `scripts/validate.test.ts` asks since `7a3ae592`. The suite asserts by parse that ONE read of the register exists, that its enclosing function performs the own-property test, and that the accessor's call-site count equals the three raw reads the baseline derived.
- **The defect was proved reachable at the lookup, and the premise is now an assertion.** Pre-change, `classifyCheckScriptTargets("__proto__", …)` returned a `toolchain` row where it must return `null` — the exemption granted by spelling. The converse is asserted too: a recorded member still classifies. And the sentence `32-REVIEW-FIX.md` wrote in prose (every looked-up name is prefixed, so the defect is unreachable on the live set) is a failing assertion over `package.json`'s real script names with a message naming what a violation would mean.
- **The live answers are identical, measured not argued.** The 11 classification/reachability rows were dumped before and after the change and diffed: no output. An own-property lookup that changed a live answer would have meant a live key was being answered from `Object.prototype` — a finding, not a pass.

## Task Commits

1. **Task 1: the presence discriminant names what its lookup measured** — `a3a5f89a` (refactor)
2. **Task 2: a prototype-spelled key reaches its conflict arm and the consumer** — `0503affe` (fix)
3. **Task 3: one prototype-lookup rule, asked the same way at every derived site** — `c5fc977a` (fix)

**Plan metadata:** this SUMMARY plus STATE.md and ROADMAP.md (docs: complete plan)

## Files Created/Modified

- `scripts/board-model.ts` (+ `.js`) — the discriminant renamed at 5 sites, and the `presenceActual` docblock corrected: it carried the old name's claim in prose ("a row whose file was admitted under the row's own identifier") and now states what the lookup measures, naming IN-01 and the failing case
- `scripts/board-model.test.ts` — the 9 renamed sites plus the derived-spelling-set case and its two PREMISE floors
- `scripts/board-read.ts` (+ `.js`) — `configView`'s limit map built with `Object.create(null)`, with the docblock stating why this is a correctness fix and not hardening
- `scripts/board-read.test.ts` — four cases: the parse premise, the `column-missing` arm, its present-heading sibling with the limit comparison, and the own-property assertion on the published limit map
- `scripts/board-dashboard.ts` (+ `.js`) — `scrub`'s accumulator built with `Object.create(null)`
- `scripts/board-dashboard.test.ts` — four cases on the SPAWNED `--once --json` document: the two-tree plant premise, the own-property key, the value-path sibling and the sanitizer sibling
- `scripts/check-foundation-guards.test.ts` — the `toolchainReason` accessor, the three reads routed through it, `import ts from "typescript"`, and three cases: the derived read set, the bare prototype-member case and the prefix premise
- `.planning/phases/32-board-projector-cli-dashboard/32-39-RED-baseline.txt` — the derived rename counts, the two live IN-02 measurements including the two-stage isolation, the parsed register read list and the live row set before
- `.planning/phases/32-board-projector-cli-dashboard/32-39-GREEN-proof.txt` — zero-remaining counts and the equal totals, the accumulator inventory, both golden comparisons, the live-answers diff and every gate result

## Decisions Made

See `key-decisions` in the frontmatter. The one the plan asks to be recorded here explicitly:

**Why `admitted-under-this-id` and not the review's two suggestions.** The review offered `admitted` and `declared-by-a-document`. `admitted` alone does not tell the pair apart — `admitted-under-another-id` is also an admitted record, so a reader meeting `admitted` beside it has to open the module to learn which admission is which. `declared-by-a-document` states the right fact but drops the symmetry, and the pair is how a reader uses these arms. The lookup is `populations.byId.get(id)`, whose subject is THIS identifier: some admitted document declares it. `admitted-under-this-id` states exactly that subject and reads as the converse of its sibling. The contract already described the arm that way ("A document declares it."), so the code moved to agree with the document rather than the other way round.

## Deviations from Plan

### Auto-fixed and stated-rather-than-silent choices

**1. [Rule 1 - Bug] The plan's recalled site counts were two short, and the derived ones were used**

- **Found during:** Task 1
- **Issue:** The plan's finding table recorded 4 / 4 / 8 occurrences of the old spelling in `scripts/board-model.ts` / `.js` / `.test.ts`. The derived measurement is 5 / 4 / 9 — `grep -c` counts LINES where `grep -o | wc -l` counts OCCURRENCES, and two sites (the `.ts` docblock at `:1356` and the converse-probe case 32-38 added at `:3118`) were not in the plan's table.
- **Fix:** The derived numbers were used and the discrepancy is written into `32-39-RED-baseline.txt §1.2` rather than quietly reconciled. This is the exact failure mode the plan's own instruction ("DERIVE THE SITE SET BEFORE EDITING ANYTHING") exists to prevent, and it caught it on the plan itself.
- **Verification:** the suite's derived-spelling case would have redded on either missed site
- **Committed in:** `a3a5f89a`

**2. [Structural, stated] One accessor rather than three spellings of `Object.hasOwn`**

- **Found during:** Task 3
- **Issue:** The plan says to ask own-property membership "exactly as `scripts/validate.test.ts` now does". Taken literally at each of the three sites, that puts three copies of one rule inside one file — the same shape whose two-file version is the entire reason IN-03 was filed.
- **Fix:** The question asked is exactly the sibling's (`Object.hasOwn(REGISTER, name)`, same call, same register shape); what is not copied is the multiplicity. The three reads go through one accessor and the suite asserts by parse that exactly one read of the register exists. A fourth read can be neither raw nor a fourth copy.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** the parse case reds on any read outside the accessor, naming file and line; RED transcript with all three unguarded reads named is in `32-39-RED-baseline.txt §3.3`
- **Committed in:** `c5fc977a`

**3. [Rule 3 - Blocking] `import ts from "typescript"` added to `scripts/check-foundation-guards.test.ts`**

- **Found during:** Task 3
- **Issue:** The derived read set has to distinguish a real read of the register from the file's own prose and test messages naming it, which a textual search cannot do. The file had no TypeScript import.
- **Fix:** Added the import, matching the established pattern in `scripts/validate.test.ts` and `scripts/board-read.test.ts`. `typescript` is an existing dev dependency and ships to no host.
- **Verification:** `npm run typecheck` exit 0; `node scripts/check-foundation-guards.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` both ALL CHECKS PASSED
- **Committed in:** `c5fc977a`

**4. [Stated, no change made] The contract needed no correction**

- **Found during:** Task 1
- **Issue:** The plan requires the contract's presence section be READ even though a tree-wide search measured zero literal occurrences of the old spelling, in case the prose described the arm by the fact the old name asserted.
- **Outcome:** It was read (`agent-factory/contracts/board.md:286-301`). The table's first row says "A document declares it." — the fact the lookup measures, stated correctly — and the prose above it is correct too. NO change was made. `agent-factory/contracts/board.md` is untouched by this plan, so 32-38's contract-agreement assertions are unaffected.

---

**Total deviations:** 4 (1 bug in the plan's own numbers, 1 structural, 1 blocking, 1 read-and-no-change)
**Impact on plan:** No scope creep. Every file changed is in the plan's `files_modified` except `agent-factory/contracts/board.md`, which the plan listed as "possibly changed" and which was correctly left alone.

## TDD Gate Compliance

| Gate | Commit | Status |
|---|---|---|
| RED | — (measured, transcripts in `32-39-RED-baseline.txt` §1.4, §2.4, §3.3) | Present as evidence, not as a commit |
| GREEN | `a3a5f89a` (`refactor`), `0503affe` (`fix`), `c5fc977a` (`fix`) | Present |
| REFACTOR | — | Not applicable |

**Why the commit types are `refactor`/`fix` and not `feat`, stated rather than glossed.** `workflow.tdd_mode` is `false` in this project's config, so the plan-level gate sequence is not enforced; the plan's own contract is a RED baseline artifact and a GREEN proof artifact, which is what was produced. Each task was committed atomically, as the dispatch requires, and each carries its RED evidence:

- **Task 1** is a genuine test-first RED: the expectations were renamed and run against unchanged production code — exit 1, 5 target assertions failing on the discriminant spelling, 148 of 153 green, the file collecting 153 cases. Then the source moved. It is committed `refactor` because the change adds no behaviour: the published document is proved byte-identical to the golden, which is the whole point of the task.
- **Task 2** is committed `fix`: two live defects measured on a disposable tree BEFORE any edit, then a two-stage isolation, then the new cases watched failing against the pre-fix compiled twins (3 of 4 dial cases, 2 of 4 chokepoint cases; the ones that stayed green are named and the reason each stayed green is stated).
- **Task 3** is committed `fix`: the three new cases were written and run BEFORE the lookup was touched — 2 failed, 7 unrelated cases in the selection green, 300 cases collected.

Every one of those is a TARGET assertion failing for the planned reason. None is a syntax error, a zero-test discovery, a fixture crash or an unrelated failure.

## Issues Encountered

- **The first version of the dashboard cases planted two spellings in one tree** (`__proto__` and `__pro<ESC>to__`), which collapse onto one key after sanitizing. Each case then measured the other's plant and the value assertion redded on `9` where it expected `7`. Resolved by giving each arm its own tree, with the escaped tree asserting as a PREMISE that it carries no `__proto__` key before sanitizing — so the sibling cannot pass without the sanitizer actually producing that spelling. The collapse itself is `scrub`'s own documented rule, not a defect.
- **A template literal in the new guards case terminated early** on an embedded `"` sequence, turning the whole file into a collection error (`Tests no tests`). Caught on the first RED run and fixed before the RED transcript was recorded — an INVALID_RED that was refused rather than written down as RED.
- **Two instrument values the plan carried are stale, restated rather than worked around:** `check:dashboard-readonly` is 175 passed, not 171 (the CR-01 fix `d276f4e3` added four cases after the round-3 measurement the plan inherited), and `node scripts/validate-agent-factory.js` exits 1 on any tree unless invoked as CI invokes it, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. Both were already recorded in `32-38-SUMMARY.md`. Neither was moved by this plan.
- **`npm run check:diff-disposition` still exits 1** with pre-existing findings in `agent-factory/roles/` and `agent-factory/workflows/` files this plan did not touch. Out of scope, unchanged, already carried in `deferred-items.md`.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts scripts/board-read.test.ts scripts/board-dashboard.test.ts scripts/board-tracer.test.ts scripts/check-foundation-guards.test.ts scripts/validate.test.ts` | exit 0, **908 passed** across 6 files |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, **75 files, 5163 passed, 2 skipped** (floor 5137; 5151 + 12 new, arithmetic closes) |
| `npm run build && npm run typecheck && npm run check:build-parity` | exit 0, "no tracked build output moved when tsc ran" |
| `npm run freshness` | exit 0, 65/65 committed `.js` fresh |
| `node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json` | exit 0, `schemaVersion=2`, normalised document === committed golden, sha256 `5c337823…` unchanged |
| `npm run check:dashboard-readonly` | exit 0, 175 passed, no `PREMISE` case among any failure |
| `npm run check:nul-bytes` | exit 0, ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | exit 0, ALL CHECKS PASSED, 0 FAIL lines |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0, ALL CHECKS PASSED, 0 FAIL lines |
| `npm test` | **NOT RUN** — the live claude-CLI e2e lane stays `UNKNOWN - verify` |
| `npm run check:diff-disposition` | exit 1, pre-existing findings in untouched files — unchanged by this plan |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans `32-40` and `32-41` remain in this phase's plan set (34 plans, 32 summaries after this one).
- **Requirement checkboxes and the ROADMAP phase status were deliberately NOT flipped.** The plan's prohibition reserves that for the round-4 verifier, and a premature flip already had to be reverted once in this phase.
- **The standing caution, restated because it has held for four rounds:** this phase's prior rounds each shipped a defect created by the previous round's fix, and the per-round ratio has never fallen. This plan's own work is a candidate for that pattern — the three surfaces a reviewer should probe first are (1) the derived-spelling tree walk, whose `.planning/` exclusion and extension allow-list are two degrees of freedom a later file could slip through, (2) the two prototype-free accumulators, where the question is whether any consumer downstream reads an INHERITED member from either object, and (3) the `toolchainReason` accessor's parse assertion, whose "nearest enclosing function" definition decides what counts as guarded.
- This is the LAST round the four-round gap-closure cap allows for Phase 32.

## Self-Check: PASSED

Files claimed created/modified — all found on disk:
```
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-39-RED-baseline.txt
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-39-GREEN-proof.txt
FOUND: scripts/board-model.ts
FOUND: scripts/board-model.js
FOUND: scripts/board-model.test.ts
FOUND: scripts/board-read.ts
FOUND: scripts/board-read.js
FOUND: scripts/board-read.test.ts
FOUND: scripts/board-dashboard.ts
FOUND: scripts/board-dashboard.js
FOUND: scripts/board-dashboard.test.ts
FOUND: scripts/check-foundation-guards.test.ts
```
Commits claimed — all found in `git log`: `a3a5f89a`, `0503affe`, `c5fc977a`.
Commit count MEASURED, not narrated: `git rev-list --count 7aea94f0..HEAD` = 3 at the time this
file was written, plus the single docs commit carrying this SUMMARY together with STATE.md and
ROADMAP.md = 4. The frontmatter carries 4 and `plan_head_before`, so a re-measurement with the
same instrument agrees with it.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*
