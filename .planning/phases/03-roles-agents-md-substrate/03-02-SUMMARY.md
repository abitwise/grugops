---
phase: 03-roles-agents-md-substrate
plan: 02
subsystem: roles
tags: [markdown, agents-md, caveman-prompt, role-templates, brownfield, greenfield]

# Dependency graph
requires:
  - phase: 03-01
    provides: "orchestrator.md house style (9-section §5 skeleton, kind: role + tier: core frontmatter, D-17 universal lines) and check-structure.sh acceptance gate"
  - phase: 02
    provides: "frozen handoff/checklist/memory-bank paths the roles cite (factory.config.json, plans/board.md, plans/traceability.md, memory-bank/00-index.md)"
provides:
  - "agents-md-scribe.md — the single OWNER of the 12 coding rules within AGENTS.md (ROLE-01, 2 of 11 core)"
  - "brownfield-mapper.md — read-only repo mapper (ROLE-01, 3 of 11 core)"
  - "greenfield-mapper.md — empty-land shaper (ROLE-01, 4 of 11 core)"
  - "the substrate/mapping role cluster: Scribe owns rules, both mappers defer their runtime outputs to Phase-4"
affects: [03-03, 03-04, 03-05, 03-06, 03-07, 03-08, AGENTS.md-authoring, phase-04-bootstrap-workflows]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-15): verbatim caveman prompt + terse frozen-path connective tissue, invent nothing"
    - "Single-source 12 rules (D-19): Scribe OWNS (no pointer line); the two mappers add a one-line pointer and never restate rule text"
    - "Runtime-output deferral: mappers NAME memory-bank/*.md outputs without seeding the files (Phase-4 produces them)"

key-files:
  created:
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/greenfield-mapper.md
  modified: []

key-decisions:
  - "Scribe carries NO generic 12-rules pointer — as the owner (D-19) it authors the rules in AGENTS.md instead of inheriting them; ownership stated explicitly in its Output section"
  - "Both mappers state 'no board transition' explicitly (D-23): brownfield maps and does not move tickets; greenfield's first tickets land in Backlog but the mapper itself causes no column transition"
  - "Caveman prompts reproduced byte-exact from spec §5.A.2/§5.A.3/§5.A.4 (diff-verified against L391-397 / L405-408 / L416-420)"

patterns-established:
  - "Pattern: role file = kind: role + tier: core frontmatter, 9-section §5 skeleton with parentheticals on Output/Board moves/Trace updates, mirroring 03-01 orchestrator.md"
  - "Pattern: no-fabrication discipline (UNKNOWN - verify) stated in CLEAR voice in Hard limits; grug voice confined to ## Caveman prompt (D-21)"

requirements-completed: [ROLE-01]

# Metrics
duration: 2min
completed: 2026-06-03
---

# Phase 3 Plan 02: Substrate & Mapping Role Cluster Summary

**Authored the substrate/mapping core-role cluster — agents-md-scribe (single owner of the 12 rules in AGENTS.md), brownfield-mapper, and greenfield-mapper — each a byte-exact caveman prompt wrapped in the frozen 9-section §5 skeleton, with both mappers deferring their runtime outputs to Phase-4.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-03T09:17:42Z
- **Completed:** 2026-06-03T09:20:00Z
- **Tasks:** 3
- **Files modified:** 3 (all created)

## Accomplishments
- `agents-md-scribe.md` established as the **single owner** of the 12 coding rules (D-19) — no generic pointer; it authors the rules in `AGENTS.md` and carries the clear-voice `UNKNOWN - verify` no-fabrication discipline (mitigates T-03-Tamper, T-03-Info).
- `brownfield-mapper.md` and `greenfield-mapper.md` authored with verbatim prompts, one-line 12-rules pointers, and explicit "no board transition" board-moves sections (D-23).
- Both mappers **name** their runtime outputs (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`) without seeding them — confirmed absent on disk after the plan (Phase-4 produces them).
- ROLE-01 advanced from 1 to 4 core roles; D-17 universal lines (`config-first` / `plans/board.md` / `plans/traceability.md`) and the drift guard pass across all roles per `check-structure.sh`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author agents-md-scribe.md (owns the 12 rules)** - `1acad60` (feat)
2. **Task 2: Author brownfield-mapper.md** - `8e6d1c1` (feat)
3. **Task 3: Author greenfield-mapper.md** - `d2088e9` (feat)

**Plan metadata:** see final docs commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified
- `agent-factory/roles/agents-md-scribe.md` - Scribe role; owns the 12 rules within AGENTS.md; clear-voice no-fabrication discipline; Output = root AGENTS.md; no board transition.
- `agent-factory/roles/brownfield-mapper.md` - Read-only repo mapper; names `memory-bank/brownfield-map.md` runtime output (not seeded); only-map hard limit; no board transition.
- `agent-factory/roles/greenfield-mapper.md` - Empty-land shaper; names `memory-bank/greenfield-plan.md` runtime output (not seeded); do-not-overbuild + boring-stack hard limit; first tickets land in Backlog, no board transition.

## Decisions Made
- **Scribe owns, does not point:** as the single owner of the 12 rules (D-19), the Scribe omits the generic "Follow the 12 coding rules in AGENTS.md" pointer the other 14 roles carry; it authors them instead, and states this ownership in its `## Output` section. It may echo in grug voice but the canonical clear-voice copy lives in AGENTS.md.
- **Explicit no-transition board moves (D-23):** both mappers state "none" rather than omitting the section — brownfield because it only maps; greenfield because its proposed first tickets land in `Backlog` for the Orchestrator/BA-PM to pull, but the mapper itself moves no column.
- **Runtime-output deferral:** mappers name their Phase-4 outputs without creating the files (verified absent post-plan), preventing a seeded-stub scope-fence violation.

## Deviations from Plan

None - plan executed exactly as written. All three caveman prompts diff-verified byte-exact against the spec; the only verification wrinkle was an off-by-one `sed` range during diffing (the spec's opening ```` ```text ```` fence sits on L405/L415), corrected by diffing the prompt-body lines — the authored prompts themselves were always exact.

## Issues Encountered
None. The phase `check-structure.sh` remains RED overall (other roles + root `AGENTS.md` are Wave 2/3 pending), which is the expected/intended state — every in-scope check passes: D-17 universal lines PASS for all roles, drift guard PASS, single-source 12-rules PASS, and `tier: core` count rose to 4 (orchestrator + these 3).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three more core roles ready; the substrate/mapping cluster is complete.
- Remaining ROLE-01 core roles (ba-pm, system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner) and the ROLE-02 enterprise roles follow in later Wave-2 plans.
- The Scribe is now the established owner for the eventual root `AGENTS.md` authoring (Wave 3) — it owns the 12 rules and references AGENTS.md by filename.
- No blockers introduced.

## Self-Check: PASSED
- FOUND: agent-factory/roles/agents-md-scribe.md
- FOUND: agent-factory/roles/brownfield-mapper.md
- FOUND: agent-factory/roles/greenfield-mapper.md
- FOUND commit: 1acad60 (agents-md-scribe)
- FOUND commit: 8e6d1c1 (brownfield-mapper)
- FOUND commit: d2088e9 (greenfield-mapper)
- VERIFIED absent (correctly not seeded): memory-bank/brownfield-map.md, memory-bank/greenfield-plan.md

---
*Phase: 03-roles-agents-md-substrate*
*Completed: 2026-06-03*
