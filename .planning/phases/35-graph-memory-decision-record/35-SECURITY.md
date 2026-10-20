---
phase: "35"
slug: "graph-memory-decision-record"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-20"
---

# Phase 35 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| research files to decision record | vendor-sourced figures and LOW-confidence facts in .planning/research/ cross into a grugops record | tool facts and confidence labels (public, low sensitivity) |
| third-party tool output to shared context | derived, unverified output from a user-installed tool could reach the shared context | graph-tool output (unverified) |
| phase scope to shipped kit | a docs-only phase could write outside .planning/ | repo files outside .planning/ |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-35-01 | Tampering | shared-context admission policy (35-DECISION.md stamp rule) | high | mitigate | 35-DECISION.md:48 states the `verified_by` stamp rule and that tool output itself never enters the shared context | closed |
| T-35-02 | Repudiation | 35-DECISION.md and the [v3.0, D-10] row | high | mitigate | no saving figure in the record (grep for percent/multiplier figures returns nothing); verifier read record and row in full; UAT test 2 passed (no saving claim) | closed |
| T-35-03 | Repudiation | tool-fact confidence labels (D-08) | medium | mitigate | 35-DECISION.md:17,23-25 keep `LOW` and `UNKNOWN - verify` on the rows STACK.md puts them; UAT test 2 passed (no label upgrade) | closed |
| T-35-04 | Tampering | files outside .planning/ | medium | mitigate | `git diff --name-only 4f282a25..HEAD -- . ':(exclude).planning/'` prints nothing | closed |
| T-35-05 | Tampering | PROJECT.md and STATE.md readers (WR-05 beat oracle) | low | mitigate | `node scripts/check-uat-oracles.js` exits 0; STATE.md longest line 2524 (unchanged) | closed |
| T-35-06 | Information disclosure | a user-installed graph tool sending docs to a model or writing a query log | low | accept | facts in the Graphify row (35-DECISION.md:21) and the posture sentence (35-DECISION.md:44); grugops installs nothing | closed |
| T-35-SC | Tampering | npm/pip/cargo installs | low | accept | no package installed; no install instruction in the record (grep for npm/pip/cargo install returns nothing) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-35-01 | T-35-06 | Installing and running a graph tool is the user's own choice; grugops installs nothing and records the tool's data flows in the decision record | plan disposition (35-01-PLAN.md threat model) | 2026-10-20 |
| AR-35-02 | T-35-SC | The phase installs no package and the record tells no one to install a tool on grugops's behalf | plan disposition (35-01-PLAN.md threat model) | 2026-10-20 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-20 | 7 | 7 | 0 | /gsd-secure-phase orchestrator (ASVS L1 grep depth; auditor skipped by short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-20
