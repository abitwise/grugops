# Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 13 (new + modified)
**Analogs found:** 12 / 13 (one new artifact — the registry fixture format — has no analog; see "No Analog Found")

> **Single most important analog:** `scripts/runnable-ref/reference-check.ts` + `.test.ts` + `.js`. The test-integrity checker is its **near-clone** — copy the structure verbatim (node:builtins-only imports, `--json` toggle, exit `0/1/2` contract, fail-closed `exit 2`, clear-voice stdout). Do NOT edit the reference; create a sibling (Pitfall 1).

> **Project constraints honored in every assignment below:** single-source (no fork; **never write literal "§14" into a shipped file** — Phase 12 D-12; reference siblings by filename); two-voice (caveman ONLY in role prompts; **clear professional voice** in the checker, gate prose, and all checklists); no-fabrication (`UNKNOWN - verify`, never a faked pass); config-first (all dials exist — **add NO config keys**).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/runnable-ref/test-skip-integrity.ts` | checker (kit-shipped runnable) | file-I/O → transform (parse + validate + count-compare) | `scripts/runnable-ref/reference-check.ts` | near-clone (exact contract) |
| `scripts/runnable-ref/test-skip-integrity.js` | committed compiled output | n/a (build artifact) | `scripts/runnable-ref/reference-check.js` | exact (tsc output) |
| `scripts/runnable-ref/test-skip-integrity.test.ts` | test-harness (Vitest, spawns committed .js) | request-response (spawnSync → assert exit/stdout) | `scripts/runnable-ref/reference-check.test.ts` | near-clone (same `runCheck` idiom) |
| `scripts/runnable-ref/fixtures/clean-test-skips.md` | fixture (GREEN) | file-I/O input | `scripts/runnable-ref/fixtures/clean.txt` | role-match (new format) |
| `scripts/runnable-ref/fixtures/hollow-test-skips.md` | fixture (RED — SC3 keystone) | file-I/O input | `scripts/runnable-ref/fixtures/bad.txt` | role-match (new format) |
| `scripts/runnable-ref/fixtures/{expired,quarantine}-test-skips.md` (optional) | fixture (edge cases) | file-I/O input | `scripts/runnable-ref/fixtures/{clean,bad}.txt` | role-match |
| `install/install.ts` | installer (materialization seam) | batch copy (additive/idempotent) | `install/install.ts` `RUNNABLES` (self) | exact (append one tuple) |
| `agent-factory/workflows/05-pr-quality-gate.md` | workflow-prose (single-source gate) | event-driven (gate steps + terminal map) | itself (existing step sequence) | exact (extend in place) |
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | checklist-doc (NEW) | reference doc | `agent-factory/checklists/accessibility-checklist.md` | role-match (sibling shape) |
| `agent-factory/checklists/linter-recommendations.md` | checklist-doc (NEW) | reference doc | `agent-factory/checklists/security-nfr-checklist.md` (table-heavy) + `accessibility-checklist.md` (frontmatter) | role-match |
| `agent-factory/checklists/accessibility-checklist.md` | checklist-doc (MODIFY — extend for axe) | reference doc | itself | exact (extend in place) |
| `agent-factory/config/factory.config.{json,md}` | config (verify/wire — NO new keys) | config read | itself (`quality` block) | exact (already present) |
| `AGENTS.md` | command-slot prose (MODIFY — skip-count slot) | config read (host command source) | `AGENTS.md` `### Acceptance` BDD slot | exact (mirror slot shape) |

---

## Pattern Assignments

### `scripts/runnable-ref/test-skip-integrity.ts` (checker, file-I/O → transform)

**Analog:** `scripts/runnable-ref/reference-check.ts` (read-only; do NOT modify — Pitfall 1)

**`<read_first>`:** `scripts/runnable-ref/reference-check.ts` (whole file, 82 lines) — it IS the contract.

**Header + contract docblock to mirror** (`reference-check.ts` lines 17-27): keep the exact D-12 contract comment block — `exit 0 → pass`, `exit 1 → findings/fail (gate blocks)`, `exit 2 → error (could not run)`, `stdout → clear professional voice`, `--json` block. Restate the VOICE DISCIPLINE line verbatim (line 25-26). **Do not** put a literal "§14" in this file — refer to "the quality gate" / "the test-integrity step".

**Imports pattern** (`reference-check.ts` line 28) — node: builtins ONLY (the file runs in bare host CI with no node_modules):
```typescript
import { readFileSync } from "node:fs";
```
The checker needs only `node:fs`; markdown-table parsing is plain `String.split("\n")` + `split("|")` (Don't-Hand-Roll: no markdown lib — builtins only).

**Arg-parse pattern** (`reference-check.ts` lines 34-36) — first non-flag argv = the registry path; `--json` toggles:
```typescript
const wantJson = process.argv.includes("--json");
const inputPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
```
The checker adds **one more input** (D-14): the host skip-count integer via `--skip-count <N>` (or a second positional). Per Pitfall 4, optionally accept a test-only `--today YYYY-MM-DD`; prefer far-past/far-future fixture dates and add `--today` only if a boundary test is wanted.

**Fail-closed input read** (`reference-check.ts` lines 43-56) — missing path → `exit 2`; unreadable file → `exit 2` (error, never a silent pass). Copy this try/catch verbatim, swapping the filename in the message:
```typescript
if (!inputPath) {
  process.stderr.write(
    "Error: no input file path was provided. Usage: node reference-check.js <input-file> [--json]\n",
  );
  process.exit(2);
}
let contents: string;
try {
  contents = readFileSync(inputPath, "utf8");
} catch {
  process.stderr.write(`Error: cannot read the input file: ${inputPath}\n`);
  process.exit(2);
}
```

**Core rule swap** (`reference-check.ts` lines 58-64) — this is the ONLY substantive change. The reference does `contents.includes(BAD_TOKEN)`; the checker instead:
1. Parses the `.grugops/test-skips.md` markdown table (columns per D-03: `Test ID | Reason | Owner | Ticket/REQ | Expiry (YYYY-MM-DD) | Category`).
2. Validates each row's format — owner present + non-placeholder (`TODO`/`TBD`/`-`/`me`/`agent`/blank are hollow — Pitfall 3), category in the D-04 closed list (`flaky-quarantine`, `external-dependency`, `wip-behind-flag`, `platform-specific`, `deprecated-pending-removal`), non-empty `Test ID` + `Ticket/REQ`, parseable `Expiry` not in the past.
3. Counts **valid (well-formed + unexpired)** justifications. A valid+unexpired `flaky-quarantine` counts as justified (D-04 non-blocking lane).
4. Compares: push a finding (→ exit 1) when **host-skips > valid-justification-count** OR **any entry is expired** (D-05).

**Result emission** (`reference-check.ts` lines 66-81) — copy verbatim; findings → `--json {ok:false, findings}` or one-per-line clear voice, `exit 1`; no findings → `{ok:true, findings:[]}` / "No findings.", `exit 0`:
```typescript
if (findings.length > 0) {
  if (wantJson) console.log(JSON.stringify({ ok: false, findings }));
  else for (const f of findings) console.log(f);
  process.exit(1);
}
if (wantJson) console.log(JSON.stringify({ ok: true, findings: [] }));
else console.log("No findings.");
process.exit(0);
```

---

### `scripts/runnable-ref/test-skip-integrity.test.ts` (test-harness, request-response)

**Analog:** `scripts/runnable-ref/reference-check.test.ts` (near-clone — same idiom, new cases)

**`<read_first>`:** `scripts/runnable-ref/reference-check.test.ts` (whole file, 117 lines).

**Harness scaffold to copy verbatim** (`reference-check.test.ts` lines 22-52) — `globals:false` explicit imports, spawn the **committed `.js`** (never the `.ts`), `runCheck()` idiom, `mkdtemp`/`afterEach` cleanup:
```typescript
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const HERE = import.meta.dirname;
const CHECK_JS = join(HERE, "test-skip-integrity.js"); // the COMMITTED artifact, not the .ts

function runCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [CHECK_JS, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
```

**Cases to write** (map to the RESEARCH "Phase Requirements → Test Map", lines 534-548):
- `clean-test-skips.md` + `--skip-count N` (N ≤ valid) → `exit 0` + "No findings." (mirror Test 1, lines 56-60). [TINT-01]
- **`hollow-test-skips.md` → `exit 1` (the SC3 keystone)** + a clear-voice finding naming the hollow owner (mirror Test 2, lines 63-69). [TINT-01]
- `expired-test-skips.md` → `exit 1` even when counts balance (D-05). [TINT-02]
- `quarantine-test-skips.md` valid+unexpired → `exit 0` (non-blocking lane, D-04). [TINT-02]
- `--skip-count N` where N > justified → `exit 1` (D-05). [TINT-02]
- Missing/unreadable registry → `exit 2` (mirror Test 3, lines 72-76). [cross-cut]
- `--json` block shape (mirror Test 4/4b, lines 85-101).
- **Host-emulation** (mirror Test 5, lines 107-115): `copyFileSync(CHECK_JS, tmp)`, run from a bare temp dir with no node_modules, assert `exit 1` on the hollow fixture. Proves node:builtins-only. [cross-cut]

---

### `scripts/runnable-ref/fixtures/{clean,hollow}-test-skips.md` (fixtures)

**Analog:** `scripts/runnable-ref/fixtures/{clean,bad}.txt` (role-match — same purpose, new markdown-table format)

**Pattern:** mirror the clean/bad split. `clean.txt` is "ordinary deterministic content, exits 0"; `bad.txt` carries the planted `FORBIDDEN` token "so it exits 1". Translate to the registry format (D-03 columns). The RED fixture's canonical "hollow" = **placeholder owner** (most directly models the "agent self-authored a fake justification" threat — Pitfall 3). Use far-past/far-future expiry dates so the `today` comparison is never boundary-flaky (Pitfall 4).

**GREEN fixture** — well-formed rows, `host-skips ≤ valid justifications`, expiries far in the future, a valid `flaky-quarantine` row to prove the non-blocking lane.
**RED fixture** — one row with a placeholder owner (`TODO`/`-`/`agent`/blank), all else well-formed → must trip the validator (`exit 1`).

---

### `install/install.ts` (installer — append ONE RUNNABLES tuple)

**Analog:** `install/install.ts` `RUNNABLES` array (self, lines 698-731 — exact)

**`<read_first>`:** `install/install.ts` lines 698-731 (the `RUNNABLES` array + `materializeRunnable()`).

**The entire installer change** (lines 700-702) — append one tuple; `materializeRunnable()` (already additive/idempotent/never-overwrite/DRY_RUN-aware) needs no edit:
```typescript
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"], // NEW
];
```
**After editing:** rebuild (`npm run build`) and commit the regenerated `install.js` — the freshness gate (`scripts/freshness.ts`, `OUTPUT_DIRS=["install","scripts","hooks"]`) fails red on any `.ts`→`.js` drift, so both `install.js` and the new `test-skip-integrity.js` must be committed builds.

---

### `agent-factory/workflows/05-pr-quality-gate.md` (workflow-prose — extend in place, single-source)

**Analog:** itself (the existing step sequence + terminal-result mapping — exact)

**`<read_first>`:** `agent-factory/workflows/05-pr-quality-gate.md` (whole file, 57 lines).

**Existing step sequence to extend** (line 31) — the current ordered run is the seam for the new dialed steps:
```
3. **Run the gate** in order: `install -> lint -> typecheck -> unit -> build -> e2e`. The commands
   come from the root `AGENTS.md` command slots — they are never invented. If a command is unknown,
   the gate records `UNKNOWN - verify` rather than faking a pass.
```
- **Lint** is already in the sequence and listed in `mandatory_gates` — wire `quality.lint {strict, autofix}` semantics here (D-11/D-12/D-13): `strict:true` → fail-on-warning; `autofix:true` → safe autofix then recheck (inside `self_fix_attempts`); no linter configured → record `UNKNOWN - verify`, **non-blocking** (D-13). Point to `agent-factory/checklists/linter-recommendations.md` for the per-stack table (D-06 reference-not-embed).
- **UI/E2E** — wire `quality.ui_e2e` (`off | ui-or-critical-path | always`, already named on line 31). Point to `agent-factory/checklists/playwright-visual-regression-recipe.md` + the axe extension in `accessibility-checklist.md`.
- **Test-integrity** — NEW step, run AFTER unit/e2e (they produce the skip count — RESEARCH Open Q3). Invoke `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>` where `<N>` comes from the AGENTS.md skip-count slot (D-14; `UNKNOWN - verify` if absent — never a silent zero). Branch on exit `0/1/2`.

**Existing self-fix + terminal-result block to extend** (lines 32-34) — the bounded loop and the three terminal results are the contract D-08/D-09/D-10 wire into:
```
4. **Bounded self-fix.** ... `self_fix_attempts` from config (default `2`, "two rounds then human").
5. **Result.** The gate produces exactly one terminal result: `READY_FOR_HUMAN_REVIEW`,
   `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`.
```
Add the D-08 fix-lane classification (lint = agent-fixable; UI/E2E code/a11y = agent-fixable, **visual-baseline = human-only**; test-integrity = **always human-only**), D-09 short-circuit (human-only fails → `BLOCKED_NEEDS_FIX`, do NOT consume `self_fix_attempts`), and D-10 (`gate_enforcement: advisory` downgrades the ACTION but the finding is still emitted loudly in clear voice — never silent).

**Constraints:** all gate output is **clear professional voice** (this is a quality surface; line 27 already says "in clear voice"). **Never write "§14"** — reference the recipe checklists by filename only. Do NOT fork any logic into workflows 14/15.

---

### `agent-factory/checklists/accessibility-checklist.md` (checklist-doc — extend for axe)

**Analog:** itself (exact — extend the existing list in place)

**`<read_first>`:** `agent-factory/checklists/accessibility-checklist.md` (whole file, 16 lines).

**Existing frontmatter + list shape to preserve** (lines 1-15):
```markdown
---
kind: checklist
tier: enterprise
---
# Accessibility Checklist
... existing manual checks ...
- target standard (e.g. WCAG 2.2 AA) noted
```
Extend with the axe-core automated bar (RESEARCH Pattern 5): the `@axe-core/playwright` `AxeBuilder` snippet and `.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])` → `expect(results.violations).toEqual([])`. Keep `kind: checklist` frontmatter; clear professional voice. Add it to `00-index.md` only if a new sibling row is warranted (the two NEW files below will need index rows).

---

### `agent-factory/checklists/playwright-visual-regression-recipe.md` + `linter-recommendations.md` (checklist-docs — NEW siblings)

**Analog:** `agent-factory/checklists/accessibility-checklist.md` (frontmatter + sibling shape) + `00-index.md` (the index row pattern)

**Frontmatter to copy** (from `accessibility-checklist.md` lines 1-4) — every checklist carries `kind: checklist` + `tier:` (the Phase-6 validator checks presence per `00-index.md` line 8):
```markdown
---
kind: checklist
tier: enterprise
---
```
**Index registration** (`00-index.md` lines 32-38, the enterprise-tier table) — add a row per new file: `` | `playwright-visual-regression-recipe.md` | when verifying UI visual baselines at the gate | `` and `` | `linter-recommendations.md` | when configuring the lint step | ``.

- **`playwright-visual-regression-recipe.md`** content from RESEARCH Pattern 4 (lines 264-293): `toHaveScreenshot` with `animations:'disabled'`, `caret:'hide'`, `mask:[...]`, `maxDiffPixels`, fixed viewport, CI/Docker baseline determinism, `--update-snapshots`. UIQA-01.
- **`linter-recommendations.md`** content from RESEARCH "per-stack lint invocations" (lines 390-420): the ESLint-9-flat (default) / Biome (caveated) / Ruff / golangci-lint table with the exact `--max-warnings 0` (strict) and safe-autofix CLI, and `UNKNOWN - verify` for unknown stacks. LINT-01/02. **For a table-heavy reference**, `security-nfr-checklist.md` is the in-repo precedent for a large clear-voice checklist (it is the biggest checklist file).

**Constraints:** clear professional voice throughout; these are **referenced** by 05, not embedded in it (D-06/D-07); no new top-level directory.

---

### `agent-factory/config/factory.config.{json,md}` (config — verify/wire, ADD NO KEYS)

**Analog:** itself (exact — the `quality` block already holds every dial)

**`<read_first>`:** `agent-factory/config/factory.config.json` lines 33-42 + `factory.config.md` lines 58-69 and 90-99.

**All required dials already exist** — confirmed present, **add none** (Pitfall 6):
```json
"quality": {
  "lint": { "strict": false, "autofix": true },
  "ui_e2e": "ui-or-critical-path",
  "test_integrity": "warn",
  "self_fix_attempts": 2,
  "gate_enforcement": "blocking"
}
```
`factory.config.md` already documents the TINT-03 floor verbatim (line 68/96): `test_integrity` allowed `warn`/`block` — **never `off`**. The config files may only get clarifying prose for dial→behavior wiring; **no new rows, no new keys**. A diff that adds a `quality.*` key is the failure signal (Pitfall 6) — the registry path is a fixed convention (`.grugops/test-skips.md`, D-01), not a config value.

---

### `AGENTS.md` (command-slot prose — add the skip-count slot)

**Analog:** `AGENTS.md` `### Acceptance` BDD slot (lines 54-56 — exact slot shape to mirror)

**`<read_first>`:** `AGENTS.md` lines 37-77 (the `## Commands` section, especially the `### Acceptance` slot).

**Slot pattern to mirror** (lines 54-56) — a heading, an `UNKNOWN - verify` value, and an HTML comment listing per-runner examples "never as a hard command":
```markdown
### Acceptance

- Acceptance / BDD scenarios: `UNKNOWN - verify` <!-- host runner, e.g. cucumber-js / behave / `bddgen && playwright test` — names live here only as examples, never as a hard command -->
```
**New slot to add** (D-14; shape from RESEARCH lines 446-458) — a `### Test integrity` slot whose value defaults to `UNKNOWN - verify`, with a comment giving the vitest/jest/pytest/go skip-count examples as **examples only**, and the "never a silent 0" rule:
```markdown
### Test integrity

- Skip-count capture: `UNKNOWN - verify` <!-- host runner's reported skipped-test COUNT (an integer), e.g. vitest: `vitest run --reporter=json | jq '.numPendingTests + .numTodoTests'`; jest: `jest --json | jq '.numPendingTests'`; pytest / go analogous — examples only, never a hard command. If undeterminable, record `UNKNOWN - verify`, never a silent 0. -->
```
**Constraint:** the example commands are `[ASSUMED]` host-owned recipes (RESEARCH A1-A4) — they live as examples behind `UNKNOWN - verify`, never invented as grugops commands (no-fabrication).

---

## Shared Patterns

### The kit-shipped-runnable contract (D-11/D-12)
**Source:** `scripts/runnable-ref/reference-check.ts` (lines 17-27 docblock; 28 imports; 34-56 arg-parse + fail-closed; 66-81 emit)
**Apply to:** the checker `.ts`, its `.test.ts`, the `install.ts` tuple, and the `05` invocation line.
**Excerpt (the result contract — every kit-shipped runnable speaks this):**
```
//   node <repo-local-path>/<name>.js <input> [--json]
//     exit 0 → pass / no findings
//     exit 1 → findings / fail (the gate blocks)
//     exit 2 → error (could not run — distinguishable from a clean "fail")
//     stdout → human-readable findings in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → optional machine-readable { ok, findings } block when invoked with --json
// node: builtins ONLY (runs in bare host CI; no ~/.grugops, no npm, no node_modules)
```

### Two-voice discipline (clear voice on every quality/safety surface)
**Source:** `reference-check.ts` lines 25-26 (`every finding/error string this routine emits is CLEAR PROFESSIONAL ENGLISH`)
**Apply to:** the checker stdout/stderr, the new `05` gate prose, all three checklist docs, the AGENTS.md slot.
**Rule:** caveman voice is forbidden in any of these (Pitfall 5). Role prompts stay caveman; quality output does not.

### No-fabrication / `UNKNOWN - verify`
**Source:** `AGENTS.md` line 39 (`If a command is unknown, ship UNKNOWN - verify — never fabricate`) + `### Acceptance` slot pattern (lines 54-56)
**Apply to:** the lint step (D-13, no linter → `UNKNOWN - verify`, non-blocking), the skip-count slot (D-14, undeterminable → `UNKNOWN - verify`, never a silent 0), `05`'s `UNKNOWN` recording.

### Materialization seam (additive / idempotent / never-overwrite)
**Source:** `install/install.ts` lines 704-731 (`materializeRunnable()` — skip-if-missing, skip-if-identical, never `>`-truncate, DRY_RUN-aware, writes only under `tools/grugops/`)
**Apply to:** the new `RUNNABLES` tuple — no logic change, only the tuple; rebuild + commit `install.js` (freshness gate).

### Freshness-policed committed build
**Source:** `scripts/freshness.ts` `OUTPUT_DIRS=["install","scripts","hooks"]` (RESEARCH line 258/602)
**Apply to:** `test-skip-integrity.js` and the rebuilt `install.js` — both must be committed `tsc` output; the gate fails red on `.ts`→`.js` drift.

### Single-source, no-§14-literal
**Source:** Phase 12 D-12 (CONTEXT line 107; RESEARCH Anti-Patterns line 316) + `14-ui-design-to-build.md` lines 14/30 (the "see/per `agent-factory/workflows/05-pr-quality-gate.md`" reference idiom)
**Apply to:** `05` (the only workflow that changes), and the recipe checklists (referenced by filename, not embedded). Workflow 14 stays tool-neutral (D-08a) — it already only references 05 (confirmed lines 14, 30, 36, 39, 42); **do not** add tool names to it.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.grugops/test-skips.md` **registry FORMAT** (encoded in the two fixtures + the checker's parser) | data-format | n/a | The D-03 markdown-table skip-registry is a genuinely new artifact. Its **shape** (markdown table) has in-repo precedent in `plans/board.md` / `plans/traceability.md` (the D-03 rationale), and the **fixture files** mirror `fixtures/{clean,bad}.txt` — but the column schema + validation rules (owner non-placeholder, D-04 closed-list category, expiry) have no existing analog. The planner defines it fresh from D-03/D-04/D-05; the checker's parser and the fixtures are its only embodiment. |

> Note: the `plans/board.md` / `plans/traceability.md` markdown-table convention is the **format** precedent (why D-03 chose a table), but neither file is a behavioral analog for the checker — they are not parsed by a runnable. The fixtures' file role is analogized to `fixtures/{clean,bad}.txt`; only the table schema is new.

## Metadata

**Analog search scope:** `scripts/runnable-ref/`, `install/`, `agent-factory/workflows/`, `agent-factory/checklists/`, `agent-factory/config/`, `AGENTS.md`
**Files scanned:** 11 (reference-check.ts/.test.ts/.js, fixtures clean/bad, install.ts RUNNABLES region, 05-pr-quality-gate.md, 14-ui-design-to-build.md, factory.config.json/.md, accessibility-checklist.md, 00-index.md, AGENTS.md)
**Pattern extraction date:** 2026-06-14
```
