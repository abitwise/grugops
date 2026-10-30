---
phase: 39
review: 39-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "The step 15 split records the move before the re-score stop, and step 16 never holds for that stop, so at the default `block` an engineer-raised two-level re-score is re-enqueued without the named human"
  - id: WR-01
    severity: warning
    disposition: open
    title: "At `notify`/`off`, the used-up stop no longer stops, but no legal move is left and the \"never retry in a loop\" bound still reads as unconditional"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The `models` row of the config field table still states the old level pins"
  - id: IN-01
    severity: info
    disposition: open
    title: "The iteration-2 disposition still states the reverted `3572 3381` ceiling and a WARN the role no longer trips"
  - id: IN-02
    severity: info
    disposition: open
    title: "\"Only at `context.human_admission: all` does admission check that stamp\" leaves out the two other cases where admission gates the finding"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The WR-13 stops are unconditional in step 15 but tagged `escalate_unadjudicable_result` in the stop conditions, which is the contradiction WR-16 just fixed for another cell"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "At `notify`, step 15 makes the move with no record, so `notify` behaves exactly like `off`"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The new `tech-lead.md` ceiling was measured at an intermediate size; the shipped file already trips its WARN tier, and the comment misstates the size"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Step 16's \"After a gate failure at `block`\" needs a fact step 14 never records: the `failed-attempt` note is \"the same note\" for an engineer block and a gate block"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "\"On an escalation\" in the WF04 board moves now means two different things"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The role's new Reads line cites Workflow 04 by step number, and no test ties those numbers to the blocked-ticket steps"
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
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Workflow 04's escalation steps re-enqueue an exhausted gate without the named-human confirmation its stop condition requires"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "The rubric scores \"the dev plan\", but the Tech Lead scores before it writes the dev plan"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "The Designer reads no existing design in a brownfield repository"
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
open: 9
total: 28
recorded: 2026-10-30T16:00:36.510Z
---

# Phase 39: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| WR-03 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-04 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-05 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-06 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| IN-03 | info | fixed | 39-REVIEW-FIX.md (not in the current review) |
| IN-04 | info | fixed | 39-REVIEW-FIX.md (not in the current review) |
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
| CR-02 | critical | fixed | plan 39-12 (a1fd04dd) (not in the current review) |
| WR-07 | warning | fixed | plan 39-12 (34f92ff7) (not in the current review) |
| WR-08 | warning | fixed | plan 39-11 (78c07a10) (not in the current review) |
| WR-09 | warning | fixed | plan 39-13 (b5a82cf9) (not in the current review) |
| WR-10 | warning | fixed | plan 39-13 (b5a82cf9) (not in the current review) |
| IN-05 | info | deferred | deferred to Phase 41 (orchestrator flow): no gap fix changes the coordinator adapter; its warn tier or a shorter grant rendering is decided where the next grant change lands (not in the current review) |
| IN-06 | info | deferred | deferred to Phase 40 (plain-language role rewrite): naming the role that moves an XL ticket out of `Ready for Dev` adds a board move, and Phase 40's role-rule inventory treats board-move ownership as a partition (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
