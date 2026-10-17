---
phase: 29-controlled-language-voice-guard-rebuild
plan: 29
subsystem: tooling
tags: [typescript, section-locator, parser-oracle, derived-scan, harness-premise, gap-closure, LANG-07]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "plan 29-28's fence-aware readRegistry and unfencedMatchIndices; plan 29-32's -1 contract scan; plans 29-27/29-30's module edits — the FINAL round-3 tree this plan re-derives over"
provides:
  - "HEADING_RECOGNISER_CONSTRUCTS and SCAN_TERMINATOR_CONSTRUCTS widened to the two spellings that hid audit-model.ts from BOTH arms, with each widening proven load-bearing on its own"
  - "SECTION_EXTENT_OWNERS / LOCATOR_CONSUMERS re-derived over the FINAL round-3 tree with a RECURSIVE, repository-rooted module set (49, not 41) compared against git's own index"
  - "every countable floor item's LIVE COUNT derived and pinned instead of asserted in prose; floor item 4 corrected, floor item 1 measured REACHABLE twice and escalated"
  - "a duplicate-occurrence axis making oracle invariant I5 REACHABLE, with per-invariant REACH counts derived outside the violation loop and pinned as equalities"
  - "a third deliberately broken locator returning the LAST unfenced match, required to break I5 alone"
  - "the duplicate-assertion tripwire's seven-number census, pinned two-sided, reproducing round 3's published answer over round 3's own tree"
affects: [LANG-07, section-locator, foundation-guards-harness, parser-oracle]

actuals:
  tokens: 38350
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "When a classifier misses a construct on TWO arms at once, widening one arm measures nothing — prove each widening load-bearing by running the other arm's narrow version against the same source"
    - "A disclosed floor is a claim about THIS tree and rots like any set-literal: give every countable item a DERIVED, pinned live count, and an honest `not counted` where no expression can produce one"
    - "SATISFIED is not REACHED. Restate each invariant's precondition as an expression written outside the loop that collects violations, count the cells satisfying it, and pin it as an equality"
    - "Reproduce a finding PERMANENTLY by restricting the new corpus to the old one — the finding is then re-measured on every run instead of remembered"
    - "When a fix needs a tokenizer, measure two independently written tokenizers against each other first; publish the disagreement as the measurement's own error bar and let it decide whether to ship"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.test.ts
    - scripts/section-locator-oracle.test.ts
    - docs/audit/29-locator-unification.md

key-decisions:
  - "BOTH classifier arms were widened, not the recogniser alone the plan specified — measured: neither widening alone reaches the pre-29-28 site, so the specified fix would have measured nothing"
  - "Floor item 1's two live sites are ESCALATED as a LANG-07 finding, not absorbed into the owner list: under the block's own definition a whole-document regex performs no line scan, and widening the definition to swallow it is re-writing the rule until the answer comes out interesting"
  - "The module set is made RECURSIVE rather than the case name narrowed, and `nonTestScripts()` is deliberately left alone because four other cases are scoped to `scripts/` on purpose"
  - "The review's fence-blind-breaks-I5 recommendation is REFUTED with the refutation asserted over the corpus, because a first-raw-match locator provably cannot reach I5"
  - "Multi-line `expect(` normalisation is NOT shipped: two independently written paren counters disagree on 14 live lines, the quote-aware one runs three live assertions to EOF, and normalisation reports the same zero the tripwire already reports"

patterns-established:
  - "Ask whether an invariant has ever been EVALUATED against an input able to break it, not only whether it has passed. A cell count, a label-coverage floor and a distinct-document count can all be healthy while one invariant is unreachable."
  - "A prose floor and a derived scan are the same kind of claim. Anything a floor asserts about the tree must be produced by an expression, or the floor must say plainly that it cannot be."

requirements-completed: []

coverage:
  - id: D1
    description: "The owner classifier recognises a hash RUN and a whitespace CLASS, and a bound COLLECTED into an array; each widening is proven load-bearing on its own and neither admits a live site"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the recogniser arm sees a hash RUN and a whitespace CLASS — floor item 4's shape, both directions"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the widening admits NO live site — the two modules a careless one would take are absent BY NAME"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the SEVENTH plant — a whitespace-class recogniser with a DEFERRED bound — is reported, and each widening alone is not enough"
        status: pass
      - kind: other
        ref: "the four-classifier before/after reproduction below — over pre-29-28 audit-model.ts the narrow arms, the recogniser widening alone and the terminator widening alone all report [], and the corrected pair reports the site; over the final tree it reports []"
        status: pass
    human_judgment: false
  - id: D2
    description: "SECTION_EXTENT_OWNERS, its count, LOCATOR_CONSUMERS and its count are the output of a derivation RUN over the FINAL round-3 tree with a recursive module set"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the OWNER set is derived tree-wide, floored for vacuity, and pinned two-sided at the authority alone"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the CONSUMER set is derived, sorted and pinned two-sided with its cardinality"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the module set is TREE-WIDE — derived recursively, counted by a second independent enumeration"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the tree-wide import reader agrees with the `scripts/`-scoped one on every module both can see"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both planted locators discriminate under the widened arms, and the seventh — the pre-29-28 shape restated — lands in a nested directory so the recursive walk is exercised by the probe"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#a SIXTH section locator makes the owner set fail, BY NAME — the member-level probe"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the classifier is FALSIFIABLE — both halves of the conjunction are load-bearing on a planted source"
        status: pass
    human_judgment: false
  - id: D4
    description: "No floor in the owner classifier asserts a falsehood about this tree; every countable item's live count is derived and pinned, and floor item 1 is measured REACHABLE and escalated"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#floor item 1 is a MEASUREMENT: every `new RegExp`-built section bound in the tree is derived and named"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose"
        status: pass
      - kind: other
        ref: "`grep -a -n 'which no module in this tree uses today' scripts/check-foundation-guards.test.ts` returns nothing, exit 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The six evasions found by attacking this plan's own widening — over two adversarial rounds — are all reported, and the owner set held at ONE through every tightening"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the six evasions the adversarial pass found against THIS plan's fix are all reported"
        status: pass
      - kind: other
        ref: "the two-round attack table below — six shapes seen getting through, each closed, each with a live count of zero so every closure is a floor rather than a re-measurement"
        status: pass
    human_judgment: false
  - id: D6
    description: "Oracle invariant I5 is REACHABLE, reached a pinned number of times, and proven able to fail against a locator returning the last unfenced match"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/section-locator-oracle.test.ts#the corpus really carries TWO-OCCURRENCE documents, in both orders — counted, never inferred from a label"
        status: pass
      - kind: unit
        ref: "scripts/section-locator-oracle.test.ts#every invariant I1..I6 is REACHED — counted by an expression written outside the violation loop"
        status: pass
      - kind: unit
        ref: "scripts/section-locator-oracle.test.ts#THE SWEEP IS FALSIFIABLE — a LAST-match locator breaks I5, the ordering promise nothing tested"
        status: pass
      - kind: unit
        ref: "scripts/section-locator-oracle.test.ts#the invariants that speak about a NEGATIVE or OUT-OF-RANGE answer are REACHED too — the same defect, checked for elsewhere"
        status: pass
    human_judgment: false
  - id: D7
    description: "The review's fence-blind-breaks-I5 recommendation is refuted with the refutation asserted over the whole corpus, and IN-01's dead conjunct is moved to a reachable home"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/section-locator-oracle.test.ts#the review's fence-blind-breaks-I5 recommendation is REFUTED, and the refutation is proven"
        status: pass
    human_judgment: false
  - id: D8
    description: "The duplicate-assertion tripwire publishes a seven-number census pinned two-sided, reproduces round 3's published answer over round 3's tree, and asserts the multi-line pair's intended verdict"
    requirement: LANG-07
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the tripwire's PREMISE: the census reproduces round 3's published answer over round 3's tree"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the tripwire PUBLISHES its denominator — four numbers, each derived, each pinned two-sided"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#a MULTI-LINE duplicate pair is MISSED — the intended verdict, asserted rather than left as an absence"
        status: pass
    human_judgment: false
  - id: D9
    description: "The escalation this plan raises rather than closes: two catalog generators answer the section-extent question through a `new RegExp` lookahead, fence-blind, outside the owner scan's published definition"
    requirement: LANG-07
    verification:
      - kind: other
        ref: "the LANG-07 escalation section below, with both addresses, the shared helper's source, and the reason it is not absorbed into the owner list"
        status: pass
    human_judgment: true
    rationale: "Whether LANG-07's truth can be called held while two generators carry a third, fence-blind section grammar is a human judgment. This plan measured it, pinned it two-sided so it cannot rot, and refused to widen its own definition to make the answer look either cleaner or more interesting."

duration: 50min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 29: A measurement produced by a rule that cannot see the thing it counts

**`SECTION_EXTENT_OWNERS = ["frontmatter.ts"]` ran green over a two-owner tree, and its own disclosed floor asserted that nothing in this repository used the spelling that hid the second owner. The rule is corrected, both blindnesses are proven load-bearing, the sets are re-derived over the final round-3 tree, oracle invariant I5 is reachable for the first time in 7200 cells, and every countable floor item now carries a number an expression produced — including one that turned out to be reachable twice and is escalated rather than absorbed.**

## Performance

- **Duration:** 50 min
- **Started:** 2026-08-16T00:33:15Z
- **Completed:** 2026-08-16T01:23:38Z
- **Tasks:** 3
- **Files modified:** 3 (all test/doc — no shipped `.js` changed)

## Accomplishments

- **CR-02's harness half closed, and the plan's own prescription found insufficient by measurement.** The plan specified widening the RECOGNISER arm. Run over the pre-29-28 source, that widening alone reports the empty set — as does the terminator widening alone. Both arms were blind at once, and the two single-arm empties are now permanent cases.
- **The owner set is a measurement over a corrected rule, taken over the FINAL tree.** With `audit-model.ts` at its pre-29-28 source the corrected classifier reports **two** owners; over the final tree, **one**.
- **Floor item 4 no longer asserts a falsehood — and item 1 turned out to be REACHABLE, twice.** Re-checking every item against the tree found `sectionBody` duplicated in two catalog generators, bounding a `## ` section by fence-blind regex lookahead. Derived, pinned two-sided with both addresses, **escalated**.
- **V-29-26-02 closed for this block.** The scan read one directory non-recursively — 41 of 49 — while its case name said "tree-wide". It is recursive now, compared against `git ls-files` before any claim, and the wider answer is the same answer.
- **Six evasions found by attacking this plan's own widening, over two rounds, all closed — and the owner set held at ONE through every tightening.**
- **Oracle invariant I5 is reachable for the first time.** Reach 0 → 1800, with a third broken locator that breaks I5 alone and would have swept clean over round 3's corpus. That fact is now a permanent assertion, not a transcript.
- **The tripwire's published figure and its coverage are the same statement.** Seven numbers, each derived, each pinned two-sided, plus the measurement's own error bar — and the census reproduces round 3's published 47 / 4806 / 4751 exactly over round 3's own tree.

## Task Commits

1. **Task 1 (TDD): the owner classifier sees the shape its own floor said nothing used** — `dcaf1a7`
2. **Task 2 (TDD): the oracle's invariants are REACHED, not merely satisfied** — `b3b3368`
3. **Task 3 (TDD): the duplicate-assertion tripwire publishes its denominator honestly** — `37020aa`

## Files Created/Modified

- `scripts/check-foundation-guards.test.ts` — both classifier arms widened; `recogniserApplication` / `declarationAppliesRecogniser` as one authority for "does this line apply a recogniser"; `terminatesAt`'s block rule made conditional on whether the recogniser line opens a block; `nonTestModules()` (recursive, repository-rooted) and `importedSymbolsAt`; `REGEXP_BUILT_SECTION_BOUND` and the floor-item live-count derivations; `PLANTED_SEVENTH_LOCATOR`, `PLANTED_EVASION_SOURCE` and a fifth planted function `[E]`; the seven-number tripwire census, `PLANTED_MULTILINE_DUPLICATE_SOURCE`, and the round-3 premise case. **197 → 208 cases (+11).**
- `scripts/section-locator-oracle.test.ts` — the duplicate-occurrence axis and `duplicateBlock`; `headLastUnfenced`; the `REACH` predicate table and `REACH_FLOORS`; the corpus-shape counts; the IN-01 guard clause; every pinned number re-derived. **7 → 12 cases (+5).**
- `docs/audit/29-locator-unification.md` — new §9 (nine subsections); one-line pointers inserted at §3, §4 and §6. **329 insertions, 2 deletions — and both deletions are my own §9 pointer wording and a §9.6 → §9.8 renumber. §3, §4 and §6's own measurements are byte-unchanged.**

---

## LANG-07's four enumerated `missing:` items

| # | `29-VERIFICATION.md` item | Landed artifact |
|---|---|---|
| 1 | "Close the sixth locator in audit-model.ts … derive `headingIdx` from an unfenced scan and take the block's end from the same source" | **Plan 29-28**, commits `3a16647` / `ec47fda`. Not re-implemented here — round 3's brief refuses two competing repairs of the same lines. |
| 2 | "Have parseClaimBlock consume the one fence authority instead of its private `trim() === \"```\"` equality" | **Plan 29-28**, commit `f3f85ee`. |
| 3 | "Correct the owner classifier's floor item 4 — either recognise `#{n,m}\\s` or state truthfully that a module uses it" | **This plan, Task 1** (`dcaf1a7`). The shape is RECOGNISED, item 4 is rewritten to state what stands in its place, and the retired sentence is grep-absent from the file. |
| 4 | "Re-derive SECTION_EXTENT_OWNERS after the fix and require the planted-sixth probe to still discriminate" | **This plan, Task 1** (`dcaf1a7`). Re-derived over the final tree with a recursive module set; the sixth probe still discriminates and a SEVENTH — the pre-29-28 shape restated — was added beside it. |

---

## Task 1 — the RED-first transcript

Written before either arm was touched and run against the committed (pre-fix) build. Five genuine assertion failures against real shipped behaviour:

```
 × the classifier is FALSIFIABLE — both halves of the conjunction are load-bearing on a planted source
 × a SIXTH section locator makes the owner set fail, BY NAME — the member-level probe
 × the recogniser arm sees a hash RUN and a whitespace CLASS — floor item 4's shape, both directions
 × the widening admits NO live site — the two modules a careless one would take are absent BY NAME
 × the SEVENTH plant — a whitespace-class recogniser with a DEFERRED bound — is reported, and each widening alone is not enough

AssertionError: expected [ …(3) ] to deeply equal [ …(4) ]
AssertionError: the whitespace-class recogniser with a DEFERRED bound must be reported — this is the
  exact shape round 3 found green over a two-owner tree: expected [ 'scripts/frontmatter.ts', …(1) ]
  to include 'scripts/runnable-ref/scratch-seventh-…'
AssertionError: a hash RUN, literal space is an ATX heading recogniser and must be recognised:
  const B = /^### /;: expected false to be true
AssertionError: the widened arm DOES recognise a whitespace-class heading regex — that is the
  widening: expected false to be true
AssertionError: expected [] to deeply equal [ Array(1) ]

 Tests  5 failed | 198 passed (203)
```

**Honest note.** Two of the six cases added in Task 1 passed on their first run: the floor-item-1 derivation and the recursive-module-set case are new MEASUREMENTS, not fixes, so there was no wrong answer for them to red against. Disclosed here rather than presented as REDs.

## Task 1 — ADVERSARIAL SELF-REPRODUCTION: four classifiers over the pre-29-28 source

Run through THE RULE in this session (`git show 0ec8b61:scripts/audit-model.ts`), never a second spelling of it. The premise is asserted before the result.

```
PREMISE: pre source is 1158 lines; final source is 1347 lines; they differ = true
PREMISE: pre carries the raw heading scan = true
PREMISE: final carries it = false

=== PRE-29-28 audit-model.ts, four classifiers ===
  pre-29-29 arms (both narrow)     -> []
  widened RECOGNISER only          -> []
  widened TERMINATOR only          -> []
  CORRECTED (both widened)         -> ["readRegistry :: if (CLAIM_HEADING_RE.test(lines[i])) headingIdx.push(i);"]

=== FINAL tree audit-model.ts, corrected classifier ===
  CORRECTED (both widened)         -> []

=== OWNER SET over the tree with audit-model.ts AT ITS PRE-29-28 SOURCE ===
  ["scripts/audit-model.ts","scripts/frontmatter.ts"]  (count 2)
=== OWNER SET over the FINAL tree ===
  ["scripts/frontmatter.ts"]  (count 1)
```

**The two middle lines are the finding this plan added to the review's.** CR-02 says the module is "missed twice over" and the plan's `<action>` prescribes widening the recogniser arm. Measured, the recogniser widening alone reports **nothing** — as does the terminator widening alone. A recogniser-only correction would have shipped a widened rule that measured the same clean tree, which is the exact defect this round exists to refuse. Both single-arm empties are permanent cases (`the SEVENTH plant …`), with the narrow arms RECONSTRUCTED rather than checked out of a commit, because keying a permanent case to a sha rots the first time the file moves (plan 29-27, decision 5).

## Task 1 — the widening asserted in BOTH directions

**Six matching spellings**, one hash / a run / a `{n,m}` quantifier, each with a literal space and with a whitespace class — all asserted `true`, all assembled from character codes so this file's own source carries no heading recogniser:

```
/^# /      /^### /      /^#{1,6} /      /^#\s/      /^###\s+(\S+)/      /^#{1,6}\s/
```

**Four non-matching**, including two taken from the LIVE tree and asserted absent from the derived owner set BY NAME:

| line | source | recognised? | owner? |
|---|---|---|---|
| `return /^#\d+$/.test(ref);` | `scripts/trace-render.ts:71` (live) | **false** — an issue reference | `scripts/trace-render.ts` absent |
| `.replace(/^##\s+/, "")` | `scripts/validate-agent-factory.ts:457` (live) | **true** — this IS the widening | `scripts/validate-agent-factory.ts` absent |
| `/^#$/` | planted | false | — |
| `/^###(\S+)/` | planted | false | — |

The `validate-agent-factory.ts` row is the stronger half: the widened arm really does recognise its board-heading normaliser, and it is excluded by the CONJUNCTION — the line bounds no scan. That is the mechanism this block rests on, exercised on a live module.

## Task 1 — both planted probes

```
SEVENTH PLANT -> ["claimSpans :: if (CLAIM_HEAD.test(lines[i])) marks.push(i);"]
  under pre-29-29 arms -> []
SIXTH PLANT   -> ["tableUnder :: if (lines[i].startsWith(\"## \")) break;"]
PLANTED FIXTURE base -> ["plantedCloseByRegex :: if (CLOSES.test(lines[i])) return i;",
                         "plantedCloseByPrefix :: if (lines[i].startsWith(\"## \")) {",
                         "plantedCloseByBound :: if (lines[i].startsWith(\"# \")) {",
                         "plantedCloseByCollection :: if (OPENS.test(lines[i])) {"]
```

The member-level probe writes both plants into a temp directory that mirrors the tree's SHAPE (the seventh lands in `scripts/runnable-ref/`, so the recursive walk is exercised by the probe and not only by the enumeration case), asserts the control reproduces the live answer first, then requires the owner set to grow to two and then three. The per-construct removal probe still requires each of the four terminator constructs to cost **exactly one** planted site.

## Task 1 — the four re-derived constants, and the module-set scope decision

```
MODULES: 49   of which under scripts/ non-recursively: 41
SECTION_EXTENT_OWNERS      = ["scripts/frontmatter.ts"]     COUNT = 1
LOCATOR_CONSUMERS          = ["scripts/audit-model.ts", "scripts/check-banned-claims.ts",
                              "scripts/check-diff-disposition.ts",
                              "scripts/check-imperative-lexicon.ts", "scripts/voice-model.ts"]
LOCATOR_CONSUMER_COUNT     = 5
```

**Decision: RECURSIVE**, which is the option the plan prefers and the remedy this repository already uses — widen the assertion rather than narrow the sentence. The read is repository-rooted, returns relative paths, and is compared for set equality against `git ls-files '*.ts'` inside the case. **Round 3's measurement was 41 of 49; the answer over 49 is the same answer**, so the widening is a floor rather than a re-measurement. `nonTestScripts()` itself is deliberately untouched: four other cases in the file are scoped to `scripts/` on purpose (the D-64 cutover pins), and silently re-rooting them would be a second unexamined change riding on this one. `importedSymbols` now delegates to a path-aware `importedSymbolsAt`, and a case compares the two over all 41 × 3 module/specifier pairs so the widened import reader is not a second grammar going unchecked.

## Task 1 — THE ESCALATION: floor item 1 is REACHABLE, twice

Re-checking every floor item against the final tree — the discipline this plan applies to item 4 — found item 1 live at two addresses:

```
scripts/generate-catalog.ts:87
scripts/generate-role-adapters.ts:127
```

Both are the same helper, duplicated verbatim:

```ts
function sectionBody(text: string, heading: string): string | null {
  const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}
```

That bounds a `## ` section by regex lookahead over the whole document. It is a **third grammar** answering the section-extent question, and it is **fence-blind**: a `## ` line quoted inside a fenced example in a role or workflow file terminates the capture early.

**It is NOT absorbed into the owner list, and that is the decision.** Under this block's own published definition a section-extent construct is a heading recogniser used on a LINE that terminates or bounds a SCAN; a whole-document regex performs no line scan at all. Widening the definition to swallow it would be re-writing the rule until the answer came out interesting — the mirror image of narrowing it until the answer comes out clean, which is the defect this plan is correcting. What is not optional is that the floor stop reading as a hypothetical: the shape's live count is DERIVED and PINNED two-sided with both addresses, so a third generator adopting the helper reds on the day it lands.

**LANG-07's truth is therefore not fully closed on this tree, and this is escalated rather than recorded as an accepted residual.** The remedy is code — rewiring both generators onto the shared authority — in modules this plan does not own and cannot verify, which is one plan's worth of work in the shape 29-20 through 29-28 each took for one module.

## Task 1 — the floor, re-checked item by item with live counts

| item | status after round 3 | live count |
|---|---|---|
| 1 — `new RegExp` / concatenated fragments | **REACHABLE**; escalated above | **2**, both named and pinned two-sided |
| 2 — slice / charAt / indexOf heading test | still a floor | **0**, derived and pinned |
| 3 — a bound through a HELPER | still a floor | not counted — needs a call graph, said plainly |
| 4 — whitespace CLASS separator | **CLOSED** — the shape is recognised | its residue (a bracket character class) is **0**, derived and pinned |
| 5 — a locator in a `.js` the scan does not enumerate | still a floor | **0** committed `.js` with no `.ts` beside it, derived and pinned |
| 6 — a terminator outside the block-scoped search | **NARROWED** — the array-collection spelling is now a construct | not counted — needs data-flow analysis |

The row-scoped acceptance grep is clean:

```
$ grep -a -n 'which no module in this tree uses today' scripts/check-foundation-guards.test.ts
$ echo $?
1
```

`TERMINATOR_WINDOW` re-measured against the corrected arms and the recursive set: the derived owner answer is **identical at 4, 6, 10 and 20**, so nothing depends on its value.

---

## THE ADVERSARIAL PASS ON MY OWN FIX — two rounds, six evasions

The corrected arms were attacked before they were committed. Round one found three getting through; the arms were tightened; round two, run against the tightened arms, found three more. Every one was SEEN getting through first and every one is now a permanent case.

| # | shape | round | why it got through | disposition |
|---|---|---|---|---|
| B1 | the recogniser's RESULT bound to a local `const` | 1 | the declaration skip asked "is this a binding" when the question is "does this binding DEFINE a recogniser or APPLY one" | **closed** |
| B2 | `marks.push(i + 0)` | 1 | the collection construct required the index BARE | **closed** |
| B3 | `/^\s*## /` | 1 | the arm anchored on `\^#` with no leading-whitespace tolerance | **closed** |
| B4 | `lines[i].match(HEAD)` | 1 | — already caught; kept as the fixture's control | n/a |
| C1 | `lines[i].search(HEAD)` | 2 | the application-verb set carried `test`/`exec`/`match` and no `search` | **closed** |
| C2 | `HEAD?.test(lines[i])` | 2 | the same set knew no optional-chaining spelling | **closed** |
| C4 | `end = Math.min(end, i)` | 2 | the bound-assignment construct required the index BARE | **closed** |
| C6 | a terminator eight lines below its recogniser | 2 | `TERMINATOR_WINDOW` is 6 | **recorded** — floor item 6, bound stated at the constant |

The round-one RED, verbatim:

```
AssertionError: expected [ Array(1) ] to deeply equal [ …(4) ]
  [
-   "evadeByBoundResult :: const isHead = HEAD_A.test(lines[i]);",
-   "evadeByPushOffset :: if (HEAD_B.test(lines[i])) marks.push(i + 0);",
-   "evadeByLeadingWhitespace :: if (HEAD_C.test(lines[i])) return i;",
    "evadeByMatchCall :: if (lines[i].match(HEAD_D)) break;",
  ]
```

**B1 needed a second structural change, not a wider regex.** The terminator search stopped at the first line indented no deeper than the recogniser line — correct for a line ending in `{`, wrong for a line that opens no block at all, whose bound is necessarily a following SIBLING. The rule is now conditional on whether the recogniser line opened a block, and the control plant `[D]` that proves a `return` after the enclosing loop is NOT reached still holds. The closure's live blast radius is derived and pinned: **exactly one** declaration-line in the tree applies a recogniser (`scripts/audit-model.ts:1081`), and it bounds no scan.

**C1 and C2 are the set-literal drift class inside the assertion written to close it.** The application-verb list was hand-maintained and had already rotted. `replace` and `split` were deliberately NOT added — they transform text rather than locate a line, and admitting them is the widening-until-noisy direction.

**The owner set held at ONE through every tightening.** That is the load-bearing result: the classifier got six notches stricter and the tree still has exactly one line-scanning section-extent owner. Live count of `.search(` and `?.test(` across the 49 modules: **0 and 0** — so every closure is a floor, not a re-measurement.

---

## Task 2 — the RED-first transcript, and the numbers re-derived

Four cases red on the first run of the grown corpus, each an assertion against a number that had moved:

```
 × the corpus is DERIVED and COUNTED — axis lengths pinned, the cell count derived twice
 × the corpus really carries TWO-OCCURRENCE documents, in both orders
 × every invariant I1..I6 is REACHED — counted by an expression written outside the violation loop
 × THE SWEEP IS FALSIFIABLE — WR-01's fence-blind anchor scan fails cells

AssertionError: distinct (text, from, level) triples in the corpus: expected 6378 to be 2058
AssertionError: cells carrying TWO UNFENCED occurrences … : expected 720 to be 4176
AssertionError: I2's reach against its pinned floor: expected 4340 to be 12780
AssertionError: no UNFENCED cell may fail a fence-blindness probe: expected true to be false
```

Every pinned number was then RE-DERIVED and re-pinned from the run, never adjusted until a case passed:

| number | round 2 | round 3 |
|---|---:|---:|
| axes | 7 | 8 |
| cells (`EXPECTED_CELLS`, = product, = loop counter, = array length) | 7200 | **21600** |
| distinct `(text, from, level)` triples | 2058 | **6378** |
| distinct documents | 724 | **2164** |
| probe: level-two-only close (I2/I3) | 1440 | **5460** |
| probe: fence-blind anchor scan (I4) | 1440 | **3600** |
| probe: LAST-unfenced-match locator (I5) | — | **720** |
| shipped authority, violations | 0 | **0** |

## Task 2 — the four corpus-shape counts

Asserted directly on the generated corpus with a count, never on an axis label:

```
cells with TWO UNFENCED occurrences of the cell heading   720   (round 3: 0)
cells where a FENCED occurrence precedes an UNFENCED one  720   (round 3: 0)
cells where an UNFENCED occurrence precedes a FENCED one 1440   (round 3: 0)
cells where the `none` member produced a second occurrence  0   (the axis discriminates)
```

## Task 2 — the six REACH counts

Each derived by a precondition expression restated from the invariant's DESCRIPTION, in a table (`REACH`) that lives outside both violation collectors:

| invariant | reach (cells) |
|---|---:|
| I1 — the answer is within `[from, lineCount]` | 21600 (total, and it says so) |
| I2 — the answer is below the line count | 4340 |
| I3 — the range `[from, answer)` is non-empty | 14772 |
| I4 — the head locator returned an index | 3600 |
| **I5 — ≥2 occurrences of the heading AND an answer above zero** | **1800** (round 3: **0**) |
| I6 — the head locator returned -1 | 18000 |

**The check that the reach expressions do not call the violation collectors**, and the check that replaced its own first draft:

```ts
expect(REACH[id].toString()).not.toContain("endViolations");
expect(REACH[id].toString()).not.toContain("headViolations");
```

The first draft of the non-vacuity half asserted each source "contains the letter c", which every one of them does by accident of spelling — a check that could not fail, inside the case whose subject is checks that cannot fail. What is asserted instead is a property of the ANSWERS: every reach predicate except I1's is required to be strictly between zero and the cell count, because a predicate constant over the corpus measures the corpus's existence rather than the invariant's exercise.

## Task 2 — the last-match probe, SEEN FAILING

```
I5 violated — line 1 is an EARLIER unfenced occurrence of the same heading; at=6
  heading="# Candidate" level=[a level-one heading] fencing=[outside any fence]
  trailing=[no trailing residue] leading=[no leading residue]
  position=[the candidate is AT `from` itself] shape=[an ordinary multi-section document]
  request-level=[level 1] duplicate=[an earlier UNFENCED duplicate]
```

720 failures, **I5 alone** — the probe is fence-aware so I4 holds and complete so I6 holds, which is what makes the attribution mean something. No failing cell carries the `no second occurrence` label.

## Task 2 — WR-03 REPRODUCED PERMANENTLY, not transcribed

Round 3's corpus is this corpus restricted to the axis's `none` member. Both facts are asserted on every run:

```
round-3 sub-corpus size                                   7200
last-match locator's violations over that sub-corpus          0
I5's reach over that sub-corpus                               0
```

A future narrowing that removed the axis would red here rather than quietly restoring the gap.

## Task 2 — the review's recommendation, REFUTED with the refutation proven

WR-03 recommends re-running the fence-blind probe and requiring it to break I5 as well as I4. **That assertion cannot be made true**, and writing it anyway would be a vacuous assertion inside the case correcting a vacuous assertion. The argument:

> `headFenceBlind` returns the FIRST line whose `trimEnd()` equals the heading — a RAW match. I5 fires when some EARLIER line is unfenced AND equals the heading. An unfenced occurrence is itself a raw match, so an earlier one would have been returned instead. No earlier line can satisfy I5's predicate, for any input whatever.

The argument's own turning point is asserted over the whole corpus (the answer is never preceded by a raw match), the fence-blind probe is required to break **I4 alone**, and the last-match probe carries I5. The recommendation is answered rather than silently dropped.

## Task 2 — the fence-blind probe's attribution, RESTATED (and why that is itself a finding)

§4 recorded "only fenced cells may fail". True when a cell's candidate was its only occurrence; **false now**, and rightly so. A cell whose candidate is OUTSIDE any fence but which carries an earlier FENCED duplicate is exactly WR-01's shape — a file that quotes its required heading in an example and also declares it — and the fence-blind scan fails 720 of them. Asserting the old wording would have refused the corpus for finally generating the document the review said was missing. The true property is about the OCCURRENCES:

```
every failing cell carries a FENCED occurrence of its heading      asserted per cell
failing cells with an UNFENCED candidate                           720   (all `an earlier FENCED duplicate`)
failing cells with a FENCED candidate                             2880
total                                                             3600
```

## Task 2 — IN-01 closed, and its new home made REACHABLE

`end >= 0` moved out of the I2 guard, where `sectionEndIndex` made it unreachable-false, and into I1 as a guard clause with its own message and an **early return** — so a negative answer is reported as a negative answer rather than crashing inside I2's heading rule on `lines[-1]`.

Then, following round 3's own lesson that a review's enumeration is not the SET, the OTHER branches were checked for the same disease. Two more could not be reached by any locator in the file — that new I1 clause, and I4's "not -1 and is not a line index" arm. Both are now exercised by locators built to reach them, with a clean control first:

```
endViolations(cell, () => -1)  -> ["I1 violated — the answer is NEGATIVE — the locator returned no
                                   index at all; end=-1 from=1 lineCount=4 …"]   (I1 alone, no crash)
headViolations(cell, () => -2) -> I4: "the answer is not -1 and is not a line index"
endViolations(cell, tooHigh)   -> I1: "the answer is outside [from, lineCount]"
CONTROL: both shipped locators clean on the same cell
```

## Task 2 — suite runtime, before and after

```
npx vitest run scripts/section-locator-oracle.test.ts
  BEFORE: 7 tests,  194 ms
  AFTER: 12 tests,  597 ms      (3× corpus, 3.1× time)
```

Recorded rather than trimmed.

---

## Task 3 — the census, and the premise assertion landing exactly

The census reproduces round 3's three published figures **byte for byte** over round 3's own tree, which is what makes every new number below trustworthy:

```
ROUND-3 TREE (0ec8b61): modules=47  occurrences=4806  classified=4751
```

| question | round 3 tree | live tree | round 3's review |
|---|---:|---:|---:|
| test modules scanned | 47 | **47** | 47 ✓ |
| `expect(` occurrences (derived independently of the classifier) | 4806 | **5353** | 4806 ✓ |
| classified assertion lines | 4751 | **5281** | 4751 ✓ |
| classified lines whose STATEMENT continues past them | 919 | **1069** | — |
| classified lines whose `expect(` SUBJECT continues past them | 473 | **577** | **453** ✗ |
| the two paren counters' DISAGREEMENT | — | **14** | — |
| adjacent byte-identical pairs | 0 | **0** | 0 ✓ |

**One number does not reproduce, and it is reported rather than smoothed.** The review published **453** multi-line openers without publishing the rule that produced it. This census's SUBJECT-only rule answers **473** on the same bytes — a 4% gap between two rules, one of which is not reconstructible from what was written down. Three of the four figures reproduce exactly; the fourth is recorded as a difference between rules.

**The live/round-3 delta is explained**: +547 occurrences and +530 classified lines, contributed by the six round-3 plans (29-27, 29-28, 29-30, 29-31, 29-32) plus this one. All seven numbers are pinned two-sided, and the RELATIONSHIPS between them are asserted too — occurrences ≥ classified, statement-level ≥ subject-level, classified > statement-level, and the two counters' gap ≤ their disagreement count — so four numbers that drifted apart are loud rather than quiet.

## Task 3 — NORMALISATION NOT SHIPPED, and the decision is measured

IN-03's suggested fix is to join a multi-line `expect(` into one logical line before comparing. That needs a JavaScript tokenizer, and the evidence against writing one in this file is:

- two independently written paren counters — one naive, one that skips quoted regions — **disagree on 14 live classified lines**, at addresses like:

```
audit-model.test.ts:383            expect(() => readRegister(dir)).toThrow(new RegExp(REGISTER_PATH.replace(/\//g, "\\/")));
canonical-frontmatter.test.ts:539  expect(code).toContain("export function admit(");
check-imperative-lexicon.test.ts:483 expect(ACTOR).toMatch(/\//);
frontmatter.test.ts:1156           expect(names.reason).toContain("`(` (U+0028)");
```

- the quote-aware counter is itself wrong on a regex containing an escaped slash: under it **three live assertions run to END OF FILE**, so a mis-tokenised assertion silently swallows every line below it. A normalising classifier would therefore get **quieter the more regex-heavy a module is** — the same shape as the window-measured-in-source-lines defect plan 29-32 recorded;
- and on the live tree a normalising pass reports the **same answer** the tripwire already reports — **zero pairs** — so it buys no measured coverage today while adding a second grammar over source text to the phase whose founding rule is one authority per predicate.

**Per the plan's own instruction, the decision is recorded with its live number and the published share is not optional.** The residual: `TRIPWIRE_MULTILINE_STATEMENTS = 1069` of `TRIPWIRE_CLASSIFIED_LINES = 5281` (20.2%) classified lines carry a statement that continues past them, and for every one of those a duplicated pair's opener lines are separated by the continuation.

## Task 3 — the planted multi-line pair, with its INTENDED VERDICT asserted

```
duplicateAssertionPairsIn(PLANTED_MULTILINE_DUPLICATE_SOURCE)  ->  []        (MISSED, on purpose)
  both openers classified                                       ->  2
  the two openers are byte-identical                            ->  true
  lines between them                                            ->  4
  the opener is a multi-line statement by the census's own rule  ->  true
CONTROL: the SAME duplicate written on ONE line                 ->  ["2 :: expect(o).toContain(\"the same claim, twice\");"]
```

The miss is named mechanically rather than in prose, and the one-line control proves it is about the spelling and not about the fixture.

**On the adversarial self-reproduction, stated honestly.** The plan asks for the planted multi-line pair shown UNREPORTED under the pre-task build. Because no normaliser shipped, it is unreported both before and after — **there is no pre/post pair to paste, and claiming one would be an overstatement**. What changed is that the miss is now measured, published and asserted instead of being an absence a reader could mistake for coverage.

## Task 3 — the four existing controls, all still passing, by name

1. `the tripwire is FALSIFIABLE — a planted duplicate pair is found, and a near-miss is not`
2. …its separated-lines half (a pair with one intervening line is NOT reported)
3. …its differing-lines half (a pair differing by one character is NOT reported)
4. `"within one test body" follows from ADJACENCY — a test boundary is never a classified assertion line`

and the per-module contribution floor (`census.barren` equals `[]`), which is now derived by the same one-pass census as the published numbers.

---

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the seven gates | `node scripts/check-{foundation-guards,imperative-lexicon,diff-disposition,banned-claims,audit-register,claim-anchors,public-docs-vocabulary}.js` | **0, 0, 0, 0, 0, 0, 0** |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0** — every counting grep in this SUMMARY is trustworthy |
| kit refs | `node scripts/check-kit-refs.js` | exit **0** |
| exclusion list | `node scripts/generate-safety-surface.js && git diff --stat docs/audit/28-safety-surface-exclusions.md` | **empty** — byte-unchanged |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1987 passed / 2 skipped across 52 files, 123 s wall clock** (plan 29-32 baseline: 1971 / 2 / 52 — **+16**, no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; only the pre-existing `human-notes.txt`, `.gsd/`, `.planning/phases/29.1-…` |

**Round 3's closing measurement** (this is the round's last plan): seven gates at exit 0, 1987 passing tests across 52 files in 123 s, 48 committed `.js` fresh, zero NUL-bearing tracked files.

Suite delta accounting, so a silently shrinking suite would be visible: `check-foundation-guards.test.ts` 197 → 208 (**+11**), `section-locator-oracle.test.ts` 7 → 12 (**+5**). 1971 + 16 = 1987.

## Decisions Made

1. **Both arms widened, not the recogniser alone.** Measured: neither widening alone reaches the pre-29-28 site. Shipping the plan's prescription literally would have been a correction that measured nothing.
2. **Floor item 1's two live sites are ESCALATED, not absorbed.** A whole-document regex performs no line scan and is outside the block's own published definition; widening the definition to swallow it is re-writing the rule until the answer comes out interesting. The count is pinned two-sided instead, so it cannot rot the way item 4 did.
3. **The module set is made RECURSIVE rather than the sentence narrowed**, and `nonTestScripts()` is left alone because four other cases are scoped to `scripts/` deliberately.
4. **The application-verb list gained `search` and optional chaining but NOT `replace` or `split`.** Those transform text rather than locate a line; admitting them would count every heading-stripping normaliser as a candidate site.
5. **The review's fence-blind-breaks-I5 recommendation is refuted, with the refutation asserted** rather than the recommendation quietly dropped. Both are failure modes this round exists to refuse; only one of them is available here.
6. **IN-01's conjunct is moved to a guard clause with an early return**, not merely deleted — deleting it would have made a negative answer crash inside I2's heading rule instead of being reported.
7. **Multi-line normalisation is NOT shipped**, with the reasoning measured (14 counter disagreements, three assertions running to EOF, zero measured coverage gained) and the residual published with its live number.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The plan's Task 1 fix, as specified, cannot satisfy its own acceptance criterion**

- **Found during:** Task 1, before writing a line of the fix
- **Issue:** The `<action>` prescribes widening `HEADING_RECOGNISER_CONSTRUCTS` only. The `<acceptance_criteria>` requires the corrected classifier to report `audit-model.ts` as an owner over its pre-29-28 source. Measured through THE RULE, the recogniser widening alone reports `[]` — the terminator arm never reaches a bound collected into an array and consumed thirteen lines later, which the review itself says ("missed twice over") but the action does not act on.
- **Fix:** `SCAN_TERMINATOR_CONSTRUCTS` gained a fourth construct — an index COLLECTED into an array. Both single-arm controls are permanent cases, and the existing per-construct removal probe was extended with a fifth planted function so each of the four constructs still costs exactly one site.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `dcaf1a7`

**2. [Rule 2 - Missing Critical] Three evasions of the widened arms, found by attacking my own fix (round one)**

- **Found during:** the mandated adversarial pass, after the widening was green
- **Issue:** B1 (a recogniser's RESULT bound to a local `const`, dropped by the declaration skip), B2 (`push(i + 0)`), B3 (`/^\s*## /`). All three are real section locators that the CORRECTED classifier missed.
- **Fix:** the declaration skip now asks whether the binding DEFINES a recogniser or APPLIES one; the collection construct accepts an expression over the index; the arm tolerates leading whitespace. B1 also required `terminatesAt`'s block rule to become conditional on whether the recogniser line opened a block.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `dcaf1a7`

**3. [Rule 2 - Missing Critical] Three more evasions, found in a SECOND adversarial round against the tightened arms**

- **Found during:** the adversarial pass, round two
- **Issue:** C1 (`.search(HEAD)`), C2 (`HEAD?.test(...)`), C4 (`end = Math.min(end, i)`). C1 and C2 are the hand-maintained-set drift class — the application-verb list — inside the assertion written to close that class's first instance.
- **Fix:** all three closed; each has a live count of zero, so each closure is a floor. C6 (a terminator eight lines below its recogniser) is RECORDED as floor item 6 rather than closed, with its bound stated at `TERMINATOR_WINDOW`.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `dcaf1a7`

**4. [Rule 1 - Bug] My own recursive module walk read `.tmp-build/` and reported 48 phantom modules**

- **Found during:** Task 1, first run of the floor-item-5 derivation
- **Issue:** the walk's first skip list named `.git`, `.planning` and `.gsd` explicitly and missed `.tmp-build/` — the scratch tree `npm run freshness` rebuilds into, which carries a full second copy of every compiled module. It happened not to disturb the `.ts` enumeration (that directory holds only `.js`) and disturbed the `.js` enumeration immediately.
- **Fix:** the skip rule is now "any dot-directory", and BOTH walks assert set equality against `git ls-files` before any claim is made about their contents.
- **Why it matters:** this is the phase's recorded harness-premise failure class, self-inflicted. The `.ts` walk would have kept agreeing with git by luck; the premise assertion is what turned luck into evidence.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `dcaf1a7`

**5. [Rule 1 - Bug] A non-vacuity check in my own Task 2 harness could not fail**

- **Found during:** Task 2, reviewing the reach case before committing
- **Issue:** the first draft asserted each reach expression's source "contains the letter c" as proof it reads its cell. Every one of them does, by accident of spelling. A check that cannot fail, inside the case whose subject is checks that cannot fail.
- **Fix:** replaced with a property of the ANSWERS — every reach predicate except I1's must be strictly between zero and the cell count, so a predicate constant over the corpus is rejected. I1 is total on purpose and says so.
- **Files modified:** `scripts/section-locator-oracle.test.ts`
- **Committed in:** `b3b3368`

**6. [Rule 1 - Bug] An existing oracle assertion became FALSE for the right reason, and had to be restated rather than preserved**

- **Found during:** Task 2, first run of the grown corpus
- **Issue:** `no UNFENCED cell may fail a fence-blindness probe` failed. It was correct when a cell's candidate was its only occurrence; the duplicate axis finally generates WR-01's real shape — an unfenced candidate preceded by a fenced quotation of the same heading — which the fence-blind scan rightly fails.
- **Fix:** restated as a property of the OCCURRENCES (every failing cell carries a fenced occurrence of its heading), with both arms asserted non-empty (720 + 2880 = 3600) and the unfenced-candidate arm attributed to the duplicate axis by label.
- **Files modified:** `scripts/section-locator-oracle.test.ts`
- **Committed in:** `b3b3368`

**7. [Rule 3 - Blocking] `importedSymbols` had to be refactored to reach modules outside `scripts/`**

- **Found during:** Task 2 of the plan's scope decision (the consumer half of V-29-26-02)
- **Issue:** `importedSymbols` resolved against `scripts/` and matched only a `./`-prefixed specifier, so a consumer in `hooks/` or `scripts/runnable-ref/` was invisible to every scan built on it.
- **Fix:** `importedSymbolsAt` takes a repository-relative path and a `[./]`-anchored specifier (which still refuses `./canonical-frontmatter.js` for `frontmatter`); `importedSymbols` DELEGATES to it rather than carrying a second copy, and a case compares the two over all 41 × 3 module/specifier pairs with a non-vacuity floor.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Committed in:** `dcaf1a7`

---

**Total deviations:** 7 auto-fixed (3 missing-critical closures, 3 bugs in my own harness, 1 blocking refactor).
**Impact on plan:** Deviations 1, 2 and 3 are the ones that matter. Deviation 1 means the plan's specified fix could not have satisfied the plan's own acceptance criterion. Deviations 2 and 3 are the sixth and seventh consecutive plans in this round where attacking the delivered fix found another bypass of the same class one step sideways — and this time it took **two** rounds, because closing three shapes exposed three more in a hand-maintained set that had already rotted. Deviations 4, 5 and 6 are all inside my own verification harness, which is the record this phase keeps for a reason.

## Issues Encountered

- No auth gates, no package installs, no architectural decisions, no checkpoints (the plan declares `autonomous: true` and every task is `type="auto"`).
- `npm test` was never run: this repository's `test` script triggers the live claude-CLI e2e lane. Every suite run used `npx vitest run --exclude '**/scripts/e2e/**'`.

## Known Stubs

None. Every new assertion in Tasks 1 and 2 was seen failing against a build where the property does not hold — five for Task 1's arms, three more for round one's evasions, three for round two's, four for Task 2's re-derived numbers. **Two exceptions are disclosed rather than presented as REDs:** the floor-item-1 derivation and the recursive-module-set case in Task 1 passed on their first run because they are new MEASUREMENTS rather than fixes; and Task 3 ships no behaviour change, so its planted multi-line pair is unreported both before and after — that is stated plainly above instead of dressed as a pre/post reproduction.

## Recorded Residuals (not closed, by name and with live counts)

| id | what | direction | live count |
|---|---|---|---|
| **V-29-29-01** | `sectionBody` in `generate-catalog.ts:87` and `generate-role-adapters.ts:127` answers the section-extent question through a `new RegExp` lookahead, fence-blind. **A LANG-07 failure, ESCALATED, not accepted.** | fail-open: a `## ` quoted inside a fenced example truncates a section body | **2**, both addresses pinned two-sided |
| V-29-29-02 | floor item 6's residue — a bound carried out of its block by a BOOLEAN flag or a closure-captured mutable, or a terminator further than `TERMINATOR_WINDOW` | scope claim | not counted (needs data-flow analysis); `TERMINATOR_WINDOW` re-measured as answer-independent at 4, 6, 10 and 20 |
| V-29-29-03 | floor item 3's residue — a bound expressed through a HELPER the scan does not follow | scope claim | not counted (needs a call graph) |
| V-29-29-04 | the duplicate-assertion tripwire cannot see a duplicated MULTI-LINE `expect(` | disclosed miss, asserted as an intended verdict | **1069 of 5281** classified lines (20.2%) carry a multi-line statement |
| V-29-29-05 | round 3's review published 453 multi-line openers under a rule it did not publish; the reconstructed subject-only rule answers 473 on the same bytes | a difference between two rules, not a defect | 4% gap; three of the review's four figures reproduce exactly |
| V-29-26-02 | **CLOSED for this block** — the owner and consumer scans are now recursive and repository-rooted | — | 49 modules, compared against `git ls-files` |

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. Every `critical` and `high` row is dispositioned `mitigate` and landed: T-29-29-01, -02, -03 and -07 in `dcaf1a7`; T-29-29-04 and -05 in `b3b3368`; T-29-29-06 in `37020aa`. `T-29-29-SC` (package installs) remains an empty input set — this plan installs nothing, per the zero-runtime-dependency constraint.

## Next Phase Readiness

- **LANG-07's four enumerated `missing:` items all map to landed artifacts** (items 1 and 2 to plan 29-28, items 3 and 4 here). Whether the truth now HOLDS is for verification to decide — and this SUMMARY hands verification a reason to say no: **V-29-29-01 is a measured, pinned, fence-blind third grammar in two generators**, escalated rather than absorbed.
- **A note for any later plan touching the owner classifier:** the arms are now six notches stricter than round 3's and the owner set is still one. Any widening must be asserted in BOTH directions, and `trace-render.ts` / `validate-agent-factory.ts` are the two live exclusions to test against.
- **A note for any later plan adding a locator consumer:** three pins now move in two files — `CONTRACT_CONSUMERS` / `CONTRACT_SITE_COUNT` in `frontmatter.test.ts`, and `LOCATOR_CONSUMERS` / `LOCATOR_CONSUMER_COUNT` in `check-foundation-guards.test.ts` (now spelled as repository-relative paths). They answer different questions and must not be merged.
- **A note for any later plan touching the oracle:** every invariant carries a REACH count pinned as an equality. Adding an axis moves seven numbers, and the case that reproduces round 3's sub-corpus is the one that stops the gap being restored quietly.
- **Carried forward for the round's own record:** three harness-premise failures inside one plan — a directory walk that read a build scratch tree and reported forty-eight phantom findings, a non-vacuity check that could not fail, and an existing assertion that became false for the right reason and would have been "fixed" by narrowing the corpus. All three were caught by asserting a premise rather than reading a result.

## Self-Check: PASSED

All three modified files exist on disk (`scripts/check-foundation-guards.test.ts`, `scripts/section-locator-oracle.test.ts`, `docs/audit/29-locator-unification.md`). All three task commits (`dcaf1a7`, `b3b3368`, `37020aa`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
</content>
</invoke>
