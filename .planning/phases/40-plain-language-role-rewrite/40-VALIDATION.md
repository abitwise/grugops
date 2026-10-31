---
phase: "40"
slug: "plain-language-role-rewrite"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-31"
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 |
| **Config file** | `vitest.config.ts` (`testTimeout: 180_000`, `slowTestThreshold: 5_000`) |
| **Quick run command** | `npm run build && npx vitest run scripts/tier-kit-text.test.ts scripts/voice-model.test.ts scripts/validate.test.ts` |
| **Full suite command** | `timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | quick ~26 s; full ~1,363 s (Phase 39 measurement) |

Full suite carries **21 pre-existing failures** (context-io, context-io-writer-set, canonical-corpus, harness-instance-ledger, uat-gate-exit-contract ×5, installer-fs-census, and one environmental check-foundation-guards case caused by the untracked `~/`). A phase pass means no failure outside that recorded set.

---

## Sampling Rate

- **After every task commit:** quick run command, plus `node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-diff-disposition.js`, plus the per-batch mirror sentence check from 40-RESEARCH.md.
- **After every plan wave:** every gate command listed in 40-RESEARCH.md § Validation Architecture, plus `npx vitest run scripts/check-foundation-guards.test.ts scripts/check-diff-disposition.test.ts scripts/check-imperative-lexicon.test.ts scripts/adapter-byte-baseline.test.ts`.
- **Before `/gsd-verify-work`:** full non-e2e suite green apart from the 21 recorded failures.
- **Max feedback latency:** 60 seconds per task commit (quick run + guards).

---

## Per-Task Verification Map

Task IDs are `40-<plan>-<task>`; rows below map each requirement to its automated proof.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 40-01-03 | 01 | 1 | PLAIN-01 | T-40-06 | Planted caveman fence in a mirrored role → inverted guard exits 1 naming the file; real tree has 0 fences | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "caveman"` | ❌ W0 (40-01-03 writes it) | ⬜ pending |
| 40-01-03 | 01 | 1 | PLAIN-01 | T-40-07 | No live role returns a fence (voice-model control inverted); voice-model.ts untouched | unit | `npx vitest run scripts/voice-model.test.ts -t "every live role"` | ✅ | ⬜ pending |
| 40-01-03 | 01 | 1 | PLAIN-01 | — | `ROLE_SECTIONS` no longer requires the caveman heading | unit | `npx vitest run scripts/validate.test.ts` | ✅ | ⬜ pending |
| 40-08-03 | 08 | 4 | PLAIN-02 | T-40-22 | Every role has `## Stop when` and `## Activates when`; bad fixtures fail for exactly one reason | unit | `npx vitest run scripts/validate.test.ts` | ✅ | ⬜ pending |
| 40-02-01, 40-03-01..40-07-02 | 02-07 | 2-3 | PLAIN-02 | T-40-08 | Adapter and catalog bytes unchanged | unit + freshness | `npx vitest run scripts/adapter-byte-baseline.test.ts && node scripts/adapters-freshness.js && node scripts/catalog-freshness.js` | ✅ | ⬜ pending |
| 40-01-01 | 01 | 1 | PLAIN-03 | T-40-01 | Inventory superset vs baseline; planted fact removal → red; baseline equals derivation at source_commit | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts` | ❌ W0 (40-01-01 writes it) | ⬜ pending |
| 40-08-01 | 08 | 4 | PLAIN-03 | T-40-21 | Board-move partition: duplicate owner → red; uncovered forward exit → red; undeclared off-table claim → red | unit | `npx vitest run scripts/check-role-rules.test.ts -t "partition"` | ❌ W0 (40-08-01 writes it) | ⬜ pending |
| 40-01-02 | 01 | 1 | PLAIN-03 | T-40-02 | D-30 stand-in admits role clauses only when the role-rule check passes; fails closed otherwise | unit (tmp git repos) | `npx vitest run scripts/check-diff-disposition.test.ts -t "stand-in"` | ❌ W0 (40-01-02 writes it) | ⬜ pending |
| 40-09-01 | 09 | 5 | PLAIN-04 | T-40-24 | Corpus total > 67,383 B → red (exactly 67,383 passes); real tree ≤ WARN 64,000 | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "corpus total"` | ❌ W0 (40-09-01 writes it) | ⬜ pending |
| 40-09-02 | 09 | 5 | PLAIN-04 | T-40-24 | `ROLE_CEILINGS` re-baselined; key set two-way; unknown role fails closed | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t "ROLE_CEILINGS"` | ✅ | ⬜ pending |
| 40-02-02, 40-03-03 | 02, 03 | 2, 3 | PLAIN-05 | T-40-09 | Do-less rules present; NOTICE byte copy; no banned literal | unit + gate | `npx vitest run install/installer-kit-home.test.ts -t "NOTICE" && node scripts/check-banned-claims.js` | ✅ | ⬜ pending |
| 40-03-03 | 03 | 3 | PLAIN-06 | T-40-11 | Lean lens present with sub-tags; governed corpus green | gate + unit | `npx vitest run scripts/tier-kit-text.test.ts -t "lean lens" && node scripts/check-imperative-lexicon.js` | ❌ W0 (40-03-03 writes the case) | ⬜ pending |
| 40-10-01 | 10 | 6 | PLAIN-07 | T-40-26 | Roles in the governed corpus (69 in 5 parts); planted 26-word role sentence → red | unit (planted mirror) | `npx vitest run scripts/check-imperative-lexicon.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-role-rules.ts` + `scripts/check-role-rules.test.ts` + committed baseline JSON (inventory + partition)
- [ ] Rewritten `mirror()` normalization in `scripts/check-foundation-guards.test.ts`
- [ ] Inverted caveman cases + corpus-total cases in `scripts/check-foundation-guards.test.ts`
- [ ] Stand-in cases in `scripts/check-diff-disposition.test.ts`
- [ ] CI step + `package.json` script for the new role-rule check

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reader check: goal, inputs, outputs, board moves, limits and stops nameable from each role file alone | PLAIN-02 | Meaning judgement (D-31) | Verifier reads each of the 19 roles + protocol and names the six items per file |
| Reference-role voice, shape and length approval | PLAIN-02 | Human checkpoint (D-16) | User reads rewritten `software-engineer.md` and approves before the batch rewrite |
| Rewritten rules keep their meaning, not only their anchor tokens | PLAIN-03 | Guard checks tokens; meaning needs review (D-28) | Plan review compares pre/post rule inventory entries per role |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
