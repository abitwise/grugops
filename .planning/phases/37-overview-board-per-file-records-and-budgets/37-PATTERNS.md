# Phase 37: Overview board, per-file records and budgets - Pattern Map

**Mapped:** 2026-10-21
**Files analyzed:** 22 (new + modified, grouped)
**Analogs found:** 20 / 22

All analog paths below were checked with `git ls-files` (tracked source; no mirrors).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `agent-factory/contracts/board.md` (mod, FIRST) | contract | n/a | itself (change protocol at lines ~248-249, ~558-559, ~580-581) | exact |
| `install/state-layout.ts` (mod) | config/constants | n/a | itself (`STATE_ROOTS` + `STATE_ROOT_COUNT` pin, lines 55-78) | exact |
| `install/state-layout.test.ts` (mod) | test | n/a | itself (two-sided count + one-segment rule amendment) | exact |
| `scripts/state-rules.ts` (new) | utility (pure predicates) | transform | `scripts/board-model.ts` (pure, import-free grammar) | role-match |
| `scripts/trace-model.ts` (new) | utility (pure) | transform | `scripts/trace-render.ts` (`classify`, `buildRows`, `renderTraceability`, lines 46-171) | exact (extract) |
| `scripts/generate-runnable-embeds.ts` (new) | generator | file-I/O | `scripts/generate-hook-manifest.ts` | exact |
| `scripts/runnable-embeds-freshness.ts` (new) | freshness gate | batch | `scripts/hook-manifest-freshness.ts` | exact |
| `scripts/runnable-ref/state-check.ts` (new) | runnable CLI | read-only | `scripts/runnable-ref/reference-check.ts` | exact |
| `scripts/runnable-ref/trace-render.ts` (new) | runnable CLI | file-I/O write | `scripts/runnable-ref/reference-check.ts` + `scripts/trace-render.ts` | role-match |
| `scripts/runnable-ref/state-roll.ts` (new) | runnable CLI | file-I/O write | `reference-check.ts` + `atomicWrite` in `scripts/context-io.ts:962` | role-match |
| `scripts/runnable-ref/*.test.ts` (new x3) | test | spawn | `scripts/runnable-ref/reference-check.test.ts`, `host-protection.test.ts` | exact |
| `scripts/trace-render.ts` (mod) | CLI | file-I/O | itself | exact |
| `scripts/trace-freshness.ts` (mod, directory compare) | freshness gate | batch | itself (`main()`, line 72) | exact |
| `scripts/validate-agent-factory.ts` (mod, budget check) | validator | batch | itself (`err`/`warn` lines 152-160, `checkTickets` line 720) | exact |
| `scripts/board-read.ts` + `scripts/board-model.ts` (mod, 7th source / SCHEMA_VERSION 3) | reader | read-only | itself (`SOURCE_NAMES` 463, `SOURCE_COUNT` 472, `TRACE_HEADER_CELL` 1860) | exact |
| `install/install.ts` (mod: `RUNNABLES` 5754, `seedState` 5691) | installer | file-I/O | itself | exact |
| `install/uninstall.ts` (mod: `RUNNABLES_MIRROR` 2795) | installer | file-I/O | itself | exact |
| pinned-count tests (`install/record-truth.test.ts:358`, `scripts/check-foundation-guards.test.ts:2279, 9816`, `scripts/check-state-paths.test.ts:324`) | test | n/a | themselves | exact |
| `.github/workflows/ci.yml`, `package.json` scripts | config | n/a | existing `freshness:*` scripts (package.json:16, 38-39) | exact |
| seed: `agent-factory/seed/memory-bank/plans/{board,nfr-catalog,traceability}.md`, `60-progress.md`, `{nfr,traceability,archive}/.gitkeep`, marker | seed docs | n/a | existing seed files | role-match |
| `agent-factory/workflows/05,09,12,16-*.md` + roles with `## Trace updates` | kit prose | n/a | themselves | exact |
| scan test: zero append-to-traceability instructions | test | n/a | none direct; derive set from `kit-model` | no analog |

## Pattern Assignments

### `scripts/generate-runnable-embeds.ts` (generator) — analog `scripts/generate-hook-manifest.ts`

Marker pair + rewrite returning `{changed, text}` (lines 18-19, 89-99):
```typescript
export const MANIFEST_OPEN = "// <hook-manifest> GENERATED — do not edit by hand; run `npm run generate:hook-manifest`";
export const MANIFEST_CLOSE = "// </hook-manifest>";

export function rewriteHookEntry(root: string = ROOT): { changed: boolean; text: string } {
  const src = readFileSync(path, "utf8");
  const a = src.indexOf(MANIFEST_OPEN);
  const b = src.indexOf(MANIFEST_CLOSE);
  if (a === -1 || b === -1) {
    throw new Error(`generate-hook-manifest: the manifest region markers are missing from ${path}`);
  }
  const next = src.slice(0, a) + renderManifestRegion(deriveManifest(root)) + src.slice(b + MANIFEST_CLOSE.length);
  return { changed: next !== src, text: next };
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) { const { changed, text } = rewriteHookEntry(); writeFileSync(HOOK_ENTRY_TS, text, "utf8"); ... }
```
Imports convention (lines 10-15): `node:` named imports, local `./is-entry.js`, `ROOT = join(import.meta.dirname, "..")`. Widen to: one spec table `{target, authority, roots}[]` with a pinned count; refuse non-`node:` imports in the closure; never embed `LEGACY_STATE_ROOT_REL`.

### `scripts/runnable-embeds-freshness.ts` — analog `scripts/hook-manifest-freshness.ts` (whole file, ~35 lines)
```typescript
if (isEntry) {
  try {
    const { changed } = rewriteHookEntry();
    if (changed) { console.log("Hook-manifest freshness check FAILED: ... Remedy: npm run generate:hook-manifest ..."); process.exit(1); }
    console.log(`Hook manifest fresh: ...`); process.exit(0);
  } catch (e) { console.log(`Hook-manifest freshness check FAILED: ${(e as Error).message}`); process.exit(1); }
}
```

### `scripts/runnable-ref/{state-check,trace-render,state-roll}.ts` — analog `scripts/runnable-ref/reference-check.ts`
Header comment states D-12 contract and builtins-only rule (lines 1-26). Exit contract (lines 28-55):
```typescript
import { readFileSync } from "node:fs";
const wantJson = process.argv.includes("--json");
const inputPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!inputPath) {
  process.stderr.write("Error: no input file path was provided. Usage: node reference-check.js <input-file> [--json]\n");
  process.exit(2);
}
// findings -> one line each (or --json {ok:false, findings}) -> exit 1; clean -> "No findings." exit 0
```
Hand-written part imports builtins as namespaces (`import * as nodeFs from "node:fs"`) so the embedded region's named imports never collide. Compiled `.js` committed beside it (see `reference-check.js`). Clear voice; finding lines name file, measured value, budget, unit.

`state-roll.ts` writes via the embedded/copied atomic shape from `scripts/context-io.ts:962-990` (`atomicWrite`: temp sibling `${finalPath}.tmp-${pid}-...`, `renameSync`, Windows EPERM/EEXIST/EACCES unlink-then-rename branch). Archive first, then source, then re-read and conservation check; restore old bytes on mismatch, exit 1.

### `install/install.ts` — `RUNNABLES` (line 5754) and `seedState` (line 5691)
```typescript
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ...
  ["scripts/runnable-ref/host-protection.js", "tools/grugops/host-protection.js"],
  ["LICENSE", "tools/grugops/LICENSE"],
];
```
Add three rows before `LICENSE`; mirror in `install/uninstall.ts:2795` `RUNNABLES_MIRROR` in the same commit (comment above 5754 requires editing the two together). Move `REMOVABLE_COUNT` 41 -> 44.

`seedState` marker gating (Pitfall 1) — copy the existing layout branch shape:
```typescript
const layout = stateLayout();
const skipStateRoot = layout === "pre-v3" || typeof layout === "object";
...
for (const rel of listSeedFiles(seed)) {
  if (skipStateRoot && rel.startsWith(`${STATE_ROOT_REL}/`)) continue;
  seedFile(join(seed, rel), join(TARGET, rel), rel);
}
```
Add: `if (rel === LAYOUT_MARKER_REL && layout !== "fresh") { report("skipped", ...); continue; }`. Test over a fixture holding `memory-bank/plans/board.md` with `GRUGOPS_HOME` set.

### `install/state-layout.ts` — analog itself (lines 55-78)
```typescript
export const STATE_ROOTS = Object.freeze([ "agent-factory", LEGACY_STATE_ROOT_REL, ... ] as const);
/** A pinned integer, not a derivation: install/state-layout.test.ts asserts it equals STATE_ROOTS.length in
 * both directions ... 2026-10-21, plan 36-01: ... */
export const STATE_ROOT_COUNT = 7;
```
New constants (`NFR_DIR_REL`, `TRACE_DIR_REL`, `ARCHIVE_REL`, `BOARD_DONE_ARCHIVE_REL`, `CONTEXT_ARCHIVE_REL`, `LAYOUT_MARKER_REL`, `LAYOUT_MARKER_CONTENT`, `BUDGETS`, `BUDGET_COUNT`) follow this exact form: template literal off `STATE_ROOT_REL`, `Object.freeze`, a pinned count with a dated docblock. See RESEARCH.md "Recommended additions". Module stays constants-only (no imports/functions).

### `scripts/validate-agent-factory.ts` — budget check
Severity channel (lines 152-160):
```typescript
const errors: string[] = []; const warnings: string[] = [];
const STRICT = process.argv.includes("--strict");
const err = (m: string): void => { errors.push(m); };
const warn = (m: string): void => { warnings.push(m); };
```
New `checkBudgets()` modelled on `checkTickets()` (line 720): read through `stateRead`/`stateListDir` with `*_REL` constants, parse board via `parseBoard(board)`, call `state-rules.ts` predicates, route each finding to `err` when `markerState === "valid"` else `warn`. Absent marker is informational (SCOPE-style stderr), never a warning (Pitfall 9).

### `scripts/trace-model.ts` / `scripts/trace-render.ts` / `scripts/trace-freshness.ts`
Extract from `scripts/trace-render.ts`: `isTicketRef` (61), `isTestRef` (67), `isCodeRef` (72), `classify` (80), `buildRows` (128), `renderTraceability` (161). Remove the `catch { continue; }` task swallow (lines ~132-136); report skip counts per arm. Index header first cell must be `Ticket` (`board-read.ts:1860 TRACE_HEADER_CELL`). `trace-freshness.ts` keeps its `main()` + `realpathSync(mkdtempSync(...))` mirror shape (lines 72-90) but compares a directory and renders from zero notes when roots are absent (no vacuous pass).

### `scripts/board-read.ts` — seventh source
```typescript
export const SOURCE_NAMES = [ "board","tickets","queue","context","traceability","config" ] // line 463
export const SOURCE_COUNT = 6; // line 472, "A seventh joined source is a decision recorded ... first"
```
Add `boardArchive` after contract edit; bump `SCHEMA_VERSION` (board-model.ts:60) to 3 and regenerate `scripts/fixtures/board-snapshot/expected-snapshot.json` in the same commit. Keep the import closure read-only (`scripts/board-readonly.test.ts`).

### State-rules embedding into runnables
`scripts/state-rules.ts` must import nothing (like `board-model.ts` `parseBoard` closure and `state-layout.ts`) so the generator can embed it verbatim. Context-io roots to embed: `readRawNotesWithSkips`, `recordFromParsed` (not `readContext`, which pulls `import.meta.dirname`).

## Shared Patterns

### Runnable exit contract
**Source:** `scripts/runnable-ref/reference-check.ts` header lines 16-23. **Apply to:** all three runnables. 0 pass, 1 finding, 2 could-not-run; `--json {ok, findings}`; clear voice.

### Generated region + freshness gate
**Source:** `scripts/generate-hook-manifest.ts` + `scripts/hook-manifest-freshness.ts`. **Apply to:** embeds in the three runnables; add the gate and `freshness:traceability` inside the existing ubuntu "Freshness gates + repo gates" run block in `.github/workflows/ci.yml` (no new step; guard at `check-foundation-guards.test.ts:11990-11999`), plus `package.json` scripts in the `"freshness:x": "tsc --outDir .tmp-build && node scripts/x.js"` form (package.json:38).

### Derive the set, assert the count
**Source:** `install/state-layout.ts:72-78` (`STATE_ROOT_COUNT`). **Apply to:** `BUDGET_COUNT`, embed spec table rows, runnable list, and every moved pin: `REMOVABLE_COUNT` (record-truth.test.ts:358), `NON_TEST_MODULE_COUNT` (check-foundation-guards.test.ts:2279, re-derive from `git ls-files '*.ts'`), `TRIPWIRE_MODULES` (9816), ownership list (check-state-paths.test.ts:324, admit holders only inside generated regions). Each moved pin gets a dated note.

### Atomic write
**Source:** `scripts/context-io.ts:962` `atomicWrite`. **Apply to:** trace-render writes and state-roll writes.

### Prose rewrite of `## Trace updates`
Keep the heading (prefix required by `ROLE_SECTIONS`/`WORKFLOW_SECTIONS`, validate-agent-factory.ts:243, 258); replace the body. Then run `generate:adapters`, `generate:catalog`, `generate:skill-twins`, `generate:host-entries` and their freshness gates.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| zero-append-instruction scan test | test | n/a | New prose scan; derive scan set from `kit-model` `listRoles`/`listWorkflows` + checklists + `AGENTS.md`, assert count |
| layout marker file (seed + own tree) | config | n/a | New one-line file `layout: v3`; contract in RESEARCH.md A1/A2 |

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `install/`, `agent-factory/`
**Files scanned:** ~15
**Pattern extraction date:** 2026-10-21
