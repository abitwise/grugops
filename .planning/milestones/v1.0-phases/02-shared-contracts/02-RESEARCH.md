# Phase 2: Shared Contracts - Research

**Researched:** 2026-06-02
**Domain:** Markdown content-authoring of agent-handoff I/O contracts, gate checklists, and a memory-bank seed (no code, no runtime)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-00 (LOCKED — copy verbatim, do NOT redesign):** The spec is authoritative for the given contract content. Reproduce exactly, do not reinvent:
  - **§8** — the **universal handoff header** (with the v2 `Ticket ID:` and `## Trace updates` fields) and the **5 v2 templates** verbatim: `release-handoff` (REL-xxxx: Version/Tickets/Changelog/Release notes/Environments path/Feature flags/Migration/Rollback/DR RTO·RPO/Evidence/Approval/Status `READY_TO_RELEASE | BLOCKED | RELEASED`), `incident-postmortem` (blameless: Summary/Impact/Timeline UTC/Detection/Root cause systemic/Mitigation/Rollback/What went well/What to improve/Follow-up tickets), `retro-notes`, `refinement-notes`, `sprint-plan` (mirror of `plans/sprints/SPRINT-xx.md`).
  - **§9** — all **10 checklist bodies** verbatim (the exact bullet lists for DoR, DoD-lean, DoD-enterprise superset, pr-review, security-nfr, compliance, accessibility, observability-slo, release-readiness, uat). The enterprise DoD is literally "All of lean DoD, plus: …".
- **D-03 (Seed clean — no fake data):** Templates ship with real structure/headers and brief format hints, but **zero fake/example rows or example ADRs**. The Phase-6 validator and a fresh installer both start from a true empty plane.
- **D-04 (Shipped-kit identity):** Files under `agent-factory/` and `memory-bank/` are the **user-facing kit TEMPLATE**, generic and project-agnostic. grugops's OWN build state stays in `.planning/`; the two must not be conflated.
- **D-08 (Pre-fill from §5.A):** Each per-role handoff ships **copy-paste-complete now** = the universal header + that role's spec'd output sections from §5.A. Section sources (see "Per-Role Handoff Section Map" below for exact lists):
  - `product-handoff.md` ← §5.A.5 BA/PM output
  - `system-handoff.md` ← §5.A.6
  - `architecture-handoff.md` ← §5.A.7
  - `implementation-handoff.md` ← §5.A.8
  - `qe-handoff.md` ← §5.A.9
  - `security-nfr-handoff.md` ← §5.A.10
  - `uat-handoff.md` ← §5.A.11
- **D-09 (Derived structure for the 3 under-specified files):** `business-handoff`, `ticket-ready-packet`, `implementation-ready-packet` have NO explicit §5.A output spec. Lock the derivation (universal header + the sections in D-09):
  - `business-handoff.md` = business-framing intake (problem, affected users, business value/outcome, constraints, success measure, in-scope / out-of-scope).
  - `ticket-ready-packet.md` = DoR-satisfying bundle (ticket ID, problem, scope/out-of-scope, acceptance criteria Given/When/Then, dependencies, security/NFR triggers, test notes, size, priority) — **must stay aligned with `definition-of-ready.md`**, cross-reference it.
  - `implementation-ready-packet.md` = engineer's start bundle (ticket ID + branch target, relevant ADRs in `50-decisions/`, API/data contracts + system context from architecture/system handoffs, files likely touched, test strategy, commands to run).
- **D-10 (Generic template skeleton):** `memory-bank/` ships generic. Each of the 9 seed files = clear-voice header + one-line purpose + section stubs showing the shape; **no grugops-specific content**. Files seeded here: `00-index`, `10-project-brief`, `20-product`, `30-architecture`, `40-contributing`, `60-progress`, `70-runbook`, `80-glossary` (+ `50-decisions/`). Do NOT seed `brownfield-map.md` / `greenfield-plan.md`.
- **D-11 (Working-memory contract in 00-index):** `00-index.md` documents the contract (MEM-02 / SC#5): roles read the bank on start; `60-progress.md` is the running plan-of-record kept current by the daily sweep; `50-decisions/` captures ADRs as made; the index maps the bank for one-read orientation. Anti-bloat: keep every file small.
- **D-12 (ADR convention via template, no example):** `50-decisions/` ships `.gitkeep` + an `ADR-template.md` documenting the spec's ADR format — **status, context, decision, alternatives, consequences, rollback** (per §5.A.7) — as a copy-target. **No example `ADR-0001`.** The `ADR-template.md` name must NOT match the validator's `ADR-000X` numeric pattern.
- **D-13 (Minimal frontmatter on all contracts):** Every handoff and checklist carries small YAML frontmatter (2-3 fields) above the spec-verbatim headings. Handoffs: `kind: handoff` + role/lifecycle stage. Checklists: `kind: checklist` + `tier: lean | enterprise`. No bloat; spec body stays verbatim below.
- **D-14 (Tier signal = frontmatter + index):** Lean/enterprise split signalled two ways: (1) `tier:` in each checklist frontmatter; (2) `checklists/00-index.md` listing all 10 grouped lean vs enterprise + the mode-gating rule. **Tier assignment: lean** = definition-of-ready, definition-of-done, pr-review-checklist, security-nfr-checklist, uat-checklist; **enterprise** = definition-of-done-enterprise, compliance-checklist, accessibility-checklist, observability-slo-checklist, release-readiness-checklist.
- **Voice (LOCKED):** **Clear/professional voice** for ALL Phase-2 contract files. Grug caveman voice is reserved for Phase-3 role prompts.

### Claude's Discretion
- Exact field names/order inside the new frontmatter blocks (e.g., `kind`/`for`/`stage`/`tier`/`id`), kept to 2-3 high-signal fields.
- Exact wording of the one-line purpose lines, section stubs, and format hints in the memory-bank skeleton and `checklists/00-index.md`.
- Whether the universal-handoff template file is the canonical header source the per-role handoffs visually inherit, vs. each per-role file repeating the header inline (both acceptable; pick the lower-drift option).
- Exact section ordering within `business-handoff` and the two packets, as long as D-09's content is present and `ticket-ready-packet` stays aligned with `definition-of-ready.md`.

### Deferred Ideas (OUT OF SCOPE)
- Role prompts that consume these handoffs/checklists → Phase 3.
- Workflow files that produce handoffs and record trace updates / board moves → Phase 4.
- Runtime memory-bank artifacts (`brownfield-map.md`, `greenfield-plan.md`) → produced by Phase-3 roles / Phase-4 bootstrap workflows, not seeded here.
- The Phase-6 validator's exact handoff/checklist section-presence checks → Phase 6 (VAL-01).
- Final version string + commands/-vs-skills/ form → Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HAND-01 | All core handoff templates exist + copy-paste usable (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet); universal header carries Ticket ID + Trace updates | Universal header verbatim from §8 (lines 788-808); per-role section lists mapped from §5.A.5-11 (D-08); 3 derived files specified by D-09. See "Per-Role Handoff Section Map" + "Universal Header" below. |
| HAND-02 | All v2 handoff templates exist (release-handoff, incident-postmortem blameless, retro-notes, refinement-notes, sprint-plan) | All 5 reproduced verbatim from §8.1-8.5 (lines 812-869). See "v2 Handoff Templates (verbatim)" below. External conventions (blameless postmortem, SemVer release) confirmed. |
| CHECK-01 | Lean checklists exist (definition-of-ready, definition-of-done, pr-review-checklist, security-nfr-checklist, uat-checklist) | 5 bodies verbatim from §9.1, §9.2, §9.4, §9.5, §9.10. Tier=`lean` (D-14). DoR/DoD/Given-When-Then conventions confirmed canonical. |
| CHECK-02 | Enterprise + new-gate checklists (DoD-enterprise superset, compliance, accessibility, observability-slo, release-readiness); Orchestrator applies lean DoD in lean mode, enterprise DoD in enterprise mode | 5 bodies verbatim from §9.3, §9.6, §9.7, §9.8, §9.9. Tier=`enterprise` (D-14). Mode-gating rule stated in `checklists/00-index.md`. WCAG/ASVS/SOC2 references confirmed current. |
| MEM-01 | Minimal memory-bank exists (00-index → 80-glossary + 50-decisions/ ADR convention), each file short/single-purpose/small | 9-file list from §3 (lines 240-251); generic skeleton per D-10; ADR-template per D-12. Cline memory-bank pattern confirmed as the canonical agent-context convention. |
| MEM-02 | Roles use the bank as working memory — read on start, update as work progresses; 60-progress.md is running plan-of-record (daily sweep); 50-decisions/ captures ADRs; 00-index maps the bank | Working-memory contract stated in `00-index.md` per D-11. Matches Cline "read ALL memory bank files at the start of EVERY task" + activeContext/progress hierarchy. |
</phase_requirements>

## Summary

Phase 2 is a **markdown content-authoring** phase, not a software phase. There is no build, no test runner, no runtime — the deliverables are 16 handoff templates, 10 checklists + an index, and 9 memory-bank seed files (+ an ADR template), all as readable, diffable, copy-paste-usable markdown that Phase-3 roles and Phase-4 workflows will cite by exact filename and section name.

The dominant fact is that **the project spec (`docs/initial/agent_factory_builder_spec_v2.md`) is the verbatim source of truth** for the bulk of this content. §8 gives the universal header and the 5 v2 handoff templates literally; §9 gives all 10 checklist bodies literally; §5.A.5–5.A.11 give the per-role handoff output section lists; §3 gives the exact file manifest. The planner's job is **transcription with light wrapping** (minimal YAML frontmatter per D-13, a tier index per D-14), not design. The few genuinely under-specified files — `business-handoff`, `ticket-ready-packet`, `implementation-ready-packet`, and the memory-bank seed bodies — are pinned by D-09/D-10/D-11/D-12 in CONTEXT.md, leaving only wording and field-order to discretion.

The external conventions these templates encode are all well-established and verified to match the spec: the **Cline "memory bank"** agent-context pattern (read-all-on-start, projectbrief→activeContext→progress hierarchy), the **Google SRE blameless postmortem** structure (summary/timeline/systemic-root-cause/action-items, never personal), the **Nygard ADR** format (status/context/decision/consequences, one file per decision, numbered), and **Definition of Ready / Definition of Done / Given-When-Then** Scrum/Gherkin conventions. Confirming these lets the planner and the Phase-6 validator key off real, citable conventions rather than invented ones.

**Primary recommendation:** Transcribe §8/§9 verbatim into files, wrap each in 2-3-field YAML frontmatter (handoffs `kind: handoff` + stage; checklists `kind: checklist` + `tier`), pre-fill per-role handoffs from the §5.A section lists, derive the 3 under-specified files exactly per D-09, ship a generic empty-but-shaped memory-bank seed per D-10/D-11/D-12, and add `checklists/00-index.md` as the single human-readable tier/mode-gating statement. Validate structurally: file-existence + required-section-presence + universal-header consistency + frontmatter presence + no-fake-data + ticket-ready-packet↔DoR cross-reference integrity.

## Architectural Responsibility Map

This phase has no application tiers; the relevant "tiers" are the contract planes the files live in and which downstream phase consumes them. Mapping ownership prevents the planner from leaking Phase-3/4 behavior into these I/O contracts.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Handoff packet templates | `agent-factory/handoffs/` (shipped kit template, D-04) | Consumed by Phase-3 roles ("Output (file+format)") + Phase-4 workflows ("Handoffs produced") | Templates are static I/O contracts; the *producing behavior* belongs to roles/workflows, not here |
| Gate checklists + tier index | `agent-factory/checklists/` (shipped kit template) | Orchestrator (Phase 3) applies by `mode`; Phase-6 validator checks presence | Checklist *bodies* are content; the *gating logic* (lean vs enterprise) is Orchestrator behavior (Phase 3) — this phase only states the rule in the index |
| Memory-bank seed | `memory-bank/` (shipped kit template, generic) | Filled per-project by Phase-4 bootstrap workflows; read/updated by all Phase-3 roles | Seed is empty-but-shaped scaffolding; runtime artifacts (`brownfield-map.md`, `greenfield-plan.md`) are role/workflow outputs, NOT seeded |
| ADR convention | `memory-bank/50-decisions/ADR-template.md` (copy-target) | Architect role (Phase 3) writes actual ADRs `ADR-000X-*.md` | This phase ships the template only; no example ADR (D-03/D-12) |
| Frozen vocabulary references (board columns, trace columns, NFR IDs, metric names, config `mode`) | `plans/*` + `agent-factory/config/*` (Phase-1 frozen) | Cited by-name from handoffs/checklists | These names were frozen in Phase 1 — cite, never redefine |

## Standard Stack

This phase installs **no external packages**. The "stack" is the set of file formats and frozen Phase-1 vocabulary the contracts must emit and reference.

### Core
| Format / Asset | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Markdown (CommonMark + YAML frontmatter) | n/a | All 36 deliverable files | Project constraint: markdown for everything except installers. Every target tool parses md + YAML frontmatter. `[CITED: CLAUDE.md Technology Stack]` |
| YAML frontmatter (2-3 fields) | n/a | Machine-readable `kind:`/`tier:`/stage key on handoffs+checklists (D-13) | Reuses the Phase-1 ticket-frontmatter precedent; gives Phase-6 validator + Phase-3 roles a stable key `[CITED: 02-CONTEXT.md D-13]` |

### Supporting (frozen Phase-1 outputs — cite by name, never redefine)
| Asset | Location | Cited by | Exact names to use |
|-------|----------|----------|--------------------|
| Board columns + WIP format | `plans/board.md` | universal header (board moves are Phase-4, but column names referenced) | 13 columns; ticket front-matter `status/column/size/priority/epic/feature` `[VERIFIED: plans/board.md read]` |
| Traceability matrix columns | `plans/traceability.md` | universal header `## Trace updates` field links here | `Ticket \| Title \| Epic \| Feature \| NFRs \| Code (PR/files) \| Tests \| UAT \| Release \| Status` `[VERIFIED: plans/traceability.md + spec §10 read]` |
| NFR catalog columns | `plans/nfr-catalog.md` | security-nfr-handoff, security-nfr-checklist, observability-slo-checklist, architecture-handoff | `ID \| Category \| Target \| Applies to \| Verified by`; IDs `NFR-xxx` `[VERIFIED: plans/nfr-catalog.md + spec §11 read]` |
| Metric names | `plans/metrics.md` | retro-notes `## Metrics snapshot`, release flows | Throughput, Cycle time, Lead time, WIP, Blocked time, Rework rate, Gate pass rate, Escaped defects, Velocity `[VERIFIED: plans/metrics.md read]` |
| Config dial | `agent-factory/config/factory.config.json` (+`.md`) | checklist tier-gating (`mode` lean/enterprise); enterprise checklists cite `quality`/`nfr`/`compliance_regime` thresholds | `mode`, `quality`, `nfr`, `compliance_regime` field names `[CITED: 02-CONTEXT.md canonical_refs]` |
| Stable ID scheme | spec §10 / `plans/traceability.md` | release-handoff `REL-xxxx`, incident-postmortem `INC-xxxx`, ADR `ADR-000x`, NFR `NFR-xxx` | `EPIC-/FEAT-/<prefix>-/ADR-000x/NFR-xxx/RISK-xxx/REL-xxxx/INC-xxxx`; default prefix `ABC` `[VERIFIED: spec §10 lines 1008-1019 read]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-role handoff files repeating the universal header inline | One `universal-handoff.md` source the per-role files reference | D-disc: pick the lower-drift option. **Recommendation: keep the universal header inline in each per-role file** so each file is independently copy-paste-usable (HAND-01 requires "copy-paste usable"), AND keep `universal-handoff.md` as the canonical header reference. A reader copying `qe-handoff.md` alone must get a complete packet — a pointer-only file fails that. Cost: header text duplicated across 11 files; mitigated because the header is short and frozen. |
| `tier:` only (frontmatter) for the lean/enterprise split | `tier:` + `checklists/00-index.md` (D-14, locked) | Index is required for the human-readable "clearly distinguished" criterion (SC#3); frontmatter alone is machine-only. Both are mandated by D-14 — not actually optional. |

**Installation:** None — no packages.

## Package Legitimacy Audit

**Not applicable.** Phase 2 installs zero external packages. It authors markdown files only. No npm/PyPI/crates dependency is introduced, so slopcheck and registry verification are not run. (Confirmed: deliverables are `.md` files under `agent-factory/handoffs/`, `agent-factory/checklists/`, `memory-bank/`.)

## Architecture Patterns

### Deliverable Flow Diagram

```
                         docs/initial/agent_factory_builder_spec_v2.md
                                   (VERBATIM SOURCE OF TRUTH)
                                          │
        ┌─────────────────────────────────┼──────────────────────────────────┐
        │ §8 header + 5 v2 templates       │ §9 ten checklist bodies          │ §5.A.5-11 per-role
        │ (transcribe verbatim)            │ (transcribe verbatim)            │ output section lists
        ▼                                  ▼                                  ▼
  ┌──────────────────┐            ┌──────────────────┐            ┌────────────────────────┐
  │ handoffs/        │            │ checklists/      │            │ per-role handoff bodies │
  │  universal +     │◀───header──┤  10 + 00-index   │            │ (product/system/arch/   │
  │  5 v2 + per-role │  inherited │  tier: lean|ent  │            │  impl/qe/secnfr/uat)    │
  └────────┬─────────┘            └────────┬─────────┘            └───────────┬─────────────┘
           │                               │                                  │
           │  + YAML frontmatter (D-13)     │ + frontmatter tier (D-14)        │ pre-filled (D-08)
           ▼                               ▼                                  ▼
   ┌─────────────────────────── wrap + cross-reference ─────────────────────────────┐
   │  3 DERIVED files (D-09):                                                        │
   │   business-handoff  ─intake→  product-handoff                                   │
   │   ticket-ready-packet ──must mirror──▶ checklists/definition-of-ready.md        │
   │   implementation-ready-packet ──cites──▶ memory-bank/50-decisions/ + arch/system│
   └────────────────────────────────────────────────────────────────────────────────┘
           │                                                                  │
   references-by-name (cite, never redefine)                                  │
           ▼                                                                  ▼
  ┌────────────────────────────────┐                        ┌────────────────────────────────┐
  │ Phase-1 FROZEN vocabulary:      │                        │ memory-bank/ SEED (generic,     │
  │  board cols, trace cols,        │                        │  empty-but-shaped, D-10):       │
  │  NFR IDs, metric names, config  │                        │  00-index (working-mem contract │
  │  mode/quality/compliance        │                        │  D-11) → 80-glossary +          │
  └────────────────────────────────┘                        │  50-decisions/ADR-template D-12 │
                                                             └────────────────────────────────┘
                                  │
                                  ▼  (consumed downstream — NOT built here)
            Phase-3 roles cite section names ·· Phase-4 workflows produce handoffs ·· Phase-6 validator checks presence
```

### Recommended File Structure (the exact §3 manifest to create)
```
agent-factory/
├── handoffs/                        # 16 files (HAND-01: 11 core, HAND-02: 5 v2)
│   ├── universal-handoff.md         # §8 header verbatim + Ticket ID + Trace updates
│   ├── business-handoff.md          # DERIVED (D-09): business-framing intake
│   ├── product-handoff.md           # §5.A.5 sections (D-08)
│   ├── system-handoff.md            # §5.A.6 sections (D-08)
│   ├── architecture-handoff.md      # §5.A.7 sections + ADR note (D-08)
│   ├── implementation-handoff.md    # §5.A.8 sections (D-08)
│   ├── qe-handoff.md                # §5.A.9 sections (D-08)
│   ├── security-nfr-handoff.md      # §5.A.10 sections, result PASS|PASS_WITH_RISKS|BLOCKED (D-08)
│   ├── uat-handoff.md               # §5.A.11 sections (D-08)
│   ├── ticket-ready-packet.md       # DERIVED (D-09): DoR-satisfying bundle, mirrors definition-of-ready.md
│   ├── implementation-ready-packet.md # DERIVED (D-09): engineer start bundle
│   ├── release-handoff.md           # §8.1 verbatim (REL-xxxx)
│   ├── incident-postmortem.md       # §8.2 verbatim (blameless, INC-xxxx)
│   ├── retro-notes.md               # §8.3 verbatim
│   ├── refinement-notes.md          # §8.4 verbatim
│   └── sprint-plan.md               # §8.5 verbatim (mirror of plans/sprints/SPRINT-xx.md)
└── checklists/                      # 11 files (CHECK-01: 5 lean, CHECK-02: 5 enterprise, + index)
    ├── 00-index.md                  # D-14: lists 10 grouped lean vs enterprise + mode-gating rule
    ├── definition-of-ready.md       # §9.1 verbatim  | tier: lean
    ├── definition-of-done.md        # §9.2 verbatim  | tier: lean
    ├── definition-of-done-enterprise.md # §9.3 "All of lean DoD, plus:" verbatim | tier: enterprise
    ├── pr-review-checklist.md        # §9.4 verbatim  | tier: lean
    ├── security-nfr-checklist.md     # §9.5 verbatim  | tier: lean
    ├── compliance-checklist.md       # §9.6 verbatim  | tier: enterprise
    ├── accessibility-checklist.md    # §9.7 verbatim  | tier: enterprise
    ├── observability-slo-checklist.md# §9.8 verbatim  | tier: enterprise
    ├── release-readiness-checklist.md# §9.9 verbatim  | tier: enterprise
    └── uat-checklist.md              # §9.10 verbatim | tier: lean
memory-bank/                         # 9 seed files + ADR template (MEM-01/MEM-02)
├── 00-index.md                      # working-memory contract (D-11)
├── 10-project-brief.md
├── 20-product.md
├── 30-architecture.md
├── 40-contributing.md
├── 50-decisions/
│   ├── .gitkeep                     # already exists
│   └── ADR-template.md              # D-12: status/context/decision/alternatives/consequences/rollback
├── 60-progress.md                   # running plan-of-record (daily sweep)
├── 70-runbook.md
└── 80-glossary.md
```

### Pattern 1: Verbatim transcription with a thin frontmatter wrapper (D-13)
**What:** The spec's markdown body is reproduced unchanged. A 2-3 field YAML block is added ABOVE it.
**When to use:** Every handoff and checklist file.
**Example (illustrative shape — exact field names are Claude's discretion):**
```markdown
---
kind: handoff
stage: qe
---
# Handoff: <name>

## Source
Request:
Repo:
Branch:
Ticket ID:        # (v2) for traceability
Date:
...
```
For a checklist:
```markdown
---
kind: checklist
tier: enterprise
---
# Definition of Done (enterprise)

All of lean DoD, plus:
- coverage meets threshold (config)
...
```
**Key rule:** the frontmatter is additive metadata; the spec body underneath stays byte-faithful (allowing only the `# ...` heading the file needs).

### Pattern 2: Empty-but-shaped seed (D-03, extends Phase-1)
**What:** Real headers, section stubs, and a short clear-voice format hint — zero fake data rows, zero example ADRs, zero grugops-specific content.
**When to use:** All memory-bank seed files + the ADR template.
**Precedent (verbatim style established in Phase 1 — match it):** `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md` each open with `# Title` / `_Updated: <date>_` then an HTML-comment `<!-- FORMAT — read before you ... (clear voice; this is a technical file, not a role prompt.) ... -->` block. `[VERIFIED: plans/*.md read]` Phase-2 seed files should follow the same convention: header + one-line purpose + section stubs, generic, no live data.

### Pattern 3: Cross-reference integrity (D-09)
**What:** `ticket-ready-packet.md`'s fields are exactly the checks in `definition-of-ready.md`, and it explicitly cross-references that file.
**Why:** the two must not drift — the packet is "the DoR-satisfying bundle." DoR §9.1 checks: problem clear / scope+out-of-scope clear / acceptance criteria Given-When-Then / dependencies known / security-NFR triggers marked / test notes present / size assigned / priority assigned / no major unresolved blocker. The packet must carry a field for each.

### Anti-Patterns to Avoid
- **Redesigning §8/§9 content** — D-00 locks it verbatim. Rewording, reordering, or "improving" bullets is a defect, not an improvement.
- **Seeding fake data** — any example ticket row, example ADR, or grugops-specific project content violates D-03/D-04 and will trip the Phase-6 validator's no-fake-data assumption.
- **Grug voice in these files** — voice is LOCKED clear/professional; several touch security/compliance/release safety where grug voice is explicitly forbidden (brand manual §4.3 lines 158-160). `[VERIFIED: brand manual read]`
- **Naming the ADR template `ADR-0001*` or any `ADR-000X` form** — D-12: the numeric pattern is reserved for real ADRs and the validator keys off it; use the non-numeric name `ADR-template.md`.
- **Pointer-only per-role handoffs** — a file that only links to `universal-handoff.md` is not "copy-paste usable" (HAND-01). Inline the header.
- **Adding board-move / trace-update *behavior*** — that's Phase-4 workflow content. Here the universal header just provides the `## Trace updates` *field*; it does not describe when/how to fill it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Universal handoff header | A new header design | §8 header verbatim (lines 788-808) incl. v2 `Ticket ID:` + `## Trace updates` | D-00 locked; downstream roles will cite these exact section names |
| Checklist bodies | New gate criteria | §9.1-9.10 verbatim bullet lists | D-00 locked; enterprise DoD is literally "All of lean DoD, plus:" |
| Per-role handoff sections | Inventing section names | The §5.A.5-11 output lists (mapped below) | Phase-3 roles inherit these section names; inventing parallel ones causes drift (the explicit anti-goal in CONTEXT.md "specifics") |
| ADR format | A custom decision-log shape | Nygard/§5.A.7 format: status/context/decision/alternatives/consequences/rollback | Industry-canonical (Nygard 2011); spec §5.A.7 already fixes it |
| Blameless postmortem structure | A custom incident template | §8.2 verbatim (Summary/Impact/Timeline UTC/Detection/Root cause systemic/Mitigation/Rollback/What went well/What to improve/Follow-up tickets) | Matches Google SRE canonical blameless structure |
| Memory-bank hierarchy | A novel agent-context scheme | The §3 00-index→80-glossary file set + read-on-start contract | Matches the established Cline "memory bank" convention |

**Key insight:** In this phase, "hand-rolling" = paraphrasing the spec. The single biggest failure mode is a well-intentioned rewrite that changes a section name or bullet, breaking the contract that Phase-3 roles, Phase-4 workflows, and the Phase-6 validator all key off. **Transcribe; do not improve.**

## Per-Role Handoff Section Map (D-08 — exact section lists, transcribed from §5.A)

> These are the sections each per-role handoff file must contain BELOW the universal header. Source-verified from spec §5.A.5–5.A.11 (lines 425-502). `[VERIFIED: spec §5.A read]`

| File | Source | Required sections / fields (verbatim from §5.A) |
|------|--------|--------------------------------------------------|
| `product-handoff.md` | §5.A.5 (BA/PM) | user value · scope · out of scope · acceptance criteria (Given/When/Then) · dependencies · risks · test notes · **security/NFR triggers** · **size estimate** · **priority** |
| `system-handoff.md` | §5.A.6 | actors · use cases · business flows · state transitions · inputs/outputs · validation rules · permissions · data needs · API needs · integration points · error cases · open questions |
| `architecture-handoff.md` | §5.A.7 | context · constraints · chosen design · alternatives rejected · module/component map · API contracts · data model · sequence flows · security assumptions · **NFR impact → updates plans/nfr-catalog.md** · migration impact · test strategy · ADRs · open questions |
| `implementation-handoff.md` | §5.A.8 | ticket · branch · files changed · behavior changed · tests added · commands run · migration notes · docs updated · risks · remaining work |
| `qe-handoff.md` | §5.A.9 | test scope · unit/integration/E2E coverage · manual test cases · regression risks · test data · commands run · flaky risk · **coverage vs threshold** · result · gaps |
| `security-nfr-handoff.md` | §5.A.10 | scope reviewed · threat notes · auth/permission · data/privacy · secret handling · input validation · rate-limit/abuse · performance budget vs NFR catalog · reliability/fallback · logging/monitoring · compliance notes · required fixes · accepted risks · **result: `PASS \| PASS_WITH_RISKS \| BLOCKED`** |
| `uat-handoff.md` | §5.A.11 | UAT goal · entry criteria · test users/roles · test data · business scenarios · expected results · known limitations · rollback plan · signoff checklist with named human role · exit criteria |

## Universal Header (verbatim §8, lines 788-808) `[VERIFIED: spec §8 read]`
```markdown
# Handoff: <name>

## Source
Request:
Repo:
Branch:
Ticket ID:        # (v2) for traceability
Date:

## Goal
## Scope
### In scope
### Out of scope
## Inputs used
## Decisions
## Risks
## Trace updates   # (v2) IDs/files this links in plans/traceability.md
## Next agent
## Next action
```

## State of the Art (external conventions these contracts encode)

> These are confirmed to MATCH the spec. The spec is the verbatim authority; this confirmation lets the planner and the Phase-6 validator key checks off real, citable conventions rather than inventing them.

| Convention | Canonical shape (verified) | Matches spec? | Confidence |
|------------|---------------------------|---------------|------------|
| **Memory bank** (agent persistent context) | `memory-bank/` markdown hierarchy: projectbrief (foundation) → productContext/systemPatterns/techContext → activeContext/progress (working state); agent MUST read ALL files at start of EVERY task; progress.md = status/what's-left/known-issues | YES — grugops's 00-index→80-glossary + "roles read on start / 60-progress is running plan-of-record / 50-decisions captures ADRs" (D-11) is the same pattern, renamed | HIGH `[CITED: docs.cline.bot/features/memory-bank; github.com/cline/prompts]` |
| **Blameless postmortem** | Google SRE: Summary · Impact · Timeline · Root cause (systemic, never personal) · Detection · Mitigation/response · What went well · What to improve · owned action items; "focus on contributing causes without indicting any individual" | YES — §8.2 is a near-verbatim match (Summary/Impact/Timeline UTC/Detection/Root cause systemic/Mitigation/Rollback/What went well/What to improve/Follow-up tickets) | HIGH `[CITED: sre.google/sre-book/postmortem-culture]` |
| **ADR** (architecture decision record) | Nygard (2011): short doc per decision, numbered file, sections Status · Context · Decision · Consequences; "all consequences, not just positive" | YES — §5.A.7 adds Alternatives + Rollback to the Nygard core (status/context/decision/alternatives/consequences/rollback); a superset of Nygard | HIGH `[CITED: martinfowler.com/bliki/ArchitectureDecisionRecord.html; adr.github.io]` |
| **Definition of Ready / Definition of Done** | Scrum convention: DoR = story-level entry gate (clear description, acceptance criteria, estimate); DoD = sprint/release-level completion gate, team-agreed, applies to all backlog items | YES — §9.1 DoR and §9.2/9.3 DoD match; the lean→enterprise "All of lean, plus:" superset is a standard tiered-DoD shape | HIGH `[CITED: scrumalliance.org; scrum.org forum]` |
| **Given/When/Then** acceptance criteria | Gherkin: Given <context>, When <action>, Then <expected outcome> | YES — used verbatim in DoR (§9.1), product-handoff (§5.A.5), ticket-ready-packet (D-09) | HIGH `[CITED: scrum.org / Gherkin]` |
| **WCAG 2.2 AA** (accessibility target) | Current W3C accessibility conformance target; cited in §9.7 + nfr-catalog NFR-005 | YES — `accessibility-checklist.md` cites "target standard (e.g. WCAG 2.2 AA)" verbatim | MEDIUM `[CITED: spec §9.7; cross-ref nfr-catalog]` — name reproduced from spec, not independently re-verified against w3.org this session |
| **OWASP ASVS / SOC2 / ISO 27001 / PCI** (security/compliance baselines) | Named standards cited in §9.6 compliance checklist + nfr-catalog NFR-004 (ASVS L2); GSD config `security_asvs_level: 1` | YES — reproduced verbatim from §9.6 ("SOC2/ISO 27001/PCI as set") | MEDIUM `[CITED: spec §9.6]` — names reproduced from spec; the GSD security gate (ASVS L1) is content-only here, see Security Domain |

**Deprecated/outdated:** None applicable — this is a content phase with no library versions to age out.

## Common Pitfalls

### Pitfall 1: Paraphrasing the locked content
**What goes wrong:** A section name or checklist bullet gets reworded ("acceptance criteria clear" → "clear acceptance criteria") or reordered.
**Why it happens:** Natural authoring instinct to polish prose.
**How to avoid:** Treat §8/§9 as byte-faithful source. The verbatim text is captured in this RESEARCH.md (Universal Header + the Validation Architecture references the line ranges) — copy from the spec, diff against it.
**Warning signs:** Any handoff/checklist body that doesn't string-match the spec's bullets.

### Pitfall 2: Universal-header drift across the 11 core handoffs
**What goes wrong:** The header is repeated inline in each per-role file (recommended for copy-paste usability) but copies diverge — one file drops `Ticket ID:`, another renames `## Trace updates`.
**Why it happens:** Manual repetition across 11 files.
**How to avoid:** Author the header once, paste identically into each; the Validation Architecture below includes a header-consistency check across all 11 core files.
**Warning signs:** `Ticket ID:` or `## Trace updates` missing or renamed in any core handoff (HAND-01 explicitly requires both).

### Pitfall 3: ticket-ready-packet ⇄ definition-of-ready drift
**What goes wrong:** The packet's fields diverge from the DoR checks, so a "ready" packet doesn't actually satisfy the DoR gate.
**Why it happens:** The two files are authored separately.
**How to avoid:** Author `definition-of-ready.md` first (verbatim §9.1), then derive `ticket-ready-packet.md` fields 1:1 from those checks and cross-reference the file by name (D-09).
**Warning signs:** A DoR check with no corresponding packet field, or vice-versa.

### Pitfall 4: Seeding the memory-bank with content
**What goes wrong:** A well-meaning author fills `10-project-brief.md` with grugops's own brief, or adds an example ADR.
**Why it happens:** Empty files feel incomplete.
**How to avoid:** D-04/D-10 — the seed is the *user-facing template*, generic; grugops's own state lives in `.planning/`. Section stubs + format hints only, no project content, no example ADR (D-03/D-12).
**Warning signs:** Any grugops-specific noun, any non-empty data row, any `ADR-0001`.

### Pitfall 5: Validator-name collision on the ADR template
**What goes wrong:** Naming the ADR template `ADR-0001-template.md` makes the Phase-6 validator count it as a real ADR (or expect numbered ADRs to exist).
**Why it happens:** Following the `ADR-000X-*.md` example name from §3 line 246.
**How to avoid:** D-12 — use `ADR-template.md` (non-numeric), keep `.gitkeep`, leave the numeric slots empty.
**Warning signs:** Any file in `50-decisions/` matching `ADR-\d{4}`.

## Code Examples

> "Code" here = the canonical markdown shapes. These are the verbatim v2 templates the planner transcribes.

### v2 Handoff Templates (verbatim §8.1–8.5) `[VERIFIED: spec §8 read]`

**`release-handoff.md` (§8.1):**
```markdown
# Release Handoff: REL-xxxx
## Version (SemVer)
## Tickets included
## Changelog
## Release notes (business-facing)
## Environments path
dev -> staging -> prod
## Feature flags
## Migration plan
## Rollback plan
## DR notes (RTO / RPO)
## Evidence
QE result: ... | Security/NFR result: ... | UAT signoff: ...
## Approval
Approved by (human role/name): ...
## Status
READY_TO_RELEASE | BLOCKED | RELEASED
```

**`incident-postmortem.md` (§8.2, blameless):**
```markdown
# Incident Postmortem: INC-xxxx
## Summary
## Impact (users, data, money, duration)
## Timeline (UTC)
## Detection
## Root cause (systemic, not personal)
## Mitigation taken
## Rollback used
## What went well
## What to improve
## Follow-up tickets (IDs)
```

**`retro-notes.md` (§8.3):**
```markdown
# Retro: <sprint or period>
## Metrics snapshot
## Top wastes (1-3)
## Keep / Stop / Start
## Improvement tickets created (IDs, tag: factory)
```

**`refinement-notes.md` (§8.4):**
```markdown
# Refinement: <date>
## Items reviewed
## Split decisions (XL -> children)
## Sizes assigned
## Priorities assigned
## Promoted to Ready (IDs)
## Still blocked / open questions
```

**`sprint-plan.md` (§8.5):** Mirror of `plans/sprints/SPRINT-xx.md` (goal, committed items with sizes, capacity). Use when planning is requested as a one-off packet.

### Checklist bodies (verbatim §9.1–9.10) `[VERIFIED: spec §9 read]`

All 10 are short bullet lists captured in the spec at lines 877-1000. Lean (tier: lean): §9.1 definition-of-ready, §9.2 definition-of-done, §9.4 pr-review-checklist, §9.5 security-nfr-checklist, §9.10 uat-checklist. Enterprise (tier: enterprise): §9.3 definition-of-done-enterprise ("All of lean DoD, plus:"), §9.6 compliance-checklist, §9.7 accessibility-checklist, §9.8 observability-slo-checklist, §9.9 release-readiness-checklist. (Full bodies are in the spec; the planner transcribes directly from `docs/initial/agent_factory_builder_spec_v2.md` lines 877-1000 to guarantee byte-fidelity.)

### ADR template shape (D-12, from §5.A.7) `[VERIFIED: spec §5.A.7 read]`
```markdown
# ADR-XXXX: <short decision title>
## Status
<proposed | accepted | deprecated | superseded by ADR-YYYY>
## Context
## Decision
## Alternatives
## Consequences
## Rollback
```
(No example values — copy-target only. Section set per §5.A.7: status, context, decision, alternatives, consequences, rollback.)

## Runtime State Inventory

> This is NOT a rename/refactor/migration phase — it is additive markdown authoring into directories that currently hold only `.gitkeep`. No existing stored data, services, OS registrations, secrets, or build artifacts are touched.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `agent-factory/handoffs/`, `agent-factory/checklists/`, `memory-bank/` contain only `.gitkeep` (verified by `ls`) | none |
| Live service config | None — no external services involved in markdown authoring | none |
| OS-registered state | None | none |
| Secrets/env vars | None | none |
| Build artifacts | None — no build step exists for this phase | none |

**Verified by:** `ls -la` of all three target directories (handoffs/ and checklists/ hold only `.gitkeep`; memory-bank/ holds only `50-decisions/.gitkeep`). The phase is purely additive new-file creation.

## Environment Availability

**Step 2.6: SKIPPED** (no external dependencies). This phase authors markdown files using the Write tool. No CLI tools, runtimes, services, databases, or package managers are required. The only "dependency" is the frozen Phase-1 output files, all of which exist on disk (verified: `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md`, `agent-factory/config/factory.config.json`).

## Validation Architecture

> `workflow.nyquist_validation: true` (verified in `.planning/config.json`). This is markdown authoring — there is NO unit-test framework, no runtime, no build. "Validation" is therefore **structural / contract checks**: file-existence, required-section/required-field presence, header consistency, frontmatter presence, the no-fake-data invariant, and cross-reference integrity. These are exactly the checks the Phase-6 validator (`scripts/validate-agent-factory.mjs`, VAL-01) and the gsd-plan-checker apply.

### "Test Framework"
| Property | Value |
|----------|-------|
| Framework | None traditional. Structural assertions via shell (`test -f`, `grep -c`, `grep -L`) and/or the future Phase-6 Node validator `scripts/validate-agent-factory.mjs` (VAL-01). For this phase, per-task validation is shell-based grep/file-existence checks. |
| Config file | None — see Wave 0 (no test infra needed; checks are inline shell assertions in task verification steps) |
| Quick run command | Per-file: `test -f <path> && grep -q '<required-section>' <path>` |
| Full suite command | A consolidated shell script asserting all 36 files exist + contain required sections + frontmatter + no-fake-data (see Sampling Rate). The authoritative gate is Phase-6's `node scripts/validate-agent-factory.mjs` once it exists. |

### Phase Requirements → Validation Map (each SC mapped to a concrete, checkable assertion)
| Req / SC | Behavior to prove | Check type | Concrete automated command (shell) |
|----------|-------------------|-----------|------------------------------------|
| SC#1 / HAND-01 (files exist) | All 11 core handoffs exist | file-existence | `for f in universal business product system architecture implementation qe security-nfr uat ticket-ready-packet implementation-ready-packet; do test -f "agent-factory/handoffs/$f-handoff.md" 2>/dev/null \|\| test -f "agent-factory/handoffs/$f.md"; done` (note: packets are `*-packet.md`, not `*-handoff.md`) |
| SC#1 / HAND-01 (header fields) | Universal header carries Ticket ID + Trace updates, consistently across all 11 core handoffs | required-field presence + consistency | `grep -L 'Ticket ID:' agent-factory/handoffs/*.md` (expect empty for core); `grep -L '## Trace updates' agent-factory/handoffs/{universal,business,product,system,architecture,implementation,qe,security-nfr,uat}-handoff.md` |
| SC#1 / HAND-01 (per-role sections) | Each per-role handoff contains its §5.A section set | required-section presence | per file, `grep -q` for each section in the Per-Role Handoff Section Map above (e.g. `security-nfr-handoff.md` must contain `PASS_WITH_RISKS`) |
| SC#2 / HAND-02 | All 5 v2 handoffs exist with their signature headings | file-existence + section presence | `test -f agent-factory/handoffs/release-handoff.md && grep -q 'READY_TO_RELEASE' agent-factory/handoffs/release-handoff.md`; `grep -q 'Root cause (systemic' agent-factory/handoffs/incident-postmortem.md`; same for retro/refinement/sprint-plan signature headings |
| SC#3 / CHECK-01+02 (files exist) | All 10 checklists + index exist | file-existence | `test -f agent-factory/checklists/00-index.md`; loop over the 10 named checklist files |
| SC#3 (tier split machine-readable) | Each checklist frontmatter has `tier: lean\|enterprise` per D-14 assignment | frontmatter presence + value | `grep -L '^tier:' agent-factory/checklists/{definition-of-ready,...}.md` (expect empty); assert the 5 lean / 5 enterprise mapping |
| SC#3 (split human-readable) | `00-index.md` groups lean vs enterprise + states the mode-gating rule | section/content presence | `grep -qi 'lean' agent-factory/checklists/00-index.md && grep -qi 'enterprise' && grep -qi 'mode'` |
| SC#3 (DoD-enterprise is a superset) | Enterprise DoD literally begins "All of lean DoD, plus:" | content presence | `grep -q 'All of lean DoD, plus' agent-factory/checklists/definition-of-done-enterprise.md` |
| SC#4 / MEM-01 (files exist + small) | 9 seed files + ADR-template exist; each is short | file-existence + size bound | loop `test -f` over `memory-bank/{00-index,10-project-brief,20-product,30-architecture,40-contributing,60-progress,70-runbook,80-glossary}.md` + `memory-bank/50-decisions/ADR-template.md`; anti-bloat soft check e.g. `wc -l` under a sane cap (advisory) |
| SC#5 / MEM-02 (working-memory contract) | `00-index.md` states: read-on-start, 60-progress = running plan-of-record (daily sweep), 50-decisions = ADRs | content presence | `grep -qi 'read' && grep -q '60-progress' && grep -qi 'daily sweep' && grep -q '50-decisions'` in `memory-bank/00-index.md` |
| D-03 (no fake data) | No example ticket rows, no example ADR, no grugops-specific content | negative/invariant check | `! grep -rEq 'ABC-[0-9]{3}' agent-factory/handoffs agent-factory/checklists memory-bank` (no live ticket IDs); `! ls memory-bank/50-decisions/ \| grep -qE 'ADR-[0-9]{4}'` (no numbered ADRs) |
| D-09 (cross-ref integrity) | `ticket-ready-packet.md` references `definition-of-ready.md` and its fields mirror the DoR checks | cross-reference presence | `grep -q 'definition-of-ready' agent-factory/handoffs/ticket-ready-packet.md`; field-by-field manual diff against §9.1 checks |
| D-13 (frontmatter present) | Every handoff + checklist opens with a YAML frontmatter `kind:` block | frontmatter presence | `grep -L '^kind:' agent-factory/handoffs/*.md agent-factory/checklists/*.md` (expect empty; `00-index.md` may be exempt — Claude's discretion) |
| Voice (D-00/brand) | No grug-voice markers in these files | content lint (advisory) | manual review; grug voice forbidden in security/compliance/safety content (brand §4.3) |

### Sampling Rate
- **Per task / per file (quick):** `test -f <file> && grep -q '<signature heading or field>' <file>` — runs in well under a second, asserts existence + a load-bearing section.
- **Per wave merge (full):** a consolidated shell assertion block covering all files authored so far (the rows above), including the negative no-fake-data invariant.
- **Phase gate:** all 36 files present + every required section/field/frontmatter check green + no-fake-data invariant green, before `/gsd-verify-work`. The authoritative downstream gate is Phase-6's `node scripts/validate-agent-factory.mjs` (VAL-01), which this phase's section names must satisfy.

### Wave 0 Gaps
- [ ] No test framework needed — validation is shell-based structural assertion. (The Phase-6 Node validator is OUT OF SCOPE for Phase 2 per CONTEXT.md deferred items.)
- [ ] Optional: author a single `scripts/check-phase2-structure.sh` (or inline the asserts into task verification steps) consolidating the Validation Map above — but note the markdown-only constraint means even this should be minimal; inline shell `test`/`grep` in task verification is sufficient and avoids adding a script the project must maintain.
- [ ] No shared fixtures required — checks read the authored files directly.

*Net: existing repo state + shell builtins cover all Phase-2 validation. No framework install.*

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high` (verified in `.planning/config.json`). Phase 2 writes **no executable code** — it authors markdown contract files. There is no attack surface (no input handling, no auth, no crypto, no data flow) in the deliverables themselves. The security relevance is entirely about **what the security/compliance checklist files prescribe**, which must be reproduced verbatim from the spec and worded in clear voice.

### Applicable ASVS Categories
| ASVS Category | Applies to this phase's *deliverables* | Standard control (as the files prescribe) |
|---------------|----------------------------------------|--------------------------------------------|
| V2 Authentication | No (content only) | n/a — but `security-nfr-checklist.md` (§9.5) prescribes "auth + permissions checked" as a downstream gate |
| V3 Session Management | No | n/a |
| V4 Access Control | No | `compliance-checklist.md` (§9.6) prescribes "access controls documented" |
| V5 Input Validation | No (no inputs) | `security-nfr-checklist.md` prescribes "input validation checked" |
| V6 Cryptography | No | `security-nfr-checklist.md` prescribes "secrets handling checked" — never hand-roll crypto (downstream) |
| V7 Error/Logging | No | checklists prescribe "logs do not leak sensitive data" / "structured logs (no sensitive data)" |
| V8 Data Protection | No | `compliance-checklist.md` prescribes PII data-flow mapping, retention/deletion, data classification |

**Phase-level conclusion:** ASVS L1 imposes **no code-level control on Phase 2** because there is no code. The only security-adjacent obligation is *fidelity + voice*: the security-nfr / compliance / observability checklists must (a) reproduce §9.5/§9.6/§9.8 verbatim and (b) be written in clear voice (brand §4.3 forbids grug voice in security/compliance content). The Validation Architecture's "Voice" row covers (b).

### Known Threat Patterns for {markdown content authoring}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated/false control statement in a security or compliance checklist (e.g. claiming a control exists that doesn't) | Repudiation / Tampering | No-fabrication constraint: reproduce §9 verbatim; never invent controls. The no-fake-data invariant + verbatim-transcription check cover this. |
| Voice misuse undermining a safety message (grug voice in a security/compliance line) | Information disclosure (trust erosion) | Locked clear voice (D-00); brand §4.3 forbidden-list; Validation "Voice" advisory check |
| Secret/PII leaked into a seed file as "example data" | Information disclosure | D-03 no-fake-data: zero example data; the no-fake-data invariant check |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | WCAG 2.2 AA is the current accessibility conformance target name to reproduce | State of the Art / Security Domain | LOW — name is reproduced verbatim from spec §9.7 + nfr-catalog NFR-005, so even if a newer WCAG exists, the file is spec-faithful (which is the locked requirement). Not independently re-verified against w3.org this session. |
| A2 | The recommended "inline the universal header in each per-role handoff" (vs pointer-only) is the lower-drift choice CONTEXT.md asks Claude to pick | Standard Stack / Alternatives | LOW — both are explicitly acceptable per D-disc; recommendation favors copy-paste-usability (HAND-01). Planner may choose otherwise. |
| A3 | Shell `test -f`/`grep` assertions are an acceptable "validation framework" for a markdown phase under nyquist_validation | Validation Architecture | LOW — no code/test infra exists; structural checks are the only meaningful validation, and they map 1:1 to what the Phase-6 Node validator (VAL-01) will assert. |
| A4 | `00-index.md` files may be exempt from the `kind:` frontmatter rule (they are index/orientation files, not handoffs/checklists) | Validation Map (D-13 row) | LOW — D-13 names "handoffs and checklists"; the index is arguably neither. Field set is Claude's discretion (D-disc). Planner should decide explicitly. |

## Open Questions

1. **Does the universal-handoff header live once (canonical) or inline in each per-role file?**
   - What we know: CONTEXT.md D-disc says both are acceptable; pick lower-drift.
   - What's unclear: which the user ultimately prefers visually.
   - Recommendation: inline the header in each of the 11 core handoffs (so each is independently copy-paste-usable per HAND-01) AND keep `universal-handoff.md` as the canonical reference; add the cross-file header-consistency check (Validation Map) to catch drift. This is a discretion call, not a blocker.

2. **Should `checklists/00-index.md` and `memory-bank/00-index.md` carry the `kind:` frontmatter?**
   - What we know: D-13 mandates frontmatter on "handoffs and checklists"; index files are orientation files.
   - What's unclear: whether the Phase-6 validator will expect frontmatter on index files.
   - Recommendation: a tiny `kind: index` (or omit) — Claude's discretion per D-disc. Decide once and apply consistently so the validator's rule is simple. Not a blocker.

3. **Anti-bloat size cap for memory-bank seed files — is there a hard number?**
   - What we know: MEM-01 says "as small as possible," "never a document dump"; no numeric cap given.
   - What's unclear: an exact line/byte bound.
   - Recommendation: treat as advisory (e.g. each seed file comfortably under ~40 lines: header + one-line purpose + a few section stubs). No mechanical fail on size; reviewer judgment. Not a blocker.

## Project Constraints (from CLAUDE.md)

> These directives bind the planner with the same authority as locked decisions. Relevant subset for Phase 2:

- **Markdown for everything** except installers/validator — all 36 Phase-2 deliverables are `.md`. (No code introduced.)
- **No fabrication:** never fake a passing gate, test result, or citation; unknown commands marked `UNKNOWN - verify`. → Reinforces D-03 no-fake-data and the verbatim-transcription rule for security/compliance checklists.
- **Voice discipline:** caveman voice in role prompts only; **clear voice in security, compliance, money, and disclaimers** — and per D-00, clear voice for ALL Phase-2 contract files.
- **Minimal / anti-bloat:** keep substrate short and high-signal; push detail into pointed-to files. → MEM-01/D-11 anti-bloat rule for memory-bank + index files.
- **Brand:** always lowercase `grugops`. → any prose in these files (format hints, index, working-memory contract) must use lowercase `grugops`.
- **Single-source:** role text lives once; thin pointers elsewhere. → relevant to the universal-header inline-vs-canonical decision (favor lower drift).
- **GSD workflow enforcement:** file changes go through a GSD command; this phase's writes occur under `/gsd-execute-phase`.

## Sources

### Primary (HIGH confidence)
- `docs/initial/agent_factory_builder_spec_v2.md` — §3 file manifest (lines 188-268), §5.A.5-5.A.11 per-role outputs + ADR format (lines 425-502), §8 universal header + 5 v2 templates (lines 784-869), §9 all 10 checklist bodies (lines 873-1000), §10 ID scheme + traceability columns (lines 1004-1041), §11 NFR catalog columns (lines 1045-1062). `[VERIFIED: read]`
- `.planning/phases/02-shared-contracts/02-CONTEXT.md` — D-00, D-03, D-04, D-08–D-14 + discretion areas. `[VERIFIED: read]`
- `.planning/phases/01-substrate-config-state-skeleton/01-CONTEXT.md` — D-03/D-04 precedents + ticket frontmatter pattern. `[VERIFIED: read]`
- `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md` — frozen vocabulary + established empty-but-shaped clear-voice format-comment style. `[VERIFIED: read]`
- `docs/initial/grugops_brand_manual.md` §4 (lines 105-161) — two-voice rule; grug voice forbidden in security/compliance/money/disclaimers. `[VERIFIED: read]`
- `.planning/config.json` — `nyquist_validation: true`, `security_enforcement: true`, `security_asvs_level: 1`. `[VERIFIED: read]`

### Secondary (MEDIUM confidence — external convention confirmation)
- docs.cline.bot/features/memory-bank + github.com/cline/prompts — memory-bank pattern (read-all-on-start, projectbrief→activeContext→progress). `[CITED]`
- sre.google/sre-book/postmortem-culture + /example-postmortem — Google SRE blameless postmortem structure. `[CITED]`
- martinfowler.com/bliki/ArchitectureDecisionRecord.html + adr.github.io — Nygard ADR format. `[CITED]`
- scrumalliance.org / scrum.org — Definition of Ready vs Done + Gherkin Given/When/Then. `[CITED]`

### Tertiary (LOW confidence)
- WCAG 2.2 AA / OWASP ASVS / SOC2 / ISO 27001 / PCI names — reproduced from spec §9.6/§9.7, not independently re-verified this session (acceptable: verbatim-from-spec is the locked requirement). `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack (formats + frozen vocabulary): HIGH — all source files read directly; no external packages.
- Architecture (file manifest + section maps): HIGH — transcribed from spec §3/§5.A/§8/§9, line-verified.
- Pitfalls: HIGH — derived from locked decisions (D-00/D-03/D-12) + Phase-1 precedent.
- External conventions: HIGH for memory-bank/postmortem/ADR/DoR-DoD (web-verified to match spec); MEDIUM for the named compliance/a11y standards (verbatim-from-spec, not re-verified).
- Validation Architecture: HIGH — structural checks map 1:1 to the 5 SCs and to the future Phase-6 validator.

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (stable — spec-driven content phase; external conventions are mature/stable specs)
