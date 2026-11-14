---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-14T21:39:24Z
depth: standard
diff_base: d5af53231a43bb9bcfdb7e783b75fc3acde06640
files_reviewed: 15
files_reviewed_list:
  - docs/audit/29-style-dispositions/41-08.md
  - docs/audit/29-style-dispositions/41-11.md
  - docs/audit/29-style-dispositions/41-18.md
  - docs/audit/29-style-dispositions/41-19.md
  - docs/audit/29-style-dispositions/41-20.md
  - docs/audit/29-style-dispositions/41-21.md
  - docs/audit/29-style-dispositions/41-22.md
  - docs/audit/29-style-dispositions/41-23.md
  - docs/audit/29-style-dispositions/41-24.md
  - docs/audit/29-style-dispositions/41-25.md
  - docs/audit/29-style-dispositions/41-26.md
  - docs/audit/29-style-dispositions/41-27.md
  - docs/audit/29-style-dispositions/41-28.md
  - docs/audit/29-style-dispositions/41-29.md
  - docs/audit/41-residuals.md
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 41: Code Review Report (incremental, fixes for the 2026-11-14T20:00Z review)

**Reviewed:** 2026-11-14T21:39:24Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This review covers `git diff d5af5323..HEAD -- docs/audit`. That is commit `227be3fb`, which fixes WR-01, WR-02, WR-04,
WR-05, IN-01 and IN-02 of the previous review as record text. The commit also edited `41-SECURITY.md` and `41-UAT.md`, and
those two files were read only to check WR-04 and WR-05.

Checked and found correct:

- **WR-01.** The pointer sentences in `41-08.md:47`, `41-11.md:121`, `41-27.md:42` and `41-27.md:94` now name the test that
  ruled the rows: test 14 for the rows of `41-27.md` and test 12 for the rows of `41-28.md`. A tally of every table prefix
  matches. Each of the 25 rows of `41-27.md` reads `accepted by Olger (41-UAT test 14, 2026-11-14)`, including the four rows for
  Workflow 16 line 32 and the row for Workflow 04 line 53. Each of the 15 rows of `41-28.md` reads test 12.
- **WR-02.** Each "How these rows were made" paragraph in 41-11, 41-18 and 41-19 to 41-29 is now in the past tense and names
  the ruling test. That test matches the table prefixes: test 4 plus test 15 for 41-11, test 15 for 41-18, test 12 for 41-28,
  test 13 for 41-29, and test 14 for the rest.
- **WR-04.** Test 15 of `41-UAT.md` now records the suggestion. Its quoted text, 'Plans 41-19 and 41-24 have since rewritten
  both sentences, ... mark the two old rows "superseded".', matches word for word the message that was shown to Olger with
  test 15. This was checked against the session transcript. `41-11.md:116` and `41-18.md:29` quote the same text.
- **WR-05.** The why-cell of the R-41-11 row now cites test 15. `41-SECURITY.md:233` adds a dated closing line, and the
  R-41-11 row of the Accepted Risks Log names test 15.
- **IN-01.** `## Ruling of 2026-11-14` now comes before `## Assumptions carried from research`, and its text was not changed.
- `node scripts/check-diff-disposition.js` exits 0. `check-banned-claims`, `check-claim-anchors`, `check-audit-register` and
  `check-state-paths` each exit 0. `scripts/check-diff-disposition.test.ts` plus `scripts/flow-guidance-text.test.ts` pass
  318/318, which matches the figure given in the `review:` note of test 15.

Defects found: the IN-02 fix adds a line citation that the same commit made wrong. One WR-01 fix leaves a bold lead-in that the
next sentence now contradicts. The authoritative ruling for test 15 still quotes only the reply that had no typed name.

## Warnings

### WR-01: The IN-02 fix cites "41-19.md lines 49-50", but this commit moved those rows to lines 48-49

**File:** `docs/audit/29-style-dispositions/41-11.md:107`

**Issue:** The prefix now reads `superseded by plan 41-19 (its rows at 41-19.md lines 49-50 accepted by Olger, 41-UAT test 14)`.
Those line numbers come from the previous review, which read `41-19.md` before this commit. The WR-02 edit in the same commit
joined the three-line "Every row here is about the queue" paragraph of `41-19.md` into two lines. That moved every table row
of the file up one line. At HEAD:

- `41-19.md:48` is "A row with an empty `by` names no adapter."
- `41-19.md:49` is "A sweep after the TTL reclaims one whose directory holds no usable record."
- `41-19.md:50` is "Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it."

So the citation names one correct row and one row that has nothing to do with the superseded clause. A reader who follows it
lands on a stop rule. The audit trail is meant to be the proof, so a disposition prefix with a wrong anchor is a defect in
that trail. Any later rewrap of `41-19.md` will move the rows again.

**Fix:** Name the rows by their text, which does not move. If line numbers are kept, use the correct ones:

```markdown
superseded by plan 41-19 (its rows "A row with an empty `by` names no adapter." and "A sweep after the TTL reclaims one whose
directory holds no usable record." accepted by Olger, 41-UAT test 14), ruled by Olger (41-UAT test 15, 2026-11-14): ...
```

### WR-02: 41-28's lead-in "**No accepted row is superseded.**" is still present tense, and the new next sentence contradicts it

**File:** `docs/audit/29-style-dispositions/41-28.md:39`

**Issue:** The previous review's WR-01 called this lead-in "no longer an accurate description of the rows it superseded". The
fix put the following sentence in the past tense and added "Olger accepted those rows in 41-UAT test 14 on 2026-11-14, after
this plan had replaced them." The lead-in did not change. The paragraph now says in the present tense that no accepted row is
superseded, and then says that the superseded rows are accepted. The test 14 retest note confirms that 6 rows of `41-27.md`
name sentences that plan 41-28 rewrote, and all 6 now read `accepted`. So "No accepted row is superseded" is false as of
2026-11-14.

**Fix:** Date the lead-in to the time the plan ran:

```markdown
**No accepted row was superseded when this plan ran.** Every plan 41-27 row this plan replaces read `pending (named human)`
then. Olger accepted those rows in 41-UAT test 14 on 2026-11-14, after this plan had replaced them.
```

### WR-03: The residuals' Ruling of 2026-11-14 still quotes only the untyped `pass`, so the authoritative record does not show the typed-name confirmation

**File:** `docs/audit/41-residuals.md:45-47`, `docs/audit/41-residuals.md:23` (why-cell)

**Issue:** This commit moved the section (IN-01), and its text still reads "... in `41-UAT.md` test 15 and replied: `pass`."
Both earlier ruling sections in the same file quote a reply that ends in a typed name: `..., Olger` at line 27 for 2026-11-10
and `..., Olger` at line 37 for 2026-11-12. The typed confirmation that closed the previous WR-03, `confirm tests 12, 13, 14,
15 as recorded, Olger`, appears only in the `confirmed:` fields of `41-UAT.md`, the disposition table and
`41-SECURITY.md:233`. It does not appear in this file. Line 7 makes each residual row the authoritative status. The R-41-11
why-cell that this commit added says only "Olger confirmed on 2026-11-14 in `41-UAT.md` test 15", and it points to this
ruling section.

So a reader of the residuals file sees an acceptance that rests on a reply with no typed name. T-41-108 (`41-SECURITY.md:142`)
and the D-44 standard treat that as not a named acceptance. The previous review's WR-03 fix asked for the typed reply to be
quoted "in `41-UAT.md` and in the `## Ruling of 2026-11-14` section". Only the first place was done.

**Fix:** Add the typed reply to the ruling section:

```markdown
Olger read R-41-11 as plan 41-26 rewrote it, with the added sentence "A standalone Claude Code install has no hook, like the
other hosts.", in `41-UAT.md` test 15 and replied: `pass`. He confirmed it by typed name the same day:
`confirm tests 12, 13, 14, 15 as recorded, Olger`.
```

## Info

### IN-01: The WR-02 edits broke the files' hard wrap; long joined lines now appear in 14 files

**File:** `docs/audit/29-style-dispositions/41-08.md` and `41-11.md` to `41-29.md`. Examples: `41-11.md:22`, `41-11.md:116`,
`41-18.md:16`, `41-28.md:39`.

**Issue:** These files wrap prose at about 130 characters. Before this commit, only one prose line in the 14 touched
disposition files was longer than 140 characters (in `41-08.md`). Now 21 such lines exist, and some are over 300 characters.
The edits joined wrapped lines instead of rewrapping them. That join changed the line counts, which caused WR-01. It also left
the line citations in the previous review and its disposition table off by one in most of these files.

**Fix:** Rewrap the edited paragraphs to the file's width. Re-check every line citation into these files after any rewrap, or
cite rows by their text.

### IN-02: "the Workflow 17 line 86 row" does not name one row, because 41-11 holds five rows at that line

**File:** `docs/audit/29-style-dispositions/41-11.md:22`

**Issue:** The new sentence reads "Olger ruled these rows in 41-UAT.md test 4 (2026-11-10) and the Workflow 17 line 86 row in
test 15 (2026-11-14)". `41-11.md` has five rows at Workflow 17 line 86, and test 4 ruled four of them. The paragraph at line
115 names the sentence, so a reader can work out which row is meant, but this sentence does not say. A similar problem is in
line 116: "On 2026-11-14 Olger ruled that row superseded" comes straight after "its rows are in `41-19.md`", so "that row" can
be read as one of the 41-19 rows.

**Fix:** In line 22, write "and the Workflow 17 line 86 row for the empty-`by` sentence in test 15". In line 116, write "Olger
ruled the 41-11 row superseded".

### IN-03: 41-08.md, which this delta touched, still has the present-tense "stays pending" paragraph, and the known-out-of-scope list leaves it out

**File:** `docs/audit/29-style-dispositions/41-08.md:22-23`

**Issue:** The paragraph still reads "each reads `pending (named human):` ... it stays pending until the named human reads the
row against the diff". All 8 rows read `accepted by Olger (41-UAT test 4, 2026-11-10)`. This text did not change in the delta,
so this finding does not re-raise it as a new defect. The record is wrong about one thing, though. The `review:` note of test
15 and the scope note list the files that still have this boilerplate as 41-04, 41-06, 41-14, 41-16 and 41-17. `41-08.md` is
missing from that list, even though this commit edited it (line 47).

**Fix:** Add `41-08.md` to the list of files deferred with the same boilerplate. Or, when the older files are swept, apply
the same past-tense sentence there: "Olger ruled the rows in 41-UAT.md test 4 (2026-11-10)".

---

_Reviewed: 2026-11-14T21:39:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
