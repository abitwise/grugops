---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-14T22:30:40Z
depth: standard
diff_base: 1151979e
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
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 41: Code Review Report (incremental, fixes for the 2026-11-14T21:39Z review)

**Reviewed:** 2026-11-14T22:30:40Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This review covers `git diff 1151979e..HEAD -- docs/audit`, which is commit `6ee6d8fe`. That commit fixes WR-01 to WR-03 and
IN-01 to IN-03 of the 2026-11-14T21:39Z review as record text.

Checked and found correct:

- **WR-01.** The superseded prefix at `41-11.md:110` now names the two `41-19.md` rows by their text, 'A row with an empty `by`
  names no adapter.' and 'A sweep after the TTL reclaims one whose directory holds no usable record.'. Both rows exist
  word for word at `41-19.md:50-51`, both are at Workflow 17 line 86, and both read `accepted by Olger (41-UAT test 14,
  2026-11-14)`. The cell has no `|`, and `check-diff-disposition` still passes.
- **WR-02.** `41-28.md:39` reads "**No accepted row was superseded when this plan ran.**". It agrees with the next two
  sentences.
- **WR-03.** `41-residuals.md:47` quotes `confirm tests 12, 13, 14, 15 as recorded, Olger`. This matches word for word the
  `confirmed:` fields of tests 12 to 15 in `41-UAT.md` and the closing line at `41-SECURITY.md:233`.
- **IN-02.** `41-11.md:23-24` names the Workflow 17 line 86 row by its sentence. `41-11.md:120` and `41-18.md:30` say "this
  file's row for that sentence", so the sentence no longer reads as pointing at a 41-19 or 41-24 row.
- **IN-03.** `41-08.md:23-25` is in the past tense and names test 4. All 8 rows of `41-08.md` read `accepted by Olger (41-UAT
  test 4, 2026-11-10)`, and test 4's note dates the ruling 2026-11-10 and lists 41-08.
- **IN-01 (rewrap).** `git diff --word-diff=porcelain` shows no word changes in 41-19 to 41-27 and 41-29. Across the delta, the
  only word changes are the six fixes above. The only table line that changed is the `41-11.md:110` row (WR-01). No added
  prose line is over 130 characters. No rewrapped line starts with a markdown block marker (`#`, `-`, `>`, `|`, or a list
  number). The code spans split across lines (`` `## Stop`` / ``conditions` `` in 41-27, 41-28 and 41-29, and `` `##`` /
  ``Commit` `` in 41-11) render as one span under CommonMark. Older disposition files such as `33.1-08.md` and `39-18.md`
  already split code spans this way.
- `node scripts/check-diff-disposition.js`, `check-banned-claims`, `check-claim-anchors`, `check-audit-register` and
  `check-state-paths` each exit 0 at HEAD.

Defects found: the rewrap moved a row that `41-UAT.md` cites by line number, so that citation is now wrong. This is the same
kind of defect as the previous WR-01. Three small wording points are listed under Info.

## Warnings

### WR-01: The rewrap of 41-18.md moved its WR-15 row from line 23 to line 24, and 41-UAT.md still cites `41-18.md:23`

**File:** `.planning/phases/41-orchestrator-flow-guidance/41-UAT.md:199` (the defect comes from the rewrap at
`docs/audit/29-style-dispositions/41-18.md:15-18`)

**Issue:** The artifacts list of gap G-41-7-WR-15 gives the path `"docs/audit/29-style-dispositions/41-18.md:23"`. At
`1151979e`, line 23 of `41-18.md` was the row "A target in the store that cannot be read is refused." (Workflow 16 line 31).
That is the row test 4 held back and test 7 sent to WR-15. This delta rewrapped the "How these rows were made" paragraph from
2 lines into 3. That moved the row to line 24. Line 23 is now the table's `|---|` separator line. The other line citations
into the reviewed files from records outside them still hold: `41-residuals.md:19`, `:23` and `:33` in `41-UAT.md` and
`41-SECURITY.md`. So this is the only citation the delta broke. The previous review's IN-01 asked for every line citation into
these files to be re-checked after a rewrap. The scope note does not say this one was checked.

**Fix:** Cite the row by its text, which does not move, or correct the number:

```yaml
    - path: "docs/audit/29-style-dispositions/41-18.md (the Workflow 16 line 31 row, 'A target in the store that cannot be read is refused.')"
      issue: "WR-15"
```

## Info

### IN-01: "its two Workflow 17 line 86 rows in 41-19.md" can be read as a count, but 41-19.md has three rows at that line

**File:** `docs/audit/29-style-dispositions/41-11.md:110`

**Issue:** `41-19.md` has three rows at Workflow 17 line 86 (lines 50, 51 and 52). The third is the stop rule "Stop and name
each entry `sweep` prints on a `kept` or `left` line, so a human resolves it." The quoted texts make clear which two rows are
meant. Still, "its two ... rows" says that 41-19 has two rows at that line, and a reader who counts finds three.

**Fix:** Write "two of its Workflow 17 line 86 rows in 41-19.md, '...' and '...'".

### IN-02: "the review of 2026-11-14" does not say which review, because several reviews carry that date

**File:** `docs/audit/41-residuals.md:47`

**Issue:** The new sentence reads "after the review of 2026-11-14 asked for one". The reviews of 2026-11-14T20:00Z and
2026-11-14T21:39Z both have that date, and this review does too. The review that asked for a typed name is the 20:00Z one, by
its WR-03. `41-UAT.md` (tests 12 to 15, `confirmed:`) names it that way: "Asked for after the 2026-11-14T20:00Z review
(WR-03)". The sentence is true, but it does not identify which review it means.

**Fix:** Write "after the 2026-11-14T20:00Z review (WR-03) asked for one".

### IN-03: 41-11 and 41-18 still describe the test 15 ruling as a reply of `pass`, without the typed-name confirmation the residuals now record

**File:** `docs/audit/29-style-dispositions/41-11.md:120`, `docs/audit/29-style-dispositions/41-18.md:30-31`

**Issue:** This delta edited both sentences (IN-02). Each still says that Olger ruled the row superseded in test 15 "replying
`pass` to the suggestion ...". The WR-03 fix added the typed confirmation `confirm tests 12, 13, 14, 15 as recorded, Olger` to
`41-residuals.md:47` only. The table prefixes cite test 15, and test 15's `confirmed:` field holds the typed name, so the trail
is complete through that citation. The prose alone, though, shows the supersession resting on an untyped reply. The previous
WR-03 named that shape as not a named acceptance under D-44.

**Fix:** Add one sentence after each quote: "He confirmed it by typed name the same day: `confirm tests 12, 13, 14, 15 as
recorded, Olger`."

---

_Reviewed: 2026-11-14T22:30:40Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
