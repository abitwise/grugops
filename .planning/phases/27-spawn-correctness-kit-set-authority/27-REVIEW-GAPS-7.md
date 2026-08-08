---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-08T20:45:00Z
depth: deep
round: 7
files_reviewed: 6
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
findings:
  critical: 1
  warning: 2
  info: 5
  total: 8
status: issues_found
---

# Phase 27 (gap-closure round 7): Code Review Report

**Reviewed:** 2026-08-08T20:45:00Z
**Depth:** deep (adversarial, with hermetic-mirror reproduction and a libyaml differential)
**Files Reviewed:** 6
**Status:** issues_found — **1 live spawn-grant bypass reproduced end-to-end at exit 0**

## Summary

Round 7's four plans (27-39..27-42) are, in their own terms, correct: I traced each of the five
inverted assertions against `/usr/bin/ruby -ryaml` (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1) and
each inversion states what the loader actually computes. The `partitionPluginComponentClaims`
extraction is behaviour-preserving, the coverer-by-identity resolution is genuinely falsifiable, and
the two bucket cardinalities really do now stop a release. The suite is green (186 tests in the two
model suites; the gate, the validator and the freshness check all exit 0).

None of that is evidence of absence, and **round 7 shipped the seventh consecutive spawn-grant
bypass**. It is the *same* defect 27-39 was written to close — quote state reset at a line boundary —
surviving at the application points 27-39's fix did not reach. 27-39 promoted quote state to a
property of the scalar and then gated the carry on `nodeStartQuote`, which is correct; but it wired
that seeding into only **two** of the **three** places a node can begin, and into none of the places
a node begins *mid-line*. I reproduced the resulting silent no-grant on three separate live surfaces
(a plugin-form skill, its standalone twin, and a non-coordinator role agent adapter) with the whole
foundation gate printing `ALL CHECKS PASSED` at exit 0 while a real YAML loader reads the grant.

The round-6 lesson recorded in `frontmatter.ts` — *"ask what produced the value the predicate reasons
about, and whether that producer's state survives the construct's boundaries"* — is exactly right, and
27-39 applied it to one construct boundary and not to the others. The round-7 corollary written into
`frontmatter.test.ts` (*"a corpus generated over a SMALLER UNIT than the construct under test proves
nothing"*) is likewise right, and the sweep written to satisfy it is **structurally incapable** of
expressing either shape of this defect (WR-01).

Reproduction commands, mirrors and the differential harness were run entirely under
`/private/tmp/.../scratchpad`; the working tree is clean and no source file was modified.

## Narrative Findings (AI reviewer)

*(No `<structural_findings>` block was supplied for this round, so there is no fallow substrate
section. All findings below are from direct review.)*

---

## Critical Issues

### CR-01: `flattenBlock` still resets quoted-scalar state at a line boundary wherever the node does not begin at the start of a key line or a block-sequence item line — a live spawn grant is deleted as a comment and returned on the no-grant SUCCESS arm

**File:** `scripts/frontmatter.ts:823-828` (the continuation path), against `scripts/frontmatter.ts:807-810`
(the item path) and `scripts/frontmatter.ts:887-888` (the key-line path)
**Severity:** BLOCKER — reproduced live bypass, exit 0, on three shipped adapter surfaces.

#### The defect

D-48 promoted quote state to `Accumulator.openQuote` and gated the carry on `nodeStartQuote`, so that
an apostrophe inside a *plain* scalar cannot propagate a phantom open quote. That gate is correct and
I verified it against libyaml. But the seeding of `openQuote` at a **node start** was wired into only
two sites:

- the key line — `cur.openQuote = nodeStartQuote(rest) === null ? null : scanned.openQuote;` (:888)
- the block-sequence item — `cur.openQuote = nodeStartQuote(itemText) === null ? null : scanned.openQuote;` (:809-810)

The third site — the plain continuation path — does **not** seed at a node start. It reads:

```ts
const scanned = stripComment(t, cur.openQuote);
// A continuation line CONTINUES a node; it never starts one, so it can only ever carry a state
// FORWARD (until the scalar closes) and never OPEN one.
if (inScalar) cur.openQuote = scanned.openQuote;   // scripts/frontmatter.ts:828
```

The comment is false, and the file says so twelve lines above it. `startsNode` is computed at :789
precisely because a continuation line **can** be a node start — the `nodeOnKeyLine` doc block states
it outright: *"Where the key line carries NO value, the indented lines are themselves the node
starts."* When `startsNode` is true and the line opens a quoted scalar, `inScalar` is `false`, so the
carry is skipped and the scalar's state is lost at the line boundary. The next line is then handed to
`stripComment(t, null)`, a leading `#` is read as a comment start, and the **entire continuation is
discarded** — with the spawn token on it.

The same hole exists for a quoted scalar that opens **mid-line** (inside a flow collection). There
`nodeOnKeyLine` is `true`, so `startsNode` is `false` *and* `inScalar` is `false`, and the state is
again discarded.

This is round 6's CR-01 in the two spellings 27-39's fix did not reach. Note the shape: a predicate
split into arms (key line / item / continuation) whose **union is not** the set of node starts —
the repository's own recurring defect class, named in this very file.

#### Reproduction — parser level, against the committed `scripts/frontmatter.js`

| document | module | libyaml |
|---|---|---|
| `tools:` / `  "Read,` / `  # x, Agent(grugops-orchestrator)"` | `{ok:true,value:false}` | `"Read, # x, Agent(grugops-orchestrator)"` |
| `tools:` / `  'Read,` / `  # x, Agent(grugops-orchestrator)'` | `{ok:true,value:false}` | same |
| `tools: # c` / `  "Read,` / `  # x, Agent(…)"` | `{ok:true,value:false}` | same |
| `tools:  ` (trailing ws) / `  "Read,` / `  # x, Agent(…)"` | `{ok:true,value:false}` | same |
| `tools: [Read,` / `  "Write,` / `  # x, Agent(…)"]` | `{ok:true,value:false}` | `["Read", "Write, # x, Agent(…)"]` |
| `tools: {a: "Read,` / `  # x, Agent(…)"}` | `{ok:true,value:false}` | `{"a"=>"Read, # x, Agent(…)"}` |
| `tools:` / `  - Read` / `  -` / `    "Write,` / `    # x, Agent(…)"` | `{ok:true,value:false}` | `["Read", "Write, # x, Agent(…)"]` |

A 240-cell differential sweep over (key-line shape × continuation-1 shape × continuation-2 shape)
against libyaml produced **4 bypasses and 0 false reds** among the 74 cells libyaml accepts; every
bypass is one of the two families above.

#### Reproduction — end to end, hermetic `git archive HEAD` mirrors

**(a) plugin-form skill + its standalone twin** (`skills/plan/SKILL.md` and
`.claude/skills/grugops-plan/SKILL.md`, both edited identically so `guard_distribution_pair` stays
green):

```
allowed-tools:
  "Read, Write, Bash, Glob, Grep,
  # x, Agent(grugops-orchestrator)"
```

```
control (same grant on one line):  node scripts/check-foundation-guards.js -> exit 1
                                   FAIL  WR-05 coordinator-spawn-grant violation
bypass (the two lines above):      node scripts/check-foundation-guards.js -> exit 0
                                   ALL CHECKS PASSED
libyaml:                           "Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"
```

**(b) flow-collection spelling**, same two files:

```
allowed-tools: [Read, Write, Bash, Glob,
  "Grep,
  # x, Agent(grugops-orchestrator)"]
```
→ gate **exit 0**, `ALL CHECKS PASSED`; libyaml
`["Read","Write","Bash","Glob","Grep, # x, Agent(grugops-orchestrator)"]`.

**(c) a non-coordinator ROLE AGENT adapter** (`.claude/agents/grugops-qe-e2e.md`):

```
tools:
  "Read, Grep, Glob, Edit, Write, Bash,
  # x, Agent(grugops-orchestrator)"
```
```
node scripts/check-foundation-guards.js        -> exit 0   ALL CHECKS PASSED
VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js -> exit 0   ALL CHECKS PASSED
libyaml: "Read, Grep, Glob, Edit, Write, Bash, # x, Agent(grugops-orchestrator)"
```

`guard_wr05`'s parse-failure branch is *not* at fault here — it is fail-closed and correct. The
parser returns the **success** arm, so nothing downstream has anything to branch on. This is the
module's own founding failure: *"I could not read this"* printed as *"this carries no grant"*.

#### Fix — and why the obvious one-liner is NOT sufficient

I measured the naive fix (mirror the item path in the continuation path):

```ts
if (startsNode) cur.openQuote = nodeStartQuote(t) === null ? null : scanned.openQuote;
else if (inScalar) cur.openQuote = scanned.openQuote;
```

Against the differential corpus this closes family (a) — `q-cont-plain`, `q-cont-single`,
`q-cont-3line`, `q-cont-comment-keyline`, `key-trailing-ws`, `baseline-comment`, `q-cont-far`,
`allowed-tools-cont`, `seq-plain-then-quote` all flip to `GRANT` — and it introduces no new refusal
in the 240-cell sweep. **It does not close family (b):** `q-flow-cont` and `q-flow-cont-sq` still
return `{ok:true,value:false}` after the patch, because inside a flow collection the quote opens
mid-line and `nodeOnKeyLine` is already true. Do not ship the one-liner and call the class closed —
that is the enumerate-the-reported-spelling shape this phase has corrected six times.

The structural question the fix must answer is the one the file already knows how to ask: **quote
state belongs to the scalar, and a scalar's node start is not always the first token on a line.**
Two directions that are consistent with the module's existing discipline:

1. Make `nodeOnKeyLine` a three-state fact (`node has not begun` / `node began, plain` / `node began,
   inside a collection`) and let the collection state license `stripComment`'s exiting quote to cross
   a line boundary, since inside `[`/`{` a bare `#` is only a comment outside quotes anyway. This
   keeps the `nodeStartQuote` gate exactly where it is load-bearing (the plain scalar), which is the
   regression 27-39 caught with the 1131-file value-map comparison.
2. Or make the flow-collection depth an explicit part of the accumulator, so "am I inside a flow
   collection" is one fact with one source rather than being re-derived from `nodeOnKeyLine`.

Whichever is chosen, re-run the value-map comparison over `git ls-files '*.md'` before and after —
the round-7 record shows that is the only thing that caught the apostrophe regression.

---

## Warnings

### WR-01: the D-49 multi-line sweep is structurally incapable of expressing CR-01 — its style axis is a hand-listed 6-element set with a cardinality pin and no derivation

**File:** `scripts/frontmatter.test.ts:4184-4212` (`SWEEP_SCALAR_STYLE`), pinned at `:4336`

Every one of the six styles opens its scalar as the **first token after `tools:` on the key line**, or
as the first token of a block-sequence item:

```
plain / double-quoted / single-quoted / literal / folded  ->  `tools: <open>` + continuation
wrapped block-sequence item                               ->  `tools:` + `- <open>` + continuation
```

There is **no** style in which the value node begins on a continuation line, and **no flow-collection
style at all**. Both of CR-01's families are therefore outside the sweep's expressible space — the
sweep passed green, at 90 cells, over a live bypass, exactly as the round-6 sweep did.

This is the set-literal drift class one level up. `expect(SWEEP_SCALAR_STYLE.length).toBe(6)` pins the
list against *shrinking*; nothing pins it against *incompleteness*, and the file's own header states
the corollary it then fails to apply (*"ask what its cells are made of and whether the defect class
can even be expressed in one"*). The same is true of the hand-written `TRUTH` table at `:4426-4463`,
whose completeness claim (`TRUTH.length === STYLE.length * SIGIL.length`) is a claim about the
*product of two hand-listed axes*, not about the construct.

**Fix:** add axis-1 members for (i) `tools:` with the value node opening on the continuation line, in
each quoting style; (ii) a flow sequence and a flow mapping whose quoted item spans lines; (iii) a
block-sequence item whose `-` line carries no value and whose quoted scalar opens on the item's own
continuation. Then derive the completeness claim from something other than the list itself — the
cheapest honest version is a differential harness against `/usr/bin/ruby -ryaml` over a *generated*
corpus (the D-49 loader cross-check at `:4494` already establishes the mechanism and the printed-skip
precedent; today it checks only 6 named cells). A sweep whose corpus and whose expectation are both
hand-written over the same axes cannot fail on an axis nobody thought of.

### WR-02: `stripFencedBlocks` runs over the whole document *before* the frontmatter block is located, so a column-0 fence inside the frontmatter region deletes content and the result is returned on the SUCCESS arm

**File:** `scripts/frontmatter.ts:1435-1437` (`parseFrontmatter`), `scripts/frontmatter.ts:230-244`

The fence authority is applied to the raw text, so its line-dropping applies inside the frontmatter
region as readily as inside the body. Measured against the committed build:

```
---                                            module: {ok:true, keys=[["name",["r"]]]}
name: r                                                 -> the whole `tools` key VANISHED,
```` ``` ````                                           -> hasSpawnGrant = {ok:true,value:false}
tools: Read, Agent(grugops-orchestrator)
```` ``` ````
---
```

and

```
---                                            module: {ok:true, tools=["Read,"]}
name: r                                                 -> the token was DELETED from the value,
tools: Read,                                            -> hasSpawnGrant = {ok:true,value:false}
```` ``` ````
  Agent(grugops-orchestrator)
```` ``` ````
---
```

**Honest scoping — this is NOT a confirmed live bypass.** Both documents are `Psych::SyntaxError`
under libyaml, because a column-0 ```` ``` ```` line is not a legal node in a top-level block
mapping, and I could not construct a spelling that libyaml accepts (in flow or quoted contexts YAML
requires the continuation to be indented, so the fence cannot sit at column 0). A third document —
`tools: "Read` / fence / token / fence / `"` — *is* accepted by libyaml as a grant, and the module
**refuses** it (the safe direction). I state plainly that I could not close the loop to a platform
impact here.

What is nonetheless defective is the contract: the module's own rule is that content it cannot
account for goes to the `ok:false` arm, and here content is silently *removed* and the truncated
result is reported as a value. On an agent adapter the `tools`-absence floor would fire loudly; on a
skill adapter or a packaging template nothing would. The narrow, direction-correct fix is to locate
the delimiter region **first** and fence-strip only the body used for the prose checks (or to refuse
when a fence delimiter falls inside the located frontmatter region), rather than to widen the strip.

---

## Info

### IN-01: the spawn-token accounting's count-identity arm is unreachable and unexercised — the exact IN-03 shape plan 27-42 spent a plan closing, shipped anew by 27-41 in the same round

**File:** `scripts/frontmatter.ts:1775-1784`

`accountSpawnOccurrences` pushes exactly one of three string literals into `kind`, and
`GRANT_OCCURRENCE_KINDS` holds those same three, so `classified !== occurrences.length` is provably
false for every input to today's code. No case in `scripts/frontmatter.test.ts` exercises it (grep for
`does not balance` returns only the source). Plan 27-42 lifted `partitionPluginComponentClaims` out of
the guard precisely so its unreachable arm could be *fired by a case* — and states the rule: *"a
future-proofing arm nobody can test is a promise, not a floor."* Apply the same remedy: make
`accountSpawnOccurrences` (or a pure classifier taking an occurrence list) reachable from a case that
hands it a fourth, unclassified kind, and assert the refusal fires by name.

### IN-02: the one-grammar detector's two construct arrays are hand-listed with no cardinality pin

**File:** `scripts/frontmatter.test.ts:3170-3179` (`HEAD_DELIMITER_CONSTRUCTS`, `KEY_LINE_CONSTRUCTS`)

Every other set in this phase carries a two-sided or floor cardinality assertion; these two do not.
Dropping a member narrows the detector while the load-bearing assertion
(`expect(sites).toEqual(["scripts/context-io.ts","scripts/generate-catalog.ts"])`) keeps passing,
because the two live files still match through the remaining patterns. That is the "refusal claim
shrinks silently" shape `REFUSED_FORMS`'s own floor at `:636` exists to prevent, one file over. Add
`expect(HEAD_DELIMITER_CONSTRUCTS).toHaveLength(3)` / `expect(KEY_LINE_CONSTRUCTS).toHaveLength(3)`,
and ideally assert each construct is individually load-bearing for at least one planted fixture. (The
scan's *semantic* limits are already disclosed honestly at `:3153-3158` — that part is good.)

### IN-03: the item path's `stripComment` seed is provably a constant, and its comment claims otherwise

**File:** `scripts/frontmatter.ts:806-810`

```ts
const scanned = stripComment(itemText, cur.openQuote);
```
is reached only when `item !== null`, which requires `startsNode`, which requires `!inScalar`, i.e.
`cur.openQuote === null`. The comment says the seed is `cur.openQuote` "rather than a literal null so
this path reads the carried state like every other" — but the state it reads is a constant, so the
sentence describes a property the code does not have. Harmless today; it is the kind of comment this
module's own standing rule (*a comment claiming a property never ships without the assertion that
makes it true*) forbids. Either assert `cur.openQuote === null` at that point or state the invariant
plainly instead of implying a live read. **Note this interacts with CR-01's fix:** once a continuation
line can legitimately open a scalar, re-derive whether this invariant still holds.

### IN-04: `partitionPluginComponentClaims.foreign` can name the same key more than once

**File:** `scripts/kit-model.ts:474`

`claimedKeys.filter((k) => !schemaKeys.includes(k))` is not de-duplicated, so a key claimed by two
buckets *and* absent from the schema is interpolated twice into the guard's failure message. The
`doubleClaimed` arm de-duplicates implicitly (it filters over `schemaKeys`); `foreign` does not. Only
the single-occurrence case is pinned (`kit-model.test.ts` asserts `foreign` `toEqual(["themes"])`).
Cosmetic, but the guard's message is a contract the cases pin, so decide it rather than leave it.

### IN-05: a multi-document YAML stream diverges from libyaml on the success arm, and the module's three-outcome partition comment does not mention streams

**File:** `scripts/frontmatter.ts:1395-1430`, `scripts/frontmatter.ts:1499-1512`

`---` / `name: r` / `tools: Read` / `---` / `name: r2` / `tools: Read, Agent(grugops-orchestrator)` /
`---` returns `{ok:true, tools=["Read"]}` — the module reads only the first region, libyaml reads a
two-document stream and the second document carries the grant.

`UNKNOWN - verify`: most markdown frontmatter readers also take only the first `---`…`---` region, so
the platform very likely agrees with the module and this is **not** claimed as a bypass. It is
recorded because the module's carefully-partitioned "three outcomes and no fourth state" argument
enumerates delimiter spellings exhaustively and never mentions what a *second* document in the stream
means — an unconsidered adjacency, which is how this file's own record says the WR-05 arms came to be
written one rule short. Disposition it in the header (even as "the platform reads one block; a stream
is out of scope") rather than leaving it unstated.

---

## What I checked and could NOT falsify

Stated so this report is not read as broader coverage than it has:

- **Anchors / aliases / merge keys / tags** — refused correctly at every application point I could
  reach, including `<<: *x` (fails `KEY_LINE`, loud) and the bare non-specific tag.
- **Invisible code points at the prologue and both delimiter positions** — `U+FEFF` (second BOM),
  `U+200B`, `U+2060`, `U+180E`, `U+202E` (bidi), `U+00A0`, combining marks, unassigned and
  private-use, plane-14 tag space: every spelling I tried either parses to the grant or refuses
  loudly. No silent-success found. The `rendersNoVisibleGlyph` prologue widening is, as claimed, a
  strict superset of `trim() === ""` and can only skip more.
- **The two deliberately FROZEN in-block `trim()` sites** — an invisible-only line inside the block
  reaches the key-line refusal (loud), and an invisible-only baseline line likewise. The recorded
  direction argument holds.
- **CRLF, tabs as indentation, tab after the key colon** — all parse to the grant.
- **Key-shape smuggling** — a quoted key (`"tools":`), an explicit key (`? tools`), a spaced key
  (`tools :`) and a top-level flow mapping all **refuse** where libyaml grants. Safe direction,
  correctly loud.
- **Block-scalar indentation indicators** (`|2`, `>-`, `|+`) — parse to the grant.
- **The block-scalar flush exemption (27-40)** — verified in both directions; `coordinator: |` /
  `  "true"` no longer matches the marker, and `coordinator: |` / `  true` does match while libyaml
  yields the string `"true\n"`. That residual is masked by `guard_wr05`'s exactly-one-coordinator
  cardinality (a rogue claiming the marker makes two), and I could not construct a spelling that
  demotes the real coordinator, so I am not raising it as a finding — but the mask is defence in
  depth, not a property of the parser, which the file itself already says.
- **The five inverted assertions (27-39 × 2, 27-40 × 3)** — each re-measured against libyaml; each
  inversion states what the loader computes. The exemptions are narrowly pinned:
  `WR01_FALSE_RED_FORMS` asserts the loader's exact value, and the block-scalar exemption is gated on
  `cur.block` alone with a control proving the same `\q` value still refuses outside a block scalar.
- **The moved cardinality floors** (35→33, 420→396, and `SPAWN_GRANT_SCAN_COUNT` 33) — each tracks
  its table and each is asserted as a product (`REFUSED_FORMS.length * INDENTS.length *
  VALUES.length`) rather than as a bare literal. The `.length` pins are consistent with the moves.
- **`partitionPluginComponentClaims` extraction** — I confirmed the gate's `kit counts:` PASS line is
  byte-identical to the pre-extraction wording and that the inline-restatement control is a genuine
  differential (different idiom, both mutations asserted to have applied), not a tautology.
- **Coverer-by-identity** — the four separate facts (resolves / equality performed / prefix matches
  the schema's probe dirs / non-empty scan) are each individually falsifiable and each has a scratch
  case. The `find` ambiguity is closed by the pairwise-distinct-listers assertion.

Two things I did **not** attempt: exercising `install/kit-source.ts`'s twin walk (out of the reviewed
file set), and confirming what Claude Code itself does with a directive prologue or a multi-document
stream (no platform access; both remain `UNKNOWN - verify` in the source, correctly).

---

_Reviewed: 2026-08-08T20:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
