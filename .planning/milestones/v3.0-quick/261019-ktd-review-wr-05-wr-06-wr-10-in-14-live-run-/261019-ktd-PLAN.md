---
phase: quick-261019-ktd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - install/host-tools.ts
  - install/host-tools.js
  - install/host-tools.test.ts
  - install/host-entries.test.ts
  - install/host-entry-docs.test.ts
  - install/README.md
  - README.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - examples/01-greenfield-bootstrap.md
  - CHANGELOG.md
autonomous: true
requirements: [WR-05, WR-06, WR-10, IN-14]

estimate:
  tokens: 120000
  raw_tokens: 120000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "WR-05: `install.js --check` never states a launch form as fact without its live-run state. Every launch-file line (kitRouteFindings step (f), every arm) carries, right after the session phrase, either that row's launchLiveNote or `UNKNOWN - verify: no live run` (the exported LAUNCH_NOT_LIVE). The phrase comes from launchSession, the one owner, so no arm can miss it. Checked end to end for every launch row of HOST_TOOLS, each installed alone, with an expectation built from the row's own verifiedLive and literal text."
    - "WR-05: README.md no longer says the GitHub Copilot CLI launch agent starts the session as the Orchestrator without `UNKNOWN - verify`. examples/01, install/README.md §6 \"Degraded\" and subagent.frontmatter.md say the launch agents are meant to start the session as the Orchestrator, say that Pi's launch file is appended to Pi's system prompt (Pi starts no agent), and point to the \"Using grugops on\" sections for what a human verified. IN-10 is the same edit at the same two sites and is closed with it."
    - "WR-06: no doc lists the verified-live host set by hand. The summary paragraphs (README.md after the \"Start a session\" table, install/README.md's live-session paragraph and its closing-notes paragraph) point to the per-host rows and sections and carry no date. A two-sided docs check reads every tracked markdown file outside the declared exclusions: each per-host table that names a launch form (derived, count asserted: README.md and agent-factory/packaging/adapters.md) carries a row's launchLiveNote exactly when the registry has one, and an unverified launch row's line carries `UNKNOWN - verify`; a unit that says \"verified live\" speaks of at most one host, and carries that host's exact launchLiveNote, or names no host and gives no date; a unit that gives an unverified launch form's command carries `UNKNOWN - verify`. Each rule has a mutation proof."
    - "WR-10: verifiedLive is a LiveRun `{date, hostVersion}` or null. The 2026-10-18 live-run report recorded no host version, so every hostVersion is null and launchLiveNote reads `verified live by a human on 2026-10-18, host version not recorded`. A recorded version would read `... on <host name> <version>` (proved on a synthetic row). No version is taken from the hs8 `--help` reads. No tracked file outside .planning/ states as a standing fact that OpenCode lacks the `--agent` start: CHANGELOG.md, install/README.md, adapters.md and the host-tools.ts comment say a human found it on 2026-10-18, on an OpenCode version that was not recorded."
    - "IN-14: the LaunchForm and LiveRun doc comments say, per kind, what a human saw: for a `panel` form, the panel listed the launch agent and picking it worked; for a `command` form, the host loaded the launch file. The README cells and the install guide sections for Antigravity CLI and OpenCode say only that."
    - "No census is loosened. Every moved pin carries a dated reason (2026-10-19, quick task 261019-ktd). The full non-e2e suite runs once, at the end. Against the base list, only scripts/board-watch-live.test.ts keys may be new."
  artifacts:
    - path: install/host-tools.ts
      provides: "LiveRun; LaunchForm.verifiedLive as LiveRun | null; LAUNCH_NOT_LIVE; launchLiveNote with the host-version part; launchSession with the live-run state"
      contains: "export const LAUNCH_NOT_LIVE"
    - path: install/host-tools.test.ts
      provides: "the per-kind oracle with the live-run state, the recorded-version synthetic row, the dated report pin with hostVersion, the kit-route section names LAUNCH_NOT_LIVE"
      contains: "261019-ktd"
    - path: install/host-entries.test.ts
      provides: "end to end: each launch row's --check line and closing line carry its live-run state"
      contains: "261019-ktd"
    - path: install/host-entry-docs.test.ts
      provides: "the verified-live docs rules (per-host rows, the one-host unit rule, the unverified-form rule), with mutation proofs"
      contains: "261019-ktd"
    - path: README.md
      provides: "the Start a session rows carry each row's live-run state; the paragraph after the table names no host set"
    - path: CHANGELOG.md
      provides: "the [Unreleased] launch-agent entry worded from the evidence; a ### Fixed entry for this task"
  key_links:
    - from: install/host-tools.ts launchSession
      to: install/host-tools.ts launchLiveNote and LAUNCH_NOT_LIVE
      via: "the live-run state appended to the session phrase"
      pattern: "LAUNCH_NOT_LIVE"
    - from: install/install.ts kitRouteFindings step (f)
      to: install/host-tools.ts launchSession
      via: "every launch-file line is built from the session phrase (unchanged call site)"
      pattern: "launchSession\\(host\\)"
    - from: install/host-entry-docs.test.ts
      to: install/host-tools.ts HOST_TOOLS, launchLiveNote
      via: "every docs expectation is derived from the registry rows"
      pattern: "launchLiveNote\\("
---

<objective>
Fix four findings from .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md, all about what grugops claims a human saw on a live host:

- **WR-05.** The GitHub Copilot CLI launch is stated as fact in README.md, examples/01, install/README.md §6, subagent.frontmatter.md and every `--check` launch line (launchSession), although its verifiedLive is null (`UNKNOWN - verify`). §6 and subagent.frontmatter.md also call Pi's appended file a "main agent".
- **WR-06.** Which hosts were verified live, and the date, is typed by hand in about ten doc places. The one two-sided check reads only the install/README.md usage sections.
- **WR-10.** verifiedLive is a date with no host version. The CHANGELOG states the OpenCode `--agent` observation as a permanent fact and drops "a human found".
- **IN-14.** The verifiedLive doc comment says a human "saw the launch file load". For the two panel hosts the report shows only that the panel listed the agent and picking it worked.

Purpose: the registry's verifiedLive is the proof this kit gives users. Every place that repeats it must be derived from it or checked against it, two-sided, and say no more than the evidence.

Output: the LiveRun type and the live-run state in launchSession (host-tools.ts and its committed .js), RED-first tests, the docs, the CHANGELOG. install/install.ts does not change: its step (f) and closing clause already take their words from launchSession and launchInvoke. Out of scope: the hs8 leftovers WR-02 remainder, WR-04, IN-01..IN-09 and IN-11. IN-10 is folded in (same edit as two WR-05 sites).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md
@.planning/quick/261019-i3g-review-wr-09-in-12-in-13-closing-line-ow/261019-i3g-SUMMARY.md

## The evidence (the only source for every claim this plan writes)

The human's live-run report of 2026-10-18 (261018-vfm-PLAN.md, section "The human's live-run report"):
1. Antigravity CLI: picking `grugops-orchestrator` in the `/agents` panel works. `agy --agent` stays `UNKNOWN - verify`.
2. OpenCode: the command-line `--agent` start is not supported ("at least not anymore"). The `/agents` panel lists `grugops-orchestrator`, and selecting it works.
3. GitHub Copilot CLI: skipped, so `UNKNOWN - verify`.
4. Pi: `pi --append-system-prompt .pi/grugops-orchestrator.md` loads the file; Pi's `[Context]` listed `.pi/grugops-orchestrator.md`, `~/AGENTS.md` and `AGENTS.md`.

**No host version was recorded in the report, the vfm PLAN or the vfm SUMMARY.** The versions in the hs8 notes (agy 1.3.5, Pi 1.1.0, OpenCode v2.0.28) come from `--help` reads made while planning hs8, not from the live run. They must not be used as the live run's version. Every hostVersion is null.

## Facts checked while planning (2026-10-19, at HEAD b7193c4b)

- **install/host-tools.ts** (no imports, and it must gain none; the host-entries freshness check mirrors it):
  - `LaunchForm` (about lines 47-63) is `{kind, text, verifiedLive: string | null}`. Its doc comment carries the IN-14 sentence.
  - The rows: Antigravity CLI (about 321-328), OpenCode (341-350, whose comment says the human found OpenCode does not support the `--agent` start), GitHub Copilot CLI (367-374), Pi (390-399).
  - `launchLiveNote` (about 728-736), `launchSession` (739-751, with a LaunchHost overload), `launchInvoke` (753-770).
- **install/install.ts needs no change.** Step (f) of kitRouteFindings (about 2110-2150) builds every launch-file line from `const session = launchSession(host)`. launchClosingClause (about 7771) calls launchInvoke. invocationNotesLine (about 7788) asks only `launchLiveNote(h) !== null`. Its comments stay true.
- **Tests that read these fields:**
  - host-tools.test.ts: the per-kind oracle (about 1568-1606), the dated report pin (1608-1621), the LaunchPair pins (1185-1200, which build `verifiedLive: null` forms and stay valid), the kit-route section case (about 798-812), and the provenance oracle (about 354-390, reads `verifiedLive !== null` only).
  - host-entries.test.ts: the Antigravity tracer case (about 165-200) and the per-launch-row loop (about 203-245). Both take their expectation from launchSession, so they follow the change but cannot catch a dropped live-run state.
  - kit-route.test.ts: launchLineOf (about 3294) and line 3563 also take it from launchSession.
  - host-entry-docs.test.ts: the usage-section case (about 314-336) is two-sided on `launchLiveNote(t)`. It has markdownUnits, sentences, guideHeadings, trackedMarkdown (the derived scan set: tracked `*.md` minus `.planning/`, `docs/audit/`, `docs/initial/` and CHANGELOG.md, each with a reason) and a Codex mutation-proof pattern to copy.
- **Censuses checked and not moved by this plan:** DOCTOR_REACH_SIZE and WR24_REACH_SIZE walk install.ts functions only. MSG-1 (message-references.test.ts) counts fragments that name a binary or a flag; the new strings name none. The IN-13 census bans `??` on a launchSession or launchInvoke call; use a ternary inside launchSession anyway.
- **Every site that states the verified set, a date or a launch claim** (outside .planning/; .js and test files excluded):
  - README.md:63-66 (table rows) and :68 (the paragraph after the table).
  - agent-factory/packaging/adapters.md:37, 38, 40 (rows), and :39 (the Copilot row, which already says "A live run is `UNKNOWN - verify`").
  - install/README.md: :517 (Copilot touch-list bullet), :550-555 (live-session paragraph), :568-569 (closing-notes example form), :578-579 (closing-notes typed date), :687-697 (kit-route "The launch files" bullet), :807-809 (Antigravity usage), :841-848 (OpenCode usage), :889-890 (Copilot usage), :953-955 (Pi usage), :1935-1939 (§6 "Degraded").
  - agent-factory/packaging/subagent.frontmatter.md:255-258. examples/01-greenfield-bootstrap.md:42-46.
  - CHANGELOG.md:147-153 (the [Unreleased] launch-agent entry under `### Added`). The `### Fixed` list ends with the 261019-i3g entry (about line 595-605), followed by `### Security`.
- **Files with a bold per-host table** (a line matching `^\|\s*\*\*<name>\*\*\s*\|` for every HOST_TOOLS row): README.md, agent-factory/packaging/adapters.md, CLAUDE.md and agent-factory/README.md. Only README.md and adapters.md name a launch form or a launch file in a launch host's row. CLAUDE.md's table is the GSD stack research and names none (hs8 IN-09, a later task); agent-factory/README.md's names none.
- **Other gates that read these docs:** scripts/validate-agent-factory.ts check 7b (one adapters.md row per host); scripts/check-uat-oracles.ts (adapters.md rows: a non-spawning row has no spawn or coordinator wording); check-claim-anchors (README anchors C-28-006 at :42 and C-28-007 at :70 do not cover the table or :68; the run must stay 47/47 byte-identical). The npm script is `check:public-docs` (there is no `check:public-docs-vocabulary` script).

## Planner decisions (record each in the SUMMARY; PD-1 and PD-3 go to the human)

- **PD-1 (WR-10: the note's text).** `launchLiveNote` returns `verified live by a human on <date>, host version not recorded` when hostVersion is null, and `verified live by a human on <date> on <host name> <hostVersion>` when it is set. The note does not add `UNKNOWN - verify`: that the version was not recorded is a known fact, and the provenance line and the docs already mark what is unknown. The human may prefer `(UNKNOWN - verify)` inside the note; that is a one-line change plus the doc strings the tests bind.
- **PD-2 (WR-10: the type).** verifiedLive becomes `LiveRun | null`, with `interface LiveRun { readonly date: string; readonly hostVersion: string | null }`. This is not a sibling `verifiedVersion` field, so a version cannot exist without a date.
- **PD-3 (WR-05: where the state lives).** launchSession appends ` (<launchLiveNote>)`, or ` (UNKNOWN - verify: no live run)`, to the session phrase. So every step (f) arm (absent, unread, not install's, ok, route unresolved, own-stale, user) carries it, and no arm can drop it. This is the review's own fix. A per-arm sentence would be the "fixed in one arm only" class. launchInvoke stays as it is: install's closing line already marks an unverified form in invocationNotesLine (261019-i3g IN-12), so its unverified forms keep no inline mark.
- **PD-4 (WR-06: summaries carry no set).** The summary paragraphs stop listing which hosts were verified and give no date. They point to the per-host rows and sections, which the tests bind to the registry two-sided. A scan rule makes a hand-typed host list fail: a unit that says "verified live" may speak of at most one host. CHANGELOG.md keeps its reasoned exclusion from the scan (release history), but its [Unreleased] entry is corrected by hand in Task 3.
- **PD-5 (WR-05: the unverified-form rule).** In the scan set, a unit that holds a backticked token of an unverified row's launch form (a token naming LAUNCH_AGENT_NAME or the launch path: today `` `copilot --agent grugops-orchestrator` ``) must hold `UNKNOWN - verify`. The token comes from the registry; no verb list is used. The prose sites that state a launch claim without the token (examples/01, §6, subagent.frontmatter.md) are fixed by edit only. No mechanical check covers a launch claim worded in free prose: a list of verbs would be an enumeration. The SUMMARY states this residual.
- **PD-6 (scope).** IN-10 is folded in. Its two sites are the WR-05 §6 and subagent.frontmatter.md sentences. Nothing else from the hs8 list is touched.

## Prose rules for every edit (product strings, TS comments, tests, docs)

- Clear voice. No hedged claims, no caveman voice. Never write that a launched session reaches or follows the Orchestrator route; that stays `UNKNOWN - verify` on every host.
- No planning ID in a product string. Comments, the CHANGELOG and the SUMMARY may cite them.
- install/host-tools-prose.test.ts: Rule A, no count word before a host noun; Rule B, no block (a paragraph, a whole table, a run of list items, a TS comment paragraph) names exactly 4 of Codex, Antigravity, OpenCode, Copilot, Pi. A block that names the four launch hosts also names Codex ("Codex CLI has no launch agent" or "Codex CLI gets none").
- The Codex scan (host-entry-docs.test.ts): a sentence naming Codex never holds the slash spelling of the grugops command.
- README.md never holds "understand" or "comprehension".
- **The rules Task 2 adds also bind Tasks 1 and 3.**
  - Write every "verified live" statement as its own sentence. It names at most one host, unless it sits in that host's usage section, and it holds that host's exact note.
  - A "verified live" sentence that names no host gives no date.
  - A sentence that gives the Copilot launch command also says `UNKNOWN - verify`.

## Testing approach (the human's standing rule)

- Tests run the COMMITTED `.js`, so run `npm run build` before each test run.
- While coding, run only the related files named in each task's verify. NEVER run `npm test`: it starts the live, paid e2e lane.
- The full suite runs exactly once, at the end of Task 3: `npx vitest run --exclude '**/scripts/e2e/**' --reporter=json --outputFile="$S/after.json"`. Compare it with `B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt` using `$S/failures.mjs`.
  - Copy failures.mjs from `${TMPDIR:-/tmp}/grugops-261019-i3g/failures.mjs`, which exists.
  - Run its self-test first: `keys` on a missing report exits 2, and `keys` on `{"numTotalTests":0,"testResults":[]}` exits 2.
  - Only `scripts/board-watch-live.test.ts` keys may be new (the known flake, backlog 999.11). vitest.config.ts caps workers and heap; do not change it.
- Scratch: `S="${TMPDIR:-/tmp}/grugops-261019-ktd"`, then `mkdir -p "$S"`.
  - Every scratch run of install.js sets both GRUGOPS_HOME and HOME to directories under `$S`, and passes `--target <dir>`. A run without both overwrites the real ~/.grugops kit.
  - Write nothing under `.temp/`.
- **Commits.** Work sequentially on main; create no branch and push nothing. Stage files by name, never with `git add -A`. Make one commit per task. Every message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `npm run check:build-parity` compares against the index, so stage the rebuilt `.js` before you run it. Do not edit STATE.md or ROADMAP.md.

## Moved pins

Each moved pin gets a dated reason line ("Re-pinned 2026-10-19 by quick task 261019-ktd (review WR-10): ...") in the file's comment style. No assertion is removed or weakened. A new expectation must discriminate at least as well as the old one. A census that reports anything this plan did not predict is classified as its header says, never reworded to pass.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): the live-run state, with its host version, from the registry through --check, install's closing line and the usage sections (WR-05 launchSession, WR-10, IN-14)</name>
  <files>install/host-tools.ts, install/host-tools.js, install/host-tools.test.ts, install/host-entries.test.ts, install/README.md</files>
  <read_first>
    - install/host-tools.ts lines 40-130 (LaunchForm, LaunchPair), 318-400 (the four launch rows and their comments), 716-770 (launchCarriers, launchLiveNote, launchSession, launchInvoke).
    - install/host-tools.test.ts lines 30-60 (imports), 795-812 (kit-route section case), 1180-1215 (LaunchPair pins), 1460-1470 (LAUNCH_ROWS), 1565-1622 (oracle and report pin).
    - install/host-entries.test.ts lines 160-245.
    - install/README.md lines 685-697, 801-816, 837-850, 935-955.
    - .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md, sections WR-05, WR-10 and IN-14.
  </read_first>
  <behavior>
    - LAUNCH_NOT_LIVE is exported and equals the literal `UNKNOWN - verify: no live run`.
    - For every launch row: verifiedLive is null, or a LiveRun whose date matches `^\d{4}-\d{2}-\d{2}$` and whose hostVersion is null or a non-empty string.
    - launchLiveNote is null for null; `verified live by a human on ` + date + `, host version not recorded` when hostVersion is null; `verified live by a human on ` + date + ` on ` + h.name + ` ` + hostVersion otherwise. A synthetic row (a verified launch row spread, its hostVersion set to `0.0.0-fixture`) proves the recorded arm.
    - launchSession is the per-kind phrase (`a session started with ` or `a session where you pick `, then text), then ` (`, then the note or LAUNCH_NOT_LIVE, then `)`. launchInvoke is unchanged: the clause, plus ` (` + note + `)` only when the note is not null.
    - The report pin: antigravity and opencode are `panel` with `{date: "2026-10-18", hostVersion: null}`; copilot is `command` with null; pi is `command` with `{date: "2026-10-18", hostVersion: null}`.
    - End to end, for each launch row installed alone: the `ok` launch line holds ` (` + the live-run state built in the test + `) reads it (` + name + `)`. Install's stdout holds the note when the row has one, and holds no `verified live by a human` when it has none.
    - The kit-route section of install/README.md holds LAUNCH_NOT_LIVE and `host version not recorded`.
  </behavior>
  <action>
**Step 0. Start gate.** Do this before any edit.
- Set S as the context section defines it, and run `mkdir -p "$S"`.
- Copy `$S/failures.mjs` from the i3g scratch dir, then run its self-test.
- Check that `git status --porcelain` shows nothing outside this quick-task directory, and that `git branch --show-current` prints `main`.

**Step 1. RED, before product code.**
- install/host-tools.test.ts: import LAUNCH_NOT_LIVE. Rewrite the per-kind oracle (about 1573-1606) to the behavior block. Build every expected string from the row's own kind, text, date and hostVersion with literal prefixes and suffixes. Never call the helper under test to build an expectation. Keep every existing check on `.text`.
- Add the synthetic recorded-version case next to the oracle, with a comment: it is a test fixture, not a host version anyone observed.
- Move the dated report pin (about 1613-1621) to the LiveRun values, with the reason "Re-pinned 2026-10-19 by quick task 261019-ktd (review WR-10): verifiedLive records the live run as {date, hostVersion}, and the report of 2026-10-18 recorded no host version". In the comment above it, say that a human found on 2026-10-18 that OpenCode did not start a session with `--agent`, rather than stating it as a fact about OpenCode.
- In the kit-route section case (about 798-812), assert the section holds LAUNCH_NOT_LIVE and `host version not recorded`.
- install/host-entries.test.ts, in the per-launch-row loop and the Antigravity tracer case, compute the live-run state from `h.launchForm.verifiedLive` with literals: LAUNCH_NOT_LIVE's literal text for null, and otherwise the note text from the behavior block. Assert the `ok` line holds ` (<state>) reads it (<name>)`. Then assert that install's stdout holds the note when there is one, and does not hold `verified live by a human` when there is none. Add a one-line dated comment (quick task 261019-ktd, review WR-05): the launch line must carry the form's live-run state.
- Run `npx vitest run install/host-tools.test.ts install/host-entries.test.ts` on the current build. The new cases must fail. Record the RED output for the SUMMARY.

**Step 2. install/host-tools.ts. Add no import.**
- Add `export interface LiveRun { readonly date: string; readonly hostVersion: string | null }` above LaunchForm. Its doc comment says three things, per kind (IN-14). A `panel` live run means a human saw the panel list the launch agent, picked it, and the pick worked; that shows the agent file was read, not that its pointer body entered the session. A `command` live run means a human started the host with the command and saw it load the launch file. hostVersion is the host version recorded with the run, or null when the run recorded none, and it is never filled from a `--help` read made while planning.
- Change `LaunchForm.verifiedLive` to `LiveRun | null`. In LaunchForm's doc comment, replace the sentence that defines verifiedLive with: the live run a human made of the form (LiveRun), or null when nobody ran it live (then the form is UNKNOWN - verify). Keep the kit-route sentence.
- In each verified row, set `verifiedLive: { date: "2026-10-18", hostVersion: null }`, with a comment saying the live-run report of 2026-10-18 recorded no host version (quick task 261019-ktd, review WR-10).
- Rewrite the OpenCode comments (about 341-349). Keep the panel facts and the docs/cli source. Say that on 2026-10-18 the human found that OpenCode, on a version that was not recorded, did not start a session with `--agent`, so no command form is given. Leave the Copilot row's verifiedLive null.
- Export `LAUNCH_NOT_LIVE = "UNKNOWN - verify: no live run"`, with a doc comment: the live-run state `--check` gives a launch form nobody ran live (quick task 261019-ktd, review WR-05).
- launchLiveNote: return the PD-1 text. Rewrite its doc comment: it says what launch run a human made, with the host version or that none was recorded. What was seen depends on the kind (LiveRun). It never says that the session followed the kit route.
- launchSession: build the per-kind phrase as now, then append ` (` + the note + `)` when the note is not null, and ` (` + LAUNCH_NOT_LIVE + `)` when it is. Use a ternary, not `??`. Keep both overloads.
- Update launchSession's doc comment. Every `--check` launch-file line carries the form's live-run state, so `--check` never states an unverified launch as fact (quick task 261019-ktd, review WR-05). The phrase is the one owner of that state, so every step (f) arm carries it.
- launchInvoke: no code change. Its doc comment adds that an unverified form gets no inline mark here, because install's closing provenance line marks it (invocationNotesLine).
- Check every new comment paragraph against Rule B.

**Step 3. install/README.md. The far end, so the existing two-sided usage-section check stays green.**
- Antigravity CLI usage section (about 807-809): the sentence says that picking `grugops-orchestrator` in the `/agents` panel was verified live by a human on 2026-10-18, host version not recorded. It then says the panel listed the agent and picking it worked. Keep the kit-route `UNKNOWN - verify` sentence.
- OpenCode usage section (about 841-848):
  - The verified sentence holds the exact note `verified live by a human on 2026-10-18, host version not recorded`, then what the human saw: the panel lists the agent, and picking it works.
  - Reword the `--agent` sentence. opencode.ai/docs/cli/ (retrieved 2026-10-18) lists an `--agent` flag for the default command. On the same run, on an OpenCode version that was not recorded, the human found that OpenCode did not start a session with it, so this guide gives no command-line form.
- Pi usage section (about 953): the verified sentence holds the exact note, then what Pi's `[Context]` list named. Leave the `Pi 1.1.0 --help` sentence: it cites a help read, not the live run.
- Kit-route "The launch files" bullet (about 693-695): after the sentence about the two wordings, add one sentence.
  - It says the session phrase also gives the form's live-run state: either the note install's closing notes give for a form a human ran live ("verified live by a human on" its date, then the host version, or "host version not recorded"), or `UNKNOWN - verify: no live run`.
  - It names no host and gives no date.

**Step 4. Build and run.** Run `npm run build`, then the verify command. Commit with the subject `fix(quick-261019-ktd): --check gives each launch form its live-run state; the live run records its host version`.
  </action>
  <verify>
    <automated>S="${TMPDIR:-/tmp}/grugops-261019-ktd" && mkdir -p "$S" && test -f "$S/failures.mjs" && npm run build && npm run typecheck && npm run freshness && npm run freshness:host-entries && npx vitest run install/host-tools.test.ts install/host-entries.test.ts install/host-entry-docs.test.ts install/host-tools-prose.test.ts install/kit-route.test.ts install/message-references.test.ts install/closing-claims.test.ts && SC="$S/smoke1" && rm -rf "$SC" && mkdir -p "$SC/target" "$SC/home" "$SC/kit" && INSTALL_MODE=copy GRUGOPS_SRC="$PWD" GRUGOPS_HOME="$SC/kit" HOME="$SC/home" node install/install.js --yes --target "$SC/target" --opencode --copilot --pi > "$SC/install.log" 2>&1 && grep -qF 'to run the session as the Orchestrator (verified live by a human on 2026-10-18, host version not recorded)' "$SC/install.log" && GRUGOPS_HOME="$SC/kit" HOME="$SC/home" node install/install.js --check --target "$SC/target" > "$SC/check.log" 2>&1 && grep -qF 'a session started with `copilot --agent grugops-orchestrator` (UNKNOWN - verify: no live run) reads it (GitHub Copilot CLI)' "$SC/check.log" && grep -qF 'in the `/agents` panel (verified live by a human on 2026-10-18, host version not recorded) reads it (OpenCode)' "$SC/check.log" && grep -qF 'from the repository root (verified live by a human on 2026-10-18, host version not recorded) reads it (Pi)' "$SC/check.log"</automated>
  </verify>
  <done>
    - RED was recorded before the product change, and the related files pass after it.
    - The scratch `--check` prints the live-run state on every launch line: `UNKNOWN - verify: no live run` for GitHub Copilot CLI, and the note with "host version not recorded" for OpenCode and Pi. Install's closing line gives the note for the verified forms.
    - typecheck, freshness (all committed .js fresh) and freshness:host-entries (0 byte differences) pass. install/install.ts and install.js are unchanged.
    - One commit.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: every doc that names a verified host or a launch form is bound to the registry, two-sided (WR-06, WR-05 table and usage sites, IN-14 cells)</name>
  <files>install/host-entry-docs.test.ts, README.md, agent-factory/packaging/adapters.md, install/README.md</files>
  <read_first>
    - install/host-entry-docs.test.ts (whole file, 359 lines).
    - README.md lines 57-69. agent-factory/packaging/adapters.md lines 32-41.
    - install/README.md lines 512-520, 548-584, 885-896.
    - .planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-REVIEW.md, section WR-06.
  </read_first>
  <behavior>
    - LAUNCH_HOSTS is derived as the HOST_TOOLS rows with a launch form. A host is "named" in a unit when its name or shortName occurs word-bounded and case-sensitive, as CODEX_RES matches.
    - The units for the rules below: a table-row line (outside a fence) is one unit, whole. Every other markdownUnits unit is split by sentences(). The Codex scan keeps its per-cell units, unchanged.
    - A unit's context host: the launch host X whose heading "Using grugops on X" is the nearest heading before the unit, until the next heading of the same or a higher level.
    - **Rule LIVE-1.** For every unit in trackedMarkdown(REPO) that holds "verified live" (matched case-insensitively; the note itself is matched exactly), let H be the hosts it names plus its context host. It is a finding when H has more than one member. It is a finding when H has one member h and either launchLiveNote(h) is null or the unit lacks it. It is a finding when H is empty and the unit holds a date (`\b20\d\d-\d\d-\d\d\b`).
    - **Rule LIVE-2.** For every launch host whose verifiedLive is null, take each backticked token of its launch form's text that holds LAUNCH_AGENT_NAME or its launchAgent. A unit in trackedMarkdown(REPO) that holds such a token and not `UNKNOWN - verify` is a finding.
    - **Rule LIVE-3.**
      - The per-host table files are derived: the scan-set files that have exactly one `^\|\s*\*\*<name>\*\*\s*\|` line for every HOST_TOOLS row, and in which some launch host's line holds its launchAgent path or a backticked token of its launch form's text that holds LAUNCH_AGENT_NAME or that path. (A bare `/agents` token does not count. Measured 2026-10-19: CLAUDE.md and agent-factory/README.md have 0 such lines.)
      - Premise: this set equals README.md and agent-factory/packaging/adapters.md (count 2).
      - For each such file and each HOST_TOOLS row h:
        - when launchLiveNote(h) is not null, the line holds it;
        - when it is null, the line does not hold "verified live";
        - when h has a launch form and its verifiedLive is null, the line holds "`UNKNOWN - verify`".
    - Mutation proofs, built from registry values and never from hand-typed host names, through the same scanner functions:
      - LIVE-1: two verified hosts in one "verified live" sentence is a finding. The unverified host with "verified live" is a finding. A dated sentence that names no host, outside a usage section, is a finding. An undated one is not.
      - LIVE-1, inside "Using grugops on <verified host>": the sentence with its exact note is not a finding. With only the bare `verified live by a human on <date>` (the old note) it is a finding.
      - LIVE-2: the unverified token without `UNKNOWN - verify` is a finding; with it, it is not. A verified host's token alone is not a finding.
      - LIVE-3: a scratch README copy with one verified row's note removed, with "verified live" planted in the unverified row, or with `UNKNOWN - verify` removed from that row, each gives a finding that names the file and the host.
    - The real tree has zero findings for each rule. Each rule's scan is not vacuous: assert the count of units each rule examined is at least 1.
  </behavior>
  <action>
**Step 1. RED.** In install/host-entry-docs.test.ts add the three rules, their premises and their mutation proofs from the behavior block, in a new describe: "verified-live claims and launch forms are bound to the registry (quick task 261019-ktd, review WR-06, WR-05)".
- Import launchSession only if you use it. LAUNCH_AGENT_NAME comes from ./host-tools.js.
- Put each rule in its own function that takes `(file, body)` and returns findings with file:line, so the mutation proofs run the same function.
- Update the file's header comment with a paragraph that states the three rules, and why CLAUDE.md and agent-factory/README.md fall outside LIVE-3: their per-host rows name no launch form.
- Run `npx vitest run install/host-entry-docs.test.ts` on the Task 1 tree. The real-tree cases must fail at these sites: README.md:63, 64, 65, 66 and 68; install/README.md about 517, 552, 569, 578 and 890; adapters.md:37, 38 and 40. Record the RED output.

**Step 2. README.md.** Keep the table at column 0, and keep cells 1 and 2 of every row as they are. Rewrite cell 3:
- **Antigravity CLI.** The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18, host version not recorded). Picked there, it points the session at the Orchestrator role. Otherwise the skill points the session at the Orchestrator role. Roles load one at a time.
- **OpenCode.** The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18, host version not recorded). Picked there, or reached with Tab, it points the session at the Orchestrator role. Otherwise the command points the session at the Orchestrator role. Roles load one at a time.
- **GitHub Copilot CLI.** With `--agent` or `/agent`, the launch agent is documented to start the session as the Orchestrator; grugops has made no live run of it (`UNKNOWN - verify`). Otherwise its instructions point the session at the Orchestrator role. Roles load one at a time.
- **Pi.** Keep the cell. Replace its dated parenthesis with `(verified live by a human on 2026-10-18, host version not recorded)`.
- **The paragraph after the table.** Keep it up to the sentence that ends with the kit-route section's name. Replace the sentences after that with:
  - A launch form a human ran on the live host is marked verified live in its row of the table above and in its "Using grugops on" section of `install/README.md`, with the date and the host version, or "host version not recorded".
  - A launch form not marked so is `UNKNOWN - verify`.
  - Codex CLI has no launch agent.

**Step 3. agent-factory/packaging/adapters.md.** Change only the launch-agent part of the Adapter cell.
- **Antigravity CLI.** The source parenthesis says the panel listing it and picking it there were verified live by a human on 2026-10-18, host version not recorded.
- **OpenCode.** The parenthesis says the panel lists it and picking it works (verified live by a human on 2026-10-18, host version not recorded). On the same run, on an OpenCode version that was not recorded, the human found that OpenCode did not start a session with `--agent`.
- **Pi.** The dated clause becomes: verified live by a human on 2026-10-18, host version not recorded, when Pi's `[Context]` list named the file.
- Add no spawn or coordinator wording to any non-spawning row (scripts/check-uat-oracles.ts).

**Step 4. install/README.md.**
- **Touch-list bullet (about 517).** Say in the same sentence that grugops has not run the Copilot launch form live (`UNKNOWN - verify`).
- **Live-session paragraph (about 550-555).** Keep the first sentence, which names every sequential host. Replace the next two sentences with these:
  - A launch form a human ran on the live host is marked verified live in that host's "Using grugops on" section below, with the date and the host version, or "host version not recorded", and with what the human saw.
  - A launch form not marked so is `UNKNOWN - verify`.
  - Whether a session started with any launch file then follows the kit route is `UNKNOWN - verify`.
- **Closing-notes paragraph.**
  - At about 568-569, the example form keeps `copilot --agent grugops-orchestrator` and says in the same sentence that grugops has not run it live (`UNKNOWN - verify`).
  - At about 578-579, the marked note is described without a date: "verified live by a human on" its date, followed by the host it ran on and its version, or by "host version not recorded".
- **Copilot usage section (about 889-890).** The sentence giving `copilot --agent grugops-orchestrator` and `/agent` also says grugops has made no live run of either (`UNKNOWN - verify`).

**Step 5.** Run the verify command. Commit with the subject `docs(quick-261019-ktd): verified-live claims and launch forms are checked against the registry in every doc`.
  </action>
  <verify>
    <automated>npm run build && npx vitest run install/host-entry-docs.test.ts install/host-tools-prose.test.ts install/host-tools.test.ts scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-claim-anchors.test.ts scripts/check-uat-oracles.test.ts scripts/validate.test.ts && npm run check:banned-claims && npm run check:claim-anchors && npm run check:public-docs && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && ! grep -qF 'on Antigravity CLI and OpenCode (picked' README.md && ! grep -qF 'load in a live session: verified live' install/README.md && ! grep -qF 'is marked "verified live by a human on 2026-10-18"' install/README.md && ! git grep -nE 'verified live by a human on 20[0-9]{2}-[0-9]{2}-[0-9]{2}\)' -- README.md agent-factory/packaging/adapters.md install/README.md</automated>
  </verify>
  <done>
    - The new rules failed on the Task 1 tree at the listed sites, and they pass on the edited tree, with zero findings.
    - Every mutation proof is reported at its planted line. Each rule asserts that it examined at least one unit.
    - check:banned-claims, check:claim-anchors (47/47 byte-identical) and check:public-docs pass. The validator passes.
    - One commit.
  </done>
</task>

<task type="auto">
  <name>Task 3: the remaining launch claims say what is meant and what was seen (WR-05 prose sites, IN-10, WR-10 CHANGELOG), then the gates and the full suite once</name>
  <files>examples/01-greenfield-bootstrap.md, agent-factory/packaging/subagent.frontmatter.md, install/README.md, CHANGELOG.md</files>
  <read_first>
    - examples/01-greenfield-bootstrap.md lines 36-48. agent-factory/packaging/subagent.frontmatter.md lines 248-262.
    - install/README.md lines 1933-1942 (§6 "Degraded").
    - CHANGELOG.md lines 132-153 and 590-606.
  </read_first>
  <action>
**Step 1. examples/01-greenfield-bootstrap.md (about 42-46).**
- The launch sentence says that install also writes a launch agent for Antigravity CLI, OpenCode and GitHub Copilot CLI, each meant to start a session as the Orchestrator, and a launch file for Pi, which Pi appends to its system prompt when started with `--append-system-prompt`. Codex CLI gets none. Keep the four paths.
- The next sentence, on its own, says that the start forms, and which of them a human verified live, are in the "Using grugops on" sections of `install/README.md`.

**Step 2. agent-factory/packaging/subagent.frontmatter.md (about 255-258) and install/README.md §6 "Degraded" (about 1935-1939).** Both close IN-10 too.
- In each, reword the parenthesis or sentence about the launch agents. The launch agents install writes for Antigravity CLI, OpenCode and GitHub Copilot CLI are meant to start the session with the Orchestrator pointer as its main agent. Pi's launch file is appended to Pi's system prompt. None of them gives the session an `Agent` tool this kit uses, and Codex CLI gets none.
- Then add a separate sentence that names no host: which launch forms a human verified live is in the "Using grugops on" sections of `install/README.md` (in §6: the "Using grugops on" sections).
- Keep the rest of each paragraph byte for byte. Each block still names Codex, so Rule B holds.

**Step 3. CHANGELOG.md.**
- In the [Unreleased] `### Added` launch-agent entry (about 147-153), replace the sentences from "A human verified live" to the end of the entry. Write them from the evidence:
  - On 2026-10-18 a human verified live that the `/agents` panel of Antigravity CLI and of OpenCode lists the launch agent and that picking it works, and that Pi loads the launch file passed with the flag. The host versions were not recorded.
  - Install's closing notes mark those forms "verified live by a human on 2026-10-18, host version not recorded".
  - GitHub Copilot CLI and the `agy --agent` flag are `UNKNOWN - verify`, and so is whether a session started with a launch file follows the kit route.
  - On the same run, on an OpenCode version that was not recorded, the human found that OpenCode did not start a session with `--agent`, so no command-line form is given for it.
- Append one entry at the end of `### Fixed`, after the 261019-i3g entry. Cite "(quick task 261019-ktd; 261018-vfm review WR-05, WR-06, WR-10, IN-14)". Say:
  - `install.js --check` now gives each launch-file line the form's live-run state: the verified-live note, or `UNKNOWN - verify: no live run`. Before, it stated the GitHub Copilot CLI launch, which nobody has run live, as fact.
  - The verified-live note now says the host version was not recorded, because the run of 2026-10-18 recorded none.
  - The README and the install guide no longer say the GitHub Copilot CLI launch agent starts the session as the Orchestrator, or that every launch file makes the pointer the session's main agent. On Antigravity CLI and OpenCode a human saw the panel list the agent and the pick work. On Pi a human saw the file loaded, and Pi appends the file to its system prompt.
  - Which hosts were verified is now stated in each host's own row and section, and checked against the install registry.
  - Codex CLI has no launch agent.

**Step 4. Gates, once, after the edits.**
- Run npm run build, typecheck, freshness, freshness:host-entries, check:build-parity (stage first), check:banned-claims, check:claim-anchors, check:public-docs, `node scripts/check-kit-refs.js`, `node scripts/check-nul-bytes.js` and `node scripts/check-foundation-guards.js`.
- Then run the full suite once, and compare it with B through failures.mjs, as the context section says.
- Record `npm run check:diff-disposition` as measured, not gated, against 61.

**Step 5.** Commit with the subject `docs(quick-261019-ktd): launch claims say what is meant and what a human saw; CHANGELOG`.
  </action>
  <verify>
    <automated>S="${TMPDIR:-/tmp}/grugops-261019-ktd" && B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt && test -f "$S/failures.mjs" && test -s "$B" && npm run build && npm run typecheck && npm run freshness && npm run freshness:host-entries && npm run check:banned-claims && npm run check:claim-anchors && npm run check:public-docs && node scripts/check-kit-refs.js && node scripts/check-nul-bytes.js && node scripts/check-foundation-guards.js && ! grep -qF 'agent, which starts a session as the Orchestrator' examples/01-greenfield-bootstrap.md && ! git grep -qF 'make the Orchestrator pointer the session' -- agent-factory/packaging/subagent.frontmatter.md install/README.md && for f in CHANGELOG.md install/README.md agent-factory/packaging/adapters.md install/host-tools.ts install/host-tools.test.ts; do ! tr '\n' ' ' < "$f" | tr -s ' ' | grep -qF 'does not support starting a session' || exit 1; done && npx vitest run install/host-entry-docs.test.ts install/host-tools-prose.test.ts && { npx vitest run --exclude '**/scripts/e2e/**' --reporter=json --outputFile="$S/after.json" >/dev/null 2>&1 || true; } && test -s "$S/after.json" && { node "$S/failures.mjs" new "$B" "$S/after.json" > "$S/new.txt"; test $? -le 1; } && ! grep -v '^#' "$S/new.txt" | grep -v '^scripts/board-watch-live.test.ts :: ' | grep -q .</automated>
  </verify>
  <done>
    - No shipped doc states the GitHub Copilot CLI launch as fact, or calls Pi's appended file an agent.
    - The CHANGELOG states only what the human found, on an unrecorded version. Every gate passes.
    - The full suite ran once: no new failure keys against B except scripts/board-watch-live.test.ts.
    - One commit.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| registry → user-facing text | install output, `--check` output and the docs repeat the registry's live-run record to users, who rely on it to decide which launch form to trust |
| scratch install → real kit home | an install.js run without GRUGOPS_HOME and HOME overwrites the user's ~/.grugops |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-ktd-01 | Repudiation | launchSession, launchLiveNote, the docs | medium | mitigate | The live-run state comes from one registry field. `--check` carries it on every launch line through launchSession. The docs rules LIVE-1..3 bind every doc site two-sided, with mutation proofs. No host version is invented: every hostVersion is null, and the note says so. |
| T-ktd-02 | Tampering | scratch installs in verify and smoke | high | mitigate | Every install.js run sets GRUGOPS_HOME and HOME under `$TMPDIR/grugops-261019-ktd` and passes `--target`. The verify commands spell this out. |
| T-ktd-03 | Repudiation | a hand-typed host list left in a summary | low | mitigate | Rule LIVE-1 refuses a "verified live" unit that speaks of more than one host, or that is dated without a host. |
| T-ktd-SC | Tampering | npm/pip/cargo installs | high | accept | This plan installs no package; the only dev dependencies are the existing locked ones. |
</threat_model>

<verification>
- Task 1: RED, then green. The scratch smoke shows the live-run state in `--check` and in install's closing line.
- Task 2: RED at the listed doc sites, then zero findings. The mutation proofs report their planted lines.
- Task 3: the retired wordings are gone. All gates pass. One full-suite run, compared with B.
- The SUMMARY records:
  - PD-1..PD-6 as applied, and PD-1 and PD-3 for the human;
  - IN-10 closed by the Task 3 edit;
  - the PD-5 residual (a launch claim in free prose has no mechanical check);
  - the moved pins with their dated reasons;
  - the RED transcripts and the full-suite comparison.
</verification>

<success_criteria>
- WR-05: no `--check` launch line, and no shipped doc row or command sentence, gives the GitHub Copilot CLI launch without `UNKNOWN - verify`. Pi's launch file is described as appended to the system prompt.
- WR-06: the verified host set and the date appear only in per-host rows and sections, and each one is checked two-sided against HOST_TOOLS.
- WR-10: verifiedLive is a LiveRun with hostVersion null on every verified row. The note says "host version not recorded". The OpenCode `--agent` finding is attributed to a human on an unrecorded version everywhere.
- IN-14: the doc comments and the doc cells say, per kind, what a human saw.
- Gates green. The full suite has no new failure keys except board-watch-live. Three commits on main.
</success_criteria>

<output>
Create `.planning/quick/261019-ktd-review-wr-05-wr-06-wr-10-in-14-live-run-/261019-ktd-SUMMARY.md` when done (do not commit it; the orchestrator does).
</output>
