---
phase: 25
slug: governance-on-a-dial
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-23
validated: 2026-07-24
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (globals:false → import `describe/it/expect` explicitly) |
| **Config file** | repo's existing vitest setup (the `npm test` lane includes a LIVE CC e2e lane — never use bare `npm test` for regression; it spends tokens / can hang) |
| **Quick run command** | `npx vitest run hooks/admission-guard.test.ts scripts/config-governance-consistency.test.ts scripts/floor-invariance.test.ts scripts/context-io.test.ts scripts/admission-server.test.ts` |
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
| 25-01-01 | 01 | 1 | GOV-02, GOV-01 | T-25-04 (false-positive) | Both keys deep-equal across 2 JSONs; lean defaults `off`/`git`; twin documents each + D-09 distinction from `compaction` | config oracle (clone config-queue-consistency.test.ts) | `npx vitest run scripts/config-governance-consistency.test.ts` | ✅ (6 cases) | ✅ green |
| 25-01-02 | 01 | 1 | GOV-01, GOV-02 | T-25-05 (fail-open) | Shared `readGovernanceConfig` helper: read-at-use, default-on-absent (missing key/file → lean default, never an error/throw) | unit (temp dir, no-config + each value) | `npx vitest run scripts/context-io.test.ts -t governance-config` | ✅ | ✅ green |
| 25-02-01 | 02 | 2 | GOV-01 | T-25-01, T-25-03, T-25-05 | *(superseded by Plan 25-10 — see row 25-10-★)* Original Bash-string child-spawn oracle; the command-string parser was DELETED in the round-6 MOVE-THE-GATE pivot. The final oracle proves the STRUCTURED gate: gated finding DENIES without fresh env + matching `human:<name>` stamp; ALLOWs with both; refuse-self DENY; fail-closed on matched gated call | child-spawn deny/allow oracle on the structured hook, ≥ guard.test.ts case count (35 ≥ 27 — Pitfall-2 watch holds) | `npx vitest run hooks/admission-guard.test.ts` | ✅ (35 cases) | ✅ green |
| 25-02-02 | 02 | 2 | GOV-01 | T-25-04 (false-positive) | `hooks.json` admission matcher wired (final form: tool-FAMILY matcher `mcp__grugops__.*`, Plan 25-10 W3); freshness fresh for `admission-guard.js`; deferral-marker docs closed without tripping WR-01 | deterministic (freshness + foundation guards) | `npm run freshness && npx vitest run scripts/check-foundation-guards.test.ts` | ✅ | ✅ green |
| 25-03-01 | 03 | 3 | GOV-01 | T-25-02 (spoofing), T-25-01 | `admit()` D-04: high-severity finding lacking `human:<name>` under `human_admission ≠ off` → refuse + name the fault, NEVER rewrite (clear-voice). Round 8: D-04 consults the single-source `isHighSeverityRole` (admit() deliberately unfrozen + re-pinned) | unit on `admit()` return findings (temp dir) | `npx vitest run scripts/context-io.test.ts -t d-04` | ✅ | ✅ green |
| 25-03-02 | 03 | 3 | GOV-02 | T-25-04 | `audit_retention: retained` → one JSONL event appended (toJsonl fixed-key order) to `.grugops/audit/admissions.jsonl`; `git` → nothing written | unit on the write seam (temp dir) | `npx vitest run scripts/context-io.test.ts -t audit-ledger` | ✅ | ✅ green |
| 25-03-03 | 03 | 3 | GOV-01, GOV-02 | T-25-06 (dial bypass) | SC3 floor sweep: EVERY `human_admission`/`audit_retention` value incl. bogus/garbage → all 4 floor invariants still REFUSE (self-stamp refused, no-fabrication holds, `test_integrity` has no `off`, deploy guard byte-unchanged); structural: dials only ADD strictness | property/value-sweep | `npx vitest run scripts/floor-invariance.test.ts` | ✅ (27 cases) | ✅ green |
| 25-03-04 | 03 | 3 | GOV-01, GOV-02 | T-25-01, T-25-04, T-25-06 | SC3 safety-floor proof gate (HARD STOP, blocking checkpoint): INDEPENDENT both-direction RED-vs-committed-`.js` red-team + input-surface attack + garbage-dial sweep; a green author suite is NOT proof (D-12) | manual / blocking human-verify checkpoint | manual — COMPLETED over rounds 1–8; final closure checkpoint 25-13-04 human-approved 2026-06-29 (≥2 independent bash-grounded opus red-teams NO_BYPASS + orchestrator self-repro 19/19) | n/a | ✅ done |
| 25-09-★ | 09 | gap | GOV-01, GOV-02 | T-25-01, T-25-02 | Structured admission channel (D-01 move-the-gate): zero-dep JSON-RPC stdio MCP server; single sanctioned writer reused (`admitAndAppend → appendNote`); W-A single-source predicates (`isHighSeverityRole`, `isGatedNote`); round-7 hardening baked in (path-containment `writeNoteFile` chokepoint, `trustedRepoRoot()` from `CLAUDE_PROJECT_DIR`) | unit + protocol oracle | `npx vitest run scripts/admission-server.test.ts` | ✅ (22 cases) | ✅ green |
| 25-09-W | 09/13 | gap | GOV-01 | T-25-02 (spoofing) | W-B mechanical byte-freeze: span-hash pins `admit()` so any future edit goes RED (re-baselined at round 8 after the deliberate unfreeze, `ADMIT_FROZEN_SHA256` re-pinned); W-A behavioral suites for `isHighSeverityRole` / `isGatedNote` / `admitAndAppend` | structural freeze + unit | `npx vitest run scripts/context-io.test.ts` (describes: `W-B admit() mechanical byte-freeze`, `isHighSeverityRole`, `isGatedNote`, `admitAndAppend`) | ✅ | ✅ green |
| 25-10-★ | 10 | gap | GOV-01 | T-25-01, T-25-02, T-25-03 | Un-forgeable tier reads FINAL structured `tool_input` (obfuscation surface eliminated by construction, not by recognizing spellings); per-call fresh hook process binds agent stamp to CURRENT human-set session env (D-07); hook IMPORTS `isGatedNote` (no second grammar); round-8 `normalizeKind` ONE kind authority consulted by parseNote + isGatedNote + hook + server | child-spawn deny/allow oracle vs COMMITTED `.js`, both directions | `npx vitest run hooks/admission-guard.test.ts` | ✅ (35 cases) | ✅ green |
| 25-RT | 04–13 | gap | GOV-01 | all (D-12) | The per-round independent red-team checkpoints (25-05-04, 25-06-04, 25-07-04, 25-08 RT, 25-11-03, 25-12-04, 25-13-04): 8 rounds, 5 gaps_found catches vs a green author suite, terminal closure at round 8 via the structural GAP-R7-1 fix | manual / blocking human-verify checkpoints | manual — per-round findings in each SUMMARY + the 25-VERIFICATION.md banners; final approval 2026-06-29 | n/a | ✅ done |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · gap = gap-closure plan (rounds 1–8); plans 25-04…25-08 built the interim Bash-string parser later DELETED by the 25-09/25-10 structural pivot — their surviving assertions live on in the final-state suites above*

---

## Wave 0 Requirements

- [x] `hooks/admission-guard.test.ts` — child-spawn deny/allow oracle; covers GOV-01 SC1 (deny + allow + routine + `all`) + refuse-self + fail-closed. **35 cases ≥ `guard.test.ts`'s 27** — the Pitfall-2 count watch holds. Created by Plan 25-02 task 01; rewritten for the structured gate by Plan 25-10.
- [x] `scripts/config-governance-consistency.test.ts` — 3-surface lockstep (clone of `config-queue-consistency.test.ts`); covers GOV-02 SC2 + the D-09 distinction. Created by Plan 25-01 task 01. 6 cases green.
- [x] `scripts/floor-invariance.test.ts` — the SC3 dial-value sweep (incl. bogus/garbage strings) asserting all four floor invariants still refuse + the structural dials-only-tighten guarantee. Created by Plan 25-03 task 03. 27 cases green.
- [x] Extend `scripts/context-io.test.ts` (now 105KB) — the `readGovernanceConfig` helper (25-01), the D-04 in-script refusal + the GOV-02 ledger write/no-write behavior (25-03), plus the W-A/W-B single-source-predicate + freeze suites (25-09/25-13). Temp-dir driven.
- [x] `scripts/admission-server.test.ts` — the structured-channel MCP server oracle (Plan 25-09, post-contract addition). 22 cases green.
- [x] Framework install: **none** — Vitest + tsc already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The CC-only un-forgeable tier (a separate hook process reading the human-set SESSION env the agent's child env cannot reach) is honestly CC-only; the 4 non-CC CLIs degrade to prompt + D-04 in-script refusal | GOV-01 (D-05) | The cross-process session-env isolation is a Claude Code runtime property; the automated oracle proves the guard mechanism (deny/allow/refuse-self), but the human-set-vs-agent-self-set process boundary is a CC runtime behavior documented honestly, not a unit-testable script behavior | Confirm `hooks/admission-guard.test.ts` proves: (1) deny on matched high-severity admit absent approval, (2) allow with the var set in the spawned env, (3) DENY refuse-self-set even with the var in env. The session-env-vs-child-env isolation residual is documented in the twin / docs as CC-only (mirrors the deploy guard). |
| The INDEPENDENT red-team / opus-grade probe on the guard's INPUT SURFACE and LOGIC | GOV-01, SC3 (D-12) | A green suite is NOT proof for a safety guard (the terminal project lesson). Requires an independent adversary with different blind spots than the author | **COMPLETED 2026-06-29.** Executed as 8 rounds of independent bash-grounded opus red-teams (5 gaps_found catches a green author suite missed — rounds 3–7). Terminal closure at round 8: GAP-R7-1 structurally fixed (ONE `normalizeKind` authority + ONE `isHighSeverityRole` authority; `admit()` deliberately unfrozen + re-pinned), proven by ≥2 independent red-teams (both NO_BYPASS) + orchestrator self-repro (19/19) + human approval at blocking checkpoint 25-13-04. Documented irreducible residual (NOT a bypass): same-uid direct-FS forgery, backstopped by `autonomy=pr`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s (validation set runs in ~4s; foundation guards ~8s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-23 · re-validated 2026-07-24 (post-execution audit)

---

## Validation Audit 2026-07-24

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Post-execution Nyquist audit of the completed phase (13 plans; the contract above was written pre-execution against plans 01–03 only). Findings:

- **All 4 contracted Wave 0 test files exist and run green**, plus `scripts/admission-server.test.ts` from the Plan 25-09 structural pivot. Validation set: **366 tests green** (`admission-guard` 35 + `config-governance-consistency` 6 + `floor-invariance` 27 + `admission-server` 22 + the governance describes inside `context-io.test.ts`), ~4s.
- **Freshness:** 0-drift across all 25 committed `.js` files. **Foundation guards:** 28 green.
- **Pitfall-2 count watch holds:** `admission-guard.test.ts` 35 cases ≥ `guard.test.ts` 27.
- **Both manual-only verifications completed** — the D-12 independent red-team gate closed at round 8 (checkpoint 25-13-04, human-approved 2026-06-29); the CC-only tier honesty is documented in the twin/docs.
- **Map reconciled to final state:** the 25-02-01 Bash-string-parser oracle row is superseded by the 25-10 structured gate (the parser was deleted in the round-6 MOVE-THE-GATE pivot); rows 25-09-★/25-09-W/25-10-★/25-RT added for the gap-closure rounds' surviving final-state coverage.

GOV-01: **COVERED**. GOV-02: **COVERED**. No new tests generated — no gaps to fill.
