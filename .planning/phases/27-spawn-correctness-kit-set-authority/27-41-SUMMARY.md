---
phase: 27-spawn-correctness-kit-set-authority
plan: 41
subsystem: frontmatter-parser
tags: [spawn-correctness, yaml, parser, safety-invariant, gap-closure-round-7]
status: complete
requires:
  - phase: 27-39
    provides: the carried scalar quote state, consumed as landed
  - phase: 27-40
    provides: the labelled leading run and the block-scalar quoting exemption, consumed as landed
provides:
  - "scripts/frontmatter.ts accountSpawnOccurrences() — every spawn-token OCCURRENCE in a value classified into exactly one of three stated buckets (scoped / unscoped / neither)"
  - "scripts/frontmatter.ts GRANT_OCCURRENCE_KINDS — the three buckets stated once as data, so the count identity counts what the list names"
  - "scripts/frontmatter.ts the unterminated-enumeration refusal, built to the existing refuseRef / refuseEscape contract"
  - "scripts/frontmatter.ts rendersNoVisibleGlyph() — the module's ONE invisible authority consulted at the prologue skip"
  - "scripts/frontmatter.test.ts the three-different-facts case, the count-identity property over 810 multi-token values, and the invisible-prologue cases with their in-block asymmetry control"
affects:
  - "check-foundation-guards.ts guard_wr05 (SPAWN-04) and the KIT-03 oracle — both unedited; each now reaches its NAMED finding with the right diagnosis"
  - "coordinator-resolution-precheck.ts — its set equality is no longer computable over a set the document does not express"
tech-stack:
  added: []
  patterns:
    - "promote the OCCURRENCE to the unit and demote the formed capture to one of its classifications"
    - "a partition asserted as a COUNT IDENTITY, so a bucket that stops matching fails arithmetically instead of reclassifying in silence"
    - "one alphabet authority consulted at every site that asks its question, with the deliberately-excluded sites naming their DIRECTION rather than being silently frozen"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-50 implemented: WR-03 and IN-01 both closed in round 7, neither deferred; both are `the gate never saw the value` on two different predicates"
  - "D-49 honoured: every platform claim carries a /usr/bin/ruby -ryaml transcript; every closing case was RED against the committed .js before its fix and GREEN after"
  - "`Agent()` and `Read, Agent` DELIBERATELY share one name-list answer — they express the same fact (zero enumerated names) and splitting them would mean a new false red on content a real loader accepts (executor deviation: the plan's acceptance criterion contradicted its own observable-projection table)"
  - "The invisible prologue also bypassed D-34's directive refusal entirely; that bypass is closed by the same one-line change (executor finding, no plan and no review named it)"
metrics:
  duration: ~55 min
  completed: 2026-08-08
actuals:
  tokens: 61000
  tasks: 2
  commits: 2
---

# Phase 27 Plan 41: The Gate Never Saw the Value, on Two Predicates Summary

Closed the eighth spelling of this module's founding failure and the second half of
round 6's carried warnings: `keysGrantedAgentNames` returned the SUCCESS arm for an
enumeration it could not read, and `parseFrontmatter`'s prologue skip decided which
lines of a document exist using an alphabet narrower than the one the module itself
declares. Both are **the gate never saw the value** — CR-01's shape, on two different
predicates, in the same round.

Loader column throughout: `/usr/bin/ruby -ryaml` — **Ruby 2.6.10 / Psych 3.1.0 /
libyaml 0.2.1**. Task 1's RED was captured on a `git archive HEAD` mirror of `68c67bb`
before any edit; Task 2's RED on a mirror of `0cd71e9` (the build Task 1 left). Every
GREEN was measured against the **rebuilt committed `.js`**, never the TypeScript.

## Task 1 — the occurrence accounting (commit `0cd71e9`)

### WR-03 parser RED/GREEN, against the committed `scripts/frontmatter.js`

| # | `tools:` value | RED (committed) | GREEN (rebuilt) |
|---|---|---|---|
| W3-a | `Agent(alpha, gamma` | `{"ok":true,"value":[]}` | **REFUSE** — *the grant occurrence `Agent(alpha, gamma` opens a scoped enumeration that is never closed in this value — the `(` after `Agent` has no matching `)`* |
| W3-b | `Agent(alpha, #b, gamma)` | `{"ok":true,"value":[]}` | **REFUSE** — same clause, naming the flattened fragment `Agent(alpha,` |
| W3-c | `Read, Agent` | `{"ok":true,"value":[]}` | `{"ok":true,"value":[]}` — **byte-unchanged** |
| W3-d | `Agent(alpha, gamma)` | `{"ok":true,"value":["alpha","gamma"]}` | **byte-unchanged** |
| W3-e | `Agent()` | `{"ok":true,"value":[]}` | **byte-unchanged** |
| W3-f | `Agent(alpha), Task(beta` | `{"ok":true,"value":["alpha"]}` | **REFUSE**, naming `Task(beta` |
| W3-g | `Agent(alpha, Task(beta)` | REFUSE — *`(` (U+0028) … outside the legal character set* | **REFUSE, same clause** (the D-47 allowlist, unchanged) |
| W3-h | `Agent, Task(beta` | `{"ok":true,"value":[]}` | **REFUSE**, naming `Task(beta` |
| W3-i | `Task(beta, Agent` | `{"ok":true,"value":[]}` | **REFUSE**, naming `Task(beta, Agent` |
| W3-j | `Agent(alpha), Task` | `{"ok":true,"value":["alpha"]}` | **byte-unchanged** |
| W3-k | `Agent(alpha), Task(beta)` | `{"ok":true,"value":["alpha","beta"]}` | **byte-unchanged** |
| W3-l | `Read, Write` | `{"ok":true,"value":[]}` | **byte-unchanged** |

**Rows a, b and c are the finding, stated as data:** three different facts — *an author
truncated it*, *the comment scanner destroyed it upstream*, *the document never wrote one*
— collapsing into ONE answer on the arm the KIT-03 closure equality is computed over.
**W3-f is worse than the empty list:** it returned `["alpha"]`, a name list that looks
complete while a second occurrence in the same value was unreadable.

### `hasSpawnGrant` invariance, transcribed on BOTH sides

All twelve rows above returned `{"ok":true,"value":true}` before **and** after, except
`Read, Write` which returned `false` before and after. The boolean was already right; the
refusal belongs on the arm that returns NAMES.

### `SCOPED_GRANT` and `keysHaveSpawnGrant`, byte-unchanged — by function-scoped diff

| declaration | diff vs `68c67bb` |
|---|---|
| `const SPAWN_TOKEN = /\b(?:Agent\|Task)\b/;` | **empty** |
| `const SCOPED_GRANT = /\b(?:Agent\|Task)\(([^)]*)\)/g;` | **empty** |
| `export function keysHaveSpawnGrant` (whole body) | **empty** |

The scanning form the accounting enumerates from is *derived* from `SPAWN_TOKEN`
(`new RegExp(SPAWN_TOKEN.source, \`${SPAWN_TOKEN.flags}g\`)`), so there is one statement
of what a spawn token is and no second one to drift.

### The count identity, asserted as a property over a corpus built from OUTSIDE the module

9 fragments × ordered pairs and ordered triples = **81 + 729 = 810 multi-token values**,
count asserted. The accounting is restated independently in the test (its own token regex,
naming no module symbol), and for each member: `occurrences == scoped + unscoped + neither`,
then `neither > 0` ⟺ the module returns the unterminated refusal. Both sides of the
biconditional fire (`withNeither` and `withoutNeither` each asserted `> 0`). The `neither == 0`
half is stated precisely as *never the UNTERMINATED refusal* rather than *never a refusal*,
because `Agent(, Task(beta)` legitimately still refuses through the D-47 allowlist.

### The corrected doc claim, shipped with the case that makes it true

Removed as the sole standing claim:

> `scripts/frontmatter.ts:1141-1142` — *"SO THE ENUMERATION IS EXAMINED BEFORE IT IS SPLIT,
> AND REFUSED RATHER THAN PARSED BETTER."*

That sentence had **no assertion behind it** for an occurrence whose capture never formed —
such an enumeration is not examined at all. It is replaced by a fifth history paragraph
(D-32 → D-41 item 3 → D-47 item 2 → **this**, the first that asks whether the predicate ever
RAN) plus the amended claim *"…AND THE OCCURRENCE IS ACCOUNTED FOR BEFORE THE ENUMERATION IS
SOUGHT"*. **The case that pins it** — `D-50 WR-03 — the truncated enumeration and the
comment-destroyed capture REFUSE by name` — shipped in the same commit, `0cd71e9`.

Standing question recorded for the next reader: *before trusting a predicate's closure claim,
ask which set it ENUMERATES — and then ask what happens to an input that never reaches it at
all.*

### Gate-level reproduction — the masking is real, and it carried the WRONG diagnosis

Plant: the coordinator adapter's enumeration truncated (one `)` deleted), on hermetic
mirrors of both builds.

| build | `check-foundation-guards.js` | the finding |
|---|---|---|
| RED (`68c67bb`) | exit 1 | *KIT-03: the coordinator … **carries no ENUMERATED Agent(...) grant — an unscoped grant** has no computable closure* |
| GREEN (`0cd71e9`) | exit 1 | *KIT-03: the coordinator … has an **UNREADABLE grant enumeration** — the grant occurrence `Agent(grugops-agents-md-scribe, …` opens a scoped enumeration that is never closed* |
| GREEN, `coordinator-resolution-precheck.js` | exit 1 | *PRECONDITION FAILED: … UNREADABLE grant enumeration …* |

**Stated honestly and not oversold: this is NOT a reproduced green-gate bypass.** The gate
was already red. What changed is that it stops telling a maintainer the document wrote an
unscoped grant when the document wrote an enumeration this module could not read. Both
consumers reach a **named finding**, never an unhandled throw.

### Red-team — 28 spellings the plan never named, diffed row by row across both builds

**12 rows moved, every one in the same direction: silent success → refusal.** Zero rows
moved into a success and zero into the keyless arm; `hasSpawnGrant` was byte-identical on
all 28. The movers include the wrapped-quoted join, the block sequence, the `allowed-tools`
key, CRLF, the block scalar, single quotes, the 120-character excerpt, three unterminated
occurrences in one value, and **duplicate `tools:` keys in both orders** (RED `["alpha"]` →
refusal, the "looks complete" failure again).

**16 rows byte-identical**, including the legit repo-shaped coordinator grant, the folded
scalar that closes across lines, `Agents(` / `Taskmaster(` (not tokens), the out-of-scope
`description:` key, and the fenced-block control.

## Task 2 — the one invisible authority at the prologue skip (commit `4065281`)

### IN-01 parser RED/GREEN — the four-row contrast printed together, because the contrast IS the finding

| # | document's first line | RED (committed, after Task 1) | GREEN (rebuilt) |
|---|---|---|---|
| I1-a | a lone `U+200B` ZERO WIDTH SPACE | `keys=(none)`, `hasSpawnGrant` **`{ok:true,false}`** | `keys=name\|tools`, grant **true**, names `["grugops-orchestrator"]` |
| I1-b | a lone `U+00AD` SOFT HYPHEN | the same silent no-grant | the same conviction |
| I1-c | a lone `U+00A0` NO-BREAK SPACE | **parses**, grant found | **byte-unchanged** |
| I1-d | an ordinary blank line | **parses**, grant found | **byte-unchanged** |
| I1-e | a lone `U+2060` WORD JOINER | silent no-grant *(row the plan never named)* | conviction |
| I1-g | a lone `U+0301` COMBINING ACUTE | silent no-grant *(row the plan never named)* | conviction |
| I1-h | ZWSP line **then** a blank line | silent no-grant | conviction |
| I1-i | two ZWSP lines | silent no-grant | conviction |

Rows a/b/e/g differ from rows c/d **only** by which alphabet `String.prototype.trim()`
happens to carry. The `---` block one line below every one of them carries a live
`Agent(grugops-orchestrator)` grant.

### The refusals that had to survive, and the keyless arm that had to not move

| document | RED | GREEN |
|---|---|---|
| `%TAG` directive prologue | REFUSE (D-34) | **REFUSE, same clause** |
| ZWSP directly **attached** to the delimiter (`<ZWSP>---`) | REFUSE, names **U+200B** | **REFUSE, same clause** |
| an invisible-only line **INSIDE** the block | REFUSE — *cannot read `<ZWSP>` as a frontmatter key line* | **REFUSE, same clause** |
| an ordinary blank line inside the block | parses | **byte-unchanged** |
| body-only / empty / all-blank / **all-invisible** document | keyless success | **keyless success, unchanged** |

### The loader oracle (D-49), including its outright rejections

`/usr/bin/ruby -ryaml` — **Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1**:

| document | libyaml |
|---|---|
| lone ZWSP / SOFT HYPHEN / NBSP / WORD JOINER / COMBINING ACUTE prologue | **3 documents**: the prologue as its own scalar, then `{"name"=>"x", "tools"=>"Read, Agent(grugops-orchestrator)"}` — **the mapping and its grant are read in every spelling** |
| ordinary blank prologue / no prologue | 2 documents, same mapping |
| `%TAG` prologue | 2 documents, same mapping — libyaml does **not** refuse it |
| ZWSP then `%TAG` prologue | 3 documents; the ZWSP and the `%TAG` fold into ONE plain scalar `"<ZWSP> %TAG ! tag:x"`, then the mapping |
| `<ZWSP>---` attached to the delimiter | **LOADER REJECTS** — `Psych::SyntaxError: mapping values are not allowed in this context at line 2 column 5` |
| invisible-only line **inside** the block | **LOADER REJECTS** — `Psych::SyntaxError: could not find expected ':' while scanning a simple key at line 3 column 1` |

Two data points this buys, neither of them omitted:

1. the module's pre-fix silent no-grant **disagreed with the platform on token presence**
   in every invisible-prologue spelling; the fix makes them agree;
2. the in-block refusal this plan deliberately did NOT touch is the arm **libyaml also
   takes**. That turns the "leave the in-block sites alone" prohibition from an argument
   into a measurement.

On `%TAG`: this module refuses where libyaml loads. That refusal **pre-dates this plan**,
is D-34's declared policy (*"a directive declares a YAML processing context this module does
not implement"*), and points in the safe direction. The post-fix conviction is therefore
**stricter than the platform**, which is the loud direction; the pre-fix under-conviction
was the silent one. The plan's related claim about Claude Code's own frontmatter reader
remains `verification: backstop` — **`UNKNOWN - verify`**, not measured here.

### THE ROW NO PLAN AND NO REVIEW NAMED: one code point bypassed D-34 entirely

| document | RED (committed) | GREEN (rebuilt) |
|---|---|---|
| `<ZWSP>` **then** `%TAG ! tag:x` then a real block | **`{ok:true, keys:[]}` — the keyless SUCCESS arm** | **REFUSE** — *the document opens with the YAML directive line `%TAG ! tag:x`* |

The skip stopped on the invisible line, so the directive one line down was never examined
and the delimiter test then returned the keyless arm. **A predicate is only as total as the
input it is handed** — which is exactly WR-03's lesson, one region over, in the same round.
Found by red-team, closed by the same one-line change, pinned by a case.

### The direction argument, recorded at BOTH in-block sites and asserted by a control

| site | what the narrow `trim()` alphabet does there | disposition |
|---|---|---|
| `parseFrontmatter`'s prologue skip | routes an invisible-only line to a **SILENT SUCCESS** | **changed** — consults `VISIBLE_GLYPH` |
| `flattenBlock`'s blank-line `continue` (`:734`) | routes it to a **REFUSAL** (which libyaml agrees with) | **deliberately unchanged**, reason in source |
| the `firstContent` baseline (`:1495`) | lets it BECOME the baseline, carrying it into that refusal | **deliberately unchanged**, reason in source |

Asserted by `D-50 IN-01 — THE IN-BLOCK ASYMMETRY IS DELIBERATE`, which states the rule as a
pair: **the same code point, skipped at the prologue and refused inside the block.**

### The module declares exactly ONE invisible-glyph class

| fact | measured |
|---|---|
| declarations of `/[\p{L}\p{N}\p{P}\p{S}]/u` in `scripts/frontmatter.ts` | **1** (`const VISIBLE_GLYPH`, line 1142) |
| occurrences of that class LITERAL anywhere in the file | **1** — the prologue predicate consults the constant, it does not re-type the expression |
| `trim()`-based blank tests remaining | **2** — exactly the two deliberate in-block sites |

All three are asserted by a source-inspection case, so a second class introduced later fails
mechanically rather than in review.

### Red-team — 20 IN-01 spellings the plan never named, diffed across both builds

**12 rows moved. EVERY one moved OUT of the keyless success arm; not one moved into it.**

| destination | rows |
|---|---|
| keyless → **conviction** (keys returned, grant found) | plane-14 TAG SPACE `U+E0020`, PRIVATE USE `U+E000`, UNASSIGNED `U+0378`, a lone high surrogate, BOM-then-ZWSP, the CRLF spelling, 20 stacked invisible lines, and ZWSP + a WR-03 value (both fixes composing) |
| keyless → **named REFUSAL** | ZWSP then `----`, ZWSP then `--- foo`, ZWSP then an indented `---`, ZWSP then an **unterminated block** |

**8 rows byte-identical**, and each for the right reason: `U+3000` and `U+2028` already
skipped (both in ECMAScript WhiteSpace), an **emoji** prologue is `\p{S}` so it is a visible
glyph and correctly keeps the document body-only, `<ZWSP>hello` likewise, the fenced-block
control, the no-block-below control, `ZWSP` then `...` (not an opening payload — D-39 point 4),
and the tab-only prologue.

**The safety property, argued structurally rather than hoped for:** the change can only
ADVANCE `i`. At every line it now skips, the old code stopped on a line that renders no
visible glyph — such a line can never start with `---` and can never be a `%TAG` directive,
so the only verdict reachable there was `not-a-delimiter`, i.e. **the keyless arm**. Every
affected document therefore moves *from* the keyless arm; none can move *into* it. The
red-team's 12/0 split is that argument measured.

### Gate-level reproduction — the mask exists, and it names the wrong thing

Plant: a **rogue `Agent(grugops-orchestrator)` grant** added to `allowed-tools` on **both
distribution twins** of the shipped gate skill, **behind a lone ZWSP prologue**.

| build | exit | the finding |
|---|---|---|
| RED (`0cd71e9`) | 1 | `D-40 distribution-pair violation: skills/gate/SKILL.md: the pair declares **0 and 0** `name` value(s)` — **ZERO WR-05 findings; the rogue grant is invisible** |
| GREEN (`4065281`) | 1 | `WR-05 coordinator-spawn-grant violation:` — **both twins named as rogue spawners** |

A second plant (a ZWSP prologue on an agent adapter) confirms the other half of the mask:
pre-fix `guard_wr05`'s `keys.size === 0` floor fires with *"carries NO FRONTMATTER BLOCK at
all"* — a **false red** on a file that plainly has one; post-fix the document parses and the
guard is correctly silent.

**So IN-01 is confirmed exactly as the reviewer framed it: not a green-gate bypass** — a
sibling guard catches it — **but the masking is incidental and carries the wrong diagnosis.**
A maintainer reading `0 and 0 name value(s)` goes looking for a name-normalization problem,
not for a rogue spawner. That is why it is closed rather than recorded.

### Repository-wide cost, both numbers DERIVED in their own run

| | corpus (`git ls-files '*.md'`) | files read | parse refusals | granted-name refusals |
|---|---|---|---|---|
| before (pre-Task-1 committed `.js` on the mirror) | 1133 | 1133 | **0** | **0** |
| after Task 1 (rebuilt committed `.js`) | 1133 | 1133 | **0** | **0** |
| after Task 2 (final rebuilt committed `.js`) | 1133 | 1133 | **0** | **0** |

The derived sizes are equal in all three runs and are compared **to each other**, never to a
literal in the plan. `27-39` recorded 1131 and `27-40` recorded 1132; the corpus is **1133**
today — three values inside one round, which is the concrete reason no corpus size is written
into any assertion. **These numbers are a record of THIS run and are deliberately not written
back into any plan or suite case.**

**Repository-wide OUTCOME MAP** — parse outcome (`ok` + sorted key set, or the refusal
reason) **plus** granted-name list **plus** grant verdict, per file: **byte-identical,
0 differences over 1133 files compared.**

That comparison is a **ONE-SHOT execution-time transcript recorded here and deliberately NOT
added to the suite.** Its `before` image is a build that ceased to exist the moment Task 1
landed and lived on a throwaway `git archive` mirror, so a permanent case asserting against
it would fail once the mirror was cleaned up — or, worse, be "fixed" later by narrowing it
until it passed. What lives in the suite instead is the **self-deriving** control `27-39`
added, **EXTENDED for the third time rather than duplicated**: over the corpus it has already
derived, it now also asserts that **no tracked file that independently opens a frontmatter
block reaches the keyless success arm**, with the premise (`skip lines rendering no visible
glyph, then require the next line to be exactly \`---\``) re-typed as data so it cannot
narrow along with the module. **No corpus-size literal appears in any assertion this plan
wrote.**

## Deviations from Plan

### 1. [Rule 1 — a bug in the plan's own acceptance criterion] `Agent()` and `Read, Agent` deliberately share ONE name-list answer

- **Found during:** Task 1, writing the three-different-facts case.
- **Issue:** the plan's acceptance criterion demands all three of `Agent(alpha, gamma`,
  `Agent()` and `Read, Agent` be **pairwise distinguishable**, while the plan's own
  observable-projection table five paragraphs above states that `Agent()` and `Read, Agent`
  BOTH stay `{ok:true, names:[]}`, *"unchanged"*. Both cannot be true. Measured: through the
  exported API the two are identical, and the only way to split them is to **refuse
  `Agent()`** — content a real loader accepts, on a population no measurement shows this
  repository carries. That is a NEW false red, the direction D-34 records as the worse of
  the two, and it is forbidden by this plan's own prohibitions.
- **Resolution:** the projection table wins. The case asserts pairs 1 and 2 (the finding —
  *whether the enumeration was CAPTURED* distinguishes each) and asserts pair 3 **equal, with
  the reason recorded in the case**: both express *this grant enumerates zero names*, and
  every consumer already treats a zero-length closure as its own **named** failure. The
  distinction is not lost — it is preserved one level down, and the case asserts that too:
  `parseFrontmatter` keeps `Agent()` and `Read, Agent` as byte-distinct values.

### 2. [Rule 2 — found by red-team, not by any plan or review] One code point bypassed D-34

- **Found during:** Task 2, RED capture, from a row in no plan and no review: a lone ZWSP in
  front of a `%TAG` directive line.
- **Issue:** pre-fix the D-34 directive refusal **disappeared** and the document reached the
  keyless success arm. The same prologue also hid an illegal `----` open, a `--- foo` open,
  an indented `---` open and an **unterminated block** behind that arm.
- **Fix:** none beyond the planned one-line change — all five are closed by the skip
  consulting the module's own alphabet. Pinned by cases (the `%TAG` row explicitly), and all
  five recorded in the red-team table above.

### 3. [Rule 2] The self-deriving control was extended a third time

The plan says "extend rather than duplicate"; `27-40` had already added two properties to it.
A third was added — the no-silently-keyless property over files that independently open a
block — because that is the only place the IN-01 fix can be checked against the **real**
corpus without a mirror. Still one control, still self-deriving, still no size literal.

## Residuals, recorded rather than dropped

1. **`Agent（alpha` (FULLWIDTH `U+FF08`) and `Agent\t(alpha)`** classify as **unscoped**, so
   `grantedAgentNames` returns `[]`. **Byte-unchanged by this plan** (both rows identical on
   both builds), `hasSpawnGrant` still convicts, and for the coordinator `granted.length === 0`
   is its own named failure. **Disposition: record, do not fix** — deciding which of Unicode's
   paren-like characters "count as" an opening parenthesis would be a second grammar for a
   character the platform reads with a first, which is exactly this phase's standing
   prohibition.
2. **The block-sequence JOIN contract can compose an enumeration across items:**
   `tools:` / `  - Agent(alpha` / `  - beta)` joins to `Agent(alpha, beta)` and yields
   `["alpha","beta"]`, where libyaml expresses two separate items. **Byte-unchanged by this
   plan** (it is a property of the declared join contract, documented in `flattenBlock`).
   **Disposition: record, do not fix — Rule 4 territory:** changing the join contract is the
   structural decision that lets one token test serve every scalar form, and the direction
   here is an OVER-read of the closure, which makes the KIT-03 equality fail loudly rather
   than pass silently.
3. **`27-39`'s escaped-line-break residual** (`\<LF>`) still refuses, re-confirmed unchanged.

## Verification

| check | result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — 32 committed `.js` match a fresh rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1162 passed / 2 skipped**, 35 files (Task 1 left 1156; `27-40` left 1150) |
| `node scripts/check-foundation-guards.js` | exit 0 — `ALL CHECKS PASSED`; **KIT-03 verdict unchanged**: `17 roles == 17 adapters == 17 grant-closure names` |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| live kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills |
| `git diff package.json` | **empty** |
| `git status --porcelain -- scripts install` | clean apart from this plan's three files |
| every transcript | run against the committed `.js`, never the TypeScript source |
| every platform claim | carries a `/usr/bin/ruby -ryaml` transcript |

**The suite floor is a floor, not evidence.** It has been green in every one of the six
rounds of this phase in which a defect was later found, and in both prior waves of THIS round
the executor's own first draft was wrong in a way the suite could not see. The evidence is
the RED transcripts above, the two gate-level reproductions, the loader oracle, and the two
red-team passes (28 WR-03 rows, 20 IN-01 rows) diffed row by row across both builds — of
which 24 rows moved and **not one moved into the keyless success arm**.

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts` — all present and modified.
- Commits `0cd71e9` and `4065281` — both present in `git log`.
- The safety invariant was verified adversarially, not by a green suite: all four WR-03
  closing cases and all four IN-01 closing cases were run against the pre-change committed
  `.js` on hermetic `git archive` mirrors and **failed there**; 48 unnamed red-team spellings
  were diffed across both builds; two gate-level plants were built on throwaway mirrors and
  the pre/post findings compared; and the repository-wide outcome map over 1133 tracked
  markdown files is byte-identical with zero refusals.
