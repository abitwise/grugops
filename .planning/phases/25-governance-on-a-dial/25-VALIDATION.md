---
phase: 25
slug: governance-on-a-dial
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-23
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (globals:false → import `describe/it/expect` explicitly) |
| **Config file** | repo's existing vitest setup (the `npm test` lane includes a LIVE CC e2e lane — never use bare `npm test` for regression; it spends tokens / can hang) |
| **Quick run command** | `npx vitest run hooks/admission-guard.test.ts scripts/config-governance-consistency.test.ts scripts/floor-invariance.test.ts scripts/context-io.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | ~25–45 seconds (non-e2e) |
| **Freshness gate** | `npm run freshness` (auto-covers `hooks/admission-guard.js` + `scripts/context-io.js`) |
| **Foundation guards (WR-01 watch)** | `npx vitest run scripts/check-foundation-guards.test.ts` |

---

## Sampling Rate

- **After every task commit:** Run the **Quick run command** + `npm run freshness`
- **After every plan wave:** Run the **Full suite command** + `npm run freshness` + `npx vitest run scripts/check-foundation-guards.test.ts`
- **Before `/gsd-verify-work`:** Full non-e2e suite green + freshness 0-drift + the independent red-team on the admission guard + the both-direction RED-vs-committed-`.js` proof reproduced by an independent verifier
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | GOV-02, GOV-01 | T-25-04 (false-positive) | Both keys deep-equal across 2 JSONs; lean defaults `off`/`git`; twin documents each + D-09 distinction from `compaction` | config oracle (clone config-queue-consistency.test.ts) | `npx vitest run scripts/config-governance-consistency.test.ts` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | GOV-01, GOV-02 | T-25-05 (fail-open) | Shared `readGovernanceConfig` helper: read-at-use, default-on-absent (missing key/file → lean default, never an error/throw) | unit (temp dir, no-config + each value) | `npx vitest run scripts/context-io.test.ts -t governance-config` | ✅ (extend) | ⬜ pending |
| 25-02-01 | 02 | 2 | GOV-01 | T-25-01, T-25-03, T-25-05 | Planted `by: security-nfr` note + no approval → DENY naming the note; + human-set var → ALLOW; routine `by: software-engineer` under `high-severity` → ALLOW; refuse-self-set DENY; fail-closed DENY on matched admit. RED vs COMMITTED `.js`, both directions | child-spawn deny/allow oracle (clone guard.test.ts) ≥ guard.test.ts case count | `npx vitest run hooks/admission-guard.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-02 | 02 | 2 | GOV-01 | T-25-04 (false-positive) | `hooks.json` second matcher wired; freshness fresh for `admission-guard.js`; deferral-marker docs closed without tripping WR-01 | deterministic (freshness + foundation guards) | `npm run freshness && npx vitest run scripts/check-foundation-guards.test.ts` | ✅ | ⬜ pending |
| 25-03-01 | 03 | 3 | GOV-01 | T-25-02 (spoofing), T-25-01 | `admit()` D-04: high-severity finding lacking `human:<name>` under `human_admission ≠ off` → refuse + name the fault, NEVER rewrite (clear-voice) | unit on `admit()` return findings (temp dir) | `npx vitest run scripts/context-io.test.ts -t d-04` | ✅ (extend) | ⬜ pending |
| 25-03-02 | 03 | 3 | GOV-02 | T-25-04 | `audit_retention: retained` → one JSONL event appended (toJsonl fixed-key order) to `.grugops/audit/admissions.jsonl`; `git` → nothing written | unit on the write seam (temp dir) | `npx vitest run scripts/context-io.test.ts -t audit-ledger` | ✅ (extend) | ⬜ pending |
| 25-03-03 | 03 | 3 | GOV-01, GOV-02 | T-25-06 (dial bypass) | SC3 floor sweep: EVERY `human_admission`/`audit_retention` value incl. bogus/garbage → all 4 floor invariants still REFUSE (self-stamp refused, no-fabrication holds, `test_integrity` has no `off`, deploy guard byte-unchanged); structural: dials only ADD strictness | property/value-sweep | `npx vitest run scripts/floor-invariance.test.ts` | ❌ W0 | ⬜ pending |
| 25-03-04 | 03 | 3 | GOV-01, GOV-02 | T-25-01, T-25-04, T-25-06 | SC3 safety-floor proof gate (HARD STOP, blocking checkpoint): INDEPENDENT both-direction RED-vs-committed-`.js` red-team + input-surface attack + garbage-dial sweep; a green author suite is NOT proof (D-12) | manual / blocking human-verify checkpoint | manual — independent opus-grade probe; findings recorded in `25-03-SUMMARY.md` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `hooks/admission-guard.test.ts` — child-spawn deny/allow oracle (clone of `hooks/guard.test.ts`); covers GOV-01 SC1 (deny + allow + routine + `all`) + refuse-self + fail-closed. **MUST have ≥ as many cases as `guard.test.ts` (26 cases)** — the Pitfall-2 count watch (fewer cases = silently weakened deny path). Created by Plan 25-02 task 01.
- [ ] `scripts/config-governance-consistency.test.ts` — 3-surface lockstep (clone of `config-queue-consistency.test.ts`); covers GOV-02 SC2 + the D-09 distinction. Created by Plan 25-01 task 01.
- [ ] `scripts/floor-invariance.test.ts` — the SC3 dial-value sweep (incl. bogus/garbage strings) asserting all four floor invariants still refuse + the structural dials-only-tighten guarantee. Created by Plan 25-03 task 03.
- [ ] Extend `scripts/context-io.test.ts` (already exists, 61KB) — the `readGovernanceConfig` helper (25-01), the D-04 in-script refusal + the GOV-02 ledger write/no-write behavior (25-03). Temp-dir driven.
- [ ] Framework install: **none** — Vitest + tsc already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The CC-only un-forgeable tier (a separate hook process reading the human-set SESSION env the agent's child env cannot reach) is honestly CC-only; the 4 non-CC CLIs degrade to prompt + D-04 in-script refusal | GOV-01 (D-05) | The cross-process session-env isolation is a Claude Code runtime property; the automated oracle proves the guard mechanism (deny/allow/refuse-self), but the human-set-vs-agent-self-set process boundary is a CC runtime behavior documented honestly, not a unit-testable script behavior | Confirm `hooks/admission-guard.test.ts` proves: (1) deny on matched high-severity admit absent approval, (2) allow with the var set in the spawned env, (3) DENY refuse-self-set even with the var in env. The session-env-vs-child-env isolation residual is documented in the twin / docs as CC-only (mirrors the deploy guard). |
| The INDEPENDENT red-team / opus-grade probe on the guard's INPUT SURFACE and LOGIC | GOV-01, SC3 (D-12) | A green suite is NOT proof for a safety guard (the terminal project lesson). Requires an independent adversary with different blind spots than the author | Before `/gsd-verify-work`: an independent opus-grade probe reproduces the deny RED vs the COMMITTED `.js` in both directions, AND attacks the input surface (does a fenced doc example / kit write token / inline-content / argv quirk read as a live signal?) AND the logic (does any dial value / severity edge / stamp grammar open a hole?). See Plan 25-03 must_haves.prohibitions. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-23
