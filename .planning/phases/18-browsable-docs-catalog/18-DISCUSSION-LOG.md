# Phase 18: Browsable Docs Catalog - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 18-browsable-docs-catalog
**Areas discussed:** Content source, Catalog layout, Detail depth, Freshness wiring

---

## Content source ("from frontmatter" reality gap)

| Option | Description | Selected |
|--------|-------------|----------|
| Parse body sections (read-only) | Generator reads heading + `## One job` / `## When to use`; frontmatter supplies kind/tier/order/cadence. No edits to the 32 kit files. Preserves single-source. | ✓ |
| Enrich frontmatter first | Add `name:`/`description:` to all 32 files, then generate purely from frontmatter. Matches literal SC wording but edits guarded files + duplicates one-job text (drift risk). | |
| Hybrid: frontmatter + body fallback | Read frontmatter, fall back to body sections, `UNKNOWN - verify` if neither. | |

**User's choice:** Parse body sections (read-only)
**Notes:** Drives D-01/D-02/D-03. The descriptive content isn't in frontmatter (only kind/tier/order/cadence), so "from their frontmatter" (SC wording) is reinterpreted as "frontmatter + conventional body sections." Keeps the phase a pure read-generator — no edits to the 17 role / 15 workflow files, no guard risk, single-source preserved.

---

## Catalog layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single index file | One `docs/catalog/README.md` with roles + workflows tables, each row linking to its source file. | ✓ |
| Two files (roles + workflows) | Split `roles.md` + `workflows.md`. | |
| Index + per-entry pages | Index plus one detail page per role + workflow (32 files). Heaviest. | |

**User's choice:** Single index file
**Notes:** D-04. Simplest to generate, commit, and byte-diff.

---

## Detail depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | name, tier (roles) / order+cadence (workflows), one-line summary, source link. | ✓ |
| Richer | Also agents-involved + inputs (workflows), reads/writes (roles). More drift surface + more UNKNOWNs. | |

**User's choice:** Minimal
**Notes:** D-05. Compact rows; small drift surface.

---

## Freshness wiring (DOCS-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone npm script | Mirror `scripts/freshness.ts`: regenerate to temp → byte-diff → non-zero on drift; own `npm run` script. | ✓ |
| Fold into foundation guards | Add as a check inside the foundation-guards aggregator / §14 gate. | |
| Both: script called by the gate | Standalone script that the gate invokes. | |

**User's choice:** Standalone npm script
**Notes:** D-07. Fail-closed (broken generator never reports "fresh"). Registered in package.json so a stale catalog fails the build red. Not folded into the foundation-guards aggregator.

---

## Claude's Discretion

- Generator language confirmed (not asked — locked by D-13 convention): TypeScript `.ts` → committed `.js`, zero npm runtime deps; the SC's "stdlib-only Node generator" wording predates the Phase-15 TS pivot. (D-06)
- Derived decisions locked with the user's assent: deterministic output ordering for the byte-diff (D-08), the 12/13 `tier`-instead-of-`cadence` data-shape edge handled via `UNKNOWN - verify` not fabrication (D-09).
- Exact script filename, table column headers/order, and an optional generated-by banner left to planner/executor within the locked decisions.

## Deferred Ideas

- Per-entry detail pages / richer metadata — set aside for the minimal single index; revisit if insufficient.
- Enriching kit frontmatter with `name`/`description` — rejected this phase (single-source + guard risk); could be revisited project-wide later.
- Folding catalog freshness into the foundation-guards aggregator / §14 gate — deferred in favor of a standalone script.
