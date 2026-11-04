# Phase 41: Orchestrator flow guidance - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

The Orchestrator keeps parallel work moving on all six hosts. The phase delivers:

- the queue's `claimed/` set, rendered to `now-running.md`, as the only in-flight log (RUN-01);
- a refill loop that closes finished agents and fills free capacity from disk, with no timers and no polling (RUN-02);
- "session compaction" guidance, named apart from WF18 note compaction, with a fresh session as the fallback on every host (RUN-03);
- the flow text in Workflow 17 with a one-line pointer in `orchestrator.md`, reading the same on all six hosts (RUN-04);
- `claim.js` shipped to host repos as a runnable CLI that agents use instead of running the protocol by hand (RUN-05);
- tiered engineers started by adapter name, never forked, never given a model override, and no ticket claimed by the Orchestrator for itself (RUN-06).

Carried in from Phase 39 UAT test 71 (human decision 2026-10-31): the WF04 hand-off loop residuals. These are who wakes the Tech Lead after a human stop, and the double ask; two stop-precedence ambiguities; the gate-failure stop wake-up; and binding an `Approved:` line to the specific change.

Out of scope: any host-only mechanism (hooks, installer-written compaction settings), a new workflow file, and spreading the three-rounds rule to other checkpoints (deferred).

</domain>

<decisions>
## Implementation Decisions

### claim.js CLI and the claim record (RUN-01, RUN-05)
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

### Refill and close loop (RUN-02, RUN-06)
- **D-09:** "Close" means **never reuse a finished agent**. New work always goes to a fresh spawn of the named adapter. A resume is allowed only to finish the agent's own unfinished task (D-06), and that still counts as claimed. This stops a resumed agent from slipping past the WIP count.
- **D-10:** A refill runs on **every agent return or completion notice and on every user turn**. Each time, the Orchestrator reads `free`, claims and dispatches up to that many from ready work (board priority: a started ticket outranks a new one; passes DoR), and only then ends the turn. On sequential hosts this reads as "take the next ready task". No timers and no polling. Key every rule on whether the spawn tool exists, never on the host name.
- **D-11:** **The stale sweep runs only at session start**, including the fresh-session fallback, when no agent the Orchestrator spawned can still be running. Inside a live session a long claim is reported, not reclaimed. This removes the race where a 30-minute sweep gives a slow agent's task to a second agent.
- **D-12:** **Room in `orchestrator.md`:** replace responsibilities 6–10 (spawn, drain, claim, sweep) with the one WF17 pointer line, and add one compact RUN-06 sentence to `## Hard limits`. The detail lives in WF17. The net size goes down and the ceiling is unchanged. Measured now: 6,036 B against the Phase 40 ceiling of WARN 6,195 B / FAIL 6,546 B (`scripts/check-foundation-guards.ts` `ROLE_CEILINGS`). The roadmap's "7,165 B" figure is stale; use the guard's numbers.
- **D-13:** The RUN-06 hard-limit wording: "The Orchestrator claims a queue task only at dispatch and only in the name of the adapter it starts (`--by <adapter>`); it never claims with itself as owner and never does a task's work." The Orchestrator starts tiered engineers by adapter name, never forks them, and never passes a model or per-invocation override to a tiered adapter. `claim.js` refuses `--by grugops-orchestrator`.

### Session compaction (RUN-03, RUN-04)
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

### WF04 hand-off residuals (carried from Phase 39 UAT 71)
- **D-21:** **Ask once.** One pattern applies to every WF04 human stop, both the hand-off/used-up stop and the gate-failure stop. Only the Orchestrator asks the human. It records the answer once in its `decision` note naming the human, then queues the Tech Lead's `pending/` subtask; that is the wake-up. The Tech Lead records its `Confirmed:` finding from that note, citing it, and never asks the human again. The `human:<name>` stamp and its admission behavior are unchanged.
- **D-22:** **Precedence: revert before the fundamental stop.** An unapproved fundamental change is not a proposal. It takes step 17's "revert the unapproved change" hand-off, which agents can do. The human stop applies only to a proposed `Fundamental:` note that is waiting for approval.
- **D-23:** **Precedence: hand-off before the raise stop.** When the options are used up and the scores also call for a raise past the spent escalation, the ticket goes to the hand-off first. The raise stop applies only if the ticket comes back still needing the raise, or under the usual three-rounds or fundamental rule.
- **D-24:** **`Approved:` and `Rejected:` lines name the human and the id of the `Fundamental:` note they answer.** The step-2 diff check passes a fundamental change only when its `Resolved:` note names that matching approval. No content hash.
- **D-25:** **The gate hold binds only the gate move.** At `exhaust_self_fix_budget: block`, the step 16 hold binds only the move made in answer to that `Cause: gate` note. A later revert hand-off on the same ticket is dispatched without waiting.
- **D-26:** **Only the waiting ticket pauses.** While one ticket waits on a human, the Orchestrator keeps refilling with other ready work and lists the open human questions in its Next action line.
- **D-27:** **WF04 shape:** add one short numbered "Stop precedence" list to step 15 covering D-22, D-23 and D-25, and state the ask-once pattern (D-21) once. Replace scattered sentences instead of adding more where possible, and keep WF04's existing guards green.

### Planning clarifications (human, 2026-11-04, from RESEARCH open questions)

- **D-28:** D-07 counts sealed notes only, on every host. On a host with no sealed-note writer, `claim.js done` refuses and names the unsealed notes it found. The gap is recorded as a residual until a writer ships there. No note writer ships to hosts in this phase. Resolves RESEARCH Open Question 1.
- **D-29:** D-15's "sweep (D-11)" means "sweep when D-11 allows it". After an in-session compaction the Orchestrator re-reads `now-running.md` and the board, then refills, with no sweep. The stale sweep runs only at session start, including the fresh-session fallback. Resolves RESEARCH assumption A4 and Pitfall 4.
- **D-30:** Keep D-03 as written: `claim.md` carries `agent:` (from `--by`) and `level:` (from `--level`) alongside `by:`. WF17 says `by` is kept for its three existing readers: the render, the sweep and the board reader. Resolves RESEARCH Open Question 2.
- **D-31:** Every software engineer prompt instructs the engineer to work at senior level. The tiers differ in adapter name, model and effort, not in the persona the prompt gives. The generated adapter line "Work at the `<level>` level" becomes the same senior instruction in all three engineer adapters, and `agent-factory/roles/software-engineer.md` `## Levels` says so. This revises Phase 39 D-13, where a level adapter named its own level. The Tech Lead still picks the tier with the complexity rubric, and the `Level:` routing text in the adapter description and `claim.js --level` stay. The junior stop on security, migration, concurrency, test-integrity and other rubric risk tags stays as a rule keyed on the `grugops-software-engineer-junior` adapter name (or a plan that names junior on the other hosts), not on a junior persona. The work is a review of the software engineer prompt (the role file and the adapter line that reaches the engineer), updated only where the review finds a need. Added and confirmed by the human on 2026-11-04 during planning, including keeping the junior stop.
- **D-32:** D-13's "never does a task's work" ships as recorded, with one qualifier scoped to hosts without the `Agent` tool: "Where the `Agent` tool does not exist, it does the work only after a role switch." The unscoped "without a role switch" does not ship. Decided by the human on 2026-11-04 from the plan check.
- **D-33:** Plan 41-03 stays one plan at its 120,000-token low-confidence estimate and 27 files; most of the excess is mechanical count-pin edits. The human accepted this risk on 2026-11-04 rather than add a wave.
- **D-34:** D-12 is amended: its size limit is `orchestrator.md` under the 6,195 B WARN, with the D-32 sentence added. The "net size goes down" and "one compact RUN-06 sentence" wording no longer bind; the file is expected to end at 6,087 B with three sentences in that paragraph. `ROLE_CEILINGS` stays unchanged. Decided by the human on 2026-11-04 from a planner revision conflict.

### Claude's Discretion
- Exact exit-code numbers and line wording for the CLI, following `state-check.js` and `trace-render.js`.
- How `free` behaves with a missing config or a malformed `wip_limit`: fall back to the documented default of 3 and say so, never guess silently.
- Where the WF17 flow-control steps sit inside the file, and how the "Platform depth and width" section is reconciled with them.
- How `done` finds note timestamps in the context folder. The planner verifies the field against `context-io.ts`.
- Whether the Tech Lead role text needs a matching ask-once sentence, within its ceiling.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § Phase 41: goal, success criteria, research flag, the Phase 39 carry-in note
- `.planning/REQUIREMENTS.md`: RUN-01..RUN-06
- `.planning/PROJECT.md` Key Decisions: `[v3.0, D-9]` (claim.js ships to host repos), `[v3.0, D-5]` (levels are Claude Code adapters only), the `[v3.0, 2026-10-20]` "flow rules are guidance on every host, no host-only hook" row, `[v3.0, Phase 39 UAT, 2026-10-31]` (the W1 hand-off rule)

### Research (v3.0 milestone)
- `.planning/research/SUMMARY.md` item 6 and the Phase 41 "Delivers" block
- `.planning/research/PITFALLS.md` A4 / pitfall 14: token blindness, a second in-flight authority, over-spawn, the stale-sweep race, the WF18 name collision
- `.planning/research/FEATURES.md`: the keep-capacity-full row, the compaction row, the anti-features (no polling, no host hooks, the Orchestrator never implements)
- `.planning/research/STACK.md` § (c): context compaction per host, operator tips, no self-compaction
- `.planning/research/ARCHITECTURE.md`: claim.ts needs no rewrite, refill/close rules, no workflow 19 (`WORKFLOW_COUNT` and its derived consumers)

### Kit files this phase changes
- `agent-factory/workflows/17-task-claim.md`: home of the refill, close, session-compaction and operator-tips text; the claim-at-dispatch reversal
- `agent-factory/roles/orchestrator.md`: responsibilities 6–10 collapse to a pointer; one RUN-06 Hard limits sentence
- `agent-factory/workflows/04-ticket-to-pr.md` steps 14–17 and the stop conditions: the WF04 residuals
- `agent-factory/roles/tech-lead.md`: the Confirmed: finding behavior (D-21)
- `agent-factory/config/factory.config.md` § queue: `wip_limit`, `claim_cap`, `stale_ttl_minutes` semantics (sweep timing changes per D-11)

### Code and tooling
- `scripts/claim.ts` / `scripts/claim.js`: the library (`claimTask`, `transition`, `sweepStale`, `renderNowRunning`) and today's CLI (`now-running` only)
- `scripts/now-running-freshness.ts`: the "REGISTRY WINS" freshness gate
- `install/install.ts` `RUNNABLES` and `install/uninstall.ts` `RUNNABLES_MIRROR`: the materialized-runnable pattern (edit both together)
- `scripts/check-foundation-guards.ts` `ROLE_CEILINGS`: the orchestrator ceiling (WARN 6,195 / FAIL 6,546)
- `scripts/fixtures/board-snapshot/.grugops/queue/claimed/`: claim record fixtures

### Carry-in source
- `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-UAT.md` § Deferred Follow-Ups (test 71)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/claim.ts`: `claimTask` (atomic mkdir, EEXIST = lost), `transition` (atomic rename), `sweepStale` (wall-clock TTL, tamper rule) and `renderNowRunning` already exist. The CLI wraps them; the core needs no rewrite.
- The `isEntrypoint(import.meta.url)` CLI guard in `claim.ts` is the existing entrypoint pattern.
- `RUNNABLES` in `install.ts` already materializes `state-check.js`, `trace-render.js` and `state-roll.js` into `tools/grugops/`, with a `package.json` `{"type":"module"}` beside them. claim.js follows the same path through `scripts/runnable-ref/`.

### Established Patterns
- The tooling is TypeScript compiled to committed `.js` with a freshness check. Host repos run it with zero runtime dependencies.
- Adding a runnable bumps the installer's file-count assertions (`installer-never-installed`, `installer-special-files`, `installer-cross-version` tests).
- Role byte ceilings are measured values with documented margins and are never derived. The role corpus total is 67,383 B, with about 3 KB reserved for Phases 41 and 42.
- Rules are keyed on whether the spawn tool exists, never on the host name (orchestrator.md already does this).
- The dual-path equivalence oracle (spawn path vs sequential path) must stay green.

### Integration Points
- WF17 is the single source for claim and schedule; every role points to it.
- `freshness:queue` regenerates and compares `now-running.md`.
- WF04 steps 14–17 and the Tech Lead role carry the hand-off loop text.

</code_context>

<specifics>
## Specific Ideas

- In the user's words: "Agent is responsible for its own work and status update. Orchestrator just does quick double-check."
- On compaction, in the user's words: "Pause dispatch, but don't ask human, compact and continue (if that is possible)". The human is never asked at a compaction point.
- The human is a stakeholder: a human stop never stalls unrelated work (D-26). This continues the 2026-10-31 W1 decision.
- The research flag still stands: plan with `--research-phase`. Verify on all six hosts whether any lets an agent compact its own session (assumed none), what each host exposes about context use, whether Claude Code allows a per-invocation `effort`, and how `claim.js` ships as a materialized runnable.

</specifics>

<deferred>
## Deferred Ideas

- Apply the "route to the resolving role, three disputed rounds, then a human" rule to the kit's other agent-resolvable checkpoints (Phase 39 UAT test 71 follow-up). Merge, production deploy, UAT sign-off and release approval stay human. Belongs in a later phase or the backlog.
- Host-specific speed-ups (Claude Code `autoCompactWindow` in adapters, a `SubagentStop` refill nudge) stay declined for v3.0 under the no-host-only-mechanism decision. Reopen only by a recorded decision that relaxes it.

</deferred>

---

*Phase: 41-orchestrator-flow-guidance*
*Context gathered: 2026-11-04*
