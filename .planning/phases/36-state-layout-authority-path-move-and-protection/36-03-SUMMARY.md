---
phase: "36"
plan: "03"
subsystem: installer
tags: [state-layout, installer, migrate, handoffs, typescript, tests]

requires:
  - phase: 36
    provides: "install/state-layout.ts (LEGACY_HANDOFFS_REL, LEGACY_STATE_ROOT_REL) and scripts/state-path-scan.js from plan 36-01; the seed move from plan 36-02, after which a fresh install creates no pre-v3 state root"
provides:
  - "install.ts migrateHandoffs backs up join(TARGET, LEGACY_HANDOFFS_REL) with the label `${LEGACY_HANDOFFS_REL}/`, and the three --migrate lines about it are template literals from the constant. Each printed line is byte-identical to the HEAD installer's."
  - "No install/*.ts or install/*.js outside the authority spells the pre-v3 root: the state-path scan over install/ exits 0 over 56 files"
  - "The closing-claims handoffsBackups helper reads only ENOENT and ENOTDIR as absent, and B4 asserts the ENOTDIR arm"
affects: [36-06, 36-09, 36-12, 36-13, 36-14, phase-38]

actuals:
  tokens: 15800
  tasks: 2
  commits: 2
plan_head_before: 3c6be53cd678dd75fc6e83b0f143f0db15738e5c
plan_head_after: abc89add06ac963507163fb3942aab622b8216ce

tech-stack:
  added: []
  patterns:
    - "A user-visible line that names a state path is a template literal from the state-layout constant, so moving the spelling does not move the output; message-references rows then hold the literal's tail fragment"
    - "A test that matches a constant in a regular expression escapes it first (escapeRe in closing-claims.test.ts)"
    - "A test helper that lists a directory that may be missing reads only ENOENT and ENOTDIR as empty and rethrows any other error"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/message-references.test.ts
    - install/closing-claims.test.ts
    - install/agents-record.test.ts
    - install/ledger.test.ts

key-decisions:
  - "The legacy handoffs directory keeps its pre-v3 location (it is the old relay's directory, which --migrate backs up where it lies); only its spelling moved to LEGACY_HANDOFFS_REL"
  - "The message-references would-backup row now holds the template literal's tail fragment `/ (see the would-backup line above). Nothing was changed.`. The fragment count and the class counts did not change, so no count was re-derived. The row records the reason with the date (2026-10-21, plan 36-03)."
  - "install/installer-paths.test-support.ts is listed in files_modified, but it had no pre-v3 spelling left after plan 36-02, so it is unchanged"
  - "Test titles that named the handoffs directory are now template literals from LEGACY_HANDOFFS_REL. The titles read the same, and the `-t \"MIGR-04\"` filter still matches them."

patterns-established:
  - "Proving an output is unchanged: run the HEAD tree (git archive into a scratch dir) and the working tree on the same fixture with scratch GRUGOPS_HOME and HOME, mask the run-specific paths and ISO stamps, and diff"

requirements-completed: [LAYOUT-02]

coverage:
  - id: D1
    description: "migrateHandoffs backs up join(TARGET, LEGACY_HANDOFFS_REL), and every printed line about the legacy handoffs directory is byte-identical to the line printed before this plan"
    requirement: LAYOUT-02
    verification:
      - kind: integration
        ref: "install/install.test.ts -t MIGR-04 (4 cases: backup, idempotent, DRY_RUN, never-clobber)"
        status: pass
      - kind: integration
        ref: "install/message-references.test.ts (28 tests)"
        status: pass
      - kind: other
        ref: "scratchpad compare-handoffs.sh: HEAD installer vs working-tree installer, real and DRY_RUN already-migrated --migrate with a planted handoffs dir; the whole normalized output is identical in both modes"
        status: pass
      - kind: other
        ref: "grep -c 'LEGACY_HANDOFFS_REL' install/install.ts (prints 11)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No installer source or test outside the authority spells the pre-v3 root"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js 'install/*.ts' 'install/*.js' ':!install/state-layout.ts' ':!install/state-layout.js' (exit 0, 56 files; 105 sites in 7 files at plan start)"
        status: pass
      - kind: integration
        ref: "install/closing-claims.test.ts, install/agents-record.test.ts, install/ledger.test.ts (307 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The closing-claims handoffsBackups helper returns [] for an absent or non-directory pre-v3 root (ENOENT or ENOTDIR) and rethrows any other error; B4 asserts [] over a regular file"
    requirement: LAYOUT-02
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#B4 installed target whose plans is a regular file: a verify line, the migrate INCOMPLETE banner, exit 3, no no-change sentence"
        status: pass
      - kind: other
        ref: "mutation: dropping the ENOTDIR arm turns B4 red (ENOTDIR: not a directory, scandir .../t/plans); restored, B4 passes"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 03: The installer names the legacy handoffs directory and the pre-v3 root only through the authority Summary

**install.ts now backs up `join(TARGET, LEGACY_HANDOFFS_REL)` and builds its three --migrate handoffs lines from that constant. The output is byte-identical to the HEAD installer's, compared on a real and a DRY_RUN run. Every remaining installer test spells the pre-v3 root through `LEGACY_HANDOFFS_REL` or `LEGACY_STATE_ROOT_REL`, and the state-path scan over install/ is at zero (it started at 105 sites).**

## Performance

- **Duration:** 18 min
- **Started:** 2026-10-21T07:19:25Z
- **Completed:** 2026-10-21T07:37Z
- **Tasks:** 2 (a tracer and one auto task)
- **Files modified:** 7

## Accomplishments

- **install.ts (Task 1, tracer).**
  - `migrateHandoffs` calls `backupDir(join(TARGET, LEGACY_HANDOFFS_REL), `${LEGACY_HANDOFFS_REL}/`, "handoffs")`.
  - Three lines name the directory through the constant: the nothing-was-migrated pre-check report, the DRY_RUN would-back-up closing and the backed-up closing.
  - Eleven comments that spelled the pre-v3 root now name a constant, or say "the pre-v3 state root" or "the legacy handoffs directory". The header contract line now names the STATE_ROOTS list.
  - `grep -c LEGACY_HANDOFFS_REL install/install.ts` prints 11 (the baseline was 0).
- **Byte-identical output, measured.** The HEAD tree was extracted with `git archive` into a scratch directory. On the same fixture, the HEAD installer and the working-tree installer each ran a plain install and then an already-migrated `--migrate` with a planted handoffs directory, once real and once under DRY_RUN. Each run had its own scratch `GRUGOPS_HOME` and `HOME`. After masking the run-specific root path and the ISO stamp, the whole `--migrate` output is identical in both modes. The handoffs lines are `backed-up      plans/handoffs/ → .../plans/handoffs.bak.<ISO>` and `This run backed up plans/handoffs/ to plans/handoffs.bak.<ISO> and recorded the backup in .grugops/install.json.`, plus `DRY_RUN: this run would back up plans/handoffs/ (see the would-backup line above). Nothing was changed.` under DRY_RUN.
- **install.test.ts.** The four MIGR-04 cases plant, glob and assert through `LEGACY_HANDOFFS_REL` and `LEGACY_STATE_ROOT_REL`. What they assert is unchanged. The CR-04, update and prune comments name the roots in prose.
- **message-references.test.ts.** The would-backup REFERENCE_TABLE row follows the template literal's tail fragment, with a dated reason. The per-module and per-class counts did not move.
- **Remaining installer tests (Task 2).** closing-claims, agents-record and ledger name the handoffs directory, its backups and the pre-v3 root through the constants. The two regular expressions in closing-claims (B3, B5) are built with an escaped constant.
- **The listing helper.** This is the helper and the B4 assertion, quoted from `install/closing-claims.test.ts`:

  ```ts
  const handoffsBackups = (target: string): string[] => {
    let names: string[];
    try {
      names = readdirSync(join(target, LEGACY_STATE_ROOT_REL));
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ENOTDIR") return [];
      throw e;
    }
    const prefix = `${basename(LEGACY_HANDOFFS_REL)}.bak.`;
    return names.filter((e) => e.startsWith(prefix)).map((e) => `${LEGACY_STATE_ROOT_REL}/${e}`);
  };
  ```

  ```ts
  expect(lstatSync(join(target, LEGACY_STATE_ROOT_REL)).isFile(), "premise: the pre-v3 state root is a regular file").toBe(true);
  expect(handoffsBackups(target), "a pre-v3 state root that is a regular file (ENOTDIR) lists no handoffs backup").toEqual([]);
  ```

  Mutation check: with the ENOTDIR arm removed, B4 fails with `ENOTDIR: not a directory, scandir '.../t/plans'`. With the arm restored, it passes.

## Task Commits

1. **Task 1: tracer, install.ts names the legacy handoffs directory only through the authority, with unchanged output**: `97c610c0` (feat).
   - Tracer gate (interactive, `end-of-phase`, automated-only verify): the verify was re-run end to end and passed before Task 2 started. The build and typecheck pass, message-references passes 28/28, MIGR-04 passes 4/4, and the scan over install.ts, install.js and install.test.ts exits 0.
2. **Task 2: the rest of the installer tests spell state paths through the authority**: `abc89add` (test).

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Verification scope

**1. `npx vitest run install/` as a whole was not run (orchestrator rule)**
- **Found during:** Task 2's acceptance criteria.
- **Issue:** The plan's must_haves and Task 2 acceptance ask for one `npx vitest run install/` run. The orchestrator's project rules for this dispatch say to run individual test files, not the whole install/ directory (about 14 min), and the orchestrator schedules full runs at plans 06, 10 and 14.
- **What was run instead:** every changed test file, plus every install/ and scripts/ test that reads or imports a changed file.
  - install/install.test.ts (whole file), message-references, closing-claims, agents-record and ledger.
  - agent-flag-census, host-tools, host-tools-prose, installer-fs-census, installer-marker-retention, kit-route, mode-census, path-spelling-census and state-layout.
  - scripts/state-path-scan, board-read, check-foundation-guards, generate-role-adapters, model-dial-consistency and runnable-ref/uat-spec-integrity.
- **Result:** all green except the known DI-03 `openAsBlobSync` row in installer-fs-census (local Node v26 only, already in deferred-items.md). The whole-directory run is `UNKNOWN - verify` until plan 06's full run.

---

**Total deviations:** 1 (verification scope, set by the orchestrator). **Impact on plan:** none on the code. One acceptance run is deferred to the scheduled full run.

## Issues Encountered

- `install/installer-fs-census.test.ts` fails 1 test, the DI-03 `openAsBlobSync` row. The failure was there before this phase, is logged in deferred-items.md, and is unrelated to these changes.
- No other failures.

## Plan-level verification

1. `npx vitest run install/`: not run as a whole (see Deviations). The targeted runs are green except DI-03.
2. `npm run freshness` after the commits: exit 0 ("All build outputs fresh: 78 committed .js file(s) match a rebuild of their sources").
3. `node scripts/check-foundation-guards.js`, `node scripts/check-nul-bytes.js` and `node scripts/check-uat-oracles.js`: each exits 0.
4. `git branch --show-current`: `main`.

Acceptance criteria:
- `grep -c 'LEGACY_HANDOFFS_REL' install/install.ts`: 11 (at least 4 required). PASS.
- MIGR-04 cases pass, and their printed lines are byte-identical (measured above). PASS.
- `node scripts/state-path-scan.js install/install.ts install/install.js install/install.test.ts`: exit 0. PASS.
- `node scripts/state-path-scan.js 'install/*.ts' 'install/*.js' ':!install/state-layout.ts' ':!install/state-layout.js'`: exit 0, 56 files. PASS.
- B4 asserts the helper returns `[]` over a regular file, and passes (quoted above). PASS.
- `npx vitest run install/`: see Deviations.

## User Setup Required

None.

## Next Phase Readiness

- install/ outside the authority is at zero sites, so plan 36-14's gate can count install/ as clean.
- install/README.md still spells the pre-v3 root; plan 36-09 owns it.
- LAYOUT-02 continues in later plans (the last contributor is 36-14), so it stays unchecked in REQUIREMENTS.md.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: install/install.ts, install/closing-claims.test.ts, .planning/phases/36-state-layout-authority-path-move-and-protection/36-03-SUMMARY.md
- FOUND commits: 97c610c0, abc89add
