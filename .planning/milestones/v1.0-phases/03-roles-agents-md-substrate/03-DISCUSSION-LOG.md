# Phase 3: Roles & AGENTS.md Substrate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 3-roles-agents-md-substrate
**Areas discussed:** Role authoring depth, Root AGENTS.md identity & Commands, Karpathy 12-rules placement, Orchestrator ↔ Phase-4 boundary

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Role authoring depth | How much beyond the spec's verbatim caveman prompt to author across the 9-section skeleton | ✓ |
| Root AGENTS.md identity & Commands | Generic shipped template vs grugops's own substrate; what fills the Commands section | ✓ |
| Karpathy 12-rules placement | Single-source in AGENTS.md vs embedded across role files | ✓ |
| Orchestrator ↔ Phase-4 boundary | How much the Orchestrator encodes now vs defers to Phase-4 workflows | ✓ |

**User's choice:** All four areas selected for discussion.

---

## Role authoring depth

| Option | Description | Selected |
|--------|-------------|----------|
| Lean-derived | Caveman prompt verbatim; other 8 sections derived tersely from spec + frozen Phase-2 contracts, zero invention, ~one screen per role | ✓ |
| Fleshed-out bodies | Richer Responsibilities prose, worked examples, extra guidance per role | |
| Ultra-minimal | Prompt + Output line + Hard limits only; thinner sections one-lined or omitted | |

**User's choice:** Lean-derived (recommended).
**Notes:** Becomes D-15. Honors minimal-AGENTS constraint + Karpathy rules 5–7. Pairs with D-16 (role frontmatter `kind: role` + tier), D-17 (universal v2 lines as a consistent standard), D-23 (board-moves at role granularity, workflows sequence).

---

## Root AGENTS.md identity & Commands

| Option | Description | Selected |
|--------|-------------|----------|
| Generic template, UNKNOWN slots | Shipped §17.1 substrate; Commands = file-scoped slot table with `UNKNOWN - verify`, filled per-project by bootstrap/Scribe (consistent with D-04) | ✓ |
| grugops's own substrate | Describes this repo; Commands = grugops's validator + install scripts (which don't exist until Phase 5/6) | |
| Generic now, note own-commands later | Generic template + an explicit note to fill grugops's own commands at Phase 5/6 | |

**User's choice:** Generic template, UNKNOWN slots (recommended).
**Notes:** Becomes D-18. Paired with D-21 (in-file voice split — clear voice for mission/safety/rules/commands; grug wink permitted only in non-safety framing).

---

## Karpathy 12-rules placement

| Option | Description | Selected |
|--------|-------------|----------|
| Once in AGENTS.md, roles inherit | Full 12 rules verbatim in AGENTS.md (clear voice); Scribe owns/maintains; other 15 roles reference, not repeat | ✓ |
| AGENTS.md + Scribe restates | Rules in AGENTS.md AND fully restated in the Scribe role; other 14 inherit | |
| Embed in every role | Each of the 16 roles restates the rules | |

**User's choice:** Once in AGENTS.md, roles inherit (recommended).
**Notes:** Becomes D-19. Honors single-source ("role text lives once"); Scribe ownership matches its §5.A.2 job.

---

## Orchestrator ↔ Phase-4 boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Contract now, name workflows | Encode routing matrix + classification + WIP/DoR gate + XL-split + Output format + hard limits; reference Phase-4 workflows by name without inlining steps; dispatch-neutral | ✓ |
| Inline workflow detail | Pull Phase-4 workflow step sequences into the Orchestrator now | |
| Minimal pointer | Orchestrator lists only the routing matrix; defer classification/gate/split to Phase 4 | |

**User's choice:** Contract now, name workflows (recommended).
**Notes:** Becomes D-20. Keeps the Orchestrator dispatch-neutral (spawn-vs-sequential is Phase-5 packaging); avoids Phase-3/Phase-4 overlap.

---

## Claude's Discretion

Confirmed by the user via the "Ready for context" choice; locked as defaults in CONTEXT.md:
- Role frontmatter exact fields/order (D-16) — kept to 2–3 high-signal fields.
- Exact wording of derived Reads/Responsibilities/Board moves/Trace updates bullets (D-15) — must cite frozen names, invent nothing.
- Whether each role opens `Reads` with a shared preamble vs inline reads — lower-drift option wins.
- Exact one-line pointer the 15 non-Scribe roles use to reference AGENTS.md for the 12 rules.
- Exact Commands slot labels/order in AGENTS.md; whether the Mission line carries a grug wink (permitted, D-21).
- Enterprise `Activates when` phrasing (D-22) — `mode=enterprise OR <§5.B trigger>`, trigger preserved.
- Authoring/build order: Orchestrator → 11 core → 5 enterprise → AGENTS.md last (dependency note; planner sets waves).

## Deferred Ideas

- Workflow files sequencing the roles + the quality-gate backpressure loop → Phase 4.
- Dispatch mechanics, per-tool wrappers, mechanical prod-deploy hook → Phase 5.
- Filling real commands into AGENTS.md's UNKNOWN slots → per-project at runtime (bootstrap/Scribe).
- Runtime role outputs (brownfield-map.md, greenfield-plan.md) → produced under Phase-4 bootstrap.
- Phase-6 validator's exact role/AGENTS.md section-presence checks → Phase 6.
- Final version string + commands/-vs-skills/ form → Phase 5 open decisions.
