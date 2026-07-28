# Phase 3: Roles & AGENTS.md Substrate - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 17 (16 role templates + root `AGENTS.md`)
**Analogs found:** 17 / 17 (all map to frozen Phase-1/2 on-disk files)

> This is a **markdown-authoring** phase, not a code phase. "Patterns to copy" = the house-style
> exemplars already frozen on disk (frontmatter shape, `## ` heading style, voice split, how
> existing files cite frozen paths). Content (caveman prompts, routing matrix, §17.1 skeleton,
> 12 rules) is reproduced **verbatim from the spec** per D-00/D-15 — those verbatim blocks are
> already staged in `03-RESEARCH.md`; this file maps the **connective-tissue style** the planner
> must mirror and gives copy-ready `read_first` targets. **Invent nothing** — every analog
> excerpt below was read off disk this session.

---

## File Classification

| New file | Role | "Data flow" (what it wires) | Closest on-disk analog | Match |
|----------|------|-----------------------------|------------------------|-------|
| `agent-factory/roles/orchestrator.md` | role (router) | request-in → routing decision | `agent-factory/handoffs/universal-handoff.md` (frontmatter+`## ` style) + `agent-factory/README.md` (routing/voice) | role-match |
| `agent-factory/roles/agents-md-scribe.md` | role | authors substrate (owns 12 rules) | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/brownfield-mapper.md` | role | read-only repo map | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/greenfield-mapper.md` | role | shapes empty land | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/ba-pm.md` | role | product → epics/tickets | `agent-factory/handoffs/implementation-handoff.md` (dual-section body) | role-match |
| `agent-factory/roles/system-analyst.md` | role | ticket → flows/states | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/architect-design.md` | role | structure + ADRs | `agent-factory/handoffs/universal-handoff.md` + `memory-bank/50-decisions/ADR-template.md` (Output target) | role-match |
| `agent-factory/roles/software-engineer.md` | role | one ticket → diff+tests | `agent-factory/handoffs/implementation-handoff.md` | exact |
| `agent-factory/roles/qe-e2e.md` | role | tests / break feature | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/security-nfr.md` | role | risk/security gate | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/uat-planner.md` | role | business acceptance | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/release-manager.md` | role (enterprise) | cut release | `agent-factory/handoffs/universal-handoff.md` + `agent-factory/checklists/definition-of-ready.md` (tier frontmatter) | role-match |
| `agent-factory/roles/compliance-officer.md` | role (enterprise) | classify data / regime | `agent-factory/handoffs/universal-handoff.md` + `agent-factory/checklists/compliance-checklist.md` | role-match |
| `agent-factory/roles/incident-responder.md` | role (enterprise) | stop bleeding / postmortem | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/factory-coach.md` | role (enterprise) | metrics → retro | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `agent-factory/roles/installer.md` | role (enterprise) | detect tool / lay adapter | `agent-factory/handoffs/universal-handoff.md` | role-match |
| `AGENTS.md` (repo root) | substrate | entry-point pointers | `agent-factory/README.md` (pointer/tone) + §17.1 skeleton in `03-RESEARCH.md` (required shape) | role-match |

All 16 role files currently absent (`agent-factory/roles/` holds only `.gitkeep`); root `AGENTS.md` absent. Phase 3 creates all 17 additively.

---

## Pattern Assignments

### All 16 role files (`agent-factory/roles/<name>.md`)

**Primary analog (frontmatter + heading house style):** `agent-factory/handoffs/universal-handoff.md`

**Frontmatter pattern to mirror** (`universal-handoff.md` lines 1-4) — minimal YAML, `kind:` first, one classifier field:
```yaml
---
kind: handoff
stage: universal
---
```
**What to replicate:** the exact shape — opening `---`, `kind:` as the first key, then ONE classifier field, closing `---`, then an immediate `# ` title. Per D-16 the role twin is:
```yaml
---
kind: role
tier: core          # core for the 11; enterprise for the 5
---
# Role: <name>
```
> **Tier-vocabulary note (flag for planner):** the frozen checklists use `tier: lean | enterprise`
> (see `definition-of-ready.md` line 3 below), but D-16 specifies `tier: core | enterprise` for
> roles. These are DIFFERENT axes — keep `tier: core` for the 11 core roles (do **not** copy
> `lean` from the checklist analog). The frontmatter *shape* is the pattern; the *value vocabulary*
> is fixed by D-16. The 2-3-field set/order beyond `kind`+`tier` is Claude's discretion (D-16).

**Heading house style to mirror** (`universal-handoff.md` lines 5-23) — flat `## ` sections, no decoration, `### ` only for sub-splits, inline `# (v2)` comments to mark traceability fields:
```markdown
# Handoff: <name>

## Source
...
## Scope
### In scope
### Out of scope
...
## Trace updates   # (v2) IDs/files this links in plans/traceability.md
## Next agent
## Next action
```
**What to replicate:** plain `## ` headings in fixed order, `### ` for in/out sub-splits, no bold/emoji on headings. Apply this to the **§5 9-section skeleton** (verbatim from `03-RESEARCH.md` L304-316):
```markdown
# Role: <name>

## One job
## Caveman prompt
## Reads
## Activates when
## Responsibilities
## Output (file + format)
## Board moves (which column transitions this role causes)
## Trace updates (what it must record in plans/traceability.md)
## Hard limits
```
Keep the parentheticals on `Output` / `Board moves` / `Trace updates` for fidelity (validator does a bare-name `contains` check, so either form passes — reproduce the spec's parenthetical form).

**Voice in the analog:** the handoff templates are terse/clear (they are technical fill-in forms). For roles, the `## Caveman prompt` block is **grug voice, verbatim from spec** (staged in `03-RESEARCH.md` L149-295); the derived sections (`Reads`/`Responsibilities`/etc.) stay terse like the handoff body. Clear voice only in safety/12-rules/compliance text (D-21).

**How the analog cites frozen paths (the connective-tissue exemplar):** `universal-handoff.md` line 21 cites `plans/traceability.md` inline in a heading comment; `definition-of-ready.md` (below) cites `ticket-ready-packet.md` in prose. Mirror this: cite the **exact on-disk path** in running text, no parallel/invented names (D-15).

---

### `agent-factory/roles/software-engineer.md` (exact-match analog)

**Analog:** `agent-factory/handoffs/implementation-handoff.md` — this is the handoff the Engineer **emits**, so it doubles as the closest structural analog.

**Dual-section body pattern** (`implementation-handoff.md` lines 1-37) — shows the house style for a file that carries the universal header THEN a role-specific body block, separated by `---`:
```markdown
---
kind: handoff
stage: implementation
---
# Handoff: implementation

## Source
...
## Next action

---

## Ticket
## Branch
## Files changed
## Behavior changed
## Tests added
## Commands run
...
```
**What to replicate (for the planner's Engineer plan):** the Engineer's `Output (file + format)` cites `agent-factory/handoffs/implementation-handoff.md` and references the **universal-header** `## Scope` / `## Risks` sections as authoritative (Phase-2 duplicate-header decision — the duplicate `## Risks` at line 35 is tolerated but the universal one at line 20 is the one to cite).

---

### `AGENTS.md` (repo root — authored LAST)

**Analog 1 (pointer style + tone):** `agent-factory/README.md`

**The "start here → orchestrator.md" pointer to stay consistent with** (`README.md` lines 13-23):
```markdown
## Start here

**All work starts at `agent-factory/roles/orchestrator.md`.** Tell your coding agent:

> Read `agent-factory/roles/orchestrator.md`, then `agent-factory/config/factory.config.json`,
> then `plans/board.md`. Act as the Orchestrator.
```
**What to replicate:** AGENTS.md's `## How to work here` section must echo this **exact read order** (orchestrator role → `factory.config.json` → `plans/board.md`) and the "all work starts at orchestrator.md" rule, so the substrate and the README do not drift. The README's `## Role / workflow / handoff files`-equivalent paths (`agent-factory/roles/`, `agent-factory/config/factory.config.json`, `plans/board.md`, `plans/traceability.md`) are the canonical pointers.

**Tone exemplar:** README opening (lines 1-11) carries a light grug wink ("a few single-job 'grug' agents execute within hard limits") inside otherwise clear prose, and stays clear on the human-gate ("Humans always hold merge and deploy"). Mirror this voice split in AGENTS.md (D-21): light wink permitted in `## Mission` only; **clear voice** in Safety rules, the 12 rules, Commands/Delivery/DoR-DoD pointers.

**README consistency lock:** `README.md` lines 24-29 already say AGENTS.md "lands in Phase 3" and does not exist yet — this phase fulfils that note. The workflow numbers in the README copy-paste prompts (lines 78-112: `#07` refine, `#08` sprint, `#09` sweep, `#04` ticket-to-pr, `#05` gate, `#06` UAT, `#12` release) **must match** the Orchestrator role's workflow-name references (D-20) — see Shared Patterns → Workflow names.

**Analog 2 (required shape):** the §17.1 skeleton is reproduced verbatim in `03-RESEARCH.md` (L399-442). Reproduce those 9 `## ` headings; fill Commands subsections from the slot table (`03-RESEARCH.md` L485-498) with every value `UNKNOWN - verify` (D-18). 12-rules placement is an Open Question (`03-RESEARCH.md` Open Q1) — recommended minimal `## Coding rules (the 12)` section adjacent to Safety rules. Keep under 32 KiB.

---

## Shared Patterns

### Frontmatter (apply to all 16 roles)
**Source:** `agent-factory/handoffs/universal-handoff.md` lines 1-4 (shape) + `agent-factory/checklists/definition-of-ready.md` lines 1-4 (tier-bearing twin):
```yaml
---
kind: checklist
tier: lean
---
```
**Apply as:** `kind: role` + `tier: core|enterprise` (D-16). Shape copied, value vocabulary fixed by D-16 (`core`, not `lean`).

### Universal v2 lines (apply identically to all 16 — D-17)
**Sources (all confirmed on disk):**
- `Reads` → `agent-factory/config/factory.config.json` first. Read-on-start memory contract from `memory-bank/00-index.md` lines 17-19 ("Roles **read this bank on start**", "`60-progress.md` is the running plan-of-record", "`50-decisions/` captures ADRs").
- `Board moves` → transition columns in `plans/board.md`. Exact column names + exit owners are in `plans/board.md` lines 58-72 (the 13-column table) — see read_first map below.
- `Trace updates` → append to `plans/traceability.md` (columns: Ticket·Title·Epic·Feature·NFRs·Code·Tests·UAT·Release·Status).
Render these three the **same way across all 16 roles**, not bespoke per role.

### Board-move column names (apply to each role's `Board moves` — D-23)
**Source:** `plans/board.md` lines 58-72. Each role states only the transition IT causes, using these exact column + exit-owner names:

| Role | Board move (role granularity) | Exit owner per board.md |
|------|-------------------------------|--------------------------|
| Orchestrator | `Ready for Dev → In Development`, `… → Done` + enforces WIP all columns | Ready for Dev (line 64), Done (line 71) |
| BA/PM | `Backlog → Ready` | Backlog/Ready (lines 60-61) |
| System Analyst | `In Analysis` exit | line 62 |
| Architect/Design | `In Design` exit | line 63 |
| Software Engineer | `In Development → In Review` | lines 65-66 |
| QE/E2E | `In Review` exit | line 66 |
| Security/NFR | `In Security/NFR` exit | line 67 |
| UAT Planner | `Ready for UAT → In UAT`, `In UAT` exit | lines 68-69 |
| Release Manager | `Ready to Release` exit → Done | lines 70-71 |
| Scribe / Mappers / Compliance / Incident / Coach / Installer | none (state "no board transition") | n/a |

### 12-rules single-source pointer (apply to the 15 non-Scribe roles — D-19)
**Source:** the 12 rules live ONCE in `AGENTS.md` (verbatim in `03-RESEARCH.md` L454-479). The 15 non-Scribe roles add ONE pointer line (Claude's-discretion wording, e.g. "Follow the 12 coding rules in `AGENTS.md`."). The Scribe **owns** them (its job per §5.A.2) and may echo in grug voice in its own body. **No role restates the rule text.**

### Voice split (apply everywhere — D-21, brand §4.3)
- **Grug voice:** the `## Caveman prompt` block (verbatim from spec), and lightly the AGENTS.md `## Mission`.
- **Clear voice:** every safety/hard-limit line, the 12 rules, all security/compliance/money text. The hard limit "Never merge to a protected branch. Never deploy to prod." is reproduced **verbatim, clear voice** in `orchestrator.md`, `release-manager.md`, and AGENTS.md Safety rules — never softened, never caveman.

### Workflow names the Orchestrator references (D-20 — name, don't inline)
**Source:** `03-RESEARCH.md` L376-389 (14 workflow files `00-`…`13-`) + `agent-factory/README.md` lines 92-111 (the workflow numbers already in the copy-paste prompts). The Orchestrator names these files in its `Workflow` decision line without inlining steps; the numbers MUST match the README.

---

## read_first targets per role (copy-ready for the planner's plans)

> Every path below was `test -e`-confirmed on disk this session (25/25 OK, 0 MISS). Cite these EXACT paths — no `plans/<name>-handoff.md` drift (the real handoffs live under `agent-factory/handoffs/`).

**Universal (every role's `Reads`, D-17):**
- `agent-factory/config/factory.config.json` ✓ (read first)
- `plans/board.md` ✓ (Board moves target)
- `plans/traceability.md` ✓ (Trace updates target)
- `memory-bank/00-index.md` ✓ (read-on-start orientation)
- `AGENTS.md` ✓ (for the 12-rules pointer — created this phase)

**Per-role `Output` / role-specific reads (all ✓ on disk):**

| Role | Emits / role-specific cite (real on-disk path) |
|------|-----------------------------------------------|
| orchestrator | `# Orchestrator Decision` (inline, no file); applies `agent-factory/checklists/definition-of-ready.md` (DoR gate) |
| agents-md-scribe | root `AGENTS.md` (owns the 12 rules within it) |
| brownfield-mapper | `memory-bank/brownfield-map.md` (runtime output — NOT seeded, correctly absent; Phase-4) |
| greenfield-mapper | `memory-bank/greenfield-plan.md` (runtime output — NOT seeded, correctly absent; Phase-4) |
| ba-pm | `agent-factory/handoffs/product-handoff.md` + `plans/epics/` `plans/features/` `plans/tickets/` |
| system-analyst | `agent-factory/handoffs/system-handoff.md` |
| architect-design | `agent-factory/handoffs/architecture-handoff.md` + ADRs via `memory-bank/50-decisions/ADR-template.md` → `ADR-000X-<slug>.md`; updates `plans/nfr-catalog.md` |
| software-engineer | `agent-factory/handoffs/implementation-handoff.md` (reads `agent-factory/handoffs/implementation-ready-packet.md` / the ticket) |
| qe-e2e | `agent-factory/handoffs/qe-handoff.md` |
| security-nfr | `agent-factory/handoffs/security-nfr-handoff.md` (cites `agent-factory/checklists/security-nfr-checklist.md`) |
| uat-planner | `agent-factory/handoffs/uat-handoff.md` (cites `agent-factory/checklists/uat-checklist.md`) |
| release-manager | `plans/releases/REL-xxxx.md` + `agent-factory/handoffs/release-handoff.md` (reads `memory-bank/70-runbook.md`) |
| compliance-officer | appends to `agent-factory/handoffs/security-nfr-handoff.md` + fills `agent-factory/checklists/compliance-checklist.md` |
| incident-responder | `agent-factory/handoffs/incident-postmortem.md` |
| factory-coach | `agent-factory/handoffs/retro-notes.md` + `factory`-tagged tickets in `plans/tickets/`; reads `plans/metrics.md` |
| installer | tool adapter/entry files (per §16) + install report (no board flow) |

**Enterprise `Activates when` (D-22 — `mode=enterprise` OR trigger, verbatim trigger preserved):** Release Manager → a release request; Compliance Officer → `compliance_regime` set OR personal/financial/health/payment data; Incident Responder → a production incident OR failing SLO; Factory Coach → end of sprint OR on-demand; Installer → an install/adapter request.

---

## No Analog Found

None. Every new file maps to a frozen Phase-1/2 on-disk analog for its frontmatter/heading/voice style, and all 25 cited content paths were confirmed present on disk. The only intentionally-absent targets are **runtime outputs** (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`) which are produced by the Mapper roles at Phase-4 runtime, not seeded here — these are `Output` targets the roles name, not analogs the roles copy from.

---

## Metadata

**Analog search scope:** `agent-factory/roles/` (empty), `agent-factory/handoffs/` (16 files), `agent-factory/checklists/` (11 files), `agent-factory/config/` (2 files), `plans/` (board, traceability, nfr-catalog, metrics + 5 dirs), `memory-bank/` (00-index + 50-decisions/ADR-template), `agent-factory/README.md`.
**Files read for excerpts:** `universal-handoff.md`, `implementation-handoff.md`, `checklists/00-index.md`, `definition-of-ready.md`, `README.md`, `memory-bank/00-index.md`, `ADR-template.md`, `plans/board.md`.
**Path-existence check:** 25 role-cited paths tested, 25 OK, 0 MISS.
**Pattern extraction date:** 2026-06-03
