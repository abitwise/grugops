# Example: Brownfield bootstrap

> Illustrative run — expected output, not a captured session

This narrates the frozen `01-bootstrap-brownfield` flow on an existing repo: an unfamiliar
codebase handed to grugops, mapped and documented, scanned for high risk, then cut into a
few safe first tickets. IDs like `ABC-001` are obvious placeholders, not real artifacts.
The flow is `existing repo -> Orchestrator -> Brownfield Mapper -> AGENTS.md Scribe ->
Architect/Design review -> Security/NFR high-risk scan -> safe first tickets`.

---

## Input

A developer drops grugops onto an existing service repo (an aging payments API nobody fully
remembers) and asks the Orchestrator to adopt it safely:

```text
/grugops "bootstrap this repo as brownfield — map it, write AGENTS.md and the memory-bank,
scan for high-risk areas, and cut only safe first tickets"
```

## Orchestrator decision

The Orchestrator classifies the request as `brownfield-bootstrap`, reads
`agent-factory/config/factory.config.json` for `mode`/`cadence`, and emits its inline
decision block:

```markdown
# Orchestrator Decision
## Request type
brownfield-bootstrap — adopt an existing repo, map → document → risk-scan → safe first tickets.
## Mode/Cadence/Autonomy in effect
mode=lean · cadence=kanban · autonomy=pr
## Activated agents
Brownfield Mapper, AGENTS.md Scribe, Architect/Design, Security/NFR, BA/PM
## Why
grug look before grug touch — map the repo and scan for risk before any change lands.
## Required inputs
the existing repository; factory.config.json; memory-bank/00-index.md for orientation
## Workflow
01-bootstrap-brownfield.md
## Board moves
seed plans/board.md with its columns + WIP limits; Security/NFR owns the In Security/NFR exit
for the high-risk scan; safe first tickets enter Backlog
## Expected handoffs
agent-factory/handoffs/security-nfr-handoff.md
## Stop conditions
Security/NFR returns BLOCKED on a high-risk finding; or the repo cannot be mapped
## Next action
Brownfield Mapper maps the repo into memory-bank/brownfield-map.md
```

## Board moves

The board is seeded with its columns and per-column WIP limits (from
`factory.config.json#wip_limits`). The bootstrap itself produces no left→right ticket
transition — it stands the board up. The high-risk scan resolves through the
`In Security/NFR` column (Security/NFR owns that exit), and the safe first tickets land in
`Backlog`:

```text
## Backlog (WIP unlimited)
- [ABC-001] Add request validation to /charge endpoint  (owner: BA/PM, sized: S, P2)
- [ABC-002] Pin the unversioned base image in the Dockerfile  (owner: BA/PM, sized: XS, P1)
- [ABC-003] Document the known build/test commands in AGENTS.md  (owner: BA/PM, sized: S, P2)

## In Security/NFR (WIP 0/2)
```

## Expected files and handoffs

The flow produces the brownfield substrate and one handoff (representative snippets — not
full file dumps):

**`memory-bank/brownfield-map.md`** (Brownfield Mapper) — structure plus the commands it
could actually confirm:

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

**Root `AGENTS.md`** (AGENTS.md Scribe) — the substrate is written, but command slots the
Scribe could not verify stay honest:

```markdown
## Commands
- Test:  `npm test`
- Build: `npm run build`
- Lint:  UNKNOWN - verify
- Deploy: UNKNOWN - verify
```

The kit never fabricates a command; unverified slots remain `UNKNOWN - verify` until the
Scribe confirms them per-project.

**Architect/Design review** notes the risky areas — the `/charge` endpoint accepts an
unvalidated body, and the ledger posting path has no idempotency key — and records them as
constraints for the first tickets.

**`agent-factory/handoffs/security-nfr-handoff.md`** (Security/NFR) — the high-risk scan
result, in clear voice:

```markdown
# Security/NFR Handoff
## Result
PASS_WITH_RISKS
## High-risk findings
- RISK-001  Unvalidated request body on /charge (input validation gap)
- RISK-002  No idempotency key on ledger posting (double-charge exposure)
## Note
No BLOCKED finding — adoption may proceed; the first safe tickets must not build atop
RISK-002 until it is addressed.
```

The scan returns one of `PASS | PASS_WITH_RISKS | BLOCKED`. Here it is `PASS_WITH_RISKS`, so
adoption continues. A `BLOCKED` result would stop the flow — no first tickets that build on a
blocked risk until it is resolved.

## Trace and metrics

`plans/traceability.md` is seeded with rows for the safe first tickets, each linked to the
risk the scan raised so the first work traces back to a documented posture:

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-001 | /charge request validation | — | — | RISK-001 | — | — | — | — | Backlog |
| ABC-002 | Pin Docker base image | — | — | — | — | — | — | — | Backlog |

Metrics stay empty at bootstrap — `plans/metrics.md` records `Throughput` and `Lead time`
once real work begins; nothing is faked here.

## Done

The root `AGENTS.md`, `memory-bank/brownfield-map.md`, and the updated memory-bank exist; the
confirmed commands and the risks are documented (with the `security-nfr-handoff.md` result);
the safe first tickets exist in `Backlog`; `plans/board.md` is seeded; the config is present.
The `AGENTS.md` command slots stay `UNKNOWN - verify` until verified per-project. grug mapped
before grug touched.
