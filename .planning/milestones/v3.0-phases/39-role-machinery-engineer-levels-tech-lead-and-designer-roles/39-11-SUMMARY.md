---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 11
subsystem: role-machinery
tags: [designer, adapters, engineer-levels, auto-delegation, gap-closure, MODEL-01]
status: complete

requires:
  - phase: 39
    provides: "designer.md (39-06), level adapters and generator 1:N (39-02, 39-07), MODEL-01 five-transform level case (39-07)"
provides:
  - "Designer adapter with Bash: reaches scripts/context-io.js, the sanctioned writer Workflow 16 requires"
  - "Level adapter descriptions routed only by the adapter name the Tech Lead's plan gives (never for unscored work)"
  - "Designer reads the brownfield map and shipped styles as its starting direction"
  - "IN-01 / IN-02 comment corrections in scripts/model-tiers.ts"
affects: [phase-39-verification, 39-12, 39-13, TIER-05, TIER-02]

actuals:
  tokens: 7169
  tasks: 3
  commits: 5
plan_head_before: b10a768bbe76d667d921b7fe51700ffc9d8a9cf3
plan_head_after: 8ad393ee8b7ecd3e668e3e64c155ac9e9dae9a42

tech-stack:
  added: []
  patterns:
    - "A level adapter's use-when clause names the adapter itself, so auto-delegation cannot reach it without the Tech Lead's plan"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-11.md
  modified:
    - agent-factory/roles/designer.md
    - .claude/agents/grugops-designer.md
    - .claude/agents/grugops-software-engineer-junior.md
    - .claude/agents/grugops-software-engineer-mid.md
    - .claude/agents/grugops-software-engineer-senior.md
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/adapter-byte-baseline.test.ts
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - scripts/tier-kit-text.test.ts
    - agent-factory/packaging/subagent.frontmatter.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-SECURITY.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-DISPOSITION.md

key-decisions:
  - "39-11: Designer capabilities are read edit shell (CR-01): shell is the only route a nested Claude Code role session has to the sanctioned writer; admit, web and any spawn grant stay absent"
  - "39-11: A level adapter description is '<One job> Use when: the Tech Lead's plan names <adapter>; never for unscored work. Level: <level>.' (WR-03); non-level adapters keep their derived description byte for byte"
  - "39-11: The MODEL-01 level case re-records only its description transform (dated WR-03 reason); five transforms, exact byte compare, pin 8a530552 and RECORDED_ADDED/REMOVED unchanged (D-3)"

patterns-established:
  - "Second-opinion literal: the baseline and generator tests type the routing clause themselves rather than import it from the generator"

requirements-completed: [TIER-05, TIER-02]

coverage:
  - id: D1
    description: "Designer declares read edit shell; its generated adapter carries tools Read, Grep, Glob, Edit, Write, Bash, with no spawn grant and no mcp__ admission tool"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-01, T-39-22: the generated adapter carries Bash to reach the sanctioned writer, and no spawn grant or MCP admission tool"
        status: pass
      - kind: other
        ref: "npm run freshness:adapters"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three level adapters say they are used only when the Tech Lead's plan names them; every other adapter is byte-identical to the MODEL-01 baseline"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#levels: the three level descriptions differ pairwise and none carries the role's own use-when sentence (WR-03, TIER-02 adjacency)"
        status: pass
      - kind: unit
        ref: "scripts/adapter-byte-baseline.test.ts#a level adapter is the baseline base adapter of its role with exactly five transforms"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-03: a level adapter is routed only by the name the Tech Lead's plan gives, never for unscored work"
        status: pass
    human_judgment: false
  - id: D3
    description: "How strongly Claude Code's auto-delegation honors the new level descriptions on a live host"
    requirement: TIER-02
    verification: []
    human_judgment: true
    rationale: "Needs a live Claude Code host; UNKNOWN - verify until the end-of-phase human check spawns the level adapters"
  - id: D4
    description: "In a brownfield repo the Designer reads memory-bank/brownfield-map.md and the shipped styles as its starting direction; the role stays under its ceiling"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-08: in a brownfield repo it reads the brownfield map and the shipped styles as its starting direction"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (designer.md 3078B within ceiling)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Five review findings recorded fixed; diff disposition back at the pre-phase 721"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)'"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-30
---

# Phase 39 Plan 11: Designer shell route, level-adapter routing and brownfield read (gap closure round 1) Summary

**The Designer now has the shell capability, so its Claude Code adapter has Bash and can publish Workflow 16 notes through `scripts/context-io.js`. The three engineer level adapters now carry a use-when clause that only the Tech Lead's named plan matches. The Designer also reads a brownfield repo's map and current styles as its starting direction.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-30T06:46:49Z
- **Completed:** 2026-10-30T07:00:39Z
- **Tasks:** 3
- **Files modified:** 16 (1 created)

## Accomplishments
- CR-01 / TIER-05 closed. `designer.md` declares `capabilities: read edit shell`, and the generated `grugops-designer.md` carries `tools: Read, Grep, Glob, Edit, Write, Bash`. It still has no `admit`, no `web`, no `Agent(` grant and no `mcp__` tool. The T-39-21 register row now states the true capability set.
- WR-03 / TIER-02. Each level adapter description reads `"Implement one ticket end to end. Use when: the Tech Lead's plan names grugops-software-engineer-<level>; never for unscored work. Level: <level>."`. Non-level adapters are byte-identical, including qe-e2e.
- D-3 held. The MODEL-01 level case still asserts exactly five transforms against pin `8a530552d6c0e815d2959d16a8c06d99cc2d612b`. Only the description transform moved, and it carries a dated WR-03 reason. The records are unchanged.
- WR-08. The Designer's `## Reads` gains the brownfield bullet. The file is 3,078 B, under the 3,098 B WARN tier and the 3,273 B FAIL ceiling, and no adapter byte moved.
- IN-01 / IN-02. The `tieredCorpusRefusals` docblock and the `LEVEL_COUNT` comment now match the code. Both claims were checked against `check-foundation-guards.ts:2273` and a grep of `LEVEL_COUNT`.
- 39-REVIEW-DISPOSITION.md records CR-01, WR-03, WR-08, IN-01 and IN-02 as `fixed` with their commits. `open: 13`.

## Task Commits

1. **Task 1 (tracer): Designer shell capability, adapter Bash, test pin, disposition, register.** Commit `0a94175f` (fix). The tracer gate re-ran `<verify>` green in end-of-phase mode with automated-only checks, so execution expanded with no checkpoint.
2. **Task 2: level adapter routing (WR-03), MODEL-01 transform re-record, IN-01/IN-02**
   - RED: `7fa0c24e` (test)
   - GREEN: `de619b57` (fix; the plan mandates `fix(39-11):` subjects, so GREEN uses `fix`, not `feat`)
3. **Task 3: Designer brownfield read (WR-08) and review dispositions.** Commits `78c07a10` (fix) and `8ad393ee` (docs).

## TDD Gate Compliance (Task 2)

- **RED (`7fa0c24e`).** Three target tests failed on their planned assertions:
  - the generator levels case: its description still ended `Use when: Need code (one ticket). Level: junior.`
  - the new pairwise/no-Activates-when case: the junior description contained `Need code (one ticket).`
  - the baseline five-transform case: the three level adapters differed from the expected bytes in the description only.

  Classifier: `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK target_test_failed` for all three.
  - The generator test's evidence is a tap-flat stdout capture.
  - The baseline test's evidence is a JUnit XML report. Its tap-flat output carries an unindented multi-line YAML `actual` for the array diff, which the classifier rejects as malformed TAP. This is a reporter quirk, so the planned target was rerun with a supported reporter as the reference allows.

  Semantic assessment: each target ran and failed on the description assertion, not on setup, import or fixture faults. Test 3 (the non-level description stays the same) is a guard. It passed before and after, as intended.
- **GREEN (`de619b57`).** The generator change made all three pass. Results: 870/870 across the seven Task 2 suites.
- **REFACTOR:** none needed.

## Files Created/Modified
- `agent-factory/roles/designer.md`: `capabilities: read edit shell`, plus the WR-08 brownfield Reads bullet.
- `.claude/agents/grugops-designer.md` (generated): Bash added to `tools`.
- `.claude/agents/grugops-software-engineer-{junior,mid,senior}.md` (generated): the description line names its own adapter.
- `scripts/generate-role-adapters.ts` / `.js`: the level-adapter description rule and its WR-03 rationale comment.
- `scripts/generate-role-adapters.test.ts`: the levels expectation changed, plus two new cases (pairwise-different / no Activates-when; non-level unchanged).
- `scripts/adapter-byte-baseline.test.ts`: the re-recorded description transform, with a dated WR-03 comment and a renamed case title.
- `scripts/tier-kit-text.test.ts`: the designer capability pin moved, plus three new cases: CR-01/T-39-22 adapter tools, WR-03 packaging/adapters, and WR-08 Reads.
- `agent-factory/packaging/subagent.frontmatter.md`: the level-adapter `description` bullet is reworded.
- `scripts/model-tiers.ts` / `.js`: the IN-01 and IN-02 comment fixes.
- `docs/audit/29-style-dispositions/39-11.md` (new): two **added** rows, for designer.md lines 4 and 24.
- `39-SECURITY.md`: the T-39-21 mitigation cell is reworded.
- `39-REVIEW-DISPOSITION.md`: five rows set to `fixed`.

## Verification (plan-level)
- `npm run build && npm run typecheck`: exit 0.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts scripts/kit-model.test.ts scripts/model-tiers.test.ts scripts/check-foundation-guards.test.ts scripts/generate-catalog.test.ts`: 8 files, **884 passed**.
- `npx vitest run install/install.test.ts install/record-truth.test.ts install/installer-user-edit.test.ts install/installer-cross-version.test.ts`: 4 files, **698 passed, 1 skipped**.
- These gates all exit 0 with `ALL CHECKS PASSED` or fresh: check-foundation-guards, validate-agent-factory (with `VALIDATE_KIT_ROOT=.`), check-audit-register, check-imperative-lexicon, check-banned-claims, check-kit-refs, freshness:adapters/catalog/host-entries/skill-twins/hook-manifest, freshness (88 `.js`), check:build-parity.
- `node scripts/check-diff-disposition.js`: 721 findings. This is the pre-existing red, unchanged.
- `git status --short docs/audit/28-prepass-evidence.md`: still ` M`. It was never staged or touched.

## Decisions Made
- Designer capabilities are `read edit shell`, not `read edit` (overrides 39-RESEARCH Open Question 4). Shell is the only route a sub-agent has to the sanctioned writer.
- WR-03 wording follows the plan: `the Tech Lead's plan names <adapter>; never for unscored work`.

## Deviations from Plan

**1. [Rule 3 - Blocking] `validate-agent-factory.js` needs `VALIDATE_KIT_ROOT`**
- **Found during:** Task 1 verify.
- **Issue:** Run bare, as the plan's `<verify>` writes it, the validator exits 1 with `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. This is the script's existing contract and was not caused by this plan.
- **Fix:** Ran it as `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, which prints `ALL CHECKS PASSED` and exits 0. No file changed.

**2. [Process] GREEN commit type is `fix`, not `feat`**
- The TDD reference names `feat(...)` for GREEN. The plan's project rules allow only `fix(39-11):`, `test(39-11):` and `docs(39-11):` subjects, and the plan's rule wins.

**Total deviations:** 2 (1 blocking invocation detail, 1 process naming). **Impact on plan:** no code change, and no scope change.

## Issues Encountered
- Vitest's tap-flat reporter writes multi-line YAML for array diffs, which the RED classifier rejects. The fix was to rerun the baseline target with `--reporter=junit` (see TDD Gate Compliance). The temporary evidence files were moved out of the repo.

## Known Stubs
None.

## User Setup Required
None.

## Next Phase Readiness
- Gap 1 (CR-01, TIER-05) is closed. Gap 2 (CR-02, the WF04 human stop) and the remaining findings belong to plans 39-12 and 39-13.
- TIER-02 is shared with a later sibling plan, so its REQUIREMENTS.md tick waits for that plan's SUMMARY. TIER-05 is ready.
- Live auto-delegation behavior of the new level descriptions is `UNKNOWN - verify` until the end-of-phase human check runs.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*

## Self-Check: PASSED
- FOUND: docs/audit/29-style-dispositions/39-11.md, agent-factory/roles/designer.md, .claude/agents/grugops-designer.md, scripts/generate-role-adapters.ts
- FOUND commits: 0a94175f, 7fa0c24e, de619b57, 78c07a10, 8ad393ee (all ancestors of HEAD)
