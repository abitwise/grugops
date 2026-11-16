---
phase: 42
review: 42-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "`claude --version` can execute a binary planted in the target repository (Windows cwd search; relative PATH entries on POSIX)"
  - id: CR-02
    severity: critical
    disposition: open
    title: "Terminal escape injection: role-file bytes and reader stderr are printed raw by `--check`"
  - id: WR-01
    severity: warning
    disposition: open
    title: "A set `CLAUDE_CONFIG_DIR` (or another override) still yields `ok ... found` from the default user and plugin folders"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`folderInsidePlugin` containment is lexical only, so a symlink inside the plugin escapes it (T-42-05 overstated)"
  - id: WR-03
    severity: warning
    disposition: open
    title: "One non-kebab `.md` in the roles folder disables the whole declared-skills section, with a misleading reason"
  - id: WR-04
    severity: warning
    disposition: open
    title: "On Windows an npm-installed `claude.cmd` is reported as \"`claude` was not found on PATH\""
  - id: IN-01
    severity: info
    disposition: open
    title: "Unreachable `unread` branch in `doctorDeclaredSkills`"
  - id: IN-02
    severity: info
    disposition: open
    title: "The version regex accepts a pre-release as meeting the floor"
  - id: IN-03
    severity: info
    disposition: open
    title: "docs/skills.md and install/README.md state the doctor's output slightly wrong"
  - id: IN-04
    severity: info
    disposition: open
    title: "The user-facing line claims \"the role-frontmatter guard reports this\""
  - id: IN-05
    severity: info
    disposition: open
    title: "The case-sensitivity test asserts nothing on case-insensitive filesystems"
  - id: IN-06
    severity: info
    disposition: open
    title: "Output-cap overflow is reported as \"could not be run\""
open: 12
total: 12
recorded: 2026-11-16T22:34:56.365Z
---

# Phase 42: Code Review Disposition

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

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
