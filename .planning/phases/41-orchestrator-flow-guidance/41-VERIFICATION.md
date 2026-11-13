---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-13T14:40:00Z
status: human_needed
score: 11/11 must-haves verified
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
  - .planning/phases/41-orchestrator-flow-guidance/41-27-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-27-SUMMARY.md
  - CHANGELOG.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/16-context-read-write.md
  - docs/audit/29-style-dispositions/41-27.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
  - scripts/tier-kit-text.test.ts
covered_digest: "v3:sha256:274734326617c74c7a2324790c0e141a74b27525952a9febdc83c7cb786de263"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/11
  gaps_closed:
    - "WR-18, D-45 (plan 41-26 truth 1): Workflow 16 line 32 and context-note.md line 138 kept unscoped per-call hook claims; plan 41-27 scoped both to a Claude Code plugin install"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "CR-01 of 41-REVIEW.md (2026-11-13): Workflow 06 line 37 and the CHANGELOG Security bullet say only a Claude Code plugin install binds the witnessing human's name, with no dial condition; at the default human_admission off the hook gates nothing, and a note written with note.js never passes the hook"
    category: other
    reason: "I confirmed the code facts (isGatedNote returns false at off; at high-severity only security-nfr, architect-design and release-manager are gated). The sentence is worded as a necessary condition ('Only X binds') and matches the sentence plan 41-27's artifact contract prescribes word for word, so no plan truth and no roadmap criterion fails. It is still a sufficiency reading a plain reader can take, and it is weaker than Workflow 04 step 15, which carries the dial condition. A named human rules on it."
    evidence_status: "code and text read here; no failing test (the pin at flow-guidance-text.test.ts locks the sentence in)"
  - finding: "WR-01 of 41-REVIEW.md: install/README.md line 460 still says note.js runs 'outside the Claude Code hook' in the scripted-install section, which implies a hook there"
    category: other
    reason: "Read at HEAD. The kit-wide grep behind plan 41-27 missed it, and plan 41-27 truth 3 names only the hook paragraph of the install guide (lines 1941-1943), which is correct. Not a named plan truth."
    evidence_status: "read in the text; no failing test"
  - finding: "WR-02 of 41-REVIEW.md: the new invariant sentence scan has a narrow ROUTE token list and a sentence splitter that merges bullets, so it misses sentences such as 'On Claude Code the per-call hook binds the stamp'"
    category: other
    reason: "The scan satisfies the plan's own wording (route tokens named in truth 4), and the phrase list still blocks the known sentences. The review shows the scan is weaker than its comment claims. I did not re-run the reviewer's eight probe sentences."
    evidence_status: "review account; test file read at the scan, not re-probed"
  - finding: "WR-01 to WR-03 (earlier review) and IN-01 to IN-04 (this review): wording, pin scope and a stale generated adapter token"
    category: other
    reason: "Cosmetic or already routed to a named human in 41-REVIEW-DISPOSITION.md."
    evidence_status: "review account"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Rule CR-01, WR-01 and WR-02 of the 2026-11-13 review (41-REVIEW-DISPOSITION.md rows, all open)"
    expected: "Named human either has the dial condition added to Workflow 06 line 37, the CHANGELOG bullet and the recipe (and install/README.md line 460 reworded), or accepts the 'Only X binds' wording as a necessary-condition statement"
    why_human: "Whether a scoping sentence that omits the default-off dial overstates a control is a governance wording ruling; no agent may accept it."
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04; 41-UAT test 2, deferred to the milestone UAT)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent on this machine (R-41-05, UNKNOWN - verify). RUN-04's 'reads the same on all six hosts' is proven for the text only."
  - test: "Windows run of note.js's trustedRepoRoot ladder (41-UAT test 3, deferred)"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "No Windows machine is reachable; Windows is UNKNOWN - verify."
  - test: "Rule the 26 pending (named human) rows of docs/audit/29-style-dispositions/41-27.md, especially the four that replace sentences Olger accepted in 41-UAT test 4, and the earlier pending rows (41-19.md to 41-26.md)"
    expected: "Each row accepted or sent back by a named human"
    why_human: "The diff-disposition gate proves each changed clause has a row. It cannot prove a disposition is right, and no agent may write accepted."
  - test: "Olger reads R-41-11 as plan 41-26 rewrote it (docs/audit/41-residuals.md line 23)"
    expected: "He confirms his acceptance covers a standalone Claude Code install having no route, or sends it back"
    why_human: "No agent may write a named human's acceptance of a residual."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-13T14:40:00Z
**Status:** human_needed
**Re-verification:** Yes. It follows the 2026-11-12T22:30Z report (`gaps_found`, 10/11) and covers gap-closure plan 41-27 (commits 7ff282d2 to cd59cde1, SUMMARY at 4c57b726). That report is replaced.

## Verdict

The phase goal holds in the code. The five roadmap success criteria and RUN-01 to RUN-06 are met. The one gap of the prior report is closed. I found no regression.

The status is `human_needed`, not `passed`, for two reasons. First, the live host runs (five CLIs absent here, Windows absent) and the many `pending (named human)` disposition rows are owed to named humans, and no agent may write those rulings. Second, the fresh code review's CR-01 is a wording ruling that a named human should make. I weighed CR-01 against the must-haves and judge that it does not break one (see "The CR-01 question" below). It is a WARNING, not a BLOCKER.

## The prior gap: closed

Plan 41-26 truth 1 failed because two sentences still said the per-call `admission-guard` hook exists "on Claude Code" without a plugin-install scope. I read both sites at HEAD.

| Site | Prior state | State now |
|------|-------------|-----------|
| `agent-factory/workflows/16-context-read-write.md` line 32 | "On Claude Code the separate PER-CALL ... hook makes the `human:<name>` signal un-forgeable"; "The Claude Code primary tier"; "The non-Claude-Code host CLIs degrade" | "On a Claude Code plugin install the separate PER-CALL PreToolUse `admission-guard` hook makes the `human:<name>` signal un-forgeable." ... "The Claude Code plugin-install tier is gated by the `human_admission` dial. Every other install, a standalone Claude Code install included, degrades to two weaker signals." ... "A spawned role on a Claude Code plugin install gets the same two" |
| `agent-factory/contracts/context-note.md` line 138 and tier sentence | "on Claude Code its un-forgeable human-set signal is delivered by the separate PER-CALL ... hook" | "on a Claude Code plugin install its un-forgeable human-set signal is delivered by the separate PER-CALL PreToolUse `admission-guard` hook"; "That hook is the Claude Code plugin-install tier ... every other install, a standalone Claude Code install included, degrades to the in-script `admit()` refusal plus a prompt-level 'stop, ask a named human'" |
| Workflow 16 step 3, line 31 vs line 32 | Contradicted each other | Agree: line 31 says "A standalone Claude Code install has no hook", line 32 says a standalone install gets the two weaker signals |

Other WR-18 sites the plan added are also scoped, which I read: Workflow 04 step 15 ("Only the `propose_note` tool of a Claude Code plugin install binds it to the human's session grant"), Workflow 06 line 37, the browser UAT recipe bullet, and the install guide at lines 1941-1943 ("Only a Claude Code plugin install loads that hook. `install.js` writes no hook and no MCP server, so a standalone Claude Code install has neither."). I confirmed in `install/install.ts` that no hook or MCP server is written.

## The CR-01 question (41-REVIEW.md, 2026-11-13)

The review says Workflow 06 line 37 and the CHANGELOG Security bullet claim "Only a Claude Code plugin install binds the witnessing human's name", while at the default `human_admission: off` the hook gates nothing.

**Code facts, confirmed here.** `scripts/context-io.ts` `isGatedNote` returns `false` for `off`, returns `true` for `all`, and for `high-severity` returns true only for the roles `security-nfr`, `architect-design` and `release-manager`. `hooks/admission-guard.ts` calls `allow()` whenever `isGatedNote` is false. `factory.config.md` ships `human_admission` at `off`. A note written with `note.js` never passes the hook. So on a plugin install at the default dial the witness name binds to no human.

**Weighed against the must-haves.**

- Plan 41-27's truths 1 and 2 (Workflow 16 step 3, the note contract) are met, and neither says anything about Workflow 06.
- Truth 3 requires the attended lane of Workflow 06 and the recipe to be scoped to a Claude Code plugin install. It is. The plan's artifact entry for `06-uat-pack.md` even prescribes the sentence "Only a Claude Code plugin install binds the witnessing human's name to the human". The text matches the contract word for word.
- Truth 4's invariant pin refuses a Claude Code sentence that names a route token and no install form. Line 37 names an install form, so it passes.
- No roadmap success criterion (RUN-01 to RUN-06) concerns the admission route's wording.
- The sentence replaced one that was worse: before 41-27 it said "The witnessing human's name arrives only through the existing admission grant that a separate process reads; the agent can never author it" for every host.

**Call.** The sentence is a necessary-condition statement ("Only X binds"), not a claim that X always binds. It narrows the prior overclaim and satisfies the plan. It still reads as a sufficiency claim to a plain reader, and it is less careful than Workflow 04 step 15, which names `human_admission: all`. That is a real but residual overstatement in governance text, one the project's "never overstate a control" rule cares about. I rate it WARNING, route it to a named human (the ledger row is `open`), and do not count it as a failed truth. A human who wants it fixed has a text-only fix in the review. If I were forced to hold the line at `gaps_found`, I would be failing a truth the plan did not write.

Review WR-01 (install guide line 460) and WR-02 (weak scan) are advisory for the same reason: neither is a named plan truth, and the scan satisfies the tokens the plan names.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED (regression check) | `scripts/runnable-ref/claim.ts` and `claim.js` exist and are unchanged by 41-27 (`git diff --name-only ee30eca3 HEAD` lists only two `.ts` files, both test files). Focused runs: `now-running-freshness`, `claim.test` and the flow and tier text tests (4 files, 515 of 515 pass), and `claim-read-sites` with `runnable-exit-contract` (2 files, 96 of 96 pass). |
| 2 | SC2, RUN-02 and RUN-05: refill from `wip_limit` minus the `claimed/` count read from disk, no timers; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host runs owed | Workflow 17 line 54 runs `claim.js free` and says to trust its number, never a remembered count; `## Keep capacity full` is at line 68. `scripts/runnable-ref/claim.js` ships. Live runs on other hosts are owed (human item 2). |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18; `orchestrator.md` has the one-line pointer and stays under its ceiling | VERIFIED | `17-task-claim.md` has `## Session start` (81) and `## Session compaction` (93). `orchestrator.md` line 33 points to Workflow 17 for refill, sweep and session compaction and is 6,158 bytes, under the ceiling the prior report recorded (7,165). |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | `flow-guidance-text.test.ts` passes. The five-host live run is deferred to the milestone UAT (R-41-05, `UNKNOWN - verify`). |
| 5 | SC5, RUN-06: tiered engineers started by adapter name, never forked, no model override, no self-claim | VERIFIED | `orchestrator.md` and Workflow 17 line 79: "claims a queue task only at dispatch and only in the name of the adapter it starts ... never claims with itself as owner". `tier-kit-text.test.ts` passes. |
| 6 | Plans 41-26 truths on WR-19, IN-19, IN-20 (stop on a kept claim, deliverable routing, escape hatch scope) | VERIFIED (regression check) | Pins pass; no 41-27 diff touches Workflow 17, the role-switch protocol or Workflow 05. |
| 7 | Plan 41-26 truth 1 (WR-18) and plan 41-27 truths 1-3: every route sentence in Workflow 16 step 3, the note contract, Workflows 04 and 06, the recipe and the install guide hook paragraph is scoped to a Claude Code plugin install | VERIFIED | The sites in the table above, read at HEAD. The previously failing sites are fixed. |
| 8 | Plan 41-27 truth 4: positive pins hold each new sentence, the negative pin lists the replaced phrases, and an invariant pin scans the five files | VERIFIED (scan strength noted) | `flow-guidance-text.test.ts` and `tier-kit-text.test.ts` pass (385 tests in the review, 515 in my focused run). The scan is weaker than its comment says (review WR-02, advisory). |
| 9 | Plan 41-27 truth 5: every changed clause has a `pending (named human)` row, none reads `accepted`, `check-diff-disposition` exits 0, and 41-08.md and 41-11.md point to 41-27.md | VERIFIED | `41-27.md` has 26 `pending (named human)` matches and 0 `\| accepted`. `node scripts/check-diff-disposition.js` prints "ALL CHECKS PASSED". |
| 10 | Plan 41-27 truth 6: the ledger reads CR-01 and WR-18 `fixed` with the right counts | VERIFIED (superseded) | WR-18 reads `fixed \| 41-26, 41-27`. The ledger was later re-recorded for the 2026-11-13 review, so `CR-01` there now names the new review's finding and reads `open`. 41-27 wrote the earlier rows as planned (SUMMARY and commit cd59cde1). |
| 11 | Plan 41-27 truth 7: no program code changed; only the two test files are `.ts`; install.ts writes no hook; residuals, SECURITY, UAT, VERIFICATION and VALIDATION untouched | VERIFIED | `git diff --name-only ee30eca3 HEAD` lists only `scripts/flow-guidance-text.test.ts` and `scripts/tier-kit-text.test.ts` among `.ts`, `.js` and `.json`. `install/install.ts`, `hooks`, `.claude-plugin`, `docs/audit/41-residuals.md`, 41-SECURITY.md and 41-VALIDATION.md have no diff. 41-UAT.md differs only through the later UAT commit f8beb9be, outside the plan. |

**Score:** 11/11 truths verified. 0 present-but-behavior-unverified. No override applied.

Plan 41-27's eighth truth, the full suite ending on exactly the 21 baseline names, I did not re-run in full (it takes about 26 minutes). I rely on the orchestrator's regression-gate facts: 11736 passed, 21 failed at HEAD; 20 of the 21 also fail at ee30eca3 by name; the one HEAD-only name (`check-foundation-guards.test.ts` "LIVE COUNT is DERIVED") comes from the untracked stray `./~/` directory the user created, which is environmental and not part of any plan commit. This is taken on trust and is not counted in the score. Note the 41-27 SUMMARY claims the same 21 names including that one, so the SUMMARY and the gate agree on the count.

### Deferred Items

None.

### Advisory (New Scope, Unevidenced)

| # | Finding | Category | Why Advisory |
|---|---------|----------|--------------|
| 1 | CR-01: Workflow 06 line 37 and the CHANGELOG bullet name the plugin install as the only binder but omit the default-off dial condition | other | Confirmed in code; matches the plan's own prescribed sentence; a human rules on it |
| 2 | WR-01: `install/README.md` line 460 "outside the Claude Code hook" in the scripted-install section | other | Missed by the plan's grep, not a named truth |
| 3 | WR-02: the invariant scan misses sentences with "the per-call hook" and merged bullets | other | Satisfies the tokens the plan names; review account, not re-probed |
| 4 | Earlier WR-01 to WR-03, IN-01 to IN-04 | other | Cosmetic or already routed |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/workflows/16-context-read-write.md` | Line 32 scoped to a plugin install, consistent with line 31 | VERIFIED | Contains "Every other install, a standalone Claude Code install included, degrades to two weaker signals." |
| `agent-factory/contracts/context-note.md` | Hook signal and tier scoped | VERIFIED | Contains "Claude Code plugin-install tier" |
| `agent-factory/workflows/04-ticket-to-pr.md` | Step 15 scoped | VERIFIED | Contains "Only the `propose_note` tool of a Claude Code plugin install binds it to the human's session grant." |
| `agent-factory/workflows/06-uat-pack.md` | Attended lane scoped | VERIFIED (see CR-01 advisory) | Contains the prescribed sentence |
| `agent-factory/checklists/browser-uat-recipe.md` | Lane bullet scoped and gated | VERIFIED | "bound to the human only on a Claude Code plugin install", with "each note sent through `propose_note` that the `human_admission` dial gates" |
| `install/README.md` | Hook paragraph names where it loads | VERIFIED | Lines 1941-1943 |
| `CHANGELOG.md` | Security bullet under Unreleased | VERIFIED | Lines 186-194 under `### Security` |
| `scripts/flow-guidance-text.test.ts`, `scripts/tier-kit-text.test.ts` | Pins | VERIFIED | Pass; "plan 41-27" pins present |
| `docs/audit/29-style-dispositions/41-27.md` | Pending row per changed clause | VERIFIED | 26 pending, 0 accepted |
| `scripts/runnable-ref/claim.js` | Shipped queue runnable | VERIFIED | Present, tested |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Workflow 16 line 32 | Workflow 16 line 31 | Same install scope | WIRED | Line 31 "A standalone Claude Code install has no hook"; line 32 "a standalone Claude Code install included, degrades" |
| Invariant pin | Workflows 04, 06, 16, note contract, recipe | Sentence scan | WIRED (narrow tokens) | Test passes; strength caveat in advisory 3 |
| Workflow 06 attended lane | Browser UAT recipe attended lane | Same scope, residual R-41-06 | WIRED | Both name a Claude Code plugin install and R-41-06 |
| `orchestrator.md` | Workflow 17 | One-line pointer | WIRED | Line 33 |
| REVIEW-DISPOSITION ledger | 41-26 and 41-27 | Source cell | WIRED | WR-18 `fixed | 41-26, 41-27` |

### Data-Flow Trace (Level 4)

Not applicable. The plan changed kit text and tests only. The queue programs that render `now-running.md` are unchanged and covered by their own tests.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Flow, tier, claim and freshness pins | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/now-running-freshness.test.ts scripts/runnable-ref/claim.test.ts` | 4 files passed, 515 of 515 tests (the claim-read-sites path I gave was wrong; at its real path `scripts/runnable-ref/claim-read-sites.test.ts` plus `scripts/runnable-ref/runnable-exit-contract.test.ts`, 2 files pass, 96 of 96) | PASS |
| Disposition gate | `node scripts/check-diff-disposition.js` | ALL CHECKS PASSED | PASS |
| Scope of plan 41-27 | `git diff --name-only ee30eca3 HEAD` filtered to `.ts`, `.js`, `.json` | two test files | PASS |

### Probe Execution

SKIPPED: the plan declares no `probe-*.sh` probes.

### Requirements Coverage

Every ID appears in at least one PLAN's `requirements:` field (counts of mentions: RUN-01 x7, RUN-02 x23, RUN-03 x4, RUN-04 x9, RUN-05 x23, RUN-06 x7). No orphaned ID.

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| RUN-01 | 41-01 and later | `now-running.md` rendered from `claimed/`, holds only running work | SATISFIED | Truth 1 |
| RUN-02 | many | Refill from `wip_limit` minus `claimed/` count, no timers | SATISFIED | Truth 2 |
| RUN-03 | several | Session compaction guidance, fresh-session fallback | SATISFIED | Truth 3 |
| RUN-04 | many, incl. 41-27 | One Workflow 17 guidance, pointer under ceiling, same on six hosts | SATISFIED (text); live runs owed | Truths 3, 4, 7 |
| RUN-05 | many, incl. 41-27 | `claim.js` ships as a runnable | SATISFIED | Truth 2 |
| RUN-06 | several | Adapter-name starts, no fork, no model override, no self-claim | SATISFIED | Truth 5 |

REQUIREMENTS.md still shows these six rows as `[ ]` and "Gaps Found" in the traceability table. That tracking is stale relative to this report and is not mine to edit. It should be updated when the phase closes.

### Anti-Patterns Found

I scanned the files 41-27 changed for `TBD`, `FIXME` and `XXX` in the markdown and test files. No debt marker was introduced by this plan (the changed files are prose and string-pin tests). No stub or hollow-data pattern applies to a text-only change.

### Human Verification Required

1. **Rule CR-01, WR-01, WR-02 of the 2026-11-13 review.** Test: read Workflow 06 line 37, the CHANGELOG Security bullet, the recipe bullet and `install/README.md` line 460. Expected: either the dial condition is added (and line 460 reworded), or the "Only X binds" wording is accepted as a necessary-condition statement. Why human: whether it overstates a control is a governance ruling.
2. **Live run on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi** (41-UAT test 2, deferred to the milestone UAT). Expected: the Orchestrator claims, refills and sweeps from Workflow 17 alone. Why human: the CLIs are absent here.
3. **Windows run of `note.js`'s `trustedRepoRoot` ladder** (41-UAT test 3, deferred). Why human: no Windows machine.
4. **The 26 pending rows of `41-27.md` and the earlier pending rows.** Why human: no agent may write `accepted`.
5. **Olger's read of R-41-11** as plan 41-26 rewrote it. Why human: no agent may write a named human's acceptance.

### Gaps Summary

No gaps. The prior report's one gap (two unscoped hook claims) is closed and pinned. The phase goal and all six requirements hold in the code. What remains is human work: one wording ruling the review raised, the live runs on hosts that are not on this machine, and the disposition rows only a named human may accept. No override was written.

---

_Verified: 2026-11-13T14:40:00Z_
_Verifier: Claude (gsd-verifier)_
