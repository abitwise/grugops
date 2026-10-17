---
phase: 31-autonomous-manual-testing
plan: 42
subsystem: uat-spec-integrity
status: complete
tags: [gap-closure, round-9, uat-spec-integrity, framework-surface-walk, ban-set-family, skipped-directory-disclosure, WR-37, WR-38, IN-19, D-42]

requires:
  - "31-34 (D-35): the four-way provenance split of the terminal `foreign` arm, and the reachability binding this plan widens"
  - "31-35 (D-36): SURFACE_TRUNCATION_REACHED, SURFACE_TRUNCATION_ARMS, SURFACE_TRUNCATED_CAUSE and the could-not-run route a stopped walk takes"
  - "31-32 (D-33 (5)): SKIPPED_DIRECTORIES, its hit count and the disclosure this plan partitions"
provides:
  - "deriveSurfaceSwallowSites(): the walk's swallow positions DERIVED from its own call closure, cardinality nine, both directions"
  - "SURFACE_TRUNCATION_REACHED gains `surface-unreadable` — five fail-open positions routed loud"
  - "SURFACE_SWALLOW_SITES: one published entry per derived position, each naming the arm it takes"
  - "frameworkSurface exported as a test seam, and a substitute checker that throws from one chosen position"
  - "deriveBanSetFamily(): the reachability binding's expected side derived from the module's own export family"
  - "eight reachability rows keyed to the constant that publishes each member, replacing three under hand-made prefixes"
  - "reach-modifier-tails.uat.spec.ts: the first corpus drive of `fixme` and `fail`"
  - "SKIPPED_DIRECTORY_DISCLOSURE_CLASS and its two derived halves; SKIPPED_DIRECTORY_COUNT_MEANING"
  - "D-42 in 31-CONTEXT.md"
affects:
  - "scripts/runnable-ref/uat-spec-integrity.ts's exported contract (one new arm, four new exports, one new seam)"
  - "the emitted skipped-directory disclosure: it no longer fires for node_modules or .git"
  - "scripts/check-foundation-guards.test.ts's NON_TEST_MODULE_COUNT (78 -> 79)"
  - "the corpus row floor (55 -> 77)"

tech-stack:
  added: []
  patterns:
    - "a completeness record is derived from the POSITIONS it describes, never from a record that merely looks derived"
    - "a kept fail-open is published with a NUMBER; an argument without a measurement is not a disposition"
    - "a binding's expected side is derived from the family the AUTHORITY consults, not from constants imported by name"
    - "a disclosure that fires every time discloses nothing — partition the watched set by the question the disclosure exists to answer"
    - "a row census read from `row(\"literal\")` call sites cannot see a computed id: a looped row drives its member and still reads as unrowed"

key-files:
  created:
    - scripts/runnable-ref/fixtures/reach-modifier-tails.uat.spec.ts
    - docs/audit/29-style-dispositions/31-42.md
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-42-task1-red.json
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-42-task2-red.json
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "D-42 (1): a completeness record is DERIVED from the positions it describes — the derivation finds NINE swallow positions where the review named four"
  - "D-42 (2): a kept fail-open is published with a number; measured ZERO throws at all nine positions over 26 genuine walks, so no fail-open is kept and the residual register is unchanged at ten"
  - "D-42 (3): the instrument a residual is defended by the absence of is the instrument that round owes — a substitute checker, through one exported seam"
  - "D-42 (4): the reachability binding's expected side is derived from the ban-set FAMILY the membership authority consults; four sets, eight members, eight rows"
  - "D-42 (5): the watched directory names are partitioned by whether a skip there could hide THIS repository's own evidence, both halves derived, union and disjointness asserted"
  - "D-42 (6): the disclosure STAYS on stderr, decided against the written contract, with the sharing and the exit-code discriminator stated in the recipe"
  - "D-42 (7): the counted thing is named in the emitted line — directory entries refused, never specs hidden"

requirements-completed: []

metrics:
  duration: "1h 35m"
  completed: 2026-09-13

actuals:
  tokens: 36000
  tasks: 3
  commits: 5

plan_head_before: 71a400953ab21ebe4494cb77d448b1fcc01ac5f7

coverage:
  - deliverable: "the walk's swallow positions derived from its own syntax tree, counted, and compared against the review's hand-typed four"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#PREMISE: the derivation finds sites at all, and finds MORE than the review's hand-typed four"
        status: pass
    human_judgment: false
  - deliverable: "every derived swallow position carries an arm or a published residual, asserted in both directions"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE CLOSURE: every derived site has an ARM or a REGISTER ENTRY, in BOTH directions"
        status: pass
    human_judgment: false
  - deliverable: "each derived swallow position driven by a substitute checker that throws at exactly that position"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `addDeclarations#1`: a declaration whose file cannot be read stops the walk LOUDLY"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `frameworkSurface#1`: an EXPORT whose type cannot be produced stops the walk LOUDLY"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `frameworkSurface#3`: a PROPERTY whose type cannot be produced stops the walk LOUDLY"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `frameworkSurface#4`: an EXPANSION that throws stops the walk LOUDLY"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `containerTypeArguments#1`: a container whose arguments THROW is the same event as one that cannot be asked"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SITE `isDefaultLibraryDeclaration#1`: an unreadable library probe still FAILS TOWARDS WALKING"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL: the fail-CLOSED pair still answers `expandable` when it cannot read the node"
        status: pass
    human_judgment: false
  - deliverable: "the published truncation arms bound to the recipe in both directions, with their count equal to the record's"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's quoted SURFACE_TRUNCATION_ARMS equals the exported record, in both directions"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#every published arm's SENTENCE is reachable through the one cause authority"
        status: pass
    human_judgment: false
  - deliverable: "a reachability row for every member of every published ban set, expected side derived from the export family"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE BINDING: every member of every PUBLISHED ban set carries a refusing row, both sides derived"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE CONVERSE: a REACH row naming a member no published set contains turns the census red"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE SEEDED FAIL: a published-but-unrowed member is caught on BOTH the head and the tail axis"
        status: pass
    human_judgment: false
  - deliverable: "one member of every published ban set driven through a declared-foreign binding and still refused"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE SHARED RESOLUTION: one member of EVERY set, driven through a DECLARED FOREIGN binding"
        status: pass
    human_judgment: false
  - deliverable: "the four published modifier tails each driven to a refusal by a row keyed to their constant"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#REACH `fixme`: the published modifier tail refused on a published head"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#REACH `fail`: the published modifier tail refused on a published head"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#mutation: reach-modifier-tails.uat.spec.ts is accepted once its banned constructs, and only those, are removed"
        status: pass
    human_judgment: false
  - deliverable: "the watched directory names partitioned by derivation, union and disjointness asserted, omitted half still counted"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#31-42 (IN-19): the partition is DERIVED — its union is the boundary and its halves are disjoint"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#31-42 (IN-19): the OMITTED half is still SKIPPED and still COUNTED, and grows no line"
        status: pass
    human_judgment: false
  - deliverable: "the emitted line states what its counts count, and the recipe states the same fact"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#31-42 (IN-19): the recipe carries the COUNT MEANING by value, so the line and the claim agree"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#31-42 (IN-19): the recipe's quoted PARTITION halves equal the exported ones, both directions"
        status: pass
    human_judgment: false
  - deliverable: "the stream decision, taken against the written contract, and the two host readings the recipe's claim is now made against"
    human_judgment: true
    rationale: "The decision is a reading of two documents (the module's D-12 stream block and 05-pr-quality-gate.md step 3) against two measured host runs, and the correction it produces is prose. No test can assert that a document was read; what IS tested is that the stream did not move, that the exit code and stdout are byte-identical with and without a disclosure, and that both published readings match the exported constants."
---

# Phase 31 Plan 42: WR-37, WR-38 and IN-19 — the walk's own census, the ban family's own census, and a disclosure that discloses something Summary

Round 8's two Warnings and one Info on the UAT spec-integrity checker were one shape: a published
claim whose subject is somebody's attention rather than the code. Closing them meant deriving three
sets that had been assembled — the positions the framework-surface walk can stop at, the ban members
a reachability binding must cover, and the directory names a disclosure is for — and answering the
one argument that stood in the way with a measurement rather than a counter-argument.

## What this plan did

- **`WR-37`.** Derived the walk's swallow positions from its own call closure (NINE, where the review
  named four), routed the five that failed open to a loud arm, published one entry per position with
  the arm it takes, and drove every one with a substitute checker that throws from exactly that
  position — the instrument round 8's residual was defended by the absence of.
- **`WR-38`.** Derived the reachability binding's expected side from the ban-set FAMILY the
  membership authority consults (four sets, eight members), replaced two hand-made row-id prefixes
  with one keyed to the constant, added the five rows that had none, and checked the
  shared-resolution claim rather than quoting it.
- **`IN-19`.** Took both host readings before deciding anything, partitioned the watched names by
  derivation, narrowed the disclosure to the half whose skip could hide this repository's own
  evidence, named the counted thing in the line a reader meets, decided the stream against the
  written contract, and corrected the recipe against the readings.
- **`D-42`** recorded in `31-CONTEXT.md` with every number behind the three closures and a
  `does not establish` section.

## `WR-37` — the derived swallow-site census

The census is derived by starting at `frameworkSurface`, following every call to a module-level
function declaration transitively, and collecting every `catch` that continues or substitutes a value
in place of the one it could not produce. The closure is the derivation's own answer: `WR-37`'s
fourth position lives in `containerTypeArguments`, a function the walk CALLS, so a census scoped to
one function body would have missed it and a census scoped to a hand-named helper list would be the
set-literal drift this repository keeps paying for.

**NINE positions. The review named FOUR. Its four are a strict subset.**

| derived site | kind | pre-fix reading (through the seam) | decided as |
|---|---|---|---|
| `addDeclarations#1` | catch-and-continue | `truncated: null`, **files: 0**, paths 3 | NEW arm `surface-unreadable` |
| `frameworkSurface#1` (export type) | catch-and-continue | `truncated: null`, paths 0 | NEW arm `surface-unreadable` |
| `frameworkSurface#2` (exports list) | catch-and-substitute | `truncated: exports-unreadable` | arm `exports-unreadable` — already recorded |
| `frameworkSurface#3` (property type) | catch-and-continue | `truncated: null`, paths 1 | NEW arm `surface-unreadable` |
| `frameworkSurface#4` (expansion) | catch-and-continue | `truncated: null`, paths 1 | NEW arm `surface-unreadable` |
| `containerTypeArguments#1` | catch-and-substitute | `truncated: null` | arm `container-unreadable` (returns `null` on a throw) |
| `hasExpandableMembers#1` | catch-and-substitute | `truncated: depth-bound` | arm `depth-bound` — FAILS CLOSED, unchanged |
| `hasExpandableMembers#2` | catch-and-substitute | `truncated: depth-bound` | arm `depth-bound` — FAILS CLOSED, unchanged |
| `isDefaultLibraryDeclaration#1` | catch-and-substitute | `truncated: depth-bound` | arm `depth-bound` — fails towards walking, unchanged |

**The fifth swallow, which no review named, measured worst of the five.** `addDeclarations#1` guards
`declaration.getSourceFile().fileName`. A checker throwing there returned a surface holding **not one
framework declaration file**, with `truncated: null` — reported as complete. Every call on that
surface then resolves `foreign`, which is accept: the ban off, silently, over the whole surface. Its
old comment ("a synthesised declaration carries no file; it cannot anchor identity either") is true of
a synthesised declaration and says nothing about one whose file the checker threw on.

**The controls, re-driven rather than assumed.** An unobstructed walk finishes with `truncated: null`.
A LEAF at the depth bound is still not a truncation (chain 6, `null`); a node CUT at it still is
(chain 7, `depth-bound`). The fail-CLOSED pair still answers `expandable` when it cannot read the
node — driven on the chain whose unobstructed reading is `null`, so the truncation is the throw's
doing and not the chain's. The two bound arms still reach exit 2 with their own causes through the
existing `31-35` rows.

## The measurement that answered `containerTypeArguments`'s docstring

Its docstring argued for the fail-open: *"treating every unreadable type as a stopped walk would
block runs on the ordinary shapes this call is made over, and a gate that always blocks is a gate
nobody reads."* The plan's rule is that a kept fail-open is published with a number, so the number was
taken.

**Instrument.** A copy of `uat-spec-integrity.ts` with a counter injected as the first statement of
every derived catch block, transpiled and driven through `createProgramForTarget` over genuine target
repositories built the way the suite builds them.

**Corpus.** 26 genuine walks — the 16 fixture specs, seven deep property chains (j = 3..9, per-file
layout, five of which reached a bound), a 4,200-type wide surface, an index-signature probe and a
library-container probe.

**Result: ZERO throws, at all nine positions, on every walk.**

The shapes the argument was about do not throw; they answer. So the argument is not supported by the
number, every fail-open is routed loud, **no fail-open is kept**, and `UNRESOLVABLE_CALLEE_RESIDUALS`
is unchanged at ten. The rule survives for the next position: a kept fail-open carries its throw count
in its register entry, and silence is not a disposition.

## `WR-38` — the ban-set family, derived

The binding's expected side now starts at `isBannedModifierCall` — `D-18`'s one membership authority,
the function the arm-(c) call site asks — follows its call closure, and collects every EXPORTED
constant those functions reference whose initializer is a frozen collection.

| set | shape | members | rows before | rows after |
|---|---|---|---|---|
| `BANNED_MODIFIER_HEADS` | frozen array | `test`, `describe` | 2 (under `REACH-HEAD-`) | 2 |
| `BANNED_MODIFIER_TAILS` | frozen array | `skip`, `only`, `fixme`, `fail` | **0** | 4 |
| `BANNED_EXACT_PATHS` | frozen array | `expect.soft` | 1 (under `REACH-PATH-`) | 1 |
| `BANNED_CONFIGURED_PATHS` | frozen object | `expect.configure` | **0** | 1 |

**Family cardinality 4; eight members; eight required rows.** `CALL_LINK_MARKER` is referenced by the
same closure and is excluded by the shape filter, which is the discrimination that keeps the family
from being "every constant nearby". Measured against the pre-task base by re-deriving the census from
that commit's own test file: **8 of 8 required ids missing**, because the three that existed carried
hand-made per-axis prefixes. The row id is now `REACH-<constant>-<member>`, so a fifth published ban
set joins the binding by being CONSULTED rather than by somebody remembering a fifth prefix.

**The fixture each new row needed.** `scripts/runnable-ref/fixtures/reach-modifier-tails.uat.spec.ts`
— one call per published tail on a published head, through the framework's own declared surface, in a
marked mutation region so the four findings are proven to be the four planted constructs. `fixme` and
`fail` were called by **no fixture at all** before this plan; `only` was reached incidentally by two
fixtures written for other reasons. The configured-path row drives `configured-soft.uat.spec.ts`,
which also carries the LEGITIMATE `expect.configure({ retries: 2 })` spelling outside its region, so
the refusal cannot be a bare path ban. No new declaration surface was added: the fixture compiles
against the two surfaces `tsconfig.fixtures.json` already includes, and `npm run typecheck` exits 0.

**The shared-resolution claim, CHECKED rather than quoted.** One member of each of the four sets is
driven through a declared-foreign binding: `describe.only` through the ambient `other-framework`
(head and tail at once), `expect.soft` through `other-assert`, and `expect.configure({ soft: true })`
through a module declared in the target's own `types/`. A set whose rule bypassed the identity
resolution would pass membership equality and fail here.

**Both new directions.** The CONVERSE fails the census when a `REACH-BANNED_*` row names a member no
published set contains, with its own floor so an empty result is not "there are no REACH rows at all".
The SEEDED FAIL now covers the tail axis beside the head axis, run in-process.

## `IN-19` — the two host readings, taken before anything was decided

| reading | exit | stdout | stderr | the disclosure |
|---|---|---|---|---|
| **this repository, pre-fix** (`node scripts/runnable-ref/uat-spec-integrity.js .`) | 2 | 0 B | 366 B | **217 B**, naming `.git=1, .temp=1, node_modules=1` |
| **an equipped probe tree** carrying none of the five names as a real directory (symlinked `node_modules`) | 0 | 58 B (the pass line) | **0 B** | none |
| **this repository, post-fix** | 2 | 0 B | 529 B | 380 B, naming **`.temp=1` alone** |

The zero-byte reading is the one the recipe published as its measured CONTROL. It is true, and it is
a probe: a symlinked `node_modules` is decided by the walk's symbolic-link branch and never reaches
this boundary, which is exactly why the probe can carry the name and still skip nothing. The recipe
now carries both readings, host first.

**The partition, derived.** `SKIPPED_DIRECTORY_DISCLOSURE_CLASS` answers one question per watched
name — could a skip here plausibly hide THIS repository's own UAT evidence? — and both halves are
derived from `SKIPPED_DIRECTORIES` by filtering it.

| half | members | why |
|---|---|---|
| `DISCLOSED_SKIPPED_DIRECTORIES` | `dist`, `tools`, `.temp` | paths under the host's own control where a spec can genuinely land — a build step's output, the kit the installer materialises into `tools/grugops/`, the scratch root round 5 measured a stray spec in |
| `UNDISCLOSED_SKIPPED_DIRECTORIES` | `node_modules`, `.git` | a dependency tree the host does not author, and an object store that is not a working tree — and the two names present at the root of virtually every repository, which is why the line fired on virtually every run |

The union is asserted equal to the boundary and the halves asserted disjoint, so a sixth watched name
lands in one half or turns the case red. The class record's key set is asserted equal to the boundary
in both directions, so a class for a name nobody skips cannot pad it. **The omission is not an
erasure**: an omitted name is still skipped, `deriveSpecPaths` still records its hit (driven and
asserted), and both halves are listed in the recipe by values read back from the partition.

**The counted thing is named in the line.** `SKIPPED_DIRECTORY_COUNT_MEANING` is appended to every
emitted disclosure: the numbers are DIRECTORY ENTRIES the walk refused to descend into, never specs
hidden under them, and the runnable does not know that number because it did not look.

**The stream decision, taken against the written contract.** The module's own D-12 block reserves
*"stderr → every could-not-run reason, including both loud-skip markers"*;
`agent-factory/workflows/05-pr-quality-gate.md` step 3 instructs the reader to *"Branch on the exit
code"*, not on the presence of stderr bytes. The mis-reading `IN-19` describes is reachable from the
contract and is not what the workflow tells a reader to do. **Decision: the line stays on stderr.**
Moving it to stdout would put a non-result on the stream that contract reserves for the result and the
audit trail (`MEASUREMENT_BRANCH_STREAMS` gives stdout to the two result branches only) and would
change the pass line a host's tooling reads. The recipe now states the sharing and names the exit code
as the discriminator. **No case asserting the stream contract was touched, because the stream did not
move.**

## Verification

| command | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **66 files, 4330 passed, 2 skipped, exit 0** (baseline at the plan base: 66 / 4305 / 2) |
| `npm run build` | exit 0 |
| `npm run typecheck` (three targets, including the fixtures corpus) | exit 0 |
| `npm run check:build-parity` | `no tracked build output moved when tsc ran` |
| `npm run freshness` | `61 committed .js file(s) match a rebuild of their sources` |
| `npm run freshness:hook-manifest` | `2 decider(s), 26 module hash(es) match a fresh derivation` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `npm run check:banned-claims` | `ALL CHECKS PASSED` |
| `npm run check:public-docs` | `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | `ALL CHECKS PASSED` |
| `npm run check:audit-register` | `ALL CHECKS PASSED` |
| `npm run check:residual-citations` | `ALL CHECKS PASSED` |
| `node scripts/check-kit-refs.js` | `ALL CHECKS PASSED` |
| `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` |
| `npm run check:nul-bytes` | `ALL CHECKS PASSED` |
| `npm run check:platform-shapes` | `ALL CHECKS PASSED` |
| `npm run check:diff-disposition` | **78 finding(s) over 39 elements — the standing pre-existing number, UNMOVED.** `browser-uat-recipe.md` is not in the 40-file `LANG-03` watched corpus, so this plan's recipe edits owe the gate nothing; the eleven rows in `docs/audit/29-style-dispositions/31-42.md` are written anyway, as `31-35` did for the same file. |
| `node scripts/runnable-ref/uat-spec-integrity.js .` | the real host reading, recorded above |

## Deviations from Plan

**1. [Rule 2 — missing critical] The plan's `read_first` describes recipe cases binding the truncation
arms that did not exist.** Task 1's `read_first` says to read "the cases that assert the truncation
arms record is bound to the recipe in both directions". Measured: `SURFACE_TRUNCATION_ARMS` had
**no consumer anywhere outside its own declaration** — the recipe published no arm list at all, so the
count a reader could take from the document and the count the checker carries were never compared.
The binding was WRITTEN rather than read, in the strict quoted-value grammar the ban sets already use,
with the count equality the acceptance criterion asks for. Commit `8734734`.

**2. [Rule 1 — bug, found by this plan in its own first attempt] Four reachability rows drove their
members and still read as unrowed.** The tail rows were first written as a `for` loop with a computed
`row(\`REACH-…-${tail}\`)` id. `declaredCorpusRowIds()` is derived from `row("…")` call sites whose
single argument is a STRING LITERAL, so a computed id is invisible to it: the drives ran, refused
their members, and the binding reported all four tails missing. Measured, then fixed by writing the
four rows out, with the reason recorded above them so the next reader does not re-introduce it.
Commit `6c1735a`.

**3. [Rule 3 — blocking] `NON_TEST_MODULE_COUNT` re-derived 78 -> 79.** The new corpus fixture is a
tracked `*.ts`, and `scripts/check-foundation-guards.test.ts` pins that set equal to
`git ls-files '*.ts'` minus `.test.ts` and `.d.ts`. Re-derived rather than incremented (78 at the
round-9 base, 79 with the fixture tracked) and given its own paragraph in that constant's history, per
the discipline every prior fixture addition followed. Commit `6c1735a`.

**4. [Rule 2 — missing critical] `CORPUS_ROW_FLOOR` re-measured 55 -> 77.** Twenty-two rows landed
above a floor last measured at `31-35`. A floor left where it is while rows land above it silently
permits those rows to be deleted again, which is the standing reason this number is re-measured rather
than carried. Derived by `declaredCorpusRowIds().size`, not counted by hand. Commit `6c1735a`.

**5. [Rule 1 — bug] Two pinned recipe claims became false when the disclosure narrowed.** *"One line
on stderr names each skipped directory and its hit count"* and *"The line appears only when the walk
skipped something"* were true of the pre-partition emission. They are CORRECTED to what the runnable
now does, in the same commit as the mechanism. A hedge would have reproduced `IN-19` one adverb over.
Commit `bb2ddb4`.

**Total deviations: 5 auto-fixed** (2 × Rule 1, 2 × Rule 2, 1 × Rule 3). **Impact:** none widens the
plan's scope; each is a set or a claim this plan's own change moved and which had to move with it.

## Authentication Gates

None.

## TDD

Tasks 1 and 2 carried `tdd="true"` and were executed RED-first with the RED committed separately.

- **Task 1 RED** (`8900b36`): 7 failed / 366 passed. Five failures read `expected null to be
  'surface-unreadable'` or `'container-unreadable'` — the fail-open, observed through the new seam.
  Six of this plan's own new cases pass in the same run. `red-evidence/31-42-task1-red.json` carries
  the per-site pre-fix readings, the printed nine-member census and the 26-walk measurement.
- **Task 1 GREEN** (`8734734`): 4318 passed across the whole suite.
- **Task 2 RED** (`2e69141`): 2 failed / 373 passed. The binding names five published members with no
  row; the converse fails its own vacuity floor at 3 of 8. `red-evidence/31-42-task2-red.json` carries
  the family derivation, the base-commit census comparison (8 of 8 missing) and the computed-row-id
  defect.
- **Task 2 GREEN** (`6c1735a`): 4326 passed across the whole suite.

`gsd_run check tdd-red-evidence` cannot parse vitest's TAP output; the measured REDs are recorded in
the red-evidence files exactly as `31-40` and `31-41` recorded theirs. No verdict is fabricated.

## What this plan leaves OPEN, with a reason and what would force it closed

- **Whether a real TypeScript checker ever throws at any of the nine positions.** `UNKNOWN - verify`.
  The stub is the instrument; the 26-walk measurement says the real one did not throw once. The
  residual is survivable because reaching one now costs a could-not-run rather than a quiet accept.
  *Would force it closed:* a reproduced throw from a host's own checker at a named position.
- **The INSTALLED-PACKAGE surface's magnitude.** Standing `UNKNOWN - verify` carried from `D-36` and
  unchanged: the dependency set is fixed at `{typescript, vitest}`, so `@playwright/test` cannot be
  installed to measure what its real declared surface costs the two bounds. *Would force it closed:* a
  measurement over a real installed package, or a walk whose cost does not grow with the surface.
- **The hand-transcribed declaration corpus's drift from upstream.** `R-07`'s open
  `UNKNOWN - verify`. `fixtures/playwright-test.d.ts` and `fixtures/foreign-framework.d.ts` are hand
  transcriptions; the new fixture compiles against the same transcription and inherits its standing
  exactly. *Would force it closed:* an installed package to derive the surface from.
- **Per-tail coverage through a declared-foreign binding.** The shared-resolution case drives ONE
  member of each of the four sets that way. Per-tail foreign coverage is not claimed.
- **`05-pr-quality-gate.md`'s own narrower exit-2 claim.** *"Two conditions produce exit `2`"*, where
  the checker now reaches it from at least six. Recorded in `deferred-items.md` with an owner and a
  closing criterion, NOT fixed here: that workflow is in the `LANG-03` watched corpus with a frozen
  section, so the edit owes disposition rows and a companion edit, and this plan was convened for the
  checker.
- **The Windows leg of every reading above is `R-03`**, this phase's standing remainder. Every reading
  here was taken on darwin.
- **The `actuals.tokens` instrument is disclosed, because this phase's sibling summaries are not on
  one scale.** The 36000 above is chars/4 over this plan's realized diff (144,020 changed-line
  characters). The same instrument gives 31-39 ≈ 54,800, 31-40 ≈ 38,400 and 31-41 ≈ 47,800 against
  their recorded 48,768 / 78,000 / 71,000, so those three were taken on three different readings. The
  number here is stated with its instrument rather than adjusted to look comparable.

## What this plan does NOT claim

- **It does not flip a requirement.** `UATX-01` through `UATX-06` remain UNCHECKED in
  `.planning/REQUIREMENTS.md`, every traceability row still reads `Gaps Found`, and the Phase 31
  checkbox in `.planning/ROADMAP.md` stays unchecked. Both files are **byte-unchanged** by this plan's
  five production commits (`git diff --stat 71a4009..bb2ddb4 -- .planning/REQUIREMENTS.md
  .planning/ROADMAP.md` is empty). `UATX-06` was verified for the first time in round 8, and that
  verdict is a reading of round 7's tree rather than a licence to flip a box here.
- **It does not claim the three findings are closed.** It claims the three sets are now derived, the
  positions are driven, and the readings are recorded. Eight rounds of this phase have had an
  executing round believe it had closed something; only a verification round decides.
- **It does not change any exit code the D-12 contract publishes**, and it moves no finding count.

## Next

Ready for `31-43`.

## Self-Check: PASSED

- `scripts/runnable-ref/fixtures/reach-modifier-tails.uat.spec.ts` — FOUND
- `docs/audit/29-style-dispositions/31-42.md` — FOUND
- `.planning/phases/31-autonomous-manual-testing/red-evidence/31-42-task1-red.json` — FOUND
- `.planning/phases/31-autonomous-manual-testing/red-evidence/31-42-task2-red.json` — FOUND
- commits `8900b36`, `8734734`, `2e69141`, `6c1735a`, `bb2ddb4` — all FOUND in `git log`
- `git rev-list --count 71a4009..HEAD` = **5**, which is the `actuals.commits` above, measured and not
  narrated
