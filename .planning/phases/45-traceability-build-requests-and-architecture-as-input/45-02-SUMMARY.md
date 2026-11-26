---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 02
subsystem: kit-text
tags: [upstream, architecture, adr, workflow-00, workflow-20, floors]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: Workflow 20 (upstream sources), the `owns.areas` vocabulary, the `Build-request:` observation shape
provides:
  - Workflow 00 step 1 (upstream stack decisions over `default_stack`, item by item)
  - Workflow 20 `## Upstream architecture` (the `Accepted (upstream)` ADR rule, deviations as build requests, the floor rule stated once)
  - one untagged Workflow 20 stop bullet for a floor conflict (WORKFLOW_STOP_BULLET_COUNT 56)
  - the `Accepted (upstream)` ADR status in both templates
  - one Workflow 20 pointer line in BA/PM, System Analyst, Architect/Design, Designer and Greenfield Mapper
affects: [45-10, 47]

actuals:
  tokens: 11549
  tasks: 2
  commits: 3
plan_head_before: 0e1dab17db73cadf37f6b6fa073b6248061c1eff
plan_head_after: 52c18e143072c7608611f0aa26fcb3dd02802e7b

tech-stack:
  added: []
  patterns:
    - "disposition rows generated from the gate's own changedClauses/segmentClauses, with renumbered steps recorded as kept word-for-word rows"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-02.md
  modified:
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - agent-factory/workflows/20-upstream-sources.md
    - agent-factory/seed/memory-bank/50-decisions/ADR-template.md
    - memory-bank/50-decisions/ADR-template.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/designer.md
    - agent-factory/roles/greenfield-mapper.md
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/flow-guidance-text.test.ts
    - scripts/check-foundation-guards.test.ts
    - docs/reference/agents/architect-design.md
    - docs/reference/agents/greenfield-mapper.md

key-decisions:
  - "The floor-conflict stop in Workflow 20 is UNTAGGED: no dial value may lower a floor, so a checkpoint tag would say something false; neither the roster nor any site count moved (WORKFLOW_STOP_BULLET_COUNT 55 -> 56)"
  - "Workflow 20 names the Architect as the only role that writes an `Accepted (upstream)` ADR; the Greenfield Mapper records only which source and pin gave each stack item"
  - "Renumbering Workflow 00 steps 1-10 to 2-11 made git diff read each step as removed and added; each such clause got a kept word-for-word row rather than a narrowed corpus"
  - "The corpus-total fixture in check-foundation-guards.test.ts moved ROLE_GROWTH 0.05 -> 0.04, because the 333 B of pointer lines left the 0.05 construction 205 B past 64,001 B"

patterns-established:
  - "A kit rule stated once is proven once by a test that walks agent-factory/ and expects exactly one file to hold the sentence"

requirements-completed: [ARCH-01, ARCH-02]

coverage:
  - id: D1
    description: "Workflow 00 step 1 reads upstream stack or architecture decisions per Workflow 20 and applies them over `default_stack` item by item; steps are 1-11 and contiguous"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both ADR templates list `Accepted (upstream)` in the status line"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (b)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Workflow 20 `## Upstream architecture` holds the ADR rule, the deviation rule and the floor rule naming the §14 gate, the security and NFR gates, verify-before-write and the git-host floor"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (c)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The floor rule is stated in exactly one kit file (Workflow 20), and its stop bullet is counted (56) and untagged"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (d)"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (118 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Five roles each hold exactly one Workflow 20 pointer line and stay below WARN"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (e)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (ALL CHECKS PASSED; no WARN naming the five roles)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A floor conflict found while work is in flight stops that work: tickets go to `Blocked` and the Orchestrator stops for a named human before any further dispatch (prose rule)"
    requirement: ARCH-02
    verification: []
    human_judgment: true
    rationale: "Agent behavior under the prose rule; the plan routes this edge to the end-of-phase UAT (verification: backstop)"

duration: 15min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 02: Architecture as input Summary

**An upstream source that owns `architecture` now decides the stack at bootstrap (Workflow 00 step 1, over `default_stack` item by item). The Architect records each of its decisions as an `Accepted (upstream)` ADR with a full `upstream:` citation. Workflow 20 states once that the grugops floors never move. A conflict with a floor is a build request plus an untagged human stop.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-26T09:57:18Z
- **Completed:** 2026-11-26T10:12:42Z
- **Tasks:** 2
- **Files modified:** 18 (git diff --stat, including the compiled .js, the hook manifest and the reference pages)

## Accomplishments
- Workflow 00 has a new step 1 and an `upstream` Inputs bullet. The old steps 1-10 are now 2-11, word for word.
- Workflow 20 has two new `## Agents involved` bullets (Architect/Design, Greenfield Mapper), the `## Upstream architecture` section, one stop bullet and one Done-condition sentence. The sentence "The floor does not move." appears only in this file.
- `Accepted (upstream)` is in the status line of both the seed ADR template and the repository's own. The one-line difference between them is kept.
- One pointer line in each of the five roles. Final bytes: ba-pm 2963 (WARN 3053), system-analyst 2305 (2384), architect-design 2968 (3068), designer 2780 (2799), greenfield-mapper 2362 (2410).
- `WORKFLOW_STOP_BULLET_COUNT` is now 56 (the derivation printed "holds 56 bullet(s) against the recorded 55"), with a dated re-walk. The hook manifest and the reference pages were regenerated.

## Task Commits

1. **Task 1: Workflow 00 step 1, the ADR status value, and Workflow 20's `## Upstream architecture` section with its stop** - `9a406530` (feat)
2. **Task 2: One pointer line in each of the five roles and the single-statement test** - `1c811a25` (feat)
3. **Task 2 follow-up: corpus-total fixture re-measured** - `52c18e14` (test)

## Files Created/Modified
- `agent-factory/workflows/00-bootstrap-greenfield.md`: Inputs bullet, new step 1, steps renumbered 2-11
- `agent-factory/workflows/20-upstream-sources.md`: agents bullets, `## Upstream architecture`, stop bullet, Done sentence
- `agent-factory/seed/memory-bank/50-decisions/ADR-template.md`, `memory-bank/50-decisions/ADR-template.md`: status value
- Five role files: one `## Reads` pointer line each. The texts are exactly as the plan gave them; no gate refused any of them.
- `scripts/checkpoints.ts`/`.js`: count 56 and the 45-02 re-walk paragraph
- `hooks/hook-entry.ts`/`.js`: regenerated by `npm run generate:hook-manifest`. `scripts/floor-invariance.test.ts` needed no change and passes after commit.
- `docs/reference/agents/architect-design.md`, `greenfield-mapper.md`: regenerated. Both now list Workflow 20.
- `scripts/flow-guidance-text.test.ts`: describe `architecture as input (plan 45-02, ARCH-01, ARCH-02)`, cases (a)-(e)
- `scripts/check-foundation-guards.test.ts`: ROLE_GROWTH 0.05 -> 0.04 with a dated note
- `docs/audit/29-style-dispositions/45-02.md`: 48 rows generated from the gate's segmentation

## Decisions Made
See key-decisions in the frontmatter. D-18 split check: the work stayed at five pointer lines, one Workflow 00 step, the ADR status and one Workflow 20 section with one stop bullet. No split was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Workflow 00 step 1 sentence over the procedural bound**
- **Found during:** Task 1
- **Issue:** The planned sentence "Apply each decision over `default_stack` item by item, so upstream decides ..." was 21 words, and the WP-02 bound for procedural sentences is 20.
- **Fix:** Split it into "Apply each decision over `default_stack` item by item." and "Upstream decides the items it names, and `default_stack` fills only the rest." The meaning is unchanged.
- **Committed in:** 9a406530

**2. [Rule 3 - Blocking] Renumbering produced removed/added clauses in the disposition gate**
- **Found during:** Task 1
- **Issue:** The `git diff --unified=0` alignment against base e8d7802 reads each renumbered step as removed and added, so 55 findings appeared, not just the new text.
- **Fix:** One **kept word for word** row (same `before` and `after`) for each renumbered clause. All rows were generated from the gate's exported `changedClauses`/`readDispositionRows`/`rowMatches` and the `segmentClauses` split, never by hand. The gate went from 55 findings to 0.
- **Committed in:** 9a406530

**3. [Rule 3 - Blocking] Reference pages moved in Task 1**
- **Found during:** Task 1 (`generate-catalog.test.ts` went red)
- **Issue:** The new Workflow 20 agents bullets added Workflow 20 to the Architect/Design and Greenfield Mapper reference pages. The plan only expected this regeneration in Task 2.
- **Fix:** `npm run generate:catalog` was run in Task 1, and the two pages were committed with it. The Task 2 regeneration then changed nothing.
- **Committed in:** 9a406530

**4. [Rule 1 - Bug] Corpus-total fixture overshoot**
- **Found during:** Task 2 (`check-foundation-guards.test.ts` "corpus total ... WARNs")
- **Issue:** The fixture grows every role by 0.05 before padding the protocol. The 333 B of pointer lines put that construction 205 B past 64,001 B, so the precondition `rest >= PAD_OVERHEAD` failed. The live corpus is 61,291 B, below WARN.
- **Fix:** ROLE_GROWTH 0.05 -> 0.04, with a dated note in the same style as the plan 41-06 note. Both corpus-total cases still prove their claim. 344 of 344 tests pass.
- **Committed in:** 52c18e14

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking).
**Impact on plan:** No scope change. Deviation 4 is a pin the plan did not foresee. Phase 47's planned ~2 KB of role text will likely move ROLE_GROWTH again.

## Issues Encountered
- `node scripts/check-foundation-guards.js` prints `WARN .claude/agents/grugops-orchestrator.md 3368B >= 3072B`. That file was not changed by this plan; the WARN existed before and is advisory.
- The full suite was not run here (orchestrator runs it after the last wave). Targeted runs: checkpoints, floor-invariance, generate-catalog, trace-instructions, kit-model, check-foundation-guards, state-check, check-imperative-lexicon, flow-guidance-text, skills-kit-text, adapter-byte-baseline, tier-kit-text, check-role-rules, install/install.test.ts. All green after commit.

## Verification
- Task 1 chain: check:imperative-lexicon, check:banned-claims, check:claim-anchors, check-kit-refs, check:diff-disposition, check:audit-register: all exit 0
- Task 2 chain: check-foundation-guards (ALL CHECKS PASSED), check:role-rules, check:imperative-lexicon, check:banned-claims, check-kit-refs, check:diff-disposition, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: all exit 0
- Freshness: catalog, adapters, skill-twins, host-entries, hook-manifest and `npm run freshness` (97 .js fresh): all exit 0. `npm run typecheck` exits 0.
- `npx vitest run scripts/flow-guidance-text.test.ts -t "architecture as input"`: 5 passed

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-10 writes the build-request procedure that Workflow 20 now points at as "this workflow" (BA/PM files or merges the request).
- Phase 47: the role corpus is at 61,291 B of 64,000 WARN.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
