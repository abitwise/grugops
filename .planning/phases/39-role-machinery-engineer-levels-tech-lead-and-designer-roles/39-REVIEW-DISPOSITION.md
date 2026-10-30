---
phase: 39
review: 39-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "The Designer has no shell, so it cannot read or publish the notes that are its whole output"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Workflow 04's escalation steps re-enqueue an exhausted gate without the named-human confirmation its stop condition requires"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The Tech Lead's re-plan loop has no bound, and a re-score is an uncounted second escalation"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The junior stop rule names four of the seven F3 = 2 tags and none of the F3 = 1 tags"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The three level adapters have near-identical routing descriptions, so auto-delegation can pick junior outside the Tech Lead path"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "The engineer's escalation trigger (\"the gate fails a second time\") disagrees with Workflow 04 and the self-fix dial"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "Routing-matrix entry \"plan -> Tech Lead\" collides with product planning"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The retired-adapter report is silent for installs whose ledger is not `ok` or predates kit-file records, while the README says those installs are covered"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "The rubric scores \"the dev plan\", but the Tech Lead scores before it writes the dev plan"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "The Designer reads no existing design in a brownfield repository"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The two lists of run-time settings that flatten the levels disagree, and the text is not single-sourced"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "No changelog entry for a release-visible, partly breaking change"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Stale docblock in `tieredCorpusRefusals`"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "`LEVEL_COUNT` is called a two-sided pin, but only tests read it"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The held-record carry in `reportStaleKitAdapters` repeats an existing carry"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "A non-ENOENT `lstat` error is reported as a user-edited adapter"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The coordinator adapter is now past the warn tier"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The XL / file-plan split stop names no owner for leaving `Ready for Dev`"
open: 0
total: 18
recorded: 2026-10-30T01:10:40.204Z
---

# Phase 39: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | plan 39-11 (0a94175f) |
| CR-02 | critical | fixed | plan 39-12 (a1fd04dd) |
| WR-01 | warning | fixed | plan 39-12 (34f92ff7) |
| WR-02 | warning | fixed | plan 39-12 (e0fdc899) |
| WR-03 | warning | fixed | plan 39-11 (de619b57) |
| WR-04 | warning | fixed | plan 39-12 (e0fdc899) |
| WR-05 | warning | fixed | plan 39-12 (e0fdc899) |
| WR-06 | warning | fixed | plan 39-13 (6368128f) |
| WR-07 | warning | fixed | plan 39-12 (34f92ff7) |
| WR-08 | warning | fixed | plan 39-11 (78c07a10) |
| WR-09 | warning | fixed | plan 39-13 (b5a82cf9) |
| WR-10 | warning | fixed | plan 39-13 (b5a82cf9) |
| IN-01 | info | fixed | plan 39-11 (de619b57) |
| IN-02 | info | fixed | plan 39-11 (de619b57) |
| IN-03 | info | fixed | plan 39-13 (6368128f) |
| IN-04 | info | deferred | deferred to Phase 42 doctor work: a permission-fault fixture breaks every other adapter read in the same install or `--check` run, so the case cannot be isolated without a test seam in install.ts; the mis-wording is info-level and names no deletion |
| IN-05 | info | deferred | deferred to Phase 41 (orchestrator flow): no gap fix changes the coordinator adapter; its warn tier or a shorter grant rendering is decided where the next grant change lands |
| IN-06 | info | deferred | deferred to Phase 40 (plain-language role rewrite): naming the role that moves an XL ticket out of `Ready for Dev` adds a board move, and Phase 40's role-rule inventory treats board-move ownership as a partition |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
