# Phase 3: Roles & AGENTS.md Substrate - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 writes **the program** — all 16 role prompts to the fixed 9-section skeleton (Orchestrator **first**, defining the routing contract the other 15 slot into) — plus the **minimal root `AGENTS.md`** substrate that points at them. After this phase, the agent set and its read-order contract exist on disk before any Phase-4 workflow sequences them. Concretely it delivers:

- **11 core role prompts** (`agent-factory/roles/`): orchestrator, agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm, system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner — each to the §5 skeleton (One job / Caveman prompt / Reads / Activates when / Responsibilities / Output (file + format) / Board moves / Trace updates / Hard limits), in grug/caveman voice, each reading config first, moving the board on column change, and appending to traceability. **(ROLE-01)**
- **5 enterprise-pack role prompts** (`agent-factory/roles/`): release-manager, compliance-officer, incident-responder, factory-coach, installer — same skeleton + voice, activating only when `mode=enterprise` or their trigger fires. **(ROLE-02)**
- **The Orchestrator** carries the full routing matrix + request-type classification, enforces WIP limits and Definition of Ready before pulling work, splits XL work (`SPLIT_REQUIRED`), and holds the hard limit (never merge a protected branch, never deploy prod). **(ROLE-03)**
- **Root `AGENTS.md`** (repo root, created here per Phase-1 D-05): the §17.1 substrate shape, minimal/high-signal, under Codex's 32 KiB cap, Commands section with real-commands-with-flags preferring file-scoped variants and `UNKNOWN - verify` for unknowns. **(AGENTS-01)**
- **Karpathy's 12 coding-agent rules** (4 principles) embedded in `AGENTS.md` (and owned by the AGENTS.md Scribe role) in clear voice, as the default behavioral guardrails. **(AGENTS-02)**

**This phase writes role behavior and the substrate that points at it — not the workflows that sequence the roles (Phase 4), not the per-tool adapters / Claude wrappers / install scripts / safety hook (Phase 5), not the validator / brand / dogfood (Phase 6).** Role files state the column transitions *they* cause and the handoffs *they* emit; **workflows (Phase 4) sequence those moves** — no workflow step bodies are inlined into roles here.

**Requirements:** ROLE-01, ROLE-02, ROLE-03, AGENTS-01, AGENTS-02.

</domain>

<decisions>
## Implementation Decisions

### Baseline carried forward (apply without re-asking)
- **D-00 (LOCKED — copy verbatim, do NOT redesign):** The spec is authoritative for content it already specifies. Reproduce exactly, do not reinvent:
  - **§5 skeleton** — the 9 section headings, in order, for every role.
  - **§5.A.1–11 / §5.B.1–5 caveman prompts** — each role's `You are <name>. You do …` block is reproduced **verbatim** as that role's `## Caveman prompt`; likewise the Orchestrator's routing matrix, responsibilities list, `Orchestrator Decision` output sections, and hard limits, and each role's `Output (file + format)` line and activation triggers, are spec-given.
  - **§17.1 AGENTS.md shape** — the required markdown skeleton (Mission / How to work here / Role·workflow·handoff files / Commands / Delivery / Safety rules / DoR·DoD / Memory bank & plans / When uncertain).
  - **Karpathy's 12 rules** — reproduced verbatim from `.planning/research/AGENTS-MD-BEST-PRACTICES.md` (4 principles → 12 rules), clear voice.
- **D-04 (Shipped-kit identity):** `agent-factory/roles/*` and the root `AGENTS.md` are the **user-facing kit TEMPLATE** — generic, project-agnostic. grugops's OWN build state stays in `.planning/`; the two must not be conflated.
- **D-05 (root AGENTS.md is Phase-3-owned):** Phase 1 deliberately deferred the root `AGENTS.md`; this phase creates it. The Phase-1/2 verifiers were told not to flag it missing — Phase 3 fulfils it.
- **D-13 (Minimal frontmatter precedent):** Phase 2 put small YAML frontmatter (`kind:` + tier) on every handoff/checklist. Phase 3 extends the same pattern to roles (see D-16).
- **Phase-2 Key Decision (duplicate headers):** the universal-header `## Scope` / `## Risks` are **authoritative**; the duplicate §5.A body sections in `business-handoff.md` / `implementation-handoff.md` are tolerated. Role authors cite the universal-header sections when referencing those handoffs.
- **Voice (brand + D-00):** grug/caveman voice in the role prompts; **clear/professional voice** for the Karpathy rules, safety rules, and any security/compliance/money text (see D-21).

### Role authoring depth (Area A)
- **D-15 (Lean-derived bodies):** For all 16 roles, reproduce the spec's caveman prompt **verbatim** as `## Caveman prompt`; **derive the other 8 skeleton sections tersely** from the spec + the frozen Phase-1/2 contracts, **inventing nothing**. Each role stays scannable in roughly one screen. `Reads` / `Output` / `Board moves` / `Trace updates` cite **real, frozen filenames and section names** (Phase-1 `plans/*`, Phase-2 `agent-factory/handoffs/*` + `checklists/*` + `memory-bank/*`) — no parallel/invented names. Honors the minimal-AGENTS constraint and Karpathy rules 5–7 (only requested features, no single-use abstraction, no unrequested flexibility). This is the Phase-2 D-08 logic applied to roles: content is spec-defined, so we only need the frozen paths.
- **D-16 (Role frontmatter):** Each role file carries minimal frontmatter — `kind: role` + `tier: core | enterprise` (parallel to D-13). Gives the Phase-6 validator (VAL-01 section-presence checks) and the Phase-5 standalone/plugin wrappers a stable machine-readable key. Exact field set/order is Claude's discretion, kept to 2–3 high-signal fields. `tier: core` for the 11; `tier: enterprise` for the 5.
- **D-17 (Universal v2 lines as a consistent standard):** The three v2 additions every core role gets — **read `agent-factory/config/factory.config.json` first**, **move `plans/board.md` when work changes column**, **append a row/links to `plans/traceability.md`** — are rendered the **same way across all 16 roles** (in `Reads` / `Board moves` / `Trace updates` respectively), not per-role bespoke wording. Enterprise roles follow the same standard.
- **D-23 (Board-moves granularity):** Each role states the **column transitions it causes** at role granularity (e.g., Engineer: `In Progress → In Review`); Phase-4 workflows sequence the full path. No workflow step sequences are inlined into role files.

### Root AGENTS.md (Area B)
- **D-18 (Generic §17.1 template + UNKNOWN command slots):** The root `AGENTS.md` is the **shipped, generic substrate** per §17.1 — it describes any repo running the factory (true of grugops's own repo too). Its **Commands** section ships as the **file-scoped slot table** from the research (install / dev / build / test-all / test-single-file / lint-all / lint-single+autofix / format-single / typecheck-single / e2e / docs / clean), **with flags**, preferring single-file variants, with every value `UNKNOWN - verify`. The **bootstrap workflow (Phase 4) / AGENTS.md Scribe fills real commands per project** — they are never fabricated here. Stays under the 32 KiB Codex cap; pushes detail into the files it points to. (grugops's OWN real commands — the Phase-6 validator, the Phase-5 installers — do not exist yet and are intentionally NOT special-cased; they remain `UNKNOWN - verify` slots like any installed project's.)
- **D-21 (AGENTS.md voice split):** `AGENTS.md` is the **substrate, not a role prompt** → **clear voice** for Mission, Safety rules, the 12 Karpathy rules, and the Commands/Delivery/DoR·DoD pointers. A light grug wink is permitted in non-safety framing prose (e.g., Mission), but **never** in the safety rules, the 12 rules, or anything a reader must act on precisely.

### Karpathy 12 rules placement (Area C)
- **D-19 (Single-source — once in AGENTS.md, roles inherit):** The 12 rules (4 principles) live **verbatim, once, in `AGENTS.md`** (clear voice). The **AGENTS.md Scribe role owns and maintains them** — that is literally its job per §5.A.2 (it may echo them in grug voice in its own body). The other 15 roles **inherit via `AGENTS.md`** with a short pointer; they do **not** restate the rules. Honors the single-source constraint ("role text lives once; avoid drift").

### Orchestrator ↔ Phase-4 boundary (Area D)
- **D-20 (Encode the contract now; name workflows, don't inline them):** The Orchestrator encodes — verbatim/derived from §5.A.1 — the **routing matrix**, the **request-type classification list** (greenfield-bootstrap | brownfield-bootstrap | idea-to-epics | epic-to-tickets | ticket-to-pr | quality-gate | uat | refinement | sprint-planning | daily-sweep | sprint-review | release | incident | install), the **WIP-limit + Definition-of-Ready gate** before pulling work, **XL-split (`SPLIT_REQUIRED`)**, the **`# Orchestrator Decision`** output format (Request type / Mode·Cadence·Autonomy / Activated agents / Why / Required inputs / Workflow / Board moves / Expected handoffs / Stop conditions / Next action), and the **hard limits**. It **references the Phase-4 workflow files by name** (e.g. `00-bootstrap-greenfield`, `04-ticket-to-pr`, `05-pr-quality-gate`) **without inlining their steps** — Phase 4 owns step sequences. The Orchestrator role text stays **dispatch-neutral**: the spawn-vs-sequential dispatch difference (Claude subagents can't nest → Orchestrator runs as main thread; portable tools load roles in sequence) is a **Phase-5 packaging** concern, not role content. "Only the dispatch differs, never the content."

### Authoring / build order (dependency, not scope)
- Orchestrator first (defines the routing contract) → 11 core roles → 5 enterprise roles → **root `AGENTS.md` last** (it points at all of them; the Scribe owns the 12 rules). This is a dependency note; the Phase-planner decides the actual wave structure.

### Claude's Discretion
- Exact frontmatter field names/order within D-16's 2–3-field block (e.g. whether to add `id` or `activates`).
- Exact wording of the derived `Reads` / `Responsibilities` / `Board moves` / `Trace updates` bullets, as long as they cite frozen names and invent nothing (D-15).
- Whether each role opens its `Reads` with a shared one-line preamble (config → board → memory-bank-on-start → role inputs) or states reads inline — pick the lower-drift option.
- Exact one-line wording the 15 non-Scribe roles use to point at `AGENTS.md` for the 12 rules.
- Exact slot labels / ordering in the `AGENTS.md` Commands table (the research table is a guide, not a mandate), and whether the Mission line carries a grug wink (D-21 permits it).
- How the enterprise roles phrase `mode=enterprise OR <trigger>` (see D-22), as long as the spec trigger is preserved.
- **D-22 (Enterprise `Activates when`):** each enterprise role states `mode=enterprise` **OR** its §5.B trigger — Release Manager: a release request; Compliance Officer: `compliance_regime` set or personal/financial/health/payment data present; Incident Responder: a production incident or failing SLO; Factory Coach: end of sprint or on-demand; Installer: an install/adapter request. Derived verbatim from §5.B; wording is discretionary.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract — authoritative for Phase-3 content (reproduce verbatim where noted)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-3-relevant sections:
  - **§5 (Agent List), lines ~305–323** — the **9-section role skeleton** every role file follows, and the two-tier (core always-on / enterprise trigger-gated) rule.
  - **§5.A (Core agents), lines ~325–503** — the **verbatim caveman prompt + Output line + triggers** for each of the 11 core roles, including **§5.A.1 Orchestrator (lines ~329–386)** with the routing matrix, responsibilities, `Orchestrator Decision` output sections, and hard limits; and **§5.A.2 AGENTS.md Scribe (lines ~388–400)** — the role that owns `AGENTS.md` and the "removal as much as authoring / no fake commands / `UNKNOWN - verify`" rule.
  - **§5.B (Enterprise-pack agents), lines ~504–566** — the **verbatim prompts + triggers + outputs** for release-manager, compliance-officer, incident-responder, factory-coach, installer.
  - **§17.1 (Root AGENTS.md), lines ~1447–1496** — the **required AGENTS.md markdown shape** reproduced as the substrate skeleton.
  - **§13 (Security, Privacy, and Compliance), lines ~1092+** — the compliance regime detail the Security/NFR and Compliance Officer roles reference (`§13` is named directly in those role bodies).
  - **§6 / §6.3 / §6.4** — board columns, sizing (XL must split), Blocked policy that the Orchestrator's WIP/DoR gate and XL-split logic act on (frozen in Phase 1; cite, don't redefine).
- `.planning/research/AGENTS-MD-BEST-PRACTICES.md` — **MANDATORY for AGENTS-02.** Karpathy's 12 rules (4 principles, verbatim), the agents.md 6-area structure, and the **file-scoped Commands slot table** D-18 ships. This is the captured source so the executor does not re-fetch.
- `docs/initial/grugops_brand_manual.md` — voice rules: always-lowercase `grugops`; grug/caveman voice for role prompts; **clear voice** for the 12 rules, safety, security/compliance (governs D-21).

### Frozen Phase-1 outputs the roles must cite by name (do NOT redefine)
- `agent-factory/config/factory.config.json` (+ `factory.config.md` twin) — `mode` (lean/enterprise), `cadence`, `autonomy` (diff/branch/pr), `wip_limits`, `quality`, `nfr`, `compliance_regime` — the config every role reads first (D-17), and the gate the enterprise roles activate on (D-22).
- `plans/board.md` — the 13 columns + WIP format every role's `Board moves` section transitions between (D-23).
- `plans/traceability.md` — the requirement→…→release matrix columns every role's `Trace updates` section appends to (D-17).
- `plans/nfr-catalog.md` — seeded by the Architect, checked by Security/NFR, evidence attached by the Release Manager.
- `plans/metrics.md` — the metric names the Factory Coach reads (§5.B.4).

### Frozen Phase-2 contracts the roles emit / apply (the real `Output` + DoR/DoD targets)
- `agent-factory/handoffs/` — each role's `Output (file + format)` names one of these by filename: `product-handoff.md` (BA/PM), `system-handoff.md` (System Analyst), `architecture-handoff.md` (Architect), `implementation-handoff.md` (Engineer), `qe-handoff.md` (QE), `security-nfr-handoff.md` (Security/NFR + Compliance Officer appends), `uat-handoff.md` (UAT), `release-handoff.md` (Release Manager), `incident-postmortem.md` (Incident Responder), `retro-notes.md` (Factory Coach), `business-handoff.md`, `ticket-ready-packet.md`, `implementation-ready-packet.md`, `refinement-notes.md`, `sprint-plan.md`, and the `universal-handoff.md` header all inherit.
- `agent-factory/checklists/` (+ `00-index.md`) — the DoR/DoD the Orchestrator applies by mode: `definition-of-ready.md`, `definition-of-done.md` (lean), `definition-of-done-enterprise.md` (superset), `pr-review-checklist.md`, `security-nfr-checklist.md`, `compliance-checklist.md` (Compliance Officer fills per ticket), `accessibility-checklist.md`, `observability-slo-checklist.md`, `release-readiness-checklist.md`, `uat-checklist.md`. Tier-gating rule (`tier:` frontmatter + index) is frozen by Phase-2 D-14.
- `memory-bank/` — the working-memory contract roles read on start: `00-index.md` (read-on-start; `60-progress.md` = plan-of-record kept by daily sweep; `50-decisions/` = ADRs), `50-decisions/ADR-template.md` (the Architect's ADR format target), `brownfield-map.md` / `greenfield-plan.md` are the Mapper roles' **outputs** (not yet seeded — produced at runtime).
- `agent-factory/README.md` — already written in Phase 1 (D-06): its "start here → `orchestrator.md`" pointer and the copy-paste Orchestrator prompts (bootstrap/refine/plan/sweep/ticket→PR/gate/UAT/release) **must stay consistent** with the Orchestrator role and routing this phase writes.

### Project planning context
- `.planning/ROADMAP.md` — Phase 3 goal + the 5 success criteria.
- `.planning/REQUIREMENTS.md` — ROLE-01/02/03, AGENTS-01/02 (the 5 Phase-3 requirements; AGENTS-01/02 are `[research]`-flagged, source captured in the best-practices file above).
- `.planning/PROJECT.md` — Constraints (single-source, voice discipline, minimal-AGENTS, no-fabrication, brand, safety-hard) + Key Decisions table (incl. the Phase-2 duplicate-header decision Phase-3 role authors must honor).
- `.planning/phases/01-substrate-config-state-skeleton/01-CONTEXT.md` — D-00/D-04/D-05 precedents this phase extends/fulfils.
- `.planning/phases/02-shared-contracts/02-CONTEXT.md` — D-08 (pre-fill-from-spec logic), D-13/D-14 (frontmatter + tier), and the frozen handoff/checklist section names roles cite.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Spec verbatim prompts (§5.A/§5.B):** every role's caveman prompt, the Orchestrator routing matrix, and the §17.1 AGENTS.md skeleton are already written in the spec — D-15 reproduces, never authors from scratch.
- **`.planning/research/AGENTS-MD-BEST-PRACTICES.md`:** the 12 Karpathy rules and the file-scoped Commands table are pre-captured — AGENTS.md is assembled from this, not re-researched.
- **Frozen Phase-1/2 files** (`plans/*`, `agent-factory/config/*`, `agent-factory/handoffs/*`, `agent-factory/checklists/*`, `memory-bank/*`): the stable filenames + section names + frontmatter pattern roles cite. Reference only; never redefine.

### Established Patterns
- **Reproduce-from-spec, derive-the-rest (D-08 → D-15):** lock spec-given content verbatim; derive the thin connective sections from frozen paths; invent nothing.
- **Minimal frontmatter (D-13 → D-16):** `kind:` + tier on every shipped file; reused here as `kind: role` + `tier`.
- **Shipped-template vs grugops-own-state (D-04):** `agent-factory/roles/*` and root `AGENTS.md` are generic templates; grugops's own state stays in `.planning/`. AGENTS.md commands ship `UNKNOWN - verify`, not grugops's own.
- **Two-voice discipline:** grug voice in role prompts; clear voice in the 12 rules / safety / compliance (D-21).
- **`00-index` / read-on-start orientation (Phase 2 MEM contract):** roles' `Reads` sections wire to `memory-bank/00-index.md` on start.

### Integration Points
- `agent-factory/roles/` currently holds only `.gitkeep`; root `AGENTS.md` does **not** yet exist (Phase-3-owned per D-05). Phase 3 populates both **additively** — never touching `docs/`, `.planning/`, `.claude/`, `CLAUDE.md`, or the frozen Phase-1/2 files.
- These roles + AGENTS.md are **consumed by:** Phase-4 workflows (sequence the roles' board moves + handoffs + trace updates), Phase-5 packaging (thin per-tool wrappers point at `agent-factory/roles/*.md`; the Orchestrator is the spawner where dispatch needs it), and the Phase-6 validator (checks every required role file exists and contains its 9 sections; checks `AGENTS.md` shape + 32 KiB cap). Section names and the routing matrix frozen here propagate to all three.

</code_context>

<specifics>
## Specific Ideas

- The user accepted every recommended option (consistent with Phases 1–2), yielding a clear posture: **maximum fidelity to the spec, minimum invention.** Reproduce what the spec/brand/research already fix (caveman prompts, routing matrix, AGENTS.md shape, the 12 rules); derive only the thin connective tissue from frozen paths; keep every file lean and single-source.
- Strongest specific signal: **single-source and no-drift.** The 12 rules live once (AGENTS.md), the Orchestrator names workflows rather than inlining them, roles cite frozen Phase-1/2 names rather than inventing parallel ones, and the role text stays dispatch-neutral so Phase-5 packaging is the only place dispatch differs.

</specifics>

<deferred>
## Deferred Ideas

These belong to other phases — preserved, not actioned here. None are scope-creep from this discussion.

- **Workflow files** that sequence the roles' board moves / handoffs / trace updates, and the bounded quality-gate backpressure loop → Phase 4 (FLOW-01..05, GATE-01, BOARD-02/03, SAFE-01).
- **Dispatch mechanics** (Claude subagent spawn vs portable sequential role-load; the Orchestrator-as-main-thread `settings.json agent:`), thin per-tool wrappers, and the mechanical prod-deploy hook → Phase 5 (PKG/CLAUDE/INSTALL/SAFE-02). The role text stays dispatch-neutral by design (D-20).
- **Filling real commands** into AGENTS.md's `UNKNOWN - verify` slots → done per-project by the Phase-4 bootstrap workflow / the Scribe at runtime, never fabricated here (D-18).
- **Runtime role outputs** (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`) → produced when the Mapper roles run under Phase-4 bootstrap, not seeded in Phase 3.
- **The Phase-6 validator's exact role/AGENTS.md section-presence checks** → Phase 6 (VAL-01) reads the 9-section skeleton + AGENTS.md shape frozen here.
- **Final version string + commands/-vs-skills/ form** → Phase 5 open decisions, unchanged by this phase.

</deferred>

---

*Phase: 3-roles-agents-md-substrate*
*Context gathered: 2026-06-03*
