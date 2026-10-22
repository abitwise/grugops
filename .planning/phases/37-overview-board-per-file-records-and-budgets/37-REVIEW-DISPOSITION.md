---
phase: 37
review: 37-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "An unreadable task silently deletes its ticket's trace file, and `--check` / `state-check` then report the trace fresh"
  - id: CR-02
    severity: critical
    disposition: open
    title: "An unreadable context root crashes `trace-render` with exit 1 instead of exit 2"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The trace's ticket-ID shape is wider than the board's, so compliance refs become tickets and a long ref breaks the render"
  - id: WR-02
    severity: warning
    disposition: open
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
    disposition: open
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
    disposition: open
    title: "The validator's `directoryFindings` reads an unreachable directory as absent"
  - id: IN-04
    severity: info
    disposition: open
    title: "Rolling the final progress entry of a file with no trailing newline drops the newline of the line before it"
  - id: IN-05
    severity: info
    disposition: open
    title: "The installer writes the layout marker whenever no board exists, whatever else is already there"
---

# Phase 37 — code review disposition

One row per finding in 37-REVIEW.md. All are `open` as of 2026-10-22; none has been fixed or deferred yet.

