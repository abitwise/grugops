---
phase: 40
review: 40-REVIEW.md
titles: json
findings:
  - id: CR-03
    severity: critical
    disposition: open
    title: "The stand-in still admits a new merge-permitting sentence in `## Hard limits` with no row"
  - id: CR-04
    severity: critical
    disposition: open
    title: "A `40-20.md` row pre-approves deleting the safety sentence it records, and both gates stay green"
  - id: WR-07
    severity: warning
    disposition: open
    title: "Rule 6 misses a move written as two code spans around an arrow, or as \"from `X` to `Y`\""
  - id: WR-08
    severity: warning
    disposition: open
    title: "The Orchestrator's close now depends on a checkpoint whose shipped definition does not require a human for a clean pass"
  - id: WR-09
    severity: warning
    disposition: open
    title: "The UAT Planner and Workflow 06's first paragraph still require a named human unconditionally, which contradicts the dial text added in this round"
  - id: IN-05
    severity: info
    disposition: open
    title: "The IN-01 content check passes silently with a NOTE when the history is shallow"
  - id: IN-06
    severity: info
    disposition: open
    title: "The fact patterns were widened to fit the normalized form, which also loosens the baseline floor"
  - id: IN-07
    severity: info
    disposition: open
    title: "The admission hook's verified closure now includes the inventory gate"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "A safety sentence reworded to allow merging keeps its fact, so the D-30 stand-in admits it with no human row"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The CR-02 lean-close conditions are pinned only by tokens, and six roles' new safety facts have no baseline"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The partition guard reads only backtick spans that use `→`, so a gate-skipping move written with `->` or in prose is invisible"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "Workflow 06 still says \"The lean path straight to `Done` is unchanged\", and its dial text conflicts with the Orchestrator's unconditional sign-off"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "`check()` checks the baseline's `source_commit` but not its contents"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "Stale header text in `check-role-rules.ts`"
  - id: IN-03
    severity: info
    disposition: fixed
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
open: 8
total: 20
recorded: 2026-11-03T10:45:25.945Z
---

# Phase 40: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-03 | critical | open | - |
| CR-04 | critical | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| WR-09 | warning | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| CR-01 | critical | fixed | plans 40-19, 40-20, 40-21: carriesSafetyFact from SAFETY_RULE_FACTS with the parity case (check-role-rules.test.ts CR-01 round 2); the D-30 stand-in refuses fact-bearing role clauses on both admission points and both sides (check-diff-disposition.test.ts "CR-01 round 2", 12 passed, the shared-clone case red on the verifier's reword); the rewrite's own safety clauses on rows in docs/audit/29-style-dispositions/40-20.md, read by the named human Olger; node scripts/check-diff-disposition.js exit 0 with 62 role clauses held back (not in the current review) |
| WR-01 | warning | fixed | plan 40-17: exact-sentence pins on the orchestrator close and hold, with the reviewer's mutation red (tier-kit-text.test.ts WR-01 describe; -t "WR-01\|WR-03\|dial" 28 passed). The second floor for facts gained in Phase 40 is deferred by the human's instruction to pick the smaller mechanism (deferred-items.md, gap round 2) (not in the current review) |
| WR-02 | warning | fixed | plan 40-18: rule 6 names ASCII-arrow spans and prose board moves (check-role-rules.test.ts partition rule 6 WR-02 cases; -t "CR-01 round 2\|IN-01\|IN-03\|WR-02\|kind" 22 passed); node scripts/check-role-rules.js exit 0 (not in the current review) |
| WR-03 | warning | fixed | plan 40-17: Workflow 06 lean close stops at the same checkpoint and never loses the human merge; orchestrator.md close follows the dial; negative pin extended (tier-kit-text.test.ts WR-03 and dial cases, 28 passed); rows in docs/audit/29-style-dispositions/40-17.md; check-diff-disposition exit 0 (not in the current review) |
| IN-01 | info | fixed | plan 40-19: check() compares the baseline JSON with a git derivation when reachable (check-role-rules.test.ts IN-01 clone cases, in the 22 passed); node scripts/check-role-rules.js exit 0 (not in the current review) |
| IN-02 | info | fixed | plan 40-18: header says six rules and two declared lists; FACT_KINDS subset case (check-role-rules.test.ts kind floor IN-02 cases, in the 22 passed) (not in the current review) |
| IN-03 | info | fixed | plan 40-19: `-z` listing and `<sha>:./<path>` reads (check-role-rules.test.ts IN-03 case, in the 22 passed) (not in the current review) |
| CR-02 | critical | fixed | plan 40-13: the lean close needs the named human's sign-off and a human merge; lean DoD gains the merge item; tier-kit-text.test.ts CR-02 pins (not in the current review) |
| WR-04 | warning | fixed | plan 40-12: role `## Stop when` in FROZEN_SECTION_ANCHORS; check-diff-disposition.test.ts WR-04 describe (not in the current review) |
| WR-05 | warning | fixed | plan 40-11: git-object writer pinned to PHASE_40_START_COMMIT; foreign source_commit refused; check-role-rules.test.ts WR-05 describe (not in the current review) |
| WR-06 | warning | fixed | plan 40-16: the 31 retired frozen-section findings listed in docs/audit/40-disposition-base-move.md and read by the named human Olger, who accepted all 31 on 2026-11-02 (not in the current review) |
| IN-04 | info | fixed | plan 40-12: ROLE_STANDIN_SCRIPT pin and duplicate refusal; check-diff-disposition.test.ts IN-04 cases (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
