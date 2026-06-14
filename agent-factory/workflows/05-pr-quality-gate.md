---
kind: workflow
order: 5
cadence: both
---
# Workflow: PR quality gate

## When to use
When a change is implemented and needs to pass the gate before a human reviews it. grug no merge on a green guess — the gate runs, the result is recorded, a human decides. This workflow is the single source of the backpressure loop: when an implementation is ready, the change flows implementation -> QE/E2E -> Security/NFR -> Architect/Design (if structure changed) -> Orchestrator recommendation. Every other workflow that needs the gate references this file rather than restating the loop.

## Agents involved
- QE/E2E — breaks the feature, reports coverage and gaps (writes `plans/handoffs/<TICKET-ID>-qe.md`).
- Security/NFR — reviews risk when triggered (writes `plans/handoffs/<TICKET-ID>-security-nfr.md`).
- Architect/Design — only if the change altered structure (writes `plans/handoffs/<TICKET-ID>-architecture.md`).
- Orchestrator — runs the deterministic prefetch and emits the recommendation. The Orchestrator recommends; it never auto-merges.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The implemented change on a branch and the Software Engineer's filled handoff `plans/handoffs/<TICKET-ID>-implementation.md`.
- The ticket and its acceptance criteria; relevant prior ADRs in `memory-bank/50-decisions/`.
- Gate commands pulled from the root `AGENTS.md` command slots at runtime.
- Quality knobs from `.grugops/factory.config.json#quality`.
- `agent-factory/checklists/pr-review-checklist.md`.

## Steps
The backpressure loop, in clear voice. Run it in this order:

1. **Deterministic prefetch.** Before the model writes code, the Orchestrator gathers the context the change needs — the ticket, the open handoffs, the gate commands from `AGENTS.md`, the relevant files, and any prior ADRs. The agent starts focused, not drowning.
2. **Implement on a branch** (`autonomy=branch` or `autonomy=pr`).
3. **Run the gate** in order: `install -> lint -> typecheck -> unit -> build -> e2e -> test-integrity`. The commands come from the root `AGENTS.md` command slots — they are never invented. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. `mandatory_gates` (`["lint","typecheck","unit","build"]`) must pass; `coverage_threshold` (`0.8`) is the coverage floor; `ui_e2e` (`"ui-or-critical-path"`) decides when e2e runs. The lint, UI/E2E, and test-integrity steps are config-dialed under `quality` — wire each as follows:

   - **Lint** is already in the sequence and in `mandatory_gates`; `quality.lint {strict, autofix}` sets its behavior. `strict:true` → fail-on-warning (the linter's `--max-warnings 0`-style flag); `strict:false` → warnings are reported in clear voice and only errors fail. `autofix:true` → run the linter's **safe** autofix first, recheck, then report any residue (this autofix runs inside the bounded `self_fix_attempts` loop — lint is agent-fixable); `autofix:false` → report only, fix nothing. When **no linter** is configured in the `AGENTS.md` Lint slot, the lint step records `UNKNOWN - verify` and treats it as **non-blocking** — a repo with no applicable linter can still reach `READY_FOR_HUMAN_REVIEW` (an honest UNKNOWN is recorded, never a faked pass). See `agent-factory/checklists/linter-recommendations.md` for the per-stack table (ESLint / Biome / Ruff / golangci-lint), strict and safe-autofix flags, and the UNKNOWN fallbacks.

   - **UI/E2E** runs when `quality.ui_e2e` (`off | ui-or-critical-path | always`) says so. The step covers Playwright visual-regression and axe-core accessibility (WCAG 2.2 AA). The how-to is referenced, not restated: see `agent-factory/checklists/playwright-visual-regression-recipe.md` for the flake-resistant `toHaveScreenshot` recipe and `agent-factory/checklists/accessibility-checklist.md` for the axe-core automated bar. Fix-lane split: a UI/E2E **code or a11y** defect (broken locator, axe violation, functional failure) is agent-fixable inside the self-fix loop; **updating a visual baseline is human-only** — accepting a changed screenshot to make a red test pass is goalpost-moving and the agent may not do it.

   - **Test-integrity** runs **after** unit and e2e (they produce the skip count). The gate invokes the materialized checker: `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>`, where `<N>` is the skipped-test count captured from the `AGENTS.md` `### Test integrity` skip-count slot. If that count cannot be determined, the gate records `UNKNOWN - verify` — **never a silent 0**. Branch on the checker's exit code: `0` → the registry justifies every skip, pass; `1` → a test-integrity finding (the gate flags it — an unjustified, expired, or malformed skip); `2` → the checker could not run (e.g. the registry path is missing or unreadable) — an error distinct from a clean fail, recorded as such, never read as a pass. This step is **always human-only** (a human owns `.grugops/test-skips.md`): the agent may not self-author a justification to clear its own gate, so on exit `1` the gate STOPS and hands to a human — see the human-only short-circuit in Step 4.
4. **Bounded self-fix.** If the gate fails, the agent gets a small, fixed number of self-fix attempts — `self_fix_attempts` from config (default `2`, "two rounds then human"). After that, STOP and hand to a human. Do not loop forever. The same gate and the same "two rounds then human" rule apply in headless or CI use.

   The bounded loop runs **only for agent-fixable failures** — lint (autofix then recheck) and UI/E2E code/a11y defects. A **human-only** failure short-circuits straight to `BLOCKED_NEEDS_FIX` with the specific reason and does **not** consume a self-fix attempt; the agent cannot fix it, so spending budget is wasteful and tempts a cheating "fix". Two failures are human-only: a UI/E2E **visual-baseline** acceptance, and a test-integrity **exit `1`**. On either, name the reason and stop — do not retry, do not edit the baseline, do not write into the skip registry.
5. **Result.** The gate produces exactly one terminal result: `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`. All checks pass → `READY_FOR_HUMAN_REVIEW`. An agent-fixable failure that survives the self-fix budget, or any human-only failure (visual-baseline acceptance, test-integrity exit `1`) → `BLOCKED_NEEDS_FIX` with the specific reason. `SPLIT_REQUIRED` stays size-driven and unchanged.

   **Advisory composition.** When `quality.gate_enforcement` is `advisory`, the pipeline ACTION is uniformly downgraded to advice — including a test-integrity finding — but the finding is **still emitted loudly in clear professional voice**: the trace stays intact, never silent. `quality.test_integrity` has no `off` value in any mode (the TINT-03 trace-integrity floor); that floor forbids silently accepting a hollowed-out suite, not a hard pipeline stop — advisory mode advises loudly, it does not hide.
6. **Human gate.** A human reviews the PR against `agent-factory/checklists/pr-review-checklist.md`. A human merges. A human (or a human-confirmed pipeline) deploys. This step is human-only.

## Board moves
On `plans/board.md`, the gate runs while the ticket sits in `In Review`. When a triggered Security/NFR review is needed, the QE/E2E exit moves it on to `In Security/NFR`. The gate does not move work to `Done` — only a human-approved merge (and release, in enterprise mode) does.

## Handoffs produced
Under `plans/handoffs/` (filled from the templates in `agent-factory/handoffs/`): `<TICKET-ID>-qe.md` (QE/E2E) and `<TICKET-ID>-security-nfr.md` (Security/NFR, when triggered). `<TICKET-ID>-architecture.md` is produced only if the change altered structure and the Architect/Design review re-runs.

## Trace updates
Append to `plans/traceability.md`: the `Tests` link (from the QE result) and the `Code (PR/files)` link, against the ticket row, and update `Status`.

## Metrics emitted
Record `Gate pass rate` in `plans/metrics.md`.

## Stop conditions
- The self-fix budget (`self_fix_attempts`) is exhausted and the gate still fails -> `BLOCKED_NEEDS_FIX`. Stop and hand to a human.
- A human-only failure occurs — a UI/E2E visual-baseline acceptance, or a test-integrity exit `1` -> `BLOCKED_NEEDS_FIX` immediately, with the specific reason. Do not consume a self-fix attempt; the agent cannot fix it. Stop and hand to the human who owns the baseline or `.grugops/test-skips.md`.
- The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. Stop and route it back for splitting.

## Done condition
The gate produces one of the three terminal results — `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`. This workflow emits a recommendation that a human reviews; it never auto-merges and never deploys. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote (the gate result and recommendation, the QE / security-nfr handoffs, the gate-pass-rate metric, the board move, and the updated traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/pr-quality-gate-<id>`), then `type(scope): summary`. The gate recommends only — never merge, never deploy; humans hold both.
