---
status: complete
phase: 41-orchestrator-flow-guidance
source: [41-VERIFICATION.md]
started: 2026-11-08T18:57:45Z
updated: 2026-11-14T11:40:07.074Z
---

## Current Test

[testing complete]

## Tests

### 1. One live Claude Code run on a plugin install and one on a standalone install: spawn a role, have it publish a note with the command in Workflow 16 step 3, have it run `claim.js done`
expected: The role writes through tools/grugops/note.js, `done` exits 0, the row leaves now-running.md and `free` rises
why_human: role-route.test.ts and my own scratch run execute the literal commands on lone copies. Neither shows what a host's permission model lets a spawned role run. R-41-01 stays open until a named human reads a live run.
result: pass
source: automated
note: "Live headless runs on Claude Code 2.1.319, 2026-11-08, in scratch repos. Standalone (scripted --claude install): the Orchestrator ran free (3), claimed uat-1 --by grugops-system-analyst, spawned the adapter; the role ran `note.js add uat-1 --kind observation --by system-analyst` -> `noted`, then `claim.js done uat-1` -> `done uat-1`; done/uat-1.md exists, now-running.md has no rows, free went 3 -> 2 -> 3, the note is sealed. Plugin (--plugin-dir at HEAD fa3d8ca5, the installed v2.2 plugin switched off, plus a scripted install for the tools, plugin MCP connected): same route for uat-2, note.js exit 0, done exit 0, done/uat-2.md, free 3. Limits: (1) the plugin ships no agents, so the adapter in the plugin run came from this repo's .claude/agents through --add-dir, which matches the README's plugin + scripted-install pairing, not a plugin-only install; (2) headless -p ran with `Bash(node tools/grugops/note.js *)` and `Bash(node tools/grugops/claim.js *)` pre-allowed, which stands in for a human approving the prompt; interactively the installer writes no allow rule, so each call prompts. Transcripts: /tmp/claude-1000/-home-olger-projects-public-grugops/2842c817-5956-4dd1-82b2-d7b6642b98a2/scratchpad/uat41/standalone-run.jsonl, /tmp/claude-1000/-home-olger-projects-public-grugops/2842c817-5956-4dd1-82b2-d7b6642b98a2/scratchpad/uat41/plugin-run.jsonl. Closing R-41-01 / CR-01 still needs a named human to read this run (carried to test 5)."


### 2. Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04)
expected: The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js
why_human: These CLIs are absent here (R-41-05, `UNKNOWN - verify`). RUN-04's 'reads the same on all six hosts' is proven for the text only.
result: skipped
reason: "Deferred follow-up: carried to the milestone UAT, ruled by Olger on 2026-11-13 ('Defer both'), in line with the R-41-05 ruling of 2026-11-10. Rechecked 2026-11-13: codex, agy/antigravity, opencode, copilot and pi are still not installed here."

### 3. Windows run of note.js's trustedRepoRoot ladder
expected: Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)
why_human: Windows is `UNKNOWN - verify`; Linux only was measured.
result: skipped
reason: "Deferred follow-up: carried to the milestone UAT, ruled by Olger on 2026-11-13 ('Defer both'). Needs a Windows machine; none is reachable from this session (no pwsh or wine either). No residual row covers it yet."

### 4. Read the `pending (named human)` rows in docs/audit/29-style-dispositions/41-*.md (93 lines match the phrase, counted by grep; includes 41-14, 41-17 and 41-18), the last row of 41-16.md, and the Manual-Only rows of 41-VALIDATION.md
expected: A named human replies with a name, or rejects a row
why_human: The gate proves a row exists and cannot judge meaning. 41-SECURITY.md T-41-27 holds only on the plan's own definition of a safety row, and the T-41-27 ruling is the human's.
result: pass
note: "Ruled by Olger on 2026-11-10, reply verbatim: 'accept all except WR-11 and 41-18 rows, Olger'. Accepted: every pending (named human) row in 41-04, 41-06, 41-08, 41-11, 41-14, 41-16 (last row) and 41-17, and the Manual-Only rows for those files. Not accepted, sent to test 7 triage: the 41-11 row at Workflow 17:86 'Leave a row with an empty `by` ... a later sweep reclaims it' (WR-11) and the 41-18 row at Workflow 16:31 'A target in the store that cannot be read is refused' (WR-15, T-41-81). The residual Manual-Only rows (R-41-01, R-41-09, R-41-07 fourth limit, T-41-73) are carried to test 5; the other-hosts row is test 2."

### 5. Read residuals R-41-01 to R-41-09 in docs/audit/41-residuals.md, in particular R-41-07's fourth limit (T-41-74) and R-41-09 (T-41-81)
expected: A named human accepts each in a form that names its scope, or sends it back for closing
why_human: No agent may accept a residual. T-41-74 and T-41-81 read `pending (named human): accept`; T-41-73 needs its Accepted Risks Log row; T-41-66 has no log row. All five open threats are below the high threshold.
result: pass
note: "Ruled by Olger on 2026-11-10, reply verbatim: 'accept R-41-02/03/04/06; close R-41-01 on test 1; accept R-41-05 to milestone UAT; accept R-41-07 fourth limit; accept R-41-09 (a)(b), (c) to test 7; log T-41-73 and T-41-66, Olger'. R-41-01 (and review CR-01) closed on test 1's live run. R-41-09 (c), the renamed unreadable file (T-41-81), goes to test 7 with WR-15. Owed write-back: residual rows and the 41-SECURITY.md Accepted Risks Log rows for T-41-73, T-41-66, T-41-74."

### 6. Decide CR-03: ship a verdict verb for hosts, or state that a scripted host has no gate stamp, and fix Workflow 16 line 41 ('the workhorse path') accordingly
expected: A recorded decision that either closes CR-03 or records a residual
why_human: The plain fix lets any agent mint a green verdict on a host (the human's call, per the review). It fails closed today, so no false finding enters the context.
result: pass
note: "Ruled by Olger on 2026-11-10, reply verbatim: 'B, Olger'. Decision: a scripted host has no gate stamp. Workflows 05, 16 and 17 must say so, drop the every-host reading from the artifact-ref text, and scope Workflow 16 line 41 ('the workhorse path') to where emitVerdict runs; a residual records that a host has no gate stamp, closed later only by a verdict verb that runs the gate itself. The text change is carried as CR-03 in test 7."

### 7. Triage the 26 open rows of 41-REVIEW-DISPOSITION.md (CR-03, WR-09, WR-10, WR-12, WR-13, WR-14, WR-15 and the carried WR-05 to WR-08, WR-11)
expected: Each row fixed, accepted or sent to a later phase by a named human
why_human: Disposition is a human ruling. WR-12 (no host read verb) and WR-15 (changelog states the supersession rules without R-41-09's limits) bear most on a role's day-to-day route.
result: issue
reported: "pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
severity: major
note: Olger replied "pass", then on the follow-up question chose "Adopt suggestion" (2026-11-11). CR-01 closes on test 1's live run (disposition fixed). IN-02, IN-03 and IN-06 are deferred to a later phase (disposition deferred). The other 22 rows are gaps G-41-7-* below. Diagnosis is taken from the code review, which already gives each finding's cause with file and line; the carried rows' text is in 41-REVIEW.md at commit 1786df78. No debug agents were spawned.
retest: "2026-11-12, verify-work resume: all 22 gaps reconciled as resolved by executed plans 41-19 to 41-24 (each listed in its gap entry). 41-REVIEW-DISPOSITION.md records the 22 rows fixed (commit 0c1d2db7). The re-verification of 2026-11-12 (41-VERIFICATION.md) found every gap-closure truth holds. New review rows from that range are test 9."

### 8. Read the three unaccepted residuals R-41-09 (c), R-41-10 scripted-install limit, R-41-11
expected: A named human accepts each in a form that names its scope, or sends it back
why_human: From 41-VERIFICATION.md (2026-11-12) human item 3. docs/audit/41-residuals.md says these three are not accepted, and no agent may accept a residual.
result: pass
note: "Ruled by Olger on 2026-11-12, reply verbatim: 'accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger'. Written back: docs/audit/41-residuals.md (R-41-09, R-41-10, R-41-11 rows and a Ruling of 2026-11-12 section); 41-SECURITY.md Accepted Risks Log rows for R-41-09 (c) / T-41-81, R-41-10 (scripted install) and R-41-11, and T-41-81 set to accept, closed."

### 9. Triage the nine open rows of 41-REVIEW-DISPOSITION.md (WR-16, WR-17, WR-18, WR-19, IN-16 to IN-20)
expected: Each row fixed, accepted or sent to a later phase by a named human
why_human: From 41-VERIFICATION.md (2026-11-12) human item 4. Disposition is a human ruling. The roadmap's four gap rounds are used up (plan 41-25 was round 5).
result: issue
reported: "accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger"
severity: major
note: Olger ruled one override round past the gap-round cap for the text-only rows WR-18, WR-19, IN-19 and IN-20 (gaps G-41-9-* below). WR-16, WR-17, IN-16, IN-17 and IN-18 are deferred to a later phase (disposition deferred in 41-REVIEW-DISPOSITION.md, and listed under Deferred Follow-Ups). Diagnosis is taken from 41-REVIEW.md, which gives each finding's cause and fix with file and line; no debug agents were spawned.

### 10. Rule CR-01, WR-01 and WR-02 of the 2026-11-13 review (41-REVIEW.md, rows open in 41-REVIEW-DISPOSITION.md)
expected: Each finding fixed, accepted or sent to a later phase by a named human
why_human: From 41-VERIFICATION.md (2026-11-13) human item 1. The re-verification after plan 41-27 is human_needed only on this ruling; a wording ruling on governance text belongs to a named human.
result: issue
reported: "Fix first: plan a gap-closure fix for CR-01, WR-01 and WR-02 of the 2026-11-13 review (add the dial condition to Workflow 06 and the CHANGELOG, reword install/README.md line 460, tighten the scan), then re-verify, Olger"
severity: major
note: Diagnosis is taken from 41-REVIEW.md (2026-11-13), which gives each finding's cause and fix with file and line; CR-01 was confirmed in code this session (isGatedNote returns false at human_admission off, scripts/context-io.ts; hooks/admission-guard.ts allows every ungated note). No debug agents were spawned. IN-01 to IN-04 of the same review stay open and were not ruled.
retest: "2026-11-13, verify-work resume (last fixes only): G-41-10-CR-01, WR-01 and WR-02 reconciled as resolved by executed plan 41-28 (plan window 98077952..556100cb, 5 commits, all ancestors of HEAD). Checked at HEAD by Claude: Workflow 06 line 37, the CHANGELOG Security bullet (lines 188-197) and the recipe (lines 454-461) state the plugin-install, propose_note and dial conditions and say the default off binds nothing; install/README.md lines 459-461 name no hook for note.js; scripts/flow-guidance-text.test.ts passes 164/164. The 2026-11-13T19:23Z incremental review of plan 41-28 raised WR-01 to WR-03 and IN-01 to IN-07 (test 11); the 17 pending rows of 41-28.md are test 12."

### 11. Rule WR-01, WR-02 and WR-03 and IN-01 to IN-07 of the 2026-11-13T19:23Z review of plan 41-28 (41-REVIEW.md; all 10 rows open in 41-REVIEW-DISPOSITION.md)
expected: Each finding fixed, accepted or sent to a later phase by a named human
why_human: From 41-VERIFICATION.md (2026-11-13T19:45Z) human item 1. WR-01 asks whether Workflow 06 and the CHANGELOG overstate a control at high-severity (a governance wording ruling); WR-02 asks whether the weaker route scan is acceptable. No agent may accept either.
result: issue
reported: "pass (clarified: Adopt suggestion) — fix WR-01 now as one more override round (add the high-severity sentence to Workflow 06 and the CHANGELOG, pin it); defer WR-02, WR-03 and IN-01 to IN-07 to a later phase, Olger"
severity: major
note: "Checked by Claude 2026-11-13: WR-01 holds as stated. Workflow 06 line 37 and the CHANGELOG bullet stop at the default-off sentence; only the recipe (lines 458-459) names the high-severity role condition. WR-02 was confirmed by the verifier from the code (R4 is block-wide, DENIES_ROUTE masks the whole sentence, NEGATED_FORM knows only without/not). Today's text passes honestly; the gap is in the guard, not the tree."
ruling: "Olger replied 'pass', then on the follow-up question chose 'Adopt suggestion' (2026-11-13). One override round past the gap-round cap for WR-01 only (gap G-41-11-WR-01 below). WR-02, WR-03 and IN-01 to IN-07 are deferred to a later phase (disposition deferred in 41-REVIEW-DISPOSITION.md, listed under Deferred Follow-Ups). Diagnosis is taken from 41-REVIEW.md (2026-11-13T19:23Z), which gives the cause and fix with file and line; no debug agents were spawned."
retest: "2026-11-14, verify-work resume: G-41-11-WR-01 reconciled as resolved by executed plan 41-29 (window 260f3709..ec2ac224, 3 commits, ancestor of HEAD). The re-verification of 2026-11-14T10:05Z found the sentence in Workflow 06 line 37 and the CHANGELOG bullet, and 632 of 632 focused tests passing. The 2026-11-14T09:56Z review of plan 41-29 raised WR-01, IN-01 and IN-02 (test 13)."

### 12. Rule the 15 pending (named human) rows of docs/audit/29-style-dispositions/41-28.md
expected: Each row accepted or sent back by a named human
why_human: From 41-VERIFICATION.md (2026-11-13T19:45Z) human item 4. The diff-disposition gate proves each changed clause has a row; it cannot prove the disposition is right, and no agent may write accepted.
result: pass
note: "Counted by Claude 2026-11-13: the Dispositions table holds 15 rows (Workflow 06 line 37 x4, recipe x5, CHANGELOG x5, install/README.md x1); the verifier's 17 counted two prose mentions of the phrase. Spot-checked the rows' code claims: HIGH_SEVERITY_ROLES (scripts/context-io.ts:4305) is security-nfr, architect-design, release-manager; isGatedNote returns false for any kind but finding; factory.config.md line 94 ships human_admission off; hooks/admission-guard.ts imports isGatedNote and calls allow() for an ungated note."
ruling: "Olger replied 'pass' (2026-11-13): all 15 rows accepted. Written back: each row in docs/audit/29-style-dispositions/41-28.md now reads 'accepted by Olger (41-UAT test 12, 2026-11-13)'."

### 13. Rule WR-01, IN-01 and IN-02 of the 2026-11-14T09:56Z review of plan 41-29, and the 2 pending (named human) rows of docs/audit/29-style-dispositions/41-29.md
expected: Each finding fixed, accepted or sent to a later phase, and each 41-29.md row accepted or sent back, by a named human
why_human: From 41-VERIFICATION.md (2026-11-14T10:05Z) human item 1. WR-01 is governance wording on the admission route (Workflow 06 line 37, "nothing binds it either" now follows a sentence that says the dial gates something); the diff-disposition gate proves a row exists, not that it is right, and no agent may write accepted.
result: pass
note: "Checked by Claude 2026-11-14: WR-01 holds as stated (Workflow 06 line 37 'nothing binds it either' follows the high-severity sentence; the misreading only understates the control). The 41-29.md rows' code claims hold: HIGH_SEVERITY_ROLES at scripts/context-io.ts:4305, isGatedNote at :6741, hooks/admission-guard.ts calls allow() when isGatedNote is false."
ruling: "Olger replied 'pass', then on the follow-up question chose 'Adopt suggestion: defer' (2026-11-14). Both 41-29.md rows accepted; WR-01, IN-01 and IN-02 deferred to a later phase, with no new gap round. Written back: each 41-29.md row reads 'accepted by Olger (41-UAT test 13, 2026-11-14)'; 41-REVIEW-DISPOSITION.md lists the three at deferred, open: 0 (check-diff-disposition passes)."

### 14. Rule the 156 pending (named human) rows of docs/audit/29-style-dispositions/41-19.md to 41-27.md
expected: Each row accepted or sent back by a named human
why_human: From 41-VERIFICATION.md (2026-11-14T10:05Z) human item 4. No agent may write accepted.
note: "Counted by Claude 2026-11-14 over table rows only: 41-19 25, 41-20 6, 41-21 6, 41-22 13, 41-23 40, 41-24 4, 41-25 20, 41-26 17, 41-27 25 (156). 41-28's 15 rows were accepted in test 12; 41-29's 2 rows are test 13."
result: pass
retest: "Checked by Claude 2026-11-14 before the ruling: 138 of the 156 rows' after-text is at HEAD word for word; the other 18 (1 in 41-20, 11 in 41-23, 6 in 41-27) name sentences later rewritten by plans 41-25, 41-26 and 41-28, whose own rows record the new wording."
ruling: "Olger replied 'accept all 156' (2026-11-14). Written back: each of the 156 rows in docs/audit/29-style-dispositions/41-19.md to 41-27.md now reads 'accepted by Olger (41-UAT test 14, 2026-11-14)'; check-diff-disposition passes. Still pending after this: one row in 41-11.md (Workflow 17:86, WR-11) and one in 41-18.md (Workflow 16:31, WR-15), held back in test 4 and since rewritten by plans 41-19 and 41-24 (taken up with test 15)."

### 15. Read R-41-11 as plan 41-26 rewrote it (docs/audit/41-residuals.md line 23)
expected: Olger confirms his test 8 acceptance covers a standalone Claude Code install having no route, or sends it back
why_human: From 41-VERIFICATION.md (2026-11-14T10:05Z) human item 5. Plan 41-26 added "A standalone Claude Code install has no hook, like the other hosts" after Olger accepted R-41-11; no agent may extend a named human's acceptance.
result: pass
ruling: "Olger replied 'pass' (2026-11-14) to R-41-11 as rewritten and to the suggestion presented with it. Written back: a Ruling of 2026-11-14 section in docs/audit/41-residuals.md (R-41-11 acceptance covers a standalone Claude Code install having no route); the held-back rows in 41-11.md (Workflow 17:86) and 41-18.md (Workflow 16:31) marked superseded by plans 41-19 and 41-24, ruled by Olger. No pending (named human) row remains in docs/audit/29-style-dispositions/41-*.md; check-diff-disposition passes."

## Summary

total: 15
passed: 9
issues: 4
pending: 0
skipped: 2
blocked: 0

## Gaps

- gap_id: G-41-7-CR-03
  truth: "Review finding CR-03 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-23-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "No scripted host can write a green gate verdict, so `§14-gate#<id>` findings and every `artifact-ref` are refused on every host. Ruled B in test 6: say so in Workflows 05, 16 and 17, drop the every-host reading of `artifact-ref`, scope Workflow 16 line 41 ('the workhorse path') to where `emitVerdict` runs, and record the host limit as a residual that closes only through a verdict verb that runs the gate itself"
  artifacts:
    - path: "agent-factory/workflows/05-pr-quality-gate.md"
      issue: "CR-03"
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "CR-03"
    - path: "agent-factory/workflows/16-context-read-write.md:41"
      issue: "CR-03"
    - path: "agent-factory/workflows/17-task-claim.md:62"
      issue: "CR-03"
    - path: "docs/audit/41-residuals.md"
      issue: "CR-03"
  missing:
    - "Apply the fix in 41-REVIEW.md section CR-03; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-14
  truth: "Review finding WR-14 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-20-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "A duplicate green verdict for one gate run can no longer be cleared by any sanctioned route, and the refusal says a named human will resolve it"
  artifacts:
    - path: "scripts/context-io.ts:4415-4424 (D-03 duplicate clause)"
      issue: "WR-14"
    - path: "scripts/context-io.ts:4494-4531 (supersession block)"
      issue: "WR-14"
    - path: "scripts/context-io.ts:4169-4218 (emitVerdict)"
      issue: "WR-14"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-14; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-15
  truth: "Review finding WR-15 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-24-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "CHANGELOG.md and Workflow 16 state the supersession rules without the limits R-41-09 records; covers the 41-18 row (Workflow 16:31) held back in test 4 and R-41-09 (c) / T-41-81 sent here in test 5"
  artifacts:
    - path: "CHANGELOG.md:141-143"
      issue: "WR-15"
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "WR-15"
    - path: "docs/audit/29-style-dispositions/41-18.md:23"
      issue: "WR-15"
    - path: "docs/audit/41-residuals.md (R-41-09)"
      issue: "WR-15"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-15; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-09
  truth: "Review finding WR-09 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-21-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "note.js exit 1 `refused` also covers I/O faults and the undetermined-root refusal (plan 41-13), so a role is told to change a sound note when it should stop"
  artifacts:
    - path: "scripts/runnable-ref/note.ts:2877-2879"
      issue: "WR-09"
    - path: "scripts/runnable-ref/note.ts:14-19"
      issue: "WR-09"
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "WR-09"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-09; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-10
  truth: "Review finding WR-10 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-21-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "A symbolic link at `.grugops/audit` sends the audit ledger outside the repository with exit 0; runAdd does not apply refuseUnusableStore to the audit directory or admissions.jsonl"
  artifacts:
    - path: "scripts/runnable-ref/note.ts:2890-2905 (runAdd)"
      issue: "WR-10"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-10; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-12
  truth: "Review finding WR-12 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-22-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "Workflows 16 and 17 name a read route (context-io.ts) no role on a host can run, and the full note text is only in the unfiltered notes/ folder"
  artifacts:
    - path: "agent-factory/workflows/16-context-read-write.md:19"
      issue: "WR-12"
    - path: "agent-factory/workflows/16-context-read-write.md:27"
      issue: "WR-12"
    - path: "agent-factory/workflows/17-task-claim.md:60"
      issue: "WR-12"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-12; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-13
  truth: "Review finding WR-13 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-23-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "Under an active dial a spawned high-severity role is told to ask a human, but no step names who then writes the note; Claude Code's route (Orchestrator via propose_note) is unnamed and other hosts have none"
  artifacts:
    - path: "agent-factory/workflows/16-context-read-write.md:43"
      issue: "WR-13"
    - path: "agent-factory/workflows/16-context-read-write.md:49"
      issue: "WR-13"
  missing:
    - "Apply the fix in 41-REVIEW.md section WR-13; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-IN-14
  truth: "Review finding IN-14 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-24-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "Text says an undeterminable HOME refuses every note, but a named root carrying a factory configuration still admits"
  artifacts:
    - path: "CHANGELOG.md:135"
      issue: "IN-14"
    - path: "agent-factory/workflows/16-context-read-write.md:65"
      issue: "IN-14"
    - path: "docs/audit/41-residuals.md:19 (R-41-07 second limit)"
      issue: "IN-14"
  missing:
    - "Apply the fix in 41-REVIEW.md section IN-14; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-IN-15
  truth: "Review finding IN-15 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-21-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "The root refusal and its stop name a cause narrower than the code's, and the refusal is labelled trustedRepoRoot when governanceRootOf throws it"
  artifacts:
    - path: "scripts/context-io.ts:5466-5472"
      issue: "IN-15"
    - path: "scripts/context-io.ts:3659-3667"
      issue: "IN-15"
    - path: "agent-factory/workflows/16-context-read-write.md:51"
      issue: "IN-15"
  missing:
    - "Apply the fix in 41-REVIEW.md section IN-15; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-IN-09
  truth: "Review finding IN-09 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-20-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "The index.md banner on a host names scripts/context-io.js, a program no host has"
  artifacts:
    - path: "scripts/context-io.ts:4818"
      issue: "IN-09"
  missing:
    - "Apply the fix in 41-REVIEW.md section IN-09; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-IN-10
  truth: "Review finding IN-10 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-21-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "A note body that opens with `--` gives exit 2 and stops the role; Workflow 16 does not point to --body-file"
  artifacts:
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "IN-10"
  missing:
    - "Apply the fix in 41-REVIEW.md section IN-10; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-IN-13
  truth: "Review finding IN-13 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-21-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "Workflow 16 lacks WR-01's 'exit 1 without that line is a genuine failure' for note.js"
  artifacts:
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "IN-13"
  missing:
    - "Apply the fix in 41-REVIEW.md section IN-13; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-7-WR-05
  truth: "Review finding WR-05 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "`claim` accepts a subtask with no `ref:` line that `done` then refuses with exit 2, and no step says what to do on that exit 2"
  artifacts:
    - path: "scripts/claim.ts:245-262"
      issue: "WR-05"
    - path: "scripts/runnable-ref/claim.ts:1345-1348"
      issue: "WR-05"
    - path: "agent-factory/workflows/17-task-claim.md:64"
      issue: "WR-05"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section WR-05; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-WR-06
  truth: "Review finding WR-06 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "A re-queued subtask has no naming rule; the natural name hits `done/<task>.md already exists` and stops the Orchestrator"
  artifacts:
    - path: "agent-factory/workflows/17-task-claim.md:50"
      issue: "WR-06"
    - path: "agent-factory/workflows/04-ticket-to-pr.md:55"
      issue: "WR-06"
    - path: "scripts/claim.ts:256-258"
      issue: "WR-06"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section WR-06; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-WR-07
  truth: "Review finding WR-07 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "`sweep` silently replaces an existing (newer) pending/<task>.md with the stale claimed copy"
  artifacts:
    - path: "scripts/claim.ts:379"
      issue: "WR-07"
    - path: "scripts/runnable-ref/claim.ts:303"
      issue: "WR-07"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section WR-07; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-WR-08
  truth: "Review finding WR-08 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-24-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "A new sentence changes the pronoun's referent, so factory.config.md says the Orchestrator makes the hand-back Workflow 04 gives to the Tech Lead"
  artifacts:
    - path: "agent-factory/config/factory.config.md:222"
      issue: "WR-08"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section WR-08; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-WR-11
  truth: "Review finding WR-11 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: major
  test: 7
  root_cause: "Workflow 17 says a later sweep reclaims a row with an empty `by`, but a stray file or unsafe name in claimed/ is never reclaimed and sweep does not report it; covers the 41-11 row (Workflow 17:86) held back in test 4"
  artifacts:
    - path: "agent-factory/workflows/17-task-claim.md:86"
      issue: "WR-11"
    - path: "scripts/claim.ts:359-365"
      issue: "WR-11"
    - path: "scripts/claim.ts:416-420"
      issue: "WR-11"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section WR-11; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-IN-04
  truth: "Review finding IN-04 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "Three descriptions of the subtask file disagree"
  artifacts:
    - path: "agent-factory/roles/orchestrator.md:32"
      issue: "IN-04"
    - path: "agent-factory/workflows/17-task-claim.md:50"
      issue: "IN-04"
    - path: "scripts/claim.ts:8-9"
      issue: "IN-04"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section IN-04; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-IN-05
  truth: "Review finding IN-05 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "The role-switch `done` step lost its 'When the work was queued' condition"
  artifacts:
    - path: "agent-factory/roles/_role-switch-protocol.md:24-25"
      issue: "IN-05"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section IN-05; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-IN-07
  truth: "Review finding IN-07 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "Comments still describe the now-running render as single-writer"
  artifacts:
    - path: "scripts/claim.ts:508"
      issue: "IN-07"
    - path: "scripts/runnable-ref/claim.ts:13"
      issue: "IN-07"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section IN-07; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-IN-11
  truth: "Review finding IN-11 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-22-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: minor
  test: 7
  root_cause: "install/README.md says note.js applies the same admission rules as the kit; it is the in-script admission tier and runs outside the Claude Code hook"
  artifacts:
    - path: "install/README.md:459-460"
      issue: "IN-11"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section IN-11; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-7-IN-12
  truth: "Review finding IN-12 is fixed, as ruled by a named human in test 7"
  status: resolved
  resolved_by: 41-19-PLAN.md
  resolved_at: 2026-11-12
  reason: "User reported: pass (clarified: Adopt suggestion) — CR-01 fixed on test 1's live run; fix the other 22 rows now; defer IN-02, IN-03 and IN-06 to a later phase, Olger"
  severity: cosmetic
  test: 7
  root_cause: "Two comments no longer match the code"
  artifacts:
    - path: "scripts/claim.ts:417"
      issue: "IN-12"
    - path: "scripts/runnable-ref/state-check.ts:80 (SIBLINGS comment)"
      issue: "IN-12"
  missing:
    - "Apply the fix in 41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md) section IN-12; add or adjust a test where the fix changes code"
  debug_session: "41-REVIEW.md @ 1786df78 (git show 1786df78:.planning/phases/41-orchestrator-flow-guidance/41-REVIEW.md)"

- gap_id: G-41-9-WR-18
  truth: "Review finding WR-18 is fixed, as ruled by a named human in test 9"
  status: resolved
  resolved_by: 41-27-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger"
  severity: major
  test: 9
  root_cause: "Workflow 16 (lines 31, 43), agent-factory/contracts/context-note.md:44, CHANGELOG.md:148 and :180 and R-41-11 say `propose_note` and the hook exist 'on Claude Code'; only a Claude Code plugin install has them, so a standalone install is told it has a route it lacks"
  artifacts:
    - path: "agent-factory/workflows/16-context-read-write.md:31"
      issue: "WR-18"
    - path: "agent-factory/workflows/16-context-read-write.md:43"
      issue: "WR-18"
    - path: "agent-factory/contracts/context-note.md:44"
      issue: "WR-18"
    - path: "CHANGELOG.md:148"
      issue: "WR-18"
    - path: "CHANGELOG.md:180"
      issue: "WR-18"
    - path: "docs/audit/41-residuals.md:23 (R-41-11)"
      issue: "WR-18"
  missing:
    - "Apply the text fix in 41-REVIEW.md section WR-18 (text only; no code change); pin it in a test where the existing wording tests cover the line"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-9-WR-19
  truth: "Review finding WR-19 is fixed, as ruled by a named human in test 9"
  status: resolved
  resolved_by: 41-26-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger"
  severity: major
  test: 9
  root_cause: "Workflow 17 `## Session start` step 3 tells the Orchestrator to re-spawn every claim in now-running.md before it says to stop on a `kept` line, so a kept claim is re-spawned and the newer pending subtask is stranded"
  artifacts:
    - path: "agent-factory/workflows/17-task-claim.md:86"
      issue: "WR-19"
  missing:
    - "Apply the text fix in 41-REVIEW.md section WR-19 (text only; no code change); pin it in a test where the existing wording tests cover the line"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-9-IN-19
  truth: "Review finding IN-19 is fixed, as ruled by a named human in test 9"
  status: resolved
  resolved_by: 41-26-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger"
  severity: minor
  test: 9
  root_cause: "The role-switch protocol step 4 still sends deliverables to `artifact-ref`, which every host without a gate stamp refuses"
  artifacts:
    - path: "agent-factory/roles/_role-switch-protocol.md:21"
      issue: "IN-19"
  missing:
    - "Apply the text fix in 41-REVIEW.md section IN-19 (text only; no code change); pin it in a test where the existing wording tests cover the line"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-9-IN-20
  truth: "Review finding IN-20 is fixed, as ruled by a named human in test 9"
  status: resolved
  resolved_by: 41-26-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: accept R-41-09c/10/11; fix WR-18/19 IN-19/20, fix the text-only four (WR-18, WR-19, IN-19, IN-20) now as one override round. Defer the five code rows (WR-16, WR-17, IN-16, IN-17, IN-18) to a later phase., Olger"
  severity: minor
  test: 9
  root_cause: "Workflow 05's 'No faked pass (escape hatch)' paragraph promises the real `§14-gate#<id>` stamp from the Step-4 loop with no host qualifier"
  artifacts:
    - path: "agent-factory/workflows/05-pr-quality-gate.md:57"
      issue: "IN-20"
  missing:
    - "Apply the text fix in 41-REVIEW.md section IN-20 (text only; no code change); pin it in a test where the existing wording tests cover the line"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-10-CR-01
  truth: "At the default human_admission off, no kit text says a Claude Code plugin install binds the witnessing human's name; Workflow 06 and the CHANGELOG state the dial condition"
  status: resolved
  resolved_by: 41-28-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: Fix first: plan a gap-closure fix for CR-01, WR-01 and WR-02 of the 2026-11-13 review (add the dial condition to Workflow 06 and the CHANGELOG, reword install/README.md line 460, tighten the scan), then re-verify, Olger"
  severity: major
  test: 10
  root_cause: "Workflow 06 line 37 and the CHANGELOG Security bullet say 'Only a Claude Code plugin install binds the witnessing human's name', with no condition. The admission-guard hook gates a note only when isGatedNote is true: never at human_admission off (the default), only security-nfr, architect-design and release-manager at high-severity, and a note written with note.js never passes the hook. The pin in flow-guidance-text.test.ts:216-221 locks the overclaim in."
  artifacts:
    - path: "agent-factory/workflows/06-uat-pack.md:37"
      issue: "CR-01"
    - path: "CHANGELOG.md:190-194"
      issue: "CR-01"
    - path: "scripts/flow-guidance-text.test.ts:216-221"
      issue: "CR-01 (pin)"
    - path: "agent-factory/checklists/browser-uat-recipe.md:454-458"
      issue: "CR-01 (never says no note is gated at off)"
  missing:
    - "Apply the fix in 41-REVIEW.md (2026-11-13) section CR-01: state the plugin-install, dial and propose_note-route conditions in Workflow 06, the CHANGELOG bullet and the recipe, and update the pin (text only; no code change)"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-10-WR-01
  truth: "install/README.md puts no Claude Code hook on the scripted install"
  status: resolved
  resolved_by: 41-28-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: Fix first: plan a gap-closure fix for CR-01, WR-01 and WR-02 of the 2026-11-13 review (add the dial condition to Workflow 06 and the CHANGELOG, reword install/README.md line 460, tighten the scan), then re-verify, Olger"
  severity: major
  test: 10
  root_cause: "install/README.md:459-461, in the scripted-install list, says tools/grugops/note.js runs 'outside the Claude Code hook', which contradicts line 1943 (install.js writes no hook); plan 41-27's grep and its scan did not read install/README.md"
  artifacts:
    - path: "install/README.md:459-461"
      issue: "WR-01"
  missing:
    - "Apply the fix in 41-REVIEW.md (2026-11-13) section WR-01: rewrite the clause and add install/README.md to the scan of WR-02"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-10-WR-02
  truth: "The 'no unscoped sentence' scan in flow-guidance-text.test.ts fails on the shapes it was written for"
  status: resolved
  resolved_by: 41-28-PLAN.md
  resolved_at: 2026-11-13
  reason: "User reported: Fix first: plan a gap-closure fix for CR-01, WR-01 and WR-02 of the 2026-11-13 review (add the dial condition to Workflow 06 and the CHANGELOG, reword install/README.md line 460, tighten the scan), then re-verify, Olger"
  severity: major
  test: 10
  root_cause: "scripts/flow-guidance-text.test.ts:171-207 splits only on sentence ends, matches only the exact words 'the hook', accepts a standalone-install sentence as scoped, ignores sentences naming no host, and checks the route sentence only in Workflows 16 and 04 and the note contract; the reviewer's probe missed 7 of 8 test sentences (scratchpad scan.mjs)"
  artifacts:
    - path: "scripts/flow-guidance-text.test.ts:171-207"
      issue: "WR-02"
  missing:
    - "Apply the fix in 41-REVIEW.md (2026-11-13) section WR-02: split on bullet markers too, widen the route tokens, refuse a standalone install named as having the hook, cover install/README.md, Workflow 06 and the recipe, and add red cases that prove the scan can fail"
  debug_session: "41-REVIEW.md"

- gap_id: G-41-11-WR-01
  truth: "Workflow 06 and the CHANGELOG Security bullet state that at high-severity the dial gates only a finding by security-nfr, architect-design or release-manager, so a reader at high-severity is not led to think the witness finding is checked"
  status: resolved
  resolved_by: 41-29-PLAN.md
  resolved_at: 2026-11-14
  reason: "User reported: pass (clarified: Adopt suggestion) — fix WR-01 now as one more override round (add the high-severity sentence to Workflow 06 and the CHANGELOG, pin it); defer WR-02, WR-03 and IN-01 to IN-07 to a later phase, Olger"
  severity: major
  test: 11
  root_cause: "agent-factory/workflows/06-uat-pack.md:37 and CHANGELOG.md:192-194 stop at 'At the default off the dial gates no note'. At high-severity isGatedNote (scripts/context-io.ts:6741, :4305) gates only a finding whose by is security-nfr, architect-design or release-manager; the Orchestrator writes the witness finding, so the hook normally allows it unchecked. Only the recipe (browser-uat-recipe.md:458-459) says so, and neither Workflow 06's pointer nor the CHANGELOG sends the reader there."
  artifacts:
    - path: "agent-factory/workflows/06-uat-pack.md:37"
      issue: "WR-01"
    - path: "CHANGELOG.md:192-194"
      issue: "WR-01"
    - path: "scripts/flow-guidance-text.test.ts"
      issue: "WR-01 (pin the new sentence in both files)"
  missing:
    - "Apply the fix in 41-REVIEW.md (2026-11-13T19:23Z) section WR-01: add 'At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`.' after the default-off sentence in Workflow 06 and its twin in the CHANGELOG bullet, and pin both (text only; no code change)"
  debug_session: "41-REVIEW.md"

## Deferred Follow-Ups

- test: 2
  idea: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04, R-41-05): carried to the milestone UAT by Olger"
  deferred_at: 2026-11-13
- test: 3
  idea: "Windows run of note.js's trustedRepoRoot ladder: carried to the milestone UAT by Olger"
  deferred_at: 2026-11-13

- test: 9
  idea: "Review finding WR-16 (41-REVIEW.md, 2026-11-12): deferred to a later phase by Olger"
  deferred_at: 2026-11-12
- test: 9
  idea: "Review finding WR-17 (41-REVIEW.md, 2026-11-12): deferred to a later phase by Olger"
  deferred_at: 2026-11-12
- test: 9
  idea: "Review finding IN-16 (41-REVIEW.md, 2026-11-12): deferred to a later phase by Olger"
  deferred_at: 2026-11-12
- test: 9
  idea: "Review finding IN-17 (41-REVIEW.md, 2026-11-12): deferred to a later phase by Olger"
  deferred_at: 2026-11-12
- test: 9
  idea: "Review finding IN-18 (41-REVIEW.md, 2026-11-12): deferred to a later phase by Olger"
  deferred_at: 2026-11-12

- test: 11
  idea: "Review finding WR-02 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding WR-03 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-01 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-02 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-03 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-04 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-05 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-06 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13
- test: 11
  idea: "Review finding IN-07 (41-REVIEW.md, 2026-11-13T19:23Z): deferred to a later phase by Olger"
  deferred_at: 2026-11-13

- test: 13
  idea: "Review finding WR-01 (41-REVIEW.md, 2026-11-14T09:56Z): Workflow 06 line 37 'nothing binds it either' after the high-severity sentence; option (a) 'nothing binds the name'. Deferred to a later phase by Olger"
  deferred_at: 2026-11-14
- test: 13
  idea: "Review finding IN-01 (41-REVIEW.md, 2026-11-14T09:56Z): 'gates only' leaves out the hook's fail-closed refusals. Deferred to a later phase by Olger"
  deferred_at: 2026-11-14
- test: 13
  idea: "Review finding IN-02 (41-REVIEW.md, 2026-11-14T09:56Z): the CHANGELOG sentence is pinned twice. Deferred to a later phase by Olger"
  deferred_at: 2026-11-14
