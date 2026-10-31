---
phase: 39
review: 39-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "No step brings the Tech Lead back after a `Disputed:` or `Fundamental:` answer, so rounds 2-3 and the `Fundamental:` human stop cannot be reached"
  - id: CR-02
    severity: critical
    disposition: open
    title: "The fundamental-change gate is checked after the change is made, and the role that made the change decides whether it was fundamental"
  - id: CR-03
    severity: critical
    disposition: open
    title: "The step-2 re-plan after `Resolved:` has no level limit, which bypasses the \"move limits unchanged\" rule and \"never escalate twice on your own\""
  - id: CR-04
    severity: critical
    disposition: open
    title: "A \"cause\" has no identity, so neither the per-cause bound nor the round count can be checked, and relabelling a cause loops without limit"
  - id: WR-01
    severity: warning
    disposition: open
    title: "\"A named human is asked only after three disputed rounds\" is untrue on two paths the text does not reconcile"
  - id: WR-02
    severity: warning
    disposition: open
    title: "There is no rule for a cause that no other role's job covers"
  - id: WR-03
    severity: warning
    disposition: open
    title: "A hand-off can be made before the options are used up, and it counts toward no limit"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Roles other than BA/PM and the Architect are not told how to answer a hand-off"
  - id: WR-05
    severity: warning
    disposition: open
    title: "Step 17's board moves conflict with the board-move sections of the role files, and `Resolved:` skips the Definition of Ready"
  - id: WR-06
    severity: warning
    disposition: open
    title: "After `Resolved:`, the Orchestrator can pull the ticket on the old plan note"
  - id: WR-07
    severity: warning
    disposition: open
    title: "The `## Blocked` owner bullets pile up with conflicting owners"
  - id: WR-08
    severity: warning
    disposition: open
    title: "In tech-lead.md, \"instead\" can be read as cancelling the hand-off at `notify` and `off`"
  - id: IN-01
    severity: info
    disposition: open
    title: "The `notify` observation names the wrong note when `Fundamental:` triggers the stop, and \"once\" has no scope"
  - id: IN-02
    severity: info
    disposition: open
    title: "The step-15 lead line and tech-lead.md item 5 still list four moves, with no hand-off"
  - id: IN-03
    severity: info
    disposition: open
    title: "The disposition register's opening counts three watched documents but lists four"
  - id: IN-04
    severity: info
    disposition: open
    title: "The W1 cross-place test checks that phrases are present, not which value they apply to"
  - id: WR-11
    severity: warning
    disposition: fixed
    title: "The README says install and `--dry-run` print the presence note when the install ledger \"cannot be read\". Install refuses over such a marker and prints no note"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "For a split or an Architect move, Workflow 04 steps 15-16 still return the ticket to `Ready for Dev` and re-enqueue an engineer"
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "\"A re-score that raises the level is the escalation\" conflicts with \"escalate one level\" and does not cover a re-score after the escalation is spent"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "The bound on Tech Lead moves is counted from `decision` notes, but those notes cannot be told apart"
  - id: WR-15
    severity: warning
    disposition: fixed
    title: "The CR-02 human stop exists only in Workflow 04, and the confirmation is recorded nowhere step 16 or the trace can read"
  - id: WR-16
    severity: warning
    disposition: fixed
    title: "Step 15's human stop ignores the `exhaust_self_fix_budget` checkpoint dial"
  - id: IN-07
    severity: info
    disposition: open
    title: "`ledgerSays` adds a second wording of \"the install ledger cannot vouch for this file\", and its `malformed` arm says \"could not be read\" for a ledger that was read"
  - id: IN-08
    severity: info
    disposition: open
    title: "Other junior-exclusion statements still name only four of the ten rubric tags, and the role copies the tag list by hand"
  - id: IN-09
    severity: info
    disposition: open
    title: "The run-time flattening lists leave out effort settings documented a few lines earlier"
  - id: IN-10
    severity: info
    disposition: open
    title: "The new presence-path tests leave out the README's headline case and two branches"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The two lists of run-time settings that flatten the levels disagree, and the text is not single-sourced"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "No changelog entry for a release-visible, partly breaking change"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The coordinator adapter is now past the warn tier"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The XL / file-plan split stop names no owner for leaving `Ready for Dev`"
open: 20
total: 30
recorded: 2026-10-31T09:17:11.179Z
---

# Phase 39: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| CR-02 | critical | open | - |
| CR-03 | critical | open | - |
| CR-04 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| WR-11 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-12 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-13 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-14 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-15 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-16 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| IN-07 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |
| IN-09 | info | open | - (not in the current review) |
| IN-10 | info | open | - (not in the current review) |
| WR-09 | warning | fixed | plan 39-13 (b5a82cf9) (not in the current review) |
| WR-10 | warning | fixed | plan 39-13 (b5a82cf9) (not in the current review) |
| IN-05 | info | deferred | deferred to Phase 41 (orchestrator flow): no gap fix changes the coordinator adapter; its warn tier or a shorter grant rendering is decided where the next grant change lands (not in the current review) |
| IN-06 | info | deferred | deferred to Phase 40 (plain-language role rewrite): naming the role that moves an XL ticket out of `Ready for Dev` adds a board move, and Phase 40's role-rule inventory treats board-move ownership as a partition (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
