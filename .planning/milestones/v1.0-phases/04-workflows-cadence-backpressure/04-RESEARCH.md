# Phase 4: Workflows, Cadence & Backpressure - Research

**Researched:** 2026-06-03
**Domain:** Markdown workflow authoring — composing 16 frozen roles into 14 numbered lifecycle/ceremony/enterprise workflow files
**Confidence:** HIGH (this is a reproduce-the-spec-spine, derive-the-connective-tissue phase; every name a workflow cites already exists and was verified on disk this session)

## Summary

Phase 4 authors **14 numbered workflow markdown files** into `agent-factory/workflows/` (currently empty except `.gitkeep`). It is **not** new-behavior invention. The spec (`docs/initial/agent_factory_builder_spec_v2.md`) fixes the spine: §7 gives the **10-section v2 template** and a one-line `Flow:` + `Done when:` for all 14 workflows; §14 gives the **6-step backpressure loop**; §6.2 gives the **two cadences and the `SPRINT-xx.md` format**. The connective tissue (the `Steps / Board moves / Handoffs produced / Trace updates / Metrics emitted / Stop conditions` bullets) is **derived tersely from frozen Phase-1/2/3 names** — every board column, role board-move, handoff filename, checklist filename, trace column, metric name, and config key already exists on disk and was verified this session (D-24).

The single most important consistency target is `agent-factory/roles/orchestrator.md`: its `classification → workflow-filename` table names all 14 files by exact name and number. **Verified: the Orchestrator table and the 14 spec/CONTEXT filenames match 1:1 with zero drift** (see Orchestrator Routing Consistency Check below). The README's copy-paste prompts also reference workflows 04/05/06/07/08/09/12 by number and are consistent.

**Primary recommendation:** Author each file as ~one screen: minimal `kind: workflow` frontmatter → 10 sections in spec order → reproduce the spec's `Flow:`/`Done when:` verbatim-faithfully into `When to use` + `Done condition` → derive the middle sections by citing only the frozen names inventoried below. Single-source the backpressure loop in `05-pr-quality-gate.md`; have `04` reference it (D-26). Ship ONE config-gated cadence set, not duplicates (D-25). Render SAFE-01 as clear-voice prose human-confirm gates, dispatch-neutral (D-27/SAFE-01). Build a Phase-3-style `check-structure.sh` grep harness as the running acceptance gate.

## Architectural Responsibility Map

grugops has no runtime tiers; the relevant "tiers" are the frozen artifact planes a workflow wires together. Each Phase-4 capability maps to the plane that OWNS the contract — the workflow only names and sequences it.

| Capability | Owning plane (frozen) | Workflow's job | Rationale |
|------------|----------------------|----------------|-----------|
| Request classification → workflow selection | `roles/orchestrator.md` routing table | Match filename/number exactly | Orchestrator already names workflows; workflows must not rename/renumber (D-20) |
| Column transitions | `plans/board.md` 13 columns + roles' per-role Board moves | Sequence the FULL left→right path | Roles declare single transitions; workflow composes them (D-23) |
| Handoff I/O | `agent-factory/handoffs/*.md` (16 files) | Name the handoff each step produces | Handoffs are the memory; frozen Phase 2 |
| Gate contracts | `agent-factory/checklists/*.md` (10 + index) | Cite DoR/DoD/pr-review/etc. by name + mode | Checklists are the gates; frozen Phase 2 |
| Config knobs (cadence/autonomy/quality/etc.) | `agent-factory/config/factory.config.json` | Read & honor; never redefine | Config is the dial; frozen Phase 1 |
| Trace rows | `plans/traceability.md` (10 fixed columns) | Name what each step links | Trace is the proof; frozen Phase 1 |
| Metric counts | `plans/metrics.md` (9 named metrics) | Name what `09`/`11` emit | Metrics are the coach's fuel; frozen Phase 1 |
| Gate commands (install/lint/typecheck/unit/build/e2e) | root `AGENTS.md` Commands slots (all `UNKNOWN - verify`) | Pull at runtime; never fabricate | Commands filled per-project by bootstrap/Scribe (D-18) |
| Backpressure loop | spec §14 (single-sourced into `05`) | Encode once; `04` references | No duplication, no drift (D-26) |
| Sprint state (scrum) | `plans/sprints/SPRINT-xx.md` format (§6.2) | `08` writes it; `10` appends | Scrum overlay; frozen Phase 1 format |
| Human-confirm safety | prose this phase; mechanical hook = Phase 5 | Render as clear-voice prose gate | Dispatch-neutral; SAFE-02 is Phase 5 |

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-00 (LOCKED — reproduce, do NOT redesign):** The spec is authoritative for content it already fixes. Reproduce exactly:
  - §7 workflow template (lines ~719–732) — the 10 section headings in order every workflow uses.
  - §7.1–7.14 — each workflow's `Flow:` line and `Done when:` condition (and the ceremony `When/Agents/Steps/Output` one-liners) are spec-given; reproduce faithfully as the spine.
  - §14 (lines ~1128–1146) — the 6-step backpressure pattern and the `UNKNOWN - verify`/no-fake / two-rounds-then-human / knobs-from-config rules.
  - §6.2 (lines ~635–677) — the two cadences and the `SPRINT-xx.md` format.
- **D-04 (Shipped-kit identity):** `agent-factory/workflows/*` are the **generic, project-agnostic user-facing kit TEMPLATE**. grugops's OWN build state stays in `.planning/`; never conflate. Workflows describe any repo running the factory.
- **D-20 (Orchestrator names workflows, doesn't inline — reciprocal):** Phase-4 workflows MUST stay consistent with the Orchestrator's `classification → workflow-filename` mapping AND with `agent-factory/README.md`'s copy-paste prompts. Filenames, classification names, and the routing contract are frozen — do not rename or renumber.
- **D-23 (board-moves granularity — reciprocal):** Roles state the column transitions THEY cause at role granularity; Phase-4 workflows sequence the FULL left→right path between columns, composing the per-role transitions roles declared.
- **D-24 (Terse derivation):** Reproduce the 10-section template heading set and the spec's `Flow:`/`Done when:` lines faithfully; DERIVE the `Steps / Board moves / Handoffs produced / Trace updates / Metrics emitted / Stop conditions` sections tersely from the frozen contracts. Invent nothing; cite real frozen names, never parallel/invented ones. Each workflow stays scannable in roughly one screen.
- **D-25 (One config-gated workflow set — single-source):** Ship ONE set of 14 workflows, NOT duplicate kanban/scrum sets. Each ceremony declares its cadence applicability in its `When to use` section as the spec tags them: **scrum-only** = `08-sprint-planning`, `10-sprint-review`; **both cadences** = `07-backlog-refinement`, `09-daily-sweep`, `11-retro`. The Orchestrator reads `config.cadence` and selects which ceremonies fire. Where a shared workflow's Steps genuinely diverge by cadence, express it as an inline cadence note/branch inside that one file — never a second file.
- **D-26 (Backpressure single-sourced in 05):** The full §14 loop lives ONCE in `05-pr-quality-gate.md`. `04-ticket-to-pr.md` references `05` rather than restating the loop. Determinism rules reproduced from §14: gate commands pulled from `AGENTS.md`'s command slots at runtime (currently `UNKNOWN - verify`, never fabricated); result is one of `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`; knobs come from `factory.config.json#quality` — `self_fix_attempts` (default 2), `coverage_threshold` (0.8), `mandatory_gates` (`lint/typecheck/unit/build`), `e2e_when` (`ui-or-critical-path`). Same gate + same "two rounds then human" in headless/CI use.
- **D-27 (Clear voice + light wink + `kind: workflow` frontmatter; SAFE-01 as prose, dispatch-neutral):**
  - **Voice:** clear/professional voice for every workflow's operational content — `Steps`, `Board moves`, the gate, `Stop conditions`, all safety/human-confirm text. A light grug wink permitted ONLY in framing prose (e.g. a `When to use` opener), never in the gate, the release approval, the stop/safety content, or anything a reader must act on precisely.
  - **Frontmatter:** each workflow carries minimal `kind: workflow` frontmatter, 2–3 fields total, no bloat.
  - **SAFE-01 rendering (Phase-4 scope = prose, not mechanism):** every workflow that can touch merge/deploy renders the human-confirm gate in prose, clear voice: `04` honors `autonomy=pr` (branch + open PR, never merge); `05` emits a recommendation a human reviews (never auto-merges); `12` requires a named human approval + a human-confirmed production action, keyed to `production_requires_human_confirmation: true`. Text stays dispatch-neutral — the mechanical PreToolUse hook is Phase 5 (SAFE-02), not authored here.

### Claude's Discretion

- Exact wording of the derived `Steps` / `Board moves` / `Trace updates` / `Metrics emitted` / `Stop conditions` bullets, as long as they cite frozen names and invent nothing (D-24).
- Exact frontmatter field set/order within D-27's 2–3-field `kind: workflow` block (whether to add `order` / `cadence` / `tier`).
- Whether a shared ceremony's cadence divergence is an inline `if cadence=scrum …` note or two labeled sub-flows within the one file (D-25).
- How `09-daily-sweep` phrases the board↔ticket-status reconciliation pass and the "sweep report" (done/next/blocked) — derived from §7.10, wording discretionary.
- The build/wave order of the 14 files. Natural dependency-light grouping: lifecycle `00–06` (with `05` before `04`'s reference resolves), ceremonies `07–11`, enterprise `12–13`; no inter-file content dependency forces a strict order since all roles/contracts are frozen.
- Whether `plans/initial-plan.md` (the Phase-1 deferred stub) is populated by `00-bootstrap-greenfield` or left a thin stub.

### Deferred Ideas (OUT OF SCOPE)

- The mechanical prod-deploy guard (plugin-level `hooks/hooks.json` PreToolUse Bash matcher) → **Phase 5 (SAFE-02)**. Phase 4 renders human-confirm as prose only. The `autonomy=pr` fallback documentation for the four non-Claude tools is also Phase 5.
- Per-tool dispatch mechanics (Claude subagent spawn vs portable sequential role-load; Orchestrator-as-main-thread `settings.json agent:`), thin per-tool wrappers → **Phase 5**. Workflow text stays dispatch-neutral by design.
- Filling real gate commands into AGENTS.md's `UNKNOWN - verify` slots → done per-project by `00/01-bootstrap` / the Scribe at runtime, never fabricated in the kit.
- Runtime workflow outputs (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`, populated `plans/board.md`/`SPRINT-xx.md`, real tickets) → produced when the workflows RUN, exercised only at the Phase-6 dogfood on a throwaway repo — never seeded into grugops's own `agent-factory/`/`plans/`.
- The Phase-6 validator's exact workflow section-presence checks → **Phase 6 (VAL-01)** reads the 10-section template + filenames frozen here.
- Five example runs narrating the finished flows → **Phase 6 (EX-01)**.
- Final version string + commands/-vs-skills/ form → **Phase 5** open decisions.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (from REQUIREMENTS.md) | Research Support |
|----|-----------------------------------|------------------|
| **FLOW-01** | Bootstrap workflows (`00-bootstrap-greenfield`, `01-bootstrap-brownfield`) exist and seed AGENTS.md, memory-bank, the repo map/plan, the board, config, and safe first tickets | Spec §7.1/§7.2 give Flow+Done-when verbatim (below); seeded targets are frozen names: root `AGENTS.md`, `memory-bank/*`, `memory-bank/greenfield-plan.md` / `brownfield-map.md` (named by mappers), `plans/board.md`, `factory.config.json`, `plans/tickets/` |
| **FLOW-02** | Lifecycle workflows exist (`02`..`06`), each with board moves, handoffs produced, trace updates, stop/done | Spec §7.3–§7.7 Flow+Done-when (below); per-role board-moves + handoffs inventoried below give every cited name |
| **FLOW-03** | Ceremony workflows exist (`07`..`11`); daily-sweep + refinement/retro work in Kanban, planning/review/retro work in Scrum — cadence by config | Spec §7.8–§7.12 ceremony one-liners (below); D-25 cadence tagging; `config.cadence` selector |
| **FLOW-04** | Enterprise workflows exist (`12-release`, `13-incident`) with release approval gate and blameless incident path | Spec §7.13/§7.14 (below); Release Manager verbatim deploy-gate + `release-handoff.md`/`REL-xxxx.md`; `incident-postmortem.md` blameless |
| **FLOW-05** | Every workflow file follows the v2 template (When / Agents / Inputs / Steps / Board moves / Handoffs / Trace updates / Metrics emitted / Stop / Done) | 10-section heading set reproduced verbatim below; grep-checkable |
| **BOARD-02** | Kanban (flow) cadence works — continuous pull, WIP limits as throttle, daily-sweep reconciliation, cycle-time focus | §6.2 Kanban block; satisfied by continuous-pull + WIP throttle + `09-daily-sweep` + cycle-time metric (`plans/metrics.md`) |
| **BOARD-03** | Scrum (sprint) cadence works — time-boxed sprints with `SPRINT-xx.md` (goal, committed, velocity, burndown) + full ceremony set, selectable by config | §6.2 Scrum block + `SPRINT-xx.md` format (below); `08`/`10` scrum-only; velocity metric |
| **GATE-01** | Quality-gate workflow encodes the backpressure loop → terminal result; unknown commands `UNKNOWN - verify`, never faked | §14 loop reproduced verbatim below; single-sourced in `05` (D-26) |
| **SAFE-01** | "Humans decide, agents execute" — `autonomy=pr` default; no role merges a protected branch or deploys prod without named human confirmation | Prose human-confirm gates in `04`/`05`/`12` (D-27); Orchestrator + Release Manager hard limits already verbatim; keyed to `production_requires_human_confirmation: true` |
</phase_requirements>

---

## Per-Workflow Spine Table (the planner's master reference)

All 14 filenames verified against the frozen Orchestrator routing table — **exact match, zero drift**. `Flow:` / `Done when:` reproduced faithfully from spec §7.1–§7.14. "Composes" lists the frozen roles/board-moves/handoffs each workflow wires (derived per D-24; cite these exact names, invent nothing).

| # / File | Spec | `Flow:` (reproduce faithfully) | `Done when:` / terminal | Cadence | Composes (frozen roles → board moves → handoffs) | Reqs |
|---|---|---|---|---|---|---|
| **00-bootstrap-greenfield.md** | §7.1 | `idea → Orchestrator → Greenfield Mapper → AGENTS.md Scribe → BA/PM → System Analyst → Architect/Design → initial tickets` | AGENTS.md, memory-bank, greenfield-plan, product/system/architecture handoffs, first tickets, **board seeded**, **config present** all exist | both | greenfield-mapper (no board move → `memory-bank/greenfield-plan.md`), agents-md-scribe (no board move → root `AGENTS.md`), ba-pm (`Backlog → Ready` → `product-handoff.md`, tickets to `plans/tickets|epics|features/`), system-analyst (`In Analysis` exit → `system-handoff.md`), architect-design (`In Design` exit → `architecture-handoff.md` + ADRs into `memory-bank/50-decisions/` + seeds `plans/nfr-catalog.md`); seeds `plans/board.md` | FLOW-01 |
| **01-bootstrap-brownfield.md** | §7.2 | `existing repo → Orchestrator → Brownfield Mapper → AGENTS.md Scribe → Architect/Design review → Security/NFR high-risk scan → safe first tickets` | AGENTS.md, brownfield-map, memory-bank updated, known commands + risks documented, safe first tickets, board seeded, config present | both | brownfield-mapper (no board move → `memory-bank/brownfield-map.md`), agents-md-scribe (root `AGENTS.md`), architect-design (review), security-nfr (`In Security/NFR` exit → `security-nfr-handoff.md`, result `PASS|PASS_WITH_RISKS|BLOCKED`); seeds `plans/board.md` | FLOW-01 |
| **02-idea-to-epics.md** | §7.3 | `idea → BA/PM → product-handoff → epics` | MVP scope clear; epics, non-goals, risks written; epics added to Backlog | both | ba-pm (`Backlog → Ready` → `product-handoff.md`; epics to `plans/epics/`) | FLOW-02 |
| **03-epic-to-tickets.md** | §7.4 | `epic → BA/PM → System Analyst (if behavior unclear) → tickets` | each ticket has user value, scope, acceptance criteria, test notes, security/NFR triggers, **size**, **priority**, and a **traceability row** | both | ba-pm (sizes/prioritizes → tickets to `plans/tickets/`), system-analyst (`In Analysis` → `system-handoff.md`); appends row to `plans/traceability.md`; applies `definition-of-ready.md` | FLOW-02 |
| **04-ticket-to-pr.md** | §7.5 | `ticket → Orchestrator readiness check → Software Engineer → QE/E2E → Security/NFR (if triggered) → final implementation packet` **Board:** `Ready for Dev → In Development → In Review (→ In Security/NFR)` | code changed per autonomy setting, tests added, commands run, implementation + QE (+ security-nfr) handoffs written, trace updated | both | Orchestrator (`Ready for Dev → In Development`, DoR gate via `definition-of-ready.md`), software-engineer (`In Development → In Review` → `implementation-handoff.md`), qe-e2e (`In Review` exit → `qe-handoff.md`), security-nfr (if triggered, `In Security/NFR` exit → `security-nfr-handoff.md`); **references `05` for the gate loop (D-26)**; honors `autonomy=pr` — branch + open PR, **never merge** (SAFE-01) | FLOW-02, SAFE-01 |
| **05-pr-quality-gate.md** | §7.6 / §14 | `implementation → QE/E2E → Security/NFR → Architect/Design (if structure changed) → Orchestrator recommendation` **Backpressure:** run lint/typecheck/test/build/e2e; bounded self-fix (§14); then a result | Result is one of `READY_FOR_HUMAN_REVIEW \| BLOCKED_NEEDS_FIX \| SPLIT_REQUIRED` | both | **SINGLE-SOURCE HOME of the §14 loop (D-26)**; qe-e2e, security-nfr, architect-design (if structure changed), Orchestrator (recommendation only — **never auto-merges**, SAFE-01); cites `pr-review-checklist.md`; commands from `AGENTS.md` slots; knobs from `factory.config.json#quality`; emits Gate pass rate metric | GATE-01, SAFE-01 |
| **06-uat-pack.md** | §7.7 | `feature complete → UAT Planner → BA/PM validation → QE validation → UAT pack` | scenarios, test data, pass/fail criteria, signoff checklist, known limitations exist; ticket moves to **Ready to Release** (or **Done** in lean) | both | uat-planner (`Ready for UAT → In UAT`, owns `In UAT` exit → `uat-handoff.md`; works `uat-checklist.md`), ba-pm + qe-e2e validation | FLOW-02 |
| **07-backlog-refinement.md** | §7.8 | When: regularly, or before planning. Agents: BA/PM (+ System Analyst, + Architect/Design for spikes). Steps: pull top of Backlog, clarify, split XL, size, prioritize, mark security/NFR triggers, push DoR-met items into Ready. | Output exists; Ready column stocked so dev never starves | both | ba-pm (sizes/prioritizes; `Backlog → Ready` after `definition-of-ready.md`), system-analyst/architect-design for spikes; Output: `agent-factory/handoffs/refinement-notes.md`; Orchestrator enforces `SPLIT_REQUIRED` (no XL into dev) | FLOW-03 |
| **08-sprint-planning.md** | §7.9 | `cadence=scrum`. When: start of sprint. Agents: Orchestrator + BA/PM. Steps: set a one-sentence sprint goal; pull from Ready by priority up to capacity; confirm each item is Ready; write `plans/sprints/SPRINT-xx.md`. | Stop if Ready too thin (run refinement first); `SPRINT-xx.md` written | **scrum only** | Orchestrator + ba-pm; writes `plans/sprints/SPRINT-xx.md` (format below); may emit `sprint-plan.md` handoff as one-off packet (§8.5) | FLOW-03, BOARD-03 |
| **09-daily-sweep.md** | §7.10 | both cadences. The standup-equivalent — a board reconciliation pass the Orchestrator runs on demand/schedule. Steps: read board + open handoffs; per in-flight ticket note progress/blocker; update `plans/board.md`, `plans/metrics.md`, `memory-bank/60-progress.md`; escalate anything blocked past threshold; recommend next pull respecting WIP. | "sweep report" produced (done/next/blocked) | both | Orchestrator; updates `plans/board.md`, `plans/metrics.md`, `memory-bank/60-progress.md`; escalates past `blocked_escalation_days`; cycle-time/WIP/blocked-time metrics | FLOW-03, BOARD-02 |
| **10-sprint-review.md** | §7.11 | `cadence=scrum`. When: end of sprint. Agents: UAT Planner + BA/PM (+ QE). Steps: assemble what reached Done, validate against acceptance criteria, draft demo/release notes, list carry-over with reasons. | review notes appended to the sprint file (`plans/sprints/SPRINT-xx.md`) | **scrum only** | uat-planner + ba-pm (+ qe-e2e); appends to `plans/sprints/SPRINT-xx.md`; velocity metric | FLOW-03, BOARD-03 |
| **11-retro.md** | §7.12 | both cadences; light in lean. When: end of sprint, or monthly in Kanban. Agent: Factory Coach. Steps: read `plans/metrics.md` + board history; identify top 1–3 wastes; write `handoffs/retro-notes.md`; create 1–3 improvement tickets tagged `factory`. | retro-notes written + improvement tickets created | both | factory-coach (no board move) → `agent-factory/handoffs/retro-notes.md`; reads `plans/metrics.md`; tickets to `plans/tickets/` tagged `factory` | FLOW-03 |
| **12-release.md** | §7.13 | enterprise; optional in lean. `Ready to Release → Release Manager → approval gate → deploy plan → (human-confirmed) deploy → Done`. Steps: set SemVer, compile changelog + release notes, confirm migration + rollback + DR, attach NFR/security/compliance evidence, **record named approval, then a human confirms the production action**. | Output: `plans/releases/REL-xxxx.md`, `handoffs/release-handoff.md`. Status: `READY_TO_RELEASE \| BLOCKED \| RELEASED` | both (optional in lean) | release-manager (`Ready to Release → Done` only after named human approves → `plans/releases/REL-xxxx.md` + `release-handoff.md`; cites `release-readiness-checklist.md`; attaches `plans/nfr-catalog.md` evidence); **named human approval + human-confirmed prod action, keyed to `production_requires_human_confirmation: true` (SAFE-01)** | FLOW-04, SAFE-01 |
| **13-incident.md** | §7.14 | enterprise; post-release. `incident detected → Incident Responder → mitigate/rollback → blameless postmortem → follow-up tickets`. Steps: assess blast radius, propose mitigation + rollback, capture timeline, write `handoffs/incident-postmortem.md`, create follow-up tickets into Backlog, hand lessons to the Coach. **Never blames a person.** | postmortem written, follow-up tickets created into Backlog | both (enterprise) | incident-responder (no board move) → `agent-factory/handoffs/incident-postmortem.md` (blameless); tickets to `plans/tickets/`→Backlog; feeds factory-coach | FLOW-04 |

**Cadence-gating summary (D-25):** scrum-only = **08, 10**. Both = **07, 09, 11** (11 light in lean). Lifecycle 00–06 + enterprise 12–13 fire regardless of cadence (12/13 mode-gated to enterprise). The Orchestrator reads `config.cadence` to decide which ceremonies fire — workflows DECLARE applicability in `When to use`, they don't implement the selector.

---

## The 10-Section v2 Workflow Template (spec §7, lines ~717–732 — reproduce VERBATIM, in order)

Every workflow file uses this template. The three `# (v2)` comments are spec annotations — keep the headings, the comments are optional flavor.

```markdown
# Workflow: <name>

## When to use
## Agents involved
## Inputs required
## Steps
## Board moves            # (v2) which columns change
## Handoffs produced
## Trace updates          # (v2) what gets linked in plans/traceability.md
## Metrics emitted        # (v2) what plans/metrics.md should record
## Stop conditions
## Done condition
```

**Heading order is load-bearing** — FLOW-05 and the Phase-6 validator (VAL-01) check presence AND order. Plus the minimal `kind: workflow` frontmatter (D-27) above the `# Workflow:` H1.

Note: §7.8–§7.12 ceremonies are given in the spec as compressed `When/Agents/Steps/Output` one-liners, NOT the full 10-section form. **The planner must still expand each ceremony into all 10 sections** (FLOW-05 requires every file follow the template) — mapping the one-liner's `When→When to use`, `Agents→Agents involved`, `Steps→Steps`, `Output→Handoffs produced`, and deriving the remaining sections tersely from frozen names (D-24).

---

## The §14 Backpressure Loop (lines ~1132–1146 — single-source into `05-pr-quality-gate.md`, reproduce faithfully)

```text
1. Deterministic prefetch: BEFORE the model writes code, the Orchestrator gathers context
   (ticket, handoffs, AGENTS.md commands, relevant files, prior ADRs). The agent starts
   focused, not drowning.
2. Implement on a branch (autonomy=branch|pr).
3. Run the gate: install -> lint -> typecheck -> unit -> build -> e2e (commands from AGENTS.md).
4. Bounded self-fix: if the gate fails, the agent gets a small, fixed number of self-fix
   attempts (default 2). After that, STOP and hand to a human. Do not loop forever.
5. Result: READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED.
6. Human reviews the PR. Human merges. Human (or human-confirmed pipeline) deploys.
```

**Determinism rules (spec §14, reproduce in clear voice):**
- Gate commands are **not invented** — they come from `AGENTS.md`. If a command is unknown, the gate records **`UNKNOWN - verify`** rather than faking a pass.
- The self-fix attempt count, coverage threshold, and "which gates are mandatory" come from **config**.
- In headless/CI use (e.g. a scheduled run that turns a ticket into a PR), the **same gate and the same "two rounds then human" rule apply**.

**Knobs (verified in `factory.config.json#quality`):**

| Knob | Frozen value | Meaning |
|------|--------------|---------|
| `self_fix_attempts` | `2` | "two rounds then human" |
| `coverage_threshold` | `0.8` | coverage floor |
| `mandatory_gates` | `["lint","typecheck","unit","build"]` | gates that must pass |
| `e2e_when` | `"ui-or-critical-path"` | when e2e runs |

**Terminal results (exact tokens — grep-checkable):** `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`.

**Gate command order (from §14 step 3 + AGENTS.md command sections):** `install → lint → typecheck → unit → build → e2e`. All six AGENTS.md slots currently ship `UNKNOWN - verify` (verified) — do NOT fabricate real commands.

**SAFE-01 in `05`:** step 6 is human-only — `05` emits a *recommendation*; a human reviews, a human merges, a human (or human-confirmed pipeline) deploys. `05` never auto-merges.

---

## The §6.2 `SPRINT-xx.md` Format (lines ~659–677 — `08-sprint-planning` writes this; reproduce VERBATIM)

```markdown
# Sprint xx
Goal: <one sentence outcome>
Dates: <start> -> <end>
Capacity: <points or ticket count>

## Committed
- [ABC-014] (M=3)
- [ABC-015] (S=2)

## Added mid-sprint (note why)
## Carried out (note why)

## Velocity: <points completed>
## Burndown: <remaining at day 1..n>
## Notes for retro: ...
```

**Field list (BOARD-03 acceptance):** Goal / Dates / Capacity / Committed / Added mid-sprint / Carried out / Velocity / Burndown / Notes for retro. `08` writes the file into `plans/sprints/` (verified: dir exists, ships only `.gitkeep` — empty, runtime-populated). `10-sprint-review` appends review notes to the same file. Velocity = `(scrum) size points per sprint` (frozen metric in `plans/metrics.md`).

**Cadence behavior reference (§6.2 — cite, don't redefine):**
- **Kanban (`cadence=kanban`, default):** continuous pull, no iterations; left→right when exit owner signs off; WIP limits are the throttle ("finish before you start"); the daily sweep reconciles the board and surfaces blockers; optimize for short cycle time and low WIP. → **BOARD-02**.
- **Scrum (`cadence=scrum`):** time-boxed sprints (length from `sprint_length_days`, default 10); each sprint has a goal, committed backlog, capacity; ceremonies = refinement, planning, daily sweep, review/demo, retro; one file per sprint in `plans/sprints/SPRINT-xx.md`; track velocity + simple burndown. → **BOARD-03**.

---

## Frozen-Names Inventory (real paths verified on disk this session)

Every name below was confirmed to exist by `ls`/`grep` on 2026-06-03. **Workflows cite these exact names — invent nothing, never parallel/invented names (D-24).**

### Roles (16) — board move + handoff each composes (D-23)

| Role file | Board move(s) it causes | Output handoff (frozen path) |
|-----------|------------------------|------------------------------|
| `roles/orchestrator.md` | `Ready for Dev → In Development`; `… → Done`; enforces WIP every column | inline `# Orchestrator Decision` (no handoff file) |
| `roles/agents-md-scribe.md` | **None** (substrate authoring) | root `AGENTS.md` (+ owns the 12 Karpathy rules) |
| `roles/brownfield-mapper.md` | **None** (maps) | `memory-bank/brownfield-map.md` (runtime, not seeded) |
| `roles/greenfield-mapper.md` | **None** (shapes) | `memory-bank/greenfield-plan.md` (runtime, not seeded) |
| `roles/ba-pm.md` | `Backlog → Ready` | `handoffs/product-handoff.md`; tickets→`plans/tickets|epics|features/` |
| `roles/system-analyst.md` | `In Analysis` exit (→ `In Design`) | `handoffs/system-handoff.md` |
| `roles/architect-design.md` | `In Design` exit | `handoffs/architecture-handoff.md` + ADRs into `memory-bank/50-decisions/ADR-000X-*.md` + seeds `plans/nfr-catalog.md` |
| `roles/software-engineer.md` | `In Development → In Review` | `handoffs/implementation-handoff.md` |
| `roles/qe-e2e.md` | `In Review` exit (→ In Security/NFR or UAT) | `handoffs/qe-handoff.md` |
| `roles/security-nfr.md` | `In Security/NFR` exit (→ Ready for UAT) | `handoffs/security-nfr-handoff.md`; result `PASS | PASS_WITH_RISKS | BLOCKED`; works `checklists/security-nfr-checklist.md` |
| `roles/uat-planner.md` | `Ready for UAT → In UAT`; owns `In UAT` exit (→ Ready to Release) | `handoffs/uat-handoff.md`; works `checklists/uat-checklist.md` |
| `roles/release-manager.md` | `Ready to Release → Done` (only after named human approves) | `plans/releases/REL-xxxx.md` + `handoffs/release-handoff.md`; cites `checklists/release-readiness-checklist.md`; status `READY_TO_RELEASE | BLOCKED | RELEASED` |
| `roles/compliance-officer.md` | **None** (gate within `In Security/NFR`) | appends to `handoffs/security-nfr-handoff.md` + fills `checklists/compliance-checklist.md`; result may be `BLOCKED` |
| `roles/incident-responder.md` | **None** (post-release) | `handoffs/incident-postmortem.md` (blameless) |
| `roles/factory-coach.md` | **None** | `handoffs/retro-notes.md`; reads `plans/metrics.md`; tickets→`plans/tickets/` tagged `factory` |
| `roles/installer.md` | **None** (tooling) | adapter/entry files + install report (Phase-5 mechanics) |

### Handoff filenames (16, `agent-factory/handoffs/`)
`universal-handoff.md`, `business-handoff.md`, `product-handoff.md`, `system-handoff.md`, `architecture-handoff.md`, `implementation-handoff.md`, `qe-handoff.md`, `security-nfr-handoff.md`, `uat-handoff.md`, `ticket-ready-packet.md`, `implementation-ready-packet.md`, `release-handoff.md`, `incident-postmortem.md`, `retro-notes.md`, `refinement-notes.md`, `sprint-plan.md`. Universal header carries `## Trace updates` field (frozen Phase 2) — the `Trace updates` workflow section names what this links.

### Checklist filenames (10 + index, `agent-factory/checklists/`)
**Lean (always active):** `definition-of-ready.md` (DoR gate before pulling), `definition-of-done.md` (lean DoD), `pr-review-checklist.md`, `security-nfr-checklist.md`, `uat-checklist.md`.
**Enterprise (only `mode: enterprise`, superset):** `definition-of-done-enterprise.md`, `compliance-checklist.md`, `accessibility-checklist.md`, `observability-slo-checklist.md`, `release-readiness-checklist.md`. Index: `00-index.md`. **Mode-gating rule (frozen):** Orchestrator applies lean DoD in `mode: lean`, enterprise superset in `mode: enterprise`.

### Board columns (13, `plans/board.md`, flow order — verified)
`Backlog`, `Ready`, `In Analysis`, `In Design`, `Ready for Dev`, `In Development`, `In Review`, `In Security/NFR`, `Ready for UAT`, `In UAT`, `Ready to Release`, `Done`, `Blocked`. WIP defaults from `factory.config.json#wip_limits` (Ready 8, In Analysis 2, In Design 2, Ready for Dev 6, In Development 3, In Review 3, In Security/NFR 2, Ready for UAT 4, In UAT 4, Ready to Release 4; Backlog/Done unlimited; Blocked visible/time-tracked).

### Config keys (`factory.config.json`, verified top-level)
`version`, `mode` (lean|enterprise), `cadence` (kanban|scrum), `autonomy` (diff|branch|pr), `id_prefix`, `repo_strategy`, `default_stack`, `wip_limits`, `sprint_length_days` (10), `sizing` (tshirt), `priority_scheme` (P0-P3), `quality.{coverage_threshold:0.8, self_fix_attempts:2, mandatory_gates:[lint,typecheck,unit,build], e2e_when:ui-or-critical-path}`, `nfr`, `compliance_regime` ([]), `environments` ([dev,staging,prod]), `production_requires_human_confirmation` (true), `blocked_escalation_days` (2).

### Trace columns (10, `plans/traceability.md`, fixed — do not rename/reorder)
`Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status`. ID scheme: `EPIC-xxx`, `FEAT-xxx`, `<prefix>-xxx`, `ADR-000x`, `NFR-xxx`, `RISK-xxx`, `REL-xxxx`, `INC-xxxx`.

### Metric names (9, `plans/metrics.md`)
`Throughput`, `Cycle time`, `Lead time`, `WIP`, `Blocked time`, `Rework rate`, `Gate pass rate`, `Escaped defects`, `Velocity` (scrum). The `Metrics emitted` sections name a subset of these; `09-daily-sweep` + `11-retro` are the update owners.

### AGENTS.md gate-command slots (root `AGENTS.md`, all `UNKNOWN - verify` — verified, do NOT fabricate)
Sections: `## Commands` → `### Install` (Install/bootstrap), `### Development` (Dev/run), `### Test` (all + single-file), `### Lint` (all + single-file autofix + Format single-file), `### Typecheck` (single-file), `### Build` (Build + Docs build + Clean), `### E2E` (E2E). The `05` gate pulls `install/lint/typecheck/unit/build/e2e` from these at runtime — all currently `UNKNOWN - verify`.

### State directories (verified, ship empty with `.gitkeep`)
`plans/sprints/` (08 writes `SPRINT-xx.md`), `plans/releases/` (12 writes `REL-xxxx.md`), `plans/epics/`, `plans/features/`, `plans/tickets/`. Memory-bank seed: `00-index.md`, `10-project-brief.md`, `20-product.md`, `30-architecture.md`, `40-contributing.md`, `50-decisions/`, `60-progress.md` (09 keeps current), `70-runbook.md`, `80-glossary.md`.

---

## Orchestrator Routing-Table Consistency Check (the critical gate)

**Source of truth:** `agent-factory/roles/orchestrator.md` `## Output` → "Classification | Workflow file" table (lines 90–105). Verified 1:1 against the 14 spec filenames and the CONTEXT enumeration.

| Orchestrator classification | Orchestrator-named file | Spec §7.x | Match? |
|---|---|---|---|
| greenfield-bootstrap | `00-bootstrap-greenfield.md` | §7.1 | ✓ |
| brownfield-bootstrap | `01-bootstrap-brownfield.md` | §7.2 | ✓ |
| idea-to-epics | `02-idea-to-epics.md` | §7.3 | ✓ |
| epic-to-tickets | `03-epic-to-tickets.md` | §7.4 | ✓ |
| ticket-to-pr | `04-ticket-to-pr.md` | §7.5 | ✓ |
| quality-gate | `05-pr-quality-gate.md` | §7.6 | ✓ |
| uat | `06-uat-pack.md` | §7.7 | ✓ |
| refinement | `07-backlog-refinement.md` | §7.8 | ✓ |
| sprint-planning | `08-sprint-planning.md` | §7.9 | ✓ |
| daily-sweep | `09-daily-sweep.md` | §7.10 | ✓ |
| sprint-review | `10-sprint-review.md` | §7.11 | ✓ |
| retro | `11-retro.md` | §7.12 | ✓ |
| release | `12-release.md` | §7.13 | ✓ |
| incident | `13-incident.md` | §7.14 | ✓ |

**Result: ZERO drift.** All 14 filenames + numbering are frozen and consistent across Orchestrator ↔ spec ↔ CONTEXT. The `install` classification has **no numbered workflow** (handled by the Installer role directly) — do NOT author a `14-install.md`.

**README cross-check (`agent-factory/README.md`):** copy-paste prompts reference workflows by number — `07` (refine), `08` (plan sprint, scrum), `09` (daily sweep), `04` (ticket-to-pr), `05` (PR quality gate), `06` (UAT pack), `12` (release, enterprise), plus bootstrap brownfield/greenfield prose. All consistent with the table above. **Risk flag:** the README's bootstrap prompts don't carry explicit `00`/`01` numeric labels (they're prose) — harmless, but the workflows' `When to use` should echo the README's user-facing phrasing so the copy-paste prompts map cleanly onto the authored files.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead (frozen) | Why |
|---|---|---|---|
| Step procedures | New prescriptive step bodies | The roles' own Responsibilities + Board moves (composed) | D-24: workflows sequence frozen role behavior, they don't redefine it |
| Gate commands | Real `npm test`/`eslint` strings | `AGENTS.md` `UNKNOWN - verify` slots, pulled at runtime | No-fabrication rule; commands are per-project (D-18/D-26) |
| A second scrum workflow set | `08-scrum-*` duplicates | ONE config-gated set, `When to use` declares cadence | D-25 single-source; no drift |
| The backpressure loop in `04` | Restated loop in `04` | A reference to `05` | D-26 single-source |
| Handoff/checklist/column/metric names | New parallel names | The verified frozen inventory above | Single-source; the workflows are the consumers, not the definers |
| The mechanical deploy guard | PreToolUse hook prose | Plain prose human-confirm gate | SAFE-02 is Phase 5; stay dispatch-neutral |

**Key insight:** In this phase, "writing code" means *citing existing names in the right order*. Every place you'd be tempted to invent (a command, a column, a handoff, a second file) there is already a frozen artifact — name it.

---

## Common Pitfalls

### Pitfall 1: Inventing parallel names instead of citing frozen ones
**What goes wrong:** A workflow says "writes a dev-handoff" instead of `implementation-handoff.md`, or "moves to Code Review" instead of `In Review`. **Why:** the spec's `Flow:` lines use prose shorthand. **Avoid:** every name in `Board moves`/`Handoffs produced`/`Trace updates`/`Metrics emitted` must match the frozen inventory exactly. **Warning sign:** any `*-handoff` path under `plans/` (real handoffs live under `agent-factory/handoffs/`); any column not in the 13-column list; any handoff not in the 16-file list. (Phase-3 harness check (f) already guards `plans/*-handoff` drift — extend it to workflows.)

### Pitfall 2: Duplicating the backpressure loop into `04`
**What goes wrong:** `04` restates the §14 loop, then it drifts from `05` over edits. **Avoid:** `04`'s `Steps` say "run the quality gate per `05-pr-quality-gate.md`"; the loop body lives only in `05` (D-26). **Warning sign:** the terminal-result tokens or the six gate verbs appearing in `04`.

### Pitfall 3: Authoring duplicate kanban/scrum files
**What goes wrong:** `08-sprint-planning-kanban.md` etc. **Avoid:** ONE set; cadence is declared in `When to use` and selected by the Orchestrator reading `config.cadence` (D-25). **Warning sign:** more than 14 files, or any filename with a cadence suffix.

### Pitfall 4: Grug voice leaking into operational/gate/safety text
**What goes wrong:** the gate, the release approval, or a stop condition reads in caveman voice and becomes imprecise. **Avoid:** clear voice for `Steps`/`Board moves`/gate/`Stop conditions`/all safety text; light wink only in `When to use` framing (D-27, mirrors D-21). **Warning sign:** caveman phrasing inside `## Steps`, `## Stop conditions`, or any human-confirm sentence.

### Pitfall 5: Making safety mechanical too early
**What goes wrong:** a workflow describes a PreToolUse hook / tool-specific dispatch. **Avoid:** SAFE-01 is **prose** this phase; the mechanism is Phase 5 (SAFE-02). Keep text dispatch-neutral (D-20/D-27). **Warning sign:** `hooks.json`, `PreToolUse`, `${CLAUDE_PLUGIN_ROOT}`, or subagent-spawn language in any workflow.

### Pitfall 6: Dropping a template section or reordering
**What goes wrong:** a ceremony authored from its §7 one-liner omits `Metrics emitted` or `Trace updates`. **Avoid:** all 10 sections, in order, in every file (FLOW-05). **Warning sign:** the grep harness section-count check fails for any file.

### Pitfall 7: Authoring a `14-install.md`
**What goes wrong:** treating the 15th classification (`install`) as a workflow. **Avoid:** `install` has no numbered workflow — the Installer role handles it directly. Exactly 14 files, `00`–`13`.

---

## Build / Wave Grouping Suggestion (planner concern — dependency-light)

All role/handoff/checklist/config contracts are already frozen, so **no inter-file content dependency forces a strict order** — the only soft ordering is that `05` should land before `04`'s reference resolves cleanly (D-26). Natural grouping:

- **Wave 0 (harness):** author `check-structure.sh` (Phase-4 version) RED first — the running acceptance gate, mirrors Phase-3 precedent. Goes green as files land.
- **Wave 1 — gate + lifecycle core:** `05-pr-quality-gate.md` (single-source loop) **first**, then `04-ticket-to-pr.md` (references `05`), then `02`, `03`, `06`. Parallelizable; disjoint files.
- **Wave 2 — bootstrap + ceremonies:** `00`, `01` (bootstrap), `07`, `08`, `09`, `10`, `11` (ceremonies, cadence-tagged). Parallelizable.
- **Wave 3 — enterprise:** `12-release.md`, `13-incident.md`. Parallelizable.

Waves are convenience groupings only; with frozen contracts, any file can be authored independently once `05` exists. A single-wave parallel author of all 14 is also viable if the harness is in place. **05-before-04 is the one ordering worth respecting.**

---

## Validation Architecture (Nyquist — ENABLED)

This is a **markdown-authoring** phase: validation is **structural / static**, exactly like Phase 3's `check-structure.sh` (verified precedent at `.planning/phases/03-roles-agents-md-substrate/check-structure.sh`). No runtime test runner exists or is needed (D-18). Build a Phase-4 `check-structure.sh` (POSIX `sh`, grep/wc/test only) that ships RED and goes green as the 14 files land — it IS the runnable acceptance criteria and de-risks the Phase-6 Node validator (VAL-01).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX `sh` + `grep`/`wc`/`test` harness (no runtime runner — D-18) |
| Config file | none — standalone script |
| Quick run command | `sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh` |
| Full suite command | same (single script; exit 0 = all PASS, exit 1 = ≥1 FAIL) |
| Real Node validator | `UNKNOWN - verify` — Phase-6/VAL-01, do NOT fabricate `node scripts/validate-agent-factory.mjs` here |

### Phase Requirements → Test Map
| Req | Behavior to prove | Check type | Concrete check (grep/wc) |
|-----|-------------------|-----------|--------------------------|
| FLOW-01/02/03/04 | All 14 files exist with exact names | file-presence | `test -f agent-factory/workflows/<NN>-<name>.md` for all 14; assert exactly 14 `*.md` (excluding `.gitkeep`) |
| FLOW-05 | Each file carries the 10 template sections in order | section-presence + order | per file, `grep -nF` each of `## When to use`/`## Agents involved`/`## Inputs required`/`## Steps`/`## Board moves`/`## Handoffs produced`/`## Trace updates`/`## Metrics emitted`/`## Stop conditions`/`## Done condition`; assert line numbers strictly increasing (order) |
| FLOW-05 | Minimal `kind: workflow` frontmatter | frontmatter | `grep -qF 'kind: workflow'` in every file; assert frontmatter block ≤ ~3 fields (count `^[a-z_]*:` lines in fences) |
| D-20 | Filenames ↔ Orchestrator routing table match | cross-file | for each `0[0-9]|1[0-3]-` name in `orchestrator.md`, assert a matching `workflows/<name>` exists; assert no `14-` file |
| GATE-01 | Backpressure loop appears **once, in 05** | single-source | `grep -lF 'READY_FOR_HUMAN_REVIEW' agent-factory/workflows/*.md` returns exactly `05-pr-quality-gate.md`; `05` contains all three terminal tokens + the six gate verbs `install`/`lint`/`typecheck`/`unit`/`build`/`e2e` + `self_fix_attempts` + `UNKNOWN - verify` |
| GATE-01 / D-26 | `04` references `05`, doesn't restate the loop | single-source | `04-ticket-to-pr.md` contains `05-pr-quality-gate.md`; `04` does NOT contain `READY_FOR_HUMAN_REVIEW` |
| GATE-01 | No fabricated gate command | no-fabrication | gate-command verbs in `05` traced to AGENTS.md slots; `05` contains `UNKNOWN - verify` (commands not hard-coded) |
| BOARD-03 | Scrum cadence + SPRINT format | cadence + format | `08`/`10` contain `cadence=scrum`; `08` references `plans/sprints/SPRINT-xx.md`; `08` names Goal/Committed/Velocity/Burndown |
| BOARD-02 | Kanban cadence works | cadence | `09-daily-sweep.md` references `plans/board.md` + `plans/metrics.md` + `memory-bank/60-progress.md` + `blocked_escalation_days`; cycle-time/WIP metrics named |
| FLOW-03 | Cadence tagging correct (08/10 scrum-only) | cadence | `08`,`10` carry `cadence=scrum`; `07`,`09`,`11` declare "both"; assert no cadence suffix in any filename (single set, D-25) |
| SAFE-01 | Human-confirm prose in every merge/deploy-touching workflow | safety-presence | `04` contains `autonomy=pr` + "never merge"; `05` contains "recommendation"/human-review (no auto-merge); `12` contains "named human"/"human-confirmed" + `production_requires_human_confirmation` |
| D-24 | No invented/parallel names (drift guard) | drift | no `plans/*-handoff` path in any workflow; every cited handoff ∈ the 16-file list; every cited column ∈ the 13-column list; every cited metric ∈ the 9-metric list |
| FLOW-04 | Blameless incident path | content | `13-incident.md` contains `incident-postmortem.md` + "blameless"/"never blames" |

### Sampling Rate
- **Per file authored:** run the harness; the just-landed file's section/section-order/name checks flip green.
- **Per wave:** full harness green for all files in the wave.
- **Phase gate:** full harness green (all 14 present, 10 sections each, routing match, loop single-sourced, cadence tags correct, SAFE-01 prose present, zero drift) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` — the full grep harness above; ship RED first (mirrors Phase-3 `check-structure.sh`). Covers FLOW-01..05, BOARD-02/03, GATE-01, SAFE-01.
- [ ] (optional) a `VALIDATION.md` deriving the same checks as human-readable acceptance, parallel to `03-VALIDATION.md`.

*(No framework install needed — POSIX `sh` is present; no `package.json` created, D-18 / VAL-01 constraint preserved.)*

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` in `.planning/config.json`. **This phase ships zero executable code and zero runtime input handling** — it authors markdown workflow templates. The conventional ASVS web categories (auth, session, crypto, input validation) **do not apply to the artifacts produced**. The relevant security posture is **process safety**, which the workflows encode as prose and the harness verifies.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard control in this phase |
|---------------|---------|-------------------------------|
| V1 Architecture | partial | "Humans decide, agents execute" encoded in every merge/deploy-touching workflow (SAFE-01) |
| V2 Authentication | no | no auth surface authored |
| V3 Session Mgmt | no | n/a |
| V4 Access Control | partial (process) | `autonomy=pr` (never merge); named-human approval gate on `12`; Orchestrator/Release-Manager hard limits (already verbatim, cited) |
| V5 Input Validation | no | no runtime input; gate commands are `UNKNOWN - verify`, never fabricated |
| V6 Cryptography | no | n/a — never hand-roll; none present |

### Known Threat Patterns for a markdown agent-factory kit
| Pattern | STRIDE | Standard mitigation (this phase) |
|---------|--------|---------------------------------|
| Agent merges a protected branch unattended | Elevation of Privilege | `autonomy=pr` prose gate in `04`/`05`; "never merge" hard limit (Orchestrator, verified); SAFE-02 mechanical hook deferred to Phase 5 |
| Agent deploys to prod unattended | Elevation of Privilege | `12-release` named-human approval + human-confirmed prod action, keyed to `production_requires_human_confirmation: true`; Release Manager "never deploy prod yourself" (verified verbatim) |
| Fabricated passing gate / faked test result | Tampering / Repudiation | §14 `UNKNOWN - verify`-not-faked rule reproduced in `05`; no-fabrication is a project constraint; harness asserts `UNKNOWN - verify` present and no hard-coded commands |
| Blame-driven incident handling | (process integrity) | `13-incident` blameless postmortem; "never blames a person" reproduced |

**Note:** The mechanical enforcement of the merge/deploy threats (the PreToolUse hook) is **Phase 5 (SAFE-02)** by explicit roadmap decision. Phase 4's job is the prose contract; flagging this so the planner does not pull SAFE-02 forward.

---

## State of the Art

No moving-target dependencies. This phase consumes only frozen in-repo files and the spec — there is no external library, framework, or version surface. (Phase 5 is the research-flagged phase per ROADMAP: Claude Code plugin format + per-tool AGENTS.md conventions move fast. Phase 4 has no such exposure.)

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `09-daily-sweep`'s exact "sweep report" wording (done/next/blocked) is discretionary | Spine table / Discretion | LOW — CONTEXT explicitly grants discretion (D-25 list) |
| A2 | The Phase-6 validator will check workflow section *presence and order* (not just presence) | Validation Architecture | LOW — mirrors Phase-3 harness; if Phase 6 checks presence-only, the order check is a stricter superset (safe) |
| A3 | Ceremonies (§7.8–7.12), given as one-liners, still expand to all 10 template sections | Template section | LOW — FLOW-05 requires every file follow the template; expansion is the only way to satisfy it |

**All other claims are VERIFIED on disk this session or CITED from the spec/CONTEXT.** No package installs, no external sources — Package Legitimacy Audit and Environment Availability sections are not applicable (code/markdown-only, no dependencies).

## Open Questions (RESOLVED)

Both questions are non-blocking and self-resolved inline below; the planner implemented the recommendations (Phase-4 plan 04-04 names `memory-bank/greenfield-plan.md` and echoes README bootstrap phrasing). Kept for traceability.

1. **`plans/initial-plan.md` stub population**
   - What we know: Phase-1 D deferred this to the bootstrap workflow / planner's call (CONTEXT discretion).
   - What's unclear: whether `00-bootstrap-greenfield` populates it or leaves a thin stub. The spec §7.1 `Done when:` names "greenfield-plan" (which the greenfield-mapper writes to `memory-bank/greenfield-plan.md`), not `plans/initial-plan.md`.
   - Recommendation: leave `plans/initial-plan.md` a thin stub / unreferenced; `00` names `memory-bank/greenfield-plan.md` as the planning output (matches the frozen greenfield-mapper role). Planner's discretion per CONTEXT.

2. **README bootstrap prompts lack explicit `00`/`01` labels**
   - What we know: README labels `04/05/06/07/08/09/12` by number but gives bootstrap as prose.
   - What's unclear: nothing blocking — just a phrasing-consistency nicety.
   - Recommendation: `00`/`01` `When to use` openers should echo the README's bootstrap prompt phrasing so copy-paste prompts map cleanly. Flagged in the consistency check.

## Sources

### Primary (HIGH confidence — verified on disk this session)
- `docs/initial/agent_factory_builder_spec_v2.md` §6.1–6.5 (board/cadence/SPRINT/sizing/metrics, L574–711), §7 (workflow template + all 14 Flow/Done-when, L715–780), §8 (handoff templates + universal header, L784–871), §14 (backpressure loop, L1128–1146), §15 (config, L1150–1204)
- `agent-factory/roles/orchestrator.md` — routing table (L90–105), classification, hard limits, board moves
- `agent-factory/roles/*.md` (15 others) — per-role Board moves + Output handoff (extracted this session)
- `agent-factory/README.md` — copy-paste Orchestrator prompts (L83–112), start-here, usage table
- `agent-factory/handoffs/` (16 files), `agent-factory/checklists/` (10 + index), `agent-factory/config/factory.config.json`, `plans/board.md`, `plans/traceability.md`, `plans/metrics.md`, `plans/sprints/` + `plans/releases/` (empty, `.gitkeep`), root `AGENTS.md` (command slots), `memory-bank/*` — all names verified by `ls`/`grep`
- `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` — the validation-harness precedent
- `.planning/phases/04-workflows-cadence-backpressure/04-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`

### Secondary / Tertiary
- None — no external sources needed; this phase is fully internal/frozen-file-driven.

## Metadata

**Confidence breakdown:**
- Standard stack (frozen names inventory): **HIGH** — every name verified on disk 2026-06-03
- Architecture (10-section template, §14 loop, SPRINT format, routing table): **HIGH** — reproduced verbatim from spec + verified against frozen Orchestrator table (zero drift)
- Pitfalls / validation: **HIGH** — modeled directly on the working Phase-3 `check-structure.sh` precedent

**Research date:** 2026-06-03
**Valid until:** stable — inputs are frozen in-repo files + the committed spec; no decay unless Phase 1–3 outputs change (they are LOCKED)

## RESEARCH COMPLETE
