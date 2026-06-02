# Phase 2: Shared Contracts - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the **I/O contracts** that Phase-3 roles and Phase-4 workflows reference by name — handoff packet templates, gate checklists, and the memory-bank seed — as **real, copy-paste-usable files** with a **stable universal header**, so later files cite actual filenames and section names rather than placeholders. Concretely it delivers:

- **Handoff templates** (`agent-factory/handoffs/`): the universal header + 11 core templates (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet) and the 5 v2 templates (release-handoff, incident-postmortem [blameless], retro-notes, refinement-notes, sprint-plan). The universal header carries the v2 **Ticket ID** and **Trace updates** fields.
- **Checklists** (`agent-factory/checklists/`): all 10 gate checklists (definition-of-ready, definition-of-done [lean], definition-of-done-enterprise [superset], pr-review, security-nfr, compliance, accessibility, observability-slo, release-readiness, uat) with the lean/enterprise split clearly distinguished, plus a `00-index.md` grouping them.
- **Memory-bank seed** (`memory-bank/`): the minimal skeleton (00-index, 10-project-brief, 20-product, 30-architecture, 40-contributing, 50-decisions/ with ADR convention, 60-progress, 70-runbook, 80-glossary), each file short and single-purpose, stating the working-memory contract.

**This phase writes the I/O contract files — not the roles, workflows, or behavior that consume them.** Role prompts (Phase 3), workflows/cadence/gate (Phase 4), packaging/installers (Phase 5), and validator/brand/dogfood (Phase 6) are out of scope. The runtime-produced memory-bank artifacts (`brownfield-map.md`, `greenfield-plan.md`) are written by roles/workflows later, NOT seeded here.

**Requirements:** HAND-01, HAND-02, CHECK-01, CHECK-02, MEM-01, MEM-02.

</domain>

<decisions>
## Implementation Decisions

### Baseline carried forward from Phase 1 (apply without re-asking)
- **D-00 (LOCKED — copy verbatim, do NOT redesign):** The spec is authoritative for the given contract content. Reproduce exactly, do not reinvent:
  - **§8** — the **universal handoff header** (with the v2 `Ticket ID:` and `## Trace updates` fields) and the **5 v2 templates** verbatim: `release-handoff` (REL-xxxx: Version/Tickets/Changelog/Release notes/Environments path/Feature flags/Migration/Rollback/DR RTO·RPO/Evidence/Approval/Status `READY_TO_RELEASE | BLOCKED | RELEASED`), `incident-postmortem` (blameless: Summary/Impact/Timeline UTC/Detection/Root cause systemic/Mitigation/Rollback/What went well/What to improve/Follow-up tickets), `retro-notes`, `refinement-notes`, `sprint-plan` (mirror of `plans/sprints/SPRINT-xx.md`).
  - **§9** — all **10 checklist bodies** verbatim (the exact bullet lists for DoR, DoD-lean, DoD-enterprise superset, pr-review, security-nfr, compliance, accessibility, observability-slo, release-readiness, uat). The enterprise DoD is literally "All of lean DoD, plus: …".
- **D-03 (Seed clean — no fake data):** Templates ship with real structure/headers and brief format hints, but **zero fake/example rows or example ADRs**. The Phase-6 validator and a fresh installer both start from a true empty plane.
- **D-04 (Shipped-kit identity):** Files under `agent-factory/` and `memory-bank/` are the **user-facing kit TEMPLATE**, generic and project-agnostic. grugops's OWN build state stays in `.planning/`; the two must not be conflated.
- **Voice:** **Clear/professional voice** for all Phase-2 contract files (handoffs, checklists, memory-bank seed) — they are technical I/O contracts and several touch security/compliance/release safety. Grug caveman voice is reserved for the role prompts in Phase 3.

### Handoff template depth (Area 1)
- **D-08 (Pre-fill from §5.A):** Each per-role handoff ships **copy-paste-complete now** = the universal header + that role's spec'd output sections from §5.A. Phase-3 roles then cite real section names instead of inventing them (D-06 logic: content is spec-defined, needs only the frozen paths this phase locks). Section sources:
  - `product-handoff.md` ← §5.A.5 BA/PM output (user value, scope, out-of-scope, acceptance criteria Given/When/Then, dependencies, risks, test notes, security/NFR triggers, size, priority).
  - `system-handoff.md` ← §5.A.6 (actors, use cases, business flows, state transitions, inputs/outputs, validation rules, permissions, data needs, API needs, integration points, error cases, open questions).
  - `architecture-handoff.md` ← §5.A.7 (context, constraints, chosen design, alternatives rejected, module/component map, API contracts, data model, sequence flows, security assumptions, NFR impact → nfr-catalog, migration impact, test strategy, ADRs, open questions).
  - `implementation-handoff.md` ← §5.A.8 (ticket, branch, files changed, behavior changed, tests added, commands run, migration notes, docs updated, risks, remaining work).
  - `qe-handoff.md` ← §5.A.9 (test scope, unit/integration/E2E coverage, manual test cases, regression risks, test data, commands run, flaky risk, coverage vs threshold, result, gaps).
  - `security-nfr-handoff.md` ← §5.A.10 (scope reviewed, threat notes, auth/permission, data/privacy, secret handling, input validation, rate-limit/abuse, performance budget vs NFR catalog, reliability/fallback, logging/monitoring, compliance notes, required fixes, accepted risks, result `PASS | PASS_WITH_RISKS | BLOCKED`).
  - `uat-handoff.md` ← §5.A.11 (UAT goal, entry criteria, test users/roles, test data, business scenarios, expected results, known limitations, rollback plan, signoff checklist with named human role, exit criteria).
- **D-09 (Derived structure for the 3 under-specified files):** `business-handoff`, `ticket-ready-packet`, and `implementation-ready-packet` have NO explicit §5.A output spec. Lock this derivation (universal header + the sections below):
  - `business-handoff.md` = the **business-framing intake** feeding BA/PM: problem, affected users, business value/outcome, constraints, success measure, in-scope / out-of-scope. (Fills the lifecycle "business analysis" stage that precedes BA/PM's product-handoff.)
  - `ticket-ready-packet.md` = the **DoR-satisfying bundle** the Orchestrator hands to dev: ticket ID, problem, scope/out-of-scope, acceptance criteria (Given/When/Then), dependencies, security/NFR triggers, test notes, size, priority — i.e., exactly the fields `definition-of-ready.md` checks. (Cross-reference DoR so the two stay aligned.)
  - `implementation-ready-packet.md` = the **engineer's start bundle**: ticket ID + branch target, relevant ADRs (`50-decisions/`), API/data contracts and system context from the architecture/system handoffs, files likely touched, test strategy, commands to run.

### Memory-bank seed (Area 2)
- **D-10 (Generic template skeleton):** `memory-bank/` ships as a generic **user-facing template** (D-04). Each of the 9 seed files = a clear-voice header + one-line purpose + section stubs showing the shape; **no grugops-specific content** (grugops's own memory stays in `.planning/`). The bootstrap workflow (Phase 4) fills it per-project. Files seeded here: `00-index`, `10-project-brief`, `20-product`, `30-architecture`, `40-contributing`, `60-progress`, `70-runbook`, `80-glossary` (+ `50-decisions/` below). Do NOT seed `brownfield-map.md` / `greenfield-plan.md` — those are role/workflow outputs.
- **D-11 (Working-memory contract in 00-index):** `00-index.md` documents the contract (MEM-02 / SC#5): roles **read the bank on start**; **`60-progress.md` is the running plan-of-record kept current by the daily sweep**; **`50-decisions/` captures ADRs as they are made**; the index maps the bank so an agent/human can orient in one read. Anti-bloat rule (same as AGENTS.md): keep every file small, never a document dump.
- **D-12 (ADR convention via template, no example):** `50-decisions/` ships `.gitkeep` + an `ADR-template.md` documenting the spec's ADR format — **status, context, decision, alternatives, consequences, rollback** (per §5.A.7) — as a copy-target. **No example `ADR-0001`** (D-03 no-fake-data). The numeric `ADR-000X-*.md` slots stay empty; the non-numeric `ADR-template.md` name won't trip the Phase-6 validator's `ADR-000X` pattern.

### Contract-file metadata + tier split (Areas 3 & 4)
- **D-13 (Minimal frontmatter on all contracts):** Every handoff and checklist carries a small YAML frontmatter (2-3 fields) above the spec-verbatim headings — reusing the frontmatter pattern Phase 1 established for tickets. Handoffs: `kind: handoff` + the role/lifecycle stage. Checklists: `kind: checklist` + `tier: lean | enterprise`. Keep it boring — no bloat; the spec's markdown body stays verbatim below the frontmatter. This gives the Phase-6 validator (VAL-01) and Phase-3 roles a stable machine-readable key.
- **D-14 (Tier signal = frontmatter + index):** The lean/enterprise split is signalled two ways: (1) `tier:` in each checklist's frontmatter (machine-readable → the Orchestrator applies lean DoD in lean mode, the enterprise superset in enterprise mode), and (2) a short `checklists/00-index.md` listing all 10 checklists grouped lean vs enterprise and stating the mode-gating rule in one place (human-readable; satisfies CHECK-02 / SC#3 "clearly distinguished"). Tier assignment: **lean** = definition-of-ready, definition-of-done, pr-review-checklist, security-nfr-checklist, uat-checklist; **enterprise** = definition-of-done-enterprise, compliance-checklist, accessibility-checklist, observability-slo-checklist, release-readiness-checklist.

### Claude's Discretion
- Exact field names/order inside the new frontmatter blocks (e.g., `kind`/`for`/`stage`/`tier`/`id`), kept to 2-3 high-signal fields.
- Exact wording of the one-line purpose lines, section stubs, and format hints in the memory-bank skeleton and the `checklists/00-index.md`.
- Whether the universal-handoff template file itself is the canonical header source the per-role handoffs visually inherit, vs. each per-role file repeating the header inline (both acceptable; pick the lower-drift option).
- Exact section ordering within `business-handoff` and the two packets, as long as D-09's content is present and `ticket-ready-packet` stays aligned with `definition-of-ready.md`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract — authoritative for Phase-2 content (reproduce verbatim where noted)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-2-relevant sections:
  - **§8** (Handoff Templates), lines ~784-871 — the **universal header** (incl. v2 `Ticket ID:` + `## Trace updates`) and the **5 v2 templates** verbatim (release-handoff, incident-postmortem, retro-notes, refinement-notes, sprint-plan).
  - **§9** (Checklists), lines ~873-1003 — all **10 checklist bodies** verbatim, the lean-vs-enterprise distinction, and the Orchestrator's "lean DoD in lean mode / enterprise DoD in enterprise mode" rule.
  - **§5.A** (Core agents), lines ~425-503 — the **per-role handoff output sections** (BA/PM→product, System Analyst→system, Architect→architecture, Engineer→implementation, QE→qe, Security/NFR→security-nfr, UAT→uat) that D-08 pulls into each handoff template; §5.A.7 also gives the **ADR format** (status/context/decision/alternatives/consequences/rollback).
  - **§3** (Required Deliverables), lines ~188-251 — the exact `handoffs/`, `checklists/`, and `memory-bank/` file lists to create.
  - **§6.5 / §10 / §11** — referenced by handoffs/checklists for trace + NFR + metrics field names (already frozen in Phase 1; cite, don't redefine).
- `docs/initial/grugops_brand_manual.md` — voice rules: always-lowercase `grugops`; **clear/professional voice** for these technical/safety contract files (grug voice is Phase-3 role prompts only).

### Frozen Phase-1 outputs these contracts must cite by name (do not redefine)
- `plans/board.md` — the 13 columns + WIP format (board moves referenced by handoffs/workflows).
- `plans/traceability.md` — the requirement→…→release matrix columns the universal header's `Trace updates` field links into.
- `plans/nfr-catalog.md` — NFR/SLO targets cited by security-nfr + observability-slo checklists and the architecture handoff.
- `plans/metrics.md` — metric names referenced by retro-notes / release flows.
- `agent-factory/config/factory.config.json` (+ `.md` twin) — `mode` (lean/enterprise) drives checklist tier-gating; `quality`/`nfr`/`compliance_regime` thresholds cited by enterprise checklists.

### Project planning context
- `.planning/ROADMAP.md` — Phase 2 goal + the 5 success criteria.
- `.planning/REQUIREMENTS.md` — HAND-01/02, CHECK-01/02, MEM-01/02 (the 6 Phase-2 requirements) and the v1/v2 split.
- `.planning/PROJECT.md` — Constraints (markdown-only, minimal/anti-bloat, no-fabrication, voice discipline, brand) + Key Decisions table.
- `.planning/phases/01-substrate-config-state-skeleton/01-CONTEXT.md` — the D-00/D-03/D-04/D-05/D-06 precedents this phase extends.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase-1 frozen state files** (`plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md`) and the **config dial** (`agent-factory/config/factory.config.json` + `.md`) — these are the stable filenames/columns/fields Phase-2 contracts cite. No redefinition; reference only.
- **Phase-1 ticket frontmatter pattern** (`status/column/size/priority/epic/feature`) — the precedent D-13 reuses for the new handoff/checklist frontmatter.

### Established Patterns
- **Skeleton-with-no-data** (D-03): real headers/format, zero fake rows. Extends directly to handoff templates, checklists, and the memory-bank seed.
- **Shipped-template vs grugops-own-state separation** (D-04): `agent-factory/` + `memory-bank/` are the user-facing template; `.planning/` is grugops's build state. memory-bank seed must NOT carry grugops's own project content.
- **`00-index.md` orientation file** — used for the board/state plane; reused here for `checklists/00-index.md` and `memory-bank/00-index.md`.

### Integration Points
- `agent-factory/handoffs/` and `agent-factory/checklists/` currently hold only `.gitkeep`; `memory-bank/` holds only `50-decisions/.gitkeep`. Phase 2 populates all three **additively** (never touching `docs/`, `.planning/`, `.claude/`, `CLAUDE.md`).
- These contracts are **consumed** by: Phase-3 roles (each role's "Output (file + format)" cites a handoff template; the Orchestrator applies DoR/DoD by mode), Phase-4 workflows (each lists "Handoffs produced" + "Trace updates"), and the Phase-6 validator (checks every required handoff/checklist file exists and contains its sections). Section names frozen here propagate to all three.

</code_context>

<specifics>
## Specific Ideas

- The user accepted every recommended option, yielding a consistent posture: **maximize Phase-2 completeness where the spec already specifies content** (pre-fill handoffs from §5.A), **keep the shipped template generic** (memory-bank = empty skeleton, grugops's own memory stays in `.planning/`), and **make the contracts machine-readable** (minimal frontmatter + `tier:` + a checklists index) so Phase-3 roles and the Phase-6 validator can key off them mechanically.
- Strongest specific signal: **no drift, no re-deciding.** Because §5.A already fixes the per-role handoff sections, Phase 2 should lock them now so Phase-3 roles inherit real section names rather than inventing parallel ones.

</specifics>

<deferred>
## Deferred Ideas

These belong to other phases — preserved, not actioned here. None are scope-creep from this discussion.

- **Role prompts** that consume these handoffs/checklists (the "Output (file + format)" and DoR/DoD-application behavior) → Phase 3.
- **Workflow files** that produce handoffs and record trace updates / board moves → Phase 4.
- **Runtime memory-bank artifacts** (`brownfield-map.md`, `greenfield-plan.md`) → produced by Phase-3 roles / Phase-4 bootstrap workflows, not seeded here.
- **The Phase-6 validator's exact handoff/checklist section-presence checks** → Phase 6 (VAL-01) reads the frozen section names this phase produces.
- **Final version string + commands/-vs-skills/ form** → Phase 5 (open decisions, unchanged by this phase).

</deferred>

---

*Phase: 2-shared-contracts*
*Context gathered: 2026-06-02*
