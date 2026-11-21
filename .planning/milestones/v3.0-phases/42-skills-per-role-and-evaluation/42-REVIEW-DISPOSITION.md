---
phase: 42
review: 42-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The link-following containment (review WR-02 fix) skips the default `skills/` folder and per-skill links, so the same escape still gives `found`"
  - id: WR-02
    severity: warning
    disposition: open
    title: "A `skills` path whose real location cannot be read is refused with a false reason (\"absolute, has a .. segment or leaves the plugin folder\")"
  - id: WR-03
    severity: warning
    disposition: open
    title: "CR-01 runs `claude --version` with the home folder as cwd and does not check that the folder exists; a missing HOME now reads \"could not be run (ENOENT)\""
  - id: WR-04
    severity: warning
    disposition: open
    title: "The CR-02 reader-stderr test depends on the length of TMPDIR: it fails when the scratch path is long"
  - id: IN-01
    severity: info
    disposition: open
    title: "The WR-01 override rule drops user folders that the set variable cannot move"
  - id: IN-02
    severity: info
    disposition: open
    title: "On Windows a rooted PATH entry with no drive (`\\tools`) counts as absolute but depends on the current drive"
  - id: IN-03
    severity: info
    disposition: open
    title: "A stray role name is cut before it is cleaned"
  - id: IN-04
    severity: info
    disposition: open
    title: "The disposition docs still say each row \"is written as `pending (named human):`\""
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "`claude --version` can execute a binary planted in the target repository (Windows cwd search; relative PATH entries on POSIX)"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Terminal escape injection: role-file bytes and reader stderr are printed raw by `--check`"
  - id: IN-05
    severity: info
    disposition: open
    title: "The case-sensitivity test asserts nothing on case-insensitive filesystems"
  - id: IN-06
    severity: info
    disposition: open
    title: "Output-cap overflow is reported as \"could not be run\""
open: 10
total: 12
recorded: 2026-11-17T12:29:59.049Z
---

# Phase 42: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| CR-01 | critical | fixed | 42-REVIEW-FIX.md (not in the current review) |
| CR-02 | critical | fixed | 42-REVIEW-FIX.md (not in the current review) |
| IN-05 | info | open | - (not in the current review) |
| IN-06 | info | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
