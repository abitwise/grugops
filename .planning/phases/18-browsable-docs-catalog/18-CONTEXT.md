# Phase 18: Browsable Docs Catalog - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

A generator emits a **browsable in-repo markdown catalog** of the finished kit — all **17 roles** (incl. `frontend-ui`) and **15 workflows** (incl. workflow 14 UI design→build + workflow 15 security-audit) — committed under `docs/catalog/`, plus a **freshness check that fails the build red on drift**. The catalog is generated, never hand-maintained; it is something users *read*.

Delivers DOCS-01 (the generator + committed catalog) and DOCS-02 (the freshness gate). Runs last in v1.2 so it documents the completed role/workflow set.

**Out of scope (hard boundaries, not to be reopened):**
- No web UI / dashboard / site — markdown only, in-repo (the file-based boundary).
- No fabrication — `UNKNOWN - verify` for any genuinely missing field; never invent a description.
- No edits to the 17 role / 15 workflow kit files (see D-01) — this is a pure read-generator.
- No new frontmatter fields added to the kit files (see D-01).

</domain>

<decisions>
## Implementation Decisions

### Content source — how the generator reads each entry
- **D-01:** The generator **parses body sections read-only**. Name comes from the `# Role:` / `# Workflow:` H1 heading; the one-line summary comes from the first sentence/line of `## One job` (roles) and `## When to use` (workflows). Structured metadata (`kind`, `tier`, `order`, `cadence`) comes from frontmatter. **No edits to any of the 32 kit files; no new frontmatter fields.** This preserves single-source (the "one job" text is NOT duplicated into frontmatter) and avoids tripping the Phase-10/11 foundation guards (byte ceilings, voice-lint, caveman-preserved, role-size).
- **D-02:** "From their frontmatter" (the DOCS-01 / ROADMAP SC wording) is **reinterpreted** as "from frontmatter (`kind`/`tier`/`order`/`cadence`) **plus the conventional body sections** (heading + `## One job` / `## When to use`)." The literal frontmatter holds no descriptive fields today, so a frontmatter-only catalog would be near-empty. The planner should treat this reinterpretation as the contract, not the literal SC wording.
- **D-03:** Exclude `agent-factory/roles/_role-switch-protocol.md` — it is a shared include, not a role (the canonical "17 roles" count already excludes it). Rule of thumb the generator uses: skip `_`-prefixed files in `roles/`.

### Catalog layout & detail depth
- **D-04:** **Single index file** — `docs/catalog/README.md` containing a **roles table** and a **workflows table**. Each row links to its kit source file (e.g. `agent-factory/roles/orchestrator.md`). No per-entry detail pages, no split roles.md/workflows.md.
- **D-05:** **Minimal detail per entry.** Roles table columns: name, tier (`core`/`enterprise`), one-line summary, source link. Workflows table columns: name, order, cadence, one-line summary, source link. Keeps the drift surface small.

### Generator language & placement (carried forward + locked)
- **D-06:** Generator is **TypeScript on the D-13 foundation**: `.ts` source compiled with `tsc` to a committed `.js`, run with bare Node, **zero npm runtime deps** (`node:` stdlib builtins only) — consistent with every other tooling script. The DOCS-01 SC's "stdlib-only **Node** generator" wording predates the Phase-15 TS pivot; "stdlib-only / no npm deps" still holds, but the script is `.ts`, **not** a `.mjs`. Suggested placement: `scripts/generate-catalog.ts` (planner may finalize the name), alongside `generate-asvs-checklist.ts`. Its committed `.js` is automatically covered by the existing `scripts/freshness.ts` tsc-output gate (no extra work for that layer).

### Freshness check (DOCS-02)
- **D-07:** **Standalone `npm run` script** mirroring `scripts/freshness.ts`: regenerate the catalog to a throwaway temp dir → byte-diff against the committed `docs/catalog/` → exit non-zero on any drift (or on a generator failure — **fail-closed**, a broken generator never reports "fresh"). Registered as its own `package.json` script so a stale catalog fails the build red. NOT folded into the foundation-guards aggregator.
- **D-08:** **Deterministic output ordering is mandatory** (the byte-diff requires it): workflows sorted by `order` ascending; roles grouped core-then-enterprise, alphabetical within each group. The freshness diff is byte-for-byte, so generation must be stable across runs.

### Known data-shape edge
- **D-09:** Workflows **12 (release)** and **13 (incident)** carry `tier: enterprise` in frontmatter **instead of** `cadence`. The generator emits whatever frontmatter is actually present and writes `UNKNOWN - verify` for a genuinely absent field rather than guessing a value. (The researcher/planner should decide whether the workflows table shows a `tier` column, a combined `cadence/tier` column, or `UNKNOWN - verify` in the cadence cell — but it must not fabricate `cadence: both` for these two.)

### Claude's Discretion
- Exact script filename(s), the precise table column order/headers, and the markdown table styling — planner/executor decide within D-04/D-05/D-08.
- Whether the catalog README carries a generated-by-`<script>`-do-not-edit banner (recommended, consistent with the ASVS checklist's provenance header) — planner's call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` § "Phase 18: Browsable Docs Catalog" — goal + the 3 success criteria (note: SC wording "stdlib-only Node generator" / "from their frontmatter" is reconciled by D-02 + D-06 above).
- `.planning/REQUIREMENTS.md` — DOCS-01 (generator + committed catalog) and DOCS-02 (freshness check).

### Closest analogs to mirror (DO read before implementing)
- `scripts/freshness.ts` — the **freshness pattern to mirror for DOCS-02**: regenerate-to-temp → byte-diff → non-zero on drift, fail-closed on a broken build, `node:` stdlib only, `import.meta.dirname` repo-root resolution, clear professional voice on findings.
- `scripts/generate-asvs-checklist.ts` — the **closest generator analog for DOCS-01**: a stdlib-Node TS generator that reads a source and emits committed markdown reproducibly (provenance header pattern).

### TS-tooling constraint (resolves the stale SC wording)
- `CLAUDE.md` § Constraints "Tech stack" + `.planning/PROJECT.md` § Constraints — D-13 ratified TS pivot: all tooling is `.ts` → committed `.js`, freshness-gated, zero host runtime deps.
- `package.json` — existing scripts (`build` / `typecheck` / `test` / `freshness`); the new catalog generator + catalog-freshness scripts register here.
- `tsconfig.json` — the compile `include` set (currently `install` / `scripts` / `hooks`); a `scripts/generate-catalog.ts` is covered automatically.

### The source set to catalog
- `agent-factory/roles/*.md` — 17 roles (exclude `_role-switch-protocol.md` per D-03).
- `agent-factory/workflows/*.md` — 15 workflows (`00`–`15`, ordered by the `order` frontmatter field).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`scripts/freshness.ts`**: directly reusable shape for the catalog freshness gate — temp-dir regenerate, byte-compare, fail-closed, `toPosix` path normalization, `import.meta.dirname` root. The catalog-freshness script can be a near-clone targeting `docs/catalog/` instead of the tsc build outputs.
- **`scripts/generate-asvs-checklist.ts`**: template for a "read source → emit committed markdown" generator (deterministic output + provenance header).
- **`package.json` scripts block**: where `generate-catalog` + the catalog-freshness check register; `freshness` already gates committed `.js` drift, so the generator's compiled output is covered for free.

### Established Patterns
- All tooling: `.ts` source → committed `.js` via `tsc`, drift-gated by `npm run freshness`. Zero npm runtime deps (`node:` builtins only). Node 22+ floor (`import.meta.dirname`).
- **Clear professional voice** on build-safety surfaces (freshness/guard output) — NOT caveman voice (CLAUDE.md hard rule). The catalog README content is documentation/clear voice too.
- Frontmatter data shapes the generator parses:
  - Roles: `kind: role`, `tier: core|enterprise`. Name in `# Role: <X>` heading; summary in `## One job`.
  - Workflows: `kind: workflow`, `order: <N>`, `cadence: both|scrum` — **except** 12/13 which use `tier: enterprise` (see D-09). Name in `# Workflow: <X>` heading; summary in `## When to use`.

### Integration Points
- New `docs/catalog/README.md` (committed output) — `docs/` already exists (`docs/design/`, `docs/faq.md`, etc.); `docs/catalog/` is new.
- New `package.json` script(s) for generate + freshness; the freshness step is wired so a stale catalog fails the build red.
- The foundation-guards aggregator (`scripts/check-foundation-guards.ts`) is NOT extended (per D-07 the catalog freshness is a standalone script).

</code_context>

<specifics>
## Specific Ideas

- The catalog is the v1.2 capstone: it should visibly reflect the *finished* set — 17 roles incl. `frontend-ui`, 15 workflows incl. 14 (UI design→build) + 15 (security-audit). A reader should be able to confirm "the whole kit is here" at a glance.
- Mirror the existing tooling's discipline ethos: deterministic, reproducible, fail-closed, no fabrication (`UNKNOWN - verify`), clear voice on the gate output.

</specifics>

<deferred>
## Deferred Ideas

- **Per-entry detail pages / richer metadata** (agents-involved, inputs, reads/writes per entry) — considered and set aside in favor of the single minimal index (D-04/D-05). A future phase could expand the catalog if the minimal index proves insufficient.
- **Enriching kit frontmatter with `name`/`description` fields** — explicitly rejected for this phase (D-01) to preserve single-source and avoid touching guarded files; could be revisited project-wide if frontmatter ever needs to be machine-consumed beyond the catalog.
- **Folding catalog freshness into the foundation-guards aggregator / §14 gate** — considered; deferred in favor of a standalone script (D-07). A later phase could route it through the gate if gate-cohesion becomes desirable.

</deferred>

---

*Phase: 18-browsable-docs-catalog*
*Context gathered: 2026-06-15*
