---
phase: 20-shared-context-substrate-concurrency-foundation
plan: 03
subsystem: infra
tags: [shared-context, freshness-gate, drift-gate, fail-closed, mirror-spawn, typescript, committed-js, markdown-wins]

# Dependency graph
requires:
  - phase: 20-shared-context-substrate-concurrency-foundation
    plan: "01"
    provides: scripts/context-io.js with the `render <task> [contextRoot]` CLI that emits the byte-reproducible index.md + index.jsonl this gate mirror-spawns
  - phase: 18-browsable-docs-catalog
    provides: scripts/catalog-freshness.ts — the mirror-spawn + Buffer.equals fail-closed drift-gate shape cloned here
  - phase: 15-typescript-tooling-migration
    provides: the D-13 TS→committed-.js→freshness build model + node:fs-only zero-host-dep tooling layer
provides:
  - SCTX-03 freshness:context drift gate — proves the committed per-task index.{md,jsonl} regenerates byte-identically from notes/ via the context-io.js render
  - fail-closed verdict (non-zero regen / unreadable committed file / byte mismatch → exit 1, never "fresh") satisfying SC-4
  - the freshness:context npm script (mirrors freshness:catalog shape) — a stale committed index fails the build red on its own
  - the SC-4 oracle: fresh PASS / planted-drift STALE / fail-closed-on-broken-regen against a hermetic CHECK_ROOT fixture
affects: [phase-21 verify-before-write admission, phase-24 role rewiring + render-on-done, phase-26 equivalence oracle]

# Tech tracking
tech-stack:
  added: []  # zero new dependencies (host or dev) — node:child_process/node:fs/node:os/node:path stdlib only
  patterns:
    - "mirror-spawn regen into a realpathSync-resolved mkdtempSync temp tree, then Buffer.equals byte-diff committed vs fresh (fail-closed)"
    - "per-task enumeration: readdirSync the context root, cpSync each task's notes/ into the mirror, spawn `render <task> <mirroredContextRoot>`"
    - "CHECK_ROOT env override so the oracle drives a hermetic fixture context tree without touching the committed .grugops/context/"
    - "greenfield vacuous success: no .grugops/context/ yet (install seeding is Phase 24) → exit 0, honestly stated, never a false fail"

key-files:
  created:
    - scripts/context-freshness.ts
    - scripts/context-freshness.js
    - scripts/context-freshness.test.ts
  modified:
    - package.json

key-decisions:
  - "realpathSync the temp mirror root: macOS tmpdir() lives under the /var→/private/var symlink, which defeats context-io.js's isMain CLI guard (argv[1] symlinked vs import.meta.url realpath-resolved) → the mirrored render silently no-opped at exit 0. Resolving the symlink keeps the two paths equal so the render actually runs."
  - "Per-task loop over the context root (not a single fixed OUT like the catalog gate) — the context substrate is keyed by <task>, so the gate enumerates every per-task dir and proves each index pair independently."
  - "A task dir with no notes/ is skipped (nothing committed-derived to prove against an absent source); the broken-regen fail-closed case is exercised by an invalid task NAME, a genuine render failure."

patterns-established:
  - "Pattern: standalone drift gate wired as its own freshness:* npm script, NOT folded into check-foundation-guards.ts (consistent with catalog-freshness / D-07)"
  - "Pattern: the gate never edits notes/ (markdown wins) — it only proves the derived index matches a fresh regen; the STALE message points the fix at re-rendering"

requirements-completed: [SCTX-03]

# Metrics
duration: 9min
completed: 2026-06-17
---

# Phase 20 Plan 03: freshness:context Drift Gate Summary

**The SCTX-03 `freshness:context` drift gate — `scripts/context-freshness.ts`, a structural clone of `catalog-freshness.ts` retargeted to the `context-io.js` render: for every per-task `.grugops/context/<task>/` it mirror-spawns the render into a realpath-resolved temp tree and `Buffer.equals` byte-compares the committed `index.{md,jsonl}` against the fresh regen, failing closed on any drift, unreadable file, or broken regen (never "fresh") — plus the three-case SC-4 oracle and the `freshness:context` npm script. Markdown notes/ are the source of truth; the gate never edits them.**

## Performance

- **Duration:** ~9 min
- **Completed:** 2026-06-17
- **Tasks:** 2
- **Files modified:** 3 created (`.ts`, committed `.js`, `.test.ts`) + 1 modified (`package.json`)

## Accomplishments

- Implemented `scripts/context-freshness.ts` by cloning `catalog-freshness.ts`'s shape (`import.meta.dirname` ROOT, `mkdtempSync` temp mirror, `cpSync` the render `.js` + source, `spawnSync` the mirrored render, fail-closed on non-zero status, `readFileSync` committed vs rebuilt, `Buffer.equals`, `STALE:`/`FAILED:` clear-voice findings, cleanup, `process.exit`), retargeted from the single-OUT catalog generator to a per-task loop over the `context-io.js` `render <task> <contextRoot>` CLI.
- Wired the `freshness:context` npm script mirroring the `freshness:catalog` line exactly (`tsc --outDir .tmp-build && node scripts/context-freshness.js`).
- Honored the locked fail-closed contract: a non-zero regen, an unreadable committed derived file, or any byte mismatch prints a clear-voice finding and exits 1 — never reporting "fresh" on a broken regen. Markdown (`notes/`) wins; the gate never edits `notes/`.
- Added the `CHECK_ROOT` override so the oracle points the gate at a hermetic fixture context root, and a greenfield vacuous-success path (no `.grugops/context/` yet — install seeding is Phase 24) that exits 0 and says so honestly.
- Wrote `scripts/context-freshness.test.ts` cloning `catalog-freshness.test.ts` and spawning the COMPILED `.js`: Test 1 fresh PASS, Test 2 planted-drift STALE (append a byte to the committed `index.jsonl`, plant-and-restore), Test 3 fail-closed on a broken regen — all against a `mkdtempSync` fixture that is a true render of its notes, never touching the committed tree. 3/3 green.
- Committed the compiled `scripts/context-freshness.js`; the `freshness.ts` build-output gate (now 16 committed `.js`) stays green.

## Task Commits

1. **Task 1: context-freshness.ts gate + freshness:context script** - `d8574a6` (feat)
2. **Task 2: context-freshness.test.ts oracle (+ realpathSync bug fix)** - `c472d57` (test)

**Plan metadata:** committed with this SUMMARY + STATE + ROADMAP (docs).

## Files Created/Modified

- `scripts/context-freshness.ts` - The `freshness:context` drift gate: per-task mirror-spawn regen of `index.{md,jsonl}` from `notes/` via `context-io.js render` → `Buffer.equals` byte-diff committed vs fresh → fail-closed; `CHECK_ROOT` override; greenfield vacuous pass.
- `scripts/context-freshness.js` - Committed compiled output of the above (freshness-gated by `freshness.ts`).
- `scripts/context-freshness.test.ts` - Spawn-compiled-`.js` SC-4 oracle: fresh PASS / planted-drift STALE / fail-closed-on-broken-regen against a hermetic `CHECK_ROOT` fixture.
- `package.json` - Added the `freshness:context` script (mirrors `freshness:catalog` shape exactly).

## Decisions Made

- **`realpathSync` the temp mirror root (the load-bearing fix):** macOS `tmpdir()` resolves to `/var/folders/...`, where `/var` is a symlink to `/private/var`. The `context-io.js` render (from 20-01) guards its CLI behind `isMain` = `import.meta.url === pathToFileURL(process.argv[1]).href`. With the symlinked mirror path, the spawned render's `argv[1]` (symlinked) did not match its `import.meta.url` (realpath-resolved), so the CLI block silently no-opped and the render exited 0 without writing — defeating the byte-compare. Resolving the temp dir with `realpathSync` keeps the two paths equal so the mirrored render actually runs. The 20-01 `context-io.ts` was left untouched (the fix belongs in the consumer gate).
- **Per-task loop, not a single fixed OUT:** the catalog gate has one OUT (`docs/catalog/README.md`); the context substrate is keyed by `<task>`, so the gate `readdirSync`-enumerates every per-task dir under the context root and proves each `index.{md,jsonl}` pair independently, mirror-spawning the render once per task.
- **Broken-regen exercised via an invalid task NAME, not a malformed note:** `context-io.js render` skips unparseable notes (it does not throw on a missing frontmatter fence), so a malformed note would NOT make the regen fail. An invalid task dir name (a space) trips the render's `assertSafeTask` allowlist → genuine non-zero exit → the gate's fail-closed branch — the honest way to prove "a broken regen never reads as fresh."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Gate's mirror-spawn silently no-opped on macOS due to a tmpdir symlink**
- **Found during:** Task 2 (the oracle's Test 1 failed with ENOENT on the rebuilt `index.md` — the mirrored render had produced nothing).
- **Issue:** `tmpdir()` on macOS is under the `/var → /private/var` symlink; the 20-01 render's `isMain` CLI guard compares `import.meta.url` (realpath) against `pathToFileURL(process.argv[1])` (symlinked), so the spawned render skipped its `render` branch entirely and exited 0 without writing — the gate would then fail to find the rebuilt files. (Not surfaced in the catalog gate because `generate-catalog.ts` has no `isMain` guard — it runs top-level.)
- **Fix:** `realpathSync` the `mkdtempSync` temp mirror root in `context-freshness.ts` so the spawned render's `argv[1]` and `import.meta.url` resolve to the same path and the CLI runs.
- **Files modified:** `scripts/context-freshness.ts` (+ recompiled `scripts/context-freshness.js`)
- **Commit:** `c472d57`

The Task 2 oracle did its job: it caught a fail-closed-defeating bug in the Task 1 gate (the gate would have read as a false fail on a real drift, or worse, an ENOENT crash) before it could ship. The fix was bundled with the oracle commit since the two are inseparable (the oracle is what proves the fixed gate works).

## Threat surface

The plan's `<threat_model>` mitigations are all implemented and proven by the oracle:
- **T-20-08 (Repudiation/Tampering — the gate verdict):** fail-closed — a non-zero regen, an unreadable committed file, or a byte mismatch exits 1 and never reports "fresh." Test 2 proves a planted drift trips `STALE:`; Test 3 proves a broken regen fails closed without the success marker.
- **T-20-09 (Tampering — the mirror-spawn temp path):** the regen runs into a `mkdtempSync` throwaway mirror; the production OUT is never overridden; the gate never edits `notes/` (markdown wins). The STALE message points the fix at re-rendering, never at editing the source.
- **T-20-SC (Tampering — package installs):** N/A — zero new packages (node stdlib only; no install task).

No NEW threat surface beyond the plan's `<threat_model>` was introduced (filesystem tooling; no network, auth, or external-input surface).

## Known Stubs

None. The gate, the npm script, and the oracle are fully implemented and green. The greenfield vacuous-success path is an honest, documented behavior (there is genuinely nothing committed to drift until install seeding lands in Phase 24), not a stub.

## Next Phase Readiness

- SC-4 is made TRUE and proven: the committed per-task JSONL+md regenerates byte-identically from the markdown notes/, editing the committed index without regenerating trips `freshness:context` (fail-closed), and the markdown wins (the gate never edits notes/). SCTX-03 delivered.
- Ready for the rest of Phase 20 (plan 20-04) and the downstream phases (21 verify-before-write admission, 24 role rewiring + render-on-done) that will populate `.grugops/context/` — at which point the gate's per-task loop exercises against real committed trees rather than the vacuous-pass path.
- No blockers. The `realpathSync` interaction with the 20-01 `isMain` guard is documented for any future mirror-spawn gate that drives the `context-io.js` CLI from a temp dir.

## Self-Check: PASSED

Files (all FOUND): `scripts/context-freshness.ts`, `scripts/context-freshness.js`, `scripts/context-freshness.test.ts`, `package.json` (modified — contains `freshness:context`).
Commits (all FOUND): `d8574a6` (feat), `c472d57` (test).
Gates: `npm run build` exit 0; `npm run freshness:context` exit 0 (vacuous pass on clean tree); `npm run freshness` exit 0 (16 committed `.js` fresh); `npx vitest run scripts/context-freshness.test.ts` 3/3 green.

---
*Phase: 20-shared-context-substrate-concurrency-foundation*
*Completed: 2026-06-17*
