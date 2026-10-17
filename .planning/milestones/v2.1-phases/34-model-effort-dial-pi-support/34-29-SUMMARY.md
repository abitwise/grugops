---
phase: 34-model-effort-dial-pi-support
plan: 29
subsystem: installer
tags: [install, doctor, check, kit-route, per-host, reach, AGENTS.md, CLAUDE.md, copilot, pi, G-34-2, D-26, D-25, DC-3, typescript, vitest]

requires:
  - phase: 34-28
    provides: routeCarriers, hostsReading, ROUTE_POINTERS, blockLineSpans export, ensureBlock(ledger), refreshOwnFile, stageEarlierFile, stageEarlierBlock
provides:
  - "--check asks every route carrier the registry derives (the union of routeCarriers over HOST_TOOLS): ok, FAIL for install's own stale copy, WARN for a user's own, absent or unreadable carrier"
  - "one uncounted `reach` line per HOST_TOOLS row, in registry order, saying whether the host reaches the Orchestrator and through which carriers (claude-kit hosts also through the adapters' KIT= line)"
  - "ownBlockSpans: the one answer ensureBlock's refresh and the doctor's carrier finding both ask"
  - "the CLAUDE.md, Copilot and Pi pointer constants now sit above the --check early exit (moved, not copied)"
  - "install/kit-route.test.ts: an independent per-host follower and the seven-scenario matrix"
affects: [34-30 (documentation of the per-host doctor lines), 34-verification, 34-UAT test 2 re-run]

actuals:
  tokens: 16500      # chars/4 over the realized diff 781de478..6b9aaa74 (65872 chars)
  tasks: 2
  commits: 2
plan_head_before: 781de4787c5387ef7d70f82432cd0a2ca694cf00
plan_head_after: 6b9aaa74b9de4a0fa493a5fe0e09d5a51fb78ecc

tech-stack:
  added: []
  patterns:
    - "The doctor's carrier set and host lines are derived from HOST_TOOLS; the counted findings stay on carriers and the route, and the per-host lines are an uncounted summary, so a stranded host always has a counted WARN or FAIL behind it"
    - "A rule that both a writer (refresh) and a checker (doctor) ask is one function (ownBlockSpans), so the checker's remedy ('re-run install.js') is true exactly when the writer would act"
    - "Two-sided class test: the doctor's per-host verdict against a follower that reads the files with its own code"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/kit-route.test.ts

key-decisions:
  - "A carrier listed in ROUTE_BLOCKS (CLAUDE.md, the Copilot pointer) is install's own only by the block rule (exactly one span matching the block record), never by its file entry: that is the rule ensureBlock refreshes on, so the FAIL's remedy 're-run install.js' is true whenever the FAIL is printed"
  - "The pointer constants (CLAUDE_OPEN through PI_PROMPT_TEXT) were moved above the doctor, not copied, because the doctor runs above the --check early exit and the consts below it are in their temporal dead zone"
  - "The path-exists assertion of S1/S4 covers the pointer files install writes (ROUTE_POINTERS; a block's own lines) and KIT_ROUTE itself, not the whole kit AGENTS.md, whose backticked tokens include commands, globs and state paths that are not files in a fresh target"

patterns-established:
  - "reach line shape: `  reach          <host name>: reaches the Orchestrator through <carriers>` or `<host name>: CANNOT reach the Orchestrator: <each carrier's state>; <the route's state>`"

requirements-completed: [PI-02, HOST-01]

coverage:
  - id: D1
    description: "--check checks every derived route carrier: ok with the route; FAIL for install's own stale copy; WARN for a user's own, absent or unreadable carrier; FAIL when the route does not resolve"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: --check and an independent follower agree, host by host (S1-S7)"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: Pi's /grugops names a route that resolves (34-27 doctor rows, unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One reach line per HOST_TOOLS row in registry order, count equal to HOST_TOOL_COUNT; the hosts whose only carrier is a user's route-less AGENTS.md are named as unable to reach, with one WARN; exit 0, and 1 with --strict"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: --check prints, for every registry host, whether it reaches the Orchestrator (2 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Over seven scenarios the doctor's reach verdict for every host equals the independent follower's; a stranded host has a counted finding; a route FAIL exactly on own-stale or an unresolved route; exit 0/0/1/0/0/1/0"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#S1..S7 and the 7-scenario / HOST_TOOL_COUNT count case"
        status: pass
      - kind: other
        ref: "mutations m1-m4 (this SUMMARY), each red, each restored byte for byte"
        status: pass
    human_judgment: false
  - id: D4
    description: "After a scripted install with a separate kit home (S1, and S4 after a refresh), every path the pointers and KIT_ROUTE name exists: <kitRoot>/roles/orchestrator.md, AGENTS.md and .grugops/install.json under the target"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#S1 a fresh install / S4 the same after re-install (expectNamedPathsExist)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Live hosts (Pi, Codex, Gemini, OpenCode, Copilot) follow the words to the Orchestrator"
    requirement: PI-02
    verification: []
    human_judgment: true
    rationale: "Live host behaviour is UNKNOWN - verify until the human re-runs 34-UAT.md test 2 (D-25 point 4); no test here runs a host."

duration: 51min
completed: 2026-10-10
status: complete
---

# Phase 34 Plan 29: --check says, for every host, whether it reaches the Orchestrator (D-26 point 4, G-34-2) Summary

**`install.js --check` now asks every route carrier the registry derives (AGENTS.md, CLAUDE.md, the Copilot pointer, the Pi template) and prints one `reach` line per HOST_TOOLS host saying whether that host reaches the Orchestrator and through which carriers. A seven-scenario matrix holds the doctor's verdict equal, host by host, to a follower that reads the files with its own code. Before this plan, a target whose own AGENTS.md lacked the route printed ALL CHECKS PASSED while Codex, Gemini and OpenCode could not reach the kit.**

## Performance

- **Duration:** 51 min, including one full-suite run of about 30 minutes
- **Started:** 2026-10-10T09:45:26Z
- **Completed:** 2026-10-10T10:36:38Z
- **Tasks:** 2
- **Files modified:** 3 (0 created)

## Accomplishments

- **Task 1 (tracer): the carriers and the reach lines** (install.ts):
  - `routeCarrierSet()` is the union of `routeCarriers(host)` over HOST_TOOLS, in first-seen order. Today that gives CLAUDE.md, AGENTS.md, .github/copilot-instructions.md and .pi/prompts/grugops.md. `KIT_ROUTE_CARRIERS` (the Pi-only list from 34-27) is gone.
  - `carrierFinding(rel, ledger)` reads the carrier through readUserFile and classifies it with carriesKitRoute over the whole text:
    - carries the route → `route` (an ok line);
    - no route, and install's own → `own-stale` (a FAIL with the remedy "Re-run install.js"). A whole file is install's own when `owns(..., "file")` answers owned. A block carrier (ROUTE_BLOCKS: CLAUDE.md, Copilot) is install's own when `ownBlockSpans` keeps exactly one span;
    - no route, not install's own → `user` (a WARN that names the file, the hosts that read it, and KIT_ROUTE);
    - absent → `absent` (a WARN);
    - not a readable regular file → `unread` (a WARN that says no verdict was reached).
    Every message names the file and its hosts (hostsReading).
  - `ownBlockSpans(ledger, rel, bytes, open, close)` is 34-28's block rule as one function. ensureBlock now calls it, and so does the doctor.
  - The route-target check (`kitRoot` → `roles/orchestrator.md`) is unchanged and now records whether the route resolves.
  - One `reach` line per HOST_TOOLS row, with an uncounted label. A host reaches when one of its routeCarriers is `route` and the route resolves. A `claude-kit` host also reaches when the KIT= value the D-03 cross-check read passes `kitReal`. The doctor passes that value (`nc`) to `kitRouteFindings`. A host that cannot reach gets each carrier's state and the route's.
  - The CLAUDE.md, Copilot and Pi pointer constants were moved (not copied) above the doctor, to avoid the temporal dead zone. A comment marks their old position.
- **Task 2: the matrix** (kit-route.test.ts):
  - `follow(target)` is the independent follower. It reads the marker with JSON.parse and checks `<kitRoot>/roles/orchestrator.md` with statSync. Carriers come from the test's own `carriersOf`. It works out own-stale from its own ledger read: a file entry's sha256 (node:crypto), or a block record that matches exactly one span from its own `allBlockSpans`. For `claude-kit` hosts it also reads the KIT= line in the materialized block of `.claude/skills/grugops/SKILL.md`, with sentinels spelled in the test.
  - Seven scenarios, S1 to S7. For each scenario and each host:
    - the doctor's verdict equals the follower's;
    - a stranded host has a counted WARN or FAIL that names one of its carriers, or the route FAIL;
    - route FAIL lines appear exactly when the follower finds an own-stale carrier or an unresolved route, with one FAIL per own-stale carrier;
    - the exit status is 0/0/1/0/0/1/0.
  - S1 and S4 also check that every path the pointer files and KIT_ROUTE name exists.
  - The test asserts both counts: 7 scenarios and HOST_TOOL_COUNT hosts.

## Task Commits

1. **Task 1 (tracer): carriers over the derived set; reach lines; ownBlockSpans** - `eaeddd64` (feat)
2. **Task 2: the seven-scenario per-host matrix against the independent follower** - `6b9aaa74` (test)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

`workflow.tdd_mode` is false, and the round rules forbid a red commit. Each task is one green commit, and its RED run is recorded here.

**Task 1 RED** (the two behaviour cases against the 34-28 build): `TMPDIR=/tmp/gd npx vitest run install/kit-route.test.ts -t "reaches the Orchestrator"` gave `Tests 2 failed | 26 skipped (28)`.
- The user's-own-AGENTS.md case failed at kit-route.test.ts:599 with `expected +0 to be 6` (no reach lines).
- Its printed doctor output ended in `ALL CHECKS PASSED`. That is the G-34-2 "why not caught" half, reproduced: Codex, Gemini and OpenCode were stranded and the doctor was green.

**Task 2 RED** (the matrix against the 34-28 install.js, swapped in and then restored with `git checkout -- install/install.js`): `Tests 7 failed | 1 passed | 28 skipped (36)`.
- All seven scenarios failed. The one that passed is the count case.

**Tracer gate.** The mode is interactive with `end-of-phase`, and the verify is automated only. The Task 1 verify was re-run after the commit with the rebuilt tree unchanged: `Test Files 2 passed (2)`, `Tests 92 passed | 357 skipped (449)`. The tracer was verified end to end, then expanded.

## Mutation proofs

Each mutation was applied to install.ts and built with `tsc`, which exited 0. kit-route.test.ts was then run. The tree was restored from a saved copy and rebuilt. `cmp` confirmed that install.ts and install.js equal the saved copies, and `git diff --quiet` was clean.

| Mutation | Result | First red line in the targeted case |
|---|---|---|
| m1: AGENTS.md dropped from the doctor's carrier set | `Tests 8 failed \| 28 passed (36)` | S2: `AssertionError: Codex CLI cannot reach, and no counted WARN or FAIL is behind it` / `expected 0 to be greater than 0` (kit-route.test.ts:850). It also fails S1, S3 to S5, S7 and both Task 1 cases. |
| m2: a present carrier classified `route` without asking carriesKitRoute | `Tests 5 failed \| 31 passed (36)` | S3: `expected +0 to be 1` at kit-route.test.ts:841, so `--check` exited 0 over four stale carriers. It also fails S2, the Task 1 AGENTS.md case and two 34-27 rows. |
| m3b: the route-target check skipped (`routeResolves` always true) | `Tests 3 failed \| 33 passed (36)` | S6: `AssertionError: Codex CLI: the doctor and the follower disagree` / `reach Codex CLI: reaches the Orchestrator through AGENTS.md: expected true to be false` (kit-route.test.ts:847). It also fails the two 34-27 route rows. |
| m4: reach lines built from `HOST_TOOLS.slice(0, -1)` | `Tests 9 failed \| 27 passed (36)` | the Task 1 fresh-install case: `expected 5 to be 6` (kit-route.test.ts:580). It also fails all seven scenarios at the reach-count assertion. |

The first m3 attempt did not compile (`TS6133: 'markerFile' is declared but its value is never read`; `noEmitOnError` is set), so its run used the m2 build that was still in place. That result is not counted. m3b keeps `markerFile` in use and compiles; `grep -c` confirmed the mutation in install.js.

## Regression gate (at the Task 2 tree, before its commit)

- `npm run build`: exit 0. `npm run check:build-parity`: `ALL CHECKS PASSED`, after each commit. `npm run typecheck`: exit 0.
- `node scripts/check-kit-refs.js` and `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED.
- `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**'` (Node v26.11.0):
  - ` Test Files  1 failed | 104 passed (105)`
  - `      Tests  1 failed | 7621 passed | 2 skipped (7624)`
  - The one red is the known local red: install/installer-fs-census.test.ts, `UNCLASSIFIED node:fs export openAsBlobSync` (Node 26 runtime).
- `PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts` (Node v24.12.0): `Test Files 1 passed (1)`, `Tests 24 passed (24)`.
- The doctor-adjacent files after Task 1 (install, installer-write-set, installer-special-files, marker-binding, uninstall-removal, record-truth, mode-census, path-spelling-census, host-tools): `Test Files 9 passed (9)`, `Tests 1104 passed | 1 skipped (1105)`.
- Acceptance searches:
  - `git grep -n "routeCarriers" install/install.ts` shows the doctor's use at routeCarrierSet (install.ts:1143) and kitRouteFindings (install.ts:1278), plus the import and noteMissingRoute.
  - `git grep -nE '"(Claude Code|Codex CLI|Gemini CLI|OpenCode|GitHub Copilot CLI|Pi)"' install/install.ts` prints nothing, so install.ts has no host name literal.
- No live host run and no Windows result is claimed (D-25).

## install.test.ts doctor expectations changed

None. Every existing doctor case in install.test.ts and the other `--check` test files passed unchanged. Each fixture's carriers either carry the route or the case asserts nothing that the new carrier or reach lines contradict.

## Files Created/Modified

- `install/install.ts` / `.js`:
  - ROUTE_BLOCKS, ownBlockSpans, routeCarrierSet, CarrierState, CARRIER_STATE_TEXT, carrierFinding;
  - kitRouteFindings over the derived carrier set, with the reach lines and the new `adapterKit` parameter;
  - ensureBlock calls ownBlockSpans;
  - the pointer constants moved above the doctor;
  - the `EntryOf` type import.
- `install/kit-route.test.ts`:
  - the reach-line helpers and the two Task 1 cases;
  - the independent follower, the path-exists check, and the seven-scenario matrix with its count case.

## Decisions Made

- A block carrier's ownership is asked through the block rule only, the rule the refresh writes on, so a FAIL's remedy is always true. Suppose a user appends text to a CLAUDE.md that install created. The file entry no longer holds, but the block does. The doctor then FAILs with "re-run install.js", and the re-run does refresh that block.
- The pointer constants were moved, not duplicated. There is one authority for each sentinel.
- The path-exists assertion covers the pointers and KIT_ROUTE, not the whole kit AGENTS.md. A probe of a fresh install found 17 backticked tokens in AGENTS.md that are commands, globs or state names, not files in the target (for example `node install/install.js`, `plans/*`, `install/README.md`). The plan's named paths (`AGENTS.md`, `.grugops/install.json`, `<kitRoot>/roles/orchestrator.md`) are all asserted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The block sentinels were in the doctor's temporal dead zone**
- **Found during:** Task 1
- **Issue:** CLAUDE_OPEN/CLOSE and COPILOT_OPEN/CLOSE were declared below the `--check` early exit. The doctor's block rule needs them.
- **Fix:** The block from CLAUDE_OPEN to PI_PROMPT_TEXT was moved above the doctor, the same treatment isSymlink got in plan 29.2-04. No copy is left.
- **Files modified:** install/install.ts, install/install.js
- **Committed in:** eaeddd64

**2. [Rule 2 - One authority] ensureBlock's span match became ownBlockSpans**
- **Found during:** Task 1
- **Issue:** The doctor needs the same "install's own unedited block" answer the refresh uses. A second inline copy would let the two drift apart, which is brief §2.3.
- **Fix:** ownBlockSpans is a function declaration that both call. ensureBlock's behaviour is unchanged: all 34-28 block rows pass.
- **Committed in:** eaeddd64

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 one-authority).
**Impact on plan:** None writes anything new. The doctor stays read-only.

## Issues Encountered

- `human-notes.txt` was already modified in the working tree. It is not this plan's file, so it was left unstaged and untouched.
- One invalid mutation run (m3) is recorded above. m3b replaces it.

## Not covered (recorded, not fixed)

- Documentation of the per-host doctor lines is left to plan 34-30.
- Live host behaviour stays `UNKNOWN - verify` until the human re-runs 34-UAT.md test 2 (D-25 point 4). Windows is not claimed (D-25).

## Known Stubs

None.

## Threat Flags

None. The doctor reads three more carrier paths in the target, all through readUserFile (T-34-77 mitigated: a FIFO, a directory or an oversized file is a WARN with no verdict). It writes nothing. T-34-76 is mitigated by the per-host lines, the matrix and m1 to m4. No package was installed (T-34-SC).

## User Setup Required

None.

## Next Phase Readiness

`--check` now tells the truth about every supported host's route to the Orchestrator after a scripted install, which is the remedy AGENTS.md's STOP rule names. Plan 34-30 can document the reach lines.

## Self-Check: PASSED

- FOUND: install/install.ts, install/install.js, install/kit-route.test.ts
- FOUND on HEAD: eaeddd64, 6b9aaa74 (`git rev-list --count 781de478..HEAD` = 2)
- `ownBlockSpans` is defined once in install.ts and called by ensureBlock and carrierFinding. `KIT_ROUTE_CARRIERS` is gone from install.ts.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-10*
