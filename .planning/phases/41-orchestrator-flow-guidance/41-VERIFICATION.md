---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-13T19:45:00Z
status: human_needed
score: 14/14 independently verified must-haves (plus 1 taken from the orchestrator's measurement, not re-run)
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
  - CHANGELOG.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/contracts/context-note.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/16-context-read-write.md
  - docs/audit/29-style-dispositions/41-27.md
  - docs/audit/29-style-dispositions/41-28.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
  - scripts/tier-kit-text.test.ts
covered_digest: "v3:sha256:af582efee13c031beb4d837e0601eb08e6b7ecef5afe79d76dfef9c74deb43d0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 11/11
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "WR-01 of 41-REVIEW.md (2026-11-13T19:23Z, new): Workflow 06 line 37 and the CHANGELOG Security bullet say the hook checks the name only on a finding the dial gates, then 'At the default off the dial gates no note', and leave out that at high-severity the hook gates only a finding by security-nfr, architect-design or release-manager"
    category: other
    reason: "Read here. Every sentence is true against the code, and the text is a necessary-condition statement ('only on a finding that the dial gates'). The high-severity case is stated in the browser UAT recipe bullet (lines 456-459). Workflow 06 points to the recipe only for setup and host availability, and the CHANGELOG does not point to it. A reader at high-severity can take the contrast with off as 'my dial gates the witness finding'. Plan 41-28's truths 1 and 3 name only the default-off result, so no plan truth fails. A named human rules on whether the omission overstates a control."
    evidence_status: "text read at HEAD; no failing test (no pin asks for the high-severity sentence in Workflow 06 or the CHANGELOG)"
  - finding: "WR-02 of 41-REVIEW.md (new): the rebuilt route scan is weaker than its limits comment says. R4 is satisfied by any dial mention anywhere in the block; DENIES_ROUTE masks R2 and R3 for the whole sentence; NEGATED_FORM knows only 'without' and 'not'"
    category: other
    reason: "I read scripts/flow-guidance-text.test.ts lines 1416-1505 and confirmed all three by reading the code (R4 tests NAMES_DIAL against blockText; the R2 and R3 branches test DENIES_ROUTE against the whole sentence; NEGATED_FORM at line 1463). I did not re-run the reviewer's 26 probe sentences. The scan satisfies plan 41-28 truth 5 as written ('a plugin binding whose block names no dial'), and the word-for-word pins still guard today's text, so it weakens a regression guard and hides no defect in the tree now."
    evidence_status: "code read here; reviewer's harness account not re-run"
  - finding: "WR-03 (carried forward, outside plan 41-28): agent-factory/workflows/17-task-claim.md line 86 session-start step 3 still opens with 'Stop and name each entry sweep prints on a kept or left line'"
    category: other
    reason: "A first-word 'Stop' can be read as 'halt session start', which would skip the refill of step 4. Open in the disposition ledger. Not a plan 41-28 truth and not a roadmap criterion."
    evidence_status: "review account"
  - finding: "IN-06 of 41-REVIEW.md (outside scope): scripts/context-io.ts lines 4600 and 4605, the in-script admit() refusal, still names the 'un-forgeable' admission-guard hook on every install"
    category: other
    reason: "This is program text and the same claim plans 41-27 and 41-28 removed from the kit's markdown. Plan 41-28 was text-only by design. A later code plan, if a human wants it."
    evidence_status: "review account; not re-read"
  - finding: "IN-01 to IN-05 and IN-07 of 41-REVIEW.md: changelog pin not tied to its section, 'every other install' wording for the markdown-only copy, a 41-11.md pointer line, the standalone Orchestrator adapter tools: line, an R-41-09 residual pointer, and the session-approver versus witness distinction"
    category: other
    reason: "Wording, pin scope and carried-forward items already open in 41-REVIEW-DISPOSITION.md for a named human."
    evidence_status: "review account"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Rule the new WR-01 and WR-02 of 41-REVIEW.md (2026-11-13T19:23Z) and WR-03, plus IN-01 to IN-07 (41-REVIEW-DISPOSITION.md rows, all open)"
    expected: "A named human either has the high-severity sentence added to Workflow 06 line 37 and the CHANGELOG bullet and the scan tightened (per-clause denial, block-local dial check, wider negated form), or accepts the current wording and scan as sufficient, or defers them"
    why_human: "Whether a scoping sentence that omits the high-severity role condition overstates a control is a governance wording ruling; no agent may accept it."
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04; 41-UAT test 2, deferred to the milestone UAT)"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js"
    why_human: "These CLIs are absent on this machine (R-41-05, UNKNOWN - verify). RUN-04's 'reads the same on all six hosts' is proven for the text only."
  - test: "Windows run of note.js's trustedRepoRoot ladder (41-UAT test 3, deferred)"
    expected: "Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)"
    why_human: "No Windows machine is reachable; Windows is UNKNOWN - verify."
  - test: "Rule the 17 pending (named human) rows of docs/audit/29-style-dispositions/41-28.md and the earlier pending rows (41-19.md to 41-27.md)"
    expected: "Each row accepted or sent back by a named human"
    why_human: "The diff-disposition gate proves each changed clause has a row. It cannot prove a disposition is right, and no agent may write accepted."
  - test: "Olger reads R-41-11 as plan 41-26 rewrote it (docs/audit/41-residuals.md)"
    expected: "He confirms his acceptance covers a standalone Claude Code install having no route, or sends it back"
    why_human: "No agent may write a named human's acceptance of a residual."
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-13T19:45:00Z
**Status:** human_needed
**Re-verification:** Yes. It follows the 2026-11-13T14:40Z report (`human_needed`, 11/11, after plan 41-27) and covers gap-closure plan 41-28 (commits 98077952 to 0296a698, state at ea400ab5). That report is replaced.

## Verdict

The phase goal holds in the code. The five roadmap success criteria and RUN-01 to RUN-06 are met. Plan 41-28 did what it set out to do: CR-01 of the earlier review is fixed in Workflow 06, the recipe and the CHANGELOG; the install guide no longer implies a hook on a scripted install; and the route scan was rebuilt. I found no regression and no failed truth.

The status stays `human_needed`, not `passed`, for two reasons. First, the live host runs (five CLIs absent here, Windows absent) and every `pending (named human)` disposition row are owed to named humans, and no agent may write those rulings. Second, the 2026-11-13T19:23Z review raised two new warnings (WR-01, WR-02) that I rate advisory, and a named human should rule on them. I weighed them against the must-haves (see below) and they do not break one.

## What plan 41-28 changed, read at HEAD

| Review finding | Where | State now |
|----------------|-------|-----------|
| CR-01 (prior): unconditioned plugin binding | `agent-factory/workflows/06-uat-pack.md` line 37 | "Only a Claude Code plugin install can bind the witnessing human's name ... The hook checks the name only on a finding the Orchestrator sends through `propose_note` that the `human_admission` dial gates. At the default `off` the dial gates no note, so nothing binds the name. For a note written with `tools/grugops/note.js`, and on any other install, a standalone Claude Code install included, nothing binds it either (residual R-41-06)." |
| CR-01: recipe | `agent-factory/checklists/browser-uat-recipe.md` lines 453-461 | Adds the same conditions plus "At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`" and "A note written with `tools/grugops/note.js` passes no hook" |
| CR-01: CHANGELOG | `CHANGELOG.md` lines 186-197, `### Security` | States the plugin-install, `propose_note` and dial conditions and the default-`off` result |
| WR-01 (prior): install guide clause | `install/README.md` line 459 area | The `note.js` entry no longer names a Claude Code hook. `grep` for the old "outside the Claude Code hook" phrase finds nothing in the program list; the hook paragraph at lines 1937-1943 is unchanged and correct |
| WR-02 (prior): scan | `scripts/flow-guidance-text.test.ts` lines 1416-1505 | Rebuilt: six files, blocks cut at list markers and blank lines, sentences split at `.;!?` outside code spans, rules R1 to R4, two one-sentence exemptions, a fixture case |

I confirmed against the code that the new sentences are true: at the default `off` the admission hook allows every note without checking the stamp, and a note written with `note.js` through Bash matches no hook (`hooks/hooks.json` matches only the MCP admission tool). The reviewer made the same checks and I did not find a counter-example.

## The two new review warnings, weighed

**WR-01 (Workflow 06 and the CHANGELOG omit `high-severity`).** The sentence says the hook checks the name "only on a finding ... that the `human_admission` dial gates". That is accurate at every dial value, including `high-severity`, where the dial gates a finding only for three named roles. It is a necessary-condition statement. The sentence that follows ("At the default `off` ...") gives one example, and a reader at `high-severity` could take it as the only exception. The recipe states the `high-severity` role limit and Workflow 06 does not repeat it. Plan 41-28 truths 1 and 3 require the plugin-install, `propose_note` and dial conditions and the default-`off` result, and the text meets each of them word for word. No truth fails and no roadmap criterion (RUN-01 to RUN-06) concerns this sentence. It is a residual overstatement risk in governance text, so I rate it WARNING and route it to a named human. The fix is one sentence and one pin each.

**WR-02 (scan strength).** I read the scan and confirm the reviewer's three claims by inspection: R4 checks the whole block for a dial word, the denial mask covers a whole sentence, and the negated-form pattern is narrow. Plan 41-28 truth 5 describes R4 as "a plugin binding whose block names no dial", which is what the code does, and the plan's fixtures show each rule can fail. The limits comment says less than the reviewer found. This weakens a regression guard and hides no defect in the tree today (the word-for-word pins still hold the live text). WARNING, routed to a named human. I did not re-run the reviewer's harness.

Neither warning is a failed truth. If I held the line at `gaps_found`, I would be failing a truth the plan did not write. This matches the call I made for the earlier CR-01 in the 14:40Z report.

## Goal Achievement

### Observable Truths

Truths 1 to 5 are the ROADMAP success criteria. Truths 6 to 15 are the must-haves of plan 41-28 (plans 41-01 to 41-27 are covered by the prior reports and re-checked by regression below).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1, RUN-01: `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish | VERIFIED (regression check) | `scripts/runnable-ref/claim.ts` and `claim.js` unchanged by 41-28 (`git diff --name-only 980779522 HEAD` lists one `.ts`/`.js`/`.json` file: the test file). `now-running-freshness`, `claim.test`, `claim-read-sites.test`, `runnable-exit-contract.test` and the two text tests: 6 files, 613 of 613 pass in my run. |
| 2 | SC2, RUN-02 and RUN-05: refill from `wip_limit` minus the `claimed/` count read from disk, no timers; agents claim and complete with the shipped `claim.js` | VERIFIED (mechanism); live host runs owed | Workflow 17 holds `## Keep capacity full` (line 68), and the step at line 54 runs `claim.js free`. `scripts/runnable-ref/claim.js` ships and is tested. Live runs on other hosts are owed (human item 2). |
| 3 | SC3, RUN-03 and RUN-04: Workflow 17 holds `## Session compaction` named apart from WF18; `orchestrator.md` has the one-line pointer and stays under its ceiling | VERIFIED | `17-task-claim.md` line 93 `## Session compaction`, and its first lines separate it from Workflow 18 note compaction. `orchestrator.md` is 6,158 bytes, unchanged from the prior report and under the 7,165 ceiling it recorded. |
| 4 | SC4, RUN-04: the guidance reads the same on all six hosts, with only optional operator tips per host | VERIFIED (text only); live runs owed | `flow-guidance-text.test.ts` passes (part of the 613). Five-host live run is deferred (R-41-05, `UNKNOWN - verify`). |
| 5 | SC5, RUN-06: tiered engineers started by adapter name, never forked, no model override, no self-claim | VERIFIED | `tier-kit-text.test.ts` passes; `orchestrator.md` and Workflow 17 unchanged by 41-28. |
| 6 | 41-28 truth 1: Workflow 06's attended lane states the plugin-install, `propose_note` and dial conditions, that default `off` binds nothing, and that `note.js` and every other install bind nothing (R-41-06) | VERIFIED | Line 37 read at HEAD; every clause present (table above). Pinned by "the attended Chrome lane of Workflow 06 states the plugin-install, propose_note and dial conditions". |
| 7 | 41-28 truth 2: the recipe's attended-lane bullet states the plugin-only binding, the `propose_note` and dial conditions, the default-`off` result, the `high-severity` roles and that a `note.js` note passes no hook | VERIFIED | Lines 453-461 read at HEAD; all five present. |
| 8 | 41-28 truth 3: the CHANGELOG Security bullet states the plugin-install, `propose_note` and dial conditions and the default-`off` result | VERIFIED | Lines 186-197 read at HEAD. Pinned, though the pin reads the whole file and not the section (review IN-01, advisory). |
| 9 | 41-28 truth 4 (WR-01): the install guide's program list names no Claude Code hook; `note.js` binds no `human:<name>` stamp to a human | VERIFIED | `install/README.md` line 459 entry read; pin "the install guide's program list puts no Claude Code hook on a scripted install" passes. Hook paragraph at 1937-1943 intact. |
| 10 | 41-28 truth 5: the route scan reads six files, splits at list markers, blank lines and every sentence end outside a code span, refuses R1 to R4, every file has a route sentence, each exemption matches exactly one sentence | VERIFIED (strength caveat) | `ROUTE_FILES` lists the six files; `routeBlocks`, `routeOffenders`, `ROUTE_EXEMPT` read at lines 1416-1505. The scan test and 164-test file pass. The code matches the rule text; its weaknesses are review WR-02 (advisory). |
| 11 | 41-28 truth 6: a fixture case flags each shape and passes a scoped paragraph; before the kit edits the live scan failed on exactly Workflow 06's unconditioned sentence (R4) and the install guide's `note.js` clause (R1) | VERIFIED (fixtures); red-before claim from SUMMARY | The fixture test "the route scan flags each shape it was written for, and passes a scoped paragraph" passes. The RED commits (068aa691, 4fa016c3) precede the GREEN commits (ed36ea15, 7fca531f) in `git log`. I did not check out the RED commit to re-observe the failure. |
| 12 | 41-28 truth 7: every changed clause has a `pending (named human)` row in `41-28.md`, no row reads accepted, `check-diff-disposition` exits 0, and `41-27.md` carries one pointer line | VERIFIED | `41-28.md` has 17 `pending (named human)` matches and 0 `\| accepted`. `node scripts/check-diff-disposition.js` prints "ALL CHECKS PASSED". `41-27.md` line 92-94 carries the pointer to `41-28.md`. |
| 13 | 41-28 truth 8: the ledger reads CR-01, WR-01 and WR-02 `fixed \| 41-28`, `open: 6` | VERIFIED (superseded) | The ledger was regenerated at 19:25Z (commit 0ae7cd90) for the new review. `CR-01 \| fixed \| 41-28` stands. WR-01 and WR-02 now name the new review's findings and read `open` because the new review reused those ids and the gate drops a recorded decision when an id is reused. The fixes of the earlier WR-01 and WR-02 are recorded in 41-28-SUMMARY.md and commits ed36ea15 and 068aa691. `open` is now 10. |
| 14 | 41-28 truth 9: no program code changed; the only `.ts`, `.js` or `.json` file touched is the test file; residuals, `factory.config.md`, SECURITY, UAT, VERIFICATION and VALIDATION untouched | VERIFIED | `git diff --name-only 980779522 HEAD` filtered to `.ts`, `.js`, `.json`: `scripts/flow-guidance-text.test.ts` only. No diff on `docs/audit/41-residuals.md` or `agent-factory/config/factory.config.md`. The `.planning` files changed are ROADMAP, STATE, 41-28-SUMMARY and 41-REVIEW-DISPOSITION. |
| 15 | 41-28 truth 10: the full suite ends on exactly the 21 baseline names in 41-VALIDATION.md | NOT RE-RUN here (taken from the orchestrator) | The orchestrator reports 11,761 tests, 11,738 passed, 21 failed, 2 skipped, all 21 matching by name, and `tsc --noEmit` exit 0. I re-ran `npx tsc --noEmit` (exit 0) and the six focused files (613 of 613 pass). I did not re-run the roughly 26-minute full suite. Not counted in the independent score. |

**Score:** 14/14 independently verified truths; truth 15 rests on the orchestrator's measurement. 0 present-but-behavior-unverified. No override applied.

### Deferred Items

None.

### Advisory (New Scope, Unevidenced)

| # | Finding | Category | Why Advisory |
|---|---------|----------|--------------|
| 1 | Review WR-01: Workflow 06 and the CHANGELOG omit the `high-severity` role condition | other | True against code; no plan truth requires it; the recipe states it |
| 2 | Review WR-02: the route scan's R4, denial mask and negated-form pattern are weaker than its comment says | other | Confirmed by reading the code; satisfies the plan's own wording; hides no live defect |
| 3 | WR-03 (carried): Workflow 17 step 3 opens with "Stop" | other | Outside plan 41-28; open in the ledger |
| 4 | IN-06: `context-io.ts` refusal text still says an "un-forgeable" hook on every install | other | Program text; plan was text-only |
| 5 | IN-01 to IN-05, IN-07 | other | Wording and pin scope, already routed |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/workflows/06-uat-pack.md` | Plugin-install, `propose_note`, dial conditions, default-`off` sentence | VERIFIED | "At the default `off` the dial gates no note, so nothing binds the name." present |
| `agent-factory/checklists/browser-uat-recipe.md` | Default-off clause, high-severity roles, `note.js` sentence | VERIFIED | "At `high-severity` it gates only a finding by `security-nfr`, `architect-design` or `release-manager`." present |
| `CHANGELOG.md` | Security bullet with the dial condition | VERIFIED | "There the hook binds it only for a finding the Orchestrator sends through `propose_note` that the `human_admission` dial gates." present |
| `install/README.md` | `note.js` entry with no Claude Code hook | VERIFIED | Entry at line 459 |
| `scripts/flow-guidance-text.test.ts` | Rebuilt scan, fixture case, moved pins | VERIFIED | `routeOffenders` present; 164 tests in the file pass |
| `docs/audit/29-style-dispositions/41-28.md` | Pending row per changed clause | VERIFIED | 17 pending, 0 accepted |
| `.planning/.../41-REVIEW-DISPOSITION.md` | CR-01 recorded fixed by 41-28 | VERIFIED | `CR-01 \| critical \| fixed \| 41-28` |
| `scripts/runnable-ref/claim.js` | Shipped queue runnable | VERIFIED | Present, tested |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Route scan rule R4 | Workflow 06 line 37 | A binding on a plugin install must sit in a block that names `human_admission` | WIRED (block-level, see WR-02) | `NAMES_DIAL.test(blockText)` at the R4 branch; Workflow 06's block names the dial |
| Route scan rule R1 | `install/README.md` program list | Every "Claude Code" in a route sentence is part of an install form | WIRED | `ROUTE_FILES` includes the install guide |
| Workflow 06 attended lane | Recipe attended lane | Same scope, residual R-41-06 | WIRED | Both name a Claude Code plugin install and R-41-06; the recipe adds the `high-severity` clause that Workflow 06 lacks |
| `orchestrator.md` | Workflow 17 | One-line pointer | WIRED | Unchanged |

### Data-Flow Trace (Level 4)

Not applicable to plan 41-28: it changed kit text and one test file. The queue programs that render `now-running.md` are unchanged and covered by their own tests.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Flow, tier, claim, freshness, read-site and exit-contract suites | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/now-running-freshness.test.ts scripts/runnable-ref/claim.test.ts scripts/runnable-ref/claim-read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts` | 6 files passed, 613 of 613 tests | PASS |
| Disposition gate | `node scripts/check-diff-disposition.js` | ALL CHECKS PASSED | PASS |
| Type check | `npx tsc --noEmit` | exit 0 | PASS |
| Scope of plan 41-28 | `git diff --name-only 980779522 HEAD` filtered to `.ts`, `.js`, `.json` | the one test file | PASS |
| Full suite | not run here | orchestrator reports 21 failed, all baseline names | taken on trust |

### Probe Execution

SKIPPED: the plan declares no `probe-*.sh` probes.

### Requirements Coverage

Every ID appears in at least one PLAN's `requirements:` field. Plan 41-28 declares RUN-04 and RUN-05. No orphaned ID in REQUIREMENTS.md.

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| RUN-01 | 41-01 and later | `now-running.md` rendered from `claimed/`, holds only running work | SATISFIED | Truth 1 |
| RUN-02 | many | Refill from `wip_limit` minus `claimed/` count, no timers | SATISFIED | Truth 2 |
| RUN-03 | several | Session compaction guidance, fresh-session fallback | SATISFIED | Truth 3 |
| RUN-04 | many, incl. 41-28 | One Workflow 17 guidance, pointer under ceiling, same on six hosts | SATISFIED (text); live runs owed | Truths 3, 4, 6-10 |
| RUN-05 | many, incl. 41-28 | `claim.js` ships as a runnable | SATISFIED | Truths 2, 6-8 |
| RUN-06 | several | Adapter-name starts, no fork, no model override, no self-claim | SATISFIED | Truth 5 |

REQUIREMENTS.md still shows RUN-01 to RUN-06 as `[ ]` and "Gaps Found" in the traceability table (lines 66-71, 153-158). The executor restored it after `requirements.mark-complete` flipped RUN-04 and RUN-05 early. My ruling: all six are satisfied in the code. RUN-04's "reads the same on all six hosts" is proven for the text only, and the live runs are owed to the milestone UAT; whether to flip RUN-04 now or at the milestone UAT is the caller's and the named human's call. I did not edit REQUIREMENTS.md.

### Anti-Patterns Found

I scanned the lines plan 41-28 added (`git diff 980779522 HEAD` over the CHANGELOG, `agent-factory`, `install/README.md`, the test file and `docs`) for `TBD`, `FIXME` and `XXX`. None. No stub or hollow-data pattern applies to a text and test change.

### Human Verification Required

1. **Rule the new review warnings WR-01, WR-02, WR-03 and IN-01 to IN-07.** Test: read Workflow 06 line 37 and the CHANGELOG bullet against the recipe lines 453-461, and the scan at `scripts/flow-guidance-text.test.ts` lines 1416-1505. Expected: the `high-severity` sentence is added and the scan tightened, or the wording is accepted as a necessary-condition statement, or the items are deferred. Why human: a governance wording ruling; no agent may accept it.
2. **Live run on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi** (41-UAT test 2, deferred to the milestone UAT). Expected: the Orchestrator claims, refills and sweeps from Workflow 17 alone. Why human: the CLIs are absent here.
3. **Windows run of `note.js`'s `trustedRepoRoot` ladder** (41-UAT test 3, deferred). Why human: no Windows machine.
4. **The 17 pending rows of `41-28.md` and the earlier pending rows.** Why human: no agent may write `accepted`.
5. **Olger's read of R-41-11** as plan 41-26 rewrote it. Why human: no agent may write a named human's acceptance of a residual.

### Gaps Summary

No gaps. Plan 41-28's three fixes landed and read correctly at HEAD, the one `.ts` file touched is the test file, the disposition gate and type check pass, and 613 focused tests pass. The phase goal and all six requirements hold in the code. What remains is human work: a ruling on two new wording and scan-strength warnings, the live runs on hosts that are not on this machine, and the disposition rows only a named human may accept. No override was written. The full-suite baseline comparison is the orchestrator's measurement and I did not re-run it.

---

_Verified: 2026-11-13T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
