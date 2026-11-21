---
phase: quick-261018-vfm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
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
autonomous: true
requirements: [LAUNCH-LIVE-01]

estimate:
  tokens: 220000
  raw_tokens: 220000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "No tracked file outside .planning/ offers the OpenCode command-line launch flag form. OpenCode's launch form is a pick of `grugops-orchestrator` in the `/agents` panel, in the registry, install's closing line, `--check`, README.md, install/README.md, adapters.md and the CHANGELOG [Unreleased] entry (human live-run report, 2026-10-18)."
    - "The registry types each launch form explicitly as a `command` or a `panel` pick (LaunchForm.kind). `--check` words a command form `a session started with <command>` and a panel form `a session where you pick `grugops-orchestrator` in the `/agents` panel`; install's closing line words a panel form `pick `grugops-orchestrator` in the `/agents` panel to run the session as the Orchestrator`. No message string-hacks one shape into the other."
    - "Antigravity CLI (panel), OpenCode (panel) and Pi (`--append-system-prompt`) carry the dated note `verified live by a human on 2026-10-18` in the registry (LaunchForm.verifiedLive), in install's closing line, and in each host's docs. GitHub Copilot CLI and the `agy --agent` flag stay `UNKNOWN - verify`."
    - "Next to every verified note, whether a session started that way follows the kit route to the role files stays `UNKNOWN - verify`. Pi's `[Context]` list is recorded as showing that the file loaded, not that the route was followed."
    - "OpenCode's Tab fallback stays only with its source (opencode.ai/docs/agents/, retrieved 2026-10-18). The caveat about OpenCode's version `--help` output is replaced by the fact the human observed: OpenCode does not support starting a session with `--agent`."
    - "The full non-e2e suite is run exactly once, at the end. Against the committed base list, only `scripts/board-watch-live.test.ts` keys may be new."
  artifacts:
    - path: install/host-tools.ts
      provides: "LaunchForm {kind, text, verifiedLive}; launchSession, launchInvoke, launchLiveNote; the four launch rows as the human reported them"
      contains: "verifiedLive"
    - path: install/install.ts
      provides: "kitRouteFindings step (f) worded by launchSession; agentClosingLines' generic line naming forms verified live"
      contains: "launchSession"
    - path: install/host-tools.test.ts
      provides: "independent per-kind wording oracle, and a dated pin of the human's 2026-10-18 report"
    - path: install/host-entry-docs.test.ts
      provides: "two-sided check: a usage section carries launchLiveNote exactly when its row is verified live"
    - path: install/README.md
      provides: "OpenCode, Antigravity CLI and Pi usage sections with the dated notes; touch list, closing notes and kit-route bullet updated"
    - path: README.md
      provides: "Start a session rows and post-table paragraph with the dated notes"
  key_links:
    - from: install/install.ts kitRouteFindings step (f)
      to: install/host-tools.ts launchSession
      via: "the launch-file ok/FAIL/WARN/note lines"
      pattern: "launchSession\\(host\\)"
    - from: install/install.ts launchClosingClause
      to: install/host-tools.ts launchInvoke
      via: "the per-agent closing line"
      pattern: "launchInvoke\\(h\\)"
    - from: install/host-entry-docs.test.ts usage-section loop
      to: install/host-tools.ts LaunchForm.text and launchLiveNote
      via: "backticked tokens and the dated note, derived from the registry"
      pattern: "launchForm\\?\\.text"
---

<objective>
Record the human's 2026-10-18 live-run results for the launch agents that quick task 261018-hs8 added, without claiming more than was observed.

- OpenCode does not support the command-line `--agent` launch. Its launch form becomes a pick of `grugops-orchestrator` in the `/agents` panel, which the human verified live.
- The launch-form shape (a shell command, or a pick in a panel) becomes explicit in the registry type, so `--check` (hs8 D-06) and install's closing line (hs8 WR-03) word each shape correctly.
- Antigravity CLI (panel), OpenCode (panel) and Pi (flag) carry the dated note "verified live by a human on 2026-10-18". Copilot CLI and `agy --agent` stay `UNKNOWN - verify`. Whether any launched session follows the kitRoot route stays `UNKNOWN - verify` everywhere.

Purpose: the trace is the proof (CLAUDE.md, No fabrication). The docs currently offer a launch form the host does not accept, and they mark three verified behaviours as unknown.

Output: the LaunchForm type and helpers in install/host-tools.ts (rebuilt .js), the install.ts consumers (rebuilt .js), updated tests, and updated docs. This supersedes the OpenCode wording of hs8 D-05. The D-06 wording "a session started with <launch form>" stays for command forms and gains its panel counterpart, as the human directed on 2026-10-18.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-SUMMARY.md
@.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-CONTEXT.md

## The human's live-run report (2026-10-18). This is the source of truth for this plan.

1. **Antigravity CLI: VERIFIED live.** Picking `grugops-orchestrator` in the `/agents` panel works. `agy --agent grugops-orchestrator` stays `UNKNOWN - verify`.
2. **OpenCode.** The command-line `--agent` launch is NOT supported ("at least not anymore"). It was VERIFIED live that the `/agents` panel lists `grugops-orchestrator` and that selecting it works.
3. **Copilot CLI: still `UNKNOWN - verify`.** The human skipped it.
4. **Pi: VERIFIED live.** `pi --append-system-prompt .pi/grugops-orchestrator.md` loads the file. Pi's `[Context]` lists `.pi/grugops-orchestrator.md`, `~/AGENTS.md` and `AGENTS.md`.

None of the reports covers whether the session then follows the kitRoot route to the role files. That stays `UNKNOWN - verify` on every host.

## Facts checked while planning (2026-10-18, at HEAD a1a54649)

- **opencode.ai/docs/agents/ (retrieved 2026-10-18)** says: "You can use the **Tab** key to switch between primary agents during a session." So the Tab fallback is sourced and may stay. The page does not mention an `/agents` panel or a `--agent` flag. The panel's only source is the human's live run.
- **opencode.ai/docs/cli/ (retrieved 2026-10-18)** still lists `--agent` ("Agent to use") for the default command and for `opencode run`. The human found that the default command does not support it, so the docs give the observed fact and do not offer the flag. Nothing was observed about `opencode run`, so the docs say nothing about it.
- **Every site of the retired OpenCode flag form.** These are what `git grep` finds outside `.planning/`:
  - CHANGELOG.md:135
  - README.md:64 (the OpenCode row)
  - agent-factory/packaging/adapters.md:38
  - install/README.md:479 (touch list), :565 (closing-notes example) and :807 (OpenCode usage section)
  - install/host-tools.ts:308, and install/host-tools.js:233
  - The comment about OpenCode's version `--help` output is at install/host-tools.ts:305-307 (and the .js) and in install/README.md:808-810.
  - examples/01-greenfield-bootstrap.md does NOT carry the form. Its lines 42-47 name only the launch-file paths and point to the "Using grugops on" sections. Leave it unchanged and record that in the SUMMARY.
- **The launchForm consumers today.**
  - Product code: install/host-tools.ts (`launchInvoke`, :686) and install/install.ts. In install.ts these are kitRouteFindings step (f) at :2035, which builds the session phrase, and launchClosingClause at :7654.
  - Tests: host-tools.test.ts :316 and :1340-1353; kit-route.test.ts :3276-3296, :3402-3403, :3424 and :3435; host-entries.test.ts :189 and :230; host-entry-docs.test.ts :324.
  - The generator (scripts/generate-host-entries.ts) does not read launchForm, so no generated entry file changes.
- **install/host-tools.ts has NO import, and must gain none.** host-entries-freshness mirrors it as part of the generator's closure (hs8 PLAN, "Mirror closure").
- **tsconfig has `noUnusedLocals`/`noUnusedParameters`.**
- **The generic closing line** is pushed at install.ts:7688, after the per-agent loop in agentClosingLines. It says the forms come from each host's documentation and were not run live. That is now false for the OpenCode panel form. Its only test pin is host-tools.test.ts:323.
- **The usage-section docs test** (host-entry-docs.test.ts:315) requires each sequential host's section to contain every backticked token of its invoke and launch form, a `retrieved 20YY-MM-DD` source, and a literal "`UNKNOWN - verify`". The verified sections keep the route `UNKNOWN - verify`, so they still pass that check.
- **The scratch install command shape** below was run on HEAD while planning. Install exited 0, and `--check` printed the launch line.
- **README claim anchors** C-28-001..009 do not cover the "Start a session" table or the paragraph after it (anchors at README.md:42 and :70 bracket them). So no docs/audit/28-claim-registry.md row moves. Check this before editing: `node scripts/check-claim-anchors.js` must stay 47/47 byte-identical.

## Prose rules for every edit

- **Rule B** (install/host-tools-prose.test.ts): no block (a paragraph, a whole table, a run of list items, a TS comment paragraph) may name exactly 4 of the 5 sequential short names: Codex, Antigravity, OpenCode, Copilot, Pi. Names are case-sensitive and word-bounded. A paragraph that names the three verified hosts and Copilot must also name Codex, for example with "Codex CLI has no launch agent."
- **Rule A:** no count word before a host noun ("three hosts", "4 CLIs").
- **Codex invocation scan** (host-entry-docs.test.ts): a sentence naming Codex must not contain the slash-command spelling of grugops. Put "Codex CLI has no launch agent." in its own sentence.
- README.md must not contain "understand" or "comprehension". The README table starts at column 0.
- Clear voice. These are capability statements: no caveman voice and no hedged claims.
- Never write that a launched session reaches or follows the Orchestrator route. Say only what was observed: the panel lists the agent and picking it works, and Pi's `[Context]` lists the file.

## Testing approach (the human's standing rule)

- **While coding, run only the related test files:** install/host-tools.test.ts, install/host-entry-docs.test.ts, install/host-tools-prose.test.ts, install/kit-route.test.ts, install/host-entries.test.ts, install/install.test.ts, scripts/check-banned-claims.test.ts, scripts/check-public-docs-vocabulary.test.ts, scripts/check-claim-anchors.test.ts and scripts/model-dial-consistency.test.ts. Add install/message-references.test.ts, because its MSG-1 census counts install.ts message fragments.
- **Also run what `npx vitest related` names for the changed .ts files**, once, at the end of Task 1. About 30 test files import host-tools.js, so run it in the background and wait for it.
- **Run the full suite exactly once, at the end of Task 2:** `npx vitest run --exclude '**/scripts/e2e/**'`. NEVER run `npm test`, which starts the live claude-CLI e2e lane.
- **Compare against the committed base list** `B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt` (21 keys). Only `scripts/board-watch-live.test.ts` keys may be new; that file is the known timing flake (backlog 999.11).
- **Scratch dir:** `S="${TMPDIR:-/tmp}/grugops-261018-vfm"`, then `mkdir -p "$S"`.
  - The comparison script is `$S/failures.mjs`. Copy it from `${TMPDIR:-/tmp}/grugops-261018-hs8/failures.mjs` when that file exists. Otherwise re-create it from the spec in the hs8 PLAN.md "Execution: one task per executor dispatch" section (lines 169-173).
  - Before relying on it, run its self-test: `keys` on a missing report exits 2, and `keys` on `{"numTotalTests":0,"testResults":[]}` exits 2.
- **Scratch installs** set both GRUGOPS_HOME and HOME to directories under `$S`; without them, a run overwrites the real ~/.grugops kit. Nothing is written under `.temp/`.
- **Work sequentially on main.** Create no branch and push nothing. Stage files by name, never with `git add -A`. Every commit ends with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Moved pins

A moved pin carries a dated reason line (2026-10-18, quick task 261018-vfm) in the file's existing comment style. No assertion is removed or weakened. Where an expectation changes, the new one is at least as discriminating as the old one.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): explicit command-or-panel launch form, OpenCode as a panel pick, end to end through --check, the closing line and the OpenCode usage section</name>
  <files>install/host-tools.ts, install/host-tools.js, install/install.ts, install/install.js, install/host-tools.test.ts, install/kit-route.test.ts, install/host-entries.test.ts, install/host-entry-docs.test.ts, install/README.md</files>
  <read_first>
    - install/host-tools.ts lines 40-92 (HostTool), 129-168 (launch path constants), 263-356 (the Antigravity, OpenCode, Copilot and Pi rows), 655-688 (routeCarriers, launchCarriers, launchInvoke)
    - install/install.ts lines 185-200 (the host-tools import list), 1862-1875 (the step (f) header comment), 2031-2062 (step (f)), 7629-7690 (agentClosingLines, launchClosingClause and the generic closing line)
    - install/host-tools.test.ts lines 30-60 (imports), 300-326 (closing-lines case), 1318-1354 (D-06 and WR-03 registry cases)
    - install/kit-route.test.ts lines 20-30 (imports), 3274-3300, 3380-3440
    - install/host-entries.test.ts lines 160-235
    - install/host-entry-docs.test.ts lines 300-332
    - install/README.md lines 793-838 (Using grugops on OpenCode)
  </read_first>
  <behavior>
    - The registry pin: OpenCode's and Antigravity CLI's launchForm.kind is `panel` with verifiedLive `2026-10-18`. Copilot CLI's is `command` with verifiedLive null. Pi's is `command` with verifiedLive `2026-10-18`. RED before the type exists.
    - launchSession of a command row is `a session started with ` + text. Of a panel row it is `a session where you pick ` + text. It is null exactly when launchAgent is null.
    - launchInvoke of a command row is `start the session as the Orchestrator with ` + text. Of a panel row it is `pick ` + text + ` to run the session as the Orchestrator`. Either one is followed by ` (verified live by a human on <date>)` when verifiedLive is set.
    - A panel row's text is exactly the backticked LAUNCH_AGENT_NAME, then ` in the `, then the backticked `/agents`, then ` panel`. It names no command-line flag (no token starting with `--`).
    - `--check` after an `--opencode` scratch install prints `a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (OpenCode)`. Install's closing line offers the panel clause with the dated note.
  </behavior>
  <action>
**Step 0. Start gate.** Do this before any edit.
- Set S and B as the context section defines them, and run `mkdir -p "$S"`.
- Copy or re-create `$S/failures.mjs`, then run its self-test.
- Check that `git status --porcelain` shows nothing outside this quick-task directory, and that `git branch --show-current` prints `main`.

**Step 1. RED.** In install/host-tools.test.ts, before touching product code:
- Import `launchSession` and `launchLiveNote` next to `launchInvoke`.
- Replace the WR-03 registry case at ~1340 with an independent per-kind oracle. Build each expected string from the row's own `launchForm.kind`, `.text` and `.verifiedLive`, with the literal prefixes and suffixes given in the behavior block. Never build them by calling the helper under test.
  - Keep its existing checks, now applied to `.text`: the text is backticked; it names LAUNCH_AGENT_NAME or the launch path; it is absent from invoke, and so is each backticked token naming LAUNCH_AGENT_NAME or the launch path.
  - Add: a panel row's text equals the exact panel text and holds no token starting with two hyphens; a command row's text starts with a backtick.
  - Add: verifiedLive is null or matches `^\d{4}-\d{2}-\d{2}$`.
- Add a case that pins the human's live-run report. Map each launch row's id to `[kind, verifiedLive]` and compare it to a literal: antigravity `["panel","2026-10-18"]`, opencode `["panel","2026-10-18"]`, copilot `["command",null]`, pi `["command","2026-10-18"]`. Give it a dated comment citing the human's live-run report of 2026-10-18 (quick task 261018-vfm).
- Run `npx vitest run install/host-tools.test.ts`. The new cases must fail. Record the RED output for the SUMMARY.

**Step 2. Registry (install/host-tools.ts). Add no import.**
- Add an exported interface `LaunchForm` with three readonly fields:
  - `kind: "command" | "panel"`;
  - `text: string`;
  - `verifiedLive: string | null`.
- Its doc comment says:
  - Why the shape is explicit: a host takes its launch file either on the command line (`command`: the backticked command as the host gives it, plus any condition such as "from the repository root") or as a pick in a panel inside a running session (`panel`: the backticked agent name in the backticked panel). The kind, not the text, decides the verb of every message.
  - What verifiedLive holds: the date a human started a session that way on the live host and saw the launch file load, or null when no live run was made (then it is `UNKNOWN - verify`).
  - That verifiedLive never covers the kit route: whether such a session follows the route to the role files is `UNKNOWN - verify` on every host.
- Change `HostTool.launchForm` to `LaunchForm | null`, still null exactly when launchAgent is null. Rewrite its doc comment:
  - launchSession words `--check`'s launch-file findings (hs8 D-06, with the panel wording the human gave on 2026-10-18);
  - launchInvoke words install's closing clause (hs8 WR-03);
  - install/README.md's usage sections are checked to name each backticked token of `text`.
- **Antigravity CLI row:** `{ kind: "panel", text: <the panel text>, verifiedLive: "2026-10-18" }`. The panel text renders as `` `grugops-orchestrator` in the `/agents` panel ``, built from LAUNCH_AGENT_NAME.
  - Comment: the source (antigravity.google/docs/subagents/, retrieved 2026-10-18); that a human verified the pick live on 2026-10-18 (quick task 261018-vfm); and that agy 1.3.5 `--help` lists `--agent`, but whether it resolves a workspace agent file is UNKNOWN - verify.
- **OpenCode row:** `{ kind: "panel", text: <the same panel text>, verifiedLive: "2026-10-18" }`. This is the hs8 D-05 OpenCode wording superseded by the human's report.
  - Rewrite the comment above launchAgent, and the comment above launchForm, to say four things:
    - the `/agents` panel lists the agent and picking it works (verified live by a human on 2026-10-18);
    - opencode.ai/docs/cli/ (retrieved 2026-10-18) lists an `--agent` flag for the default command, but the same human found that OpenCode does not support starting a session with it, so no command form is given;
    - Tab cycles primary agents in a session (opencode.ai/docs/agents/, retrieved 2026-10-18);
    - install/README.md names Tab as the other in-session way.
  - Remove the sentence about OpenCode's version `--help` output.
- **Copilot CLI row:** `{ kind: "command", text: <its current backticked command>, verifiedLive: null }`. Comment: no live run; the human skipped it on 2026-10-18, so it is UNKNOWN - verify.
- **Pi row:** `{ kind: "command", text: <its current text, the backticked command followed by " from the repository root">, verifiedLive: "2026-10-18" }`. Comment: a human verified on 2026-10-18 that Pi loads the file, because Pi's `[Context]` listed `.pi/grugops-orchestrator.md`, `~/AGENTS.md` and `AGENTS.md`. That shows the file loaded, not that the session follows the kit route (UNKNOWN - verify).
- **Helpers, next to launchCarriers:**
  - `launchLiveNote(host): string | null` returns `verified live by a human on <verifiedLive>`, or null.
  - `launchSession(host): string | null` returns the per-kind phrase from the behavior block.
  - Rewrite `launchInvoke(host)` to return the per-kind clause, then ` (` + launchLiveNote + `)` when the note is not null.
  - Update the doc comments of launchCarriers and launchInvoke so that they name launchSession.

**Step 3. install/install.ts.**
- Import launchSession in the host-tools import list.
- In kitRouteFindings step (f), set the session phrase to launchSession(host). Keep the existing fallback for a null form: "a session started with" followed by the backticked rel.
- Update the step (f) header comment (~1870) to say the line is worded by launchSession: "a session started with" for a command form, "a session where you pick" for a panel form.
- Replace the generic closing sentence (the one pushed after the per-agent loop in agentClosingLines) with exactly this text after the indent: `These invocation forms come from each host's documentation or, for a form marked verified live, from a human's run on the live host; grugops has not run the others on a live host (UNKNOWN - verify), and whether a session started with a launch form then follows the kit route is UNKNOWN - verify on every host.`
- Update the agentClosingLines doc comment (~7637) to match.
- launchClosingClause needs no change, because it calls launchInvoke.

**Step 4. Tests that read launchForm.** No test may interpolate the LaunchForm object into a string, or pass it straight to `toContain`. A coerced object would make a `not.toContain` check pass vacuously. The Task 1 verify greps every `.ts` file for the field name followed directly by a closing brace or parenthesis, with or without a non-null `!`. At HEAD a1a54649 it matches 7 lines: host-entries.test.ts:189 and :230, host-tools.ts:687, and kit-route.test.ts:3289, :3403, :3424 and :3435. Comments must not put the field name in that position either.
- **host-tools.test.ts closing-lines case (~305-326):**
  - The ending check stays derived from launchInvoke.
  - Move the pin on the generic line so that it filters for `grugops has not run the others on a live host (UNKNOWN - verify)`, with `toHaveLength(1)`.
  - Assert that the same line contains `verified live` and `follows the kit route is UNKNOWN - verify`.
  - Add a dated reason: a human's live run verified launch forms on 2026-10-18, and the OpenCode panel form comes from that run, not from documentation. Do not quote the retired sentence.
  - Update the comment at ~712 to name both wordings.
- **kit-route.test.ts:**
  - Import launchSession.
  - launchLineOf asserts launchSession(h) is not null, then asserts the line contains it.
  - Add a local helper `formText(h)` that asserts the row's launch form is not null and returns its `.text`. Use it for the closing-line `toContain` and `not.toContain` checks at ~3403, ~3424 and ~3435.
  - In the user's-own-file and refused cases, also assert that the line does not contain launchInvoke(h).
  - Update the comment at ~3276 and the D-06 premise wording.
- **host-entries.test.ts (~189, ~230):** assert that the launch line contains launchSession(agy), and launchSession(h). Add a not-null premise assertion first. Update the comment at ~205.
- **host-entry-docs.test.ts (~324):** take the tokens from `t.launchForm?.text`.

**Step 5. The far end for OpenCode: install/README.md "Using grugops on OpenCode" only.**
- In the "Starting the session as the Orchestrator" paragraph, keep the file and frontmatter sentences. Replace the command-line start sentence, the version caveat and the Tab sentence with this:
  - Start OpenCode at the repository root and pick `grugops-orchestrator` in the `/agents` panel. This was verified live by a human on 2026-10-18: the panel lists `grugops-orchestrator`, and picking it works.
  - opencode.ai/docs/cli/ (retrieved 2026-10-18) lists an `--agent` flag for the default command, but the same human found that OpenCode does not support starting a session with it, so this guide gives no command-line form.
  - In a running session, Tab also cycles through primary agents (opencode.ai/docs/agents/, retrieved 2026-10-18), so you can Tab to `grugops-orchestrator` too.
  - Whether a session started that way then follows the kit route to the role files is `UNKNOWN - verify`.
- Keep the "Install leaves OpenCode's default agent as it is" sentence and the sequential role-load sentence.
- In the "What is not known" bullet, reword "a session started as the `grugops-orchestrator` agent" to "a session where you pick the `grugops-orchestrator` agent".

**Step 6. Build and run.**
- `npm run build`, then run the related list and the scratch smoke from verify.
- Then run, once, in the background: `npx vitest related --run install/host-tools.ts install/install.ts --reporter=json --outputFile=$S/related.json`. Compare it with `node $S/failures.mjs new "$B" $S/related.json`. Only base keys or board-watch-live keys are allowed.
- Commit with the subject `fix(quick-261018-vfm): launch forms are a command or a panel pick, OpenCode via the /agents panel`.
  </action>
  <verify>
    <automated>S="${TMPDIR:-/tmp}/grugops-261018-vfm" && B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt && test -f "$S/failures.mjs" && test -s "$B" && npm run build && npm run check:build-parity && npm run typecheck && npm run freshness:host-entries && ! git grep -q 'opencode --agent' -- install/host-tools.ts install/host-tools.js install/install.ts install/install.js && ! git grep -q 'v2.0.28' -- install/host-tools.ts install/host-tools.js && OC="$(awk '/^### Using grugops on OpenCode/,/^### Using grugops on GitHub Copilot CLI/' install/README.md | tr '\n' ' ' | tr -s ' ')" && test -n "$OC" && ! printf '%s' "$OC" | grep -qE 'opencode --agent|v2[.]0[.]28' && printf '%s' "$OC" | grep -q 'verified live by a human on 2026-10-18' && printf '%s' "$OC" | grep -q 'opencode.ai/docs/agents/' && ! git grep -qE 'launchForm!?[})]' -- '*.ts' && ! git grep -q 'has not run them on a live host' -- install/install.ts install/install.js install/host-tools.test.ts && npx vitest run install/host-tools.test.ts install/host-entry-docs.test.ts install/host-tools-prose.test.ts install/kit-route.test.ts install/host-entries.test.ts install/install.test.ts install/message-references.test.ts scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts && SC="$S/smoke" && rm -rf "$SC" && mkdir -p "$SC/target" "$SC/home" "$SC/kit" && INSTALL_MODE=copy GRUGOPS_SRC="$PWD" GRUGOPS_HOME="$SC/kit" HOME="$SC/home" TARGET="$SC/target" node install/install.js --yes --opencode --pi > "$SC/install.log" 2>&1 && grep -qF 'pick `grugops-orchestrator` in the `/agents` panel to run the session as the Orchestrator (verified live by a human on 2026-10-18)' "$SC/install.log" && grep -qF 'from the repository root (verified live by a human on 2026-10-18)' "$SC/install.log" && GRUGOPS_HOME="$SC/kit" HOME="$SC/home" node install/install.js --check --target "$SC/target" > "$SC/check.log" 2>&1 && grep -qF 'a session where you pick `grugops-orchestrator` in the `/agents` panel reads it (OpenCode)' "$SC/check.log" && grep -qF 'a session started with `pi --append-system-prompt .pi/grugops-orchestrator.md` from the repository root reads it (Pi)' "$SC/check.log"</automated>
  </verify>
  <done>
    - The registry holds LaunchForm {kind, text, verifiedLive} on all four launch rows, as the human reported them, and the dated pin case is green. Its RED output is recorded.
    - `--check` and the closing line word each kind correctly, as the scratch smoke shows (scratch GRUGOPS_HOME and HOME).
    - The committed .js are fresh and build-parity passes.
    - No `.ts` file interpolates or passes the LaunchForm object as a string.
    - The OpenCode usage section gives the panel pick with the dated note, the sourced Tab fallback, the human's `--agent` observation, and the route as `UNKNOWN - verify`.
    - The related-test run, and the one `npx vitest related` run, add no failure key outside B except board-watch-live keys.
    - One commit on main.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: the live-run results in every other doc, a two-sided docs test, then the gates and the one full-suite run</name>
  <files>README.md, install/README.md, agent-factory/packaging/adapters.md, CHANGELOG.md, install/host-entry-docs.test.ts, install/host-tools.test.ts</files>
  <read_first>
    - README.md lines 57-68 (Start a session table and the paragraph after it)
    - install/README.md lines 460-482 (the Antigravity and OpenCode touch-list bullets), 546-569 (the live-session paragraph and the closing-notes paragraph), 668-682 (the kit-route launch-files bullet), 755-792 (Using grugops on Antigravity CLI), 900-915 (the Pi launch-file bullet)
    - agent-factory/packaging/adapters.md lines 37-40 (the host rows)
    - CHANGELOG.md lines 130-149 (the [Unreleased] launch-agents bullet)
    - install/host-entry-docs.test.ts lines 300-332
    - install/host-tools.test.ts lines 709-722
  </read_first>
  <behavior>
    - A usage section whose row has verifiedLive contains launchLiveNote(row). A usage section whose row has none (Codex CLI, GitHub Copilot CLI) does not contain `verified live by a human`. RED for the Antigravity CLI and Pi sections until their notes land.
    - The kit-route section of install/README.md contains both `a session started with` and `a session where you pick`.
  </behavior>
  <action>
**Step 0. Start gate.** Do this before any edit.
- Set S and B, then check that `$S/failures.mjs` exists, or re-create it and run its self-test.
- Check that Task 1's commit is in history: capture `git log --format=%s` into a variable first, then grep it with `-qxF` for Task 1's subject.
- Read `git show --stat HEAD`.

**Step 1. RED.**
- In install/host-entry-docs.test.ts, inside the usage-section loop, add the two-sided check from the behavior block. Import launchLiveNote from ./host-tools.js. The negative literal `verified live by a human` lives in the test only.
- In install/host-tools.test.ts, in the kit-route section case (~712-722), add the `a session where you pick` expectation next to the existing one.
- Run both files. They fail on the Antigravity CLI and Pi sections and on the kit-route bullet. Record that output.

**Step 2. README.md.** Keep the table at column 0 and keep the Claude Code, Codex CLI and GitHub Copilot CLI rows byte-identical. Columns are "How to start" and "Talks to the Orchestrator directly?".
- **Antigravity CLI row.**
  - How to start: unchanged.
  - Second column: "Picked in the panel, the launch agent is the session's main agent (verified live by a human on 2026-10-18), and it points the session at the Orchestrator role. Otherwise the skill points the session at the Orchestrator role. Roles load one at a time."
- **OpenCode row.**
  - How to start: "Start OpenCode at the repository root and pick `grugops-orchestrator` in the `/agents` panel, or Tab to it. In any session: `/grugops <request>`."
  - Second column: "Picked in the panel (verified live by a human on 2026-10-18) or reached with Tab, the launch agent is the session's main agent, and it points the session at the Orchestrator role. Otherwise the command points the session at the Orchestrator role. Roles load one at a time."
- **Pi row.**
  - How to start: unchanged, including the trust warning.
  - Second column: "With the flag, Pi loads the launch file into its system prompt (verified live by a human on 2026-10-18), and the file points the session at the Orchestrator role. Otherwise the prompt template points the session at the Orchestrator role. Roles load one at a time."
- **The paragraph after the table.** Replace its last sentence with these:
  - "Whether a live run on a host CLI other than Claude Code follows that route is `UNKNOWN - verify`, in a default session and in one started with a launch agent; see `install/README.md`, section "How a host finds the kit after a scripted install"."
  - "Loading the launch agent was verified live by a human on 2026-10-18 on Antigravity CLI and OpenCode (picked in the `/agents` panel) and on Pi (with `--append-system-prompt`); on GitHub Copilot CLI it is `UNKNOWN - verify`."
  - "Codex CLI has no launch agent." This keeps all five short names in one block (Rule B).

**Step 3. install/README.md.**
- **OpenCode touch-list bullet (~478).** Its launch description becomes: OpenCode's launch agent, a primary agent you pick in the `/agents` panel (see "Using grugops on OpenCode").
- **The live-session paragraph (~549).** After its first sentence, add two sentences:
  - The launch agents of Antigravity CLI and OpenCode, picked in the `/agents` panel, and Pi's launch file, passed with `--append-system-prompt`, load in a live session: verified live by a human on 2026-10-18.
  - GitHub Copilot CLI's launch agent is still `UNKNOWN - verify`, and whether a session started with any launch file then follows the kit route is `UNKNOWN - verify`.
- **The closing-notes paragraph (~563-569).**
  - The launch-form example becomes "for example `copilot --agent grugops-orchestrator`, or picking `grugops-orchestrator` in the `/agents` panel".
  - Its last sentence becomes: a launch form a human ran on the live host is marked "verified live by a human on 2026-10-18" in the notes; grugops has not run the other invocations on a live host, and the notes say `UNKNOWN - verify`, as they do for whether a session started with a launch form follows the kit route.
- **The kit-route launch-files bullet (~677).** Change "worded "a session started with" that host's launch form" to: worded "a session started with" that host's launch command, or "a session where you pick" the agent in the `/agents` panel, for a host whose launch form is a pick in that panel. Name no host in this bullet (Rule B).
- **Using grugops on Antigravity CLI.** After the "(Source: antigravity.google/docs/subagents/, retrieved 2026-10-18.)" sentence, add: Picking `grugops-orchestrator` in the `/agents` panel was verified live by a human on 2026-10-18; whether a session started that way then follows the kit route to the role files is `UNKNOWN - verify`. Keep the agy flag sentence as `UNKNOWN - verify`.
- **Using grugops on Pi.** In the "Starting Pi as the Orchestrator" bullet, replace its last sentence (a live Pi session started this way reaching the Orchestrator is unknown) with:
  - Starting Pi this way was verified live by a human on 2026-10-18: Pi's `[Context]` list named `.pi/grugops-orchestrator.md`, `~/AGENTS.md` and `AGENTS.md`.
  - That shows Pi loaded the file; whether the session then follows the kit route to the Orchestrator is `UNKNOWN - verify`.
  - Keep the bold trust warning (review WR-02) unchanged.
- **The Copilot CLI section stays unchanged.**

**Step 4. agent-factory/packaging/adapters.md.** One table, so Rule B sees all five names.
- **Antigravity CLI row.** After its subagents source, add "; picking it there was verified live by a human on 2026-10-18".
- **OpenCode row.** Its launch-agent clause becomes:
  - a primary agent you pick in the `/agents` panel (verified live by a human on 2026-10-18; a human found the same day that OpenCode does not support starting a session with `--agent`),
  - or reach with Tab in a session (opencode.ai/docs/agents/, retrieved 2026-10-18).
- **Pi row.** After its resource-loader source, add "; verified live by a human on 2026-10-18, when Pi's `[Context]` list named the file".
- **The Copilot row is unchanged.**

**Step 5. CHANGELOG.md [Unreleased] launch-agents bullet. Edit it in place; add no new bullet.**
- The OpenCode parenthetical becomes "(picked in the `/agents` panel, or with Tab in a session)".
- Replace the final clause about every live run with these sentences:
  - "A session started this way still loads roles one at a time."
  - "A human verified live on 2026-10-18 that the launch agent loads on Antigravity CLI and OpenCode (picked in the `/agents` panel) and on Pi (with the flag), and install's closing notes mark those forms "verified live by a human on 2026-10-18"."
  - "GitHub Copilot CLI and the `agy --agent` flag are `UNKNOWN - verify`, and so is whether a session started with a launch file follows the kit route."
  - "OpenCode does not support starting a session with `--agent`, so no command-line form is given for it."

**Step 6. Checked, not edited.**
- examples/01-greenfield-bootstrap.md carries no launch form. Leave it unchanged and record that in the SUMMARY.
- Leave hs8's planning artifacts unchanged, because they are history.

**Step 7. Gates and the one full-suite run.**
- Run the related list and the gates in verify. If check-claim-anchors reports a changed anchored paragraph, stop: the plan assumed none is touched.
- Run the full suite once, in the background, and wait for it.
- Record:
  - the new keys against B;
  - check-diff-disposition's finding count, against 59 (measured, not gated);
  - the RED outputs;
  - the moved pins.
- Write `.planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-SUMMARY.md`.
- Commit with the subject `docs(quick-261018-vfm): launch-agent live-run results of 2026-10-18`. Stage files by name.
  </action>
  <verify>
<!-- planner-discipline-allow: verified live -->
    <automated>S="${TMPDIR:-/tmp}/grugops-261018-vfm" && B=.planning/quick/261018-hs8-launch-agent-adapters-for-opencode-copil/261018-hs8-BASE-FAILURES.txt && test -f "$S/failures.mjs" && test -s "$B" && npm run build && npm run check:build-parity && npm run typecheck && npm run freshness && npm run freshness:host-entries && node scripts/check-banned-claims.js && node scripts/check-claim-anchors.js && node scripts/check-public-docs-vocabulary.js && node scripts/check-kit-refs.js && node scripts/check-nul-bytes.js && node scripts/check-foundation-guards.js && ! git grep -q 'opencode --agent' -- ':!.planning' && ! git grep -q 'v2.0.28' -- ':!.planning' && ! git grep -qE 'launchForm!?[})]' -- '*.ts' && for h in 'Antigravity CLI' 'OpenCode' 'Pi'; do grep -E "^\| \*\*$h\*\* \|" README.md | grep -q 'verified live by a human on 2026-10-18' || exit 1; done && grep -qE '^\| \*\*GitHub Copilot CLI\*\* \|' README.md && ! grep -E '^\| \*\*GitHub Copilot CLI\*\* \|' README.md | grep -q 'verified live' && for f in README.md install/README.md agent-factory/packaging/adapters.md CHANGELOG.md; do grep -q 'project-trust' "$f" || exit 1; done && test -z "$(ls -A .temp 2>/dev/null)" && npx vitest run install/host-tools.test.ts install/host-entry-docs.test.ts install/host-tools-prose.test.ts install/kit-route.test.ts install/host-entries.test.ts install/install.test.ts scripts/check-banned-claims.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-claim-anchors.test.ts scripts/model-dial-consistency.test.ts && { npx vitest run --exclude '**/scripts/e2e/**' --reporter=json --outputFile="$S/after.json" >/dev/null 2>&1 || true; } && test -s "$S/after.json" && { node "$S/failures.mjs" new "$B" "$S/after.json" > "$S/new.txt"; test $? -le 1; } && ! grep -v '^#' "$S/new.txt" | grep -v '^scripts/board-watch-live.test.ts :: ' | grep -q .</automated>
  </verify>
  <done>
    - **README.md.** The Antigravity CLI, OpenCode and Pi rows carry the dated note, and the Copilot CLI row does not. The post-table paragraph keeps the route `UNKNOWN - verify` and names all five hosts.
    - **install/README.md.** It carries:
      - the Antigravity CLI and Pi notes, with the route kept `UNKNOWN - verify`;
      - the OpenCode panel bullet;
      - the closing-notes rule, with its new example;
      - both `--check` wordings.
    - **adapters.md and the CHANGELOG [Unreleased] entry** match the human's report.
    - **The two-sided docs test** is green and was RED first.
    - **No tracked file outside .planning/** names the retired OpenCode flag form or the version caveat.
    - **Every gate exits 0.** check-diff-disposition is measured and reported.
    - **The one full-suite run** adds no failure key outside B except board-watch-live keys.
    - **The SUMMARY records** the RED outputs, the moved pins, the related-run and full-run keys, the smoke lines and examples/01 as checked-not-edited.
    - **One commit on main.**
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| registry text → user-facing install and `--check` output | the launch form and its verification note reach the user's terminal as instructions to follow |
| docs → user | the docs tell a user which launch form a host accepts and what was verified live |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-vfm-01 | Repudiation | LaunchForm.verifiedLive and the docs notes (a fabricated or over-broad verification claim) | high | mitigate | verifiedLive is set only on the rows the human reported, and a dated test pins it to that report (Task 1). The docs test is two-sided: a section carries the note exactly when its row is verified (Task 2). Every note sits next to the route `UNKNOWN - verify`. Pi's `[Context]` is recorded as a file load, not a route |
| T-vfm-02 | Spoofing | install's closing line offering a panel form for a user's own file at the launch path | medium | mitigate | launchClosingClause's ownership rule (hs8 WR-03) is unchanged. The user's-own-file and refused-write cases in kit-route.test.ts run over every launch row, panel rows included, and now also assert the absence of launchInvoke(h) |
| T-vfm-03 | Information Disclosure | Pi's `--append-system-prompt`, which reads the file without Pi's project-trust check | medium | mitigate | The hs8 WR-02 warning stays in README.md, install/README.md, adapters.md and CHANGELOG.md. The Task 2 verify greps each file for it |
| T-vfm-04 | Tampering | users following a launch form the host rejects (the retired OpenCode flag) | low | mitigate | A repo-wide `git grep` over everything outside .planning/ (Task 2 verify) shows that no shipped file offers the form |
| T-vfm-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs no package and adds no dependency. package.json and the lockfile are untouched |
</threat_model>

<verification>
- Task 1 recorded the per-kind oracle and the report pin RED before product code changed. Task 2 recorded the two-sided docs test RED before the docs changed.
- After each task: `npm run build && npm run check:build-parity && npm run typecheck`, and `npm run freshness:host-entries`, exit 0. No generated host entry changes, because the generator does not read launchForm.
- The scratch smoke (GRUGOPS_HOME and HOME under `$S`) shows the panel and command wordings in both the closing line and `--check`.
- The gates exit 0: check-banned-claims, check-claim-anchors (47/47), check-public-docs-vocabulary, check-kit-refs, check-nul-bytes and check-foundation-guards. check-diff-disposition is measured against 59 and reported, not gated.
- The full suite ran exactly once (`npx vitest run --exclude '**/scripts/e2e/**'`, never `npm test`). Its new keys against B are board-watch-live keys only.
- `.temp/` is empty. `git status` shows only files_modified and the SUMMARY. There are two commits on main, with no branch and no push.
</verification>

<success_criteria>
- OpenCode's launch form is a pick in the `/agents` panel everywhere it is shown, and the retired command-line flag form is gone from shipped files.
- The launch form's shape is a typed field (`command` or `panel`). Every message derives its verb from that field: `--check`'s "a session started with" or "a session where you pick", and the closing line's "start the session as the Orchestrator with" or "pick ... to run the session as the Orchestrator".
- The Antigravity CLI panel, the OpenCode panel and the Pi flag say "verified live by a human on 2026-10-18". Copilot CLI and `agy --agent` say `UNKNOWN - verify`. The kit route stays `UNKNOWN - verify` on every host.
- The Tab fallback keeps its source, and the version caveat is replaced by the human's observation.
- No assertion was weakened, and each moved pin carries a dated reason.
</success_criteria>

<output>
Create `.planning/quick/261018-vfm-launch-agent-live-run-results/261018-vfm-SUMMARY.md` when done. Include:
- both RED outputs;
- the moved pins with their reasons;
- the scratch-smoke closing and `--check` lines;
- the `npx vitest related` run and the full-run failure keys against B;
- check-diff-disposition against 59;
- examples/01-greenfield-bootstrap.md as checked and not edited;
- the observation that opencode.ai/docs/cli/ still lists `--agent` while the human found it unsupported.
</output>
