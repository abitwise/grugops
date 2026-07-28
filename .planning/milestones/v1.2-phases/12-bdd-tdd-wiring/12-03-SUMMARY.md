---
phase: 12-bdd-tdd-wiring
plan: 03
subsystem: engineering-workflow
tags: [tdd, double-loop, red-green, workflow-04, impl-ready-packet, single-source]
requires:
  - "agent-factory/workflows/05-pr-quality-gate.md (the §14 gate this step references for enforcement)"
  - "agent-factory/checklists/example-mapping.md (the seam worked-example hub — landed in plan 12-02)"
  - "agent-factory/handoffs/qe-handoff.md ## Acceptance scenarios block (outer-loop contract — landed in plan 12-01)"
provides:
  - "TDD red-green inner loop + double-loop / no-second-red rule in workflow 04 Step 3 (TDD-01 workflow half)"
  - "contract-vs-logic seam (D-09) stated in workflow 04, pointing to example-mapping.md (not restated)"
  - "D-13 light forward-pointer in workflow 04 Trace updates (scenarios flow forward to UAT/release)"
  - "upfront TDD test-strategy read-before-coding line in implementation-ready-packet.md (D-11)"
affects:
  - "agent-factory/roles/software-engineer.md + qe-e2e.md (the role-enforcement half of TDD-01 — plan 12-04)"
  - "Phase 15 test-integrity gate (consumes the followable rule; lands the mechanical enforcement)"
tech-stack:
  added: []
  patterns:
    - "reference-not-restate (the TDD step points to gate 05 + the seam hub; enforcement stays single-source)"
    - "dial-read inline parenthetical naming the default (quality.tdd off/encouraged/required, default encouraged)"
    - "empty-but-shaped clear-voice <!-- reference ... --> comment in the handoff template"
key-files:
  created: []
  modified:
    - "agent-factory/workflows/04-ticket-to-pr.md"
    - "agent-factory/handoffs/implementation-ready-packet.md"
decisions:
  - "Seam (D-09) stated as a one-line rule in workflow 04 + a pointer to example-mapping.md — the worked discount example is NOT duplicated into the workflow (single-source)"
  - "quality.tdd dial named inline in Step 3 (off/encouraged/required, default encouraged); the dialed EVIDENCE field is plan 12-04's concern, kept out of here"
  - "D-13 forward-pointer rendered as an HTML comment in ## Trace updates — a single carry line; workflows 06/02/03 left untouched"
  - "impl-ready packet TDD line rendered as the file's existing <!-- reference ... --> clear-voice comment style under the existing ## Test strategy heading — no new heading, no fake data"
metrics:
  duration: 1m
  completed: 2026-06-11
  tasks: 2
  files: 2
---

# Phase 12 Plan 03: TDD Red-Green Double-Loop (Workflow + Packet Half) Summary

Encoded the engineer-owned TDD red-green-refactor inner loop and the double-loop / no-second-red rule in `04-ticket-to-pr.md`, with the contract-vs-logic seam pointing to the existing `example-mapping.md` hub, plus the upfront read-before-coding TDD test-strategy line in `implementation-ready-packet.md` — enforcement deliberately left single-source in gate 05 (Phase 15), and a one-line D-13 forward-pointer carrying scenarios to UAT/release.

## What Was Built

### Task 1 — Workflow 04 TDD step + D-13 forward-pointer (`agent-factory/workflows/04-ticket-to-pr.md`)
- Expanded **Step 3** from "a small diff, with tests" to carry the engineer's **inner loop**: write a FAILING unit test (red) -> minimal code to pass (green) -> refactor (still green), per unit behavior. The `quality.tdd` dial is named inline (off / encouraged / required, default encouraged).
- Encoded the **double-loop rule (D-08)**: the outer acceptance scenario (QE-owned, from the handoff `## Acceptance scenarios` block) stays RED until the inner loop closes it, and NO SECOND acceptance scenario goes red before the first is green.
- Stated the **contract-vs-logic seam (D-09)** in one line — acceptance asserts the observable business outcome once; unit tests assert the logic/edge cases beneath it — and pointed to `agent-factory/checklists/example-mapping.md` for the worked example rather than restating it.
- Preserved the **Step 4 gate reference** to `05-pr-quality-gate.md` unchanged and added one clause noting mechanical no-second-red / one-behavior-one-layer enforcement is the §14 gate's concern (Phase 15 boundary) — no mechanical guard authored, the gate loop is not restated.
- Added the **D-13 light forward-pointer** as an HTML comment in `## Trace updates`: the acceptance scenarios flow forward to UAT/release, NOT rewritten here. No touch to workflows 06/02/03.

### Task 2 — Impl-ready packet TDD test-strategy line (`agent-factory/handoffs/implementation-ready-packet.md`)
- Under the **existing** `## Test strategy` heading (no new heading), added one terse clear-voice `<!-- reference ... -->` line in the file's established comment style: which unit tests prove the changed behavior, which layer owns what (acceptance owns the observable outcome / outer loop; unit tests own the logic + edge cases / inner loop), naming the one-behavior-one-layer seam and pointing to `example-mapping.md`. Empty-but-shaped, no fake data.

## Deviations from Plan

None - plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered. Rules 1-4 did not fire.

## Threat Model Coverage

- **T-12-03-DUP (Repudiation — BDD/TDD duplication, disposition: mitigate):** mitigated as planned — the one-line contract-vs-logic seam (D-09) in workflow 04 + the seam line in the impl-ready packet both point to the hub's worked example, giving the engineer a followable rule for where the layer line falls. Mechanical no-duplication enforcement remains correctly deferred to the Phase 15 test-integrity gate; this plan lands the rule, not the gate.
- No new trust boundaries, executable code, or security surface introduced (markdown workflow + handoff template edits in a no-runtime kit).

## Verification Results

- `sh scripts/check-foundation-guards.sh` exits 0 (ALL CHECKS PASSED) — this plan touched no role file or adapter, so guards stay GREEN for free; confirmed before and after both tasks.
- Workflow 04 greps all exit 0: red-green-refactor sequence present; double-loop / no-second-red rule present (`no second` / `outer` / `inner`); gate-05 reference preserved; D-13 forward-pointer present (`forward` / `uat` / `carried`); seam points to `example-mapping.md`.
- No mechanical guard authored / gate not restated: `! grep -qi 'self_fix_attempts\|self-fix loop'` holds in workflow 04.
- No UAT/upstream rewrite: the plan's two commits touch only `04-ticket-to-pr.md` and `implementation-ready-packet.md` — `06-uat-pack.md` and workflows 02/03 unchanged (`git diff --name-only HEAD~2 HEAD`).
- impl-ready packet: exactly one `## Test strategy` heading (`grep -c` = 1) carrying the TDD line (`grep -qi 'unit\|layer\|red.*green'` exits 0).
- Seam not duplicated: the discount worked example lives only in `example-mapping.md` (12-02); workflow 04 and the packet carry a single rule line + a pointer.

## Known Stubs

None. No stub patterns (empty values flowing to UI, placeholder text, unwired data sources) — this plan adds prose rules and a read-before-coding reference comment to markdown templates in a no-runtime kit.

## Self-Check: PASSED

- FOUND: agent-factory/workflows/04-ticket-to-pr.md (modified)
- FOUND: agent-factory/handoffs/implementation-ready-packet.md (modified)
- FOUND commit 1de96c1 (feat(12-03): add TDD red-green double-loop step to workflow 04)
- FOUND commit e0f4c9e (feat(12-03): add TDD test-strategy line to impl-ready packet)
