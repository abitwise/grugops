# Phase 4: Workflows, Cadence & Backpressure - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 **composes the 16 finished roles into the runnable delivery flow** — the full set of workflow files plus the two selectable cadences and the bounded backpressure quality gate. After this phase, the program written in Phase 3 becomes a sequenced, runnable lifecycle. Concretely it delivers:

- **14 numbered workflow files** (`agent-factory/workflows/`), each on the v2 **10-section template** (§7): `00-bootstrap-greenfield`, `01-bootstrap-brownfield`, `02-idea-to-epics`, `03-epic-to-tickets`, `04-ticket-to-pr`, `05-pr-quality-gate`, `06-uat-pack`, `07-backlog-refinement`, `08-sprint-planning`, `09-daily-sweep`, `10-sprint-review`, `11-retro`, `12-release`, `13-incident`. Each produces the right board moves, handoffs, trace updates, metrics, and stop/done conditions. **(FLOW-01, FLOW-02, FLOW-04, FLOW-05)**
- **The backpressure quality gate** (`05-pr-quality-gate.md`): the §14 loop — deterministic prefetch → implement on branch → gate (install → lint → typecheck → unit → build → e2e, commands from AGENTS.md) → bounded self-fix (config, default 2) → terminal result `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`; missing commands recorded `UNKNOWN - verify`, never faked. **(GATE-01)**
- **Both cadences selectable by config** (`cadence=kanban` default | `cadence=scrum`): Kanban continuous-pull (WIP throttle, daily-sweep reconciliation, cycle-time focus) and Scrum time-boxed sprints (`plans/sprints/SPRINT-xx.md` goal/committed/velocity/burndown + the full ceremony set), encoded as ONE workflow set gated per-file by cadence. **(BOARD-02, BOARD-03, FLOW-03)**
- **"Humans decide, agents execute" across every workflow**: `autonomy=pr` default; no workflow step merges a protected branch or deploys to production without named human confirmation (rendered as prose human-confirm gates this phase). **(SAFE-01)**

**This phase writes the workflows that sequence role behavior — not new role behavior (Phase 3, frozen), not the per-tool adapters / Claude wrappers / install scripts / mechanical prod-deploy hook (Phase 5), not the validator / brand / dogfood (Phase 6).** Workflows NAME and sequence the frozen roles' board moves + handoffs + trace updates; they do not redefine roles, columns, handoff sections, or config fields — all of those are frozen by Phases 1–3 and cited by name.

**Requirements:** FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, BOARD-02, BOARD-03, GATE-01, SAFE-01.

</domain>

<decisions>
## Implementation Decisions

### Baseline carried forward (apply without re-asking)
- **D-00 (LOCKED — reproduce, do NOT redesign):** The spec is authoritative for the content it already fixes. Reproduce exactly, derive nothing that the spec gives:
  - **§7 workflow template (lines ~719–732)** — the **10 section headings in order** every workflow file uses: `When to use / Agents involved / Inputs required / Steps / Board moves / Handoffs produced / Trace updates / Metrics emitted / Stop conditions / Done condition`.
  - **§7.1–7.14** — each workflow's **`Flow:` line and `Done when:` condition** (and the ceremony `When/Agents/Steps/Output` one-liners) are spec-given; reproduce them faithfully as the spine of each file.
  - **§14 (CI/CD and Backpressure, lines ~1128–1146)** — the **6-step backpressure pattern** and the "commands come from AGENTS.md / `UNKNOWN - verify` not faked / two rounds then human / knobs from config" rules.
  - **§6.2 (lines ~635–677)** — the two cadences and the **`SPRINT-xx.md` format** (Goal / Dates / Capacity / Committed / Added-mid-sprint / Carried-out / Velocity / Burndown / Notes-for-retro).
- **D-04 (Shipped-kit identity):** `agent-factory/workflows/*` are the **generic, project-agnostic user-facing kit TEMPLATE**. grugops's OWN build state stays in `.planning/`; the two must not be conflated. Workflows describe any repo running the factory.
- **D-20 (Orchestrator names workflows, doesn't inline — now the reciprocal):** Phase 3's Orchestrator already encodes the exact `classification → workflow-filename` mapping (the 14 files) and the `# Orchestrator Decision` output. **Phase-4 workflows MUST stay consistent with that mapping AND with `agent-factory/README.md`'s copy-paste Orchestrator prompts** (bootstrap / refine / plan / sweep / ticket→PR / gate / UAT / release). Filenames, classification names, and the routing contract are frozen — do not rename or renumber.
- **D-23 (board-moves granularity — the reciprocal):** Roles state the column transitions *they* cause at role granularity; **Phase-4 workflows sequence the FULL left→right path** between columns (e.g. `04-ticket-to-pr` sequences `Ready for Dev → In Development → In Review (→ In Security/NFR)`), composing the per-role transitions the roles declared.
- **Voice (brand + D-21):** clear/professional voice for operational, gate, stop, and safety content; a light grug wink permitted only in framing prose. See D-27.

### Workflow authoring depth (Area A)
- **D-24 (Terse derivation — the D-15 logic applied to workflows):** Unlike the §5.A caveman prompts (Phase 3 verbatim) and §9 checklist bodies (Phase 2 verbatim), the spec gives workflows **only a one-line `Flow:` + `Done when:`** — there is **no verbatim body to copy**. Therefore: **reproduce the 10-section template heading set and the spec's `Flow:`/`Done when:` lines faithfully; DERIVE the `Steps / Board moves / Handoffs produced / Trace updates / Metrics emitted / Stop conditions` sections tersely** from the **frozen contracts** — the board exit-owners (§6.1 / `plans/board.md`), each role's declared board-moves + `Output` handoff filenames (Phase 3 roles), the handoff/checklist filenames (Phase 2), and the traceability/metrics column names (Phase 1). **Invent nothing**; cite real frozen names, never parallel/invented ones. Each workflow stays **scannable in roughly one screen**. (User chose "Terse derivation"; rejected fuller invented step bodies.)

### Cadence mechanism (Area B)
- **D-25 (One config-gated workflow set — single-source):** Ship **one set of 14 workflows**, NOT duplicate kanban/scrum sets. Each ceremony declares its cadence applicability in its `When to use` section, exactly as the spec tags them: **scrum-only** = `08-sprint-planning` (§7.9 `cadence=scrum`), `10-sprint-review` (§7.11 `cadence=scrum`); **both cadences** = `07-backlog-refinement` (regularly/before planning), `09-daily-sweep` (§7.10 both), `11-retro` (§7.12 both; light in lean, end-of-sprint in scrum / monthly in Kanban). The **Orchestrator reads `config.cadence`** and selects which ceremonies fire. The Kanban-works criterion (BOARD-02) is satisfied by continuous-pull + WIP throttle + `09-daily-sweep` reconciliation + cycle-time metrics; the Scrum-works criterion (BOARD-03) by time-boxed sprints + `SPRINT-xx.md` + `08/10` + velocity/burndown. Where a *shared* workflow's Steps genuinely diverge by cadence, express it as an inline cadence note/branch inside that one file (Claude's discretion under this approach) — never a second file. (User chose "One config-gated set"; rejected duplicate sets.)

### Backpressure gate encoding (Area C)
- **D-26 (Backpressure single-sourced in 05):** The full §14 loop — **deterministic prefetch → implement on branch (`autonomy=branch|pr`) → gate (`install → lint → typecheck → unit → build → e2e`) → bounded self-fix → terminal result** — lives **ONCE** in `05-pr-quality-gate.md`. `04-ticket-to-pr.md` **references** `05` rather than restating the loop (no duplication, no drift). Determinism rules, reproduced from §14: **gate commands are pulled from `AGENTS.md`'s command slots at runtime** (currently `UNKNOWN - verify` slots — never fabricated here); **the result is one of `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`**; the knobs come from `factory.config.json#quality` — `self_fix_attempts` (default 2, "two rounds then human"), `coverage_threshold` (0.8), `mandatory_gates` (`lint/typecheck/unit/build`), `e2e_when` (`ui-or-critical-path`). The same gate + same "two rounds then human" rule applies in headless/CI use. (User chose "Single-source in 05"; rejected inlining in both 04 and 05.)

### Frontmatter, voice & SAFE-01 rendering (Area D)
- **D-27 (Clear voice + light wink + `kind: workflow` frontmatter; SAFE-01 as prose, dispatch-neutral):**
  - **Voice:** **clear/professional voice** for every workflow's operational content — `Steps`, `Board moves`, the gate, `Stop conditions`, and all safety/human-confirm text. A **light grug wink is permitted only in framing prose** (e.g. a `When to use` opener), **never** in the gate, the release approval, the stop/safety content, or anything a reader must act on precisely. This mirrors the AGENTS.md voice split (D-21). (User rejected full-grug-voice and strictly-no-wink.)
  - **Frontmatter:** each workflow carries **minimal `kind: workflow`** frontmatter (parallel to D-13 handoffs/checklists and D-16 roles), giving the Phase-6 validator and Phase-5 wrappers a stable machine-readable key. Optional 1–2 additional high-signal fields (`order` / `cadence` / `tier`) at Claude's discretion, kept to 2–3 fields total — no bloat.
  - **SAFE-01 rendering (Phase-4 scope = prose, not mechanism):** every workflow that can touch merge/deploy renders the human-confirm gate **in prose, clear voice**: `04-ticket-to-pr` honors `autonomy=pr` (branch + open PR, **never merge**); `05-pr-quality-gate` emits a **recommendation** a human reviews (never auto-merges); `12-release` requires a **named human approval** + a **human-confirmed** production action (§7.13 / §8.1 / the Release Manager's verbatim deploy-gate), keyed to `production_requires_human_confirmation: true`. The text stays **dispatch-neutral** — the **mechanical PreToolUse hook is Phase 5 (SAFE-02)**, not authored or inlined here. (This is the D-20 dispatch-neutrality discipline applied to safety.)

### Claude's Discretion
- Exact wording of the derived `Steps` / `Board moves` / `Trace updates` / `Metrics emitted` / `Stop conditions` bullets in each workflow, as long as they cite frozen names and invent nothing (D-24).
- Exact frontmatter field set/order within D-27's 2–3-field `kind: workflow` block (whether to add `order` / `cadence` / `tier`).
- Whether a shared ceremony's cadence divergence is expressed as a short inline `if cadence=scrum …` note or two labeled sub-flows within the one file (D-25).
- How `09-daily-sweep` phrases the board↔ticket-status reconciliation pass and the "sweep report" (done/next/blocked) — derived from §7.10, wording discretionary.
- The build/wave order of the 14 files (a planner concern). Natural dependency-light grouping: lifecycle `00–06` (with `05` before `04`'s reference resolves), ceremonies `07–11`, enterprise `12–13`; but no inter-file content dependency forces a strict order since all roles/contracts are already frozen.
- Whether `plans/initial-plan.md` (the Phase-1 deferred stub) is populated by `00-bootstrap-greenfield` or left as a thin stub — Phase-1 D left this to the bootstrap workflow / planner's call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The build contract — authoritative for Phase-4 content (reproduce the spec-given spine; derive the rest)
- `docs/initial/agent_factory_builder_spec_v2.md` — THE specification. Phase-4-relevant sections:
  - **§7 (Workflow Files), lines ~715–780** — the **10-section v2 workflow template** (lines ~719–732) every file follows, and the **`Flow:` + `Done when:`** lines for all 14 workflows (§7.1–7.14), including the ceremony `When/Agents/Steps/Output` one-liners (§7.8–7.12) and the enterprise release/incident flows (§7.13–7.14).
  - **§14 (CI/CD and Backpressure), lines ~1128–1146** — the **6-step backpressure loop**, the `UNKNOWN - verify`/no-fake rule, the "two rounds then human" bound, and the config-driven knobs — single-sourced into `05-pr-quality-gate.md` (D-26).
  - **§6.1 (The board), lines ~574–633** — the 13 columns, **exit owners**, and WIP defaults the workflows sequence between (frozen Phase 1; cite, don't redefine).
  - **§6.2 (Two cadences), lines ~635–677** — Kanban vs Scrum behavior and the **`SPRINT-xx.md` format** (D-25 / BOARD-02 / BOARD-03).
  - **§6.3–6.5 (lines ~679–711)** — sizing/priority (XL must split), Blocked policy + escalation, and the **metrics list** the `Metrics emitted` sections and `09-daily-sweep`/`11-retro` reference.
  - **§8 (Handoff Templates), lines ~784–871** — the handoff filenames + the universal header's `Trace updates` field each workflow's `Handoffs produced`/`Trace updates` sections name (frozen Phase 2).
  - **§15 (Configuration), lines ~1150–1204** — `cadence` / `mode` / `autonomy` / `quality.{self_fix_attempts,coverage_threshold,mandatory_gates,e2e_when}` / `production_requires_human_confirmation` the workflows read.
- `docs/initial/grugops_brand_manual.md` — voice rules: always-lowercase `grugops`; **clear voice** for operational/gate/safety content, light grug wink only in framing (governs D-27).

### Frozen Phase-1/2/3 outputs the workflows sequence and cite by name (do NOT redefine)
- `agent-factory/roles/orchestrator.md` — **the most important consistency target**: its `classification → workflow-filename` table, `# Orchestrator Decision` output, WIP+DoR gate, `SPLIT_REQUIRED`, and hard limits. Workflow filenames/numbering and the safety prose MUST match it (D-20).
- `agent-factory/roles/*.md` (the other 15) — each role's declared **`Board moves`** (the per-role transition) and **`Output (file + format)`** (the handoff it emits). Workflows compose these into the full path (D-23) and name the same handoffs.
- `agent-factory/README.md` — the copy-paste Orchestrator prompts (bootstrap/refine/plan/sweep/ticket→PR/gate/UAT/release) the workflows must stay consistent with (Phase-1 D-06).
- `agent-factory/handoffs/*.md` — the exact handoff filenames + universal header (incl. `Trace updates`) the `Handoffs produced`/`Trace updates` sections reference.
- `agent-factory/checklists/*.md` (+ `00-index.md`) — `definition-of-ready.md` (the DoR gate before pulling), `definition-of-done.md` / `definition-of-done-enterprise.md` (mode-gated DoD), `pr-review-checklist.md`, `release-readiness-checklist.md`, `uat-checklist.md`, etc. — the gates workflow steps apply by mode.
- `agent-factory/config/factory.config.json` (+ `.md` twin) — `cadence` (D-25 selector), `autonomy` (SAFE-01), `quality.*` (D-26 gate knobs), `wip_limits`, `mode`, `production_requires_human_confirmation`, `blocked_escalation_days`.
- `plans/board.md` — the 13 columns + WIP format the `Board moves` sections transition between.
- `plans/traceability.md` — the requirement→…→release matrix the `Trace updates` sections append to.
- `plans/metrics.md` — the metric names the `Metrics emitted` sections and `09-daily-sweep`/`11-retro` emit.
- `plans/sprints/` — the directory `08-sprint-planning` writes `SPRINT-xx.md` into (scrum cadence).
- `memory-bank/00-index.md`, `60-progress.md`, `50-decisions/` — read-on-start orientation; `09-daily-sweep` keeps `60-progress.md` current; bootstrap workflows fill the bank per-project; mapper runtime outputs `brownfield-map.md` / `greenfield-plan.md` are produced by `00/01-bootstrap`.
- Root `AGENTS.md` — the source of the **gate commands** `05-pr-quality-gate` pulls (the `UNKNOWN - verify` command slots filled per-project by the bootstrap workflow / Scribe at runtime, never fabricated here).

### Project planning context
- `.planning/ROADMAP.md` — Phase 4 goal + the 5 success criteria.
- `.planning/REQUIREMENTS.md` — FLOW-01..05, BOARD-02, BOARD-03, GATE-01, SAFE-01 (the 9 Phase-4 requirements).
- `.planning/PROJECT.md` — Constraints (single-source, voice discipline, no-fabrication, minimal/anti-bloat, safety-hard) + Key Decisions table.
- `.planning/phases/03-roles-agents-md-substrate/03-CONTEXT.md` — D-15 (terse derivation precedent → D-24), D-20 (orchestrator names-not-inlines, dispatch-neutrality → reciprocal here), D-23 (board-moves granularity → reciprocal here).
- `.planning/phases/02-shared-contracts/02-CONTEXT.md` — D-08/D-13 (pre-fill-from-spec + frontmatter) and the frozen handoff/checklist section names.
- `.planning/phases/01-substrate-config-state-skeleton/01-CONTEXT.md` — D-00 (verbatim-from-spec), D-04 (shipped-template identity), and the frozen board/config/state vocabulary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Spec §7 / §14 / §6.2 spine:** the workflow template, the 14 `Flow:`/`Done when:` lines, the backpressure 6-step loop, and the cadence/`SPRINT-xx.md` format are already written in the spec — D-24 reproduces the spine, derives only the connective tissue.
- **Frozen Phase-1/2/3 files** (`agent-factory/roles/*`, `agent-factory/handoffs/*`, `agent-factory/checklists/*`, `agent-factory/config/*`, `plans/*`, `memory-bank/*`, root `AGENTS.md`): every name a workflow cites already exists and is frozen — the workflows wire them together, nothing is invented.
- **Orchestrator routing table + README prompts:** the `classification → 14-filename` mapping and the copy-paste Orchestrator prompts are the consistency anchors — workflows are authored to match them, not vice-versa.

### Established Patterns
- **Reproduce-spine, derive-the-rest (D-08 → D-15 → D-24):** lock spec-given content; derive thin connective sections from frozen paths; invent nothing.
- **Minimal frontmatter (D-13 → D-16 → D-27):** `kind:` on every shipped file; reused here as `kind: workflow`.
- **Single-source / no-drift:** the backpressure loop once in `05` (D-26); one config-gated cadence set, not duplicates (D-25); the Orchestrator already names workflows once.
- **Two-voice discipline (D-21 → D-27):** clear voice in gates/safety/stop; light grug wink only in framing.
- **Dispatch-neutrality (D-20):** safety rendered as prose human-confirm gates now; the mechanical hook is Phase 5 — workflow text says nothing tool-specific.

### Integration Points
- `agent-factory/workflows/` currently holds only `.gitkeep`. Phase 4 populates it **additively** with the 14 files — never touching `docs/`, `.planning/`, `.claude/`, `CLAUDE.md`, or the frozen Phase-1/2/3 files.
- These workflows are **consumed by:** Phase-5 packaging (thin per-tool wrappers + the standalone/plugin forms point at finished, frozen workflow paths; the mechanical SAFE-02 hook enforces what SAFE-01 states in prose), and the Phase-6 validator (checks every required workflow file exists and contains its 10 sections) + the dogfood run (drives a ticket idea→PR through `02→03→04→05→06`). Filenames, the 10-section shape, and the routing consistency frozen here propagate to both.

</code_context>

<specifics>
## Specific Ideas

- The user accepted every recommended option again (consistent with Phases 1–3), confirming the standing posture: **maximum fidelity to the spec, minimum invention.** Reproduce what §7/§14/§6.2 already fix; derive only the thin connective sections from frozen Phase-1/2/3 names; keep each workflow lean and single-source.
- Strongest specific signals for Phase 4: **(1) terse derivation** — workflows have no verbatim body, so the Steps stay thin and citation-bound, never invented prescriptive procedure; **(2) single-source everything** — one cadence set (config-gated), one home for the backpressure loop (`05`), filenames/routing matched to the already-frozen Orchestrator table and README; **(3) safety as dispatch-neutral prose** — render the human-confirm gates clearly now, leave the mechanism to Phase 5.

</specifics>

<deferred>
## Deferred Ideas

These belong to other phases — preserved, not actioned here. None are scope-creep from this discussion.

- **The mechanical prod-deploy guard** (plugin-level `hooks/hooks.json` PreToolUse Bash matcher) → Phase 5 (SAFE-02). Phase 4 renders the human-confirm requirement as prose; the enforcement mechanism is Phase 5. The `autonomy=pr` fallback documentation for the four non-Claude tools is also Phase 5.
- **Per-tool dispatch mechanics** (Claude subagent spawn vs portable sequential role-load; Orchestrator-as-main-thread `settings.json agent:`), thin per-tool wrappers → Phase 5 (PKG/CLAUDE/INSTALL). Workflow text stays dispatch-neutral by design (D-20/D-27).
- **Filling real gate commands** into AGENTS.md's `UNKNOWN - verify` slots → done per-project by `00/01-bootstrap` / the Scribe at runtime, never fabricated in the kit (D-18/D-26).
- **Runtime workflow outputs** (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`, populated `plans/board.md`/`SPRINT-xx.md`, real tickets) → produced when the workflows RUN, only exercised at the Phase-6 dogfood on a throwaway repo — never seeded into grugops's own `agent-factory/`/`plans/` (D-04).
- **The Phase-6 validator's exact workflow section-presence checks** → Phase 6 (VAL-01) reads the 10-section template + filenames frozen here.
- **Five example runs** narrating the finished flows (greenfield/brownfield bootstrap, ticket→PR, sprint cycle, release run) → Phase 6 (EX-01).
- **Final version string + commands/-vs-skills/ form** → Phase 5 open decisions, unchanged by this phase.

</deferred>

---

*Phase: 4-workflows-cadence-backpressure*
*Context gathered: 2026-06-03*
