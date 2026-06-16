---
phase: 19
slug: factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `19-RESEARCH.md` § Validation Architecture. Honesty rail (CLAUDE.md
> Constraint #6): oracles fail red; a UAT status flips to passed/resolved ONLY from a
> real run's captured output; Tier-2 absent/unauthed → LOUD SKIP, never a silent green.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing devDep — add nothing else; only `{typescript, vitest}` + `@types/node`) |
| **Config file** | `vitest.config.ts` (existing; `fileParallelism: false`) |
| **Quick run command** | `npx vitest run scripts/check-uat-oracles.test.ts` (Tier-1 only, deterministic, < 5s) |
| **Full suite command** | `npm test` (= `vitest run`) for Tier-1 + all existing; `npm run test:e2e` for the gated Tier-2 lane |
| **Estimated runtime** | Tier-1 ~< 5s; Tier-2 gated/loud-skip when CLI absent or unauthed |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/check-uat-oracles.test.ts` (+ `npm run build` if a `.ts` changed)
- **After every plan wave:** Run `npm test` + `npm run freshness` (+ `npm run freshness:catalog`)
- **Before `/gsd-verify-work`:** Full `npm test` + `npm run build`/`freshness` green; Tier-2 `npm run test:e2e` run LOCALLY against the authed CLI, its captured output used to flip the pending UAT cells (real-run evidence)
- **Max feedback latency:** ~5 seconds (Tier-1)

---

## Per-Task Verification Map

> Requirement-level map (task IDs assigned by the planner). Every Tier-1 oracle has a
> plant-and-run test proving BOTH a PASS path and a FAIL-red path (no oracle ships without
> a demonstrated red).

| Item | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| B3 wording-consistency oracle | 1 | UAT-AUTO-01 | — | 3-beat claim present in all 4 docs; fail-red on mismatch | unit/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "wording"` | ❌ W0 | ⬜ pending |
| A2 hooks.json→guard wiring oracle | 1 | UAT-AUTO-02 | T-V4 (no self-approve) | matcher → `guard.js` deny-JSON on a kubectl-apply PreToolUse payload; never sets approval var | integration/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "wiring"` | ❌ W0 | ⬜ pending |
| A3 dual-path artifact-structure parity oracle | 1 | UAT-AUTO-03 | — | same handoff filenames + same gate verdict string between sequential and sub-agent dispatch | unit/oracle | `npx vitest run scripts/check-uat-oracles.test.ts -t "parity"` | ❌ W0 | ⬜ pending |
| Tier-1 aggregator wired into foundation-guards | 1 | UAT-AUTO-03 | — | new lane runs inside `scripts/check-foundation-guards.ts` spine; fail-closed | unit/oracle | `npx vitest run scripts/check-foundation-guards.test.ts` | ❌ W0 | ⬜ pending |
| Tier-2 headless E2E harness (A1/A2-live/A3-live) | 2 | UAT-AUTO-04 | T-V4, T-V12 | gated on `claude auth status` (present+authed); LOUD SKIP otherwise; asserts markers/structure not exact prose; NEVER sets `GRUGOPS_PROD_DEPLOY_APPROVED` | e2e (gated) | `npm run test:e2e` (loud-skips if `claude auth status` ≠ 0) | ❌ W0 | ⬜ pending |
| §14 gate ref + runbook three-lane docs | 2 | UAT-AUTO-05 | — | single-source gate ref (no forked logic); runbook names authoritative vs advisory lanes in clear voice | structural/manual | `npm run build && npm run freshness && npm test` + doc review | ❌ W0 | ⬜ pending |
| Resolve A1/A2/A3 + B3 UAT files from real runs | 2 | UAT-AUTO-04 | — | 05/06/11-HUMAN-UAT status flipped ONLY from real-run output; B1/B2 stay human | manual/real-run | captured `npm run test:e2e` + Tier-1 output pasted as evidence | ❌ W0 | ⬜ pending |
| Zero new host runtime dependency | 2 | UAT-AUTO-05 | — | Tier-2 dev/CI-only; `install/README.md` §1 + committed-`.js` host model unaffected | structural | dependency review + `package.json` devDeps unchanged beyond `{typescript, vitest}` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-uat-oracles.ts` (+ committed `.js`) — the three Tier-1 oracles (UAT-AUTO-01/02/03)
- [ ] `scripts/check-uat-oracles.test.ts` — plant-and-run harness proving each oracle PASS and FAIL-red (clone the `check-foundation-guards.test.ts` `CHECK_ROOT` mirror idiom)
- [ ] `scripts/e2e/uat-live.test.ts` — the gated headless harness with the `claude auth status` loud-skip probe (UAT-AUTO-04)
- [ ] `package.json` `test:e2e` script (and `freshness` coverage confirmation for `scripts/e2e/` if a committed `.js` is produced)
- [ ] Framework install: **none** — Vitest already present.

*Wave 0 closes when the three Tier-1 oracle stubs + their plant-and-run tests exist (red) and the gated e2e harness file + `test:e2e` script exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tier-2 A1/A2-live/A3-live real run | UAT-AUTO-04 | Needs an authed `claude` CLI in the runner (dev/CI-only, not a host dep); LLM nondeterminism means a human confirms the captured run before flipping UAT status | Run `npm run test:e2e` locally against the authed CLI; paste captured output as real-run evidence; flip 05/06/11(scenario 3) UAT cells only from that output |
| Tier-3 B1/B2 persona/prose senior-depth | (out of scope) | Self-grading prose judgment — auto-grading manufactures a false green (Constraint #6); stays a human sign-off | `11-HUMAN-UAT.md` scenarios 1 & 2 remain a human read; NOT automated as a gate this phase |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`vitest run`, never `vitest --watch`)
- [ ] Feedback latency < 5s (Tier-1)
- [ ] Every Tier-1 oracle proves a FAIL-red path, not just a PASS
- [ ] Tier-2 loud-skip path is itself tested (absent/unauthed → distinct visible skip, never green)
- [ ] `nyquist_compliant: true` set in frontmatter once the above hold

**Approval:** pending
