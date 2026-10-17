---
phase: 34-model-effort-dial-pi-support
plan: 17
subsystem: governance-docs
tags: [wr-07, doc-1, trusted-root, review-disposition, requirements]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "plan 34-15 (WR-03 effort cross-check) and plan 34-16 (WR-06 Pi kit-discovery caveat)"
provides:
  - "Tier 2 of the governance-root order stated truthfully: GRUGOPS_PROJECT_DIR is honoured when a human or the host's launch environment sets it; the grugops installer does not set it"
  - "Twelve recorded code-review dispositions (3 fixed, 9 deferred), open: 0"
  - "Gap-round-1 deferred entries for the nine deferred findings"
  - "EFFORT-04 and PI-03 ticked (PI-03 on POSIX; Windows under HOST-02)"
affects: [34-18, phase-34-verification]

actuals:
  tokens: 11500
  tasks: 2
  commits: 2
plan_head_before: eb7482c34729f742f29f68946f3db182ee9bbe67
plan_head_after: d5359ab61dcb3f0e3ffbe02fecaae7db96118441

tech-stack:
  added: []
  patterns:
    - "A false mechanism claim is corrected at the program's published string and the workflow that mirrors it in the same commit, with the trust consequence named as an existing residual"

key-files:
  created:
    - docs/audit/29-style-dispositions/34-17.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - .planning/phases/34-model-effort-dial-pi-support/34-REVIEW-DISPOSITION.md
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "WR-07 fixed by correcting the claim, not by making the installer set GRUGOPS_PROJECT_DIR (D-20 scope): tier 2 is honoured when a human or the host's launch environment sets it, and the agent's ability to set it for its own process is named as the accepted residual R-31-15-01"
  - "Earlier audit records quoting the old text (31-27.md, 32.1-03.md) are left unchanged; rewriting them would falsify the audit trail"

patterns-established:
  - "Workflow 16 step prose avoids modals and bare demonstratives (WP-05/WP-06 imperative-lexicon gate)"

requirements-completed: [PI-03, EFFORT-04]

coverage:
  - id: D1
    description: "No tracked program string, docstring, test name or workflow line claims the installer sets GRUGOPS_PROJECT_DIR; TRUSTED_ROOT_TIERS and workflow 16 tier lines still agree in both directions"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts -t TRUSTED_ROOT (3 passed, incl. the workflow equality in BOTH directions)"
        status: pass
      - kind: other
        ref: "git grep -n -i -e installer-set -e 'installer sets' -- agent-factory scripts install hooks README.md docs/faq.md (no output)"
        status: pass
      - kind: other
        ref: "npm run freshness:hook-manifest; npm run check:diff-disposition; npm run freshness:guarantees; npm run freshness:catalog; npm run check:imperative-lexicon"
        status: pass
    human_judgment: false
  - id: D2
    description: "Twelve review findings dispositioned (WR-03/06/07 fixed with plan and commits; nine deferred with reasons), deferred-items.md gap-round-1 section"
    verification:
      - kind: other
        ref: "grep '^open: 0' 34-REVIEW-DISPOSITION.md; grep 'From gap round 1' deferred-items.md"
        status: pass
    human_judgment: true
    rationale: "Whether each deferral reason is an acceptable deferral is a human triage judgement; the ledger only records it"
  - id: D3
    description: "EFFORT-04 and PI-03 ticked in REQUIREMENTS.md with the stated statuses; HOST-02 untouched"
    requirement: "EFFORT-04"
    verification:
      - kind: other
        ref: "grep -E '\\[x\\] \\*\\*(EFFORT-04|PI-03)\\*\\*' .planning/REQUIREMENTS.md; git show d5359ab6 -- .planning/REQUIREMENTS.md (4 lines changed)"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-10-08
status: complete
---

# Phase 34 Plan 17: WR-07 tier-2 claim corrected and review fully dispositioned Summary

**The governance-root order now says `GRUGOPS_PROJECT_DIR` is honoured when a human or the host's launch environment sets it and that the grugops installer does not set it (program, workflow, tests, hook manifest); all twelve review findings carry a disposition, and EFFORT-04 and PI-03 are ticked.**

## Performance

- **Duration:** ~23 min (plus a ~16 min full-suite run)
- **Started:** 2026-10-07T22:28:47Z
- **Completed:** 2026-10-07T22:51:19Z
- **Tasks:** 2
- **Files modified:** 10 (1 created)

## Accomplishments

- WR-07 fixed at its source and mirror. `TRUSTED_ROOT_TIERS` entry 2, the `TRUSTED_ROOT_ENV_ORDER` and `trustedRepoRoot` docstrings in `scripts/context-io.ts`, and workflow 16 (step text on line 32, tier line 56) no longer say the installer sets the variable. No code under `install/` writes it (`git grep -n GRUGOPS_PROJECT_DIR -- install/` prints nothing). The trust statement now names `R-31-15-01`: an agent that runs `scripts/context-io.js` itself controls that process's environment.
- The test name (`GREEN 2`), the step-2 label and the block comment in `scripts/context-io.test.ts` no longer say "installer-set".
- The hook manifest was regenerated because the `scripts/context-io.js` hash moved. Guarantees and catalog were already fresh, so nothing was regenerated there.
- `docs/audit/29-style-dispositions/34-17.md` records the seven changed workflow clauses. The judgement comes first in the file: the clause stated a mechanism no code has.
- `34-REVIEW-DISPOSITION.md` now has 12 rows and `open: 0`. Three are `fixed`: WR-03 (34-15, 6560d5ec and 827d3980), WR-06 (34-16, 056ee6df and b0dcd631) and WR-07 (34-17, 06a8e77b). Nine are `deferred` with reasons that contain no `|`. The frontmatter agrees with the table row for row.
- `deferred-items.md` has a new section, "From gap round 1 (D-20)", with nine entries. Each gives the finding, why it was not fixed and a suggested owner.
- `REQUIREMENTS.md`: EFFORT-04 is `[x]` / Complete, citing truths 3 and 4 and plan 34-15. PI-03 is `[x]` / Complete on POSIX, citing truth 8, with the windows-latest result recorded under HOST-02. Only those four lines changed. HOST-02 and every other row are unchanged.

## Task Commits

1. **Task 1: tier-2 claim true in program, workflow and hook manifest (WR-07)** - `06a8e77b` (fix)
2. **Task 2: twelve dispositions, deferred rows, two requirement ticks, regression gate** - `d5359ab6` (docs)

## WR-07 sibling search (DOC-1)

I re-ran `git grep -n -e GRUGOPS_PROJECT_DIR -e installer-set -e "installer sets" -- ':!.planning'` and a broader phrasing search (`installer … names it/owns/sets the`, `step-2/tier-2 variable`):
- D1 to D6 (workflow 16 :32 and :56; context-io.ts docstring, TIERS entry and trustedRepoRoot docstring; test comment, name and label) were corrected.
- D7: `docs/audit/29-style-dispositions/31-27.md:74` and `32.1-03.md:196-199` are historical records and were left unchanged.
- D8: `docs/audit/31-round5-residuals.md:102`, `31-round6-residuals.md:124` and `hooks/hook-entry.ts:397` name the variable but make no installer claim, so they were left unchanged.
- `TRUSTED_ROOT_RESIDUALS` R-31-15-01 and R-31-15-03 say a process can set the step-1 or step-2 variable in its own child environment. That is true and makes no installer claim, so both are unchanged.
- The acceptance grep `git grep -n -i -e installer-set -e "installer sets" -- agent-factory scripts install hooks README.md docs/faq.md` prints nothing.

## Decisions Made

See key-decisions. WR-07 was fixed by correcting the claim, not by implementing an installer-set variable, as D-20 scopes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Workflow sentences rephrased to pass the imperative-lexicon gate**
- **Found during:** Task 1
- **Issue:** The first wording of the new trust sentences on workflow 16 line 32 used a modal ("can set") and a bare demonstrative opener ("That is …"). `check:imperative-lexicon` failed them under WP-05 and WP-06.
- **Fix:** They now read "… builds that process's environment, so the agent controls this variable there. The accepted residual `R-31-15-01` records that capability." The disposition rows were updated to match.
- **Files modified:** agent-factory/workflows/16-context-read-write.md, docs/audit/29-style-dispositions/34-17.md
- **Verification:** check:imperative-lexicon, check:diff-disposition, check:public-docs, check:banned-claims and check:claim-anchors all pass.
- **Committed in:** 06a8e77b

**2. [Rule 1 - Bug] IN-05 deferral reason narrowed to what the code shows**
- **Found during:** Task 2
- **Issue:** The first draft said "the installer … refuse[s] an invalid block through `readModelsConfig`". `install/install.ts` does not call `readModelsConfig` directly (DOC-1).
- **Fix:** The reason now names only the verified callers, `scripts/generate-role-adapters.ts` and `scripts/check-foundation-guards.ts`.
- **Committed in:** d5359ab6

**Total deviations:** 2 auto-fixed (both wording corrections). **Impact:** no scope change.

## Issues Encountered

None.

## Handoff notes

- The RC-1 row R15 flagged by plan 34-15 is not in this plan's disposition table, so it was not added here. It is the per-adapter installer report line that prints only `model=`. It remains a backlog candidate for human triage.
- The 34-16 deferred item about C-28-034 and install/README.md §1 is untouched and still needs a human decision.
- HOST-02 is not ticked. It closes only on the measured windows-latest run in plan 34-18 (D-19).

## Verification

- Task 1: `npm run build` passed. `npx vitest run scripts/context-io.test.ts -t "TRUSTED_ROOT"`: 3 passed. `generate:hook-manifest`, `freshness:hook-manifest`, `check:diff-disposition` (0 findings over 40/40), `freshness:guarantees` and `freshness:catalog` all passed. Targeted files `context-io`, `admission-protocol-docs`, `kit-model` and `hooks/`: 883 passed.
- Task 2: the three greps print matches. `npm run build`, `check:build-parity` and `typecheck` passed. Full suite `npx vitest run --exclude '**/scripts/e2e/**'`: 103/103 files, 7435 passed, 2 skipped, exit 0.

## Next Phase Readiness

Ready for plan 34-18, the measured windows-latest close for HOST-02. The human pushes; agents do not.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/34-17.md
- FOUND: 06a8e77b, d5359ab6 (ancestors of HEAD)
