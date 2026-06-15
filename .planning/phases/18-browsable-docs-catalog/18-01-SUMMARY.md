---
phase: 18-browsable-docs-catalog
plan: 01
subsystem: docs
tags: [typescript, node-stdlib, vitest, markdown-generator, catalog, readdirSync]

# Dependency graph
requires:
  - phase: 15-typescript-tooling-migration
    provides: the .ts -> committed .js + freshness-gate foundation (D-13) the generator builds on
  - phase: 14-security-audit
    provides: generate-asvs-checklist.ts/.test.ts — the structural template cloned for the generator + oracle
  - phase: 13-frontend-ui
    provides: the 17th role (frontend-ui) and workflow 14 the catalog must surface
provides:
  - "scripts/generate-catalog.ts (+ committed .js): a read-only, stdlib-only generator that self-discovers the kit and emits a deterministic, byte-stable docs/catalog/README.md"
  - "docs/catalog/README.md: the committed browsable catalog — 17 role rows + 16 workflow rows, each linking to its source file"
  - "scripts/generate-catalog.test.ts: the DOCS-01 Vitest oracle (writes/reproducible/complete-set/fail-closed/no-fabrication)"
  - "package.json generate:catalog script + .gitattributes LF pin for the committed catalog"
affects: [browsable-docs-catalog plan 02 (catalog-freshness gate byte-diffs against this committed output), milestone-close docs review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-discovery via readdirSync over the live kit dirs (never the stale validate-agent-factory.ts arrays)"
    - "First-sentence summary split on the literal '. ' (period-space), keeping its period, never re-appending — avoids double-period and period-in-content truncation"
    - "Deterministic D-08 ordering + literal \\n + single trailing newline for byte-stable regeneration"
    - "No-fabrication: a genuinely absent frontmatter field surfaces 'UNKNOWN - verify', never an invented value"

key-files:
  created:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - docs/catalog/README.md
  modified:
    - package.json
    - .gitattributes

key-decisions:
  - "Catalog source links are repo-root-relative ('/agent-factory/roles/<file>.md'), not '../../'-prefixed — keeps the file free of '..' so the no-double-period DOCS-01 assertion holds, and matches the plan's stated link spelling"
  - "Emit 16 workflow rows (the 16 numbered files on disk), confirming ROADMAP SC #3's already-corrected '16 workflows' label"
  - "Followed the plan's generator-only scope: this plan ships generate-catalog + the existing 'npm run freshness' covers the compiled .js; the dedicated catalog-freshness content gate is plan 02's scope"

patterns-established:
  - "Generator clones generate-asvs-checklist.ts; oracle clones generate-asvs-checklist.test.ts (drive the committed .js, hermetic mirror for fail-closed)"
  - "Fail-closed before any write: build the full lines[] first; a missing H1/section/tier/order calls fail() -> exit(1) without a partial write"

requirements-completed: [DOCS-01]

# Metrics
duration: 5min
completed: 2026-06-15
---

# Phase 18 Plan 01: Browsable Docs Catalog Generator Summary

**A read-only, stdlib-only TypeScript generator that self-discovers the finished kit via `readdirSync` and emits a deterministic, byte-stable `docs/catalog/README.md` — 17 role rows + 16 workflow rows, each linking to its source file — with its DOCS-01 Vitest oracle, the `generate:catalog` script, and the `.gitattributes` LF pin.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-15T09:36:59Z
- **Completed:** 2026-06-15T09:42:23Z
- **Tasks:** 2
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments
- `scripts/generate-catalog.ts` (+ committed `.js`): self-discovers 17 roles (skips `_`-prefixed, D-03) + 16 workflows via `readdirSync` — never the stale `validate-agent-factory.ts` arrays (Pitfall 5). Read-only parse (D-01): H1 name, first-sentence summary, tier/order/cadence from flat frontmatter.
- `docs/catalog/README.md`: the committed catalog — 12 core + 5 enterprise roles (A-Z within tier), 16 workflows by `order` ascending. Workflows 12/13 cadence reads `UNKNOWN - verify` (D-09, never fabricated `both`). Byte-stable: a second regeneration is a byte-identical no-op.
- `scripts/generate-catalog.test.ts`: the DOCS-01 oracle (5 tests, all green) — writes/exits-0, byte-reproducible, complete-set (17+16 row counts), fail-closed (hermetic mirror + sentinel survives), no-fabrication (`UNKNOWN - verify`, no `..`).
- Wiring: `package.json` `generate:catalog` script and a `.gitattributes` LF pin for the catalog; the existing `npm run freshness` auto-covers the new compiled `.js`.

## Task Commits

Each task was committed atomically (test-first sequencing per the plan):

1. **Task 1: generate-catalog.test.ts — the DOCS-01 oracle, authored first (ships RED)** - `7d3974c` (test)
2. **Task 2: generate-catalog.ts — the read-only deterministic generator + committed catalog + wiring** - `7c16d1a` (feat)

**Plan metadata:** see the docs commit below (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified
- `scripts/generate-catalog.ts` - The read-only catalog generator (compiled to the committed `.js`)
- `scripts/generate-catalog.js` - The committed compiled generator the oracle + freshness gate drive
- `scripts/generate-catalog.test.ts` - The DOCS-01 Vitest oracle (5 idioms)
- `docs/catalog/README.md` - The committed generated catalog (17 role rows + 16 workflow rows)
- `package.json` - Added the `generate:catalog` script (no new deps)
- `.gitattributes` - Pinned `docs/catalog/README.md text eol=lf` for cross-platform byte-stability

## Decisions Made
- **Catalog source links are repo-root-relative** (`/agent-factory/roles/<file>.md`), not `../../`-prefixed. The plan's `key_links` artifact specifies the bare `agent-factory/...` path; a `../../` prefix would inject `..` into the file and collide with the no-double-period DOCS-01 assertion. Root-relative links render correctly on GitHub and keep the file `..`-free.
- **Emit 16 workflow rows** (the 16 numbered files `00`-`15` on disk) — confirms ROADMAP SC #3's already-corrected "16 workflows" label; no workflow was dropped to force "15."
- **Generator-only scope** per the plan: this plan ships `generate-catalog`; the dedicated `catalog-freshness` content gate is plan 02's scope. The compiled `.js` drift is already covered by the existing `npm run freshness` gate (`scripts/` is in its `OUTPUT_DIRS`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Top-level `return fail(...)` is illegal in a module body**
- **Found during:** Task 2 (generator first build)
- **Issue:** The generator is a top-level module (not a function body), so `return fail(...)` raised `TS1108: A 'return' statement can only be used within a function body` (10 sites). The analog `generate-asvs-checklist.ts` uses bare `fail(...)` calls.
- **Fix:** Dropped `return` from every `fail(...)` call (the `fail` helper is typed `never` and calls `process.exit(1)`); added non-null assertions (`text!`, `h1!`, `body!`) and definite-assignment markers (`let roleFiles!`) where the catch-then-`exit` flow defeats TS's definite-assignment analysis.
- **Files modified:** scripts/generate-catalog.ts
- **Verification:** `npm run build` exits 0 (noEmitOnError true).
- **Committed in:** 7c16d1a (Task 2 commit)

**2. [Rule 1 - Bug] Relative `../../` link path injected `..`, breaking the no-double-period contract**
- **Found during:** Task 2 (first oracle run after generation)
- **Issue:** The initial link format `[link](../../agent-factory/...)` put `..` into every source-link cell, so the DOCS-01 no-fabrication test's `not.toContain("..")` assertion (intended to catch the incident-responder single-sentence double-period trap) failed on the link paths.
- **Fix:** Changed source links to repo-root-relative `/agent-factory/...` (no `..`), matching the plan's stated link spelling. Rebuilt and regenerated.
- **Files modified:** scripts/generate-catalog.ts, docs/catalog/README.md
- **Verification:** `npx vitest run scripts/generate-catalog.test.ts` — 5/5 green; `docs/catalog/README.md` contains no `..`.
- **Committed in:** 7c16d1a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes were necessary for correctness and to satisfy the plan's own DOCS-01 oracle. No scope creep — the link-format change aligns the output with the plan's `key_links` spelling.

## Issues Encountered
- TypeScript's definite-assignment / null-narrowing did not propagate through the catch-then-`exit(1)` pattern as cleanly as a `throw`-based flow would. Resolved with non-null assertions and `let x!` markers at the points TS could not follow — consistent with the codebase's `fail(): never` idiom. No behavioral change.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The committed `docs/catalog/README.md` is byte-stable and ready for plan 02's `catalog-freshness` content-drift gate to byte-diff against.
- ROADMAP SC #3 ("16 workflows") and the generated artifact agree (16 workflow rows).
- No blockers.

---
*Phase: 18-browsable-docs-catalog*
*Completed: 2026-06-15*

## Self-Check: PASSED

- FOUND: scripts/generate-catalog.ts
- FOUND: scripts/generate-catalog.js
- FOUND: scripts/generate-catalog.test.ts
- FOUND: docs/catalog/README.md
- FOUND: .planning/phases/18-browsable-docs-catalog/18-01-SUMMARY.md
- FOUND commit: 7d3974c (Task 1, test)
- FOUND commit: 7c16d1a (Task 2, feat)
