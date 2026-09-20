---
phase: 33-live-capture-windows-portability
plan: 15
subsystem: testing
tags: [windows, context-io, d-14, d-15, cap-02, realpathSync-native, resolve, homedir, userprofile, deep-fixture, cell-escaping, mutation-proof]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-04's TMPDIR/TMP/TEMP two-name plant precedent; 33-05's FIFO/chmod/symlink skip helpers (the CR-24 plant table's `unopenable` arm); 33-06's `canonicalPath` remedy (`realpathSync.native` on both sides); 33-09's CI measurement (run 35499800942 § 2.4 rows W-17..W-20, W-22..W-27) naming each red's assertion text"
provides:
  - "Eleven `scripts/context-io.test.ts` windows reds addressed by DERIVATION, no platform conditional: W-17/W-18 through `resolve`, W-23/W-24 through `realpathSync.native`, W-25 as a directory identity (`native(portable(r)) === native(r)`), W-22/W-26 through a `{HOME, USERPROFILE}` plant, W-19/W-20 through single-character deep fixtures under `DEEP_FIXTURE_MAX_PATH_CHARS`, W-27 through the renderer's own cell escaping"
  - "`DEEP_FIXTURE_MAX_PATH_CHARS = 240` and `deepFixture(top, levels)` in the 31-15 block: the premise ceiling for deep `drive()` fixtures, with the `UNKNOWN - verify` hypothesis recorded beside it"
  - "`drive()` no-result diagnostics: the spawn error message, exit status and signal are quoted beside an empty result, so the next CI log names its layer"
  - "`plantHome(home)` (31-22 block) and `rendererCell(s)` (31-33 block): the two-name in-process home plant, and the source-quoted form of `cell()` for plan 33-16 to replace with the exported authority"
affects: [33-16 (W-21, W-28, the exported cell authority, the directory-symlink fixtures), 33-20 pushed CI run, 33-23 ledgers (WINDOWS.md rows 226 and 234, deferred-items.md ten-reds item)]

# Actuals (#2632) — chars/4 over the realized diff (one file, ledger 7039923a..HEAD), never a harness token count.
actuals:
  tokens: 4611
  tasks: 3
  commits: 3
plan_head_before: 7039923a3c1947b2d89c0aa9b554eded3ca55c04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "An expectation is produced by the SAME host function the module applies over the SAME input (`resolve(literal)`, `realpathSync.native(dir)`), never by the literal or by a platform branch — on the author's host the two coincide, on the other host both move together (D-15)"
    - "A spelling equality between two resolvers is replaced by a directory identity: re-canonicalise the weaker resolver's answer through the stronger one and compare to the stronger one's answer"
    - "Every home plant sets both names `os.homedir()` reads; every deep child-cwd fixture asserts its composed length under a named ceiling as a PREMISE so a host limit is a named red, not an empty stdout"
    - "A test-side reproduction of a host-only red: a POSIX filename carrying a backslash puts one inside the authority's message, so the cell-escaping class is observable on darwin against the committed .js"

key-files:
  created: []
  modified:
    - scripts/context-io.test.ts

key-decisions:
  - "CONTROL 5a is planted the same two-name way as 5b (not only 5b): on windows-latest 5a was green only because the planted home was never read, so its movement was measured against the runner's own home; with both names planted, 5a's PROMOTE is the converse of 5b's DECLINE under the same rule (T-33-79)"
  - "The 31-41 CONTROL driver (`the CONTROL discriminates: without the in-kit configuration …`) receives the two-name plant too, though it was green on windows — a control that runs under a different home from the reading it controls is not a control"
  - "`deepFixture` asserts the ceiling at all THREE deep fixtures (deep 70, near limit-4, far limit+6), not only the two that were red; the constant reads 6 times in the file (declaration, assertion, message, three sites)"
  - "`cell()` is not exported, so W-27's expectation is the source-quoted form (`rendererCell`), per the plan's instruction that the module edit belongs to 33-16; the one-line note for 33-16 is in the helper's docblock and below"
  - "The pipe-splitting `detailOf` (`row.split(\"|\")[3]`) is left as is: no authority message carries a pipe on either leg, and widening it is outside this plan's eleven cases"

patterns-established:
  - "Mutation proofs recorded per task on this host: USERPROFILE-only plant reds 5b by name; a 100-character ceiling reds the deep cases naming 215/201 characters; the pipe-only expectation disagrees with the rendered cell on a backslash-bearing filename while `rendererCell` agrees"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "W-17, W-18, W-23, W-24, W-25 — resolved-path and canonical-path expectations derived through `resolve` and `realpathSync.native`, the module's own functions; the rung-2 assertion is a directory identity"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#trustedRepoRoot is ONE function, and an empty CLAUDE_PROJECT_DIR names nothing"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#trustedRepoRoot returns the TRIMMED value, as grantedBy does next door"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#hostDeliveredRoot() ACCEPTS a canonical, existing, version-controlled directory"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#tier 0 OUTRANKS tier 1, which is the only reason it is a tier at all"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the canonicaliser's THREE rungs are each driven, and the rung this platform used is named"
        status: pass
      - kind: other
        ref: "grep -a -c 'toBe(\"/tmp/some-project\")' scripts/context-io.test.ts → 0; node: path.win32.resolve('/tmp/some-project') === '/tmp/some-project' → false"
        status: pass
    human_judgment: false
  - id: D2
    description: "W-22, W-26 — every home plant sets HOME and USERPROFILE together and restores both; W-19, W-20 — deep drive() fixtures compose single-character segments under DEEP_FIXTURE_MAX_PATH_CHARS with the length asserted as a premise; drive() quotes the spawn error and status"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 5b (BOTH WAVES): the same store at a MARKER-LESS home declines — R-31-19-05's named cost"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 5a (WAVE 3): a HOME-ROOTED project's own store PROMOTES — the DECLARED movement"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the three readings are taken against a kit home the COMMITTED installer created"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the published step limit is the one the walk has, driven from the sentence itself"
        status: pass
      - kind: other
        ref: "mutation A (USERPROFILE-only plant): CONTROL 5b × `expected null not to be null`; mutation B (ceiling 100): both deep cases × `expected 215 to be less than or equal to 100` / `expected 201 …`; both restored, grep MUTANT-A/MUTANT-B → 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "W-27 — the CR-24 plant table's detail cell is compared through the renderer's own cell escaping (source-quoted `rendererCell`), every arm staged and green on this host"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#every planted condition reports its OWN arm, read from the authority's discriminant"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the FULL pairwise cross product of arms produces DISTINCT rendered rows"
        status: pass
      - kind: other
        ref: "scratch w27-repro.mjs against scripts/context-io.js with filename `dd\\overceiling.md`: detail === pipe-only form → false; detail === rendererCell(message) → true"
        status: pass
    human_judgment: false
  - id: D4
    description: "The eleven windows-latest CI titles (W-17..W-20, W-22..W-27 on run 35499800942) are green on the pushed run"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Every mechanism is derived from the CI log and reproduced on darwin where darwin can (W-22 by the converse plant, W-19/W-20 by the ceiling premise, W-27 by a backslash-bearing filename); the W-19/W-20 hypothesis is `UNKNOWN - verify` and the leg's conclusion is measured only by plan 33-20's pushed run"

# Metrics
duration: 16 min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 15: Eleven context-io windows reds addressed by derivation — the expectation comes from the host function the module runs Summary

**Every test-internal expectation the windows leg of run 35499800942 measured red for a SPELLING or PLANT reason in `scripts/context-io.test.ts` now derives its value through the same host function the module applies — `resolve`, `realpathSync.native`, `os.homedir()`'s two names, the renderer's own `cell` escaping — and the two deep `drive()` fixtures keep their 70 levels under a named 240-character premise; no `process.platform` read, no module edit, each fix mutation-proven on this host and followed to every arm that consumes the changed value.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-20T21:00:19Z
- **Completed:** 2026-09-20T21:17:09Z
- **Tasks:** 3 (one commit each; 3 commits, MEASURED from ledger `7039923a`)
- **Files modified:** 1 (`scripts/context-io.test.ts`, +137/-26)

## Accomplishments

- **Task 1 (W-17, W-18, W-23, W-24, W-25):** the four `trustedRepoRoot` assertions expect `resolve("/tmp/some-project")` — the module's `resolve(fromEnv.trim())` over the same literal (`grep -a -c 'toBe("/tmp/some-project")'` → `0`); the tier-0 ACCEPTS and OUTRANKS cases expect `realpathSync.native(...)`, rung 1's spelling, the remedy `install/install.test.ts`'s `canonicalPath` already applies; the three-rung case asserts rung 2 names rung 1's DIRECTORY, `expect(realpathSync.native(realpathSync(r))).toBe(realpathSync.native(r))`, with the comment reworded (a legitimate fallback because re-canonicalising its answer through rung 1 is the identity on rung 1's answer). Vitest: `Tests  5 passed | 655 skipped (660)`.
- **Task 2 (W-22, W-26, W-19, W-20):** `plantHome(home)` sets `HOME` and `USERPROFILE` together and returns a restorer for both; CONTROL 5a and 5b use it, and 5b asserts the decline by name (`CONTROL 5b PROMOTED: …`) before its clause. The 31-41 reading driver and its CONTROL pass `{ HOME: home, USERPROFILE: home }` to the child. `DEEP_FIXTURE_MAX_PATH_CHARS = 240` is declared with the hypothesis as `UNKNOWN - verify` and `deepFixture(top, levels)` composes `d/d/…/d`, asserts the composed length under the ceiling as a PREMISE, and creates the directory; the three deep fixtures (70, `limit - 4` = 60, `limit + 6` = 70) go through it. `drive()`'s throw now reads `driver produced no result for <consumer> (cwd N chars; spawn error: …; status: …; signal: …): <output>`. Vitest: `Tests  6 passed | 654 skipped (660)` (the five titles plus 31-23 PROBE 5's list case, which names CONTROL 5a); the CONTROL driver case `1 passed`.
- **Task 3 (W-27):** `rendererCell(s)` quotes `cell()`'s body from `scripts/context-io.ts:4073-4075` verbatim — `return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");` — and the detail-cell expectation is `rendererCell(message)` instead of `message.replace(/\|/g, "\\|")`. Vitest: the CR-24 case, the FULL pairwise cross product and the `chmod 000` PREMISE all `✓`; no skip line printed, so all five arms (`unparseable`, `unopenable`, `not-a-regular-file`, `above-ceiling`, `vanished`) were staged on this host (uid 501).
- **Post-wave gate green:** `npx tsc --noEmit` exit 0; `npx tsc -p tsconfig.tests.json --noEmit` exit 0; `npx vitest run --exclude '**/scripts/e2e/**'` → `Test Files  78 passed (78)`, `Tests  5358 passed | 2 skipped (5360)`, `Duration  490.12s`, exit 0 (the same counts 33-14 recorded); `npm run check:nul-bytes` → `ALL CHECKS PASSED` (2434 tracked files). `grep -a -c 'process.platform' scripts/context-io.test.ts` → `0` (0 on the dispatch base). `npm test` was not run.

## Task Commits

1. **Task 1:** `81c94750` — `test(33-15): derive the resolved-path and canonical-path expectations through the module's own functions (W-17, W-18, W-23, W-24, W-25)`
2. **Task 2:** `407cb23f` — `test(33-15): plant HOME and USERPROFILE together; compose the deep drive() fixtures under a named length ceiling (W-22, W-26, W-19, W-20)`
3. **Task 3:** `e0b9c518` — `test(33-15): compare the CR-24 detail cell through the renderer's own cell escaping (W-27)`

**Plan metadata:** see the final `docs(33-15)` commit.

## Per-case record: the pushed-run title, the mechanism, the derivation, the arm probed

| Row | Pushed-run title (run 35499800942) | Mechanism (from the log) | Derivation now | Consuming arm probed |
|---|---|---|---|---|
| W-17 | `trustedRepoRoot is ONE function, and an empty CLAUDE_PROJECT_DIR names nothing` | `expected 'D:\tmp\some-project' to be '/tmp/some-project'` — the module returns `resolve(fromEnv.trim())`; the literal is not the resolved form on win32 | `toBe(resolve("/tmp/some-project"))`; the unset/empty/whitespace arms still compare to `unset` | `trustedRepoRoot`'s env loop (`scripts/context-io.ts:5250-5253`): the case drives absent, empty, whitespace and a value through that one loop; `path.win32.resolve("/tmp/some-project") === "/tmp/some-project"` → `false` on this host |
| W-18 | `trustedRepoRoot returns the TRIMMED value, as grantedBy does next door` | same text; the TRIM is the property, the spelling was the host's | both assertions `toBe(resolve("/tmp/some-project"))` | the same env loop's `trim()` — leading/trailing space and a trailing newline both still land on the resolved value |
| W-23 | `hostDeliveredRoot() ACCEPTS a canonical, existing, version-controlled directory` | `'C:\Users\runneradmin\…' to be 'C:\Users\RUNNER~1\…'` — tier 0 answers rung 1 (`realpathSync.native`), the expectation used the portable resolver, which keeps the 8.3 short name | `toBe(realpathSync.native(r))` | `hostDeliveredRoot()` → `canonicalDirectoryPath` rung 1 (`scripts/context-io.ts:4620-4627`); the seven NULL_CASES beside it are unchanged and still refuse (they compare to `null`) |
| W-24 | `tier 0 OUTRANKS tier 1, which is the only reason it is a tier at all` | the same 8.3 disagreement on the winning tier's answer | `toBe(realpathSync.native(delivered))` | the tier ORDERING: `trustedRepoRoot` returns `hostDeliveredRoot()` above the loop; the 4-host control next door (`with NOTHING delivered …`) compares tier 1 to `resolve(r)` and is untouched, so the two tiers' spellings are each asserted through their own function |
| W-25 | `the canonicaliser's THREE rungs are each driven, and the rung this platform used is named` | `expect(realpathSync(r)).toBe(realpathSync.native(r))` — a spelling equality between two resolvers, disproved by the 8.3 class | `expect(realpathSync.native(realpathSync(r))).toBe(realpathSync.native(r))` — rung 2 names rung 1's directory | rungs 1 (`viaRung1` vs `native(r)`, unchanged), 2 (rewritten), 3 (`position.startsWith(realpathSync.native(GOVERNANCE_FALLBACK_BASE))` — native vs the module's native-canonicalised ancestry, left as is); on this host `native(portable(d)) === native(d)` → `true` |
| W-22 | `CONTROL 5b (BOTH WAVES): the same store at a MARKER-LESS home declines` | `out.threw` was `null` — `HOME` planted, `os.homedir()` on win32 reads `USERPROFILE`, so the marker-less home was never the home stop and the walk climbed past it | `plantHome(home)` sets and restores both names; the decline is asserted by name before the clause | the walk's home stop (`namedHomeDirectory` → `homedir()`, `scripts/context-io.ts:4754-4780`); CONVERSE: CONTROL 5a planted the same way still MOVES (PROMOTE, `promotedId === id`); the 31-23 PROBE 5 list case that names 5a still passes; mutation A (USERPROFILE only, HOME untouched) reds 5b: `CONTROL 5b PROMOTED: … expected null not to be null` |
| W-26 | `the three readings are taken against a kit home the COMMITTED installer created` | `PREMISE: the child's home directory is not the fixture's: expected 'C:\Users\runneradmin' to be 'C:\Users\RUNNER~1\…'` — the child env carried `HOME` only | `env: { ...process.env, HOME: home, USERPROFILE: home }` in the reading driver AND its CONTROL | the PREMISE (`realpathSync(answer.home)` vs `realpathSync(home)`, portable on both sides over the same spelling — stays), READING 1 (`governanceRootOf` = `dirname(dirname(resolve(store)))`, a `resolve` of the test's own spelling — portable vs portable, stays), READINGS 2-3 unchanged; the CONTROL still resolves `null` |
| W-19 | `BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached` | `driver produced no result for trustedRepoRoot:` with EMPTY output — no answer, not a wrong one; every other `drive()` case on the leg answered | `deepFixture(top, 70)`: single-character segments, length asserted `<= 240` as a premise (215 on this host) | the walk's `TRUSTED_ROOT_SEARCH_MAX_ANCESTORS = 64` bound (`scripts/context-io.ts:4742`): 70 levels still answer `KIT`; mutation B (ceiling 100) reds the premise naming `215` |
| W-20 | `the published step limit is the one the walk has, driven from the sentence itself` | same empty driver output on the `limit + 6` fixture | `deepFixture(near, limit - 4)` (60 levels, 201 chars here) answers `near`; `deepFixture(far, limit + 6)` (70 levels) answers `KIT` | the published sentence (`at most 64 ancestors`) driven against the walk from both sides of the limit; mutation B reds the near fixture naming `201` before the far one is reached |
| W-27 | `every planted condition reports its OWN arm, read from the authority's discriminant` | `expected 'context-io: the note file "C:\\Users\…' to be '… "C:\Users\R…'` — the detail cell carries `cell(detail)` (backslash doubled), the expectation a pipe-only replacement | `toBe(rendererCell(message))`, the source-quoted `cell` | every arm of the plant table on this host: `unparseable` (no detail compared), `unopenable` (chmod 000, EACCES premise green), `not-a-regular-file` (FIFO), `above-ceiling`, `vanished` (dangling symlink, no detail compared); the FULL pairwise cross product still distinct; darwin reproduction with filename `dd\overceiling.md`: pipe-only form `false`, `rendererCell` `true` |

### Classification of every `realpathSync(` hit in the file (Task 1 acceptance)

| Line (post-edit) | Site | Class |
|---|---|---|
| 6191 | `tmp15`: `realpathSync(freshTmp(prefix))` | fixture creation, portable; the values it produces are compared to the walk's own `resolve`-spelled answers of the same spelling (the many green `drive()` cases on the leg) — portable vs portable, stays |
| 11429 | comment inside the three-rung case | prose |
| 11433 | `realpathSync.native(realpathSync(r))` vs `realpathSync.native(r)` | moved: the portable answer is re-canonicalised through native before comparing to native |
| 15911 / 15914 | `realpathSync(answer.home)` vs `realpathSync(home)` | portable vs portable over the same planted spelling, stays |
| 15918 / 15921 | `realpathSync(answer.resolverAnswer)` vs `realpathSync(kitHome)` | `governanceRootOf` returns a `resolve` of the store the test spelled; portable vs portable, stays |

Moved to `.native`: L11334 (W-23) and L11401 (W-24) — both now read `realpathSync.native(...)` and no longer match `realpathSync(`.

### Classification of every `Array.from({ length` fixture (Task 2 acceptance)

| Line (post-edit) | Site | Class |
|---|---|---|
| 174 | 8 concurrent `appendNote` writers | not a path fixture (an array of promises); untouched |
| 6313 | `deepFixture`: `Array.from({ length: levels }, () => "d")` | THE deep composition, single-character segments, asserted under the ceiling |

The three former `dN` compositions at the deep/near/far sites are gone; each site calls `deepFixture`.

## Mutation proofs (each restored before its commit; `grep MUTANT-A|MUTANT-B` → 0)

- **A — the converse plant.** `plantHome` mutated to set `USERPROFILE` only (HOME untouched, the darwin mirror of the win32 defect): `× CONTROL 5b … AssertionError: CONTROL 5b PROMOTED: the marker-less home was not the walk's home stop … expected null not to be null`; `Tests 1 failed | 1 passed` (5a still moves — it does not depend on the plant being read on this host, which is exactly why it was green on windows while 5b was red).
- **B — the ceiling.** `DEEP_FIXTURE_MAX_PATH_CHARS = 100`: `× BOUND: the ancestor walk is limited …` → `expected 215 to be less than or equal to 100`; `× the published step limit …` → `expected 201 to be less than or equal to 100`; `Tests 2 failed`. The message names the composed length, the ceiling and the reason.
- **C — the cell (darwin reproduction, not a mutant).** `scratchpad/w27-repro.mjs` against the committed `scripts/context-io.js`: an over-ceiling note at `notes/dd\overceiling.md` renders a detail cell spelling `dd\\overceiling.md`; `detail === message.replace(/\|/g, "\\|")` → `false`, `detail === rendererCell(message)` → `true`.
- **`drive()` diagnostics.** `spawnSync("node", …, { cwd: "/nonexistent/deep/cwd" })` → `spawn error: spawnSync node ENOENT | status: null | signal: null | stdout: undefined` — the shape the new throw quotes; `(r.stdout ?? "")` already tolerates the `undefined`.

## Files Created/Modified

- `scripts/context-io.test.ts` — the eleven corrected expectations; `plantHome`, `DEEP_FIXTURE_MAX_PATH_CHARS`, `deepFixture`, `rendererCell`; `drive()`'s diagnostic throw.

## Decisions Made

See `key-decisions` in the frontmatter. The two beyond the plan's letter: CONTROL 5a and the 31-41 CONTROL driver receive the two-name plant as well (a control under a different home from its subject is not a control), and all three deep fixtures — not only the two red ones — go through the ceiling premise.

## Deviations from Plan

None — plan executed as written. The two widenings above (5a and the CONTROL driver planted like their subjects; the near fixture through `deepFixture`) are inside the plan's must-have "every case that plants a home directory plants HOME and USERPROFILE together" and its instruction to "apply the same composition to every `drive()` fixture deeper than a handful of levels".

## Issues Encountered

None. `git stash` was not used for the mutants; the file was copied to the scratchpad and restored from the copy.

## Note for plan 33-16

`cell()` at `scripts/context-io.ts:4073` is not exported. `rendererCell` in the 31-33 block of the test file (beside `detailOf`) is its source-quoted twin; when 33-16 edits the module, export `cell` and replace `rendererCell`'s body with the import so there is one escaping authority. The `detailOf` helper still splits the row on `|`; no authority message carries a pipe on either leg, so it was left alone.

## Ledger state (for plan 33-23)

WINDOWS.md rows 226 and 234 stay open: row 226's ten include W-21 (the SYMLINK cell, a module change) which 33-16 takes, and row 234's pair includes W-28 (33-16). Every other member of both rows is addressed here by mechanism; the rows flip only on plan 33-20's pushed run reading green. `deferred-items.md`'s "Ten windows reds in `scripts/context-io.test.ts`" item likewise stays open until 33-16 and 33-20.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema; the changed file is a test.

## Known Stubs

None.

## Next Phase Readiness

- Plan 33-16 (wave 8) can build on this tree: it edits `scripts/context-io.ts` (W-21's symlink cell, W-28's ledger-position classification, the exported `cell`) and the same test file (the unguarded directory-symlink fixtures); nothing here conflicts with those sites.
- Plan 33-20's pushed run is the measurement for W-17..W-20, W-22..W-27; the W-19/W-20 hypothesis is settled by that run's driver output (a non-empty result, or the spawn error and status the throw now quotes).

## Self-Check: PASSED

- `scripts/context-io.test.ts` exists and carries `DEEP_FIXTURE_MAX_PATH_CHARS` (6), `plantHome` (3), `rendererCell` (3); `toBe("/tmp/some-project")` 0; `process.platform` 0.
- Commits `81c94750`, `407cb23f`, `e0b9c518` are on `main`; `git rev-list --count 7039923a..HEAD` → 3.
- No file deletion in any of the three commits; no untracked file left outside `.planning/`.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*
