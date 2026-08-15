---
phase: 29-controlled-language-voice-guard-rebuild
plan: 31
subsystem: testing
tags: [typescript, controlled-language, writing-profile, claim-width, residual-tripwire, gap-closure]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "frontmatter.ts's fencedLineFlags and sectionEndIndex — the ONE fence toggle and the ONE section locator (plans 29-20/29-24, D-24); vacuity.ts's reportMeasured (plan 29-01, AP-1/D-08)"
provides:
  - "WP-11 and WP-04 are published at exactly the heading spelling the gate decides, so the rule the kit publishes and the rule the gate enforces have the same extension"
  - "STEPS_SECTION_REMEDY — WP-11's second sentence held as a constant, so the refusal emits the WHOLE rule and spells no half inline"
  - "a four-member two-artifact pin (rule and remedy, gate and profile) with a four-mutation falsifiability probe, each arm seen failing"
  - "tallyStepsHeadings — steps headings counted by ATX level over the governed corpus by three independent fence-aware patterns, published, reconciled against the section-extent loop, and refused by name above zero"
  - "runScratchGate in the harness — a mutation lever for refusals that are unreachable on a healthy tree, with its own ran-at-all premise"
affects: [29-32, controlled-language-guards, writing-profile]

actuals:
  tokens: 71811
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A disclosed floor carries a TALLY, not a paragraph: the size of what a rule does not decide is published on every run and refused above zero, so the shape becomes a red the first time somebody writes it"
    - "Three independent patterns and an asserted sum, never two counts and a subtraction — a tally derived from the loop it audits can only ever agree with itself"
    - "A cross-artifact pin is asserted per SENTENCE, not per concatenation, so a red names WHICH half drifted"
    - "A scratch-build probe asserts that the scratch build RAN (macOS /var -> /private/var breaks the ESM entry-point guard and yields exit 0 with empty output)"

key-files:
  created: []
  modified:
    - agent-factory/writing-profile.md
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.test.ts
    - docs/audit/28-claim-registry.md

key-decisions:
  - "NARROW the published rule rather than widen STEPS_HEADING: widening makes the heading level and the SECTION-END level disagree, so a sub-level steps section would silently adopt its siblings' bullets — a genuine widening needs the shared locator's level parameter too, four gates at once, and belongs in its own plan"
  - "WP-04 carried the SAME level-agnostic anchor phrase one row above WP-11 and is narrowed with it — the set was DERIVED from the document rather than taken from the review's enumeration"
  - "The remaining floor gets a MECHANISM, not a note: both tallies are published and the undecided one is refused by name with the file, the line and the remedy, and the refusal states that deleting the tally is not the remedy"
  - "The three new premises are unreachable on a healthy tree, so a permanent scratch-build case forces each to refuse once — an unobserved check is indistinguishable from one that cannot fire"
  - "The scratch-build harness asserts its OWN premise after its first draft returned a green control and a green mutation from a build that never ran"

patterns-established:
  - "Ask which SET a predicate ENUMERATES and which set the PROSE beside it names. WP-11's prose named every ATX level; `stepsFiles` enumerated one. The gap was the whole finding, and it was invisible because the live input set for the difference was empty."
  - "When a rule row is narrowed, derive every OTHER row carrying the same phrase before editing. WP-04 was not in the review and had the identical defect."

requirements-completed: [LANG-04]

coverage:
  - id: D1
    description: "WP-11 is published at the spelling the gate decides, in BOTH sentences, and WP-04 with it; the rule the profile publishes and the rule the gate enforces have the same extension"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "grep -a '^| `WP-11`' agent-factory/writing-profile.md | grep -ac 'not a steps heading' -> 0; two `## Steps` occurrences in the row"
        status: pass
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts#WR-04: a prose-only `## Steps` section is RED, and the refusal names the RULE — the same sentence the writing profile publishes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both sentences of WP-11 are pinned in both artifacts, each with its own named failure, and each of the four drift routes has been demonstrated to red"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts#WR-05: the two-artifact pin FAILS on each of the four ways WP-11 can drift, and names which half moved"
        status: pass
      - kind: other
        ref: "the four forced-failure transcripts below — one per (artifact x sentence) cell"
        status: pass
    human_judgment: false
  - id: D3
    description: "A prose-only `### Steps` section is NOT a WP-11 finding (the intended verdict under the narrowing) AND moves the undecided tally by one; a `# Steps` section is covered by the same tally"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "scripts/check-imperative-lexicon.test.ts#a prose-only `### Steps` section is NOT a WP-11 finding — the INTENDED verdict — and moves the undecided tally by one"
        status: pass
      - kind: integration
        ref: "scripts/check-imperative-lexicon.test.ts#a prose-only `# Steps` section is covered by the SAME tally — the floor is every undecided spelling, not the one the review named"
        status: pass
    human_judgment: false
  - id: D4
    description: "The tripwire cannot be tripped by documentation: a `## Steps` heading inside a fence moves NEITHER tally, mutation-proven against the identical document with the delimiters removed"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "scripts/check-imperative-lexicon.test.ts#a `## Steps` heading written INSIDE A FENCE moves NEITHER tally — the tripwire cannot be tripped by documentation"
        status: pass
      - kind: other
        ref: "the fenced/unfenced mutation table below — 19/0/19 against 20/1/21 on bytes differing only in the delimiters"
        status: pass
    human_judgment: false
  - id: D5
    description: "The live tree's undecided tally is pinned two-sided and proven able to red; the three new premises are each seen refusing on a scratch build"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "scripts/check-imperative-lexicon.test.ts#the LIVE tree's undecided tally is pinned two-sided, and the pin is proven able to red by a planted member"
        status: pass
      - kind: integration
        ref: "scripts/check-imperative-lexicon.test.ts#the tally's three premises are PROVEN able to refuse — a premise never seen failing is a comment"
        status: pass
      - kind: other
        ref: "the pre/post adversarial reproduction below — the same planted corpus, exit 0 and unnamed under the pre-plan build, exit 1 and named under this one"
        status: pass
    human_judgment: false
  - id: D6
    description: "No registry row anchors on the changed rule text, so D-04's same-commit companion edit has no target — established by derivation rather than by eye"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "the anchor-region derivation below (each anchor's span computed from the registry's own verbatim line count) plus check-claim-anchors exit 0"
        status: pass
    human_judgment: true
    rationale: "Whether an absent companion edit is the right outcome, rather than a missed one, is a judgment about the registry's coverage. The derivation is mechanical; the conclusion that D-04 therefore needs nothing is recorded for a human to disagree with."

duration: 82min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 31: WP-11 published at the spelling the gate decides, with its floor measured

**The kit published `WP-11` for every ATX level and `guard_imperative_lexicon` decided one, so a prose-only `### Steps` section broke the published rule and passed the gate in silence; the rule is now narrowed to the decided spelling in both sentences, both sentences are pinned in both artifacts against four proven drift routes, and the spellings the narrowing leaves undecided are counted, published and refused by name above zero.**

## Performance

- **Duration:** 82 min
- **Started:** 2026-08-15T21:46:00Z
- **Completed:** 2026-08-15T23:08:00Z
- **Tasks:** 3
- **Files modified:** 3 (+ the committed `.js`); `docs/audit/28-claim-registry.md` needed no companion edit — see Task 1

## Accomplishments

- **The published rule and the enforced rule now have the same extension.** `WP-11`'s row names `## Steps` in both sentences; the remedy half adopts the gate's spelling verbatim with a terminating period, so the two artifacts are byte-identical rather than merely equivalent.
- **`WP-04` was found carrying the identical defect one row up and narrowed with it.** It was not in the review. The set was derived from the document.
- **The remedy sentence is a constant.** The refusal emits `STEPS_SECTION_RULE` and `STEPS_SECTION_REMEDY` and spells neither inline — an inline remedy is exactly how the two halves drifted apart while the half held by a constant stayed pinned.
- **The two-artifact pin is now as wide as the sentence claiming it.** Four independent members, four distinct messages, four mutations, an unmutated control, and a premise per mutation that it changed a byte.
- **The disclosed floor became a mechanism.** Both tallies are published on every run; `undecided > 0` refuses by name with file, line and remedy; `any === 0` refuses as vacuous; and the tally is reconciled against the section-extent loop it sits beside.
- **The bypass is reproduced and closed on the same bytes.** Pre-plan build: exit 0, `ALL CHECKS PASSED`, the planted file never named. This build: exit 1, the file and line named, the tally moved 0 -> 1.

## Task Commits

1. **Task 1: the published rule is narrowed to the spelling the gate decides** — `2c81b5d` (fix)
2. **Task 2: the whole rule is pinned in both artifacts, proven able to fail on either half** — `2c95850` (test)
3. **Task 3: the disclosed floor gets a mechanism** — `86feb67` (feat)

## Files Created/Modified

- `agent-factory/writing-profile.md` — the `WP-11` and `WP-04` rows narrowed; the adjacency-rule prose and the `WP-11` rationale section brought to the same spelling; a new rationale subsection recording the narrowing, its reason, the live measurement with its command, the remaining floor with its direction, and the deferred widening with its cost
- `scripts/check-imperative-lexicon.ts` — `STEPS_SECTION_RULE` narrowed, `STEPS_SECTION_REMEDY` added, the refusal rewritten to emit both; `STEPS_HEADING_ANY_LEVEL` and `STEPS_HEADING_UNDECIDED_LEVEL`; `tallyStepsHeadings`; the published tally line and its four refusals
- `scripts/check-imperative-lexicon.test.ts` — the four-member pin and its four-mutation probe; `runScratchGate`; six new `WR-05` cases
- `docs/audit/28-claim-registry.md` — **unchanged, by derivation.** See Task 1.

---

## Task 1 — LANG-04's three enumerated `missing:` items, traced to landed artifacts

| # | `missing:` item (verbatim from `29-VERIFICATION.md`) | landed artifact | the case that pins it |
|---|---|---|---|
| 1 | "Choose one and record it: narrow the published rule to the spelling the gate decides (`## Steps`), or widen STEPS_HEADING to the level class and re-measure the governed corpus" | NARROWED. `writing-profile.md` § *The heading spelling `WP-11` and `WP-04` decide, and the floor beneath it* records the choice, the reason, the live measurement with its command, and the deferred widening with its cost. The same argument is recorded at `check-imperative-lexicon.ts`'s rule-constant declaration | `check-imperative-lexicon.test.ts` — "WR-04: a prose-only `## Steps` section is RED …" (the decided arm) and "a prose-only `### Steps` section is NOT a WP-11 finding — the INTENDED verdict" (the narrowed-out arm) |
| 2 | "Pin the WHOLE rule text — both sentences — in both artifacts, or delete the second sentence from one of them so the pinned string is the entire rule" | BOTH SENTENCES PINNED. `wp11Pin()` returns four members: rule and remedy, gate and profile, each with its own message | "WR-04 …" (asserts all four hold) + "WR-05: the two-artifact pin FAILS on each of the four ways WP-11 can drift, and names which half moved" |
| 3 | "Add a case for the currently-invisible spelling (a prose-only `### Steps` section) asserting the INTENDED verdict, so the decision above is held by a test rather than by prose" | `tallyStepsHeadings` + the refusal at the undecided level | the `### Steps` case, the `# Steps` case, the fenced control, the live two-sided pin with its planted-member probe, and the scratch-build premise case |

No item dropped.

## Task 1 — the corpus measurement, produced in this session

Every number in the profile's new subsection comes from this command, run here rather than transcribed from the plan or from round 3's report:

```
$ node -e 'const fs=require("fs");
  Promise.all([import("./scripts/check-imperative-lexicon.js"), import("./scripts/frontmatter.js")]).then(([m,fm])=>{
  const corpus=m.governedCorpus(); let any=0, decided=0, undecided=0, sites=[];
  for (const f of corpus){ const t=fs.readFileSync(f,"utf8"); const flags=fm.fencedLineFlags(t); const lines=t.split("\n");
    lines.forEach((l,i)=>{ if(flags[i]) return;
      if(/^#{1,6} Steps\s*$/.test(l)) any++;
      if(/^## Steps\s*$/.test(l)) decided++;
      if(/^(?:#|#{3,6}) Steps\s*$/.test(l)) { undecided++; sites.push(f+":"+(i+1)); } }); }
  console.log({corpusFiles:corpus.length, any, decided, undecided, sites}); });'

{ corpusFiles: 47, any: 19, decided: 19, undecided: 0, sites: [] }
```

Nineteen steps headings, all at level two, none anywhere else. **The narrowing moved no byte in the governed corpus.** It removed a promise nothing kept.

## Task 1 — acceptance greps

```
$ grep -a '^| `WP-11`' agent-factory/writing-profile.md | grep -ac 'not a steps heading'
0
$ grep -a '^| `WP-11`' agent-factory/writing-profile.md | grep -ao 'Steps' | wc -l
       2
$ grep -a -v '^\s*[/*]' scripts/check-imperative-lexicon.ts | grep -ac 'move the explanatory paragraphs under a heading'
1
$ grep -a -v '^\s*[/*]' scripts/check-imperative-lexicon.ts | grep -an 'move the explanatory paragraphs under a heading'
723:  "Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`.";
```

The remedy is spelled once in the comment-stripped source — at the constant's declaration and nowhere else.

The gate's own PASS line, with its denominator intact (D-08):

```
  PASS  imperative lexicon — governed file(s) carrying a `## Steps` section: 0 findings over 19/19 elements
```

## Task 1 — the D-04 companion edit, established by derivation

The registry row question was answered mechanically rather than by reading line numbers. Each anchor's span is computed from the registry's OWN verbatim line count, and the two rule rows are tested against those spans:

```
$ node -e '… readRegistry(process.cwd()) … compute each `<!-- claim: … -->` span from its row.verbatim line count …'

anchor regions in the profile (1-based, inclusive):
   C-28-041 32-37
   C-28-040 159-161
   C-28-039 223-229
   C-28-042 240-244
WP-11 row at line 54 -> anchored by: NONE
WP-04 row at line 47 -> anchored by: NONE
registry rows whose VERBATIM mentions WP-11 or a steps heading: NONE
```

**No registry row anchors on either changed row**, so D-04's same-commit companion edit has no target and `docs/audit/28-claim-registry.md` is deliberately unchanged. `node scripts/check-claim-anchors.js` exits **0** and reports `42 verbatim comparison(s) performed, all byte-identical`, which is the bijection gate agreeing.

`node scripts/check-diff-disposition.js` exits **0** and needs no disposition row for this edit: its watched corpus is the 40 markdown members of the LANG-03 safety-surface union (17 roles + 19 workflows + 4 public documents), and `agent-factory/writing-profile.md` is not a member — verified in this session with `safetySurfaceUnion().map(x => x.file).includes("agent-factory/writing-profile.md") -> false`. The corpus was not narrowed to clear anything.

---

## Task 2 — the RED-first transcript: the remedy halves disagreed, derived from the PRE-plan artifacts alone

This is derived from the pre-plan bytes with **no literal from this plan**. The gate's published rule is split at its own sentence boundary and each half is looked for in the pre-plan profile's `WP-11` row:

```
$ git archive 8b76cb6 | tar -x -C $SP/plant-prose-pre     # one governed workflow made prose-only
$ CHECK_ROOT=$SP/plant-prose-pre node $SP/pre-mirror/scripts/check-imperative-lexicon.js
exit=1
  FAIL  the step-heading file set and the bullet-bearing file set are not equal … THE RULE IS WP-11: A steps section carries at least one list item. Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`

GATE rule   : "A steps section carries at least one list item."
GATE remedy : "Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`"
PROFILE row : "| `WP-11` | A steps section carries at least one list item. Write the procedure as list items, or move the explanatory paragraphs under a heading that is not a steps heading. | decidable |"

profile row carries the GATE rule sentence   -> true
profile row carries the GATE remedy sentence -> false
```

**The half that was pinned matched; the half that was not did not.** That is WR-05's second finding in two booleans. The same derivation on this build:

```
GATE rule   : "A `## Steps` section carries at least one list item."
GATE remedy : "Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`."
profile row carries the GATE rule sentence   -> true
profile row carries the GATE remedy sentence -> true
```

Ordering note, recorded rather than glossed: Task 1 landed before this transcript was taken, so the RED was produced on a hermetic mirror of the pre-plan commit rather than by leaving the live tree red. The live tree was never in a state where the assertion was false.

## Task 2 — the four assertions, each FORCED to fail once

Each of the four members was forced by mutating only the input it reads, one at a time. Verbatim:

```
########## WP11_FORCE=gate/rule ##########
AssertionError: the GATE's refusal does not carry WP-11's RULE sentence: A `## Steps` section carries at least one list item.: expected false to be true

########## WP11_FORCE=gate/remedy ##########
AssertionError: the GATE's refusal does not carry WP-11's REMEDY sentence: Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`.: expected false to be true

########## WP11_FORCE=profile/rule ##########
AssertionError: the PROFILE's WP-11 row does not carry WP-11's RULE sentence: A `## Steps` section carries at least one list item.: expected false to be true

########## WP11_FORCE=profile/remedy ##########
AssertionError: the PROFILE's WP-11 row does not carry WP-11's REMEDY sentence: Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`.: expected false to be true
```

Four distinct messages, each naming the artifact and the sentence. The `WP11_FORCE` hook was a temporary development lever and is **not** in the committed file (`grep -ac 'WP11_FORCE' scripts/check-imperative-lexicon.test.ts` -> 0). The permanent equivalent is the four-mutation probe, which asserts the broken member's message names the artifact and the sentence — so all four messages stay exercised on every run.

## Task 2 — the claim, and the assertion that holds it

| what the case's comment CLAIMS | the assertion that holds it |
|---|---|
| "BOTH sentences of `WP-11` — the rule and its remedy — appear in the gate's refusal" | `wp11Pin()` members `gate/rule` and `gate/remedy`, asserted in the WR-04 case |
| "…AND in the profile's rule ROW" | members `profile/rule` and `profile/remedy`, scoped to the row via `wp11Row()`, not to the document |
| "as four independent assertions with four distinct messages" | the `for (const member of wp11Pin(...))` loop — one `expect` per member, each with `member.message` |
| "A reword of EITHER sentence in EITHER artifact fails exactly one of them and names which" | the probe's `expect(wp11Broken(m.gate, m.row)).toEqual([m.expect])` — exactly one key, per arm |
| "…and names which half moved" | the probe's two message assertions: the broken member's message must contain `GATE's refusal`/`PROFILE's WP-11 row` and the sentence itself |
| "all four are demonstrated to red by the four-mutation probe below rather than inferred from two" | four `mutations` entries, each with a forced premise that the mutation changed a byte, plus the unmutated control asserting `wp11Broken(...) === []` |

The comment claims nothing the table cannot answer. The previous claim was **deleted**, not amended.

```
$ grep -ac 'STEPS_SECTION_RULE' scripts/check-imperative-lexicon.test.ts
0
```

No literal is imported from the module under test; both sentences are written as literals in the case, for the reason recorded at `check-imperative-lexicon.ts:1258-1266`.

---

## Task 3 — ADVERSARIAL SELF-REPRODUCTION: the same planted corpus, pre and post

The plant is a prose-only steps section at level three appended to one governed workflow. **Both builds are pointed at the SAME directory**, so no corpus difference can explain the transition.

```
$ git archive 8b76cb6 | tar -x -C $SP/plant-pre
$ node -e '… append "\n## Notes\n\n### Steps\n\nProse sits here where a step bullet belongs.\n" …' $SP/plant-pre

--- PRE (build 8b76cb6, the tree before this plan) ---
$ CHECK_ROOT=$SP/plant-pre node $SP/pre-mirror/scripts/check-imperative-lexicon.js
exit=0
ALL CHECKS PASSED
$ grep -ac "01-bootstrap-brownfield" $SP/pre-3.txt   -> 0
$ grep -ac "WP-11"                   $SP/pre-3.txt   -> 0

--- POST (this build, the SAME planted corpus) ---
$ CHECK_ROOT=$SP/plant-pre node scripts/check-imperative-lexicon.js
exit=1
        steps headings by ATX level: 19 at the decided `## Steps` level, 1 at any other level, 20 seen in total — WP-11 and WP-04 are decided for the level-two spelling only, and the undecided count is refused above zero rather than recorded
  FAIL  1 steps heading(s) in the governed corpus sit at an ATX level WP-11 does not decide — the profile publishes the rule for `## Steps` and this gate anchors on that spelling, so the section(s) below are governed by nothing. Spell the heading at the decided level, or widen the published rule AND the shared section locator's level parameter together in a plan of their own — a widened anchor alone makes the heading level and the SECTION-END level disagree, and a sub-level steps section would silently adopt its siblings' bullets. Deleting this tally is not the remedy
        agent-factory/workflows/01-bootstrap-brownfield.md:53 `### Steps`
  PASS  imperative lexicon — governed file(s) carrying a `## Steps` section: 0 findings over 19/19 elements
```

Note the last line: the `WP-11` arm still PASSES. That is the **intended** verdict under the narrowing — the section is outside `WP-11`, and it is the FLOOR that refuses it. A residual that is documented and one that is closed differ by exactly this transition.

## Task 3 — the two tallies are two expressions, not a count and a subtraction

| number | the expression that produces it |
|---|---|
| `any` | `STEPS_HEADING_ANY_LEVEL = /^#{1,6} Steps\s*$/` tested per unfenced line in `tallyStepsHeadings` |
| `decided` | `STEPS_HEADING = /^## Steps\s*$/` — the gate's own anchor pattern, tested in the SAME loop over the SAME lines |
| `undecided` | `STEPS_HEADING_UNDECIDED_LEVEL = /^(?:#|#{3,6}) Steps\s*$/` — written independently, matching level one and levels three to six |
| `anchors` | the `stepsRanges` loop's own `stepsHeadings.anchors += 1`, in a DIFFERENT loop that shares no state with the tally |

`any === decided + undecided` is a **checked premise**, not a definition, and `decided === anchors` is a second, independent cross-check between two walks. No subtraction appears anywhere.

## Task 3 — the fence boundary, mutation-proven

Two mirrors whose governed bytes differ only in the presence of the fence delimiters:

```
--- fenced (the block wrapped in ```md … ```) ---
        steps headings by ATX level: 19 at the decided `## Steps` level, 0 at any other level, 19 seen in total
--- unfenced (the SAME lines, delimiters removed) ---
        steps headings by ATX level: 20 at the decided `## Steps` level, 1 at any other level, 21 seen in total
--- unplanted baseline ---
        steps headings by ATX level: 19 at the decided `## Steps` level, 0 at any other level, 19 seen in total
```

The fenced plant is byte-for-byte identical to the baseline in both tallies; removing the delimiters moves both. The permanent case asserts the fenced side; this is its discrimination proof.

## Task 3 — the three new premises, each SEEN refusing

Scratch builds of the committed `.js` (the 29-27 precedent — a scratch revert, never a git checkout), with `CHECK_ROOT` pointed at the real tree:

```
=== CONTROL: an unmutated scratch build ===
ALL CHECKS PASSED

=== premise 1 (reconcile) + 3 (vacuity): the ANY pattern matches nothing ===
  FAIL  the steps-heading tallies do not reconcile: 0 at any level, but 19 decided + 0 undecided = 19. The three patterns are written independently so this sum is a CHECK and not a definition — a mismatch means one pattern admits a line another refuses, and the undecided count cannot be read as a floor until they agree
  FAIL  the steps-heading tally saw ZERO steps headings across 47 governed document(s) — refusing to publish a level floor over a walk that reached nothing, because an empty scan reports the same zero undecided headings as a conforming corpus

=== premise 2 (two independent walks disagree): the anchor counter stops incrementing ===
  FAIL  the steps-heading tally counted 19 decided-level heading(s) while the section-extent loop anchored on 0 — two independent walks over the same lines disagree, so neither the WP-11 denominator nor the level floor below covers what it claims
```

All three are permanent cases now (`runScratchGate`), so they stay observed rather than assumed.

---

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the lexicon gate | `node scripts/check-imperative-lexicon.js` | exit **0**, `ALL CHECKS PASSED`, both tallies published |
| claim anchors | `node scripts/check-claim-anchors.js` | exit **0** — 42 verbatim comparisons, all byte-identical |
| audit register | `node scripts/check-audit-register.js` | exit **0** |
| diff disposition | `node scripts/check-diff-disposition.js` | exit **0** |
| banned claims | `node scripts/check-banned-claims.js` | exit **0** |
| foundation guards | `node scripts/check-foundation-guards.js` | exit **0** |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0** — the counting greps above are trustworthy |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1924 passed / 2 skipped across 52 files** (baseline 1917 / 2 / 52 — **+7**, no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; every plant was on a mirror. Only the pre-existing `human-notes.txt`, `.gsd/` and `.planning/phases/29.1-…` |

Suite delta accounting: Task 2 **+1** (the four-mutation probe); Task 3 **+6** (baseline control, `### Steps`, `# Steps`, fenced control, live two-sided pin, scratch-build premises). 1917 + 7 = **1924**.

## Decisions Made

1. **Narrow, do not widen.** Recorded in both artifacts with its cost, so a later phase reads a deferral rather than an omission. Widening needs `sectionEndIndex`'s level parameter widened with it or the heading level and the section-end level disagree; that changes four gates and needs its own corpus measurement.
2. **`WP-04` is narrowed with `WP-11`.** Deriving the set of rows carrying the level-agnostic phrase, rather than taking the review's enumeration, found a second decidable row with the identical defect. The narrowed sentence adds no claim: it says a bullet under `## Steps` is procedural, which the gate does, and asserts nothing about the converse (an ordered marker is procedural anywhere, and that direction is fail-closed and out of scope here).
3. **The two-artifact pin is per sentence, never a concatenation.** A concatenation cannot say which half drifted, and this round has charged exactly that against other reproductions.
4. **The floor gets a tally, and the refusal names the remedy.** Without the remedy sentence the cheapest route back to green is deleting the tally, which is how a residual becomes invisible a second time.
5. **The scratch-build harness asserts its own premise.** Recorded because it caught a live false green in this plan — see Deviation 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 1's second acceptance grep is unsatisfiable as written**

- **Found during:** Task 1 (acceptance)
- **Issue:** The plan requires `grep -a '^| \`WP-11\`' agent-factory/writing-profile.md | grep -ac 'Steps'` to be "at least 2". `grep -c` counts matching LINES and the input is a single line, so the command can never exceed 1 regardless of the row's content.
- **Fix:** The intent — the row names the decided spelling in both sentences — is checked with an occurrence count, `grep -ao 'Steps' | wc -l`, which returns **2**. Both commands are pasted above so the substitution is visible rather than silent. The complementary criterion (`'not a steps heading'` -> 0) is unaffected and is satisfied as written.
- **Files modified:** none (evidence, not code)
- **Committed in:** `2c81b5d`

**2. [Rule 2 - Missing Critical] `WP-04` carried the same level-agnostic phrase and was not in the plan**

- **Found during:** Task 1 (deriving the set of affected rows before editing)
- **Issue:** `grep -an 'steps heading\|steps section' agent-factory/writing-profile.md` returns the `WP-04` row alongside `WP-11`. `WP-04` is also marked `decidable` and its anchor is also `STEPS_HEADING`, so it published the same promise for `# Steps` and `### Steps` that no gate keeps. Fixing only the row the review named would have left the identical defect one line up — the shape this phase's own record calls out ("the fix for a three-site finding missed a fourth site nobody had derived").
- **Fix:** `WP-04`'s second sentence and the adjacency-rule prose that restates it are narrowed to `## Steps`. The rationale subsection names both rules. The gate's refusal message names both.
- **Files modified:** `agent-factory/writing-profile.md`
- **Verification:** `node scripts/check-imperative-lexicon.js` exit 0; `check-banned-claims`, `check-claim-anchors`, `check-diff-disposition` all exit 0
- **Committed in:** `2c81b5d`

**3. [Rule 1 - Bug] The first draft of the scratch-build probe returned a FALSE GREEN**

- **Found during:** Task 3 (the premise case)
- **Issue:** `runScratchGate` copied `scripts/*.js` into an OS temp dir and spawned the copy. On macOS `mkdtempSync(tmpdir())` yields a `/var/folders/…` path, a symlink to `/private/var/folders/…`. The gate runs `runAll()` only when `import.meta.url === pathToFileURL(process.argv[1]).href`; the ESM loader reports the real path while `argv[1]` keeps the symlinked one, so the guard was false, the module loaded, ran **nothing**, and exited **0** with **empty output**. Both the control (`expect(status).toBe(0)`) and — silently — every mutation arm were being satisfied by a build that never ran.
- **Fix:** the spawned path is `realpathSync`'d, and `runScratchGate` now THROWS by name if the output does not contain the guard banner. A run that produced nothing cannot be evidence for or against anything, and it is indistinguishable from a passing gate by exit code alone.
- **Files modified:** `scripts/check-imperative-lexicon.test.ts`
- **Verification:** the three premise refusals are now observed with their messages (transcript above); the control passes with real output
- **Committed in:** `86feb67`

**4. [Rule 1 - Bug] The existing one-sentence pin anchored on the sentence Task 1 changed**

- **Found during:** Task 1 (first suite run after the profile edit)
- **Issue:** `STEPS_RULE_SENTENCE` in the harness held the pre-narrowing first sentence, so Task 1's commit would have left the suite red between two commits.
- **Fix:** the constant moved in the SAME commit as the text it anchors on — D-04's rule applied to a test pin rather than to a registry row. Task 2 then widened the pin from that one sentence to four members. The intermediate red is pasted below rather than hidden, because it is the pin doing its job.

```
 FAIL  scripts/check-imperative-lexicon.test.ts > WR-04 …
AssertionError: expected '\n[guard_imperative_lexicon] every `#…' to contain 'A steps section carries at least one …'
```

- **Files modified:** `scripts/check-imperative-lexicon.test.ts`
- **Committed in:** `2c81b5d`

---

**Total deviations:** 4 auto-fixed (2 bugs in evidence/harness, 1 missing-critical sibling row, 1 same-commit companion edit)
**Impact on plan:** Deviation 3 is the one worth carrying forward. **A probe that spawns a build must assert the build RAN.** An exit code of 0 from a process that executed no code is indistinguishable, at the assertion, from a passing gate — and this round's own record already lists six instances of a verification harness producing a false result. It produced a seventh here, and only a premise on the harness's own output caught it.

## Issues Encountered

- No auth gates, no package installs, no architectural decisions.
- The `WP11_FORCE` environment hook used to capture the four forced failures was a temporary development lever, removed before the Task 2 commit (`grep -ac 'WP11_FORCE'` -> 0).

## Known Stubs

None. No hardcoded empty values, placeholder text or unwired components were introduced. Every new assertion has been seen failing against an input where the property does not hold.

## Residuals carried forward

| residual | direction | live input set, measured here | mechanism |
|---|---|---|---|
| A steps heading at an ATX level other than two is not decided by `WP-11`/`WP-04` | fail-open by construction (the rule does not reach it) | **0** in the governed corpus | **CLOSED as a silence.** The tally publishes the count and refuses above zero with the file, the line and the remedy |
| A **setext** steps heading (`Steps` over a `---` rule) is invisible to the tally, exactly as it is to `unfencedHeadingIndex`, `sectionEndIndex` and the caveman reader (V-29-26-01) | fail-open | **0** setext level-two headings in the safety-surface corpus (re-measured at plan 29-27) | Recorded at the declaration as the shared authority's disclosed ATX floor. Deliberately not repaired from this module: it is a tree-wide change to the shared locator |
| An **indented** steps heading (one to three leading spaces) is outside the column-zero anchor | fail-open | not separately measured here; `STEPS_HEADING` had the identical bound before this plan, so the tally inherits its scope exactly and widens nothing | Inherited, unchanged, and stated at the declaration |

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched; no new network endpoint, auth path, file-access pattern or trust-boundary schema was introduced. `T-29-31-SC` (package installs) remains an empty input set — this plan installs nothing. `T-29-31-05` (a registry row left disagreeing) resolved to an empty input set by derivation, recorded above rather than assumed.

## Next Phase Readiness

- **LANG-04's three enumerated `missing:` items are each held by an artifact and a case**, mapped in the table above.
- **A note for 29-32 and anything else that spawns a built gate:** `runScratchGate` in `check-imperative-lexicon.test.ts` is the mutation lever, and its ran-at-all premise is not optional on macOS. Copy the premise, not just the spawn.
- **A note for whoever widens the heading level later:** the deferral is recorded in two places with the same argument — `writing-profile.md` § *The heading spelling …* and the rule-constant declaration in `check-imperative-lexicon.ts`. The widening needs `sectionEndIndex`'s level parameter moved with the anchor, four gates re-measured, and the tally above re-baselined.

## Self-Check: PASSED

All three modified source files exist on disk. All three task commits (`2c81b5d`, `2c95850`, `86feb67`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
