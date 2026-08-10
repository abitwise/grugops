---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-10T17:11:24Z
depth: standard
round: 11
diff_base: 3c7930b
files_reviewed: 13
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.js
  - scripts/frontmatter.test.ts
  - scripts/fixtures/frontmatter-singleline-pre-d54.json
  - scripts/check-foundation-guards.test.ts
  - scripts/context-freshness.test.ts
  - scripts/context-io.test.ts
  - scripts/generate-catalog.test.ts
  - scripts/generate-role-adapters.test.ts
  - install/install.test.ts
  - tsconfig.tests.json
  - package.json
  - .github/workflows/ci.yml
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 27: Code Review Report (round 11)

**Reviewed:** 2026-08-10T17:11:24Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Round 11's four source edits each close what they say they close **at the positions they were
measured at**. The two Critical findings below are both about the positions nobody measured, and
both reduce to the question this module's own ledger has now asked six times (entries nine through
fourteen: what INPUT, what CONDITIONS, at which POSITIONS, WHOSE question, what may stand IN FRONT,
and against which NUMBER):

- **CR-01** — D-62 asked the right question about the wrong quantity a second time. `27-58` moved the
  block-scalar end condition off the header line's indent and onto the scalar's own detected content
  indentation, which is correct; but it then took the **base for the explicit indentation indicator**
  and the **floor for detection** from the *physical header line's* indent, where YAML 1.2 § 8.1.1.1
  defines both relative to the **parent node's** indentation. The two coincide at `key: <header>` and
  at the top-level key line — every position `27-58` measured, and every position the corpus can
  spell — and diverge at every sequence-related position. **134 disagreeing cells over a 2,835-cell
  indentation cross-product, 86 of them silent no-grants**, one of them a **regression against
  `3c7930b`**, and **two independent end-to-end gate reproductions at `ALL CHECKS PASSED`, exit 0**.
- **CR-02** — D-61's fourth application point for the reference refusal is asked at **one of the two
  sites `blockHeaderAt` is called from**. The introduction *set* became data, as the plan says; the
  *call sites* did not. `27-56`'s own adversarial pass wrote the two sites down
  (`deferred-items.md:1559`) and `27-57` wired only the continuation one. Reproduced as a live silent
  no-grant on a document `/usr/bin/ruby -ryaml` **accepts**, with the grant in the loaded
  `allowed-tools` value, at `ALL CHECKS PASSED`, exit 0.

Everything below was measured against the committed build at HEAD, with the loader column from
`/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1).

**Harness premises asserted before any result was believed**, per this phase's standing lesson:

| Premise | Result |
|---|---|
| `scripts/frontmatter.js` is a faithful build of the `.ts` | `tsc --outDir <tmp>` exit **0**; `/usr/bin/diff` over all **32** emitted `.js` files → **0 drift**. The committed build is provably its own source; every probe below therefore measures the shipped artifact |
| the probe can see a grant at all | a plain one-line `allowed-tools: …, Agent(grugops-orchestrator)` planted on both twins of the non-coordinator `map` skill → gate **exit 1** |
| the unplanted mirror is green | `git archive HEAD` mirror, `node scripts/check-foundation-guards.js` → **exit 0** |
| the pre-round build behaves differently where a regression is claimed | `git archive 3c7930b`, same plant → **exit 1** (CR-01 row A) |
| the suite is a floor and nothing more | `npx vitest run --exclude '**/scripts/e2e/**'` → **1346 passed \| 2 skipped**, `npm run typecheck` → **exit 0**, `tsc -p tsconfig.tests.json --listFiles` reaches **36 of 36** tracked `.test.ts` files. **None of this is offered as evidence of anything.** Every finding below is live under all of it |

Round-10 disposition, judged against the code rather than the SUMMARYs:

| Round-10 item | Verdict |
|---|---|
| CR-01 `sawBlock` sticky exemption | **CLOSED** — the flag is gone (`interface Part`, `frontmatter.ts:1630-1638`); the run-boundary resolution at `frontmatter.ts:1997-2043` is byte-identical for a key with no block scalar |
| CR-02 node property before a block indicator | **CLOSED on the continuation path, OPEN on the item path** — see CR-02 below. The *strip* is complete; the *refusal* is not |
| CR-03 `KEY_LINE` borrowed for the nested key | **CLOSED** — `blockMapImplicitEntry` (`frontmatter.ts:888-911`) owns the nested spelling; `KEY_LINE` has one code use again |
| WR-01 over-included content line | **PARTIAL** — closed where the header line's indent equals the parent node's, live at every other position; see CR-01 / WR-01. The register (`deferred-items.md:3024`) records it **FIXED** |
| WR-02 / IN-01 folded blank line | **CLOSED** — 56-cell fold/blank-line/more-indented cross product, **0** name-set disagreements against the loader |
| WR-03 coupled `state` differential | **CLOSED** — 24 → 48 vectors, capture regenerated, negative control quoted verbatim |
| WR-04 `noUnusedLocals` reaching zero test files | **CLOSED** — 0 → **36 of 36**, wired into CI, six real violations fixed |
| IN-02 fence-authority prose half | **CLOSED** — mechanical discriminator added |
| IN-03 source-scan brittleness | **CLOSED** — asserted bound + identity + comment-stripped negative |

---

## Critical Issues

### CR-01: the block scalar's indentation landmark is the physical header LINE, not the parent node — 86 silent no-grants, one of them a round-11 regression, reproduced through the full gate twice at exit 0

**File:** `scripts/frontmatter.ts:2061-2092` (`openBlock`), specifically `:2067`
(`a.blockIndent = headerIndent`) and `:2074-2075`
(`a.blockContentIndent = headerIndent + header.explicitIndent`); the end condition at `:2164-2167`;
the two call sites that supply the wrong number, `:2350` (`openBlock(cur, itemHeader, indent)`) and
`:2426` (`openBlock(cur, lineHeader, indent)`).

**Issue:**
YAML 1.2 § 8.1.1.1 defines *both* block-scalar indentation quantities relative to the **parent
node's** indentation: the auto-detection floor ("more indented than the parent node") and the base
the explicit indentation indicator is added to. `openBlock` is handed `headerIndent`, and every call
site passes the **indentation of the physical line the header appeared on**.

Those two numbers are equal at `tools: >-` (top level), at `  nested: >-` (a mapping key's own indent
*is* the mapping's indentation) and at `  - >-` (a dash's indent *is* the sequence's). They are
**not** equal wherever a block-context construct consumes columns on the header line:

| shape | header line's indent | parent node's indentation |
|---|---|---|
| `  -` newline `    >-` (bare header on its own line under a dash) | 4 | **2** (the sequence) |
| `  - k: >-` (compact mapping inside a sequence item) | 2 | **4** (the mapping) |
| `  - - >-` (compact nested sequence) | 2 | **4** (the inner sequence) |

`27-58` measured the digit "on **eight** rows across all three positions a header can appear at" —
and all eight sit in the coinciding column. This is `27-58`'s own stated defect class, one plan
later: *"a landmark that USUALLY coincides with the right one is the worst kind, because it makes the
corpus agree."*

**Row A — the regression. `>-2` at a bare header under a dash.**

```
---
name: r
tools:
  -
    >-2
      Read,
     # x, Agent(grugops-orchestrator)
---
```

| build | `hasSpawnGrant` | flattened `tools` |
|---|---|---|
| **HEAD** | `{"ok":true,"value":false}` — **SILENT NO-GRANT** | `"Read,, "` (the seq join over an empty block region plus the truncated content) |
| `3c7930b` (pre-round) | `{"ok":true,"value":true}`, names `["grugops-orchestrator"]` | `Read, # x, Agent(grugops-orchestrator)` |
| `/usr/bin/ruby -ryaml` | — | `["  Read,\n # x, Agent(grugops-orchestrator)"]` — **the grant is in the loaded value** |

The module computes `blockContentIndent = 4 + 2 = 6`; the loader computes `2 + 2 = 4`. The line at
column 5 is inside the scalar for the loader and outside it for the module, so the scalar ends, the
line is re-offered to `stripComment`, and its leading `#` deletes the grant. This is the module's
founding failure — "I could not read this" printed as "this carries no grant" — **introduced by this
round's own fix for the mirror-image defect**.

**Gate reproduction, row A.** `git archive HEAD` mirror, the same shape planted in the *existing*
`allowed-tools:` key of both twins of the non-coordinator `map` skill
(`.claude/skills/grugops-map/SKILL.md` and `skills/map/SKILL.md`, so `guard_distribution_pair` stays
green):

```
allowed-tools:
  -
    >-2
      Read, Write, Bash, Glob, Grep,
     # x, Agent(grugops-orchestrator)
```

- `/usr/bin/ruby -ryaml` reads `allowed-tools` as
  `["  Read, Write, Bash, Glob, Grep,\n # x, Agent(grugops-orchestrator)"]`
- `node scripts/check-foundation-guards.js` on **HEAD** → `ALL CHECKS PASSED`, **exit 0**
- the identical plant on a `git archive 3c7930b` mirror → `1 CHECK(S) FAILED`, **exit 1**

**Row B — no digit required. The auto-detection FLOOR is the same wrong number.**

```
---
name: r
tools:
  -
    >-
   Read,
   # x, Agent(grugops-orchestrator)
---
```

- module: `{"ok":true,"value":false}`, `tools` flattened to `", Read,"` (the block region is empty)
- loader: `["Read, # x, Agent(grugops-orchestrator)"]`

Content at column 3 must exceed the *parent's* 2 (loader: inside) and the module requires it to
exceed the *header line's* 4 (module: outside). **Gate reproduction:** the same shape planted on the
same two twins → `ALL CHECKS PASSED`, **exit 0**. Row B is pre-existing rather than a regression, but
it is the family `27-58`/D-62 exists to close and it survives the fix untouched, at both indicator
spellings (`>-` and `|-`).

**Blast radius, measured rather than asserted.** A 2,835-cell cross product — 7 header positions ×
5 indicator spellings (`>-`, `|-`, `>-1`, `>-2`, `>-3`) × the two content lines' indentation each
varying independently over columns 1-9 — of which **1,926 cells are loader-ACCEPTED**:

| direction | position | cells |
|---|---|---|
| SILENT NO-GRANT | `bareundash` (`  -` / `    <header>`) | **86** (`>-` 13, `\|-` 13, `>-1` 24, `>-2` 20, `>-3` 16) |
| MODULE GRANT / LOADER NONE | `seqcompact` (`  - k: <header>`) | 24 (`>-1` 10, `>-2` 8, `>-3` 6) |
| MODULE GRANT / LOADER NONE | `seqnested` (`  - - <header>`) | 24 (same distribution) |
| — | `topkey`, `nested`, `seqitem`, `explicitval` | **0** — the coinciding column, which is the whole corpus's column |

**Fix:** carry the **parent node's indentation** into `openBlock` instead of the header line's, and
derive it at each call site from what that site already knows rather than from `indentOf(raw)`:

```ts
// openBlock signature — name the quantity YAML names.
const openBlock = (a: Accumulator, header: BlockHeader, parentIndent: number): void => {
  a.blockIndent = parentIndent;                       // the DETECTION FLOOR (§ 8.1.1.1)
  a.blockContentIndent =
    header.explicitIndent === null ? null : parentIndent + header.explicitIndent;
  // …
};

// :2350 item path — the dashes were consumed; the node's parent is the sequence, whose
// indentation is the DASH's indent, but a compact mapping/sequence on the same line moves it.
// The item path already computes how many columns it consumed; pass `indent + consumedColumns`
// when the header sits behind a `k:` or a second `-`, and `indent` when it does not.

// :2426 continuation path — a header on its own line under a `-` belongs to the SEQUENCE,
// not to the line: pass `cur.seqIndent ?? indent` rather than `indent` when the previous line
// was a content-free sequence item.
```

Whatever shape is chosen, the pin must be an **axis over the header line's indent versus the parent
node's indentation**, not the three rows in the table above — the corpus cannot currently spell a
single cell where the two differ (WR-02), which is exactly why 134 disagreements shipped green.

---

### CR-02: D-61's fourth application point for the reference refusal is asked at one of the two sites `blockHeaderAt` is called from — a live silent no-grant on a loader-ACCEPTED document, at exit 0

**File:** `scripts/frontmatter.ts:751-765` (`mappingSeparatorNodeStarts`), its **single** call site at
`:2447-2450`; the sequence-item path's own reference test at `:2317`
(`if (startsWithReference(itemText)) return refuseRef(t)`), which asks only offset 0 of the item text.

**Issue:**
D-61's argument is that the introduction set became **data**, so "a fifth introduction inherits both
questions by construction" (`frontmatter.ts:719-720`). That is true of the introductions and false of
the **call sites**. `blockHeaderAt` is called from exactly two places — `27-56`'s own adversarial pass
enumerated them from the code and wrote them down
(`deferred-items.md:1559`: *"`scripts/frontmatter.ts:1936` the block-sequence item path, `:2009` the
continuation path"*) — and `mappingSeparatorNodeStarts` was wired into only the second. So every
node start that follows a mapping separator **inside a sequence item** is still unasked, and a node
property the strip cannot consume still reaches the silent success arm there.

**Row — a resolvable alias reaching a grant through a sequence item's compact mapping. The loader
ACCEPTS this document.**

```
---
name: r
_x:
  - k: &a Agent(grugops-orchestrator)
allowed-tools:
  - j: *a
---
```

| | verdict |
|---|---|
| module | `{"ok":true,"value":false}`; `allowed-tools` flattened to `j: *a` |
| `/usr/bin/ruby -ryaml` | `"allowed-tools"=>[{"j"=>"Agent(grugops-orchestrator)"}]` |
| **control**, the identical alias one spelling over (`  j: *a`, no dash) | **REFUSED** by name — *"uses a YAML anchor or alias …"* |

The control is the proof this is the call-site set and not the sigil test: the same alias, the same
key, the same loader value, refused loudly on the continuation path and read as "carries no grant"
one dash over. Both spellings were silent on `3c7930b`; round 11 closed one of them.

**Gate reproduction.** `git archive HEAD` mirror, planted on both twins of the non-coordinator `map`
skill:

```
_x:
  - k: &a Agent(grugops-orchestrator)
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - j: *a
```

`/usr/bin/ruby -ryaml` reads `allowed-tools` as
`["Read", "Write", "Bash", "Glob", "Grep", {"j"=>"Agent(grugops-orchestrator)"}]`.
`node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`, **exit 0**.

The loader-REJECTED half of the same gap is visible too and is the same asymmetry: `tools:` /
`  - k: *a >-` and `tools:` / `  - k: &a &b >-` both return `{"ok":true,"value":false}` on documents
libyaml refuses to load, where their dash-less twins refuse loudly — the exact disposition
`27-57-SUMMARY.md` records for rows T3 and R ("moved to the LOUD arm"), true at one position only.

`UNKNOWN - verify`: whether Claude Code itself honours a **mapping** under `allowed-tools:` as a tool
grant was not confirmed against the platform, and no live platform escalation is claimed. The finding
stands on the module's own contract — the token is in the loaded value of the allow-list key and the
guard read it as a no-grant.

**Fix:** ask the fourth application point wherever `blockHeaderAt` is asked, and derive the site list
from the code rather than from memory:

```ts
// item path, immediately after the dashes are consumed and before `blockHeaderAt(itemText)`:
if (startsWithReference(itemText)) return refuseRef(t);          // existing — offset 0 only
for (const start of mappingSeparatorNodeStarts(itemText)) {      // ADD
  // No extra gate: offset 0 of `itemText` is unconditionally a node start on this path
  // (`assertItemPathScalarClosed` already proves the carried scalar is closed here), so the
  // continuation path's `mappingValueIndicator || startsNode` has nothing to decide.
  if (startsWithReference(start.node)) return refuseRef(t);
}
```

and pin it the way `27-59` pinned the `stripComment` call sites: **read the `blockHeaderAt` call-site
list out of `scripts/frontmatter.ts` at run time and assert every member also calls
`mappingSeparatorNodeStarts`**, so a third recogniser site fails by name. Closing only the compact
mapping is the enumerate-the-bad shape this module has now declined twelve times.

---

## Warnings

### WR-01: the "module GRANT the loader does not have" direction is still live at 48 cells, and the disposition register records it FIXED

**File:** `scripts/frontmatter.ts:2074-2075`; `deferred-items.md:3024` (register row 4).

**Issue:** the register states round-10 WR-01 is *"**FIXED** — the gate's **FALSE RED** inverted"*, and
`27-58-SUMMARY.md` states *"3 module-grants-the-loader-lacks closed"*. Both are true at the positions
measured. At the sequence positions CR-01 names, the direction the module's own doc block calls
**never exemptible** (`frontmatter.ts:1709-1711`) is live in 48 loader-accepted cells:

```
---
name: r
allowed-tools:
  - k: >-2
      Read,
    # x, Agent(grugops-orchestrator)
---
```

- module: `{"ok":true,"value":true}`, `grantedAgentNames` → `["grugops-orchestrator"]`
- loader: `[{"k"=>"Read,"}]` — **no grant**

`grantedAgentNames` returns a name for a document that expresses none. This is a false **red** rather
than a hole, which is why it is a Warning and not a Critical — but the fix is CR-01's fix, and the
register row should not read `FIXED` while the family is measurable.

**Fix:** CR-01's. Then re-cut register row 4 with the position column stated, so "closed" carries the
set it is closed over.

### WR-02: the corpus grew 2,544 → 16,704 cells and gained no indentation axis and no explicit-digit axis — the two dimensions D-62 is entirely about

**File:** `scripts/frontmatter.test.ts:8614-8621` (`AXIS_HEADER_INDICATOR_FORM`);
`scripts/frontmatter.test.ts:8191, 8202, 8362, 8373, 8402, 8439, 8480, 8507` (the eight
header-declaring base shapes).

**Issue:** `27-59`'s claim is that the header became a **product of its own parts** so an unreported
family is inside the shape space by construction. The parts are `line`, `indent`, `intro`, `key`,
`property`, `indicator` — and only **key**, **property**, **indicator** and a sibling region are
crossed. `indent` and `intro` are declared per base shape and **never varied**, and
`AXIS_HEADER_INDICATOR_FORM`'s three members are `identity`, `the other block style` and
`chomping kept` — **no member ever produces an indentation digit**. Read off the eight declaring
shapes: every `indent` is `""` or `"  "`, every `intro` is `""` or `"- "`, and there is no shape in
which the header line's indent differs from the parent node's indentation.

So the corpus asserts *both never-exemptible partitions EMPTY* (`27-59-SUMMARY.md`) over a space that
cannot spell a single one of CR-01's 134 cells — which is `27-49`'s own recorded lesson ("not because
the module agreed with the loader but because IT NEVER GENERATED THE INPUT") arriving for the seventh
time, on the axis the round's fourth plan created.

**Fix:** two members, both transforms so they compose with the existing axes:

```ts
// AXIS 1h — the header's INDENTATION RELATIVE TO ITS PARENT NODE.
const AXIS_HEADER_PARENT_OFFSET = [
  { label: "the header line's indent IS the parent's", respell: (h) => h },
  { label: "a compact mapping consumes columns on the header line", respell: (h) => ({ ...h, intro: `- ${h.intro}` }) },
  { label: "the header stands on its own line under a dash",       respell: (h) => ({ ...h, indent: `${h.indent}  `, prefixLine: `${h.indent}-` }) },
];
// AXIS 1i — the EXPLICIT INDENTATION DIGIT, derived by filtering candidates through BLOCK_INDICATOR
// (already exported) so narrowing the constant shortens the axis.
```

and assert the crossing of `27-58`'s family with the other three is **non-empty**, exactly as
`27-59` already does for `27-55` × `27-56` × `27-57`.

### WR-03: a more-indented content line loses its own leading whitespace, so the module's value is SHORTER than the loader's on a document the loader accepts

**File:** `scripts/frontmatter.ts:2133` (`const t = raw.trim()`), consumed at `:2214-2216`.

**Issue:** every line inside a block scalar reaches its region as `raw.trim()`. YAML keeps the
indentation a content line carries **beyond** the detected content indentation (`s-nb-spaced-text`),
and `27-58` derived the fold-suppression rule from exactly that production — but not the text:

```
tools: |-             loader: "Agent(alpha,\n    beta)"
  Agent(alpha,        module: "Agent(alpha,\nbeta)"
      beta)
```

`27-58`'s own deviation 2 closed this direction for leading breaks on the argument that *"this
module's founding failure is a value shorter than the loader's, so that direction is closed wherever
it is cheap to close"*. The recorded open item covers **whitespace-only** lines
(`27-58-SUMMARY.md`, "Still OPEN"); a more-indented **content** line is not recorded anywhere.

Measured over a 56-cell fold/blank-line/more-indented cross product the **name sets agree on every
cell**, and no grant verdict moves: the fold is suppressed at a more-indented boundary, so the
surrounding break is always `"\n"`, which `ENUMERATION_LEGAL_CHARS` refuses on both sides. So this is
a value divergence with no constructible name or verdict consequence — reported because it is the
stated never-shorten direction and it is unrecorded, not because a bypass was found.

**Fix:** inside an open block scalar, strip only the detected content indentation rather than all
leading whitespace:

```ts
const content = cur.blockContentIndent === null ? raw.trim() : raw.slice(cur.blockContentIndent).replace(/[ \t]+$/, "");
```

and pin it with a control asserting value equality with the loader for the `|-` spelling, so the
`s-nb-spaced-text` rule is tied to both the fold and the text.

### WR-04: `tsconfig.tests.json` hand-copies `tsconfig.json`'s exclude list instead of deriving it

**File:** `tsconfig.tests.json:22`.

**Issue:** the file's own comment says *"The only override is the exclude list, which drops the
`**/*.test.ts` entry and keeps the other two."* It does so by **restating** them:
`"exclude": ["node_modules", ".tmp-build"]`. A fourth entry added to `tsconfig.json`'s exclude
(a vendored dir, a generated fixture tree, a second build dir) will silently not apply to the
test-inclusive target, and both configs will keep reporting exit 0. This is the repository's own
diagnosed **set-literal drift** class — the same shape `27-56` and `27-57` exported `BLOCK_INDICATOR`
and `NODE_PROPERTY_AT_NODE_START` to avoid — in the file added to close a "control that reads as
enforced and enforces nothing" finding.

Verified live: `tsc -p tsconfig.tests.json --listFiles` reaches **36 of 36** tracked `.test.ts` files
and `npm run typecheck` exits 0 today, so this is latent rather than live.

**Fix:** there is no `extends`-time list subtraction in tsconfig, so make the duplication fail
closed — a case asserting `tests.exclude ∪ {"**/*.test.ts"} === base.exclude` as sets, with the
message naming the entry that drifted:

```ts
const base = JSON.parse(stripJsonComments(readFileSync("tsconfig.json", "utf8")));
const tests = JSON.parse(stripJsonComments(readFileSync("tsconfig.tests.json", "utf8")));
expect(new Set([...tests.exclude, "**/*.test.ts"]), "tsconfig.tests.json's exclude list drifted from tsconfig.json's").toEqual(new Set(base.exclude));
```

---

## Info

### IN-01: `blockHeaderAt`'s "a fifth introduction inherits both questions by construction" comment is one introduction short of the set the module's own doc block enumerates

**File:** `scripts/frontmatter.ts:719-720`, `scripts/frontmatter.ts:612-652`
(`HEADER_INTRODUCTIONS`), against `scripts/frontmatter.ts:778-783`.

**Issue:** `BLOCK_MAP_EXPLICIT`'s doc block states YAML gives block context **four** node
introductions — `-` (§ 8.2.1), `key:`, `?` and `:` (§ 8.2.2) — and calls that set CLOSED.
`HEADER_INTRODUCTIONS` contains the last three plus a synthetic `bare`; the block-sequence `-` is
**outside** the set, handled by `SEQ_ITEM` pre-consuming the dash on a different code path. That is a
sound design, but it makes the comment's claim false in the direction that matters: the item path's
introduction inherits nothing the set gains, which is precisely CR-02's mechanism.

**Fix:** state the scope at the site — "every introduction reachable *from the continuation path*" —
and add the assertion CR-02 asks for, so the sentence is backed rather than believed.

### IN-02: the new `codeOnly` comment strip handles `//` only, where its stated model handles both comment forms

**File:** `scripts/generate-role-adapters.test.ts:884-887`.

**Issue:** the strip is introduced as *"the same comment-versus-code confusion `codeLinesOf` was
introduced to solve in frontmatter.test.ts, twinned locally"*, and it filters lines whose trimmed
start is `//`. A `/* … */` block comment quoting `lines.length - kept.length` — the exact shape the
negative forbids — survives the strip and false-reds the case, which is the failure mode the twin was
written to prevent. No such comment exists today.

**Fix:** strip both forms, or assert in the same case that the file contains no block comment inside
the sliced body.

### IN-03: the block-owned run validates each region's `intro` and then discards the resolved value

**File:** `scripts/frontmatter.ts:2027-2034`.

**Issue:** the non-block arm pushes `resolved.value`; the block arm calls `unquoteChecked(p.intro)`,
uses only its `ok`/`escape`, and pushes the **raw** `runText`. The comment above it
(`:1984-1996`) reads as though the introduction is resolved like any other non-block region. It is
not — it is escape-*checked* only.

`UNKNOWN - verify`: I could not construct a document where this changes an observable value.
`tools:` / `  "a\"b": >-` / `    Read, Agent(x)` produces the identical string on both arms, because
the joined non-block run is not itself a wholly-quoted scalar either. Reported as a naming/contract
mismatch rather than as a defect, with what was tried stated.

**Fix:** either push the resolved introduction (`regionText(intro.value, p.body)`) so the two arms
mean the same thing, or rename the comment to say "escape-checked, never resolved" and add the
control that shows the two are indistinguishable.

---

_Reviewed: 2026-08-10T17:11:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
