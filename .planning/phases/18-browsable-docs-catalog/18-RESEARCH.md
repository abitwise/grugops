# Phase 18: Browsable Docs Catalog - Research

**Researched:** 2026-06-15
**Domain:** Deterministic markdown catalog generation + fail-closed freshness gate (TypeScript tooling layer, D-13 foundation)
**Confidence:** HIGH (every claim verified against the actual kit files and the two analog scripts on disk)

## Summary

Phase 18 ships a read-only TypeScript generator (`scripts/generate-catalog.ts` → committed `.js`) that parses the finished kit and emits `docs/catalog/README.md` — a roles table and a workflows table, each row linking to its source file — plus a standalone fail-closed freshness gate (`scripts/catalog-freshness.ts`) wired as its own `package.json` script. Both are near-clones of existing, battle-tested analogs: the generator mirrors `scripts/generate-asvs-checklist.ts` (read source → deterministic `lines.join("\n")` → `writeFileSync`, provenance header, fixed literal paths, fail-closed) and the freshness gate mirrors `scripts/freshness.ts` (regenerate-to-temp → byte-compare → exit non-zero on any drift OR generator failure, `toPosix` normalization, `import.meta.dirname` root). Zero npm deps; `node:` stdlib only; Node 22+ floor.

The single highest-value research finding is the resolution of the **workflow-count discrepancy** (Q1). There are **16 workflow FILES on disk** (`00-*` through `15-*`, `order` 0–15, contiguous, no gaps), but every v1.2 planning doc says "15 workflows." This is **NOT** an exclusion rule analogous to the `_`-prefix role rule — there is no excludable workflow file. It is a **prose counting label that lags the files by one** (lineage traced below). The generator MUST emit a deterministic count derived from the files it actually parses (16 numbered workflow files), and the planner should reconcile SC #3's "all 15 workflows" wording against that ground truth — recommended resolution below.

**Primary recommendation:** Build `generate-catalog.ts` as a structural twin of `generate-asvs-checklist.ts`; parse name from the `# Role:`/`# Workflow:` H1, summary from the first sentence of `## One job`/`## When to use`, and `tier`/`order`/`cadence` from the flat key:value frontmatter via a tiny stdlib slice+regex parser. Emit a count of **16 numbered workflows** (the files), flag the "15" prose mismatch for the planner to reconcile, and gate it with a `catalog-freshness.ts` clone of `freshness.ts`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read kit source files (roles/workflows) | Build tooling (`scripts/*.ts`) | — | grugops has no runtime; tooling is build-time Node executing committed `.js` |
| Parse frontmatter + body sections | Build tooling | — | stdlib string/regex only — no `js-yaml`/`gray-matter` (Out-of-Scope: no npm runtime deps) |
| Emit committed markdown catalog | Build tooling → committed artifact (`docs/catalog/README.md`) | — | Generated-not-hand-maintained; the artifact is what users read |
| Fail-closed drift detection | Build gate (`package.json` script) | — | Standalone script (D-07), NOT folded into `check-foundation-guards.ts` |
| Compiled `.js` drift detection | Existing `scripts/freshness.ts` tsc-output gate | — | The generator's own `.js` is auto-covered (it lands under `scripts/`, in the `freshness` OUTPUT_DIRS) — no extra work |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `node:fs`, `node:path`, `node:os`, `node:child_process` | Node 22+ | Read kit files, write catalog, temp-dir + byte-compare for freshness, spawn the generator | Zero-runtime-dep rule (CLAUDE.md Out-of-Scope: "Adding npm runtime dependencies… is out of scope"); every existing tooling script uses these exclusively [VERIFIED: read freshness.ts + generate-asvs-checklist.ts] |
| TypeScript (`tsc`) | `~6.0.3` (devDep) | Compile `.ts` → committed `.js` | D-13 ratified pivot; `package.json` `build: tsc`, `tsconfig.json` `include: scripts/**/*.ts` already covers a new `scripts/generate-catalog.ts` automatically [VERIFIED: read tsconfig.json + package.json] |
| Vitest | `~4.1.8` (devDep) | Behavioral oracle for the generator + freshness gate | Existing test idiom — `spawnSync` the committed `.js`, assert exit code + bytes [VERIFIED: read generate-asvs-checklist.test.ts + freshness.test.ts] |

### Supporting
No supporting libraries. The entire phase is stdlib + the existing toolchain. **Do not add any dependency** — doing so violates a CLAUDE.md hard Out-of-Scope boundary.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| stdlib slice+regex frontmatter parse | `gray-matter` / `js-yaml` | REJECTED — both are npm runtime deps, explicitly out of scope (CLAUDE.md Out-of-Scope table; CONTEXT.md). The kit frontmatter is flat `key: value`, so a 10-line parser is sufficient and faithful. |
| Single `docs/catalog/README.md` | split `roles.md` + `workflows.md` | REJECTED by D-04 — single index file, two tables. |

**Installation:** None. (Generator + gate are pure tooling on the existing toolchain.)

**Version verification:**
```
node --version          # v24.12.0 on this machine (satisfies engines >=22) [VERIFIED]
npx tsc --version       # Version 6.0.3 [VERIFIED]
```

## Package Legitimacy Audit

> Not applicable. This phase installs **no external packages**. It uses only `node:` stdlib builtins and the already-present devDependencies (`typescript`, `vitest`, `@types/node`). No registry lookup, no slopcheck, no new dependency line in `package.json`. Adding any runtime dep is an explicit CLAUDE.md Out-of-Scope violation.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────────┐
   agent-factory/        │           generate-catalog.ts (.js)          │
   roles/*.md  ──────────▶  1. readdirSync roles/, skip _*.md (D-03)    │
   (17, excl _switch)    │  2. readdirSync workflows/ (16 files 00-15)  │
   agent-factory/        │  3. per file: parse frontmatter (slice+regex)│
   workflows/*.md ───────▶     + H1 name + first-sentence summary       │
   (16, order 0-15)      │  4. sort: roles core→enterprise, A-Z within  │
                         │           workflows by `order` ASC           │
                         │  5. build lines[] (provenance header +       │
                         │     roles table + workflows table)           │
                         │  6. writeFileSync(OUT, lines.join("\n"))      │
                         └───────────────────┬─────────────────────────┘
                                             │ writes (fixed literal path)
                                             ▼
                                   docs/catalog/README.md  (committed)
                                             │
                          ┌──────────────────┴───────────────────┐
                          │      catalog-freshness.ts (.js)        │  standalone
                          │  1. mkdtempSync temp dir               │  npm script
                          │  2. run generator targeting temp OUT   │  (D-07 — NOT
                          │     (or import + redirect)             │   in foundation
                          │  3. byte-compare temp vs committed     │   guards)
                          │  4. exit 1 on drift OR generator fail  │
                          │     (fail-closed) ; exit 0 if identical │
                          └────────────────────────────────────────┘
       Separately: the generator's OWN compiled .js drift is caught by the
       existing scripts/freshness.ts gate (scripts/ is in its OUTPUT_DIRS).
```

### Recommended Project Structure
```
scripts/
├── generate-catalog.ts          # NEW — the generator (compiled → generate-catalog.js, committed)
├── generate-catalog.test.ts     # NEW — Vitest oracle (excluded from tsc build)
├── catalog-freshness.ts         # NEW — standalone freshness gate (→ catalog-freshness.js, committed)
└── catalog-freshness.test.ts    # NEW — Vitest oracle (RED-on-drift, fail-closed)
docs/
└── catalog/
    └── README.md                # NEW — the committed generated catalog (the artifact users read)
package.json                     # EDIT — add "generate:catalog" + "freshness:catalog" scripts
.gitattributes                   # EDIT (recommended) — pin docs/catalog/*.md to eol=lf (see Pitfall 3)
```
*(Filenames are Claude's Discretion per CONTEXT.md; the above mirrors the `generate-asvs-checklist` / `freshness` naming.)*

### Pattern 1: Deterministic generator (mirror generate-asvs-checklist.ts)
**What:** Read source → build a `string[]` of lines → `writeFileSync(OUT, lines.join("\n"), "utf8")`. Fixed literal `ROOT = join(import.meta.dirname, "..")` and literal SRC/OUT paths (never argv/env-derived — path-traversal mitigation). Fail-closed: a parse failure or a structural assertion miss (e.g., a file with no `# Role:` H1) prints a finding to stderr and `process.exit(1)` WITHOUT writing a partial.
**When to use:** The DOCS-01 generator core.
**Example (the proven shape, condensed from the real file):**
```typescript
// Source: scripts/generate-asvs-checklist.ts (VERIFIED on disk)
const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "docs/catalog/README.md");
const lines: string[] = [];
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
// …rows…
lines.push("");                       // trailing element → exactly one final "\n"
writeFileSync(OUT, lines.join("\n"), "utf8");
process.exit(0);
```

### Pattern 2: stdlib frontmatter parse (NO npm deps)
**What:** The kit frontmatter is a `---`-fenced block of flat `key: value` lines at byte 0 of every file (VERIFIED: every role + workflow file's first line is `---`). Slice between the first two `---` fences; for each line, `key: value` via a single regex.
**Example:**
```typescript
// Read-only, stdlib only. Returns { kind, tier?, order?, cadence? }.
function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);   // fence at byte 0
  const fm: Record<string, string> = {};
  if (!m) return fm;                                  // caller treats empty as a fail-closed signal
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}
```
*(All frontmatter values here are unquoted scalars — `core`, `enterprise`, `both`, `scrum`, integers `0`–`15`. No nested structures, no lists, no quoted strings. Confirmed across all 33 files.)*

### Pattern 3: H1 name extraction
**What:** Strip the `# Role: ` / `# Workflow: ` prefix from the first H1.
```typescript
const h1 = text.match(/^# (?:Role|Workflow): (.+)$/m);
const name = h1 ? h1[1].trim() : null;   // null → fail-closed (every file conforms; a miss = drift)
```
*(VERIFIED: all 17 roles match `^# Role: `, all 16 workflows match `^# Workflow: `.)*

### Pattern 4: First-sentence summary extraction (the subtle one — read Pitfall 1)
**What:** `## One job` (roles) and `## When to use` (workflows) are each a **single markdown line** (one paragraph, no hard wraps) containing **multiple sentences**. Take the first sentence.
```typescript
function firstSentence(section: string): string {
  const line = section.trim().split("\n")[0].trim();    // first non-empty line of the section body
  const dot = line.indexOf(". ");                       // first sentence boundary = ". "
  return dot === -1 ? line : line.slice(0, dot + 1);     // keep ITS period; do NOT re-append one
}
```
**Critical:** keep the period from the slice; do **not** append `"."`. If there is no `". "` (the sentence is the whole line, ending in a single `.`), `indexOf` returns -1 and you return the line as-is (which already ends in `.`). Appending would double it — see Pitfall 1.

### Anti-Patterns to Avoid
- **Splitting summaries on every `.`** — breaks on `AGENTS.md` (role agents-md-scribe) and `OWASP ASVS 5.0` (workflow 15). Split on `". "` (period-space), which neither token contains in a sentence-ending position. VERIFIED clean across all 33 files.
- **`os.EOL` / platform line endings** — use literal `"\n"`. `os.EOL` is `\r\n` on Windows and would make the byte-diff fail spuriously.
- **Deriving OUT/SRC from argv or env** — fixed literal paths only (path-traversal mitigation, mirrors both analogs).
- **Folding catalog freshness into `check-foundation-guards.ts`** — D-07 forbids it; standalone script.
- **Caveman voice on the freshness/generator stdout** — CLAUDE.md hard rule: build-safety surfaces are clear professional voice. (The catalog README content is documentation = clear voice too.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Regenerate-to-temp + byte-diff + fail-closed | A new freshness algorithm | Clone `scripts/freshness.ts` structure (`mkdtempSync`, `readFileSync().equals()`, `toPosix`, cleanup, exit codes) | It is already proven, tested (`freshness.test.ts`), and clear-voice; the catalog gate is a near-identical near-clone targeting `docs/catalog/` instead of tsc outputs |
| Deterministic markdown emit + provenance header | A bespoke emitter | Clone `generate-asvs-checklist.ts` (`lines: string[]` → `lines.join("\n")`, header comment, fixed paths, fail-closed) | Byte-reproducibility is the contract; this shape is proven byte-stable across runs (`generate-asvs-checklist.test.ts` test 2) |
| Vitest oracle for a child-CLI tool | A new test pattern | Clone the `spawnSync("node", [GEN_JS])` + assert `status`/`stdout`/bytes idiom | Both existing oracles use it; matches the "drive the committed .js, never the .ts" rule |

**Key insight:** Phase 18 is almost entirely **assembly of two existing patterns** against a new source set. The risk is in the *parse rules* (the count, the summary edge cases) and *byte-stability discipline*, not in inventing machinery.

## Runtime State Inventory

> This is a pure read-generator producing a new committed file. No rename/refactor of existing state. The relevant "state" is the hand-maintained counts the catalog must reconcile against — covered in Q1 below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — grugops ships no datastore. | none |
| Live service config | None — no external service holds a role/workflow count. | none |
| OS-registered state | None. | none |
| Secrets/env vars | None. | none |
| Build artifacts | The generator's own compiled `generate-catalog.js` + `catalog-freshness.js` are committed `.js` under `scripts/`, **auto-covered by the existing `scripts/freshness.ts` gate** (`OUTPUT_DIRS = ["install","scripts","hooks"]`). No extra freshness wiring for the compiled artifacts themselves. The new `docs/catalog/README.md` is covered by the NEW catalog-freshness gate (different mechanism — content drift, not compile drift). | none beyond the two new gates |
| **Hand-maintained counts (the drift surface the catalog documents)** | `orchestrator.md` carries "all 16 request types" + a 16-row workflow-map (00–15) + a 17-role identity; the **structure validator `scripts/validate-agent-factory.ts` is STALE** — its `ROLES` list has 16 entries (no `frontend-ui`) and its `WORKFLOWS` list has 14 entries (00–13, missing 14/15), with a now-false comment "there is no 14-*.md". | The catalog does NOT need to fix the validator (out of scope: no edits to non-catalog files). But the planner must NOT use the validator's frozen lists as the source of truth — they predate Phases 13/14. **Read the directory, not the validator.** |

## Common Pitfalls

### Pitfall 1: Double-period on single-sentence summaries
**What goes wrong:** A naive `firstSentence = line.split(". ")[0] + "."` produces `…turn its lessons into tickets..` for the `incident-responder` role, whose `## One job` is a single sentence with no internal `". "`.
**Why it happens:** `incident-responder`'s One job has no sentence boundary inside it; the split returns the whole line (already ending in `.`), then `+ "."` doubles it.
**How to avoid:** Use the `indexOf(". ")` slice that KEEPS the matched period and returns the line unchanged when there is no boundary (Pattern 4). Do not re-append `.`.
**Warning signs:** `..` anywhere in the generated catalog. (VERIFIED: only `incident-responder` triggers this among roles; all workflow first-sentences have an internal `". "` so they slice cleanly — but use the safe rule uniformly.)

### Pitfall 2: Period-in-content false sentence split
**What goes wrong:** Splitting on bare `.` truncates `Author and maintain the root \`AGENTS.md\`…` at `AGENTS` (role agents-md-scribe) and `…anchored to OWASP ASVS 5.0…` mid-sentence (workflow 15).
**Why it happens:** `AGENTS.md` and `5.0` contain `.` not followed by a space-then-capital sentence start.
**How to avoid:** Split on `". "` (period + space) only. VERIFIED: `AGENTS.md` is followed by `` `space `` (backtick), and workflow 15's first sentence ends (`…per milestone.`) *before* `OWASP ASVS 5.0` appears — so `". "` never false-splits across all 33 files.
**Warning signs:** A summary that ends mid-word or mid-token.

### Pitfall 3: Cross-platform line-ending drift on the committed markdown
**What goes wrong:** The freshness byte-diff passes on macOS/Linux but fails on a Windows checkout (or vice-versa) because git stored `docs/catalog/README.md` with CRLF while the generator emits LF.
**Why it happens:** `.gitattributes` currently pins `*.js` build outputs to `eol=lf` but says **nothing about `docs/**/*.md`**. The freshness diff is byte-for-byte (`Buffer.equals`).
**How to avoid:** (1) Generator emits literal `"\n"` only (never `os.EOL`); (2) **add `docs/catalog/*.md text eol=lf` (or `docs/catalog/README.md text eol=lf`) to `.gitattributes`** so the committed bytes are LF on every platform — exactly the precedent the existing `.gitattributes` set for `.js` outputs and for the same stated reason (freshness determinism). RECOMMENDED, low-risk, single line.
**Warning signs:** Freshness green locally, red in CI on a different OS; a diff showing only `\r` changes.

### Pitfall 4: Fail-open on a broken generator
**What goes wrong:** The freshness gate reports "fresh" when the generator actually crashed, masking real drift.
**Why it happens:** If the freshness script invokes the generator and ignores its exit status, a crash yields an empty/absent temp output that could be mishandled.
**How to avoid:** Mirror `freshness.ts` exactly: if the generator's regeneration step returns non-zero (or throws), print a finding and `process.exit(1)` — **never** fall through to "fresh." This is the D-07 "fail-closed" requirement and the `freshness.test.ts` Test 3 contract.
**Warning signs:** A stale catalog shipping with a green gate.

### Pitfall 5: Using the stale validator lists as the source set
**What goes wrong:** Catalog shows 16 roles / 14 workflows (the v1.0 counts) instead of the finished 17 / 16.
**Why it happens:** `scripts/validate-agent-factory.ts` `ROLES`/`WORKFLOWS` arrays were frozen in v1.0 and never updated for Phases 13/14 (VERIFIED: no `frontend-ui`, no `14-`/`15-` entries; comment still says "there is no 14-*.md").
**How to avoid:** Generate from `readdirSync` of the live directories (skip `_`-prefixed in `roles/`), not from any hardcoded list.
**Warning signs:** A count that matches the validator rather than the directory.

## Code Examples

### Reading the source set deterministically
```typescript
// Source: pattern derived from generate-asvs-checklist.ts + readdirSync usage in freshness.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");

const roleFiles = readdirSync(ROLES_DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))   // D-03: skip _role-switch-protocol.md
  .sort();
const workflowFiles = readdirSync(WORKFLOWS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();                                                   // 00..15 lexical == numeric here
```

### Deterministic ordering (D-08)
```typescript
// Roles: core group first, then enterprise; alphabetical (by display name) within each group.
roles.sort((a, b) => {
  if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;   // core before enterprise
  return a.name.localeCompare(b.name);                         // stable A-Z within group
});
// Workflows: by numeric `order` ascending (00..15). Tie-break impossible — order is unique 0-15.
workflows.sort((a, b) => a.order - b.order);
```

### Freshness gate (clone of freshness.ts, retargeted)
```typescript
// Source: scripts/freshness.ts (VERIFIED) — fail-closed regenerate-to-temp + byte-compare.
const tmp = mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"));
// Run the generator so it writes into <tmp> instead of docs/catalog/ (e.g. pass an OUT override
// via a documented internal hook, OR spawnSync the generator with a temp ROOT mirror — choose the
// shape that keeps OUT a fixed literal in normal runs; the test harness already shows the mirror idiom).
const committed = readFileSync(join(ROOT, "docs/catalog/README.md"));
const rebuilt   = readFileSync(join(tmp, "docs/catalog/README.md"));
const toPosix = (p: string) => p.split(sep).join("/");
if (!committed.equals(rebuilt)) {
  console.log(`STALE: ${toPosix("docs/catalog/README.md")} — committed catalog differs from a fresh regeneration. Run \`npm run generate:catalog\` and commit the result.`);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}
```
*Design note for the planner:* `freshness.ts` keeps OUT a fixed literal and rebuilds the whole tree to `--outDir tmp`. For the catalog, the cleanest faithful approach is to have the freshness gate **spawn the generator inside a temp mirror** (the exact idiom `generate-asvs-checklist.test.ts` already uses: `cpSync` the `.js` + the source dirs into `<tmp>/...`, run the mirrored `.js`, compare). This keeps the generator's OUT a fixed literal (path-traversal mitigation) and still produces a temp output to diff. The planner should pick mirror-spawn vs. a documented internal OUT-override and lock it as a decision.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.mjs` stdlib-Node generators | `.ts` → committed `.js`, freshness-gated | Phase 15 (D-13, 2026-06-13) | The DOCS-01 SC's "stdlib-only **Node** generator" wording predates this; the script is `.ts` not `.mjs`, but "stdlib-only / no npm deps" still holds (CONTEXT.md D-06) |
| 14 workflows / 16 roles (v1.0) | 16 workflow files (00–15) / 17 roles | Phases 13 (workflow 14 + frontend-ui) & 14 (workflow 15) | The validator's frozen lists were NOT updated — do not trust them (Pitfall 5) |

**Deprecated/outdated:**
- `scripts/validate-agent-factory.ts` `ROLES`/`WORKFLOWS` arrays — stale since Phase 13. Not in this phase's scope to fix; just don't read from them.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The intended **canonical** workflow count is the **16 numbered files** (00–15); "15 workflows" in the v1.2 docs is a lagging prose label, not an exclusion rule. | Q1 / Open Questions | If the project actually intends to *exclude* one workflow from the catalog, the table would have an extra row. Mitigated: there is no excludable file and the orchestrator map lists all 16 — strong evidence the count is the mismatch. Planner should confirm the reconciliation (recommended: catalog shows 16, prose updated) but this is a doc-label decision, not a code risk. |
| A2 | The summary = first sentence of `## One job` / `## When to use`, single-line body. | Pattern 4 | Verified across all 33 files; low risk. If a future kit file wraps the section across multiple lines, the "first non-empty line" rule still yields a sensible (possibly shorter) summary — acceptable, and freshness would catch any surprise. |
| A3 | Workflows 12/13 show `tier` and a `cadence` of `UNKNOWN - verify` (or a combined column) rather than a fabricated cadence. | D-09 / Q4 | D-09 forbids fabricating `cadence: both`. The column-presentation choice is Claude's Discretion; the no-fabrication floor is locked. |

## Open Questions

1. **The "15 vs 16 workflows" reconciliation (the one decision the planner must make).**
   - **What we know (all VERIFIED on disk):**
     - **16 workflow files exist:** `00-bootstrap-greenfield` … `15-security-audit`, `order` values `0,1,2,…,15` — contiguous, no dupes, no gaps.
     - **No excludable workflow file exists.** The `_`-prefix rule (D-03) applies only to `roles/` (`_role-switch-protocol.md`). Every workflow file is numbered `00`–`15`; none is a shared include or `_`-prefixed. So there is NO exclusion analog for workflows.
     - **The orchestrator workflow-map lists all 16** (`00`–`15`, including `14-ui-design-to-build.md` and `15-security-audit.md`) and counts "all 16 request types" (16 numbered workflows + the `install` classification, which has no numbered file).
     - **Count lineage:** v1.0 = "14 workflows" (files `00`–`13`). Phase 13 added file `14`, Phase 14 added file `15` → **16 files**. But the v1.2 ROADMAP/PROJECT/CONTEXT prose says "15 workflows." The "+2 files but +1 in prose" gap means the prose label is **off by one** — likely it counted "+1 for security, treating UI as already-implied," or simply mis-tallied. The roles count is internally consistent (17 = 18 files − 1 `_`-prefixed), but the workflow count is NOT (the docs say 15, the files say 16).
   - **What's unclear:** Whether "15" is the *intended* number (implying one file should be hidden) or a stale label. There is **no rule or file** that supports hiding a workflow — so the evidence points squarely at a lagging label, not a deliberate exclusion.
   - **Recommendation:** The generator should emit a count of **16 numbered workflows** (it parses the 16 files; fabricating "15" would violate no-fabrication and contradict the orchestrator's own map). For **SC #3** ("all 15 workflows … incl. 14 + 15"), reconcile by reading SC #3's *intent* — "reflect the finished set, including the two new workflows" — which the 16-file catalog satisfies completely (it includes workflows 14 and 15). The planner should either (a) note in the PLAN that the catalog correctly shows 16 and SC #3's "15" is a documentation typo to be corrected in passing, or (b) raise it as a one-line clarification to the user. **Do not** drop a workflow to force the number to 15. This is the single most important thing for the planner to get right.

2. **Freshness regeneration mechanism: mirror-spawn vs. OUT-override.**
   - **What we know:** `freshness.ts` rebuilds the whole tree to `--outDir tmp` (works because tsc owns the output layout). `generate-asvs-checklist.test.ts` uses a `cpSync`-mirror-into-`<tmp>` + run-the-mirrored-`.js` idiom to redirect output without touching the real tree.
   - **What's unclear:** Which idiom the catalog freshness gate should use to get a temp copy to diff while keeping the generator's OUT a fixed literal in normal runs.
   - **Recommendation:** Use the mirror-spawn idiom (proven in the ASVS test). Lock it as a plan decision. Keep OUT a fixed literal in the generator (path-traversal mitigation); the *gate* arranges the temp mirror.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node:` stdlib) | Generator + freshness gate runtime | ✓ | v24.12.0 (≥22 required) | — |
| TypeScript (`tsc`) | Compile `.ts` → committed `.js` | ✓ | 6.0.3 (devDep) | — |
| Vitest | Test oracles | ✓ | 4.1.8 (devDep) | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

> `workflow.nyquist_validation` not found in `.planning/config.json` context → treat as enabled. This phase is highly testable (deterministic generator + fail-closed gate) and warrants validation.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `~4.1.8` |
| Config file | `vitest.config.*` (present per Phase 15 scaffolding; `*.test.ts` excluded from tsc build) |
| Quick run command | `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts` |
| Full suite command | `npm test` (`vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | Generator writes `docs/catalog/README.md` + exits 0 over the real kit | unit | `npx vitest run scripts/generate-catalog.test.ts` | ❌ Wave 0 |
| DOCS-01 | Byte-reproducible: two regenerations are byte-identical (and equal committed bytes) | unit | same | ❌ Wave 0 |
| DOCS-01 | Catalog contains all 17 roles + all 16 workflows (incl. frontend-ui, workflows 14 & 15) | unit | same (assert row count + names) | ❌ Wave 0 |
| DOCS-01 | Fail-closed: a kit file with no `# Role:`/`# Workflow:` H1 → exit 1, no partial write (hermetic mirror) | unit | same | ❌ Wave 0 |
| DOCS-01 | No fabrication: workflow 12/13 cadence cell reads `UNKNOWN - verify` (or tier column), never `both` | unit | same (assert no fabricated cadence) | ❌ Wave 0 |
| DOCS-02 | Freshness exits 0 when committed catalog matches a fresh regeneration | unit | `npx vitest run scripts/catalog-freshness.test.ts` | ❌ Wave 0 |
| DOCS-02 | Freshness exits non-zero + names the file on planted drift | unit | same (RED fixture) | ❌ Wave 0 |
| DOCS-02 | Fail-closed: a broken generator → freshness exits non-zero, never "fresh" | unit | same (RED fixture) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts` (sub-second) + `npm run generate:catalog && npm run freshness:catalog`
- **Per wave merge:** `npm test` + `npm run freshness` (compiled-`.js` drift) + `npm run freshness:catalog` (content drift)
- **Phase gate:** Full suite green + both freshness gates green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/generate-catalog.test.ts` — covers DOCS-01 (writes/reproducible/complete-set/fail-closed/no-fabrication)
- [ ] `scripts/catalog-freshness.test.ts` — covers DOCS-02 (fresh/drift-RED/fail-closed-RED), cloned from `freshness.test.ts`
- Framework install: none — Vitest already present.

## Security Domain

> `security_enforcement` is ON. Proportionate model for a read-only markdown generator + a build-time gate. This is local file read + a single committed-file write + a temp dir. No network, no untrusted input beyond the project's own committed kit files.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface (build tooling) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Runs with the developer's own filesystem rights |
| V5 Input Validation | yes (light) | Parse defensively: a non-conforming kit file → fail-closed `exit(1)`, never a partial/garbled catalog. No content is `eval`'d or path-interpolated. |
| V6 Cryptography | no | No secrets, no crypto |
| V12 Files & Resources | yes | Fixed literal SRC/OUT paths joined to `import.meta.dirname` parent — never argv/env/content-derived (path-traversal mitigation, mirrors both analogs). Temp dir via `mkdtempSync` + guaranteed `rmSync(...,{recursive,force})` cleanup. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal on read/write (OUT or SRC derived from input) | Tampering | Fixed literal paths only; `ROOT = join(import.meta.dirname, "..")`; never read paths from argv/env/file content. (Proven idiom in generate-asvs-checklist.ts.) |
| Fail-open: broken generator → gate reports "fresh" | Tampering / repudiation | Fail-closed: generator non-zero exit OR throw ⇒ freshness `exit(1)`, never "fresh" (D-07; freshness.ts Test-3 contract). |
| Partial/garbled catalog written on a parse error | Tampering | Build the full `lines[]` first; only `writeFileSync` on success; on a structural miss (no H1, empty frontmatter where required), print finding + `exit(1)` WITHOUT writing (mirrors the ASVS row-count guard). |
| Temp-dir leak / collision | DoS (minor) | `mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"))` (unique per run) + `rmSync` cleanup in all exit paths (success AND failure), mirroring freshness.ts `cleanup()`. |
| Oversized/malicious kit file | DoS (negligible) | Inputs are the project's own committed, byte-ceiling-guarded role/workflow files (Phase 10/11 guards cap their size). No external/untrusted input. Out of proportionate scope. |

## Project Constraints (from CLAUDE.md)

| Directive | How it binds this phase |
|-----------|--------------------------|
| Tech stack = Markdown + TS tooling (`.ts` → committed `.js`), zero host runtime deps, `node:` stdlib only | Generator + gate are `.ts` compiled to committed `.js`; **no npm runtime dep may be added** (Out-of-Scope table explicitly names `gray-matter`, `js-yaml`). |
| No fabrication — `UNKNOWN - verify`; never fake a result | Workflows 12/13 absent `cadence` ⇒ `UNKNOWN - verify` (or tier column), never `both`. A missing summary/name ⇒ fail-closed, never invented. |
| Voice discipline — clear voice on build-safety/security surfaces | Freshness + generator stdout and the catalog content are clear professional voice, NOT caveman. (Build-safety surface hard rule.) |
| Single-source — role/workflow text lives once | The catalog reads the body sections read-only (D-01); it does NOT duplicate "One job" text into frontmatter or anywhere editable. |
| Installers/tooling: idempotent, reversible, never overwrite user content | The generator only writes the generated `docs/catalog/README.md` (its own output); re-running is a byte-identical no-op (the reproducibility contract). |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | A stdlib-only (no npm deps) generator produces a committed browsable in-repo markdown catalog (`docs/catalog/`) of every role + workflow from their frontmatter + body sections — no web UI, generated not hand-maintained, `UNKNOWN - verify` over invention | Patterns 1–4 (clone generate-asvs-checklist.ts; stdlib frontmatter parse; H1 + first-sentence extraction); parse-surface audit confirms all 17 roles + 16 workflows conform; D-09 no-fabrication for workflows 12/13 cadence; deterministic ordering (D-08) code example |
| DOCS-02 | A freshness check (regenerate-to-temp, diff, non-zero on drift) prevents catalog drift, wired so a stale catalog fails the build red | Clone `freshness.ts` (mirror-spawn temp regeneration, `Buffer.equals` byte-diff, fail-closed exit codes, `toPosix`); standalone `package.json` script (D-07, NOT in foundation guards); the compiled `.js` itself is auto-covered by the existing `scripts/freshness.ts` gate |
</phase_requirements>

## Sources

### Primary (HIGH confidence — all read directly on disk this session)
- `scripts/freshness.ts` — the freshness pattern: mkdtempSync, rebuild-to-temp, `Buffer.equals` byte-diff, fail-closed exit, `toPosix`, `import.meta.dirname` root, clear voice.
- `scripts/generate-asvs-checklist.ts` — the generator pattern: fixed literal paths, fail-closed load, `lines.join("\n")` deterministic emit, provenance header, single trailing `\n`.
- `scripts/generate-asvs-checklist.test.ts` + `scripts/freshness.test.ts` — the Vitest child-CLI oracle idiom (`spawnSync` the committed `.js`, hermetic temp mirror, RED-on-drift, fail-closed-RED).
- `scripts/validate-agent-factory.ts` (lines 116–173) — frozen (STALE) ROLES/WORKFLOWS lists; the source-of-the-count caution.
- `agent-factory/roles/*.md` (all 18) + `agent-factory/workflows/*.md` (all 16) — frontmatter, H1, and summary-section audit (the parse-surface ground truth).
- `agent-factory/roles/orchestrator.md` (workflow map, lines 91–112) — the CURRENT 16-row workflow map (00–15).
- `package.json`, `tsconfig.json`, `.gitattributes` — toolchain + LF-pin facts.
- `.planning/phases/18-browsable-docs-catalog/18-CONTEXT.md` (D-01..D-09), `.planning/REQUIREMENTS.md` (DOCS-01/02), `.planning/ROADMAP.md` (Phase 18 SCs), `.planning/PROJECT.md` (count lineage).

### Secondary / Tertiary
- None needed. Every claim is verified against in-repo files; no web research was required (the phase is entirely internal tooling against the project's own kit).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; both analog scripts read in full.
- Architecture / parse rules: HIGH — every role + workflow file's frontmatter, H1, and summary section inspected directly; edge cases (incident-responder double-period, agents-md-scribe/`5.0` period-in-content) found and resolved with VERIFIED rules.
- Workflow count (Q1): HIGH on the facts (16 files, order 0–15, no excludable file, orchestrator lists all 16, validator stale), MEDIUM only on *intent* (whether the "15" prose is a typo) — flagged as the one planner decision (A1 / Open Question 1).
- Pitfalls / security: HIGH — derived from the proven analogs and the actual byte/EOL facts.

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (stable — internal tooling against a frozen kit; the only volatility is if more roles/workflows are added, which this phase explicitly documents the *finished* set of).
