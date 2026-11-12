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
| 41-07-T1 | 41-07 | 1 | RUN-02, RUN-05 | T-41-29, T-41-32, T-41-33 | a lone host copy writes a note and `done` accepts it | integration | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note.test.ts scripts/generate-runnable-embeds.test.ts && npm run freshness:runnable-embeds` | Wave 0 | ✅ green |
| 41-07-T2 | 41-07 | 1 | RUN-02, RUN-05 | T-41-30, T-41-34, T-41-35, T-41-36, T-41-37 | every field, every refusal and the exit contract | integration, gate | `npx vitest run scripts/runnable-ref/note.test.ts && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-state-paths.js && npm run freshness:hook-manifest` | extend | ✅ green |
| 41-08-T1 | 41-08 | 1 | RUN-02, RUN-06 | T-41-39, T-41-41 | a repeated unapproved change meets the human stop before a fourth hand-off | text | `npx vitest run scripts/tier-kit-text.test.ts && node scripts/check-imperative-lexicon.js && node scripts/check-diff-disposition.js` | extend | ✅ green |
| 41-08-T2 | 41-08 | 1 | RUN-02, RUN-06 | T-41-40 | the Orchestrator stops honoring a key nothing reads | text, gate | `npx vitest run scripts/flow-guidance-text.test.ts scripts/config-queue-consistency.test.ts scripts/check-role-rules.test.ts && node scripts/check-role-rules.js` | extend | ✅ green |
| 41-09-T1 | 41-09 | 2 | RUN-02, RUN-05 | T-41-42 | a real install finishes a task with Node alone | integration | `npm run build && npx vitest run scripts/generate-runnable-embeds.test.ts install/install.test.ts` | extend | ✅ green |
| 41-09-T2 | 41-09 | 2 | RUN-02, RUN-05 | T-41-42 | every count pin moves by its measured number | integration | `npx vitest run install/uninstall-removal.test.ts install/installer-cross-version.test.ts install/installer-never-installed.test.ts install/installer-special-files.test.ts install/installer-user-edit.test.ts install/ledger-provenance.test.ts install/record-truth.test.ts` | extend | ✅ green |
| 41-09-T3 | 41-09 | 2 | RUN-02, RUN-05 | T-41-43 | the install guide says what Workflow 17 needs | text, gate | `npx vitest run install/host-tools-prose.test.ts && npm run check:claim-anchors && node scripts/check-banned-claims.js && npm run check:public-docs` | extend | ✅ green |
| 41-10-T1 | 41-10 | 3 | RUN-01, RUN-02 | T-41-44 | an orphan claim shows in the log and the sweep frees it, on a host copy | integration | `npm run build && npx vitest run scripts/runnable-ref/claim.test.ts scripts/claim.test.ts && npm run freshness:runnable-embeds` | extend | ✅ green |
| 41-10-T2 | 41-10 | 3 | RUN-01, RUN-02 | T-41-45, T-41-46 | every unusable record, the release path and the edges | unit, integration | `npx vitest run scripts/claim.test.ts scripts/now-running-freshness.test.ts scripts/runnable-ref/claim.test.ts scripts/runnable-ref/claim-read-sites.test.ts && node scripts/check-uat-oracles.js && npm run freshness:queue` | extend | ✅ green |
| 41-11-T1 | 41-11 | 4 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-48 | the text's own commands finish a task on host copies | integration, text | `npm run build && npx vitest run scripts/runnable-ref/role-route.test.ts scripts/flow-guidance-text.test.ts && node scripts/check-kit-refs.js && node scripts/check-role-rules.js` | Wave 0 | ✅ green |
| 41-11-T2 | 41-11 | 4 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-49 | Workflow 17 stops on a missing program, reads exit 1 by its line, and re-spawns after a crash | text | `npx vitest run scripts/flow-guidance-text.test.ts scripts/runnable-ref/role-route.test.ts && node scripts/check-uat-oracles.js` | extend | ✅ green |
| 41-11-T3 | 41-11 | 4 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-47, T-41-50 | the records say what stays open | gate | `npm run check:residual-citations && npm run check:audit-register && npm run check:claim-anchors && npm run check:public-docs && node scripts/check-diff-disposition.js && node scripts/adapters-freshness.js && node scripts/catalog-freshness.js && node scripts/skill-twins-freshness.js && node scripts/host-entries-freshness.js` | yes | ✅ green |
| 41-12-T1 | 41-12 | 2 | RUN-02, RUN-05 | T-41-52 | a failed read or a stopped render never reports a note, on the committed program | fault injection | `npm run build && npx vitest run scripts/runnable-ref/note-read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/runnable-ref/note.test.ts && npm run freshness:runnable-embeds` | extend | ✅ green |
| 41-12-T2 | 41-12 | 2 | RUN-02, RUN-05 | T-41-51, T-41-53, T-41-54 | the census holds the new copy | integration, gate | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/chrome-lane-bar.test.ts scripts/context-io.test.ts scripts/context-io-writer-set.test.ts scripts/check-foundation-guards.test.ts && node scripts/check-foundation-guards.js` | extend | ✅ green (failures are § Known baseline reds by name) |
| 41-13-T1 | 41-13 | 1 | RUN-02, RUN-05 | T-41-55 | an undeterminable home refuses the note on a lone host copy | integration | `npx vitest run scripts/runnable-ref/note-read-sites.test.ts -t "the dial holds with no fault"` | extend | ✅ green |
| 41-13-T2 | 41-13 | 1 | RUN-02, RUN-05 | T-41-52 | every read of the root ladder reports its failure | fault injection | `npx vitest run scripts/runnable-ref/note-read-sites.test.ts` | extend | ✅ green |
| 41-13-T3 | 41-13 | 1 | RUN-02, RUN-05 | T-41-55 | a named root with no configuration keeps the dial; every consumer fails closed | integration | `npx vitest run scripts/runnable-ref/note.test.ts scripts/compactor.test.ts` | extend | ✅ green |
| 41-14-T1 | 41-14 | 2 | RUN-02, RUN-05 | T-41-30 | every spelling the classifier folds to an adapter name is refused | integration | `npx vitest run scripts/runnable-ref/note.test.ts` | extend | ✅ green |
| 41-14-T2 | 41-14 | 2 | RUN-02, RUN-05 | — | the header and Workflows 16 and 17 say what the code does | text | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts` | extend | ✅ green |
| 41-14-T3 | 41-14 | 2 | RUN-02, RUN-05 | — | the records say what closed and what stays open | gate | `npm run check:residual-citations && npm run check:audit-register` | yes | ✅ green |
| 41-15-T2 | 41-15 | 3 | RUN-02, RUN-05 | T-41-64 | no unstamped note retires a green verdict or a gated finding | integration | `npx vitest run scripts/runnable-ref/note.test.ts scripts/compactor.test.ts` | extend | ✅ green |
| 41-15-T3 | 41-15 | 3 | RUN-02, RUN-05 | T-41-65, T-41-67 | the census holds S10; both Workflow 18 routes work under the rule | integration | `npx vitest run scripts/context-io-writer-set.test.ts scripts/compactor.test.ts` | extend | ✅ green |
| 41-16-T1 | 41-16 | 4 | RUN-02, RUN-05 | — | a role reads the rule the authority refuses by, and what it leaves open | text | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts` | extend | ✅ green |
| 41-16-T2 | 41-16 | 4 | RUN-02, RUN-05 | T-41-66 | the records name the fix; the suite compares by name | gate | `npm run check:residual-citations && npm run check:audit-register && npm run freshness` | yes | ✅ green |
| 41-17-T1 | 41-17 | 1 | RUN-02, RUN-05 | T-41-71 | `HOME` below the repository refuses the note, down to a lone host copy; `admit()` stays byte-frozen | integration | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note-read-sites.test.ts -t "the dial holds with no fault" && npx vitest run scripts/context-io.test.ts -t "WR-21\|CR-13\|byte-freeze"` | extend | ✅ green |
| 41-17-T2 | 41-17 | 1 | RUN-02, RUN-05 | T-41-72, T-41-74, T-41-75 | every audit route, the name bypass, the cost and the limit are held with no fault | integration | `npx vitest run scripts/runnable-ref/note-read-sites.test.ts scripts/runnable-ref/note.test.ts scripts/runnable-ref/role-route.test.ts scripts/runnable-ref/claim.test.ts scripts/admission-server.test.ts hooks/admission-guard.test.ts scripts/context-io.test.ts scripts/context-io-writer-set.test.ts scripts/compactor.test.ts` | extend | ✅ green |
| 41-17-T3 | 41-17 | 1 | RUN-02, RUN-05 | T-41-76 | the text names the refusal, its cost and the fourth limit of R-41-07 | text, gate | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts && npm run check:residual-citations && npm run check:audit-register && node scripts/check-diff-disposition.js` | extend | ✅ green |
| 41-18-T1 | 41-18 | 2 | RUN-02, RUN-05 | T-41-77, T-41-79 | on D-39, a `supersedes` target in the store that cannot be read is refused; the ninth re-base holds | integration | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note.test.ts scripts/compactor.test.ts scripts/context-io-writer-set.test.ts && npx vitest run scripts/context-io.test.ts -t "byte-freeze"` | extend | ✅ green |
| 41-18-T2 | 41-18 | 2 | RUN-02, RUN-05 | T-41-78, T-41-80, T-41-81, T-41-82 | every unreadable shape refuses; D-37's control and both Workflow 18 routes hold; the file-name limit is pinned | integration | `npx vitest run scripts/runnable-ref/note.test.ts scripts/runnable-ref/note-read-sites.test.ts scripts/compactor.test.ts hooks/admission-guard.test.ts scripts/admission-server.test.ts scripts/context-io.test.ts scripts/context-io-writer-set.test.ts` | extend | ✅ green |
| 41-18-T3 | 41-18 | 2 | RUN-02, RUN-05 | T-41-83 | the records name the fix and R-41-09; the full suite is compared by name | text, gate | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts && npm run check:residual-citations && npm run check:audit-register && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` | extend | ✅ green |
| 41-19-T1 | 41-19 | 1 | RUN-01, RUN-05 | T-41-84 | `claim` refuses a subtask `done` would refuse; a lost race still reads lost | integration | `npm run build && npm run typecheck && npx vitest run scripts/claim.test.ts scripts/now-running-freshness.test.ts scripts/runnable-ref/claim.test.ts scripts/runnable-ref/claim-read-sites.test.ts scripts/convergence-spine.test.ts scripts/flow-guidance-text.test.ts` | extend | ✅ green |
| 41-19-T2 | 41-19 | 1 | RUN-02 | T-41-85, T-41-86 | `sweep` keeps a newer pending file and names every entry it cannot judge | unit, integration | `npm run build && npm run typecheck && npx vitest run scripts/claim.test.ts scripts/runnable-ref/claim.test.ts scripts/runnable-ref/claim-read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/runnable-ref/state-check.test.ts scripts/worktree-dogfood.test.ts scripts/now-running-freshness.test.ts` | extend | ✅ green |
| 41-19-T3 | 41-19 | 1 | RUN-04 | T-41-87 | the queue text names a re-queued subtask and stops on what the sweep leaves | text, gate | `npm run build && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts && node scripts/check-diff-disposition.js` | extend | ✅ green |
| 41-20-T1 | 41-20 | 2 | RUN-05 | T-41-64, T-41-88, T-41-89, T-41-90 | one gate run stamps one verdict; S4 names the route; the tenth re-base holds | unit, integration | `npm run build && npm run typecheck && npx vitest run scripts/context-io.test.ts -t "WR-14\|byte-freeze" && npx vitest run scripts/context-io-writer-set.test.ts scripts/compactor.test.ts scripts/admission-server.test.ts scripts/floor-invariance.test.ts scripts/chrome-lane-bar.test.ts scripts/runnable-ref/note.test.ts hooks/admission-guard.test.ts` | extend | ✅ green |
| 41-20-T2 | 41-20 | 2 | RUN-02, RUN-05 | T-41-91 | the banner names no program; the text names the route that retires a verdict or a gated finding | unit, text | `npm run build && npx vitest run scripts/context-io.test.ts -t "render" && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/now-running-freshness.test.ts scripts/board-watch.test.ts scripts/board-dashboard.test.ts` | extend | ✅ green |
| 41-21-T1 | 41-21 | 3 | RUN-05 | T-41-93 | an unrecordable admission is exit 2 with one `Error:` line; a note `admit()` refuses is still exit 1 | integration | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note.test.ts scripts/generate-runnable-embeds.test.ts` | extend | ✅ green |
| 41-21-T2 | 41-21 | 3 | RUN-02, RUN-05 | T-41-92, T-41-94, T-41-95 | a link at the ledger is refused by name; the root refusal names the ladder and the path | integration, fault injection | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note.test.ts scripts/runnable-ref/note-read-sites.test.ts scripts/runnable-ref/role-route.test.ts scripts/admission-server.test.ts hooks/admission-guard.test.ts scripts/compactor.test.ts && npx vitest run scripts/context-io.test.ts -t "CR-13"` | extend | ✅ green |
| 41-21-T3 | 41-21 | 3 | RUN-05 | T-41-95 | Workflow 16 step 3 reads every exit; the stop names every repair | text | `npm run build && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts` | extend | ✅ green |
| 41-22-T1 | 41-22 | 4 | RUN-04, RUN-05 | T-41-96, T-41-97, T-41-98 | `note.js read` prints sealed notes only and names every other file skipped; the kit's read command runs on host copies | integration | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/role-route.test.ts scripts/runnable-ref/note.test.ts scripts/flow-guidance-text.test.ts` | extend | ✅ green |
| 41-22-T2 | 41-22 | 4 | RUN-02, RUN-05 | T-41-98, T-41-99 | READ-1 reaches `read` and every faulted read ends exit 2; the README names the in-script tier | fault injection, gate | `npm run build && npx vitest run scripts/runnable-ref/note-read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/runnable-ref/note.test.ts && npm run check:claim-anchors` | extend | ✅ green |
| 41-23-T1 | 41-23 | 5 | RUN-05 | T-41-100 | a host copy has no gate stamp; Workflows 16 and 17 and R-41-10 say so | integration, text | `npm run build && npx vitest run scripts/runnable-ref/role-route.test.ts scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts && npm run check:residual-citations` | extend | ✅ green |
| 41-23-T3 | 41-23 | 5 | RUN-04, RUN-05 | T-41-101, T-41-102, T-41-103 | Workflow 05 states the host result the human chose; Workflow 16 names the high-severity route | text, gate | `npm run build && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts && npm run check:residual-citations && npm run check:audit-register && node scripts/check-diff-disposition.js` | extend | ✅ green |
| 41-24-T1 | 41-24 | 6 | RUN-05 | T-41-104, T-41-105 | the supersession rules carry R-41-09's routes; the renamed-file route stays unaccepted | text, gate | `npm run build && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts && npm run check:residual-citations && npm run check:audit-register` | extend | ✅ green |
| 41-24-T2 | 41-24 | 6 | RUN-02, RUN-06 | — | the home refusal names the named root that pre-empts it; the config reference names the Tech Lead | text | `npm run build && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/config-queue-consistency.test.ts` | extend | ✅ green |
| 41-24-T3 | 41-24 | 6 | RUN-02, RUN-05, RUN-06 | T-41-106 | the 22 review rows are fixed with `open: 0`; the full suite is compared by name | gate | `npm run check:residual-citations && npm run check:audit-register && npm run check:claim-anchors && node scripts/check-diff-disposition.js && npm run freshness && npx vitest run scripts/floor-invariance.test.ts && npx vitest run --exclude '**/scripts/e2e/**'` | yes | ✅ green |
| 41-25-T1 | 41-25 | 7 | RUN-04, RUN-05 | T-41-107, T-41-110 | a lone host copy reproduces the plugin route; R-41-10 and Workflow 05 state both limits | integration, text | `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/role-route.test.ts scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts && npm run check:residual-citations` | extend | ✅ green |
| 41-25-T2 | 41-25 | 7 | RUN-04, RUN-05 | T-41-109, T-41-112 | Workflows 16 and 17 and the CHANGELOG agree; every changed clause has a pending row | text, gate | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts && node scripts/check-diff-disposition.js && npm run check:audit-register && npm run check:public-docs && npm run check:claim-anchors && node scripts/guarantees-freshness.js && npm run freshness` | extend | ✅ green |
| 41-25-T4 | 41-25 | 7 | RUN-04, RUN-05 | T-41-108, T-41-111 | the named acceptance is recorded in R-41-10, the Accepted Risks Log and D-44 | gate | `node scripts/check-kit-refs.js && node scripts/check-banned-claims.js && node scripts/check-diff-disposition.js && npm run check:residual-citations && npm run check:audit-register && npx vitest run scripts/flow-guidance-text.test.ts scripts/runnable-ref/role-route.test.ts` | yes | ✅ green |

| 41-26-T1 | 41-26 | 8 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-113, T-41-116 | the admission route is scoped to a Claude Code plugin install; a standalone install has no hook; R-41-11's acceptance cells are unchanged | text, gate | `npm run build && npm run typecheck && npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts scripts/admission-protocol-docs.test.ts && node scripts/check-imperative-lexicon.js && node scripts/check-kit-refs.js && node scripts/check-banned-claims.js && npm run check:residual-citations && npm run check:public-docs` | extend | ✅ green |
| 41-26-T2 | 41-26 | 8 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-114, T-41-115, T-41-117 | session start stops on a kept claim before any re-spawn; deliverables and the Step-4 stamp route by host; every changed clause has a pending row | text, gate | `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/runnable-ref/role-route.test.ts scripts/admission-protocol-docs.test.ts && node scripts/check-role-rules.js && node scripts/check-diff-disposition.js && npm run check:audit-register && npm run check:claim-anchors && node scripts/check-foundation-guards.js` | extend | ✅ green |
| 41-26-T3 | 41-26 | 8 | RUN-01, RUN-02, RUN-03, RUN-04, RUN-05 | T-41-118 | the four review rows read fixed with `open: 0`; the full suite is compared by name | gate | `npm run freshness && npx vitest run scripts/floor-invariance.test.ts && npx vitest run --exclude '**/scripts/e2e/**'` | yes | ✅ green (failures are § Known baseline reds by name) |

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
| R-41-01 accepted in its shipped form | RUN-05 | A human decision whose consequence should be seen in the text | Resolved 2026-11-10: closed on `41-UAT.md` test 1's live runs (ruling of 2026-11-10 in `docs/audit/41-residuals.md`) |
| R-41-09 read against D-37 and D-39 | RUN-02, RUN-05 | No agent may accept a residual; T-41-81 reads `pending (named human): accept` | (a) and (b) accepted by Olger on 2026-11-10. Still open: (c), the renamed-file route. Read R-41-09 in `docs/audit/41-residuals.md` against D-37 and D-39 in `41-CONTEXT.md`: a renamed note made unreadable still reads as naming no note. Plan 41-24 (D-43) added a ruling note that the renamed-file route stays open and unaccepted (T-41-105); its negative check is a plan acceptance grep, not a suite test |
| 41-15 Task 1: the `admit()` unfreeze and the dangling-target rule (D-37) | RUN-02, RUN-05 | A blocking-human checkpoint; no agent picks the option | Resolved 2026-11-05 with the reply `narrow, Olger`; the rule is pinned by the 41-15-T2 and 41-15-T3 rows |
| 41-25 Task 3: the plugin-install limit of R-41-10 (D-44) | RUN-04, RUN-05 | A blocking-human checkpoint; no agent accepts a residual | Resolved 2026-11-12 with the reply `accept, Olger`; recorded in R-41-10, the Accepted Risks Log row `R-41-10 (plugin install)` and D-44 |
| The sentence directed at plan 41-16's Task 1 check | RUN-02, RUN-05 | Olger directed it; its row has not been read against the diff | Read the last row of `docs/audit/29-style-dispositions/41-16.md` against the Workflow 16 diff |
| R-41-07's fourth limit read against D-38 | RUN-02, RUN-05 | No agent may accept a residual; T-41-74 reads `pending (named human): accept` | Resolved 2026-11-10: the fourth limit accepted by Olger (ruling of 2026-11-10 in `docs/audit/41-residuals.md`) |
| T-41-73 logged as accepted | RUN-02, RUN-05 | D-38 accepts the cost by name; a re-audit needs the log row | Resolved 2026-11-10: Olger's reply logs T-41-73; `41-SECURITY.md` reads it `closed` with the Accepted Risks Log row |
| The `pending (named human)` rows of plans 41-08 to 41-25 | RUN-02, RUN-04, RUN-05, RUN-06 | The gate proves a row exists and cannot judge meaning | Read each such row in `docs/audit/29-style-dispositions/41-08.md`, `41-11.md`, `41-14.md` and `41-17.md` to `41-25.md` against its plan's diff, then reply with a name |
| 41-23 Task 2: the host gate result (D-41) | RUN-04 | A blocking-human checkpoint; no agent picks the option | Resolved 2026-11-12 with the reply `advise, Olger`; the text is pinned by "Workflow 05 says what a green run publishes on a host" |
| R-41-10 and R-41-11 read by a named human (T-41-103) | RUN-04, RUN-05 | No agent may accept a residual; R-41-11 is recorded as not accepted | R-41-10's plugin-install limit was accepted on 2026-11-12 (D-44). Still open: R-41-10's scripted-install limit and all of R-41-11. Read them in `docs/audit/41-residuals.md` against the Workflow 05 and Workflow 16 diffs of plans 41-23 and 41-25, then accept or send back with a name |
| 41-20's S4 route text | RUN-05 | The tests prove the text and the refusal, not that the route is right | Read the S4 message in `admit()` (`scripts/context-io.ts`), "Run the gate again: the new run mints a new id…", and confirm the route with a name |
| Live run on the other five hosts | RUN-04 | The CLIs are absent on this machine | Milestone UAT; `UNKNOWN - verify` until then (R-41-05, accepted to the milestone UAT on 2026-11-10) |

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

**Approval:** automated audit passed at `d5ab6f80`; rows for plans 41-17 and 41-18 added and their commands passed at `86947a1e` (full suite: 22 failed, all 21 baseline names plus the root-disk `TMPDIR` false failure in `scripts/capture-live.test.ts`, which passed 77 of 77 alone). Rows for plans 41-19 to 41-24 added on 2026-11-12: the full suite at `25e466bd` ended 21 failed, 11,699 passed, every failed name in § Known baseline reds; the text pins and the new context-io cases re-ran green at `351dad64`. Rows for plans 41-07 to 41-12 and 41-25 added at `e50e5ce8`, 2026-11-12: build and typecheck passed, 28 test files ran with 2 failed and 2,844 passed, and both failed names are in § Known baseline reds. `context-io.test.ts` and `check-foundation-guards.test.ts` ended 8 failed and 1,094 passed, every failed name in § Known baseline reds. All 22 gate and freshness scripts the tasks name exited 0. Rows for plan 41-26 added at `99cc670f`, 2026-11-12: build and typecheck passed, the five pinned test files ran 557 of 557 green, and the 11 gate and freshness scripts the tasks name exited 0; the full suite ended 21 failed, 11,729 passed, every failed name in § Known baseline reds. The Manual-Only rows not marked Resolved still wait on a named human.

## Validation Audit 2026-11-05

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

## Validation Audit 2026-11-06

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows added for plans 41-13 to 41-16 | 10 |

## Validation Audit 2026-11-07

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows added for plans 41-17 and 41-18 | 6 |

## Validation Audit 2026-11-12

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows added for plans 41-19 to 41-24 | 15 |
| Manual-only rows added | 3 |

## Validation Audit 2026-11-12

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows added for plans 41-07 to 41-12 and 41-25 | 17 |
| Manual-only rows resolved | 3 |
| Manual-only rows added | 2 |

## Validation Audit 2026-11-12

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows added for plan 41-26 | 3 |
