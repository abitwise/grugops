---
phase: 18-browsable-docs-catalog
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - scripts/generate-catalog.ts
  - scripts/generate-catalog.test.ts
  - scripts/catalog-freshness.ts
  - scripts/catalog-freshness.test.ts
  - package.json
  - .gitattributes
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
blockers_resolved: true
resolution_commit: 7bb2e00
---

# Phase 18: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the browsable-docs-catalog tooling: the generator (`generate-catalog.ts`), the
drift gate (`catalog-freshness.ts`), their two Vitest oracles, and the `package.json` /
`.gitattributes` wiring. The generator's core design is sound — fixed-literal paths
(no traversal surface), fail-closed structural validation, deterministic
`lines.join("\n")` emit, correct `firstSentence` and no-fabrication (`UNKNOWN - verify`)
handling. I verified all five generator contracts against the real kit (17 roles, 16
workflows) and the no-fabrication cadence path on workflows 12/13.

However, the **test suite is not safe to run under its own default configuration**. Two
test files mutate shared real-tree state (`agent-factory/roles/` and
`docs/catalog/README.md`) while the other file reads the same state in parallel. Vitest
runs test files in parallel by default and there is **no serialization config**, so
`npm test` (the CI gate) fails non-deterministically. I reproduced 2–3 failures across
runs of `npx vitest run`; the same set passes with `--no-file-parallelism`. This is a
test-integrity BLOCKER: the gate that proves the catalog correct is itself flaky.

Separately, `catalog-freshness.ts` has an unhandled-exception / temp-leak path when the
committed catalog is absent — it crashes with a raw Node stack trace (violating the
clear-voice-on-safety-surface rule) and leaks its temp mirror because `cleanup()` is
never reached. I reproduced both the stack trace and the orphaned temp dir.

## Critical Issues

### CR-01: Parallel test files race on shared real-tree state — `npm test` is flaky and fails in CI

**File:** `scripts/catalog-freshness.test.ts:67-68` and `scripts/generate-catalog.test.ts:102-157,201-217`
**Issue:**
Vitest runs test *files* in parallel by default, and `vitest.config.ts` is empty
(`{ test: {} }`) — no `fileParallelism: false`, no `sequence`/`pool` serialization. The
two catalog test files both operate on the **same shared real tree**, so they collide:

- `catalog-freshness.test.ts` Test 3 (line 67-68) **writes a non-conforming role file
  into the real kit**: `agent-factory/roles/zzz-catalog-freshness-badrole.md`. While that
  file exists, any parallel run of `generate-catalog.test.ts` reads the real
  `agent-factory/roles/`, the generator hits the H1-less role, fails closed (exit 1), and
  the generator-test assertions `expect(r.status).toBe(0)` fail.
- Symmetrically, `catalog-freshness.test.ts` Test 2 plants drift into the **real**
  `docs/catalog/README.md` and runs the freshness gate, which regenerates from the real
  kit. If Test 3's bad role is present during that window, the gate fails *closed* (regen
  error) instead of reporting *drift*, so Test 2's `expect(r.stdout).toContain("STALE:")`
  fails.

Reproduced: `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts`
fails (1 file: 1 failed test; together: 2–3 failed across the two files). The full suite
`npx vitest run` (i.e. `npm test`, the CI gate) reports `Tests 3 failed | 133 passed`.
The identical selection passes with `--no-file-parallelism`. The race is timing-dependent
so the exact failing test set varies run-to-run — the hallmark of a true flake.

The `finally`/`afterEach` guards do restore the tree *after* the run completes (I verified
the tree is clean post-run), so this is not state leakage between runs — it is a genuine
in-run concurrency hazard that breaks the build gate.

**Fix:** Serialize the two files (cheapest, lowest-risk), e.g. set in `vitest.config.ts`:
```ts
export default defineConfig({ test: { fileParallelism: false } });
```
Or, preferably, make Test 3 hermetic like `generate-catalog.test.ts` Test 4 already is —
mirror the kit into a temp dir, plant the bad role there, and `spawnSync` the mirrored
generator/gate — so it never touches the real `agent-factory/roles/`. A test that mutates
the shared source tree under a parallel runner is the root defect; isolating it is the
durable fix.

### CR-02: `catalog-freshness.ts` throws an unhandled exception and leaks its temp dir when the committed catalog is missing

**File:** `scripts/catalog-freshness.ts:92-95`
**Issue:**
After a clean regeneration, the gate reads the committed catalog and the rebuilt one,
then calls `cleanup()`:
```ts
const committed = readFileSync(join(ROOT, "docs/catalog/README.md")); // line 92
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));     // line 93
cleanup();                                                             // line 95
```
If `docs/catalog/README.md` does not exist (deleted, fresh clone before first generate,
or path typo), the `readFileSync` at line 92 throws `ENOENT` **before** `cleanup()` runs.
Two consequences, both reproduced:

1. The process dies with a raw Node stack trace on stderr — not a CLEAR PROFESSIONAL
   finding. This is a build-safety surface where CLAUDE.md mandates clear voice; a
   stack trace is the opposite of a usable finding, and the gate's whole point is
   fail-closed *with a legible reason*.
2. The temp mirror (`/var/folders/.../grugops-catalog-fresh-XXXX`) is **leaked** —
   `cleanup()` is unreachable on the throw path. I confirmed an orphaned temp dir
   remained after the throw.

This is the one exit path that escapes the otherwise-careful "cleanup before every
`process.exit`" discipline. Note the freshness analog `scripts/freshness.ts` reads
committed files inside a guarded loop that tolerates a missing counterpart; this gate has
no equivalent guard.

**Fix:** Guard the committed read and route the missing-file case through the same
fail-closed message + cleanup the rest of the file uses:
```ts
import { existsSync } from "node:fs";
const committedPath = join(ROOT, "docs/catalog/README.md");
if (!existsSync(committedPath)) {
  console.log(
    "Catalog freshness check FAILED: docs/catalog/README.md is missing — run `npm run generate:catalog` and commit the result.",
  );
  cleanup();
  process.exit(1);
}
const committed = readFileSync(committedPath);
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));
```
More robustly, wrap the regen+compare body in `try { ... } finally { cleanup(); }` so no
future exception can leak the temp dir.

## Warnings

### WR-01: `generate-catalog.ts` swallows directory/file read errors, discarding the real cause

**File:** `scripts/generate-catalog.ts:99-101,107-111,134-137,143-147`
**Issue:**
Every `try/catch` around `readdirSync`/`readFileSync` uses a bare `catch {}` that drops
the caught error and substitutes a generic message, e.g.:
```ts
} catch {
  fail(`cannot read roles directory: ${ROLES_DIR}`);
}
```
A permission error, a symlink loop, or an encoding fault all collapse to the same
opaque "cannot read" line. On a build-safety surface that prizes legible findings, the
underlying `err.message`/`err.code` is exactly the diagnostic an operator needs.

**Fix:** Capture and surface the cause:
```ts
} catch (err) {
  fail(`cannot read roles directory: ${ROLES_DIR} (${(err as Error).message})`);
}
```

### WR-02: `firstSentence` silently truncates multi-sentence summaries with no signal

**File:** `scripts/generate-catalog.ts:65-69`
**Issue:**
`firstSentence` returns only text up to the first `". "`. For sections whose meaning lives
across two clauses this drops information with no marker. Concretely, workflow 07's `When
to use` begins *"Run this regularly to keep the `Ready` column stocked, or right before
planning. This ceremony applies to **both** cadences..."* — the catalog shows only the
first clause. That is the documented design (one-sentence summary), so it is not a bug,
but it is a silent, lossy transform: an author who later writes a role whose first
sentence is a throat-clearing preamble ("In short.") would get a catalog row that conveys
nothing, and nothing in the generator or tests would flag it.

**Fix (optional / robustness):** Either document the one-sentence contract in the kit's
authoring guidance so summaries are written first-sentence-complete, or add a length floor
(e.g. fail closed if a summary is under N chars) so a degenerate first sentence cannot ship
silently. At minimum, keep this constraint visible to role/workflow authors.

### WR-03: Frontmatter parser silently ignores keys that are not `[A-Za-z_]+`

**File:** `scripts/generate-catalog.ts:55`
**Issue:**
`line.match(/^([A-Za-z_]+):\s*(.*)$/)` only recognizes keys composed of letters and
underscores. A future frontmatter key with a digit or hyphen (e.g. `order-2:`,
`v2tier:`) is silently skipped, not flagged. Today no kit frontmatter uses such keys (I
verified), so this is latent, not active — but because the generator is the *only* reader
that turns frontmatter into the catalog, a typo'd or hyphenated required key would
manifest as a missing/empty cell (or a fail-closed `tier`/`order` miss) with no pointer to
the real cause.

**Fix:** Broaden the key class to match the kit's actual conventions and/or warn on
frontmatter lines that are non-blank, non-comment, and fail to parse as `key: value`:
```ts
const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
```

## Info

### IN-01: `toPosix` is a no-op at its only call site

**File:** `scripts/catalog-freshness.ts:91,99`
**Issue:**
`toPosix` (line 91) is only ever applied to the literal `"docs/catalog/README.md"` (line
99), which already contains forward slashes and no platform `sep` to translate. The helper
is dead defensiveness — harmless, but it implies a cross-platform normalization that isn't
actually exercised. (The analog `freshness.ts` applies `toPosix` to real `path.join`
results, where it matters.)

**Fix:** Either drop `toPosix` here and inline the literal, or add a brief comment that it
is kept only for parity with `freshness.ts`. Not load-bearing either way.

### IN-02: Generator docstring lags the de-facto cross-platform message convention

**File:** `scripts/generate-catalog.ts:30-32`
**Issue:**
The header comment says fail-closed findings go "to stderr" (correct for `fail()`), but
the success/wrote line and the gate's findings go to stdout, and the gate forwards the
generator's stderr. The split-stream contract (`fail()` → stderr, status → stdout) is
correct in code but under-documented; a maintainer extending the gate's output parsing
could miss that the generator's structural findings arrive on **stderr**, while the gate's
own verdict is on **stdout** (Test 3 in `catalog-freshness.test.ts` depends on exactly
this split — it asserts the *success-only* marker is absent from `r.stdout`).

**Fix:** One line in the header noting the stream split (findings→stderr, verdict→stdout)
to keep future output-parsing changes from breaking the gate's tests.

---

## Resolution (orchestrator, commit `7bb2e00`)

Both BLOCKERs were independently reproduced/confirmed against the code and then fixed
during phase execution, before phase verification:

- **CR-01 — FIXED.** `vitest.config.ts` now sets `test.fileParallelism: false`, serializing
  test-file execution so the shared-real-tree gate oracles no longer race. Verified: 3
  consecutive `npx vitest run` passes (10 files, 136 passed / 1 skipped) with zero flakes;
  the reviewer-confirmed `--no-file-parallelism` behavior is now the committed default.
- **CR-02 — FIXED.** `scripts/catalog-freshness.ts` guards the committed-catalog read in a
  `try/catch` that calls `cleanup()` and prints a clear-voice fail-closed finding (then
  `exit 1`) instead of throwing a raw `ENOENT` and leaking the temp mirror. The committed
  `catalog-freshness.js` was recompiled (`npm run build`); `npm run freshness` and
  `npm run freshness:catalog` both pass.

The 3 WARNINGs + 2 INFO are retained as **advisory** (non-blocking), with these dispositions:

- **WR-02 — by design, not a defect.** The one-sentence summary is the deliberate D-01
  contract (`firstSentence` splits on `". "` and keeps the first sentence). Left as-is;
  the reviewer's note about authoring guidance is captured here for future kit authors.
- **WR-01, WR-03, IN-01, IN-02 — accepted as advisory.** Minor robustness/clarity nits
  (error-cause surfacing, frontmatter key class, a parity-only `toPosix`, a docstring
  stream-split note). No behavioral defect; not in scope for this phase. Available for a
  future polish pass via `/gsd-code-review 18 --fix`.

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
