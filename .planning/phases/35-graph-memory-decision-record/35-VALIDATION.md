---
phase: "35"
slug: "graph-memory-decision-record"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-20"
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Phase-local checks (three Node `.mjs` scripts, stdlib only, plus one bash scope script) in the phase directory; existing repo gates and three vitest files as regression. No new tests, no install |
| **Config file** | none for this phase (the checks are outside `tsconfig.json` `include` and the vitest test glob) |
| **Quick run command** | `node .planning/phases/35-graph-memory-decision-record/35-check-claims.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-content.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-row.mjs` |
| **Full suite command** | the quick run, then `bash .planning/phases/35-graph-memory-decision-record/35-check-scope.sh`, then `node scripts/check-uat-oracles.js && node scripts/check-nul-bytes.js && node scripts/check-banned-claims.js && node scripts/check-foundation-guards.js`, then `npx vitest run scripts/check-uat-oracles.test.ts scripts/check-nul-bytes.test.ts scripts/check-banned-claims.test.ts`. Never `npm test` (it starts the live e2e lane) |
| **Estimated runtime** | ~30 seconds (each check under 1 s except check-banned-claims; about 9 s per vitest file) |

---

## Sampling Rate

- **After every task commit:** Run the phase-local checks that exist by then (Task 1: row + claims; Task 2: content + claims + row; Task 3: all three + scope)
- **After every plan wave:** Run the full suite command
- **Before `/gsd-verify-work`:** Full suite must be green. Two repo gates are red before any Phase 35 write and are compared to that baseline, not required green: `node scripts/check-flip-manifest.js` (exit 1, archived 33-FLIP-MANIFEST.md) and `node scripts/check-diff-disposition.js` (exit 1, 63 findings over 40 elements)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | GRAPH-01, GRAPH-02 (D-01, D-02, D-07) | T-35-02 | The [v3.0, D-10] row sits after D-9 and points to the record; neither carries a token-saving figure; the claims check is proven fail-first on a scratch copy | tracer (script) | `node .planning/phases/35-graph-memory-decision-record/35-check-row.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-claims.mjs` | ❌ W0 (created in this task) | ⬜ pending |
| 35-01-02 | 01 | 1 | GRAPH-01, GRAPH-02 (D-03..D-08) | T-35-01, T-35-03 | Stamp rule, posture, trigger, five tools and their labels are present; still no figure | presence (script) | `node .planning/phases/35-graph-memory-decision-record/35-check-content.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-claims.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-row.mjs` | ❌ W0 (created in this task) | ⬜ pending |
| 35-01-03 | 01 | 1 | Roadmap SC-4, GRAPH-02 | T-35-04, T-35-05 | No Phase 35 commit or working-tree change outside `.planning/`; PROJECT.md readers stay green | scope + regression | `bash .planning/phases/35-graph-memory-decision-record/35-check-scope.sh`; the four repo gates; the three vitest files | ❌ W0 (scope script) / ✅ (gates) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-row.mjs` — D-01/D-02 (Task 1; watched RED before the row lands)
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-claims.mjs` — GRAPH-02/D-07 (Task 1; watched RED, then proven fail-first on a scratch copy with one planted figure)
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-content.mjs` — GRAPH-01 (Task 2; watched RED before the sections land)
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-scope.sh` — roadmap SC-4 (Task 3)

No framework install. The bodies of the three `.mjs` checks and the scope check were tested during research (35-RESEARCH.md § Code Examples).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No qualitative saving claimed as a grugops result | GRAPH-02 (D-07) | A sentence with no number passes every numeric check | `grep -n -i -E 'token\|cost\|cheap\|sav\|reduc\|fewer\|less\|spend\|lower\|cut\|shrink'` over 35-DECISION.md and the [v3.0, D-10] row; read each hit; only negations, the self-report sentence, trigger (b) and a tool's own runtime may mention tokens or cost |
| No reservation, scheduled review or follow-up | GRAPH-01 (D-04, D-05, D-06) | Meaning, not presence | `grep -n -i -E 'reserve\|schedul\|quarterly\|audit\|Phase 4[0-3]\|Phases 39\|role text\|LSP\|follow-up'` over 35-DECISION.md; read each hit; only negations pass |
| Labels on the right rows, nothing upgraded | GRAPH-01 (D-08) | Placement against a source table | Compare each table row with `.planning/research/STACK.md` lines 133-139: LOW on code-graph-rag, UNKNOWN - verify on Serena and the MCP memory server licenses, no vendor sentence on Graphify |
| REVIEW numbers from the claims check | GRAPH-02 (D-07) | The check lists numbers it cannot classify | Read every REVIEW line; each must be a count, version, date or reference, not a saving figure |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (`vitest run`, never watch)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
