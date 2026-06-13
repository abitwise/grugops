---
phase: 14-security-audit-owasp-asvs-checklist-re-anchor
plan: 01
subsystem: security-checklist-generation
tags: [asvs, owasp, generator, checklist, stdlib-node, provenance, fail-closed]
requires: []
provides:
  - "scripts/asvs/asvs-5.0.0.flat.json — vendored pinned OWASP ASVS 5.0.0 source (345 reqs, 17 chapters)"
  - "scripts/generate-asvs-checklist.mjs — zero-dep stdlib-Node generator (JSON → grouped markdown + provenance)"
  - "agent-factory/checklists/security-nfr-checklist.md — full 345-item L1/L2/L3 ASVS 5.0 checklist (in place)"
affects:
  - "Plan 02 (guard scans this checklist; role/handoff reference its level-filter semantics)"
  - "agent-factory/roles/security-nfr.md (reads the regenerated checklist — path unchanged)"
  - "agent-factory/workflows/15-security-audit.md (planned; walks this checklist)"
tech-stack:
  added: ["OWASP ASVS 5.0.0 vendored data @ v5.0.0_release / 5cf9b032440be53ce345ab3c130fda46ba1ce7a2"]
  patterns: ["fail-closed stdlib-Node generator", "fixed-literal SRC/OUT paths (read/write-only-by-construction)", "GENERATED provenance header (new repo pattern)"]
key-files:
  created:
    - "scripts/asvs/asvs-5.0.0.flat.json"
    - "scripts/generate-asvs-checklist.mjs"
  modified:
    - "agent-factory/checklists/security-nfr-checklist.md"
decisions:
  - "Vendored flat.json (not CSV) — identical 7-key schema, parses with one JSON.parse, no RFC-4180 parser needed (D-01)"
  - "NFR/perf pointer dropped from the regenerated checklist (now pure ASVS); it stays in the role (Open Q1 RESOLVED)"
  - "tier: lean frontmatter line dropped (file now ships the full set); kind: checklist preserved for validator + kit-refs"
metrics:
  duration: "~10 min"
  completed: "2026-06-13"
  tasks: 2
  files: 3
---

# Phase 14 Plan 01: SEC-02 Generation Foundation Summary

Vendored the pinned OWASP ASVS 5.0.0 `flat.json`, wrote a zero-dependency stdlib-Node generator, and regenerated `security-nfr-checklist.md` in place as the full 345-requirement L1/L2/L3 ASVS 5.0 set with a provenance header — making "not hand-transcribed" provable (source + generator both in-tree, byte-reproducible output, exact pin recorded).

## What Was Built

**Task 1 — Vendored ASVS source** (`scripts/asvs/asvs-5.0.0.flat.json`, commit `671f5fa`)
- Fetched `OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json` from `OWASP/ASVS` at the immutable commit SHA `5cf9b032440be53ce345ab3c130fda46ba1ce7a2` (tag `v5.0.0_release`, published 2025-05-30, repo path `5.0/docs_en/`).
- Verified verbatim: 345 requirements, 17 distinct chapters (V1–V17), every row carrying exactly the 7 keys (`chapter_id, chapter_name, section_id, section_name, req_id, req_description, L`), all `L` values in `{"1","2","3"}`, level distribution 70/183/92 — matching RESEARCH exactly.
- Did not vendor the moving `latest` tag or the `.legacy.json` back-mapped form (T-14-01: the pinned SHA is the supply-chain integrity anchor).

**Task 2 — Generator + regenerated checklist** (`scripts/generate-asvs-checklist.mjs` + `agent-factory/checklists/security-nfr-checklist.md`, commit `d656780`)
- `scripts/generate-asvs-checklist.mjs`: zero-dep ESM stdlib-Node 18+ (no TypeScript per D-03, no npm deps, no package.json), mirroring `validate-agent-factory.mjs`'s house style — header doc-comment stating the stdlib-only/zero-dep/fail-closed contract plus the source pin (TAG + SHA).
  - **Fixed-literal SRC/OUT paths** joined to repo root, never derived from argv/env/file-content (T-14-02, read/write-only-by-construction).
  - **Fail-closed** (T-14-03): `JSON.parse` in try/catch; rejects a parse failure, a null/non-object top-level, a missing `requirements` array, or a row count `!= 345` — prints a finding to stderr and `process.exit(1)` with **no partial write**.
  - Groups rows by `chapter_id`, numeric-sorts `Number(id.slice(1))` so output is V1..V17 order, emits `- [<req_id>] [L<L>] <req_description>` with `req_description` copied **verbatim** (T-14-04, no fabrication).
  - Emits `kind: checklist` frontmatter, the D-02 provenance HTML comment (`GENERATED — do not hand-edit` + re-run command + `OWASP ASVS 5.0.0` + tag + SHA), and a clear-voice (professional) intro stating cumulative level semantics honestly (L1=70, L2=253 cumulative, L3=345 cumulative; `L <= asvs_level`).
- `agent-factory/checklists/security-nfr-checklist.md`: regenerated in place (D-04) as the full 345-row set. The old "performance impact vs NFR catalog" / `plans/nfr-catalog.md` pointer was dropped from the now-pure-ASVS checklist; it remains in the role (`security-nfr.md` already references `nfr-catalog.md` separately — Open Q1 RESOLVED in planning).

## Verification

| Check | Command | Result |
|-------|---------|--------|
| V-1 row count = 345 | `grep -c '^- \[V' …checklist.md` | 345 ✓ |
| V-2 reproducible | regenerate to temp + `cmp -s` | byte-identical ✓ |
| V-3 provenance header | `grep -q 'GENERATED — do not hand-edit'` | present ✓ |
| V-4 pinned SHA | `grep -q '5cf9b032…'` | present ✓ |
| Fail-closed (garbled) | temp generator over garbled JSON | exit 1, no write ✓ |
| Fail-closed (wrong count) | temp generator over 3-row source | exit 1, no write ✓ |
| Voice markers | `grep -E '<VOICE_MARKERS>'` on the body | zero hits ✓ |
| Source schema | 7 keys, 17 chapters, L∈{1,2,3}, 70/183/92 | ✓ |
| `kind: checklist` frontmatter | `grep -q 'kind: checklist'` | preserved ✓ |
| Existing refs survive | `grep` in `security-nfr.md` | path unchanged ✓ |

**Full suite (all GREEN):**
- `sh scripts/check-foundation-guards.sh` → ALL CHECKS PASSED (build gate)
- `sh scripts/check-kit-refs.sh` → ALL CHECKS PASSED
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.mjs` → ALL CHECKS PASSED
- `sh scripts/check-foundation-guards.test.sh` → ALL CHECKS PASSED (fail-proof harness)

## Deviations from Plan

None — plan executed exactly as written. Both discretionary choices noted in the plan/research were taken as recommended: vendored `flat.json` (not CSV), dropped the NFR pointer to keep the checklist pure ASVS, and dropped the `tier: lean` frontmatter line (the file now ships the full set) while preserving `kind: checklist`.

## Notes for Plan 02

- The generated checklist body is clean clear-voice (zero `VOICE_MARKERS` hits), so adding it to the `guard_voice` scan set in Plan 02 will pass with no description edits required (RESEARCH Pitfall 2 confirmed: zero hits).
- The fixture trees under `scripts/fixtures/*/agent-factory/checklists/security-nfr-checklist.md` still carry their old lean copies — the validator only existence-checks checklists in those trees, so they remain valid and were intentionally not regenerated (out of scope for this plan).
- The level-filter semantics (cumulative, `L <= asvs_level`) are stated honestly in the checklist intro; the role/workflow read-time filter wiring lands in Plan 02.

## Self-Check: PASSED

- FOUND: scripts/asvs/asvs-5.0.0.flat.json
- FOUND: scripts/generate-asvs-checklist.mjs
- FOUND: agent-factory/checklists/security-nfr-checklist.md
- FOUND commit: 671f5fa (Task 1)
- FOUND commit: d656780 (Task 2)
