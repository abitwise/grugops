---
phase: 06-validation-brand-dogfood
plan: 05
subsystem: testing
tags: [dogfood, validator, examples, parity, claude-code, fastify, agents-md]

# Dependency graph
requires:
  - phase: 06-01
    provides: scripts/validate-agent-factory.mjs (the structural validator run on the sample tree, DOG-01)
  - phase: 06-04
    provides: examples/02/04/05 illustrative renders + the D-47 honesty-banner + /grugops-only conventions reused by the REAL captures
  - phase: 05
    provides: install.sh GRUGOPS_SRC/TARGET env-override (out-of-repo install), plugin.json/marketplace.json + hooks/guard.mjs (the live-CC surface the runbook drives), the frozen 04-ticket-to-pr → 05-pr-quality-gate flow
provides:
  - "REAL agent-run dogfood capture: out-of-repo TS/Node+Fastify sample, grugops installed via the portable AGENTS.md sequential path, bootstrapped, ABC-001 driven idea→PR, gate verdict READY_FOR_HUMAN_REVIEW (EX-01 examples #1 + #3)"
  - "DOG-01: validator passed on the sample's resulting tree AND on grugops's own tree"
  - "docs/dogfood-human-runbook.md: the human-run half (D-31 plugin-cache pointer resolution, SAFE-02 live hook firing, CC sub-agent spawn) with the V14 safety constraint"
  - "Dual-path parity table (DOG-02) with the agent-proven sequential column filled and the CC-native column honestly marked pending human"
affects: [milestone-close-uat, phase-06-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Honest agent-proven / human-pending split (D-38): the executor captures ONLY what actually ran; live-CC-session items are marked pending human, never simulated"
    - "Out-of-repo dogfood sample (Pitfall 5): sample app lives in /tmp, never committed into the frozen grugops tree"

key-files:
  created:
    - examples/01-greenfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - docs/dogfood-human-runbook.md
  modified: []

key-decisions:
  - "[06-05] Dogfood ran on an out-of-repo TS/Node+Fastify sample (/tmp/grugops-dogfood-20260604-084625): grugops installed via the portable AGENTS.md sequential path, ABC-001 GET /version driven idea→PR; gate ran install→lint→typecheck→unit→build all green (2/2 tests), terminal READY_FOR_HUMAN_REVIEW; local branch feat/ABC-001-version-endpoint, no remote (PR <none> recorded honestly)"
  - "[06-05] DOG-01: node scripts/validate-agent-factory.mjs exits 0 on the sample tree AND on grugops's own tree"
  - "[06-05] The three live-CC items (D-31 plugin-cache pointer resolution, SAFE-02 live hook firing, CC sub-agent spawn + CC-native parity column) DEFERRED to milestone-close UAT at the user's checkpoint choice (resume-signal = deferred); cells stay pending human, never fabricated"

patterns-established:
  - "Honest split as design: humans decide, agents execute — the runbook frames the human-run half as intended design, not a degradation"
  - "Dual-path parity assertion: same ticket / same handoff filenames / same gate verdict — only the dispatch differs, never the content"

requirements-completed: [DOG-01, EX-01]

# Metrics
duration: 5min
completed: 2026-06-04
---

# Phase 6 Plan 5: Hybrid Dogfood Summary

**REAL out-of-repo idea→PR dogfood on a TS/Node+Fastify sample (gate verdict READY_FOR_HUMAN_REVIEW, validator passing) captured as EX-01 examples #1/#3, with the live-Claude-Code half authored as a human runbook and honestly deferred to milestone-close UAT.**

## Performance

- **Duration:** ~5 min (this finalization pass; the agent-run dogfood + runbook authoring landed in the prior session under commits `ab0cda9` / `05d16b0`)
- **Completed:** 2026-06-04
- **Tasks:** 2 (Task 1 auto, Task 2 checkpoint:human-verify — resolved "deferred")
- **Files modified:** 3 deliverables (no changes this pass — finalization only)

## Accomplishments

- **Agent-proven REAL half (complete):** A fresh TS/Node+Fastify sample was created OUTSIDE the repo (`/tmp/grugops-dogfood-20260604-084625`), grugops was installed via the portable `AGENTS.md` sequential path, bootstrapped, and ticket `ABC-001 — GET /version endpoint` was driven idea→PR through the frozen `04-ticket-to-pr` → `05-pr-quality-gate` flow. The gate ran `install → lint → typecheck → unit → build` — all green (2/2 tests), terminal verdict **`READY_FOR_HUMAN_REVIEW`** — captured as `examples/01-greenfield-bootstrap.md` and `examples/03-ticket-to-pr.md` (EX-01 examples #1 + #3) with the D-47 `Real run` banner.
- **DOG-01 met:** `node scripts/validate-agent-factory.mjs` exits 0 on the sample's resulting tree AND on grugops's own tree (re-confirmed this pass on the own tree).
- **Human-runbook half (authored, live run deferred):** `docs/dogfood-human-runbook.md` covers the three live-CC-session items the executor cannot honestly self-perform — D-31 plugin-cache pointer resolution, SAFE-02 live PreToolUse hook firing, and the CC sub-agent spawn path — with PASS/FAIL slots and the V14 safety constraint stated in clear voice (never set `GRUGOPS_PROD_DEPLOY_APPROVED`, never run a real deploy).
- **Dual-path parity (DOG-02):** the side-by-side parity table in `examples/03-ticket-to-pr.md` has its agent-proven sequential column filled from the captured run; the CC-native column stays `pending human` (9 cells) pending the live session — honest, not simulated.

## Task Commits

Tasks were committed atomically in the prior session; this pass adds only the finalization commit.

1. **Task 1: Agent-driven sequential dogfood + capture REAL examples #1 and #3** — `ab0cda9` (feat) — `examples/01-greenfield-bootstrap.md`, `examples/03-ticket-to-pr.md`
2. **Task 2: Author the human runbook + dual-path parity** — `05d16b0` (docs) — `docs/dogfood-human-runbook.md` (+ parity table in `examples/03-ticket-to-pr.md`); the checkpoint live-run step resolved with user response **"deferred"**

**Plan metadata:** `docs(06-05): complete hybrid dogfood (agent-proven REAL; live-CC verification deferred to milestone UAT)` — this finalization commit (SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `examples/01-greenfield-bootstrap.md` — REAL greenfield-bootstrap slice from the dogfood (EX-01 #1), `Real run` banner
- `examples/03-ticket-to-pr.md` — REAL dogfood report (EX-01 #3): input → Orchestrator decision → board moves → handoffs → gate verdict → branch/PR (honest `<none>`, no remote) + the dual-path parity table (CC-native cells `pending human`)
- `docs/dogfood-human-runbook.md` — precise human checklist for the live-CC half (D-31, SAFE-02, sub-agent spawn) + the V14 safety constraint + the parity-fill step

## Decisions Made

- **Live-CC verification deferred (this plan's defining decision):** at the `checkpoint:human-verify` (gate=blocking-human), the user chose **"deferred"** — the three live-Claude-Code items move to milestone-close UAT. The CC-native parity cells stay `pending human`; the agent-proven sequential half + validator stand as the captured REAL proof in the interim. This is the honest split working as designed (D-38), not a gap papered over.
- **Honest PR record:** the throwaway sample has no git remote, so the PR link is recorded as `<none — no remote on the throwaway sample; a human opens the PR on a real remote>` rather than inventing a URL (T-06-FAB2 mitigation).

## Requirements Status

- **DOG-01 — MET.** The validator passed on the dogfood sample's resulting tree and on grugops's own tree (exit 0, bare and `--strict`).
- **EX-01 (real half) — MET.** Examples #1 (`01-greenfield-bootstrap.md`) and #3 (`03-ticket-to-pr.md`) are captured as REAL runs with the D-47 honesty banner. (The three illustrative examples #2/#4/#5 landed in 06-04; EX-01 is now complete across the suite.)
- **DOG-02 — PARTIALLY MET.** The sequential agent-proven path is proven end-to-end (same ticket / same handoffs / same gate verdict captured), and the human runbook + parity table assert "only the dispatch differs, never the content." The CC-native human-confirmed path (plugin marketplace install, plugin-cache pointer resolution, live hook firing, sub-agent spawn) is **deferred / pending human** to milestone-close UAT. DOG-02 is fully met only once a human fills the CC-native parity column.

## Deviations from Plan

None - plan executed exactly as written. The "deferred" outcome at Task 2's checkpoint is an explicit branch of the plan's own `resume-signal` ("...or 'deferred' to leave them marked pending human for the milestone-close UAT"), not a deviation.

## Issues Encountered

None during this finalization pass. The agent-run half and runbook authoring completed cleanly in the prior session; prior commits `ab0cda9` and `05d16b0` verified present, the three deliverables present and unchanged, the CC-native parity cells still `pending human`, the frozen `agent-factory/` tree clean, and no out-of-repo sample committed under the repo root.

## User Setup Required

**One live-Claude-Code verification is deferred to milestone-close UAT.** See `docs/dogfood-human-runbook.md` for the three checks a human runs in a live Claude Code session against the dogfood sample repo:

1. **D-31** — plugin marketplace install + plugin-cache pointer resolution (`/plugin marketplace add` → `/plugin install grugops@grugops` → `/grugops:plan` resolves, not a path error)
2. **SAFE-02** — live PreToolUse hook firing (a matched `kubectl apply` is DENIED absent the human-set approval env var)
3. **CC sub-agent spawn path** — drive the same `ABC-001` via the `Agent` spawn; confirm same handoff filenames + same `READY_FOR_HUMAN_REVIEW` verdict; fill the parity column

V14 constraint (in the runbook, clear voice): never set `GRUGOPS_PROD_DEPLOY_APPROVED`, never run a real deploy.

## Next Phase Readiness

- Phase 6 plan slate is complete (5/5 produced). The only outstanding item is the deferred live-CC verification, tracked for milestone-close UAT — not a blocker for plan-level closure.
- Phase-level completion + verification is owned by the orchestrator (not called here).

---
*Phase: 06-validation-brand-dogfood*
*Completed: 2026-06-04 (live-CC verification deferred to milestone-close UAT)*

## Self-Check: PASSED

- FOUND: examples/01-greenfield-bootstrap.md
- FOUND: examples/03-ticket-to-pr.md
- FOUND: docs/dogfood-human-runbook.md
- FOUND: commit ab0cda9 (Task 1)
- FOUND: commit 05d16b0 (Task 2)
- CONFIRMED: CC-native parity cells still `pending human` (9 cells in examples/03-ticket-to-pr.md)
- CONFIRMED: validator exits 0 on grugops's own tree
- CONFIRMED: agent-factory/ frozen tree clean; no out-of-repo sample committed under repo root
