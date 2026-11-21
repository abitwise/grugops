---
phase: quick-261018-vfm
plan: 01
subsystem: installer registry, --check, install closing notes, docs
tags: [launch-agent, opencode, antigravity-cli, pi, copilot-cli, live-run, verified-live]
status: complete
requires:
  - "install/host-tools.ts HostTool.launchAgent / launchForm / launchCarriers / launchInvoke (quick task 261018-hs8)"
  - "install/install.ts kitRouteFindings step (f) and launchClosingClause (hs8 D-06, WR-03)"
provides:
  - "LaunchForm {kind: command | panel, text, verifiedLive} on every launch row"
  - "launchSession, launchLiveNote; launchInvoke worded per kind with the dated note"
  - "two-sided docs check: a usage section carries launchLiveNote exactly when its row is verified live"
affects:
  - install/host-tools.ts, install/install.ts (and committed .js)
  - README.md, install/README.md, agent-factory/packaging/adapters.md, CHANGELOG.md
tech-stack:
  added: []
  patterns:
    - "the launch form's shape is a typed field; every message takes its verb from the kind, never from the text"
key-files:
  created: []
  modified:
    - install/host-tools.ts
    - install/host-tools.js
    - install/install.ts
    - install/install.js
    - install/host-tools.test.ts
    - install/kit-route.test.ts
    - install/host-entries.test.ts
    - install/host-entry-docs.test.ts
    - install/README.md
    - README.md
    - agent-factory/packaging/adapters.md
    - CHANGELOG.md
decisions:
  - "OpenCode's launch form is a pick of grugops-orchestrator in the /agents panel (human live run 2026-10-18); this supersedes the hs8 D-05 OpenCode command form"
  - "LaunchForm.kind (command | panel) decides the verb of --check's launch line and install's closing clause; verifiedLive records the date a human saw the launch file load, never the kit route"
metrics:
  duration: "about 1 h 10 min (22:55 to 00:06 local); the one full-suite run took 47 min"
  completed: 2026-10-19
  tasks: 2
  files_changed: 12
commits: 2
plan_head_before: a1a546496f3ce32bf98b527030fd5cee368d7ff0
plan_head_after: 498000fcb19309f1389df9c316549f06cd5645fe
actuals:
  tokens: 18604
  tasks: 2
  commits: 2
---

# Phase quick-261018-vfm Plan 01: Launch-agent live-run results Summary

The registry now types each launch form as a `command` or a `panel` pick (`LaunchForm {kind, text, verifiedLive}`). OpenCode's form is a pick of `grugops-orchestrator` in the `/agents` panel, and the retired `opencode --agent` form is gone from every shipped file. Antigravity CLI (panel), OpenCode (panel) and Pi (`--append-system-prompt`) are marked "verified live by a human on 2026-10-18" in the registry, in install's closing line and in the docs. GitHub Copilot CLI and `agy --agent` stay `UNKNOWN - verify`. Whether a launched session follows the kit route stays `UNKNOWN - verify` on every host.

`actuals.tokens` is chars/4 over `git diff a1a54649..498000fc` (74415 chars).

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | f4b11d1b | fix(quick-261018-vfm): launch forms are a command or a panel pick, OpenCode via the /agents panel |
| 2 | 498000fc | docs(quick-261018-vfm): launch-agent live-run results of 2026-10-18 |

`git rev-list --count a1a54649..HEAD` = 2 (ledger `.git/gsd-plan-head-before-quick-261018-vfm-01`).

## RED outputs

**Task 1** (`npx vitest run install/host-tools.test.ts -t "261018-vfm"`, before product code):
```
× every launch row's launch form is typed, its text is backticked, names LAUNCH_AGENT_NAME or the launch path, is absent from invoke, and launchSession, launchInvoke and launchLiveNote word it by its kind (WR-03, D-06, 261018-vfm)
× each launch row's kind and verifiedLive are the human's live-run report of 2026-10-18 (261018-vfm)
TypeError: launchSession is not a function
AssertionError: expected { …(4) } to deeply equal { Object (antigravity, opencode, ...) }
Tests  2 failed | 90 skipped (92)
```

**Task 2** (host-entry-docs.test.ts and host-tools.test.ts, before the docs changed):
```
× the kit-route section names every launch file, says it is not a route carrier, and no longer says --check counts it as one (D-06)
× "Using grugops on Antigravity CLI" names its entry, every backticked token of its invoke and launch form, a dated source, and an `UNKNOWN - verify`
× "Using grugops on Pi" names its entry, ...
AssertionError: Antigravity CLI: the verified-live note is missing: expected ' Install Antigravity CLI itself (its …' to contain 'verified live by a human on 2026-10-18'
AssertionError: Pi: the verified-live note is missing: expected ' Install Pi itself from [pi.dev](http…' to contain 'verified live by a human on 2026-10-18'
AssertionError: the panel wording of a launch line (quick task 261018-vfm): expected ' The scripted install puts the kit in…' to contain 'a session where you pick'
Tests  3 failed | 3 passed | 104 skipped (110)
```
The 3 passing were Codex CLI and GitHub Copilot CLI (the negative side) and OpenCode (its note landed in Task 1).

## Moved pins, with reasons

| Pin | File | Before | After | Reason (dated in the file) |
|-----|------|--------|-------|----------------------------|
| generic closing line | host-tools.test.ts closing-lines case | filters `grugops has not run them on a live host (UNKNOWN - verify)`, length 1 | filters `grugops has not run the others on a live host (UNKNOWN - verify)`, length 1, plus `toContain("verified live")` and `toContain("follows the kit route is UNKNOWN - verify")` | 2026-10-18, 261018-vfm: a human's live run verified launch forms, and the OpenCode panel form comes from that run, not from documentation |
| WR-03 registry case | host-tools.test.ts | `launchInvoke(h) === "start the session as the Orchestrator with " + form` | an independent per-kind oracle for launchSession, launchInvoke and launchLiveNote; exact panel text; no `--` token in a panel form; command text starts with a backtick; verifiedLive is a date or null | the form is typed by kind (261018-vfm); every earlier check is kept, on `.text` |
| launch-line wording | kit-route.test.ts launchLineOf, host-entries.test.ts (2 sites) | `a session started with ${h.launchForm}` | `launchSession(h)`, after a not-null premise | the panel wording the human gave on 2026-10-18 |
| closing-line form checks | kit-route.test.ts (3 sites) | `h.launchForm!` | `formText(h)` (asserted non-null, returns `.text`), plus `not.toContain(launchInvoke(h))` in the user's-own-file and refused cases | no object coercion into a string check; the refused arms now also check the whole clause is absent |
| usage-section tokens | host-entry-docs.test.ts | `t.launchForm ?? ""` | `t.launchForm?.text ?? ""` | the field is now an object |

No assertion was removed. Added: the dated report pin, the two-sided verified-live docs check, and the `a session where you pick` expectation on the kit-route section.

## Scratch smoke (GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261018-vfm/smoke`; install `--yes --opencode --pi` exit 0, `--check` exit 0)

```
  OpenCode: .opencode/agents/grugops-orchestrator.md, .opencode/commands/grugops.md — type `/grugops <request>`; or pick `grugops-orchestrator` in the `/agents` panel to run the session as the Orchestrator (verified live by a human on 2026-10-18)
  Pi: .pi/grugops-orchestrator.md, .pi/prompts/grugops.md — start Pi at the repository root and type `/grugops <request>`; or start the session as the Orchestrator with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root (verified live by a human on 2026-10-18)
  These invocation forms come from each host's documentation or, for a form marked verified live, from a human's run on the live host; grugops has not run the others on a live host (UNKNOWN - verify), and whether a session started with a launch form then follows the kit route is UNKNOWN - verify on every host.
  ok             launch file .opencode/agents/grugops-orchestrator.md carries the kit route: a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (OpenCode). A default OpenCode session does not read it, so no reach line counts it
  ok             launch file .pi/grugops-orchestrator.md carries the kit route: a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root reads it (Pi). A default Pi session does not read it, so no reach line counts it
```

## Test runs

- **`npx vitest related`: not run**, by the orchestrator's override (it selects about 30 files). Instead, Task 1 ran the plan's related list plus install/message-references.test.ts. A grep for `launchForm`, `launchInvoke`, `launchSession`, `launchLiveNote` and `opencode --agent` finds no test file outside that list.
- **Task 1 related run** (9 files): `Tests 1 failed | 942 passed | 1 skipped (944)`. The failure was Rule B on my own new comment (`install/host-tools.test.ts:1386 [Rule B] omits Codex`). Fixed by adding "Codex CLI has no launch agent." Rerun of host-tools-prose.test.ts: `Tests 22 passed (22)`.
- **Task 2 doc-reading run** (host-entry-docs, host-tools-prose, check-banned-claims, check-public-docs-vocabulary, check-claim-anchors, model-dial-consistency): `Tests 302 passed (302)`. The installer-spawning files in the Task 2 related list (kit-route, host-entries, install, host-tools) were not run a second time; Task 2 changed no product code, and the full suite covers them.
- **Full suite, run once** (`npx vitest run --exclude '**/scripts/e2e/**'`, 47 min): 8406 tests, 23 failed, 8381 passed, 2 pending; 23 failure keys.
  - `failures.mjs` self-test first: `keys` on a missing report exits 2, `keys` on `{"numTotalTests":0,"testResults":[]}` exits 2, and `new B base.json` exits 0.
  - New keys against B: two, both in `scripts/board-watch-live.test.ts`: `a watch failure is a DIAGNOSABLE state ... DROPS it when the next poll tick re-arms` and `the DEBOUNCE ... coalesces 5 atomic-rename writes into FEWER documents`. These are the same two keys hs8 recorded. No base key cleared.
  - That file rerun alone: `Tests 3 failed | 3 passed (6)`, with load average about 11.9. It imports only node built-ins, `./board-dashboard.js` and `./board-model.js`, which this plan did not change. It is the known timing flake (backlog 999.11).

## Gates (after both commits)

- build exit 0; check:build-parity `PASS ... 0 findings over 76/76 elements`; typecheck exit 0.
- freshness: `All build outputs fresh: 76 committed .js file(s) match a rebuild of their sources.`
- freshness:host-entries: `7 entries compared, 0 byte difference(s), entry set equal.` No generated entry changed.
- check-banned-claims, check-claim-anchors (47/47 byte-identical), check-public-docs-vocabulary, check-kit-refs, check-nul-bytes (2961 files) and check-foundation-guards: all `ALL CHECKS PASSED`.
- **check-diff-disposition** (measured, not gated): `FAIL diff disposition — changed watched file(s): 61 finding(s) over 40 elements`, against 59. The +2 come from the README paragraph after the table: one sentence became three ("Whether a live run ... in a default session and in one started with a launch agent ...", "Loading the launch agent was verified live ...", "Codex CLI has no launch agent."). Each changed table row replaced its clauses one for one.

## Checked and deliberately not edited

- **examples/01-greenfield-bootstrap.md.** It names only the launch-file paths and points to the "Using grugops on" sections. It carries no launch form.
- **hs8 planning artifacts.** They are history.
- **The install/README.md GitHub Copilot CLI section and the Copilot rows** in README.md and adapters.md.
- **The Antigravity CLI touch-list bullet** ("picked as the primary agent in the `/agents` panel"). It stays true, and the plan did not list it.
- **opencode.ai/docs/cli/ (retrieved 2026-10-18)** still lists `--agent` for the default command, while the human found that OpenCode does not support starting a session with it. The docs give the observed fact and do not offer the flag. Nothing was observed about `opencode run`, so the docs say nothing about it.

## Deviations from Plan

1. **[Override - orchestrator] `npx vitest related` skipped.** See Test runs.
2. **[Rule 1 - Bug] Rule B on a new test comment.** The report-pin comment named four of the five sequential hosts. "Codex CLI has no launch agent." was added. Found by host-tools-prose.test.ts in the Task 1 related run, and fixed before the commit.
3. **[Wording] The generic closing line stays one template literal.** Splitting it into a concatenation might have moved the MSG-1 fragment census (message-references.test.ts). That census passed unchanged.
4. **[Scope] Task 2 related list partly run.** See Test runs. The full suite ran once and covers them.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. T-vfm-01: verifiedLive is set only on the three reported rows, it is pinned by the dated test, and the docs check is two-sided. T-vfm-02: the user's-own-file and refused cases now also assert that launchInvoke(h) is absent. T-vfm-03: the trust warning is present in all four docs. T-vfm-04: `git grep 'opencode --agent' -- ':!.planning'` finds nothing.

## Self-Check: PASSED

- FOUND commits in HEAD's history: f4b11d1b, 498000fc.
- FOUND: every file in key-files.modified changed in `a1a54649..HEAD`.
- `.temp/` is empty. The real `~/.grugops` was not touched: every scratch install set GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261018-vfm`.
- STATE.md and ROADMAP.md were not touched. This SUMMARY is not committed.
