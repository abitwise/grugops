---
kind: workflow
order: 6
cadence: both
---
# Workflow: UAT pack

## When to use
When a feature is complete and a named human must accept it before release. grug speak business now — turn the acceptance criteria into scenarios a person can sign off. The change flows feature complete -> UAT Planner -> BA/PM validation -> QE validation -> UAT pack.

## Agents involved
- UAT Planner — assembles the scenarios, test data, pass/fail criteria, signoff checklist, and known limitations.
- BA/PM — validates the business acceptance against the original value and scope.
- QE/E2E — validates that the test coverage backs the scenarios.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The completed feature and the Security/NFR scan result that gated it (read from the shared verified context per Workflow 16).
- The ticket's acceptance criteria.
- `agent-factory/checklists/uat-checklist.md` — the UAT gate this role works through.

## Steps
1. Assemble the UAT pack as typed notes per Workflow 16 (UAT Planner). The pack holds the business scenarios, the test data, and the pass/fail criteria. It also holds the signoff checklist naming the human role, and the known limitations. Work through `agent-factory/checklists/uat-checklist.md`.
2. Validate the business acceptance: confirm the scenarios cover the user value and scope (BA/PM).
3. Write each validated scenario as a committed `<ticket-id>.uat.spec.ts` under the `uat/` subfolder of the repository's end-to-end directory (QE/E2E). Explore the running application through the pinned browser MCP server documented in `agent-factory/checklists/browser-uat-recipe.md`. Open the application, walk the scenario, and record the assertions observed. The MCP transcript is an authoring aid and never the evidence; the gate re-running the committed spec is the evidence. The spec meets the spec-integrity ban set. No assertion is written inside a conditional, inside a caught region, or behind a skip or soft modifier. No new role is introduced here. The UAT Planner still owns the scenarios, and QE/E2E still owns coverage.
4. Validate the test coverage: confirm the tests back the scenarios, and name any remaining gaps (QE/E2E).
5. Obtain the named human's signoff on the scenarios; the ticket then moves on toward release.

## Board moves
On `plans/board.md`, the UAT Planner moves the ticket `Ready for UAT -> In UAT` to begin acceptance. The UAT Planner owns the `In UAT` exit. Once the named human signs off, the ticket moves to `Ready to Release` (or directly to `Done` in lean mode).

Green machine-backed evidence does not by itself carry the ticket past acceptance. With the shipped configuration, the `In UAT -> Ready to Release` move still stops for a named human at the `sign_off_acceptance` checkpoint. The zero-config posture stops there, and this workflow does not change it. The lean path straight to `Done` is unchanged. A repository that trusts its machine-backed evidence may lower `sign_off_acceptance` in its own `checkpoints` configuration. The closed disposition vocabulary lives in `agent-factory/config/factory.config.md`, which publishes `block`, `notify` and `off`. Only a value the repository actually wrote can lower it; absence reads as the documented default. `sign_off_acceptance` is not a safety floor, so no floor is weakened and no second key is involved. No new checkpoint id is added for an evidence-backed advance. The UAT Planner presents the pack as machine-backed either way — the dial changes who signs, never what the evidence is.

## The attended Chrome lane

An optional attended browser lane exists for a human who wants to watch the session. The lane produces a `finding` stamped with a named human and an `artifact-ref` describing what was witnessed, and nothing else. The witnessing human's name arrives only through the existing admission grant that a separate process reads; the agent can never author it. The lane cannot produce a gate stamp, so an attended narration is never presented in the pack as machine-verified evidence. Read `agent-factory/checklists/browser-uat-recipe.md` for the setup and for host availability. The recipe is referenced here, never restated.

## Trace updates
Append to `plans/traceability.md` the `UAT` link and the human signoff result against the ticket row. Update `Status` in the same row, so acceptance traces back to the test row and forward to the release row.

## Metrics emitted
Record `Lead time` in `plans/metrics.md` as the ticket clears acceptance.

## Stop conditions
- The acceptance criteria are missing or ambiguous — stop and route the ticket back; never self-sign or fake a pass. A named human signoff is required. `checkpoint: sign_off_acceptance`

## Done condition
The scenarios, test data, pass/fail criteria, signoff checklist, and known limitations exist. The named human has signed off. The ticket moves to `Ready to Release` (or to `Done` in lean mode).

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/uat-pack-<id>`), then `type(scope): summary`. The artifacts are the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics and the updated traceability rows. Never merge, never deploy; humans hold both.
