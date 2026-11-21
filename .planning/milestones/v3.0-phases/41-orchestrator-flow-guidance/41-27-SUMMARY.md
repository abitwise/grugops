---
phase: 41-orchestrator-flow-guidance
plan: 27
subsystem: kit-text
tags: [workflow-16, workflow-04, workflow-06, note-contract, browser-uat-recipe, install-guide, propose_note, admission-hook, wording-pins, gap-closure]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "plan 41-26: propose_note and the hook scoped to a Claude Code plugin install in Workflow 16's route sentences, the note contract's route clause, the CHANGELOG and R-41-11"
provides:
  - "Workflow 16 step 3's finding sub-bullet scopes the per-call hook and its tier to a Claude Code plugin install and says every other install, a standalone Claude Code install included, degrades to two weaker signals (CR-01)"
  - "The note contract's human-set signal and tier sentences scoped the same way (CR-01)"
  - "Workflow 04 step 15, the attended Chrome lane of Workflow 06 and of the browser UAT recipe, and the install guide's hook paragraph scoped to a Claude Code plugin install (WR-18)"
  - "An invariant pin that refuses any sentence of the five files naming Claude Code with a route token and no install form"
  - "26 pending (named human) disposition rows in docs/audit/29-style-dispositions/41-27.md"
  - "CR-01 fixed | 41-27, WR-18 fixed | 41-26, 41-27; open: 8"
affects: [gsd-verify-work 41, phase 41 UAT re-run]

actuals:
  tasks: 3
  commits: 5
plan_head_before: ee30eca3a5764788dc686f3546b7f777ad5a7da8
plan_head_after: cd59cde13d4005853fd8272814fea2de71fc7773

tech-stack:
  added: []
  patterns:
    - "An invariant pin over whole sentences backs the phrase list, so an unlisted unscoped sentence is red"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-27.md
  modified:
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/contracts/context-note.md
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/checklists/browser-uat-recipe.md
    - install/README.md
    - CHANGELOG.md
    - scripts/flow-guidance-text.test.ts
    - scripts/tier-kit-text.test.ts
    - docs/audit/29-style-dispositions/41-08.md
    - docs/audit/29-style-dispositions/41-11.md
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "CR-01: the spawned-role sentence reads 'on a Claude Code plugin install', not the review's 'on a plugin install', so every scoped sentence names the install the same way (19 words, under the Steps bound of 20)"
  - "CR-01: the contract's tier sentence (lines 152-155) is scoped too, because it makes the claim the review names for line 32"
  - "WR-18: Workflow 04 step 15, Workflow 06's attended lane, the browser UAT recipe and the install guide are additions from the kit-wide grep, so no third site is left"

requirements-completed: [RUN-04, RUN-05]

coverage:
  - id: D1
    description: "Workflow 16 step 3's finding sub-bullet and the note contract scope the per-call hook, its un-forgeable signal and its tier to a Claude Code plugin install, and say a standalone Claude Code install gets the two weaker signals (CR-01)"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#no sentence of Workflows 04, 06 and 16, the note contract or the browser UAT recipe names Claude Code with a route token and no install form (CR-01, WR-18; plan 41-27)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 04 step 15, the attended Chrome lane of Workflow 06 and the browser UAT recipe, and the install guide name a Claude Code plugin install for propose_note, the hook and the witness's name (WR-18)"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the attended Chrome lane of Workflow 06 binds the witness's name only on a plugin install (WR-18, D-45; plan 41-27)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The 26 pending (named human) disposition rows of 41-27.md, read against the diff"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js (ALL CHECKS PASSED with 41-27.md in place; 1 check failed without it)"
        status: pass
    human_judgment: true
    rationale: "No agent may accept a disposition row; the gate proves each changed clause has a row and cannot prove a disposition is right"

completed: 2026-11-13
status: complete
---

# Phase 41 Plan 27: The WR-18 sites plan 41-26 left (CR-01) Summary

**No kit text now tells a standalone Claude Code install that it holds the per-call `admission-guard` hook, `propose_note`, or a witness name bound to the human. Workflow 16 step 3 agrees with its own line 31, and an invariant pin refuses the next unscoped sentence. No program code changed.**

## Performance

- **Started:** 2026-11-13T09:13Z (pre-plan commit `ee30eca3`)
- **Last task commit:** 2026-11-13T09:22:37Z; full suite 09:22:43 to 09:49; SUMMARY written 2026-11-13 after a session break
- **Tasks:** 3
- **Files modified:** 13 (1 created, 12 modified)

## Accomplishments

- **CR-01:** Workflow 16 step 3's finding sub-bullet now reads `On a Claude Code plugin install the separate PER-CALL PreToolUse admission-guard hook makes the human:<name> signal un-forgeable.`, then `The Claude Code plugin-install tier is gated by the human_admission dial. Every other install, a standalone Claude Code install included, degrades to two weaker signals.` and the spawned-role sentence names a Claude Code plugin install. The note contract's line-138 and tier sentences say the same thing.
- **WR-18:** Workflow 04 step 15 reads `Only the propose_note tool of a Claude Code plugin install binds it to the human's session grant.` The attended Chrome lane of Workflow 06 and of the browser UAT recipe binds the witness's name only on a Claude Code plugin install, and names R-41-06 for every other install. The install guide says `Only a Claude Code plugin install loads that hook.` The CHANGELOG `### Security` block records the correction.
- 26 `pending (named human)` rows in `41-27.md`, with no `accepted` row. 41-08.md and 41-11.md each gain one pointer line, and no existing row changed.
- The ledger reads `| CR-01 | critical | fixed | 41-27 |` and `| WR-18 | warning | fixed | 41-26, 41-27 (not in the current review) |`, with `open: 8`. WR-01 to WR-03 and IN-01 to IN-05 stay open, and the six deferred rows are unchanged.

## Task Commits

1. **Task 1 (tracer): hook, tier and propose_note scoped in Workflow 16, the contract and Workflow 04.** RED `7ff282d2` (test), GREEN `ec6bffa8` (docs)
2. **Task 2: the attended lane, the install guide and the CHANGELOG.** RED `9a70b838` (test), GREEN `935f3b9e` (docs)
3. **Task 3: pending rows, pointer notes, ledger, phase gate.** `cd59cde1` (docs)

## TDD record

- **Task 1 RED:** `flow-guidance-text.test.ts` plus the tier-kit file failed 7 of 381. Target `no sentence of Workflows 04, 06 and 16, the note contract or the browser UAT recipe names Claude Code with a route token and no install form` returned `RED_EVIDENCE_OK` (`target_test_failed`). It listed five unscoped route sentences: two in Workflow 16, two in the contract and one in Workflow 04.
- **Task 2 RED:** 4 of 162 failed. Target `the attended Chrome lane of Workflow 06 binds the witness's name only on a plugin install` returned `RED_EVIDENCE_OK`, because the binding sentence was absent (`indexOf -1`).

## Full-suite comparison

- Command: `npx vitest run --exclude '**/scripts/e2e/**'` at `cd59cde1` (HEAD), in the background on the default `TMPDIR`. It took 1,575.87 s and exited 1.
- Result: 7 files failed and 137 passed. 21 tests failed, 11,736 passed and 2 were skipped.
- Compared by name (`diff` of the sorted `FAIL <file> > <describe> > <test>` lines against the 21 names, each confirmed present in 41-VALIDATION.md § Known baseline reds): **the 21 failed names are the 21 baseline names.** No failed name falls outside the table, and no baseline name passed.
- The log has no EDQUOT or `Unknown system error -122` line. No name fell outside the table, so no file was re-run alone and no pre-plan worktree was needed.
- The 21 names by file: `install/installer-fs-census.test.ts` (1), `scripts/canonical-corpus.test.ts` (1), `scripts/check-foundation-guards.test.ts` LANG-07 LIVE COUNT (1, which stays red while the user's untracked `~/` exists), `scripts/context-io-writer-set.test.ts` (2), `scripts/context-io.test.ts` (7), `scripts/harness-instance-ledger.test.ts` (4) and `scripts/uat-gate-exit-contract.test.ts` (5).

## Gates run

All exited 0 at HEAD: `npm run typecheck`, `check-imperative-lexicon`, `check-role-rules`, `check-kit-refs`, `check-diff-disposition`, `check-banned-claims`, `check:residual-citations`, `check:audit-register`, `check:public-docs`, `check:claim-anchors`, `validate-agent-factory`, `check-foundation-guards`, `check-state-paths`, `check-uat-oracles`, the adapters, catalog, skill-twins, host-entries and guarantees freshness checks, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:queue` and `freshness:context`. After the Task 3 commit, `npm run freshness` and `scripts/floor-invariance.test.ts` (136/136) passed too.

Scope checks: the only `.ts`, `.js` or `.json` paths in `git diff --name-only ee30eca3 HEAD` are `scripts/flow-guidance-text.test.ts` and `scripts/tier-kit-text.test.ts`. `docs/audit/41-residuals.md`, `install/install.ts`, `hooks/hooks.json`, `.claude-plugin/plugin.json`, 41-SECURITY.md, 41-UAT.md, 41-VERIFICATION.md and 41-VALIDATION.md have no diff. `docs/audit/28-prepass-evidence.md` is still modified and unstaged. No commit of this plan names it, `brand/readme-art.txt` or `~/`.

## Accepted rows this plan superseded

- In `41-11.md`, three rows accepted by Olger in 41-UAT test 4 (2026-11-10): the per-call hook sentence, the primary-tier sentence and the spawned-role sentence of Workflow 16 line 32. Also the row for the non-Claude-Code host CLIs sentence, marked kept word for word.
- In `41-08.md`, the Workflow 04 line-53 sentence that opened with `Only the Claude Code`, accepted by Olger in 41-UAT test 4.
- Each keeps its old row unchanged. A pointer line names `41-27.md`, where the new rows wait for a named human.

## Grep hits left out of scope, with the reason

- Workflow 16 line 57 (tier 0, "Claude Code hook path only"): limits tier 0 to the hook's own process and gives no install a control.
- Workflow 16 line 31: open under WR-01. Line 21 names the grant, not a hook or an install.
- `agent-factory/config/factory.config.md` line 238: the checkpoint ask rules that a standalone install writes. No hook reads them.
- `agent-factory/packaging/subagent.frontmatter.md` lines 202 and 217-220: already scoped.
- Coordinator-spawning and engineer-level text in agent-factory/README.md, packaging/adapters.md, packaging/slash-command.template.md, packaging/subagent.frontmatter.md line 144, roles/_role-switch-protocol.md, roles/software-engineer.md, config/factory.config.md lines 125 and 172, install/README.md line 2065 and CHANGELOG.md line 104. A standalone install writes those adapters too, and none of these names the hook or `propose_note`.
- install/README.md line 460: `note.js` runs outside the hook, which is true on every install.
- `docs/audit/41-residuals.md`: R-41-01 and R-41-11 are already scoped. R-41-06 was accepted by Olger in 41-UAT test 5.
- CHANGELOG `## [2.2.0]` and older: released history.
- `.claude/agents/grugops-orchestrator.md`: a generated adapter whose plugin tool token resolves to nothing without the plugin.
- Dated audit records and generated pages (docs/audit/28-disposition-register.md F-28-036, docs/audit/3x-*.md, docs/audit/29-locator-unification.md, docs/GUARANTEES.md): each records what was true when it was written.
- Program code and test comments (scripts/admission-server.ts, scripts/context-io.ts, scripts/chrome-lane-bar.test.ts, scripts/context-io.test.ts): D-45 limits this fix to text.
- CLAUDE.md: developer instructions for this repository. It is not shipped to a host.
- The attended lane's `artifact-ref` output: falls under R-41-10 and open IN-04, not WR-18.

## Deviations from Plan

The session ended after the Task 3 commit and the full-suite run, before the SUMMARY. A later session compared the saved suite log by name, re-ran every gate in `<verify>` and the post-commit freshness checks at HEAD, re-checked each Task 3 acceptance criterion, and wrote this SUMMARY. No kit text, pin or row changed after `cd59cde1`.

**Total deviations:** 0 to scope or text.

## Owed to a named human (not filled by any agent)

- The 26 `pending (named human)` rows of `41-27.md`, especially the four that replace sentences Olger accepted in 41-UAT test 4. Earlier files (41-19.md to 41-26.md) also hold pending rows.
- WR-01 to WR-03 and IN-01 to IN-05 of 41-REVIEW-DISPOSITION.md.
- The R-41-11 read of WR-02.
- The live runs on other hosts (R-41-05) and the Windows check stay `UNKNOWN - verify`.

## User Setup Required

None.

## Next Phase Readiness

All 27 plans of phase 41 have summaries. `/gsd-verify-work 41` (or the execute-phase verification sequence: code review, regression gate, verifier) can reconcile the CR-01 gap of 41-VERIFICATION.md.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-27.md (26 pending rows, 0 accepted)
- FOUND commits: 7ff282d2, ec6bffa8, 9a70b838, 935f3b9e, cd59cde1 (all ancestors of HEAD)
- Every Task 3 acceptance criterion was re-run at HEAD and passed. The suite ends on the 21 baseline names.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-13*
