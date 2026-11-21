---
phase: "36"
plan: "14"
subsystem: tooling
tags: [state-layout, old-spelling-gate, allow-list, ci, typescript, layout-02, layout-01]

requires:
  - phase: 36
    provides: scripts/state-path-scan.ts (36-01), the moved tree with zero old spellings outside the history files (36-02..36-13), docs/pre-v3-state-layout.md (36-09/36-13)
provides:
  - scripts/check-state-paths.ts (+ committed .js), the wired old-spelling gate with a per-file ALLOW_LIST, exit 0 / 1 / 2
  - check:state-paths in package.json and a repo-gate line in ci.yml
  - scripts/check-state-paths.test.ts, with live-tree, planted-site, converse, boundary, adjacency, clause, precision, exit-2, legacy-path, exclusion, ordering and LAYOUT-02 ownership cases
affects: [phase-37, phase-38, phase-40]

actuals:
  tokens: 12250
  tasks: 2
  commits: 2
plan_head_before: e1b394f9ebb74ded963fbd410dcffb6f228740f7
plan_head_after: 5fc4f807be510f6aae798abd4794a270c6fe484c

tech-stack:
  added: []
  patterns:
    - "A gate's allow-list is per file, each entry with a reason; the test asserts the converse (every entry live) and never the list's length"
    - "The gate is created, run read-only to prove zero outside, then wired at both ends in the same commit"

key-files:
  created:
    - scripts/check-state-paths.ts
    - scripts/check-state-paths.js
    - scripts/check-state-paths.test.ts
  modified:
    - scripts/state-path-scan.ts
    - scripts/state-path-scan.js
    - package.json
    - .github/workflows/ci.yml
    - install/mode-census.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The gate's exit code depends only on outside sites and outside legacy paths, as the plan states; a dead allow-list entry is red in the test (deadEntries over the live tree), not in the gate"
  - "scripts/state-path-scan.ts gained a scannedPaths field so each allow-list entry's matched-file count is read from the run instead of inferred from the files that hold sites"
  - "The CHANGELOG.md entry's reason also covers the v3.0 Unreleased entry, which names the pre-v3 layout it moves away from (4 of the file's 7 sites); that is release history, not a live path"
  - "The ownership check derives its source set with git ls-files over install/*.ts and scripts/*.ts (nested directories included) and leaves out .test.ts, .test-support.ts, .d.ts and /fixtures/ corpus files"
  - "LAYOUT-02 is marked complete. No budget exists anywhere yet (Phase 37 adds budgets to install/state-layout.ts), so the 'every budget' clause has nothing to own today"

patterns-established:
  - "An allow-list entry under an excluded prefix, or with an unreadable glob shape, makes the gate exit 2 instead of being silently dead"

requirements-completed: [LAYOUT-02, LAYOUT-01]

coverage:
  - id: D1
    description: "node scripts/check-state-paths.js exits 0 on the tree with outside totals 0, every count read from its run; it exits 1 on a planted site of each spelling and names it"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/check-state-paths.test.ts#the committed gate exits 0 and its outside totals, read from its output, are zero"
        status: pass
      - kind: unit
        ref: "scripts/check-state-paths.test.ts#one slash/segment/backslash plant outside the allow-list exits 1 and names it"
        status: pass
      - kind: other
        ref: "node scripts/check-state-paths.js (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The gate runs in CI and from package.json, and the foundation reachability cases pass"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#every scripts/check-*.js appears in ci.yml, or declares why not"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#pins each class's TARGET count, and the pinned counts sum to the targets that exist"
        status: pass
    human_judgment: false
  - id: D3
    description: "The allow-list cannot hold a dead entry, the gate cannot pass on an empty set, and its counts are occurrence counts after exact-clause subtraction"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/check-state-paths.test.ts (converse, boundary, adjacency, clause, precision, empty, paths, exclusion, ordering cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "LAYOUT-02 ownership: only install/state-layout.ts, scripts/kit-model.ts and scripts/generate-role-adapters.ts hold a literal containing STATE_ROOT_REL, and the nine named modules import state-layout.js"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/check-state-paths.test.ts#ownership: the new state root is spelled only by its authority and two declared carriers (LAYOUT-02)"
        status: pass
    human_judgment: false
  - id: D5
    description: "LAYOUT-01: no tracked file outside the allow-list and .planning/ names a pre-v3 path"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "node scripts/check-state-paths.js (exit 0, outside 0 sites, 0 legacy paths)"
        status: pass
    human_judgment: false

duration: 42min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 14: The wired old-spelling gate and the phase-close regression Summary

**`node scripts/check-state-paths.js` now fails CI on any slash, quoted-segment or backslash spelling of the pre-v3 state root outside a six-entry per-file allow-list (each entry with its D-04/D-09/D-10/D-16 reason). It names the `.planning/` exclusion, subtracts only the exact fallback clause, and prints every count from its own run. A separate test checks LAYOUT-02 ownership over derived source sets.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-10-21T11:22:02Z
- **Completed:** 2026-10-21T12:04:19Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `scripts/check-state-paths.ts` exports `ALLOW_LIST`, `evaluate(root, allowList)`, `deadEntries`, `matchesGlob`, `isReadableGlob` and `render`. A `/**` glob matches a directory at any depth. Any other glob is one exact path. `docs/audit/**` does not match `docs/audit-notes.md`.
- The gate was run read-only before it was wired: 0 sites and 0 legacy paths outside the allow-list, exit 0 (full output below). The same commit then added `check:state-paths` to package.json and a commented repo-gate line to ci.yml.
- The test file has 23 cases. One covers each behavior line in the plan, and each predicate has its own discrimination control.
- Phase-close regression: the full non-e2e suite has 20 failures, exactly the 20 known items in deferred-items.md, and none caused by this phase.

## Pre-wiring run (quoted in full)

At HEAD e1b394f9, with the three new files present but not yet committed, before package.json or ci.yml named the gate:

```
check-state-paths: sites spelling the pre-v3 state root, against the allow-list (D-09, D-10, D-16)
scanned 1184 file(s) of 3048 listed; 1864 excluded; 0 not on disk
excluded: .planning/ (planning records, excluded by name (D-11)): 1864 file(s) skipped
fallback clause: 42 exact occurrence(s) of LEGACY_FALLBACK_CLAUSE removed before counting (D-15); the files carrying it are not allow-listed
allow-list (declaration order):
  install/state-layout.ts: the authority names the pre-v3 root once (D-10); 1 file(s) matched; slash 0, segment 1, backslash 0; 1 site(s); 0 legacy path(s)
  install/state-layout.js: the committed build of the authority (D-10); 1 file(s) matched; slash 0, segment 1, backslash 0; 1 site(s); 0 legacy path(s)
  docs/audit/**: historical audit records, never rewritten (D-09); 71 file(s) matched; slash 216, segment 2, backslash 0; 218 site(s); 0 legacy path(s)
  CHANGELOG.md: release history; entries before v3.0 record what was true then (D-09); 1 file(s) matched; slash 7, segment 0, backslash 0; 7 site(s); 0 legacy path(s)
  docs/initial/**: the original specification, kept as history (D-16); 2 file(s) matched; slash 52, segment 0, backslash 0; 52 site(s); 0 legacy path(s)
  docs/pre-v3-state-layout.md: the user doc for the pre-v3 layout a repository may carry until v4.0 (D-04); 1 file(s) matched; slash 27, segment 0, backslash 0; 27 site(s); 0 legacy path(s)
inside the allow-list: slash 302, segment 4, backslash 0; 306 site(s) in 16 file(s); 0 legacy path(s)
outside the allow-list: slash 0, segment 0, backslash 0; 0 site(s) in 0 file(s); 0 legacy path(s)

== Result ==
PASS: 1184 file(s) scanned, zero sites and zero legacy paths outside the allow-list; 306 site(s) inside it, in 6 entr(ies)
ALL CHECKS PASSED
exit 0
```

After this run, and still before wiring, the CHANGELOG.md reason was reworded to also cover the v3.0 Unreleased entry (see Decisions). No count changed.

## Task Commits

1. **Task 1 (tracer): gate, read-only proof, wiring at both ends, pins**: `6b327fed` (feat). Tracer feedback gate: the Task 1 verify was re-run end-to-end (build, typecheck, gate exit 0, 3 test files with 338 tests passing) before expansion.
2. **Task 2: converse, boundary, ownership cases**: `5fc4f807` (test)

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Behavior cases (scripts/check-state-paths.test.ts, 23 of 23 pass)

| Behavior | Case | Status |
|----------|------|--------|
| live tree | the committed gate exits 0 and its outside totals, read from its output, are zero | pass |
| planted, per spelling | one slash / segment / backslash plant outside the allow-list exits 1 and names it (3 cases) | pass |
| converse | on the live tree, every entry matches at least one listed file and holds at least one site | pass |
| converse control | a scratch copy with a dead entry added fails the same predicate, naming only that entry | pass |
| D-16 | docs/design/shared-install.md is scanned like any other file and no entry matches it | pass |
| boundary | zero outside sites exits 0; exactly one planted site exits 1 | pass |
| boundary prefix | a site in docs/audit-notes.md is outside | pass |
| adjacency | the new root in its slash, backslash and escaped double-backslash forms exits 0 | pass |
| clause | an exact LEGACY_FALLBACK_CLAUSE outside the allow-list exits 0 | pass |
| clause + 1 | the same file plus one ordinary old spelling exits 1 and reports exactly 1 site | pass |
| precision | two sites on one line raise the outside total by 2 | pass |
| empty | a cwd that is not a git repository exits 2 with no ALL CHECKS PASSED line | pass |
| empty | a repository with no file exits 2 with no ALL CHECKS PASSED line | pass |
| paths | a committed file under a top-level pre-v3 directory exits 1 as a legacy path | pass |
| exclusion | a site under .planning/ is not counted; the output names the exclusion and its reason | pass |
| ordering | outside sites sorted by path then line, entries in declaration order, two runs byte-identical | pass |
| ownership premise | the derived source set holds every named module | pass |
| ownership | the literal holders of STATE_ROOT_REL are exactly the three, in both directions | pass |
| ownership control | the literal predicate sees a string and a template part, and ignores a comment | pass |
| ownership | each of the nine named modules imports state-layout.js | pass |
| ownership control | the import predicate refuses a specifier named only in a comment or a string | pass |

## TDD Gate Compliance

`workflow.tdd_mode` is false, and Task 2 carries `tdd="true"`. There was no valid RED. The Task 1 tracer had already delivered every Task 2 behavior, so the new cases passed on their first run. The one exception was a precision case I had written wrong: it failed on an arithmetic assertion and was corrected to the plan's wording. Because no RED existed, discrimination was checked by mutating the built `scripts/check-state-paths.js` and restoring it with `git checkout` on that one file:
- `/**` matching without the trailing slash: the docs/audit-notes.md case fails (1 of 23).
- Outside legacy paths dropped: the legacy-path case fails (1 of 23).
- `clean` forced true: 9 of 23 fail (the three plant cases, boundary, prefix, clause+1, precision, paths, ordering).
The converse and ownership cases have their own built-in controls. No `feat` commit follows the `test` commit, because there was no implementation left to write.

## Files Created/Modified

- `scripts/check-state-paths.ts` / `.js`: the gate (new).
- `scripts/check-state-paths.test.ts`: 23 cases (new).
- `scripts/state-path-scan.ts` / `.js`: `ScanResult.scannedPaths` added; `scanned` is now its length.
- `package.json`: `check:state-paths`.
- `.github/workflows/ci.yml`: `node scripts/check-state-paths.js` after check-nul-bytes, with a block comment.
- `install/mode-census.test.ts`, `scripts/check-foundation-guards.test.ts`: pins re-derived (see below).

## Pins moved (each re-derived by listing, with a dated reason)

| File | Pin | Move |
|------|-----|------|
| install/mode-census.test.ts | SCRIPTS_TEST_FILE_COUNT | 74 -> 75 |
| scripts/check-foundation-guards.test.ts | NON_TEST_MODULE_COUNT | 100 -> 101 |
| scripts/check-foundation-guards.test.ts | TRIPWIRE_MODULES | 74 -> 75 (not named in the plan) |
| scripts/check-foundation-guards.test.ts | scripts-scoped reader corpus, two sites and 64*3 | 64 -> 65 (not named in the plan) |
| scripts/check-foundation-guards.test.ts | CHECK_SCRIPT_CLASSES gate-module targets | 11 -> 12 (not named in the plan) |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The scan core did not expose the scanned path list**
- **Found during:** Task 1
- **Issue:** The gate prints how many files each allow-list entry matches, and the converse needs the same number. `scanTracked` returned only files that hold sites, so an entry that matched a file with no site could not be told apart from an entry that matched no file.
- **Fix:** `ScanResult.scannedPaths` (sorted, the files read and counted). `scanned` is now its length. The CLI output is unchanged.
- **Files modified:** scripts/state-path-scan.ts, scripts/state-path-scan.js
- **Verification:** scripts/state-path-scan.test.ts passes (run with the Task 1 file set); `npm run freshness` passes.
- **Committed in:** 6b327fed

**2. [Rule 3 - Blocking] Three more pins than the plan named**
- **Found during:** Task 1
- **Issue:** Adding a gate module and a test module also turned TRIPWIRE_MODULES, the scripts-scoped reader corpus (two assertions) and the gate-module class target count red.
- **Fix:** Each was re-derived and moved with a dated reason (table above).
- **Committed in:** 6b327fed

**3. [Rule 2 - Missing critical] An unreadable or unreachable allow-list entry stops the gate**
- **Found during:** Task 1
- **Issue:** Some entries could never match: a glob with a shape the matcher does not read, an entry with no reason, or an entry under the excluded `.planning/`. Each would silently remove nothing while appearing to remove something.
- **Fix:** `evaluate` throws a ScanError (CLI exit 2) for each case. This is also where SCAN_EXCLUSIONS is read (the plan's key link).
- **Committed in:** 6b327fed

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical). **Impact on plan:** no scope creep. No allow-list entry was added beyond the plan's six.

## Issues Encountered

**Phase-close full regression.** One run of `npx vitest run --exclude '**/scripts/e2e/**'` at 5fc4f807, 2026-10-21T11:34:15Z to 12:03:40Z, duration 1763.99 s:
- Totals: 6 files failed, 112 passed (118); 20 tests failed, 8569 passed, 2 skipped (8591).
- The 20 failures match deferred-items.md one for one: context-io 7, context-io-writer-set 2, uat-gate-exit-contract 5, harness-instance-ledger 4, canonical-corpus 1 (all ENOENT on archived phase-27/31 records), and installer-fs-census 1 (`openAsBlobSync`, DI-03, local Node v26).
- No failure was caused by this phase. install/agents-record.test.ts, which 36-13 re-pinned, does not appear among the failures.
- The plan's acceptance line "finishes with 0 failed tests" is therefore not met literally. The 20 failures are the known out-of-scope set and are not fixed here.

**Plan-level verification:**
1. `node scripts/check-state-paths.js`: exit 0, outside totals 0.
2. `npm run freshness`, `freshness:catalog`, `freshness:context`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries`, `freshness:guarantees`, `freshness:hook-manifest`: each exit 0.
3. `npm run generate:adapters && test -z "$(git status --porcelain -- .claude/agents/)"`: exit 0.
4. check-foundation-guards, check-kit-refs, check-public-docs-vocabulary, check-audit-register, check-claim-anchors, check-banned-claims, check-imperative-lexicon, check-nul-bytes, check-residual-citations, `VALIDATE_KIT_ROOT=. validate-agent-factory`, check-uat-oracles: each exit 0 with ALL CHECKS PASSED.
5. Already red before this phase, so not this phase's regressions:
   - `node scripts/check-diff-disposition.js`: exit 1, "569 finding(s) over 40 elements" (watched role/workflow clause changes since base 4d2b8f0 with no disposition row; this plan touched no watched file).
   - `node scripts/check-flip-manifest.js`: exit 1, no verdict (the phase-33 flip manifest is absent from `.planning/phases/`).
6. `test ! -e plans && git branch --show-current`: `main`.

## Requirements

- **LAYOUT-02:** marked complete. The gate fails on any old spelling in all three forms outside a named allow-list, with derived counts, and runs in CI. The ownership cases check that readers, writers, the validator, the installer and the uninstaller import the authority, and that only the authority and the two declared carriers spell the new root. "Every budget" holds only because no budget exists yet; Phase 37 adds them to install/state-layout.ts.
- **LAYOUT-01:** marked complete. The gate at exit 0 shows that no tracked file outside the allow-list and `.planning/` names a pre-v3 path. Earlier plans moved the seed, roles, workflows, tooling and docs, and added the `uat` subpath (D-17).
- LAYOUT-04 is not touched; it waits on the human live-session check from 36-13.

## User Setup Required

None.

## Next Phase Readiness

- All 14 plans of Phase 36 are executed. The phase awaits the orchestrator's verifier and the LAYOUT-04 human check; it is not complete until those pass.
- Phase 37 adds budgets to install/state-layout.ts. Any new state path must go through the constants or the gate turns red.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: scripts/check-state-paths.ts, scripts/check-state-paths.js, scripts/check-state-paths.test.ts
- FOUND commits: 6b327fed, 5fc4f807
