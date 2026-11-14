---
phase: 41
review: 41-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The IN-02 fix cites \"41-19.md lines 49-50\", but this commit moved those rows to lines 48-49"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "41-28's lead-in \"**No accepted row is superseded.**\" is still present tense, and the new next sentence contradicts it"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The residuals' Ruling of 2026-11-14 still quotes only the untyped `pass`, so the authoritative record does not show the typed-name confirmation"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The WR-02 edits broke the files' hard wrap; long joined lines now appear in 14 files"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "\"the Workflow 17 line 86 row\" does not name one row, because 41-11 holds five rows at that line"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "41-08.md, which this delta touched, still has the present-tense \"stays pending\" paragraph, and the known-out-of-scope list leaves it out"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "The superseded rows cite test 15 as their ruling, but test 15 as recorded never put those rows to Olger"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "Residual R-41-11 and the security log still describe Olger's read of the rewritten row as owed"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "The standalone Orchestrator adapter still declares the plugin-only tool (carried forward; outside scope)"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The 2026-11-10 ruling still says no human has accepted R-41-09 (c) (carried forward; outside scope)"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The in-script refusal message still names an \"un-forgeable\" Claude Code hook on every install (outside scope)"
  - id: IN-07
    severity: info
    disposition: deferred
    title: "\"Binds the witnessing human's name\" means the session approver, not the witness"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Workflow 06 and the changelog say a plugin install binds the witness's name with no condition; at the default dial it binds nothing"
  - id: WR-16
    severity: warning
    disposition: deferred
    title: "Exit 1 still covers two refusals that say nothing about the note, and the changelog says it no longer does"
  - id: WR-17
    severity: warning
    disposition: deferred
    title: "Every exit-2 refusal raised before the write now says \"The note may have been written; check notes/\""
  - id: WR-18
    severity: warning
    disposition: fixed
    title: "The new route text says \"on Claude Code\", but only a plugin install has `propose_note` and the hook"
  - id: WR-19
    severity: warning
    disposition: fixed
    title: "Session start tells the Orchestrator to re-spawn a claim the sweep kept, and doing so strands the newer subtask"
  - id: IN-16
    severity: info
    disposition: deferred
    title: "`claim` still accepts a subtask `done` will refuse: one above the 1 MiB record ceiling"
  - id: IN-17
    severity: info
    disposition: deferred
    title: "`note.js read` ends each error line with \"No note was written.\""
  - id: IN-18
    severity: info
    disposition: deferred
    title: "`read` of a mistyped folder reads as an empty context, and files without `.md` are not named"
  - id: IN-19
    severity: info
    disposition: fixed
    title: "The role-switch protocol still sends deliverables to `artifact-ref`, which every host refuses"
  - id: IN-20
    severity: info
    disposition: fixed
    title: "Workflow 05's escape-hatch paragraph still promises the real stamp from the Step-4 loop on a host"
  - id: CR-03
    severity: critical
    disposition: fixed
    title: "No scripted host can write a green gate verdict, so `§14-gate#<id>` findings and every `artifact-ref` are refused on every host (carried forward)"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "A duplicate green verdict can no longer be cleared by any sanctioned route, and the refusal says a named human will resolve it"
  - id: WR-15
    severity: warning
    disposition: fixed
    title: "The changelog and Workflow 16 state the supersession rules without the limits R-41-09 records (confirms the 2026-11-08 audit flag)"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "An exit-1 `refused` line still covers I/O faults, and plan 41-13 adds a second exit-1 class that means \"stop\" (carried forward)"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "A link on `.grugops/audit` still sends the audit ledger outside the repository (carried forward)"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "Workflows 16 and 17 name a read route no role on a host can run (carried forward)"
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "Under an active dial, a spawned high-severity role has no route to admit a finding (carried forward)"
  - id: IN-14
    severity: info
    disposition: fixed
    title: "The text says an undeterminable `HOME` refuses every note, but a named root with a configuration still admits"
  - id: IN-15
    severity: info
    disposition: fixed
    title: "The root refusal and its stop name a cause narrower than the code's, and the refusal is labelled `trustedRepoRoot` when `governanceRootOf` throws it"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "The `index.md` banner on a host names a program no host has (carried forward)"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "A body that opens with two dashes stops the role (carried forward)"
  - id: IN-13
    severity: info
    disposition: fixed
    title: "Workflow 16 does not carry WR-01's exit 1 fix to `note.js` (carried forward)"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Any role can retire a human-disposed security finding with an unstamped note, under `human_admission: all`"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "A re-queued subtask has no naming rule, and the natural name stops the Orchestrator"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "`sweep` silently replaces an existing `pending/<task>.md`"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "A new sentence changes who the pronoun means, so `factory.config.md` says the Orchestrator makes the hand-back"
  - id: WR-11
    severity: warning
    disposition: fixed
    title: "Workflow 17 says a later sweep reclaims a row with an empty `by`, but a stray file or an unsafe name is never reclaimed"
  - id: IN-11
    severity: info
    disposition: fixed
    title: "The README says `note.js` applies the same admission rules as the kit"
  - id: IN-12
    severity: info
    disposition: fixed
    title: "Two comments no longer match the code"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "The D-04 note overstates what prevents an over-spawn"
open: 0
total: 42
recorded: 2026-11-14T21:40:39.656Z
---

# Phase 41: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| WR-02 | warning | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| WR-03 | warning | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| IN-01 | info | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| IN-02 | info | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| IN-03 | info | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (second review) |
| WR-04 | warning | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (41-UAT.md, after test 15) (not in the current review) |
| WR-05 | warning | fixed | Fixed 2026-11-14 as record text on Olger's ruling 'Fix all six now' (41-UAT.md, after test 15) (not in the current review) |
| IN-04 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 11, 2026-11-13 (not in the current review) |
| IN-05 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 11, 2026-11-13 (not in the current review) |
| IN-06 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 11, 2026-11-13 (not in the current review) |
| IN-07 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 11, 2026-11-13 (not in the current review) |
| CR-01 | critical | fixed | 41-28 (not in the current review) |
| WR-16 | warning | deferred | Deferred to a later phase by Olger in 41-UAT.md test 9, 2026-11-12: code change, gap-round cap reached (not in the current review) |
| WR-17 | warning | deferred | Deferred to a later phase by Olger in 41-UAT.md test 9, 2026-11-12: code change, gap-round cap reached (not in the current review) |
| WR-18 | warning | fixed | 41-26, 41-27 (not in the current review) |
| WR-19 | warning | fixed | 41-26 (not in the current review) |
| IN-16 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 9, 2026-11-12: code change, gap-round cap reached (not in the current review) |
| IN-17 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 9, 2026-11-12: code change, gap-round cap reached (not in the current review) |
| IN-18 | info | deferred | Deferred to a later phase by Olger in 41-UAT.md test 9, 2026-11-12: code change, gap-round cap reached (not in the current review) |
| IN-19 | info | fixed | 41-26 (not in the current review) |
| IN-20 | info | fixed | 41-26 (not in the current review) |
| CR-03 | critical | fixed | 41-23 (not in the current review) |
| WR-14 | warning | fixed | 41-20 (not in the current review) |
| WR-15 | warning | fixed | 41-24 (not in the current review) |
| WR-09 | warning | fixed | 41-21 (not in the current review) |
| WR-10 | warning | fixed | 41-21 (not in the current review) |
| WR-12 | warning | fixed | 41-22 (not in the current review) |
| WR-13 | warning | fixed | 41-23 (not in the current review) |
| IN-14 | info | fixed | 41-24 (not in the current review) |
| IN-15 | info | fixed | 41-21 (not in the current review) |
| IN-09 | info | fixed | 41-20 (not in the current review) |
| IN-10 | info | fixed | 41-21 (not in the current review) |
| IN-13 | info | fixed | 41-21 (not in the current review) |
| CR-02 | critical | fixed | 41-15, 41-16 (not in the current review) |
| WR-06 | warning | fixed | 41-19 (not in the current review) |
| WR-07 | warning | fixed | 41-19 (not in the current review) |
| WR-08 | warning | fixed | 41-24 (not in the current review) |
| WR-11 | warning | fixed | 41-19 (not in the current review) |
| IN-11 | info | fixed | 41-22 (not in the current review) |
| IN-12 | info | fixed | 41-19 (not in the current review) |
| IN-08 | info | fixed | 41-11 (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
