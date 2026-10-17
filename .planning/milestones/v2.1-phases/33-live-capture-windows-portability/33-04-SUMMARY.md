---
phase: 33-live-capture-windows-portability
plan: 04
subsystem: testing
tags: [windows, path-separator, posix, cap-02, test-internal, census, signalled-child, sigint, tmpdir, golden, vitest]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-03's `scripts/posix-path.ts` (`toPosix` / `toPosixWith`) and its written published-vs-test-internal partition; 33-02's 180 s / 120 s vitest bounds and its compiler-boundary lesson (compare a file by identity, never by a host-spelled string)
  - phase: 32.1-board-dashboard-deferred-residuals
    provides: the tracked-TypeScript census (`SCANNED` vs `git ls-files`), the DASH-04 `withLinkedTree` harness, the golden projection and the ownership mutation mirror this plan re-spells
provides:
  - "`scripts/validate.test.ts`: the walked side of the tracked-TypeScript census is formed by `scannedName(absolute, scriptsDir, separator?)` through 33-03's normalizer; `TRACKED` derived once beside `SCANNED`; a per-side vacuity floor that names the empty side; both-direction comparison; the nested (26-file) class counted on both sides; a backslash-driven mutation case"
  - "`scripts/board-watch.test.ts`, `scripts/check-uat-oracles.test.ts`: `armedRel` (the measured carrier of six windows reds), the `/plans` suffix premise and the oracle test's walked `where` path all compared in one spelling through `toPosix`"
  - "`scripts/board-tracer.test.ts`, `scripts/board-dashboard.test.ts`: the absent-tree fixtures are constructed under `realpath(tmpdir())` and asserted by the whole path — no POSIX-absolute literal remains"
  - "`expectEndedBySigint(code, signal)` at the three SIGINT child sites: exit 0 with no signal OR a null code carrying the SIGINT the test sent; the observed pair is printed; both arms and the third outcome are cases; no host branch"
  - "`scripts/generate-guarantees.test.ts`: the dead temp root is planted as `TMPDIR`, `TMP` and `TEMP` together with the absence asserted as a premise (the windows `+0 not to be +0` was a plain zero from an unread `TMPDIR`, not a signed zero)"
  - "`scripts/board-model.test.ts`: `projectLocations(text, separator?)` re-spells the location token after `<fixture-root>` in the golden projection; `sameSource(compilerName, hostName, separator?)` is the mutation mirror's file-name equality — both windows mechanisms read from the CI log, both mutation-proven here"
affects: [33-09 pushed CI run, 33-06 install suite (deferred TMPDIR site), 33-05]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 8265
  tasks: 3
  commits: 4
plan_head_before: 475190f797d63cc8e724d8fe4ac2bd00a9d14462

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A test-internal path comparison is normalized AT THE COMPARISON, in the test, through the one normalizer — never by a second one-liner, and never at a published site 33-03 left host-spelled"
    - "Every re-spelled predicate takes its separator as a parameter defaulted to the host's, so the windows spelling is a case on a POSIX host and deleting the normalization reds it here"
    - "A widened child-exit expectation names exactly its two legitimate arms, prints the observed (code, signal) pair, and is itself a both-directions case — a third outcome is a failure, not an acceptance"
    - "Read the platform's own source before calling a red a signed zero: vitest spells 0 as +0; os.tmpdir() on win32 never reads TMPDIR"

key-files:
  created: []
  modified:
    - scripts/validate.test.ts
    - scripts/board-watch.test.ts
    - scripts/check-uat-oracles.test.ts
    - scripts/board-tracer.test.ts
    - scripts/board-dashboard.test.ts
    - scripts/board-model.test.ts
    - scripts/generate-guarantees.test.ts
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "validate.test.ts's compiler-spelling helper `posix` is bound to `toPosixWith(p, win32.sep)` rather than kept as a second one-liner: the file now defines the normalizer zero times, and the six remaining inline `split(\"\\\\\").join(\"/\")` expressions are compiler-vs-join comparisons, not walk-vs-git, and not definitions"
  - "The two five-second cut-offs in validate.test.ts (:2842 planted-reader loop, :2281 import-split census) are DURATION defects, not downstream of the census spelling: measured 3367 ms and 1612 ms here, the ubuntu leg (no separator issue) also cut :2842, and both open every file whichever way the name is spelled; 33-02's 180 s bound governs them"
  - "The guarantees `+0 not to be +0` is NOT a signed-zero comparison — vitest prints a plain 0 as `+0` and -0 as `-0` (measured); the windows cause is `os.tmpdir()` reading TEMP/TMP and never TMPDIR, so the fix plants all three and keeps a strict numeric inequality; the plan's signed-zero premise is recorded as disproven"
  - "board-model.test.ts WAS changed although green here: the plan's 'change nothing if green' was conditioned on the reds being downstream of 33-03, and the windows log shows they are not — both are test-internal separator comparisons (the golden projection's location token; the mirror's `fileName === target`), exactly this plan's class"
  - "The golden's `<fixture-root>` location token is re-spelled in the TEST's projection, not in board-read: absolute locations stay host-spelled at the publishing site (33-03's line), and the golden was already a host-independent projection (root and instants substituted)"
  - "`install/install.test.ts:2632` (`tmpdir: status=0` vs `status=3`) is the same TMPDIR class, not a signalled child; it is plan 33-06's file, so it is recorded in deferred-items with the diagnosis rather than edited here"

patterns-established:
  - "Vacuity floor per side, by name: an empty denominator is refused naming which side emptied; a silently short side is caught by comparing the two derivations in BOTH directions, with each count read from the derived array before the loop that consumes it"
  - "Windows mechanism from the CI log, not from the class name: `gh run view --job <id> --log-failed` gave the exact assertion text for every site this plan touched"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The tracked-TypeScript census compares the walked side and the git side in one spelling through 33-03's normalizer, with a per-side vacuity floor, both directions, the nested class counted on both sides, and a backslash-driven mutation case; coverage is not loosened"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts (141 passed; RED against the identity body: 1 failed — expected e2e/uat-live.test.ts, received e2e\\uat-live.test.ts)"
        status: pass
      - kind: unit
        ref: "planted reader at scripts/e2e/planted-33-04/plant-a.ts: 3 failed (census converse names it; nested 27 vs 26; verdict second-authority); walk blind to uat-live.test.ts: 2 failed (a tracked TypeScript file the census never opened: ['e2e/uat-live.test.ts'])"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts -t planted (1 passed, no 'No test files found')"
        status: pass
    human_judgment: false
  - id: D2
    description: "The remaining test-internal comparisons (armedRel, the /plans premise, the oracle walk) use the normalizer, and the absent-tree fixtures are constructed under the host's temp root; the live watcher is untouched and unconditional"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts scripts/check-uat-oracles.test.ts scripts/board-tracer.test.ts scripts/board-dashboard.test.ts (235 passed); windows spelling fed in without the normalizer: 8 failed with the CI's exact text ('.grugops\\context' vs '.grugops/context'); through toPosixWith(…, win32.sep): 73/73"
        status: pass
      - kind: unit
        ref: "scripts/board-watch-live.test.ts (6 passed, unmodified: git diff --quiet)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each signalled-child assertion names its two arms and prints the observed pair; the guarantees temp root is planted on every host; no host branch introduced"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts scripts/board-watch.test.ts scripts/board-model.test.ts scripts/generate-guarantees.test.ts (374 passed); expectEndedBySigint cases: (0,null) and (null,SIGINT) pass; (1,null), (null,SIGKILL), (0,SIGINT) throw naming the pair"
        status: pass
      - kind: other
        ref: "grep -c 'process\\.platform' on the four files: 0/0/0/0 before, 0/0/0/0 after"
        status: pass
    human_judgment: false
  - id: D4
    description: "The board-model golden projection and mutation-mirror equality spell both sides one way, parameterized by separator"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts -t 33-04 (2 passed); identity bodies substituted: 2 failed — expected '<fixture-root>\\.grugops\\queue\\claimed…' to be '<fixture-root>/.grugops/queue/claimed…'; expected false to be true"
        status: pass
    human_judgment: false
  - id: D5
    description: "The windows leg's board-watch (8), board-dashboard (3), board-model (8), validate (1 census), check-uat-oracles (1), board-tracer (1) and generate-guarantees (1) reds are closed on windows-latest itself"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Not measurable on this host: each mechanism was reproduced here by handing the predicate the windows separator (or read from node's own os.tmpdir source), and every fix is a POSIX no-op by construction; the windows outcome is read from the pushed CI run plan 33-09 makes"

# Metrics
duration: 27min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 04: Test-Internal Path Comparisons and Signal-Aware Child Assertions Summary

**Every test-internal path comparison this phase measured now renders one spelling through 33-03's normalizer — the 26-file tracked-TypeScript census, the watcher's armed-directory list, the oracle walk, the golden projection and the mutation mirror — each parameterized by separator and mutation-proven on this POSIX host; the three SIGINT child sites assert "exited 0 OR terminated by the SIGINT this test sent" and print what they saw; the guarantees red was a plain zero from a `TMPDIR` windows never reads, not a signed zero; and no published byte and no `process.platform` branch moved.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-09-20T00:34:01Z
- **Completed:** 2026-09-20T01:01:41Z
- **Tasks:** 3
- **Files modified:** 7 test files + deferred-items.md

## Accomplishments

- `scripts/validate.test.ts`: the walked side's relative name is formed once by `scannedName(absolute, scriptsDir, separator?)` = `toPosixWith(absolute.slice(scriptsDir.length + 1), separator)`; `TRACKED` is derived once beside `SCANNED`; the census case floors each side by name, compares in both directions, and a new case counts the nested class on both sides (26 = 26, the RESEARCH Class A number); the mutation case drives `win32.join` shapes through `win32.sep` and asserts the `/` form. The file's compiler-spelling helper `posix` is bound to the same normalizer, so this file defines the one-liner zero times.
- `scripts/board-watch.test.ts` / `scripts/check-uat-oracles.test.ts`: `armedRel`, the `/plans` suffix premise and the oracle test's `where` path go through `toPosix`. Fed the windows spelling on this host, 8 cases red with the CI's exact assertion text; through the normalizer with `win32.sep`, 73/73.
- `scripts/board-tracer.test.ts` / `scripts/board-dashboard.test.ts`: `/no/such/path` and the `no/such/tree` fragment are gone; both absent-tree fixtures are `join(realpathSync(tmpdir()), "grugops-…-33-04")` and the refusal is asserted to contain the whole path.
- `expectEndedBySigint(code, signal)` at the three SIGINT sites, with both-arm cases and the third-outcome case in each file.
- `scripts/generate-guarantees.test.ts`: the dead temp root is planted as `TMPDIR`, `TMP` and `TEMP`, its absence is a premise, and the inequality is `r.status !== 0` with the status printed.
- `scripts/board-model.test.ts`: `projectLocations` re-spells the `<fixture-root>` location token in the golden projection; `sameSource` is the mirror's file-name equality; each has a windows-separator case that reds on an identity body.
- Full regression lane on the final tree: 78 files, **5334 passed, 2 skipped, 0 failed**, 481.22 s, exit 0 (5326 → 5334: the 8 new cases). Zero `Test timed out` lines; the deferred DASH-04 case green on this run. `npm run typecheck` exit 0 on all three targets; `check:nul-bytes` and `check-platform-shapes` ALL CHECKS PASSED; no committed `.js` changed (`git diff --stat 475190f7..HEAD -- '*.js'` empty).

## Task Commits

1. **Task 1: the tracked-TypeScript census** - `bd011734` (test, RED with identity plumbing) → `776c1e07` (feat, GREEN)
2. **Task 2: the remaining test-internal path comparisons** - `4be30638` (fix)
3. **Task 3: a terminated child is asserted as terminated** - `443be07e` (fix)

**Plan metadata:** see the docs commit that carries this SUMMARY.

## Task 1 — the census, what was found, and the reproductions

**Walk-vs-git comparisons in this file: 2.** (1) `SCANNED` (readdirSync, host-joined) vs `git ls-files 'scripts/*.ts'` at the census case — unnormalized, changed. (2) CASE 1 (`walkedScriptSources` vs `trackedScriptSources`, both from `scripts/ts-symbols.test-support.ts`) — already normalized inside the support module (`.split("\\").join("/")` at its line 218), untouched. Six inline `split("\\").join("/")` expressions remain at lines 863, 1055, 3362, 3364, 3386, 3391: compiler-`fileName`-vs-`join` comparisons and `governanceConfigCandidates` comparisons, not walk-vs-git, and not definitions.

**RED** (`bd011734`, identity body): `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` exit 1, **1 failed / 140 passed** (141). Target case `a nested entry the host joins with a BACKSLASH renders in git's spelling — the mutation case`: expected `"e2e/uat-live.test.ts"`, received `"e2e\uat-live.test.ts"`. **GREEN** (`776c1e07`): 141/141, 0 timed-out lines. (`gsd_run check tdd-red-evidence` parses node:test TAP, not vitest; `tdd_mode` is off; the record is kept here.)

**Coverage is not loosened — two reproductions:**
- *A second reader planted in a subdirectory* (`scripts/e2e/planted-33-04/plant-a.ts`, untracked, plant A's source): **3 failed** — the census converse names it in git's spelling (`a .ts the walk opened that git never named … expected [ 'e2e/planted-33-04/plant-a.ts' ] to deeply equal []`), the nested count reads `nested walked 27 vs nested tracked 26`, and the no-plant verdict reads `expected 'second-authority' to be 'exactly-one-authority'`. Removed afterwards; tree clean.
- *A walk blind to one nested tracked source* (`e.name !== "uat-live.test.ts"` filter, uncommitted): **2 failed** — `a tracked TypeScript file the census never opened: expected [ 'e2e/uat-live.test.ts' ] to deeply equal []` and `nested walked 25 vs nested tracked 26`. Restored.
- `-t "planted"`: 1 passed, no `No test files found`.

**The two five-second cut-offs are separate defects, not downstream of the census.** `:2842` (`EVERY planted second reader …`) ran 3367 ms and `:2281` (`no scanning file reaches the key spellings through an IMPORT …`) 1612 ms on this host — near the old 5 s default, over it on a slower runner. Neither depends on how a name is spelled: `LIVE_ROWS` opens every file with `readFileSync(join(SCRIPTS_DIR, name))`, which accepts either spelling, so the census runs over the same 154 files on windows; and the ubuntu leg, where there is no separator issue, also cut `:2842`. 33-02's `testTimeout: 180_000` is the closure; nothing here changes their duration.

## Task 2 — each site beside the 33-03 partition

| Site | What it compares | 33-03 partition entry | Published? |
|---|---|---|---|
| `board-watch.test.ts` `armedRel: armed.map((d) => relative(realTree, d))` | a test-side `relative()` vs POSIX literals (`ALL_SIX`) | 33-03 § census, board-dashboard row: "the DASH-04 `withLinkedTree` describe (whose carrier is the test-internal `armedRel … relative(realTree, d)` line, plan 33-04's)" and the Totals line | no — the dashboard publishes `rel` from `WATCH_DIRS`, POSIX by construction |
| `board-watch.test.ts` `refused.some((e) => e.path.endsWith("/plans"))` | a published absolute LOCATION's suffix vs a `/` literal | 33-03 § "On absolute locations": locations stay host-spelled, not rewritten | the location is published host-spelled; the SUFFIX comparison is test-internal, so `toPosix(e.path)` normalizes the comparison, not the site |
| `check-uat-oracles.test.ts` `where: \`${file.slice(ROOT.length + 1)}:${n + 1}\`` | a walked path vs `SANCTIONED_PURE_LOOKAHEAD.file = "scripts/compactor.test.ts"` | 33-03 Totals line: "`check-uat-oracles.test.ts` … is plan 33-04's subject" | no — `where` never leaves the test |
| `board-tracer.test.ts` `"/no/such/path"` | a POSIX-absolute literal a windows host resolves onto a drive | 33-03 Totals line: "`board-tracer` / `board-dashboard` `no/such/tree` literals" | fixture, not a comparison of a published spelling |
| `board-dashboard.test.ts` `join(ROOT, "no", "such", "tree")` + `toContain("no/such/tree")` | a host-`join`ed path vs a `/` fragment | same | same |

**No site appears in both lists.** 33-03's changed-published set is `check-kit-refs` (`relKey`, `derive`, two prefixes, the partition line) and `check-banned-claims` (`scanKey` accumulation, the budget message); none of the five sites above is in it, and none of the five files defines its own normalizer (`grep` for `split(sep).join("/")` and `split("\\").join("/")` over the four files: 0).

**Mechanism reproduced here.** With `armedRel` and `where` spelled the windows way and no normalizer: **8 failed / 65 passed** (73) — the seven `withLinkedTree` cases with the CI's exact text `expected [ '.grugops\context', …(5) ] to deeply equal [ '.grugops/context', …(5) ]`, plus the oracle's closed-class case. Through `toPosixWith(…, "\\")`: 73/73. Final: 235/235 across the four files; `board-watch-live.test.ts` 6/6, `git diff --quiet` on it holds (D-16).

## Task 3 — the signalled child, the temp root, and the two board-model mechanisms

**Pre-task `process.platform` counts:** board-dashboard 0, board-watch 0, board-model 0, generate-guarantees 0. **Post-task:** 0, 0, 0, 0.

**The three SIGINT sites** (`board-watch.test.ts` D-18 child case; `board-dashboard.test.ts` DASH-05 STALE case and the NDJSON case) each read `(code, signal)` from `close` and call `expectEndedBySigint`, whose disjunction is `(code === 0 && signal === null) || (code === null && signal === "SIGINT")` with message `observed {"code":…,"signal":…}`. On a host that delivers the signal the dashboard's handler exits 0; where node ends the child forcefully (win32), `close` carries `null` and names `SIGINT` — the measured `expected null to be +0`. Cases in both files: `(0, null)` and `(null, "SIGINT")` pass; `(1, null)`, `(null, "SIGKILL")` and `(0, "SIGINT")` throw naming the pair.

**The guarantees red is not a signed zero.** Measured with a two-line vitest file: `expect(0).not.toBe(0)` prints `expected +0 not to be +0`; `expect(-0).toBe(0)` prints `expected -0 to be +0`. So the windows `+0 not to be +0` is a plain exit 0 where non-zero was expected. Cause, from node's own `os.tmpdir` source: on win32 it reads `TEMP`, then `TMP`, then `SystemRoot\temp` — `TMPDIR` is never consulted — so `runFreshness({ TMPDIR: dead })` planted nothing there, the mirror landed in the real temp directory and the gate reported fresh. Fix: plant `TMPDIR`, `TMP` and `TEMP` together, assert `existsSync(dead) === false` as the premise, and compare with `r.status !== 0` (strict numeric, under which -0 and 0 are one value; `not.toBe(0)` is `Object.is`, under which a hypothetical -0 would read as "not zero" and pass the arm vacuously). Producers named in the comment: `spawnSync` and `runFreshness`'s `r.status ?? -1`, neither of which emits -0. Not discriminable on this host (POSIX honours `TMPDIR`); the windows outcome is 33-09's.

**board-model: NOT downstream of 33-03, and changed.** Green here at HEAD before any edit (33-03 left board-model untouched; it imports nothing from `node:path`). The windows job log (`gh run view --job 105759397857 --log-failed`, run 35394268365) gives the mechanisms:
- *Golden, 2 cases* (`renders … byte for byte`, `reads ok for every source`): `first difference at line 75 — rendered: "message": "<fixture-root>\\.grugops\\queue\\claimed\\abc-105-tampered\\claim.md carries 2 at: lines…" — golden: "<fixture-root>/.grugops/queue/…"`. A published absolute location, host-spelled by 33-03's rule, inside the test's projection. `projectLocations(text, separator?)` re-spells only the `LOCATION_TOKEN` (`/<fixture-root>[^\s\`"']*/g`) after the placeholder; the module is untouched.
- *Mirror, 6 cases* (`a seeded tag removal in … moves the …` ×3, `the equality REDS on … naming the …` ×3): `expected 86 not to be 86` and `expected +0 to be 1` — the mirror returned the live census because `if (fileName === target)` compared the compiler's `/`-spelled name against a host-`join`ed `target`, and on windows the mutation never applied. `sameSource(compilerName, hostName, separator?)` normalizes both sides. This is 33-02's compiler-boundary lesson one register over.
- Both predicates take the separator as a parameter; `-t "33-04"` cases pass (2/2) and, with identity bodies substituted, **2 failed** (`expected '<fixture-root>\.grugops\queue\claimed…' to be '<fixture-root>/.grugops/queue/claimed…'`; `expected false to be true`). Restored; 374/374 across the four files.

## Files Created/Modified

- `scripts/validate.test.ts` - `scannedName`, `TRACKED`, the floored both-direction census, the nested-class case, the mutation case, `posix` bound to the authority, `toPosixWith` + `win32` imports
- `scripts/board-watch.test.ts` - `toPosix` on `armedRel` and the `/plans` premise; `expectEndedBySigint` + its cases; the D-18 child case reads `(code, signal)`
- `scripts/check-uat-oracles.test.ts` - `toPosix` on `where`
- `scripts/board-tracer.test.ts` - constructed absent-tree fixture
- `scripts/board-dashboard.test.ts` - constructed absent-tree fixture; `expectEndedBySigint` + its cases at the two SIGINT sites
- `scripts/board-model.test.ts` - `LOCATION_TOKEN`, `projectLocations`, `sameSource`, two `33-04` describes
- `scripts/generate-guarantees.test.ts` - the three-variable temp-root plant with premise and strict inequality
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - the `install/install.test.ts:2632` TMPDIR entry

## Decisions Made

See `key-decisions` in the frontmatter. The reviewable ones: board-model.test.ts was edited despite the plan's "change nothing if green", because the condition attached to that instruction (downstream of 33-03) was measured false and the actual mechanisms are this plan's class; and the golden projection, not board-read, is where the location token is re-spelled.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The guarantees comparison was not a signed-zero comparison; the actual cause was fixed**
- **Found during:** Task 3 (reading the case and measuring vitest's spelling of zero)
- **Issue:** the plan asked for "a strict numeric equality that treats the two zeros as equal" and a comment naming the signed-zero producer. There is no signed zero: vitest prints 0 as `+0`. Applying only the plan's edit would have left the windows red in place (a plain 0 is still 0 under any equality).
- **Fix:** `TMPDIR`, `TMP` and `TEMP` all set to the dead root; absence asserted as a premise; the strict inequality kept as asked, with the comment recording that no producer emits -0 and why the windows status was 0.
- **Files modified:** scripts/generate-guarantees.test.ts
- **Verification:** the case passes here; the mechanism is read from node's `os.tmpdir` source; windows outcome is 33-09's
- **Committed in:** 443be07e

**2. [Rule 1 - Bug] board-model.test.ts edited although green on this host**
- **Found during:** Task 3 (the plan: re-run against landed 33-03; if green, change nothing)
- **Issue:** green here proves only that 33-03 did not cause the reds. The windows log shows two test-internal separator comparisons — the class this plan exists to close — that would survive to 33-09's run untouched.
- **Fix:** `projectLocations` and `sameSource`, both separator-parameterized, both with a windows case red on an identity body.
- **Files modified:** scripts/board-model.test.ts
- **Verification:** 181/181 in the file; `-t 33-04` 2/2, mutation 2 failed
- **Committed in:** 443be07e

**3. [Rule 2 - Missing critical] The widened child assertion and the two board-model predicates got their own both-direction cases**
- **Found during:** Task 3
- **Issue:** a widened expectation nobody has watched refuse is the failure mode this repository keeps recording; the plan asked that each assertion name both arms and print the pair but did not ask for a case proving it does.
- **Fix:** `expectEndedBySigint` cases in both files (2 pass, 3 throw naming the pair); the `33-04` describes in board-model.
- **Files modified:** scripts/board-watch.test.ts, scripts/board-dashboard.test.ts, scripts/board-model.test.ts
- **Verification:** 374/374; identity-body mutations red
- **Committed in:** 443be07e

### Plan premises corrected by measurement

- RESEARCH's "genuine exit-code class … plus `expected 'tmpdir: status=0' to be 'tmpdir: status=3'`": that site (`install/install.test.ts:2632`) is not a signalled child; it is the TMPDIR class above. Not in this plan's files (plan 33-06's); recorded in deferred-items with the diagnosis.
- The plan's Task 2 wording "the POSIX-absolute literals a Windows host resolves onto the current drive" fits `board-tracer` (`"/no/such/path"`); the `board-dashboard` site was a host-`join`ed path asserted against a `/` fragment — the same class, the same constructed-fixture fix.

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical), 0 blocking; 2 premises corrected.
**Impact on plan:** every `<done>` and acceptance criterion holds; the diff exceeds the plan's expectation by the board-model closures and the proving cases, all inside the plan's file list.

## Issues Encountered

- A first mutation stub for the board-model predicates dereferenced an undefined separator and crashed at collection — an INVALID mutation (a crash, not an assertion). Redone with clean identity bodies; the transcript above is from the redo.
- `git checkout --` during the Task 2 mutation check restored the two files to HEAD and discarded the intended edits; they were re-applied from the same script and re-verified before the commit.
- `gsd_run check tdd-red-evidence` reads node:test TAP, not vitest; the RED record is kept in this summary.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-18 (spelling only; the planted reader still reds, transcript above), T-33-19 (two named arms, pair printed, no host branch, cases in both directions), T-33-20 (the partition table above; no site in both lists), T-33-21 (the per-side floor; the both-direction comparison for the silently short side), T-33-22 (no package installed) are as the register states.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-09's pushed run is the windows measurement for D5: the numbers to watch are `board-watch.test.ts` (8 → 0), `board-model.test.ts` (8 → 0), `board-dashboard.test.ts` (3 → 0), `validate.test.ts` (the census red → 0; the two timeouts are 33-02's), `check-uat-oracles.test.ts`, `board-tracer.test.ts` and `generate-guarantees.test.ts` (1 → 0 each).
- Plan 33-06 (or the gap round after 33-09) owns the `install/install.test.ts:2632` TMPDIR site recorded in deferred-items.
- The untracked `.planning/milestone.lock` and `.planning/phases/34-*` present at dispatch were not touched.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 7 modified files present on disk; 4 task commits present in history (bd011734, 776c1e07, 4be30638, 443be07e); commits measured from the plan ledger = 4; no control byte in this file.
