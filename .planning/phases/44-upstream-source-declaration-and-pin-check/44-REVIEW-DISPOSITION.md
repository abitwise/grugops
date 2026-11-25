---
phase: 44
review: 44-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "A manifest path can forge the fence's blob id, so upstream text can close the fence early"
  - id: CR-02
    severity: critical
    disposition: open
    title: "Upstream-controlled cell text is printed with no fence, and Workflow 20 has it copied into BLOCKED reasons"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The partial-clone (lazy fetch) guard runs after the first object read and misses `extensions.partialClone`"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Reserving `BR` silently drops trace rows for existing `BR-<n>` tickets"
  - id: WR-03
    severity: warning
    disposition: open
    title: "After an upgrade install, `upstream:` refs silently vanish from traces and nothing reports the program mismatch"
  - id: WR-04
    severity: warning
    disposition: open
    title: "The contract does not say that every listed path must be a regular file at the pin, though `check` makes the whole source UNKNOWN when one is not"
  - id: IN-01
    severity: info
    disposition: open
    title: "`classifyRef` routes malformed `upstream:` refs to Requirement with no grammar check"
  - id: IN-02
    severity: info
    disposition: open
    title: "`read --manifest` refuses an oversized, NUL-bearing or non-UTF-8 manifest with exit 2, not the exit-1 refusal the contract lists"
  - id: IN-03
    severity: info
    disposition: open
    title: "The header labels the check-output contract \"D-12\"; the pin states are D-13"
  - id: IN-04
    severity: info
    disposition: open
    title: "`statSync(real)` outside the per-source handler can end the whole `check` report"
  - id: IN-05
    severity: info
    disposition: open
    title: "`owns.prefixes` is validated but never applied to reads or refs"
  - id: IN-06
    severity: info
    disposition: open
    title: "The partial-clone test depends on the host git version"
  - id: IN-07
    severity: info
    disposition: open
    title: "Large listed-path sweeps fail with misleading reasons"
open: 13
total: 13
recorded: 2026-11-25T11:00:01.717Z
---

# Phase 44: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| CR-02 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
