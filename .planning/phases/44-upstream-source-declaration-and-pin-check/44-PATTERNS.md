# Phase 44: Upstream source declaration and pin check - Pattern Map

**Mapped:** 2026-11-24
**Files analyzed:** 17 (6 new, 11 modified, plus the registration-walk pins listed in RESEARCH § Registration walk)
**Analogs found:** 17 / 17

All analog paths below were checked with `git ls-files` (tracked source; no install mirrors).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/upstream-model.ts` (+ `.js`, `.test.ts`) NEW | utility (pure authority) | transform (parse, decide) | `scripts/board-model.ts` | exact (role) |
| `scripts/runnable-ref/upstream.ts` (+ `.js`, `.test.ts`) NEW | host runnable / CLI | request-response, file-I/O, subprocess | `scripts/runnable-ref/note.ts` (shape, exit contract), `scripts/runnable-ref/host-protection.ts` (`runGh` spawn), `scripts/runnable-ref/claim.ts` (config read) | exact |
| `agent-factory/contracts/upstream.md` NEW | contract (markdown) | n/a | `agent-factory/contracts/context-note.md` | exact |
| `agent-factory/workflows/20-upstream-sources.md` NEW | workflow (markdown) | n/a | `agent-factory/workflows/17-task-claim.md` | exact |
| `scripts/trace-model.ts` MOD | utility | transform | itself, lines 249-297 | n/a (edit in place) |
| `scripts/generate-runnable-embeds.ts` MOD | config/generator table | batch | the `note.ts` row, lines 395-420 | exact |
| `scripts/validate-agent-factory.ts` MOD | validator arm | request-response | `checkpoints` arm, lines 795-840 | exact |
| `install/install.ts` MOD | installer table | file-I/O | `RUNNABLES` note row, line 6872 | exact |
| `install/uninstall.ts` MOD | uninstaller table | file-I/O | `RUNNABLES_MIRROR` note row, line 2807 | exact |
| `install/state-layout.ts` MOD (optional, `BUILD_REQUESTS_REL`) | config constant | n/a | `BOARD_REL` / `TICKETS_REL`, lines 38-50 | exact |
| `scripts/runnable-ref/runnable-exit-contract.test.ts` MOD | test | n/a | itself, lines 68-127 | exact |
| `scripts/trace-model.test.ts` MOD | test | n/a | existing classifyRef cases | exact |
| `agent-factory/workflows/17-task-claim.md` MOD | workflow | n/a | § Session start, lines 81-87 | n/a |
| `agent-factory/config/factory.config.md` MOD | config doc | n/a | `checkpoints` row line 14, `### checkpoints sub-fields` line 187 | exact |
| `agent-factory/roles/orchestrator.md` MOD | role | n/a | § Reads line 17 | n/a |
| `AGENTS.md` MOD | substrate | n/a | lines 38-45 (C-28-015/016) — insert after, never inside | n/a |
| Registration pins (`kit-model.ts` WORKFLOW_COUNT, lexicon/banned-claims counts, audit register, install census tests, `check-foundation-guards.test.ts` 74→75) | config/test pins | n/a | see RESEARCH § Registration walk table | exact |

## Pattern Assignments

### `scripts/upstream-model.ts` (pure authority)

**Analog:** `scripts/board-model.ts`

Normalization — reuse, do not re-spell (board-model.ts lines 728-731; a test pins one occurrence of the fold, so import `normalizeDocument` rather than copy it):
```typescript
export function normalizeDocument(text: string): string {
  const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return withoutMark.split("\r\n").join("\n");
}
```
- Parse entry points take text and return a typed model (`parseBoard(text, options)` line 769, `parseTicketDocument(text)` line 1204). Mirror as `parseManifest(text)` returning either rows or a named refusal with line number.
- Row matching helpers are private functions (`matchRow` line 692, `idPrefixOf` line 675); keep the manifest table reader private and export only the parse result.
- ID grammar mirrors `TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/` (board-model.ts ~151).
- Must import only `node:` builtins plus row-sibling authorities (`./trace-model.js` for `UPSTREAM_REF_PREFIX`), so the embed generator accepts it.
- Exports per RESEARCH Pattern 1: `parseUpstreamConfig`, `sourcePathFindings`, `parseManifest`, `pinState`, `upstreamRef`/`isUpstreamRef`, `gitBlobId`, `fenceLines`, `UPSTREAM_READ_MAX_BYTES = 65536`. Code for `fenceLines` and `gitBlobId` is in RESEARCH § Code Examples.

---

### `scripts/runnable-ref/upstream.ts` (host runnable)

**Analog (shape + exit contract):** `scripts/runnable-ref/note.ts`

Header comment style (lines 1-20): `// upstream.ts — <what> (phase 44, plan 44-NN, UP-0x, D-xx).` then `WHAT IT IS.` paragraph, then `THE D-12 CONTRACT` listing exit 0/1/2 and the exact stdout lines.

Generated region (line 82-87) — leave for the generator, never hand-edit:
```typescript
// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
export const RUNNABLE_SET_STAMP = "sha256:...";
// </runnable-embeds>
```

Exit-2 handlers (lines 2738-2761):
```typescript
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));

function stoppedUnexpectedly(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  process.stderr.write(`Error: the note tool stopped unexpectedly (${printable(message)}). ... The command did not finish.\n`);
  process.exit(2);
}
function printable(value: string): string {
  return stripControlChars(value.replace(/\s*[\r\n]+\s*/g, " "), false);
}
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} ...\n`);
  process.exit(2);
}
```
Exit 1 is set via `process.exitCode = 1;` (line 2974), not `process.exit(1)`.

**Analog (subprocess):** `scripts/runnable-ref/host-protection.ts` lines 314-331 (`runGh`):
```typescript
function runGh(args: string[]): { status: number | null; stdout: string; spawnError: string | undefined } {
  calls.push([...args]);
  const options = { shell: false, encoding: "utf8" as const, timeout: 20000,
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1" } };
  const r = spawnSync("gh", args, options);
  return { status: r.status, stdout: typeof r.stdout === "string" ? r.stdout : "",
    spawnError: r.error === undefined ? undefined : r.error.message };
}
```
Differences for `runGit`: Buffer stdout (no `encoding`), scrubbed `GIT_*` env plus `GIT_NO_REPLACE_OBJECTS`, `GIT_NO_LAZY_FETCH`, `GIT_LITERAL_PATHSPECS`, `GIT_TERMINAL_PROMPT=0` (RESEARCH § git invocation recipe). Keep the `calls` recorder so a test can assert the subcommand set is only `rev-parse`, `ls-tree`, `cat-file`, `config --get-regexp`.

**Analog (config read):** `scripts/runnable-ref/claim.ts` lines 1149-1150:
```typescript
/** The config file under .grugops/. install/state-layout.ts has no constant for it, so it is typed here, once. */
const CONFIG_NAME = "factory.config.json";
```
plus `USAGE` constant (lines 1144-1147) and `codeOf(e)` (line 1140).

**Test analog:** `scripts/runnable-ref/note.test.ts` (tracked). Build the adversarial upstream in `mkdtemp` with `git init`/`commit` from strings (RESEARCH Pitfall 8) — never commit fixture `CLAUDE.md`.

---

### `scripts/generate-runnable-embeds.ts` (add one EMBED_SPECS row)

**Analog:** note row, lines 395-420:
```typescript
  {
    target: "scripts/runnable-ref/note.ts",
    authorities: [
      { module: "install/state-layout.ts", roots: ["GRUGOPS_DIR_REL", "CONTEXT_REL"] },
      { module: "scripts/state-rules.ts", roots: ["stripControlChars"] },
      ...
      { module: "scripts/context-io.ts", roots: ["rootChainPresence", "isWithin", "ROOT_CHAIN_LINK_REFUSAL", "readRegularFileOrNull", ...] },
    ],
  },
```
New row order: `install/state-layout.ts` (`GRUGOPS_DIR_REL`) → `scripts/state-rules.ts` (`stripControlChars`) → `scripts/trace-model.ts` (`UPSTREAM_REF_PREFIX`) → `scripts/upstream-model.ts` → `scripts/context-io.ts` (claim set). Update the dated header comment (lines 182, 472 style) and `EMBED_SPEC_COUNT` 6 → 7. Run `npm run generate:runnable-embeds` once, after the trace-model edit; the five stamped runnables all change.

---

### `scripts/trace-model.ts` (TRC-02)

Edit in place, lines 249 and 285-297 (shown in RESEARCH § Trace change). Add `"BR"` to `RESERVED_PREFIXES`; declare `export const UPSTREAM_REF_PREFIX = "upstream:";` and make the first line of `classifyRef` `if (ref.startsWith(UPSTREAM_REF_PREFIX)) return "Requirement";`. Keep the module import-free (header line 28).

---

### `scripts/validate-agent-factory.ts` (upstream arm)

**Analog:** `checkpoints` arm, lines 795-840:
```typescript
  if ("checkpoints" in cfgObj) {
    const ck = cfgObj.checkpoints;
    if (ck === null || typeof ck !== "object" || Array.isArray(ck)) {
      err(`${rel}: "checkpoints" must be an object mapping ...`);
    } else {
      const legalIds = new Set<string>(CHECKPOINTS);
      const rosterList = [...CHECKPOINTS].sort().join(", ");
      for (const [id, value] of Object.entries(ck as Record<string, unknown>)) {
        if (!legalIds.has(id)) {
          err(`${rel}: unknown checkpoint id "checkpoints.${id}" — the roster is closed (allowed ids: ${rosterList})`);
          continue;
        }
        ...
```
Copy: the leading block comment explaining deliberate differences, the object-shape guard, refuse-unknown-key-by-name with the allowed set quoted back, `err()` with `${rel}:` prefix. Predicates imported from `upstream-model.ts`. `checkConfigForm(rel, raw, requireBaseKeys)` (line 675) has no base; thread `base` from `checkConfig` for the inside/ancestor check.

---

### `install/install.ts` / `install/uninstall.ts`

install.ts line 6871-6872:
```typescript
  // The host note writer (plan 41-09, 2026-11-05, D-35): Workflow 16 writes each note through this path.
  ["scripts/runnable-ref/note.js", "tools/grugops/note.js"],
```
Add `["scripts/runnable-ref/upstream.js", "tools/grugops/upstream.js"]` with a dated comment naming WF20, before the LICENSE row. Mirror the identical pair in uninstall.ts `RUNNABLES_MIRROR` near line 2807 (`install.test.ts` asserts equality). Re-measure census pins (`WRITE_PATH_COUNT`, `INSTALLED_FILE_COUNT`, `REMOVABLE_COUNT`).

---

### `install/state-layout.ts` (`BUILD_REQUESTS_REL`, optional this phase)

Lines 38-40:
```typescript
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
```
→ `export const BUILD_REQUESTS_REL = \`${STATE_ROOT_REL}/build-requests\`;` with a one-line doc comment.

---

### `scripts/runnable-ref/runnable-exit-contract.test.ts`

Line 68: `const RUNNABLES = ["trace-render", "state-check", "state-roll", "claim", "note"] as const;` → add `"upstream"`; add its entry to `STOPPED` (line 72, e.g. `upstream: hostCopy("upstream")` as at line 105) matching the runnable's stoppedUnexpectedly wording.

---

### `agent-factory/contracts/upstream.md`

**Analog:** `agent-factory/contracts/context-note.md` lines 1-15:
```markdown
---
kind: contract
contract: context-note-schema
requirement: SCTX-01
---

# Contract: the shared-context note schema (SCTX-01)

This document is the authoritative schema for ...
```
Use `contract: upstream-sources`, `requirement: UP-01`; plain professional voice (safety surface). Sections: config block, path base (repository root), manifest table header exactly `| ID | Status | Path | Superseded by |`, ID grammar, Status set, areas vocabulary, ref grammar, fence lines, 64 KiB ceiling.

---

### `agent-factory/workflows/20-upstream-sources.md`

**Analog:** `agent-factory/workflows/17-task-claim.md` lines 1-12:
```markdown
---
kind: workflow
order: 17
cadence: both
---
# Workflow: task claim + schedule

## When to use
...
```
Use `order: 20`, heading exactly `# Workflow: upstream sources` (kit-model derives the display name from it). State the fence rule once.

### `agent-factory/workflows/17-task-claim.md` § Session start (lines 81-87)
Insert the RESEARCH step-3 text after `2. Run \`node tools/grugops/claim.js sweep\`.` and renumber.

### `agent-factory/config/factory.config.md`
Copy the row form of line 14 (`| \`checkpoints\` | type | default | description |`) for `upstream`, and add `### \`upstream\` sub-fields` modeled on `### \`checkpoints\` sub-fields` (line 187).

### `agent-factory/roles/orchestrator.md` § Reads (line 17)
Add `upstream` to the key list only: `... \`nfr\`, \`compliance_regime\` and \`upstream\`` (≈12 B; stays under 6195 B WARN).

### `AGENTS.md`
Insert the RESEARCH third-root paragraph after line 45 (the C-28-016 blockquote), as its own paragraph. Do not touch lines 38-45.

## Shared Patterns

### Exit contract (0 pass / 1 outcome / 2 could-not-run, never a pass)
**Source:** `scripts/runnable-ref/note.ts` lines 2738-2761, enforced by `scripts/runnable-ref/runnable-exit-contract.test.ts`. Apply to `upstream.ts`. Mixed drift+UNKNOWN exit precedence is an open question (RESEARCH Option A recommended).

### Output sanitizing
**Source:** `scripts/state-rules.ts` `stripControlChars` (lines ~1501-1509), embedded. Single-line values via `printable()`; content via `stripControlChars(text, true)`.

### One authority per predicate + generated embeds
**Source:** `scripts/generate-runnable-embeds.ts` EMBED_SPECS. Validator imports from `upstream-model.ts`; runnable gets it via the generated region; freshness gate checks.

### Containment
**Source:** `scripts/context-io.ts` `isWithin` (~2277-2280). Use both directions (inside and ancestor) after `realpath`; never a new `startsWith`.

### Dated rationale comments on every moved pin
Every count/pin change (RESEARCH § Registration walk) carries a dated plan comment, as in install.ts line 6871 and generate-runnable-embeds.ts line 472. Do it in one registration task.

## No Analog Found

None. The git-spawning hardening (scrubbed `GIT_*`, replace/lazy-fetch switches, Node blob hash) has no in-repo precedent beyond `runGh`; use RESEARCH § The git invocation recipe.

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `install/`, `agent-factory/{contracts,workflows,config,roles}`, `AGENTS.md`
**Files scanned:** ~15
**Pattern extraction date:** 2026-11-24
