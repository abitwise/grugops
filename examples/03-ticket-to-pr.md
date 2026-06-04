# Example: Ticket to PR (the dogfood report)

> Real run — captured 2026-06-03

This is the REAL dogfood capture, not an illustration. grugops was installed onto a fresh,
throwaway sample app **outside this repo** (a minimal TypeScript + Node + Fastify service in
grugops's greenfield default stack), bootstrapped via the portable `AGENTS.md` sequential path,
and one real ticket — `ABC-001 — GET /version endpoint` — was driven idea→PR through the frozen
`04-ticket-to-pr` → `05-pr-quality-gate` flow. Every command below actually ran; the gate verdict
is real; the validator (`scripts/validate-agent-factory.mjs`) passed on the sample's resulting
tree (DOG-01).

The split is deliberate and honest (D-38): the **sequential AGENTS.md path** is agent-run and
captured here as REAL proof. The **live Claude Code path** (plugin marketplace install +
plugin-cache pointer resolution, live PreToolUse hook firing, CC sub-agent spawn) cannot be
honestly self-driven by an executor — those checks are marked **pending human** and live in
`docs/dogfood-human-runbook.md`. No marketplace install or hook firing is simulated.

---

## Input

Acting as the Orchestrator (`AGENTS.md` → `agent-factory/roles/orchestrator.md`) on the sample
repo, the request was:

```text
/grugops "add a GET /version endpoint so an operator can read the running app version"
```

The sample already answered `GET /health`; the ticket adds a sibling read-only `GET /version`.

## Orchestrator decision

The Orchestrator read `factory.config.json` (`mode=lean · cadence=kanban · autonomy=pr`) and
`plans/board.md` first, classified the request as `ticket-to-pr`, checked `ABC-001` against the
Definition of Ready, and pulled it within WIP:

```markdown
# Orchestrator Decision
## Request type
ticket-to-pr — implement ABC-001 (GET /version) as a PR a human can review.
## Mode/Cadence/Autonomy in effect
mode=lean · cadence=kanban · autonomy=pr
## Activated agents
Software Engineer (implement), QE/E2E (break it), Orchestrator (gate recommendation)
## Why
grug no rush — one engineer, one small change, then the gate.
## Required inputs
ABC-001 with acceptance criteria + size + priority; definition-of-ready.md; autonomy=pr
## Workflow
04-ticket-to-pr.md  (the gate loop lives in 05-pr-quality-gate.md, referenced not restated)
## Board moves
Ready for Dev -> In Development -> In Review
## Expected handoffs
agent-factory/handoffs/implementation-handoff.md; agent-factory/handoffs/qe-handoff.md
## Stop conditions
fails Definition of Ready -> stop; XL -> SPLIT_REQUIRED (ABC-001 is XS, so neither fired)
## Next action
Software Engineer implements GET /version on a branch with a test
```

## Board moves (real column headings)

ABC-001 walked the real frozen columns. The board status and the ticket front-matter
(`status:`/`column:`) stayed in lockstep at every step — the validator confirmed the
board↔ticket contract at each state.

```text
## Ready for Dev (WIP 0/6)

## In Development (WIP 0/3)

## In Review (WIP 1/3)
- [ABC-001] GET /version endpoint  (PR: feat/ABC-001-version-endpoint [local branch, no remote], QE: PASS, gate: READY_FOR_HUMAN_REVIEW)
```

## Handoffs produced (real files)

Under `agent-factory/handoffs/` on the sample tree:

- `implementation-handoff.md` (Software Engineer) — branch `feat/ABC-001-version-endpoint`,
  files changed, the five real gate commands run.
- `qe-handoff.md` (QE/E2E) — `Result: PASS`; e2e not triggered (`e2e_when: ui-or-critical-path`,
  no UI/critical path); coverage instrument absent in the minimal sample, recorded honestly, not
  faked.

Security/NFR was **not** triggered — a read-only, unauthenticated status route adds no
risk-bearing surface.

The change itself (the real diff on `src/app.ts`):

```ts
// ABC-001: read-only version endpoint so operators can confirm which build is live.
app.get("/version", async () => {
  return { version: readVersion() };
});
```

## Gate verdict (real)

The gate (`05-pr-quality-gate.md`) ran in order — `install → lint → typecheck → unit → build` —
with the commands pulled from the sample's `AGENTS.md` slots (filled with the sample's real
verified commands at bootstrap, never fabricated):

```text
install    npm install                          -> rc 0
lint       npm run lint   (tsc --noEmit -p tsconfig.json)  -> rc 0
typecheck  npm run typecheck (tsc --noEmit -p tsconfig.json) -> rc 0
unit       npm test       (node --test 'src/**/*.test.ts')   -> tests 2 / pass 2 / fail 0, rc 0
build      npm run build  (tsc --noEmit -p tsconfig.json)  -> rc 0
```

Honest note (no fabricated verdict): this minimal sample has **no separate linter or build step** —
its `package.json` wires `lint`, `typecheck`, and `build` all to the same `tsc --noEmit -p tsconfig.json`.
So the `lint` and `build` gate rows here genuinely ran `tsc --noEmit`, not eslint and not an emitting
build; they degenerate to the typecheck for this sample. They are reported as exactly what ran. (This
matches `examples/01`, where the Scribe recorded these slots as `tsc --noEmit` and left only the
absent eslint/prettier/e2e slots `UNKNOWN - verify`.)

All four `mandatory_gates` (`lint, typecheck, unit, build`) passed; no self-fix round was needed.

Terminal result: **`READY_FOR_HUMAN_REVIEW`**.

autonomy=pr — the agent opened a branch and stopped at the PR. It never merged. A human holds
merge and deploy.

## PR / branch link (honest)

The throwaway sample has **no git remote**, so there is no hosted PR URL. The change is a real
local branch with a real diff, recorded honestly as such:

```text
branch:   feat/ABC-001-version-endpoint  (off main)
diffstat: 5 files changed, 33 insertions(+), 4 deletions(-)
            src/app.ts           +5   (the /version route)
            src/version.test.ts  +23  (2 passing tests)
            package.json, tsconfig.json, src/server.ts  (gate wiring)
PR link:  <none — no remote on the throwaway sample; a human opens the PR on a real remote>
```

## Validator (DOG-01)

`node scripts/validate-agent-factory.mjs` was run against the sample's resulting tree at every
board state (Ready for Dev, In Review) — **`ALL CHECKS PASSED`, exit 0**, bare and `--strict`.
It also still exits 0 on grugops's own tree (the D-42 self-test).

## Trace updates (real row)

`plans/traceability.md` on the sample carried ABC-001 from seed to In Review:

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-001 | GET /version endpoint | EPIC-001 | FEAT-001 | NFR-001 | feat/ABC-001-version-endpoint / src/app.ts | src/version.test.ts | — | — | In Review |

---

## Dual-path parity (DOG-02): only the dispatch differs, never the content

grugops dispatches the same factory two ways: the **sequential AGENTS.md path** (agent loads the
roles in turn — proven REAL above) and the **CC-native sub-agent path** (a live Claude Code
session installs the plugin, spawns the `grugops-orchestrator` sub-agent via the `Agent` tool,
and the PreToolUse hook fires mechanically). DOG-02 asserts they produce the **same ticket, the
same handoff filenames, and the same gate verdict** — only the dispatch mechanism differs.

The CC-native column is filled by running `docs/dogfood-human-runbook.md` in a live Claude Code
session; until then its cells read **pending human** (never simulated — fabricating them would
violate the no-fabrication rule).

| Parity dimension | Sequential AGENTS.md path (agent-proven) | CC-native sub-agent path (human-confirmed) |
|------------------|-------------------------------------------|---------------------------------------------|
| Same ticket | `ABC-001 — GET /version endpoint` (driven here) | `pending human` (runbook step 3 — drive the same ABC-001) |
| Dispatch mechanism | `AGENTS.md → orchestrator.md` sequential role-load | `pending human` (plugin install → `settings.json` `agent:` → `Agent` spawn) |
| Plugin-cache pointer resolution (D-31) | n/a (no plugin cache on the sequential path) | `pending human` (runbook step 1 — `/grugops:plan` resolves, not a path error) |
| Handoff filenames produced | `implementation-handoff.md`, `qe-handoff.md` | `pending human` (runbook step 3 — expect the SAME filenames) |
| Gate verdict | `READY_FOR_HUMAN_REVIEW` | `pending human` (runbook step 3 — expect the SAME verdict) |
| Live PreToolUse deploy guard (SAFE-02) | n/a (no live hook on the sequential path) | `pending human` (runbook step 2 — a matched deploy is DENIED absent the approval env var) |
| Validator on resulting tree (DOG-01) | `ALL CHECKS PASSED` (exit 0, bare + strict) | `pending human` (runbook step 4 — expect the SAME exit 0) |

When every CC-native cell is confirmed and equals its sequential counterpart, DOG-02 is met:
the dispatch differed, the content did not. The honest agent-proven / human-pending split is the
deliverable — see `docs/dogfood-human-runbook.md`.
