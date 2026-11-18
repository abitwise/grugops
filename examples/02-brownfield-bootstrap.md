# Example: Brownfield bootstrap

> Illustrative run — expected output, not a captured session

This walks `agent-factory/workflows/01-bootstrap-brownfield.md` on an existing repo: an unfamiliar
codebase handed to grugops, mapped and documented, scanned for high risk, then cut into a few safe
first tickets. IDs, note ids, names and dates are placeholders. The flow is
`existing repo -> Orchestrator -> Brownfield Mapper -> AGENTS.md Scribe -> Architect/Design review ->
Security/NFR high-risk scan -> safe first tickets`.

---

## Input

A developer installs grugops into an existing service repo, an aging payments API nobody fully
remembers. The installer is additive: it adds `AGENTS.md` if none exists, `.grugops/`, the seeded
`memory-bank/` and the runnables under `tools/grugops/`, and leaves the existing code alone. On
Claude Code the developer starts the session with the Orchestrator as the main thread:

```text
claude --agent grugops-orchestrator
```

Other hosts start differently; see the [start table](../docs/usage.md#start-a-session). Then the request:

```text
bootstrap this repo as brownfield — map it, write AGENTS.md and the memory-bank,
scan for high-risk areas, and cut only safe first tickets
```

## Orchestrator decision

The Orchestrator classifies the request as `brownfield-bootstrap`, reads
`.grugops/factory.config.json` for the mode, cadence and checkpoints, and writes its decision:

```markdown
# Orchestrator Decision
## Request type
brownfield-bootstrap — adopt an existing repo: map, document, scan for risk, cut safe first tickets.
## Mode/Cadence/Checkpoints
mode=lean · cadence=kanban · checkpoints.open_pr=block
## Activated agents
Brownfield Mapper, AGENTS.md Scribe, Architect/Design, Security/NFR, BA/PM
## Why
Map the repo and scan it for risk before any change lands.
## Required inputs
the existing repository; .grugops/factory.config.json; memory-bank/00-index.md for orientation
## Workflow
01-bootstrap-brownfield.md
## Board moves
the board is seeded with its columns and WIP limits; the safe first tickets enter Backlog
## Expected notes
Security/NFR: the high-risk scan result. Brownfield Mapper: one note per safe first ticket.
## Stop conditions
Security/NFR returns BLOCKED on a high-risk finding; or the repo cannot be mapped
## Next action
Queue a subtask for the Brownfield Mapper to map the repo.
```

Each role runs as a queued subtask that the Orchestrator claims with `node tools/grugops/claim.js`.
The roles share one context folder, `bootstrap`, and each reads it first with
`node tools/grugops/note.js read bootstrap`. No role hands a file to the next one.

## Map and substrate

The Brownfield Mapper walks the repo and writes `memory-bank/brownfield-map.md`: the structure and
the commands it could confirm by running them. A slice:

```markdown
# Brownfield Map
## Structure
- src/charge/        payment intake (Fastify routes)
- src/ledger/        double-entry posting
- test/              partial unit coverage; no e2e harness found
## Confirmed commands
- test:  `npm test`        (runs, 41 passing)
- build: `npm run build`   (runs)
- lint:  UNKNOWN - verify  (no lint script found)
```

The AGENTS.md Scribe writes the root `AGENTS.md`. It fills only the slots it verified, and the
rest stay honest:

```markdown
## Commands
- Test:  `npm test`
- Build: `npm run build`
- Lint:  UNKNOWN - verify
- Deploy: UNKNOWN - verify
```

The roles are told never to invent a command; an unverified slot stays `UNKNOWN - verify` until the Scribe
confirms it in this repo.

Architect/Design reviews the structure and names the risky areas: the `/charge` endpoint accepts
an unvalidated body, and the ledger posting path has no idempotency key. It records them as
constraints for the first tickets.

## The high-risk scan

Security/NFR scans the repo and publishes its result as a `decision` note through the one
sanctioned writer. The risk ids go on the note's refs:

```text
$ node tools/grugops/note.js add bootstrap --kind decision --by security-nfr --confidence high \
    --ref RISK-001 --ref RISK-002 --body-file /tmp/scan.md
noted bootstrap 20260604T091200Z-security-nfr-decision-7c3d8e9f
```

Read back with `note.js read bootstrap`, the note shows its fields and body:

```text
note 20260604T091200Z-security-nfr-decision-7c3d8e9f
  kind: decision
  by: security-nfr
  at: 2026-06-04T09:12:00.000Z
  confidence: high
  refs: RISK-001, RISK-002
  body:
    High-risk scan result: PASS_WITH_RISKS
    - RISK-001 Unvalidated request body on /charge (input validation gap)
    - RISK-002 No idempotency key on ledger posting (double-charge exposure)
    No BLOCKED result: adoption may proceed. No first ticket builds on RISK-002 until it is addressed.
```

The result is a `decision`, the role's own judgment, so it carries no verification stamp and
claims none. A result asserted as measured would be a `finding`, and a `finding` is admitted only
with a real `§14-gate#<id>` or `human:<name>` stamp. A stampless one is refused, never rewritten
into something softer.

The scan returns one of `PASS`, `PASS_WITH_RISKS` or `BLOCKED`. Here it is `PASS_WITH_RISKS`, so
adoption continues. A `BLOCKED` result would stop the flow: no first ticket that builds on a
blocked risk until it is resolved.

## Safe first tickets and the board

BA/PM reads the scan result, then writes three safe first tickets to `memory-bank/plans/tickets/`.
Size and priority sit in each ticket's frontmatter, for example `ABC-002.md`:

```markdown
---
id: ABC-002
title: Pin the unversioned base image in the Dockerfile
status: backlog
column: Backlog
size: XS
priority: P1
---
```

The board `memory-bank/plans/board.md` ships seeded with its columns and the WIP limits from the
config. The first tickets land in `Backlog`, one line per ticket:

```text
## Backlog (WIP unlimited)
- [ABC-001] Add request validation to /charge endpoint  (owner: BA/PM, since: 2026-06-04)
- [ABC-002] Pin the unversioned base image in the Dockerfile  (owner: BA/PM, since: 2026-06-04)
- [ABC-003] Document the known build/test commands in AGENTS.md  (owner: BA/PM, since: 2026-06-04)

## In Security/NFR (WIP 0/2)
```

## The rendered trace

The Brownfield Mapper publishes one `observation` per safe first ticket, naming the ticket among
its refs. The note for `ABC-001` also names `RISK-001`, the risk it answers:

```text
$ node tools/grugops/note.js add bootstrap --kind observation --by brownfield-mapper \
    --confidence high --ref ABC-001 --ref RISK-001 --body "Safe first ticket; answers RISK-001."
noted bootstrap 20260604T093000Z-brownfield-mapper-observation-1f2a3b4c
```

Before the bootstrap commit, the Orchestrator renders the trace from those refs:

```text
$ node tools/grugops/trace-render.js .
Rendered the trace: 1 task(s) and 4 note(s) read; skipped notes: unparseable 0, unopenable 0, not-a-regular-file 0, above-ceiling 0, vanished 0, unsealed 0; unreadable tasks 0; 4 file(s) written, 0 file(s) removed.
```

The rendered index `memory-bank/plans/traceability.md`, shown here as output, ends with one line
per ticket:

```markdown
| Ticket | Trace |
| --- | --- |
| ABC-001 | [ABC-001](traceability/ABC-001.md) |
| ABC-002 | [ABC-002](traceability/ABC-002.md) |
| ABC-003 | [ABC-003](traceability/ABC-003.md) |
```

`memory-bank/plans/traceability/ABC-001.md` lists `RISK-001` under `## Requirement`, so the first
work traces back to a documented risk posture. Its other sections read `None recorded.` until code,
tests, UAT and a release name the ticket. Metrics stay empty: `memory-bank/plans/metrics.md`
records `Throughput` and `Lead time` once real work begins.

## Done, and the human step

The root `AGENTS.md`, `memory-bank/brownfield-map.md` and the memory-bank exist. The confirmed
commands and the risks are documented, and Security/NFR's `PASS_WITH_RISKS` result sits in the
shared context, where the next role reads it. The safe first tickets are in `Backlog`, the board
is seeded, the trace is rendered and `.grugops/factory.config.json` is present. The unverified
`AGENTS.md` slots stay `UNKNOWN - verify`.

The Orchestrator commits these files on the branch `grugops/bootstrap-brownfield-<id>`, never on a
protected branch, and stops. Sam, the repo's maintainer, reviews the branch and decides whether to
merge it. In this run, no agent merged and no agent deployed.
