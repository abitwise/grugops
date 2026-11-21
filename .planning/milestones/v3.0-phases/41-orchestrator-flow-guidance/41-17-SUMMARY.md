---
phase: 41-orchestrator-flow-guidance
plan: 17
subsystem: governance-root-ladder
tags: [context-io, trustedRepoRoot, human_admission, T-41-55, D-38, note.js, vitest]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "plan 41-13's undeterminedRoot refusal and the WALK_DID_NOT_RUN sentinel, which every consumer already holds"
provides:
  - "WALK_STARTED_ABOVE_HOME: the walk says when its first directory is above HOME and it inspected nothing"
  - "trustedRepoRoot refuses on that answer before the tail, so neither an unconfigured name nor the kit answers"
  - "no-fault proof on a lone host copy of every audit route, the name bypass, the stated cost, two controls and the limit"
  - "Workflow 16, the note.ts header, R-41-07, R-31-19-02, R-31-19-06 and the CHANGELOG state the rule and its cost"
affects: [41-18, gsd-secure-phase T-41-55 re-audit, R-41-07]

actuals:
  tokens: 15750
  tasks: 3
  commits: 4
plan_head_before: 0ddf2aec604b9a2be6df7458fad1ee6f02e5c8a5
plan_head_after: 1b94ffddae66f872a52e2a507987ad78d2e6a92a

tech-stack:
  added: []
  patterns:
    - "A walk that inspected nothing answers with its own sentinel, never null, so only a walk that ran may end on the kit"
    - "The refusal sits before the tail of trustedRepoRoot, so a name with no configuration cannot answer it"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-17.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.test.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - scripts/runnable-ref/note.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - docs/audit/41-residuals.md
    - CHANGELOG.md
    - "generated: scripts/context-io.js, scripts/runnable-ref/{note,claim,state-check,trace-render,state-roll}.{ts,js}, hooks/hook-entry.{ts,js}"

key-decisions:
  - "41-17: the refusal is one line in the walk's loop (step === 0 returns WALK_STARTED_ABOVE_HOME) plus one throw before the tail of trustedRepoRoot, as D-38 rules; admit() is byte-identical"
  - "41-17: the walk is not widened past D-38: a walk that starts below the bound still stops there, and R-41-07 records that as a fourth limit no human has accepted (T-41-74)"

patterns-established:
  - "assertRefusedAboveHome names the refusal's reason, because HOME at a missing path refuses through the same line for another reason"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "HOME at src, .grugops or .git below the repository refuses the governed finding on a lone host copy, exit 1, no note (T-41-55)"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#HOME at ${sub} below the repository refuses the finding the dial refuses (D-38, T-41-55)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Under that HOME a retained repository never prints noted without its ledger line, and an unparseable config refuses"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#under that HOME a retained repository never prints noted without its ledger line (D-38, GOV-02)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#under that HOME an unparseable config still refuses the note (D-38, D-14)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No unconfigured name steps around the refusal, and a named root carrying the configuration keeps the dial"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#under that HOME, ${name} at a directory with no configuration does not step around the refusal (D-38)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#under that HOME a named root carrying the configuration keeps the dial (D-38)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The stated cost and the two controls: a lean repository above HOME is refused; HOME at the working directory and a walk that ran and found nothing keep their answers"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#THE STATED COST (D-38): a lean repository above HOME is refused rather than run lean"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#CONTROL: at the bound itself the walk runs, so HOME at the working directory keeps today's answers (edge RUN-02 boundary)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#CONTROL: a walk that ran and found nothing still ends lean, outside any repository (D-38 refuses only a walk that inspected nothing)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The limit that stays open (R-41-07 fourth limit, T-41-74) is pinned, not closed, and no human has accepted it"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#LIMIT (R-41-07): a walk that starts below the bound stops there, and the repository's store gains nothing"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#LIMIT (R-41-07): a subdirectory with its own marker reads a lean dial with no change to HOME"
        status: pass
    human_judgment: true
    rationale: "The tests pin the behaviour; whether the limit is acceptable is a residual only a named human may accept or send back for closing"
  - id: D6
    description: "Workflow 16, R-41-07 and the two 41-17 disposition rows say what the ladder refuses, what it costs and what stays open"
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#states the two ladder rules after the tier list and before what tier 0 does not establish"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "Task 3 <human-check>: a named human reads R-41-07 against D-38 and each pending (named human) row against the diff; the gate proves a row exists, not that it is right"

duration: 12min
completed: 2026-11-07
status: complete
---

# Phase 41 Plan 17: The root ladder refuses a walk that inspected nothing Summary

**`HOME` at a real directory below the repository no longer hands the note writer the kit's lean dial: the walk answers `WALK_STARTED_ABOVE_HOME` when its first directory is above `HOME`, and `trustedRepoRoot` throws `undeterminedRoot` on it before any unconfigured name or the kit can answer. `admit()` is byte-identical.**

## Outcome gap the human must see (D-38, R-41-07 fourth limit, T-41-74)

D-38's mechanism and its stated outcome differ by one case, and this plan does not close it. Under `HOME=<repo>/src`, with
the working directory at `<repo>/docs` holding its own `.grugops` directory, a governed `security-nfr` finding stamped
`human:eve` still ends `noted`, exit 0. The walk starts at `docs`, which is below the bound, so it inspected something; it
then stops at the repository root above `HOME` with nothing remembered, and the kit's lean dial answers. The note lands in
`<repo>/docs/.grugops`, and the repository's own store gains nothing. A subdirectory with its own `.git` and `.grugops` gives
the same result with no change to `HOME` at all. Both are pinned by the two `LIMIT (R-41-07)` cases, recorded in R-41-07 as
the fourth limit, and carried as T-41-74 `pending (named human): accept`. **No human has accepted it.** Closing it costs more
than D-38 stated: refusing at every stop above `HOME` refuses a lean directory outside any repository (mutant 3), and telling
a walk that ends at the home directory from `~/scratch` needs an inspection above home that `S-HOME-ABOVE` forbids.

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-07T21:32:57Z
- **Completed:** 2026-11-07T21:44:36Z
- **Tasks:** 3
- **Files modified:** 21 (9 hand-edited, 12 generated)

## Accomplishments

- The authority refuses where the walk inspected nothing, and the refusal reaches every host through the regenerated embeds and the hook manifest.
- A lone host copy refuses each audit route with no fault (`HOME` at `src`, `.grugops`, `.git`; the retained ledger; the unparseable config), and each of the three unconfigured names cannot step around it.
- The cost D-38 states is pinned, and two controls hold the refusal to a walk that inspected nothing.
- The text says the rule, the cost and the limit, and every changed clause has a disposition row.

## Task Commits

1. **Task 1 (tracer, TDD): `HOME` below the repository refuses the note, from the authority to a lone host copy**
   - RED: `0300bfc2` (test)
   - GREEN: `6cb93cfe` (feat)
2. **Task 2 (TDD): every route, the name bypass, the cost and the limit held with no fault** - `34761996` (test)
3. **Task 3: the text says what the ladder now does, what it costs and what stays open** - `1b94ffdd` (docs)

## TDD record

**RED (Task 1).** Three cases `HOME at ${sub} below the repository refuses the finding the dial refuses (D-38, T-41-55)` for
`src`, `.grugops` and `.git`. Run with `--reporter=tap-flat` at `0ddf2aec` plus the test: exit 1, 107 tests, 3 failed, all
three targets. Each failed on the planned assertion, `expected +0 to be 1` on `status`, with stdout `noted t1 ...security-nfr-finding...`.
`gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format `tap`). Semantic assessment: the
target ran and failed for the intended reason, the governed finding was noted under `HOME` below the repository; no load,
fixture or collection fault.

**GREEN (Task 1).** The sentinel, the one-line loop change, the throw before the tail; the describe passes 17 of 17 run.

**Task 2** adds cases over behaviour that landed in Task 1, so its RED evidence is the mutants below rather than a pre-change run.

**Task 3 RED.** The `unfinished` string in `scripts/flow-guidance-text.test.ts` was changed first; `states the two ladder rules ...`
failed (1 failed, 86 passed) before Workflow 16 was edited, and passed after.

## Mutants (Task 2), each seeded once in scripts/context-io.ts, built, regenerated, run, restored

| Mutant | Edit | Cases turned red | Restored |
|---|---|---|---|
| 1, a name answers on the sentinel | `if (discovered === WALK_STARTED_ABOVE_HOME && named !== null) return named;` above the new throw | `under that HOME, GRUGOPS_PROJECT_DIR ...`, `... CLAUDE_PROJECT_DIR ...`, `... GRUGOPS_HOST_DELIVERED_ROOT ... does not step around the refusal (D-38)`, `THE STATED COST (D-38) ...` (4) | yes |
| 2, the sentinel removed | the loop line returns `nearest` alone | the 3 `HOME at ... below the repository` cases, the retained and unparseable cases, the 3 name cases, the cost case (9) | yes |
| 3, every stop above `HOME` refuses on nothing remembered | the loop line returns `nearest === null ? WALK_STARTED_ABOVE_HOME : nearest` | `CONTROL: a walk that ran and found nothing ...`, `LIMIT (R-41-07): a walk that starts below the bound ...` (2) | yes |

Each set is the one `<measured_at_planning>` names. After each restore `git checkout -- scripts/context-io.ts` was followed by
`npm run build` and `generate:runnable-embeds`; `git status` showed only the test file in progress, and a grep for all three
mutant lines in `context-io.ts`, `context-io.js` and `note.js` found 0.

## Verification

- Task 1: `npm run build && npm run typecheck && vitest ... -t "the dial holds with no fault"` pass; `-t "WR-21|CR-13|byte-freeze"` 63 passed (the `admit()` span hash passes with no edit); both freshness checks fresh.
- Task 2: the six files of the first command, 428 of 428 passed. Freshness fresh.
- Task 2, second command (`context-io`, `context-io-writer-set`, `compactor`): 9 failed, 1,157 passed, 1 skipped. Every failed name is in 41-VALIDATION.md § Known baseline reds:

| File | Failed test | Baseline |
|---|---|---|
| context-io-writer-set.test.ts | 31-14 ... > the disposition document exists and carries the enumeration heading | yes |
| context-io-writer-set.test.ts | 31-14 ... > every derived decline clause is enumerated, and the document names no other | yes |
| context-io.test.ts | 31-23 PROBE 5 ... > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation | yes |
| context-io.test.ts | 31-29 ... > PREMISE: the document was read and it names residual ids at all | yes |
| context-io.test.ts | 31-29 ... > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md | yes |
| context-io.test.ts | 31-29 ... > DIRECTION 2: every WRITTEN id is a member the module still exports | yes |
| context-io.test.ts | 31-29 ... > a SEEDED undispositioned member turns the equality RED | yes |
| context-io.test.ts | 31-29 ... > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member | yes |
| context-io.test.ts | 31-29 ... > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition | yes |

- Task 3: flow-guidance-text and tier-kit-text 310 of 310; imperative-lexicon, role-rules, kit-refs, diff-disposition, banned-claims, residual-citations, audit-register, claim-anchors, public-docs, foundation-guards and validate-agent-factory each `ALL CHECKS PASSED`; check-diff-disposition.test.ts and check-role-rules.test.ts 243 of 243. After the commit: `npm run freshness` reports 91 committed `.js` fresh, and floor-invariance 136 of 136.
- The full suite was not run by this plan; per `<verification>` it runs at the wave gate and at the end of plan 41-18.

## Files Created/Modified

- `scripts/context-io.ts` - `WALK_STARTED_ABOVE_HOME`, the loop line, the throw before the tail, the unresolvable start answering `WALK_DID_NOT_RUN`, two docblocks, and `R-31-19-02` / `R-31-19-06`
- `scripts/context-io.test.ts` - `ABOVE` and `CONTROL 4` tightened to the refusal, `HOME_STOP_ANCHOR` moved with its expression
- `scripts/runnable-ref/note-read-sites.test.ts` - `assertRefusedAboveHome`, `belowRepository`, `runInDocs` and 14 no-fault cases
- `scripts/runnable-ref/note.ts` - one header sentence (hand-written part)
- `scripts/flow-guidance-text.test.ts` - the pinned paragraph
- `agent-factory/workflows/16-context-read-write.md` - line 65
- `docs/audit/41-residuals.md` - line 6 and R-41-07
- `CHANGELOG.md` - one `### Security` bullet
- `docs/audit/29-style-dispositions/41-17.md` - two rows, both `pending (named human)`
- Generated, never hand-edited: `scripts/context-io.js`, `scripts/runnable-ref/{note,claim,state-check,trace-render,state-roll}.{ts,js}`, `hooks/hook-entry.{ts,js}`

## Decisions Made

- The change stays at what D-38 rules and goes no wider; the fourth limit is recorded, not closed.
- `ABOVE` was renamed to `ABOVE: an ANCESTOR of the home directory is never inspected, and the search refuses`; `CONTROL 4` keeps its name, as the plan asked only for its first assertion to tighten.
- The LIMIT cases share one helper, `runInDocs`, which builds from `freshRoot("governed")`, spawns the host copy with `cwd` at `docs`, and removes the fixture.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reflowed the note.ts header after the inserted sentence**
- **Found during:** Task 3
- **Issue:** Inserting the sentence mid-line made one comment line 215 characters, against the header's ~120-character wrap.
- **Fix:** Reflowed the three tail lines of `THE NOTE CHECK` paragraph; no words changed.
- **Files modified:** scripts/runnable-ref/note.ts (and its compiled note.js)
- **Verification:** `grep -c 'in a lean repository too (D-38)'` prints 1; freshness fresh.
- **Committed in:** 1b94ffdd

---

**Total deviations:** 1 auto-fixed (1 blocking/format). **Impact on plan:** none on behaviour.

## Issues Encountered

None.

## Owed to a named human (not answered by the agent)

- Task 3 `<human-check>`: read R-41-07 in `docs/audit/41-residuals.md` against D-38, and each `pending (named human)` row in `docs/audit/29-style-dispositions/41-17.md` against the diff; reply with a name and accept or flag each.
- T-41-74 stays `pending (named human): accept`. The agent wrote no acceptance, supplied no name and edited neither 41-SECURITY.md nor 41-VERIFICATION.md.
- Windows remains `UNKNOWN - verify`: `isAboveHome` is unmeasured on a platform that spells one directory two ways (R-31-19-03).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 41-18. `docs/audit/28-prepass-evidence.md` and `~/` are untouched and named by no commit of this plan.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-07*

## Self-Check: PASSED

All key files exist; commits 0300bfc2, 6cb93cfe, 34761996 and 1b94ffdd are ancestors of HEAD.
