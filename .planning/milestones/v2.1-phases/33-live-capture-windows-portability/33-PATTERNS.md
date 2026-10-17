# Phase 33: Live Capture & Windows Portability - Pattern Map

**Mapped:** 2026-09-19
**Files analyzed:** 31 (6 new, 25 modified)
**Analogs found:** 29 / 31

> Every analog path below was checked with `git ls-files -- <path>` and is TRACKED source. No
> gitignored install/runtime mirror is cited.
>
> **Repo law that governs every new file here** (CLAUDE.md + RESEARCH § Project Constraints):
> every tooling script is `.ts` compiled by `tsc` to a **committed `.js`** in the same commit
> (`npm run build && node scripts/check-build-parity.js`); Node stdlib only, zero runtime deps;
> arg-array spawns, never a shell on the data path; clear professional voice on safety surfaces;
> `grep -a` for any census; **never `npm test`** (it is bare `vitest run` and collects the live
> lane) — use `npx vitest run --exclude '**/scripts/e2e/**'`.

---

## File Classification

### Stream A — CAP-01 / CAP-03 (capture instrument + flip)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/capture-live.ts` (NEW) + committed `.js` | CLI runner / orchestration script | process-orchestration + streaming (JSONL) + file-I/O | `scripts/coordinator-resolution-precheck.ts` | exact (skeleton) |
| ” — the `claude -p` child | — | streaming | `scripts/e2e/uat-live.test.ts` `claudePrint()` (L~205) | exact (spawn shape), **needs one change** (stream to file, SIGINT) |
| ” — pure predicates (D-02/D-04/D-05) | pure module / transform | batch over frames | `scripts/dual-path-equivalence.ts` | exact |
| ” — exit contract / entry guard | CLI script | request-response | `scripts/check-diff-disposition.ts` tail (`verdict()`, `runAll()`, `isEntrypoint`) | exact |
| `scripts/capture-live.test.ts` (NEW) | test (offline, token-free) | batch over committed fixtures | `scripts/prod-deploy-deny-match.test.ts` | exact |
| `scripts/e2e/fixtures/capture-sample.jsonl` (NEW) | fixture corpus | file-I/O (data) | `scripts/runnable-ref/fixtures/*.uat.spec.ts` | role-match |
| `scripts/e2e/fixtures/<runnable-project>/` (NEW, D-03) | fixture project | file-I/O (data) | `scripts/e2e/uat-live.test.ts` scaffold block + `install/install.ts --target` | role-match |
| flip-check module, e.g. `scripts/check-flip-manifest.ts` (NEW) + `.js` + `.test.ts` | checker / gate | batch + git-diff transform | `scripts/check-diff-disposition.ts` | exact |
| ” — derived-set + cardinality assertion | checker | batch | `scripts/check-banned-claims.ts` (`bannedClaimScan`, `BANNED_CLAIM_SCAN_COUNT` refusal) | exact |
| `scripts/e2e/uat-live.test.ts` (REWRITE → thin wrapper) | test (gated e2e) | request-response | itself (keystone kept verbatim) | exact |
| `scripts/prod-deploy-deny-match.ts` (header amendment only) | safety module (doc edit) | — | itself L11-22 | exact |
| `33-CAPTURE-SUMMARY.md`, `33-CAPTURE.jsonl`, `33-FLIP-MANIFEST.md` (NEW) | phase artifacts | file-I/O | `32.1-10-SUMMARY.md`, `32.1-10-LIVE-TRANSCRIPT.txt`, `32.1-15-DIAGNOSIS.md` | exact |
| The 12 GAP-D1 flip surfaces (`examples/03-ticket-to-pr.md`, `docs/dogfood-human-runbook.md`, archived `06-HUMAN-UAT.md` / `06-VERIFICATION.md` / `19-VERIFICATION.md` / `20-HUMAN-UAT.md`, `.planning/REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `27-SPAWN-03-RUNTIME-EVIDENCE.md`, `docs/audit/28-disposition-register.md`) | documentation / ledger | batch edit | RESEARCH § "Flip Manifest Surfaces" measured cell counts | n/a (data, not code) |
| `.planning/WINDOWS.md` rows 1, 183, 211–214 | ledger (3 representations) | — | **no code analog — use `gsd-tools windows fixed <id>`** | tool-mediated |

### Stream B — CAP-02 (both CI legs green)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `vitest.config.ts` | config | — | itself (one commented block per option) | exact |
| `scripts/check-banned-claims.ts` (`walkFiles`, L981-1020) | checker (publishing boundary) | batch | `scripts/catalog-freshness.ts:116` `toPosix` | exact |
| `scripts/board-dashboard.ts` (`deriveWatchDirs` / `WATCH_DIRS`, L807-866) | service (publisher) | event-driven | `scripts/context-io.ts:4515` (`GOVERNANCE_CONFIG_RELPATHS`) | exact |
| `scripts/board-read.ts` (`relative(root, target)` L599, refusal messages) | model/reader (publisher) | CRUD | `scripts/context-io.ts:4515` | exact |
| `scripts/board-model.ts`, `scripts/context-io.ts`, `scripts/check-kit-refs.ts` (published spellings) | publishers | CRUD / batch | `scripts/context-freshness.ts:89,171` | exact |
| `scripts/validate.test.ts` (`SCANNED` census, L1820-1823) | test-internal comparison | batch | `scripts/js-import-closure.ts:685` `relPosix` | exact |
| `scripts/check-uat-oracles.test.ts`, `scripts/board-tracer.test.ts`, `scripts/board-dashboard.test.ts` (literals) | test-internal | batch | same as above | exact |
| `scripts/runnable-ref/uat-spec-integrity.test.ts:8940` (`.temp` ENOENT) | test premise | file-I/O | `scripts/runnable-ref/uat-spec-integrity.ts:2085-2091` (readdir in a try → refusal) | exact |
| `scripts/frontmatter.test.ts:7853-7866` (`/usr/bin/ruby`) | test probe | process | `scripts/context-io.test.ts:2905-2907` (`YAML_ORACLE_RUBY ?? "ruby"` + probe) | exact |
| `scripts/board-read.test.ts` (3 `chmod 000` PREMISE failures) | test skip | file-I/O | `scripts/kit-model.test.ts:1610-1624` | exact |
| symlink fixtures (D-16) + `scripts/check-platform-shapes.ts` | checker (skip remainder) | batch | `scripts/check-platform-shapes.ts` SHAPES[3] symlink entry + `skips.push` L762-767 | exact (already exists — join it) |
| `scripts/uat-gate-exit-contract.test.ts:685` (`"SKIPPED SHAPES (0):"`) | test literal | batch | `scripts/check-platform-shapes.ts:1174-1182` (the printer) | exact |
| the four `mkfifo` callers: `hooks/admission-guard.test.ts`, `hooks/guard.test.ts`, `scripts/nonblocking-reader-parity.test.ts`, `scripts/context-io.test.ts` | test fixtures | file-I/O | `scripts/check-platform-shapes.ts` FIFO `make()` (returns `false` → skip, never throws) | exact |
| `hooks/guard.test.ts` (13 × `manifest-path-not-a-regular-file`) | test fixture placement | file-I/O | `scripts/check-platform-shapes.ts` positions (fixtures outside the kit home) | role-match |
| `scripts/freshness.test.ts:380` (temp-clone `tsc` exit 1) | test (integration) | process | `scripts/catalog-freshness.ts` temp-mirror rebuild + `cleanup()` | role-match (**A4 unproven**) |
| `install/install.test.ts` (8.3 short name, `'2.1.0\r'`, `KIT="C:/…"`) | test | process | `install/install.ts:141` `toPosix` (the emitting side is already correct) | exact |
| `scripts/check-nul-bytes.test.ts`, `scripts/board-read.test.ts` (control-byte fixture names) | test fixtures | file-I/O | **no analog** — no in-repo idiom for "this platform refuses this filename" | none |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` (`RangeError`, TS2440/TS2448) | test | batch | **no analog** — MAX_PATH/recursion, not reproduced offline | none |
| `.github/workflows/ci.yml` | config | — | itself — **no new steps** (CONTEXT § Integration Points) | n/a |

---

## Pattern Assignments

### `scripts/capture-live.ts` (NEW — CLI runner, process-orchestration + streaming)

**Analog:** `scripts/coordinator-resolution-precheck.ts` (623 lines — read it whole before writing).
It is the *only* script in the tree that already does "scratch temp target + real installer + probe
the `claude` binary + zero tokens + remove everything on every exit path", which is exactly
`--dry-run` (D-10). CONTEXT says **invoke it, do not re-implement it**.

**Header pattern** (`coordinator-resolution-precheck.ts:1-57`) — copy the *shape*: usage lines at
the top, a WHY-THIS-EXISTS block, then numbered HARD RULES, then an EXIT CONTRACT paragraph, then
the stdlib-only / clear-voice declaration. Verbatim excerpt of the three rules to mirror (D-10's
zero-token rule is rule 1 almost word for word):

```ts
// THREE HARD RULES. Each one is the thing a future author's "obvious improvement" would break, so
// each is written here rather than left to judgement:
//
//   1. NO MODEL SESSION, NO TOKENS. This script performs filesystem and version observations ONLY.
//      It starts exactly two child processes: the platform's `--version` flag, and this repository's
//      own installer. It must never invoke the platform in a way that starts a session …
//
//   2. THE SUCCESS WORDING MUST NOT READ AS A PASS. …
//
//   3. EVERY WRITE LANDS IN A SCRATCH DIRECTORY THIS SCRIPT CREATED. The scratch install gets its
//      own temporary target AND its own temporary kit home, both passed explicitly, so the real
//      ~/.grugops and the real user configuration are never touched …
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).
```

**Imports pattern** (`coordinator-resolution-precheck.ts:58-62`) — stdlib first, then committed
`.js` twins:

```ts
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listAgentAdapters } from "./kit-model.js";
```

For this file add `import { prodDeployDenyFired } from "./prod-deploy-deny-match.js";`,
`import { projectTaskState, assertEquivalent } from "./dual-path-equivalence.js";`,
`import { isEntrypoint } from "./is-entry.js";`.

**Fixed-literals block** (`coordinator-resolution-precheck.ts:84-95`) — copy verbatim in shape:

```ts
// ---------------------------------------------------------------------------
// Fixed literals. None is ever taken from argv, env or file content (ASVS V12).
// ---------------------------------------------------------------------------

const SCRIPT_ROOT = join(import.meta.dirname, "..");
const INSTALLER = join(SCRIPT_ROOT, "install", "install.js");
const TMP_PREFIX = "grugops-coordinator-precheck-";   // → "grugops-capture-live-"
```

**Arg parsing** (`coordinator-resolution-precheck.ts:188-211`) — hand-rolled loop, unknown flag is
a `fail()`, `--flag <v>` and `--flag=<v>` both accepted. Copy verbatim, swapping the flag names for
`--dry-run`, `--keep-target`, `--out <dir>`:

```ts
function parseArgs(argv: string[]): Options {
  const opts: Options = { keep: false, inspectTarget: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--keep-scratch-target") opts.keep = true;
    else if (a === "--inspect-target") opts.inspectTarget = argv[++i] ?? "";
    else if (a.startsWith("--inspect-target=")) {
      opts.inspectTarget = a.slice("--inspect-target=".length);
    } else {
      fail(`unrecognized argument \`${a}\` — this command takes --keep-scratch-target and --inspect-target <dir> only`);
    }
  }
  …
}
```

**CLI flag probe / version observation** (`coordinator-resolution-precheck.ts:230-262`) — the
D-10 flag probe is this function with `--help` added. Note the three-state discipline (**UNKNOWN -
verify is not a failure**) and the 15 s bound:

```ts
function observePlatformVersion(): string {
  const r = spawnSync(PLATFORM_CMD, ["--version"], { encoding: "utf8", timeout: 15_000 });
  if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string") {
    return `platform version: UNKNOWN - verify — \`${PLATFORM_CMD} --version\` could not be read on this machine (the tool may not be on the PATH). Pending verification; …`;
  }
  …
}
```

**Installer spawn + two-signal refusal** (`coordinator-resolution-precheck.ts:277-315`) — this is
D-03's install step. Copy the **two-signal** check (exit code AND banner) verbatim in spirit:

```ts
const r = spawnSync("node", [INSTALLER, "--target", target, "--yes"], {
  encoding: "utf8",
  timeout: 120_000,
  env: { ...process.env, GRUGOPS_HOME: home },
});
const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
if (r.status !== 0) {
  fail(`the scratch install did not complete (exit ${String(r.status)}${r.status === 3 ? " = INCOMPLETE" : ""}). Installer output follows:\n${detail}`);
}
if (detail.includes("install INCOMPLETE")) {
  fail(`the scratch install printed the INCOMPLETE banner while exiting ${String(r.status)} — the banner and the exit status disagree …`);
}
```

**Scratch cleanup** (`coordinator-resolution-precheck.ts:180-183`) — removal on every exit path,
suppressed only by the keep flag:

```ts
  if (keep) return;
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
  scratch.length = 0;
```

**The `claude -p` child** — analog `scripts/e2e/uat-live.test.ts:203-222` (`claudePrint`). Copy the
env/stdin/arg-array discipline verbatim; **change two things** per RESEARCH Pitfall 6:

```ts
function claudePrint(args: string[], cwd: string): { status: number | null; out: string } {
  const r = spawnSync("claude", args, {
    cwd,
    encoding: "utf8",
    // process.env is passed through UNCHANGED — the harness explicitly never injects the approval
    // var. (No `[APPROVAL]: …` key appears anywhere in this file by design.)
    env: { ...process.env },
    input: "",                    // close stdin so an interactive prompt can NEVER hang the harness
    timeout: CALL_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}
```

- **Change 1:** `spawn` (not `spawnSync`) with stdout piped to a `createWriteStream`, so a killed
  run still leaves the partial JSONL on disk. `spawnSync`'s buffer is discarded on a timeout kill.
- **Change 2:** the timer sends **SIGINT** first (ends the turn, keeps the `result` frame), SIGTERM
  only as the escalation; exit 143 maps to the `hang` outcome word, never `fail`.

**Frame reader / decode-before-match / D-02 predicate** — RESEARCH § Patterns 1-3 already give the
code; the *contract* to copy is `dual-path-equivalence.ts`'s: a pure exported function, no I/O
beyond a read, a non-vacuity keystone, and diffs returned as `string[]` (empty === equal) rather
than a boolean:

```ts
export function assertEquivalent(a: ProjectedNote[], b: ProjectedNote[]): string[] {
  const diffs: string[] = [];
  if (a.length !== b.length) {
    diffs.push(`note-count differs: path A has ${a.length}, path B has ${b.length}`);
  }
  …
  return diffs;
}
```

D-02's predicate should return the same shape (a `string[]` of named reasons), so "a capture
satisfying only one side is a red **with a named reason**" falls out of the return type.

**Exit contract + entry guard** — analog `scripts/check-diff-disposition.ts` (tail, verbatim):

```ts
function verdict(): void {
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) { process.stdout.write("ALL CHECKS PASSED\n"); process.exit(0); }
  process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
  process.exit(1);
}

function runAll(): void {
  try { main(); } catch (e) {
    // A gate that dies is not a gate that failed. …
    fail(`${(e as Error).message}\n        No verdict is reported over the diff, because the diff could not be derived`);
    verdict();
  }
}

// Entry check: true only when this module was launched directly (not imported). … a hand-built
// `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-diff-disposition.js` run ZERO checks and exit 0, a fabricated green.
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) { runAll(); }
```

`isEntrypoint` lives at `scripts/is-entry.ts:40`. **Use it** — `capture-live.test.ts` must import
the predicates without running the capture.

---

### `scripts/capture-live.test.ts` (NEW — offline test, batch over fixtures)

**Analog:** `scripts/prod-deploy-deny-match.test.ts` (223 lines). Same job: prove a safety-bearing
predicate non-vacuous in BOTH directions, entirely offline.

**Header pattern** (`prod-deploy-deny-match.test.ts:1-9`) — state the lane and the repo law:

```ts
// prod-deploy-deny-match.test.ts — the OFFLINE, token-free non-vacuity RED test for the SAFE-02 /
// T-26-A2 prod-deploy-deny matcher. Runs under the excluded regression suite
// (`npx vitest run --exclude '**/scripts/e2e/**'`) — no `claude` CLI, no token spend; every fixture is
// a synthesized string, so the matcher is proven STRUCTURALLY regardless of live envelope reachability.
//
// Repo law (MEMORY: "green suite insufficient"): a green suite is NEVER proof for a safety assertion.
```

**Imports** (`:26-35`) — vitest explicit (`globals: false`), committed `.js` twin, `ROOT` from
`import.meta.dirname`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { prodDeployDenyFired, PROD_DEPLOY_DENY_KEY, PROD_DEPLOY_DENY_VALUE } from "./prod-deploy-deny-match.js";

const ROOT = join(import.meta.dirname, "..");
```

**Required RED case** (RESEARCH Pitfall 1): the same fixture line must score `false` raw and `true`
after `JSON.parse(line).stdout`. Without that pair, the decode is untested and the A2 red of
2026-09-18 recurs.

**Required cardinality case** (RESEARCH Pattern 3): the 16 granted role names in
`.claude/agents/grugops-orchestrator.md:5` cross-derived against the 17 files in `.claude/agents/`
(16 + the orchestrator itself) — see the count-assertion idiom under the flip-check below.

---

### flip-check module (NEW — checker, git-diff transform)

**Analog:** `scripts/check-diff-disposition.ts` (2138 lines). It is the same inverted design D-17
needs: *derive what CHANGED from git, require each change to be dispositioned*, rather than
enumerate a protected set. Read its header (L1-70) before writing; the argument is already made:

```ts
// The obvious design is a file of protected sentences. It is refused outright (D-01). A
// hand-authored set is this repository's diagnosed systemic failure class — the scan set that rots
// while every gate over it stays green …
//
// So the frozen set is DERIVED from three gates that already exist, and the enforcement is INVERTED
// (D-05): rather than enumerate what is protected, this gate enumerates what CHANGED and requires
// each change to be dispositioned. One side is derived from the filesystem, the other from git.
// Neither can go stale, because neither is written down.
```

**Usage/exit block** (`check-diff-disposition.ts:3-10`) — copy the three-line exit contract form:

```ts
//   node scripts/check-diff-disposition.js
//     exit 0 — every clause this phase changed in the watched corpus is either dispositioned, or the
//              tree carries no change to that corpus at all.
//     exit 1 — at least one changed clause is undispositioned, or intersects the frozen set without
//              its same-commit companion edit, or the gate could not derive one of its inputs.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs, node:path, node:child_process for `git`. Zero npm
// dependencies. Clear professional voice throughout (CLAUDE.md hard rule — this is a trace surface).
```

**Git invocation** (`check-diff-disposition.ts:237-252`) — copy verbatim, including the
`encoding: "buffer"` + `.toString("utf8")` (NUL-byte hazard) and the "no verdict is reported"
failure text:

```ts
function git(args: readonly string[]): string {
  try {
    return execFileSync("git", [...args], { cwd: ROOT, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
  } catch (e) {
    throw new Error(
      `\`git ${args.join(" ")}\` failed at ${ROOT} — ${(e as Error).message}. The diff cannot be ` +
        `derived, so NO verdict is reported over it. …`,
    );
  }
}
```

**Derive-the-set / assert-the-count** — analog `scripts/check-banned-claims.ts`. This is the
answer to RESEARCH Pitfall 7 (116 `pending human` lines / 43 files repo-wide, so an unbounded
denominator). Three parts to copy:

1. Parts array (`check-banned-claims.ts:1279-1297`):

```ts
export const BANNED_CLAIM_SCAN_PARTS: readonly { name: …; members: readonly string[] }[] = [
  { name: "kit", members: kitMarkdown() },
  { name: "publicDocs", members: publicDocsMembers() },
  …
];
```

2. Per-part vacuity floor **before** the aggregate pin (`:2312-2325`):

```ts
for (const part of BANNED_CLAIM_SCAN_PARTS) {
  if (part.members.length === 0) {
    fail(`the "${part.name}" part of the banned-claim scan set derived ZERO members — refusing to ` +
      `report a verdict over a part that contributes nothing … This floor is per-part on purpose: any one part could empty out ` +
      `while the total still cleared a floor written over the concatenation`);
  }
}
```

3. The two-sided pin whose refusal text says moving it is not the remedy (`:2331-2341`):

```ts
if (scan.length !== BANNED_CLAIM_SCAN_COUNT) {
  fail(
    `the banned-claim scan set derived ${scan.length} document(s), expected exactly ` +
      `${BANNED_CLAIM_SCAN_COUNT} (${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
      `overlap ${overlap}) — walk every part's derivation … BEFORE updating BANNED_CLAIM_SCAN_COUNT … ` +
      `moving the pin is how you acknowledge that it did, not how you make the failure go away`,
  );
}
```

The flip-check's live-surface set gets exactly this treatment: parts (live docs / archived
milestone records / ledgers), a per-part floor, and a pinned cardinality with that refusal wording.
Its **exclusion rule** (`*-PLAN.md`, `*-SUMMARY.md`, `*-RESEARCH.md`, `*-REVIEW.md`,
`superseded-rounds/`) is written into `33-FLIP-MANIFEST.md`, not into the code's comments only.

**RED evidence block** — `check-diff-disposition.ts:31-66` records two reproductions on planted
repositories under the OS temp dir, as **permanent cases in its test file**, not as quoted
transcripts. The flip-check needs the same: a planted tree where a `pending human` cell survives
outside the manifest set, and one where a flipped cell carries no citation (D-18).

---

### `scripts/e2e/uat-live.test.ts` (REWRITE → thin wrapper)

**Analog:** itself. Three regions are **kept byte-for-byte** (D-08); everything below them becomes
a wrapper that runs `node scripts/capture-live.js` and asserts on the summary.

**Keep — the loud-skip keystone** (`:81-118`):

```ts
export const LOUD_SKIP_MARKER =
  "SKIPPED: claude CLI absent or unauthed — UAT A1/A2/A3 NOT exercised; status stays pending";

export function claudePresentAndAuthed(): boolean {
  try {
    const which = spawnSync("claude", ["--version"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (which.status !== 0 || which.error != null) return false;
    const auth = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (auth.status !== 0) return false; // exit 1 = not logged in
    return JSON.parse(auth.stdout)?.loggedIn === true;
  } catch {
    return false; // fail-closed → loud skip, never green
  }
}

export function emitLoudSkipIfUnavailable(probe: () => boolean = claudePresentAndAuthed): boolean {
  if (probe()) return true;
  console.warn(LOUD_SKIP_MARKER);
  process.stderr.write(`${LOUD_SKIP_MARKER}\n`);
  return false;
}
```

**Keep — the `-t "loud-skip"` test-of-the-test** (`:120-158`), both cases (forced-false emits the
exact marker; forced-true emits none).

**Keep — the derived per-test timeout** (`:178-190`), and re-point `CALL_TIMEOUT_MS` at D-12's
20-minute bound so the vitest bound and the script's bound still cannot desync:

```ts
const CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) || 300_000;

function liveTimeoutMs(nClaudeCalls: number, extraMs = 0): number {
  return nClaudeCalls * CALL_TIMEOUT_MS + extraMs;
}
```

**Keep — the cleanup discipline** (`afterAll`, `:225-250`): `plugin uninstall` + target removal,
best-effort in `try {} catch {}` so cleanup failure never masks a result.

**Fix in this rewrite (WINDOWS.md row 214):** the docblock claim that `npm test` excludes the lane
is **false** — `package.json` `scripts.test` is bare `vitest run`, and `vitest.config.ts`'s
`exclude` adds only `**/scripts/runnable-ref/fixtures/**` and `**/.temp/**`.

---

### `scripts/prod-deploy-deny-match.ts` (header amendment only — safety surface)

The existing header (`:11-22`) enumerates exactly two input classes and concludes the live lane is
"CONFIRMATION-ONLY (D-09), never sufficient evidence for the D-01/D-02 captured-live-run retirement
gate":

```ts
// This predicate is only as trustworthy as the bytes it is handed. It is SOUND at the POINT OF EFFECT:
// hand it the real stdout of an executed guard.js … It is NOT a safety proof over an AGENT-AUTHORED
// transcript (e.g. `claude -p` stdout in scripts/e2e/uat-live.test.ts) …
```

A CLI-emitted `hook_response.stdout` is a **third** class — point-of-effect, the class the header
calls sound. Add a row for it; **do not** touch the function. The fails-closed contract at `:38-40`
is the reason the decode is required and must stay verbatim:

```ts
// A real deny escaped inside a JSON string value (e.g. an `--output-format json` result field) is NOT
// matched — the matcher fails CLOSED (honest pending), which is strictly better than a vacuous TRUE.
```

---

### `vitest.config.ts` (D-14 — config)

**Analog:** itself. Every option in this file carries a measured justification comment; the two new
options must arrive the same way. Current state — `test` holds only `exclude` and
`fileParallelism`, so the inherited `testTimeout` is vitest's 5 000 ms default:

```ts
export default defineConfig({
  test: {
    // `**/.temp/**` is excluded for a MEASURED reason, not a tidiness one (plan 31-27, MOVEMENT 0).
    …
    exclude: [ ...configDefaults.exclude, "**/scripts/runnable-ref/fixtures/**", "**/.temp/**" ],
    // Several gate oracles … exercise the REAL working tree … serialize file execution so the shared-tree
    // gate tests stay isolated from one another.
    fileParallelism: false,
  },
});
```

Three keys land here: `testTimeout`, **`hookTimeout`** (the D-14 gap RESEARCH found — the
`check-foundation-guards.test.ts:3574` red is `Error: Hook timed out in 10000ms`, a `beforeAll`
that `testTimeout` does not govern), and `slowTestThreshold: 5000`. The comment must state the
bound as **a choice above a measured floor of 85 568 ms**, citing the run, not as an arithmetic
derivation (RESEARCH Pitfall 5). No `process.platform` branch (D-14).

---

### D-15 path normalization (publishing modules)

**Analog:** the `toPosix` one-liner, already present in **seven** tracked modules — it is the
repo's established idiom and needs no invention:

```ts
// scripts/catalog-freshness.ts:116  (identical at context-freshness.ts:89, freshness.ts:99,
// guarantees-freshness.ts:80, now-running-freshness.ts:62, trace-freshness.ts:63)
const toPosix = (p: string): string => p.split(sep).join("/");
```

Used at the emit point, not at the comparison point:

```ts
// scripts/context-freshness.ts:171
const relPath = toPosix(join(".grugops", "context", task, name));
```

And the derived-published-list form, already in `context-io.ts`:

```ts
// scripts/context-io.ts:4513-4516 — "The same candidates as REPO-RELATIVE POSIX paths, for a
// consumer that must NAME the files rather than read them"
export const GOVERNANCE_CONFIG_RELPATHS: readonly string[] = governanceConfigCandidates("").map(
  (p) => p.split(sep).join("/"),
);
```

**The measured boundaries to apply it at** (do not "normalize everything" — RESEARCH Pitfall 3):

| Module | Boundary | Why it is PUBLISHED |
|---|---|---|
| `scripts/check-banned-claims.ts` | `walkFiles` (L981-1020): `acc.push(rel)` and the recursive `walkFiles(join(rel, entry), …)` | `rel` becomes a **dedupe key** in `bannedClaimScan()`'s `Set` (L1309-1314) and in `bannedClaimScanOverlap()` (L1328-1338). A host-separated key from the `kit` walk never collides with the POSIX key `publicDocsCorpus()` supplies → the 118/119/121 instability and the two-sided exemption-region miss |
| `scripts/board-dashboard.ts` | `watchDirForSubpath` (L807-810) → `deriveWatchDirs` (L839-862) → `WATCH_DIRS` | `dirname()` is separator-aware; the `rel` field is published in the per-directory watch-failure record (L1001) |
| `scripts/board-read.ts` | `relative(root, target)` at L599 and the refusal messages built from it | refusal text is user-facing output |
| `scripts/board-model.ts`, `scripts/context-io.ts`, `scripts/check-kit-refs.ts` | wherever a `join`/`relative` result reaches a row, a key or a message | `.claude/agents/…` separator failures (4 in `check-kit-refs`) |

`FIXED_SUBPATHS` (`board-read.ts:480-488`) is **already** POSIX literals and must stay that way —
it is the layout authority; the corruption happens downstream of it:

```ts
export const FIXED_SUBPATHS = {
  board: "plans/board.md",
  tickets: "plans/tickets",
  queue: ".grugops/queue",
  context: ".grugops/context",
  traceability: "plans/traceability.md",
  config: "agent-factory/config/factory.config.json",
} as const satisfies Readonly<Record<SourceName, string>>;
```

**Test-internal (NOT D-15 — normalize the comparison, in the test):**

- `scripts/validate.test.ts:1820-1823` — `join(e.parentPath, e.name)` vs `git ls-files`'s always-`/`
  output; 26 files in `scripts/` subdirectories read as unscanned. Analog for the fix,
  `scripts/js-import-closure.ts:685`:
  ```ts
  const relPosix = (abs: string): string => relative(rootAbs, abs).split(sep).join("/");
  ```
- `scripts/board-watch.test.ts:343` — `armedRel: armed.map((d) => relative(realTree, d)).sort()`.
  This is the actual carrier of the 6 `.grugops\context` assertion failures; it is a test-side
  `relative()`, so it takes `relPosix` too. (CONTEXT named four production modules here; the
  measured carrier is this line. The production modules still take the D-15 fix for the reasons in
  the table above, but this line is what turns those 6 reds green.)
- `scripts/check-uat-oracles.test.ts` (`'scripts\compactor.test.ts'`), `scripts/board-tracer.test.ts`
  and `scripts/board-dashboard.test.ts` (`no/such/tree` literals).

Record the published/test-internal partition in the plan so a reviewer can check it.

---

### D-16 named skips that are counted (symlink, chmod, mkfifo, ruby)

**The chmod idiom — copy verbatim** (`scripts/kit-model.test.ts:1610-1624`):

```ts
    if (!restricted) {
      // SKIPPED WITH ITS REASON, never silently passed: chmod does not restrict for a privileged
      // user, and a case that cannot produce its own precondition must say so rather than assert
      // over a state it failed to create.
      chmodSync(dir, 0o755);
      expect(
        `SKIPPED: this host did not honour chmod 000 on ${dir} (privileged user?), so the ` +
          `permission-denied precondition could not be produced; the deterministic route is pinned ` +
          `by the file-where-a-directory-belongs case above`,
      ).toMatch(/^SKIPPED:/);
      return;
    }
```

Apply to the 3 `board-read.test.ts` PREMISE failures (`PREMISE: the mode-0 file was still readable`,
`PREMISE: chmod 000 did not deny the listing on this filesystem`).

**The ruby-probe idiom — port it, do not invent one.** `scripts/frontmatter.test.ts:7853-7866`
hard-codes `/usr/bin/ruby` in an `execFileSync` and ENOENTs on Windows. Its sibling already has the
correct form (`scripts/context-io.test.ts:2891-2907`):

```ts
  // THE INTERPRETER IS RESOLVED FROM `PATH`, NOT PINNED TO AN ABSOLUTE PATH (28-REVIEW WR-13).
  // … Two changes make the absence visible. The name resolves through `PATH` (overridable with
  // YAML_ORACLE_RUBY for an unusual image), and the loader oracle is its OWN case gated with
  // `it.skipIf`, so an image without Ruby reports a SKIP in the suite summary rather than a pass.
  const RUBY = process.env.YAML_ORACLE_RUBY ?? "ruby";
  const RUBY_PROBE = spawnSync(RUBY, ["-ryaml", "-e", "print Psych::VERSION"], { encoding: "utf8" });
  const HAS_RUBY = RUBY_PROBE.status === 0;
```

**The counted platform remainder** — `scripts/check-platform-shapes.ts` already models exactly
what D-16 asks for. A shape declares `portable`, a `reasonWhenAbsent`, and a `make()` that returns
`false` (never throws) when the platform refuses it (`:466-480`):

```ts
  {
    name: "symlink to a regular file (CONTROL — it resolves to one)",
    portable: false,
    expectsNotRegularFileRefusal: false,
    reasonWhenAbsent:
      "Windows requires Developer Mode or the SeCreateSymbolicLink privilege, so an unprivileged " +
      "runner cannot create one",
    make(at: string, ordinary: Buffer): boolean { … },
  },
```

A refused shape lands in the remainder (`:762-767`):

```ts
  skips.push({
    shape: shape.name,
    position,
    platform: process.platform,
    reason: shape.reasonWhenAbsent,
  });
```

…printed even when empty (`:1174-1182`), with a Windows-scoped refusal if it *is* empty
(`:1330-1338`):

```ts
  // THE SKIP LIST IS ALWAYS PRINTED, INCLUDING WHEN IT IS EMPTY. "(none)" and "never produced" are
  // different facts, and a reader who cannot tell them apart is reading a silent skip.
  process.stdout.write(`\nSKIPPED SHAPES (${String(skips.length)}):\n`);
  …
  if ((process.env[REQUIRE_SKIPS_ENV] ?? "") !== "" && skips.length === 0) {
    failures.push(`${REQUIRE_SKIPS_ENV} is set and the skip list is EMPTY. …`);
  }
```

Consequence for `scripts/uat-gate-exit-contract.test.ts:685`: it asserts the literal
`"SKIPPED SHAPES (0):"`. On Windows the correct remainder is **(2)** (FIFO + unix socket). Read the
count from the corpus (`SHAPES.filter(s => !s.portable)` on this platform) instead of pinning `0` —
the same "derive the set, assert the relationship" move `deriveWatchDirs` made
(`board-dashboard.ts:812-822`).

**The four `mkfifo` callers** (`hooks/admission-guard.test.ts`, `hooks/guard.test.ts`,
`scripts/nonblocking-reader-parity.test.ts`, `scripts/context-io.test.ts`) take the FIFO shape's
form (`check-platform-shapes.ts:446-465`): spawn `mkfifo`, and on non-zero status take the named-skip
branch rather than continuing into an assertion over a file that was never created.

---

### `.temp` absence (D-13 — both legs)

**The failing line is a test premise, not the scanner** —
`scripts/runnable-ref/uat-spec-integrity.test.ts:8939-8942`:

```ts
    // …and the BRACES: the real listing, on this repository, right now.
    expect(
      readdirSync(join(REPO_ROOT, ".temp"), { withFileTypes: true }).length,
      "`.temp` is not empty — a probe root was left behind",
    ).toBe(0);
```

On a fresh runner `.temp/` does not exist (gitignored at `.gitignore:19`, empty on this tree), so
`readdirSync` throws ENOENT before the assertion. **Absent and empty are the same fact for this
premise.** The analog for the tolerant form is the scanner's own boundary
(`scripts/runnable-ref/uat-spec-integrity.ts:2084-2091`):

```ts
    try {
      entries = readdirSync(absDir, { withFileTypes: true }) as unknown as readonly DirEntry[];
    } catch {
      refusals.push(`Cannot list the directory ${relDir === "" ? "." : relDir}; the spec set could not be derived, so no result is reported for it.`);
      continue;
    }
```

Do **not** `mkdir -p .temp` in CI (RESEARCH Pitfall 10): `.temp` is already a classified member —
`SKIPPED_DIRECTORIES` contains `".temp"` (`uat-spec-integrity.ts:80`) and
`SKIPPED_DIRECTORY_DISCLOSURE_CLASS[".temp"] === "could-hide-evidence"` (`:126`) — and creating it
in CI diverges CI from a fresh developer clone. The other half of the case (the walk skips `.temp`)
already passes and stays.

---

## Shared Patterns

### 1. Tooling script → committed `.js` (applies to every new `.ts` in this phase)

**Source:** `tsconfig.json` (`include: ["install/**/*.ts", "scripts/**/*.ts", "hooks/**/*.ts"]`,
`exclude` carries `**/*.test.ts`), `package.json` `scripts.build` / `check:build-parity`.

`scripts/capture-live.ts` and the flip-check `.ts` each emit a `.js` beside them that **must be
committed in the same commit**. `scripts/capture-live.test.ts` emits nothing (excluded) but IS
typechecked by `tsconfig.tests.json`, which inherits the include list and drops only the
`**/*.test.ts` exclude — so `noUnusedLocals` / `noUnusedParameters` reach it.

```
npm run build && node scripts/check-build-parity.js    # per task, whenever a .ts changed
npm run typecheck                                       # tsc --noEmit + tests + fixtures targets
npx vitest run --exclude '**/scripts/e2e/**'            # per wave; NEVER `npm test`
```

A new `scripts/*.ts` also enters `scripts/validate.test.ts`'s TS census automatically and must
clear the 14 foundation guards listed in RESEARCH § Project Constraints.
`BANNED_CLAIM_SCAN_COUNT = 120` is markdown-only (`MARKDOWN_EXT = ".md"`,
`check-banned-claims.ts:231`), so a new `.ts` does not move it.

### 2. Arg-array spawns, stdin closed, bounded, `process.env` passed through unchanged

**Source:** `scripts/e2e/uat-live.test.ts:203-222`; `scripts/coordinator-resolution-precheck.ts:234,287`.
**Apply to:** every child in `capture-live.ts` (installer, `claude`, `git`, `claude plugin *`).

Never a shell on the data path (ASVS V5). Never assign `GRUGOPS_PROD_DEPLOY_APPROVED` — the A2 deny
fires *because* it is absent; assert its absence in the child env and in the committed capture.

### 3. Derive the set, assert the count, floor each part

**Source:** `scripts/check-banned-claims.ts:1279-1297, 2312-2341`;
`scripts/board-dashboard.ts:812-822` (`deriveWatchDirs`);
`scripts/runnable-ref/uat-spec-integrity.ts:118-140` (two halves derived from one published set).
**Apply to:** the D-02 grant membership (16 names vs 17 adapter files), the flip manifest's
live-surface set (D-17), the platform-shape remainder count in `uat-gate-exit-contract.test.ts`.

This is the repo's recorded systemic failure class; a hand-typed list anywhere in this phase is a
defect regardless of whether the suite is green.

### 4. A skip is named, printed and counted — never silent

**Source:** `scripts/kit-model.test.ts:1614-1624`; `scripts/check-platform-shapes.ts:762-767,
1174-1182, 1330-1338`; `scripts/e2e/uat-live.test.ts:81-118`.
**Apply to:** symlink/chmod/mkfifo/ruby fixtures (D-16), and the live lane's loud skip (D-08).
A loud skip is never a capture.

### 5. Fail-closed, and say what was NOT measured

**Source:** `scripts/prod-deploy-deny-match.ts:38-40`; `scripts/coordinator-resolution-precheck.ts:29-35`
(rule 2: "THE SUCCESS WORDING MUST NOT READ AS A PASS"); `scripts/check-diff-disposition.ts` `runAll()`
("A gate that dies is not a gate that failed"); `scripts/catalog-freshness.ts:117-129` (unreadable
input → cleanup + exit 1, never fall through to "fresh").
**Apply to:** `capture-live.ts`'s every derivation, the redaction pass (an un-redactable artifact is
not committed), and the outcome line.

### 6. Temp-dir discipline: create it, own it, remove it on every path

**Source:** `scripts/coordinator-resolution-precheck.ts:94-95, 180-183`;
`scripts/e2e/uat-live.test.ts` `afterAll` (`:225-250`).
**Apply to:** both D-07 targets, the fixture copies, the plugin install cleanup, and the
marketplace state (capture before/after; prefer `--scope local`/`project`, never add a user-scope
row).

### 7. Frozen outcome-line grammar

**Source:** `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-10-SUMMARY.md:76`.
**Apply to:** `33-CAPTURE-SUMMARY.md` and any diagnosis file.

```
grep -cE '^(OUTCOME|Outcome): (pass|fail|hang|no-go)$' <transcript>   # must equal 1
```

Exit 143 (SIGTERM at the bound) maps to `hang`, never `fail`.

### 8. `grep -a` for every census; `git ls-files` for every tracked-set question

**Source:** project memory (BSD grep silently skips NUL-classified files; `grep -P` does not exist
on BSD and fails silent behind `|| true`); `scripts/check-diff-disposition.ts:241`
(`encoding: "buffer"` then `.toString("utf8")`).
**Apply to:** the flip-check's derivations and every count quoted in the manifest or summary.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/check-nul-bytes.test.ts` / `scripts/board-read.test.ts` control-byte fixture names (`repo^Ax`, `a<newline>`) | test fixtures | file-I/O | No in-repo idiom for "this platform refuses this filename". The `check-platform-shapes` skip model is the closest *concept* (a shape the platform cannot construct) but these are ad-hoc fixture names inside two test files, not corpus shapes. Planner decision: either route them through a `SHAPES`-style declared-and-skippable construction, or give each a named skip at the point of construction. Related open item: these tests' premises are the same class WINDOWS.md rows 222-224 defer. |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` `RangeError: Maximum call stack size exceeded` + TS2440/TS2448 mismatches (`GREEN 4: a directory tree as deep as this platform permits`) | test | batch | Windows `MAX_PATH`/recursion limit, not reproduced offline. The case's own name already says "as deep as this platform permits", so the fix is inside its own depth derivation; no other file in the tree derives a platform depth limit. RESEARCH marks this MEDIUM confidence. |
| `scripts/freshness.test.ts:380` temp-clone `tsc` exit 1 (8 failures) | test (integration) | process | `scripts/catalog-freshness.ts`'s temp-mirror rebuild is the nearest shape, but RESEARCH assumption **A4** (the failure is `tsc`-in-the-clone, not `git clone`) is explicitly unproven and the compiler's stderr was not in the log. Reproduce the clone-and-build path with a Windows-shaped path and read `tsc`'s stderr before choosing a boundary. Also check RESEARCH Open Question 5 first: these 8 may be `.temp`-absence downstream, in which case the `.temp` fix closes them. |
| `.planning/WINDOWS.md` row edits | ledger | — | Not a code analog: the file is frontmatter counters + a markdown table + a `json` appendix repeating every row. A hand edit desyncs three representations. Use `gsd-tools windows fixed <id>` / `windows waive <id> "<reason>"`. |

---

## Notes the planner must carry

1. **Row 186 is already measured and GREEN.** `scripts/board-watch-live.test.ts` passed on
   `windows-latest` (6 tests, 7 715 ms) on run `35394268365`. CAP-02's `fs.watch` sub-claim is
   dischargeable by citation plus one confirming green run — no watcher work, no new CI step (WR-07
   CI-topology half is explicitly not taken, D-16).
2. **CONTEXT's separator claim needs re-aiming.** The 6 `.grugops\context` assertion failures live
   in `scripts/board-watch.test.ts:343` (test-internal), not in the four production modules CONTEXT
   names. The production modules still take the D-15 fix (their published keys and messages are the
   banned-claims/kit-refs class), but the 6 reds are closed by the test-side `relPosix`.
3. **`expected 15 to be 1` is a finding count, not an exit code** — it belongs to the
   banned-claims scan-set class (8 occurrences inside `check-banned-claims.test.ts`). The genuine
   exit-code class is `expected null to be +0` (a signalled child), 6 lines.
4. **The A2 matcher input changes, the matcher does not.**
   `prodDeployDenyFired(JSON.parse(line).stdout)` — never the raw JSONL line.
5. **`hookTimeout` is a gap in D-14** that the plan must fill; `testTimeout` alone leaves
   `check-foundation-guards.test.ts:3574` red.
6. **HEAD is 7 commits ahead of `origin/main`.** D-05's "the sha under test is pushed" precondition
   is not met today; the `--dry-run` must assert it and a `git push` task precedes any go.
7. **No CLI flag pins a plugin sha.** Post-hoc `git -C <system/init.plugins[].path> rev-parse HEAD`
   is the recommended provenance route.

---

## Metadata

**Analog search scope:** `scripts/`, `scripts/e2e/`, `scripts/runnable-ref/`, `hooks/`, `install/`,
repo root (`vitest.config.ts`, `tsconfig*.json`, `package.json`, `.github/workflows/ci.yml`).
**Files scanned:** 29 tracked source files read or grepped; all analog paths verified with
`git ls-files`.
**Pattern extraction date:** 2026-09-19
