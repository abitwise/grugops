---
phase: "39"
plan: "06"
subsystem: kit-roles
tags: [designer, role-ceilings, tiered-preset, derived-counts, style-dispositions, vitest]

requires:
  - phase: 39
    provides: "39-01..04: adapter identity derivation, one adapter per spec, ROLE_CEILINGS key-set check, RECORDED_ADDED, ROLE_SCHEMA; 39-05: the new-role landing shape (Tech Lead)"
provides:
  - "agent-factory/roles/designer.md: the Designer role (tier core, read edit), plain-English body, caveman fence"
  - "Generated .claude/agents/grugops-designer.md at model: inherit with no effort line; the coordinator grant names it (and grugops-tech-lead)"
  - "ROLE_COUNT 19, SPAWN_GRANT_SCAN_COUNT 35, TECHNICAL_NAMES_COUNT 78, BANNED_CLAIM_SCAN_COUNT 126, each moved by measurement with a dated comment"
  - "TIERED row designer (opus, RESEARCH Assumption A7); ROLE_CEILINGS row designer.md 3273 3098; register Table A row; RECORDED_ADDED new-role record"
  - "scripts/tier-kit-text.test.ts: ten Designer cases (TIER-05; D-23..D-27)"
  - "docs/audit/29-style-dispositions/39-06.md: 35 added-clause rows; the diff-disposition gate is back at 721"
affects: [39-07, 39-09, 39-10, check-foundation-guards, adapter-byte-baseline, install tests]

actuals:
  tokens: 18090
  tasks: 1
  commits: 1
plan_head_before: 95ebd5a7bd37c0a935d6a0c4778842ec268db881
plan_head_after: 3fcb4683e2bbcd8e3d269021998a70d26054a76b

tech-stack:
  added: []
  patterns:
    - "A new role lands with its measured ceiling, TIERED row, register row, generated adapter, catalog row and disposition rows in one commit (second use, after 39-05)"
    - "A new role's `## Hard limits` clauses are worded so that no other kit file already carries them, which keeps the frozen set from catching existing edits"

key-files:
  created:
    - agent-factory/roles/designer.md
    - .claude/agents/grugops-designer.md
    - docs/audit/29-style-dispositions/39-06.md
  modified:
    - scripts/kit-model.ts / .js, scripts/kit-model.test.ts
    - scripts/model-tiers.ts / .js, scripts/model-tiers.test.ts
    - scripts/check-foundation-guards.ts / .js
    - scripts/check-imperative-lexicon.ts / .js
    - scripts/check-banned-claims.ts / .js
    - scripts/adapter-byte-baseline.test.ts, scripts/tier-kit-text.test.ts
    - scripts/generate-catalog.test.ts, scripts/audit-prepass.test.ts, scripts/trace-instructions.test.ts
    - install/installer-cross-version.test.ts, installer-never-installed.test.ts, installer-special-files.test.ts, installer-user-edit.test.ts, record-truth.test.ts, uninstall-removal.test.ts
    - .claude/agents/grugops-orchestrator.md, docs/catalog/README.md, hooks/hook-entry.ts / .js (generated)
    - docs/audit/28-disposition-register.md, docs/audit/28-safety-surface-exclusions.md (generated)

key-decisions:
  - "The Designer's Hard limits end with `Merge and deploy remain human decisions.`: this wording appears in no other kit file, so it froze no earlier edit. The gate went from 755 findings with no rows to 721 with rows, and no file other than designer.md gained a finding"
  - "ROLE_CEILINGS designer.md = 3273 3098, from the measured 2922 B at +12% / +6%, rounded up"
  - "TIERED designer = opus (RESEARCH Assumption A7). It is one row to change if `sonnet` is preferred. The rationales argue quality only and contain no digits"
  - "Capabilities `read edit`, with no `web`: the optional ui-ux-pro-max path is Phase 42 (D-23). The role never gets `admit` and has no `Agent(...)` grant (T-39-21)"

patterns-established:
  - "Every measured install pin moves by exactly one per new role. The pins are WRITE_PATH_COUNT, READ_PATH_COUNT, INSTALLED_FILE_COUNT, REMOVABLE_COUNT, both KIT_PATH_COUNTs and RECORDED_FILE_COUNT (plus its WHY string). SCAN_SET_SIZE and AUDIT_SET_COUNT's literal move too. TRIPWIRE_MODULES and SCRIPTS_TEST_FILE_COUNT move only when a test module is added, and this plan added none"

requirements-completed: []  # The plan declares TIER-05 and TIER-06. 39-09 also claims TIER-05, and 39-07 and 39-10 claim TIER-06, so the orchestrator ticks them at phase close.

coverage:
  - id: D1
    description: "designer.md has tier core, capabilities read edit, every required section, one Workflow 16 and one Workflow 18 reference, the D-24/D-25/D-26 contract and the WCAG 2.2 AA bar"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#designer.md (TIER-05; D-23..D-27)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "19 roles and 19 adapters. grugops-designer runs on model: inherit with no effort line and is granted to the coordinator. Every derived count moved once, by measurement"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts, scripts/model-tiers.test.ts, scripts/adapter-byte-baseline.test.ts"
        status: pass
      - kind: other
        ref: "node -e acceptance check (ROLE_COUNT 19, listRoles 19, SPAWN_GRANT_SCAN_COUNT 35, listAgentAdapterNames 19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The disposition gate is back at the pre-phase 721 findings, with a row for every added clause"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)' == 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "The role reads well in plain English, and the opus tier choice (A7) is acceptable"
    verification: []
    human_judgment: true
    rationale: "Voice quality and the flagged A7 tier assumption are reader and owner judgments that no test asserts"

duration: 62min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 06: The Designer Role Summary

**The kit now has a 19th role, the Designer. It sets the product's design system once: the principles, the palette, type-scale and spacing tokens, the style direction, the WCAG 2.2 AA bar and the generated-design tells to avoid. It publishes these only as typed `decision` and `artifact-ref` notes and leaves all per-ticket work to Frontend/UI. Its generated adapter runs on `model: inherit`, and the coordinator is granted it. Every count it moved was moved by measurement, every gate is green, and the disposition count is back at 721.**

## Performance

- **Duration:** about 62 min
- **Started:** 2026-10-29T19:22:41Z
- **Completed:** 2026-10-29T20:24:45Z
- **Tasks:** 1 (tracer)
- **Files modified:** 32 (3 created)

## Accomplishments

- **`agent-factory/roles/designer.md`** is 2,922 B, with `tier: core` and `capabilities: read edit`. It is built on the tech-lead.md skeleton, and its contents are:
  - **One job:** the sentence the plan fixed.
  - **Fence:** a new four-line caveman fence (cave, grug, shiny rock, swamp). No line is copied from frontend-ui.md, and it uses no banned construction.
  - **Reads:**
    - the config line;
    - the board and index;
    - the product context and architecture notes, per Workflow 16;
    - earlier Designer notes;
    - the accessibility checklist.
  - **Activates when:** the D-25 triggers.
  - **Responsibilities:** the D-26 ownership split and the D-25 cadence.
  - **Output:** D-24 notes only, and no memory-bank master file.
  - **Board moves:** none. The Designer runs at the design step, before Frontend/UI.
  - **Trace updates:** as tech-lead.md has them.
  - **Hard limits:** no per-ticket contract and no component code; WCAG 2.2 AA in clear professional English; no fabrication (`UNKNOWN - verify`); merge and deploy stay with humans.
  - **Footer:** copied verbatim.
- **Pins moved by measurement**, each with a dated comment:

  | Pin | Change |
  |---|---|
  | `ROLE_COUNT` | 18 -> 19 |
  | `SPAWN_GRANT_SCAN_COUNT` | 34 -> 35 |
  | `TECHNICAL_NAMES_COUNT` | 77 -> 78 |
  | `BANNED_CLAIM_SCAN_COUNT` | 124 -> 126 |

- **New entries:**
  - a `TIERED` row `designer` (opus) with quality-only rationales;
  - the composition test now names six opus stems, with an A7 comment;
  - a `ROLE_CEILINGS` row `3273 3098`;
  - a register Table A row;
  - a `RECORDED_ADDED` new-role record.
- **Regenerated:**
  - the adapters: 19, and the coordinator grants 18 names, `grugops-designer` and `grugops-tech-lead` among them;
  - the catalog;
  - the hook manifest;
  - the safety-surface list, which now has 43 entries.
- **`docs/audit/29-style-dispositions/39-06.md`** has 35 added rows. The 9 rows in the `## Hard limits` section carry a companion cell. `check-diff-disposition` prints 721 findings.

## Task Commits

1. **Task 1 (tracer): the Designer role becomes a granted, catalogued adapter with every gate green**: `3fcb4683` (feat)

**Tracer gate:** I re-ran the automated `<verify>` end to end and it passed. No expansion task follows it.

## Verification

- `npm run build && npm run typecheck`: ok.
- `npx vitest run` over the plan's 8 files plus `check-imperative-lexicon`, `check-banned-claims`, `check-audit-register` and `check-diff-disposition`: 12 files, 1173 tests pass.
- All ten gates exit 0:
  - `check-foundation-guards`
  - `validate-agent-factory` (run with `VALIDATE_KIT_ROOT=.`)
  - `check-audit-register`
  - `check-imperative-lexicon`
  - `check-banned-claims`
  - `check-kit-refs`
  - `freshness:adapters`
  - `freshness:catalog`
  - `freshness:hook-manifest`
  - `freshness`
- `check-diff-disposition` prints `721 finding(s)`.
- All five acceptance criteria pass:
  - `grugops-designer` and `grugops-tech-lead` are each named once in the orchestrator's grant;
  - designer.md contains `WCAG 2.2 AA` twice;
  - the register has one designer row;
  - the adapter has 0 `effort:` lines and 1 `model: inherit` line.
- **Full non-e2e suite after the commit:** 20 failures in 6 files. This is exactly the pre-existing set in `deferred-items.md`:

  | File | Failures |
  |---|---|
  | context-io | 7 |
  | context-io-writer-set | 2 |
  | canonical-corpus | 1 |
  | harness-instance-ledger | 4 |
  | uat-gate-exit-contract | 5 |
  | installer-fs-census | 1 |

## Decisions Made

- **The Hard limits ending is `Merge and deploy remain human decisions.`** I followed the 39-05 lesson and chose a clause that no other kit file carries, so it froze nothing else. Before any rows existed, all 34 gate findings were in designer.md.
- **The Designer is `opus` under `tiered`** (A7, flagged in the plan). Its single design direction is inherited by every UI ticket, and no later gate asks again whether it was right. At zero config it stays `inherit` (D-27).
- **The tells sentence gives three concrete examples:** stock gradients, uniform card grids and filler copy. That makes the instruction checkable by a reader. It is not a closed list.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Measured pins outside the plan's file list**
- **Found during:** Task 1, in the full-suite run.
- **Issue:** Tests that pin live-tree measurements went red by exactly one adapter or one kit document.
- **Fix:** Each pin moved by one, with a dated history line, after the failing run printed the new value:

  | Pin | Change |
  |---|---|
  | `WRITE_PATH_COUNT` | 116 -> 117 |
  | `KIT_PATH_COUNT` (never-installed) | 25 -> 26 |
  | `READ_PATH_COUNT` | 78 -> 79 |
  | `INSTALLED_FILE_COUNT` | 76 -> 77 |
  | `REMOVABLE_COUNT` | 46 -> 47 |
  | `KIT_PATH_COUNT` (uninstall-removal) | 25 -> 26 |
  | `RECORDED_FILE_COUNT` | 44 -> 45 (WHY string now says 19 adapters) |
  | `AUDIT_SET_COUNT` literal | 38 -> 39 |
  | `SCAN_SET_SIZE` | 79 -> 80 |

  The `ROLE_NAMES` fixture in generate-catalog.test.ts gained `Designer`.
- **Commit:** 3fcb4683

**2. [Rule 3 - Blocking] The hook manifest went stale after a later kit-model.ts edit**
- **Issue:** `generate:hook-manifest` ran before `SPAWN_GRANT_SCAN_COUNT` moved. That left the manifest hash of `scripts/kit-model.js` stale, so `freshness:hook-manifest` failed.
- **Fix:** I re-ran `generate:hook-manifest` after the last edit and committed the result.
- **Commit:** 3fcb4683

No assertion was removed or loosened.

## Issues Encountered

- Before the commit, several suites were red only because their inputs were uncommitted:
  - floor-invariance, check-platform-shapes, three uat-gate skip-list cases and one context-io route-0 case, because the frozen hook manifest is read at HEAD;
  - host-entries, because the source adapter set is derived from tracked files.

  All of them are green after the commit.
- `docs/audit/28-prepass-evidence.md` still has the user's pre-existing modification. I did not touch or stage it.

## Known Stubs

None.

## Next Phase Readiness

- **Plan 39-07 (engineer levels):** the adapter count moves through the derivation automatically. The measured install pins listed above, and `RECORDED_FILE_COUNT_WHY`, will need a level-aware move: one role becomes three adapters.
- **Plan 39-09 (WF14 wiring and Frontend/UI reading the Designer's tokens):** designer.md already describes the Designer as running at the design step, before Frontend/UI.

## Self-Check: PASSED

- FOUND: agent-factory/roles/designer.md, .claude/agents/grugops-designer.md, docs/audit/29-style-dispositions/39-06.md
- FOUND: 3fcb4683 in HEAD's history

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
