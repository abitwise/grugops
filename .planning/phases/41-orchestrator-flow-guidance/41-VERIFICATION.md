---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-08T19:10:00Z
status: human_needed
score: 7/7 must-haves verified
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
  - agent-factory/roles/orchestrator.md
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
covered_digest: "v3:sha256:42e0eac53a93abbd1c0f769d2475e64166a528b068c8197ba081d7d3c112a99a"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/7
  gaps_closed:
    - "READ-1 / T-41-55 (plan 41-12 truth): a failed read in note.js never prints `noted`; the 12 red rows are green (plans 41-13, 41-17)"
    - "CR-02 / T-41-64 (plan 41-07 prohibition): a note can no longer retire a green gate verdict or a governed finding, including through a target that cannot be read (plans 41-15, 41-18)"
    - "T-41-30 adapter-spelling fold (plan 41-14)"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "One live Claude Code run on a plugin install and one on a standalone install: spawn a role, have it publish a note with the command in Workflow 16 step 3, have it run `claim.js done`"
    expected: "The role writes through tools/grugops/note.js, `done` exits 0, the row leaves now-running.md and `free` rises"
    why_human: "role-route.test.ts and my own scratch run execute the literal commands on lone copies. Neither shows what a host's permission model lets a spawned role run. R-41-01 stays open until a named human reads a live run."
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent here (R-41-05, `UNKNOWN - verify`). RUN-04's 'reads the same on all six hosts' is proven for the text only."
  - test: "Windows run of note.js's trustedRepoRoot ladder"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "Windows is `UNKNOWN - verify`; Linux only was measured."
  - test: "Read the `pending (named human)` rows in docs/audit/29-style-dispositions/41-*.md (93 lines match the phrase, counted by grep; includes 41-14, 41-17 and 41-18), the last row of 41-16.md, and the Manual-Only rows of 41-VALIDATION.md"
    expected: "A named human replies with a name, or rejects a row"
    why_human: "The gate proves a row exists and cannot judge meaning. 41-SECURITY.md T-41-27 holds only on the plan's own definition of a safety row, and the T-41-27 ruling is the human's."
  - test: "Read residuals R-41-01 to R-41-09 in docs/audit/41-residuals.md, in particular R-41-07's fourth limit (T-41-74) and R-41-09 (T-41-81)"
    expected: "A named human accepts each in a form that names its scope, or sends it back for closing"
    why_human: "No agent may accept a residual. T-41-74 and T-41-81 read `pending (named human): accept`; T-41-73 needs its Accepted Risks Log row; T-41-66 has no log row. All five open threats are below the high threshold."
  - test: "Decide CR-03: ship a verdict verb for hosts, or state that a scripted host has no gate stamp, and fix Workflow 16 line 41 ('the workhorse path') accordingly"
    expected: "A recorded decision that either closes CR-03 or records a residual"
    why_human: "The plain fix lets any agent mint a green verdict on a host (the human's call, per the review). It fails closed today, so no false finding enters the context."
  - test: "Triage the 26 open rows of 41-REVIEW-DISPOSITION.md (CR-03, WR-09, WR-10, WR-12, WR-13, WR-14, WR-15 and the carried WR-05 to WR-08, WR-11)"
    expected: "Each row fixed, accepted or sent to a later phase by a named human"
    why_human: "Disposition is a human ruling. WR-12 (no host read verb) and WR-15 (changelog states the supersession rules without R-41-09's limits) bear most on a role's day-to-day route."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-08T19:10:00Z
**Status:** human_needed
**Re-verification:** Yes, after gap-closure rounds 1 to 3 (plans 41-07 to 41-18). This report replaces the 2026-11-05 report, which predated plans 41-13 to 41-18.

## Verdict

The goal is achieved in the code. Both gaps the 2026-11-05 report held (READ-1 / T-41-55 and CR-02) are closed, each re-proved here by running the tests and the shipped programs, not by reading the summaries. No must-have is FAILED, so there is no BLOCKER.

The status is `human_needed`, not `passed`. Step 8 yields real human items, and none may be closed by an agent: the live runs on the five other hosts, the pending-named-human disposition and residual reads, and a decision on CR-03. I also kept the phase out of `gaps_found` on purpose, because none of the open review or security items falsifies a roadmap success criterion (reasoning in "Judgement on the open items").

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED | Scratch host with the committed `claim.js` and `note.js` beside `{"type":"module"}`: two claims rendered two rows (`t1` by `grugops-software-engineer-mid`, level `mid`; `t2` by `grugops-qe`). After `done t1` the t1 row was gone and the t2 row stayed. |
| 2 | SC2, RUN-02 and RUN-05: on completion the Orchestrator refills `wip_limit` minus the `claimed/` count read from disk, with no timers or polling; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host run owed | `free 2`, then `free 0` after two claims, then `free 1` after `done t1`. `claim t1` a second time printed `lost t1`, exit 1 (a lost claim, not an error). `done t1` before any note: `not-done t1: no sealed note ...`, exit 1. After `note.js add t1 --kind observation ...` printed `noted t1 <id>`, `done t1` exited 0. WF17 "Keep capacity full" says a refill runs on every return and user turn, with no timer and no polling. `install.js --codex --target <scratch>` laid down `tools/grugops/claim.js` and `note.js`, and `claim.js free` ran there (`free 3`). `RUNNABLES` has no host condition, so the program reaches every host the installer serves. |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18 note compaction, with observable triggers and a fresh-session fallback that re-reads the in-flight log; `orchestrator.md` has a one-line pointer and stays under its ceiling | VERIFIED | `## Session compaction` is in WF17: three triggers (ticket boundary, about 10 closed agents, host signal), a pause / confirm / compact-or-checkpoint sequence, "The first act after any compaction is to re-read `now-running.md` and the board", and "A fresh session is the fallback on every host" that follows `## Session start` (read in-flight log, sweep, re-spawn the adapter in `by`, refill). It states it is not note compaction, which WF18 owns. `orchestrator.md` is 6,192 B against the 7,165 B WARN ceiling; line 33 is the one-line pointer. `check-foundation-guards.js` passed. |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | WF17 says rules turn on whether the `Agent` tool exists, never on a host name. Host names appear only in `## Platform depth and width` and `### Operator tips (optional)` (Claude Code `/autocompact 400k`, Codex `model_auto_compact_token_limit`, Pi `compaction.reserveTokens`, the other three "use the fresh-session fallback"). `flow-guidance-text.test.ts` passed. |
| 5 | SC5, RUN-06: the Orchestrator starts tiered engineers by adapter name, never forks them, never overrides the model, never claims a ticket itself | VERIFIED | WF17 step 4: "Start a tiered engineer by adapter name, as a non-fork sub-agent. Pass no `model` or `effort` parameter." `claim.js claim t3 --by grugops-orchestrator` and `--by GRUGOPS-ORCHESTRATOR` both exit 2 and change nothing. `orchestrator.md` line 79 holds the no-self-claim limit. The refusal is an instruction backstop, which WF17 states. |
| 6 | Plan 41-12 truth (READ-1, T-41-55): a failed read in `note.js` never prints `noted`; the dial is never lost on a failed read or a walk that inspected nothing | VERIFIED | `npx vitest run scripts/runnable-ref/note-read-sites.test.ts` and five other files: 6 files, 512 of 512 passed, with no skip, `.fails` or `.todo` (41-17 and 41-18 summaries state none added). The 12 rows red at the previous report are green. The cases cover HOME below the repository, the stated cost, controls and the `LIMIT (R-41-07)` pins. One route stays open and pinned: a working directory with its own `.grugops` under a `HOME` below the repository reads the lean dial (R-41-07 fourth limit, T-41-74, not accepted). |
| 7 | Plan 41-07 prohibition / phase safety (CR-02, T-41-64): `note.js`, which every spawned role runs, cannot retire a green verdict or a human-disposed governed finding | VERIFIED | `describe("--supersedes never retires a verdict or a governed finding (CR-02)")` in `note.test.ts` passed (59 of 59). Plan 41-18 adds the refusal of a target in the store that cannot be read (mode 000, broken seal, directory, FIFO, dangling link, oversize), and the D-37 control (a target naming no note is admitted) still holds. `admit()` is re-based with the human's recorded words (D-37, D-39). Open and pinned: a renamed unreadable note reads as naming no note (R-41-09, T-41-81, not accepted). |

**Score:** 7/7 truths verified. 0 present-but-behavior-unverified: every behavior-dependent truth (1, 2, 6, 7) has a passing behavioral test or a run I made here.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/claim.ts`, `scripts/runnable-ref/claim.ts` and `claim.js` | Full lifecycle: claim, done, free, sweep, now-running | VERIFIED | Ran every verb on a lone copy; `claim.test.ts` and `runnable-ref/claim.test.ts` pass |
| `scripts/runnable-ref/note.ts` and `note.js` | Host note writer built from the `context-io.ts` authority | VERIFIED | `add` ran on a lone copy; `note.test.ts`, `note-read-sites.test.ts` pass |
| `scripts/context-io.ts` | Fail-closed root ladder and the supersession block in `admit()` | VERIFIED | Behavior proven by the tests above; `npm run freshness`: 91 committed `.js` fresh |
| `install/install.ts` `RUNNABLES` and `install/uninstall.ts` mirror | Rows for `claim.js` and `note.js` | VERIFIED | Present; a real `--codex` install wrote both to `tools/grugops/` |
| `agent-factory/workflows/17-task-claim.md` | Steps, refill, session start, session compaction, operator tips | VERIFIED | Read in full |
| `agent-factory/workflows/16-context-read-write.md` | Full `note.js add` command, supersession rule | VERIFIED with warnings | Overstatements recorded as WR-12, WR-15, CR-03 below |
| `agent-factory/roles/orchestrator.md` | Pointer, hard limit, under ceiling | VERIFIED | 6,192 B; lines 22, 33, 77, 79 |
| `install/README.md` | Names both programs and the scripted install | VERIFIED | 7 matches for `claim.js` or `note.js` |
| `docs/audit/41-residuals.md` | R-41-01 to R-41-09 recorded, none accepted by an agent | VERIFIED as recorded | None is accepted; see human items |

### Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| WF17 step 3 | `claim.js claim` | WIRED | Command ran as written |
| WF16 step 3 | `note.js add` | WIRED | Literal command ran; `role-route.test.ts` passed |
| `note.js add` to `claim.js done` | sealed-note check | WIRED | `done` refused, then accepted after `add` |
| WF17 session start step 3 | `now-running.md` `by` cell | WIRED (text) | Names the adapter in `by` and leaves an empty row |
| `RUNNABLES` to `RUNNABLES_MIRROR` | install and uninstall | WIRED | Same rows |
| `note.js` generated region to `context-io.ts` | authority | WIRED | Freshness green; the ladder now fails closed |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|---|---|---|---|---|
| `now-running.md` | rows | `claimedEntryNames` listing of `claimed/` | Yes (reproduced) | FLOWING |
| `free` | claimed count | the same listing | Yes (2, 0, 1 observed) | FLOWING |
| `done` | sealed-note check | notes under the `ref:` folder since `at` | Yes | FLOWING |

### Behavioral Spot-Checks

Run in scratch dirs under the session scratchpad, with the committed programs. No project state was changed.

| Behavior | Result | Status |
|---|---|---|
| `free`, two claims, `free`, duplicate claim | `free 2`, `claimed` x2, `free 0`, `lost t1` exit 1 | PASS |
| `--by grugops-orchestrator` in two letter cases | exit 2, queue unchanged | PASS |
| `done` with no note, `note.js add`, `done` | exit 1 `not-done`, `noted`, exit 0; row gone; `free 1` | PASS |
| `sweep` on a fresh claim | `swept 0`, exit 0 | PASS |
| Installer on a Codex target | `claim.js`, `note.js`, `package.json` in `tools/grugops/`; `claim.js free` ran | PASS |
| `note-read-sites`, `role-route`, `flow-guidance-text`, `claim`, `runnable-ref/claim`, `note` test files | 6 files, 512 of 512 | PASS |
| `npx tsc --noEmit`; `npm run freshness`; `check-foundation-guards.js`; `check-uat-oracles.js`; `validate-agent-factory.js` | exit 0; 91 `.js` fresh; each `ALL CHECKS PASSED` | PASS |

I did not re-run the full suite, as instructed. I rely on the orchestrator's two measurements at HEAD (11,625 cases, 22 failed). The 22 are the 21 names in `41-VALIDATION.md` "Known baseline reds" plus the `capture-live` dry-run case, which the orchestrator reports passed 77 of 77 alone on the default `TMPDIR`. I did not re-run that file.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists and no plan declares a probe.

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|---|---|---|---|---|
| RUN-01 | 41-01, 41-03, 41-04, 41-10 | In-flight log is `claimed/` rendered to `now-running.md` | SATISFIED | Truth 1 |
| RUN-02 | 41-01, 41-03 to 41-07, 41-09 to 41-18 | Refill from `wip_limit` minus `claimed/`, no timers | SATISFIED (live run owed) | Truths 2, 6, 7 |
| RUN-03 | 41-04, 41-06, 41-11 | Session compaction guidance and fresh-session fallback | SATISFIED | Truth 3 |
| RUN-04 | 41-04, 41-06, 41-11 | Same guidance on six hosts, one-line pointer, under ceiling | SATISFIED as text; five live runs owed | Truths 3, 4 |
| RUN-05 | 41-01, 41-03, 41-04, 41-05, 41-07, 41-09 to 41-18 | `claim.js` ships as a materialized runnable | SATISFIED | Truth 2 and the Codex install run |
| RUN-06 | 41-01, 41-02, 41-03, 41-04, 41-06, 41-08 | Tiered engineers by adapter name, no fork, no model override, no self-claim | SATISFIED | Truth 5 |

All six IDs are claimed by plan `requirements` fields. None is orphaned. **Bookkeeping, not changed here:** `.planning/REQUIREMENTS.md` still shows RUN-01, RUN-03, RUN-04 and RUN-06 as `[ ]`, and its table reads `Gaps Found` for RUN-01 and RUN-06 and `Pending` for RUN-03 and RUN-04. Those marks are stale against this report. RUN-04's checkbox is the one a human may prefer to hold until the live host runs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `agent-factory/workflows/16-context-read-write.md` | 41 | Calls the gate route "the workhorse path", yet no scripted host can write a green verdict (CR-03, reproduced by the review; I confirmed `note.ts` has no verdict verb) | Warning | Fails closed; a task can still close on a `claim` or `observation` |
| `agent-factory/workflows/16-context-read-write.md`, `17-task-claim.md` | step 1 / step 5 | Name `readContext` / `render` as the read route; a host has no `context-io.js` and `note.js` has one verb (WR-12) | Warning | A role on a host has no scripted read; a pre-existing seam |
| `CHANGELOG.md` | 141-143; WF16 line 31 | Supersession rules stated without R-41-09's limits (WR-15, T-41-62) | Warning | Overstates a control under `### Security` |
| `scripts/context-io.ts` | `emitVerdict`, D-03 clause | A duplicate green verdict has no sanctioned clearing route (WR-14) | Warning | Narrow corner: a retried emission step |
| `scripts/runnable-ref/note.ts` | 2877 | Exit 1 `refused` still covers some I/O faults (WR-09) | Warning | Ambiguous exit meaning |

The TBD / FIXME / XXX grep over `scripts/claim.ts`, `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/note.ts`, `17-task-claim.md` and `orchestrator.md` found no marker. No stub code found.

### Judgement on the open items

- **Open security threats (5, all below the high threshold):** T-41-62 (overstated sentences), T-41-66 and T-41-73 (accepted by D-37 and D-38, no Accepted Risks Log row), T-41-74 and T-41-81 (`pending (named human): accept`). `threats_open` is 0 against the block threshold. Each is a pinned, documented limit of the safety hardening around `note.js`, not a failure of a success criterion. **Tracked residuals.** Only a named human can accept T-41-74 and T-41-81.
- **CR-03 (critical, open):** it concerns the admission model for gate-stamped findings and `artifact-ref` on a scripted host. It does not falsify SC2: closing a task needs only a sealed note, and an `observation` closed one in my run. It fails closed and nothing false enters the context. The review itself says it needs a human decision, because the plain fix lets an agent mint a green verdict on a host. **Human decision item, not a gap.** If the maintainer reads "agents complete tasks" as including gate-verified findings, they should rule CR-03 a gap.
- **WR-12 and WR-13:** both predate plan 41-18 and sit in the WF16 read and admission layer that this phase reaches only through the writer. Tracked, open, human triage.
- **Human-owned items** (`<human-check>` of 41-17 and 41-18 Task 3, `pending (named human)` rows, the T-41-27 ruling, the Manual-Only rows, the five other-host live runs and Windows): not closed here. They are `human_needed` items, because only a human can accept them and they gate no code truth.
- **Gap-closure cap:** the roadmap allows four rounds. Three were used (41-07 to 41-12, 41-13 to 41-16, 41-17 and 41-18). A further round is still open, but I propose none: no must-have fails.

### Security and Validation Records

- `41-SECURITY.md`: `threats_open: 0`, audited 2026-11-08 with host-copy probes. Not a human sign-off.
- `41-VALIDATION.md`: `nyquist_compliant: true`; Manual-Only rows still wait on a named human.
- `41-REVIEW.md` (1019bf40): 1 critical, 6 warnings, 5 info; `41-REVIEW-DISPOSITION.md` has 26 of 33 rows open (human triage owed).
- No later roadmap phase (42, 43) names any open item, so nothing is deferred.

### Gaps Summary

None. Every roadmap success criterion and every gap-closure truth holds against the code, and I reproduced the behavior on lone host copies. The phase is not ready to be called complete until a named human supplies the live-host evidence and reads or accepts the items in `human_verification`.

---

_Verified: 2026-11-08T19:10:00Z_
_Verifier: Claude (gsd-verifier)_
