# Phase 1: Substrate, Config & State Skeleton - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 **freezes grugops's shared vocabulary** and lays the **empty state plane** that every later file cites by name. Concretely it delivers:

- The repository scaffold per spec §3 (`agent-factory/{roles,workflows,handoffs,checklists,examples,packaging,config}`, `plans/{board,traceability,nfr-catalog,metrics,sprints,releases,epics,features,tickets}`, `memory-bank/*`, `install/`, `.claude-plugin/`) — **additive only**, never deleting/overwriting existing `docs/`, `.planning/`, `.claude/`, or `CLAUDE.md`.
- The config dial: `agent-factory/config/factory.config.json` + its human-readable `factory.config.md` twin.
- The board column vocabulary + WIP format: `plans/board.md`.
- The stable ID scheme (`EPIC/FEAT/<prefix>/ADR/NFR/RISK/REL/INC`) and seeded skeleton state files: `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md`.
- `agent-factory/VERSION` and `agent-factory/README.md`.

**This phase writes structure, names, and a config dial — not behavior.** Role prompts (Phase 3), workflows (Phase 4), handoffs/checklists/memory-bank content (Phase 2), packaging/installers (Phase 5), and validator/brand/dogfood (Phase 6) are out of scope. Once these names are frozen, they never move.

</domain>

<decisions>
## Implementation Decisions

### Baseline: the spec is authoritative for the frozen vocabulary
- **D-00 (LOCKED, copy verbatim — do NOT redesign):** The following are fully specified by `docs/initial/agent_factory_builder_spec_v2.md` and must be reproduced exactly, not reinvented:
  - Directory tree (§3)
  - Full `factory.config.json` field set **and** example values (§15) — `mode/cadence/autonomy/id_prefix/repo_strategy/default_stack/wip_limits/sprint_length_days/sizing/priority_scheme/quality/nfr/compliance_regime/environments/production_requires_human_confirmation/blocked_escalation_days`
  - The 13 board columns + default WIP numbers + `board.md` markdown format + ticket front-matter fields (`status/column/size/priority/epic/feature`) (§6.1)
  - ID schemes + `traceability.md` matrix columns (§10) and `nfr-catalog.md` columns (§11)
  - Sizing map `XS=1,S=2,M=3,L=5,XL=8` (XL must split) + priority `P0–P3` (§6.3)
  - Blocked policy: `blocked-by` + date + escalation past `blocked_escalation_days` (§6.4)
  - The `metrics.md` metric list (§6.5)
  - Zero-config defaults `mode=lean / cadence=kanban / autonomy=pr` (§0)
- The discussion below only resolves choices the spec leaves **open** or wrinkles created by **grugops building itself**.

### Config dial
- **D-01 (Config delivery):** Ship a **populated** `factory.config.json` filled with the lean defaults from §15, alongside the `factory.config.md` twin. The dial is visible and editable. Zero-config (CONFIG-03) still holds because every role falls back to these *same* documented defaults when the file is absent — **the plan must include a check that deleting `factory.config.json` still yields lean/kanban/pr behavior.**
- **D-07 (config.md depth):** `factory.config.md` is a **concise field / allowed-values / default / one-line-meaning table** mirroring spec §15's field-meaning block. Boring, high-signal, easy to keep in sync with the JSON. No per-field example prose.

### Versioning
- **D-02 (Version seed):** Seed `agent-factory/VERSION` **and** `factory.config.json#version` to **`0.1.0`** (new public pre-1.0 tool; matches the REQUIREMENTS lean recommendation). The *final* version string (0.x vs 2.0.0) is a Phase-5 decision per REQUIREMENTS "Open Decisions" — `0.1.0` is the working seed, re-confirmed then. Note: the spec's example JSON shows `2.0.0`; we deliberately diverge to `0.1.0`.

### State-plane skeletons
- **D-03 (Seed depth):** `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` ship with their **real headers/columns + a brief format comment** showing the row shape, but **zero live data rows**. Clean append target; humans still see the format; the Phase-6 validator won't trip over fake tickets and needs no example-row exceptions.
- **D-04 (plans/ identity + default prefix):** `plans/` is the **user-facing kit TEMPLATE** that ships to installers — generic placeholder prefix **`id_prefix = "ABC"`** (the spec's own placeholder), **no grugops tickets seeded**. It is kept **distinct from `.planning/`** (grugops's own GSD build state); the two boards must not be conflated. grugops's own dogfood (Phase 6) exercises a real prefix on a throwaway repo, not on this repo.

### Phase-boundary file scope (how complete is the Phase-1 version of a later-phase-owned file)
- **D-05 (AGENTS.md — DEFERRED):** **Phase 1 does NOT create root `AGENTS.md`.** Its full content (the §17.1 substrate shape, Karpathy's 12 rules, Commands-with-flags) is owned by Phase 3 (AGENTS-01/AGENTS-02), which is literally the "Roles & AGENTS.md Substrate" phase. ⚠️ **Roadmap tension:** Phase-1 Success Criterion #1 lists "root AGENTS.md" inside the §3 scaffold. By this decision that single item is intentionally moved to Phase 3. **The Phase-1 verifier MUST NOT flag a missing root `AGENTS.md` as a failure** — treat it as Phase-3-owned. All other §3 scaffold items remain in Phase 1.
- **D-06 (README — FULL now):** Write `agent-factory/README.md` **completely now** (satisfies STRUCT-02 fully): the 5-tool usage/dispatch table + all copy-paste Orchestrator prompts (bootstrap, refine, plan, sweep, ticket→PR, gate, UAT, release). These prompts are *usage instructions* that only need the **frozen paths** this phase locks, so they can be written before the role/workflow bodies exist. The README's "start here" pointer targets `agent-factory/roles/orchestrator.md` (frozen path) and **notes that the portable AGENTS.md substrate lands in Phase 3** (consistent with D-05).

### Claude's Discretion
- Empty directories use `.gitkeep` per spec §3 (matches the spec verbatim).
- `plans/initial-plan.md` (listed in §3): seed as a minimal placeholder stub, or leave for the bootstrap workflow (Phase 4) — planner's call; it is not in Phase-1's success criteria, so a thin stub is acceptable.
- `board.md` ships showing the **Kanban columns** (default cadence); the scrum overlay lives in `plans/sprints/` and need not be pre-rendered in `board.md`.
- Exact wording/style of the format comments in the skeleton state files; the column layout of the `factory.config.md` table.
- Whether `factory.config.md` and the seed file headers carry the lowercase `grugops` brand voice (clear voice for these technical/config files — grug voice is reserved for role prompts, per the voice-discipline constraint).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract — authoritative for the frozen vocabulary (read these sections verbatim)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-1-relevant sections:
  - **§0** (Versioning and Modes) — zero-config defaults `mode=lean / cadence=kanban / autonomy=pr`
  - **§3** (Required Deliverables / repository structure) — the exact directory tree to scaffold
  - **§6.1** (The board) — 13 columns, default WIP, `board.md` format, ticket front-matter fields
  - **§6.3** (Sizing and priority) — `XS=1..XL=8` (split XL), `P0–P3`
  - **§6.4** (Blocked policy) — `blocked-by` + date + escalation threshold
  - **§6.5** (Metrics) — the `metrics.md` metric list
  - **§10** (Traceability and IDs) — ID schemes + `traceability.md` matrix columns
  - **§11** (NFR Catalog and SLOs) — `nfr-catalog.md` columns
  - **§15** (Configuration) — full `factory.config.json` schema + per-field meanings (the `factory.config.md` twin documents these)
- `docs/initial/grugops_brand_manual.md` — brand + voice rules. Relevant here: always-lowercase `grugops`; the two-voice rule (clear/professional voice for config docs, README prose, and anything technical; grug caveman voice is for role prompts only). Governs human-facing text in `README.md` and `factory.config.md`.

### Project planning context
- `.planning/ROADMAP.md` — Phase 1 goal + the 5 success criteria (note the SC#1 / AGENTS.md tension recorded in D-05).
- `.planning/REQUIREMENTS.md` — the 11 Phase-1 requirements (STRUCT-01/02, CONFIG-01/02/03, BOARD-01/04, TRACE-01/02, NFR-01, METRIC-01) and the **Open Decisions** table (final version string + commands/-vs-skills/ deferred to Phase 5).
- `.planning/PROJECT.md` — Constraints (markdown-only kit; additive/idempotent/reversible installers; no-fabrication; minimal-AGENTS.md; brand) and the Key Decisions table.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **None** — greenfield repository. No application code exists.

### Established Patterns
- The repo currently holds only: `docs/` (the spec + brand manual), `.planning/` (GSD build state), `.claude/`, and `CLAUDE.md`. The kit directories (`agent-factory/`, `plans/`, `memory-bank/`, `install/`, `.claude-plugin/`) do **not** yet exist.

### Integration Points
- Scaffolding is **additive**: create the new kit tree without touching `docs/`, `.planning/`, `.claude/`, or `CLAUDE.md`. This mirrors the installer's own contract (idempotent, additive, never overwrite/delete user content) and STRUCT-01's "without deleting or overwriting existing user content."
- `plans/` (shipped kit template) and `.planning/` (grugops's GSD workflow state) coexist at the repo root and are deliberately separate (D-04).

</code_context>

<specifics>
## Specific Ideas

- The user accepted every recommended option, yielding concrete seed values: `version = 0.1.0`, `id_prefix = "ABC"`, populated `factory.config.json` with the §15 lean defaults, and headers-plus-format-comment (no data rows) for all skeleton state files.
- Strongest specific signal: **keep the seed clean** — no fake/example ticket rows anywhere in the shipped state files, so the validator and a fresh installer both start from a true empty plane.

</specifics>

<deferred>
## Deferred Ideas

These surfaced or are pre-known deferrals — preserved, not actioned this phase. None are scope-creep from this discussion.

- **Final version string (0.x vs 2.0.0)** → Phase 5 (per REQUIREMENTS "Open Decisions"). `0.1.0` is the Phase-1 working seed.
- **`commands/` vs `skills/` command form** → Phase 5 (Open Decision; research already gathered).
- **Root `AGENTS.md` content** (§17.1 shape, Karpathy's 12 rules, Commands-with-flags) → Phase 3 (AGENTS-01/AGENTS-02) — and per D-05, the file itself is created there too.
- **`plans/` data + real `id_prefix`** (actual tickets/board state) → only exercised at Phase 6 dogfood on a throwaway repo, never seeded into grugops's own `plans/`.

</deferred>

---

*Phase: 1-substrate-config-state-skeleton*
*Context gathered: 2026-06-02*
