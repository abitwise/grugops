---
phase: 34
review: 34-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "Host detection reads the installer's own writes as proof of use, so `pi` is reported in every re-installed repository"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Any non-directory `.pi` entry now makes every install exit 3 \"INCOMPLETE\", even for users who never use Pi"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The installer cross-checks rendered MODEL aliases against the announcement but has no effort arm (the fix lives in one arm only)"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Raw control bytes and newlines from config keys are interpolated into effort refusals that the installer and guards print"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The installer's closing safety line derives \"gets documentation only\" from `dispatch`, which is the wrong attribute"
  - id: WR-06
    severity: warning
    disposition: open
    title: "The new \"Using grugops on Pi\" section presents a working flow that backlog 999.4 records as `UNKNOWN - verify`"
  - id: WR-07
    severity: warning
    disposition: open
    title: "Phase-34 edits re-assert, and widen to Pi, a claim that \"the installer sets `GRUGOPS_PROJECT_DIR`\", which no code does"
  - id: IN-01
    severity: info
    disposition: open
    title: "Three separate implementations of \"a per-host table row\" disagree on the same bytes"
  - id: IN-02
    severity: info
    disposition: open
    title: "The validator's dispatch-map check only warns when the table is unrecognisable"
  - id: IN-03
    severity: info
    disposition: open
    title: "The Pi template is create-only, so a future change to `PI_PROMPT_TEXT` never reaches an installed repository"
  - id: IN-04
    severity: info
    disposition: open
    title: "A blank `effortRationale` now also refuses the MODEL `tiered` preset"
  - id: IN-05
    severity: info
    disposition: open
    title: "The structure validator does not validate the `models` / `models.effort` block"
open: 12
total: 12
recorded: 2026-10-07T10:51:32.089Z
---

# Phase 34: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
