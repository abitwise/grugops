---
phase: 29-controlled-language-voice-guard-rebuild
plan: 26
subsystem: tooling / verification harness + audit transcript
tags: [LANG-03, LANG-04, LANG-06, LANG-07, parser-oracle, adversarial-closure, human-decision, round-reopened]
requires:
  - "scripts/frontmatter.ts — unfencedHeadingIndex, sectionEndIndex, fencedLineFlags (the one authority plan 29-20 created)"
  - "scripts/check-foundation-guards.test.ts — plan 29-25's derived owner and consumer scans, whose cardinalities this transcript records rather than re-derives"
  - ".planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md — the ORIGINAL reproduction recipes for CR-01, CR-02 and WR-01"
provides:
  - "scripts/section-locator-oracle.test.ts :: a seven-axis, 7200-cell parser oracle over the section-locator authority, checked against six structural invariants and proven able to fail twice"
  - "docs/audit/29-locator-unification.md :: the unification as a re-runnable transcript — six predicates, one authority, the derived lists, the oracle's axes, every reproduction, 32 adversarial variants, the residual set, and the decision taken on it"
  - "four NEW findings, recorded and NOT fixed: V-29-26-01, V-29-26-02, V-29-26-03, V-29-26-04"
affects:
  - "gap-closure round 2 — REOPENED by human decision; does not proceed to re-verification"
  - "phase 29 completion — blocked; no LANG requirement is verified or closed by this round"
tech-stack:
  added: []
  patterns:
    - "a parser oracle checks properties of the ANSWER, so no reference implementation is needed and no expected output is transcribed"
    - "derive the cell count twice by different means and compare, because a vacuity floor catches an EMPTY denominator and never a SILENTLY SHORT one"
    - "prove the sweep falsifiable against a reproduction of a defect the tree really had — a sweep that passes a known-broken implementation is measuring nothing"
    - "record the variants that found nothing too: a variant list carrying only successes is a list somebody curated"
    - "a transcribed classifier must reproduce the live case's published answer over the SAME input set before it is trusted on new input"
    - "when a set literal becomes a derivation, the derivation's SCOPE is a new degree of freedom"
decisions:
  - "The oracle declares SEVEN axes, not the six the plan named: the requested LEVEL is a parameter with two legal values and every invariant is phrased 'at most the requested level', so asking one of the two tests half the predicate."
  - "Nothing found in Task 2 was repaired in Task 2. Four surviving variants were recorded by name with their reproductions and left live, because a measurement plan that repairs what it measures has graded its own paper."
  - "HUMAN DECISION (Olger Oeselg, 2026-08-15): `reopen-for-survivors`. Gap-closure round 2 does NOT close. R4 was non-empty, and this round's own standard refuses to close over a reproduced bypass."
metrics:
  duration: ~101m measured from the first commit, plus unmeasured Task 1 authoring time before it, across two sessions
  completed: 2026-08-15
actuals:
  tokens: 118000
  tasks: 3
  commits: 4
status: complete
---

# Phase 29 Plan 26: Adversarial Closure and the Human Decision on the Residual Set Summary

A seven-axis, 7200-cell parser oracle checks the unified section locator against properties of its
own answer and is proven able to fail twice; every original reproduction was re-run from the round-2
review's own recipes and now fails closed; thirty-two adversarial variants invented at execution
found **four new findings**, none of which this plan repaired — and the human, shown that R4 was
non-empty, chose **`reopen-for-survivors`**, so **gap-closure round 2 is REOPENED, not closed.**

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | A parser oracle over the unified authority — invariants, not transcribed expectations | `f4212f6` | `scripts/section-locator-oracle.test.ts` |
| — | Fix: the oracle's set key carried two NUL bytes | `b828c1a` | `scripts/section-locator-oracle.test.ts` |
| 2 | Independent re-reproduction and adversarial variants | `b5e00c3` | `docs/audit/29-locator-unification.md` |
| 3 | The residual set as a human decision (checkpoint, `blocking`) | this commit | SUMMARY, transcript §8, STATE.md |

Tasks 1 and 2 ran in a prior session and halted at Task 3's blocking checkpoint. This continuation
verified both commits and their artifacts on disk before recording the decision.

## 1. The oracle — axis lengths and cell count

`scripts/section-locator-oracle.test.ts`. **Seven** axes, not the six the plan named: the requested
LEVEL was added, because every invariant is phrased "at most the requested level" and a sweep that
asks one of that parameter's two legal values tests half of it.

| # | axis | members | labels |
|---|---|---:|---|
| 1 | heading level | 5 | level-one, level-two, level-three, a hash run with no following space, not a heading at all |
| 2 | fencing | 3 | outside any fence, inside a terminated fence, inside an unterminated fence running to EOF |
| 3 | trailing residue | 4 | none, one space, one tab, one carriage return |
| 4 | leading residue | 3 | none, one space, four spaces |
| 5 | position | 5 | at `from` itself, three lines after `from`, the last line, absent with `from` at zero, absent with `from` equal to the line count |
| 6 | document shape | 4 | an empty string, a single blank line, the candidate is the first line, an ordinary multi-section document |
| 7 | requested level | 2 | level 1, level 2 |

`5 × 3 × 4 × 3 × 5 × 4 × 2 = ` **7200 cells**, derived twice by different means and compared: the
product of the seven pinned axis lengths, and a counter incremented by the loop that walks the
generated corpus. The generated array's own length is asserted as a third witness. The cells carry
**2058** distinct `(text, from, level)` triples over **724** distinct documents, both pinned as
numbers — a generator that started emitting one document would pass a bare cell count.

Six invariants are checked per cell, all properties of the ANSWER. **I3 is the founding defect of
this phase stated as a property**: no line in `[from, answer)` is both unfenced and a heading of level
at most the requested level, so a predicate satisfying it cannot adopt bytes belonging to a later
section.

The header names **seven** shapes the sweep does not cover: setext headings, heading text containing
a fence delimiter run, fence delimiters other than exactly three backticks at column zero, non-line-feed
documents, inputs larger than the generated cells, a `from` outside `[0, lineCount]`, and anything to
do with the file system. **Two of those seven turned into findings the moment they were probed by
hand** (V-29-26-01 setext, V-29-26-03 and V-29-26-04 fence delimiter spelling).

## 2. The falsifiability probes — the failing-cell output

The sweep is proven able to fail, twice, against reproductions of defects the tree really had. Both
broken implementations are local to the test file and never exported.

| probe | the defect it reproduces | cells failed of 7200 |
|---|---|---:|
| a close recognising `## ` and nothing else | CR-02 | **1836** |
| an anchor scan reading raw lines | WR-01 | **1440** |

A failing cell names every axis value that produced it. Verbatim, from the level-two-only probe:

```
I2 violated — the line the section ENDS at is not a heading of level at most 1: "## A later real
section"; end=3 from=0 lineCount=5 level=[a level-one heading] fencing=[outside any fence]
trailing=[no trailing residue] leading=[no leading residue] position=[the candidate is AT `from`
itself] shape=[the candidate is the document's FIRST line] request-level=[level 1]
```

and from the fence-blind probe:

```
I4 violated — the located line is fenced or is not the requested heading: "# Candidate"; at=1
heading="# Candidate" level=[a level-one heading] fencing=[inside a TERMINATED fence] trailing=[no
trailing residue] leading=[no leading residue] position=[the candidate is AT `from` itself]
shape=[the candidate is the document's FIRST line] request-level=[level 1]
```

## 3. The reproductions, before and after

Run from the recipes in `29-REVIEW.md`, against the committed `.js` — never from a plan's restatement.

### CR-02 — the level-one bypass

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence(
    ["## Caveman prompt","You senior prose here with no fence at all.","","# Appendix",
     "Some later top-level section.","```","grug club rock cave smash","```",""].join("\n")))))'
```

| | verdict |
|---|---|
| the review, before | `{"ok":true,"inside":"grug club rock cave smash","outside":"You senior prose here with no fence at all.\n\n# Appendix\nSome later top-level section.\n"}` |
| **this session, after** | **`{"ok":false,"reason":"missing"}`** |

Fails closed. The wrong-bytes measurement is gone and the refusal names a reason.

### WR-01 — the quoted anchor false red

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence(
    ["# Role","## Caveman prompt","```","You grug smash rock and club.","```","","## Notes",
     "Example of the required section:","```","## Caveman prompt","```",""].join("\n")))))'
```

| | verdict |
|---|---|
| the review, before | `{"ok":false,"reason":"multiple"}` |
| **this session, after** | **`{"ok":true,"inside":"You grug smash rock and club.", …}`** |

The correct document is no longer refused by name, and the block located is the real one.

### CR-01 — the watched-corpus narrowing, three live steps

**Step 1** — reword the frozen sentence in `agent-factory/roles/uat-planner.md`'s `## Hard limits`:

```
1 CHECK(S) FAILED        node scripts/check-diff-disposition.js -> exit=1
```

**Step 2** — with the reword in place, flip the fourth cell of the register's `uat-planner` row from
`yes` to `no` and regenerate:

```
Wrote docs/audit/28-safety-surface-exclusions.md — 40 entries.
```

The 40 matches the review's step 2 exactly: the union went from 41 entries to 40.

**Step 3** — re-run every gate the review ran.

| gate | the review, before | **this session, after** |
|---|---|---|
| `check-diff-disposition` | exit 0, `ALL CHECKS PASSED` | **exit 1** |
| `check-audit-register` | exit 0 | **exit 1** |
| `check-claim-anchors` | exit 0, `ALL CHECKS PASSED` | exit 0 |
| `check-foundation-guards` | exit 0, `ALL CHECKS PASSED` | exit 0 |

Both new refusals name the member:

```
FAIL  1 of the 36 derived kit file(s) are NOT in the watched corpus —
      agent-factory/roles/uat-planner.md. The corpus derived 39 markdown file(s) from the 40-entry
      safety-surface union, and the derived kit alone is 36 (17 roles + 19 workflows), so this gate
      is about to report a verdict over LESS than the kit it exists to watch. …
```

```
FAIL  equality three (derived but NOT flagged): 1 derived kit file(s) are absent from the set of
      counted rows flagged `safety_surface: yes` — agent-factory/roles/uat-planner.md. …
```

The measured `39` against a `36` minimum is the number proving the review's own suggested fix — a
bare cardinality floor — would have stayed green on this exact tree.

**Revert.** `git checkout --` on the three touched files, then:

```
$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
$ node scripts/check-diff-disposition.js  -> exit=0
$ node scripts/check-audit-register.js    -> exit=0
$ node scripts/check-claim-anchors.js     -> exit=0
$ node scripts/check-foundation-guards.js -> exit=0
```

The three surviving entries are the pre-existing out-of-scope ones. No plant was left behind.

## 4. The adversarial variants — all thirty-two, successes and failures alike

Invented at execution against the committed `.js`; none copied from any plan or review. **Variants
that found nothing are listed too** — a list carrying only successes is a list somebody curated, and
a short list is the shape a curated one takes.

### A — the caveman section bound (`readCavemanFence`, CR-02 / WR-01, LANG-06)

| # | the variant | outcome |
|---|---|---|
| A1 | a thematic break `---` between the anchor and a later fenced block | adopts. **Nothing** — a thematic break opens no section |
| A2 | an HTML comment as the bound | adopts. **Nothing** — same reason |
| A3 | a `###### ` heading between the anchor and a later fence | does not close. **Nothing** — a level-six heading structures a level-two section |
| A4 | the anchor is the document's last line | `missing`. **Nothing** — fail-closed |
| A5 | the anchor line carries a trailing tab | located. **Nothing** — the pinned `trimEnd()` widening |
| A6 | the anchor spelled inside a quoted frontmatter value | not taken as an anchor. **Nothing** |
| A7 | a fence delimiter run inside a quoted frontmatter value | no toggle. **Nothing** |
| A8 | a second anchor inside an unterminated fence | not counted. **Nothing** — fence-aware |
| A9 | the anchor spelled with a leading tab | `missing`. **Nothing** — the column-zero convention |
| **A10** | a **setext** level-two heading between the anchor and a later fenced block | **adopts the later section's block — FINDING V-29-26-01** |
| A11 | a column-zero anchor inside a malformed frontmatter region, with a real anchor below | `multiple`, a false red. **Nothing** — fail-closed, needs frontmatter no YAML writer produces |
| A12 | a column-zero fence delimiter inside a malformed frontmatter region | `missing`, a false red. **Nothing** — same precondition |
| A13 | the anchor below a `### ` subsection | located. **Nothing** |
| **A14** | a fence opened with **four** backticks carrying a three-backtick line inside | **a TRUNCATED block; the rest leaks into the clear-voice remainder — FINDING V-29-26-03** |
| **A15** | the opening delimiter indented by two spaces (legal CommonMark) | **`missing` — a false red on a well-formed document — part of FINDING V-29-26-04** |
| A16 | the delimiter carrying an info string | located. **Nothing** |
| A17 | a `## ` line inside a four-space-indented code block below the anchor | does not close. **Nothing** — and this BOUNDS Residual 4: the indented-code-block blindness reaches the list markers and does **not** reach the section locator |

### B — the disposition-row bound (`locateSection` / `readDispositionRows`, WR-03 / IN-01, LANG-03)

| # | the variant | outcome |
|---|---|---|
| B1 | an indented `## ` inside the section | does not close. **Nothing** |
| B2 | the section heading carrying a trailing tab | located. **Nothing** |
| B3 | the section heading carrying a leading space | `null`. **Nothing** — fail-closed |
| B4 | malformed rows over the live register | `rows 1532, malformed 0, files 53`. **Nothing** — IN-01's refusal still has an empty input set |

### C — the exemption's reach (`locateExemptRegion`, WR-02, LANG-04)

| # | the variant | outcome |
|---|---|---|
| **C1** | an unterminated fence opened inside the exemption region, with a real `## ` section appended after it | `endBefore` 6 → 7, the appended section swallowed. **Nothing NEW** — reaches, by a new route, plan 29-23's recorded residual that **the reach pin measures OCCURRENCES, not extent** |
| C2 | the control — the same document with the fence terminated | `endBefore` 6. Correct |
| C3 | the region heading duplicated inside a fence below the real one | region located at the real heading. **Nothing** — fence-aware |

### D — narrowing the watched corpus by a route other than a cell flip (CR-01, LANG-03)

| # | the variant | outcome |
|---|---|---|
| D1 | the review's own route — flip the `safety_surface` cell | both gates exit 1. Closed (§3) |
| **D2** | **delete the register row outright** | both gates exit 1, and equality ONE names the member. **Nothing** — the narrowing is refused by a different equality than the one built for the flip, which is what a two-sided derived pin buys |

### E — the scope of the derived scans (WR-08, LANG-07)

| # | the variant | outcome |
|---|---|---|
| **E1** | run the owner classifier over every tracked non-test `.ts` the live scan never reads | reads **41 of 49**; **8** unread; **0** owners found there. **FINDING V-29-26-02** |
| **E2** | run the duplicate-assertion classifier over every tracked `*.test.ts` the tripwire never reads | reads **47 of 53**; **6** unread, three of them under `scripts/`; **0** pairs over 556 classified assertion lines. Part of **V-29-26-02** |
| E3 | does any unread non-test module import the locator authority? | none. **Nothing** — the consumer list is unaffected |

E1 and E2 each assert their own premise before their claim: the transcribed classifier first
reproduces the live case's published answer over the SAME set (`41 modules, 1 owner, 1 site` and
`47 modules, 4751 assertion lines, 0 barren, 0 pairs`) before it is trusted on new input.

### F — the harness fixes (WR-05 / WR-06 / WR-07 / IN-03)

| # | the variant | outcome |
|---|---|---|
| F1 | a duplicate assertion pair separated by a comment, and by a blank line | both invisible to the tripwire. **Nothing NEW** — plan 29-25 discloses both at the classifier |
| F2 | is `ROLE_COUNT` itself derived or a literal? | a literal at `kit-model.ts:107`, but pinned two-sided at `kit-model.test.ts:267`. **Nothing** |
| F3 | IN-03's acceptance grep, re-run | exactly three lines, matching plan 29-25's published answer. **Nothing** |

## 5. The four surviving findings — recorded, NOT fixed

**V-29-26-01 — a setext section boundary is not a boundary to this authority (LANG-06, LANG-07).**
Direction **fail-open**. `Appendix` over a run of hyphens is a level-two heading in CommonMark; the
authority recognises ATX only, so the caveman section runs past it and adopts the later section's
fenced block — the founding defect of this phase reached through a heading SPELLING rather than a
heading LEVEL. Live reachability **0** setext headings in the bodies of all 40 governed documents.
The first run of that measurement reported **37** and was WRONG — it counted each document's
frontmatter TERMINATOR. The correction is the finding's most useful fact: **37 of 40 documents carry
a line a setext-aware authority would read as a level-two heading**, so the structural remedy needs a
frontmatter carve-out the authority does not have.

**V-29-26-02 — the derived scans that prove LANG-07 are `scripts/`-scoped and non-recursive, while
the case name, the refusal wording and plan 29-25's summary all call them tree-wide (LANG-07).**
No live bypass; a scope claim wider than the assertion behind it — this repository's own recorded
second systemic failure class.

| scan | reads | tree | unread | found in the unread set |
|---|---:|---:|---:|---:|
| section-extent OWNERS | 41 | 49 | 8 | **0 owners** |
| duplicate-assertion tripwire | 47 | 53 | 6 | **0 pairs** over 556 assertion lines |

Two unread modules live **under `scripts/`** (`runnable-ref/reference-check.ts`,
`runnable-ref/test-skip-integrity.ts`) and are missed because `readdirSync` does not recurse, so even
the narrower claim "every module under `scripts/`" is short. **When a set literal becomes a
derivation, the derivation's SCOPE is a new degree of freedom.**

**V-29-26-03 — the one fence authority toggles on any run of three or more backticks, so a longer
fence is closed early by a shorter run inside it (LANG-06).** Direction **fail-open**: a truncated
block measured as the whole one. `FENCE_DELIMITER_LINE` is `/^```/`, a prefix test. Live reachability
**0** four-or-more-backtick runs across the 40 documents, against 42 column-zero three-backtick
delimiter lines.

**V-29-26-04 — the one fence authority does not see an indented fence delimiter, and six lines of a
watched document are misclassified today (LANG-03, LANG-06).** **The only one of the four with a
non-empty input set.** CommonMark allows up to three spaces of indent; `/^```/` is column-zero
anchored. Measured: **4 indented delimiters, all in `README.md`** (lines 31, 33, 40, 42), producing

```
lines: 67  DIVERGING LINES: 6
    31  live=false commonmark=true  "   ```bash"
    32  live=false commonmark=true  "   node install/install.js"
    33  live=false commonmark=true  "   ```"
    40  live=false commonmark=true  "   ```text"
    41  live=false commonmark=true  "   /grugops \"bootstrap this repo and propose safe first tick"
    42  live=false commonmark=true  "   ```"
```

`README.md` is a member of the LANG-03 watched corpus and of the banned-claims public-document scan,
so those six lines — two CLI examples — are read as governed prose by every gate that reaches them.
Nothing reds today, and **the reason the direction stays fail-closed is an accident of the corpus
rather than a mechanism**: the four delimiters happen to pair up, so the toggle re-synchronises. An
odd number of indented delimiters in any document desynchronises the toggle for that document's whole
tail, and the direction inverts.

## 6. The human decision, verbatim

**Decision: `reopen-for-survivors` — "Reopen for the surviving adversarial variants only."**

**Made by:** the human operator (repo owner, Olger Oeselg).
**When:** 2026-08-15, through the orchestrator's checkpoint presentation during
`/gsd-execute-phase 29`.

What the human was shown, and accepted:

- All three original reproductions (CR-02, WR-01, CR-01) re-run from the round-2 review's own
  recipes and now failing closed, tree confirmed clean of plants.
- **R4 as NON-EMPTY** — four surviving adversarial variants: V-29-26-01 (setext heading, fail-open,
  0 live), V-29-26-02 (the LANG-07 scans read 41/49 and 47/53 while claiming tree-wide, 0 found in
  the unread sets), V-29-26-03 (`FENCE_DELIMITER_LINE` prefix test, fail-open, 0 live), V-29-26-04
  (indented fence delimiter; **6 live lines of `README.md` classified as governed prose today**;
  fail-closed only by the accident that the four indented delimiters pair up, and an odd count in any
  document inverts the direction to fail-open).
- **R5** — the nineteen further residuals the plan's own checkpoint text did not enumerate. That
  count is the orchestrator's, taken at the checkpoint; this SUMMARY does not re-derive it, and the
  transcript's §7 names four of them in prose rather than all nineteen.

The rationale the orchestrator recorded for recommending this option: the round's own standard refuses
to close while a reproduced bypass is on the record; V-29-26-04 is live today with an accidental
rather than mechanical safe direction; V-29-26-01 and V-29-26-03 are the CR-02 defect SHAPE reached
by a different route; and all three of -01, -03 and -04 live in the FENCE authority's grammar rather
than the section locator, so they are plausibly ONE follow-up plan rather than four.

The two options the human did **not** take, recorded so the choice reads as a choice: `accept-and-close`
(accept R1 through R3 and close the round) and `reopen-for-r1` (reopen to resolve Residual 4 now).

## 7. THE ROUND IS REOPENED, NOT CLOSED

**Gap-closure round 2 does NOT close.** Plan 29-26 is complete; the round it belongs to is not, and
phase 29 is not.

- Do **not** mark phase 29 complete.
- Do **not** mark LANG-03, LANG-04, LANG-06 or LANG-07 verified or closed. This plan's frontmatter
  names them as the requirements it bears on, not as requirements it satisfies.
- Re-verification does **not** run on this tree. The four failed round-2 truths stay failed.
- Nothing in this plan asserts the round closed.

## 8. Hand-off: the charter for round 3

The decision implies exactly this scope, and no more.

**In scope — the four surviving variants of §5.**

| finding | authority | direction | live input set | note for the planner |
|---|---|---|---|---|
| V-29-26-01 | fence / heading grammar — setext not recognised | fail-open | 0 | the remedy needs a frontmatter carve-out `readCavemanFence` does not have, because it is handed raw file text; **37 of 40 documents carry a frontmatter terminator a naive setext reader adopts** |
| V-29-26-02 | the derived owner and duplicate-assertion scans | scope claim | 0 in the unread sets | the ANSWER is right and the SCOPE is short — 41/49 and 47/53, two of the misses under `scripts/` itself because `readdirSync` does not recurse |
| V-29-26-03 | `FENCE_DELIMITER_LINE` — a prefix test where CommonMark counts run length | fail-open | 0 | a four-backtick fence is closed early by a three-backtick run inside it |
| V-29-26-04 | `FENCE_DELIMITER_LINE` — column-zero anchored where CommonMark allows up to three spaces | fail-closed **by accident** | **6 live lines of `README.md`** | the only live one; the safe direction rests on the four delimiters pairing up, so an odd count inverts it |

**The orchestrator's structural observation, carried forward:** -01, -03 and -04 all live in the
**fence authority's grammar** rather than in the section locator, so they are plausibly **ONE**
follow-up plan rather than four. -02 is a different shape — a scope claim — and this repository's
recorded remedy for it is to derive the set and assert its cardinality against an independently
derived count, not to widen a walk and re-assert the same number.

**Out of scope for round 3 unless separately decided:** R1 (Residual 4), R2 (the seven round-1
carry-overs), R3 (T-29-23-05), and the further residuals of R5. The human reopened for the survivors
**only**.

### WARNING for whoever plans round 3 — the finding ids COLLIDE across rounds

Round 1 and round 2 **reuse the same finding ids for different findings.** A round-3 planner reading
"WR-01" without naming its round will fix the wrong defect.

- Round-1 **WR-01** is *voice-guard line numbers reported from the filtered remainder*. Round-2
  **WR-01** is *the quoted-anchor false red* — a different defect, already closed by plan 29-20.
- The same collision holds for WR-03, WR-04, WR-07, WR-08 and IN-04, all of which appear in **both**
  rounds' registers naming different things.
- **`IN-02` is the ONLY id that is the same finding in both rounds.** `29-REVIEW.md:544` says so in
  as many words: "Round-1 IN-02, unchanged."
- The four findings this plan raised are deliberately id'd `V-29-26-NN` — plan-scoped and
  round-proof — precisely so they cannot join the collision.

**Always write the round with the id.** The round-1 register lives in `29-REVIEW.md`'s "Known-open
from round 1" section; the round-2 register lives in `29-20-PLAN.md`; the round-2 review's own
findings live in `29-REVIEW.md`. `29-VERIFICATION.md` is the round-**1** record and is stale for this
purpose.

## Deviations from Plan

### Deviations recorded, none auto-fixed

**1. [Plan under-specification, corrected at execution] The oracle has SEVEN axes, not six.**
- **Found during:** Task 1
- **Issue:** the plan named six axes. Every invariant is phrased "at most the requested level", and
  `sectionEndIndex`'s `level` parameter has two legal values, so a sweep asking one of them tests
  half the predicate.
- **Resolution:** the requested level was added as a seventh axis, taking the cell count to 7200.
- **Commit:** `f4212f6`

**2. [Rule 1 — Bug, in this plan's own artifact] The oracle's set key carried two NUL bytes.**
- **Found during:** Task 1, after the sweep first ran
- **Issue:** the distinct-document key was assembled with a separator that embedded NUL bytes into
  the test source — the same defect class this repository recorded at phase 27 (a raw NUL byte in a
  test source, found only because a digest claim was made measurable).
- **Fix:** the key separator was replaced. Sweep numbers unchanged.
- **Commit:** `b828c1a`

**3. [Plan expectation vs measurement] The transcript records SIX predicates, where the plan and the
round-2 review name four.**
- **Found during:** Task 2
- **Issue:** the review's WR-08 table named four; plan 29-22 found a fifth by derivation
  (`readDispositionRows`, which located its section with a substring search and so matched neither of
  the review's two sketched constructs); plan 29-25's tree-wide scan found a sixth
  (`audit-model.ts::tableUnder`).
- **Resolution:** the transcript records the measured six. **A derivation built to the review's
  sketch would have re-found the four somebody had already written down and re-missed the fifth,
  inside the fix written to stop that happening.**

**4. [Plan expectation vs measurement] The consumer list is FIVE where the plan predicted four.**
- **Resolution:** the number written down is what the derivation REPORTED.

**5. [Measurement corrected in-session] The setext reachability scan first reported 37 and was wrong.**
- **Issue:** it counted each document's frontmatter TERMINATOR, which always follows a non-blank key
  line and therefore satisfies the setext form.
- **Resolution:** the corrected scan excludes the frontmatter region and reports **0** in document
  bodies. Both numbers are recorded, because the wrong one is the finding's most useful fact.

**Nothing found in Task 2 was repaired in Task 2.** Four surviving variants were recorded by name
with their reproductions and left live, per the plan's own prohibition: a measurement plan that
repairs what it measures has graded its own paper.

## Known Stubs

None. This plan added one test module and one audit document; it modified no production source.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
No package-manager install occurred; the dependency set is unchanged and `package.json` is
byte-unchanged, so T-29-26-SC's input set is empty as planned.

## Verification

| # | criterion | result |
|---|---|---|
| 1 | the oracle passes over its full derived cell count and fails against the broken implementations | 7200 cells green; 1836 and 1440 cells red under the two probes |
| 2 | all three original reproductions re-run from the review's recipes, now fail closed, tree left clean | done — §3; `git status --porcelain` shows only the three pre-existing out-of-scope entries |
| 3 | at least eight adversarial variants recorded with outcomes, successes and failures alike | **32** recorded — §4 |
| 4 | `docs/audit/29-locator-unification.md` exists and every command in it is re-runnable | yes |
| 5 | seven gates exit 0; `npx vitest run --exclude '**/scripts/e2e/**'` exits 0; `npm run freshness` exits 0 | see the gate transcript below |
| 6 | the human decision recorded verbatim in the SUMMARY, with the timestamp and the name of who made it | §6, and transcript §8 |

Bare `npm test` was never run: it triggers the live claude-CLI e2e lane.

### The gate transcript, after the decision record landed

```
check-foundation-guards      -> exit=0   ALL CHECKS PASSED
check-imperative-lexicon     -> exit=0   ALL CHECKS PASSED
check-diff-disposition       -> exit=0   ALL CHECKS PASSED
check-banned-claims          -> exit=0   ALL CHECKS PASSED
check-audit-register         -> exit=0   ALL CHECKS PASSED
check-claim-anchors          -> exit=0   ALL CHECKS PASSED
check-public-docs-vocabulary -> exit=0   ALL CHECKS PASSED

npx vitest run --exclude '**/scripts/e2e/**'
  Test Files  52 passed (52)
       Tests  1878 passed | 2 skipped (1880)     exit=0

npm run freshness  -> exit=0   All build outputs fresh: 48 committed .js file(s) match a fresh
                               tsc rebuild.
npx tsc -p tsconfig.tests.json --noEmit -> exit=0
```

No disposition row is owed: this plan modified no file in the LANG-03 watched corpus, and
`check-diff-disposition` exits 0 with the transcript in place. None was invented.

**A green suite is a floor, not proof.** It was green in the session that shipped the four findings
above, and this phase has recorded that coexistence twenty-four times.

## Self-Check: PASSED

Artifacts confirmed on disk:

```
FOUND: scripts/section-locator-oracle.test.ts
FOUND: docs/audit/29-locator-unification.md
FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-26-SUMMARY.md
```

Commits confirmed in `git log --oneline --all`:

```
FOUND: f4212f6   test(29-26): a parser oracle over the one section-locator authority
FOUND: b828c1a   fix(29-26): the oracle's set key carried two NUL bytes
FOUND: b5e00c3   docs(29-26): the locator unification as a re-runnable transcript
FOUND: 82dd031   docs(29-26): the human reopens the round for the four surviving variants
```

`git diff --diff-filter=D HEAD~1 HEAD` is empty — the decision commit deleted no tracked file.
