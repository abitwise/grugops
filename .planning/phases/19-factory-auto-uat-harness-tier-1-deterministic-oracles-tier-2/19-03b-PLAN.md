---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: 03b
type: execute
wave: 3
depends_on: ["19-01", "19-02"]
files_modified:
  - .planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md
  - .planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md
  - examples/03-ticket-to-pr.md
autonomous: false
requirements: [UAT-AUTO-04]
must_haves:
  truths:
    - "The A1/A2/A3 UAT cells in 05-HUMAN-UAT.md and 06-HUMAN-UAT.md flip to passed ONLY from the captured `npm run test:e2e` real-run output against an authed claude CLI"
    - "The 9 CC-native parity cells in examples/03-ticket-to-pr.md are filled ONLY from the A3-live real-run output"
    - "If the `claude` CLI is absent/unauthed (test:e2e loud-skips), the A1/A2/A3 cells stay pending — the run produces a loud-skip artifact and the checkpoint does not flip them"
    - "GRUGOPS_PROD_DEPLOY_APPROVED is NEVER set and NO real deploy occurs during the run (V14)"
  artifacts:
    - path: ".planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md"
      provides: "A1/A2 cells resolved from real-run output (or left pending on loud-skip)"
    - path: ".planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md"
      provides: "A1/A2/A3 cells resolved from real-run output (or left pending on loud-skip)"
    - path: "examples/03-ticket-to-pr.md"
      provides: "The 9 CC-native parity cells filled from the A3-live real run"
  key_links:
    - from: "npm run test:e2e (authed real run)"
      to: "the two *-HUMAN-UAT.md files + examples/03 parity table"
      via: "captured real-run output is the ONLY evidence permitted to flip a cell"
      pattern: "result: \\[passed\\]|result: \\[pending\\]"
---

<objective>
Resolve the long-deferred LIVE-RUNTIME UATs (A1/A2/A3) from REAL-RUN output only — never hand-set (Constraint #6). Run the Tier-2 headless harness (`npm run test:e2e`) against the developer's authed `claude` CLI, capture the output, and flip ONLY the cells the captured evidence justifies:
- A1/A2 → `05-HUMAN-UAT.md`; A1/A2/A3 → `06-HUMAN-UAT.md`; the 9 CC-native parity cells in `examples/03-ticket-to-pr.md` (from the Tier-2 real-run output, ONLY if the CLI is present+authed).

If the Tier-2 lane LOUD-SKIPS (CLI absent/unauthed), the A1/A2/A3 cells STAY pending — the loud-skip artifact is recorded and the cells are NOT flipped.

This plan is `autonomous: false`: the Tier-2 real-run requires an authed `claude` CLI that an autonomous executor cannot guarantee. The checkpoint presents the captured output to the human, who confirms the flips reflect a real run before any cell changes. This is the live half split out of the former Plan 19-03 (BLOCKER 3) so the deterministic B3 resolution (now 19-03a, `autonomous: true`) is NOT gated behind this human checkpoint. `depends_on` BOTH the Tier-1 oracle (`19-01`) and the Tier-2 harness (`19-02`).

Purpose: close the deferred A1/A2/A3 live-runtime UATs honestly, completing the phase's "run for real" success criterion.
Output: flipped cells in `05-HUMAN-UAT.md` / `06-HUMAN-UAT.md` + the 9 parity cells in `examples/03-ticket-to-pr.md`, each traceable to captured real-run output (or explicitly left pending with the loud-skip recorded).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-CONTEXT.md
@.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-RESEARCH.md
@.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-01-PLAN.md
@.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-02-PLAN.md
@.planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md
@.planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md
@examples/03-ticket-to-pr.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Run the Tier-2 harness for real and resolve A1/A2/A3 cells (human-gated)</name>
  <files>.planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md, .planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md, examples/03-ticket-to-pr.md</files>
  <read_first>
    - scripts/e2e/uat-live.test.ts (from Plan 19-02) — the gated harness + its loud-skip marker (`LOUD_SKIP_MARKER`)
    - .planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md — tests 1 (A1 D-31) + 2 (A2 SAFE-02); the `result: [pending]` cells + Summary block
    - .planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md — tests 1 (A1) + 2 (A2) + 3 (A3 dual-path; fills the 9 parity cells); the `result: [pending]` cells + Summary block
    - examples/03-ticket-to-pr.md:169-177 — the 9 `pending human` CC-native parity cells to fill from the A3-live run
    - 19-CONTEXT.md <decisions> Honesty — a status flips ONLY from a real run's output; loud-skip = not a pass = stays pending
  </read_first>
  <what-built>
    Plan 19-02 built `scripts/e2e/uat-live.test.ts` — a `claude --print` headless harness gated on `claude auth status`, covering A1 (plugin-cache pointer resolution / D-31), A2-live (SAFE-02 deny without the approval var / V14), and A3-live (DOG-02 dual-path parity). It loud-skips (emitting the distinct `LOUD_SKIP_MARKER`) when the CLI is absent/unauthed. Plan 19-01 built the deterministic Tier-1 oracles (B3 already resolved in 19-03a). This checkpoint runs the Tier-2 lane for REAL against an authed CLI and resolves the A1/A2/A3 UAT cells from the captured output.
  </what-built>
  <how-to-verify>
    1. Confirm the CLI is present and authed: `command -v claude && claude auth status` (expect exit 0 / logged in). If NOT authed, STOP — the A1/A2/A3 cells stay pending; record the loud-skip and skip the flips below.
    2. Run `npm run test:e2e` and capture the full output (stdout + stderr). Confirm it did NOT loud-skip (no `LOUD_SKIP_MARKER` / `SKIPPED: claude CLI absent or unauthed` line) — the live A1/A2/A3 cases actually executed.
    3. From the captured output, confirm each behavior: A1 produced planning markers with NO path-error (D-31 resolved); A2-live emitted the clear-voice deny string `"Production deploy blocked: humans decide, agents execute."` for the matched probe WITHOUT `GRUGOPS_PROD_DEPLOY_APPROVED` set (SAFE-02 / V14); A3-live produced the SAME handoff filenames (`implementation-handoff.md`, `qe-handoff.md`) and the SAME verdict (`READY_FOR_HUMAN_REVIEW`) on both dispatch paths (DOG-02).
    4. Confirm the harness cleaned up: `claude plugin list` does NOT show grugops after the run.
    5. ONLY for the cases the captured output justifies: flip the matching `result: [pending]` → `result: [passed]` in `05-HUMAN-UAT.md` (A1/A2) and `06-HUMAN-UAT.md` (A1/A2/A3), each with a note citing the real-run command + the observed marker. Fill the 9 CC-native parity cells in `examples/03-ticket-to-pr.md` from the A3-live output (same filenames + verdict; only dispatch differs). Update the Summary blocks. NEVER set `GRUGOPS_PROD_DEPLOY_APPROVED` and NEVER run a real deploy.
    6. If any case did not produce its expected marker (inconclusive/fail), leave that cell pending and record the captured output as evidence — never a fabricated flip.
  </how-to-verify>
  <action>
    Run `command -v claude && claude auth status`; if authed, run `npm run test:e2e` and capture the full output. For ONLY the A1/A2/A3 cases whose captured marker is present, flip the matching `result: [pending]` → `result: [passed]` in `05-HUMAN-UAT.md` (A1/A2) + `06-HUMAN-UAT.md` (A1/A2/A3), fill the 9 CC-native parity cells in `examples/03-ticket-to-pr.md` from the A3-live output, and update the Summary blocks — each flip citing the captured evidence line. NEVER set `GRUGOPS_PROD_DEPLOY_APPROVED`; NEVER run a real deploy. If the lane loud-skips (CLI unauthed) or any case is inconclusive, leave the affected cells `[pending]` and record the loud-skip/failing output. This is the human-gated half of the task; see `<how-to-verify>` for the full step list.
  </action>
  <verify>
    <human-check>The human runs `npm run test:e2e` against an authed CLI and confirms the captured output per `<how-to-verify>` before any cell flips. Every flipped cell must cite a marker line from that captured output; a loud-skip leaves the affected cells pending. An autonomous executor cannot run this lane without an authed CLI.</human-check>
  </verify>
  <acceptance_criteria>
    - Every flipped cell is traceable to a line in the captured `npm run test:e2e` output (the SUMMARY pastes the relevant marker per cell).
    - A2-live: the deny string was observed AND `GRUGOPS_PROD_DEPLOY_APPROVED` was never set during the run (V14 preserved).
    - A3-live: the 9 `examples/03-ticket-to-pr.md` CC-native cells are filled with the SAME filenames + verdict as the sequential column; no cell left as a fabricated guess.
    - On a loud-skip (CLI absent/unauthed): A1/A2/A3 cells stay `[pending]`, the loud-skip marker is recorded in the SUMMARY, and the checkpoint resolution states "deferred — CLI unauthed at run time."
    - No real deploy occurred; `claude plugin list` is clean post-run.
  </acceptance_criteria>
  <done>Every A1/A2/A3 cell flip is traceable to captured real-run output (or the cell stays pending with the loud-skip recorded); `GRUGOPS_PROD_DEPLOY_APPROVED` never set; no real deploy; `claude plugin list` clean post-run.</done>
  <resume-signal>Type "approved" with the captured real-run output attached (or "deferred — unauthed" to leave A1/A2/A3 pending), then describe which cells were flipped.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| captured real-run output → UAT file cells | The ONLY evidence permitted to flip a cell; a hand-set status is the forbidden fabrication |
| Tier-2 run → the SAFE-02 deploy boundary | A2-live must assert the DENY without approving or deploying |
| run → developer's claude plugin config | Must be clean after the run (Plan 19-02's afterAll cleanup) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-19-01 | Repudiation / trace integrity | UAT cell flips | mitigate | A cell flips ONLY from captured real-run output; a loud-skip leaves cells pending; the human checkpoint confirms the evidence before any flip (Constraint #6). |
| T-19-02 | Elevation of Privilege | A2-live during the real run | mitigate | `GRUGOPS_PROD_DEPLOY_APPROVED` is NEVER set; the run asserts the DENY. Humans hold merge/deploy (V14) — the self-approve keystone. |
| T-19-03 | Tampering | A2-live probe deploying for real | mitigate | Harmless matched probe / no kube-context (Plan 19-02's harness); the assertion is the deny, not execution (Pitfall 4). |
| T-19-04 | Tampering | leftover plugin/marketplace config | mitigate | Plan 19-02's `afterAll` cleanup; checkpoint step 4 verifies `claude plugin list` is clean post-run (Pitfall 3). |
| T-19-SC | Tampering | npm installs | mitigate | This plan installs ZERO packages — it runs existing committed `.js` + the external `claude` CLI prerequisite. No package-legitimacy checkpoint needed. |
</threat_model>

<verification>
- A1/A2/A3 cells in `05-HUMAN-UAT.md` / `06-HUMAN-UAT.md` + the 9 parity cells in `examples/03-ticket-to-pr.md` flipped ONLY from captured `npm run test:e2e` real-run output, or left pending on a loud-skip with the marker recorded.
- No flip is hand-set; every flip cites its evidence line. No real deploy; `GRUGOPS_PROD_DEPLOY_APPROVED` never set; plugin config clean post-run.
- No `files_modified` overlap with 19-03a (which owns `11-HUMAN-UAT.md`); this plan owns `05-HUMAN-UAT.md` + `06-HUMAN-UAT.md` + `examples/03-ticket-to-pr.md` only.
</verification>

<success_criteria>
Run for real, the harness honestly resolves the A1/A2/A3 items in their UAT files (`05-HUMAN-UAT.md`, `06-HUMAN-UAT.md`) and the 9 parity cells in `examples/03-ticket-to-pr.md` — status set ONLY from real-run output, never faked (UAT-AUTO-04). When the `claude` CLI is absent/unauthed the A1/A2/A3 cells stay pending with the loud-skip recorded — never a fabricated pass.
</success_criteria>

<output>
Create `.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-03b-SUMMARY.md` when done.
</output>
