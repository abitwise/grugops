---
phase: 27-spawn-correctness-kit-set-authority
plan: 29
subsystem: frontmatter-authority
tags: [SPAWN-04, KIT-03, CR-01, D-30, D-32, D-33, security, parser, allowlist]
status: complete
requirements: [KIT-03, SPAWN-04]
gap_closure: true
gap_round: 4

requires:
  - "scripts/frontmatter.ts — the single format-aware frontmatter authority (plan 27-12)"
  - "scripts/check-foundation-guards.test.ts — the hermetic CHECK_ROOT mirror harness"
provides:
  - "An escape ALLOWLIST in the double-quoted branch: exactly three sequences resolve, every other backslash sequence refuses BY NAME as a parse artifact"
  - "scanEmbeddedDoubleQuoted — the same allowlist decision at the two application points a wrapping-quote strip cannot reach (flow item, plain continuation)"
  - "keysGrantedAgentNames as a Parsed<string[]> result, so a grant name is never silently dropped or altered (D-32)"
  - "An exhaustive, dependency-free escape-alphabet property (855 observations) proving refusal is the DEFAULT"
  - "An aggregator-level skill-surface case pinning the whole-gate RED"
affects:
  - "scripts/check-foundation-guards.ts — guard_wr05 and the KIT-03 grant-closure oracle"
  - "scripts/coordinator-resolution-precheck.ts — the installed-target resolution check"

tech-stack:
  added: []
  patterns:
    - "Enumerate-the-good, not enumerate-the-bad: an allowlist whose complement refuses by default, so an un-enumerated spelling is closed before it is reported"
    - "Exhaustive alphabet property over a generated code-point range, written with the Node stdlib and vitest only — no property-testing library"
    - "The test restates the allowlist by hand and asserts it EQUAL to the module's exported map, so the property cannot agree with the module by construction"
    - "Validate-but-do-not-resolve for a composite value: refuse what cannot be vouched for without decoding a document the module deliberately does not decode"

key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/coordinator-resolution-precheck.ts
    - scripts/coordinator-resolution-precheck.js

decisions:
  - "D-30 implemented as written and NOT as the review proposed: no NUMERIC_ESCAPE regex was added. The double-quoted branch was inverted to a three-member allowlist whose complement refuses by name."
  - "D-32 implemented at every unquote call site — the flush join, the block-sequence item, the scoped-grant name split — plus a fourth site the plan did not enumerate (a double-quoted region inside a composite value)."
  - "D-33 implemented: plain folding keeps the space join and resolves; a backslash line-continuation survives that join as a backslash-space sequence, is not on the allowlist, and refuses."
  - "The escape refusal VALIDATES a composite value without resolving it. Resolving inner escapes would be the second grammar this module exists to delete; the three allowlisted escapes all resolve to non-word characters, so leaving them unresolved cannot create or destroy a \\bAgent\\b token boundary."
  - "keysGrantedAgentNames' contract change propagated to a FOURTH call site the plan did not list (scripts/coordinator-resolution-precheck.ts). Handled as a Rule 3 blocking fix, branched explicitly rather than folded into the no-names arm."

metrics:
  duration: ~35 min
  completed: 2026-08-01
  tasks: 3
  commits: 3

actuals:
  tokens: 19500
  tasks: 3
  commits: 3
---

# Phase 27 Plan 29: Escape-Allowlist Inversion (CR-01, third spelling) Summary

CR-01's third spelling — `unquote()`'s blanket backslash-deleting rewrite — is closed by inverting
the double-quoted branch to a three-member escape ALLOWLIST whose complement refuses by name, proven
RED-before / GREEN-after against the committed `scripts/frontmatter.js` at both the module level and
the whole-gate level, and pinned by an 855-observation exhaustive sweep over every printable ASCII
character in the escape position.

## What Was Built

| Symbol | File | Kind |
|---|---|---|
| `DQ_ESCAPE_ALLOWLIST` | `scripts/frontmatter.ts` | new **exported** constant — exactly three entries (`\"`, `\\`, `\/`) |
| `Unquoted` | `scripts/frontmatter.ts` | new exported result type carrying the offending sequence spelling |
| `resolveDoubleQuoted` | `scripts/frontmatter.ts` | new function — single linear pass over a double-quoted body, no regex, no fallback branch |
| `scanEmbeddedDoubleQuoted` | `scripts/frontmatter.ts` | **new, not in the plan** — the same allowlist over a double-quoted region inside a composite value |
| `unquoteChecked` | `scripts/frontmatter.ts` | new result-returning replacement for the string-returning helper |
| `refuseEscape` | `scripts/frontmatter.ts` | new reason builder inside `flattenBlock`, beside the byte-unchanged `refuseRef` |
| `keysGrantedAgentNames` | `scripts/frontmatter.ts` | CHANGED return type — now `Parsed<string[]>` (D-32) |
| `ESCAPE_FORMS` (18 rows) | `scripts/frontmatter.test.ts` | new refused-forms axis, spread into `REFUSED_FORMS` (17 → 35) |
| `ESCAPE_ALPHABET` / `ALLOWLISTED_ESCAPES` / `ESCAPE_PLACEMENTS` | `scripts/frontmatter.test.ts` | new property constants |

`refuseRef` and its reason string are **byte-unchanged**; the single-quoted branch of
`unquoteChecked` is **byte-unchanged** from the pre-D-30 helper. `grep -c 'anchor or alias'
scripts/frontmatter.ts` is 5 — both refusal arms carry the substring every shipped matcher reads.

---

## RED-before / GREEN-after — MODULE LEVEL, against the committed `scripts/frontmatter.js`

### Byte confirmation of the plant (`od -c`)

The planted item was written from a char code, never a shell heredoc or an editor literal:

```
$ grep -n 'x41gent' planted.md | od -c
0000000    1   1   :           -       "   \   x   4   1   g   e   n   t
0000020    (   g   r   u   g   o   p   s   -   o   r   c   h   e   s   t
0000040    r   a   t   o   r   )   "  \n
0000050
```

Exactly **one** backslash byte.

### RED — pre-fix committed `scripts/frontmatter.js`

```
=== RED probe against the COMMITTED scripts/frontmatter.js (pre-fix) ===
parseFrontmatter.ok:       true
allowed-tools flattened:   ["Read, Write, Bash, Glob, Grep, x41gent(grugops-orchestrator)"]
hasSpawnGrant:             {"ok":true,"value":false}
grantedAgentNames:         {"ok":true,"value":[]}
exit=0
```

The silent no-grant SUCCESS arm, on a document whose allow-list a compliant loader resolves to
`Agent(grugops-orchestrator)`.

### GREEN — final committed `scripts/frontmatter.js`

```
=== FINAL GREEN, module level, against the FINAL committed scripts/frontmatter.js ===
parseFrontmatter.ok:       false
allowed-tools flattened:   "`- \"\\x41gent(grugops-orchestrator)\"` carries the backslash sequence `\\x` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the value this document expresses is not the text these bytes spell, so it is refused on the same argument as an anchor or alias — never read as \"carries no grant\""
hasSpawnGrant:             {"ok":false,"reason":"`- \"\\x41gent(grugops-orchestrator)\"` carries the backslash sequence `\\x` inside a double-quoted scalar, ... refused on the same argument as an anchor or alias — never read as \"carries no grant\""}
grantedAgentNames:         {"ok":false,"reason":"`- \"\\x41gent(grugops-orchestrator)\"` carries the backslash sequence `\\x` inside a double-quoted scalar, ... refused on the same argument as an anchor or alias — never read as \"carries no grant\""}
```

Both readers reach the `ok:false` parse-artifact arm and the reason names the offending sequence
`\x` verbatim.

### The two false-red controls, against the SAME final `.js`

```
-- control: single-quoted (the same backslash text) --
parseFrontmatter.ok:       true
allowed-tools flattened:   ["Read, \\x41gent(grugops-orchestrator)"]
hasSpawnGrant:             {"ok":true,"value":false}
grantedAgentNames:         {"ok":true,"value":[]}

-- control: double-backslash --
parseFrontmatter.ok:       true
allowed-tools flattened:   ["Read, \\x41gent(o)"]     <- JSON escaping; ONE literal backslash
hasSpawnGrant:             {"ok":true,"value":false}
grantedAgentNames:         {"ok":true,"value":[]}
```

---

## RED-before / GREEN-after — AGGREGATOR LEVEL, hermetic `CHECK_ROOT` mirror

Plant target `.claude/skills/grugops-map/SKILL.md` — the skill surface has no freshness gate and no
role corpus to cross-check, the same surface rounds 1 and 2 used.

### RED — pre-fix guard, same mirror, before and after the plant

```
=== BEFORE the plant: hermetic mirror, untouched ===
exit=0
== Result ==
ALL CHECKS PASSED

=== AFTER the plant: same mirror, pre-fix guard ===
exit=0
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked), ...
== Result ==
ALL CHECKS PASSED
```

### GREEN — final guard, same plant

```
=== FINAL aggregator BEFORE the plant ===
exit=0
== Result ==
ALL CHECKS PASSED

=== FINAL aggregator AFTER the plant ===
exit=1
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-map/SKILL.md: frontmatter parse failure — `- "\x41gent(grugops-orchestrator)"` carries the backslash sequence `\x` inside a double-quoted scalar, and that sequence is not one of the three escapes this module resolves; the value this document expresses is not the text these bytes spell, so it is refused on the same argument as an anchor or alias — never read as "carries no grant". An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"

== Result ==
1 CHECK(S) FAILED
```

```
=== mirror restored byte-for-byte ===
.../mirror-final/.claude/skills/grugops-map/SKILL.md: OK
=== live checkout ===
 M .planning/STATE.md          (pre-existing orchestrator edit; no kit file touched)
```

---

## Two mutation transcripts — the tests are load-bearing, not restatements

### Task 2: the new escape rows are RED against the pre-fix parser

`scripts/frontmatter.js` temporarily replaced with `git show 8fb6770^:scripts/frontmatter.js`,
then restored and verified by SHA-256:

```
=== RED: the new escape rows run against the PRE-FIX committed frontmatter.js ===
  × REFUSES every YAML reference form x indents x values — and never returns the no-grant SUCCESS arm
  × D-33 — a multi-line double-quoted scalar FOLDS plainly, and a backslash line-continuation REFUSES
AssertionError: ESCAPE axis / KEY-LINE — an escaped grant in the tools key's own double-quoted value
                (the CR-01 round-3 reproduction) | indent=2 | no grant: expected true to be false
      Tests  3 failed | 29 passed (32)
=== restore ===
scripts/frontmatter.js: OK
```

### Task 3: a FOURTH allowlist entry makes the property fail

A `["n", "n"]` entry was spliced into the committed `.js` allowlist, then restored and SHA-verified:

```
=== MUTATION: a fourth entry (\n -> n) added to the module allowlist ===
  × ESCAPE ALPHABET — refusal is the DEFAULT for every printable ASCII escape, resolution is the enumerated exception
AssertionError: expected 4 to be 3 // Object.is equality
AssertionError: ESCAPE spelling — the line-feed escape (\n) ... : expected true to be false
      Tests  3 failed | 30 passed (33)
=== restore ===
scripts/frontmatter.js: OK
```

The property is bound to the module's real allowlist, not to a restated table.

---

## Verification

| Check | Result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — **32 committed `.js` all fresh** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **997 passed / 2 skipped** across 35 files, 0 failures (baseline 993/2) |
| `node scripts/check-foundation-guards.js` (live tree) | exit 0, `ALL CHECKS PASSED` |
| `node scripts/adapters-freshness.js` | 17 adapters compared, 0 byte differences, listings set-equal |
| Live kit inventory | **17 adapters / 7 skills** |
| `git diff package.json` / `package-lock.json` | **empty** — no dependency added |
| `grep -c 'DQ_ESCAPE_ALLOWLIST'` `.ts` / `.js` | 5 / 5 (criterion: ≥2 each) |
| `grep -c 'unquoteChecked' scripts/frontmatter.ts` | 5 (criterion: ≥4) |
| `grep -c 'anchor or alias' scripts/frontmatter.ts` | 5 (criterion: ≥2) |
| `grep -c 'ESCAPE_ALPHABET' scripts/frontmatter.test.ts` | 9 (criterion: ≥2), generated from a code-point range |
| `REFUSED_FORMS` floor | 17 → **35**; product floor 204 → **420** |
| Property observation count | **855**, asserted as a number |
| Whole-repo false-red scan | **0 parse failures** across 1106 tracked `.md` files |

---

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] The escape allowlist reached only three of five application points

- **Found during:** Task 2, while writing the five application-point rows the plan asked for —
  before believing the Task-1 fix.
- **Issue:** `unquoteChecked` only strips a quote pair that wraps the **whole** string. A flow
  sequence (`allowed-tools: [Read, "\x41gent(…)"]`) and a wrapped plain value whose continuation
  line is quoted (`Read,` / `  "\x41gent(…)"`) are composites, so neither ever reached
  `resolveDoubleQuoted`. Measured against the committed post-Task-1 `.js`, **both still returned
  `{"ok":true,"value":false}`** — the identical fail-open, at two of the five points, in the same
  round that claimed to close it.
- **Fix:** `scanEmbeddedDoubleQuoted` applies the **same** `DQ_ESCAPE_ALLOWLIST` to any
  double-quoted region inside a composite value, reusing the quote-state walk `stripComment`
  already carries (D-10: the existing anchor is not re-engineered). It **validates and does not
  resolve** — decoding a partially-quoted composite would be the second grammar this module exists
  to delete, and all three allowlisted escapes resolve to non-word characters (`"`, `\`, `/`), so
  leaving them unresolved can neither create nor destroy a `\bAgent\b` / `\bTask\b` boundary.
- **False-red check:** all 1106 tracked `.md` files reparsed — **zero** new parse failures. The 82
  files carrying a backslash in frontmatter are all `.planning/` documents and none of them refuse.
- **Files modified:** `scripts/frontmatter.ts`, `scripts/frontmatter.js`
- **Commit:** `4d49be2`

### 2. [Rule 3 — blocking issue] A fourth `keysGrantedAgentNames` call site the plan did not enumerate

- **Found during:** Task 1, at `npx tsc --noEmit`.
- **Issue:** D-32 changes `keysGrantedAgentNames` to return `Parsed<string[]>`. The plan named two
  consumers (the KIT-03 grant-closure oracle and the thin text-level wrapper); a third exists —
  `scripts/coordinator-resolution-precheck.ts:397`, the installed-target resolution check. Leaving
  it would not compile.
- **Fix:** branched on the failure arm explicitly with a named `fail(...)`, exactly as the KIT-03
  oracle does. It was **not** folded into the zero-length branch — that is the silent-success shape
  one level down, and it would let the resolution check pass over a closure the installed adapter
  does not express.
- **Files modified:** `scripts/coordinator-resolution-precheck.ts`, `.js` (not in the plan's
  `<files>` list; `git diff --stat` accordingly shows two files beyond it)
- **Commit:** `8fb6770`

### 3. [Scope note] The review's proposed fix was deliberately NOT implemented

`27-REVIEW-GAPS-3.md` § CR-01 proposes a `NUMERIC_ESCAPE = /\\(?:x[0-9A-Fa-f]{2}|u…|U…)/` refusal.
D-30 declines it as the fourth enumerate-the-bad patch on the same fail-open, and it does not appear
anywhere in this change. `grep -c 'NUMERIC_ESCAPE' scripts/frontmatter.ts` is 0. The escape decision
is made in exactly one place — the three-member allowlist — and everything outside it refuses.

---

## Authentication Gates

None.

---

## Known Stubs

None. No stub, placeholder, TODO or hardcoded empty value was introduced. Every `<verify>` in the
plan was run, and every behavioral claim above carries a captured transcript against the committed
compiled output rather than a source read.

---

## Threat Flags

None. The change is confined to a parser that already sat on the
`adapter/skill file content → guard verdict` trust boundary; it narrows that boundary and opens no
new surface. `T-27-CR01-01` (Elevation of Privilege) and `T-27-CR01-02` (Tampering) are both
mitigated as the register specified; `T-27-CR01-04` (Repudiation) is mitigated by the freshness gate
exiting 0 over all 32 committed `.js`. `T-27-SC` is trivially satisfied — zero package-manager
installs, `package.json` byte-unchanged.

---

## Commits

| Commit | Task | Message |
|---|---|---|
| `8fb6770` | 1 | `fix(27-29): invert unquote() to an escape ALLOWLIST — CR-01 third spelling closed` |
| `4d49be2` | 2 | `test(27-29): enumerate the ESCAPE AXIS, the false-red controls and the D-33 answer` |
| `34696a7` | 3 | `test(27-29): prove the allowlist structural with an exhaustive escape-alphabet property` |

---

## Self-Check: PASSED

Every file this summary claims to have modified exists on disk, and every commit hash resolves.

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: scripts/check-foundation-guards.ts
FOUND: scripts/check-foundation-guards.js
FOUND: scripts/check-foundation-guards.test.ts
FOUND: scripts/coordinator-resolution-precheck.ts
FOUND: scripts/coordinator-resolution-precheck.js
FOUND: 8fb6770
FOUND: 4d49be2
FOUND: 34696a7
```
