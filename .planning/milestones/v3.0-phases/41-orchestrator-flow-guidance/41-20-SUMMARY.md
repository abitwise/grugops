---
phase: 41-orchestrator-flow-guidance
plan: 20
subsystem: shared-context
tags: [emitVerdict, admit, byte-freeze, census, render, workflow-16, disposition]
status: complete

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "the S10/S11 supersession refusals (41-15, 41-18), the ninth admit() re-base (41-18), the 41-16 Workflow 16 pins"
provides:
  - "emitVerdict refuses a second live green verdict for one per-run id, before composing, by throwing; the CLI exits 1 with the message"
  - "The S4 duplicate-verdict refusal ends: Run the gate again: the new run mints a new id, and evidence names that run."
  - "Tenth re-base of ADMIT_FROZEN_SHA256 (0d7d6bb0...), citing 41-UAT.md test 7, Olger, 2026-11-11; census stays at 11 with only S4's signature moved"
  - "seedVerdictByHand in context-io.test.ts and context-io-writer-set.test.ts writes a sealed duplicate so S4 is still driven"
  - "index.md banner: <!-- GENERATED — do not hand-edit. Rendered by the note writer from the notes/ folder. -->"
  - "Workflow 16 step 3, context-note.md and CHANGELOG name the route that retires a verdict or a gated finding, and say none exists under off or on a host with no hook"
affects: [41-21, 41-22, 41-23, 41-24, workflow-16, context-io, note.js]

actuals:
  tokens: 14639
  tasks: 2
  commits: 4
plan_head_before: d21d3974ff45124df698e3708c9933e7b6db718e
plan_head_after: 12e4a2e1a6821a85ed04e13be9d802783f748a3e

tech-stack:
  added: []
  patterns:
    - "A reserved-identity emitter may read the store with the recognizer admit() uses, so it refuses exactly what admit() would count twice, without reaching admit()"
    - "A duplicate the emitter can no longer produce is seeded by hand, sealed through mod.noteSeal, so the refusal it feeds is still driven"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-20.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/flow-guidance-text.test.ts
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
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/contracts/context-note.md
    - CHANGELOG.md

key-decisions:
  - "emitVerdict's refusal says 'all evidence that names the run' instead of the plan's 'every artifact-ref': the census proof for emitVerdict (neverReachesAuthority) asserts its body never names the artifact-ref kind"
  - "The two long Workflow 16 sentences are split in two to meet the WP-02 20-word procedural bound; the S4 message in admit() keeps the plan's wording"
  - "context-note.md keeps 'only a named human's disposition retires one.' on its own line so the 41-16 pin over that line holds; the new sentences follow on the next lines"
  - "The fixture index.md was changed by hand (freshness:context does not name it), and a fresh render of the fixture into a scratch copy was confirmed byte-equal"

patterns-established:
  - "Pattern: an emitter refusal that the CLI must report throws a named error rather than returning null, when the null message would be false"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "A second emitVerdict, in-process or through the CLI, for a run id that already has a live green verdict writes nothing and names the refusal; a different run id still emits"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#41-20 WR-14 — one gate run stamps one verdict > a second emitVerdict for one run id writes nothing and names the verdict that stands (WR-14)"
        status: pass
      - kind: integration
        ref: "scripts/context-io.test.ts#41-20 WR-14 — one gate run stamps one verdict > a second emit-verdict through the CLI exits non-zero and leaves one verdict (WR-14)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#41-20 WR-14 — one gate run stamps one verdict > CONTROL: a different run id under the same task still emits (WR-14)"
        status: pass
    human_judgment: false
  - id: D2
    description: "S4 still refuses an artifact-ref when a store holds two verdicts for one run id, and names the route; admit() moved once (tenth re-base) and only S4's census signature changed"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#41-20 WR-14 — one gate run stamps one verdict > the D-03 arm still refuses an artifact-ref when the store holds two verdicts for one run id, and names the route (WR-14)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#byte-freeze (3 cases)"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts (S4 probe, census of 11)"
        status: pass
    human_judgment: true
    rationale: "The S4 message is a route a named human is asked to stand behind (the plan's human-check); the tests prove the text and the refusal, not that the route is the right one"
  - id: D3
    description: "index.md opens with a banner that names no program"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#a task with NO provenanced note renders byte-identically to its pre-change form"
        status: pass
      - kind: other
        ref: "npm run freshness:context; scripts/board-dashboard.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Workflow 16 step 3, context-note.md and CHANGELOG name the route that retires a verdict or a gated finding and where none exists; six disposition rows"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#the kit says which route retires a verdict or a gated finding (plan 41-20; WR-14, IN-09, D-42)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The 6 rows of docs/audit/29-style-dispositions/41-20.md are pending (named human): the gate proves a row exists and cannot judge whether each clause says what the code does"

duration: 17min
completed: 2026-11-12
---

# Phase 41 Plan 20: one gate run stamps one verdict, and the kit names the route that retires one

**`emitVerdict` now refuses a second live green verdict for one per-run id (throws, nothing written, CLI exit 1); the S4 duplicate refusal in `admit()` says to run the gate again (tenth re-base, census still 11); `index.md`'s banner names no program; Workflow 16, the note contract and the changelog say a gated finding admitted through `propose_note` under the human's grant retires a verdict, and nothing does under `off` or on a host with no hook.**

## Performance

- **Duration:** about 17 min
- **Started:** 2026-11-12T08:13:35Z
- **Completed:** 2026-11-12T08:30:51Z
- **Tasks:** 2
- **Files modified:** 22 (21 modified, 1 created)

## Accomplishments

- WR-14 at the source: after the integrity check and before composing, `emitVerdict` reads `currentState(readContext(task, contextRoot))` and finds a note for which `isLiveGreenVerdict(n, id)` holds. When one exists it throws `context-io.emitVerdict: refusing to emit — run "ID" already has a live green verdict under task "TASK" (VERDICT). ... Nothing was written.` The CLI's outer `catch` prints it and exits 1, so the integrity message is not printed.
- WR-14 for a store that already holds two: the S4 message now ends `the evidence is refused and nothing is written. Run the gate again: the new run mints a new id, and evidence names that run.` The `admit()` span diff is that one message (two source lines). `ADMIT_FROZEN_SHA256` moved `dfb5f2fb...09ac` to `0d7d6bb0843e70f2be84b3efba3886a8e38d8ed659e9df21ef0b64e3f504ccca`, with a `PLAN 41-20 DELIBERATE UNFREEZE + RE-BASELINE (WR-14) — the TENTH re-base.` paragraph citing "41-UAT.md test 7, Olger, 2026-11-11" and D-42.
- Census: S4's signature replaced, its row comment cites plan 41-20, WR-14, D-42 and the ruling; `EXPECTED_ADMIT_REFUSAL_SITE_COUNT` stays 11 and the other ten signatures are byte-identical.
- IN-09: the banner is `<!-- GENERATED — do not hand-edit. Rendered by the note writer from the notes/ folder. -->` in `context-io.ts` and the regenerated `note.js`; the render pin asserts it and that line one names no `node` or `scripts/`.
- Workflow 16 step 3 gains six sentences after `Only a named human's disposition retires one.`; the note contract gains two; CHANGELOG Security bullet extended and two Fixed bullets added. docs/audit/29-style-dispositions/41-20.md has six rows, all `pending (named human)`, none `accepted`.

## Task Commits

1. **Task 1 (tracer): one verdict per gate run, S4 route, tenth re-base** - RED `ec011342` (test), GREEN `d7fe6d5b` (feat)
2. **Task 2: banner and the text on the route that retires a verdict** - RED `4fa1e4a3` (test), GREEN `12e4a2e1` (feat)

No refactor commits.

## TDD Evidence

- **Task 1 RED:** `npx vitest run scripts/context-io.test.ts -t "WR-14" --reporter=junit --outputFile=.tmp-red/red1.xml`, exit 1. Target `41-20 WR-14 — one gate run stamps one verdict > a second emitVerdict for one run id writes nothing and names the verdict that stands (WR-14)` failed on `expected [Function] to throw an error`. Classifier: `RED_EVIDENCE_OK` (junit, target_test_failed; 3 failing, 5 passing in the filtered run). Semantic assessment: the target ran and failed on its planned assertion, because the second call wrote a second verdict. The CLI case failed on its exit status (0, expected non-zero) and the D-03 case on `Run the gate again`, as planned. The control passed, as it should. The evidence record was moved out of the tree to the scratchpad after classification.
- **Task 1 GREEN:** the eight verify files: 1,523 passed, 10 failed, 1 skipped. Nine failures are rows of 41-VALIDATION.md § Known baseline reds; the tenth, `hooks/hook-entry.ts has no uncommitted modification, measured against HEAD`, checks the working tree and passed after the commit (136/136 in floor-invariance.test.ts).
- **Task 2 RED:** `npx vitest run scripts/flow-guidance-text.test.ts -t "plan 41-20"`: 7 of 8 new pins failed on `toContain` (the eighth holds an existing sentence); `scripts/context-io.test.ts -t "pre-change form"` failed on the new banner.
- **Task 2 GREEN:** see Verification below.
- Tracer gate (interactive, `end-of-phase`, automated-only verify): re-ran Task 1 verify end-to-end, green, then expanded.

## Test Cases Changed for the New Refusal (Task 1)

- `scripts/context-io.test.ts` "TWO live green verdicts sharing one per-run id at different SHAs REFUSE, both ways": the second verdict is written by `seedVerdictByHand` (it is about a duplicate).
- `scripts/context-io-writer-set.test.ts` S4 probe seed: the second `RUN-DUPLICATE` verdict is written by `seedVerdictByHand` (it is about a duplicate).
- No other case in the six files (or in `note-read-sites.test.ts`, `admission-protocol-docs.test.ts`, `runnable-ref/note.test.ts`) failed with `already has a live green verdict`; none needed its own run id.

## Verification

Task 1 second verify command (8 files), after Task 2: 1,674 passed, 10 failed, 1 skipped, against these names:

| Failed test | In § Known baseline reds |
|---|---|
| context-io.test.ts > 31-23 PROBE 5 > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, ... | yes |
| context-io.test.ts > 31-29 > a SEEDED undispositioned member turns the equality RED | yes |
| context-io.test.ts > 31-29 > CONVERSE 1 | yes |
| context-io.test.ts > 31-29 > CONVERSE 2 | yes |
| context-io.test.ts > 31-29 > DIRECTION 1 | yes |
| context-io.test.ts > 31-29 > DIRECTION 2 | yes |
| context-io.test.ts > 31-29 > PREMISE | yes |
| context-io-writer-set.test.ts > 31-14 > every derived decline clause is enumerated, ... | yes |
| context-io-writer-set.test.ts > 31-14 > the disposition document exists and carries the enumeration heading | yes |
| floor-invariance.test.ts > hooks/hook-entry.ts has no uncommitted modification, measured against HEAD | no: a working-tree check; green after commit |

Task 2 first verify command: `render` cases 11 passed; the five text and board files 471 passed with `board-dashboard.test.ts` red only on its dirty-fixture check before commit; after commit `board-dashboard.test.ts` and `floor-invariance.test.ts` pass 217/217.
Task 2 second verify command, each exit 0: `check-imperative-lexicon`, `check-kit-refs`, `check-diff-disposition`, `check-banned-claims`, `check:public-docs`, `freshness:context`, `freshness:runnable-embeds`, `freshness:hook-manifest`. Also exit 0: `npm run typecheck`, `check-foundation-guards`, `check:residual-citations`, `check:audit-register`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`.

## Files Created/Modified

- `scripts/context-io.ts` / `.js` - the refusal in `emitVerdict`, the S4 message, the banner
- `scripts/runnable-ref/{note,claim,state-check,state-roll,trace-render}.{ts,js}`, `hooks/hook-entry.{ts,js}` - regenerated (embedded `admit()` and banner in note; build stamps; manifest hashes)
- `scripts/context-io.test.ts` - the four WR-14 cases, `seedVerdictByHand`, the both-ways case, the tenth re-base, the banner pin
- `scripts/context-io-writer-set.test.ts` - S4 signature and comment, `seedVerdictByHand`, the S4 probe seed
- `scripts/flow-guidance-text.test.ts` - the 41-20 `describe`; the 41-16 pin that held the sentence after `Only a named human's disposition retires one.` moved
- `scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.md` - the banner line
- `agent-factory/workflows/16-context-read-write.md`, `agent-factory/contracts/context-note.md`, `CHANGELOG.md` - the text
- `docs/audit/29-style-dispositions/41-20.md` (new) - six `pending (named human)` rows

## Decisions Made

See `key-decisions` above. In short: the emitter's message avoids the literal `artifact-ref` so the census proof that `emitVerdict` never touches that kind still holds; the Workflow 16 sentences are split to meet WP-02; the contract keeps its pinned line.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's emitVerdict message broke the census proof for emitVerdict**
- **Found during:** Task 1 (GREEN)
- **Issue:** `neverReachesAuthority` in context-io-writer-set.test.ts asserts `functionSource(emitVerdict)` does not contain `artifact-ref`. The plan's message (`every artifact-ref that names the run`) and my comment did, and all 11 `emitVerdict × Sn: dispositioned with a reason` cells went red.
- **Fix:** the message says `a second verdict would leave all evidence that names the run with no single commit to bind to`, and the comment says `refused all evidence that named the run`. The proof is unchanged. `already has a live green verdict` stays on one source line.
- **Files modified:** scripts/context-io.ts (and regenerated .js files)
- **Commit:** `d7fe6d5b`

**2. [Rule 1 - Bug] Two of the plan's Workflow 16 sentences failed the WP-02 sentence-length gate**
- **Found during:** Task 2 (`check-imperative-lexicon`)
- **Issue:** the sentence on the disposition had 21 words and the sentence on the route out had 25, against WP-02's 20-word bound for a procedural sentence.
- **Fix:** `That disposition is a \`finding\` the dial gates. The Orchestrator admits it through \`propose_note\` under the human's grant on Claude Code.` and `A store that already holds two for one run refuses every \`artifact-ref\` that names the run. Run the gate again and name the new run.` Pins and rows use the split text.
- **Commit:** `12e4a2e1`

**3. [Rule 3 - Blocking] The new contract sentence broke a 41-16 line pin**
- **Found during:** Task 2
- **Issue:** `states the same exception where the note contract says how a note is corrected` holds the two lines after the audit-trail line exactly.
- **Fix:** the new sentences start on the line after `only a named human's disposition retires one.`, so that line is unchanged and the pin holds without moving.
- **Commit:** `12e4a2e1`

---

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3). **Impact:** wording only; every acceptance grep holds, and no guard was weakened.

## Issues Encountered

- `npm run freshness:context` passes vacuously (no `.grugops/context/` tree at the root), so it does not name the fixture. The fixture's first line was changed by hand, and a render of a scratch copy matched it byte for byte.
- `node scripts/validate-agent-factory.js` refuses to run without `VALIDATE_KIT_ROOT`; with `VALIDATE_KIT_ROOT=.` it passes.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Human check for this plan: read the six `pending (named human)` rows of docs/audit/29-style-dispositions/41-20.md and the S4 message in `admit()` against the diff, and accept or flag each.
- Ready for 41-21.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-20.md
- FOUND: ec011342, d7fe6d5b, 4fa1e4a3, 12e4a2e1 (all ancestors of HEAD)
- Acceptance greps re-run after the last commit: all hold.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*
