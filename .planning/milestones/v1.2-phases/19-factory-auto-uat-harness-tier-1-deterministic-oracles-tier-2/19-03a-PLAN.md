---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: 03a
type: execute
wave: 2
depends_on: ["19-01"]
files_modified:
  - .planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md
autonomous: true
requirements: [UAT-AUTO-04]
must_haves:
  truths:
    - "The B3 wording UAT (11-HUMAN-UAT.md scenario 3) is resolved from the captured `node scripts/check-uat-oracles.js` real-run output — never hand-set"
    - "This plan runs FULLY AUTONOMOUSLY: the B3 oracle is deterministic (no `claude` CLI, no auth) so no human confirmation is expected before the oracle runs"
    - "If the oracle does NOT pass, scenario 3 stays `[pending]` and the SUMMARY records the failing output (never a fabricated flip — Constraint #6)"
    - "B1/B2 (11-HUMAN-UAT.md scenarios 1 & 2, persona/prose judgment) remain human-only and are NOT touched"
  artifacts:
    - path: ".planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md"
      provides: "Scenario 3 (B3) resolved from the Tier-1 oracle real-run output; scenarios 1 & 2 untouched"
  key_links:
    - from: "node scripts/check-uat-oracles.js"
      to: "11-HUMAN-UAT.md scenario 3"
      via: "captured deterministic real-run output is the ONLY evidence permitted to flip the cell"
      pattern: "result: \\[passed\\]|result: \\[pending\\]"
---

<objective>
Resolve the deterministic B3 wording UAT from REAL-RUN output only — never hand-set (Constraint #6). Run the Tier-1 oracle (`node scripts/check-uat-oracles.js`), capture the output, and flip `11-HUMAN-UAT.md` scenario 3 ONLY if the wording oracle passed.

This plan is `autonomous: true` and runs FULLY AUTONOMOUSLY (W3): the B3 wording oracle is deterministic — it reads four `.planning/` tracking docs and asserts the three WR-05 beats with no `claude` CLI dependency and no auth. There is therefore no live-runtime gate and no human confirmation is expected before the oracle runs. This is the deterministic half split out of the former Plan 19-03 (BLOCKER 3) so it is NOT gated behind the human E2E checkpoint that 19-03b carries — B3 depends only on the Tier-1 oracle (`19-01`), not on the Tier-2 harness (`19-02`).

Purpose: close the deterministic B3 UAT honestly the moment the Tier-1 oracle exists, without waiting on an authed `claude` CLI.
Output: `11-HUMAN-UAT.md` scenario 3 flipped from captured oracle output (or explicitly left pending with the failing output recorded).
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
@.planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Resolve B3 (11-HUMAN-UAT scenario 3) from the Tier-1 oracle real run</name>
  <files>.planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md</files>
  <read_first>
    - .planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md — the three scenarios + Summary block; the B3 WR-05 wording test is scenario/test 3, whose live heading reads `### 3. WR-05 closure wording reads as factual (not fabricated)` with `result: [pending]` immediately under it; it is the ONLY one this task touches; tests 1 & 2 (B1/B2 persona/prose) stay human (do NOT touch). The W1 verify anchors on `^### 3\.` + the 2 following lines, so the executor must flip the `result:` cell directly under that heading.
    - scripts/check-uat-oracles.ts (from Plan 19-01) — the B3 wording oracle whose deterministic output is the evidence (always runs; no CLI dependency)
    - 19-CONTEXT.md <specifics> — the exact UAT files and the "scenario 3 only" boundary
  </read_first>
  <action>
    Run `node scripts/check-uat-oracles.js` and capture the full stdout. The B3 wording oracle is deterministic and always runs (no CLI dependency, no auth) — this task is fully autonomous (W3). If the run exits 0 with `ALL CHECKS PASSED` and the wording-oracle PASS line for the four tracking docs is present, flip `11-HUMAN-UAT.md` scenario 3 `result: [pending]` → `result: [passed]` and add a one-line note citing the captured real-run evidence (the command + the PASS line). Update the Summary block counts (passed/pending) for scenario 3 ONLY. Do NOT touch scenarios 1 & 2 — B1/B2 persona/prose judgment stays human-only. If the oracle FAILS or the wording PASS line is absent, leave scenario 3 `[pending]` and record the failing output in the SUMMARY (never flip on a non-pass — Constraint #6).
  </action>
  <verify>
    <automated>node scripts/check-uat-oracles.js && grep -A2 '^### 3\.' .planning/phases/11-senior-persona-overhaul/11-HUMAN-UAT.md | grep -c 'result: \[passed\]'</automated>
  </verify>
  <acceptance_criteria>
    - The flip is justified by captured output: `node scripts/check-uat-oracles.js` exits 0 and the SUMMARY records the wording-oracle PASS line as the evidence.
    - W1 — the VALUE actually flipped (not merely that a `result:` field exists): after the oracle passes, the test-3 block (`^### 3\.` + the 2 following lines) of `11-HUMAN-UAT.md` greps for `result: [passed]` (escaped brackets) and an unchanged `[pending]` cell FAILS the verify. The `<verify>` command's final `grep -c 'result: \[passed\]'` over the test-3 block must be >= 1.
    - Scenarios 1 & 2 are byte-unchanged (`git diff` touches only the scenario-3 block + the Summary counts).
    - The Summary block's passed/pending counts are consistent with the single scenario-3 flip.
    - If the oracle did not pass, scenario 3 stays `[pending]`, the SUMMARY records the failing output (no fabricated flip), and the verify's `result: [passed]` grep correctly returns 0 (the task is then reported as "deferred — oracle did not pass", not a faked green).
  </acceptance_criteria>
  <done>Scenario 3 (B3) is resolved strictly from the captured Tier-1 oracle real-run output (the value flipped to `[passed]`, W1-verified) — or left `[pending]` with the failing output recorded; scenarios 1 & 2 untouched; the Summary counts updated; the whole task ran autonomously with no CLI/auth/human gate.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| captured deterministic oracle output → 11-HUMAN-UAT.md scenario 3 cell | The ONLY evidence permitted to flip the cell; a hand-set status is the forbidden fabrication |
| oracle script → repo `.planning/` docs | Read-only file input the oracle parses; fixed-literal paths only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-19-01 | Repudiation / trace integrity | scenario-3 cell flip | mitigate | The cell flips ONLY from the captured deterministic oracle output; a non-pass leaves it `[pending]`; the W1 verify greps for the flipped VALUE so an unchanged cell cannot read as resolved (Constraint #6). |
| T-19-02 | Tampering | scenarios 1 & 2 (out of scope) | mitigate | The task touches scenario 3 + the Summary counts ONLY; B1/B2 persona judgment stays human (`git diff` scoped). |
| T-19-SC | Tampering | npm installs | mitigate | This plan installs ZERO packages — it runs the existing committed `check-uat-oracles.js` (built by 19-01). No package-legitimacy checkpoint needed. |
</threat_model>

<verification>
- B3 (`11-HUMAN-UAT.md` scenario 3) resolved from the captured deterministic Tier-1 oracle output; scenarios 1 & 2 untouched (human-only).
- W1: the scenario-3 `result:` VALUE actually flipped to `[passed]` (grepped) — an unchanged `[pending]` cell fails the verify.
- No flip is hand-set; the flip cites its evidence line. The plan ran fully autonomously (no `claude` CLI, no auth, no human gate).
</verification>

<success_criteria>
Run for real (deterministically, autonomously), the Tier-1 wording oracle resolves the B3 item in `11-HUMAN-UAT.md` scenario 3 — status set ONLY from real-run output, never faked; the flipped VALUE is verified (W1); scenarios 1 & 2 (B1/B2) remain human-only (UAT-AUTO-04). If the oracle does not pass, scenario 3 stays `[pending]` with the failing output recorded.
</success_criteria>

<output>
Create `.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-03a-SUMMARY.md` when done.
</output>
