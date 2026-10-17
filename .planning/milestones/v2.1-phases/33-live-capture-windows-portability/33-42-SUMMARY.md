---
phase: 33-live-capture-windows-portability
plan: 42
subsystem: live-capture
tags: [cap-01, cap-03, gap-d1, flip-manifest, hold-branch, gap-closure-round-4, cap-reached]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-4 capture reading OUTCOME fail (33-41, commits 3ed05944 and d385295f), the CAP-02 verdict NOT MET on run 36035067112 (33-40), and the flip manifest and its gate (33-07, 33-11)
provides:
  - 33-FLIP-MANIFEST.md § 9, the round-4 hold record, which states the cap-reached closure by human override with GAP-D1 open (D-20)
  - a fourth dated note in docs/audit/28-disposition-register.md under the examples/03-ticket-to-pr.md entry, without the F14 marker literal
affects: [33-43, phase-33-close, gap-d1]

# Actuals (#2632): chars/4 over the added lines of 320cfbbb..HEAD before this SUMMARY's commit (10697 chars).
# The plan's estimate (90000) was sized for the flip branch; the hold branch touches two files.
actuals:
  tokens: 2674
  tasks: 1
  commits: 1
plan_head_before: 320cfbbb9383497264940527854f7c1c6a334b12

tech-stack:
  added: []
  patterns:
    - "A hold at the cap is a closure record, not a path back. § 9 keeps §§ 7-8's shape but replaces 'the path back to the flip' with 'the closure', and it lists what a later phase's flip would need."

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-42-SUMMARY.md
  modified:
    - .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md
    - docs/audit/28-disposition-register.md

key-decisions:
  - "33-42 hold is mechanical under D-20. The round-4 outcome word is fail, so Task 1's one-way checkpoint was not presented and Task 2 (the flip) did not run. CAP-02 is also NOT MET (run 36035067112), so hold-for-ci would have been the only truthful option even on a pass."
  - "33-42 records the cap-reached closure: round 4 was the last round under the cap. Phase 33 closes by human override with GAP-D1 open and 33-R4-DIAGNOSIS.md filed. The D-07 predicate, the CAP-03 membership clause and the CAP-02 both-legs bar stand unsoftened (D-20)."

requirements-completed: []

coverage:
  - id: D1
    description: "Manifest § 9 hold record in §§ 7-8's shape: evidence quoted, every F/C row untouched, status pre-capture, both amendments still owed, the cap-reached closure named"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "node scripts/check-flip-manifest.js → exit 0, status pre-capture, ALL CHECKS PASSED, derivation byte-identical to the pre-edit run apart from the informational changed-set line"
        status: pass
      - kind: other
        ref: "grep -a -c '^## 9. Hold record' 33-FLIP-MANIFEST.md → 1"
        status: pass
    human_judgment: true
    rationale: "The closure by human override at the cap (D-20) is the human's to record. This record names it and does not perform it."
  - id: D2
    description: "Fourth dated disposition-register note pointing at § 9, without the F14 marker literal"
    requirement: CAP-03
    verification:
      - kind: other
        ref: "grep -a -c 'Discharged by plan 33-' docs/audit/28-disposition-register.md → 0"
        status: pass
      - kind: other
        ref: "git show --name-only 73a755f1 → exactly the two declared files"
        status: pass
    human_judgment: false

duration: "about 2 min of edits and gates, 2026-09-24T19:36:36Z to 19:38:20Z, after the context reads"
completed: 2026-09-24
status: complete
---

# Phase 33 Plan 42: The GAP-D1 flip or hold (round 4) Summary

**Hold branch, at the cap. The round-4 capture reads `OUTCOME: fail` and CAP-02 reads NOT MET, so nothing flips. `33-FLIP-MANIFEST.md` now has a § 9 hold record stating that Phase 33 closes by human override with GAP-D1 open and the diagnosis filed, never by a softened predicate (D-20). The disposition register has a fourth dated note pointing at § 9. Every F and C row is untouched, the status line still reads `pre-capture`, and the gate reports the same derivation as before.**

## Performance

- **Duration:** about 2 min of edits and gate runs (2026-09-24T19:36:36Z to 19:38:20Z), after the context reads
- **Tasks:** 1 executed (Task 3). Tasks 1 and 2 were not applicable.
- **Files modified:** 2

## Branch selection (quoted from the artifacts)

- **Outcome word:** `33-CAPTURE-SUMMARY.md`, section `Completion`, reads `OUTCOME: fail`. `grep -a -nE '^(OUTCOME|Outcome)'` returns one line, line 242.
- **What set it:** the `CAP-03 verdict (D-02) — run A` section reads `side (a): role grugops-orchestrator (toolu_01PW5KQrMewcEhH4bqXoFZxs) is not a member of the derived grant`. Both runs exited 0, and both D-04 rows read `yes`.
- **Parity:** the `Dual-path parity (D-07) — path-invariant projection` section returns five named differences. It does not read `parity: the two projections are equal`.
- **CAP-02:** `33-CI-MEASUREMENT.md` Part 5 § 5.3 reads `**CAP-02 verdict on this run: NOT MET.**` on run `36035067112`: ubuntu `success`, windows `failure` on one case in `scripts/board-watch-live.test.ts` (row 274).

Task 1's checkpoint is presented only when the word is `pass`, so it was not presented and no option id was selected. Task 2's precondition requires both `pass` and MET, so Task 2 did not run. Task 3 ran as written.

## Accomplishments

- **§ 9 appended** to `33-FLIP-MANIFEST.md`, in §§ 7-8's shape:
  - the decision (mechanical under D-20);
  - the evidence, with the outcome line, the CAP-03 sentence, the five parity differences verbatim, provenance MET, and the CI verdict line verbatim;
  - what the record does and does not change;
  - the cap-reached closure by human override with GAP-D1 open.

  It ends with what a later phase's flip would need, including the four human decisions in `33-R4-DIAGNOSIS.md` § 5.
- **Fourth dated note** added to `docs/audit/28-disposition-register.md`, beneath the round-3 note. It points at § 9 and does not carry the F14 marker literal.

## Gate output (quoted)

After the edits, and again after the commit, `node scripts/check-flip-manifest.js` exited 0:

```
[derivation] manifest .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md status: pre-capture (residual rule and commit-set rule not in force)
[derivation] live-surface parts: publicDocs 12, docsTree 7, planningLedgers 5, archivedRecords 4, runtimeEvidence 1; overlap 1; derived total 28, pinned 28
  PASS  live-surface set: 28 document(s) over 5 floored parts, pinned at 28
  PASS  every declared locator resolves in the pre-capture state: 62 flip row(s), 10 correction row(s), 2 exemption anchor(s)
[derivation] declared set (14): .planning/PROJECT.md, .planning/REQUIREMENTS.md, …
[derivation] changed set of HEAD (2): .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md, docs/audit/28-disposition-register.md — informational; the commit-set rule is not in force in the pre-capture state
== Result ==
ALL CHECKS PASSED
```

A `diff` of the full gate output before and after the edits, with the informational `changed set of HEAD` line excluded, is empty. The derivation did not change.

Other checks:

- `grep -a -c '^## 9. Hold record'` on the manifest returns `1`.
- `grep -a -c 'Discharged by plan 33-'` on the register returns `0`.
- `check-banned-claims`, `check-public-docs-vocabulary`, `check-claim-anchors`, `check-residual-citations`, `check-diff-disposition` and `check-nul-bytes` each read `ALL CHECKS PASSED`.
- A direct control-byte count on both edited files returns 0.
- `windows status` reads `open_count 239`, `waived_count 3`, `fixed_count 32`, `total_count 274`. This plan did not change it.

## Task Commits

1. **Task 1 (checkpoint:decision):** not presented, because the outcome word is `fail`. No commit.
2. **Task 2 (the flip):** not run, because its precondition is unmet. No commit.
3. **Task 3 (the hold branch):** `73a755f1` (docs). It touches exactly the two declared files.

Measured: `git rev-list --count 320cfbbb..HEAD` = 1 before this SUMMARY's commit.

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md`: § 9 appended. §§ 1-8 and the status line are unchanged.
- `docs/audit/28-disposition-register.md`: one dated note added under the `examples/03-ticket-to-pr.md` entry.

None of the fourteen declared flip-set files changed: the parity table, the ledgers, the archived records, the runtime-evidence record and `.planning/PROJECT.md` are all untouched. `.planning/REQUIREMENTS.md` was not edited. CAP-01, CAP-02 and CAP-03 stay Pending, and no requirement is marked complete.

## Decisions Made

See `key-decisions`. The hold is mechanical, and at the cap it is the phase's closure on GAP-D1. The override itself is the human's, and 33-43 records the round.

## Deviations from Plan

None. The plan was executed exactly as written on its hold branch.

## Issues Encountered

- `gsd-tools windows status` piped into `head` raised an `EPIPE` in the tool's own writer. It was re-read without truncation, and the counters above come from that read.
- `state.advance-plan` wrote `completed_plans: 311` with `percent: 100`, which is 311/312 rounded up while 33-43 is still unexecuted. The field was set back to `99` by hand, matching the previous floor reading of 310/312. After the STATE.md writes, `node scripts/check-foundation-guards.js` read `ALL CHECKS PASSED` with 0 FAIL lines, the longest line was 2524 (under 4000), and there were no doubled-backslash runs. ROADMAP.md reads `42/43 | In Progress`, so phase 33 was not flipped to Complete.

## Known Stubs

None. This plan changes documents only.

## Next Phase Readiness

- **For 33-43:** record round 4 and the cap-reached closure. GAP-D1 stays open. The four human decisions are in `33-R4-DIAGNOSIS.md` § 5, and the § 9 record is the manifest-side citation.
- Both flip amendments (`.planning/PROJECT.md` in the commit; the F14 literal set to the performing plan) stay owed to whichever later phase performs the flip.
- Nothing was pushed. `human-notes.txt` was left as the human's uncommitted modification.

## Self-Check: PASSED

- FOUND: 33-42-SUMMARY.md, 33-FLIP-MANIFEST.md (§ 9 count 1), docs/audit/28-disposition-register.md (F14-shaped marker count 0)
- FOUND: commit 73a755f1

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-24*
