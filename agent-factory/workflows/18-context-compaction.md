---
kind: workflow
order: 18
cadence: both
---
# Workflow: context compaction

## When to use
Whenever an agent has accumulated a verbose local trajectory for a task and is about to promote results into the shared verified context. This workflow is the single source of the two-tier compaction protocol. The protocol covers how the verbose local trajectory is distilled and which structure is mechanically protected before promotion. It also covers how the dial tunes body verbosity and how a promoted finding is re-verified. Every role references this file rather than restating the protocol — there is one protocol, named here, not forked into each role.

It builds directly on `agent-factory/workflows/16-context-read-write.md` (the read/write/admission protocol) and reuses its admission rules for the re-verify; it does not restate them.

## Agents involved
- Every role that accumulated a verbose local trajectory. A third seam workflow with no owning specialist: whichever role is about to promote results runs it, then returns to the workflow it came from. The role owns the words — the semantic distillation is its intelligence and cannot be delegated to a tool.
- `scripts/compactor.ts` owns the structure. It is the mechanical floor, not a participant: it checks the proposed promoted set, refuses, and names the fault. It cannot summarize and never does.
- The §14 gate and a named human remain the only stamp issuers, exactly as in Workflow 16. A re-verified finding cross-checks against them and never against this workflow.

## Inputs required
- The task id and the agent's own local trajectory for it (the ephemeral, gitignored per-task-per-agent tier).
- The proposed promoted set — the notes the agent intends to carry into the committed shared context.
- `context.compaction` from `.grugops/factory.config.json`; when the key or the whole file is absent, `aggressive` is the lean default.
- The load-bearing field set and the raw `failed-attempt` ids the carve-out check compares against. Read them from the trajectory; never restate them here as protocol the agent self-polices.

## The body/structure seam
Two distinct jobs, never blurred:

- **The agent compresses note _bodies_** — the semantic judgment. The agent reads its verbose local trajectory and writes the terse gist, collapsing the narrative prose of note bodies. The distillation is the role's intelligence: keep the load-bearing constraint, drop the restatement.
- **`scripts/compactor.ts` protects note _structure_** — the deterministic carve-out invariant. It is a `node:fs`-only helper with zero host runtime deps; it cannot summarize and never does. It checks, refuses, and names the fault. It is the un-cheatable mechanical floor.

The agent owns the words; the tool owns the structure. Never ask the tool to summarize, and never let the agent quietly drop a load-bearing field — that is the tool's to refuse.

## The two tiers
The verbose trajectory lives in the ephemeral, gitignored local tier `.grugops/context/{task}/threads/{agent}.md`. That tier is per-task-per-agent scratch, created on the agent's first write for the task, appended to as the agent works, and never committed. Only the compact, re-verified distillation promotes to the committed shared verified context (`notes/` + the derived `index.*` that `scripts/context-io.ts` produces).

The local tier is local scratch, not part of the permanent audit trail. The permanent trail is the committed shared context. Unfold-on-demand operates within the live session against the local tier, not post-hoc from git history.

## Steps
Run these in order.

1. Distill the trajectory body. Read the local `threads/{agent}.md` trajectory. Write the compact gist of each note body the agent intends to promote. Keep every load-bearing constraint — especially a recorded dead-end. Collapse only restatement and narration. Body compression is not note dropping. The carve-out below fixes which durable notes promote, not how hard you compress.

2. Apply the dial to body verbosity, and to nothing else. Read `context.compaction` at point-of-use. When the key — or the whole config file — is absent, default to `aggressive`. The dial moves how much prose survives and how much raw reaches the read-by-default shared tier:
   - Set `aggressive` (the lean default) to send only the compact gist to the shared context. The raw trajectory stays in the local `threads/` tier, unfolded on demand. Maximum token win.
   - Set `balanced` to promote the gist plus a fuller mid-tier summary.
   - Set `retain-raw` to admit the full trajectory bodies into the committed shared context. The enterprise and audit choice pays the tokens to keep everything durable. Because `threads/` is ephemeral, this dial is the only way raw becomes durable.

   The dial governs body verbosity and how-much-raw-reaches-shared ONLY. It NEVER drops a durable note and NEVER drops a load-bearing field. The carve-out below is the un-dialable safety floor. It holds identically at `aggressive`, `balanced`, and `retain-raw` (the same way `quality.test_integrity` is `warn | block`-only and never `off`).

3. Hand the proposed promoted set to the carve-out check before promotion. `scripts/compactor.ts` checks the set mechanically. Every raw `failed-attempt` note id present in the trajectory survives into the promoted set. A reusable dead-end is never compacted away. `verified_by` / `supersedes` / `by` / `at` stay intact on every promoted note. On any dropped load-bearing element the checker refuses, exits non-zero, and names the dropped element. The checker is the mechanical floor the tool enforces. Do not re-implement or restate the field set as protocol the agent self-polices. Run the checker and honor its refusal.

4. Promote only via the sanctioned write path. Promotion happens ONLY via `scripts/context-io.ts` `appendNote` (`scripts/context-io.js`). Never a hand-written `.grugops/context/` path, and never a forked writer. This preserves the single sanctioned write path so Phase-21 admission still fires on every promoted note.

5. Run the re-verify on a promoted `finding`. Only a promoted `finding` re-hits admission. It reuses Workflow 16's admission rules and the bounded `self_fix_attempts` loop in `agent-factory/workflows/05-pr-quality-gate.md` (default `2`, "two rounds then human"). Those rules live in those files; this workflow references them and does not restate or re-dial them. A faithful body compaction keeps the finding's `§14-gate#<id>` stamp valid against the live green verdict. The verdict verified the _work_, not the _words_. So `admit()` re-admits cheaply — a stamp cross-check, not a re-run of the gate. Soft kinds (`claim` / `observation` / `decision` / `failed-attempt` / `artifact-ref`) carry no stamp and pass through.

6. Degrade honestly when compaction changed the finding. A compaction sometimes materially changes a finding, so its stamp no longer cross-checks a live green verdict. The re-verify is then refused. Degrade to a `claim` carrying `confidence: UNKNOWN - verify` (the Phase-21 escape hatch). Never hand-carry a stamp, never re-stamp, never fake a pass. A `claim` never satisfies a finding's admission requirement. Recording it honestly is the floor.

## Stop conditions
- The carve-out checker refuses (a dropped `failed-attempt` id, or a missing `verified_by` / `supersedes` / `by` / `at`) → stop; do not promote. Fix the distilled set so the named element survives, then re-run the checker.
- A promoted finding's re-verify is refused, and the bounded `self_fix_attempts` budget is exhausted without a real stamp → stop and hand to a human. The budget is referenced from `05-pr-quality-gate.md`. Do not loop, do not fake a stamp.
- The only way to promote would be to hand-write the `.grugops/context/` path → stop; the sanctioned writer is `context-io.ts` via `appendNote`.

## Board moves
None of its own. Compaction changes how much prose survives into the committed shared context; it changes nothing about a ticket's position on `plans/board.md`. A ticket never sits in a "compacting" state and compaction is never a reason to hold one. The board move belongs to the invoking workflow.

## Trace updates
None of its own, and this is a safety property rather than an omission. `plans/traceability.md` is rendered from the admitted notes, so compaction must leave the trail unchanged. An `artifact-ref` keeps its trace ids, a `finding` keeps its `verified_by`, and a `failed-attempt` id can never be compacted away. If a promoted finding can no longer cross-check a live green verdict, it degrades to a `claim` carrying `confidence: UNKNOWN - verify`. The trail records that honestly. Never edit a traceability row to preserve a trace the compaction actually broke.

## Done condition
The verbose local trajectory was distilled at the dialed body verbosity. The proposed promoted set passed the `compactor.ts` carve-out check, with every `failed-attempt` id and the load-bearing fields intact. Every promoted note was written only through `context-io.ts` `appendNote`. Every promoted `finding` either re-admitted against a live green verdict or was honestly degraded to a `claim` with `confidence: UNKNOWN - verify`. No load-bearing element was dropped at any dial value, and no refusal was faked into a pass.

## Commit
Commit the compact, re-verified context this workflow promoted per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The artifacts are the `notes/` files and the derived `index.md` / `index.jsonl` that `context-io.ts` produced. The ephemeral `threads/` tier is gitignored and is never committed. This workflow records verified context; it never merges and never deploys — humans hold both.
