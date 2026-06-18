# Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy) - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 9 (3 new, 6 modified)
**Analogs found:** 9 / 9 (all exact or role-match — additive phase ON an existing substrate)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| NEW `scripts/compactor.ts` (+ committed `scripts/compactor.js`) | utility (CLI helper) | transform (raw thread → promoted notes), file-I/O | `scripts/context-io.ts` (reuse surface) + `hooks/guard.ts` (refuse posture) | exact (built ON `context-io.ts`) |
| NEW `scripts/compactor.test.ts` | test | transform / CLI | `scripts/context-io.test.ts` | exact |
| NEW `agent-factory/workflows/18-context-compaction.md` | workflow doc | n/a (single-source protocol) | `agent-factory/workflows/16-context-read-write.md` | exact |
| MODIFY `agent-factory/config/factory.config.json` | config | n/a | existing `quality` / `security` blocks (same file) | exact |
| MODIFY `agent-factory/config/factory.config.md` | config doc | n/a | `### security` sub-field table + dial-contract table (same file) | exact |
| MODIFY `agent-factory/seed/.grugops/factory.config.json` | config (seed twin) | n/a | byte-twin of `agent-factory/config/factory.config.json` | exact |
| MODIFY `agent-factory/roles/*.md` (all 17) | role docs | n/a | the existing WF16 one-line pointer in each role | exact |
| MODIFY `scripts/generate-catalog.test.ts` | test | n/a | the existing `toBe(17)` + `WORKFLOW_NAMES` (same file) | exact |
| MODIFY `.gitignore` | config | n/a | existing `.gitignore` entries | exact |

---

## Pattern Assignments

### `scripts/compactor.ts` (utility / transform, file-I/O)

**Analog:** `scripts/context-io.ts` (reuse surface + style); `hooks/guard.ts` (refuse posture).

`compactor.ts` is glue + ONE invariant. It imports the compiled `context-io.js` and owns only (a) the trajectory-thread read and (b) the deterministic carve-out check. Do NOT re-implement note I/O, parsing, or admission (D-02 / D-13).

**Imports + zero-host-dep pattern** — `scripts/context-io.ts` lines 32-43:
```typescript
import { randomUUID } from "node:crypto";
import {
  writeFileSync, readFileSync, readdirSync, renameSync,
  unlinkSync, mkdirSync, existsSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
```
`compactor.ts` ADDS its reuse import (note `.js` extension — it imports the COMPILED sibling, the verified signatures below):
```typescript
import { readContext, currentState, appendNote, admit,
         NoteRecord, NoteInput, NOTE_KINDS } from "./context-io.js";
```

**Reuse-surface signatures (build ON these — never fork)** — `scripts/context-io.ts`:
- `export const NOTE_KINDS` (lines 46-53): `["claim","finding","decision","failed-attempt","observation","artifact-ref"]`
- `export interface NoteInput` (lines 57-65) — provenance fence: `kind, by, at, verified_by, confidence, refs[], supersedes`
- `export interface NoteRecord` (lines 68-78) — adds `id` + `body`
- `export function readContext(task, contextRoot?): NoteRecord[]` (line 407)
- `export function currentState(notes): NoteRecord[]` (line 436) — the ONLY fold `compactor.ts` may reuse (D-03)
- `export function appendNote(task, note, body, contextRoot?): string` (line 378) — the SOLE promotion path (D-02.3)
- `export function admit(task, text, contextRoot?): string[]` (line 529) — re-verify; `[]` = admitted (D-12)

**The `supersedes` fold (the only fold D-03 permits, reuse verbatim)** — `scripts/context-io.ts` lines 436-444:
```typescript
export function currentState(notes: NoteRecord[]): NoteRecord[] {
  const ordered = [...notes].sort((a, b) =>
    a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
  );
  const superseded = new Set(
    ordered.map((n) => n.supersedes).filter((x): x is string => x !== null && x !== ""),
  );
  return ordered.filter((n) => !superseded.has(n.id));
}
```

**The carve-out set (CMP-02), read off the provenance fence + the six kinds:**
- every `failed-attempt` note id present in the raw thread must SURVIVE into the promoted set (D-02.1)
- `verified_by` / `supersedes` / `by` / `at` intact on every promoted note (D-02.2)
- promotion routes ONLY through `appendNote` — no forked writer (D-02.3)
The dial NEVER turns this off (D-05); it holds identically at `aggressive` | `balanced` | `retain-raw`.

**Refuse / exit-1 / name-the-fault posture (mirror this exactly)** — `scripts/context-io.ts` line 397 (`appendNote`):
```typescript
const findings = validate(text);
if (findings.length > 0) {
  throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
}
```
`hooks/guard.ts` header (lines 15-27) is the clear-voice safety contract to echo: clear professional voice, fail-closed on ambiguity, name the fault. Put a `compactor.ts` header comment in the SAME shape documenting the body=agent / structure=tool boundary and the D-03 "no semantic fold" line.

**CLI entrypoint pattern (run-direct guard + dispatch + exit codes)** — `scripts/context-io.ts` lines 648-705. Mirror exactly:
```typescript
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    // ... dispatch; print usage to console.error + process.exit(1) on misuse
  } catch (e) {
    console.error(`context-io: ${(e as Error).message}`);
    process.exit(1);
  }
}
```
On a dropped carve-out element: `process.exit(1)` and print a message NAMING the dropped element (mirrors the `validate` CLI path printing each finding to `console.error` then `process.exit(1)`, lines 663-666).

**Path-safety (V12 — reuse the same allowlist discipline)** — `scripts/context-io.ts` lines 84-94 (`assertSafeTask`, `^[A-Za-z0-9._-]+$`). The `<agent>` segment of `.grugops/context/<task>/threads/<agent>.md` (D-08) must pass the SAME allowlist before being interpolated into a path — do not interpolate an unvalidated agent name.

**Thread dir creation (mirror `appendNote`'s on-demand mkdir)** — `scripts/context-io.ts` lines 399-400: `mkdirSync(notesDir, { recursive: true });`. `compactor.ts` (or the first thread write) must `mkdirSync(threadsDir, { recursive: true })` before writing `threads/<agent>.md` (Pitfall 5 / Open Question 2).

**Field-injection guard already covers promotion** — `scripts/context-io.ts` `appendNote` lines 384-393 calls `assertSingleLine` (lines 160-166) on every provenance field. Because promotion routes through `appendNote` (D-02.3), `compactor.ts` adds NO new write path that could bypass these — do NOT add a second writer.

---

### `scripts/compactor.test.ts` (test, transform/CLI)

**Analog:** `scripts/context-io.test.ts` — the RED-fixture-first, spawn-the-`.js` + import-the-`.js` idiom.

**Header + imports + temp-dir harness** — `scripts/context-io.test.ts` lines 22-53:
```typescript
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");   // → add COMPACTOR_JS = join(ROOT,"scripts","compactor.js")

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

const mod: typeof import("./context-io.js") = await import(pathToFileURL(CONTEXT_IO_JS).href);
```

**Good-fixture-then-mutate idiom** — `scripts/context-io.test.ts` lines 56-79 (`goodNoteText(over)`): build a complete valid note, each BAD case overrides one field. For `compactor.test.ts` build `goodRawThread()` (≥1 `failed-attempt` id `FA-1` + a verified `finding` stamped `§14-gate#SEED-001`) and `goodPromotedSet()`; each RED case drops exactly one carve-out element.

**Spawn-the-CLI helper** — `scripts/context-io.test.ts` lines 82-87:
```typescript
function runValidate(noteFile: string) {
  return spawnSync("node", [CONTEXT_IO_JS, "validate", noteFile], { cwd: ROOT, encoding: "utf8" });
}
```

**RED-case assertion shape (NAME the fault)** — `scripts/context-io.test.ts` lines 106-125:
```typescript
expect(r.status).not.toBe(0);
expect(`${r.stdout}${r.stderr}`).toContain("confidence");   // names the dropped element
```
For each carve-out RED case assert `.not.toBe(0)` AND `toContain("<dropped-element-name>")` (e.g. `"verified_by"`, `"supersedes"`, `"by"`, `"at"`, the dropped `failed-attempt` id). One GOOD case asserts intact set exits 0. Run drop cases at all three dial values to prove the carve-out is un-dialable (D-05).

---

### `agent-factory/workflows/18-context-compaction.md` (workflow doc)

**Analog:** `agent-factory/workflows/16-context-read-write.md` (read the whole 43-line file as the template).

Match the frontmatter + section shape exactly:
```markdown
---
kind: workflow
order: 18          # order: 18 regardless of the missing WF17 — do NOT renumber (Pitfall 2)
cadence: both
---
# Workflow: context compaction

## When to use
## Steps
## Stop conditions
## Done condition
## Commit
```
Clear voice throughout (trace/safety/token surface — CLAUDE.md). Single-source: REFERENCE WF16's admission rules and `05-pr-quality-gate.md`'s `self_fix_attempts` loop rather than restating them — mirror how WF16 line 26/35 reference `05-pr-quality-gate.md` and never re-dial it. Reference the escape hatch verbatim from WF16 lines 25-27 / 40 (refuse → degrade to `claim` with `confidence: UNKNOWN - verify`, the D-12 path).

---

### `agent-factory/config/factory.config.json` (config)

**Analog:** the existing `quality` / `security` nested blocks in the SAME file (lines 33-51).

Add a top-level `context` object mirroring the shape of `security` (lines 48-51):
```json
"security": {
  "asvs_level": "L1",
  "block_on": "high"
},
```
→ add `"context": { "compaction": "aggressive" }` (lean default = `aggressive`, D-04). Place it as a sibling top-level key (e.g. after `security`). NOTE: the file currently has NO `context` key — this is a fresh top-level block.

---

### `agent-factory/seed/.grugops/factory.config.json` (config seed twin)

**Analog:** byte-identical to `agent-factory/config/factory.config.json` (`diff` confirms they are identical today). Apply the EXACT same edit so the byte-twin invariant holds (D-06). Re-run `diff` to confirm zero divergence after editing.

---

### `agent-factory/config/factory.config.md` (config doc)

**Analog:** the `### security` sub-field table (lines 79-84) + the dial-contract table (lines 90-99) + the zero-config defaults paragraph (line 109), all in the same file.

1. **Field-reference sub-table** — mirror the `### security` block (lines 79-84):
```markdown
### `security` sub-fields
| Key | Default | Meaning |
|-----|---------|---------|
| `asvs_level` | `L1` | OWASP ASVS verification level ... |
```
→ add a `### context` sub-field section with a row for `compaction` (default `aggressive`; allowed `aggressive` | `balanced` | `retain-raw`; meaning = body-verbosity / raw-reaching-shared knob, never the carve-out).

2. **Dial-contract row** — mirror a row from the lean→enterprise table (lines 92-99), e.g. the `quality.test_integrity` row (line 96) which documents a safety carve-out that has no `off`:
```markdown
| `quality.test_integrity` | `warn`, `block` | `warn` | `block` — ... **Never `off`** (TINT-03 ...): trace integrity cannot be dialled away in any mode. |
```
→ add `| context.compaction | aggressive, balanced, retain-raw | aggressive | retain-raw — full trajectory bodies admitted to the committed shared context (enterprise/audit). The body/raw verbosity knob only; the durable note set + the carve-out are un-dialable at every value (D-05). |`

3. **Zero-config defaults paragraph** — line 109 documents "every one of the eight keys ... degrades to its documented lean default when the key — or the whole file — is absent." Bump the count and add `context.compaction` to the list so `aggressive` is the documented absent-default (this is the verified D-06 precedent for read-at-use, default-on-absent).

---

### `agent-factory/roles/*.md` (all 17 role files)

**Analog:** the existing WF16 one-line pointer present IDENTICALLY in all 17 roles. Verified shape (e.g. `agent-factory/roles/system-analyst.md:45`, `orchestrator.md:128`, `architect-design.md:48`, `installer.md:46`, `frontend-ui.md:47`):
```
Context I/O: read and write the shared context per `agent-factory/workflows/16-context-read-write.md` — that workflow is the single source; this role references it and does not restate it.
```
Add ONE analogous line per role (place it directly after the WF16 pointer), e.g.:
```
Compaction: compact the local trajectory and promote per `agent-factory/workflows/18-context-compaction.md` — single source; this role references it and does not restate it.
```
All 17 roles carry the WF16 pointer (`grep -rln "16-context-read-write.md" agent-factory/roles/` → 17); add the WF18 pointer to the same 17. Additive, low-risk (D-10).

---

### `scripts/generate-catalog.test.ts` (test) — the landmine (Pitfall 1)

**Analog:** the same file's existing count assertion + name list.

**Count assertion** — `scripts/generate-catalog.test.ts` line 154 (inside the test at line 137 "contains all 17 roles and all 17 workflows"):
```typescript
expect(countRowsLinkingInto(text, "workflows")).toBe(17);   // → toBe(18)
```
Bump `17 → 18`. (Leave the roles count at 17 — roles are unchanged this phase.) Update the surrounding test name/comment at lines 136-137 if it states "17 workflows".

**Name list** — `scripts/generate-catalog.test.ts` lines 72-90 (`WORKFLOW_NAMES`), currently 17 entries ending:
```typescript
  "Security audit (OWASP ASVS)",
  "context read/write",
];
```
Add WF18's display name (derived from its `# Workflow: context compaction` title / "When to use" first sentence — confirm against the generator's name-derivation once WF18 is authored), e.g. `"context compaction",`.

After editing: `npm run generate:catalog && npm run freshness:catalog && npx vitest run scripts/generate-catalog.test.ts` and commit the regenerated `docs/catalog/README.md`.

---

### `.gitignore` (config)

**Analog:** the existing `.gitignore` (6 lines) — entries are a comment + a path glob:
```
# Transient rebuild target used by the freshness gate (D-02).
.tmp-build/
```
Add a scoped entry for the ephemeral thread tier (D-07), scoped to `*/threads/` ONLY (never a blanket `.grugops/context/` ignore, which would gitignore the committed `notes/` / `index.*`):
```
# Ephemeral local agent trajectory tier (D-07) — never committed; only the
# verified shared context (notes/, index.*) is durable.
**/.grugops/context/*/threads/
```
(Exact wording/location is planner discretion — CONTEXT.md; the intent "ignore only threads/" is locked by D-07.)

---

## Shared Patterns

### Refuse / exit-1 / name-the-fault (the un-cheatable mechanical floor)
**Source:** `scripts/context-io.ts` line 397 (`appendNote` throw) + lines 663-666 (CLI `validate` print-each-finding + `process.exit(1)`); style/voice from `hooks/guard.ts` header lines 15-27.
**Apply to:** `compactor.ts` (the carve-out checker) and its RED tests in `compactor.test.ts`.
```typescript
if (findings.length > 0) {
  throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
}
```

### Build/drift gate — zero manual registration (D-13)
**Source:** `scripts/freshness.ts` `OUTPUT_DIRS = ["install","scripts","hooks"]` + `collectJs()` auto-globs `scripts/*.js`.
**Apply to:** `scripts/compactor.js` — auto-discovered; commit `compactor.js` in the same change as `compactor.ts`; run `npm run build && npm run freshness`. No edit to `freshness.ts`.

### Dial read at point-of-use, default-on-absent (D-06)
**Source:** `agent-factory/config/factory.config.md` line 109 (the absent⇒lean-default rule) + the `quality.*` / `security.*` read-at-use precedent.
**Apply to:** WF18 prose + any role behavior gated on verbosity. `context.compaction` absent ⇒ `aggressive`. No new dial-reading machinery.

### Path-safety allowlist (V12)
**Source:** `scripts/context-io.ts` lines 84-94 (`assertSafeTask`, `^[A-Za-z0-9._-]+$`).
**Apply to:** the `<task>` AND `<agent>` segments of `.grugops/context/<task>/threads/<agent>.md`.

### Byte-twin config invariant (D-06)
**Source:** `agent-factory/config/factory.config.json` ≡ `agent-factory/seed/.grugops/factory.config.json` (confirmed identical via `diff`).
**Apply to:** edit both identically; re-run `diff` to confirm zero divergence.

### Single-source workflow + one-line role pointer (D-10)
**Source:** `agent-factory/workflows/16-context-read-write.md` + its identical pointer in all 17 `agent-factory/roles/*.md`.
**Apply to:** WF18 authored once; one analogous pointer line added to all 17 roles.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | None. Phase 22 is additive ON the Phase-20/21 substrate; every new/modified file has an exact in-repo analog. |

---

## Metadata

**Analog search scope:** `scripts/`, `hooks/`, `agent-factory/workflows/`, `agent-factory/roles/`, `agent-factory/config/`, `agent-factory/seed/`, repo root (`.gitignore`).
**Files scanned (read or grepped):** `scripts/context-io.ts`, `scripts/context-io.test.ts`, `hooks/guard.ts`, `scripts/generate-catalog.test.ts`, `agent-factory/workflows/16-context-read-write.md`, `agent-factory/config/factory.config.json`, `agent-factory/config/factory.config.md`, `agent-factory/seed/.grugops/factory.config.json`, `.gitignore`, plus directory listings of `agent-factory/workflows/` and `agent-factory/roles/`.
**Pattern extraction date:** 2026-06-18

**Two landmines pinned for the planner:**
1. `generate-catalog.test.ts` line 154 `toBe(17)` → `toBe(18)` + add WF18 to `WORKFLOW_NAMES` (lines 72-90) — RED otherwise (Pitfall 1).
2. WF18 uses `order: 18` despite WF17 not existing on disk (00-16 present); generator tolerates the gap, validator floor stops at 13 — do NOT renumber (Pitfall 2).
