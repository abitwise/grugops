# Phase 38: install --migrate v3 - Pattern Map

**Mapped:** 2026-10-28
**Files analyzed:** 14 (new and modified)
**Analogs found:** 13 / 14

**Read this first: decisions made after research override it.**
- D-17: `plans/` is renamed whole to `memory-bank/plans/`. Only board, traceability and nfr-catalog go to `archive/pre-v3/` (flat). There is no `archive/pre-v3/plans/` folder. Research Pattern 3 steps 5(c)/(d) are replaced: the proof is per original file (identical bytes either in `archive/pre-v3/` or at the new path), not one `treeRecord` equality over an archived `plans/`.
- D-18: trace-render runs against the TARGET root after the commit renames and before the marker, using the kit-source `scripts/runnable-ref/trace-render.js`. If the render fails, the commit is rolled back.
- D-19: on isMigrated plus pre-v3 the run goes on into the install run. It does not stop at "Nothing to do."
- D-20: context folders are matched by delimited, case-insensitive ID tokens in the folder name.

All analog paths below were checked with `git ls-files` and are tracked.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `install/state-layout.ts` (mod) | config (constants only) | n/a | itself, lines 28-172 | exact |
| `install/state-migrate.ts` (NEW) | service (pure planner) plus generated embed region | transform | `scripts/runnable-ref/state-roll.ts` (embed region plus plan/execute split); `install/install.ts` `planConfigCarry` (3587) | role-match |
| `install/install.ts` (mod: `--migrate` branch, `--dry-run` alias, executor, WR-04 gate) | controller (CLI) | file-I/O, batch | itself, lines 6533-6640, 3626 (`migratePreSteps`), 878 (`stateLayout`) | exact |
| `scripts/generate-runnable-embeds.ts` (mod: `kind: "module"` target, one `EMBED_SPECS` row, `EMBED_SPEC_COUNT` 3 to 4) | utility (code generator) | transform | itself, lines 140-317 | exact |
| `scripts/state-rules.ts` (optional mod: pull state-roll's roll composition out here) | utility (pure rules) | transform | itself, `executeRoll` 1093, `RollIo` 1060 | exact |
| `install/state-migrate.test.ts` (NEW) | test (unit, pure) | transform | `scripts/state-rules` tests / state-roll unit style | role-match |
| `install/migrate-v3.test.ts` (NEW) | test (end-to-end, committed install.js) | file-I/O | `install/pre-v3-layout.test.ts` | exact |
| `install/fixtures/pre-v3-chess/**` (NEW, directory not named `plans`) | test fixture | n/a | `install/installer-paths.test-support.ts` `makePreV3StateFixture` (161) plus `scripts/fixtures/board-replay/chess-board.md` | partial (the real chess copy is still needed, D-15) |
| `install/installer-paths.test-support.ts` (mod: materialize the frozen fixture into `<tmp>/plans`) | test support | file-I/O | itself, `makePreV3StateFixture` 140-167 | exact |
| `install/pre-v3-layout.test.ts` (mod: cases e, i, j, m) | test | file-I/O | itself | exact |
| `install/agents-record.test.ts` (mod: R17 stays green, plus a v2.x pre-v3 WR-04 case) | test | file-I/O | itself, R17 at 892-907 | exact |
| `install/installer-fs-census.test.ts` (mod: new rename/mkdir/write/rm sites) | test (census) | n/a | itself, `CLASSIFIED_SITES` 126+ | exact |
| `scripts/check-state-paths.ts` (mod: allow-list entries for `install/state-migrate.ts` and the fixture, with D-15 reasons) | config (gate allow-list) | n/a | itself, lines 60-68 | exact |
| `docs/pre-v3-state-layout.md`, `install/README.md` (mod: what `--migrate` does now, `--dry-run`) | docs | n/a | existing sections | n/a |

## Pattern Assignments

### `install/state-layout.ts` (constants only)
Add the new paths here first, each as one constant built from an existing root. No logic goes in this file.
```typescript
// lines 105-127 (existing shape to copy)
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
export const BOARD_DONE_ARCHIVE_REL = `${ARCHIVE_REL}/board-done.md`;
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
export const CONTEXT_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/context`;
```
New constants: `PRE_V3_ARCHIVE_REL = \`${ARCHIVE_REL}/pre-v3\``, `PRE_V3_BOARD_UPDATES_REL`, `PRE_V3_ORPHAN_NOTES_REL`, `PRE_V3_NFR_NOTES_REL`, `QUEUE_CLAIMED_REL = \`${QUEUE_REL}/claimed\``, and a staging prefix under `MEMORY_BANK_REL`. Leave `STATE_ROOTS` (67) and `STATE_ROOT_COUNT` (82) alone; staging sits inside `memory-bank`, which is already a state root, so prune and uninstall skip it. Leave `BUDGETS` (145) and `BUDGET_COUNT` (172) unchanged.

### `install/state-migrate.ts` (NEW pure planner)
**Analog A, the embed region plus a hand-written part:** `scripts/runnable-ref/state-roll.ts`. Its header (line 40) says that `executeRoll` is embedded and that the hand-written part supplies `io`. The executor pattern is at lines 1779-1808:
```typescript
function pathOf(rel: string): string {
  const path = paths.get(rel);
  if (path === undefined) throw new Error(`${rel} is not a file this roll touches`);
  return path;
}
const io: RollIo = {
  read: (rel) => readTextOrThrow(rel, pathOf(rel)),
  write: (rel, text) => atomicWrite(pathOf(rel), text),
  remove: (rel) => nodeFs.unlinkSync(pathOf(rel)),
};
const outcome = executeRoll(p.plan, io);
```
For the in-memory proof (D-08), swap this for a `Map<string, string | null>`, as in RESEARCH Code Example 3. Contract, from `scripts/state-rules.ts` 1060-1093:
```typescript
export type RollIo = { read(rel: string): string | null; write(rel: string, text: string): void; remove(rel: string): void; };
export type RollOutcome = { readonly ok: true } | { readonly ok: false; readonly stage: "changed" | "rolled-back" | "restore-failed"; readonly reason: string };
```
Planners to embed (never restate them): `planDoneRoll` (state-rules 778), `planProgressRoll` (1244), `checkConservation` (997), `executeRoll` (1093). From `scripts/board-model.ts`: `splitRow`, `parseBoard`, `parseTicketDocument`, `stripHtmlComments`. From `scripts/frontmatter.ts`: `sectionEndIndex`.

**Analog B, the pure plan with collected refusals:** `install/install.ts` `planConfigCarry()` at 3587. Its signature is `{ readonly refusals: readonly string[]; readonly render: RenderConfig }`, and `buildKitPlan()` (6698) returns `{ ok, refusals }`. Use the same shape for `planStateMigrate(inputs, now)` and return `{ refusals, files, moves, proof, overBudget, dryRunLines }`. The planner does no I/O, and the date comes in as a parameter.

**Rules:**
- Import the legacy constants from `./state-layout.js`. The embed region must not carry a `state-layout` root (RESEARCH Pitfall 9).
- Cut each trailer from the RAW line. Do not cut from `parseBoard`'s `trailer`, which is truncated at 1,024 characters (`MAX_META_CHARS`, board-model 90 and 656-657).
- Export one constant that names the closed set of generated lines (D-09), and remove generated lines by position.

### `install/install.ts` (`--migrate` branch)
**Pre-check banner and whole-or-nothing exit, to copy** (lines 6563-6585):
```typescript
if (refusals.length > 0) {
  console.log("== grugops migrate (old in-repo layout → two-root) ==");
  console.log(`target: ${TARGET}`);
  if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
  console.log("\n-- migrate pre-check (before any change) --");
  for (const why of refusals) verify(why);
  report("migrate", `nothing was migrated: ${refusals.length} refusal(s) above ...`);
  printMigrateIncomplete(true, SELECTION);
  // A MID-SCRIPT EXIT, the seventh of the pinned count ...
  process.exit(VERIFY_FINDINGS > 0 ? 3 : 0);
}
```
Changes:
1. Run `stateLayout()` (878-895, which returns `"current" | "pre-v3" | "both" | "fresh" | {unreadable, code}`) and the v3 plan BEFORE `migrateHandoffs()` (6594-6595). Merge the v3 refusals into this one pre-check (D-11), so they apply on every kit layout and not only under `layout.isOldLayout`. The kit plan joins the pre-check on the isMigrated plus pre-v3 path as well (D-19).
2. WR-04: change `if (layout.isMigrated) {` (6596) to `if (layout.isMigrated && state !== "pre-v3") {`. When the v3 arm will move `plans/`, skip `migrateHandoffs()` and print an `ok` line instead (RESEARCH Pitfall 4).
3. `--dry-run`: in the arg parse near 313 (`USAGE_ERROR = \`unknown argument: ${a}\``), add a flag that feeds the `DRY_RUN` const at line 340 (`const DRY_RUN = process.env.DRY_RUN === "1";`). The const has to become `env || flag`, so parse the args before it.
4. Write the executor steps with the `migratePreSteps()` style (3626+): `if (DRY_RUN) { report("would-move", ...); continue; }`, then the mutation in try/catch with `verify(\`... (${errCode(e)}). It was left in place.\`)`. For rename-with-verify, see `renameSync(legacy, bak)` in the catch at around 3655.
5. Spawn trace-render the way install already spawns kit scripts (4608):
```typescript
const child = spawnSync(process.execPath, [join(dir, "scripts", "generate-role-adapters.js")], { ... });
```
Use `GRUGOPS_SRC/scripts/runnable-ref/trace-render.js` with the target as argv, with no shell. Report exit 0, 1 or 2 by name. Exit 2 means roll back and write no marker (D-18).
6. Write the marker last: `writeFileSync(join(TARGET, ...LAYOUT_MARKER_REL.split("/")), \`${LAYOUT_MARKER_CONTENT}\n\`, { flag: "wx" })`.
7. Read every user file through `readUserFile` (`install/user-file.ts` 124), `readForWrite` (259) and `treeRecord` (471). Do not call `readFileSync` directly.

### `scripts/generate-runnable-embeds.ts`
Add a row in the `EMBED_SPECS` shape (140-175):
```typescript
{
  target: "scripts/runnable-ref/state-check.ts",
  authorities: [
    { module: "install/state-layout.ts", roots: ["BUDGETS", "BOARD_REL", ...] },
    { module: "scripts/state-rules.ts", roots: ["markerState", "boardBudgetFindings", ...] },
  ],
},
```
For the new row, set target `install/state-migrate.ts` and `kind: "module"`. Leave the `install/state-layout.ts` authority out. Keep the module kind out of `RUNNABLE_SET`, `RUNNABLE_SET_STAMP` and `RUNNABLE_SELF` (header lines 28-34, and around 668-672). Move `EMBED_SPEC_COUNT` at line 317 to 4.

### `install/migrate-v3.test.ts` (NEW, end-to-end)
**Analog:** `install/pre-v3-layout.test.ts`. Copy its header style (lines 1-36: a lettered case list plus a "Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory ... drives the COMMITTED install/install.js"). Imports:
```typescript
import { afterAll, describe, expect, it } from "vitest";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
```
Assertion idiom (case e, 229-241): `labelled(r.stdout, "skipped")`, `expect(labelled(r.stdout, "verify"), r.stdout).toEqual([])`, and `snapshotTree(target)` (`installer-paths.test-support.ts` 84) for byte-identical second runs and for refusals that must write nothing.
**Rollback cases:** use `scripts/fault-inject.test-support.ts`, which runs `node --import <preload>` with `GRUGOPS_FAULT_SPEC`. A fault is named by site (script URL plus line). Never add an env hook to install.js.

### `install/installer-paths.test-support.ts`
Copy the `makePreV3StateFixture` pattern (161-167). It builds paths from `LEGACY_STATE_ROOT_REL` at run time, so no tracked path spells `plans/`:
```typescript
export function makePreV3StateFixture(d: string): string {
  mkdirSync(dirname(join(d, LEGACY_BOARD_REL)), { recursive: true });
  mkdirSync(dirname(join(d, PRE_V3_TICKET_REL)), { recursive: true });
  writeFileSync(join(d, LEGACY_BOARD_REL), PRE_V3_BOARD_TEXT);
  ...
}
```
Add `makePreV3ChessFixture(d)`, which copies `install/fixtures/pre-v3-chess/**` into `join(d, LEGACY_STATE_ROOT_REL)`.

### `install/agents-record.test.ts`
R17 (892-907) asserts `toMatch(/already migrated to the two-root layout/)`. Its fixture plants only `LEGACY_HANDOFFS_REL` and no `plans/board.md`, so it stays `current` and must stay green. Add a sibling case: install, move `memory-bank/plans` aside, plant `LEGACY_BOARD_REL`, run `--migrate`, then assert the output has no "Nothing to do." and that the v3 tree and the marker exist (roadmap criterion 6).

### `install/installer-fs-census.test.ts`
Add one `CLASSIFIED_SITES` row for each new mutating call (126+):
```typescript
{
  site: "install.ts:backupDir:renameSync",
  count: 1,
  gate: "dry-run-return-above",
  why: "install.ts:1426-1429 `if (DRY_RUN)` reports would-backup and returns before renameSync at :1430; ...",
},
```

### `scripts/check-state-paths.ts`
Allow-list entry shape (60-68):
```typescript
{ glob: "docs/pre-v3-state-layout.md", reason: "the user doc for the pre-v3 layout a repository may carry until v4.0 (D-04)" },
```
Add entries for `install/state-migrate.ts` (the migrate module names the legacy root) and `install/fixtures/pre-v3-chess/**` (reason: D-15 frozen fixture). Use exact paths or `dir/**` globs only (`isReadableGlob`).

## Shared Patterns

- **Pure plan, thin executor, and DRY_RUN rendering the same plan.** Sources: `buildKitPlan` (install.ts 6698) and `planConfigCarry` (3587). Applies to the planner and the executor.
- **Refusals collected before the first write, then one banner and exit 3.** Source: install.ts 6563-6585, plus `printMigrateIncomplete` (8142). Applies to every v3 refusal: both, unreadable, claimed queue, destination exists, mixed line endings, proof failure.
- **Report vocabulary.** `report("would-move"|"moved"|"skipped", ...)` and `verify(...)` with `errCode(e)`, as in `migratePreSteps` (3626-3660). Use clear voice.
- **The roll's own conservation proof and its rollback stages** (`changed`, `rolled-back`, `restore-failed`). Source: state-rules 1060-1100. Follow it for the D-17 reverse-order undo of the commit renames.
- **Spawning kit code.** Use `spawnSync(process.execPath, [script, ...args])` with no shell, and never import `scripts/` from `install/` (pinned in `install/install.test.ts` around 4279).
- **Hermetic tests.** Use `runInstall` with a scratch `GRUGOPS_HOME`, and `snapshotTree` for byte identity.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `install/fixtures/pre-v3-chess/**` | fixture | n/a | It needs the user's real `cli-chess-example` copy (D-15), which is not on this machine. `scripts/fixtures/board-replay/chess-board.md` shows the shapes but was path-rewritten by Phase 36, so it is not verbatim pre-v3. |
| The staging-to-commit rename sequence with reverse-order undo | executor | file-I/O | No multi-rename transaction exists in install today. The closest models are `executeRoll`'s rollback and `backupEditedKitFiles`'s stage-then-rename. Build it from RESEARCH Pattern 3 as amended by D-17. |

## Metadata

**Analog search scope:** `install/`, `scripts/`, `scripts/runnable-ref/`, `docs/`
**Files scanned:** about 15
**Pattern extraction date:** 2026-10-28
