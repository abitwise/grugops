---
phase: 41-orchestrator-flow-guidance
plan: 13
subsystem: tooling
tags: [governance-root, trusted-root, fail-closed, read-sites, note-writer, admission]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "scripts/runnable-ref/note-read-sites.test.ts with the 12 Group B rows left red, and the SECOND_SOURCE ruling (plan 41-12)"
provides:
  - "A trustedRepoRoot ladder that fails closed: every read reports failure, and a ladder that could not finish names no root"
  - "namedRootAnswers: a named root with no configuration no longer outranks a configuration that governs the working directory"
  - "An admission server that answers isError on an undetermined root instead of ending"
  - "A no-fault proof of every case 41-SECURITY.md line 102 names, on a lone host copy"
affects: [41-14, 41-15, 41-16]

actuals:
  tokens: 27172
  tasks: 3
  commits: 6
plan_head_before: 64069420b79da65c8e9bb8a2d8c6a6e8ce99debf
plan_head_after: 40e24b999298616209f2d96a8fc7e0a81f3787f5

tech-stack:
  added: []
  patterns:
    - "A walk that did not run answers a sentinel, not null, so only a walk that ran and found nothing can end on the kit"
    - "An allowlist amendment the text guard cannot see carries its own derived and driven cases"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/admission-server.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/admission-server.test.ts
    - hooks/admission-guard.test.ts

key-decisions:
  - "An undeterminable home and a deleted working directory refuse rather than answer the kit, because the walk could not run and the kit's lean dial is not the repository's"
  - "A named root ends the search only when it carries a configuration or is not a directory; otherwise the walk answers, unless the walk lands on the kit's own root"
  - "R-31-15-03 stays open on purpose: a name carrying its own lean configuration still chooses that dial, and plan 41-14 states it in the kit text"

patterns-established:
  - "Each read of the ladder calls entryPresence directly at its site, so callingSites keeps a separate via and each read can be failed alone"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "READ-1: every derived pair of note.js ends non-zero or names the note that stands, except the 9 SECOND_SOURCE rows, which equal an unfaulted run"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/note-read-sites.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "T-41-55: with no fault, each case 41-SECURITY.md line 102 names keeps the dial on a lone host copy"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#READ-1 on note.js: the dial holds with no fault (T-41-55)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two names INVARIANCE 4 gains are bounded by a derived case and a driven case, each proved by seeded mutants"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#INVARIANCE 4 (41-13): the two names reach only the primitives the amendment priced"
        status: pass
      - kind: integration
        ref: "scripts/context-io.test.ts#INVARIANCE 4 (41-13): an entry at a home position reads as the old probe read it, or refuses"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every consumer fails closed on an undetermined root: the hook denies, propose_note answers isError, and context-io.js admit exits 1"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/admission-server.test.ts#an undetermined root answers isError and writes nothing, and the server stays up (plan 41-13)"
        status: pass
      - kind: integration
        ref: "hooks/admission-guard.test.ts#deny: a finding under an undeterminable home with no project variable, because no root can be named (plan 41-13)"
        status: pass
      - kind: integration
        ref: "scripts/context-io.test.ts#an undeterminable home with no project variable exits 1 and names no root (plan 41-13)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The healthy route is unchanged: role-route, note and claim tests pass with no edit"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/role-route.test.ts scripts/runnable-ref/note.test.ts scripts/runnable-ref/claim.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "The ladder on Windows, where one directory can have two spellings"
    verification: []
    human_judgment: true
    rationale: "entryPresence and the kit comparison are unmeasured on Windows (R-31-19-03). This stays UNKNOWN - verify until a Windows run"

duration: 40min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 13: Fail-closed root ladder Summary

**`trustedRepoRoot` now refuses when it cannot finish, and a named root with no configuration no longer overrides the dial of the repository the process is in, so all 12 Group B rows pass with no widening of READ-1.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-11-05T17:17:07Z
- **Completed:** 2026-11-05T17:57:49Z
- **Tasks:** 3
- **Files modified:** 21 (7 by hand, 14 by the generators and the build)

## Accomplishments

- A failed read in the ladder, an undeterminable home and a deleted working directory each refuse with `refusing to name a governance root`. None of them falls back to the kit's lean dial.
- `HOME=/nonexistent`, `HOME=`, each project variable at an empty directory, and `GRUGOPS_HOST_DELIVERED_ROOT` at a bare `.git` directory all keep the dial on a lone host copy with no fault injected.
- The admission server answers `isError` and keeps running. The hook denies, and `context-io.js admit` exits 1.
- `SECOND_SOURCE` keeps its 9 rows and `UNREACHED` keeps its 17, with no skip, `.fails` or `.todo`.

## Task Commits

1. **Task 1: tracer, an undeterminable home refuses the note**
   - `98f6d32c` (test, RED)
   - `14771555` (feat, GREEN)
2. **Task 2: every read of the ladder reports its failure**
   - `6aa796e6` (test, RED)
   - `df6c7ccf` (feat, GREEN)
3. **Task 3: a named root with no configuration keeps the dial**
   - `b8fbab2f` (test, RED)
   - `40e24b99` (feat, GREEN)

The tracer gate ran after Task 1: its `<verify>` passed end to end, and expansion went ahead.

## RED evidence

Each RED run went through `gsd_run check tdd-red-evidence` and returned `RED_EVIDENCE_OK`, `target_test_failed`. Each semantic assessment is below.

- **Task 1:** both cases failed on `expect(status).toBe(1)` with `noted`, exit 0. That is the T-41-55 behaviour.
- **Task 2:** the driven case passed its control, then failed at its first refusal row. A regular file at `.grugops` did not throw, because the kit's lean dial answered.
- **Task 3:** the three named-root cases failed with `noted`, exit 0. The `retained` case failed with an empty ledger. The server case failed because the throw ended the server, and the hook and CLI cases already passed, since Task 1 gave them the throw and each already held it in a try.

## Group B: the 12 rows

**Passed under their own names (7):**

- `directoryIdentity:statSync#0 via namedHomeDirectory#0`
- `directoryIdentity:statSync#0 via homeBoundary#0`
- `directoryIdentity:statSync#0 via homeBoundary#1`
- `directoryIdentity:statSync#0 via homeBoundary#2`
- `directoryIdentity:statSync#0 via isAboveHome#0`
- `directoryIdentity:statSync#0 via isHomeItself#0`
- `hostDeliveredRoot:statSync#0`

**Left, because a boolean probe cannot report a failed read (5), and what replaced each:**

| Row that left | Pairs that replaced it |
| --- | --- |
| `projectRootFromWorkingDirectory:existsSync#0 via trustedRepoRoot#0` | `entryPresence:{lstatSync,statSync,realpathSync}#0 via projectRootFromWorkingDirectory#0` |
| `projectRootFromWorkingDirectory:existsSync#0 via governanceRootOf#0` | the same 3 pairs, because a via now names the direct caller and both routes pass through it |
| `projectRootFromWorkingDirectory:existsSync#1 via trustedRepoRoot#0` | `entryPresence:{lstatSync,statSync,realpathSync}#0 via projectRootFromWorkingDirectory#1` |
| `projectRootFromWorkingDirectory:existsSync#1 via governanceRootOf#0` | the same 3 pairs, for the same reason |
| `hostDeliveredRoot:existsSync#0` | `entryPresence:{lstatSync,statSync,realpathSync}#0 via hostDeliveredRoot#0` |

All 9 pairs pass THE RULE. `namedRootAnswers` adds 6 more, 3 sites under each of its two calls, and they pass too.

## Pins moved

Each moved by the number measured at planning, with a written reason in the file.

| Pin | From | To |
| --- | --- | --- |
| `NOTE_READ_SITES` | 22 | 19 |
| Derived pairs | 64 | 74 (68 after Task 2) |
| node:fs binding count | 17 | 16 |
| `HOME_RULE_PUBLISHED_NAMES` and its `toHaveLength` | 5 | 7 |

The two EMPTY cases now assert the refusal. They had pinned the kit answer that T-41-55 is about.

## Seeded mutants

Each was seeded once, turned exactly one case red, and was restored. `cmp` confirmed `scripts/context-io.ts` and `.js` were byte-identical to the backup, and both cases passed afterwards.

| Mutant | Case that went red | Failure |
| --- | --- | --- |
| `entryPresence` calling `readRegularFileOrNull` | `the two names reach only the primitives the amendment priced` | the reached set grew to 8 bindings |
| `occupied` calling `statSync` | `the two names reach only the primitives the amendment priced` | `occupied` reached `statSync` |
| `occupied` answering `false` for an unreadable entry | `an entry at a home position reads as the old probe read it, or refuses` | the regular file at `.grugops` did not refuse |

## Verification

- `npx vitest run scripts/runnable-ref/note-read-sites.test.ts scripts/runnable-ref/note.test.ts scripts/runnable-ref/role-route.test.ts scripts/runnable-ref/claim.test.ts scripts/admission-server.test.ts hooks/admission-guard.test.ts`: 402 passed, before two more cases were added. The READ-1 file passed again with those two cases.
- `npm run freshness` after the commit: 91 committed `.js` files fresh. `scripts/floor-invariance.test.ts`: 136 passed.
- `node scripts/check-foundation-guards.js`, the validator, and both generator freshness checks passed.
- `git diff --stat 0e780dfc` on `role-route.test.ts`, `note.test.ts` and `claim.test.ts` printed nothing.

**Second verify command** (`context-io.test.ts`, `context-io-writer-set.test.ts`, `compactor.test.ts`): 9 failed, and all 9 are in 41-VALIDATION.md § Known baseline reds.

| Failed test | In baseline |
| --- | --- |
| 31-14 > the disposition document exists and carries the enumeration heading | yes |
| 31-14 > every derived decline clause is enumerated, and the document names no other | yes |
| 31-23 PROBE 5 > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation | yes |
| 31-29 > PREMISE: the document was read and it names residual ids at all | yes |
| 31-29 > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md | yes |
| 31-29 > DIRECTION 2: every WRITTEN id is a member the module still exports | yes |
| 31-29 > a SEEDED undispositioned member turns the equality RED | yes |
| 31-29 > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member | yes |
| 31-29 > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition | yes |

**Full suite** (`npx vitest run --exclude '**/scripts/e2e/**'`, at `40e24b99`, 1,470 s): 21 failed, 11,534 passed, 2 skipped. Compared by name, the 21 failures are exactly the 21 names in § Known baseline reds, with none added and none missing. The 12 Group B names are gone. No EDQUOT appeared in the output.

The plan expected 21 baseline names and said the census and freeze cases belong to plan 41-15. None of those failed here, so nothing was carried for that plan.

## Decisions Made

- `undeterminedRoot` says the dial is `UNKNOWN - verify`, the phrase the kit already uses, rather than a bare `UNKNOWN`.
- `refuseUnlessAbsent` treats ENOTDIR like ENOENT, as the plan states, so a `HOME` below a regular file is an undeterminable home and refuses that way.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Added direct proof for the adjacency truths**
- **Found during:** Task 3
- **Issue:** The must-have truths about a name with no configuration answering where nothing governs, and a configured name answering wherever the process stands, had no case of their own. The `<behavior>` list covered neither root directly.
- **Fix:** Added `ADJACENCY (41-13): a name with no configuration yields to a governing walk, and answers where nothing governs` in scripts/context-io.test.ts, which asserts the root in four positions including the kit's own. Added `a name with no configuration still answers where nothing governs the working directory (R-31-15-02)` to the READ-1 file.
- **Files modified:** scripts/context-io.test.ts, scripts/runnable-ref/note-read-sites.test.ts
- **Verification:** both pass
- **Committed in:** 40e24b99

---

**Total deviations:** 1 auto-fixed (1 missing critical).
**Impact on plan:** Tests only. No code moved beyond the plan's design.

## Issues Encountered

None.

## For plan 41-14

These sentences are now out of date, and this plan left them alone because they are text work:

- The `admit` usage line in scripts/context-io.ts still says the root is the variable, else the walk, else the kit, and says to set a variable to move it. A name with no configuration no longer moves it.
- `TRUSTED_ROOT_TIERS`, Workflow 16, `R-31-19-02` and `R-31-19-06` still describe tier 0 as never reaching the walk.
- The hook's catch in hooks/admission-guard.ts tells the reader to export the approval variable. That text predates this plan and describes the named human's approval route, not this refusal.

## Requirements

RUN-02 and RUN-05 are declared by plans 41-14, 41-15 and 41-16 too, so `requirements.ready-ids` blocks them until the last of those finishes. They are not marked complete in REQUIREMENTS.md by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 41-14. Gap 2 of 41-VERIFICATION.md (CR-02) is not touched here. Windows stays `UNKNOWN - verify`. This plan moved no row of 41-REVIEW-DISPOSITION.md, wrote no human acceptance and filled no `pending (named human)` row.

## Self-Check: PASSED

All six commits are ancestors of HEAD. Every modified file in `key-files` exists, and the acceptance greps of all three tasks gave the expected values.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
