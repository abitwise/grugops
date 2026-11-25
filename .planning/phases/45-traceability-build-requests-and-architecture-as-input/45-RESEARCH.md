# Phase 45: Traceability, build requests and architecture as input - Research

**Researched:** 2026-11-25
**Domain:** In-repo kit and tooling (TypeScript authorities, generated host runnables, git object reads, markdown contracts)
**Confidence:** HIGH for code facts and cross-version behavior (read or run this session); MEDIUM for the proposed grammars (design, not yet built)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (settled in Phase 44 and the scoping decisions; not re-asked)
- S-01: a ticket waiting on a build request stays in `Blocked` with a `## Blocked` bullet naming the request. There is no new board column.
- S-05: when upstream provides an architecture, upstream owns it. A deviation is a build request, and grugops floors never move.
- 44 D-04: build-request statuses are the closed set `open`, `carried`, `answered`, `withdrawn`. `carried` means a human took the request upstream. There is no `declined`. An upstream "no change" lands as a new pin and is `answered`.
- 44 D-05: a role signals with an `observation` note whose body opens with `Build-request:`. Workflow 20 already uses this for reader refusals.
- 44 D-06: `upstream.escalation_days`, default `10`, is added to the `upstream` closed key set in this phase together with its behavior.
- 44 D-07: files live at `memory-bank/plans/build-requests/BR-<n>.md`, through a new `BUILD_REQUESTS_REL` constant in `install/state-layout.ts`, added with its reader. IDs are `BR-<n>`. `BR` is already reserved in the trace (44-01).
- 44 D-11 / D-12: the fixed upstream ID grammar. Manifest `Status` is `locked` | `superseded`, and a superseded row names its successor.
- Ticket frontmatter stays at eight keys. Upstream IDs travel on note refs as `upstream:<source>:<id>@<commit>` and already render in the Requirement column (TRC-02, shipped in Phase 44).

#### Citation and the ID check (TRC-01, TRC-03)
- **D-01:** The citation is the set of `upstream:` refs on the BA/PM ticket note (Workflow 03 step 8). That is one place, and it is already in the trace. A ticket that implements no upstream ID states `none (build-internal)` as one line in a `## Upstream` body section. This statement is required only when the repository declares `upstream`. With no `upstream` key, nothing changes from v3.0.0. — **Reversibility:** costly — tickets written in 3.1.0 carry the `## Upstream` body line, and the board contract's "two body sections" paragraph gains a third.
- **D-02:** The structure validator confirms each cited ID. It calls one function in `scripts/upstream-model.ts` that uses the same hardened git object read as `upstream.js` (Phase 44's scrubbed environment, no replace refs, no lazy fetch). The validator does not get its own git logic. This is the first validator check that reads git.
- **D-03:** When the source checkout is absent or unreadable (a CI runner, a fresh clone), the citation check reports a named `UNKNOWN - verify` warning. That is never a pass and never a failure. CI stays green without the sibling checkout, and the gap is visible on every run.
- **D-04:** Each ref is checked against its own `@<commit>`. An ID that is unlisted at that commit, or a malformed ref, is an error. For a ticket that is not yet `Done`, an ID that is superseded or gone at the **current** pin is a warning that names the successor (Pitfall 18: supersession must reach open work). `Done` tickets keep their historical refs without a warning.

#### The build-request file (BR-01, BR-03, BR-07)
- **D-05:** A `BR-<n>.md` file has a small closed frontmatter, `id`, `status`, `source`, `pin`, `raised`, and an unknown key is refused by name, as ticket documents are. The body has fixed sections: `## Question`, `## Upstream IDs`, `## Options` (the recommended default is marked), `## Blocks` (the tickets it blocks), `## History` and `## Answer`. One parser, in the style of `scripts/board-model.ts`, owns this grammar, and the validator and `state-check` both import it. — **Reversibility:** one-way — the key set and section names land in users' committed `memory-bank/` state, so renaming them needs a migrate step.
- **D-06:** BA/PM is the single writer of the file. A move to `carried` or `answered` needs a named human, recorded with the date in `## History`, and BA/PM writes that line on the human's word. BA/PM may withdraw an `open` request by itself (a duplicate, or no longer needed), with the reason recorded in `## History`. No agent ever marks its own request `carried` or `answered` (Pitfall 6).
- **D-07:** A request stays editable until it is `answered`. This is the user's choice over freezing it at `carried`.
- **D-08:** Each edit made after `carried` adds a dated `## History` line naming what changed. The status stays `carried`, and the carry list flags the request as "changed since carried" so the human can re-send it.
- **D-09:** Deduplication: before filing, BA/PM lists the `open` and `carried` requests for the same source whose `## Upstream IDs` overlap with the new one. If one of them asks the same thing, BA/PM adds the new blocked ticket to that request's `## Blocks` instead of filing again. Adding to `## Blocks` is allowed after `carried`, and it is a History-logged edit per D-08. Whether two requests ask the same thing is BA/PM's judgment, not a mechanical rule.

#### Answer, carry list and escalation (BR-02, BR-04, BR-05, BR-06)
- **D-10:** Answer path: at session start, after a human has moved a pin, the Orchestrator lists each `carried` request for that source whose upstream IDs changed between the request's raising `pin` and the new pin, and asks the human which ones are answered. For each request the human confirms, BA/PM records `answered` with the human's name and the new pin, and publishes a `claim` note whose refs cite the BR ID, the upstream ID and the new pin. Its blocked tickets then leave `Blocked` through the normal workflow. grugops never writes into the upstream repository.
- **D-11:** If the new pin is not a descendant of a request's raising pin (it moved backward or sideways), the Orchestrator reports `not-descendant` for that request as a warning. The human may still mark it answered, and the History line records that the answer pin was not a descendant. This is the user's choice over a hard refusal.
- **D-12:** The carry list is computed from the BR files each time it is shown. It appears in the Orchestrator's session-start report and in the Workflow 09 sweep report. It lists the `open` requests plus the `carried` requests flagged "changed since carried" (D-08), which widens 44 D-04's "open only" by that one case. There is no generated carry file and no board section.
- **D-13:** Escalation counts from the last status move: an `open` request ages from `raised`, and a `carried` request from its carried date in `## History`. Past `upstream.escalation_days`, the sweep reports it on its own "upstream waits" line for the human. A `## Blocked` bullet that names an `open` or `carried` request is exempt from `blocked_escalation_days`, and the waiting ticket still counts in the "Blocked time" metric.

#### Architecture as input (ARCH-01, ARCH-02)
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

### Deferred Ideas (OUT OF SCOPE)
- BR-F1: a machine-checkable answer link, where upstream echoes the BR ID. Already a Future Requirement.
- UP-F1: a changed-ID list and suspect flags on pin move. The answer proposal (D-10) does the narrow version for carried requests only.
- A hard refusal for a non-descendant answer pin: considered and not chosen (D-11). Revisit if pins move backward in practice.
- Freezing a request's question at `carried`: considered and not chosen (D-07, D-08).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRC-01 | A BA/PM ticket cites the upstream IDs it implements as `upstream:<source>:<id>@<commit>`, or states `none (build-internal)`. | § Pattern 4 (the `## Upstream` reader and the presence rule); § Pitfall 4 (severity for tickets that predate the declaration) |
| TRC-03 | The validator confirms that every upstream ID a ticket cites exists at the pinned commit, using the ID grammar the source declares. | § Pattern 1 (extract the git read), § Pattern 3 (decision table), § Pitfalls 1, 2, 3, 5 |
| BR-01 | A role that needs something upstream owns writes a build-request file with a stable ID, the upstream IDs it touches, the raising pin, options with a recommended default, and the tickets it blocks. | § Pattern 2 (grammar of `BR-<n>.md`) |
| BR-02 | A ticket waiting on a build request stays in `Blocked` with a bullet naming the request, and a board from before v3.1 validates unchanged (cross-version test). | § Research flag answers (measured); § Validation Architecture |
| BR-03 | Build requests follow a closed lifecycle, are deduplicated, and BA/PM is their single writer. | § Pattern 2 (transition table, History grammar) |
| BR-04 | The human sees a carry list of open build requests to take upstream; grugops never writes into the upstream repository. | § Pattern 5 (`upstream.js requests`) |
| BR-05 | A build request is answered only by a new pin a human sets; the answer enters the shared context as a `claim` citing the upstream ID and pin. | § Pattern 2 (answered line names a human and a pin that differs from the raising pin); § Pattern 5 |
| BR-06 | Upstream waits use their own escalation threshold, separate from `blocked_escalation_days`. | § Pattern 5, § Pattern 6 (`escalation_days` config) |
| BR-07 | The build-request folder has a byte budget, checked by the validator and `state-check`. | § Pattern 7 (budget key and the exact pin list) |
| ARCH-01 | When upstream provides a stack or architecture decision, the Greenfield Mapper and the Architect take it as given input (ADR status `Accepted (upstream)`); a deviation is a build request. | § Kit text map; § Pitfall 9 (ADR template is seeded only once) |
| ARCH-02 | grugops floors never move; a conflict with upstream architecture is a build request plus a human stop. | § Kit text map (Workflow 20 rule and untagged stop bullet) |
</phase_requirements>

## Summary

This phase adds no package. Everything is in-repo: one new pure authority (the build-request grammar), one extraction (the git object read that today lives inside the host reader), one new host verb, two validator arms, one budget key, and kit text. The research flags resolve cleanly. I built a v3.0.0 tree with a `Blocked` ticket, the new bullet, a `## Upstream` section and an oversized `BR-1.md`, and ran both the v3.0.0 and the current `state-check.js` and validator over it: all four pass with no finding about the new content. "Blocked time" is computed by an agent from prose, so no code changes for it. `blocked_escalation_days` is read by no code either; both thresholds are applied by the sweep.

Two things are larger than the CONTEXT text suggests, and both must be planned as their own tasks. **First**, D-02 asks for a function in `scripts/upstream-model.ts` that uses the hardened git read, but that read is not in the model. It is hand-written inside `scripts/runnable-ref/upstream.ts`, tied to module globals (`root`, `couldNotRun`), and `upstream-model.ts` declares itself "NO I/O". The read has to be extracted into an embeddable authority first. **Second**, D-10 and D-11 need facts no installed program gives today: which upstream IDs changed between two commits, and whether one commit descends from another. Workflow 20 forbids reading a source any other way, so the answer proposal needs a new read-only verb in `upstream.js`. That same verb can print the carry list and the upstream waits from the BR files, which gives D-12 and D-13 one computed source.

The architecture work (ARCH-01, ARCH-02) fits D-18: two pointer lines, one Workflow 00 step, one ADR status value, one Workflow 20 rule. **No split is needed.**

**Primary recommendation:** Build in this order: (1) extract the git read into `scripts/upstream-git.ts` with no behavior change; (2) `scripts/build-request-model.ts`, `BUILD_REQUESTS_REL`, the budget key and `escalation_days`, all in one generation so the stamps move once; (3) validator arms; (4) `upstream.js requests`; (5) contracts, workflows, pointer lines; (6) cross-version test.

## Architectural Responsibility Map

grugops has no browser, API or database tier. The tiers that matter here are its own.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| BR file grammar, lifecycle, History | Pure authority (`scripts/build-request-model.ts`) | Contract (`agent-factory/contracts/build-request.md`) | One authority per predicate; validator, `state-check` and `upstream.js` all consume it |
| Git object read (manifest at a commit, ancestry, blob ids) | I/O authority (`scripts/upstream-git.ts`, new) | Host runnable `upstream.js` (embedded copy) | D-02: one hardened read; the validator imports it, the runnable embeds it |
| Citation decision (exists, superseded, malformed) | Pure authority (`scripts/upstream-model.ts`) | Validator | Decision is pure over manifests; I/O is passed in |
| TRC-03 report | Structure validator | — | Locked (D-02). It is dev/CI tooling, not installed by the scripted install |
| BR budget and BR grammar findings | Validator and `state-check` (both) | — | BR-07, D-05 |
| Carry list, answer proposals, upstream waits | Host runnable `upstream.js requests` (new verb) | Orchestrator prose (WF17, WF09) | Needs git and a clock; `state-check` has neither and must not gain them |
| BR writes, carried/answered lines | BA/PM role, on a named human's word | — | D-06; no program writes a BR file |
| Deduplication judgment | BA/PM prose (Workflow 20) | `upstream.js requests` lists candidates | D-09: judgment, not a mechanical rule |
| Pin move | Named human, in a commit | — | 44 UP-03 |
| Upstream repository | Never written by grugops | — | BR-04 |

## Research flag answers

### The Blocked bullet against older installed `state-check.js` copies: no conflict

Measured this session. A tree made from `v3.0.0:agent-factory/seed`, with a `- [ABC-1] … (owner: human carrier, since: 2026-11-20)` row under `## Blocked (visible, time-tracked)`, a ticket body holding `## Upstream` / `none (build-internal)` and `## Blocked` / `- 2026-11-20, raised by BA/PM: waiting on build request BR-1 (owner: human carrier)`, and a 20 KB `memory-bank/plans/build-requests/BR-1.md`:

| Program | Result |
|---------|--------|
| `state-check.js` from tag `v3.0.0` | `No findings.`, exit 0 |
| `state-check.js` at HEAD | `No findings.`, exit 0 |
| validator from tag `v3.0.0` | `ALL CHECKS PASSED`, exit 0 (one existing "no traceability row" warning) |
| validator at HEAD | the same |

[VERIFIED: run this session against `git archive v3.0.0`]

Reasons, from the code: the ticket body is never interpreted by any current reader; `state-check` measures a ticket by `lstat` size only and lists only named folders, so an unknown folder is invisible to it. `[VERIFIED: agent-factory/contracts/board.md § Ticket body sections]` quotes: "The body is never interpreted, so the grammar reads neither section."

**The consequence to plan for:** an older `state-check.js` is *silent* about an over-budget BR folder. It does not report the folder; it never looks at it. Skew is reported only when siblings with different stamps sit in one directory. Measured: the `v3.0.0` `state-check.js` placed beside HEAD's `note.js` and `upstream.js` printed one `runnable-version-skew` FINDING and exit 1 on a marked tree.

| Host state | Skew reported? | By what |
|------------|---------------|---------|
| All six programs from 3.1 | no skew | — |
| Some old, some 3.1, in `tools/grugops/` | yes | `state-check.js` (any version that has the rule) and `upstream.js check` at session start |
| All from 3.0.0, kit home refreshed to 3.1 | no | nothing, but there is no `upstream.js` at all, so Workflow 20 stops and names the scripted install before any BR is filed |

`v3.0.0` shipped no `upstream.js` [VERIFIED: `v3.0.0`'s skew line lists only `claim.js, note.js, state-check.js, state-roll.js and trace-render.js`], and 3.1.0 is unreleased, so no released host has a pre-BR `upstream.js`. The third row is therefore closed by the existing absent-runnable stop. **Plan a "deliberate skew run"** as a test: the v3.0.0 `state-check.js` beside the new `upstream.js` → both name the mismatch.

### The "Blocked time" metric: prose only, nothing to change

`grep` over `scripts/`, `install/` and `agent-factory/` finds "Blocked time" only in `workflows/09-daily-sweep.md`, the seed `metrics.md`, and `roles/factory-coach.md`. No TypeScript computes it. A waiting ticket stays in `Blocked`, so it counts by definition. One sentence in Workflow 09 ("an upstream wait counts in `Blocked time`") is enough. [VERIFIED: grep this session]

### The separate sweep threshold

`blocked_escalation_days` is read by no script; Workflow 09 step 7 applies it. `upstream.escalation_days` is parsed by `parseUpstreamConfig` and applied by the new verb (§ Pattern 5); the exemption is per *bullet*, not per ticket (§ Pitfall 8).

### Is ARCH larger than expected?

No. It is two pointer lines, one WF00 step, one ADR status value, one WF20 rule with one stop bullet. Keep it in this phase (D-18).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `~6.0.3` | All tooling, compiled to committed `.js` | Already the only toolchain [VERIFIED: package.json] |
| vitest | `~4.1.8` | Tests | Already the only test framework [VERIFIED: package.json] |
| `@types/node` | `~22` | Types only | [VERIFIED: package.json] |
| Node stdlib | 22+ | `node:child_process`, `node:fs`, `node:path`, `node:crypto` | Host rule: builtins only |
| git CLI | 2.53.0 locally; partial-clone guard needs 2.45+ | Object reads | Same launcher as Phase 44 |

**Installation:** none. Do not add a dependency.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `upstream.js requests` verb | An agent running raw `git -C <source> merge-base` / `git diff` | Breaks 44 D-20 and Workflow 20 ("Read a source only through `node tools/grugops/upstream.js`"). Rejected. |
| New `upstream.js requests` verb | Report lines in `state-check` | `state-check` is git-free and clock-free, has a 2,600-line test file and a fixed `--json` shape. It cannot answer D-10/D-11. Rejected. |
| A new runnable `requests.js` | — | Moves the six-program roster, installer rows, ledger counts and every skew sentence. A verb moves none of those. Rejected. |
| Extracting the git read | Validator spawns the committed `upstream.js` | No second git logic, but D-02 asks for a function call; parsing a CLI's lines is a second grammar. Rejected. |

## Package Legitimacy Audit

Not applicable: this phase installs no external package.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
role meets an upstream-owned question / refusal / deviation / floor conflict
        |
        v
observation note "Build-request: ..." (note.js) ------> Orchestrator queues a BA/PM subtask
        |                                                       |
        |                                     BA/PM: upstream.js requests  (dedupe candidates)
        |                                                       |
        |                              same question? --yes--> add ticket to ## Blocks + History "edited"
        |                                   |no
        |                                   v
        |                     memory-bank/plans/build-requests/BR-<n>.md   status: open
        |                                   |
        v                                   v
ticket -> Blocked + "## Blocked" bullet    session start / sweep: upstream.js requests
 naming BR-<n>                              |  carry list (open, carried+changed)
 (exempt from blocked_escalation_days)      |  waits past upstream.escalation_days
                                            v
                                   named human carries it --> BA/PM writes "carried, by human:<name>"
                                            |
                              (upstream decides in its own repository; grugops never writes there)
                                            |
                              named human edits commit/entry_blob in .grugops/factory.config.json
                                            |
                                            v
                     upstream.js requests:  manifest rows at raising pin vs at new pin
                                            + merge-base --is-ancestor  (not-descendant / UNKNOWN)
                                            |
                            Orchestrator asks the human which are answered
                                            |
                       BA/PM: "answered, by human:<name>, pin <commit>" + claim note
                              refs: BR-<n>, <ticket>, upstream:<source>:<ID>@<new pin>
                                            |
                              ticket leaves Blocked (Definition of Ready again)

Separately, at validate time:
 ticket notes' refs --> validator --> citation decision (upstream-model) --> manifest at each ref's commit
                                              (upstream-git, one hardened read)
        error: malformed / unlisted    warning: superseded or gone at current pin (not Done)
        UNKNOWN - verify: source absent / commit absent / unreadable (never pass, never fail)
```

### Component Responsibilities

| File | Change |
|------|--------|
| `install/state-layout.ts` | `BUILD_REQUESTS_REL = \`${STATE_ROOT_REL}/build-requests\``; `BUDGETS.buildRequestBytes: 8_192`; `BUDGET_COUNT = 10` |
| `scripts/state-rules.ts` | `StateBudgets`, `UNITS`, `FileBudgetKey` gain `buildRequestBytes`; `IntegrityKey` gains the BR key(s); export `isCalendarDate` |
| `scripts/build-request-model.ts` (new) | the one BR parser, History grammar, lifecycle, carry/age derivations (pure, no clock: today is a parameter) |
| `scripts/upstream-git.ts` (new) | git launcher, `manifestAt`, `descends`, changed-ID facts (I/O, no argv, no exit) |
| `scripts/upstream-model.ts` | `escalation_days`; the pure citation decision; the pure changed-ID decision; the `## Upstream` statement reader |
| `scripts/runnable-ref/upstream.ts` | hand part shrinks (extraction); new `requests` verb |
| `scripts/runnable-ref/state-check.ts` | list, measure and parse the BR folder |
| `scripts/validate-agent-factory.ts` | budget call, BR documents, `## Upstream`, citations |
| `scripts/generate-runnable-embeds.ts` | state-check row and upstream row gain authorities; `EMBED_SPEC_COUNT` stays 7 |
| `agent-factory/seed/memory-bank/plans/build-requests/.gitkeep` (new) | additive seed |

### Pattern 1: Extract the hardened git read first, with no behavior change

**What exists.** `[VERIFIED: scripts/upstream-model.ts:15]` "// NO I/O. This module reads no file, runs no process and writes nothing." The git code is hand-written in `scripts/runnable-ref/upstream.ts` (functions `gitEnv`, `runGit`, `gitComplaint`, `gitAnswer`, `gitText`, `modesAtPin`, `blobText`, `gitAnswers`, `entryAtPin`, class `SourceUnknown`), and `gitAnswers` uses the module global `root`.

**Recommendation that honors D-02 as written:** move those functions unchanged into `scripts/upstream-git.ts`, with `root` as a parameter. Keep `upstream-model.ts` pure and put the one function the validator calls there, taking the read as a parameter:

```typescript
// scripts/upstream-model.ts (pure) — the one function D-02 names
export function citationFindings(input: {
  readonly sources: readonly UpstreamSource[];
  readonly tickets: readonly { readonly id: string; readonly done: boolean; readonly refs: readonly string[]; readonly statesNone: boolean }[];
  /** The manifest a source publishes at `commit`, or why it cannot be read. */
  readonly manifestAt: (source: UpstreamSource, commit: string) => UpstreamManifestAt;
}): readonly UpstreamCitationFinding[];

// scripts/validate-agent-factory.ts — passes the one hardened read
import { citationFindings } from "./upstream-model.js";
import { manifestAtCommit } from "./upstream-git.js";
```

**Embedding rules that shape the code** [VERIFIED: scripts/generate-runnable-embeds.ts header]:
- An authority may import only `node:` builtins or, with no rename, a name an *earlier* authority of the same row embeds. Order the row: `state-layout`, `state-rules`, `trace-model`, `board-model`, `frontmatter`, `context-io`, `upstream-model`, `upstream-git`, `build-request-model`, `runnable-stamp`.
- No two declarations in one target may share a name. `upstream.ts` has a hand-written `codeOf`, `listed`, `printable`; `state-check.ts` also has `codeOf`, `listed`, `printable`. Prefix every new top-level name (`upstreamGit…`, `buildRequest…`, `BUILD_REQUEST_…`).
- `upstream.ts` imports builtins as namespaces (`nodeChildProcess`, `nodeFs`, `nodePath`); an authority's named imports become generated import lines, so the namespace import of `child_process` becomes unused and must go.
- Any authority change moves `RUNNABLE_SET_STAMP` in all six runnables. Do steps 1 and 2 of the build order in as few generations as possible.

**Tests that will move with the extraction:** `scripts/runnable-ref/upstream.test.ts` injects an EACCES at "the gitAnswers statSync site derived from the committed .js" (44-12), and the "subcommands" case pins `["cat-file", "config", "ls-tree", "rev-parse", "version"]`. The second one must gain `merge-base` for the new verb only; `check` and `read` must keep the old set.

### Pattern 2: The `BR-<n>.md` grammar (declare the legal form, refuse the complement)

Keys and section names are locked by D-05. Everything below that line is proposed within discretion.

```markdown
---
id: BR-3
status: carried
source: design
pin: 0123456789abcdef0123456789abcdef01234567
raised: 2026-12-01
---
# BR-3: Which store owns the session token

## Question

Which store owns the session token after sign-out?

## Upstream IDs

- DEC-12

## Options

- (recommended) The server store owns it; the client holds an opaque handle.
- The client store owns it.

## Blocks

- ABC-014

## History

- 2026-12-01: open, by BA/PM
- 2026-12-03: carried, by human:Jane Example
- 2026-12-05: edited, by BA/PM: added ABC-021 to Blocks

## Answer
```

Rules:
- **Frontmatter:** exactly the five keys, all required, each once, all values non-empty. Reuse the ticket reader's refusal codes by name: `no-opening-delimiter`, `no-closing-delimiter`, `control-character`, `unrecognized-line`, `unknown-key`, `duplicate-key` (`parseTicketDocument`), plus `missing-key` and `bad-value`. Normalize with `normalizeDocument` first.
- `id`: `BR-` then `[1-9][0-9]{0,8}` (no leading zero, so `BR-1` and `BR-01` cannot both exist) and equal to the file stem.
- `status`: `open` | `carried` | `answered` | `withdrawn`.
- `source`: `UPSTREAM_SOURCE_ID_RE`. `pin`: `UPSTREAM_OBJECT_ID_RE`. `raised`: `YYYY-MM-DD`, a real calendar date.
- **Sections:** the six level-two headings, each exactly once, in the D-05 order; any other level-two heading is refused. Locate with `unfencedHeadingIndices` / `sectionEndIndex` from `scripts/frontmatter.ts` (the one section owner, LANG-07). Never write a private heading scan: `check-foundation-guards.test.ts` asks each module whether it "builds a section bound".
- `## Upstream IDs`: one `- <ID>` bullet per ID, or the single line `none` (§ Open Question 2).
- `## Options`: at least one bullet; exactly one opens `- (recommended) `.
- `## Blocks`: one `- <ticket ID>` bullet each (`isTicketId`, not a reserved prefix); at least one.
- `## History`: every non-blank line is one entry; dates never decrease; the first entry is `open` with date equal to `raised`; the status implied by the last non-`edited` entry equals frontmatter `status`.
- `## Answer`: empty until `answered`; non-empty once `answered`.

History line forms (closed):

| Event | Form | Who |
|-------|------|-----|
| open | `- <date>: open, by BA/PM` | BA/PM |
| edited | `- <date>: edited, by BA/PM: <what>` | BA/PM; only before `answered`/`withdrawn` |
| carried | `- <date>: carried, by human:<name>` | on a human's word; a second `carried` re-sends and clears the flag |
| answered | `- <date>: answered, by human:<name>, pin <commit>` with optional `, not-descendant` | on a human's word |
| withdrawn | `- <date>: withdrawn, by BA/PM: <reason>` | from `open` |

`human:<name>` is the stamp form the note schema already uses, so a role name can never satisfy it by accident. It is a prose-tier record, not a security boundary; say so in the contract, as Workflow 04 does for its `Confirmed:` stamp.

Transition table:

| From | To | Allowed |
|------|----|---------|
| `open` | `carried` | named human |
| `open` | `withdrawn` | BA/PM, reason |
| `open` | `answered` | refuse: an unsent request cannot be answered (D-10 lists only `carried`). Withdraw it instead. |
| `carried` | `answered` | named human, pin not equal to the raising `pin` (BR-05) |
| `carried` | `withdrawn` | allow only `by human:<name>` (D-06 gives BA/PM only the `open` case) — § Assumption A3 |
| `answered`, `withdrawn` | any | refused: terminal |

"Changed since carried" = an `edited` entry exists after the last `carried` entry. It is derived, never stored.

### Pattern 3: The TRC-03 decision table

For each ticket, take the upstream refs of every *current* note (superseded notes folded out, § Pitfall 1) whose refs name that ticket.

| Case | Result |
|------|--------|
| ref starts `upstream:` but `parseUpstreamRef` is null | ERROR "malformed" |
| `<source>` not declared | not-Done: ERROR; Done: `UNKNOWN - verify` (the source may have been retired) — A4 |
| commit length differs from the declared pin's | ERROR (wrong object format) |
| checkout absent, not a repository, commit absent, git missing, entry absent or malformed at that commit | `UNKNOWN - verify <source>: <reason>`, one line per (source, commit, reason) with a ref count |
| ID not listed at its own commit | ERROR |
| ID listed at its own commit; ticket Done | nothing |
| ID listed at its own commit; ticket not Done; at the **current** pin it is `superseded` | WARNING naming the end of the chain |
| … at the current pin it is absent | WARNING |

**Reading a manifest at an older commit:** `entry_blob` describes only the *current* pin. `manifestAt(source, commit)` compares `entry_blob` only when `commit === source.commit`; otherwise it reads `<commit>:<entry>` with the same regular-file, size, NUL, UTF-8 and re-hash checks. When the current pin has a `blob-mismatch`, treat the current-pin half as `UNKNOWN - verify`.

Cache by `(source, commit)`: one manifest read per distinct commit, however many tickets cite it. Never run the listed-path sweep here.

### Pattern 4: The `## Upstream` statement

- Applies only when `STATE_ROOT/.grugops/factory.config.json` declares a valid `upstream`. With no key, the validator must spawn no git and read no note (test this: a recording `git` first on `PATH` sees zero calls).
- Read the body with the one section owner: normalize, `unfencedHeadingIndices(text, "## Upstream")` must be 0 or 1, then `sectionEndIndex(text, at + 1, 2)`. The one non-blank line must equal `none (build-internal)`.
- Refs **and** the statement: ERROR (contradiction). Neither: see Pitfall 4. Two `## Upstream` headings or other text: ERROR.
- The board *grammar* still does not interpret the body. Amend `contracts/board.md` § Ticket body sections: three headings, and "the board grammar reads none of them; the structure validator reads `## Upstream` when `upstream` is declared". Amend the sentence "The body is never interpreted, so the grammar reads neither section" accordingly.

### Pattern 5: `upstream.js requests` (new read-only verb)

`node tools/grugops/upstream.js requests [--root <dir>]`. It reads the BR files and the declared sources, asks git only for objects, and writes nothing. Follow the `check` contract: one line per fact, one write at the end, exit 2 when anything is unknown or refused, exit 1 when there is something for a human, exit 0 otherwise.

Proposed closed lines:

| Line | When |
|------|------|
| `carry <BR> <source>: open since <date>` | status `open` |
| `carry <BR> <source>: changed since carried <date>` | `carried` with a later `edited` entry |
| `wait <BR> <source>: <status> for <n> days (escalation_days <m>)` | `n > m`; `open` from `raised`, `carried` from the last `carried` date (UTC days) |
| `answer-candidate <BR> <source>: changed <ID>[, <ID>…] (raised at <pin>, pin now <commit>)` | `carried`, pin moved, at least one ID changed |
| `pin-moved <BR> <source>: no listed ID changed (…)` | `carried`, pin moved, none changed: a "no change" answer (44 D-04) lands this way, so it must stay visible |
| `not-descendant <BR> <source>: …` | D-11, follows the candidate or pin-moved line |
| `UNKNOWN - verify <BR> <source>: <reason>` | source undeclared, checkout absent, raising commit absent, shallow history |
| `refused <file>: <code>` | the BR grammar refuses the file |
| `no build requests` | folder absent or empty |

**Print only grammar-checked fields** (IDs, dates, statuses, hex). Never the question, an option or a reason text. This keeps the Phase 44 rule that nothing free-form reaches a report.

**"Changed"** for an ID: the triple (status, successor, blob id of the listed file) differs between the two commits, or the row exists at only one of them. Blob ids come from `ls-tree -r -z --full-tree <commit> -- <path>`; no file content is read. A moved `Path` with an equal blob is not a change.

**Ancestry:** `git merge-base --is-ancestor <raising> <new>`: 0 descendant, 1 not, 128 error. Measured this session:

| Case | Exit |
|------|------|
| full clone, ancestor | 0 |
| full clone, reversed | 1 |
| commit absent | 128 (`fatal: Not a valid commit name …`) |
| **shallow clone, both commits present, truly an ancestor** | **1 (wrong)** |
| `.git/info/grafts` cutting the parent | 1, also with `GIT_NO_REPLACE_OBJECTS=1`; `GIT_GRAFT_FILE=/dev/null` restores 0 |

So: run `rev-parse --is-shallow-repository` first. In a shallow repository, exit 1 is `UNKNOWN - verify`, never `not-descendant`. Set `GIT_GRAFT_FILE` to the null device for this call or accept the graft case as a recorded residual (a graft is local human state; `not-descendant` is only a warning). [VERIFIED: git 2.53.0, run this session]

### Pattern 6: `upstream.escalation_days`

`[VERIFIED: scripts/upstream-model.ts:43]` `export const UPSTREAM_KEYS = Object.freeze(["sources"] as const);`

`upstreamKeyFindings` treats every allowed key as required. Split allowed from required for the `upstream` object only: allowed `["sources", "escalation_days"]`, required `["sources"]`. Value: a safe integer of at least 1; anything else is a finding naming `upstream.escalation_days`. `UpstreamConfigResult` `ok` gains `escalationDays` (default 10, one named constant). Every refusal message that quotes the allowed keys changes text: `"the allowed keys are: sources"` in `scripts/upstream-model.test.ts:146-152` and `scripts/validate.test.ts:4214`. The message "`upstream must be an object whose only key is "sources"`" in `parseUpstreamConfig` is also wrong after this.

Docs that must flip: `contracts/upstream.md` § Declaration ("takes one key, `sources`", "`escalation_days` is refused in this version"), `factory.config.md` lines 33, 257 and the zero-config paragraph at 307.

### Pattern 7: The budget key, and every pin it moves

Recommend **per-file only**: `buildRequestBytes: 8_192` over each `.md` in the folder. This is how the ticket, NFR and trace folders are budgeted, and CONTEXT asks for "a new `BUDGETS` key". A folder total would need an archive path (terminal requests accumulate), which nothing in scope provides. State the reading in the contract row so BR-07's "folder has a byte budget" is unambiguous.

| Pin or table | File |
|--------------|------|
| `BUDGETS`, `BUDGET_COUNT` 9 → 10 with a dated line | `install/state-layout.ts` |
| `### Budgets` table row (compared both ways) | `agent-factory/contracts/board.md` |
| `StateBudgets`, `UNITS`, `FileBudgetKey` (typecheck fails until all three move) | `scripts/state-rules.ts` |
| planter tables typed `Record<keyof typeof BUDGETS, …>` | `scripts/validate.test.ts` (~3747), `scripts/runnable-ref/state-check.test.ts` (~298) |
| `LISTED_FOLDERS` (6 members), `folder === NFR_DIR_REL` map (~2284), per-folder rows (~1823) | `scripts/runnable-ref/state-check.test.ts` |
| `STATE_CHECK_READ_SITES` 18 (if a read site is added) | `scripts/runnable-ref/read-sites.test.ts` |
| `READ_SITE_ROWS`, `VALIDATOR_READ_SITES` 5 | `scripts/validate-read-sites.test.ts` |
| embedded copies in `state-check.ts`, `state-roll.ts`, `install/state-migrate.ts` | generated |

In `state-check`, `directoryFindings` measures by `lstat`; parsing a BR file is a second step through the existing non-blocking read helpers (`readState` style), under a ceiling, never following a link at the leaf.

### Anti-Patterns to Avoid
- **A second git launcher** in the validator or the BR model. One module owns `spawnSync("git", …)`.
- **A clock or git in `state-check`.**
- **Storing a derived fact** ("changed since carried", "overdue") in the BR file.
- **A private `## ` scan or frontmatter regex.** Use `frontmatter.ts` and the ticket reader's shape.
- **Any printed free text** from a BR file or a manifest on a report line.
- **Enumerating the bad spellings.** This repository's recorded lesson is to declare the legal form and refuse everything else.

## Kit text map

| File | Edit | Notes |
|------|------|-------|
| `agent-factory/contracts/build-request.md` (new) | grammar, History forms, lifecycle, `requests` lines, budget pointer | Recommended over putting grammar in WF20: the Phase 44 split is contract = forms, workflow = procedure. Costs the pins listed below. |
| `agent-factory/contracts/upstream.md` | `escalation_days`; `requests` verb; `requests` git subcommands; ancestry meaning; citation check summary | |
| `agent-factory/contracts/board.md` | `## Upstream` as third body section; `## Blocked` BR bullet form; budget row | `readBudgetTable` locates by `### Budgets` |
| `agent-factory/workflows/20-upstream-sources.md` | file/merge/carry/answer steps; floor-conflict rule (once); new stop bullets; Done condition | Orchestrator routes a `Build-request:` observation as a BA/PM subtask |
| `agent-factory/workflows/03-epic-to-tickets.md` step 8 and Trace updates | add upstream refs, or the `## Upstream` line | |
| `agent-factory/workflows/09-daily-sweep.md` step 7, 9, Metrics, Stop | per-bullet exemption; carry list and "upstream waits" line; Blocked time sentence | `escalate_stale_blocker` stop bullet text must state the exemption |
| `agent-factory/workflows/17-task-claim.md` § Session start | run `requests` and report | `flow-guidance-text.test.ts:443-470` pins exactly 5 numbered steps and exact sentences of step 4. Extend step 4 without changing its pinned sentences, or move the pin deliberately |
| `agent-factory/workflows/00-bootstrap-greenfield.md` | one step (D-15) before the plan is drafted; `upstream` in Inputs | |
| `agent-factory/seed/memory-bank/50-decisions/ADR-template.md` and the repository's own `memory-bank/50-decisions/ADR-template.md` | `Accepted (upstream)` in the status line | the two already differ by one line; edit both |
| five role files | one pointer line each | byte table below |
| `agent-factory/config/factory.config.md` | `escalation_days` row | |
| `install/README.md` | only if it lists verbs | |

**Role byte headroom** (`ROLE_CEILINGS` in `scripts/check-foundation-guards.ts`; a role at or above WARN prints an advisory WARN, at or above FAIL is red) [VERIFIED: scripts/check-foundation-guards.ts ROLE_CEILINGS, `wc -c`]:

| Role | Now | WARN | FAIL | Bytes before WARN |
|------|-----|------|------|-------------------|
| ba-pm | 2880 | 3053 | 3226 | 172 |
| system-analyst | 2249 | 2384 | 2519 | 134 |
| architect-design | 2894 | 3068 | 3242 | 173 |
| **designer** | **2749** | **2799** | **2957** | **49** |
| greenfield-mapper | 2273 | 2410 | 2546 | 136 |

Use one short line for the Designer, such as `- Upstream input: Workflow 20.` (31 bytes with newline). Corpus: 60,958 of 64,000 WARN; Phase 47 needs about 2 KB, so spend well under 500 bytes here.

**`Accepted (upstream)` reaches only new repositories through the template** (the seed is written only when absent), so Workflow 20 and the Architect's pointer must be enough without it.

**Pointer-line and step rules from the gates:** step bullets open with a verb from the closed list (`Append, Apply, Assemble, Assess, Attach, Capture, Claim, Clarify, Compile, Confirm, Create, Degrade, Distill, Draft, Emit, Escalate, Establish, Hand, Identify, Implement, List, Mark, Meet, Obtain, Produce, Promote, Propose, Pull, Read, Recommend, Reconcile, Record, Run, Seed, Set, Size, Split, Transition, Update, Validate, Verify, Walk, Write`). There is no "File", "Answer", "Carry" or "Report". Sentences stay at 25 words or fewer. `kit-ref` facts are derived per role from the files it names.

## Registration checklist (from Phase 44's own surprises)

| When you… | These move |
|-----------|-----------|
| add `contracts/build-request.md` | `GOVERNED_CORPUS_COUNT` 71, `BANNED_CLAIM_SCAN_COUNT` 163 (in `check-imperative-lexicon.ts`, `check-banned-claims.ts`); `SCAN_SET_SIZE` 87 (`trace-instructions.test.ts`) |
| add a stop bullet | `WORKFLOW_STOP_BULLET_COUNT` 55 in `scripts/checkpoints.ts`, with the bullet re-walked and tagged or recorded untagged |
| change any watched workflow / AGENTS.md clause | rows in `docs/audit/29-style-dispositions/45-NN.md`, generated from the gate's own segmentation; clauses in `## Stop conditions`, `## Commit`, role `## Hard limits` need a companion cell |
| add a `scripts/*.ts` module | `NON_TEST_MODULE_COUNT` 119 and the per-module specs (75) in `check-foundation-guards.test.ts`; its committed `.js` twin in the same commit |
| add a test module | the test-module count (87) in `check-foundation-guards.test.ts`; `SCRIPTS_TEST_FILE_COUNT` 87 / `INSTALL_TEST_FILE_COUNT` 48 in `install/mode-census.test.ts` |
| name both `status` and `column` as string literals in one scripts file | `NOT_A_SECOND_AUTHORITY` (10) in `validate.test.ts`. Keep the word `column` out of `build-request-model.ts`; its test and fixtures that plant tickets will need an entry |
| add a file that spells `.grugops/factory.config.json` | `CONFIG_PATH_SITES` in `context-io.test.ts` |
| add a seed file | `INSTALLED_FILE_COUNT` 82, `WRITE_PATH_COUNT` 122, `READ_PATH_COUNT` 84 and siblings in `install/*.test.ts`; re-derive, never bump |
| change `checkpoints.ts` or `kit-model.ts` | `hooks/hook-entry.ts` via `npm run generate:hook-manifest` |
| change a workflow's agents or a contract | `npm run generate:catalog` |
| write two adjacent identical `expect` lines | a foundation guard fails |

Clone tests read committed HEAD, so a half-committed registration shows as false failures; commit, then re-run.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter reading | a regex pair | the `parseTicketDocument` shape, `normalizeDocument` | BOM, CRLF, control characters, duplicate keys already solved |
| Section bounds | `startsWith("## ")` | `unfencedHeadingIndices`, `sectionEndIndex` | fenced example headings; LANG-07 guard |
| Note reading in the validator | reading `notes/*.md` | `context-io.ts` readers (seal check, skip arms) | unsealed notes are not context |
| Superseded notes | own fold | `currentState` in `context-io.ts` | deterministic replay rule lives there |
| Git environment | `execSync("git …")` | the extracted launcher | GIT_* scrub, no replace, no lazy fetch, partial-clone guard, re-hash |
| Refs | string splits | `parseUpstreamRef`, `upstreamRef` | one grammar |
| Calendar dates | `new Date(str)` | `isCalendarDate` in `state-rules.ts` (export it) | `2026-02-30` |
| Directory records | own `.md` filter | `budgetEntryNames` / `recordEntryNames` | keepers and dotfiles |
| Paths | literals | `BUILD_REQUESTS_REL` | `check:state-paths`, state-layout rules |
| Host file reads | `readFileSync` | `readRegularFileOrNull`, `rootChainPresence` | FIFO, link and containment refusals |

**Key insight:** every hazard in this phase already has an owner in the tree. The work is wiring owners together, plus one new grammar.

## Runtime State Inventory

Not a rename or migration phase, but it adds per-repository state, so the same questions are answered:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing repositories have no `build-requests/` folder. | Seeded additively by `seedState` on every install (per-file skip-if-exists) and by the install run `--migrate` falls through to. Absent folder = no requests, never a finding. Add a migrate test. |
| Live service config | None. No external service holds BR state. | none |
| OS-registered state | None. | none |
| Secrets/env vars | None. `VALIDATE_ROOT` / `VALIDATE_KIT_ROOT` unchanged. | none |
| Build artifacts | Installed `tools/grugops/*.js` copies: never updated in place; stamps differ after this phase. | Existing skew reports; deliberate skew test. |
| Existing trace | Any repository that already has tickets with `id_prefix` `BR` loses trace rows since 44-01 (44-REVIEW WR-02, open). | No new action; do not widen. |

## Common Pitfalls

### Pitfall 1: A wrong citation can never be fixed
**What goes wrong:** Notes are append-only and sealed. If the check reads every note, one mistyped ref is a permanent validator error.
**Why it happens:** The trace renderer unions refs from all notes and does not fold `supersedes` (`buildTraceRows` takes `refs` only).
**How to avoid:** The citation check reads current notes only (`currentState`: drop any note named by another's `supersedes`). Document the remedy in Workflow 20: publish a correcting note that supersedes the wrong one. The trace still shows the old ref; that is existing behavior.
**Warning signs:** a test that fixes a bad ref by editing a note file.

### Pitfall 2: `--strict` turns D-03's warning into a failure
**What goes wrong:** `failed = errors.length + (STRICT ? warnings.length : 0)` [VERIFIED: scripts/validate-agent-factory.ts, render block]. An `UNKNOWN - verify` in `warnings` fails a `--strict` run without the checkout, which D-03 forbids ("never a failure").
**How to avoid:** collect these in a third list, print `  WARNING  UNKNOWN - verify …` lines, never count them, and never let the run end in a bare `ALL CHECKS PASSED` without the UNKNOWN lines above it. grugops's CI runs the validator without `--strict` (`ci.yml:594`).

### Pitfall 3: Checking every commit against `entry_blob`
**What goes wrong:** every citation made before the last pin move reports `blob-mismatch`.
**How to avoid:** Pattern 3. Test: cite at pin A, move to pin B, A's ref still resolves.

### Pitfall 4: Declaring `upstream` floods an existing repository with errors
**What goes wrong:** 100 old tickets have neither a ref nor `## Upstream`.
**How to avoid:** missing-statement is a **WARNING** for tickets not `Done`, and nothing for `Done`, like the existing "no traceability row" warning. A *wrong* citation stays an error (D-04, SC1). A4 in the assumptions log.

### Pitfall 5: Notes for a finished ticket move to the archive
**What goes wrong:** the check reads only `.grugops/context/`, so archived Done tickets lose their refs; or it treats an archived folder as missing.
**How to avoid:** read both `CONTEXT_REL` and `CONTEXT_ARCHIVE_REL`, as the trace does. An incomplete note read (an unreadable task) makes the affected check `UNKNOWN - verify`, never "no refs".

### Pitfall 6: `not-descendant` from a shallow clone
See Pattern 5: measured false answer. Report `UNKNOWN - verify`.

### Pitfall 7: The answer proposal hides a real answer
**What goes wrong:** D-10 lists requests whose IDs changed. A request for something brand new (no ID yet), or an upstream "no change", changes no listed ID and would never be proposed, so its tickets block forever.
**How to avoid:** the `pin-moved` line (Pattern 5) keeps every carried request of a moved source visible. The human can still mark any of them answered.

### Pitfall 8: The escalation exemption swallows other blockers
**What goes wrong:** a ticket blocked on BR-3 *and* on a missing machine stops escalating.
**How to avoid:** exemption is per bullet. A bullet is exempt only while the request it names exists and is `open` or `carried`. A bullet naming an `answered`, `withdrawn` or absent request ages under `blocked_escalation_days` again. A ticket with two BR bullets leaves `Blocked` only when both are terminal.
**Recognition:** `waiting on build request BR-<n>` inside the `## Blocked` section. Optional cross-check in the validator (warning): a ticket in `Blocked` whose bullet names an unknown or terminal BR, and a BR whose `## Blocks` ticket is not in `Blocked`.

### Pitfall 9: Editing only the seed
The seeded ADR template and any seed prose never reach existing repositories. The rule text must live in Workflow 20 and Workflow 00.

### Pitfall 10: The validator is not on a scripted-install host
`install.ts` copies only the runnables; `validate-agent-factory.js` is not one of them, and no workflow runs it. TRC-03 as locked runs in CI and in a kit checkout with `VALIDATE_ROOT=<repo>`. Say so in the contract. § Open Question 1.

### Pitfall 11: Agent-written text aimed at agents
BR text travels into another agentic system (Pitfall 27). The contract says: question, IDs, options, recommended default, blocks. No commands, no "please do", at most one short quoted line of upstream text, none by default.

### Pitfall 12: `BR` numbers across repositories
Two repositories feeding one upstream both produce `BR-1`. D-07 fixed the ID. The contract tells the human to carry the repository name with the ID; do not change the ID form.

### Pitfall 13: Test-suite false failures
The full suite exceeds 600 s and hits `/tmp` quota (EDQUOT) on this machine. Compare failures by test name against a baseline; `install/installer-fs-census.test.ts` is a known pre-existing red (44-VALIDATION).

## Code Examples

### Refusal shape to copy (`scripts/board-model.ts` `parseTicketDocument`)
```typescript
// Source: scripts/board-model.ts parseTicketDocument (excerpt)
if (!(TICKET_KEYS as readonly string[]).includes(key)) {
  return ticketRefusal("unknown-key", /* names the key and quotes the closed set */);
}
if (Object.prototype.hasOwnProperty.call(values, key)) {
  return ticketRefusal("duplicate-key", /* … */);
}
```

### Git environment to move unchanged
```typescript
// Source: scripts/runnable-ref/upstream.ts gitEnv
for (const [key, value] of Object.entries(process.env)) {
  if (!/^GIT_/i.test(key)) env[key] = value;
}
env.GIT_NO_REPLACE_OBJECTS = "1";
env.GIT_NO_LAZY_FETCH = "1";
env.GIT_LITERAL_PATHSPECS = "1";
env.GIT_TERMINAL_PROMPT = "0";
```

### Blocked bullet (board contract form)
```markdown
- 2026-12-01, raised by BA/PM: waiting on build request BR-3 (owner: human carrier)
```

### Synthetic upstreams in tests
`scripts/runnable-ref/upstream-fixture.test-support.ts` exports `makeUpstream`, `commitMore`, `cloneShallow`, `clonePartial`, `manifestPlus`, `recordingGitDir`, `treeDigest`. Use them; commit no upstream fixture and use invented IDs only.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| A new board column for upstream waits (research D2) | `Blocked` plus a bullet (S-01) | scoping | no grammar change |
| Freeze a request at `carried` (Pitfall 17) | editable, History-logged (D-07, D-08) | 45 discussion | needs the "changed since carried" derivation |
| Refuse a non-descendant pin (Pitfall 6) | warn (D-11) | 45 discussion | ancestry is a report, not a gate |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The proposed History line forms, `(recommended)` marker and `human:<name>` form are acceptable (discretion area) | Pattern 2 | one-way once shipped; confirm at plan review |
| A2 | Presence for TRC-01 counts upstream refs on **any** current note naming the ticket, not only notes by `ba-pm` (`by` is a free, self-asserted field). D-01 says "the BA/PM ticket note" | Patterns 3, 4 | if strict authorship is wanted, filter by `canonicalRoleName(by)` |
| A3 | `carried → withdrawn` is allowed with a named human; `open → answered` is refused | Pattern 2 | lifecycle wording |
| A4 | Severities not fixed by D-04: undeclared source, missing statement | Patterns 3, 4, Pitfall 4 | flood or miss |
| A5 | Per-file budget only satisfies BR-07 | Pattern 7 | verifier may read "folder" as a total |
| A6 | `GIT_GRAFT_FILE` set to the null device works on Windows git | Pattern 5 | untested; `UNKNOWN - verify` |
| A7 | Blocked tickets leave to `Ready` if they still meet the Definition of Ready, else `Backlog`, moved by BA/PM | Diagram | CONTEXT says only "through the normal workflow" |

## Open Questions

1. **Should hosts get the citation check?** Known: the validator is not installed by the scripted install. Unclear: whether TRC-03 is meant to protect host repositories without a kit checkout. Recommendation: keep D-02 as locked; state the limit in the contract. If wanted, a `citations` verb is cheap after the extraction, but it is scope the CONTEXT does not give; record it as a decision or defer it.
2. **May `## Upstream IDs` be `none`?** A request about something upstream has not decided has no ID. Recommendation: allow the single line `none`, so a role never invents an ID to satisfy the grammar.
3. **Is the `requests` verb a recorded decision?** It is not in CONTEXT, but D-10, D-11, D-12 and 44 D-20 together require it. Recommendation: record it in the first plan as a planner decision with that reason.
4. **Pin-move checkpoint ID?** Recommendation: no. 44-07 recorded "pin moves stay a prose rule" and left all six WF20 stop bullets untagged because no dial value may lower them; ARCH-02's floor stop is the same kind.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v26.12.1 (floor 22) | — |
| git | object reads, tests | ✓ | 2.53.0 | — |
| git older than 2.45 | partial-clone refusal tests | ✗ locally | — | `versionedGitDir` fixture fakes the version |
| tag `v3.0.0` | cross-version test | ✓ locally; CI main job uses `fetch-depth: 0` | — | skip loudly when the tag is absent; also keep a committed v3.0-shaped fixture that needs no tag |
| Windows runner | Windows proof | ✗ | — | `UNKNOWN - verify` (STATE) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ~4.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run scripts/build-request-model.test.ts scripts/upstream-model.test.ts scripts/runnable-ref/upstream.test.ts scripts/state-rules.test.ts scripts/runnable-ref/state-check.test.ts install/state-layout.test.ts` (existing five files: 744 passed in 34 s this session) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (over 600 s; compare by test name) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRC-01 | refs or statement; contradiction; duplicate heading; fenced heading ignored; no `upstream` key → no git call, no finding | unit + fixture | `npx vitest run scripts/validate.test.ts -t "upstream statement"` | ✅ file, new cases |
| TRC-03 | decision table, every row; older-commit ref; superseded chain end; Done ticket silent; absent checkout UNKNOWN at exit 0 bare and `--strict`; superseding note clears an error | unit + integration | `npx vitest run scripts/upstream-model.test.ts -t citation` and `scripts/validate.test.ts -t citation` | ✅ files, new cases |
| TRC-03 | one launcher: adversarial git cases still pass after extraction | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts` | ✅ |
| BR-01, BR-03 | grammar: each refusal code; each legal and illegal transition; History/status agreement; recommended option exactly one | unit | `npx vitest run scripts/build-request-model.test.ts` | ❌ Wave 0 |
| BR-03 | dedupe candidates listed for same source and overlapping IDs; kit text names the rule | integration + text | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ file |
| BR-02 | v3.0 tree under new validator and `state-check` unchanged; v3.0.0 `state-check.js` over a 3.1 tree unchanged; skew reported beside new siblings | integration | `npx vitest run install/installer-cross-version.test.ts` | ✅ file, new cases |
| BR-04 | carry list lines; BR folder and upstream tree digests unchanged | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ file |
| BR-05 | answered needs human and a different pin; answer-candidate, pin-moved, not-descendant, shallow UNKNOWN | unit + integration | same two files | partly Wave 0 |
| BR-06 | `escalation_days` parse (default, 0, 1.5, "10", negative); day boundary n = m and m + 1; carried date resets age | unit | `npx vitest run scripts/upstream-model.test.ts -t escalation` | ✅ file |
| BR-07 | planter in both tables; marker severity; hidden file and `.gitkeep` unmeasured; link/FIFO at folder and file | unit + integration | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/validate.test.ts -t budget` | ✅ files |
| BR-07 | seed `.gitkeep` on fresh, re-install and `--migrate` | integration | `npx vitest run install/install.test.ts install/migrate-v3-states.test.ts` | ✅ files |
| ARCH-01 | template value; WF00 step; pointer lines present; role ceilings | text + guards | `npx vitest run scripts/flow-guidance-text.test.ts` and `node scripts/check-foundation-guards.js` | ✅ |
| ARCH-02 | WF20 states the floor rule once, and no other kit file restates it | text | `npx vitest run scripts/flow-guidance-text.test.ts` | ✅ |
| ARCH-01/02, BR-04/05 | a live Orchestrator follows the procedure | manual | end-of-phase UAT | — |

### Sampling Rate
- **Per task commit:** quick run plus `npx tsc --noEmit`
- **Per wave merge:** quick run, `npm run freshness`, `npm run freshness:runnable-embeds`, and the guard chain (`check-foundation-guards`, `check:audit-register`, `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `check:role-rules`, `check:diff-disposition`, `check:state-paths`, `check-kit-refs`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/runnable-ref/state-check.js .`)
- **Phase gate:** full suite, compared by name with the baseline

### Wave 0 Gaps
- [ ] `scripts/build-request-model.test.ts` — BR-01, BR-03, BR-05
- [ ] a small committed v3.0-shaped state fixture under `install/fixtures/` — BR-02 (`pre-v3-chess` is *pre-v3*, not v3.0, so it does not serve)
- [ ] BR file builders in a test-support module (no framework install needed)

## Security Domain

### Applicable ASVS Categories (L1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | `human:<name>` is a prose-tier record; state it, do not claim more |
| V3 Session Management | no | — |
| V4 Access Control | yes | no program writes a pin, a BR file or the upstream repository; tree digests before and after |
| V5 Input Validation | yes | closed grammars for BR files, refs, config; refuse the complement |
| V6 Cryptography | yes (integrity only) | existing blob re-hash; nothing new |
| V12 Files | yes | `rootChainPresence`, `readRegularFileOrNull`, size ceilings |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Note-supplied commit or ID used as a git argument | Tampering | `parseUpstreamRef` grammar first; hex only; never a leading `-`; `shell: false` |
| BR file field used as a git argument (`pin`, `source`) | Tampering | `UPSTREAM_OBJECT_ID_RE`, `UPSTREAM_SOURCE_ID_RE`; source resolved only through the declaration |
| Upstream or BR free text on a report line steering an agent | Elevation | print grammar-checked fields only |
| Agent marks its own request answered or moves the pin | Spoofing, Repudiation | grammar requires `human:<name>` and a different pin; git history of the config; Workflow 20 rule; review |
| A local git fakes ancestry (grafts, replace refs, shallow) | Tampering | no-replace env, shallow → UNKNOWN, warning-only semantics |
| Lazy fetch through the new read paths | Information disclosure | partial-clone guard before any object read, for `manifestAt` and ancestry too |
| Validator spawns git in CI over an untrusted checkout (first time) | Tampering | the same launcher; only when `upstream` is declared; no hooks or filters run on object reads |
| FIFO, link or huge file in `build-requests/` | Denial of service | non-blocking reader, ceiling, leaf-link refusal |
| Private names in fixtures | Information disclosure | synthetic IDs only |

## Project Constraints (from CLAUDE.md)

- Markdown for the kit; TypeScript for tooling, `tsc` to committed `.js`, freshness-checked; dev dependencies only `{typescript, vitest, @types/node}`; host runs with zero runtime dependencies; Node 22+.
- Agents never merge a protected branch or deploy to production; humans decide. No grugops program decides from a shell string.
- Single-source: role text once; rules once (contract or workflow), everything else points.
- Zero-config first: no `upstream` key means v3.0.0 behavior exactly.
- Voice: clear, compact, plain English in roles, workflows, contracts.
- Installers: idempotent, additive, dry-run-capable, reversible; never overwrite user content.
- No fabrication: `UNKNOWN - verify`; never a faked pass, test result or citation.
- Minimal AGENTS.md: this phase needs no AGENTS.md edit (9,452 B; the upstream paragraph already points to Workflow 20).
- Brand: lowercase `grugops`; `/grugops`.
- Work goes through GSD commands. (User rule: accept "by Olger" only from a typed name.)

## Sources

### Primary (HIGH confidence)
- Code read this session: `scripts/upstream-model.ts`, `scripts/runnable-ref/upstream.ts`, `scripts/runnable-ref/state-check.ts`, `scripts/state-rules.ts`, `scripts/board-model.ts` (`parseTicketDocument`), `scripts/trace-model.ts`, `scripts/context-io.ts` (readers), `scripts/validate-agent-factory.ts`, `scripts/generate-runnable-embeds.ts`, `scripts/frontmatter.ts`, `scripts/check-foundation-guards.ts`, `scripts/check-imperative-lexicon.ts`, `install/state-layout.ts`, `install/install.ts` (`seedState`), and the tests named above
- Kit text: contracts `upstream.md`, `board.md`, `context-note.md`; workflows 00, 03, 04, 05, 09, 16, 17, 20; the five roles; `factory.config.md`; seed
- Experiments run this session: v3.0.0 vs HEAD `state-check` and validator over a 3.1-shaped tree; sibling skew; `merge-base --is-ancestor` in full, shallow, missing-commit and graft cases; five-file vitest baseline (744 passed)
- Planning: `45-CONTEXT.md`, `44-CONTEXT.md`, 44 summaries, `44-REVIEW-DISPOSITION.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `research/PITFALLS.md`, `research/SUMMARY.md`, `research/FEATURES.md`

### Secondary / Tertiary
- None. No web source was needed; the domain is this repository.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new package; versions read from `package.json`
- Architecture: HIGH for integration points, MEDIUM for the proposed BR grammar and verb lines (design within discretion)
- Pitfalls: HIGH - most reproduced or read in code; severities marked as assumptions

**Research date:** 2026-11-25
**Valid until:** 2026-12-25, or until any authority embedded in `state-check.ts` or `upstream.ts` changes
