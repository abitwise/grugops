---
kind: workflow
order: 14
cadence: both
---
# Workflow: UI design to build

## When to use
When a ticket needs UI/frontend work — a design contract authored once, then built and verified. grug no guess the look — Frontend/UI names the contract, the engineer builds it, QE breaks it. The change flows product context -> Frontend/UI design contract -> Software Engineer build -> QE/E2E verification at the gate.

## Agents involved
- Frontend/UI — authors the UI/design contract once.
- Software Engineer — builds the components against the contract (see `agent-factory/workflows/04-ticket-to-pr.md`).
- QE/E2E — verifies the built UI against the contract at the gate (see `agent-factory/workflows/05-pr-quality-gate.md`).

Each role reads the shared verified context before it works and records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A ready ticket with UI/frontend scope.
- The product `## Acceptance scenarios`, the implementation-ready context, and the architecture decisions when present — all read from the shared verified context per Workflow 16; the contract is authored from these.
- `agent-factory/checklists/accessibility-checklist.md` — the accessibility item hub.
- The `autonomy` setting from `.grugops/factory.config.json`.

## Steps
1. Frontend/UI authors the UI/design contract from the product `## Acceptance scenarios`, the implementation-ready context (and the architecture decisions when present), all read from the shared verified context per Workflow 16 — design tokens, component inventory, the five states (loading / empty / error / success / partial-data), the WCAG 2.2 AA accessibility bar, and a tool-neutral visual-baseline expectation. The contract is recorded as a typed note per Workflow 16. One activation; no re-review.
2. The Software Engineer builds the components against the contract per `agent-factory/workflows/04-ticket-to-pr.md`. The engineering loop, the inner red-green cycle, and the bounded self-fix live there — this workflow references that build and does not restate it.
3. Walk the five states — loading, empty, error, success, partial-data — as a practice for each component. This is guidance for completeness, not a hard gate.
4. Meet the accessibility bar. WCAG 2.2 AA is the target standard whenever a ticket changes the user interface; the item-level list (semantic structure and labels, keyboard reachability with visible focus, color contrast, alt text, form error and label association) lives in `agent-factory/checklists/accessibility-checklist.md` — this workflow points to that checklist rather than re-enumerating it.
5. Establish the visual baseline — a stable reference of the rendered component, described so it can be compared against later. Keep this expectation tool-neutral.
6. Verify the built UI against the contract per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there — this workflow references that gate and does not restate it. QE/E2E owns the verification; Frontend/UI does not re-activate to review.

## Board moves
On `plans/board.md`, the contract is authored before `In Development` (the design step), then the build and verification follow the standard `Ready for Dev -> In Development -> In Review (-> In Security/NFR)` path owned by the Software Engineer and QE/E2E per workflows 04 and 05. Frontend/UI causes no board transition of its own — it writes the contract the engineer pulls from.

## Trace updates
Append to `plans/traceability.md`: the design-contract link against the ticket row, and update `Status`. The code and test links are appended by the referenced build (04) and gate (05).

## Done condition
The design contract is written, the components are built per workflow 04, the five states and the WCAG 2.2 AA accessibility bar are met, the visual baseline is established, and the built UI is verified against the contract per workflow 05. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote (the board context, the frontend design-contract note recorded per Workflow 16, and the updated traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/ui-design-to-build-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
