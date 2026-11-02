---
phase: 40
review: 40-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "A safety sentence reworded to allow merging keeps its fact, so the D-30 stand-in admits it with no human row"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The CR-02 lean-close conditions are pinned only by tokens, and six roles' new safety facts have no baseline"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The partition guard reads only backtick spans that use `→`, so a gate-skipping move written with `->` or in prose is invisible"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Workflow 06 still says \"The lean path straight to `Done` is unchanged\", and its dial text conflicts with the Orchestrator's unconditional sign-off"
  - id: IN-01
    severity: info
    disposition: open
    title: "`check()` checks the baseline's `source_commit` but not its contents"
  - id: IN-02
    severity: info
    disposition: open
    title: "Stale header text in `check-role-rules.ts`"
  - id: IN-03
    severity: info
    disposition: open
    title: "`deriveAllAt` reads `git ls-tree` paths relative to the current directory, but `git show` reads them relative to the repository root"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "The Orchestrator's lean close `In UAT → Done` no longer needs a human merge or the named-human UAT sign-off"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "Human-stop rules moved out of the frozen `## Hard limits` region into `## Stop when`, which nothing freezes"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The pre-rewrite baseline can be laundered with one command, and the equality test stays green"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "The base move retired 23 undispositioned workflow safety-section changes that nobody read"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The gate checks `role_standin` only for form, not for the expected value, and ignores duplicates"
open: 7
total: 12
recorded: 2026-11-02T15:00:19.654Z
---

# Phase 40: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| CR-02 | critical | fixed | plan 40-13: the lean close needs the named human's sign-off and a human merge; lean DoD gains the merge item; tier-kit-text.test.ts CR-02 pins (not in the current review) |
| WR-04 | warning | fixed | plan 40-12: role `## Stop when` in FROZEN_SECTION_ANCHORS; check-diff-disposition.test.ts WR-04 describe (not in the current review) |
| WR-05 | warning | fixed | plan 40-11: git-object writer pinned to PHASE_40_START_COMMIT; foreign source_commit refused; check-role-rules.test.ts WR-05 describe (not in the current review) |
| WR-06 | warning | fixed | plan 40-16: the 31 retired frozen-section findings listed in docs/audit/40-disposition-base-move.md and read by the named human Olger, who accepted all 31 on 2026-11-02 (not in the current review) |
| IN-04 | info | fixed | plan 40-12: ROLE_STANDIN_SCRIPT pin and duplicate refusal; check-diff-disposition.test.ts IN-04 cases (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
