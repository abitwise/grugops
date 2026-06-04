---
phase: 6
slug: validation-brand-dogfood
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-04
---

# Phase 6 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 5 PLANs carried a `<threat_model>` block); mitigations verified against the implementation by gsd-security-auditor.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| sample-repo files → validator | Validator reads untrusted markdown/JSON from an arbitrary (dogfood) tree via `VALIDATE_ROOT`; content is data, never executed | Untrusted file content (read-only) |
| filesystem ← validator | Validator is read-only by construction; never writes/deletes, never builds a write path from file content | None (no write path) |
| brand art → public distribution | SVGs ship publicly; the risk surface is legal/IP resemblance, not executable code | Static SVG/XML |
| public docs → users | README/NOTICE/CONTRIBUTING/FAQ are read by users; risk surface is legal accuracy + command-surface integrity | Legal/brand prose, command strings |
| illustrative examples → readers | Readers could mistake "expected" output for a real capture; risk surface is honesty/repudiation | Narrated (non-real) example text |
| dogfood sample repo → grugops kit | Kit runs against an external throwaway repo; sample data is discarded, never committed here | Throwaway sample app + its deps |
| executor → live-CC-session actions | Marketplace install, plugin-cache resolution, hook firing, sub-agent spawn cannot be honestly self-driven; they cross into the human-runbook boundary | Pending-human verification items |
| dogfood → production | `autonomy=pr`; no real deploy; SAFE-02 guard stays mechanical | Deploy intent (blocked at boundary) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-06-01 | DoS | validator `JSON.parse` (factory.config.json / plugin.json) | mitigate | `safeRead` + every `JSON.parse` in try/catch → ERROR finding, never an unhandled throw (`scripts/validate-agent-factory.mjs:39-45,241-246,315-329`) | closed |
| T-06-02 | Tampering | validator file access under resolved ROOT | mitigate | Read-only by construction; no write/delete APIs; all paths `join(ROOT, fixed-literal rel)`, ROOT resolved once; no write path derived from content | closed |
| T-06-03 | Input Validation | untrusted markdown/JSON read from a sample repo | mitigate | No `eval`/`new Function`/`child_process`/dynamic import; front-matter regex-extracted (`:255-262`); content used only as data | closed |
| T-06-IP | Legal/IP (not STRIDE) | `brand/*.svg` art | mitigate | All 5 SVGs hand-authored geometric XML, `aria-label="grugops"`, lowercase wordmark; abstract club-on-stone, no figurative/character resemblance | closed |
| T-06-PAL | Tampering (brand integrity) | off-palette color drift | mitigate | Every `fill`/`stroke` is one of the four locked hex (`#2C2A28`, `#F3ECE0`, `#6B6B6B`, `#C8642D`); off-palette grep returns nothing | closed |
| T-06-LEG | Legal (not STRIDE) | NOTICE / CONTRIBUTING non-affiliation prose | mitigate | grugbrain.dev / Carson Gross attribution + non-affiliation disclaimer present verbatim (`NOTICE:4-8`, `README.md:44-51`) | closed |
| T-06-CMD | Repudiation (brand/safety integrity) | literal `/grug` leaking into collateral | mitigate | `grep -rnE '/grug([^o]|$)' … | grep -v '://grugbrain'` → empty; only `/grugops` surface, sole `/grug` substring is the grugbrain.dev URL | closed |
| T-06-OW | Tampering | overwrite of frozen `agent-factory/README.md` | mitigate | `git status --porcelain agent-factory/README.md` empty; root `README.md:40` links to it, never duplicates | closed |
| T-06-FAB | Repudiation (audit-trail integrity) | illustrative example mislabeled as real | mitigate | Exact banner `> Illustrative run — expected output, not a captured session` at line 3 of examples 02/04/05 | closed |
| T-06-DRIFT | Tampering (single-source drift) | inventing flow steps / handoff names / metrics | mitigate | Cited handoffs (`security-nfr/implementation/qe/release-handoff.md`) exist under `agent-factory/handoffs/`; metric names exist in `plans/metrics.md:17-25` | closed |
| T-06-FAB2 | Repudiation (the whole value prop) | fabricated "REAL RUN" / invented PR link / simulated install or hook firing | mitigate | REAL examples carry `> Real run` banner; PR link honest `<none — no remote…>` (`examples/03:138`); live-CC items `pending human`, "not simulated" (`runbook:11`) | closed |
| T-06-V14 | Elevation / Tampering | dogfood accidentally performing a real prod deploy | mitigate | Runbook: `autonomy=pr`, "Do NOT set GRUGOPS_PROD_DEPLOY_APPROVED", "Do NOT run a real deploy"; `hooks/guard.mjs:112-130` fail-closed deny; `factory.config.json:5,45` `autonomy:"pr"` + `production_requires_human_confirmation:true` | closed |
| T-06-POLLUTE | Tampering | sample app created inside the repo, polluting the frozen tree | mitigate | `git status --porcelain` clean; no `grugops-dogfood-*`/`node_modules`/sample-app tracked; `agent-factory/` clean | closed |
| T-06-SC | Supply-chain (Tampering) | npm/pip/cargo installs | accept (02/03/04) · mitigate-by-zero-packages (01/05) | No root `package.json`; no tracked `package.json`/`node_modules`; validator imports only `node:fs/node:path/node:url`; guard imports only `node:fs` | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-SC | T-06-SC | Zero external packages by design (no root `package.json`, stdlib-only validator/guard). The throwaway dogfood sample's own deps install OUT-OF-REPO only and are out of grugops's scope, gated by the PR-only human runbook. Accepted in plans 06-02/03/04; mitigated-by-zero in 06-01/05. | Olger Oeselg | 2026-06-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-04 | 14 | 14 | 0 | gsd-security-auditor (opus) via /gsd-secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-04
