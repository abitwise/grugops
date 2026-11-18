# Example: Ticket to PR

> Illustrative run — expected output, not a captured session
>
> Based on a real run captured 2026-06-03 on v1.0; updated to v3 by hand. The original capture is
> in commit [ab0cda98](https://github.com/abitwise/grugops/commit/ab0cda98416c24310c02c180cb2a917889d413e6).

This walks one ready ticket, `ABC-001 — GET /version endpoint`, through
`agent-factory/workflows/04-ticket-to-pr.md` and the gate in
`agent-factory/workflows/05-pr-quality-gate.md`. The sample is the small TypeScript + Node +
Fastify service from `examples/01-greenfield-bootstrap.md`: it answers `GET /health`, and its
bootstrap left `ABC-001` in `Ready for Dev`. IDs, note ids, names and dates are placeholders. The
flow is `Orchestrator -> Tech Lead -> Software Engineer (the level the Tech Lead names) -> QE/E2E ->
gate -> a pull request a human merges`.

---

## Input

On Claude Code, start the session from the sample repo with the Orchestrator as the main thread:

```text
claude --agent grugops-orchestrator
```

Other hosts start differently; see the [start table](../docs/usage.md#start-a-session). Then type the request:

```text
implement ABC-001, the GET /version endpoint, as a pull request a human can review
```

## Orchestrator decision

The Orchestrator reads `.grugops/factory.config.json` (`mode=lean`, `cadence=kanban`,
`checkpoints.open_pr=block`) and `memory-bank/plans/board.md`. It checks `ABC-001` against
`agent-factory/checklists/definition-of-ready.md`: the ticket has acceptance criteria, size `XS`
and priority `P2`. Then it writes its decision:

```markdown
# Orchestrator Decision
## Request type
ticket-to-pr — implement ABC-001 (GET /version) as a pull request a human can review.
## Mode/Cadence/Checkpoints
mode=lean · cadence=kanban · checkpoints.open_pr=block
## Activated agents
Tech Lead (score and plan), Software Engineer at the level the Tech Lead names, QE/E2E (try to break it)
## Why
One small ticket: the Tech Lead scores it, one engineer makes the change, then the gate runs.
## Required inputs
ABC-001 with acceptance criteria, size and priority; definition-of-ready.md; complexity-rubric.md
## Workflow
04-ticket-to-pr.md (the gate is 05-pr-quality-gate.md)
## Board moves
Ready for Dev -> In Development -> In Review
## Expected notes
Tech Lead: scores and level. Software Engineer: branch, files and commands. QE/E2E: result and tests.
## Stop conditions
fails Definition of Ready -> stop; XL or too large for one PR -> SPLIT_REQUIRED; F2 = 2 -> In Design
## Next action
Queue a subtask for the Tech Lead to score ABC-001.
```

## The Tech Lead scores the ticket

The Orchestrator writes `.grugops/queue/pending/abc-001-plan.md`:

```text
# subtask abc-001-plan
ref: .grugops/context/abc-001/
```

It checks capacity and claims the subtask, then spawns the Tech Lead with the task reference and
nothing else:

```text
$ node tools/grugops/claim.js free
free 3
$ node tools/grugops/claim.js claim abc-001-plan --by grugops-tech-lead
claimed abc-001-plan by grugops-tech-lead
```

The Tech Lead reads the shared context first (`node tools/grugops/note.js read abc-001`). It holds
the bootstrap's notes: the BA/PM's acceptance criteria, the System Analyst's response contract
(`200 { "version": string }`, with an `APP_VERSION` override) and the Architect's decision to add
the route inline. The Tech Lead writes the dev tasks first, then scores them with
`agent-factory/checklists/complexity-rubric.md`:

- `src/app.ts`: add `GET /version`, returning `{ version }` from the package version, or from
  `APP_VERSION` when it is set. Given the app runs, when a client calls `GET /version`, then it
  gets `200` and the package version.
- `src/version.test.ts`: two new unit tests, one for the package version and one for the
  `APP_VERSION` override.

| Factor | Score | Fact |
|--------|-------|------|
| F1 files touched | 0 | 2 files: `src/app.ts`, `src/version.test.ts` |
| F2 spec completeness | 0 | exact files, change and test cases named |
| F3 risk surface | 1 | public interface: a new HTTP route |
| F4 novelty | 0 | same shape as `GET /health` in `src/app.ts` |
| F5 test burden | 1 | new tests in one layer (unit) |
| F6 blast radius | 0 | one module; `grep` finds no caller of the new route |

The sum is 2. A sum of 0-3 gives junior only when F2 and F3 are both 0, so F3 = 1 makes the level
**mid**. The Tech Lead publishes the scores, the level and the dev tasks as a `decision` note:

```text
$ node tools/grugops/note.js add abc-001 --kind decision --by tech-lead --confidence high \
    --ref ABC-001 --body-file /tmp/abc-001-plan.md
noted abc-001 20260604T101500Z-tech-lead-decision-1a2b3c4d
```

It writes a short `## Tech Lead plan` section into the ticket body,
`memory-bank/plans/tickets/ABC-001.md`:

```markdown
## Tech Lead plan
- Level: mid. Adapter: `grugops-software-engineer-mid`. Sum: 2. Note: 20260604T101500Z-tech-lead-decision-1a2b3c4d
- Scope: the `GET /version` route in `src/app.ts` and its unit tests in `src/version.test.ts`.
- Dropped: a build-info endpoint and a version header on every response; nobody asked for them.
- Floor: the acceptance criteria in this ticket; the existing `GET /health` test stays green.
```

The ticket stays in `Ready for Dev` while the Tech Lead plans. The Tech Lead ends its task with
`node tools/grugops/claim.js done abc-001-plan`.

## The engineer works at the named level

Once the plan note is published, the Orchestrator moves `ABC-001` to `In Development`, queues
`abc-001-dev` with the same `ref:` line, and claims it for the adapter the plan names:

```text
$ node tools/grugops/claim.js claim abc-001-dev --by grugops-software-engineer-mid --level mid
claimed abc-001-dev by grugops-software-engineer-mid
```

On Claude Code it spawns `grugops-software-engineer-mid` by name with the task reference only. It
never re-decides the level. On the other hosts the Software Engineer role reads the level from
`## Tech Lead plan` and keeps to the mid scope.

The engineer reads the shared context, then works on the branch `grugops/ticket-to-pr-abc-001`,
test-first. It writes the two unit tests and watches them fail, then adds the route:

```ts
// ABC-001: read-only version endpoint so operators can confirm which build is live.
app.get("/version", async () => {
  return { version: readVersion() };
});
```

The tests pass, and so does the existing `GET /health` test. The engineer pushes the branch and
opens pull request `#12`. It publishes the work as an `observation` note with the trace ids on
its refs. This sample has a scripted install, so no gate stamp exists here and a pointer to the
work goes in an `observation`, as Workflow 16 says:

```text
$ node tools/grugops/note.js add abc-001 --kind observation --by software-engineer \
    --confidence high --ref ABC-001 --ref '#12' --ref src/app.ts --ref src/version.test.ts \
    --body-file /tmp/abc-001-dev.md
noted abc-001 20260604T104200Z-software-engineer-observation-5e6f7a8b
```

The note body names the branch, the files, the commands run and ends with a `Not checked:` line.
The engineer moves `ABC-001` to `In Review` and runs `node tools/grugops/claim.js done abc-001-dev`.

## QE/E2E tries to break it

QE/E2E claims its own subtask the same way. It calls `GET /version` with and without
`APP_VERSION` set, and with an unsupported method. End-to-end tests do not run: `quality.ui_e2e` is
`ui-or-critical-path`, and this change has no UI and no critical path. QE/E2E records its pass as
a `claim` with `confidence: UNKNOWN - verify`, because no gate stamp exists on this host to make it
a `finding`:

```text
$ node tools/grugops/note.js add abc-001 --kind claim --by qe-e2e --confidence "UNKNOWN - verify" \
    --ref ABC-001 --ref src/version.test.ts --body "QE result: PASS. No e2e: no UI or critical path."
noted abc-001 20260604T110300Z-qe-e2e-claim-9c0d1e2f
```

Security/NFR is not triggered: a read-only status route adds no risk-bearing surface.

## The gate

The gate runs as `05-pr-quality-gate.md` states. It first runs the read-only git-host check,
`node tools/grugops/host-protection.js`. In this illustration `main` is protected on the git host,
so the check exits 0 and its last line reads:

```text
HOST-PROTECTION: 1 protected, 0 unprotected, 0 UNKNOWN - verify; production environment not checked (UNKNOWN - verify by design)
```

The gate records an `observation` note that names `main` as protected and says the production
environment is not checked.

Then the checks run in order, with the commands from the sample's `AGENTS.md` slots:

```text
install         npm install                                            -> rc 0
lint            npm run lint       (tsc --noEmit -p tsconfig.json)     -> rc 0
typecheck       npm run typecheck  (tsc --noEmit -p tsconfig.json)     -> rc 0
unit            npm test           (node --test)                       -> tests 3, pass 3, fail 0
build           npm run build      (tsc --noEmit -p tsconfig.json)     -> rc 0
uat-spec        not run: no *.uat.spec.ts file and no e2e lane for this change
e2e             not run: quality.ui_e2e=ui-or-critical-path
test-integrity  node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count 0 -> rc 0
```

This sample has no separate linter or build step, so `lint` and `build` run the same
`tsc --noEmit` as `typecheck`. They are reported as exactly what ran. The test runner reports 0
skipped tests, and the skip registry `.grugops/test-skips.md`, which a human owns, lists none. No
self-fix round was needed.

Next the gate renders the trace and checks the state:

```text
$ node tools/grugops/trace-render.js .
Rendered the trace: 1 task(s) and 7 note(s) read; skipped notes: unparseable 0, unopenable 0, not-a-regular-file 0, above-ceiling 0, vanished 0, unsealed 0; unreadable tasks 0; 1 file(s) written, 0 file(s) removed.
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

- #12
- src/app.ts

## Tests

- src/version.test.ts

## UAT

None recorded.

## Release

None recorded.
```

The index `memory-bank/plans/traceability.md` keeps one line for the ticket:
`| ABC-001 | [ABC-001](traceability/ABC-001.md) |`.

Every check passed. On a host repository no gate stamp exists, so the gate records an
`observation` that no verdict stands behind the run, and publishes:

```text
READY_FOR_HUMAN_REVIEW
no gate stamp on this host: no verdict stands behind this result
```

The rendered trace, the board moves and `Cycle time`, `WIP` and `Gate pass rate` in
`memory-bank/plans/metrics.md` are committed on the pull request branch.

## The board

```text
## Ready for Dev (WIP 0/6)

## In Development (WIP 0/3)

## In Review (WIP 1/3)
- [ABC-001] GET /version endpoint  (owner: QE/E2E, since: 2026-06-04)
```

## The human step

`checkpoints.open_pr=block`: the agents opened a branch and a pull request, and stopped there.
Sam, the sample's maintainer, reviews pull request `#12` against
`agent-factory/checklists/pr-review-checklist.md` and decides whether to merge it. No agent merges,
and no agent deploys.
