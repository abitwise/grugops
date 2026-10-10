---
phase: 34-model-effort-dial-pi-support
plan: 35
subsystem: testing
tags: [installer, doctor, kit-route, class-test, mutation-proof, vitest, VERDICT-1, AUTH-1]

requires:
  - phase: 34-32
    provides: hostReadsCarrier / ENTRY_GATE_CHECKS (the Gemini gate), readGeminiContext, geminiMergePlan, and the follower's own Gemini rule
  - phase: 34-33
    provides: strandedBy / reachVia, noteStrandingCarriers over PLANNED_BYTES, and the follower's strandedOf
  - phase: 34-34
    provides: refreshable (used by refreshOwnFile, ensureBlock and classifyCarrier), moveOutAndLink, doctorInstallDoctor
provides:
  - "The brief §4 class test: one describe that drives --check and install over 39 generated cells (carriers × states, Gemini states, AGENTS.md × Gemini, broken adapters, route-target states) and asserts (1)-(9) for every HOST_TOOLS host"
  - "buildCell (staging by files only), followerView (the follower's reaches, gated reads and strandedHosts kept before and after the install), checkCell (doctor, DRY_RUN, install, doctor)"
  - "Matrix-level mutation proofs for the four owners: mA, mB, mC2 and mD each red on named cells. mC alone is an equivalent mutant"
affects: [34-36]

actuals:
  tokens: 7786
  tasks: 2
  commits: 2
plan_head_before: 8eae0b258c6e89fb8475f251e3091c049295c315
plan_head_after: d7b4e8ff
commits: 2

tech-stack:
  added: []
  patterns:
    - "A class test as a generated matrix: the axes are constants, checked against a derivation; the cells are generated; the count is a formula over the axes; one `it` per cell"
    - "The follower's answer is kept as a view (followerView) before and after the install, because the files change when install runs"

key-files:
  created: []
  modified:
    - install/kit-route.test.ts

key-decisions:
  - "Assertion (5) for carriers is the two-way equality the 34-34 rows use: the doctor names `Re-run install.js` on a carrier line exactly when the install reports created, copied, copied(verify), linked or refreshed for it. This covers both directions the plan states, and also catches an uncounted note that promises a re-run"
  - "Assertion (6) compares would-* against the written labels over the matrix files only (every route carrier and .gemini/settings.json), not over every installer line. In (d) cells the kit step reports edited-kit files and backups, and those are not this matrix's subject"
  - "The doctor's exit status is asserted only in cells where the adapters reach and the route resolves (a, b, c). It equals 1 exactly when a kit-route FAIL is printed, and every counted line in those runs is a kit-route line"
  - "The whole-file link state takes its link record from one real --symlink install's ledger (read once, then reused), with the link target replaced. The record format is never typed"
  - "mC (the readForWrite condition skipped in refreshable's file arm) is an equivalent mutant in every static state, as 34-34 found for its m1. mC2 (mC plus the sha256: condition skipped) is recorded as the proof that the matrix catches the file arm answering ok for a link"

patterns-established:
  - "checkCell order: follower view, doctor, snapshot, DRY_RUN (target byte-identical), real install, follower view, doctor; every assertion message names the cell, the host or the file"

requirements-completed: [HOST-01, PI-02, PI-03]

coverage:
  - id: D1
    description: "The tracer cell (the user's own AGENTS.md without the route × Gemini settings that omit AGENTS.md) passes all nine assertions, with the follower's stranded hosts before (Codex CLI, OpenCode) and after (Codex CLI, Gemini CLI, OpenCode)"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#tracer: the user's own AGENTS.md without the route × Gemini settings that omit AGENTS.md: all nine assertions, and the follower's stranded hosts before and after the install"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 39 generated cells all pass assertions (1)-(9). The cell count is asserted against the formula over the derived axes, and the carrier axis is checked against a clean --check"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: the class matrix — reach, counted findings and install agreement over every carrier, Gemini and adapter state (plan 34-35, D-27)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Matrix-level mutation proofs, one per owner, each red on named cells and restored byte for byte (mA, mB, mC2, mD; mC survives as an equivalent mutant)"
    requirement: PI-03
    verification:
      - kind: other
        ref: "SUMMARY 'Mutation proofs' table; restore checked by cmp and `git diff --quiet -- install/install.ts install/host-tools.ts install/install.js install/host-tools.js` (exit 0)"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-10-10
status: complete
---

# Phase 34 Plan 35: the brief §4 class matrix for VERDICT-1 and AUTH-1 Summary

**install/kit-route.test.ts now has one describe that builds 39 cells from derived axes, all by writing files. Each cell covers the carriers, the Gemini settings, Claude Code's adapters and the route target. In each cell the test runs `--check`, a DRY_RUN install, the real install and `--check` again, and holds every HOST_TOOLS host to an independent follower. The follower checks the reach verdicts, the counted findings, every `Re-run install.js` against what the install actually writes, DRY_RUN against the real run, and the install's route notes against its own stranded hosts. All 39 cells pass on the current product. Each of the four owners has a mutation that turns named cells red.**

## Performance

- **Duration:** about 20 min (2026-10-10T16:37:08Z to about 16:57Z)
- **Tasks:** 2 of 2
- **Files modified:** 1 (install/kit-route.test.ts, +501 lines). No product file changed.
- **Matrix runtime:** the class-matrix describe alone (`-t "class matrix"`, 42 tests) took 64 s wall clock. A cell takes about 0.3 to 2 s. The three-file lane (kit-route, host-tools, path-spelling-census, 187 tests) took 95 s.

## Accomplishments

- **The follower is extended, and stays independent.** `followerView(target)` keeps three things: `follow()` (route resolves, carriers that hold KIT_ROUTE, the SKILL.md KIT= adapter read, per-host reach); the gated reads (`followerCarriers`, the 34-32 Gemini rule); and `strandedHosts(rel)` (the 34-33 `strandedOf`: the hosts that read rel here, read no other carrier holding the route, and have no adapter route). The test imports, unchanged:
  `import { HOST_TOOLS, HOST_TOOL_COUNT, KIT_ROUTE, PI_PROMPT_REL, ROUTE_POINTERS } from "./host-tools.js";`
  Only data comes from host-tools.js; each host's gated carrier is read from the row's `entryGates`. Nothing is imported from install/install.js; the test only spawns it through `INSTALL_JS`. The file's existing `contentRecord` import from install-marker.js is used only by the 34-27 `stageOldTemplate` helper, not by the follower or the matrix.
- **buildCell(spec)** runs a clean install into a scratch row (GRUGOPS_HOME and `--target` under the file's ROOT). Then it stages the cell by writing files:
  - **carrier states:**
    - `current`: no change;
    - `own-stale`: `stageEarlierFile` or `stageEarlierBlock`;
    - `user-without-route`: a user file; for a block carrier, a user line inside the block and KIT_ROUTE removed;
    - `user-with-route`: user text holding KIT_ROUTE;
    - `absent`: the file removed;
    - `link-to-stale`: install's stale copy moved out under ROOT and linked back; a whole-file carrier's ledger record becomes the link record that a real `--symlink` install writes, with its target replaced;
    - `unreadable`: a directory at the path.
  - **Gemini states:** `lists`, `omits`, `duplicate-context`, `not-strict-json` (a trailing comma), `absent`.
  - **adapter states:** `reaches`, or `kit-line-to-empty-dir` (every materialized KIT= line under `.claude/` rewritten to point at an empty directory; premise: the follower's adapter read then fails).
  - **route states:** `kit-root-to-empty-dir`, or `orchestrator-removed` (the removal is asserted to be under the row's own kit home first).
- **checkCell(spec)** asserts, in order:
  1. HOST_TOOL_COUNT reach lines, in registry order.
  2. Every host's verdict equals the follower's.
  3. A counted kit-route line exists exactly when some host cannot reach.
  4. Every kit-route line is classified, and the count of classified lines must equal the count of kit-route lines:
     - the route-target line: ok exactly when the route resolves;
     - one line per carrier: ok when the carrier holds the route; otherwise counted exactly when the follower's strandedHosts is non-empty, naming exactly those hosts, and an uncounted note otherwise;
     - one gate line per (host, gated carrier): ok when the host reads the carrier, a note when it does not but reaches another way, a WARN when it cannot reach.
  5. `Re-run install.js` on a carrier line exactly when the install writes that carrier. The Gemini gate line names it exactly when the install writes `.gemini/settings.json`, and afterwards Gemini reads AGENTS.md exactly when the gate was ok or named the re-run. A route-target `Re-run install.js` must leave the route resolving, and a route the install repaired must have had its FAIL name the remedy.
  6. DRY_RUN would-* equals the real writes over the matrix files, and the target is byte-identical after the DRY_RUN (snapshotTree).
  7. The DRY_RUN route notes equal the real route notes.
  8. One route note per carrier that the follower says strands a host after the run, naming exactly those hosts. Every matrix file the install did not report writing is unchanged (lstat-based state, and the content behind a link).
  9. Assertions 1-4 again, on `--check` after the install.

  In (a)-(c) cells the doctor's exit status is also asserted. In (d) and (e) cells it is not, because the D-03 kit-root cross-check and the stat set FAIL there, and those are not kit-route lines. The install's exit status must be 0 or 3 in every cell.
- **The axes and the cells.** CLASS_CARRIERS = carriersOf over HOST_TOOLS: CLAUDE.md, AGENTS.md, .github/copilot-instructions.md, .pi/prompts/grugops.md. A first test checks it against the carriers a clean `--check` prints `kit route carried by` lines for, in the same order. The cells are generated:
  - (a) 4 carriers × 6 non-current states = 24;
  - (b) 5 Gemini states;
  - (c) AGENTS.md {user-without-route, own-stale} × Gemini {omits, duplicate-context} = 4;
  - (d) broken adapters × CLAUDE.md {current, user-without-route} × AGENTS.md {current, user-without-route} = 4;
  - (e) 2 route states.

  The count test is titled "the matrix has 39 cells, the formula over the axes (4 carriers × 6 states, 5 Gemini states, 4 AGENTS.md × Gemini, 4 adapter, 2 route), each named once". It also asserts that every state of every axis, and every carrier × state pair, occurs in some cell.

## The tracer cell (Task 1): the nine assertions and the follower's stranded hosts

Cell: a clean install; AGENTS.md replaced by `# My own AGENTS.md\n\nMy own instructions.\n`; `.gemini/settings.json` = `{"context":{"fileName":["GEMINI.md"]}}`.

The test derives, from HOST_TOOLS, the hosts whose only carrier is AGENTS.md (Codex CLI, Gemini CLI, OpenCode). The follower then derived:

| | Before the install | After the install |
|---|---|---|
| strandedHosts(AGENTS.md) | Codex CLI, OpenCode (Gemini reads no carrier here) | Codex CLI, Gemini CLI, OpenCode |
| Cannot reach | Codex CLI, Gemini CLI, OpenCode | same |
| Reach | Claude Code (CLAUDE.md and its adapters), GitHub Copilot CLI, Pi (their pointers) | same |

All nine assertions passed:
1. Six reach lines, in registry order.
2. Every verdict equals the follower's.
3. Counted kit-route lines exist.
4. The AGENTS.md WARN names exactly Codex CLI, OpenCode, and a counted Gemini gate WARN exists.
5. No `Re-run install.js` for AGENTS.md. The gate WARN names it, the install writes `.gemini/settings.json`, and Gemini then reads AGENTS.md.
6. The DRY_RUN reports `would-add .gemini/settings.json` and no would-* for AGENTS.md.
7. The DRY_RUN route notes equal the real ones.
8. The install merged AGENTS.md into context.fileName and left AGENTS.md byte-identical. Its AGENTS.md note names Codex CLI, Gemini CLI, OpenCode.
9. `--check` after the install agrees with the follower for every host.

Tracer gate: Task 1's `<verify>` was re-run end to end before Task 2 (build; `-t "class matrix"` 1/1). The path-spelling census (15/15) and typecheck also passed. Tracer verified end to end, then expanded.

## Task Commits

1. **Task 1 (tracer): the class matrix tracer cell.** Commit `0c4bb92e` (test).
2. **Task 2: the whole derived matrix, the count by formula, the mutation proofs.** Commit `d7b4e8ff` (test).

## RED evidence

This plan adds a class test over owners that 34-32 to 34-34 had already fixed, so there is no pre-fix build to run it against. RED is shown by mutation instead, as the plan specifies:
- **Before the Task 1 commit,** the tracer was run under mA (below). It failed on assertion (4): `(4) AGENTS.md: the counted line names exactly the follower's stranded hosts`. The doctor's WARN named Codex CLI, Gemini CLI, OpenCode, against the follower's Codex CLI, OpenCode.
- **Semantic assessment:** the target test failed on the planned assertion for the planned reason, the Gemini gate answering wrongly (AUTH-1). It was not a load, fixture or syntax fault.
- **A discarded first attempt:** mA spelled `if (readAt !== null) return …` did not compile (TS2349: `readAt` narrowed to never), and tsc emitted nothing. That run exercised the unmutated build and passed, so it was discarded (gotcha 7). mA was re-run with `if (Math.random() >= 0) return …`: tsc exited 0 and the .js changed.

## Mutation proofs (matrix level)

Method, for each mutation:
1. Apply it to the saved original source with an exact-match replace.
2. Run `npx tsc`. The run is rejected unless tsc exits 0 and the .js differs from the saved original.
3. Run `-t "class matrix"` with the verbose reporter.
4. Restore install.ts, install.js, host-tools.ts and host-tools.js from the saved originals, rebuild, and check each with `cmp`.

After every restore, `git diff --quiet -- install/install.ts install/host-tools.ts install/install.js install/host-tools.js` exited 0.

| # | Mutation (owner) | Result | First red cell and line |
|---|---|---|---|
| mA | the `gemini-context-file-name` check always answers reads: `if (Math.random() >= 0) return { reads: true, unread: false, why: "mA", remedy: "" };` at the top of the check (hostReadsCarrier / ENTRY_GATE_CHECKS, 34-32) | **9 red:** (b) omits, duplicate-context, not-strict-json, absent; all four (c) cells; the tracer | (b) omits: `(2) Gemini CLI: the doctor and the follower disagree:   reach          Gemini CLI: reaches the Orchestrator through AGENTS.md`; (c) and the tracer: `(4) AGENTS.md: the counted line names exactly the follower's stranded hosts` |
| mB | strandedBy returns every host that reads the file: `return via !== null;` instead of `return via.carriers.length === 0 && !via.adapter;` (host-tools.ts, 34-33) | **28 red:** every (a) cell whose carrier lacks the route (4 carriers × own-stale, user-without-route, absent, link-to-stale, unreadable), including the Copilot pointer and Pi template absent and user's-own cells; all four (c); (d) AGENTS.md user, CLAUDE.md user, and both; the tracer | (a) CLAUDE.md own-stale: `(3) counted kit-route lines vs hosts that cannot reach (none)`; (a) .github/copilot-instructions.md absent and (a) .pi/prompts/grugops.md absent: the same `(3)` line; (a) AGENTS.md cells: `(4) AGENTS.md: the counted line names exactly the follower's stranded hosts` |
| mC | refreshable's file arm skips the readForWrite condition (a refused read falls back to the link-following readUserFile) (install.ts, 34-34) | **survived: 42/42 green** | none. Equivalent mutant (see below) |
| mC2 | (added) mC plus the `sha256:` condition skipped (`… && Math.random() < 0`) | **2 red:** (a) AGENTS.md link-to-stale and (a) .pi/prompts/grugops.md link-to-stale, both on assertion (5) | `(5) (a) AGENTS.md link-to-stale × gemini lists × adapter reaches × route resolves: the doctor names \`Re-run install.js\` for AGENTS.md exactly when the install writes it`. The doctor printed `FAIL kit route missing from AGENTS.md (it leaves Codex CLI, Gemini CLI, OpenCode without a route to the Orchestrator): … Re-run install.js`, and the install printed `verify AGENTS.md: … is a symbolic link, and the installer never writes through a link it did not create` |
| mD | noteStrandingCarriers ignores PLANNED_BYTES: `PLANNED_BYTES.size < 0 ? PLANNED_BYTES.get(rel) : undefined` (install.ts, 34-33) | **6 red, all on assertion (7):** (a) AGENTS.md own-stale, (a) AGENTS.md absent, (c) AGENTS.md user-without-route × omits, (c) own-stale × omits, (c) own-stale × duplicate-context, the tracer | (a) AGENTS.md own-stale: `(7) … DRY_RUN route notes vs the real install's`. Expected `[]`, received `["  note           AGENTS.md (left as it is, with no kit route in it: it leaves Codex CLI, Gemini CLI, OpenCode without a route to the kit after a scripted install; …"]` |

**Why mC survives.** For a `sha256:` record, owns already reads the path through readForWrite. So a link, a hard link, a special file or a linked directory at the path already makes owns answer not owned. For a `link:` record (the link-to-stale cells), the `sha256:` condition refuses before the read. So in every static cell the file arm's readForWrite step cannot fail after owns has answered owned. This is the same finding as 34-34's m1. mC2 removes both conditions, and exactly the two whole-file link cells turn red on the install-agreement assertion, which is the plan's predicted mC result.

## Verification run

- `npm run build`; `npm run check:build-parity` (ALL CHECKS PASSED); `npm run typecheck` (exit 0).
- Task 2 lane, under `TMPDIR=$(mktemp -d /tmp/g34.XXXX)`: `npx vitest run --exclude '**/scripts/e2e/**' install/kit-route.test.ts install/host-tools.test.ts install/path-spelling-census.test.ts`. Result: 3 files, 187 passed, 0 failed. The class-matrix describe ran 42 passing tests (tracer, carrier axis, count, 39 cells), which is at least the printed cell count of 39.
- install/path-spelling-census.test.ts passed 15/15. Printed paths are matched only through the report-subject tokens (relative paths) and the existing helpers. No new `includes`/`toContain` of a natively built path.
- Not run here: the full suite (it runs once, in 34-36), `npm test`, and the Node v26 fs census (not affected: no product change).

## Decisions Made

See key-decisions in the frontmatter:
- the two-way `Re-run install.js` equality for assertion (5);
- assertion (6) limited to the matrix files;
- where the exit status is asserted;
- the link record taken from a real `--symlink` install;
- mC2 recorded beside the surviving mC.

## Deviations from Plan

### Mutation set

**1. mC is an equivalent mutant; mC2 added**
- **Found during:** Task 2, step 5.
- **Issue:** the plan predicted that mC (refreshable's file arm skips readForWrite) turns the AGENTS.md and Pi link cells red on (5). It survives in all 42 tests, because owns and the `sha256:` check already decide every static state before that read (as in 34-34's m1).
- **Fix:** no product or test change. mC2 (mC plus the `sha256:` condition skipped) is recorded. It turns exactly those two cells red on (5).
- **Commit:** none needed (mutations are never committed).

### Interpretation choices (no behaviour beyond the plan)

**2. The plan's mA cell list says "unreadable".** GEMINI_STATES has no unreadable state; the plan's five states are lists, omits, duplicate `context`, not strict JSON and absent. mA turned the not-strict-json cell red, together with omits, duplicate-context and absent.

**3. A tracer-specific `it` beside the matrix.** The tracer cell is also generated as a (c) cell. The separate tracer test adds the cell-specific expectations (the stranded hosts derived from HOST_TOOLS, the WARN and gate wording). So the describe runs 42 tests for 39 cells.

**Total deviations:** 1 mutation-set note (mC, as 34-34's m1) and 2 interpretation notes. **Impact:** none on scope. No product file, CLI flag, dependency or test expectation outside the new describe changed. No cell exposed a product defect.

## Issues Encountered

- The mutation runner's first red-list extraction counted passing cells too, because the cell names contain "×". It was fixed to match only failed test lines. The red counts above come from vitest's own `Tests N failed` line and the failed-test headers.
- One mutation spelling did not compile (see RED evidence). It was discarded and re-run with a compiling form.

## Known Stubs

None.

## Threat Flags

None. The test adds no product surface. Every install it spawns goes through spawnBin/runInstall, with GRUGOPS_HOME and `--target` under the file's ROOT, which afterAll removes. The `orchestrator-removed` state asserts that the removed path lies under the row's own kit home before it deletes it. T-34-90 (shared derivation) is covered by the data-only imports and the four mutation proofs. T-34-91 (a shrinking matrix) is covered by the derived and checked carrier axis, the count formula, the every-state-occurs assertions and one `it` per cell. T-34-SC: no package was installed.

## User Setup Required

None.

## Next Phase Readiness

34-36 (the full regression and the README DOC-1 paragraph noted in 34-34) can run the whole suite with this describe in it. It adds about 64 s to the kit-route file.

## Self-Check: PASSED

- FOUND: install/kit-route.test.ts (modified; it contains "the class matrix")
- FOUND: commits 0c4bb92e and d7b4e8ff (ancestors of HEAD); `git rev-list --count 8eae0b25..HEAD` = 2 before this SUMMARY
- Product files unchanged: `git diff 8eae0b25..HEAD --name-only` lists only install/kit-route.test.ts

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-10*
