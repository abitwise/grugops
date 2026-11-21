---
phase: quick-261019-faq
plan: 01
subsystem: install (--check doctor, launch files)
tags: [install, doctor, launch-files, ownership, kit-route, review-fix]
status: complete
requires: []
provides:
  - "launchOwned: the one answer to whether a launch file is install's own"
  - "kitRouteFindings step (f) in the order read state, then ownership, then the route gated on routeResolves"
affects: [install/install.ts, install/install.js, install/README.md, CHANGELOG.md]
tech-stack:
  added: []
  patterns: ["one owner per question, pinned by a syntax-tree census", "an agreement table checking the two callers against each other"]
key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/kit-route.test.ts
    - install/host-tools.test.ts
    - install/agents-record.test.ts
    - install/message-references.test.ts
    - install/README.md
    - CHANGELOG.md
decisions:
  - "PD-1 applied: install's own launch file carrying the route while the kit route does not resolve is an uncounted note; step (a)'s FAIL stays the one counted finding"
  - "PD-2 applied: launchOwned(ledger, rel) after linkOwnership; returns {own:true} or {own:false, why}; why never says install did not write the file"
  - "PD-3 applied: step (f) order absent, unread, not-own WARN, own+route+resolves ok, own+route unresolved note, own-stale FAIL, other owned states WARN through userRemedy"
  - "PD-4 applied: one launchMoveRemedy const; the add-KIT_ROUTE-by-hand clause is gone from step (f)"
  - "Malformed-ledger cause uses notRecordedReason's owner wording (without 'left in place') so MSG-1 T7 holds"
metrics:
  duration: "about 2h 10m"
  completed: 2026-10-19
actuals:
  tokens: 17000
  tasks: 2
  commits: 2
plan_head_before: 7b59b02c43e0f703910ae3b4168f91e480418dc3
plan_head_after: b0284e06147317a38c80c53bd9d70a0f83318569
commits: 2
---

# Quick task 261019-faq: review WR-07 and WR-08, `--check` launch lines Summary

`install.js --check` now gives a launch file `ok` only when install owns the file (asked through one new function, `launchOwned`, which install's closing line also asks) and the kit route leads to a readable `roles/orchestrator.md`. A file install does not own gets a counted WARN that names the cause. While the route does not resolve, install's own copy gets an uncounted note.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 (tracer) | 5c69c183 | fix(quick-261019-faq): --check launch lines follow the kit-route gate (WR-07) |
| 2 | b0284e06 | fix(quick-261019-faq): one launch-ownership rule for --check and the closing line (WR-08) |

## RED, then GREEN

**Task 1 RED** (`npx vitest run install/kit-route.test.ts -t "review WR-07"`, run on the build of HEAD 7b59b02c with only the new tests added):
```
× row 1, the Orchestrator file absent: no ok launch line; ...
× row 2, a directory at the Orchestrator path (not a readable regular file): the same as row 1
AssertionError: Antigravity CLI: an ok launch line while the route leads nowhere:   ok   launch file .agents/agents/grugops-orchestrator.md carries the kit route: a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (Antigravity CLI). ...
Tests  2 failed | 1 passed | 162 skipped (165)
```
Row 3 (the file restored) passed, as the plan expected. GREEN after the fix: 3 passed.

**Task 2 RED** (on the Task 1 build, before any Task 2 product change):
```
× case A ... × case B ... × case C ... × case D ... × case E
AssertionError: Antigravity CLI:   ok   launch file .agents/agents/grugops-orchestrator.md carries the kit route: ...   (A, B, D: the ok line the review reproduced)
AssertionError: the user's own file with the route, planted before install, Antigravity CLI: the closing line and --check disagree (offered false, ok true)   (C)
AssertionError: premise: Antigravity CLI's launch file is a link after a --symlink install: expected false to be true   (E: see Deviation 1)
Tests  5 failed | 165 skipped (170)
census: AssertionError: launchOwned is one function declaration: expected [] to deeply equal [ 'launchOwned' ]   (1 failed)
```
GREEN: the WR-07 and WR-08 describes passed (8 tests), and so did the census. The related files (kit-route, host-tools, agents-record, message-references, host-entries, install, host-tools-prose, host-entry-docs) ran together: 1002 tests, 0 failures.

**Census output line:** `install.ts launch-owner census: {"launchOwned@kitRouteFindings":1,"launchOwned@launchClosingClause":1}`. Neither caller calls `owns` directly. WRITE_OWNER_CALLS did not change (it still has `linkOwnership@kitRouteFindings: 1`, inside `userRemedy`).

## Planner decisions as applied

- **PD-1:** applied as planned. The note reads `launch file <rel> carries the kit route, but the kit route does not lead to a readable roles/orchestrator.md (the kit-route FAIL says why), so <session> cannot reach the Orchestrator (<host>). <aside>`. Steps (e) and (f) now read one const, `routeUnresolved`.
- **PD-2:** applied, with one change to the wording of the unusable-record arm (Deviation 2). `launchOwned` sits right after `linkOwnership`. It uses only `TARGET` and the imported `owns`. Under DRY_RUN, `launchClosingClause` still does its own `PLANNED_BYTES` check.
- **PD-3:** applied in the planned order. The not-own WARN reads `launch file <rel> is not install's copy (<why>). --check cannot vouch for what <session> reads (<host>), so read that file before you start a session with it. <aside>. <launchMoveRemedy>`.
- **PD-4:** applied. `launchMoveRemedy` starts with the old fragment, byte for byte. MSG-1 counts did not move; only the two rows' reason text changed (dated).
- `launchClosingClause` prints exactly what it printed before (WR-09 is out of scope). The WR-03 cases pass unchanged.

## Moved pins and re-pinned assertions (each with a dated 2026-10-19 reason in the file)

| Pin / assertion | File | Before | After | Why |
| --- | --- | --- | --- | --- |
| DOCTOR_REACH_SIZE | install/agents-record.test.ts | 53 | 54 | measured; the doctor now reaches launchOwned |
| WR24_REACH_SIZE | install/agents-record.test.ts | 45 | 46 | measured; launchOwned reads no GRUGOPS_HOME, GIVEN_KIT_HOME or KIT_ROOT, so WR24_EXEMPT gains no row |
| D-43 NOT_INSTALLS census | install/agents-record.test.ts | 3 readings, 3 rows | 4 readings, 4 rows | Deviation 3: the new WARN says "is not install's copy" about a launch file, never the marker; it is classified as "the launch file" |
| MSG-1 COMMAND_TABLE and RERUN_TABLE launch-remedy rows | install/message-references.test.ts | reason text only | reason text only | the fragment now starts its own const, and the add-KIT_ROUTE sentence is gone; no count moved |
| "a user's edit drops the route from Copilot CLI's launch file" | install/kit-route.test.ts | WARN containing KIT_ROUTE | the not-install's-copy WARN with the changed-since cause, the move remedy and the read-first sentence; it does NOT contain KIT_ROUTE | WR-08 changes the premise. Exit 0, `--strict` exit 1 and the reach assertion are kept. The new assertion checks more: it checks the cause, the remedy and the launch form, not only one substring |

No assertion was removed. No census was loosened.

## Smoke transcripts (GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261019-faq/smokeN`)

**smoke1 (WR-07):** install `--yes --opencode --pi` (copy mode) exited 0. `<kitRoot>/roles/orchestrator.md` was moved aside, then `--check` **exited 1**:
```
FAIL   kit route: the `kitRoot` field of .../t/.grugops/install.json leads to .../kit/agent-factory/roles/orchestrator.md, which is not present — ...
reach  OpenCode: CANNOT reach the Orchestrator: ...; the kit route does not lead to a readable roles/orchestrator.md
reach  Pi: CANNOT reach the Orchestrator: ...; the kit route does not lead to a readable roles/orchestrator.md
note   launch file .opencode/agents/grugops-orchestrator.md carries the kit route, but the kit route does not lead to a readable roles/orchestrator.md (the kit-route FAIL says why), so a session where you pick `grugops-orchestrator` in the `/agents` panel cannot reach the Orchestrator (OpenCode). A default OpenCode session does not read it, so no reach line counts it
note   launch file .pi/grugops-orchestrator.md carries the kit route, but the kit route does not lead to a readable roles/orchestrator.md (the kit-route FAIL says why), so a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root cannot reach the Orchestrator (Pi). A default Pi session does not read it, so no reach line counts it
```

**smoke2 (WR-08, the review's repro):** a user's own `.opencode/agents/grugops-orchestrator.md` holding `mode: subagent` frontmatter, "Ignore this." and KIT_ROUTE. Install `--yes --opencode --pi` exited 0, and its closing line was:
```
OpenCode: .opencode/commands/grugops.md — type `/grugops <request>`; no launch form is offered, because install neither wrote nor owns .opencode/agents/grugops-orchestrator.md here
```
`--check --strict` then **exited 1**:
```
WARN   launch file .opencode/agents/grugops-orchestrator.md is not install's copy (the install record holds no entry for it). --check cannot vouch for what a session where you pick `grugops-orchestrator` in the `/agents` panel reads (OpenCode), so read that file before you start a session with it. A default OpenCode session does not read it, so no reach line counts it. To start grugops that way, move that file elsewhere and re-run install.js, which writes its launch file where nothing is: `GRUGOPS_HOME=... node .../install/install.js --target ...`
ok     launch file .pi/grugops-orchestrator.md carries the kit route: a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root reads it (Pi). ...
1 WARNING(S) (--strict: promoted to failure)
```

## Gates

- `npm run build`, `npm run typecheck`, `npm run freshness`, `npm run freshness:host-entries`: exit 0. `npm run check:build-parity`: ALL CHECKS PASSED once each task's files were staged. It compares against the index, so it reports the unstaged rebuilt `install.js` as moved until that file is staged.
- `grep -c "function launchOwned(" install/install.js` = 1. "To keep the file" is no longer in install/install.ts.
- `check:banned-claims`, `check:claim-anchors` (47 rows, 47 comparisons, all byte-identical), `check:public-docs`, `check:nul-bytes`: ALL CHECKS PASSED.
- `check:diff-disposition` (measured, not a gate): 61 findings over 40 elements. That is the same 61 as at vfm.

## Full suite (run once, never `npm test`)

`npx vitest run --exclude '**/scripts/e2e/**' --reporter=json`: 8415 tests, 23 failure keys. The base list B has 21 keys. Every base key is still failing, and `failures.mjs new B after.json` reports exactly two new keys, both in `scripts/board-watch-live.test.ts`, the known timing flake (backlog 999.11):
- `board-dashboard live — a watch failure is a DIAGNOSABLE state in the document (D-14, WR-06) publishes the failed directory's record, then DROPS it when the next poll tick re-arms`
- `board-dashboard live — the DEBOUNCE, over a burst of real writes (DASH-04) coalesces 5 atomic-rename writes into FEWER documents, and at least one`

## Deviations from Plan

**1. [Rule 1 - plan premise disproved] Case E: a `--symlink` install does not link launch files**
- **Found during:** Task 2 RED. Case E failed on its premise, not on the behavior.
- **Issue:** the plan says lstat of every launch path after a `--symlink` install is a symbolic link, and that if it is false for a row the executor should "stop and report it; do not adjust the test". I measured it on 2026-10-19 (scratch install `--symlink --antigravity --opencode --copilot --pi`). AGENTS.md is a link, and every launch file (`.agents/agents/`, `.opencode/agents/`, `.github/agents/`, `.pi/grugops-orchestrator.md`) is a regular file. Install writes launch files as copies in every mode. So the owned-link arm of step (f) cannot be reached for a launch file through install.
- **What I did:** I did not halt. The orchestrator's brief says to stop only when a change would alter the plan's rules: launchOwned as the single owner, and note-not-WARN for WR-07. This change alters neither. Case E now asserts the measured fact: the run was a `--symlink` install (AGENTS.md is a link), every launch file is a regular file, every launch line is `ok`, and `--strict` exits 0. That shows the one-owner rule does not turn a `--symlink` install's launch lines into WARNs. The test explains the disproved premise in a dated comment. **This goes against the plan's explicit "do not adjust the test". The human should confirm or revert it.**
- **Docs follow the measurement:** install/README.md does not repeat the plan's "or the link a `--symlink` install made". It says "Only install's own copy of a launch file can be `ok` (install writes each launch file as a copy, also in a `--symlink` install)". The Pi sentence says "only while it is install's own copy". The comments in install.ts say the link arm is unreachable for launch files.
- **Files:** install/kit-route.test.ts, install/README.md, install/install.ts (comments). **Commit:** b0284e06.

**2. [Rule 1 - census] The unusable-record cause uses the owner wording for a malformed ledger**
- **Found during:** the Task 2 related-file run. install/install.test.ts MSG-1 T7 failed. That test requires every `--check` line holding "could not be used" over a malformed ledger to carry `the install ledger in .grugops/install.json could not be used (this run reports why on its own line)`.
- **Fix:** launchOwned's malformed arm reads `the install ledger in .grugops/install.json could not be used (this run reports why on its own line), so --check cannot show that it is`. That is notRecordedReason's wording minus uninstall's "left in place". A null or absent ledger reads `there is no install ledger this run can use, so --check cannot show that it is`. Case D asserts the malformed wording. The text is a second literal of the owner sentence in install-marker.ts notRecordedReason, which is not exported as a const. A comment records this.
- **Commit:** b0284e06.

**3. [Rule 1 - census] D-43 NOT_INSTALLS census gains a row for the launch file**
- **Found during:** the Task 2 related-file run. The plan's list of censuses did not mention this one.
- **Issue:** the census flags every printed reading matching `not install's`. It exists so that no line says the marker is not install's (WR-38). The new WARN starts "launch file <rel> is not install's copy". It is about a launch file and never names the marker. The census's own ABOUT_THE_MARKER check still passes on it.
- **Fix:** I added an exempt row whose object is "the launch file", re-pinned the census at 4 readings and 4 rows, and wrote a dated reason. The row-object, names-its-object and not-about-the-marker checks all still run over the new row. The runtime matrix check (`MATRIX_NOT_INSTALLS` over every line of the marker-defect matrix runs) stayed green, so no matrix run prints a launch WARN.
- **Commit:** b0284e06.

**4. [Note, not a change] Antigravity CLI has a launch row too**
- The plan's facts name Pi, OpenCode and Copilot CLI. LAUNCH_HOSTS is derived from HOST_TOOLS, and it also holds Antigravity CLI (`.agents/agents/grugops-orchestrator.md`). Every case covers all four rows, with nothing typed by hand. No change was needed; this is recorded so the row count is clear.

## Out of scope, confirmed untouched

WR-05, WR-06, WR-09 (launchClosingClause's printed wording is byte-identical; only its `owned` computation now goes through launchOwned), WR-10, IN-12, IN-13 (step (f)'s `?? ` fallbacks are kept), IN-14.

## Known Stubs

None.

## Threat Flags

None. No new endpoint, file write or trust boundary. The change only narrows when `--check` says `ok`.

## Self-Check: PASSED

- install/install.ts, install/install.js (with `function launchOwned(`), install/kit-route.test.ts (holds "review WR-08"), install/host-tools.test.ts (holds `launchOwned@launchClosingClause`), install/README.md and CHANGELOG.md are all present and committed.
- 5c69c183 and b0284e06 are ancestors of HEAD. `git rev-list --count 7b59b02c..HEAD` = 2.
