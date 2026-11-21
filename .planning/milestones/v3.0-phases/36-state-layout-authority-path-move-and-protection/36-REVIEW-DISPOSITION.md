---
phase: 36
review: 36-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The old-spelling gate does not count the pre-v3 root as a final path segment, or after an underscore"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`check-state-paths` scans the cwd's subtree, not the repository, and passes vacuously from a subdirectory"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The uninstall \"preserved (never touched)\" banner now lists `.grugops/`, then reports removing the marker inside it"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "The refusal's printed remedy is a no-op on a two-root (v2.x) pre-v3 repository, and no test pins the gap"
  - id: IN-01
    severity: info
    disposition: open
    title: "The doctor FAILs \"board missing\" when the pre-v3 root is unreadable, against D-07's never-FAIL rule"
  - id: IN-02
    severity: info
    disposition: open
    title: "trace-render's message names `TRACEABILITY_REL` whatever directory it actually wrote, and the file name is spelled twice"
  - id: IN-03
    severity: info
    disposition: open
    title: "The STATE_ROOT_COUNT \"discriminates\" case tests `===`, not the code"
  - id: IN-04
    severity: info
    disposition: open
    title: "The scan counts a tracked dangling symlink as \"not on disk\" and never scans the link text"
open: 7
total: 8
recorded: 2026-10-21T12:16:13.493Z
---

# Phase 36: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | deferred | Phase 38 owns it: ROADMAP Phase 38 SC 6 and MIGRATE-04 name the v2.x two-root case (UAT decision 2026-10-21) |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
