---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-12T22:30:00Z
status: gaps_found
score: 10/11 must-haves verified
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
  - .planning/phases/41-orchestrator-flow-guidance/41-26-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-26-SUMMARY.md
  - CHANGELOG.md
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/context-note.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - docs/audit/29-style-dispositions/41-11.md
  - docs/audit/29-style-dispositions/41-20.md
  - docs/audit/29-style-dispositions/41-23.md
  - docs/audit/29-style-dispositions/41-26.md
  - docs/audit/41-residuals.md
  - install/README.md
  - install/install.ts
  - install/uninstall.ts
  - scripts/claim.ts
  - scripts/context-io.ts
  - scripts/flow-guidance-text.test.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
covered_digest: "v3:sha256:69b7506d20481b748ee843839239ae3ce8ab4f279887662f17ec02b66555a882"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 8/8
  gaps_closed: []
  gaps_remaining: []
  regressions:
    - "Plan 41-26 truth 1 (and its closing success statement) fails at two older sites, which is a new finding of this round, not a regression of a roadmap success criterion"
gaps:
  - truth: "WR-18, D-45 (plan 41-26 truth 1): Workflow 16 step 3, the third admission outcome, the note contract, both CHANGELOG bullets and residual R-41-11 name a Claude Code plugin install as the place where the Orchestrator holds `propose_note` behind the hook, and none of them keeps a route claim that says only Claude Code"
    status: failed
    reason: "Two sentences inside the named artifacts still say the per-call `admission-guard` hook exists 'on Claude Code', with no plugin-install scope. Workflow 16 line 32 (a sub-bullet of step 3) says 'On Claude Code the separate PER-CALL PreToolUse `admission-guard` hook makes the `human:<name>` signal un-forgeable', 'The Claude Code primary tier is gated by the `human_admission` dial' and 'The non-Claude-Code host CLIs degrade to two weaker signals'. `agent-factory/contracts/context-note.md` line 138 says 'on Claude Code its un-forgeable human-set signal is delivered by the separate PER-CALL PreToolUse `admission-guard` hook'. `install/install.ts` writes no hook and no MCP server, so a standalone Claude Code install reading these lines is told it has a control it lacks. Line 31 of the same step now says 'A standalone Claude Code install has no hook', so step 3 contradicts itself from one bullet to the next. The plan's own closing statement ('No kit text tells a standalone Claude Code install it holds `propose_note` or the hook') is false at HEAD. 41-REVIEW-DISPOSITION.md nonetheless records WR-18 as `fixed | 41-26`. The new negative pin passes because its list holds only the five phrases the plan replaced."
    artifacts:
      - path: "agent-factory/workflows/16-context-read-write.md"
        issue: "Line 32 (finding sub-bullet of step 3): 'On Claude Code ... hook', 'The Claude Code primary tier', 'The non-Claude-Code host CLIs degrade', 'A spawned role on Claude Code gets the same two' are unscoped"
      - path: "agent-factory/contracts/context-note.md"
        issue: "Line 138: 'on Claude Code its un-forgeable human-set signal is delivered by the separate PER-CALL PreToolUse admission-guard hook' is unscoped"
      - path: "scripts/flow-guidance-text.test.ts"
        issue: "The WR-18 negative loop (about lines 1358-1371) lists only the five replaced phrases, so it cannot catch the two surviving sentences"
      - path: ".planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md"
        issue: "WR-18 reads `fixed | 41-26` though two sites of the same claim stay; 41-26-SUMMARY.md lists them as 'left for a later ruling'"
    missing:
      - "Scope the line-32 sentences and the context-note.md line-138 sentence to a Claude Code plugin install, and say every other install, a standalone Claude Code install included, gets the two weaker signals (text only, no program code)"
      - "Add the three phrases ('On Claude Code the separate PER-CALL', 'The non-Claude-Code host CLIs degrade', 'on Claude Code its un-forgeable') to the negative pin, and give each changed clause a row in docs/audit/29-style-dispositions/"
      - "Or, if the human keeps those sites deferred, set WR-18 in 41-REVIEW-DISPOSITION.md to a partial state that names the two sites, or record an override (see Gaps Summary)"
deferred: []
advisory:
  - finding: "WR-01 (41-REVIEW.md of 2026-11-12T21:55Z): 'like the other hosts' in Workflow 16 line 31 and R-41-11 contradicts D-44, under which a plugin install is a host that has the hook"
    category: other
    reason: "The wording is the one D-45 and plan 41-26 truth 2 prescribe, so it matches the plan. It is ambiguous, not false by itself. A named human rules on it."
    evidence_status: "read and confirmed in the text; no failing test"
  - finding: "WR-02: R-41-11 reads as accepted for a scope Olger did not read; the residual does not record the owed re-read"
    category: other
    reason: "The decision, why and what-closes-it cells are byte-identical to 260eed07 (I diffed them cell by cell). Only the what-stays-open cell changed. The re-read is owed to a named human."
    evidence_status: "cell diff run here"
  - finding: "WR-03: session start step 3 now opens with 'Stop', which can read as halting session start before the other claims and the refill"
    category: other
    reason: "The same step says 'Finish each other claim' and step 4 refills, so a careful reader goes on. No test exercises the reading; the pin checks strings only."
    evidence_status: "read in the text; no failing test"
  - finding: "IN-01 to IN-05 of the new review: a stale pin title, a fourth local copy of CHANGELOG and flat in the test file, R-41-11 held only by a one-time grep, role files that still send deliverables to artifact-ref, and the 2026-11-10 ruling that still says R-41-09 (c) is unaccepted"
    category: other
    reason: "Cosmetic or already accepted by Olger (R-41-10). None falsifies a success criterion."
    evidence_status: "review account; I read IN-04 and IN-05 sites"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04; 41-UAT test 2, blocked)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent on this machine (R-41-05, `UNKNOWN - verify`). RUN-04's 'reads the same on all six hosts' is proven for the text only. Olger accepted R-41-05 and carried it to the milestone UAT."
  - test: "Windows run of note.js's trustedRepoRoot ladder (41-UAT test 3, blocked)"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "No Windows machine is reachable; Windows is `UNKNOWN - verify`."
  - test: "Olger reads R-41-11 as plan 41-26 rewrote it (docs/audit/41-residuals.md line 23) against his reply in 41-UAT.md test 8"
    expected: "He confirms his acceptance covers a standalone Claude Code install having no route, or sends it back"
    why_human: "No agent may accept a residual or write a named human's acceptance. The plan itself lists this read as owed."
  - test: "Rule the 17 `pending (named human)` rows of docs/audit/29-style-dispositions/41-26.md, and the earlier pending rows of 41-19.md to 41-25.md"
    expected: "Each row accepted or sent back by a named human"
    why_human: "The diff-disposition gate proves each changed clause has a row. It cannot prove a disposition is right, and no agent may write `accepted`."
  - test: "Rule the nine open rows of 41-REVIEW-DISPOSITION.md (CR-01, WR-01 to WR-03, IN-01 to IN-05 of the 21:55Z review), and the eight deferred rows (WR-16, WR-17, IN-16 to IN-18 and the carried ones)"
    expected: "Each row fixed, accepted or sent to a later phase by a named human; CR-01 is the row that decides the gap above"
    why_human: "Disposition is a human ruling."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-12T22:30:00Z
**Status:** gaps_found
**Re-verification:** Yes. It follows the 215cf188 report (`human_needed`, 8/8) and covers gap-closure plan 41-26 (commits 93a3f77c to 99cc670f). That report is replaced.

## Verdict

The phase goal still holds in the code. The five roadmap success criteria and RUN-01 to RUN-06 are met, and I found no regression in the queue, the note writer or the session-start flow (see Truths 1 to 8, re-checked below).

The status moves from `human_needed` to `gaps_found` for one reason, and it is narrow. Plan 41-26 truth 1 says no sentence in Workflow 16 step 3, the third admission outcome, the note contract, the CHANGELOG bullets or R-41-11 keeps a route claim that says only "Claude Code". Two such sentences survive, one inside Workflow 16 step 3 itself (line 32) and one in the note contract (line 138). I read both. They tell a standalone Claude Code install that a per-call hook makes its `human:<name>` stamp un-forgeable, and that install has no hook. The project rule is never to overstate a control, and this is governance text. The ledger meanwhile marks WR-18 `fixed`.

This is the orchestrator's CR-01, and I confirm it. I weighed it against the must-haves as follows.

- **For failing the truth:** Truth 1 names Workflow 16 step 3 and the note contract as whole artifacts, and line 32 is a sub-bullet of step 3. The plan's closing sentence ("No kit text tells a standalone Claude Code install it holds `propose_note` or the hook") is false. Step 3 now contradicts itself between line 31 and line 32.
- **Against failing it:** the human-ruled gap G-41-9-WR-18 in 41-UAT.md names lines 31 and 43, `context-note.md:44`, `CHANGELOG.md:148` and `:180` and R-41-11, and plan 41-26's planning notes deliberately left lines 32 and 138 alone, saying so openly in the SUMMARY. Those named sites are fixed and pinned.
- **Call:** the truth as written fails, and the openly listed deferral does not turn it into a pass, because the ledger still says `fixed` and nothing in the kit marks the two sites. The fix is text only and small. It is a gap, not a reason to doubt the phase goal. A named human can also close it by an override or by ruling CR-01 (see Gaps Summary). I did not write an override for them.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED (regression check) | `claim.ts`, `runnable-ref/claim.ts` and `now-running-freshness.test.ts` unchanged since the prior report by plan 41-26 (`git diff a9557964 99cc670f` touches no `.ts` but the one test). Focused run below: 789 of 789 pass, including the claim and freshness files. |
| 2 | SC2, RUN-02 and RUN-05: refill from `wip_limit` minus the `claimed/` count read from disk, no timers; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host runs owed | Same unchanged programs; `runnable-ref/claim.test.ts`, `claim-read-sites.test.ts`, `runnable-exit-contract.test.ts` pass. WF17 `## Keep capacity full` (line 68) is present. Live host runs stay owed (human item 1). |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` (line 93) named apart from WF18; `orchestrator.md` has the one-line pointer and stays under its ceiling | VERIFIED | `## Session compaction` and `## Session start` headings present. `orchestrator.md` is 6,158 B, unchanged and under the 7,165 B WARN ceiling. |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | `flow-guidance-text.test.ts` passes 155 of 155. The five-host live run stays owed (human item 1). |
| 5 | SC5, RUN-06: tiered engineers started by adapter name, never forked, no model override, no self-claim | VERIFIED | `tier-kit-text.test.ts` passes inside the focused run. No plan 41-26 diff touches the tier text. |
| 6 | Plan 41-26 WR-19: session start step 3 opens with the stop on each `kept` or `left` line and says never to re-spawn a task named there, before any re-spawn instruction | VERIFIED | `17-task-claim.md` line 86 reads "3. Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it. Never re-spawn a task named on such a line. Finish each other claim still in `now-running.md`. ... Re-spawn the adapter named in `by`". The stop and the never-re-spawn sentence precede the re-spawn instruction. Pinned by the 41-26 describe, which passes. The reading risk in advisory WR-03 is noted, not a failure. |
| 7 | Plan 41-26 IN-19: role-switch step 4 sends a deliverable to `artifact-ref` only where step 3 of Workflow 16 admits one, else to an `observation` carrying its refs | VERIFIED | `_role-switch-protocol.md` line 22: "Publish deliverables as `artifact-ref` where step 3 of Workflow 16 admits one, and otherwise as an `observation` carrying their refs." |
| 8 | Plan 41-26 IN-20: Workflow 05's escape hatch scopes the Step-4 stamp route to a repository holding grugops's own `scripts/context-io.js` and sends a host to a `claim` or escalation per Workflow 16 step 4 | VERIFIED | `05-pr-quality-gate.md` line 57: "This route exists only where `emitVerdict` runs, in a repository holding grugops's own `scripts/context-io.js`. On a host, degrade to a `claim` or escalate, per Workflow 16 step 4." |
| 9 | Plan 41-26: R-41-11's acceptance is unchanged. Its decision, why and what-closes-it cells are byte-identical to 260eed07; 41-SECURITY.md, 41-UAT.md, 41-VERIFICATION.md and 41-VALIDATION.md are untouched by the plan | VERIFIED | I split the R-41-11 row of `260eed07:docs/audit/41-residuals.md` and of HEAD on `|`: 6 of 7 cells are identical and only the what-stays-open cell differs. `git diff --name-only a9557964 99cc670f` lists none of the four files. (41-SECURITY.md and 41-VALIDATION.md changed later in orchestrator commits 28fddff2 and 0720323c, outside the plan.) |
| 10 | Plan 41-26: no program code changed; the only `.ts`, `.js` or `.json` path is `scripts/flow-guidance-text.test.ts`. Every changed clause has a `pending (named human)` row and none reads `accepted`. The ledger reads `fixed` with 41-26 for WR-18, WR-19, IN-19, IN-20 | VERIFIED (ledger reading as recorded; see Truth 11 for its accuracy) | `git diff --name-only a9557964 99cc670f` lists exactly one program-type file, the test. `41-26.md` has 18 `pending (named human)` matches (17 rows plus the header's mention) and no `| accepted` line. `node scripts/check-diff-disposition.js` exits 0 with "ALL CHECKS PASSED". The four rows read `fixed | 41-26`. |
| 11 | Plan 41-26 truth 1 (WR-18): the route is named as a plugin-install route in Workflow 16 step 3, the third admission outcome, the note contract, both CHANGELOG bullets and R-41-11, and none keeps a route claim that says only Claude Code | FAILED | The five replaced phrases are gone and the new sentences are present (line 31, the third outcome, R-41-11). But `16-context-read-write.md` line 32 and `context-note.md` line 138 still say the per-call hook exists "On Claude Code", unscoped. See the gap. |

**Score:** 10/11 truths verified (the 41-26 plan truths grouped as 6 to 11; truth 11 failed). 0 present-but-behavior-unverified.

Plan 41-26 also carried a tenth truth, "the full suite ends on exactly the 21 names of § Known baseline reds". I did not re-run the full suite (about 26 minutes; I am told not to). The orchestrator reports two runs, each 21 failed, 11,729 passed, 2 skipped, with every failed name in the baseline table. I rely on that report and did not re-compare the names. Treat it as taken on trust, and it is not counted in the score.

### Deferred Items

None. Phases 42 (skills per role) and 43 (story and layered docs) do not name this text, so the gap is not deferred.

### Advisory (New Scope, Unevidenced)

| # | Finding | Category | Why Advisory |
|---|---------|----------|--------------|
| 1 | WR-01: "like the other hosts" against D-44 | other | The wording is the plan's own prescription. A human rules on it. |
| 2 | WR-02: R-41-11 re-read not recorded in the residual | other | The acceptance cells are byte-identical; the read is owed to a named human. |
| 3 | WR-03: "Stop" opens session start step 3 | other | The rest of the step and step 4 carry on; no test exercises the reading. |
| 4 | IN-01 to IN-05 | other | Cosmetic or accepted already. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/workflows/16-context-read-write.md` | Route scoped to a plugin install; standalone install named as having no hook | PARTIAL | Line 31 and the third outcome hold "A standalone Claude Code install has no hook, like the other hosts." and the plugin-install scope. Line 32 keeps unscoped hook claims. |
| `agent-factory/workflows/17-task-claim.md` | Session start stops on a kept claim before any re-spawn | VERIFIED | Contains "Never re-spawn a task named on such a line." |
| `agent-factory/roles/_role-switch-protocol.md` | Deliverables routed by Workflow 16 step 3 | VERIFIED | Contains "where step 3 of Workflow 16 admits one". |
| `agent-factory/workflows/05-pr-quality-gate.md` | Escape hatch scoped | VERIFIED | Contains "On a host, degrade to a `claim` or escalate, per Workflow 16 step 4." |
| `scripts/flow-guidance-text.test.ts` | Plan 41-26 pins and moved pins | VERIFIED (pins miss the two older sites) | 155 of 155 pass; "plan 41-26" appears at lines 250, 460, 475, 487, 883, 907, 916, 1075, 1311. |
| `docs/audit/29-style-dispositions/41-26.md` | A pending row per changed clause | VERIFIED | 17 pending rows, no `accepted`; `check-diff-disposition` exits 0. |
| `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md` | Four rows fixed | VERIFIED as recorded, inaccurate for WR-18 | Lines 194, 195, 199 and 200 read `fixed | 41-26`. The file's `open` count is now 9 for the new review's rows. |
| `agent-factory/contracts/context-note.md` | Hook claim scoped | PARTIAL | Line 44 area scoped; line 138 not. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Workflow 16 third admission outcome | R-41-11 in `docs/audit/41-residuals.md` | the residual id and the same plugin-install scope | WIRED | The outcome cites R-41-11 and says "On a Claude Code plugin install"; R-41-11's what-stays-open cell carries the same scope. |
| `flow-guidance-text.test.ts` describe for plan 41-26 | Workflows 05, 16, 17, the note contract, the role-switch protocol, CHANGELOG | `toContain` and `not.toContain` pins | WIRED, with a coverage hole | The pins hold what they list. They do not list the two surviving sentences (the gap). |
| `41-REVIEW-DISPOSITION.md` | plan 41-26 | Source cell of each of four rows | WIRED | `fixed | 41-26` on all four rows. |

### Data-Flow Trace (Level 4)

Not applicable to this round. Plan 41-26 changed text and one test, and no rendered dynamic value. The queue and note programs were not changed; their data flow was traced in the prior report and their tests still pass.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Plan 41-26 wording pins | `npx vitest run scripts/flow-guidance-text.test.ts` | 1 file, 155 of 155 passed | PASS |
| Queue, note, route and tier suites | `npx vitest run` on `claim`, `now-running-freshness`, `runnable-ref/claim`, `claim-read-sites`, `note`, `note-read-sites`, `runnable-exit-contract`, `tier-kit-text` | 8 files, 789 of 789 passed | PASS |
| Role-route pins | `npx vitest run scripts/role-route.test.ts` | passed inside a 5-file, 632 of 632 run | PASS |
| Text gates | `node scripts/check-diff-disposition.js`, `check-imperative-lexicon.js`, `check-banned-claims.js`, `check-kit-refs.js`, `check-role-rules.js` | each exit 0; diff-disposition prints "ALL CHECKS PASSED" | PASS |
| R-41-11 acceptance cells unchanged | cell-wise compare of the row at `260eed07` and HEAD | 6 of 7 cells identical, only what-stays-open differs | PASS |
| No program code in the plan | `git diff --name-only a9557964 99cc670f` | one `.ts` path, the test | PASS |
| No unscoped hook claim left | `grep` for "On Claude Code" in Workflow 16 and the note contract | line 32 and line 138 still unscoped | FAIL (the gap) |
| Full suite against the 21 baseline names | not run here | orchestrator reports 21 failed / 11,729 passed / 2 skipped, twice, all names baseline | `UNKNOWN - verify` (taken on trust) |

I did not run the install-on-a-scratch-target and lone-copy sweep checks of the prior report again, because no program under them changed in this round.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists and no plan declares a probe.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| RUN-01 | 41-01, 41-03, 41-04, 41-10, 41-11, 41-19, 41-26 | In-flight log is `claimed/` rendered to `now-running.md` | SATISFIED | Truth 1; plan 41-26 names RUN-01 (WR-19 session start). |
| RUN-02 | 41-01, 41-03 to 41-24, 41-26 | Refill from `wip_limit` minus `claimed/`, no timers | SATISFIED (live host run owed) | Truths 2 and 6 |
| RUN-03 | 41-04, 41-06, 41-11, 41-26 | Session compaction guidance and fresh-session fallback | SATISFIED | Truths 3 and 6 |
| RUN-04 | 41-04, 41-06, 41-11, 41-19, 41-22, 41-23, 41-25, 41-26 | Same guidance on six hosts, one-line pointer, under ceiling | SATISFIED as text; five live runs owed | Truths 3, 4, 7, 8 |
| RUN-05 | 41-01, 41-03 to 41-05, 41-07, 41-09 to 41-26 | `claim.js` ships as a materialized runnable | SATISFIED | Truth 2. The WR-18 text gap concerns the note route's wording, not the runnable. |
| RUN-06 | 41-01 to 41-04, 41-06, 41-08, 41-24 | Tiered engineers by adapter name, no fork, no model override, no self-claim | SATISFIED | Truth 5 |

All six IDs appear in plan `requirements` fields and in REQUIREMENTS.md (lines 66-71 are `[x]`, lines 153-158 read Complete). No ID is orphaned. The earlier stale RUN-03 mark is fixed. RUN-04 reads Complete on the strength of the text; a human may prefer to hold it until the five live host runs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-factory/workflows/16-context-read-write.md` | 32 | "On Claude Code the ... hook makes the `human:<name>` signal un-forgeable"; "The Claude Code primary tier"; "A spawned role on Claude Code gets the same two" (unscoped; contradicts line 31) | Blocker (fails plan truth 11; text only) | Overstates a control to a standalone install |
| `agent-factory/contracts/context-note.md` | 138 | "on Claude Code its un-forgeable human-set signal is delivered by ... `admission-guard` hook" (unscoped) | Blocker (same truth) | Same |
| `agent-factory/workflows/16-context-read-write.md`, `docs/audit/41-residuals.md` | 31, 23 | "like the other hosts" against D-44 (WR-01) | Warning | Ambiguous scope word |
| `agent-factory/workflows/17-task-claim.md` | 86 | Step opens with "Stop" (WR-03) | Warning | Possible halt reading |

The debt-marker gate (TBD, FIXME, XXX) found none in the seven kit and record files this plan changed. Not re-run over the earlier plans' files; the prior report found none there.

### Human Verification Required

1. **Five-host live run (41-UAT test 2, blocked).** Test: run the flow guidance on Codex CLI, Antigravity CLI, OpenCode, Copilot CLI and Pi. Expected: claim, refill and sweep from Workflow 17 alone, and a role writes and closes with `note.js`. Why human: the CLIs are absent here (R-41-05).
2. **Windows run (41-UAT test 3, blocked).** Test: run `note.js`'s `trustedRepoRoot` ladder on Windows. Expected: rung 1 and rung 2 spell a path the same way. Why human: no Windows machine.
3. **R-41-11 as rewritten.** Test: Olger reads docs/audit/41-residuals.md line 23 against his reply in 41-UAT.md test 8. Expected: he confirms his acceptance covers a standalone Claude Code install having no route, or sends it back. Why human: no agent may accept a residual.
4. **Disposition rows.** Test: rule the 17 pending rows of `41-26.md` and the earlier pending rows. Expected: each accepted or sent back by a named human. Why human: the gate cannot prove a disposition right and no agent writes `accepted`.
5. **Review rows.** Test: rule CR-01, WR-01 to WR-03 and IN-01 to IN-05 of the 21:55Z review, plus the eight deferred rows. Expected: each fixed, accepted or sent to a later phase by a named human. Why human: disposition is a human ruling.

None of these is marked passed here.

### Gaps Summary

One gap, text only: **WR-18 is incomplete.** Two sentences that say the per-call `admission-guard` hook exists "on Claude Code" (Workflow 16 line 32, note contract line 138) were left unscoped, so Workflow 16 step 3 contradicts its own line 31 and the plan 41-26 truth and closing statement do not hold. The ledger says `fixed`. The negative pin cannot see the two sentences.

Closing it, in order of weight:

1. **Fix the text** (the review's own suggested fix): scope both sites to a Claude Code plugin install, say every other install gets the two weaker signals, extend the negative pin by three phrases, add disposition rows, and run the same gates as plan 41-26. No program code is involved.
2. **Or a named human rules otherwise.** If Olger keeps these two sites deferred as the SUMMARY says, WR-18 should read as partly open in `41-REVIEW-DISPOSITION.md` and name them. This could also be recorded as an override, with the form below. It is not written here, because an override is a named human's act and the sentences do misstate a control.

```yaml
overrides:
  - must_have: "Plan 41-26 truth 1: none of the named artifacts keeps a route claim that says only Claude Code"
    reason: "{why leaving Workflow 16 line 32 and context-note.md line 138 for a later ruling is acceptable}"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

Nothing else fails. The phase goal, all six requirements and the three other plan 41-26 truths hold. After the gap closes, the status becomes `human_needed` until the five items above are supplied by a named human.

---

_Verified: 2026-11-12T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
