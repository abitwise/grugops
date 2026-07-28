---
phase: 13
slug: frontend-ui-persona-design-build-workflow
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-11
---

# Phase 13 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all three PLANs carried a `<threat_model>` block); each mitigation was verified mechanically (guard runs + greps), not taken from the executor's self-report.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| role activation → host agent | The new 17th role (`frontend-ui.md`) must not grant a spawn tool; single-window sequential role-load is the portability + accountability invariant (CLAUDE.md hard safety constraint) | Role authority / tool-grant surface |
| guard pass-string → reviewer trust | A guard that can only pass is a fabricated gate; the fail-proof harness must still catch real violations for the 17th role | Gate verdict integrity |
| workflow → role activation | Workflow 14's `## Agents involved` must reference `_role-switch-protocol.md` (no-spawn) and inline no activation/spawn step | Activation control flow |
| a11y/safety prose → reviewer trust | The WCAG 2.2 AA / accessibility line is a clear-voice topic; a caveman-voice leak erodes the bar's credibility | Safety-topic readability (two-voice discipline) |
| hand-maintained counter → registry truth | The orchestrator's request-count literal, classification list, and workflow-map are hand-maintained; a missed counter leaves the registry lying about its own size | Registry self-description integrity |
| raised ceiling → guard credibility | Raising the orchestrator size ceiling must be off a real measured byte count, not a number picked to make the guard pass | Guard threshold honesty |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-13-01 | Elevation of Privilege | `frontend-ui.md` frontmatter/footer | mitigate | No `tools:`/`allowed-tools:` key; **zero** `Agent`/`Task` spawn tokens (verified by direct grep = 0); foundation guards GREEN over the tree incl. the new role. | closed |
| T-13-02 | Tampering / Repudiation | `check-foundation-guards.sh` (17th-role registration) | mitigate | Fail-proof harness `check-foundation-guards.test.sh` plants real violations and asserts each guard fails red; `GUARD_INPUTS` mirror keeps the harness honest for the new role. Harness ALL CHECKS PASSED. | closed |
| T-13-03 | Trust integrity (voice leak) | WCAG 2.2 AA / accessibility lines in `frontend-ui.md` | mitigate | Two-voice discipline — clear professional voice on the a11y/safety lines; `guard_voice` scans `frontend-ui.md` (now in `ROLE_FILES`) and passes with no caveman leak. | closed |
| T-13-04 | Elevation of Privilege | `14-ui-design-to-build.md` `## Agents involved` | mitigate | Workflow references `_role-switch-protocol.md` (single-window, no spawn); **zero** `Agent`/`Task` tokens; no tool grant anywhere. | closed |
| T-13-05 | Trust integrity (voice leak) | WCAG 2.2 AA step in workflow 14 | mitigate | Clear professional voice on the a11y bar; one named standard only. Workflows are not voice-lint-scanned, so review-enforced (VALIDATION manual-only row); inspection confirms clear voice. | closed |
| T-13-06 | Tampering (single-source drift) | references to workflows 04 / 05 in workflow 14 | mitigate | Reference-not-restate: `04-ticket-to-pr.md` + `05-pr-quality-gate.md` named by filename; gate step-labels (`install -> lint -> typecheck`) confirmed ABSENT — the loops are not paraphrased. | closed |
| T-13-07 | Tampering (registry drift) | `orchestrator.md` counters | mitigate | All four hand-maintained sites updated together; `ui-build` present; stale `all 15 request types` literal gone; count now reads `all 16 request types`. | closed |
| T-13-08 | Tampering (fabricated guard pass) | the raised `orchestrator.md` `role_ceiling` | mitigate | Ceiling set off a real `wc -c` of the post-wiring file (6759B within ceiling); fail-proof harness still plants a real oversize violation and asserts the size guard fails red. The raise cannot license a bloated rewrite. | closed |
| T-13-09 | Tampering (frozen-ordinal break) | the workflow-map table | mitigate | New row appends as `ui-build → \`14-ui-design-to-build.md\``; `| incident | \`13-incident.md\` |` row and the full 00–13 ordinal set verified byte-intact (Pitfall 6). | closed |
| T-13-SC | Tampering (supply chain) | npm / pip / cargo installs | accept | No package-manager installs in this phase — markdown authoring + read-only POSIX-sh guard edits only (CLAUDE.md hard constraint; RESEARCH "no Package Legitimacy Audit required"). No `[ASSUMED]`/`[SUS]`/`[SLOP]` packages exist to gate. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-13-SC | T-13-SC | Phase 13 adds **no** runtime/package dependencies. The work is markdown authoring (a role + a workflow) plus read-only POSIX-sh guard edits (grep/wc/awk/test — no writes, no network). There is no install surface to compromise, so a supply-chain control is not applicable. Re-evaluate only if a future phase introduces a package manager. | Olger Oeselg (project owner) | 2026-06-11 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-11 | 10 | 10 | 0 | /gsd-secure-phase (mechanical verification — foundation guards + fail-proof harness + targeted greps) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-11
