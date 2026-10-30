---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
fixed_at: 2026-10-30T10:25:00Z
review_path: .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 39: Code Review Fix Report

**Fixed at:** 2026-10-30T10:25:00Z
**Source review:** .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (WR-11 to WR-16; IN-07 to IN-10 are out of scope for `critical_warning`)
- Fixed: 6
- Skipped: 0

`workflow.use_worktrees` is `false`, so every fix was edited and committed in the main checkout on
`main`. No worktree, temp branch or recovery sentinel was created. The unrelated uncommitted change
in `docs/audit/28-prepass-evidence.md` was not staged, committed or modified.

Every Workflow 04 and Tech Lead edit has its rows in a new disposition file,
`docs/audit/29-style-dispositions/39-review-fix-1.md`, written in the same commit as the edit. The
two edits inside the frozen `## Stop conditions` section carry `companion` cells. After each commit
the diff-disposition gate is back at its pre-fix count of 721 findings. That count was 721 before
any fix, so it is not something these fixes introduced.

WR-12 to WR-16 change process rules, so each is marked **fixed: requires human verification**. A
named human should read the new step 15 and 16 text and the role text against the intent of D-19
to D-21.

## Fixed Issues

### WR-11: The README says install and `--dry-run` print the presence note when the install ledger "cannot be read". Install refuses over such a marker and prints no note

**Files modified:** `install/README.md`, `install/install.ts`, `install/install.js`, `scripts/tier-kit-text.test.ts`
**Commit:** 1edfc8c5
**Status:** fixed
**Applied fix:** I first reproduced the reviewer's probe in a scratch target:
- With `ledger: "x"`, install and `--dry-run` refuse with exit 3 and print no note. `--check` prints a FAIL and the note.
- With an invalid-JSON marker, `--dry-run` and `--check` both stop at the marker.

I then changed the README so it says this. Its first paragraph now covers only the v2.1-era case and the no-marker case. A new paragraph says what each mode prints over a malformed ledger and over a marker that cannot be read. The pinned strings `print a \`note\` instead` and the "and\nthe exit" line break are kept. In the STALE KIT ADAPTERS comment in `install.ts`, I made the same correction and rebuilt `install.js` with `tsc`. I also added test pins for the new sentences and a negative pin for the old "absent or cannot be read" wording.

### WR-12: For a split or an Architect move, Workflow 04 steps 15-16 still return the ticket to `Ready for Dev` and re-enqueue an engineer

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/tech-lead.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-1.md`
**Commit:** 7c7f7774
**Status:** fixed: requires human verification
**Applied fix:**
- **Step 15:** only an escalation or a re-plan returns the ticket to `Ready for Dev`. A split moves it to `Backlog` for BA/PM, and an Architect pass moves it to `In Design`.
- **Step 16:** a new subtask is created only after an escalation or a re-plan, and "A split or an Architect pass dispatches no engineer."
- **Board moves:** the Workflow 04 board moves and the Tech Lead's Board moves now name the same three exits.

### WR-13: "A re-score that raises the level is the escalation" conflicts with "escalate one level" and does not cover a re-score after the escalation is spent

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/tech-lead.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-1.md`
**Commit:** 2b8b292c
**Status:** fixed: requires human verification
**Applied fix:** A level-raising re-score is now the escalation and moves the ticket one level only. Two cases now stop for a named human, in step 15 and in role item 5:
- the scores call for more than one level;
- the scores call for a raise after the escalation is spent.

The frozen used-up stop now names the same two cases. Its `escalate_unadjudicable_result` tag is unchanged and appears once. Step text carries no `checkpoint:` tag (the existing test forbids it), so this does not follow the reviewer's literal suggestion.

### WR-14: The bound on Tech Lead moves is counted from `decision` notes, but those notes cannot be told apart

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/tech-lead.md`, `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-1.md`
**Commit:** 7cd9ae5e
**Status:** fixed: requires human verification
**Applied fix:**
- A move note opens its body with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`. A level-raising re-score is marked `Move: escalate`.
- Earlier moves are counted only from the Tech Lead's `decision` notes for the ticket that carry a `Move:` line. The step-2 plan note carries none.
- This is stated in WF04 step 15 and in the role's Output.

`tech-lead.md` grew past its `guard_role_size` FAIL ceiling of 3572 B. I re-measured its entry in `ROLE_CEILINGS`: 3769 B, giving `4222 3996` at +12% / +6% rounded up. This is the formula plan 39-07 used for `software-engineer.md`. The comment records the old values. **A human should confirm that raising this ceiling is acceptable.** The alternative is to cut role text and point to Workflow 04 instead. The final file is 4110 B, which is under the new FAIL ceiling and over the new WARN ceiling (3996 B).

### WR-15: The CR-02 human stop exists only in Workflow 04, and the confirmation is recorded nowhere step 16 or the trace can read

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/tech-lead.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-1.md`
**Commit:** aaa6b7c7
**Status:** fixed: requires human verification
**Applied fix:**
- **Tech Lead role:**
  - It now reads WF04 steps 14-16.
  - Item 5 leaves a gate-failure ticket in `Blocked` until a named human confirms the move.
  - Its Board moves say the exit waits for that human.
- **WF04 step 15:**
  - The ticket stays in `Blocked` until the human confirms.
  - The confirmation is recorded as a `finding` per Workflow 16, stamped `human:<name>`, with the move note's id among its refs. This uses Workflow 16's existing escalation stamp, which the admission guard checks on Claude Code. I chose it instead of the free-text `confirmed_by:` line the review also offered.
- **WF04 step 16:** it waits for that `human:<name>` finding.

### WR-16: Step 15's human stop ignores the `exhaust_self_fix_budget` checkpoint dial

**Files modified:** `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/tech-lead.md`, `scripts/tier-kit-text.test.ts`, `docs/audit/29-style-dispositions/39-review-fix-1.md`
**Commit:** c6f08087
**Status:** fixed: requires human verification
**Applied fix:** Step 15 now reads `checkpoints.exhaust_self_fix_budget`, the value the tagged gate-failure stop follows:
- at `block` (the default), the human stop holds;
- at `notify` or `off`, the move goes ahead without that human.

Step 16 waits for the human's finding only at `block`. Role item 5 and its Board moves follow the same value. No checkpoint tag was added or moved: `exhaust_self_fix_budget` still appears once as a tag in WF04 and once in WF05.

## Verification

Where it ran: all checks ran in the main checkout (`/home/olger/projects/public/grugops`), on the
tree after the last fix commit, with the unrelated `docs/audit/28-prepass-evidence.md` change still
uncommitted in the working tree.

Per-fix checks (each passed before its commit):
- `scripts/tier-kit-text.test.ts` passed: 95 tests at WR-11, 97 at the end.
- `scripts/checkpoints.test.ts` passed. Together with `scripts/tier-kit-text.test.ts` that is 215 tests at the end.
- `install/agents-record.test.ts` passed: 308 tests together with tier-kit-text, at WR-11.
- `scripts/check-foundation-guards.test.ts` passed: 337 tests, at WR-14.
- These checks printed ALL CHECKS PASSED:
  - `npm run check:imperative-lexicon`
  - `npm run check:banned-claims`
  - `npm run check:public-docs`
  - `npm run check:claim-anchors`
  - `npm run check:residual-citations`
  - `npm run check:audit-register`
  - `node scripts/check-foundation-guards.js`
  - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` (the structure validator)
- `npm run freshness` reported 88 committed `.js` files matching a rebuild. `npm run freshness:adapters` reported 21 adapters with 0 byte differences. No adapter regeneration was needed: the adapters point to the role files and do not copy their text.
- `npm run check:diff-disposition` exits 1 with 721 findings. That is the same as the baseline taken before any fix.

Full suite (`npx vitest run`): 131 test files passed and 7 failed. 10664 tests passed, 24 failed and 2 were skipped. Exit code 1. None of the 24 failures touches a file these fixes changed:
- **Archived planning files.** Most failures read `.planning/phases/31-autonomous-manual-testing/*` or `.planning/phases/27-*` files that are absent on disk (ENOENT). This covers `scripts/context-io.test.ts`, `scripts/context-io-writer-set.test.ts`, `scripts/uat-gate-exit-contract.test.ts`, `scripts/harness-instance-ledger.test.ts` and `scripts/canonical-corpus.test.ts`.
- **`install/installer-fs-census.test.ts`.** It reports an unclassified `node:fs` export, `openAsBlobSync`, which depends on the Node runtime version.
- **`scripts/e2e/uat-live.test.ts`.** This is the live Tier-2 E2E against a host CLI, and its runner wrote no capture summary.

I did not rerun these at the base commit. I am calling them outside these fixes because of their causes, not because I proved it by a rerun.

---

_Fixed: 2026-10-30T10:25:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
