---
phase: 29-controlled-language-voice-guard-rebuild
plan: 17
subsystem: controlled-language-guards
tags: [LANG-02, LANG-04, CR-03, WR-02, WR-06, position-bug, independent-denominator, fence-authority]
status: complete
requires:
  - "scripts/check-imperative-lexicon.ts — LIST_MARKER, ORDERED_MARKER, the section anchor, deriveElements, both reportMeasured call sites, both table locators (all edited in place)"
  - "scripts/frontmatter.ts fencedLineFlags — the single fence toggle, consumed rather than reimplemented"
  - "scripts/vacuity.ts reportMeasured — the shared element-level rule whose second branch was dead at both call sites"
  - "scripts/voice-model.ts BANNED_CONSTRUCTIONS.modal — the authority the WP-05 plant is built from"
provides:
  - "SECTION_HEADING_LINE — the level-at-most-two heading class that owns the `## Steps` anchor"
  - "LIST_MARKER / ORDERED_MARKER at any indentation depth, over a two-character class that cannot match a newline"
  - "CorpusElements.stepsFiles — the heading-scan denominator the bullet loop does not produce"
  - "setRefusal — a two-direction, member-naming set comparison for a denominator"
  - "LEXICON_MEASURED_LABEL / SENTENCE_MEASURED_LABEL — the published element grain, declared once"
  - "unfencedIndexOf — heading location decided by the one fence authority"
affects:
  - "guard_imperative_lexicon — the bullet grammar at every depth, and the published PASS line's element grain"
  - "guard_sentence_form — which sentences are procedural, and the published PASS line's element grain"
  - "the derived Technical Names set — now fence-aware at both harvest sites (byte-unchanged today)"
tech-stack:
  added: []
  patterns:
    - "Ask at WHICH POSITIONS a predicate is invoked, not only which characters it accepts"
    - "A sub-heading STRUCTURES a section; only a heading that could start a sibling section ends one"
    - "A denominator's two sides must come from different code paths, or the floor is documentation"
    - "A set-level mismatch NAMES its members in both directions; a bare count is unactionable"
    - "One format-aware authority per predicate — consume the toggle, never re-declare the delimiter class"
    - "Assert each case's PREMISE, not only its symptom — a case can go red for the wrong reason"
    - "Verify a mutation ACTUALLY APPLIED and that its build exited 0 before believing its result"
    - "Commit, THEN mutate, THEN restore from the commit — never `git checkout --` over uncommitted work"
decisions:
  - "D-17-A: the leading-indent class is `[ \\t]`, NOT `\\s` — `\\s` matches a line terminator and the predicate is indentation on a single line"
  - "D-17-B: the anchor is released by a heading of level at most two and by nothing else; a `### ` leaves it alone"
  - "D-17-C: the guard banner did NOT move — it already named the subset the code now measures, which is the finding"
  - "D-17-D: the published element grain becomes the governed FILE at both guards, and both labels say so"
  - "D-17-E: `CorpusElements.sentenceFiles` deliberately NOT added — it would be a redundant second copy of the loop's own set, and sourcing `visited` from it would disarm vacuity branch 1"
  - "D-17-F: the corpus-cardinality refusal stays distinct from the two denominator refusals — scan-set size and loop reach are opposite remedies"
metrics:
  duration: 58m
  completed: 2026-08-15
actuals:
  tokens: 96000
  tasks: 3
  commits: 7
---

# Phase 29 Plan 17: Depth-Independent Step Grammar, Two Independent Denominators, Fence-Aware Table Scan Summary

`guard_imperative_lexicon` now measures the subset its banner has always claimed — every `## Steps`
bullet, at every nesting depth and across sub-headings — and both controlled-language guards publish
a denominator that can fail and that names the file which broke it.

## The three defects, and why they are one failure at three altitudes

| ID | Altitude | The defect | Direction |
|---|---|---|---|
| CR-03 | a grammar | a predicate never ASKED at the positions a sub-bullet occupies | fail-open, invisible |
| WR-02 | a floor | a denominator whose two sides read the SAME object | the floor never fires |
| WR-06 | a locator | an extent decided by a SECOND GRAMMAR over bytes `fencedLineFlags` already answers for | fail-open |

Every one of these is behaviour-preserving on the live corpus — measured on both sides, not assumed.
That is precisely why each proof is a planted adversarial input rather than a moved number.

---

## Task 1 — a step bullet is a step bullet at any depth (CR-03)

### The RED transcript, against the pre-change committed build (`b06e579`, plan 29-16)

```
 × counts a FOUR-SPACE indented bullet under a numbered step, and the count rises by exactly one
 × counts a TAB-indented bullet, because CommonMark indentation is spaces or tabs
 × measures an indented bullet against the PROCEDURAL bound, not the descriptive one
 × reaches the MODAL rule (WP-05) on an indented bullet
 × reaches the ONE-INSTRUCTION rule (WP-08) on an indented bullet
 × a `### ` sub-heading STRUCTURES the section and does not release the bullets below it
 ✓ a `## ` heading DOES release them — the false-red control at level two
 ✓ a `# ` heading DOES release them — the false-red control at level one
      Tests  6 failed | 29 passed (35)
```

**Six of six behavioural cases were live bypasses; both false-red controls were green before AND
after**, which is what makes them controls rather than coverage.

### The premise assertion, and the near-miss it prevented

29-16 recorded that a case can go RED FOR THE WRONG REASON. A planted line that never reached the
sentence loop at all would produce exactly the same "no finding" as one that reached it and was
misclassified — so the three reclassification cases would have been asserting a symptom whose
mechanism they never touched.

`sentenceTotals()` reads the gate's own procedural/descriptive split back. With it in place, the
failing assertion moved from `status` to the mechanism itself:

```
 ❯ scripts/check-imperative-lexicon.test.ts:906  expect(a.total).toBe(b.total + 1)        PASSED
 ❯ scripts/check-imperative-lexicon.test.ts:907  expect(a.procedural).toBe(b.procedural+1) FAILED
    AssertionError: expected 37 to be 38
```

**The line arrives; its CLASSIFICATION is wrong.** That is the position bug stated exactly, and it is
a stronger red than the exit code was.

### The fix — a position widened, not a character class

```ts
const LIST_MARKER    = /^[ \t]*(?:[-*+]|\d{1,3}[.)])\s+/;   // was /^ {0,3}.../
const ORDERED_MARKER = /^[ \t]*\d{1,3}[.)]\s+/;             // was /^ {0,3}.../
const SECTION_HEADING_LINE = /^#{1,2} /;                    // new — owns the anchor
```

```ts
if (SECTION_HEADING_LINE.test(raw)) inSteps = STEPS_HEADING.test(raw);
```

**The class is `[ \t]`, not `\s`,** and the reason is recorded in source: `\s` also matches a line
terminator and a range of Unicode spaces, while the predicate here is leading indentation ON A SINGLE
LINE. The trailing whitespace requirement after the marker is byte-unchanged — the only thing that
moved is the depth.

**THE BANNER DID NOT MOVE.** It already read "every `## Steps` bullet begins with a verb from the
closed approved set … at position zero". That claim was true of the name and false of the code, which
is the entire finding; a banner edit would have been the wrong remedy. Nothing in either guard's
header text changed, stated explicitly here rather than left to be inferred.

### GREEN after, and the live corpus unmoved

```
      Tests  35 passed (35)
```

| Figure | Before | After |
|---|---|---|
| `## Steps` bullets | 139 across 19 files | **139 across 19 files** |
| sentences | 2166 | **2166** |
| procedural / descriptive | 414 / 1752 | **414 / 1752** |
| derived Technical Names | 76 | **76** |
| exit code | 0 | **0** |

Re-derived at execution rather than trusted from the plan: the widening gains **0** lines on the live
corpus, and the sticky anchor gains **0**. Zero new findings, so nothing needed dispositioning.

### Acceptance probes

```
' {0,3}' in non-comment .ts        : 0     (criterion: 0)
SECTION_HEADING_LINE, non-comment  : 2     (criterion: >= 2)
node scripts/check-imperative-lexicon.js : exit 0
```

### Adversarial self-check — and a coverage hole the mutation found

| Mutation | Build | Cases red |
|---|---|---|
| A — `LIST_MARKER` narrowed back | 0 | 5 |
| B — `ORDERED_MARKER` narrowed back | 0 | **0** |
| C — anchor de-stickied | 0 | 1 |

**Mutation B reddened nothing.** Every case planted a `-` bullet, so the second marker's widening had
shipped uncovered — `ORDERED_MARKER` decides `procedural` through the RIGHT-HAND arm of
`(inSteps && isBullet) || ORDERED_MARKER.test(raw)`, and no case exercised it. A new case plants an
indented NUMBERED line in a CHECKLIST, which has no `## Steps` heading at all, so the anchor cannot be
what decides it and `LIST_MARKER` is wide on both sides of the mutation. Re-run: **B → 1 red.**

Final: A → 5, B → 1, C → 1. Disjoint and covering; all three arms independently load-bearing.

**Commits:** `69aee8d` (RED), `cf8a022` (fix + rebuilt `.js`), `b6d4189` (the mutation-found case).

---

## Task 2 — two independent denominators, two named set refusals (WR-02)

### The defect

```ts
{ visited: bulletsVisited,    expected: elements.bullets.length,    … }
{ visited: sentencesVisited,  expected: elements.sentences.length,  … }
```

Both sides read the same object at both call sites, so `visited !== expected` could not fire under any
input and `vacuity.ts`'s second branch — the one that exists to make a silently NARROWED check visible
— was dead code with a comment explaining what it was for.

### The fix

| Guard | `expected` derived from | `visited` derived from |
|---|---|---|
| `guard_imperative_lexicon` | `elements.stepsFiles` — the HEADING branch of `deriveElements` | the bullet classification loop |
| `guard_sentence_form` | `corpus.length` — the four-part corpus walk | the sentence classification loop |

A file is recorded as carrying a step section **the moment its heading is seen**, whether or not a
bullet ever follows. That is the whole point: it is a fact the consuming loop cannot produce.

Above each report, a **set-level refusal in BOTH directions**, with distinct wording, because the two
directions are different defects — a file that declares a section and yields nothing is a narrowed
check, while a bullet attributed to a file the heading scan never saw is two scans disagreeing about
where the section is.

### The two planted failures, verbatim against the committed build

```
  FAIL  the step-heading file set and the bullet-bearing file set are not equal, so the element count published below covers less than the corpus declares
        carries a `## Steps` heading but NOT contributed a bullet (1): agent-factory/workflows/00-fixture.md — each of these files opens a step section and contributed no bullet to the loop, so no WP-01 verdict was reported over any step it declares
  FAIL  imperative lexicon — governed file(s) carrying a `## Steps` section: visited 18 of 19 elements — the scan set is short, so the result covers less than it claims
  PASS  sentence form — governed file(s): 0 findings over 47/47 elements
== Result ==
2 CHECK(S) FAILED
```

```
  PASS  imperative lexicon — governed file(s) carrying a `## Steps` section: 0 findings over 19/19 elements
  FAIL  the governed-corpus file set and the sentence-bearing file set are not equal, so the element count published below covers less than the corpus does
        in the derived governed corpus but NOT yielded a sentence (1): agent-factory/checklists/00-fixture.md — each of these files is a member of the governed corpus and yielded not one sentence, so no WP-02..WP-08 verdict was reported over any prose it carries
  FAIL  sentence form — governed file(s): visited 46 of 47 elements — the scan set is short, so the result covers less than it claims
== Result ==
2 CHECK(S) FAILED
```

**Each names the file.** Each leaves the OTHER guard passing, so the two denominators are independent
of one another as well as of their loops. The unmodified control exits **0** at `19/19` and `47/47`.

### Acceptance probes

```
expected: elements.bullets.length,   non-comment .ts : 0   (criterion: 0)
expected: elements.sentences.length, non-comment .ts : 0   (criterion: 0)
```

A third case asserts the PROPERTY rather than only its symptom: a source read confirms
`expected: elements.stepsFiles.length`, `expected: corpus.length` and
`visited: sentenceFilesVisited.length` are present and both tautological forms are absent from
executable source.

### Adversarial self-check — per arm, each verified to have applied

| Mutation | Applied | Build | Cases red |
|---|---|---|---|
| D — both set refusals disabled, denominators kept | yes | 0 | 2 (both plants) |
| E — lexicon denominator only, back to the bullet array | yes | 0 | 2 (lexicon plant + property) |
| F — sentence denominator only, back to the sentence array | yes | 0 | 2 (sentence plant + property) |

Each mutation script exits non-zero on a no-op and its result is discarded, because a mutation run
that silently does not mutate is the same class of defect as a gate that silently does not check.

**Commit:** `9acc1f4`.

---

## Task 3 — one fence authority decides both table scans (WR-06)

### The RED transcript, and each case's own mechanism

```
 × a fenced `## ` line does NOT end the section …        noteKinds 1   (five rows below it lost)
 × a table row inside a fence is NOT harvested …         noteKinds 7   (injected-b entered the set)
 × a heading QUOTED INSIDE A FENCE is not matched …      noteKinds 1   (scan locked onto the example)
 × the same three defences hold for the BOARD table …    boardColumns 1
 ✓ the two table sources on the LIVE tree carry zero fenced heading lines and zero fenced rows
      Tests  4 failed | 40 passed (44)
```

**Four distinct mechanisms, not four instances of one symptom** — the derived part size lands on a
different wrong number in each case. The fifth is the PREMISE, and its being green is what makes the
behaviour-preserving claim a measurement.

### The fix

Both locators route through the imported `fencedLineFlags`: `unfencedIndexOf` requires the
heading/header match to be on an unfenced line, the section-end scan stops only at an unfenced
heading, and a fenced row is skipped rather than harvested. `FENCE_DELIMITER_LINE` is not re-declared
and there is **no opt-out parameter**, because an opt-out is a second grammar with extra steps.

Source records that this direction is not currently reachable and is fixed anyway, and states why the
set is load-bearing: `countWords` collapses a multi-word Technical Name to ONE term, so a term
injected by a fenced example or dropped by a fenced heading moves sentences across the length bounds
and changes verdicts in a guard that never mentions tables at all.

### The live set is untouched, proven by running BOTH builds

```
size before: 76 | size after: 76
in BEFORE not AFTER: []
in AFTER not BEFORE: []
joined identical: true
sha256 before: 9b26184ad6f9d9774dc6faaba83d4c3f611dd89a6a4e73e68487d450099b52e9
sha256 after : 9b26184ad6f9d9774dc6faaba83d4c3f611dd89a6a4e73e68487d450099b52e9
parts before : roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13
parts after  : roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13
```

Compared in both directions and by digest, with the "before" side DERIVED by importing the pre-fix
committed `.js` from commit `ec526dd` rather than pasted from an earlier transcript.

**Fenced lines re-derived at execution time in the two table sources:**

```
agent-factory/contracts/context-note.md : 0 fenced `## ` lines, 0 fenced table rows
agent-factory/seed/plans/board.md       : 0 fenced `## ` lines, 0 fenced table rows
```

The planner measured 0 in each; confirmed.

### Acceptance probes

```
grep -c 'fencedLineFlags' scripts/check-imperative-lexicon.ts : 6   (criterion: >= 3)
```

### Adversarial self-check — a build failure caught, and a second coverage hole found

| Mutation | Build | Cases red |
|---|---|---|
| G — heading match fence-blind (first attempt) | **1** | **discarded** |
| G — heading match fence-blind (retry) | 0 | 2 (both anchor cases) |
| H — note-kind section/row skip removed | 0 | 2 (truncation + injection) |
| I — board row skip removed (first attempt) | 0 | **0** |
| I — board row skip removed (after new case) | 0 | 1 |

**G's first attempt failed to build** (`TS6133: 'flags' is declared but its value is never read`) and
was discarded rather than read as a result. This is 29-16's false-green lesson doing its job: had the
build exit code not been checked, the suite would have run the UNMUTATED `.js` and reported the fix's
own green as the mutant's.

**I reddened nothing at first.** The board case placed its fence BEFORE the header row, exercising
only the heading-match arm. The board loop ends at the first line that is not a row, and a fence
delimiter is not a row — so a fenced example sitting INSIDE the table would truncate it. A new case
plants exactly that; re-run: **I → 1 red.**

**Commits:** `ec526dd` (RED), `55abb5b` (fix + rebuilt `.js`), `35c9fb5` (the mutation-found case).

---

## The gate's published numbers, live tree

```
[guard_imperative_lexicon] every `## Steps` bullet begins with a verb from the closed approved set, in bare imperative form, at position zero (LANG-04 / WP-01, D-12, D-39)
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  PASS  imperative lexicon — governed file(s) carrying a `## Steps` section: 0 findings over 19/19 elements

[guard_sentence_form] sentence length by section anchor — 20 words procedural, 25 descriptive — plus four banned constructions over closed token sets (LANG-04 / WP-02..WP-08, D-14, D-35, D-39)
        2166 sentence(s) — 414 procedural, 1752 descriptive; by finding kind: none
  PASS  sentence form — governed file(s): 0 findings over 47/47 elements
  PASS  LANG-01: 76 Technical Name(s) DERIVED from the kit, never listed — roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13

== Result ==
ALL CHECKS PASSED
```

**19 of 19** step-heading files contribute a bullet; **47 of 47** governed files yield a sentence.
Against the pre-change recorded figures the detail lines are byte-identical: this plan moves the
element grain and the grammar's reach, not the facts.

## Four gates and the regression floor

```
check-foundation-guards.js   exit=0  (0.11s)
check-imperative-lexicon.js  exit=0  (0.05s)     [pre-change: 0.06s]
check-banned-claims.js       exit=0  (0.05s)
check-diff-disposition.js    exit=0  (1.77s)

$ npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  51 passed (51)
      Tests  1787 passed | 2 skipped (1789)
   Duration  116.42s
REGRESSION_EXIT=0

$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.   exit 0
$ npm run typecheck                                                            exit 0
```

Against 29-16's baseline of **51 files / 1769 passed / 2 skipped**: files unchanged, passed **+18** —
exactly the eighteen new cases (nine for CR-03, three for WR-02, six for WR-06), skips unchanged. No
test was removed or weakened. The plan's floor was 51 / 1725 / 2.

**The gate's wall clock did not regress** despite the widened marker and the added flag pass touching
the hot loop: 0.05s against a pre-change 0.06s. The quantifier is unbounded over a two-character class
that cannot match a newline, applied per line — no match-all regex and no nested quantifier.

**The bare `npm test` script was never invoked**; every run used `--exclude '**/scripts/e2e/**'` or a
single named file.

A second `npm run build` left `git status --porcelain` unchanged.

## Scope and cleanliness

```
$ git diff --stat b06e579..HEAD          # 29-16 closed at b06e579
 scripts/check-imperative-lexicon.js      | 217 +++++++++--
 scripts/check-imperative-lexicon.test.ts | 602 ++++++++++++++++++++++++++++++-
 scripts/check-imperative-lexicon.ts      | 250 +++++++++++--
 3 files changed, 1019 insertions(+), 50 deletions(-)

$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
```

**Exactly the three files the plan names**, and exactly the three pre-existing out-of-scope entries.
**No plant residue** — every reproduction lived in a temp-dir mirror, so the live tree was never
planted into. `package.json` is untouched and zero packages were installed.

## Deviations from Plan

### 1. [Rule 2 — missing coverage] Two mutation-found holes closed with new cases

Neither was in the plan's case list, and both were found by mutating rather than by reading.
`ORDERED_MARKER`'s widening and the board loop's fenced-row skip each shipped with **zero**
discriminating coverage — a mutation reverting either passed the whole suite. Both now have a case
that isolates the arm. Recorded as the plan's own thesis landing on the plan: an unexercised arm is
invisible while green.

### 2. [Rule 3 — deliberate divergence from the plan's artifact list] `CorpusElements.sentenceFiles` NOT added

The plan's artifact table names a `sentenceFiles` field alongside `stepsFiles`. It was deliberately
not added, and the reason is the plan's own prohibition against a tautological denominator:

- Sourcing the sentence guard's `visited` from a derivation-time field would move it OFF the
  classification loop. A guard that skipped its loop entirely would then still report `47`, and
  `vacuity.ts`'s FIRST branch — the zero-element floor — could no longer fire. That is a strictly
  weaker floor than the one shipped.
- Keeping the field AND accumulating in the loop would ship two objects that are equal by
  construction — the weaker-duplicate shape this phase has spent several plans deleting.

`stepsFiles` is genuinely independent (a heading branch the bullet loop does not run) and was added.
`corpus.length` is genuinely independent of the sentence loop and needs no new field. Recorded as
D-17-E rather than left as a silent omission from the artifact table.

### 3. [Process — the recorded 29-16 lesson recurring] `git checkout --` discarded uncommitted Task 2 source edits

29-16 recorded, as its deviation 4: "commit, then mutate, then restore from the commit." Task 1
followed it. **Task 2 did not** — a mutation was reverted with `git checkout -- scripts/check-imperative-lexicon.ts`
while the Task 2 source edits were still uncommitted, and all of them were lost.

Detected immediately by the next mutation's own apply-check (`grep -c stepsFiles` → 0 on a 1258-line
file), which is the only reason the following mutation run was not read as a result — it had produced
**6 red against a build with no Task 2 code in it at all**, a textbook false red. The edits were
re-applied, verified against the same gate output and suite (`39 passed`), and **committed before any
further mutation**. Every later mutation script exits non-zero on a no-op.

No product impact. Recorded because the lesson was already written down and was still repeated, which
makes the mechanism — an apply-check on every mutation — the actual remedy rather than the reminder.

### 4. [Recorded, not a deviation] Both published PASS lines' wording changed

`imperative lexicon:` became `imperative lexicon — governed file(s) carrying a `## Steps` section:`
and `sentence form:` became `sentence form — governed file(s):`. Three existing cases asserted the old
strings; all three now assert the exported `LEXICON_MEASURED_LABEL` / `SENTENCE_MEASURED_LABEL`, so a
fourth spelling cannot drift in. The element grain of a published PASS line is a contract readers rely
on, which is why the plan rated this `costly` and why it is stated here rather than left to be
noticed. **The two guard BANNERS did not change** — only the measured verdict lines.

## Honest ceilings

- **The new denominators count FILES, so a file that yields one bullet out of fifty still reads as
  fully visited.** Strictly stronger than a tautology and strictly weaker than a per-element
  independent count, which would need a second derivation to compare against. Stated rather than
  implied by the `19/19` and `47/47`. This is the same ceiling 29-16 recorded for the sibling gate.
- **CR-03 is closed for INDENTATION and for SUB-HEADINGS.** It is not a proof that no other construct
  escapes the step grammar. A lazy-continuation line, a bullet inside an HTML block and a setext
  heading were not probed, and no claim is made about them.
- **WR-06 is fixed for THIS module's two table locators.** The review names other locators in the
  tree that decide a section end with a bare heading scan; 29-18 owns those and nothing is claimed
  for them here.
- **The live corpus proves nothing about these fixes and was never asked to.** All three are
  behaviour-preserving at 139 / 2166 / 76, which is exactly why every proof is a planted input.
- **A green suite remains insufficient for a safety guard.** The eighteen new cases are a floor. Two
  of them exist only because a mutation found their absence, which is the honest measure of how much
  the other sixteen prove.

## Threat register — dispositions honoured

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-29-55 | mitigate | Marker admits any depth over `[ \t]`; anchor survives `### `; nine planted cases covering the UNION of the arms (two false-red controls at `## ` and `# `), plus three per-arm mutations that are disjoint and covering |
| T-29-56 | mitigate | Unbounded quantifier over a TWO-CHARACTER class that cannot match a line terminator, tested per line; no match-all regex, no nested quantifier. Gate wall clock 0.05s against a pre-change 0.06s |
| T-29-57 | mitigate | `expected` from the heading scan and from the corpus walk, `visited` from each classification loop, asserted by source read AND by grep count 0 on both tautological forms; set refusals name files in both directions; both planted cases exit 1 naming the file |
| T-29-58 | mitigate | Both table scans decided through the single toggle, no delimiter re-declaration, no opt-out parameter; five planted cases; the whole derived set asserted identical over the live tree in both directions and by sha256 `9b26184a…` |
| T-29-59 | mitigate | `npm run build` in the same task as every source edit, `.js` committed with `.ts`, freshness 48/48, second build idempotent |
| T-29-SC | accept | Zero packages installed; `package.json` untouched and absent from the diff |

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced. No test was
skipped and every `<verify>` in the plan was run.

## Threat Flags

None. This plan adds no network endpoint, auth path or schema at a trust boundary. It adds no new I/O
of any kind — `fencedLineFlags` was already imported and already consumed by this module.

## Verification Against the Plan

| Plan verification item | Result |
|---|---|
| An indented step bullet is counted, measured procedural, and reaches WP-05 and WP-08 | PASS — six cases, each RED against the pre-change build; the reclassification proven via the procedural/descriptive split, not only via the finding |
| A sub-heading does not release the bullets below it; a level-one or level-two heading does | PASS — three named assertions, so the union of the arms is tested |
| Both denominators come from a different code path than their visit counters, and each names its file | PASS — grep count 0 on both tautological forms; both plants exit 1 naming the file |
| The table scan reads the fence authority; the derived Technical Names set is unchanged | PASS — `fencedLineFlags` count 6; set identical in both directions, sha256 equal |
| Live corpus unmoved at 139 bullets / 19 files, 2166 sentences (414/1752), 76 Technical Names | PASS — all five figures byte-identical |
| All four gates exit 0; regression, typecheck and freshness exit 0 | PASS — 0/0/0/0; 51 files / 1787 passed / 2 skipped; 48/48 fresh |
| `git diff --stat` names only the three files in `files_modified` | PASS — exactly three files, no deviation file |
| Tab-indented plant counted | PASS |
| No count assertion is a typed literal | PASS — every baseline derived from a run over the unplanted mirror |

## Requirements — advanced, deliberately NOT marked complete

`LANG-02` and `LANG-04` are left `[ ]` / Pending in `REQUIREMENTS.md`. This plan advances both — the
guard now enforces exactly the decidable subset it is named for (LANG-04) and its application claim
rests on a denominator that can fail (LANG-02) — but **two plans of this same gap-closure round, 29-18
and 29-19, still target them**, and phase verification has not run. Checking the boxes now would
publish a completion this plan cannot vouch for, which is the repository's own no-fabrication rule
applied to its own traceability trail. They are advanced here and closed by whoever closes the round.

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — CR-03 RED | `69aee8d` | `scripts/check-imperative-lexicon.test.ts` |
| 1 — CR-03 fix | `cf8a022` | `scripts/check-imperative-lexicon.ts`, `.js`, `.test.ts` |
| 1 — mutation-found case | `b6d4189` | `scripts/check-imperative-lexicon.test.ts` |
| 2 — WR-02 fix | `9acc1f4` | `scripts/check-imperative-lexicon.ts`, `.js`, `.test.ts` |
| 3 — WR-06 RED | `ec526dd` | `scripts/check-imperative-lexicon.test.ts` |
| 3 — WR-06 fix | `55abb5b` | `scripts/check-imperative-lexicon.ts`, `.js` |
| 3 — mutation-found case | `35c9fb5` | `scripts/check-imperative-lexicon.test.ts` |

## Self-Check

- `scripts/check-imperative-lexicon.ts` — FOUND (`SECTION_HEADING_LINE`, `stepsFiles`, `setRefusal`,
  `bulletFilesVisited`, `sentenceFilesVisited`, `unfencedIndexOf`, `LEXICON_MEASURED_LABEL` all
  present; `' {0,3}'`, `expected: elements.bullets.length` and `expected: elements.sentences.length`
  all 0 in non-comment source)
- `scripts/check-imperative-lexicon.js` — FOUND (rebuilt, freshness 48/48, second build idempotent)
- `scripts/check-imperative-lexicon.test.ts` — FOUND (45 tests, 18 new)
- commits `69aee8d`, `cf8a022`, `b6d4189`, `9acc1f4`, `ec526dd`, `55abb5b`, `35c9fb5` — all FOUND

## Self-Check: PASSED
