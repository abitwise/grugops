---
status: complete
phase: 41-orchestrator-flow-guidance
source: [41-VERIFICATION.md]
started: 2026-11-08T18:57:45Z
updated: 2026-11-13T12:43:17.029Z
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

## Summary

total: 9
passed: 5
issues: 2
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
