---
phase: 21
slug: verify-before-write-admission-the-14-gate-as-the-un-cheatabl
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-17
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconstructed from artifacts (State B) on 2026-06-17 — no VALIDATION.md existed at execution time.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run scripts/context-io.test.ts scripts/admission-protocol-docs.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | ~18 seconds (full non-e2e suite); ~8s for the two phase-21 files |

> Note: `npm test` runs the live claude-CLI e2e lane (`scripts/e2e/`) — slow and token-spending. The non-e2e exclude command above is the regression command for this phase.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/context-io.test.ts scripts/admission-protocol-docs.test.ts`
- **After every plan wave:** Run `npx vitest run --exclude '**/scripts/e2e/**'`
- **Before `/gsd-verify-work`:** Full non-e2e suite must be green
- **Max feedback latency:** ~18 seconds

---

## Per-Task Verification Map

| Plan | Wave | Requirement | Threat Ref | Verified Behavior | Test Type | Automated Command | Test Location | Status |
|------|------|-------------|------------|-------------------|-----------|-------------------|---------------|--------|
| 21-01 | 1 | VFY-01 | T-21-03 | A `finding` is admitted only when a `§14-gate#<id>` stamp cross-checks a live GREEN verdict (Posture B); workhorse admit + no-verdict refuse | unit | `npx vitest run scripts/context-io.test.ts` | `context-io.test.ts` → `verify-before-write admission (VFY-01/VFY-02)` (L316) | ✅ green |
| 21-01 | 1 | VFY-02 | T-21-01 / T-21-02 | Refuse-self FAIL set (empty/`self`/`me`/`agent`/`==by`/DeLM-phrase/non-grammar) + `by: §14-gate` impersonation FAIL; 8 RED→GREEN fixtures | unit | `npx vitest run scripts/context-io.test.ts` | `context-io.test.ts` → same block | ✅ green |
| 21-02 | 2 | VFY-01 (producer) | T-21-06 / T-21-07 / T-21-08 | §14 gate emits a `by: §14-gate` verdict (unique `node:crypto` per-run id) only on `READY_FOR_HUMAN_REVIEW` via `context-io.ts emitVerdict` | unit + structural | `npx vitest run scripts/context-io.test.ts scripts/admission-protocol-docs.test.ts` | emit path: `context-io.test.ts` admission block; prose: `admission-protocol-docs.test.ts` → `VFY-04` | ✅ green |
| 21-02 | 2 | VFY-04 | T-21-08 | WF05 carries the bounded `self_fix_attempts` loop + the `UNKNOWN - verify` honest escape-hatch floor; verdict tied to `READY_FOR_HUMAN_REVIEW` | structural | `npx vitest run scripts/admission-protocol-docs.test.ts` | `admission-protocol-docs.test.ts` → `VFY-04` (3 WF05 cases) | ✅ green |
| 21-03 | 2 | VFY-03 | T-21-10 / T-21-11 / T-21-12 | WF16 exists (`order: 16`, H1 `# Workflow: context read/write`); all 17 role files carry exactly one `16-context-read-write` pointer | structural | `npx vitest run scripts/admission-protocol-docs.test.ts scripts/generate-catalog.test.ts` | `admission-protocol-docs.test.ts` → `VFY-03` (20 cases); WF16-as-workflow: `generate-catalog.test.ts` (17-workflow count) | ✅ green |
| 21-03 | 2 | VFY-04 | T-21-11 | WF16 references the bounded loop (`05-pr-quality-gate`/`self_fix_attempts`) and the `UNKNOWN - verify` escape hatch, referenced not restated | structural | `npx vitest run scripts/admission-protocol-docs.test.ts` | `admission-protocol-docs.test.ts` → `VFY-04` (2 WF16 cases) | ✅ green |
| 21-04 | 1 | VFY-01 (CR-01) | T-21-04-01 / T-21-04-02 | `parseNote` normalizes CRLF/CR→LF so a git-autocrlf (Windows) green verdict admits its matching finding; LF parsing byte-unchanged | unit | `npx vitest run scripts/context-io.test.ts` | `context-io.test.ts` → `CRLF round-trip admission (CR-01)` (L507) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure (vitest + `scripts/context-io.test.ts`, `scripts/generate-catalog.test.ts`, `scripts/check-foundation-guards.test.ts`) covered the two **code** requirements (VFY-01, VFY-02) at execution time.

The two **docs/prose** requirements (VFY-03 role-pointer invariant, VFY-04 gate-loop prose) had no automated test at execution — verified only by one-time manual grep. This validation pass closed that gap by adding:

- [x] `scripts/admission-protocol-docs.test.ts` — 25 structural tests asserting the VFY-03 + VFY-04 positive invariants (added 2026-06-17 during this validation).

No framework install or further Wave-0 stubs needed.

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

> Scope note (not a Phase-21 gap): the **negative** invariant "no role *restates* the protocol" (`guard_context_protocol_single_source`) is deliberately deferred to **Phase 24** (D-14). Phase 21's literal SC-3-light scope is the *positive* "every role references it" pointer — which `scripts/admission-protocol-docs.test.ts` now automates. The new test asserts only positive invariants so it does not pre-empt or duplicate the Phase-24 guard.

---

## Validation Sign-Off

- [x] All requirements have an `<automated>` verify command (no MISSING references remain)
- [x] Sampling continuity: every plan/requirement maps to an automated command (no 3 consecutive unverified)
- [x] Wave 0 covered all MISSING references (`admission-protocol-docs.test.ts` added for VFY-03/VFY-04)
- [x] No watch-mode flags (`vitest run`, not `vitest`)
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Verification evidence (2026-06-17):**
- `npx vitest run scripts/admission-protocol-docs.test.ts` → 25 passed
- `npx vitest run scripts/context-io.test.ts scripts/generate-catalog.test.ts scripts/check-foundation-guards.test.ts` → 59 passed
- `npx vitest run --exclude '**/scripts/e2e/**'` → 213 passed, 1 skipped, 0 failed (+25 vs pre-validation, no regressions)

**Approval:** approved 2026-06-17
