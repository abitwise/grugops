---
phase: 33-live-capture-windows-portability
plan: 16
subsystem: context-io
tags: [windows, context-io, cap-02, w-21, w-28, d-15, d-16, canonicalWorkingDirectory, realpathSync-native, appendRegularFileLine, not-a-regular-file, stageSymlinkOrSkip, hook-manifest, cell, tdd]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-15's reshaped scripts/context-io.test.ts (plantHome, deepFixture, rendererCell, the CI row texts for W-21/W-28); 33-05's platform-shape corpus (stageSymlinkOrSkip, stageShapeOrSkip, skipLine, capabilitySkipEntry, the FORCE_ABSENT seam); 33-09's CI measurement (run 35499800942 § 2.4 rows W-21 and W-28); 31-27's canonicalDirectoryPath ladder"
provides:
  - "`canonicalWorkingDirectory(raw)` exported from scripts/context-io.ts: the trusted-root walk's start goes through the module's own canonicalDirectoryPath ladder (rung 1 realpathSync.native), read on the cwd line inside `trustedRepoRoot`'s try — the 31-15 mirror's two anchored lines byte-untouched (W-21, the R-31-19-07 SYMLINK cell)"
  - "`appendRegularFileLine` classifies a GOV-02 ledger position by TYPE (statSync, following a link as the open would) before any openSync; a present non-regular entry answers `not-a-regular-file` on every host; the post-open fstat guard is kept as the race authority; both refusal arms carry `refused rather than waited on` (W-28, R-31-21-03's published property)"
  - "every directory-symlink fixture in scripts/context-io.test.ts is staged through `stageSymlinkOrSkip` (10 symlinkSync sites -> 0; stageSymlinkOrSkip 4 -> 13); `admitViaCli` returns null after the counted row and its nine callers return (D-16)"
  - "`cell` exported as the one cell-escaping authority; the test's `rendererCell` is the import, not a source-quoted twin (33-15's note, closed)"
  - "Tests W, Y, Z (red-first, RED_EVIDENCE_OK), the CR-19 FIFO CONTROL re-homed to the type arm with its second measured correction recorded, the DIRECTORY CONTROL's darwin/win32 misdiagnosis corrected in place"
affects: [33-20 pushed CI run (W-21, W-28 measured), 33-23 ledgers (WINDOWS.md rows 226 and 234, deferred-items.md symlink-fixtures item ready to mark resolved), any later plan that reads process.cwd in context-io]

# Actuals (#2632) — chars/4 over the realized diff (five files, ledger 19a7c8af..HEAD), never a harness token count.
actuals:
  tokens: 14376
  tasks: 3
  commits: 7
plan_head_before: 19a7c8af42f65badd402d14a2100cd739a98ac99

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A host-dependent behaviour is made host-independent at the point the module READS its input, through the module's one existing authority (D-15): the cwd through canonicalDirectoryPath, the ledger position's type through statSync before the open"
    - "A refusal ARM is decided by a classification the module performs, never by which host's syscall happened to fail; the post-syscall guard stays as the race authority and shares the arm's one sentence"
    - "A test that needs a privilege stages through the corpus helper and, on refusal, prints the counted row and returns — a helper used by many cases hands `null` back and every caller returns"
    - "A cwd VALUE seam is driven on darwin by replacing the child's `process.cwd` in-child against the committed .js (`inChild`), so a win32-only red is reproduced where the kernel would otherwise hide it"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "The pre-open type classification is ONE `statSync(path, { throwIfNoEntry: false })`, not the plan's `lstatSync` + second `statSync` pair: statSync already follows a link (the open would too), the resolved type is the one the classification needs, and statSync is already in the module's node:fs import — a new `lstatSync` binding would have moved the writer-set import-alphabet pin (14) and forced a re-classification for no gained behaviour (D-07 posture: no new primitive)"
  - "The `not-a-regular-file` arm's sentence is stated ONCE (a local `notRegularFile()` factory) and thrown from both of its sites — the type classification and the post-open fstat guard — so the guard's LOGIC is unchanged while the arm cannot carry two spellings of one refusal"
  - "Test Z's `unopenable` reach is a mode-0 REGULAR FILE at the ledger position (the type classification passes it, the open fails EACCES), taken on the chmod-000 capability measurement with a printed row where the host does not enforce mode bits — the plan's 'parent does not exist' fixture cannot reach the arm because `appendAuditLedger` mkdirs the parent first"
  - "The CR-19 FIFO CONTROL's expectation moves from the ENXIO open spelling to the type arm and the movement is RECORDED in the case as its second measured correction (the first was 31-29's); the DIRECTORY CONTROL's comment 'a directory opens … on darwin' was the inverse of the truth and is corrected rather than deleted"
  - "`cell` is exported on 33-15's note (the 33-15 PLAN assigned that module edit to this plan) as a separate `refactor(33-16)` commit; the test's `rendererCell` is now `mod.cell`"
  - "The hook manifest (hooks/hook-entry.ts) is re-derived whenever scripts/context-io.js moves — two chore/refactor commits carry it; without it the 31-37 delivered-root corpus refuses the rebuilt decider by hash (Rule 3, outside the plan's files_modified)"

patterns-established:
  - "Pre-fix reproduction on darwin of a win32-only cwd red: a scratch probe replacing `process.cwd` in-child against the committed .js answered `<link>/proj` (W-21's exact shape) before the change and `<real>/proj` after"
  - "Seam proof for D-16 routing: `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT='symlink to a regular file (CONTROL — it resolves to one)'` over scripts/context-io.test.ts prints 35 SKIPPED rows across every routed site and the file stays 663 passed / 0 failed"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "W-21 — the trusted-root walk starts from the canonical working directory (`canonicalWorkingDirectory`, rung 1), so a cwd spelled through a directory symlink names the link target's spelling on every host; the 31-15 mirror's anchors byte-unchanged"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#W-21 (33-16, Test W): the walk STARTS from the canonical working directory — a cwd spelled through a directory symlink is the link target's own spelling"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#MONOTONICITY: no configuration moved from REFUSED to ADMITTED, on either host family"
        status: pass
      - kind: other
        ref: "grep -a -c 'const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);' scripts/context-io.ts → 1; git diff HEAD~ -- scripts/context-io.ts hunk lines touching either anchor → 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "W-28 — a non-regular GOV-02 ledger position is refused by TYPE before any open (`not-a-regular-file`), both write-side arms worded `refused rather than waited on`; the fstat guard kept; the `unopenable` arm still reached by a mode-0 regular file"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#33-16 Test Y (W-28): a DIRECTORY at the ledger position is refused by TYPE — `not-a-regular-file`, worded as a bounded refusal, on every host"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#33-16 Test Z (W-28): a FIFO still answers the type arm, and a regular file the process may not open still answers `unopenable` — both worded as bounded refusals"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#R-31-21-03's published shape AGREES with the reading its probe takes"
        status: pass
      - kind: other
        ref: "grep -a -c 'refused rather than waited on' scripts/context-io.ts → 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-16 — every directory-symlink fixture in scripts/context-io.test.ts goes through stageSymlinkOrSkip; a host without the privilege prints named, counted rows and the file stays green"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "grep -a -c 'symlinkSync(' scripts/context-io.test.ts → 0 (was 10); grep -a -c 'stageSymlinkOrSkip(' → 13 (was 4); grep -a -c 'process.platform' → 0"
        status: pass
      - kind: other
        ref: "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT='symlink to a regular file (CONTROL — it resolves to one)' npx vitest run --exclude '**/scripts/e2e/**' --reporter=verbose scripts/context-io.test.ts → 663 passed, 35 SKIPPED rows"
        status: pass
      - kind: other
        ref: "npm run check:platform-shapes → SKIPPED SHAPES (0), ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D4
    description: "W-21 and W-28 are green on the windows-latest leg of the next pushed run"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Both mechanisms are reproduced on darwin (the cwd VALUE seam in-child; the raw-open premise `threw EISDIR` beside the host-independent arm), but the leg's conclusion is measured only by plan 33-20's pushed run"

# Metrics
duration: 35 min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 16: W-21 and W-28 closed in the module, every symlink fixture D-16-guarded, cell exported Summary

**The two context-io windows reds that were MODULE defects are host-independent at the point the module reads its input — `trustedRepoRoot` walks from `canonicalWorkingDirectory(process.cwd())` (rung 1 `realpathSync.native`, the same authority as tier 0's delivered root) so a cwd spelled through a directory symlink names the target on win32 as on darwin, and `appendRegularFileLine` classifies a GOV-02 ledger position by TYPE before any open so a directory, FIFO or device answers `not-a-regular-file` with one bounded-refusal sentence everywhere instead of whichever arm the host's open call happened to fail into; every directory-symlink fixture in the test file is staged through `stageSymlinkOrSkip` (10 → 0 raw `symlinkSync`, 4 → 13 helper sites, 35 counted rows under the seam), and `cell` is the one exported escaping authority.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-20T23:14:41Z
- **Completed:** 2026-09-20T23:49:49Z
- **Tasks:** 3 (Tasks 1 and 2 red-first: RED + GREEN commits each; Task 3 one commit; plus one chore and one refactor)
- **Files modified:** 5 (`scripts/context-io.ts` +88/-7 lines, `scripts/context-io.js` rebuilt, `scripts/context-io.test.ts` +424/-52, `hooks/hook-entry.ts`/`.js` manifest region)

## Accomplishments

- **Task 1 (W-21).** `canonicalWorkingDirectory(raw)` is exported (a one-line wrapper over `canonicalDirectoryPath`, with the reason in its docblock) and `trustedRepoRoot` reads `cwd = canonicalWorkingDirectory(process.cwd())` on the READ line inside its `try`. The anchored line `const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);` and the loop's first element are byte-identical: `grep -a -c` → `1`; `git diff HEAD~ -- scripts/context-io.ts` has zero hunk lines touching either anchor. CELL 2's comment now states the true reason the exclusion holds (the walk canonicalises its start, not a POSIX-only kernel behaviour) and its link goes through the corpus helper with the CASE cell still measured on a skip.
- **Task 2 (W-28).** `appendRegularFileLine` `statSync`s the position first; a present entry that is not a regular file throws `not-a-regular-file` without an `openSync` on any host. The post-open `fstatSync` guard's logic is unchanged and now answers only a position that changed type between the two calls. Both arms' sentences carry `refused rather than waited on` (`grep -a -c` → `2`); the type arm keeps its "writing to a FIFO or a device can block forever" reason and is stated once for both of its throw sites. The docblock records the two-hosts-two-arms history.
- **Task 3 (D-16).** Ten `symlinkSync(` sites → 0 (the import is gone too); `stageSymlinkOrSkip(` 4 → 13. Shape names say what is linked: `directory symlink to a context store` (admitViaCli, the three 31-22 store links), `directory symlink to a kit home` (CELL 2, INVARIANCE 4), `directory symlink to a home directory` (ADJACENCY), `directory symlink to a project's parent` (Test W), `symlink to a factory config file` (the two config reads), `symlink to a git directory` (the two 31-37 corpus rows, built without a refused row). No `it.skip`, no `process.platform` read (file count 0).
- **33-15's note.** `cell` is exported; `rendererCell = mod.cell` — one escaping authority, no source-quoted twin.
- **Gates on the final tree.** `npx tsc --noEmit` exit 0; `npx tsc -p tsconfig.tests.json --noEmit` exit 0; `npx vitest run --exclude '**/scripts/e2e/**'` → `Test Files  78 passed (78)`, `Tests  5375 passed | 2 skipped (5377)`, `Duration  489.65s`, exit 0, zero `Test timed out` lines; `npm run check:nul-bytes` / `check:build-parity` / `node scripts/check-foundation-guards.js` / `check:platform-shapes` → `ALL CHECKS PASSED`; `freshness:hook-manifest` → `Hook manifest fresh: 2 decider(s), 26 module hash(es)`. `npm test` was not run.

## Task Commits

1. **Task 1 RED** — `f51c4d9a` `test(33-16): RED — Test W …` (RED evidence `RED_EVIDENCE_OK` / `target_test_failed`: `expected 'undefined' to be 'function'`)
2. **Task 1 GREEN** — `c1fca72b` `feat(33-16): GREEN — the trusted-root walk starts from the canonical working directory (W-21 …)`
3. **Task 2 RED** — `776afe47` `test(33-16): RED — Tests Y and Z …` (RED evidence `RED_EVIDENCE_OK` / `target_test_failed`: raw open `threw EISDIR`, module answered `could not be opened for append (EISDIR)`)
4. **Task 2 GREEN** — `d9ac6bdd` `feat(33-16): GREEN — a non-regular GOV-02 ledger position is refused by TYPE before any open …`
5. **chore** — `a2a13cd2` `chore(33-16): re-derive the hook manifest after context-io.js moved` (Rule 3, see Deviations)
6. **Task 3** — `feb2dd5e` `test(33-16): every directory-symlink fixture is staged through stageSymlinkOrSkip (D-16)`
7. **refactor** — `6a6e46d3` `refactor(33-16): export cell as the one cell-escaping authority; rendererCell becomes the import (33-15's note)`

**Plan metadata:** the final `docs(33-16)` commit.

TDD gate compliance: `test(33-16)` precedes `feat(33-16)` for both TDD tasks; both RED records (`3316-t1-record.json`, `3316-t2-record.json` in the scratchpad) returned `RED_EVIDENCE_OK` / `target_test_failed` from `gsd-tools check tdd-red-evidence`, with the `# tests/pass/fail` lines appended counted from the same tap-flat output and the full `file > describe > title` chain as `targetTest`. The one REFACTOR commit (`6a6e46d3`) is the `cell` export, not a cleanup of either GREEN.

## Task 1 — every arm that consumes the changed value, with its vitest line

Run: `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "R-31-19-07 re-measured|MONOTONICITY|THREE rungs|tier 0 OUTRANKS|BOUND: the ancestor walk|published step limit|W-21 \(33-16"` → `Tests  10 passed | 651 skipped (661)`, exit 0 (the plan's floor was 6).

| Arm | Title (tap-flat, all `ok`) | What was probed |
|---|---|---|
| the SYMLINK cell | `R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED` | driven against the committed `.js` through `drive()`; the CASE cell is unchanged (a case-differing spelling is rung 1's job on both sides already) |
| the new authority | `W-21 (33-16, Test W): the walk STARTS from the canonical working directory …` | fixed point on a canonical path; the link's target through the link; the walk in-child with `process.cwd` answering `<link>/proj` → `realpathSync.native(<real>/proj)`; the canonical cwd gives the same answer |
| the 31-15 mirror | `MONOTONICITY: no configuration moved from REFUSED to ADMITTED, on either host family` | the two anchors found exactly once, reverted, zero after; no case moved refuse → write |
| the 31-19 mirror | `MONOTONICITY: … against the pre-31-19 program` | green |
| the 31-23 mirror | `MONOTONICITY: no case moved from REFUSED to ADMITTED against the pre-31-23 program` | green |
| tier 0 subset | `MONOTONICITY: tier 0's accepted set is a STRICT SUBSET of tier 1's, over one value set` | green |
| tier ordering | `tier 0 OUTRANKS tier 1, which is the only reason it is a tier at all` | tier 0 still wins above the loop; the cwd read is below both |
| the three rungs | `the canonicaliser's THREE rungs are each driven, and the rung this platform used is named` | rung 1 used on darwin; the same ladder now spells the walk's start |
| the walk bound | `BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached` | `deepFixture` roots are `tmp15` = `realpathSync(mkdtemp)`; on darwin `/private/var` on both sides, so the answers compare equal through the canonicaliser (recorded: no `/var` vs `/private/var` disagreement surfaced because the fixtures were already realpath'd by 33-15) |
| the step limit | `the published step limit is the one the walk has, driven from the sentence itself` | same |

Pre-fix reproduction (scratchpad `w21-probe.mjs` against the committed `.js` at `f51c4d9a`): `answer: …/link/proj | canonical proj: …/real/proj | equal: false`. After `c1fca72b`: `equal: true`.

## Task 2 — the premise, the arm, every write-side assertion

The RED half's premise, quoted from the RED transcript: `raw open threw EISDIR (a module that opened first would answer through the `unopenable` arm)`, and the committed module's answer was `could not be opened for append (EISDIR) — it is refused rather than waited on` — the darwin arm CI row W-28 predicts is the *other* arm on win32. Post-fix the arm is `is not a regular file — it is refused rather than waited on, because writing to a FIFO or a device can block forever …` on this host, and the premise line is still printed as a reading.

Run: `… -t "R-31-21-03|every planted condition reports its OWN arm|unopenable|not-a-regular-file|33-16 Test|CONTROL: a FIFO at the ledger path still|CONTROL: a DIRECTORY at the ledger path|FIFO at the ledger|R-31-21"` → 15 `ok`, 0 `not ok`:

- `31-21 CONTROL 4 … > EACCES: a present-but-unopenable config is `unreadable` (fail closed), never absent` (read side, control)
- `31-21 — a non-regular GOV-02 ledger position refuses the ADMISSION, in bounded time > appendNote: a FIFO at the ledger REFUSES in bounded time and writes no note`
- `… > admitAndAppend: a FIFO at the ledger REFUSES in bounded time and writes no note`
- `31-29 — CR-19 … > CONTROL: a FIFO at the ledger path still refuses by SHAPE, not by ceiling (31-21)` — expectation moved to the type arm, recorded in the case
- `… > CONTROL: a DIRECTORY at the ledger path reaches the TYPE arm, `not-a-regular-file` (31-21; re-homed by 33-16)`
- `… > 33-16 Test Y (W-28) …` and `… > 33-16 Test Z (W-28) …`
- `31-29 — the write path's residuals … > R-31-21-02 and R-31-21-04 record what THIS round closed, and what it did not`
- `31-33 — CR-24 … > PREMISE: `chmod 000` denies a read to this process, so the unopenable arm is measurable here`
- `31-33 — CR-24 … > every planted condition reports its OWN arm, read from the authority's discriminant` (the read-side `readRegularFileOrNull` control — unchanged function, still five arms)
- `31-33 — CR-24 … > CONTROL 3 (R-31-21-02 unmoved): one planted FIFO does not deny render or currentState`
- `31-41 … > R-31-21-01's / R-31-21-02's / R-31-21-03's / R-31-21-04's published shape AGREES with the reading its probe takes`

`scripts/context-io-writer-set.test.ts` + `scripts/nonblocking-reader-parity.test.ts`: 219 passed (the import-alphabet pin stays at 14; the read-side parity corpus unchanged).

## Task 3 — the derived set, before and after

| Count | Before (HEAD at dispatch) | After |
|---|---|---|
| `grep -a -c 'symlinkSync(' scripts/context-io.test.ts` | 10 (L428, L4143, L8044, L8171, L9929, L10896, L10904, L10922, L11819, L11821) | 0 — and the `symlinkSync` import line is removed, so the name occurs 0 times in the file |
| `grep -a -c 'stageSymlinkOrSkip(' scripts/context-io.test.ts` | 4 (the import, GREEN 1c, the CR-24 `vanished` plant, one more) | 13 |
| `grep -a -c 'process.platform'` / `it.skip(` added | 0 / 0 | 0 / 0 |

Seam proof (`GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT='symlink to a regular file (CONTROL — it resolves to one)'`, `--reporter=verbose`): `Tests  663 passed (663)`, 35 `SKIPPED shape=` rows — 19 from `admitViaCli` (thirteen `(t)`, six named tasks), 4 from the CR-24 `vanished` plant, 2 + 2 from the 31-37 corpus rows (both routes), and one each from Test W, CELL 2, INVARIANCE 4, GREEN 1c, ADJACENCY home, ADJACENCY (a) (its (b)/(c) sit behind (a)'s return), and the two config-file reads. Without the seam: 0 rows, 663 passed. `npm run check:platform-shapes` → `HOST CAPABILITIES (3)` all present, `DRIVEN (13)`, `SKIPPED SHAPES (0): (none) — this platform constructed every shape in the corpus`, `ALL CHECKS PASSED` (the remainder is unchanged on darwin, as the plan predicted; the windows runner holds the privilege, so its rows stay absent there too — the guard is for hosts without it).

## Files Created/Modified

- `scripts/context-io.ts` — `canonicalWorkingDirectory` (exported, docblocked); the cwd read line in `trustedRepoRoot` and one sentence added to the ANCHORED comment; `appendRegularFileLine`'s pre-open `statSync` classification, the one-sentence `notRegularFile()` factory, the docblock's W-28 history; `cell` exported.
- `scripts/context-io.js` — rebuilt in each module commit (parity green after each).
- `scripts/context-io.test.ts` — Test W (31-27 tier block), Tests Y and Z (31-29 CR-19 block), the two CR-19 CONTROLs corrected, CELL 2's comment and link, thirteen `stageSymlinkOrSkip` sites, `admitViaCli` → `null` on a refused link with nine callers returning, `rendererCell = mod.cell`, `openSync`/`closeSync`/`constants` imported, `symlinkSync` import removed.
- `hooks/hook-entry.ts` / `.js` — the generated manifest region re-derived twice (after `d9ac6bdd`'s module change and after the `cell` export).

## Decisions Made

See `key-decisions` in the frontmatter. The two beyond the plan's letter: one `statSync` instead of `lstatSync` + `statSync` (no new node:fs binding, the resolved type is the one that matters), and the type arm's sentence stated once for both of its throw sites (the fstat guard's logic untouched).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The frozen hook manifest refused the rebuilt `scripts/context-io.js`**
- **Found during:** Task 3 (the first full-file run) — `31-37 WR-36 … route 0 (Bash)` / `route 1 (mcp__grugops__.*)` failed with `Blocked (fail-closed): the grugops hook module "scripts/context-io.js" does not match the frozen manifest`.
- **Issue:** `hooks/hook-entry.ts` carries a generated hash manifest over the decider's import closure; any change to `context-io.js` invalidates it, and `hooks/hook-entry.*` is not in this plan's `files_modified`.
- **Fix:** `npm run generate:hook-manifest` (2 deciders, 26 module hashes) after each module change; `npm run freshness:hook-manifest` fresh.
- **Files modified:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** the two 31-37 cases green; `freshness:hook-manifest` → fresh; full suite green.
- **Committed in:** `a2a13cd2` (chore) and `6a6e46d3` (folded into the refactor commit whose `.js` change required it).

**2. [Plan-letter adjustment] Test Z's `unopenable` fixture**
- **Found during:** Task 2, writing Test Z.
- **Issue:** the plan's "a position whose parent directory does not exist → `unopenable`" cannot reach the arm: `appendAuditLedger` runs `mkdirSync(auditDir, { recursive: true })` before the append, so a missing parent is created and the append succeeds (and a FILE planted at the parent's position fails in `mkdirSync`, not in the arm).
- **Fix:** a mode-0 REGULAR file at the ledger position — the type classification passes it and the open fails EACCES — on the chmod-000 capability measurement with a printed row where the host does not enforce mode bits (the 31-21 CONTROL 4 idiom).
- **Verification:** Test Z green; message `could not be opened for append (EACCES) — it is refused rather than waited on`.
- **Committed in:** `776afe47` / `d9ac6bdd`.

**3. [33-15's note, orchestrator-directed] `cell` exported and imported**
- Not a task of this plan, but the 33-15 PLAN assigned "that edit belongs to plan 33-16 (the module's plan)" and the dispatch asked for it when in scope. Both files are in this plan's `files_modified`; done as its own `refactor(33-16)` commit (`6a6e46d3`).

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking), 1 fixture adjustment inside the plan's stated behaviour, 1 directed addition.
**Impact on plan:** none on scope; the manifest re-derivation is the repository's standing consequence of moving the decider (31-43 did the same), recorded here so 33-20's pushed run does not meet a stale manifest.

## Issues Encountered

- The first full-suite run was started before the `cell` refactor was committed and I edited the tree while it ran; it reported two artefact reds (the CR-24 case reading `mod.cell` from a not-yet-rebuilt `.js`, and `freshness.test.ts` seeing an uncommitted `.ts`). Discarded; the run quoted above is the second, on the final committed tree, with the working tree clean throughout.
- `check:build-parity` compares the working tree's `.js` to HEAD, so it is green only after the module commit; each GREEN commit was followed by the parity run (all `ALL CHECKS PASSED`).

## Threat Flags

None — no new network endpoint, auth path or schema. The two module changes narrow behaviour (T-33-80, T-33-81 mitigated as planned): the walk cannot start from a link spelling, and a non-regular ledger position is refused before a descriptor exists.

## Known Stubs

None.

## Ledger state (for plan 33-23)

- WINDOWS.md row 226 (the context-io ten): W-21 addressed here by mechanism (the last module member); row 234 (W-27/W-28): W-28 addressed here, W-27 by 33-15 — both rows flip only on plan 33-20's pushed run reading green.
- `deferred-items.md` "The directory-symlink fixtures in `scripts/context-io.test.ts` … are not D-16-guarded": every site is routed; ready to mark `status: resolved` by plan 33-23 (not edited here).

## Next Phase Readiness

- Plan 33-20's pushed run measures W-21 and W-28 on windows-latest; the mechanisms are host-independent by construction and reproduced on darwin.
- Anyone rebuilding `scripts/context-io.js` must re-run `npm run generate:hook-manifest`; the 31-37 corpus cases are the tripwire.

## Self-Check: PASSED

- `scripts/context-io.ts` exports `canonicalWorkingDirectory` (1) and `cell` (1); `grep -a -c 'refused rather than waited on'` → 2; the anchored line count → 1.
- `scripts/context-io.test.ts`: `symlinkSync` 0, `stageSymlinkOrSkip(` 13, `process.platform` 0, `rendererCell = mod.cell` 1.
- Commits `f51c4d9a`, `c1fca72b`, `776afe47`, `d9ac6bdd`, `a2a13cd2`, `feb2dd5e`, `6a6e46d3` are on `main`; `git rev-list --count 19a7c8af..HEAD` → 7.
- No file deletion in any commit; `git status --short` clean outside `.planning/`.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*
