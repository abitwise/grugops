---
phase: 33-live-capture-windows-portability
plan: 18
subsystem: testing
tags: [windows, cap-02, d-14, d-15, d-16, posix-path, platform-shapes, derived-set, tdd, mutation-proof, gap-closure]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-02 (D-14 global testTimeout + slowTestThreshold), 33-03 (posix-path.ts, the toPosix/toPosixWith seam shape), 33-05 (HOST_CAPABILITIES, hostCapabilityOrSkip, the widened SKIPPED SHAPES remainder), 33-09 (the CI measurement rows W-12..W-16)"
provides:
  - "scannedDocumentsWith(api) in scripts/uat-gate-exit-contract.test.ts — the scanned document set published in POSIX at its one push site, with the win32 seam (test AE)"
  - "the 'unchanged at 40' case with NO per-test bound; the decision (REMOVE) and both measurements recorded above it"
  - "ADMISSIBLE_SHAPE_NAMES — the per-line remainder check derives its admissible shape="…" values from SHAPES + HOST_CAPABILITIES, with vacuity and collision floors"
  - "MIRROR_CAPABILITY_GATES in scripts/check-platform-shapes.test.ts — the one table gating a MIRROR case on a host capability; the COVERAGE case derives its undriven set from it through hostCapabilityOrSkip; a CENSUS case counts the gated mirror cases in the file's own syntax tree against the table"
affects: [33-20 (the pushed CI run that measures W-12..W-16 on windows-latest), 33-23 (ledger rows 231, 232, 233), cap-02]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate (chars/4 over the realized diff)
actuals:
  tokens: 5810
  tasks: 3
  commits: 4
plan_head_before: f421687a94d2198114ad82f5dc305edc2d30b48f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injected path API seam: `fnWith({ join, sep })` + host-bound wrapper `fn()` — the win32 spelling of a PUBLISHED set is exercised on every host (the 33-03 scanKey/toPosix shape, applied to a test-side derivation)"
    - "Derive-the-set with two floors: cardinality > 1 (vacuity) AND cardinality == sum of the source tables (no cross-table name collision)"
    - "One gating table read by both the gated case and the coverage derivation, plus a syntax-tree census of the gated call sites compared with the table's size and a refusal of literal spellings beside the table"
    - "RED evidence for vitest: `--reporter=tap-flat`, append `# tests/pass/fail` counted from the same output's non-SKIP lines, full `file > describe > title` targetTest (33-17's method, reused)"

key-files:
  created: []
  modified:
    - scripts/uat-gate-exit-contract.test.ts
    - scripts/check-platform-shapes.test.ts

key-decisions:
  - "W-13 derive-vs-remove decided as REMOVE: the `60_000` argument is deleted, not replaced by a derived number — the derivation would be the global `testTimeout: 180_000` already in force, and a gate that runs `git diff` over every disposition document has no fixed duration (D-14)"
  - "The seam premise is asserted first (`win32.join(AUDIT_DIR, …)` contains a backslash) so a seam that quietly became the identity is itself red, and the seam's set is asserted EQUAL to the host-bound set — on a POSIX host that equality holds exactly when normalization happened"
  - "The per-line loop keeps the seam's own premise (a FIFO row is present under FORCE_ABSENT=FIFO) and leaves the per-position pin in the preceding case; the remainder beyond the forced shape is checked as a relationship (member of the module's two tables), never as a literal"
  - "The COVERAGE derivation reads the same `hostCapabilityOrSkip(capability, position)` the mirror case takes, from one table — so the two consumers cannot disagree and no platform identifier is read"

patterns-established:
  - "Test-side published sets normalize at their member-forming site through scripts/posix-path.ts, exactly as production publishing sites do (D-15 applies to the tests' own published sets)"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "scannedDocuments() publishes POSIX members on every host (W-15, W-16): scannedDocumentsWith(api) normalizes through toPosixWith at the one push site; test AE drives path.win32 and asserts no backslash, the docs/audit/ filter non-empty, the split(\"/\") key a bare file name, and equality with the host-bound set"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split(\"/\") key see ONE spelling on every host"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#every ordinal-claiming sentence in the scanned set appears in the tracked list"
        status: pass
      - kind: other
        ref: "mutation: normalizer removed at the push site → test AE red: expected '\\Users\\olgeroeselg\\…' not to contain '\\' (restored, not committed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 'unchanged at 40' case carries no per-test timeout argument; D-14's global bound and slow-test warning govern it (W-13); the decision and both windows measurements are recorded in the comment above the case"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "grep -a -c '}, 60_000)' scripts/uat-gate-exit-contract.test.ts → 0"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40 (10 515 ms on darwin, printed as slow, passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The per-line remainder loop accepts every shape=\"…\" value the module can print — ADMISSIBLE_SHAPE_NAMES derived from SHAPES + HOST_CAPABILITIES with vacuity and collision floors (W-14)"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#NON-EMPTY on a platform lacking a shape, and each entry names the shape AND the platform"
        status: pass
      - kind: other
        ref: "darwin reproduction under FORCE_ABSENT=\"FIFO,chmod 000 enforcement\": old literal → AssertionError: expected '  shape=\"chmod 000 enforcement\" posit…' to contain 'shape=\"FIFO\"' (W-14's exact text); derived loop → 1 passed"
        status: pass
      - kind: other
        ref: "npm run check:platform-shapes → exit 0; `SKIPPED SHAPES (0):` / `(none) — this platform constructed every shape in the corpus`; HOST CAPABILITIES (3) all present"
        status: pass
    human_judgment: false
  - id: D4
    description: "The COVERAGE case derives its undriven label set from MIRROR_CAPABILITY_GATES through the host's measured capabilities (W-12); the CENSUS case pins the table against HOST_CAPABILITIES, the published kinds/labels, and the file's own gated call sites"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/check-platform-shapes.test.ts#COVERAGE: every label was WATCHED live except the two this platform cannot stage"
        status: pass
      - kind: unit
        ref: "scripts/check-platform-shapes.test.ts#CENSUS: MIRROR_CAPABILITY_GATES names published kinds, published labels and declared capabilities, and every gated MIRROR case in this file is a row of it"
        status: pass
      - kind: unit
        ref: "scripts/check-platform-shapes.test.ts#MIRROR: a driver killed by a signal is named as that, not as a refusal"
        status: pass
      - kind: other
        ref: "seam GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT=\"signal-terminated child\": derived set printed as [answered, no-answer, signalled] (grew by exactly the gated label) and the mirror case printed its SKIPPED row; mutations: literal capability beside the table → CENSUS red ('line 816'); empty table → mirrorGate throws + 'the gating table is empty'"
        status: pass
    human_judgment: false
  - id: D5
    description: "W-12..W-16 read green on windows-latest"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "The windows leg is measured only by plan 33-20's pushed CI run; this host (darwin) proves the mechanism and the win32 spelling through the seams, not the runner's outcome (D-13)."

# Metrics
duration: 16min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 18: Five windows reds in two test modules closed by derivation Summary

**The scanned document set is published in POSIX through `posix-path.ts` at its one push site (win32-proven on darwin by test AE), the explicit `60_000` bound is gone in favour of D-14's global bound, the per-line remainder check derives its admissible shape names from `SHAPES` + `HOST_CAPABILITIES`, and the COVERAGE case derives its undriven labels from one capability-gating table through the same `hostCapabilityOrSkip` measurement the mirror case takes — W-12..W-16 closed by mechanism, no platform conditional, no literal set.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-20T21:52:17Z
- **Completed:** 2026-09-20T22:08:27Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- **W-15 / W-16 (row 231):** `scannedDocumentsWith(api: { join, sep })` maps every joined member through `toPosixWith(p, api.sep)`; `scannedDocuments()` is the `node:path`-bound wrapper. Test AE drives `path.win32`, asserts the seam's premise first, then no backslash in any member, the `docs/audit/` filter non-empty (W-15's red), the `split("/").pop()` key a bare file name (W-16's red), and `members` equal to `scannedDocuments()`. RED (`expected 'undefined' to be 'function'`, `RED_EVIDENCE_OK`) precedes GREEN; the normalizer removed at the push site reds AE on darwin with `expected '\Users\olgeroeselg\…' not to contain '\'`.
- **W-13 (row 232):** the `}, 60_000)` argument is removed from the `unchanged at 40` case. The comment above it records the decision (REMOVE) and both measurements: 56 481 ms at the baseline run 35394268365 (passed, 3.5 s under the argument) and 61 989 ms at run 35499800942 (`Error: Test timed out in 60000ms.`) after this phase added twenty disposition rows. On darwin the case now runs in 10 515 ms — printed as slow by `slowTestThreshold: 5_000`, passed.
- **W-14 (row 232):** `ADMISSIBLE_SHAPE_NAMES = new Set([...SHAPES.map(s => s.name), ...HOST_CAPABILITIES.map(c => c.name)])`; each printed `shape="…"` must be a member; floors: size > 1, size == `SHAPES.length + HOST_CAPABILITIES.length`. The windows remainder was emulated on darwin (`FORCE_ABSENT="FIFO,chmod 000 enforcement"`): the old literal reproduces W-14's exact assertion text, the derived loop is green.
- **W-12 (row 233):** `MIRROR_CAPABILITY_GATES` (`kind`, `label`, `capability`, `position`) is the one table; the `signals-itself` MIRROR case reads it via `mirrorGate()`; the COVERAGE case's `expectedUndriven = [...DISCLOSED_UNDRIVEN, ...labelsGatedByAbsentCapability()]`, the latter filtered through `hostCapabilityOrSkip(g.capability, g.position) !== null`. A CENSUS case asserts every row's capability is a `HOST_CAPABILITIES` member, its kind and label are published by the module, no `hostCapabilityOrSkip(` call in a `MIRROR:` case takes a string literal, and the count of gated MIRROR cases in the file's own syntax tree equals the table's size.

## Task Commits

Each task was committed atomically (RED before GREEN where TDD applies):

1. **Task 1 (RED): test AE — scannedDocumentsWith(win32) must publish POSIX members** — `e5d98b8a` (test)
2. **Task 1 (GREEN): scannedDocumentsWith(api) publishes the scanned set in POSIX at its one push site** — `b23de153` (feat)
3. **Task 2: the explicit 60_000 bound goes; the per-line shape check derives its admissible names** — `ede586f9` (fix)
4. **Task 3: the COVERAGE case derives its undriven set from the measured capabilities** — `da755b7a` (fix)

TDD gate compliance: `test(33-18)` precedes `feat(33-18)`; the RED record returned `RED_EVIDENCE_OK` from `check tdd-red-evidence` (target AE, `expected 'undefined' to be 'function'`, exit 1, 1 test / 0 pass / 1 fail counted from the same tap-flat output). No REFACTOR commit — nothing to clean after GREEN.

## Files Created/Modified

- `scripts/uat-gate-exit-contract.test.ts` — `ScanPathApi`, `scannedDocumentsWith(api)`, `scannedDocuments()` wrapper, test AE, the bound removed with its decision comment, `ADMISSIBLE_SHAPE_NAMES` and the derived per-line loop; imports `toPosixWith` from `./posix-path.js` and `sep`, `win32` from `node:path`.
- `scripts/check-platform-shapes.test.ts` — `MIRROR_CAPABILITY_GATES`, `mirrorGate()`, `labelsGatedByAbsentCapability()`, the mirror case reading the table, the COVERAGE derivation with a `[33-18]` measurement line, the CENSUS case; imports `HOST_CAPABILITIES` and `fileURLToPath`.

## Every consumer of the scanned set, named (Task 1 acceptance)

`grep -n 'scannedDocuments()\|scannedDocumentsWith('` finds the definition (`:464`), the wrapper (`:475-476`), and three call sites — `:506` (the DERIVED-cardinality case), `:521` (the ordinal scan), `:557`/`:579` (test AE). The arms that read a member, each now reading the POSIX spelling:

| Arm | Site | What it does with the member |
|---|---|---|
| `summaries` filter | `:507`, AE | `d.endsWith("-SUMMARY.md")` — separator-neutral, unchanged |
| `audits` filter | `:508`, AE | `d.includes("docs/audit/")` — the POSIX literal that matched nothing on win32 (W-15) |
| identity skip | `:522` | `resolve(doc) === resolve(INSTANCE_LIST)` — a LOCATION comparison; `resolve` on win32 re-spells `/` as `\` on both sides, so it still holds (not a publishing site, left as is per D-15) |
| the read | `:523` | `readFileSync(doc)` — a location; win32 accepts the POSIX spelling |
| relative spelling | `:528` | `doc.slice(REPO_ROOT.length + 1)` — `REPO_ROOT` and the member differ only in separator, so the slice length is unchanged and the result is the POSIX repo-relative path the tracked list spells |
| the ordinal key | `:528`, `:530`, AE | `doc.split("/").pop()` — the bare file name on every host (W-16) |
| the failure message | `:530` | prints the key, now POSIX |

## The per-line loop (Task 2 acceptance — quoted)

```ts
const lines = r.out.split("\n").filter((l) => l.trim().startsWith('shape="'));
expect(lines.some((l) => l.includes('shape="FIFO"')), "the forced-absent shape is not in the remainder").toBe(true);
for (const line of lines) {
  const shape = /shape="([^"]*)"/.exec(line)?.[1];
  expect(shape, `a remainder line names no shape: ${line}`).toBeDefined();
  expect(ADMISSIBLE_SHAPE_NAMES.has(shape!), `a remainder line names a shape the module does not declare: ${line}`).toBe(true);
  expect(line).toContain('position="');
  expect(line).toContain(`platform=${process.platform}`);
  expect(line.length).toBeGreaterThan(60);
}
```

`npm run check:platform-shapes` on this host: exit 0; `HOST CAPABILITIES (3):` `chmod 000 enforcement present` / `signal-terminated child present` / `control byte in a path component present`; `DRIVEN (13):`; `SKIPPED SHAPES (0):` / `(none) — this platform constructed every shape in the corpus`; `ALL CHECKS PASSED`.

## The derived undriven set on this host (Task 3 acceptance — quoted)

`[33-18] COVERAGE undriven set on this host: ["NOT ORDINARY (answered)","NOT ORDINARY (no-answer)"]` (darwin; the capability is present, the case is unchanged). Under the test-side seam `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT="signal-terminated child"`: `["NOT ORDINARY (answered)","NOT ORDINARY (no-answer)","NOT ORDINARY (signalled)"]` — the set grew by exactly the gated label, and the mirror case printed `SKIPPED shape="signal-terminated child" position="scripts/check-platform-shapes.test.ts: MIRROR signals-itself" platform=darwin: …`.

**The second COVERAGE case** (`every mirror kind the module publishes was driven by a case above`) does NOT read the skip row. It reads `MIRROR_RUNS`, which the first COVERAGE case fills by running EVERY published kind (`probe.mirrorKinds.map((k) => runMirror(k))`) regardless of the capability — so a skipped mirror case still counts as driven there, and the case does not move one arm over on win32. What differs on win32 is the LABEL that run produces (`nonzero-exit`, the host's), which is exactly why `signalled` joins the undriven set.

## Decisions Made

- **REMOVE, not derive, for W-13.** The only derivation available is "the global bound", which is already in force; a per-test number below it reintroduces the same red on a slower runner. Recorded in the comment above the case with both measurements.
- **Two floors on the derived shape set** (size > 1, size == sum of the tables) rather than one: the second catches a name shared between `SHAPES` and `HOST_CAPABILITIES`, which would make a printed row ambiguous while the membership check stayed green.
- **The gating table carries `kind` and `label` as well as `capability`/`position`,** so the mirror case has no second spelling of any of the four, and the CENSUS can check each against its authority (published kinds, published row labels, declared capabilities).

## Deviations from Plan

None - plan executed exactly as written. (Test AE's `typeof` first assertion, and the `win32` import landing in the RED commit, are the same RED shape 33-17 used — the RED fails on the target assertion, not on a load error.)

## Issues Encountered

- **A seam limit, recorded, not fixed:** under `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT="signal-terminated child"` on darwin the COVERAGE case goes red (`- "NOT ORDINARY (signalled)"` expected but watched). Cause: `runGate()` in the shapes test strips every `GRUGOPS_*` variable from the gate child's environment, so the seam reaches the test-side measurement (the mirror case skips, the derived set grows) but not the gate's driver, which on darwin still delivers the signal and prints `signalled`. The two consumers agree wherever the capability is REALLY absent (windows-latest, where the driver prints `nonzero-exit`); the emulation cannot make a darwin driver lose signal delivery. The win32 arm is plan 33-20's measurement. No change to `runGate`'s env stripping was made (out of this plan's file set and a deliberate isolation).
- `check tdd-red-evidence` needs node-runner `# tests/pass/fail` lines that vitest's `tap-flat` reporter omits; appended, counted from the same output's non-SKIP `ok`/`not ok` lines, exactly as 33-17 did.

## Verification (plan-level, quoted from the commands' own output)

- `npx tsc --noEmit` — exit 0 (after every task).
- `npx vitest run --exclude '**/scripts/e2e/**'` — `Test Files  78 passed (78)` / `Tests  5364 passed | 2 skipped (5366)` / `Duration  492.77s` — the 2 skips are pre-existing (the file-scoped runs of both touched modules report 0 skipped: 35/35 and 27 with the filtered 4/4).
- `npm run check:nul-bytes` — `ALL CHECKS PASSED`, exit 0.
- `npm run check:platform-shapes` — exit 0, remainder quoted above.
- Task greps: `grep -a -c 'from "./posix-path.js"' scripts/uat-gate-exit-contract.test.ts` → 1; `grep -a -c '}, 60_000)' …` → 0; `grep -a -c 'HOST_CAPABILITIES' …` → 4; `grep -a -c 'MIRROR_CAPABILITY_GATES' scripts/check-platform-shapes.test.ts` → 10; `grep -c 'process.platform' scripts/check-platform-shapes.test.ts` → 0 (none added; the file had none).
- `npm test` was not run.

## Ledger state (for plan 33-23)

WINDOWS.md rows 231 (W-15/W-16), 232 (W-13/W-14) and 233 (W-12) stay `open`, and the two `deferred-items.md` entries for these files stay `status: open` — all flip only on plan 33-20's pushed run reading green on windows-latest, the phase's convention (33-17 did the same for rows 227/230). No new WINDOWS.md entry: no stub, skipped test or unrun verify was left behind.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-86 mitigated by the POSIX push site + seam; T-33-87 by the removed argument under D-14's global bound; T-33-88 by the two derived sets and the census; T-33-SC: no package installed.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- W-12..W-16 are closed by mechanism on this host, with the win32 spelling exercised through the seams; their windows greens are plan 33-20's expected observations.
- Remaining wave-8 sibling: 33-16 (if not yet executed), then 33-19..33-23 per the round-2 wave map.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

Files: 2 modified + this SUMMARY present on disk. Commits e5d98b8a, b23de153, ede586f9, da755b7a present in git log --all. commits: 4 measured as git rev-list --count f421687a..HEAD.
