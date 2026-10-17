---
phase: 27-spawn-correctness-kit-set-authority
plan: 47
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, node-start, guard_wr05, gap-closure-round-9]
status: complete
requires:
  - "scripts/frontmatter.ts — the D-51 single-authority comment scanner (27-43)"
  - "scripts/check-foundation-guards.ts — guard_wr05 and guard_distribution_pair"
provides:
  - "the node-start answer as a property of STRUCTURAL POSITION rather than of enumerated spellings"
  - "jsonLikeKeyJustClosed — YAML 1.2's real flow separation rule, tracked in the same walk"
  - "the compact-nested-sequence re-entry (one dash consumes one level)"
  - "scripts/fixtures/frontmatter-singleline-pre-d54.json — the frozen pre-edit within-line capture"
affects:
  - "guard_wr05's verdict on every shipped adapter, skill and packaging template"
  - "the KIT-03 closure equality and coordinator-resolution-precheck, via grantedAgentNames"
tech-stack:
  added: []
  patterns:
    - "remove a condition the grammar never had; never append a spelling arm"
    - "track the deciding fact in the walk that already visits the character"
    - "three module verdicts, not two — a refusal is never folded into the no-grant column"
key-files:
  created:
    - scripts/fixtures/frontmatter-singleline-pre-d54.json
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md
decisions:
  - "D-54 implemented in full: two indicator arms lost a `depth > 0` condition, one separation fact was added to the walk, one item-path re-entry. No fifth arm; the chain still has five arms."
  - "The continuation site passes `startsNode` for the new line-start fact, NOT an unconditional `true` — measured, because `true` would have made the module grant where the loader has none."
  - "`NODE_PROPERTY_AT_NODE_START`'s verbatim alternative is left WIDER than YAML's, deliberately: narrowing it was tried, measured and reverted because it moves 20 previously-reachable cells in the SHORTEN direction."
  - "`jsonLikeKeyJustClosed` is walk-local and does NOT cross the line boundary, because a flow mapping split between the closing quote and its separator is a document libyaml rejects outright."
metrics:
  duration: ~75 min
  completed: 2026-08-09
actuals:
  tokens: 61000
  tasks: 3
  commits: 5
---

# Phase 27 Plan 47: The Node Start Is A Structural Position Summary

Closed CR-01 — the ninth consecutive spawn-grant bypass — by removing a `depth > 0` condition YAML
never stated from two indicator arms and tracking the JSON-like separation fact in the same walk;
all four gate families flip from `ALL CHECKS PASSED` at exit 0 to a named coordinator-spawn-grant
failure. **A TENTH, DIFFERENT bypass reproduces on the post-fix build and is recorded OPEN below —
this plan is not clean.**

## READ THIS FIRST: the plan is NOT clean

The plan's own success criteria are met and every acceptance criterion below carries its transcript.
But the mandatory adversarial red-team against the **rebuilt** `scripts/frontmatter.js` found a
**live bypass that still reproduces end to end at the gate**, in a different predicate:

```
===== GATE TRANSCRIPTS :: mirror of 6891699 (POST-FIX) =====
CONTROL one-line grant                    :: exit=1 :: 1 CHECK(S) FAILED
FAMILY A nested block mapping             :: exit=1 :: 1 CHECK(S) FAILED
FAMILY B compact nested sequence          :: exit=1 :: 1 CHECK(S) FAILED
FAMILY C flow-map JSON adjacency          :: exit=1 :: 1 CHECK(S) FAILED
FAMILY F block explicit key               :: exit=1 :: 1 CHECK(S) FAILED
FAMILY G  nested folded block scalar      :: exit=0 :: ALL CHECKS PASSED     <-- OPEN
FAMILY G2 block scalar as a sequence item :: exit=0 :: ALL CHECKS PASSED     <-- OPEN
```

`BLOCK_INDICATOR` is applied at exactly ONE of the places YAML allows a block-scalar header — a
top-level key line — so a nested `|`/`>` scalar's LITERAL content is passed through `stripComment`
and the item boundary, where a leading `#` hides a token and a leading `-` invents a name. It is
**PRE-EXISTING** (byte-identical against `62b8b53`), so D-54 neither opened nor closed it. Full
seven-row measurement table, loader column, gate transcripts, the measured false-red cost of the
obvious alternative, and the six shapes that did NOT reproduce are in `deferred-items.md` §
"From 27-47 — OPEN LIVE BYPASS". It is not fixed here because it is a different root cause in a
different function and a hasty heuristic is what has failed for nine rounds.

## The eight-row measurement table

Loader column from `/usr/bin/ruby -ryaml`, versions printed once:

```
RUBY=2.6.10 PSYCH=3.1.0 LIBYAML=0.2.1
```

### RED — the COMMITTED `scripts/frontmatter.js` on a `git archive HEAD` mirror of `62b8b53`, before any edit

```
row     hasSpawnGrant                                 tools value
--------------------------------------------------------------------------------------------------------------
CONTROL {"ok":true,"value":true}                      ["Read, Agent(grugops-orchestrator)"]
A       {"ok":true,"value":false}                     ["nested: \"Read,"]
B       {"ok":true,"value":false}                     ["- \"Read,,"]
C       {"ok":true,"value":false}                     ["{\"a\":\"Read,"]
D       {"ok":true,"value":false}                     ["a: \"Read,,"]
E       {"ok":true,"value":false}                     ["a: b: \"Read,"]
F       {"ok":true,"value":false}                     ["? \"Read,  : v"]
H       {"ok":true,"value":false}                     ["{\"a\" :\"Read,"]
C2      {"ok":true,"value":false}                     ["[{\"a\":\"Read,"]
XCTL    {"ok":true,"value":false}                     ["{\"a\"x:\"Read,"]
```

**Every RED reproduced.** No row was dropped and no row failed to reproduce.

### The loader column over the same regions

```
row	verdict	loader value for `tools`
----------------------------------------------------------------------------------------------------
CONTROL	ACCEPT	"Read, Agent(grugops-orchestrator)"
A	ACCEPT	{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}
B	ACCEPT	[["Read, # x, Agent(grugops-orchestrator)"]]
C	ACCEPT	{"a"=>"Read, # x, Agent(grugops-orchestrator)"}
D	ACCEPT	[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]
E	ACCEPT	{"a"=>{"b"=>"Read, # x, Agent(grugops-orchestrator)"}}
F	ACCEPT	{"Read, # x, Agent(grugops-orchestrator)"=>"v"}
H	ACCEPT	{"a"=>"Read, # x, Agent(grugops-orchestrator)"}
C2	ACCEPT	[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]
XCTL	REJECT	Psych::SyntaxError: (<unknown>): found unexpected ':' while scanning a plain scalar at line 2 column 12
```

### GREEN — the rebuilt committed `.js`

```
row     hasSpawnGrant                                 tools value
--------------------------------------------------------------------------------------------------------------
CONTROL {"ok":true,"value":true}                      ["Read, Agent(grugops-orchestrator)"]
A       {"ok":true,"value":true}                      ["nested: \"Read, # x, Agent(grugops-orchestrator)\""]
B       {"ok":true,"value":true}                      ["Read, # x, Agent(grugops-orchestrator)"]
C       {"ok":true,"value":true}                      ["{\"a\":\"Read, # x, Agent(grugops-orchestrator)\"}"]
D       {"ok":true,"value":true}                      ["a: \"Read, # x, Agent(grugops-orchestrator)\""]
E       {"ok":true,"value":true}                      ["a: b: \"Read, # x, Agent(grugops-orchestrator)\""]
F       {"ok":true,"value":true}                      ["? \"Read, # x, Agent(grugops-orchestrator)\" : v"]
H       {"ok":true,"value":true}                      ["{\"a\" :\"Read, # x, Agent(grugops-orchestrator)\"}"]
C2      {"ok":true,"value":true}                      ["[{\"a\":\"Read, # x, Agent(grugops-orchestrator)\"}]"]
XCTL    {"ok":true,"value":false}                     ["{\"a\"x:\"Read,"]
```

`XCTL` is the one row whose verdict is UNCHANGED, and that is the loader's own answer: it REJECTS
that document, so there is no value to grant from and the module's no-grant answer agrees with a
loader that computes nothing.

## The branch chain, quoted in full, before and after — arm count 5 → 5

### Before

```ts
if (c === "[" || c === "{") {                       // arm 1
  depth += 1; mayBegin = true;
} else if (c === "]" || c === "}") {                // arm 2
  depth = depth > 0 ? depth - 1 : 0; mayBegin = false;
} else if ((c === "," || c === "?") && depth > 0) { // arm 3
  mayBegin = true;
} else if (                                          // arm 4
  c === ":" &&
  depth > 0 &&
  (i + 1 >= s.length || /[ \t]/.test(s[i + 1]))
) {
  mayBegin = true;
} else if (c !== " " && c !== "\t") {                // arm 5
  mayBegin = false;
}
```

### After (comments elided; they are in the source)

```ts
if (c === "[" || c === "{") {                       // arm 1
  depth += 1; mayBegin = true; jsonLikeKeyJustClosed = false;
} else if (c === "]" || c === "}") {                // arm 2
  depth = depth > 0 ? depth - 1 : 0; mayBegin = false; jsonLikeKeyJustClosed = true;
} else if (                                          // arm 3 — SAME arm, one condition REPLACED
  (c === "," || c === "?") &&
  (depth > 0 || (c === "?" && atStructuralStart && separationFollows(i)))
) {
  mayBegin = true; jsonLikeKeyJustClosed = false;
} else if (                                          // arm 4 — SAME arm, `depth > 0` REMOVED
  c === ":" &&
  (separationFollows(i) || (depth > 0 && afterJsonLikeKey))
) {
  mayBegin = true; jsonLikeKeyJustClosed = false;
} else if (c !== " " && c !== "\t") {                // arm 5
  mayBegin = false; jsonLikeKeyJustClosed = false;
}
```

**Arm count before: 5. Arm count after: 5.** Arm 3 traded `depth > 0` for a disjunct that keeps the
comma's flow scoping untouched and gives the explicit-key indicator the condition YAML states. Arm 4
lost `depth > 0` outright and kept its separation condition, widened to YAML 1.2's real rule. No arm
was appended, and no spelling was enumerated.

## The single-line differential — NOT byte-identical, and the difference is named

The plan's acceptance criterion asked for byte-identity. **The measurement says otherwise, so the
measurement is what is reported.**

```
derived corpus: 6194 input(s) x 24 state(s) = 148656 comparison(s)
TEXT differences: 4 cell(s) over 1 input(s): ["a: !<x #y> z"]
every difference is pre-is-a-strict-prefix-of-post (the LENGTHEN / fail-red direction): true
"a: !<x #y> z" state#0: pre="a: !<x " post="a: !<x #y> z"
"a: !<x #y> z" state#1: pre="a: !<x " post="a: !<x #y> z"
"a: !<x #y> z" state#2: pre="a: !<x " post="a: !<x #y> z"
"a: !<x #y> z" state#3: pre="a: !<x " post="a: !<x #y> z"
```

Corpus size **derived at run time** (6194 inputs × 24 states), never written into an assertion. All
four cells are at flow depth 0 on one input, and libyaml REJECTS that document
(`did not find the expected '>' while scanning a tag`), so no loader value is contradicted. Every
move LENGTHENS the returned text — a token behind that hash becomes MORE visible, never less.

The obvious tidy-up (narrowing `NODE_PROPERTY_AT_NODE_START`'s verbatim alternative to `<[^\s>]*>`)
**was tried, measured and reverted**: it moves 24 cells, of which 20 are positions the pre-edit build
already reached, and every one moves in the SHORTEN direction — deleting text at a `#`, which is this
module's founding failure. Both numbers are recorded in the constant's doc block.

## The ten gate transcripts — four families plus the control, times two builds

Planted on **both** distribution twins (`skills/plan/SKILL.md` and
`.claude/skills/grugops-plan/SKILL.md`) on hermetic `git archive` mirrors.

```
===== GATE TRANSCRIPTS :: mirror of 62b8b53 (PRE-FIX) =====
CONTROL one-line grant             :: exit=1 :: 1 CHECK(S) FAILED
                                      first finding: FAIL  WR-05 coordinator-spawn-grant violation:
                                      names coordinator-spawn-grant: true | both twins named: true | distribution-pair FAIL: false
FAMILY A nested block mapping      :: exit=0 :: ALL CHECKS PASSED
FAMILY B compact nested sequence   :: exit=0 :: ALL CHECKS PASSED
FAMILY C flow-map JSON adjacency   :: exit=0 :: ALL CHECKS PASSED
FAMILY F block explicit key        :: exit=0 :: ALL CHECKS PASSED
                                      (each: names coordinator-spawn-grant: false | both twins named: false)

===== GATE TRANSCRIPTS :: mirror of 6891699 (POST-FIX) =====
CONTROL one-line grant             :: exit=1 :: 1 CHECK(S) FAILED
FAMILY A nested block mapping      :: exit=1 :: 1 CHECK(S) FAILED
FAMILY B compact nested sequence   :: exit=1 :: 1 CHECK(S) FAILED
FAMILY C flow-map JSON adjacency   :: exit=1 :: 1 CHECK(S) FAILED
FAMILY F block explicit key        :: exit=1 :: 1 CHECK(S) FAILED
   (each: first finding = "FAIL  WR-05 coordinator-spawn-grant violation:",
          names coordinator-spawn-grant: true | both twins named: true | distribution-pair FAIL: false)
```

The finding text was read on every red before the movement was recorded. The full post-fix finding
for family A:

```
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

**No distribution-pair FAIL appears in any post-fix transcript**, so every red is attributable to the
grant and to nothing else. **The control exits 1 on both builds**, so its meaning is unchanged.

## The two-directional loader adjudication

Corpus generated from the positions this plan touched (16 shapes × 2 quoting styles × 2 token
placements), derived and reported; every region handed to `/usr/bin/ruby -ryaml` in ONE batched
process; three module verdicts and not two.

```
                                             PRE-FIX (62b8b53)   POST-FIX
cells enumerated (derived 16 x 2 x 2)              64                64
loader-REJECTED cells                               4                 4
  ...of which the module GRANTS                     2                 2
module REFUSES, loader accepts                      0                 0
MODULE GRANTS / LOADER DOES NOT   (must be 0)       0                 0
MODULE NO-GRANT / LOADER GRANTS   (must be 0)      20                 0
```

In-suite line from the committed case:

```
D-54 loader adjudication — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | cells 64 (16 x 2 x 2) | loader-rejected 4 (module grants on 2) | module-refuses 0 | grants-loader-does-not 0 | silent-while-loader-grants 0
```

The 20 pre-fix disagreements are listed in full in the execution transcript; every one is the
silent-no-grant direction over a loader-accepted grant.

**The 4 loader-rejected cells are counted and reported on their own rather than folded into either
direction** — a document the loader cannot read has no value to agree with. The 2 on which the module
grants are the `{"a"x:` control with the token in plain sight; they are IDENTICAL on both builds, so
D-54 did not create them, and the module failing red over content no platform will load is the safe
direction.

## The repository-wide value map — zero cost, parser isolated

Both corpus sizes derived at run time from `git ls-files '*.md'`; the BEFORE image taken from the
mirror of `62b8b53` before any edit, the AFTER image taken with the rebuilt module over the **same
HEAD bytes**, so the parser's effect is isolated from the one document line this plan edited.

```
derived corpus BEFORE 1149 / AFTER 1149 (equal: true)
arms changed   : 0
values changed : 0
NEW REFUSALS   : 0
```

`new refusals` is **0**. No file's arm or value moved, so there is no changed value needing a loader
transcript.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] The repository suite was RED at HEAD before any edit, and it blocked this plan's verify gate**

- **Found during:** Task 1, first run of `npx vitest run scripts/frontmatter.test.ts`.
- **Issue:** `D-49 false-red control` failed. `27-VERIFICATION.md` (committed at `c28f415`, four
  commits before this plan) carries the two characters `\` `n` inside a `reason: >` folded block
  scalar; `flattenBlock` has no nesting, so it collapses `gaps:` into one string and applies D-30's
  double-quote escape allowlist to text libyaml never reads as a double-quoted scalar.
- **Proof it is PRE-EXISTING:** `PRE-FIX build arm: refuse / POST-FIX build arm: refuse / same
  reason: true`, and the repository-wide value map independently reports `new refusals: 0`.
- **Loader column:** libyaml **ACCEPTS** the document and returns the backslash and the `n`
  literally — so the module's refusal is a false red, D-34's named worse direction.
- **Fix:** the ONE offending line was rewritten into the `/` line-separator notation the rest of this
  phase already uses. No meaning changed. **The module-side defect is logged to `deferred-items.md`
  so the notation change does not stand in for a fix**, together with the observation that the suite
  was red at HEAD for four commits — itself the WR-01/WR-02 harness-integrity class `27-49` owns.
- **Commit:** `e658394`

**2. [Rule 1 — Bug, then REVERTED on measurement] `NODE_PROPERTY_AT_NODE_START`'s verbatim alternative admits whitespace**

- **Found during:** Task 1, by the single-line differential.
- **Issue:** `<[^>]*>` admits `!<x #y>`, which YAML 1.2 § 5.6 does not define and libyaml rejects.
- **Attempted fix:** narrow to `<[^\s>]*>`. **Measured and REVERTED** — it moves 24 cells instead of
  4, and 20 of them are positions the pre-edit build already reached, every one in the SHORTEN
  direction. The narrower grammar is the more correct one and the wider one is the safer one; where
  those disagree this module takes the safe direction on documents no loader accepts.
- **Outcome:** the constant is UNCHANGED and both measurements are recorded in its doc block and in
  `deferred-items.md`.

**3. [Rule 2 — Correctness] The continuation seeding site passes `startsNode`, not the plan's literal `true`**

- **Found during:** Task 1, probing the plan's instruction ("the two continuation-side sites pass
  true") against the loader before implementing it.
- **Issue:** libyaml reads `description: see` / `  ? "quoted` / `  # x, T"` as `see ? "quoted` — the
  `?` is CONTENT on a line continuing an already-begun scalar, and the hash line is a COMMENT.
  Passing `true` unconditionally would have made this module report a **GRANT where the loader has
  none** — the never-exemptible direction, opened by the fix meant to close its mirror image.
- **Fix:** the continuation site passes `startsNode`, which already answers "may a node begin on this
  line". Pinned by `D-54 continuation control` and by two corpus shapes in the adjudication.
- **Commit:** `e658394`

**4. [Recovered] `deferred-items.md` was briefly overwritten**

Written with `Write` on a file that already existed, destroying 128 lines of prior entries. Caught
immediately by `git status` showing `M` rather than `??`, restored with
`git checkout -- <file>`, and re-applied by APPENDING. The final file contains every prior entry
plus the new ones; verified by `git diff --stat` showing insertions only.

### The old comment's false-red argument was corrected, not repeated

The `?` arm's comment argued for flow scoping on the basis that `description: ? maybe` is
documentation a loader accepts. **Measured: libyaml REJECTS that document outright**
(`mapping keys are not allowed in this context`). The position is still kept as content — but for the
reason that survives measurement (the line did not begin there, so `lineStartAtOffsetZero` is false
at the key-line site), not for the one that did not.

## Prohibition compliance

| Prohibition | Evidence |
|---|---|
| A parse artifact is never reported as "carries no grant" | All eight rows return the grant arm or a named refusal; none returns `{ok:true,value:false}` where the loader grants. `XCTL` is loader-REJECTED. |
| No fifth enumerated arm | The chain is quoted in full above; **5 arms before, 5 after**. Two lost a condition. |
| No second or weaker spawn-grant predicate | The three seeding sites each perform ONE assignment and condition it on nothing: `stripComment(itemText, cur.state, true, true)`, `stripComment(t, cur.state, startsNode, startsNode)`, `stripComment(rest, FRESH_NODE, true, false)` — each followed by `cur.state = scanned.state;`. |
| A green suite is never offered as evidence | Every claim above carries a RED/GREEN transcript or a loader transcript with versions. The suite result is stated as a **floor** below. |
| No false red on documentation a loader accepts | Repository-wide value map: `new refusals: 0` over 1149 derived files, parser isolated. |
| No new dev dependency | `git diff --stat -- package.json package-lock.json` is **empty** (0 lines). |
| No universal claim over a hand-listed literal | Every count names its deriving expression: `6194 x 24`, `16 x 2 x 2`, `git ls-files '*.md'`. |
| Prototype pollution / path traversal | Canon; referral only, no assertion authored. |

## Verification

| Gate | Result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — "All build outputs fresh: 32 committed .js file(s) match a fresh tsc rebuild." |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1234 passed, 2 skipped, 0 failed** — stated as a FLOOR, explicitly NOT evidence that no bypass remains (one does; see the top of this file) |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `git status --porcelain` | empty of scratch artifacts; every mirror lived outside the working tree |

## Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change. The
threat register's `mitigate` rows T-27-09-01 … T-27-09-06 each have their evidence above;
T-27-09-SC's mitigation is asserted absence and is confirmed by the empty `package.json` diff.

## Self-Check: PASSED

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: scripts/fixtures/frontmatter-singleline-pre-d54.json
FOUND: e658394  fix(27-47): the node-start answer is a structural position...
FOUND: 6891699  fix(27-47): a dash consumes exactly one level...
FOUND: 555a40a  docs(27-47): ledger entry ten — the conditions the arms carried
FOUND: 67f0b7f  docs(27-47): record an OPEN live bypass found by the executor's red team
```

## What the next round must own

1. **The OPEN family G/G2 bypass** (nested block-scalar headers) — measured, gate-reproduced, and
   fully written up in `deferred-items.md` with the false-red cost of the obvious alternative
   already quantified at 4 of 1149 files.
2. **DEF: the flattener's escape refusal over non-double-quoted text** — the reason the suite was red
   at HEAD for four commits.
3. **The standing question ledger entry ten leaves:** before accepting a predicate as structural, ask
   which of its conditions come from the FORMAT and which came from the shape of the last example
   someone tested. A condition satisfied by every example in the corpus is invisible to that corpus.
