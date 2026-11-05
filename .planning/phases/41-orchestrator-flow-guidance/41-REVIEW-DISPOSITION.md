---
phase: 41
review: 41-REVIEW.md
titles: json
findings:
  - id: CR-02
    severity: critical
    disposition: open
    title: "Any role can retire a human-disposed security finding with an unstamped note, under `human_admission: all`"
  - id: CR-03
    severity: critical
    disposition: open
    title: "No scripted host can write a green gate verdict, so `§14-gate#<id>` findings and every `artifact-ref` are refused on every host"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`claim` accepts a subtask that `done` will refuse, and `done` exit 2 has no instruction"
  - id: WR-06
    severity: warning
    disposition: open
    title: "A re-queued subtask has no naming rule, and the natural name stops the Orchestrator"
  - id: WR-07
    severity: warning
    disposition: open
    title: "`sweep` silently replaces an existing `pending/<task>.md`"
  - id: WR-08
    severity: warning
    disposition: open
    title: "A new sentence changes who the pronoun means, so `factory.config.md` says the Orchestrator makes the hand-back"
  - id: WR-09
    severity: warning
    disposition: open
    title: "An I/O failure in the writer prints `refused`, exit 1, and tells the role to change a sound note"
  - id: WR-10
    severity: warning
    disposition: open
    title: "A link on `.grugops/audit` sends the audit ledger outside the repository, exit 0"
  - id: WR-11
    severity: warning
    disposition: open
    title: "Workflow 17 says a later sweep reclaims a row with an empty `by`, but a stray file or an unsafe name is never reclaimed"
  - id: WR-12
    severity: warning
    disposition: open
    title: "Workflows 16 and 17 name a read route no role on a host can run, and the full note text is only in the unfiltered `notes/` folder"
  - id: WR-13
    severity: warning
    disposition: open
    title: "Under an active dial, a spawned high-severity role has no route to admit a finding, even with a real human answer"
  - id: IN-02
    severity: info
    disposition: open
    title: "`--level` is not tied to the adapter"
  - id: IN-03
    severity: info
    disposition: open
    title: "The `not-done` line is silent about sealed notes older than the claim"
  - id: IN-04
    severity: info
    disposition: open
    title: "Three descriptions of the subtask file disagree"
  - id: IN-05
    severity: info
    disposition: open
    title: "The role-switch step lost its condition"
  - id: IN-06
    severity: info
    disposition: open
    title: "The render banner names a path that does not exist in the kit repository"
  - id: IN-07
    severity: info
    disposition: open
    title: "The render is no longer single-writer"
  - id: IN-09
    severity: info
    disposition: open
    title: "The `index.md` banner on a host names a program no host has"
  - id: IN-10
    severity: info
    disposition: open
    title: "A body that opens with two dashes stops the role"
  - id: IN-11
    severity: info
    disposition: open
    title: "The README says `note.js` applies the same admission rules as the kit"
  - id: IN-12
    severity: info
    disposition: open
    title: "Two comments no longer match the code"
  - id: IN-13
    severity: info
    disposition: open
    title: "Workflow 16 does not carry WR-01's exit 1 fix to `note.js`"
  - id: CR-01
    severity: critical
    disposition: open
    title: "A spawned role agent cannot write the sealed note that `done` requires, so tasks stay claimed on Claude Code too"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Workflow 17 has no route on the minimal and plugin-only installs, and a missing tool exits 1"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Stop precedence line 1 takes away the limit on revert hand-offs"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "After a crash, a claim younger than the TTL holds its slot for the whole session"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "A claim directory with a missing or unreadable record holds a slot forever and shows nowhere"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "`queue.claim_cap` no longer does anything"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "The D-04 note overstates what prevents an over-spawn"
open: 23
total: 29
recorded: 2026-11-05T15:17:13.500Z
---

# Phase 41: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-02 | critical | open | - |
| CR-03 | critical | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| WR-09 | warning | open | - |
| WR-10 | warning | open | - |
| WR-11 | warning | open | - |
| WR-12 | warning | open | - |
| WR-13 | warning | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |
| IN-11 | info | open | - |
| IN-12 | info | open | - |
| IN-13 | info | open | - |
| CR-01 | critical | open | 41-07, 41-09, 41-11, 41-12; live run pending (not in the current review) |
| WR-01 | warning | fixed | 41-09, 41-11 (not in the current review) |
| WR-02 | warning | fixed | 41-08 (not in the current review) |
| WR-03 | warning | fixed | 41-11 (not in the current review) |
| WR-04 | warning | fixed | 41-10 (not in the current review) |
| IN-01 | info | fixed | 41-08 (not in the current review) |
| IN-08 | info | fixed | 41-11 (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
