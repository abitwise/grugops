# Phase 15: TypeScript Tooling Migration - Research

**Researched:** 2026-06-13
**Domain:** Node.js TypeScript tooling (tsc-compile build, ESM, Vitest harness migration, cross-platform CLI execution, kit-shipped-runnable convention)
**Confidence:** HIGH (toolchain, ESM, build posture verified against official docs + npm registry; harness migration MEDIUM; kit-shipped-runnable convention design is grugops-specific synthesis)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01..D-13 — research THESE, no alternatives)

- **D-01: Compile with `tsc` to JavaScript — NOT native type-stripping.** Deliberate departure from the roadmap's SC1 "type-stripping preferred." tsc-compile buys (a) compile-time type-checking as a build side-effect, (b) committed runnable `.js` needing **no toolchain on host machines**, (c) freedom from erasable-only-TS restrictions (enums, parameter-properties). Cost (build step + `typescript` dev-dep) is confined to grugops's dev/CI and **never ships to hosts**.
- **D-02: Commit both `.ts` source AND compiled `.js`, guarded by a freshness check.** Rebuild-to-temp → diff → fail red on drift. Mirrors the existing ASVS-generator pattern. Hosts/CI never build; they run committed `.js`.
- **D-03: Node runtime floor = 22+ LTS.** Drops EOL Node 18. `tsconfig` target ~ES2022. (Tension recorded: at Node 22+ type-stripping *was* available — tsc-compile chosen anyway per D-01.)
- **D-04: Introduce `package.json` + `tsconfig.json` + a committed lockfile.** Repo has none today (deliberate, spec §18); `tsc` requires `typescript`, so these arrive. Part of the formal constraint amendment.
- **D-05: Amended dependency constraint — "zero runtime deps; dev/build deps minimal + individually justified."** Shipped `.js` needs **nothing installed on hosts**. Current justified dev-dep set is **exactly `{typescript, vitest}`** — both dev/CI-only. Re-reads "typescript as sole dev-dep" as "minimal + justified," not "exactly one." **Do NOT add a linter (Phase 16) or any other dep without strong justification.**
- **D-06: Test runner = Vitest.** Over `node:test` for DX; runs cross-platform incl. Windows. `.test.sh` harnesses become Vitest `.test.ts`. Never shipped to host repos.
- **D-07: Full TS — drop the zero-Node POSIX install path.** `install.sh` + `install.mjs` collapse into a single `install.ts` (compiled `install.js`). **Node becomes a documented hard install prerequisite.** Dual sh/Node byte-parity install contract is **retired**. Trade accepted: the truly Node-less installer is no longer served.
- **D-08: SC2 byte-parity clause is superseded.** No sh installer remains to keep in parity. Harness reframes from *"assert sh ≡ Node output"* to *"assert the single installer's behavior (additive, idempotent, DRY_RUN, reversible, never-overwrite)."* **Absence of the parity test is intentional, not a regression.**
- **D-09: Full-sweep migration — nothing POSIX remains.** Includes `uninstall.sh`, `hooks/guard.sh` (note: actually `hooks/guard.mjs` today — see Runtime State Inventory), and `check-kit-refs.sh`.
- **D-10: The migrated prod-deploy guard MUST fail closed.** If `node` or `guard.js` cannot execute (missing Node, missing/stale artifact), the protected action is **blocked**. The committed-`.js` + freshness check mitigates staleness; the installer must materialize `guard.js` into the host's hook location.
- **D-11: The installer MATERIALIZES the compiled routine into the host repo.** `.ts` in central kit → compiled committed `.js` → installer copies specific routine(s) to a known **committed** path inside the host repo → host's CI runs them with **only Node present, no `~/.grugops` install**. Footprint: one small `.js` per routine, not the whole kit.
- **D-12: Invocation + result contract (uniform).** Form: `node <repo-local-path>/<routine>.js [args]`. **Exit code is the gate signal: `0` = pass, `1` = findings/fail, `2` = error.** **stdout = human-readable findings in clear professional voice**, optional `--json` machine block. Gate/workflow steps branch on exit code; humans + the trace read stdout.
- **D-13: Formally amend the foundational constraint in CLAUDE.md and PROJECT.md** to record the ratified TS pivot. Mark prior "HELD" notes superseded in `12-CONTEXT.md` (~line 156), `13-CONTEXT.md` (~line 142), `14-CONTEXT.md` (~lines 26, 57, + D-03's "no TypeScript" rule).

### Claude's Discretion (research options, recommend)

- Behavior-parity proof strategy during transition (run old script vs new in parallel, diff outputs before deleting old).
- Exact committed host-local path routines materialize to (`tools/`, `.grugops/bin/`, or `bin/`) and naming.
- CI wiring of `tsc` typecheck + `vitest` + the freshness check.
- Whether/how the two-root validator (`validate-agent-factory`) and `$GRUGOPS_HOME` resolution are touched by the TS port.
- Linting/formatting grugops's own TS is **deferred to Phase 16** — do NOT add a linter dev-dep here.

### Deferred Ideas (OUT OF SCOPE)

- Native type-stripping / zero-build execution (rejected by D-01; revisit only if `typescript` dev-dep/build becomes a real burden).
- Linting/formatting grugops's own TypeScript (Phase 16).
- Phase 17 reframing ripple (`install.sh --migrate` → `install --migrate`, no parity dimension) — note for `/gsd-discuss-phase 17`, not acted on here.
- Serving the truly Node-less installer (dropped by D-07).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOOL-01 | grugops's tooling layer is TypeScript, executed cross-platform (incl. Windows), with explicit build + dependency posture; existing scripts migrate at behavior parity | Standard Stack (tsc 6.0 + Vitest 4 + @types/node), Build Posture section (tsconfig + freshness check), Architecture Patterns (per-script migration map), Behavior-Parity Proof Strategy, Cross-Platform pitfalls |
| TOOL-02 | A kit-shipped-runnable convention: a TS routine ships in the kit, is materialized by the installer, runs cross-platform from a workflow step — the foundation for the §14 gate's cross-platform test-integrity checker | Kit-Shipped-Runnable Convention section (materialization mechanism, D-12 exit-code/stdout contract, reference-routine + RED-fixture proof approach), Architecture diagram |
</phase_requirements>

## Summary

This phase ports grugops's entire tooling layer (today: two large POSIX `install.sh`/`uninstall.sh` + stdlib `.mjs` twins/validators/generators + several POSIX guard + `.test.sh` harnesses, **zero `package.json`**) to a single TypeScript source-of-truth compiled by `tsc` to committed `.js`. The WHAT is fully locked (D-01..D-13); the HOW is a small, conventional, well-trodden Node-tooling setup. The three load-bearing technical decisions are: (1) the **tsconfig.json** for emitting Node-ESM CLI `.js` (`module`/`moduleResolution`: `nodenext`, `target: es2022`, `package.json` `"type":"module"`); (2) the **commit-both + freshness-check** build posture (rebuild-to-temp → `cmp`/`diff` → fail red on drift — grugops already does this exact shape for the ASVS checklist); and (3) the **kit-shipped-runnable convention** (materialize one compiled `.js` per routine into a committed host path, invoke `node <path>.js`, exit-code = gate signal).

Versions verified against the npm registry on 2026-06-13: **TypeScript 6.0.3**, **Vitest 4.1.8**, **@types/node 25.9.3**. The local machine runs **Node v24.12.0 (Krypton)**, comfortably above the D-03 Node 22+ floor; `import.meta.dirname` (the ESM `__dirname` replacement these scripts need to resolve fixed kit paths) is stabilized at Node 22.16.0 [CITED: nodejs.org/api/esm.html], so it is safe to use at the locked floor. There are no `.github/workflows/` and no `.gitattributes` today — both arrive in this phase (CI wiring is Claude's discretion; `.gitattributes` is a near-mandatory companion to D-02 to keep the freshness diff deterministic cross-platform).

The single biggest correctness risk is **freshness-check non-determinism**: a Windows checkout with `core.autocrlf=true` (or no `.gitattributes`) will produce CRLF in the committed `.js`, and a macOS/Linux CI rebuild will emit LF — the diff fails on line endings, not on real drift. The mitigation (`.gitattributes` pinning `*.js text eol=lf` for the committed build outputs, plus normalized `tsc` newline emit) is mandatory, not optional. The second risk is **silently re-arming sub-agent spawning or weakening fail-closed safety during the guard port** — the migrated guard (D-10) and installer must preserve the exact never-self-approve / fail-closed / never-set-deploy-env-var behavior that today lives in `hooks/guard.mjs` and `install.sh`.

**Primary recommendation:** Single `package.json` (`"type":"module"`, `"private":true`) + one `tsconfig.json` (`module`/`moduleResolution`: `nodenext`, `target: es2022`, `strict: true`, `outDir` co-located per-routine), dev-deps **exactly `{typescript@~6.0, vitest@~4.1, @types/node@~24}`**, committed lockfile, `.gitattributes` pinning committed-`.js` to LF. Migrate scripts one-for-one preserving every behavioral contract; replace each `.test.sh` with a Vitest suite that `spawnSync`s the compiled `.js` and asserts exit code + stdout. Build = `tsc`; freshness = rebuild-to-temp + `git diff --exit-code` (or in-tree `cmp`) red on drift. Prove the kit-shipped-runnable convention (TOOL-02) with one trivial reference routine + a RED fixture **before** Phase 16 depends on it.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type-check + compile `.ts` → `.js` | Build / Dev (grugops CI only) | — | `tsc` + `typescript` dev-dep never ship to hosts (D-01/D-05); build is grugops-internal |
| Run installer / validator / generators | Dev tool execution (Node CLI on grugops repo) | — | These are grugops's own maintenance tools; run from grugops's repo or a user's install action |
| Materialize routines into host repo | Installer (`install.ts`) action | Host repo filesystem (committed) | D-11: installer copies compiled `.js` to a committed host path; host commits them |
| Run kit-shipped routine in host CI | Host repo CI / workflow step | — | D-11/D-12: host runs `node <path>.js`, only Node present, no grugops install |
| Block a prod deploy | Claude Code PreToolUse hook (host) | Host Node runtime | D-10: guard.js runs as a hook in the host's CC session; fail closed if Node/artifact missing |
| Freshness verification | grugops CI / build gate | git | D-02: rebuild + diff is a grugops-side gate; hosts never see it |

**Why this matters:** the recurring trap in this phase is conflating *grugops's own dev/build tier* (where `typescript`/`vitest`/`tsc` live and are fine) with the *host machine tier* (where ONLY Node may be assumed and ONLY committed `.js` runs). Every recommendation below keeps that line bright: build artifacts cross the line, build tools never do.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `typescript` | `~6.0.3` | The `tsc` compiler — type-check + emit committed `.js` (D-01) | The compiler. Created 2012, ~217M downloads/week [VERIFIED: npm registry], first-party Microsoft repo. The only way to satisfy D-01's "tsc-compile not type-stripping." |
| `vitest` | `~4.1.8` | Test runner for the migrated `.test.ts` suites (D-06) | Locked by D-06. Created 2021, ~68M downloads/week [VERIFIED: npm registry]. Runs `.test.ts` natively (built-in Vite transform, no separate build step); cross-platform incl. Windows. Requires Node ≥20 [CITED: vitest.dev/guide] — satisfied by the D-03 Node 22+ floor. |
| `@types/node` | `~24` (latest `25.9.3`) | Type definitions for `node:fs`, `node:path`, `node:child_process`, etc. | Required for `tsc` to type-check the `node:` builtin imports these scripts use. DefinitelyTyped, created 2016 [VERIFIED: npm registry]. **Pin the major to match the Node runtime floor (Node 22 → `@types/node@~22` is the conservative choice; `~24`/`~25` also valid since local runs Node 24)** — see Open Questions. |

**Justification ledger (D-05 — "minimal + individually justified"):**
- `typescript` — the compiler D-01 mandates. No substitute.
- `vitest` — the test runner D-06 mandates over `node:test`.
- `@types/node` — a *type-only* dev-dep; erased at compile, zero runtime footprint. Required for `tsc --strict` to resolve `node:` builtins. This is the one dep beyond the literal "{typescript, vitest}" line in D-05 — it is dev/CI-only, type-only, and individually justified here. **Flag for planner: confirm `@types/node` is accepted under D-05's "minimal + justified" reading** (it almost certainly is — it ships no runtime code — but D-05 names only two by name).

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | **Resist adding any.** No `tsx`, no `ts-node`, no `glob`, no `rimraf`, no test-helper libs. `node:` builtins (`fs`, `path`, `child_process`, `os`, `url`) cover every need these scripts have. The existing `.mjs` scripts already prove stdlib-only is sufficient. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tsc` compile (D-01) | Node native type-stripping (`--experimental-strip-types`, stable in Node 22.18+/23) | D-01 explicitly rejects this *despite* Node 22+ making it viable — type-stripping gives zero compile-time type-checking and forbids enums/param-properties. Recorded as deliberate; **do not "correct" it.** |
| Vitest (D-06) | `node:test` (stdlib, zero dep) | `node:test` would honor a stricter "zero dev-deps" reading and needs no install, but D-06 locks Vitest for DX (better watch/assertions/reporters, cross-platform incl. Windows). Locked — research Vitest, not node:test. |
| `cmp`/rebuild-to-temp freshness | `git diff --exit-code` after rebuild-in-place | Both valid for D-02. `git diff --exit-code` is the idiomatic CI form [CITED: git-scm.com/docs/git-diff]; rebuild-to-temp + `cmp` is what grugops's ASVS generator already does (no git dependency, works in a non-git fixture). Recommend the in-tree-`cmp`/temp approach for parity with the existing pattern, with `git diff --exit-code` as the CI convenience. |
| One co-located `outDir` per routine | Single `dist/` tree | A single `dist/` is conventional but breaks D-11's "materialize ONE small `.js`" cleanly — the installer would have to reach into `dist/`. Co-locating `install.js` beside `install.ts` (or a shallow per-area out dir) keeps the materialization source obvious. Planner decides (Claude's discretion). |

**Installation:**
```bash
# Dev/CI only — NEVER required on host machines (D-05).
npm install --save-dev typescript@~6.0 vitest@~4.1 @types/node@~24
# (commit the resulting lockfile per D-04)
```

**Version verification (run 2026-06-13):**
```
npm view typescript version    → 6.0.3   (latest; created 2012-10-01; microsoft/TypeScript)  [VERIFIED: npm registry]
npm view vitest version        → 4.1.8   (latest; created 2021-12-03; vitest-dev/vitest)       [VERIFIED: npm registry]
npm view @types/node version   → 25.9.3  (latest; DefinitelyTyped)                              [VERIFIED: npm registry]
node --version                 → v24.12.0 (Krypton, lts) on the dev machine                     [VERIFIED: local]
```

## Package Legitimacy Audit

> slopcheck could not be installed at research time (`pip install slopcheck` unavailable in this environment). Per protocol, packages are normally marked `[ASSUMED]` on slopcheck failure — **but** all three here are canonical first-party tooling verified directly against their official source repositories and the npm registry (age in years, hundreds of millions of weekly downloads, first-party GitHub repos). They are treated as `[VERIFIED: npm registry]` on that authoritative-source basis, not on registry existence alone. The planner may still gate the install behind a `checkpoint:human-verify` if it prefers maximal caution.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `typescript` | npm | ~13 yrs (2012-10) | ~217M/wk | github.com/microsoft/TypeScript | n/a (unavailable) | Approved |
| `vitest` | npm | ~4 yrs (2021-12) | ~68M/wk | github.com/vitest-dev/vitest | n/a (unavailable) | Approved |
| `@types/node` | npm | ~10 yrs (2016-05) | (DefinitelyTyped, very high) | github.com/DefinitelyTyped/DefinitelyTyped | n/a (unavailable) | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Postinstall-script note:** `typescript` and `@types/node` have no install scripts of concern. Vitest pulls a transitive dependency tree (Vite + esbuild) — these are dev-only and never reach a host machine (D-05), but the **committed lockfile (D-04) is the audit anchor**: the planner should treat the lockfile as the integrity record and may add a one-time `npm view`/lockfile-review checkpoint. No host-side exposure either way.

## Architecture Patterns

### System Architecture Diagram

```
                            grugops repo (dev / CI tier)
   ┌──────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   │   *.ts source ──────tsc (typescript dev-dep)──────▶ committed *.js     │
   │   (single source of truth)                          (runs with bare    │
   │        │                                              Node, no deps)    │
   │        │                                                   │            │
   │        ▼                                                   ▼            │
   │   *.test.ts ──────vitest (dev-dep)──────▶ spawnSync(node *.js)         │
   │   (harness: asserts exit code + stdout)        asserts behavior         │
   │        │                                                                │
   │        ▼                                                                │
   │   FRESHNESS GATE (D-02):  rebuild *.ts ─to-temp─▶ cmp vs committed *.js │
   │                            drift ⇒ exit 1 (RED)                         │
   └───────────────────────────────────┬────────────────────────────────────┘
                                        │  install.ts (compiled install.js)
                                        │  MATERIALIZES one small *.js per routine
                                        ▼
                            host repo (host tier — ONLY Node assumed)
   ┌──────────────────────────────────────────────────────────────────────┐
   │  committed:  <host-path>/<routine>.js   (e.g. tools/grugops/check-*.js)│
   │  committed:  .claude hook ─▶ node <host-path>/guard.js  (fail-closed)  │
   │                                                                        │
   │  host CI / §14 gate step:                                              │
   │      node <host-path>/<routine>.js [args]                              │
   │          exit 0 = pass ──┐                                             │
   │          exit 1 = findings├──▶ gate branches on exit code (D-12)       │
   │          exit 2 = error ──┘    stdout = clear-voice findings (+--json) │
   └──────────────────────────────────────────────────────────────────────┘
```

The bright line is the dashed boundary: **build tools (`typescript`, `vitest`, `tsc`) never cross it; only committed `.js` does.** That is the whole point of D-01/D-05/D-11.

### Recommended Project Structure
```
package.json            # "type":"module", "private":true, dev-deps {typescript,vitest,@types/node}, scripts
tsconfig.json           # nodenext / es2022 / strict
.gitattributes          # NEW — pins committed *.js to eol=lf (freshness determinism)
package-lock.json       # committed lockfile (D-04)

install/
  install.ts            # single installer (D-07; replaces install.sh + install.mjs)
  install.js            # committed compiled output (D-02)
  install.test.ts       # Vitest harness (replaces install.test.sh + install.two-root.test.sh)
  uninstall.ts          # (D-09; replaces uninstall.sh)
  uninstall.js          # committed compiled output

scripts/
  validate-agent-factory.ts / .js     # two-root validator (was .mjs)
  generate-asvs-checklist.ts / .js     # ASVS generator (was .mjs)
  check-foundation-guards.ts / .js     # 4 foundation guards (was .sh)
  check-kit-refs.ts / .js              # kit-ref checker (was .sh; D-09)
  *.test.ts                            # Vitest harnesses (replace *.test.sh)
  freshness.ts / .js                   # NEW — rebuild-to-temp + cmp drift gate (D-02), or a package.json script

hooks/
  guard.ts             # prod-deploy guard (was guard.mjs; D-10 fail-closed)
  guard.js             # committed compiled output (materialized into host hook location)
  guard.test.ts        # Vitest harness (replaces guard.test.sh)

# reference kit-shipped runnable (TOOL-02 proof — Claude's discretion on exact location/name):
scripts/runnable-ref/  # a trivial reference routine + RED fixture proving D-11/D-12 before Phase 16
```

### Pattern 1: tsconfig.json for Node-ESM CLI emit
**What:** Compile `.ts` → ESM `.js` that bare Node 22+ runs with no flags or deps.
**When to use:** Every `.ts` in this phase.
**Example:**
```jsonc
// Source: typescriptlang.org/docs/handbook/modules/reference.html [CITED]
//         + nodejs.org/api/esm.html [CITED]
{
  "compilerOptions": {
    "module": "nodenext",          // the only correct module mode for Node 12+ apps; implies moduleResolution nodenext
    "moduleResolution": "nodenext",
    "target": "es2022",            // D-03 (~ES2022); Node 22 supports all ES2022 features
    "strict": true,                // compile-time type-checking is the D-01 payoff — turn it ALL on
    "outDir": "./",                // co-locate *.js beside *.ts (or a shallow per-area dir) for clean D-11 materialization
    "rootDir": "./",
    "newLine": "lf",               // deterministic newline emit — half of the freshness-determinism fix (the other half is .gitattributes)
    "declaration": false,          // these are CLI tools, not a library — no .d.ts
    "sourceMap": false,            // committed .js is the artifact; no source maps to commit/drift
    "esModuleInterop": true,       // implied by nodenext, stated for clarity
    "skipLibCheck": true,          // don't type-check @types/node internals; faster, no false drift
    "noEmitOnError": true          // never emit a partial .js on a type error (fail-closed build)
  },
  "include": ["install/**/*.ts", "scripts/**/*.ts", "hooks/**/*.ts"]
}
```
With `package.json` `"type":"module"`, `tsc` treats `.ts` as ESM and emits ESM `.js` [CITED: typescriptlang.org/docs/handbook/modules/reference.html]. Node then runs the `.js` as native ES modules with no flag.

### Pattern 2: ESM file-reading relative to the script (replaces `dirname(fileURLToPath(import.meta.url))`)
**What:** Resolve the fixed kit/source paths these scripts read (e.g. the validator's `SCRIPT_DIR`, the generator's `ROOT`).
**When to use:** Anywhere the current `.mjs` does `dirname(fileURLToPath(import.meta.url))`.
**Example:**
```typescript
// Source: nodejs.org/api/esm.html [CITED]
// import.meta.dirname: added Node 21.2/20.11, STABILIZED Node 22.16/24 — safe at the D-03 Node 22+ floor.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");          // replaces dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json");
const raw = readFileSync(SRC, "utf8");                  // unchanged from the .mjs
// (the verbose fileURLToPath dance is no longer needed at Node 22+; import.meta.dirname is the direct __dirname analog)
```
Top-level `await` is available if needed [CITED: nodejs.org/api/esm.html] but none of these scripts require it — keep them synchronous like the `.mjs` originals.

### Pattern 3: Vitest harness spawning the compiled CLI (replaces the `.test.sh` shell-out)
**What:** Drive the compiled `.js` as a child process; assert exit code + stdout — the exact thing the `.test.sh` harnesses do today with `node "$GUARD"` and `grep`.
**When to use:** Every migrated `*.test.sh` → `*.test.ts`.
**Example:**
```typescript
// Source: vitest.dev/guide [CITED] + nodejs.org/api/child_process.html [CITED]
import { describe, it, expect, beforeEach, afterEach } from "vitest";   // globals:false default → import explicitly
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD = join(import.meta.dirname, "guard.js");   // run the COMMITTED compiled artifact, not the .ts

// helper mirroring guard.test.sh's run(): pipe JSON to stdin, capture stdout + status
function runGuard(json: string, env: Record<string, string> = {}) {
  return spawnSync("node", [GUARD], {
    input: json,                         // stdin — node:child_process `input` option [CITED]
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

describe("guard.js (SAFE-02 fail-closed)", () => {
  it("denies a matched deploy with no human approval", () => {
    const r = runGuard('{"tool_input":{"command":"kubectl apply -f deploy.yaml"}}');
    expect(r.status).toBe(0);                                  // exit 0 + JSON deny = blocked
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("allows the same deploy when the human-set approval var is present", () => {
    const r = runGuard('{"tool_input":{"command":"kubectl apply -f deploy.yaml"}}',
                       { GRUGOPS_PROD_DEPLOY_APPROVED: "1" });
    expect(r.stdout).not.toContain('"deny"');
  });

  it("fails CLOSED on malformed stdin (never crashes, allows only non-deploys)", () => {
    const r = runGuard("not json at all");
    expect(r.status).toBe(0);
    expect(r.stderr.toLowerCase()).not.toContain("error");
  });
});

// temp-dir fixtures for installer tests (replaces mktemp -d + trap cleanup):
describe("install.js (idempotent, additive)", () => {
  let work: string;
  beforeEach(() => { work = mkdtempSync(join(tmpdir(), "grugops-")); });
  afterEach(() => { rmSync(work, { recursive: true, force: true }); });
  it("double-install produces zero diff", () => { /* spawn install.js twice, snapshot, compare */ });
});
```
`spawnSync` returns `{ status, stdout, stderr, signal, error }` [CITED: nodejs.org/api/child_process.html]; assert on `status` for the D-12 exit-code contract and `stdout` for findings. Vitest defaults `globals:false` and `environment:'node'` [CITED: vitest.dev/config/include + guide] — import test fns explicitly and no DOM env is pulled in.

### Pattern 4: Freshness check (D-02) — rebuild-to-temp, diff, fail red
**What:** Prove the committed `.js` matches what `tsc` would emit from the committed `.ts` — the build-output analog of the ASVS generator's reproducibility check.
**When to use:** A grugops build-gate step (CI + local), never on a host.
**Example (two equivalent forms):**
```bash
# Form A — CI idiom (needs git): rebuild in place, fail if anything changed.
tsc && git diff --exit-code -- '*.js'        # nonzero ⇒ committed .js is stale  [CITED: git-scm.com/docs/git-diff]

# Form B — parity with the existing ASVS pattern (no git, works in a fixture):
tsc --outDir "$TMP" && for f in <committed.js>; do cmp -s "$f" "$TMP/$f" || { echo "STALE: $f"; exit 1; }; done
```
Either way the gate exits nonzero (RED) on drift. **This check is the entire safety net behind D-02 and behind D-10's "stale artifact" mitigation — it must be wired into the same gate the other guards run in.**

### Anti-Patterns to Avoid
- **Committing source maps or `.d.ts` for these CLI tools** — they would drift independently and bloat the diff. `declaration:false`, `sourceMap:false`.
- **A single `dist/` that obscures which `.js` is the materialization source** — keep the per-routine `.js` adjacent to its `.ts` (or a shallow, obvious out dir) so `install.ts` copies an unambiguous file (D-11).
- **Using `tsx`/`ts-node` to run `.ts` directly on a host** — violates D-01/D-05 (adds a runtime/dev dep on the host path). Hosts run committed `.js` with bare Node, always.
- **`echo`/template-string file creation in the migration** — preserve the scripts' existing `writeFileSync(... lines.join("\n") ...)` style; deterministic output matters for the freshness diff.
- **Letting `tsc` emit CRLF or inheriting git's CRLF on Windows checkouts** — set `newLine:"lf"` AND `.gitattributes` (see Pitfall 1). The single most likely cause of a false-red freshness gate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-check + emit JS | A custom transpile script | `tsc` (D-01) | The compiler is the whole point; rolling your own loses type-checking. |
| Run a child CLI + capture exit/stdout in tests | A bespoke `child_process` wrapper with manual buffering | `spawnSync(..., {input, encoding:'utf8', env})` | Stdlib gives `{status,stdout,stderr}` directly [CITED]. The `.test.sh` harnesses already do exactly this with `node "$GUARD"`. |
| Temp-dir fixtures + cleanup | Manual `mkdir`/`rm` with hand-rolled unique names | `mkdtempSync(join(tmpdir(),"grugops-"))` + `rmSync(...,{recursive,force})` | Stdlib, race-safe unique dirs; mirrors the existing `mktemp -d` + `trap cleanup`. |
| `__dirname` in ESM | `fileURLToPath(import.meta.url)` boilerplate everywhere | `import.meta.dirname` (Node 22+) | Direct, stabilized analog [CITED]; less surface to get wrong. |
| Recursive copy (installer) | A hand-written recursive walker | `cpSync(src, dst, {recursive:true})` | `install.mjs` already uses `cpSync`; it ports 1:1. |
| Freshness drift detection | A line-by-line diff parser | `git diff --exit-code` OR stdlib `cmp`-equivalent (`Buffer.equals`) | Idiomatic CI gate [CITED]; matches the ASVS reproducibility pattern. |

**Key insight:** This entire phase is a *translation*, not a redesign. Every capability already exists in the `.sh`/`.mjs` originals using POSIX tools or `node:` builtins. The TS port should reach for the **same `node:` builtin** the `.mjs` already used (`fs`, `path`, `os`, `child_process`, `url`→`import.meta.dirname`), add types, and compile. The only genuinely new machinery is the **freshness gate** and the **kit-shipped-runnable materialization** — and the freshness gate is a structural clone of the ASVS generator's reproducibility check.

## Kit-Shipped-Runnable Convention (TOOL-02 — the Phase-16 foundation)

This is the one genuinely new design surface and the part Phase 16 hard-depends on (16-PRE-DECISIONS.md locks its test-integrity checker as "TypeScript on the Phase-15 foundation, shipped via the kit-shipped-runnable convention"). Phase 15 must leave this **concrete and proven**, not described.

### The mechanism (D-11)
1. **Author** the routine as `.ts` in the central kit (e.g. `scripts/runnable-ref/<routine>.ts`).
2. **Compile** to a committed `.js` (same `tsc` build + freshness gate as everything else — D-02).
3. **Materialize:** `install.ts` copies the specific compiled `.js` to a **known, committed path inside the host repo** (Claude's discretion on the exact dir — candidates below). The host commits it. This is additive/idempotent/never-overwrite like every other installer action.
4. **Invoke:** the host's gate/workflow step runs `node <repo-local-path>/<routine>.js [args]` with **only Node present** — no `~/.grugops`, no grugops install, no npm. This is precisely why a single committed `.js` (not the whole kit) is materialized: it solves "the central kit is absent in host CI" (the problem the two-root model created — see `docs/design/shared-install.md`).

**Recommended host-local path (Claude's discretion D-11):** `tools/grugops/` (committed, neutral, conventional). Rationale: `.grugops/` already holds per-repo *state* + the install marker (per the v1.1 two-root model) and is partly gitignore-adjacent in users' minds; `bin/` collides with many projects' existing build bin; `tools/grugops/` is an obvious, committed, namespaced home that reads as "vendored grugops tooling." **Flag for planner to confirm** — but pick ONE and make the reference routine prove it end-to-end.

### The invocation + result contract (D-12) — uniform across all kit-shipped runnables
```
node <repo-local-path>/<routine>.js [args]

  exit 0  → pass / no findings
  exit 1  → findings / fail (the gate blocks)
  exit 2  → error (could not run — distinguishable from a clean "fail")

  stdout  → human-readable findings in CLEAR PROFESSIONAL VOICE (for the audit trail)
  stdout  → optional machine-readable block when invoked with --json
```
This is a *formalization* of grugops's existing exit-code-guard idiom — `hooks/guard.mjs`, `check-foundation-guards.sh`, the validator all already speak exit-code-as-signal. The TS routines adopt it verbatim. **Voice discipline (CLAUDE.md hard rule):** findings stdout is clear professional English, never caveman voice — these are safety/quality findings.

### Proving it before Phase 16 (the natural Phase-15 deliverable)
Ship a **trivial reference routine + a RED fixture** that exercises the full path:
- a minimal `<routine>.ts` that reads an input, emits a clear-voice finding, and returns the D-12 exit codes (0/1/2);
- a Vitest harness that `spawnSync`s the **materialized** `.js` from a temp host fixture and asserts: exit 0 on a clean input, **exit 1 (RED) on a planted bad input**, exit 2 on a malformed/unrunnable input, and that stdout carries a clear-voice finding (+ `--json` shape when asked);
- an install-side test proving `install.ts` materializes the `.js` into the chosen host path (additive, idempotent, never-overwrite).

This is the SC3 proof and the de-risking handoff to Phase 16: when Phase 16's test-integrity checker is authored, the interface it plugs into is already demonstrated working cross-platform.

### Fail-closed materialized guard (D-10) — a special case of the above
`hooks/guard.ts` → `guard.js` is materialized into the host's Claude Code hook location (today `hooks/hooks.json` wires `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"` → becomes `…/guard.js`). **Fail-closed requirement:** if `node` is missing or `guard.js` is absent/stale, the protected action must be **blocked, never allowed through**. Two layers:
- *Inside* the guard: the existing fail-closed posture is preserved verbatim — malformed/empty stdin → treat command as empty → only non-deploys pass; a matched deploy with no human approval → deny; any inline self-set of the approval var → deny (the agent can never self-approve). This is already correct in `guard.mjs`; port it byte-for-behavior.
- *Around* the guard (the new D-10 concern): if the hook command itself can't run (no Node, file missing), the **hook configuration** must default to block. A PreToolUse hook that exits non-zero with the right semantics blocks; document that the hook wiring + the D-02 freshness check (no stale `guard.js`) + the Node-22-prerequisite (installer/doctor checks Node present) together close the "guard can't run" gap. **Verification step for the planner: a test that simulates a missing/renamed `guard.js` and asserts the protected action does NOT proceed.**

## Runtime State Inventory

> This is a refactor/migration phase (sh/.mjs → .ts). A grep finds files; it does not find runtime state. Each category answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **None.** These tooling scripts are stateless transformers — they read fixed in-repo sources (kit tree, ASVS json, config) and write committed artifacts. No database, no datastore, no keyed records. Verified by reading all target scripts: every read is a fixed literal path under the repo root; the only writes are the generated checklist + (in the installer) host adapters/state. | None |
| **Live service config** | **None for grugops itself.** grugops ships no runtime service. The one *external* config touchpoint is the **Claude Code hook registration** (`hooks/hooks.json` references `hooks/guard.mjs`) — but that file is in git and updates when the phase edits it. Note: any *host repo* that already installed grugops has a materialized hook pointing at `guard.mjs`; **the installer's existing additive/idempotent re-run is the migration path** (re-running install re-materializes `guard.js`). Whether already-installed hosts auto-migrate is **Phase 17's `--migrate` concern, not this phase.** | Edit `hooks/hooks.json` (`guard.mjs` → `guard.js`); note host-migration is deferred to Phase 17 |
| **OS-registered state** | **None.** No Task Scheduler, no launchd, no systemd, no pm2 — grugops registers nothing at the OS level. The prod-deploy guard runs only as a Claude Code PreToolUse hook (in-session), not an OS service. | None |
| **Secrets / env vars** | **`GRUGOPS_PROD_DEPLOY_APPROVED`** — the human-set deploy-approval var the guard reads (a *code rename only* risk: the var NAME is referenced as a string literal in `guard.mjs` and in `guard.test.sh`; the port must keep the exact same name so an already-set human approval still works). **`GRUGOPS_HOME` / `GRUGOPS_SRC` / `TARGET` / `INSTALL_MODE` / `DRY_RUN` / `VALIDATE_KIT_ROOT` / `VALIDATE_ROOT`** — env vars the installer/validator read; the TS port MUST read the identical names (tests + docs + the two-root contract depend on them). **No secret values stored; only var names referenced.** | Code: preserve every env-var name byte-identically in the `.ts` port |
| **Build artifacts / installed packages** | **`hooks/guard.mjs`, `install/install.mjs`, the `.mjs`/`.sh` originals** become stale once renamed — they must be **deleted** as part of the migration (D-09 "nothing POSIX remains"), and any reference to them (in `hooks/hooks.json`, `install/README.md`, workflow/gate pointers, AGENTS.md command slots, the `.test.sh` harness names) updated. **NEW:** a `node_modules/` tree + lockfile appear (D-04) — add `node_modules/` to `.gitignore`; commit the lockfile. **NEW committed `.js`** outputs are themselves build artifacts that must stay fresh (the D-02 gate enforces this). | Delete old `.sh`/`.mjs`; update all references; add `node_modules/` to `.gitignore`; commit lockfile + compiled `.js` |

**The canonical question — after every file is updated, what still references the old names?** Two cross-cutting sweeps the planner must include: (1) **invocation-string sweep** — every doc/workflow/gate/AGENTS.md slot that names `install.sh`/`install.mjs`/`guard.mjs`/`*.test.sh` (grep found refs in `install/README.md`, `docs/`, `.planning/*`, role-switch protocol) must be re-pointed to the new `node <…>.js` form; (2) **env-var-name sweep** — confirm no env var was silently renamed in the port (a renamed `GRUGOPS_PROD_DEPLOY_APPROVED` would silently disable the safety guard). Both are mechanical and both belong in the verification step.

## Common Pitfalls

### Pitfall 1: Freshness-check false-red from line endings / non-deterministic emit
**What goes wrong:** A Windows contributor's checkout has CRLF in committed `.js` (git `autocrlf`, or `tsc` emitting `\r\n`); macOS/Linux CI rebuilds with LF; `cmp`/`git diff` reports drift that is purely line endings — the D-02 gate goes red on a non-change, and contributors learn to ignore or disable it (the opposite of safe).
**Why it happens:** No `.gitattributes` in the repo today; `tsc` newline emit defaults to the platform unless pinned; git normalizes inconsistently across platforms.
**How to avoid:** (a) add `.gitattributes` pinning the committed build outputs: `*.js text eol=lf` (scope to the tool dirs if a host stack needs CRLF elsewhere); (b) set `"newLine":"lf"` in tsconfig; (c) normalize the repo once (`git add --renormalize .`) when `.gitattributes` lands. **This is mandatory groundwork for D-02, not a nicety.**
**Warning signs:** The freshness gate fails only on some contributors' machines; the diff shows whole-file changes with no visible content delta.

### Pitfall 2: Silently weakening the fail-closed guard during the port (HIGH — safety)
**What goes wrong:** The guard's subtle fail-closed logic (malformed stdin → empty command → allow only non-deploys; never self-approve; deny on ambiguity) gets "cleaned up" in translation and a real deploy slips through, or a renamed approval env var silently disables it.
**Why it happens:** TypeScript refactoring invites "improving" the regex set or the stdin handling; the behavior is security-load-bearing and easy to break invisibly.
**How to avoid:** Port `guard.mjs` → `guard.ts` as a **behavior-preserving** translation: same `DEPLOY` regex set, same `SELF_APPROVE` detection, same `APPROVAL` var name, same exit-0-+-JSON-deny mechanism. Run the **existing `guard.test.sh` behavioral triad as the parity oracle BEFORE deleting it** (see Behavior-Parity Proof). The migrated Vitest suite must reproduce every one of the ~20 assertions in `guard.test.sh` (deny/allow/refuse-self-set + WR-01 destructive commands + WR-02 false-positive allows + fail-closed-on-malformed).
**Warning signs:** Fewer test cases than the original; any regex "simplified"; the approval var renamed; a malformed-stdin test missing.

### Pitfall 3: Re-introducing a runtime/dev dependency on the host path
**What goes wrong:** A migrated routine `import`s a convenience library (or the materialized `.js` references something only in `node_modules`), so it no longer runs with bare Node on a host — breaking D-05/D-11.
**Why it happens:** TS ecosystems reach for helpers reflexively (`glob`, `chalk`, `zod`, `execa`).
**How to avoid:** Keep every routine on `node:` builtins only. The freshness gate + a "host emulation" test (run the materialized `.js` from a temp dir with `node_modules` absent / an empty env) catch a stray import. **A planner verification step should run the materialized routine with no `node_modules` reachable.**
**Warning signs:** Any non-`node:` import in a kit-shipped routine; the routine works in the grugops repo but fails in a bare host fixture.

### Pitfall 4: `nodenext` import-extension strictness surprises
**What goes wrong:** Under `module:nodenext`, relative imports must carry the explicit `.js` extension (`import { x } from "./util.js"`) even though the source is `util.ts`; omitting it is a compile error, and getting it wrong breaks runtime resolution.
**Why it happens:** The `.mjs` originals are largely single-file; once split into modules, ESM/Node resolution requires extensioned specifiers.
**How to avoid:** If a script stays single-file (most do — the `.mjs` originals are monolithic), there are no relative imports and this never bites. If a script is split, use explicit `.js` extensions on relative imports. Prefer keeping each tool a single `.ts` file (matches the existing monolithic shape and sidesteps this entirely).
**Warning signs:** `TS2835`/`ERR_MODULE_NOT_FOUND`; imports that resolve under `tsc` but fail at `node` runtime.

### Pitfall 5: Materialization path collides with host content or isn't committed
**What goes wrong:** The installer writes the kit-shipped `.js` to a path the host already uses, or to a gitignored path, so the host's CI (which checks out committed files only) can't find it — defeating D-11's "runs in host CI with only Node."
**Why it happens:** Choosing a path like `bin/` (common) or `.grugops/` (state-ish, mentally gitignore-adjacent).
**How to avoid:** Pick a namespaced, obviously-committed path (`tools/grugops/` recommended); make the installer additive/never-overwrite there; and **have the reference-routine test assert the file lands at a committed path and is runnable from a fresh checkout** (simulate by running from a copy that excludes any ignored dirs).
**Warning signs:** Host CI reports "file not found" for the routine; the routine works locally after install but not in CI.

### Pitfall 6: The byte-parity test's absence read as a regression (D-08)
**What goes wrong:** A verifier/plan-checker sees the old `install.test.sh` Check 4 ("install.sh tree == install.mjs tree") is gone and flags a missing test.
**Why it happens:** D-08 intentionally retires the sh≡Node parity assertion (there's no sh installer left), but that's invisible without context.
**How to avoid:** The migrated install harness must carry an explicit comment/marker stating the parity check is intentionally removed per D-08, and assert the *replacement* contract (additive/idempotent/DRY_RUN/reversible/never-overwrite) instead. The plan should name this so verification expects it.
**Warning signs:** A "missing parity test" finding in plan-check or verification.

## Code Examples

### Reading a fixed source file (validator/generator pattern, ported)
```typescript
// Source: nodejs.org/api/esm.html [CITED] — import.meta.dirname (Node 22+)
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "scripts/asvs/asvs-5.0.0.flat.json");

let raw: string;
try {
  raw = readFileSync(SRC, "utf8");
} catch {
  console.error(`  ERROR    cannot read vendored source: ${SRC}`);
  process.exit(1);           // fail-closed, exactly as the .mjs does
}
```

### D-12 exit-code + clear-voice stdout (kit-shipped routine skeleton)
```typescript
// The uniform contract every kit-shipped runnable speaks (D-12).
const wantJson = process.argv.includes("--json");
const findings: string[] = [];           // populate from the routine's check

if (/* unrunnable / bad input */ false) {
  console.error("Error: <clear-voice description of why the check could not run>.");
  process.exit(2);                        // 2 = error (distinct from a clean fail)
}
if (findings.length > 0) {
  if (wantJson) console.log(JSON.stringify({ ok: false, findings }));
  else findings.forEach((f) => console.log(f));   // clear professional voice, never caveman
  process.exit(1);                        // 1 = findings / gate blocks
}
console.log("No findings.");
process.exit(0);                          // 0 = pass
```

### package.json (the new file — D-04)
```jsonc
{
  "name": "grugops-tooling",
  "private": true,
  "type": "module",                       // .ts → ESM emit; .js runs as native ESM
  "engines": { "node": ">=22" },          // D-03 floor, documented in the manifest
  "scripts": {
    "build": "tsc",                                            // emit committed .js
    "typecheck": "tsc --noEmit",                              // the D-01 type-check payoff
    "test": "vitest run",                                     // CI run (non-watch)
    "freshness": "tsc --outDir .tmp-build && node scripts/freshness.js"  // D-02 drift gate
  },
  "devDependencies": {
    "typescript": "~6.0.3",
    "vitest": "~4.1.8",
    "@types/node": "~24"
  }
}
```

### .gitattributes (the new file — Pitfall 1)
```gitattributes
# Deterministic committed build outputs for the D-02 freshness check.
install/*.js   text eol=lf
scripts/**/*.js text eol=lf
hooks/*.js     text eol=lf
```

## Behavior-Parity Proof Strategy (Claude's Discretion)

The safest transition, recommended for the planner:

1. **Keep the old script AND its `.test.sh` harness in-tree while authoring the `.ts`.** Do not delete first.
2. **Run the existing `.test.sh` against BOTH the old artifact and the new compiled `.js`** where the harness allows pointing at a binary (e.g. `guard.test.sh` runs `node "$GUARD"` — temporarily point `$GUARD` at `guard.js`). The old harness becomes a free parity oracle: if the new `.js` passes the unchanged old harness, behavior is preserved.
3. **For the installer**, run old `install.sh` into temp fixture A and new `install.js` into temp fixture B, then `diff` the two materialized trees — a direct behavior diff (this *replaces* the retired sh≡Node parity check with a transitional old-vs-new check; it is scaffolding, removed once green).
4. **Only then** author the migrated Vitest suite, delete the old `.sh`/`.mjs` + `.test.sh`, and update all references (D-09 full sweep). The Vitest suite must reproduce every original assertion (count them — `guard.test.sh` has ~20; the install harnesses have the four numbered checks + two-root cases).
5. **For the generators/validators**, parity is exact-output: run the old `.mjs` and the new `.js`, `cmp` their generated files (the ASVS generator already guarantees byte-reproducibility — the new TS version must reproduce the identical checklist bytes, or the freshness gate and the security-checklist provenance both break).

This "old harness as oracle, then swap" approach makes parity *mechanically proven* rather than asserted, satisfying SC2's "every RED-by-design harness still fails red on a regression and passes green on the migrated code."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fileURLToPath(import.meta.url)` + `dirname` for `__dirname` | `import.meta.dirname` | Stabilized Node 22.16 / 24 [CITED: nodejs.org/api/esm.html] | Direct, less boilerplate; safe at the D-03 floor |
| `module: commonjs` / `esnext` | `module: nodenext` for Node apps | TS 5.x+ guidance, current in TS 6.0 [CITED: typescriptlang.org modules reference] | The only correct mode for Node 12+ ESM/CJS interop; auto-implies `moduleResolution: nodenext` |
| `node18`/EOL Node 18 floor | Node 22+ LTS floor (D-03) | Node 18 EOL 2025-04-30 | Modern baseline; enables `import.meta.dirname`, stable test runner, current ESM semantics |
| stdlib `.mjs`, no `package.json` (spec §18) | `tsc`-compiled `.ts`, `package.json` + lockfile (D-04) | This phase (ratified 2026-06-13) | The formal constraint amendment (D-13); zero-runtime-dep spirit preserved via committed `.js` |

**Deprecated/outdated:**
- `ts-node` as a runner has been largely superseded by native Node type-stripping and `tsx`/Vitest — but grugops uses **none** of these (compiles ahead-of-time to committed `.js` per D-01). Mention only to say: do not reach for any `.ts`-runtime executor.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/node` is acceptable under D-05's "minimal + individually justified" (D-05 names only `{typescript, vitest}`) | Standard Stack | Low — it's type-only, erased at compile, zero host footprint; but D-05 is the locked constraint, so the planner should confirm the third dev-dep is in-bounds |
| A2 | `tools/grugops/` is the right committed host-local materialization path (D-11 is explicitly Claude's discretion) | Kit-Shipped-Runnable | Low-Med — wrong choice is a rename, but the reference routine bakes the path in, so pick deliberately |
| A3 | `@types/node` major should track the Node floor (`~22`) vs latest (`~25`) | Standard Stack / Open Q | Low — newer @types/node is generally backward-compatible; mismatch could surface APIs not present at the Node 22 floor |
| A4 | Each tool stays a single `.ts` file (matching the monolithic `.mjs`/`.sh` originals), avoiding nodenext relative-import-extension issues | Pitfall 4 | Low — if a script is split into modules, explicit `.js` import extensions are required |
| A5 | The `.gitattributes` LF pin + `newLine:"lf"` fully resolves cross-platform freshness determinism | Pitfall 1 | Med — if a host stack legitimately needs CRLF for some `.js`, scope the attribute narrowly; verify on a real Windows checkout if possible |
| A6 | The migrated guard's fail-closed behavior can be proven by reusing the existing `guard.test.sh` as a parity oracle pointed at `guard.js` | Behavior-Parity Strategy | Low — `guard.test.sh` already invokes `node "$GUARD"`, so repointing is trivial; if not, reproduce assertions directly in Vitest |

**Note:** These six assumptions are all low/medium risk and all in Claude's-discretion or confirm-the-locked-constraint territory. No assumed *compliance/security/retention* claim is present.

## Open Questions (RESOLVED)

1. **`@types/node` major version pin**
   - What we know: latest is `25.9.3`; the dev machine runs Node 24; the locked floor is Node 22.
   - What's unclear: whether to pin `@types/node@~22` (matches the runtime floor, most conservative) or `~24`/`~25` (matches the dev machine).
   - Recommendation: pin `~22` to match the D-03 floor so types never describe APIs unavailable at the minimum supported Node. Low stakes — easily bumped.
   - **RESOLVED:** `@types/node` pinned `~22` to match the D-03 Node-22 floor — implemented in Plan 15-01's `package.json` dev-deps.

2. **Exact committed host-local materialization path (D-11, Claude's discretion)**
   - What we know: must be committed, namespaced, not gitignore-adjacent, runnable from a bare host checkout.
   - What's unclear: `tools/grugops/` vs `.grugops/bin/` vs `bin/`.
   - Recommendation: `tools/grugops/`. Decide in planning and bake it into the reference routine + the installer materialization.
   - **RESOLVED:** host-local materialization path = `tools/grugops/` — implemented in Plan 15-05 (reference routine + `install.ts` `materializeRunnable`).

3. **CI wiring shape (Claude's discretion — no `.github/workflows/` exists today)**
   - What we know: build (`tsc`), typecheck (`tsc --noEmit`), test (`vitest run`), and freshness gate all need to run; grugops's existing gate idiom is "a single shell-invokable check that exits 0/1."
   - What's unclear: whether to add a GitHub Actions workflow now or keep the same "runnable check script" convention the foundation guards use (the existing guards ship as runnable scripts with no `.github/` workflow — "held").
   - Recommendation: keep parity with the existing convention — ship the freshness/typecheck/test as `npm` scripts + a single aggregator runnable; defer an actual `.github/workflows/` file unless the milestone wants CI now (consistent with Phase 10's "no `.github/` workflow added (held)").
   - **RESOLVED:** CI wiring = `npm` scripts convention, no `.github/workflows/` file added this phase (consistent with Phase 10's held CI) — implemented via Plan 15-01's `package.json` scripts.

4. **Does the two-root validator / `$GRUGOPS_HOME` resolution change in the port? (Claude's discretion)**
   - What we know: the validator's `VALIDATE_KIT_ROOT` (no-default, C3 footgun guard) and the installer's `GRUGOPS_HOME` resolution are behavior-load-bearing and well-tested.
   - What's unclear: whether the TS port should refactor any of this resolution logic.
   - Recommendation: **port behavior 1:1, refactor nothing in the resolution logic.** The C3 no-false-green guard and the lexical-path-collapse parity fixes (CR-01..03 in STATE.md) are hard-won; preserve them exactly. Add types, change nothing semantic.
   - **RESOLVED:** the two-root validator / `$GRUGOPS_HOME` resolution is ported behavior-1:1, refactor nothing semantic — implemented in Plan 15-04.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything (runtime + build + tests + D-07 install prerequisite) | ✓ | v24.12.0 (Krypton, lts) — above D-03 Node 22+ floor | none (Node is now a hard prerequisite per D-07) |
| npm | Installing dev-deps + committing lockfile (D-04) | ✓ | (present; bundled with Node) | none for dev; hosts need NONE |
| `typescript` (`tsc`) | Build + freshness + typecheck (D-01) | ✗ (not yet installed) | will install `~6.0.3` | none — D-01 requires it (dev/CI only) |
| `vitest` | Migrated test harnesses (D-06) | ✗ (not yet installed) | will install `~4.1.8` | none — D-06 locks it (dev/CI only) |
| `git` | Freshness `git diff --exit-code` form (D-02) | ✓ (repo is a git repo) | — | `cmp`/rebuild-to-temp form needs no git |

**Missing dependencies with no fallback:** `typescript`, `vitest` — both install via `npm install --save-dev` in this phase; both are dev/CI-only and never required on a host (D-05). Not blockers — they are the phase's own deliverables.

**Missing dependencies with fallback:** none material.

## Validation Architecture

> nyquist_validation is enabled in `.planning/config.json` (`workflow.nyquist_validation: true`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `~4.1.8` (D-06) — replaces the POSIX `.test.sh` harnesses |
| Config file | `vitest.config.ts` (minimal: `defineConfig({ test: {} })`; defaults suffice — `environment:'node'`, `globals:false`, include `**/*.{test,spec}.ts…`) — arrives in Wave 0 |
| Quick run command | `npx vitest run <file>` (single suite) |
| Full suite command | `npx vitest run` (all suites, non-watch) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-01 | Each migrated script behaves at parity (guard deny/allow/self-set; installer idempotent/additive/DRY_RUN/reversible; validator pass/fail; generator byte-reproducible) | integration (spawn compiled `.js`) | `npx vitest run install scripts hooks` | ❌ Wave 0 (replaces `*.test.sh`) |
| TOOL-01 | Committed `.js` is fresh vs committed `.ts` (D-02) | freshness gate | `npm run freshness` (`tsc --outDir .tmp && cmp`) OR `tsc && git diff --exit-code` | ❌ Wave 0 |
| TOOL-01 | Source type-checks clean (the D-01 payoff) | typecheck | `tsc --noEmit` | ❌ Wave 0 |
| TOOL-01 | Cross-platform: tests + compiled `.js` run on Windows/macOS/Linux | integration (CI matrix) | `npx vitest run` on each OS | ❌ Wave 0 (no CI matrix today) |
| TOOL-02 | Kit-shipped reference routine returns D-12 exit codes (0/1/2) + clear-voice stdout | integration | `npx vitest run scripts/runnable-ref` | ❌ Wave 0 |
| TOOL-02 | Reference routine fails RED on a planted bad fixture | RED fixture | `node tools/grugops/<routine>.js <bad-fixture>; echo $?` (expect 1) | ❌ Wave 0 |
| TOOL-02 | `install.ts` materializes the routine into the committed host path (additive/idempotent) | integration | `npx vitest run install` (materialization case) | ❌ Wave 0 |
| D-10 | Guard fails CLOSED when `guard.js` is missing/unrunnable | RED/negative | `npx vitest run hooks` (missing-artifact case) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `tsc --noEmit && npx vitest run <touched suite>`
- **Per wave merge:** `npm run build && npm run freshness && npx vitest run` (full)
- **Phase gate:** full suite green + freshness green + typecheck clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `package.json` — `"type":"module"`, dev-deps, scripts (D-04)
- [ ] `tsconfig.json` — nodenext/es2022/strict, `newLine:"lf"`
- [ ] `vitest.config.ts` — minimal (defaults suffice)
- [ ] `.gitattributes` — pin committed `.js` to `eol=lf` (Pitfall 1)
- [ ] committed lockfile (`package-lock.json`) + `node_modules/` added to `.gitignore`
- [ ] `scripts/freshness.{ts,js}` (or an `npm run freshness` script) — the D-02 drift gate
- [ ] Vitest suites replacing every `*.test.sh`: `install.test.ts`, `guard.test.ts`, `validate.test.ts`, `check-foundation-guards.test.ts`, (the two-root install cases fold into `install.test.ts`)
- [ ] Reference kit-shipped runnable + RED fixture (TOOL-02 proof)
- [ ] Framework install: `npm install --save-dev typescript@~6.0 vitest@~4.1 @types/node@~24`

## Security Domain

> `security_enforcement: true` in `.planning/config.json`; `security_asvs_level: 1` (L1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface in tooling scripts |
| V3 Session Management | no | No sessions |
| V4 Access Control | yes (indirect) | The prod-deploy guard IS the access-control mechanism for the "deploy" action — D-10 fail-closed preserves it; the never-self-approve rule is the privilege boundary |
| V5 Input Validation | yes | Guard parses untrusted stdin JSON → fail-closed on malformed (already correct in `guard.mjs`); validator/generator parse JSON → try/catch + null/array/shape checks (the CR-03 fail-closed-on-`null` fix must port) |
| V6 Cryptography | no | No crypto; never hand-roll any |
| V14 Configuration | yes | `tsconfig`/`package.json`/lockfile are config surfaces; committed lockfile (D-04) is the supply-chain integrity anchor; dev-deps never reach hosts (D-05) |

### Known Threat Patterns for this stack (Node tooling + materialized routines)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent self-approves a prod deploy | Elevation of Privilege | Guard denies any inline set/export of the approval var (port `SELF_APPROVE` verbatim); approval only from a human-set process-env var (D-10) |
| Malformed hook stdin crash-allows a deploy | Denial of Service → bypass | Fail-closed stdin parse: unparseable → empty command → only non-deploys pass (preserve `guard.mjs` try/catch) |
| Stale/missing materialized `guard.js` lets a deploy through | Tampering / bypass | D-02 freshness check (no stale artifact) + D-10 hook defaults-to-block when the command can't run + installer/doctor checks Node present |
| Supply-chain: a malicious dev-dep | Tampering | Committed lockfile (D-04) as integrity record; `node_modules` never ships to hosts (D-05); only `{typescript, vitest, @types/node}` justified |
| Path traversal in a routine's write target | Tampering | Preserve the existing "fixed literal paths joined to repo root, never argv/env/content-derived" rule (validator/generator already do this — port it) |
| A kit-shipped routine pulls a host runtime dep | Tampering / bypass | `node:` builtins only; "host emulation" test runs the materialized `.js` with `node_modules` absent (Pitfall 3) |

All security/guard findings stdout MUST be clear professional voice (CLAUDE.md hard rule; the guard's deny reasons already are — preserve).

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view typescript|vitest|@types/node version time.created repository.url`) — verified versions 6.0.3 / 4.1.8 / 25.9.3, ages, official repos (run 2026-06-13)
- npm downloads API (api.npmjs.org) — weekly download counts (typescript ~217M, vitest ~68M)
- typescriptlang.org/docs/handbook/modules/reference.html — `module`/`moduleResolution: nodenext`, `target`, `package.json "type":"module"` → ESM emit
- nodejs.org/api/esm.html — `import.meta.dirname`/`filename`/`url` (added/stabilized versions), top-level await, reading files relative to module
- nodejs.org/api/child_process.html — `spawnSync` return shape (`status`/`stdout`/`stderr`), `input`/`env`/`encoding` options
- git-scm.com/docs/git-diff — `git diff --exit-code` for the freshness gate
- Local inspection of the actual migration targets: `hooks/guard.mjs`, `hooks/guard.test.sh`, `scripts/generate-asvs-checklist.mjs`, `scripts/validate-agent-factory.mjs`, `install/install.mjs`, `install/install.test.sh`, `scripts/check-foundation-guards.sh`, `scripts/check-kit-refs.sh`, `install/uninstall.sh` — grounds every parity claim
- `.planning/config.json` — nyquist_validation + security_enforcement settings

### Secondary (MEDIUM confidence)
- vitest.dev/guide + vitest.dev/config/include — Vitest 4 minimal config, default include glob `**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`, globals default, Node ≥20 requirement (cross-checked across two Vitest doc pages + a search summary)
- WebSearch (shebang/exec-bit on tsc output) — confirms tsc preserves shebangs but exec-bit/shebang-on-entrypoint need a build step; **low relevance here** since grugops invokes scripts as `node <script>`, not as direct executables

### Tertiary (LOW confidence)
- (none material — all load-bearing claims verified against primary sources or the actual codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry; deps are canonical first-party tools
- Build posture (tsconfig + freshness): HIGH — config verified against official TS/Node docs; freshness pattern already proven in-repo (ASVS generator)
- ESM specifics: HIGH — `import.meta.dirname` stabilization confirmed against nodejs.org for the exact Node floor
- Vitest harness migration: MEDIUM — child-process + temp-dir + assertion patterns verified against stdlib + Vitest guide, but the full migrated suites are unwritten; some config defaults cross-checked via search rather than a single canonical page
- Kit-shipped-runnable convention: MEDIUM — D-11/D-12 are locked; the materialization path + reference-routine design is grugops-specific synthesis grounded in the existing exit-code-guard idiom and the two-root model
- Pitfalls: HIGH for freshness/line-endings + fail-closed (directly observed in-repo + cross-platform-known); MEDIUM for nodenext import-extension (depends on whether scripts split into modules)

**Research date:** 2026-06-13
**Valid until:** ~2026-07-13 (30 days — toolchain is stable; TypeScript 6.0 and Vitest 4 are current majors; re-verify versions if planning slips a month)
