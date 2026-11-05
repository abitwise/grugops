---
phase: 41
review: 41-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "A spawned role agent cannot write the sealed note that `done` requires, so tasks stay claimed on Claude Code too"
  - id: WR-01
    severity: warning
    disposition: open
    title: "Workflow 17 has no route on the minimal and plugin-only installs, and a missing tool exits 1"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Stop precedence line 1 takes away the limit on revert hand-offs"
  - id: WR-03
    severity: warning
    disposition: open
    title: "After a crash, a claim younger than the TTL holds its slot for the whole session"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "A claim directory with a missing or unreadable record holds a slot forever and shows nowhere"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`claim` accepts a subtask that `done` will refuse, and `done` exit 2 has no instruction"
  - id: WR-06
    severity: warning
    disposition: open
    title: "A re-queued subtask has no naming rule, and the natural name stops the Orchestrator"
  - id: WR-07
    severity: warning
    disposition: open
    title: "`sweep` silently replaces an existing `pending/<task>.md`"
  - id: WR-08
    severity: warning
    disposition: open
    title: "A new sentence changes who the pronoun means, so `factory.config.md` says the Orchestrator makes the hand-back"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "`queue.claim_cap` no longer does anything"
  - id: IN-02
    severity: info
    disposition: open
    title: "`--level` is not tied to the adapter"
  - id: IN-03
    severity: info
    disposition: open
    title: "The `not-done` line is silent about sealed notes older than the claim"
  - id: IN-04
    severity: info
    disposition: open
    title: "Three descriptions of the subtask file disagree"
  - id: IN-05
    severity: info
    disposition: open
    title: "The role-switch step lost its condition"
  - id: IN-06
    severity: info
    disposition: open
    title: "The render banner names a path that does not exist in the kit repository"
  - id: IN-07
    severity: info
    disposition: open
    title: "The render is no longer single-writer"
  - id: IN-08
    severity: info
    disposition: open
    title: "The D-04 note overstates what prevents an over-spawn"
open: 14
total: 17
recorded: 2026-11-05T04:17:45.222Z
---

# Phase 41: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | fixed | 41-08 |
| WR-03 | warning | open | - |
| WR-04 | warning | fixed | 41-10 |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| IN-01 | info | fixed | 41-08 |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
