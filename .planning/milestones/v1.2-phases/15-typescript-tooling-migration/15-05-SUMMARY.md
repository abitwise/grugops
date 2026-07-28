---
phase: 15-typescript-tooling-migration
plan: 05
subsystem: tooling-kit-shipped-runnable
tags: [typescript, tool-02, d-11, d-12, kit-shipped-runnable, materialize, installer, vitest, exit-code-contract]

# Dependency graph
requires:
  - phase: 15-01
    provides: "tsc/tsconfig/vitest build posture, commit-both .ts/.js + freshness gate, .gitattributes LF pin"
  - phase: 15-03
    provides: "single install.ts/.js + install.test.ts with the reserved D-11 materializeRunnable() seam (between seedState() and writeMarker())"
provides:
  - "scripts/runnable-ref/reference-check.ts + .js — the TOOL-02 reference kit-shipped runnable; node: builtins only; the literal D-12 contract (exit 0 pass / 1 findings / 2 error; clear-voice stdout; optional --json {ok,findings})"
  - "scripts/runnable-ref/fixtures/{clean,bad}.txt — the clean (exit 0) + planted RED (exit 1) fixtures"
  - "scripts/runnable-ref/reference-check.test.ts — Vitest harness: clean->0, bad->1 (RED), missing->2, --json shape, Pitfall-3 host-emulation (bare temp dir, no node_modules)"
  - "install.ts materializeRunnable() at the reserved seam — copies the compiled runnable into the host's committed tools/grugops/ (additive/idempotent/never-overwrite); a RUNNABLES source->dest table Phase 16's checker appends to"
  - "install.test.ts D-11 cases — lands at tools/grugops/, idempotent re-run, never-overwrite a user-edited copy, bare-Node host run (no node_modules) exits 1 on the bad fixture"
affects: [16-gate-convergence, 15-06-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "kit-shipped-runnable convention (D-11): author .ts in the kit -> compile to committed .js -> installer materializes ONE small .js into the host's committed tools/grugops/ -> host runs `node tools/grugops/<routine>.js` with ONLY Node present"
    - "uniform D-12 invocation+result contract: exit 0/1/2 + clear-voice stdout + optional --json {ok,findings}; the gate branches on exit code, humans/trace read stdout"
    - "host-emulation test (Pitfall 3): copy the compiled .js into a mkdtemp dir with no node_modules and assert it still runs — proves node: builtins only"
    - "materializeRunnable mirrors seedFile (skip-if-source-missing, skip-if-identical, never `>`-truncate, DRY_RUN report-only) — additive/idempotent/never-overwrite at a committed namespaced path"

key-files:
  created:
    - "scripts/runnable-ref/reference-check.ts"
    - "scripts/runnable-ref/reference-check.js"
    - "scripts/runnable-ref/reference-check.test.ts"
    - "scripts/runnable-ref/fixtures/clean.txt"
    - "scripts/runnable-ref/fixtures/bad.txt"
  modified:
    - "install/install.ts"
    - "install/install.js"
    - "install/install.test.ts"

key-decisions:
  - "Materialization path CONFIRMED = tools/grugops/ (RESEARCH Open Q2 / D-11 Claude's discretion, RESOLVED): committed, namespaced, not gitignore-adjacent like .grugops/ state, not colliding with a project's build bin/ — runnable from a bare host checkout (Pitfall 5)"
  - "Phase 16's cross-platform test-integrity checker materializes via THIS exact materializeRunnable mechanism — it appends a row to the RUNNABLES source->dest table; the reference routine is merely the FIRST materialized runnable"
  - "TOOL-02 marked complete: routine + installer materialization + Node-only run test all green; TOOL-01 left In Progress (spans 15-06 .mjs/.sh deletion) and was NOT touched"

patterns-established:
  - "D-12 exit-code-as-signal contract proven end-to-end on a real (trivial) routine before Phase 16 depends on it"
  - "RUNNABLES table in install.ts as the single extension point for future kit-shipped runnables (Phase 16 appends, no new mechanism)"

requirements-completed: [TOOL-02]

# Metrics
duration: ~12min
completed: 2026-06-13
---

# Phase 15 Plan 05: Kit-Shipped-Runnable Convention (TOOL-02 / D-11/D-12) Summary

**Built and PROVED the kit-shipped-runnable convention end-to-end: a reference routine `scripts/runnable-ref/reference-check.ts` speaking the uniform D-12 contract (exit 0 pass / 1 findings-RED / 2 error; clear-voice stdout; `--json {ok,findings}`), node: builtins only, fails RED on a planted `FORBIDDEN` fixture, and `install.ts materializeRunnable()` copies the compiled `.js` into the host's committed `tools/grugops/` (additive/idempotent/never-overwrite) — then runs in a bare-Node host with no node_modules. The D-11/D-12 interface Phase 16's test-integrity checker plugs into is demonstrated working.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-06-13
- **Tasks:** 2
- **Files created:** 5 · **Files modified:** 3

## Accomplishments
- The TOOL-02 reference routine is concrete and proven: the literal D-12 skeleton (read input fail-closed -> exit 2 on missing/unreadable; one deterministic rule -> exit 1 on the planted `FORBIDDEN` token with a clear-voice finding; `--json` machine block; exit 0 + "No findings." on a clean input), using `node:fs` only.
- The RED fixture proof (SC3/TOOL-02): `bad.txt` -> exit 1, `clean.txt` -> exit 0, demonstrated both by manual run and by the Vitest harness.
- The installer materialization (D-11): `install.ts materializeRunnable()` lands the compiled `.js` at the host's committed `tools/grugops/reference-check.js` at the seam Plan 03 reserved (between `seedState()` and `writeMarker()`), reusing the `seedFile` additive/idempotent/never-overwrite shape.
- The host-emulation proof (Pitfall 3 + D-11 end-to-end): both the routine's own harness and the install-side test run the materialized `.js` from a bare temp dir with NO node_modules reachable and assert exit 1 on the bad fixture.

## Task Commits

Each task was committed atomically (Task 1 is TDD, two gate commits):

1. **Task 1 (RED): failing harness + RED fixture** — `4697f64` (test)
2. **Task 1 (GREEN): reference kit-shipped runnable** — `54ddad0` (feat)
3. **Task 2: wire materializeRunnable() into install.ts + prove materialization** — `cfd9f79` (feat)

**Plan metadata:** committed with SUMMARY + STATE + ROADMAP + REQUIREMENTS.

## Files Created/Modified
- `scripts/runnable-ref/reference-check.ts` — the TOOL-02 reference runnable; node: builtins only; D-12 contract (exit 0/1/2 + clear-voice stdout + --json).
- `scripts/runnable-ref/reference-check.js` — committed compiled output (LF, freshness-gated).
- `scripts/runnable-ref/fixtures/clean.txt` — no bad token -> exit 0.
- `scripts/runnable-ref/fixtures/bad.txt` — planted `FORBIDDEN` token -> exit 1 (the RED fixture).
- `scripts/runnable-ref/reference-check.test.ts` — Vitest harness (7 cases incl. host-emulation).
- `install/install.ts` — added `materializeRunnable()` + the `RUNNABLES` table at the reserved D-11 seam.
- `install/install.js` — recompiled committed installer (LF, freshness-gated).
- `install/install.test.ts` — 4 D-11 install-side cases (lands / idempotent / never-overwrite / bare-Node run).

## Decisions Made
- **Materialization path = `tools/grugops/`** (RESEARCH Open Q2 / D-11, RESOLVED): committed, namespaced, not gitignore-adjacent, runnable from a bare host checkout. Baked into both the installer and the install-side test. **Phase 16's test-integrity checker materializes via this exact `materializeRunnable` mechanism** — it appends a `[source, dest]` row to the `RUNNABLES` table; no new mechanism is needed.
- **TOOL-02 marked complete** — the routine + installer materialization + the Node-only run test are all green (the tracking constraint's bar). **TOOL-01 left In Progress** (it spans the 15-06 `.mjs`/`.sh` deletion) and was not touched.

## Deviations from Plan

None - plan executed exactly as written.

The reserved D-11 seam from Plan 03 was filled exactly as documented; the `seedFile` never-overwrite shape ported cleanly to `materializeRunnable`; the freshness gate stayed green throughout (it already enumerated the new `reference-check.js` once committed). No bugs, missing critical functionality, or blocking issues surfaced.

## Issues Encountered
None.

## Threat Surface

No new security-relevant surface beyond the plan's `<threat_model>`. All five STRIDE entries are mitigated and proven:
- **T-15-05-Tamper** (overwrite a user-edited routine): `materializeRunnable` skips-if-identical and NEVER `>`-truncates an existing host file; the install harness asserts a user-edited `tools/grugops/reference-check.js` is preserved verbatim and a re-run is a no-op.
- **T-15-05-Tamper2** (host runtime-dep leak): the routine imports `node:fs` only (asserted: no non-`node:` import); the Pitfall-3 host-emulation test runs the materialized `.js` from a bare temp dir with no node_modules and asserts it still works.
- **T-15-05-DoS** (malformed/missing input): fail-closed read in try/catch -> clear-voice stderr + exit 2 (distinct from a clean fail); both a missing-path and a no-path-at-all case assert exit 2.
- **T-15-05-Info** (uncommitted/gitignored materialization path): `tools/grugops/` is committed + namespaced (not `.grugops/` state, not `bin/`); the harness asserts the file lands at the committed path and runs from a checkout-equivalent fixture.
- **T-15-05-EoP** (deploy-var / protected-dir write): `materializeRunnable` writes ONLY under `tools/grugops/`; `grep -nE 'GRUGOPS_PROD_DEPLOY_APPROVED\s*=' install/install.ts` returns nothing (no deploy-approval var write introduced).

## Known Stubs

None. The reference routine is a *deliberately trivial but real* checker (one deterministic `FORBIDDEN`-token rule) — that triviality is the design (the CONTRACT is what TOOL-02 proves, not a sophisticated rule). It is fully functional, not a stub: it reads real input, returns real D-12 exit codes, and runs in a bare host. Phase 16's test-integrity checker is the first non-trivial kit-shipped runnable and materializes via the same mechanism.

## Verification Results

Plan-level `<verification>` block — all PASS:
- `npx tsc --noEmit` exits 0; `npm run freshness` exits 0 (9 committed `.js` fresh, incl. the new `reference-check.js` and recompiled `install.js`).
- D-12 exit codes: clean=0, bad=1, missing=2 (manual run + Vitest).
- `--json` emits `{ ok:false, findings:[...] }` on bad, `{ ok:true, findings:[] }` on clean.
- node: builtins only (`grep` for non-`node:` imports returns nothing).
- `materializeRunnable()` call sits between `seedState()` (line 809) and `writeMarker()` (line 819) at line 816 — ordering preserved.
- `grep -q "tools/grugops" install/install.ts` true; no `GRUGOPS_PROD_DEPLOY_APPROVED=` write.
- Full Vitest tree-wide: 103 passed, 1 skipped (the intentional D-08 retired-parity marker), 7 files.

TDD gate sequence in git log: `test(15-05)` (RED, `4697f64`) -> `feat(15-05)` (GREEN, `54ddad0`). No REFACTOR commit needed.

## Next Phase Readiness
- **TOOL-02 is complete and proven.** The D-11 materialization mechanism + the D-12 invocation/result contract are demonstrated end-to-end on a real routine that runs in a bare-Node host — de-risking Phase 16's gate-convergence work.
- **Phase 16 handoff:** the test-integrity checker materializes via the exact `materializeRunnable` mechanism — append a `[source, dest]` row to the `RUNNABLES` table in `install/install.ts`; speak the D-12 contract (exit 0/1/2 + clear-voice stdout + `--json`); ship to `tools/grugops/`.
- **TOOL-01 remains In Progress** (spans 15-06): the `.mjs`/`.sh` originals + the invocation-string/env-var sweeps are Plan 06's deliverable. This plan added no new POSIX/.mjs surface.

## Self-Check: PASSED

All 5 created files verified present on disk (reference-check.ts/.js/.test.ts + clean.txt + bad.txt) plus the SUMMARY; all 3 per-task commits (`4697f64` test-RED, `54ddad0` feat-GREEN, `cfd9f79` feat) verified in git history.

---
*Phase: 15-typescript-tooling-migration*
*Completed: 2026-06-13*
