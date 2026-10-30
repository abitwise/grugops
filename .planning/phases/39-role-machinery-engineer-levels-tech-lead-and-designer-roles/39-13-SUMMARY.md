---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 13
subsystem: installer
tags: [installer, install-ledger, retired-adapter, engineer-levels, changelog, review-disposition, gap-closure, WR-06]
status: complete

requires:
  - phase: 39
    provides: "retired-adapter report (39-10), level adapters (39-07), 39-11 and 39-12 gap closure"
provides:
  - "install, --dry-run and install.js --check print one `note` per unshipped `.claude/agents/grugops-*.md` file the install ledger cannot vouch for; report only, exit status unchanged"
  - "one hoisted adapter-path pattern and one shipped rule shared by the ledger path and the presence path"
  - "factory.config.md holds the one count-free list of run-time settings that can flatten the levels, now with the mod `agent.spawn` hook and its source"
  - "install/README.md names the flattening settings only and points to factory.config.md"
  - "CHANGELOG.md [Unreleased] Added / Changed / Removed lines for Phase 39; no version picked"
  - "39-REVIEW-DISPOSITION.md: 15 fixed, 3 deferred with reasons, open: 0"
affects: [phase-39-verification, phase-40, phase-41, phase-42, TIER-06, TIER-02, TIER-03]

actuals:
  tokens: 15300
  tasks: 3
  commits: 6
plan_head_before: c46641c76f68adbebef9f1b9b5ac25717e77f6d7
plan_head_after: 9770a05a42450b2aafa2d41aacf82aada9d98a77

tech-stack:
  added: []
  patterns:
    - "A report the install ledger cannot answer becomes a presence `note` derived from the target directory, the kit source and the render; it never deletes, records or moves the exit status"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/agents-record.test.ts
    - install/README.md
    - agent-factory/config/factory.config.md
    - CHANGELOG.md
    - scripts/tier-kit-text.test.ts
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-DISPOSITION.md

key-decisions:
  - "39-13: an unshipped grugops adapter the install ledger has no kit-true record of is named in a `note`, not a counted `verify`, so a pre-v2.2 upgrade keeps its exit status; the note repeats on every run until the file is gone (WR-06)"
  - "39-13: IN-04 deferred to Phase 42 doctor work, IN-05 to Phase 41, IN-06 to Phase 40, each with its reason in 39-REVIEW-DISPOSITION.md"
  - "39-13: a test literal that tips the validate.test.ts ticket-reader census is reworded (the 32.1-04 precedent), not exempted"

patterns-established:
  - "Test assertions over README prose avoid spelling both ticket key words in one file; split a sentence at a neutral word instead of adding a census exemption"

requirements-completed: [TIER-06, TIER-02, TIER-03]

coverage:
  - id: D1
    description: "install, --dry-run and --check name every unshipped grugops adapter the ledger cannot vouch for in a note, leave its bytes alone, record nothing and keep the clean run's exit status; a ledger-recorded one keeps only its verify / FAIL line"
    requirement: TIER-06
    verification:
      - kind: integration
        ref: "install/install.test.ts -t \"no longer ships\" (13 cases: 7 from 39-10, 6 from 39-13)"
        status: pass
      - kind: unit
        ref: "install/agents-record.test.ts (REMOVAL_EXEMPT, DOCTOR_REACH_SIZE 65, WR24_REACH_SIZE 56 moved by measurement)"
        status: pass
      - kind: other
        ref: "grep -cE \"unlinkSync|rmSync\" install/install.ts prints 16"
        status: pass
    human_judgment: false
  - id: D2
    description: "install/README.md says when a note replaces the verify / FAIL (v2.1 or earlier, absent or unreadable ledger), confirmed against the v2.1 and v2.2 tags"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-06: a repository the install ledger cannot vouch for gets a `note` for each unshipped adapter, and §6 names both report forms"
        status: pass
    human_judgment: true
    rationale: "Whether the README wording reads clearly to an upgrading user and claims nothing grugops lacks is a reading judgment (plan backstop truth)"
  - id: D3
    description: "One count-free list of run-time flattening settings in factory.config.md, including the mod agent.spawn hook with source and read date; the README names and points"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#T-39-11 / WR-09: the run-time flattening paths are named, the mod hook among them with its source, and no enforcement is claimed"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-09: the flattening paragraph names the settings and points to factory.config.md for how each works"
        status: pass
    human_judgment: false
  - id: D4
    description: "CHANGELOG [Unreleased] names the Tech Lead, Designer, rubric, three level adapters (junior floor v2.1.293), skills: key, the pin change and the removed grugops-software-engineer adapter with its hand-delete remedy; no version picked"
    requirement: TIER-03
    verification:
      - kind: other
        ref: "sed -n '/^## \\[Unreleased\\]/,/^## \\[/p' CHANGELOG.md | grep -c '^### Removed$' prints 1; MAJOR/MINOR/version grep prints 0"
        status: pass
    human_judgment: true
    rationale: "Release-note clarity for an upgrading user, and the SemVer level, are human judgments"
  - id: D5
    description: "All 18 review findings carry a disposition; the phase gate matches the recorded baseline"
    verification:
      - kind: other
        ref: "grep -c '^open: 0$' 39-REVIEW-DISPOSITION.md prints 1; 15 fixed rows; 3 deferred info rows"
        status: pass
      - kind: other
        ref: "timeout 1800 npx vitest run --exclude '**/scripts/e2e/**' — 20 failed | 10660 passed | 2 skipped, all 20 in the six deferred-items.md files"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js prints 721 finding(s)"
        status: pass
    human_judgment: false

duration: 1h 25m
completed: 2026-10-30
---

# Phase 39 Plan 13: Unrecorded-adapter note, one flattening list, Phase 39 release notes, last review dispositions Summary

**install, `--dry-run` and `--check` now name every unshipped `.claude/agents/grugops-*.md` file the install ledger cannot vouch for in a report-only `note`; factory.config.md holds the single flattening list with the `agent.spawn` hook; CHANGELOG `[Unreleased]` names the Phase 39 changes; all 18 review findings are dispositioned (15 fixed, 3 deferred)**

## Performance

- **Duration:** 1h 25m wall clock, including an orchestrator pause during Task 3 and two full-suite runs of about 23 minutes each
- **Started:** 2026-10-30T07:15:38Z (Task 1 RED commit)
- **Completed:** 2026-10-30T08:39:34Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- WR-06 / TIER-06: `unrecordedStaleAdapters` lists the target's `.claude/agents/`, keeps `grugops-<name>.md` files that the kit neither ships nor renders and that the ledger holds no kit-true record of, and sorts them by byte order. `reportStaleKitAdapters` and the doctor's stale block print one `note` per file (`... install cannot tell whether an earlier install wrote it ...`). Nothing is deleted, renamed, written or recorded, and the exit status does not change. The `unlinkSync|rmSync` count stays 16 and the `grugops-software-engineer` count in install.ts is unchanged.
- IN-03: a comment above the held-record `recordKitFile` names the `nextLedgerEntries` carry it repeats.
- README: a repository last installed by v2.1 or earlier, or one with an absent or unreadable ledger, gets the note. This was confirmed against the tags: `v2.1:install/install.ts` has 0 `recordKitFile` calls and `v2.2` has 6.
- WR-09: factory.config.md has a count-free lead-in and a fourth bullet for an installed mod's `agent.spawn` hook, quoted from `code.claude.com/docs/en/sub-agents` (read 2026-10-30). The README flattening paragraph only names the settings and points to that list.
- WR-10: CHANGELOG `[Unreleased]` has Added, Changed and a new Removed section. No version is picked, and the release is not called MAJOR or MINOR.
- Task 3: 39-REVIEW-DISPOSITION.md records 15 `fixed`, IN-04 / IN-05 / IN-06 `deferred` with reasons, `open: 0` and `total: 18`.

## Task Commits

1. **Task 1: unrecorded-adapter note (WR-06, IN-03)**: `7ff0f96f` (test, RED), then `6368128f` (fix, GREEN)
2. **Task 2: one flattening list (WR-09) and release notes (WR-10)**: `b5a82cf9` (docs)
3. **Task 3: review dispositions and phase gate**: `8b023a54` (fix, census regression found by the phase gate) and `9770a05a` (docs)

**Plan metadata:** see the `docs(39-13)` SUMMARY commit that follows `9770a05a`.

`commits: 6` is measured as `git rev-list --count c46641c7..9770a05a`. It includes the orchestrator's pause commit `f89779ee` (`docs(pause): phase 39 paused at plan 13 task 3/3`), which is not a plan task commit. The plan made five task commits.

## Files Created/Modified

- `install/install.ts`, `install/install.js`: the hoisted adapter-path pattern, `unrecordedStaleAdapters`, `unrecordedStaleAdapterText`, the presence path in `reportStaleKitAdapters` and the doctor, the IN-03 comment, and the STALE KIT ADAPTERS header
- `install/install.test.ts`: six `no longer ships` cases (install, `--dry-run`, `--check`, repeat install, control, ledger-recorded no-second-line)
- `install/agents-record.test.ts`: census pins moved by measurement with dated 39-13 / WR-06 history lines
- `install/README.md`: the pre-v2.2 / unreadable-ledger paragraph, the §6 upgrade sentence, and the flattening paragraph reduced to names plus a pointer
- `agent-factory/config/factory.config.md`: the count-free lead-in and the `agent.spawn` bullet
- `CHANGELOG.md`: `[Unreleased]` Added / Changed / Removed
- `scripts/tier-kit-text.test.ts`: the WR-06 and WR-09 cases, and the WR-06 exit sentence pinned in two halves
- `39-REVIEW-DISPOSITION.md`: final dispositions

## Decisions Made

- The presence path prints a `note`, not a counted `verify`, so a pre-v2.2 upgrade keeps its exit status (plan's flagged assumption, kept).
- The census regression was fixed by rewording, not by an exemption. This follows the 32.1-04 precedent recorded in validate.test.ts: removing the one literal that supplied the second key spelling stops the file being counted, and no assertion is loosened.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The WR-06 README test made tier-kit-text.test.ts a second ticket-frontmatter reader**
- **Found during:** Task 3, the phase gate's full non-e2e run
- **Issue:** The first full run reported 24 failed, which is 4 more than the baseline, all in `scripts/validate.test.ts` ("exactly ONE ticket-frontmatter reader exists in scripts/"). Task 1's assertion `toContain("the exit status does not change")` (commit 6368128f) supplied the `status` spelling. The file already supplied `column` through a rubric test description, so the census counted the file as a second carrier.
- **Fix:** The README sentence is now asserted in two halves that meet at "the exit" (`"The note comes back on every run until the file is gone, and\nthe exit"` and `"does not change. Check each named file by hand."`), with a comment naming the precedent. No exemption was added and the README is unchanged.
- **Files modified:** scripts/tier-kit-text.test.ts
- **Verification:** `npx vitest run scripts/validate.test.ts scripts/tier-kit-text.test.ts` gave 289 passed. A second full run gave exactly the 20 baseline failures.
- **Committed in:** 8b023a54

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was needed for the phase gate to match its baseline. There is no scope creep.

## Phase Gate

- Foreground gates all exit 0 with no FAIL: check-foundation-guards, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-audit-register, check-imperative-lexicon, check-banned-claims, check-kit-refs, check:public-docs, check:claim-anchors, freshness:adapters, freshness:catalog, freshness:hook-manifest, freshness:guarantees, freshness (88 committed .js fresh), check:build-parity. `npm run build && npm run typecheck` is green.
- `node scripts/check-diff-disposition.js`: `721 finding(s) over 42 elements`. This is the pre-existing red, and it is unchanged (re-checked after the census fix).
- `npm run check:flip-manifest`: the pre-existing red, unchanged ("the flip manifest does not exist at .../33-FLIP-MANIFEST.md"). It is not marked passing.
- Full non-e2e suite, run 1: `Test Files 7 failed | 130 passed (137)`, `Tests 24 failed | 10656 passed | 2 skipped (10682)`. That is the 20 baseline failures plus 4 in validate.test.ts, fixed above.
- Full non-e2e suite, run 2 (after 8b023a54): `Test Files 6 failed | 131 passed (137)`, `Tests 20 failed | 10660 passed | 2 skipped (10682)`. All 20 failures are in the six deferred-items.md files: context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4, uat-gate-exit-contract 5, installer-fs-census 1.
- `docs/audit/28-prepass-evidence.md` still shows ` M`: untouched and unstaged.

## Issues Encountered

- The orchestrator paused the previous executor partway through Task 3. This run resumed from the uncommitted disposition edit, which already met every Task 3 acceptance criterion: 3 deferred info rows, 15 fixed rows, 0 `disposition: open`, `open: 0`.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- This was the last gap-closure plan of round 1. `/gsd-execute-phase 39 --gaps-only` should find no plans left and go on to the phase gates and the verifier.
- Human judgments are still open: the README / CHANGELOG wording for an upgrading user, and the SemVer level of the next release.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*
