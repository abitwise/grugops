---
phase: 27-spawn-correctness-kit-set-authority
plan: 48
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, node-start, name-set, kit-03, gap-closure-round-9]
status: complete
requires:
  - "scripts/frontmatter.ts — D-54's structural node-start walk (27-47)"
  - "scripts/frontmatter.test.ts — the D-49 sweep, the D-49 named cross-check and the D-52 loader differential"
provides:
  - "the node-started fact set at all THREE node-introducing sites, renamed to what it means"
  - "seqIndent — the block-sequence exception as an INDENT with one stated reason"
  - "the line-level node-start answer agreeing with the walk's own answer"
  - "the NAME-SET predicate in both differential harnesses, with a three-verdict discipline"
affects:
  - "the KIT-03 closure equality and coordinator-resolution-precheck, via grantedAgentNames"
  - "guard_wr05's verdict on every shipped adapter, skill and packaging template"
  - "378 non-guard `.planning/` metadata keys, whose flattened value moves to the loader-agreeing text"
tech-stack:
  added: []
  patterns:
    - "set the fact where it becomes true, at EVERY site that makes it true — not at the one the field was named after"
    - "an exception is an INDENT with a stated reason, never a second grammar"
    - "the line-level answer to a question the walk already answers IS the walk's answer"
    - "compare the fact the consumer is computed over (the NAME SET), not the boolean beside it"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-55 implemented in full: the rename, the three set-sites, the indent-bounded block-sequence exception, the retired (c) framing, and the name-set predicate in both harnesses."
  - "The fold condition moved from `inScalar` to `!startsNode`. `inScalar` is a strict subset; the old condition left the invented name alive in the block-sequence spelling of direction (a)."
  - "The item path sets `nodeStarted = v !== \"\"` — the KEY LINE's rule spelled identically — rather than the plan's `true`. Measured: an unconditional `true` read a genuine YAML anchor as text on four D-52 cells where libyaml resolves it."
  - "`startsNode` gained a third disjunct, `cur.state.nodeMayBegin`, AFTER the executor's red team reproduced a live silent-no-grant at the gate on the build without it. The line-level expression was a second, weaker predicate for a fact the walk already held."
  - "The D-52 E2 exemption was WIDENED, and its omission named: it was written when `valueNodeOnContinuation` was the only declared route to a node start on the first continuation line, which made it a claim about one of the two."
metrics:
  duration: ~110 min
  completed: 2026-08-09
actuals:
  tokens: 128000
  tasks: 3
  commits: 6
---

# Phase 27 Plan 48: The Node Begins At Both Places It Can Begin Summary

Closed **CR-02** — one omission seen from three sides, an invented name on the success arm, a module
grant the loader does not have, and three false refusals — by setting the node-started fact at every
site that makes it true and bounding the block-sequence exception by indent; closed **WR-03** in the
same plan by giving both differential harnesses the NAME SET, the fact KIT-03 is actually computed
over. **The executor's own red team found a live silent-no-grant that THIS PLAN OPENED, reproduced it
end to end at the gate, and it is fixed in `01e2b2f`** — that history is below in full because a
summary that only reports the final state hides the shape of the near-miss.

## READ THIS FIRST: what this plan did NOT close

- **The 27-47 family G/G2 bypass is STILL OPEN**, re-measured against the rebuilt build and recorded
  in `deferred-items.md`. `BLOCK_INDICATOR` is still tested at exactly one of the places YAML allows a
  block-scalar header. This module is **not bypass-free**.
- **A green suite is a FLOOR here and nothing else.** It was green in all nine rounds in which a
  defect was later found, and it was green on the intermediate build of THIS plan while a live
  silent-no-grant took the whole foundation gate to `ALL CHECKS PASSED` at exit 0.

## Loader versions, printed once

```
RUBY=2.6.10 PSYCH=3.1.0 LIBYAML=0.2.1
```

## The eight measured rows plus seven controls — RED, loader, GREEN

### RED — the COMMITTED `scripts/frontmatter.js` on a `git archive` mirror of `89705ba`, before any edit

```
===== MODULE PROBE :: mirror of 89705ba (PRE-48, COMMITTED build) =====
a1             grant={"ok":true,"value":true}       value=["Agent(alpha, ga, mma)"]
               names=["alpha","ga","mma"]
a2             grant={"ok":true,"value":true}       value=["Agent(alpha, ga - mma)"]
               names=["alpha","ga - mma"]
a3             grant={"ok":true,"value":false}      value=["intro, not an item"]
b1             grant={"ok":true,"value":true}       value=["Read, \"Write, # x, Agent(grugops-orchestrator)\""]
               names=["grugops-orchestrator"]
b2             grant={"ok":true,"value":true}       value=["Read,, \"Write, # x, Agent(grugops-orchestrator)"]
               names=["grugops-orchestrator"]
c1             REFUSED: `*emphasis* here` uses a YAML anchor or alias, or an unresolved YAML tag ...
c2             REFUSED: `&D work here` uses a YAML anchor or alias, or an unresolved YAML tag ...
c3             REFUSED: `!important stuff` uses a YAML anchor or alias, or an unresolved YAML tag ...
ctl-seq        grant={"ok":true,"value":false}      value=["Read, Write"]
ctl-deepdash   grant={"ok":true,"value":false}      value=["Read,, still text"]
ctl-wrap       grant={"ok":true,"value":false}      value=["Read, - Write"]
ctl-seqnames   grant={"ok":true,"value":true}       names=["alpha","ga","mma"]
ctl-ws         grant={"ok":true,"value":false}      value=["Read, Write"]
ctl-cmt        grant={"ok":true,"value":false}      value=["Read, Write"]
ctl-itemindent grant={"ok":true,"value":false}      value=["Read,, Write,, Third"]
```

**Every RED reproduced.** No row was dropped and no row failed to reproduce. Two rows the objective's
table did not carry are ALSO red and are recorded as measured rather than quietly folded in:
`ctl-deepdash` (the more-indented dash was read as a second ITEM) and `ctl-seqnames` (direction (a)
in the block-sequence spelling).

### The loader column over the same regions

```
===== LOADER COLUMN =====
a1             ACCEPT  "Agent(alpha, ga - mma)"
a2             ACCEPT  "Agent(alpha, ga - mma)"
a3             ACCEPT  "intro - not an item"
b1             ACCEPT  "Read, \"Write,"
b2             ACCEPT  ["Read, \"Write,"]
c1             ACCEPT  "see the docs *emphasis* here"
c2             ACCEPT  "see the docs &D work here"
c3             ACCEPT  "see the docs !important stuff"
ctl-seq        ACCEPT  ["Read", "Write"]
ctl-deepdash   ACCEPT  ["Read, - still text"]
ctl-wrap       ACCEPT  "Read, - Write"
ctl-seqnames   ACCEPT  ["Agent(alpha, ga - mma)"]
ctl-ws         ACCEPT  ["Read", "Write"]
ctl-cmt        ACCEPT  ["Read", "Write"]
ctl-itemindent ACCEPT  ["Read,", "Write,", "Third"]
```

### GREEN — the rebuilt committed `.js`

```
===== MODULE PROBE :: REBUILT (POST-27-48, red-team fix) =====
a1             grant={"ok":true,"value":true}       value=["Agent(alpha, ga - mma)"]
               names=["alpha","ga - mma"]                      <- the invented name is GONE
a2             grant={"ok":true,"value":true}       value=["Agent(alpha, ga - mma)"]
               names=["alpha","ga - mma"]                      <- UNCHANGED
a3             grant={"ok":true,"value":false}      value=["intro - not an item"]
b1             grant={"ok":true,"value":false}      value=["Read, \"Write,"]   <- STOPS granting
b2             grant={"ok":true,"value":false}      value=["Read, \"Write,"]   <- STOPS granting
c1             grant={"ok":true,"value":false}      value=["see the docs *emphasis* here"]
c2             grant={"ok":true,"value":false}      value=["see the docs &D work here"]
c3             grant={"ok":true,"value":false}      value=["see the docs !important stuff"]
ctl-seq        grant={"ok":true,"value":false}      value=["Read, Write"]      <- byte-identical
ctl-deepdash   grant={"ok":true,"value":false}      value=["Read, - still text"]
ctl-wrap       grant={"ok":true,"value":false}      value=["Read, - Write"]    <- byte-identical
ctl-seqnames   grant={"ok":true,"value":true}       names=["alpha","ga - mma"]
ctl-ws         grant={"ok":true,"value":false}      value=["Read, Write"]      <- byte-identical
ctl-cmt        grant={"ok":true,"value":false}      value=["Read, Write"]      <- byte-identical
ctl-itemindent grant={"ok":true,"value":false}      value=["Read,, Write,, Third"]  <- byte-identical
```

Every row's flattened value now equals the loader's, and the three block-sequence / wrapped-scalar
controls plus the two adjacency-edge rows are byte-identical to the pre-edit build, quoted above from
both.

**The adjacency edge:** `ctl-ws` (`tools: ` — whitespace only) and `ctl-cmt` (`tools: # c` — comment
only) both return `Read, Write` on both builds, and the suite asserts they are equal to each other.
The two spellings differ by one character and only one of them was ever exercised before this plan.

**The item-indent boundary, both sides:** a dash AT the item indent still re-enters the item rule
(`ctl-itemindent`, three items, `Read,, Write,, Third`, byte-identical); a dash MORE INDENTED than it
is text (`ctl-deepdash`, `Read, - still text`, matching libyaml's `["Read, - still text"]` where the
pre-edit build invented a comma).

## The rename is complete in code

```
code occurrences of nodeOnKeyLine (comment-filtered) : 0
source occurrences (comments narrate the rename)     : 3
code occurrences of nodeStarted                      : 7
code occurrences of seqIndent                        : 5
```

## THE NEAR-MISS: a live silent-no-grant this plan OPENED, found by the executor's red team

The plan's own three tasks were complete, all 184 cases were green, and both differential harnesses
agreed with the loader. The mandatory adversarial sweep against the **rebuilt** `scripts/frontmatter.js`
found this:

```
===== D-55 RED TEAM :: build at 208af47 (the plan's three tasks, complete and green) =====
cells (derived 18 shapes x 8 openers x 6 token placements) : 864
loader-REJECTED                                            : 369
module REFUSES (loud, third verdict)                       : 129
MODULE GRANTS / LOADER DOES NOT   (must be 0)              : 0
MODULE SILENT / LOADER GRANTS     (must be 0)              : 2     <-- FOUNDING FAILURE
NAME SET DIVERGES on the ok:true arm (must be 0)           : 2

SILENT-WHILE-LOADER-GRANTS nested seq under a mapping | double quote | behind a hash, quote-closed
    region="name: x\ntools:\n  nested:\n    - \"Read,\n    # x, Agent(grugops-orchestrator)\"\n"
    loader-flat="nested: Read, # x, Agent(grugops-orchestrator)"
SILENT-WHILE-LOADER-GRANTS nested seq under a mapping | single quote | behind a hash, single-quote-closed
NAME-SET  (the same two cells)  module=[]  loader=["grugops-orchestrator"]
```

### Reproduced END TO END AT THE GATE, the standard this phase set

Planted on **both** distribution twins of the non-coordinator skill `plan`
(`skills/plan/SKILL.md` and `.claude/skills/grugops-plan/SKILL.md`), on hermetic `git archive`
mirrors:

```
===== GATE TRANSCRIPTS :: mirror of 208af47 (INTERMEDIATE, before the red-team fix) =====
CONTROL one-line grant                         :: exit=1 :: FAIL  WR-05 coordinator-spawn-grant violation
RED-TEAM nested seq under a mapping (dq)       :: exit=0 :: ALL CHECKS PASSED     <-- LIVE BYPASS
RED-TEAM nested seq under a mapping (sq)       :: exit=0 :: ALL CHECKS PASSED     <-- LIVE BYPASS
CR-02 b1 (module grant, loader has none)       :: exit=0 :: ALL CHECKS PASSED

===== GATE TRANSCRIPTS :: the FIXED tree =====
CONTROL one-line grant                         :: exit=1 :: FAIL  WR-05 coordinator-spawn-grant violation
RED-TEAM nested seq under a mapping (dq)       :: exit=1 :: FAIL  WR-05 coordinator-spawn-grant violation
RED-TEAM nested seq under a mapping (sq)       :: exit=1 :: FAIL  WR-05 coordinator-spawn-grant violation
CR-02 b1 (module grant, loader has none)       :: exit=0 :: ALL CHECKS PASSED

===== GATE TRANSCRIPTS :: mirror of 89705ba (PRE-27-48, COMMITTED) =====
CONTROL one-line grant                         :: exit=1
RED-TEAM nested seq under a mapping (dq)       :: exit=1
RED-TEAM nested seq under a mapping (sq)       :: exit=1
CR-02 b1 (module grant, loader has none)       :: exit=1     <-- a FALSE RED, closed by this plan
```

No `distribution-pair FAIL` appears in any transcript, so every red is attributable to the grant.
`CR-02 b1` exiting 0 on the fixed tree is the CORRECT answer and is the whole of direction (b): the
loader reads no token there, so a red gate on that content was a false red — visible here as the one
row that moves from exit 1 to exit 0.

### The root cause, and why the cure is not a fourth fact

`nested:` raised `nodeStarted` for the WHOLE key while `seqIndent` was still `null`, so the deeper
dash stopped being an item, the quote after it opened at a non-node-start, its state died at the line
boundary, and the token line was stripped as a comment.

`stripComment` computes offset 0's node-start answer as
`nodeStartAtOffsetZero || entering.nodeMayBegin`. The SCANNER already called those lines node starts.
The line-level `startsNode` was a **second, weaker predicate for a fact the walk already held** — the
class this module has now deleted four times. So `startsNode` gained the walk's own answer:

```ts
const startsNode =
  !inScalar &&
  (!cur.nodeStarted || indent === cur.seqIndent || cur.state.nodeMayBegin);
```

**It cannot reopen CR-02**, and that is asserted through the exported scanner rather than argued: a
plain scalar's last character takes the chain's final arm, so `Agent(alpha, ga`, `Read,`,
`see the docs` and `intro` all leave `nodeMayBegin` false, while `nested:` leaves it true.

### After the fix

```
===== D-55 RED TEAM :: REBUILT (POST-27-48, red-team fix) =====
cells                                                      : 864
loader-REJECTED                                            : 369
module REFUSES (loud, third verdict)                       : 147
MODULE GRANTS / LOADER DOES NOT   (must be 0)              : 0
MODULE SILENT / LOADER GRANTS     (must be 0)              : 0
NAME SET DIVERGES on the ok:true arm (must be 0)           : 0

===== the same sweep against the PRE-27-48 committed build (89705ba) =====
MODULE GRANTS / LOADER DOES NOT                            : 0
MODULE SILENT / LOADER GRANTS                              : 0
NAME SET DIVERGES on the ok:true arm                       : 6    <-- CR-02 direction (a)
```

## Task 2 — the (c) "safe-direction contract" is RETIRED

### The framing paragraph, quoted in full BEFORE

At the truth table:

```
// plain: no quoting, so the sigils mean what YAML says they mean — and a node property is
// refused here at the continuation placement too, because with no value on the key line this
// module reads every indented line as a node start. That is the ONE named module contract in
// this table and it is a measured, pre-existing divergence from libyaml in the safe direction.
```

At the expected-outcome rule:

```
//   6. Member 9 is PLAIN, so rules 2-4 decide it — with ONE module contract that must be named
//      rather than smuggled in. Where the key line carries no value, this module treats EVERY
//      indented line at the value's indentation as a NODE START (the `nodeOnKeyLine` rule recorded
//      in the module header), so a node property is refused at BOTH placements rather than only at
//      the first. MEASURED DIVERGENCE, RECORDED RATHER THAN DISCOVERED: libyaml continues the plain
//      scalar instead and loads `tools:` / `  Read,` / `  *Agent(x)` as text, so two of those
//      refusals (`*` and `&` at `continuation`) are a FALSE RED. It is PRE-EXISTING — measured
//      IDENTICAL on the pre-D-51 and post-D-51 committed builds, cell for cell — and D-51's
//      prohibitions forbid re-cutting the node-start reference test in this plan. It points in the
//      safe direction (a loud refusal, never a hidden grant) and is carried, named, to 27-44.
```

### The replacement, quoted in full AFTER

```
// (27-48, D-55 point 3 — 27-REVIEW-GAPS-8 § CR-02 direction (c)) A SIXTH RULE STOOD HERE AND IT IS
// RETIRED. It said this module treats EVERY indented line of a valueless key as a node start, named
// the resulting refusals a MEASURED DIVERGENCE in the safe direction, and carried them forward.
//
//   WHAT WAS MEASURED WAS REAL. `tools:` / `  Read,` / `  *Agent(x)` was refused and libyaml loads
//   it as text. That has been re-measured against the D-55 build and the loader, cell by cell, and
//   is recorded in 27-48-SUMMARY.md.
//
//   WHAT THE FRAMING DID IS WHY IT IS GONE. The refusals shared ONE root cause with two directions
//   that are neither safe nor recorded: an INVENTED NAME on the `ok:true` arm (`tools:` /
//   `  Agent(alpha, ga` / `  - mma)` enumerated ["alpha","ga","mma"] where libyaml expresses
//   ["alpha","ga - mma"]) and a MODULE GRANT THE LOADER DOES NOT HAVE (`tools:` / `  Read,` /
//   `  "Write,` / `  # x, TOKEN"`). Naming one direction and calling it "the ONE named module
//   contract" retired the only signal that its siblings existed, and both were live for a further
//   round. A measured divergence is RECORDED AS A DIVERGENCE; it is never promoted to a contract.
//
//   AND NO REPLACEMENT ONE-DIRECTION CLAIM IS WRITTEN HERE, deliberately. The reason this paragraph
//   replaced a rule rather than restating it is that a rule naming one direction made its siblings
//   invisible; a new one would do the same thing to whatever direction is next.
```

It states three things and no more, and it contains no claim that any single direction is safe.

### Every re-adjudicated row, with its loader transcript — INCLUDING the two that did not move

Region: `tools:` / `  Read,` / `  <sigil>Agent(grugops-orchestrator)`, placement `continuation`.

```
RE-ADJUDICATION :: style=`value node on continuation, plain` | placement=continuation

comment `#`          PRE=ok grant=false POST=ok grant=false loader=ACCEPT "Read,"
                     loader grants: false   module POST value: ["Read,"]                 UNCHANGED
alias   `*`          PRE=refuse         POST=ok grant=true  loader=ACCEPT "Read, *Agent(grugops-orchestrator)"
                     loader grants: true    module POST value: ["Read, *Agent(grugops-orchestrator)"]
tag     `!`          PRE=refuse         POST=ok grant=true  loader=ACCEPT "Read, !Agent(grugops-orchestrator)"
                     loader grants: true    module POST value: ["Read, !Agent(grugops-orchestrator)"]
anchor  `&`          PRE=refuse         POST=ok grant=true  loader=ACCEPT "Read, &Agent(grugops-orchestrator)"
                     loader grants: true    module POST value: ["Read, &Agent(grugops-orchestrator)"]
sequence dash `-`    PRE=ok grant=true  POST=ok grant=true  loader=ACCEPT "Read, - Agent(grugops-orchestrator)"
                     loader grants: true    module POST value: ["Read, - Agent(grugops-orchestrator)"]  UNCHANGED
```

The module's flattened value equals the loader's byte for byte on all five. Each row now records
**what the loader computes**, not a direction. The two UNCHANGED rows were re-measured, not assumed —
an unchanged row that was assumed is not evidence, which is how the three that moved stayed wrong for
a round.

**The (c) BOUNDARY did not move, and it is pinned:** a sigil on the FIRST continuation line of a
valueless key is still a genuine node start and is still refused (`description:` / `  *emphasis*`,
`  &anchor`, `  !tag` — all three `ok:false`). If that had moved, the fix would have traded three
false reds for a silently-resolved reference.

### The completeness arithmetic

```
TRUTH.length            : 60 before, 60 after
derived from            : SWEEP_SCALAR_STYLE.length (12) * SWEEP_SIGIL.length (5)
rows whose VALUE moved  : 3   (alias, tag, anchor at `continuation`)
rows whose COUNT moved  : 0
```

Recorded at the site: the claim's **nature** is unchanged — it is still a product of HAND-LISTED
AXES. Replacing its **source** with a generated corpus is `27-49`'s (WR-01/WR-02) work. An accounted
hand-off, written down, never a silent gap.

### Matchers reconciled, so no deleted phrase leaves an assertion passing vacuously

| Site | What referenced the retired framing | How it was reconciled |
|---|---|---|
| `expectedOutcome` rule 6 | the `refuse` BRANCH for style 9 x {alias, tag, anchor} | branch DELETED, not re-valued: rules 2-4 decide member 9 from YAML alone |
| `NAMED_CELLS` comment | "the five style-9 pairings where they do not [agree] are recorded in the expected-outcome rule" | retired with its target; module and loader now agree on all five, and the two that never disagreed were re-measured |
| `MODULE_SYMBOLS` | the entry `nodeOnKeyLine` | **renamed to `nodeStarted` + `seqIndent`.** This one was the dangerous case: `frontmatter.ts` still MENTIONS `nodeOnKeyLine`, in the comment narrating the rename, so the "every entry names something the module still declares" check would have gone on printing green over a name no code carries |
| the same check's predicate | `moduleSource.includes(s)` | now runs over the COMMENT-FILTERED code, and asserts `nodeOnKeyLine` is absent from code rather than present in the file |
| two prose paragraphs (`plain wrapped scalar` header, `family (b)` header) | named `nodeOnKeyLine` | restated as "the node-started fact (D-48's `nodeOnKeyLine`, renamed `nodeStarted` by D-55)" |

## Task 3 — both harnesses compare the NAME SET (WR-03)

### The four derived numbers, printed by the harness at run time

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 8c485d1e0b88314a
  | cells enumerated 312 + 2 named = 314 | loader-rejected (skipped) 97
  | token-presence disagreements 39 | NAME-SET disagreements 0 | 75ms
```

### The predicate reads the ALREADY-LOADED value — the code path, quoted

The loader program gained a SECOND FIELD in the SAME batched process; there is no second invocation:

```ts
"    { 'accepted' => true, 'value' => v.nil? ? '' : v.to_s, 'flat' => flat(v) }",
```

and the comparison reads that field:

```ts
const moduleNames = grantedAgentNames(document);
const loaderNames = loaderGrantedNames(verdict.flat ?? "");
```

### The helper delegates, and why that is not circular — quoted

```ts
const loaderGrantedNames = (loaderFlat: string): Parsed<string[]> =>
  keysGrantedAgentNames(new Map([["tools", [loaderFlat]]]));
```

`keysGrantedAgentNames` is **not the thing under test** — the FLATTENED VALUE is. Extracting names two
different ways would make every disagreement ambiguous: the difference could be the flattener's or the
extractor's, and the harness could not say which. One extractor makes the two sides differ in exactly
one variable. The extractor has its own pins elsewhere in the file (the value-corpus product, the
enumeration-legality cases, the grant-occurrence accounting), which is the only way a differential
over it can mean anything. The delegation is **asserted**, not described:

```ts
expect(loaderGrantedNames(flat), flat).toEqual(
  keysGrantedAgentNames(new Map([["tools", [flat]]])),
);
```

### A refusal is provably distinguishable from an empty name set

Both are CONSTRUCTED side by side and shown to record different verdicts:

```ts
const refusal = loaderGrantedNames("Read, Agent(alpha");   // unclosed enumeration
expect(nameVerdict(refusal)).toBe("refuse");
const empty = loaderGrantedNames("Read, Write");
expect(empty).toEqual({ ok: true, value: [] });
expect(nameVerdict(empty)).toBe("[]");
expect(nameVerdict(refusal)).not.toBe(nameVerdict(empty));
```

In the harness itself the refusals are collected into their own list, asserted to render `refuse` and
never `[]`, and asserted **non-vacuous** (the corpus contains 39 module refusals).

### SET equality, never cardinality

```ts
const a = loaderGrantedNames("Agent(alpha, beta, gamma)");   // 3 names
const b = loaderGrantedNames("Agent(alpha, beta, delta)");   // 3 names
expect(nameVerdict(a)).not.toBe(nameVerdict(b));
```

### The D-49 named cross-check carries the same comparison — its assertion, quoted

```ts
const moduleNames = grantedAgentNames(text);
const loaderNames = loaderGrantedNames(loaded);
if (moduleNames.ok) {
  expect(
    nameVerdict(moduleNames),
    `${where}: the module's NAME SET must EQUAL the set the same enumeration extracts from the loader's own flattened value (loader-flat=${JSON.stringify(loaded)})`,
  ).toBe(nameVerdict(loaderNames));
} else {
  expect(nameVerdict(moduleNames), where).toBe("refuse");
}
```

Its ruby one-liner's join moved from `|` to `, ` so both sides are flattened the same way; token
presence cannot notice, because the token is a whole element.

### The predicate is proven LOAD-BEARING — the pre-fix transcript

Row a1 is **NOT expressible as a product member** of the D-52 corpus, and that is measured rather
than asserted: every second-continuation shape carries `Agent(grugops-orchestrator)`, whose `(` lands
inside any enumeration a key-line shape opens and takes BOTH sides to the refusal arm. Two candidate
key-line members were enumerated in full — 48 cells — and produced `PRE name-set RED 0 / POST 0`,
with 42 of 48 module refusals. So the two a1 spellings are carried in as **NAMED REGIONS** riding the
same batch, with the total DERIVED as `product + NAMED_REGIONS.length`.

```
===== WR-03 NAME-SET PREDICATE :: mirror of 89705ba (PRE-27-48 COMMITTED BUILD) =====
cells enumerated       : 314  (312 corpus + 2 named)
loader-rejected        : 97
module refusals        : 32
NAME-SET disagreements : 2
CR-02 row a1 (the invented name)
    region      : "name: x\ntools:\n  Agent(alpha, ga\n  - mma)\n"
    module-names: ["alpha","ga","mma"]
    loader-names: ["alpha","ga - mma"]
    loader-flat : "Agent(alpha, ga - mma)"
CR-02 row a1, block-sequence spelling
    region      : "name: x\ntools:\n  - Agent(alpha, ga\n    - mma)\n"
    module-names: ["alpha","ga","mma"]
    loader-names: ["alpha","ga - mma"]
    loader-flat : "Agent(alpha, ga - mma)"

===== WR-03 NAME-SET PREDICATE :: REBUILT (POST-27-48) =====
cells enumerated       : 314  (312 corpus + 2 named)
loader-rejected        : 97
module refusals        : 39
NAME-SET disagreements : 0
```

A predicate that was never red is not a pin. This one is red against the build whose defect it exists
to catch and green against this one.

### The token-presence disagreement count moved 32 -> 39, and the reason is named

The seven new disagreements are all `module=refuse / loader=grant` on a `&w` at a node start inside a
FLOW collection. They are D-30's declared policy — an anchor at a genuine node start is refused rather
than resolved — reaching positions the module previously read as TEXT. **The E2 exemption was
widened, and its own omission is named at the site:** it was written when `valueNodeOnContinuation`
was the only declared route to a node start on the first continuation line, so it was a claim about
ONE of the two ways YAML gives. The second route is now a declared shape fact,
`flowNodeStartAtEndOfKeyLine` (the key line ends inside a flow collection just after `[`, `{`, `,` or
`?`), and E2's bound is re-derived from it. **The unsafe-direction set is still asserted EMPTY and is
empty.**

## The repository-wide value map — zero false-red cost, parser isolated

Both corpus sizes derived at run time from `git ls-files '*.md'`; the BEFORE image taken from the
mirror of `89705ba` before any edit, the AFTER image taken with the rebuilt module over the **same
HEAD bytes**, so the parser's effect is isolated.

```
derived corpus BEFORE 1150 / AFTER 1150 (equal: true)
arms changed   : 0
values changed : 378
NEW REFUSALS   : 0
```

`new refusals` is **0**. 378 files' values move, and the three questions that matter are all zero:

```
files whose GRANT verdict moved : 0
files whose NAME SET moved      : 0
guard-read keys (tools, allowed-tools, coordinator, name) that moved : 0
```

Every moved key is `.planning/` metadata with a NESTED block structure — `must_haves` (183),
`key-files` (175), `tech-stack` (171), `requires` (76), `coverage` (21) and eleven smaller ones — i.e.
exactly the shape whose deeper dashes stop being invented item boundaries. Not one is a key any guard
reads.

### Every changed value adjudicated against the loader, in one batched process

657 changed `(file, key)` cells, 8 loader-rejected, the remaining 649 handed to
`/usr/bin/ruby -ryaml` and compared on a CONTENT SIGNATURE (the value with every separator and quote
removed — byte equality is not the contract and never was, because the module flattens to a
token-presence surface and the loader returns a nested value):

```
changed cells adjudicated       : 657
loader-REJECTED regions         :   8
PRE  signature == loader        : 572
POST signature == loader        : 572
both agree                      : 572
cells the change made WORSE     :   0
```

**Zero cells got worse.** The 77 cells on which neither build's signature matches the loader are
IDENTICAL on both builds — pre-existing, unchanged by this plan, and accounted in `deferred-items.md`
rather than left to be rediscovered.

## Deviations from Plan

### **1. [Rule 1 — Bug, in this plan's own edit] The line-level node-start answer was weaker than the walk's, and that was a LIVE silent-no-grant**

Full write-up above under "THE NEAR-MISS", with the 864-cell sweep, the gate transcripts on three
builds, and the root cause. Found by the executor's mandatory adversarial red team against the
rebuilt build, **after** all three of the plan's tasks were complete and the whole suite was green.
Fixed in `01e2b2f`.

### **2. [Rule 2 — Correctness] The item path sets `nodeStarted = v !== ""`, not the plan's `true`**

- **Found during:** Task 1, by running the suite after the first draft.
- **Issue:** the plan says the item path "sets a separate `seqIndent` rather than raising the
  node-started fact". Both literal readings are wrong in a measurable direction:
  - **not raising it at all** made a MORE-INDENTED dash a second ITEM again (`ctl-deepdash` →
    `Read,, still text`) and left an anchor on an item's continuation refused, and
  - **raising it unconditionally** read a genuine YAML anchor as TEXT on four cells of the D-52
    corpus where libyaml RESOLVES it (`tools:` / `  -` / `    &w Write, TOKEN`) — the silent-no-grant
    direction, and it broke `D-51 row c1`'s two-part value.
- **Fix:** the item path spells the KEY LINE's rule identically — a sequence item introduces a node
  and begins it only if the line carries text — while `seqIndent` carries the exception. Pinned by
  `D-55 empty-dash item`.

### **3. [Rule 1 — Bug] The fold condition moved from `inScalar` to `!startsNode`**

`inScalar` was written when an OPEN QUOTE was the only way a line could continue an already-begun
node. Measured: with the old condition, `tools:` / `  - Agent(alpha, ga` / `    - mma)` still
enumerated `["alpha","ga","mma"]` — the invented name surviving in the block-sequence spelling of the
very direction D-55 closes. `inScalar` is a strict subset of `!startsNode`, so nothing that folded
before stops folding.

### **4. [Measured, then RETIRED] The escape-resolution shift**

An intermediate draft (before the walk's answer joined `startsNode`) folded a nested `- "…"` item into
its parent, so the flush stopped seeing one wholly-quoted scalar and `resolveDoubleQuoted` stopped
turning `\\` into `\`. That draft moved 20 cells of the repository-wide value map. **It is not what
shipped** — `items:` ends at a mapping separator, so the walk leaves a node start behind it and the
deeper dash is an item. The case is kept as a CONTROL, byte-identical to the pre-27-48 build, because
a shape that moved under one draft of a fix is exactly the shape a later draft moves again unnoticed.

### **5. [Ordering] Task 2's row expectations landed in Task 1's commit region**

Task 1's edit necessarily moves three rows of the truth table and the `expectedOutcome` rule, which
Task 2 owns. Task 1 was committed with those two cases RED **by design and stated in its commit
message**, and Task 2's commit retires the framing and re-adjudicates all five rows. No task's work
was folded into another's; only the interim gate was red, and only at the rows the next commit owns.

### **6. [Harness accident, recovered] `scripts/freshness.js` was left modified by a killed test run**

A full `npx vitest run` was killed at a 2-minute timeout mid-way through `freshness.test.ts`, which
appends `// drift` to `scripts/freshness.js` to exercise the stale path and restores it in teardown.
The kill skipped the teardown. Caught by `npm run freshness` reporting `STALE` and by
`git status --porcelain`; restored with `git checkout -- scripts/freshness.js`. No commit carried it.

## Prohibition compliance

| Prohibition | Evidence |
|---|---|
| A name is NEVER silently dropped or altered on the success arm | Row a1 asserts the enumerated set EQUALS the loader's (`["alpha","ga - mma"]`), and the failure message lists both sets. Over 1150 tracked files, `files whose NAME SET moved: 0`. Over the 864-cell sweep, `NAME SET DIVERGES: 0` (6 against the pre build). |
| A MODULE GRANT the loader does not have is never exemptible | b1 and b2 both stop granting and equal the loader's verdict; both harnesses' unsafe-direction set is asserted `[]` and is `[]`; the 864-cell sweep reports `MODULE GRANTS / LOADER DOES NOT: 0`. |
| A measured divergence is never enshrined as a contract | All five rows re-adjudicated with their loader transcripts (including the two that did not move); the framing quoted before and after; the replacement names no single direction as safe. |
| No second or weaker spawn-grant predicate | The name-set predicate reads `grantedAgentNames(document)` — the SAME `parseFrontmatter` the token predicate reads — and `verdict.flat` from the SAME batched loader process. No new grant decision path exists. The red-team fix DELETED a second predicate (the line-level node-start answer) rather than adding one. |
| A GREEN SUITE is never offered as evidence | Every claim carries a RED/GREEN transcript, a loader transcript with versions, a derived count or an exit code. The suite result is stated as a FLOOR below — and this plan is the case in point: 184 green cases sat over a live gate bypass. |
| No universal claim over a hand-listed literal | Every count names its deriving expression: `git ls-files '*.md'` (1150), `18 x 8 x 6` (864), `13 x 6 x 4 + 2` (314), `12 x 5` (60), `657` changed cells enumerated from the two value maps. |
| No new dev dependency | `git diff --stat -- package.json package-lock.json` is **empty** (0 lines). |
| Prototype pollution / path traversal | Canon; referral only, no assertion authored. |

## Verification

| Gate | Result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — "All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild." |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1255 passed, 2 skipped, 0 failed** — stated as a FLOOR, explicitly NOT evidence that no bypass remains (family G/G2 does) |
| `npx vitest run … scripts/frontmatter.test.ts` | 186 passed |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `git status --porcelain` | clean of scratch artifacts; every mirror lived outside the working tree |

## Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change.
T-27-09-08 (invented name), T-27-09-09 (grant the loader lacks), T-27-09-10 (false refusals),
T-27-09-11 (a divergent name set passing every harness) and T-27-09-12 (a retired framing hiding its
siblings) each have their evidence above. T-27-09-SC's mitigation is asserted absence and is confirmed
by the empty `package.json` / `package-lock.json` diff.

## What the next round must own

1. **The OPEN family G/G2 bypass** — re-measured against this build in `deferred-items.md` and
   byte-identical to `89705ba`. `BLOCK_INDICATOR` is still applied at exactly one of the places YAML
   allows a block-scalar header.
2. **The eleven value-map cells that disagree with the loader on BOTH builds**, and the scope question
   they share with `27-47`'s flattener-nesting entry: settle once, not twice from two symptoms.
3. **The standing question this round adds.** The last four rounds asked what a predicate's conditions
   come from, what set it enumerates, what its application set is, and what its input is assembled
   from. This one adds: **when two expressions in the same module answer the SAME question, ask which
   one the consumers read.** `stripComment` and `startsNode` both answered "may a node begin at offset
   0 of this line", they disagreed, and the weaker one was the one the item boundary and the reference
   test consulted. Nothing was red until a sweep asked the question at a shape nobody had written down.

## Self-Check: PASSED

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: 116df72  test(27-48): the CR-02 direction cases, RED against the committed build
FOUND: 172a873  fix(27-48): the node-started fact is set at BOTH places a node can begin
FOUND: 35ba647  test(27-48): the (c) safe-direction contract is RETIRED and its rows re-adjudicated
FOUND: 208af47  test(27-48): both differential harnesses compare the NAME SET, not a boolean (WR-03)
FOUND: 01e2b2f  fix(27-48): the line-level node-start answer is the WALK's answer
FOUND: 86b1fbc  docs(27-48): re-measure the OPEN family G/G2 bypass and account the value-map residual
```
