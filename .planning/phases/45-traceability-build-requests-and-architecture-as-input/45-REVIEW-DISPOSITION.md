---
phase: 45
review: 45-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "A future-dated build request never escalates: negative wait ages pass silently"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Build-request numbering has no guard against two parallel BA/PM subtasks taking the same number"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The unblock rule ignores a ticket's other blockers"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Workflow 00 step 1 writes into `greenfield-plan.md` before step 2 drafts that file"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The new date-relative tests can fail at UTC midnight"
  - id: IN-01
    severity: info
    disposition: open
    title: "The config doc overstates which requests print `UNKNOWN - verify` when no source is declared"
  - id: IN-02
    severity: info
    disposition: open
    title: "The report contract claims every printed value is grammar-checked, but `UNKNOWN - verify` reasons are not"
  - id: IN-03
    severity: info
    disposition: open
    title: "The validator prints git-derived reasons unsanitized, unlike the runnable"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`stateConfigAbs` silently falls back to the working directory"
  - id: IN-05
    severity: info
    disposition: open
    title: "The validator and state-check do not run the grammar on a build-request file over 64 KiB"
  - id: IN-06
    severity: info
    disposition: open
    title: "A frontmatter line of only VT or FF skips the control-character refusal"
  - id: IN-07
    severity: info
    disposition: open
    title: "The ancestry read trusts the upstream checkout's commit-graph"
  - id: IN-08
    severity: info
    disposition: open
    title: "The `answered` pin is never compared with the declared pin"
  - id: IN-09
    severity: info
    disposition: open
    title: "The ADR status vocabulary mixes cases"
open: 13
total: 14
recorded: 2026-11-26T13:43:50.671Z
---

# Phase 45: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | fixed | commit 5424515f (validator no longer reads GOVERNANCE_CONFIG_CANDIDATE_KINDS; a null position is an ERROR) |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
