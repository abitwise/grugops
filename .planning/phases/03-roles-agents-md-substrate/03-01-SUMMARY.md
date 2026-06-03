---
phase: 03-roles-agents-md-substrate
plan: 01
subsystem: roles
tags: [orchestrator, routing, markdown, role-prompt, validation, posix-shell, agents-md]

# Dependency graph
requires:
  - phase: 01-config-board-substrate
    provides: factory.config.json, plans/board.md, plans/traceability.md, definition-of-ready.md
  - phase: 02-shared-contracts
    provides: agent-factory/handoffs/* templates, checklists, memory-bank seed (00-index.md)
provides:
  - "agent-factory/roles/orchestrator.md — the ROLE-03 routing contract the other 15 roles slot into"
  - "check-structure.sh — the Wave-0 structural test harness encoding every VALIDATION.md check (runnable acceptance criteria)"
affects: [03-02-core-roles, 03-03-enterprise-roles, 03-04-agents-md, 04-workflows, 06-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive: caveman prompt verbatim from spec, connective tissue derived from frozen on-disk paths, invent nothing (D-00/D-15)"
    - "Wave-0 runnable acceptance: structural grep/wc/test harness IS the acceptance criteria, goes RED until each file lands"
    - "D-17 universal lines rendered identically across roles (config-first / board / trace)"
    - "Name-don't-inline: Orchestrator names Phase-4 workflow files 00-..13- without sequencing their steps (D-20)"

key-files:
  created:
    - agent-factory/roles/orchestrator.md
    - .planning/phases/03-roles-agents-md-substrate/check-structure.sh
  modified: []

key-decisions:
  - "check-structure.sh encodes the full VALIDATION.md suite (checks a-g) and ships RED — it is the phase's running acceptance gate, green as Waves 2-3 land"
  - "Orchestrator caveman prompt is byte-exact verbatim from spec L332-342 (diff-verified); hard limit reproduced verbatim in clear voice (T-03-EoP / D-21)"
  - "Workflow references use the named-not-inlined form (D-20); numbers locked to agent-factory/README.md to prevent drift"
  - "grep-gate hygiene baked into the harness: count gates filter comment/header lines so prose cannot self-invalidate a count"

patterns-established:
  - "Role file = kind: role + tier: core|enterprise frontmatter + 9-section §5 skeleton (mirrors universal-handoff.md shape)"
  - "Single-source 12 rules: every non-Scribe role carries one pointer line to AGENTS.md, never restates rule text (D-19)"
  - "Harness self-documents its UNKNOWN - verify only in a comment; never fabricates a real npm/npx/node command (D-18)"

requirements-completed: [ROLE-01, ROLE-03]

# Metrics
duration: 2min
completed: 2026-06-03
---

# Phase 03 Plan 01: Orchestrator Routing Contract + Wave-0 Test Harness Summary

**The ROLE-03 Orchestrator routing contract (13-arrow matrix, 15-item classification, WIP/DoR gate, XL-split, 10-section decision output, verbatim clear-voice hard limit) plus a runnable POSIX structural test harness that encodes every phase acceptance check.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-03T09:11:49Z
- **Completed:** 2026-06-03T09:14:00Z (approx)
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- Shipped `check-structure.sh` — the Wave-0 structural/verbatim/size/no-fabrication/drift harness covering all 16 future role files, AGENTS.md §17.1 shape + 32 KiB cap + UNKNOWN-verify slots, the `plans/*-handoff` drift guard, and the single-source 12-rules check. Runs from repo root, exits RED now (23 fails — authored files absent), green as later waves land.
- Authored `agent-factory/roles/orchestrator.md` — the routing contract the other 15 roles slot into: byte-exact caveman prompt, full 13-arrow routing matrix, 15-item request-type classification, WIP-limit + Definition-of-Ready gate, `SPLIT_REQUIRED` XL-split, the inline `# Orchestrator Decision` 10-section output, and the verbatim clear-voice hard limit.
- The orchestrator section of the harness (check [d]) now fully PASSES — the routing contract is wired and proven against its own acceptance gate.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave-0 structural test harness (check-structure.sh)** - `8e8c979` (test)
2. **Task 2: orchestrator.md — the routing contract (ROLE-03)** - `f39a944` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` - POSIX `sh`/`set -eu` harness encoding the full VALIDATION.md Per-Task Verification Map (checks a-g); executable; the runnable acceptance criteria for the phase.
- `agent-factory/roles/orchestrator.md` - The ROLE-03 routing contract: 9-section §5 skeleton, verbatim caveman prompt, routing matrix, classification list, WIP/DoR gate, XL-split, 10-section decision output naming (not inlining) the Phase-4 workflows, verbatim clear-voice hard limit.

## Decisions Made
- None beyond the plan — executed exactly as specified. The discretionary choices were resolved per the plan's guidance: harness count gates filter comment lines (grep-gate hygiene), the harness's only `UNKNOWN - verify` literal lives in a documenting comment (D-18), and the orchestrator's 12-rules pointer wording follows the RESEARCH recommendation ("Follow the 12 coding rules in `AGENTS.md`.").

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Both files passed every automated acceptance check on first authoring:
- Harness: 25 distinct token hits (≥ 8 required), exits RED with 23 fails (expected, files absent), structural checks (f)/(g) correctly pass when no files exist to violate them.
- Orchestrator: 9/9 §5 headings, all 15 classification tokens, all 13 routing arrows, 10 decision sections in order, byte-exact caveman prompt (diff clean vs spec L332-342), verbatim clear-voice hard limit, single 12-rules pointer with zero restatement, all 5 cited frozen paths exist on disk, drift guard clean, no dispatch/spawn detail leaked (D-20 scope fence held).

## Threat Surface Notes
- T-03-EoP (Elevation of Privilege) mitigated: the human-gate hard limit ("Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason.") is reproduced verbatim in clear voice — not softened, not paraphrased, not in grug voice.
- T-03-Tamper mitigated: the harness scans for fabricated commands and the `plans/*-handoff` drift guard; the Orchestrator names workflow files (no fabricated step bodies); no real command invented (D-18).
- T-03-Info mitigated: grug voice confined to the `## Caveman prompt` block; the hard-limit and DoR-gate lines are clear voice (D-21).
- No NEW security surface introduced beyond the plan's threat model — this is additive markdown authoring touching no runtime state, secrets, endpoints, or schema.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The routing contract exists FIRST per build-order (D-20) — the 10 remaining core roles and 5 enterprise roles (Waves 2-3) now have the contract they slot into.
- The structural harness is in place and will turn progressively green as each subsequent role file and the root `AGENTS.md` land; before `/gsd-verify-work` the full suite should be green.
- No blockers. The two phase-5 open decisions (version string, commands/-vs-skills/ form) remain untouched and out of scope here.

---
*Phase: 03-roles-agents-md-substrate*
*Completed: 2026-06-03*
