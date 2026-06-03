---
phase: 03-roles-agents-md-substrate
plan: 08
subsystem: substrate
tags: [agents-md, karpathy-12-rules, substrate, markdown, codex-cap, single-source]

# Dependency graph
requires:
  - phase: 03-roles-agents-md-substrate (Plans 01-07)
    provides: all 16 role files on disk under agent-factory/roles/ that AGENTS.md points at; the Scribe (Plan 02) that owns the 12 rules
  - phase: 01-config-ids-board
    provides: frozen agent-factory/config/factory.config.json, plans/board.md, plans/traceability.md, plans/nfr-catalog.md that AGENTS.md cites
  - phase: 02-shared-contracts
    provides: frozen agent-factory/handoffs/*, agent-factory/checklists/* (DoR/DoD), memory-bank/* that AGENTS.md points at
provides:
  - root AGENTS.md — the minimal §17.1 substrate every host tool reads (the read-order contract)
  - the single-source verbatim copy of Karpathy's 12 rules (4 principles), clear voice
  - the file-scoped Commands slot table, every value UNKNOWN - verify (no fabricated command)
affects: [phase-04-workflows, phase-05-packaging-adapters, phase-06-validation-dogfood]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive: §17.1 skeleton + 12 rules reproduced verbatim; pointers derived from frozen Phase-1/2 paths; invent nothing"
    - "Single-source the 12 rules: live once in AGENTS.md; the 15 non-Scribe roles inherit via a one-line pointer (no restatement)"
    - "All-UNKNOWN Commands: ship UNKNOWN - verify per slot; never fabricate a real command (D-18)"
    - "Voice split: clear voice for Safety rules + 12 rules; a light grug wink only in Mission (D-21)"

key-files:
  created:
    - AGENTS.md
  modified: []

key-decisions:
  - "Folded the 12 finer-grained Commands slots under the 7 §17.1 subheadings (Install/Development/Test/Lint/Typecheck/Build/E2E), all UNKNOWN - verify (D-18) — 13 slots total"
  - "Placed the 12 rules in a new ## Coding rules (the 12) heading adjacent to ## Safety rules (RESEARCH Open Question 1 recommended minimal placement; §17.1 has no dedicated rules heading)"
  - "CLAUDE.md left untouched — AGENTS.md is the shipped generic substrate per D-04/D-05; the two are different artifacts"

patterns-established:
  - "Pattern: §17.1 9-heading substrate shape with README-consistent read order (orchestrator.md -> factory.config.json -> board.md)"
  - "Pattern: single-source 12 rules + one-line pointer (enforced green by check-structure.sh check [g])"

requirements-completed: [AGENTS-01, AGENTS-02]

# Metrics
duration: 4min
completed: 2026-06-03
---

# Phase 3 Plan 08: AGENTS.md Substrate Summary

**Root AGENTS.md authored to the §17.1 shape — README-consistent read order, 13 all-UNKNOWN Commands slots, verbatim clear-voice Safety rules, and the single-source verbatim copy of Karpathy's 4 principles / 12 rules — 5064 bytes, well under the 32 KiB Codex cap; the phase-wide structural suite is now fully GREEN.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-03
- **Completed:** 2026-06-03
- **Tasks:** 2
- **Files modified:** 1 (AGENTS.md created)

## Accomplishments

- Created root `AGENTS.md` with all 9 §17.1 headings (Mission / How to work here / Role·workflow·handoff files / Commands / Delivery / Safety rules / Coding rules (the 12) / Definition of ready·done / Memory bank & plans / When uncertain).
- `## How to work here` echoes the README read order exactly: `agent-factory/roles/orchestrator.md` → `agent-factory/config/factory.config.json` → `plans/board.md`, plus "all work starts with the Orchestrator".
- `## Commands` ships 13 `UNKNOWN - verify` slots folded under the 7 §17.1 subheadings — no fabricated `npm/npx/node/git` command (D-18); grugops's own future validator/installers are not special-cased.
- `## Safety rules` reproduced verbatim in clear voice (secrets / destructive commands / never-merge-protected-branch + never-deploy-prod-without-human-confirmation / deps-refactor-fake-results).
- `## Coding rules (the 12)` carries Karpathy's 4 principles / 12 rules reproduced VERBATIM from `.planning/research/AGENTS-MD-BEST-PRACTICES.md` (diff-verified against source L11-34), in clear voice — the single source; no non-Scribe role restates them.
- Full phase structural suite `check-structure.sh` now GREEN: all 16 roles 9/9 + AGENTS.md §17.1 shape + < 32 KiB + ≥7 UNKNOWN slots + drift guard empty + 12 rules single-sourced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the §17.1 substrate shape + Commands slots + Safety rules (AGENTS-01)** - `b093d91` (feat)
2. **Task 2: Reproduce Karpathy's 12 rules verbatim, single-source, clear voice (AGENTS-02)** - `6e15b7c` (feat)

## Files Created/Modified

- `AGENTS.md` - The root §17.1 substrate: Mission (light grug wink), README-consistent read order, role/workflow/handoff/checklist pointers, all-UNKNOWN file-scoped Commands, Delivery pointers, verbatim clear-voice Safety rules, the verbatim 12 rules, DoR/DoD links (+ enterprise DoD when `mode=enterprise`), memory-bank/plans explainer, and the "Stop. Write the open question…" When-uncertain rule. 5064 bytes.

## Decisions Made

- Folded the 12 finer-grained Commands slots under the 7 §17.1 subheadings (every value `UNKNOWN - verify`) — the slot table is finer-grained than the skeleton's 7 subheadings, so single-file variants nest under their parent (D-18).
- Placed the 12 rules in a new `## Coding rules (the 12)` heading adjacent to `## Safety rules` — RESEARCH Open Question 1 recommended this minimal placement; §17.1 has no dedicated rules heading, and the agents.md standard permits "any headings you like."
- Left `CLAUDE.md` untouched — it is grugops's own dev-instructions file; the new `AGENTS.md` is the shipped generic substrate (D-04/D-05).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The Task 2 verbatim-diff command used a too-broad grep pattern (`^[0-9]+\. \*\*`) that also matched six lines from the source's later "AGENTS.md structure best practice" section (which is also a numbered list), producing a spurious diff. Re-ran the diff scoped to the source's 12-rules block (L11-34) — confirmed a clean VERBATIM MATCH on the 4 principle headings, 12 numbered rules, heuristics, corollary, and Principle-4 prose. No content issue; only the verification command was over-broad. The plan's own `<verify>` block printed `TASK2 PASS`.

## Threat Surface

All threat-model dispositions for this plan were satisfied as planned:
- T-03-Tamper (mitigate): every Commands slot ships `UNKNOWN - verify`; no real command fabricated (manual scan found no `npm/npx/node/git`).
- T-03-EoP (mitigate): "Never merge a protected branch. Never deploy prod without human confirmation." reproduced verbatim, clear voice, not softened.
- T-03-Info (mitigate): the 12 rules and Safety rules are clear voice; only Mission carries a light grug wink.
- T-03-InfoDisc (mitigate): "Do not read or expose secrets." reproduced verbatim.
- T-03-SC (accept): zero package installs this phase; no Package Legitimacy Gate applied.

No new security-relevant surface was introduced beyond the threat model.

## Next Phase Readiness

- The substrate + read-order contract now exist on disk; Phase 4 workflows can sequence the 16 roles' board moves / handoffs against the routing contract the Orchestrator already encodes.
- Two open decisions remain for the START of Phase 5 (unchanged, carried in STATE.md blockers): the version string (2.0.0 vs 0.x) and the command form (`commands/` vs `skills/`).
- AGENTS.md's `UNKNOWN - verify` Commands slots are intentionally empty — they are filled per-project at runtime by the Phase-4 bootstrap workflow / Scribe, never fabricated here (D-18).

---
*Phase: 03-roles-agents-md-substrate*
*Completed: 2026-06-03*
