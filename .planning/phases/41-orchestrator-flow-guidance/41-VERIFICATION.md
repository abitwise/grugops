---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-05T15:30:00Z
status: gaps_found
score: 5/7 must-haves verified
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
  - agent-factory/config/factory.config.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/41-residuals.md
  - install/README.md
  - install/install.ts
  - install/uninstall.ts
  - scripts/claim.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note-read-sites.test.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/role-route.test.ts
covered_digest: "v3:sha256:35b614fa31237faecf3cb099675d2cfb770028597af17d09716b007a2bad596b"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/6
  gaps_closed:
    - "CR-01 (mechanism): a spawned role can write a sealed note by following the text, with note.js on a lone host copy"
    - "WR-01: Workflow 17 stops on a missing claim.js or note.js; install/README.md sections 1 and 3 name both"
    - "WR-02: Workflow 04 stop precedence lines 1 and 3 keep the three-hand-off limit"
    - "WR-03: Session start re-spawns the adapter named in `by` for each claim the sweep leaves"
    - "WR-04: every entry `free` counts has a row in now-running.md; the sweep reclaims a record-less directory by its modified time"
  gaps_remaining:
    - "READ-1 on note.js: a failed read can still print `noted` (12 rows red)"
  regressions: []
gaps:
  - truth: "READ-1, CR-01 (plan 41-12): a read that fails in note.js never prints `noted`; every derived pair ends non-zero or names the note that stands"
    status: failed
    reason: "Reproduced by running scripts/runnable-ref/note-read-sites.test.ts: 12 of the 64 derived (site, via) rows fail. Each ends `noted`, exit 0, after its read fails. The 9 other rows that also end `noted` were moved into a pinned second map by the human ruling of 2026-11-05. The ruling let plan 41-12 run; it does not make the truth hold. The plan's own success criterion, 'no failed read in the shipped program reports a note', is stated as NOT met in 41-12-SUMMARY.md. Five of the 12 rows lose the human_admission dial: under `human_admission: all`, a security-nfr finding stamped `human:eve` is refused by an unfaulted run and noted by the faulted one (41-SECURITY.md T-41-55, high, open, R-41-07 'Not accepted')."
    artifacts:
      - path: "scripts/runnable-ref/note.ts"
        issue: "The trustedRepoRoot ladder embedded in the generated region fails open: statSync and existsSync failures at directoryIdentity, projectRootFromWorkingDirectory and hostDeliveredRoot lose the dial"
      - path: "scripts/context-io.ts"
        issue: "The authority the region is generated from. The fix is named for a gap plan that is not yet written; the plan prohibits editing the region from note.ts"
    missing:
      - "A gap plan that makes the ladder fail closed in scripts/context-io.ts, regenerates note.js, and turns the 12 rows green with no widening"
      - "A named human decision on T-41-55 and T-41-30 (both open at the block threshold in 41-SECURITY.md, threats_open: 2), or the fix"
  - truth: "Plan 41-07 and the phase 41 safety posture: note.js, which every spawned role now runs, can never relax what human_admission protects"
    status: failed
    reason: "CR-02 from 41-REVIEW.md, reproduced here on lone host copies. With a sealed security-nfr finding stamped `human:olger` and the config at `human_admission: all`, `note.js add t2 --kind claim --by software-engineer --confidence low --supersedes <finding id> --body ...` ended `noted`, exit 0, and the finding moved to `## Superseded (history)` in index.md. admit() never reads `supersedes`, so any role retires a human-disposed security finding with no stamp. It needs no hostile agent, because Workflow 18 names supersession as the honest update route. The finding is critical and `open` in 41-REVIEW-DISPOSITION.md, with no residual and no acceptance."
    artifacts:
      - path: "scripts/context-io.ts"
        issue: "admit() ignores `supersedes`; currentState drops any note a later note names"
      - path: "scripts/runnable-ref/note.ts"
        issue: "Passes --supersedes through to the authority; hands the route to every role on every host"
    missing:
      - "Decide supersession in admit() in scripts/context-io.ts (refuse a target that names no note, a green gate verdict, or a governed finding), regenerate, and add the case to note.test.ts. Check Workflow 18's promotion routes first. Or a named human accepts a narrower rule and a residual records it"
deferred: []
human_verification:
  - test: "One live Claude Code run on a plugin install and one on a standalone install: spawn a role, have it publish a note by the command in Workflow 16 step 3, have it run `claim.js done`"
    expected: "The role writes through tools/grugops/note.js, `done` exits 0, the row leaves now-running.md and `free` rises"
    why_human: "role-route.test.ts reads the commands from the kit text and runs them on lone copies, and I ran the same sequence here. Neither shows what a host's permission model lets a spawned role run. R-41-01 and CR-01 stay open until a named human reads that run."
  - test: "Read the `pending (named human)` rows: 68 across docs/audit/29-style-dispositions/41-*.md (counted by grep), including those in 41-04.md, 41-06.md, 41-08.md and 41-11.md, and WF04 line 48 against its diff"
    expected: "A named human replies with a name, or rejects a row"
    why_human: "The gate proves a row exists and cannot judge meaning. 41-SECURITY.md T-41-27 holds only while these rows stay pending. Not filled here."
  - test: "Read residuals R-41-01 to R-41-07 in docs/audit/41-residuals.md"
    expected: "A named human accepts each in a form that names its scope, or rejects it. R-41-07 (the dial loss) is marked 'Not accepted'"
    why_human: "No agent may accept a residual. 41-SECURITY.md records that no human has signed the accepted-risks log."
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone, and a role writes and closes with note.js"
    why_human: "These CLIs are absent here (R-41-05, `UNKNOWN - verify`)"
  - test: "Windows run of note.js's trustedRepoRoot ladder (rung 1 against rung 2 can spell a path differently, for example RUNNER~1)"
    expected: "The 9 Group A rows still equal an unfaulted run"
    why_human: "41-12 proved equality on Linux only; Windows is `UNKNOWN - verify`"
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-05T15:30:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap-closure plans 41-07 to 41-12

## Verdict

The five gaps of the first report are closed in the way they were stated, and I confirmed each against the code and by running the shipped programs. A spawned role now has a text-reachable route to the sealed note `done` needs. The two goals on the flow side, refill from disk and the fresh-session fallback, hold.

The phase is still `gaps_found`, for two reasons that sit in the new writer, `note.js`, which plans 41-07 to 41-12 added to close CR-01:

1. **READ-1 is unmet.** 12 rows of `scripts/runnable-ref/note-read-sites.test.ts` fail on the committed tree, and each ends `noted`, exit 0, after a failed read. This is plan 41-12's central must-have. The human ruling of 2026-11-05 let the plan run and sent the 12 rows to a gap plan that is not written. It did not make the truth true. 41-SECURITY.md carries it as T-41-55 (high, open, unaccepted).
2. **CR-02 is reproduced.** Any role can retire a human-disposed security finding with an unstamped `--supersedes` note under `human_admission: all`. Open and critical in the disposition ledger, with no residual.

41-SECURITY.md also reports `threats_open: 2` (T-41-30 and T-41-55), so its own gate blocks advancement.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED | Scratch host with `claim.js` and `note.js` beside a `package.json` of `{"type":"module"}`: two claims rendered two rows. After `done t1` the t1 row was gone. WR-04 is fixed: a bare `claimed/ghost` directory rendered as a row with `since` `unknown`, and `free` counted it. A 3-hour-old `ghost` was reclaimed by `sweep` (`swept 1 / reclaimed ghost`). Warning WR-11 below: a stray file and a directory with an unsafe name get a row but are never reclaimed |
| 2 | SC2, RUN-02 and RUN-05: on completion the Orchestrator refills `wip_limit` minus the `claimed/` count read from disk with no timers; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host run owed | `free 2`, then `free 0` after two claims. `done t1` first printed `not-done t1: no sealed note ...`, exit 1. Then `node tools/grugops/note.js add t1 --kind observation --by software-engineer --confidence medium --body ...` printed `noted t1 <id>`, and `done t1` exited 0, the row left and `done/t1.md` existed. That is the first report's CR-01 route, now present. `role-route.test.ts` runs the literal commands read from Workflow 16 and 17. It passed in my run (3 files, 199 of 199) and `note.test.ts` and `claim.test.ts` passed. Whether a host permits a spawned role to run it is a human item. The finding that can be written here is limited by CR-02, CR-03 and READ-1 below |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18, with observable triggers and a fresh-session fallback that re-reads the in-flight log; `orchestrator.md` carries a one-line pointer and stays under its ceiling | VERIFIED | WR-03 is fixed: `## Session start` step 3 re-spawns the adapter named in `by` for each claim the sweep leaves, fills the slot the claim holds, and leaves an empty-`by` row. Step 3 sits after the sweep and before the refill. `orchestrator.md` is 6,192 B against the 6,195 B WARN; `node scripts/check-foundation-guards.js` passed |
| 4 | SC4, RUN-04: the flow guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only) | The new steps key on whether the `Agent` tool exists and name no host. Host names sit in `## Platform depth and width` and `### Operator tips (optional)`. `flow-guidance-text.test.ts` passed. Live behavior on five hosts is not run (R-41-05) |
| 5 | SC5, RUN-06: the Orchestrator starts tiered engineers by adapter name, never forks, never overrides the model, never claims a ticket itself | VERIFIED | Workflow 17 step 4 says non-fork and passes no `model` or `effort`. WR-02 is fixed: Workflow 04 step 15 lines 1 and 3 each end `The three-hand-off limit and the stop before a fourth hand-off still apply.` `claim --by` refuses an Orchestrator owner (checked in the first report, `claim.test.ts` still passes) |
| 6 | Plan 41-12, READ-1 (CR-01, RUN-02, RUN-05): a read that fails in `note.js` never prints `noted`; no failed read ends exit 0 | FAILED | `npx vitest run scripts/runnable-ref/note-read-sites.test.ts`: 12 failed, 228 passed across the three files I ran. Failing rows: `directoryIdentity:statSync#0` via `namedHomeDirectory#0`, `homeBoundary#0..2`, `isAboveHome#0`, `isHomeItself#0`; `projectRootFromWorkingDirectory:existsSync#0` and `#1` via `trustedRepoRoot#0` and `governanceRootOf#0`; `hostDeliveredRoot:statSync#0` and `existsSync#0`. These match the 12 names in 41-12-SUMMARY.md and the 12 extra failures in the orchestrator's full run. No skip, `.fails` or `.todo` hides them. See Gaps |
| 7 | Plan 41-07 prohibition and phase safety: `note.js` can never grant or relax a high-severity admission | FAILED | CR-02 reproduced (see Verdict and Gaps). The write of a finding is guarded by the dial; the removal of one from the current state is not |

**Score:** 5/7 truths verified. 0 present-but-behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/runnable-ref/note.ts` and `note.js` | Host note writer from the `context-io.ts` authority | VERIFIED as shipped, with the fail-open above | Runs on a lone copy. Output lines `noted`, `refused`, exit codes 0, 1, 2 as designed. `freshness` passed: 91 committed `.js` match a rebuild |
| `scripts/claim.ts`, `scripts/runnable-ref/claim.ts` and `.js` | Lifecycle, `claimedEntryNames` listing behind count and render | VERIFIED | `free` and the render agree on a bare directory (reproduced) |
| `install/install.ts` `RUNNABLES` and `install/uninstall.ts` `RUNNABLES_MIRROR` | Row for `tools/grugops/note.js` | VERIFIED | Present at install.ts:6058 and uninstall.ts:2807. I did not run the install tests (full-suite run by the orchestrator shows no new failure outside the 12 rows) |
| `install/README.md` | Sections 1 and 3 name both programs and the scripted install | VERIFIED | Lines 32, 458-468, 1685 |
| `agent-factory/workflows/17-task-claim.md` | Stop on a missing program, exit rules, crash re-spawn, session compaction | VERIFIED | Read in full |
| `agent-factory/workflows/16-context-read-write.md` | Full `note.js add` command | VERIFIED | Step 3 and step 5. It says `<folder>` is the bare task name; passing a path exits 2, which I confirmed |
| `scripts/runnable-ref/role-route.test.ts`, `note-read-sites.test.ts` | Route proof, READ-1 over all pairs | VERIFIED as tests | The route test passes; the READ-1 test correctly fails on 12 rows |
| `docs/audit/41-residuals.md` | R-41-01 to R-41-07 | VERIFIED as recorded, none accepted | R-41-01 now names the spawned-role case |

### Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| WF16 step 3 | `note.ts` `USAGE` | WIRED | The literal command ran against a lone copy |
| `note.js add` | `claim.js done` | WIRED | Sealed note accepted, row removed |
| WF17 Session start step 3 | `now-running.md` `by` cell | WIRED (text) | Names the adapter in `by`, leaves an empty one |
| `RUNNABLES` | `RUNNABLES_MIRROR` | WIRED | Same row in both |
| `note.js` generated region | `scripts/context-io.ts` authority | PARTIAL | Region is fresh, but the `trustedRepoRoot` ladder inside it fails open on a failed read (READ-1) |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|---|---|---|---|---|
| `now-running.md` | rows | `claimedEntryNames` listing of `claimed/` | Yes (reproduced) | FLOWING |
| `free` | claimed count | the same listing | Yes | FLOWING |
| `done` | sealed-note check | notes under the `ref:` folder since `at` | Yes | FLOWING |

### Behavioral Spot-Checks

Run in a scratch repo under the session scratchpad, with the committed `claim.js` and `note.js` copied alone into `tools/grugops/` beside a `package.json` of `{"type":"module"}`, which is what the installer writes there.

| Behavior | Result | Status |
|---|---|---|
| `free` at wip_limit 2, then after two claims | `free 2`, then `free 0` | PASS |
| `done` with no note | `not-done t1: no sealed note ...`, exit 1 | PASS |
| `note.js add t1 ...` then `done t1` | `noted t1 <id>`, exit 0; `done t1`, exit 0; row gone | PASS |
| `note.js add` with a path as `<folder>` | exit 2, nothing written | PASS (matches WF16 text) |
| Record-less `claimed/ghost` | `free` counts it, render shows `unknown`, aged 3 h `sweep` reclaims it | PASS (WR-04 closed) |
| Stray file and unsafe-name directory in `claimed/`, aged 3 h | Rows shown, `sweep` leaves both, slot stays held | WARNING (WR-11 reproduced) |
| CR-02: `--supersedes` of a human-disposed security finding under `human_admission: all`, `audit_retention: retained` | `noted`, exit 0, finding moved to `## Superseded (history)` | FAIL (reproduced) |
| `scripts/runnable-ref/note-read-sites.test.ts` | 12 rows red | FAIL |
| Single files: `role-route.test.ts`, `flow-guidance-text.test.ts`, `claim.test.ts`, `note.test.ts`, `runnable-ref/claim.test.ts` | all passed | PASS |
| `npm run freshness`; `node scripts/check-uat-oracles.js`; `npm run check:claim-anchors`; `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`; `node scripts/check-foundation-guards.js` | all report `ALL CHECKS PASSED` / fresh | PASS |

I did not run the full suite, as instructed. I rely on the orchestrator's measure at 7d0bb17a: 33 failed, which are the 21 named in `41-VALIDATION.md` § Known baseline reds plus the 12 READ-1 rows I reproduced above. Plan 41-11's truth 'the full suite adds no failure name beyond the baseline' therefore does not hold either; the cause is the same 12 rows.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists and no plan declares a probe.

### Requirements Coverage

| Requirement | Source plans | Status | Evidence |
|---|---|---|---|
| RUN-01 | 41-01, 41-03, 41-04, 41-10 | SATISFIED, with warning WR-11 | Truth 1 |
| RUN-02 | 41-01, 41-03, 41-04, 41-05, 41-06, 41-07, 41-09, 41-10, 41-11, 41-12 | SATISFIED for refill and for completion by the shipped route; live run owed | Truths 2 and 3. Tied to READ-1 through plan 41-12 |
| RUN-03 | 41-04, 41-06, 41-11 | SATISFIED | Truth 3 |
| RUN-04 | 41-04, 41-06, 41-11 | SATISFIED as text; live runs pending (R-41-05) | Truths 3 and 4 |
| RUN-05 | 41-01, 41-03, 41-04, 41-05, 41-07, 41-09, 41-11, 41-12 | PARTIAL | `claim.js` and `note.js` ship and run. The shipped writer fails open on 12 read-failure rows (truth 6) and carries CR-02 (truth 7) |
| RUN-06 | 41-01, 41-02, 41-03, 41-04, 41-06, 41-08 | SATISFIED | Truth 5 |

All six IDs appear in plan `requirements` fields; none is orphaned (I read the plan frontmatter, not only the roadmap). Bookkeeping, not changed here: `REQUIREMENTS.md` marks only RUN-06 `[x]` and its table reads `Gaps Found` for RUN-01 and RUN-05, `Pending` for RUN-02, 03, 04, and `Complete` for RUN-06.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/runnable-ref/note.ts` (generated region) | n/a | Read failure ends `noted`, exit 0 (12 rows) | Blocker | Truth 6 |
| `scripts/context-io.ts` `admit()` | n/a | `supersedes` never read | Blocker | Truth 7 (CR-02) |
| `agent-factory/workflows/17-task-claim.md` | Session start step 3 | Says a later sweep reclaims an empty-`by` row; for a stray file or an unsafe name it never does (WR-11, reproduced) | Warning | A slot is held with no route out except a human removing the entry. The row shows, so it is visible |
| `agent-factory/workflows/16-context-read-write.md` | step 3 and the 'workhorse path' line | A `§14-gate#<id>` finding and every `artifact-ref` are refused on a scripted host: no host program can write a green verdict (CR-03). Fails closed | Warning | The text overstates the path; a task can still close on a `claim` or `observation` |
| `41-REVIEW-DISPOSITION.md` | 23 rows `open` of 29 | Untriaged, including CR-02, CR-03, WR-05 to WR-13 | Warning | Needs triage |

TBD, FIXME and XXX grep over `scripts/claim.ts`, `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/note.ts`, `17-task-claim.md` and `orchestrator.md` found no marker. No stub code found.

### Security and Validation Records

- `41-SECURITY.md`: `status: open`, `threats_open: 2`. T-41-55 (the `trustedRepoRoot` dial loss, high) and T-41-30 (adapter spellings, high) are open and unaccepted. T-41-52 (a failed read reporting a note, medium) is open. T-41-27 holds only while the `pending (named human)` rows stay pending. Its own header says phase advancement is blocked.
- Human rulings stand on record: the 9 Group A rows in a pinned second map, the 12 Group B rows red for a gap plan not yet written. That ruling is respected as a process decision and not read as proof.
- `deferred-items.md`: open entries (symlink under `claimed/`, the double-fault `takeClaim` cleanup, the untracked `~/` directory failing `LIVE COUNT`) are low severity and do not change a truth above. `LIVE COUNT` passes in a clean clone, per 41-12-SUMMARY.md; I did not clone.
- No later roadmap phase names the ladder fix or the supersession rule, so nothing is deferred.

### Human Verification Required

See the `human_verification` frontmatter list: the live Claude Code run for CR-01, the `pending (named human)` rows, the residual reads (R-41-01 to R-41-07), the five-host live run, and the Windows ladder check. All are owed to a named human and none was filled here.

### Gaps Summary

Two gaps, both in `note.js`, the writer the closing plans added. They are separate and each needs a decision or a plan.

1. **READ-1 and T-41-55.** The fix lives in `scripts/context-io.ts` (make the `trustedRepoRoot` ladder fail closed), which plan 41-12 prohibits editing from note.ts. A gap plan is named and not written. Until it lands, 12 tests stay red and a governed repository can lose its `human_admission` dial on a failed `stat`.
2. **CR-02.** Decide supersession in `admit()`, or have a named human accept a narrower rule and record a residual.

Warnings that do not block a truth: WR-11 (Workflow 17 promises a reclaim that never comes for a stray file or unsafe name), CR-03 (no scripted host can write a green verdict), and the 21 other open review rows.

---

_Verified: 2026-11-05T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
