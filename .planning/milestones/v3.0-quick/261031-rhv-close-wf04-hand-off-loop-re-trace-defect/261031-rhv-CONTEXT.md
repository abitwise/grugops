# Quick 261031-rhv — context

**Source:** a second first-time-reader scenario re-trace of WF04 steps 14-17 and `## Stop conditions`, `tech-lead.md` and the `factory.config.md` `escalate_unadjudicable_result` text, run 2026-10-31 after quick 261031-oxi (HEAD 4f6cacea). 5 of 7 scenarios now reach a defined end. Four real defects remain; R1 and R4 were introduced by 261031-oxi's own fixes.

**Human decision (Olger Oeselg, 2026-10-31):** "Fix all 4, then close. R2: grugops orchestrator is the one who notifies tech lead." After this task: a re-trace limited to these 4 fixes, then Phase 39 closes.

Line numbers are WF04 file lines at 4f6cacea (step 15 sub-bullets: used-up/hand-off :43-:44, human stop :45, record the move :46, record confirmation :48, board :49; step 16 :50; step 17 :51; used-up stop condition :70). TL = tech-lead.md, CFG = factory.config.md (row :213, gates section :216-:226).

## Design rule for every fix

Reuse the existing machinery: route every new case through a recorded `decision` note and the existing hand-off / human-stop / step-16 dispatch path, so the existing counters and the per-ticket ceiling bound it. Add no new mechanism, note type or counter. Smallest text that closes each defect. Keep D1-D3 and the 261031-oxi fixes intact.

## Defects and locked fix direction

**R1 (high) — the revert path records nothing and wakes no one, and can cycle uncounted** (:51: "It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`. The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it.")
*Direction:* the Tech Lead records the catch as a `Move: hand-off` decision note per step 15 (`To:` the role that made the change, the `Cause-id:` line, and the reason: revert the unapproved fundamental change), names that role as the `## Blocked` owner, and step 16 dispatches it like any hand-off. It counts toward the per-ticket ceiling (so a repeated catch → revert cycle reaches the human stop before a fourth hand-off). The receiving role reverts and answers per step 17 as usual (`Resolved:` with a non-fundamental fix, `Disputed:`, or `Fundamental:` to propose the change for human approval). Replace the bare "Orchestrator then queues … to revert it" sentence accordingly.

**R2 (medium) — at `notify`/`off`, nobody wakes the Tech Lead when a human answers** (:45, :50; CFG :223).
*Direction (human):* the grugops Orchestrator notifies the Tech Lead. When a human answers a parked ticket, the Orchestrator records the answer (where the human answers: to the Orchestrator) and queues a `pending/` subtask for the Tech Lead, mirroring the existing "The Orchestrator then queues…" sentences. Apply the same sentence at `block` if the text has the same gap there; check.

**R3 (medium) — the hand-back note does not say approved or rejected** (:45/:46/:48 with :51). Approval and rejection both produce a `Move: hand-off` / `Stop: human` note with a `Confirmed: yes` finding, so the receiving role can read a rejection as approval, and its `Resolved:` "naming the approval finding" passes the step-2 check.
*Direction:* the hand-back move note after a `Fundamental:` proposal carries the human's verdict as a line, `Approved:` or `Rejected:` (naming the human). The `Resolved:` answer names that `Approved:` note, and the step-2 check passes a fundamental change only when the named note carries `Approved:`. On `Rejected:`, the receiving role fixes within the current requirement and rules.

**R4 (medium-low) — contradiction on a raise past the spent escalation** (:44 "Used up also covers … a raise past the spent escalation" → hand-off; vs :51 "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop."). The re-plan case is also missing from every human-stop trigger list (:45, :70, CFG :213/:220-:222, TL :49), and it is unstated whether the step-2 plan note naming the higher level is published first.
*Direction:* one rule everywhere: a raise past the spent escalation applies the human stop (a level past the move limits is already the human's call: "The human's level stands, even past the move limits"; no agent role's job covers choosing a more senior engineer). Remove it from the :44 "used up → hand-off" consequence, add it to the human-stop triggers where they are listed (respect TL's size limit: 3773 B of 3786 B; if TL cannot take it, keep TL pointing at WF04 step 15, the single source, and say so), and say the Tech Lead publishes no plan note naming that level before the human answers.

## Out of scope (left for later)

Nits from the re-trace: "one" antecedent at :45 (fix only if the sentence is edited anyway), the `Level:` line on an approve/reject answer, which human is named at `notify`/`off`, the double confirmation, W04:17 omitting `Fundamental:`, TL:35 "`## Blocked`" vs the column, the Board-moves table missing the `Resolved:` and re-plan exits, the two routes to the Architect, `Resolved:` carrying no `Cause-id:`, and the `## Blocked` bullet not cleared after `Resolved:`. The deferred "apply elsewhere" follow-up; WR/IN findings; Workflows 09/16/18; other roles.
