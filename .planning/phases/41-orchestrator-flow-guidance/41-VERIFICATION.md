---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-14T10:05:00Z
status: human_needed
score: 11/11 independently verified must-haves (plus 1 taken from the orchestrator's measurement, not re-run)
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
  - .planning/phases/41-orchestrator-flow-guidance/41-28-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-28-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-29-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-29-SUMMARY.md
  - CHANGELOG.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/16-context-read-write.md
  - docs/audit/29-style-dispositions/41-27.md
  - docs/audit/29-style-dispositions/41-28.md
  - docs/audit/29-style-dispositions/41-29.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
  - scripts/tier-kit-text.test.ts
covered_digest: "v3:sha256:06514270739d70cd0481568312f2fc7b6d9813da18de9990dc8475281341b991"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 14/14 independently verified (plus 1 from the orchestrator)
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "WR-01 of 41-REVIEW.md (2026-11-14T09:56Z, new, open): in Workflow 06 line 37 the sentence 'nothing binds it either (residual R-41-06)' now follows the inserted high-severity sentence, so 'either' and 'it' can be misread (the new sentence is about gating, the next about nothing binding; 'it' has two referents in a row)"
    category: other
    reason: "Read at HEAD (sed -n 37p). The misreading would say the control is weaker than it is (the hook does check a finding by the three roles), so it does not overstate a control. Plan 41-29 forbids changing that sentence and its 41-28.md row was accepted by Olger. The 41-29.md Workflow 06 row records the pronoun note but not 'either'. A named human rules."
    evidence_status: "text read here; reviewer account of hooks/admission-guard.ts not re-read"
  - finding: "IN-01 of 41-REVIEW.md (new, open): 'gates only' is narrower than the hook, which also refuses a no-`by` note and an unreadable config at high-severity"
    category: other
    reason: "Review account; not re-derived from scripts/context-io.ts here. Wording, no plan truth concerns it."
    evidence_status: "review account"
  - finding: "IN-02 of 41-REVIEW.md (new, open): the new CHANGELOG sentence is pinned twice (plan 41-28 case and plan 41-29 case)"
    category: other
    reason: "Pin duplication; harmless to behavior."
    evidence_status: "tests read by name, both pass"
  - finding: "WR-02, WR-03, IN-03 to IN-07 of the 2026-11-13T19:23Z review, deferred to a later phase by Olger (41-UAT test 11)"
    category: other
    reason: "Deferred by a named human in the ledger (14 rows). Not raised again. Not applied by plan 41-29, as its prohibitions require."
    evidence_status: "41-REVIEW-DISPOSITION.md rows at deferred"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Rule the three open rows of 41-REVIEW-DISPOSITION.md (WR-01, IN-01, IN-02 of the 2026-11-14 review) and the 2 pending (named human) rows of docs/audit/29-style-dispositions/41-29.md"
    expected: "A named human either accepts Workflow 06 line 37 as it reads (or asks that 'nothing binds it either' be reworded), accepts or sends back IN-01 and IN-02, and accepts or sends back each 41-29.md row"
    why_human: "Governance wording on the admission route; the diff-disposition gate proves a row exists, not that it is right, and no agent may write accepted"
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04; 41-UAT test 2, deferred to the milestone UAT)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent on this machine (R-41-05, UNKNOWN - verify). RUN-04's 'reads the same on all six hosts' is proven for the text only."
  - test: "Windows run of note.js's trustedRepoRoot ladder (41-UAT test 3, deferred)"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "No Windows machine is reachable; Windows is UNKNOWN - verify."
  - test: "Rule the earlier pending (named human) rows of docs/audit/29-style-dispositions (41-19.md to 41-28.md) that no named human has accepted"
    expected: "Each row accepted or sent back by a named human"
    why_human: "No agent may write accepted."
  - test: "Olger reads R-41-11 as plan 41-26 rewrote it (docs/audit/41-residuals.md)"
    expected: "He confirms his acceptance covers a standalone Claude Code install having no route, or sends it back"
    why_human: "No agent may write a named human's acceptance of a residual."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-14T10:05:00Z
**Status:** human_needed
**Re-verification:** Yes. It follows the 2026-11-13T19:45Z report (`human_needed`) and covers gap-closure plan 41-29 (commits 3757b701 RED, 5b735f8f GREEN, ec2ac224, bdf5434b, abe2cf6e). That report is replaced.

## Verdict

The phase goal holds in the code, as far as the routes measured here go. RUN-01 to RUN-06 and the five roadmap success criteria are met in the code and text. Plan 41-29 did what it set out to do: the sentence `At \`high-severity\` it gates only a finding by \`security-nfr\`, \`architect-design\` or \`release-manager\`.` sits in Workflow 06 line 37 right after the default-off sentence and right before the `note.js` sentence, and in the CHANGELOG bullet. I found no regression and no failed truth.

The status stays `human_needed`, not `passed`: the live runs on five hosts and Windows are owed, every `pending (named human)` row is owed to a named human, and the new 2026-11-14 review has three rows at `open` (WR-01, IN-01, IN-02) that only a named human may rule on.

## What plan 41-29 changed, read at HEAD

`git diff 260f3709 HEAD` over non-`.planning` files lists four files: `CHANGELOG.md`, `agent-factory/workflows/06-uat-pack.md`, `docs/audit/29-style-dispositions/41-29.md` (new) and `scripts/flow-guidance-text.test.ts`. The only `.ts`, `.js` or `.json` file touched is the test file. The `+`/`-` lines of the two text files are exactly the one inserted sentence in each (the CHANGELOG lines re-wrap around it). No other sentence of Workflow 06 line 37 changed, so "nothing binds it either (residual R-41-06)" keeps its wording, as the plan's prohibition requires.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work, empties as tasks finish | VERIFIED (regression check) | `scripts/runnable-ref/claim.ts` and `claim.js` unchanged by 41-29 (no `.ts`/`.js` change but the test file). `now-running-freshness`, `claim.test`, `claim-read-sites`, `runnable-exit-contract` pass in my run. Workflow 17 line 56 and 64 say the claim and `done` re-render `now-running.md`. |
| 2 | SC2, RUN-02 and RUN-05: refill from `wip_limit` minus `claimed/` count read from disk, no timers; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host runs owed | Workflow 17 line 54 runs `claim.js free` ("Trust that number, never a remembered count"); `## Keep capacity full` at line 68. `node scripts/runnable-ref/claim.js` with no command prints the usage naming `claim`, `done`, `now-running`, `sweep`, `free`. |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18; `orchestrator.md` has a pointer and stays under its ceiling | VERIFIED | `17-task-claim.md` line 93 `## Session compaction`; `orchestrator.md` line 33 points to Workflow 17 for "claim, refill, sweep and run session compaction"; `orchestrator.md` is 6,158 bytes, unchanged from the prior report. |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | `flow-guidance-text.test.ts` passes. The five-host live run is deferred (R-41-05, `UNKNOWN - verify`). |
| 5 | SC5, RUN-06: tiered engineers started by adapter name, never forked, no model override, no self-claim | VERIFIED | Workflow 17 line 58: "Start a tiered engineer by adapter name, as a non-fork sub-agent. Pass no `model` or `effort` parameter"; `orchestrator.md` line 79 and `claim.js` refuse `--by grugops-orchestrator`; `tier-kit-text.test.ts` passes. |
| 6 | 41-29 truth 1: Workflow 06 line 37 carries the high-severity sentence between the default-off and `note.js` sentences, nothing else on the line changes | VERIFIED | `sed -n 37p` read at HEAD; diff shows only that insertion. |
| 7 | 41-29 truth 2: the CHANGELOG `### Security` bullet carries the same sentence after the default-off sentence, nothing else changes once flattened | VERIFIED | Diff shows the sentence inserted and the lines re-wrapped; no other wording changed. |
| 8 | 41-29 truth 3: a plan 41-29 pin holds the three sentences as one run in both files; the plan 41-28 changelog case carries the new sentence; it failed before the edit and passes after; the route scan has no new offender | VERIFIED (green re-observed; red from commit order and SUMMARY) | 7 files, 632 of 632 tests pass in my run, including the named cases and the route scan. RED commit 3757b701 precedes GREEN 5b735f8f in `git log`. I did not check out the RED commit to re-observe the failure. |
| 9 | 41-29 truth 4: `41-29.md` holds one `pending (named human)` row per changed clause and `check-diff-disposition` exits 0 | VERIFIED | File read: 2 rows (Workflow 06 line 37, CHANGELOG line 194), both `pending (named human)`. `node scripts/check-diff-disposition.js` prints ALL CHECKS PASSED. |
| 10 | 41-29 truth 5: ledger reads `WR-01 \| warning \| fixed \| 41-29` with `open: 0` | SUPERSEDED (not a failure) | The plan wrote that row, then the 2026-11-14T09:56Z review reused the id WR-01 for a new finding. `41-REVIEW-DISPOSITION.md` now lists WR-01, IN-01 and IN-02 at `open`, 14 at `deferred`. The fix of the earlier WR-01 is recorded in commits 5b735f8f and ec2ac224 and 41-29-SUMMARY.md. Same pattern as the 41-28 round. |
| 11 | 41-29 truth 6: no program code changed; only the test file is a `.ts`/`.js`/`.json` change | VERIFIED | `git diff --name-only 260f3709 HEAD -- '*.ts' '*.js' '*.json'` prints `scripts/flow-guidance-text.test.ts` only. |
| 12 | 41-29 truth 7: the full suite ends on exactly the 21 baseline names | NOT RE-RUN here (taken from the orchestrator) | The orchestrator reports 21 failed, 11,739 passed, 2 skipped at ec2ac224, names equal to `41-VALIDATION.md` § Known baseline reds, and no non-`.planning` file changed between ec2ac224 and HEAD. I did not re-run the full suite. I re-ran `npx tsc --noEmit` (exit 0) and 7 focused files. Not counted in the independent score. |

**Score:** 11/11 independently verified truths; truth 12 rests on the orchestrator's measurement; truth 10 is superseded by a new review that reused the finding id. 0 present-but-behavior-unverified. No override applied.

### Deferred Items

None. (The 14 `deferred` ledger rows are human-deferred review findings, not roadmap deferrals to a later phase.)

### Advisory

| # | Finding | Why advisory |
|---|---------|--------------|
| 1 | Review WR-01 (new): "nothing binds it either" in Workflow 06 now follows a gating sentence | Misreading errs toward understating the control; plan forbids touching that sentence; a named human rules |
| 2 | Review IN-01: "gates only" narrower than the hook's fail-closed refusals | Review account, wording |
| 3 | Review IN-02: new CHANGELOG sentence pinned twice | Pin duplication |
| 4 | WR-02, WR-03, IN-03 to IN-07 (2026-11-13 review) | Deferred by Olger in test 11 |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/workflows/06-uat-pack.md` | Line 37 with the roles the high-severity dial gates | VERIFIED | Sentence present once, in place |
| `CHANGELOG.md` | Security bullet with the same sentence | VERIFIED | In the diff |
| `scripts/flow-guidance-text.test.ts` | WR-01 pin over both files | VERIFIED | Cases pass |
| `docs/audit/29-style-dispositions/41-29.md` | A pending row per changed clause | VERIFIED | 2 rows, 0 accepted |
| `scripts/runnable-ref/claim.js` | Shipped queue runnable | VERIFIED | Present, runs, tested |
| `agent-factory/workflows/17-task-claim.md` | Flow guidance home | VERIFIED | Sections at lines 47-121 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Plan 41-29 pin | Workflow 06 line 37 and CHANGELOG | three sentences as one run | WIRED | Passes at HEAD |
| Workflow 06 attended lane | Recipe attended lane | Same sentence word for word | WIRED | Recipe carries it (41-28 round) |
| `orchestrator.md` | Workflow 17 | One-line pointer | WIRED | Line 33 |

### Data-Flow Trace (Level 4)

Not applicable to plan 41-29: it changed kit text, the CHANGELOG, a test file and records. The queue programs that render `now-running.md` are unchanged.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Flow, tier, claim, freshness, read-site, exit-contract and chrome-lane suites | `npx vitest run` over 7 named files | 7 files, 632 of 632 passed | PASS |
| Type check | `npx tsc --noEmit` | exit 0 | PASS |
| Disposition gate | `node scripts/check-diff-disposition.js` | ALL CHECKS PASSED | PASS |
| `claim.js` CLI surface | `node scripts/runnable-ref/claim.js` | exit 2, usage lists claim, done, now-running, sweep, free; "The queue was not changed." | PASS |
| Full suite | not run here | orchestrator reports 21 failed, all baseline names | taken on trust |

### Probe Execution

SKIPPED: the plan declares no `probe-*.sh` probes.

### Requirements Coverage

Every ID appears in at least one PLAN's `requirements:` field (plan 41-29 declares RUN-04 and RUN-05; 41-01 to 41-28 cover the rest). No orphaned ID in REQUIREMENTS.md.

| Requirement | Status | Evidence |
|-------------|--------|----------|
| RUN-01 | SATISFIED | Truth 1 |
| RUN-02 | SATISFIED | Truth 2 |
| RUN-03 | SATISFIED | Truth 3 |
| RUN-04 | SATISFIED (text); live runs owed | Truths 3, 4, 6-9 |
| RUN-05 | SATISFIED | Truth 2 |
| RUN-06 | SATISFIED | Truth 5 |

REQUIREMENTS.md still shows RUN-01 to RUN-06 as `[ ]` with "Gaps Found" in the traceability table (lines 66-71, 153-158). I did not edit it. All six are satisfied in the code; RUN-04's "reads the same on all six hosts" is proven for the text only, and whether to flip the boxes now or at the milestone UAT is for the caller and a named human.

### Anti-Patterns Found

No `TBD`, `FIXME` or `XXX` in the added lines of `git diff 260f3709 HEAD` over the CHANGELOG, `agent-factory`, `docs` and the test file. No stub or hollow-data pattern applies to a text and test change.

### Human Verification Required

1. **Rule WR-01, IN-01, IN-02 of the new review and the two rows of `41-29.md`.** Expected: Workflow 06 line 37 accepted as it reads, or "nothing binds it either" reworded; each row accepted or sent back. Why human: governance wording; no agent may accept.
2. **Live run on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi** (41-UAT test 2, deferred). Why human: the CLIs are absent here.
3. **Windows run of `note.js`'s `trustedRepoRoot` ladder** (41-UAT test 3, deferred). Why human: no Windows machine.
4. **Earlier pending rows (41-19.md to 41-28.md) no named human has accepted.** Why human: no agent may write `accepted`.
5. **Olger's read of R-41-11** as plan 41-26 rewrote it. Why human: no agent may write a named human's acceptance of a residual.

### Gaps Summary

No gaps. Plan 41-29's sentence landed in both files, is pinned, and the one `.ts` file touched is the test file. The disposition gate, type check and 632 focused tests pass. What remains is human work: rulings on the new open review rows and pending disposition rows, and the live runs on hosts not on this machine. No override was written. The full-suite baseline comparison is the orchestrator's measurement and was not re-run here.

---

_Verified: 2026-11-14T10:05:00Z_
_Verifier: Claude (gsd-verifier)_
