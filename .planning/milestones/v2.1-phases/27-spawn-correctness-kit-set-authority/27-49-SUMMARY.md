---
phase: 27-spawn-correctness-kit-set-authority
plan: 49
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, harness-integrity, differential, kit-03, spawn-04, gap-closure-round-9]
status: complete
requires:
  - "scripts/frontmatter.ts — D-54's structural node-start walk (27-47) and D-55's node-started fact (27-48)"
  - "scripts/frontmatter.test.ts — the D-52 loader differential and the D-51 red-team sweep"
provides:
  - "a corpus that can EXPRESS both round-8 critical findings — 7 grammar-named key-line shapes and a continuation-DEPTH axis"
  - "the expressibility floor: the module's own ledger read at run time, every family asserted buildable BY CONSTRUCTION"
  - "the flow node-start contexts DERIVED from YAML 1.2 § 7.4, with the universal title narrowed to what the derivation covers"
  - "an exemption region in which every assertion has been FIRED by a constructed input"
affects:
  - "nothing in production — this plan touched only scripts/frontmatter.test.ts and deferred-items.md"
tech-stack:
  added: []
  patterns:
    - "a differential is complete only over the inputs it GENERATES; the loader is never asked about a shape the builder cannot compose"
    - "a constant baked into a builder is an axis nobody wrote down"
    - "read the module's own ledger at run time; a coverage claim asserted by construction cannot go stale in a comment"
    - "an assertion that cannot fail is a defect; an assertion whose cheapest repair narrows a safety rule is worse than none"
    - "when a title carries a universal quantifier, ask what set the EVIDENCE enumerates — narrowing the title is a fix, not a retreat"
key-files:
  created: []
  modified:
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-56 items 1, 2 and 3 implemented in full. Nothing deferred to a round 10 except what is recorded OPEN in deferred-items.md with its reason."
  - "WR-02's disposition is DERIVE **and then NARROW**. Deriving the flow-context half while leaving a title reading 'no MID-LINE node start YAML defines' standing would have been WR-02 repeated one level out — the block-context node starts are CR-01 families A, B, F and D and no flow derivation contains them."
  - "The seven new key-line shapes END at the mid-line node start with the quote ALREADY OPEN. The offset-0 spelling of the same seven constructs was built first and measured GREEN on the pre-27-47 build — the shapes read identically in prose and only one of them is red."
  - "WR-04's bound is DELETED, not derived. Its replacement is one corpus-level minority floor whose right-hand side no exemption controls; the narrow detection the deletion gives up is measured and recorded rather than closed by restoring a self-check."
  - "WR-03 is NOT this plan's work. Per D-56 and this plan's own objective, 27-48 owns CR-02 and WR-03; it landed at 208af47 and nothing here duplicates or reverts it."
metrics:
  duration: ~100 min
  completed: 2026-08-09
actuals:
  tokens: 63000
  tasks: 3
  commits: 4
---

# Phase 27 Plan 49: The Corpus Can Express What The Phase Actually Shipped Summary

Closed the three round-8 warnings that explain **why nine rounds shipped green**: the differential's
corpus could not express either round-8 critical finding (**WR-01**), a universal case title stood over
a hand-listed array and the claim was false (**WR-02**), and the exemption region's only genuinely
load-bearing assertion was surrounded by a bound that could not fail and an equality that pressured a
maintainer toward narrowing a safety rule (**WR-04**).

**No production predicate changed.** `git diff --stat 94bac76..HEAD` touches exactly two files:
`scripts/frontmatter.test.ts` and `deferred-items.md`.

## READ THIS FIRST

- **The module is NOT bypass-free.** The nested-block-scalar family G/G2 is a LIVE silent-no-grant on
  this build, re-measured below with its loader column and recorded OPEN in `deferred-items.md`.
- **The new expressibility floor does NOT cover it, and that is a property of the floor.** The floor
  derives its family list from the module's LEDGER; the ledger records failures the module has
  CLOSED. An open bypass has no ledger entry and is outside the derived set by construction. This was
  found by the executor's red team AFTER all three tasks were green, and it is now stated in source.
- **A green suite is a FLOOR here and nothing else.** It was green in every one of the nine rounds in
  which a defect was later found.

## WR-03 OVERLAP WITH 27-48 — RECONCILED EXPLICITLY

**WR-03 is not this plan's work and this plan contains no WR-03 task.** Per **D-56**, and stated
verbatim in `27-49-PLAN.md`'s own objective:

> `27-47` owns CR-01, `27-48` owns CR-02 **and WR-03**, `27-50` owns WR-05 and the four info items.

`27-48` closed WR-03 at commit **`208af47` — "test(27-48): both differential harnesses compare the
NAME SET, not a boolean (WR-03)"**. It is **fully satisfied there**, verified at execution time
rather than assumed:

- The four `WR-03 …` cases 27-48 authored are present and green in this file (titles quoted in the
  case-title table below).
- The name-set predicate runs on every cell of THIS plan's widened 960-cell corpus and reports
  **`NAME-SET disagreements 0`** — 27-48's predicate now covers 3.08x the cells it was written over,
  because this plan widened the corpus underneath it. That is the only interaction between the two.
- **Nothing was redone, nothing was reverted, and no remainder was left.** `git log 94bac76..HEAD`
  contains no WR-03 commit.

## Loader versions, printed once

```
RUBY=2.6.10 PSYCH=3.1.0 LIBYAML=0.2.1
```

---

# WR-01 — the corpus can now express what the phase actually shipped

## The RED transcript: the seven new key-line shapes against a mirror of the pre-`27-47` build

`git archive 62b8b53` (the commit immediately before `27-47`), the module's own COMMITTED
`scripts/frontmatter.js`, 7 new shapes x 6 continuation-1 x 4 continuation-2 x 2 depths = 336 cells,
every region handed to `/usr/bin/ruby -ryaml` in one batched process.

```
===== NEW-SHAPE PROBE :: mirror of 62b8b53 (PRE-27-47, COMMITTED build) =====
cells (7 shapes x 6 x 4 x 2 depths)        : 336
loader-REJECTED                            : 196
module REFUSES (loud, third verdict)       : 16
MODULE SILENT / LOADER GRANTS  (must be 0) : 54
MODULE GRANTS / LOADER DOES NOT (must be 0):  0
per-family                                total rejected silent refuse grant no-grant
  nested block mapping, mid-line quote        48     28      6      4    10      6
  compact nested sequence, mid-line quote     48     28      6      4    10      6
  block explicit key, mid-line quote          48     28      6      4    10      6
  JSON-adjacent flow mapping, unspaced        48     28     10      0    10     10
  JSON-adjacent flow mapping, spaced          48     28     10      0    10     10
  block mapping inside a sequence item        48     28      6      4    10      6
  flow mapping inside a flow sequence         48     28     10      0    10     10
```

**All seven families are RED there.** No family failed to reproduce.

## The GREEN transcript: the same 336 cells against this build

```
===== NEW-SHAPE PROBE :: HEAD (POST-27-48, COMMITTED build) =====
cells                                      : 336
loader-REJECTED                            : 196
module REFUSES (loud, third verdict)       :   0
MODULE SILENT / LOADER GRANTS  (must be 0) :   0
MODULE GRANTS / LOADER DOES NOT (must be 0):   0
  every family: 48 total, 28 rejected, 0 silent, 0 refuse, 20 grant, 0 no-grant
```

## The FIRST cut of these shapes was GREEN on the defective build, and that is recorded

The first draft put the quote at **offset 0 of the continuation line** (`tools:` / `  nested:` /
`    "Write,` / `    # x, TOKEN"`) — a valid nested block mapping, and prose-identical to the ledger's
family A. Measured against the same pre-`27-47` mirror:

```
===== NEW-SHAPE PROBE (first cut, quote at offset 0) :: mirror of 62b8b53 =====
MODULE SILENT / LOADER GRANTS : 0        <-- the "new" families were not red at all
```

CR-01's defect is a **mid-line** node start: the quote must open on the key line right after
`nested: `, so that arm 4's missing `depth > 0` is what decides. The shipped members therefore end at
the mid-line node start with the quote already open — the same construction the two 27-43 red-team
members already use. **A family that reads right in prose and is not red is not a pin**, and this is
recorded because "we added the family" is exactly the claim this phase keeps finding to be false.

## Loader-rejected, per new shape — no family is rejected wholesale

Each of the seven new families: **28 of 48 cells loader-rejected, 20 adjudicated.** None is rejected
wholesale, so none is counted as coverage it does not have. The rejections are the deliberately
mis-closed continuation-2 members (`the token followed by a closing quote`, `the token followed by a
collection close`) and the `- `/`&w `/`# ` openers meeting an already-open quoted scalar.

## The old and new cell totals, with the expression that derived each

| | expression | value |
|---|---|---|
| old | `AXIS_KEY_LINE(13) x AXIS_CONTINUATION_1(6) x AXIS_CONTINUATION_2(4)` | **312** |
| new | `AXIS_KEY_LINE(20) x AXIS_CONTINUATION_1(6) x AXIS_CONTINUATION_2(4) x AXIS_CONTINUATION_DEPTH(2)` | **960** |

Neither is written down: `corpus.length` is asserted `toBe` the product, and the axis-length floors
moved deliberately (13 -> 20, plus the new `expect(AXIS_CONTINUATION_DEPTH.length).toBe(2)` and a
`Math.max(...DEPTH) >= 3` assertion so the fourth axis cannot be a rename of the constant it replaced).

## The builder is COUNTED, not trusted

`buildCellParts` returns its continuation lines. Over all 960 cells the case asserts, per cell:

- `continuations.length === depth`,
- every continuation starts with the key-line shape's own indent (so a "depth" can never be a
  column-0 line that changed the document's structure),
- the token rides the **last** continuation (this is what makes depth 3 a node that begins on
  continuation 1 and is still running two lines later),
- `region.split("\n").length` equals `1 + keyLine.lines.length + Σ(lines per continuation) + 1`, so
  the array and the joined region cannot disagree.

**Probe 5 (below) fires it**: changing `depth - 2` to `depth - 3` produces
`expected 2 to be 3` naming the cell.

## The expressibility floor, and its derived numbers

```
WR-01 expressibility floor — ledger family rows derived 9 | expressible 6
  (family (a), family (b), A, B, C, F) | outside the generator's shape space 3 (d1, d2, d3)
```

**Derived, not transcribed.** The floor reads `scripts/frontmatter.ts` at run time and extracts the
ledger's FAMILY ROWS — comment lines at the header's five-space family indent whose text is a short
label followed by a backtick-quoted document sketch naming the `tools:` key. That is the module's own
uniform format for "here is a concrete failure shape". The count is asserted **two-sided** (`toBe(9)`
plus `toBeGreaterThan(0)` plus distinct labels), so the floor can pass neither by finding zero nor by
finding a set that quietly shrank.

**The ordinal entry headings are deliberately NOT the derived set, and the reason is measured.** They
are not uniformly spelled: seven of the ten entries carry an `AND A <ORDINAL> TIME` heading, entries
one and two are introduced as prose, and entry four as "This is the FOURTH spelling". A
heading-derived count returns **7 for a ten-entry ledger** — a number that reads authoritative while
being wrong, which is this repository's own diagnosed second systemic failure class. Stated in source.

**Every derived entry, with the axis-member combination that expresses it:**

| ledger family | key-line member | continuation 1 | continuation 2 | depth |
|---|---|---|---|---|
| `family (a)` | `no value` | `opens a double-quoted scalar` | `the token after a hash` | 2 |
| `family (b)` | `flow-sequence opener` | `opens a double-quoted scalar` | `the token after a hash` | 2 |
| `A` | `nested block mapping, mid-line quote` | `plain text` | `the token after a hash` | 2 |
| `B` | `compact nested sequence, mid-line quote` | `plain text` | `the token after a hash` | 2 |
| `C` | `JSON-adjacent flow mapping, unspaced` | `plain text` | `the token after a hash` | 2 |
| `F` | `block explicit key, mid-line quote` | `plain text` | `the token after a hash` | 2 |
| `d1` `d2` `d3` | **outside the generator's shape space** — derived from the row's OWN content: each sketch contains a column-0 code fence, and the builder emits every continuation at its key-line shape's indent, so a column-0 line is unreachable by construction. Counted two-sided (`toBe(3)`) so the exclusion cannot grow into a hiding place. | | | |

**The expressibility PROOF is derived, not a hand-written marker.** The ledger row spells its document
as a `/`-separated list of backticked LINES; the floor asserts the named key-line member's own
`lines` equal that row's LEADING lines **byte for byte**, then asserts the built cell's key is a
member of the enumerated corpus (so the loader really adjudicates it) and that it carries the token.

**The failure message for a non-expressible entry names the entry** — see probe 4b.

## The differential's derived numbers over the widened corpus

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 4676305aa8367e2c
  | cells enumerated 960 + 2 named = 962 | loader-rejected (skipped) 395
  | token-presence disagreements 78 | NAME-SET disagreements 0 | 83ms

D-52 exemption accounting — loader-accepted 565 | exempt cells 78 | disagreements 78
  | per-rule matched E1=32 E2=52 | the DELETED bounds would have been E1=48 E2=64
```

**83ms for 962 cells in ONE batched loader process.** The batched call is preserved exactly; no time
threshold is asserted, because a time threshold is the kind of assertion a future author narrows.
The corpus digest (`4676305aa8367e2c`) is printed on every run, so a transcript over a different
corpus is visible as data rather than accepted as persuasive.

The same-bytes assertion, the distinct-cell-key assertion, and both never-exemptible direction sets
(`unsafe`, asserted `[]` independently of the exemption machinery) all still pass over 960 cells.

---

# WR-02 — the sweep's universal claim is derived, and its title names its bound

## The context count, MEASURED from the committed source before any change

| source | count |
|---|---|
| **executor's measurement of the committed array** | **21** |
| the round-8 review's stated figure | 11 |

The measurement governs. This plan deliberately carried no number about that array as fact.

## The case title, before and after

**Before:**

> `D-51 red-team — no mid-line node start YAML defines returns the SILENT no-grant arm`

**After:**

> `D-51 red-team — no FLOW-CONTEXT node start YAML defines returns the SILENT no-grant arm, over a set DERIVED from § 7.4's productions`

## Disposition: DERIVE — **and then NARROW**, with the reason

D-56 item 2 permits derive **or** retitle. The executor did both, because deriving alone would have
left the same defect one level out:

1. **DERIVED.** The 21-member literal is **deleted, not kept beside the derivation**.
   `FLOW_NODE_START_CONTEXTS` is generated at file scope from YAML 1.2 § 7.4's flow node-start
   productions (10) x § 6.9's node properties (6) x a nesting depth (3) = **180 contexts**, x 2 quote
   styles = **360 cells**. The cardinality is asserted **two-sided** against the product of the three
   declared lists, the labels are asserted distinct, both original derived count assertions survive,
   and the two counterexample spellings are asserted MEMBERS by name.

2. **NARROWED.** A flow-context derivation cannot support a claim over **block**-context node starts —
   the block mapping separator, the compact nested sequence, the block explicit key and the block
   mapping inside a sequence item are mid-line node starts YAML defines too, and they are CR-01
   families **A, B, F and D**. Leaving the wider title standing over a flow-only derivation would have
   been a universal claim over a set that does not contain its own counterexamples: WR-02 exactly,
   one level out. **The relocation is named at BOTH sites** — at the sweep, pointing to the D-52
   generated corpus and the expressibility floor; and at the seven new key-line members, pointing
   back at the sweep — because a relocation stated in one place is a hand-off that will be lost.

## The counterexample families are covered, demonstrated against the pre-`27-47` build

**The COMMITTED case, run against a `git archive` mirror of `62b8b53`, FAILS:**

```
× D-51 red-team — no FLOW-CONTEXT node start YAML defines returns the SILENT no-grant arm …
AssertionError: mid-line node starts returning the SILENT no-grant arm over a live grant
                (360 cell(s) swept):
flow mapping separator, JSON-adjacent | none | depth 1 | double-quoted
flow mapping separator, JSON-adjacent | none | depth 1 | single-quoted
… 72 cells, EVERY ONE a JSON-adjacent mapping separator — CR-01 families C and H
```

**And the OLD 21-member hand list, run against the SAME build, reports ZERO:**

```
OLD 21-member hand list vs PRE-27-47 build: swept 42 silent 0
```

That is the WR-02 finding measured on both sides: a universal title reading green over a live defect,
and the derivation that makes the same title true.

## The sweep's PREMISE is re-asserted on every run

The sweep's expectation is stated from YAML (inside a quoted scalar every character is content), and
that reasoning has a premise: each generated document must be one a real loader reads, with the token
in the value it computes. A production added later whose documents libyaml rejects would silently turn
the sweep into a demand over text no platform loads. So the premise is a case, in the block that
already owns the batched loader:

```
WR-02 derived flow node-start premise — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1
  | contexts 180 (10 productions x 6 node properties x 3 nestings) | cells 360
  | loader-rejected 0 | token absent from the loaded value 0
```

**360/360 accepted; 360/360 carrying the token.** Not one derived context is a document libyaml
refuses.

---

# WR-04 — every assertion in the exemption region can fail

## The arithmetic that made the old bound vacuous, per exemption

| | bound expression | bound | match rule | matched (loader-accepted) |
|---|---|---|---|---|
| **E1** | `DANGLING_PROPERTY_SHAPES(1) x C1(6) x C2(4) x DEPTH(2)` | **48** | `(keyLine) => keyLine.danglingNodeProperty` | **32** |
| **E2** | `CONTINUATION_START_SHAPES(8) x C2(4) x DEPTH(2)` | **64** | `(keyLine, first) => (keyLine.valueNodeOnContinuation \|\| keyLine.flowNodeStartAtEndOfKeyLine) && first.referenceSigilAtNodeStart` | **52** |

Each `bound` **is** the full cross-product the named shape can produce, and each `matches` is a **pure
function of the same axis flags the bound was computed from**. So the corpus cells a rule matches is,
by construction, exactly that product — and `matched` counts only the LOADER-ACCEPTED ones, making it
the product **minus** the loader-rejected cells the rule covers. Measured: **E1 = 48 − 16 = 32**,
**E2 = 64 − 12 = 52**. `matched <= bound` therefore holds for **every possible corpus, on every axis**.

**And the scoped correction the executor's red team forced, because the honest version is the point.**
The bound is unfailable over CORPUS variation — the dimension its own comment named. It is **not**
unfailable over MATCH-RULE variation: rewriting E1's rule to `() => true` takes matched to **565**
against a bound of 48 and the bound fires. That is a real, narrow detection the deletion gives up, and
it is stated in source and in `deferred-items.md` rather than quietly dropped.

## The bound's disposition: DELETED, with the deletion stated in source

The `bound` field is gone from the `Exemption` interface and from both rules. No old bound remains
beside a new one. Quoted from source:

> `// (27-49, WR-04 / D-56 item 3) THE PER-EXEMPTION 'bound' IS DELETED, AND THE DELETION IS STATED`
> `// HERE SO A LATER READER DOES NOT RESTORE DECORATION THAT READS LIKE A FLOOR.`

Its replacement is **one corpus-level floor whose right-hand side no exemption controls**:

```ts
expect(
  exemptCells,
  `the exempt cells must be a strict MINORITY of the ${accepted} the loader accepted — an exemption cannot widen until it explains the corpus`,
).toBeLessThan(accepted / 2);
```

Measured: **78 exempt of 565 loader-accepted.** The two deleted products are still **re-derived on
every run** and printed beside the counts they used to bound, so the arithmetic stays checkable.

**The trade is measured and named:** the floor fires at roughly half the loader-accepted corpus where
the old bound fired at that rule's own product, so a decoupling that widens a rule to between those
figures is no longer caught. It is **not** closed by restoring the bound — a ceiling computed from the
exemption's own inputs is a predicate acting as its own oracle, which is the shape this module deletes
on sight. Recorded in `deferred-items.md` with a suggested direction for round 10.

## The equality is split into two honest predicates

**Retired** (it required the disagreement set to EQUAL the exempt set, and `expectedExempt` was pushed
for every matched cell whether or not it diverged — so an exempt cell that AGREED turned the harness
red, and the cheapest repair was narrowing `matches`):

```ts
expect([...new Set(disagreements.map(d => d.split("\t")[0]))].sort())
  .toEqual([...new Set(expectedExempt)].sort());
```

**Replacement 1 — NO UNEXPLAINED DISAGREEMENT.** Fails when the module and the loader differ on a cell
no named exemption covers; the message lists the unexplained cells with their axis labels and the
loader's value.

```ts
expect(
  adjudication.unexplained.map((w) => disagreementDetail.get(w) ?? w),
  `a disagreement with the loader that NO named exemption covers. …`,
).toEqual([]);
```

**Replacement 2 — NO DEAD EXEMPTION.** Fails when a rule matched no **disagreeing** cell; the message
names the exemption, its matched count and quotes its reason. This is **stronger** than the deleted
liveness check, which asked only for a matched loader-accepted cell — something any rule stated over
an axis flag satisfies by construction.

```ts
expect(
  adjudication.dead.map((label) =>
    `${label}\n  matched ${rowsMatched.get(label) ?? 0} loader-accepted cell(s) and NO disagreeing one\n  ${EXEMPTIONS.find(e => e.label === label)?.reason ?? ""}`),
  "an exemption that explains no disagreement is not an exemption — …",
).toEqual([]);
```

Both come from **one pure `adjudicateExemptions`**, called by the live differential and by the proof
case. A proof case that re-implemented the rule would prove something about the copy.

## Both replacements PROVEN capable of failing

**In-suite, by constructed inputs** (`WR-04 the replacement assertions are LOAD-BEARING`):

| constructed input | result |
|---|---|
| a disagreeing cell matched by no exemption | `unexplained === ["PLANTED unexplained cell"]`, `dead === []` |
| E2 matching only an AGREEING cell (so the deleted liveness check would have passed) | `dead === ["E2"]`, `unexplained === []` |
| an exempt cell that AGREES beside an exempt cell that DISAGREES | `unexplained === []`, `dead === []` — **no red** |
| the retired equality reconstructed from its own two operands, on that same input | the two sets are **NOT** equal — it would have failed on a corpus in which nothing is wrong |
| a clean input | `{ unexplained: [], dead: [] }` — non-vacuity |

**Out of suite, against the REAL corpus** — the executor's red team, three planted defects in the
committed harness, each reverted:

```
PROBE 1  E2's match rule narrowed to nothing (the "repair" the old equality invited)
         -> AssertionError: a disagreement with the loader that NO named exemption covers.

PROBE 2  a planted rule matching only a shape that never disagrees
         -> AssertionError: an exemption that explains no disagreement is not an exemption …
            + "PLANTED-DEAD — matches a shape that never disagrees"

PROBE 3  E1 widened to `() => true`
         -> AssertionError: the exempt cells must be a strict MINORITY of the 565 the loader
            accepted: expected 565 to be less than 282.5
```

## The never-exemptible assertion is UNCHANGED and independent

Quoted verbatim, untouched by this plan:

```ts
expect(
  unsafe,
  `a module GRANT where the loader has none, or a module NO-GRANT where the loader grants, is NEVER exemptible:\n${unsafe.join("\n")}`,
).toEqual([]);
```

`unsafe` is accumulated directly in the per-cell loop from `moduleVerdict` and `loaderVerdict` and is
**never consulted by, nor consults, the exemption machinery**. Over the widened 960-cell corpus it is
`[]`.

## Did the widening change which exemptions are live?

**No.** Both E1 and E2 explain disagreeing cells over the widened corpus (E1 matched 32, E2 matched
52); the `dead` set is empty. Token-presence disagreements moved **39 → 78** and the exempt-cell count
moved to **78** — the corpus tripled and the two exemptions scaled with the shapes they name.

---

# The executor's adversarial red team

Mandatory, run against the REBUILT committed build after all three tasks were green.

## Six planted-defect probes against the new oracles — all fired

| probe | plant | result |
|---|---|---|
| 1 | E2's match rule narrowed to nothing | `unexplained` fires |
| 2 | an exemption matching only agreeing cells | `dead` fires, naming it |
| 3 | E1 widened to `() => true` | minority floor fires: `expected 565 to be less than 282.5` |
| 4 | an eleventh ledger family row written into `frontmatter.ts` | the two-sided count fires, printing the planted row |
| 4b | …then the count deliberately raised to 10 (the maintainer's act) | **still fires BY NAME**: `a failure family named in the module's ledger with NO axis-member combination that builds it` + the planted row |
| 5 | the builder emits one continuation too few | `expected 2 to be 3` naming the cell |
| 6 | a key-line axis member renamed out from under the floor | `A: key-line member "nested block mapping, mid-line quote": expected undefined to be defined` |

Every plant was reverted and the tree verified clean.

## A 3456-cell sweep wider than the committed corpus, on three builds

24 key-line shapes (the committed 20 plus four the axis does **not** carry: a three-level nested block
mapping, a plain nested mapping with no quote, a three-dash compact sequence, a JSON-adjacent mapping
inside a nested flow sequence) x 8 continuation openers x 6 token placements x **depths 2, 3 and 4**:

```
                                                     PRE-27-47   PRE-27-48    HEAD
cells                                                     3456        3456    3456
loader-REJECTED                                           1585        1585    1585
module REFUSES (loud, third verdict)                       315         147     165
MODULE GRANTS / LOADER DOES NOT   (must be 0)                0           0       0
MODULE SILENT / LOADER GRANTS     (must be 0)              294           0       0
NAME SET DIVERGES on the ok:true arm (must be 0)           294           0       0
```

**294 red against pre-`27-47`, 0 against this build.** Stated honestly: this sweep is CR-01-shaped, so
it reports 0 against pre-`27-48` too — it would not have caught the CR-02 defect `27-48` closed. It is
complementary, never universal, and it is reported that way rather than as a clean bill.

## What the red team FOUND — a scope overclaim in this plan's own floor

The floor derives its family list from the **ledger**, and the ledger records failures the module has
**CLOSED**. An OPEN bypass has no ledger entry and is outside the derived set **by construction**.
Left unstated, "every ledger family is buildable" would have been read as "every known defect is
expressible" — the coverage-claim-in-a-comment this floor exists to replace, one level out.

Fixed in `dfc8b13`: the floor's source now states what it does not claim and names family G/G2 as the
live counterexample.

## Family G/G2, RE-MEASURED on this build — STILL OPEN

```
module (scripts/frontmatter.js at d56aa7a):
G  nested folded block scalar          {"ok":true,"value":false}     <-- STILL OPEN
G2 block scalar as a sequence item     {"ok":true,"value":false}     <-- STILL OPEN

loader (/usr/bin/ruby -ryaml):
ACCEPT  G  => {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}
ACCEPT  G2 => ["Read, # x, Agent(grugops-orchestrator)"]
```

`27-49` touched only the test file, so it neither opened nor closed it. **Not added to the corpus
here**, deliberately: a corpus shape for a live silent-no-grant would put the differential's
never-exemptible direction into failure over a defect round 10 owns under a different root cause in a
different function, and this plan's own prohibitions state that it adds corpus and assertions and
decides nothing about whether a document grants. Recorded OPEN in `deferred-items.md` with the
suggested direction: close family G first, add the axis member in the same plan.

---

# Prohibition compliance

## NO UNIVERSAL CLAIM OVER A HAND-LISTED LITERAL — every case title in the touched region

| case title | derivation behind it / narrowing applied |
|---|---|
| `D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader on token presence, except the named safe-direction exemptions` | "every loader-accepted cell **of a GENERATED corpus**" — the corpus is `20 x 6 x 4 x 2 = 960`, asserted equal to the product of the four axis lengths; the expectation is the loader's |
| `D-51 red-team — no FLOW-CONTEXT node start YAML defines returns the SILENT no-grant arm, over a set DERIVED from § 7.4's productions` | **NARROWED** from "no MID-LINE node start"; derivation `10 x 6 x 3 = 180`, asserted two-sided; block-context half relocated to the D-52 corpus and named at both sites |
| `WR-02 the derived flow node-start corpus is LOADABLE and every cell's loaded value GRANTS — the premise the universal sweep rests on` | "every cell" = the same derived 360; both lists asserted `[]`, length asserted against the product |
| `WR-01 the cell builder emits EXACTLY the requested continuation depth — counted from its own output over every cell` | "every cell" = the full four-axis product, `checked` asserted equal to it and `> 0` |
| `WR-01 the expressibility floor — every failure family the module's OWN LEDGER names is BUILDABLE by this generator, derived from the ledger at run time` | "every failure family the ledger names" = derived at run time from source, count two-sided (9); scope caveat stated in source (the ledger holds CLOSED failures only) |
| `WR-04 the replacement assertions are LOAD-BEARING — each is fired by a constructed input and names the offender, and an exempt cell that AGREES no longer turns the harness red` | no universal quantifier; every claim is a constructed input with its asserted result |
| `WR-03 the name-set predicate — a REFUSAL and an EMPTY NAME SET are constructed side by side and record DIFFERENT verdicts` | 27-48's; no quantifier — two constructed values |
| `WR-03 the name-set predicate — SET equality, never cardinality: three names matching three names over two different sets still fails` | 27-48's; no quantifier — two constructed values |
| `WR-03 the name-set predicate DELEGATES to the module's own enumeration, asserted rather than described` | 27-48's; a bounded four-member literal, and the case's claim is about the delegation each member exhibits, not about a set |
| `WR-03 the predicate is LOAD-BEARING — the row a1 shapes are in the corpus, and this build agrees with the loader on them` | 27-48's; scoped to the two `NAMED_REGIONS`, asserted by equality against them |
| `D-52 the no-loader skip path is EXERCISED — a machine without the loader produces a PRINTED reason, and that is measured here rather than assumed` | no quantifier — one constructed absent interpreter, both probe arms driven |
| `D-52 non-circularity — the corpus generator names no symbol of the module under test, and the expectation is the loader's rather than any function of the module` | "no symbol" ranges over the file-scope `MODULE_SYMBOLS`, which is itself asserted to contain no stale entry against the module's comment-filtered CODE |

## The remaining prohibitions

| prohibition | evidence |
|---|---|
| AN ASSERTION THAT CANNOT FAIL IS A DEFECT | E1 and E2's bounds **deleted**; arithmetic above shows `matched = product − loader-rejected` on both, measured 32/48 and 52/64; the replacement minority floor fired at probe 3 |
| AN ASSERTION MUST NOT PRESSURE A MAINTAINER TOWARD WEAKENING A SAFETY RULE | the equality is split; the exempt-and-agreeing input is constructed and produces **no red**, and the retired equality is reconstructed from its own operands and shown to have gone red on it |
| THE CORPUS IS NEVER GENERATED BY CALLING THE CODE UNDER TEST | `D-52 non-circularity` passes and now inspects `buildCellParts`, `AXIS_CONTINUATION_DEPTH` and `FILLER` as well. Its `MODULE_SYMBOLS` list is reconciled: `27-47` introduced `ScalarState`, `FRESH_NODE`, `assertItemPathScalarClosed` and removed `nodeStartQuote`; `27-48` renamed `nodeOnKeyLine` to `nodeStarted` and added `seqIndent`. All present; the stale-entry check runs over the comment-filtered CODE and `nodeOnKeyLine` is asserted absent from it. `27-49` introduced **no module symbol** |
| NO SECOND OR WEAKER SPAWN-GRANT PREDICATE | `git diff --stat 94bac76..HEAD` touches `scripts/frontmatter.test.ts` and `deferred-items.md` only. **No production predicate changed.** The one predicate this plan extracted (`adjudicateExemptions`) is a harness rule, and it was extracted precisely so a second copy would not exist |
| A GREEN SUITE IS NEVER OFFERED AS EVIDENCE | every claim carries a RED/GREEN transcript, a loader transcript with versions, a derived count, or a fired planted defect. The loader-rejected count is printed per run; the per-family rejection is reported (28 of 48 per new family, none wholesale) |
| NO NEW DEV DEPENDENCY | `git diff --stat -- package.json package-lock.json` is **empty** (0 lines) |
| Prototype pollution / path traversal | canon; referral only, no assertion authored |

---

# Deviations from Plan

### 1. [Rule 1 — Bug, in this plan's own first draft] The seven new shapes were GREEN on the build they exist to catch

- **Found during:** Task 1, by taking the RED transcript **before** writing the axis members.
- **Issue:** the first cut placed the quote at offset 0 of the continuation line. Prose-identical to
  the ledger's families A/B/C/F; measured **0 silent** against the pre-`27-47` mirror.
- **Fix:** the shipped members end at the **mid-line** node start with the quote already open, which
  is where arm 4's missing `depth > 0` decides. 54 silent cells, all seven families red.
- **Recorded in source** so "we added the family" is not read as "the family is a pin".

### 2. [Rule 2 — Correctness] WR-02's title was narrowed as well as derived

The plan permits derive **or** retitle. Deriving alone would have left `no MID-LINE node start YAML
defines` standing over a **flow-only** derivation — a universal claim over a set that does not contain
its own counterexamples (families A, B, F, D are block-context). Both were applied and the relocation
is named at both sites.

### 3. [Rule 2 — Correctness, found by red team] The expressibility floor's scope was overstated

Full write-up above. The ledger holds CLOSED failures; the floor cannot cover an OPEN bypass, and
family G/G2 is the live counterexample. Fixed in `dfc8b13`.

### 4. [Measured correction to a review claim] "Arithmetically incapable of failing" needed scoping

The review states the bound "can never fail". Measured: it is unfailable over **corpus** variation
(its stated purpose) but **does** fire on a match rule decoupled from its declared flags (probe 3:
matched 565 against a bound of 48). Both the source comment and this summary state the scoped truth,
and the detection the deletion gives up is recorded in `deferred-items.md`.

### 5. [Measured] The sweep's context array is 21, not the review's 11

Recorded at both figures above; the executor's measurement governs.

---

# Verification

| gate | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1259 passed, 2 skipped, 0 failed** — stated as a FLOOR, explicitly NOT evidence that no bypass remains (family G/G2 does) |
| `npx vitest run … scripts/frontmatter.test.ts` | **190 passed** (188 before this plan's two new WR-01 cases, +1 WR-02 premise, +1 WR-04 proof; the D-51 sweep was rewritten in place) |
| `npm run typecheck` | exit 0 |
| `npm run build && npm run freshness` | exit 0 — "All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild." |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `git diff --stat -- package.json package-lock.json` | empty |
| `git status --porcelain` | clean of scratch artifacts; every mirror lived outside the working tree |

# Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

# Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change; no
production file touched. The register's `mitigate` rows each have their evidence above —
T-27-09-14 (the hand-listed corpus, RED/GREEN transcripts + the 960-cell derivation),
T-27-09-15 (the universal title, derived and narrowed with both counts),
T-27-09-16 (the unfailable bound, deleted with its arithmetic and its scoped residual),
T-27-09-17 (the pressuring equality, split and both halves fired),
T-27-09-18 (runtime, 83ms in one batched process, no threshold asserted),
T-27-09-19 (the coverage claim, now derived from the ledger at run time and fired by probes 4/4b).
T-27-09-SC's mitigation is ASSERTED ABSENCE and is confirmed by the empty `package.json` /
`package-lock.json` diff — recorded so an empty package audit is not read as a skipped one.

# What the next round must own

1. **The OPEN family G/G2 bypass** — re-measured against this build with its loader column and
   recorded in `deferred-items.md`. `BLOCK_INDICATOR` is still applied at exactly one of the places
   YAML allows a block-scalar header. Close it, then add the nested-block-scalar header to
   `AXIS_KEY_LINE` **in the same plan**, so the corpus grows with the fix rather than after it.
2. **The WR-04 residual** — the per-rule detection the deleted bound gave up, with the suggested
   derivation (a ceiling from a quantity the rule does not read) recorded.
3. **The eleven value-map cells** and the flattener-nesting scope question, still carried from
   `27-47` and `27-48`: settle once, not twice from two symptoms.
4. **The standing question this round adds.** The last five rounds asked what a predicate's conditions
   come from, what set it enumerates, what its application set is, what its input is assembled from,
   and which of two expressions the consumers read. This one asks it of the HARNESS instead of the
   module: **when a case title carries a universal quantifier, ask what set its EVIDENCE enumerates —
   and then ask the same question of the derivation you just wrote.** Deriving the flow-context node
   starts made the sweep honest about its evidence and left the title claiming the block-context half
   as well; the second application of the same question is what caught it. A derivation is not a
   defence against over-claiming. It only moves the claim one level up.

# Self-Check: PASSED

```
FOUND: scripts/frontmatter.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: 4863f87  test(27-49): the corpus gains the shapes YAML's grammar names and a depth axis (WR-01)
FOUND: c9537b0  test(27-49): the mid-line node-start sweep is DERIVED and its title names its bound (WR-02)
FOUND: d56aa7a  test(27-49): every assertion in the exemption region can fail (WR-04)
FOUND: dfc8b13  docs(27-49): the expressibility floor's SCOPE is named, and family G/G2 re-measured OPEN
```
