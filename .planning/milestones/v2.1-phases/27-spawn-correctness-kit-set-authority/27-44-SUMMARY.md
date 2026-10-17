---
phase: 27-spawn-correctness-kit-set-authority
plan: 44
subsystem: frontmatter-authority
tags: [spawn-grant, yaml, differential-harness, loader-oracle, safety-invariant, gap-closure-round-8]
status: complete
requires:
  - "27-43 (the one-authority comment scanner; this harness measures the scanner 27-43 shipped)"
  - "D-52 (the completeness claim's source moves to a real loader over a generated corpus)"
  - "D-53 (IN-02's disposition is FIX)"
provides:
  - "scripts/frontmatter.test.ts — the D-52 loader differential: 312 generated cells, one /usr/bin/ruby -ryaml batch, the loader's verdict as the expected value, a printed corpus digest"
  - "scripts/frontmatter.test.ts — two named safe-direction exemptions with reasons and derived bounds, asserted EQUAL to the measured disagreement set"
  - "scripts/frontmatter.test.ts — MODULE_SYMBOLS at file scope, one list read by both non-circularity pins"
  - "scripts/frontmatter.test.ts — cardinality pins on both one-grammar construct arrays plus six per-construct load-bearing fixtures"
affects:
  - "the D-49 multi-line sweep (its hand-written truth table is demoted from completeness claim to second independent expectation)"
  - "scripts/check-foundation-guards.ts guard_wr05 (unchanged; the module it consumes is unchanged)"
tech-stack:
  added: []
  patterns:
    - "the completeness claim's SOURCE moved out of the file: corpus generated, expectation computed by the platform's own loader family"
    - "a printed corpus DIGEST, so an out-of-suite RED transcript's 'same corpus' claim is measured rather than asserted"
    - "exemptions declared as data with a reason and a DERIVED bound, asserted EQUAL to the disagreement set — never a subset"
    - "the unsafe directions asserted empty INDEPENDENTLY of any exemption, so no exemption can ever hide a silent no-grant"
    - "one classifier parameterised on its construct sets, so a per-construct removal probe measures the rule and not a copy"
key-files:
  created: []
  modified:
    - scripts/frontmatter.test.ts
decisions:
  - "D-52 implemented in full: the sweep's completeness claim no longer derives from the product of two hand-listed axes; it derives from /usr/bin/ruby -ryaml over a 312-cell generated corpus. The hand-written truth table is retained and explicitly demoted to a SECOND independent expectation over a stated subset, tied to the harness case by a source assertion so it cannot outlive it."
  - "D-53 / IN-02 implemented: both construct arrays carry a two-sided length pin AND each of the six constructs has a planted fixture that is recognised through that construct and through no other."
  - "NEW, from the plan's own instruction to make the corpus able to express 27-43's red-team bypasses: two key-line shapes were added beyond the plan's nine so the corpus contains the last two defects this phase actually shipped, not only the two a review reported. Both are RED on the pre-fix build."
  - "NEW, found while making 'the outside run used the same corpus' measurable: the two corpora differed only in a digest separator, and the separator in the test file was a RAW NUL BYTE. A NUL in source makes BSD grep classify the file binary and report ZERO matches with no warning. Spelled as String.fromCharCode(0); the file is back to UTF-8 text."
  - "MEASURED, NOT ACTED ON, AND NOT DROPPED: scripts/validate-agent-factory.ts is still not a spawn-grant surface (0 occurrences of `spawn`, 0 of `frontmatter`, 0 of `wr05`). No round-8 plan dispositions the carried-forward question. Recorded below with a recommendation; forcing it would mint a second spawn-grant predicate beside guard_wr05, which this plan's prohibitions forbid."
metrics:
  duration: "~1h20m"
  completed: 2026-08-09
  tasks: 3
  commits: 3
actuals:
  tokens: 61000
  tasks: 3
  commits: 3
---

# Phase 27 Plan 44: The Completeness Claim's Source Moves to a Real YAML Loader — Summary

WR-01 is closed by taking the expectation out of this file entirely: a 312-cell corpus generated from
three axes enumerated as data, handed in ONE process to `/usr/bin/ruby -ryaml`, whose verdict — not a
hand-written table — is what every cell is compared against. IN-02 is closed in the same plan.

## What shipped

| Artifact | Change |
|---|---|
| `scripts/frontmatter.test.ts` (D-52 harness) | new top-level describe: three data axes (13 x 6 x 4), a derived cell total, one loader batch, 97 printed skips, a disagreement set reported as data and asserted equal to two named exemptions, an exercised no-loader skip path, a non-circularity source inspection, a printed corpus digest |
| `scripts/frontmatter.test.ts` (D-49 sweep) | the hand-written truth table's completeness claim RETIRED — restated as an internal consistency floor over a stated subset, plus a source assertion tying it to the harness case by name |
| `scripts/frontmatter.test.ts` (file scope) | `MODULE_SYMBOLS` hoisted out of the D-49 pin so both non-circularity pins read ONE list |
| `scripts/frontmatter.test.ts` (one-grammar block) | two cardinality pins, a classifier parameterised on its construct sets, and six planted per-construct load-bearing fixtures |

No production source file was edited. `git diff --name-only` across all three tasks lists
`scripts/frontmatter.test.ts` alone, so `scripts/frontmatter.ts` and its committed compiled twin are
consumed exactly as `27-43` left them.

## Commits

| Task | Commit | Subject |
|---|---|---|
| 1 (tracer) | `3237a37` | the completeness claim's source becomes a real YAML loader over a generated corpus (D-52) |
| 2 | `0b0b339` | prove the harness is a pin, and retire the truth table's completeness claim (D-52) |
| 3 | `5bde10f` | the one-grammar detector's refusal claim cannot shrink in silence (D-53, IN-02) |

## The harness's three counts, and the loader that produced them

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 4ccc987f19323055 | cells enumerated 312 | loader-rejected (skipped) 97 | disagreements 32 | 77ms
```

**Cells enumerated 312. Cells the loader rejected and skipped 97. Disagreements 32.** Wall-clock for
the whole harness case: **77ms** (69–77ms across five runs). Loader: **ruby=2.6.10 psych=3.1.0
libyaml=0.2.1**.

### The cell total is DERIVED, quoted from the source

```ts
const CELLS =
  AXIS_KEY_LINE.length *
  AXIS_CONTINUATION_1.length *
  AXIS_CONTINUATION_2.length;
const corpus = enumerateCells();
expect(
  corpus.length,
  `the enumerated corpus must be the product of the three axis lengths (${AXIS_KEY_LINE.length} x ${AXIS_CONTINUATION_1.length} x ${AXIS_CONTINUATION_2.length})`,
).toBe(CELLS);
```

The only numeric literals in the harness are the three axis-length floors (`13`, `6`, `4`), each
stated in source to be a floor against shrinking and explicitly **not** the completeness claim. No
cell-count literal exists anywhere in the block.

### The loader is invoked ONCE per run

`grep -c '/usr/bin/ruby'` over the new describe block returns **1** — a single `const RUBY` that the
version probe and the batch both read. The whole corpus crosses the process boundary as one JSON
array and the verdicts come back as one JSON array, whose length is asserted equal to the cell count
so a truncated batch fails arithmetically rather than silently shortening the differential.

### Every loader rejection is PRINTED — one verbatim

```
D-52 SKIP (loader rejected) value on the key line | a hash at position 0 | the token plainly :: Psych::SyntaxError
```

97 such lines, each carrying all three axis labels and the loader's error class.

### The no-loader skip branch was EXERCISED, not assumed reachable

The loader probe is parameterised on the interpreter path for exactly this reason. A dedicated case
drives it with a path that cannot exist:

```
D-52 SKIP BRANCH EXERCISED (deliberately, with an absent interpreter): /var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/grugops-no-such-ruby-4f2a1c9e/ruby with the yaml (Psych/libyaml) library is not runnable on this machine
```

The same case then takes the positive arm against the real interpreter, so both arms are reached
rather than one of them being decorative. This is T-27-08-08 (`a harness that silently never runs`)
closed by measurement.

### The disagreement set is asserted EQUAL, not a subset — quoted

```ts
expect(
  [...new Set(disagreements.map((d) => d.split("\t")[0]))].sort(),
  `the disagreement set must EQUAL the named exemption set — not be a subset of it, so an exemption that stops being needed fails just as loudly as a new disagreement.\nDISAGREEMENTS (${disagreements.length}):\n${disagreements.join("\n")}`,
).toEqual([...new Set(expectedExempt)].sort());
```

### The exemptions: two, both safe-direction, both bounded

| | Exemption | Reason (module policy) | Bound (derived) | Accepted cells matched |
|---|---|---|---|---|
| E1 | a dangling YAML node property at the flow collection's first node start | The key line ends with a node property (YAML 1.2 § 6.9) whose node has not begun. D-30 refuses a reference construct rather than resolving it; the loader resolves it and grants. | `DANGLING_PROPERTY_SHAPES * 6 * 4` = 24 | 16 |
| E2 | a YAML anchor at the value's node start on the first continuation line | The key line carries no value node, so the first continuation IS the value's node start and `&w` there is a genuine anchor. D-30 refuses it. | `CONTINUATION_START_SHAPES * 4` = 16 | 16 |

**Zero exemptions are in the unsafe direction, and that is asserted independently of the exemption
machinery.** A module GRANT where the loader has none, and a module NO-GRANT where the loader grants,
are collected into their own `unsafe` array and asserted empty — so no exemption, however written,
can ever cause a silent no-grant to pass. All 32 disagreements are `module=refuse`:

```
=== GREEN disagreement verdict tally ===
  32 module=refuse
```

grouped as (key-line shape | first-continuation shape):

```
   4 block-sequence dash with no value | a reference sigil at position 0
   4 comment-only value | a reference sigil at position 0
   4 no value | a reference sigil at position 0
   4 trailing whitespace only | a reference sigil at position 0        <- E2, 16 cells
   3 flow-sequence opener with a node property | a hash at position 0
   3 flow-sequence opener with a node property | a reference sigil at position 0
   4 flow-sequence opener with a node property | opens a double-quoted scalar
   3 flow-sequence opener with a node property | opens a single-quoted scalar
   3 flow-sequence opener with a node property | plain text            <- E1, 16 cells
```

### Non-circularity

The case reads back `buildCellRegion`, `buildCellDocument`, `enumerateCells`, all three stringified
axis arrays and `LOADER_PROGRAM`, and asserts none of them names any entry of **`MODULE_SYMBOLS` —
the file-scope list hoisted out of the D-49 pin in this plan and now read by both pins.** It was
reused rather than retyped: two hand-kept copies of a safety set is the drift class this phase has
corrected three times. There is no expected-outcome rule in this block at all — the only expectation
is the loader's output — so the case asserts that absence rather than inspecting a rule that does not
exist.

## Task 2 — the harness is a pin, measured OUTSIDE the suite

### Same corpus, measured rather than claimed

The RED transcript must be produced outside vitest, because a committed case cannot import a module
that stopped existing. "The outside run used the same corpus" is therefore a claim, so the harness now
prints a corpus digest and the outside script prints the same one. **All three runs report
`4ccc987f19323055`** — the committed harness, the RED mirror run, and the GREEN mirror run.

The two transcripts below were produced by the **same script over the same corpus**, differing only in
which committed `scripts/frontmatter.js` it imported. The difference is attributable to the module and
to nothing else.

### RED — `git archive` mirror of `b24d980` (the commit immediately preceding 27-43)

```
module: .../mirror-pre/scripts/frontmatter.js
corpus 4ccc987f19323055
cells enumerated: 312   loader-rejected (skipped): 97   disagreements: 56   100ms

=== RED disagreement verdict tally ===
  24 module=no-grant      <- the UNSAFE silent-no-grant direction, over live grants
  32 module=refuse
```

**Both CR-01 families are present, measured rather than argued.**

Family (a) — the key line carries no value, so the quoted scalar opens on the continuation line:

```
comment-only value | opens a double-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="Write, # x, Agent(grugops-orchestrator)"
comment-only value | opens a single-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="Write, # x, Agent(grugops-orchestrator)"
block-sequence dash with no value | opens a double-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="[\"Write, # x, Agent(grugops-orchestrator)\"]"
block-sequence dash with no value | opens a single-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="[\"Write, # x, Agent(grugops-orchestrator)\"]"
```

Family (b) — the quoted scalar opens MID-LINE inside a flow collection:

```
flow-sequence opener | opens a double-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="[\"Read\", \"Write, # x, Agent(grugops-orchestrator)\"]"
flow-sequence opener | opens a single-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="[\"Read\", \"Write, # x, Agent(grugops-orchestrator)\"]"
flow-mapping opener | opens a double-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="{\"a\"=>\"Read\", \"Write, # x, Agent(grugops-orchestrator)\"=>nil}"
flow-mapping opener | opens a single-quoted scalar | the token after a hash	module=no-grant	loader=grant	value="{\"a\"=>\"Read\", \"Write, # x, Agent(grugops-orchestrator)\"=>nil}"
```

And the two shapes **`27-43`'s own red team** found inside D-51's first draft — the reason this plan's
brief asked that the corpus be able to express them — are also RED here:

```
flow-sequence opener with a node property before a mid-line quote | plain text | the token after a hash	module=no-grant	loader=grant	value="[\"Read, Write, # x, Agent(grugops-orchestrator)\"]"
flow-mapping explicit-key opener with a mid-line quote | plain text | the token after a hash	module=no-grant	loader=grant	value="{\"Read, Write, # x, Agent(grugops-orchestrator)\"=>\"v\"}"
```

### GREEN — mirror of current HEAD

```
module: .../mirror-head/scripts/frontmatter.js
corpus 4ccc987f19323055
cells enumerated: 312   loader-rejected (skipped): 97   disagreements: 32   69ms
```

The 32 are exactly the named exemption set — the same property the committed harness asserts, measured
twice, once inside the suite and once outside it.

### The RED was also reproduced THROUGH the committed case

Not only through the scratch script: the pre-fix `frontmatter.js` was swapped in under the real vitest
run (and restored), and the committed case failed with the intended message:

```
D-52 loader differential — ... | cells enumerated 312 | loader-rejected (skipped) 97 | disagreements 56 | 77ms
× D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader ...
AssertionError: the disagreement set must EQUAL the named exemption set — not be a subset of it, ...
      Tests  1 failed | 133 skipped (134)
```

A cell that was never red is not a pin; these were red, in the committed case, over both families.

### The truth table's completeness claim — retired

**Before** (the claim, as `27-43` left it):

```ts
// (D-52) WHAT THIS COMPLETENESS CLAIM IS AND IS NOT, RESTATED NOW THAT THE AXIS HAS GROWN. It is
// still a claim about the PRODUCT OF TWO HAND-LISTED AXES, not about the construct ...
expect(TRUTH.length).toBe(SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length);
expect(TRUTH.length).toBeGreaterThanOrEqual(12);
```

**After** (the same arithmetic, no longer offered as a completeness claim, plus a mechanical tie):

```ts
expect(
  TRUTH.length,
  "internal consistency of the stated subset (one row per style x sigil of the continuation column) — NOT a completeness claim; the completeness claim is the D-52 loader differential",
).toBe(SWEEP_SCALAR_STYLE.length * SWEEP_SIGIL.length);
expect(new Set(TRUTH.map(([s, g]) => `${s}|${g}`)).size).toBe(TRUTH.length);

const HARNESS_CASE =
  "D-52 loader differential — every loader-accepted cell of a GENERATED corpus agrees with a real YAML 1.2 loader on token presence, except the named safe-direction exemptions";
expect(
  readFileSync(join(import.meta.dirname, "frontmatter.test.ts"), "utf8"),
  "the D-52 loader differential holds this sweep's completeness claim; this table is additional and never an alternative",
).toContain(HARNESS_CASE);
```

The amended comment says in source that the table is **additional and never an alternative**, kept only
because two independent statements of an expectation mean a single wrong idea has to be had twice to
survive — and the citation is mechanical: delete or rename the harness and the truth-table case goes
red, so the table can never quietly become the claim again by outliving what replaced it.

### This harness's counts beside the reviewer's, without conflating the two corpora

The round-7 reviewer ran their own 240-cell differential and reported **74 loader-accepted cells, 4
bypasses, 0 false reds**. This harness reports **312 cells enumerated, 97 loader-rejected, 215
loader-accepted, 32 disagreements (all refusals), 0 unsafe** on the current build, and **56
disagreements of which 24 are the unsafe silent-no-grant direction** on the pre-`27-43` build. These
are two different corpora over the same defect class; the numbers are reported side by side and are
not claimed to measure the same thing.

## Task 3 — IN-02: the one-grammar refusal claim cannot shrink in silence

### The two cardinality pins, quoted with the numbers they pin

```ts
expect(
  HEAD_DELIMITER_CONSTRUCTS,
  "a head-delimiter construct dropped silently narrows the one-grammar refusal claim",
).toHaveLength(3);
expect(
  KEY_LINE_CONSTRUCTS,
  "a key-line construct dropped silently narrows the one-grammar refusal claim",
).toHaveLength(3);
```

### Six fixtures, one per construct — the count derived, not written down

```ts
expect(
  FIXTURES.length,
  "one planted fixture per construct, across both arrays",
).toBe(HEAD_DELIMITER_CONSTRUCTS.length + KEY_LINE_CONSTRUCTS.length);
```

**Fixture count 6 = 3 + 3**, the sum of the two array lengths. Each fixture is asserted to match
**exactly one** construct in each array (so a removal is attributable to the removed construct), and
then asserted **not recognised** when that one construct is dropped:

| Fixture | head construct | key construct |
|---|---|---|
| `head-0-anchored-regex-literal.ts` | 0 (`/^---`) | 0 |
| `head-1-starts-with.ts` | 1 (`startsWith("---")`) | 2 |
| `head-2-index-of.ts` | 2 (`indexOf("---") === 0`) | 0 |
| `key-0-anchored-colon.ts` | 1 | 0 (`^…:\s*`) |
| `key-1-space-before-colon.ts` | 1 | 1 (`^…\s*:\s*`) |
| `key-2-split-on-colon.ts` | 2 | 2 (`split(":")`) |

Every (head, key) pairing is distinct, asserted, so no two fixtures are the same file twice.

### Every fixture goes through the SAME pure classifier the live corpus uses

The classifier is parameterised rather than duplicated, and defaults to the two whole arrays:

```ts
const grammarSitesAmong = (
  paths: string[],
  read: (p: string) => string,
  head: readonly RegExp[] = HEAD_DELIMITER_CONSTRUCTS,
  key: readonly RegExp[] = KEY_LINE_CONSTRUCTS,
): string[] =>
  paths
    .filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))
    .filter((p) => !/(^|\/)frontmatter\.ts$/.test(p))
    .filter((p) => isGrammarSite(read(p), head, key))
    .sort();
```

A second, differently-spelled classifier for the removal probe would have measured the copy instead of
the rule.

### A real finding fell out of making each construct load-bearing

`KEY_LINE_CONSTRUCTS[1]` (`^…\s*:\s*`) is **very nearly subsumed** by `KEY_LINE_CONSTRUCTS[0]`
(`^…:\s*`): the only spellings it matches that the first does not are those whose key alternation is
58–60 characters, because the first construct allows at most 60 characters between `^` and `:\s*` and
the extra `\s*` pushes a 58-character alternation past that bound. The fixture is therefore a genuine
key-alternation regex of exactly that width, and the near-subsumption is recorded in source beside it
rather than papered over:

```ts
const KEY_RE = /^(name|description|tools|allowed-tools|model|disable-model)\s*:\s*(.*)$/;
```

### The disclosure of what the pattern would miss — restricted diff

Byte-unchanged apart from the one added sentence recording the per-construct pins:

```diff
   // The pattern is a floor against the shapes a third grammar plausibly takes, not a proof that none
   // can exist.
+  //
+  // (27-44, D-53, closing IN-02) AND EVERY CONSTRUCT IN BOTH ARRAYS IS NOW INDIVIDUALLY PINNED: each
+  // array carries a length assertion and each member carries a planted fixture that the classifier
+  // recognises THROUGH THAT MEMBER AND NO OTHER, so a member dropped by a later edit narrows the
+  // refusal claim LOUDLY instead of leaving the live assertion passing on the two real files that
+  // still match through the remaining patterns.
```

The live grammar-site assertion is unchanged and still equals exactly the two named non-guard files,
re-asserted at the end of the new case, and its cardinality pin still passes.

Nothing under `scripts/` outside `scripts/frontmatter.test.ts` was modified: `git diff --name-only`
listed that file alone.

## Adversarial reproduction against this plan's OWN work

**A green suite is never evidence of absence** — this repository's standing rule for a safety
invariant. Three attacks were run against the artifacts this plan added, before any of them was called
done.

| # | Attack | Outcome |
|---|---|---|
| 1 | Swap the pre-`27-43` committed `frontmatter.js` under the real vitest run | **RED — pin held.** 56 disagreements, 24 unsafe, the equality assertion fails by name |
| 2 | Drop a head-delimiter construct (count 3 → 2) | **RED — pin held.** `a head-delimiter construct dropped silently narrows the one-grammar refusal claim: expected […] to have a length of 3 but got 2` |
| 3 | Replace `KEY_LINE_CONSTRUCTS[1]` with a weaker DUPLICATE of its sibling, **count preserved at 3** | **RED — pin held.** `with both arrays whole, every planted fixture must be recognised: expected [ …(5) ] to deeply equal [ …(6) ]` |

Attack 3 is the one that matters: it is the exact defeat a cardinality-only pin cannot see, and it is
the load-bearing fixtures — not the length assertion — that catch it. The working tree was restored
after each attack and verified byte-identical.

**Two structural weaknesses of the harness were also probed and closed rather than argued away:**

- **The two consumers might read different bytes.** The loader is handed the frontmatter REGION; the
  module is handed the whole DOCUMENT and locates the region itself. A cell carrying its own `---`
  line would silently make the differential measure the corpus builder. This is round 6's lesson one
  level out — *ask what the predicate's INPUT is assembled from* — and it is now an assertion, not an
  assumption.
- **The outside RED transcript might be over a different corpus than the committed pin.** That was a
  claim, so it became a printed digest. Making it measurable is what surfaced the NUL-byte defect
  below.

**What could still defeat this harness, stated plainly:** a bypass whose shape is outside the
expressible space of the three axes. The axes are still hand-enumerated, and that is not fixed here.
What *is* fixed is that adding an axis member now costs nothing in expectation-writing — the loader
answers for it immediately — so the incentive that kept the old sweep at six hand-reasoned styles is
gone. A green run of this harness is reported as a floor and is not offered as evidence that the
corpus is complete.

## Deviations from Plan

### 1. [Rule 2 — missing critical coverage] Two key-line shapes added beyond the plan's nine

The plan enumerated nine key-line shapes. The execution brief additionally required that the corpus be
able to express the two bypasses `27-43`'s own red team found inside its fix. The nine did not: they
place a node property or an explicit-key indicator at the END of the key line, while the red-team
shapes place the quote MID-LINE after one. Two members were added —
`flow-sequence opener with a node property before a mid-line quote` (`tools: [!!str "Read,`) and
`flow-mapping explicit-key opener with a mid-line quote` (`tools: {? "Read,`). Axis 1 is therefore 13,
not 11, and the corpus 312, not 264. Both new shapes are **RED on the pre-fix build** (see the RED
transcript above) and agree with the loader on the current one. A corpus that cannot express the last
two defects the phase actually shipped is the WR-01 finding restated.

### 2. [Rule 1 — Bug] A raw NUL byte in the test source

Found by the digest mismatch, not by any test: the harness's digest separator had landed in
`scripts/frontmatter.test.ts` as a **literal NUL byte** rather than an escape. `file -b` classified the
file as `data`, and this repository has a standing note that a single NUL makes BSD `grep` report ZERO
matches with no warning — so a reviewer grepping this file would have silently got nothing back. Fixed
to `String.fromCharCode(0)` (never a raw byte, never a `\u`-escape the tooling can re-materialise);
`file -b` now reports `Java source, Unicode text, UTF-8 text` and `grep -c 'D-52 loader differential'`
returns 8. The reason is recorded in source beside the constant.

### 3. [Refactor, required by the plan] `MODULE_SYMBOLS` hoisted to file scope

The plan required the harness's non-circularity pin to reuse the existing symbol list "rather than
re-typing one". The list lived inside the D-49 `it`. It was hoisted verbatim to file scope with its
comment intact, and the D-49 pin now reads the shared one. No entry changed.

### 4. [Measured, not acted on, and NOT dropped] `validate-agent-factory.ts` is still not a spawn-grant surface

`27-43` recorded a carried-forward decision for `27-44`/`27-45` to disposition. Re-measured at this
plan's HEAD:

```
occurrences of 'spawn'       in scripts/validate-agent-factory.ts: 0
occurrences of 'frontmatter' in scripts/validate-agent-factory.ts: 0
occurrences of 'wr05'        in scripts/validate-agent-factory.ts: 0
```

**Scope finding:** `27-44`'s objective, tasks, `must_haves` and threat register are WR-01 and IN-02
only — the validator is not in this plan's scope. It is not in `27-45`'s or `27-46`'s either: both
merely *run* `validate-agent-factory.js` as one of six gate commands and neither dispositions the
question. **So no round-8 plan owns it, and this is stated here rather than left to be rediscovered.**

**Recommendation, for a human to take or refuse:** retire the criterion. `27-43`'s reasoning holds and
is strengthened by this plan's own prohibitions — making the validator consult a spawn-grant verdict
means either importing `guard_wr05`'s answer (coupling a structure validator to a safety gate, for a
question it does not ask) or minting a second spawn-grant predicate beside it (the weaker-duplicate
shape this module deletes on sight, and the shape D-51 was written to remove). The validator printing
`ALL CHECKS PASSED` in round 7 was never a bypass of the validator; it is a command with no such check.
The honest close is to strike the criterion, not to satisfy it.

## Threat register outcome

| Threat ID | Disposition | Outcome |
|---|---|---|
| T-27-08-07 | mitigate | Closed. The expectation is a real loader's output; the batch length is asserted equal to the cell count; the disagreement set is asserted EQUAL to the named exemptions, not a subset |
| T-27-08-08 | mitigate | Closed. The loader probe prints its skip reason, and the skip branch is EXERCISED with an absent interpreter — transcript quoted above |
| T-27-08-09 | mitigate | Closed. Both exemptions are safe-direction; the unsafe directions are asserted empty INDEPENDENTLY of the exemption machinery, so no exemption can hide a silent no-grant. **Zero exemptions are in the unsafe direction** |
| T-27-08-10 | mitigate | Closed. One loader process per run (`grep -c '/usr/bin/ruby'` = 1); harness wall-clock 77ms |
| T-27-08-11 | mitigate | Closed. Every fixture is temp-directory only; `git diff --name-only` for Task 3 listed `scripts/frontmatter.test.ts` alone |
| T-27-08-12 | accept | Unchanged. Printed skip lines carry axis LABELS and an error class, never cell content |
| T-27-08-SC | mitigate (asserted absence) | `git diff --stat -- package.json package-lock.json` is **empty**. No package-manager install ran and no dependency was added — the YAML loader is the pre-existing system `/usr/bin/ruby`, probed with a printed skip. The package-legitimacy audit has nothing to audit; recorded so the empty audit does not read as a skipped one |

## Verification

```
npm run build                                            exit 0
npm run freshness                                        exit 0  (32 committed .js file(s) match a fresh tsc rebuild)
npx vitest run --exclude '**/scripts/e2e/**'             35 files, 1200 passed | 2 skipped
npx vitest run ... scripts/frontmatter.test.ts           135 passed  (was 134 before Task 3)
node scripts/check-foundation-guards.js                  exit 0  ALL CHECKS PASSED
git diff --name-only  (all three tasks)                  scripts/frontmatter.test.ts
git diff --stat -- package.json package-lock.json        (empty)
grep -c '/usr/bin/ruby'  (D-52 describe block)           1
file -b scripts/frontmatter.test.ts                      Java source, Unicode text, UTF-8 text
```

The suite count moved 1196 -> 1200 across this plan. **It is reported as a floor and is never offered
as evidence that no bypass remains** — this suite was green in all eight rounds in which a defect was
later found, twice inside `27-43` alone, and once inside this plan's own first-draft corpus.

## Known Stubs

None.

## What round 8's second half taught

The earlier entries in this ledger were about a rule's CONTENTS, its ARMS, its JURISDICTION, its
ALPHABET, its UNIT, and the SET its arms covered. This one is about none of those. It is about **who
computes the answer**.

> A sweep whose corpus AND whose expectation are both written by hand over the same axes cannot fail on
> an axis nobody thought of. Growing the axis corrects the ARITY of the claim and leaves its NATURE
> untouched. The question to ask of any completeness claim is not "is it consistent?" but **"who else
> could have computed this answer, and did they?"**

And the cheaper corollary, from the NUL byte: **making a claim measurable is how you find out it was
false.** "The outside run used the same corpus" was true in substance and false in the one byte that
would have been quoted as proof. Nothing tested it until a digest did.

## Self-Check: PASSED

Artifact on disk: `scripts/frontmatter.test.ts` — FOUND.
Commits in git: `3237a37` — FOUND; `0b0b339` — FOUND; `5bde10f` — FOUND.
