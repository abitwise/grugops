---
phase: 44-upstream-source-declaration-and-pin-check
plan: 07
subsystem: kit
tags: [upstream, workflow, contract, registration, gates, lexicon, disposition]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01 check lines and grammars (scripts/upstream-model.ts), plan 44-03 installed tools/grugops/upstream.js, plan 44-04 the validator arm and the config reference, plan 44-06 the read verb, its refused and superseded lines and the D-17 fence
provides:
  - agent-factory/contracts/upstream.md, the upstream-sources contract an upstream export builds against
  - agent-factory/workflows/20-upstream-sources.md, Workflow 20 `upstream sources`, with the one statement of the untrusted-text rule
  - Workflow 20 and the contract registered with every gate, each count read off its gate's own output
  - docs/audit/29-style-dispositions/44-07.md, the 70 added-clause rows check-diff-disposition requires for the new workflow
affects: [44-08, phase-45, phase-47]

actuals:
  tokens: 14198
  tasks: 2
  commits: 3
plan_head_before: b79517c73b434f11b2ca16742a8e70a499ceb5dc
plan_head_after: a8960894213264d89246ee29ffd302608c70d24b

tech-stack:
  added: []
  patterns:
    - "A new watched workflow owes one added row per derived clause in docs/audit/29-style-dispositions/<plan>.md, generated from the gate's own segmentation; clauses in Stop conditions and Commit carry a companion cell"
    - "A new workflow moves WORKFLOW_STOP_BULLET_COUNT by its stop bullets, and each new bullet is re-walked for a checkpoint tag"

key-files:
  created:
    - agent-factory/contracts/upstream.md
    - agent-factory/workflows/20-upstream-sources.md
    - docs/audit/29-style-dispositions/44-07.md
  modified:
    - scripts/kit-model.ts
    - scripts/check-imperative-lexicon.ts
    - scripts/check-banned-claims.ts
    - scripts/checkpoints.ts
    - docs/audit/28-disposition-register.md
    - docs/audit/28-safety-surface-exclusions.md
    - docs/reference/README.md
    - docs/reference/agents/orchestrator.md
    - hooks/hook-entry.ts
    - scripts/kit-model.test.ts
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/audit-prepass.test.ts
    - scripts/trace-instructions.test.ts

key-decisions:
  - "All six Workflow 20 stop bullets are untagged: no checkpoint value could let an agent proceed past a reader error, an unchecked source or an instruction in upstream text, and a pin move stays a prose rule (research Open Question 2)"
  - "The contract lists OpenCode with Codex CLI, Antigravity CLI, GitHub Copilot CLI and Pi as `UNKNOWN - verify` for reader access: no live reader run exists on any of them"
  - "Workflow 20 step verbs come from the closed approved set (Run, List, Read, Identify, Mark, Claim, Record, Write, Escalate); no dispatch or report verb exists in it"
  - "The 44-07 disposition rows are generated from check-diff-disposition's own clause segmentation and asserted equal to it before writing, so each `after` cell is the clause the gate derives"

patterns-established:
  - "Registration walk for a new workflow: WORKFLOW_COUNT, catalog, register row, safety-surface exclusions, lexicon corpus and Technical Names, banned-claim scan, stop-bullet count, kit mirror, AUDIT_SET_COUNT, SCAN_SET_SIZE, the WP-09 lowercase observation, the hook manifest and a style-disposition file"

requirements-completed: [UP-01, UP-02, UP-03, UP-04, UP-05]

coverage:
  - id: D1
    description: "agent-factory/contracts/upstream.md states the declaration keys and grammars, the path base, the manifest table and header, the ID grammar, the locked/superseded set, the areas vocabulary, the ref grammar, the reserved BR prefix, the check and read lines and exit codes, the fence lines and the 64 KiB ceiling, copied from scripts/upstream-model.ts and scripts/runnable-ref/upstream.ts"
    requirement: UP-01
    verification:
      - kind: other
        ref: "grep -n '| ID | Status | Path | Superseded by |' agent-factory/contracts/upstream.md; grep -c 'UNKNOWN - verify' agent-factory/contracts/upstream.md (7)"
        status: pass
    human_judgment: true
    rationale: "That each contract sentence matches the code was checked by reading the code, not by a test; a reviewer confirms the contract against upstream.ts before the first upstream builds its export (costly reversibility, D-09)"
  - id: D2
    description: "Workflow 20 exists with the required frontmatter, heading and sections, routes blob-mismatch and UNKNOWN - verify sources to BLOCKED, reads only through the reader, publishes only cited claim notes and Build-request observations, and states the untrusted-text rule once"
    requirement: UP-04
    verification:
      - kind: other
        ref: "npm run check:imperative-lexicon (0 findings over 71/71 and 20/20); node scripts/check-kit-refs.js; npm run check:banned-claims (0 findings over 163/163)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js"
        status: pass
    human_judgment: true
    rationale: "Whether a live agent follows the untrusted-text rule is the end-of-phase UP-05 red-team human-check (plan 44-06), not something a gate asserts"
  - id: D3
    description: "Workflow 20 and the contract are registered with every gate; each moved count was read off its gate's refusal and carries a dated plan 44-07 line; every gate and freshness check is green"
    requirement: UP-02
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js && check:audit-register && check:imperative-lexicon && check:banned-claims && check:claim-anchors && check-kit-refs && check:public-docs && check:role-rules && validate-agent-factory && check-diff-disposition"
        status: pass
      - kind: other
        ref: "npm run freshness && freshness:catalog && freshness:adapters && freshness:skill-twins && freshness:host-entries && freshness:guarantees && freshness:hook-manifest && freshness:runnable-embeds && typecheck"
        status: pass
      - kind: unit
        ref: "npx vitest run (the plan's 13 regression files plus upstream.test.ts, upstream-model.test.ts, trace-model.test.ts): 1462 passed"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/check-diff-disposition.test.ts scripts/floor-invariance.test.ts: 289 passed"
        status: pass
      - kind: unit
        ref: "npx vitest run (20 further files that read the workflow, contract, register or catalog surfaces, install.test.ts included): 2260 passed, 1 skipped"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 07: The upstream contract and Workflow 20 Summary

**`agent-factory/contracts/upstream.md` states the declaration, the `| ID | Status | Path | Superseded by |` manifest, the `upstream:<source>:<ID>@<commit>` ref, and every check and read line and exit code as the code prints them. Workflow 20 `upstream sources` gives roles one procedure: check, route `blob-mismatch` and `UNKNOWN - verify` to `BLOCKED`, read only through `node tools/grugops/upstream.js`, and cite only as `claim` notes. Both are registered with every gate, and every gate and freshness check is green.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-11-25T10:02:44Z
- **Completed:** 2026-11-25T10:30:29Z
- **Tasks:** 2
- **Files modified:** 22 (3 created; generated `.js` included)

## Accomplishments

- **The contract.** Six sections: Declaration, The entry manifest, Refs, Pin check, Reads and Host access. Every line format, reason string and exit rule was copied from the header contract and code of `scripts/runnable-ref/upstream.ts` and from `scripts/upstream-model.ts`. That includes the 44-06 additions: the UTF-8 refusal, the over-ceiling reason that names the size, and `Error: UNKNOWN - verify <source>: <reason>. Nothing was read.`. The examples use invented IDs (`DEC-12`, `DEC-7`).
- **Workflow 20.** It has the eight required sections, plus `## Untrusted upstream text` and `## Commit`. There are 13 numbered steps, each led by an approved verb. Each step names its actor: the Orchestrator for the check and the BLOCKED routing, and the role for reads, citations, refusals and pin escalation. The untrusted-text rule is stated once.
- **Registration.** Each count was read off its gate's own refusal before it moved: `WORKFLOW_COUNT` 19 to 20, `GOVERNED_CORPUS_COUNT` 69 to 71, `TECHNICAL_NAMES_COUNT` 78 to 79, `BANNED_CLAIM_SCAN_COUNT` 161 to 163 and `WORKFLOW_STOP_BULLET_COUNT` 49 to 55. There is also the WF20 register row (`safety_surface: yes`), the regenerated safety-surface exclusions, catalog row 20, the hook manifest and the kit mirror entry.

## Task Commits

1. **Task 1: The upstream contract and Workflow 20** - `1447f402` (feat)
2. **Task 2: Register the new workflow and contract with every gate** - `cd6a1279` (chore)
3. **Deviation: the style-disposition rows the new workflow owes** - `a8960894` (fix)

## Files Created/Modified

- `agent-factory/contracts/upstream.md`: the upstream-sources contract (new)
- `agent-factory/workflows/20-upstream-sources.md`: Workflow 20 (new)
- `docs/audit/29-style-dispositions/44-07.md`: 70 added rows, 11 with a companion cell (new)
- `scripts/kit-model.ts` (+ `.js`), `scripts/kit-model.test.ts`: `WORKFLOW_COUNT` 20, plus the WP-09 lowercase observation gaining `upstream sources`
- `scripts/check-imperative-lexicon.ts` (+ `.js`), `scripts/check-imperative-lexicon.test.ts`: 71 and 79
- `scripts/check-banned-claims.ts` (+ `.js`): 163
- `scripts/checkpoints.ts` (+ `.js`): `WORKFLOW_STOP_BULLET_COUNT` 55, with the re-walk recorded per bullet
- `scripts/check-foundation-guards.test.ts`: Workflow 20 in the kit mirror
- `scripts/audit-prepass.test.ts`: `AUDIT_SET_COUNT` literal 40
- `scripts/trace-instructions.test.ts`: `SCAN_SET_SIZE` 87
- `docs/audit/28-disposition-register.md`, `docs/audit/28-safety-surface-exclusions.md`: the WF20 row and the regenerated exclusions
- `docs/reference/README.md`, `docs/reference/agents/orchestrator.md`: generated by `npm run generate:catalog`
- `hooks/hook-entry.ts` (+ `.js`): generated manifest (the kit-model and checkpoints hashes)

## Decisions Made

- All six stop bullets in Workflow 20 are untagged. Two cover reader errors and exits outside 0 to 2, following the workflow 17 exit-2 precedent. The others are a `read` `UNKNOWN - verify` that blocks the subtask, an absent reader, a file the manifest does not list, and upstream text that asks for an action. For each one, no checkpoint value could lower the stop, and pin moves stay a prose rule. The roster and the site counts are unchanged.
- OpenCode is listed as `UNKNOWN - verify` for reader access next to the four hosts the plan named. No live reader run exists on it either, so leaving it out would imply a verified state that does not exist.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-diff-disposition needed a disposition file for the new workflow**
- **Found during:** Task 2 (the clone tests in `scripts/check-diff-disposition.test.ts`, and the CI gate `node scripts/check-diff-disposition.js`)
- **Issue:** Workflow 20 is a watched, `safety_surface: yes` file. Every new clause needs a row in `docs/audit/29-style-dispositions/`, and the new `## Stop conditions` and `## Commit` clauses are frozen until a row gives a companion cell. The gate reported 70 findings, all in the new file. The research registration walk did not list this gate.
- **Fix:** `docs/audit/29-style-dispositions/44-07.md` holds 70 added rows (empty `before`), in the format of plan 39-06's file for the Designer role. The rows were generated from the gate's own `changedClauses` output and checked equal to it. The 11 frozen rows carry a companion cell.
- **Files modified:** docs/audit/29-style-dispositions/44-07.md
- **Verification:** `node scripts/check-diff-disposition.js` gives 0 findings over 32/32. `scripts/check-diff-disposition.test.ts` and `scripts/floor-invariance.test.ts` pass 289/289 after the commit, because their clones read HEAD.
- **Committed in:** a8960894

**2. [Rule 3 - Blocking] Four pins outside the plan's file list moved only because the kit now has 20 workflows and 4 contracts**
- **Found during:** Task 2, step 7 (the regression list)
- **Issue and fix, each with a dated plan 44-07 line:**
  - `scripts/checkpoints.ts`: `WORKFLOW_STOP_BULLET_COUNT` 49 to 55. The derivation printed "holds 55 bullet(s) against the recorded 49". All six bullets were re-walked and left untagged.
  - `scripts/audit-prepass.test.ts`: the `AUDIT_SET_COUNT` literal 39 to 40. The constant is derived as ROLE_COUNT + WORKFLOW_COUNT + 1.
  - `scripts/trace-instructions.test.ts`: `SCAN_SET_SIZE` 85 to 87. The new workflow and the contract entered, and neither tells an agent to edit the trace by hand.
  - `scripts/kit-model.test.ts`: the WP-09 observation of lowercase workflow display names gains `upstream sources`. That is the D-08 name, in the style of workflows 16 to 18.
- **Committed in:** cd6a1279

**3. [Minor] Generated files the plan did not list**
- `npm run generate:catalog` also rewrote `docs/reference/agents/orchestrator.md`: the Orchestrator's Workflows row gains `upstream sources`, because Workflow 20 names it under Agents involved.
- The `D-24` freeze in `scripts/floor-invariance.test.ts` did not move. The freeze hashes `hook-entry.ts` with the manifest region normalised out, and only that region changed. `scripts/floor-invariance.test.ts` is therefore unchanged.
- The plan's gate chain runs `node scripts/validate-agent-factory.js` bare. The validator refuses to run without `VALIDATE_KIT_ROOT` (C3), so it was run as CI runs it: `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, exit 0.

---

**Total deviations:** 3 (2 blocking, 1 minor)
**Impact on plan:** Each change registers the plan's own two files with a gate that already existed. No kit behavior changed beyond the two new files.

## Issues Encountered

- Two sentences in Workflow 20 first came out at 26 words, against a bound of 25: one stop condition and one done-condition sentence. Each was split.
- Before the Task 2 commit, the clone tests in `check-diff-disposition.test.ts` failed with "resolved 20 of 19". The clones read committed HEAD, where the workflow existed but `WORKFLOW_COUNT` was still 19, so those were half-commit failures. They passed after the commit and the disposition rows.

## Verification

- Gate chain (all exit 0): `check-foundation-guards`, `check:audit-register`, `check:imperative-lexicon` (0 findings over 71/71 and 20/20), `check:banned-claims` (0 findings over 163/163), `check:claim-anchors`, `check-kit-refs`, `check:public-docs`, `check:role-rules`, `VALIDATE_KIT_ROOT=. validate-agent-factory`, `check-diff-disposition`, `check-nul-bytes`, `check-residual-citations`, `check-state-paths`, `check-story-docs`, `state-check.js .`
- Freshness chain (all exit 0): `freshness` (95 `.js`), `catalog`, `adapters`, `skill-twins`, `host-entries`, `guarantees`, `hook-manifest`, `runnable-embeds`, `context`, `traceability`, plus `typecheck`
- Tests: the plan's 13 regression files plus the three plan-verification files gave 1462 passed. `check-diff-disposition` and `floor-invariance` gave 289 passed. Nine neighbouring files gave 1734 passed and 1 skipped. Twenty registration-surface files, `install/install.test.ts` among them, gave 2260 passed and 1 skipped.
- Acceptance greps: `export const WORKFLOW_COUNT = 20;`, `expect(WORKFLOW_COUNT).toBe(20);`, `20-upstream-sources.md` in the register and in the foundation-guards test, `upstream sources` in the catalog, the manifest header in the contract, and `evidence to cite`, `Build-request:`, `BLOCKED` and the contract path in Workflow 20.
- The full suite was not run. It takes over 20 minutes, and the phase-gate full suite runs at the end of plan 44-08.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 44-08 can point Workflow 17's session-start step, the Orchestrator, AGENTS.md and the config reference at `agent-factory/workflows/20-upstream-sources.md` and `agent-factory/contracts/upstream.md`. It starts from a green tree.
- Any further kit text that 44-08 adds to a watched file (Workflow 17, the Orchestrator) owes rows in a `docs/audit/29-style-dispositions/44-08.md` file. Removed or changed clauses need `before` cells, and clauses in `## Stop conditions`, `## Commit` or a role `## Hard limits` need a companion cell.
- A new stop bullet in a workflow moves `WORKFLOW_STOP_BULLET_COUNT` in `scripts/checkpoints.ts`.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*
