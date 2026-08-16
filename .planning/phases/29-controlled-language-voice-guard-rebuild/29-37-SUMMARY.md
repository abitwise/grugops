---
phase: 29-controlled-language-voice-guard-rebuild
plan: 37
subsystem: audit-parse-authority
tags: [lang-03, lang-07, wr-02, tautology, witness, d-08, d-18, gap-closure-round-4]
status: complete
requires:
  - scripts/audit-model.ts (readRegistry, CLAIM_ID_RE, CLAIM_HEADING_RE — plan 29-28)
  - scripts/frontmatter.ts (fencedLineFlags, unfencedMatchIndices — the one fence authority, read, unchanged)
  - scripts/generate-safety-surface.ts (safetySurfaceUnion — read, unchanged)
provides:
  - a published denominator with a witness of a DIFFERENT KIND that can contradict it
  - canonicalClaimHeadingCensus — one exported authority, consulted by the parser and by its harness
  - the canonical claim-heading recogniser derived from CLAIM_ID_RE.source, proven to follow it under mutation
  - the deleted tautology MEASURED over a 21-shape corpus rather than argued from set algebra
  - four probe edges decided by cases — adjacency, empty, ordering, encoding
  - the readRegistry -> safetySurfaceUnion -> D-18 exclusion chain asserted at its point of effect
  - IN-02 and IN-04 recorded in source as deferred by user decision
affects:
  - scripts/audit-model.ts
  - scripts/audit-model.test.ts
  - scripts/check-foundation-guards.test.ts
tech-stack:
  added: []
  patterns:
    - "a witness must differ in KIND from the projection it audits — a different recogniser AND a different traversal, not the same expression rearranged"
    - "measure the unfalsifiability, do not argue it: a set-algebra proof is correct and is not a measurement"
    - "one canonical-form authority, proven by MOVING it and watching the derived recogniser follow — a grep for `no second literal` is satisfied by a literal spelled differently"
    - "`^`/`$` under `m` break at CR, U+2028 and U+2029; `split(\"\\n\")` does not — the two views of a document disagree about where a line begins, and that disagreement is a real fail-open"
    - "a positional line-number literal inside a guard is set-literal drift; address the site by its CODE"
    - "a census that counts a token anywhere in a source counts it in the comment that explains the census — name the line by its subject"
key-files:
  created: []
  modified:
    - scripts/audit-model.ts
    - scripts/audit-model.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "The replacement WAS shipped rather than deleted, because input falsifiers exist and are enumerated — contrary to the reading of the plan's standing rule that would have deleted it. A canonical claim heading placed after a bare CR, U+2028 or U+2029 fires the refusal through readRegistry on INPUT, with the shipped recogniser and no mutation. The plan's own acceptance criteria anticipated only a mutation falsifier; the executor looked for an input one and found three."
  - "The witness's left term is `claims.length`, not `headingIdx.length`. They are equal by construction, and using the parsed list states the relationship the refusal is about: what the parse RETURNED against what the raw bytes carry."
  - "The witness regex spells its separators `[^\\S\\n]` — `\\s` minus the newline. `CLAIM_HEADING_RE` spells them `\\s` and is tested against members of `split(\"\\n\")`, which contain no newline; the witness runs `m`-anchored over the whole text, where a bare `\\s` would cross a line boundary. A CRLF registry was probed: `[ \\t]` would have false-red on it, `[^\\S\\n]` does not."
  - "The adjacency case deliberately does NOT assert `second block's start === first block's end`. That is true by construction of readRegistry's loop (`end = headingIdx[n + 1]`) and asserting it would be the exact shape this plan exists to delete. The observable consequence — a zero-length span DECIDED by a named refusal — is asserted instead, and the case says why."
  - "The pre-existing harness pin `claims.length === shaped - fenced` (plan 29-28's block) was LABELLED rather than deleted. It is the same identity, and it is kept as documentation of the relationship between two published figures with a source note saying it is not a check."
  - "The [B1] blast-radius pin in check-foundation-guards.test.ts was converted from a LINE NUMBER to the site's CODE. This plan is what moved it (1081 -> 1239 with the line itself unchanged), which is the recorded set-literal-drift class arriving inside a guard; re-numbering it would have left the next plan to move it again."
  - "The tripwire's two paren counters now DIVERGE by one (+12 / +11) and that was reported rather than smoothed. The single causing line is named; it is an unbalanced `(` inside a string literal, which is precisely the error class `counterDisagreements` exists to publish. Rewording the line to tidy the number would delete a true instance of the measurement's own error from the measurement of that error."
  - "CLAIM_HEADING_RE was NOT narrowed (IN-02) and headingShapedFenced was NOT newly asserted elsewhere (IN-04). Both are recorded in source as deferred by user decision for this round, and IN-02's deferral is additionally pinned by a case asserting the recogniser is byte-unchanged in the committed .js."
metrics:
  duration: 40m
  completed: 2026-08-16
actuals:
  tokens: 17000
  tasks: 3
  commits: 3
---

# Phase 29 Plan 37: WR-02 — a refusal that no input could fire Summary

`readRegistry`'s published denominator now has a witness that can disagree with it, and three
distinct inputs make it disagree — the refusal it replaces could not be fired by any input at all,
and said in a comment that it could.

## What was built

| Artifact | File | Kind |
|---|---|---|
| `CANONICAL_CLAIM_HEADING_SOURCE`, built from `CLAIM_ID_RE.source` | `scripts/audit-model.ts` | the witness recogniser |
| `canonicalClaimHeadingCensus(text, flags)` + `CanonicalHeadingCensus` | `scripts/audit-model.ts` | exported one-authority census |
| the witness refusal, naming three numbers and the consequence | `scripts/audit-model.ts` | replaced named refusal |
| the IN-02 deferral note at `CLAIM_HEADING_RE` | `scripts/audit-model.ts` | source-level deferral record |
| the IN-04 deferral note at `headingShapedFenced` | `scripts/audit-model.ts` | source-level deferral record |
| 11 cases in "the registry's denominator has a witness that can contradict it" | `scripts/audit-model.test.ts` | measurement, discrimination, input, mutation |
| 6 probe-edge cases — adjacency, empty, ordering, encoding | `scripts/audit-model.test.ts` | permanent edge decisions |
| 3 cases in "the witness stands between a hidden claim and the exclusion list" | `scripts/audit-model.test.ts` | the chain at its point of effect |
| the [B1] site pin, converted from a line number to the site's code | `scripts/check-foundation-guards.test.ts` | drift repair |
| the tripwire census re-measured, with its one divergence accounted | `scripts/check-foundation-guards.test.ts` | boundary re-measurement |

## The finding, and what the code actually was

`readRegistry` closed with

```ts
if (headingIdx.length !== headingShapedLines - headingShapedFenced) { refuse(...); }
```

`headingIdx` is `unfencedMatchIndices(text, CLAIM_HEADING_RE)`, `headingShapedLines` is `|re|` and
`headingShapedFenced` is `|re ∧ flags|` — over the SAME text, the SAME non-global `RegExp` object and
the SAME `fencedLineFlags`. That is the identity `|re ∧ ¬flags| = |re| − |re ∧ flags|`.

The comment above it asserted, in so many words, that this was "TWO SEPARATE EXPRESSIONS over the
same text, deliberately — not one expression and a subtraction of its own output, which is
29-REVIEW § WR-03's shape one layer down." It was exactly that shape, on the wrong side of the
sentence. The sentence was **deleted**, not amended.

This is not cosmetic: `readRegistry`'s claims feed `safetySurfaceUnion`, which feeds the D-18
exclusion list deciding which files a controlled-language pass may never touch. A projection whose
published denominator cannot contradict it is a number that can be short against nothing, in the one
parse whose shortness silently shrinks a safety exclusion.

## The shipped refusal fires on ZERO of 21 corpus shapes — MEASURED

Task 1's RED was a demonstration that the shipped assertion **cannot go red**, recorded as a
measurement rather than argued from set algebra. The corpus is permanent in
`scripts/audit-model.test.ts` and the deleted expression is reconstructed there verbatim from
29-REVIEW § WR-02's quotation of it, so its unfalsifiability stays measurable after it stops existing.

| # | shape | idx | shaped | fenced | deleted refusal |
|---|---|---|---|---|---|
| S01 | canonical heading, unfenced | 1 | 1 | 0 | silent |
| S02 | canonical heading inside a terminated fence | 0 | 1 | 1 | silent |
| S03 | two claim headings on adjacent lines | 2 | 2 | 0 | silent |
| S04 | single-token non-canonical level-three heading | 1 | 1 | 0 | silent |
| S05 | canonical heading carrying trailing text | 0 | 0 | 0 | silent |
| S06 | unterminated fence above a heading | 0 | 1 | 1 | silent |
| S07 | tab separator | 1 | 1 | 0 | silent |
| S08 | trailing whitespace after the id | 1 | 1 | 0 | silent |
| S09 | heading between two fenced regions | 1 | 1 | 0 | silent |
| S10 | four-backtick run around a heading | 0 | 1 | 1 | silent |
| S11 | indented delimiter around a heading | 1 | 1 | 0 | silent |
| S12 | heading on the last line, no trailing newline | 1 | 1 | 0 | silent |
| S13 | empty document | 0 | 0 | 0 | silent |
| S14 | CRLF line endings | 1 | 1 | 0 | silent |
| S15 | NBSP separator | 1 | 1 | 0 | silent |
| S16 | **the live registry** | 42 | 42 | 0 | silent |
| S17 | bare CR before a canonical heading | 0 | 1 | 0 | silent |
| S18 | U+2028 before a canonical heading | 0 | 1 | 0 | silent |
| S19 | U+2029 after the id on a real heading | 0 | 1 | 0 | silent |
| S20 | full-width digits in the id | 1 | 1 | 0 | silent |
| S21 | U+2011 non-breaking hyphen in the id | 1 | 1 | 0 | silent |

**Corpus size 21; the deleted refusal fires on 0.** The plan required at least five distinct shapes
and a count of zero.

The same corpus is then run through the **shipped** witness, and the firing set is asserted by SET
equality rather than by count — a witness that fired on some other six shapes would satisfy a count:

`{ S04, S17, S18, S19, S20, S21 }`.

That is the discrimination proof. The corpus is not inert; the two predicates genuinely differ on it.

## What ships instead

Two counts of different **kinds**, and the difference is both in the recogniser and in the traversal:

- `claims.length` — a LINE-ARRAY FILTER through `CLAIM_HEADING_RE`, a `\S+`-shaped recogniser that
  accepts any single token as an id, followed by `parseClaimBlock`.
- `census.raw` — a `g`-flagged OCCURRENCE SCAN over the RAW bytes for the CANONICAL heading form,
  built from `CLAIM_ID_RE.source`.

The assertion is `claims.length + census.fenced === census.raw`. The fenced canonical count is the
only permitted difference, because a canonical heading inside a fence is documentation by this
module's own decision and is correctly absent from `claims`.

**One fence verdict, consulted once (LANG-07).** `canonicalClaimHeadingCensus` takes the flags array
as a PARAMETER; it declares no delimiter class, calls no fence authority and holds no toggle. A
permanent case slices `readRegistry`'s body out of the committed `.js` and asserts exactly one
`fencedLineFlags(` call site in it.

**One canonical-id authority, proven by moving it.** A grep for "no second literal" is satisfied by a
literal spelled differently, so the derivation is proven instead: a mirror of the committed `.js`
with `CLAIM_ID_RE` widened to `\d{4}` makes the census count `### C-28-0001` and stop counting
`### C-28-001` — exactly inverted from the module under test. A second literal could not follow.

**The `g` flag's state is denied a place to live.** The RegExp is constructed fresh per call rather
than held at module level, because a `g`-flagged object carries `lastIndex` across uses and would
skip occurrences silently, in the SHORTENING direction. `unfencedMatchIndices` REFUSES a `g`-flagged
argument for the same reason; here the flag is the point of the traversal, so the state is removed
instead.

## The falsifiers, enumerated in both directions

The plan's standing rule said to DELETE the replacement if no input could falsify it. The executor
looked for input falsifiers rather than settling for the mutation falsifier the acceptance criteria
anticipated, and found three — so the assertion was shipped.

### Reached on INPUT, through `readRegistry`, with the shipped recogniser

`^` and `$` under `m` also break at a bare CR, U+2028 and U+2029. `text.split("\n")` does not. A
canonical claim heading placed after one of those is a heading to every `m`-anchored reader, to
`grep` and to a renderer, and is **not a line at all** to this parser — a claim the document carries
and the list omits. Transcript, against the built module:

```
[bare CR] -> audit-model: refusing to parse docs/audit/28-claim-registry.md — its claim list and its
raw canonical-heading count disagree: the parse returned 1 claim(s) and the raw text carries 2
canonical `### C-28-NNN` heading(s), of which 0 sit inside a fence. 1 + 0 is not 2. …
[U+2028] -> (identical)
[U+2029] -> (identical)
[control, no hidden terminator] -> parses
```

The control matters: the SAME bytes with the terminator removed (`prelude### C-28-007` on one line)
parse silently to one claim. The refusal is caused by the terminator and by nothing else about the
plant.

### Reached only under MUTATION of the committed `.js`

The drift the witness exists to catch lives in a module-private recogniser, so no input can express
it. Two mutations, each on a two-file mirror of the committed artifacts (`audit-model.js` +
`frontmatter.js` — the whole local import closure, asserted rather than assumed):

| mutation | fixture | outcome |
|---|---|---|
| unmutated control | live registry + drift fixture | claim ids identical to the module under test; drift fixture parses 1 claim, refuses nothing |
| `CLAIM_HEADING_RE` -> `/^###\s+(\S+).*$/` | a second heading carrying trailing text after a canonical id | **REFUSES**, naming `2 claim(s)` and `1 canonical` |
| `if (!CLAIM_ID_RE.test(id))` -> `if (false)` | a `### banana` block beside a real claim | **REFUSES**, naming `2 claim(s)` and `1 canonical` |

Every mutation anchor is asserted to occur EXACTLY once before substitution, and the mirror is
asserted to differ from the committed build — a mirror identical to the original proves nothing.

### What the witness CANNOT catch, stated in source and here

- **A real claim wrapped in a fence.** It leaves `claims` and arrives in `census.fenced`, so the
  equality is preserved by construction. That direction is held by the odd-delimiter refusal and by
  `parseClaimBlock`'s swallowed-verbatim refusal, never by this one.
- **A non-canonical id on an unfenced heading** (`### Overview`, `### C-28-００１`).
  `parseClaimBlock`'s canonical-id check **dominates** this equality and refuses first, so no input
  reaches the witness by that road. The third mutation above is the disclosure made measurable: with
  that check removed, `### banana` alone makes the two numbers disagree. The witness is what SURVIVES
  if the dominating check ever weakens.

## The live numbers, derived in session

```
LIVE parsed=42  raw=42  fenced=0  shaped=42  shapedFenced=0
LIVE witness holds: true
```

Recorded by a permanent case that derives all three through the same exported authority the parser
uses, asserts non-vacuity first (`raw > 0`, `claims.length > 0`), and asserts the census's line list
is ascending and one entry per occurrence.

## Probe edges

| edge | what the case decides |
|---|---|
| **adjacency** | Two claim headings on consecutive lines produce TWO blocks at consecutive indices; the first block's body is EMPTY (zero span lines) and the block is PRESENT; `readRegistry` DECIDES it with a named `carries no fenced block` refusal naming `C-28-001` rather than dropping it. A control asserts the same two claims separated normally parse as two. |
| **empty** | A zero-block registry refuses by name BEFORE the witness is reached, and the case asserts the premise that makes the ORDER load-bearing: on that document the witness equality is vacuously satisfied (`0 + 0 === 0`), so a witness reached there would agree with a projection over a file it never read. The case also asserts the witness refusal is NOT what fired. A claim block with an empty metadata region is decided by the block parser (`missing required metadata key`). |
| **ordering** | The index array ascends and its members are distinct, on a fixture AND on the live registry; two blocks carrying one id are refused by name. Together: elements that compare equal never reach an order-dependent answer. |
| **encoding** | `### C-28-００１` (full-width) and `### C‑28‑001` (U+2011) are NOT canonical to the byte comparison, while BOTH are claim-heading-SHAPED to the parser's own recogniser — asserted, so the case measures the id comparison and not the heading shape. `readRegistry` refuses both by the `C-28-NNN` name. No normalisation added; the comparison's byte-ness is stated at the declaration. |

`CLAIM_HEADING_RE` is byte-unchanged: read at its declaration (`/^###\s+(\S+)\s*$/`) and pinned by a
case asserting exactly one such declaration in the committed `.js`.

## The parse did not move

Before/after census, both derived in session — "before" materialised from `6551522` into a scratch
mirror and executed, not remembered:

| figure | before | after |
|---|---|---|
| claim count | 42 | 42 |
| claim ids | `C-28-001 … C-28-042` | identical |
| kind distribution | `{architecture: 28, install: 8, safety: 6}` | identical |
| safety arm files | 6 entries | identical |
| `safetySurfaceUnion` | 41 entries | identical |

The two JSON transcripts differ in exactly one field: the `"which"` label. Premise asserted: the
before build carries **0** occurrences of the witness refusal text and the after build carries **1**,
so the mirror really is the pre-change module.

`npm run generate:safety-surface` then `git diff --exit-code docs/audit/28-safety-surface-exclusions.md`
→ **exit 0**. That artifact IS the D-18 exclusion list; it regenerates byte-identical.

The chain is additionally asserted at its point of effect by three permanent cases: a control
publishing the expected entry, a planted claim behind a bare CR making `safetySurfaceUnion` REFUSE
instead of publishing a list one claim short, and a live non-vacuity case where every count is
derived and no size literal appears.

## Verification transcript

| command | result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 48 committed .js file(s)" |
| `npm run typecheck` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run scripts/audit-model.test.ts` | exit 0 — 99 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **2027 passed / 2 skipped across 52 files** (baseline 2007 from 29-36; +20 cases) |
| `npm run generate:safety-surface` | exit 0 — "Wrote … 41 entries" |
| `git diff --exit-code docs/audit/28-safety-surface-exclusions.md` | exit 0 |
| `check-foundation-guards` | exit 0 |
| `check:imperative-lexicon` | exit 0 |
| `check:diff-disposition` | exit 0 |
| `check:banned-claims` | exit 0 |
| `check:audit-register` | exit 0 |
| `check:claim-anchors` | exit 0 |
| `check:public-docs` | exit 0 |
| `check:nul-bytes` | exit 0 |
| `git diff --exit-code package.json package-lock.json` | exit 0 |
| `git diff --exit-code 6551522..HEAD -- package.json package-lock.json` | exit 0 — no package installed |

`npm test` was never run: it triggers the live claude-CLI e2e lane.

## Deviations from Plan

### 1. [Rule 3 — blocking] The [B1] blast-radius pin was a LINE NUMBER, and this plan moved it

- **Found during:** Task 3, running the full non-e2e suite.
- **Issue:** `check-foundation-guards.test.ts:2405` pinned the one declaration-line that applies a
  heading recogniser as `scripts/audit-model.ts:1081`. Inserting a comment block above that line made
  the same unchanged statement line 1239 and the guard went red — a positional literal moving when
  nothing about the property moved.
- **Fix:** The site is now addressed by its CODE
  (`scripts/audit-model.ts :: const headingMatch = CLAIM_HEADING_RE.exec(lines[start]);`). The count
  is still exactly one and the identity is still exact; a SECOND applying declaration, or a DIFFERENT
  one, still reds. Re-numbering it would have left the next plan to move it again — this repository's
  recorded set-literal-drift class, arriving inside a guard.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `02d5a78`

### 2. [Rule 3 — blocking] The tripwire census re-measured at this plan's boundary

- **Found during:** Task 3, same run.
- **Issue:** The tripwire pins six numbers over every `*.test.ts` and requires each to be
  re-measured, never incremented by hand. This plan's 20 new cases moved five of them.
- **Fix:** Re-measured from the live tree by running the census and reading its answer out:
  occurrences 5510 → 5589 (+79), classified 5437 → 5516 (+79, the same delta), statement-level
  multi-line 1134 → 1146 (+12), quote-aware 1128 → 1139 (+11), subject-only 631 → 636 (+5), modules
  47 (unchanged).
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `02d5a78`

### 3. [Rule 2 — disclosure] The two paren counters DIVERGE by one, and it was reported not smoothed

- **Found during:** Task 3, while re-measuring.
- **Issue:** The note above the constants states that the two paren counters agreeing is "the
  property that would be a finding if it broke." At this boundary they moved +12 and +11, so
  `counterDisagreements` moved 14 → 15.
- **Fix:** Traced to a single line and named in source — the assertion in `audit-model.test.ts` that
  counts `fencedLineFlags(` call sites in `readRegistry`'s compiled body splits on a string
  containing an unbalanced `(`, which the naive counter reads as a continuing statement and the
  quote-aware counter does not. That is exactly the error class `counterDisagreements` exists to
  publish, so the arithmetic is +12/+11 and not a second effect. **The line was deliberately not
  reworded** to tidy the number: rewording would delete a true instance of the measurement's own
  error from the measurement of that error.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `02d5a78`

### 4. [Rule 1 — bug in this plan's own work] The one-fence-traversal pin counted PROSE

- **Found during:** Task 1, on the case's first run — it failed at 2 rather than 1.
- **Issue:** The case counted `fencedLineFlags(` occurrences in the text of `readRegistry`'s compiled
  body. That body's own prose NAMES `fencedLineFlags(text)` while explaining why there is only one
  call to it, so the raw count measured the documentation rather than the code.
- **Fix:** Comment lines are dropped before counting, with premise assertions that the strip left
  code behind and actually removed prose. The distinction is written down at the site precisely
  because the case caught it.
- **Files modified:** `scripts/audit-model.test.ts`
- **Commit:** `ff9a1f4`

### 5. [Rule 1 — bug in this plan's own work] The accounting note moved the number it was explaining

- **Found during:** Task 3, after the tripwire pins were updated.
- **Issue:** The first draft of the boundary note quoted the offending assertion verbatim. The
  occurrence counter matches its token ANYWHERE in a test source, comments included, so the note
  pushed occurrences 5589 → 5591 while classified stayed at 5516 — breaking the same-delta property
  for no reason but its own prose.
- **Fix:** The note names the line by its subject instead of reproducing it, and records the
  measurement of its own draft so the next author meets the hazard rather than rediscovering it.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `02d5a78`

### 6. [Plan-hypothesis correction] The plan's two standing directives conflicted, and the executor resolved it by measuring

- **Found during:** Task 1, designing the replacement.
- **Issue:** The plan's `<action>` and acceptance criteria anticipate the replacement being
  falsifiable only under a recogniser MUTATION, while the standing rules say "if no input can falsify
  the replacement either, do not ship it — delete it and disclose." Adopting either verbatim would
  have been wrong: shipping without looking would have risked a second dominated assertion, and
  deleting would have discarded a guard that does fire.
- **Fix:** The executor probed for input falsifiers before deciding, and found three
  (CR / U+2028 / U+2029), each reaching the refusal through `readRegistry` with the shipped
  recogniser. The assertion ships, and the disclosure at the source site enumerates the input
  falsifiers, the mutation falsifier and the two directions it cannot catch.
- **Files modified:** `scripts/audit-model.ts`, `scripts/audit-model.test.ts`
- **Commit:** `ff9a1f4`

## Threat register discharge

| Threat | Disposition | How discharged |
|---|---|---|
| T-29-37-01 — a drifted claim recogniser producing a silently different block list | mitigate | The witness, proven to fire on the recogniser-drift mutation of the committed `.js` |
| T-29-37-02 — a refusal that cannot fire presented as a check | mitigate | The tautology measured to fire on 0 of 21 shapes, replaced; the false comment sentence deleted |
| T-29-37-03 — a published denominator with nothing to be short against | mitigate | The witness plus the recorded live figures (42 / 42 / 0) |
| T-29-37-04 — the D-18 exclusion list changing size as a side effect | mitigate | Before/after claim census identical; the exclusion artifact regenerates byte-identical |
| T-29-37-SC — npm installs | accept | No package installed; manifest and lockfile byte-unchanged in the tree and across the plan's commit range |

## Known Stubs

None. No stub, skipped test or unrun `<verify>` was introduced by this plan.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change.

## Carried forward

- **IN-02 (deferred by user decision).** `CLAIM_HEADING_RE` matches every single-token level-three
  heading. Recorded at the declaration and pinned byte-unchanged by a case; closing it means changing
  the line AND the assertion in one deliberate edit.
- **IN-04 (deferred by user decision).** `headingShapedFenced` is published without being asserted in
  any gate. Recorded at its publication; deliberately NOT closed by asserting it elsewhere, which
  would shut a deferred finding silently.
- **The identity kept as documentation.** `scripts/audit-model.test.ts`'s
  `expect(reg.claims.length).toBe(shaped - fenced)` in plan 29-28's block is the same identity this
  plan deleted from production. It is labelled at the site as documentation of the relationship
  between two published figures and explicitly not a check.
- **The witness is dominated for non-canonical unfenced ids.** Disclosed at the source site and made
  measurable by the id-check mutation, not left to be rediscovered.

## Self-Check: PASSED

Created/modified files verified present:

- `scripts/audit-model.ts` — FOUND
- `scripts/audit-model.test.ts` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- `.planning/phases/29-controlled-language-voice-guard-rebuild/29-37-SUMMARY.md` — FOUND

Commits verified present in `git log`:

- `ff9a1f4` — `fix(29-37): the registry's denominator gets a witness that can contradict it`
- `900599b` — `test(29-37): the probe edges are decided by cases, and a kept identity says so`
- `02d5a78` — `test(29-37): the exclusion list is provably unmoved, and two drifted pins are repaired`
