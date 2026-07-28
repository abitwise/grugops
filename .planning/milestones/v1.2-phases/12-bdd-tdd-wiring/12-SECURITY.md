---
phase: 12
slug: bdd-tdd-wiring
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-11
---

# Phase 12 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 5 PLAN files carried a `<threat_model>` block); this audit verifies each mitigation is present in the implementation. The substantive application-security ASVS audit is deferred to Phase 14 (no code / input / auth / data / network surface is introduced by this phase).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| trace-integrity boundary | The test-first evidence fields (inner-loop in implementation-handoff, outer-loop in qe-handoff) are where an agent could fabricate a red/green that never ran. grugops's core value — "the trace is the proof" — crosses here. This is the phase's one safety-relevant control. | Test-execution evidence (red/green claims feeding the requirement→test→release trace) |
| (none else introduced) | All other Phase 12 work edits markdown handoff templates, checklists, workflows, and role prompts in a no-runtime kit. No executable code, input handling, auth/crypto/data/network surface is added. | n/a |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-12-01-DG | Repudiation | `## Acceptance scenarios` handoff block | mitigate | "Executable-or-absent" rule + declarative no-selectors rule present in `agent-factory/handoffs/qe-handoff.md:33` and `product-handoff.md:40`. Mechanical dead-Gherkin detection deferred to the Phase 15 test-integrity gate (documented). | closed |
| T-12-02-DG | Repudiation | example-mapping hub scenarios + seam example | mitigate | Declarative no-selectors rule + discovery-first intent present in `agent-factory/checklists/example-mapping.md` and workflow 07; one-behavior-one-layer seam drawn. Mechanical no-duplication / dead-Gherkin enforcement deferred to Phase 15 (documented). | closed |
| T-12-03-DUP | Repudiation | workflow 04 TDD step + seam rule | mitigate | Contract-vs-logic seam (D-09) present in `agent-factory/workflows/04-ticket-to-pr.md:27` (unit layer never re-asserts the acceptance scenario's observable outcome). Mechanical one-behavior-one-layer enforcement explicitly deferred to the Phase 15 gate (workflow 04:28). | closed |
| T-12-04-FAB | Repudiation / Tampering | test-first evidence field (impl + QE handoffs) | mitigate | No-fabrication floor (D-10) present in both `implementation-handoff.md:38-39` and `qe-handoff.md:54-55`: a step not run is marked `UNKNOWN - verify`; "Never record a red or a green that did not actually happen." Mechanical detection of fabricated evidence deferred to Phase 15. | closed |
| T-12-04-VOICE | Information disclosure (clarity erosion) | no-fabrication floor sentence | mitigate | Floor sentences written in clear professional voice; `guard_voice` GREEN (no caveman markers in handoff prose). Verified by `sh scripts/check-foundation-guards.sh` exit 0 on 2026-06-11. | closed |
| T-12-05-VOICE | Information disclosure (clarity erosion) | new role-prompt lines | mitigate | `guard_voice` (no caveman markers outside the fenced block) and `guard_caveman_preserved` (all 16 roles keep a non-empty caveman block) both GREEN. Verified by foundation-guards run exit 0 on 2026-06-11. | closed |
| T-12-05-BLOAT | kit-integrity | software-engineer.md / qe-e2e.md byte ceiling | mitigate | `guard_role_size` GREEN (no FAIL — software-engineer.md 3295B, qe-e2e.md 3220B within per-file ceilings; both show advisory WARN "approaching ceiling" only). Terse pointer lines hold single-source; loop sequence lives in workflow 04, worked example in example-mapping.md. | closed |
| T-12-05-AGENTSFAB | Repudiation | AGENTS.md acceptance slot | mitigate | `AGENTS.md:54-56` `### Acceptance` slot value is `Acceptance / BDD scenarios: UNKNOWN - verify`; host runner names confined to a trailing HTML comment as non-binding examples, never a hard command. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks. All threats were verified mitigated against the implementation.

> Note (not an accepted risk, by design): the **mechanical** enforcement of the dead-Gherkin / no-duplication / fabricated-evidence threats (T-12-01-DG, T-12-02-DG, T-12-03-DUP, T-12-04-FAB) is deferred to the **Phase 15 test-integrity gate**, per the plan-time disposition. Phase 12's scope was to land the followable rule and make each artifact honest by construction; the mitigations above are the rules, present and verified. The gate that detects violations mechanically is a separate, planned phase — not an open threat for Phase 12.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-11 | 8 | 8 | 0 | /gsd-secure-phase (register authored at plan time; mitigations verified inline) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-11
