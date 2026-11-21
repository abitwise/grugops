# Phase 35: Graph-memory decision record - Pattern Map

**Mapped:** 2026-10-20
**Files analyzed:** 5 (1 new record, 1 modified ledger, 3 new phase-local checks)
**Analogs found:** 5 / 5 (all analogs are git-tracked; no mirror paths)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/35-graph-memory-decision-record/35-DECISION.md` (new) | planning record | static doc | `.planning/milestones/v1.2-phases/16-14-gate-convergence-lint-ui-e2e-test-integrity/16-PRE-DECISIONS.md` | role-match (standalone decision file, different content shape) |
| `.planning/PROJECT.md` (modify: one row after `[v3.0, D-9]`, line 265) | ledger row | append | `.planning/PROJECT.md:257-265` (`[v3.0, D-1]`..`[v3.0, D-9]` rows) | exact |
| `.planning/phases/35-graph-memory-decision-record/35-check-claims.mjs` (new) | phase-local check | file-I/O, read-only | `.planning/milestones/v2.1-phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-env-claim-scan.mjs` | exact (published-claim scan, stdlib only) |
| `.planning/phases/35-graph-memory-decision-record/35-check-content.mjs` (new) | phase-local check | file-I/O, read-only | same `33.1-env-claim-scan.mjs`; `32.1-ledger-check.mjs` | role-match |
| `.planning/phases/35-graph-memory-decision-record/35-check-row.mjs` (new) | phase-local check | file-I/O, read-only | `.planning/milestones/v2.1-phases/32.1-board-dashboard-deferred-residuals/32.1-ledger-check.mjs` | role-match |

## Pattern Assignments

### `35-DECISION.md` (planning record)

**Analog:** `16-PRE-DECISIONS.md` (31 lines). Copy its shape, not its content:
- Line 1: `# Phase 16 (§14 Gate Convergence) — Pre-Decisions` -> use `# [v3.0, D-10] Graph memory: not adopted` (tag the milestone ID; `[v2.0, D-10/D-11]` already exists at PROJECT.md:302, so always write the tag).
- Line 3: `**Captured:** 2026-06-13, during ...` -> a bold status line: date, requirements (GRAPH-01, GRAPH-02), and "tool facts as of 2026-10-20 from `.planning/research/STACK.md` §(d), not re-checked; labels kept".
- Line 5: a `> **Why this file exists:**` blockquote -> use for the origin (`human-notes.txt:38`, cited, never edited).
- `##` sections with bold-lead bullets (`- **D (...):** ...`).

Section list and the tool-facts table are already specified in 35-RESEARCH.md § "Recommended `35-DECISION.md` structure" (items 1-10) and § "Verified tool facts" (five-row table with the Graphify vendor-figure sentence removed). Build from those, never from STACK.md:135 / FEATURES.md:169 / SUMMARY.md:207 / PITFALLS.md:354 directly.

### `.planning/PROJECT.md` row (ledger)

**Analog:** PROJECT.md:265, the `[v3.0, D-9]` row. Format: three cells, bold tag at start of the Decision cell, Outcome `— Pending`:
```markdown
| **[v3.0, D-9]** Ship `claim.js` (queue) as a materialized runnable ... | Dogfood agents ran the claim protoco... | — Pending |
```
Insert the new row as line 266 (directly after D-9, before the dated `[v3.0, 2026-10-20]` rows). Draft row text: 35-RESEARCH.md lines 165-167. No `|` inside inline code (the row check splits on `|`).

### `35-check-*.mjs` (phase-local checks)

**Analog:** `33.1-env-claim-scan.mjs` lines 1-25: `#!/usr/bin/env node` shebang, then a header comment block naming the decision it serves, with explicit **WHAT IT PROVES** and **WHAT IT DOES NOT PROVE** paragraphs (blind spots stated honestly). Apply that header to all three scripts; the bodies are the tested code in 35-RESEARCH.md lines 256-316 (claims), 331-353 (content), 359-384 (row). Conventions shared with the analog:
- Node stdlib only (`node:fs`, `node:path`), ESM, `repoRoot` from `process.argv[2] ?? process.cwd()`.
- Print `FAIL ...` lines, then a one-line `PASS ...` / `N FAIL(S)` verdict; set `process.exitCode` (no throw).
- ASCII only, non-ASCII as `\uXXXX` escapes (keeps `check-nul-bytes` clean).
- Live in the phase directory, so tsc/vitest ignore them and SC-4 holds.

## Shared Patterns

### Decision IDs
**Source:** PROJECT.md:257-265 and :302. Always write `[v3.0, D-10]` with the milestone tag; cite CONTEXT decisions D-01..D-08 standalone (not glued `D-01/D-02`) in plan `must_haves.truths` for the §13a coverage gate.

### No fabrication / labels
**Source:** CLAUDE.md "No fabrication"; STACK.md §(d). Keep `LOW` (code-graph-rag Docker) and `UNKNOWN - verify` (Serena, MCP memory server licenses; trigger (b) measurement method) verbatim.

### Scope (SC-4)
Every write under `.planning/`. Commit subjects `docs(35-01): ...` so the criterion-4 per-commit check (35-RESEARCH.md lines 392-408) sees them.

## No Analog Found

None. (No prior file mirrors a "tool evaluated and rejected" record exactly; the research structure fills that gap.)

## Metadata

**Analog search scope:** `git ls-files .planning` for `*DECISION*.md` and `*.mjs`; PROJECT.md Key Decisions.
**Files scanned:** ~22
**Pattern extraction date:** 2026-10-20
