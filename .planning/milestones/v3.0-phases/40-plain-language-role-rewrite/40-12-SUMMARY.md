---
phase: 40-plain-language-role-rewrite
plan: 12
subsystem: testing
tags: [diff-disposition, frozen-set, d-30, role-standin, hook-manifest, typescript]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "D-30 role-rule inventory stand-in (40-01) and the safety-rule inventory facts (40-11)"
provides:
  - "Role `## Stop when` as the fourth FROZEN_SECTION_ANCHORS entry, asserted at ROLE_COUNT (19/19 live)"
  - "ROLE_STANDIN_SCRIPT pin: only scripts/check-role-rules.js may stand in; any other canonical value is a named refusal"
  - "A second `role_standin:` line is a named duplicate refusal; neither refusal spawns anything"
  - "Regenerated DECIDER_MANIFEST hash for scripts/check-diff-disposition.js"
affects: [phase-41, phase-42, diff-disposition, d-30-standin-end]

actuals:
  tokens: 6922
  tasks: 2
  commits: 3
plan_head_before: 50dffed76a6ef8b276a6bf5da0b15cd5180fb330
plan_head_after: 30a2e71c9a3eec36103d55f7444afdc4d1050da0

tech-stack:
  added: []
  patterns:
    - "A new frozen section is appended to FROZEN_SECTION_ANCHORS, never inserted, so existing anchor indexes stay put"
    - "A declared key is pinned by value and counted, not just checked for form"

key-files:
  created:
    - .planning/phases/40-plain-language-role-rewrite/40-12-red-evidence-in04-pin.json
    - .planning/phases/40-plain-language-role-rewrite/40-12-red-evidence-in04-dup.json
  modified:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "WR-04 closed by freezing role `## Stop when` (fourth anchor), not by moving the named-human stops back into `## Hard limits`, which would re-open the D-10 skeleton"
  - "IN-04: role_standin is pinned to scripts/check-role-rules.js and may appear once; a duplicate or substituted value is refused before any spawn"
  - "The D-30 stand-in's scope is unchanged: `## Stop when` clauses join the same structuralSections arm `## Hard limits` already uses"

patterns-established:
  - "Freeze by position: a section that carries safety rules gets a FROZEN_SECTION_ANCHORS entry at full corpus cardinality"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "Role `## Stop when` is frozen like `## Hard limits`: no-key reword is FROZEN with region `## Stop when`; a passing stand-in admits it; a renamed heading resolves 18 of 19 and SHRINKS the frozen set; the `## Notes` line above stays outside the region"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts#WR-04: role `## Stop when` is frozen like `## Hard limits`"
        status: pass
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts#the four frozen section anchors resolve at full cardinality on the real tree"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js (exit 0, roles `## Stop when` 19/19)"
        status: pass
    human_judgment: false
  - id: D2
    description: "role_standin accepts only scripts/check-role-rules.js, once; a substituted script or a second key line is a named refusal with exit 1"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts#refuses a canonical `role_standin` naming any script but scripts/check-role-rules.js (IN-04)"
        status: pass
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts#refuses a second `role_standin` line by name (IN-04)"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts -t \"measuring stick\""
        status: pass
    human_judgment: false
  - id: D3
    description: "The admission hook's frozen manifest matches the rebuilt check-diff-disposition.js"
    verification:
      - kind: other
        ref: "npm run freshness:hook-manifest (1 decider, 13 module hashes match)"
        status: pass
      - kind: other
        ref: "npm run freshness (89 committed .js fresh)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 12: Freeze role `## Stop when` and pin the D-30 stand-in Summary

**The diff-disposition gate now freezes role `## Stop when` at 19/19 like `## Hard limits`, and accepts `role_standin` only as `scripts/check-role-rules.js` on a single line, refusing a substituted script or a duplicate before anything is spawned.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-01T21:21:35Z
- **Completed:** 2026-11-01T21:31:38Z
- **Tasks:** 2
- **Files modified:** 5 (plus 2 RED-evidence records)

## Accomplishments

- WR-04: `FROZEN_SECTION_ANCHORS` gains a fourth entry `{ corpus: "roles", heading: "## Stop when", subpath: ROLES_SUBPATH, expected: ROLE_COUNT }`, appended so the workflow anchors stay at [1] and [2]. `FROZEN_SOURCES.structuralSections.what` names all four sections, and a WR-04 header paragraph explains why.
- IN-04: `ROLE_STANDIN_SCRIPT = "scripts/check-role-rules.js"`. `readRoleStandin` counts every `role_standin:` line first. More than one gives `duplicate`, a non-canonical value gives `malformed` (as before), and any other canonical script gives `unexpected`. `main()` refuses `duplicate` and `unexpected` the same way it refuses `malformed`: fail, verdict, return, nothing spawned.
- Live gate: exit 0. The frozen-set line is now `registry verbatim anchors 47/47, roles \`## Hard limits\` 19/19, workflows \`## Stop conditions\` 19/19, workflows \`## Commit\` 19/19, roles \`## Stop when\` 19/19, positive guard literals 9/9; 540 frozen clause(s), 76 frozen region(s); base e8d7802`, up from 482 clauses and 57 regions. The stand-in line is `PASS  1134 role clause(s) admitted by the role-rule inventory stand-in (D-30)`, up from 1130. That matches the 1134 measured at planning time. The four extra clauses had disposition rows before; now they sit in a frozen region, so the stand-in admits them.
- Hook manifest regenerated after each rebuild. `npm run freshness:hook-manifest` and `npm run freshness` both pass.

## Task Commits

1. **Task 1: tracer — freeze role `## Stop when`** - `99c1b32c` (feat)
2. **Task 2: IN-04 pin and duplicate refusal (TDD)** - `44506427` (test, RED), `30a2e71c` (feat, GREEN)

**Plan metadata:** recorded in the docs commit that carries this file.

## RED / GREEN record

**Task 1 (tracer, not `tdd="true"`).** For the RED run, ROLE_BODY carried the literal `## Stop when` heading. Using `FROZEN_SECTION_ANCHORS[3].heading` before the anchor existed would have thrown a TypeError at module load, so every case would have failed for the wrong reason. After the anchor existed it was switched to `FROZEN_SECTION_ANCHORS[3].heading`. RED: 4 failed and 118 passed, all on assertions:
- `the four frozen section anchors ...`: `expected [ '## Hard limits', …(2) ] to deeply equal [ '## Hard limits', …(3) ]`
- clean mirror: `expected '…' to contain 'roles \`## Stop when\` 19/19'`
- WR-04 no key: `expected +0 to be 1`. The reword with a companion-less row passed, because nothing froze the section.
- WR-04 renamed heading: `expected '…' to contain 'roles \`## Stop when\` resolved 18 of 19'`. The gate instead reported ZERO derived clauses for a heading-only change.
- The stand-in and `## Notes` adjacency cases passed before the change, as planned. They guard D-30's unchanged scope and the region's start, and are not RED cases.

GREEN: 122 of 122 passed. Live gate exit 0 with `roles \`## Stop when\` 19/19`.

**Task 2 (`tdd="true"`).** RED command: `npx vitest run scripts/check-diff-disposition.test.ts -t IN-04 --reporter=tap-flat`, exit 1. Both targets were `not ok` with `expected +0 to be 1`: the gate exited 0 on `role_standin: scripts/is-entry.js` (with a passing stub planted there) and on two `role_standin` lines. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`) for each record (`40-12-red-evidence-in04-pin.json`, `40-12-red-evidence-in04-dup.json`). Semantic assessment: each target ran with no load, setup or collection error and failed on its planned exit-status assertion. The reason was the intended one: the old gate checked only the form of the value, so it ran to `ALL CHECKS PASSED`. GREEN: 124 of 124 passed. `-t "stand-in"` gives 10 passed: the 9 in the D-30 describe plus the WR-04 stand-in case. No REFACTOR commit was needed.

**Existing cases that needed the new section in their role body:** none. Every mirror role is built from ROLE_BODY through `writeCorpus`, so adding the section there gave every mirror 19 of 19. No assertion was relaxed. The one existing assertion that changed is the anchor-list case. It now expects four headings and also pins `[3].expected === ROLE_COUNT` and `[3].corpus === "roles"`. The clean-mirror case gained an assertion for `roles \`## Stop when\` 19/19`.

## TDD Gate Compliance

Task 2: the RED commit `test(40-12)` (`44506427`) comes before the GREEN commit `feat(40-12)` (`30a2e71c`). Task 1 is a tracer task, so its test and code went into one `feat` commit, as tracer tasks allow.

## Files Created/Modified

- `scripts/check-diff-disposition.ts` / `.js`: fourth anchor, four-section `what`, WR-04 and IN-04 header paragraphs, `ROLE_STANDIN_SCRIPT`, `ROLE_STANDIN_KEY_ALL_RE`, `StandinDeclaration` kinds `duplicate` and `unexpected`, and the two refusals in `main()`. No new import and nothing that runs on import.
- `scripts/check-diff-disposition.test.ts`: ROLE_BODY's `## Stop when` bullet, the four-anchor case, the clean-mirror assertion, the WR-04 describe (4 cases) and two IN-04 cases.
- `hooks/hook-entry.ts` / `.js`: DECIDER_MANIFEST hash for `scripts/check-diff-disposition.js`, regenerated.
- `40-12-red-evidence-in04-{pin,dup}.json`: Task 2's RED evidence records.

## Decisions Made

- Freeze rather than move: `## Stop when` became a frozen anchor, and the named-human stops stay in the D-10 skeleton.
- The `duplicate` declaration carries its `count`, so the refusal says how many lines it found (`carries 2 \`role_standin\` lines — a duplicate key`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale derivation count in a main() section comment**
- **Found during:** Task 1
- **Issue:** The comment `The frozen set, and its four two-sided derivations` became wrong once a fourth section anchor was added. There are now five: the registry plus four sections.
- **Fix:** Changed it to `five`. Comment only, no behavior change.
- **Files modified:** scripts/check-diff-disposition.ts
- **Committed in:** 99c1b32c

**2. [Process] RED heading spelled as a literal for one run**
- **Found during:** Task 1
- **Issue:** The plan says ROLE_BODY should use `FROZEN_SECTION_ANCHORS[3].heading`. Before GREEN that index does not exist, so the RED run would have crashed at import.
- **Fix:** The RED run used the literal heading. The committed file uses the anchor reference, as the plan specifies.
- **Committed in:** 99c1b32c

**Total deviations:** 2 (1 comment fix, 1 RED-run ordering detail). **Impact:** none on scope. The committed result matches the plan.

## Issues Encountered

- Information only: `check-foundation-guards.test.ts` has one failure, `every remaining floor item's LIVE COUNT is DERIVED`. The untracked `~/` directory at the repo root, which is not part of this plan, adds `~/projects/hacks/grugops-example-01/tools/grugops/*.js` to the `.js` walk, so the walk no longer equals git's index. It is environmental and out of scope. It goes away once that directory leaves the repo root. The plan's own foundation-guards check (`-t "import|..."`) passes.
- `scripts/uat-gate-exit-contract.test.ts` still has its 5 known failures. 31 cases pass, and all 3 "measuring stick" cases pass.
- Prior-wave note (40-11): `check-diff-disposition.js` prints about 897 KB on a red run, and a pipe reader can be cut short. This plan did not hit it: the live gate is green and about 1.6 KB, and the tests capture through `spawnSync`. Not touched; still open.

## Next Phase Readiness

- Gap 1's third missing item (the `## Stop when` freeze) and the key pin are closed. When a recorded decision later ends the D-30 stand-in, every edit to role `## Hard limits` or `## Stop when` will owe a disposition row.
- Phases 41 and 42 inherit that obligation once the stand-in ends.

## Self-Check: PASSED

- FOUND: all 5 modified files and both evidence records
- FOUND: 99c1b32c, 44506427, 30a2e71c (ancestors of HEAD; `check evaluation-scope --plan 40-12 --commits-only` resolves all three)
- Plan verification re-run: build and typecheck exit 0; the scoped vitest run gave 90 passed; `check-diff-disposition`, `check-role-rules` and `check-foundation-guards` all exit 0; `freshness`, `freshness:hook-manifest` and the voice-model diff check all clean

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-01*
