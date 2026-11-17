---
phase: "43"
plan: "01"
subsystem: claim-registry
status: complete
tags: [claim-registry, audit, check-claim-anchors, baseline, STORY-04, D-25]
requires: []
provides:
  - "43-BASELINE.md: base commit, 14 gate exit codes, 21 failing suite tests by name"
  - "`retired` as the fifth CLAIM_STATUSES value"
  - "check-claim-anchors retired arm: absence, anchor, missing-file, safety and commit-token refusals"
  - "RETIRED_COMMIT_RE exported from scripts/check-claim-anchors.ts"
  - "Registry section: A retired claim leaves the page and keeps its row (D-25)"
affects: [43-02, 43-09, 43-11, 43-12]
tech-stack:
  added: []
  patterns:
    - "Absence check as the inverse of the unanchorable presence check (Buffer.includes on raw bytes)"
    - "Status partition before anchoredDocs, so a file holding only retired rows owes no bijection"
key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/43-BASELINE.md
  modified:
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/audit-model.test.ts
    - scripts/check-claim-anchors.ts
    - scripts/check-claim-anchors.js
    - scripts/check-claim-anchors.test.ts
    - docs/audit/28-claim-registry.md
key-decisions:
  - "The obligations exemption for `retired` lives in check-claim-anchors, beside the `dropped` one, because readRegistry never enforced disposition/finding_id; the parse only had to admit the value"
  - "An anchor left for a row retired from that same file is reported once, by the retired arm, and excluded from the bijection's `unexpected` list; a retired id anchored in a file its row does not name is still `unexpected`"
  - "The commit token is checked for form only (backticked lowercase hex, 7-40 chars); whether the commit exists is not checked, since a mirror has no git"
requirements-completed: [STORY-04]
duration: 35 min
completed: 2026-11-17
commits: 6
plan_head_before: a067c6e6e7eb2090eb44b47a0d001e622248402e
plan_head_after: 24e9e89fd5f3a463ea9ed46cfef279df18e23163
actuals:
  tokens: 12500
  tasks: 3
  commits: 6
coverage:
  - deliverable: "43-BASELINE.md records every gate's exit and last line and the full suite's failing test names at the base commit"
    human_judgment: false
    verification:
      - kind: command
        ref: "grep -c '^## Gates$' and grep -cE '^base: [0-9a-f]{40}$' on 43-BASELINE.md (both 1)"
        status: pass
  - deliverable: "A retired row passes only while its text and anchor are absent from its named file, and the PASS line counts it"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/check-claim-anchors.test.ts#check-claim-anchors: a retired row (D-25) passes only while its text and anchor are gone"
        status: pass
  - deliverable: "Refusals: retired safety row, missing file, mechanism with no backticked commit; obligations exemption; named-file-only adjacency"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/check-claim-anchors.test.ts#check-claim-anchors: the retired arm's refusals (D-25)"
        status: pass
      - kind: test
        ref: "scripts/audit-model.test.ts#ACCEPTS `status: retired` (D-25) with no disposition and no finding_id"
        status: pass
  - deliverable: "Registry section defining the retired status, with no claim row changed"
    human_judgment: true
    rationale: "The gates prove the registry still parses and no row changed (47 rows, 0 retired); whether the prose reads clearly is a reader's judgment"
---

# Phase 43 Plan 01: Baseline and the retired claim status Summary

**The pre-phase baseline (14 gates, 21 named suite reds at a067c6e6) plus a `retired` claim status: the row and id stay, the claim-anchors gate checks the text and anchor are gone from the named file, and it refuses a retired safety row, a missing file and a mechanism with no backticked commit.**

## Performance

- **Duration:** 35 min (about 25 of them waiting on the full-suite baseline run)
- **Started:** 2026-11-17T22:09:20Z
- **Completed:** 2026-11-17T22:44:36Z
- **Tasks:** 3
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- `43-BASELINE.md` committed before any phase-43 edit: `base: a067c6e6…`, a `## Gates` table of 14 commands with exit codes and last lines, and a `## Full suite` table naming the 21 failing tests (11876 total, 11853 passed, 2 skipped).
- `CLAIM_STATUSES` is now `["true", "overstated", "false", "dropped", "retired"]`. A comment block above it says what a retired row is, why it is not `dropped`, and why it cannot launder a safety claim.
- `check-claim-anchors` takes retired rows out before `anchoredDocs` and the bijection. A new absence arm fails, naming the id and file, when the verbatim bytes are still in the named file, when a `<!-- claim: <id> -->` anchor is still there, when the named file does not exist, when the row is `kind: safety`, or when the mechanism has no backticked 7-40 character hex commit. Retired rows need no `disposition` or `finding_id`. The PASS line now shows `N retired (… M absence check(s))`.
- The registry's `status` field names `retired`, and a new section `## A retired claim leaves the page and keeps its row (D-25)` sits directly after § D-18. No `### C-28-NNN` row changed: still 47 rows, 0 retired.

## Task Commits

1. **Task 1 (tracer): baseline, then the retired status end to end**
   - `6b2e7db0` docs(43-01): record the phase 43 baseline
   - `fd6c6a9d` test(43-01): add failing cases for the retired claim status (RED)
   - `5c281053` feat(43-01): a retired claim keeps its row and id while its text leaves the page (GREEN)
2. **Task 2: the retired arm's refusals**
   - `69dd36ee` test(43-01): add failing cases for the retired arm's refusals (RED)
   - `680b2958` feat(43-01): refuse a retired safety row, a missing file and a retired row with no commit (GREEN)
3. **Task 3: the registry explains the retired status**
   - `24e9e89f` docs(43-01): the registry defines the retired claim status

No REFACTOR commits: there was nothing to clean up after GREEN.

## TDD Gate Compliance

- Task 1 RED (`fd6c6a9d`): 5 cases failed on their assertions. The 3 mirror cases failed because the parse refused `status: retired`. The 2 pin cases failed because `CLAIM_STATUSES` had 4 members. The refusal cases also assert `not.toMatch(/could not be parsed/)`, so a parse refusal that only mentions the id cannot satisfy them.
- Task 1 GREEN (`5c281053`): 172/172 passed.
- Task 2 RED (`69dd36ee`): 2 failed: the safety refusal and the commit-token refusal. Three cases passed on first run: missing file, the obligations exemption and the named-file adjacency. They pin behavior that Task 1's absence arm already needed, because the arm cannot read a missing file and its own green case already carried no `disposition`. See Deviations.
- Task 2 GREEN (`680b2958`): 283/283 passed across check-claim-anchors, audit-model, check-audit-register and generate-guarantees tests.
- Tracer feedback gate (Task 1): not auto mode, `human_verify_mode: end-of-phase`, automated-only `<verify>`. Re-ran `npm run build && npx vitest run …` (172 passed) and `node scripts/check-claim-anchors.js` (exit 0, PASS line contains "retired") before expanding.

## Files Created/Modified

- `.planning/phases/43-story-and-layered-docs/43-BASELINE.md`: the base commit, the gate table and the full-suite reds every later plan compares against
- `scripts/audit-model.ts` / `.js`: `retired` in `CLAIM_STATUSES` and the D-25 comment block
- `scripts/check-claim-anchors.ts` / `.js`: the status partition, the retired absence arm with its refusals, `RETIRED_COMMIT_RE`, the obligations exemption and the retired count in the PASS line
- `scripts/check-claim-anchors.test.ts`: 9 retired cases (3 behavior + 6 refusal/edge) on hermetic mirrors
- `scripts/audit-model.test.ts`: the five-member status pin (two-sided) and the retired parse case
- `docs/audit/28-claim-registry.md`: the `status` row and the new D-25 section

## Decisions Made

- The obligations exemption sits in the gate, not in `readRegistry`. The plan's `read_first` pointed at "readRegistry row validation" for the disposition/finding_id requirement, but that requirement has only ever lived in `check-claim-anchors.ts` (the D-17 loop), next to the `dropped` exemption. The parse only had to admit the new value.
- An anchor left behind for a row retired from the same file is reported by the retired arm alone. It is not also listed as `unexpected` in the bijection, so the reader gets one red with the retired-specific fix. An anchor for a retired id in a file the row does not name is still `unexpected`.
- `RETIRED_COMMIT_RE = /`[0-9a-f]{7,40}`/` checks form only. Whether the commit exists in git is not checked here. Plan 43-11 owns the live retired-commit case.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The CLAIM_STATUSES pin moved in Task 1, not Task 2**
- **Found during:** Task 1
- **Issue:** Task 1's verify runs `scripts/audit-model.test.ts`, and its existing pin (`CLAIM_STATUSES.length` is 4, and the array equals the four-value list) goes red as soon as `retired` is added.
- **Fix:** Updated both pin cases in Task 1's RED commit. Task 2 then added the retired parse case. Task 2's acceptance check (`grep -c '"dropped", "retired"'` prints at least 1) holds.
- **Files modified:** scripts/audit-model.test.ts
- **Commit:** fd6c6a9d

**2. [Rule 3 - Blocking] The missing-file refusal and the obligations exemption landed in Task 1**
- **Found during:** Task 1
- **Issue:** The absence arm cannot read a missing file. Task 1's own green mirror has a retired row with no `disposition` or `finding_id`, and that mirror cannot pass without the exemption.
- **Fix:** Both shipped in Task 1's GREEN commit. Task 2's cases for them pass on first run and pin the behavior, as the TDD section above records. Task 2's two new refusals (safety, commit token) were RED first.
- **Files modified:** scripts/check-claim-anchors.ts
- **Commit:** 5c281053

**Total deviations:** 2 auto-fixed (both Rule 3, test-ordering within the plan). **Impact:** none on scope; every behavior the plan names ships and is tested.

## Same-wave re-runs (plan 43-02)

None needed. While this plan ran, plan 43-02 committed nothing, and no gate or test went red naming a 43-02 path. `npm run build` touched only this plan's `.js` files.

## Verification

- `npm run typecheck` exit 0; `npm run freshness` exit 0 (92 `.js` fresh); `npm run check:build-parity` exit 0.
- All 14 baseline gates re-run after the last commit, and each matches its exit code in 43-BASELINE.md: 13 exit 0 and `check-flip-manifest` exit 1, as at base.
- `scripts/check-foundation-guards.test.ts`, `scripts/check-banned-claims.test.ts` and `scripts/generate-safety-surface.test.ts`: 491 passed, 1 failed. The failure is the baseline LANG-07 case ("every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose"), the same name as at base.
- `git diff --quiet a067c6e6 -- scripts/check-audit-register.ts scripts/check-audit-register.js` exit 0.
- The `dropped` refusal text in check-claim-anchors.ts is byte-unchanged: the diff against base removes no line of the dropped branch.
- The full suite was not re-run after the edits. The phase compares against the baseline before `/gsd-verify-work`, per 43-VALIDATION.md.

## Issues Encountered

- `check-diff-disposition` exits 0 at base ("0 findings over 29/29 elements"), not the "about 721 open findings" that 43-VALIDATION.md recorded at research time. The baseline records the measured value.
- `check-foundation-guards.js` (the gate) exits 0 at base. The LANG-07 red named in the plan is a test case in `scripts/check-foundation-guards.test.ts`, and the baseline lists it there.

## Known Stubs

None.

## Next Phase Readiness

- Plan 43-02 can start its edits: the baseline commit `6b2e7db0` is in `git log`.
- Plan 43-11 can retire C-28-002, C-28-003 and C-28-008. Each mechanism must name a backticked commit where the text last stood, and the text and anchor must be gone from `README.md`.

## Self-Check: PASSED

- FOUND: .planning/phases/43-story-and-layered-docs/43-BASELINE.md
- FOUND: scripts/audit-model.ts, scripts/check-claim-anchors.ts, docs/audit/28-claim-registry.md
- FOUND commits: 6b2e7db0, fd6c6a9d, 5c281053, 69dd36ee, 680b2958, 24e9e89f (6 = `git rev-list --count a067c6e6..HEAD`)
