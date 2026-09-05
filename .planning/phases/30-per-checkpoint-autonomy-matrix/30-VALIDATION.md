---
phase: "30"
slug: "per-checkpoint-autonomy-matrix"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-05"
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (installed; `vitest.config.ts` sets `fileParallelism: false` deliberately — several oracles mutate the real working tree) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**' <file>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Typecheck** | `npm run typecheck` |
| **Build parity** | `npm run check:build-parity` |
| **Freshness** | `npm run freshness` plus the six per-artifact gates and the new `freshness:guarantees` |
| **Estimated runtime** | full suite ~60-90 seconds; single-file quick runs under 5 seconds |

**Never run `npm test`** — it is `vitest run` with no exclusion and pulls in the live Claude-CLI lane
in `scripts/e2e/`, which spends tokens and can hang on an authenticated machine.

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**' <the touched test file>` plus `npm run typecheck`.
- **After every plan wave:** `npx vitest run --exclude '**/scripts/e2e/**'` plus `npm run freshness` plus `npm run check:build-parity`.
- **Before `/gsd-verify-work`:** full suite green, all nine `check:*` gates green, all seven `freshness:*` gates green.
- **Max feedback latency:** under 30 seconds for a single-file run.
- **Guard-freeze exception:** for any task that edits `hooks/guard.ts`, verification runs AFTER the commit. `scripts/floor-invariance.test.ts` asserts both the blob hash and `git diff --quiet`, so the suite cannot be green mid-edit. A red naming the uncommitted-modification assertion is expected, not a broken change.
- **Cost note:** `scripts/floor-invariance.test.ts` is the most spawn-heavy file in the suite and its own header warns that this phase makes it heavier. If it approaches its timeout, split the file — never raise the number.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | AUTO-01/02/03/07 | T-30-01, T-30-02, T-30-04, T-30-06 | A config-only lowering denies by name; self-set of any floor var refused; guard re-frozen in one commit | hook spawn + oracle | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts` | ❌ W0 (extend) | ⬜ pending |
| 30-01-02 | 01 | 1 | AUTO-02 | T-30-04 | Every degenerate disposition value reaches `block` by rule | unit sweep | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts` | ❌ W0 | ⬜ pending |
| 30-01-03 | 01 | 1 | AUTO-07 | T-30-05 | Zero-config output differs from the pre-phase artifact by exactly one line | differential | `npx vitest run --exclude '**/scripts/e2e/**' scripts/autonomy-zero-config.test.ts` | ❌ W0 | ⬜ pending |
| 30-02-01 | 02 | 2 | AUTO-05 | — | Floor ids and the five-row remap decided by a human before any edit | checkpoint | human-check | n/a | ⬜ pending |
| 30-02-02 | 02 | 2 | AUTO-01/05 | T-30-08, T-30-09 | Every `depends_on` resolves; floor count asserted outside the filtering loop | unit + oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts scripts/audit-model.test.ts` | ✅ extend | ⬜ pending |
| 30-02-03 | 02 | 2 | AUTO-05 | T-30-07 | A duplicate claim id is refused by name | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/audit-model.test.ts` | ✅ extend | ⬜ pending |
| 30-03-01 | 03 | 2 | AUTO-06 | T-30-11 | `admit()` on an unreadable config refuses, degrades, writes nothing, does not throw | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | ✅ rewrite | ⬜ pending |
| 30-03-02 | 03 | 2 | AUTO-06 | T-30-10, T-30-13, T-30-13b | Exactly one governance reader; the frozen guard's import re-frozen in one commit | unit + oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts hooks/admission-guard.test.ts hooks/guard.test.ts` | ✅ rewrite | ⬜ pending |
| 30-03-03 | 03 | 2 | AUTO-06 | T-30-12 | Config-reading-site count derived, pinned, discriminating both directions | oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | ✅ extend | ⬜ pending |
| 30-04-01 | 04 | 3 | AUTO-01 | — | The derivation corpus amendment and the tagging list approved by a human | checkpoint | human-check | n/a | ⬜ pending |
| 30-04-02 | 04 | 3 | AUTO-01 | T-30-14, T-30-15, T-30-16 | Two-sided set equality; boundary, fence and non-canonical tags refused; short scan red | unit + oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts` | ✅ extend | ⬜ pending |
| 30-04-03 | 04 | 3 | AUTO-01 | T-30-17 | Every frozen-section edit carries its companion row | oracle | `npm run check:diff-disposition` | ✅ exists | ⬜ pending |
| 30-05-01 | 05 | 4 | AUTO-04 | T-30-18, T-30-19, T-30-20 | A green verdict is unwritable without a clean result; nothing partial survives a refusal | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | ✅ extend | ⬜ pending |
| 30-05-02 | 05 | 4 | AUTO-04 | T-30-20 | Every pin passes a deliberate state; the emission verb exists and is enumerated | unit + CLI | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts scripts/compactor.test.ts scripts/admission-server.test.ts scripts/floor-invariance.test.ts` | ✅ extend | ⬜ pending |
| 30-05-03 | 05 | 4 | AUTO-04/01 | T-30-21 | The gate workflow describes a mechanism that exists; its stop bullets are tagged | oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/admission-protocol-docs.test.ts` | ✅ extend | ⬜ pending |
| 30-06-01 | 06 | 4 | AUTO-02/07 | T-30-23 | The retired key is refused; an unknown checkpoint id is refused; absence is never an error | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` | ✅ extend | ⬜ pending |
| 30-06-02 | 06 | 4 | AUTO-02/07 | T-30-24 | Eight fixtures each still fail for exactly their one reason; twins byte-identical | unit + oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts scripts/config-governance-consistency.test.ts scripts/config-queue-consistency.test.ts scripts/model-dial-consistency.test.ts` | ✅ extend | ⬜ pending |
| 30-06-03 | 06 | 4 | AUTO-05 | T-30-22, T-30-25 | The installer reports a retired key and writes nothing; adapters regenerate with no diff | oracle | `npx vitest run install/install.test.ts` | ✅ extend | ⬜ pending |
| 30-07-01 | 07 | 5 | AUTO-05 | T-30-26, T-30-27, T-30-29 | The join refuses a short result as loudly as an empty one; the residual is named | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-guarantees.test.ts` | ❌ W0 | ⬜ pending |
| 30-07-02 | 07 | 5 | AUTO-05 | T-30-30 | A hand edit is red; a broken regeneration never reports fresh | oracle | `npm run freshness:guarantees` | ❌ W0 | ⬜ pending |
| 30-07-03 | 07 | 5 | AUTO-05/02 | T-30-28 | The new public document is inside both language gates, proven by planted literals | oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts` | ✅ extend | ⬜ pending |
| 30-08-01 | 08 | 5 | AUTO-03/05 | T-30-32, T-30-33, T-30-35 | Both lowering cases write exactly one finding through the sanctioned path | hook spawn | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts` | ✅ extend | ⬜ pending |
| 30-08-02 | 08 | 5 | AUTO-05 | T-30-31 | Banner and decision come from one evaluation and cannot disagree | hook spawn | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts` | ✅ extend | ⬜ pending |
| 30-08-03 | 08 | 5 | AUTO-07 | T-30-34 | Every roster id's zero-config behavior is compared; exactly one added line | differential | `npx vitest run --exclude '**/scripts/e2e/**' scripts/autonomy-zero-config.test.ts` | ✅ extend | ⬜ pending |
| 30-09-01 | 09 | 6 | AUTO-05 | T-30-36 | A drop and a lowered floor cannot disagree in either direction | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-guarantees.test.ts scripts/audit-model.test.ts` | ✅ extend | ⬜ pending |
| 30-09-02 | 09 | 6 | AUTO-05 | T-30-37, T-30-38 | A hand-written or deleted disclosure is red; bijection and contiguity survive | oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-claim-anchors.test.ts` | ✅ extend | ⬜ pending |
| 30-09-03 | 09 | 6 | AUTO-05 | T-30-39, T-30-40 | The render's residual is generated from the register row; three pointer lines asserted | oracle | `npm run generate:guarantees && npm run freshness:guarantees && git diff --exit-code -- docs/GUARANTEES.md` | ✅ extend | ⬜ pending |
| 30-10-01 | 10 | 7 | AUTO-01/02/06 | T-30-41, T-30-42, T-30-44 | Every bypass RED-first, mirror-reproduced on the committed artifact, structurally fixed | adversarial | `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts scripts/context-io.test.ts scripts/validate.test.ts` | ✅ extend | ⬜ pending |
| 30-10-02 | 10 | 7 | AUTO-05/07 | T-30-41, T-30-42 | Short joins, unclean regenerations and second-evaluation banners each red | adversarial | `npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-guarantees.test.ts scripts/autonomy-zero-config.test.ts scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts` | ✅ extend | ⬜ pending |
| 30-10-03 | 10 | 7 | AUTO-01/02/05/06/07 | T-30-43 | Closure rests on two independent reviews and self-reproduction, never on greenness | checkpoint | human-check | n/a | ⬜ pending |
| 30-11-01 | 11 | 8 | AUTO-03 | T-30-45, T-30-48 | Every reproduction targets the committed hook artifact; the freeze scope answered | adversarial | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts hooks/admission-guard.test.ts` | ✅ extend | ⬜ pending |
| 30-11-02 | 11 | 8 | AUTO-04/03 | T-30-46, T-30-47 | No unguarded path into the emitter; the published residual rests on an observation | adversarial + manual | `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` | ✅ extend | ⬜ pending |
| 30-11-03 | 11 | 8 | AUTO-03/04 | T-30-49 | Closure rests on two independent reviews and self-reproduction, never on greenness | checkpoint | human-check | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Framework install: **none needed** — vitest 4.1.8 is present and configured.

- [ ] `scripts/checkpoints.test.ts` — created in plan 30-01 Task 2, before the derivation lands in 30-04
- [ ] `scripts/autonomy-zero-config.test.ts` — created in plan 30-01 Task 3
- [ ] `scripts/generate-guarantees.test.ts` — created in plan 30-07 Task 1, before the render is consumed in 30-09
- [ ] `scripts/guarantees-freshness.ts` and its assertions — created in plan 30-07 Task 2
- [ ] A defaultless-union-member experiment proving the compile error — run and quoted in plan 30-01 and again in 30-04
- [ ] A recorded-residual assertion for the settings-file grant vector — established empirically in plan 30-11 Task 2, recorded in the register in plan 30-09 Task 3
- [ ] `docs/audit/29-style-dispositions/30-04.md` and `30-05.md` — companion rows, created in the same tasks as the frozen-section edits

Every `<automated>` command in every task either names a test file created by an earlier task in the
same or an earlier wave, or an existing script. No task carries a `MISSING` sentinel.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The settings-file grant vector reaches a hook subprocess mid-session | AUTO-03 | It is a property of the host application's own settings reload behavior, not of this repository's code; no in-repo test can establish it | Plan 30-11 Task 2: on the installed host, place the grant into a host settings file mid-session, spawn a hook subprocess afterwards, and record the observed result with the host version and the settings scope used |
| Two independent adversarial reviews find nothing new on each surface | AUTO-01..07 | A review is a judgement, and the closure standard requires independence from the fixing agent | Plans 30-10 and 30-11 Task 3: two separate reviews at the strongest available model, each scoped and recorded in the round log |
| The floor ids, the five-row remap and the derivation corpus amendment | AUTO-01, AUTO-05 | They change published identifiers and amend a locked decision; a human decides | Plans 30-02 and 30-04 Task 1 checkpoints |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a human-check checkpoint with no Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all newly created test files, each created before its first consumer
- [x] No watch-mode flags
- [x] Feedback latency under 30s for single-file runs
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
