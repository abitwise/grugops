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
| T-40-02 | Elevation of privilege | stand-in arm in check-diff-disposition.ts | high | mitigate | Admits only agent-factory/roles/ clauses from structuralSections or no-row; registry anchors and positive literals bypass it; missing key value, missing script, spawn error or non-zero exit fails every role clause; five permanent cases from both sides | closed |
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
| T-40-13 | Tampering | uat-planner.md sign-off | high | mitigate | The named-human sign-off and no-fabrication sentences are inventory facts or pinned meaning reviewed against the baseline (D-28); UAT Planner never claims `In UAT → Done` | closed |
| T-40-14 | Tampering | security-nfr.md, compliance-officer.md | high | mitigate | `BLOCKED`, no-fabrication and `UNKNOWN - verify` are inventory facts check-role-rules keeps; the named-owner rule is an acceptance grep; moved severity mapping is referenced by path | closed |
| T-40-15 | Elevation of privilege | release-manager.md deploy rule | high | mitigate | Named-human deploy approval kept and grep-checked; never deploy production yourself kept in `## Hard limits`; git-host protection stays the hard floor (CLAUDE.md) | closed |
| T-40-16 | Tampering | installer.md safety rules | high | mitigate | Additive, never-overwrite, dry-run and stop-and-ask rules grep-checked in acceptance; no-fabrication and `UNKNOWN - verify` are inventory facts | closed |
| T-40-17 | Tampering | agents-md-scribe.md | medium | mitigate | The coding-rules fact is kept through the byte-identical One job sentence; the minimal-AGENTS.md rule is stated; the stale count is deleted rather than re-typed | closed |
| T-40-18 | Elevation of privilege | orchestrator.md coordinator limits | high | mitigate | Width cap, claim cap, no relay, only-spawner and merge/deploy-with-humans kept in `## Hard limits`; inventory facts kept; D-36 adds no-fabrication and `UNKNOWN - verify`; the moved platform detail stays referenced by path | closed |
| T-40-19 | Tampering | orchestrator.md kit-vs-state clause | medium | mitigate | LEGACY_FALLBACK_CLAUSE kept byte-exact; `node scripts/check-state-paths.js` in verify | closed |
| T-40-20 | Tampering | _role-switch-protocol.md invariant | medium | mitigate | The announce/exit lines and the Workflow 16/17 references are inventory facts; the invariant sentence is checked at review against the baseline (D-28) | closed |
| T-40-21 | Elevation of privilege | BOARD_MOVE_EXCEPTIONS | medium | mitigate | Exactly the four D-33 entries, two-sided (a stale entry is red, an unlisted off-table claim is red), one test per entry, additions need a recorded human decision | closed |
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
  - T-40-08, T-40-10, T-40-13, T-40-14, T-40-15, T-40-16 and T-40-18: the safety and fact tokens are present in each role. UAT Planner claims no `In UAT → Done`, and Release Manager says "Never deploy to production yourself."
  - `check-role-rules --check`, `check-state-paths` and `check:claim-anchors` all exit 0.
- **Medium and low mitigations:** the passing Nyquist commands in 40-VALIDATION.md cover them: partition, stand-in, corpus total, ROLE_CEILINGS, NOTICE, lean lens, lexicon and the validator fixtures.
- **Summary threat flags:** none were raised in any 40-0x-SUMMARY.md.

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
