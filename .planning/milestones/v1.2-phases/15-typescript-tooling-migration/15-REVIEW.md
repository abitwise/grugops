---
phase: 15-typescript-tooling-migration
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - hooks/guard.ts
  - hooks/guard.test.ts
  - install/install.ts
  - install/uninstall.ts
  - install/install.test.ts
  - scripts/freshness.ts
  - scripts/freshness.test.ts
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
  - scripts/generate-asvs-checklist.ts
  - scripts/generate-asvs-checklist.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-kit-refs.ts
  - scripts/runnable-ref/reference-check.ts
  - scripts/runnable-ref/reference-check.test.ts
  - vitest.config.ts
  - tsconfig.json
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This phase ports the grugops POSIX `.sh` / Node `.mjs` tooling to TypeScript, committing both the `.ts` source and the emitted `.js` artifact, with a per-file Vitest oracle proving parity against each former shell harness.

The two SAFETY-CRITICAL surfaces are sound. **`hooks/guard.ts` is a byte-faithful translation of the base `guard.mjs`** (confirmed by diffing against `14130d6:hooks/guard.mjs`): the same `APPROVAL` var name, the same `DEPLOY` pattern set, the same `SELF_APPROVE` regex, the same self-approve-before-deploy ordering, the same fail-closed stdin parse (`catch → cmd=""`), and the same exit-0-+-JSON-deny block mechanism. No deny path was weakened, inverted, or made to fail open. **`install.ts` / `uninstall.ts` preserve the additive / idempotent / never-overwrite / never-delete contract**: every write path is sentinel-guarded or skip-if-exists, `isProtected()` is a 1:1 port of the `is_protected` denylist (`agent-factory`/`plans`/`.planning`/`.grugops`/`docs`/`src` + repo root), the deploy-approval var is never set, and the install/uninstall round-trip test proves the frozen core, seeded state, and shared kit all survive. No Critical findings.

The findings below are robustness, parity-fidelity, and test-coverage concerns. The most material are: a build-gate dependency (`freshness.ts` shells out to `npx tsc`, which is the one place the otherwise-zero-dependency `.js` artifacts depend on a resolvable toolchain), a TOCTOU/cleanup gap in `copyKit`'s atomic-rename dance, an uninstall AGENTS.md symlink edge that can still remove a user link, and one ported tool (`check-kit-refs.ts`) shipping with **no parity oracle** in this phase.

## Warnings

### WR-01: `copyKit` leaves an orphaned `.old` / `.tmp` dir under `$GRUGOPS_HOME` if a rename fails mid-sequence

**File:** `install/install.ts:558-575`
**Issue:** The "true atomicity" sequence is `cpSync(src→tmp)` → `renameSync(KIT_ROOT→old)` → `renameSync(tmp→KIT_ROOT)` → `rmSync(old)`. If the **second** `renameSync(tmp, KIT_ROOT)` throws (e.g. cross-device rename when `$GRUGOPS_HOME` straddles a mount, a permission race, or a Windows lock on an open file under the kit), the process aborts with the old kit already moved aside to `agent-factory.old.<pid>` and `KIT_ROOT` now absent — the exact window the comment claims cannot exist. The `rmSync(old)` cleanup never runs, so a partially-installed home is left with no kit at `KIT_ROOT` and an orphaned `.old.<pid>` sibling. There is no try/finally to restore `old → KIT_ROOT` on failure. This is the same risk the original `.mjs` carried, but it is worth flagging because the in-code comment asserts a stronger guarantee than the code delivers.
**Fix:** Wrap the two renames in a try/catch that, on failure, attempts to move `old` back to `KIT_ROOT` and remove `tmp`, then rethrow:
```ts
if (existsSync(KIT_ROOT)) renameSync(KIT_ROOT, old);
try {
  renameSync(tmp, KIT_ROOT);
} catch (e) {
  // restore the prior kit so KIT_ROOT is never left absent
  if (existsSync(old) && !existsSync(KIT_ROOT)) renameSync(old, KIT_ROOT);
  rmSync(tmp, { recursive: true, force: true });
  throw e;
}
rmSync(old, { recursive: true, force: true });
```

### WR-02: `freshness.ts` build gate depends on a resolvable `npx tsc`; a missing/offline toolchain is indistinguishable from a real build failure

**File:** `scripts/freshness.ts:72-86`
**Issue:** The drift gate shells out with `spawnSync("npx", ["tsc", "--outDir", tmp], ...)`. If `npx`/`tsc` cannot be resolved (no `node_modules`, offline `npx` cache miss, PATH lacking npx), `spawnSync` returns `status: null` (or a non-zero npm error), and the gate treats that identically to "the sources do not compile" → prints "rebuild did not compile cleanly" and exits 1. Fail-closed is correct for *safety*, but the diagnostic is misleading: a CI box with a stale npm cache will report phantom "stale build outputs" / "did not compile" with no hint that the real cause is a toolchain-resolution failure. It also silently assumes `npx` over the locally-installed `node_modules/.bin/tsc`, adding a network/cache dependency the rest of the kit's `.js` artifacts explicitly avoid. Additionally, `spawnSync` can return `status: null` with `build.error` set (ENOENT) — that case is not inspected, so `build.status !== 0` is the only signal and the `error` object is dropped.
**Fix:** Prefer the locally-resolved compiler and surface a spawn error distinctly:
```ts
const tscBin = join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const build = spawnSync(existsSync(tscBin) ? tscBin : "npx",
  existsSync(tscBin) ? ["--outDir", tmp] : ["tsc", "--outDir", tmp],
  { cwd: ROOT, encoding: "utf8" });
if (build.error) { console.log(`Freshness check could not run tsc: ${build.error.message}`); cleanup(); process.exit(1); }
```

### WR-03: uninstall AGENTS.md symlink branch can delete a user symlink that *happens to point at the grugops source path*

**File:** `install/uninstall.ts:440-462`
**Issue:** The symlink branch removes AGENTS.md when `realpathSync(agents)` resolves to a file byte-identical to `$GRUGOPS_SRC/AGENTS.md`. The byte-compare is the only ownership signal. If a user authored their own `AGENTS.md -> ../shared/AGENTS.md` symlink whose target is *coincidentally byte-identical* to the grugops source AGENTS.md (plausible: the user copied the kit's AGENTS.md into their own shared location and symlinked it), uninstall deletes the user's symlink. The shell original had the same `cmp -s` behavior, so this is not a regression — but the "never delete user content" contract is byte-equality-scoped, not provenance-scoped, and that gap is worth recording. The copy branch (line 463) has the identical limitation.
**Fix:** This is inherent to content-based ownership detection; if tightening is desired, additionally require the symlink target to resolve *inside* `$GRUGOPS_SRC` or `$GRUGOPS_HOME` before removal:
```ts
const resolved = realpathSync(agents);
const inKit = resolved.startsWith(realpathSync(GRUGOPS_SRC) + sep);
resolvesToSource = inKit && sameFileBytes(resolved, srcAgents);
```
At minimum, document the byte-equality scope in the contract header so the limitation is not silent.

### WR-04: `check-kit-refs.ts` ships in this phase with no parity oracle (`.test.ts`)

**File:** `scripts/check-kit-refs.ts` (whole file)
**Issue:** Every other ported tool in this phase has a paired `*.test.ts` that spawns the committed `.js` and asserts both PASS and FAIL (the no-fabrication "a gate must be able to fail" contract). `check-kit-refs.ts` has neither a `check-kit-refs.test.ts` nor an inherited `check-kit-refs.test.sh` in scope. The port introduces non-trivial new logic — a hand-rolled recursive `walk()`, three chained `.filter()` exclusions replacing `grep -Ev` pipes (lines 171-175), and a `grepFilesWithMatch` set-dedup — none of which is exercised by a behavioral test. A silently-weakened assertion here (e.g. an over-broad exclusion filter that lets a real misclassified ref slip Assertion 2) would not be caught. This is precisely the "fewer cases than the oracle is the Pitfall-2 warning sign" risk the other suites guard against, applied at the file level.
**Fix:** Add `scripts/check-kit-refs.test.ts` that (a) asserts GREEN over the real tree, and (b) plants one violation per assertion into a `CHECK_ROOT` mirror (a stray `agent-factory/config/` ref; a non-template `agent-factory/handoffs/foo-ticket.md` ref; a `$GRUGOPS_HOME` mention in a `GH_SCAN` file; a removed MARKER) and asserts nonzero + the naming finding — mirroring `check-foundation-guards.test.ts`.

### WR-05: `generate-asvs-checklist.ts` dereferences `raw!` / `requirements!` after a `fail()` that TypeScript cannot see terminates the program

**File:** `scripts/generate-asvs-checklist.ts:59-91`
**Issue:** `fail` is typed `(m: string): never` and calls `process.exit(1)`, so at runtime control never returns. But the code then relies on non-null assertions (`raw!` line 73, `requirements!` lines 87/89/99/110/178) to convince the compiler the values are defined. This works only because `fail()` is `never`-typed; if a future edit changes `fail` to merely log (dropping the `process.exit`) or someone refactors it to return, the non-null assertions would mask a real `undefined`/`null` deref and the generator could write a partial checklist — defeating the fail-closed contract on a security surface. The assertions silence the compiler rather than the control flow guaranteeing safety.
**Fix:** Narrow with real control flow instead of `!`. Assign into a definitely-typed const after each guard, or restructure so the happy path reads a non-optional binding:
```ts
const raw = (() => { try { return readFileSync(SRC, "utf8"); } catch { fail(`cannot read ...`); } })();
// raw is now `string` because fail is `never`; but prefer an explicit local:
const reqs: AsvsRequirement[] = requirements; // after the Array.isArray guard, no `!`
```
Functionally correct today; the `!`-after-`never` coupling is a latent trap.

### WR-06: `validate-agent-factory.ts` config enum checks coerce with `as string`, so a non-string PRESENT dial value passes the enum silently

**File:** `scripts/validate-agent-factory.ts:352-394`
**Issue:** The optional-enum checks test `!ENUMS.bdd.includes(cfgObj.bdd as string)` (and the same shape for `quality.*` / `security.*`). If a user sets a PRESENT key to a non-string (`"bdd": true`, `"asvs_level": 2`), the `includes(x as string)` compares a boolean/number against the string enum, which is `false` → not included → it correctly errors for most, BUT the *cast hides* that the value is the wrong *type* rather than out-of-enum, and the error message interpolates `"${cfgObj.bdd}"` yielding a confusing `invalid "bdd" value "true"`. More importantly, the `lint` shape-check (lines 368-381) is the only one that type-guards before use; the enum keys do not, so the "active-when-present" contract treats `asvs_level: 2` and `asvs_level: "L4"` identically (both error), which is acceptable, but `quality.tdd: ["required"]` (an array) would stringify oddly. This is a fidelity/robustness gap, not a security hole — the safety-floor key `production_requires_human_confirmation` (lines 404-411) is checked with a strict `!== true` and is correct.
**Fix:** Guard the value type before the enum membership test so the finding distinguishes wrong-type from out-of-enum:
```ts
if ("bdd" in cfgObj && (typeof cfgObj.bdd !== "string" || !ENUMS.bdd.includes(cfgObj.bdd))) {
  err(`${rel}: invalid "bdd" value ${JSON.stringify(cfgObj.bdd)} (allowed: ${ENUMS.bdd.join("|")})`);
}
```

## Info

### IN-01: `freshness.test.ts` Test 2 mutates the committed `freshness.js` it is currently executing; restore is best-effort

**File:** `scripts/freshness.test.ts:44-54`
**Issue:** Test 2 appends drift bytes to `FRESHNESS_JS` (the committed artifact), spawns it, then restores in `afterEach`. The spawned child reads its own source fresh, so the test logic is sound. But if the test process is killed between the `writeFileSync` mutation and the `afterEach` restore (CI timeout, SIGINT), the repo is left with a drifted committed `freshness.js`. The restore is not in a `try/finally` around the mutation itself (it relies on `afterEach`), so a throw inside the `it` before assertions still restores, but a hard kill does not.
**Fix:** Acceptable for a test, but consider writing the drift into a *copied* `freshness.js` in a temp mirror (as the ASVS and foundation-guard suites do) rather than mutating the real committed artifact in place.

### IN-02: `vitest.config.ts` relies on the implicit `globals: false` default that multiple test headers assert as "the repo default"

**File:** `vitest.config.ts:1-3`
**Issue:** The config is `defineConfig({ test: {} })`. Every test file comment claims "Vitest globals:false (the repo default) → import test fns explicitly." That is correct (Vitest defaults `globals` to false), and the files do import `{ describe, it, expect }`. But the invariant the comments depend on is implicit, not pinned. If someone later flips `globals: true` for convenience, the assertion in every header silently becomes false and nothing breaks loudly.
**Fix:** Make the contract explicit and self-documenting: `defineConfig({ test: { globals: false } })`.

### IN-03: `install.ts` `readlineSync` treats a `readSync` error as clean EOF, conflating I/O failure with end-of-input

**File:** `install/install.ts:113-128`
**Issue:** `readlineSync` swallows any `readSync(0, ...)` throw with `catch { break; }`, returning whatever bytes were read so far. A transient stdin read error during the interactive target prompt would be interpreted as "user pressed enter," silently accepting the default target. This path is only reachable on an interactive TTY without `--yes`, so impact is low, and the original `.mjs` behaved the same. Recording for completeness.
**Fix:** Distinguish EAGAIN (retry) from EOF; or, since the default is CWD, the silent-accept is arguably safe — document it.

### IN-04: `generate-asvs-checklist.ts` numeric chapter sort assumes every `chapter_id` is `V<number>`

**File:** `scripts/generate-asvs-checklist.ts:105-107`
**Issue:** Chapters sort by `Number(a[0].slice(1)) - Number(b[0].slice(1))`. If the vendored source ever introduced a chapter id not of the form `V<n>` (e.g. `VA`), `Number("A")` is `NaN` and the sort comparator returns `NaN`, producing an implementation-defined ordering and therefore non-deterministic output — which the byte-reproducibility gate would then flag as drift. The `EXPECTED_ROWS === 345` assert and pinned SHA make this currently impossible, so it is latent only.
**Fix:** Guard the parse, or assert each `chapter_id` matches `/^V\d+$/` before sorting, failing closed if not.

### IN-05: `install.ts` imports `readSync` and `dirname` that are only used on narrow paths — confirm tree-shake-free intent

**File:** `install/install.ts:38-54`
**Issue:** Minor: the import block pulls a large stdlib surface (`readSync`, `renameSync`, `lstatSync`, etc.). All are used, so this is not dead code, but the breadth makes it easy for a future edit to leave an unused import. No action required; noted only because a reviewer should confirm `readSync` (line 119) and `renameSync` (lines 571-572) remain wired — they are.
**Fix:** None required; an `eslint no-unused-vars` / `tsc noUnusedLocals` pass would mechanically enforce this going forward (`tsconfig.json` does not currently set `noUnusedLocals`).

---

_Reviewed: 2026-06-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
