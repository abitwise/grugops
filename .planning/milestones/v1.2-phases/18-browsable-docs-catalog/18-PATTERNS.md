# Phase 18: Browsable Docs Catalog - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 6 (4 new, 2 modified)
**Analogs found:** 6 / 6 (all have a strong in-repo analog)

This phase is **assembly of two proven patterns** (the ASVS generator + the freshness gate) against a new source set (the kit's 17 roles + 16 workflows). There is no new machinery to invent. The risk surface is the *parse rules*, *deterministic ordering*, and *byte-stability discipline* — all of which map directly to load-bearing excerpts below. Every analog was read in full this session; every excerpt is verbatim with `file:line` references.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/generate-catalog.ts` (NEW) | generator (build tooling) | file-I/O / transform (read source → emit markdown) | `scripts/generate-asvs-checklist.ts` | exact (same role + flow) |
| `scripts/catalog-freshness.ts` (NEW) | build gate (drift detector) | batch / file-I/O (regen-to-temp → byte-diff → exit code) | `scripts/freshness.ts` | exact (same role + flow) |
| `scripts/generate-catalog.test.ts` (NEW) | test | request-response (spawn child `.js`, assert exit/bytes) | `scripts/generate-asvs-checklist.test.ts` | exact |
| `scripts/catalog-freshness.test.ts` (NEW) | test | request-response (spawn child `.js`, RED-on-drift) | `scripts/freshness.test.ts` | exact |
| `docs/catalog/README.md` (NEW) | generated artifact (documentation) | output (committed generator product) | `agent-factory/checklists/security-nfr-checklist.md` (the ASVS generator's output) | role-match |
| `package.json` (MODIFIED) | config (script registry) | n/a | `package.json` `scripts` block (existing `freshness`) | exact |
| `.gitattributes` (MODIFIED) | config (EOL pin) | n/a | `.gitattributes` existing `*.js eol=lf` lines | exact |

> Filenames `scripts/generate-catalog.ts` / `scripts/catalog-freshness.ts` and the `generate:catalog` / `freshness:catalog` script names are Claude's Discretion (CONTEXT.md). The names below mirror the `generate-asvs-checklist` / `freshness` precedent; the planner finalizes.

---

## Pattern Assignments

### `scripts/generate-catalog.ts` (generator, file-I/O / transform)

**Analog:** `scripts/generate-asvs-checklist.ts` — the proven "read source → build `string[]` → `lines.join("\n")` → `writeFileSync`" shape. Mirror it structurally; only the source set and the emit body change.

**Imports + fixed literal paths** (mirror `generate-asvs-checklist.ts:35-50`):
```typescript
// generate-asvs-checklist.ts:35-50 — copy this shape verbatim, retarget SRC dirs + OUT
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// add readdirSync to the import for the directory scan (see below)

const ROOT = join(import.meta.dirname, "..");          // repo root = scripts/ parent
const SRC = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json");
const OUT = join(ROOT, "agent-factory/checklists/security-nfr-checklist.md");
```
For the catalog, the retargeted constants are:
```typescript
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const WORKFLOWS_DIR = join(ROOT, "agent-factory/workflows");
const OUT = join(ROOT, "docs/catalog/README.md");
```
**Rule (security V12, both analogs):** SRC/OUT are FIXED literals joined to `import.meta.dirname`'s parent — NEVER argv/env/content-derived. This is the path-traversal mitigation; do not parameterize OUT in normal runs.

**Fail-closed helper** (verbatim from `generate-asvs-checklist.ts:59-62`):
```typescript
const fail = (m: string): never => {
  console.error(`  ERROR    ${m}`);
  process.exit(1);
};
```
Use this for: a kit file with no `# Role:`/`# Workflow:` H1, empty frontmatter where required, a `roles/` directory read failure. Print finding + `exit(1)` BEFORE any `writeFileSync` — never a partial write (mirrors the ASVS row-count guard at `generate-asvs-checklist.ts:87-91`).

**Deterministic source read** (RESEARCH.md Code Examples, D-03 exclusion baked in):
```typescript
const roleFiles = readdirSync(ROLES_DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))  // D-03: skip _role-switch-protocol.md
  .sort();
const workflowFiles = readdirSync(WORKFLOWS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();                                                  // 00..15 lexical == numeric, contiguous
```
VERIFIED on disk: `roles/` has 18 files (17 after dropping `_role-switch-protocol.md`); `workflows/` has 16 files `00-…` through `15-…`. Generate from `readdirSync`, NOT from the stale `scripts/validate-agent-factory.ts` lists (Pitfall 5 — those arrays froze at v1.0: 16 roles / 14 workflows, missing `frontend-ui` and `14`/`15`).

**Frontmatter parse — stdlib only, NO npm deps** (RESEARCH.md Pattern 2; the kit frontmatter is flat `key: value` at byte 0, VERIFIED across all 33 files):
```typescript
function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);   // fence at byte 0
  const fm: Record<string, string> = {};
  if (!m) return fm;                                  // empty → caller treats as fail-closed signal
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}
```
VERIFIED frontmatter shapes: roles `kind: role` + `tier: core|enterprise`; workflows `kind: workflow` + `order: <0-15>` + `cadence: both` — **except workflows 12 (release) and 13 (incident) which carry `tier: enterprise` and NO `cadence`** (D-09 edge, confirmed on disk this session).

**H1 name extraction** (RESEARCH.md Pattern 3; VERIFIED all 17 roles match `# Role: `, all 16 workflows match `# Workflow: `):
```typescript
const h1 = text.match(/^# (?:Role|Workflow): (.+)$/m);
const name = h1 ? h1[1].trim() : null;   // null → fail-closed (a miss = drift)
```

**First-sentence summary — the subtle one** (RESEARCH.md Pattern 4; read Pitfalls 1 & 2):
```typescript
function firstSentence(section: string): string {
  const line = section.trim().split("\n")[0].trim();   // first non-empty line of the section body
  const dot = line.indexOf(". ");                       // sentence boundary = period-SPACE
  return dot === -1 ? line : line.slice(0, dot + 1);     // keep ITS period; do NOT re-append "."
}
```
- Source section: `## One job` (roles), `## When to use` (workflows). Each is a single markdown line (one paragraph, multiple sentences).
- **Split on `". "` (period-space), never bare `.`** — bare `.` truncates `AGENTS.md` (role agents-md-scribe) and `OWASP ASVS 5.0` (workflow 15). VERIFIED clean across all 33 files.
- **Do NOT append `"."`** — `incident-responder`'s One job is a single sentence with no internal `". "` (VERIFIED: "…turn its lessons into tickets."). `indexOf` returns -1, you return the line as-is (already ending in `.`); appending would produce `..` (Pitfall 1).

**Deterministic ordering — MANDATORY for the byte-diff** (D-08, RESEARCH.md Code Examples):
```typescript
// Roles: core group first, then enterprise; alphabetical (by display name) within each group.
roles.sort((a, b) => {
  if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;
  return a.name.localeCompare(b.name);
});
// Workflows: numeric `order` ascending (0..15, unique — no tie-break needed).
workflows.sort((a, b) => a.order - b.order);
```

**Deterministic emit + provenance header + single trailing newline** (mirror `generate-asvs-checklist.ts:116-180`):
```typescript
// generate-asvs-checklist.ts:116-124 — header pattern (recommended per CONTEXT.md discretion note)
const lines: string[] = [];
lines.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->");
// …roles table rows, then workflows table rows…
lines.push("");                                  // trailing element → exactly one final "\n"
writeFileSync(OUT, lines.join("\n"), "utf8");    // generate-asvs-checklist.ts:176 — literal "\n", utf8
process.exit(0);                                  // generate-asvs-checklist.ts:180
```
- **Use literal `"\n"` only — never `os.EOL`** (Pitfall 3 / Anti-Pattern). `os.EOL` is `\r\n` on Windows and breaks the byte-diff.
- The single trailing `lines.push("")` before `join("\n")` yields exactly one terminal newline — matches the ASVS generator's contract (`generate-asvs-checklist.ts:174`).
- Each table row should link to its source file, e.g. `agent-factory/roles/orchestrator.md` (D-04).
- **No-fabrication on absent fields** (D-09): for workflows 12/13 with no `cadence`, emit `UNKNOWN - verify` (or a `tier` column) — NEVER fabricate `cadence: both`. Mirrors the ASVS "copied verbatim, never invented" rule.

**Final stdout line** (clear professional voice — build-safety surface, CLAUDE.md hard rule; mirror `generate-asvs-checklist.ts:177-179`):
```typescript
console.log(`generate-catalog: wrote ${roles.length} roles and ${workflows.length} workflows to ${OUT}`);
```

---

### `scripts/catalog-freshness.ts` (build gate, batch / file-I/O)

**Analog:** `scripts/freshness.ts` — regenerate-to-temp → byte-compare → fail-closed exit. A near-clone retargeting `docs/catalog/README.md` instead of the tsc `.js` outputs.

**Imports + repo-root + temp-dir setup** (verbatim shape from `freshness.ts:27-67`):
```typescript
// freshness.ts:27-39, 63-67
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"));   // unique per run (freshness.ts:63)
function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });                     // freshness.ts:65-67 — guaranteed
}
```

**Regeneration mechanism — mirror-spawn (LOCK THIS, RESEARCH.md Open Question 2 / Pattern in the ASVS test):**
The generator keeps OUT a fixed literal (path-traversal mitigation), so the gate cannot just pass it a temp path. Use the **mirror-spawn idiom** the ASVS test already proves (`generate-asvs-checklist.test.ts:90-113`): `mkdirSync` the temp layout, `cpSync` the generator `.js` + the `agent-factory/roles` + `agent-factory/workflows` source dirs into `<tmp>/...`, then `spawnSync("node", [mirroredGenJs])` so the generator writes to `<tmp>/docs/catalog/README.md`.
```typescript
// Lay out <tmp>/scripts/generate-catalog.js + <tmp>/agent-factory/{roles,workflows} + <tmp>/docs/catalog
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, "docs", "catalog"), { recursive: true });
cpSync(join(ROOT, "scripts", "generate-catalog.js"), join(tmp, "scripts", "generate-catalog.js"));
cpSync(join(ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), { recursive: true });
cpSync(join(ROOT, "agent-factory", "workflows"), join(tmp, "agent-factory", "workflows"), { recursive: true });
const r = spawnSync("node", [join(tmp, "scripts", "generate-catalog.js")], { encoding: "utf8" });
```

**Fail-closed on a broken generator** (CRITICAL — Pitfall 4 / D-07; mirror `freshness.ts:78-86`):
```typescript
// freshness.ts:78-86 — if the regen step is non-zero, NEVER fall through to "fresh"
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log("Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.");
  cleanup();
  process.exit(1);
}
```

**Byte-compare + `toPosix` + clear-voice finding** (verbatim shape from `freshness.ts:100-120`):
```typescript
const toPosix = (p: string): string => p.split(sep).join("/");        // freshness.ts:110
const committed = readFileSync(join(ROOT, "docs/catalog/README.md"));
const rebuilt   = readFileSync(join(tmp, "docs/catalog/README.md"));
cleanup();
if (!committed.equals(rebuilt)) {                                       // freshness.ts:102 — Buffer.equals
  console.log(`STALE: ${toPosix("docs/catalog/README.md")} — committed catalog differs from a fresh regeneration. Run \`npm run generate:catalog\` and commit the result.`);
  process.exit(1);                                                      // freshness.ts:119
}
console.log("Catalog fresh: docs/catalog/README.md matches a fresh regeneration.");
process.exit(0);                                                        // freshness.ts:122-125
```
- **Clean up in EVERY exit path** (success AND failure) — `freshness.ts` calls `cleanup()` before each `process.exit`.
- Findings in **clear professional voice**, NOT caveman (CLAUDE.md hard rule — build-safety surface; mirrors `freshness.ts` header comment lines 24-25).
- This script is **standalone** — NOT folded into `scripts/check-foundation-guards.ts` (D-07).

---

### `scripts/generate-catalog.test.ts` (test, request-response)

**Analog:** `scripts/generate-asvs-checklist.test.ts` — drive the COMMITTED `.js` (never the `.ts`), assert exit + bytes, hermetic temp-mirror for the fail-closed case.

**Harness scaffold** (verbatim shape from `generate-asvs-checklist.test.ts:20-46`):
```typescript
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GEN_JS = join(ROOT, "scripts", "generate-catalog.js");   // drive the COMMITTED .js
const OUT = join(ROOT, "docs", "catalog", "README.md");

const tmpDirs: string[] = [];
afterAll(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });
function out(r: SpawnSyncReturns<string>): string { return `${r.stdout ?? ""}${r.stderr ?? ""}`; }
```

**Test idioms to mirror** (one per RESEARCH.md Test Map row):
1. **Writes + exits 0 over the real kit, leaves tree clean** — `generate-asvs-checklist.test.ts:51-65`: read `before`, spawn, assert `status===0`, assert regenerated bytes equal `before` (parity → no-op), restore in `finally`.
2. **Byte-reproducible** — `generate-asvs-checklist.test.ts:68-83`: spawn twice, assert `second.equals(first)` AND `second.equals(before)`.
3. **Complete set** — assert the output contains all 17 role names (incl. `frontend-ui`) + all 16 workflow names (incl. workflows 14 & 15); assert row counts.
4. **Fail-closed: a kit file with no H1 → exit 1, no partial write** — clone the hermetic mirror at `generate-asvs-checklist.test.ts:89-119`: `mkdtempSync` + `mkdirSync`/`cpSync` the generator `.js` + a *tampered* source dir (one role file with its `# Role:` line stripped) into `<tmp>`, plant a SENTINEL at the temp OUT, spawn the mirrored `.js`, assert `status===1` AND the sentinel survives unchanged (`readFileSync(outPath) === sentinel`).
5. **No fabrication** — assert the workflow 12/13 cadence cell reads `UNKNOWN - verify` (or a tier column) and the catalog contains no fabricated `cadence: both` for those two.

---

### `scripts/catalog-freshness.test.ts` (test, request-response)

**Analog:** `scripts/freshness.test.ts` — exit-code-as-signal contract, planted-drift RED fixture, restore in `afterEach`/`finally`.

**Harness scaffold** (verbatim from `freshness.test.ts:11-24`):
```typescript
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "catalog-freshness.js");
const CATALOG = join(ROOT, "docs", "catalog", "README.md");
function runFreshness() { return spawnSync("node", [FRESHNESS_JS], { cwd: ROOT, encoding: "utf8" }); }
```

**Test idioms to mirror** (one per RESEARCH.md Test Map / Pitfall 4):
1. **Fresh** — `freshness.test.ts:38-42`: run, assert `status===0`, assert stdout contains "fresh".
2. **RED on drift** — `freshness.test.ts:44-54`: plant a byte into the committed `docs/catalog/README.md`, run, assert `status !== 0` AND stdout contains `STALE:` and `docs/catalog/README.md`; **restore the original bytes in `afterEach`** (capture `original = readFileSync(CATALOG)` before mutating — `freshness.test.ts:30-36`).
3. **Fail-closed RED on a broken generator** — `freshness.test.ts:56-70`: arrange the generator to fail under the gate (e.g. plant a non-conforming kit file the gate's mirrored generator will reject, or otherwise force the regen `spawnSync` non-zero), run, assert `status !== 0` AND stdout does NOT contain the "fresh" success string; clean up the planted artifact in `finally`.

---

### `docs/catalog/README.md` (generated artifact)

**Analog:** `agent-factory/checklists/security-nfr-checklist.md` (the ASVS generator's committed output). This file is **never hand-written** — it is committed solely as the deterministic product of `generate-catalog.ts`. The plan should: (1) run `npm run generate:catalog` once to create it, (2) commit the exact bytes, (3) let `catalog-freshness` prove it stays in sync. Treat any manual edit as drift. `docs/` already exists (`docs/design/`, `docs/faq.md`); `docs/catalog/` is the new subdir.

---

### `package.json` (MODIFIED — script registry)

**Analog:** the existing `scripts` block at `package.json:8-13`, specifically the `freshness` line:
```json
// package.json:8-13 (current)
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "freshness": "tsc --outDir .tmp-build && node scripts/freshness.js"
}
```
**Add two lines** mirroring this shape (the committed `.js` is what runs, so the catalog freshness must build first too):
```json
"generate:catalog": "tsc --outDir .tmp-build && node scripts/generate-catalog.js",
"freshness:catalog": "tsc --outDir .tmp-build && node scripts/catalog-freshness.js"
```
- The script names are Claude's Discretion (CONTEXT.md) — `generate:catalog` / `freshness:catalog` match the `freshness` precedent; the planner finalizes.
- **No new `devDependencies`, no `dependencies`** — RESEARCH.md Package Legitimacy Audit: zero packages added. `typescript` + `vitest` + `@types/node` already present (`package.json:14-18`).
- The generator's own compiled `generate-catalog.js` + `catalog-freshness.js` land under `scripts/`, so the EXISTING `npm run freshness` gate auto-covers their `.js` drift (`freshness.ts:43` `OUTPUT_DIRS = ["install","scripts","hooks"]`). No wiring needed for the compiled artifacts themselves.

---

### `.gitattributes` (MODIFIED — EOL pin)

**Analog:** the existing `*.js eol=lf` lines at `.gitattributes:10-12`:
```gitattributes
// .gitattributes:10-12 (current)
install/*.js    text eol=lf
scripts/**/*.js text eol=lf
hooks/*.js      text eol=lf
```
**Add one line** (Pitfall 3 / RESEARCH finding #5 — the byte-diff is `Buffer.equals`; without this the freshness gate goes red on a Windows checkout where git stored CRLF):
```gitattributes
docs/catalog/README.md text eol=lf
```
- Same rationale as the existing `.js` pins (already documented in the `.gitattributes` header comment lines 1-9): keep the freshness byte-diff deterministic across platforms.
- Pairs with the generator emitting literal `"\n"` and `tsconfig.json:9` `"newLine": "lf"` (the two-part LF discipline the header comment describes).

---

## Shared Patterns

### Fixed-literal path resolution (path-traversal mitigation, ASVS V12)
**Source:** `scripts/generate-asvs-checklist.ts:48-50` and `scripts/freshness.ts:39`
**Apply to:** both `generate-catalog.ts` and `catalog-freshness.ts`
```typescript
const ROOT = join(import.meta.dirname, "..");   // repo root from the script's own location
// SRC/OUT are FIXED literals joined to ROOT — never argv/env/file-content-derived.
```

### Fail-closed exit discipline
**Source:** `scripts/generate-asvs-checklist.ts:59-91` (generator), `scripts/freshness.ts:78-86` (gate)
**Apply to:** both scripts
- Generator: build the full `lines[]` FIRST; only `writeFileSync` on success; on a structural miss (no H1, empty required frontmatter) print a finding + `process.exit(1)` WITHOUT writing.
- Gate: a non-zero regen exit (or throw) ⇒ `process.exit(1)`, NEVER fall through to "fresh" (D-07).

### Deterministic markdown emit
**Source:** `scripts/generate-asvs-checklist.ts:116-176`
**Apply to:** `generate-catalog.ts`
- `const lines: string[] = []` → push rows → `writeFileSync(OUT, lines.join("\n"), "utf8")`.
- Literal `"\n"` only (never `os.EOL`). One trailing `lines.push("")` for the single terminal newline. Provenance header comment at the top.

### Temp-dir lifecycle
**Source:** `scripts/freshness.ts:63-67, 84, 107` and `generate-asvs-checklist.test.ts:39-42, 90`
**Apply to:** `catalog-freshness.ts` and both test files
- `mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"))`; `rmSync(tmp, { recursive: true, force: true })` in EVERY exit path (success and failure). Tests collect temp dirs in an array and `rmSync` them in `afterAll`/`afterEach`.

### Child-CLI Vitest oracle
**Source:** `scripts/generate-asvs-checklist.test.ts:51-53` and `scripts/freshness.test.ts:19-24`
**Apply to:** both test files
- `spawnSync("node", [<COMMITTED .js>], { cwd: ROOT, encoding: "utf8" })` — drive the committed `.js`, never the `.ts`. Assert `r.status`, `r.stdout`, and `Buffer.equals` on output bytes.

### Clear professional voice on build-safety surfaces
**Source:** `scripts/freshness.ts:24-25` (header), all `console.log` findings
**Apply to:** generator stdout, gate stdout, AND the catalog README content
- CLAUDE.md hard rule: build-safety/security surfaces are clear voice, NOT caveman. The catalog is documentation = clear voice too.

### No-fabrication (`UNKNOWN - verify`)
**Source:** `scripts/generate-asvs-checklist.ts:13` ("never invented, never paraphrased") + D-09
**Apply to:** `generate-catalog.ts` workflow 12/13 cadence cell
- Workflows 12 (release) and 13 (incident) carry `tier: enterprise` and NO `cadence` (VERIFIED on disk). Emit `UNKNOWN - verify` (or a `tier` column) — never fabricate `cadence: both`.

---

## No Analog Found

None. Every new/modified file has a strong in-repo analog (the phase is deliberately an assembly of two proven patterns). No file needs to fall back to RESEARCH.md's abstract code examples — though RESEARCH.md Patterns 2-4 (frontmatter parse, H1 extract, first-sentence) supply the *new* parse logic that has no direct line-for-line analog (the ASVS generator parses JSON, not markdown frontmatter). Those three parse helpers are the only genuinely new code; everything around them is cloned.

## Planner Decisions to Lock (carried from RESEARCH.md Open Questions)

1. **Workflow count: emit 16 (the files on disk), not 15.** The "15 workflows" prose in v1.2 docs is a lagging label, not an exclusion rule — there is no excludable workflow file (`_`-prefix rule applies only to `roles/`), and the orchestrator map lists all 16. Generate from the directory. Reconcile SC #3's "15" as a doc typo; do NOT drop a workflow to force the number. (RESEARCH Q1 / A1 — the single most important call.)
2. **Freshness regeneration: mirror-spawn, not OUT-override.** Keep the generator's OUT a fixed literal; the gate arranges the temp mirror via `cpSync` (the idiom `generate-asvs-checklist.test.ts:90-113` already proves). (RESEARCH Q2.)
3. **Workflow table column for the 12/13 edge:** `cadence` column showing `UNKNOWN - verify`, OR a combined `cadence/tier` column, OR a separate `tier` column — Claude's Discretion (D-09), but the no-fabrication floor (`UNKNOWN - verify`, never `both`) is locked.

## Metadata

**Analog search scope:** `scripts/` (4 analog files read in full), `package.json`, `tsconfig.json`, `.gitattributes`, `agent-factory/roles/` + `agent-factory/workflows/` (parse-surface ground truth sampled this session).
**Files scanned:** 9 read in full + directory listings + 6 kit-file samples (orchestrator, incident-responder, workflows 00/12/13/14/15) for edge-case verification.
**Pattern extraction date:** 2026-06-15
