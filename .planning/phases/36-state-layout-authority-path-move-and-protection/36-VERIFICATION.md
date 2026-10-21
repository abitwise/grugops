---
phase: 36-state-layout-authority-path-move-and-protection
verified: 2026-10-21T15:40:00Z
status: human_needed
score: 4/5 must-haves verified
covered_files:
  - ".github/workflows/ci.yml"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-01-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-01-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-02-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-02-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-03-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-03-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-04-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-04-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-05-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-05-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-06-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-06-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-07-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-07-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-08-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-08-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-09-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-09-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-10-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-10-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-11-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-11-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-12-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-12-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-13-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-13-SUMMARY.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-14-PLAN.md"
  - ".planning/phases/36-state-layout-authority-path-move-and-protection/36-14-SUMMARY.md"
  - "AGENTS.md"
  - "agent-factory/roles/orchestrator.md"
  - "docs/pre-v3-state-layout.md"
  - "install/install.ts"
  - "install/pre-v3-layout.test.ts"
  - "install/state-layout.ts"
  - "install/uninstall.ts"
  - "package.json"
  - "scripts/board-read.ts"
  - "scripts/check-state-paths.ts"
  - "scripts/kit-model.ts"
  - "scripts/state-path-scan.ts"
  - "scripts/validate-agent-factory.ts"
covered_digest: "v3:sha256:d04358de92dd04496651c0f24ad5b90a691bbbafbd53ee46f9ebaeebfee0d657"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Roles on a pre-v3 repo fall back to plans/ and say once to run install --migrate (LAYOUT-04, roles half)"
    test: "In a live host session on a repo that has plans/board.md and no memory-bank/plans/board.md, with the kit updated, ask the Orchestrator to show the board"
    expected: "It reads plans/board.md, says once to run `install --migrate`, and does not create memory-bank/plans/; with both boards present it uses memory-bank/plans/ and says once that plans/ is stale"
    why_human: "The fallback is prose (LEGACY_FALLBACK_CLAUSE) that a model follows. Carrier presence is proven byte-exact; whether an agent obeys it is runtime behavior no test here exercises. This is the 36-13 Task 2 human-check, not yet run."
human_verification:
  - test: "Live pre-v3 session fallback (36-13 Task 2 human-check)"
    expected: "Agent reads plans/, says once to run `install --migrate`; with both boards, uses memory-bank/plans/ and says plans/ is stale"
    why_human: "Model-following behavior of a prose rule; REQUIREMENTS.md LAYOUT-04 is deliberately still unchecked pending this"
  - test: "Decide the two-root (v2.x) pre-v3 dead end before v3.0 ships (WR-04)"
    expected: "Either Phase 38 is confirmed to own it with a pin that turns red if the `already migrated ... Nothing to do.` short-circuit survives, or the arm's wording is fixed now"
    why_human: "Scope decision: D-06 defers to Phase 38, but nothing currently pins the deferral and the printed closing is false on that layout"
---

# Phase 36: State-layout authority, path move and protection - Verification Report

**Phase Goal:** Every part of grugops names planning state under `memory-bank/plans/` through one path authority, state is never pruned or uninstalled, and a repo still on the old layout keeps working after a kit update
**Verified:** 2026-10-21
**Status:** human_needed
**Re-verification:** No, initial verification

Every automated truth holds in the code and under reproduction in scratch dirs. One truth (LAYOUT-04, the roles' fallback behavior) rests on a model following prose and cannot be confirmed here. There are no FAILED truths. Four warnings (the open code-review findings, one of them re-measured as a real defect) and one CI-gate regression are listed below.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Fresh install seeds board, tickets, epics, features, sprints, releases, NFRs, traceability, metrics, UAT under `memory-bank/plans/`; seed, roles, workflows, tooling, docs name the new paths (LAYOUT-01) | VERIFIED | Scratch `install.js --claude` (HOME and GRUGOPS_HOME in scratch): `memory-bank/plans/{board.md,metrics.md,nfr-catalog.md,traceability.md,epics,features,releases,sprints,tickets,uat}`, no top-level `plans/`; `--check` prints `ok state layout: memory-bank/plans/`. Old-spelling gate: 0 sites outside the allow-list over 1184 files. |
| 2 | One constants-only layout module is the only place a state path is spelled; readers, writers, validator, installer, uninstaller import it; a gate fails on any old `plans/` spelling (slash, join, backslash) outside a named allow-list with a derived count (LAYOUT-02) | VERIFIED (warnings WR-01, WR-02) | `install/state-layout.ts` read: imports nothing, only `const` exports. `node scripts/check-state-paths.js` exit 0, 306 sites inside 6 per-file entries, counts printed per entry and read from the run, `.planning/` excluded by name with the skipped count. Wired in `package.json:26` and `ci.yml:558`. `check-state-paths.test.ts` and `state-path-scan.test.ts` pass (converse dead-entry case and ownership check included). Gate holes are real but do not defeat the SC as worded (see WR-01, WR-02). The "every budget" clause is vacuous: no budget exists, and the module says so; Phase 37 adds them. |
| 3 | Install pruning and uninstall leave every state root, including `memory-bank/`, untouched, both reading one exported list (LAYOUT-03) | VERIFIED | `install.ts:3316` `isPruneProtected` and `uninstall.ts:402` `isProtected` both loop over the one imported `STATE_ROOTS` (7 roots, count pinned two-sided). Reproduction: fresh install, planted `memory-bank/plans/tickets/MINE-1.md` and `memory-bank/notes/x.md`, ran `uninstall.js`: `shasum` of every file under `memory-bank/` identical before and after. Prune and uninstall tests pass, including the `docs2/` and `memory-bank-notes/` prefix-adjacency cases. |
| 4 | A repo still on the old layout keeps working after a kit update: roles fall back to `plans/` with a one-line "run `install --migrate`" notice; a plain install refuses to seed there and names the command (LAYOUT-04) | PARTIAL: refusal VERIFIED; role fallback PRESENT_BEHAVIOR_UNVERIFIED | Refusal reproduced: repo with only `plans/board.md`, plain `install.js --claude` exits 1, stdout empty, one stderr sentence naming the pre-v3 board and the `--migrate` command, file tree sha-identical afterwards. `--check` gives `WARN state layout: pre-v3 ...` (never FAIL). `--migrate` seeds nothing under `memory-bank/plans/` on that repo. A both-boards target installs on the new layout. Fallback clause (`LEGACY_FALLBACK_CLAUSE`) is byte-present in AGENTS.md, both packaging copies, all 7 `skills/*/SKILL.md`, `orchestrator.md` line 8 (the kit-home copy `--update` refreshes), all 17 `.claude/agents` adapters and all skill twins; no other role or workflow carries it. Whether an agent follows the clause is the pending human-check. |
| 5 | grugops's own repo state lives in the new layout and its validator and gates pass on it (LAYOUT-05) | VERIFIED | No tracked `plans/` at the top level; `git ls-files` shows no path under `plans/` outside `memory-bank/plans/` and `.planning/`. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: ALL CHECKS PASSED. `check:build-parity`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries`, `freshness:traceability`, `check:claim-anchors`, `check:banned-claims`, `check:imperative-lexicon`, `check:platform-shapes`, `check-foundation-guards`: all exit 0. |

**Score:** 4/5 truths verified, 1 present and wired but behavior-unverified (LAYOUT-04 role fallback).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/state-layout.ts` (+ committed `.js`) | Constants-only authority with `STATE_ROOTS`, `STATE_ROOT_COUNT`, `LEGACY_FALLBACK_CLAUSE` | VERIFIED | Read in full; build-parity passes |
| `scripts/state-path-scan.ts`, `scripts/check-state-paths.ts` | Scan core and wired gate | VERIFIED | Gate run exit 0 with derived counts |
| `agent-factory/seed/memory-bank/plans/` | Seed moved with history | VERIFIED | Fresh install seeds from it |
| `install/install.ts` refusal, `stateLayout()`, doctor line | D-01, D-05, D-07 | VERIFIED | Reproduced above |
| `docs/pre-v3-state-layout.md` | One home for pre-v3 material | VERIFIED | Present, allow-listed with reason, 27 sites counted |
| `.planning/PROJECT.md` `[v3.0, D-11]` row | v4.0 end recorded | VERIFIED | Line 271 |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `install.ts` isPruneProtected / `uninstall.ts` isProtected | `state-layout.ts` STATE_ROOTS | named import, loop | WIRED |
| `board-read.ts` FIXED_SUBPATHS, validator, trace-render, trace-freshness, board-corpus | `state-layout.ts` | import of `*_REL` | WIRED (ownership test passes) |
| `check-state-paths` | package.json and ci.yml | `check:state-paths`, repo-gate line | WIRED at both ends |
| `LEGACY_FALLBACK_CLAUSE` | every carrier | exact-substring test in `kit-model.test.ts`; re-checked by grep | WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Fresh seed | scratch `install.js --claude` | memory-bank/plans/* seeded, no `plans/` | PASS |
| State survives uninstall | scratch uninstall, sha compare | identical | PASS |
| Pre-v3 plain install refuses, writes nothing | scratch repo with `plans/board.md` | exit 1, empty stdout, tree sha-identical | PASS |
| Doctor on pre-v3 | `install.js --check` | WARN, not FAIL | PASS |
| Phase test files | 9 files (state-layout, pre-v3-layout, state-path-scan, check-state-paths, kit-model, adapter-byte-baseline, installer-prune, uninstall-removal, closing-claims) | 292/292 pass | PASS |

### Full-suite evidence

Log `.../scratchpad/full-suite.log` (plan 36-14): 6 files failed, 20 tests failed, 8569 passed. All 20 are the entries in `deferred-items.md`. Pre-existing, verified rather than assumed: the failing tests scan `.planning/phases/31-autonomous-manual-testing/` and `phases/27-spawn-*`, which exist only under `.planning/milestones/v2.1-phases/` at the phase base `3d684620` (and now), so they ENOENT before this phase. The one diff this phase made to `context-io.test.ts` adds an existence assertion and is not on a failing path. `installer-fs-census` is the Node v26-only `openAsBlobSync` row (CI pins Node 22). These do not count against the phase.

### Probe Execution

No probes declared by this phase. SKIPPED.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
|-------------|--------------|--------|----------|
| LAYOUT-01 | 36-02, 08, 09, 10, 11, 14 | SATISFIED | Truth 1 |
| LAYOUT-02 | 36-01..07, 14 | SATISFIED (budget clause vacuous until Phase 37) | Truth 2 |
| LAYOUT-03 | 36-01 | SATISFIED | Truth 3, reproduced |
| LAYOUT-04 | 36-08, 10, 11, 12, 13 | NEEDS HUMAN | Refusal, doctor, both-case, kit-home carrier verified; role-following unverified |
| LAYOUT-05 | 36-06 | SATISFIED | Truth 5 |

All five IDs appear in PLAN frontmatter and in REQUIREMENTS.md mapped to Phase 36; none orphaned. REQUIREMENTS.md leaves LAYOUT-04 `[ ]` / Pending, which matches this report.

### Anti-Patterns Found

No TBD/FIXME/XXX markers without a reference in files changed by the phase (outside `.planning/` and fixtures). No stubs in the new modules.

### Warnings (none block the phase goal)

| ID | Finding | My judgment |
|----|---------|-------------|
| WR-01 | Gate misses the root as a final path segment (`${root}/plans`, `"../plans"`) and after `_` | Confirmed from the pattern source. The tree has zero live code misses: my grep of every tracked non-allow-listed file for the end-of-path or `_plans/` forms found only 3 comment lines in `check-platform-shapes.{ts,js}` that cite a historical Windows run. The SC names slash, join and backslash forms, which the gate does cover. Hardening needed, goal not defeated. |
| WR-02 | `check-state-paths` uses `process.cwd()`, passes vacuously from a subdirectory | Reproduced: run from `agent-factory/` it prints `PASS: 92 file(s) scanned ... 0 site(s) inside it, in 6 entr(ies)` and exits 0. CI and the npm script run from the root, so today's wiring is sound; a different working directory would silently green. The "gate cannot pass vacuously" intent of 36-14 is not fully met. |
| WR-03 | Uninstall banner lists `.grugops/` under "preserved (never touched)", then removes `.grugops/install.json` | Reproduced verbatim. A published claim the same run contradicts. State (the seeded config) is untouched, so LAYOUT-03 holds; the wording is wrong. |
| WR-04 | Refusal's remedy is a no-op on an installed two-root (v2.x) pre-v3 repo | Reproduced: after one install, a plain install refuses with the `--migrate` remedy, and `--migrate` prints `This repo is already migrated to the two-root layout. Nothing to do.` The loop is a dead end, and "Nothing to do." is false there. D-06 assigns the fix to Phase 38 and v3.0 ships 36-38 together, so the phase's SC4 (refuse and name the command) is met, and the repo's existing state and roles keep working. But nothing pins the deferral, so Phase 38 can forget it. Listed as a human decision above. |
| CI | `check:diff-disposition` (wired at `ci.yml:504`) rose from 63 findings at the phase base to 569 | Measured: 63 in a scratch worktree at `3d684620`, 569 now. It was already red, and 36-08 disclosed the rise as the predicted cost of mechanical role path edits, but 506 new undispositioned clauses now need catch-up rows under `docs/audit/29-style-dispositions/` before CI can go green. `check-flip-manifest` is red before and after (absent phase-33 file). Neither is a Phase 36 must-have. |

Info findings IN-01..IN-04 are open and none touches a must-have.

### Human Verification Required

#### 1. Live pre-v3 session fallback

**Test:** In a live host session on a repo with `plans/board.md` and no `memory-bank/plans/board.md`, after a kit `--update`, ask the Orchestrator to show the board. Repeat with both boards present.
**Expected:** It reads `plans/board.md` and says once to run `install --migrate`; it does not create `memory-bank/plans/`. With both boards it uses `memory-bank/plans/` and says once that `plans/` is stale.
**Why human:** A model following a prose rule. The clause text is proven present in every carrier; obedience is not testable here. This is the unrun 36-13 Task 2 human-check, and LAYOUT-04 stays unchecked until it passes.

#### 2. Phase 38 ownership of the two-root dead end (WR-04)

**Test/decision:** Confirm Phase 38 owns the short-circuit, and add a pin (an `it.fails` or `it.todo` row) that goes red if `already migrated ... Nothing to do.` survives on a pre-v3 board; or change the arm's wording now.
**Why human:** Scope decision (D-06) that the code cannot settle.

### Gaps Summary

No gap blocks the phase goal. The authority, the move, the single protected list, the refusal and the gate all exist, are wired, and behave as stated under reproduction. The status is `human_needed` because LAYOUT-04's role fallback depends on a model following a prose rule and its human-check has not been run. Recommended follow-ups, none blocking: fix WR-02 (resolve the repository root in `main()`) and WR-03 (drop `.grugops` from the banner list) cheaply; harden WR-01; pin WR-04 for Phase 38; add catch-up disposition rows for the 506 new `check:diff-disposition` findings.

---

_Verified: 2026-10-21_
_Verifier: Claude (gsd-verifier)_
