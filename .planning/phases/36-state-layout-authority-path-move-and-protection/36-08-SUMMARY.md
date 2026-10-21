---
phase: "36"
plan: "08"
subsystem: state-layout
tags: [state-layout, kit-text, roles, workflows, claim-registry, fixtures, fallback-clause]

requires:
  - phase: 36
    provides: "install/state-layout.ts (STATE_ROOT_REL, LEGACY_FALLBACK_CLAUSE) from plan 36-01; the seed under agent-factory/seed/memory-bank/plans/ from 36-02; scripts/state-path-scan.js from 36-03; the board contract's presence-table rows from 36-06"
provides:
  - "Every role, workflow, the board contract, both checklists and agent-factory/README.md name planning state as memory-bank/plans/ (381 + 20 sites)"
  - "agent-factory/roles/orchestrator.md line 8 (the kit-home invariant) names `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE, then LEGACY_FALLBACK_CLAUSE verbatim"
  - "docs/audit/28-claim-registry.md C-28-033 verbatim block matches its moved README anchor"
  - "The 176 role copies under scripts/fixtures/*/agent-factory/roles/ carry the same `## Trace updates` heading change"
affects: [36-09, 36-10, 36-11, 36-13, 36-14]

actuals:
  tokens: 68264
  tasks: 2
  commits: 2
plan_head_before: c3f6d40cb75f07259911287176c4d5da460c286c
plan_head_after: 18cfb315b919933e16de280d4d3523f137dfe7e8

tech-stack:
  added: []
  patterns:
    - "Kit-text substitution is driven by the scan core itself: a scratch script applies spellingPatterns().slash with a `${STATE_ROOT_REL}/` replacement, split around LEGACY_FALLBACK_CLAUSE, then `git diff --word-diff=porcelain` must show no added word without memory-bank/plans/"
    - "The fallback clause on a carrier line is written by a script that imports LEGACY_FALLBACK_CLAUSE from install/state-layout.js, so no copy of it is typed by hand"

key-files:
  created: []
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/contracts/board.md
    - agent-factory/README.md
    - agent-factory/checklists/definition-of-done-enterprise.md
    - agent-factory/checklists/observability-slo-checklist.md
    - docs/audit/28-claim-registry.md
    - "agent-factory/roles/*.md (the other 15 roles)"
    - "agent-factory/workflows/*.md (the other 17 workflows)"
    - "scripts/fixtures/*/agent-factory/roles/*.md (11 trees x 16 roles)"

key-decisions:
  - "agent-factory/writing-profile.md needed no edit: plan 36-02 had already changed its scan-set listing to agent-factory/seed/memory-bank/plans/board.md, and the scan finds no site in it"
  - "Only the C-28-033 fenced verbatim block moved in the claim registry; its mechanism prose (which names the pre-v3 seed path as it stood in 28-05) is a historical record and stays as written (D-09, D-16)"
  - "check-diff-disposition: findings rose from 63 (at c3f6d40c) to 562 after this plan, as the plan predicted; no disposition rows were added"

patterns-established:
  - "A per-carrier fallback-clause edit keeps the line's opening and closing byte for byte and is asserted by `line.includes(LEGACY_FALLBACK_CLAUSE)` against the compiled authority"

requirements-completed: []

coverage:
  - id: D1
    description: "Roles, workflows, the board contract, the checklists and the kit README name planning state only as memory-bank/plans/ paths, and the fixture role copies mirror the heading change"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js agent-factory ':!agent-factory/packaging' 'scripts/fixtures/*/agent-factory/roles/*.md' (PASS, 274 files, exit 0; baseline 381 sites after Task 1, 401 at plan start)"
        status: pass
      - kind: other
        ref: "git diff --word-diff=porcelain c3f6d40c..HEAD -- agent-factory scripts/fixtures | grep -E '^\\+[^+]' | grep -vc 'memory-bank/plans/' prints 0"
        status: pass
      - kind: unit
        ref: "npx vitest run (31 files incl. scripts/validate.test.ts, check-foundation-guards, check-imperative-lexicon, voice-model, kit-model, generate-role-adapters, adapter-byte-baseline, skill-twins-freshness, adapters-freshness, catalog-freshness, generate-guarantees, check-claim-anchors, check-audit-register): 2256 passed, 1 skipped; plus Task 1's 10 files: 1047 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The kit-home Orchestrator invariant line carries LEGACY_FALLBACK_CLAUSE verbatim, and no other role or workflow carries fallback text"
    requirement: LAYOUT-04
    verification:
      - kind: other
        ref: "node --input-type=module -e \"... readFileSync('agent-factory/roles/orchestrator.md','utf8').split('\\n')[7].includes(LEGACY_FALLBACK_CLAUSE)\" prints true"
        status: pass
      - kind: other
        ref: "grep -l 'install --migrate' agent-factory/roles/*.md agent-factory/workflows/*.md prints only agent-factory/roles/orchestrator.md; wc -c orchestrator.md = 7099 (< 7570), security-nfr.md = 5018 (< 5102)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The C-28-033 registry block moved in the same commit as its README anchor; every kit gate passes"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. validate-agent-factory, check-foundation-guards, check-kit-refs, check-claim-anchors, check-public-docs-vocabulary, check-banned-claims, check-imperative-lexicon, check-audit-register, check-nul-bytes (each exit 0); npm run freshness:catalog and freshness:guarantees (exit 0)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 08: Roles, workflows and kit docs name memory-bank/plans/, and the kit-home invariant carries the fallback clause Summary

**401 pre-v3 state-path sites across 17 roles, 19 workflows, the board contract, both checklists, the kit README and 176 fixture role copies now read `memory-bank/plans/…`. The Orchestrator's line 8, the one invariant copy an unmigrated repository still reads after `--update`, now names `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` as STATE and carries `LEGACY_FALLBACK_CLAUSE` verbatim. The C-28-033 claim block moved with its README anchor.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-21T09:10:09Z
- **Completed:** 2026-10-21T09:22:57Z
- **Tasks:** 2 (one tracer, one auto)
- **Files modified:** 217 (17 roles, 19 workflows, 1 contract, 2 checklists, the kit README, the claim registry and 176 fixture role copies)

## Accomplishments

- **Tracer (Task 1).** ba-pm.md (8 sites), Workflow 02 (5) and the board contract (7; 36-06 had already done 5 of the plan's baseline 12) were substituted by a scratch script that applies the scan core's own `spellingPatterns().slash` with a `${STATE_ROOT_REL}/` replacement. The scan over the three files exits 0, the word-diff check prints 0, and the validator, the foundation guards and the kit-reference gate all exit 0. Ten test files reading these files passed (1047 tests).
- **Expansion (Task 2).** The same script over the 213 remaining files with sites: 381 substitutions. Every added word in the word diff carries `memory-bank/plans/` (count of exceptions: 0). The distinct new tokens are the board, traceability, metrics, NFR catalog, ticket, epic, feature, sprint and release paths, and one `memory-bank/plans/initial-plan.md` in Workflow 00.
- **orchestrator.md line 8 (D-14).** Rewritten by a script that checks the opening and closing are unchanged and the old STATE clause is exactly what was expected, then writes:
  `` `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE. `` followed by one space and `LEGACY_FALLBACK_CLAUSE` imported from `install/state-layout.js`.
- **Claim registry (D-16).** Only the two path tokens inside the C-28-033 fenced block changed; its mechanism prose stays as written.
- **No fallback text elsewhere (D-03).** `grep -l 'install --migrate' agent-factory/roles/*.md agent-factory/workflows/*.md` lists only orchestrator.md.

## Task Commits

1. **Task 1 (tracer): ba-pm, Workflow 02 and the board contract name memory-bank/plans/**: `9c354d17` (docs).
   - Tracer gate: interactive, `end-of-phase`, verify is automated only. Re-ran every `<automated>` step on the committed content (all exit 0). Tracer verified end-to-end, expansion continued.
2. **Task 2: roles, workflows and kit docs name memory-bank/plans/; kit-home invariant carries the fallback clause**: `18cfb315` (docs).

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Acceptance evidence

Commit before this plan started: `c3f6d40cb75f07259911287176c4d5da460c286c`.

| Check | Baseline | After |
|-------|----------|-------|
| `node scripts/state-path-scan.js agent-factory/roles/ba-pm.md agent-factory/workflows/02-idea-to-epics.md agent-factory/contracts/board.md` | 8 + 5 + 7 = 20 sites, exit 1 | PASS, exit 0 |
| Task 1 word-diff: added words without `memory-bank/plans/` | n/a | 0 |
| `node scripts/state-path-scan.js agent-factory ':!agent-factory/packaging' 'scripts/fixtures/*/agent-factory/roles/*.md'` | 381 sites in 213 files (after Task 1) | PASS, 274 files, 0 sites |
| `grep -c 'say once: run `install --migrate`' agent-factory/roles/orchestrator.md` | 0 | 1 |
| `grep -l 'install --migrate' agent-factory/roles/*.md agent-factory/workflows/*.md` | none | `agent-factory/roles/orchestrator.md` only |
| `wc -c < agent-factory/roles/orchestrator.md` | 6817 | 7099 (WARN 7165, FAIL 7570) |
| `wc -c < agent-factory/roles/security-nfr.md` | 4934 | 5018 (FAIL 5102) |
| `node scripts/check-diff-disposition.js` findings (known pre-existing red) | 63 findings over 40 elements, exit 1 | 562 findings over 40 elements, exit 1 |

The LEGACY_FALLBACK_CLAUSE check, as the acceptance criterion asks:

```
$ node --input-type=module -e "import {readFileSync} from 'node:fs'; import {LEGACY_FALLBACK_CLAUSE} from './install/state-layout.js'; console.log(readFileSync('agent-factory/roles/orchestrator.md','utf8').split('\n')[7].includes(LEGACY_FALLBACK_CLAUSE))"
true
```

The check-diff-disposition "before" count was taken in a detached scratch worktree at `c3f6d40c` (no branch created), removed afterwards.

Foundation-guard role WARNs after the plan (WARN only, no FAIL; matches research Pitfall 6): frontend-ui 3787, greenfield-mapper 2936, qe-e2e 3671, security-nfr 5018, system-analyst 3025, uat-planner 3379.

## Plan-level verification

1. The scan over `agent-factory ':!agent-factory/packaging' 'scripts/fixtures/*/agent-factory/roles/*.md'` exits 0.
2. Each exited 0: `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, check-foundation-guards, check-kit-refs, check-claim-anchors, check-public-docs-vocabulary, check-banned-claims, check-imperative-lexicon, check-audit-register, check-nul-bytes.
3. `npm run freshness:catalog` and `npm run freshness:guarantees` exit 0.
4. `git branch --show-current` prints `main`.

Targeted tests (no full suite, per the run's rules): Task 1 ran installer-prune, admission-protocol-docs, board-dashboard, board-model, board-oracle, board-read, board-tracer, check-foundation-guards, check-imperative-lexicon and kit-model (10 files, 1047 passed). Task 2 ran 31 files that read role, workflow, README or registry text, or the fixture trees (validate, voice-model, kit-model, generate-role-adapters, adapter-byte-baseline, skill-twins-freshness, adapters-freshness, catalog-freshness, generate-catalog, generate-guarantees, check-claim-anchors, check-audit-register, check-banned-claims, check-kit-refs, check-public-docs-vocabulary, admission-protocol-docs, checkpoints, frontmatter, canonical-frontmatter, model-tiers, audit-model, audit-prepass, check-uat-oracles, generate-safety-surface, state-path-scan, coordinator-resolution-precheck, check-foundation-guards, check-imperative-lexicon, install/closing-claims, install/message-references, install/kit-route): 2256 passed, 1 skipped, 0 failed.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

None - plan executed exactly as written. Two notes on baselines, not deviations:
- The board contract had 7 sites at plan start, not the plan's 12; plan 36-06 had already changed 5.
- agent-factory/writing-profile.md had no site to change (36-02 had done it), so it is not in the diff.

## Issues Encountered

None. `node scripts/check-diff-disposition.js` and `node scripts/check-flip-manifest.js` remain red as recorded before this plan; no disposition rows were added, per the plan.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 36-09:** the examples and install docs.
- **Plans 36-10 and 36-11:** INVARIANT, AGENTS.md (and its four claim blocks C-28-012/015/016/020), the packaging copies and the skills; they must use the same STATE clause wording as orchestrator.md line 8 (with "in this repo" before the full stop).
- **LAYOUT-01 and LAYOUT-04:** stay unchecked until plans 36-14 and 36-13.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: agent-factory/roles/orchestrator.md (line 8 includes LEGACY_FALLBACK_CLAUSE), agent-factory/contracts/board.md (contains `memory-bank/plans/board.md`), docs/audit/28-claim-registry.md (C-28-033 block matches its anchor; check-claim-anchors exit 0)
- FOUND commits: 9c354d17, 18cfb315 (both ancestors of HEAD)
