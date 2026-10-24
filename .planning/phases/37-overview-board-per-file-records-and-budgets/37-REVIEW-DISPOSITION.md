---
phase: 37
review: 37-REVIEW.md
titles: json
findings:
  - id: WR-12
    severity: warning
    disposition: open
    title: "Pattern 4's comma-list and `per Workflow 16` exclusions reach the whole 120-character run, so a plain list of objects aimed at the trace passes (created by the round-3 WR-11 fix)"
  - id: WR-13
    severity: warning
    disposition: open
    title: "The hand-trace scan still enumerates its verbs and nouns by hand, so common write verbs and determiner-less shapes pass (same defect class as WR-11, one register over)"
  - id: WR-14
    severity: warning
    disposition: open
    title: "The stray-entry remedy is not decided by the entry's own lstat: a non-directory context-root entry whose name falls outside the task grammar gets no remedy (IN-11 union arm)"
  - id: IN-14
    severity: info
    disposition: open
    title: "The three runnables answer \"may this state file be used\" differently at the leaf, so state-check can point at a command that exits 2"
  - id: CR-05
    severity: critical
    disposition: open
    title: "An absent context root under a link that leaves the repository root reads as \"no tasks\", so the render removes the tickets' trace files (exit 0); with the folder present, the same link is refused as outside the root"
  - id: WR-11
    severity: warning
    disposition: open
    title: "SCAN-1 recurs: pattern 4 needs one of eleven determiners directly before `trace`, and the shared verb list has no `-ing` forms, so plain hand-write instructions pass"
  - id: IN-11
    severity: info
    disposition: open
    title: "A stray regular file or FIFO at the top of a context root now blocks every render, and the remedy text names the wrong fix"
  - id: IN-12
    severity: info
    disposition: open
    title: "Two read-sites assertions are looser than the rules they state"
  - id: IN-13
    severity: info
    disposition: open
    title: "The repository boundary has four hand copies that disagree on a root ending in the separator"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "An unreadable task silently deletes its ticket's trace file, and `--check` / `state-check` then report the trace fresh"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "An unreadable context root crashes `trace-render` with exit 1 instead of exit 2"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The trace's ticket-ID shape is wider than the board's, so compliance refs become tickets and a long ref breaks the render"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "state-check says progress is ROLLABLE from a fence-blind classification that state-roll then refuses"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The board reader's traceability source still reads the old matrix shape; the new index publishes link markup as `title` and `status`"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Note files are opened through symlinks without a realpath check, so the \"root is a boundary\" claim is false for notes"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The three state runnables carry independent copies of one model and are never updated in place, so a host can run a mismatched pair"
  - id: WR-06
    severity: warning
    disposition: open
    title: "The progress-roll duplicate refusal matches by heading text, so two distinct same-heading entries block the roll, and its remedy says to delete one"
  - id: IN-01
    severity: info
    disposition: open
    title: "`stripControlChars` leaves bidi overrides and line/paragraph separators in printed values"
  - id: IN-02
    severity: info
    disposition: open
    title: "`atomicWrite` does not keep the replaced file's mode"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The validator's `directoryFindings` reads an unreachable directory as absent"
  - id: IN-04
    severity: info
    disposition: open
    title: "Rolling the final progress entry of a file with no trailing newline drops the newline of the line before it"
  - id: IN-05
    severity: info
    disposition: open
    title: "The installer writes the layout marker whenever no board exists, whatever else is already there"
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
open: 27
total: 33
recorded: 2026-10-24T15:51:45.705Z
---

# Phase 37: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-12 | warning | open | - |
| WR-13 | warning | open | - |
| WR-14 | warning | open | - |
| IN-14 | info | open | - |
| CR-05 | critical | open | - (not in the current review) |
| WR-11 | warning | open | - (not in the current review) |
| IN-11 | info | open | - (not in the current review) |
| IN-12 | info | open | - (not in the current review) |
| IN-13 | info | open | - (not in the current review) |
| CR-01 | critical | fixed | round 0; fixed by gap round 1 plan 37-21, closure confirmed by the round-1 review (not in the current review) |
| CR-02 | critical | fixed | round 0; fixed by gap round 1 plan 37-20, closure confirmed by the round-1 review (not in the current review) |
| WR-01 | warning | fixed | round 0; fixed by gap round 1 plan 37-22, closure confirmed by the round-1 review (not in the current review) |
| WR-02 | warning | fixed | round 0; fixed by gap round 1 plan 37-23, closure confirmed by the round-1 review (not in the current review) |
| WR-03 | warning | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| WR-04 | warning | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| WR-05 | warning | fixed | round 0; fixed by gap round 1 plan 37-24, closure confirmed by the round-1 review (residual reported as WR-07) (not in the current review) |
| WR-06 | warning | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| IN-01 | info | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| IN-02 | info | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| IN-03 | info | fixed | round 0; fixed by gap round 1 plan 37-26, closure confirmed by the round-1 review (not in the current review) |
| IN-04 | info | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| IN-05 | info | open | round 0; outside gap round 1 scope (D-17), still open (not in the current review) |
| CR-03 | critical | open | - (not in the current review) |
| CR-04 | critical | open | - (not in the current review) |
| WR-07 | warning | open | - (not in the current review) |
| WR-08 | warning | open | - (not in the current review) |
| WR-09 | warning | open | - (not in the current review) |
| WR-10 | warning | open | - (not in the current review) |
| IN-06 | info | open | - (not in the current review) |
| IN-07 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |
| IN-09 | info | open | - (not in the current review) |
| IN-10 | info | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
