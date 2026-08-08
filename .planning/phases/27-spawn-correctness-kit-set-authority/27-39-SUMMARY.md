---
phase: 27-spawn-correctness-kit-set-authority
plan: 39
subsystem: frontmatter-parser
tags: [spawn-correctness, yaml, parser, safety-invariant, gap-closure-round-7]
status: complete
requires:
  - phase: 27-38
    provides: ENUMERATION_LEGAL_CHARS and the enumeration sweep this plan leaves untouched
provides:
  - "scripts/frontmatter.ts Accumulator.openQuote — the quote state a scalar leaves open at a line boundary, carried across the lines it occupies"
  - "scripts/frontmatter.ts Accumulator.nodeOnKeyLine — may a node BEGIN on this continuation line"
  - "scripts/frontmatter.ts nodeStartQuote() — the node-start gate that licenses a quote state to cross a line boundary"
  - "scripts/frontmatter.ts the seeded-and-returning comment scanner — one walk, one answer, no per-line re-derivation"
  - "scripts/frontmatter.test.ts the D-49 fourth-axis sweep — 6 scalar styles x 5 sigils x 3 placements = 90 cells"
  - "scripts/frontmatter.test.ts WR01_FALSE_RED_FORMS — the two loader-disproven refusal rows, inverted rather than deleted"
  - "scripts/frontmatter.test.ts the self-deriving repository-wide refusal control, corpus from git ls-files at run time"
affects:
  - "check-foundation-guards.ts guard_wr05 (SPAWN-04) — the parse-failure branch and the grant verdict, unedited but now fed a correct value"
  - "the KIT-03 closure equality and coordinator-resolution-precheck — both consume keysGrantedAgentNames' name set"
tech-stack:
  added: []
  patterns:
    - "state that belongs to the CONSTRUCT rather than to the line, carried in one field and read by every consumer"
    - "a sweep corpus generated over the same UNIT as the construct under test"
    - "a control that derives its own corpus at run time instead of comparing against a recorded baseline"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-48 implemented: quote state is a property of the SCALAR, not of the physical line; CR-01, WR-01 and the continuation-JOIN direction closed by one change"
  - "D-49 implemented: a fourth sweep axis enumerated over a construct that spans lines; every platform claim carries a real YAML 1.2 loader transcript"
  - "The carry is GATED ON THE NODE START — a quote character is only a quote where a node may begin (executor deviation, caught by this plan's own value map)"
  - "The same three directions were closed in the PLAIN wrapped scalar too, not deferred (executor deviation, required by this plan's own prohibition)"
metrics:
  duration: ~40 min
  completed: 2026-08-08
actuals:
  tokens: 78000
  tasks: 2
  commits: 3
---

# Phase 27 Plan 39: The Carried Scalar Quote State Summary

Closed the sixth spelling of this module's founding failure — a per-physical-line state
reset in the value ASSEMBLY, below every predicate rounds 1-5 patched — by promoting the
scalar to the unit of parsing, which turned a wrapped rogue spawn grant on the shipped
plugin-skill surface from `ALL CHECKS PASSED` at exit 0 into a red gate.

## What was wrong

`stripComment`, `startsWithReference` and the `SEQ_ITEM` item boundary each decided their
state per PHYSICAL LINE while `flattenBlock` handed them one line at a time. **A YAML
scalar does not end at a line boundary**, so a multi-line scalar was analysed as N
independent single-line documents and the module got it wrong in three directions at once.

## Task 1 — the carry (commits `af67c1b`, `79a11db`)

### Parser RED/GREEN, against the committed `scripts/frontmatter.js`

RED captured on a `git archive HEAD` mirror of `2af6151` **before any edit**; GREEN against
the rebuilt committed `.js`. Loader column is `/usr/bin/ruby -ryaml` — **Ruby 2.6.10 /
Psych 3.1.0 / libyaml 0.2.1**.

| # | document | RED (committed) | GREEN (rebuilt) | loader |
|---|---|---|---|---|
| CR-01 A | `tools: "Read,` / `  # x, Agent(…)"` | `{ok:true,value:false}`, flat `"Read,` | `{ok:true,value:true}`, flat `Read, # x, Agent(…)` | `"Read, # x, Agent(…)"` |
| CR-01 B | the same, single-quoted | `{ok:true,value:false}` | `{ok:true,value:true}` | same value |
| CR-01 C | wrapped block-sequence item | `{ok:true,value:false}`, flat `Read, "Write,,` | `{ok:true,value:true}` | `["Read", "Write, # x, Agent(…)"]` |
| CR-01 control | the same value on ONE line | `{ok:true,value:true}` | unchanged | — |
| WR-01 a | `description: "see` / `  *emphasis* here"` | REFUSED — *anchor or alias* | `{ok:true}`, `see *emphasis* here` | `"see *emphasis* here"` |
| WR-01 b | `  !important stuff"` | REFUSED — same | `see !important stuff` | `"see !important stuff"` |
| WR-01 c | `  &D work"` | REFUSED — same | `see &D work` | `"see &D work"` |
| JOIN a | `tools: "Read,` / `  - # n, Agent(…)"` | `{ok:true,value:false}`, flat `"Read,` | `{ok:true,value:true}`, flat `Read, - # n, Agent(…)` | `"Read, - # n, Agent(…)"` |
| JOIN b | the same in a wrapped item | `{ok:true,value:false}`, flat `Read, "Write,` | `{ok:true,value:true}` | `["Read", "Write, - # n, Agent(…)"]` |
| JOIN c | `tools: "Agent(alpha, ga` / `  - mma)"` | names `["alpha","ga","mma"]` | names `["alpha","ga - mma"]` | `"Agent(alpha, ga - mma)"` |
| JOIN c control | the same on ONE line | names `["alpha","ga - mma"]` | unchanged | — |

CR-01 A/B and JOIN a/c now flatten **byte-equal to libyaml**.

### Gate RED/GREEN, end to end on hermetic mirrors

Plant: the last `allowed-tools` item of **both distribution twins** of a shipped command
skill replaced by a wrapped quoted item whose continuation line opens with a hash, a note,
a comma and a live `Agent(grugops-orchestrator)`. Both twins edited together so
`guard_distribution_pair` cannot fail for the wrong reason.

| mirror | plant | RED (committed `.js`) | GREEN (rebuilt `.js`) |
|---|---|---|---|
| `skills/plan` + `.claude/skills/grugops-plan` | **wrapped** | `ALL CHECKS PASSED`, **exit 0**, planted path in **0 findings** | `1 CHECK(S) FAILED`, **exit 1**, both twins named |
| the same pair | **unwrapped** (discriminating control) | `1 CHECK(S) FAILED`, exit 1 | exit 1 |

In the RED wrapped run the only occurrence of the planted path anywhere in the output was a
`PASS  … pointer-sized` line — **zero findings**. One line break flipped a red gate green
over a live spawn grant.

**Adversarial re-verification (a green suite is not proof).** The same bypass was
reproduced independently on a *different* surface and a *different* spelling — a
**single-quoted** wrapped item carrying **both** a dash and a hash, planted on
`skills/gate` + `.claude/skills/grugops-gate`: pre-fix `ALL CHECKS PASSED` exit 0 / 0
findings, post-fix exit 1 naming both twins.

Twelve further red-team spellings the plan never named were run against the rebuilt build —
three-line quoted scalars with the token on line 3, the `allowed-tools` skill key, CRLF,
tab-indented continuations, a quote that closes and reopens mid-line, deeper indentation, a
doubled `''` escape, an unterminated quote, and a nested dash-plus-hash item. **All grant.**
The `\<LF>` escaped-line-break residual still REFUSES (D-30's documented policy, the safe
direction), and a wrapped token under `description:` correctly stays **no-grant** — the
scoped-key contract did not become a false positive.

### Repository-wide cost, both numbers DERIVED in their own run

| | corpus (`git ls-files '*.md'`) | files read | refusals |
|---|---|---|---|
| before (committed `.js` on the mirror) | 1131 | 1131 | **0** |
| after (rebuilt committed `.js`) | 1131 | 1131 | **0** |

The two derived sizes are equal. These numbers are a **record of this run** and are
deliberately not written back into any plan or assertion.

**Flattened value map over every tracked markdown file: byte-identical, 0 differences over
1131 files compared.** This is a ONE-SHOT execution-time transcript and is deliberately NOT
a suite case — its `before` image is a build that ceased to exist the moment Task 1 landed
and lived on a throwaway mirror, so a permanent case asserting against it would fail once
the mirror was cleaned up or, worse, be "fixed" later by narrowing it until it passed. The
suite keeps a self-deriving control instead.

### Comment corrections, each shipped with the case that makes it true

| corrected comment | the case that pins it |
|---|---|
| the comment scanner's *"only ever makes a value SHORTER … never a hidden token"* (false for three rounds) | `CR-01 A/B/C` — the continuation was discarded WHOLE and the token was hidden |
| `startsWithReference`'s claim about `R&D` and markdown emphasis (true single-line, false wrapped) | the three `WR-01` cases |
| the sixth entry in the founding-failure history | the whole D-48 describe block |
| the `nodeStartQuote` gate's rationale | *an apostrophe inside a PLAIN scalar opens nothing across a line boundary* |

## Task 2 — the fourth axis (commit `b581f54`)

**6 scalar styles x 5 sigils x 3 placements = 90 cells**, count asserted.

| run | failing cells | line 1 | continuation | both |
|---|---|---|---|---|
| RED — pre-Task-1 committed `.js` | **27** | **0** | 15 | 12 |
| GREEN — rebuilt committed `.js` | **0** | 0 | 0 | 0 |

The column asymmetry **is** the defect, stated as data: not one line-1 cell ever failed,
which is exactly why three axes that are each a property of one physical line could pass
green over it.

Four pins, all present, none an alternative to another:

1. the expected-outcome rule — a pure function of the three axis labels, with the
   **mandatory** source-inspection assertion that it names no module symbol;
2. a second, independently written truth table covering **all 30** continuation-column
   cells, asserted against both the rule and the module;
3. a loader cross-check over six named cells spanning all six scalar styles, agreeing on
   **token presence** (byte equality is deliberately not the predicate — this module joins a
   block sequence with a comma-space by contract), which **prints** its reason if Ruby is
   absent rather than skipping silently;
4. the **self-deriving** repository-wide false-red control: corpus from `git ls-files '*.md'`
   at run time, zero refusals, non-empty, derived size reported in the assertion message. **No
   corpus-size literal appears in any assertion.**

A failing cell names all three axis labels, demonstrated by inverting one cell in a scratch
edit (restored immediately):

```
AssertionError: style=plain wrapped scalar | sigil=comment `#` | placement=line 1:
  expected { ok: true, value: true } to deeply equal { ok: true, value: false }
```

**One measured module/loader divergence on a loadable document, recorded not hidden:**
`plain wrapped scalar / tag ! / line 1` — libyaml reads `! Read,` as a non-specific tag and
loads the value; this module refuses the unresolved tag. That refusal **pre-dates this
plan**, is D-30's declared policy, and points in the safe direction. Of the 90 cells the
loader accepts 84 and rejects 6 outright; module and loader agree on token presence in 83
of the 84.

## Deviations from Plan

### 1. [Rule 1 — Bug in the fix] The carry had to be gated on the NODE START

- **Found during:** Task 1, by this plan's own before/after value map.
- **Issue:** the first draft stored the scanner's exiting flags unconditionally. In YAML a
  quote is only a quote where a node may BEGIN; inside a plain scalar an apostrophe is text.
  A lone apostrophe (`- headroom for 27-06's frontmatter key`) propagated a phantom open
  quote and **swallowed the next line's item boundary, merging two genuine sibling list
  items** in 10 real `.planning/` documents.
- **Invisible to every case in the suite and to all nine named CR-01/WR-01/JOIN anchors** —
  caught only by comparing the flattened value map over all 1131 tracked markdown files.
- **Fix:** `nodeStartQuote()` gates the carry at the node start. Pinned by a case.
- **Commit:** `af67c1b`.

### 2. [Rule 1/2 — same root cause, other spelling] The PLAIN wrapped scalar

- **Found during:** Task 2, while resolving the sweep's expected-outcome rule against the loader.
- **Issue:** `openQuote` alone closes only the QUOTED spellings. Measured against the build
  that landed the quote carry, the plain wrapped scalar still carried **all three
  directions**: `tools: Read,` / `  *Agent(x)` was REFUSED where libyaml returns it as
  content, and `tools: Agent(alpha, ga` / `  - mma)` still enumerated `["alpha","ga","mma"]`
  where the document and libyaml express `["alpha","ga - mma"]` — the invented name again,
  on the success arm.
- **Why not deferred:** this plan's own prohibition forbids splitting a root cause by which
  side a finding arrived from; that is the enumerate-the-bad shape this phase has corrected
  six times.
- **Fix:** `Accumulator.nodeOnKeyLine`, the second fact belonging to the node rather than the
  line, derived once as `startsNode = !inScalar && !nodeOnKeyLine`. The comment scanner keeps
  reading `openQuote` **alone**, because a `#` on a plain scalar's continuation line IS a
  comment — libyaml agrees, and collapsing the two facts would be wrong in that direction.
- **Commit:** `79a11db`.

### 3. [Rule 1 — a shipped assertion asserted the opposite of the platform] Two REFUSED_FORMS rows inverted

- Two rows asserted that a reference sigil on a **plain continuation line** is refused.
  libyaml loads `tools: Read, Grep,` / `  *t` to the plain string `Read, Grep, *t` — the
  `*t` is text. The refusal was WR-01 itself, enshrined as an assertion.
- **They were inverted, not deleted:** `WR01_FALSE_RED_FORMS` asserts they now parse, carry
  the loader's value byte for byte, and land on the **no-grant success arm**. Both cardinality
  floors moved with the table in the same edit (35→33, 420→396) with a floor of their own
  added, per this file's own rule that a floor tracks its table.
- Genuine node starts are untouched: an alias on a **key line** (which libyaml RESOLVES to
  the granting value) and an anchor on a **block-sequence item** both still refuse by name.

## Verification

| check | result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — 32 committed `.js` match a fresh rebuild |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1141 passed / 2 skipped**, 35 files (baseline at task start 1111/2; floor 1068) |
| `node scripts/check-foundation-guards.js` | exit 0 on the live tree |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 (bare invocation exits 1 demanding the env var — identical before and after; not a regression) |
| live kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills |
| `git diff package.json` | empty |
| live tree | every plant ran on a throwaway `git archive` mirror; `git status --porcelain` clean apart from this plan's files |

The suite floor is a **floor, not evidence** — it has been green in every one of the six
rounds of this phase in which a defect was later found. The evidence is the RED transcripts
above and the two independent gate reproductions.

## Residual, recorded rather than dropped

`tools: "Read, Ag\` / `  ent(grugops-orchestrator)"` — YAML's **escaped line break**, which
folds with no space. libyaml returns a live grant; this module **REFUSES**, naming `\ ` as
outside `DQ_ESCAPE_ALLOWLIST`. **Disposition: record, do not fix** — resolving `\<LF>` is
DECODING, which D-30 declines by contract; the direction is a loud refusal, never a hidden
token. Not counted against the false-red budget: no tracked markdown file uses the
construct, asserted by the repository-wide control. Re-confirmed still refusing after this
plan (red-team row R9).

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts` — all present and modified.
- Commits `af67c1b`, `79a11db`, `b581f54` — all present in `git log`.
- The safety invariant was verified adversarially, not by a green suite: the CR-01/WR-01/JOIN
  reproductions were re-run against the rebuilt committed `.js`, a second independent
  gate reproduction was built on a different surface and spelling, and twelve unnamed
  red-team spellings were checked. All fail closed.
