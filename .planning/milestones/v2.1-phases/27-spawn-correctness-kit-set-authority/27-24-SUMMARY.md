---
phase: 27-spawn-correctness-kit-set-authority
plan: 24
subsystem: tooling / frontmatter parser + foundation guards
tags: [security, parser, spawn-grant, fail-open, gap-closure, tracer]
status: complete
requires:
  - scripts/frontmatter.ts (the single spawn-grant grammar, plan 27-12/27-18)
  - scripts/check-foundation-guards.ts (guard_wr05 + the KIT-03 oracle, both reading through it)
provides:
  - "A refusal of a YAML tag standing at a node start, applied at every place flattenBlock applies the reference refusal"
  - "A 17-row REFUSED_FORMS product with both cardinality pins raised to match"
  - "An aggregator-level skill-surface regression case for the tag-prefixed grant"
affects:
  - guard_wr05 (SPAWN-04) and the KIT-03 grant-closure read — both resolve through startsWithReference()
tech-stack:
  added: []
  patterns:
    - "Refuse an unresolved node PROPERTY the same way an unresolved node reference is refused — a parse artifact is never a verdict"
    - "Strip exactly one leading tag per NODE start, re-entering at each nested node's own start rather than stripping twice at one"
    - "Raise the cardinality pin in the same edit that adds the rows"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "`!` joins `&`/`*` in YAML_REF rather than being handled by a tag-specific branch: a tag is a node property this module does not resolve, which is the identical argument that refuses an anchor or an alias."
  - "The leading-tag strip is applied at EVERY node start startsWithReference knows about (the value, each flow fragment, each flow-mapping value), not only in front of the value — which is what makes the refusal a property of 'what is a node start' rather than a patch for the reported serializer."
  - "Exactly ONE tag is stripped per node: YAML permits one tag per node, so a second stripped token would be content, and stripping content would be this module resolving a document it deliberately does not resolve."
  - "The refusal message was extended to name an unresolved tag while keeping the `anchor or alias` substring verbatim, because two shipped assertions match the reason on it."
  - "WR-03 (the refused-product's titling / axis-completeness question) is deliberately OUT OF SCOPE this round — the case was not retitled and the product was not restructured beyond adding rows and raising pins."
metrics:
  duration: ~35 min
  completed: 2026-07-31
  tasks: 2
  commits: 2
  files_changed: 4
---

# Phase 27 Plan 24: Refuse a YAML Tag at a Node Start Summary

Closed CR-01 round 2: `scripts/frontmatter.ts` now refuses a YAML tag standing at a node start, so a
tagged anchor/alias reaches the parse-artifact arm instead of the silent no-grant SUCCESS arm — the
same fail-open this milestone already closed once, returning in a new spelling.

**Base commit sha (the pre-plan parser every RED below was measured against):**
`a9cfdad7ad116c4c2737a762a4af3745641824fc`

## What Was Built

**Task 1 — the refusal, the rebuilt `.js`, and the aggregator case** (commit `4dbd3ad`)

- `YAML_REF` widened from `/^[&*][^\s,[\]{}]/` to `/^[&*!][^\s,[\]{}]/`, with the tag argument
  recorded beside the existing anchor/alias argument in the same three parts (an unresolved node
  property means the expressed value is not the text on the line; a plain scalar cannot begin with
  `!` any more than with a sigil; a value that genuinely begins with those bytes must be quoted, and
  a quoted value is a literal this test correctly leaves alone).
- New `LEADING_TAG` / `stripLeadingTag`: one leading tag — the `!` indicator, then a verbatim `<…>`
  tag or the tag's run of non-space non-flow characters, then whitespace or the zero-width adjacency
  to a `[`/`{`. Applied at each node start `startsWithReference` knows about: the value itself, each
  flow fragment, and each flow-mapping value.
- `refuseRef()`'s reason extended to name an unresolved tag; the `anchor or alias` substring kept
  verbatim so `scripts/frontmatter.test.ts:336` and `scripts/check-foundation-guards.test.ts:501`
  keep asserting what they assert today. Neither assertion was touched.
- `scripts/frontmatter.js` rebuilt with `npm run build` and committed.
- One new aggregator-level case in `scripts/check-foundation-guards.test.ts`, sibling of the shipped
  anchor/alias skill-surface case: clean mirror asserted green first, then the tag-prefixed pair
  planted on `.claude/skills/grugops/SKILL.md` and the aggregator asserted nonzero, naming the file.

**Task 2 — the enumerated tag axis and the raised pins** (commit `392b744`)

- 12 new `REFUSED_FORMS` rows (5 → 17), each annotated with the application point or structural shape
  it exercises.
- Both cardinality pins raised in the same edit: `REFUSED_FORMS.length` 5 → 17, `checked` 60 → 204.
- One new no-false-red control case.

## RED-before / GREEN-after transcripts

### 1. Parser one-liner — RED-before (against the committed `scripts/frontmatter.js` at `a9cfdad`)

Command:

```
node --input-type=module -e '
import { hasSpawnGrant, grantedAgentNames } from "/Users/olgeroeselg/Projects/public/grugops/scripts/frontmatter.js";
const TAGGED = ["---","_t: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops-orchestrator)","allowed-tools: !!seq [*t]","---","body",""].join("\n");
const BARE   = ["---","_t: &t Read, Write, Bash, Glob, Grep, Agent(grugops-orchestrator)","allowed-tools: *t","---","body",""].join("\n");
console.log("TAGGED hasSpawnGrant    :", JSON.stringify(hasSpawnGrant(TAGGED)));
console.log("TAGGED grantedAgentNames:", JSON.stringify(grantedAgentNames(TAGGED)));
console.log("BARE   hasSpawnGrant    :", JSON.stringify(hasSpawnGrant(BARE)));
console.log("BARE   grantedAgentNames:", JSON.stringify(grantedAgentNames(BARE)));
'
```

Verbatim output:

```
TAGGED hasSpawnGrant    : {"ok":true,"value":false}
TAGGED grantedAgentNames: {"ok":true,"value":[]}
BARE   hasSpawnGrant    : {"ok":false,"reason":"`_t: &t Read, Write, Bash, Glob, Grep, Agent(grugops-orche...` uses a YAML anchor or alias; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference — it is refused rather than read as \"carries no grant\""}
BARE   grantedAgentNames: {"ok":false,"reason":"`_t: &t Read, Write, Bash, Glob, Grep, Agent(grugops-orche...` uses a YAML anchor or alias; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference — it is refused rather than read as \"carries no grant\""}
```

The BARE control in the SAME run is what proves the defect is the TAG and not the alias: the identical
document with a bare sigil is correctly refused, and the two-character tag in front of it restores the
silent no-grant arm.

### 2. Parser one-liner — GREEN-after (identical command, post-fix committed `.js`)

```
TAGGED hasSpawnGrant    : {"ok":false,"reason":"`_t: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops...` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference or a node property — it is refused rather than read as \"carries no grant\""}
TAGGED grantedAgentNames: {"ok":false,"reason":"`_t: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops...` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference or a node property — it is refused rather than read as \"carries no grant\""}
BARE   hasSpawnGrant    : {"ok":false,"reason":"`_t: &t Read, Write, Bash, Glob, Grep, Agent(grugops-orche...` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; ..."}
BARE   grantedAgentNames: {"ok":false,"reason":"`_t: &t Read, Write, Bash, Glob, Grep, Agent(grugops-orche...` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; ..."}
```

Both now return the `ok:false` arm, and the reason names the offending line.

### 3. Aggregator — RED-before (hermetic mirror, base-commit `frontmatter.js`)

Mirror built from `git ls-files` of the live tree into a temp dir; the clean baseline run was captured
first so the red could not be blamed on the mirror:

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js     # clean mirror, no plant
clean exit=0
== Result ==
ALL CHECKS PASSED
```

Then the tag-prefixed pair planted on `.claude/skills/grugops/SKILL.md` (the surface with no
freshness gate, no role corpus to cross-check, and only cardinality checked):

```
_tools: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)
allowed-tools: !!seq [*t]
```

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js
planted exit=0

[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does (23 non-coordinator adapter bodies + 2 packaging template(s) checked), and the coordinator body carries all 6 tier-announcement beats, each exactly once in live, non-fenced, non-commented text
...
== Result ==
ALL CHECKS PASSED
```

Exit 0, `ALL CHECKS PASSED`, over a skill file carrying a live `Agent(grugops-software-engineer)`
grant. Same at case level — with `git checkout a9cfdad -- scripts/frontmatter.ts scripts/frontmatter.js`
the new case fails on its first assertion:

```
$ npx vitest run scripts/check-foundation-guards.test.ts -t "TAG-PREFIXED"
 FAIL  guard_wr05 TAG-PREFIXED anchor/alias grant on a SKILL file → nonzero + parse failure names the file (CR-01 round 2, reproduced)
AssertionError: expected +0 not to be +0 // Object.is equality
 ❯ scripts/check-foundation-guards.test.ts:536:26
    536|     expect(r.status).not.toBe(0);
 Test Files  1 failed (1)
      Tests  1 failed | 89 skipped (90)
```

### 4. Aggregator — GREEN-after (same hermetic mirror, same plant, post-fix `.js`)

```
$ CHECK_ROOT=<mirror> node scripts/check-foundation-guards.js
planted exit=1

[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops/SKILL.md: frontmatter parse failure — `_tools: !!str &t Read, Write, Bash, Glob, Grep, Agent(gru...` uses a YAML anchor or alias, or an unresolved YAML tag standing in front of one; the value this document expresses is not the text on this line, and this module deliberately does not resolve a reference or a node property — it is refused rather than read as "carries no grant". An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"
...
== Result ==
1 CHECK(S) FAILED
```

`grep -c "PASS  WR-05:"` over that output returns `0` — the refusal was not folded into the no-grant
branch, so no passing WR-05 line is printed over a file the guard never read.

### 5. Task 2 RED-before (base-sha parser, enlarged `REFUSED_FORMS`)

```
$ git checkout a9cfdad -- scripts/frontmatter.ts scripts/frontmatter.js
$ npx vitest run scripts/frontmatter.test.ts

 ❯ scripts/frontmatter.test.ts (30 tests | 2 failed) 17ms
     × REFUSES every YAML reference form x indents x values — and never returns the no-grant SUCCESS arm
     × the refusal holds identically under the skill form of the key (allowed-tools)

AssertionError: TAG axis / KEY-LINE — double-indicator shorthand tag in front of the anchor, tagged flow alias on the tools key (the CR-01 round-2 reproduction) | indent=2 | no grant — the ordinary shipped tool list: expected true to be false
 ❯ scripts/frontmatter.test.ts:452:36

 Test Files  1 failed (1)
      Tests  2 failed | 28 passed (30)
```

Restored with `git checkout HEAD -- scripts/frontmatter.ts scripts/frontmatter.js`;
`git status --porcelain scripts/frontmatter.ts scripts/frontmatter.js` printed nothing.

**Honest note on "names every newly added row":** the refused product is a LOOP and its first failing
assertion throws, so the vitest RED above names only the FIRST new row (N1) before aborting — it does
not enumerate all twelve. The per-row table below therefore comes from a separate scratchpad probe
(never committed) that restates the twelve emit shapes and evaluates each against three parsers. That
probe is a diagnostic, not an assertion; the committed assertions are the product rows themselves.

### 6. Per-row first-run record (three-parser probe)

`BASE` = `frontmatter.js` at `a9cfdad`. `SIGIL-ONLY` = this plan's parser with `!` in `YAML_REF` but
`stripLeadingTag` neutralised to the identity — included to isolate which rows the STRIP (rather than
the widened sigil class) is load-bearing for. `HEAD` = as committed.

| Row | Shape | BASE | SIGIL-ONLY | HEAD | Red on first run against the Task-1 parser? |
|-----|-------|------|-----------|------|---------------------------------------------|
| N1 | KEY-LINE, double-indicator shorthand pair (the reproduction) | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N2 | KEY-LINE, tag on the tools key's own value | passed through `ok:true value:true` | REFUSED | REFUSED | yes |
| N3 | FLOW-ITEM, tagged flow collection with anchor + alias | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N4 | SEQ_ITEM, tagged block-sequence items | passed through `ok:true value:true` | REFUSED | REFUSED | yes |
| N5 | PLAIN-CONTINUATION, tagged alias on a wrapped line | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N6 | SHAPE, single-indicator local tag | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N7 | SHAPE, named handle with a second indicator inside | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N8 | SHAPE, verbatim angle-bracket tag | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N9 | SHAPE, BARE non-specific tag (second char is a space) | passed through `ok:true value:false` | **passed through `ok:true value:false`** | REFUSED | yes |
| N10 | ADJACENCY, tag butting the collection, no whitespace | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N11 | ADJACENCY, tag then anchor then collection | passed through `ok:true value:false` | REFUSED | REFUSED | yes |
| N12 | NESTING, bare tags on nodes INSIDE a flow collection | passed through `ok:true value:false` | **passed through `ok:true value:false`** | REFUSED | yes |

**All twelve rows were RED against the Task-1 parser on first run. No row required the strip to be
extended in Task 2, and no row is described here as having proven something it did not.**

Two facts worth stating plainly rather than leaving implicit:

- **N9 and N12 are the only rows the STRIP is load-bearing for.** Their second character is a space
  or a flow indicator, so the widened sigil class alone cannot see them — the SIGIL-ONLY column shows
  both sliding through into the no-grant SUCCESS arm. The other ten rows are refused by the widened
  sigil class and would be red even without the strip. That is an honest weakening of what the ten
  rows prove about the new mechanism, and it is exactly why N9 and N12 exist.
- **N2 and N4 do NOT reproduce a silent NO-grant against BASE.** Their tag is prefix text on the same
  physical line, so BASE still saw the spawn token and returned `ok:true value:true`. Their defect
  direction against BASE is "returned a verdict over input it did not understand", not "returned a
  clean no-grant". Both are still correctly refused now.

**N12 was corrected mid-task.** Its first draft carried a `_tools: !!str &t …` helper key, which the
widened sigil class refuses on line 1 — so the row would have been green for a reason having nothing
to do with the nesting it claims to cover (the SIGIL-ONLY probe caught this: the first draft showed
`REFUSED` under SIGIL-ONLY). It was rewritten to put both bare tags inside the flow collection with no
tagged key line of its own. The row was changed to state the shape correctly, not to match the
implementation.

## Cardinality pins

| Pin | Pre-edit | Post-edit |
|-----|----------|-----------|
| `REFUSED_FORMS.length` floor | `>= 5` (actual 5) | `>= 17` (actual 17) |
| refused-product `checked` floor | `>= 60` (actual 60) | `>= 204` (actual 204) |

Both raised in the same edit that added the rows. The exact-equality assertion
`expect(checked).toBe(REFUSED_FORMS.length * INDENTS.length * VALUES.length)` was left untouched, so
a dropped row fails both the product identity and the floor.

## Case counts

| Suite | Before | After |
|-------|--------|-------|
| `scripts/check-foundation-guards.test.ts` | 89 | 90 (exactly one greater) |
| `scripts/frontmatter.test.ts` | 29 | 30 (the no-false-red control) |
| full suite (`--exclude '**/scripts/e2e/**'`) | 977 passed / 2 skipped | 978 passed / 2 skipped |

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` then `npm run freshness` | exit 0 — "All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild." |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 35 files, 978 passed / 2 skipped, exit 0 |
| `node scripts/check-foundation-guards.js` on the live tree | exit 0 (no false red from the widened refusal) |
| `node scripts/adapters-freshness.js` | "17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal." |
| `git diff` Task 1 touches `scripts/frontmatter.test.ts`? | no |
| Deletions inside the shipped anchor/alias aggregator case? | none |
| Deleted lines in `scripts/frontmatter.test.ts` (whole plan) | exactly 3: the two old pin values and one stale "Five rows" comment line — no row, matcher or "not the success arm" assertion removed |
| `git status --porcelain` clean of scratch fixtures / temp checkouts | yes (only `.planning/` docs remain) |

## Deviations from Plan

None. The plan was executed as written.

Two in-scope judgement calls worth recording:

1. **The tracer feedback gate was satisfied by re-running the tracer's `<verify>` end-to-end rather
   than by emitting a checkpoint.** The plan declares `autonomous: true` and carries no
   `checkpoint:*` task, and the tracer's `<verify>` block is entirely `<automated>` — there is
   nothing for a human to eyeball. `npx tsc --noEmit && npm run build && npm run freshness && npx
   vitest run scripts/check-foundation-guards.test.ts` was re-run after the tracer commit and exited
   0 (90 passed) before any expansion work began.
2. **A thirteenth row (N12, the nested bare tag) was added beyond the plan's enumerated eleven.** The
   plan named five application points, four tag shapes and two adjacency shapes; the bare
   non-specific tag (N9) and the nested bare tag (N12) were added because they are the only two
   shapes the leading-tag strip — the new mechanism — is load-bearing for. An enumeration of the new
   mechanism that contained no row the mechanism was required for would have proven nothing about it.

## Out of scope, recorded deliberately

- **WR-03 (round 2) is out of scope for this round.** The refused-product case was NOT retitled and
  the product was NOT restructured beyond adding rows and raising pins. The titling and
  axis-completeness question WR-03 raises stands unaddressed by design.
- **The SPAWN-04 `unclassified` edge probe row is still unresolved and carried forward**, exactly as
  the plan's flagged-assumptions section states. Every check in this phase reads a FILE, not a
  runtime; this refusal narrows the gap between the two but does not eliminate it.

## Known Stubs

None. No placeholder, hardcoded-empty or TODO value was introduced.

## Threat Flags

None. This plan introduced no new network endpoint, auth path, file-access pattern or schema change
at a trust boundary; it narrows an existing one.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (tracer) | `4dbd3ad` | fix(27-24): refuse a YAML tag standing at a node start (CR-01 round 2) |
| 2 | `392b744` | test(27-24): enumerate the tag axis at every application point and raise both pins |
| — | `1f2c237` | docs(27-24): record the CR-01 round-2 tag-refusal plan summary |

## Self-Check: PASSED

All five claimed files exist on disk; all three claimed commit hashes resolve in `git log`.
