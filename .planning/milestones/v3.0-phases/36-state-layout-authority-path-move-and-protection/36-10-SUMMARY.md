---
phase: "36"
plan: "10"
subsystem: state-layout
tags: [state-layout, kit-invariant, adapters, skill-twins, byte-baseline, fallback-clause]

requires:
  - phase: 36
    provides: "install/state-layout.ts constants (STATE_ROOT_REL, LEGACY_STATE_ROOT_REL, BOARD_REL, LEGACY_BOARD_REL, LEGACY_FALLBACK_CLAUSE) from 36-01; scripts/state-path-scan.js from 36-03; orchestrator.md line 8 carrying the clause from 36-08"
provides:
  - "INVARIANT (scripts/kit-model.ts) names `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` as STATE, then LEGACY_FALLBACK_CLAUSE verbatim"
  - "The coordinator adapter body line names `memory-bank/plans/board.md`"
  - "All 17 .claude/agents adapters, all 7 skills/*/SKILL.md sources and all 7 .claude/skills twins carry the clause, from one regeneration"
  - "scripts/adapter-byte-baseline.test.ts: third recorded divergence, a stated transform assembled from install/state-layout.js; pin 6f8411ef unmoved"
affects: [36-11, 36-13, 36-14]

actuals:
  tokens: 11216
  tasks: 1
  commits: 1
plan_head_before: 1b44af7323158124c6acec803ff0a448eef69ed9
plan_head_after: 287aec2e900f6c319d2f1202ed2a48923f43e1b0

tech-stack:
  added: []
  patterns:
    - "A carrier copy of LEGACY_FALLBACK_CLAUSE is written by a scratch script that imports the constant from install/state-layout.js and replaces a target asserted to occur exactly once, so the clause is never typed by hand"
    - "A byte-baseline divergence whose new text itself contains an old target is applied in dependency order: the board transform runs on the untransformed baseline before the invariant transform inserts a clause that names the pre-v3 board path"

key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/adapter-byte-baseline.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - "skills/*/SKILL.md (7)"
    - ".claude/agents/*.md (17, regenerated)"
    - ".claude/skills/*/SKILL.md (7, regenerated)"

key-decisions:
  - "INVARIANT stays a literal in kit-model.ts with the clause copied in, not imported, because kit-model.js is hand-mirrored into three freshness mirrors (Pitfall 8); the comment names plan 36-11's every-carrier test as the equality check"
  - "The skill-twin generator halts on a changed plugin-form source by design; the change was adopted with its documented `--overwrite-committed-twins` flag, after which a plain `npm run generate:skill-twins` reports 7 already identical"
  - "hooks/hook-entry.ts's decider manifest pins a hash of scripts/kit-model.js, so it was regenerated with `npm run generate:hook-manifest` in the same commit (Rule 3)"

patterns-established:
  - "Changing kit-model.ts also requires regenerating the hook-entry decider manifest (generate:hook-manifest), because the admission decider's closure includes kit-model.js"

requirements-completed: []

coverage:
  - id: D1
    description: "INVARIANT carries the v3 STATE clause and LEGACY_FALLBACK_CLAUSE verbatim, keeps the check-kit-refs marker and tail, and reaches every adapter, skill source and skill twin from one regeneration"
    requirement: LAYOUT-04
    verification:
      - kind: other
        ref: "grep -l 'say once: run `install --migrate`' .claude/agents/*.md → 17 of 17; .claude/skills/*/SKILL.md skills/*/SKILL.md → 14 of 14"
        status: pass
      - kind: other
        ref: "node -e import INVARIANT + LEGACY_FALLBACK_CLAUSE: INVARIANT includes the v3 STATE clause + ' ' + clause + ' Roles pull'; ends with '(Full rule: AGENTS.md § Kit vs state.)'; orchestrator.md line 8 includes the clause (all true)"
        status: pass
      - kind: other
        ref: "npm run freshness:adapters, freshness:skill-twins, freshness:host-entries, freshness, freshness:catalog, freshness:guarantees, freshness:hook-manifest (each exit 0); npm run generate:adapters leaves git status -- .claude/agents/ empty"
        status: pass
      - kind: other
        ref: "node scripts/check-kit-refs.js, check-foundation-guards, check-claim-anchors, check-public-docs-vocabulary, check-banned-claims, check-nul-bytes, check-uat-oracles, validate-agent-factory (each exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The adapter byte baseline admits the change as a third recorded divergence, a stated transform from the unmoved pin built only from install/state-layout.js constants"
    requirement: LAYOUT-04
    verification:
      - kind: unit
        ref: "npx vitest run scripts/adapter-byte-baseline.test.ts (4 passed); mutation: one changed byte in grugops-ba-pm.md's clause → 1 failed naming the adapter, restored → 4 passed"
        status: pass
      - kind: other
        ref: "grep -c 'PRE_PHASE_ADAPTER_BASELINE = \"6f8411effe80b3f22d0d668e1fa40fa78e3a8088\"' scripts/adapter-byte-baseline.test.ts prints 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generated surfaces and their sources name only v3 state paths (the clause subtracted), and the scripts/ scan 36-07 left open now passes"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js skills .claude scripts/kit-model.ts scripts/kit-model.js scripts/generate-role-adapters.ts scripts/generate-role-adapters.js scripts/adapter-byte-baseline.test.ts → PASS, 36 files, exit 0"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js scripts memory-bank ':!scripts/fixtures/*/agent-factory/roles/*.md' → PASS, 689 files, 0 sites, exit 0 (was exit 1 on 4 sites after 36-07)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Scheduled full non-e2e regression shows only the 20 failures already recorded in deferred-items.md"
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**': 116 files, 6 failed / 110 passed; 8550 tests, 20 failed / 8528 passed / 2 skipped. Failed: context-io 7, uat-gate-exit-contract 5, harness-instance-ledger 4, context-io-writer-set 2, canonical-corpus 1, installer-fs-census 1 (openAsBlobSync) — exactly the deferred set"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 10: The kit-vs-state invariant names memory-bank/plans/ and carries the fallback clause in every adapter and skill twin Summary

**INVARIANT in `scripts/kit-model.ts` now reads `` `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE in this repo. `` followed by `LEGACY_FALLBACK_CLAUSE` verbatim. The coordinator line names `memory-bank/plans/board.md`. One regeneration put both into all 17 agent adapters and all 7 skill twins. The adapter byte baseline accepts the change as a third recorded divergence: a transform built from `install/state-layout.js` and applied to the unmoved pin `6f8411ef`.**

## Performance

- **Duration:** 40 min (about 31 min of it the full-suite run)
- **Started:** 2026-10-21T09:39:06Z
- **Completed:** 2026-10-21T10:19:05Z
- **Tasks:** 1 (tracer)
- **Files modified:** 38 (7 tooling sources and their compiled `.js`, 1 test, 7 skill sources, 17 adapters, 7 twins; the hook-entry `.ts`/`.js` pair is included in the 7 source/compiled files)

## Accomplishments

- **INVARIANT (D-14).** A scratch script imported `LEGACY_FALLBACK_CLAUSE` from `install/state-layout.js` and replaced the old STATE clause. The script asserted that the old clause occurs exactly once in `kit-model.ts` and in each of the seven `skills/*/SKILL.md` sources, so no copy of the clause was typed by hand. The check-kit-refs marker `If the kit dir is absent, STOP — do not hunt.` and the `(Full rule: AGENTS.md § Kit vs state.)` tail are unchanged. INVARIANT is still a literal with no state-layout import. Its comment explains why and names plan 36-11's every-carrier test.
- **Coordinator and skill board lines.** `generate-role-adapters.ts` and six skill sources (release has no board line) now name `memory-bank/plans/board.md`. A comment above `coordinatorBody` says why it is a literal and that the byte baseline ties it to `BOARD_REL`.
- **One regeneration.** `npm run build`, `generate:adapters` and `generate:skill-twins -- --overwrite-committed-twins` produced 17 adapters and 7 twins. A plain `generate:skill-twins` re-run then reported 7 already identical.
- **Third recorded divergence.** `adapter-byte-baseline.test.ts` imports `BOARD_REL`, `LEGACY_BOARD_REL`, `LEGACY_FALLBACK_CLAUSE`, `LEGACY_STATE_ROOT_REL` and `STATE_ROOT_REL`, and builds two transforms from them:
  - The retired STATE clause becomes the new one in every adapter.
  - On the coordinator only, the backticked `LEGACY_BOARD_REL` becomes the backticked `BOARD_REL`.

  Before each transform applies, the test checks that its target occurs exactly once in the baseline and that the new text is not already there. The coordinator's length-delta check now covers all four changed lines (tools, Degraded, INVARIANT, board), and the case title and messages now say THREE. A one-byte change to one adapter's clause turned the case red and named that adapter.
- **36-07's open must-have is closed.** `node scripts/state-path-scan.js scripts memory-bank ':!scripts/fixtures/*/agent-factory/roles/*.md'` now exits **0** (PASS, 689 files, **0 sites**). After 36-07 it exited 1 on 4 sites.

## Task Commits

1. **Task 1 (tracer): the new INVARIANT reaches every generated adapter and skill twin in one regeneration**: `287aec2e` (feat)
   - Tracer gate: interactive, `end-of-phase`, verify is automated only. Both `<automated>` blocks were re-run on the committed content. Verify 1 exited 0, with vitest showing 51 passed. Verify 2 exited 0, with `.claude/agents/` clean after `generate:adapters`. The tracer is verified end to end, and the plan has no expansion task.

## Files Created/Modified

- `scripts/kit-model.ts` / `.js`: INVARIANT with the v3 STATE clause and the fallback clause, plus a comment on the copy.
- `scripts/generate-role-adapters.ts` / `.js`: the coordinator board line, plus a comment.
- `scripts/adapter-byte-baseline.test.ts`: the third recorded divergence.
- `hooks/hook-entry.ts` / `.js`: the decider manifest hash for `scripts/kit-model.js`, regenerated.
- `skills/{gate,grugops,map,plan,release,ticket,uat}/SKILL.md`: the INVARIANT line, and the board line in all but release.
- `.claude/agents/*.md` (17) and `.claude/skills/*/SKILL.md` (7): regenerated.

## Decisions Made

- The skill-twin generator stops when a plugin-form source has changed. Its own message says to adopt a legitimate change with `--overwrite-committed-twins`, so that is how this change was adopted.
- The byte-baseline transform runs the board replacement before the invariant replacement, because the inserted fallback clause itself names `` `plans/board.md` ``. Running them the other way would make the board target occur twice and throw.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated the hook-entry decider manifest**
- **Found during:** Task 1 (targeted regression)
- **Issue:** `scripts/floor-invariance.test.ts` failed 2 cases: `hooks/admission-guard.js's manifest carries a stale hash for scripts/kit-model.js`. `hooks/hook-entry.ts` pins a sha256 for each module in the admission decider's closure, and `kit-model.js` is one of them. The plan's file list did not name this file.
- **Fix:** `npm run generate:hook-manifest` changed one hash line, `scripts/kit-model.js` from `06bf2a85…` to `308e701c…`, and rebuilt.
- **Files modified:** hooks/hook-entry.ts, hooks/hook-entry.js
- **Verification:** `npm run freshness:hook-manifest` passes (1 decider, 13 module hashes). `floor-invariance.test.ts` passes 135 of 136 before the commit. The remaining case only checks that hook-entry.ts has no uncommitted change, and it passed in the full suite after the commit.
- **Committed in:** 287aec2e

**2. [Rule 3 - Blocking] Used the skill-twin generator's documented adopt flag**
- **Found during:** Task 1, step 4
- **Issue:** A plain `npm run generate:skill-twins` stops on purpose when a committed twin differs from its changed source.
- **Fix:** Ran `npm run generate:skill-twins -- --overwrite-committed-twins`, as the generator's own message prescribes for a legitimate source change.
- **Verification:** A plain re-run reports 0 written, 7 already identical. `freshness:skill-twins` exits 0.
- **Committed in:** 287aec2e

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were needed to finish the one regeneration. No scope change.

## Issues Encountered

- My first scratch-script attempt replaced the STATE clause before the board line. The inserted clause names `` `plans/board.md` ``, so the board target then occurred twice, and the once-only check threw before any skill file was written. I reordered the edits and narrowed the board target to `` `AGENTS.md`, and `plans/board.md` ``.
- `.claude/agents/grugops-orchestrator.md` is now 3259 B. That is above the adapter WARN line (3072 B) and below FAIL (4096 B). `check-foundation-guards` prints a WARN and exits 0.

## Full-suite checkpoint (scheduled)

`npx vitest run --exclude '**/scripts/e2e/**'` was run once after the code commit and took 1873 s:

- 116 test files: 6 failed, 110 passed.
- 8550 tests: 20 failed, 8528 passed, 2 skipped.

| File | Failed | In deferred-items.md |
|------|-------:|----------------------|
| scripts/context-io.test.ts | 7 | yes |
| scripts/uat-gate-exit-contract.test.ts | 5 | yes |
| scripts/harness-instance-ledger.test.ts | 4 | yes |
| scripts/context-io-writer-set.test.ts | 2 | yes |
| scripts/canonical-corpus.test.ts | 1 | yes (absent 27-REVIEW-GAPS files) |
| install/installer-fs-census.test.ts | 1 | yes (openAsBlobSync, Node v26) |

No failure was caused by this plan. `check-diff-disposition` (known pre-existing red) was not run.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 36-11:** AGENTS.md § Kit vs state, the two packaging copies (`slash-command.template.md`, `subagent.frontmatter.md`), the C-28 claim registry block and the every-carrier test. These are the only remaining copies of the old STATE clause (`git grep` outside `.planning/`).
- LAYOUT-01 (ends at 36-14) and LAYOUT-04 (ends at 36-13) stay unchecked in REQUIREMENTS.md.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- Commit `287aec2e` is an ancestor of HEAD. The 7 skill sources, 17 adapters and 7 twins all carry the clause (grep counts above). The pin line is present once.
- Plan verification: (1) the targeted vitest files passed, (2) the freshness gates exit 0, (3) the repo gates exit 0, (4) `git branch --show-current` prints `main`.
