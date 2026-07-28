# Phase 4: Workflows, Cadence & Backpressure - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 14 workflow files (+ 1 Wave-0 harness)
**Analogs found:** 14 / 14 (every file maps to a verified frozen artifact + the shared 10-section template)

> **Orientation for the planner.** This is a markdown-authoring phase with no runtime code and no data flow. The "analog" for each new workflow file is the closest **existing frozen markdown artifact** whose frontmatter + ordered-section shape + naming/citation conventions the new file should replicate. The single richest analog is `agent-factory/roles/orchestrator.md` (it already carries `kind:` frontmatter, ordered `##` sections, the routing table, board-moves/trace-updates sections, clear-voice hard-limits, and a light grug wink in framing). Every frozen name cited below was verified on disk on 2026-06-03 by `ls`/`grep` — **cite these exact names, invent nothing** (D-24). Where a name could not be verified it is marked `UNKNOWN - verify`.

---

## File Classification

grugops has no code roles/data-flow; the meaningful classification is **tier** (lifecycle / ceremony / enterprise) and **cadence applicability** (both / scrum-only). "Closest analog" = the frozen file whose structure the new workflow mirrors.

| New workflow file (`agent-factory/workflows/`) | Tier | Cadence | Closest structural analog (verified path) | Match |
|---|---|---|---|---|
| `00-bootstrap-greenfield.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` (frontmatter + ordered `##` sections + Board moves/Trace updates) | shape-match |
| `01-bootstrap-brownfield.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` | shape-match |
| `02-idea-to-epics.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` | shape-match |
| `03-epic-to-tickets.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` | shape-match |
| `04-ticket-to-pr.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` (+ board-path sequencing pattern) | shape-match |
| `05-pr-quality-gate.md` | lifecycle (gate) | both | `agent-factory/roles/orchestrator.md` + spec §14 loop block (single-source home) | shape-match + verbatim spine |
| `06-uat-pack.md` | lifecycle | both | `agent-factory/roles/orchestrator.md` | shape-match |
| `07-backlog-refinement.md` | ceremony | both | `agent-factory/roles/orchestrator.md` (expand §7.8 one-liner → 10 sections) | shape-match |
| `08-sprint-planning.md` | ceremony | **scrum only** | `agent-factory/roles/orchestrator.md` + spec §6.2 `SPRINT-xx.md` format | shape-match + verbatim format |
| `09-daily-sweep.md` | ceremony | both | `agent-factory/roles/orchestrator.md` (expand §7.10 one-liner) | shape-match |
| `10-sprint-review.md` | ceremony | **scrum only** | `agent-factory/roles/orchestrator.md` + `SPRINT-xx.md` (appends) | shape-match |
| `11-retro.md` | ceremony | both | `agent-factory/roles/orchestrator.md` + `agent-factory/handoffs/retro-notes.md` | shape-match |
| `12-release.md` | enterprise | both (opt. in lean) | `agent-factory/roles/release-manager.md` (verbatim deploy-gate prose) | role-match (closest semantic analog) |
| `13-incident.md` | enterprise | both | `agent-factory/roles/orchestrator.md` + `agent-factory/handoffs/incident-postmortem.md` | shape-match |
| `check-structure.sh` (Wave-0 harness) | tooling | n/a | `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` | exact precedent |

---

## Shared Patterns (apply to ALL 14 workflow files)

### Pattern S1 — Minimal `kind:` frontmatter (D-13 → D-16 → D-27)
**Source:** every frozen shipped file. Verified examples:
- `agent-factory/roles/orchestrator.md` lines 1–4: `kind: role` + `tier: core`
- `agent-factory/handoffs/universal-handoff.md` lines 1–4: `kind: handoff` + `stage: universal`
- `agent-factory/checklists/definition-of-ready.md` lines 1–4: `kind: checklist` + `tier: lean`

```markdown
---
kind: workflow
---
# Workflow: <name>
```
Use `kind: workflow` (the frozen pattern is one `kind:` key + optionally 1–2 high-signal fields, 2–3 total — no bloat). Discretion: add `order` / `cadence` / `tier` per D-27.

### Pattern S2 — The 10-section v2 template, headings in order (FLOW-05; spec §7 L719–732)
**Source:** spec, reproduced verbatim in RESEARCH.md (the heading order is load-bearing — the Phase-6 validator and the Wave-0 harness check presence AND increasing line order).

```markdown
## When to use
## Agents involved
## Inputs required
## Steps
## Board moves
## Handoffs produced
## Trace updates
## Metrics emitted
## Stop conditions
## Done condition
```
The role analog shows the same "ordered `##` sections under an H1" shape (orchestrator.md `## One job` → `## Hard limits`). The workflow heading SET differs (it is the §7 template, not the §5 role skeleton) but the structural pattern to mirror is identical.

### Pattern S3 — Board-move sequencing, full left→right path (D-23)
**Source:** `plans/board.md` lines 58–72 — the 13-column table with **exit owners** (verified). Roles declare ONE transition; the workflow composes the full path.
- Frozen columns (cite exactly, in flow order): `Backlog`, `Ready`, `In Analysis`, `In Design`, `Ready for Dev`, `In Development`, `In Review`, `In Security/NFR`, `Ready for UAT`, `In UAT`, `Ready to Release`, `Done`, `Blocked`.
- Example composed path (`04-ticket-to-pr` `Board moves`): `Ready for Dev → In Development → In Review (→ In Security/NFR)`.
**Drift guard:** any column not in this 13-list is invented → fail. WIP defaults live in `factory.config.json#wip_limits` (board.md mirrors them) — name them, do not redefine.

### Pattern S4 — Handoff citation (Handoffs produced section)
**Source:** `agent-factory/handoffs/` (16 files, all verified). Real handoffs live under `agent-factory/handoffs/`, **never** `plans/*-handoff` (Pitfall 1 / harness check (f) in the Phase-3 precedent guards exactly this). The universal header carries `## Trace updates` (universal-handoff.md line 21) — the workflow's `Trace updates` section names what that links.
Frozen handoff filenames: `universal-handoff.md`, `business-handoff.md`, `product-handoff.md`, `system-handoff.md`, `architecture-handoff.md`, `implementation-handoff.md`, `qe-handoff.md`, `security-nfr-handoff.md`, `uat-handoff.md`, `ticket-ready-packet.md`, `implementation-ready-packet.md`, `release-handoff.md`, `incident-postmortem.md`, `retro-notes.md`, `refinement-notes.md`, `sprint-plan.md`.

### Pattern S5 — Trace + Metrics citation
**Source:**
- `plans/traceability.md` lines 36–37 — fixed 10 columns (cite, never reorder): `Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status`.
- `plans/metrics.md` lines 17–25 — 9 named metrics (cite a subset): `Throughput`, `Cycle time`, `Lead time`, `WIP`, `Blocked time`, `Rework rate`, `Gate pass rate`, `Escaped defects`, `Velocity` (scrum-only).

### Pattern S6 — Two-voice discipline (D-21 → D-27)
**Source:** `agent-factory/roles/orchestrator.md` and `release-manager.md`. The clear-voice, precise hard-limit prose is the model for every `Steps`/`Board moves`/gate/`Stop conditions`/safety line:
- orchestrator.md line 119: `Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason.`
- orchestrator.md line 121: `(These are absolute and stated in clear voice — humans always hold merge and deploy.)`
A light grug wink is permitted ONLY in framing prose (e.g. a `When to use` opener) — never in a gate/approval/stop/safety line.

### Pattern S7 — SAFE-01 as dispatch-neutral prose (D-27)
**Source (verbatim deploy-gate to mirror):** `agent-factory/roles/release-manager.md` lines 33, 49:
- line 33: `Stop at the human gate: the release is prepared, but deploy to production happens only after a named human approves.`
- line 49: `Deploy only after a named human approves; production action is always human-confirmed. You require approval, and you never deploy prod yourself.`
Render in prose, clear voice. **No** `hooks.json` / `PreToolUse` / `${CLAUDE_PLUGIN_ROOT}` / subagent language (that mechanism is Phase 5 / SAFE-02 — Pitfall 5).

### Pattern S8 — `kind: workflow` config-key citation
**Source:** `agent-factory/config/factory.config.json` (verified keys):
- line 4 `"cadence": "kanban"`, line 5 `"autonomy": "pr"`, line 45 `"production_requires_human_confirmation": true`, line 46 `"blocked_escalation_days": 2`
- `quality` block lines 33–36: `coverage_threshold: 0.8`, `self_fix_attempts: 2`, `mandatory_gates: ["lint","typecheck","unit","build"]`, `e2e_when: "ui-or-critical-path"`.

---

## Pattern Assignments (per file)

> For every file: apply S1, S2 (always), plus the per-file frozen names below. The structural `read_first` for all 14 is `agent-factory/roles/orchestrator.md` (frontmatter + ordered-section + board-moves/trace-updates shape) and the §7 template in RESEARCH.md.

### `00-bootstrap-greenfield.md` (lifecycle, both)
**Analog:** `agent-factory/roles/orchestrator.md` (shape). **Flow spine (spec §7.1):** `idea → Orchestrator → Greenfield Mapper → AGENTS.md Scribe → BA/PM → System Analyst → Architect/Design → initial tickets`.
**Frozen names to cite:**
- Roles/board: greenfield-mapper (no board move → `memory-bank/greenfield-plan.md`), agents-md-scribe (no board move → root `AGENTS.md`), ba-pm (`Backlog → Ready` → `product-handoff.md`; tickets → `plans/tickets|epics|features/`), system-analyst (`In Analysis` exit → `system-handoff.md`), architect-design (`In Design` exit → `architecture-handoff.md` + ADRs into `memory-bank/50-decisions/` + seeds `plans/nfr-catalog.md`).
- Seeds `plans/board.md`, `factory.config.json`. `When to use` opener should echo README bootstrap prompt phrasing (Open Question 2).
- `plans/initial-plan.md` does **NOT** exist on disk (verified absent) → leave a thin stub / name `memory-bank/greenfield-plan.md` as the planning output (Open Question 1; planner discretion).

### `01-bootstrap-brownfield.md` (lifecycle, both)
**Analog:** `agent-factory/roles/orchestrator.md`. **Flow (spec §7.2):** `existing repo → Orchestrator → Brownfield Mapper → AGENTS.md Scribe → Architect/Design review → Security/NFR high-risk scan → safe first tickets`.
**Frozen names:** brownfield-mapper (no board move → `memory-bank/brownfield-map.md`), agents-md-scribe (root `AGENTS.md`), architect-design (review), security-nfr (`In Security/NFR` exit → `security-nfr-handoff.md`, result `PASS | PASS_WITH_RISKS | BLOCKED`). Seeds `plans/board.md`. AGENTS.md command slots stay `UNKNOWN - verify` (filled at runtime, never here).

### `02-idea-to-epics.md` (lifecycle, both)
**Analog:** `agent-factory/roles/orchestrator.md`. **Flow (spec §7.3):** `idea → BA/PM → product-handoff → epics`.
**Frozen names:** ba-pm (`Backlog → Ready` → `agent-factory/handoffs/product-handoff.md`; epics → `plans/epics/`). Trace: appends Epic/Feature rows to `plans/traceability.md`.

### `03-epic-to-tickets.md` (lifecycle, both)
**Analog:** `agent-factory/roles/orchestrator.md`. **Flow (spec §7.4):** `epic → BA/PM → System Analyst (if behavior unclear) → tickets`.
**Frozen names:** ba-pm (sizes/prioritizes → tickets → `plans/tickets/`), system-analyst (`In Analysis` → `agent-factory/handoffs/system-handoff.md`). Applies `agent-factory/checklists/definition-of-ready.md`; appends a row to `plans/traceability.md` (10 cols). `Done condition` per spec: each ticket has value/scope/acceptance/test-notes/security-NFR-triggers/**size**/**priority**/**trace row**.

### `04-ticket-to-pr.md` (lifecycle, both) — SPECIAL CASE
**Analog:** `agent-factory/roles/orchestrator.md` + board-path-sequencing (Pattern S3). **Flow (spec §7.5):** `ticket → Orchestrator readiness check → Software Engineer → QE/E2E → Security/NFR (if triggered) → final implementation packet`. **Board:** `Ready for Dev → In Development → In Review (→ In Security/NFR)`.
**Frozen names:** Orchestrator (`Ready for Dev → In Development`, DoR gate via `agent-factory/checklists/definition-of-ready.md`), software-engineer (`In Development → In Review` → `agent-factory/handoffs/implementation-handoff.md`), qe-e2e (`In Review` exit → `qe-handoff.md`), security-nfr (if triggered → `security-nfr-handoff.md`).
**SPECIAL (D-26):** `04` **references** `05-pr-quality-gate.md` for the gate loop — e.g. "run the quality gate per `05-pr-quality-gate.md`". It **MUST NOT restate** the loop. Harness asserts `04` contains the string `05-pr-quality-gate.md` and does **NOT** contain `READY_FOR_HUMAN_REVIEW` (the terminal tokens and the six gate verbs must not appear here — Pitfall 2).
**SAFE-01 (S7):** honors `autonomy=pr` — branch + open PR, **never merge**. Cite `autonomy=pr` + "never merge" in prose.

### `05-pr-quality-gate.md` (lifecycle gate, both) — SPECIAL CASE: §14 SINGLE-SOURCE HOME
**Analog:** `agent-factory/roles/orchestrator.md` (shape) + the spec §14 loop block (verbatim-faithful spine). **This is the ONLY file that carries the loop (D-26).**
**Flow (spec §7.6):** `implementation → QE/E2E → Security/NFR → Architect/Design (if structure changed) → Orchestrator recommendation`.
**The §14 loop to reproduce (faithfully, clear voice) — read RESEARCH.md §"The §14 Backpressure Loop":**
1. Deterministic prefetch (Orchestrator gathers context BEFORE code is written)
2. Implement on a branch (`autonomy=branch|pr`)
3. Run the gate: `install → lint → typecheck → unit → build → e2e` (commands from `AGENTS.md`)
4. Bounded self-fix: `self_fix_attempts` (default 2) then STOP and hand to a human ("two rounds then human")
5. Result: one of the three terminal tokens
6. Human reviews / merges / (human-confirmed) deploys
**Terminal tokens (exact, grep-checkable — must all three appear in `05`):** `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`.
**Frozen names:** qe-e2e, security-nfr, architect-design (if structure changed), Orchestrator (recommendation only — **never auto-merges**). Cites `agent-factory/checklists/pr-review-checklist.md`. Knobs from `factory.config.json#quality` (S8). Emits `Gate pass rate` metric.
**No-fabrication (GATE-01):** gate commands are pulled from root `AGENTS.md`'s 7 command slots at runtime — **all currently ship `UNKNOWN - verify`** (verified: AGENTS.md lines 30–61, `### Install`/`Development`/`Test`/`Lint`/`Typecheck`/`Build`/`E2E`). `05` must contain `UNKNOWN - verify`; do **NOT** hard-code real commands like `npm test`.
**SAFE-01 (S7):** `05` emits a *recommendation* a human reviews — never auto-merges. Use "recommendation" / human-review prose.

### `06-uat-pack.md` (lifecycle, both)
**Analog:** `agent-factory/roles/orchestrator.md`. **Flow (spec §7.7):** `feature complete → UAT Planner → BA/PM validation → QE validation → UAT pack`.
**Frozen names:** uat-planner (`Ready for UAT → In UAT`, owns `In UAT` exit → `agent-factory/handoffs/uat-handoff.md`; works `agent-factory/checklists/uat-checklist.md`), ba-pm + qe-e2e validation. `Done condition`: ticket → `Ready to Release` (or `Done` in lean).

### `07-backlog-refinement.md` (ceremony, both) — expand §7.8 one-liner → 10 sections
**Analog:** `agent-factory/roles/orchestrator.md`. **§7.8:** When=regularly/before planning; Agents=BA/PM (+ System Analyst, + Architect/Design for spikes); Steps=pull top of Backlog, clarify, split XL, size, prioritize, mark security/NFR triggers, push DoR-met items into `Ready`.
**Frozen names:** ba-pm (`Backlog → Ready` after `agent-factory/checklists/definition-of-ready.md`); Output: `agent-factory/handoffs/refinement-notes.md` (verified `stage: refinement`); Orchestrator enforces `SPLIT_REQUIRED` (no XL into dev). Declares cadence = **both**.

### `08-sprint-planning.md` (ceremony, SCRUM ONLY) — SPECIAL CASE: SPRINT format
**Analog:** `agent-factory/roles/orchestrator.md` + the spec §6.2 `SPRINT-xx.md` format (reproduce VERBATIM — see RESEARCH.md §"The §6.2 SPRINT-xx.md Format"). **§7.9:** `cadence=scrum`; When=start of sprint; Agents=Orchestrator + BA/PM; Steps=set one-sentence goal, pull from `Ready` by priority up to capacity, confirm each item Ready, write the sprint file.
**Frozen names:** writes `plans/sprints/SPRINT-xx.md` (dir verified, ships `.gitkeep` only — runtime-populated). May emit `agent-factory/handoffs/sprint-plan.md` (verified `stage: sprint-plan`) as a one-off packet (§8.5).
**SPECIAL (BOARD-03):** must contain `cadence=scrum`; reference `plans/sprints/SPRINT-xx.md`; name the format fields `Goal / Committed / Velocity / Burndown` (full field list: Goal/Dates/Capacity/Committed/Added mid-sprint/Carried out/Velocity/Burndown/Notes for retro). `Stop condition`: if `Ready` too thin, run `07-backlog-refinement` first. Declares cadence = **scrum only**.

### `09-daily-sweep.md` (ceremony, both)
**Analog:** `agent-factory/roles/orchestrator.md`. **§7.10 (both cadences):** the standup-equivalent board-reconciliation pass the Orchestrator runs on demand/schedule.
**Frozen names:** Orchestrator (no new handoff); updates `plans/board.md`, `plans/metrics.md`, `memory-bank/60-progress.md`; escalates anything blocked past `factory.config.json#blocked_escalation_days` (verified =2); recommends next pull respecting WIP. Metrics: name `Cycle time` / `WIP` / `Blocked time` (subset of the 9).
**Discretion:** the "sweep report" wording (done/next/blocked) is discretionary (A1). Declares cadence = **both** (it is the BOARD-02 reconciliation engine).

### `10-sprint-review.md` (ceremony, SCRUM ONLY)
**Analog:** `agent-factory/roles/orchestrator.md` + `SPRINT-xx.md` (appends to it). **§7.11:** `cadence=scrum`; When=end of sprint; Agents=UAT Planner + BA/PM (+ QE); Steps=assemble what reached `Done`, validate vs acceptance, draft demo/release notes, list carry-over with reasons.
**Frozen names:** uat-planner + ba-pm (+ qe-e2e); appends review notes to `plans/sprints/SPRINT-xx.md`; emits `Velocity` metric. Must contain `cadence=scrum`. Declares cadence = **scrum only**.

### `11-retro.md` (ceremony, both)
**Analog:** `agent-factory/roles/orchestrator.md` + `agent-factory/handoffs/retro-notes.md` (verified `stage: retro`, opens `## Metrics snapshot`). **§7.12 (both; light in lean):** When=end of sprint / monthly in Kanban; Agent=Factory Coach; Steps=read `plans/metrics.md` + board history, identify top 1–3 wastes, write notes, create 1–3 improvement tickets tagged `factory`.
**Frozen names:** factory-coach (no board move) → `agent-factory/handoffs/retro-notes.md`; reads `plans/metrics.md`; tickets → `plans/tickets/` tagged `factory`. Declares cadence = **both** (light in lean).

### `12-release.md` (enterprise, both/opt-lean) — SPECIAL CASE: named-human release gate
**Analog:** `agent-factory/roles/release-manager.md` (closest semantic analog — it carries the verbatim deploy-gate prose to render). **§7.13:** `Ready to Release → Release Manager → approval gate → deploy plan → (human-confirmed) deploy → Done`.
**Frozen names:** release-manager (`Ready to Release → Done` ONLY after named human approves → `plans/releases/REL-xxxx.md` (dir verified, `.gitkeep` only) + `agent-factory/handoffs/release-handoff.md`); cites `agent-factory/checklists/release-readiness-checklist.md`; attaches `plans/nfr-catalog.md` evidence (verified present). Status: `READY_TO_RELEASE | BLOCKED | RELEASED`.
**SPECIAL (SAFE-01, S7):** render the named-human-confirm release gate in prose, clear voice, keyed to `production_requires_human_confirmation: true` (config line 45). Reuse the release-manager.md lines 33/49 phrasing ("named human approves"; "human-confirmed"; "never deploy prod yourself"). Harness asserts `12` contains "named human" / "human-confirmed" + `production_requires_human_confirmation`. Declares mode = **enterprise** (optional in lean).

### `13-incident.md` (enterprise, both) — SPECIAL CASE: blameless postmortem
**Analog:** `agent-factory/roles/orchestrator.md` (shape) + `agent-factory/handoffs/incident-postmortem.md` (verified `stage: incident`; line 7 header `## Root cause (systemic, not personal)`). **§7.14:** `incident detected → Incident Responder → mitigate/rollback → blameless postmortem → follow-up tickets`.
**Frozen names:** incident-responder (no board move) → `agent-factory/handoffs/incident-postmortem.md`; follow-up tickets → `plans/tickets/` → `Backlog`; feeds factory-coach.
**SPECIAL (FLOW-04):** must cite `incident-postmortem.md` and render the blameless path — "blameless" / "never blames a person" (the analog's `## Root cause (systemic, not personal)` heading is the frozen anchor for this). Declares mode = **enterprise**.

### `check-structure.sh` (Wave-0 harness) — exact precedent
**Analog:** `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` (verified, executable). Copy its structure exactly: `#!/usr/bin/env sh` + `set -eu`, `pass()/fail()` helpers, lettered check blocks `[a]…[g]`, `grep -L`/`grep -c`/`wc`/`test` only, increasing-line-order section checks, frozen-path drift guard (check (f): `grep -l -E 'plans/.*-handoff'`), final PASS/FAIL exit 0/1. Ships RED first; goes green as files land. The Phase-4 checks are inventoried in RESEARCH.md §"Phase Requirements → Test Map" (file-presence ×14, 10-section order, `kind: workflow`, routing match, §14 single-source in `05`, `04`-references-`05`, cadence tags, SAFE-01 prose, drift guard, blameless incident).

---

## No Analog Found

None. Every workflow maps to a verified frozen artifact + the shared 10-section template. The only "newness" is connective tissue (the derived `Steps`/`Board moves`/`Trace`/`Metrics`/`Stop` bullets), which D-24 requires be **derived by citing the frozen names above — invented nothing**. There is no file in this phase without a structural analog and a frozen-name set.

| File | Reason it still has an analog |
|------|-------------------------------|
| (all 14) | Structure ← `orchestrator.md` / role files; names ← verified frozen inventory; spine ← spec §7/§14/§6.2 |

---

## Metadata

**Analog search scope:** `agent-factory/roles/` (16 files), `agent-factory/handoffs/` (16), `agent-factory/checklists/` (11 incl. index), `agent-factory/config/factory.config.json`, `plans/` (`board.md`, `traceability.md`, `metrics.md`, `nfr-catalog.md`, `sprints/`, `releases/`, `tickets/`, `epics/`, `features/`), root `AGENTS.md`, `agent-factory/README.md`, `.planning/phases/03-roles-agents-md-substrate/check-structure.sh`.
**Files scanned (read in full):** `orchestrator.md`, `release-manager.md`, `universal-handoff.md`, `definition-of-ready.md`, `incident-postmortem.md`, phase-03 `check-structure.sh`. Grep-verified: board columns, metrics, traceability columns, config keys, AGENTS.md command slots, README workflow-number anchors, handoff frontmatter (`refinement-notes`/`retro-notes`/`sprint-plan`).
**Verification result:** all analog paths and all cited frozen names exist on disk (2026-06-03). `plans/initial-plan.md` confirmed **absent** (consistent with leave-as-stub). Root `README.md` absent; the copy-paste prompts live at `agent-factory/README.md` (lines 95/99/105/108/111 reference workflows `08/09/05/06/12` by number). No `UNKNOWN - verify` flags on analog selection; the only intentional `UNKNOWN - verify` is the gate-command content inside `05` (by design, never fabricated).
**Pattern extraction date:** 2026-06-03

## PATTERN MAPPING COMPLETE
