---
phase: 32-board-projector-cli-dashboard
plan: 19
subsystem: infra
tags: [typescript, board-projector, dashboard, fs-watch, containment, set-literal-drift]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-03's watch loop — the injected `LoopDeps` seam, the forced-error env seam and the fake-timer harness every case here drives"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-10's single containment authority — `resolveRepoRoot`, `insideRoot` and the `OUTSIDE-ROOT` code this plan's watch arm now consumes"
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-15..32-18's reader closure and `writeDocument` stdout chokepoint, which the emitted-document assertions run against"
provides:
  - "`watchErrorsByDir` — one CURRENT watch record per directory, replacing the append-only list; cleared on a successful re-arm, on an absent directory, on a root change and on `stop`"
  - "`currentWatchErrors()` — the records in relative-name order, so two frames of one state are the same bytes"
  - "`deriveWatchDirs(layout, stages)` — the watched set computed from `SOURCE_NAMES`, `FIXED_SUBPATHS` and `QUEUE_STAGES`; `WATCH_DIRS` is its result and no directory string is typed in the module"
  - "`resolvedRoot` threaded from the seeded snapshot into `arm`, so watches and reads resolve through one root"
  - "A containment refusal consumed rather than re-implemented: a source the reader refused with `OUTSIDE-ROOT` is not watched, and an open handle on it is closed"
  - "`OUTSIDE_ROOT` exported from `scripts/board-read.ts` — the containment code as one literal, asked by both modules"
  - "A contract sentence covering both verbs: the projector arms its watches against the root it reads against"
affects: [board projector, dashboard watch loop, any --json consumer reading readErrors, any later phase that moves a source's on-disk subpath]

actuals:
  tokens: 17595
  tasks: 3
  commits: 7
plan_head_before: 91b4516d6333400c68f9608db51f758582efa3b9

tech-stack:
  added: []
  patterns:
    - "A record that is a STATE, not a LOG: keyed by the thing it describes, written on failure, deleted by the event that makes it false"
    - "The clearing and the promise are named at both ends: the message says 'it will be re-armed' and the re-arm site says it is what makes that true"
    - "Derive the set, assert the RELATIONSHIP: every source has a watched directory on its path, every watched directory is justified by a source, both directions"
    - "A derivation proves it can fail: the same logic run over MUTATED layout inputs, or it is a literal with a function around it"
    - "Consume the authority's answer rather than re-implementing its rule: the loop asks the reader which sources were refused, with the reader's own exported code"
    - "Probe the sibling arm of every refusal: the case that proves it refuses is paired with one that proves it does not OVER-refuse, mutation-proven"

key-files:
  created: []
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-watch.test.ts
    - scripts/board-dashboard.test.ts
    - scripts/board-read.ts
    - scripts/board-read.js
    - agent-factory/contracts/board.md

key-decisions:
  - "The watch record is keyed by DIRECTORY, not by reason: one directory has one watch and one current reason, and keying by reason would produce two entries both claiming to be current"
  - "`stop` CLEARS the records. Every record promises a re-arm on the next poll tick and `stop` removes the tick, so a surviving record would describe a loop that no longer runs"
  - "An ABSENT directory clears its record too: an absent directory is not a failed watch, and without the clear a record filed before a root existed would outlive the condition"
  - "The pre-seed answer is STATED and asserted: `armAll` before any read arms nothing and files one record per directory saying why, because the loop cannot even ask whether a directory exists without a root to join it against"
  - "A containment refusal is NOT recorded a second time by the watch arm — the reader reported it once against the source it belongs to, and a second entry would be the same finding twice in the list a consumer reads"
  - "A resolved root that MOVED closes every handle: they were opened against a tree that is no longer the one being projected"
  - "`OUTSIDE_ROOT` is exported rather than copied, which is what its own docblock already asked for; the dashboard is the consumer that docblock anticipated"
  - "The file-shaped/directory-shaped split in `deriveWatchDirs` reads the layout (a final segment carrying an extension names a file) and touches no filesystem, because a derivation that stat-ed the tree would make the watched set depend on which tree the process started in"

patterns-established:
  - "Two-sided pin over a DERIVED number: `WATCH_DIR_COUNT` is the alarm, the derivation is the mechanism, and it now fires when the LAYOUT moves rather than when somebody edits a list"
  - "Harness seeds by default, because that is the production order; the one case that drives the other order passes `seeded: false` and asserts what happens"

requirements-completed: [DASH-04, DASH-05]

coverage:
  - id: D1
    description: "A directory whose watch fails repeatedly contributes ONE current record rather than one per poll tick, and the record disappears when the watch is successfully re-armed"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#reports exactly ONE record for a directory whose watch fails on ten consecutive ticks"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#reports ZERO records once the watch is re-armed successfully"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#replaces the reason when the same directory fails again for a different reason"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#orders two failing directories by name, so two frames of one state are the same bytes"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#holds no record after `stop`, so a later emit prints nothing about a watch that is gone"
        status: pass
      - kind: other
        ref: "RED transcript: the same five cases against the committed .js — 10 records for ten ticks, 1 surviving a successful re-arm, 2 claiming to be current for one directory, WATCH_DIRS order, 1 surviving stop"
        status: pass
    human_judgment: false
  - id: D2
    description: "The watched directory set is derived from the two on-disk-layout authorities the reader already owns, and the suite asserts a relationship in both directions rather than a second hand-typed list"
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#IS the derivation over the live layout authorities, not a copy of its answer"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#gives every source except the dial a watched directory on its path"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#justifies every watched directory by at least one source"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#MOVES with the layout: a renamed tickets subpath and a fourth queue stage"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#drops the dial, and folds traceability into the directory the board already supplies"
        status: pass
      - kind: other
        ref: "derived set printed from the committed .js: byte-identical to the six-entry list it replaces, order and source assignment included"
        status: pass
    human_judgment: false
  - id: D3
    description: "A watch is armed against the same resolved root every read is resolved against, and a symlinked source directory is refused by one rule rather than watched by one module and refused by another"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#arms against the root the READ resolved, not the value the caller typed"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#follows a later read that resolves to a DIFFERENT root"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#arms NOTHING before a read has resolved a root, and says so once per directory"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#refuses a symlinked source directory and opens no handle on it, end to end"
        status: pass
      - kind: integration
        ref: "scripts/board-watch.test.ts#refuses PER SOURCE: a linked tickets directory leaves the board's own watch armed"
        status: pass
      - kind: other
        ref: "mutation: an arm that also refuses any watched directory containing a refused source's subpath reds the per-source case alone (1 failed | 36 skipped), so the sibling case discriminates"
        status: pass
    human_judgment: false
  - id: D4
    description: "The contract states that watches are armed against the resolved root, so the containment rule covers both verbs rather than reads alone"
    requirement: "DASH-05"
    verification:
      - kind: other
        ref: "agent-factory/contracts/board.md § containment — the paragraph beginning 'The projector arms its filesystem watches against the same resolved root it reads against'; npm run check:public-docs && check:imperative-lexicon && check:banned-claims && check:claim-anchors all ALL CHECKS PASSED"
        status: pass
    human_judgment: true
    rationale: "Whether the added sentence closes the gap a reader comparing the two modules found (IN-01: the exemption was written down nowhere) is a reading judgment. The BEHAVIOUR it describes is mechanically covered by D3; that the prose now answers the reader's question is not."

duration: 96 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 19: One Current Watch Record, a Derived Watched Set, and One Resolved Root for Both Verbs Summary

**The watch loop's failures became a state instead of a log, its directory list became a derivation over the reader's own layout, and its handles are now opened against the root the containment authority resolved — with a symlinked source directory refused for watching as well as for reading.**

## Performance

- **Duration:** 96 min
- **Started:** 2026-09-15T10:31:00Z
- **Completed:** 2026-09-15T11:08:40Z (last commit 2026-09-15T11:00:42Z; the tail is the final full-suite run and the gates)
- **Tasks:** 3
- **Files modified:** 7 (5 sources + 2 committed build outputs)

## Accomplishments

- **WR-06 closed.** `createLoop` holds `watchErrorsByDir: Map<rel, ReadError>` instead of an append-only array. `noteWatchError` sets by directory; `arm`'s success path deletes the key it just armed, which is what makes the record's own "it will be re-armed on the next poll tick" sentence true. Ten failing ticks produced **10** records before and **1** after; a successful re-arm produced **1** before and **0** after. `emit` and the published document read the records in relative-name order, so two documents of one state diff as a changed finding rather than a reshuffle.
- **WR-07 closed.** `deriveWatchDirs()` walks `SOURCE_NAMES`, skips the dial by SOURCE NAME, takes each source's `FIXED_SUBPATHS` entry, uses the parent directory when the subpath names a file, expands the queue over `QUEUE_STAGES`, and deduplicates so traceability shares the board's `plans/` handle. `WATCH_DIRS` is that result; **no directory string is typed in `scripts/board-dashboard.ts` at all**. The derived set is byte-identical to the list it replaces, order and source assignment included. The suite's second hand-typed list is deleted and replaced by a relationship asserted in both directions, plus a mutation case that runs the derivation over a renamed tickets subpath, a fourth queue stage and a moved board file.
- **IN-01 closed, and closed one register deeper than the finding asked.** Threading the resolved root was necessary and NOT sufficient: `join(resolvedRoot, "plans")` is still the symlink, and `existsSync` says it is there — so the handle would still have been armed. The loop now also consumes the reader's containment ANSWER: a source refused with `OUTSIDE-ROOT` is not watched, and an already-open handle on it is closed. Measured end to end on a real scratch tree whose `plans/` is a link outside it: **before**, the reader refused `board`, `tickets` and `traceability` while two handles were armed on the refused path; **after**, zero handles on it, the `.grugops` watches unaffected, and the refusal reported exactly three times — once per source, by the authority that made it.
- **The sibling arm was probed, not assumed.** A linked `plans/tickets` leaves the board's own watch on `plans/` armed, because `plans/` is inside the root and the board reads fine through it. Mutation-proven: an arm that also refuses any watched directory containing a refused source's subpath reds that one case while the other 36 stay green.

## Task Commits

1. **Task 1: One current watch record per directory** — `21423572` (test, RED) → `ea808516` (fix, GREEN)
2. **Task 2: The watched set is derived, and the assertion is a relationship** — `0350dcab` (test, RED) → `2dd1bf08` (feat, GREEN)
3. **Task 3: A watch is armed against the root every read is resolved against** — `543e310e` (test, RED) → `9b7c8a0c` (feat, GREEN) → `019eb460` (test, sibling arm + mutation proof)

## Files Created/Modified

- `scripts/board-dashboard.ts` — the keyed watch-error map and its name-sorted reader, `deriveWatchDirs` and the `WatchDir` type, `resolvedRoot` + `refusedSources` + `adoptRead`, and the rewritten `arm`
- `scripts/board-dashboard.js` — rebuilt; build parity and freshness both green over 65 committed outputs
- `scripts/board-watch.test.ts` — 14 new cases; the `armFailures` seam (a throwing `watch()` call), the `readRoot` holder, the `withLinkedTree` scaffold, and a harness that seeds by default
- `scripts/board-dashboard.test.ts` — one premise repaired: the SIGINT case seeds before it arms, which is the order `run` takes
- `scripts/board-read.ts` / `.js` — `OUTSIDE_ROOT` exported, with the reason recorded in its existing docblock
- `agent-factory/contracts/board.md` — one paragraph in the containment section covering the watch verb

## Decisions Made

Recorded in `key-decisions` above. The three a later reader is most likely to reopen:

1. **`stop` clears the records.** Every record promises a re-arm on the next poll tick; `stop` removes the tick. A surviving record is a statement about a loop that no longer runs.
2. **The watch arm records nothing for a containment refusal.** The reader already reported it, against the source it belongs to, and the contract says a refusal appears as a read error against that one source. A second entry would be the same finding twice in one list.
3. **The pre-seed answer is "arm nothing, say why per directory".** The alternative the plan offered — use the argv root and record that it is unresolved — was declined: it would open handles against the one value the containment authority never saw, which is the defect being closed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocker] `OUTSIDE_ROOT` was not exported, so the loop could not ask the containment question with the authority's own constant**

- **Found during:** Task 3
- **Issue:** `scripts/board-read.ts:586` declared `const OUTSIDE_ROOT = "OUTSIDE-ROOT"` unexported. The watch arm needs to know which sources the reader refused for containment; the alternatives were a seventh hand-typed copy of the code string (this repository's recorded set-literal drift class) or a second implementation of the containment rule inside the dashboard (exactly the inconsistency IN-01 reports).
- **Fix:** Exported it and recorded the reason in its existing docblock, which already anticipated "a consumer filtering `readErrors` for escapes asks one question".
- **Files modified:** `scripts/board-read.ts`, `scripts/board-read.js` — two files outside this plan's declared `files_modified`.
- **Verification:** `npm run typecheck`, `npm run check:build-parity`, `npm run freshness` (65 outputs fresh), full suite 74 files / 4916 passed.
- **Committed in:** `543e310e`

**2. [Rule 2 — Missing critical] Threading the resolved root does not refuse a symlinked source directory on its own**

- **Found during:** Task 3
- **Issue:** The plan's task-3 behaviour list requires "the read is refused and no watch is armed on it". With only the root threaded, `arm` joins the resolved root with `plans` — which IS the symlink — and `existsSync` follows it, so the handle is armed anyway. Measured: the RED for the symlink case showed two handles armed on the refused path even with a correctly resolved root.
- **Fix:** `adoptRead` collects the sources the last read refused with `OUTSIDE_ROOT`; `arm` checks that set first and closes any handle already open on such a directory. The check precedes the already-armed early return, because a tree can acquire a symlink under a running loop.
- **Files modified:** `scripts/board-dashboard.ts` (+ rebuilt `.js`)
- **Verification:** the end-to-end symlink case, plus the per-source sibling case and its mutation proof; four hand-run sibling probes (linked `plans/tickets`, linked `plans/traceability.md`, linked `.grugops/queue`, and an unlinked control) each produced the expected refused/armed pair.
- **Committed in:** `9b7c8a0c`, `019eb460`

**3. [Rule 1 — Bug, in a test premise] Two existing cases drove `createLoop` in an order `run` never takes**

- **Found during:** Task 3
- **Issue:** `scripts/board-dashboard.test.ts`'s SIGINT case and the `board-watch` harness armed before seeding. Under the stated pre-seed behaviour they arm nothing, and their premises ("no watcher was armed…") became false for a reason those cases are not about.
- **Fix:** Both now seed before arming, which is the order `run` takes (read → seed → arm). The pre-seed order is not untested — it has its own case, which passes `seeded: false` and asserts the answer.
- **Files modified:** `scripts/board-dashboard.test.ts`, `scripts/board-watch.test.ts`
- **Verification:** both suites green (93 cases); the premise assertions still fail when nothing is armed, which is what they are for.
- **Committed in:** `9b7c8a0c`

---

**Total deviations:** 3 auto-fixed (1 × Rule 3, 1 × Rule 2, 1 × Rule 1).
**Impact on plan:** No scope creep. Deviation 2 is the difference between satisfying the plan's wording and satisfying its behaviour list; deviation 1 is its prerequisite. Deviation 3 touches test premises only and is stated rather than silently relaxed.

## Issues Encountered

- **The symlink refusal count is three, not two.** The plan and the first probe expected `board` and `tickets`; `plans/traceability.md` also lives under `plans/`, so one symlink refuses three sources. The case asserts three, and the reason is written beside it.
- **A directory whose source is refused but whose watched directory is owned by another source stays watched.** A linked `plans/traceability.md` refuses `traceability` and unwatches nothing, because `plans/` belongs to `board` and is inside the root. This is correct — the containment rule is about paths, and `plans/` is not outside — and it is recorded here rather than left for a reader to rediscover. The watch on `plans/` will fire for events on the refused link, producing a re-read that re-refuses; no content crosses.
- Nothing else. No auth gates, no checkpoints, no package installs.

## Known Stubs

None. No placeholder value, no skipped case and no unrun `<verify>` was introduced by this plan. The two suite-wide skips (2) predate it and are unchanged.

## Verification

All five plan-level verification steps were run on the final tree:

1. `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts scripts/board-dashboard.test.ts` → **93 passed** (37 + 56).
2. `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` → exit 0; parity reports no tracked build output moved; freshness reports **65 committed .js file(s) match a rebuild of their sources**.
3. `npm run check:public-docs && npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:claim-anchors` → each ends **ALL CHECKS PASSED**.
4. `node scripts/check-foundation-guards.js` → **ALL CHECKS PASSED**. (`VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` → ALL CHECKS PASSED, exit 0.)
5. `npx vitest run --exclude '**/scripts/e2e/**'` → **74 files, 4916 passed, 2 skipped**. Above the floors the plan set (74 files, 4811 passed).

The live claude-CLI e2e lane was NOT run (`npm test` is excluded by project instruction); its status for this change is `UNKNOWN - verify`, and nothing in this plan touches that lane's surface.

## Next Phase Readiness

- `REQUIREMENTS.md` and the ROADMAP phase status are **not** flipped to Complete by this plan, as its success criteria require. DASH-04 and DASH-05 are also declared by sibling plans in this phase; the shared-ID gate defers them until every declaring plan has a SUMMARY.
- Ready for `32-20`. Nothing here blocks it; `scripts/board-dashboard.ts` is the shared file, and it is committed and fresh.
- Still open from `32-REVIEW.md` and NOT addressed here: WR-08 (duplicate ticket ids), WR-09 (the walk bound truncating in filesystem order), IN-02 (the queue reader's two silent skips), IN-03 (`splitRow`'s trailing space).

## Self-Check: PASSED

Every file named in `key-files.modified` exists on disk; all 7 task commits and the plan-metadata commit resolve in `git log`. `git rev-list --count 91b4516d..HEAD` was **7** at the moment this SUMMARY was written (the eighth is this document's own commit). The plan-level verification was re-run on the final tree and every step is recorded above with its numbers.
