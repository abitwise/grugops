---
phase: 23
slug: parallel-execution-orchestrator-as-decomposer-one-substrate
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-21
validated: 2026-07-21
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
| 23-01-T1 | 23-01 | 1 | CLAIM-03 (D-06/D-07) | T-23-03 | queue object byte-consistent on 3 surfaces; width-vs-flow documented | unit | `npx vitest run scripts/config-queue-consistency.test.ts` | ✅ | ✅ green |
| 23-01-T2 | 23-01 | 1 | CLAIM-03 (D-14, Pitfall 5) | T-23-01, T-23-02 | first-at-trusted render (forged 2nd `at:` skipped); queue freshness gate fails closed on drift | unit + gate | `npx vitest run scripts/now-running-freshness.test.ts scripts/claim.test.ts` · `node scripts/now-running-freshness.js` | ✅ | ✅ green |
| 23-02-T1 | 23-02 | 2 | PAR-01, PAR-02 (D-11/D-12/D-13, D-05) | T-23-04, T-23-05 | orchestrator spine + hard limit under guard_role_size; WF17 single-source, chains WF16 | guard | `npx vitest run scripts/check-foundation-guards.test.ts` · `node scripts/check-foundation-guards.js` | ✅ | ✅ green |
| 23-02-T2 | 23-02 | 2 | PAR-01/SC1, PAR-02/SC2, PAR-03/SC3, CLAIM-03 (D-04, Pitfall 4) | T-23-04, T-23-05, T-23-06 | thin pending refs; WIDTH ≤ wip_limit non-vacuous; claim exclusivity (EEXIST); dual-path substrate equality via currentState() | spine fixture | `npx vitest run scripts/decompose-spine.test.ts scripts/convergence-spine.test.ts` | ✅ | ✅ green |
| 23-03-T1 | 23-03 | 3 | PAR-04/SC4 (D-15/D-16) | T-23-08, T-23-09, T-23-10 | both-direction marker-keyed guard_wr05; THREE half-flip RED fixtures vs committed `.js` | guard + RED fixtures | `npx vitest run scripts/check-foundation-guards.test.ts && node scripts/check-foundation-guards.js` | ✅ | ✅ green |
| 23-03-T2 | 23-03 | 3 | PAR-04, PAR-02 (D-17/D-18/D-19) | T-23-08, T-23-11 | coordinator marker+grant on adapter (≤4096 B); asymmetric 5-tool flip (CC row only) | guard | `node scripts/check-foundation-guards.js` | ✅ | ✅ green |
| 23-03-T3 | 23-03 | 3 | PAR-04 (D-18, Pitfall 3) | T-23-11, T-23-13 | B3 oracle asymmetry beat (non-CC row drift → RED); catalog regenerated + fresh | oracle + RED fixture | `npx vitest run scripts/check-uat-oracles.test.ts && node scripts/catalog-freshness.js && npm run freshness` | ✅ | ✅ green |
| 23-03-GAP | 23-03-GAP | 3 | PAR-04 (CR-01/WR-01/WR-03/WR-04) | T-23-08..T-23-11 | fence-immunity + exactly-one-coordinator cardinality; concept-level asymmetry catch; import-safe queue gate | guard/oracle + proof | `npx vitest run scripts/check-foundation-guards.test.ts scripts/check-uat-oracles.test.ts` · `23-03-GAP-proof.txt` (5/5 vs committed `.js`) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> From `23-RESEARCH.md` § Validation Architecture → "Wave 0 Gaps". Confirm exact filenames against the plans.

- [x] `scripts/convergence-spine.test.ts` — SC3 dual-path convergence spine fixture (seeded 2–3-subtask decomposition, order-independent substrate equality via `currentState()`). Covers PAR-03/SC3, D-04. (Plan 23-02 T2)
- [x] `scripts/decompose-spine.test.ts` — SC1/SC2 decomposition + width-cap (`wip_limit`) assertions, non-vacuous (`widthHighWater === WIP_LIMIT` + freed-slot reuse). Covers PAR-01/PAR-02. (Plan 23-02 T2)
- [x] `scripts/now-running-freshness.ts` (+ committed `.js` + `.test.ts`) — queue-rooted render freshness gate (clone of `context-freshness.ts`, re-rooted at `.grugops/queue/`), import-safe after WR-04. Covers D-14. (Plan 23-01 T2)
- [x] Extended `scripts/check-foundation-guards.test.ts` with the THREE both-direction RED fixtures (planted non-coordinator grant; dropped coordinator grant; lost `coordinator:` marker) + fence-immunity + cardinality cases. Covers PAR-04/SC4, D-16. (Plans 23-03 T1, 23-03-GAP)
- [x] Extended the B3 wording oracle test (`check-uat-oracles.test.ts`) with the four-CLI asymmetry assertion (+ concept-level WR-01 broadening). Covers PAR-04 wording, D-19. (Plans 23-03 T3, 23-03-GAP)
- [x] `scripts/config-queue-consistency.test.ts` — `queue`-object cross-surface consistency check among the three config files. Covers D-06. (Plan 23-01 T1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-role dual-path equivalence (admitted findings + gate verdict) under live LLM concurrency | A3 / DOG-02 | Requires real-role LLM runs + token-cost measurement | **Deferred to Phase 26** — NOT asserted green here. SC3 spine fixture proves on-disk equality deterministically; it does NOT prove real-role behavioral equivalence. |
| `isolation: worktree` ↔ shared `.grugops/` path interaction | — | Requires live worktree dogfood | **`UNKNOWN - verify`** — deferred to Phase 26 dogfood. Do NOT assert green in Phase 23. |

*All in-scope Phase-23 behaviors have automated verification (spine fixtures + guard RED fixtures + freshness/oracle gates).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Adversarial reproduction completed for the WR-05 flip (both-direction RED proof against committed `.js` + asymmetry-drift repro + independent probe) — `23-03-RED-baseline.txt` / `23-03-GREEN-proof.txt` / `23-03-GAP-proof.txt` + the independent verifier reproduction in `23-VERIFICATION.md` § Behavioral Spot-Checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-21 (retroactive Nyquist audit — see below)

---

## Validation Audit 2026-07-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 8 task rows verified green by live runs on this box: the six phase suites
(`npx vitest run scripts/config-queue-consistency.test.ts scripts/now-running-freshness.test.ts scripts/decompose-spine.test.ts scripts/convergence-spine.test.ts scripts/check-foundation-guards.test.ts scripts/check-uat-oracles.test.ts`)
56/56 passed, and all five standalone gates exit 0 (`check-foundation-guards.js`,
`check-uat-oracles.js`, `now-running-freshness.js`, `catalog-freshness.js`, `npm run freshness`).
Every requirement (CLAIM-03, PAR-01..PAR-04) has automated coverage; the WR-05 flip carries the
full adversarial evidence chain (RED-baseline → GREEN-proof → GAP-proof → independent verifier
reproduction against the committed `.js`), honoring the green-suite-insufficient rule. The two
Manual-Only rows (A3/DOG-02 real-role dual-path equivalence; `isolation: worktree` interaction)
remain correctly deferred to Phase 26 — they require a live authed run and are NOT asserted green here.
