---
kind: workflow
order: 16
cadence: both
---
# Workflow: context read/write

## When to use
Whenever a role is about to act on, or record into, the shared verified context. Every role reads the verified context before it works and records its results after it verifies them. This workflow is the single source of the context read/write protocol: read-before-act, do the work, write-after-verify, and the admission rules that decide what may enter the verified context. Every other workflow and role references this file rather than restating the protocol — there is one protocol, named here, not forked into each role.

The only sanctioned writer of the shared context is `scripts/context-io.ts` (compiled to `scripts/context-io.js`). No role and no workflow writes the `.grugops/context/` path by any other path. The note schema this workflow records into is `agent-factory/contracts/context-note.md`.

## Agents involved
- Every role. This is a seam workflow, not an SDLC stage: it has no owning specialist and no queue of its own. Whichever role is about to act on, or record into, the shared verified context runs this protocol, then returns to the workflow it came from.
- The §14 gate (`agent-factory/workflows/05-pr-quality-gate.md`) is the only issuer of a `§14-gate#<id>` verification stamp, and a named human is the only issuer of `human:<name>`. Neither is a participant here; both are the authorities admission checks against.

## Inputs required
- The task id whose shared context is being read or written.
- The existing verified context for that task, read through `context-io.ts` (`readContext` / `render`) — the prior findings, decisions and recorded dead ends.
- The note schema `agent-factory/contracts/context-note.md` — the shape a note must take to be admissible.
- A real verification stamp when, and only when, the note is a `finding`: a live green `§14-gate#<id>` verdict, or `human:<name>` under a named human's session grant.
- The `human_admission` dial from `.grugops/factory.config.json` when the host is Claude Code.

## Steps
Run these in order. The order is the protocol — read the verified state first, work, then record only what verification admits.

1. **Read before you act.** Before doing the work, read the shared context for the task through `context-io.ts` (`readContext` / `render`) so you start from the verified state, not a blank slate. The prior verified findings, decisions, and recorded failed attempts are the memory you build on — do not re-derive what the context already holds, and do not retry a recorded failed attempt.

2. **Do the work.** Implement the change, run the analysis, or make the decision the task needs.

3. **Write after you verify.** Record notes ONLY through the sanctioned writer — never author the context path by hand. On Claude Code the sanctioned admission path for a verified note is the STRUCTURED tool `mcp__grugops__propose_note`: the agent admits a note by structured JSON arguments, not a shell command string, so there is no command text to obfuscate. That tool routes its persistence through `context-io.ts` (`admitAndAppend` → `appendNote`) internally, so `context-io.ts` remains the single sanctioned writer of the shared context — "record only via context-io" still holds. Choose the note kind honestly:
   - A `finding` (a verified result) is admitted ONLY with a real verification stamp in `verified_by`. The two accepted stamps are `§14-gate#<id>` — cross-checked against a live GREEN gate verdict (Posture B): the `<id>` must match a live green `§14-gate` verdict record under the task — and `human:<name>` for non-gate-adjudicable judgment or an unsolvable disagreement only (the escalation valve). On Claude Code the `human:<name>` signal is made un-forgeable by the separate PER-CALL PreToolUse `admission-guard` hook that gates the `mcp__grugops__propose_note` channel — a distinct process that reads the FRESH session variable per call (the variable the agent's own child env cannot reach) and validates the agent-supplied `human:<name>` stamp against it on every call: it reads the FINAL structured tool arguments, not a Bash command string. The grant is session-scoped and per-note capable (D-07): once a named human exports `GRUGOPS_ADMISSION_APPROVED_BY=<name>`, it authorizes high-severity admissions under that name for the rest of the session, and the human controls granularity by setting/unsetting the grant around a specific disposition (the per-call hook re-reads the fresh env, so an unset takes effect on the next call); it is not a mechanically-enforced per-note nonce. The GOV-02 ledger's `disposed_by: human:<name>` means "admitted under <name>'s session grant," not "individually reviewed each entry." That is the Claude Code primary tier, gated by the `human_admission` dial; the four non-CC CLIs degrade to the in-script `admit()` refusal plus a prompt-level "stop, ask a named human," documented honestly as not mechanically un-forgeable (D-04/D-05).
   - A soft or neutral result is recorded as a `claim` or an `observation` and needs no stamp. Only a `finding` requires `verified_by`; `claim` / `decision` / `failed-attempt` / `observation` / `artifact-ref` are soft, neutral, or pointer by nature.
   - The gate's own green verdict is the one allowed `by: §14-gate` self-attestation — it is emitted only by the §14 gate on a green result (see `agent-factory/workflows/05-pr-quality-gate.md`), the root of the verification chain. Any other note authored `by: §14-gate` is a structural FAIL (an auditable impersonation flag).

4. **Admission and the escape hatch.** `context-io.ts` hard-rejects a stampless or invalid-stamp `finding` — it names the fault and refuses the write; it NEVER silently rewrites the note into a `claim` (silent mutation is a fabrication smell). When a finding is refused, the agent does ONE of two honest things:
   - **Obtain a real stamp within budget.** Run or fix the §14 gate to earn the real `§14-gate#<id>` stamp, inside the EXISTING bounded `self_fix_attempts` loop in `agent-factory/workflows/05-pr-quality-gate.md` (default `2`, "two rounds then human"). That loop lives there — this workflow references it and does not restate or re-dial it. After the budget is spent, stop and hand to a human.
   - **Re-record honestly as a `claim`.** Re-record the result as a `claim` carrying `confidence: UNKNOWN - verify` — explicitly non-load-bearing. A `claim` can NEVER satisfy a finding's admission requirement. This is the same "advise loudly, never hide" floor the gate holds: never a faked pass, never a hand-set green.

The three admission outcomes, stated once:
- **gate-verifiable** → run the §14 gate → green verdict → `finding` with `§14-gate#<id>` admitted. The workhorse path; no human is bothered.
- **not gate-verifiable, low-stakes** → honest `claim` with `confidence: UNKNOWN - verify`. The escape hatch; no human is bothered.
- **not gate-verifiable, high-stakes or agents disagree** → escalate to a named human → `human:<name>`. The rare path.

## Stop conditions
- A `finding`'s admission is refused and the bounded `self_fix_attempts` budget (referenced from `05-pr-quality-gate.md`) is exhausted without a real stamp → stop and hand to a human. Do not loop, do not fake a stamp.
- The result is high-stakes and not gate-adjudicable, or agents disagree and cannot resolve it → escalate to a named human (`human:<name>`); do not self-stamp.
- The only way to record the result would be to hand-write the `.grugops/context/` path → stop; the sanctioned writer is `context-io.ts`.

## Board moves
None of its own. This workflow is a seam every role passes through, not a column of work — running it never moves a ticket on `plans/board.md`. The board move belongs to the workflow that invoked it (04, 05, 14, 15 and the rest), and it makes that move on its own terms. A read or a write here neither advances nor holds a ticket.

## Trace updates
None of its own. The requirement→code→test→release trail in `plans/traceability.md` is rendered from the admitted notes, so this workflow feeds the trace rather than editing it: an `artifact-ref` note carries the trace ids, and the render picks them up. The invoking workflow appends and updates its own rows. Never hand-edit a traceability row to stand in for a note that admission refused — that is a faked trace.

## Done condition
The task's verified context was read before work began, and every result was recorded via `context-io.ts` under the honest kind: a `finding` only with a real `§14-gate#<id>` or `human:<name>` stamp that admission accepts, soft results as `claim` / `observation`. No refused finding was faked into a pass or silently degraded; any refusal was resolved by earning a real stamp within budget or by honest re-record as a `claim` with `confidence: UNKNOWN - verify`.

## Commit
Commit the context notes this workflow wrote (the `notes/` files and the derived `index.md` / `index.jsonl` renders that `context-io.ts` produced) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. This workflow records verified context; it never merges and never deploys — humans hold both.
