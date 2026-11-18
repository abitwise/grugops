# Example: Greenfield bootstrap

> Illustrative run — expected output, not a captured session
>
> Based on a real run captured 2026-06-03 on v1.0; updated to v3 by hand. The original capture is
> in commit [ab0cda98](https://github.com/abitwise/grugops/commit/ab0cda98416c24310c02c180cb2a917889d413e6).

This walks `agent-factory/workflows/00-bootstrap-greenfield.md` on a fresh sample: a small
TypeScript + Node + Fastify service (the default stack in `.grugops/factory.config.json`) that
already answers `GET /health`. IDs, note ids, names and dates are placeholders. The flow is
`idea -> Orchestrator -> Greenfield Mapper -> AGENTS.md Scribe -> BA/PM -> System Analyst ->
Architect/Design -> first ticket`. The ticket-to-PR slice that follows is
`examples/03-ticket-to-pr.md`.

---

## Install

From a grugops checkout, install for Claude Code into the sample:

```text
node ~/grugops/install/install.js --target /path/to/sample --claude
```

The shared kit lands in `~/.grugops`, and `.grugops/install.json` names its root in the `kitRoot`
field. Only per-repo files are written into the sample:

- `AGENTS.md`, with every command slot at `UNKNOWN - verify`, and a start-here pointer in
  `CLAUDE.md`.
- The Claude Code agents under `.claude/agents/`, among them `grugops-orchestrator`,
  `grugops-tech-lead` and the three engineer levels, the `/grugops` skills under
  `.claude/skills/`, and ask rules in `.claude/settings.json`.
- `.grugops/factory.config.json`, the config dial.
- The seeded state: `memory-bank/` with `memory-bank/plans/board.md`, the empty `tickets/`,
  `epics/`, `features/`, `nfr/` and `traceability/` folders, `nfr-catalog.md`, `traceability.md`
  and `metrics.md`.
- The runnables under `tools/grugops/`, among them `note.js`, `claim.js`, `trace-render.js` and
  `state-check.js`.

Other hosts take one flag each; `install/README.md` lists them.

## Input

Start the session from the sample with the Orchestrator as the main thread:

```text
claude --agent grugops-orchestrator
```

Other hosts start differently; see the [start table](../docs/usage.md#start-a-session). Then type the request:

```text
bootstrap this version-reporting API as greenfield and propose a safe first ticket
```

## Orchestrator decision

The Orchestrator reads `.grugops/factory.config.json` (`mode=lean`, `cadence=kanban`,
`checkpoints.open_pr=block`, `default_stack` TypeScript, Node and Fastify) and the empty board,
then writes its decision:

```markdown
# Orchestrator Decision
## Request type
greenfield-bootstrap — stand up the project plane for the version-reporting API.
## Mode/Cadence/Checkpoints
mode=lean · cadence=kanban · checkpoints.open_pr=block
## Activated agents
Greenfield Mapper, AGENTS.md Scribe, BA/PM, System Analyst, Architect/Design
## Why
Shape the idea, confirm the commands, then cut one small, safe ticket.
## Required inputs
the raw idea; .grugops/factory.config.json; a near-empty repo; memory-bank/00-index.md
## Workflow
00-bootstrap-greenfield.md
## Board moves
the first ticket walks Backlog -> Ready -> In Analysis -> In Design -> Ready for Dev
## Expected notes
BA/PM: product decisions. System Analyst: the behavior. Architect/Design: the structure, ADR and NFR.
## Stop conditions
idea too vague to map -> stop and ask the requester
## Next action
Queue a subtask for the Greenfield Mapper to shape the idea.
```

Each role runs as a queued subtask that the Orchestrator claims with `node tools/grugops/claim.js`
and closes with `claim.js done`, as `examples/03-ticket-to-pr.md` shows. Each role reads the
shared context first with `node tools/grugops/note.js read abc-001`. No role hands its output to
the next one.

## The plan and the substrate

The Greenfield Mapper writes `memory-bank/greenfield-plan.md`, the plan of record. A slice:

```markdown
# Greenfield plan — version-reporting API
## First slice (smallest credible change)
add one endpoint (GET /version) on the existing app, with tests.
## Plan of record
1. Bootstrap the project plane.  2. Cut ABC-001.  3. Drive it to a pull request (Workflows 04 and 05).
```

The AGENTS.md Scribe works on the root `AGENTS.md` the install laid down. It fills a command slot
only after running the command in the sample: `npm install`, `npm run lint`, `npm run typecheck`,
`npm test` and `npm run build`. The sample has no separate linter or build step, so `lint`,
`typecheck` and `build` all run `tsc --noEmit -p tsconfig.json`, and the Scribe records that
rather than inventing an `eslint` or build command. The formatter and e2e slots stay
`UNKNOWN - verify`.

## Product, behavior and structure

BA/PM splits the idea into `EPIC-001` and `FEAT-001` and writes the first ticket to
`memory-bank/plans/tickets/ABC-001.md`, with the epic and feature beside it under
`memory-bank/plans/epics/` and `memory-bank/plans/features/`. The ticket's frontmatter:

```markdown
---
id: ABC-001
title: GET /version endpoint
status: ready-for-dev
column: Ready for Dev
size: XS
priority: P2
epic: EPIC-001
feature: FEAT-001
---
```

The frontmatter above is the ticket at the end of the bootstrap. Its body holds the user value
and the acceptance criteria. BA/PM publishes its product decisions as a `decision` note, with the
trace ids on its refs:

```text
$ node tools/grugops/note.js add abc-001 --kind decision --by ba-pm --confidence high \
    --ref ABC-001 --ref EPIC-001 --ref FEAT-001 --body-file /tmp/abc-001-product.md
noted abc-001 20260604T090000Z-ba-pm-decision-3b4c5d6e
```

The System Analyst publishes a `decision` note with the response contract: `200
{ "version": string }`, with an `APP_VERSION` override. Its refs carry `ABC-001`.

Architect/Design decides to add the route inline in `src/app.ts`, with no new module. It writes
`memory-bank/50-decisions/ADR-0001-version-endpoint-inline.md`, seeds
`memory-bank/plans/nfr/NFR-001.md` and adds its line to `memory-bank/plans/nfr-catalog.md`:

```text
- [NFR-001](nfr/NFR-001.md) performance: GET /version p95 under 300 ms
```

It publishes a `decision` note whose refs carry `ABC-001`, `ADR-0001` and `NFR-001`.

## The board

The board ships seeded with its columns and the WIP limits from the config. `ABC-001` walks the
early columns as each owner signs off, and lands in `Ready for Dev`. The board keeps one line
per ticket; the detail stays in the ticket file:

```text
## Ready for Dev (WIP 1/6)
- [ABC-001] GET /version endpoint  (owner: Orchestrator, since: 2026-06-04)

## In Development (WIP 0/3)
```

## The rendered trace

Before the bootstrap commit, the Orchestrator renders the trace from the published note refs and
checks the state:

```text
$ node tools/grugops/trace-render.js .
Rendered the trace: 1 task(s) and 3 note(s) read; skipped notes: unparseable 0, unopenable 0, not-a-regular-file 0, above-ceiling 0, vanished 0, unsealed 0; unreadable tasks 0; 2 file(s) written, 0 file(s) removed.
$ node tools/grugops/state-check.js .
...
No findings.
```

The rendered `memory-bank/plans/traceability/ABC-001.md`, shown here as output:

```markdown
<!-- GENERATED by grugops trace-render from published note refs — do not hand-edit -->
# Trace: ABC-001

## Requirement

- EPIC-001
- FEAT-001
- ADR-0001
- NFR-001

## Code

None recorded.

## Tests

None recorded.

## UAT

None recorded.

## Release

None recorded.
```

The index `memory-bank/plans/traceability.md` gains one line for the ticket:
`| ABC-001 | [ABC-001](traceability/ABC-001.md) |`.

## Done, and the human step

The bootstrap is done: `AGENTS.md` with its confirmed commands, `memory-bank/greenfield-plan.md`,
the three published notes, the epic, the feature and the first ticket, the ADR and the NFR, the
board with `ABC-001` in `Ready for Dev`, the rendered trace and `.grugops/factory.config.json`.

The Orchestrator commits these files on the branch `grugops/bootstrap-greenfield-abc-001`, never
on a protected branch, and stops. Sam, the sample's maintainer, reviews the branch and decides
whether to merge it. In this run, no agent merged and no agent deployed. From here, `examples/03-ticket-to-pr.md`
drives `ABC-001` to a pull request.
