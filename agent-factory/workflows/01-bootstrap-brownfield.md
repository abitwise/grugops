---
kind: workflow
order: 1
cadence: both
---
# Workflow: Bootstrap brownfield

## When to use
When you drop the factory onto an existing repo and want it mapped, documented, and made safe to work in before any change lands. grug look before grug touch. Map the repo, write the substrate, scan for high risk, then cut only safe first tickets. The work flows existing repo -> Orchestrator -> Brownfield Mapper -> AGENTS.md Scribe -> Architect/Design review -> Security/NFR high-risk scan -> safe first tickets. Tell the Orchestrator: "Bootstrap this repo as brownfield. Create AGENTS.md, memory-bank, brownfield map, the board, config, and safe first tickets."

## Agents involved
- Brownfield Mapper — maps the existing repo, documenting structure and known commands (`memory-bank/brownfield-map.md`); no board move.
- AGENTS.md Scribe — writes/updates the root `AGENTS.md` substrate; no board move.
- Architect/Design — reviews the existing structure and notes risks and constraints.
- Security/NFR — runs a high-risk scan of the unknown repo, returning `PASS | PASS_WITH_RISKS | BLOCKED`.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- An existing repository — the codebase to adopt.
- `.grugops/factory.config.json` for `mode` / `cadence` / `compliance_regime` (present after bootstrap; the kit ships it).
- `memory-bank/00-index.md` for orientation.

## Steps
1. Walk the existing repo (Brownfield Mapper). Record the structure and the build/test/lint commands the walk confirms in `memory-bank/brownfield-map.md`.
2. Write or update the root `AGENTS.md` (AGENTS.md Scribe). The brownfield map records the known commands. The kit file's command slots stay `UNKNOWN - verify` until the Scribe verifies them per-project. Never fabricate a command here.
3. Assess the existing structure (Architect/Design). Record the risky areas, the constraints and any decision worth keeping.
4. Run a high-risk scan of the repo (Security/NFR). Record the scan result — `PASS`, `PASS_WITH_RISKS` or `BLOCKED` — as a typed note per Workflow 16.
5. Write a small set of safe first tickets into `plans/tickets/` (BA/PM) — only after the scan result is understood.
6. Seed `plans/board.md`.

## Board moves
On `plans/board.md`, seed the board with its columns and per-column WIP limits. Security/NFR owns the `In Security/NFR` exit for the high-risk scan; the safe first tickets enter `Backlog`.

## Trace updates
Seed `plans/traceability.md` rows for the safe first tickets. Set `Status` and link any `NFRs` raised by the scan. The first work then traces back to a documented risk posture.

## Metrics emitted
None beyond seeding. The board and metrics counters start empty; `plans/metrics.md` records `Throughput` and `Lead time` once real work begins.

## Stop conditions
- Security/NFR returns `BLOCKED` on a high-risk finding — stop. Do not cut first tickets that build on a blocked risk; resolve the finding first.
- The repo cannot be mapped (no readable structure, no confirmable commands) — stop and request access or context.

## Done condition
The root `AGENTS.md`, `memory-bank/brownfield-map.md` and the updated memory-bank exist. The known commands and the risks are documented, with the security-nfr scan result recorded as a typed note per Workflow 16. The safe first tickets exist. `plans/board.md` is seeded and `.grugops/factory.config.json` is present. The `AGENTS.md` command slots remain `UNKNOWN - verify` until verified per-project.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/bootstrap-brownfield-<id>`), then `type(scope): summary`. The artifacts are the brownfield map, the seeded board, the safe first tickets, the security-nfr note recorded per Workflow 16 and the traceability rows. Never merge, never deploy; humans hold both.
