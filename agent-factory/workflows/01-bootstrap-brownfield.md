---
kind: workflow
order: 1
cadence: both
---
# Workflow: Bootstrap brownfield

## When to use
When you drop the factory onto an existing repo and want it mapped, documented, and made safe to work in before any change lands. Tell the Orchestrator: "Bootstrap this repo as brownfield. Create AGENTS.md, memory-bank, brownfield map, the board, config, and safe first tickets." grug look before grug touch — map the repo, write the substrate, scan for high risk, then cut only safe first tickets. The work flows existing repo -> Orchestrator -> Brownfield Mapper -> AGENTS.md Scribe -> Architect/Design review -> Security/NFR high-risk scan -> safe first tickets.

## Agents involved
- Brownfield Mapper — maps the existing repo, documenting structure and known commands (`memory-bank/brownfield-map.md`); no board move.
- AGENTS.md Scribe — writes/updates the root `AGENTS.md` substrate; no board move.
- Architect/Design — reviews the existing structure and notes risks and constraints.
- Security/NFR — runs a high-risk scan of the unknown repo (`security-nfr-handoff.md`), returning `PASS | PASS_WITH_RISKS | BLOCKED`.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- An existing repository — the codebase to adopt.
- `agent-factory/config/factory.config.json` for `mode` / `cadence` / `compliance_regime` (present after bootstrap; the kit ships it).
- `memory-bank/00-index.md` for orientation.

## Steps
1. The Brownfield Mapper maps the existing repo into `memory-bank/brownfield-map.md`, documenting the structure and the known build/test/lint commands it can confirm.
2. The AGENTS.md Scribe writes/updates the root `AGENTS.md`. The brownfield map records the known commands, but the kit file's command slots stay `UNKNOWN - verify` until the Scribe verifies them per-project; never fabricate a command here.
3. Architect/Design reviews the structure, noting risky areas, constraints, and any decisions worth recording.
4. Security/NFR runs a high-risk scan of the repo and writes `agent-factory/handoffs/security-nfr-handoff.md` with a result of `PASS`, `PASS_WITH_RISKS`, or `BLOCKED`.
5. With the risks understood, BA/PM cuts a small set of safe first tickets into `plans/tickets/` and seeds `plans/board.md`.

## Board moves
On `plans/board.md`, seed the board with its columns and per-column WIP limits. Security/NFR owns the `In Security/NFR` exit for the high-risk scan; the safe first tickets enter `Backlog`.

## Handoffs produced
Under `agent-factory/handoffs/`: `security-nfr-handoff.md` (Security/NFR).

## Trace updates
Seed `plans/traceability.md` rows for the safe first tickets — set `Status` and link any `NFRs` raised by the scan — so the first work traces back to a documented risk posture.

## Metrics emitted
None beyond seeding. The board and metrics counters start empty; `plans/metrics.md` records `Throughput` and `Lead time` once real work begins.

## Stop conditions
- Security/NFR returns `BLOCKED` on a high-risk finding — stop. Do not cut first tickets that build on a blocked risk; resolve the finding first.
- The repo cannot be mapped (no readable structure, no confirmable commands) — stop and request access or context.

## Done condition
The root `AGENTS.md`, `memory-bank/brownfield-map.md`, and the updated memory-bank exist; the known commands and the risks are documented (with the `security-nfr-handoff.md` result); the safe first tickets exist; `plans/board.md` is seeded; `agent-factory/config/factory.config.json` is present. The `AGENTS.md` command slots remain `UNKNOWN - verify` until verified per-project.

## Commit
Commit the artifacts this workflow wrote (the brownfield map, the seeded board, the safe first tickets, the security-nfr handoff, and the traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/bootstrap-brownfield-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
