---
phase: 14
slug: security-audit-owasp-asvs-checklist-re-anchor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a markdown kit — there is no app test runner. "Tests" are the existing
> POSIX-sh guard harnesses + the stdlib-Node structure validator. Derived from
> `14-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX-sh assertion harnesses + stdlib-Node structure validator (zero-dep kit; no npm test runner) |
| **Config file** | none — scripts are self-contained, no `package.json` |
| **Quick run command** | `sh scripts/check-foundation-guards.sh` |
| **Full suite command** | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh && sh scripts/check-kit-refs.sh && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.mjs` |
| **Estimated runtime** | ~5 seconds (all guards + validator) |

---

## Sampling Rate

- **After every task commit:** Run `sh scripts/check-foundation-guards.sh` (the build gate must stay GREEN)
- **After every plan wave:** Run the full suite (foundation guards + test harness + kit-refs + validator)
- **Before `/gsd-verify-work`:** Full suite green **and** the SEC-02 freshness check (regenerate ⇒ no diff)
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

> Task IDs are assigned by the planner; rows below are requirement-anchored behaviors
> from `14-RESEARCH.md` § Validation Architecture. The planner aligns each plan task
> to one of these rows; `/gsd-validate-phase` reconciles task IDs post-planning.

| Row | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|-----|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| V-1 | SEC-02 | — | Generator parses vendored source + emits all 345 rows with `req_id` + level | smoke | `node scripts/generate-asvs-checklist.mjs && grep -c '^\- \[V' agent-factory/checklists/security-nfr-checklist.md` ⇒ 345 | ❌ W0 (new) | ⬜ pending |
| V-2 | SEC-02 | — | Generator is reproducible — re-run yields byte-identical checklist (no drift) | freshness/integrity | regenerate to temp + `cmp -s` against committed checklist | ❌ W0 (new) | ⬜ pending |
| V-3 | SEC-02 | — | Provenance header present (D-02) | grep | `grep -q 'GENERATED — do not hand-edit' agent-factory/checklists/security-nfr-checklist.md` | ❌ W0 | ⬜ pending |
| V-4 | SEC-02 | — | Vendored source pinned at the exact SHA (D-01) | grep | `grep -q '5cf9b032440be53ce345ab3c130fda46ba1ce7a2' agent-factory/checklists/security-nfr-checklist.md` (provenance line) | ❌ W0 | ⬜ pending |
| V-5 | SEC-03 | — | Clear professional voice on the 4 security surfaces; caveman fence carved out | guard | `sh scripts/check-foundation-guards.sh` (extended `guard_voice`) | ✅ extend existing | ⬜ pending |
| V-6 | SEC-03 | — | New surfaces FAIL-RED on a planted voice regression (no-fabrication proof) | RED fixture | `sh scripts/check-foundation-guards.test.sh` (new cases) | ✅ extend existing | ⬜ pending |
| V-7 | SEC-03 | — | Config dials remain valid + byte-identical across the 3 config files | validator + cmp | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.mjs` + `.test.sh` `cmp -s` case | ✅ existing | ⬜ pending |
| V-8 | SEC-01 | — | Workflow 15 exists with §18 sections + `## Commit`; cites `05-pr-quality-gate.md` | structural grep | `grep -q '05-pr-quality-gate.md' agent-factory/workflows/15-security-audit.md` | ❌ W0 (validator does not cover wf15) | ⬜ pending |
| V-9 | SEC-01 | — | `security-audit` classification + workflow-map row registered in orchestrator (no renumber 00–14) | grep | `grep -q 'security-audit' agent-factory/roles/orchestrator.md && grep -q '15-security-audit.md' agent-factory/roles/orchestrator.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/asvs/asvs-5.0.0.flat.json` — vendored official source @ pinned SHA `5cf9b032440be53ce345ab3c130fda46ba1ce7a2` (SEC-02)
- [ ] `scripts/generate-asvs-checklist.mjs` — the stdlib-Node generator (SEC-02 core)
- [ ] SEC-02 freshness/integrity check — regenerate-to-temp + `cmp -s` (a `.test.sh` case or small standalone, mirroring the freshness pattern); proves the committed checklist matches generator output
- [ ] `scripts/check-foundation-guards.test.sh` — RED fixtures for the 3 NEW voice surfaces (checklist, workflow 15, handoff) + ensure they appear in `GUARD_INPUTS`
- [ ] (no framework install needed — sh + Node 18+ already present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Severity-mapping override is honest (D-09: stated reason + named owner) | SEC-03 | Override is a human judgement call exercised at audit time, not a static assertion | Reviewer confirms workflow 15 documents the default L1→high / L2→medium / L3→low map AND requires a stated reason + named owner for any override |
| ASVS source provenance is authoritative | SEC-02 | "Not hand-transcribed" is proven by the source+generator both living in-repo; a human spot-checks a sample of generated rows against the pinned upstream | Reviewer diffs 2–3 generated checklist rows against `flat.json` at the pinned SHA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
