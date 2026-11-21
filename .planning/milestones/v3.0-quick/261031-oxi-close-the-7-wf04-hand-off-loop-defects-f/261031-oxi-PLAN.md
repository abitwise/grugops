---
phase: quick-261031-oxi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/config/factory.config.md
  - scripts/tier-kit-text.test.ts
  - docs/audit/29-style-dispositions/quick-261031-oxi.md
  - CHANGELOG.md
autonomous: true
requirements: [TIER-04, OXI-1, OXI-2, OXI-3, OXI-4, OXI-5, OXI-6, OXI-7]

estimate:
  tokens: 130000
  raw_tokens: 130000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "Defect 1: an approved fundamental change does not block itself again. Step 17 tells the role: 'Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`.' The Tech Lead's check returns only a fundamental change 'that names no approval `finding`'. The human-stop sub-bullet records the hand-back as `Move: hand-off` with `Stop: human`, and that hand-back counts toward no limit."
    - "Defect 2: a rejected `Fundamental:` proposal has a branch. The human-stop sub-bullet says 'On rejection, apply the move the human names.' followed by 'Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules.' The factory.config.md `block` sub-bullet says the same."
    - "Defect 3: the `Resolved:` check runs at the step 2 re-plan and reads the diff: 'At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition.' An unapproved fundamental change goes back to `Blocked`, and the Orchestrator queues the role that made it to revert it. Step 17 no longer anchors the check to step 16."
    - "Defect 4: after `Resolved:`, a level raise at the re-plan is the one escalation ('The raise counts as the one escalation per ticket.'). A raise past the spent escalation returns the ticket to `Blocked` under the human stop."
    - "Defect 5: a parked ticket at `notify` or `off` can resume. The human stop ends with 'At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16.' Step 16 waits the same way. The used-up stop, tech-lead.md `## Hard limits` and the config paragraph each say the ticket waits with no move 'until a human answers'."
    - "Defect 6: the per-ticket ceiling reads 'before a fourth hand-off on one ticket' in WF04 step 15, the WF04 used-up stop, tech-lead.md `## Hard limits`, the config roster row and the config paragraph. The older wording is gone from all three kit files, and test (r) pins the new phrase."
    - "Defect 7: the Orchestrator queues the Tech Lead after the first block (step 14) and after `Resolved:` (step 17), in the same words as the D3 sentence. Step 15 tells the Tech Lead to read the answer note too when a step 17 answer queued it."
    - "Nothing else moves. WF04 keeps 2 `checkpoint: ` tags and 6 `## Stop conditions` bullets. scripts/checkpoints.ts, scripts/checkpoints.js and hooks/ are byte-unchanged. No config key, default or ROLE_CEILINGS value changes. tech-lead.md stays under 3786 B (planner simulation: 3773 B). check-diff-disposition is back at 721, and the full non-e2e suite shows only the 21 recorded failures, with 7 more tests than before."
  artifacts:
    - path: agent-factory/workflows/04-ticket-to-pr.md
      provides: "Steps 14, 15, 16 and 17 and the used-up stop, with the seven defect fixes"
      contains: "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition."
    - path: agent-factory/roles/tech-lead.md
      provides: "`## Hard limits` with the 'before a fourth hand-off on one ticket' wording and the until-a-human-answers park"
      contains: "Stop the same way before a fourth hand-off on one ticket."
    - path: agent-factory/config/factory.config.md
      provides: "The escalate roster row and paragraph match defects 2, 5 and 6"
      contains: "Neither hand-back counts toward a limit."
    - path: scripts/tier-kit-text.test.ts
      provides: "New cases (s)-(y) in the G-39-71 describe, plus the edited pins (g), (q), (r), 39-18 (d) and (e), and the tech-lead D-21 case"
      contains: "261031-oxi"
    - path: docs/audit/29-style-dispositions/quick-261031-oxi.md
      provides: "One disposition row per clause this plan adds, with companion cells in the frozen sections"
      contains: "## Dispositions"
    - path: CHANGELOG.md
      provides: "The [Unreleased] Workflow 04 bullets describe the final loop"
      contains: "resumes as at `block` once a human answers"
  key_links:
    - from: "WF04 step 14 (engineer blocks)"
      to: "WF04 step 15 (Tech Lead)"
      via: "a `pending/` subtask the Orchestrator queues for the Tech Lead"
      pattern: "who reads that `failed-attempt` note at step 15"
    - from: "WF04 step 17 `Resolved:` answer"
      to: "WF04 step 2 re-plan and its fundamental-change check"
      via: "a `pending/` subtask for the Tech Lead, then the diff check against the step 17 definition"
      pattern: "who reads that answer note at step 2"
    - from: "WF04 step 15 human stop (approve or reject)"
      to: "WF04 step 17 proposing role and the step 2 check"
      via: "a `Move: hand-off` with `Stop: human`, and the approval `finding` named in the `Resolved:` answer"
      pattern: "naming the approval `finding`"
    - from: "WF04 human stop at `notify` or `off`"
      to: "WF04 move record, confirmation and step 16"
      via: "the resume sentence and the step 16 wait"
      pattern: "Wait the same way at `notify` or `off` once a human answers."
---

<objective>
Close the 7 defects in the Workflow 04 hand-off loop that the first-time-reader scenario re-trace found on
2026-10-31, after quick task 261031-nd9 wrote the 39-UAT D1-D3 decisions. The human decision (Olger Oeselg,
2026-10-31) is locked: fix all 7 defects now, then re-trace, then close Phase 39. Every defect and its fix
direction is in 261031-oxi-CONTEXT.md. Keep D1-D3 intact, and use the smallest text that closes each defect.

Purpose: the loop becomes a closed procedure for a first-time reader. A human-approved change passes the
check. A rejected proposal has a way forward. The check runs where the `Resolved:` path really goes and
reads the change itself. A raise past the spent escalation goes to the human. A parked ticket resumes once a
human answers. The ceiling has one timing. Somebody queues the Tech Lead at every hand-back.

Output: edited WF04, tech-lead.md and factory.config.md; 7 new test cases (s)-(y) and 6 edited pins; a new
disposition file; CHANGELOG `[Unreleased]` text. The defect-to-case map is: 1 (s), 2 (t), 3 (u), 4 (v),
5 (w), 6 (x) plus the edited (r), 7 (y).

The planner gives every sentence verbatim and checked them against the repository at HEAD 1ee3007b:
- Each new `## Steps` sentence was counted with the lexicon's own `countWords` at 20 words or fewer. The
  longest are 20, 19, 19 and 19. No sentence has a modal or opens with a bare demonstrative.
- The only `## Stop conditions` sentence that changes counts 21 words, under the descriptive bound of 25.
- Each anchor sentence named below occurs exactly once in its file.
- Every new literal prints 0 in all five target files.

Add only the listed sentences and do not redesign the loop.

Kept as they are, with the reason:
- WF04 keeps 2 `checkpoint: ` tags and 6 stop bullets. No fix needs a new stop. The only stop-bullet edit
  is inside the used-up bullet: defect 6 rewords one sentence and defect 5 appends "until a human answers".
- Step 15's lead sentence "Read the `failed-attempt` note (Tech Lead)." stays byte for byte. Nine test
  sites use it as a prefix, so defect 7 adds a second sentence instead.
- The step 16 sentence about the `Stop: human` hold stays byte for byte, because two tests pin it. Defect 5
  adds one sentence after it.
- tech-lead.md: defect 6 adds +3 B. Defect 5 adds +6 B, rewording "leave the ticket ... instead" to "leave
  it ... until a human answers". The result is 3773 B, 13 B under WARN 3786. The orchestrator's advice was
  net-zero or shorter. This edit goes past that on purpose: without it, the role's hard limit would still say
  "no move" with no way to resume, which is the same defect 5 contradiction the CONTEXT fixes at WF04 :70.
  The hard constraint, staying under WARN, holds.

Not fixed (CONTEXT nits apply only inside a sentence already being edited, and none is):
- nit 1, the antecedent of "one" in the human-stop sub-bullet
- nit 2, the `Level:` line and the "a level" question
- nit 3, removing the receiving role's `## Blocked` bullet after `Resolved:`

List all three as still open in the SUMMARY.

Out of scope (CONTEXT): the per-cause round rule, the `notify` meaning difference, WR/IN findings, the
"apply elsewhere" follow-up, Workflows 09/16/18, other roles, 39-REVIEW-DISPOSITION.md, the 261031-nd9
disposition file (its rows for reworded clauses simply stop matching, and the gate reports no finding for an
unused row).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.planning/quick/261031-oxi-close-the-7-wf04-hand-off-loop-defects-f/261031-oxi-CONTEXT.md

Read by line range only:
- `.planning/quick/261031-nd9-write-the-39-uat-d1-d3-human-decisions-i/261031-nd9-SUMMARY.md` (gates, disposition counts, full-suite baseline)
- `agent-factory/workflows/04-ticket-to-pr.md` lines 41-51 (steps 14-17) and 64-70 (`## Stop conditions`)
- `agent-factory/roles/tech-lead.md` line 49 (`## Hard limits`; 3764 B at HEAD, ROLE_CEILINGS FAIL 4000 / WARN 3786, WARN fires at >= 3786)
- `agent-factory/config/factory.config.md` lines 213-226 (escalate roster row and paragraph)
- `scripts/tier-kit-text.test.ts` lines 270-285 (tech-lead D-21 amended case), 1340-1366 (39-18 (d) and (e)), 1385-1714 (the G-39-71 describe, (a)-(r), to end of file)
- `docs/audit/29-style-dispositions/quick-261031-nd9.md` (header and row shape, the companion-cell form)
- `CHANGELOG.md` lines 64-77 (`[Unreleased]` `### Changed`, the two Workflow 04 bullets)

Facts the planner measured at HEAD 1ee3007b:
- `node scripts/check-diff-disposition.js` prints `721 finding(s) over 42 elements`, the recorded pre-existing red. Base commit `4d2b8f079cc43d7d6184729966492789fb4dc05e` (00-base.md); never move it.
- None of the sentences this plan rewords exists in the base commit, and each already has a row (39-18.md, 39-19.md or quick-261031-nd9.md). The gate therefore reports only the new clauses, and adding one row per new clause returns it to exactly 721.
- `grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l` prints 2; `## Stop conditions` holds 6 bullets.
- Lexicon (scripts/check-imperative-lexicon.ts): in `## Steps` a sentence counts at most 20 words (backticks unwrapped; a multi-word Technical Name such as "Tech Lead" counts as one word) and uses no modal (should, may, might, could, would, must, shall, can). A sentence that opens with an approved verb must not chain "and"/"then" plus a second approved verb. No sentence opens with this/that/these/those followed by a copula, modal or auxiliary. `## Stop conditions` sentences take the descriptive bound of 25.
- Test N2 of the "factory.config.md `checkpoints` wording" describe splits step 15 on ". " and requires every sentence that opens with "At `notify`," (comma right after) to name `observation` per Workflow 16. Every new step 15 sentence below opens "At `notify` or `off`," and so stays outside that filter. Keep it that way.
- WF04 `## Stop conditions` and tech-lead.md `## Hard limits` are FROZEN by heading in the disposition contract. factory.config.md, CHANGELOG.md and the test file are not watched.
- The full non-e2e suite after 261031-nd9 was `Tests 21 failed | 10711 passed | 2 skipped (10734)`. Only `.planning/` files changed since.

Project rules for every executor of this plan:
- Never stage, commit, revert or edit `docs/audit/28-prepass-evidence.md`. Never touch the untracked `~/` directory. Stage with path-specific `git add <path>` only.
- Never use `npm test`. Run `npx vitest run <explicit files>` in the foreground. The full non-e2e suite in Task 3 runs in the background.
- Never add, remove or move a `checkpoint:` tag or a `## Stop conditions` bullet. Never edit scripts/checkpoints.ts, scripts/checkpoints.js or hooks/. Never raise a ROLE_CEILINGS value or move the disposition base commit.
- Edit an existing test case only where this plan names it; each such edit gets a comment naming quick task 261031-oxi and the defect number. New cases carry a comment naming the defect, "Olger Oeselg, 2026-10-31" and quick task 261031-oxi. Keep (a)-(r) and (s)-(y) in letter order at the end of the G-39-71 describe.
- If the lexicon or a guard refuses a sentence below, shorten it within the rules and keep its meaning. Update its test literal in the same commit and record the change in the SUMMARY.
- Commit subjects start `fix(quick-261031-oxi):` or `docs(quick-261031-oxi):` and end with the attribution trailer from the session.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Defect 6 end to end: "before a fourth hand-off on one ticket" in every kit place, the pins, the new disposition file, the gates and a commit</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/config/factory.config.md, docs/audit/29-style-dispositions/quick-261031-oxi.md</files>
  <behavior>
    - Edited (r): its CEILING constant becomes "before a fourth hand-off on one ticket", still asserted in the four places. Its three sentences become "Apply it also before a fourth hand-off on one ticket.", "The same stop applies before a fourth hand-off on one ticket." and "Stop the same way before a fourth hand-off on one ticket.".
    - New (x), defect 6:
      - WF04, TECH_LEAD and CONFIG each `not.toContain` the older per-ticket phrase, the three words "three hand-offs on one ticket".
      - The one CONFIG line that starts with the `escalate_unadjudicable_result` roster cell contains ", or before a fourth hand-off on one ticket,".
      - `escalateParagraph()` contains "The same holds before a fourth hand-off on one ticket." and "It stops the same way before a fourth hand-off on one ticket, and asks the human to approve or reject a `Fundamental:` proposal.".
      - WF04 still has 2 `checkpoint: ` tags, and `stops` still has length 6.
  </behavior>
  <action>
This task carries the whole path on defect 6, the one fix that touches every layer: the text in three kit files, both FROZEN sections, the text check, the lexicon, the size ceiling, the disposition gate and a commit.

1. RED. In scripts/tier-kit-text.test.ts:
   - Edit case (r) as described in the behavior block. Also edit its title to "(r) D2 / CR-04: a `Cause-id:` line names the cause, and the human stop applies before a fourth hand-off on one ticket (quick 261031-nd9; wording per quick 261031-oxi defect 6)". Add a comment saying that quick 261031-oxi defect 6 (Olger Oeselg, 2026-10-31) moved the ceiling wording so its timing has one reading.
   - Add case (x) after (r), at the end of the G-39-71 describe. Reuse WF04, TECH_LEAD, CONFIG, escalateParagraph and stops.
   - Run `npx vitest run scripts/tier-kit-text.test.ts`. Exactly (r) and (x) fail, and only for the wording. Keep the transcript for the SUMMARY.

2. GREEN, per defect 6. Make each replacement exactly once. Every other byte stays unchanged.
   - agent-factory/workflows/04-ticket-to-pr.md, step 15 human-stop sub-bullet: replace the sentence "Apply it also after three hand-offs on one ticket." with "Apply it also before a fourth hand-off on one ticket."
   - Same file, `## Stop conditions` used-up bullet (FROZEN): replace "The same stop applies after three hand-offs on one ticket." with "The same stop applies before a fourth hand-off on one ticket." The bullet still ends with its `checkpoint: escalate_unadjudicable_result` tag.
   - agent-factory/roles/tech-lead.md `## Hard limits` (FROZEN): replace "Stop the same way after three hand-offs on one ticket." with "Stop the same way before a fourth hand-off on one ticket." The file goes from 3764 B to 3767 B.
   - agent-factory/config/factory.config.md has three replacements:
     - In the roster row, replace ", or after three hand-offs on one ticket," with ", or before a fourth hand-off on one ticket,".
     - In the "Workflow 04, `## Stop conditions`" bullet, replace "The same holds after three hand-offs on one ticket." with "The same holds before a fourth hand-off on one ticket."
     - In the `block` sub-bullet, replace "It stops the same way after three hand-offs on one ticket," with "It stops the same way before a fourth hand-off on one ticket,". The rest of that sentence stays.
   - Re-run the test file until it is green.

3. Gates:
   - `npm run build` and `npm run typecheck`
   - `node scripts/check-imperative-lexicon.js` and `node scripts/check-foundation-guards.js` (no WARN line for tech-lead.md)
   - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and `node scripts/check-kit-refs.js`
   - `npm run check:claim-anchors`, `npm run freshness:adapters`, `npm run freshness:catalog` and `npm run freshness`

4. Disposition. Run `node scripts/check-diff-disposition.js`; it names the new clauses that have no row. Create docs/audit/29-style-dispositions/quick-261031-oxi.md in the quick-261031-nd9.md shape:
   - A title naming quick task 261031-oxi and the Workflow 04 hand-off loop.
   - The source: the first-time-reader scenario re-trace of WF04 steps 14-17, `## Stop conditions`, tech-lead.md and the config text, run 2026-10-31 after quick 261031-nd9.
   - The human decision quoted: "fix all 7 defects now, then re-trace, then close Phase 39" (Olger Oeselg, 2026-10-31), and one line per defect 1-7 taken from the CONTEXT headings.
   - A note that the work falls outside the four-round Phase 39 gap cap, as a human direction.
   - The base commit `4d2b8f079cc43d7d6184729966492789fb4dc05e`, read from 00-base.md and not moved.
   - A running before/after count sentence, which Tasks 2 and 3 extend.
   - The sentence that WF04 `## Stop conditions` and tech-lead.md `## Hard limits` are FROZEN by heading and every row in them carries a companion cell.
   - A `## Dispositions` table with seven columns: file, line, before, after, rule, disposition, companion.

   Write the rows:
   - One row per clause the gate names. Copy each clause into `after` exactly as the gate splits it.
   - For a reworded sentence, put the replaced HEAD sentence in `before`. Use `—` for a new sentence.
   - The rule cell is `quick 261031-oxi defect 6`.
   - The disposition cell is a full sentence saying what the clause closes.
   - Companion `—`, except in the two FROZEN sections:
     - WF04 `## Stop conditions` rows take "FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the per-ticket ceiling stops before a fourth hand-off on one ticket, so its timing has one reading; no stop is added or removed and no checkpoint count moves."
     - tech-lead.md `## Hard limits` rows take "FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the Tech Lead stops for a named human before a fourth hand-off on one ticket; no stop is added or removed and no checkpoint count moves."
   - Never put a pipe character inside a cell.

   Re-run until the gate prints exactly `721 finding(s)`.

5. Commit the five files, path-specific, as `fix(quick-261031-oxi): the per-ticket ceiling stops before a fourth hand-off on one ticket (defect 6)`. Then re-run this task's `<verify>` end to end. Task 2 starts only when it passes.
  </action>
  <verify>
    <automated>npm run build && npm run typecheck && npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts</automated>
    <automated>node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-kit-refs.js && npm run check:claim-anchors && npm run freshness:adapters && npm run freshness:catalog && npm run freshness</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>test "$(wc -c < agent-factory/roles/tech-lead.md)" -lt 3786 && test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && test "$(grep -oF 'before a fourth hand-off on one ticket' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && test "$(grep -oF 'before a fourth hand-off on one ticket' agent-factory/config/factory.config.md | wc -l)" -eq 3 && grep -qF 'Stop the same way before a fourth hand-off on one ticket.' agent-factory/roles/tech-lead.md && git diff --quiet 1ee3007b -- scripts/checkpoints.ts scripts/checkpoints.js hooks</automated>
  </verify>
  <done>
- (r) and (x) went RED for the wording only, then GREEN. Every other tier-kit-text case passes unedited.
- `grep -oF 'before a fourth hand-off on one ticket' <file> | wc -l` (matches, not lines) prints 2 for WF04 (baseline 0) and 3 for factory.config.md (baseline 0), and the tech-lead.md sentence is found (baseline 0). Case (x) proves the older phrase is gone from all three files.
- tech-lead.md is 3767 B with no WARN line. WF04 keeps 2 `checkpoint: ` matches and 6 stop bullets. checkpoints.ts, checkpoints.js and hooks/ show no diff from 1ee3007b.
- check-diff-disposition prints 721. quick-261031-oxi.md exists with at least one row in each FROZEN section, each carrying its companion cell (baseline: file absent).
- One `fix(quick-261031-oxi):` commit holds exactly the five files.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Defects 1, 2, 3 and 5: the approve, reject and resume branches of the human stop, and the Resolved: check at the re-plan that reads the diff</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/config/factory.config.md, docs/audit/29-style-dispositions/quick-261031-oxi.md</files>
  <behavior>
    - Constants used below:
      - HAND_BACK = "On approval, hand the ticket back to the proposing role to make the change."
      - PROPOSE = "Only propose a fundamental fix: leave the requirement, rule, ADR or `checkpoints` value unchanged until a named human approves."
      - DEFINITION = "Altering a business rule, a hard limit, a `checkpoints` value or an ADR is fundamental too."
      - RESOLVED_MOVE = "After `Resolved:`, move the ticket out of `Blocked`: to `Backlog` after a split, otherwise to `Ready for Dev`."
      - LEVEL_STANDS = "The human's level stands, even past the move limits."
      - STOP_HOLD = "After a `Stop: human` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it."
    - New (s), defect 1:
      - Step 17 holds APPROVED = "Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`.", placed after PROPOSE.
      - Step 17 holds TREAT_NEW = "It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`."
      - The "Apply the human stop." sub-bullet holds RECORD_BACK = "Record either hand-back as `Move: hand-off` with `Stop: human`; it counts toward no limit.", placed after HAND_BACK and before LEVEL_STANDS.
    - New (t), defect 2:
      - The human-stop sub-bullet holds REJECT = "On rejection, apply the move the human names." and WITHOUT = "Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules.", in the order HAND_BACK < REJECT < WITHOUT < RECORD_BACK.
      - `escalateParagraph()` contains "On approval it hands the ticket back to the proposing role to make the change.", "On rejection it applies the move the human names, or else hands the ticket back to fix it within the current requirement and rules." and "Neither hand-back counts toward a limit.".
    - New (u), defect 3:
      - Step 17 holds CHECK_NEW = "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition.", then TREAT_NEW, then REVERT = "The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it.", in the order DEFINITION < CHECK_NEW < TREAT_NEW < REVERT < RESOLVED_MOVE.
      - Step 17 `not.toContain` the old anchor "Before step 16 dispatches".
    - New (w), defect 5:
      - The human-stop sub-bullet `endsWith` RESUME = "At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16."
      - Step 16 holds WAIT = "Wait the same way at `notify` or `off` once a human answers.", placed after STOP_HOLD.
      - `usedUp()` contains PARKED_NEW = "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers." and ends with PARKED_NEW, a space and the `checkpoint: escalate_unadjudicable_result` tag.
      - `escalateParagraph()` contains "at `notify` or `off` the ticket stays in `Blocked` with no move until a human answers." and "Once a human answers, the Tech Lead proceeds as at `block`, from the move record through Workflow 04 step 16.".
      - tech-lead.md `## Hard limits` contains "At `notify` or `off`, leave it in `Blocked` with no move until a human answers.".
    - Edited pins:
      - (q): its CHECK and TREAT constants become CHECK_NEW and TREAT_NEW, and its order assertions stay.
      - (g) in the G-39-71 describe, and PARKED in 39-18 case (d): the sentence becomes PARKED_NEW.
      - The tech-lead.md sentence in the "D-21 amended" case of the tech-lead describe and in 39-18 case (e) becomes "At `notify` or `off`, leave it in `Blocked` with no move until a human answers.".
  </behavior>
  <action>
1. RED. In scripts/tier-kit-text.test.ts:
   - Make the edited pins listed in the behavior block. Add a comment at each one: quick 261031-oxi defect 3 for (q), defect 5 for the others.
   - Add cases (s), (t), (u) and (w) after (r) and before (x). Reuse subAt, stepAt, STEP16, STEP17, holdsAll, hasSentence, usedUp, escalateParagraph, TECH_LEAD and section, and use indexOf comparisons for each order.
   - Run `npx vitest run scripts/tier-kit-text.test.ts`. Exactly the six edited pins and the four new cases fail, each for a missing sentence. Keep the transcript.

2. GREEN in agent-factory/workflows/04-ticket-to-pr.md. Insert or replace each sentence at the anchor named. Each anchor occurs once.
   - Step 15 "Apply the human stop." sub-bullet:
     - Right after HAND_BACK, insert in order: "On rejection, apply the move the human names." (defect 2), then "Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules." (defect 2), then "Record either hand-back as `Move: hand-off` with `Stop: human`; it counts toward no limit." (defects 1 and 2). The last sentence covers both hand-backs, the approved and the rejected, as the CONTEXT asks. Leave the existing "A move or hand-off the human names counts toward no limit." unchanged.
     - Append at the very end of the sub-bullet, after "At `notify`, record an `observation` per Workflow 16 once, naming the last hand-off note.", the sentence "At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16." (defect 5).
   - Step 16: right after STOP_HOLD, insert "Wait the same way at `notify` or `off` once a human answers." (defect 5).
   - Step 17:
     - Right after PROPOSE, insert "Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`." (defect 1). The approval `finding` is the `Confirmed: yes` finding the step 15 confirmation sub-bullet records with the `human:<name>` stamp. Do not restate that here.
     - Replace "Before step 16 dispatches, the Tech Lead checks every `Resolved:` note against this definition." with "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition." (defect 3; the check now sits on the path `Resolved:` really takes, and "the diff behind" makes it read the change, not only the note).
     - Replace "It treats a fundamental one as `Fundamental:` and returns the ticket to `Blocked`." with "It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`." (defects 1 and 3).
     - Right after that, insert "The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it." (defect 3, written in the same shape as the existing D3 queue sentence).
   - `## Stop conditions` used-up bullet (FROZEN): replace "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue." with "At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers." (defect 5). It stays the last sentence before the tag.

3. agent-factory/roles/tech-lead.md `## Hard limits` (FROZEN), defect 5: replace "At `notify` or `off`, leave the ticket in `Blocked` with no move instead." with "At `notify` or `off`, leave it in `Blocked` with no move until a human answers." That is the only tech-lead.md change. The file goes from 3767 B to 3773 B, under WARN 3786 (see the objective for why it is not net-zero). The pronoun "it" saves 8 B and refers to the ticket in the sentence before it.

4. agent-factory/config/factory.config.md, inside the **What `escalate_unadjudicable_result` gates.** paragraph:
   - "Workflow 04, `## Stop conditions`" bullet, defect 5: replace "at `notify` or `off` the ticket stays in `Blocked` with no move." with "at `notify` or `off` the ticket stays in `Blocked` with no move until a human answers."
   - `block` sub-bullet, defects 1 and 2: right after "...and asks the human to approve or reject a `Fundamental:` proposal." append: "On approval it hands the ticket back to the proposing role to make the change. On rejection it applies the move the human names, or else hands the ticket back to fix it within the current requirement and rules. Neither hand-back counts toward a limit."
   - `notify` sub-bullet, defect 5: right after "...blocked past `blocked_escalation_days`." append: "Once a human answers, the Tech Lead proceeds as at `block`, from the move record through Workflow 04 step 16." The `off` sub-bullet ("the same as `notify`") then covers `off`.
   - Keep every sentence that cases (k), (l), (q), (r), (x) and E3 pin byte for byte.

5. Re-run the test file until it is green. Run every Task 1 gate. Then run `node scripts/check-diff-disposition.js` and append one row per newly named clause to quick-261031-oxi.md:
   - Rule cell `quick 261031-oxi defect N`.
   - For a reworded sentence, put the HEAD sentence in `before`.
   - WF04 `## Stop conditions` rows take the companion "FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-oxi defect 5 (Olger Oeselg 2026-10-31), a ticket parked at `notify` or `off` waits only until a human answers and then follows the `block` path; no stop is added or removed and no checkpoint count moves."
   - tech-lead.md `## Hard limits` rows take "FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-oxi defect 5 (Olger Oeselg 2026-10-31), the Tech Lead keeps a parked ticket in `Blocked` only until a human answers; no stop is added or removed and no checkpoint count moves."
   - Extend the header's count sentence.
   - Re-run until the gate prints exactly `721 finding(s)`.

6. Commit the five files, path-specific, as `fix(quick-261031-oxi): an approved or rejected fundamental change closes the loop, the Resolved: check reads the diff at the re-plan, and a parked ticket resumes once a human answers (defects 1, 2, 3, 5)`.
  </action>
  <verify>
    <automated>npm run build && npm run typecheck && npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts</automated>
    <automated>node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-kit-refs.js && npm run check:claim-anchors && npm run freshness:adapters && npm run freshness:catalog && npm run freshness</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>test "$(wc -c < agent-factory/roles/tech-lead.md)" -lt 3786 && test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && grep -qF 'naming the approval `finding`' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'Without one, hand the ticket back to the proposing role' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'checks the diff behind every `Resolved:` note' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'Wait the same way at `notify` or `off` once a human answers.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'Neither hand-back counts toward a limit.' agent-factory/config/factory.config.md && git diff --quiet 1ee3007b -- scripts/checkpoints.ts scripts/checkpoints.js hooks</automated>
  </verify>
  <done>
- The six edited pins and cases (s), (t), (u) and (w) went RED for missing sentences, then GREEN. Every other case passes unedited.
- Each `grep -qF` in the verify finds its sentence (baseline: all 0 at HEAD 1ee3007b). Case (u) proves step 17 no longer anchors the check to step 16.
- tech-lead.md is 3773 B with no WARN line. WF04 keeps 2 `checkpoint: ` matches and 6 stop bullets. checkpoints.ts, checkpoints.js and hooks/ show no diff.
- check-diff-disposition prints 721. Every new row in a FROZEN section carries its companion cell.
- One `fix(quick-261031-oxi):` commit holds exactly the five files.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Defects 4 and 7: the queue sentences and the re-plan raise; the CHANGELOG; the full gate and suite run</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/workflows/04-ticket-to-pr.md, docs/audit/29-style-dispositions/quick-261031-oxi.md, CHANGELOG.md</files>
  <behavior>
    - New (v), defect 4: step 17 holds, in this order:
      - BIND = "The step 15 move limits bind that plan: record a level raise in it as `Move: escalate`."
      - RAISE_ONE = "The raise counts as the one escalation per ticket."
      - RAISE_PAST = "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop."
      - OWNER = "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again."
    - New (y), defect 7:
      - Step 14 (`stepAt("Record a \`failed-attempt\` note")`) holds QUEUE14 = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that `failed-attempt` note at step 15.", placed after "Add a `## Blocked` bullet naming the Tech Lead as the owner who clears it.".
      - Step 15 holds READ_ANSWER = "When a step 17 answer queued the Tech Lead, read that answer note too.", placed before "Choose one:". The lead line still starts with "Read the `failed-attempt` note (Tech Lead)." and still does not contain "named human".
      - Step 17 holds QUEUE_RESOLVED = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 2.", in the order RESOLVED_MOVE < QUEUE_RESOLVED < "The Tech Lead then plans it again per step 2 before any pull.".
  </behavior>
  <action>
1. RED. Add cases (v) and (y) to scripts/tier-kit-text.test.ts: (v) after (u) and before (w), and (y) after (x), so the describe ends (r), (s), (t), (u), (v), (w), (x), (y). Run `npx vitest run scripts/tier-kit-text.test.ts`. Exactly (v) and (y) fail, each for a missing sentence. Keep the transcript.

2. GREEN in agent-factory/workflows/04-ticket-to-pr.md. Each anchor occurs once.
   - Step 14, defect 7: right after "Add a `## Blocked` bullet naming the Tech Lead as the owner who clears it." insert QUEUE14. It covers both the engineer `BLOCKED` path and the gate path, because both reach that sentence.
   - Step 15 lead line, defect 7: right after "Read the `failed-attempt` note (Tech Lead)." insert READ_ANSWER. Leave the lead sentence byte for byte.
   - Step 17, defect 7: right after RESOLVED_MOVE insert QUEUE_RESOLVED.
   - Step 17, defect 4: right after BIND insert RAISE_ONE, then RAISE_PAST. The CONTEXT's reason is that no role's job covers "needs a more senior engineer" once the cause is resolved. It stays a rationale and is not added as text.
   - Change no other sentence.
   - The final step 17 order is:
     - "Read the hand-off note (receiving role)." … PROPOSE, then APPROVED
     - the two definition sentences, then CHECK_NEW, TREAT_NEW and REVERT
     - RESOLVED_MOVE, then QUEUE_RESOLVED and "The Tech Lead then plans it again per step 2 before any pull."
     - BIND, then RAISE_ONE and RAISE_PAST
     - OWNER, then the D3 queue sentence

3. Re-run the test file until it is green. Run every Task 1 gate. Append one row per newly named clause to quick-261031-oxi.md: rule cell `quick 261031-oxi defect 4` or `quick 261031-oxi defect 7`, companion `—` (no FROZEN section is touched in this task). Update the header's count sentence to its final form. Re-run until the gate prints exactly `721 finding(s)`. Commit the three files, path-specific, as `fix(quick-261031-oxi): the Orchestrator queues the Tech Lead after the first block and after Resolved:, and a re-plan raise past the spent escalation reaches the human stop (defects 4, 7)`.

4. CHANGELOG.md `## [Unreleased]` `### Changed`, clear voice, not caveman. Wrap at the file's existing width.
   - In the bullet that starts "- Workflow 04 runs the Tech Lead after the Definition of Ready check.", replace only its last sentence with: "A named human decides only after the roles dispute one cause three times, before a fourth hand-off on one ticket, or when a role proposes a fundamental change to a requirement or a rule."
   - Replace the whole next bullet (it starts "- In Workflow 04's hand-off loop," and ends "the move limits.") with: "- In Workflow 04's hand-off loop, a role that finds a fundamental change to a requirement, rule, ADR or `checkpoints` value proposes it and leaves it unmade until a named human approves. After approval the role makes the change and names the approval in its `Resolved:` answer. After a rejection the Tech Lead applies the move the human names, or hands the ticket back to be fixed within the current requirement and rules. Neither hand-back counts toward a limit. At its re-plan, before any pull, the Tech Lead checks the change behind every `Resolved:` answer; an unapproved fundamental change goes back to `Blocked`, is reverted and reaches the human stop. Each hand-off and dispute carries a `Cause-id:` line naming the `failed-attempt` note that first raised the cause. The Orchestrator queues the Tech Lead after the first block and after every answer. A re-plan that needs a raise past the spent escalation goes to the human stop. At `notify` or `off`, a parked ticket resumes as at `block` once a human answers."
   - Pick no version and add no other bullet.
   - Run `npm run check:public-docs && node scripts/check-banned-claims.js && npm run check:claim-anchors`.
   - Commit CHANGELOG.md alone, path-specific, as `docs(quick-261031-oxi): changelog for the seven Workflow 04 hand-off loop fixes`.

5. Full non-e2e suite, in the background: `timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'` (about 23 minutes). The baseline after 261031-nd9 is `Tests 21 failed | 10711 passed | 2 skipped (10734)`. The 21 failures are:
   - scripts/context-io.test.ts 7
   - scripts/context-io-writer-set.test.ts 2
   - scripts/canonical-corpus.test.ts 1
   - scripts/harness-instance-ledger.test.ts 4
   - scripts/uat-gate-exit-contract.test.ts 5
   - install/installer-fs-census.test.ts 1
   - the one environmental case in scripts/check-foundation-guards.test.ts

   The run passes when every failing test is in that set, at most 21 fail, and the total rose by exactly 7 (cases (s)-(y)). The expected line is `Tests 21 failed | 10718 passed | 2 skipped (10741)`. Any failure outside the set is a regression from this plan: fix it and re-run. List the failures by file in the SUMMARY. Never mark a baseline failure as passing.

6. Confirm `git status --short docs/audit/28-prepass-evidence.md` still prints ` M docs/audit/28-prepass-evidence.md`, and that `~/` is untouched.
  </action>
  <verify>
    <automated>npm run build && npm run typecheck && npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts</automated>
    <automated>node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-kit-refs.js && npm run check:claim-anchors && npm run freshness:adapters && npm run freshness:catalog && npm run freshness && npm run check:public-docs && node scripts/check-banned-claims.js</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>grep -qF 'who reads that `failed-attempt` note at step 15.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'who reads that answer note at step 2.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'read that answer note too.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'The raise counts as the one escalation per ticket.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'before a fourth hand-off on one ticket' CHANGELOG.md && grep -qF 'resumes as at `block` once a human answers' CHANGELOG.md && test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2</automated>
    <automated>timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'</automated>
  </verify>
  <done>
- (v) and (y) went RED for missing sentences, then GREEN. The G-39-71 describe ends in letter order (r)-(y).
- Each `grep -qF` in the verify finds its sentence (baseline: all 0 at HEAD 1ee3007b). WF04 keeps 2 `checkpoint: ` matches and 6 stop bullets.
- check-diff-disposition prints 721. The public-docs, banned-claims and claim-anchors gates exit 0.
- The full non-e2e suite shows only the 21 baseline failures, and the total is 10741 (rose by 7).
- One `fix(quick-261031-oxi):` commit holds the three files, and one `docs(quick-261031-oxi):` commit holds CHANGELOG.md alone. docs/audit/28-prepass-evidence.md is still modified and unstaged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| receiving role -> shared notes -> Tech Lead | An agent-written `Resolved:` note, and the diff behind it, decide whether the ticket returns to development |
| named human -> approval `finding` -> proposing role | Only a recorded human approval lets a fundamental change stand |
| board and queue -> Orchestrator | A ticket nobody queues, or that is parked with no way to resume, stalls with no owner acting |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qoxi-01 | Elevation of privilege | WF04 step 17, a fundamental change made without approval | high | mitigate | Defect 3: the check reads "the diff behind every `Resolved:` note" at the step 2 re-plan. An unapproved fundamental change returns to `Blocked`, and the Orchestrator queues its maker to revert it. Pinned by case (u) |
| T-qoxi-02 | Spoofing | `Resolved:` answer claiming an approved change | medium | mitigate | Defect 1: only a note that names the approval `finding` passes. That finding is the `Confirmed: yes` record stamped `human:<name>` by the existing step 15 confirmation rules. Pinned by case (s) |
| T-qoxi-03 | Denial of service | Loop that re-blocks an approved change, an unqueued Tech Lead, a ticket parked forever at `notify`/`off`, or an ambiguous ceiling | medium | mitigate | Defects 1, 5, 6, 7: approved changes pass, both hand-backs are recorded and count toward no limit, the human stop resumes once a human answers, the ceiling stops before a fourth hand-off, and the Orchestrator queues the Tech Lead after the first block and after `Resolved:`. Pinned by cases (s), (w), (x), (y) and edited (r) |
| T-qoxi-04 | Tampering | Hard human gates (checkpoint tags, stop bullets, hooks, checkpoints.*) | high | mitigate | No tag, stop bullet, hook or checkpoints.* change. Each task's verify asserts 2 tags and an empty diff on checkpoints.ts, checkpoints.js and hooks/ from 1ee3007b; cases (x) and (g) assert 6 stop bullets |
| T-qoxi-SC | Tampering | npm/pip/cargo installs | high | accept | No package is installed or added by this plan |
</threat_model>

<verification>
- Cases (s)-(y) pass. The edited pins (g), (q), (r), 39-18 (d) and (e), and the tech-lead D-21 case pass. Every other tier-kit-text case passes unedited.
- The lexicon, foundation guards, structure validator, kit-refs, claim-anchors, public-docs, banned-claims and freshness gates all exit 0. check-diff-disposition is back at the recorded 721.
- WF04 has 2 `checkpoint: ` tags and 6 stop bullets. tech-lead.md is under 3786 B (3773 B expected). checkpoints.ts, checkpoints.js and hooks/ are unchanged.
- The full non-e2e suite shows only the 21 recorded failures, and the total rose by 7.
- Defect coverage:
  - 1: Task 2 (step 15 RECORD_BACK, step 17 APPROVED and TREAT_NEW, config).
  - 2: Task 2 (step 15 REJECT and WITHOUT, config).
  - 3: Task 2 (step 17 CHECK_NEW, TREAT_NEW and REVERT).
  - 4: Task 3 (step 17 RAISE_ONE and RAISE_PAST).
  - 5: Task 2 (step 15 RESUME, step 16 WAIT, the used-up stop, tech-lead.md, config).
  - 6: Task 1 (WF04 two places, tech-lead.md, config three places, test (r)).
  - 7: Task 3 (steps 14, 15 and 17).
  - All seven also land in the CHANGELOG (Task 3).
</verification>

<success_criteria>
- Each of the 7 defects is closed in the kit text by the fix direction in 261031-oxi-CONTEXT.md and pinned by a test case.
- D1-D3 still hold: fundamental changes are proposals until a named human approves, every cause carries a `Cause-id:`, the ceiling reaches the human stop, and the Tech Lead is queued after `Disputed:`/`Fundamental:`.
- No hard human gate, checkpoint count, config key, default or role ceiling moved.
</success_criteria>

<output>
Create `.planning/quick/261031-oxi-close-the-7-wf04-hand-off-loop-defects-f/261031-oxi-SUMMARY.md` when done. Include:
- the RED and GREEN transcripts for every task
- the commit short shas
- every sentence the lexicon or a guard made you shorten, with the reason
- the disposition counts before and after each task
- the tech-lead.md byte count
- the full-suite failures listed by file against the baseline
- a defect-to-sentence table naming the sentence that carries each fix
- the three CONTEXT nits, listed as still open (no edited sentence contained them)
</output>
