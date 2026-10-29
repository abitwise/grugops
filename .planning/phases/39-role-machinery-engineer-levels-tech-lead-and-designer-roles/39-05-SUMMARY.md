---
phase: "39"
plan: "05"
subsystem: kit-roles
tags: [tech-lead, complexity-rubric, role-ceilings, tiered-preset, derived-counts, style-dispositions, vitest]

requires:
  - phase: 39
    provides: "39-01: listAgentAdapterNames / listAgentAdapterSpecs; 39-02: one adapter per spec, generated coordinator grant; 39-03: ROLE_CEILINGS key-set check, RECORDED_ADDED in adapter-byte-baseline; 39-04: ROLE_SCHEMA and guard_role_frontmatter"
provides:
  - "agent-factory/roles/tech-lead.md: the Tech Lead role (tier core, read edit shell), plain-English body, caveman fence"
  - "agent-factory/checklists/complexity-rubric.md: F1-F6, the seven ordered mapping rules, junior exclusions incl. test integrity, unknowns, record, LOW confidence"
  - "Generated .claude/agents/grugops-tech-lead.md at model: inherit with no effort line; coordinator grant names it"
  - "ROLE_COUNT 18, SPAWN_GRANT_SCAN_COUNT 34, GOVERNED_CORPUS_COUNT 49, TECHNICAL_NAMES_COUNT 77, BANNED_CLAIM_SCAN_COUNT 124, each moved by measurement with a dated comment"
  - "TIERED row tech-lead (opus); ROLE_CEILINGS row tech-lead.md 3572 3381; register Table A row; RECORDED_ADDED new-role record"
  - "scripts/tier-kit-text.test.ts: text cases for the rubric and the role (later Phase 39 plans add the Designer, Levels, WF04, WF14)"
  - "docs/audit/29-style-dispositions/39-05.md: 40 added-clause rows; the diff-disposition gate is back at 721"
affects: [39-06, 39-07, 39-08, 39-09, 39-10, check-foundation-guards, adapter-byte-baseline, install tests]

actuals:
  tokens: 33212
  tasks: 1
  commits: 1
plan_head_before: e79b5292658bfde21ba56612fa9825312413a81b
plan_head_after: d5b698192bd1e91d108b9a03f9f27f666640fed6

tech-stack:
  added: []
  patterns:
    - "A new role lands with its measured ceiling, TIERED row, register row, generated adapter, catalog row and disposition rows in one commit"
    - "A clause written into any role's `## Hard limits` is frozen kit-wide by its normalized text; reuse of a clause another file edits makes those edits FROZEN"

key-files:
  created:
    - agent-factory/roles/tech-lead.md
    - agent-factory/checklists/complexity-rubric.md
    - .claude/agents/grugops-tech-lead.md
    - scripts/tier-kit-text.test.ts
    - docs/audit/29-style-dispositions/39-05.md
    - scripts/fixtures/*/agent-factory/checklists/complexity-rubric.md (11 validator fixtures)
  modified:
    - agent-factory/checklists/00-index.md
    - scripts/validate-agent-factory.ts / .js
    - scripts/kit-model.ts / .js, scripts/kit-model.test.ts
    - scripts/model-tiers.ts / .js, scripts/model-tiers.test.ts
    - scripts/check-foundation-guards.ts / .js, scripts/check-foundation-guards.test.ts
    - scripts/check-imperative-lexicon.ts / .js, scripts/check-imperative-lexicon.test.ts
    - scripts/check-banned-claims.ts / .js
    - scripts/adapter-byte-baseline.test.ts
    - .claude/agents/grugops-orchestrator.md, docs/catalog/README.md, hooks/hook-entry.ts / .js (generated)
    - docs/audit/28-disposition-register.md, docs/audit/28-safety-surface-exclusions.md (generated)
    - install/*.test.ts (8 files), scripts/{audit-prepass,canonical-frontmatter,check-audit-register,frontmatter,generate-catalog,trace-instructions,uat-gate-exit-contract}.test.ts

key-decisions:
  - "The Tech Lead's Hard limits end with `Merge and deploy stay with humans.` and not `Humans hold merge and deploy.`: the frozen set is keyed by normalized clause kit-wide, and the second wording froze six already-dispositioned edits of that clause in workflows 04, 14 and 15"
  - "ROLE_CEILINGS tech-lead.md = 3572 3381, from the measured 3189 B at +12% / +6% rounded up"
  - "tier-kit-text.test.ts does not import TICKET_KEYS: the one-authority census refuses a text scanner that imports the ticket key half; D-9 is checked as text, and TICKET_KEY_COUNT already pins the key set"
  - "Live-kit counts in tests read the derivations (listAgentAdapterNames, listSkillAdapters, ROLE_COUNT, the resolver); install-side measured pins (WRITE_PATH_COUNT, READ_PATH_COUNT, INSTALLED_FILE_COUNT, REMOVABLE_COUNT, KIT_PATH_COUNT, RECORDED_FILE_COUNT, SCRIPTS_TEST_FILE_COUNT, SCAN_SET_SIZE, TRIPWIRE_MODULES) moved by one each with dated history lines, following each file's own precedent"

patterns-established:
  - "New-role adapters are asserted at `model: inherit` with no effort line by a case over RECORDED_ADDED kind new-role, with a non-vacuity premise"

requirements-completed: []  # Plan declares TIER-01, TIER-03, TIER-06; all three are also claimed by later Phase 39 plans, so requirements.ready-ids returned none ready and the orchestrator ticks them at phase close.

coverage:
  - id: D1
    description: "complexity-rubric.md states the F3 = 2 tags (auth, money, PII, security, migration, concurrency, test integrity), that any one exclusion makes junior impossible, the ordered mapping, the band boundaries, the adjacency rule, unknowns, the record order and the LOW-confidence label"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#complexity-rubric.md (TIER-01, TIER-03, D-11, D-12, D-31)"
        status: pass
    human_judgment: false
  - id: D2
    description: "tech-lead.md carries the required sections, one WF16 and one WF18 reference, points at the rubric without restating it, and states the D-04..D-07, D-10, D-17, D-19, D-21 contract"
    requirement: TIER-01
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#tech-lead.md (TIER-01; D-01, D-04..D-07, D-10, D-12, D-17, D-19, D-21)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "18 roles and 18 adapters, the new adapter granted at model: inherit with no effort line, every derived count moved once by measurement"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts, scripts/model-tiers.test.ts, scripts/adapter-byte-baseline.test.ts"
        status: pass
      - kind: other
        ref: "node -e acceptance check (ROLE_COUNT 18, listRoles 18, SPAWN_GRANT_SCAN_COUNT 34, listAgentAdapterNames 18)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The disposition gate is back at the pre-phase 721 findings with a row for every added clause"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)' == 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The role reads well in plain English and the rubric's starting values are sensible"
    verification: []
    human_judgment: true
    rationale: "Voice quality and whether the LOW-confidence starting thresholds suit real tickets are reader judgments no test asserts"

duration: 70min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 05: The Tech Lead Role and the Complexity Rubric Summary

**The kit now has an 18th role, the Tech Lead. It scores each ticket against a new six-factor checklist, `complexity-rubric.md`, names the engineer level and plans the dev tasks on top of the Architect's notes. Its generated adapter runs on `model: inherit` and the coordinator is granted it. Every count it moved was moved by measurement, and every gate is green with the disposition count back at 721.**

## Performance

- **Duration:** about 70 min
- **Started:** 2026-10-29T18:09:30Z
- **Completed:** 2026-10-29T19:19:38Z
- **Tasks:** 1 (tracer)
- **Files modified:** 55 (16 created)

## Accomplishments

- **`agent-factory/roles/tech-lead.md`** (3,189 B; `tier: core`, `capabilities: read edit shell`). The body is plain English and only the fence is caveman. It contains:
  - the config line and the three footer pointers, copied verbatim from `architect-design.md`;
  - the Architect boundary: F2 = 2 sends the ticket back to `In Design`;
  - the `SPLIT_REQUIRED` return;
  - fully specified dev tasks: a file path, the change, and Given/When/Then cases;
  - the named adapter the Orchestrator dispatches;
  - the four Blocked moves, recorded in a new decision note;
  - the decision-note and `## Tech Lead plan` output, with no ticket key and no dev-plan file;
  - Hard limits: the plan is guidance, never escalate twice, then a named human.
- **`agent-factory/checklists/complexity-rubric.md`** (`kind: checklist`, `tier: lean`). It contains:
  - the F1-F6 table, where the F3 = 2 cell includes test integrity;
  - seven numbered mapping rules, with inclusive bands and the adjacency sentence;
  - the junior exclusions;
  - unknowns, scored 2;
  - the record order;
  - the LOW-confidence label, with recalibration after about 30 tickets.
  It is listed in `00-index.md` and in `CHECKLISTS`.
- **Pins moved by measurement**, each with a dated comment:

  | Pin | Change |
  |---|---|
  | `ROLE_COUNT` | 17 -> 18 |
  | `SPAWN_GRANT_SCAN_COUNT` | 33 -> 34 |
  | `GOVERNED_CORPUS_COUNT` | 48 -> 49 |
  | `TECHNICAL_NAMES_COUNT` | 76 -> 77 |
  | `BANNED_CLAIM_SCAN_COUNT` | 121 -> 124 |

  New entries: a `TIERED` row `tech-lead` (opus) with quality-only rationales, a `ROLE_CEILINGS` row `3572 3381`, a register Table A row, and a `RECORDED_ADDED` new-role record. A new baseline case asserts that new-role adapters run on `model: inherit` with no effort line.
- **Regenerated:** the adapters (18; the coordinator grants 17 names), the catalog, the hook manifest and the safety-surface list.
- **`docs/audit/29-style-dispositions/39-05.md`** has 40 added rows. The 14 rows in the `## Hard limits` section carry a companion cell. `check-diff-disposition` prints 721 findings.

## Task Commits

1. **Task 1 (tracer): the Tech Lead role and its rubric become a granted, catalogued adapter with every gate green**: `d5b69819` (feat)

**Tracer gate:** I re-ran the automated `<verify>` end to end and it passed, with no expansion task after it.

## Verification

- `npm run build && npm run typecheck`: ok.
- `npx vitest run` over the plan's 8 files plus `check-imperative-lexicon`, `check-banned-claims`, `check-audit-register` and `check-diff-disposition`: all pass.
- All ten gates exit 0: `check-foundation-guards`, `validate-agent-factory` (with `VALIDATE_KIT_ROOT=.`), `check-audit-register`, `check-imperative-lexicon`, `check-banned-claims`, `check-kit-refs`, `freshness:adapters`, `freshness:catalog`, `freshness:hook-manifest` and `freshness`.
- `check-diff-disposition` prints `721 finding(s)`.
- All 8 acceptance criteria pass. `tech-lead.md` is 3,189 B against the 3,200 limit.
- Full non-e2e suite after the commit: 20 failures in 6 files. These are the pre-existing reds listed in `deferred-items.md`:
  - context-io: 7
  - context-io-writer-set: 2
  - canonical-corpus: 1
  - harness-instance-ledger: 4
  - uat-gate-exit-contract: 5
  - installer-fs-census: 1

## Decisions Made

- **The Hard limits ending is `Merge and deploy stay with humans.`** The first draft ended `Humans hold merge and deploy.` The gate freezes every clause in a role's `## Hard limits` by its normalized text, across the whole kit. That froze six earlier edits of the same clause in workflows 04, 14 and 15, which already had rows, and turned them into FROZEN findings. The rule is unchanged, and the disposition file records why.
- **The Tech Lead's `TIERED` row is `opus`.** D-03 fixes this. Its effort is `high`, computed from the alias. The header comment and the composition test now name five opus rows.
- **`tier-kit-text.test.ts` checks D-9 as text** and does not import `TICKET_KEYS`. See Deviation 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Literal live-kit counts in tests outside the plan's file list**
- **Found during:** Task 1, running every test file that reads the role or adapter corpus.
- **Issue:** Many tests still typed 17-role numbers: 16, 17, 23, 24, 33, 36 and 37.
- **Fix:** These cases now read the derivations (`LIVE_ADAPTERS`, `LIVE_SKILLS`, `ROLE_COUNT`, `SPAWN_GRANT_SCAN_COUNT`, the resolver's tiered answer, `AUDIT_SET_COUNT`, `WATCHED_CORPUS_MIN + RESIDUE_FROM_REGISTRY_COUNT + 1`):
  - KIT-03, wr05 and adapter-body in check-foundation-guards.test.ts;
  - mirror and zero-config cases in kit-model.test.ts and model-tiers.test.ts;
  - the ROLE_NAMES fixture in generate-catalog;
  - check-audit-register;
  - canonical-frontmatter's agent part;
  - frontmatter's scan count;
  - audit-prepass;
  - uat-gate's watched-corpus count;
  - four install.test sites.

  Measured pins that move by hand in their own files moved by one, each with a dated history line:
  - `TRIPWIRE_MODULES` 81
  - `SCRIPTS_TEST_FILE_COUNT` 81
  - `SCAN_SET_SIZE` 79
  - `WRITE_PATH_COUNT` 116
  - `READ_PATH_COUNT` 78
  - `INSTALLED_FILE_COUNT` 76
  - `REMOVABLE_COUNT` 46
  - both `KIT_PATH_COUNT`s 25
  - `RECORDED_FILE_COUNT` 44, with its WHY string at 18 adapters
- **Commit:** d5b69819

**2. [Rule 3 - Blocking] Validator fixtures lacked the new required checklist**
- **Issue:** `CHECKLISTS` gained `complexity-rubric`, so each of the 11 kits under `scripts/fixtures/*` failed with `missing required checklist file`.
- **Fix:** Each fixture kit now has the same existence-only stub its other checklists use.
- **Commit:** d5b69819

**3. [Rule 1 - Bug] The first draft of tier-kit-text.test.ts imported `TICKET_KEYS`**
- **Issue:** The one-authority census in validate.test.ts refuses a file that scans text and also imports the ticket key half.
- **Fix:** The D-9 case now asserts that neither file writes a `level:` key and that the Output section says "No ticket frontmatter key". `TICKET_KEY_COUNT` in board-model already pins the key set two-sided.
- **Commit:** d5b69819

**4. [Rule 2 - Missing critical] A non-vacuity premise on the new-role adapter case**
- **Fix:** The case fails if RECORDED_ADDED has no new-role record, so it cannot pass over nothing.
- **Commit:** d5b69819

---

**Total deviations:** 4 auto-fixed (2 blocking, 1 bug, 1 missing critical).
**Impact on plan:** None of them change behaviour. Each keeps a test or gate honest about the 18th role. Nothing was loosened: no assertion was removed, and every typed number either became a derivation or moved by a measured, dated step.

## Issues Encountered

- `orchestrator.md`'s adapter was already in pointer-size WARN at HEAD (3,259 B against 3,072 B). The grant name moves it to 3,278 B, still WARN and not FAIL.
- `floor-invariance.test.ts` fails before the commit because the regenerated `hooks/hook-entry.ts` is uncommitted. It is green after the commit.
- The register's `_role-switch-protocol.md` observation still says "the role count 17". That is a pre-existing narrative row, and I left it unchanged.

## Known Stubs

None.

## Next Phase Readiness

- Plan 39-06 (Designer) can follow the same shape: measure the role, add a ROLE_CEILINGS row, a TIERED row, a register row and a RECORDED_ADDED new-role record, then regenerate. Expect the same set of measured install pins to move by one. Keep `## Hard limits` clauses distinct from clauses already in the kit.
- Plan 39-07 (levels) will move `LIVE_ADAPTERS` through the derivation automatically. The measured install pins and `RECORDED_FILE_COUNT_WHY` will need a level-aware move.

## Self-Check: PASSED

- FOUND: agent-factory/roles/tech-lead.md, agent-factory/checklists/complexity-rubric.md, .claude/agents/grugops-tech-lead.md, scripts/tier-kit-text.test.ts, docs/audit/29-style-dispositions/39-05.md
- FOUND: d5b69819 in HEAD's history

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
