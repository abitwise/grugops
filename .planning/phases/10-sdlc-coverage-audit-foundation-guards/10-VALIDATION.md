---
phase: 10
slug: sdlc-coverage-audit-foundation-guards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> The fail-on-violation fixtures ARE the validation harness — each guard's fail-proof is its test. No test runner, no npm.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX-sh self-test harnesses (`pass()/fail()` + `exit 0\|1`) + bare `node` for the validator — NO test runner, no npm |
| **Config file** | none — scripts invoked directly (`sh scripts/<x>.test.sh`) |
| **Quick run command** | `sh scripts/check-foundation-guards.sh` (the aggregator, GREEN over a clean tree) |
| **Full suite command** | `sh scripts/check-foundation-guards.test.sh && sh scripts/validate.test.sh && sh scripts/check-kit-refs.sh` |
| **Estimated runtime** | ~2 seconds (all sh + one node invocation) |

---

## Sampling Rate

- **After every task commit:** Run `sh scripts/check-foundation-guards.sh` (four guards over the real tree, <1 s)
- **After every plan wave:** Run `sh scripts/check-foundation-guards.test.sh && sh scripts/validate.test.sh`
- **Before `/gsd-verify-work`:** Full suite must be green (all three scripts)
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| SDLC-02 | WR-05 guard fails red on a planted `tools: Agent` grant | unit (fail-proof) | `sh scripts/check-foundation-guards.test.sh` (asserts nonzero + spawn-grant message) | ❌ W0 | ⬜ pending |
| SDLC-02 | Adapter-size guard fails red when an adapter exceeds the ceiling | unit (fail-proof) | same harness (plant a >4 KiB adapter copy) | ❌ W0 | ⬜ pending |
| SDLC-02 | AGENTS.md byte guard fails red when AGENTS.md exceeds FAIL | unit (fail-proof) | same harness (plant a >28 KiB AGENTS.md copy) | ❌ W0 | ⬜ pending |
| SDLC-02 | Voice-lint fails red on a planted `\bgrug\b` in a clear-voice surface | unit (fail-proof) | same harness (plant `grug smash` into a stripped-body copy) | ❌ W0 | ⬜ pending |
| SDLC-02 | All four guards GREEN over the real tree | smoke | `sh scripts/check-foundation-guards.sh` (exit 0) | ❌ W0 | ⬜ pending |
| SDLC-03 | Validator errors on invalid enum (`asvs_level: "L4"`) | unit | `node scripts/validate-agent-factory.mjs` over mutated fixture → nonzero + `asvs_level` | ⚠️ extend `validate.test.sh` | ⬜ pending |
| SDLC-03 (SC4) | A config MISSING the 8 keys still passes (lean default) | unit | validator over `fixtures/good` (no new keys) → exit 0 | ✅ reuses good fixture | ⬜ pending |
| SDLC-03 (SC4) | Zero-config (no `factory.config.json`) still passes | unit | existing validator path — assert the new keys add NO new failure | ✅ existing path | ⬜ pending |
| SDLC-03 | The two JSON config files stay byte-identical after the edit | unit | `cmp -s agent-factory/config/factory.config.json agent-factory/seed/.grugops/factory.config.json` | ❌ W0 (add to harness) | ⬜ pending |
| SDLC-01 | Audit artifact exists + covers all 16 roles + 14 workflows | structural | `test -f .planning/v1.2-SDLC-COVERAGE-AUDIT.md` + matrix row count | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-foundation-guards.sh` — the four-guard aggregator (SDLC-02). The validation target itself.
- [ ] `scripts/check-foundation-guards.test.sh` — the fail-proof harness (one planted violation per guard; hermetic via `mktemp -d` + `trap cleanup`).
- [ ] Extend `scripts/validate.test.sh` — add (a) an invalid-enum hermetic fixture asserting nonzero + the bad key name; (b) a good-fixture assertion that absent keys pass (SC4); (c) a `cmp -s` byte-identity assertion for the two JSONs.
- [ ] Framework install: **NONE** — no test runner needed; the harness is plain POSIX sh.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The SDLC-coverage audit's gap *narratives* are accurate | SDLC-01 | Qualitative judgment — whether each recorded lifecycle gap is real and correctly mapped to its v1.2 phase (11–17) is a reading task, not a grep | Human reviews `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`: each "gap" cell has a narrative; each narrative names the phase that closes it; the business→engineer handoff gap is called out |
| The enterprise-escalation contract prose is correct per key | SDLC-03 | The lean-default↔enterprise-escalation wording in `factory.config.md` is documentation quality, not machine-checkable | Human confirms each of the 8 keys has a lean default AND an enterprise escalation row in the twin |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (the two new scripts + the validator-test extension)
- [ ] No watch-mode flags (all commands single-shot, CI-ready)
- [ ] Feedback latency < ~2s
- [ ] `nyquist_compliant: true` set in frontmatter after planner wires every task to a sampler

**Approval:** pending
