---
phase: 32-board-projector-cli-dashboard
plan: 34
subsystem: infra
tags: [board-projector, fs-watch, containment, symlink-escape, no-fabrication, typescript, vitest]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-10's containment authority (`insideRoot`, `childPath`, `OUTSIDE_ROOT`) — the one place this repository decides whether a path is inside the tree, which this plan asks a second question of"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-19's IN-01 fix (arm against the root the READ resolved, and open no watch on a refused source) — the round whose granularity this plan narrows"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-17's queue-reader totality (`unsafe-task-name` reported by name, walk asserted total against a derived denominator) — the twin the context reader now matches"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-31 and 32-32's DASH-06 read-only guard, re-proved green against the changed dashboard closure on this commit"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-33's `SCHEMA_VERSION` 2 and `TicketRecord.stem`; this plan asserts neither literal and touches no published shape"
provides:
  - "`LoopDeps.contained` — the containment authority asked about the exact directory a `fs.watch` handle would be opened on, replacing a `Set<SourceName>` built from the reader's refusals"
  - "`insideRoot` exported from scripts/board-read.ts, so the one place this MODULE decided containment is now the one place the REPOSITORY decides it"
  - "An escaping ENTRY leaves its directory armed: one symlinked ticket file no longer un-arms `plans/tickets`, and one symlinked claimed task no longer un-arms all three queue stages"
  - "The ancestor rule as a consequence rather than a second walk: `realpathSync` resolves the whole chain, so a directory reached through a refused parent is refused in the same call"
  - "The containment early return deletes the directory's watch record, so no frame and no published document promises a re-arm the return makes impossible"
  - "Order-independence by construction: nothing about a refusal is accumulated between reads, so two refusals in one read cannot interact"
  - "`unsafe-task-name` and `not-a-directory` read errors from the context reader, with the walk asserted total against a denominator derived from its own listing"
affects: [32-35, 32-36, 32-37, board-projector-consumers, future-web-renderer]

actuals:
  tokens: 27815
  tasks: 3
  commits: 3
plan_head_before: f8c84e0651491707b30b9398bcb649c0892b5b91

tech-stack:
  added: []
  patterns:
    - "Ask the authority about the thing you are about to do, not about a label that stands in for it: the loop asks containment about the exact path `deps.watch` will be handed"
    - "A derived rule beats a second walk: the ancestor rule is a consequence of `realpathSync` resolving the whole chain, so there is no upward walk to bound and none to get wrong"
    - "Order-independence achieved by REMOVING state rather than by asserting a property over it — two refusals cannot interact through a set that no longer exists"
    - "A PREMISE that asserts what the mechanism does NOT see: the ancestor case asserts the authority never spelled `plans`, so the case cannot pass under a mechanism that never reaches the rule"
    - "Every branch that decides not to watch a directory, for a reason that is not a watch failure, clears its record — stated as a table over all six branches rather than as a rule at one of them"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-34-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-watch.test.ts
    - scripts/board-read.test.ts
    - scripts/board-dashboard.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "DEPARTURE FROM THE PLAN'S PRESCRIBED MECHANISM, proved necessary rather than preferred: the plan specified a `refusedDirs` set built from the SPELLED path of each containment read error plus an `isRefusedDir` ancestor walk. Probe E measured that no set derived from those paths can satisfy the plan's own behaviour bullet 'given `plans` linked outside the root, neither `plans` nor `plans/tickets` is armed' — the refusals that read produces spell `plans/board.md`, `plans/tickets` and `plans/traceability.md`, none of which is `plans` or an ancestor of it. Probe A and probe E are the same refusal SHAPE with opposite required answers, so the loop asks the authority about the DIRECTORY instead"
  - "The containment question goes through the `LoopDeps` seam beside `exists`, not around it. `arm` reaches the filesystem twice per directory per tick and both reaches must be injectable, or the 40-odd cases that drive the loop over the non-existent `/repo` would all refuse. `defaultDeps()` supplies the real authority and the end-to-end cases spread it over real symlinks"
  - "`insideRoot` was EXPORTED rather than a new predicate added beside it. One export moves no census: `scripts/board-read.test.ts` pins the routing universe by name (51 members, 17 read-primitive call sites) and both numbers are unchanged, so the containment authority gained a caller without gaining a second spelling"
  - "The root-null early return moved to the TOP of `arm`, which is behaviour-preserving rather than a reordering of two live rules: the containment question now takes the root and cannot be asked before one exists, and the set the OLD check consulted was populated by a read — with no read there was nothing in it"
  - "`not-a-directory` is a CONTEXT-READER code and does not degrade the source, for the reason the queue reader's `unsafe-task-name` and `no-claim-record` already state: nothing failed to arrive, the entry was listed and inspected successfully and refused by shape"

patterns-established:
  - "Probe the arm NEXT to the fix before choosing the fix: probe E existed to answer the ancestor question, and its answer changed which mechanism the plan could use"
  - "Mutation read-back as a standing step: every mutation's emitted `.js` line is read before the suite is believed, because `noEmitOnError` makes a non-compiling mutation indistinguishable from an ineffective one. Second consecutive plan to catch one this way"
  - "Correct a committed measurement in place, with the correction named: the RED baseline's context row was re-taken against a pre-fix mirror after the probe was found reading the wrong discriminant, and the old number and the reason are recorded beside the new one"

requirements-completed: [DASH-04, DASH-05, DASH-03]

coverage:
  - id: D1
    description: "A single symlinked ENTRY inside an otherwise ordinary watched directory leaves that directory's watch armed — one escaping ticket file does not un-arm `plans/tickets`, and one escaping claimed task does not un-arm the pending, claimed and done stages"
    requirement: DASH-04
    verification:
      - kind: integration
        ref: "scripts/board-watch.test.ts#keeps `plans/tickets` armed when ONE ticket FILE inside it links out of the tree"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#keeps ALL THREE queue stages armed when one claimed task DIRECTORY links out"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#keeps `.grugops/context` armed when one context task DIRECTORY links out"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#PREMISE: an unmutated tree arms every one of the six watched directories"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 1 — probes A, B and C: armed 5/3/5 before, 6/6/6 after, refusal still reported in every one"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 5 M1 — restoring the source-label test reds exactly those three cases and nothing else"
        status: pass
    human_judgment: false
  - id: D2
    description: "A watched directory IS un-armed when the containment authority refused that directory itself, or refused any ancestor of it — a watch handle is never opened on a path reached through a link that left the tree"
    requirement: DASH-04
    verification:
      - kind: integration
        ref: "scripts/board-watch.test.ts#still un-arms the tickets DIRECTORY itself when IT is the link — and nothing else"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#un-arms a DESCENDANT of a refused ancestor: `plans` links out, `plans/tickets` goes with it"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#refuses a symlinked source directory and opens no handle on it, end to end"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 5 M2 — dropping the ancestor reach while keeping the leaf rule reds the descendant case and leaves the directory-itself control green"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 3 V1 — directory / child / grandchild, three rows, only the first un-arms"
        status: pass
    human_judgment: false
  - id: D3
    description: "A watch failure recorded before a containment refusal starts firing does not outlive the refusal, and a condition that clears re-arms the directory leaving no record behind"
    requirement: DASH-05
    verification:
      - kind: integration
        ref: "scripts/board-watch.test.ts#drops a watch record the moment the SAME directory becomes refused"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#re-arms with NO record left once the containment condition clears"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#CLOSES a handle opened before the refusal, rather than leaving it pointing outside"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 2 — all six branches of `arm` probed; exactly two leave a record standing, and both of them should"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 5 M3 — removing the one delete line reds exactly one case"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two containment refusals arriving in ONE read, one an ancestor of the other, produce the same armed set as either one applied alone in either order"
    requirement: DASH-04
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#reaches ONE armed set whichever order two refusals arrive in"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#produces ONE armed set for two refusals in one read, ancestor and descendant together"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 1 probe G and § 3 V3 — both orderings and the one-read case end on the same four directories"
        status: pass
    human_judgment: false
  - id: D5
    description: "A `.grugops/context/` entry whose name is outside the ported allow-list, and one that is not a directory, are each reported by name rather than skipped in silence, and the listing count equals rows plus reported skips"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#names an entry outside the ported allow-list instead of skipping it"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#names a plain FILE sitting among the task directories under its own code"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the walk TOTAL, against a denominator derived from the listing"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 5 M4 — silencing one report reds BOTH the naming case and the arithmetic"
        status: pass
    human_judgment: false
  - id: D6
    description: "The low-latency path still delivers: the wall-clock event path is measured before and after the change to the arm loop, against the poll period it has to beat"
    requirement: DASH-04
    verification:
      - kind: e2e
        ref: "scripts/board-watch-live.test.ts — 5 passed; MEASURED event path 273 ms against a 1000 ms poll period on darwin/arm64 node v24.12.0"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt § 4 — the same suite run against a pre-fix mirror: 274 ms before, 273 ms after, every row within noise"
        status: pass
    human_judgment: false
  - id: D7
    description: "The directory-granularity watch rule behaves the same on Windows, where Node documents that fs.watch events may not be emitted at all and a renamed watched directory emits nothing"
    requirement: DASH-04
    verification: []
    human_judgment: true
    rationale: "`UNKNOWN - verify`, unchanged and deliberately not closed here (threat register row T-32-34-06, D-14, `.planning/WINDOWS.md` row 186). Everything measured in this plan ran on darwin/arm64; `scripts/board-watch.test.ts`'s header states that a case asserting Windows semantics from darwin would be asserting a platform it never ran on. The mandatory poll floor is the stated safety net and this plan did not weaken it — the poll is still not disableable and its period was not widened. Phase 33 / CAP-02 owns the Windows measurement."

duration: 90 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 34: The Watch Asks About the Directory, Not About the Label Summary

**One escaping ticket file no longer takes `plans/tickets` off the low-latency path and one escaping claimed task no longer takes all three queue stages off it — the arm loop asks `board-read`'s own containment authority about the exact directory a handle would be opened on, gets the ancestor rule free from the same call, and stops publishing a promise of a re-arm it cannot keep.**

## Performance

- **Duration:** 90 min
- **Started:** 2026-09-16T10:17Z
- **Completed:** 2026-09-16T10:45Z (measurement window; the wall time above includes the full-suite and live-suite runs)
- **Tasks:** 3
- **Files modified:** 10 (8 tracked source/test/contract files, 2 planning artifacts created)

## Accomplishments

- **The blast radius is gone, and it was the worst of the three findings.** `refusedSources` was a
  `Set<SourceName>` built from every `OUTSIDE-ROOT` read error's `source` field, but the containment
  authority raises that error PER ENTRY. `deriveWatchDirs` gives the three queue stages one source
  label, so a single symlinked task directory inside `claimed` un-armed `pending` and `done` too —
  two ordinary empty directories nobody had planted anything in. `loop.watchErrors()` stayed empty
  throughout, so the header printed its ordinary state while the queue, the part of the board that
  moves during a live run, was answering only on the ten-second poll.
- **The plan's prescribed mechanism was measured insufficient before it was written.** Probe E
  planted a `plans` that is itself a link out of the tree and recorded which paths the read refuses:
  `plans/board.md`, `plans/tickets`, `plans/traceability.md`. None is `plans` or an ancestor of it,
  so a `refusedDirs` set with an upward walk would have armed a handle on a directory outside the
  root. Probe A and probe E are the same refusal SHAPE with opposite required answers, and what
  differs is a property of the directory — so the directory is what gets asked.
- **The ancestor rule is a consequence, not a second walk.** `insideRoot` puts the target through
  `realpathSync`, which resolves every component, so "the directory itself left the tree" and
  "something above it did" are one question with one answer. There is no upward walk to bound, and
  the plan's "say what bounds it" requirement dissolves rather than being met.
- **Order-independence by removal.** DASH-04's concurrency probe asked whether two refusals arriving
  in one read produce the same armed set as either ordering. They do, and not because anything
  asserts it: nothing about a refusal is accumulated between reads any more, so there is no state for
  two refusals to interact through.
- **The early return now does both the things its neighbours do.** It was the only one of `arm`'s
  four early returns that never cleared the directory's record, and the only one whose comment did
  not say what it did with it. Every stderr frame and every `--json` document kept publishing "it is
  closed and will be re-armed on the next poll tick" about a re-arm the return guarantees cannot
  happen — a false statement on the trace surface under CLAUDE.md's no-fabrication rule.
- **All six branches of `arm` were probed, not just the one that changed.** The GREEN proof's § 2 is
  a table: exactly two branches leave a record standing, and both should — the one with no root to
  work with, and the one where the watch genuinely failed.
- **The context reader's last two silent skips have names.** `unsafe-task-name` and
  `not-a-directory`, mirroring the queue reader's twins, with the walk asserted total against a
  denominator taken from the listing on the other side of the loop. Three listed entries used to
  produce one row and zero findings; they now produce one row and two findings, and 3 = 3.
- **The wall clock did not move.** The live spawned-process suite was run against a pre-fix mirror
  and against this commit: event path 274 ms → 273 ms against a 1000 ms poll period. A watch that is
  armed but no longer delivering would pass every structural case and fail here.

## Task Commits

1. **Task 1: RED baseline** — `34be317a` (test)
2. **Task 2: the directory-granular containment test, the record delete, the named context skips** — `ec8fb04e` (feat)
3. **Task 3: the GREEN proof** — `e4c0be47` (docs)

**Plan metadata:** the `docs(32-34): complete the directory-granularity gap-closure plan` commit,
carrying this SUMMARY, `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md`.

`actuals.commits` records **3** — the value `git rev-list --count f8c84e06..HEAD` returns at the
moment this file is written, measured from the ledger the commit protocol persisted before the first
commit. The metadata commit takes it to 4 once it lands, which is what `/gsd-verify-work` re-measures.

## Files Created/Modified

- `scripts/board-dashboard.ts` — `LoopDeps.contained` with the docblock recording what it replaced
  and why a path set could not do it; `defaultDeps` wiring it to `board-read`'s `insideRoot`;
  `refusedSources` and the `OUTSIDE_ROOT` import removed; `adoptRead` reduced to the one fact it
  still takes; `arm` reordered so the root check is first and the containment check carries both
  effects
- `scripts/board-read.ts` — `insideRoot` and the `Containment` type exported, with the paragraph
  recording the second caller and the pair of probes that made it necessary; the context reader's
  two skips reported by name; the reader's docblock carrying its own code list and totality claim
- `scripts/board-dashboard.js`, `scripts/board-read.js` — the committed twins, rebuilt in the same
  commit as their sources
- `scripts/board-watch.test.ts` — a `refused` set on the harness (deliberately not a model of the
  rule, and the docblock says so); `withLinkedTree` creating all three queue stages and returning
  repo-relative armed names; two new describe blocks carrying nine cases
- `scripts/board-read.test.ts` — three cases for the context reader's named skips and its totality,
  against a denominator derived from `listDirectoryBounded`
- `scripts/board-dashboard.test.ts` — `contained` added to its two `LoopDeps` literals
- `agent-factory/contracts/board.md` — the watch rule restated at directory granularity, with the
  ancestor rule, the escaping-entry rule, the no-record rule and the context walk's totality
- `.planning/phases/32-board-projector-cli-dashboard/32-34-RED-baseline.txt` — seven probes, the
  ancestor answer, the immortal record and the two silent skips, all measured
- `.planning/phases/32-board-projector-cli-dashboard/32-34-GREEN-proof.txt` — the re-run, the
  six-branch table, the seven variations, the before/after wall clock, four mutations and the
  reachability answers

## Decisions Made

See `key-decisions` in the frontmatter. The one that cost something beyond this plan:

**The containment question rides the `LoopDeps` seam.** `arm` now reaches the filesystem twice per
directory per tick — one `existsSync` and one `realpathSync`, six of each per ten-second production
period. Both go through the seam, which is what keeps the 40-odd cases that drive the loop over the
non-existent `/repo` runnable. The seam is defeatable by a caller passing `contained: () => true`,
exactly as `exists` and `read` already are; production passes `defaultDeps()` and the end-to-end
cases spread it over real symlinks, so the shipped predicate is what they measure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's prescribed containment mechanism cannot satisfy the plan's own
behaviour bullet**

- **Found during:** Task 1 (probe E), acted on in Task 2
- **Issue:** The plan specifies `refusedDirs: Set<string>` built from the path each containment read
  error SPELLED, plus `isRefusedDir(rel)` walking ancestors under a stated bound. Task 2's behaviour
  list requires "given `plans` linked outside the root, neither `plans` nor `plans/tickets` is
  armed". Probe E measured the paths that read actually refuses — `plans/board.md`, `plans/tickets`,
  `plans/traceability.md` — and none of them is `plans` or an ancestor of `plans`, so the prescribed
  set with the prescribed walk leaves `plans` ARMED: a handle on a directory resolving outside the
  repository root, which is T-32-34-03 and T-32-34-04. The impossibility is general, not incidental:
  probe A's refusal is `X/entry` under a watched `X` with required answer ARMED, probe E's is
  `Y/entry` under a watched `Y` with required answer UN-ARMED, and the difference is a property of
  `X` and `Y` rather than of the refusals.
- **Fix:** `arm` asks the containment authority about the directory instead of inferring it from a
  list of paths some other question refused. `board-read`'s `insideRoot` is exported and wired
  through a new `LoopDeps.contained`; `refusedDirs` and `isRefusedDir` were never written.
- **Files modified:** `scripts/board-dashboard.ts`, `scripts/board-read.ts`, `scripts/board-watch.test.ts`, `scripts/board-dashboard.test.ts`
- **Verification:** Mutation M1 reds the three escaping-entry cases; M2 reds the descendant case
  while leaving the directory-itself control green; the ancestor case additionally asserts as a
  PREMISE that the authority never spelled `plans`, so it cannot pass under a path-set mechanism.
  The whole argument and its measurements are in `32-34-RED-baseline.txt` probe E and
  `32-34-GREEN-proof.txt` § 1.
- **Committed in:** `ec8fb04e`

**2. [Rule 1 - Bug] The RED baseline's context measurement read the wrong discriminant**

- **Found during:** Task 2, while re-running the probe against the fix
- **Issue:** The probe read `sources.context.present` — a field of the ABSENT arm of `SourceState` —
  instead of the `source === "ok"` discriminant every other reader of that union uses, and reported
  zero task rows. The defect it was measuring was real and the direction was right, but the row it
  wrote into the committed baseline said "3 listed entries vs 0 rows + 0 reported skips" when the
  honest figure is "3 vs 1 + 0".
- **Fix:** The probe was repaired and the measurement re-taken against a mirror of the pre-fix `.js`
  files extracted from `34be317a` into the session scratchpad. The baseline's row now carries the
  corrected numbers AND a paragraph naming the old ones, the cause, and how it was re-taken — a
  quiet overwrite would have been the more comfortable option and the less honest one.
- **Files modified:** `.planning/phases/32-board-projector-cli-dashboard/32-34-RED-baseline.txt`
- **Verification:** The corrected pre-fix figure (1 row, 0 skips) and the post-fix figure (1 row, 2
  skips, 3 = 3) were taken by the same repaired probe against the two builds.
- **Committed in:** `ec8fb04e`

**3. [Rule 3 - Blocking] The queue fixture cannot answer the question probe B exists to ask**

- **Found during:** Task 1
- **Issue:** `scripts/fixtures/board-snapshot/.grugops/queue/` ships only `claimed`. On it, `pending`
  and `done` leave through `arm`'s absent-directory return, so "one escaping claimed task un-armed
  all three stages" produces an armed list indistinguishable from the fixture's own shape.
- **Fix:** Every probe tree and `withLinkedTree` create all three stages before the mutation runs, so
  the healthy armed set is six and a shortened one is a measurement. A `PREMISE` case asserts the
  unmutated tree arms all six, which is what stops the comparison from being vacuous.
- **Files modified:** `scripts/board-watch.test.ts` (the committed fixture was NOT touched)
- **Verification:** `PREMISE: an unmutated tree arms every one of the six watched directories` is
  green and `git diff --exit-code -- scripts/fixtures/` is clean.
- **Committed in:** `ec8fb04e`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking). **Impact on plan:** Deviation 1 changes the
plan's prescribed artifact and is the substance of the round — it was taken because the prescribed
artifact was measured unable to meet the plan's own stated behaviour, and the measurement is on
record in both artifacts. Deviations 2 and 3 are instrument repairs. No scope widened; no published
shape moved.

## Issues Encountered

**A mutation that does not compile reports green, for the second plan running.** M2's first spelling
left the `insideRoot` import unused, `noUnusedLocals` turned it into TS6133, and `noEmitOnError:
true` meant nothing was emitted — the suite would have run against the previous build. It was caught
by reading the mutated line back out of the emitted `.js` before believing the result, which is the
step 32-33 added after being bitten by the same thing. Recorded in `32-34-GREEN-proof.txt` § 5 rather
than quietly fixed, because the interesting fact is that the check earned its keep on its first
outing.

**`npm run check:build-parity` fails while the rebuilt twins are uncommitted, and that is the guard
working.** It compares the tracked `.js` against a rebuild and reports any that moved; between
`npm run build` and the commit, `board-dashboard.js` and `board-read.js` legitimately have. It goes
green on the commit (verified: exit 0 immediately after `ec8fb04e`). Noted so the next reader does
not mistake the intermediate state for a broken build.

## Known Stubs

None. No placeholder, empty-value or "coming soon" path was introduced by this plan.

## Threat Flags

None. The plan's `<threat_model>` covers every surface this change touches. T-32-34-01 through
T-32-34-05 are mitigated as the register states, and the mitigation for T-32-34-03 is stronger than
the register anticipated — the ancestor reach comes from the containment authority's own resolution
rather than from a walk this module would have had to bound. The one `accept` row (T-32-34-06,
Windows `fs.watch` semantics) is unchanged and still `UNKNOWN - verify`; no new network endpoint,
auth path, file access pattern or schema at a trust boundary was introduced, and the mandatory poll
floor was neither widened nor made disableable.

## Verification Results

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts scripts/board-read.test.ts` | exit 0, **209 passed** (RED baseline: 195 — 14 cases added, none replaced) |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch-live.test.ts` | exit 0, **5 passed**; event path **273 ms** against a 1000 ms poll period |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | exit 0; "no tracked build output moved"; "All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources" |
| `npm run check:dashboard-readonly` | exit 0, **171 passed**; 316 resolved call sites, 0 unresolved, 0 refused acquisitions |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, **5097 passed / 2 skipped** across 75 files (floor: 4974; 32-33 recorded 5083) |
| `git diff --exit-code -- scripts/ agent-factory/ docs/` | clean, recorded in both artifacts |
| `grep -c 'watchErrors' 32-34-RED-baseline.txt` | 17 (floor: 7) |
| `grep -c 'armed' 32-34-GREEN-proof.txt` | 35 (floor: 7) |
| board-read routing census | 17 read-primitive call sites over a universe of 51 — both unchanged, so the exported authority gained a caller and not a second spelling |

## Estimate vs actuals

The plan estimated 125,000 tokens for 3 tasks. The realized diff over `f8c84e06..e4c0be47` is 111,259
characters, which is **27,815** on the chars/4 scale `actuals.tokens` uses. Recorded unrounded, and
low against the estimate for a reason worth carrying forward: the departure recorded as deviation 1
made the change SMALLER than the plan budgeted for. `refusedDirs` plus a bounded ancestor walk plus
the cases proving the walk's bound is a body of code; one exported function, one seam field and one
call is not. A plan whose prescribed mechanism is replaced by a derivation should be expected to come
in under, not over.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap 2 (DASH-04, DASH-05) from `32-VERIFICATION.md` is closed at the level the round asked for, and
  the carried IN-01 finding it named — the context reader's two silent skips — is closed with it and
  measured.
- **One published shape changed, and it is internal:** `LoopDeps` gained a required `contained`
  field. Nothing outside this repository constructs a `LoopDeps`; inside it, three test files do, and
  all three were updated in the same commit. `SCHEMA_VERSION` did not move and no snapshot field
  changed, so 32-33's version 2 is still what a consumer sees.
- `board-read.ts` now exports `insideRoot` and the `Containment` type. Any future caller asking a
  containment question should call it rather than compose a second comparison — the docblock says so
  and names the round that paid for the lesson.
- Plans `32-35` through `32-37` in this round are unaffected by anything here except the `LoopDeps`
  shape, which only a test constructing a loop would notice.
- Nothing is deferred. T-32-34-06 (Windows `fs.watch`) remains `UNKNOWN - verify` and is owned by
  Phase 33 / CAP-02, as D-14 and `.planning/WINDOWS.md` row 186 already record.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*

## Self-Check: PASSED

- Both created artifacts exist on disk (`[ -f ]` on the RED baseline and the GREEN proof), as do the
  four source files this plan modified.
- All three task commits resolve in `git log --oneline --all`: `34be317a`, `ec8fb04e`, `e4c0be47`.
- Every task's `<acceptance_criteria>` was re-run and passes, with the single documented departure
  recorded as deviation 1 above; the plan-level `<verification>` commands and their results are
  tabulated under "Verification Results".
- `scripts/board-dashboard.ts` contains no set keyed by source name deciding whether a watch is
  armed: the sole remaining `Set<SourceName>` occurrence in the file is inside the docblock that
  records what was removed.
