---
phase: 41-orchestrator-flow-guidance
plan: 21
subsystem: shared-context
tags: [note.js, NoteRefusal, exit-contract, audit-ledger, governance-root, workflow-16, disposition]
status: complete

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "note.js host writer (41-07), the root ladder that fails closed (41-13, 41-17), the 41-14 stop for an unnamed root, the 41-20 Workflow 16 text"
provides:
  - "context-io exports class NoteRefusal; the field guards, the invalid-note refusal, the size ceiling and the admission-finding refusal throw it, with messages byte-identical"
  - "note.js exits 1 only on instanceof NoteRefusal; every other writer throw is couldNotRun, exit 2, one Error: line, nothing on stdout"
  - "note.js asks the root-chain owner about .grugops/audit and .grugops/audit/admissions.jsonl before the write; a link there is exit 2 by name"
  - "undeterminedRoot reads 'context-io (the governance root ladder): refusing to name a governance root: ...' and names the paths a human repairs"
  - "Workflow 16 step 3 says how to pass a body that opens with --, what exit 1 without a refused line means, and what exit 2 covers; the stop names the path the refusal names"
affects: [41-22, 41-23, 41-24, workflow-16, note.js, context-io]

actuals:
  tokens: 14060
  tasks: 3
  commits: 6
plan_head_before: a28d7981a80a4615194ae96aee9cfc7fadb408e8
plan_head_after: fcfaff97c331e3620001a0d6634167d34c9efea1

tech-stack:
  added: []
  patterns:
    - "A host program decides 'change the note' from a class the authority throws, never from message text"
    - "A position the embedded writer appends to is asked of the root-chain owner before the write, like the path to notes/"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-21.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/runnable-ref/note.test.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - scripts/context-io.test.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - CHANGELOG.md

key-decisions:
  - "assertNoteRefs throws NoteRefusal too: it is one of assertNoteFields' refusals (the refs list of the note), which the plan names"
  - "The ledger check also refuses a ledger file that is a symbolic link resolving inside the repository, because the plan says no link there is ever correct and rootChainPresence answers 'present' for such a link with an 'entry' leaf"
  - "occupied() takes the inspected path as a second argument and keeps every entryPresence call where it was, so no READ-1 calling pair moved"
  - "'ledger-present' moved from PROOF_MODES to MODES in note-read-sites.test.ts, so the new stat and realpath pairs on the ledger file are reached and judged by THE RULE rather than listed in UNREACHED"
  - "The WR-09 Workflow 16 sentence is split in three and reworded ('an unnamed governance root, an admission the ledger failed to record, and a failed publish') to meet WP-02 (20 words) and WP-05 (no modal 'could' in a step)"

patterns-established:
  - "Pattern: exit 1 of a host writer rests on an exported refusal class; every other throw is could-not-run"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "note.js exits 1 with a refused line only for a NoteRefusal (validation, admit() finding, size ceiling); an unrecordable admission is exit 2 with one Error: line"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the writer's refusals (WF16 step 4, D-28, D-35) > an admission that cannot be recorded is exit 2, never refused (WR-09)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the writer's refusals (WF16 step 4, D-28, D-35) > a note admit() refuses is still exit 1 with a refused line (WR-09 control)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the writer's refusals (WF16 step 4, D-28, D-35) > an invalid field is still exit 1 (WR-09 control)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A link at .grugops/audit or at .grugops/audit/admissions.jsonl is exit 2 naming the path, no note, and the link target gains no ledger line; an absent audit directory is still created"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the root and the path to notes/ (T-41-33) > a link at .grugops/audit is refused: exit 2, no note, and the target gains no ledger line (WR-10)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the root and the path to notes/ (T-41-33) > a link at .grugops/audit/admissions.jsonl is refused the same way (WR-10)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the root and the path to notes/ (T-41-33) > CONTROL: an absent .grugops/audit under retained is still created and gains the ledger line (WR-10)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The root refusal names the governance root ladder, the working directory and the home directory, and tells a human what to repair"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-23 — CR-13 > the root refusal names the ladder and the working directory it stood in (IN-15)"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 still holds on note.js: every faulted read ends exit 1 or 2 and never noted; SECOND_SOURCE 9, UNREACHED 17, NOTE_READ_SITES 19"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts (123 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Workflow 16 step 3 and the stop for an unnamed root say what each exit means and what a human repairs; six disposition rows"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#Workflow 16 step 3 reads every exit of note.js (plan 41-21; WR-09, IN-10, IN-13, IN-15, D-42)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The 6 rows of docs/audit/29-style-dispositions/41-21.md are pending (named human): the gate proves a row exists and cannot judge whether each clause says what note.js does"

duration: 17min
completed: 2026-11-12
---

# Phase 41 Plan 21: note.js exit 1 means only "change the note"

**`note.js` now exits 1 only on the authority's `NoteRefusal` class (validation, an `admit()` finding, the size ceiling); an unnamed governance root, an unrecordable admission, a failed publish and an occupied destination are exit 2 with one `Error:` line. A symbolic link at `.grugops/audit` or its ledger file is refused before the write. The root refusal names the governance root ladder and the paths a human repairs. Workflow 16 step 3 reads every exit and body.**

## Performance

- **Duration:** about 17 min
- **Started:** 2026-11-12T08:33:20Z
- **Completed:** 2026-11-12T08:50:32Z
- **Tasks:** 3
- **Files modified:** 23 (22 modified, 1 created)

## Accomplishments

- WR-09: `export class NoteRefusal extends Error` in `scripts/context-io.ts`, thrown at `assertNoteScalar` (2 sites), `assertNoteRefs`, `assertHexScalar`, the candidate-above-the-ceiling refusal, the invalid-note refusal in `composeValidatedNote` and the `did not accept` refusal in `appendNote`. Every message is byte-identical. The differing-occupant, unrecordable-admission, publish, containment and `undeterminedRoot` throws stay `Error`. `admit()` is untouched, so `ADMIT_FROZEN_SHA256` did not move.
- `note.js` `runAdd` replaces `isWriterRefusal` (message-prefix test) with `e instanceof NoteRefusal`; any other throw calls `couldNotRun`. THE D-12 CONTRACT in the header now says exit 1 is the writer's judgement of the note, and exit 2 also covers an unnamed root, an unrecordable admission, a failed publish and an occupied destination. `NoteRefusal` is a declared root of the `note.ts` row in `scripts/generate-runnable-embeds.ts`.
- WR-10: `refuseUnusableLedger` asks `refuseUnusableStore(root, ".grugops/audit")`, then `rootChainPresence(root, ".grugops/audit/admissions.jsonl", "entry")`, and exits 2 naming the path on `link`, `unreadable`, `outside`, or a present entry that is a symbolic link. Absent stays allowed. The header's THE ROOT IS A BOUNDARY paragraph says the ledger is asked of the same owner.
- IN-15: `undeterminedRoot` now reads `context-io (the governance root ladder): refusing to name a governance root: REASON. The root this action needs is UNKNOWN - verify, so nothing was admitted and nothing was written. An unknown dial is never read as the lean default. Nothing about the note is wrong: stop, and have a human repair HOME, the working directory or the path this line names.` The above-HOME reason names the working directory and the home directory; the unknown-home reason names the value of `HOME`; `occupied` and `namedRootAnswers` name the inspected path when the reason does not.
- IN-10, IN-13, WR-09, IN-15 text: Workflow 16 step 3 and the stop for an unnamed root (below). CHANGELOG: two `### Changed` bullets and one `### Security` bullet. docs/audit/29-style-dispositions/41-21.md: six `pending (named human)` rows, none `accepted`.

## Task Commits

1. **Task 1 (tracer): NoteRefusal and the exit mapping** - RED `0340bd65` (test), GREEN `dd9e0306` (feat)
2. **Task 2: ledger link refusal, ladder-named root refusal, moved expectations** - RED `dcfd4f3f` (test), GREEN `82d46315` (feat)
3. **Task 3: Workflow 16 step 3, the stop, CHANGELOG, dispositions** - RED `9c428095` (test), GREEN `fcfaff97` (feat)

No refactor commits.

## TDD Evidence

- **Task 1 RED:** `npx vitest run scripts/runnable-ref/note.test.ts -t "WR-09" --reporter=junit`, exit 1. Target `the writer's refusals (WF16 step 4, D-28, D-35) > an admission that cannot be recorded is exit 2, never refused (WR-09)` failed on `expected 1 to be 2` with stdout `refused t1: context-io.appendNote: refusing to write — the admission could not be decided or could not be recorded ...`. Classifier: `RED_EVIDENCE_OK` (junit, target_test_failed; 1 failing, 2 passing). Semantic assessment: the target ran and failed on its planned assertion for the planned reason; the two controls passed, as they should.
- **Task 1 GREEN:** `npm run build && npm run typecheck && npx vitest run scripts/runnable-ref/note.test.ts scripts/generate-runnable-embeds.test.ts`: 109 passed. Freshness of runnable embeds and the hook manifest: fresh. Tracer gate (interactive, `end-of-phase`, automated-only verify): verify re-run green, then expanded.
- **Task 2 RED:** WR-10 cases run against the committed `note.js`: both link cases failed on `expected +0 to be 2` (the note was written, `noted t1 ...`); the control passed. Classifier `RED_EVIDENCE_OK`. The IN-15 case failed on the missing `context-io (the governance root ladder)` phrase; classifier `RED_EVIDENCE_OK` once the target was given its full describe-qualified name (the first record named it without its describe chain and got `INVALID_RED / no_target_test_failure`, which was a naming fault in the record, not a different failure).
- **Task 3 RED:** the four new pins in `scripts/flow-guidance-text.test.ts` failed on `toContain` before the text changed.
- RED evidence records were moved to the session scratchpad after classification; nothing was left in the tree.

## Moved Expectations (Task 2, by the D-42 rule)

Every move below is exit 1 with a `refused` line on stdout → exit 2 with one `Error:` line on stderr and stdout empty.

| Test (scripts/runnable-ref/note-read-sites.test.ts) | Refusal that moved it |
|---|---|
| `a failed stat of a FIFO at the ledger is answered by the open: no wait, exit 2, ...` (was `exit 1` in its name and assertion) | unrecordable admission (FIFO at the ledger) |
| `the ledger line is in what a faulted run is compared to`: `PREMISE: a directory at the ledger is refused` 1 → 2 | unrecordable admission (directory at the ledger) |
| `withoutReason` now strips the `Underlying reason:` clause from stderr, not stdout (used by the `ledger-directory` SECOND_SOURCE comparisons and the FIFO case) | unrecordable admission |
| `a failed walk of the notes behind a gate-stamped finding refuses it: exit 2, ...` (now also asserts `could not be decided or could not be recorded`) | the unrecordable-admission refusal: `admit()` threw on the EIO, and `appendNote` wraps that throw in the one refusal for an admission that could not be decided or recorded |
| `assertRootRefused` (docstring now says exit 2 and one `Error:` line), and through it: `a retained repository under an undeterminable home ...`, `HOME naming nothing ...`, `HOME as the empty string ...`, `HOME at src/.grugops/.git below the repository ...` (3), `under that HOME a retained repository ...`, `under that HOME an unparseable config ...`, `under that HOME, NAME at a directory with no configuration ...` (3), `THE STATED COST (D-38) ...` | the root refusal |
| `assertRefusedAboveHome` reads the reason from stderr | the root refusal |
| `an unparseable config under an undeterminable home still refuses the note (GOV-02, D-14)`: now `assertRootRefused` | the root refusal: the ladder refuses before the config is read, so this pair got the ladder's refusal, not D-14 |

Kept at exit 1, as the rule requires: the four governed-mode controls (`admit()` D-04 finding), `a failed read of the config refuses the note: exit 1` (every config-read pair got `admit()`'s D-14 finding, `UNKNOWN - verify`), `a name that is not an existing directory stays refused in a lean repository` (D-14), the S11 supersede case, and every `expectRefused` case in `scripts/runnable-ref/note.test.ts`. No expectation outside the rule went red in `note.test.ts`, `role-route.test.ts`, `context-io.test.ts`, `context-io-writer-set.test.ts` or `admission-server.test.ts`; the substring `refusing to name a governance root` that those files match is kept.

READ-1 counts: `NOTE_READ_SITES = 19`, `SECOND_SOURCE_SIZE = 9`, `UNREACHED_SIZE = 17` all hold. The new calling site `refuseUnusableLedger` adds three pairs (lstat, stat, realpath of `rootChainPresence`). The lstat pair is reached in every mode; the stat and realpath pairs read only a ledger that exists, so no mode in `MODES` reached them. `ledger-present` moved from `PROOF_MODES` into `MODES` with a dated comment citing this plan, WR-10 and the ruling, so those pairs are judged by THE RULE (exit 2) rather than listed in `UNREACHED`.

## Verification

- Task 2 first verify (`note.test.ts`, `note-read-sites.test.ts`, `role-route.test.ts`, `admission-server.test.ts`, `hooks/admission-guard.test.ts`, `compactor.test.ts`): 559 passed after the moves (436 + 123 across two runs).
- Task 2 second verify (`context-io.test.ts`, `context-io-writer-set.test.ts`): 945 passed, 9 failed, 1 skipped. Every failure is a row of 41-VALIDATION.md § Known baseline reds:

| Failed test | In § Known baseline reds |
|---|---|
| context-io-writer-set.test.ts > 31-14 > the disposition document exists and carries the enumeration heading | yes |
| context-io-writer-set.test.ts > 31-14 > every derived decline clause is enumerated, and the document names no other | yes |
| context-io.test.ts > 31-23 PROBE 5 > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, ... | yes |
| context-io.test.ts > 31-29 > PREMISE: the document was read and it names residual ids at all | yes |
| context-io.test.ts > 31-29 > DIRECTION 1 | yes |
| context-io.test.ts > 31-29 > DIRECTION 2 | yes |
| context-io.test.ts > 31-29 > a SEEDED undispositioned member turns the equality RED | yes |
| context-io.test.ts > 31-29 > CONVERSE 1 | yes |
| context-io.test.ts > 31-29 > CONVERSE 2 | yes |

- Neighbouring files (`runnable-exit-contract`, `check-foundation-guards.test`, `generate-runnable-embeds.test`, `state-check.test`, `read-sites.test`, `claim-read-sites.test`): 1,279 passed, 1 failed, the baseline red `check-foundation-guards.test.ts > LANG-07 ... LIVE COUNT is DERIVED`.
- Task 3: `flow-guidance-text`, `tier-kit-text`, `role-route`: 333 passed. `check-imperative-lexicon`, `check-kit-refs`, `check-diff-disposition`, `check-banned-claims`, `check:public-docs`, `VALIDATE_KIT_ROOT=. validate-agent-factory`: each exit 0.
- After the last commit: `floor-invariance.test.ts`, `note.test.ts`, `note-read-sites.test.ts` 333 passed; `npm run typecheck`, `check:residual-citations`, `check:audit-register`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `check-foundation-guards` each exit 0.
- Acceptance greps: `class NoteRefusal` in context-io.ts 1 and in note.js 1; `instanceof NoteRefusal` in note.ts 1; `startsWith("context-io")` in note.ts's hand-written part 0; `context-io.trustedRepoRoot: refusing` in context-io.ts 0; `the governance root ladder): refusing to name a governance root` in note.js 1; `audit/admissions.jsonl` in note.ts's hand-written part 1; `SECOND_SOURCE_SIZE = 9` 1; `UNREACHED_SIZE = 17` 1; the four Workflow 16 greps 1 each; `pending (named human)` in 41-21.md 7 (6 rows and the prose), `| accepted` 0.
- The full suite was not run here; it runs once in plan 41-24. Windows behavior of the link refusal stays `UNKNOWN - verify`.

## Files Created/Modified

- `scripts/context-io.ts` / `.js` - `NoteRefusal`, its throw sites, `undeterminedRoot`'s wording, `reasonNaming`, `homeForMessage`, the path in `occupied` and `namedRootAnswers`
- `scripts/generate-runnable-embeds.ts` / `.js` - `NoteRefusal` root on the `note.ts` row
- `scripts/runnable-ref/note.ts` / `.js` - exit mapping, `refuseUnusableLedger`, header contract; regenerated region
- `scripts/runnable-ref/{claim,state-check,state-roll,trace-render}.{ts,js}`, `hooks/hook-entry.{ts,js}` - regenerated (set stamps, embedded `undeterminedRoot`, manifest hashes)
- `scripts/runnable-ref/note.test.ts` - the WR-09 and WR-10 cases
- `scripts/runnable-ref/note-read-sites.test.ts` - the moved expectations and `ledger-present` in `MODES`
- `scripts/context-io.test.ts` - the IN-15 case
- `scripts/flow-guidance-text.test.ts` - the 41-21 describe; the 41-14 stop pin moved
- `agent-factory/workflows/16-context-read-write.md` - step 3 and the stop
- `CHANGELOG.md` - two Changed bullets, one Security bullet
- `docs/audit/29-style-dispositions/41-21.md` (new) - six `pending (named human)` rows

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A ledger file that is a link resolving inside the repository was not refused**
- **Found during:** Task 2
- **Issue:** with the `entry` leaf, `rootChainPresence` stats through a link at the last component and answers `present` when the target is inside the root, so the plan's `link`, `unreadable` or `outside` test would admit it, against the plan's own "no link there is ever correct".
- **Fix:** `refuseUnusableLedger` also refuses a `present` answer whose `entry` (the lstat) is a symbolic link.
- **Files modified:** scripts/runnable-ref/note.ts (and note.js)
- **Commit:** `82d46315`

**2. [Rule 3 - Blocking] The new ledger pairs were reached by no mode in `MODES`**
- **Found during:** Task 2 (note-read-sites `no mode reached rootChainPresence:statSync#0 via refuseUnusableLedger#0`, and the same for realpathSync)
- **Issue:** the plan expected every add mode to reach the new pairs, but the stat and realpath of the ledger file run only when it exists; only `ledger-present` and `ledger-directory`, both in `PROOF_MODES`, have one. The plan forbids an `UNREACHED` row for a new pair.
- **Fix:** `ledger-present` moved from `PROOF_MODES` to the end of `MODES` with a dated comment, so every pair is also judged by THE RULE in that mode. No row was added to `SECOND_SOURCE` or `UNREACHED`, and the `appendRegularFileLine:statSync#0` row's mode list is unchanged.
- **Commit:** `82d46315`

**3. [Rule 1 - Bug] The plan's WR-09 sentence failed WP-02 and WP-05**
- **Found during:** Task 3 (`check-imperative-lexicon`)
- **Issue:** `It also covers a governance root that could not be named and an admission that could not be recorded or published.` was 21 words against WP-02's 20 and used the modal `could` in a step (WP-05).
- **Fix:** the plan's one sentence became three: `Exit 2 prints one \`Error:\` line. It also covers an unnamed governance root, an admission the ledger failed to record, and a failed publish. Nothing about the note is wrong then.` Pins and the disposition row use this text, and the row flags that "failed to record" is narrower than the refusal's "decided or recorded".
- **Commit:** `fcfaff97`

**4. [Rule 3 - Blocking] `occupied` kept its call sites**
- **Found during:** Task 2
- **Issue:** to name the path, `occupied` needs it; moving the `entryPresence` call inside `occupied` would have moved the READ-1 calling pairs of the root ladder.
- **Fix:** `occupied(presence, path)`: each caller passes the path it already built; every `entryPresence` call stays where it was.
- **Commit:** `82d46315`

---

**Total deviations:** 4 auto-fixed (1 Rule 1, 1 Rule 2, 2 Rule 3). **Impact:** one extra refusal (a link that stays inside the repository), one test mode moved between two lists, and wording; no guard was weakened and no READ-1 count moved.

## Issues Encountered

- `npm run build` fails while `note.ts` names `NoteRefusal` before its generated region carries it (`noEmitOnError`). Running the committed generator directly, then `npm run build`, then the npm generator scripts produced fresh output, as earlier plans found.
- A refusal from the root ladder raised inside `appendNote` prints after it the existing `noteStands` line, `The note may have been written; check .grugops/context/t1/notes/ before adding it again.`, as the plan specified, though the refusal itself says nothing was written. The line errs on the safe side; a later plan may choose to clear `noteStands` for a refusal that names nothing written.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Human check for this plan: read the six `pending (named human)` rows of docs/audit/29-style-dispositions/41-21.md against the diff, and accept or flag each. Row 4 asks whether the exit 2 sentence should also say an admission that could not be decided.
- Ready for 41-22.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-21.md
- FOUND: 0340bd65, dd9e0306, dcfd4f3f, 82d46315, 9c428095, fcfaff97 (all in `git log a28d7981..HEAD`)
- Acceptance greps re-run after the last commit: all hold.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*
