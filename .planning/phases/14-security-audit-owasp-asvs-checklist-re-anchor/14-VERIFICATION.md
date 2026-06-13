---
phase: 14-security-audit-owasp-asvs-checklist-re-anchor
verified: 2026-06-13T09:00:00Z
status: passed
score: 12/12
overrides_applied: 0
---

# Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor — Verification Report

**Phase Goal:** Give grugops a leveled, evidence-backed security posture — a new ASVS-anchored security-audit workflow (workflow 15), a regenerated ASVS 5.0 checklist with L1/L2/L3 tags and requirement IDs, and a dialed ASVS level — all in clear professional voice.
**Verified:** 2026-06-13T09:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                                    | Status     | Evidence                                                                                                                                                      |
|----|--------------------------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Running `node scripts/generate-asvs-checklist.mjs` emits the full 345-requirement ASVS 5.0 checklist (provably not hand-transcribed) | VERIFIED | Generator runs to exit 0; `git diff --quiet` confirms byte-identical output; source + generator both committed in-tree                                        |
| 2  | Re-running the generator produces a byte-identical checklist (reproducible, no drift)                                   | VERIFIED   | `git diff --quiet agent-factory/checklists/security-nfr-checklist.md` after re-run exits 0                                                                   |
| 3  | The checklist carries a provenance header naming ASVS 5.0.0 + pinned tag + pinned commit SHA                            | VERIFIED   | `grep -q 'GENERATED — do not hand-edit'` exits 0; `grep -q '5cf9b032440be53ce345ab3c130fda46ba1ce7a2'` exits 0                                               |
| 4  | Every checklist row carries a req_id (Vx.y.z) and an L1/L2/L3 level tag, organized by ASVS chapter V1–V17              | VERIFIED   | `grep -c 'V[0-9]\+\.[0-9]\+\.[0-9]\+'` = 345; `grep -c '^- \[V'` = 345; 17 chapters confirmed by generator and vendored source                              |
| 5  | The generator fails closed (nonzero exit, no partial write) on missing/garbled source or row count != 345               | VERIFIED   | Generator source contains explicit `EXPECTED_ROWS = 345` row-count assert with `process.exit(1)` before write; try/catch around JSON.parse; harness confirms |
| 6  | A `15-security-audit.md` workflow exists, anchored to OWASP ASVS 5.0, mirroring the wf14 section skeleton              | VERIFIED   | File exists with `kind: workflow`, `order: 15`, `cadence: both`; all 9 sections present; title `# Workflow: Security audit (OWASP ASVS)`                     |
| 7  | Workflow 15 cites `05-pr-quality-gate.md` by filename and never restates the gate loop; never writes §14                | VERIFIED   | `grep -q '05-pr-quality-gate.md'` exits 0; `grep -q '§14'` exits nonzero (absent); step 4 explicitly states "this workflow never blocks on its own"          |
| 8  | The Orchestrator routes `security-audit` classification to `15-security-audit.md` without renumbering 00–14             | VERIFIED   | Classification in pipe-delimited list (line 43); table row `security-audit \| 15-security-audit.md` present; `14-ui-design-to-build.md` and `13-incident.md` rows untouched; size 6822B < 7165B warn ceiling |
| 9  | The Security/NFR role reads the checklist at `security.asvs_level` (cumulative, read-time filter, NOT regenerated)      | VERIFIED   | Role carries: "filtered at read time to `security.asvs_level`: cumulative, keep every requirement where `L <= level`"; explicitly states "NOT regenerated when the dial changes" |
| 10 | The role carries the D-09 default severity map (L1 to high / L2 to medium / L3 to low) with named-owner override        | VERIFIED   | `## Hard limits` section: "L1 fail → high, L2 fail → medium, L3 fail → low"; "auditor MAY override a finding's default severity, but only with a stated reason and a named owner" |
| 11 | The handoff template carries severity + ASVS level + req-id fields for findings, plus named-owner override field         | VERIFIED   | `## Required fixes` comment: "severity (high\|medium\|low) · ASVS level (L1\|L2\|L3) · req-id (Vx.y.z)"; `## Accepted risks` comment: "severity override: ... reason · owner"; `kind: handoff` preserved |
| 12 | `guard_voice` scans all four security surfaces in clear professional voice; harness proves each new surface fails RED    | VERIFIED   | `sh scripts/check-foundation-guards.sh` exits 0 (ALL CHECKS PASSED); `sh scripts/check-foundation-guards.test.sh` exits 0 with RED fixtures for wf15, checklist, handoff; `SEC_VOICE_FILES` union confirmed |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact                                                | Expected                                                    | Status    | Details                                                                                               |
|---------------------------------------------------------|-------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------|
| `scripts/asvs/asvs-5.0.0.flat.json`                    | Vendored OWASP ASVS 5.0.0 source, 345 reqs, 17 chapters    | VERIFIED  | 345 requirements, 17 chapters V1–V17, L in {1,2,3}, all 7 keys; pinned SHA in generator              |
| `scripts/generate-asvs-checklist.mjs`                  | Zero-dep stdlib-Node ESM generator; fail-closed; fixed paths | VERIFIED  | `node:fs/node:path/node:url` only; SRC/OUT fixed literal paths; `EXPECTED_ROWS = 345` assert          |
| `agent-factory/checklists/security-nfr-checklist.md`   | Generated 345-row L1/L2/L3 checklist with provenance header | VERIFIED  | 345 rows, provenance header, SHA present, `kind: checklist` preserved, byte-reproducible              |
| `agent-factory/workflows/15-security-audit.md`         | Deep ASVS audit workflow citing `05-pr-quality-gate.md`     | VERIFIED  | `order: 15`, all 9 sections, gate cited by filename, no §14, no voice markers, 3878B                  |
| `agent-factory/roles/orchestrator.md`                  | `security-audit` classification + map row, no renumber      | VERIFIED  | Both insertion points present; 6822B < 7165B warn ceiling; wf14/wf13 rows untouched                   |
| `agent-factory/roles/security-nfr.md`                  | `asvs_level` filter note + D-09 severity map + clear voice  | VERIFIED  | `asvs_level` near checklist ref; D-09 map in `## Hard limits`; `nfr-catalog.md` preserved; 4556B within bumped ceiling; caveman fence intact |
| `agent-factory/handoffs/security-nfr-handoff.md`       | Severity/level/req-id fields + named-owner override         | VERIFIED  | Finding fields and override field present; `kind: handoff` and all section names preserved             |
| `scripts/check-foundation-guards.sh`                   | `SEC_VOICE_FILES` union; all three new surfaces scanned     | VERIFIED  | `SEC_VOICE_FILES` defined and unioned into `VOICE_FILES`; `security-nfr.md` not duplicated           |
| `scripts/check-foundation-guards.test.sh`              | 3 new surfaces in `GUARD_INPUTS` + one RED fixture each     | VERIFIED  | All three paths in `GUARD_INPUTS`; `expect_fail` fixtures for wf15, checklist, handoff                |

---

### Key Link Verification

| From                                  | To                                      | Via                                              | Status   | Details                                                             |
|---------------------------------------|-----------------------------------------|--------------------------------------------------|----------|---------------------------------------------------------------------|
| `scripts/generate-asvs-checklist.mjs` | `scripts/asvs/asvs-5.0.0.flat.json`    | `readFileSync` + `JSON.parse` of FIXED SRC path  | WIRED    | Fixed literal `SRC` path; try/catch parse; row-count assert         |
| `scripts/generate-asvs-checklist.mjs` | `agent-factory/checklists/security-nfr-checklist.md` | `writeFileSync` to FIXED OUT path | WIRED    | Fixed literal `OUT` path; write happens only after all assertions pass |
| `agent-factory/roles/orchestrator.md` | `agent-factory/workflows/15-security-audit.md` | classification→workflow-file map row | WIRED    | `security-audit \| \`15-security-audit.md\`` row confirmed          |
| `agent-factory/workflows/15-security-audit.md` | `agent-factory/workflows/05-pr-quality-gate.md` | reference-don't-restate by filename | WIRED    | "per `agent-factory/workflows/05-pr-quality-gate.md`"; gate loop not restated |
| `agent-factory/roles/security-nfr.md` | `security.asvs_level` config key        | read-time cumulative filter note                 | WIRED    | "filtered at read time to `security.asvs_level`" in `## Reads`     |
| `scripts/check-foundation-guards.sh`  | `agent-factory/checklists/security-nfr-checklist.md` | `SEC_VOICE_FILES` scan-set union     | WIRED    | Path present in `SEC_VOICE_FILES`; unioned into `VOICE_FILES`        |
| `scripts/check-foundation-guards.test.sh` | `scripts/check-foundation-guards.sh` | `GUARD_INPUTS` mirror + `expect_fail` RED fixtures | WIRED | All three new surface paths in `GUARD_INPUTS`; three `expect_fail` cases |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces markdown artifacts and scripts, not dynamic data-rendering components. The generator's data flow (source JSON → checklist markdown) was verified by the reproducibility check (byte-identical re-run).

---

### Behavioral Spot-Checks

| Behavior                                          | Command                                                                                                     | Result                                      | Status |
|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------|--------|
| Generator exits 0 and produces 345-row checklist  | `node scripts/generate-asvs-checklist.mjs`                                                                  | exit 0; "wrote 345 requirements"            | PASS   |
| Checklist is byte-reproducible after re-run        | `git diff --quiet agent-factory/checklists/security-nfr-checklist.md`                                       | exit 0 (no diff)                            | PASS   |
| Foundation guards pass over real tree             | `bash scripts/check-foundation-guards.sh`                                                                    | exit 0; ALL CHECKS PASSED                   | PASS   |
| Fail-proof harness: RED fixtures + smoke GREEN    | `bash scripts/check-foundation-guards.test.sh`                                                               | exit 0; ALL CHECKS PASSED (all 4 voice RED fixtures pass) | PASS   |
| Kit reference integrity                           | `bash scripts/check-kit-refs.sh`                                                                             | exit 0; ALL CHECKS PASSED                   | PASS   |
| Structure validator                               | `VALIDATE_KIT_ROOT="$(pwd)" node scripts/validate-agent-factory.mjs`                                        | exit 0; ALL CHECKS PASSED                   | PASS   |
| Config byte-identity (no security.* key added)   | `cmp -s agent-factory/config/factory.config.json agent-factory/seed/.grugops/factory.config.json`           | exit 0 (byte-identical)                     | PASS   |
| ASVS req-ID count in checklist                   | `grep -c 'V[0-9]\+\.[0-9]\+\.[0-9]\+'` on checklist                                                         | 345                                         | PASS   |
| Vendored source: 345 reqs, 17 chapters            | `node -e '...'` on `scripts/asvs/asvs-5.0.0.flat.json`                                                       | reqs: 345, chapters: 17                     | PASS   |

---

### Probe Execution

No conventional probe scripts (`scripts/*/tests/probe-*.sh`) were declared for this phase. All verification was performed via the project's own guard scripts listed in Behavioral Spot-Checks above.

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                                               | Status    | Evidence                                                                                                          |
|-------------|-------------|---------------------------------------------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------|
| SEC-01      | 14-02-PLAN  | grugops includes a security-audit workflow anchored to OWASP ASVS 5.0                                                    | SATISFIED | `15-security-audit.md` exists with ASVS 5.0 anchor; Orchestrator routes `security-audit` classification to it    |
| SEC-02      | 14-01-PLAN  | The security/NFR checklist is rewritten to ASVS 5.0 chapters with L1/L2/L3 tags and requirement IDs, generated from pinned source | SATISFIED | 345-row checklist generated from vendored pinned source; byte-reproducible; provenance header with SHA           |
| SEC-03      | 14-03-PLAN  | ASVS level is config-dialed (L1 → L2 → L3 + named human sign-off), gate's security block-threshold is dialed, all security findings in clear professional voice | SATISFIED | `asvs_level` read-time filter in role; D-09 severity map wired; `block_on` referenced at gate; `guard_voice` passes over all 4 security surfaces; harness proves RED on violations |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No `TBD`, `FIXME`, `XXX`, placeholder, or stub patterns found in any phase-modified file. All code paths are substantive (generator is fully functional; guards fully wired). No hardcoded empty returns in security-relevant functions.

---

### Human Verification Required

None. All phase-14 success criteria are mechanically verifiable (file existence, byte counts, grep checks, script exit codes). The voice-discipline guard (`guard_voice`) mechanically verifies the "clear professional voice" requirement across all four security surfaces without human inspection. No visual UI, external service integration, or subjective quality judgment is involved.

---

### Gaps Summary

No gaps. All 12 observable truths are VERIFIED, all 9 required artifacts are substantive and wired, all 7 key links are confirmed, all 6 commits exist in git history, and the full test suite exits 0.

The SUMMARY.md claims were independently verified against the actual codebase:

- The 345-requirement count was confirmed by two independent greps and by re-running the generator.
- Byte-reproducibility was confirmed by running `node scripts/generate-asvs-checklist.mjs` and `git diff --quiet`.
- The orchestrator registration was confirmed by grep on the actual file, not the SUMMARY.
- The voice guard extension was confirmed by reading the actual `check-foundation-guards.sh` and running the full harness.
- The D-09 severity map was confirmed by reading the actual `security-nfr.md` `## Hard limits` section.
- Config byte-identity was confirmed by `cmp -s` on the actual files.

---

_Verified: 2026-06-13T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
