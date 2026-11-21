---
phase: 42-skills-per-role-and-evaluation
plan: 07
subsystem: public-docs
tags: [skills, docs, claim-gates, doctor, install-readme, vitest]

requires:
  - phase: 42-skills-per-role-and-evaluation
    provides: "42-02 readRoleSkills and the --check skill lines; 42-04 ratify-none decision; 42-05 Advisory lines bullet; 42-06 SKILLS_TABLE_HEADER, SKILLS_RECORD_FRAGMENTS and the design-system rule; 42-08 HOST_SKILL_DIRS for every host"
provides:
  - "docs/skills.md: the public third-party skills page for an empty recommended set"
  - "SKILLS_DOC export and a named `skills` part in both claim gates (public-docs corpus and banned-claim scan set)"
  - "Two-way pins in scripts/skills-kit-text.test.ts: renderHostRow vs HOST_SKILL_DIRS, § Recommended skills vs readRoleSkills, every Claude Code adapter's tools: line vs the spawn-mode sentence"
  - "install/README.md `**Declared skills.**` bullet in the --check list"
  - "A doctor case for the shipped kit's empty skill state"
affects: [42-verify, docs/skills.md, install/README.md, check-public-docs-vocabulary, check-banned-claims, check-flip-manifest]

actuals:
  tokens: 10419
  tasks: 3
  commits: 7
plan_head_before: 2f38172a1dbd3bbab9503c5531e98f4e08f750bd
plan_head_after: 05adf093ac7a69540efc8b1425c6a612e5fdaa78

tech-stack:
  added: []
  patterns:
    - "A public page joins both claim gates as a named one-file part in a commit before the page exists, watched red, as docs/GUARANTEES.md did"
    - "A doc table is rendered by one test function from the code table, and the page copies the render"

key-files:
  created:
    - docs/skills.md
    - .planning/phases/42-skills-per-role-and-evaluation/deferred-items.md
  modified:
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/skills-kit-text.test.ts
    - scripts/check-flip-manifest.test.ts
    - install/README.md
    - install/skills-doctor.test.ts

key-decisions:
  - "SKILLS_DOC is declared once in check-public-docs-vocabulary.ts (no generator owns the page) and imported by check-banned-claims.ts and both test files"
  - "PUBLIC_DOCS_SCAN_COUNT 11 -> 12 and BANNED_CLAIM_SCAN_COUNT 128 -> 129 were read off each gate's refusal over a temporary placeholder page, then the placeholder was removed before the red commit"
  - "docs/skills.md is the second member admitted by name under the docs/ segment class in check-banned-claims.test.ts (cardinality pin 1 -> 2)"
  - "The page says `versions` where the plan draft said `pins`, so a reader who does not know the term still follows it; no 40-hex string appears"
  - "The page links the evaluation record from § Recommended skills and names its path again in § How these were chosen, which the test checks exists on disk"

patterns-established:
  - "renderHostRow: one render of a host row; the page copies it, the test compares row by row in registry order"
  - "recommendedSkillsFindings: the page's recommended set equals the declared set both ways, with the no-recommendation sentence only while the set is empty"

requirements-completed: [SKILL-03, SKILL-01, SKILL-05]

coverage:
  - id: D1
    description: "docs/skills.md joined both claim gates in a commit before the commit that wrote it; that commit's gates refused naming the page; the page commit turned both green"
    requirement: SKILL-03
    verification:
      - kind: other
        ref: "git merge-base --is-ancestor d4d042a4 bd85e8f6"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#REPORTS a missing docs/skills.md by name rather than crashing with ENOENT"
        status: pass
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#REPORTS a missing docs/skills.md by name rather than dying with a stack trace"
        status: pass
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ Recommended skills says grugops recommends no third-party skill, gives the reasons and points to the evaluation; a test holds its skill set equal to the declared skills both ways; no pin and no install command on the page"
    requirement: SKILL-03
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#§ Recommended skills names exactly the skills the shipped roles declare, both ways"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#the Recommended-skills pin fails both ways: a declaration the page does not name, and a table with no declaration"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#§ How these were chosen names a record that exists and both re-evaluation triggers; the page prints no pin or install command"
        status: pass
    human_judgment: true
    rationale: "Whether the page implies grugops vetted or ships a skill, and whether its reasons sentence fairly states the maintainer's reply, are prose judgements the pins do not reach (plan prohibitions verified by judgment)."
  - id: D3
    description: "§ How a role declares a skill carries the role contract's header and record fragments, the skills: line, the fallback rule and the spawn-mode limit, which a test checks against every Claude Code adapter's tools: line"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#§ How a role declares a skill carries the role contract's table header and record line, and the spawn-mode limit"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#no Claude Code role adapter has a `Skill` tool, so the page's spawn-mode sentence holds"
        status: pass
    human_judgment: false
  - id: D4
    description: "§ Where each host looks for skills has one row per HOST_TOOLS host, equal cell by cell to HOST_SKILL_DIRS"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#§ Where each host looks for skills has one row per HOST_TOOLS host, in registry order, equal cell by cell to HOST_SKILL_DIRS"
        status: pass
    human_judgment: true
    rationale: "The plan's human-check: on each non-Claude host, put a test skill in a folder the table names and confirm the host lists it. No non-Claude host was run; those rows stay as their documentation source records them."
  - id: D5
    description: "§ What install.js --check does, the README `**Declared skills.**` bullet, and the shipped kit's --check printing no skill line"
    requirement: SKILL-05
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#§ What install.js --check does and § Design-system files say what the doctor and the two roles do"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#an install of the shipped kit for Claude Code and Codex CLI prints one skill line per declared skill per agent, and exits as the no-declaration run does"
        status: pass
      - kind: unit
        ref: "install/skills-doctor.test.ts#install/README.md's --check list has one **Declared skills.** bullet that says what the lines are and links docs/skills.md"
        status: pass
    human_judgment: false

duration: 37min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 07: The public skills page Summary

**docs/skills.md now tells a reader that grugops recommends no third-party skill and why, that any skill they install is theirs to vet, how a role would declare one with its fallback, and where each of the six hosts looks for skills. The page joined both claim gates before it was written, its host table and recommended set are pinned two ways to the code, and the install README explains the doctor's skill lines and the empty state.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-11-16T19:45:44Z
- **Completed:** 2026-11-16T20:23:26Z
- **Tasks:** 3
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments

- Both claim gates name docs/skills.md as a one-file `skills` part. The join commit ran red with these lines, verbatim:
  - `FAIL  public-docs scan derivation refused: docs/skills.md is a NAMED member of the public-docs scan set and does not exist at /home/olger/projects/public/grugops/docs/skills.md — refusing to report a verdict over a part whose one member could not be read. A missing document is not a clean one`
  - `FAIL  banned-claim scan derivation refused: docs/skills.md is a NAMED member of the banned-claim scan set and does not exist at /home/olger/projects/public/grugops/docs/skills.md — refusing to report a verdict over a part whose one member could not be read. A missing document is not a clean one`
- The new counts were read off each gate's refusal over a temporary placeholder page: `derived 12 document(s), expected exactly 11 (root 4, examples 5, kitReadme 1, guarantees 1, skills 1)` and `derived 129 document(s), expected exactly 128 (kit 79, publicDocs 13, installReadme 1, skillSources 7, claudeAdapters 28, pluginManifests 2, guarantees 1, skills 1, overlap 3)`.
- With the page written, the gates pass: `AUDIT-02: 12 public document(s) carry zero retired vocabulary` and `banned claims: 0 findings over 129/129 elements`.
- docs/skills.md has its eight sections in order. The host table is the output of `renderHostRow` over `HOST_SKILL_DIRS`.
- install/README.md has the `**Declared skills.**` bullet right before `**Advisory lines.**`. No install.ts or install.js line changed.

## Task Commits

1. **Task 1: docs/skills.md joins both claim gates, then the first page (tracer)**
   - RED `d4d042a4` (test): parts, `SKILLS_DOC`, moved pins, test-file changes; both gates refuse naming the page
   - GREEN `bd85e8f6` (docs): title, opening, § Read this first, § Recommended skills; live overlap pin 2 -> 3
2. **Task 2: the full page, pinned two ways**
   - RED `739897a1` (test): the docs/skills.md describe block with `renderHostRow` and `recommendedSkillsFindings`
   - GREEN `9c09b98d` (docs): sections 4 to 8
3. **Task 3: the README bullet, the shipped kit's empty state, the closing gates**
   - RED `4d024a4b` (test): the shipped-kit case and the README bullet case
   - GREEN `e15f1e1e` (docs): the `**Declared skills.**` bullet
4. **Full-suite fix:** `05adf093` (fix): docs/skills.md in the flip-manifest planted corpus

**Plan metadata:** the docs(42-07) commit that adds this SUMMARY.

## TDD Gate Compliance

- **Task 1 RED:** after the join, 14 live-tree cases in the two gate test files failed because the page did not exist, and both gates exited 1 with the named-member refusals above. The new mirror cases (missing page, plant) passed on the red build, as designed. That is the D-11 red. The GREEN run gave 167/167.
- **Task 2 RED:** 4 section cases failed on `no "## <heading>" section`. The single-target rerun of `§ How a role declares a skill ...` with `--reporter=tap-flat` returned `RED_EVIDENCE_OK` (`target_test_failed`) once the target was given its fully qualified tap-flat name. The first try named the bare test title and was refused as `no_target_test_failure`. Semantic assessment: the target ran and failed on its planned assertion, because the section locator found no heading. The other four new cases passed at RED because Task 1 had already written those sections. The GREEN run gave 30/30.
- **Task 3 RED:** the README case failed on `the number of **Declared skills.** bullets: expected +0 to be 1`, and the classifier returned `RED_EVIDENCE_OK`. The shipped-kit case passed at RED, as the plan expects. It pins the empty state, which needs no doctor change. The GREEN run gave 328/328 across the five named files.
- GREEN commits use the `docs(42-07)` subject the plan sets, not `feat`, because the change is documentation. No REFACTOR commit was needed.

## Verification

- Task verifies: `npm run build`; the two gate test files 167/167; skills-kit-text 30/30; the five Task 3 files 328/328.
- Closing gates, all exit 0: `npm run typecheck`, `npm run freshness`, `npm run check:build-parity`, `check-banned-claims`, `check-public-docs-vocabulary`, `check-claim-anchors`, `check-kit-refs`, `check-foundation-guards`. The foundation guards print the known pre-existing WARN for `.claude/agents/grugops-orchestrator.md`: 3368B against a 3072B pointer ceiling. The file was last changed in d585bc45, not in this plan.
- Acceptance: J=d4d042a4 is an ancestor of P=bd85e8f6. `SKILLS_DOC` appears 6 times in the vocabulary gate. The page has no 40-hex string and no precedence phrase. `scripts/*.test.ts` stays at 85 files. Both README greps print 1. `install.ts` and `install.js` are unchanged since the plan's base.
- Full suite at e15f1e1e: 11,855 tests, 11,818 passed, 35 failed, 2 skipped. Compared by name against 41-VALIDATION.md § Known baseline reds:
  - 21 failures are baseline reds: `installer-fs-census`, `canonical-corpus`, `check-foundation-guards` LANG-07, `context-io-writer-set`, `context-io`, `harness-instance-ledger`, and four `uat-gate-exit-contract` names. One more `uat-gate-exit-contract` name, "the scanned document set is DERIVED...", fails with the same archived-phase ENOENT.
  - 7 `check-flip-manifest.test.ts` failures were caused by this plan. They were fixed in `05adf093`, and that file now passes 37/37.
  - 7 failures in `mode-census` and `path-spelling-census` come from 42-08 (`84faa547`, before this plan's base). They are logged in deferred-items.md.

## Files Created/Modified

- `docs/skills.md`: the public skills page
- `scripts/check-public-docs-vocabulary.ts` / `.js`: `SKILLS_DOC`, `skillsDocMembers()`, the `skills` corpus part, `PUBLIC_DOCS_SCAN_COUNT` 12
- `scripts/check-banned-claims.ts` / `.js`: the `skills` part importing `SKILLS_DOC`, the three-overlap comment, `BANNED_CLAIM_SCAN_COUNT` 129
- `scripts/check-public-docs-vocabulary.test.ts`: `omitSkillsDoc`, the five-part name array, the disk re-enumeration, the plant and missing-page cases
- `scripts/check-banned-claims.test.ts`: `omitSkillsDoc`, mirror arithmetic (overlap 3), the part-name array, the admitted-by-name set (2), the push-site count 6, the plant and missing-page cases, the live overlap pin 3
- `scripts/skills-kit-text.test.ts`: the docs/skills.md describe block
- `scripts/check-flip-manifest.test.ts`: the planted corpus carries docs/skills.md
- `install/README.md`: the `**Declared skills.**` bullet
- `install/skills-doctor.test.ts`: the shipped-kit and README cases, and the header comment
- `.planning/phases/42-skills-per-role-and-evaluation/deferred-items.md`: the 42-08 census reds

## Decisions Made

See `key-decisions` above. The draft sentences landed with small rewordings. No gate refused a sentence:
- § Recommended skills and § How these were chosen say "versions" where the plan said "pins".
- § Read this first splits the plan's run-on sentence into three short paragraphs.
- § How a role declares a skill puts the record line as "the role's note says `used <skill>` or `<skill> not available; used fallback`, and the role's rule is `Never claim a skill ran.`"
- The host-table source sentence says no host other than Claude Code was run, so on the others a live listing is `UNKNOWN - verify`. It also says the override variables are an assumption from the documentation, as 42-RESEARCH § "Per-host skill discovery" records.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Live overlap pin in check-banned-claims.test.ts**
- **Found during:** Task 1 GREEN
- **Issue:** the D-15 case "the live tree's walked parts carry no host separator..." pins `bannedClaimScanOverlap()` at 2. With the page on disk the overlap is 3.
- **Fix:** moved the pin to 3, with a comment naming the entrant.
- **Files modified:** scripts/check-banned-claims.test.ts
- **Committed in:** bd85e8f6

**2. [Rule 1 - Bug] The flip-manifest planted corpus lacked docs/skills.md**
- **Found during:** the plan-level full-suite run
- **Issue:** `check-flip-manifest` reads the public-docs corpus refusal channel. Every planted tree without the page refused, which failed 7 cases.
- **Fix:** the planted corpus writes docs/skills.md beside docs/GUARANTEES.md. The expected parts and pin moved (publicDocs 5, docsTree 3, overlap 2, pin 10).
- **Files modified:** scripts/check-flip-manifest.test.ts (not in the plan's `files_modified`)
- **Verification:** `npx vitest run scripts/check-flip-manifest.test.ts` passes 37/37
- **Committed in:** 05adf093

**3. [Rule 2 - Missing critical] Plant cases for the new part**
- **Found during:** Task 1
- **Issue:** the plan asked for missing-page cases. Membership is better proven by planting, as the GUARANTEES precedent does.
- **Fix:** each gate test file gained a plant case that puts a retired form or banned literal in docs/skills.md and expects the gate to name it.
- **Committed in:** d4d042a4

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical). **Impact:** each was needed for the suite to stay green or for membership to be proven. No scope change, and install.ts was not touched.

## Issues Encountered

- `check-flip-manifest.js` fails on the live tree before and after this plan, because its manifest was archived in 91b4cbc6. This is out of scope.
- The census reds from 42-08 are in deferred-items.md.

## Known Stubs

None. The page's empty recommended set is the documented state (42-04 ratify-none), not a stub.

## Threat Flags

None. The plan adds no network endpoint, auth path or schema. New tests write only under `mkdtempSync` scratch roots.

## User Setup Required

None.

## Next Phase Readiness

- Phase 42's eight plans all have summaries. The phase is ready for `/gsd-verify-work`.
- Human check carried to UAT: on each non-Claude host you have, put a test skill in a folder the docs/skills.md host table names and confirm the host lists it.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED

All 7 key files exist, and commits d4d042a4, bd85e8f6, 739897a1, 9c09b98d, 4d024a4b, e15f1e1e and 05adf093 are ancestors of HEAD.
