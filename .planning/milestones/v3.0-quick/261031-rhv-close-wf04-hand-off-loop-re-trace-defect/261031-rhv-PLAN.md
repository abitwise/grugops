---
phase: quick-261031-rhv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/config/factory.config.md
  - scripts/tier-kit-text.test.ts
  - docs/audit/29-style-dispositions/quick-261031-rhv.md
  - CHANGELOG.md
autonomous: true
requirements: [TIER-04, RHV-R1, RHV-R2, RHV-R3, RHV-R4]

estimate:
  tokens: 110000
  raw_tokens: 110000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "R1: the revert path is a recorded hand-off. Step 17 says 'A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`.', 'Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change.', 'Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change.' and 'That hand-off counts like any other, and step 16 dispatches it.' The bare Orchestrator revert-queue sentence is gone, so a repeated catch-and-revert reaches the human stop before a fourth hand-off on one ticket."
    - "R2: the grugops Orchestrator wakes the Tech Lead at every value. The human-stop sub-bullet says 'At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human.' and 'The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15.', placed after the approve-or-reject ask and before 'On approval, ...'. The step 15 lead reads 'When an answer note queued the Tech Lead, read that note too.' The config paragraph says the same under every value."
    - "R3: the hand-back carries the verdict. The move-record sub-bullet says 'After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human.' Step 17 says 'Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`.' and 'When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules.' The step 2 check passes a fundamental change only on an `Approved:` note."
    - "R4: one rule everywhere. A raise past the spent escalation is a human-stop trigger in WF04 step 15, the used-up stop, tech-lead.md `## Hard limits`, the config roster row, the config `## Stop conditions` bullet and the config `block` sub-bullet. It is no longer part of 'used up' anywhere; 'used up' keeps 'more than one level while the escalation is unspent'. Step 17 adds 'It publishes no plan note naming the raised level before the human answers.'"
    - "Nothing else moves. WF04 keeps 2 `checkpoint: ` tags and 6 `## Stop conditions` bullets. The step 15 lead sentence 'Read the `failed-attempt` note (Tech Lead).' and step 16 are byte-unchanged, and the human-stop sub-bullet still ends with the defect 5 resume sentence. scripts/checkpoints.ts, scripts/checkpoints.js and hooks/ are byte-unchanged. No config key, default or ROLE_CEILINGS value changes. tech-lead.md is 3776 B (under 3786). check-diff-disposition is back at 721, and the full non-e2e suite shows only the 21 recorded failures, with 4 more tests than before (10745)."
  artifacts:
    - path: agent-factory/workflows/04-ticket-to-pr.md
      provides: "Steps 15 and 17 and the used-up stop, with the four re-trace fixes"
      contains: "That hand-off counts like any other, and step 16 dispatches it."
    - path: agent-factory/roles/tech-lead.md
      provides: "`## Hard limits` naming the second escalation as a human-stop trigger"
      contains: "Stop the same way before a second escalation."
    - path: agent-factory/config/factory.config.md
      provides: "The escalate roster row and paragraph match R2 and R4"
      contains: "Under every value, once a human answers at the human stop, the Orchestrator records the answer in a `decision` note and queues the Tech Lead."
    - path: scripts/tier-kit-text.test.ts
      provides: "New cases (z), (aa), (ab), (ac) at the end of the G-39-71 describe, plus the re-pinned D-21 amended, WR-01, 39-18 (e), (a), (g), (q), (s), (u) and (y) cases"
      contains: "261031-rhv"
    - path: docs/audit/29-style-dispositions/quick-261031-rhv.md
      provides: "One disposition row per clause the gate names, with companion cells in the two FROZEN sections"
      contains: "## Dispositions"
    - path: CHANGELOG.md
      provides: "The [Unreleased] Workflow 04 bullets describe the final loop"
      contains: "`Rejected:`"
  key_links:
    - from: "WF04 step 17 `Resolved:` check at the step 2 re-plan"
      to: "WF04 step 15 hand-off, the per-ticket ceiling, and step 16"
      via: "a recorded `Move: hand-off` note to the role that made the change"
      pattern: "applies the hand-off to the role that made the change"
    - from: "WF04 step 15 human stop (a human answers, any value)"
      to: "WF04 step 15 move record, confirmation and step 16"
      via: "the Orchestrator's `decision` note recording the answer, and a `pending/` subtask for the Tech Lead"
      pattern: "who reads that note at step 15"
    - from: "WF04 step 15 move record after a `Fundamental:` proposal"
      to: "WF04 step 17 receiving role and the step 2 check"
      via: "an `Approved:` or `Rejected:` line naming the human"
      pattern: "naming the hand-off note that carries `Approved:`"
    - from: "WF04 step 15 human-stop triggers"
      to: "the used-up stop, tech-lead.md `## Hard limits`, and the config row and paragraph"
      via: "one wording of the raise past the spent escalation as a stop trigger"
      pattern: "when the scores call for a raise past the spent escalation"
---

<objective>
Close the four defects R1-R4 that the second first-time-reader scenario re-trace of the Workflow 04
hand-off loop found on 2026-10-31 after quick task 261031-oxi (HEAD 4f6cacea). The human decision
(Olger Oeselg, 2026-10-31) is locked: "Fix all 4, then close. R2: grugops orchestrator is the one who
notifies tech lead." Every defect and its fix direction is in 261031-rhv-CONTEXT.md. Design rule from
the CONTEXT: route every new case through a recorded `decision` note and the existing hand-off /
human-stop / step 16 dispatch path, add no new mechanism, note type or counter, keep D1-D3 and the
261031-oxi fixes intact, and use the smallest text that closes each defect.

Purpose: the revert path records a hand-off and wakes the role. A human's answer wakes the Tech Lead
at every value. The hand-back says whether the human approved or rejected. A raise past the spent
escalation has one rule in every place.

Output: edited WF04, tech-lead.md and factory.config.md; 4 new test cases and 9 re-pinned cases; a new
disposition file; CHANGELOG `[Unreleased]` text. Defect-to-case map: R1 (z), R2 (aa), R3 (ab), R4 (ac).

The planner gives every sentence verbatim. It applied all of them to a scratch copy of HEAD 4f6cacea
and ran the gates there:
- `npx vitest run scripts/tier-kit-text.test.ts`: Task 1 RED `Tests 6 failed | 143 passed (149)`,
  GREEN `149 passed`; Task 2 RED `Tests 7 failed | 145 passed (152)`, GREEN `152 passed`.
- The 7-file targeted run: `Tests 481 passed (481)` (477 at HEAD, plus 4).
- check-imperative-lexicon, check-foundation-guards (tech-lead.md `PASS ... 3776B within ceiling`),
  validate-agent-factory, check-kit-refs, freshness:adapters, freshness:catalog, check:public-docs,
  check-banned-claims and check:claim-anchors all exit 0.
- Word counts by the lexicon's own `countWords`: every new `## Steps` sentence is 19 words or fewer
  (longest 19: the R1 "Otherwise ..." sentence); the two new `## Stop conditions` sentences are 16 and
  15, under the descriptive bound of 25. No sentence has a modal, opens with a bare demonstrative, or
  opens with an approved verb and chains a second one.
- Each anchor below occurs exactly once in its file, and every new literal prints 0 at HEAD in WF04,
  tech-lead.md, factory.config.md and CHANGELOG.md.
- check-diff-disposition was not run on the scratch copy (it needs git); the clause counts below are
  estimates and the gate output is the authority.

Choices the planner made, with the reason:
- R4, "used up" keeps "more than one level while the escalation is unspent". Removing only the
  raise phrase would leave a ticket whose escalation is spent and whose scores call for two levels
  under both rules (hand-off by "more than one level", human stop by "a raise past the spent
  escalation"), which is R4's contradiction again. The qualifier makes the two rules disjoint.
- R4, tech-lead.md: the role takes the trigger. "Never escalate a ticket twice on your own." is
  replaced by "Stop the same way before a second escalation.", placed before "Stop the same way
  before a fourth hand-off on one ticket." The old sentence already meant "a second escalation needs
  a human" (39-19); the new one states it as the stop, in the trigger list, as the CONTEXT asks. It
  goes before the fourth-hand-off sentence so "leave it" in the next sentence still refers to the
  ticket. 3773 B to 3776 B, 10 B under WARN 3786. The alternative rewording "Never escalate a ticket
  twice without a named human." would also fit (3783 B) but keeps the trigger outside the list.
- R2 applies at `block` too (the check the CONTEXT asked for): at `block` the Tech Lead stops and ends
  its run, and nothing queued it again when the human answered. The two R2 sentences open "At every
  value" and sit between the asks and the approval branch, so the defect 5 resume sentence stays the
  sub-bullet's last sentence and case (w) stays unedited. The step 15 lead's second sentence is
  generalised from "a step 17 answer" to "an answer note", so the Tech Lead is told to read the human's
  answer note too (the same gap 261031-oxi defect 7 closed for step 17 answers).
- R3: the verdict line goes in the move-record sub-bullet, where every note line is defined. It
  applies to any move recorded after the human rules on a `Fundamental:` proposal, so a rejection
  with a human-named move carries `Rejected:` as well. The step 15 confirmation already shows the
  human the move note, so the human sees the verdict line before the `Confirmed: yes` finding.
- R1 says "applies the hand-off", in the same shape as the existing "applies the human stop". The
  step 15 hand-off sub-bullet then supplies the `## Blocked` owner bullet and the per-cause limit, the
  human-stop sub-bullet supplies "before a fourth hand-off on one ticket", and the move record supplies
  `To:`. The reason line is the stated cause the receiving role reads at step 17.

Kept as they are:
- WF04 keeps 2 `checkpoint: ` tags and 6 stop bullets. No fix needs a new stop; the only stop-bullet
  edits are inside the used-up bullet (one reworded sentence, one added), and the defect 5 park
  sentence stays last before the tag.
- Step 15's lead sentence "Read the `failed-attempt` note (Tech Lead)." stays byte for byte (nine test
  sites use it as a prefix). Step 16 is unchanged: its hold and wait sentences already cover R1 and R2.
- The CONTEXT nit "one" antecedent at :45 stays open: neither "A receiving role writes one per step
  17." nor "Record one when ..." is edited.

Planner trace of each fix through the edited text (scratch copy):
- R1: role X answers `Resolved:` with an unapproved fundamental change. The Orchestrator queues the
  Tech Lead at step 2. The check finds no `Approved:` note, so the Tech Lead returns the ticket to
  `Blocked` and applies the hand-off to X. Before that, the human stop applies instead if it would be
  the fourth hand-off on the ticket. The `Move: hand-off` note carries `To:` X, the same `Cause-id:` and
  the revert reason; the board keeps `Blocked` with X as owner; step 16 dispatches X. X then answers per
  step 17: `Resolved:` (revert) passes the check; `Disputed:` counts a round; `Fundamental:` goes to the
  human stop. A repeat catch counts again, so the agent loop ends at the per-ticket ceiling. Past that,
  every further cycle needs a human decision.
- R2: at `block` the Tech Lead stops with a human as `## Blocked` owner. The human answers the
  Orchestrator, which records the answer in a `decision` note naming the human and queues the Tech
  Lead. The Tech Lead reads it at step 15, records the move with `Stop: human` (and the verdict line
  after a `Fundamental:` proposal) and records the `Confirmed: yes` finding. Step 16 finds the finding
  and dispatches. At `notify`/`off` the same two sentences apply ("At every value"), then the resume
  sentence and the step 16 wait. The Orchestrator's note carries no `Move:` line and opens with none of
  `Resolved:`/`Disputed:`/`Fundamental:`, so no move, round or check counts it.
- R3: approval: the hand-back carries `Approved:` naming the human; the role makes the change and
  answers `Resolved:` naming that note; the step 2 check passes. Rejection: the hand-back (or the
  human-named move) carries `Rejected:`; the role fixes within the current rules. A fundamental change
  named against a `Rejected:` note fails the check and takes the R1 hand-off, which counts.
- R4: escalation spent and scores call for any raise, at step 15 or at the step 2 re-plan: human stop
  (one rule in all six places). Escalation unspent and scores call for two or more levels: used up,
  hand-off (39-19, unchanged). At the re-plan no plan note names the raised level before the human
  answers, so step 3 does not pull. After the answer, the move note carries the human's level (step 17
  already says to record a level raise in that plan as `Move: escalate`). Step 16 then dispatches after
  the `Confirmed: yes` finding.
- Seen and left, all already in the text and outside R1-R4 (report them in the SUMMARY for the
  re-trace): (1) the gate-failure stop at `exhaust_self_fix_budget: block` asks a human to confirm a
  recorded move, and the text does not say who queues the Tech Lead to record that `Confirmed:`
  finding; (2) the double confirmation (CONTEXT nit): if "show the human the move note" is read as a
  second answer, the R2 sentences cover it only by reading; (3) the step 16 `Cause: gate` hold could be
  read to cover any later hand-off on a cause first raised by a `Cause: gate` note, the R1 hand-off
  included.

Out of scope (CONTEXT): the remaining re-trace nits (the `Level:` line on an approve/reject answer,
which human is named at `notify`/`off`, the double confirmation, step 17 omitting `Fundamental:`, TL:35
`## Blocked` versus the column, the Board-moves table, the two routes to the Architect, `Resolved:`
carrying no `Cause-id:`, the `## Blocked` bullet after `Resolved:`), the "apply elsewhere" follow-up,
WR/IN findings, Workflows 09/16/18, other roles, the 261031-oxi disposition file (its rows for
reworded clauses simply stop matching; the gate reports no finding for an unused row).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.planning/quick/261031-rhv-close-wf04-hand-off-loop-re-trace-defect/261031-rhv-CONTEXT.md

Read by line range only:
- `.planning/quick/261031-oxi-close-the-7-wf04-hand-off-loop-defects-f/261031-oxi-SUMMARY.md` (gate counts, full-suite baseline and failure list)
- `agent-factory/workflows/04-ticket-to-pr.md` lines 42-51 (steps 15-17) and 70 (the used-up stop)
- `agent-factory/roles/tech-lead.md` line 49 (`## Hard limits`; 3773 B at HEAD, ROLE_CEILINGS FAIL 4000 / WARN 3786, WARN fires at >= 3786)
- `agent-factory/config/factory.config.md` lines 213 and 216-224 (escalate roster row and paragraph)
- `scripts/tier-kit-text.test.ts` lines 271-285 (tech-lead D-21 amended case), 686-731 (WF04 WR-01 case), 1355-1369 (39-18 (e)), 1388-1862 (the G-39-71 describe, (a)-(y), to end of file)
- `docs/audit/29-style-dispositions/quick-261031-oxi.md` (header and row shape, the companion-cell form)
- `CHANGELOG.md` lines 66-82 (`[Unreleased]` `### Changed`, the two Workflow 04 bullets)

Facts the planner measured at HEAD 4f6cacea:
- `node scripts/check-diff-disposition.js` prints `721 finding(s) over 42 elements`, the recorded pre-existing red. Base commit `4d2b8f079cc43d7d6184729966492789fb4dc05e` (00-base.md); never move it. tech-lead.md does not exist at the base commit, so removing one of its sentences creates no removed-clause finding.
- `grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l` prints 2; `## Stop conditions` holds 6 bullets.
- `npx vitest run scripts/tier-kit-text.test.ts` prints `Tests 148 passed (148)`. The 7-file targeted run (see verify) prints 477.
- Lexicon (scripts/check-imperative-lexicon.ts) governs WF04 only of the three kit files (roles/ and factory.config.md are excluded by name). In `## Steps` a sentence counts at most 20 words (backticks unwrapped; "Tech Lead" and "Orchestrator" are Technical Names, one word each) and uses no modal. A sentence that opens with an approved verb (for example Apply, Hand, Record or Read) must not chain "and"/"then" plus a second approved verb. No sentence opens with this/that/these/those followed by a copula, modal or auxiliary. `## Stop conditions` sentences take the descriptive bound of 25.
- Test N2 (factory.config.md `checkpoints` wording) requires every step 15 sentence that opens "At `notify`," (comma right after) to name `observation`. No new sentence opens that way.
- WF04 `## Stop conditions` and tech-lead.md `## Hard limits` are FROZEN by heading in the disposition contract. factory.config.md, CHANGELOG.md and the test file are not watched.
- The full non-e2e suite after 261031-oxi was `Tests 21 failed | 10718 passed | 2 skipped (10741)`. Only `.planning/` files changed since.

Project rules for every executor of this plan:
- Never stage, commit, revert or edit `docs/audit/28-prepass-evidence.md`. Never touch the untracked `~/` directory. Stage with path-specific `git add <path>` only.
- Never use `npm test`. Run `npx vitest run <explicit files>` in the foreground. The full non-e2e suite in Task 3 runs in the background.
- Never add, remove or move a `checkpoint:` tag or a `## Stop conditions` bullet. Never edit scripts/checkpoints.ts, scripts/checkpoints.js or hooks/. Never raise a ROLE_CEILINGS value or move the disposition base commit.
- Edit an existing test case only where this plan names it; each such edit gets a comment naming quick task 261031-rhv, the defect (R1-R4) and "Olger Oeselg, 2026-10-31". New cases carry the same comment. Keep the G-39-71 describe in letter order: (a)-(y), then (z), (aa), (ab), (ac).
- If the lexicon or a guard refuses a sentence below, shorten it within the rules and keep its meaning. Update its test literal in the same commit and record the change in the SUMMARY.
- Commit subjects start `fix(quick-261031-rhv):` or `docs(quick-261031-rhv):` and end with the attribution trailer from the session.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: R4 end to end: a raise past the spent escalation applies the human stop in all six places, the pins, the new disposition file, the gates and a commit</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/config/factory.config.md, docs/audit/29-style-dispositions/quick-261031-rhv.md</files>
  <behavior>
    - Edited pins (each with a quick 261031-rhv R4 comment):
      - tech-lead describe, "D-21 amended" case: the assertion on "Never escalate a ticket twice on your own." becomes `toContain("Stop the same way before a second escalation.")`. Retitle the case "D-21 amended: a second escalation stops for a named human, a used-up ticket goes to the resolving role, and three disputed rounds stop for a named human".
      - WF04 escalation-path describe, "WR-01" case: the hand-off sentence becomes "Used up also covers scores calling for more than one level while the escalation is unspent." and the used-up sentence becomes "It also means the scores call for more than one level while the escalation is unspent.".
      - 39-18 (e): the "Never escalate ..." assertion becomes `toContain("Stop the same way before a second escalation.")`.
      - G-39-71 (a): the hand-off sentence becomes "Used up also covers scores calling for more than one level while the escalation is unspent.".
      - G-39-71 (g): the used-up sentence becomes "It also means the scores call for more than one level while the escalation is unspent.".
    - New (ac), titled "(ac) R4: a raise past the spent escalation applies the human stop everywhere, and no plan note names that level first (quick 261031-rhv)", at the end of the G-39-71 describe. Reuse subAt, stepAt, STEP17, holdsAll, usedUp, stops, section, TECH_LEAD, CONFIG, escalateParagraph and WF04:
      - `subAt("Apply the hand-off.")` holds "Used up also covers scores calling for more than one level while the escalation is unspent.".
      - `subAt("Apply the human stop.")` holds CEILING = "Apply it also before a fourth hand-off on one ticket.", RAISE_TRIGGER = "Apply it also when the scores call for a raise past the spent escalation." and ROUND = "A round is a `Disputed:` `decision` note naming a hand-off note for the same cause.", in the order CEILING < RAISE_TRIGGER < ROUND.
      - WF04 `not.toContain("or for a raise")`.
      - Step 17 holds RAISE_PAST = "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop.", NO_PLAN = "It publishes no plan note naming the raised level before the human answers." and OWNER = "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again.", in the order RAISE_PAST < NO_PLAN < OWNER.
      - `usedUp().slice("- ".length)` holds "It also means the scores call for more than one level while the escalation is unspent.", STOP_CEILING = "The same stop applies before a fourth hand-off on one ticket." and STOP_RAISE = "The same stop applies when the scores call for a raise past the spent escalation.", with STOP_CEILING < STOP_RAISE.
      - `section(TECH_LEAD, "Hard limits")` holds SECOND = "Stop the same way before a second escalation." and FOURTH = "Stop the same way before a fourth hand-off on one ticket.", with SECOND < FOURTH, and `not.toContain("Never escalate a ticket twice on your own.")`.
      - The one CONFIG line starting "| `escalate_unadjudicable_result` |" contains ", or whose scores call for a raise past the spent escalation.".
      - `escalateParagraph()` contains "or the scores call for more than one level while the escalation is unspent.", "The same holds when the scores call for a raise past the spent escalation." and "It stops the same way when the scores call for a raise past the spent escalation.".
      - CONFIG `not.toContain("or for a raise after the escalation is spent")`.
      - WF04 still has 2 `checkpoint: ` tags, and `stops` still has length 6.
  </behavior>
  <action>
This task carries R4, the one fix that touches every layer: WF04 step 15, step 17 and the FROZEN used-up stop, the FROZEN tech-lead.md `## Hard limits`, the config row and paragraph, the text checks, the lexicon, the size ceiling, the disposition gate and a commit.

1. RED. In scripts/tier-kit-text.test.ts make the five pin edits and add case (ac) exactly as the behavior block says, per R4. Run `npx vitest run scripts/tier-kit-text.test.ts`. Expect `Tests 6 failed | 143 passed (149)`: the D-21 amended case, WR-01, 39-18 (e), (a), (g) and (ac), each on a missing sentence. Keep the transcript for the SUMMARY.

2. GREEN, per R4. Make each edit exactly once at the anchor named; every other byte stays unchanged.
   - agent-factory/workflows/04-ticket-to-pr.md:
     - Step 15 hand-off sub-bullet: replace "Used up also covers scores calling for more than one level, or for a raise past the spent escalation." with "Used up also covers scores calling for more than one level while the escalation is unspent."
     - Step 15 human-stop sub-bullet: right after "Apply it also before a fourth hand-off on one ticket." insert "Apply it also when the scores call for a raise past the spent escalation."
     - Step 17: right after "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop." insert "It publishes no plan note naming the raised level before the human answers."
     - `## Stop conditions` used-up bullet (FROZEN): replace "It also means the scores call for more than one level, or for a raise after the escalation is spent." with "It also means the scores call for more than one level while the escalation is unspent." Then, right after "The same stop applies before a fourth hand-off on one ticket.", insert "The same stop applies when the scores call for a raise past the spent escalation." The defect 5 park sentence stays the last sentence before the `checkpoint: escalate_unadjudicable_result` tag.
   - agent-factory/roles/tech-lead.md `## Hard limits` (FROZEN): delete the sentence "Never escalate a ticket twice on your own." together with the one space after it. Then, right before "Stop the same way before a fourth hand-off on one ticket.", insert "Stop the same way before a second escalation." followed by one space. That is the only tech-lead.md change; the file goes from 3773 B to 3776 B.
   - agent-factory/config/factory.config.md:
     - Roster row: replace "or whose fix changes a requirement or a rule fundamentally. See *What" with "or whose fix changes a requirement or a rule fundamentally, or whose scores call for a raise past the spent escalation. See *What".
     - "Workflow 04, `## Stop conditions`" bullet: replace "or the scores call for more than one level, or for a raise after the escalation is spent." with "or the scores call for more than one level while the escalation is unspent." Then, right after "The same holds before a fourth hand-off on one ticket.", insert "The same holds when the scores call for a raise past the spent escalation."
     - `block` sub-bullet: right after its first sentence ("`block`, the default: the Tech Lead stops for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally.") insert "It stops the same way when the scores call for a raise past the spent escalation."
     - Keep every sentence that cases (k), (l), (q), (r), (t), (w), (x), E3 and E4 pin byte for byte.
   - Re-run the test file. Expect `Tests 149 passed (149)`.

3. Gates:
   - `npm run build` and `npm run typecheck`
   - `node scripts/check-imperative-lexicon.js` and `node scripts/check-foundation-guards.js` (tech-lead.md shows PASS at 3776 B, no WARN line for it)
   - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and `node scripts/check-kit-refs.js`
   - `npm run check:claim-anchors`, `npm run freshness:adapters`, `npm run freshness:catalog` and `npm run freshness`

4. Disposition. Run `node scripts/check-diff-disposition.js`; it names the new clauses that have no row (planner estimate: 6, so 727). Create docs/audit/29-style-dispositions/quick-261031-rhv.md in the quick-261031-oxi.md shape:
   - A title naming quick task 261031-rhv and the Workflow 04 hand-off loop (four re-trace defects).
   - The source: the second first-time-reader scenario re-trace of WF04 steps 14-17, `## Stop conditions`, tech-lead.md and the config text, run 2026-10-31 after quick task 261031-oxi (HEAD 4f6cacea). Say it edits two watched documents (WF04 steps 15 and 17 and the used-up bullet; tech-lead.md `## Hard limits`) and factory.config.md, which the gate does not watch.
   - The human decision quoted verbatim: "Fix all 4, then close. R2: grugops orchestrator is the one who notifies tech lead." (Olger Oeselg, 2026-10-31), and one line per defect R1-R4 taken from the CONTEXT headings.
   - A note that the work falls outside the four-round Phase 39 gap cap, as a human direction.
   - The base commit `4d2b8f079cc43d7d6184729966492789fb4dc05e`, read from 00-base.md and not moved.
   - A running before/after count sentence, which Task 2 extends.
   - The sentence that WF04 `## Stop conditions` and tech-lead.md `## Hard limits` are FROZEN by heading and every row in them carries a companion cell.
   - A `## Dispositions` table with seven columns: file, line, before, after, rule, disposition, companion.

   Write the rows:
   - One row per clause the gate names. Copy each clause into `after` exactly as the gate splits it.
   - For a reworded sentence, put the replaced HEAD sentence in `before`. Use `—` for a new sentence. If the gate names a removed clause, put it in `before` and `—` in `after`.
   - The rule cell is `quick 261031-rhv R4`.
   - The disposition cell is a full sentence saying what the clause closes.
   - Companion `—`, except in the two FROZEN sections:
     - WF04 `## Stop conditions` rows take "FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-rhv R4 (Olger Oeselg 2026-10-31), a raise past the spent escalation applies the human stop rather than the hand-off, so the used-up bullet lists it as a stop trigger and keeps only the multi-level scores while the escalation is unspent; no stop is added or removed and no checkpoint count moves."
     - tech-lead.md `## Hard limits` rows take "FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-rhv R4 (Olger Oeselg 2026-10-31), the Tech Lead stops for a named human before a second escalation, which states the former own-moves limit on escalating twice as the stop; no stop is added or removed and no checkpoint count moves."
   - Never put a pipe character inside a cell.

   Re-run until the gate prints exactly `721 finding(s)`.

5. Commit the five files, path-specific, as `fix(quick-261031-rhv): a raise past the spent escalation applies the human stop everywhere, and no plan note names that level first (R4)`. Then re-run this task's `<verify>` end to end. Task 2 starts only when it passes.
  </action>
  <verify>
    <automated>npm run build && npm run typecheck && npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts</automated>
    <automated>node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-kit-refs.js && npm run check:claim-anchors && npm run freshness:adapters && npm run freshness:catalog && npm run freshness</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>test "$(wc -c < agent-factory/roles/tech-lead.md)" -lt 3786 && test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && test "$(grep -oF 'while the escalation is unspent' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && test "$(grep -oF 'when the scores call for a raise past the spent escalation' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && test "$(grep -oF 'when the scores call for a raise past the spent escalation' agent-factory/config/factory.config.md | wc -l)" -eq 2 && grep -qF 'It publishes no plan note naming the raised level before the human answers.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'Stop the same way before a second escalation.' agent-factory/roles/tech-lead.md && grep -qF 'or whose scores call for a raise past the spent escalation.' agent-factory/config/factory.config.md && git diff --quiet 4f6cacea -- scripts/checkpoints.ts scripts/checkpoints.js hooks</automated>
  </verify>
  <done>
- The five edited pins and (ac) went RED for missing sentences (`6 failed | 143 passed (149)`), then GREEN (`149 passed`). Every other tier-kit-text case passes unedited.
- Match counts (baseline 0 for each at HEAD 4f6cacea): "while the escalation is unspent" 2 in WF04; "when the scores call for a raise past the spent escalation" 2 in WF04 and 2 in factory.config.md; the step 17 no-plan sentence, the tech-lead.md second-escalation sentence and the roster-row phrase are each found. Case (ac) proves the old raise wording is gone from WF04, tech-lead.md and the config.
- tech-lead.md is 3776 B with no WARN line. WF04 keeps 2 `checkpoint: ` matches and 6 stop bullets. checkpoints.ts, checkpoints.js and hooks/ show no diff from 4f6cacea.
- check-diff-disposition prints 721. quick-261031-rhv.md exists with at least one row in each FROZEN section, each carrying its companion cell (baseline: file absent).
- One `fix(quick-261031-rhv):` commit holds exactly the five files.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: R1, R2 and R3: the revert is a recorded hand-off, the Orchestrator wakes the Tech Lead once a human answers, and the hand-back carries Approved: or Rejected:</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/config/factory.config.md, docs/audit/29-style-dispositions/quick-261031-rhv.md</files>
  <behavior>
    - Constants used below (the existing shared ones in the G-39-71 describe keep their names):
      - PASS_RULE = "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`."
      - APPROVED_NOTE = "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`."
      - REVERT_HANDOFF = "Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change."
      - READ_ANY = "When an answer note queued the Tech Lead, read that note too."
    - Edited pins (each with a quick 261031-rhv comment naming the defect):
      - (q): its TREAT constant becomes PASS_RULE (R3); its order assertions stay.
      - The shared TREAT_NEW constant becomes PASS_RULE (R3), which (s) and (u) use.
      - (s): its APPROVED constant becomes APPROVED_NOTE (R3); retitle it "(s) defect 1: an approved fundamental change names the `Approved:` hand-off note and passes the check (quick 261031-oxi; wording per quick 261031-rhv R3)".
      - (u): its REVERT constant becomes REVERT_HANDOFF (R1); its order assertions stay.
      - (y): its READ_ANSWER constant becomes READ_ANY (R2); its other assertions stay, including the lead line not containing "named human".
    - New (z), R1, titled "(z) R1: an unapproved fundamental change goes back through a recorded hand-off that counts like any other (quick 261031-rhv)":
      - Step 17 holds CHECK_NEW, TREAT_NEW, REVERT_HANDOFF, REVERT_NOTE = "Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change.", REVERT_COUNTS = "That hand-off counts like any other, and step 16 dispatches it." and RESOLVED_MOVE, in that order.
      - Step 17 `not.toContain("subtask for the role that made the change")`.
      - `subAt("Apply the hand-off.")` holds "Add a `## Blocked` bullet naming that role as the owner who clears it.".
      - `subAt("Apply the human stop.")` holds "Apply it also before a fourth hand-off on one ticket." and RECORD_BACK.
      - `stepAt(STEP16).text` holds "For a hand-off, take the adapter of the role on the `To:` line.".
    - New (aa), R2, titled "(aa) R2: once a human answers the human stop, the Orchestrator records the answer and queues the Tech Lead at every value (quick 261031-rhv)":
      - The human-stop sub-bullet holds APPROVE = "After a `Fundamental:` note, ask the human to approve or reject the proposed change.", RECORD_ANSWER = "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human.", QUEUE_ANSWER = "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15." and HAND_BACK, in that order.
      - The human-stop sub-bullet still `endsWith` "At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16.".
      - `stepAt(STEP15).text` holds READ_ANY.
      - `escalateParagraph()` contains "Under every value, once a human answers at the human stop, the Orchestrator records the answer in a `decision` note and queues the Tech Lead.".
    - New (ab), R3, titled "(ab) R3: the move note carries the human's `Approved:` or `Rejected:` verdict, and the receiving role acts on it (quick 261031-rhv)":
      - `subAt("Record the move in a new \`decision\` note per Workflow 16.")` holds STOP_LINE = "Put the line `Stop: human` under the `Move:` line when the human stop applied." and VERDICT = "After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human.", with STOP_LINE < VERDICT.
      - Step 17 holds PROPOSE, APPROVED_NOTE, REJECTED_NOTE = "When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules.", DEFINITION and TREAT_NEW, in that order.
      - WF04 `not.toContain("approval \`finding\`")`.
    - Order: (z), (aa) and (ab) go after (y) and before (ac).
  </behavior>
  <action>
1. RED. In scripts/tier-kit-text.test.ts make the five pin edits and add cases (z), (aa) and (ab) as the behavior block says. Reuse subAt, stepAt, STEP15, STEP16, STEP17, holdsAll, escalateParagraph, WF04 and the shared constants, and use indexOf comparisons for each order. Run `npx vitest run scripts/tier-kit-text.test.ts`. Expect `Tests 7 failed | 145 passed (152)`: (q), (s), (u), (y), (z), (aa) and (ab), each on a missing sentence. Keep the transcript.

2. GREEN in agent-factory/workflows/04-ticket-to-pr.md. Each anchor occurs once.
   - Step 15 lead line, R2: replace "When a step 17 answer queued the Tech Lead, read that answer note too." with "When an answer note queued the Tech Lead, read that note too." The lead sentence "Read the `failed-attempt` note (Tech Lead)." stays byte for byte.
   - Step 15 human-stop sub-bullet, R2 (per the human's direction that the grugops Orchestrator notifies the Tech Lead): right after "After a `Fundamental:` note, ask the human to approve or reject the proposed change." insert "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human." and then "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15." Both sit before "On approval, hand the ticket back to the proposing role to make the change." Do not append anything after the sub-bullet's last sentence.
   - Step 15 move-record sub-bullet, R3: right after "Put the line `Stop: human` under the `Move:` line when the human stop applied." insert "After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human."
   - Step 17, R3: replace "Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`." with "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`." Right after it insert "When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules."
   - Step 17, R3: replace "It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`." with "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`."
   - Step 17, R1: replace the sentence "The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it." with, in order: "Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change." then "Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change." then "That hand-off counts like any other, and step 16 dispatches it." The D3 queue sentence at the end of step 17 and the step 17 `Resolved:` queue sentence stay unchanged.
   - Change no other sentence. Step 16 stays byte for byte.

3. agent-factory/config/factory.config.md, R2: in the "Workflow 04 step 15, the Tech Lead's hand-off and human stop." bullet, right after "...and the Tech Lead checks every `Resolved:` note against that definition." insert "Under every value, once a human answers at the human stop, the Orchestrator records the answer in a `decision` note and queues the Tech Lead." It stays before "The used-up stop above follows the same value:". Keep every sentence that cases (k), (l), (q), (t), (w), (x), (ac), E3 and E4 pin byte for byte. tech-lead.md is not touched in this task.

4. Re-run the test file. Expect `Tests 152 passed (152)`. Run every Task 1 gate. Then run `node scripts/check-diff-disposition.js` (planner estimate: 10 new clauses, so 731) and append one row per newly named clause to quick-261031-rhv.md:
   - Rule cell `quick 261031-rhv R1`, `R2` or `R3`.
   - For a reworded sentence, put the HEAD sentence in `before`; `—` for a new one.
   - Companion `—` (no FROZEN section is touched in this task).
   - Extend the header's count sentence to its final form.
   - Re-run until the gate prints exactly `721 finding(s)`.

5. Commit the four files, path-specific, as `fix(quick-261031-rhv): the revert is a recorded hand-off, the Orchestrator queues the Tech Lead once a human answers, and the hand-back carries Approved: or Rejected: (R1, R2, R3)`.
  </action>
  <verify>
    <automated>npm run build && npm run typecheck && npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts</automated>
    <automated>node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-kit-refs.js && npm run check:claim-anchors && npm run freshness:adapters && npm run freshness:catalog && npm run freshness</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2 && grep -qF 'When an answer note queued the Tech Lead, read that note too.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'who reads that note at step 15.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'add an `Approved:` or `Rejected:` line naming the human.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'naming the hand-off note that carries `Approved:`.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'applies the hand-off to the role that made the change.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'That hand-off counts like any other, and step 16 dispatches it.' agent-factory/workflows/04-ticket-to-pr.md && grep -qF 'once a human answers at the human stop, the Orchestrator records the answer' agent-factory/config/factory.config.md && test "$(wc -c < agent-factory/roles/tech-lead.md)" -lt 3786 && git diff --quiet 4f6cacea -- scripts/checkpoints.ts scripts/checkpoints.js hooks</automated>
  </verify>
  <done>
- The five edited pins and (z), (aa), (ab) went RED for missing sentences (`7 failed | 145 passed (152)`), then GREEN (`152 passed`). Every other case passes unedited, (w) included.
- Each `grep -qF` in the verify finds its sentence (baseline: all 0 at HEAD 4f6cacea). Case (z) proves the bare revert-queue sentence is gone; case (ab) proves the old approval-finding wording is gone from WF04.
- WF04 keeps 2 `checkpoint: ` matches and 6 stop bullets; tech-lead.md is still 3776 B; checkpoints.ts, checkpoints.js and hooks/ show no diff.
- check-diff-disposition prints 721.
- One `fix(quick-261031-rhv):` commit holds exactly the four files.
  </done>
</task>

<task type="auto">
  <name>Task 3: CHANGELOG, the full non-e2e suite, and the final invariants</name>
  <files>CHANGELOG.md</files>
  <action>
1. CHANGELOG.md `## [Unreleased]` `### Changed`, clear voice, not caveman. Wrap at the file's existing width (at most 100 characters per line, two-space continuation indent).
   - In the bullet that starts "- Workflow 04 runs the Tech Lead after the Definition of Ready check.", replace only its last sentence with: "A named human decides only after the roles dispute one cause three times, before a fourth hand-off on one ticket, when the scores call for a raise past the spent escalation, or when a role proposes a fundamental change to a requirement or a rule." (R4)
   - Replace the whole next bullet (it starts "- In Workflow 04's hand-off loop," and ends "a parked ticket resumes as at `block` once a human answers.") with: "- In Workflow 04's hand-off loop, a role that finds a fundamental change to a requirement, rule, ADR or `checkpoints` value proposes it and leaves it unmade until a named human approves. The Tech Lead records the human's verdict on the hand-back as an `Approved:` or `Rejected:` line naming the human. After approval the role makes the change and names that `Approved:` hand-off note in its `Resolved:` answer. After a rejection the Tech Lead applies the move the human names, or hands the ticket back to be fixed within the current requirement and rules. Neither hand-back counts toward a limit. At its re-plan, before any pull, the Tech Lead checks the change behind every `Resolved:` answer; a fundamental change passes only with an `Approved:` hand-off note. Otherwise the Tech Lead hands the ticket back to the role that made the change, to revert it, and that hand-off counts toward the limits like any other. Each hand-off and dispute carries a `Cause-id:` line naming the `failed-attempt` note that first raised the cause. The Orchestrator queues the Tech Lead after the first block and after every answer. When a human answers a human stop, at any value of `checkpoints.escalate_unadjudicable_result`, the Orchestrator records the answer in a `decision` note and queues the Tech Lead. Any raise past the spent escalation goes to the human stop, and the Tech Lead publishes no plan note naming that level before the human answers. At `notify` or `off`, a parked ticket resumes as at `block` once a human answers." (R1-R4)
   - Pick no version and add no other bullet.
   - Run `npm run check:public-docs && node scripts/check-banned-claims.js && npm run check:claim-anchors`.
   - Commit CHANGELOG.md alone, path-specific, as `docs(quick-261031-rhv): changelog for the four Workflow 04 hand-off loop re-trace fixes`.

2. Full non-e2e suite, in the background: `timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'` (about 23 minutes). The baseline after 261031-oxi is `Tests 21 failed | 10718 passed | 2 skipped (10741)`. The 21 failures are:
   - scripts/context-io.test.ts 7
   - scripts/context-io-writer-set.test.ts 2
   - scripts/canonical-corpus.test.ts 1
   - scripts/harness-instance-ledger.test.ts 4
   - scripts/uat-gate-exit-contract.test.ts 5
   - install/installer-fs-census.test.ts 1
   - the one environmental case in scripts/check-foundation-guards.test.ts

   The run passes when every failing test is in that set, at most 21 fail, and the total rose by exactly 4 (cases (z), (aa), (ab), (ac)). The expected line is `Tests 21 failed | 10722 passed | 2 skipped (10745)`. Any failure outside the set is a regression from this plan: fix it and re-run. List the failures by file in the SUMMARY. Never mark a baseline failure as passing.

3. Confirm `git status --short docs/audit/28-prepass-evidence.md` still prints ` M docs/audit/28-prepass-evidence.md`, and that `~/` is untouched.
  </action>
  <verify>
    <automated>npm run check:public-docs && node scripts/check-banned-claims.js && npm run check:claim-anchors && tr '\n' ' ' < CHANGELOG.md | tr -s ' ' | grep -qF 'when the scores call for a raise past the spent escalation, or when a role proposes' && tr '\n' ' ' < CHANGELOG.md | tr -s ' ' | grep -qF 'publishes no plan note naming that level' && tr '\n' ' ' < CHANGELOG.md | tr -s ' ' | grep -qF 'records the answer in a `decision` note and queues the Tech Lead' && grep -qF '`Rejected:`' CHANGELOG.md && test "$(grep -o 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md | wc -l)" -eq 2</automated>
    <automated>node scripts/check-diff-disposition.js | grep -F "721 finding(s)"</automated>
    <automated>timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'</automated>
  </verify>
  <done>
- The CHANGELOG checks find their phrases in the line-joined text, so wrapping cannot hide them (baseline 0 for each at HEAD 4f6cacea, `Rejected:` included). The public-docs, banned-claims and claim-anchors gates exit 0.
- The full non-e2e suite shows only the 21 baseline failures, and the total is 10745 (rose by 4).
- One `docs(quick-261031-rhv):` commit holds CHANGELOG.md alone. docs/audit/28-prepass-evidence.md is still modified and unstaged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| receiving role -> shared notes -> Tech Lead | An agent-written `Resolved:` note, and the diff behind it, decide whether the ticket returns to development |
| named human -> Orchestrator -> `decision` note -> Tech Lead | A human's answer at the human stop reaches the Tech Lead only through the note the Orchestrator records and the queue |
| Tech Lead move note -> receiving role | The `Approved:` or `Rejected:` line tells the role whether it may make a fundamental change |
| board and queue -> Orchestrator | A ticket nobody queues stalls with no owner acting |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qrhv-01 | Elevation of privilege | WF04 step 17, an unapproved fundamental change | high | mitigate | R1/R3: the step 2 check passes a fundamental change only when its `Resolved:` note names a hand-off note carrying `Approved:`; otherwise a recorded `Move: hand-off` sends it back to its maker to revert, counted toward the per-ticket ceiling. Pinned by (z), (ab) and re-pinned (q), (s), (u) |
| T-qrhv-02 | Spoofing | A rejection read as approval | medium | mitigate | R3: the move note after a ruling on a `Fundamental:` proposal carries `Approved:` or `Rejected:` naming the human, and the existing step 15 confirmation shows the human that note before the `Confirmed: yes` finding stamped `human:<name>`. Pinned by (ab) |
| T-qrhv-03 | Denial of service | Uncounted catch-and-revert cycle; a Tech Lead nobody wakes after a human answers | medium | mitigate | R1: the revert is a counted hand-off, so the agent loop ends at the per-ticket ceiling. R2: at every value the Orchestrator records the answer and queues the Tech Lead. Pinned by (z), (aa) |
| T-qrhv-04 | Tampering | Contradictory rules for a raise past the spent escalation, or a plan note published before the human answers | medium | mitigate | R4: one human-stop rule in all six places, "used up" made disjoint with "while the escalation is unspent", and no plan note naming the raised level before the human answers, so step 3 cannot pull. Pinned by (ac) and re-pinned (a), (g), WR-01, D-21, 39-18 (e) |
| T-qrhv-05 | Tampering | Hard human gates (checkpoint tags, stop bullets, hooks, checkpoints.*) | high | mitigate | No tag, stop bullet, hook or checkpoints.* change. Each task's verify asserts 2 tags and an empty diff on checkpoints.ts, checkpoints.js and hooks/ from 4f6cacea; cases (ac) and (g) assert 6 stop bullets |
| T-qrhv-06 | Elevation of privilege | A `Resolved:` diff larger than the approved proposal | low | accept | The `Approved:` note names the human and the proposal the human saw; whether a diff stays within it is the Tech Lead's step 2 diff check, which this plan does not widen. Left for the post-task re-trace |
| T-qrhv-SC | Tampering | npm/pip/cargo installs | high | accept | No package is installed or added by this plan |
</threat_model>

<verification>
- Cases (z), (aa), (ab) and (ac) pass. The re-pinned D-21 amended, WR-01, 39-18 (e), (a), (g), (q), (s), (u) and (y) cases pass. Every other tier-kit-text case passes unedited.
- The lexicon, foundation guards, structure validator, kit-refs, claim-anchors, public-docs, banned-claims and freshness gates all exit 0. check-diff-disposition is back at the recorded 721.
- WF04 has 2 `checkpoint: ` tags and 6 stop bullets. tech-lead.md is 3776 B, under 3786. checkpoints.ts, checkpoints.js and hooks/ are unchanged.
- The full non-e2e suite shows only the 21 recorded failures, and the total rose by 4 (10745).
- Defect coverage:
  - R1: Task 2 (step 17 PASS_RULE, REVERT_HANDOFF, REVERT_NOTE, REVERT_COUNTS).
  - R2: Task 2 (step 15 lead READ_ANY; human stop RECORD_ANSWER and QUEUE_ANSWER; config paragraph).
  - R3: Task 2 (move-record VERDICT; step 17 APPROVED_NOTE, REJECTED_NOTE, PASS_RULE).
  - R4: Task 1 (step 15 hand-off and human stop, step 17 NO_PLAN, used-up stop, tech-lead.md, config row, config `## Stop conditions` bullet, config `block`).
  - All four also land in the CHANGELOG (Task 3).
</verification>

<success_criteria>
- Each of R1-R4 is closed in the kit text by the fix direction in 261031-rhv-CONTEXT.md and pinned by a test case.
- D1-D3 and the 261031-oxi fixes still hold: fundamental changes are proposals until a named human approves, every cause carries a `Cause-id:`, the ceiling reaches the human stop before a fourth hand-off, the Tech Lead is queued after the first block, after `Resolved:` and after `Disputed:`/`Fundamental:`, and a parked ticket resumes once a human answers.
- No hard human gate, checkpoint count, config key, default or role ceiling moved, and no new mechanism, note type or counter was added.
</success_criteria>

<output>
Create `.planning/quick/261031-rhv-close-wf04-hand-off-loop-re-trace-defect/261031-rhv-SUMMARY.md` when done. Include:
- the RED and GREEN transcripts for Tasks 1 and 2
- the commit short shas
- every sentence the lexicon or a guard made you shorten, with the reason
- the disposition counts before and after each task
- the tech-lead.md byte count
- the full-suite failures listed by file against the baseline
- a defect-to-sentence table naming the sentence(s) that carry each fix
- the "seen and left" items from the objective's planner trace, for the re-trace that follows this task
- the CONTEXT nit on the "one" antecedent, listed as still open (no edited sentence contained it)
</output>
