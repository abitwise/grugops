# Phase 43 — Reader review (D-22) and phase gate

Plan 43-12, 2026-11-18. The literal gates (check-claim-anchors, check-audit-register,
check-public-docs-vocabulary, check-banned-claims, check:story-docs) catch words and anchors. This
review reads every new or changed public page for the overstatement those gates cannot see. Each cell
is `pass`, `fixed: <what>`, or `UNKNOWN - verify: <why>`. An `UNKNOWN - verify` cell is not a pass; it
names a judgment this executor could not settle and hands it to plan 43-13's UAT. No cell is marked
`pass` for a reader-only judgment (item 10).

## Checklist

1. No cost, token, speed or efficiency benefit, stated or implied (C-28-047, Pitfall 13: "cheaper",
   "fast", "efficient", "saves").
2. No merge or deploy outcome stated as guaranteed beyond what the registry measures (C-28-023:
   `always` is overstated).
3. Parallel work only with the GAP-D1 sentence.
4. No typed role or host count.
5. Every absolute anchored and registered.
6. No grug voice outside the art, attribution and brand answers.
7. Host-neutral where it should be, and `$grugops` for Codex.
8. No live run claimed that did not happen (`UNKNOWN - verify` kept).
9. Plain English per agent-factory/writing-profile.md.
10. The story reads as intended for a newcomer (the unclassified STORY-01 probe; a judgment, not a
    pass).

How each item was read: items 1, 3, 4, 6, 7 and 8 by a case-insensitive search over every page
(cost and speed words; `parallel`, `concurren`, `at once`; a number or number word before roles,
hosts or agents; `grug` and `caveman`; `codex`; `verified live`, `captured`, `live run`), then a read
of every hit in context. Items 2 and 5 by a search for `always`, `never`, `only`, `every`,
`guarantee` and `No agent`, then a read of each hit against the registry row that anchors it, if any.
Items 9 and 10 by reading each page top to bottom.

## Pages

| Page | 1 cost | 2 merge/deploy | 3 parallel | 4 counts | 5 absolutes | 6 voice | 7 hosts | 8 live runs | 9 plain | 10 newcomer |
|---|---|---|---|---|---|---|---|---|---|---|
| README.md | pass | pass | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/README.md | pass | pass | pass | pass | fixed: the reference line claimed a page per workflow (F-01) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/concepts.md | pass | UNKNOWN - verify: C-28-001 keeps `Humans always hold merge and deploy`, anchored and measured `overstated` (F-07) | pass | pass | pass | UNKNOWN - verify: `single-job "grug" agents` in C-28-001 (F-08) | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/how-it-works.md | pass | pass | pass | pass | UNKNOWN - verify: C-28-033 `exactly what it needs` and `accountable end to end` (F-09) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/usage.md | pass | fixed: `merge and deploy stay with you` (F-02) | pass | pass | fixed: two moved absolutes registered as C-28-073 and C-28-074 (F-05) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/faq.md | pass | pass | pass | pass | pass | pass | pass | pass | fixed: the enterprise answer's list sentence split (F-03) | UNKNOWN - verify: reader judgment (F-11) |
| docs/skills.md | pass | pass | pass | pass | UNKNOWN - verify: unregistered absolutes outside the registry's set (F-10) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| examples/01-greenfield-bootstrap.md | pass | fixed: `No agent merges, and no agent deploys.` (F-04) | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| examples/02-brownfield-bootstrap.md | pass | fixed: `No agent merges, and no agent deploys.` (F-04) | pass | pass | fixed: `The kit never fabricates a command` (F-06) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| examples/03-ticket-to-pr.md | pass | fixed: `No agent merges, and no agent deploys.` (F-04) | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| examples/04-sprint-cycle.md | pass | fixed: `No agent merges.` (F-04) | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| examples/05-release-run.md | pass | pass | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| agent-factory/README.md | pass | UNKNOWN - verify: C-28-023 `always hold merge and deploy`, anchored and measured `overstated` (F-07) | pass | pass | pass | UNKNOWN - verify: `single-job "grug" agents` in C-28-022 (F-08) | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/reference/README.md | pass | pass | pass | pass: `19 roles and 7 skills` is derived by the generator and held by `freshness:catalog`, not typed | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/reference/agents/orchestrator.md | pass | pass | pass: `Never run more role agents at once than queue.wip_limit` is a role limit copied from the role file, not a claim of parallel work | pass | pass | pass | UNKNOWN - verify: `Loaded by the Orchestrator in turn` on the Orchestrator's own page (F-12) | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| docs/reference/agents/software-engineer.md | pass | pass | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| install/README.md (the paragraphs phase 43 changed) | pass | pass | pass | pass | UNKNOWN - verify: unregistered absolutes outside the registry's set (F-10) | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |
| CHANGELOG.md (the Unreleased lines plan 43-12 added) | pass | pass | pass | pass | pass | pass | pass | pass | pass | UNKNOWN - verify: reader judgment (F-11) |

Notes on the `pass` cells that a reader might question:

- Item 2, docs/how-it-works.md: the heading `## A person merges and deploys` names the step in the flow;
  its only paragraph (C-28-054) says the rule is written text and names the git host as the hard
  floor. The README bullet that links it reads `A person decides on merge and deploy`.
- Item 2, examples/05: `No agent merged, and no agent deployed.` is past-tense narration of the run,
  after the release record says only the named human's confirmation protects the deploy.
- Item 3, docs/how-it-works.md: `up to queue.wip_limit at a time` links § Open gaps, which carries the
  GAP-D1 sentence (C-28-055).
- Item 8: every `verified live` cell (usage start table, Orchestrator reference page) names the date
  and the host version from install/README.md; Copilot CLI keeps `UNKNOWN - verify: no live run`.
  Examples 01 and 03 say `Illustrative run — expected output, not a captured session`, and the
  2026-06-03 line names the commit that holds the capture. No page claims the own-session spawn
  capture is verified.

## Findings

**F-01 — docs/README.md claimed a reference page for every workflow.** Fixed in `4ec7c2ba`. The
reference has a page per role and per skill and one table of the workflows.
- Before: `- [Reference](reference/README.md): a page for every role, skill and workflow.`
- After: `- [Reference](reference/README.md): a page for every role and skill, and a table of the workflows.`

**F-02 — docs/usage.md stated the merge and deploy outcome as fact.** Fixed in `4ec7c2ba`. The
sentence moved from README.md in plan 43-10 (it was unanchored there too, disposition
`docs/audit/29-style-dispositions/33-09.md`).
- Before: `Each one starts at the Orchestrator and ends at a pull request or a human approval; merge and deploy stay with you.`
- After: `Each one starts at the Orchestrator and ends at a pull request or a human approval; the workflows tell the agent to leave merge and deploy to you.`

**F-03 — docs/faq.md's enterprise answer opened with one long list sentence.** Fixed in `4ec7c2ba`;
C-28-072's verbatim and mechanism were re-measured in the same commit. No fact changed.
- Before: `It has the parts a regulated team asks for: a config dial whose enterprise mode runs the release and incident workflows, security and compliance roles, a release that waits for a named person's approval at the default checkpoint setting, and a trace from requirement to code, test and release.`
- After: `It has the parts a regulated team asks for. The config dial's enterprise mode runs the release and incident workflows, and there are security and compliance roles. A release waits for a named person's approval at the default checkpoint setting, and the trace links each requirement to its code, tests and release.`

**F-04 — examples 01 to 04 closed with a present-tense rule that reads as a guarantee.** Fixed in
the commit that adds this review. Each sentence now narrates the illustrative run.
- 01, 02 and 03 before: `No agent merges, and no agent deploys.` After: `In this run, no agent merged and no agent deployed.`
- 04 before: `No agent merges.` After: `In this run, no agent merged.`

**F-05 — docs/usage.md carried two absolutes with no registry row.** Fixed in the commit that adds
this review: both paragraphs are anchored and registered as `architecture` rows, measured against
install/README.md § 6 and the installer source. Both moved byte for byte from README.md in plan 43-10,
where they were unanchored too.
- C-28-073: `Why --agent: … Claude Code enforces the list of role agents the Orchestrator may spawn. …`
- C-28-074: `claude --agent grugops-orchestrator needs an install that chose Claude Code … The installer never writes that key, …`

**F-06 — example 02 said the kit never fabricates a command.** Fixed in the commit that adds this
review. No-fabrication is a rule the roles are given, not a mechanism.
- Before: `The kit never fabricates a command; an unverified slot stays UNKNOWN - verify until the Scribe confirms it in this repo.`
- After: `The roles are told never to invent a command; an unverified slot stays UNKNOWN - verify until the Scribe confirms it in this repo.`

**F-07 — two anchored `always` sentences remain: C-28-001 (docs/concepts.md) and C-28-023
(agent-factory/README.md).** `UNKNOWN - verify`, not fixed. Both are `kind: safety` rows the registry
measures `overstated`, disposition `accepted` (F-28-201, F-28-208), and docs/GUARANTEES.md publishes
them at that status. docs/concepts.md qualifies its sentence in § Humans decide (C-28-060) on the same
page. Rewording a safety row changes the safety surface (docs/GUARANTEES.md, the LANG-03 watched
corpus, a disposition row), and C-28-001 moved byte for byte in plan 43-11 by decision. Whether to
reword them is a human call for the 43-13 UAT.

**F-08 — `single-job "grug" agents` in C-28-001 and C-28-022.** `UNKNOWN - verify`, not fixed. The
word is quoted brand vocabulary inside the core description, not caveman voice, and both rows are
anchored (C-28-001 a safety row). Whether the brand word belongs outside the attribution and the FAQ's
brand answers is a human call.

**F-09 — C-28-033 in docs/how-it-works.md: `so every shipped change is accountable end to end` and
`so the next role inherits exactly what it needs`.** `UNKNOWN - verify`, not fixed. Both read as
outcome claims stronger than the rendered trace and Workflow 16 guarantee. The second clause was kept
word for word by a human decision on 2026-11-04 (D-04, recorded in
`docs/audit/29-style-dispositions/41-06.md`), and the block moved byte for byte in plan 43-09. A
reword is a human call for the 43-13 UAT.

**F-10 — docs/skills.md and install/README.md carry absolutes the registry does not cover.**
`UNKNOWN - verify`, not fixed. Examples: `grugops never vendors or installs a skill`, `An install never
writes over a repository's own AGENTS.md` (skills.md), and `It never writes the records that stay in
the checkout there` (install/README.md, added in plan 43-06 and held by
`install/installer-kit-home.test.ts`). The registry's anchored set has never included these two pages.
Whether they join it is a scope call for a human, not a reader-review fix.

**F-11 — item 10, the newcomer read.** `UNKNOWN - verify` on every page. This executor read the pages
in the order README → docs/concepts.md → docs/how-it-works.md → docs/usage.md → an example. The README
story and tagline say what grugops is in four sentences, and each later page links the next. Whether a
newcomer reads the story as intended is the STORY-01 edge probe, and only a reader can answer it; it
goes to the 43-13 UAT with no pass recorded.

**F-12 — the Orchestrator's own reference page says `Loaded by the Orchestrator in turn` on the
sequential hosts.** `UNKNOWN - verify`, not fixed. On those hosts the session itself acts as the
Orchestrator through the skill, command or launch agent, so the row reads oddly on this one page. The
wording is the generator's, fixed by plan 43-14's plan text, and a change is a generator change with
its own tests, outside this plan's files. The Compliance Officer and Installer pages' Workflows cell
reads `UNKNOWN - verify` because no workflow's `## Agents involved` names them; that is honest, and a
human may want to name their workflows (both from plan 43-14).

## Phase gate

Base: `a067c6e6` (43-BASELINE.md). Every command ran once from the repository root on 2026-11-18,
after the page fixes in the commit that adds this review (the working tree held them, staged for
that commit). "Exit" is the real exit code; "Base" is the exit code in 43-BASELINE.md, `—` where the
command is not in that table.

| Command | Exit | Base | Last line |
|---|---|---|---|
| `npm run freshness:catalog` | 0 | 0 | Reference fresh: compared 27 page(s), 0 difference(s); the committed page set under docs/reference/ equals a fresh regeneration. |
| `npm run check:claim-anchors` | 0 | 0 | ALL CHECKS PASSED (74 rows: 70 markdown, 1 unanchorable, 3 retired) |
| `npm run check:audit-register` | 0 | 0 | ALL CHECKS PASSED |
| `npm run check:public-docs` | 0 | 0 | ALL CHECKS PASSED |
| `npm run check:banned-claims` | 0 | 0 | ALL CHECKS PASSED |
| `npm run freshness:guarantees` | 0 | 0 | Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration. |
| `npm run freshness:skill-twins` | 0 | 0 | Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal. |
| `npm run freshness` | 0 | 0 | All build outputs fresh: 93 committed .js file(s) match a rebuild of their sources. |
| `npm run check:build-parity` | 1 before the commit, see below | 0 | Build parity: tracked build outputs that moved when the build ran: 1 finding(s) over 93 elements |
| `npm run check:state-paths` | 0 | 0 | ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | 0 | 0 | ALL CHECKS PASSED |
| `node scripts/check-kit-refs.js` | 0 | 0 | ALL CHECKS PASSED |
| `node scripts/check-flip-manifest.js` | 1 | 1 | 1 CHECK(S) FAILED — the same single FAIL as at base: the flip manifest does not exist at `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` |
| `node scripts/check-diff-disposition.js` | 0 | 0 | ALL CHECKS PASSED (0 findings over 30/30 elements) |
| `npm run check:story-docs` | 0 | — | ALL CHECKS PASSED |
| `npm run freshness:hook-manifest` | 0 | — | Hook manifest fresh: 1 decider(s), 15 module hash(es) match a fresh derivation. |
| `npm run typecheck` | 0 | — | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` |

`check:build-parity` compares the rebuilt `.js` against the committed tree, so it reads the
uncommitted `scripts/check-audit-register.js` (the cardinality move below) as moved. Plans 43-02 and
43-04 met the same order. It is re-run after the commit that adds this review, and that exit code is
recorded in 43-12-SUMMARY.md. The same gate ran at `4ec7c2ba`, before the review's own edits: every
command above exited as at base, `check:build-parity` 0 included.

**Watched corpus (from plan 43-11).** `check-diff-disposition`'s watched set changed in this phase:
README.md left it, because it no longer holds a safety claim, and docs/concepts.md joined it, because
C-28-001 moved there. The gate reports 30 watched elements and 0 findings. No page this plan edited
is in the watched set.

**Pins this plan moved, each value read off its gate's or test's own failure:**

- `SCAN_SET_SIZE` 80 → 85 in scripts/trace-instructions.test.ts (examples/ joined the hand-trace scan,
  commit `7b79b080`).
- `CLAIM_KIND_CARDINALITY` architecture 56 → 58 and `MIRROR_ARCHITECTURE_CLAIMS` 56 → 58 (C-28-071,
  C-28-072, commit `c0726b38`), then 58 → 60 for both (C-28-073, C-28-074, the commit that adds this
  review).
- No foundation-guard pin moved. `scripts/check-foundation-guards.test.ts` failed only on the
  baseline LANG-07 case in the full suite and in the targeted run after the review's edits, and
  43-06-SUMMARY.md § Foundation-guard handoff and 43-15-SUMMARY.md § Foundation-guard handoff each
  say `None`.

**Full suite.** One run of `npx vitest run --exclude '**/scripts/e2e/**' --reporter=json` at
`4ec7c2ba`, 07:35:36Z to 08:03:15Z, default `TMPDIR`. Exit 1. Tests: 12031 total, 12008 passed, 21
failed, 2 skipped. Compared by file and test name with 43-BASELINE.md § Full suite: the 21 failing
tests are exactly the 21 baseline failures, with no new failure and none missing. The review's own
edits after that run (examples 01 to 04, docs/usage.md anchors, the registry rows and the cardinality
pins) were checked with the 16 test files that read those pages or that registry: 1636 tests, 1635
passed, 1 failed, and the one failure is the baseline LANG-07 case. The full suite was not re-run.
