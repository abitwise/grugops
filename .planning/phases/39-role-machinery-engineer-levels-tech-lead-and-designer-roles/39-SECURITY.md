---
phase: "39"
slug: "role-machinery-engineer-levels-tech-lead-and-designer-roles"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-30"
---

# Phase 39 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (39-01..39-13 `<threat_model>` blocks; 39-11..39-13 are gap-closure round 1). ASVS L1: mitigations verified at grep depth against HEAD; no SUMMARY carried a `## Threat Flags` entry.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| role file frontmatter → adapter names | `levels` tokens from kit markdown become file names and YAML values in emitted adapters | kit markdown (repo-controlled) |
| role frontmatter → generated adapters | anything the generator copies into an adapter is loaded by Claude Code | adapter frontmatter |
| role frontmatter → Phase 42 doctor and docs | declared skill names will be read and shown to users | `skills:` tokens |
| `.grugops/factory.config.json` → model resolution | user-written `models.roles` / `models.effort.roles` keys select per-adapter pins | user config |
| Orchestrator spawn call → sub-agent | a per-invocation parameter outranks the adapter's pinned model | spawn parameters |
| failed engineer → next dispatch | what the next engineer knows about the failure | `failed-attempt` notes |
| escalation → human | where the kit hands control back to a person | gate verdicts |
| installer → host repo `.claude/agents/` | a re-install meets an adapter the current kit no longer ships | user files |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-39-01 | Tampering | kit-model `listAgentAdapterSpecs` | medium | mitigate | kebab tokens; duplicate / empty / collision refusals in `scripts/kit-model.ts` | closed |
| T-39-02 | Elevation of privilege | model-tiers `resolveAdapterAssignments` / `readModelsConfig` | medium | mitigate | `configKeyStems` derived key set in `scripts/model-tiers.ts`; unknown keys refused | closed |
| T-39-03 | Elevation of privilege | coordinator grant / KIT-03 | high | mitigate | KIT-03 pass line `N derived adapter names == N adapters == N grant-closure names` (`check-foundation-guards.js`) | closed |
| T-39-04 | Repudiation | model/effort guards, freshness gate | medium | mitigate | `zeroConfigAssignments` in `scripts/check-foundation-guards.ts` | closed |
| T-39-05 | Tampering | `guard_role_size` `ROLE_CEILINGS` | medium | mitigate | two-sided key check ("has no key for role" / "names no role file") | closed |
| T-39-06 | Repudiation | `adapter-byte-baseline.test.ts` | high | mitigate | pinned to `8a530552…`; RECORDED_ADDED / RECORDED_REMOVED literals | closed |
| T-39-07 | Tampering | generated adapters / `admit()` | high | mitigate | no adapter carries `skills:`; `unknown-key` refusal pinned in `canonical-frontmatter.test.ts` | closed |
| T-39-08 | Tampering | `admitRole` / `roleSkillsOf` | medium | mitigate | `scripts/canonical-frontmatter.ts` refusals; `guard_role_frontmatter` | closed |
| T-39-09 | Elevation of privilege | tech-lead.md capabilities | medium | mitigate | `capabilities: read edit shell`; no `Agent(` in `grugops-tech-lead.md` | closed |
| T-39-10 | Tampering | complexity-rubric.md junior gate | high | mitigate | rubric names test integrity, migration, concurrency, security; `BLOCKED` stop in software-engineer.md `## Levels` | closed |
| T-39-21 | Elevation of privilege | designer.md capabilities | medium | mitigate | `capabilities: read edit shell` (shell reaches the sanctioned writer per Workflow 16; never the admission token); no spawn grant in `grugops-designer.md`; see T-39-22 (plan 39-11) | closed |
| T-39-11 | Repudiation | level enforcement claims | medium | mitigate | factory.config.md names the override paths (incl. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`) and claims no enforcement; WF04 forbids `model`/`effort` on spawn | closed |
| T-39-12 | Spoofing | `.claude/agents/grugops-software-engineer.md` | high | mitigate | file absent at HEAD; KIT-03 red on any underived adapter | closed |
| T-39-13 | Information disclosure | `haiku` alias on cloud providers | low | accept | documented `UNKNOWN - verify` | closed |
| T-39-14 | Elevation of privilege | WF04 dispatch / orchestrator.md | medium | mitigate | WF04 named, non-fork spawn, no `model`/`effort` parameter | closed |
| T-39-15 | Denial of service | WF04 escalation | medium | mitigate | one escalation per ticket; `escalate_unadjudicable_result` to a named human | closed |
| T-39-16 | Repudiation | WF05 human stop | high | mitigate | `exhaust_self_fix_budget` kept on the gate-failure path in WF04 | closed |
| T-39-17 | Tampering | frontend-ui.md / WF14 contract step | low | mitigate | WF14 "Never name a new token."; WCAG 2.2 AA in frontend-ui.md | closed |
| T-39-18 | Spoofing | stale base adapter in host repos | high | mitigate | install / `--dry-run` / `--check` report "no longer ships" (exit 3 / FAIL) | closed |
| T-39-19 | Tampering | installer write path | high | mitigate | `git diff 8a530552 HEAD -- install/install.ts` adds no unlink / rm / rename call | closed |
| T-39-20 | Repudiation | install ledger | medium | mitigate | stale record carried forward; covered by `install/install.test.ts` "no longer ships" cases | closed |
| T-39-22 | Elevation of privilege | designer.md capabilities (supersedes T-39-21 wording) | medium | mitigate | `read edit shell` from the closed vocabulary; no spawn grant or MCP tool in `grugops-designer.md` (plan 39-11) | closed |
| T-39-23 | Spoofing | level adapter descriptions (auto-delegation) | medium | mitigate | each `grugops-software-engineer-{junior,mid,senior}.md` description says "never for unscored work"; pinned in `generate-role-adapters.ts` and `tier-kit-text.test.ts` (plan 39-11) | closed |
| T-39-24 | Repudiation | `adapter-byte-baseline.test.ts` level case | high | mitigate | dated WR-03 reason at `adapter-byte-baseline.test.ts:433`; exact byte compare kept (plan 39-11) | closed |
| T-39-25 | Repudiation | WF04 steps 15-16 (gate-exhausted re-enqueue) | high | mitigate | WF04 step 15 "stop until a named human confirms the move" before `Ready for Dev`; `exhaust_self_fix_budget` once in `## Stop conditions` (plan 39-12). Open review WR-15/WR-16 track the unrecorded confirmation and the ignored `notify`/`off` setting | closed |
| T-39-26 | Denial of service | WF04 / tech-lead.md escalation loop | medium | mitigate | one escalation plus one other move per ticket; used-up options go to a named human under `escalate_unadjudicable_result` (plan 39-12). Open review WR-13/WR-14 track counting gaps | closed |
| T-39-27 | Elevation of privilege | software-engineer.md junior stop rule | medium | mitigate | junior stops `BLOCKED` on every rubric risk tag (`software-engineer.md:37`) (plan 39-12) | closed |
| T-39-28 | Spoofing | orchestrator.md routing matrix | low | mitigate | `ready-ticket dev plan -> Tech Lead` (`orchestrator.md:46`) (plan 39-12) | closed |
| T-39-29 | Spoofing | unshipped `.claude/agents/grugops-*.md` with no ledger record | high | mitigate | `unrecordedStaleAdapters` / `unrecordedStaleAdapterText` in `install/install.ts`; `install.test.ts` cases (plan 39-13). Open review WR-11: with a malformed ledger, install refuses rather than printing the note; the refusal still blocks any silent write | closed |
| T-39-30 | Tampering | installer write path (presence note) | high | mitigate | report-only presence path; `unlinkSync|rmSync` count in `install/install.ts` is 16, as pinned (plan 39-13) | closed |
| T-39-31 | Repudiation | flattening facts in factory.config.md / install/README.md | low | mitigate | one list "What can flatten the levels at run time" in `factory.config.md:174`, README points to it (plan 39-13). Open review IN-09 notes `maxEffortLevel` missing | closed |
| T-39-32 | Repudiation | CHANGELOG.md `[Unreleased]` | low | mitigate | `[Unreleased]` carries Added / Changed / Fixed / Deprecated / Removed sections for Phase 39 (plan 39-13) | closed |
| T-39-SC | Tampering | npm/pip/cargo installs | low | accept | no package installed by any phase 39 plan | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-39-01 | T-39-13 | Effort support on Haiku 4.5 via cloud provider aliases is unverified; documented as `UNKNOWN - verify` rather than claimed | plan 39-07 threat model | 2026-10-29 |
| AR-39-02 | T-39-SC | No package is installed by this phase, so there is no supply-chain surface | plans 39-01..39-10 threat models | 2026-10-29 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-30 | 22 | 22 | 0 | secure-phase (orchestrator, ASVS L1 grep-depth) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-30

## Security Audit 2026-10-30

| Metric | Count |
|---|---|
| Threats found | 33 |
| Closed | 33 |
| Open | 0 |
