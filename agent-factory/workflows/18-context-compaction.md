---
kind: workflow
order: 18
cadence: both
---
# Workflow: context compaction

## When to use
Whenever an agent has accumulated a verbose local trajectory for a task and is about to promote results into the shared verified context. This workflow is the single source of the two-tier compaction protocol: how the verbose local trajectory is distilled, which structure is mechanically protected before promotion, how the dial tunes body verbosity, and how a promoted finding is re-verified. Every role references this file rather than restating the protocol — there is one protocol, named here, not forked into each role.

It builds directly on `agent-factory/workflows/16-context-read-write.md` (the read/write/admission protocol) and reuses its admission rules for the re-verify; it does not restate them.

## Agents involved
- Every role that accumulated a verbose local trajectory. A third seam workflow with no owning specialist: whichever role is about to promote results runs it, then returns to the workflow it came from. The role owns the words — the semantic distillation is its intelligence and cannot be delegated to a tool.
- `scripts/compactor.ts` owns the structure. It is the mechanical floor, not a participant: it checks the proposed promoted set, refuses, and names the fault. It cannot summarize and never does.
- The §14 gate and a named human remain the only stamp issuers, exactly as in Workflow 16 — a re-verified finding cross-checks against them and never against this workflow.

## Inputs required
- The task id and the agent's own local trajectory for it (the ephemeral, gitignored per-task-per-agent tier).
- The proposed promoted set — the notes the agent intends to carry into the committed shared context.
- `context.compaction` from `.grugops/factory.config.json`; when the key or the whole file is absent, `aggressive` is the lean default.
- The load-bearing field set and the raw `failed-attempt` ids the carve-out check compares against. Read them from the trajectory; never restate them here as protocol the agent self-polices.

## The body/structure seam
Two distinct jobs, never blurred:

- **The agent compresses note _bodies_** — the semantic judgment. The agent reads its verbose local trajectory and writes the terse gist, collapsing the narrative prose of note bodies. This is the role's intelligence: keep the load-bearing constraint, drop the restatement.
- **`scripts/compactor.ts` protects note _structure_** — the deterministic carve-out invariant. It is a `node:fs`-only helper with zero host runtime deps; it cannot summarize and never does. It checks, refuses, and names the fault. It is the un-cheatable mechanical floor.

The agent owns the words; the tool owns the structure. Never ask the tool to summarize, and never let the agent quietly drop a load-bearing field — that is the tool's to refuse.

## The two tiers
The verbose trajectory lives in the ephemeral, gitignored local tier `.grugops/context/{task}/threads/{agent}.md` — per-task-per-agent scratch, created on the agent's first write for the task, appended to as the agent works, and never committed. Only the compact, re-verified distillation promotes to the committed shared verified context (`notes/` + the derived `index.*` that `scripts/context-io.ts` produces).

The local tier is local scratch, not part of the permanent audit trail. The permanent trail is the committed shared context. Unfold-on-demand operates within the live session against the local tier, not post-hoc from git history.

## Steps
Run these in order.

1. **Distill the trajectory body.** Read the local `threads/{agent}.md` trajectory and write the compact gist of each note body the agent intends to promote. Keep every load-bearing constraint — especially a recorded dead-end — and collapse only restatement and narration. This is body compression, not note dropping; which durable notes promote is fixed by the carve-out below, not by how hard you compress.

2. **Apply the dial to body verbosity (only).** Read `context.compaction` at point-of-use; when the key — or the whole config file — is absent, default to `aggressive`. The dial moves how much prose survives and how much raw reaches the read-by-default shared tier — nothing else:
   - `aggressive` (lean default): only the compact gist reaches the shared context; the raw trajectory stays in the local `threads/` tier, unfolded on demand. Maximum token win.
   - `balanced`: the gist plus a fuller mid-tier summary is promoted.
   - `retain-raw`: the full trajectory bodies are admitted into the committed shared context (enterprise/audit — pay the tokens to keep everything durable; because `threads/` is ephemeral, this dial is the only way raw becomes durable).

   The dial governs body verbosity and how-much-raw-reaches-shared ONLY. It NEVER drops a durable note and NEVER drops a load-bearing field. The carve-out below is the un-dialable safety floor — it holds identically at `aggressive`, `balanced`, and `retain-raw` (the same way `quality.test_integrity` is `warn | block`-only and never `off`).

3. **Hand the proposed promoted set to the carve-out check.** Before promotion, the proposed promoted set is checked mechanically by `scripts/compactor.ts`: every raw `failed-attempt` note id present in the trajectory must survive into the promoted set (a reusable dead-end is never compacted away), and `verified_by` / `supersedes` / `by` / `at` must stay intact on every promoted note. On any dropped load-bearing element the checker refuses, exits non-zero, and names the dropped element. This is the mechanical floor the tool enforces — do not re-implement or restate the field set as protocol the agent self-polices; run the checker and honor its refusal.

4. **Promote only via the sanctioned write path.** Promotion happens ONLY via `scripts/context-io.ts` `appendNote` (`scripts/context-io.js`) — never a hand-written `.grugops/context/` path and never a forked writer. This preserves the single sanctioned write path so Phase-21 admission still fires on every promoted note.

5. **Re-verify a promoted finding.** Only a promoted `finding` re-hits admission — and it reuses Workflow 16's admission rules and the bounded `self_fix_attempts` loop in `agent-factory/workflows/05-pr-quality-gate.md` (default `2`, "two rounds then human"). Those rules live in those files; this workflow references them and does not restate or re-dial them. A faithful body compaction keeps the finding's `§14-gate#<id>` stamp valid against the live green verdict — the verdict verified the _work_, not the _words_ — so `admit()` re-admits cheaply (a stamp cross-check, not a re-run of the gate). Soft kinds (`claim` / `observation` / `decision` / `failed-attempt` / `artifact-ref`) carry no stamp and pass through.

6. **Degrade honestly when compaction changed the finding.** If a compaction materially changed a finding such that its stamp no longer cross-checks a live green verdict, the re-verify is refused — degrade honestly to a `claim` carrying `confidence: UNKNOWN - verify` (the Phase-21 escape hatch). Never hand-carry a stamp, never re-stamp, never fake a pass. A `claim` can never satisfy a finding's admission requirement; recording it honestly is the floor.

## Stop conditions
- The carve-out checker refuses (a dropped `failed-attempt` id, or a missing `verified_by` / `supersedes` / `by` / `at`) → stop; do not promote. Fix the distilled set so the named element survives, then re-run the checker.
- A promoted finding's re-verify is refused and the bounded `self_fix_attempts` budget (referenced from `05-pr-quality-gate.md`) is exhausted without a real stamp → stop and hand to a human. Do not loop, do not fake a stamp.
- The only way to promote would be to hand-write the `.grugops/context/` path → stop; the sanctioned writer is `context-io.ts` via `appendNote`.

## Board moves
None of its own. Compaction changes how much prose survives into the committed shared context; it changes nothing about a ticket's position on `plans/board.md`. A ticket never sits in a "compacting" state and compaction is never a reason to hold one. The board move belongs to the invoking workflow.

## Trace updates
None of its own, and this is a safety property rather than an omission. `plans/traceability.md` is rendered from the admitted notes, so compaction must leave the trail unchanged: an `artifact-ref` keeps its trace ids, a `finding` keeps its `verified_by`, and a `failed-attempt` id can never be compacted away. If a promoted finding can no longer cross-check a live green verdict it degrades to a `claim` carrying `confidence: UNKNOWN - verify` and the trail records that honestly. Never edit a traceability row to preserve a trace the compaction actually broke.

## Done condition
The verbose local trajectory was distilled at the dialed body verbosity, the proposed promoted set passed the `compactor.ts` carve-out check (every `failed-attempt` id and the load-bearing fields intact), every promoted note was written only through `context-io.ts` `appendNote`, and every promoted `finding` either re-admitted against a live green verdict or was honestly degraded to a `claim` with `confidence: UNKNOWN - verify`. No load-bearing element was dropped at any dial value, and no refusal was faked into a pass.

## Commit
Commit the compact, re-verified context this workflow promoted (the `notes/` files and the derived `index.md` / `index.jsonl` that `context-io.ts` produced) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The ephemeral `threads/` tier is gitignored and is never committed. This workflow records verified context; it never merges and never deploys — humans hold both.
