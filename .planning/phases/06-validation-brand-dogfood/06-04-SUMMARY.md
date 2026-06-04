---
phase: 06-validation-brand-dogfood
plan: 04
subsystem: examples
tags: [examples, narration, brand, illustrative, EX-01]
requires:
  - "agent-factory/workflows/01,07-12 (frozen flow spines)"
  - "plans/board.md (column headings), plans/traceability.md (row shape), plans/metrics.md (vocabulary)"
provides:
  - "examples/02-brownfield-bootstrap.md — illustrative brownfield bootstrap narration"
  - "examples/04-sprint-cycle.md — illustrative sprint cycle narration with board snapshots + velocity line"
  - "examples/05-release-run.md — illustrative release run narration with completed traceability rows"
affects:
  - "EX-01 (illustrative half — three of the five example runs)"
tech-stack:
  added: []
  patterns:
    - "event-driven narration of frozen flow spines (input -> Orchestrator decision -> board moves -> handoffs -> trace/metrics)"
    - "two-voice discipline (D-21): caveman framing prose, clear voice for the safety deploy gate"
key-files:
  created:
    - examples/02-brownfield-bootstrap.md
    - examples/04-sprint-cycle.md
    - examples/05-release-run.md
  modified: []
decisions:
  - "D-47: every illustrative example opens with the exact 'Illustrative run — expected output, not a captured session' banner and uses obvious placeholder IDs (ABC-001, REL-0007, <PR-link>)"
  - "D-48: medium-depth structure — input -> Orchestrator decision/routing -> board moves -> expected files/handoffs (representative snippets) -> trace/metrics line"
  - "D-49: /grugops (dash standalone) + /grugops:<op> (plugin colon) only — never literal /grug"
metrics:
  duration: 6m
  completed: 2026-06-04
---

# Phase 6 Plan 04: Illustrative Example Runs Summary

Three medium-depth, banner-labeled illustrative example runs (brownfield bootstrap, sprint
cycle, release run) narrating the frozen §7 flow spines with real column/handoff/metric names
and `/grugops` throughout — the illustrative half of EX-01.

## What Was Built

- **`examples/02-brownfield-bootstrap.md`** — narrates the frozen `01-bootstrap-brownfield`
  flow (existing repo → Orchestrator routing → Brownfield Mapper → AGENTS.md Scribe →
  Architect/Design review → Security/NFR high-risk scan → safe first tickets). Renders the
  inline `# Orchestrator Decision` block, real board column headings (`Backlog`,
  `In Security/NFR`), the `security-nfr-handoff.md` with a `PASS_WITH_RISKS` result token,
  honest `UNKNOWN - verify` command slots, and seeded traceability rows. Placeholder IDs
  `ABC-001`..`ABC-003`.
- **`examples/04-sprint-cycle.md`** — narrates the scrum ceremony spine
  (`07-backlog-refinement → 08-sprint-planning → 04-ticket-to-pr ×2 → 09-daily-sweep →
  10-sprint-review → 11-retro`). Includes two board snapshots using real `## <Column>
  (WIP n/m)` headings and a velocity/metrics line drawn only from the frozen §6.5 vocabulary
  (`Velocity`, `Throughput`, `Cycle time`). Cites `implementation-handoff.md`, `qe-handoff.md`,
  `refinement-notes.md`, `retro-notes.md`, the `SPRINT-12.md` field shape, and the
  `READY_FOR_HUMAN_REVIEW` gate verdict. Placeholder IDs `ABC-012`/`ABC-014`.
- **`examples/05-release-run.md`** — narrates the frozen `12-release` flow
  (`Ready to Release → Release Manager → approval gate → deploy plan → human-confirmed
  deploy → Done`). Uses the `REL-0007` and `<PR-link>` placeholders, renders the named-human
  deploy gate in CLEAR voice (safety topic — no caveman), shows completed traceability rows
  in the documented `| ABC-012 | … | Done |` form, and cites `release-handoff.md` +
  `plans/releases/REL-0007.md`.

All three open with the exact D-47 honesty banner, follow the D-48 medium-depth structure,
and render `/grugops` / `/grugops:<op>` only — never literal `/grug`.

## How to Verify

- `ls examples/02-brownfield-bootstrap.md examples/04-sprint-cycle.md examples/05-release-run.md` — all present.
- Each opens with `> Illustrative run — expected output, not a captured session` (D-47).
- `examples/04-sprint-cycle.md`: `grep -qE '## In Development \(WIP' && grep -qiE 'velocity|throughput|cycle time'` — board snapshot + velocity line.
- `examples/05-release-run.md`: `grep -q 'REL-0007' && grep -qE '\| *Done *\|'` — placeholder ID + completed traceability rows; deploy gate in clear voice.
- `! grep -rE '/grug([^o]|$)' examples/` — no literal `/grug` (D-49).
- `git status --porcelain agent-factory/ plans/` empty — frozen flows + state plane untouched.

## Deviations from Plan

None — plan executed exactly as written. The frozen `agent-factory/` and `plans/` trees were
read-only inputs; only the three new `examples/*.md` files were created. No npm/pip/cargo
installs (pure markdown — threat T-06-SC accepted).

## Threat Mitigations Applied

- **T-06-FAB (mislabel as real):** every file opens with the exact honesty banner + obvious
  placeholder IDs; the verify grep asserts the banner.
- **T-06-DRIFT (inventing flow/handoff/metric):** narrate only the frozen §7 flow spines and
  cite REAL handoff filenames (`security-nfr-handoff.md`, `implementation-handoff.md`,
  `qe-handoff.md`, `refinement-notes.md`, `retro-notes.md`, `release-handoff.md`) and REAL
  §6.5 metric names (`Velocity`, `Throughput`, `Cycle time`, `Lead time`); nothing invented.
- **T-06-CMD (literal /grug leak):** `/grugops`/`/grugops:<op>` only; `! grep -rE
  '/grug([^o]|$)' examples/` passes across all three files.

## Known Stubs

None. These are documentation files; the placeholder IDs (`ABC-001`, `REL-0007`, `<PR-link>`)
are intentional per D-47 (illustrative examples must use obvious placeholders, not fabricated
real artifacts) and are clearly banner-labeled as expected output. The two REAL-captured
examples (#1 greenfield bootstrap, #3 ticket→PR) fall out of the Plan 05 dogfood, completing
EX-01.

## Self-Check: PASSED

- FOUND: examples/02-brownfield-bootstrap.md
- FOUND: examples/04-sprint-cycle.md
- FOUND: examples/05-release-run.md
- FOUND commit: bb81ff9 (Task 1 — brownfield)
- FOUND commit: 232b8d0 (Task 2 — sprint + release)
