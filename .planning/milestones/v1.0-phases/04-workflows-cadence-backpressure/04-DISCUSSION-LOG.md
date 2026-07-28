# Phase 4: Workflows, Cadence & Backpressure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 4-workflows-cadence-backpressure
**Areas discussed:** Workflow authoring depth, Cadence mechanism, Backpressure gate encoding, Frontmatter/voice/SAFE-01

---

## Workflow authoring depth (→ D-24)

| Option | Description | Selected |
|--------|-------------|----------|
| Terse derivation | Reproduce 10-section template + spec Flow/Done verbatim; derive thin connective Steps from frozen board exit-owners + role board-moves + handoff filenames; ~one screen each; invent nothing (D-15 logic applied to workflows). | ✓ |
| Fuller operational bodies | Expand each Flow into explicit numbered sub-steps with role activations and per-step outputs — more prescriptive at runtime, more invention and drift risk. | |
| You decide | Pick depth per-workflow based on how much the frozen contracts pin down. | |

**User's choice:** Terse derivation (Recommended)
**Notes:** Consistent with the Phase 1–3 posture (max spec fidelity, min invention). The spec gives workflows no verbatim body — only a one-line Flow:/Done-when: — so the derived sections must cite frozen names and avoid inventing prescriptive procedure.

---

## Cadence mechanism (→ D-25)

| Option | Description | Selected |
|--------|-------------|----------|
| One config-gated set | Single set of 14 workflows; each ceremony declares its cadence in 'When to use' (scrum-only: 08,10; both: 07,09,11); Orchestrator reads config.cadence to select. Single-source, no drift. | ✓ |
| Duplicate kanban/scrum sets | Separate workflow files per cadence where flow differs — more explicit, more files + drift risk. | |
| You decide | Default to one set; split a workflow only if its Steps genuinely diverge. | |

**User's choice:** One config-gated set (Recommended)
**Notes:** Matches the spec's per-workflow cadence tags (§7.9/§7.11 scrum-only; §7.10/§7.12 both) and the single-source constraint. Cadence-divergent Steps within a shared file expressed as an inline note/branch, not a second file.

---

## Backpressure gate encoding (→ D-26)

| Option | Description | Selected |
|--------|-------------|----------|
| Single-source in 05 | Full §14 loop (prefetch→implement→gate→bounded-self-fix→result) lives once in 05-pr-quality-gate.md; 04 references it; commands from AGENTS.md (UNKNOWN-verify, never faked); knobs from config.quality. | ✓ |
| Inline in both 04 and 05 | Each workflow restates the gate; self-contained but duplicated, drift risk. | |
| You decide | Single-source in 05 unless a reference-only 04 reads awkwardly. | |

**User's choice:** Single-source in 05 (Recommended)
**Notes:** Result terminal set `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`; self_fix_attempts (default 2 / "two rounds then human"), coverage_threshold, mandatory_gates, e2e_when all from config; same gate applies in headless/CI use.

---

## Frontmatter, voice & SAFE-01 rendering (→ D-27)

| Option | Description | Selected |
|--------|-------------|----------|
| Clear + light wink, kind: workflow | Clear voice for operational/gate/stop/safety content; light grug wink only in framing prose (mirrors AGENTS.md D-21); minimal kind: workflow frontmatter (+ order/cadence/tier at discretion). | ✓ |
| Full grug voice | Caveman voice throughout like role prompts — risks muddying gate/release-safety content the voice rules require stay clear. | |
| Strictly clear, no wink | Plain operational docs, zero grug — maximally precise, loses brand voice entirely. | |

**User's choice:** Clear + light wink, kind: workflow (Recommended)
**Notes:** SAFE-01 rendered as PROSE human-confirm gates this phase (autonomy=pr → branch+PR never merge in 04; recommendation-not-merge in 05; named approval + human-confirmed deploy in 12-release), keyed to production_requires_human_confirmation. Workflow text stays dispatch-neutral — the mechanical PreToolUse hook is Phase 5 / SAFE-02.

---

## Claude's Discretion

- Exact wording of derived Steps / Board moves / Trace updates / Metrics emitted / Stop conditions bullets (must cite frozen names, invent nothing).
- Exact frontmatter field set/order within the 2–3-field `kind: workflow` block (whether to add order / cadence / tier).
- Whether a shared ceremony's cadence divergence is an inline `if cadence=scrum …` note or two labeled sub-flows within the one file.
- `09-daily-sweep` board↔ticket reconciliation phrasing and the "sweep report" (done/next/blocked).
- Build/wave order of the 14 files (planner concern; no inter-file content dependency forces strict order).
- Whether `plans/initial-plan.md` is populated by `00-bootstrap-greenfield` or left a thin stub.

## Deferred Ideas

- Mechanical prod-deploy guard (plugin hooks.json PreToolUse) + autonomy=pr fallback docs → Phase 5 (SAFE-02).
- Per-tool dispatch mechanics + thin wrappers → Phase 5 (PKG/CLAUDE/INSTALL).
- Filling real gate commands into AGENTS.md slots → per-project at runtime, never fabricated.
- Runtime workflow outputs (brownfield-map, greenfield-plan, populated board/sprint files, real tickets) → produced when workflows run; exercised at Phase-6 dogfood.
- Phase-6 validator workflow section-presence checks → Phase 6 (VAL-01).
- Five example runs narrating the flows → Phase 6 (EX-01).
- Final version string + commands/-vs-skills/ form → Phase 5 open decisions.
