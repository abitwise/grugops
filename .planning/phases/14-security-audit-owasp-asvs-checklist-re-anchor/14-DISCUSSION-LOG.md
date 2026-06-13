# Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 14-security-audit-owasp-asvs-checklist-re-anchor
**Areas discussed:** Checklist generation, Checklist scope & fate, Workflow 15 shape, Voice guard scope, Severity assignment

---

## Checklist generation (SEC-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Vendor source + generator | Commit pinned ASVS 5.0.0 source + stdlib-Node generator + generated checklist with provenance header. Reproducible, auditable. | ✓ |
| One-shot, output only | Commit only the generated markdown with provenance header; no committed source/generator. Lighter but not reproducible in-repo. | |
| Build-time fetch | Generator fetches source from pinned URL/sha at generate time. Network dependency, conflicts with boring-on-purpose ethic. | |

**User's choice:** Vendor source + generator
**Notes:** Makes the "not hand-transcribed" claim provable (source + generator in-repo). Generator follows the existing `validate-agent-factory.mjs` stdlib-Node pattern; TS held.

---

## Checklist scope & fate (SEC-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Replace in place, full + dial-filtered | Re-anchor `security-nfr-checklist.md` in place: full ASVS 5.0 set, all items tagged L1/L2/L3 + IDs; `asvs_level` filters the active tier at read time. Single source of truth. | ✓ |
| New file, keep 10-bullet | New `asvs-checklist.md` for deep audit; keep the lean 10-bullet for the per-ticket check. Two checklists. | |
| Only configured level | Generate only requirements at/below the configured level; dial change forces regeneration. | |

**User's choice:** Replace in place, full + dial-filtered
**Notes:** Reconciled with the workflow-15 decision — at L1 (lean default) the active subset is the per-ticket check; workflow 15 walks the same file at the full configured level. One checklist, two depths.

---

## Workflow 15 shape & block_on wiring (SEC-01, SEC-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone audit, gate enforces | Workflow 15 = standalone deep audit (new `security-audit` classification, run by Security/NFR role), distinct from the per-ticket check. Emits severity-tagged findings; `block_on` read at `05-pr-quality-gate.md`. Audit produces, gate enforces. | ✓ |
| Audit absorbs per-ticket check | Workflow 15 replaces the per-ticket check; full ASVS audit on every ticket. Heaviest, least lean. | |
| Workflow 15 self-blocks | Workflow 15 reads `block_on` and blocks directly; splits enforcement from the single visible gate (tension with D-12). | |

**User's choice:** Standalone audit, gate enforces
**Notes:** Keeps per-ticket lean and enforcement at the one visible gate (consistent with D-12 "gate is 05"). Workflow 15 references the gate by filename, mirroring `14-ui-design-to-build.md`.

---

## Voice guard scope (SEC-03)

| Option | Description | Selected |
|--------|-------------|----------|
| 15 + checklist + role + handoff | Extend the `check-foundation-guards.sh` voice-discipline guard to workflow 15, the re-anchored checklist, the role body, and the handoff template; carve out the role's fenced Caveman prompt block. | ✓ |
| 15 + checklist only | Lint only the two new/rewritten artifacts; leave role + handoff as-is. | |
| Human review only | No guard extension; clear voice verified by human only. Doesn't satisfy SEC-03 "guard passes". | |

**User's choice:** 15 + checklist + role + handoff
**Notes:** Full mechanical proof for SEC-03. Caveman-fence carve-out preserves the voice split (prompt stays caveman; findings are clear voice).

---

## Severity assignment (SEC-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Default from level + named override | Default L1→high, L2→medium, L3→low; auditor MAY override per finding with a stated reason + named owner (reuses the role's accepted-risk-owner rule). | ✓ |
| Pure auto-derive from level | Severity strictly = ASVS level, no override. Fully mechanical but blunt. | |
| Auditor-assigned rubric | Severity assigned per finding via impact×exploitability rubric, independent of level. Most accurate, weaker mechanical predictability. | |

**User's choice:** Default from level + named override
**Notes:** Mechanical default keeps `block_on` predictable; the override is the honest edge-case escape hatch. Inverted-from-intuition mapping (L1 fail = highest severity) is intentional.

---

## Claude's Discretion

- Exact filename/heading layout of `15-security-audit.md` and the generator's output formatting.
- Whether the pinned ASVS source is committed as CSV or JSON (research picks based on what the official OWASP repo ships cleanly).

## Deferred Ideas

None — discussion stayed within phase scope. (Gate-convergence mechanics → Phase 15; browsable docs generation → Phase 17; install migrate/update → Phase 16.)
