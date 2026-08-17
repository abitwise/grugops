---
phase: 29-controlled-language-voice-guard-rebuild
plan: 49
subsystem: guards
tags:
  [
    gap-closure,
    banned-claims,
    exemption-region,
    one-read-invariant,
    refusal-channel,
    harness-premise,
  ]
status: complete

requirements-completed: []

requires:
  - phase: 29-48
    provides: "a clean tree at 249f779 whose banned-claim PASS line is the before-anchor every number in this plan is diffed against"
  - phase: 29-REVIEW-round6
    provides: "the three findings this plan discharges — IN-04 (with V-29-47-01), WR-02 and WR-05 — and IN-04's sequencing instruction placing the deletion ahead of any further exemption work"
  - phase: 29-round6-residuals
    provides: "§3.5's five enumerated false statements with their addresses, and §3.8's record closing V-29-42-03 as TRUE rather than vacuously true"
provides:
  - "the sole carve-out's declaration carrying only statements true of the code beside it — the residual block deleted as a pure deletion, 0 added lines in both the .ts and its committed twin"
  - "the module's stated ONE-READ invariant made a property of the module: the exempt member's text comes from the read that produced the region's indices, conjoined with a flag recording that read succeeded"
  - "a named refusal for a present-but-unreadable exemption document, replacing a stack trace out of runAll()"
  - "publicDocsDerivationRefusals() — one exported accessor, one reader per module, consumed by both gates"
  - "three new permanent cases, all RED-proven, two of them mutation-proven on the specific conjunct they guard"
  - "V-29-49-01 — an honestly-recorded unreachable half, escalated rather than papered over"
affects:
  [
    plan 29-51,
    plan 29-52,
    plan 29-53,
    plan 29-55,
    the round-7 residual register,
  ]

actuals:
  tokens: 10564
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A refusal comparing two assemblies of a document cannot catch a case where only one of them was ever handed to it. `locateExemptRegion`'s `scanLines.length !== lines.length` guard is a real guard and was structurally blind to WR-02, because both arrays were internally consistent and simply were not the same document."
    - "`existsSync` answers PRESENT, not READABLE. Every guard written as `if (!existsSync) fail() else read()` carries an unguarded raise in its else arm, and a gate whose floor is that a stack trace is not a verdict must wrap it."
    - "A cached-read substitution keyed on identity alone hands out an empty string on every path where the read did not happen — zero lines, zero findings, one increment of `visited`. It clears the vacuity floor because the denominator still counts the document. The success flag is the bound on that predicate's input."
    - "A module-private refusal array read only by its own runner is not a channel for any importer. When the parts are built at IMPORT time the refusal is already raised before the consumer asks for a single member, so exporting the corpus without exporting its refusals loses the diagnosis while keeping the verdict."
    - "State a case's REACH when it has one. The one-read invariant has no behavioural witness this harness can construct; saying so and escalating a `V-` id is stronger than a case that asserts what it cannot see."
    - "A source-shape count taken over raw bytes counts PROSE. This plan's own harness read a doc comment naming the push sites as a second consumer — the count is now taken over comment-stripped source with the strip's premise asserted on both sides."
    - "Assert the harness's premise. A mirror binary under /tmp on macOS never runs its own `runAll()`, because `/tmp` is a symlink to `/private/tmp` and the main-module guard compares unresolved paths. Exit 0 was silence, not a pass."

key-files:
  created:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-49-SUMMARY.md
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js

decisions:
  - "The residual block was DELETED, not corrected, not shortened, not replaced by a pointer. Its construct is gone; a corrected record of a thing that no longer exists still leaves a reader reasoning about it, and this address is the worst one in the file for that."
  - "The deletion consumed the paragraph's PRECEDING `//` separator (line 642) as well as the block itself, so the result is structurally what would exist if the residual had never been written — closing text, then the banner. Deleting 643-666 alone would have left a dangling separator before the banner."
  - "The exempt-read guard (WR-06's class, one module over) was fixed HERE rather than escalated, because the cached-read substitution cannot be made sound without it: the flag it is conjoined with only exists if there is a failure path to set it false on."
  - "The two refusal channels are reported in SEPARATE loops with SEPARATE prefixes and are never concatenated. A refusal raised here and one raised in the corpus derivation have different remedies, and merging the arrays would save four lines and cost exactly that distinction."
  - "The imported-refusal loop sits BEFORE the per-part vacuity floor and the aggregate pin. The pin's own remedy text tells an author to walk every part's derivation; a derivation that refused is precisely what that instruction would otherwise omit."
  - "No count is pinned on the refusal channel, and the comment says so plainly rather than leaving a reader to infer that a missing pin is an oversight. A refusal count is an EVENT count, not a set cardinality."
  - "The tracer feedback gate was run as an automated end-to-end re-verify rather than as a `checkpoint:human-verify`, on the same grounds plan 29-48 recorded. Documented as a deviation below."

metrics:
  duration: ~50 minutes
  completed: 2026-08-18
---

# Phase 29 Plan 49: Hygiene Ahead of the Exemption Work — a False Paragraph Deleted, a Stated Invariant Made True, and a Refusal Channel Wired Summary

Discharged the three round-6 findings that had to land before any further exemption work: deleted the
false in-source residual block at `BANNED_CLAIM_EXEMPT_REGION`'s own declaration as a pure deletion,
made the module's stated one-read invariant a property of the module and guarded the exempt read that
made it unsound, and wired the imported public-docs corpus's derivation-refusal channel to the gate that
is running — with the gate's published PASS line proven byte-identical across the whole plan.

## Precondition (checked before any other work)

| premise                                                     | required | measured                                                    | verdict |
| ----------------------------------------------------------- | -------- | ----------------------------------------------------------- | ------- |
| `npm run freshness` on HEAD                                 | exit 0   | exit 0 — "All build outputs fresh: 48 committed .js file(s)" | ✓       |

The committed `.js` was a faithful build of its source before this plan began, so every byte difference
afterwards is attributable to this plan.

## The anchor: the PASS line before anything was touched

Captured at `249f779`, before the first edit:

```
  PASS  LANG-04: 115 document(s) carry zero banned claim literal outside the one named exemption region — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1; 22 pinned literal(s) across 3 group(s), matched UNCONDITIONALLY — the gate enumerates what is banned and nothing about how it is said; 1 exemption region (agent-factory/writing-profile.md § ## Disclaimer and honesty floor — the disclaimer must be able to name the standard, and to quote a claim form, in order to deny both — a prohibition that makes its own denial illegal is unwritable), which suppresses 14 banned-claim occurrence(s) (standard-name 8, token-economy 2, comprehension 4), pinned at 14, and reaches 62 line(s), pinned at 62 (two numbers, two questions: how much prohibition the region lifts, and how far it reaches — a section swallowed into it moves only the second); 8 candidate literal(s) refused at admission and recorded with their hit counts
```

**It is byte-identical at the end of task 1, at the end of task 2, and at the end of task 3.** The diff
between the before-anchor and the final capture is empty. Every published number — the document count,
the per-part breakdown, the overlap, the literal count, the group count, the suppressed total, the
per-group breakdown, the extent and the admission-log size — is unmoved.

---

## Task 1 — the false paragraph, deleted

### The real addresses, found by reading rather than taken from the plan

| what                                          | line      |
| --------------------------------------------- | --------- |
| the paragraph separator preceding the block   | 642       |
| the `V-29-42-03` heading                      | 643       |
| the last text line of the block               | 666       |
| the banner closing the declaration block      | 667       |
| `export const BANNED_CLAIM_EXEMPT_REGION`     | 668       |
| **deleted range**                             | **642–666** |

The residuals artifact cites the address as `645-667` and the round-6 review as `643-667`; both are
consistent with the block measured here. The deletion took **642** rather than starting at 643 because
the `//` at 642 is the block's own preceding separator — the comment's convention is separator-then-
paragraph (`627`, `631`, `636`, `642`). Deleting 643–666 alone would have left a dangling `//` directly
above the closing banner. Taking 642 with it leaves closing text at 641 followed by the banner at 667,
which is structurally what the file would look like if the residual had never been written.

### The six false statements, checked off by address

| #   | statement                                                                       | address   | inside 642–666? |
| --- | ------------------------------------------------------------------------------- | --------- | --------------- |
| 1   | `That sentence is now LIVE-FALSE, with a count`                                 | 649       | ✓               |
| 2   | `measured over the 82-document derived scan set`                                | 649–650   | ✓               |
| 3   | `incident-responder.md:29:103 … carrying no benefit marker`                     | 651–652   | ✓               |
| 4   | `the accurate form — no pinned literal OR PINNED PAIR outside the region`        | 652–653   | ✓               |
| 5   | `a conditional member has existed since the discipline's name was pinned`        | 656–657   | ✓               |
| 6   | (IN-04) the status line, and `Carried in docs/audit/29-round5-residuals.md`      | 645, 664–665 | ✓            |

**All six fall inside the deleted range. None survives at a second address**, so the
three-sites-corrected-fourth-site-missed pattern did not apply here and nothing was escalated on that
axis.

### Purity of the deletion

```
$ git diff --numstat scripts/check-banned-claims.ts
0	25	scripts/check-banned-claims.ts
$ git diff --numstat scripts/check-banned-claims.js
0	25	scripts/check-banned-claims.js
```

**Added lines inside the removed range: 0**, in both the source and the committed twin. The diff carries
no expression, identifier, predicate or constant.

```
$ grep -a -c 'V-29-42-03' scripts/check-banned-claims.ts   → 0
$ grep -a -c 'V-29-42-03' scripts/check-banned-claims.js   → 0
```

### The surviving `29-round5-residuals` references, quoted and justified

```
308: * Cross-referenced in docs/audit/29-round5-residuals.md's register, so the source and the record
420:  // docs/audit/29-round5-residuals.md all describe the CO-OCCURRENCE WINDOW: a claim whose bare term
478:  // docs/audit/29-round5-residuals.md's register alongside the round-5 ids, so source and register
```

All three are far outside the deleted block (which ran 642–666) and belong to unrelated paragraphs: two
cross-reference the round-5 register for the co-occurrence-window and admission-log records, one for the
refused-candidate register. None of them asserts a live residual. The occurrence that *was* inside the
block, at 665, is gone. Widening the deletion to reach these would have been the relocation-instead-of-
deletion shape this round exists to refuse.

### Proof the gate did not move

`node scripts/check-banned-claims.js` exit 0, output byte-identical to the before-anchor (`diff` empty).
`npm run build`, `npm run freshness` and `npx tsc --noEmit` all exit 0, with the `.js` twin staged in the
same commit. `check-banned-claims.test.ts`: 79/79.

`scripts/` is excluded from this gate's own scan, so a comment deletion here *cannot* legitimately move
any published number — which is exactly why an unexplained movement would have been the finding rather
than a curiosity.

**Commit `12dfefa`.**

---

## Task 2 — one read, gated on the read having succeeded

### What was wrong

`exemptText` was read once (`:1453`) and `locateExemptRegion` measured `headingAt` / `endBefore` over
that assembly. The scan loop then re-read every member including the exempt file (`:1482`), split that
second read (`:1495`), and spent the first read's indices against the second array (`:1503`).

The `scanLines.length !== lines.length` refusal in `locateExemptRegion` exists to make exactly this
coordinate shear unreachable, and it was **structurally blind** to this instance: it compares the
caller's array against a re-split of the string it was given, and both arrays here were internally
consistent. They simply were not the same document. *A refusal comparing two assemblies cannot catch a
case where only one of them was ever handed to it.*

### What was built

| symbol                      | line    | what it does                                                             |
| --------------------------- | ------- | ------------------------------------------------------------------------ |
| `let exemptReadOk = false;` | 1467    | raised only after a successful read; never initialised true               |
| the guarded exempt read     | 1476–1494 | `try`/`catch` around `readFileSync`, with a named refusal on failure    |
| the loop's selection        | 1519    | `file === BANNED_CLAIM_EXEMPT_REGION.file && exemptReadOk`                |
| the corrected ONE-READ note | 1439–1466 | states the invariant and the bound, not the failure story              |

**The selecting expression, quoted:**

```ts
    if (file === BANNED_CLAIM_EXEMPT_REGION.file && exemptReadOk) {
      text = exemptText;
    } else {
```

The conjunct is the half that is easy to get wrong. Keyed on the filename alone, the selection hands the
loop an empty string on every path where the read did not happen: **zero lines, zero findings, and one
increment of `visited`** — a silently short scan wearing the shape of a one-read fix, and one that clears
the vacuity floor *because the denominator still counts the document.*

### Every `readFileSync`, enumerated

```
$ grep -a -c 'readFileSync' scripts/check-banned-claims.ts   → 7
$ grep -a -c 'readFileSync(' scripts/check-banned-claims.ts  → 2
```

| line | kind                            | purpose                                                    |
| ---- | ------------------------------- | ---------------------------------------------------------- |
| 115  | import binding                  | —                                                           |
| 797  | prose                           | describes a sibling generator                               |
| 819  | prose                           | describes a sibling generator                               |
| 828  | prose                           | describes a sibling generator                               |
| 1474 | prose (inside the new guard)    | names why `existsSync` is not enough                        |
| 1478 | **call site**                   | **the exempt document's one read**                          |
| 1524 | **call site**                   | every other scan member                                     |

**Two call sites.** The loop's read at `:1524` sits in the `else` arm of the selection above, so it is
**not reached for the exempt member** when the exempt read succeeded.

### RED, on a hermetic mirror with the binary verified pre-change

Mirror built by `git archive 12dfefa`. Gate binary confirmed pre-change before the run:

```
$ grep -c 'exemptReadOk' /tmp/pre49/scripts/check-banned-claims.js
0
```

Premise asserted first: the pre-change binary is **exit 0** on the clean live tree.

Plant confirmed on disk before the gate ran: `existsSync(<mirror>/agent-factory/writing-profile.md)` is
`true`, and it is a **directory** — so `existsSync` answers true and `readFileSync` raises.

**RED transcript (pre-change build):**

```
+ node:fs:440
+ Error: EISDIR: illegal operation on a directory, read
+     at readFileSync (node:fs:440:20)
+     at runAll (file:///private/tmp/pre49/scripts/check-banned-claims.js:1256:22)
+   code: 'EISDIR',
```

A stack trace out of `runAll`, not a verdict — which is precisely what the module's own stated floor
forbids.

**GREEN transcript (post-change build), quoted:**

```
  FAIL  the document carrying the one named exemption region, `agent-factory/writing-profile.md`, exists at /var/folders/.../agent-factory/writing-profile.md but could not be read (EISDIR: illegal operation on a directory, read). The exemption region is therefore NOT located and the document is scanned whole, so this refusal is fail-CLOSED — nothing is under-reported. The remedy is to fix the file, never to relax the exemption
```

Exit 1, no `node:internal` / `node:fs:` / `at runAll (` frame, no `Node.js v` banner, no
`ALL CHECKS PASSED`, and distinguishable from the sibling `does not exist at` refusal.

### The one-read case: its reach, stated honestly

The second case asserts the invariant as **source shape**, and this SUMMARY states why rather than
implying more:

**The coordinate shear has no behavioural witness this harness can construct, and the reason is
structural rather than an omission.** The exemption document is a *derived* member of the kit part. Every
mirror in which the two reads could disagree is a mirror in which the document is absent from the scan
set entirely, so the loop never asks about it. This was **measured, not reasoned**: the directory-plant
mirror reports `kit 99` rather than `kit 100`, i.e. the exempt path left the scan set the moment it
stopped being a readable file.

So the case asserts what *is* checkable — two read sites, and a selection conjoined with the success flag
— and it is **mutation-proven twice on the specific property it claims**:

| mutant                                                              | result   |
| -------------------------------------------------------------------- | -------- |
| drop the `&& exemptReadOk` conjunct (the naive ternary)              | **RED**  |
| revert the substitution so the loop re-reads the exempt member       | **RED**  |

Both mutants were reverted and the tree restored before the commit.

`node scripts/check-banned-claims.js` exit 0, PASS line byte-identical to the end of task 1. Build,
freshness and `tsc --noEmit` exit 0. Full non-e2e suite: **52 files, 2070 passed, 2 skipped**.

**Commit `c6f19c5`.**

---

## Task 3 — the imported refusal channel

### What was wrong

`PUBLIC_DOCS_CORPUS_PARTS` is evaluated at **import time**. By the time `check-banned-claims.ts` calls
`publicDocsCorpus()`, the other module's three push sites have already run and any refusal is sitting in
an array this gate never read. The verdict stayed fail-closed; the **diagnosis** was lost.

### What was built

| symbol                            | file                                | kind                                    |
| --------------------------------- | ----------------------------------- | --------------------------------------- |
| `publicDocsDerivationRefusals()`  | `check-public-docs-vocabulary.ts:379` | exported accessor, the one reader     |
| that module's own refusal loop    | `check-public-docs-vocabulary.ts:428` | rewritten to consume the accessor     |
| the imported-refusal loop         | `check-banned-claims.ts:1425`         | new, prefixed by originating module   |

**Signature:**

```ts
export function publicDocsDerivationRefusals(): readonly string[] {
  return DERIVATION_REFUSALS;
}
```

**The calling loop, quoted:**

```ts
  for (const refusal of publicDocsDerivationRefusals()) {
    fail(
      `public-document corpus derivation refused (raised in ` +
        `scripts/check-public-docs-vocabulary.ts, while deriving the public documents this gate ` +
        `consumes): ${refusal}`,
    );
  }
```

**Ordering, measured:**

```
1404:  for (const refusal of DERIVATION_REFUSALS) {          ← this gate's own channel
1425:  for (const refusal of publicDocsDerivationRefusals()) { ← the imported channel
1433:  // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN
```

The imported loop sits after this gate's own and **before** the per-part vacuity floor and the aggregate
pin. That is the whole point: the pin's remedy text tells an author to *walk every part's derivation*,
and a derivation that refused is exactly what that instruction would otherwise omit.

The two arrays are **never concatenated**. Two loops, two prefixes — because a refusal raised here and
one raised there have different remedies, and a reader who cannot tell which module refused has to open
both files to find out.

### The channel's set, its derivation, and its (absent) pin

Recorded in the accessor's own comment rather than left to inference:

- **enumerates:** the refusals the public-docs corpus derivation raised in this process
- **derived by:** the three `DERIVATION_REFUSALS.push` sites — an unreadable repository root, a walk that
  exceeded `MAX_WALK_ENTRIES`, a missing `agent-factory/README.md` — all evaluated at import
- **count pinned by:** **nothing, and nothing should.** A refusal count is an EVENT count, not a set
  cardinality: there is no correct number to compare it against, and a vacuity floor over it would fail
  on every healthy run. Stated plainly so a reader does not read the missing pin as an oversight.
- **plan 29-53's sixth derived part must wire its own channel the same way.** A new part pushing into a
  private array nobody exports repeats this defect exactly.

### One reader, verified

```
$ grep -a -n 'DERIVATION_REFUSALS' scripts/check-public-docs-vocabulary.ts
152:const DERIVATION_REFUSALS: string[] = [];
256:    DERIVATION_REFUSALS.push(
280:  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
301:    DERIVATION_REFUSALS.push(
367: * derivation raised in this process*. It is derived by the three `DERIVATION_REFUSALS.push` sites
381:  return DERIVATION_REFUSALS;
```

One declaration (152), three push sites (256, 280, 301), **one prose mention** (367), **one read** (381)
— and that read is the exported accessor. The module's own `runAll()` now consumes
`publicDocsDerivationRefusals()`.

### RED, on a premise-asserted mirror

Mirror built from `c6f19c5`; both binaries confirmed to contain **zero** occurrences of
`publicDocsDerivationRefusals`. **Both binaries asserted green on the clean mirror before the plant**
(`status=0, PASS line present=true` for each). Plant confirmed on disk: `agent-factory/README.md exists
= false`.

**PRE-CHANGE — status 1:**

```
  FAIL  the banned-claim scan set derived 114 document(s), expected exactly 115 (kit 72, publicDocs 10, installReadme 1, skillSources 7, claudeAdapters 24, overlap 0) — walk every part's derivation and the BANNED_CLAIM_EXCLUDED_LOCATIONS reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts. …
1 CHECK(S) FAILED
mentions the refusal? false
```

**POST-CHANGE — status 1:**

```
  FAIL  public-document corpus derivation refused (raised in scripts/check-public-docs-vocabulary.ts, while deriving the public documents this gate consumes): agent-factory/README.md is a NAMED member of the public-docs scan set and does not exist at /private/var/.../agent-factory/README.md — refusing to report a verdict over a part whose one member could not be read. A missing document is not a clean one
  FAIL  the banned-claim scan set derived 114 document(s), expected exactly 115 …
2 CHECK(S) FAILED
mentions the refusal? true
```

Both exit 1 — the verdict was never the defect. The pre-change run carries **only** the cardinality
complaint, whose remedy sends the author to walk every part's derivation, with **no mention that a
derivation refused**. That is WR-05, reproduced.

### Three permanent cases, all RED-proven

| case                                                     | RED proof                                              |
| -------------------------------------------------------- | ------------------------------------------------------ |
| imported refusal is NAMED, with its module, before the pin | pre-change mirror (`c6f19c5`), accessor absent        |
| the two channels stay SEPARATE                            | pre-change mirror, `public-document corpus` absent     |
| the refusal array has exactly ONE reader                  | mutation ×2 (see below)                                |

| mutant                                                | result  |
| ------------------------------------------------------ | ------- |
| a SECOND reader of the private array in its own runner | **RED** |
| the accessor renamed (consumer left dangling)          | **RED** |

Both gates exit 0 on the live tree. The banned-claim PASS line is byte-identical to the end of task 2.
Build, freshness and `tsc --noEmit` exit 0. Full non-e2e suite: **52 files, 2073 passed, 2 skipped**.

**Commit `3425b72`.**

---

## Prohibitions — status

| #   | prohibition                                                                  | status       | evidence                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | the deleted block is not replaced by a corrected, shorter or pointer paragraph | **ENFORCED** | `git diff --numstat` = `0 25` on both `.ts` and `.js`; added-line count inside the removed range reported as `0`                                                     |
| 2   | no matcher, scan set, exemption bound or pin weakened, widened or moved       | **ENFORCED** | the full PASS line is byte-identical from before task 1 to after task 3 (`diff` empty); the same document count, suppressed total, per-group breakdown and extent    |
| 3   | no closure claimed from a green suite                                        | **ENFORCED** | every changed behaviour shown able to fail first — two hermetic pre-change mirrors and four mutants, each transcript recorded beside its pass                        |

## Threat mitigations applied

| Threat        | Disposition | Applied                                                                                                        |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| T-29-49-01    | mitigate    | The block deleted outright, nothing in its place; six false statements checked off by address (task 1)          |
| T-29-49-02    | mitigate    | The loop takes the cached text for the exempt member (task 2); reach of the assertion stated honestly           |
| T-29-49-03    | mitigate    | The exempt read wrapped; named refusal and exit 1, RED-proven on a directory-at-path mirror (task 2)            |
| T-29-49-04    | mitigate    | The substitution conjoined with a flag set only after a successful read; mutation-proven (task 2)               |
| T-29-49-05    | mitigate    | Exported accessor, one reader per module, folded into the consumer before its vacuity floor (task 3)            |
| T-29-49-06    | mitigate    | The full PASS line captured before and after every task and asserted byte-identical                             |
| T-29-49-SC    | accept      | No package installed; `package.json` and `package-lock.json` byte-unchanged (`git diff --numstat` empty)        |

## Harness defects — TWO false results, both produced by this plan's own verification

The phase's standing lesson applied twice, against harnesses this plan itself wrote. Neither was a fact
about the code; both would have published as findings.

**H1 — a source-shape count read PROSE as a consumer.** The first version of the one-reader case counted
`DERIVATION_REFUSALS` occurrences over raw bytes and derived the read count by subtraction. The
accessor's own new doc comment *names* the push sites in a sentence, so the count came back `2` and
rendered as "the array has a second reader" — against code that has exactly one. A mention is not a
reference. Fixed by asking the question of comment-stripped source, with the strip's premise asserted on
**both** sides: the declaration and all three pushes must survive the strip, and the prose sentence must
be present in the raw text and absent from the stripped text.

**H2 — a mirror binary that never ran, reporting exit 0.** The paired pre/post transcript run first
reported the pre-change binary as **status 0 with no output at all** on a planted mirror — which, taken
at face value, would have been an alarming fail-open finding. It was not a fact about the gate. `/tmp` is
a symlink to `/private/tmp` on macOS, so the module's main-module guard compared an unresolved
`process.argv[1]` against a resolved `import.meta.url`, never matched, and `runAll()` never ran. **Exit 0
was silence, not a pass.** The premise assertion — *does the clean mirror produce a PASS line?* — caught
it (`NO PASS LINE`) before any conclusion was drawn. Fixed by resolving the binary path with
`realpathSync` and re-asserting the premise, which then read `PASS line present=true`.

The transferable shape, and it is the same one plan 29-48 recorded: **an empty or absent intermediate
rendered as confident output about the subject.** In both cases the harness's silence about its own
input became a loud statement about the code. A premise assertion converts that into an abort.

## Findings escalated to the round-7 residual register (plan 29-55 owns it)

**`V-29-49-01` — the one-read invariant has no behavioural witness this test harness can construct.**

- **Direction: informational.** Fail-CLOSED; the fix is in place and correct, and the shear is
  unreachable by arithmetic in the shipped code. What is missing is a case that could watch it fail.
- **The measurement:** the exemption document is a *derived* member of the kit part. On the
  directory-plant mirror the kit part derives `99` members rather than `100` — the document leaves the
  scan set the instant it stops being a readable file. So on every input `makeMirror` can produce, either
  both reads return the same bytes or the loop never asks. **Behavioural reach of the invariant assertion:
  0 inputs.**
- **What ships instead:** a source-shape case, mutation-proven twice on the conjunct and on the
  substitution. Its reach is stated in its own comment rather than implied.
- **Remedy for a later round:** either a harness that can make the two reads disagree (an injected read
  hook, or a part that carries the exempt path as a *named literal* rather than deriving it), or an
  explicit decision that the source-shape case is the intended permanent guard. Not resolved here because
  either option changes a scan part or the harness's construction, and this plan's second prohibition
  forbids moving what the gate decides.

**No-silent-drop equality:** 1 residual measured and not closed == 1 escalated with a `V-` id, a live
count, a direction and a remedy. Zero auto-resolved, zero auto-dismissed, zero marked `backstop`.

## Deviations from Plan

**1. [Process] The tracer feedback gate was run automated rather than as a human checkpoint**

- **Found during:** the gate immediately after Task 1's commit.
- **Issue:** `AUTO_CHAIN` and `AUTO_CFG` both read `false`, whose literal branch is "STOP and return a
  `checkpoint:human-verify`". Task 1's `<verify>` block is entirely `<automated>` — `npm run build`,
  `npm run freshness`, `node scripts/check-banned-claims.js` and a vitest invocation. `checkpoints.md`
  states that users NEVER run CLI commands and that a human-verify checkpoint is for URLs, UI, visuals or
  secrets. There is nothing in this tracer a human can verify that is not a CLI command.
- **Resolution:** the plan's frontmatter declares `autonomous: true` and contains zero
  `type="checkpoint:*"` tasks. The gate's SUBSTANCE — re-run the tracer's `<verify>` end-to-end and HALT
  rather than pour expansion work onto a broken foundation — was executed: freshness green, gate exit 0,
  79/79. Execution continued to Task 2. Same disposition plan 29-48 recorded for the same reason.
- **Files modified:** none.
- **Commit:** n/a.

**2. [Rule 2 — missing critical functionality] The exempt read's guard was added, extending WR-02's scope**

- **Found during:** Task 2, while reasoning about what bounds the substitution's input.
- **Issue:** `existsSync` answers *present*, not *readable*. The `else` arm called `readFileSync`
  unguarded, so a present-but-unreadable exemption document killed the gate with a `node:fs` stack trace
  inside `runAll` — against this module's own stated floor. This is WR-06's class, reported one module
  over.
- **Resolution:** fixed here rather than escalated, because the cached-read substitution cannot be made
  sound without it — the flag the selection is conjoined with only exists if there is a failure path to
  set it false on. The plan anticipated this and named it in its own `gap_contract_map`.
- **Files modified:** `scripts/check-banned-claims.ts` (+ twin), `scripts/check-banned-claims.test.ts`.
- **Commit:** `c6f19c5`.

**3. [Rule 1 — bug] Two harness defects fixed inline**

Documented in full under "Harness defects" above (H1: a prose mention counted as a consumer; H2: a
mirror binary that never ran, reporting exit 0). Both were in this plan's own verification apparatus,
not in any committed artifact; H1's fix is committed as part of the test file, H2's was a throwaway
script. Two auto-fix attempts, under the three-attempt limit.

## Known Stubs

None. Every construct this plan added is wired and exercised: the success flag is a conjunct of a live
selection, the refusal is reached by a permanent case, and the accessor has two real consumers.

## Self-Check: PASSED

Files claimed modified — verified present and changed:

- `FOUND: scripts/check-banned-claims.ts`
- `FOUND: scripts/check-banned-claims.js`
- `FOUND: scripts/check-banned-claims.test.ts`
- `FOUND: scripts/check-public-docs-vocabulary.ts`
- `FOUND: scripts/check-public-docs-vocabulary.js`
- `FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-49-SUMMARY.md`

Commits claimed — verified in `git log`:

- `FOUND: 12dfefa` — `docs(29-49): delete the false residual block at the sole carve-out's declaration`
- `FOUND: c6f19c5` — `fix(29-49): one read of the exemption document, gated on the read having succeeded`
- `FOUND: 3425b72` — `fix(29-49): report the imported corpus's derivation refusals from the gate that is running`

Plan-level assertions re-verified at `3425b72`:

- `node scripts/check-banned-claims.js` → exit 0, PASS line byte-identical to the before-anchor
- `node scripts/check-public-docs-vocabulary.js` → exit 0
- `npm run build`, `npm run freshness`, `npx tsc --noEmit` → all exit 0
- `npx vitest run --exclude '**/scripts/e2e/**'` → 52 files, 2073 passed, 2 skipped
- `package.json` / `package-lock.json` → byte-unchanged
