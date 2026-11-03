---
phase: "40"
slug: "plain-language-role-rewrite"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| 40-01-03 | 01 | 1 | PLAIN-01 | T-40-06 | Planted caveman fence in a mirrored role → inverted guard exits 1 naming the file; real tree has 0 fences | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "caveman"` | ✅ | ✅ green |
| 40-01-03 | 01 | 1 | PLAIN-01 | T-40-07 | No live role returns a fence (voice-model control inverted); voice-model.ts untouched | unit | `npx vitest run scripts/voice-model.test.ts -t "every live role"` | ✅ | ✅ green |
| 40-01-03 | 01 | 1 | PLAIN-01 | — | `ROLE_SECTIONS` no longer requires the caveman heading | unit | `npx vitest run scripts/validate.test.ts` | ✅ | ✅ green |
| 40-08-03 | 08 | 4 | PLAIN-02 | T-40-22 | Every role has `## Stop when` and `## Activates when`; bad fixtures fail for exactly one reason | unit | `npx vitest run scripts/validate.test.ts` | ✅ | ✅ green |
| 40-02-01, 40-03-01..40-07-02 | 02-07 | 2-3 | PLAIN-02 | T-40-08 | Adapter and catalog bytes unchanged | unit + freshness | `npx vitest run scripts/adapter-byte-baseline.test.ts && node scripts/adapters-freshness.js && node scripts/catalog-freshness.js` | ✅ | ✅ green |
| 40-01-01 | 01 | 1 | PLAIN-03 | T-40-01 | Inventory superset vs baseline; planted fact removal → red; baseline equals derivation at source_commit | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts` | ✅ | ✅ green |
| 40-08-01 | 08 | 4 | PLAIN-03 | T-40-21 | Board-move partition: duplicate owner → red; uncovered forward exit → red; undeclared off-table claim → red | unit | `npx vitest run scripts/check-role-rules.test.ts -t "partition"` | ✅ | ✅ green |
| 40-01-02 | 01 | 1 | PLAIN-03 | T-40-02 | D-30 stand-in admits role clauses only when the role-rule check passes; fails closed otherwise | unit (tmp git repos) | `npx vitest run scripts/check-diff-disposition.test.ts -t "stand-in"` | ✅ | ✅ green |
| 40-09-01 | 09 | 5 | PLAIN-04 | T-40-24 | Corpus total > 67,383 B → red (exactly 67,383 passes); real tree ≤ WARN 64,000 | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "corpus total"` | ✅ | ✅ green |
| 40-09-02 | 09 | 5 | PLAIN-04 | T-40-24 | `ROLE_CEILINGS` re-baselined; key set two-way; unknown role fails closed | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t "ROLE_CEILINGS"` | ✅ | ✅ green |
| 40-02-02, 40-03-03 | 02, 03 | 2, 3 | PLAIN-05 | T-40-09 | Do-less rules present; NOTICE byte copy; no banned literal | unit + gate | `npx vitest run install/installer-kit-home.test.ts -t "NOTICE" && node scripts/check-banned-claims.js` | ✅ | ✅ green |
| 40-03-03 | 03 | 3 | PLAIN-06 | T-40-11 | Lean lens present with sub-tags; governed corpus green | gate + unit | `npx vitest run scripts/tier-kit-text.test.ts -t "lean lens" && node scripts/check-imperative-lexicon.js` | ✅ | ✅ green |
| 40-10-01 | 10 | 6 | PLAIN-07 | T-40-26 | Roles in the governed corpus (69 in 5 parts); planted 26-word role sentence → red | unit (planted mirror) | `npx vitest run scripts/check-imperative-lexicon.test.ts` | ✅ | ✅ green |
| 40-11-01 | 11 | 1 | PLAIN-03 | T-40-02 | CR-01: deleting a merge, deploy or named-human sentence on a mirror is red naming the role and the lost fact; a move into `## Stop when` keeps the fact, a move elsewhere loses it | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts -t "CR-01"` | ✅ | ✅ green |
| 40-11-02 | 11 | 1 | PLAIN-03 | T-40-01 | WR-05: baseline pinned to the Phase 40 start commit; a foreign `source_commit` is red; the writer reads git objects only and fails by name outside git | unit (tmp git repos) | `npx vitest run scripts/check-role-rules.test.ts -t "WR-05"` | ✅ | ✅ green |
| 40-12-01 | 12 | 1 | PLAIN-03 | T-40-02 | WR-04: role `## Stop when` is frozen like `## Hard limits`; a renamed heading shrinks the frozen set and is refused | unit (tmp git repos) | `npx vitest run scripts/check-diff-disposition.test.ts -t "WR-04"` | ✅ | ✅ green |
| 40-12-02 | 12 | 1 | PLAIN-03 | T-40-02 | IN-04: `role_standin` naming any script but `scripts/check-role-rules.js`, or a second key line, is refused by name | unit (tmp git repos) | `npx vitest run scripts/check-diff-disposition.test.ts -t "IN-04"` | ✅ | ✅ green |
| 40-13-01 | 13 | 1 | PLAIN-03 | T-40-21 | CR-02: the lean close needs the named human's sign-off, a human merge and the lean DoD; `## Stop when` holds the ticket in `In UAT` until both | unit (text pins) | `npx vitest run scripts/tier-kit-text.test.ts -t "CR-02"` | ✅ | ✅ green |
| 40-13-02 | 13 | 1 | PLAIN-03 | T-40-21 | WR-02: one lean owner of the `In UAT` exit across the UAT Planner, the Orchestrator and Workflow 06 | unit (text pins) | `npx vitest run scripts/tier-kit-text.test.ts -t "WR-02"` | ✅ | ✅ green |
| 40-14-01 | 14 | 2 | PLAIN-03 | T-40-21 | WR-01: partition rule 4 refuses gate-skipping moves; only the two D-33 approved non-forward pairs are admitted | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts -t "WR-01" && npx vitest run scripts/check-role-rules.test.ts -t "approved pair"` | ✅ | ✅ green |
| 40-14-02 | 14 | 2 | PLAIN-03 | T-40-21 | IN-02: a `## Board moves` arrow span that is not a column pair is a named finding (rule 6) | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts -t "IN-02"` | ✅ | ✅ green |
| 40-15-01 | 15 | 1 | PLAIN-02 | — | IN-03: no fixture role header types a section count (≥176 files walked) | unit | `npx vitest run scripts/validate.test.ts -t "type no section count"` | ✅ | ✅ green |
| 40-15-02 | 15 | 1 | PLAIN-07 | — | IN-01: writing profile cites no internal ids; C-28-045 anchor byte-frozen | gate | `node scripts/check-banned-claims.js && node scripts/check-claim-anchors.js` | ✅ | ✅ green |
| 40-17-01, 40-17-02 | 17 | 1 | PLAIN-03 | T-40-21 | WR-03: the lean close and the `## Stop when` hold are exact sentences that follow `sign_off_acceptance`; Workflow 06 names the lean close, `notify`, `off` and the unchanged human merge. WR-01: dropping the sign-off or the merge clause from the close or the hold is red (mutation cases) | unit (text pins + mutations) | `npx vitest run scripts/tier-kit-text.test.ts -t "WR-03\|WR-01"` | ✅ | ✅ green |
| 40-18-01 | 18 | 1 | PLAIN-03 | T-40-21 | WR-02: a `## Board moves` span written with `->` or `=>`, or a prose move between two board columns, is a named rule 6 finding; `In Development -> Done` planted is red | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts -t "WR-02"` | ✅ | ✅ green |
| 40-18-02 | 18 | 1 | PLAIN-03 | T-40-01 | IN-02: every fact in the baseline and in `deriveAll(ROOT)` is a FACT_KINDS kind | unit | `npx vitest run scripts/check-role-rules.test.ts -t "kind floor"` | ✅ | ✅ green |
| 40-19-01 | 19 | 2 | PLAIN-03 | T-40-02 | CR-01 round 2: `carriesSafetyFact` is derived from SAFETY_RULE_FACTS alone; every derived safety fact is visible on the gate's normalized clauses at HEAD and at the Phase 40 start commit; the baseline did not move | unit | `npx vitest run scripts/check-role-rules.test.ts -t "CR-01 round 2"` | ✅ | ✅ green |
| 40-19-02, 40-19-03 | 19 | 2 | PLAIN-03 | T-40-01 | IN-01: a tampered baseline JSON is red against a git derivation (NOTE without git); IN-03: `deriveAllAt` from a subdirectory with a non-ASCII path equals the working tree | unit (tmp git repos) | `npx vitest run scripts/check-role-rules.test.ts -t "IN-01\|IN-03"` | ✅ | ✅ green |
| 40-20-01 | 20 | 3 | PLAIN-03 | T-40-54 | Every Phase 40 safety clause the narrowed stand-in holds back has a row: listing owes 0, the gate exits 0 | gate | `node scripts/check-diff-disposition.js` | ✅ | ✅ green |
| 40-21-01, 40-21-02 | 21 | 4 | PLAIN-03 | T-40-02 | CR-01 round 2: a changed role clause carrying a safety fact on either side never reaches the D-30 stand-in, at both admission points; the verifier's merge-ban reword on a clone is red; a fact-free reword is still admitted | unit (tmp git repos + mirrors) | `npx vitest run scripts/check-diff-disposition.test.ts -t "CR-01 round 2"` | ✅ | ✅ green |
| 40-21-01 | 21 | 4 | PLAIN-03 | — | Admission-hook closure baselines match the regenerated manifest (15 modules) | unit | `npx vitest run scripts/board-readonly.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/check-role-rules.ts` + `scripts/check-role-rules.test.ts` + committed baseline JSON (inventory + partition)
- [x] Rewritten `mirror()` normalization in `scripts/check-foundation-guards.test.ts`
- [x] Inverted caveman cases + corpus-total cases in `scripts/check-foundation-guards.test.ts`
- [x] Stand-in cases in `scripts/check-diff-disposition.test.ts`
- [x] CI step + `package.json` script for the new role-rule check

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reader check: goal, inputs, outputs, board moves, limits and stops nameable from each role file alone | PLAIN-02 | Meaning judgement (D-31) | Verifier reads each of the 19 roles + protocol and names the six items per file |
| Reference-role voice, shape and length approval | PLAIN-02 | Human checkpoint (D-16) | User reads rewritten `software-engineer.md` and approves before the batch rewrite |
| Rewritten rules keep their meaning, not only their anchor tokens | PLAIN-03 | Guard checks tokens; meaning needs review (D-28) | Plan review compares pre/post rule inventory entries per role |
| WR-06: the 31 frozen-section findings retired by the D-30 base move are read by a named human | PLAIN-03 | Only a named human can give a disposition (T-40-45, `blocking-human`) | Done 2026-11-02: Olger replied "accept-all, Olger"; `docs/audit/40-disposition-base-move.md` holds 31 `accepted by Olger` cells and 0 `pending (named human)` (count check: `grep -c 'pending (named human)' docs/audit/40-disposition-base-move.md` → 0) |
| Lean-close wording reads with the intended meaning (CR-02, WR-02) | PLAIN-03 | Text pins check tokens; meaning is a judgment check in plan 40-13 | Verifier reads the new `orchestrator.md` / `uat-planner.md` lean-close sentences |
| CR-01 round 2: the 36 Phase 40 safety-sentence rows are read by a named human | PLAIN-03 | Only a named human can give a disposition (T-40-54, `blocking-human`) | Done 2026-11-03: Olger replied "accept-all, Olger"; `docs/audit/29-style-dispositions/40-20.md` holds 36 `accepted by Olger:` cells and 0 `pending (named human)` (count check: `grep -c 'pending (named human)' docs/audit/29-style-dispositions/40-20.md` → 0) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-01 by /gsd-validate-phase 40. All 13 mapped commands were re-run on HEAD and exit 0. Manual-only rows: the D-16 reference-role approval was given at the 40-02 checkpoint ("approved"); the reader check and the meaning review go to the phase verifier. Gap round (2026-11-02): rows 40-11-01 to 40-15-02 cover the gap-closure plans; all 10 mapped commands were re-run on HEAD and pass, and `check-role-rules.js` and `check-diff-disposition.js` exit 0. The final full suite had 10,844 passed and 21 failed, exactly the recorded pre-existing set. 40-16 is a human disposition and sits in Manual-Only. Note: 40-10 changed one adapter on purpose (security-nfr, sentence split for D-32), recorded as a `RECORDED_CHANGED` literal in adapter-byte-baseline.test.ts. The adapter row therefore proves no unrecorded byte change, rather than no change at all. Gap round 2 (2026-11-03): rows 40-17-01 to 40-21-01 cover plans 40-17 to 40-21. All 8 mapped commands were re-run on HEAD and pass, and `check-role-rules.js` and `check-diff-disposition.js` exit 0. The full non-e2e suite had 10,888 passed and 21 failed, exactly the recorded pre-existing set in the same 7 files. 40-20's human read sits in Manual-Only.

## Validation Audit 2026-11-01

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
