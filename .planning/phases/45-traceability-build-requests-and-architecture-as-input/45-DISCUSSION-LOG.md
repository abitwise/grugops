# Phase 45: Traceability, build requests and architecture as input - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-25
**Phase:** 45-traceability-build-requests-and-architecture-as-input
**Areas discussed:** Citation and ID check, Build-request file, Answer/carry/escalate, Architecture as input

---

## Citation and ID check

| Option | Description | Selected |
|--------|-------------|----------|
| Note refs + body line | Refs on the BA/PM ticket note are the citation; `none (build-internal)` in a `## Upstream` body line | ✓ |
| `## Upstream` body section | Every ticket lists refs or none in the body; the note copies them (two places) | |
| Note refs only | No ref means build-internal; never stated | |

| Option | Description | Selected |
|--------|-------------|----------|
| Validator, shared model | Validator calls one upstream-model.ts function using the hardened git read | ✓ |
| upstream.js verb only | Orchestrator runs it; validator grammar-only | |

| Option | Description | Selected |
|--------|-------------|----------|
| UNKNOWN - verify warning | Never a pass, never a failure | ✓ |
| Error | Fail the validator | |

| Option | Description | Selected |
|--------|-------------|----------|
| Own commit + warn | Error if missing at the ref's commit; warn on open tickets when superseded at the current pin | ✓ |
| Current pin only | Every ref must match the current pin | |
| Own commit only | No comparison with the current pin | |

**User's choice:** all recommended options.

---

## Build-request file

| Option | Description | Selected |
|--------|-------------|----------|
| Small frontmatter + sections | Closed frontmatter (`id`, `status`, `source`, `pin`, `raised`) plus fixed body sections | ✓ |
| Body sections only | Status as a `## Status` line | |

| Option | Description | Selected |
|--------|-------------|----------|
| Every move needs a human | carried, answered and withdrawn each need a named human | |
| BA/PM may withdraw alone | carried and answered need a human; BA/PM withdraws an open request alone | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Question frozen | After carried only Blocks, History and Answer grow | |
| Editable until answered | BA/PM may refine until answered | ✓ |

Follow-up, edit after carried:

| Option | Description | Selected |
|--------|-------------|----------|
| History line, stays carried | Dated History line; carry list flags "changed since carried" | ✓ |
| Back to open | The edit returns it to open | |
| Silent edit | No record | |

| Option | Description | Selected |
|--------|-------------|----------|
| Overlap + BA/PM judgment | Overlapping upstream IDs listed; same question gets a Blocks entry instead of a new file | ✓ |
| Exact ID-set match | Mechanical duplicate rule | |

**Notes:** the user chose a looser lifecycle than recommended (withdraw alone; editable until answered), made safe by History logging and the carry-list flag.

---

## Answer, carry, escalate

| Option | Description | Selected |
|--------|-------------|----------|
| Orchestrator proposes | After a pin move, the Orchestrator lists the carried requests whose IDs changed; the human confirms | ✓ |
| Human marks it | The human edits the status directly | |

| Option | Description | Selected |
|--------|-------------|----------|
| Refuse + human stop | No answer against a non-descendant pin | |
| Warn only | Report `not-descendant`; the human may still mark answered | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Session start + sweep | Computed each time; no generated file | ✓ |
| A generated file | Rendered CARRY.md | |
| A board section | A section on board.md | |

| Option | Description | Selected |
|--------|-------------|----------|
| Age since last move | open from raised, carried from carried date; own sweep line; exempt from blocked_escalation_days | ✓ |
| Age since raised | One clock | |

**Notes:** the carry list includes carried requests flagged "changed since carried", which widens 44 D-04 by that one case.

---

## Architecture as input

| Option | Description | Selected |
|--------|-------------|----------|
| One ADR per decision | `Accepted (upstream)` plus an upstream ref, paraphrase only | ✓ |
| One summary ADR | One ADR listing all inputs | |
| Claim notes only | No ADR | |

| Option | Description | Selected |
|--------|-------------|----------|
| Upstream wins per item | Upstream replaces default_stack per item; the default fills gaps | ✓ |
| Upstream replaces all | default_stack ignored; gaps become build requests | |

| Option | Description | Selected |
|--------|-------------|----------|
| Block on the BR | Architect raises Build-request:, tickets Blocked until a new pin | ✓ |
| Proposed ADR + BR | Work continues against upstream while waiting | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep in 45 | Pointer lines, one WF00 step, ADR status, floor rule | ✓ |
| Split now | Its own phase | |

---

## Claude's Discretion

- The BR byte budget and any folder total; how `<n>` is assigned; date formats
- The exact `## Blocked` bullet wording and how the sweep recognizes it
- How a `Build-request:` observation is routed to BA/PM
- Pin move as a checkpoint ID or a prose rule
- Workflow 20 vs a separate build-request contract as the authority

## Deferred Ideas

- BR-F1 machine-checkable answer link (already Future)
- UP-F1 changed-ID list on pin move (D-10 does the narrow version)
- Hard refusal for a non-descendant answer pin (not chosen)
- Freezing the question at carried (not chosen)
