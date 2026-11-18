---
phase: 43
review: 43-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "Install renames a user's own `docs/` or `examples/` folder in the kit home, and `--prune-old-kit` then deletes it"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The install guide's overlap paragraph contradicts the new overlap refusal"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The checkout's GUARANTEES.md now ships into every user's kit home, labelled as describing \"this repository\""
  - id: WR-03
    severity: warning
    disposition: open
    title: "CLAUDE.md still instructs `{ \"agent\": \"grug-orchestrator\" }`, a retired agent name, and the new gate cannot see it"
  - id: IN-01
    severity: info
    disposition: open
    title: "CHANGELOG says the story-docs gate has three checks; it has four"
  - id: IN-02
    severity: info
    disposition: open
    title: "Stale cardinality in the comment beside `PUBLIC_DOCS_SCAN_COUNT`"
  - id: IN-03
    severity: info
    disposition: open
    title: "Reference pages miss role participation that a workflow states in a different bullet shape"
  - id: IN-04
    severity: info
    disposition: open
    title: "The story-docs link check skips some link forms, so a dead link in them passes"
open: 8
total: 8
recorded: 2026-11-18T15:06:41.982Z
---

# Phase 43: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
