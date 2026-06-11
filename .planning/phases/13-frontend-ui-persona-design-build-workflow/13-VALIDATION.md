---
phase: 13
slug: frontend-ui-persona-design-build-workflow
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
validated: 2026-06-12
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> grugops ships **no app test runner** — validation is the POSIX-sh foundation-guard
> scripts plus grep-able structural checks over the markdown kit. Every success
> criterion maps to a mechanical (guard) or structural (grep) assertion.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX-sh guard scripts (no npm/pytest runner — grugops ships none) |
| **Config file** | none — guards are self-contained scripts |
| **Quick run command** | `sh scripts/check-foundation-guards.sh` |
| **Full suite command** | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `sh scripts/check-foundation-guards.sh` (all 6 guards over the tree)
- **After every plan wave:** Run `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` (adds the fail-proof harness + config byte-identity)
- **Before `/gsd-verify-work`:** Both scripts GREEN **and** the UI-01/02/03 structural greps pass
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Req | Wave | Behavior | Test Type | Automated Command / Structural Check | Status |
|-----|------|----------|-----------|--------------------------------------|--------|
| UI-01 | 1 | 17th role exists on 9-section skeleton | structural | `test -f agent-factory/roles/frontend-ui.md`; `grep -q 'kind: role' agent-factory/roles/frontend-ui.md` | ✅ green |
| UI-01 | 1 | No spawn tool (WR-05 stays GREEN) | guard | `guard_wr05` PASS; `grep -iE '(tools\|allowed-tools):.*\b(Agent\|Task)\b' agent-factory/roles/frontend-ui.md` empty | ✅ green |
| UI-01 | 1 | Caveman block present + markered | guard | `guard_caveman_preserved` PASS for frontend-ui.md | ✅ green |
| UI-01 | 1 | Role stays terse (under size ceiling) | guard | `guard_role_size` PASS — requires paired `ROLE_FILES` + `role_ceiling()` case entry | ✅ green |
| UI-02 | 1 | Workflow 14 walks contract→build→5 states→a11y→visual baseline | structural | `test -f agent-factory/workflows/14-ui-design-to-build.md`; `grep -q 'order: 14'`; states (loading/empty/error/success/partial) present; `grep -q 'WCAG 2.2 AA'` | ✅ green |
| UI-02 | 1 | References 04 + 05, does not restate the gate | structural | `grep -q '04-ticket-to-pr.md'` AND `grep -q '05-pr-quality-gate.md'`; gate step-labels NOT inlined | ✅ green |
| UI-03 | 2 | Orchestrator routes UI work (classification + matrix + map) | structural | `grep -q 'ui-build' …/orchestrator.md`; `grep -qi 'Frontend/UI' …/orchestrator.md`; workflow-map row `ui-build → 14-ui-design-to-build.md`; request-count literal 15→16 | ✅ green |
| UI-03 | 2 | 00–13 workflow ordinals not renumbered | structural | `ls agent-factory/workflows/` shows 00–13 unchanged + new 14 | ✅ green |
| (reg) | 1 | 17th role registered in guard + test harness | guard | both guard scripts GREEN; `grep -q 'frontend-ui.md' scripts/check-foundation-guards.sh` (ROLE_FILES + role_ceiling case) and `scripts/check-foundation-guards.test.sh` (GUARD_INPUTS) | ✅ green |
| (size) | 2 | orchestrator.md ceiling raised to fit UI-03 edits | guard | `guard_role_size` PASS for orchestrator.md after the routing edits (raised to `7570 7165` off the post-wiring 6759B) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing guard infrastructure covers all phase requirements.* No new test scaffolding:
UI-01 is covered mechanically once `frontend-ui.md` joins `ROLE_FILES` (with its paired
`role_ceiling()` case); UI-02/UI-03 are covered by grep-able structural checks. The only
authoring obligations that affect validation are the paired `ROLE_FILES` + `role_ceiling()`
edits (Pitfall 1) and the orchestrator ceiling raise (Pitfall 2) — both are guard-script
edits the per-commit run catches if missed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Senior judgment lands per skeleton section without prose bloat | UI-01 | Quality of persona depth is not mechanically gradeable beyond size/voice guards | Read frontend-ui.md against qe-e2e.md — confirm design-system thinking, five-states-as-habit, a11y-first, perf-budget awareness are present yet terse |
| Workflow 14 is genuinely "reference, not restate" | UI-02 | grep proves the references exist; a human confirms the gate loop is not paraphrased | Read 14-ui-design-to-build.md — confirm it points to 04/05 by filename and does not re-list gate steps |

---

## Validation Sign-Off

- [x] All UI-01/02/03 behaviors have a guard or structural-grep verification
- [x] Sampling continuity: per-commit guard run after each task
- [x] Wave 0 gaps: none (existing guards cover the phase)
- [x] No watch-mode flags (guards are one-shot scripts)
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter once plans embed these checks

**Approval:** validated 2026-06-12 — automated audit GREEN (24/24 structural greps + both guard suites exit 0). Two Manual-Only quality reads remain optional human judgments (do not block compliance).

---

## Validation Audit 2026-06-12

Audited the executed phase against the Per-Task Verification Map. grugops ships no app test
runner — every requirement is verified mechanically (guard PASS) or structurally (grep). All
nine map rows were re-run and confirmed green; both `check-foundation-guards.sh` and
`check-foundation-guards.test.sh` exit 0. No MISSING or PARTIAL coverage → no auditor spawn,
no new test files. The only change is un-staling this contract (statuses `⬜ pending → ✅ green`,
`nyquist_compliant false → true`). The two Manual-Only items are manual *by design* (persona
depth, reference-not-restate quality), not escalated gaps.

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Map rows green | 9 / 9 |
| Manual-only (by design) | 2 |
