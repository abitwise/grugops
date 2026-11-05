---
phase: "41"
slug: "orchestrator-flow-guidance"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| **Estimated runtime** | full suite about 23 minutes (1,386 s measured at planning); a touched test file takes seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run typecheck && npx vitest run <touched test files>` plus the text gates for any kit-text change
- **After every plan wave:** Run the full suite plus `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:queue`, `node scripts/check-uat-oracles.js`
- **Before `/gsd-verify-work`:** Full suite adds no failure to § Known baseline reds
- **Max feedback latency:** 60 seconds per task; the full suite runs at the wave boundary and in plan 41-06 `<verification>`

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 41-01-T1 | 41-01 | 1 | RUN-01 | T-41-03 | `done` empties the log; no FIFO open | unit | `npm run build && npx vitest run scripts/claim.test.ts scripts/now-running-freshness.test.ts` | extend | ✅ green |
| 41-01-T2 | 41-01 | 1 | RUN-02, RUN-06 | T-41-01, T-41-16 | record, owner, count and config rules | unit | `npm run build && npm run typecheck && npx vitest run scripts/claim.test.ts scripts/now-running-freshness.test.ts scripts/config-queue-consistency.test.ts` | extend | ✅ green |
| 41-01-T3 | 41-01 | 1 | RUN-01 | — | both dispatch paths empty the log | oracle | `node scripts/check-uat-oracles.js` | extend | ✅ green |
| 41-02-T1 | 41-02 | 1 | RUN-06 | T-41-07 | ask once; the answer note is cited | text | `npx vitest run scripts/tier-kit-text.test.ts` | extend | ✅ green |
| 41-02-T2 | 41-02 | 1 | RUN-06 | T-41-05, T-41-06 | stop precedence; approval names its proposal | text | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts` | extend | ✅ green |
| 41-02-T3 | 41-02 | 1 | RUN-06 | — | role and config agree on who asks | gate | `node scripts/check-role-rules.js && node scripts/check-diff-disposition.js` | yes | ✅ green |
| 41-03-T1 | 41-03 | 2 | RUN-05 | T-41-08, T-41-09 | installed `claim` runs; links refused | integration | `npx vitest run scripts/runnable-ref/claim.test.ts scripts/generate-runnable-embeds.test.ts` | Wave 0 | ✅ green |
| 41-03-T2 | 41-03 | 2 | RUN-05 | T-41-10 | install, uninstall and skew know claim.js | integration | `npx vitest run install/install.test.ts install/uninstall-removal.test.ts scripts/runnable-ref/state-check.test.ts` | extend | ✅ green |
| 41-03-T3 | 41-03 | 2 | RUN-01, RUN-05 | T-41-18 | `done` passes on a sealed note only | integration | `npx vitest run scripts/runnable-ref/claim.test.ts` | extend | ✅ green |
| 41-04-T1 | 41-04 | 2 | RUN-05, RUN-06 | — | one command per step; a role reaches `done` | text | `npx vitest run scripts/flow-guidance-text.test.ts` | Wave 0 | ✅ green |
| 41-04-T2 | 41-04 | 2 | RUN-02 | T-41-12, T-41-13 | refill rule; sweep at session start only | text | `npx vitest run scripts/flow-guidance-text.test.ts` | extend | ✅ green |
| 41-04-T3 | 41-04 | 2 | RUN-03, RUN-04 | T-41-14, T-41-15 | session compaction; host names stay in two blocks | text | `npx vitest run scripts/flow-guidance-text.test.ts scripts/config-queue-consistency.test.ts` | extend | ✅ green |
| 41-05-T1 | 41-05 | 3 | RUN-02 | T-41-19 | `free` is exact or refuses | integration | `npx vitest run scripts/runnable-ref/claim.test.ts` | extend | ✅ green |
| 41-05-T2 | 41-05 | 3 | RUN-05 | T-41-23 | a crash never denies a change | integration | `npx vitest run scripts/runnable-ref/runnable-exit-contract.test.ts` | extend | ✅ green |
| 41-05-T3 | 41-05 | 3 | RUN-02 | T-41-22 | a failed read is never a pass | fault injection | `npx vitest run scripts/runnable-ref/claim-read-sites.test.ts` | Wave 0 | ✅ green |
| 41-06-T1 | 41-06 | 4 | RUN-04, RUN-06 | T-41-25 | pointer and limit; role under its ceiling | text | `npx vitest run scripts/flow-guidance-text.test.ts` | extend | ✅ green |
| 41-06-T2 | 41-06 | 4 | RUN-04 | T-41-26 | README and registry agree | gate | `npm run check:claim-anchors` | yes | ✅ green |
| 41-06-T3 | 41-06 | 4 | RUN-06 (Phase 41 D-31) | T-41-28 | senior prompt at every tier; junior stop stays | unit, text | `npx vitest run scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/tier-kit-text.test.ts` | extend | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/runnable-ref/claim.test.ts` — RUN-05 host-copy cases (copy the committed `.js` alone into `mkdtempSync`, add `package.json`, spawn `node`)
- [x] Text cases for WF17 flow guidance and the orchestrator pointer (RUN-02/03/04/06)
- [x] A test binding the queue-default constant to `agent-factory/seed/.grugops/factory.config.json` `queue`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frozen and safety disposition rows read | RUN-04, RUN-06 | The gate proves a row exists and cannot judge meaning | Read each `pending (named human)` row in `41-04.md` and `41-06.md` against its diff, then reply with a name |
| R-41-01 accepted in its shipped form | RUN-05 | A human decision whose consequence should be seen in the text | Read R-41-01 in `docs/audit/41-residuals.md` |
| Live run on the other five hosts | RUN-04 | The CLIs are absent on this machine | Milestone UAT; `UNKNOWN - verify` until then (R-41-05) |

---

## Known baseline reds

Measured at planning at HEAD 3fd34220, before any plan ran: 7 files, 21 failed, 10,921 passed, 2 skipped, 1,386 s. This phase owes no fix for these and must add none. Only one row comes from the untracked `~` directory: the `LANG-07` case. Most of the others read `.planning/phases/` records from phases that have since been archived, and `installer-fs-census` reads a `node:fs` export of this Node version.

| File | Test |
|------|------|
| `install/installer-fs-census.test.ts` | installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER |
| `scripts/canonical-corpus.test.ts` | canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS > provenance: every cited source artifact resolves on disk |
| `scripts/check-foundation-guards.test.ts` | LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24) > every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > every derived decline clause is enumerated, and the document names no other |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > the disposition document exists and carries the enumeration heading |
| `scripts/context-io.test.ts` | 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION 2: every WRITTEN id is a member the module still exports |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > PREMISE: the document was read and it names residual ids at all |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > a SEEDED undispositioned member turns the equality RED |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every FILE a row cites exists in the tree it names |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every MECHANISM a row claims is greppable in the evidence that row itself names |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > PREMISE: the live tree's own reading, printed before any mirror is believed |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > a mirror with a MAJORITY of rows stripped turns the new CEILING red |
| `scripts/uat-gate-exit-contract.test.ts` | every plan of round 6 carries the debt-does-not-grow acceptance criterion > all five round-6 PLAN files state it, and the count is asserted at five |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split("/") key see ONE spelling on every host |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > every ordinal-claiming sentence in the scanned set appears in the tracked list |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s per task
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** automated audit passed at `d5ab6f80`. The Manual-Only rows above still wait on a named human.

## Validation Audit 2026-11-05

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
