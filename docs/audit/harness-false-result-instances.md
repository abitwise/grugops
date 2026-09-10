# Logged instances of a verification harness producing a FALSE RESULT about its own premise

**Scope: Phase 31 (`31-autonomous-manual-testing`), every instance this phase's own records NAME.**
Written 2026-09-10 by plan `31-30`, gap-closure round 6 wave 4.

## Why this file exists

`docs/audit/31-round5-residuals.md` §9.4 measured the phase's running count COLLIDED:

> `31-22-SUMMARY.md` calls its ORDER-mirror correction "the **ninth** logged instance";
> `31-25-SUMMARY.md` calls its PROBE 2(b) correction "the **ninth** logged instance". Two plans of the
> same round both claimed number nine, and `31-21`, `31-23` and `31-24` each recorded further
> instances without numbering them.
>
> … the sixth round should treat the running count as an unreconciled tally, not as an index. What
> would close it: one derived list of the instances, in one place, with the numbering read off that
> list rather than typed into each summary.

This is that list. **The ordinal is READ OFF this table.** It is not typed into a summary, and a
future record that needs an ordinal takes the next one from here.

**No SUMMARY was edited to produce this file, and none ever will be.** A prior SUMMARY is history: it
records what its author measured and believed on the day it was written. `31-22-SUMMARY.md` and
`31-25-SUMMARY.md` both still say "ninth", because both authors wrote that in good faith against a
count neither could see the other incrementing. The disagreement is ANNOTATED here, in the
`ordinal the record claimed` column, rather than repaired anywhere else.

## The instances

| # | Plan / document | The harness | The premise that was false | How it was caught | Ordinal the record claimed |
|---|---|---|---|---|---|
| 1 | `31-08-SUMMARY.md:122` | the write-probe script for the note-write chokepoint | it counted files under `<contextRoot>/tasks/<task>/notes`, a directory that never exists, so it could not have seen a written file even if one had been written | the PRE-FIX control arm, which printed `WROTE id: …` and `files AFTER: 0` in the same breath — an impossible pair | (unnumbered) |
| 2 | `31-10-SUMMARY.md:371` | the throwaway refusal-family probe | its `authority=` column was computed over a TRUNCATED message, so it read `other` for all eight families | the uniformity of the answer across eight families that are known to differ | (unnumbered) |
| 3 | `docs/audit/31-round4-residuals.md:462` (the harness of `31-16`/`31-17`/`31-18`) | the mutation harness | it measured a STALE artifact: the mutant failed to build and the previous `.js` stayed on disk | recorded in round 4's residuals as the same shape as instance 4 | claimed **seventh** |
| 4 | `docs/audit/31-round4-residuals.md:461`, `31-20-SUMMARY.md:349` | the `DECIDER_MANIFEST` walk | its closing-brace pattern was taken from the `.ts` source (two-space indent) while the emitted `.js` indents with four, so the walk matched ZERO deciders and reported `0 mismatches` — a green from an empty denominator | a vacuity floor and a count equality added to the harness itself (`entries > 0`, parsed entries equal to 64-hex literals in the region), not by the number looking wrong | claimed **eighth** |
| 5 | `31-21-SUMMARY.md:112` | the GOV-02 ledger probe | its first run installed a fixture that could not reach the ledger append at all | the plan's own in-probe premise assertion | (unnumbered — recorded as "first instance of a false premise in this plan") |
| 6 | `31-21-SUMMARY.md:227` | the `admitAndAppend` transpose probe | its first transpose anchor did not land where the probe assumed | the plan's own premise assertion | (unnumbered — recorded as "second false premise") |
| 7 | `31-21-SUMMARY.md:424` | the symlink shape probe | its first run used RELATIVE symlink targets, which resolve against the link's own directory rather than the probe root | the plan's own premise assertion, which the plan records as "the one this probe exists to catch" | (unnumbered — recorded as "Third false premise") |
| 8 | `31-22-SUMMARY.md:481` | the ORDER mirror | the mirror did not measure the order it claimed to | the plan's own re-derivation | claimed **ninth** |
| 9 | `31-24-SUMMARY.md:556` | the mutation harness, a SECOND occurrence of instance 3's shape | MUTANT 1's first draft left `position` unused (TS6133), `npm run build` failed, the previous `.js` stayed on disk, and the run reported `235 passed` — a broken mutant read as a passing one | the harness now asserts the build's exit code AND greps the rebuilt `.js` for the mutant's own marker before reading any result | (unnumbered — recorded as "the third round in this phase in which a verification harness produced a false result") |
| 10 | `31-25-SUMMARY.md:358` | the `PROBE 2(b)` depth harness | it used a depth bisected through a CHILD PROCESS for an IN-PROCESS parse; a vitest worker thread runs with a different stack size, so the parse succeeded and `visited` came back 2 — read as a defect in the boundary rather than a false premise in the harness | the depth is now discovered IN PROCESS, where it is consumed | claimed **ninth** (the SECOND claim on that number) |
| 11 | `docs/audit/31-round5-residuals.md:111`, `31-26-SUMMARY.md:328` | the top-level dial-key probe | the probe did not exercise the reader it reported on | `readGovernanceConfig` was called directly and its answer printed | claimed **tenth**, hedged as "at least the tenth" because the author could see the tally was unreconciled |
| 12 | `31-27-SUMMARY.md:363` | the `R-31-19-07` reproduction | the first attempt's harness did not reproduce the shape it claimed | the harness was REBUILT rather than its output believed | (unnumbered) |
| 13 | `31-30` (this plan), `scripts/check-platform-shapes.ts` | the platform shape corpus, GOV-02 ledger position | the position was staged with no governing configuration, so `appendNote` wrote the note and never reached the ledger append at all — the row would have reported "not refused" for a position that was never driven | the CONTROL and the non-regular-file shapes returned the SAME verdict at that position, which is impossible if the position is being driven; the fixture now writes `context: { human_admission: "high-severity", audit_retention: "retained" }` before the shape is planted | read off this list |
| 14 | `31-31` (this plan), `docs/audit/31-round6-residuals.md` §7.4 | the CR-17 manifest-position derivation | the derivation's block pattern was taken from `hooks/hook-entry.ts` (two-space indent) and run against the committed `hooks/hook-entry.js` (four-space indent), so it matched ZERO positions; `wc -l` over the empty result answered 1 and the loop reported "bounded, named, DENY at 0 of 0 positions" — a green from an empty denominator, and instance 4's exact shape for the THIRD time in this phase | the printed denominator and the printed position list disagreed with each other; the derivation was REBUILT with an explicit non-zero premise assertion (`exit 1` on a zero-length result) rather than its output believed, and then reported 13 | read off this list |

## How this list's numbering relates to the ordinals prior documents typed

**They disagree, and the disagreement is the point.** Prior ordinals were typed into each summary from
a count each author reconstructed by reading. This list is derived from citations, in plan order, and
its numbering supersedes theirs GOING FORWARD only — nothing already written is rewritten.

| The claim a record typed | Where | This list's ordinal | Why they differ |
|---|---|---|---|
| "the **seventh** logged instance" | `docs/audit/31-round4-residuals.md` (about `31-16`/`31-17`/`31-18`) | **3** | the earlier count included instances from OUTSIDE phase 31 — see the scope note below |
| "the **eighth** logged instance in this phase" | `docs/audit/31-round4-residuals.md:461`, `31-20-SUMMARY.md:349` | **4** | same |
| "the **ninth** logged instance in this phase" | `31-22-SUMMARY.md:481` | **8** | same, plus the three unnumbered `31-21` instances (rows 5-7) which no running count had absorbed |
| "the **ninth** logged instance" | `31-25-SUMMARY.md:358` and `:474` | **10** | **THE COLLISION.** Two plans of round 5 both reached for number nine, because neither could see the other's increment. Both records stand as written. |
| "at least the **tenth** logged instance in this phase" | `docs/audit/31-round5-residuals.md:111`, `31-26-SUMMARY.md:328` | **11** | the author hedged with "at least" precisely because the tally was already known to be unreconciled |
| the collision itself, recorded | `docs/audit/31-round5-residuals.md:782`-`788`, `31-26-SUMMARY.md:336` | — | the measurement that produced this file |

## What this list does NOT settle

- **The pre-phase-31 project count is a DIFFERENT SCOPE and is not reconciled here.**
  `31-08-SUMMARY.md:130` says "This project's record names a false harness premise in six instances
  across four rounds" — that is the PROJECT's record across earlier phases, while round 4 and round 5
  both count "in this phase". The two scopes were never distinguished in prose, which is one reason
  the running tally drifted. This list is phase-31-scoped, stated in its title, and the project-wide
  count is left where it lives.
- **`31-23` is named by §9.4 as having "recorded a further instance without numbering it", and no such
  instance could be found in `31-23-SUMMARY.md`.** A grep for the recorded shapes returns the plan's
  premise ASSERTIONS (which are the discipline working) and no premise that turned out false. The
  claim is recorded here as UNSUBSTANTIATED rather than dropped, and rather than a row being invented
  for it. If a reader locates it, add the row and renumber from that point.
- **Whether every instance in the phase was ever WRITTEN DOWN.** This list is derived from the
  records; a harness that produced a false result and was silently corrected leaves no citation and
  cannot appear here. The count is therefore a floor, not a total, and that is stated rather than
  implied.

## The gate over this file

`scripts/uat-gate-exit-contract.test.ts` asserts, on every suite run:

- the ordinals in the table above are CONTIGUOUS from 1 and no ordinal appears twice;
- the round-5 collision is annotated here, and `31-22-SUMMARY.md` and `31-25-SUMMARY.md` still say
  what they said — history is not rewritten;
- the scanned document set is DERIVED (every `*-SUMMARY.md` of this phase plus every
  `docs/audit/31-*.md`) with its cardinality asserted, so a silently SHORT scan is red rather than
  green;
- every ordinal-claiming sentence found in that set names a document this file lists.
