---
phase: 34-model-effort-dial-pi-support
plan: 27
subsystem: installer
tags: [install, doctor, pi, kit-route, AGENTS.md, DOC-1, G-34-2, D-26, typescript, vitest]

requires:
  - phase: 34-26
    provides: the round-3 installer files (install.ts closings) this plan builds on
provides:
  - "D-26 recorded as the human's decision (the marker route), from plan 34-27 Task 1"
  - "KIT_ROUTE and carriesKitRoute(text) in install/host-tools.ts, the one authority for the route sentence"
  - "COPILOT_PTR (and so PI_PROMPT_TEXT, the Pi /grugops template) ends with KIT_ROUTE"
  - "kitRouteFindings in the doctor: --check follows marker kitRoot to roles/orchestrator.md and asks each route carrier (the Pi template in this plan)"
  - "install/kit-route.test.ts: an independent route follower over an empty target and a separate kit home"
  - "The kit's AGENTS.md Kit vs state rule carries KIT_ROUTE, with C-28-015 and the 34-27 disposition rows"
affects: [34-28 (CLAUDE_PTR, refresh of existing carriers, user's-own notes), 34-29 (per-host doctor lines and class test), 34-30 (documentation), 34-verification, 34-UAT test 2 re-run]

actuals:
  tokens: 13300      # chars/4 over the realized diff 05f1e46e..af21ed83 (53106 chars)
  tasks: 3
  commits: 3
plan_head_before: 05f1e46ebcc4ced22c194a7c19c5f57d4ba23f61
plan_head_after: af21ed83448919665ab4a806b918c04d90a8731b

tech-stack:
  added: []
  patterns:
    - "A pointer names a route through repository state (the marker's kitRoot field), never an install-time value, so committed pointer text is identical on every machine"
    - "The doctor follows the route the way an agent does (read the record, read the file under it) instead of comparing records with each other"
    - "Route carriers are a list the doctor iterates; ownership of a carrier comes from owns() over the doctor's own ledger read"

key-files:
  created:
    - install/kit-route.test.ts
    - docs/audit/29-style-dispositions/34-27.md
  modified:
    - .planning/phases/34-model-effort-dial-pi-support/34-CONTEXT.md
    - install/host-tools.ts
    - install/host-tools.js
    - install/install.ts
    - install/install.js
    - install/host-tools.test.ts
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts
    - AGENTS.md
    - docs/audit/28-claim-registry.md

key-decisions:
  - "D-26 is the marker route, chosen by the human (\"marker\", all five points as written); the orchestrator obtained the answer from the human on 2026-10-10 before this executor was dispatched"
  - "The doctor's kit-route section is not gated on the earlier FAIL checks: it asks a different question (does the record an agent reads lead to the Orchestrator), so a FAIL above it does not answer it"
  - "The FAIL for install's own route-less carrier says to remove the file and re-run install.js, because install leaves an existing template untouched until plan 34-28 adds the refresh; 're-run install.js' alone would have been a false remedy (DOC-1)"
  - "The route follower treats a backticked token holding `…` (a pattern for every path under a directory) or `<` (a placeholder) as naming no single file, and a token with no `/` and no file extension (`kitRoot`) as a field name"

patterns-established:
  - "KIT_ROUTE_CARRIERS: a list of {rel, what} the doctor's kitRouteFindings walks; plan 34-29 extends it to every carrier of every registry host"

requirements-completed: [PI-02, HOST-01]

coverage:
  - id: D1
    description: "D-26 recorded in 34-CONTEXT.md as the human's decision, with no PENDING text"
    verification:
      - kind: other
        ref: "grep -n \"^- \\*\\*D-26:\\*\\*\" 34-CONTEXT.md && ! grep -n \"D-26:\\*\\* PENDING\" 34-CONTEXT.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "After a scripted install with a separate kit home, Pi's /grugops template carries KIT_ROUTE and every path it names resolves: agent-factory/ paths under the marker's kitRoot, the others under the target"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#the Pi template carries KIT_ROUTE, and every path it names resolves"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#the route follower: the marker's kitRoot is absolute, outside the target, and <kitRoot>/roles/orchestrator.md is a regular file"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) (unchanged; its expectedTemplate reads the Copilot line, which now carries the route)"
        status: pass
    human_judgment: false
  - id: D3
    description: "--check follows the route: ok for the route and the template; FAIL for install's own route-less template and for a route that does not resolve; WARN for a user's own route-less template (quoting KIT_ROUTE) and for an absent template"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#--check follows the route / a user's edit drops the route / install's own template from an earlier install / a route that does not resolve / an absent template"
        status: pass
    human_judgment: false
  - id: D4
    description: "The kit's AGENTS.md Kit vs state rule carries KIT_ROUTE once, names the KIT= line and the minimal copy install, keeps the STOP and SC2 sentences; C-28-015 updated in the same commit; every docs gate passes"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#the kit route in AGENTS.md (plan 34-27, D-26)"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#the AGENTS.md install copies into an empty target carries KIT_ROUTE, and the route it names resolves"
        status: pass
      - kind: other
        ref: "node scripts/check-kit-refs.js; npm run check:claim-anchors; check:diff-disposition; check:banned-claims; check:imperative-lexicon; check:public-docs; node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "Pi itself, live, follows the template's words to the Orchestrator after a scripted install"
    requirement: PI-02
    verification: []
    human_judgment: true
    rationale: "Live host behaviour is UNKNOWN - verify until the human re-runs 34-UAT.md test 2 on Pi (D-25 point 4); no test here runs Pi."

duration: 57min
completed: 2026-10-10
status: complete
---

# Phase 34 Plan 27: The kit route for Pi (D-26, G-34-2) Summary

**After a scripted install whose kit lives in a separate kit home, Pi's `/grugops` template and the kit's AGENTS.md now carry KIT_ROUTE. KIT_ROUTE points at the `kitRoot` field of `.grugops/install.json`, and that field leads to `<kitRoot>/roles/orchestrator.md`. `--check` now follows the route and reports on the Pi template, with ok, FAIL or WARN by ownership, where it used to print ALL CHECKS PASSED over an unreachable Orchestrator.**

## Performance

- **Duration:** 57 min, including one full-suite run of about 29 minutes and one install/ directory run of 9 minutes
- **Started:** 2026-10-10T07:51:32Z
- **Completed:** 2026-10-10T08:48:14Z
- **Tasks:** 3
- **Files modified:** 12 (2 created)

## Accomplishments

- **Task 1: D-26 recorded.** The human chose "marker" for the Task 1 `checkpoint:decision` (gate `blocking-human`) and approved all five points of D-26 as written. The orchestrator put the question to the human on 2026-10-10 and passed the answer to this executor at dispatch, so the executor did not stop at Task 1. The D-26 entry in 34-CONTEXT.md now reads "The marker route (human, 2026-10-10, plan 34-27 Task 1; ...)". The PENDING sentence and the "Planner's recommendation" framing are gone. The five points and the rejected alternative are kept. The Deferred section's "under D-26's recommendation" now reads "under D-26".
- **Task 2 (tracer): KIT_ROUTE, the pointer, the doctor, the follower test.**
  - `install/host-tools.ts`:
    - `KIT_ROUTE` holds the plan's sentence exactly, with the backticks and the `…` character.
    - `carriesKitRoute(text)` is true exactly when the text contains KIT_ROUTE.
    - Both have doc comments: KIT_ROUTE is the one authority for the route, it is fixed text (T-34-13), and it names no kit-home variable.
    - The module still imports nothing.
  - `install/install.ts`:
    - `COPILOT_PTR` is the start-here sentence, one space, then `KIT_ROUTE`, still on one line. PI_PROMPT_TEXT reuses it, so the Pi template carries the route.
    - The PI_PROMPT_TEXT comment says the template is pointer text that names the kit route (D-26), with no kit-root variable, no resolver slot, and no config, argv or environment value.
  - The doctor has a new `kitRouteFindings(marker, ledger, markerFile)` over `KIT_ROUTE_CARRIERS`. In this plan the list holds only the Pi template.
    - It first follows the marker's `kitRoot` to `roles/orchestrator.md` through readUserFile. A readable file gives an ok line that names the path. Anything else gives one FAIL that names the path and its state.
    - It then reads each carrier:
      - carries the route: ok;
      - no route, and install's own (`owns(..., "file")` answers owned): FAIL;
      - no route, and not install's own: WARN that quotes KIT_ROUTE as the sentence to add;
      - absent: WARN;
      - not readable: WARN that says no verdict was reached.
    - It runs after the ordered stat set and is not gated on DOC_FAILS.
  - `install/kit-route.test.ts` drives the committed install.js against an empty git target with a separate GRUGOPS_HOME. It has its own route follower: readFileSync, then JSON.parse, then `kitRoot`, then `lstat().isFile()` on the Orchestrator. That covers the premise, the follower, template reachability and five doctor rows.
- **Task 3: the kit's AGENTS.md.**
  - The last Kit vs state bullet, line 40, is still one physical line. In order it says: a Claude Code adapter names the kit root on its `KIT=` line; then KIT_ROUTE byte for byte; then, with no `.grugops/install.json` (the minimal copy install), the kit is this repository's own `agent-factory/`; then the STOP and re-run sentences, unchanged.
  - Lines 37-39 and the line-43 blockquote are untouched.
  - In the same commit, registry row C-28-015 got the new verbatim fourth line, and its mechanism now names KIT_ROUTE, writeMarker's `kitRoot`, `kitRouteFindings`, the follower test and the `KIT=` cross-check (D-03). The range stays 37-40.
  - `docs/audit/29-style-dispositions/34-27.md` has four rows under rule `34 D-26`, each with the C-28-015 companion.
  - New tests:
    - host-tools.test.ts checks that AGENTS.md carries KIT_ROUTE exactly once, inside Kit vs state, and still has the SC2 sentence.
    - kit-route.test.ts checks that the AGENTS.md copied into the target carries the route and that the route resolves.

## Task Commits

1. **Task 1: Decide D-26 (decision by the human, from the orchestrator)** - `236807db` (docs)
2. **Task 2 (tracer): KIT_ROUTE, the pointer, the doctor, the follower test** - `f0d4713e` (feat)
3. **Task 3: AGENTS.md route, C-28-015, dispositions, tests** - `af21ed83` (docs)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

`workflow.tdd_mode` is false and the round rules forbid a red commit. Each task is one green commit, and its RED run is recorded here.

**Task 2 RED.** KIT_ROUTE was added to host-tools.ts and built, and COPILOT_PTR was left unchanged.
- Command: `TMPDIR=/tmp/gd npx vitest run install/kit-route.test.ts`.
- Result: `Tests 6 failed | 2 passed (8)`.
- The template case failed with `AssertionError: the template does not carry the kit route: expected false to be true`.
- The five doctor cases failed because no `kit route` line was printed.
- The two premise and follower cases passed. The kit home holds the Orchestrator and the marker's kitRoot resolves, so the gap was only in the words.
- Semantic assessment: each target test ran and failed on its planned assertion, not in setup. RED is valid.

**Task 3 RED.** The AGENTS.md at HEAD was swapped in, then restored byte for byte (`cmp` ok).
- Result: `Tests 2 failed | 3 passed | 40 skipped (45)`.
- Failures: `KIT_ROUTE occurrences in AGENTS.md: expected +0 to be 1` and `the installed AGENTS.md does not carry the kit route: expected false to be true`.

**Tracer gate.** The mode is interactive with `end-of-phase`, and the verify is automated only. The Task 2 verify was re-run: `Test Files 3 passed (3)`, `Tests 59 passed | 403 skipped (462)`. Tracer verified end to end, then expanded.

## Mutation proofs

Each mutation was applied to the `.ts`, built, and run against kit-route.test.ts and host-tools.test.ts. Each was then restored from a saved copy and rebuilt. `cmp` confirmed install.ts/js and host-tools.ts/js equal the saved copies, and `git diff --quiet -- install/` reported CLEAN.

| Mutation | Result | Failed |
|---|---|---|
| m1: COPILOT_PTR without `+ KIT_ROUTE` | `Tests 3 failed \| 42 passed (45)` | the template case, the `--check` ok case, the user-edit WARN case |
| m2: install's own route-less carrier reported with docWarn instead of docFail | `1 failed` | "install's own template from an earlier install ... FAILs" |
| m3b: the route follow reads the marker file instead of `<kitRoot>/roles/orchestrator.md` | `Tests 1 failed \| 8 passed (9)` | "a route that does not resolve: --check FAILs naming the Orchestrator path" |
| m4: carriesKitRoute always true | `Tests 3 failed \| 42 passed (45)` | user-edit WARN, install's-own FAIL, and the host-tools exact-containment case |

The first m3 attempt (`read.state === "ok" || true`) did not compile, because the narrowed `never` failed in the else branch. Its test run used the stale m2 build, so that result is not counted. m3b replaces it.

## Regression gate (at the Task 3 tree, before its commit)

- `npm run build`: exit 0. `npm run check:build-parity`: `ALL CHECKS PASSED` (also after each commit). `npm run typecheck`: exit 0.
- `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**'` (Node v26.11.0):
  - ` Test Files  1 failed | 104 passed (105)`
  - `      Tests  1 failed | 7585 passed | 2 skipped (7588)`
  - The one red is the known local red: install/installer-fs-census.test.ts, `UNCLASSIFIED node:fs export openAsBlobSync` (Node 26 runtime).
- `PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts` (Node v24.12.0): `Test Files 1 passed (1)`, `Tests 24 passed (24)`.
- The docs gates all print ALL CHECKS PASSED: `node scripts/check-kit-refs.js` (Assertion 3 and SC2 pass unchanged, 26 marker sites), `check:claim-anchors` (47 rows, all byte-identical), `check:diff-disposition`, `check:banned-claims`, `check:imperative-lexicon`, `check:public-docs`, `check-foundation-guards.js`, `check:audit-register`, `check:residual-citations`, `check:nul-bytes`, `check:platform-shapes`, and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`.
- AGENTS.md is 8137 bytes (7729 before), well under Codex's 32 KiB cap.
- No Windows result is claimed (D-25).

## Files Created/Modified

- `install/host-tools.ts` / `.js`: KIT_ROUTE and carriesKitRoute.
- `install/install.ts` / `.js`: the import, COPILOT_PTR with the route, the PI_PROMPT_TEXT comment, `KIT_ROUTE_CARRIERS`, `kitRouteFindings`, and its call in doctor().
- `install/kit-route.test.ts` (new): the follower and the nine route cases.
- `install/host-tools.test.ts`: the AGENTS.md route describe (3 cases).
- `install/mode-census.test.ts`, `install/path-spelling-census.test.ts`: the installer test-file count goes from 29 to 30, each with its reason.
- `AGENTS.md`: the Kit vs state bullet at line 40.
- `docs/audit/28-claim-registry.md`: C-28-015's verbatim block and mechanism.
- `docs/audit/29-style-dispositions/34-27.md` (new): four disposition rows.
- `.planning/phases/34-model-effort-dial-pi-support/34-CONTEXT.md`: D-26 as decided.

## Decisions Made

- The orchestrator obtained D-26 from the human before dispatch: "marker", all five points as written.
- The kit-route section is not gated on earlier FAILs, because it answers a different question. When the kit is missing, the ordered stat set FAILs on `KIT_ROOT/roles/orchestrator.md` and the route check FAILs too, on its own `kit route` line. No existing test pins an exact failure count.
- An unbound or malformed marker gives no ownership (`readLedger(null)`), so a route-less carrier is then a WARN. It is never a FAIL claimed from a record uninstall would not use.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug (DOC-1)] The FAIL remedy for install's own route-less template**
- **Found during:** Task 2
- **Issue:** The plan's wording, "The pointer is install's own from an earlier install; re-run install.js", would be false today. writePiPromptTemplate leaves any existing file untouched, so a plain re-run does not change the template. The refresh of unedited carriers is plan 34-28 (D-26 point 2).
- **Fix:** The FAIL says to remove the file and re-run install.js, which writes the current template where nothing is. Plan 34-28 can shorten it once the refresh exists.
- **Files modified:** install/install.ts, install/install.js
- **Committed in:** f0d4713e

**2. [Rule 3 - Blocking] The path-spelling census flagged `kitRoot === ""` as a raw comparison of a recorded path**
- **Found during:** Task 2
- **Fix:** A truthiness test (`if (!kitRoot)`), the same form the kit-root cross-check uses for the same field. The recorded path is only joined and read, never compared.
- **Committed in:** f0d4713e

**3. [Rule 3 - Blocking] The installer test-file census counts**
- **Found during:** Task 2 (the new kit-route.test.ts)
- **Fix:** INSTALL_TEST_FILE_COUNT (mode-census) and TEST_SCANNED_FILE_COUNT (path-spelling-census) go from 29 to 30, each with a reason. The new file has no chmod call, no mode expectation (its ledger edit uses contentRecord, which records no mode), and no raw comparison of a recorded path.
- **Committed in:** f0d4713e

**4. [Rule 2 - Missing critical] Test rows beyond the plan's behaviour list**
- **Found during:** Task 2
- **Issue:** Must-have truth 5 requires a FAIL for install's own template without the route, and a FAIL for a route that does not resolve. The behaviour list tested only the ok and WARN rows.
- **Fix:** Three more cases: the FAIL for install's own template, staged as an earlier install's bytes with the ledger's content record matching them; the FAIL for a route that does not resolve; and the WARN for an absent template. m2 and m3b prove the two FAIL rows.
- **Committed in:** f0d4713e

---

**Total deviations:** 4 auto-fixed (1 bug, 2 blocking, 1 missing critical).
**Impact on plan:** None changes what install writes beyond the plan. The remedy wording stays true until plan 34-28 adds the refresh.

## Issues Encountered

- `human-notes.txt` was already modified in the working tree when this plan ran. It is not this plan's file, so it was left unstaged and untouched.
- One invalid mutation (m3) is noted above. It was replaced by m3b.

## Not covered (recorded, not fixed)

- These are left to later plans, per the plan's sibling list:
  - CLAUDE_PTR (the CLAUDE.md block);
  - the refresh of existing install-owned carriers;
  - the user's-own AGENTS.md note (plan 34-28);
  - the doctor's per-host lines and the per-host class test (plan 34-29);
  - the documentation, including the packaging rule's "repo-relative pointer-text" note and install/README.md's `UNKNOWN - verify` Pi paragraph (plan 34-30).
- Live Pi behaviour stays `UNKNOWN - verify` until the human re-runs 34-UAT.md test 2 (D-25 point 4).
- Windows is not claimed (D-25).

## Known Stubs

None.

## Threat Flags

None. The doctor reads one more path, `<marker kitRoot>/roles/orchestrator.md`, through readUserFile. That read is bounded and refuses FIFOs and links (DC-3). It is the residual of T-34-71 (accepted) and the mitigation of T-34-72 (mitigated here).

## User Setup Required

None.

## Next Phase Readiness

On POSIX, Pi's `/grugops` and the kit's AGENTS.md now name a route that resolves after a scripted install, and `--check` follows it for the Pi template. The plan is ready for 34-28, which covers CLAUDE_PTR, refreshing existing carriers and the user's-own notes.

## Self-Check: PASSED

- FOUND: install/kit-route.test.ts, docs/audit/29-style-dispositions/34-27.md, install/host-tools.ts, install/install.ts, AGENTS.md, docs/audit/28-claim-registry.md
- FOUND on HEAD: 236807db, f0d4713e, af21ed83 (`git rev-list --count 05f1e46e..HEAD` = 3)
- Acceptance checks:
  - `export const KIT_ROUTE` is on one line (host-tools.ts:84).
  - KIT_ROUTE appears in install.ts at the import, COPILOT_PTR and the doctor.
  - `git grep -c kitRoot AGENTS.md` = 1.
  - "resolved by the adapter only" is absent.
  - `git show --stat af21ed83` lists AGENTS.md and docs/audit/28-claim-registry.md.
  - Build parity passes.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-10*
