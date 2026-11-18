---
status: complete
phase: 43-story-and-layered-docs
source: [43-13-PLAN.md, 39-UAT.md tests 10 and 14, 43-READER-REVIEW.md]
started: 2026-11-18T08:40:11Z
updated: 2026-11-18T13:45:25Z
---

# Phase 43 milestone UAT: Phase 39 tests 10 and 14

ROADMAP Phase 43 success criterion 6. Decision D-24: Claude runs both checks headless in a scratch repository and
keeps the evidence; the human reads it and decides by typed name. Requirements under test: TIER-01 and TIER-02 (a
level is reached only when the Tech Lead's plan names it) and TIER-05 (the Designer's note is admitted).

## Current Test

[testing complete]

## Tests

### 10. Auto-delegation honors the level descriptions (live)

expected: On a live Claude Code host, unscored work is never auto-delegated to a level adapter (junior, mid or
senior). Each level is reached only when the Tech Lead's plan names it.
result: accepted (human decision 2026-11-18, option A: the six runs answer the question; the limits stated below are
accepted)
evidence: `uat-evidence/test10-runs.md`
source_ref: 39-UAT.md test 10 (39-11 D3)

Three unscored requests, each run once in a default session and once with `--agent grugops-orchestrator`: six headless
runs, each in its own fresh scratch repository. The transcripts hold 19 `Agent` spawns of role adapters, all of them
standalone `grugops-<role>` adapters. `spawnObservations` found nested frames for every one, so headless output did
show each spawn decision and no live-session runbook is needed. A level adapter was reached in four runs: mid in runs 1,
2 and 6 (three times in run 6), and junior in run 4. Each of those spawns came after a Tech Lead spawn had completed and
published a `decision` note naming that exact adapter ("Level: mid. Adapter: grugops-software-engineer-mid." and
"Level: junior. Adapter: grugops-software-engineer-junior."). The Orchestrator also ran
`claim.js claim … --level <level>` before each spawn. Run 3 (default, "fix the typo in README.md") spawned nothing: the
session made the fix itself. Run 5 (default, "implement ticket ABC-001") spawned only BA/PM, then stopped when the
scoped grant refused the work branch. No run spawned a level adapter before a Tech Lead plan named it, and no run
reached senior. Limits: run 6 was stopped at the executor's 20-minute bound (exit 143) while its third mid engineer was
working, so its later spawns are not observed. The runs used the scoped grant `capture-live.ts` uses. It refused the
work branch in runs 1, 2, 4 and 5 and `npm` in runs 1, 2 and 4 (from each run's list of denied calls; run 6 ended with
no result frame, so its list is not available), and no ticket reached a pull request. The runs show the Orchestrator's choice of adapter.
They do not show Claude Code picking a level adapter on its own from the description, because no session handed work to
an unnamed subagent.

### 14. Designer note is admitted on a live host

expected: In the same scratch repo, spawn grugops-designer and have it publish a design note. It reaches
scripts/context-io.js through Bash, and the note is admitted, not refused as unsealed.
result: accepted (human decision 2026-11-18, option A: accepted with the route reworded from `scripts/context-io.js`
to `tools/grugops/note.js`, the generated copy of the writer a scripted install ships; a separate scratch repository
set up the same way is acceptable. The `expected:` line above is left as written; the rewording is this decision's)
evidence: `uat-evidence/test14-designer-note.md`
source_ref: 39-UAT.md test 14 (live designer)

One headless run on the orchestrator route, in its own fresh scratch repository. The Orchestrator spawned
`grugops-designer` (jsonl:250, nested frames). The Designer ran by Bash
`node tools/grugops/note.js add uat-design-001 --kind decision --by designer … --body-file …` (jsonl:484). The writer
printed `noted uat-design-001 20261118T085838Z-designer-decision-a7388b5a` (jsonl:495). `authorStamps` over the
scratch context lists that note with `by: designer`, the role name. The executor's own
`node tools/grugops/note.js read uat-design-001` after the run printed `2 current, 0 superseded, 0 skipped`, so the
note is admitted and nothing was skipped as unsealed. `noteRoute` counts no direct or indirect context write and no
`propose_note` call. The route is `tools/grugops/note.js`, not `scripts/context-io.js`. A scripted install does not copy
`scripts/context-io.js` into a host repository. Workflow 16 says `tools/grugops/note.js` carries a generated copy of
that writer. Whether this route meets the test's wording is the human's call. The test says "the same scratch repo";
this run used its own repository made the same way, so no test 10 note shared its context.

## Reader-review findings handed to this UAT

Plan 43-12's reader review (`43-READER-REVIEW.md` § Findings) left six findings `UNKNOWN - verify` for this UAT. Each is
a judgment, not a check a command can run. The human's decision of 2026-11-18 (below) settled five; F-11 stays open
for a fresh reader. None of the rewordings is made in this plan.

- **F-07:** reword the two anchored `always` safety sentences, C-28-001 (docs/concepts.md) and C-28-023
  (agent-factory/README.md), both measured `overstated`, or keep them as published? result: reword both sentences (human decision
  2026-11-18); a follow-up in `deferred-items.md`, not done in this plan
- **F-08:** keep `single-job "grug" agents` in C-28-001 and C-28-022, or move the brand word out of the core
  description? result: keep `single-job "grug" agents` (human decision 2026-11-18)
- **F-09:** reword C-28-033's "every shipped change is accountable end to end" and "exactly what it needs" in
  docs/how-it-works.md (the second clause was kept by a human decision on 2026-11-04)? result: reword the first
  clause, for example toward "leaves a trail from requirement to release"; keep "exactly what it needs" (human
  decision 2026-11-18); a follow-up in `deferred-items.md`, not done in this plan
- **F-10:** bring docs/skills.md and install/README.md into the claim registry's anchored set? result: yes, bring both pages into the registry (human decision 2026-11-18); a follow-up in
  `deferred-items.md`, not done in this plan
- **F-11:** does a newcomer read the story as intended (README → concepts → how it works → usage → an example)?
  result: deferred to a fresh reader; the human did not answer it
- **F-12:** change the generator's `Loaded by the Orchestrator in turn` row on the Orchestrator's own reference page,
  and name workflows for the Compliance Officer and Installer pages? result: fix in the generator (human decision
  2026-11-18); a follow-up in `deferred-items.md`, not done in this plan

## Other observations

- **The host's `npm test` fails on a fresh install.** With `"test": "node --test"`, Node's default test glob also runs
  the installed `tools/grugops/test-skip-integrity.js`, which exits with a usage error, so the suite fails before any
  change is made. The executor reproduced this on a pristine scratch repository: 2 tests, 1 pass, 1 fail, the failing
  one `tools/grugops/test-skip-integrity.js`. It blocked run 6's engineer and run 2's final test step. It is outside
  this plan and is logged in `deferred-items.md`.
- **The user-scope `grugops` plugin loads in these sessions.** The `system/init` frame lists it. In run 4 the
  Orchestrator used the plugin's `propose_note` tool twice, besides `tools/grugops/note.js`. Every spawn named a
  standalone adapter.
- **The grant shaped the outcomes.** The `capture-live.ts` grant (`Bash(node *)` and an `Edit` rule scoped to the
  repository) refused the `git` branch command in runs 1, 2, 4 and 5 and `npm` in runs 1, 2 and 4. That is why no
  ticket run reached a pull request. It is a property of the test grant, not a product failure.

## Environment

- Claude Code 2.1.325, headless (`claude -p … --output-format stream-json --verbose --include-hook-events
  --forward-subagent-text --permission-mode default --allowedTools <the capture-live.ts grant>`), model
  `claude-opus-5-5` in every `system/init` frame. Node v26.12.1.
- Kit 2.2.0 (`agent-factory/VERSION`), installed from this checkout at `52c73a2c` with
  `GRUGOPS_HOME=<scratch>/kit-home node install/install.js --yes --claude --target <repo>`.
- Scratch layout, all outside this checkout: `<scratch>/kit-home` (the scratch kit home), `<scratch>/uat-repo` (run 1),
  `<scratch>/copies/<run>/uat-repo` (runs 2 to 6 and test 14), each a fresh `git init` with the same install and the same
  seed: a small Node app (`GET /health` and its test, `package.json` at 0.1.0) and the ticket ABC-001 (`GET /version`)
  with no `## Tech Lead plan`. `<scratch>` is the executor's session scratch directory, not under the user's home.
- The user's own kit home was not used and was not modified: its directory time is from 2026-11-12, and no file in it
  is newer than the session.
- The driver that ran and parsed the transcripts stayed in the executor's scratch space. It imports the committed
  `scripts/capture-live.js` (`parseFrames`, `spawnObservations`, `noteRoute`, `authorStamps`, `redactText`,
  `homeSpellings`). No transcript is committed; the excerpts in `uat-evidence/` are redacted.

## Human decision

Reply 1 (2026-11-18), verbatim:

> Test 10 - A. Accept ; Test 14 - A. Accept, route reworded to tools/grugops/note.js ; Optional F-07..F-12 use your recommended path.

The reply did not end with a typed name, so the human was asked to end it with one. Reply 2 (2026-11-18), verbatim:

> add my name, i approve

Acceptance: accepted by Olger — name added by the agent at Olger's instruction ("add my name, i approve",
2026-11-18); the name was not typed in the reply.

Confirmation by typed name (2026-11-18). The phase security audit found T-43-41 open because neither reply above ended
with a typed name; the human was asked to type it, choosing between typing it (option A) and accepting the waiver as a
risk (option B). Reply 3, verbatim:

> T-43-28 A, T-43-41 A, redact yes. Olger

Acceptance (typed): accepted by Olger, 2026-11-18, confirming tests 10 and 14 and the picks as recorded above.

What the picks mean (the options as they were put to the human):

- **Test 10, option A (accept):** the six runs answer the question. No level adapter was reached before a Tech Lead
  plan named it. The limits are accepted: run 6 was cut at 20 minutes, the grant refused `git` branch and `npm` so no
  ticket reached a pull request, and no session handed work to an unnamed subagent.
- **Test 14, option A (accept, route reworded):** the test's route reads `tools/grugops/note.js` (the generated copy of
  the writer a scripted install ships) in place of `scripts/context-io.js`. A separate scratch repository set up the
  same way is acceptable.
- **F-07..F-12, the recommended path:** F-07 reword the two `always` safety sentences (C-28-001, C-28-023); F-08 keep
  `single-job "grug" agents`; F-09 reword the first clause of C-28-033 ("every shipped change is accountable end to
  end", for example toward "leaves a trail from requirement to release") and keep "exactly what it needs" (kept by a
  human decision on 2026-11-04); F-10 bring docs/skills.md and install/README.md into the claim registry; F-12 fix
  in the generator (the Orchestrator page's `Loaded by the Orchestrator in turn` row, and named workflows for the
  Compliance Officer and Installer pages). F-11 was not answered and is deferred to a fresh reader. F-07, F-09, F-10
  and F-12 are follow-ups in `deferred-items.md`; none is done in this plan.
