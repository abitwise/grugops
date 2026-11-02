---
phase: "40"
slug: "plain-language-role-rewrite"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-01"
---

# Phase 40 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| role text → diff-disposition gate | the stand-in decides whether changed role clauses need rows | role markdown (public kit text) |
| 00-base.md value → spawned process | a repo file names a script the gate executes | script path (repo-controlled; regex-restricted, argv exec, no shell) |
| admission hook closure → check-diff-disposition.js | the hook loads this module through checkpoints.ts | module code (frozen manifest, freshness-checked) |
| committed baseline → every later plan | the oracle for lost rules | role-rule inventory JSON |
| orchestrator.md → every spawned role | the coordinator's limits bound the whole factory | coordinator rules (merge/deploy stay human) |
| protocol → non-spawning hosts | the only activation path on five hosts | role-switch instructions |
| role board moves → partition guard | the guard decides whether ownership is a partition | board-move code spans |
| fixtures → validator tests | bad fixtures prove the validator catches one defect each | fixture markdown |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-40-01 | Tampering | docs/audit/40-role-rule-inventory.json | high | mitigate | Written only by `--write-baseline`; a test re-derives the facts from git objects at the recorded source_commit and asserts deep equality; check mode never writes | closed |
| T-40-02 | Elevation of privilege | stand-in arm in check-diff-disposition.ts | high | mitigate | Admits only agent-factory/roles/ clauses from structuralSections or no-row; registry anchors and positive literals bypass it; missing key value, missing script, spawn error or non-zero exit fails every role clause. The stand-in is pinned to `scripts/check-role-rules.js` (ROLE_STANDIN_SCRIPT): a substitute canonical script or a second `role_standin` line is refused before anything is spawned (plan 40-12, IN-04), and role `## Stop when` is frozen like `## Hard limits` (plan 40-12, WR-04) | closed |
| T-40-03 | Repudiation | 00-base.md base move | high | mitigate | Decision record names old and new SHA, the per-kind breakdown and a reproduce command; uat test, README and CI comment amended in the same commit citing D-30 | closed |
| T-40-04 | Tampering | admission hook frozen manifest | high | mitigate | `npm run generate:hook-manifest` after the last edit to check-diff-disposition; freshness:hook-manifest in verify; the spawn lives in main(), never at module load | closed |
| T-40-05 | Tampering | role_standin value | medium | mitigate | Canonical regex restricted to `scripts/[a-z0-9-]+.js`; execFileSync argv array with no shell; resolved under ROOT; a non-matching value is a named refusal | closed |
| T-40-06 | Repudiation | inverted guard_caveman_voice | medium | mitigate | Run red on the unchanged tree first (recorded), permanent planted cases, independent denominator ROLE_COUNT + 1 through reportMeasured | closed |
| T-40-07 | Tampering | scripts/voice-model.ts | high | mitigate | Never edited; `git diff --quiet HEAD -- scripts/voice-model.ts scripts/voice-model.js` in every verify block | closed |
| T-40-08 | Tampering | agent-factory/roles/software-engineer.md | high | mitigate | check-role-rules keeps every baseline fact (no-fabrication, `UNKNOWN - verify`, `failed-attempt`, `BLOCKED`, junior exclusions, kit refs); tier-kit-text pins kept; human reads the file at the checkpoint for meaning (D-28) | closed |
| T-40-09 | Repudiation | NOTICE | medium | mitigate | Copyright line and permission notice copied byte-exact from the fetched LICENSE, or the copyright line marked `UNKNOWN - verify` per D-26; byte-copy test; banned-claims gate scans NOTICE | closed |
| T-40-10 | Tampering | agent-factory/roles/tech-lead.md stops | high | mitigate | The tier-kit-text phrase assertions follow the stops into `## Stop when` unchanged; check-role-rules keeps `failed-attempt`, no-fabrication and kit refs; D-36 adds `UNKNOWN - verify` | closed |
| T-40-11 | Tampering | lean lens | medium | mitigate | Advisory wording pinned by a tier-kit-text case; no-number assertion; the gate's blocking rules in Workflow 05 untouched | closed |
| T-40-12 | Tampering | ba-pm.md board moves | medium | mitigate | Pairs copied from the approved D-33 table; check-role-rules keeps each baseline from-column; plan 40-08's partition guard checks uniqueness and table coverage | closed |
| T-40-13 | Tampering | uat-planner.md sign-off | high | mitigate | The UAT Planner's named-human and self-sign rules are inventory facts, red on deletion (plan 40-11). Only the Orchestrator may claim `In UAT → Done`: partition rule 4 refuses it from the UAT Planner or any other role, and D33_NON_FORWARD_PAIRS admits it for orchestrator.md alone (plans 40-13, 40-14). The lean close needs the named human's sign-off and a human merge, pinned in tier-kit-text (plan 40-13) | closed |
| T-40-14 | Tampering | security-nfr.md, compliance-officer.md | high | mitigate | `BLOCKED`, no-fabrication and `UNKNOWN - verify` are inventory facts check-role-rules keeps; the named-owner rule is an acceptance grep; moved severity mapping is referenced by path | closed |
| T-40-15 | Elevation of privilege | release-manager.md deploy rule | high | mitigate | The Release Manager's no-deploy, named-human and production-human rules are inventory facts; deleting any one is red naming release-manager.md (plan 40-11). `## Hard limits` and `## Stop when` are frozen regions (plan 40-12). Git-host protection stays the hard floor (CLAUDE.md) | closed |
| T-40-16 | Tampering | installer.md safety rules | high | mitigate | The Installer's no-overwrite and dry-run rules are inventory facts; deleting either is red naming installer.md (plan 40-11). No-fabrication and `UNKNOWN - verify` are inventory facts | closed |
| T-40-17 | Tampering | agents-md-scribe.md | medium | mitigate | The coding-rules fact is kept through the byte-identical One job sentence; the minimal-AGENTS.md rule is stated; the stale count is deleted rather than re-typed | closed |
| T-40-18 | Elevation of privilege | orchestrator.md coordinator limits | high | mitigate | The Orchestrator's no-merge, no-deploy, no-relay, wip-limit, claim-cap and only-spawner rules are inventory facts, each red on deletion (plan 40-11). The shared-clone case shows check-diff-disposition red through the stand-in when the merge ban is deleted. D-36 adds no-fabrication and `UNKNOWN - verify`; the moved platform detail stays referenced by path | closed |
| T-40-19 | Tampering | orchestrator.md kit-vs-state clause | medium | mitigate | LEGACY_FALLBACK_CLAUSE kept byte-exact; `node scripts/check-state-paths.js` in verify | closed |
| T-40-20 | Tampering | _role-switch-protocol.md invariant | medium | mitigate | The announce/exit lines and the Workflow 16/17 references are inventory facts; the invariant sentence is checked at review against the baseline (D-28) | closed |
| T-40-21 | Elevation of privilege | BOARD_MOVE_EXCEPTIONS | medium | mitigate | BOARD_MOVE_EXCEPTIONS is still exactly the four D-33 Tech Lead entries, one test each and two-sided (rule 5: a stale entry is red; rule 4: an unlisted claim is red). The two approved non-forward pairs of the D-33 table are declared in D33_NON_FORWARD_PAIRS with the same two-sided tests. Rule 4 refuses a pair out of an owned column unless it targets the next flow column, a column outside the flow, or a declared pair (plan 40-14, WR-01). An addition to either list needs a recorded human decision | closed |
| T-40-22 | Tampering | fixture role files | medium | mitigate | Headings added only where absent; the INTENT table is unchanged and each bad fixture still fails for exactly its one reason | closed |
| T-40-23 | Tampering | baseline equality | medium | mitigate | End-state checks add no fact kind to the baseline derivation; the source_commit equality case stays in the suite | closed |
| T-40-24 | Tampering | ROLE_CORPUS_FAIL / ROLE_CEILINGS | medium | mitigate | FAIL fixed at the [v3.0, D-1] figure; ceilings follow one formula from measured bytes, checked by an acceptance script; the scan set is derived and asserted two-sided | closed |
| T-40-25 | Repudiation | moved test plants | low | mitigate | Each moved plant keeps its intent with a one-line reason and is listed in the SUMMARY; no case is deleted | closed |
| T-40-26 | Tampering | GOVERNED_CORPUS_COUNT and the lexicon | medium | mitigate | The roles part is derived and counted two-sided; exclusion removed rather than narrowed; lexicon additions only under D-32 and listed | closed |
| T-40-27 | Repudiation | C-28-003 status | medium | mitigate | Mechanism quotes live gate output; check-claim-anchors and audit-model tests in verify | closed |
| T-40-SC | Tampering | npm/pip/cargo installs (every plan) | low | accept | No package is installed by any plan in this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Evidence (L1, 2026-11-01, HEAD after 40-10):**
- **High-severity mitigations:** each one was found by a search-level check:
  - T-40-01: `--write-baseline` plus the source_commit equality test.
  - T-40-02 and T-40-05: the stand-in cases; the role_standin regex with `execFileSync` argv.
  - T-40-03: the base-move record names e8d7802 and 4d2b8f0.
  - T-40-04: `freshness:hook-manifest` passes.
  - T-40-07: voice-model.ts/.js are unchanged since e8d7802.
  - T-40-08, T-40-10 and T-40-14: check-role-rules keeps each role's baseline facts and exits 0. T-40-02, T-40-13, T-40-15, T-40-16, T-40-18 and T-40-21 are re-verified on red-on-deletion evidence below.
  - `check-role-rules --check`, `check-state-paths` and `check:claim-anchors` all exit 0.
- **Medium and low mitigations:** the passing Nyquist commands in 40-VALIDATION.md cover them: partition, stand-in, corpus total, ROLE_CEILINGS, NOTICE, lean lens, lexicon and the validator fixtures.
- **Summary threat flags:** none were raised in any 40-0x-SUMMARY.md.

**Gap-closure evidence (red-on-deletion), 2026-11-02, HEAD after plan 40-14 Task 2 (`fc32a90e`):** each command was run and its result read before it was written here.
- **T-40-02:** `npx vitest run scripts/check-diff-disposition.test.ts -t "WR-04|stand-in"` gave 13 passed. Among them: "refuses a canonical `role_standin` naming any script but scripts/check-role-rules.js (IN-04)", "refuses a second `role_standin` line by name (IN-04)", "makes every changed role clause a finding when the stand-in exits non-zero" and "with no key, a reworded `## Stop when` bullet is FROZEN by structuralSections even with a row". `node scripts/check-diff-disposition.js` exited 0 with ``roles `## Stop when` 19/19`` in the frozen set and `PASS  1137 role clause(s) admitted by the role-rule inventory stand-in (D-30)`.
- **T-40-13:** `npx vitest run scripts/check-role-rules.test.ts -t "lost fact|CR-01"` gave 11 passed, including "deleting the self-sign sentence is red naming uat-planner.md: lost fact self-sign". `npx vitest run scripts/check-role-rules.test.ts -t "partition|IN-02"` gave 27 passed, including "partition rule 4 (WR-01): `In UAT → Done` planted into uat-planner.md is red" and "partition rule 3 and rule 5: `In UAT → Done` removed from orchestrator.md is red". `npx vitest run scripts/tier-kit-text.test.ts -t "CR-02"` gave 10 passed, including "CR-02: the lean close needs the named human's sign-off, a human merge and the lean DoD". A one-off mirror probe that removed "named human" from uat-planner.md made `check-role-rules.js` exit 1 naming `uat-planner.md: lost fact named-human`.
- **T-40-15:** in the 11 passed above, "deleting the no-deploy sentence is red naming release-manager.md: lost fact no-deploy". The one-off mirror probe that removed "named human" and then "production action" from release-manager.md exited 1 each time, naming `lost fact named-human` and `lost fact production-human`.
- **T-40-16:** in the 11 passed above, "deleting the no-overwrite sentence is red naming installer.md: lost fact no-overwrite". The one-off mirror probe that removed "dry-run" from installer.md exited 1 naming `installer.md: lost fact dry-run`.
- **T-40-18:** in the 11 passed above, "deleting the Orchestrator's merge ban on a mirror is red naming orchestrator.md: lost fact no-merge", "end to end on a shared clone: the merge-ban deletion turns check-diff-disposition red through the stand-in" and "deleting the no-relay sentence is red naming orchestrator.md: lost fact no-relay". The one-off mirror probe that removed "never deploy", `queue.wip_limit`, `queue.claim_cap` and "only role that may spawn" from orchestrator.md exited 1 each time, naming `lost fact no-deploy`, `wip-limit`, `claim-cap` and `only-spawner`.
- **T-40-21:** in the 27 partition passes above: "partition exceptions: exactly the four D-33 Tech Lead entries, each with a reason", one "admitted for tech-lead.md, red when planted into designer.md" case per exception, "partition approved pairs: exactly the two non-forward pairs of the D-33 table approved at the 40-02 checkpoint", one "red when planted into designer.md" case per approved pair, and the five WR-01 planted red cases. `node scripts/check-role-rules.js` exited 0 with `INFO  board-move partition: 18 claimed pair(s) over 12 flow column(s), terminal Done, 4 declared exception(s), 2 approved non-forward pair(s)` and `PASS  board-move partition: 0 findings over 19/19 elements`.
- The one-off probe is a gate run, not a permanent test: it copied the gate's inputs into a temporary mirror, replaced one trigger phrase per run, and ran the committed `scripts/check-role-rules.js` with `CHECK_ROOT`. All eight runs exited 1 naming the role and the fact. The permanent tests above cover one deletion per safety family; the inventory check treats every baseline fact the same way.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-40-01 | T-40-SC | No plan in this phase installs a package; the only dev deps are the existing {typescript, vitest, @types/node} lockfile. The disposition was set at plan time. | plan-time disposition (40-01..40-10 threat models) | 2026-10-31 |

*Accepted risks do not resurface in future audit runs.*

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-01 (/gsd-secure-phase 40, ASVS L1, block_on high)

## Security Audit 2026-11-01

| Metric | Count |
|---|---|
| Threats found | 28 |
| Closed | 28 |
| Open | 0 |
