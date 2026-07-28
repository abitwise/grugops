---
phase: 18
slug: browsable-docs-catalog
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `18-RESEARCH.md` § Validation Architecture. Task IDs marked `TBD` are filled by the planner; the executor maps each task to a row.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1.8` (present per Phase 15 scaffolding; `*.test.ts` excluded from the tsc build) |
| **Config file** | `vitest.config.*` (present) |
| **Quick run command** | `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts` |
| **Full suite command** | `npm test` (`vitest run`) |
| **Estimated runtime** | ~sub-second for the two catalog test files; a few seconds for the full suite |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts` (sub-second) + `npm run generate:catalog && npm run freshness:catalog` (script names finalized by planner/executor)
- **After every plan wave:** Run `npm test` + `npm run freshness` (compiled-`.js` drift) + the new catalog-freshness script (content drift)
- **Before `/gsd-verify-work`:** Full suite green + both freshness gates green
- **Max feedback latency:** < 5 seconds

---

## Per-Task Verification Map

> Requirement→behavior rows from research. Task IDs are `TBD` until plans exist; the executor binds each behavior to its task.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | DOCS-01 | — | Generator writes `docs/catalog/README.md` + exits 0 over the real kit | unit | `npx vitest run scripts/generate-catalog.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-01 | — | Byte-reproducible: two regenerations are byte-identical and equal committed bytes | unit | same | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-01 | — | Catalog contains all 17 roles + all 16 workflows (incl. frontend-ui, workflows 14 & 15) | unit | same (assert row count + names) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-01 | T-V12 | Fail-closed: a kit file with no `# Role:`/`# Workflow:` H1 → exit 1, no partial write | unit | same (hermetic mirror) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-01 | — | No fabrication: workflow 12/13 cadence cell reads `UNKNOWN - verify` (or tier column), never `both` | unit | same (assert no fabricated cadence) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-02 | — | Freshness exits 0 when committed catalog matches a fresh regeneration | unit | `npx vitest run scripts/catalog-freshness.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-02 | — | Freshness exits non-zero + names the file on planted drift | unit | same (RED fixture) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DOCS-02 | T-V12 | Fail-closed: a broken generator → freshness exits non-zero, never "fresh" | unit | same (RED fixture) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/generate-catalog.test.ts` — covers DOCS-01 (writes / byte-reproducible / complete-set / fail-closed / no-fabrication)
- [ ] `scripts/catalog-freshness.test.ts` — covers DOCS-02 (fresh / drift-RED / fail-closed-RED); cloned from `scripts/freshness.test.ts`

*Framework install: none — Vitest already present.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual scan of the rendered catalog table (links resolve, reads cleanly) | DOCS-01 | Human-readable presentation is a judgment call beyond byte-equality | Open `docs/catalog/README.md` in a markdown viewer; confirm 17 role rows + 16 workflow rows, each source link resolves |

*All behaviors that can be automated have automated verification; the row above is presentation-only and non-blocking.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
