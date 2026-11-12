---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-12T20:10:00Z
status: human_needed
score: 8/8 must-haves verified
covered_files:
  - .planning/phases/41-orchestrator-flow-guidance/41-01-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-01-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-02-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-02-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-03-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-03-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-04-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-04-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-05-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-05-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-06-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-06-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-07-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-07-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-08-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-08-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-09-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-09-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-10-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-10-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-11-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-11-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-12-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-12-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-13-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-13-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-14-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-14-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-15-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-15-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-16-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-16-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-17-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-17-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-18-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-18-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-19-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-19-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-20-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-20-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-21-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-21-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-22-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-22-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-23-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-23-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-24-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-24-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-25-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-25-SUMMARY.md
  - CHANGELOG.md
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/context-note.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/41-residuals.md
  - install/README.md
  - install/install.ts
  - install/uninstall.ts
  - scripts/claim.ts
  - scripts/context-io.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
covered_digest: "v3:sha256:2c767ca3ebeb67cde0a4bfd525292879749335f4b148e83cfcc78dc115e3a0a9"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 7/7
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "WR-19: Workflow 17 `## Session start` step 3 tells the Orchestrator to re-spawn every claim left in now-running.md and also to stop on each `kept` line. For a `kept` row the two instructions conflict, and a re-spawn would finish the stale copy and strand the newer pending subtask. I reproduced the `kept z` sweep on a lone copy."
    category: other
    reason: "The precondition is a stale claim and a newer pending file with one id; Workflow 17 step 1 gives a re-queued subtask a new id, so it is rare. No roadmap success criterion fails. A human triages it."
    evidence_status: "reproduced sweep output; no failing test"
  - finding: "WR-16 (reproduced here): with an unparseable `factory.config.json`, `note.js add` exits 1 `refused`, though CHANGELOG.md:133 and the `NoteRefusal` comment say exit 1 means only that the note itself must change."
    category: other
    reason: "Fails closed and writes nothing. The harm is a role spending a self-fix attempt on a sound note. Text or code fix owed."
    evidence_status: "reproduced"
  - finding: "WR-17, WR-18, IN-16 to IN-20 (41-REVIEW.md, 2026-11-12): a misleading 'may have been written' suffix on exit-2 lines, `propose_note` text that says 'on Claude Code' where only a plugin install has it, a 1 MiB claim/done mismatch, `read` message and role-switch/Workflow 05 residues. I did not reproduce these; I read the review's account. None falsifies a success criterion."
    category: other
    reason: "Advisory input judged against the must-haves. WR-18 sits under governance text, where the project rule is never to overstate a control, so a named human should rule on it."
    evidence_status: "review account only"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04; 41-UAT test 2, blocked)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent on this machine (R-41-05, `UNKNOWN - verify`). RUN-04's 'reads the same on all six hosts' is proven for the text only. Olger accepted R-41-05 and carried it to the milestone UAT."
  - test: "Windows run of note.js's trustedRepoRoot ladder (41-UAT test 3, blocked)"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "No Windows machine is reachable; Windows is `UNKNOWN - verify`."
  - test: "Read R-41-09 (c) (the renamed unreadable note, T-41-81), R-41-10's scripted-install limit and R-41-11 in docs/audit/41-residuals.md"
    expected: "A named human accepts each in a form that names its scope, or sends it back"
    why_human: "The residual table says R-41-09 (c), R-41-10's scripted-install part and R-41-11 are not accepted. No agent may accept a residual. 41-SECURITY.md is `threats_open: 0` on the high threshold, but these three rows stay open by their own words."
  - test: "Triage the nine open rows of 41-REVIEW-DISPOSITION.md (WR-16, WR-17, WR-18, WR-19, IN-16, IN-17, IN-18, IN-19, IN-20)"
    expected: "Each row fixed, accepted, or sent to a later phase by a named human"
    why_human: "Disposition is a human ruling. WR-18 and WR-19 bear most on a role's route: WR-18 says a standalone Claude Code install has a `propose_note` route it does not have, and WR-19 is the session-start conflict reproduced above."
  - test: "Update 41-UAT.md test 7: it still reads `result: issue` with 22 gaps marked `failed`, though plans 41-19 to 41-25 fixed them and 41-REVIEW.md records CR-03, WR-09, WR-10, WR-12 to WR-15 and IN-09 to IN-15 as fixed"
    expected: "The UAT file shows test 7 resolved, or a human says what remains"
    why_human: "The UAT file is the human's record. I did not edit it."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-12T20:10:00Z
**Status:** human_needed
**Re-verification:** Yes. It follows the 2026-11-08 report (`human_needed`, 7/7, plans 41-01 to 41-18) and covers gap plans 41-19 to 41-25. That report is replaced.

## Verdict

The goal is achieved in the code. Every roadmap success criterion holds against the committed programs and kit text. I re-proved the behavior on lone host copies and by installing onto a scratch Codex target, not by reading the summaries. No must-have FAILED, so there is no BLOCKER.

The status is `human_needed`, not `passed`, for items only a human can supply: live runs on five hosts, a Windows run, three residuals the residual table itself marks not accepted, and the triage of nine fresh review rows. I did not file the review findings as gaps. None falsifies a success criterion (see "Judgement on the open items").

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED | Scratch host with the committed `claim.js` and `note.js`: two claims rendered two rows (`t1` by `grugops-software-engineer-mid`, `t2` by `grugops-qe`). After `done t1` the t1 row was gone, `t2` stayed, and `free` read 2. |
| 2 | SC2, RUN-02 and RUN-05: on completion the Orchestrator refills `wip_limit` minus the `claimed/` count read from disk, with no timers or polling; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host runs owed | `free 3`, `free 1` after two claims, `free 2` after `done t1`. A second `claim t1` printed `lost t1`, exit 1. `done t1` before any note printed `not-done t1: no sealed note ...`, exit 1. `note.js add T1 --kind observation ... --body checked` printed `noted T1 <id>`, then `done t1` exited 0. `note.js read T1` printed the sealed note. `install.js --codex --target <scratch>` laid down `tools/grugops/claim.js` and `note.js`, and `claim.js free` ran there (`free 3`). WF17 `## Keep capacity full` says a refill runs on every return and user turn, with no timer and no polling. 41-UAT test 1 (Olger, 2026-11-10) records live Claude Code runs, standalone and plugin, in which a spawned role ran `note.js add` and `claim.js done`. |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18 note compaction, with observable triggers and a fresh-session fallback that re-reads the in-flight log; `orchestrator.md` has a one-line pointer and stays under its ceiling | VERIFIED | `## Session compaction` has three triggers (ticket boundary, about 10 closed agents, host signal), a pause / confirm / compact-or-checkpoint sequence, and "The first act after any compaction is to re-read `now-running.md` and the board". "A fresh session is the fallback on every host" leads to `## Session start` (read `now-running.md` and the board, `sweep`, re-spawn the adapter in `by`, refill). It says it is not note compaction, which WF18 owns. `orchestrator.md` is 6,158 B against the 7,165 B WARN ceiling; line 33 is the one-line pointer. `check-foundation-guards.js` printed `ALL CHECKS PASSED`. One corner of `## Session start` is flagged as WR-19 below. |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | WF17 says the rules turn on whether the `Agent` tool exists, never on a host name. Host names sit in `### Operator tips (optional)` (Claude Code `/autocompact 400k`, Codex `model_auto_compact_token_limit`, Pi `compaction.reserveTokens`, the other three use the fresh-session fallback). `flow-guidance-text.test.ts` passes. |
| 5 | SC5, RUN-06: the Orchestrator starts tiered engineers by adapter name, never forks them, never overrides the model, never claims a ticket itself | VERIFIED | WF17 step 4: "Start a tiered engineer by adapter name, as a non-fork sub-agent. Pass no `model` or `effort` parameter on the spawn call." `claim.js claim t3 --by grugops-orchestrator` exited 2, "The queue was not changed." `orchestrator.md` line 77 holds the limit. The refusal is an instruction backstop (R-41-03, accepted by Olger). |
| 6 | Plan 41-12 and 41-13/41-17 truth (READ-1, T-41-55): a failed read in `note.js` never prints `noted`; the dial is never lost on a failed read or a walk that inspected nothing | VERIFIED | `note-read-sites.test.ts` and `note.test.ts` pass inside the 875-test focused run below, with no skip. The unparseable-config case printed `refused ... a governance configuration file exists ... could not be read or parsed ... nothing is written` (D-14), not `noted`. |
| 7 | Plan 41-07/41-15/41-18 prohibition (CR-02, T-41-64): `note.js` cannot retire a green verdict or a human-disposed governed finding | VERIFIED | The CR-02 describe in `note.test.ts` passes (inside the 875). 41-REVIEW.md of 2026-11-12 found no weakened assertion and byte-identical builds. |
| 8 | Gap rounds 4 and 5 (plans 41-19 to 41-25): `claim` refuses what `done` refuses; `sweep` keeps a newer pending file; `emitVerdict` refuses a duplicate; `note.js` exits 2 on I/O faults and offers `read`; a host has no gate stamp (CR-03 option B, D-41); a plugin install counts as a host (T-41-100, D-44), pinned by a `LIMIT (R-41-10)` case; Olger's named acceptance sits in the Accepted Risks Log | VERIFIED (with advisory items) | `note.js read` ran on the scratch host. `kept z (pending/z.md already exists, so the claim stays)` reproduced the WR-07 fix. `role-route.test.ts:240-285` holds the `LIMIT (R-41-10)` PREMISE, CONTROL and LIMIT cases; they pass. "plugin install" appears in Workflow 05 (1), 16 (3), 17 (1), CHANGELOG (1) and R-41-10 (2); "is not installed to a host" appears nowhere. 41-SECURITY.md line 261 holds the `R-41-10 (plugin install)` row quoting `accept, Olger`; `threats_open: 0`. 41-REVIEW.md (2026-11-12) rules 22 earlier rows fixed. The four warnings and five infos it raises are in Advisory, not gaps. |

**Score:** 8/8 truths verified. 0 present-but-behavior-unverified: truths 1, 2, 6, 7 and 8 each rest on a passing behavioral test or a run I made here.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/claim.ts`, `scripts/runnable-ref/claim.ts` and `claim.js` | Full lifecycle: claim, done, free, sweep, now-running | VERIFIED | Ran claim, free, done, sweep on a lone copy; `claim.test.ts` in both trees pass |
| `scripts/runnable-ref/note.ts` and `note.js` | Host note writer with `add` and `read` | VERIFIED | `add` and `read` ran on a lone copy; `note.test.ts`, `note-read-sites.test.ts` pass |
| `scripts/context-io.ts` | Fail-closed root ladder, supersession block, duplicate-verdict refusal | VERIFIED | `npm run freshness`: 91 committed `.js` fresh; `tsc --noEmit` exit 0 |
| `install/install.ts` `RUNNABLES`, `install/uninstall.ts` mirror | Rows for `claim.js` and `note.js` | VERIFIED | A real `--codex` install wrote both to `tools/grugops/` |
| `agent-factory/workflows/17-task-claim.md` | Steps, refill, session start, session compaction, operator tips | VERIFIED | Read in full; WR-19 corner noted |
| `agent-factory/workflows/16-context-read-write.md`, `05-pr-quality-gate.md` | Read route, host no-stamp text | VERIFIED with warnings | WR-18 and IN-20 below |
| `agent-factory/roles/orchestrator.md` | Pointer, hard limit, under ceiling | VERIFIED | 6,158 B; lines 22, 33, 77 |
| `docs/audit/41-residuals.md` | R-41-01 to R-41-11 recorded | VERIFIED as recorded | R-41-09 (c), R-41-10 (scripted install) and R-41-11 read "Not accepted" |

### Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| WF17 step 3 | `claim.js claim` | WIRED | Command ran as written |
| WF16 step 1 / WF17 step 5 | `note.js read` | WIRED | Command ran; prints sealed notes |
| WF16 step 3 / WF17 step 6 | `note.js add` | WIRED | Literal command ran; `role-route.test.ts` passes |
| `note.js add` to `claim.js done` | sealed-note check | WIRED | `done` refused, then accepted after `add` |
| `RUNNABLES` to `RUNNABLES_MIRROR` | install and uninstall | WIRED | Same rows; install run |
| `note.js` generated region to `context-io.ts` | authority | WIRED | Freshness green |
| R-41-10 to the `LIMIT (R-41-10)` case | residual and test | WIRED | Case at `role-route.test.ts:240`, cited by the residual |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|---|---|---|---|---|
| `now-running.md` | rows | listing of `claimed/` | Yes (two rows, then one) | FLOWING |
| `free` | claimed count | the same listing | Yes (3, 1, 2 observed) | FLOWING |
| `done` | sealed-note check | notes under the `ref:` folder since `at` | Yes | FLOWING |

### Behavioral Spot-Checks

Run in scratch repos under the session scratchpad, with the committed programs, `CLAUDE_PROJECT_DIR` and `GRUGOPS_PROJECT_DIR` unset. No project state changed.

| Behavior | Result | Status |
|---|---|---|
| `free`, two claims, `free`, duplicate claim | `free 3`, `claimed` x2, `free 1`, `lost t1` exit 1 | PASS |
| `--by grugops-orchestrator` | exit 2, queue unchanged | PASS |
| `done` with no note; `note.js add`; `done`; `free`; `sweep` | exit 1 `not-done`; `noted`; exit 0; `free 2`; `swept 0` exit 0 | PASS |
| `note.js read` of a context with one sealed note | `1 current, 0 superseded, 0 skipped`, note printed | PASS |
| Stale claim plus a newer pending file of one id | `kept z (...)`, row stays in `now-running.md` | PASS (WR-07 fix); exposes WR-19 |
| Unparseable `factory.config.json`, `note.js add` | `refused ... UNKNOWN - verify`, exit 1, nothing written | PASS for fail-closed; confirms WR-16 |
| Installer, `--codex` target | `claim.js`, `note.js`, `package.json` in `tools/grugops/`; `claim.js free` printed `free 3` | PASS |
| 9 focused files: `flow-guidance-text`, `role-route`, `runnable-ref/claim`, `claim`, `note`, `note-read-sites`, `now-running-freshness`, `tier-kit-text`, `runnable-exit-contract` | 9 files, 875 of 875 passed | PASS |
| `tsc --noEmit`; `npm run freshness`; `check-foundation-guards.js`; `check-uat-oracles.js` | exit 0; 91 `.js` fresh; each `ALL CHECKS PASSED` | PASS |
| `validate-agent-factory.js` with no env | refused: `VALIDATE_KIT_ROOT is unset`. I did not set it | `UNKNOWN - verify` (not run) |

I did not re-run the full suite, as instructed. The orchestrator's gate at `f3350cb2` reports 21 failed, 11,719 passed, 2 skipped, with all 21 names matching `41-VALIDATION.md` § Known baseline reds. I rely on that report and did not re-compare the names.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists and no plan declares a probe.

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|---|---|---|---|---|
| RUN-01 | 41-01, 41-03, 41-04, 41-10, 41-11, 41-19 | In-flight log is `claimed/` rendered to `now-running.md` | SATISFIED | Truth 1 |
| RUN-02 | 41-01, 41-03 to 41-24 (not 41-02, 41-23) | Refill from `wip_limit` minus `claimed/`, no timers | SATISFIED (live host run owed) | Truths 2, 6, 7, 8 |
| RUN-03 | 41-04, 41-06, 41-11 | Session compaction guidance and fresh-session fallback | SATISFIED | Truth 3 |
| RUN-04 | 41-04, 41-06, 41-11, 41-19, 41-22, 41-23, 41-25 | Same guidance on six hosts, one-line pointer, under ceiling | SATISFIED as text; five live runs owed | Truths 3, 4 |
| RUN-05 | 41-01, 41-03, 41-04, 41-05, 41-07, 41-09 to 41-25 (not 41-06, 41-08) | `claim.js` ships as a materialized runnable | SATISFIED | Truth 2 and the Codex install run |
| RUN-06 | 41-01 to 41-04, 41-06, 41-08, 41-24 | Tiered engineers by adapter name, no fork, no model override, no self-claim | SATISFIED | Truth 5 |

All six IDs are claimed by plan `requirements` fields, and each is in REQUIREMENTS.md. No ID is orphaned. **Bookkeeping, not changed here:** `.planning/REQUIREMENTS.md` line 68 still shows RUN-03 as `[ ]`, and its table (line 155) reads `Pending`. That mark is stale against Truth 3. The other five read `[x]` and `Complete`, which this report supports for RUN-01, 02, 05 and 06. RUN-04 is satisfied for the text; a human may prefer to hold its `Complete` until the five live host runs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `agent-factory/workflows/17-task-claim.md` | 86 (Session start step 3) | Re-spawn every claim in `now-running.md`, and stop on a `kept` row, both stated (WR-19, reproduced) | Warning | Rare corner; a kept claim re-spawned strands the newer subtask |
| `scripts/context-io.ts`, `CHANGELOG.md` | 4506, 131-133 | Exit 1 still covers an unreadable configuration and an unanswered store owner, against the stated "only the note itself" (WR-16, reproduced for the config case) | Warning | Fails closed; a role may spend a self-fix attempt |
| `agent-factory/workflows/16-context-read-write.md` and four more | 31, 43 | "on Claude Code" where only a plugin install holds `propose_note` (WR-18, review account) | Warning | Overstates a control in governance text |
| `scripts/runnable-ref/note.ts` | 2964-2971 | Every exit-2 line carries "The note may have been written" (WR-17, review account) | Warning | Contradictory message |
| `agent-factory/workflows/05-pr-quality-gate.md`, `_role-switch-protocol.md` | 57, 21 | Unqualified stamp / `artifact-ref` text (IN-19, IN-20, review account) | Info | Residue of CR-03 text |

The TBD / FIXME / XXX debt-marker gate was not re-run on this range. The 2026-11-08 report found none, and 41-REVIEW.md of 2026-11-12 reports none. `UNKNOWN - verify` for the files plans 41-19 to 41-25 touched. No stub code found.

### Judgement on the open items

- **WR-19 (session start, reproduced):** it touches the fresh-session fallback SC3 names, so I weighed it hardest. SC3 asks that a fresh session re-reads the in-flight log, and it does: step 1 reads it, step 2 sweeps, step 3 re-spawns, step 4 refills. The conflict arises only for a `kept` row, which needs a stale claim and a newer pending file with one id. Step 1 gives a re-queued subtask a new id, and the step's last sentence already says to stop and name `kept` entries. A careful reader stops. Advisory, human triage.
- **WR-16 (reproduced), WR-17, WR-18, IN-16 to IN-20:** each concerns an error line, an exit-code claim, a sentence that overstates a control, or a corner of the `claim`/`done` contract. None stops a task from being claimed, completed, refilled or resumed, and none makes a roadmap criterion false. WR-18 is the one I would not leave unread, since the project rule is never to overstate a control.
- **Open security threats:** `41-SECURITY.md` is `verified`, `threats_open: 0`. T-41-100 closed as an accepted risk on Olger's typed reply (log row at line 261). I cannot verify that the reply was typed by Olger; the audit says the same under Provenance.
- **Nyquist:** `41-VALIDATION.md` is `validated`, `nyquist_compliant: true`.
- **Gap-closure cap:** the roadmap allows four rounds; the roadmap lists round 5 (plan 41-25, from the security audit). The cap is exceeded, and a human closes the phase by decision or override. I propose no further round, since no must-have fails.
- **Deferred:** no later phase (42, 43) names an open item, so nothing is deferred.

### Human Verification Required

1. **Five-host live run (41-UAT test 2, blocked).** Test: run the flow guidance on Codex CLI, Antigravity CLI, OpenCode, Copilot CLI and Pi. Expected: claim, refill and sweep from Workflow 17 alone, and a role writes and closes with `note.js`. Why human: the CLIs are absent here (R-41-05).
2. **Windows run (41-UAT test 3, blocked).** Test: run `note.js`'s `trustedRepoRoot` ladder on Windows. Expected: rung 1 and rung 2 spell a path the same way. Why human: no Windows machine.
3. **Residuals not accepted.** Test: read R-41-09 (c) (T-41-81), R-41-10's scripted-install limit and R-41-11. Expected: a named human accepts each, naming its scope, or sends it back. Why human: only a human accepts a residual.
4. **Review triage.** Test: rule WR-16 to WR-19 and IN-16 to IN-20 in `41-REVIEW-DISPOSITION.md`. Expected: each fixed, accepted or sent to a later phase by name. Why human: disposition is a human ruling.
5. **UAT file.** Test: update `41-UAT.md` test 7, which still reads `issue` with 22 failed gaps. Expected: resolved, or a human names what remains. Why human: the UAT file is the human's record.

### Gaps Summary

None. Every roadmap success criterion and every gap-closure truth holds against the code, and I reproduced the behavior on lone host copies and an installer run. The phase is not ready to be called complete until a named human supplies the live-host and Windows evidence, reads the three unaccepted residuals and triages the nine review rows.

---

_Verified: 2026-11-12T20:10:00Z_
_Verifier: Claude (gsd-verifier)_
