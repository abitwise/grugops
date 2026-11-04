---
phase: "41"
slug: "orchestrator-flow-guidance"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-04"
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 |
| **Config file** | none at root beyond `package.json` scripts; `tsconfig.tests.json` for test typecheck |
| **Quick run command** | `npm run build && npm run typecheck && npx vitest run <touched test files>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | ~{N} seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run typecheck && npx vitest run <touched test files>` plus the text gates for any kit-text change
- **After every plan wave:** Run the full suite plus `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:queue`, `node scripts/check-uat-oracles.js`
- **Before `/gsd-verify-work`:** Full suite must be green (apart from the documented `~` directory case)
- **Max feedback latency:** {N} seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {filled by planner/executor} | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/runnable-ref/claim.test.ts` — RUN-05 host-copy cases (copy the committed `.js` alone into `mkdtempSync`, add `package.json`, spawn `node`)
- [ ] Text cases for WF17 flow guidance and the orchestrator pointer (RUN-02/03/04/06)
- [ ] A test binding the queue-default constant to `agent-factory/seed/.grugops/factory.config.json` `queue`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| {behavior} | REQ-{XX} | {reason} | {steps} |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {N}s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
