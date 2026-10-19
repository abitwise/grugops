---
phase: quick-261019-faq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - install/install.ts
  - install/install.js
  - install/kit-route.test.ts
  - install/host-tools.test.ts
  - install/agents-record.test.ts
  - install/message-references.test.ts
  - install/README.md
  - CHANGELOG.md
autonomous: true
requirements: [WR-07, WR-08]

estimate:
  tokens: 200000
  raw_tokens: 200000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "WR-07: when the kit route does not resolve (the kitRoot's roles/orchestrator.md is absent, or is there but not a readable regular file), `install.js --check` prints no `ok` line for any launch file. Each launch file install owns that carries the route gets an uncounted `note` that names the unresolved route and says the session cannot reach the Orchestrator. The run still exits 1 on step (a)'s route FAIL. Once the file is back, every launch line is `ok` again and `--check --strict` exits 0. Checked for every registry row that has a launch file."
    - "WR-08: a file at a launch path that install does not own gives a counted WARN whatever it holds, and never `ok`. That covers the user's own file with the route, the user's own file without it, install's copy edited since (route kept or dropped), and any launch file when the install ledger cannot be used. The WARN names the launch form (launchSession), tells the user to read the file before starting a session with it, and gives the move-it-away-and-re-run-install.js remedy. `--check --strict` exits 1. Checked for every registry row that has a launch file."
    - "WR-08: one function, launchOwned in install/install.ts, decides whether a launch file is install's own. kitRouteFindings step (f) calls it once and launchClosingClause calls it once. Neither function calls owns directly. A syntax-tree census pins this."
    - "For every launch row and each tested state (fresh install, user's own file with the route, user's own file without it, install's copy edited with the route kept, then re-installed): install's closing line offers the launch form exactly when `--check`'s launch line is `ok`. Each state's expected value is also asserted, so the agreement cannot hold vacuously."
    - "The new WARN never states a cause the run did not establish. Its reason comes from what owns found: the record could not be used, install's recorded file was changed or replaced since, or the record holds no entry for the path. It never says install did not write the file."
    - "launchClosingClause's printed wording is byte-identical to before (WR-09 is out of scope). The existing WR-03 cases pass unchanged."
    - "No census is loosened. Each moved pin carries a dated reason (2026-10-19, quick task 261019-faq). The full non-e2e suite runs once, at the end. Against the base list, only scripts/board-watch-live.test.ts keys may be new."
  artifacts:
    - path: install/install.ts
      provides: "launchOwned (the one launch-ownership answer); kitRouteFindings step (f) in the order: read state, then ownership, then route gated on routeResolves; launchClosingClause asking launchOwned"
      contains: "function launchOwned("
    - path: install/install.js
      provides: "committed build of install.ts (freshness and build-parity gates)"
      contains: "function launchOwned("
    - path: install/kit-route.test.ts
      provides: "RED-first WR-07 and WR-08 cases over every launch row derived from HOST_TOOLS; the closing-line and --check agreement table"
      contains: "review WR-08"
    - path: install/host-tools.test.ts
      provides: "syntax-tree census: launchOwned called only at kitRouteFindings x1 and launchClosingClause x1; no direct owns call in either"
      contains: "launchOwned@launchClosingClause"
    - path: install/README.md
      provides: "the launch-files bullet, the closing-notes paragraph and the Pi section describe the one ownership rule"
    - path: CHANGELOG.md
      provides: "[Unreleased] ### Fixed entry for both findings"
  key_links:
    - from: install/install.ts kitRouteFindings step (f)
      to: install/install.ts launchOwned
      via: "the not-install's-copy WARN arm, asked before the route test"
      pattern: "launchOwned\\(ledger, rel\\)"
    - from: install/install.ts launchClosingClause
      to: install/install.ts launchOwned
      via: "the offered or not-offered launch clause"
      pattern: "launchOwned\\("
    - from: install/install.ts kitRouteFindings step (f) route arm
      to: install/install.ts kitRouteFindings step (a) routeResolves
      via: "ok only when routeResolves, else an uncounted note"
      pattern: "routeResolves"
---

<objective>
Fix two findings from .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md in `install.js --check`'s launch-file lines (kitRouteFindings step (f)):

- **WR-07.** Step (f) prints `ok launch file <rel> carries the kit route` even when the kit route leads to no readable `roles/orchestrator.md`. Step (e) applies the `routeResolves` gate; step (f) does not. The rule was fixed in one arm only.
- **WR-08.** Two places answer "may the user start a session with this launch file", by different rules. `--check` says `ok` for any file at the launch path that holds the route sentence, whoever wrote it. Install's closing line offers the launch form only when install owns the file. On Pi, `--check` would endorse someone else's system-prompt file and print the exact `pi --append-system-prompt` command, the one that skips Pi's project-trust check.

Purpose: the `--check` verdict is the user's proof. A green `ok` must never be given for a session that cannot reach the role files, or for a file install did not write.

Output: launchOwned plus the reordered step (f) in install/install.ts, with the rebuilt install/install.js; RED-first tests over every launch row; one owner census; moved reach-size pins; the docs and the CHANGELOG entry. WR-05, WR-06, WR-09, WR-10, IN-12, IN-13 and IN-14 are out of scope. In particular, launchClosingClause's wording does not change (WR-09), and step (f)'s `?? ` fallbacks stay (IN-13).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md
@.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-SUMMARY.md
@.planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-SUMMARY.md

## Facts checked while planning (2026-10-19, at HEAD 7b59b02c)

- **Step (f)** is the last loop of `kitRouteFindings` (install/install.ts, about lines 2034-2063). It calls `classifyCarrier(rel, ledger, readAt)`. That function returns `route` from `carriesKitRoute(read.text)` before it asks anything about ownership (about line 1797). `routeResolves` is a `let` set in step (a) (about line 1892) only on the arm where `readUserFile(<kitRoot>/roles/orchestrator.md)` answers `ok`. Every other arm calls `docFail`, so a counted FAIL always sits behind `routeResolves === false`. Step (e) uses `const via = routeResolves ? v.carriers : []` and pushes the text "the kit route does not lead to a readable roles/orchestrator.md".
- **The arm where kitRoot is missing** cannot be reached through a usable marker. `installMarkerProblems` (install/install-marker.ts, about line 1618) refuses any marker whose `kitRoot` is not a non-empty absolute path. So the WR-07 tests cover the two read states of a recorded kitRoot: the file absent, and something that is not a readable regular file (a directory) at that path.
- **launchClosingClause** (install/install.ts, about line 7659) computes `owned` with two direct `owns(..., "file")` calls:
  - under DRY_RUN: `PLANNED_BYTES.has(rel) || owns(PREVIOUS_LEDGER, ...)`;
  - otherwise: `ledgerAfter !== null && ledgerAfter.state === "ok" && owns(ledgerAfter, ...)`.
  It is declared below the `--check` early exit. `PLANNED_BYTES`, `PREVIOUS_LEDGER` and `DRY_RUN` are module consts the doctor must never reach (they are in their temporal dead zone under `--check`).
- **owns** (install/install-marker.ts:1390) returns `{owned: true, ...}`, or `{owned: false, recorded, reason}`. `recorded` is true when the ledger holds an entry for the path but the path no longer holds its content or mode. Its `reason` texts end with "; left in place", which is uninstall wording, so `--check` must not print them. It answers not owned for any ledger whose state is not `ok`.
- **linkOwnership** (install/install.ts:1526) is the model to follow. It is a function declaration above the doctor that uses only `TARGET` and the imported `owns`.
- **install/host-tools.ts has no import and must gain none.** host-entries-freshness mirrors it as part of the generator's closure. So the new helper lives in install/install.ts.
- **Censuses that will see the change:**
  - install/agents-record.test.ts `DOCTOR_REACH_SIZE` (53, about line 5337) and `WR24_REACH_SIZE` (45, about line 6088). Both count the install.ts functions the doctor reaches. A new function the doctor calls should move each by 1. Measure it; do not assume it.
  - install/host-tools.test.ts `WRITE_OWNER_CALLS` (about line 993) pins `linkOwnership@kitRouteFindings: 1`. That call is inside the `userRemedy` closure and must stay the only one.
  - install/message-references.test.ts MSG-1: COMMAND_TABLE row (about line 339) and RERUN_TABLE row (about line 395), each holding the fragment that starts "To start grugops that way, move that file elsewhere and re-run install.js, which writes its launch file where nothing is: `". The REFERENCE regex (about line 260) matches `above`, `below`, `next/previous line` and `the X line about`. A new message that uses none of these words adds no REFERENCE row.
- **Existing launch-line tests** (install/kit-route.test.ts, about lines 3275-3448). Helpers: `LAUNCH_HOSTS` (derived from HOST_TOOLS), `launchLineOf`, `launchRelOf`, `launchPath`, `dropRouteFromLaunch`, `ownLaunchWithoutRoute`, `blockLaunch`, `closingLineOf`, `NOT_OFFERED`, `formText`, `installed`, `scratchRow`, `check`, `strictCheck`, `followRoute`, `reachVerdict`, `countedRouteLines`. The case "a user's edit drops the route from Copilot CLI's launch file: a counted WARN quoting KIT_ROUTE" will move under WR-08 (see Task 2). The malformed-ledger pattern to copy is IN-24 (about line 2407), which uses `withLedger` from install/ledger.test-support.ts.
- **A fresh scratch row per test.** `installed()` and `scratchRow()` each create a new target and a new kit home under the test's ROOT, so deleting the kit's `roles/orchestrator.md` in one case touches no other case. The existing case "a route that does not resolve" (about line 279) does exactly this with `rmSync(orchestrator)`.

## Planner decisions (Claude's discretion; record each in the SUMMARY)

- **PD-1 (WR-07 level).** Install's own launch file carrying the route while `routeResolves` is false gets an **uncounted `note`**, not a WARN. The doctor's counting rule is one counted finding per cause. Step (a)'s FAIL is already that finding, and step (e) prints the same condition as uncounted `reach` lines for the same reason. Exit stays 1 because of that FAIL.
- **PD-2 (one owner, its shape).** `launchOwned(ledger: LedgerRead | null, rel: string)` is a function declaration in install/install.ts, directly after linkOwnership.
  - It uses only `TARGET` and the imported `owns`, and nothing declared below the `--check` early exit.
  - It returns `{ own: true }` or `{ own: false, why }`. `why` comes from the cause found, in three arms:
    - ledger null or its state not `ok`: the install record could not be used;
    - owns answers `recorded`: install's recorded file was changed or replaced since it wrote it;
    - otherwise: the install record holds no entry for the path.
  - `why` never says install did not write the file. That keeps WR-09's fabricated-cause class out of the new code.
  - launchClosingClause reads only `.own` and keeps its wording byte for byte. Its DRY_RUN `PLANNED_BYTES` arm stays in launchClosingClause, because a planned write is install-run state the doctor never has.
- **PD-3 (step (f) order).** Read state first, then ownership, then the route:
  1. absent: the uncounted note, as now;
  2. unread: the WARN with NO VERDICT, as now. Ownership cannot be judged for a file that was not read.
  3. not launchOwned: the counted WARN (WR-08), whatever the file holds;
  4. own and `route` and routeResolves: ok;
  5. own and `route`, route not resolved: the PD-1 note;
  6. own-stale: the FAIL, as now;
  7. any other state of an owned file (install's own `--symlink` link without the route, or an owned file install cannot refresh): the existing WARN, still through `userRemedy` (so linkOwnership's remedy stays for the link).
- **PD-4 (remedy).** The by-hand clause that tells the user to add KIT_ROUTE to a launch file they keep (the keep-the-file clause of the current `otherwise` text) leaves step (f). Under WR-08, editing a launch file makes it not install's, so adding the sentence can never clear the line, and naming it would name a remedy that does not clear the finding. The one remaining remedy is the move-and-re-run sentence. It becomes one local const in kitRouteFindings, built in one template with `doctorInstallCommand()`, like `ownStaleRemedy`. Its head is the existing fragment's text byte for byte. The not-owned WARN prints it directly; it cannot be install's link, so linkOwnership is not asked. Arm 7 passes the same const as `userRemedy`'s `otherwise`. Expected MSG-1 effect: no count moves. Update the two rows' reason text with a dated note. If the census reports anything else, classify it as the census header says, never to pass.

## Prose rules for every edit (product strings, TS comments, tests, docs)

- **Clear voice** in install messages and docs (CLAUDE.md voice discipline: this is a safety and verification surface).
- No planning ID (WR-07, a quick-task ID or a decision ID) in any product **string**; MSG-1 (a) refuses it. Comments may cite them, as existing comments do.
- **Rule A and Rule B** (install/host-tools-prose.test.ts) scan `.ts` comment paragraphs and markdown paragraphs:
  - Rule A: no count word before a host noun.
  - Rule B: no block may name every sequential host but one. The sequential short names are derived from HOST_TOOLS.
- **No "above" or "below"** in the new messages: name the line instead (for example "the kit-route FAIL").
- Never claim a live-host result. Whether a launched session follows the kit route stays `UNKNOWN - verify`, as the docs already say.

## Testing approach (the human's standing rule)

- While coding, run only the related files: install/kit-route.test.ts (filtered with `-t` during RED/GREEN), install/host-tools.test.ts, install/agents-record.test.ts, install/message-references.test.ts, install/host-entries.test.ts, install/install.test.ts, install/host-tools-prose.test.ts and install/host-entry-docs.test.ts. Every test drives the COMMITTED install/install.js, so run `npm run build` before each run.
- NEVER run `npm test`: it starts the live, paid e2e lane.
- Run the full suite exactly once, at the end of Task 2: `npx vitest run --exclude '**/scripts/e2e/**'`, with a JSON report. Compare it against B (below). Only `scripts/board-watch-live.test.ts` keys may be new; that file is the known timing flake (backlog 999.11).
- Scratch: `S="${TMPDIR:-/tmp}/grugops-261019-faq"`, then `mkdir -p "$S"`.
  - Copy `failures.mjs` from `${TMPDIR:-/tmp}/grugops-261018-vfm/failures.mjs`, or from the hs8 scratch dir. If neither exists, re-create it from the spec in .planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-PLAN.md (the "Execution: one task per executor dispatch" section).
  - Run its self-test before relying on it: `keys` on a missing report exits 2, and `keys` on `{"numTotalTests":0,"testResults":[]}` exits 2.
  - `B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt`.
- **Every scratch run of install.js or uninstall.js** sets both GRUGOPS_HOME and HOME to directories under `$S`. Without them a run overwrites the real ~/.grugops kit. Write nothing under `.temp/`.
- **Commits.** Work sequentially on main. Create no branch and push nothing. Stage files by name, never with `git add -A`. One commit per task. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Moved pins

A moved pin gets a dated reason line ("Re-pinned 2026-10-19 by quick task 261019-faq (review WR-08): ...") in the file's existing comment style, naming what moved it. No assertion is removed or weakened. Where an expectation changes because WR-08 changes the premise, the new assertion must discriminate at least as well as the old one, and the SUMMARY lists it.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): the launch-file line obeys the kit-route gate (WR-07), end to end through --check</name>
  <files>install/kit-route.test.ts, install/install.ts, install/install.js</files>
  <read_first>
    - install/install.ts: the kitRouteFindings header comment (about lines 1840-1887) and the function body, steps (a), (e) and (f) (about lines 1888-2064).
    - install/kit-route.test.ts: helpers (about lines 58-140), the "a route that does not resolve" case (about line 279), and the D-06 launch block (about lines 3275-3390).
    - .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md, section WR-07.
  </read_first>
  <behavior>
    - New describe in install/kit-route.test.ts, titled "launch lines follow the kit-route gate (quick task 261019-faq, review WR-07)". Every row uses `installed()` (a fresh install for every agent) and loops over LAUNCH_HOSTS.
    - Row 1, the Orchestrator file absent: save the bytes of `followRoute(target).orchestrator`, then `rmSync` it.
      - `check` exits 1.
      - The route FAIL naming that path is present.
      - For every LAUNCH_HOSTS row, `launchLineOf` starts with `  note`, contains the unresolved-route phrase, and does not start with `  ok`.
      - No line of the run starts with `ok` and has a message beginning `launch file `.
      - No FAIL or WARN line has a message beginning `launch file `, so the launch lines add no counted finding.
    - Row 2, a directory at that path (an unread state, not absent): the same assertions as Row 1.
    - Row 3, the restore: write the saved bytes back. `strictCheck` exits 0 and every LAUNCH_HOSTS launch line starts with `  ok`. This shows the gate is routeResolves and not something broader.
    - RED first: run the new describe on the current HEAD build. Row 1 and Row 2 must fail on the `ok` launch line, matching the review's repro. Record that output for the SUMMARY.
  </behavior>
  <action>
    1. Write the behavior cases first, build (`npm run build`), and run `npx vitest run install/kit-route.test.ts -t "review WR-07"`. Rows 1 and 2 must fail because the launch lines read `ok`, and Row 3 passes. Save the failing output.
    2. In install/install.ts kitRouteFindings, add one local const for the unresolved-route phrase that step (e) already pushes ("the kit route does not lead to a readable roles/orchestrator.md"). Step (e) and step (f) then both read that const, so one place owns the wording of one condition.
    3. In step (f), split the `route` arm on `routeResolves` (per PD-1):
       - `route` and routeResolves: the existing ok line, unchanged;
       - `route` and not routeResolves: a `docReport("note", ...)`. The message starts `launch file ${rel} carries the kit route, but ` followed by the shared phrase, then says `${session}` cannot reach the Orchestrator, then appends the existing `aside`. It does not use the words above or below, and it names no planning ID.
       Leave every other arm of step (f) as it is in this task (Task 2 reorders them).
    4. Update the kitRouteFindings header comment's (f) paragraph to say the `route` arm is ok only when step (a)'s route resolved, and otherwise an uncounted note, because step (a)'s FAIL is the counted finding behind it. Follow the comment style of the existing paragraphs and the prose rules.
    5. `npm run build`. Re-run the filtered tests (all three rows GREEN), then the whole of install/kit-route.test.ts and install/message-references.test.ts. If MSG-1 reports the new note's fragments as unclassified, do not reword the message to dodge the census. Classify the fragments as the census header directs, move the counts with a dated reason, and name the change in the SUMMARY.
    6. Scratch smoke (GRUGOPS_HOME and HOME under `$S/smoke1`), in the vfm PLAN's command shape: install `--yes --opencode --pi` with `INSTALL_MODE=copy GRUGOPS_SRC="$PWD"`. Read the marker's kitRoot with node, move `<kitRoot>/roles/orchestrator.md` aside, then run `--check`. Exit 1 is expected, so do not chain on it. Capture the launch lines for the SUMMARY.
    7. Commit: `fix(quick-261019-faq): --check launch lines follow the kit-route gate (WR-07)`, staging install/install.ts, install/install.js and install/kit-route.test.ts by name.
  </action>
  <verify>
    <automated>npm run build && npm run check:build-parity && npm run typecheck && npm run freshness && npx vitest run install/kit-route.test.ts install/message-references.test.ts install/host-tools.test.ts</automated>
  </verify>
  <done>
    - With the kit's roles/orchestrator.md absent or not a readable file, no launch file reads `ok`. Each launch row has an uncounted note naming the unresolved route, and the run exits 1 on the route FAIL alone.
    - Restored, every launch row is `ok` and `--strict` exits 0.
    - Steps (e) and (f) read one const for the unresolved-route wording.
    - The RED transcript is saved for the SUMMARY.
    - The committed install/install.js is fresh. The commit is on main.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: one launch-ownership rule, launchOwned, for --check step (f) and install's closing line (WR-08); docs and CHANGELOG</name>
  <files>install/install.ts, install/install.js, install/kit-route.test.ts, install/host-tools.test.ts, install/agents-record.test.ts, install/message-references.test.ts, install/README.md, CHANGELOG.md</files>
  <read_first>
    - install/install.ts: linkOwnership (about lines 1511-1534), step (f) and the userRemedy, ownStaleRemedy and absentRemedy closures (about lines 1954-2064), launchClosingClause and its comment (about lines 7651-7668).
    - install/install-marker.ts: owns (about lines 1389-1418).
    - install/host-tools.test.ts: `installSource`, `enclosingFunction`, `allNodes` (about lines 890-910) and the WRITE_OWNER_CALLS census (about lines 980-1030), the pattern for the new census.
    - install/agents-record.test.ts: DOCTOR_REACH_SIZE (about line 5337) and WR24_REACH_SIZE (about line 6088), with their re-pin comment style.
    - install/message-references.test.ts: the COMMAND_TABLE and RERUN_TABLE launch-remedy rows (about lines 339 and 395) and the count comments (about lines 496-520 and 640-680).
    - install/README.md: the closing-notes paragraph (about lines 566-576), "The launch files" bullet (about lines 679-690), and the Pi section's trust warning (about lines 925-928).
    - CHANGELOG.md: the end of `[Unreleased] ### Fixed` (the bullet just before `### Security`, about line 582).
    - .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md, sections WR-08 and WR-09 (WR-09 only to know what stays unchanged).
  </read_first>
  <behavior>
    - New describe in install/kit-route.test.ts, titled "--check and the closing line ask one launch-ownership rule (quick task 261019-faq, review WR-08)". Every loop is over LAUNCH_HOSTS.
    - A new helper `ownLaunchWithRoute(target, h)`, next to `ownLaunchWithoutRoute`, writes the user's own file at row h's launch path holding a line of the user's own instructions and then KIT_ROUTE.
    - RED case A: plant the user's own file with the route at every launch path, then install for every agent.
      - Every row's launch line starts with `  WARN`.
      - Each line contains launchSession(h), the read-the-file-first sentence and the move-and-re-run remedy, and its reason is the no-entry cause.
      - No `ok` launch line appears.
      - `check` exits 0 and `strictCheck` exits 1.
      - Each row's closing line from that install ends with NOT_OFFERED and the launch path, as in the WR-03 cases.
    - RED case B: install for every agent, then append one line to install's copy at every launch path, keeping the route. Every launch line is a WARN whose reason is the changed-since cause, and `strictCheck` exits 1.
    - Case C, the agreement table. The states are: fresh install; user's own file with the route planted before install; user's own file without the route planted before install (ownLaunchWithoutRoute); install's copy edited with the route kept, then install run again.
      - For each state and every LAUNCH_HOSTS row, take the closing line from the last install run and the launch line from a `check` after it.
      - Assert `closing line ends with "; or " + launchInvoke(h)` equals `launch line starts with "  ok"`.
      - Also assert the expected value per state: true only for the fresh install.
    - Case D, the record cannot be used: install for every agent, then make the ledger malformed (copy IN-24's withLedger pattern). Every launch line is a WARN, never `ok`, and its reason is the unusable-record cause.
    - Case E, the owned-link arm: install for every agent with `--symlink`.
      - Premise, asserted per row: lstat of the launch path is a symbolic link. If the premise is false for a row, stop and report it; do not adjust the test.
      - `strictCheck` exits 0 and every launch line starts with `  ok`.
    - The census, in install/host-tools.test.ts (new describe "census: install.ts asks one owner of whether a launch file is install's own (quick task 261019-faq, review WR-08)"):
      - launchOwned is declared once, as a function declaration;
      - every reference is a direct call;
      - the calls are exactly `launchOwned@kitRouteFindings: 1` and `launchOwned@launchClosingClause: 1`;
      - there is no direct `owns` call whose enclosing function is kitRouteFindings or launchClosingClause.
    - RED first: cases A, B, C and D and the census fail on the current build; case E passes. Save the failing output.
  </behavior>
  <action>
    1. Write the behavior cases and the census first, `npm run build`, and run `npx vitest run install/kit-route.test.ts -t "review WR-08"` and `npx vitest run install/host-tools.test.ts -t "launch file is install's own"`. Save the RED output. Case A must show the `ok` launch line the review reproduced.
    2. Add `launchOwned` to install/install.ts per PD-2, directly after linkOwnership. Give it a header comment in the house style: it is THE ONE ANSWER to "is the launch file at rel install's own here", its two callers, and why its reason never says install did not write the file. Follow the prose rules.
    3. Rewrite step (f)'s arms in the PD-3 order.
       - The new not-own arm is a `docWarn`. Its message starts `launch file ${rel} is not install's copy (` followed by `why`. It then says that `--check` cannot vouch for what `${session}` reads (with `${host.name}`), and tells the user to read that file before starting a session with it. Then come `aside` and the move-and-re-run const of PD-4.
       - It holds no KIT_ROUTE and no "above" or "below".
       - Introduce the PD-4 const, keeping its head byte-identical to the existing fragment. Pass it as `userRemedy`'s `otherwise` in arm 7, and drop the keep-the-file clause there.
       - Rewrite the header comment's (f) paragraph to state the new order and the one-owner rule.
    4. In launchClosingClause, compute `owned` with exactly one launchOwned call: the DRY_RUN `PLANNED_BYTES.has(rel)` test OR launchOwned over `DRY_RUN ? PREVIOUS_LEDGER : ledgerAfter`, taking `.own`. Nothing it prints changes (WR-09 is out of scope). Update its comment and agentClosingLines' comment to name launchOwned.
    5. `npm run build`, then GREEN: the filtered runs, then the related files listed in the context. Act on each census that moves:
       - **DOCTOR_REACH_SIZE and WR24_REACH_SIZE.** Re-pin each to the measured value, with a dated reason naming launchOwned. Confirm launchOwned reads neither GRUGOPS_HOME nor KIT_ROOT, so WR24_EXEMPT gains no row.
       - **WRITE_OWNER_CALLS.** It must stay unchanged.
       - **MSG-1.** Per PD-4. Update the two rows' reason text, dated.
       - **The Copilot CLI case** ("a user's edit drops the route ... a counted WARN quoting KIT_ROUTE"). Its premise changes under WR-08. Re-pin it, dated: the line is the not-install's-copy WARN with the changed-since cause and the move-and-re-run remedy, and it no longer holds KIT_ROUTE. Keep its exit 0 and `--strict` exit 1 assertions and its reach assertion.
       - **Any other existing assertion that WR-08 moves** (for example in install/host-entries.test.ts or the IN-21 and IN-24 cases): re-pin it the same way. Never delete it. Add the file to the commit and name it in the SUMMARY.
    6. Docs. Clear voice; Rule A and Rule B.
       - install/README.md "The launch files" bullet: replace the `ok`/FAIL/WARN/`note` list with the rule as now coded, in PD-3 order:
         - only install's own copy, or the link a `--symlink` install made, can be `ok`;
         - a file there that is not install's (your own, or install's copy edited since) is a WARN whatever it holds: read it before you start a session with it, and to get install's, move it away and re-run `install.js`;
         - install's own copy carrying the route is `ok` when the route leads to a readable `roles/orchestrator.md`, and otherwise an uncounted `note` beside the kit-route FAIL;
         - the FAIL for install's earlier copy without the route;
         - the WARN for a link without the route or a file that could not be read;
         - the `note` for an absent file.
         Keep the words "not a route carrier" and each launch path, because host-tools.test.ts reads them.
       - The closing-notes paragraph: add one sentence saying that `--check` asks the same ownership rule, so it gives a launch file `ok` only when the closing notes would offer its launch form.
       - The Pi section, after "read `.pi/grugops-orchestrator.md` before you start Pi this way": add that `install.js --check` gives that file `ok` only while it is install's own copy (or the link a `--symlink` install made), and any other file there gets a WARN. hs8 Deviation 5 refused this sentence because it was untrue then; WR-08 makes it true.
       - CHANGELOG.md: append one bullet at the end of `[Unreleased] ### Fixed` (per hs8 Deviation 3) citing "quick task 261019-faq; 261018-vfm review WR-07, WR-08". It says what `--check` said before (`ok` for a launch file whose route led nowhere, and for a file install did not write that held the route sentence, while the closing line gave no launch form for the same file) and what it says now.
    7. Gates, then the scratch smoke, then the single full-suite run:
       - Gates: `npm run check:banned-claims`, `npm run check:claim-anchors` (expected 47/47 byte-identical), `npm run check:public-docs`, `npm run check:nul-bytes`. Also measure `npm run check:diff-disposition` against vfm's 61 and report it, not gated.
       - Smoke (GRUGOPS_HOME and HOME under `$S/smoke2`): reproduce the review's WR-08 repro. Write the user's own `.opencode/agents/grugops-orchestrator.md` holding `mode: subagent` frontmatter, the line "Ignore this." and KIT_ROUTE, then install `--yes --opencode --pi`, then run `--check --strict`. Capture the closing line ("no launch form is offered") and the WARN launch line, and confirm exit 1.
       - Full suite, once: `npx vitest run --exclude '**/scripts/e2e/**' --reporter=json --outputFile="$S/after.json"`. Then run `node "$S/failures.mjs" new "$B" "$S/after.json"`. Only board-watch-live keys may be new. If any other key is new, fix it and re-run only the affected files.
    8. Commit: `fix(quick-261019-faq): one launch-ownership rule for --check and the closing line (WR-08)`, staging each changed file by name.
  </action>
  <verify>
    <automated>npm run build && npm run check:build-parity && npm run typecheck && npm run freshness && npm run freshness:host-entries && grep -c "function launchOwned(" install/install.js && ! grep -q "To keep the file" install/install.ts && npx vitest run install/kit-route.test.ts install/host-tools.test.ts install/agents-record.test.ts install/message-references.test.ts install/host-entries.test.ts install/host-tools-prose.test.ts install/host-entry-docs.test.ts</automated>
  </verify>
  <done>
    - A file at a launch path that install does not own never reads `ok` in `--check`. It reads a counted WARN that names its launch form, says to read the file first, gives the move-and-re-run remedy and states the cause owns found.
    - Install's closing line and `--check` agree for every launch row in every tested state, because both ask launchOwned (census green).
    - launchClosingClause's printed wording is unchanged, and the WR-03 cases pass as they were.
    - The reach-size pins moved with dated reasons; WRITE_OWNER_CALLS is unchanged.
    - install/README.md and CHANGELOG.md state the rule as coded.
    - The gates pass, and the full suite's new keys against B are board-watch-live keys only.
    - The commit is on main.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| repository file at a launch path → `--check` verdict | a file anyone with write access to the repository can change is judged by the doctor, and the user acts on the verdict |
| `--check` output → user's shell | the launch line prints the exact command (on Pi, `--append-system-prompt`, which skips Pi's project-trust check) next to the verdict |
| install record (.grugops/install.json ledger) → ownership answer | ownership comes from the record, which can be unreadable or out of date |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-faq-01 | Spoofing | kitRouteFindings step (f): a planted or edited launch file that holds the route sentence gets `ok` and the launch command | high | mitigate | Ownership is asked before the route (PD-3). A file install does not own is a counted WARN whatever it holds, telling the user to read it first (Task 2, cases A and B, over every launch row) |
| T-faq-02 | Repudiation | step (f) route arm: `ok` for a session that cannot reach the role files | medium | mitigate | The route arm is gated on routeResolves, with an uncounted note beside step (a)'s FAIL (Task 1, rows 1 to 3) |
| T-faq-03 | Repudiation | the new WARN's reason: a cause the run did not establish (the WR-09 class) | medium | mitigate | launchOwned words its reason from what owns found, in three arms, and never says install did not write the file (PD-2; cases A, B and D each assert their cause) |
| T-faq-04 | Tampering | two owners of one decision drifting apart again | medium | mitigate | One function, launchOwned. A syntax-tree census pins its two call sites and forbids a direct owns call in either caller. The agreement table (case C) checks both answers against each other |
| T-faq-05 | Elevation of Privilege | a malformed or unreadable ledger read as ownership | low | mitigate | launchOwned answers not own for a null or non-ok ledger, and the line says the record could not be used (case D) |
| T-faq-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs no package and adds no dependency. package.json and the lockfile are untouched |
</threat_model>

<verification>
- Task 1 and Task 2 each recorded their RED output on the build before the product change, then went GREEN.
- After each task: `npm run build`, `npm run check:build-parity`, `npm run typecheck` and `npm run freshness` exit 0. After Task 2, `npm run freshness:host-entries` exits 0 as well (no generated entry changes, because host-tools.ts is untouched).
- Scratch smokes (GRUGOPS_HOME and HOME under `$S`) show:
  - for WR-07: note lines and no `ok` launch line while the Orchestrator file is moved away;
  - for WR-08: the WARN line and exit 1 under `--strict` for the user's own OpenCode file, matching the closing line's "no launch form is offered".
- The gates exit 0: check:banned-claims, check:claim-anchors (47/47), check:public-docs and check:nul-bytes. check:diff-disposition is measured against 61 and reported.
- The full suite ran exactly once (never `npm test`). Its new keys against B are board-watch-live keys only.
- `git status` shows only files_modified, plus any other test file that a re-pin touched, each named in the SUMMARY. There are two commits on main, with no branch and no push. `.temp/` is empty.
</verification>

<success_criteria>
- `--check` never says `ok` for a launch file when the kit route does not resolve (WR-07), or for a launch file install does not own (WR-08). Both hold for every launch row, derived from the registry.
- "May the user start a session with this launch file" has one owner, launchOwned, asked by both `--check` and install's closing line. A census holds it, and an agreement test checks the two answers against each other.
- Every new message is in clear voice, states only causes the run established, and carries no planning ID.
- No census was loosened. Each moved pin has a dated reason, and the docs describe the rule as coded.
</success_criteria>

<output>
Create `.planning/quick/261019-faq-fix-review-wr-07-and-wr-08-check-launch-/261019-faq-SUMMARY.md` when done. Include:
- both RED outputs, and the GREEN counts;
- PD-1 to PD-4 as applied, with any deviation;
- every moved pin and re-pinned assertion, with its reason (reach sizes, MSG-1 rows, the Copilot CLI case, any other);
- both smoke transcripts (the launch lines, the closing line, the exit codes);
- the census output line;
- the gates, and check:diff-disposition against 61;
- the full-suite failure keys against B;
- the out-of-scope findings confirmed untouched: WR-05, WR-06, WR-09, WR-10, IN-12, IN-13, IN-14.
</output>
