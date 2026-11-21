# Phase 41: Orchestrator flow guidance - Research

**Researched:** 2026-11-04
**Domain:** Kit text (WF17, WF04, orchestrator and tech-lead roles) plus one new host runnable (`tools/grugops/claim.js`) built through the existing embed generator and installer pipeline
**Confidence:** HIGH for the codebase mechanics (every path, constant and gate below was read this session); MEDIUM for host behavior (Claude Code verified against its docs today; the other five hosts carried from v3.0 research or cited docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### claim.js CLI and the claim record (RUN-01, RUN-05)
- **D-01:** The shipped `tools/grugops/claim.js` offers the full lifecycle as subcommands:
  - `claim <task> --by <name>`: atomic `mkdir` of `claimed/<task>/` plus the move `pending/`→`claimed/` in one command;
  - `done <task>`;
  - `sweep`;
  - `free`: prints `queue.wip_limit` (from `.grugops/factory.config.json`, default 3) minus the `claimed/` count read from disk;
  - `now-running`.

  Each WF17 step is one command and nothing is done by hand. — **Reversibility:** costly — the CLI is a published interface in host repos (a `RUNNABLES` row with its `RUNNABLES_MIRROR` removal counterpart and the installer count tests). Renaming a subcommand later breaks agents and docs in installed repos.
- **D-02:** Every command that changes the queue (`claim`, `done`, `sweep`) finishes by re-rendering `now-running.md`. The in-flight log can't go stale between steps, and `freshness:queue` stays green. No one edits `now-running.md` by hand.
- **D-03:** `claimed/<task>/claim.md` gains optional `agent:` (the adapter name, e.g. `grugops-software-engineer-mid`) and `level:` lines, and `now-running.md` shows them. This is a recorded WF17 contract change. Old records without these lines stay valid, and the tamper rule (multiple `at:` lines) is unchanged. — **Reversibility:** costly — the record shape is read by the render, the freshness gate and fresh sessions.
- **D-04:** **The Orchestrator claims at dispatch, on the agent's behalf.** It runs `claim <task> --by <adapter>` just before it spawns, so the `claimed/` count read from disk is right immediately and a refill can't over-spawn. This reverses WF17's "does not claim on another role's behalf"; record the reversal as a decision in WF17. On a sequential host the Orchestrator claims in the role's adapter name, then switches role per `_role-switch-protocol.md`. — **Reversibility:** costly — it changes who owns the claim step in WF17, the role text and the dual-path oracle.
- **D-05:** **The agent owns its own work and status.** The agent runs `done <task>` itself as its last act. The Orchestrator only does a quick double-check: the task is in `done/` and its notes are published.
- **D-06:** If an agent returned but its task is still in `claimed/`, the Orchestrator does not close it. It resumes or re-spawns the same adapter to publish what is missing and run `done`. The slot stays counted as busy until then.
- **D-07:** `claim.js done` refuses unless the task's context folder (from the pending file's `ref:`) has at least one note written since the claim's `at`. It exits non-zero and prints why. This makes "require published notes" mechanical and is the substance of the Orchestrator's double-check.
- **D-08:** CLI output is one plain line plus an exit code, e.g. `claimed abc-104 by grugops-software-engineer-mid`, `lost abc-104`, `free 2`. A lost claim and a real error get distinct exit codes, matching the existing `tools/grugops/*.js` runnables. A lost claim is not an error; any other failure is surfaced, as WF17 step 2 already requires.

#### Refill and close loop (RUN-02, RUN-06)
- **D-09:** "Close" means **never reuse a finished agent**. New work always goes to a fresh spawn of the named adapter. A resume is allowed only to finish the agent's own unfinished task (D-06), and that still counts as claimed. This stops a resumed agent from slipping past the WIP count.
- **D-10:** A refill runs on **every agent return or completion notice and on every user turn**. Each time, the Orchestrator reads `free`, claims and dispatches up to that many from ready work (board priority: a started ticket outranks a new one; passes DoR), and only then ends the turn. On sequential hosts this reads as "take the next ready task". No timers and no polling. Key every rule on whether the spawn tool exists, never on the host name.
- **D-11:** **The stale sweep runs only at session start**, including the fresh-session fallback, when no agent the Orchestrator spawned can still be running. Inside a live session a long claim is reported, not reclaimed. This removes the race where a 30-minute sweep gives a slow agent's task to a second agent.
- **D-12:** **Room in `orchestrator.md`:** replace responsibilities 6–10 (spawn, drain, claim, sweep) with the one WF17 pointer line, and add one compact RUN-06 sentence to `## Hard limits`. The detail lives in WF17. The net size goes down and the ceiling is unchanged. Measured now: 6,036 B against the Phase 40 ceiling of WARN 6,195 B / FAIL 6,546 B (`scripts/check-foundation-guards.ts` `ROLE_CEILINGS`). The roadmap's "7,165 B" figure is stale; use the guard's numbers.
- **D-13:** The RUN-06 hard-limit wording: "The Orchestrator claims a queue task only at dispatch and only in the name of the adapter it starts (`--by <adapter>`); it never claims with itself as owner and never does a task's work." The Orchestrator starts tiered engineers by adapter name, never forks them, and never passes a model or per-invocation override to a tiered adapter. `claim.js` refuses `--by grugops-orchestrator`.

#### Session compaction (RUN-03, RUN-04)
- **D-14:** Triggers, all observable by the Orchestrator:
  - a ticket boundary: a ticket reaches a PR, Done or a stop;
  - **about 10** closed agents since the session started or last compacted;
  - a host signal: an auto-compact notice, a low-context warning, or the human saying the usage readout is near ~400k.

  "Recall drift" is not a trigger. 10 is guidance, not a gate, and there is no new config key.
- **D-15:** When a trigger fires, the Orchestrator **pauses dispatch and never asks the human**. It stops refilling, lets running agents finish, and confirms the queue, board and notes are on disk. It compacts itself if a host allows that. Otherwise it **checkpoints and carries on refilling**. A host auto-compaction is then lossless, sooner if the operator set it near 400k. The first act after any compaction or fresh session is to re-read `now-running.md` and the board, then sweep (D-11) and refill.
- **D-16:** The count of closed agents is kept **in memory** and reset by any compaction or fresh session. There is no on-disk counter or session marker.
- **D-17:** The checkpoint **commits** queue and context state on the work branch per WF17's existing Commit section: branch guard first, never a protected branch. A fresh session, or another machine, then resumes from committed state.
- **D-18:** The guidance covers the **Orchestrator only**. Role agents are short-lived, one task each.
- **D-19:** The name is "session compaction" everywhere, kept apart from WF18 "context compaction" (note-body compaction). Docs say "guidance". They never say "compacts at 400k".
- **D-20:** Operator tips go in a short optional block at the end of WF17's session-compaction section: Claude Code `/autocompact 400k`, Codex `model_auto_compact_token_limit = 400000`, Pi `compaction.reserveTokens`. For the other three hosts the block says "use the fresh-session fallback". The installer writes none of these. The Phase 43 docs link to the block.

#### WF04 hand-off residuals (carried from Phase 39 UAT 71)
- **D-21:** **Ask once.** One pattern applies to every WF04 human stop, both the hand-off/used-up stop and the gate-failure stop. Only the Orchestrator asks the human. It records the answer once in its `decision` note naming the human, then queues the Tech Lead's `pending/` subtask; that is the wake-up. The Tech Lead records its `Confirmed:` finding from that note, citing it, and never asks the human again. The `human:<name>` stamp and its admission behavior are unchanged.
- **D-22:** **Precedence: revert before the fundamental stop.** An unapproved fundamental change is not a proposal. It takes step 17's "revert the unapproved change" hand-off, which agents can do. The human stop applies only to a proposed `Fundamental:` note that is waiting for approval.
- **D-23:** **Precedence: hand-off before the raise stop.** When the options are used up and the scores also call for a raise past the spent escalation, the ticket goes to the hand-off first. The raise stop applies only if the ticket comes back still needing the raise, or under the usual three-rounds or fundamental rule.
- **D-24:** **`Approved:` and `Rejected:` lines name the human and the id of the `Fundamental:` note they answer.** The step-2 diff check passes a fundamental change only when its `Resolved:` note names that matching approval. No content hash.
- **D-25:** **The gate hold binds only the gate move.** At `exhaust_self_fix_budget: block`, the step 16 hold binds only the move made in answer to that `Cause: gate` note. A later revert hand-off on the same ticket is dispatched without waiting.
- **D-26:** **Only the waiting ticket pauses.** While one ticket waits on a human, the Orchestrator keeps refilling with other ready work and lists the open human questions in its Next action line.
- **D-27:** **WF04 shape:** add one short numbered "Stop precedence" list to step 15 covering D-22, D-23 and D-25, and state the ask-once pattern (D-21) once. Replace scattered sentences instead of adding more where possible, and keep WF04's existing guards green.

### Claude's Discretion
- Exact exit-code numbers and line wording for the CLI, following `state-check.js` and `trace-render.js`.
- How `free` behaves with a missing config or a malformed `wip_limit`: fall back to the documented default of 3 and say so, never guess silently.
- Where the WF17 flow-control steps sit inside the file, and how the "Platform depth and width" section is reconciled with them.
- How `done` finds note timestamps in the context folder. The planner verifies the field against `context-io.ts`.
- Whether the Tech Lead role text needs a matching ask-once sentence, within its ceiling.

### Deferred Ideas (OUT OF SCOPE)
- Apply the "route to the resolving role, three disputed rounds, then a human" rule to the kit's other agent-resolvable checkpoints (Phase 39 UAT test 71 follow-up). Merge, production deploy, UAT sign-off and release approval stay human. Belongs in a later phase or the backlog.
- Host-specific speed-ups (Claude Code `autoCompactWindow` in adapters, a `SubagentStop` refill nudge) stay declined for v3.0 under the no-host-only-mechanism decision. Reopen only by a recorded decision that relaxes it.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RUN-01 | The in-flight log is the queue's `claimed/` set rendered to `now-running.md`; it holds only running work and empties as tasks finish | `transition(claimed→done)` today leaves `claimed/<task>/claim.md` behind, so the log never empties (Pitfall 1). `done` must release the claim directory. Render extension for `agent:`/`level:` (D-03) in `renderNowRunning`. |
| RUN-02 | On every completion the Orchestrator closes the finished agent and refills free capacity from disk, no timers or polling | Claude Code delivers background results "as a completion notification in a later turn" (verified). Refill keyed on that event plus each user turn (D-10). Resumes bypass the concurrency check (verified), so D-09's never-reuse rule is load-bearing. |
| RUN-03 | Session compaction guidance with observable signals and a fresh-session fallback on every host | No host documents an agent-callable compaction (Claude Code verified; others cited). Claude Code docs: background subagents keep running through compaction, which drives the sweep-timing pitfall (Pitfall 4). |
| RUN-04 | Flow text in WF17, one-line pointer in `orchestrator.md` under its ceiling, same on six hosts, optional operator tips | Ceiling numbers, the responsibilities 6–10 trim, the registry claims that measure orchestrator.md (Pitfall 6), lexicon and sentence bounds for the new WF17 text. |
| RUN-05 | `claim.js` ships as a materialized runnable | Exact path: `scripts/runnable-ref/claim.ts` with a new `EMBED_SPECS` row, a `RUNNABLES` row plus `RUNNABLES_MIRROR` row, count pins in the installer tests. Two embed collisions must be fixed first (Pitfall 2). |
| RUN-06 | Tiered engineers started by adapter name, never forked, no model override, Orchestrator never claims a ticket itself | Claude Code docs today: per-invocation `model` outranks frontmatter; per-invocation `effort` exists for non-fork subagents since v2.1.292; a fork runs on the main session's model. WF04 step 4 already carries "Pass no `model` or `effort` parameter". `claim.js` refuses `--by grugops-orchestrator`. |
</phase_requirements>

## Summary

This phase is about 80% kit-text work held by a dense set of text gates, and 20% one new host program. The program is the risky part. `scripts/claim.ts` already holds the queue primitives (`claimTask`, `transition`, `sweepStale`, `renderNowRunning`), but it cannot be copied to a host as it stands: it imports `./is-entry.js`, its default queue root is `join(import.meta.dirname, "..")` (which on a host would resolve to `tools/.grugops/queue`), and its CLI only renders. The established shape for a host program is a hand-written `scripts/runnable-ref/<name>.ts` whose rules are copied in by `scripts/generate-runnable-embeds.ts` from the authority modules, compiled to committed `.js`, freshness-gated, and copied by `install.ts` `RUNNABLES` into `tools/grugops/`. `claim.js` should follow that shape exactly, with `scripts/claim.ts` as the authority.

Three things in the existing code change what the plan has to do. First, `done` today leaves the claim directory in `claimed/`, so `now-running.md` never empties and `free` would count finished work as running; the new `done` must remove `claimed/<task>/`. Second, the embed generator refuses two declarations with one name in one target, and `claim.ts` and `context-io.ts` both declare `TASK_NAME_RE` and `assertSafeTask` (D-07's note check needs context-io's note reader, which reaches both). Third, the D-07 note check counts only sealed notes, and the only sealed-note writer on a host is the Claude Code plugin's MCP server: the kit home holds only `agent-factory/`, so on the other five hosts no agent can write a sealed note, and `done` would refuse forever. Open Question 1 asks the human how to handle this.

On the host side, Claude Code's docs (fetched today) settle the research flags: a per-invocation `effort` parameter exists for non-fork subagents from v2.1.292, a per-invocation `model` outranks the adapter's frontmatter, and a fork runs on the main session's model. So "name the adapter, pass no `model` or `effort`, never fork" is the right rule, and WF04 step 4 already says it. No host documents a way for the agent to compact its own session, and Claude Code does not document the model seeing its own context usage. The guidance must therefore stay on observable triggers, with a fresh session as the universal fallback, as D-14 and D-15 already say.

**Primary recommendation:** Build `claim.js` as a fifth `EMBED_SPECS` runnable row over `scripts/claim.ts`, after first moving the task-name rule to a single owner and removing the library's default queue root. Then rewrite WF17 around one command per step, and land the WF04 and role edits with disposition rows and the `tier-kit-text.test.ts` pins updated in the same commits.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Atomic claim, transition, sweep, render, free count | Kit authority module (`scripts/claim.ts`) | Host runnable (`tools/grugops/claim.js`, generated copy) | Rules live once in the authority; the host copy is generated and freshness-checked, never retyped |
| Argument parsing, root resolution, exit codes, output lines, config read | Host runnable hand-written part (`scripts/runnable-ref/claim.ts`) | — | Same split as `trace-render`, `state-check`, `state-roll` |
| "Note since claim" check (D-07) | Kit authority (`scripts/context-io.ts` note reader, embedded) | Host runnable | The note grammar, seal check and skip arms have one owner |
| Shipping to host repos | Installer (`install/install.ts` `RUNNABLES`) | Uninstaller (`install/uninstall.ts` `RUNNABLES_MIRROR`) | Additive, never-overwrite, ledger-recorded, reversible |
| Refill, close, sweep timing, session compaction | Kit text: WF17 | `orchestrator.md` (one pointer line), `_role-switch-protocol.md` | Single-source rule; roles point, never restate |
| Hand-off stop precedence, ask-once | Kit text: WF04 steps 14–17 | `tech-lead.md` (optional ask-once sentence) | WF04 is the home of the blocked-ticket path |
| Spawn by adapter name, no override, no fork | Kit text: WF04 step 4 + WF17 | `orchestrator.md` Hard limits sentence (D-13) | Host spawn mechanics are Claude Code only; text keys on whether `Agent` exists |
| Operator compaction tips | Kit text: WF17 optional block | Phase 43 docs | No installer write (D-20) |

## Standard Stack

No new libraries. The phase uses only what the repository already runs.

### Core
| Component | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | host prerequisite 22+; this machine v26.12.1 | Runs the committed `claim.js` on hosts with no dependencies | `package.json` `"engines": { "node": ">=22" }` [VERIFIED: package.json] |
| TypeScript | ~6.0.3 (installed 6.0.3) | Author `scripts/runnable-ref/claim.ts`, compile to committed `.js` | Project rule D-13 [VERIFIED: package.json devDependencies] |
| vitest | ~4.1.8 (installed 4.1.8) | Tests | [VERIFIED: package.json, `npx vitest --version`] |
| `scripts/generate-runnable-embeds.ts` | in repo | Copies authority declarations into the runnable's generated region | The only sanctioned way a rule reaches a host runnable [VERIFIED: generate-runnable-embeds.ts:1-45] |

### Supporting (in-repo modules the runnable embeds from)
| Module | Roots to embed | When to Use |
|---------|---------|-------------|
| `scripts/claim.ts` | `claimTask`, `transition`, `sweepStale`, `renderNowRunning`, plus new `completeTask`, `claimedCount`, `freeSlots`, `parseQueueConfig` (names are proposals) | Every subcommand |
| `install/state-layout.ts` | `QUEUE_REL`, `QUEUE_PENDING_REL`, `QUEUE_CLAIMED_REL`, `QUEUE_DONE_REL`, `CONTEXT_REL`, `GRUGOPS_DIR_REL` | Paths, never retyped |
| `scripts/context-io.ts` | `readRawNotesWithSkips`, `recordFromParsed`, `readRegularFileOrNull`, `rootChainPresence`, `isWithin`, `ROOT_CHAIN_LINK_REFUSAL`, `entryPresence` | D-07 note check, FIFO-safe config read, symlink refusal |
| `scripts/state-rules.ts` | `stripControlChars` | Sanitize every printed value |
| `scripts/runnable-stamp.ts` | stamp lines (automatic for `runnable` rows) | Joins the build-stamp set |

**Installation:** none. `npm run build && npm run generate:runnable-embeds` after editing.

## Package Legitimacy Audit

Not applicable: this phase installs no external package. The runnable imports `node:` builtins only, and the dev dependencies (`typescript`, `vitest`, `@types/node`) are unchanged.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 user turn / agent completion notice  (no timers, no polling)
            │
            ▼
   Orchestrator (main thread, or sequential window)
            │  1. node tools/grugops/claim.js free  ──► reads .grugops/factory.config.json (queue.wip_limit, default 3)
            │                                         └► counts .grugops/queue/claimed/*  → "free N"
            │  2. pick up to N ready subtasks (started ticket first, DoR passes)
            │  3. claim.js claim <task> --by <adapter> [--level L]
            │        ├─ pending/<task>.md missing ──► refuse (exit 2)
            │        ├─ mkdir claimed/<task>/  EEXIST ──► "lost <task>" (exit 1), next task
            │        └─ won: write claim.md, rename pending→claimed, re-render now-running.md (exit 0)
            ▼
   Agent tool exists?
     yes ─► spawn named adapter (non-fork, no model/effort param) — prompt = task reference only
     no  ─► _role-switch-protocol.md: switch into the role in the same window
            │
            ▼
   Role agent: reads context (WF16) → works → publishes notes (WF16 writer)
            │  last act: claim.js done <task>
            │        ├─ no note in ref'd context folder with at >= claim at ──► refuse, says why (non-zero)
            │        └─ ok: rename claimed→done, remove claimed/<task>/, re-render now-running.md
            ▼
   Orchestrator on the return: task in done/? notes present?
     no  ─► resume/re-spawn same adapter to finish (slot stays busy, D-06)
     yes ─► count closed agent (+1, in memory) → check session-compaction triggers → refill (loop to top)

 session start / fresh session:  read now-running.md + board → claim.js sweep (TTL, reclaim stale) → refill
```

### Recommended file layout

```
scripts/
├── claim.ts                     # authority: library rules (+ completeTask, free count, config parse); kit CLI keeps `now-running [queueRoot]`
├── claim.js                     # committed build
└── runnable-ref/
    ├── claim.ts                 # NEW host program: argv, root checks, exit codes, output; one generated region
    ├── claim.js                 # NEW committed build, copied to hosts
    └── claim.test.ts            # NEW host-copy tests (the committed .js copied alone into a temp dir)
install/install.ts               # RUNNABLES += ["scripts/runnable-ref/claim.js", "tools/grugops/claim.js"]
install/uninstall.ts             # RUNNABLES_MIRROR += same row (edit both together)
agent-factory/workflows/17-task-claim.md   # the flow guidance home
agent-factory/workflows/04-ticket-to-pr.md # step 4 claim line, step 15 stop precedence, ask-once
agent-factory/roles/orchestrator.md        # responsibilities 6–10 → one pointer; one Hard limits sentence
agent-factory/roles/_role-switch-protocol.md  # step 4: the Orchestrator claimed; the role runs done
docs/audit/29-style-dispositions/41-NN.md  # one disposition file per plan that changes watched text
```

### Pattern 1: A host runnable built from an authority by generation
**What:** The host program holds argv, boundary checks and output. Every rule comes from an authority through one marked region, regenerated by `npm run generate:runnable-embeds` and checked by `npm run freshness:runnable-embeds`.
**When to use:** Always, for `tools/grugops/claim.js`. A hand copy of a rule is refused by project rule.
**Example (the existing row shape to copy):**
```typescript
// Source: scripts/generate-runnable-embeds.ts:310-340 (the state-roll row), read this session
{
  target: "scripts/runnable-ref/state-roll.ts",
  authorities: [
    { module: "install/state-layout.ts", roots: ["BOARD_REL", "ARCHIVE_REL", "BOARD_DONE_ARCHIVE_REL", "PROGRESS_REL", "PROGRESS_ARCHIVE_REL", "BUDGETS"] },
    // ...
    { module: "scripts/context-io.ts", roots: ["readRegularFileOrNull", "atomicWrite", "rootChainPresence", "isWithin", "ROOT_CHAIN_LINK_REFUSAL"] },
  ],
},
```
The new row adds `target: "scripts/runnable-ref/claim.ts"` with roots from `scripts/claim.ts`, `install/state-layout.ts`, `scripts/context-io.ts` and `scripts/state-rules.ts`. `EMBED_SPEC_COUNT` moves 4 → 5 in the same commit [VERIFIED: generate-runnable-embeds.ts:392 `export const EMBED_SPEC_COUNT = 4;`].

### Pattern 2: The materialized-runnable row pair
**What:** One row in `RUNNABLES` and the same row in `RUNNABLES_MIRROR`.
**Verbatim today** [VERIFIED: install/install.ts:6044-6070]:
```typescript
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
  ["scripts/runnable-ref/uat-spec-integrity.js", "tools/grugops/uat-spec-integrity.js"],
  ["scripts/runnable-ref/host-protection.js", "tools/grugops/host-protection.js"],
  ["scripts/runnable-ref/state-check.js", "tools/grugops/state-check.js"],
  ["scripts/runnable-ref/trace-render.js", "tools/grugops/trace-render.js"],
  ["scripts/runnable-ref/state-roll.js", "tools/grugops/state-roll.js"],
  ["LICENSE", "tools/grugops/LICENSE"],
  ["install/runnable-package.json", "tools/grugops/package.json"],
];
```
`install/uninstall.ts:2795-2808` holds the identical list as `RUNNABLES_MIRROR` [VERIFIED]. The header at install.ts:6038-6043 says to edit the two together. `tools/grugops/package.json` is `{"type":"module"}` [VERIFIED: install/runnable-package.json:1], so an ESM `claim.js` loads on a CommonJS host with no change.

**Count pins that move with one more runnable:** `install/uninstall-removal.test.ts:112` `const RUNNABLE_PATH_COUNT = 7;` [VERIFIED]; `install/installer-cross-version.test.ts:67` names "7 runnables" in its expected-set string [VERIFIED]; `installer-never-installed.test.ts` and `installer-special-files.test.ts` carry per-row comments and derived sets. Run those four files red first, then move each pin by the measured number.

### Pattern 3: Kit text keyed on capability, never host name
**What:** "Where the `Agent` spawn tool exists … Where it does not …". `orchestrator.md` already does this; D-10 requires it for every new rule.
**When to use:** Every refill, close and compaction sentence. Host names appear only in the D-20 operator-tips block and in the existing "Platform depth and width" facts.

### Recommended CLI contract (Claude's discretion; follows the existing runnables)

The existing runnables use exit 0 = done or clean, 1 = a finding the caller acts on, 2 = could not run or refused, and they map any escaped throw to exit 2 with one `Error: … did not run.` line on stderr [VERIFIED: runnable-ref/trace-render.ts:1070-1100; runnable-exit-contract.test.ts:1-10].

| Command | stdout on success (exit 0) | exit 1 (an outcome to act on) | exit 2 (could not run / refused) |
|---|---|---|---|
| `claim <task> --by <adapter> [--level junior\|mid\|senior]` | `claimed <task> by <adapter>` | `lost <task>` (EEXIST; not an error, D-08) | bad task name; `--by` is `grugops-orchestrator`; CR/LF or unsafe chars in `--by`; no `pending/<task>.md`; `done/<task>.md` already exists; rename failed (claim dir rolled back) |
| `done <task>` | `done <task>` | `not-done <task>: no note in <ref> since <at>` (D-07: publish, then retry) | task not in `claimed/`; `ref:` missing or not `.grugops/context/<safe-name>/`; unreadable notes dir |
| `sweep` | `swept N` plus one line per reclaimed task | — | queue unreadable |
| `free` | `free N`; when defaulted: `free N (queue.wip_limit not set, default 3)` | — | config present but not a regular file (FIFO) |
| `now-running` | `rendered .grugops/queue/now-running.md` | — | queue unreadable |

- **Root:** recommend the current directory, with an optional `--root <dir>`, resolved once with realpath. Refuse (exit 2) when `<root>/.grugops` is absent, so a wrong working directory never creates a stray queue. The existing runnables take a positional `<repo-root>`; a subcommand CLI with a positional task makes that awkward, so this is the one deliberate difference. `[ASSUMED]` that agents reliably run from the repository root; the refusal is the safety net.
- **Queue directories:** `claimTask` uses a non-recursive `mkdirSync` and treats a missing `claimed/` parent as a real ENOENT [VERIFIED: claim.ts:121-128]. The installer does not seed `.grugops/queue/` (no queue path is created in `install.ts`; only the migrate reads `QUEUE_CLAIMED_REL` at 7083-7123) [VERIFIED: grep + read]. So `claim` must create `pending/`, `claimed/` and `done/` under a root-chain check before the claim.
- **`free` arithmetic:** `max(0, wip_limit − claimed count)`. When the count exceeds the limit, print `free 0 (4 claimed, wip_limit 3)` so an over-spawn is visible.
- **Config read:** read only `.grugops/factory.config.json` through the embedded `readRegularFileOrNull` (FIFO-safe). A missing file, a missing `queue` object or key, or a value that is not a positive integer falls back to the documented default and says so. The defaults are `wip_limit: 3`, `claim_cap: 2`, `stale_ttl_minutes: 30` [VERIFIED: agent-factory/seed/.grugops/factory.config.json:63-67; factory.config.md:103-105, 283]. No TypeScript constant holds them today, so add one in `scripts/claim.ts` and bind it to the seed file with a test.

### Anti-Patterns to Avoid
- **Copying `scripts/claim.js` to hosts as is:** it imports `./is-entry.js` (not shipped), and its `DEFAULT_QUEUE_ROOT = join(ROOT, ".grugops", "queue")` with `ROOT = join(import.meta.dirname, "..")` [VERIFIED: claim.ts:60-61] would point at `tools/.grugops/queue` on a host.
- **A second in-flight file:** `now-running.md` is the only log. A new log-like file under `.grugops/` is the warning sign in PITFALLS 14.
- **A token number as a trigger:** "compact at 400k" written as a rule. D-19 forbids it.
- **Counting remembered agents:** the count always comes from `claimed/` on disk.
- **Hand-editing `now-running.md`:** every queue-changing command re-renders it (D-02).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic claim | A lock file, `O_EXCL`, a pid check | `claimTask` (atomic `mkdirSync`, EEXIST = lost) | NFS-safe; `O_EXCL` is unreliable on NFS [VERIFIED: claim.ts:14-18] |
| Subtask moves | copy + delete | `transition` / `atomicRename` (Windows unlink-then-rename branch) | Already handles MoveFileEx [VERIFIED: claim.ts:79-100] |
| Reading notes for D-07 | A frontmatter regex over `notes/*.md` | Embedded `readRawNotesWithSkips` + `recordFromParsed` | Seal check, skip arms, symlink and boundary refusals are already owned [VERIFIED: context-io.ts:2403-2420] |
| Reading the config | `readFileSync` + `JSON.parse` | Embedded `readRegularFileOrNull` | A FIFO at the config path hung a reader before (finding RA1-2) [VERIFIED: context-io.ts:1089] |
| Path refusals | ad-hoc `join` | Embedded `rootChainPresence` + `isWithin` | A symlinked `.grugops` or `queue` is a refusal by name in every other runnable |
| Printed values | raw interpolation | Embedded `stripControlChars` | Same rule in every runnable |
| The render | a new table writer | `renderNowRunning` extended with the two fields | Deterministic and byte-reproducible today; tamper rule built in [VERIFIED: claim.ts:262-319] |

**Key insight:** every rule `claim.js` needs already has an owner in the repository. The work is closure plumbing and the hand-written CLI, not new logic, except for `completeTask`, the free count and the config parse.

## Runtime State Inventory

This phase changes a record contract (D-03) and who claims (D-04), not a name. The inventory is short.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Host repos may hold `claimed/<task>/` directories whose subtask already sits in `done/`, because today's `done` (a bare `transition`) never removed the claim directory. They count as running and block the migrate (`claimedQueueRefusal`, install.ts:7083-7123). | `sweep` should release such a directory and report it as "released (already done)", not as a reclaim to `pending/`. Today `sweepStale` removes it and lists it as reclaimed with no file moved [VERIFIED: claim.ts:205-213]. |
| Live service config | None — verified: no external service holds queue state. | None |
| OS-registered state | None — the phase adds no scheduler, hook or daemon (no timers, D-10). | None |
| Secrets/env vars | None. | None |
| Build artifacts | Hosts installed before this phase have no `tools/grugops/claim.js`; install adds it on the next run (never-overwrite does not block a new file). Hosts keep older `state-check.js` etc. when they differ, which is today's behavior. | None beyond the install row |

## Common Pitfalls

### Pitfall 1: `done` never empties the in-flight log
**What goes wrong:** `transition(claimed→done)` renames only `claimed/<task>/<task>.md`. `claimed/<task>/claim.md` stays, so `renderNowRunning` keeps the row, `free` counts it, and the migrate refuses a non-empty `claimed/`.
**Why it happens:** WF17 step 5 was written for the file move only [VERIFIED: 17-task-claim.md:53; claim.ts:143-153].
**How to avoid:** add `completeTask(queueRoot, task)` to `scripts/claim.ts`: rename to `done/`, then `rmSync(claimed/<task>, {recursive:true})`, then render. Test that `claimed/` is empty and `now-running.md` is header-only after the last `done`.
**Warning signs:** a `now-running.md` row whose task is in `done/`.

### Pitfall 2: The embed generator refuses the claim row
**What goes wrong:** `npm run generate:runnable-embeds` throws on a name collision.
**Why it happens:** the generator refuses "two embedded declarations … with one name in one target" [VERIFIED: generate-runnable-embeds.ts:18-24]. `scripts/claim.ts:68-69` declares `const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;` and `function assertSafeTask(task: string): void {`, and `scripts/context-io.ts:127-128` declares the same two names. `readRawNotesWithSkips` calls context-io's `assertSafeTask`, and `claimTask` calls claim.ts's. Both `atomicWrite` (claim.ts:224, context-io.ts:967) and `cell` (claim.ts:251, context-io.ts:4706) are also duplicated; they collide only if both sides reach them, so keep context-io's `atomicWrite` out of the roots.
**How to avoid:** make one owner. Recommended: `scripts/claim.ts` imports the task-name rule from `context-io.ts` (export it there), and keeps its own error wording in a differently named wrapper if needed. Alternatively rename claim.ts's copies. Either way, write a generator test that the claim row generates.
**Second embed hazard:** `renderNowRunning(queueRoot: string = DEFAULT_QUEUE_ROOT)` [VERIFIED: claim.ts:277] pulls `DEFAULT_QUEUE_ROOT` and `ROOT` (an `import.meta.dirname` path) into the closure. Remove the default from the library and let the kit CLI pass it; no other caller relies on the default (the freshness gate and every test pass an explicit root) [VERIFIED: grep of callers].

### Pitfall 3: D-07 can never pass on five hosts
**What goes wrong:** `done` refuses forever on Codex, Antigravity, OpenCode, Copilot and Pi.
**Why it happens:** the embedded note reader skips unsealed notes (`NOTE_SKIP_ARMS` includes `"unsealed"`, context-io.ts:2139). WF16 step 3 says a note written by hand "is refused on read as `unsealed`" [VERIFIED: 16-context-read-write.md:31]. The sealed writer reaches agents only through the Claude Code plugin's MCP server (`.claude-plugin/plugin.json` `mcpServers.grugops` → `${CLAUDE_PLUGIN_ROOT}/scripts/admission-server.js`) [VERIFIED: plugin.json]. The installed kit home on this machine holds only `agent-factory/` (no `scripts/`), so no host repo has `context-io.js` [VERIFIED: `ls ~/.grugops`].
**How to avoid:** see Open Question 1. Whatever is decided, the refusal line must name unsealed notes it found ("2 notes found, none sealed") so the gap is visible, never silent.
**Warning signs:** a host dogfood where every `done` fails.

### Pitfall 4: Sweeping after an in-session compaction steals running work
**What goes wrong:** D-15 says the first act after any compaction is "re-read … then sweep (D-11) and refill". After a Claude Code auto-compaction, spawned agents are still running.
**Why it happens:** Claude Code docs: after compaction, "Background commands and background subagents … Keep running. Claude Code reminds Claude which ones are still running so it doesn't start a duplicate" [CITED: code.claude.com/docs/en/context-window, fetched 2026-11-04].
**How to avoid:** word WF17 so the sweep runs only at session start (D-11's own rule): after an in-session compaction, re-read `now-running.md` and the board, then refill, with no sweep. Read D-15's "(D-11)" as "when D-11 allows it". Confirm this reading with the human at plan check.

### Pitfall 5: A resume slips past the width cap
**What goes wrong:** the running count passes `queue.wip_limit`.
**Why it happens:** "Resuming a subagent that already finished takes a fresh slot without checking the limit, so resumes can push the running count past it" [CITED: code.claude.com/docs/en/sub-agents].
**How to avoid:** D-09 (never reuse a finished agent for new work) and D-06 (a resume only finishes its own claimed task, which is still counted in `claimed/`). The count stays right because it is read from disk.

### Pitfall 6: Trimming responsibilities 6–10 drops things other checks measure
**What goes wrong:** a registry claim goes false, or the gate step disappears.
**Why it happens:** responsibility 9 is "Run the gate before a ticket advances." — it sits inside 6–10 but is not flow [VERIFIED: orchestrator.md:35]. `docs/audit/28-claim-registry.md` claims C-28-013 and C-28-025 are measured against `orchestrator.md` for "the role-activation step" [VERIFIED: 28-claim-registry.md:236-250, 412-422], and responsibilities 6–7 are that step today.
**How to avoid:** keep "Run the gate before a ticket advances." as its own item, and make the WF17 pointer line itself name role activation, for example: "Start role agents, claim, refill, sweep and compact per `agent-factory/workflows/17-task-claim.md`." Run `npm run check:claim-anchors` and `npm run audit:prepass` after the edit.
**Facts that are safe:** the role-rule inventory's orchestrator facts (`wip-limit`, `claim-cap`, `no-relay`, `only-spawner`, `wf17`) come from `## Hard limits` and file-wide anchors, not from responsibilities 6–10 [VERIFIED: docs/audit/40-role-rule-inventory.json; check-role-rules.ts:142-148].

### Pitfall 7: Every changed clause needs a disposition row, and Hard limits need a human
**What goes wrong:** `node scripts/check-diff-disposition.js` goes red.
**Why it happens:** the gate watches all 19 roles, all 19 workflows and `_role-switch-protocol.md`, and freezes roles' `## Hard limits` / `## Stop when` and workflows' `## Stop conditions` / `## Commit` [VERIFIED: gate output this session: "roles `## Hard limits` 19/19, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, roles `## Stop when` 19/19"]. A role clause in `## Hard limits` or `## Stop when` is never offered to the D-30 stand-in and needs a row with a filled companion [VERIFIED: gate output "306 role clause(s) sit in `## Hard limits` or `## Stop when` …"]. Rows live in `docs/audit/29-style-dispositions/<plan>.md` under `## Dispositions` with seven columns `file | line | before | after | rule | disposition | companion` [VERIFIED: 29-style-dispositions/README.md:30-45]; in Phase 40 each disposition cell stayed pending until the named human read it [VERIFIED: 40-24.md header].
**How to avoid:** every plan that touches WF04, WF17, a role or the protocol writes its own `41-NN.md` and schedules a human read of the frozen-region rows. D-13's new Hard limits sentence is one such row.

### Pitfall 8: The text gates reject new WF17 and WF04 sentences
**What goes wrong:** `node scripts/check-imperative-lexicon.js` goes red.
**Why it happens:** each `## Steps` bullet, sub-bullets included, starts with a verb from `APPROVED_STEP_VERBS` [VERIFIED: check-imperative-lexicon.ts:548-592: Append, Apply, Assemble, Assess, Attach, Capture, Claim, Clarify, Compile, Confirm, Create, Degrade, Distill, Draft, Emit, Escalate, Establish, Hand, Identify, Implement, List, Mark, Meet, Obtain, Produce, Promote, Propose, Pull, Read, Recommend, Reconcile, Record, Run, Seed, Set, Size, Split, Transition, Update, Validate, Verify, Walk, Write]. Procedural sentences are capped at 20 words and descriptive ones at 25 (`PROCEDURAL_SENTENCE_MAX_WORDS = 20`, `DESCRIPTIVE_SENTENCE_MAX_WORDS = 25`, lines 600-601). Any ordered-list line anywhere takes the 20-word bound, and a modal (`should may might could would must shall can`) in a procedural step is red. Two chained approved verbs ("Claim … and spawn") is WP-08. Roles are in the governed corpus now ("roles 20").
**How to avoid:** "Spawn", "Refill", "Close", "Sweep" and "Pause" are not approved verbs. Write steps as "Run `node tools/grugops/claim.js free`…", "Claim …", "Hand …", "Read …", "Mark …", "Transition …". Do not add a verb to the list (a writing-profile decision).

### Pitfall 9: Count pins that move
- `WORKFLOW_STOP_BULLET_COUNT = 48` [VERIFIED: checkpoints.ts:355] moves if a WF17 or WF04 `## Stop conditions` bullet is added or removed.
- `CHECKPOINT_SITE_COUNTS` and `RECORDED_TOTAL_SITES = 19` [VERIFIED: checkpoints.ts:796-821] move if a `checkpoint:` tag is added; WF04 holds `exhaust_self_fix_budget` exactly once (`tier-kit-text.test.ts` asserts `split(...).length - 1 === 1`).
- `WORKFLOW_COUNT = 19` [VERIFIED: kit-model.ts:123] must not move: no new workflow file.
- `EMBED_SPEC_COUNT = 4` → 5; `RUNNABLE_PATH_COUNT = 7` → 8; the "7 runnables" string in installer-cross-version.
- `scripts/tier-kit-text.test.ts` pins about 40 WF04 step 15–17 sentences verbatim (for example "At `block`, the default, stop for a named human, and record no move until the human answers.", "Point its `ref:` at the same per-task context.", "Pass no `model` or `effort` parameter on the spawn call.") [VERIFIED: tier-kit-text.test.ts:866-1100]. D-27's rewording changes these pins in the same commit; the IN-04 case finds step numbers by text, and `numbered()` keeps an indented `1.` list inside step 15 [VERIFIED: tier-kit-text.test.ts:119-135].

### Pitfall 10: Stale platform facts in WF17
**What goes wrong:** WF17 states a cap the host no longer has.
**Why it happens:** 17-task-claim.md:35 says "Claude Code caps 20 concurrent subagents and 200 per session." Today's docs: "There's no limit on the total number of subagents Claude can spawn over a session" and the concurrent limit is 20 by default, set by `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` [CITED: code.claude.com/docs/en/sub-agents, fetched 2026-11-04].
**How to avoid:** correct the line while reconciling "Platform depth and width", and add the resume fact (Pitfall 5).

### Pitfall 11: D-13's "never does a task's work" on a sequential host
**What goes wrong:** the sentence reads false in the degraded tier, where the same window does the role's work after a role switch.
**How to avoid:** qualify it, for example "it never does a task's work as the Orchestrator; on a host without `Agent` it switches role per `_role-switch-protocol.md` first". Keep within 25 words per sentence. Also update `_role-switch-protocol.md` step 4 ("When the work was queued, claim the subtask per Workflow 17 … first." [VERIFIED: _role-switch-protocol.md:23]) and `agent-factory/README.md:106` ("each role claims its subtask") [VERIFIED], which D-04 makes wrong.

### Pitfall 12: Token or cost wording trips the banned-claims gate
**What goes wrong:** session-compaction prose says it "saves tokens" or is "cheaper".
**How to avoid:** describe triggers and effects only. The banned literals include "fewer tokens", "saves tokens", "token savings" (PITFALLS 15). Run `npm run check:banned-claims`.

## Code Examples

### The claim record today, and the D-03 extension
```typescript
// Source: scripts/claim.ts:130-135 (read this session)
const at = new Date().toISOString();
writeFileSync(
  join(claimDir, "claim.md"),
  `---\nby: ${by}\nat: ${at}\ntask: ${task}\n---\n`,
  "utf8",
);
```
Proposed: optional `agent:` and `level:` lines after `by:`, each validated single-line (the CR-02 guard already rejects CR/LF in `by`, claim.ts:116-120), `level` from a closed set. The render's header today is `| task | by | since |` (pinned in now-running-freshness.test.ts:113) and its first line is `<!-- GENERATED — do not hand-edit. Re-run: node scripts/claim.js now-running -->` (claim.ts:308). On a host that command is wrong; render `node tools/grugops/claim.js now-running` instead, or take the command as a parameter.

### Locating the context folder for D-07
The pending file is `# subtask <t>\nref: .grugops/context/<t>/\n` in every test and oracle fixture [VERIFIED: claim.test.ts:57, convergence-spine.test.ts:66, check-uat-oracles.ts:469]. In `claimed/` it sits at `claimed/<task>/<task>.md` [VERIFIED: claim.ts:158-162]. WF04 step 16 points a re-pended subtask's `ref:` "at the same per-task context", so the folder name can differ from the task name. Parse `ref:` with an anchored pattern `^ref: \.grugops/context/([A-Za-z0-9._-]+)/?$`, refuse anything else, and read notes with the embedded `readRawNotesWithSkips(folder, <root>/.grugops/context, realRoot)`. Compare `Date.parse(note.at) >= Date.parse(claim.at)`; the note `at` is the authoritative replay key (`at: string; // ISO-8601 — the authoritative replay sort key`, context-io.ts:88).

### Spawn rule (Claude Code), as WF04 step 4 already states it
"Spawn that adapter by name as a non-fork sub-agent. Pass no `model` or `effort` parameter on the spawn call. Never re-decide the level." [VERIFIED: 04-ticket-to-pr.md:31]. Add the claim before it: "Run `node tools/grugops/claim.js claim <task> --by <adapter>`." (one instruction per sentence).

## State of the Art (host facts, checked today)

| Fact | Current state | Source | Impact |
|---|---|---|---|
| Per-invocation `model` | Outranks frontmatter: order is per-invocation `model`, then frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then main model | [CITED: code.claude.com/docs/en/sub-agents] | Passing `model` flattens a tier: RUN-06 forbids it |
| Per-invocation `effort` | "When you ask Claude to run a non-fork subagent at a specific effort level, it can also pass an `effort` parameter … requires Claude Code v2.1.292 or later"; overrides the `effort` field and persists on resume | [CITED: same page] | Resolves the research flag: yes, it exists; forbid it for tier adapters. STACK.md's "no documented per-invocation effort" is stale; FEATURES.md was right |
| Fork model | Fork: "Same as main session"; non-fork: "From the subagent's `model` field". Fork mode on by default from v2.1.302 | [CITED: same page] | A forked junior runs on the Orchestrator's model; name the adapter |
| Stop forks entirely | `"Agent(fork)"` in `permissions.deny`, or `CLAUDE_CODE_FORK_SUBAGENT=0` | [CITED: same page] | Optional operator tip only; installer writes nothing (D-20 spirit) |
| Completion | "A background subagent's results reach Claude as a completion notification in a later turn" | [CITED: same page] | The refill event for D-10 |
| Concurrency | 20 running by default; no session total; resumes skip the check | [CITED: same page] | Corrects WF17:35 |
| Names after restart | Names given since the last compaction survive a restart; older ones need the agent ID | [CITED: same page] | After a fresh session, prefer re-spawn over resume for D-06 |
| Agent-visible context usage (Claude Code) | Not documented; `/context` is a user command | [CITED: code.claude.com/docs/en/context-window] — no statement found | Keep it assumed invisible [ASSUMED] |
| Agent-triggered compaction (Claude Code) | Only `/compact` (user) and automatic | [CITED: same page] | "Compacts itself if a host allows" has no current host case |
| `/autocompact 400k` | Valid shape: "run `/autocompact` with a token count, like `/autocompact 500k`" | [CITED: code.claude.com/docs/en/context-window, /model-config] | Tip text OK |
| Codex `model_auto_compact_token_limit` | Documented optional token threshold in `config.toml` | [CITED: developers.openai.com/codex/config-sample] | Tip text OK |
| Pi `compaction.reserveTokens` | Compacts when `contextTokens > contextWindow - reserveTokens`, default 16384, in `.pi/settings.json` | [CITED: github.com/earendil-works/pi docs/compaction.md, via gh api] | Tip must say the value depends on the model window |
| Copilot, OpenCode, Antigravity | Auto-compaction exists; no documented threshold key | [CITED: v3.0 STACK.md § (c)] | "Use the fresh-session fallback" |

**Installed here:** Claude Code 2.1.316 (past both v2.1.292 and v2.1.302). The other five CLIs are absent on this machine, so no live check of them is possible in this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No host lets the agent see its own context-token count (beyond Claude Code, where the docs are silent) | State of the Art | Low: the guidance uses observable triggers anyway |
| A2 | No host other than Claude Code exposes an agent-callable compaction without a host extension | State of the Art | Low: D-15 already falls back to "checkpoint and carry on" |
| A3 | Agents run `claim.js` from the repository root | CLI contract | Medium: mitigated by refusing a root with no `.grugops/` |
| A4 | Reading D-15's "(D-11)" as "sweep only at session start" matches the human's intent | Pitfall 4 | Medium: the other reading reintroduces the race D-11 removes |
| A5 | `done` refusing for a missing note should be exit 1 (act on it), not exit 2 | CLI contract | Low: discretion item; wording must say why either way |

## Open Questions

1. **How does D-07 work on hosts with no sealed-note writer?** (blocking for RUN-05 on five hosts)
   - What we know: the reader skips unsealed notes; WF16 refuses hand-written notes on read; only the Claude Code plugin gives agents the sealed writer; the kit home and host repos carry no `context-io.js`.
   - What's unclear: whether the human wants (a) sealed notes only, with `done` refusing on those hosts until a writer ships there, (b) `done` counting any parseable note file since the claim and naming how many were unsealed, or (c) shipping a note writer to hosts (scope growth beyond D-9).
   - Recommendation: ask before planning the `done` task. If no answer, plan (a) with the refusal naming unsealed notes, and record the gap as a residual. Do not silently pick (b): it counts notes WF16 refuses.

2. **`agent:` duplicates `by:`.** D-04 and D-13 make `by` the adapter name, and D-03 adds `agent:` with the same value. Recommendation: honor D-03 as written (write `agent:` from `--by`, add `level:` from `--level`), and say in WF17 that `by` is kept for the three existing readers (render, sweep, board reader). Ask whether `agent:` should instead be dropped.

3. **What `--by` value does a sequential host use?** Levels are Claude Code adapters only. Recommendation: the name the Claude Code adapter would have (`grugops-<role-stem>`, `grugops-software-engineer-<level>` for the engineer), so `now-running.md` reads the same on all six hosts.

4. **Does `claim.js` join the build-stamp set and the READ-1 table?** A `runnable` row joins `RUNNABLE_SET` and `state-check` then compares its stamp [VERIFIED: state-check.ts:2578-2660]. `read-sites.test.ts` and `runnable-exit-contract.test.ts` cover exactly three runnables today. Recommendation: yes to the stamp (it shares authorities with the others), and add `claim` to the exit-contract test; decide READ-1 coverage explicitly rather than by omission.

5. **IN-05 (coordinator adapter at 3,368 B, past the 3,072 B pointer WARN) was deferred to this phase.** This phase changes no grant. Recommendation: re-defer with a recorded reason, or resolve it if a plan touches `generate-role-adapters.ts`.

6. **Should `claim.js` offer `enqueue`?** D-01 lists five subcommands, so the Orchestrator still writes `pending/<task>.md` by hand. Recommendation: keep to D-01; WF17 states the pending file's exact two lines.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, tests, the runnable | ✓ | v26.12.1 (host floor 22) | — |
| TypeScript | build | ✓ | 6.0.3 | — |
| vitest | tests | ✓ | 4.1.8 | — |
| git (full history) | `check-role-rules`, `check-diff-disposition` | ✓ | — | A shallow clone is a FAIL by design |
| Claude Code | live spawn check (optional) | ✓ | 2.1.316 | — |
| Codex, OpenCode, Copilot, Pi, Antigravity CLIs | live per-host check | ✗ | — | Text-only; the live check stays at the milestone UAT (39-UAT tests 10 and 14) |

**Baseline red, environmental:** `npx vitest run scripts/check-foundation-guards.test.ts` has 1 failing case today ("the `.js` walk and git's index must enumerate the SAME files"). The cause is an untracked directory literally named `~` at the repository root holding an install target (`~/projects/hacks/grugops-example-01/tools/grugops/*.js`) [VERIFIED: `git status`, `git ls-files --others`]. It is user content: do not delete it in a plan; ask the human to move it, or expect this one red case.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.8 |
| Config file | none at root beyond `package.json` scripts; `tsconfig.tests.json` for test typecheck |
| Quick run command | `npm run build && npm run typecheck && npx vitest run <file>` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RUN-01 | `done` releases `claimed/<task>/`; render shows `agent`/`level`; empty after last done | unit | `npx vitest run scripts/claim.test.ts scripts/now-running-freshness.test.ts` | ✅ extend |
| RUN-01 | Committed render stays fresh | gate | `npm run freshness:queue` | ✅ |
| RUN-05 | Each subcommand: output line, exit code, refusals (orchestrator `--by`, lost, no pending, D-07), re-render after each change, host copy runs alone with only `package.json` beside it | integration | `npx vitest run scripts/runnable-ref/claim.test.ts` | ❌ Wave 0 |
| RUN-05 | Region fresh; row count | gate + unit | `npm run freshness:runnable-embeds && npx vitest run scripts/generate-runnable-embeds.test.ts` | ✅ extend |
| RUN-05 | Unexpected throw → exit 2 | integration | `npx vitest run scripts/runnable-ref/runnable-exit-contract.test.ts` | ✅ extend |
| RUN-05 | Install adds, uninstall removes, counts | integration | `npx vitest run install/install.test.ts install/uninstall-removal.test.ts install/installer-cross-version.test.ts install/installer-never-installed.test.ts install/installer-special-files.test.ts` | ✅ extend |
| RUN-02, RUN-03, RUN-04, RUN-06 | WF17 holds refill, close, session-compaction and tips text; "session compaction" name; no "compacts at 400k"; host names only in the tips and platform blocks; orchestrator pointer line and D-13 sentence | text | `npx vitest run scripts/tier-kit-text.test.ts` (or a new `scripts/flow-guidance-text.test.ts`) | ❌ Wave 0 for new cases |
| RUN-04 | orchestrator.md under 6,195 B WARN; corpus under 67,383 B | gate | `npx vitest run scripts/check-foundation-guards.test.ts` (and `node scripts/check-foundation-guards.js`) | ✅ |
| RUN-04 | Dual-path oracle green | oracle | `node scripts/check-uat-oracles.js` | ✅ |
| WF04 residuals | Stop precedence list, ask-once, `Approved:` names the `Fundamental:` id, gate hold scope | text | `npx vitest run scripts/tier-kit-text.test.ts` | ✅ update pins |
| All text | Lexicon, sentence form, role rules, dispositions, registry, banned claims | gate | `node scripts/check-imperative-lexicon.js && node scripts/check-role-rules.js && node scripts/check-diff-disposition.js && npm run check:claim-anchors && npm run check:banned-claims` | ✅ |
| Build | committed `.js` equals a fresh build | gate | `npm run freshness` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run build && npm run typecheck && npx vitest run <touched test files>` plus the text gates for any kit-text change.
- **Per wave merge:** full suite command plus `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:queue`, `node scripts/check-uat-oracles.js`.
- **Phase gate:** full suite green (apart from the documented `~` directory case) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/runnable-ref/claim.test.ts` — RUN-05 host-copy cases (pattern: copy the committed `.js` alone into `mkdtempSync`, add `package.json`, spawn `node`).
- [ ] Text cases for WF17 flow guidance and the orchestrator pointer (RUN-02/03/04/06).
- [ ] A test binding the queue-default constant to `agent-factory/seed/.grugops/factory.config.json` `queue`.

## Security Domain

`security_enforcement: true`, ASVS level 1 [VERIFIED: .planning/config.json].

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | partly | `--by grugops-orchestrator` refusal is an instruction backstop, not a boundary (an agent can edit files); say so in WF17 |
| V5 Input Validation | yes | Task-name allowlist `^[A-Za-z0-9._-]+$` (one owner after Pitfall 2); single-line, allowlisted `--by`; closed `--level` set; anchored `ref:` pattern; positive-integer config values |
| V6 Cryptography | no | (the note seal check is reused, not new) |
| V12 Files and Resources | yes | Embedded `rootChainPresence` / `isWithin` for every path under the root; `readRegularFileOrNull` for the config and notes (FIFO-safe); no path from argv or file content joined without the allowlist |
| V7 Errors and Logging | yes | `stripControlChars` on every printed value; one line per outcome; escaped throws → exit 2 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `by`/`agent`/`level` field injection forging a second `at:` (queue-lock DoS) | Tampering, DoS | Reject CR/LF before write (existing CR-02); render and sweep skip or reclaim multi-`at` records (existing) |
| `ref:` traversal (`ref: ../../etc`) to make `done` read outside the context root | Tampering | Anchored `ref:` pattern plus root-chain check; refuse, exit 2 |
| Symlinked `.grugops/queue` redirecting writes | Tampering | Root-chain refusal before any write, as in state-roll |
| A note with a forged `at` to pass D-07 | Repudiation | Accepted residual: the check proves a note exists, not that it is honest; WF16 admission governs content |
| Orchestrator claiming as itself by another spelling (`orchestrator`, mixed case) | Elevation | Refuse a `--by` whose role stem is `orchestrator`, case-insensitive; still an instruction-level control |
| Two Orchestrator sessions on one repo sweeping each other's long claims | DoS | TTL still applies; document as a residual in WF17 |

## Sources

### Primary (HIGH confidence, read this session)
- `scripts/claim.ts`, `scripts/now-running-freshness.ts`, `scripts/context-io.ts`, `scripts/generate-runnable-embeds.ts`, `scripts/runnable-stamp.ts`, `scripts/runnable-ref/{state-check,trace-render,state-roll}.ts`, `install/install.ts`, `install/uninstall.ts`, `install/state-layout.ts`, `scripts/check-foundation-guards.ts`, `scripts/check-imperative-lexicon.ts`, `scripts/check-role-rules.ts`, `scripts/check-diff-disposition.ts`, `scripts/checkpoints.ts`, `scripts/tier-kit-text.test.ts`, `scripts/board-read.ts`
- `agent-factory/workflows/{04,16,17}-*.md`, `agent-factory/roles/{orchestrator,tech-lead,_role-switch-protocol}.md`, `agent-factory/config/factory.config.md`, `.claude-plugin/plugin.json`, `docs/audit/28-claim-registry.md`, `docs/audit/29-style-dispositions/README.md`
- Gate runs this session: `check-imperative-lexicon.js` PASS, `check-role-rules.js` PASS, `check-diff-disposition.js` PASS, `check-foundation-guards.js` (orchestrator 6,036 B PASS; corpus 59,793 B, 7,590 B headroom), `check-uat-oracles.js` PASS (dual-path), `claim.test.ts` + `now-running-freshness.test.ts` 15/15

### Secondary (MEDIUM, official docs fetched 2026-11-04)
- code.claude.com/docs/en/sub-agents — model order, per-invocation effort (v2.1.292), forks, fork default (v2.1.302), concurrency, resume, completion notices, names after restart
- code.claude.com/docs/en/context-window — what survives compaction, background subagents keep running, `/autocompact`
- code.claude.com/docs/en/model-config — effort support table, `/autocompact` and `autoCompactWindow`
- developers.openai.com/codex/config-sample — `model_auto_compact_token_limit`
- github.com/earendil-works/pi `packages/coding-agent/docs/compaction.md` — `reserveTokens` trigger and default

### Tertiary (carried, not re-fetched)
- `.planning/research/STACK.md` § (c) for Copilot, OpenCode and Antigravity compaction behavior
- `.planning/research/PITFALLS.md` pitfalls 11, 14, 15

## Metadata

**Confidence breakdown:**
- Runnable pipeline and pitfalls: HIGH — every constant and path quoted was read this session
- Host behavior: MEDIUM — Claude Code from today's docs; other hosts cited, not run
- Kit-text gates: HIGH — gates run green today; rules read from source

**Research date:** 2026-11-04
**Valid until:** 2026-11-18 for host facts (Claude Code releases often); 30 days for in-repo mechanics
