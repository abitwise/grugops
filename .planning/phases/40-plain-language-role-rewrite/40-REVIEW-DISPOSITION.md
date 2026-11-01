---
phase: 40
review: 40-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "The merge, deploy and named-human bans in role `## Hard limits` are no longer protected by any gate"
  - id: CR-02
    severity: critical
    disposition: open
    title: "The Orchestrator's lean close `In UAT → Done` no longer needs a human merge or the named-human UAT sign-off"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The board-move partition guard admits moves that skip gates"
  - id: WR-02
    severity: warning
    disposition: open
    title: "In lean mode, two roles exit `In UAT` with conditions that do not exclude each other"
  - id: WR-03
    severity: warning
    disposition: open
    title: "New `## Stop when` bullets imply backward board moves that no role owns"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Human-stop rules moved out of the frozen `## Hard limits` region into `## Stop when`, which nothing freezes"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The pre-rewrite baseline can be laundered with one command, and the equality test stays green"
  - id: WR-06
    severity: warning
    disposition: open
    title: "The base move retired 23 undispositioned workflow safety-section changes that nobody read"
  - id: IN-01
    severity: info
    disposition: open
    title: "Shipped kit text cites internal planning ids and describes blocks that no longer exist"
  - id: IN-02
    severity: info
    disposition: open
    title: "The fact parser and the partition parser read `→` differently"
  - id: IN-03
    severity: info
    disposition: open
    title: "The fixture comment still says \"8 prefix-matched section checks\""
  - id: IN-04
    severity: info
    disposition: open
    title: "The gate checks `role_standin` only for form, not for the expected value, and ignores duplicates"
open: 12
total: 12
recorded: 2026-11-01T18:03:49.599Z
---

# Phase 40: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| CR-02 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
