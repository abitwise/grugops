---
id: ABC-106
status: done
column: Done
size: XS
priority: P2
epic: EPIC-003
feature: —
title: Three ruled tolerance rows in `src/san.parse.test.ts` still say the ruling is pending
---

# ABC-106 — the rows are right, the block above them says they are provisional, and the next author will believe it

> **Cut 2026-08-18 by BA/PM** (task `refinement-abc032-tolerances-2026-08-18`) as the one code-side
> consequence of ruling `ABC-032`'s `G5` / `G6` / `G7`. **A ticket rather than a page repair because
> the defect is inside `src/`, and BA/PM does not edit `src/`.**

## Problem

*User*: the engineer who builds `ABC-033` or `ABC-034` — both depend on `ABC-032` and both will read
these rows to learn what the input grammar accepts.

*Pain*: `src/san.parse.test.ts:382-389` heads three rows with
*"CHARACTERIZATION, not a demanded tolerance … whoever rules on them — BA/PM owns the page — is
ruling on behaviour that is written down"*, and the two row titles say *"not only the two the ticket
names"*. **As of 2026-08-18 the ruling exists and all three are ACCEPTED**: the redundant qualifier
and the mixed castle spellings are now entries 4 and 5 of `ABC-032`'s CLOSED tolerance list, and
`e8=K`'s code is accepted as delivered with the re-classification assigned to `ABC-034` `A8`. **A row
labelled "characterization, ruling pending" is a row the next author may delete or change freely.**
That is exactly backwards: these three now pin the specification.

*Value*: the guard says what it guards. **The rows do not move — only the words above them do.**

## Scope

- **`src/san.parse.test.ts` comments and `describe`/`it` titles only.** Re-label the
  `undisclosed input widenings…` block as ruled specification, cite
  `refinement-abc032-tolerances-2026-08-18` and `ABC-032` § Scope entries 4 and 5, and name the two
  bounds the rows already assert (`Ne4g5` refused, `o-o` refused) as the boundary of the tolerance
  rather than as an incidental observation.
- **The `e8=K` row's comment** gains the pointer to `ABC-034` `A8`, which now owns the placement.

## Out of scope

- **Any change to an assertion, a fixture or an expected value.** The rows are correct as they stand
  and this ticket must not "tidy" them.
- **Any production line.** `src/san.ts` is not touched.
- **Re-opening the ruling.** `G5` / `G6` / `G7` are ruled; a ticket that re-argues them is a
  different ticket and needs a reason this one does not supply.
- **`src/coordinate-move.test.ts:17`'s `A2_FEN_AS_WRITTEN` pin.** It is a deliberate record of a
  known-bad input and **stays**, on both its ticket pages and in that file.

## Acceptance (Given/When/Then)

- **`A1` (the label matches the status).** **Given** the delivered `src/san.parse.test.ts`, **when**
  the block at `:382` and its three rows are read, **then** no comment or title says the behaviour is
  undisclosed, unruled, pending a ruling, or "not a demanded tolerance", and each of the three names
  where it was ruled (`ABC-032` § Scope for `G5`/`G6`, `ABC-034` `A8` for `G7`).
- **`A2` (nothing executable moved).** **Given** the delivered diff, **when** `git diff` is read,
  **then** `src/san.parse.test.ts` is the **only** file changed, **every changed line is inside a
  comment or a `describe`/`it` title string**, the test count of that file is unchanged, the suite is
  green with skip **0**, and `PERFT_DEEP=1` is **32/32** exact.
- **`A3` (the bounds survive the edit).** **Given** the re-labelled rows, **when** they are run,
  **then** `Ne4g5` is still asserted `rejected`, `o-o` is still asserted `rejected`, and `e8=P` is
  still asserted `unreadable` — the three assertions that keep the accepted tolerances bounded.

## Dependencies

**Blocked on `ABC-032` merging.** The file does not exist on `main` until it does. Ordering only; no
other ticket blocks it and it blocks none.

## Security / NFR triggers

- **`N8-LANE`**: **no test file added, no executable line changed.** Expected lane effect **zero**.
  No measurement owed.
- **Security: no trigger.** Comments in a test file.

## Test notes

1. **Do not add a test.** Every assertion this ticket cares about already exists; `A2` is what stops
   one being added by accident.
2. **Quote the ruling's task id in the commit** so the next reader can find why the words changed.

## Lane cost — how many test FILES this ticket implies

**Zero.**

## Size and priority rationale

**Size `XS` (1).** One comment block and three titles. **What would make it larger:** touching an
assertion — at which point it is a behaviour ticket and needs its own argument.

**Priority `P2`, one step above `ABC-104`'s `P3`.** The audience is not hypothetical: `ABC-033` and
`ABC-034` are the next two tickets on this epic, both depend on `ABC-032`, and both read these rows.
A "provisional" label on a specification row is an invitation to delete it. **It should ride the
first touch of this file** rather than be pulled alone.

## Definition of Ready

Assessed against `agent-factory/checklists/definition-of-ready.md` by BA/PM, **2026-08-18**.
**Result: 10 of 10 MET. Requesting `Backlog`.**

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** the `ABC-033`/`ABC-034` author; a pending-ruling label on rows that are now specification |
| 2 | scope and out-of-scope clear | **✅** comments and titles only; assertions, fixtures and the `ABC-031` FEN pin explicitly fenced out |
| 3 | INVEST-shaped | **✅** independent once `ABC-032` merges; blocks nothing |
| 4 | acceptance testable and measurable | **✅** three criteria; `A2` is diff-shaped (one file, comment-only, unchanged test count, skip **0**, `32/32`); `A3` names the three assertions that must survive |
| 5 | dependencies known | **✅** one, named and blocking: `ABC-032` merge |
| 6 | security/NFR triggers with a measurable target | **✅** `N8-LANE` zero-file, expected effect zero; security not triggered |
| 7 | test notes present | **✅** two, including an explicit *do not add a test* |
| 8 | size assigned | **✅** `XS` (1), with the condition that would grow it |
| 9 | priority assigned | **✅** `P2`, with the reason it is not `P3` |
| 10 | no major unresolved blocker | **✅** none |
