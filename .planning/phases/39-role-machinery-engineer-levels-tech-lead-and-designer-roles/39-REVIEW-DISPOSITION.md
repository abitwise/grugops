---
phase: 39
review: 39-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "At `notify`/`off`, the tagged used-up stop says \"no move, no re-enqueue\" for the two re-score triggers, while step 15 says \"raise one level / keep the level as `Move: re-plan`\", and step 16 then re-enqueues (reopens the previous WR-01)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "A parked ticket has no defined way out of `Blocked`, and the one escape depends on `escalate_stale_blocker`, a cell that can also be lowered"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The used-up stop at `block` has no way to resume and no step 16 hold, and the \"human's level stands, even past the move limits\" license contradicts \"Never escalate a ticket twice\""
  - id: WR-04
    severity: warning
    disposition: open
    title: "At the re-score stop the human answers with a level, but step 16 is released by a `Confirmed: yes` finding about a move note the human never saw"
  - id: IN-01
    severity: info
    disposition: open
    title: "(carried forward, still open) The iteration-2 disposition still states the reverted `3572 3381` ceiling and a WARN the role no longer trips"
  - id: IN-02
    severity: info
    disposition: open
    title: "(carried forward, still open) \"Only at `context.human_admission: all` does admission check that stamp\" leaves out the fail-toward-gating cases"
  - id: IN-03
    severity: info
    disposition: open
    title: "`hasSentence` checks less than its comment says, and is duplicated"
  - id: CR-01
    severity: critical
    disposition: open
    title: "The step 15 split records the move before the re-score stop, and step 16 never holds for that stop, so at the default `block` an engineer-raised two-level re-score is re-enqueued without the named human"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The new `tech-lead.md` ceiling was measured at an intermediate size; the shipped file already trips its WARN tier, and the comment misstates the size"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Step 16's \"After a gate failure at `block`\" needs a fact step 14 never records: the `failed-attempt` note is \"the same note\" for an engineer block and a gate block"
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
open: 12
total: 28
recorded: 2026-10-30T20:14:53.188Z
---

# Phase 39: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| CR-01 | critical | open | - (not in the current review) |
| WR-05 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
| WR-06 | warning | fixed | 39-REVIEW-FIX.md (not in the current review) |
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
