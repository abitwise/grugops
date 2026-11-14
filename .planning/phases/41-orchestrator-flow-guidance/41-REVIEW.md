---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-14T20:00:39Z
depth: standard
diff_base: 2ab32fe8b34c0c2870c3de0d4af140ac02cd4776
files_reviewed: 13
files_reviewed_list:
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
  - docs/audit/29-style-dispositions/41-29.md
  - docs/audit/41-residuals.md
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 41: Code Review Report (incremental, UAT write-back of 2026-11-14)

**Reviewed:** 2026-11-14T20:00:39Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

This review covers `git diff 2ab32fe8..HEAD -- docs/audit`, which is one commit (`5503f84b`). It writes back Olger's rulings
from 41-UAT tests 13, 14 and 15 of 2026-11-14.

Checked and found correct:

- The table edits only change the prefix. A word diff over `docs/audit/29-style-dispositions` removes 160
  `pending (named human):` prefixes and adds 156 `accepted by Olger (41-UAT test 14, 2026-11-14):`, 2
  `accepted by Olger (41-UAT test 13, 2026-11-14):` and 2 `superseded by plan 41-19|41-24 ... ruled by Olger (41-UAT test 15,
  2026-11-14):` prefixes. No comparison text changed.
- Each file's count of accepted rows matches the count in test 14's note: 41-19 25, 41-20 6, 41-21 6, 41-22 13, 41-23 40,
  41-24 4, 41-25 20, 41-26 17, 41-27 25, and 41-29 2 for test 13.
- No table row in any `docs/audit/29-style-dispositions/*.md` still reads `pending (named human)`.
- `node scripts/check-diff-disposition.js` exits 0 at HEAD.

The defects are all consistency defects in the audit trail. Prose in the touched files still says rows are pending, and two
sentences became false in this commit. The new "ruled by Olger (test 15)" prefixes cite a question that the record does not
hold. The R-41-11 row and the security log were not updated to match the new ruling. Every new acceptance rests on a reply with
no typed name, which this phase's own records say is not enough for a named-human acceptance.

## Warnings

### WR-01: Pointer sentences say "pending a named human" or "No row above changed", and this commit made them false

**File:** `docs/audit/29-style-dispositions/41-11.md:116-117`, `docs/audit/29-style-dispositions/41-11.md:125-126`,
`docs/audit/29-style-dispositions/41-27.md:41-42`, `docs/audit/29-style-dispositions/41-27.md:94-95`

**Issue:** These sentences state a current fact about other rows, and this delta changed that fact without updating them.

- `41-11.md:116-117`: "The row at Workflow 17 line 86 ... was not accepted in 41-UAT.md test 4. Plan 41-19 rewrote that
  clause ... No row above changed." This commit changed that row (line 108) to `superseded by plan 41-19 ..., ruled by Olger
  (41-UAT test 15, 2026-11-14)`. "No row above changed" is now false, and the paragraph does not mention the test 15 ruling.
- `41-11.md:125-126`: "Their new rows are in `41-27.md`, pending a named human." This commit accepted every row in `41-27.md`
  (test 14).
- `41-27.md:42`: "... and the new rows below are pending." Every row below now reads `accepted by Olger (41-UAT test 14, ...)`.
- `41-27.md:94-95`: "Their new rows are in `41-28.md`, pending a named human." The 41-28 rows were accepted in test 12 on
  2026-11-13, and this write-back of a later test did not correct the sentence.

The same defect, caused by this delta, is in two files outside the review list: `41-08.md:47` ("Its new row is in `41-27.md`,
pending a named human.") and `41-28.md:39` ("Every plan 41-27 row this plan replaces reads `pending (named human)`."). Those
41-27 rows now read `accepted by Olger (41-UAT test 14, ...)`. So 41-28's heading "**No accepted row is superseded.**" is no
longer an accurate description of the rows it superseded.

**Fix:** Make each pointer match the record, and add a dated note rather than rewriting history. For example:

```markdown
<!-- 41-11.md:116-117 -->
The row at Workflow 17 line 86, the sentence that a later sweep reclaims a row with an empty `by`, was not accepted in 41-UAT.md
test 4. Plan 41-19 rewrote that clause under review finding WR-11 (D-43), and its rows are in `41-19.md`. On 2026-11-14 Olger
ruled the row superseded in 41-UAT.md test 15; only its disposition prefix changed.

<!-- 41-11.md:125-126 and 41-27.md:94-95 -->
Their new rows are in `41-27.md`, accepted by Olger in 41-UAT test 14 (2026-11-14).
Their new rows are in `41-28.md`, accepted by Olger in 41-UAT test 12 (2026-11-13).
```

Apply the same edit to `41-27.md:42`, `41-08.md:47` and `41-28.md:39`.

### WR-02: Each "How these rows were made" section still says every row reads `pending (named human):`

**File:** `docs/audit/29-style-dispositions/41-11.md:21-23`, `41-18.md:15-17`, `41-19.md:22-23`, `41-20.md:20-22`,
`41-21.md:22-24`, `41-22.md:29-31`, `41-23.md:35-36`, `41-24.md:19-21`, `41-25.md:28-29`, `41-26.md:49-50`,
`41-27.md:55-56`, `41-29.md:40-41`

**Issue:** Every touched file still says, in the present tense, "Each row reads `pending (named human):` ... it stays pending
until the named human reads the row against the diff." After this commit no row in any of these files reads that. The stale
text has already caused a miscount. In test 12 of `41-UAT.md`, the verifier counted 17 "pending" rows in `41-28.md` because
it also counted two prose mentions; the true count was 15. Test 4 also counted with grep ("93 lines match the phrase"). Any
later grep for open rows will again find about 19 false hits across `41-*.md`. Earlier write-backs (41-11 after test 4, 41-28
after test 12) left the same prose, so this is a repeated pattern, not new to this commit. This commit still makes it worse
across 11 more files.

**Fix:** Put the sentence in the past tense and add one line saying where the ruling is recorded. For example:

```markdown
Each row was written as `pending (named human):` followed by the agent's comparison. That comparison is advice. Olger ruled
the rows in 41-UAT.md test 14 on 2026-11-14; each row's prefix records the ruling.
```

If the prose has to stay as written, have the verifier and any count script match only table rows
(`^\| .*\| pending \(named human\):`). Say so in `scripts/check-diff-disposition.js`'s docs or in the UAT template.

### WR-03: "Accepted by Olger" is written onto 160 rows from replies with no typed name, which the phase's own standard treats as insufficient

**File:** every changed row in `41-19.md` to `41-27.md` and `41-29.md`; `41-11.md:108`; `41-18.md:24`;
`docs/audit/41-residuals.md:52`

**Issue:** The replies recorded in `41-UAT.md` are `pass` (test 13, followed by a menu choice "Adopt suggestion: defer"),
`accept all 156` (test 14) and `pass` (test 15). None of them includes a typed name. Every earlier acceptance in this phase that
grants a disposition or a residual includes one: test 4 `..., Olger`, test 5 `..., Olger`, test 6 `B, Olger`, test 8
`..., Olger`. The phase also says outright that an untyped choice is not a named acceptance:

- `41-25.md:8`: "That ruling was a menu selection without a typed name. Task 3 of plan 41-25 asks a named human to accept ...
  by name."
- D-44 (`41-CONTEXT.md:101`) and residual R-41-10 (`41-residuals.md:22`) repeat this.
- Threat T-41-108 (`41-SECURITY.md:142`, high, Repudiation) is "an agent writing an acceptance, a name or a date the human did
  not type".

In this commit the agent supplied the name "Olger" in every prefix. Test 12 (`41-28.md`) already set this precedent, outside
this delta. Even so, the record now contradicts the rule it uses for R-41-10. A reader cannot tell from the dispositions which
acceptances carry a typed name and which do not.

**Fix:** Do one of the following.

- Get a reply with a typed name for tests 13 to 15, such as `accept tests 13-15, Olger`, and quote it verbatim in
  `41-UAT.md` and in the `## Ruling of 2026-11-14` section.
- Record in the dispositions how the reply was given, for example `accepted by Olger (41-UAT test 14, 2026-11-14, reply
  "accept all 156", given in the session without a typed name)`. Then add a D-NN to `41-CONTEXT.md` stating that a reply in an
  attended UAT session counts as a named acceptance, so it no longer conflicts with D-44 and T-41-108.

### WR-04: The superseded rows cite test 15 as their ruling, but test 15 as recorded never put those rows to Olger

**File:** `docs/audit/29-style-dispositions/41-11.md:108`, `docs/audit/29-style-dispositions/41-18.md:24`,
`docs/audit/41-residuals.md:50-54`

**Issue:** Both held-back rows now read `superseded by plan 41-19|41-24 (...), ruled by Olger (41-UAT test 15, 2026-11-14):`.
In `41-UAT.md`, test 15's title, `expected` and `why_human` are only about R-41-11. Olger's ruling is recorded as "replied
'pass' ... to R-41-11 as rewritten and to the suggestion presented with it", and the suggestion's text is not recorded
anywhere. The `## Ruling of 2026-11-14` section of the residuals file covers only R-41-11 and does not mention the two rows.
So a reader who follows the prefix to "41-UAT test 15" finds no record of a question about Workflow 17:86 or Workflow 16:31,
and cannot tell what Olger agreed to. "Superseded", "accepted" and "sent back" are all possible readings. Under this project's
"no fabrication / the trace is the proof" rule, a ruling that cannot be traced back is a defect in the audit trail.

**Fix:** Record the question verbatim at the place the prefix points to. Add the suggestion's text to test 15 in `41-UAT.md`
(`suggestion: "Mark the held-back rows ... superseded by plans 41-19 and 41-24"`). Then add one sentence to the paragraphs
after each table, `41-11.md:116-117` and `41-18.md:29-30`, for example: "In 41-UAT.md test 15 on 2026-11-14 Olger replied `pass`
to the suggestion '<verbatim>', so the row reads superseded."

### WR-05: Residual R-41-11 and the security log still describe Olger's read of the rewritten row as owed

**File:** `docs/audit/41-residuals.md:23` (out-of-scope consequence: `.planning/phases/41-orchestrator-flow-guidance/41-SECURITY.md:231-232`, `:281`)

**Issue:** The new ruling section says Olger confirmed that his acceptance covers the sentence "A standalone Claude Code install
has no hook". The R-41-11 row itself (line 23, "why it was accepted") still cites only "Olger accepted the limit on 2026-11-12
in `41-UAT.md` test 8 (see the ruling of 2026-11-12 below)". That standalone sentence was added after the 2026-11-12
acceptance, and line 7 makes each row the authoritative status. Earlier rulings in this file were written into the row cell
too, for example "(see the ruling of 2026-11-12 below)". The test 8 write-back also updated `41-SECURITY.md`; this write-back
did not. That file still says "Whether that acceptance covers a standalone Claude Code install having no route is still his to
say" (line 231) and "Owed by a named human ... Olger's read of R-41-11 as rewritten" (line 232). Its Accepted Risks Log row
(line 281) also cites only test 8.

**Fix:** Append to the R-41-11 why-cell: `Olger confirmed on 2026-11-14 in 41-UAT.md test 15 that this acceptance covers a
standalone Claude Code install having no route (see the ruling of 2026-11-14 below).` Then add a dated line to `41-SECURITY.md`
that closes the item owed at lines 231-232, and add test 15 to the R-41-11 Accepted Risks Log row.

## Info

### IN-01: The new ruling section was appended after "Assumptions carried from research", away from the other ruling sections

**File:** `docs/audit/41-residuals.md:50`

**Issue:** `## Ruling of 2026-11-10` (line 25) and `## Ruling of 2026-11-12` (line 35) come directly after the residuals table.
`## Ruling of 2026-11-14` comes after `## Assumptions carried from research` (line 43). A reader who scans the rulings in
order can stop at the Assumptions heading and miss the newest one.

**Fix:** Move the section to just before `## Assumptions carried from research`.

### IN-02: "its row accepted" is singular, but plan 41-19 replaced the clause with two rows

**File:** `docs/audit/29-style-dispositions/41-11.md:108`

**Issue:** The prefix reads `superseded by plan 41-19 (its row accepted by Olger, 41-UAT test 14)`. Plan 41-19 replaced the
empty-`by` clause with two rows, `41-19.md:49` ("A row with an empty `by` names no adapter.") and `41-19.md:50` ("A sweep after
the TTL reclaims one whose directory holds no usable record."). The prose at `41-11.md:117` already says "its rows are in
`41-19.md`". The 41-18 prefix is correct, because `41-24.md:28` is one row.

**Fix:** `superseded by plan 41-19 (its rows at 41-19.md lines 49-50 accepted by Olger, 41-UAT test 14), ...`

---

_Reviewed: 2026-11-14T20:00:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
