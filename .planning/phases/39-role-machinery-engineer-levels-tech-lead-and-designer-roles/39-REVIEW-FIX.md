---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
fixed_at: 2026-10-30T11:20:23Z
review_path: .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW.md
iteration: 2
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 39: Code Review Fix Report

**Fixed at:** 2026-10-30T11:20:23Z
**Source review:** .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW.md
**Iteration:** 2. This is the second fix round. It replaces the iteration-1 report, which git keeps. The `<config>` block passed `iteration: 1`, but the orchestrator called this fix round 2, so the report says 2.

**Summary:**
- Findings in scope: 10 (WR-01 to WR-06 and IN-01 to IN-04, under `fix_scope: all`). These are the re-review's own IDs, not the WR-11 to WR-16 of iteration 1.
- Fixed: 10
- Skipped: 0
- Four fixes change workflow logic: WR-02, WR-03, WR-04 and WR-06. Each is marked **fixed: requires human verification**.

**Order.** WR-05 was applied right after WR-01, not in document order. WR-05 turns the role's restated rules into a pointer at Workflow 04 step 15. After that, WR-02, WR-03, WR-04 and WR-06 only needed edits to Workflow 04, and none of them had to add text to the role first and then cut it again.

**Style dispositions.** The new rows are in `docs/audit/29-style-dispositions/39-review-fix-2.md`, one block per finding, each committed with its fix. `npm run check:diff-disposition` had 721 findings before this round, all of them old. It has 721 after every commit and adds none. The one frozen-section change (IN-01, `## Stop conditions`) has a filled `companion` cell. IN-02 edits only `install/README.md`, which the gate does not watch, so it has no row.

## Fixed Issues

### WR-01: The `human:<name>` confirmation finding is unchecked at the default dial, and the disposition says the admission guard checks it

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `docs/audit/29-style-dispositions/39-review-fix-1.md`, `docs/audit/29-style-dispositions/39-review-fix-2.md`, `scripts/tier-kit-text.test.ts`
**Commit:** 2db24a88
**Applied fix:**
- Step 15 now says who writes the finding: the Tech Lead records it once the named human has answered. It also adds "Never write that stamp without the human's answer."
- Step 15 now says what checks the stamp: only `context.human_admission: all` makes admission check it, and only Claude Code binds it to the human's session grant. At the default `off` the finding is a prose-tier record. I checked this against `isGatedNote` in `scripts/context-io.ts`.
- The iteration-1 disposition text that claimed the admission guard checks the stamp is corrected: the summary at lines 21-23 and the rows for the step 15 finding sentence and the step 16 wait.

### WR-05: The new `tech-lead.md` ceiling was measured at an intermediate size; the shipped file already trips its WARN tier

**Files modified:** `agent-factory/roles/tech-lead.md`, `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** baec8150
**Applied fix:** This takes the review's preferred route of cutting the role, not re-measuring the ceiling.
- Responsibility 5 now says "Follow Workflow 04 step 15 for the `Move:` line, the re-score rule and the named-human stops." Before, it restated those rules.
- Board moves now says "It owns the exit of a dev-raised `## Blocked`, per Workflow 04 step 15."
- The Output bullet that repeated the `Move:` line is removed.
- The role went from 4110 B to 3439 B, which is under the measured Plan 39-05 ceiling.
- `ROLE_CEILINGS` goes back to `3572 3381` with its original measurement comment. The comment now also says the iteration-1 raise to `4222 3996` was never confirmed by a human and is reverted.
- No human confirmation is claimed or needed: this goes back to the existing measured value and raises nothing.
- The committed `.js` was rebuilt, and `npm run freshness` reports 88 files fresh.
- **Still open:** the role is 3439 B, which is still over the 3381 B WARN tier, so the guard prints a WARN. That is what the tier is for: the role is within 6% of its ceiling. Getting under 3381 B would mean cutting text that was there before this review round.

### WR-02: Step 16 waits for any `human:<name>` finding, so a recorded rejection releases the re-enqueue

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** 996071d3
**Status:** fixed: requires human verification (logic)
**Applied fix:**
- The human's answer is recorded as a finding whose body opens with `Confirmed: yes` or `Confirmed: no`.
- Step 16 waits for a `Confirmed: yes` finding that names the move note.
- A `Confirmed: no` move is neither carried out nor counted. The move count skips any move that a `Confirmed: no` finding names.
- After a rejection, the Tech Lead records a new move, or stops for a named human once the options are used up.
- The role meets all of this through its step 15 pointer (WR-05).

### WR-03: The WR-13 stops are unconditional in step 15 but tagged `escalate_unadjudicable_result` in the stop conditions

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** a7f0aa8f
**Status:** fixed: requires human verification (logic)
**Applied fix:** I used Option 1.
- **Why not Option 2:** the project's convention in `scripts/checkpoints.ts` is that a stop which hands to a human carries a tag. An untagged human stop would break that.
- When the scores call for more than one level, or for a raise after the escalation is spent, step 15 now reads `checkpoints.escalate_unadjudicable_result`. That is the cell the used-up stop follows.
- At `block`, the default, the Tech Lead stops for a named human.
- At `notify` or `off`, it raises one level if the escalation is unspent, and otherwise keeps the level. Either way it records the scored level in the move note, so no value leaves the Tech Lead without a legal move.
- At `notify` it also records an `observation`.
- No checkpoint tag is added or moved, and the frozen used-up stop is unchanged.
- **Left for a human:** the review also points out that the cell's documented meaning in `factory.config.md`, "Self-stamping a high-stakes result no gate can adjudicate", fits a two-level re-score poorly. I did not change the cell's meaning.

### WR-04: At `notify`, step 15 makes the move with no record, so `notify` behaves exactly like `off`

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** b24b0149
**Status:** fixed: requires human verification (logic)
**Applied fix:**
- The merged sentence is split in two.
- At `notify`, the Tech Lead makes the move and records an `observation` per Workflow 16 that names the move note.
- At `off`, it makes the move without that human.
- The pin in `scripts/tier-kit-text.test.ts` is updated, and it now also refuses the old merged sentence.
- **Left for a human:** `factory.config.md` line 192 still defines `notify` as "recorded (a finding note)". Workflow 16 needs a verification stamp on a `finding`, so the record here is an `observation`. That config wording affects every checkpoint, so I left it unchanged. A human should decide whether to change it to "a note per Workflow 16".

### WR-06: Step 16's "After a gate failure at `block`" needs a fact step 14 never records

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** bc0c28ca
**Status:** fixed: requires human verification (logic)
**Applied fix:**
- Step 14's `failed-attempt` note now opens with a fixed line: `Cause: engineer` for a `BLOCKED` report, or `Cause: gate` for a gate failure. I used shorter values than the review's examples so each procedural sentence stays within the 20-word bound that `check:imperative-lexicon` enforces (rule WP-02).
- Step 15 reads `checkpoints.exhaust_self_fix_budget` when the note opens with `Cause: gate`.
- Step 16 waits for a `Confirmed: yes` finding after a `Cause: gate` note at `block`.
- All three are pinned in `scripts/tier-kit-text.test.ts`.

### IN-01: The tagged gate-failure stop still says "before the re-enqueue (step 15)"

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** 8e4c403d
**Applied fix:**
- The frozen stop now reads "A named human confirms the Tech Lead's move before the ticket leaves `Blocked` (step 15) and before any re-enqueue (step 16)."
- The disposition row has a filled `companion` cell for `## Stop conditions`.
- `checkpoint: exhaust_self_fix_budget` stays on the bullet, once. `scripts/checkpoints.test.ts` passes (118 tests).

### IN-02: The README's unreadable-marker sentence leaves out `--dry-run`

**Files modified:** `install/README.md`, `scripts/tier-kit-text.test.ts`
**Commit:** c72de460
**Applied fix:**
- The lead sentence now reads "Two marker states stop install and `--dry-run` without a note."
- The unreadable-marker sentence now names install, `--dry-run` and `install.js --check`.
- Before editing, I probed a scratch target whose marker is not valid JSON:
  - install and `--dry-run` each end with a `verify` item.
  - `--check` reports a `FAIL` at the marker.
  - None of the three prints a note.

### IN-03: "On an escalation" in the WF04 board moves now means two different things

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-2.md`
**Commit:** 9fc89255
**Applied fix:**
- The board moves no longer say "On an escalation". They name the two causes: the engineer reports `BLOCKED`, or the gate ends `BLOCKED_NEEDS_FIX`.
- The Tech Lead's exit now names all four moves: `Ready for Dev` after an escalation or a re-plan, `Backlog` after a split, and `In Design` after an Architect pass.

### IN-04: The role's Reads line cites Workflow 04 by step number, and no test ties those numbers to the steps

**Files modified:** `scripts/tier-kit-text.test.ts`
**Commit:** 53629682
**Applied fix:** A new test finds the blocked-ticket steps by their text and checks that they are numbered 14, 15 and 16. It also checks that every `Workflow 04 step N` the role cites is step 15. Since WR-05, the role cites step 15 twice.

## Verification

All gates ran in the main checkout: `workflow.use_worktrees` is `false`, so no worktree was created. Every number below can be reproduced from that tree.

- `npx vitest run scripts/tier-kit-text.test.ts`: 98 passed.
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED. The only tech-lead line is `WARN agent-factory/roles/tech-lead.md 3439B >= 3381B` (see WR-05).
- `npx vitest run scripts/check-foundation-guards.test.ts`: 337 passed.
- `npm run freshness`: 88 committed `.js` files are fresh.
- `npm run typecheck`: exit 0.
- These checks all pass: `freshness:adapters`, `freshness:skill-twins`, `freshness:catalog`, `freshness:host-entries`, `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `check:residual-citations`, `check:public-docs`, `check:state-paths` and `check:audit-register`.
- `npm run check:diff-disposition`: 721 findings, the same as before this round, and none of them new.
- I also ran the 14 test files that read the changed files. 13 pass, 1929 tests in all. `scripts/uat-gate-exit-contract.test.ts` fails 5 tests, and this round did not cause it: the tests read `.planning/phases/31-autonomous-manual-testing/`, which is no longer in the tree (`ENOENT`). No file this round touched is involved.

`docs/audit/28-prepass-evidence.md` still holds the user's uncommitted change. No commit in this round staged or touched it.

## Left for a human

- `factory.config.md` § `checkpoints` sub-fields defines `notify` as "recorded (a finding note)". Workflow 04 now records an `observation` (WR-03, WR-04), because a `finding` needs a stamp.
- The documented meaning of `escalate_unadjudicable_result` fits a two-level re-score poorly (WR-03).
- `tech-lead.md` still trips its WARN tier at 3439 B against 3381 B (WR-05). No ceiling raise is proposed.

---

_Fixed: 2026-10-30T11:20:23Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
