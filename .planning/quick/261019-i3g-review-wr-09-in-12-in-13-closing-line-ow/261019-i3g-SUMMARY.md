---
phase: quick-261019-i3g
plan: 01
subsystem: install (closing notes, --check launch files, host registry type)
tags: [install, doctor, launch-files, closing-notes, provenance, types, review-fix]
status: complete
requires: []
provides:
  - "launchOwned builds the whole not-own reason; --check step (f) and launchClosingClause print it verbatim"
  - "LEDGER_UNUSABLE_CAUSE: the one spelling of the unusable-ledger cause"
  - "invocationNotesLine: the provenance line built from the launch forms the run gave"
  - "HostTool = HostToolFields & LaunchPair; LaunchHost; launchSession/launchInvoke overloads"
affects: [install/install.ts, install/install.js, install/install-marker.ts, install/install-marker.js, install/host-tools.ts, install/host-tools.js, install/README.md, CHANGELOG.md]
tech-stack:
  added: []
  patterns: ["one place for a reason, printed verbatim by every caller", "a type-level pair pinned by @ts-expect-error rows plus a mutation proof", "a two-sided exact oracle per registry row"]
key-files:
  created: []
  modified:
    - install/install-marker.ts
    - install/install-marker.js
    - install/install.ts
    - install/install.js
    - install/host-tools.ts
    - install/host-tools.js
    - install/kit-route.test.ts
    - install/host-tools.test.ts
    - install/agents-record.test.ts
    - install/mode-census.test.ts
    - install/README.md
    - CHANGELOG.md
decisions:
  - "PD-1 applied: launchOwned's not-own answer is {own:false, reason}; reason = `<rel> is not shown to be install's copy (<cause>)`; the doctor prints `launch file ${reason}. --check cannot vouch ...`, the closing clause `; no launch form is offered, because ${reason}`; no cause names --check"
  - "PD-2 applied: LEDGER_UNUSABLE_CAUSE exported from install-marker.ts; notRecordedReason's malformed arm prints the same bytes"
  - "PD-3 applied: the real-run unusable-record arm is reproduced with no hook (an empty .grugops/ at mode 555), gated on CHMOD_SKIP"
  - "PD-4 applied: the invocation-forms sentence is printed on every run; the launch part only when the run gave a form, and each clause only when a given form has that property (needs human confirmation)"
  - "PD-5 applied: a discriminated union of the two existing fields, not a single launch field; overloads on launchSession/launchInvoke; appendable throws in step (f)"
  - "PD-6 applied: one CHANGELOG ### Fixed entry covers WR-09 and IN-12; IN-13 changes no output"
metrics:
  duration: "about 1h 35m"
  completed: 2026-10-19
actuals:
  tokens: 19600
  tasks: 3
  commits: 4
plan_head_before: f577731a7697d1cec3386352cc529c6cd354ec31
plan_head_after: 33de910ee7f16a68b515ec260dffaaafb493ee78
commits: 4
---

# Quick task 261019-i3g: review WR-09, IN-12, IN-13 (closing-line ownership reason, provenance line, launch pair type) Summary

When install's closing line gives no launch form, it now names the cause the install record shows, using the same reason `--check` prints. The provenance line at the end of the closing notes is built from the launch forms the run actually gave. The registry type now makes it a compile error for a row to have a launch file without a launch form, or a form without a file.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 (tracer) | fa3f8d34 | fix(quick-261019-i3g): the closing line gives the cause launchOwned found (WR-09) |
| 2 | 54ec382a | fix(quick-261019-i3g): the closing provenance line names only the forms given (IN-12) |
| 3 | 33de910e | fix(quick-261019-i3g): the launch pair is one type; step (f) has no silent fallback (IN-13) |

`commits: 4` in the frontmatter was measured with `git rev-list --count f577731a..HEAD`. It includes **fe31ce69** `chore(test): cap vitest at 2 workers and a 1536 MB worker heap`. The coordinator or human committed that on main while Task 3 was running; it is not this plan's commit, and this plan did not touch `vitest.config.ts`.

## RED, then GREEN

**Task 1 RED** (HEAD f577731a built, with only the new and re-pinned tests added; `-t "review WR-09|WR-03|review WR-08"`). The tracer is 8 failed | 4 passed:
- Re-pinned WR-03 cases: "the user's own file ..." failed on "neither wrote"; "Pi's launch write refused" failed on the fixed reason.
- WR-08 cases A, B and D: A failed on the fixed closing reason. B and D failed on the old WARN head, `is not install's copy (... , so --check cannot show that it is)`.
- New case 1 (unwritable record): the premises passed (exit 3, no marker, launch files created), then it failed on `... because install neither wrote nor owns .agents/agents/grugops-orchestrator.md here`.
- New cases 2 and 3: failed on the fixed reason.
- Census: `launchClosingClause holds no reason text of its own` failed, `expected [ Array(1) ] to deeply equal []`.

**Task 1 GREEN:** these related files ran together: kit-route, host-tools, agents-record, mode-census, message-references, install, host-tools-prose and closing-claims. Result: 1014 passed, 1 skipped (a skip that was there before), 0 failed.

**Task 2 RED** (on the Task 1 build): 8 failed. These are the all-agents case, every HOST_TOOLS row installed alone (Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi), and the own-file case. All 8 fail on exact equality with the oracle line.

**Task 2 GREEN:** host-tools, kit-route, message-references, closing-claims, host-tools-prose, host-entry-docs, agents-record and install all passed, 1024 tests in total. The first GREEN attempt failed for GitHub Copilot CLI alone, on a two-sided check written into the plan's test design (Deviation 1).

**Task 3 RED** (on the Task 2 build):
- census: `(a) a ?? default on launchSession or launchInvoke: expected [ Array(1) ] to deeply equal []`. Measured: (a) 1 (`launchSession(host) ?? ...`), (b) 1 (`cls.why ?? "a re-install appends nothing to it"`), (c) 0.
- `npm run typecheck`:
  ```
  install/host-tools.test.ts(1190,5): error TS2578: Unused '@ts-expect-error' directive.
  install/host-tools.test.ts(1192,5): error TS2578: Unused '@ts-expect-error' directive.
  install/host-tools.test.ts(1206,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  install/host-tools.test.ts(1207,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  ```

**Task 3 GREEN:** these 12 files ran together: host-tools, kit-route, host-entries, agents-record, message-references, scripts/generate-host-entries, scripts/host-entries-freshness, install, host-tools-prose, host-entry-docs, closing-claims and mode-census. Result: 1126 passed, 1 skipped, 0 failed.

**IN-13 mutation proof:** I temporarily changed the row type to `HostToolFields & { readonly launchAgent: string | null; readonly launchForm: LaunchForm | null }`. `tsc -p tsconfig.tests.json` then gave 5 errors: the same 4 as the RED list above, plus `LaunchPair is declared but never used`. After I reverted, typecheck gave 0 errors.

## Planner decisions as applied

- **PD-1:** applied as planned. launchOwned computes the cause in four arms (in the existing order) and builds the reason in one template. It uses no helper closure, because a first version with a local `not` arrow moved DOCTOR_REACH_SIZE from 54 to 55. I rewrote it rather than re-pin, so DOCTOR_REACH_SIZE and WR24_REACH_SIZE did not move.
- **PD-2:** applied. `notRecordedReason({state:"malformed"}, "file")` was compared byte for byte with the old literal and is identical.
- **PD-3:** applied. Case 1 makes `.grugops/` mode 0o555 (tagged `mode-census: access-denial`) and restores it to 0o755 in a `finally` (tagged `mode-census: restore`). It is gated on CHMOD_SKIP, which prints its reason.
- **PD-4:** applied as written. **The human should confirm** that the invocation-forms sentence stays on every run. The task text says to print the line only when a launch form was printed; this is the narrower reading.
- **PD-5:** applied, with one deviation: CarrierClass is distributed per state (Deviation 2). `appendable` throws an Error that names kitRouteFindings and the path. The last arm is a `const unhandled: never` check that throws.
- **PD-6:** applied. The CHANGELOG has one `### Fixed` entry after the 261019-faq entry.

## Moved pins (each with a dated 2026-10-19 reason in the file)

| Pin | File | Before | After | Why |
| --- | --- | --- | --- | --- |
| NOT_OFFERED const | kit-route.test.ts | fixed "neither wrote nor owns" text | `notOffered(h, why)` plus cause consts WHY_NO_ENTRY, WHY_CHANGED, WHY_UNUSABLE (no `--check` tail), WHY_NO_LEDGER | WR-09 |
| WR-03 own-file case | kit-route.test.ts | the real run and DRY_RUN both gave the fixed reason | real run WHY_NO_ENTRY, DRY_RUN WHY_NO_LEDGER; retitled | the two runs establish different causes |
| WR-03 Pi refused write | kit-route.test.ts | fixed reason | WHY_NO_ENTRY | WR-09 |
| WR-08 case A closing line | kit-route.test.ts | fixed reason | WHY_NO_ENTRY | WR-09 |
| expectNotOwnWarn head | kit-route.test.ts | `launch file <rel> is not install's copy (<why>)` | `launch file <rel> is not shown to be install's copy (<why>). ` | stricter: now also checks the ". " that follows; all negative checks kept |
| D-43 NOT_INSTALLS census | agents-record.test.ts | 4 readings, 4 rows | 3 readings, 3 rows | the launch WARN no longer says "not install's"; the walk found no new reading; every check kept |
| TAG_KIND_COUNTS | mode-census.test.ts | access-denial 15, restore 24 | 16, 25 | measured by the census's own failure message: kit-route.test.ts case 1. The stale "has neither" comment about kit-route.test.ts was corrected too |
| provenance pin (all agents) | host-tools.test.ts | two `toContain` checks | exact oracle equality plus two-sided clause checks | IN-12 |

Not moved: DOCTOR_REACH_SIZE (54), WR24_REACH_SIZE (46), LAUNCH_OWNER_CALLS, MSG-1 tables, and INSTALL_TEST_FILE_COUNT. No census counts launchSession or launchInvoke FunctionDeclarations, so the overload signatures did not trip one. No assertion was removed or weakened.

## Smoke transcripts (GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261019-i3g/smokeN`)

**smoke1a:** read-only `.grugops/`, then `--yes --pi --opencode --codex`. Exit 3.
```
  Codex CLI: the install record could not be read after this run (see the lines above) — type `$grugops <request>`, or pick it from `/skills`
  OpenCode: the install record could not be read after this run (see the lines above) — type `/grugops <request>`; no launch form is offered, because .opencode/agents/grugops-orchestrator.md is not shown to be install's copy (there is no install ledger this run can use)
  Pi: the install record could not be read after this run (see the lines above) — start Pi at the repository root and type `/grugops <request>`; no launch form is offered, because .pi/grugops-orchestrator.md is not shown to be install's copy (there is no install ledger this run can use)
```
**smoke1b:** `--pi` install (exit 0), then a line appended to `.pi/grugops-orchestrator.md`, then a DRY_RUN. Exit 0.
```
  Pi: DRY_RUN, nothing written (the would- lines above name what a real run writes) — start Pi at the repository root and type `/grugops <request>`; no launch form is offered, because .pi/grugops-orchestrator.md is not shown to be install's copy (the install record has an entry for it, but the file there was changed or replaced since install wrote it)
```
**smoke2:** `--codex` alone (exit 0):
```
  These invocation forms come from each host's documentation, and grugops has not run them on a live host (UNKNOWN - verify).
```
`--pi` alone (exit 0):
```
  These invocation forms come from each host's documentation, and grugops has not run them on a live host (UNKNOWN - verify). Of the launch forms given here, a form marked verified live was run by a human on the live host on the date shown; whether a session started with a launch form then follows the kit route is UNKNOWN - verify on every host.
```

**Task 3 byte check:** I captured a fresh all-agents install's stdout and its `--check` stdout on the Task 2 build: 109 and 86 lines, both exiting 0. Scratch root, repository path and the render temp-dir suffix were normalized. Two captures before the change were identical to each other. After the change, `diff -r` against them was empty. I ran it again after the last comment reflow, and it was still empty.

## Gates

- `npm run build`, `npm run typecheck`, `npm run freshness` (76 committed .js fresh): exit 0 after each task. `npm run freshness:host-entries`: 7 entries, 0 byte differences.
- `npm run check:build-parity`: ALL CHECKS PASSED after each task, with its files staged.
- `check:banned-claims`, `check:claim-anchors`, `check:public-docs`, `check:nul-bytes`: ALL CHECKS PASSED. No claim anchor moved.
- `check:diff-disposition` (measured, not a gate): **61 findings over 40 elements**, the same as the 61 baseline.
- Done greps: the code (comments excluded) holds no "neither wrote nor owns", no "could not be used (this run reports why on its own line)" in install.ts, no "grugops has not run the others", no `launchSession(host) ??` and no `cls.why ??`. `export const LEDGER_UNUSABLE_CAUSE` appears once.

## Full suite (run once, never `npm test`)

`npx vitest run --exclude '**/scripts/e2e/**' --reporter=json` ran once, uncapped: it had started before the coordinator's vitest cap landed, and the coordinator said to let it finish. It covered the final product state, with Task 3 still unstaged; the only edit after it was a comment reflow, which was rebuilt and re-checked with freshness, host-tools-prose and host-tools tests, and the byte check.
- 8429 tests: 8407 passed, 20 failed, 2 pending.
- `failures.mjs` self-test: a missing report exits 2, and a zero-test report exits 2.
- `failures.mjs new B after.json` printed **no new keys** (exit 0).
- B has 21 keys. 20 still fail. The one that passed this time is the known flake `scripts/board-watch-live.test.ts :: ... the EVENT path ... delivers an atomic-rename edit in less than one poll period, and no faster than the debounce` (backlog 999.11).

## Deviations from Plan

**1. [Rule 1 - test design] The two-sided "verified live" check asks for the clause, not the bare words**
- **Found during:** Task 2 GREEN.
- **Issue:** the plan's oracle text for a not-verified form says "a form not marked verified live ...". So a GitHub Copilot CLI-alone run, whose only form has no verifiedLive date, gives a line that contains "verified live". That breaks the plan's check "contains 'verified live' exactly when some given row has a date". The exact oracle equality passed.
- **Fix:** the check is now asked of each clause: "a form marked verified live" exactly when a given form has a date, and "not marked verified live" exactly when a given form has none. A third check says "verified live" appears only when a form was given. That is stricter than the plan's single check. The product text is the plan's text.
- **Files:** install/host-tools.test.ts. **Commit:** 54ec382a.

**2. [Rule 3 - type] CarrierClass is one union member per state**
- **Found during:** Task 3 build.
- **Issue:** the plan's shape `{state: Exclude<CarrierState,"user">; why: null}` keeps a union-typed discriminant in one member. TypeScript does not narrow that member away, so the `const unhandled: never` check failed to compile (TS2322).
- **Fix:** the non-`user` member is a mapped type distributed over `Exclude<CarrierState, "user">`. Each state gets its own member with `why: null`. The meaning is the same as the plan's, and classifyCarrier compiles unchanged.
- **Commit:** 33de910e.

**3. [Rule 1 - avoided a pin move] launchOwned has no local helper**
- My first version used a local `not` arrow, which added a function to the doctor's reach (DOCTOR_REACH_SIZE 54 to 55). I replaced it with one cause variable and one return template rather than re-pin. No pin moved.

**4. A commit that is not this plan's falls inside the measured range**
- fe31ce69 (vitest cap) landed on main between Task 2 and Task 3, so `commits: 4` counts it. This plan's commits are fa3f8d34, 54ec382a and 33de910e.

## Out of scope, confirmed untouched

WR-05 (Copilot CLI launch stated as fact), WR-06 (verified-live host set typed by hand), WR-10 (no host version in verifiedLive), IN-14 (verifiedLive definition) and the hs8 leftovers were not touched. The README still writes "verified live by a human on 2026-10-18" by hand (WR-06). The older 261019-faq CHANGELOG entry still says "The WARN says why the file is not install's copy"; it describes that release step and was left as written.

## Known Stubs

None.

## Self-Check: PASSED

- Files modified: all 12 in files_modified are in the three commits. No other file was touched; `vitest.config.ts` belongs to fe31ce69.
- `git merge-base --is-ancestor` holds for fa3f8d34, 54ec382a and 33de910e on HEAD.
- `.temp/` is empty. No branch was made and nothing was pushed.
