# Quick 261031-oxi — context

**Source:** a first-time-reader scenario re-trace of the final WF04 hand-off loop (steps 14-17, `## Stop conditions`), `tech-lead.md` and the `factory.config.md` `escalate_unadjudicable_result` text, run 2026-10-31 after quick 261031-nd9 wrote the 39-UAT D1-D3 decisions. The 39-VERIFICATION re-run (1ee3007b) is `human_needed` on this loop only.

**Human decision (Olger Oeselg, 2026-10-31):** fix all 7 defects now, then re-trace, then close Phase 39.

Line numbers are WF04 file lines at HEAD 1ee3007b (step 15 sub-bullets: hand-off :44, human stop :45, record the move :46, record confirmation :48, board :49; step 16 :50; step 17 :51; used-up stop condition :70).

## Defects (ranked) and the intended fix direction

The direction respects the human's standing intent: the human is a stakeholder, needed only for fundamental changes to requirements and rules and for loops agents cannot settle; agents resolve everything else. Keep D1-D3 intact. Smallest text that closes each defect.

1. **An approved fundamental change re-blocks itself** (:45, :51). On approval the proposing role makes the change and answers `Resolved:`, then the Tech Lead's `Resolved:` check treats it as fundamental and returns it to Blocked, and so on forever.
   *Direction:* the `Resolved:` answer to an approved change names the human's approval (the finding or decision note), and the Tech Lead's check passes a change the human approved. Say how the hand-back after approval is recorded (a `Move: hand-off` with `Stop: human`), and that it counts toward no limit ("A move or hand-off the human names counts toward no limit" — make approval explicitly covered).

2. **A rejected `Fundamental:` proposal has no branch** (:45; config :222).
   *Direction:* on rejection, the Tech Lead hands the ticket back to the proposing role to fix it within the current requirement and rules, or applies the move the human names. Same recording as 1.

3. **The `Resolved:` check is anchored to step 16, which the `Resolved:` path never reaches** (:51). The path goes step 2 re-plan → step 3 pull. The check also reads only the note, and a fundamental edit already made is never undone.
   *Direction:* the Tech Lead runs the check at the step-2 re-plan, before any pull, and reads the change the note names (the diff), not only the note. A fundamental change made without approval goes back: the ticket returns to Blocked, the making role reverts it, and the Tech Lead treats the answer as `Fundamental:`.

4. **A re-plan after `Resolved:` that needs a raise with the one escalation spent** (:51 vs :44; tech-lead.md :49). "record a level raise in it as `Move: escalate`" read alone means a second escalation; the hand-off path from Ready for Dev has no rule to move the ticket back to Blocked and no failed-attempt id for `Cause-id:`.
   *Direction:* that raise is "used up": the ticket goes back to `Blocked` and the human stop applies (no role's job covers "needs a more senior engineer"). Make the step-17 sentence say the raise counts as the one escalation and, when that is spent, applies the human stop.

5. **No resume path at `notify`/`off`** (:45, :50, :70; config :223). "until a human answers" (:45) vs "no move and no re-enqueue" (:70); the human's-answer rules and the `Confirmed: yes` wait are written only under `block`.
   *Direction:* once a human answers at `notify` or `off`, the Tech Lead proceeds as at `block` from that point (records the move with `Stop: human`, confirmation, step 16). Make :70 say "no move and no re-enqueue until a human answers".

6. **"after three hand-offs on one ticket" timing** (:45, :70; tech-lead.md :49; config).
   *Direction:* say "before a fourth hand-off on one ticket" (or equivalent unambiguous wording) everywhere the phrase appears; update the text check (r) accordingly.

7. **Nobody queues the Tech Lead after the first block, nor after `Resolved:`** (:41, :50, :68).
   *Direction:* step 14 (engineer moves the ticket to Blocked) and the `Resolved:` branch of step 17 say the Orchestrator queues a `pending/` subtask for the Tech Lead, mirroring the D3 sentence on `Disputed:`/`Fundamental:`. Step 15 opens by reading the failed-attempt note *or the answer note that queued it*.

## Nits — fix only if they fall inside a sentence already being edited

- :45 "A receiving role writes one per step 17. Record one when…" — unclear antecedent of "one".
- :45/:48 the human is asked for "a level" even for design or requirement disputes; the `Level:` line is required even when the human named a move or approved a proposal.
- :51 after `Resolved:`, nobody removes the receiving role's `## Blocked` bullet.

Out of scope: the per-cause round rule being redundant with the per-ticket cap (leave it; it is the human's D2 decision), the `notify` meaning difference vs `exhaust_self_fix_budget`, WR/IN findings, the deferred "apply elsewhere" follow-up, Workflows 09/16/18, and other roles.
