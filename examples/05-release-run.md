# Example: Release run

> Illustrative run — expected output, not a captured session

This walks one release through `agent-factory/workflows/12-release.md`. The ticket `ABC-012 —
Portfolio FX conversion` passed UAT and sits in `Ready to Release`. The Release Manager sets the
version, writes the changelog, the rollback plan and the release record, works the readiness
checklist, and stops for a named human. `REL-0007`, pull request `#41`, note ids, names and dates
are placeholders. The flow is `Ready to Release -> Release Manager -> approval gate -> deploy plan
-> (human-confirmed) deploy -> Done`.

---

## Input

Release is an enterprise workflow, so the sample runs with `mode=enterprise`. On Claude Code, a
release lead types the release command:

```text
/grugops-release cut REL-0007 for the FX conversion work that passed UAT
```

The `grugops-release` skill ships with `disable-model-invocation: true`, so Claude Code does not
start a release on its own; a human invokes it. In the Claude Code plugin form the same command is
`/grugops:release`. Other hosts start differently; see the [start table](../docs/usage.md#start-a-session).

## Orchestrator decision

The Orchestrator reads `.grugops/factory.config.json` (`mode=enterprise`, `cadence=scrum`,
`checkpoints.production_requires_human_confirmation=block`) and `memory-bank/plans/board.md`, and
routes to the Release Manager:

```markdown
# Orchestrator Decision
## Request type
release — cut REL-0007 for the UAT-signed FX conversion ticket ABC-012.
## Mode/Cadence/Checkpoints
mode=enterprise · cadence=scrum · checkpoints.production_requires_human_confirmation=block
## Activated agents
Release Manager
## Why
ABC-012 is signed off in UAT and waits in Ready to Release. A release needs a version, a rollback
plan, the readiness checklist and a named human before production.
## Required inputs
the implementation, QE, security/NFR and UAT notes for ABC-012; memory-bank/plans/nfr-catalog.md;
release-readiness-checklist.md; memory-bank/70-runbook.md
## Workflow
12-release.md
## Board moves
Ready to Release -> Done, only after a named human approves the deploy
## Expected notes
Release Manager: version, scope, readiness result, host-protection result and approval, with
REL-0007 and ABC-012 on the refs.
## Stop conditions
readiness checklist fails, or no named human approval -> BLOCKED, do not deploy
## Next action
Queue a subtask for the Release Manager to cut REL-0007.
```

The Orchestrator writes `.grugops/queue/pending/rel-0007.md`, checks capacity and claims the
subtask for the Release Manager:

```text
$ node tools/grugops/claim.js free
free 3
$ node tools/grugops/claim.js claim rel-0007 --by grugops-release-manager
claimed rel-0007 by grugops-release-manager
```

On Claude Code it spawns `grugops-release-manager` with the task reference only. On the other
hosts the session loads the Release Manager role in turn.

## The Release Manager reads the evidence

The Release Manager reads the shared context for the ticket first:

```text
$ node tools/grugops/note.js read abc-012
read abc-012: 3 current, 0 superseded, 0 skipped
note 20260617T141000Z-software-engineer-observation-fe097049
  kind: observation
  by: software-engineer
  at: 2026-06-17T14:10:00.112Z
  confidence: high
  refs: ABC-012, EPIC-003, FEAT-007, NFR-002, #41, src/fx/convert.ts
  body:
    Implementation on branch grugops/ticket-to-pr-abc-012. Not checked: live FX provider.
note 20260617T160500Z-qe-e2e-claim-aed341c6
  kind: claim
  by: qe-e2e
  at: 2026-06-17T16:05:00.204Z
  confidence: UNKNOWN - verify
  refs: ABC-012, src/fx/convert.test.ts, e2e/fx.spec.ts
  body:
    QE result: PASS.
note 20260618T093000Z-uat-planner-finding-d2cab23e
  kind: finding
  by: uat-planner
  at: 2026-06-18T09:30:00.318Z
  confidence: high
  verified_by: human:Priya
  refs: ABC-012, UAT-012
  body:
    UAT signed off by Priya.
```

The engineer's work is an `observation` with refs, QE's pass is a `claim` at
`UNKNOWN - verify`, and the UAT sign-off is a `finding` verified by Priya, the human who ran the
UAT. This sample has a scripted install, so no gate stamp exists here. The Release Manager carries
QE's `UNKNOWN - verify` into the release record as it stands rather than calling it a pass. The NFR
target and its evidence come from the file `memory-bank/plans/nfr-catalog.md` lists for `NFR-002`.

## The release record

The Release Manager writes `memory-bank/plans/releases/REL-0007.md`:

```markdown
# REL-0007
## Version
1.4.0  (SemVer — MINOR: adds FX conversion, no breaking change)
## Scope
- ABC-012  Portfolio FX conversion
## Changelog
### Added
- Multi-currency FX conversion on the portfolio view.
## Path
dev -> staging -> prod
## Deploy plan
Deploy 1.4.0 to staging, check the FX view, then to prod with the FX feature flag off. Turn the
flag on after the prod smoke check.
## Rollback plan
Turn the FX feature flag off. If that is not enough, re-deploy 1.3.2. No schema migration to reverse.
## DR notes
RTO 30m · RPO 5m
## Evidence
- NFR-002: target and evidence in memory-bank/plans/nfr/NFR-002.md
- QE: PASS claimed, confidence UNKNOWN - verify (no gate stamp on this host)
- UAT: UAT-012 signed off by Priya
## Readiness checklist
release-readiness-checklist.md — 6 of 8 met; the last two wait for the named human
## Host protection
main: protected. Production environment: not checked (UNKNOWN - verify by design).
Only the named human's confirmation protects this deploy.
## Status
READY_TO_RELEASE
```

The readiness checklist ends with two checks the Release Manager cannot meet itself: a named human
approval is recorded, and the production action will be human-confirmed.

## The host check

Before a human confirms the production action, the Release Manager runs the read-only git-host
check. In this illustration `main` is protected on the git host, so the last line reads:

```text
$ node tools/grugops/host-protection.js
...
HOST-PROTECTION: 1 protected, 0 unprotected, 0 UNKNOWN - verify; production environment not checked (UNKNOWN - verify by design)
```

The check does not read the production environment. Its environment line reads
`UNKNOWN - verify` by design. Exit `2` is never read as a pass. The Release Manager publishes the
result and the release as `observation` notes, with the release and ticket ids on the refs:

```text
$ node tools/grugops/note.js add rel-0007 --kind observation --by release-manager \
    --confidence high --ref REL-0007 --ref ABC-012 --body-file /tmp/rel-0007.md
noted rel-0007 20260620T091200Z-release-manager-observation-3892cf45
```

On a scripted install an `artifact-ref` is refused, because no gate run stands behind it, so a
pointer to the release goes in an `observation`. The Release Manager ends its task with
`node tools/grugops/claim.js done rel-0007` and stops for the human.

## The deploy gate

This is where the workflow stops. The Release Manager prepares the release and asks for approval.
It does not approve the release, and it does not deploy to production.

The rule is that a named human approves the release and confirms the production action. Three
things hold that rule up, and they are not equally strong:

- **The git host is the hard floor.** The sample's repository protects `main` with branch
  protection, and its `prod` deployment environment requires a reviewer. A deploy job that runs
  through that environment waits on the host until the reviewer approves it, whatever command
  started the job. A deploy that does not run through the environment is outside what the host
  sees. grugops does not set this up; a human does, with the checklist in `install/README.md` §5.
- **The ask rules are a speed bump.** The scripted install wrote Claude Code ask rules for the usual
  deploy and publish commands. Claude Code asks before it runs a matching command. Other spellings
  of the same command are not matched, so the rules are not a security boundary. The plugin form
  writes none.
- **The workflow is prose.** The Release Manager role and Workflow 12 tell the agent to stop here.

The host check cannot see the `prod` environment, so the release record says plainly that only
the named human's confirmation protects this deploy. If the readiness checklist fails, or no
named human approval is recorded, the Release Manager sets the status to `BLOCKED` and nothing is
deployed:

```markdown
## Status
BLOCKED — no named human approval recorded
```

In this run Dana, the release lead, reads the release record and approves it. She is the `prod`
environment's reviewer, so she also approves the deploy job in the git host's environment review.
On a follow-up subtask the Release Manager writes what she did into the record and publishes the
same as an `observation` note:

```markdown
## Approval record
- Approved by:  Dana (release lead) — 2026-06-20
- Confirmed by: Dana (prod deployment review on the git host) — 2026-06-20
## Status
RELEASED
```

The status moves to `RELEASED` only after Dana's approval and confirmation are recorded.

## Board moves

While the release is cut and approved, the ticket sits in `Ready to Release`:

```text
## Ready to Release (WIP 1/4)
- [ABC-012] Portfolio FX conversion  (owner: Release Manager, since: 2026-06-18)

## Done (WIP unlimited)
```

After Dana confirms the deploy, the ticket moves to the top of `Done`:

```text
## Ready to Release (WIP 0/4)

## Done (WIP unlimited)
- [ABC-012] Portfolio FX conversion  (owner: Release Manager, since: 2026-06-20)
```

## The rendered trace

The release note carries `REL-0007` and `ABC-012` on its refs. The render picks them up:

```text
$ node tools/grugops/trace-render.js .
Rendered the trace: 2 task(s) and 5 note(s) read; skipped notes: unparseable 0, unopenable 0, not-a-regular-file 0, above-ceiling 0, vanished 0, unsealed 0; unreadable tasks 0; 2 file(s) written, 0 file(s) removed.
$ node tools/grugops/state-check.js .
...
No findings.
```

The rendered `memory-bank/plans/traceability/ABC-012.md`, shown here as output:

```markdown
<!-- GENERATED by grugops trace-render from published note refs — do not hand-edit -->
# Trace: ABC-012

## Requirement

- EPIC-003
- FEAT-007
- NFR-002

## Code

- #41
- src/fx/convert.ts

## Tests

- src/fx/convert.test.ts
- e2e/fx.spec.ts

## UAT

- UAT-012

## Release

- REL-0007
```

The index `memory-bank/plans/traceability.md` keeps one line for the ticket:
`| ABC-012 | [ABC-012](traceability/ABC-012.md) |`. The enterprise definition of done needs the
`Release` section to name a release; here it names `REL-0007`.

## Metrics and done

`memory-bank/plans/metrics.md` gets the lead time as the release clears, as it stands:

```text
| Lead time | Backlog -> Done, median | 12 days | 2026-06 |
```

Anything not measured stays `UNKNOWN - verify`. The Release Manager commits the release record, the
board move, the metric and the rendered trace on the branch `grugops/release-rel-0007`. The commit
records the release; it does not deploy it. A human reviews and merges that branch.

The release is done: `REL-0007.md` reads `RELEASED`, the release note is in the shared context, the
rendered trace names `REL-0007`, and Dana approved the release and confirmed the production deploy.
No agent merged, and no agent deployed.
