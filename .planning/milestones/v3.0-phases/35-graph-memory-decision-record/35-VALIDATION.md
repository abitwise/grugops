---
phase: "35"
slug: "graph-memory-decision-record"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-20"
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None new. Grep acceptance checks in the plan, a reader review, git scope commands, and two existing repo gates as regression. No phase-local scripts (scope cut by the human, 2026-10-20) |
| **Config file** | none |
| **Quick run command** | `test "$(grep -c '^## ' .planning/phases/35-graph-memory-decision-record/35-DECISION.md)" -ge 9 && grep -c '^\| \*\*\[v3.0, D-10\]\*\* ' .planning/PROJECT.md` |
| **Full suite command** | the quick run, then `git diff --name-only 4f282a25..HEAD -- . ':(exclude).planning/'` (prints nothing), then `node scripts/check-uat-oracles.js && node scripts/check-nul-bytes.js`. Never `npm test` (it starts the live e2e lane) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run that task's acceptance greps
- **After every plan wave:** Run the full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | GRAPH-01 (D-01, D-02) | T-35-02 | The [v3.0, D-10] row sits after D-9 and points to the record, which says not adopted, nothing built | tracer (grep) | `grep -c '^\| \*\*\[v3.0, D-10\]\*\* ' .planning/PROJECT.md` and the Task 1 acceptance greps | ✅ (grep) | ⬜ pending |
| 35-01-02 | 01 | 1 | GRAPH-01, GRAPH-02 (D-03..D-08), Roadmap SC-4 | T-35-01, T-35-03, T-35-04, T-35-05 | Stamp rule, posture, trigger, five tools and their labels are present; nothing outside `.planning/` changed; PROJECT.md readers stay green | presence (grep) + scope (git) + regression | Task 2 acceptance greps; `git diff --name-only 4f282a25..HEAD -- . ':(exclude).planning/'`; `node scripts/check-uat-oracles.js && node scripts/check-nul-bytes.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None. Every check uses grep, git or an existing repo gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No qualitative saving claimed as a grugops result | GRAPH-02 (D-07) | A sentence with no number passes every numeric check | `grep -n -i -E 'token\|cost\|cheap\|sav\|reduc\|fewer\|less\|spend\|lower\|cut\|shrink'` over 35-DECISION.md and the [v3.0, D-10] row; read each hit; only negations, the self-report sentence, trigger (b) and a tool's own runtime may mention tokens or cost |
| No reservation, scheduled review or follow-up | GRAPH-01 (D-04, D-05, D-06) | Meaning, not presence | `grep -n -i -E 'reserve\|schedul\|quarterly\|audit\|Phase 4[0-3]\|Phases 39\|role text\|LSP\|follow-up'` over 35-DECISION.md; read each hit; only negations pass |
| Labels on the right rows, nothing upgraded | GRAPH-01 (D-08) | Placement against a source table | Compare each table row with `.planning/research/STACK.md` lines 133-139: LOW on code-graph-rag, UNKNOWN - verify on Serena and the MCP memory server licenses, no vendor sentence on Graphify |
| No figure tied to tokens, cost or savings | GRAPH-02 (D-07) | No script checks figures in this phase | Read the record and the row in full; every number must be a count, version, date or reference, not a saving figure |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (`vitest run`, never watch)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
