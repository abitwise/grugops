---
phase: 33-live-capture-windows-portability
plan: 12
subsystem: testing
tags: [capture-live, d-07, parity, provenance, sha256, tdd, cr-01, cr-02, cr-03, wr-04, in-01]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-01 runner (scripts/capture-live.ts) with its offline suite; 33-08 held-capture verify path; 33-10 the committed round-1 capture (commit c7be6d0d) and 33-DIAGNOSIS § 1.4 (the path-invariant projection's definition)"
provides:
  - "D-07 verdict computed by a path-invariant projection (per role: note count + kind multiset + author; verdict marker; note route) — `noteRoute`, `projectLivePath`, `compareLivePaths`, `deriveOutcome` (CR-03)"
  - "The scored transcript streamed into a runner-owned sibling scratch (`TargetBuild.transcriptDir`), `isOutsideTargets` asserted at run time, and the `runTarget` / `LiveOps` / `LIVE_OPS` seam plan 33-13 reuses (CR-01)"
  - "D-05 provenance by NAME (`pluginUnderTest`), by validated cache path (`pluginCachePathAccepted`, WR-04), by CONTENT (`contentDigest` over `git ls-files`), three-state (`provenanceVerdict`), and an outcome input — `pass` unreachable unless MET (CR-02)"
  - "Report schema: `## Dual-path parity (D-07) — path-invariant projection`, `## Replay comparator (informational — task-id keyed, deterministic replay only)`, `| run X transcript location |`, `| installed plugin provenance (D-05, content digest over N tracked files) |`, `| plugin under test per system/init |`"
affects: [33-13, 33-21, 33-22, flip-manifest, uat-live]

# Actuals (#2632) — chars/4 over the realized diff (three files, ledger c2b2ba24..HEAD), never a harness token count.
actuals:
  tokens: 26405
  tasks: 3
  commits: 6
plan_head_before: c2b2ba244f73b6048e5e980305c60ced8781aeda

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Path-invariant projection: compare only fields the model cannot choose (count, kind multiset, author role, route, frozen marker); a predicate that keeps `at`/`body`/task id can never be met by two live sessions"
    - "Run seam (`LiveOps`): the three token-spending operations are the only injectable surface; everything downstream is the same code offline and live"
    - "Provenance by content over a named tracked set, never `git rev-parse` inside a directory named by the subject"
    - "Held-capture fixture read via `git show <sha>:<path>` so the immutable artifact is the test input and a shallow clone reds loudly"

key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts

key-decisions:
  - "The held round-1 capture still reads as DIVERGENT under the corrected D-07 projection — six named divergences pinned verbatim over commit c7be6d0d; D-20 is not softened"
  - "The replay comparator (`assertEquivalent`) is demoted to an informational section and is no longer an outcome input; `scripts/dual-path-equivalence.ts` is untouched"
  - "A path equal to a root is NOT outside it (`isOutsideTargets` fails closed), and the cache root itself is not an acceptable plugin directory"
  - "Provenance is read from run A's init frame (one install route serves both runs) and reaches `deriveOutcome` as `provenance.state`"
  - "`LIVE_ALLOWED_TOOLS` is byte-identical to the dispatch base 722d5fd6 — dropping Write/Edit is the KIT decision plan 33-21 puts to the human"

patterns-established:
  - "RED evidence records built from vitest JSON (translated to the TAP shape gsd's `check tdd-red-evidence` parses); all three tasks classified RED_EVIDENCE_OK before GREEN"

requirements-completed: [CAP-03, CAP-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "D-07 verdict is a path-invariant projection: the held capture reads as divergent with six named sentences; an at/body-only pair reads as parity; kind multiset compared; note route derived from tool-use blocks; deriveOutcome wired"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#held capture (commit c7be6d0d): the projection still names the round-1 divergences by role, route and count — the predicate is corrected, not softened (D-20)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#parity: two roots carrying the same {by, kind} multiset per role but different `at` stamps and bodies project to an EMPTY diff list"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#kind multiset: the same roots with one note's kind changed on one side name that role and `kind multiset differs`"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#note route is derived from tool-use blocks only: the fixture's counts match an independent grep, and an in-memory Write/Edit under the context root moves the count by exactly one"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#outcome wiring: deriveOutcome reads parity and provenance; hang wins over everything"
        status: pass
    human_judgment: false
  - id: D2
    description: "The scored transcript lives in a runner-owned scratch outside every target and the cwd; a planted in-target forged deny frame is never read; the run seam exists"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#isOutsideTargets decides containment on relative(), not on a string prefix: a sibling scratch is outside, an in-target path and a nested scratch are not"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#run seam: runTarget hands the platform a transcript path outside build.target, outside the cwd, inside build.transcriptDir, and reports that same path"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#the attack is blind: a forged in-target 33-CAPTURE-A.jsonl carrying a system/hook_response prod-deploy deny frame is never read — the D-04 row reads no and denyObservedInStream is false"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-05 provenance by name, validated cache path, content digest, three-state verdict; pass unreachable unless MET"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#wrong-entry fixture: with context7 at index 0 and grugops second, pluginUnderTest returns the grugops entry; an unlisted name is null"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#cache path validation (WR-04): the realpath of an existing directory under the cache root is accepted; outside, a regular file, a missing path, a dash-prefixed value and a link that leaves the root are refused"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#content digest is two-sided and order-independent: equal trees digest equal; one changed byte, or one missing file, digests differ"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#verdict and outcome: equal digests are MET, differing digests are UNMET naming both, a null installed digest is UNKNOWN - verify, and an outcome of pass is unreachable unless MET"
        status: pass
      - kind: other
        ref: "offline self-repro against the real cache copy ~/.claude/plugins/cache/grugops/grugops/2.1.0: UNMET vs current HEAD (2432 tracked), MET vs a detached checkout at 8f05ed42 (2411 tracked)"
        status: pass
    human_judgment: false
  - id: D4
    description: "`capture-live --dry-run` exits 0 over the new schema at zero tokens: GO-READINESS line, one OUTCOME: no-go, parity + provenance + transcript-location rows present, artifacts re-check, committed .js rebuilt and parity-checked"
    requirement: CAP-01
    verification:
      - kind: integration
        ref: "scripts/capture-live.test.ts#exits 0, prints GO-READINESS and the completion wording, writes exactly one outcome line reading no-go, and its artifacts re-check"
        status: pass
      - kind: other
        ref: "npm run build && npm run check:build-parity — ALL CHECKS PASSED after each GREEN commit"
        status: pass
    human_judgment: false

# Metrics
duration: 25 min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 12: The round-2 tracer — CR-03, CR-01, CR-02 landed red-first in the runner and proven against the held capture Summary

**The D-07 verdict is now a path-invariant projection two live sessions can meet (and the held round-1 capture still fails it by name), the scored transcript is unreachable from the subject's grants, and a `pass` cannot be reported over a plugin that is not the checkout by content.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-20T20:06:12Z
- **Completed:** 2026-09-20T20:31:26Z
- **Tasks:** 3 (each RED → GREEN, 6 commits)
- **Files modified:** 3 (`scripts/capture-live.ts`, its committed `.js`, `scripts/capture-live.test.ts`)

## Accomplishments

- **CR-03 (Task 1, tracer):** `projectLivePath` / `compareLivePaths` / `deriveOutcome` replace the comparator that asserted byte-identical model prose. Over commit `c7be6d0d` the projection returns exactly the six divergences the plan names (`brownfield-mapper: note count differs: path A has 5, path B has 3`; `architect-design … 4 / 3`; `security-nfr … 4 / 3`; `orchestrator: present only in path A (2 note(s))`; `note route: direct writes into the context root differ: path A 0, path B 9`; `note route: propose_note tool-use blocks differ: path A 3, path B 0`) and no verdict-marker entry; two synthetic roots differing only in `at` and body project to `[]`. The replay comparator is kept as an informational section and no longer sets `anyFailure`.
- **CR-01 (Task 2):** `TargetBuild.transcriptDir` is a sibling `mkdtemp`; `runTarget` refuses to spawn unless `isOutsideTargets(transcriptPath, [target, home, cwd])`; the planted-file test proves a forged in-target `33-CAPTURE-A.jsonl` carrying a real prod-deploy deny frame is never read (D-04 row `no`, `denyObservedInStream` false). The `LiveOps` / `LIVE_OPS` seam exists for plan 33-13.
- **CR-02 + WR-04 (Task 3):** the plugin is selected by name from `system/init.plugins[]`, its path validated under `~/.claude/plugins` (dash-prefix, realpath, directory, strict containment, symlink escape refused), and a sha256 `contentDigest` over the checkout's `git ls-files` set is compared between the cache copy and the checkout. `deriveOutcome({ …, provenance: provenance.state })` makes `pass` unreachable unless MET. `installedPluginSha` and the `git -C <transcript path>` call are gone.
- **IN-01 folded:** `toPosix` imported from `./posix-path.js`; the local one-liner is gone (`split(sep).join("/")` count 0).
- The dry run exits 0 over the new schema; the full excluded suite is green (78 files, 5354 passed, 2 pre-existing skips); `check:build-parity`, `check:nul-bytes`, `tsc --noEmit` and the test typecheck all pass.

## Task Commits

Each task was RED-committed before its GREEN:

1. **Task 1: path-invariant D-07 projection (CR-03)** — RED `0135afcc` (test) → GREEN `99a40da7` (feat)
2. **Task 2: runner-owned transcript location + run seam (CR-01)** — RED `76e792fb` (test) → GREEN `2172b61c` (feat)
3. **Task 3: provenance by name, by content, in the outcome (CR-02, WR-04)** — RED `db36aa2e` (test) → GREEN `c4abf909` (feat)

**Plan metadata:** see the final `docs(33-12)` commit.

### RED evidence (quoted from the red runs; each record classified `RED_EVIDENCE_OK` / `target_test_failed` by `gsd-tools check tdd-red-evidence`)

Task 1 RED (exit 1, 31 tests, 25 pass, 6 fail):
- `held capture (commit c7be6d0d): the projection still names the round-1 divergences by role, route and count — the predicate is corrected, not softened (D-20)` — `TypeError: projectLivePath is not a function` (the premise assertions 15 / 9 / 2079 / 1924 and the independent propose_note counts 3 / 0 passed first)
- `parity: two roots carrying the same {by, kind} multiset per role but different at stamps and bodies project to an EMPTY diff list` — `projectLivePath is not a function`
- `kind multiset: the same roots with one note's kind changed on one side name that role and kind multiset differs` — `projectLivePath is not a function`
- `note route is derived from tool-use blocks only: …` — `noteRoute is not a function`
- `outcome wiring: deriveOutcome reads parity and provenance; hang wins over everything` — `deriveOutcome is not a function`
- `exits 0, prints GO-READINESS … its artifacts re-check` — `expected '# grugops live-capture report — DRY R…' to contain '## Dual-path parity (D-07) — path-invariant projection'`

Task 2 RED (exit 1, 35 tests, 30 pass, 5 fail):
- `isOutsideTargets decides containment on relative(), not on a string prefix: …` — `isOutsideTargets is not a function`
- `run seam: runTarget hands the platform a transcript path outside build.target, outside the cwd, inside build.transcriptDir, and reports that same path` — `runTarget is not a function`
- `the attack is blind: a forged in-target 33-CAPTURE-A.jsonl carrying a system/hook_response prod-deploy deny frame is never read — the D-04 row reads no and denyObservedInStream is false` — `runTarget is not a function`
- `the real LIVE_OPS seam is bound to functions, and the in-target transcript location is gone from the source` — `Cannot read properties of undefined (reading 'runPlatform')`
- the dry-run case — `expected … to contain '| run A transcript location | runner-owned scratch …'`

Task 3 RED (exit 1, 40 tests, 34 pass, 6 fail):
- `wrong-entry fixture: with context7 at index 0 and grugops second, pluginUnderTest returns the grugops entry; an unlisted name is null` — `pluginUnderTest is not a function`
- `cache path validation (WR-04): …` — `pluginCachePathAccepted is not a function`
- `content digest is two-sided and order-independent: …` — `contentDigest is not a function`
- `verdict and outcome: equal digests are MET, differing digests are UNMET naming both, …` — `provenanceVerdict is not a function`
- `the runner reads no index-zero plugin entry and runs no git inside a transcript-named path` — `expected true to be false` (the source still read `loaded[0]`)
- the dry-run case — `expected … to match /\| installed plugin provenance \(D-05…/`

### Lines the plan asked to be quoted

- Outcome wiring (`scripts/capture-live.ts`, `capture()`):
  `const outcome: ReportModel["outcome"] = deriveOutcome({ hang, anyFailure, parityDiffs, provenance: provenance.state });`
- `grep -n 'diffs.length > 0) anyFailure' scripts/capture-live.ts` → no output.
- `grep -a -c 'rev-parse' scripts/capture-live.ts` → `3` (HEAD, the remote ref, `checkoutSha`); `grep -a -c 'loaded\[0\]'` → `0`; `installedPluginSha` → `0`.
- `LIVE_ALLOWED_TOOLS`, identical (`diff` empty) at HEAD and at `722d5fd6`:
  `"Agent", "Read", "Grep", "Glob", "Edit", "Write", "Bash(node *)", "Bash(helm upgrade *)", "mcp__grugops__propose_note"`
- `scripts/check-foundation-guards.test.ts`: `NON_TEST_MODULE_COUNT = 89`, `TRIPWIRE_MODULES = 72` unchanged; that file's 300 cases pass after Task 1.

## Files Created/Modified

- `scripts/capture-live.ts` — new exports `RoleNotes`, `NoteRoute`, `PathProjection`, `noteRoute`, `projectLivePath`, `compareLivePaths`, `deriveOutcome`, `PARITY_SECTION_HEADING`, `REPLAY_SECTION_HEADING`, `PARITY_EQUAL_LINE`, `isOutsideTargets`, `LiveOps`, `LIVE_OPS`, `RunSpec`, `TargetRun`, `runTarget`, `pluginUnderTest`, `pluginCachePathAccepted`, `contentDigest`, `ProvenanceState`, `provenanceVerdict`, `ProvenanceReport`; `TargetBuild.transcriptDir`; `RunReport.transcriptLocation`; `ReportModel.parity` / `.provenance` (replacing `installedPluginSha`); header hard rule 5 names CR-01; the D-05 paragraph and the T-33-02 sentence rewritten; `toPosix` imported (IN-01)
- `scripts/capture-live.js` — rebuilt in each GREEN commit; `check:build-parity` green
- `scripts/capture-live.test.ts` — helpers `heldCapture`, `stampsFromSummary`, `proposeNoteBlocksInText`, `toolUseFrame`, `handBuiltTarget`, `recordingOps`, `initFrameWithPlugins`, `treeWith`; `contextRootWithNotes` gains an `hour` parameter; Tests A–L plus the source pins and the extended dry-run case (40 cases in the file, up from 26)

## Decisions Made

- **The predicate was corrected, not softened (D-20).** The held capture is pinned as divergent by six verbatim sentences over the immutable commit; the parity case proves the predicate is meetable. `scripts/dual-path-equivalence.ts` is untouched — it still serves `convergence-spine.test.ts` and `check-uat-oracles.ts`.
- **`isOutsideTargets` treats a path equal to a root as inside** (fail closed), one notch stricter than the plan's wording; `pluginCachePathAccepted` therefore also refuses the cache root itself as a plugin directory. Test F's cases all hold; a name-extending lookalike sibling is added as the string-prefix trap.
- **Provenance is derived once** (`deriveProvenance`) for the live run and the dry run; over the fixture it is `UNKNOWN - verify` with the refusal named, and the dry-run outcome stays `no-go`.
- **The Task 3 source pin counts `rev-parse` per line**, the plan's own `grep -c` instrument (the `checkoutSha` line carries the word twice).

## Deviations from Plan

None — plan executed as written. Two small clarifications, recorded rather than deviations: `ProvenanceState` was introduced in Task 3 exactly as planned (Task 1 typed `deriveOutcome`'s argument as `PreconditionState` in the interim); the parity table is preceded by a `Run A:` / `Run B:` label line so the two per-run tables are distinguishable under the one heading the flip manifest cites.

## Issues Encountered

- `npm run check:build-parity` reads "moved" while a rebuilt `.js` is uncommitted — expected; it passed immediately after each GREEN commit landed the `.ts`/`.js` pair together.
- The `.planning/STATE.md` working-tree edit present at dispatch (the orchestrator's `EXECUTING` position update) is swept into this plan's docs commit alongside the state updates below.

## Offline self-repro (zero tokens, no `claude` invocation)

Against the real plugin-cache copy the round-1 run installed (`~/.claude/plugins/cache/grugops/grugops/2.1.0`, no `.git`): `pluginCachePathAccepted` accepts it; `provenanceVerdict` reads **UNMET** against the current HEAD (2432 tracked files, the tree has moved) and **MET** against a temporary detached worktree at `8f05ed42` (2411 tracked files — the count 33-DIAGNOSIS § 4.2 measured). Both arms are reachable on real data; the worktree was removed afterwards.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-13 (CR-04 keep-on-failure, CR-05 install-failure refusal) can build on `runTarget` / `LiveOps` without touching the derivation.
- Plan 33-21's go is now worth spending: the predicate can be met, the channel cannot be written by the subject, and a `pass` cannot be reported over the wrong plugin. Whether the round-2 capture meets parity is still an observation, not a claim (CAP-01 / CAP-03 remain edge rows; CAP-02 is untouched by this plan).
- KIT decision still open for the human at 33-21: `LIVE_ALLOWED_TOOLS` keeps `Write`/`Edit` (33-DIAGNOSIS § 1.3 (ii)).

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 3 modified files present on disk; 6 task commits present in history; `commits: 6` measured from ledger `c2b2ba244f73b6048e5e980305c60ced8781aeda`.
