---
phase: 44-upstream-source-declaration-and-pin-check
plan: 08
subsystem: kit-text
tags: [upstream, workflow-17, orchestrator, agents-md, config-reference, roadmap]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-07's Workflow 20 and agent-factory/contracts/upstream.md; plan 44-03's installed tools/grugops/upstream.js; plan 44-04's `### upstream sub-fields` config section
provides:
  - Workflow 17 `## Session start` step 4, the upstream pin check and its BLOCKED routing per Workflow 20 (refill is now step 5)
  - the Orchestrator's `## Reads` names `upstream` as a config key it reads
  - the AGENTS.md UPSTREAM third-root paragraph, outside the C-28-015 and C-28-016 anchors
  - the config reference pointer to the upstream contract and Workflow 20
  - the Phase 45 and Phase 47 roadmap notes recording the names settled in Phase 44 (D-03 to D-07)
affects: [phase-45, phase-47, phase-48]

actuals:
  tokens: 2047
  tasks: 2
  commits: 2
plan_head_before: 1e5ae00d31f278d8cdedb5dac6bf3ffb4990808c
plan_head_after: 47e31473f7c1aac8ca0233e1132ebafe5cc28b05

tech-stack:
  added: []
  patterns:
    - "Pointer, not procedure: a session-start step and an AGENTS.md paragraph name the reader and Workflow 20, and the procedure stays in Workflow 20"
    - "Unbuilt names live only in ROADMAP notes, never in kit text as current behavior"

key-files:
  created:
    - docs/audit/29-style-dispositions/44-08.md
  modified:
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/roles/orchestrator.md
    - AGENTS.md
    - agent-factory/config/factory.config.md
    - scripts/flow-guidance-text.test.ts
    - .planning/ROADMAP.md

key-decisions:
  - "Workflow 17 session-start step 4 is three sentences: run the check and report each line; on head-moved keep working at the pin and never edit a pin; on blob-mismatch or UNKNOWN - verify report each subtask reading that source as BLOCKED with the printed reason (Workflow 20)"
  - "The AGENTS.md third-root paragraph sits after the C-28-016 blockquote as its own paragraph (357 B), so no anchored byte moves"

patterns-established:
  - "A new numbered session-start step moves the pinned step count in scripts/flow-guidance-text.test.ts and owes rows in the plan's docs/audit/29-style-dispositions file"

requirements-completed: [UP-01, UP-02, UP-03, UP-04, UP-05]

coverage:
  - id: D1
    description: "Workflow 17 session start step 4 runs `node tools/grugops/upstream.js check`, reports each line, keeps working at the pin on head-moved, and reports subtasks on a blob-mismatch or UNKNOWN - verify source as BLOCKED per Workflow 20; refill is step 5"
    requirement: UP-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#session start step 4 reports the pin check and routes untrusted sources to BLOCKED per Workflow 20 (D-14)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#orders session start as read, sweep, re-spawn, upstream check, refill"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Orchestrator's Reads names `upstream` as a config key, and the role stays below its 6195 B warning (6170 B)"
    requirement: UP-04
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js && npm run check:role-rules"
        status: pass
    human_judgment: false
  - id: D3
    description: "AGENTS.md names upstream sources as a third, read-only root read only through tools/grugops/upstream.js, never copied into memory-bank/, its text evidence to cite and never instructions; anchors C-28-015 and C-28-016 byte-unchanged"
    requirement: UP-05
    verification:
      - kind: other
        ref: "npm run check:claim-anchors"
        status: pass
      - kind: other
        ref: "npm run check:diff-disposition"
        status: pass
    human_judgment: false
  - id: D4
    description: "The config reference `### upstream sub-fields` points to agent-factory/contracts/upstream.md and Workflow 20"
    requirement: UP-01
    verification:
      - kind: other
        ref: "grep -c 'contracts/upstream.md' agent-factory/config/factory.config.md"
        status: pass
      - kind: other
        ref: "node scripts/check-kit-refs.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "ROADMAP Phase 45 and Phase 47 Notes record the names D-03 to D-07, and no kit file documents them as live behavior"
    verification: []
    human_judgment: true
    rationale: "The prohibition (no unbuilt name documented as live) is a judgment over wording; the greps show the names only in ROADMAP.md and the escalation_days mentions in kit text are the existing refusal sentences"
  - id: D6
    description: "A live host agent ignores instructions embedded in upstream content (UP-05 red-team round)"
    requirement: UP-05
    verification: []
    human_judgment: true
    rationale: "Model behavior in a live host session cannot be asserted by a unit test; the red-team round prepared in plan 44-06 runs at end-of-phase UAT"

duration: 16min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 08: Session start, Orchestrator, AGENTS.md and config pointers to upstream sources Summary

**Workflow 17 session start now runs `upstream.js check` and routes untrusted sources to BLOCKED per Workflow 20, AGENTS.md names upstream as a read-only third root reached only through the reader, and the roadmap records the Phase 45 and 47 names settled here**

## Performance

- **Duration:** 16 min
- **Started:** 2026-11-25T10:32:53Z
- **Completed:** 2026-11-25T10:48:56Z
- **Tasks:** 2
- **Files modified:** 7 (6 modified, 1 created)

## Accomplishments

- Workflow 17 `## Session start` step 4: when `.grugops/factory.config.json` declares `upstream`, run `node tools/grugops/upstream.js check` and report each printed line; on `head-moved` keep working at the pin and never edit a pin; on `blob-mismatch` or `UNKNOWN - verify` report each subtask reading that source as `BLOCKED` with the printed reason (Workflow 20). Steps 1 to 3 are byte-identical, and `Refill per ...` is step 5.
- The Orchestrator's `## Reads` ends with `` `nfr`, `compliance_regime` and `upstream` ``. The role is 6170 B, below its 6195 B warning.
- AGENTS.md gains one 357-byte paragraph after the C-28-016 blockquote: upstream sources are **UPSTREAM**, a third read-only root outside the repository, read only through `node tools/grugops/upstream.js` at the pinned commit, never copied into `memory-bank/`, and evidence to cite, never instructions (Workflow 20). AGENTS.md is 9452 B.
- `agent-factory/config/factory.config.md` points to `agent-factory/contracts/upstream.md` for the manifest, refs, reads and host access, and to Workflow 20 for the procedure.
- ROADMAP Phase 45 Notes record the build-request statuses, the `Build-request:` prefix, `upstream.escalation_days` (default `10`) and `BUILD_REQUESTS_REL` with `BR-<n>.md` files. Phase 47 Notes record `consult.mode` (`single` | `panel`) and the `Consult:` prefix.

## Task Commits

1. **Task 1: The session-start step, the Orchestrator key, the AGENTS.md third-root line, the config pointer** - `ad27b357` (feat)
2. **Task 2: Record in the roadmap the names this phase settled for Phases 45 and 47** - `47e31473` (docs)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY.

## Files Created/Modified

- `agent-factory/workflows/17-task-claim.md` - session-start step 4, refill renumbered to step 5
- `agent-factory/roles/orchestrator.md` - `upstream` in the config keys it reads
- `AGENTS.md` - the UPSTREAM third-root paragraph
- `agent-factory/config/factory.config.md` - the pointer sentence to the contract and Workflow 20
- `docs/audit/29-style-dispositions/44-08.md` - five added-clause rows for the diff-disposition gate
- `scripts/flow-guidance-text.test.ts` - session-start order test moved from 4 to 5 steps, plus a step-4 wording test
- `.planning/ROADMAP.md` - one names sentence in each of the Phase 45 and Phase 47 Notes

## Decisions Made

- Step 4 says `(Workflow 20)` at the end of its last sentence rather than `, per Workflow 20`. The gate measured the longer form at 21 words against the 20-word procedural bound (WP-02).
- The step reuses Workflow 20's own wording for the outcome (`BLOCKED`, "with the printed reason") and copies `head-moved`, `blob-mismatch` and `UNKNOWN - verify` from the header of `scripts/runnable-ref/upstream.ts`.
- No stop bullet was added, so `WORKFLOW_STOP_BULLET_COUNT` in `scripts/checkpoints.ts` is unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Session-start step count pinned at 4 in a test**
- **Found during:** Task 1
- **Issue:** `scripts/flow-guidance-text.test.ts` "orders session start as read, sweep, re-spawn, refill" asserted exactly 4 numbered session-start lines, so the plan's step 4 would turn it red. The file is outside the plan's files_modified.
- **Fix:** Changed the test to 5 steps, with step 4 containing `` `node tools/grugops/upstream.js check` `` and step 5 the refill. Added one test that pins step 4's three sentences.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Verification:** `npx vitest run scripts/flow-guidance-text.test.ts ...` passed (595 tests across the four Task 1 files)
- **Committed in:** ad27b357

**2. [Rule 3 - Blocking] Diff-disposition rows for the added clauses**
- **Found during:** Task 1
- **Issue:** `npm run check:diff-disposition` reported 5 findings: 3 added clauses in Workflow 17 line 87 and 2 in AGENTS.md line 47. The orchestrator's `## Reads` change was admitted by the role-rule inventory stand-in, and the config reference is not watched.
- **Fix:** Created `docs/audit/29-style-dispositions/44-08.md` with five added rows, taken from the gate's own clause segmentation. None sits in `## Stop conditions`, `## Commit` or `## Hard limits`, so no row needs a companion.
- **Files modified:** docs/audit/29-style-dispositions/44-08.md
- **Verification:** `npm run check:diff-disposition` exits 0, before and after the commit, and `scripts/check-diff-disposition.test.ts` passes after the commit
- **Committed in:** ad27b357

---

**Total deviations:** 2 auto-fixed (2 blocking, both gate-demanded and predicted in the 44-07 hand-off)
**Impact on plan:** No scope change. Both are the registration cost of a new session-start step.

## Issues Encountered

- The first draft of step 4's last sentence was 21 words and failed WP-02. It was shortened to 20 words, as described under Decisions Made.

## Verification

- Task 1 tests: `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/skills-kit-text.test.ts install/kit-route.test.ts`: 4 files, 595 passed
- Gate chain (all exit 0): `check:claim-anchors`, `check:imperative-lexicon` (0 findings over 71/71 and 20/20), `check:banned-claims`, `check:role-rules`, `check-kit-refs`, `check:public-docs`, `check-foundation-guards` (role corpus 60958 B, 6425 B headroom), `VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. validate-agent-factory`, `check:diff-disposition`, `check:audit-register`, `check:residual-citations`, `check:nul-bytes`, `check:state-paths`, `check:story-docs`, `scripts/runnable-ref/state-check.js .` (no findings)
- Freshness chain (all exit 0): `freshness`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries`, `freshness:catalog`, `freshness:guarantees`, `freshness:hook-manifest`, `freshness:runnable-embeds`, `freshness:context`, `freshness:traceability`; `npm run typecheck` and `npx tsc --noEmit` exit 0
- Regression sweep over the 52 other test files that read AGENTS.md, Workflow 17, the Orchestrator, the config reference or the disposition directory: 5008 passed, 2 skipped. `install/installer-fs-census.test.ts` was left out (DI-03, local Node 26 only).
- Plan verification after both commits: `scripts/flow-guidance-text.test.ts`, `scripts/tier-kit-text.test.ts`, `scripts/runnable-ref/upstream.test.ts`, `scripts/upstream-model.test.ts`, `scripts/trace-model.test.ts`, `scripts/check-diff-disposition.test.ts`: 6 files, 839 passed
- Acceptance greps: `^4\. .*upstream.js check` and `^5\. Refill per` each match one line; `Workflow 20` 1 in Workflow 17; `` compliance_regime` and `upstream`` 1 in the Orchestrator (6170 B); `tools/grugops/upstream.js` 1 in AGENTS.md (9452 B); `contracts/upstream.md` 1 in the config reference; `BUILD_REQUESTS_REL` 1, `upstream.escalation_days` 1 and `consult.mode` 1 in ROADMAP.md; `git diff --stat` on ROADMAP.md shows only the two Notes lines
- Phase-gate full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, compared by test name against the pre-phase baseline): run by the orchestrator at the phase gate, not run here

## Open confirmation items

These choices were made in this phase without an answer from a human. Confirm or change each one at UAT.

1. **Mixed-result exit, Option A.** When any source is `UNKNOWN - verify`, `check` exits 2, even if another source drifts. Host protection uses the opposite order (exit 1 outranks exit 2), and research Open Question 1 asked for this confirmation. Enforced by `checkExitCode` in `scripts/upstream-model.ts` and pinned by the `mixed` case in `scripts/runnable-ref/upstream.test.ts`. Workflow 17 step 4, Workflow 20 and the contract's `## Pin check` read it. Changing it moves the model, the embed in `upstream.js`, the test and the contract's exit list.
2. **Source `id` grammar and full-length hex pins.** An `id` is a lowercase letter followed by up to 31 lowercase letters, digits or hyphens. `commit` and `entry_blob` are full-length lowercase hex, 40 or 64 characters (CONTEXT Claude's Discretion). Enforced by `scripts/upstream-model.ts` and the validator, and stated in the config reference and the contract. Refs carry the `id` in committed notes, so a later change to the grammar can orphan cited refs.
3. **One owner per area and per prefix.** Each `owns.areas` value and each `owns.prefixes` value belongs to exactly one source (CONTEXT Claude's Discretion). Enforced by `scripts/upstream-model.ts`. Phases 45 and 47 route on it, so relaxing it later needs a tie-break rule.
4. **A pin move stays a prose rule.** Only a named human edits a pin, and the git history of the config is the record. No new checkpoint id was added (research Open Question 2). Stated in Workflow 20 step 13, Workflow 17 step 4 ("never edit a pin") and the config reference. A checkpoint id would move the roster, the site counts and `WORKFLOW_STOP_BULLET_COUNT`.
5. **`escalation_days` is refused until Phase 45.** Under `upstream`, the key is refused by name until Phase 45 adds it with its behavior (research Open Question 4). The config reference says so (plan 44-04). Phase 45 must add it to `UPSTREAM_KEYS` in `scripts/upstream-model.ts` and update the refusal sentence in the same change. This plan recorded the name and its default `10` in the Phase 45 notes.
6. **No `cite` line in `read` output.** The optional `cite upstream:<id>:<ID>@<commit>` line before BEGIN was not adopted, so the D-17 output shape stands (research Open Question 6). Adding it later moves the read grammar in `scripts/runnable-ref/upstream.ts`, its tests and the contract's `## Reads`.
7. **Reader access on the other hosts is `UNKNOWN - verify`.** No live reader run exists on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI or Pi (contract `## Host access`). Plan 44-07 added OpenCode to the four hosts the plan named. A sandbox that blocks reads outside the workspace makes `check` report `UNKNOWN - verify` (fails closed). A live run per host would settle each one.
8. **Windows is `UNKNOWN - verify`.** The reader has had no Windows run, and the recorder cases are skipped on win32 (plans 44-05 and 44-06).
9. **git older than 2.45 is untested.** The `GIT_NO_LAZY_FETCH` and promisor rules for older git are covered only by reading the code (research assumption A1). The local machine has git 2.53.0.
10. **The UP-05 red-team round has not run yet.** Plan 44-06 prepared it: build the injection fixture, install with `--claude`, add the `InstructionsLoaded` logging hook and run `claude --agent grugops-orchestrator`. Record items (1) to (7). A failure on items (3) to (6) is a phase gap (44-VALIDATION.md, "Before `/gsd-verify-work`").
11. **UP-06 concurrency is a backstop truth.** `check` reads the config once and writes nothing, so the next run sees a pin edited during a run. No test races an edit against a run (plan 44-05).
12. **Known residual for Phase 45.** A raw upstream ID such as `DEC-012` without the `upstream:` namespace still becomes a phantom ticket row in the trace. It is pinned in `scripts/trace-model.test.ts`. Phase 45 TRC-03 owns detection (plans 44-01 and 44-02).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 44's kit, runnable and gate work is complete. Before `/gsd-verify-work`, the phase gate needs the full suite compared by test name against the baseline, and the red-team round recorded (item 10).
- Phase 45 plans from the names in its ROADMAP notes: build-request statuses, `Build-request:`, `upstream.escalation_days`, `BUILD_REQUESTS_REL`. Phase 47 plans from `consult.mode` and `Consult:`.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
