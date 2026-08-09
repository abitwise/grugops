---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-10T01:55:00Z
depth: standard
round: 10
diff_base: d5c69e01042e445768c67b198e1e560c8c023961
files_reviewed: 7
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/validate-agent-factory.ts
  - scripts/fixtures/frontmatter-singleline-pre-d54.json
  - tsconfig.json
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 27: Code Review Report (round 10)

**Reviewed:** 2026-08-10T01:55:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Round 10 closed five of the six round-9 items cleanly (CR-01's `''` escape, WR-02's prose scope,
WR-03's `f(x) === f(x)`, IN-01's dead helper, and IN-02's `state` differential — the last two with
residue, noted below). It also **introduced one new silent-no-grant regression** and **left the
family it claims to close (D-57 / family G) live in at least six spellings**.

Evidence, not argument. All rows below were measured against the committed build at HEAD with
`/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) as the loader column, and:

- `npx vitest run scripts/frontmatter.test.ts` → **210 passed**
- `node scripts/check-foundation-guards.js` → **ALL CHECKS PASSED, exit 0**
- A hermetic `git archive HEAD` mirror with **one** grant planted on the non-coordinator skill
  adapter `.claude/skills/grugops-map/SKILL.md` (and its distribution twin `skills/map/SKILL.md`,
  so `guard_distribution_pair` stays green) → **ALL CHECKS PASSED, exit 0**, with libyaml reading
  `allowed-tools => {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}`.

The 210-green / gate-green / bypass-live combination is the eleventh instance of this phase's own
standing lesson. Weight the findings accordingly: the suite did not fail on any of them.

Round-9 disposition, judged against the code rather than the SUMMARY:

| Round-9 item | Verdict |
|---|---|
| CR-01 `stripComment` `''` corrupts `state.openQuote` | **CLOSED** — verified live on both the top-level (`tools: 'Read, isn''t` / `  # x, Agent(…)'`) and nested spellings; both now agree with libyaml |
| WR-01 D-52 corpus missing quote-style / in-scalar-escape axes | **CLOSED** (axes are derived, not hand-listed) |
| IN-02 unasserted `state` field | **PARTIAL** — see WR-03 below; the differential covers 24 of the 48 reachable seeding combinations and omits the one the live continuation call site produces |
| WR-02 unqualified fence-authority prose | **CLOSED at the "fence machine" level**; see IN-02 for the residue |
| WR-03 `f(x) === f(x)` in generate-role-adapters.test.ts | **CLOSED** — the three replacements are each proven able to fail, and `linesRemoved` is now counted rather than derived, which is what makes the partition assertion non-identity |
| IN-01 dead `kitListDir` + `noUnusedLocals`/`noUnusedParameters` | **PARTIAL** — helper deleted, flags on, but they reach zero test files (WR-04) |

---

## Critical Issues

### CR-01: `sawBlock` silently disables the D-30 escape refusal for the whole key — a NEW regression that turns a loud refusal into a silent no-grant

**File:** `scripts/frontmatter.ts:1215-1225` (the `sawBlock` field), `scripts/frontmatter.ts:1397-1405` (the flush)

**Issue:**
D-57 changed the flush's quoting exemption from `cur.block` to `cur.sawBlock`. `block` was a
property of the **whole** value (a header could only ever appear on the key line); `sawBlock` is
sticky and true if a block scalar appeared **anywhere** in the key's region. So a key that contains
one nested block scalar now skips `unquoteChecked` for **every other part of that key's value**,
including parts that are ordinary double-quoted scalars. The D-30 escape refusal — the module's
allowlist-by-default mechanism, the one that exists precisely because `"\x41gent(x)"` resolves to
`Agent(x)` under a real loader — is therefore switched off by an unrelated sibling entry.

Measured at HEAD, one row and its control:

```
U2 (control)              module: REFUSES, naming `\x`            libyaml: {"a"=>"Agent(grugops-orchestrator)"}
---
name: r
tools:
  a: "\x41gent(grugops-orchestrator)"
---

U1 (add one sibling)      module: {"ok":true,"value":false}       libyaml: {"a"=>"Agent(grugops-orchestrator)","b"=>"x"}
---                               ^^^ SILENT NO-GRANT
name: r
tools:
  a: "\x41gent(grugops-orchestrator)"
  b: >-
    x
---
```

This is a **regression introduced by this round**: the pre-round build (`d5c69e0`,
`scripts/frontmatter.js`) returns `{ok:false, reason:"… backslash sequence \`\\x\` …"}` for U1.
It is the module's own founding failure — "I could not read this" printed as "this carries no
grant" — reached by adding two lines to a document.

The block-sequence spelling (U3) still refuses, because the item path calls `unquoteChecked` per
item before the flush ever runs. Only the nested-mapping continuation path defers to the flush, so
only it is exposed. That asymmetry is itself the tell.

**Fix:** the quoting exemption is a property of a **region**, not of a key. Track which parts came
from a block scalar and exempt only those, rather than making the flush all-or-nothing. Minimal
shape — record the part indices `openBlock` owns and skip only those in the flush:

```ts
// Accumulator
blockParts: Set<number>;   // indices of `parts` that a block scalar owns

// openBlock
a.parts.push(header.leading);
a.blockParts.add(a.parts.length - 1);

// flush — resolve each part on its own terms, then join
const resolvedParts: string[] = [];
for (const [i, part] of cur.parts.entries()) {
  if (cur.blockParts.has(i)) { resolvedParts.push(part); continue; }
  const r = unquoteChecked(part);
  if (!r.ok) return refuseEscape(`${cur.key}: ${part}`, r.escape);
  resolvedParts.push(r.value);
}
const value = (cur.seq ? resolvedParts.join(", ") : resolvedParts.join(" ")).trim();
```

Whichever shape is chosen, the case that pins it must be the **pair** (U1 and U2 together): U2
alone passes today and proves nothing, because the defect is that U2's own refusal disappears when
a sibling is added.

---

### CR-02: a YAML node property between the mapping indicator and the block-scalar indicator defeats `blockHeaderAt` — reproduced end-to-end through the full gate at ALL CHECKS PASSED

**File:** `scripts/frontmatter.ts:440-473` (`blockHeaderAt`), `scripts/frontmatter.ts:618-636` (`startsWithReference`), `scripts/frontmatter.ts:1693-1702` (the continuation gate)

**Issue:**
`blockHeaderAt` asks `BLOCK_INDICATOR` about the text immediately after the introduction. YAML 1.2
§ 6.9 lets a node's **properties** (tag and/or anchor) stand in front of the node's content, so
`nested: &a >-`, `nested: !!str >-`, `: &a >-` and `? &a >-` are all legal headers that
`blockHeaderAt` does not recognise. The header is missed, `block` stays false, the scalar's literal
content is routed through `stripComment`, and a leading `#` deletes the rest of the line — the
exact mechanism D-57 was written to close, one property over.

Worse, the reference **refusal** does not catch it either: `startsWithReference` is asked about
position 0 of the line (`nested: &a >-` does not start with a sigil) and about flow fragments, but
never about the node start that follows a block mapping's `: ` separator. So the document does not
even fail red — it succeeds with no grant.

Measured at HEAD:

| row | document | module | libyaml |
|---|---|---|---|
| A | `tools:` / `  nested: &a >-` / `    Read, # x, Agent(grugops-orchestrator)` | `{ok:true,value:false}` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| B | same with `!!str` instead of `&a` | `{ok:true,value:false}` | same grant |
| F | `tools:` / `  ? k` / `  : &a >-` / `      Read, # x, Agent(…)` | `{ok:true,value:false}` | `{"k"=>"Read, # x, Agent(…)"}` |
| Q | `tools:` / `  ? &a >-` / `      Read, # x, Agent(…)` / `  : v` | `{ok:true,value:false}` | `{"Read, # x, Agent(…)"=>"v"}` |

Control (row P, `tools:` / `  &a >-` — a **bare** header with a property) correctly refuses,
because there the sigil *is* at position 0. That contrast is the proof this is the introduction set
and not the sigil test.

**Gate-level reproduction.** On a `git archive HEAD` mirror, row A's shape planted on the
non-coordinator skill adapter `.claude/skills/grugops-map/SKILL.md` (and its twin
`skills/map/SKILL.md`):

```
allowed-tools:
  nested: &a >-
    Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)
```

`node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`, **exit 0**. `guard_wr05`'s
`!isCoordinator && hasGrant` arm never fires because `keysHaveSpawnGrant` reads the flattened value
`nested: &a >- Read,`.

`UNKNOWN - verify`: whether Claude Code itself honours a **mapping** under `allowed-tools:` as a
tool grant was not confirmed against the platform, so no live platform escalation is claimed. The
finding stands on the module's own stated contract — the token is in the loaded value of the
`allowed-tools` key and the guard reads it as a no-grant — which is exactly the standard rows g1–g5
were judged by five plans ago.

**Fix:** strip node properties at the header position with the module's **existing** authorities
rather than a new pattern, and ask the reference refusal at that node start so a property that
cannot be stripped still fails loud instead of quiet:

```ts
function blockHeaderAt(text: string): BlockHeader | null {
  // …
  const kv = text.match(KEY_LINE);
  if (kv !== null) {
    const raw = (kv[2] ?? "").trim();
    // ONE leading property, exactly as LEADING_TAG / NODE_PROPERTY_AT_NODE_START already declare it.
    const afterProps = raw.replace(NODE_PROPERTY_AT_NODE_START, "").trimStart();
    if (BLOCK_INDICATOR.test(afterProps)) { /* header, with lineBreak from afterProps */ }
  }
  // …same for BLOCK_MAP_EXPLICIT's `?` and `:` arms
}
```

and, at the continuation path in `flattenBlock`, ask `startsWithReference` about the value node
after a recognised mapping separator, not only about offset 0 of the line. Do **not** close only
the four spellings in the table — that is the enumerate-the-bad shape this module has declined
seven times; the property is "a node property never hides a node start", asked at every
introduction `blockHeaderAt` knows about.

---

### CR-03: `blockHeaderAt` reuses `KEY_LINE`, whose key charset is the top-level frontmatter grammar, not YAML's nested mapping-key grammar — four more silent no-grants

**File:** `scripts/frontmatter.ts:446-457`, `scripts/frontmatter.ts:343` (`KEY_LINE`)

**Issue:**
`KEY_LINE` is `/^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?[ \t]*$/`. That is a deliberately narrow
grammar for the **top-level** keys a frontmatter block may declare, and reusing it for
INTRODUCTION 2 of `blockHeaderAt` silently transfers that narrowness to **nested** mapping keys,
where YAML allows any scalar. Every nested key that is quoted, contains a dot, starts with a digit
or contains a space therefore fails to be recognised as introducing a header, and the whole family-G
mechanism reopens:

| row | nested key | module | libyaml |
|---|---|---|---|
| V1 | `"a b": >-` | `{ok:true,value:false}` | `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| V2 | `a.b: >-` | `{ok:true,value:false}` | `{"a.b"=>"Read, # x, Agent(…)"}` |
| V3 | `1a: >-` | `{ok:true,value:false}` | `{"1a"=>"Read, # x, Agent(…)"}` |
| V4 | `a b: >-` | `{ok:true,value:false}` | `{"a b"=>"Read, # x, Agent(…)"}` |

The module comment at `frontmatter.ts:363-365` says "this function CALLS the one constant rather
than restating it … nothing here decides what a header LOOKS like." That is true of the *indicator*
and false of the *position*: reusing `KEY_LINE` is a decision about which nested keys can carry a
header, and it is the wrong grammar for that question. This is the same class as CR-02 — the
predicate's application set, one level down.

**Fix:** give `blockHeaderAt` its own nested-key production derived from YAML's rule (a mapping
value indicator is `:` followed by a separation, and everything before the **last** such `: ` on the
line is the key), instead of borrowing the frontmatter-key charset:

```ts
// A nested block-mapping entry: any key text, then the mapping-value indicator.
const NESTED_MAP_ENTRY = /^(.*?):(?:[ \t]+(.*))?$/;
```

and keep `KEY_LINE` for the top-level baseline where its narrowness is the intended refusal. The
pin must be a derived axis over key spellings (quoted / dotted / digit-leading / space-containing /
bare), not four rows: the same argument that made the D-52 quote-style axis an axis and not four
rows.

---

## Warnings

### WR-01: a more-indented first content line makes the module report a grant the loader does not have — the direction its own harness calls "never exemptible"

**File:** `scripts/frontmatter.ts:1479-1498`

**Issue:** the end condition is `indent > cur.blockIndent`, i.e. "more indented than the header
line". YAML auto-detects the scalar's content indentation from the **first non-empty content line**,
and ends the scalar at the first line less indented than *that*. Where the first content line is
more indented than the minimum, the two rules diverge and the module over-includes:

```
tools:                 module: {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}  -> GRANT
  nested: >-           libyaml: {"nested"=>"Read,"}                                  -> no grant
        Read,
    # x, Agent(grugops-orchestrator)
```

`grantedAgentNames` returns `["grugops-orchestrator"]` for a value the loader does not express.
The module's own doc block at `frontmatter.ts:1271-1274` names this direction ("a module GRANT the
loader does not have, which the D-52 harness declares NEVER EXEMPTIBLE"). It is a false **red**, not
a hole, which is why this is a Warning and not a Critical — but it is a stated invariant violation
shipped by the change that stated it.

**Fix:** record the detected content indent on the first content line (or honour the explicit
indentation indicator digit `BLOCK_INDICATOR` already matches and currently discards), and end the
scalar at `indent < detectedContentIndent`:

```ts
// content branch, first content line only
if (!cur.blockHasContent) cur.blockContentIndent = indent;
if (indent >= (cur.blockContentIndent ?? cur.blockIndent + 1)) { /* content */ }
```

### WR-02: the `|`/`>` line-break derivation was applied to the indicator but not to the blank line, so a folded scalar still invents names

**File:** `scripts/frontmatter.ts:437-438` (`blockLineBreak`), `scripts/frontmatter.ts:1457` (the blank-line `continue`)

**Issue:** D-57 correctly derived the join from the indicator (`|` → `"\n"`, `>` → `" "`) because
row g5 showed a space join inventing an enumerable name where the loader's `\n` would be refused by
`ENUMERATION_LEGAL_CHARS`. The identical mechanism survives on the **blank-line** axis of a folded
scalar: YAML folds a blank line inside `>` to a line break, and this module drops the blank line at
`flattenBlock`'s `raw.trim() === ""` guard and then joins with a space.

```
tools: >                module names: ["alpha","ga mma"]
  Agent(alpha, ga       libyaml:      "Agent(alpha, ga\nmma)\n"
                                       ^ the module's own ENUMERATION_LEGAL_CHARS refuses a line break
  mma)
```

So the module enumerates two names, one of them invented, for a value the loader-faithful reading
would send to the loud refusal arm. That is the KIT-03 / D-09 direction the `blockLineBreak` change
was made to move away from.

**Fix:** inside an open block scalar, a blank line is content. Handle it before the blank-line skip:

```ts
if (raw.trim() === "") {
  if (cur !== null && cur.block && cur.blockHasContent) {
    cur.parts[cur.parts.length - 1] += "\n";   // a folded blank line IS a line break
  }
  continue;
}
```

### WR-03: the new `state` differential couples two independent inputs, so it never generates the combination the live call site produces

**File:** `scripts/frontmatter.test.ts:10067-10084`

**Issue:** the loop passes `nodeMayBegin` as **both** `entering.nodeMayBegin` and
`nodeStartAtOffsetZero`:

```ts
const got = stripComment(
  input,
  { openQuote: q, flowDepth, nodeMayBegin },
  nodeMayBegin,     // <- nodeStartAtOffsetZero, coupled to the entering state
  lineStart,
).state;
```

`stripComment`'s own doc block (`frontmatter.ts:805-813`) insists these are *not the same fact*, and
the live continuation call site is `stripComment(t, cur.state, startsNode, startsNode)` — where
`cur.state.nodeMayBegin` is routinely `false` while `startsNode` is `true`. That combination is
never generated: `states` is `3 × 2 × 2 × 2 = 24`, not `3 × 2 × 2 × 2 × 2 = 48`. The case therefore
reproduces exactly the trap its sibling names at `frontmatter.test.ts:7098` — "not because the
module agreed with the loader but because IT NEVER GENERATED THE INPUT" — inside the fix for it.

**Fix:** make `nodeStartAtOffsetZero` its own axis, regenerate the pre-fix capture from the same
hermetic mirror over the widened cross product (the capture format already de-duplicates vectors,
so the cost is one more factor of two), and pin `states` at 48 with the derivation written out.

### WR-04: `noUnusedLocals` / `noUnusedParameters` were enabled on a config that excludes every test file

**File:** `tsconfig.json:15-20`

**Issue:** the flags are on, but `"exclude": ["node_modules", ".tmp-build", "**/*.test.ts"]` means
`tsc --noEmit --listFiles` reports **zero** `.test.ts` files (verified), and `vitest.config.ts`
declares no `typecheck` block, so vitest transpiles the harness without type checking. The dead-code
flags therefore have no reach into the surface this phase actually grew — `frontmatter.test.ts`
gained 1250 lines this round and `generate-role-adapters.test.ts` 226.

There are no violations today (a temporary config including the tests compiles with zero TS6133 /
TS6196 / TS6198), so this is latent rather than live. But IN-01's remedy was stated as "turn on
noUnusedLocals + noUnusedParameters", and as configured it cannot see the code the round added.

**Fix:** add a test-inclusive typecheck target and wire it into the same gate that runs `typecheck`:

```jsonc
// tsconfig.tests.json
{ "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true, "types": ["node", "vitest/globals"] },
  "include": ["scripts/**/*.ts", "install/**/*.ts", "hooks/**/*.ts"],
  "exclude": ["node_modules", ".tmp-build"] }
```

```jsonc
"typecheck": "tsc --noEmit && tsc -p tsconfig.tests.json"
```

---

## Info

### IN-01: blank lines inside a `|` block scalar are dropped, so the flattened value is not the loader's

**File:** `scripts/frontmatter.ts:1457`

**Issue:** `tools: |` / `  Read,` / `` / `  Agent(x)` flattens to `"Read,\nAgent(x)"` where libyaml
expresses `"Read,\n\nAgent(x)\n"`. Both carry the token and both enumerate the same names, so the
direction is safe — but the divergence is undocumented and unasserted, and it shares a root cause
with WR-02 above. Fixing WR-02 fixes this.

**Fix:** covered by WR-02's patch; add a control row pinning the value equality with the loader for
the `|` spelling so the two axes stay tied together.

### IN-02: the narrowed fence-authority claim is derived for "is there a fence machine" but still prose for "does it answer the GENERAL question"

**File:** `scripts/frontmatter.ts:77-98`, `scripts/frontmatter.test.ts:4611-4692`

**Issue:** the derived set is a genuine improvement — sorted, cardinality-pinned at 4, proven to
fail on a fifth plant, and every classifier construct proven load-bearing. But the *claim* it backs
is "exactly one implementation answers the GENERAL question". That half is mechanised for only one
of the three non-authority members: `check-foundation-guards.ts` is pinned as gated on
`## Caveman prompt` (`frontmatter.test.ts:4649-4658`), while `generate-role-adapters.test.ts` and
`check-foundation-guards.test.ts` are excused as "harness-local" in prose only. A future edit that
makes either of those a general document-level fence answer keeps the set at 4 and the claim green.

**Fix:** add a mechanical discriminator for the harness-local pair — e.g. assert that neither is
imported by any non-test module (`git grep` over tracked `.ts` for an import of the file), which is
the property "harness-local" actually means.

### IN-03: the WR-03 source-scan pin is brittle in two ways

**File:** `scripts/generate-role-adapters.test.ts:829-836`

**Issue:** (a) `src.slice(start, src.indexOf("\n}", start))` assumes no line in the function body
begins with `}` at column 0 — true today, silently truncating tomorrow, and a truncated body makes
`toContain("linesRemoved += 1")` fail confusingly rather than informatively. (b)
`.not.toContain("lines.length - kept.length")` matches **comments** as well as code, so a future
comment explaining why the derived shape is wrong will false-red the case — the same
comment-vs-code confusion `codeLinesOf` was introduced to solve in `frontmatter.test.ts`.

**Fix:** reuse the `codeLinesOf` comment-stripping helper (or a local twin) before the
`not.toContain`, and bound the slice with an explicit end marker rather than `"\n}"`:

```ts
const end = src.indexOf("\n// ──", start);
expect(end, "the stripFencedBlockLines body must be bounded by its own section marker").toBeGreaterThan(start);
```

---

_Reviewed: 2026-08-10T01:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
