---
phase: 41-orchestrator-flow-guidance
plan: 28
subsystem: kit-text
tags: [admission-route, human_admission, witness-name, route-scan, vitest, gap-closure]

requires:
  - phase: 41-27
    provides: "the plugin-install scope of the hook and the witness name, the plan 41-27 route scan and its pins"
provides:
  - "Workflow 06, the browser UAT recipe and the CHANGELOG state the plugin-install, propose_note and dial conditions for the witness's name, and that the default off binds nothing (CR-01)"
  - "install/README.md's scripted-install program list names no Claude Code hook (WR-01)"
  - "a rebuilt route scan over six files with rules R1 to R4, two one-sentence exemptions and a fixture case that proves each rule can fail (WR-02)"
  - "15 pending (named human) disposition rows in docs/audit/29-style-dispositions/41-28.md and a pointer line in 41-27.md"
  - "CR-01, WR-01 and WR-02 recorded fixed by 41-28 in 41-REVIEW-DISPOSITION.md (open: 6)"
affects: [41-verify-work, 41-REVIEW-DISPOSITION, factory.config.md line 238 ruling]

actuals:
  tokens: 9256        # chars/4 over the changed lines of the realized diff 980779522..556100cb
  tasks: 3
  commits: 5
plan_head_before: 980779522ca43a301ba1ab9c7b3b5ce62b65173c
plan_head_after: 556100cb35e858be115441c09533e0289092d0cf

tech-stack:
  added: []
  patterns:
    - "route scan: blocks cut at list markers, headings, table rows and blank lines; sentences split at . ; ! ? outside a code span"
    - "every scan exemption must match exactly one sentence, so it cannot outlive its sentence"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-28.md
  modified:
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/checklists/browser-uat-recipe.md
    - install/README.md
    - CHANGELOG.md
    - docs/audit/29-style-dispositions/41-27.md
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "Workflow 06 says only that the default off gates no note (true for every role), not the review's 'for this lane means all', because no text names the lane finding's by role"
  - "install/README.md leaves out the review's 'only propose_note on a plugin install, behind its hook, can', which restates an unconditioned binding (CR-01's defect)"
  - "The route scan splits at . ; ! ? outside code spans instead of the review's lookahead split, and adds R3 (host-less binding) and R4 (plugin binding with no dial in its block)"
  - "factory.config.md line 238 is reported to a named human as a planning finding, neither exempted nor edited; the CHANGELOG stays out of the scan and is held by pins"

patterns-established:
  - "A scan that guards governance text carries fixtures that prove each of its rules can fail"

requirements-completed: [RUN-04, RUN-05]

coverage:
  - id: D1
    description: "Workflow 06 attended lane states the plugin-install, propose_note and dial conditions and the default-off result (CR-01)"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the attended Chrome lane of Workflow 06 states the plugin-install, propose_note and dial conditions (CR-01; plan 41-28)"
        status: pass
    human_judgment: true
    rationale: "The wording is governance text on the admission route; its disposition rows are pending a named human, and no agent may accept them"
  - id: D2
    description: "The recipe and the CHANGELOG state the dial condition for the witness's name (CR-01)"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the attended Chrome lane of the recipe says the default dial gates no note (CR-01; plan 41-28)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the changelog Security bullet states the dial condition for the witness's name (CR-01; plan 41-28)"
        status: pass
    human_judgment: true
    rationale: "Pending disposition rows in 41-28.md need a named human's reading against the diff"
  - id: D3
    description: "install/README.md names no Claude Code hook on a scripted install (WR-01)"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the install guide's program list puts no Claude Code hook on a scripted install (WR-01; plan 41-28)"
        status: pass
    human_judgment: true
    rationale: "The install-guide row in 41-28.md is pending a named human"
  - id: D4
    description: "The rebuilt route scan fails on every shape the review tried and on the two live defects, and passes the fixed tree (WR-02)"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#no sentence of the six admission-route files names the route without its install form or its dial (CR-01, WR-01, WR-02; plan 41-28)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the route scan flags each shape it was written for, and passes a scoped paragraph (WR-02; plan 41-28)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Records: 15 pending rows, the 41-27 pointer line, the ledger at open: 6, and the full suite on the 21 baseline names"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (21 failed, all in 41-VALIDATION.md Known baseline reds by name)"
        status: pass
    human_judgment: true
    rationale: "The rows are pending (named human); IN-01 to IN-04, WR-03, IN-05 and the factory.config.md line 238 finding need a named human's ruling"

duration: 33min
completed: 2026-11-13
status: complete
---

# Phase 41 Plan 28: The dial condition for the witness's name, the install guide's hook clause and a scan that can fail (CR-01, WR-01, WR-02) Summary

**Workflow 06, the browser UAT recipe and the CHANGELOG now say a Claude Code plugin install can bind the witness's name only for a finding the Orchestrator sends through `propose_note` that the `human_admission` dial gates, and that the default `off` binds nothing; the install guide drops the Claude Code hook from the scripted install; and a rebuilt six-file route scan (rules R1 to R4, 13 fixtures) went red on exactly the two live defects before the fix.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-11-13T18:15:49Z
- **Completed:** 2026-11-13T18:49:06Z
- **Tasks:** 3 of 3
- **Files modified:** 8 (1 created)

## Ruling

41-UAT.md test 10, Olger, 2026-11-13: "Fix first: plan a gap-closure fix for CR-01, WR-01 and WR-02 of the 2026-11-13 review (add the dial condition to Workflow 06 and the CHANGELOG, reword install/README.md line 460, tighten the scan), then re-verify, Olger". The precondition held: the reply, the three gaps at `status: failed`, and CR-01, WR-01 and WR-02 in the 41-REVIEW.md reviewed 2026-11-13T13:44:33Z.

## Accomplishments

- Workflow 06 line 37: plan 41-27's two sentences are replaced by four. A plugin install can bind the name; the hook checks it only on a finding the Orchestrator sends through `propose_note` that the dial gates; at the default `off` nothing binds it; a `note.js` note and every other install bind nothing (R-41-06). The other five sentences of the line are unchanged.
- The recipe's witness bullet adds the default-off clause, the roles `high-severity` gates (`HIGH_SEVERITY_ROLES`, `scripts/context-io.ts` line 4305) and a `note.js` sentence. The plan 41-27 CHANGELOG Security bullet states the same conditions and the install-guide change.
- install/README.md: `note.js` "binds no `human:<name>` stamp to a human"; the phrase "outside the Claude Code hook" is gone.
- The route scan in scripts/flow-guidance-text.test.ts reads Workflows 16, 04 and 06, the note contract, the recipe and install/README.md. It has a route sentence in each file (Workflow 16, note contract, Workflow 04, Workflow 06, recipe, install guide), and each of its two exemptions matches exactly one sentence.
- 41-28.md has 15 `pending (named human)` rows; 41-27.md has one pointer line and no changed row; the ledger reads CR-01, WR-01 and WR-02 `fixed | 41-28` with `open: 6`.

## Task Commits

1. **Task 1 (tracer): route scan, Workflow 06, install guide**
   - `068aa691` test(41-28): rebuild the admission-route scan and pin CR-01/WR-01 text (RED)
   - `ed36ea15` docs(41-28): state the dial condition in Workflow 06, drop the hook from the scripted-install list (GREEN)
2. **Task 2: recipe and CHANGELOG**
   - `4fa016c3` test(41-28): pin the dial condition in the recipe and the changelog bullet (RED)
   - `7fca531f` docs(41-28): state the dial condition in the recipe and the changelog (GREEN)
3. **Task 3: records and phase gate** - `556100cb` docs(41-28): record pending rows for every changed clause and CR-01, WR-01, WR-02 fixed

GREEN commits use `docs(...)`, following plan 41-27's convention for text changes.

## RED and GREEN transcripts

**Task 1 RED** (`npx vitest run scripts/flow-guidance-text.test.ts`, after the test edits and before any kit edit; exit 1, `Tests 3 failed | 161 passed (164)`). The live scan case:

```
AssertionError: expected [ …(2) ] to deeply equal []
+ [
+   "agent-factory/workflows/06-uat-pack.md: [R4] Only a Claude Code plugin install binds the witnessing human's name to the human, through the admission grant the `admission-guard` hook reads.",
+   "install/README.md: [R1] `tools/grugops/note.js` writes a sealed note into the shared context through the same writer and the in-script admission tier, outside the Claude Code hook, and prints a task's current notes with `read`",
+ ]
```

These are exactly the two offenders the plan measured, with no other offender. The other two failures were the moved Workflow 06 case (`missing or out of order: Only a Claude Code plugin install can bind ...: expected -1 to be greater than -1`) and the new install-guide case (`expected '# Installing grugops ...' to contain '`tools/grugops/note.js` writes a seal…'`). The fixture case passed: all 13 fixtures were flagged by their expected rule, the three splitter assertions held, and the scoped control paragraph had no offender and a count of 3.

Semantic assessment: the target tests ran and failed on their planned assertions (the offender list, and a missing sentence). No load, syntax or fixture fault. The GSD `tdd-red-evidence` classifier rejected the vitest `tap-flat` report as `invalid_record` ("Non-TAP data in report"), because vitest leaves a multi-line error message unindented (line 164, `]"`). This plan is `type: execute` with `tdd_mode: false`, so the vitest transcript above is the RED record; the classifier verdict was not used as evidence either way.

**Task 1 GREEN:** build, typecheck and `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts scripts/chrome-lane-bar.test.ts scripts/admission-protocol-docs.test.ts`: exit 0, `Test Files 4 passed (4)`, `Tests 436 passed (436)`. The six text gates exited 0 with `ALL CHECKS PASSED`. Tracer gate: interactive, `end-of-phase`, automated-only verify, re-run passed, so expansion went ahead.

**Task 2 RED:** exit 1, `Tests 2 failed | 162 passed (164)`: the recipe case and the changelog case, each on its `toContain` of the new sentences. **GREEN:** the same four test files 436 of 436, every gate of the task's verify exited 0, `check-foundation-guards.js` `ALL CHECKS PASSED`.

## Full-suite comparison

`npx vitest run --exclude '**/scripts/e2e/**'` at HEAD `7fca531f` (Tasks 1 and 2 committed), default `TMPDIR`, 1,567 s: 7 files failed, 137 passed; **21 failed, 11,738 passed, 2 skipped**. The failed names were compared by name, from the JSON report, against 41-VALIDATION.md § Known baseline reds (21 rows):

- Failed names outside the baseline: **0**.
- Baseline names that did not fail: **0**.

So no file needed a re-run alone and no pre-plan comparison was needed. The 21 names, by file: `install/installer-fs-census.test.ts` (1), `scripts/canonical-corpus.test.ts` (1), `scripts/check-foundation-guards.test.ts` (1, `LIVE COUNT`, from the untracked `~/` directory), `scripts/context-io-writer-set.test.ts` (2), `scripts/context-io.test.ts` (7), `scripts/harness-instance-ledger.test.ts` (4), `scripts/uat-gate-exit-contract.test.ts` (5). `scripts/capture-live.test.ts` passed. The records of Task 3 were written while the suite ran and committed before it finished; the uncommitted-path case did not fail.

After the Task 3 commit: `npm run freshness && npx vitest run scripts/floor-invariance.test.ts` exited 0 (136 of 136). Both Task 3 verify blocks exited 0, including `check-diff-disposition.js` (`0 findings over 28/28 elements`) and every freshness script.

## Files Created/Modified

- `scripts/flow-guidance-text.test.ts` - rebuilt route scan (`ROUTE_FILES`, `routeBlocks`, `routeOffenders`, `ROUTE_EXEMPT`, token constants), its fixture case, the moved Workflow 06, recipe and changelog pins, and the new install-guide pin
- `agent-factory/workflows/06-uat-pack.md` - line 37, four new sentences
- `agent-factory/checklists/browser-uat-recipe.md` - the witness bullet of `## The attended Chrome lane`
- `install/README.md` - the `note.js` entry of the scripted-install program list
- `CHANGELOG.md` - the plan 41-27 bullet of `### Security` under `## [Unreleased]`
- `docs/audit/29-style-dispositions/41-28.md` - created, 15 pending rows
- `docs/audit/29-style-dispositions/41-27.md` - one pointer paragraph
- `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md` - CR-01, WR-01, WR-02 fixed, `open: 6`

No program code changed: the only `.ts`, `.js` or `.json` file the commits touch is `scripts/flow-guidance-text.test.ts`. `git diff --quiet` over docs/audit/41-residuals.md, factory.config.md, install/install.ts, hooks/hooks.json, the plugin manifest, 41-SECURITY.md, 41-UAT.md, 41-VERIFICATION.md and 41-VALIDATION.md exited 0.

## Decisions Made

Wording that differs from the review's suggested fixes, and why (41-28.md repeats this):

- **Workflow 06.** The review's single sentence on the hook and the dial counts 26 or more words, over the 25-word bound (WP-03), so it is split in two. The first sentence keeps plan 41-27's grant clause and changes "binds" to "can bind". The review's "for this lane means `all`" is left out because neither Workflow 06 nor the recipe names the lane finding's `by` role; "the default `off` gates no note" holds for every role.
- **The recipe.** It adds the review's default-off clause plus the `high-severity` role list and a `note.js` sentence, so the recipe holds the detail Workflow 06 leaves out.
- **install/README.md.** The review's "only `propose_note` on a Claude Code plugin install, behind its hook, can" restates a binding with no dial condition, CR-01's defect, so it is left out. Lines 1941-1943 already say which install loads the hook. No residual id is added: the guide cites none.
- **The scan.** The review's split (`/(?<=[.;:])\s+(?=[-A-Z\`(*])|\s-\s/`) cuts inside a code span at `:`, misses a lower-case sentence start, and splits prose dashes. The scan cuts blocks at list markers, headings, table rows and blank lines, then splits at `.`, `;`, `!` or `?` outside a code span. It adds R3 (a binding claim naming no install) and R4 (a plugin binding whose block names no dial), which the review does not name.

**Kit-wide measurement (from planning, not re-run here).** Over all 82 markdown files of agent-factory/ plus README.md, AGENTS.md and install/README.md, the scan flagged 4 sentences at planning: the two defects fixed here, factory.config.md line 179 (a mod's `agent.spawn` hook, unrelated to admission), and **factory.config.md line 238**, "On every host CLI other than Claude Code ... grugops installs no equivalent pre-tool hook", which implies a Claude Code install gets one, while `install.js` writes no hook. That is the WR-01 class in a file no ruling names. **It is a planning finding for a named human.** The scan keeps the review's hand list of files, and this plan neither exempts nor edits line 238.

**The CHANGELOG stays out of the scan.** Over `## [Unreleased]` the scan flags plan 41-27's first sentence ("... no longer say ... un-forgeable on any Claude Code install"), which describes a removed claim; the scan cannot read the negation. Positive and negative pins hold the changelog instead. IN-01, which concerns that pin's section, is unruled and not applied: the pin stays on `flat(CHANGELOG)`.

## Out of scope, with reasons

- R-41-06's wording in docs/audit/41-residuals.md ("only `propose_note`, behind the per-call hook, binds one") names no dial, but it is an accepted residual and an audit record.
- factory.config.md line 238: described above, for a named human.
- Workflow 18 lines 58 and 77 already say the dial decides whether a disposition binds.
- IN-01 to IN-04 of the 2026-11-13 review, and WR-03 and IN-05 of the earlier review: open and unruled. The generated adapter `.claude/agents/grugops-orchestrator.md` is IN-04.

## Deviations from Plan

None - plan executed exactly as written. Two notes on order and form, not on content:

- Task 3's records were committed before the full suite finished, rather than after it, so that the suite's uncommitted-path case would not see them; the suite had started after Tasks 1 and 2 were committed, as the plan requires.
- The Workflow 06 case keeps plan 41-27's explanatory comment and adds the plan 41-28 comment beneath it.

**Total deviations:** 0 auto-fixed. **Impact on plan:** none.

## Issues Encountered

- The GSD TDD RED classifier cannot read vitest's `tap-flat` output when an assertion message spans lines (described above). Not a project defect; the RED is recorded from the vitest transcript.

## Known Stubs

None. The changed files hold no placeholder text or unwired value.

## Owed to a named human

- The `pending (named human)` rows of 41-28.md (in particular the four Workflow 06 rows and the CHANGELOG rows) and of 41-19.md to 41-27.md.
- Rulings on IN-01 to IN-04 of the 2026-11-13 review, and on WR-03 and IN-05.
- The planning finding on factory.config.md line 238, and R-41-06's wording.
- The live host runs of R-41-05 and the Windows check stay `UNKNOWN - verify`.

`/gsd-verify-work` reconciles gaps G-41-10-CR-01, G-41-10-WR-01 and G-41-10-WR-02 from this SUMMARY.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 41-28 is the last plan of phase 41 (28 of 28). The phase is ready for re-verification; its human items are the pending rows and rulings listed above.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-28.md, scripts/flow-guidance-text.test.ts, agent-factory/workflows/06-uat-pack.md, agent-factory/checklists/browser-uat-recipe.md, install/README.md, CHANGELOG.md
- FOUND commits on HEAD: 068aa691, ed36ea15, 4fa016c3, 7fca531f, 556100cb (5 commits, `git rev-list --count 980779522..HEAD`)
- Every acceptance criterion of Tasks 1, 2 and 3 re-ran and passed (greps, `check-diff-disposition.js` exit 0, diff checks, `git diff --quiet` exit 0, docs/audit/28-prepass-evidence.md still modified and unstaged, no commit names it, brand/readme-art.txt or `~/`).

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-13*
