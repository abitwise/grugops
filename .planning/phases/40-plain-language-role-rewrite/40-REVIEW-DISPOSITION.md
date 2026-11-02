---
phase: 40
review: 40-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "The merge, deploy and named-human bans in role `## Hard limits` are no longer protected by any gate"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "The Orchestrator's lean close `In UAT → Done` no longer needs a human merge or the named-human UAT sign-off"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The board-move partition guard admits moves that skip gates"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "In lean mode, two roles exit `In UAT` with conditions that do not exclude each other"
  - id: WR-03
    severity: warning
    disposition: deferred
    title: "New `## Stop when` bullets imply backward board moves that no role owns"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "Human-stop rules moved out of the frozen `## Hard limits` region into `## Stop when`, which nothing freezes"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The pre-rewrite baseline can be laundered with one command, and the equality test stays green"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The base move retired 23 undispositioned workflow safety-section changes that nobody read"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Shipped kit text cites internal planning ids and describes blocks that no longer exist"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The fact parser and the partition parser read `→` differently"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The fixture comment still says \"8 prefix-matched section checks\""
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The gate checks `role_standin` only for form, not for the expected value, and ignores duplicates"
open: 0
total: 12
recorded: 2026-11-01T18:03:49.599Z
---

# Phase 40: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | plans 40-11, 40-12: twelve derived safety facts in the D-30 stand-in; `## Stop when` frozen; stand-in key pinned; shared-clone red-on-deletion case (check-role-rules.test.ts CR-01 describes) |
| CR-02 | critical | fixed | plan 40-13: the lean close needs the named human's sign-off and a human merge; lean DoD gains the merge item; tier-kit-text.test.ts CR-02 pins |
| WR-01 | warning | fixed | plan 40-14: rule 4 narrowed to next-flow, outside-flow or declared pairs; terminal-owner exemption removed; D33_NON_FORWARD_PAIRS from the approved table; five planted WR-01 red cases in check-role-rules.test.ts |
| WR-02 | warning | fixed | plan 40-13: UAT Planner move enterprise-only; Workflow 06 aligned; tier-kit-text.test.ts WR-02 pins |
| WR-03 | warning | deferred | deferred to the backlog (candidate: Phase 41 flow guidance). Each "return the ticket" bullet needs a flow decision: either a backward move with an owner (a new pair, which D-17 and D-33 keep out of Phase 40) or a stay-in-column reading. Workflows 03, 05 and 06 carry the same "route back" wording in frozen `## Stop conditions` clauses, so a role-only rewording could contradict them, and the QE bullet already conflicts with Workflow 04 step 14 (gate failures go to `Blocked` for the Tech Lead). frontend-ui.md carries the same shape in Phase 39 wording pinned by tier-kit-text.test.ts. Recorded in deferred-items.md |
| WR-04 | warning | fixed | plan 40-12: role `## Stop when` in FROZEN_SECTION_ANCHORS; check-diff-disposition.test.ts WR-04 describe |
| WR-05 | warning | fixed | plan 40-11: git-object writer pinned to PHASE_40_START_COMMIT; foreign source_commit refused; check-role-rules.test.ts WR-05 describe |
| WR-06 | warning | fixed | plan 40-16: the 31 retired frozen-section findings listed in docs/audit/40-disposition-base-move.md and read by the named human Olger, who accepted all 31 on 2026-11-02 |
| IN-01 | info | fixed | plan 40-15: plan ids removed from writing-profile lines 8 and 304; line 302 is the C-28-045 frozen anchor and stays byte-exact (check-claim-anchors) |
| IN-02 | info | fixed | plan 40-14: partition rule 6 names an arrow span that is not a column pair; check-role-rules.test.ts IN-02 cases |
| IN-03 | info | fixed | plan 40-15: the typed section count removed from 176 fixture headers, pinned by validate.test.ts; dropping the retired caveman heading from the `good` fixture is deferred as optional |
| IN-04 | info | fixed | plan 40-12: ROLE_STANDIN_SCRIPT pin and duplicate refusal; check-diff-disposition.test.ts IN-04 cases |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
