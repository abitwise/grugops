---
phase: 27-spawn-correctness-kit-set-authority
plan: 43
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, parser, safety-invariant, gap-closure-round-8]
status: complete
requires:
  - "27-42 (the claim-accuracy corrections in scripts/frontmatter.ts's header)"
  - "27-39 / D-48 (quote state promoted to a property of the scalar)"
provides:
  - "scripts/frontmatter.ts ScalarState — the one carried record: an already-gated open quote, the flow-collection depth, and whether a node may begin at the reached offset"
  - "scripts/frontmatter.ts stripComment — the ONE authority on what crosses a line boundary, exported for the byte-identity differential"
  - "scripts/frontmatter.ts assertItemPathScalarClosed — the item path's invariant, stated as code (IN-03 / D-53)"
  - "scripts/fixtures/frontmatter-singleline-pre-d51.json — the frozen pre-D-51 within-line capture"
  - "scripts/frontmatter.test.ts — axis 1 of the multi-line sweep at 12 styles / 180 cells"
affects:
  - "scripts/check-foundation-guards.ts guard_wr05 (consumes hasSpawnGrant; its verdict is what stops a release)"
  - "the KIT-03 referential-integrity closure (consumes grantedAgentNames)"
tech-stack:
  added: []
  patterns:
    - "one authority per predicate, and the weaker duplicate DELETED rather than kept beside it"
    - "the gate decided at the character where the position is known, never re-derived per call site"
    - "RED-before / GREEN-after transcripts against the COMMITTED compiled build, with a libyaml column"
key-files:
  created:
    - scripts/fixtures/frontmatter-singleline-pre-d51.json
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-51 implemented: the comment scanner is the module's one authority on what crosses a line boundary; the three seeding sites became one unconditional assignment each; nodeStartQuote deleted"
  - "D-52 axis 1 implemented: the multi-line sweep's style axis grew 6 -> 12 and the sweep 90 -> 180 cells, so both CR-01 families are expressible"
  - "D-53 implemented: IN-03's disposition is FIX — the item path's invariant is asserted at the site and the comment now states what is true"
  - "NEW, from red-teaming this plan's own fix: a YAML node property (tag/anchor) stands in front of a mid-line node start without consuming it, and `?` introduces the key node inside a flow collection. Both were live silent-no-grant bypasses in D-51's first draft."
  - "MEASURED AND RECORDED, NOT FIXED: scripts/validate-agent-factory.ts is not a spawn-grant surface at all (zero occurrences of `spawn`, zero of `frontmatter`), so the plan's `validator exit 0 -> non-zero` criterion is not satisfiable and was not forced"
metrics:
  duration: "~1h50m"
  completed: 2026-08-09
  tasks: 3
  commits: 4
actuals:
  tokens: 118000
  tasks: 3
  commits: 4
---

# Phase 27 Plan 43: The Comment Scanner as the One Authority on What Crosses a Line Boundary — Summary

The eighth consecutive spawn-grant bypass is closed by deleting a split rather than adding an arm:
`stripComment` is told whether offset 0 of its line is a node start, tracks flow depth and
node-may-begin as it walks, and returns an already-gated state that three call sites store
unconditionally — and red-teaming that fix found two more live bypasses inside it, which are also
closed here.

## What shipped

| Artifact | Change |
|---|---|
| `scripts/frontmatter.ts` | `ScalarState` (open quote / flow depth / node-may-begin) replaces the bare carried quote; `stripComment` gains the node-start input and returns the exiting state; the three seeding sites become one assignment each; `nodeStartQuote` DELETED; `assertItemPathScalarClosed` added; `NODE_PROPERTY_AT_NODE_START` added; the header gains the ninth ledger entry |
| `scripts/frontmatter.js` | rebuilt committed twin, freshness-clean (`32 committed .js file(s) match a fresh tsc rebuild`) |
| `scripts/frontmatter.test.ts` | the seven measured rows as named cases with their loader column; the single-line byte-identity differential; the IN-03 invariant case; the two red-team cases plus a 42-cell flow-grammar sweep; axis 1 grown 6 -> 12 styles |
| `scripts/fixtures/frontmatter-singleline-pre-d51.json` | the frozen pre-D-51 within-line capture (1884 inputs x 3 entering states) |

## Commits

| Task | Commit | Subject |
|---|---|---|
| 1 (tracer) | `c3f5960` | the comment scanner becomes the one authority on what crosses a line boundary (D-51, CR-01) |
| 2 | `0ba77dd` | every remaining node-start placement, the item-path invariant, and a sweep axis that can express both families (D-52, D-53) |
| 3 | `6948d97` | record the ninth spelling of the founding failure, measured on three shipped surfaces |
| 3 (red-team) | `fc6673a` | close the two mid-line node starts the red-team found in D-51's own scanner |

## The seven-row measurement table

Loader column from `/usr/bin/ruby -ryaml` — `ruby=2.6.10 psych=3.1.0 libyaml=0.2.1`. Every document
carries a live `Agent(grugops-orchestrator)` grant. RED captured on a `git archive HEAD` mirror of
`b24d980` BEFORE any edit, from the COMMITTED `scripts/frontmatter.js`.

### RED — verbatim transcript, pre-edit mirror `b24d980`

```
a1	{"ok":true,"value":false}	tools=["\"Read,"]
a2	{"ok":true,"value":false}	tools=["'Read,"]
a3	{"ok":true,"value":false}	tools=["\"Read,"]
b1	{"ok":true,"value":false}	tools=["[Read, \"Write,"]
b2	{"ok":true,"value":false}	tools=["{a: \"Read,"]
c1	{"ok":true,"value":false}	tools=["Read, \"Write,,"]
ctl	{"ok":true,"value":true}	tools=["Read, # x, Agent(grugops-orchestrator)"]
```

Note `c1`'s `Read, "Write,,` — a doubled comma the document does not express. The reset did not only
hide the token; it invented structure, and an invented comma is an invented NAME in the KIT-03
closure equality.

### LOADER — verbatim transcript

```
ruby=2.6.10 psych=3.1.0 libyaml=0.2.1
a1	token=true	tools="Read, # x, Agent(grugops-orchestrator)"
a2	token=true	tools="Read, # x, Agent(grugops-orchestrator)"
a3	token=true	tools="Read, # x, Agent(grugops-orchestrator)"
b1	token=true	tools=["Read", "Write, # x, Agent(grugops-orchestrator)"]
b2	token=true	tools={"a"=>"Read, # x, Agent(grugops-orchestrator)"}
c1	token=true	tools=["Read", "Write, # x, Agent(grugops-orchestrator)"]
ctl	token=true	tools="Read, # x, Agent(grugops-orchestrator)"
```

### GREEN — verbatim transcript, rebuilt committed `.js`

```
a1	{"ok":true,"value":true}	tools=["Read, # x, Agent(grugops-orchestrator)"]
a2	{"ok":true,"value":true}	tools=["Read, # x, Agent(grugops-orchestrator)"]
a3	{"ok":true,"value":true}	tools=["Read, # x, Agent(grugops-orchestrator)"]
b1	{"ok":true,"value":true}	tools=["[Read, \"Write, # x, Agent(grugops-orchestrator)\"]"]
b2	{"ok":true,"value":true}	tools=["{a: \"Read, # x, Agent(grugops-orchestrator)\"}"]
c1	{"ok":true,"value":true}	tools=["Read, \"Write, # x, Agent(grugops-orchestrator)\""]
ctl	{"ok":true,"value":true}	tools=["Read, # x, Agent(grugops-orchestrator)"]
```

All seven RED transcripts reproduced. No cell was expected red and found green.

### Two further rows added in Task 2

```
RED    key-trailing-ws	{"ok":true,"value":false}	tools=["\"Read,"]
RED    three-line      	{"ok":true,"value":false}	tools=["\"Read, Write,"]
GREEN  key-trailing-ws	{"ok":true,"value":true} 	tools=["Read, # x, Agent(grugops-orchestrator)"]
GREEN  three-line      	{"ok":true,"value":true} 	tools=["Read, Write, # x, Agent(grugops-orchestrator)"]
LOADER key-trailing-ws	token=true	"Read, # x, Agent(grugops-orchestrator)"
LOADER three-line      	token=true	"Read, Write, # x, Agent(grugops-orchestrator)"
```

## The three seeding sites — one assignment each, no conditional, no other predicate

```
scripts/frontmatter.ts:1006        cur.state = scanned.state;
scripts/frontmatter.ts:1028        cur.state = scanned.state;
scripts/frontmatter.ts:1091        cur.state = scanned.state;
```

`grep -c 'nodeStartQuote' scripts/frontmatter.ts` -> `0`. The separate crossing predicate is deleted,
not deprecated; the one gate now lives inside the walk as `openedAtNodeStart`.

## The single-line byte-identity differential

The committed pre-D-51 build does not export the scanner, so the capture appended ONE
`export { stripComment }` line to a COPY of the mirror's committed bytes and imported that — a
mechanical transformation of the shipped artifact, never a reimplementation.

```
captured 1884 single-line inputs x 3 entering states = 5652 cells
single-line differential: 1884 inputs, 11304 comparisons, 0 mismatch(es)
```

**Derived corpus size: 1884 generated single-line inputs.** The comparison count is 11304 because the
NEW node-start argument is swept too (`true` and `false`) — the returned text must be independent of
it, which is the whole basis for "within-line unchanged". No corpus size is written into an
assertion; the case derives both numbers in the same run and pins only a floor.

## The three shipped surfaces — six gate transcripts

Pre mirror `b24d980` (the commit this plan started from); post mirror `0ba77dd` (Tasks 1+2 landed).
Both twins edited identically so `guard_distribution_pair` stays satisfied.

| # | Surface | Planted shape | Build | Exit | First finding line |
|---|---|---|---|---|---|
| 1 | `skills/plan/SKILL.md` + `.claude/skills/grugops-plan/SKILL.md` | family (a) | pre `b24d980` | **0** | `ALL CHECKS PASSED` |
| 1 | same twins | family (a) | post `0ba77dd` | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |
| 2 | same twins | family (b), flow sequence | pre `b24d980` | **0** | `ALL CHECKS PASSED` |
| 2 | same twins | family (b), flow sequence | post `0ba77dd` | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |
| 3 | `.claude/agents/grugops-qe-e2e.md` | family (a) | pre `b24d980` | **0** | `ALL CHECKS PASSED` |
| 3 | same adapter | family (a) | post `0ba77dd` | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |

Full finding text on the post runs, read and confirmed to be the coordinator-spawn-grant violation
and not an unrelated floor:

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)

1 CHECK(S) FAILED
```

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-qe-e2e.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)

1 CHECK(S) FAILED
```

**The distribution-pair guard is green in every post-fix run**, demonstrated by `1 CHECK(S) FAILED`:
exactly one check failed and it is `guard_wr05`, so the red is attributable to the grant and to
nothing else. Both twins are named, which is what the pair rule requires.

**Controls.** Both unmodified mirrors exit 0. The IDENTICAL grant written on ONE line exits **1 on
both mirrors** (`ctl/pre EXIT=1`, `ctl/post EXIT=1`), so the plant demonstrably reaches the guard
pre-fix and the pre-fix exit 0 is attributable to the line break alone.

All three reproductions were re-run against the FINAL build (post the red-team commit) on a fresh
mirror: `s1a EXIT=1`, `s2b EXIT=1`, `s3a EXIT=1`, unmodified mirror `EXIT=0`.

## The repository-wide value map — false-red cost measured at zero

HEAD-to-HEAD, corpus derived at run time by `git ls-files '*.md'` inside each mirror, both numbers
derived in this session and compared to each other:

```
BEFORE derived corpus size: 1140
AFTER  derived corpus size: 1140
arms changed:  0
values changed: 0
NEW REFUSALS:  0
```

**Every changed file carries a loader transcript — vacuously, because the count is zero.** No tracked
markdown file's arm or value moved. The D-48 plain-scalar-apostrophe regression therefore stayed
closed by construction, exactly as the design predicted: an apostrophe at a non-node-start offset can
never license a crossing because the position is now known at the character where the quote opens.

Re-run a third time after the red-team commit: `0 / 0 / 0` over 1140 files.

## The multi-line sweep — old and new totals

| | Styles | Sigils | Placements | Cells |
|---|---|---|---|---|
| before | 6 | 5 | 3 | **90** |
| after | 12 | 5 | 3 | **180** |

The total is derived from the three axis lengths; no cell-count literal survives in the sweep. The
six new styles are the node-start PLACEMENTS the axis could not express: the value node opening on
the continuation line in the double-quoted, single-quoted and plain styles; a flow sequence and a
flow mapping whose quoted scalar spans lines; and a block-sequence item whose dash line carries no
value. **28 of the 90 new cells changed verdict pre -> post** — 12 from `(ok, no-grant)` to
`(ok, grant)` (hidden grants now caught) and 16 from `refuse` to `(ok, grant)` (false reds removed).

The truth table grew 30 -> 60 rows and stays arithmetically consistent
(`TRUTH.length === STYLE.length * SIGIL.length`). Its completeness claim is still a claim about the
**product of two hand-listed axes**, not about the construct; `27-44` replaces the claim's SOURCE
with a loader-derived differential over a generated corpus. That hand-off is accounted here, not
silently left.

The loader cross-check grew to one named cell per style (12), each chosen because module and loader
agree on it. The non-circularity pin dropped the deleted `nodeStartQuote`, gained `ScalarState`,
`FRESH_NODE` and `assertItemPathScalarClosed`, and now additionally asserts that **no entry names a
symbol the module no longer declares** — a stale entry is a vacuous assertion, which is the
set-literal drift class wearing a safety label.

## IN-03 (D-53) — closed

`assertItemPathScalarClosed(cur.state, t)` fires at the item path and the comment beside the seed now
states what is true: the state read there carries the flow depth and the node-may-begin answer (a
genuine read of three fields) while its QUOTE component is null, guaranteed by `startsNode`, which is
`!inScalar && !cur.nodeOnKeyLine`. A case proves the assertion is load-bearing by constructing two
violating states (`openQuote: '"'` and `openQuote: "'"`) and asserting it throws, and one legal state
and asserting it does not.

## Adversarial reproduction against this plan's OWN fix — two live bypasses found and closed

**A green suite is never evidence of absence.** D-51's first draft passed all 122 frontmatter cases,
the full 1187-test suite, the foundation gate, the freshness gate, the byte-identity differential and
the zero-delta repository value map — and still returned the silent no-grant arm on two mid-line node
starts it did not enumerate:

| Attack | First-draft module | libyaml |
|---|---|---|
| `tools: [!!str "Read,` / `  # x, TOKEN"]` | `{ok:true,value:false}`, `tools=["[!!str \"Read,"]` | `["Read, # x, Agent(grugops-orchestrator)"]` |
| `tools: {? "Read,` / `  # x, TOKEN": v}` | `{ok:true,value:false}`, `tools=["{? \"Read,"]` | `{"Read, # x, Agent(…)"=>"v"}` |

Both are the plan's own question — *may a node begin at this offset* — asked of positions YAML
defines and the first draft's enumeration missed. **This is the failure mode the plan's own backstop
truth anticipated** ("the scanner's node-may-begin rule is complete over YAML's flow-collection
contexts … not measured in this round"). It was measured, it was false, and it was fixed rather than
carried, because a measured live bypass is not something a backstop marker can hold.

The remedy completes the rule against YAML's own grammar rather than adding the two reported cells:

- a node PROPERTY (tag or anchor, YAML 1.2 § 6.9) stands **in front of** a node start and no longer
  consumes it. The grammar is `LEADING_TAG`'s and `YAML_REF`'s, **reused character-for-character** —
  a second spelling would be the weaker-duplicate shape this module deletes on sight.
- `?` inside a flow collection introduces the key node (§ 7.4), scoped to `depth > 0` so a plain
  scalar's `?` stays content.
- the property rule is consulted **only where a node may already begin** and never sets that answer,
  so it cannot create a node start: `tools: R&D, it's !important` is byte-unchanged, as is
  `tools: Read,` / `  R&D "x,` / `  # y, TOKEN"` -> `Read, R&D "x,` (measured identical pre and post).

**Generated differential over YAML's flow grammar** — 21 mid-line node-start contexts x 2 quote
styles = 42 cells, each with a live grant behind a `#` on the continuation line:

```
pre-D51 build:                    no-grant 40, REFUSE 6   (of 46 generated; 36 silent bypasses in the kept 42)
D-51 first draft:                 2 silent bypasses remained
final build (red-team fix):       GRANT 36, REFUSE 6, silent no-grant 0
```

The six `REFUSE` cells are anchors (`&t`) at a node start — D-30's declared policy, a **loud** refusal
in the safe direction, pre-existing and unchanged by this plan. Zero cells return the silent
no-grant arm. The property is pinned permanently as a case whose expectation is stated from YAML
(inside a quoted scalar every character is content) and never from the module.

Two further attacks were adjudicated rather than fixed:
- `tools: {a:"Read,` (no space after the colon) — the module says no-grant and **libyaml rejects the
  document outright**. YAML gives `:` no separator meaning without a following space, so the quote is
  plain-scalar content and no-grant is correct; the platform will not load the document at all.
- `tools: [!h!s "Read,` (undefined named tag handle) — the module GRANTS and libyaml rejects. The
  safe direction.

## Deviations from Plan

### 1. [Rule 1 - Bug] Two mid-line node starts left open by D-51's first draft

- **Found during:** Task 3's adversarial reproduction (the project's standing rule for safety
  invariants: attack your own fix before calling it done).
- **Issue:** a YAML node property in front of a mid-line node start, and the flow explicit-key
  indicator, were both consumed as content, so a quote opening after them was not gated and its state
  died at the line boundary — the silent no-grant arm, over a live grant, twice.
- **Fix:** `NODE_PROPERTY_AT_NODE_START` (reusing the declared tag/anchor grammar) plus `?` at
  `depth > 0`, both consulted only where a node may already begin.
- **Files modified:** `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`
- **Commit:** `fc6673a`

### 2. [Measured, not fixed] `validate-agent-factory` is not a spawn-grant surface

The plan's Task 3 acceptance asked the non-coordinator adapter surface to take **both** the
foundation gate and the validator from exit 0 to a named non-zero failure. Measured:

```
s3a/pre  validator EXIT=0  ::  ALL CHECKS PASSED
s3a/post validator EXIT=0  ::  ALL CHECKS PASSED

occurrences of 'spawn' in scripts/validate-agent-factory.ts:       0
occurrences of 'frontmatter' in scripts/validate-agent-factory.ts: 0
imports: node:fs, node:path, { listRoles, listWorkflows } from ./kit-model.js
```

The validator **never asks the spawn-grant question**, so its `ALL CHECKS PASSED` in round 7 was not
a bypass of the validator — it is a command that has no such check. The criterion is therefore not
satisfiable as written, and forcing it would mean adding a second spawn-grant predicate beside
`guard_wr05`, which this plan's prohibitions and this module's founding discipline both forbid.
Recorded rather than silently dropped; no action taken.

### 3. [Scope] The single-line differential is a frozen fixture, and the hazard is stated in the case

The repository's existing repo-wide control records an argument against baseline images (a baseline
"gets fixed later by narrowing it until it passes"). The single-line corpus is GENERATED and stable,
so its baseline cannot go stale the way a repository corpus does — but the regeneration hazard is
real, so the case carries an explicit paragraph saying the fixture must never be regenerated from a
post-D-51 build, plus a cardinality floor so an emptied fixture cannot pass vacuously.

### 4. [Recorded divergence, pre-existing] The plain continuation-start style refuses node properties

The new sweep style `value node on continuation, plain` refuses `*`, `!` and `&` at **both**
placements, because where the key line carries no value this module reads every indented line as a
node start. libyaml continues the plain scalar instead, so two of those refusals (`*` and `&` at
`continuation`) are a **false red**. Measured **identical on the pre-D-51 and post-D-51 builds, cell
for cell** — it is not introduced here, and D-51's prohibitions forbid re-cutting the node-start
reference test in this plan. It is a loud refusal in the safe direction, named in the sweep's
expected-outcome rule, and carried to `27-44`.

## Threat register outcome

| Threat ID | Disposition | Outcome |
|---|---|---|
| T-27-08-01 | mitigate | Closed. Both families close from one fact; seven rows RED-before / GREEN-after with a libyaml column each |
| T-27-08-02 | mitigate | Closed. Three surfaces reproduced end to end; every red's finding text read and confirmed to be the WR-05 coordinator-spawn-grant violation |
| T-27-08-03 | mitigate | Partially — the foundation gate half is closed and reproduced; the validator half is **not applicable** (measured: the validator has no spawn check). See Deviation 2 |
| T-27-08-04 | mitigate | Closed. Repository-wide value map: 0 arms changed, 0 values changed, 0 new refusals, over 1140 files derived on both sides |
| T-27-08-05 | accept | Unchanged; the excerpt is still bounded to 60 characters |
| T-27-08-06 | mitigate | Closed. Every platform claim above carries a loader transcript and every behaviour claim a RED/GREEN pair; none is reconstructed from memory |
| T-27-08-SC | mitigate (asserted absence) | `git diff --stat -- package.json package-lock.json` is **empty**. No package-manager install ran and no dependency was introduced, so the package-legitimacy audit has nothing to audit — recorded so the empty audit does not read as a skipped one |

## Verification

```
npm run build                                            exit 0
npm run freshness                                        exit 0  (32 committed .js file(s) match a fresh tsc rebuild)
npx vitest run --exclude '**/scripts/e2e/**'             35 files, 1196 passed | 2 skipped
node scripts/check-foundation-guards.js                  exit 0  ALL CHECKS PASSED
node scripts/coordinator-resolution-precheck.js          exit 0  PRECONDITIONS HOLD
node scripts/check-kit-refs.js                           exit 0
VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js  exit 0
grep -c 'nodeStartQuote' scripts/frontmatter.ts          0
git diff --stat -- package.json package-lock.json        (empty)
git status --porcelain                                   (no scratch artifacts; every mirror lived outside the working tree)
```

The suite count moved 1187 -> 1196 across this plan. **It is reported as a floor and is never offered
as evidence that no bypass remains** — this suite was green in all eight rounds in which a defect was
later found, including twice inside this plan.

## Known Stubs

None.

## What the eighth spelling taught

The previous entries in this module's ledger were each about a rule's CONTENTS, its ARMS, its
JURISDICTION or its ALPHABET. This one was about the SET the arms covered: three derivations of one
fact whose union was not the set of node starts. The standing question it leaves, now recorded in the
module header:

> After collapsing a split predicate into one authority, ask what INPUT that authority is handed, and
> whether that input can carry the position its answer depends on. A single authority handed a LINE,
> asked a question about an OFFSET, is still a per-line answer wearing a single-authority label — and
> its arms will not look like arms, because there is only one of them.

The red-team round added a second, sharper one: **after completing an enumeration, ask which set the
predicate now ENUMERATES and whether the format's own grammar has more members than the ones a
finding happened to report.** D-51's first draft enumerated four flow positions and YAML defines six.

## Self-Check: PASSED

All five artifacts exist on disk and all four commits exist in git:
`scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`,
`scripts/fixtures/frontmatter-singleline-pre-d51.json`, `27-43-SUMMARY.md`;
`c3f5960`, `0ba77dd`, `6948d97`, `fc6673a`.
