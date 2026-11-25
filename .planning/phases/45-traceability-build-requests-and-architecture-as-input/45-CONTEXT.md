# Phase 45: Traceability, build requests and architecture as input - Context

**Gathered:** 2026-11-25
**Status:** Ready for planning

<domain>
## Phase Boundary

The trail runs from an upstream decision to a ticket, and anything that belongs upstream leaves as a build request that a human carries. grugops never decides what the product is.

This phase delivers four things:
- Ticket citation of upstream IDs (TRC-01), and a validator check that each cited ID exists at its pin (TRC-03).
- The build-request document class: the file, its parser, the lifecycle, deduplication, the byte budget, the Blocked wait, the carry list, the answer path through a human pin move, and its own escalation threshold (BR-01..BR-07).
- Architecture as given input: the Greenfield Mapper and the Architect take an upstream stack or architecture decision as input. A deviation becomes a build request. A conflict with a grugops floor becomes a build request plus a human stop (ARCH-01, ARCH-02).
- Each role edit is one pointer line (BA/PM, System Analyst, Architect, Designer, Greenfield Mapper). The procedure lives in Workflow 20.

Requirements: TRC-01, TRC-03, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, ARCH-01, ARCH-02.

Out of this phase: a machine-checkable answer link where upstream echoes the BR ID (BR-F1, deferred), the consultant (Phase 47), the one-command install (Phase 46), and public docs (Phase 48).

</domain>

<decisions>
## Implementation Decisions

### Carried forward (settled in Phase 44 and the scoping decisions; not re-asked)
- S-01: a ticket waiting on a build request stays in `Blocked` with a `## Blocked` bullet naming the request. There is no new board column.
- S-05: when upstream provides an architecture, upstream owns it. A deviation is a build request, and grugops floors never move.
- 44 D-04: build-request statuses are the closed set `open`, `carried`, `answered`, `withdrawn`. `carried` means a human took the request upstream. There is no `declined`. An upstream "no change" lands as a new pin and is `answered`.
- 44 D-05: a role signals with an `observation` note whose body opens with `Build-request:`. Workflow 20 already uses this for reader refusals.
- 44 D-06: `upstream.escalation_days`, default `10`, is added to the `upstream` closed key set in this phase together with its behavior.
- 44 D-07: files live at `memory-bank/plans/build-requests/BR-<n>.md`, through a new `BUILD_REQUESTS_REL` constant in `install/state-layout.ts`, added with its reader. IDs are `BR-<n>`. `BR` is already reserved in the trace (44-01).
- 44 D-11 / D-12: the fixed upstream ID grammar. Manifest `Status` is `locked` | `superseded`, and a superseded row names its successor.
- Ticket frontmatter stays at eight keys. Upstream IDs travel on note refs as `upstream:<source>:<id>@<commit>` and already render in the Requirement column (TRC-02, shipped in Phase 44).

### Citation and the ID check (TRC-01, TRC-03)
- **D-01:** The citation is the set of `upstream:` refs on the BA/PM ticket note (Workflow 03 step 8). That is one place, and it is already in the trace. A ticket that implements no upstream ID states `none (build-internal)` as one line in a `## Upstream` body section. This statement is required only when the repository declares `upstream`. With no `upstream` key, nothing changes from v3.0.0. — **Reversibility:** costly — tickets written in 3.1.0 carry the `## Upstream` body line, and the board contract's "two body sections" paragraph gains a third.
- **D-02:** The structure validator confirms each cited ID. It calls one function in `scripts/upstream-model.ts` that uses the same hardened git object read as `upstream.js` (Phase 44's scrubbed environment, no replace refs, no lazy fetch). The validator does not get its own git logic. This is the first validator check that reads git.
- **D-03:** When the source checkout is absent or unreadable (a CI runner, a fresh clone), the citation check reports a named `UNKNOWN - verify` warning. That is never a pass and never a failure. CI stays green without the sibling checkout, and the gap is visible on every run.
- **D-04:** Each ref is checked against its own `@<commit>`. An ID that is unlisted at that commit, or a malformed ref, is an error. For a ticket that is not yet `Done`, an ID that is superseded or gone at the **current** pin is a warning that names the successor (Pitfall 18: supersession must reach open work). `Done` tickets keep their historical refs without a warning.

### The build-request file (BR-01, BR-03, BR-07)
- **D-05:** A `BR-<n>.md` file has a small closed frontmatter, `id`, `status`, `source`, `pin`, `raised`, and an unknown key is refused by name, as ticket documents are. The body has fixed sections: `## Question`, `## Upstream IDs`, `## Options` (the recommended default is marked), `## Blocks` (the tickets it blocks), `## History` and `## Answer`. One parser, in the style of `scripts/board-model.ts`, owns this grammar, and the validator and `state-check` both import it. — **Reversibility:** one-way — the key set and section names land in users' committed `memory-bank/` state, so renaming them needs a migrate step.
- **D-06:** BA/PM is the single writer of the file. A move to `carried` or `answered` needs a named human, recorded with the date in `## History`, and BA/PM writes that line on the human's word. BA/PM may withdraw an `open` request by itself (a duplicate, or no longer needed), with the reason recorded in `## History`. No agent ever marks its own request `carried` or `answered` (Pitfall 6).
- **D-07:** A request stays editable until it is `answered`. This is the user's choice over freezing it at `carried`.
- **D-08:** Each edit made after `carried` adds a dated `## History` line naming what changed. The status stays `carried`, and the carry list flags the request as "changed since carried" so the human can re-send it.
- **D-09:** Deduplication: before filing, BA/PM lists the `open` and `carried` requests for the same source whose `## Upstream IDs` overlap with the new one. If one of them asks the same thing, BA/PM adds the new blocked ticket to that request's `## Blocks` instead of filing again. Adding to `## Blocks` is allowed after `carried`, and it is a History-logged edit per D-08. Whether two requests ask the same thing is BA/PM's judgment, not a mechanical rule.

### Answer, carry list and escalation (BR-02, BR-04, BR-05, BR-06)
- **D-10:** Answer path: at session start, after a human has moved a pin, the Orchestrator lists each `carried` request for that source whose upstream IDs changed between the request's raising `pin` and the new pin, and asks the human which ones are answered. For each request the human confirms, BA/PM records `answered` with the human's name and the new pin, and publishes a `claim` note whose refs cite the BR ID, the upstream ID and the new pin. Its blocked tickets then leave `Blocked` through the normal workflow. grugops never writes into the upstream repository.
- **D-11:** If the new pin is not a descendant of a request's raising pin (it moved backward or sideways), the Orchestrator reports `not-descendant` for that request as a warning. The human may still mark it answered, and the History line records that the answer pin was not a descendant. This is the user's choice over a hard refusal.
- **D-12:** The carry list is computed from the BR files each time it is shown. It appears in the Orchestrator's session-start report and in the Workflow 09 sweep report. It lists the `open` requests plus the `carried` requests flagged "changed since carried" (D-08), which widens 44 D-04's "open only" by that one case. There is no generated carry file and no board section.
- **D-13:** Escalation counts from the last status move: an `open` request ages from `raised`, and a `carried` request from its carried date in `## History`. Past `upstream.escalation_days`, the sweep reports it on its own "upstream waits" line for the human. A `## Blocked` bullet that names an `open` or `carried` request is exempt from `blocked_escalation_days`, and the waiting ticket still counts in the "Blocked time" metric.

### Architecture as input (ARCH-01, ARCH-02)
- **D-14:** The Architect records each upstream architecture decision as its own ADR, with status `Accepted (upstream)` and an `upstream:<source>:<id>@<commit>` ref. The body is a short paraphrase plus what it means for the build, never copied upstream text. The status line in `agent-factory/seed/memory-bank/50-decisions/ADR-template.md` gains this value. When upstream supersedes the decision, the ADR is superseded the usual way.
- **D-15:** Upstream wins item by item over `default_stack`. For each stack item a source that owns `architecture` decides (language, framework, database, test runner and so on), the upstream decision replaces the default. `default_stack` fills only the items upstream leaves open. The Greenfield Mapper records which item came from which source and pin. This is one step in Workflow 00.
- **D-16:** A deviation found mid-build: the Architect raises a `Build-request:` observation, BA/PM files or merges the request (D-09), and the affected tickets go to `Blocked` naming it. Nobody builds the deviation until a new pin answers the request.
- **D-17:** A conflict between an upstream decision and a grugops floor (the §14 gate, the security and NFR gates, verify-before-write, the git-host floor) is a build request plus a human stop. The affected work is `Blocked`, the Orchestrator stops for a named human, and the floor does not move. This rule lives once in Workflow 20.
- **D-18:** Architecture as input stays in Phase 45: pointer lines in the Greenfield Mapper and the Architect, one Workflow 00 step, the ADR status value, and the floor-conflict rule. The planner splits it into its own phase only if it grows beyond that, and records that as a decision.

### Claude's Discretion
- The byte budget for one BR file (research suggests about 8 KiB, like the NFR and trace files) and whether the folder also gets a total budget. Add a new `BUDGETS` key and the contract table row, checked by both the validator and `state-check` (BR-07).
- How `<n>` is assigned (proposed: the highest existing number plus one, never reused) and the exact `raised` and History date format.
- The exact `## Blocked` bullet wording, following the board contract example (for instance `- <date>, raised by <role>: waiting on build request BR-<n> (owner: human carrier)`), and how the sweep recognizes a bullet that names a BR.
- How a role's `Build-request:` observation reaches BA/PM: proposed, the Orchestrator routes it as a BA/PM subtask.
- Whether a pin move gets a new checkpoint ID or stays a prose rule. The checkpoint roster is closed, so adding one is a recorded decision.
- Where the build-request procedure is written: in Workflow 20 or in a build-request contract (for example `agent-factory/contracts/build-request.md`) that Workflow 20 points to. One authority either way.
- Pitfall 27: keep request text structured and free of imperative text aimed at agents.
- Research flag (narrow): the Blocked bullet against older installed `state-check.js` copies, the "Blocked time" metric, and the separate sweep threshold. Run `runnable-version-skew` deliberately when `state-check` learns the new folder.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and decisions
- `.planning/ROADMAP.md` § Phase 45: goal, success criteria, notes (the split rule, pointer-line rule, research flag, the names settled in Phase 44)
- `.planning/REQUIREMENTS.md`: TRC-01, TRC-03, BR-01..07, ARCH-01..02; scoping decisions S-01, S-05, S-07; BR-F1 under Future Requirements
- `.planning/phases/44-upstream-source-declaration-and-pin-check/44-CONTEXT.md`: D-04..D-07 (names used here), D-11..D-18 (ID grammar, manifest status, pin states, reader, `owns` areas)

### Research (v3.1)
- `.planning/research/SUMMARY.md` § Phase 45 and D2, D4
- `.planning/research/PITFALLS.md` Pitfalls 6, 7, 8, 17, 18, 19, 27
- `.planning/research/FEATURES.md` § C (build requests) and the architecture-as-given-input row

### Kit contracts and code touched
- `agent-factory/contracts/upstream.md`: the declaration, manifest, refs, check and read lines; the `upstream` key set gains `escalation_days`
- `agent-factory/workflows/20-upstream-sources.md`: the single procedure; it gains the build-request, answer and floor-conflict steps
- `agent-factory/contracts/board.md` § Ticket documents and § Ticket body sections: eight closed keys; the `## Blocked` bullet form; body sections (gains `## Upstream`)
- `agent-factory/contracts/context-note.md`: the `claim` and `observation` kinds and refs
- `agent-factory/workflows/03-epic-to-tickets.md` step 8: where BA/PM publishes ticket refs
- `agent-factory/workflows/04-ticket-to-pr.md` steps 14-17: how Blocked and hand-offs work today
- `agent-factory/workflows/09-daily-sweep.md`: `blocked_escalation_days`, the Blocked time metric, the sweep report
- `agent-factory/workflows/17-task-claim.md` § Session start: where the carry list and answer proposal are reported
- `agent-factory/workflows/00-bootstrap-greenfield.md`: the step for upstream stack input
- `agent-factory/seed/memory-bank/50-decisions/ADR-template.md`: the status line
- `agent-factory/config/factory.config.md`: the `upstream` sub-field table, `default_stack`, `blocked_escalation_days`
- `agent-factory/roles/ba-pm.md`, `system-analyst.md`, `architect-design.md`, `designer.md`, `greenfield-mapper.md`: one pointer line each

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/upstream-model.ts`: the ref grammar, the manifest parser and the hardened git read. The TRC-03 check function lives here, and the validator imports it (D-02).
- `scripts/board-model.ts` `parseTicketDocument`: the pattern for the closed-frontmatter BR parser (normalization, refusal codes by name).
- `install/state-layout.ts` `BUDGETS` and the path constants: `BUILD_REQUESTS_REL` and the new budget key go here, and `check:state-paths` forbids literals elsewhere.
- `install/installer-cross-version.test.ts` and `install/fixtures/pre-v3-chess/`: the place for the BR-02 cross-version test (a v3.0 board under v3.1 role text).

### Established Patterns
- Validator config arms: active when present, lenient when absent. An unknown sub-key is refused by name (the `upstream` arm around `scripts/validate-agent-factory.ts:866`).
- Runnables follow the exit 0/1/2 contract, and exit 2 is never a pass. `state-check` learning a new folder moves the embeds and the `RUNNABLE_SET_STAMP`.
- Role edits are one pointer line, and procedures live in workflows (Phase 40 D-05). The role corpus is near its WARN threshold.
- Voice discipline: plain English in every role, workflow and contract.

### Integration Points
- `scripts/validate-agent-factory.ts`: the new BR document checks, the `## Upstream` statement check, TRC-03 citation checks, `upstream.escalation_days` in the closed key set.
- `scripts/runnable-ref/state-check.ts` (and its embeds): the BR folder budget.
- `install/install.ts` / seed: the `build-requests/` folder seeded additively (`.gitkeep`). `install --migrate` creates it for existing repositories.

</code_context>

<specifics>
## Specific Ideas

- BR frontmatter keys, exactly: `id`, `status`, `source`, `pin`, `raised`.
- BR body sections, exactly: `## Question`, `## Upstream IDs`, `## Options`, `## Blocks`, `## History`, `## Answer`.
- ADR status value, exactly: `Accepted (upstream)`.
- Ticket statement, exactly: `none (build-internal)`, under `## Upstream`.
- Warning word for a pin that moved backward or sideways: `not-descendant`.
- Carry-list flag: "changed since carried".
- Public repository rule: every fixture uses a synthetic upstream with invented IDs. No committed file names a private repository, product or person.

</specifics>

<deferred>
## Deferred Ideas

- BR-F1: a machine-checkable answer link, where upstream echoes the BR ID. Already a Future Requirement.
- UP-F1: a changed-ID list and suspect flags on pin move. The answer proposal (D-10) does the narrow version for carried requests only.
- A hard refusal for a non-descendant answer pin: considered and not chosen (D-11). Revisit if pins move backward in practice.
- Freezing a request's question at `carried`: considered and not chosen (D-07, D-08).

</deferred>

---

*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Context gathered: 2026-11-25*
