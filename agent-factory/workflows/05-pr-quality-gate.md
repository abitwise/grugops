---
kind: workflow
order: 5
cadence: both
---
# Workflow: PR quality gate

## When to use
When a change is implemented and needs to pass the gate before a human reviews it. grug no merge on a green guess — the gate runs, the result is recorded, a human decides. This workflow is the single source of the backpressure loop. When an implementation is ready, the change flows implementation -> QE/E2E -> Security/NFR -> Architect/Design (if structure changed) -> Orchestrator recommendation. Every other workflow that needs the gate references this file rather than restating the loop.

## Agents involved
- QE/E2E — breaks the feature, reports coverage and gaps.
- Security/NFR — reviews risk when triggered.
- Architect/Design — only if the change altered structure.
- Orchestrator — runs the deterministic prefetch and emits the recommendation. The Orchestrator recommends; it never auto-merges.

Each role reads the shared verified context before it works. Each role records its results as typed notes (finding / decision / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The implemented change on a branch and the Software Engineer's recorded implementation notes in the shared verified context (read per Workflow 16).
- The ticket and its acceptance criteria; relevant prior ADRs in `memory-bank/50-decisions/`.
- Gate commands pulled from the root `AGENTS.md` command slots at runtime.
- Quality knobs from `.grugops/factory.config.json#quality`.
- `agent-factory/checklists/pr-review-checklist.md`.

## Steps
The backpressure loop, in clear voice. Run it in this order:

1. Assemble the context the change needs before the model writes code (Orchestrator) — the deterministic prefetch. The context is the ticket and the shared verified context for the task, read per Workflow 16. It also covers the gate commands from `AGENTS.md`, the relevant files and any prior ADRs. The agent starts focused, not drowning.
2. Implement the change on a branch (`autonomy=branch` or `autonomy=pr`).
3. Run the gate in order: `install -> lint -> typecheck -> unit -> build -> e2e -> test-integrity`. The commands come from the root `AGENTS.md` command slots — they are never invented. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. Pass every gate named in `mandatory_gates` (`["lint","typecheck","unit","build"]`). `coverage_threshold` (`0.8`) is the coverage floor and `ui_e2e` (`"ui-or-critical-path"`) decides when e2e runs. The lint, UI/E2E and test-integrity steps are config-dialed under `quality` — wire each as follows:

   - Apply `quality.lint {strict, autofix}` to the lint step. Lint is already in the sequence and in `mandatory_gates`. `strict:true` → fail-on-warning (the linter's `--max-warnings 0`-style flag). `strict:false` → warnings are reported in clear voice and only errors fail. `autofix:true` → run the linter's **safe** autofix first, recheck, then report any residue. That autofix runs inside the bounded `self_fix_attempts` loop, because lint is agent-fixable. `autofix:false` → report only, fix nothing. With **no linter** configured in the `AGENTS.md` Lint slot, the lint step records `UNKNOWN - verify`. The step is then **non-blocking**. A repo with no applicable linter still reaches `READY_FOR_HUMAN_REVIEW` — an honest UNKNOWN is recorded, never a faked pass. Read `agent-factory/checklists/linter-recommendations.md` for the per-stack table (ESLint / Biome / Ruff / golangci-lint). That table also carries the strict and safe-autofix flags and the UNKNOWN fallbacks.

   - Run UI/E2E when `quality.ui_e2e` (`off | ui-or-critical-path | always`) says so. The step covers Playwright visual-regression and axe-core accessibility (WCAG 2.2 AA). The how-to is referenced, not restated: see `agent-factory/checklists/playwright-visual-regression-recipe.md` for the flake-resistant `toHaveScreenshot` recipe and `agent-factory/checklists/accessibility-checklist.md` for the axe-core automated bar. Fix-lane split: a UI/E2E **code or a11y** defect (broken locator, axe violation, functional failure) is agent-fixable inside the self-fix loop. **Updating a visual baseline is human-only**. Accepting a changed screenshot to make a red test pass is goalpost-moving, and the agent never does it.

   - Run test-integrity **after** unit and e2e, which produce the skip count. The gate invokes the materialized checker: `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>`. `<N>` is the skipped-test count captured from the `AGENTS.md` `### Test integrity` skip-count slot. If that count cannot be determined, the gate records `UNKNOWN - verify` — **never a silent 0**. Branch on the checker's exit code. `0` → the registry justifies every skip, pass. `1` → a test-integrity finding: an unjustified, expired or malformed skip, which the gate flags. `2` → the checker failed to run, for example a missing or unreadable registry path. Exit `2` is an error distinct from a clean fail, recorded as such and never read as a pass. This step is **always human-only**, and a human owns `.grugops/test-skips.md`. The agent never self-authors a justification to clear its own gate. On exit `1` the gate STOPS and hands to a human — see the human-only short-circuit in Step 4.

   - Run the Tier-1 Auto-UAT oracles alongside the other deterministic checks. The gate invokes `node scripts/check-uat-oracles.js`, a no-LLM fail-red oracle aggregator. It exits `0` (`ALL CHECKS PASSED`) or `1` (`N CHECK(S) FAILED`). Branch on the exit code exactly as for the other deterministic steps. `0` → pass; `1` → a finding the gate flags. It re-checks the deferred live-runtime UATs by deterministic means and never grades prose. Those means are wording-consistency, the `hooks.json → guard.js` deny wiring and dual-path artifact parity. The oracle is therefore safe in `mandatory_gates`-style enforcement under `quality.gate_enforcement`. The script ships with grugops's own tooling rather than every host. When the script is not present in a host repo, the step records `UNKNOWN - verify` and is non-blocking. The recorded UNKNOWN is honest, never a faked pass.

   - Run the gated Tier-2 Auto-UAT live E2E lane on demand — the headless `claude --print` lane, `npm run test:e2e`. The lane is **dev/CI-only**: it requires the external `claude` CLI and auth. It is never a host runtime dependency and **never a CI secret/API key**. It ALWAYS runs a `claude auth status` present-and-authed probe **first**. When the CLI is absent or unauthed, the lane emits a **LOUD, distinctly-marked SKIP**. The skip line reads `SKIPPED: claude CLI absent or unauthed …`. The lane then exits green via that loud skip — never a silent pass. **A skip is NOT a pass.** The underlying UAT stays `pending`. Its status flips to passed or resolved only from a real authed run's captured output. It never flips from a skip and it is never hand-set (Constraint #6 — no fabrication). The lane self-skips on unauth, so it carries **no new dial key**. Its own probe gates it, and it stays out of the default `npm test` green path. CI therefore stays green-without-a-key. A real authed run is performed on demand, locally or in a CI lane with the dev's authed CLI. Its output is what resolves the pending UAT cells.
4. Apply the bounded self-fix budget when the gate fails. The agent gets a small, fixed number of self-fix attempts — `self_fix_attempts` from config (default `2`, "two rounds then human"). After that, STOP and hand to a human. Do not loop forever. The same gate and the same "two rounds then human" rule apply in headless or CI use.

   The bounded loop runs **only for agent-fixable failures** — lint (autofix then recheck) and UI/E2E code/a11y defects. A **human-only** failure short-circuits straight to `BLOCKED_NEEDS_FIX` with the specific reason. It does **not** consume a self-fix attempt. The agent cannot fix it, so spending budget is wasteful and tempts a cheating "fix". Two failures are human-only: a UI/E2E **visual-baseline** acceptance, and a test-integrity **exit `1`**. On either, name the reason and stop — do not retry, do not edit the baseline, do not write into the skip registry.
5. Emit exactly one terminal result: `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX` or `SPLIT_REQUIRED`. All checks pass → `READY_FOR_HUMAN_REVIEW`. An agent-fixable failure that survives the self-fix budget → `BLOCKED_NEEDS_FIX` with the specific reason. Any human-only failure → `BLOCKED_NEEDS_FIX` with the specific reason. The two human-only failures are a visual-baseline acceptance and a test-integrity exit `1`. `SPLIT_REQUIRED` stays size-driven and unchanged.

   **Verdict emission (green result only)**. On `READY_FOR_HUMAN_REVIEW` — and **only** there, never on `BLOCKED_NEEDS_FIX` or `SPLIT_REQUIRED` — the gate emits a green verdict into the shared verified context. It emits by calling the `emitVerdict` carve-out in `scripts/context-io.ts`, which `node scripts/context-io.js` exposes. The gate calls that carve-out and does not hand-write the note. The carve-out is the root-of-trust self-attestation: `§14-gate` is the one reserved author identity the gate is permitted to stamp. It mirrors how the prod-deploy hook trusts the human-set approval env var as ITS root. That mirror is why a verified-finding model does not regress into "every finding needs its own stamp". Do **not** inline a raw write; the emission is delegated to `context-io.ts` by name.

   The verdict dogfoods the note schema: it is an ordinary context note, not a separate ledger format. Each gate run mints a **unique per-run id from `node:crypto`** (`randomUUID`). That id is explicitly **NOT** the ticket id. Two runs of the same ticket therefore produce two distinct verdicts, and a stale verdict can never admit a later finding. `emitVerdict` composes the note as a `kind: finding` authored `by: §14-gate`, carrying `refs: [§14-gate#<id>]` and a body containing the green marker `READY_FOR_HUMAN_REVIEW`. A downstream `finding` references that per-run `<id>` as `verified_by: §14-gate#<id>`. The admission cross-check — the `admit` path in `context-io.ts` — confirms the finding against that live green verdict before writing it. A finding whose stamp matches no live green verdict is refused.

   **No faked pass (escape hatch)**. Because the verdict is emitted only from a real green result, a non-green result emits **no** green verdict. A finding whose admission is refused therefore degrades honestly to a `claim` carrying `confidence: UNKNOWN - verify` — never a hand-set or faked green. The honest path to a real stamp is the bounded loop already defined in **Step 4** (`self_fix_attempts`, default `2`, "two rounds then human"). The verify→regenerate cycle is: record the finding, meet the refused admission, then spend the bounded Step-4 attempts running and fixing the gate. Those attempts obtain the real `§14-gate#<id>` stamp, and then the gate stops and hands to a human. No new dial, no second loop: it is the same Step-4 budget, applied to obtaining the stamp. The escape hatch is the same "advise loudly, never hide" floor stated below.

   **Advisory composition**. When `quality.gate_enforcement` is `advisory`, the pipeline ACTION is uniformly downgraded to advice, including a test-integrity finding. The finding is **still emitted loudly in clear professional voice**: the trace stays intact, never silent. `quality.test_integrity` has no `off` value in any mode — the TINT-03 trace-integrity floor. That floor forbids silently accepting a hollowed-out suite, not a hard pipeline stop. Advisory mode advises loudly; it does not hide.
6. Hand the change to the human gate. A human reviews the PR against `agent-factory/checklists/pr-review-checklist.md`. A human merges. A human (or a human-confirmed pipeline) deploys. This step is human-only.

## Board moves
On `plans/board.md`, the gate runs while the ticket sits in `In Review`. When a triggered Security/NFR review is needed, the QE/E2E exit moves it on to `In Security/NFR`. The gate does not move work to `Done` — only a human-approved merge (and release, in enterprise mode) does.

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
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/pr-quality-gate-<id>`), then `type(scope): summary`. The artifacts are the gate result and recommendation, the gate-pass-rate metric, the board move and the updated traceability rows. They also include the QE and security-nfr context notes recorded per Workflow 16. On a `READY_FOR_HUMAN_REVIEW` result they include the green `§14-gate` verdict context note that `emitVerdict` in `scripts/context-io.ts` produced. The gate recommends only — never merge, never deploy; humans hold both.
