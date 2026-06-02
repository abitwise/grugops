# Phase 2: Shared Contracts - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 36 new markdown files (16 handoffs, 11 checklists incl. index, 9 memory-bank seed files incl. ADR-template)
**Analogs found:** 36 / 36 (all map to one of 4 frozen Phase-1 markdown patterns)

> **Framing reminder:** This is a MARKDOWN-only phase. "Analog" = the existing Phase-1 **markdown** convention to replicate, not source code. "Code excerpt" = the actual frozen markdown shape (FORMAT-comment style, frontmatter block, ID scheme) the planner should copy. The verbatim *content* of each contract comes from the spec (§8/§9/§5.A) per D-00 — that is transcription, not pattern-mapping. This map fixes the **wrapping/style/convention** so the transcribed bodies land in the house style.

## File Classification

Files are grouped by shared pattern so this map stays lean (do NOT expand into 36 near-identical rows). Five role-groups, each with one dominant analog.

| New-file group | Count | Role | "Data flow" (authoring shape) | Closest frozen analog | Match quality |
|----------------|-------|------|-------------------------------|------------------------|---------------|
| Per-role handoffs + universal header + 2 packets (`universal/business/product/system/architecture/implementation/qe/security-nfr/uat-handoff.md`, `ticket-ready-packet.md`, `implementation-ready-packet.md`) | 11 | handoff (I/O contract template) | empty-but-shaped, header + section stubs; + `kind:` frontmatter (D-13) | `plans/board.md` / `plans/traceability.md` style + ticket-frontmatter precedent (board.md L33-45) | role-match (markdown convention) |
| v2 handoffs (`release-handoff/incident-postmortem/retro-notes/refinement-notes/sprint-plan.md`) | 5 | handoff (I/O contract template) | verbatim §8 body + `kind:` frontmatter; IDs from frozen scheme | `plans/traceability.md` ID scheme (L17-26) + state-file style | exact (style) / verbatim (content from spec) |
| Checklists (`definition-of-ready/done/done-enterprise`, `pr-review/security-nfr/compliance/accessibility/observability-slo/release-readiness/uat-checklist.md`) | 10 | checklist (gate contract) | verbatim §9 bullet body + `kind: checklist` + `tier:` frontmatter (D-13/D-14) | state-file style; `tier` reuses ticket-frontmatter precedent (board.md L33-45) | role-match (style) / verbatim (content) |
| Index / orientation files (`checklists/00-index.md`, `memory-bank/00-index.md`) | 2 | index | prose orientation + grouping/contract statement; empty-but-shaped | `agent-factory/README.md` (orientation prose) + state-file `# Title` / `_Updated:_` opener | exact (`00-index` orientation pattern) |
| Memory-bank seed + ADR template (`10-project-brief/20-product/30-architecture/40-contributing/60-progress/70-runbook/80-glossary.md`, `50-decisions/ADR-template.md`) | 8 | memory-bank seed | empty-but-shaped: `# Title` + one-line purpose + section stubs, generic, zero data (D-03/D-10) | `plans/metrics.md` / `plans/nfr-catalog.md` (named-but-empty) | exact (empty-but-shaped pattern) |

---

## Shared Patterns

These four frozen conventions cover all 36 files. Each pattern below has a concrete excerpt the planner copies. **Pattern application is listed per file-group above and reiterated in each Pattern Assignment.**

### Shared Pattern A — Empty-but-shaped state file (the house style for ALL contract bodies)

**Source:** `plans/metrics.md` (whole file, 25 lines) — the cleanest minimal exemplar; `plans/nfr-catalog.md`, `plans/traceability.md`, `plans/board.md` are the same style at larger scale.
**Apply to:** every Phase-2 file (memory-bank seed strictly; handoffs/checklists for the opener + voice + no-data rule, with the spec body sitting below the frontmatter).

Concrete excerpt — `plans/metrics.md` lines 1-16 (the opener + FORMAT comment + named-but-empty table):
```markdown
# Metrics
_Updated: <date>_

<!--
  FORMAT — read before you fill values. (clear voice; this is a technical file, not a role prompt.)

  This is grugops's delivery metric tracker. It ships EMPTY: the metric set is named below
  with its one-line meaning, but every value/period cell is blank — zero live data.

  Update owners: the daily sweep and the retro update these counts. ...
-->

| Metric | Meaning | Value | Period |
|--------|---------|-------|--------|
| Throughput | tickets reaching Done per period | | |
```

**Load-bearing conventions to replicate exactly:**
1. `# Title` H1, then `_Updated: <date>_` (board.md uses `_Updated: <ISO date> by <role>_` — pick one form and apply consistently).
2. An HTML-comment opener literally beginning `FORMAT — read before you ...` and carrying the parenthetical `(clear voice; this is a technical file, not a role prompt.)`. This is the established device for the per-file "format hint" D-03/D-10 ask for. Reuse it for the memory-bank seed's one-line purpose + format hints.
3. **Zero live data.** Real structure (headers, table skeletons, section stubs) but no rows/values. Any example uses the generic `ABC-` / `NFR-001` form and lives **inside the comment only**, explicitly marked "NOT a live row."
4. **Clear/professional voice throughout** (D-00 locked for Phase 2). No grug voice — the comment even says so.

### Shared Pattern B — Minimal YAML frontmatter (D-13/D-14), reusing the ticket-frontmatter precedent

**Source:** `plans/board.md` lines 33-45 — the canonical ticket-frontmatter shape that D-13 explicitly extends. (No live ticket file exists; the shape is documented in the board's FORMAT comment.)
**Apply to:** all 16 handoffs (`kind: handoff` + stage) and all 10 checklists (`kind: checklist` + `tier:`). Index files: Claude's discretion (`kind: index` or omit — decide once, apply consistently; see Open Decisions).

Concrete excerpt — the frozen ticket-frontmatter pattern (`plans/board.md` lines 37-42, inside the FORMAT comment, shown as the precedent shape):
```yaml
    status: in-development
    column: In Development
    size: M
    priority: P2
    epic: EPIC-003
    feature: FEAT-007
```

**Secondary precedent (a real, parsed YAML frontmatter block in this repo):** the GSD plan SUMMARY files open with frontmatter such as `phase:` / `plan:` / `subsystem:` / `tags:` (see `.planning/phases/01-substrate-config-state-skeleton/01-04-SUMMARY.md` lines 1-36). Confirms the `---` ... `---` fenced-block shape; use it as the structural model, but Phase-2 contracts get only 2-3 high-signal fields (anti-bloat).

**Rules to replicate:**
1. `---`-fenced YAML at the very top, **above** the `# Title` heading and the FORMAT comment.
2. Keep it to 2-3 fields (D-13). Handoffs: `kind: handoff` + one stage/role field (field name e.g. `stage:` / `for:` is Claude's discretion). Checklists: `kind: checklist` + `tier: lean | enterprise`.
3. `tier:` value per the LOCKED D-14 assignment — **lean** = definition-of-ready, definition-of-done, pr-review-checklist, security-nfr-checklist, uat-checklist; **enterprise** = definition-of-done-enterprise, compliance-checklist, accessibility-checklist, observability-slo-checklist, release-readiness-checklist.
4. The spec-verbatim body sits unchanged below the frontmatter (D-00). Frontmatter is additive metadata only.

### Shared Pattern C — Stable ID scheme (for v2 handoff titles + ADR template)

**Source:** `plans/traceability.md` lines 17-26 (inside the FORMAT comment) — the frozen ID scheme the v2 handoffs cite. **Cite, do not redefine** (frozen Phase 1).

Concrete excerpt — `plans/traceability.md` lines 17-26:
```text
  Stable ID scheme (set the ticket prefix in config `id_prefix`, default `ABC`):

    EPIC-xxx     epic
    FEAT-xxx     feature
    <prefix>-xxx ticket (project prefix + number; prefix from config `id_prefix`, default `ABC`)
    ADR-000x     architecture decision
    NFR-xxx      non-functional requirement
    RISK-xxx     risk
    REL-xxxx     release
    INC-xxxx     incident
```

**Application:** `release-handoff.md` title → `REL-xxxx`; `incident-postmortem.md` title → `INC-xxxx`; ADR cross-refs use `ADR-000x` (real ADRs) but the template file itself is named `ADR-template.md` (non-numeric, D-12 — must NOT match `ADR-\d{4}`); `security-nfr-handoff.md` / `architecture-handoff.md` cite `NFR-xxx` against `plans/nfr-catalog.md`.

### Shared Pattern D — `00-index.md` orientation file (prose, maps a plane in one read)

**Source:** `agent-factory/README.md` (the existing top-of-plane orientation doc) for the prose/orientation tone + table-as-summary device; combined with Pattern A's opener (`# Title` / `_Updated:_`).
**Apply to:** `checklists/00-index.md` and `memory-bank/00-index.md`.

The README models the right shape: short prose, a summary table that maps each item to its purpose/owner, lowercase `grugops`, clear voice, anti-bloat. Replicate that for the two indexes (a small table listing the 10 checklists grouped lean vs enterprise + the one-line mode-gating rule for `checklists/00-index.md`; the 00→80 file map + working-memory contract for `memory-bank/00-index.md`).

---

## Pattern Assignments

### Group 1 — Per-role handoffs + universal header + 2 packets (11 files: `agent-factory/handoffs/`)

**Analogs:** Pattern A (opener + voice + no-data), Pattern B (`kind: handoff` frontmatter).

- **Universal header (`universal-handoff.md`)** is the canonical source; the §8 verbatim header is captured in `02-RESEARCH.md` lines 281-301 (incl. v2 `Ticket ID:` and `## Trace updates`). **Recommendation (D-disc, A2): inline the full header into each per-role file** so each is independently copy-paste-usable (HAND-01), AND keep `universal-handoff.md` as the canonical reference. A pointer-only per-role file fails "copy-paste usable."
- **Per-role section bodies** come from the §5.A map in `02-RESEARCH.md` lines 266-278 (product←§5.A.5 … uat←§5.A.11). Transcribe section names verbatim — do not invent parallel ones.
- **3 derived files** (`business-handoff`, `ticket-ready-packet`, `implementation-ready-packet`) have no §5.A spec; structure them per D-09 (CONTEXT.md L41-44). `ticket-ready-packet.md` must carry a field for each `definition-of-ready.md` check and cross-reference that file by name (Pattern C of RESEARCH — cross-reference integrity).
- **Frontmatter:** `kind: handoff` + stage (Pattern B). `## Trace updates` field links into `plans/traceability.md` (frozen — cite only; do NOT add board-move/trace *behavior*, that is Phase 4).

**Consistency requirement:** the universal header must be byte-identical across all 11 core handoffs — `Ticket ID:` and `## Trace updates` present and unrenamed in every one (RESEARCH Pitfall 2).

### Group 2 — v2 handoffs (5 files: `agent-factory/handoffs/`)

**Analogs:** Pattern A (style/voice), Pattern B (`kind: handoff`), Pattern C (IDs).

- Transcribe §8.1-8.5 verbatim — the exact shapes are in `02-RESEARCH.md` lines 355-413 (`release-handoff` L357-376, `incident-postmortem` L378-391, `retro-notes` L393-400, `refinement-notes` L402-411, `sprint-plan` L413). Do NOT reword (D-00).
- Titles use the frozen IDs (Pattern C): `REL-xxxx`, `INC-xxxx`.
- `incident-postmortem.md` is **blameless** — "Root cause (systemic, not personal)" wording is locked; clear voice mandatory (brand §4.3).
- `retro-notes.md` `## Metrics snapshot` references `plans/metrics.md` metric names (frozen — cite). `sprint-plan.md` mirrors `plans/sprints/SPRINT-xx.md` (currently `.gitkeep` only).

### Group 3 — Checklists (10 files: `agent-factory/checklists/`)

**Analogs:** Pattern A (style/voice), Pattern B (`kind: checklist` + `tier:`, D-14 assignment).

- Transcribe §9.1-9.10 verbatim (bullet lists; spec lines ~877-1000 — the planner reads the spec directly for byte-fidelity, per `02-RESEARCH.md` L415-417). No rewording/reordering (D-00, RESEARCH Pitfall 1).
- `definition-of-done-enterprise.md` body must begin literally **"All of lean DoD, plus:"** (D-00).
- `tier:` value per the LOCKED D-14 split (see Pattern B rule 3).
- `definition-of-ready.md` authored FIRST (verbatim §9.1); `ticket-ready-packet.md` (Group 1) derives its fields 1:1 from it (RESEARCH Pitfall 3).
- Security/compliance/observability checklists (§9.5/§9.6/§9.8) are clear-voice-only (brand §4.3 forbids grug voice in security/compliance content) and must reproduce controls verbatim — never fabricate a control (no-fabrication constraint).

### Group 4 — Index / orientation files (2 files)

**Analogs:** Pattern D (README orientation) + Pattern A opener.

- `checklists/00-index.md` (D-14): short table listing all 10 checklists grouped **lean vs enterprise**, plus the one-line mode-gating rule ("Orchestrator applies lean DoD in lean mode, enterprise DoD in enterprise mode"). Satisfies the human-readable "clearly distinguished" SC#3.
- `memory-bank/00-index.md` (D-11): maps the 00→80 file set for one-read orientation AND states the working-memory contract (MEM-02): roles read the bank on start; `60-progress.md` is the running plan-of-record kept current by the daily sweep; `50-decisions/` captures ADRs as made. Anti-bloat (same rule as AGENTS.md — keep small).
- Frontmatter on indexes is Claude's discretion (`kind: index` or omit; decide once — see Open Decisions).

### Group 5 — Memory-bank seed + ADR template (8 files: `memory-bank/`)

**Analogs:** Pattern A (empty-but-shaped is strict here), Pattern C (ADR `ADR-000x` reference scheme).

- Each of `10-project-brief / 20-product / 30-architecture / 40-contributing / 60-progress / 70-runbook / 80-glossary.md` = `# Title` + one-line purpose + section stubs showing the shape (use the Pattern A FORMAT-comment device for the purpose/hint). **Generic, project-agnostic, zero grugops-specific content** (D-04/D-10) — grugops's own state stays in `.planning/`. Keep each comfortably small (advisory ~under 40 lines; RESEARCH Open Q3).
- `50-decisions/ADR-template.md` (D-12): ADR shape is in `02-RESEARCH.md` lines 420-429 — status / context / decision / alternatives / consequences / rollback (per §5.A.7). **No example values, no example ADR** (D-03). File named `ADR-template.md` (non-numeric) so it does NOT match the validator's `ADR-\d{4}` pattern; `.gitkeep` already present.
- Do NOT seed `brownfield-map.md` / `greenfield-plan.md` — those are Phase-3/4 runtime outputs (CONTEXT.md Deferred).

---

## Frozen Vocabulary These Contracts Cite (reference only — never redefine)

| Asset | Path | Cited by | Exact names (already frozen) |
|-------|------|----------|------------------------------|
| Board columns + WIP | `plans/board.md` | universal header context (board moves are Phase 4) | 13 columns L58-72; ticket frontmatter L37-42 |
| Trace matrix columns | `plans/traceability.md` | universal `## Trace updates` field | `Ticket \| Title \| Epic \| Feature \| NFRs \| Code (PR/files) \| Tests \| UAT \| Release \| Status` (L36) |
| NFR catalog columns | `plans/nfr-catalog.md` | security-nfr + observability-slo + architecture handoffs | `ID \| Category \| Target \| Applies to \| Verified by` (L24); IDs `NFR-xxx` |
| Metric names | `plans/metrics.md` | retro-notes `## Metrics snapshot`, release flows | Throughput, Cycle time, Lead time, WIP, Blocked time, Rework rate, Gate pass rate, Escaped defects, Velocity (L17-25) |
| Config dial | `agent-factory/config/factory.config.json` (+ `.md`) | checklist tier-gating (`mode`); enterprise checklists cite `quality`/`nfr`/`compliance_regime` | field names from config |
| Stable ID scheme | `plans/traceability.md` L17-26 | release/incident handoffs, ADR refs | `EPIC-/FEAT-/<prefix>-/ADR-000x/NFR-xxx/RISK-xxx/REL-xxxx/INC-xxxx` |

## No Analog Found

None. Every Phase-2 file maps to one of the four frozen Phase-1 markdown patterns (A–D). The only "gap" is the spec-verbatim *content* of §8/§9/§5.A, which is not an analog but a transcription source (D-00) — captured in `02-RESEARCH.md` (universal header L281-301, v2 templates L355-429, per-role section map L266-278) and read directly from `docs/initial/agent_factory_builder_spec_v2.md` for byte-fidelity.

## Open Decisions (Claude's Discretion — flagged for planner)

1. **Universal header location:** inline in each per-role file (recommended, A2) vs pointer-only. Recommendation: inline + keep `universal-handoff.md` canonical.
2. **Frontmatter on `00-index.md` files:** `kind: index` vs omit. Decide once, apply to both indexes consistently.
3. **`_Updated:_` form:** `_Updated: <date>_` (metrics/trace/nfr style) vs `_Updated: <ISO date> by <role>_` (board style). Pick one for all Phase-2 files.
4. **Frontmatter stage field name:** `stage:` / `for:` / `role:` — 2-3 high-signal fields total (D-13).

## Metadata

**Analog search scope:** `plans/` (board, traceability, nfr-catalog, metrics, tickets, sprints), `agent-factory/` (README, config, target dirs), `memory-bank/`, `.planning/phases/01-*` (CONTEXT + SUMMARY frontmatter precedent).
**Files scanned:** 7 read in full (`plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md`, `agent-factory/README.md`, `01-04-SUMMARY.md`, + the two phase docs); target dirs confirmed `.gitkeep`-only via `ls`.
**Pattern extraction date:** 2026-06-02
