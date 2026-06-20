---
phase: 23
slug: parallel-execution-orchestrator-as-decomposer-one-substrate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Full SC→test map, adversarial-reproduction gate, and Wave-0 gaps live in `23-RESEARCH.md` § Validation Architecture — this file is the execution-time contract Wave 0 completes.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (project standard; co-located `*.test.ts`) |
| **Config file** | project `package.json` / vitest config (existing) |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (regression) · `npm test` ONLY when the live claude-CLI e2e lane is intended (authed box, ~8 min) |
| **Freshness gate** | `npm run freshness` (committed `.js` must byte-match a fresh `tsc` rebuild — D-13) |
| **Estimated runtime** | ~seconds (non-e2e lane) |

> **Project memory (load-bearing):** `npm test` triggers the live claude-CLI e2e lane (spends tokens, can hang ~8 min). Use the `--exclude '**/scripts/e2e/**'` form for routine Phase-23 verification. The SC3 convergence spine fixture is a hermetic deterministic test — it MUST NOT live in the e2e lane.

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` (the changed guard/render/oracle/spine tests) + `npm run freshness`
- **After every plan wave:** full non-e2e suite green + `node scripts/catalog-freshness.js` + the new queue-rooted freshness gate
- **Before `/gsd-verify-work` (phase gate):** full non-e2e suite green, freshness exit 0, ALL three `guard_wr05` RED fixtures proven RED→GREEN against the committed `.js`, the asymmetry oracle green
- **Max feedback latency:** ~seconds (non-e2e lane)

---

## Per-Task Verification Map

> Populated by the planner / Wave 0 from `23-RESEARCH.md` § Validation Architecture → "Phase Requirements → Test Map". Each row maps a task to its automated command and threat ref.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _pending plan_ | — | — | PAR-01..04 / CLAIM-03 | T-23-* | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> From `23-RESEARCH.md` § Validation Architecture → "Wave 0 Gaps". Confirm exact filenames against the plans.

- [ ] `scripts/<convergence>.test.ts` — SC3 dual-path convergence spine fixture (seeded 2–3-subtask decomposition, order-independent substrate equality). Covers PAR-03/SC3, D-04.
- [ ] `scripts/<spine>.test.ts` — SC1/SC2 decomposition + width-cap (`wip_limit`) assertions. Covers PAR-01/PAR-02.
- [ ] `scripts/now-running-freshness.ts` (+ committed `.js` + `.test.ts`) — queue-rooted render freshness gate (clone `context-freshness.ts`, re-root at `.grugops/queue/`). Covers D-14.
- [ ] Extend `scripts/check-foundation-guards.test.ts` with the THREE both-direction RED fixtures (planted non-coordinator grant; dropped coordinator grant; lost `coordinator:` marker). Covers PAR-04/SC4, D-16.
- [ ] Extend the B3 wording oracle test (`check-uat-oracles.test.ts`) with the four-CLI asymmetry assertion. Covers PAR-04 wording, D-19.
- [ ] Confirm (or add) a `queue`-object cross-surface consistency check among the three config files. Covers D-06.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-role dual-path equivalence (admitted findings + gate verdict) under live LLM concurrency | A3 / DOG-02 | Requires real-role LLM runs + token-cost measurement | **Deferred to Phase 26** — NOT asserted green here. SC3 spine fixture proves on-disk equality deterministically; it does NOT prove real-role behavioral equivalence. |
| `isolation: worktree` ↔ shared `.grugops/` path interaction | — | Requires live worktree dogfood | **`UNKNOWN - verify`** — deferred to Phase 26 dogfood. Do NOT assert green in Phase 23. |

*All in-scope Phase-23 behaviors have automated verification (spine fixtures + guard RED fixtures + freshness/oracle gates).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Adversarial reproduction completed for the WR-05 flip (both-direction RED proof against committed `.js` + asymmetry-drift repro + independent probe) — green suite alone is NOT sufficient
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
