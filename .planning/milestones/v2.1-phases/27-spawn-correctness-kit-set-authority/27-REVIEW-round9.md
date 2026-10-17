---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-09T21:10:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/fixtures/frontmatter-singleline-pre-d54.json
  - scripts/validate-agent-factory.ts
  - scripts/coordinator-resolution-precheck.ts
  - scripts/adapters-freshness.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-08-09T21:10:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Round 9 produced a ninth silent-no-grant bypass. It is **not** family G/G2 (the deferred nested
block-scalar header) and it is **not** a variant of any spelling the module's ledger names. It rides
an axis nobody in nine rounds has enumerated: **YAML's `''` escape inside a single-quoted scalar.**

`stripComment` treats `''` as *close-then-reopen* rather than as *content*, and the reopen re-runs
`openedAtNodeStart = mayBegin` at a position where `mayBegin` is already `false` — so a scalar that
genuinely opened at a node start has its provenance destroyed and `exiting()` reports
`openQuote: null` for a scalar that is **still open**. The next physical line is then read as a fresh
node start with nothing open, a leading `#` is stripped as a comment, and the token behind it is
deleted. The truncated remainder is returned on the `{ok:true}` **SUCCESS** arm.

Four spellings reproduce (key-line plain, key-line unspaced, block-sequence item, flow sequence). All
four are accepted by libyaml with a live `Agent(grugops-orchestrator)` in the loaded value. Two of
them, planted on the non-coordinator skill pair `.claude/skills/grugops-plan/SKILL.md` +
`skills/plan/SKILL.md`, took the **entire foundation gate to `ALL CHECKS PASSED` at exit 0**, with
`guard_wr05` printing its own falsified claim, and `coordinator-resolution-precheck` and
`adapters-freshness` green alongside it. `npx vitest run scripts/frontmatter.test.ts` is
**193/193 green** over the plant.

The mechanism that let it ship is a corpus gap: the D-52 loader differential — the module's stated
completeness authority — never generates a single-quoted scalar on its key-line axis and never emits
`''` on any axis, so the whole family sits outside its shape space while it prints a green
completeness line. That is the same "not because the module agreed with the loader but because IT
NEVER GENERATED THE INPUT" failure 27-49 recorded one round ago, on a different axis.

Two further harness-integrity defects were found in this round's own additions.

## Critical Issues

### CR-01: `stripComment` drops a still-open single-quoted scalar whose value contains YAML's `''` escape — silent-no-grant, gate green at exit 0

**File:** `scripts/frontmatter.ts:720-724` (root cause); consumed by
`scripts/check-foundation-guards.ts:686`, `scripts/coordinator-resolution-precheck.ts:402`,
`scripts/check-foundation-guards.ts:2378`, `scripts/adapters-freshness.ts`

**Issue:**

```ts
} else if (c === "'" && !dq) {
  if (!sq) openedAtNodeStart = mayBegin;   // <-- re-run on the REOPEN of a `''` pair
  sq = !sq;
  mayBegin = false;
  jsonLikeKeyJustClosed = !sq;
}
```

In YAML, `''` inside an open single-quoted scalar is the **escaped apostrophe** — content. It does
not close the scalar. This walk toggles it as close + reopen. On the second `'`, `sq` is momentarily
`false`, so the guard `if (!sq)` fires and recomputes `openedAtNodeStart = mayBegin`. But `mayBegin`
was set to `false` by the *previous* character (the first `'` of the pair). So a scalar that opened
legitimately at a node start is recorded as having opened at a non-node-start, and the gate in
`exiting()` —

```ts
openQuote: dq && openedAtNodeStart ? '"' : sq && openedAtNodeStart ? "'" : null,
```

— returns `null` for a scalar `sq` says is still open.

Measured directly against the committed `scripts/frontmatter.js`:

```
"'Read, "        -> {"openQuote":"'","flowDepth":0,"nodeMayBegin":false}   correct
"'Read'' s,"     -> {"openQuote":null,"flowDepth":0,"nodeMayBegin":false}  <-- provenance lost
"'Read''s,"      -> {"openQuote":null,...}
"'a''b"          -> {"openQuote":null,...}
```

With the state lost, `flattenBlock` computes `startsNode === false` for the continuation line but
hands `stripComment` an entering `openQuote: null`, so `c === "#" && !sq && !dq && i === 0` fires and
the **whole continuation line is returned as the empty string** and discarded at the join.

**Loader column** — `/usr/bin/ruby -ryaml` (Ruby 2.6.10 / Psych 3.1.0 / libyaml 0.2.1), verbatim
transcripts. Every row is libyaml-ACCEPTED with the grant in the loaded value:

| # | document (frontmatter region) | libyaml value | module |
|---|---|---|---|
| A | `tools: 'Read'' s,` / `  # x, Agent(grugops-orchestrator)'` | `"Read' s, # x, Agent(grugops-orchestrator)"` | `{"ok":true,"value":false}` |
| B | `tools: 'Read''s,` / `  # x, Agent(grugops-orchestrator)'` | `"Read's, # x, Agent(grugops-orchestrator)"` | `{"ok":true,"value":false}` |
| C | `tools:` / `  - 'Read'' s,` / `    # x, Agent(grugops-orchestrator)'` | `["Read' s, # x, Agent(grugops-orchestrator)"]` | `{"ok":true,"value":false}` |
| D | `tools: ['Read'' s,` / `  # x, Agent(grugops-orchestrator)']` | `["Read' s, # x, Agent(grugops-orchestrator)"]` | `{"ok":true,"value":false}` |
| F | `tools: 'Read,` / `  # x, Agent(grugops-orchestrator)'` (control, no `''`) | `"Read, # x, Agent(grugops-orchestrator)"` | `{"ok":true,"value":true}` — correct |

Row F is the false-red control: remove the `''` and the module is right. The `''` is the whole of the
defect. Rows C and D show it is not a key-line artifact — the block-sequence item path
(`stripComment(itemText, cur.state, true, true)`) and the flow path inherit it identically.

**End-to-end reproduction on a hermetic mirror** (`git ls-files` copy of HEAD, `CHECK_ROOT` override,
plant on the two non-coordinator plugin/standalone skill mirrors so the D-40 pair rule stays
satisfied):

```
=== LOADER (skills/plan/SKILL.md) ===
"Read' s, # x, Agent(grugops-orchestrator)"
=== MODULE ===
parse: [... ["allowed-tools",["'Read'' s,"]] ...]
hasSpawnGrant: {"ok":true,"value":false}
=== GATE ===
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 7 plugin-form skill(s) + 2 packaging template(s) checked)
== Result ==
ALL CHECKS PASSED
EXIT=0
```

`coordinator-resolution-precheck.js` -> `PRECONDITIONS HOLD`, exit 0.
`adapters-freshness.js` -> `0 byte difference(s)`, exit 0.
`npx vitest run scripts/frontmatter.test.ts` -> `193 passed (193)`.

**Fix — structural, and it REMOVES an arm's ability to decide rather than adding one.**

The module already holds **one authority that knows `''` is content**: `unquoteChecked`
(`scripts/frontmatter.ts:945`) does `.replace(/''/g, "'")`. `stripComment` states a **second,
contradicting grammar** for the same construct. That is the weaker-duplicate shape this module
deletes on sight, and it is the same asymmetry that already exists correctly for the other quote
style three lines up (`if (dq && c === "\\") { i += 1; continue; }` — the walk owns the double-quote
escape and the unquote consumes what the walk left).

Ask the phase's own question: *what does this predicate ENUMERATE vs DERIVE?* The walk **enumerates**
the characters that close a scalar. It must **derive** that set from the quote style's own escape
rule. It does for `"`; it does not for `'`.

```ts
} else if (c === "'" && !dq) {
  // YAML's `''` inside an OPEN single-quoted scalar is the escaped apostrophe — CONTENT. It does
  // not close the scalar, so the scalar's node-start provenance must not be recomputed here. This
  // is the exact treatment the `dq && c === "\\"` skip above already gives the other quote style;
  // `unquoteChecked` has always agreed (`.replace(/''/g, "'")`) and the walk did not.
  if (sq && s[i + 1] === "'") {
    i += 1;                      // the loop's own i++ consumes the second quote
    mayBegin = false;
    jsonLikeKeyJustClosed = false;
    continue;                    // openedAtNodeStart is UNTOUCHED — nothing closed
  }
  if (!sq) openedAtNodeStart = mayBegin;
  sq = !sq;
  mayBegin = false;
  jsonLikeKeyJustClosed = !sq;
}
```

Verify with rows A-D above (module must report `{ok:true,value:true}`) and with row F plus
`tools: 'a'''` / `tools: ''` as the false-red controls. Land it with WR-01 below, or the same
differential will pass over the fixed build for the same reason it passed over the broken one.

## Warnings

### WR-01: the D-52 loader differential's generated corpus cannot express CR-01's family, while printing a completeness claim

**File:** `scripts/frontmatter.test.ts:6013-6180` (`AXIS_KEY_LINE`), `:6286-6323`
(`AXIS_CONTINUATION_1`), `:6644` (the differential), `:5322` (the claim it is said to hold)

**Issue:** `AXIS_KEY_LINE`'s 17 shapes open a **double**-quoted scalar mid-line five times
(`"${FIRST}`) and open a **single**-quoted scalar **zero** times. `AXIS_CONTINUATION_1` has an
"opens a single-quoted scalar" row, but that is on the continuation line, where offset 0 *is* a node
start and the module is already correct. No axis on any position emits `''`. The escaped apostrophe
is therefore outside the corpus's shape space entirely, and the differential's green line —
`token-presence disagreements 0` — is a statement about inputs it generated, not about the grammar.

Line 5322 nominates this differential as the holder of the sweep's completeness claim
(`"the D-52 loader differential holds this sweep's completeness claim"`), and 27-49 already recorded
this exact failure mode one round ago on a different axis ("not because the module agreed with the
loader but because IT NEVER GENERATED THE INPUT"). The lesson did not transfer to the axis set.

**Fix:** add the escape to the corpus as a **content axis**, not as four rows for the four spellings
CR-01 happens to report — the enumerate-the-bad shape this module has declined six times. Concretely:

1. Add a `quoteStyle` axis (`"` / `'`) crossed with every key-line shape that currently hard-codes
   `"`, so both styles get the same coverage rather than one style getting five shapes and the other
   getting none.
2. Add an `escapeInScalar` axis with the *empty* value and the style's own escape (`\\` for `"`,
   `''` for `'`) injected into `FIRST`, so the differential asserts that an in-scalar escape cannot
   change a verdict — which is the property, rather than that these four documents pass.
3. Assert non-vacuity the way the harness already does elsewhere: the new axis must move the
   loader-accepted cell count, or it is not being exercised.

Recompute `scripts/fixtures/frontmatter-singleline-pre-d54.json`'s sibling only if the within-line
`text` output actually moves; per the fix in CR-01 it does not — only the returned `state` does, and
no differential currently compares the returned `state` at all. That gap is worth closing in the same
change: `stripComment` returns `{ text, state }` and every shipped differential over it asserts only
`text`, so the exact field CR-01 corrupts is unasserted by construction.

### WR-02: a second fence state machine now exists, falsifying the "exactly one fence authority" claim, and the pin that guards that claim cannot see it

**File:** `scripts/generate-role-adapters.test.ts:198-212`; claims at `scripts/frontmatter.ts:74-75`
and `scripts/check-foundation-guards.ts:519`; pin at `scripts/frontmatter.test.ts:4008-4020`

**Issue:** `frontmatter.ts:75` states, without qualification: *"the whole tree still has exactly one
implementation of 'which lines are inside a ``` block'. No second fence parser is written, here or
anywhere."* This round added one:

```ts
function stripFencedBlockLines(lines: readonly string[]): FenceStrip {
  let inside = false;
  for (const line of lines) {
    if (line.startsWith("```")) { if (!inside) blocksRemoved += 1; inside = !inside; continue; }
    if (inside) continue;
    kept.push(line);
  }
  ...
}
```

The non-circularity rationale for not importing the production stripper is sound and I am not
disputing it. The defect is that the **claim was not narrowed to match**, and the mechanism that is
supposed to catch exactly this cannot:

```ts
expect(code.split("/^```/").length - 1, "the fence-delimiter line class must be written out exactly
  ONCE IN CODE ...").toBe(1);
```

That pin (a) scopes `code` to `frontmatter.ts` alone and (b) counts one spelling, `/^```/`. The new
copy lives in another file *and* uses a different spelling (`startsWith("```")`), so it is doubly
invisible. This is the set-literal drift class: a hand-scoped pin that stays green while the set it
claims to bound grows.

**Fix:** mirror what `frontmatter.test.ts` already does correctly for the *frontmatter-parsing*
grammar (the D-50/IN-05 derived assertion that scans every tracked `.ts` by pattern, sorts, compares
to a named list and pins the cardinality). Add the sibling for the fence grammar: scan every tracked
`.ts` for a fence toggle by pattern (both spellings), assert the result is exactly the named set
`{scripts/frontmatter.ts, scripts/generate-role-adapters.test.ts, scripts/check-foundation-guards.ts
(x2, the caveman-block scopers)}`, and pin its cardinality. Then narrow the two prose claims from
"here or anywhere" to the scope that assertion actually holds — the phase's own D-50 precedent for
turning an overclaim into a mechanical, correctly-scoped one.

### WR-03: an assertion that cannot fail, guarding a property it does not test

**File:** `scripts/generate-role-adapters.test.ts:579-583`

**Issue:**

```ts
// The removal is DETERMINISTIC: the same input produces the same bytes on two runs, so the two
// sibling cases cannot drift apart through an order-dependent strip.
expect(stripFencedBlockLines(lines).kept.join("\n")).toBe(strip.kept.join("\n"));
```

`stripFencedBlockLines` is a pure function of a `readonly string[]`; `lines` is not mutated between
the two calls. The assertion is `f(x) === f(x)` and cannot fail for any implementation, correct or
not. Its stated purpose is also not met: the "sibling case" it names
(`generate-role-adapters.test.ts:642-667`) never calls `stripFencedBlockLines` at all — it writes
`lines.join("\n")` **unstripped** and probes with `lines.some((l) => l.startsWith("```")))`. So the
two fixtures are related by prose only, and nothing detects them drifting apart.

**Fix:** delete the tautology and assert the property the comment describes, which is *agreement
between the two sibling fixtures*, not determinism:

```ts
// The sibling case writes the UNSTRIPPED lines; this one writes the STRIPPED lines. What must hold
// is that both are built from the SAME splice of the SAME source file, so the pair pins the two
// directions of one region rather than two unrelated documents.
expect(strip.linesRemoved).toBeGreaterThan(0);
expect(strip.kept.length + strip.linesRemoved).toBe(lines.length);
expect(strip.kept.filter((l) => l.startsWith("```"))).toEqual([]);
```

## Info

### IN-01: dead local — `kitListDir` is declared and never read

**File:** `scripts/validate-agent-factory.ts:88-94`

**Issue:** `npx tsc --noEmit --noUnusedLocals` reports the repository's only unused-local error:
`error TS6133: 'kitListDir' is declared but its value is never read.` The kit sets this helper was
written for are now derived through `scripts/kit-model.ts` (inventory entries 5 and 6), so its last
caller went away with that migration and the helper survived it.

**Fix:** delete the function. Optionally add `noUnusedLocals`/`noUnusedParameters` to
`tsconfig.json` — the tree is otherwise clean under both flags today, so it would cost nothing and
would keep the next migration's residue from surviving silently.

### IN-02: `stripComment`'s returned `state` is unasserted by every differential over it

**File:** `scripts/frontmatter.test.ts:8145` (D-51 differential), `:8861` (D-54 differential)

**Issue:** Both single-line differentials compare only `scanned.text`. CR-01 corrupts
`scanned.state.openQuote` while leaving `scanned.text` byte-identical for every input — which is
precisely why 87 KB and 98 KB of fixture and 193 green cases walked past it. The function's contract
is a pair; half of it has no differential.

**Fix:** extend the pre-D-54 fixture to record `state` alongside `shortened`, and assert both fields.
This is cheap (the corpus and the state grid already exist) and it converts CR-01's class from
"invisible" to "one red cell".

---

_Reviewed: 2026-08-09T21:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
