---
phase: 38
review: 38-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Moving an `_Updated:` line that opens an HTML comment uncomments board lines and turns them into live ticket rows"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The pre-check misses destination collisions the planner can already see, so they fail mid-commit"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "An undo after the trace render leaves rendered files behind, so the repository is not as it was"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The context archive moves the live folder of a reopened ticket"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "After an incomplete undo, the same run keeps seeding and installing into the half-moved tree"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "User file names reach the terminal unsanitized on the commit, undo and staging failure paths"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "After a successful run, the leftover-staging note says \"nothing reads it\", but the directory blocks every later run"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "The printed re-run command drops `--archive-done-context`"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "The docs claim a failed migrate leaves the repository as it was, and that no layout marker is written"
  - id: IN-01
    severity: info
    disposition: open
    title: "`parseNfrIndex` is embedded but never used"
  - id: IN-02
    severity: info
    disposition: open
    title: "A literal invisible U+FEFF in the source"
  - id: IN-03
    severity: info
    disposition: open
    title: "The docs say the traceability matrix is \"split\", while the code archives it and renders a fresh trace"
  - id: IN-04
    severity: info
    disposition: open
    title: "Removing a trailing `_Updated:` line drops the board's final newline"
  - id: IN-05
    severity: info
    disposition: open
    title: "Duplicate refusal for a linked `.grugops/context/` with `--archive-done-context`"
open: 5
total: 14
recorded: 2026-10-28T20:49:31.810Z
---

# Phase 38: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 38-REVIEW-FIX.md |
| WR-01 | warning | fixed | 38-REVIEW-FIX.md |
| WR-02 | warning | fixed | 38-REVIEW-FIX.md |
| WR-03 | warning | fixed | 38-REVIEW-FIX.md |
| WR-04 | warning | fixed | 38-REVIEW-FIX.md |
| WR-05 | warning | fixed | 38-REVIEW-FIX.md |
| WR-06 | warning | fixed | 38-REVIEW-FIX.md |
| WR-07 | warning | fixed | 38-REVIEW-FIX.md |
| WR-08 | warning | fixed | 38-REVIEW-FIX.md |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
