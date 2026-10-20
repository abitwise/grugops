# Phase 36: State-layout authority, path move and protection - Pattern Map

**Mapped:** 2026-10-20
**Files analyzed:** 10 (new or materially modified; the ~1,187 mechanical path-substitution sites are listed in 36-RESEARCH.md § Site inventory and are not re-mapped here)
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `install/state-layout.ts` (+ committed `.js`) | config (constants-only leaf) | none (pure data) | `install/host-tools.ts` (+ tracked `install/host-tools.js`) | exact |
| `scripts/check-state-paths.ts` (+ `.js`) | utility (CI gate CLI) | batch (git ls-files scan) | `scripts/check-nul-bytes.ts` (CLI shell) + `scripts/guard-retired.test.ts` (scan core) | exact (combined) |
| `scripts/check-state-paths.test.ts` | test | batch | `scripts/guard-retired.test.ts` | exact |
| `package.json` `check:state-paths` + `.github/workflows/ci.yml` line | config | n/a | `check:nul-bytes` (package.json:25) + ci.yml `node scripts/check-nul-bytes.js` block (~ci.yml:520-540) | exact |
| `install/install.ts` old-layout refusal | middleware-like guard | request-response (stderr + exit) | `install/install.ts:2864-2872` self-checkout refusal | exact |
| `install/install.ts` doctor layout line + board ref | service (doctor) | request-response | `install/install.ts:2398-2420` doctor refs table | exact |
| `install/install.ts` `isPruneProtected` / `install/uninstall.ts` `isProtected` | utility (guard) | n/a | themselves (`install.ts:3211-3219`, `uninstall.ts:398-408`) | in-place |
| `install/installer-paths.test-support.ts` pre-v3 fixture builder | test support | file-I/O | `makeFixture` at `installer-paths.test-support.ts:132-139` | exact |
| `scripts/adapter-byte-baseline.test.ts` third stated transform | test | transform | the D-14 transform in the same file (:132-175, :305-335) | exact |
| `memory-bank/plans/uat/.gitkeep` + seed move | config/data | file-I/O | none needed (git mv) | n/a |

## Pattern Assignments

### `install/state-layout.ts` (config, constants-only)

**Analog:** `install/host-tools.ts` (0 imports, tracked twin `install/host-tools.js` verified by `git ls-files`).

**Header convention** (host-tools.ts:1-22): a `// <file> — <one-line purpose> (phase, decision)` line, then `WHAT THIS OWNS`, `A NEW … IS ADDED HERE FIRST`, and an `IMPORT EDGES` paragraph:
```typescript
// IMPORT EDGES. This module is pure data and imports nothing: no node:fs (the installer fs census
// scans every install/*.ts) and nothing from scripts/ (install/ never imports scripts/, 33.1
// D-18/D-28). The reverse edge is allowed and deliberate: a scripts/*.ts module may import
// ../install/host-tools.js to read the registry (34-RESEARCH.md assumption A5).
```
**Data + count-pin convention** (host-tools.ts:28-38, :921):
```typescript
export const HOST_ADAPTER_KINDS = [ "claude-kit", ... ] as const;
export type HostAdapterKind = (typeof HOST_ADAPTER_KINDS)[number];
...
export const HOST_TOOL_COUNT = 6;
```
Two-sided pin is then asserted in `install/host-tools.test.ts:110` ("the registry has exactly HOST_TOOL_COUNT rows"). Use the same shape for `PROTECTED_ROOTS` + a `PROTECTED_ROOT_COUNT` constant. Proposed exports: 36-RESEARCH.md:264-281 (Pattern 1). Keep POSIX strings, one string for `memory-bank/plans` (never split segments).

**Knock-on pin:** `install/path-spelling-census.test.ts:65` `SCANNED_FILE_COUNT = 9` → 10 (it scans every non-test `install/*.ts`); re-pin with a dated reason, message at :342.

---

### `scripts/check-state-paths.ts` (CLI gate, batch)

**Analog for the CLI shell:** `scripts/check-nul-bytes.ts`.
- Entry guard (check-nul-bytes.ts:704-715): `const isEntry = isEntrypoint(import.meta.url); if (isEntry) { runAll(); }` with `import { isEntrypoint } from "./is-entry.js";` (same import at check-claim-anchors.ts:62). Lets the test import the module without exiting the worker.
- Result trailer (check-nul-bytes.ts:694-703):
```typescript
function finish(): void {
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) { process.stdout.write("ALL CHECKS PASSED\n"); process.exit(0); }
  else { process.stdout.write(`${FAILS} CHECK(S) FAILED\n`); process.exit(1); }
}
```
- PASS line rule (check-nul-bytes.ts:672-692): every number printed is read from this run (denominator, per-class counts). Mirror it: print per-spelling counts inside/outside the allow-list plus the named `.planning/` exclusion.
- Exit 2 ("could not run"): **no existing `scripts/*.ts` uses `process.exit(2)`** (grep found none). This is a new convention; state it in the header and test it (e.g. git failure).

**Analog for the scan core:** `scripts/guard-retired.test.ts`.
- Imports + root (:30-46): `execFileSync` from `node:child_process`, `readFileSync` from `node:fs`, `join`, `const ROOT = join(import.meta.dirname, "..");`, vocabulary imported from a module (here: `../install/state-layout.js`), so the gate holds no literal `plans`.
- Named exclusions (:51-63): `EXCLUDED` array, `"dir/"` prefix vs exact path, `isExcluded()`. Already lists `.planning/`, `docs/audit/`, `docs/initial/`, `CHANGELOG.md` — the same history set D-09/D-11/D-16 name. For this gate convert to `ReadonlyArray<{ glob; reason }>` (D-10).
- `escapeRegExp` (:65-67) and matcher built from imported constants (:71-80).
- `trackedFiles()` via `git ls-files -z` split on `\0` (:87-92); `readTracked()` latin1 with ENOENT → null, rethrow others (:99-106). Wrap the git call so a failure maps to exit 2.
- Spellings: three regexes from 36-RESEARCH.md:417-425 (lookbehind excludes `memory-bank/`); subtract `LEGACY_FALLBACK_CLAUSE` via `text.split(CLAUSE).join("")` (D-15).

### `scripts/check-state-paths.test.ts` (test)

**Analog:** `scripts/guard-retired.test.ts` — header block (:1-28: WHAT THIS PROVES / WHERE THE NAMES COME FROM / HOW IT AVOIDS PASSING VACUOUSLY / run command with `--exclude '**/scripts/e2e/**'`), `import { describe, it, expect, afterEach } from "vitest";` (globals:false), non-vacuity floor + mutation case planting each spelling into a temp copy (mkdtempSync/copyFileSync/appendFileSync imports at :32-38). Differences required by CONTEXT: do NOT pin the allow-list length as a number; instead converse checks (each entry matches ≥1 tracked file and ≥1 site); add a plant of the NEW spelling that must stay unreported (Pitfall 4).

### `package.json` + `.github/workflows/ci.yml` wiring

- package.json:25 shape: `"check:nul-bytes": "tsc --outDir .tmp-build && node scripts/check-nul-bytes.js",` → add `check:state-paths` identically.
- ci.yml: add `node scripts/check-state-paths.js` with a comment block in the "Freshness gates + repo gates" step, next to `node scripts/check-nul-bytes.js` / `check-residual-citations.js` (~ci.yml:520-550). Comment idiom: "WIRED HERE **AND** IN package.json".
- Reachability is enforced: `scripts/check-foundation-guards.test.ts:12568-12569` (`checkScriptNames` reads every `check:*` script) and the CI-block enumeration (~:12555-12590, :13084) — a gate missing from either end goes red. Wire last (D-13 step 4).

---

### `install/install.ts` — old-layout (pre-v3) refusal

**Analog:** self-checkout refusal, install.ts:2864-2872:
```typescript
if (!ALLOW_SELF) {
  const looksLikeSource = ...;
  if (looksLikeSource) {
    process.stderr.write(
      "refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.\n",
    );
    process.exit(1);
  }
}
```
Kit-home overlap refusal follows at ~:2913-2920 (same convention). Place the new block after these and before `SELECTION_WHY`; skip when `MIGRATE`/`CHECK`/`UPDATE`/`PRUNE_OLD_KIT`. Print the command via `migrateCommand(agents)` (install.ts:584-586: `return agentCommand("install.js", TARGET, agents, COMMAND_CONTEXT, ["--migrate"]);`) with `SELECTED_BY_FLAG`. Name it "pre-v3 state layout" — `detectOldLayout()` (~:3394) already means the v1.0 vendored kit (Pitfall 7). Probe sketch: 36-RESEARCH.md:400-411 (`wayTo`/`lstatSync`; EACCES is unreadable, never absent). Re-pin exit-site count `install/install.test.ts:5884/5889` (11→12, 12→13).

### `install/install.ts` — doctor layout line

**Analog:** doctor refs table, install.ts:2403-2411:
```typescript
const refs: Array<[string, string, "dir" | "file"]> = [
  ...
  [join(TARGET, ".grugops", "factory.config.json"), statRef, "file"],
  [join(TARGET, "plans", "board.md"), statRef, "file"],
```
Replace :2409 with `join(TARGET, <resolved BOARD_REL | LEGACY_BOARD_REL>)`; add one layout line via `docWarn(...)` for old/both (never FAIL, D-07). Comment style to keep: the MIGR-02 rationale comment at :2410-2412.

### `isPruneProtected` / `isProtected` — one protected list

Current duplicates (identical literals):
- install.ts:3211-3219 `const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];`
- uninstall.ts:398-408 same literal.
Replace only the literal with the imported `PROTECTED_ROOTS`; keep both function names (census keys `"install.ts:isPruneProtected:==="`, `"uninstall.ts:isProtected:==="` in `install/path-spelling-census.test.ts`). Delete `isSeededState` (uninstall.ts:627) and simplify `reverseDir` call at uninstall.ts:739; derive the banner at uninstall.ts:2883 from the list. Update the stale comment at install.ts:3206-3209. Refusal outputs to assert: `left … (under a protected path …)` (install.ts:3228) and `(protected path — never removed)` (uninstall.ts:~513).

### `install/installer-paths.test-support.ts` — pre-v3 fixture

**Analog:** `makeFixture` (:132-139):
```typescript
export function makeFixture(d: string): string {
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "plans"), { recursive: true });
  writeFileSync(join(d, "CLAUDE.md"), "# User Project\n\n...");
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — ...\n");
  writeFileSync(join(d, "plans", "board.md"), "user board\n");
  return d;
}
```
Move this fixture's board to `BOARD_REL` (and the 181-call copy in `install/install.test.ts`) in the same plan as or before the refusal (Pitfall 2). Add `makePreV3StateFixture(d)` beside it, built at run time from `LEGACY_BOARD_REL` (no tracked `plans/` path). Run installs via `runInstall` (:381) which sets `GRUGOPS_HOME`.

### `scripts/adapter-byte-baseline.test.ts` — third stated transform

**Analog:** the D-14 transform in the same file. Pattern: constants for the retired and new text (:150-153), `replaceOnce` asserting exactly one occurrence (:156-160), `expectedWorkingBytes` applying per-line edits (:170-~190), then the length-delta and `changedLines` assertions (:310-334, currently `toHaveLength(2)`). Never re-pin `PRE_PHASE_ADAPTER_BASELINE` (:75). New transform applies to all 17 adapters (INVARIANT line) plus the coordinator's `plans/board.md` line; update the test title at :249 and message at :307 ("TWO recorded divergences"). Land the final INVARIANT once to avoid two transform edits.

## Shared Patterns

- **Derive, then pin two-sided:** named `*_COUNT` constant compared with `.length` (host-tools.ts:921 / host-tools.test.ts:110; `LOCATOR_CONSUMER_COUNT` check-foundation-guards.test.ts:2382-2392). Every moved pin gets a dated reason comment ("THE PIN MOVING IS THE PIN WORKING").
- **Compiled twin:** every edited/new `.ts` gets its committed `.js` (`npm run build`; `check:build-parity`, package.json:17).
- **Refusal convention:** one stderr sentence, nothing on stdout, nothing written, `process.exit(1)` (install.ts:2867-2871).
- **Scratch installs:** only through `runInstall` from test-support (sets `GRUGOPS_HOME`).
- **Hand-listed mirrors:** keep `kit-model.ts` import-free of state-layout (Pitfall 8; `scripts/adapters-freshness.ts:220-235`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| exit code 2 ("could not run") in `check-state-paths.ts` | gate CLI | batch | No `scripts/*.ts` gate exits 2 today; define it in the gate header and test it |

## Metadata

**Analog search scope:** `install/*.ts`, `scripts/check-*.ts`, `scripts/*.test.ts`, `package.json`, `.github/workflows/ci.yml`
**Tracked-source check:** `install/host-tools.js` tracked; all cited analogs are tracked source.
**Pattern extraction date:** 2026-10-20
