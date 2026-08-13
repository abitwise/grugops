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

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A ready ticket with UI/frontend scope.
- The product `## Acceptance scenarios`, the implementation-ready context, and the architecture decisions when present. All are read from the shared verified context per Workflow 16, and the contract is authored from them.
- `agent-factory/checklists/accessibility-checklist.md` — the accessibility item hub.
- The `autonomy` setting from `.grugops/factory.config.json`.

## Steps
1. Draft the UI/design contract from the product `## Acceptance scenarios` and the implementation-ready context (Frontend/UI). Read the architecture decisions too when they are present. Read all of them from the shared verified context per Workflow 16. The contract names the design tokens and the component inventory. It names the five states: loading, empty, error, success and partial-data. It also names the WCAG 2.2 AA accessibility bar and a tool-neutral visual-baseline expectation. Record the contract as a typed note per Workflow 16. One activation; no re-review.
2. Implement the components against the contract per `agent-factory/workflows/04-ticket-to-pr.md` (Software Engineer). The engineering loop, the inner red-green cycle, and the bounded self-fix live there. This workflow references that build and does not restate it.
3. Walk the five states — loading, empty, error, success, partial-data — as a practice for each component. The walk is guidance for completeness, not a hard gate.
4. Meet the accessibility bar. WCAG 2.2 AA is the target standard whenever a ticket changes the user interface. The item-level list lives in `agent-factory/checklists/accessibility-checklist.md`. That list covers semantic structure and labels, keyboard reachability with visible focus, and color contrast. It also covers alt text, and form error and label association. This workflow points to that checklist rather than re-enumerating it.
5. Establish the visual baseline — a stable reference of the rendered component, described for comparison later. Keep this expectation tool-neutral.
6. Verify the built UI against the contract per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there. This workflow references that gate and does not restate it. QE/E2E owns the verification; Frontend/UI does not re-activate to review.

## Board moves
On `plans/board.md`, the contract is authored before `In Development` (the design step). The build and verification then follow the standard `Ready for Dev -> In Development -> In Review (-> In Security/NFR)` path. The Software Engineer and QE/E2E own it per workflows 04 and 05. Frontend/UI causes no board transition of its own — it writes the contract the engineer pulls from.

## Trace updates
Append to `plans/traceability.md`: the design-contract link against the ticket row, and update `Status`. The code and test links are appended by the referenced build (04) and gate (05).

## Stop conditions
- The ticket has no readable acceptance scenarios and no product context to author the contract from → stop. Send it back to product rather than inventing the intent.
- A component cannot meet the WCAG 2.2 AA bar without a product decision → stop and get the decision. The decision may be a contrast change, or a control the design does not have. Never mark the accessibility item passed on an unmet control.
- The gate (workflow 05) exhausts its bounded self-fix budget against the contract → stop and hand to a human, per that workflow. Never hand-set a green.
- The built UI diverges from the contract and the contract is judged wrong → stop and re-author the contract as a recorded decision. Never let the build silently redefine the contract.

## Done condition
The design contract is written, and the components are built per workflow 04. The five states and the WCAG 2.2 AA accessibility bar are met, and the visual baseline is established. The built UI is verified against the contract per workflow 05. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/ui-design-to-build-<id>`), then `type(scope): summary`. The artifacts are the board context, the frontend design-contract note recorded per Workflow 16, and the updated traceability rows. Never merge, never deploy; humans hold both.
