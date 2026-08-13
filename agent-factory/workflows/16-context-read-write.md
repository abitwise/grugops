---
kind: workflow
order: 16
cadence: both
---
# Workflow: context read/write

## When to use
Whenever a role is about to act on, or record into, the shared verified context. Every role reads the verified context before it works and records its results after it verifies them. This workflow is the single source of the context read/write protocol: read-before-act, do the work, write-after-verify. It also holds the admission rules that decide what may enter the verified context. Every other workflow and role references this file rather than restating the protocol — there is one protocol, named here, not forked into each role.

The only sanctioned writer of the shared context is `scripts/context-io.ts` (compiled to `scripts/context-io.js`). No role and no workflow writes the `.grugops/context/` path by any other path. The note schema this workflow records into is `agent-factory/contracts/context-note.md`.

## Agents involved
- Every role. This workflow is a seam, not an SDLC stage: it has no owning specialist and no queue of its own. Whichever role is about to act on, or record into, the shared verified context runs this protocol, then returns to the workflow it came from.
- The §14 gate (`agent-factory/workflows/05-pr-quality-gate.md`) is the only issuer of a `§14-gate#<id>` verification stamp, and a named human is the only issuer of `human:<name>`. Neither is a participant here; both are the authorities admission checks against.

## Inputs required
- The task id whose shared context is being read or written.
- The existing verified context for that task, read through `context-io.ts` (`readContext` / `render`) — the prior findings, decisions and recorded dead ends.
- The note schema `agent-factory/contracts/context-note.md` — the shape a note must take to be admissible.
- A real verification stamp for a `finding`, and for no other kind: a live green `§14-gate#<id>` verdict, or `human:<name>` under a named human's session grant.
- The `human_admission` dial from `.grugops/factory.config.json` when the host is Claude Code.

## Steps
Run these in order. The order is the protocol — read the verified state first, work, then record only what verification admits.

1. Read the shared context for the task through `context-io.ts` (`readContext` / `render`) before doing the work. Start from the verified state, not a blank slate. The prior verified findings, decisions, and recorded failed attempts are the memory you build on. Do not re-derive what the context already holds. Do not retry a recorded failed attempt.

2. Implement the change, run the analysis, or make the decision the task needs.

3. Record notes ONLY through the sanctioned writer — never author the context path by hand. On Claude Code the sanctioned admission path for a verified note is the STRUCTURED tool `mcp__grugops__propose_note`. The agent admits a note by structured JSON arguments, not a shell command string. There is no command text to obfuscate. That tool routes its persistence through `context-io.ts` (`admitAndAppend` → `appendNote`) internally. So `context-io.ts` remains the single sanctioned writer of the shared context — "record only via context-io" still holds. Choose the note kind honestly:
   - Record a `finding` (a verified result) ONLY with a real verification stamp in `verified_by`. The two accepted stamps are `§14-gate#<id>` and `human:<name>`. Cross-check `§14-gate#<id>` against a live GREEN gate verdict (Posture B). The `<id>` matches a live green `§14-gate` verdict record under the task. Use `human:<name>` for non-gate-adjudicable judgment or an unsolvable disagreement only (the escalation valve). On Claude Code the separate PER-CALL PreToolUse `admission-guard` hook makes the `human:<name>` signal un-forgeable. That hook gates the `mcp__grugops__propose_note` channel. It is a distinct process that reads the FRESH session variable per call. The agent's own child env cannot reach that variable. It validates the agent-supplied `human:<name>` stamp against the variable on every call. It reads the FINAL structured tool arguments, not a Bash command string. The grant is session-scoped and per-note capable (D-07). Once a named human exports `GRUGOPS_ADMISSION_APPROVED_BY=<name>`, it authorizes high-severity admissions under that name for the rest of the session. The human controls granularity by setting/unsetting the grant around a specific disposition. The per-call hook re-reads the fresh env, so an unset takes effect on the next call. The grant is not a mechanically-enforced per-note nonce. The Claude Code primary tier is gated by the `human_admission` dial. The four non-CC CLIs degrade to two weaker signals. They get the in-script `admit()` refusal plus a prompt-level "stop, ask a named human" (D-04/D-05). That degradation is documented honestly as not mechanically un-forgeable. The GOV-02 ledger's `disposed_by: human:<name>` means "admitted under <name>'s session grant," not "individually reviewed each entry."
   - Record a soft or neutral result as a `claim` or an `observation`, which needs no stamp. Only a `finding` requires `verified_by`. The `claim` / `decision` / `failed-attempt` / `observation` / `artifact-ref` kinds are soft, neutral, or pointer by nature.
   - Identify the gate's own green verdict as the one allowed `by: §14-gate` self-attestation. The §14 gate emits it only on a green result (see `agent-factory/workflows/05-pr-quality-gate.md`), the root of the verification chain. Any other note authored `by: §14-gate` is a structural FAIL (an auditable impersonation flag).

4. Read the admission refusal, then take ONE of the two honest routes below. `context-io.ts` hard-rejects a stampless or invalid-stamp `finding` — it names the fault and refuses the write. It NEVER silently rewrites the note into a `claim` (silent mutation is a fabrication smell).
   - Obtain a real stamp within budget. Run or fix the §14 gate to earn the real `§14-gate#<id>` stamp. Work inside the EXISTING bounded `self_fix_attempts` loop in `agent-factory/workflows/05-pr-quality-gate.md` (default `2`, "two rounds then human"). That loop lives there — this workflow references it and does not restate or re-dial it. After the budget is spent, stop and hand to a human.
   - Degrade honestly to a `claim`. Record the result as a `claim` carrying `confidence: UNKNOWN - verify` — explicitly non-load-bearing. A `claim` NEVER satisfies a finding's admission requirement. The gate holds the same "advise loudly, never hide" floor: never a faked pass, never a hand-set green.

The three admission outcomes, stated once:
- Run the §14 gate when the result is **gate-verifiable** → green verdict → `finding` with `§14-gate#<id>` admitted. The workhorse path; no human is bothered.
- Record an honest `claim` with `confidence: UNKNOWN - verify` when the result is **not gate-verifiable and low-stakes**. The escape hatch; no human is bothered.
- Escalate to a named human → `human:<name>` when the result is **not gate-verifiable and high-stakes**, or when agents disagree. The rare path.

## Stop conditions
- A `finding`'s admission is refused, and the bounded `self_fix_attempts` budget is exhausted without a real stamp → stop and hand to a human. The budget is referenced from `05-pr-quality-gate.md`. Do not loop, do not fake a stamp.
- The result is high-stakes and not gate-adjudicable, or agents disagree and cannot resolve it → escalate to a named human (`human:<name>`); do not self-stamp.
- The only way to record the result would be to hand-write the `.grugops/context/` path → stop; the sanctioned writer is `context-io.ts`.

## Board moves
None of its own. This workflow is a seam every role passes through, not a column of work — running it never moves a ticket on `plans/board.md`. The board move belongs to the workflow that invoked it (04, 05, 14, 15 and the rest). That workflow makes the move on its own terms. A read or a write here neither advances nor holds a ticket.

## Trace updates
None of its own. The requirement→code→test→release trail in `plans/traceability.md` is rendered from the admitted notes. So this workflow feeds the trace rather than editing it: an `artifact-ref` note carries the trace ids, and the render picks them up. The invoking workflow appends and updates its own rows. Never hand-edit a traceability row to stand in for a note that admission refused — that is a faked trace.

## Done condition
The task's verified context was read before work began. Every result was recorded via `context-io.ts` under the honest kind. A `finding` carries a real `§14-gate#<id>` or `human:<name>` stamp that admission accepts; soft results are recorded as `claim` / `observation`. No refused finding was faked into a pass or silently degraded. Any refusal was resolved by earning a real stamp within budget, or by honest re-record as a `claim` with `confidence: UNKNOWN - verify`.

## Commit
Commit the context notes this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The artifacts are the `notes/` files and the derived `index.md` / `index.jsonl` renders that `context-io.ts` produced. This workflow records verified context; it never merges and never deploys — humans hold both.
