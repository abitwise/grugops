---
phase: 29-controlled-language-voice-guard-rebuild
plan: 16
subsystem: diff-disposition-gate
tags: [LANG-03, WR-05, WR-06, WR-02, canonical-form, fence-authority, independent-denominator]
status: complete
requires:
  - "scripts/check-diff-disposition.ts — locateSection, the structural arm's satisfaction test, reportMeasured's call site (all three edited in place)"
  - "scripts/voice-model.ts CLAUSE_MIN_WORDS + normalizeSentence — the derivation the companion floor is built from"
  - "scripts/frontmatter.ts fencedLineFlags — the single fence toggle, consumed rather than reimplemented"
  - "docs/audit/29-style-dispositions/00-base.md — the recorded base, byte-unchanged by this plan"
provides:
  - "COMPANION_MIN_WORDS — the canonical filled form's length floor, DERIVED as 2 * CLAUSE_MIN_WORDS"
  - "isCompanionFilled — the whole companion-cell predicate, allow-list shaped, consulting no denylist"
  - "locateSection — both scans now decided by the one fence authority"
  - "a file-grain measured report whose expected and visited come from different code paths"
  - "a set-level refusal naming every changed watched file that yielded no clause, in both directions"
  - "MirrorSpec.baseCorpus — the harness can put a fixture in the BASE commit, so a plant can be a one-line reword"
affects:
  - "guard_diff_disposition — the structural arm, every frozen region's extent, and the published PASS line's element grain"
  - "scripts/check-foundation-guards.test.ts — the D-64 parser-consumer pin gains a seventh member"
  - "plans 29-17..29-19 — every kit change from here is judged against the canonical companion form"
tech-stack:
  added: []
  patterns:
    - "Declare the canonical FILLED form and refuse its complement; never enumerate the bad spellings"
    - "Derive a threshold from an existing authority (2 * CLAUSE_MIN_WORDS) rather than typing a number"
    - "One format-aware authority per predicate — consume the toggle, never re-declare the delimiter class"
    - "A denominator's two sides must come from different code paths, or the floor is documentation"
    - "A set-level mismatch NAMES its members in both directions; a bare count is unactionable"
    - "Assert the mutation run's own build exit code — a failed build reports the fix's green"
decisions:
  - "D-16-A: a companion cell is FILLED only by clearing a word floor; no spelling is enumerated in the gate"
  - "D-16-B: the floor is DERIVED as 2 * CLAUSE_MIN_WORDS — the cell names the section AND the reason, two clauses"
  - "D-16-C: UNFILLED deleted, not left live as a weaker second opinion beside the canonical form"
  - "D-16-D: locateSection takes NO opt-out parameter — an opt-out is a second grammar with extra steps"
  - "D-16-E: the published element grain moves from the clause to the changed watched FILE, and the label says so"
  - "D-16-F: the clean-tree arm, the total-zero-clause refusal and the short-denominator refusal stay three distinct answers"
metrics:
  duration: 42m
  completed: 2026-08-15
actuals:
  tokens: 88000
  tasks: 3
  commits: 6
---

# Phase 29 Plan 16: Canonical Companion Form, Fence-Aware Extent, Independent Denominator Summary

`guard_diff_disposition`'s last live arm now refuses a placeholder by construction rather than by
having thought of it, its frozen regions are bounded by the one fence authority instead of a second
grammar, and its published denominator is derived by a code path the loop does not own.

## The three defects, and why they are one failure at three altitudes

| ID | Altitude | The defect | Direction |
|---|---|---|---|
| WR-05 | a predicate | membership decided by EXCLUDING one bad value (`!== "" && !== UNFILLED`) | fail-open |
| WR-06 | a locator | an extent decided by a SECOND GRAMMAR over bytes `fencedLineFlags` already answers for | fail-open |
| WR-02 | a floor | a denominator whose two sides read the SAME object | the floor never fires |

---

## Task 1 — a companion cell is filled in ONE canonical form (WR-05)

### The RED transcript, against the pre-change committed build (commit `e21143b`, plan 29-15)

Thirteen placeholder spellings, each its own case so the transcript names exactly which bypassed:

```
 Test Files  1 failed (1)
      Tests  11 failed | 34 passed (45)
```

Per-case roster from that same run:

```
 ✓ refuses 'empty' as a companion cell for a frozen structural reword          404ms
 × refuses 'hyphen' ...                                                        464ms
 × refuses 'double hyphen' ...                                                 409ms
 × refuses 'en dash' ...                                                       489ms
 ✓ refuses 'em dash' ...                                                       475ms
 × refuses 'question mark' ...                                                 402ms
 × refuses 'n/a' ...                                                           423ms
 × refuses 'N/A' ...                                                           416ms
 × refuses 'na' ...                                                            436ms
 × refuses 'tbd' ...                                                           414ms
 × refuses 'TBD' ...                                                           400ms
 × refuses 'none' ...                                                          417ms
 × refuses 'todo' ...                                                          398ms
 ✓ accepts a companion cell carrying real prose — the false-red control        425ms
```

**Eleven of thirteen were live bypasses.** Only `empty` and the em dash were refused — precisely the
two values the deleted test excluded. The bypass, verbatim, from the `tbd` / `TBD` / `none` / `todo`
rows:

```
[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9; 181 frozen clause(s), 55 frozen region(s); base cc91556
        1 watched file(s) changed since cc91556; 2 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  PASS  diff disposition: 0 findings over 2/2 elements

== Result ==
ALL CHECKS PASSED
```

A reworded `## Hard limits` sentence, dispositioned with the cell `TBD`, admitted under a clean green.

### The fix — a canonical form, not a longer denylist

```ts
export const COMPANION_MIN_WORDS = 2 * CLAUSE_MIN_WORDS;   // = 8

export function isCompanionFilled(cell: string): boolean {
  const words = normalizeSentence(cell).split(" ").filter(Boolean);
  return words.length >= COMPANION_MIN_WORDS;
}
```

**The floor is DERIVED, not typed.** A companion cell's job, as the contract in `FROZEN_SOURCES`
states it, is to name the SECTION and the REASON — two things, so two clauses' worth of words at this
tree's own clause floor. If the tree's notion of a unit of prose ever moves, this moves with it.

**No rejected spelling appears in the gate.** That half of the code review's sketch was deliberately
dropped: a denylist of placeholder tokens is the enumerate-the-bad shape three separate eight-to-
twelve-round closures in this repository were spent deleting, and the thirteenth placeholder is the
one nobody thinks of. The spellings live in the test file, where they are WITNESSES that the
complement is refused rather than the list the predicate consults.

`UNFILLED` was **deleted**, not left live as a weaker second opinion.

### GREEN after

```
 Test Files  1 passed (1)
      Tests  49 passed (49)
```

### The live register, measured before the edit and re-derived after

```
CLAUSE_MIN_WORDS                                   : 4
COMPANION_MIN_WORDS                                : 8

structural intersections                           : 230
satisfied under the OLD predicate                  : 230
satisfied under the CANONICAL FORM                 : 230
unsatisfied                                        : 0   []
smallest accepted companion, per-intersection best : 20 normalized words

register rows 1532: placeholders 1324, filled 208, MIDDLE BAND 0
smallest filled cell across the whole register     : 12 normalized words
```

Every placeholder spelling normalizes to **at most one word** (`n/a` → `"n"`, `tbd` → `"tbd"`, every
dash and `?` → `""`). The floor of **8** sits strictly between that band and the smallest cell a human
actually wrote (**12**), and **zero** cells sit in between. Not one existing judgement is disturbed —
which is exactly what re-auditing 230 structural intersections would have cost.

The shortest accepted cell on an intersection, verbatim:

> ``FROZEN intersection. `## Hard limits` retains `Keep design just enough` byte-unchanged in the same commit and is now its only home.``

### Acceptance probes

```
UNFILLED, non-comment lines in .ts        : 0     (criterion: 0)
UNFILLED, committed .js                   : 1     (a COMMENT naming the deleted defect; the constant is gone)
"n/a"|"tbd"|"none"|"todo", non-comment .ts: 0     (criterion: 0)
node scripts/check-diff-disposition.js    : exit 0 on the clean tree
```

### Adversarial self-check — TWO mutations, because there are two places to weaken

A green suite is not proof for a safety guard.

**Mutation A — the CALL SITE reverted** to `r.companion !== "" && r.companion !== "—"`:

```
      Tests  12 failed | 37 passed (49)
```

The eleven bypass spellings plus the below-floor boundary case went red. `empty`, the em dash, the
prose control and the at-floor case stayed green — correct, since the old predicate agreed with the
new one on exactly those.

**Mutation B — the PREDICATE itself weakened** to `cell.trim() !== "" && cell.trim() !== "—"`:

```
      Tests  13 failed | 36 passed (49)
```

The same twelve plus the whitespace unit case. Both arms of the wiring are therefore load-bearing and
independently covered.

**Honest limit:** the live-register partition case stayed GREEN under both mutations. It is a
false-red CONTROL — it proves the fix disturbs no human judgement — and never a bypass detector. Said
here rather than counted as coverage it does not provide.

**Commits:** `95f7427` (RED), `018c49e` (fix + rebuilt `.js`).

---

## Task 2 — one fence authority decides where a frozen section ends (WR-06)

### The fixture that first went red FOR THE WRONG REASON

The first version of this case quoted `## Commit` inside the fenced example. It exited 1 against the
**pre-change** build and looked like a reproduction. It was not:

```
## Stop conditions  ->  {"from":6,"to":9}     (truncated at the fenced heading, as expected)
## Commit           ->  {"from":10,"to":14}   (MATCHED THE QUOTED LINE, and its region swallowed line 13)
BELOW is at line 13
```

The sentence was inside a region either way, so the truncation was never exercised. Quoting a
**non-anchor** heading (`## Example output`) leaves it inside NO region before the fix and inside
`## Stop conditions` after it — which is the difference the case is about. The trap and its reason are
recorded in source so it is not reintroduced; quoting an anchor is now covered separately, on its own
terms.

### The RED transcript, against the pre-change build

```
 × a fenced `## ` line does not end the section — the region runs to the next UNFENCED heading   3ms
 × a FROZEN ANCHOR quoted inside a fence is not matched as the section's own heading             1ms
 × REDs a reword below a fenced heading, still inside the frozen region, with no filled companion 414ms
 ✓ GREENs the same reword once the row carries a filled companion — the false-red control       430ms
 ✓ every frozen region on the LIVE corpus ends at an UNFENCED heading or at EOF                   5ms
      Tests  3 failed | 51 passed (54)
```

The gate-level bypass, verbatim:

```
[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9; 180 frozen clause(s), 55 frozen region(s); base b642f4b
        1 watched file(s) changed since b642f4b; 2 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  PASS  diff disposition: 0 findings over 2/2 elements

== Result ==
ALL CHECKS PASSED
```

### The fix

Both scans routed through the imported `fencedLineFlags`: the heading match must be on an unfenced
line, and the end scan stops only at an unfenced one. `FENCE_DELIMITER_LINE` is **not** consulted here
— the toggle is the only interface — and there is **no parameter** that lets a caller ask for the old
behaviour, because an opt-out is a second grammar with extra steps.

Source names the asymmetry the plan asked for: **a truncated frozen region here SHRINKS what is
protected with no failure anywhere — fail-open, and invisible by construction.** The equivalent
truncation in the banned-claim exemption locator causes MORE to be checked, which is fail-closed and
surfaces as a red somebody investigates. The two are not interchangeable.

### The planted fixture's numbers

The quoted heading sits at line 10, the reworded sentence at line 13, the next real heading at line 15.

| | `## Stop conditions` region | line 13 |
|---|---|---|
| before | `{from: 6, to: 9}` | OUTSIDE |
| after | `{from: 6, to: 14}` | INSIDE |

`to` (14) is asserted as a NUMBER strictly greater than the fenced heading's line (10), and equal to
`nextRealHeadingLine - 1`. The reword with no filled companion exits **1**; the same reword with a
filled companion exits **0**.

### The live corpus is untouched, proven rather than asserted

```
regions: 55   frozen clauses: 416
extent-list sha256 BEFORE : 0f5c038face74defcd14ae58864e08515ec510318e45836e2d08bb8f2b1bd2cd
extent-list sha256 AFTER  : 0f5c038face74defcd14ae58864e08515ec510318e45836e2d08bb8f2b1bd2cd
diff regions-before.txt regions-after.txt  ->  IDENTICAL (0 lines differ)
```

All 55 `file|heading|from|to` tuples are byte-identical. The gate's `frozen region(s)` figure is
unchanged from **55**, and the frozen-clause count from **416**.

**Fenced `## ` lines re-derived at execution time:**

```
watched corpus (40 markdown files)          : 0
roles + workflows (36 files locateSection scans) : 0
```

The planner measured 0; confirmed. This is exactly why the proof is planted — a corpus-derived proof
would prove nothing.

### Acceptance probes

```
grep -c 'fencedLineFlags' scripts/check-diff-disposition.ts        : 4    (criterion: >= 2)
FENCE_DELIMITER_LINE, non-comment lines in .ts                     : 0    (criterion: 0)
node scripts/check-diff-disposition.js                             : exit 0, 1.80s
```

### Adversarial self-check — and a FALSE GREEN caught in the act

The first mutation run reported:

```
      Tests  54 passed (54)
```

**That was a false green.** The mutation left `fenced` unused, `tsc` failed with
`TS6133: 'fenced' is declared but its value is never read`, the `&&` short-circuited, and the suite
ran against the UNMUTATED committed `.js` — reporting the fix's own green as the mutant's. It was
caught only because the build's exit code was checked. This is the recorded lesson landing again:
**assert the verification harness's own premise.** Every later mutation run in this plan prints its
build exit code beside the result.

With the mutation actually built:

```
 × a fenced `## ` line does not end the section — the region runs to the next UNFENCED heading
 × a FROZEN ANCHOR quoted inside a fence is not matched as the section's own heading
 × REDs a reword below a fenced heading, still inside the frozen region, with no filled companion
      Tests  3 failed | 51 passed (54)
```

**Per-arm mutations**, because a predicate split into two arms must have its arms tested separately
and their union checked:

| Mutation | Cases red |
|---|---|
| heading-match fence check removed, end-scan kept | `a FROZEN ANCHOR quoted inside a fence is not matched…` |
| end-scan fence check removed, heading-match kept | `a fenced `## ` line does not end the section…` + `REDs a reword below a fenced heading…` |
| both removed | all three |

Disjoint and covering. Both arms are independently load-bearing; neither is decorative.

**Commits:** `e426d0a` (RED + `MirrorSpec.baseCorpus`), `1e19b8d` (fix + rebuilt `.js`).

---

## Task 3 — an independent denominator, a named short-set refusal (WR-02)

### The defect

```ts
let visited = 0;
for (const c of changed.clauses) { visited += 1; /* … */ }
const measured = { visited, expected: changed.clauses.length, … };
```

Both sides read the same object. `visited !== expected` could not fire under any input, so
`vacuity.ts`'s second branch — the one that exists to make a silently NARROWED check visible — was
dead code with a comment explaining what it was for. **A vacuity floor catches an EMPTY denominator
and never a SILENTLY SHORT one.**

### The fix

| | derived from |
|---|---|
| `expected` = `changed.changedFiles.length` | the per-file diff's emptiness test on each file's own `git diff` output |
| `visited` = `clauseBearingFiles.size` | hunk parsing plus clause segmentation over the clause set |

Different code paths, so a file that changed and yielded nothing moves them apart. The label names the
element — `diff disposition — changed watched file(s)` — and the detail line above still reports the
clause and disposition-row counts unchanged.

Above the report, a **set-level refusal in BOTH directions**: files that changed and yielded no
clause, and files that yielded a clause without appearing in the changed set. The second is
structurally impossible today and is asserted anyway, because the direction that cannot happen is the
one nobody notices when a refactor makes it possible.

The clean-tree arm and the total-zero-clause refusal are byte-unchanged, and source now states why all
three answers stay distinct — no elements to visit, versus a loop that produced nothing at all, versus
a loop that covered less than the diff.

### The planted failure, verbatim against the committed build

Two watched files change; one yields a clause, one yields none:

```
[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9; 180 frozen clause(s), 55 frozen region(s); base 12d14a1
        carriers: 1 change set(s) between 12d14a1 and the working tree, of which 1 touched a watched file and had their clauses derived; the uncommitted working tree is NOT a carrier
  FAIL  the changed-file set and the clause-bearing-file set are not equal, so the element count published below covers less than the diff does
        changed since 12d14a1 and yielded NO clause (1): agent-factory/roles/agents-md-scribe.md — each of these files differs from the base and contributed nothing to the left-hand side, so no verdict was reported over its change
        2 watched file(s) changed since 12d14a1; 1 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  FAIL  diff disposition — changed watched file(s): visited 1 of 2 elements — the scan set is short, so the result covers less than it claims

== Result ==
2 CHECK(S) FAILED
EXIT=1
```

The file is **named**, not merely counted. Under the old shape this same tree printed
`PASS diff disposition: 0 findings over 1/1 elements` and `ALL CHECKS PASSED` — recorded verbatim
during the reproduction.

### The unmodified control

The identical mirror with the clauseless plant removed exits **0** and prints
`diff disposition — changed watched file(s): 0 findings over 1/1 elements`. One variable isolated.

### Acceptance probes

```
expected: changed.clauses.length, non-comment lines in .ts : 0     (criterion: 0)
```

A third case asserts the property directly rather than only through its symptom: a source read
confirms `expected: changed.changedFiles.length` and `visited: clauseBearingFiles.size` are present
and `expected: changed.clauses.length` is absent from executable source.

### Adversarial self-check

Mutation restoring the tautological denominator and disabling the set refusal, **build exit code 0**:

```
 × REDs a changed watched file that yielded NO clause, naming the file
 × the denominator's two sides are derived by DIFFERENT paths, not from one object
      Tests  2 failed | 55 passed (57)
```

The false-red control stayed green — correct, since a one-file/one-clause tree reads `1/1` either way.

**Commit:** `3e26438`.

---

## The gate's published numbers, live tree

```
watched corpus: 40 markdown file(s) of the 41-entry LANG-03 safety-surface union
frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17,
            workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19,
            positive guard literals 9/9; 416 frozen clause(s), 55 frozen region(s); base 4d2b8f0
carriers: 49 change set(s) …, of which 9 touched a watched file …; the uncommitted working tree IS a carrier
37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s) derived; 1532 disposition row(s) across 8 file(s)
  PASS  diff disposition — changed watched file(s): 0 findings over 37/37 elements

== Result ==
ALL CHECKS PASSED
```

**37 of 37** changed watched files yield at least one clause. Against 29-15's recorded 37 / 1880 /
1532, the detail line is byte-identical: this plan moves the element grain, not the facts.

## Four gates and the regression floor

```
check-foundation-guards.js   exit=0  (0.13s)
check-imperative-lexicon.js  exit=0  (0.06s)
check-banned-claims.js       exit=0  (0.05s)
check-diff-disposition.js    exit=0  (1.87s)

$ npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  51 passed (51)
      Tests  1769 passed | 2 skipped (1771)
   Duration  117.57s
REGRESSION_EXIT=0

$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.   exit 0
$ npm run typecheck                                                            exit 0
```

Against 29-15's baseline of **51 files / 1743 passed / 2 skipped**: files unchanged, passed **+26** —
exactly the twenty-six new cases (eighteen for WR-05, five for WR-06, three for WR-02), skips
unchanged. No test was removed or weakened. The plan's floor was 51 / 1725 / 2. **The bare `npm test`
script was never invoked**; every run used `--exclude '**/scripts/e2e/**'` or a single named file.

A second `npm run build` left `git status --porcelain` unchanged.

## Scope and cleanliness

```
$ git diff --stat e21143b..HEAD          # 29-15 closed at e21143b
 scripts/check-diff-disposition.js       | 193 +++++++++++-
 scripts/check-diff-disposition.test.ts  | 500 +++++++++++++++++++++++++++++++-
 scripts/check-diff-disposition.ts       | 206 ++++++++++++-
 scripts/check-foundation-guards.test.ts |  14 +
 4 files changed, 881 insertions(+), 32 deletions(-)

$ git diff -- docs/audit/29-style-dispositions/00-base.md
(empty — 0 lines; the recorded base did not move)

$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
```

The three files the plan names, one documented deviation file, and exactly the three pre-existing
out-of-scope entries. **No plant residue** — every reproduction lived in a temp-dir mirror, so the
live tree was never planted into.

**The watched corpus contains ZERO `scripts/` paths**, which is why this plan's own source edits
produce no changed clause and need no disposition row. Re-derived at execution, not assumed.

## Deviations from Plan

### 1. [Rule 3 — blocking issue caused by this plan] `scripts/check-foundation-guards.test.ts`, outside `files_modified`

- **Found during:** Task 3's regression floor.
- **Issue:** the D-64 cutover pin asserts the exact list of non-test consumers of `./frontmatter.js`.
  WR-06 makes `check-diff-disposition.ts` a consumer, so the pin went red:
  `expected [ 'canonical-frontmatter.ts', …(6) ] to deeply equal [ …(5) ]`.
- **This is the pin working, not a false red.** Its whole purpose is that the consumer set changes
  only deliberately and with a recorded reason. The addition is in the demotion's own direction —
  ONE symbol, the per-line fence PROJECTION, and no verdict-bearing symbol — exactly the shape
  `voice-model.ts` (29-01) and `check-imperative-lexicon.ts` (29-03) were admitted under.
- **Fix:** the member added with its reason in the file's own voice, plus a NEW per-symbol assertion
  so this consumer cannot later widen to the delimiter class and re-decide what a fence is. The
  derived fence-machine set in `scripts/frontmatter.test.ts` is still **THREE**.
- **Commit:** `cb868a3`.

### 2. [Rule 1 — fixture bug] The WR-06 case first went RED for the WRONG REASON

Quoting `## Commit` made the fence-blind locator match the QUOTED heading and report a mislocated
`## Commit` region that swallowed the sentence below the fence — so the case exited 1 against the
pre-change build while proving the opposite of its claim. Diagnosed by running `locateSection` over
the fixture directly, fixed by quoting a non-anchor heading, and the trap recorded in source with a
premise assertion pinning the sentence between the fenced heading and the next real one. Quoting an
anchor is now a separate case on its own terms.

### 3. [Rule 1 — harness bug] A mutation run reported a FALSE GREEN

`npm run build && npx vitest …` short-circuited on `TS6133`, so the suite ran against the unmutated
committed `.js` and reported `54 passed (54)` — the fix's own green presented as the mutant's. Caught
by checking the build's exit code. Every subsequent mutation run in this plan prints its build status
beside its result. Recorded because a mutation run that silently does not mutate is the same class of
defect as a gate that silently does not check.

### 4. [Process] `git checkout --` discarded uncommitted Task 3 source edits

Using `git checkout -- <file>` to restore after a mutation is correct only for work already committed.
Task 3's source edits were not yet committed when a mutation was reverted that way, and were lost.
Detected immediately (`grep -c clauseBearingFiles` → 0) and re-applied; Task 3 was then committed
BEFORE its mutation run. No product impact — recorded so the ordering is explicit for later plans:
commit, then mutate, then restore from the commit.

### 5. [Recorded, not a deviation] The published PASS line's wording changed

`diff disposition:` became `diff disposition — changed watched file(s):`. Six existing cases asserted
the old string; all six now assert one shared `MEASURED_LABEL` constant, so a seventh spelling cannot
drift in. The element grain of a published PASS line is a contract readers rely on, which is why the
plan rated this `costly` and why the change is stated here rather than left to be noticed.

## Honest ceilings

- **WR-05 proves a companion cell is PROSE, not that the prose is TRUE.** A cell of eight or more
  words that names the wrong section, or gives a reason that does not hold, satisfies the gate. This
  is the same class of residual 29-15 recorded for co-change versus semantic correspondence, and the
  same one the module's header states for dispositions generally: structure is checkable where meaning
  is not. The floor raises the cost of a bogus companion from one keystroke to a sentence; it does not
  make one impossible.
- **The live-register partition case is a control, not a detector.** It stayed green under both WR-05
  mutations. It proves no human judgement moved; it proves nothing about the predicate's strength.
- **WR-06 is fixed for THIS gate's locator only.** The review names three locators in the tree that
  decide a section end with a bare heading scan. This plan closes the one whose direction is
  fail-open; the other two are 29-18's scope and are not claimed here.
- **The new denominator counts FILES, so a file that yields one clause out of fifty still reads as
  fully visited.** It is strictly stronger than a tautology and strictly weaker than a per-clause
  independent count, which would need a second clause derivation to compare against. Stated rather
  than implied by the `37/37`.

## Threat register — dispositions honoured

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-29-50 | mitigate | One canonical filled form, no denylist (0 rejected spellings in executable source); boundary asserted from both sides; 230/230 live intersections still accepted; two independent mutations prove discrimination |
| T-29-51 | mitigate | Extent decided through the single toggle, `FENCE_DELIMITER_LINE` count 0, no opt-out parameter; fail-open direction named in source; planted fenced heading proves no truncation; all 55 live extents byte-identical by sha256 |
| T-29-52 | mitigate | `expected` from the per-file diff, `visited` from the clause derivation, asserted by source read; set-level refusal names files in both directions; planted case exits 1 naming the file |
| T-29-53 | mitigate | Flags computed once per located text, one anchored delimiter test per line, no match-all regex and no nested quantifier. Gate wall clock 1.87s against 29-15's 1.67s |
| T-29-54 | mitigate | `npm run build` in the same task as every source edit, `.js` committed with `.ts`, freshness 48/48, second build idempotent |
| T-29-SC | accept | Zero packages installed; `package.json` untouched and not in `files_modified` |

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced. No test was
skipped and every `<verify>` in the plan was run.

## Threat Flags

None. This plan adds no network endpoint, auth path or schema at a trust boundary. It adds one
read-only module import (`fencedLineFlags`) and no new I/O of any kind.

## Verification Against the Plan

| Plan verification item | Result |
|---|---|
| Twelve placeholder spellings each refused; none a literal in executable source | PASS — thirteen tested, 11 recorded as pre-change bypasses; grep count 0 |
| Real prose still accepted; all 230 live structural intersections stay satisfied | PASS — 230/230, control green before and after |
| A fenced heading no longer truncates the region; live extents unchanged | PASS — planted `to` 9 → 14; all 55 extents byte-identical (sha `0f5c038f…`) |
| A changed watched file yielding no clause fails the denominator and is named | PASS — transcript recorded, exit 1, file named |
| All four gates exit 0; regression, typecheck and freshness exit 0 | PASS — 0/0/0/0; 51 files / 1769 passed / 2 skipped; 48/48 fresh |
| `git diff --stat` names only the plan's files | PARTIAL — plus `check-foundation-guards.test.ts`, documented as deviation 1 |

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — WR-05 RED | `95f7427` | `scripts/check-diff-disposition.test.ts` |
| 1 — WR-05 fix | `018c49e` | `scripts/check-diff-disposition.ts`, `.js`, `.test.ts` |
| 2 — WR-06 RED | `e426d0a` | `scripts/check-diff-disposition.test.ts` |
| 2 — WR-06 fix | `1e19b8d` | `scripts/check-diff-disposition.ts`, `.js` |
| 3 — WR-02 fix | `3e26438` | `scripts/check-diff-disposition.ts`, `.js`, `.test.ts` |
| 3 — consumer pin | `cb868a3` | `scripts/check-foundation-guards.test.ts` |

## Self-Check

- `scripts/check-diff-disposition.ts` — FOUND (`COMPANION_MIN_WORDS`, `isCompanionFilled`,
  `clauseBearingFiles`, `fencedLineFlags` all present; `UNFILLED` 0 non-comment)
- `scripts/check-diff-disposition.js` — FOUND (rebuilt, freshness 48/48)
- `scripts/check-diff-disposition.test.ts` — FOUND (57 tests, 26 new)
- `scripts/check-foundation-guards.test.ts` — FOUND (173 tests)
- commits `95f7427`, `018c49e`, `e426d0a`, `1e19b8d`, `3e26438`, `cb868a3` — all FOUND

## Self-Check: PASSED
