---
phase: "39"
plan: "07"
subsystem: kit-roles
tags: [engineer-levels, level-adapters, model-tiers, adapter-byte-baseline, guard-kit-counts, factory-config, vitest]

requires:
  - phase: 39
    provides: "39-01: LEVELS table, listAgentAdapterSpecs, LEVELED_ROLE_COUNT; 39-02: one adapter per spec, level-aware guards and freshness; 39-03: ROLE_CEILINGS, RECORDED_ADDED / RECORDED_REMOVED; 39-05: complexity rubric and Tech Lead; 39-06: Designer"
provides:
  - "software-engineer.md declares `levels: junior mid senior` and has a plain-English `## Levels` section"
  - "Generated grugops-software-engineer-junior (haiku/medium), -mid (sonnet/medium), -senior (opus/high); the base adapter is gone; the coordinator grants 20 derived names"
  - "LEVELED_ROLE_COUNT 1, SPAWN_GRANT_SCAN_COUNT 37, BANNED_CLAIM_SCAN_COUNT 128; the software-engineer TIERED row is dropped (MODEL_TIERS_COUNT 18)"
  - "guard_kit_counts: roles declaring levels == LEVELED_ROLE_COUNT, and declared level tokens == LEVELS levels in both directions, each mismatch named"
  - "MODEL-01 baseline: three `kind: \"level\"` records, one removal, and a five-transform level case"
  - "capture-live side (b) accepts a level adapter's agent stamping its role stem"
  - "D-2 amendment record and v2.1.293 floor in scripts/model-tiers.ts and factory.config.md; level keys, D-16 preset behavior and the three run-time flattening paths documented"
  - "subagent.frontmatter.md is count-free and documents the level adapter's differing lines"
affects: [39-08, 39-09, 39-10, install tests, capture-live, factory.config.md]

actuals:
  tokens: 46566
  tasks: 2
  commits: 2
plan_head_before: d4b1ac11ea5e6c6cf08ac1b0d2c6952b45086044
plan_head_after: 62ca47a131322ce120afa0353fe87add7cd5c2eb

tech-stack:
  added: []
  patterns:
    - "Mirror fixtures that plant a `levels:` line first strip the live one, so every mirror starts from a corpus with no leveled role"
    - "Install and guard tests resolve expectations per adapter (resolveAdapterAssignments / D-14 literals), never per role stem"
    - "A level adapter is checked byte for byte as the baseline base adapter plus exactly five recorded transforms"

key-files:
  created:
    - .claude/agents/grugops-software-engineer-junior.md
    - .claude/agents/grugops-software-engineer-mid.md
    - .claude/agents/grugops-software-engineer-senior.md
    - docs/audit/29-style-dispositions/39-07.md
  modified:
    - agent-factory/roles/software-engineer.md
    - agent-factory/config/factory.config.md
    - agent-factory/packaging/subagent.frontmatter.md
    - scripts/kit-model.ts / .js, scripts/model-tiers.ts / .js, scripts/check-foundation-guards.ts / .js, scripts/check-banned-claims.ts / .js, scripts/capture-live.ts / .js
    - scripts/adapter-byte-baseline.test.ts, scripts/tier-kit-text.test.ts, scripts/kit-model.test.ts, scripts/model-tiers.test.ts, scripts/generate-role-adapters.test.ts, scripts/check-foundation-guards.test.ts, scripts/adapters-freshness.test.ts, scripts/frontmatter.test.ts, scripts/capture-live.test.ts, scripts/context-io.test.ts, scripts/model-dial-consistency.test.ts
    - install/install.test.ts, installer-cross-version, installer-never-installed, installer-special-files, installer-user-edit, record-truth, uninstall-removal (tests)
    - .claude/agents/grugops-orchestrator.md, hooks/hook-entry.ts / .js (generated)
  deleted:
    - .claude/agents/grugops-software-engineer.md

key-decisions:
  - "ROLE_CEILINGS software-engineer.md moved by measurement to 4979 4712 (measured 4445 B, +12% / +6%), citing TIER-02 `## Levels` and D-1; no other section of the role was trimmed (Phase 40 owns that)"
  - "capture-live side (b) now accepts a note stamped with a granted adapter's role stem (read from its `Read agent-factory/roles/<stem>.md` line): a leveled engineer's agent may stamp `software-engineer`, which is no longer an adapter stem"
  - "factory.config.md states CLAUDE_CODE_SUBAGENT_MODEL as it is documented today: alone it is a default the adapter's `model` field outranks (since v2.1.251); with CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1 (v2.1.257+) it flattens every sub-agent"
  - "The same model-config page maps `sonnet` to Sonnet 4.5 on Bedrock, Google Cloud's Agent Platform and Foundry, and Sonnet 4.5 is not in the effort list, so the mid adapter's effort there is also recorded `UNKNOWN - verify`"
  - "The generator-test sample corpus swapped software-engineer.md for system-analyst.md, so every sample role yields exactly one adapter; the levels cases add the live engineer themselves"

patterns-established:
  - "When a role gains levels, every measured install pin moves by (levels - 1); the pins are WRITE_PATH_COUNT, READ_PATH_COUNT, INSTALLED_FILE_COUNT, REMOVABLE_COUNT, both KIT_PATH_COUNTs and RECORDED_FILE_COUNT with its WHY string"

requirements-completed: [TIER-02]  # The plan declares TIER-02, TIER-03 and TIER-06. requirements.ready-ids reports only TIER-02 ready; TIER-03 and TIER-06 are also claimed by later plans, so the orchestrator ticks them at phase close.

coverage:
  - id: D1
    description: "software-engineer.md declares `levels: junior mid senior`; Claude Code gets the three level adapters with the D-14 pins and no base adapter; the coordinator grants all 20 derived names"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#the live tree derives exactly today's adapter names: listAgentAdapters minus `.md`, the engineer's three levels and no base engineer adapter"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#the live tree: zero config pins the three engineer levels to D-14 and resolves inherit/inherit for every other derived adapter"
        status: pass
      - kind: other
        ref: "plan 39-07 Task 1 acceptance greps (3 level adapters, 3 effort lines, haiku/opus/high, 0 base adapter, grant >= 20 names, LEVELED_ROLE_COUNT 1, SPAWN_GRANT_SCAN_COUNT 37, 21 adapters)"
        status: pass
    human_judgment: false
  - id: D2
    description: "MODEL-01: each level adapter equals the baseline base adapter with exactly five transforms; the removal and the three additions are recorded"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/adapter-byte-baseline.test.ts#a level adapter is the baseline base adapter of its role with exactly five transforms"
        status: pass
    human_judgment: false
  - id: D3
    description: "guard_kit_counts is red by name when the levels line is removed, on `levels: junior mid` and on `levels: junior mid senior lead` (also refused by the generator); green on the unplanted mirror"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level declarations (4 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The `## Levels` section states the Claude Code adapters, guidance-only levels elsewhere with no model advice, the junior scope and BLOCKED rule, deviation with a recorded reason, and the failed-attempt note per WF04"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#software-engineer.md `## Levels` (9 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The D-2 amendment, the v2.1.293 floor, the level keys, D-16 and the run-time flattening paths are documented; the packaging template is count-free"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#the level dial documentation (6 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "On Claude Code 2.1.293+, each engineer adapter spawned by name with no model or effort parameter runs on its pinned model and effort"
    requirement: TIER-02
    verification: []
    human_judgment: true
    rationale: "The plan's human-check needs a live Claude Code session spawning the three adapters; this executor had no Agent tool, so the observed model and effort are `UNKNOWN - verify`. `/tasks` (v2.1.242+) shows both on the sub-agent's row."
  - id: D7
    description: "The `## Levels` and factory.config.md wording reads well and claims no enforcement grugops lacks"
    verification: []
    human_judgment: true
    rationale: "Voice quality and the no-false-claim reading are reader judgments no test asserts"

duration: 90min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 07: The Engineer Levels Summary

**One `levels: junior mid senior` line in software-engineer.md now gives Claude Code three engineer adapters: junior on `haiku`/`medium`, mid on `sonnet`/`medium`, senior on `opus`/`high`. The base adapter is gone, and the coordinator grants all 20 derived names. A new guard check, the baseline records and the freshness gates all accept the new tree. The D-2 amendment and the v2.1.293 floor are recorded in the resolver and in the dial docs.**

## Performance

- **Duration:** about 90 min
- **Started:** 2026-10-29T20:27:37Z
- **Completed:** 2026-10-29T21:57:30Z
- **Tasks:** 2 (Task 1 was the tracer)
- **Files changed:** 38 (4 created, 1 deleted)

## Accomplishments

- **The role change:** `agent-factory/roles/software-engineer.md` gets its `levels:` line and a plain-English `## Levels` section placed after `## Responsibilities`. The section says:
  - on Claude Code the role runs as one of three adapters, and the Tech Lead names one per ticket;
  - on the other hosts the level is scope guidance only, with no model advice;
  - scopes come from the complexity rubric;
  - a junior takes only tasks whose plan fixes what to write, and stops `BLOCKED` on security, migration, concurrency or test-integrity work;
  - every level may deviate from the plan if it records why;
  - a blocked engineer, or one whose gate fails a second time, publishes a `failed-attempt` note per WF04.
- **Generated adapters:** 21 adapters. The three level adapters are the only ones with an `effort:` line. Every other adapter stays `model: inherit`.
- **Pins:** `LEVELED_ROLE_COUNT` 0 to 1, `SPAWN_GRANT_SCAN_COUNT` 35 to 37, `BANNED_CLAIM_SCAN_COUNT` 126 to 128 (read off the gate's own refusal). The `software-engineer` TIERED row is dropped, so `MODEL_TIERS_COUNT` is 18 and the sonnet bucket is 18 minus the 6 opus stems. The ROLE_CEILINGS row is now `4979 4712`.
- **New check in `guard_kit_counts`:** the number of roles that declare levels must equal `LEVELED_ROLE_COUNT`, and the declared level tokens must match the LEVELS levels in both directions. Each mismatch is named. Four mirror cases cover it, and I proved each one red against a build with the checks turned off.
- **Baseline records:** `adapter-byte-baseline.test.ts` has three `kind: "level"` records with D-14 literals and one `RECORDED_REMOVED` entry. A new case checks that each level adapter equals the baseline `grugops-software-engineer.md` with exactly five transforms: the name, the description suffix, the model line, an inserted effort line, and an inserted level body line. I proved it red by planting a wrong effort and an extra space.
- **Task 2 docs:**
  - **`scripts/model-tiers.ts`:** a D-2 amendment record above LEVELS, with a pointer from the TIERED D-09 paragraph.
  - **`factory.config.md`:**
    - the level pins and keys;
    - D-16, that no preset moves a level;
    - the widened refusal key set;
    - the D-2 facts, which replace the old no-effort `UNKNOWN - verify` paragraph;
    - that levels are guidance only on the other hosts;
    - the three run-time paths that can flatten the levels.
  - **`subagent.frontmatter.md`:** no counts, plus a section that lists only the lines where a level adapter differs.

## Task Commits

1. **Task 1 (tracer): one `levels:` line yields three pinned, granted engineer adapters that every guard, the baseline and the freshness gate accept.** `d585bc45` (feat)
2. **Task 2: record the D-2 amendment, the v2.1.293 floor and the level dial in the kit docs.** `62ca47a1` (docs)

**Tracer gate:** I re-ran the tracer's automated `<verify>` end to end and it passed: build, typecheck, 10 test files with 1231 tests, all gates, the three freshness gates, and 721 findings. The tracer also has a `<human-check>`, which under `end-of-phase` mode would normally stop for a checkpoint. The plan's own flagged assumption gives that check to the end-of-phase human check, and Task 2 is documentation that does not build on the slice. So I went on and recorded the check under Deviations and in D6.

The base adapter's removal shows in git as a rename of `grugops-software-engineer.md` to `grugops-software-engineer-mid.md`, because the bytes are similar. `test ! -e .claude/agents/grugops-software-engineer.md` holds.

## Verification

- `npm run build && npm run typecheck`: ok.
- Full non-e2e suite: **20 failures in 6 files**. This is exactly the pre-existing set in deferred-items.md:

  | File | Failures |
  |---|---|
  | context-io | 7 |
  | uat-gate-exit-contract | 5 |
  | context-io-writer-set | 2 |
  | installer-fs-census | 1 |
  | canonical-corpus | 1 |
  | harness-instance-ledger | 4 |

  10601 tests pass.
- These checks all exit 0:
  - `check-foundation-guards`
  - `validate-agent-factory` (`VALIDATE_KIT_ROOT=.`)
  - `check-audit-register`
  - `check-imperative-lexicon`
  - `check-banned-claims`
  - `check-kit-refs`
  - `freshness:adapters`, `freshness:catalog`, `freshness:hook-manifest` and `freshness`
  - `check:build-parity`
- `check-diff-disposition` prints `721 finding(s)`.
- All acceptance criteria for both tasks pass.

## Decisions Made

See `key-decisions` in the frontmatter. Two of them are worth reading in full:

- **Flattening paths:** the current sub-agents page says `CLAUDE_CODE_SUBAGENT_MODEL` alone no longer outranks the adapter's `model` field (since v2.1.251). It flattens the levels only together with `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. factory.config.md says exactly that instead of the plan's shorter wording. I also recorded the `CLAUDE_CODE_EFFORT_LEVEL` precedence, the v2.1.292 floor for the per-call effort parameter, and `/tasks` as the way to see what a sub-agent got.
- **Sonnet 4.5:** the same model-config page shows `sonnet` mapping to Sonnet 4.5 on three cloud providers, and Sonnet 4.5 is not in the effort list. So the mid level's effort there is also marked `UNKNOWN - verify`. Both docs pages were read on 2026-10-29.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tests that assumed one adapter per role, or a role with no `levels` line**
- **Found during:** Task 1.
- **Issue:** Once the live tree declared levels, 134 cases failed in the plan's own test files, and 21 more in `install/install.test.ts`. They broke in four ways:
  - mirrors planted a second `levels:` line;
  - counts used `ROLE_COUNT` for adapters;
  - expectations resolved `resolveModels`/`resolveEfforts` over role stems, which now refuse `software-engineer` under `tiered`;
  - zero-config sets assumed `inherit` only.
- **Fix:**
  - Mirrors strip the live `levels:` line before planting.
  - Counts read `listAgentAdapterNames`, `MODEL_TIERS_COUNT` or the preset-governed stems.
  - Install expectations go through `resolveAdapterAssignments`.
  - D-14 literals are written as test fixtures.
  - `consistentMirror` writes pinned bodies for the level adapters.
  - The 39-02 "scratch build in 39-07's shape" is now the committed guard.
  - The re-planted base adapter is built from a level adapter with its name rewritten.

  No assertion was loosened. Where a case had claimed "every adapter", it now checks "every adapter but the three levels" and asserts that the three levels carry their pins.
- **Commit:** `d585bc45`

**2. [Rule 1 - Bug] capture-live side (b) refused the engineer's own notes**
- **Found during:** Task 1, in the full-suite run.
- **Issue:** Side (b) only accepted stamps that matched a granted adapter stem. A note stamped `software-engineer` stopped counting once that stem was no longer an adapter.
- **Fix:** `GrantDerivation.grantedRoles` holds the role stems read from each granted adapter's pointer line, and side (b) accepts either a granted adapter stem or a granted role stem. A new case covers both stamps and the coordinator exclusion. I proved it red against the old condition.
- **Files:** scripts/capture-live.ts / .js, scripts/capture-live.test.ts, scripts/context-io.test.ts (a literal `GrantDerivation`)
- **Commit:** `d585bc45`

**3. [Rule 3 - Blocking] Measured install pins outside the plan's file list**
- Each pin moved by two after its failing run printed the new value, with a dated history line:

  | Pin | Change |
  |---|---|
  | `WRITE_PATH_COUNT` | 117 -> 119 |
  | `KIT_PATH_COUNT` (never-installed) | 26 -> 28 |
  | `READ_PATH_COUNT` | 79 -> 81 |
  | `INSTALLED_FILE_COUNT` | 77 -> 79 |
  | `REMOVABLE_COUNT` | 47 -> 49 |
  | `KIT_PATH_COUNT` (uninstall-removal) | 26 -> 28 |
  | `RECORDED_FILE_COUNT` | 45 -> 47 (WHY string now says 21 adapters) |

  `TECHNICAL_NAMES_COUNT`, `AUDIT_SET_COUNT` and `SCAN_SET_SIZE` count roles, so they did not move. No test module was added, so `TRIPWIRE_MODULES` and `SCRIPTS_TEST_FILE_COUNT` did not move either.
- **Commit:** `d585bc45`

**4. [Rule 3 - Blocking] Two Task 2 test anchors**
- `model-dial-consistency.test.ts` pinned the old residual paragraph's anchor, which the plan told me to replace. The anchor now points at the D-2 paragraph, which still carries `UNKNOWN - verify` on the same line.
- A tier-kit-text case name said "five hosts", which `host-tools-prose` refuses as a host count. I reworded it.
- **Commit:** `62ca47a1`

**5. [Protocol] The tracer's `<human-check>` was deferred to end of phase instead of stopping for a checkpoint.** See the Tracer gate note above.

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug), plus 1 protocol note. **Impact:** all of them follow from the planned flip. None widens behavior beyond the plan, except the capture-live fix, which keeps an existing check correct for leveled roles.

## Issues Encountered

- **Coordinator adapter size:** it measures 3368 B, which is past the 3072 B warn tier and under the 4096 B fail tier. It was already past the warn tier after 39-06, and the level names add about 70 B more. subagent.frontmatter.md now records this measurement in place of the stale 3013 B one.
- **The user's modified file:** `docs/audit/28-prepass-evidence.md` still has the user's pre-existing modification. I did not touch or stage it.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 39-08 (WF04):** `## Levels` already points at `agent-factory/workflows/04-ticket-to-pr.md` for the `failed-attempt` procedure. WF04 must now describe that procedure, and must forbid a `model` or `effort` parameter on the engineer spawn, per T-39-11.
- **Human check, end of phase:** on Claude Code 2.1.293+, spawn `grugops-software-engineer-junior`, `-mid` and `-senior` by name with no parameters. Read each one's model and effort from `/tasks`. Both are `UNKNOWN - verify` until someone runs this.

## Self-Check: PASSED

- FOUND: `.claude/agents/grugops-software-engineer-junior.md`, `-mid.md`, `-senior.md`, and `docs/audit/29-style-dispositions/39-07.md`.
- ABSENT, as intended: `.claude/agents/grugops-software-engineer.md`.
- FOUND: `d585bc45` and `62ca47a1`, both ancestors of HEAD.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
