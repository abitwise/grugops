---
phase: 33-live-capture-windows-portability
plan: 03
subsystem: testing
tags: [windows, path-separator, posix, d-15, cap-02, check-banned-claims, check-kit-refs, dedupe-key, vitest, tsc]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-01's census re-pin procedure (check-foundation-guards.test.ts) and 33-02's measured-not-assumed posture for a listed module that turns out not to be the origin
  - phase: 29.1-kit-consistency-remediation
    provides: check-kit-refs's one path-spelling authority `relKey` (WR-01), which this plan re-spells rather than duplicates
  - phase: 29-controlled-language
    provides: the banned-claim scan-set parts, the dedupe and overlap derivations, and the two-sided pin this plan keeps at 120
provides:
  - "`scripts/posix-path.ts` + committed `.js` — the one home of the separator-parameterized published-path normalizer: `toPosixWith(path, separator = sep)` and its host-bound wrapper `toPosix(path)` (the two export names plan 33-04 imports)"
  - "`scripts/posix-path.test.ts` — the Windows spelling exercised and mutation-proven on a POSIX host (8 cases, platform-independent)"
  - "`check-kit-refs`: every repo-relative path the gate publishes is spelled by `relKey = toPosix(join(rel))`; derived prefixes use the published separator; the Assertion-1 partition (hit lines = exempt + stray) is published and asserted as a relationship"
  - "`check-banned-claims`: `scanKey(rel, separator = sep)` forms every scan-set key at the walk's accumulation; `bannedClaimScan(parts)` / `bannedClaimScanOverlap(parts)` take their parts as a defaulted parameter; `isExemptRegionMember(file)` is the one exempt-member predicate"
  - "the published / test-internal census over six modules, with counts, so a reviewer can check the D-15 boundary rather than trust it (below)"
affects: [33-04 test-internal comparisons, 33-09 pushed CI run, 33-05, 33-06]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 17535
  tasks: 3
  commits: 6
plan_head_before: d8c8099330f40cce8637e7b7d2688364a7587965

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A published-path normalizer takes its separator as a parameter defaulted to the host's, so the Windows spelling is exercisable on a POSIX box; production calls the host-bound wrapper and never reads process.platform"
    - "Normalize at KEY FORMATION, never at the comparison: the Set's own members are what every consumer publishes"
    - "Reproduce a platform-only failure by its mechanism on the host you have: hand the key formation the other platform's separator, or make the spelling authority spell the other way, and watch the suite red"
    - "A listed module that measurement shows publishes nothing host-separated is recorded as untouched, not edited on suspicion (33-02's posture, applied three times here)"

key-files:
  created:
    - scripts/posix-path.ts
    - scripts/posix-path.js
    - scripts/posix-path.test.ts
  modified:
    - scripts/check-kit-refs.ts
    - scripts/check-kit-refs.js
    - scripts/check-kit-refs.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "board-read.ts and board-model.ts are UNTOUCHED: the census found zero repo-relative host-separated publishing sites — every published path in board-read is an absolute realpath/resolve location, board-model imports nothing from node:path, and the plan's premise that `relative(root, target)` feeds a refusal message is disproven by reading the code (it feeds a boolean)"
  - "Absolute host locations (`C:\\repo\\plans\\board.md`) are NOT rewritten: they are locations, not spellings; rewriting them would create new windows reds in ~14 board-read/board-watch assertions that compare `readErrors[].path` against `join(dir, …)` and were green on windows-latest — the opposite of CAP-02"
  - "board-dashboard.ts and context-io.ts are UNTOUCHED on measurement: the dashboard's watch record is POSIX by construction (`dirname` preserves forward slashes on win32; the arming-order case over the published record was green on windows-latest run 35393299432), and context-io's one published relpath derivation already carries the idiom"
  - "The pinned cardinality stays at 120: the per-part breakdown is byte-identical before and after on this host (POSIX no-op), so the pin did not move and there was nothing to acknowledge"
  - "The ten pre-existing host-bound `split(sep).join(\"/\")` copies stay where they are — none is in a module this plan changes, and replacing them is not this plan's subject"
  - "RESEARCH's reading that the exemption-region locator fails two-sided on windows is corrected: the `occurs 0 time(s)` / `occurs 2 time(s)` log lines are the suite's own planted-case stdout, present on the green ubuntu leg and on this host; the 64 windows reds in check-banned-claims.test.ts are ONE class — `derived 121, expected 120, overlap 1`"

patterns-established:
  - "Census before edit: enumerate every join/relative/dirname/resolve result and classify PUBLISHED (row, key, Set member, message) vs INTERNAL (containment, ancestor probe, opened location); state both counts; change only the first class"
  - "Two commits per TDD task where the RED needs plumbing: the RED commit carries the test plus behaviour-preserving plumbing (an identity body), the GREEN commit carries the one-line behaviour"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "One separator-parameterized normalizer in scripts/posix-path.ts, exercised in the backslash spelling on a POSIX host and idempotent under both separators; the host-bound wrapper is the two-argument form under the host sep"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/posix-path.test.ts (8 passed; RED against an identity body: 6 failed / 2 passed, target case expected a/b/c received a\\b\\c)"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-kit-refs publishes every adapter path, hit line and exempting file in POSIX form through one authority, and the Assertion-1 partition is asserted as a relationship"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/check-kit-refs.test.ts (35 passed; with the authority spelling backslashes on this host: 29 failed)"
        status: pass
      - kind: integration
        ref: "node scripts/check-kit-refs.js (ALL CHECKS PASSED; new line `[derivation] agent-factory/config/ hit lines: 2 = 2 exempt + 0 stray`)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The banned-claim scan set derives one cardinality whichever separator spelled its members: mixed-spelling parts dedupe to the distinct count, the overlap is the true overlap, the exemption-region member is located exactly once"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the scan set derives one cardinality whichever separator spelled it (7 passed; RED against the identity key formation: 4 failed — 8 vs 4, 0 vs 4, 0 vs 1)"
        status: pass
      - kind: integration
        ref: "npm run check:banned-claims (exit 0; 120 document(s), kit 75, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1, overlap 2 — identical before and after)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The windows leg's 64 check-banned-claims reds and 7 check-kit-refs reds are closed on windows-latest itself"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Not measurable on this host: the mechanism was reproduced here by handing the key formation win32.sep and by making the spelling authority spell backslashes, and the fix is a POSIX no-op by construction; the windows outcome is read from the pushed CI run plan 33-09 makes."

# Metrics
duration: 35min
completed: 2026-09-19
status: complete
---

# Phase 33 Plan 03: Published-Path Normalization at the Emitting Boundary Summary

**One separator-parameterized normalizer (`toPosixWith` / `toPosix` in `scripts/posix-path.ts`) applied at the two measured publishing boundaries — `check-kit-refs`'s spelling authority and `check-banned-claims`'s scan-set key formation — with the mixed-spelling dedupe, the overlap and the exemption-region member all proven RED-then-GREEN on this POSIX host, the pinned cardinality unchanged at 120, and four listed modules left untouched because the census found they publish nothing host-separated.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-19T22:18:24Z
- **Completed:** 2026-09-19T22:54:09Z
- **Tasks:** 3
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- `scripts/posix-path.ts` (+ committed `.js`): `toPosixWith(path, separator = sep)` splits on the given separator and joins with `/`, keeps forward slashes already present (so `path.win32.join`'s mixed shape collapses), is idempotent, refuses an empty separator by name, and is the identity for `/`. `toPosix(path)` is the same function bound to the host separator — the form production calls, which never rewrites a backslash on a POSIX host where it is a legal filename byte. Node stdlib only, no I/O, no entry guard.
- `check-kit-refs`: `relKey` — WR-01's one spelling authority — is now `toPosix(join(rel))`; the sibling-set and exemption prefixes are built from it with the published separator instead of `sep`; the derived adapter set passes through it; and the gate prints `[derivation] agent-factory/config/ hit lines: N = E exempt + S stray` and fails when the partition does not sum. The suite asserts POSIX literals for the exempting file, reads the published partition and asserts the relationship, and pins the authority body present and the host-spelled body absent.
- `check-banned-claims`: `scanKey(rel, separator = sep)` is the one place a scan-set key is formed (the walk's accumulation and the walk's budget-refusal message); `bannedClaimScan` / `bannedClaimScanOverlap` take their parts as a defaulted parameter so synthetic parts can be handed in; `isExemptRegionMember` names the predicate the scan loop asks at both of its sites. Seven new cases drive the key formation with `win32.sep` on this host.
- Full regression lane on the final tree: 77 files, 5289 passed, 2 skipped, 0 failed, 474.85 s, exit 0 (5274 → 5289: 8 + 7 new cases). Build parity (68 tracked outputs), freshness (68 fresh), nul-bytes, platform shapes, dashboard read-only guard (215/215) and all three typecheck targets green.

## Task Commits

Each task was committed atomically (TDD tasks carry their RED and GREEN commits):

1. **Task 1: normalizer + partition** - `f97d5798` (test, RED) → `ce3f4713` (feat, GREEN, with the census pins) → `e9f9d8a1` (refactor: header copy-count corrected to the measured ten)
2. **Task 2: the remaining publishing modules** - `40ad3519` (fix: check-kit-refs)
3. **Task 3: the banned-claim scan set** - `d93b6ff7` (test, RED with identity plumbing) → `0d0650e5` (fix, GREEN)

**Plan metadata:** see the docs commit that carries this SUMMARY.

## The census — published vs test-internal, per module (D-15, RESEARCH Pitfall 3, T-33-16)

Every `join` / `relative` / `dirname` / `resolve` result, classified by where it goes. "Published" = a board row, a map or Set key, a refusal message, a rendered cell, a printed line. "Internal" = a containment comparison, an ancestor probe, or a location that is opened rather than printed.

| Module | Published sites carrying a path | …of which repo-relative AND host-separated | Internal sites | Changed | Disposition |
|---|---:|---:|---:|---:|---|
| `scripts/board-read.ts` | 39 — 19 `errors.push({… path …})` + 13 `settleSource(source, path, …)` records, and 7 refusal messages (3 in `resolveRepoRoot`, 3 in `insideRoot`, 1 in `childPath`) | **0** — every value is an absolute location: a `realpathSync` result via `repoSubpath` / `childPath`, or the lexical `join(root, FIXED_SUBPATHS[source])` in `guarded` | 4 — `relative(root, target)` at `isWithinRoot` (L599, a boolean, uses `sep` correctly), `dirname(target)` / `dirname(probe)` in `anchorAbsentTarget` (L622/L629), `resolve(probeReal, relative(probe, target))` (L641, the location to open) | 0 | **untouched** — the plan's premise that L599's `relative` result reaches a refusal message is disproven by reading: it is consumed by `startsWith(\`..${sep}\`)` and returned as a boolean. `FIXED_SUBPATHS` (L480-488) is byte-identical to the pre-task text (md5 `24223cc8…` at both `d8c80993` and HEAD) |
| `scripts/board-model.ts` | 0 | 0 | 0 | 0 | **untouched** — the module imports nothing from `node:path`; its one `join` is `Array.prototype.join` |
| `scripts/board-dashboard.ts` | 4 — the watch record `{ path: rel }` formed in `noteWatchState`, and `rel` in its three messages (not-yet-armed, not-resolvable, watch-failed); plus 1 forwarded site (the stderr line prints `readError.path` handed from board-read) | **0** — `rel` comes from `WATCH_DIRS`, derived by `deriveWatchDirs` from the POSIX literals in `FIXED_SUBPATHS` through `watchDirForSubpath` (`path.win32.dirname("plans/board.md")` is `"plans"`; it preserves the input separator) and the `${subpath}/${stage}` template | 2 — `join(root, rel)` (L1142) is asked of `deps.contained` only, and `decision.real` is what `deps.watch` opens | 0 | **untouched, measured** — on windows-latest run 35393299432 all 8 `board-watch.test.ts` reds are the DASH-04 `withLinkedTree` describe (whose carrier is the test-internal `armedRel: armed.map((d) => relative(realTree, d))` line, plan 33-04's) plus the child-process case; the arming-order case that asserts the published record equals `[".grugops/context", "plans"]` was green there |
| `scripts/context-io.ts` | 1 — `GOVERNANCE_CONFIG_RELPATHS` (L4513-4516) | **0** — it is already the idiom | ~20 absolute read/write targets (`join(contextRoot, task, "notes")`, the ledger paths, the config candidates), 1 containment (`resolvedFinal.startsWith(resolvedDir + sep)`, L1320), 7 `dirname` walks (canonical directory path, repository-boundary ascent) | 0 | **untouched** — its 30 windows reds are the FIFO, drive-letter, 8.3 short-name and error-classification classes (RESEARCH), owned by other plans |
| `scripts/check-kit-refs.ts` | every walked member (hit lines `path:lineno:line`, the `grepFilesWithMatch` sets behind Assertion 3's `ghIllegal` / `ghSilent` lists), every derived adapter path (`ADAPTER_FILES` → SC2's `(absent)` / `(marker-missing)` list, `ghLegal`), the exempting file in the Assertion-1 verdict | **all of them** — `relKey` was `join(rel)`, the host spelling | `abs(rel)` (the filesystem direction; `join` accepts the POSIX form on every platform) | 6 edit sites, 1 authority: `relKey`, `derive`, `configSiblingFiles` (prefix + depth filter), `exemptConfigSelfRefs` (prefix), the new partition line + relationship refusal | **changed** |
| `scripts/check-banned-claims.ts` | every walked member — a dedupe key in `bannedClaimScan`, a duplicate count in `bannedClaimScanOverlap`, the `file` the exemption-region test and every `file:line:column` finding names; the walk's budget-refusal message | **all walked members** (`kit`, `skillSources`, `claudeAdapters`, `pluginManifests`); the corpus-supplied parts (`publicDocs`, `installReadme`, `guarantees`) were already POSIX, which is exactly why the keys disagreed | the dedupe `Set`, the overlap loop, the exempt-member test — comparison points, deliberately NOT normalized | 2 sites, 1 authority: `acc.push(scanKey(rel))` and the budget message | **changed** |

**Totals:** published sites changed = 8 (6 in check-kit-refs, 2 in check-banned-claims), through 2 authorities that both call the one normalizer. Internal comparison sites deliberately left = 6 in board-read + 2 in board-dashboard + 8 in context-io + 3 in check-banned-claims. The test-internal class — `validate.test.ts`'s `SCANNED` census, `board-watch.test.ts:343` `armedRel`, `check-uat-oracles.test.ts`, `board-tracer` / `board-dashboard` `no/such/tree` literals — is plan 33-04's subject and was not touched.

**On absolute locations.** D-15 names "refusal messages"; the refusal messages in board-read carry absolute host locations (`C:\Users\…\repo\plans\tickets\ESCAPE.md`). These were not rewritten, for two measured reasons: rewriting a drive-absolute path buys no cross-host stability (the drive and the home differ anyway), and ~14 assertions in `board-read.test.ts` (L1214, L1236, L1493, L1656, L2133, L4337, L4410, …) and `board-watch.test.ts` compare `readErrors[].path` to `join(dir, …)` — green on windows-latest today — so a `C:/…` spelling would create new windows reds in the leg CAP-02 exists to make green. The line this plan draws: a repo-relative SPELLING is published and normalized; an absolute LOCATION is the host's own.

## Task 1 — RED transcript and mutation proof

RED, `npx vitest run --exclude '**/scripts/e2e/**' scripts/posix-path.test.ts` against an identity body of `toPosixWith` (uncommitted): exit 1, **6 failed / 2 passed** (8). Target case `an explicit backslash separator maps a\b\c to a/b/c`: expected `"a/b/c"`, received `"a\b\c"`. The two cases an identity satisfies (forward-slash input unchanged; the wrapper equals the two-argument form under the host `sep`) stayed green, which is the point: those are properties, the backslash case is the discrimination. GREEN: 8/8. (`gsd_run check tdd-red-evidence` parses node:test TAP, not vitest output, and `tdd_mode` is off; the record is kept here instead.)

Census pins re-derived for the new module and suite, in the same commit: `NON_TEST_MODULE_COUNT` 87 → 88 (`git ls-files '*.ts'` minus tests and `.d.ts`), the `scripts/`-scoped corpus 60 → 61 at its three sites, `TRIPWIRE_MODULES` 70 → 71 (`ls scripts/*.test.ts | wc -l`). The isEntry-guard census (16) is unmoved: `posix-path.ts` has no entry guard.

The ten pre-existing host-bound copies of the one-liner (six freshness modules, `capture-live.ts`, `js-import-closure.ts`, `validate-agent-factory.ts`, `context-io.ts`'s `GOVERNANCE_CONFIG_RELPATHS`) stay: none is in a module this plan changes, so the acceptance criterion "no module changed by this plan defines a second copy" holds, and replacing them is a separate decision.

## Task 2 — check-kit-refs, and the windows mechanism reproduced here

The 7 windows reds in `check-kit-refs.test.ts` are one class: the gate printed `.claude\agents\grugops-marker-probe.md` and `agent-factory\config\factory.config.md` while the suite (and every human reading a verdict) spells them with `/`. The "self-reference count disagreed" was this spelling inside the one sentence that carries both the count and the file name — the count itself never moved on windows, which is why a bare integer on one side could not see it.

Reproduced on this host by making the authority spell backslashes (`join(rel).split("/").join("\\")` — the compiled `.js` keeps `noEmitOnError`, so the mutation had to keep the `toPosix` import live): **29 of 35 cases red** and the gate refuses on an empty sibling set; restored, 35/35 and the gate's output is byte-identical to before (POSIX no-op). Reverting only the authority body to `join(rel)` reds the source-shape pin (1/35), which is the structural backstop on a host where the mechanism itself is a no-op.

The partition line `[derivation] agent-factory/config/ hit lines: 2 = 2 exempt + 0 stray` is printed on every run; `exempt + strays !== hits` is a named FAIL. The test reads it and asserts `exempt + strays === hits`, `strays === 0`, and that `exempt` is the same number the verdict sentence spells out.

One assertion deliberately kept as `join(".claude", "agents")` (test L1069): it matches `kit-model`'s own `cannot read kit directory <absolute dir>` throw — an absolute location spelled by a foreign module, not an adapter path this gate publishes.

## Task 3 — before/after counts, RED transcript, and the RESEARCH correction

**Per-part member counts on this host, before and after — identical:** kit 75, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1, overlap 2, total **120**. `BANNED_CLAIM_SCAN_COUNT` did not move; `npm run check:banned-claims` exits 0 with the same PASS line. Tests in the file: 124 before, **131** after.

**RED** (`d93b6ff7`, the key formation extracted with an identity body = the pre-change walk, plus the parts parameter and the named predicate): the new describe reported **4 failed / 3 passed** —
- `the key formed from a backslash-walked member equals …`: expected `agent-factory/README.md`, received `agent-factory\README.md`
- `two parts in the two spellings dedupe to the DISTINCT document count`: expected 4, received **8** (the sum)
- `the overlap derivation … reports the TRUE overlap`: expected 4, received **0**
- `the exemption-region locator finds its region EXACTLY ONCE`: expected 1, received **0**

That is the windows shape exactly (the measured `overlap 1` is this with the one forward-slash-only overlap, `docs/GUARANTEES.md`, still colliding). **GREEN** (`0d0650e5`, `scanKey` = `toPosixWith(rel, separator)`): 131/131. The negative-control case keeps the un-keyed shape assertable: raw parts in both spellings give the sum, zero overlap, and the region's file twice.

**RESEARCH Class B, corrected on the evidence.** The two-sided "exemption region … occurs 0 time(s) / occurs 2 time(s)" lines RESEARCH read as windows failures appear in the ubuntu log too (lines 5044-5045, where `check-banned-claims.test.ts` passed 124/124) and in this host's green full-lane output: they are the suite's own planted-case stdout (the both-directions cases that plant a duplicated or deleted heading). The windows reds in this file — 64 — are ONE class, every mirror case and the in-process pin reporting `derived 121 document(s), expected exactly 120 (… overlap 1)`. The mirror's per-part numbers in that message (kit 102, skillSources 2, claudeAdapters 2) are the synthetic mirror's fillers, not the live tree's. Task 3's behaviour list still holds — the region IS located zero times on windows, through the key never equalling the declared file — but the mechanism is the dedupe key, not the heading count, and the fix is one site.

## Files Created/Modified

- `scripts/posix-path.ts` / `scripts/posix-path.js` - the normalizer; header records what it is not for
- `scripts/posix-path.test.ts` - 8 platform-independent cases
- `scripts/check-kit-refs.ts` / `.js` - `relKey` re-spelled; `REL_SEP`; derived prefixes; `derive` through the authority; partition line + relationship refusal
- `scripts/check-kit-refs.test.ts` - win32 case over the new authority; POSIX literal for the exempting file; `reportedConfigPartition` reader and its assertions; the defect/fixed spelling lists extended
- `scripts/check-banned-claims.ts` / `.js` - `scanKey`, `isExemptRegionMember`, parameterized `bannedClaimScan` / `bannedClaimScanOverlap`
- `scripts/check-banned-claims.test.ts` - the separator-independence describe (7 cases); the ONE-READ source-shape pin re-pointed at the named predicate
- `scripts/check-foundation-guards.test.ts` - census pins 87→88, 60→61 (x3), 70→71 with derivations recorded

## Decisions Made

See `key-decisions` in the frontmatter. The reviewable one: four of the six listed modules are untouched because the census, not the file list, is the derivation — the same posture 33-02 took when the walk turned out not to be the origin.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The ONE-READ source-shape pin named the inline comparison this plan replaced**
- **Found during:** Task 3 (RED run over the whole file)
- **Issue:** `check-banned-claims.test.ts` pinned the literal `file === BANNED_CLAIM_EXEMPT_REGION.file && exemptReadOk`; naming the predicate once (`isExemptRegionMember`) moved it.
- **Fix:** the pin now matches `isExemptRegionMember(file) && exemptReadOk` and additionally pins the predicate's single declaration; the `exemptReadOk` gate it exists to hold is unchanged.
- **Files modified:** scripts/check-banned-claims.test.ts
- **Verification:** the case passes; the file is 131/131
- **Committed in:** 0d0650e5

**2. [Rule 1 - Bug] The normalizer header claimed seven copies of the idiom; grep reports ten**
- **Found during:** Task 1 acceptance check ("no second copy in a changed module")
- **Issue:** the plan and PATTERNS say "seven copies"; `grep` over `scripts/*.ts` finds ten host-bound sites.
- **Fix:** the header names all ten; no behaviour change.
- **Files modified:** scripts/posix-path.ts, scripts/posix-path.js
- **Verification:** 8/8; build parity green
- **Committed in:** e9f9d8a1

### Plan premises corrected by measurement (not deviations from the `<done>` criteria)

- Task 1's `key_links` row "board-read `relative(root, target)` -> the user-facing refusal message" does not exist in the code; recorded in the census. Both board modules untouched.
- Task 2's expected edits to `board-dashboard.ts` did not happen: the published record is POSIX by construction and was measured green on windows-latest. The plan's own rule for this case ("say so in the summary and leave the file untouched") was applied.
- Task 3's RESEARCH premise about the exemption-region locator failing two-sided is a log misread (above); the behaviour list is still satisfied through the key.

---

**Total deviations:** 2 auto-fixed (2 bugs, both in comments/pins), 0 blocking; 3 premises corrected.
**Impact on plan:** every `<done>` and acceptance criterion holds; the diff is smaller than the plan's file list because four modules were shown not to need it.

## Verification (plan level)

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` (full lane, final tree) | 77 files, 5289 passed, 2 skipped, 0 failed, 474.85 s, exit 0 |
| `npm run check:banned-claims` | exit 0; 120 document(s), kit 75 / publicDocs 12 / installReadme 1 / skillSources 7 / claudeAdapters 24 / pluginManifests 2 / guarantees 1, overlap 2 |
| `node scripts/check-kit-refs.js` | ALL CHECKS PASSED; partition line `2 = 2 exempt + 0 stray` |
| `npm run check:dashboard-readonly` | 215 passed |
| `npm run build && npm run check:build-parity && npm run typecheck` | ALL CHECKS PASSED (68 tracked outputs); typecheck exit 0 on all three targets |
| `npm run freshness` | 68 committed .js fresh, 0 orphaned |
| `npm run check:nul-bytes` | ALL CHECKS PASSED |
| `node scripts/check-platform-shapes.js` | ALL CHECKS PASSED |
| `git ls-files -- scripts/posix-path.js` | non-empty |
| `npm test` | never run (prohibition honored) |

The `board-watch-live.test.ts` DASH-04 case from `deferred-items.md` was green on this run; the item stays open for plan 33-09's CI-leg measurement.

## Issues Encountered

- `gsd_run check tdd-red-evidence` cannot read vitest output (it parses node:test TAP), so both RED records are kept in this summary with command, exit code, target case, expected and actual.
- `check:build-parity` reads `git diff -- '*.js'` after a build, so it reports a modified-but-uncommitted `.js` as "moved"; it is green at every commit of this plan.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-13 (key normalized at formation, mutation-proven), T-33-14 (region member located exactly once, both directions asserted), T-33-15 (check-kit-refs and check-banned-claims publish forward slashes only; board-read's absolute locations are recorded as locations, not spellings), T-33-16 (the written partition above) and T-33-17 (no package installed) are as the register states.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-04 imports `toPosix` / `toPosixWith` from `scripts/posix-path.js` for the test-internal comparisons (`validate.test.ts` `SCANNED`, `board-watch.test.ts:343` `armedRel`, `check-uat-oracles.test.ts`, the `no/such/tree` literals).
- Plan 33-09's pushed run is the first windows measurement of D2/D3/D4 above; the numbers to watch are `check-banned-claims.test.ts` (64 → 0 expected) and `check-kit-refs.test.ts` (7 → 0 expected).
- The untracked `.planning/milestone.lock` and `.planning/phases/34-*` present at dispatch were not touched.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-19*

## Self-Check: PASSED

- 3 created files present on disk; 6 task commits present in history (f97d5798, ce3f4713, e9f9d8a1, 40ad3519, d93b6ff7, 0d0650e5); commits measured from the plan ledger = 6; no control byte in this file.
