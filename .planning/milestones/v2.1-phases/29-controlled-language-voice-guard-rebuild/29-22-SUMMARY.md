---
phase: 29-controlled-language-voice-guard-rebuild
plan: 22
subsystem: tooling / audit gates
tags: [LANG-03, LANG-07, WR-03, WR-08, IN-01, IN-02, section-locator, fence-authority]
requires:
  - "scripts/frontmatter.ts — fencedLineFlags, unfencedHeadingIndex, sectionEndIndex (plan 29-20's one authority)"
  - "scripts/kit-model.ts — listRoles, listWorkflows, ROLE_COUNT, WORKFLOW_COUNT (the corpus, derived)"
  - "scripts/generate-safety-surface.ts — safetySurfaceUnion (the watched corpus, derived)"
provides:
  - "scripts/check-diff-disposition.ts :: locateSection — delegating, zero private predicates"
  - "scripts/check-diff-disposition.ts :: readDispositionRows — bounded, fence-aware, malformed rows NAMED"
  - "scripts/check-diff-disposition.test.ts :: a DERIVED section-extent locator-site enumeration over the module's own source"
affects:
  - "scripts/check-foundation-guards.test.ts (this module's frontmatter consumer-symbol pin moves from one symbol to three)"
tech-stack:
  added: []
  patterns:
    - "derive the SITE SET from the module, never from the review's addresses — a hand-listed defect list rots like any other hand-listed set"
    - "a site string must carry no index that renumbers, or the removal probe measures a relabelling instead of a lost member"
    - "state the DIRECTION of each locator in source: fail-open and fail-closed siblings are not one bug at two addresses"
    - "prove a widening behaviour-preserving by comparing against the deleted predicate restated as an INPUT, with a paired case proving the comparison can fail"
decisions:
  - "The derivation classifier carries THREE constructs, not the two the review and the plan name — the two-construct sketch is blind to `readDispositionRows`, the very locator this plan exists to close (D-26)."
  - "The level-one corpus assertion is scoped to headings BELOW a `## ` section, not to every line after the first: the plan's literal predicate is false on the live corpus by 37 members."
  - "`readDispositionRows` consumes `fencedLineFlags` DIRECTLY as well as the two locators — skipping a quoted example row is a per-LINE question, not a section-extent one."
  - "The frontmatter consumer-symbol pin moved in Task 2's commit rather than Task 3's, so no commit in this plan leaves the suite red."
metrics:
  duration: 35m
  completed: 2026-08-15
actuals:
  tokens: 17000
  tasks: 3
  commits: 3
status: complete
---

# Phase 29 Plan 22: The Fourth Locator, Derived Rather Than Transcribed Summary

`check-diff-disposition.ts` now declares no section predicate of its own — proven by a mechanical
derivation over its own source rather than by reading — and the fourth locator of the class, the one
round 1 never derived and therefore never fixed, is bounded, fence-aware and reproduced live as an
exit-0 bypass before the fix.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Derive the locator site set, then RED-plant every site it names | `931a466` | check-diff-disposition.test.ts |
| 2 | Both locators consume the shared authority; the private predicates are deleted | `172e5bd` | check-diff-disposition.ts/.js/.test.ts, check-foundation-guards.test.ts |
| 3 | Prove the level widening safe by measurement, with its own falsifiability floor | `6d27718` | check-diff-disposition.test.ts |

## The Derived Locator-Site List, Verbatim

Produced by running the classifier over `scripts/check-diff-disposition.ts` at commit `931a466`,
before any fix. The list is **derived, not transcribed** — the plan's own instruction, because round
1 fixed three sites somebody had written down and left a fourth nobody had enumerated.

```
locateSection :: if (lines[i].trimEnd() !== heading) continue;
locateSection :: if (!fenced[j] && lines[j].startsWith("## ")) {
readDispositionRows :: const at = body.indexOf(DISPOSITION_HEADING);
count: 3
```

After the rewire, over the same module by the same classifier:

```
count: 0
```

The classifier's three constructs, each with a heading-shaped operand (an identifier carrying
`heading`/`HEADING`/`anchor`/`ANCHOR`, or a string literal opening with ATX hashes and a space):

| # | Construct | Shape it catches |
|---|---|---|
| 0 | `(?:===\|!==)\s*H` / `H\s*(?:===\|!==)` | LOCATE by whole-line equality |
| 1 | `\.(?:indexOf\|lastIndexOf\|search)\(\s*H` | LOCATE by substring or offset search |
| 2 | `\.startsWith\(\s*["'`]#{1,6} ` / `/\^#\{?[\d,]*\}?[ \\]` | CLOSE by heading PREFIX |

Comment lines are blanked before classification with positions preserved, for the reason the
fence-machine scan already gives: the property is about CODE, and this module DESCRIBES every one of
these constructs at length in the comment blocks recording why they were deleted.

## HEAD RED Transcripts, Verbatim

Six planted cases failed at HEAD, one per shape the derivation named. Every received value is
recorded.

### The live BYPASS — a fenced example row satisfies the structural companion arm

The reproduction that matters. A role's `## Hard limits` sentence is reworded and the ONLY row that
matches it lives inside a fenced example. At HEAD the gate **exits 0**:

```
 FAIL  scripts/check-diff-disposition.test.ts > … > the live BYPASS end-to-end — a FENCED example row satisfies the structural companion arm
AssertionError: expected '\n[guard_diff_disposition] every clau…' not to contain 'ALL CHECKS PASSED'

+ [guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
+         frozen set: … 181 frozen clause(s), 55 frozen region(s); base cd616a9
+         2 watched file(s) changed since cd616a9; 3 changed clause(s) derived; 2 disposition row(s) across 1 file(s)
+   PASS  diff disposition — changed watched file(s): 0 findings over 2/2 elements
+
+ == Result ==
  ALL CHECKS PASSED
```

Note the published `2 disposition row(s)`: the fenced row was counted as a real one. A row is what
satisfies the structural companion arm, and that arm carries the whole positional freeze.

### The three unit shapes at `readDispositionRows`

```
 FAIL  … > a FENCED seven-column example under `## Dispositions` donates no row
AssertionError: expected [ { …(8) }, { …(8) } ] to have a length of 1 but got 2

 FAIL  … > a seven-column table under a LATER `## ` heading donates no row
AssertionError: expected [ { …(8) }, { …(8) } ] to have a length of 1 but got 2

 FAIL  … > a FENCED occurrence of `## Dispositions` is not taken as the real heading
AssertionError: expected [ { …(8) }, { …(8) } ] to have a length of 1 but got 2
```

### IN-01 — the dropped row is silent

```
 FAIL  … > IN-01 — a row whose `before` cell carries a code span with a pipe is NAMED, not silently dropped
AssertionError: expected [] to have a length of 1 but got +0
```

Two well-formed rows parse, so the zero-row refusal never fires and the malformed line vanishes with
no trace at all.

### `locateSection` and the level-one close

```
 FAIL  … > `## Hard limits` ends at the `# ` heading, not at the `## ` heading below it
AssertionError: expected 15 to be 12 // Object.is equality
```

### The consumer-symbol pin, which went red the moment the import landed

```
 FAIL  scripts/check-foundation-guards.test.ts > … > the parser's non-test consumer list is NON-EMPTY and unchanged in size
AssertionError: check-diff-disposition.ts must take the per-line fence PROJECTION and nothing else …:
expected [ 'fencedLineFlags', …(2) ] to deeply equal [ 'fencedLineFlags' ]

  [
    "fencedLineFlags",
+   "sectionEndIndex",
+   "unfencedHeadingIndex",
  ]
```

## The Level-One Measurement, and the Plan's Version of It That Is False

The widening from a level-two-only close to a level-at-most-two close makes a frozen region END
EARLIER, which SHRINKS what is protected — the fail-open direction, invisible in a green run. Two
independent measurements, both now assertions:

**(a) The direct comparison.** The deleted level-two-only close is restated in the test as a
reference INPUT and run beside the widened close over every located frozen region:

| Measurement | Value |
|---|---|
| frozen regions located on the live corpus | **55** (17 roles + 2 × 19 workflows) |
| regions where the two closes disagree | **0** |

A paired case proves the comparison **can** produce a disagreement, on a planted body carrying an
unfenced `# ` heading — without it, "zero disagreements" is indistinguishable from a comparison that
cannot fail.

**(b) The corpus property.** Every level-one heading line below its file's first unfenced `## `
heading, over all 40 watched markdown files:

| File | Lines | Fenced |
|---|---|---|
| `agent-factory/README.md` | 105, 109, 113, 116, 119, 122, 125, 128, 131 | all 9 |

**Nine members, every one fenced.** Asserted non-empty first, so a scan that found nothing cannot
report "all fenced". The widening is safe on this corpus ONLY because the authority is fence-aware,
and that dependency is stated at the declaration in source.

## Gate Numbers, Before and After

| Measurement | Before (`3924115`) | After (`6d27718`) |
|---|---|---|
| watched corpus | 40 markdown of a 41-entry union, covering 36/36 derived kit files | identical |
| changed watched files | 37 since `4d2b8f0` | 37 since `4d2b8f0` |
| changed clauses derived | 1880 | 1880 |
| disposition rows | 1532 across 8 files | 1532 across 8 files |
| verdict | 0 findings over 37/37 elements | 0 findings over 37/37 elements |
| frozen set | 42/42, 17/17, 19/19, 19/19, 9/9; 416 clauses, 55 regions | identical |
| `check-foundation-guards` / `check-imperative-lexicon` / `check-banned-claims` | exit 0 | exit 0 |
| `check-audit-register` / `check-claim-anchors` | exit 0 | exit 0 |
| `npm run freshness` | 48 committed `.js` fresh | 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 | exit 0 |

**Not one of the five published numbers moved.** The only movement anywhere in the transcript is the
carrier count, 83 → 84, which is this plan's own first commit and is not one of the five. The live
verdict is byte-unmoved; the proof of this fix is a planted input, never a moved number.

Full regression: `npx vitest run --exclude '**/scripts/e2e/**'` → **51 files, 1838 passed, 2 skipped**
(both skips pre-existing).

## Mutation Proof — Nine Runs, Each With Its Own Premise Asserted

The harness rebuilds and refuses to report unless the committed `.js` **hash actually moved** and
`tsc` accepted the mutation — the guard 29-20's harness lacked. One mutation is a CORPUS plant
rather than a code edit, because the corpus property has no code axis to break.

| Mutation | Premise | Cases that failed |
|---|---|---|
| M1 fence skip deleted from the row loop | artifact moved, tsc ok | fenced example, the end-to-end bypass (2) |
| M2 bound restored to EOF (first form) | **PREMISE FAILED** — `end` became unused, tsc rejected it, artifact did not move | — |
| M2b bound restored to EOF (both symbols kept live) | artifact moved, tsc ok | table under a later heading (1) |
| M3 heading located by substring search again | artifact moved, tsc ok | fenced heading occurrence (1) |
| M4 IN-01 refusal deleted | artifact moved, tsc ok | the malformed-row case (1) |
| M5 close narrowed to level ONE only | artifact moved, tsc ok | 15, including the 55-region comparison |
| M5b close narrowed back to the DELETED level-two-only scan | artifact moved, tsc ok | the level-one unit case, the falsifiability case (2) |
| M6 a PRIVATE heading equality re-declared beside the authority | artifact moved, tsc ok | the fenced-anchor case, **the derived-site enumeration** (2) |
| M7 CORPUS: an unfenced `# ` planted below a `## ` in `orchestrator.md` | plant landed at line 12 | the level-one corpus case (1) |

M2's failure is recorded rather than dropped: the harness caught its own bad mutation instead of
reporting a green for a build that never happened. M5b is the one that matters for the widening — it
un-widens the close and the unit case reds, while the 55-region comparison correctly stays green
because on this corpus the two answers agree. That is why the comparison needs its own falsifiability
case, and why that case is the one M5b also reds.

Every pinned axis is owned by at least one case that fails when that axis breaks.

## Post-Fix Refusal Text, Verbatim (IN-01)

```
1 line(s) under `## Dispositions` in docs/audit/29-style-dispositions/29-99.md begin with a pipe
and do NOT split to 7 cells, so they are not read as rows —
docs/audit/29-style-dispositions/29-99.md:8 splits to 8 cell(s) — | agent-factory/roles/c.md | 11 |
the `a | b` alternation | after three | WP-03 | Reworded under the profile. | companion |.
The most likely cause is a code span carrying a pipe in the `before` or `after` cell: an inline
`a | b` splits the row an extra time. Escape it as `\|` or reword the cell. This is reported by
NAME because the alternative is silence: the clause the line covers then reads as undispositioned
and names the wrong cause
```

Measured over the live register before adopting it as a hard refusal: **zero** malformed lines
across all 1532 rows in 8 files, so the new refusal has an empty input set on the shipped tree.

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] The plan's own classifier cannot find the locator the plan is about

- **Found during:** Task 1, at classifier design, before anything was planted.
- **Specified mechanism:** 29-22-PLAN.md and the round-2 review both describe the derivation as
  deriving "a heading-equality test against a heading constant, **and** a heading-prefix test used to
  terminate a scan" — two constructs, and nothing else.
- **Why it cannot discriminate the attack it names:** `readDispositionRows` uses NEITHER. It locates
  its section with `body.indexOf(DISPOSITION_HEADING)` — a substring search. A derivation built to
  the sketch re-derives exactly the two `locateSection` sites round 1 already knew about and
  re-misses the fourth locator, **inside the fix written to stop that happening**.
- **Resolution:** a third construct — LOCATE by substring or offset search against a heading operand.
- **Proven, not argued:** a case runs the classifier with exactly the plan's two constructs and
  asserts the search locator is absent from the answer while the other two remain, and asserts the
  difference is that ONE site rather than a general narrowing. Measured on the live module at
  `931a466` the full classifier returned 3 sites and the sketch returned 2. The property is now
  pinned on the planted fixture instead of the live module, because the live module derives nothing
  at all after the fix and a case asserting "the sketch found nothing" over a source that carries
  nothing would be exactly the vacuous green this phase keeps meeting.

### 2. [Rule 1 — the plan asserts a fact its own task text falsifies] The level-one corpus assertion as specified is FALSE by 37 members

- **Found during:** Task 3 measurement, taken before the case was written.
- **Truth affected:** *"the only level-one heading lines in the watched corpus after line one are
  `README.md` lines 17 and 19 and `agent-factory/README.md` lines 105 onward, and `fencedLineFlags`
  reports every one of them as fenced."*
- **Measured:** **48** level-one heading lines after line one, of which **37 are UNFENCED**. Every one
  of the 37 is line 6 of a role or workflow — the `# Role: …` / `# Workflow: …` title. The plan's
  literal assertion would have gone red on the shipped tree naming 37 members.
- **Why the plan is not simply wrong, and what was implemented instead:** the plan's own Task 3 text
  gives the correct reason in the next breath — "roles and workflows carry their `# Role: ` and
  `# Workflow: ` heading at line 6, before any level-two section, so none of them can close one". The
  must-have and the task text disagree; the task text is right. The property that expresses the
  safety is therefore **"every level-one heading BELOW its file's first unfenced `## ` heading is
  fenced"**, which is 9 members, all fenced, all in `agent-factory/README.md`. That set is asserted
  non-empty before the fenced property, and the discarded predicate is recorded at the case with its
  measured falsifying count so nobody re-derives it as a good idea.
- **And the tighter measurement was added beside it,** because a corpus floor is not the same claim
  as behaviour preservation: the deleted close is restated as an input and compared against the
  widened one over all 55 located regions, with zero disagreements and a paired case proving the
  comparison can fail.

### 3. [Rule 1 — bug in my own harness] The first draft of the site string made the removal probe a FALSE PROBE

- **Found during:** Task 1, at the first run, by reading the received value rather than the status.
- **Issue:** the derivation wrote `function :: construct[n] :: line` into each site string. Dropping
  construct `[0]` then renumbers `[1]` and `[2]`, so **every** site string changed and
  `expect(without).not.toEqual(base)` passed whether or not the removed construct had ever matched
  anything. A probe that cannot fail is the harness-premise failure class this project has now
  recorded nine times.
- **Fix:** the index is removed from the site string, and the probe asserts **which member vanished**
  — `expect(without).toEqual(base.filter((_, j) => j !== i))` — rather than only that the answer
  moved. The same bug produced a real red in the sketch-blindness case (`expected [ …(2) ] to deeply
  equal [ Array(1) ]`), which is how it surfaced.

### 4. The consumer-symbol pin moved in Task 2's commit, not Task 3's

The plan assigns the `check-foundation-guards.test.ts` pin move to Task 3. But Task 2's import is
what makes the pin red, so leaving it until Task 3 would have committed a tree with a failing suite.
The pin — and the full comment the plan specifies for it — landed in `172e5bd` alongside the import.
Task 3 confirms the two sibling equalities (`check-banned-claims.ts`, `check-imperative-lexicon.ts`)
and `voice-model.ts`'s are **byte-unchanged**, verified by `git diff 3924115 -- scripts/check-foundation-guards.test.ts`:
the only changed lines are this module's own entry and its comment. The same commit also moves the
derived-site pin in `check-diff-disposition.test.ts` from three members to zero, which is Task 2's
own acceptance criterion and could not be satisfied from a file Task 2's list did not name.

## What Was Deliberately Not Touched

Confirmed by `git diff`:

- `DISPOSITION_COLUMNS`, `DISPOSITION_NON_ROWS`, `rowMatches`, `normalizeSentence`,
  `isCompanionFilled`, `COMPANION_MIN_WORDS`, the frozen-source table and every refusal wording other
  than the one IN-01 adds. This is a locator change, not a semantics change, and mixing the two is
  how round 1 produced a fix that was itself incomplete.
- `scripts/frontmatter.ts` — the authority is consumed, never widened. No opt-out parameter was added
  and none exists.
- Every file in the LANG-03 watched corpus. **No disposition row is owed** under
  `docs/audit/29-style-dispositions/` for this plan, and none was invented.

## Residuals Named, Not Absorbed

- **The derivation is a floor, not a proof.** It cannot see a locator whose operand is named something
  other than heading/anchor and is not a literal, a heading recogniser assembled by concatenation or
  `new RegExp(...)`, a `slice(0, 3)`/`charAt` prefix form, or a locator written in a language the scan
  does not read. Disclosed at the classifier, in the shape `frontmatter.test.ts`'s fence-machine floor
  already uses.
- **The derivation is scoped to THIS MODULE.** Run tree-wide the same classifier is noisy — it matches
  `headingMatch === null`, `/^#\d+$/` and `heading === -1` — so a tree-wide pin would have needed
  tuning that this plan has no corpus measurement to justify. `scripts/audit-model.ts::tableUnder`
  carries a private section locator of exactly this class and is **out of scope here**; it is logged
  rather than fixed.
- **Two consumers still hold private section-end predicates** — `check-banned-claims.ts` and
  `check-imperative-lexicon.ts`. Plans 29-23 and 29-24 move each. Until they do, LANG-07 is not
  closed; this plan closes the consumer that carried the live fail-open bypass.
- **The malformed-row refusal names the plausible cause, it does not diagnose it.** A pipe-leading
  line under `## Dispositions` that splits to the wrong count could be a wrapped row or a different
  table entirely; the message says "most likely cause" rather than asserting one.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-22-SC` had an empty input set as predicted: no package-manager install occurred, `package.json`
is unchanged, and the existing harness case pinning `pkg.dependencies` undefined still passes.

## Self-Check: PASSED

- `scripts/check-diff-disposition.ts` — FOUND. `locateSection` is three lines and delegates; the
  derived section-extent site count over it is **0**.
- `scripts/check-diff-disposition.js` — FOUND, fresh (48 committed `.js` match a fresh rebuild).
- `scripts/check-diff-disposition.test.ts` — FOUND (12 new cases across three describe blocks).
- `scripts/check-foundation-guards.test.ts` — FOUND (this module's pin lists three symbols; the
  three sibling equalities byte-unchanged).
- commit `931a466` — FOUND
- commit `172e5bd` — FOUND
- commit `6d27718` — FOUND
