---
phase: 27
slug: spawn-correctness-kit-set-authority
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-28
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `27-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1.8` (already a devDependency — no framework install needed) |
| **Config file** | none — Vitest defaults; `test` script in `package.json` |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Full suite command** | `npm test` (⚠ includes the live Claude-CLI e2e lane — token cost, ~8 min; do NOT use as the per-task lane) |
| **Guard lane** | `npm run build && node scripts/check-foundation-guards.js` |
| **Freshness lane** | `npm run freshness && npm run freshness:catalog` (+ a new `freshness:adapters`) |
| **Estimated runtime** | ~30–60 seconds (quick lane); ~8 min (full suite, live e2e) |

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` plus `npm run build && node scripts/check-foundation-guards.js`
- **After every plan wave:** the above plus `node scripts/check-kit-refs.js`, `node scripts/check-uat-oracles.js`, `npm run freshness`, `npm run freshness:catalog`, `node scripts/adapters-freshness.js`
- **Before `/gsd-verify-work`:** full suite green **and** the SPAWN-03 human-verify checkpoint cleared
- **Max feedback latency:** 60 seconds (quick lane)

---

## Per-Task Verification Map

> Task IDs are filled in by `/gsd-validate-phase` once PLAN.md task numbering is final. The
> requirement→behavior→command rows below are lifted verbatim from RESEARCH.md § Validation Architecture
> and are the authoritative coverage contract.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | KIT-01 | — | `listRoles`/`listWorkflows` derive 17/19; drop `_`-prefixed; match `NN-*.md`; **throw** on empty dir (D-21 tier 1) | unit | `npx vitest run scripts/kit-model.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | KIT-01 | — | Exact-count guard fails red at 16 **and** at 18 roles (D-20, both directions) | unit (hermetic `CHECK_ROOT` mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "kit count"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | KIT-02 | — | Each of the 9 re-pointed consumers sources its set from `kit-model` (D-19 per-consumer assertion) | unit | `npx vitest run scripts/check-foundation-guards.test.ts scripts/validate.test.ts scripts/check-kit-refs.test.ts` | ⚠ files exist, cases ❌ | ⬜ pending |
| TBD | TBD | TBD | KIT-02 | — | `MARKER_SITES` covers every derived adapter (missed literal #11) | unit | `npx vitest run scripts/check-kit-refs.test.ts -t "marker sites"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | KIT-03 | — | Oracle **fails RED** against a planted today's-tree fixture (1 adapter / 7 dangling names / 17 roles) | unit (fixture-pinned, permanent) | `npx vitest run scripts/check-foundation-guards.test.ts -t "referential integrity RED"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | KIT-03 | — | Oracle passes on the real tree once 17 adapters exist | integration | `node scripts/check-foundation-guards.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | SPAWN-01 | — | 17 adapters exist; each is a thin pointer (no role body); each carries the resolver + MARKER | unit + guard | `npx vitest run scripts/generate-role-adapters.test.ts` + `guard_adapter_size` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SPAWN-02 | — | Byte drift between a committed adapter and a fresh regeneration fails closed; a broken generator never reads "fresh"; orphan/missing adapter caught by set equality | integration | `node scripts/adapters-freshness.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SPAWN-03 | — | Coordinator adapter resolves under `claude --agent`; `@grugops-orchestrator` header appears | **manual** | *(no automated equivalent — the runtime is the SUT)* | `checkpoint:human-verify` | ⬜ pending |
| TBD | TBD | TBD | SPAWN-04 | — | No non-coordinator adapter carries `Agent`/`Task` in `tools:` (fence-aware, both comma and YAML-array forms) | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t "wr05"` | ⚠ file exists, cases ❌ | ⬜ pending |
| TBD | TBD | TBD | SPAWN-05 | — | `guard_adapter_body` fails red on planted dead handoff vocabulary **and** on an adapter missing the shared-context wording (D-23 both directions) | unit (mirror-plant) | `npx vitest run scripts/check-foundation-guards.test.ts -t "adapter_body"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SPAWN-05 | — | Ships green: zero dead vocabulary across 17 agents + 7 skills + the template | integration | `node scripts/check-foundation-guards.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | SPAWN-06 | — | `orchestrator.md` < 7165B **after every Phase-27 edit**; ceiling values unchanged | integration | `node scripts/check-foundation-guards.js` (`guard_role_size` PASS, not WARN) | ✅ | ⬜ pending |
| TBD | TBD | TBD | SPAWN-07 | — | All 5 depth surfaces corrected; `oracleWr05Wording` asymmetry still green | integration | `node scripts/check-uat-oracles.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | — | — | `install --update` on a pre-existing single-adapter install lays down all 17 idempotently | integration | `npx vitest run install/` | ⚠ suite exists, case ❌ | ⬜ pending |
| TBD | TBD | TBD | — | — | `uninstall` removes only grugops adapters; a user-authored `.claude/agents/my-own.md` survives | integration | `npx vitest run install/` | ❌ W0 (Pitfall 5) | ⬜ pending |
| TBD | TBD | TBD | — | — | `docs/catalog/README.md` unchanged by the `capabilities:` frontmatter addition | integration | `npm run freshness:catalog` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/kit-model.test.ts` — KIT-01 derivation, vacuity throw, exact count both directions
- [ ] `scripts/generate-role-adapters.test.ts` — SPAWN-01 determinism + thin-pointer assertion
- [ ] New cases in `scripts/check-foundation-guards.test.ts` — KIT-03 RED fixture, `guard_adapter_body` both directions, SPAWN-04, per-consumer derivation
- [ ] New cases in `scripts/check-kit-refs.test.ts` — `MARKER_SITES` coverage, `GH_SCAN` derived predicate
- [ ] New cases in the installer suite (`install/`) — 17-adapter `--update`, uninstall user-content preservation
- [x] Framework install — **not needed**; Vitest is already a devDependency

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Coordinator adapter resolves under `claude --agent grugops-orchestrator`; the `@grugops-orchestrator` header appears in the session | SPAWN-03 | The Claude Code runtime is the system under test — no in-repo automated equivalent can observe real agent resolution | Run `claude --agent grugops-orchestrator` in a scratch repo with grugops installed; confirm the session header names the agent and that a role spawn resolves. Record as `checkpoint:human-verify` in the plan. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
