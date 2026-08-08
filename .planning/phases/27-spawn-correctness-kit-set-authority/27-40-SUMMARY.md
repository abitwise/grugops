---
phase: 27-spawn-correctness-kit-set-authority
plan: 40
subsystem: frontmatter-parser
tags: [spawn-correctness, yaml, parser, safety-invariant, gap-closure-round-7]
status: complete
requires:
  - phase: 27-39
    provides: the carried scalar quote state, consumed as landed and not re-derived here
provides:
  - "scripts/frontmatter.ts LeadingRun — the leading run labelled by what it is MADE OF (none / indentation / residue), decided in the one scan that measures its length"
  - "scripts/frontmatter.ts the indentation branch of classifyDelimiter — position-asymmetric, consumed at the CLOSING position only"
  - "scripts/frontmatter.ts the block-scalar exemption on flush — the quoting rule applied only where YAML gives the construct quoting"
  - "scripts/frontmatter.test.ts the arm-movement table — 12 rows, each destination asserted, with the no-keyless-success property checkable over the whole table"
  - "scripts/frontmatter.test.ts SWEEP_LEADING's mixed space-and-tab member and the D-45 cardinality move (216 -> 240 per family, 648 -> 720 total)"
affects:
  - "check-foundation-guards.ts guard_wr05 (SPAWN-04) — unedited; its parse-failure branch stops firing on three documents a real loader accepts"
  - "keyHasValue's coordinator marker — a block-scalar quoted `true` no longer matches"
  - "the KIT-03 closure equality, coordinator-resolution-precheck, check-kit-refs, validate-agent-factory — all four re-run clean, verdict unchanged"
tech-stack:
  added: []
  patterns:
    - "apply a rule only where the FORMAT gives the construct that meaning — the `WHERE IT IS NOT APPLIED` paragraph is part of the rule, not documentation beside it"
    - "one labelled result consumed once, never a length test beside a composition test"
    - "a position asymmetry is legitimate only when the two call sites CONSUME the verdict differently, and the reason is recorded in source"
    - "a code comment claiming a property CITES the assertion that re-measures it, instead of quoting a remembered count"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-50 implemented: WR-02 and IN-02 closed in this round, neither deferred; both were the module applying a rule where the format gives the construct no such meaning"
  - "D-49 honoured: every platform claim carries a /usr/bin/ruby -ryaml transcript; every closing case was RED against the committed .js before the edit and GREEN after"
  - "The leading-run label is THREE-way, not two-way — the empty run is its own kind, because a vacuous `entirely declared whitespace` would route `--- foo` out of its refusal (executor deviation, caught before it shipped)"
  - "A wholly-quote-wrapped block scalar carrying a non-allowlisted escape moves refuse -> no-grant. KEPT, with three measured arguments, and named in the arm-movement table (executor deviation, found by red-team)"
metrics:
  duration: ~50 min
  completed: 2026-08-08
actuals:
  tokens: 17451
  tasks: 2
  commits: 2
---

# Phase 27 Plan 40: Apply a Rule Only Where the Format Grants It Jurisdiction Summary

Closed the seventh spelling of this module's founding failure — and the first that
did not get the legal set wrong but got the QUESTION wrong: `classifyDelimiter`
asked *"does this line begin with a payload"* without first asking *"is this line
at a delimiter POSITION"*, and the flush applied the quoting rule inside a
construct YAML gives no quoting at all.

## What was wrong

Both sites are **the module applying a rule at a position where the format gives
the construct no such meaning**. That discipline was already written down in this
file, in `startsWithReference`'s *"where it is NOT applied"* paragraph. Neither
site carried it.

- **WR-02** — `leadingInvisibleRun` returned a LENGTH. Space and tab render no
  glyph, so indentation was inside the run and invisible to the payload test; it
  reappeared only as the `run !== 0` clause, which is a **refusal**. But
  indentation is exactly what distinguishes a delimiter from content.
- **IN-02** — `flush` called `unquoteChecked` regardless of `cur.block`, so a
  block scalar had quotes stripped and escapes refused that the loader never sees.

Loader column throughout: `/usr/bin/ruby -ryaml` — **Ruby 2.6.10 / Psych 3.1.0 /
libyaml 0.2.1**. RED captured on a `git archive HEAD` mirror of `cca7622` **before
any edit**; GREEN against the **rebuilt committed `.js`**, never the TypeScript.

## Task 1 — the labelled leading run (commit `6698f58`)

### WR-02 parser RED/GREEN, against the committed `scripts/frontmatter.js`

| # | document | RED (committed) | GREEN (rebuilt) | libyaml |
|---|---|---|---|---|
| W2-a | `description: \|` / `  intro` / `  ---` / `  outro` | REFUSE — *"the closing delimiter position carries `  ---` … U+0020"* | `ok`, keys=2, `description` = `intro --- outro` | `"intro\n---\noutro\n"` |
| W2-b | `description: Read the docs` / `  ...and then some` | REFUSE — same clause, plus the U+0061 trailing fault | `ok`, `Read the docs ...and then some` | `"Read the docs ...and then some"` |
| W2-c | `description: >` / `  intro` / `  ...` / `  outro` | REFUSE — same clause on the `...` payload | `ok`, `intro ... outro` | `"intro ... outro\n"` |
| control | the short `--` inside a block scalar | `ok`, `intro -- outro` | unchanged | `"intro\n--\noutro\n"` |
| control | a legal `---` close at column 0 | `ok`, grant reported | unchanged | keys intact |

**W2-b is the cheap one**, and it is why this is not exotic: an author wrapping a
long `description:` whose continuation begins with an ellipsis turned the whole
foundation gate red on a file the platform loads fine.

### The asymmetry, measured on BOTH sides rather than assumed

| row | RED (committed) | GREEN (rebuilt) |
|---|---|---|
| space-indented **OPENING** delimiter | REFUSE — *"opening delimiter position carries `  ---` … U+0020"* | **REFUSE, same clause** |
| tab-indented **OPENING** delimiter | REFUSE — *"… U+0009"* | **REFUSE, same clause** |
| the only post-opening close candidate is **indented** | REFUSE (delimiter reason) | **REFUSE — `opened at line 1 … never closed`** |

The third row is the property that makes the change safe: at the closing position
`not-a-delimiter` means *keep scanning*, and the fallback is another **refusal**.
At the opening position that verdict IS the keyless success arm, so indentation is
not routed there. **This is not the open/close asymmetry D-39 point 5 killed** —
that one was the same byte refusing loudly at one position and succeeding silently
at the other with no stated reason; this is a stated difference in what the two
positions MEAN, and it points the only way it safely can.

### The KIT-03 boundary, asserted in BOTH orders

| mixed leading run | opening | closing |
|---|---|---|
| residue then indentation (`<ZWSP>` + space + `---`) | REFUSE, names **U+200B** | REFUSE, names **U+200B** |
| indentation then residue (space + `<ZWSP>` + `---`) | REFUSE, names **U+0020** | REFUSE, names **U+0020** |

Unchanged at both positions, each still naming a code point in the `U+XXXXX`
label shape. A run is indentation only when it is **entirely** inside the declared
class; one code point outside it makes the whole run residue, whichever end it
sits at.

### Structural facts, reported as numbers

| fact | before | after |
|---|---|---|
| functions in the delimiter region | 5 | **5** (same names: `firstOutsideDeclaredWs`, `leadingInvisibleRun`, `codePointLabel`, `assertNeverVerdict`, `classifyDelimiter`) |
| `classifyDelimiter` verdict kinds | 3 | **3**, `assertNeverVerdict` unchanged at both call sites |
| `DELIMITER_WS_CHAR` **declarations** | 1 | **1** (`/[ \t]/`) |
| `DELIMITER_WS_CHAR` **code references** | 1 | **2** (`firstOutsideDeclaredWs`, `leadingInvisibleRun`) |
| any other whitespace class in the region | none | **none** |
| `tsc --noEmit` | 0 | **0** |

Total `DELIMITER_WS_CHAR` occurrences moved 2 → 6; the four additions are prose in
the doc blocks. **No second character class was introduced** — the indentation
label is a comparison between two classes the module already declares.

### The corrected `FALSE-RED COST` comment, quoted beside the case it cites

Removed:

> "All 33 files on the spawn-grant scan surface open with a byte-exact `---` …
> The strict rule costs this repository nothing, **which is what makes the
> allowlist affordable**."

That is a point-in-time count over one surface doing the work of a class-level
property — and it was **false in substance while it stood**, because WR-02 was a
false red on three document shapes none of those 33 files happens to use. The
replacement states what it is and **cites** the two controls that re-measure it on
every run: the D-43 false-red control over the one `spawnGrantScan()` composition,
and the self-deriving repository-wide control whose corpus comes from
`git ls-files '*.md'` at run time. Both are in the suite, both shipped in the same
commit, and this plan **extended** the second one so the citation is load-bearing
rather than decorative (it now also asserts that the derived corpus covers the
scan composition, and that no scan member reaches the keyless arm).

Two further comments that had become false were corrected in the same commit:
`VISIBLE_GLYPH`'s *"its LENGTH is the whole of what this class contributes to a
verdict"* — the WR-02 defect written down as a design statement — and a **seventh**
entry in the founding-failure history (the plan said *sixth*; `27-39` had already
landed one).

### Red-team, because a green suite is not proof

24 spellings the plan never named, run against both builds. **Five rows moved, all
in the same direction — refusal → correct parse WITH the grant reported:** a grant
before an indented close, a grant after one, the CRLF spelling, a grant on a block
scalar spanning an indented `---`, and a doubled indented close. **Zero rows moved
into the keyless success arm and zero new silent no-grants.** Everything else was
byte-identical, including deep indentation, space+tab runs, `----`, `--- foo`,
indented `...`, the fence authority, and all three indented-OPENING spellings.

One row flagged by the harness — `  ...` at the OPENING position returning a
keyless success — is **byte-identical before and after** and is correct: `...` is
not an opening payload, so line 1 is not a delimiter and the document genuinely has
no frontmatter, exactly as the platform reads it. It is the D-39 point 4 / D-34
body-only arm, deliberately preserved.

## Task 2 — the block-scalar exemption (commit `1ee8495`)

### IN-02 parser RED/GREEN

| # | document | RED (committed, after Task 1) | GREEN (rebuilt) | libyaml |
|---|---|---|---|---|
| I2-a | `tools: \|` / `  Read, "Agent(x\q)"` | REFUSE — *"carries the backslash sequence `\q` inside a double-quoted scalar"* | `ok`, value `Read, "Agent(x\q)"`, **spawnGrant = true** | `"Read, \"Agent(x\\q)\""` |
| I2-b | `description: \|` / `  "alpha"` | `ok`, quotes **STRIPPED** to `alpha` | `ok`, `"alpha"` — quotes kept | `"\"alpha\""` |
| I2-c | `coordinator: \|` / `  "true"` | `ok`, `true`; **`keyHasValue` = `true`** | `ok`, `"true"`; **`keyHasValue` = `false`** | `"\"true\""` |
| control | the same `\q` value **OUTSIDE** a block scalar | REFUSE | **REFUSE, same reason** | — |
| control | a NON-block `coordinator: "true"` | `keyHasValue` = `true` | **`keyHasValue` = `true`** | `"true"` |

All three GREEN values are **byte-equal to libyaml** (modulo the trailing newline
the declared join contract folds). I2-a's destination is named: parse-failure →
**conviction**. I2-c is the security row — a non-coordinator file could claim the
coordinator marker through a construct the platform reads as the literal text
`"true"`, masked on the tree as it stood only by `guard_wr05`'s exactly-one
cardinality check, which is defence in depth and not a property of the parser.

### The escape allowlist was NOT narrowed — verified by function-scoped diff

| function | diff vs pre-40 |
|---|---|
| `unquoteChecked` (including the single-quoted branch) | **empty — byte-unchanged** |
| `resolveDoubleQuoted` | **empty — byte-unchanged** |
| `scanEmbeddedDoubleQuoted` | **empty — byte-unchanged** |

The change is one condition on `flush`. Every non-block value still answers to the
allowlist, pinned by a control that was passing before this task and after it.

### The D-45 axis-1 sweep — RED-before against the PRE-TASK-1 committed build

The final test file was run against the pre-Task-1 committed `.js` on the retained
mirror, with the per-cell assertion collecting instead of throwing so the whole
column could be counted:

| run | failing cells | **closing** | **opening** |
|---|---|---|---|
| RED — pre-Task-1 committed `.js` | **108** | **108** | **0** |
| GREEN — rebuilt committed `.js` | **0** | 0 | 0 |

The 108 decompose exactly as the format predicts: **3 indentation members**
(one space, one tab, a space and a tab) × **3 payload-bearing kinds** × **6
trailing** × **2 closing token families** = 108, split 54 `---` / 54 `...`. The
near-payload kind contributed nothing, correctly — it is `not-a-delimiter`
regardless. **The column asymmetry IS the finding, recorded as data:** not one
opening-position cell failed, which is precisely the property the change had to
preserve.

Cardinality moved deliberately, with the new numbers stated in the assertion
message: axis 1 **9 → 10**, per family **216 → 240**, total **648 → 720**.

### The arm-movement table — the one property that makes both fixes safe

12 rows, each destination asserted by a case, the row count asserted as a number,
and the property asserted **over the whole table**: no input class MOVES into the
keyless success arm.

| input class | from | to |
|---|---|---|
| indented payload line inside an open block, closing position | refuse-delimiter | **parse-grant** |
| indented payload line with no legal close after it | refuse-delimiter | **refuse-unterminated** |
| indented payload line at the OPENING position | refuse-delimiter | refuse-delimiter |
| leading run carrying residue, closing position | refuse-delimiter | refuse-delimiter |
| leading run carrying residue, opening position | refuse-delimiter | refuse-delimiter |
| block scalar carrying a non-allowlisted backslash | refuse-escape | **parse-grant** |
| block scalar whose joined value is wholly quote-wrapped | parse-no-grant | parse-no-grant |
| the same backslash value OUTSIDE a block scalar | refuse-escape | refuse-escape |
| block scalar, wholly quoted, escape gluing the token to a word character | refuse-escape | **parse-no-grant** |
| the discriminating control — same construct, token on a boundary | refuse-escape | **parse-grant** |
| a legal document | parse-grant | parse-grant |
| a body-only document | keyless-success | keyless-success |

The single `keyless-success` row **was already there and did not move**.

### Repository-wide cost, both numbers DERIVED in their own run

| | corpus (`git ls-files '*.md'`) | files read | refusals |
|---|---|---|---|
| before (pre-Task-1 committed `.js` on the mirror) | 1132 | 1132 | **0** |
| after (final rebuilt committed `.js`) | 1132 | 1132 | **0** |

The two derived sizes are equal. **Flattened value map over every tracked markdown
file: byte-identical, 0 differences over 1132 files compared.**

`27-39` recorded **1131** four commits ago; the corpus is **1132** today. That
one-file drift inside a single plan is the concrete reason no corpus size is
written into any assertion — these numbers are a **record of this run** and are
deliberately not written back into any plan or suite case. The before/after value
map is likewise a ONE-SHOT execution-time transcript, not a suite case: its
`before` image is a build that ceased to exist the moment Task 1 landed and lived
on a throwaway mirror, so a permanent case asserting against it would fail once the
mirror was cleaned up or be "fixed" later by narrowing it until it passed.

## Deviations from Plan

### 1. [Rule 1 — a bug in the plan's own stated rule] The leading-run label is THREE-way, not two-way

- **Found during:** Task 1, writing the classifier branch.
- **Issue:** the plan's rule reads `indentation : the run consists ENTIRELY of the
  declared whitespace class` / `residue : the run contains any other non-glyph code
  point`. Under that two-way split the **empty** run is vacuously "entirely inside
  the declared class", so it would be labelled indentation — and
  `closing + indentation + payload -> not-a-delimiter` would then route `--- foo`
  and `----` at the closing position **out of their refusals**. A real regression
  hiding inside a true-sounding sentence.
- **Fix:** `LeadingRun` has three kinds — `none`, `indentation`, `residue`. The
  boundary is decided ONCE in the labelling scan rather than patched with a length
  test at the point of use, which is what the plan's `promote` decision requires.
- **Pinned by:** `expect(projectVerdict("--- foo", "closing")).toBe("refuse")` and
  the `... foo` twin, in the same commit.

### 2. [Rule 1 — three shipped assertions asserted the opposite of the platform] Inverted, not deleted

Three cases encoded the WR-02 false red itself and went red on the correct build.
Handled per `27-39`'s precedent:

- **`DELIMITER_ROWS`** carried ONE verdict tag for both positions. It is now a
  required **two-sided** pair on every row, so a future row must declare both, and
  a case asserts the asymmetric set is **exactly** `["a LEADING space"]`.
- **`COMPOSITE_ROWS`**' closing test: the ` ----` row is classified by its own
  `leading` code point against a declared indentation set, not by its label, and
  the set is asserted to select exactly that one row.
- **The D-43 sweep's "source 4"** asserted the declared class refuses as a leading
  run at BOTH positions. Inverted at the closing position only; the opening half is
  untouched and is now the control proving the class was not simply loosened. Both
  positions additionally assert the silent no-grant arm is not reached.

### 3. [Task-boundary adjustment] `expectedVerdict` moved to Task 1

The sweep's expected-verdict rule is the FORMAT rule the module implements, so it
could not stay stated the old way across Task 1's verify without the suite being
red. The rule change landed in Task 1; the new axis member, the cardinality moves
and the RED-before capture stayed in Task 2 as planned.

### 4. [Rule 1/2 — found by red-team, named rather than accepted] refuse → no-grant, kept with three arguments

- **Found during:** Task 2 red-team, from a spelling in no plan and no review:
  `tools: |` / `  "Read\nAgent(grugops-orchestrator)"` (a LITERAL backslash-n).
- **Issue:** pre-fix it REFUSED; post-fix it parses and reports **no grant**. That
  is a refusal becoming a success, which is the direction this plan's prohibitions
  guard, and it is outside every class the plan's arm-movement table names.
- **Investigated, not assumed.** Three measurements decided it:
  1. the module's value is **byte-equal to libyaml's**, and libyaml's own value has
     **no `\bAgent\b` boundary either** — the `n` of the literal `\n` is glued to
     the `A`. Module and platform agree on the value AND on the token's absence, so
     there is no disagreement for a bypass to live in;
  2. **three sibling spellings of the identical text** — an unquoted block scalar,
     a plain scalar and a single-quoted scalar — **already** landed on no-grant
     before this change. The wholly-quote-wrapped block scalar was the only spelling
     that refused, and it refused by naming a *"double-quoted scalar"* that does not
     exist inside a block scalar. The change removes an inconsistency;
  3. the **discriminating control**: the same construct with the token after a
     comma **CONVICTS** (`{ok:true,value:true}`), pre-fix refuse → post-fix grant.
- **Disposition: KEPT.** Both rows are in the arm-movement table with the argument
  recorded, and a case asserts all four spellings now return the same verdict over
  the same text, with a four-spelling boundary control that all convict.

### 5. [Rule 2] The self-deriving control was extended beyond "leave it alone"

The corrected `FALSE-RED COST` comment CITES that control, so the citation had to
be load-bearing. It now also asserts that the derived corpus **covers**
`spawnGrantScan()`'s composition, and that **no** scan member reaches the keyless
success arm. Still **no corpus-size literal in any assertion**, and it is
**extended, never duplicated** — a second control walking the same files would be
the weaker-duplicate shape this module deletes on sight.

## Verification

| check | result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — 32 committed `.js` match a fresh rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1150 passed / 2 skipped**, 35 files (Task 1 left 1146; `27-39` left 1141) |
| `node scripts/check-foundation-guards.js` | exit 0 — `ALL CHECKS PASSED` |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| live kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills, 2 packaging = **33** members, declared count 33 |
| `git diff package.json` | empty |
| `git status --porcelain` | clean apart from this plan's three files |
| every transcript | run against the committed `.js`, never the TypeScript source |
| every platform claim | carries a `/usr/bin/ruby -ryaml` transcript |

**The suite floor is a floor, not evidence.** It has been green in every one of the
six rounds of this phase in which a defect was later found. The evidence is the RED
transcripts above, the 108/0 sweep asymmetry, the loader agreement, and the two
adversarial red-team passes — one of which produced deviation 4.

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts` — all present and modified.
- Commits `6698f58` and `1ee8495` — both present in `git log`.
- The safety invariant was verified adversarially, not by a green suite: 24 WR-02
  spellings and 23 IN-02 spellings were run against BOTH builds and diffed row by
  row; the only rows that moved are the intended ones plus the one investigated in
  deviation 4; zero rows moved into the keyless success arm; and the repository-wide
  flattened value map over 1132 tracked files is byte-identical.
