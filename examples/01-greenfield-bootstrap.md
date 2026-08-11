# Example: Greenfield bootstrap

> Real run — captured 2026-06-03

This is the REAL bootstrap slice of the dogfood, not an illustration. A fresh, throwaway sample
app was created **outside this repo** — a minimal TypeScript + Node + Fastify service (grugops's
greenfield default stack) already answering `GET /health`. grugops was installed onto it via the
portable `AGENTS.md` sequential path, then the Orchestrator ran the frozen
`00-bootstrap-greenfield` flow: idea → Greenfield Mapper → AGENTS.md Scribe → BA/PM →
System Analyst → Architect/Design → first ticket → seeded board + trace. The ticket→PR slice that
follows from here is captured in `examples/03-ticket-to-pr.md`.

---

## Input

```text
/grugops "bootstrap this version-reporting API as greenfield and propose a safe first ticket"
```

## Install (sequential AGENTS.md path)

grugops was installed FROM this repo INTO the sample using the install harness's env overrides
(no pollution of either repo):

```text
GRUGOPS_SRC=<grugops repo> TARGET=<sample dir> INSTALL_MODE=copy sh install/install.sh
```

That laid down the `AGENTS.md` substrate, the standalone `.claude/skills/grugops*` adapters, the
`grugops-orchestrator` sub-agent wrapper, and the `CLAUDE.md`/Gemini/Copilot pointers. The kit
body the pointers reference (`agent-factory/`, `plans/`, `memory-bank/`) was copied in via the
documented "just install the markdown" minimal path. The installer **never** set the deploy
approval env var — only a human may.

## Orchestrator decision

The Orchestrator read `factory.config.json` (`mode=lean · cadence=kanban · autonomy=pr`,
`default_stack` = ts/node-fastify/vue) and the empty board first, then classified:

```markdown
# Orchestrator Decision
## Request type
greenfield-bootstrap — stand up the project plane for the version-reporting API.
## Mode/Cadence/Autonomy in effect
mode=lean · cadence=kanban · autonomy=pr
## Activated agents
Greenfield Mapper, AGENTS.md Scribe, BA/PM, System Analyst, Architect/Design
## Why
grug start with idea, not with bloat — shape the idea, write the substrate, cut one safe ticket.
## Required inputs
the raw idea; factory.config.json (mode/cadence/default_stack); a near-empty repo
## Workflow
00-bootstrap-greenfield.md
## Board moves
seed the 13 columns + WIP limits; first ticket lands in Ready for Dev
## Expected handoffs
product-handoff.md; system-handoff.md; architecture-handoff.md
## Stop conditions
idea too vague to map -> stop and request clarity (it was clear, so this did not fire)
## Next action
Greenfield Mapper shapes the idea into memory-bank/greenfield-plan.md
```

## Board moves (real)

The board was seeded with the 13 frozen columns and the config WIP limits, then the first ticket
landed in `Ready for Dev`:

```text
## Ready for Dev (WIP 1/6)
- [ABC-001] GET /version endpoint  (size: XS, priority: P2, since: 2026-06-04)

## In Development (WIP 0/3)
```

## Expected files and published notes (real, produced on the sample)

The bootstrap produced these REAL files on the sample tree:

- `memory-bank/greenfield-plan.md` — the shaped idea / plan of record (Greenfield Mapper).
- `AGENTS.md` — command slots filled with the sample's **real verified** commands by the Scribe
  (`npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`). In this
  minimal sample `lint`, `typecheck`, and `build` are all wired to `tsc --noEmit -p tsconfig.json`
  (the only static check present — there is no separate linter or build step), and the Scribe
  recorded that honestly rather than inventing an `eslint`/build command. The genuinely
  unverifiable slots — single-file eslint/prettier autofix, the formatter, and e2e — were honestly
  left `UNKNOWN - verify`, never fabricated.
- `memory-bank/50-decisions/ADR-0001-version-endpoint-inline.md` — the structural decision.
- `plans/tickets/ABC-001.md` — the first ticket (status/column in lockstep with the board).

The three analysis roles each recorded a result for the next role to read. **Clear voice — this
paragraph is a correction, not an aside.** This run was captured on 2026-06-03, when a role
recorded that result as a static file under a shared handoff directory. Phase 24 deleted those
seventeen templates and replaced the relay with the **shared verified context**, so the same three
results are now published as typed notes under `.grugops/context/ABC-001/notes/` through
`scripts/context-io.ts`, per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`). The
old filenames are gone; the results are not, and they are what the next role reads:

- **BA/PM** publishes a `decision` note — user value, acceptance criteria, size XS, priority P2.
- **System Analyst** publishes a `decision` note — the `GET /version` request/response contract
  (`200 { "version": string }`, `APP_VERSION` override).
- **Architect/Design** publishes a `decision` note — inline route, no new module; seeds NFR-001.

No role hands its output to the next one. Each pulls the verified context, does the work, and
publishes back into it; a `finding` is admitted only with a real `§14-gate#<id>` or `human:<name>`
stamp, and anything softer is recorded honestly as a `claim` or an `observation`.

A representative slice of the greenfield plan (not a full dump):

```markdown
# Greenfield plan — version-reporting API
## First slice (smallest credible change)
add one endpoint (GET /version) on the existing app, with tests.
## Plan of record
1. Bootstrap the project plane.  2. Cut ABC-001.  3. Drive it idea→PR (04 → 05).
```

## Trace + done

`plans/traceability.md` was seeded with the first ticket's row, and `plans/nfr-catalog.md` got
NFR-001:

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-001 | GET /version endpoint | EPIC-001 | FEAT-001 | NFR-001 | — | — | — | — | Ready for Dev |

The bootstrap is done: `AGENTS.md`, the memory-bank + greenfield-plan, the three published notes,
the first ticket, the seeded board, and the config are all present. `node
scripts/validate-agent-factory.mjs` exits 0 (`ALL CHECKS PASSED`) on the resulting sample tree,
bare and `--strict`. From here the ticket→PR slice is captured in `examples/03-ticket-to-pr.md`.
