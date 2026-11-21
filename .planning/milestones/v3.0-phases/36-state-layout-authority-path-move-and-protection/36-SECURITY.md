---
phase: "36"
slug: "state-layout-authority-path-move-and-protection"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-21"
---

# Phase 36 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| install ledger to removal paths | a recorded entry (possibly forged or stale) names a path that prune or uninstall acts on | user state paths (high: user data loss) |
| working tree to scan core | tracked file bytes, including binary files and unusual encodings, are read and counted | repo file bytes (low) |
| test process to the developer's real kit home | an installer run inside a test could write ~/.grugops | kit home files (medium) |
| kit seed tree to a host repository | the seed decides which state paths a fresh install creates | seeded state files (medium) |
| installer output to a user | printed remedies and section pointers are what a user acts on | messages (low) |
| test expectations to the code under test | an expectation derived from the code can stop discriminating | test verdicts (medium) |
| repository history to the moved state | the dogfood move must keep every byte and its history | grugops's own state (medium) |
| tooling to the real repository root | a render run with its default root writes into the repository | rendered files (low) |
| kit text to an agent session / unmigrated host repo | role, workflow and adapter text is what an agent obeys | agent instructions (high) |
| claim registry to its anchors | the registry asserts byte-identical text at each anchor | audit claims (medium) |
| target filesystem to the layout probe | the user's tree (links, unreadable dirs, regular files) decides refuse, skip, note or proceed | user state (high) |
| tracked tree / allow-list to the gate verdict | the gate's green is the proof no old spelling remains | gate verdict (medium) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-36-01 | Tampering | isPruneProtected / isProtected | high | mitigate | both loop over imported `STATE_ROOTS` (install.ts, uninstall.ts); verifier reproduced sha-identical `memory-bank/` across uninstall | closed |
| T-36-02 | Tampering | second hand-typed protected list | medium | mitigate | `STATE_ROOT_COUNT` pinned in install tests; AST refusal per 36-01 | closed |
| T-36-03 | Repudiation | state-path-scan under-reporting | medium | mitigate | latin1 reads in scripts/state-path-scan.ts; three spellings from constants | closed |
| T-36-04 | Tampering | test installs overwriting the real kit home | high | mitigate | install tests set `GRUGOPS_HOME` (installer-prune.test.ts and helpers) | closed |
| T-36-05 | Tampering | seed move dropping a state path | medium | mitigate | `WRITE_PATH_COUNT` re-derived; fresh scratch install seeds every memory-bank/plans/ path (verifier + UAT run) | closed |
| T-36-06 | Repudiation | doctor on the wrong board path | low | mitigate | doctor reads `BOARD_REL` (install.ts) | closed |
| T-36-07 | Repudiation | board tests deriving from FIXED_SUBPATHS | medium | mitigate | board-tracer.test.ts compares against the independent `BOARD_REL` authority | closed |
| T-36-08 | Tampering | dogfood state move | medium | mitigate | memory-bank/plans/board.md present, no top-level plans/; validator ALL CHECKS PASSED (verification truth 5) | closed |
| T-36-09 | Repudiation | re-sealed fixture notes | medium | mitigate | seals recomputed and checked with sealVerdict, quoted in 36-07-SUMMARY.md | closed |
| T-36-10 | Repudiation | validator passing on state it no longer reads | high | mitigate | validate-agent-factory.ts imports the state-layout constants; validator run on the moved repo passes | closed |
| T-36-11 | Tampering | load-bearing role/workflow sentence reworded | high | mitigate | substitution-only edits; orchestrator.md names memory-bank/plans; foundation guards exit 0 (verification truth 5) | closed |
| T-36-12 | Repudiation | claim registry C-28-033 stale | medium | mitigate | docs/audit/28-claim-registry.md names memory-bank/plans; check-claim-anchors exit 0 | closed |
| T-36-13 | Tampering | fallback clause drifting between carriers | high | mitigate | one `LEGACY_FALLBACK_CLAUSE` constant; exact-inclusion test in kit-model.test.ts; behavior confirmed live in UAT test 1 | closed |
| T-36-14 | Repudiation | adapter byte baseline re-pinned to hide drift | medium | mitigate | adapter-byte-baseline test asserts the pin unchanged | closed |
| T-36-15 | Elevation of Privilege | INVARIANT losing the "STOP — do not hunt" marker | medium | mitigate | marker present in .claude/agents/grugops-orchestrator.md; check-kit-refs in verify | closed |
| T-36-16 | Tampering | plain install seeding beside a pre-v3 board | high | mitigate | refusal before any write; snapshotTree in pre-v3-layout.test.ts; reproduced in UAT scratch run (exit 1, nothing written) | closed |
| T-36-17 | Tampering | --migrate seeding memory-bank/plans/ beside a pre-v3 board | high | mitigate | seedState skips STATE_ROOT_REL on pre-v3/unreadable layouts; pre-v3-layout.test.ts case (e) | closed |
| T-36-18 | Tampering | EACCES/ELOOP board path read as absent | high | mitigate | only ENOENT/ENOTDIR absent; chmod 000 case in pre-v3-layout.test.ts | closed |
| T-36-19 | Repudiation | doctor misreporting a pre-v3 repo | medium | mitigate | `state layout: pre-v3` WARN, never FAIL; reproduced in UAT scratch run | closed |
| T-36-20 | Repudiation | check-state-paths false green | high | mitigate | dead-entry converse control in check-state-paths.test.ts, derived counts, latin1, three spellings. Listed mitigations present; code-review WR-01 (end-of-path / `_plans` forms) and WR-02 (vacuous pass from a subdirectory) are open hardening warnings outside the listed mitigation | closed |
| T-36-21 | Repudiation | gate reachability | medium | mitigate | `check:state-paths` in package.json and check-state-paths in ci.yml | closed |
| T-36-22 | Denial of Service | git failure / empty scan read as pass | medium | mitigate | exit 2 with a named reason in scripts/check-state-paths.ts | closed |
| T-36-23 | Repudiation | --migrate handoffs messages changing wording | medium | mitigate | messages templated from `LEGACY_HANDOFFS_REL` in install.ts; MIGR-04 cases run | closed |
| T-36-24 | Repudiation | handoffs-backup helper reading unreadable as absent | low | mitigate | only ENOENT/ENOTDIR absent in closing-claims.test.ts | closed |
| T-36-25 | Tampering | production board module edited in a test-only plan | medium | mitigate | empty START..HEAD diff over board-read/model/dashboard quoted in 36-05-SUMMARY.md | closed |
| T-36-26 | Repudiation | conflict-message expectations derived from the table | medium | mitigate | golden snapshot pins message bytes (board-model tests) | closed |
| T-36-27 | Tampering | trace-render default root re-creating top-level plans/ | low | mitigate | DEFAULT_PLANS_ROOT joins `STATE_ROOT_REL` in scripts/trace-render.ts; no top-level plans/ in repo | closed |
| T-36-28 | Repudiation | install/README.md section pointers broken | medium | mitigate | install/message-references.test.ts present and run | closed |
| T-36-SC | Tampering | npm/pip/cargo installs | low | accept | this phase installs no package | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-36-01 | T-36-SC | The phase installs no package (36-RESEARCH.md § Package Legitimacy Audit: not applicable) | plan-time register | 2026-10-21 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-21 | 29 | 29 | 0 | /gsd-secure-phase 36 (orchestrator, L1 grep-depth; plan-time register, auditor not spawned per ASVS 1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-21
