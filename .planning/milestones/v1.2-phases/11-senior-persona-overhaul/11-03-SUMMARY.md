---
phase: 11-senior-persona-overhaul
plan: 03
subsystem: role-prompts + business-analysis-layer
tags: [persona, voice, token-economy, in-place-rewrite, invest, definition-of-ready, prose-only]
requires:
  - "Plans 11-01 (7 roles) + 11-02 (8 roles) shipped GREEN — ba-pm is the 16th and final role rewrite"
  - "Phase 10 foundation guards (guard_voice + adapter-size, exit 0)"
provides:
  - "ba-pm.md rewritten to senior persona (PERS-01, the 16th role) with senior BA judgment woven in (PERS-02)"
  - "definition-of-ready.md deepened as the single INVEST + measurable-NFR hub (D-08), prose-only (D-09)"
  - "07-backlog-refinement.md ceremony deepened to senior level, still points to the DoR"
  - "ticket-ready-packet.md kept field-for-field aligned with the DoR (new INVEST field added same task)"
  - "the senior BA substrate Phase 12's Three Amigos + executable scenarios build on top of"
affects:
  - "Plan 11-04 (guard_role_size enforces the ba-pm headroom ceiling; guard_voice expansion scans ba-pm)"
  - "Phase 12 (BDD): the Three Amigos substep is added on top of this senior BA layer / DoR rigor"
tech-stack:
  added: []
  patterns:
    - "in-place senior rewrite within the fixed 9-section role skeleton — no new section (D-01/D-02/D-03)"
    - "seniority encoded as compression (sharper judgment per token); ba-pm 2745->3291 B, within its explicit BA-headroom ceiling 3294 B (D-04)"
    - "INVEST + measurable-NFR rigor woven INTO existing terse DoR bullets — single-source hub, no new file (D-08)"
    - "prose quality only — Given/When/Then prose line KEPT, no Three Amigos / Example Mapping / executable wiring (D-09, the Phase-11/12 seam)"
    - "DoR<->packet 1:1 contract preserved — a new gated DoR check ships with its matching packet field in the same task (Pitfall 5 / T-11-05)"
key-files:
  created: []
  modified:
    - agent-factory/roles/ba-pm.md
    - agent-factory/checklists/definition-of-ready.md
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/handoffs/ticket-ready-packet.md
decisions:
  - "Senior BA judgment (INVEST shape, testable+measurable acceptance, measurable NFR targets, DoR rigor) lands as prose woven into existing sections, paid for by compressing weak connective prose — same token-economy mechanism as Plans 11-01/11-02 (D-04)"
  - "The INVEST-shaping gate became one genuinely new gated DoR check; per the DoR<->packet 1:1 contract its matching '## INVEST shape' field was added to ticket-ready-packet.md in the SAME task so the gate never desyncs (T-11-05 mitigation)"
  - "Prose-only boundary held strictly — the Given/When/Then line stays prose; zero Three Amigos / Example Mapping / executable scenarios across ba-pm, the DoR, and workflow 07 (D-09)"
metrics:
  duration: ~6m
  completed: 2026-06-11
  tasks: 2
  files: 4
---

# Phase 11 Plan 03: ba-pm Senior Persona + Senior BA Deepening Summary

The 16th and final role rewrite (`ba-pm.md`, PERS-01) landed in one coherent edit alongside the senior BA deepening (PERS-02): INVEST-shaped stories, testable + measurable acceptance, measurable NFR targets, and a Definition of Ready that closes the business→engineer handoff — all prose-only, single-sourced on the DoR hub, no Phase-12 executability.

## What Was Built

**Task 1 — ba-pm.md senior rewrite (PERS-01 + PERS-02 woven in).** Rewritten holistically top-to-bottom inside the fixed 9-section skeleton (no section added, scope unchanged). Senior BA judgment was deepened in place:
- `## Responsibilities` now shapes tickets **INVEST** (independent, negotiable, valuable, estimable, small, testable), writes Given/When/Then acceptance that is **testable and measurable** ("a number, a state, an observable outcome, never 'works'"), and requires each NFR trigger to carry a **measurable target** (p95 latency, error budget, concurrency) — "fast"/"secure" is explicitly not a requirement.
- Forward-thinking, hard-won judgment landed as sharp clauses: "a ticket only a long chain delivers is two tickets hiding", "an oversized ticket hides unestimated risk that bites mid-build", "the feature you talk yourself out of is the one you never maintain".
- The existing `definition-of-ready.md` pointer is kept (no duplicated checklist into the role); the `## Caveman prompt` grug block, contract sections (Output / Board moves / Trace updates), kit-vs-state refs, and the 12-rules footer are all preserved.

**Task 2 — DoR hub + workflow 07 deepened, packet kept aligned (PERS-02 / D-08).**
- `definition-of-ready.md`: INVEST-shape check + testable+measurable acceptance + a measurable-NFR-target line woven into the existing terse bullets, bullet style kept, file still terse. The `acceptance criteria clear (Given/When/Then)` prose line is **kept** (D-09).
- `07-backlog-refinement.md`: the BA/PM bullet and Steps 2/4/5 gained senior refinement judgment (INVEST shaping, testable+measurable acceptance, measurable NFR targets, estimability-as-readiness signal); it still points to the DoR by name; the Phase-12 Three Amigos substep seam is left clean (not added).
- `ticket-ready-packet.md`: one genuinely new gated DoR check (INVEST-shaped) was unavoidable, so a matching `## INVEST shape` field + `<!-- DoR: ... -->` comment was added **in the same task** so the DoR↔packet 1:1 mapping never desyncs (T-11-05 / Pitfall 5).

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Senior rewrite of ba-pm.md (PERS-01) + senior BA judgment (PERS-02) | `461f69d` | agent-factory/roles/ba-pm.md |
| 2 | Deepen DoR hub + workflow 07; keep ticket-ready-packet aligned | `76729d4` | definition-of-ready.md, 07-backlog-refinement.md, ticket-ready-packet.md |

## Verification

- ba-pm.md: `## Caveman prompt` == 1, `## One job` == 1 (skeleton + scope intact); `definition-of-ready.md` pointer kept; INVEST present; **no** Three Amigos/Example Mapping; **3291 B ≤ 3294 B** explicit BA-headroom ceiling (baseline 2745 B; modest justified growth, not bloat).
- DoR: INVEST present, measurable-NFR rigor present, `Given/When/Then` prose line kept (D-09), zero Three Amigos/Example Mapping across the DoR + workflow 07.
- DoR↔packet 1:1 closure: all 10 DoR gated checks map to a matching `<!-- DoR: -->` packet field (0 missing); 11 packet mappings = 10 checks + the pre-existing intentional double-map of "no major unresolved blocker" (on `## Ticket ID` and the dedicated field, unchanged from Plan 02-01).
- workflow 07 still points to `definition-of-ready.md` by name.
- `sh scripts/check-foundation-guards.sh` exits 0 (caveman block intact, clear-voice surfaces free of caveman markers).
- `node scripts/validate-agent-factory.mjs` exits 0 with `VALIDATE_KIT_ROOT` set (the bare-run C3 "unset kit root" exit is correct Phase-9 two-root behavior, not a regression).
- Stub-pattern scan (`TODO|FIXME|coming soon|placeholder|not available`) over all 4 files: zero matches.
- ZERO `.claude/**` adapters touched — single-source adapter check (SC4) stays green for free.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Initial ba-pm rewrite overshot the byte ceiling**
- **Found during:** Task 1 verification
- **Issue:** The first holistic rewrite added the senior BA judgment (INVEST, testable+measurable acceptance, measurable NFRs) as net-new sentences, pushing ba-pm.md to 3800 B — 506 B over the 3294 B BA-headroom FAIL ceiling. D-04 (terse caveman = token economy) is the phase's core constraint; a bloated rewrite is an explicit failure, not a style choice.
- **Fix:** Re-sharpened iteratively so each judgment clause *replaces* weak connective prose rather than sitting on top of it — compressed the Reads/Output/Board-moves/Trace-updates tails and de-duplicated the Hard-limits line that restated Responsibilities #3. Landed at 3291 B (within ceiling, +20% over baseline — the modest, justified BA headroom).
- **Files modified:** agent-factory/roles/ba-pm.md
- **Commit:** `461f69d`

### Deliberate, plan-sanctioned choice

**INVEST-shaping became a new gated DoR check (not folded into an existing line).** The plan preferred landing rigor inside existing DoR lines (no new field), but INVEST does not map cleanly onto any single existing check. Per the plan's explicit fallback and T-11-05, the new `## INVEST shape` packet field was added in the same task, preserving the DoR↔packet 1:1 contract. Not a deviation — the plan authorized exactly this path.

## Known Stubs

None — stub-pattern scan over all 4 modified files returned zero matches.

## Threat Flags

None — no new network/auth/file-access/schema surface introduced. The only integrity-relevant change (a new gated DoR check) was matched by its packet field in the same task per the threat register (T-11-05).

## Self-Check: PASSED

- All 4 modified files exist (verified).
- Commit `461f69d` present: FOUND.
- Commit `76729d4` present: FOUND.
- `check-foundation-guards.sh` exits 0: FOUND.
- ba-pm.md 3291 B ≤ 3294 B ceiling: confirmed.
- DoR↔packet 1:1 closure (0 missing): confirmed.
- No file deletions in either commit: confirmed.
