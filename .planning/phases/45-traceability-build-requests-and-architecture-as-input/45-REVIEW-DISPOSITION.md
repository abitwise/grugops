---
phase: 45
review: 45-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "A future-dated build request never escalates: negative wait ages pass silently (carried forward)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Build-request numbering has no guard against two parallel BA/PM subtasks taking the same number (carried forward)"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Workflow 00 step 1 writes into `greenfield-plan.md` before step 2 drafts that file (carried forward)"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The date-relative tests can fail at UTC midnight (carried forward)"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The floor exception added to Workflow 00 step 1 leads to a path that cannot run at bootstrap"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "The deviation or floor-conflict mark that step 13 relies on is missing when a request is merged, and BA/PM can edit it away"
  - id: WR-08
    severity: warning
    disposition: open
    title: "Lifting a deviation's human-stop bullet leaves no record, unlike a floor conflict's"
  - id: WR-09
    severity: warning
    disposition: open
    title: "Step 12 keeps a closed request's bullet while another request is open, so the ticket escalates on the wrong clock"
  - id: IN-01
    severity: info
    disposition: open
    title: "The config doc overstates which requests print `UNKNOWN - verify` when no source is declared (carried forward)"
  - id: IN-02
    severity: info
    disposition: open
    title: "The report contract claims every printed value is grammar-checked, but `UNKNOWN - verify` reasons are not (carried forward)"
  - id: IN-03
    severity: info
    disposition: open
    title: "The validator prints git-derived reasons unsanitized, unlike the runnable (carried forward)"
  - id: IN-05
    severity: info
    disposition: open
    title: "The validator and state-check do not run the grammar on a build-request file over 64 KiB (carried forward)"
  - id: IN-06
    severity: info
    disposition: open
    title: "A frontmatter line of only VT or FF skips the control-character refusal (carried forward)"
  - id: IN-07
    severity: info
    disposition: open
    title: "The ancestry read trusts the upstream checkout's commit-graph (carried forward)"
  - id: IN-08
    severity: info
    disposition: open
    title: "The `answered` pin is never compared with the declared pin (carried forward)"
  - id: IN-09
    severity: info
    disposition: open
    title: "The ADR status vocabulary mixes cases (carried forward)"
  - id: IN-10
    severity: info
    disposition: open
    title: "The human-stop bullet's owner is a placeholder, not an owner who can clear it"
  - id: IN-11
    severity: info
    disposition: open
    title: "The human-stop example cites a raw upstream ID"
  - id: IN-12
    severity: info
    disposition: open
    title: "Step 1 has the Orchestrator confirm the human-stop bullet but gives no action when the bullet is missing"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The unblock rule ignores a ticket's other blockers"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`stateConfigAbs` silently falls back to the working directory"
open: 17
total: 21
recorded: 2026-11-26T17:49:59.621Z
---

# Phase 45: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | fixed | commit 4406d8b2 (Workflow 00 step 1 and stop bullet, Workflow 20 bootstrap bullet: a floor conflict at bootstrap files on a real ticket at step 6 and stops before step 7) |
| WR-07 | warning | fixed | commit cd31ae5d (Workflow 20 step 13 keyed on the human-stop bullet, step 3 marks a merged request, the contract keeps both marks; the step 3 and contract edits are commit a3c57814) |
| WR-08 | warning | open | - |
| WR-09 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |
| IN-11 | info | open | - |
| IN-12 | info | open | - |
| WR-03 | warning | fixed | commit 9ba0b91e (Workflow 20 step 12 and Board moves: a ticket leaves Blocked only when no other bullet remains) (not in the current review) |
| IN-04 | info | fixed | commit 5424515f (validator no longer reads GOVERNANCE_CONFIG_CANDIDATE_KINDS; a null position is an ERROR) (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
