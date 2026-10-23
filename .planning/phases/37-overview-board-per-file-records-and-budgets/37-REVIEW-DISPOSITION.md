---
phase: 37
review: 37-REVIEW.md
titles: json
findings:
  - id: CR-03
    severity: critical
    disposition: open
    title: "A dangling `notes` symlink reads as \"no notes\", so the render removes the ticket's trace file (exit 0) and both checks then say fresh"
  - id: CR-04
    severity: critical
    disposition: open
    title: "A task directory that is a symbolic link is dropped without a count or a name, so its tickets' trace files are removed (exit 0) and the checks say fresh"
  - id: WR-07
    severity: warning
    disposition: open
    title: "The build stamp hashes only the generated regions, so runnables whose hand-written parts differ count as \"built together\""
  - id: WR-08
    severity: warning
    disposition: open
    title: "SCAN-1 is not closed: the hand-trace patterns still need the word \"traceability\" or \"trace row/matrix/column\""
  - id: WR-09
    severity: warning
    disposition: open
    title: "The Gap 3 rewording reintroduces the contradiction it was meant to remove (WF02), and WF03 drops the ticket-id condition"
  - id: WR-10
    severity: warning
    disposition: open
    title: "AUTH-1 is still split: the trace keeps its own reserved-prefix set, so board tickets with those prefixes never get a trace file"
  - id: IN-06
    severity: info
    disposition: open
    title: "The context-io comment says `throwIfNoEntry: false` returns undefined \"for a missing path only\"; it also does so for ENOTDIR"
  - id: IN-07
    severity: info
    disposition: open
    title: "Write-phase refusals say \"The trace render did not run\" after files were removed, and a write failure does not name the removals"
  - id: IN-08
    severity: info
    disposition: open
    title: "Refs the board refuses as tickets now fall into the Requirement column"
  - id: IN-09
    severity: info
    disposition: open
    title: "A context-root directory with a name `assertSafeTask` refuses now blocks every render (exit 2)"
  - id: IN-10
    severity: info
    disposition: open
    title: "state-check and trace-render disagree on a dangling context-root link"
open: 11
total: 11
recorded: 2026-10-23T17:38:21.367Z
---

# Phase 37: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-03 | critical | open | - |
| CR-04 | critical | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| WR-09 | warning | open | - |
| WR-10 | warning | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
