# Phase 19: Factory Auto-UAT Harness — Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 6 new/modified (2 new TS sources, 1 new TS test, 1 new gated E2E test, package.json + docs/gate edits)
**Analogs found:** 6 / 6 (every new file has an in-repo clone target; only the Tier-2 E2E harness is a *composite* of two analogs — no single exact e2e file exists)

> This phase is almost entirely **clone + wire**, not invent. RESEARCH.md already named the targets; this map confirms each against the live source and pins exact line ranges so the planner/executor can copy the idiom byte-faithfully rather than improvise. Every excerpt below was read this session.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/check-uat-oracles.ts` | utility (build-gate aggregator) | file-I/O + transform (grep/diff) + request-response (spawn child CLI) | `scripts/check-foundation-guards.ts` | **exact** (aggregator spine, `CHECK_ROOT`, `pass/fail/warn`, `grepFiles`) — the A2 oracle's child-spawn half clones `hooks/guard.test.ts` |
| `scripts/check-uat-oracles.test.ts` | test (plant-and-run vitest) | file-I/O (mirror) + request-response (spawn .js) | `scripts/check-foundation-guards.test.ts` | **exact** (`CHECK_ROOT` mirror/plant idiom); A2-wiring case also clones `hooks/guard.test.ts` `runGuard` |
| `scripts/e2e/uat-live.test.ts` | test (gated headless E2E) | request-response (spawn `claude`) + file-I/O (mkdtemp scaffold) | composite: `hooks/guard.test.ts` (`spawnSync` child-CLI) + `scripts/catalog-freshness.ts` (`mkdtempSync` hermetic temp) | **role-match / composite** — no exact e2e analog exists; nearest building blocks mapped |
| `package.json` (edit: add `test:e2e`) | config | n/a | existing `scripts` block (`freshness`, `freshness:catalog`) | **exact** (script shape: `tsc --outDir .tmp-build && node …` for any committed-`.js` lane) |
| `docs/dogfood-human-runbook.md` (edit) | docs | n/a | itself (existing Check 1/2/3 structure) | **exact** (extend in place; name the 3 lanes, mark authoritative vs advisory/human) |
| `agent-factory/workflows/05-pr-quality-gate.md` (edit) | config (single-source gate) | n/a | the "Test-integrity wire" bullet at `:37` (reference-don't-restate pattern) | **exact** (reference the new lane the same way; never fork gate logic) |

**Build/freshness wiring (not a new file — a convention to honor):** `scripts/freshness.ts` `OUTPUT_DIRS = ["install","scripts","hooks"]` recurses `scripts/` (so a new `scripts/e2e/` `.js` is auto-collected) and `.gitattributes` already pins `scripts/**/*.js text eol=lf`. Confirmed `scripts/e2e/` is NOT gitignored.

---

## Pattern Assignments

### `scripts/check-uat-oracles.ts` (utility / aggregator)

**Analog:** `scripts/check-foundation-guards.ts` (the house aggregator spine). Clone the spine verbatim; replace the six `guard*()` functions with three oracle functions (`oracleWr05Wording`, `oracleHooksWiring`, `oracleParity`).

**Aggregator spine — ROOT/CHECK_ROOT + abs helpers + pass/fail/warn counter** (`check-foundation-guards.ts:44-72`):
```typescript
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);
const fileExists = (rel: string): boolean => existsSync(abs(rel));
const readText = (rel: string): string => readFileSync(abs(rel), "utf8");

let FAILS = 0;
const pass = (m: string): void => { process.stdout.write(`  PASS  ${m}\n`); };
const fail = (m: string): void => { process.stdout.write(`  FAIL  ${m}\n`); FAILS += 1; };
const warn = (m: string): void => { process.stdout.write(`  WARN  ${m}\n`); }; // never increments FAILS
```
> The `CHECK_ROOT` override is load-bearing: it is what lets the `.test.ts` plant violations into a hermetic mirror and run the **committed `.js`** against it. Reproduce it exactly.

**`grepFiles` — the B3 oracle's core idiom** (`check-foundation-guards.ts:76-86`):
```typescript
// grep -rnE over an explicit file list: return `path:lineno:line` hits. Missing files silently skipped.
function grepFiles(files: string[], re: RegExp): string[] {
  const hits: string[] = [];
  for (const rel of files) {
    if (!fileExists(rel)) continue;
    const lines = readText(rel).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) hits.push(`${rel}:${i + 1}:${lines[i]}`);
    }
  }
  return hits;
}
```
> **B3 NOTE (from RESEARCH, confirmed this session):** the CONTEXT slug `"dropped P8 → guarded P10 → re-verified P11"` is a *summary*, NOT a literal string in any doc. The oracle must assert the **three semantic beats per file** (Phase 8 dropped / Phase 10 `guard_wr05` guarded / Phase 11 re-verified GREEN), e.g. three regexes per file, OR a `missing-file fail-red` (CR-01) on absence. A naive exact-string grep would false-fail correct docs. Verified the three beats are present in all four scan files (see Shared Patterns → B3 scan set + wording below). Use `grepFiles(SCAN, beatRe).length === SCAN.length` per beat, with a missing-file = FAIL guard like `:135-138`.

**Result tail — exit-code contract** (`check-foundation-guards.ts:476-483`):
```typescript
process.stdout.write("\n== Result ==\n");
if (FAILS === 0) {
  process.stdout.write("ALL CHECKS PASSED\n");
  process.exit(0);
} else {
  process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
  process.exit(1);
}
```
> `ALL CHECKS PASSED` / exit 0, `N CHECK(S) FAILED` / exit 1. WARN never fails the build. The `.test.ts` smoke case asserts `ALL CHECKS PASSED` literally — keep the string.

**Missing-file fail-red (CR-01) — fail closed on a deleted input** (`check-foundation-guards.ts:135-138`):
```typescript
if (!fileExists("AGENTS.md")) {
  fail("AGENTS.md missing (required for Codex cap check)");
  return;
}
```
> Every oracle that reads a fixed file must FAIL (never vacuous-PASS) when that file is absent. This is the no-fabrication floor in code form — clone it for each of the three oracles.

**A2-wiring oracle — read `hooks.json`, then spawn the committed `guard.js`.** This half clones the child-CLI harness (see `hooks/guard.test.ts` excerpt below) rather than the aggregator. The oracle reads `hooks/hooks.json`, asserts the *wiring contract* (matcher + command name), then spawns `guard.js` with a matched payload and asserts the deny JSON. It does **NOT** re-test guard logic (`guard.test.ts` covers that 26/26). See Shared Patterns → A2 wiring facts for the exact strings.

---

### `scripts/check-uat-oracles.test.ts` (test / plant-and-run)

**Analog:** `scripts/check-foundation-guards.test.ts` (the `CHECK_ROOT` mirror/plant harness). For the A2-wiring case, also clone `hooks/guard.test.ts`'s `runGuard`/`payload`.

**Mirror + run-against-mirror harness** (`check-foundation-guards.test.ts:20-96`):
```typescript
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js"); // → check-uat-oracles.js

const GUARD_INPUTS = [ /* every repo-relative file the guard reads */ ];
const tmpDirs: string[] = [];

function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-fg-")); // → "grugops-uat-"
  tmpDirs.push(m);
  for (const rel of GUARD_INPUTS) {
    mkdirSync(join(m, dirname(rel)), { recursive: true });
    cpSync(join(ROOT, rel), join(m, rel));
  }
  return m;
}

function runIn(checkRoot: string): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], { encoding: "utf8", env: { ...process.env, CHECK_ROOT: checkRoot } });
}
const out = (r: SpawnSyncReturns<string>): string => `${r.stdout ?? ""}${r.stderr ?? ""}`;

afterAll(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });
```

**Plant-one-violation → expect-fail-red shape** (`check-foundation-guards.test.ts:100-108`):
```typescript
it("guard_wr05 comma-form (tools: ... Agent) → nonzero + 'spawn grant'", () => {
  const m = mirror();
  appendFileSync(join(m, ".claude/agents/grugops-orchestrator.md"), "\ntools: Read, Agent\n");
  const r = runIn(m);
  expect(r.status).not.toBe(0);
  expect(out(r)).toMatch(/spawn grant/i);
});
```
> For each oracle: one test plants a single real violation into the mirror and asserts `status !== 0` AND the finding names the defect. Per RESEARCH's test map, tag tests `-t "wording"` / `-t "wiring"` / `-t "parity"`.

**REAL-tree GREEN smoke** (`check-foundation-guards.test.ts:357-361`):
```typescript
it("smoke: real guard GREEN over the real tree", () => {
  const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
  expect(r.status).toBe(0);
  expect(out(r)).toContain("ALL CHECKS PASSED");
});
```
> A gate that can only ever pass is fabricated green; a gate that can only ever fail is useless. Every oracle needs BOTH a planted-FAIL case AND a real-tree-PASS smoke. Match both.

---

### `scripts/e2e/uat-live.test.ts` (test / gated headless E2E) — COMPOSITE, no exact analog

There is **no existing e2e harness** to clone wholesale. It is assembled from two proven in-repo building blocks plus the verified auth-probe shape.

**Building block 1 — child-CLI spawn + assert (from `hooks/guard.test.ts:33-57`):**
```typescript
import { spawnSync } from "node:child_process";

function runGuard(json: string, env: Record<string, string> = {}) {
  const r = spawnSync("node", [GUARD_JS], { input: json, encoding: "utf8", env: { ...process.env, ...env } });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
const payload = (command: string): string => JSON.stringify({ tool_input: { command } });
```
> The Tier-2 harness spawns `claude` (not `guard.js`) the same way: arg-array (NOT `shell:true` on the data path — ASVS V5/command-injection), `encoding:"utf8"`, env-merge. For A2-live, build the prompt and assert the **deny string** in stdout.

**Building block 2 — hermetic temp scaffold + fail-closed cleanup (from `scripts/catalog-freshness.ts:36-49, 56-77`):**
```typescript
import { mkdtempSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "grugops-uat-e2e-"));
function cleanup(): void { rmSync(tmp, { recursive: true, force: true }); }
mkdirSync(join(tmp, "scripts"), { recursive: true });
cpSync(join(ROOT, "agent-factory"), join(tmp, "agent-factory"), { recursive: true });
```
> A1 scaffolds a throwaway repo (mkdtemp + copy `agent-factory/` + `AGENTS.md`), runs `claude plugin marketplace add <abs-path>` + `install grugops@grugops --scope local` there, then `claude -p "/grugops:plan …" --output-format json`. Use a Vitest `afterAll` to `claude plugin uninstall grugops` + `marketplace remove grugops` AND `rmSync(tmp)` (Pitfall 3: never pollute the dev's real config).

**Building block 3 — the honesty gate (auth probe + LOUD-SKIP).** No in-repo analog (this is new); the verified shape from RESEARCH (`claude auth status` exits 0 logged-in / 1 not, side-effect-free):
```typescript
function claudePresentAndAuthed(): boolean {
  const which = spawnSync("command", ["-v", "claude"], { shell: true });
  if (which.status !== 0) return false;
  const auth = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8" });
  if (auth.status !== 0) return false;            // exit 1 = not logged in → loud skip, never green
  try { return JSON.parse(auth.stdout)?.loggedIn === true; } catch { return false; } // fail-closed
}
```
> **Constraint #6 mechanics:** when the probe is false, emit a DISTINCT loud marker — `console.warn("SKIPPED: claude CLI absent or unauthed — UAT A1/A2/A3 NOT exercised; status stays pending")` — and never flip any UAT file. The guard "passes" (CI stays green without a secret) but the UAT stays `pending`. A silent `it.skip` that reads as green is the forbidden fabricated pass (Pitfall 2). The `catalog-freshness.ts` fail-closed precedent (`:79-88` — "refusing to report fresh" on a non-clean run) is the same shape: never fall through to a positive verdict on an inconclusive run.

**Safety (V14, hard):** the A2-live case asserts the deny BECAUSE `GRUGOPS_PROD_DEPLOY_APPROVED` is absent. The harness MUST NEVER set/export it, and MUST use a harmless matched probe (`helm upgrade fake ./nope`) so nothing real deploys (Pitfall 4).

---

### `package.json` (edit — add the `test:e2e` lane)

**Analog:** the existing `scripts` block (`package.json:8-15`). Every committed-`.js`-running lane uses the `tsc --outDir .tmp-build && node …` shape; Vitest lanes use `vitest run`:
```json
"scripts": {
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "freshness": "tsc --outDir .tmp-build && node scripts/freshness.js",
  "generate:catalog": "tsc --outDir .tmp-build && node scripts/generate-catalog.js",
  "freshness:catalog": "tsc --outDir .tmp-build && node scripts/catalog-freshness.js"
}
```
> Tier-1 `check-uat-oracles` runs inside the default `vitest run` (via its `.test.ts`) AND can get an explicit `node scripts/check-uat-oracles.js` lane mirroring the `freshness*` shape if the gate calls it directly. Tier-2 gets a NEW `"test:e2e": "vitest run scripts/e2e"` (exact name is Claude's discretion per CONTEXT) — kept OUT of the default `test` green path so CI stays green-without-a-key. **Add NO new devDependency** (`{typescript, vitest, @types/node}` only — `package.json:16-20`).

---

### `docs/dogfood-human-runbook.md` (edit — name the 3 lanes)

**Analog:** itself. Existing structure (read this session): `## Check 1 — Plugin marketplace install + pointer resolution (D-31)` (`:49`), `## Check 2 — Live PreToolUse hook firing (SAFE-02)` (`:81`), `## Check 3 — CC sub-agent spawn path parity` (`:114`), `## Step 4 — Fill the side-by-side parity table` (`:144`). These ARE the manual procedures the Tier-2 harness automates step-for-step.
> Extend in place (clear/non-caveman voice — safety surface): add a section naming the three lanes (Tier-1 oracles / Tier-2 headless E2E / Tier-3 human) and state which is **authoritative** (Tier-1/2 real-run output) vs **advisory/human** (Tier-3 persona judgment). Keep the frozen strings consistent with `examples/03-ticket-to-pr.md` (see Shared Patterns → A3).

---

### `agent-factory/workflows/05-pr-quality-gate.md` (edit — reference, never fork)

**Analog:** the existing config-dialed pipeline wire. The gate sequence is at `:31` (`install -> lint -> typecheck -> unit -> build -> e2e -> test-integrity`); each dialed step is **referenced, not restated** — the canonical example is the Test-integrity bullet at `:37` (invokes the materialized checker, branches on exit code, records `UNKNOWN - verify` rather than faking). 
> **D-26 single-source rule (hard, repeated across the project):** all §14 gate changes land HERE ONLY; workflows 14/15 reference, never duplicate. Add the new Tier-1/Tier-2 lanes as referenced, config-dialed steps in the same reference-don't-restate style as `:37`. Reuse `quality.*` enum shape for any dial (Tier-2 self-skips on unauth, so it likely needs NO new key — A4 discretion item).

---

## Shared Patterns

### Aggregator spine (pass/fail/warn + CHECK_ROOT + exit code)
**Source:** `scripts/check-foundation-guards.ts:44-86, 476-483`
**Apply to:** `check-uat-oracles.ts` (whole file structure). Clone verbatim; swap in three oracle functions.

### Child-CLI spawn-and-assert
**Source:** `hooks/guard.test.ts:33-57` (`runGuard`, `payload`) and `scripts/check-foundation-guards.test.ts:82-87` (`runIn` with `CHECK_ROOT`)
**Apply to:** the A2-wiring oracle (spawn `guard.js`), the whole Tier-2 harness (spawn `claude`), and `check-uat-oracles.test.ts` (spawn the committed `.js`). **Always spawn the committed `.js`, never the `.ts`.**

### Hermetic temp mirror + fail-closed cleanup
**Source:** `scripts/check-foundation-guards.test.ts:71-96` (mirror/plant) and `scripts/catalog-freshness.ts:36-49, 79-88` (mkdtemp + "refuse to report fresh" on a non-clean run)
**Apply to:** the `.test.ts` plant harness and the A1 throwaway-repo scaffold. Never report a positive verdict on an inconclusive/errored run.

### A2 wiring facts (verified this session — for the wiring oracle)
**Source:** `hooks/hooks.json:5,9` + `hooks/guard.ts:34, 132`
- matcher: `hooks.hooks.PreToolUse[0].matcher === "Bash"` (`hooks.json:5`)
- command: `hooks.hooks.PreToolUse[0].hooks[0].command === 'node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.js"'` — assert it **references `guard.js`** (the wiring), don't string-equal the whole `${...}` (`hooks.json:9`)
- approval env var: `GRUGOPS_PROD_DEPLOY_APPROVED` (`guard.ts:34`)
- deny string (clear voice): `"Production deploy blocked: humans decide, agents execute."` and the reason names the env var (`guard.ts:132-135`)
- deny JSON shape (exit 0 + deny): stdout contains `"permissionDecision":"deny"` (`guard.ts:90-101`)
- matched payload: `JSON.stringify({ tool_input: { command: "kubectl apply -f deploy.yaml" } })` (matches `/\bkubectl\s+(apply|rollout|delete)\b/` at `guard.ts:52`)

### A3 parity facts (verified this session — for the structural oracle)
**Source:** `examples/03-ticket-to-pr.md:169-177` (the two-column parity table) + `docs/dogfood-human-runbook.md:131-132, 155-157`
- frozen handoff filenames: `implementation-handoff.md`, `qe-handoff.md`
- frozen gate verdict string: `READY_FOR_HUMAN_REVIEW`
- frozen validator outcome: `ALL CHECKS PASSED` (exit 0)
- parity table columns: `Sequential AGENTS.md path` (filled, agent-proven) vs `CC-native sub-agent path` (currently `pending human`)
> The structural oracle asserts both columns name the SAME filenames + SAME verdict, AND must distinguish "structurally parity-shaped + `pending human`" from "filled and matching" — it must NEVER mark a `pending human` cell passed (no-fabrication). It reads the frozen strings; the *live* fill comes from the Tier-2 A3-live run.

### B3 wording facts (verified this session — for the wording oracle)
**Source:** scan set + the three-beat claim, confirmed present in all four files this session
- scan set: `.planning/PROJECT.md` (`:135`), `.planning/STATE.md` (`:165`), `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` (`:44, :191`), `.planning/RETROSPECTIVE.md` (`:25`)
- the three semantic beats each file carries: **dropped in Phase 8** / **guarded by `guard_wr05` in Phase 10** / **re-verified GREEN after the Phase-11 persona rewrite**
> Assert the three beats per file (e.g. three regexes), NOT the literal CONTEXT summary slug (which appears NOWHERE verbatim). Missing-file → FAIL (CR-01).

### Build / freshness / LF convention (D-13)
**Source:** `tsconfig.json:7-18`, `scripts/freshness.ts:43`, `.gitattributes:11`, `package.json:8-15`
- `tsc` emits committed `.js` in place (`outDir: "./"`, `newLine: "lf"`, `noEmitOnError: true`); `*.test.ts` excluded from emit (`tsconfig:18`) → test files produce no committed `.js` (good)
- freshness `OUTPUT_DIRS = ["install","scripts","hooks"]` recurses `scripts/` → a new `scripts/e2e/*.js` is auto-collected, rebuilt-to-temp, byte-compared (`freshness.ts:43-60, 91-105`)
- `.gitattributes:11` `scripts/**/*.js text eol=lf` already covers `scripts/e2e/` — no new attribute line needed (verified `scripts/e2e/` is NOT gitignored)
**Apply to:** every new committed `.js`. Workflow: edit `.ts` → `npm run build` → commit BOTH; `npm run freshness` must stay green.

### Foundation-guards aggregator hook point (where the Tier-1 lane plugs in)
**Source:** `scripts/check-foundation-guards.ts:465-471`
```typescript
process.stdout.write("== Phase 10 foundation-guards gate (SDLC-02 / SC2) ==\n");
guardWr05();
guardAgentsBytes();
guardAdapterSize();
guardVoice();
guardCavemanPreserved();
guardRoleSize();
```
> This is the run-all block. **DECISION (Claude's discretion, per CONTEXT/RESEARCH §Architecture):** the recommended path is a **standalone `scripts/check-uat-oracles.ts`** (its own run-all block + `.test.ts`, wired as its own lane) rather than appending three calls here — mirroring how `catalog-freshness.ts` is deliberately STANDALONE and NOT folded into the foundation-guards aggregator (`catalog-freshness.ts:15-17`, D-07). If instead folding in: add `oracleWr05Wording(); oracleHooksWiring(); oracleParity();` after line 471 and extend the test's `GUARD_INPUTS` + plant cases. The standalone path is cleaner and matches the established D-07 precedent — recommend it.

---

## No Analog Found

| File | Role | Data Flow | Reason / Nearest Building Blocks |
|------|------|-----------|----------------------------------|
| `scripts/e2e/uat-live.test.ts` (the *whole* harness) | test (gated headless E2E) | request-response (spawn `claude`) | No existing e2e file drives the real `claude` CLI. It is a **composite** of: `hooks/guard.test.ts:33-57` (child-CLI spawn/assert), `scripts/catalog-freshness.ts:36-77` (mkdtemp hermetic scaffold + fail-closed cleanup), and the NEW `claude auth status` loud-skip probe (verified shape in RESEARCH §A; no in-repo precedent). The auth-probe + loud-SKIP honesty gate is genuinely new — build it from RESEARCH's verified excerpt, not a clone. |

> Everything else in this phase has an exact in-repo analog. The one genuinely new mechanic (the auth-gated loud-SKIP) is small, verified, and flagged.

---

## Metadata

**Analog search scope:** `scripts/` (aggregators, generators, freshness gates, tests), `hooks/` (guard + guard test + hooks.json), `agent-factory/workflows/05-pr-quality-gate.md`, `examples/03-ticket-to-pr.md`, `docs/dogfood-human-runbook.md`, the four `.planning/` tracking docs, `package.json`, `tsconfig.json`, `.gitattributes`, `vitest.config.ts`.
**Files scanned:** 13 (all read or grepped this session; every excerpt line-anchored against the live source).
**Pattern extraction date:** 2026-06-16

---

## PATTERN MAPPING COMPLETE

**Phase:** 19 - Factory Auto-UAT Harness — Tier 1 Deterministic Oracles + Tier 2 Headless E2E
**Files classified:** 6
**Analogs found:** 6 / 6 (5 exact clone, 1 composite of named building blocks)

### Coverage
- Files with exact analog: 5 (`check-uat-oracles.ts`, `check-uat-oracles.test.ts`, `package.json`, `dogfood-human-runbook.md`, `05-pr-quality-gate.md`)
- Files with role-match / composite analog: 1 (`scripts/e2e/uat-live.test.ts`)
- Files with no analog: 0 (the one new *mechanic* — the auth-gated loud-SKIP — has a verified spec, no in-repo precedent)

### Key Patterns Identified
- **Aggregator spine is the house pattern:** `CHECK_ROOT` override + `pass/fail/warn` (WARN never fails) + `grepFiles` + `FAILS===0 ? exit 0 : exit 1` / `ALL CHECKS PASSED`. Clone `check-foundation-guards.ts:44-86,476-483` verbatim; swap in three oracle functions.
- **Child-CLI spawn-and-assert always targets the committed `.js`:** `spawnSync("node", [JS], { input, encoding:"utf8", env:{...process.env,...} })` then assert stdout/status (`guard.test.ts:33-57`). The A2 wiring oracle reads `hooks.json` then spawns `guard.js`; it asserts the WIRING contract, never re-tests the 26/26 guard logic.
- **No-fabrication is mechanical:** missing-file → FAIL (CR-01), planted-FAIL + real-tree-PASS smoke per oracle, fail-closed on inconclusive runs, and a LOUD-SKIP (`console.warn` + never-flip-UAT) when `claude auth status` ≠ 0. A skip is never a green.
- **Verified frozen strings to assert:** deny string `"Production deploy blocked: humans decide, agents execute."` + env var `GRUGOPS_PROD_DEPLOY_APPROVED` (`guard.ts:34,132`); matcher `"Bash"` + command references `guard.js` (`hooks.json:5,9`); handoffs `implementation-handoff.md`/`qe-handoff.md` + verdict `READY_FOR_HUMAN_REVIEW` + `ALL CHECKS PASSED` (`examples/03-ticket-to-pr.md:174-177`); WR-05 three-beat (Phase 8 dropped / Phase 10 `guard_wr05` / Phase 11 re-verified GREEN) present in all four `.planning/` docs.
- **Build/freshness auto-covers the new lane:** `freshness.ts` recurses `scripts/`, `.gitattributes` pins `scripts/**/*.js` to LF, `*.test.ts` excluded from emit — a new `scripts/e2e/` needs no wiring change. Add only a `test:e2e` script; add NO devDependency.
- **Single-source gate:** all §14 changes in `05-pr-quality-gate.md` only (D-26), referenced in the `:37` reference-don't-restate style.

### File Created
`.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. The planner can point each plan's action at the exact analog + line range above and have the executor clone the idiom byte-faithfully — the Tier-1 oracles from `check-foundation-guards.ts` + `guard.test.ts`, the Tier-2 harness from the named composite building blocks, and the wiring from the confirmed build/freshness/gate conventions.
