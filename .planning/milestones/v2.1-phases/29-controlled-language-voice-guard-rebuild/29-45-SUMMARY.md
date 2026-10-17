---
phase: 29-controlled-language-voice-guard-rebuild
plan: 45
subsystem: testing
tags: [guards, banned-claims, control-bytes, nul-bytes, typescript, vitest, duplicate-authority]

requires:
  - phase: 29-44
    provides: the deleted marker field, without which WR-06's remedy has no subject and this plan's disposition has nothing to record
  - phase: 29-43
    provides: the 115-document corpus the per-group breakdown is derived over
provides:
  - "WR-06 DISPOSED, not remedied: no empty-marker refusal ships, and a named type-level tripwire stands where a runtime refusal could never fire"
  - "the tripwire mutation-proven in the direction `tsc` does NOT cover — the field added back to the INTERFACE, where the compiler exits 0 and the case reds by name"
  - "the suppressed count published BY GROUP from the traversal that computes it: standard-name 8, token-economy 2, comprehension 4 = 14, AGREEING with 29-44's pin"
  - "the restated sub-breakdown sentence and the marker-coupling paragraph both DELETED, not corrected"
  - "`hits` retyped to `number | typeof BANNED_CLAIM_UNMEASURED`; the magic negative is gone and the contract is asserted two-sided with a floor on each arm"
  - "`check-nul-bytes.ts` widened from one byte to the whole forbidden control-byte class over an UNCHANGED scanned set (1598 paths before and after), RED-proven on seven byte kinds"
  - "a FALSE CLAIM in check-nul-bytes.ts's own header found and corrected by the widening's RED proof: git's `-text` verdict is NOT NUL-based"
  - "the round-5 two-file byte loop REMOVED; what survives names the owning gate, the axis it owns and the axis it adds"
  - "IN-03 closed: a per-literal equality beside the derived one, with the asymmetry proven by mutation"
affects: [29-46, 29-47, control-byte gate surface, banned-claim prohibition surface]

actuals:
  tokens: 24954
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A finding whose SUBJECT a later decision deleted is DISPOSED with a written verdict, never dropped. An absent remedy with no record is indistinguishable from an omission."
    - "Where a runtime refusal could never fire, put the invariant in the TYPE and a NAMED case beside it — and justify the case by the route the compiler does NOT cover, not by the route it does."
    - "A number restated in a comment beside a number the run computes is a second declaration that can only rot. Move the number to the run; do not retype it."
    - "Two arms of one cross-check may need DIFFERENT anchors. Ask what each side is actually able to answer for before writing a set equality between them."
    - "RED-first is not ceremony: this plan's RED proof falsified a claim in the module header it was proving, and a red believed without being READ would have shipped a gate that fails on correct trees."

key-files:
  created: []
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-nul-bytes.ts
    - scripts/check-nul-bytes.js
    - scripts/check-nul-bytes.test.ts
    - docs/audit/29-round5-residuals.md

key-decisions:
  - "WR-06's in-gate refusal was NOT shipped. D-53 removed the field from the type, so the loop could never fire and a PASS line counting it is AP-1 — the defect WR-06 was raised about, re-created by its own remedy. A written verdict ships instead."
  - "The tripwire's justification is the route `tsc` does NOT cover. `noEmitOnError` already blocks an excess property; the uncovered route is an editor adding the field back to the INTERFACE, which was demonstrated at tsc exit 0."
  - "The seven vacuous per-marker cases were REPLACED, not merely deleted, by the INERTNESS property — which is true today, named honestly, and reds if a co-occurrence mechanism ever returns."
  - "The cross-check in check-nul-bytes.ts was re-anchored on two DIFFERENT predicates after measurement showed git's `-text` is neither a subset nor a superset of the widened class. The first draft reddened four of its own RED-proof plants for the wrong reason."
  - "`check-nul-bytes.ts` and its package script were deliberately NOT renamed. The scope is stated in the header and in the PASS line; a rename is a second change riding on this one."
  - "The §3.5 correction is APPEND-ONLY. `git diff` shows zero deletions in that file — a trail rewritten to look tidier is the failure the audit files exist to prevent."

patterns-established:
  - "Derive the inventory by grep BEFORE acting on a predecessor's hand-off list. This plan's derivation found a site 29-44's SUMMARY did not name."
  - "Gate every mirror verdict on an explicit non-empty-output AND banner assertion, in the harness and in the permanent case both."
  - "Prove a sum-preserving fabrication, not only an omission: a per-group breakdown whose components were shuffled but whose total was right must red."

requirements-completed: [LANG-04]

coverage:
  - id: D1
    description: "WR-06 is disposed by a written verdict and a type-level tripwire, and the unrunnable guard clause is NOT shipped"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "git diff of scripts/check-banned-claims.ts across all three commits adds no loop over member marker lists to runAll(); the module is untouched by task 1 entirely"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#TRIPWIRE: every pinned member's key set is exactly the two declared fields, and no value is a list"
        status: pass
      - kind: other
        ref: "mutation in the direction tsc does NOT cover: field re-added to the BannedClaimLiteral INTERFACE -> npx tsc --noEmit exits 0, the case reds by name; arms 1 and 3 isolated and reddened separately; reverted, git status clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "The suppressed count's breakdown is an output of the traversal, and it agrees with the value 29-44 pinned"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js PASS line publishes `(standard-name 8, token-economy 2, comprehension 4)` summing to 14 = BANNED_CLAIM_EXEMPT_SUPPRESSED; quoted verbatim below"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the PASS line's per-group components are the matcher's own, and they sum to the pin"
        status: pass
      - kind: other
        ref: "mutation A (a group dropped) and mutation B (a SUM-PRESERVING component fabrication) both red by name; the sum check alone would have missed B"
        status: pass
    human_judgment: false
  - id: D3
    description: "No count field carries a sentinel; the distinction is in the type and asserted"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "npm run typecheck exits 0 with `hits: number | typeof BANNED_CLAIM_UNMEASURED`; the -1 entry now carries the named value"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the admission log records every refused candidate with a reason, and every COUNT is a count — mutation-proven by setting one entry to -1"
        status: pass
    human_judgment: false
  - id: D4
    description: "One repo-wide authority decides the control-byte class over an unchanged scanned set, RED-proven"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "seven byte kinds planted one per RESET throwaway repository, each watched reddening by name with the byte, the offset, the line and the column; clean control at exit 0/764 B; every verdict gated on a non-empty-output + banner premise assertion"
        status: pass
      - kind: unit
        ref: "scripts/check-nul-bytes.test.ts#REFUSES {NUL,BACKSPACE,VERTICAL TAB,CARRIAGE RETURN,ESCAPE,UNIT SEPARATOR,DELETE} by name — seven permanent cases, each plant-proven"
        status: pass
      - kind: other
        ref: "PASS line before and after quoted below; scanned count 1598 -> 1598; git diff adds no filter, no exemption array and no path predicate to the scan path"
        status: pass
    human_judgment: false
  - id: D5
    description: "The equality that stopped pinning a number has a sibling that does, and the asymmetry is the evidence"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "mutation: one plant carries an extra occurrence -> the per-literal assertion reds by name (expected 2 to be 1) while the SAME mutation with the siblings removed leaves the derived equality PASSING"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every removed or renamed case is recorded with its property and where that property lives now, from a RE-DERIVED inventory"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "the derived grep inventory is quoted below; it found `the family covers EVERY conditional comprehension member` — a site 29-44's hand-off list did not name. Suite 2061 -> 2067, accounted for case by case."
        status: pass
    human_judgment: true
    rationale: "Whether a replacement property is genuinely the one the removed case held is a reading, not a predicate. Each row's property and its new home are stated below for that reading."

duration: 15min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 45: The Property Asserted In The Right Place — Summary

**WR-06 discharged by a written verdict rather than by an unrunnable guard clause, with a named tripwire mutation-proven in the one direction `tsc` does not cover; the suppressed breakdown moved out of a comment and into the run that computes it (standard-name 8, token-economy 2, comprehension 4 = 14, agreeing with 29-44's pin); a count field's magic negative expressed in the type; and one repo-wide authority widened to own the whole control-byte class over an unchanged 1598-path scanned set — a widening whose own RED proof falsified a claim in the module header it was proving.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-17T20:23Z
- **Completed:** 2026-08-17T20:38Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Task Commits

1. **Task 1 (tracer): WR-06 disposed by deletion — a tripwire where a runtime refusal could never fire** — `52a1cf4` (test)
2. **Task 2: the breakdown published by the run, and a count field that stops carrying a sentinel** — `deeb185` (fix)
3. **Task 3: one authority for the control-byte class, the boundary declared, the number restored** — `1a18b54` (fix)

Each `.ts` was rebuilt and its committed `.js` twin staged in the SAME commit as its source. Task 1 touched only a test file, which is excluded from `tsconfig.json` and has no committed twin; `npm run freshness` exits 0 at every one of the three commits.

---

## WR-06: THE DISPOSITION, WHICH IS THE DELIVERABLE

The finding asked that a member declared with an **empty marker array** be refused inside the gate rather than only in the test file — the invariant living in the wrong artifact. The first authoring of this plan moved the refusal into `runAll()`, **and that was the correct remedy for the tree as it then stood.**

D-53 then removed the marker field from `BannedClaimLiteral` entirely. An empty-marker member is therefore **not a shape the type admits**: a loop in `runAll()` guarding it has no subject and could never fire, and a gate that counts an unrunnable check in its PASS line is **AP-1** — the exact defect WR-06 was raised about, re-created by its own remedy.

**So the refusal does not ship. WR-06 is DISCHARGED BY DELETING THE MECHANISM.** That verdict is written in three places so it is not a silent absence: in the test file where the retired case sat, in this SUMMARY, and it is carried to plan 29-47's reconciliation table. `git diff 52a1cf4~1..HEAD -- scripts/check-banned-claims.ts` adds no such loop; task 1 did not touch that module at all.

### What ships instead, and why it is not a duplicate of the compiler

```
✓ check-banned-claims — no member carries a marker-shaped field, under ANY name
    > TRIPWIRE: every pinned member's key set is exactly the two declared fields, and no value is a list
```

**The sentence at the declaration stating what it adds over `tsc`, quoted:**

> `tsc` refuses a member that declares an EXCESS property — the old field name or any new one — and
> `noEmitOnError` is on, so that route cannot even build. It does NOT refuse the route a
> reintroduction would actually take: an editor who ADDS the field back to the `BannedClaimLiteral`
> interface and then declares it on a member is type-correct, and every compiler check stays green.
> This case reds on that route, because it reads the members' OWN KEYS rather than a spelling.

**The independently derived denominator and its floor, quoted:**

```ts
const declared = (
  readFileSync(GATE_TS, "utf8").match(/^ {2}\{ literal: "/gm) ?? []
).length;
expect(declared, "no member declarations were matched in the gate source").toBeGreaterThan(0);
expect(BANNED_CLAIM_LITERALS.length).toBe(declared);
```

### The mutation transcripts — three, one per arm, in the direction the compiler does not cover

**MUTATION 1 — the field added back to the INTERFACE under a NEW name (`needsNearbyWord`), then declared on a member. This is the route `tsc` passes:**

```
$ npx tsc --noEmit ; echo "TSC_EXIT=$?"
TSC_EXIT=0
```

```
× TRIPWIRE: every pinned member's key set is exactly the two declared fields, and no value is a list

AssertionError: member "ASD-STE100" carries a key beyond the two declared fields:
  expected [ 'group', 'literal', …(1) ] to deeply equal [ 'group', 'literal' ]
  + "needsNearbyWord"
 ❯ scripts/check-banned-claims.test.ts:611:9
```

**MUTATION 2 — arm (3) isolated. The key-set arm was relaxed to a containment check so the LIST-SHAPE arm has to carry the case alone:**

```
AssertionError: a member holds a LIST-valued field — that is the shape a marker list comes back as,
and D-53 deleted it: expected [ 'needsNearbyWord' ] to deeply equal []
 ❯ scripts/check-banned-claims.test.ts:626:7
```

**MUTATION 3 — arm (1) isolated. A member declared in a form the source-derived denominator does not match, so the array and its declarations part company:**

```
AssertionError: expected 23 to be 22 // Object.is equality
 ❯ scripts/check-banned-claims.test.ts:603:42
```

All three reverted. `git status --porcelain` carries no mutation; `scripts/check-banned-claims.ts` was byte-identical to HEAD when task 1 was committed (`git diff --stat scripts/` showed only the test file).

---

## THE INVENTORY, RE-DERIVED BY GREP RATHER THAN ADOPTED

29-44's SUMMARY hands forward a list. It was used as a starting point and **not as the answer** — this phase's record contains a fix for a three-site finding that missed a fourth site nobody had derived, because each site was cleared on someone else's list.

```
=== A: removed field spelling ===            0 references
=== B: deleted marker constants ===          0 references
=== C: every reference to the historical fixture ===
  196, 207, 208, 209   (the fixture and the three index aliases)
  293, 299, 305, 311, 317   (FAMILY plants)
  331   (markerPlant template)
  598, 599, 600   (identity assertions)
  606, 607   (template case)
  916, 918, 922, 958   (the per-marker loop and the no-marker control)
=== D: case names carrying marker/conditional/cardinality words ===
  603:  it("the marker-plant TEMPLATE smuggles in no second marker and no enumerated literal"
  810:  describe("... the discipline's name, matched unconditionally"
  823:  it("FIRES on FOUR conformance verbs no marker list contained — the D-53 discrimination"
  886:  it("the family covers EVERY conditional comprehension member, and five rows were open"   <-- NOT ON 29-44'S LIST
  915:  describe("... every historical benefit word, alone on its line"
  917:  it(`marker "${marker}" ALONE on the line turns the bare term into a finding`
  955:  it("FIRES on the bare term with no benefit word anywhere on the line — the round-6 inversion"
  975:  it("CONTROL: the SAME markerless line INSIDE the exemption region is still suppressed"
```

**The item the derivation found and 29-44's SUMMARY did not name: line 886.** Its NAME read *"the family covers EVERY CONDITIONAL comprehension member"* — a name for a member shape D-53 removed from the type, passing green in CI. Its **body was already correct and is byte-unchanged**: it walks `COMPREHENSION_TERMS`, which is the two BARE terms. Only the name and its comment lied. Renamed, with the finding recorded at the case.

Line 823 (`no marker list contained`) was checked and **left alone**: it is a historically accurate statement about the pre-change build and is D-53's discrimination proof, not a description of a live mechanism.

---

## EVERY CASE REMOVED OR RENAMED, WITH ITS PROPERTY AND WHERE THAT PROPERTY LIVES NOW

| case (name at HEAD~3) | disposition | the property it held | where that property is held now |
|---|---|---|---|
| `marker "improve" ALONE on the line turns the bare term into a finding` | **removed** | nominally: that word turns the bare term into a finding. Actually, post-29-44: nothing the word did — it passed because the bare term alone reds | **`the gate's own matcher counts the SAME on a line with each historical word and without it`**, which asserts the property that IS true after the deletion (the word is inert) and reds if a co-occurrence mechanism ever returns |
| `marker "better" ALONE …` | **removed** | same | same |
| `marker "easier" ALONE …` | **removed** | same | same |
| `marker "boost" ALONE …` | **removed** | same | same |
| `marker "help" ALONE …` | **removed** | same | same |
| `marker "benefit" ALONE …` | **removed** | same | same |
| `marker "enhance" ALONE …` | **removed** | same | same |
| — (the end-to-end half of the seven) | **retained as one case** | that the SHIPPED gate, not only an imported function, reds on a marker-word line at `file:line:column` with the finding count equal to the matcher's | **`and the SHIPPED gate agrees end to end: one historical word beside the bare term still reds by name`** — one mirror run instead of seven |
| `the marker-plant TEMPLATE smuggles in no second marker and no enumerated literal` | **renamed and repurposed** → `the historical-word plant TEMPLATE carries no benefit word and no enumerated literal of its own` | the template is neutral, so a red is credited to the word under test | **unchanged, at the same address.** It is now the PREMISE of the inertness comparison rather than of seven per-marker reds; the docblock says which |
| `the family covers EVERY conditional comprehension member, and five rows were open` | **renamed** → `the family covers EVERY BARE comprehension term, and five rows were open` | the coverage and discrimination floors over the FAMILY table | **unchanged, body byte-identical.** Only the name described a deleted mechanism |
| the key-set walk inside `every selector selected the literal its NAME says` | **removed from that case** | a member carrying ANY third property reds | **the TRIPWIRE case**, with an independently derived denominator and a list-shape arm beside it. Removed here because two assertions over one predicate, neither naming the other, is the duplicate-authority shape this round closes |
| `PREMISE: this gate's source and this file are grep-visible — no control byte hides them` | **reduced and renamed** → `PREMISE: this gate's source and this harness are both PRESENT and substantial — the greps have something to read` | (a) no control byte outside `\n`/`\t` in two named files; (b) neither file is trivially short | **(a) → `scripts/check-nul-bytes.ts`, repo-wide over 1598 tracked paths — a strict superset. (b) → retained here, because the repo-wide gate floors the tracked SET and says nothing about any NAMED member of it** |

**None survives as a zero-valued pin, and none is left passing under a stale name.**

### The suite count, before and after, accounted for case by case

| | files | passing | skipped |
|---|---|---|---|
| entering (29-44's recorded baseline) | 52 | **2061** | 2 |
| leaving | 52 | **2067** | 2 |

```
task 1:  -7 (per-marker cases)  +2 (inertness matcher, shipped-gate integration)  +1 (tripwire)  = -4  -> 2057
task 2:  +1 (the per-group breakdown case)                                                       = +1  -> 2058
task 3:  +7 (widened-class rows)  +1 (ADMITS TAB/LF)  +1 (the byte-predicate class case)         = +9  -> 2067
```

`npm test` was **NOT** run (it spawns the live claude-CLI e2e lane). The 2 skips are pre-existing and in files this plan did not touch.

---

## WR-01: THE BREAKDOWN PUBLISHED BY THE RUN

**The PASS line, quoted verbatim from `node scripts/check-banned-claims.js`:**

```
  PASS  LANG-04: 115 document(s) carry zero banned claim literal outside the one named exemption
        region — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1;
        22 pinned literal(s) across 3 group(s), matched UNCONDITIONALLY — the gate enumerates what is
        banned and nothing about how it is said; 1 exemption region (agent-factory/writing-profile.md
        § ## Disclaimer and honesty floor — …), which suppresses 14 banned-claim occurrence(s)
        (standard-name 8, token-economy 2, comprehension 4), pinned at 14, and reaches 62 line(s),
        pinned at 62 …; 8 candidate literal(s) refused at admission and recorded with their hit counts
```

**8 + 2 + 4 = 14 = `BANNED_CLAIM_EXEMPT_SUPPRESSED`.** The derived breakdown **AGREES** with the value plan 29-44 pinned; the total the run publishes is the same total the two-sided pin compares, unchanged in position and in meaning.

**Which derivation was checked against which:** the gate's PASS line (produced by `runAll()`'s in-loop accumulation, projected by group at the point of suppression) was checked against `bannedClaimGroupTally(lines, headingAt, endBefore)` folded independently in the test, and that fold's own total was checked against `countBannedClaimOccurrences` over the same range. Three statements, one matcher, all agreeing.

### It is a projection of the existing traversal, not a second walk

```
$ git diff 52a1cf4~1..HEAD -- scripts/check-banned-claims.ts \
    | grep -E '^[+-].*(function occurrences|function lineHits|haystackLower|needleLower)'
(no output — occurrences() and lineHits() are BYTE-UNCHANGED across the whole plan)
```

The tally is filled inside the suppression branch that already exists, off the **same `hits` array** the total consumes:

```ts
if (region !== null && i >= region.headingAt && i < region.endBefore) {
  suppressed += hits.length; // inside the one named exemption region
  // The projection, off the SAME `hits` array — not a re-read of the line.
  for (const h of hits) {
    suppressedByGroup.set(h.member.group, (suppressedByGroup.get(h.member.group) ?? 0) + 1);
  }
  continue;
}
```

### The sentence was DELETED, not corrected

```
$ sed -n '/How many banned-claim occurrences the one named exemption region lifts/,/^export const BANNED_CLAIM_EXEMPT_SUPPRESSED/p' \
    scripts/check-banned-claims.ts | grep -cE 'standard-name [0-9]|token-economy [0-9]|comprehension [0-9]'
0
```

**The replacement, quoted:**

> THE BREAKDOWN BY GROUP IS PUBLISHED BY THE RUN, SO IT IS NOT RESTATED HERE (round 6, plan 29-45 —
> WR-01). `runAll()` tallies the suppressed occurrences per group at the point of suppression, out of
> the same per-line matcher result the total above is accumulated from, and prints them beside the
> total in the PASS line. Read the run.
>
> WHY THE SENTENCE WAS DELETED RATHER THAN CORRECTED, WHICH IS THE WHOLE FINDING. A per-group
> breakdown used to be typed here, INSIDE a paragraph whose own opening sentence says the entrants
> were derived through the gate's counter rather than read out of prose — and its three components did
> not sum to the pin beside them. It was then corrected by hand and went stale AGAIN within two plans,
> when the corpus widened and three terms became unconditional. A number restated in a comment is a
> second declaration of a measurement, and a second declaration can only rot; the fix is to move the
> number to the run, not to retype it a third time.

The stale arithmetic is **described, never quoted** — this tree's gates scan source text without stripping comments, so a verbatim quotation of a removed number re-registers as a live site of it.

### The marker-coupling paragraph was DELETED, not narrowed

```
$ grep -a -c 'BENEFIT_VERB_MARKERS\|CONFORMANCE_VERB_MARKERS' scripts/check-banned-claims.ts scripts/check-banned-claims.js
scripts/check-banned-claims.ts:0
scripts/check-banned-claims.js:0
```

**The replacement, which names what the pin is a function of NOW, quoted:**

> WHAT THIS PIN IS A FUNCTION OF, NOW THAT IT IS NOT A FUNCTION OF ANYTHING ELSE. Exactly two things,
> and a future editor of either should expect this number to move: (1) WHICH LITERALS ARE PINNED —
> admitting a member that occurs inside the region raises this count while producing no finding, which
> is how it last moved; and (2) WHERE THE REGION'S BOUNDARY FALLS — a heading landing somewhere new
> changes which lines are inside it, which is how it moved the time before that. Nothing else reaches
> it.

### The staleness, side by side, with both causes named

| group | round 5 (typed in the comment) | round 5 (actually measured) | round 6 (published by the run) |
|---|---|---|---|
| standard-name | 6 | 6 | **8** |
| token-economy | 3 | 2 | **2** |
| comprehension | 2 | 4 | **4** |
| **total** | **11**, beside a pin of **12** | **12** | **14** |

**Two causes, both landing between round 5 and this plan.** 29-43 widened the corpus from 82 to 115 documents. 29-44 made three terms unconditional, which put the two non-affiliation disclaimer lines (`writing-profile.md:239` and `:241`, neither changed by a byte) into the standard-name column. A restated number rotted twice in three rounds; a published one cannot.

### Mutation-proven, including the fabrication a sum check would miss

**MUTATION A — one group omitted from the published tally:**

```
AssertionError: expected [ 'comprehension', 'standard-name' ] to deeply equal [ 'comprehension', …(2) ]
  - "token-economy"
 ❯ scripts/check-banned-claims.test.ts:2584:39   (the declared-group equality)
```

**MUTATION B — a SUM-PRESERVING component fabrication (standard-name −1, token-economy +1). The total is still 14 and the sum assertion still holds; the case reds anyway:**

```
AssertionError: expected { 'standard-name': 8, …(2) } to deeply equal { 'standard-name': 7, …(2) }
  - "standard-name": 7,   - "token-economy": 3,
  + "standard-name": 8,   + "token-economy": 2,
 ❯ scripts/check-banned-claims.test.ts:2599:21   (the independent fold)
```

Both reverted; `npm run freshness` exits 0 and `git status --porcelain` carries no mutation.

---

## IN-01: THE SENTINEL EXPRESSED IN THE TYPE

**The type's doc comment, quoted:**

> WHAT A `hits` FIELD CARRIES WHEN THE CANDIDATE WAS REFUSED WITHOUT EVER BEING MEASURED.
>
> (Round 6, plan 29-45 — IN-01.) One entry below was refused on arithmetic rather than on a count:
> `ste` is a substring of `system`, so nobody ran the scan. That entry used to carry a MAGIC NEGATIVE
> in a field whose whole contract is "the measurement that rejected this candidate" — a count field
> silently meaning "not a count". This module refuses that conflation everywhere else, and a `-1` in a
> field typed `number` defeats every assertion an author would naturally write over it: `>= 0` is
> false for a legitimate entry, and `is a number` is true for the sentinel.
>
> SO THE DISTINCTION IS IN THE TYPE, NOT IN THE VALUE. […] IT IS NOT A LICENCE TO SKIP MEASUREMENT. A
> candidate refused without a measurement is refused on an argument, and the argument goes in `reason`
> where a reader can check it.

```ts
export const BANNED_CLAIM_UNMEASURED = "refused-without-measurement" as const;

export const BANNED_CLAIM_EXCLUDED: readonly {
  readonly candidate: string;
  readonly hits: number | typeof BANNED_CLAIM_UNMEASURED;
  readonly reason: string;
}[] = [ … ];
```

`npm run typecheck` exits 0 (both `tsconfig.json` and `tsconfig.tests.json`). The `STE, as a bare literal` entry now reads `hits: BANNED_CLAIM_UNMEASURED`.

**MUTATION C — a negative smuggled back into a legitimate entry (`token win`, `hits: 1` → `-1`):**

```
AssertionError: token win: a NEGATIVE hit count is a sentinel smuggled through a count field —
use BANNED_CLAIM_UNMEASURED: expected -1 to be greater than or equal to 0
 ❯ scripts/check-banned-claims.test.ts:2525:9
```

The case asserts the contract two-sided with a floor on **each** arm (`counted > 0`, `unmeasured > 0`, `counted + unmeasured === length`), so neither arm can be satisfied vacuously by an empty list on its side.

---

## WR-04: ONE AUTHORITY FOR THE CONTROL-BYTE CLASS

### The PASS line, before and after

**BEFORE (`50e966e`..`deeb185`):**
```
[check_nul_bytes] no tracked file carries a NUL byte (28-08)
  PASS  1598 tracked file(s) scanned as raw bytes, ZERO carrying a NUL byte; the scanned set is every
        path `git ls-files` reports, with no exemption list and nothing filtered — git's own `--eol`
        classifier independently agrees, reporting 0 `-text` file(s) against this scan's 0 NUL-bearing
        file(s), across 1598 parsed row(s) with 0 unparsed; 0 path(s) missing from the working tree and
        0 path(s) present but unreadable
```

**AFTER (`1a18b54`):**
```
[check_nul_bytes] no tracked file carries a forbidden control byte — C0 plus DELETE, TAB and LINE FEED
admitted (28-08, class widened round 6)
  PASS  1598 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte; the forbidden
        class is C0 plus DELETE (0x00-0x1f and 0x7f) with exactly two admitted: 0x09 TAB and 0x0a LINE
        FEED. The scanned set is every path `git ls-files` reports, with no exemption list and nothing
        filtered — git's own `--eol` classifier independently agrees on the NUL SUB-CLASS it is able to
        answer for, reporting 0 `-text` file(s) against this scan's 0 NUL-bearing file(s), across 1598
        parsed row(s) with 0 unparsed; 0 path(s) missing from the working tree and 0 path(s) present but
        unreadable
```

**Scanned count: 1598 → 1598.** The exemption list is still absent and is still named as absent in the line itself. The class got wider; **the set did not move by one path.**

```
$ git diff 52a1cf4~1..HEAD -- scripts/check-nul-bytes.ts \
    | grep -E '^[+-].*(function trackedPaths|for \(const rel of paths|const \{ hits, missing, unreadable \} = scanTracked)'
(no output — trackedPaths() and the scan loop's enumeration are byte-unchanged)
```

Five `filter(` calls were added to that module. **Every one is in the cross-check or PASS-line arithmetic; none is in the scan path**, and each is quoted with its purpose:

| added `filter(` | purpose |
|---|---|
| `paths.filter((p) => !hits.some(…))` | the CLEAN set, used only by cross-check arm 2 |
| `hits.filter((h) => h.bytes.includes(NUL))` ×2 | the NUL SUB-CLASS, for cross-check arm 1 and for the PASS line's published count |
| `[...nulBearingPaths].filter((p) => !byGit.has(p))` | cross-check arm 1 |
| `[...byGit].filter((p) => scanClean.has(p))` | cross-check arm 2 |

**Zero exemption arrays, zero path predicates.**

### The RED proof — seven byte kinds, one plant per RESET mirror

Gate `sha256 732f7d35845b5fb9fa36217104fadb8fe2131b02defffe27f5d8e791bcc150a2`, the committed `.js` run directly via `NUL_SCAN_ROOT`. **Every verdict gated on a non-empty-output AND banner premise assertion** — the 29-43 harness catch, where a zero-byte output made `exit=0` mean "the gate never ran".

**Clean-mirror control first:**
```
[CONTROL clean]        exit=0 bytes=764 premise=true disagree=false
   PASS  1 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte; …
```

**The seven plants, each into `src/planted.ts` on a freshly reset repository:**
```
[CR       0x0d] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x0d.
[UNIT-SEP 0x1f] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x1f.
[DELETE   0x7f] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x7f.
[NUL      0x00] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x00.
[VTAB     0x0b] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x0b.
[ESC      0x1b] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x1b.
[BS       0x08] exit=1 premise=true disagree=false :: src/planted.ts carries 1 forbidden control byte(s) — 0x08.
```

Each refusal names the file, the byte, the offset, the line and the column — the full rendered form for CR:

```
src/planted.ts carries 1 forbidden control byte(s) — 0x0d. First is 0x0d at byte offset 26, line 2,
column 14. A control byte other than TAB or LINE FEED in a tracked source is never intentional here: …
```

**Seven permanent cases hold it, plus two controls:**
```
✓ REFUSES NUL (0x00) by name, with the byte, the offset, the line and the column
✓ REFUSES BACKSPACE (0x08) by name, …
✓ REFUSES VERTICAL TAB (0x0b) by name, …
✓ REFUSES CARRIAGE RETURN (0x0d) by name, …
✓ REFUSES ESCAPE (0x1b) by name, …
✓ REFUSES UNIT SEPARATOR (0x1f) by name, …
✓ REFUSES DELETE (0x7f) by name, …
✓ ADMITS the two control characters a source file needs — TAB and LINE FEED, and nothing else
✓ the byte predicate itself decides the CLASS, and the two detectors are asked DIFFERENT questions
```

### The RED proof falsified a claim in the header it was proving

**This is the finding of the task, and it was found by RED-first rather than by reasoning.** The first draft of the widening reddened four of its own plants on a **detector-DISAGREEMENT arm** — CR, UNIT SEP, DELETE and VTAB all reported `DISAGREE` while NUL and ESC did not. Rather than accept the red, the premise was measured:

```
$ # one planted byte per throwaway repository, `git ls-files --eol`
CR         "i/-text w/-text attr/   planted.ts"
UNIT-SEP   "i/-text w/-text attr/   planted.ts"
DELETE     "i/-text w/-text attr/   planted.ts"
NUL        "i/-text w/-text attr/   planted.ts"
VTAB       "i/-text w/-text attr/   planted.ts"
ESC        "i/lf    w/lf    attr/   planted.ts"
BS         "i/lf    w/lf    attr/   planted.ts"
```

**The module header claimed *"git's binary heuristic is ITSELF NUL-based"*. That is false.** git's `-text` verdict is a **ratio heuristic over non-printable bytes** that deliberately counts BACKSPACE and ESCAPE as printable. Its `-text` set is therefore **neither a subset nor a superset** of the class this gate decides, so any set EQUALITY between them manufactures false disagreements in both directions.

The claim is corrected in the header rather than left standing, and the cross-check's two arms are re-anchored on **different predicates, each on what its side can actually answer for**:

- **Arm 1** — a NUL this scan found that git did **not** call `-text`. Sound because a NUL forces git's verdict unconditionally (`nul > 0` short-circuits its heuristic).
- **Arm 2** — a file git calls `-text` that this scan found **entirely clean**. Sound because git's non-printable ratio cannot exceed zero on a file whose only control bytes are TAB and LINE FEED, both of which git counts as printable.

A file with SOME forbidden byte is deliberately excluded from arm 2: git calling it `-text` is **agreement**, not disagreement. Every one of the seven permanent cases now asserts `not.toContain("DISAGREE")` — the assertion that would have caught the first draft.

**A red believed without being read would have shipped a gate that fails on correct trees.**

### The duplicate settled, with the boundary at its own declaration

The round-5 two-file control-byte loop in `check-banned-claims.test.ts` is **REMOVED**. What survives is reduced to the one axis it uniquely adds, and its declaration carries all three required names:

> **THE OWNING GATE:** `scripts/check-nul-bytes.ts`.
> **THE AXIS IT OWNS:** whether any file carries a control byte outside TAB and LINE FEED. It decides
>   that over EVERY path `git ls-files` reports — 1598 of them at the time of writing — with no
>   exemption list and nothing filtered, which is a strict superset of the two files below.
> **THE AXIS THIS CASE ADDS:** that those two files, BY NAME, exist and are substantial. The repo-wide
>   gate floors the tracked SET against emptiness; it says nothing about any named member of it, so a
>   gate source renamed or emptied would leave every acceptance grep in this file returning a confident
>   zero and that gate would still be green.

### §3.5 corrected, append-only

```
$ git diff docs/audit/29-round5-residuals.md | grep -E '^-[^-]'
(no output — the incident account is byte-unchanged; the edit is append-only)
```

The appended paragraph names the existing gate, quotes its denominator (**1450** when the round-5 assertion was written, **1598** today), marks its round-6 authorship, and states the lesson:

> **The real lesson is not "we added an assertion". It is: run the repo-wide gate before believing a
> grep.** The gate was there, it covered the tree, and it was not run.

---

## IN-03: THE NUMBER THE EQUALITY STOPPED PINNING

**The reason, at the assertion, quoted:**

> WHAT THE EQUALITY ABOVE STOPPED HOLDING, STATED AT THE ASSERTION RATHER THAN LEFT IMPLIED. Deriving
> both sides is genuinely non-circular — one side is the matcher, the other is arithmetic over the
> rendered output — and it genuinely no longer pins a VALUE. A matcher that began over-matching moves
> BOTH sides together by the same amount, the equality still holds, the floors of 1 still clear, and
> the case stays green while the gate reports more than it should. […]
>
> SO BOTH ASSERTIONS ARE KEPT, BECAUSE THEY HOLD DIFFERENT THINGS. The derived equality holds ONE CODE
> PATH AGAINST ANOTHER — it survives a literal being admitted tomorrow, which is why it replaced a hard
> `toBe(2)` in the first place. The per-literal expectations below hold THE MATCHER AGAINST A NUMBER,
> so growth in either plant is visible HERE instead of being shared out across an equality. Neither is
> sufficient and the case needs both.

### The asymmetry, which is the evidence the sibling was needed

**MUTATION D — the token plant made to carry its literal twice:**

```
AssertionError: the token plant's own occurrence count moved — a literal was admitted, or the matcher
began over-matching: expected 2 to be 1 // Object.is equality
 ❯ scripts/check-banned-claims.test.ts:835:7
```

**THE SAME MUTATION, with only the three sibling assertions removed:**

```
=== mutation still in place, sibling assertions removed ===
      Tests  1 passed | 78 skipped (79)
```

**The derived equality is GREEN under the exact mutation the sibling reds on.** Both sides moved together by one and the floors of 1 still cleared. That asymmetry is the whole argument. Reverted; `git status --porcelain` carries no mutation.

---

## Prohibition verifications — each command run, with its real output

### P1. No pin deleted because it fired; no equality converted into a bound

**Every bound this plan ADDS, with the equality on the same quantity it accompanies:**

| added bound | the equality beside it |
|---|---|
| `expect(declared, …).toBeGreaterThan(0)` | `expect(BANNED_CLAIM_LITERALS.length).toBe(declared)` — same quantity, the floor is the vacuity guard |
| `expect(readFileSync(p).length, …).toBeGreaterThan(1000)` | premise floor for a presence check; no quantity is being pinned |
| `expect(baseline, …).toBeGreaterThanOrEqual(1)` (inertness) | `expect(countBannedClaimOccurrences([plant],0,1)).toBe(baseline)` — same quantity |
| `expect(expected).toBeGreaterThanOrEqual(1)` (integration) | `expect(findingCount(stdout)).toBe(expected)` — same quantity |
| `expect(e.hits, …).toBeGreaterThanOrEqual(0)` | the CONTRACT itself; the equality is `counted + unmeasured === BANNED_CLAIM_EXCLUDED.length` |
| `expect(counted).toBeGreaterThan(0)` / `expect(unmeasured).toBeGreaterThan(0)` | same — the partition equality above |
| `expect(stdout.length, "the gate produced NO output").toBeGreaterThan(500)` | harness premise; no quantity is being pinned |
| `expect(declaredGroups.length, …).toBeGreaterThan(1)` | `expect([...parsed.keys()].sort()).toEqual(declaredGroups)` — same quantity |
| `expect(Object.values(derived).reduce(…)).toBeGreaterThan(0)` | `expect(derived).toEqual(Object.fromEntries(parsed))` and the total equality — same quantity |

**Every equality DELETED by this plan, and where it went:**

```
$ git diff 52a1cf4~1..HEAD -- scripts/check-banned-claims.test.ts scripts/check-nul-bytes.test.ts | grep -E '^-.*\.toBe\('
  -      expect(status).toBe(1);
  -      expect(findingCount(stdout)).toBe(expected);
```

Both are from the seven deleted per-marker cases, and **both survive at full strength** in the retained end-to-end case `and the SHIPPED gate agrees end to end`. **No equality was converted into a bound, and no pin was deleted because it fired.** Two bounds were also removed, from the same deleted block.

**Status: enforced.**

### P2. No new hand-authored list; the breakdown is a projection, not a second walk

```
$ git diff 52a1cf4~1..HEAD -- scripts/check-banned-claims.ts \
    | grep -E '^[+-].*(function occurrences|function lineHits|haystackLower|needleLower)'
(no output — both are BYTE-UNCHANGED)

$ git diff 52a1cf4~1..HEAD -- scripts/check-banned-claims.ts | grep -cE '^\+.*readonly string\[\]'
0
```

The tally is filled inside the existing suppression branch off the existing `hits` array (quoted above under WR-01). The one new exported helper, `bannedClaimGroupTally`, folds `lineHits` with **no rules of its own**, and stands in exactly the relationship to `runAll()` that `countBannedClaimOccurrences` already does — which is what makes neither a second grammar. The one new array in the module (`ADMITTED_CONTROL_BYTES`, in the other module) is two bytes with their names, not a list of prose forms.

**Status: enforced.**

### P3. WR-06's in-gate empty-marker refusal is NOT shipped

`runAll()` contains no empty-marker refusal. Task 1 — the task that owned WR-06 — **did not touch `scripts/check-banned-claims.ts` at all**; `git diff --stat scripts/` at its commit showed one file changed, the test file. The disposition is written above, at the retired case's address in source, and is carried to plan 29-47.

**Status: enforced.**

### P4. The conditional-marker mechanism is not resurrected under any name

```
$ grep -a -c 'requiresOnSameLine' scripts/check-banned-claims.ts scripts/check-banned-claims.js scripts/check-banned-claims.test.ts
scripts/check-banned-claims.ts:0
scripts/check-banned-claims.js:0
scripts/check-banned-claims.test.ts:0
```

Not as a helper, not as a fixture shape, and not as a comment describing how it worked in restorable terms — the retired-construct convention is observed throughout (the stale arithmetic is **described**, never quoted). `HISTORICAL_BENEFIT_WORDS` remains an explicitly non-authoritative test-local fixture whose docblock now names the tripwire as the second refusal beside the compiler.

**Status: enforced.**

### P5. Widening `check-nul-bytes.ts` never narrows it

PASS lines quoted in full above. **Scanned count 1598 → 1598.** The exemption list is still absent, and `git diff` adds no filter, no exemption array and no path predicate to the scan path (the five added `filter(` calls are tabled above, all in cross-check/PASS-line arithmetic).

**Status: enforced.**

### P6. No case deleted without a record

The table of every removed, renamed and reduced case — with its property and where that property lives now — is above. The suite's passing count is recorded before (**2061**) and after (**2067**) and accounted for case by case.

**Status: enforced.**

---

## Verification commands, recorded by name

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run typecheck` | 0 (both `tsconfig.json` and `tsconfig.tests.json`) |
| `npm run freshness` | 0 — "All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild." |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run check:public-docs` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:banned-claims` | 0 — "0 findings over 115/115 elements" |
| `npm run check:imperative-lexicon` | 0 — "0 findings over 19/19" and "0 findings over 47/47" |
| `npm run check:diff-disposition` | 0 — "0 findings over 37/37 elements" |
| `npm run check:nul-bytes` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2067 passed, 2 skipped** |

`npm test` was **NOT** run. `git status --porcelain` carries no plant, mirror, fixture or mutation from this plan. `package.json` and `package-lock.json` are byte-unchanged (T-29-45-SC discharged by asserted absence; no package was installed).

---

## Values that must NOT move — asserted unmoved

| pin | value | how confirmed |
|---|---|---|
| `BANNED_CLAIM_SCAN_COUNT` | **115** | the gate's own PASS line, "115/115 elements" |
| `BANNED_CLAIM_EXEMPT_SUPPRESSED` | **14** | published by the run, and the derived per-group breakdown sums to it |
| `BANNED_CLAIM_EXEMPT_EXTENT` | **62** | the same run's PASS line, "reaches 62 line(s), pinned at 62" |
| the two-sided enumerated-comprehension count | **6** | `the reconstructed PRE-FIX grammar is the six enumerated literals` passes unmodified |

**None moved.** This plan publishes numbers rather than re-pinning them.

---

## Deviations from Plan

### 1. [Rule 1 — bug] The cross-check's anchoring was wrong, and the widening's own RED proof is what exposed it

- **Found during:** Task 3, during the RED proof — not by reasoning about the arm.
- **Issue:** The first draft anchored the detector cross-check on "the NUL sub-class", on the strength of the module header's claim that git's binary heuristic is NUL-based. Four of the seven plants (CR, UNIT SEP, DELETE, VTAB) then reported a detector **DISAGREEMENT** alongside their correct refusal. Measured directly, git reports `w/-text` for 0x00/0x0b/0x0d/0x1f/0x7f and `w/lf` for 0x08/0x1b — a ratio heuristic that counts BACKSPACE and ESCAPE as printable. The header's claim is false, and git's `-text` set is neither a subset nor a superset of the widened class, so **any** set equality between them manufactures false disagreements. Shipped, this would have reddened the gate on correct trees carrying a stray CR.
- **Fix:** the two arms re-anchored on different predicates, each on what its side can actually answer for, with the soundness argument for each written at the comparison. The false header claim corrected in place with the measurement that falsified it. `not.toContain("DISAGREE")` added to all seven permanent cases — the assertion that would have caught the first draft.
- **Verification:** all seven plants now `disagree=false` at exit 1 with the file named; clean control at exit 0; live tree exit 0.
- **Committed in:** `1a18b54`.

### 2. [Rule 2 — missing critical functionality] A stale case name 29-44's hand-off list did not carry

- **Found during:** Task 1, by the re-derived grep inventory.
- **Issue:** `the family covers EVERY conditional comprehension member, and five rows were open` named a member shape D-53 removed from the type, and was passing green in CI. 29-44's SUMMARY enumerated eight vacuous cases and this was not among them.
- **Fix:** renamed to `the family covers EVERY BARE comprehension term, …`, with the finding and its provenance recorded at the case. **The body is byte-unchanged** — it always walked `COMPREHENSION_TERMS`, so only the name and its comment were wrong.
- **Verification:** the case name appears in the reporter output above; `npx vitest run scripts/check-banned-claims.test.ts` exits 0.
- **Committed in:** `52a1cf4`.

### 3. [Rule 3 — blocking] `bannedClaimGroupTally` was added to the gate module

- **Found during:** Task 2.
- **Issue:** the plan asks the per-group case to derive its expectation independently of the gate's own accumulation. No exported route existed to per-group attribution, and the two available alternatives were both refused by name: re-implementing a substring counter in the test would have been a second matcher grammar, and adding a member-restriction parameter to `countBannedClaimOccurrences` would have widened the shared matcher's API for a test's convenience.
- **Fix:** one thin exported fold over `lineHits`, with no rules of its own, standing in exactly the relationship to `runAll()` that `countBannedClaimOccurrences` already does. `occurrences()` and `lineHits()` are byte-unchanged, which the prohibition's own verification command confirms.
- **Verification:** `git diff … | grep -E '^[+-].*(function occurrences|function lineHits|…)'` produces no output.
- **Committed in:** `deeb185`.

**Total deviations:** 3 (1 × Rule 1, 1 × Rule 2, 1 × Rule 3). **Impact:** no scope creep on the matcher, the literals, the exemption region, the scanned set of either gate, or any byte ceiling. Deviation 1 is the plan's RED-first requirement doing exactly what it exists to do.

---

## Residuals observed but NOT closed by this plan

Each is escalated to `.planning/WINDOWS.md` rather than absorbed.

### R1. 30 disposition rows can never match, because their `file` cell is a code span

- **Address:** `scripts/check-diff-disposition.ts` `rowMatches()` — `row.file !== c.file`, with no backtick stripping, against a bare-path `ChangedClause.file`.
- **Direction: FAIL-CLOSED.** **Live count: 30**, all in `docs/audit/29-style-dispositions/29-12.md`.
- Carried from 29-44, **unmoved by this plan** — outside `files_modified`. This plan authored no disposition row.

### R2. `CHANGELOG.md:67` still reads `sharper-per-token`

Re-confirmed live at HEAD (`grep -a -n` → line 67). Outside `BANNED_CLAIM_LITERALS`, so the gate does not flag it. **Direction: fail-open. Live count: 1.** Carried from 29-43, unmoved.

### R3. Three round-5 residuals whose subject 29-44 deleted

`V-29-42-01`, `-02` and `-04` all describe the co-occurrence window, which no longer exists. Moot **by construction**, not closed by an argument. Plan 29-47 owes them a closing measurement rather than a paragraph — this plan does not own them and did not quietly drop them.

### R4. The false header claim is corrected here; the *class* of it is not closed

`check-nul-bytes.ts`'s header asserted a property of an external tool that had never been measured, and it was believed for two phases. **Direction: informational. Live count in this module: 0 after this plan.** No mechanism exists in this repository that would catch the next such claim about an external tool's behaviour; the only thing that caught this one was a RED proof someone read instead of accepting.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired data source was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. `T-29-45-SC` is discharged by asserted absence: no package was installed and the lockfile is byte-unchanged.

## Next Phase Readiness

- **Plan 29-47** owes, from this plan: **WR-06's verdict (DISCHARGED BY DELETING THE MECHANISM, guard clause deliberately not shipped)** in the reconciliation table; the R1–R4 rows above; and the closing measurement for `V-29-42-01/-02/-04`.
- **The corpus, the pins and the two gates as this plan leaves them:** 115 documents, 22 literals across 3 groups all unconditional, `BANNED_CLAIM_EXEMPT_SUPPRESSED` 14 (published by group: standard-name 8, token-economy 2, comprehension 4), `BANNED_CLAIM_EXEMPT_EXTENT` 62, `check-nul-bytes` over 1598 tracked paths deciding the whole forbidden control-byte class.

## Self-Check: PASSED

Modified files verified present:

```
FOUND: scripts/check-banned-claims.ts
FOUND: scripts/check-banned-claims.js
FOUND: scripts/check-banned-claims.test.ts
FOUND: scripts/check-nul-bytes.ts
FOUND: scripts/check-nul-bytes.js
FOUND: scripts/check-nul-bytes.test.ts
FOUND: docs/audit/29-round5-residuals.md
```

Commits verified present in `git log`:

```
FOUND: 52a1cf4  test(29-45): WR-06 disposed by deletion — a tripwire where a runtime refusal could never fire
FOUND: deeb185  fix(29-45): the breakdown published by the run, and a count field that stops carrying a sentinel
FOUND: 1a18b54  fix(29-45): one authority for the control-byte class, the boundary declared, the number restored
```

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-17*
