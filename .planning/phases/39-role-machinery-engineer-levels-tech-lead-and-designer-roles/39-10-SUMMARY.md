---
phase: "39"
plan: "10"
subsystem: installer
tags: [installer, install-ledger, stale-adapter, doctor, engineer-levels, install-docs, vitest]

requires:
  - phase: 39
    provides: "39-07: the three engineer level adapters replace grugops-software-engineer.md; the v2.1.293 floor and the run-time flattening paths documented in factory.config.md"
provides:
  - "install/install.ts staleKitAdapters: the derived set of kit-true ledger adapters (.claude/agents/grugops-*.md) this kit no longer ships, still present in the target"
  - "install and --dry-run: one counted verify per stale adapter (exit 3); --check: one FAIL each with the same wording"
  - "a still-held stale record is carried into KIT_FILES, so uninstall still removes the unchanged file; an edited one is reported as the user's and not recorded"
  - "install/README.md: the stale-adapter report under re-installing, a section 6 subsection on the engineer level adapters (Claude Code only, v2.1.293 floor, UNKNOWN - verify effort on Haiku 4.5 and Sonnet 4.5, the run-time flattening paths), and count-free specialist and adapter sentences"
affects: [phase-42 doctor work, install docs, upgrade path of host repositories installed before phase 39]

actuals:
  tokens: 7830
  tasks: 2
  commits: 3
plan_head_before: 1cb4c53d8e353c990576df369780d2b75cd81b7e
plan_head_after: 6f7a0e3a9fefdf1a20d332280cd13b386fda433d

tech-stack:
  added: []
  patterns:
    - "A two-source install fixture: an older kit is a real copy of this checkout's kit inputs plus one role and its adapter, so the install-time render really produces the extra adapter and the ledger records it; no ledger is edited by hand"
    - "What a kit ships is its adapter directory together with the render's own listing in this run (RENDERED_ADAPTERS), so a damaged checkout is never read as a kit that retired adapters"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/agents-record.test.ts
    - install/README.md
    - scripts/tier-kit-text.test.ts

key-decisions:
  - "Report only (Phase 39 RESEARCH Open Question 3): install, --dry-run and --check name a retired adapter; nothing removes, renames or writes it, and the unlink/rm count in install.ts stays 16"
  - "A name counts as shipped when the kit's adapter directory carries it OR the run's render produced it. Without the render half, --check from a checkout with a short adapter directory FAILed every recorded adapter and told the user to delete files the kit still makes"
  - "Install asks the stale check whatever the kit write decided (refused, no consent, dry-run), and only when Claude Code is chosen; the doctor asks it only when Claude Code is installed and the ledger is install's own and readable"
  - "The agent.spawn hook path in install/README.md is worded as the phase research cites it (code.claude.com/docs/en/sub-agents, fetched 2026-10-29): it can flatten all three levels; nothing more is claimed"

patterns-established:
  - "A new removal-worded installer message gets a classed row in agents-record.test.ts REMOVAL_EXEMPT with a dated pin move"

requirements-completed: [TIER-03, TIER-06]

coverage:
  - id: D1
    description: "Re-installing the current kit over an older kit's install names the adapter it no longer ships (verify, exit 3), leaves its bytes unchanged, carries its record, and a later uninstall removes it"
    requirement: TIER-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#re-installing the current kit names the adapter it no longer ships, keeps it and its record, ends INCOMPLETE (exit 3), and uninstall still removes it"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#control: two installs of this kit name no adapter the kit no longer ships, and the second ends complete (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "--dry-run names the stale adapter and changes nothing; a user-edited stale adapter is reported as the user's, left byte for byte, and not recorded"
    requirement: TIER-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#--dry-run names the adapter the kit no longer ships and changes nothing in the target"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#an adapter the kit no longer ships that the user edited is reported as theirs, left byte for byte and not recorded"
        status: pass
    human_judgment: false
  - id: D3
    description: "--check reports the stale adapter as a FAIL with install's remedy; a clean install gets no such line; a short-checkout --check keeps its WARN tier"
    requirement: TIER-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#--check over the upgraded target reports the adapter the kit no longer ships as a FAIL with install's remedy"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#control: --check over a clean install of this kit prints no `no longer ships` line"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#doctor: a fresh render producing members the kit's adapter set does not carry states that NO VERDICT was produced for them (D-09)"
        status: pass
    human_judgment: false
  - id: D4
    description: "install/README.md documents the level adapters (Claude Code only), the v2.1.293 floor, UNKNOWN - verify effort on Haiku 4.5, that --check does not probe the version, the flattening paths and the stale-adapter remedy, with no hand-typed specialist count"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#install/README.md documents the engineer level adapters and the stale-adapter report (5 cases)"
        status: pass
      - kind: other
        ref: "node scripts/check-banned-claims.js && npm run check:public-docs && npm run check:claim-anchors && node scripts/check-kit-refs.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "The README wording reads clearly to an upgrading user and claims no detection or enforcement grugops lacks"
    verification: []
    human_judgment: true
    rationale: "Clarity and the no-false-claim reading are reader judgments no test asserts"

duration: 63min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 10: The Retired-Adapter Report and the Level Install Docs Summary

**Install, `--dry-run` and `--check` now name every adapter the install ledger records that this kit no longer ships. The live case is the Phase 38 `grugops-software-engineer.md`. The run ends INCOMPLETE (exit 3) or FAILs. Nothing deletes the file, and its record is kept while it is unchanged, so uninstall still removes it. install/README.md now documents the three engineer level adapters, the Claude Code v2.1.293 floor and the run-time paths that can flatten the levels.**

## Performance

- **Duration:** about 63 min
- **Started:** 2026-10-29T23:25:01Z
- **Completed:** 2026-10-30T00:28:34Z
- **Tasks:** 2 (Task 1 was the tracer)
- **Files modified:** 6

## Accomplishments

- **The derived set.** `staleKitAdapters(ledger)` builds the set as follows:
  - start from the kit-true `file` entries at `.claude/agents/grugops-<name>.md`;
  - drop every basename that `srcAdapterFiles(GRUGOPS_SRC)` returns or that this run's render produced;
  - keep only the files still present in the target.

  No retired name is written anywhere. `owns` decides whether each record still holds.
- **Install** (`reportStaleKitAdapters`, after the kit write block, when Claude Code is chosen):
  - prints one counted `verify` per stale adapter: "this kit version no longer ships ..., Claude Code still loads it, and on the Reduced tier the coordinator can spawn it; delete it by hand ... uninstall removes it while it is unchanged";
  - carries a still-held record into `KIT_FILES`; `recordKitFile` already records nothing under `DRY_RUN`;
  - words an edited file as the user's.

  If the kit source's adapter directory cannot be read, a note says the check was skipped.
- **The doctor** asks the same derived set from its one ledger read and prints one `FAIL` per member with the same wording.
- **README:**
  - a new "An adapter this kit version no longer ships" subsection under re-installing;
  - a new section 6 subsection, "The engineer level adapters (Claude Code only)". It covers the zero-config table, scope guidance with no model advice on the other hosts, and the v2.1.293 floor. It also covers `UNKNOWN - verify` effort on Haiku 4.5 and Sonnet 4.5, and that `install.js --check` does not probe the version yet. The four flattening paths are cited with fetch dates and point to `factory.config.md` § `models` sub-fields;
  - "16 specialist names" and "All 17 grugops adapters" made count-free.

## Task Commits

1. **Task 1 (tracer): end-to-end stale-adapter report**: `9ded90ea` (test, RED first), `5f993148` (feat)
2. **Task 2: the doctor's report and the install docs**: `6f7a0e3a` (feat)

**Plan metadata:** recorded in the docs commit that follows this file.

## Files Created/Modified

- `install/install.ts` / `install/install.js`: `staleKitAdapters`, `staleAdapterText`, `staleAdaptersSkippedText`, `RENDERED_ADAPTERS` (set by both render callbacks), `reportStaleKitAdapters`, and the doctor block before the ask-rule check
- `install/install.test.ts`: the two-source describe block (6 cases: re-install, dry-run, edited, install control, `--check` FAIL, `--check` control)
- `install/agents-record.test.ts`: five REMOVAL_EXEMPT rows (hits 138 -> 143, table 91 -> 96, install.ts 51 -> 56); DOCTOR_REACH_SIZE 57 -> 60; WR24_REACH_SIZE 48 -> 51. Each pin moved after the failing run printed the value, with a dated reason.
- `install/README.md`: the two new subsections and the two count-free sentences
- `scripts/tier-kit-text.test.ts`: five README cases

## Decisions Made

See `key-decisions` above. The main one: a name is shipped when the adapter directory or this run's render has it. This keeps the delete-by-hand advice off adapters a damaged checkout merely lacks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A checkout with a short adapter directory read as a kit that retired adapters**
- **Found during:** Task 2 (installer suite rerun)
- **Issue:** The D-09 case runs `--check` from a checkout holding one adapter while its role corpus is whole. With the shipped set taken from `srcAdapterFiles` alone, the doctor FAILed every other recorded adapter (exit 1 where the case pins a WARN tier at exit 0). It also advised deleting files the kit still makes, which is harmful advice.
- **Fix:** `RENDERED_ADAPTERS` records the render's own file listing in buildKitPlan's and the doctor's render callbacks. A name the render produced counts as shipped. The retired-probe and live retired-engineer cases are unaffected, because no current role renders those names.
- **Files modified:** install/install.ts, install/install.js
- **Verification:** the D-09 case and all 6 stale-adapter cases pass; install/ suite has only the deferred fs-census red
- **Committed in:** 6f7a0e3a

**2. [Rule 3 - Blocking] Census pins moved by the new messages and helpers**
- **Found during:** Task 1 and Task 2 (installer suite)
- **Issue:** The removal-matcher census found five new removal-worded clauses, and the doctor-reach censuses found three new helpers.
- **Fix:** Classed rows, and re-pinned sizes with dated reasons. None of the new helpers reads the marker or the kit home.
- **Files modified:** install/agents-record.test.ts
- **Committed in:** 5f993148, 6f7a0e3a

**3. [Rule 1 - Bug] A second hand-typed count in README section 6**
- **Found during:** Task 2
- **Issue:** "All 17 grugops adapters carry the `grugops-` prefix" (the kit now has 21) was stale beside the plan's "16 specialist names" sentence.
- **Fix:** Made count-free ("Every grugops adapter carries ...").
- **Committed in:** 6f7a0e3a

**Also:** the plan's helper names `runInstallFrom` / `runUninstall` do not set HOME. The new block uses a local spawn helper that sets GRUGOPS_HOME, HOME and TARGET to scratch paths, per the project rule. The test exercises `--dry-run` through the flag (README spells it `--dry-run`).

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** Deviation 1 narrows the stale set so it never advises deleting a live adapter. No scope creep.

## Issues Encountered

None beyond the deviations.

## Verification

- `npm run build && npm run typecheck`: pass
- `npx vitest run install/install.test.ts -t "no longer ships"`: 7 passed (6 new and one older runnable case whose name matches)
- `npx vitest run install/`: 1 failed (the deferred `installer-fs-census` `openAsBlobSync` row) | 2986 passed
- Full non-e2e suite (1378 s): 20 failed in the 6 deferred files (context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4, uat-gate-exit-contract 5, installer-fs-census 1); 10,640 passed. That is the recorded baseline plus 11 passing tests and no new red.
- Gates green: foundation guards, validator (`VALIDATE_KIT_ROOT=.`), audit register, imperative lexicon, banned claims, kit refs, public docs, claim anchors, freshness (adapters, catalog, hook-manifest, guarantees, build), build parity
- `check-diff-disposition`: 721 findings (unchanged, recorded pre-existing red); `check:flip-manifest`: 1 check failed (unchanged, recorded pre-existing red)
- Acceptance greps:
  - "no longer ships" in install.ts: 3 (baseline 0)
  - `unlinkSync|rmSync` in install.ts: 16 (unchanged)
  - `v2.1.293` in README: 2
  - `CLAUDE_CODE_SUBAGENT_MODEL` in README: 1
  - `\b16 specialist` in README: 0

## User Setup Required

None. A user upgrading an install made before Phase 39 sees one `verify` line for `.claude/agents/grugops-software-engineer.md` and deletes it by hand.

## Next Phase Readiness

This is the last plan of Phase 39. `requirements.ready-ids` reports TIER-03 and TIER-06 ready. The Claude Code version probe in `--check` and a doctor report for the flattening environment variables stay with Phase 42 (D-22; RESEARCH Runtime State Inventory).

## Self-Check: PASSED

- FOUND: install/install.ts, install/install.js, install/install.test.ts, install/README.md, scripts/tier-kit-text.test.ts, install/agents-record.test.ts
- FOUND commits: 9ded90ea, 5f993148, 6f7a0e3a

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*
