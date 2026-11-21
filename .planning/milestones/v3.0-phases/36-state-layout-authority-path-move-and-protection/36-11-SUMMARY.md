---
phase: "36"
plan: "11"
subsystem: state-layout
tags: [state-layout, fallback-clause, agents-md, packaging, claim-registry, carrier-test]

requires:
  - phase: 36
    provides: "LEGACY_FALLBACK_CLAUSE, STATE_ROOT_REL, LEGACY_STATE_ROOT_REL in install/state-layout.ts (36-01); orchestrator.md line 8 carrying the clause (36-08); INVARIANT, the 7 skill sources, 17 adapters and 7 twins carrying it (36-10)"
provides:
  - "AGENTS.md § Kit vs state: the STATE bullet names `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/`; the invariant blockquote carries the v3 STATE clause plus LEGACY_FALLBACK_CLAUSE verbatim"
  - "AGENTS.md read order (line 18), Delivery (lines 93, 95) and `## Memory bank & plans` (line 155) name memory-bank/plans/ paths"
  - "Both packaging templates carry INVARIANT verbatim in every invariant copy (1 + 2), and their board mentions name memory-bank/plans/board.md"
  - "docs/audit/28-claim-registry.md C-28-015, C-28-016, C-28-020 verbatim blocks (and C-28-020's line field) moved in the same commit as their anchors"
  - "scripts/kit-model.test.ts: the every-carrier case holding all 37 carriers to LEGACY_FALLBACK_CLAUSE by exact UTF-8 byte containment, over derived carrier lists, with a mutation control"
affects: [36-12, 36-13, 36-14]

actuals:
  tokens: 10986
  tasks: 1
  commits: 2
plan_head_before: 8ce4217e605a460e8b5e9aa1d123b5b1fa4d93b1
plan_head_after: 125aab38e8c4324740369b6b399450f80b0b0746

tech-stack:
  added: []
  patterns:
    - "A carrier test derives its carrier list from the kit-model authorities (listRoles through the generator's `grugops-<stem>.md` rule, cross-checked with listAgentAdapters; listPluginSkillAdapters; listSkillAdapters; listPackagingTemplates per invariant line) and asserts the count asked equals the sum of the derivations"
    - "A byte-equality discrimination control uses a no-break space, which NFKC folds back to a space, so a normalizing comparator would be caught"

key-files:
  created:
    - .planning/phases/36-state-layout-authority-path-move-and-protection/tdd-evidence/36-11-task1-red.json
  modified:
    - AGENTS.md
    - agent-factory/packaging/slash-command.template.md
    - agent-factory/packaging/subagent.frontmatter.md
    - docs/audit/28-claim-registry.md
    - scripts/kit-model.test.ts

key-decisions:
  - "C-28-012's verbatim block was left unchanged: it is one line (AGENTS.md:16, the config bullet), and check-claim-anchors compares only that many lines below the anchor, so the line-18 board edit is outside the registered claim; its line field (16) is still accurate"
  - "C-28-020's advisory line field moved from 150-151 to 154-155, its actual location; mechanism prose in all four rows stays as written (D-09, the 36-08 precedent)"
  - "The packaging copies were rewritten to INVARIANT itself: each old copy was byte-identical to INVARIANT with the old STATE clause, so 'the new INVARIANT text as the copy already abbreviates it' is INVARIANT verbatim"
  - "The D-03 case also refuses the substring `install --migrate` in any non-orchestrator role or workflow, so a paraphrased fallback is caught as well as a copied one"

patterns-established:
  - "Carrier edits are applied by a scratch script that imports LEGACY_FALLBACK_CLAUSE and INVARIANT from the compiled authorities and asserts each target occurs exactly once; no copy of the clause is typed by hand"

requirements-completed: []

coverage:
  - id: D1
    description: "Every carrier (INVARIANT, AGENTS.md § Kit vs state, 3 packaging invariant copies, 7 skill sources, orchestrator.md line 8, 17 adapters, 7 twins) holds LEGACY_FALLBACK_CLAUSE byte for byte, held by one test over derived lists"
    requirement: LAYOUT-04
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#the fallback clause in every carrier (5 cases, all pass; 89 in file)"
        status: pass
      - kind: unit
        ref: "RED: tdd-evidence/36-11-task1-red.json → gsd-tools check tdd-red-evidence RED_EVIDENCE_OK (named exactly AGENTS.md and the 3 packaging copies)"
        status: pass
      - kind: other
        ref: "live mutation: one character of the clause in subagent.frontmatter.md copy 2 changed → 'every carrier holds' fails; restored → passes"
        status: pass
    human_judgment: false
  - id: D2
    description: "AGENTS.md names memory-bank/plans/ paths and stays under its 20,480 B WARN size"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "grep -c 'say once: run `install --migrate`' AGENTS.md → 1; subagent.frontmatter.md → 2; wc -c < AGENTS.md → 8453"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js AGENTS.md agent-factory/packaging skills .claude scripts/kit-model.ts scripts/kit-model.js scripts/kit-model.test.ts scripts/generate-role-adapters.ts scripts/generate-role-adapters.js scripts/adapter-byte-baseline.test.ts → exit 0, 43 files, 0 sites, 37 exact clause occurrences subtracted"
        status: pass
    human_judgment: false
  - id: D3
    description: "The claim registry blocks for the AGENTS.md anchors moved in the same commit; every kit gate and freshness gate passes"
    requirement: LAYOUT-04
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js, check-foundation-guards, check-kit-refs, check-public-docs-vocabulary, check-banned-claims, check-nul-bytes, check-uat-oracles, check-audit-register, check-imperative-lexicon; VALIDATE_KIT_ROOT=. validate-agent-factory (each exit 0)"
        status: pass
      - kind: other
        ref: "npm run freshness, freshness:adapters, freshness:skill-twins, freshness:host-entries, freshness:catalog, freshness:guarantees, freshness:hook-manifest (each exit 0)"
        status: pass
      - kind: unit
        ref: "npx vitest run on 26 targeted files (kit-model, adapter-byte-baseline, generate-skill-twins, check-kit-refs, check-claim-anchors, audit-model, host-tools, host-tools-prose, kit-route, validate, guard-retired, model-dial-consistency, generate-role-adapters, check-public-docs-vocabulary, check-banned-claims, state-path-scan, generate-guarantees, generate-catalog, check-audit-register, generate-safety-surface, host-entries, host-entry-docs, closing-claims, message-references, state-layout, check-foundation-guards): 1674 passed, 1 skipped, 0 failed"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 11: AGENTS.md and the packaging copies carry the fallback clause, and one test holds every carrier to it Summary

**AGENTS.md § Kit vs state now reads `` `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE ``. Its invariant blockquote carries `LEGACY_FALLBACK_CLAUSE` verbatim, and its other state mentions name `memory-bank/plans/`. The three packaging invariant copies are INVARIANT verbatim. The C-28-015, C-28-016 and C-28-020 registry blocks moved with their anchors. A new case in `scripts/kit-model.test.ts` holds all 37 carriers to the constant by exact byte containment. Its carrier lists are derived, and a mutation control proves it refuses a one-character drift.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-21T10:23:08Z
- **Completed:** 2026-10-21T10:32:34Z
- **Tasks:** 1 (tracer, TDD)
- **Files modified:** 5, plus 1 RED evidence record

## Accomplishments

- **The every-carrier test (D-14, T-36-13).** `describe("the fallback clause in every carrier …")` in `scripts/kit-model.test.ts` imports `LEGACY_FALLBACK_CLAUSE`, `STATE_ROOT_REL` and `LEGACY_STATE_ROOT_REL` from `../install/state-layout.js` and `INVARIANT` from `./kit-model.js`. It has five cases:
  1. Every carrier holds the clause. The test compares bytes with `Buffer.includes` and does no normalization.
  2. The carrier lists are derived and their total is checked. Adapters come from `listRoles()` through the generator's `grugops-<stem>.md` rule and must equal `listAgentAdapters()`. Skill sources come from `listPluginSkillAdapters()`, twins from `listSkillAdapters()`, and packaging copies from `listPackagingTemplates()`, one per invariant line. The number of carriers asked must equal the sum of those derivations (37 today: 1 + 1 + 3 + 7 + 1 + 17 + 7). Every list must be non-empty, and every label must be unique.
  3. A discrimination control. For each carrier, one clause character is changed, once to a no-break space (a premise check confirms NFKC folds it back to a space) and once from a backtick to an apostrophe. The same predicate must refuse both.
  4. INVARIANT carries the clause exactly once and contains `` `memory-bank/plans/` ``. With the clause removed, it contains no `` `plans/` ``.
  5. D-03: no role other than orchestrator.md and no workflow contains the clause or the text `install --migrate`.
- **AGENTS.md (LAYOUT-01).** Changes:
  - The STATE bullet (line 38) is rewritten.
  - The invariant blockquote (line 43) has the INVARIANT STATE clause, then one space and the clause. The tail is unchanged and has no Full-rule pointer.
  - Lines 18, 93, 95 and 155 now name `memory-bank/plans/` paths.

  No new sentence was added beyond the clause. The file grew from 8137 B to 8453 B and is under the 20,480 B WARN size.
- **Packaging.** `slash-command.template.md` has 1 invariant copy and `subagent.frontmatter.md` has 2. Each copy is now INVARIANT byte for byte. The board mentions (template line 35, frontmatter lines 73 and 111) name `memory-bank/plans/board.md`.
- **Claim registry (D-16).** The C-28-015 block's STATE line, the C-28-016 block and the C-28-020 block's second line now match their anchors. C-28-020's line field changed to 154-155, so `check-claim-anchors` exits 0. Nothing else in the file changed.

## Task Commits

1. **Task 1 (tracer, TDD): AGENTS.md, the packaging copies and the registry carry the clause, and a test holds every carrier to it**
   - RED `bed3154c` (test): the new case failed naming exactly `AGENTS.md § Kit vs state` and the three packaging invariant copies. The other four new cases passed.
   - GREEN `125aab38` (feat): AGENTS.md, both packaging templates and the registry blocks, in one commit (D-16).
   - Tracer gate: interactive run, `end-of-phase` mode, automated-only verify. Both `<automated>` blocks were re-run on the committed tree. Verify 1 exited 0 (89 passed, four gates ALL CHECKS PASSED). Verify 2 exited 0 (43 files, 0 sites). The plan has no expansion task.

## RED evidence

- Record: `.planning/phases/36-state-layout-authority-path-move-and-protection/tdd-evidence/36-11-task1-red.json` (vitest `tap-flat` report, exit 1).
- Classifier: `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`).
- Semantic assessment: the target case ran and failed on its planned assertion. The drifted list named only the four carriers this plan had not yet edited. No load, syntax or fixture fault occurred.
- First attempt was refused: the classifier returned `INVALID_RED (invalid_record)` with "Malformed TAP". The cause was the `toEqual([])` diff, which put an unindented multi-line `actual:` into the TAP YAML block. The assertion now compares the drifted labels joined into one string (`.toBe("")`). It holds the same predicate, and the failure output is one line. The re-run was classified OK.

## Files Created/Modified

- `scripts/kit-model.test.ts`: the every-carrier describe block, plus the imports for `INVARIANT` and `../install/state-layout.js`.
- `AGENTS.md`: § Kit vs state STATE bullet and blockquote, plus lines 18, 93, 95 and 155.
- `agent-factory/packaging/slash-command.template.md`: the invariant copy and the board mention.
- `agent-factory/packaging/subagent.frontmatter.md`: the two invariant copies and the two board mentions.
- `docs/audit/28-claim-registry.md`: the C-28-015, C-28-016 and C-28-020 verbatim blocks, and C-28-020's line field.
- `.planning/phases/36-state-layout-authority-path-move-and-protection/tdd-evidence/36-11-task1-red.json`: the RED record.

## Decisions Made

- **C-28-012 needed no edit.** Its fenced block is the single line at AGENTS.md:16, the config bullet. `check-claim-anchors` compares exactly as many lines below the anchor as the block holds, so the line-18 board edit falls outside the registered claim. The gate exits 0 with the block unchanged. The 36-08 note listed C-28-012 among the blocks to move. That was a precaution, and the file's structure shows the block was never affected.
- **Packaging copies equal INVARIANT.** Before this plan, each copy was byte-identical to INVARIANT with the old STATE clause, so the "abbreviated" form is INVARIANT itself. The script derived the old line from INVARIANT, checked that each file held that line the expected number of times (1 and 2), and replaced it.
- **Mechanism prose is unchanged.** For example, C-28-020's mechanism still describes the seed as it stood in Phase 28. This follows D-09 and the 36-08 precedent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The RED assertion was reshaped so the TAP report parses**
- **Found during:** Task 1, RED.
- **Issue:** `expect(drifted).toEqual([])` printed a multi-line `actual:` that broke the TAP YAML. The RED classifier refused it as `invalid_record`.
- **Fix:** The test now compares `drifted.join("; ")` with `.toBe("")`. The predicate is the same, and the failure output names every drifted carrier on one line.
- **Files modified:** scripts/kit-model.test.ts
- **Verification:** the classifier returned `RED_EVIDENCE_OK`.
- **Committed in:** bed3154c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** None on scope. The test's meaning is unchanged.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- No copy of the old STATE clause (`` `plans/`, `memory-bank/`, `.grugops/` ``) remains in the repository outside `.planning/`. `git grep` finds only an unrelated line in `examples/01-greenfield-bootstrap.md` that names the three roots in a different order.
- **36-12 to 36-14:** LAYOUT-04 ends at 36-13 and LAYOUT-01 at 36-14. Both stay unchecked in REQUIREMENTS.md.
- `check-diff-disposition` (known pre-existing red) was not run. The full suite was not run, as instructed; it is scheduled for plan 14.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: scripts/kit-model.test.ts (contains `LEGACY_FALLBACK_CLAUSE`), AGENTS.md (contains ``say once: run `install --migrate` ``), the RED evidence record.
- FOUND commits: bed3154c and 125aab38 (both ancestors of HEAD; `git rev-list --count 8ce4217e..HEAD` = 2 before this SUMMARY).
- Acceptance: grep counts 1 (AGENTS.md) and 2 (subagent.frontmatter.md), with baseline 0 and 0. `wc -c < AGENTS.md` = 8453 < 20480. The carrier case fails on a mutated carrier and passes on the tree.
- Plan verification: (1) targeted vitest files passed, (2) the freshness gates exit 0, (3) the repo gates exit 0, (4) `git branch --show-current` prints `main`.
