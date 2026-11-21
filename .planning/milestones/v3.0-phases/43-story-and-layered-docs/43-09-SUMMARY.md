---
phase: 43-story-and-layered-docs
plan: "09"
subsystem: user-docs
status: complete
tags: [how-it-works, concepts, claim-registry, mermaid, gap-d1, STORY-02, STORY-04, STORY-05]

requires:
  - phase: 43-story-and-layered-docs
    provides: "the retired claim status and baseline (43-01), shippedDocs() joined to the public-docs corpus at cfd56f60 (43-02), the story-docs gate with the GAP-D1 and shipped-link checks (43-03), the reference role and skill pages (43-04, 43-05)"
provides:
  - "docs/how-it-works.md: the mechanics page, one mermaid flowchart plus the same six steps as numbered text, one section per step, § How work flows (moved, C-28-033), § Open gaps with the GAP-D1 sentence"
  - "docs/concepts.md: the core-concept page with § Specialist roles, § The shared verified context, § The board is the state, § The gate is the backpressure, § Humans decide, each linked to its mechanics section"
  - "C-28-033 moved byte for byte from agent-factory/README.md, same id; the README keeps the heading and one pointer line"
  - "Claim rows C-28-048..C-28-060 (13 new, all architecture, all true), CLAIM_KIND_CARDINALITY architecture 33 -> 46"
  - "PUBLIC_DOCS_SCAN_COUNT 40 -> 42, BANNED_CLAIM_SCAN_COUNT 157 -> 159, each move read off the gate's refusal"
  - "docs/audit/29-style-dispositions/43-09.md: the LANG-03 disposition rows the move owed"
affects: [43-10, 43-11, 43-12]

tech-stack:
  added: []
  patterns:
    - "A sentence about a merge, deploy or production step is stated as the kit text's instruction or at its checkpoint's default, and points to GUARANTEES.md, so it stays an architecture row with no depends_on"
    - "Registry rows built from the page: the verbatim block is cut from the lines below each anchor up to the blank line, so it equals what check-claim-anchors compares"

key-files:
  created:
    - docs/how-it-works.md
    - docs/concepts.md
    - docs/audit/29-style-dispositions/43-09.md
  modified:
    - agent-factory/README.md
    - docs/audit/28-claim-registry.md
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/flow-guidance-text.test.ts

key-decisions:
  - "Every new claim row is `architecture` with no depends_on. The release and humans-decide sentences are stated at the production_requires_human_confirmation checkpoint's default, or as what the role and workflow files tell agents, and point to GUARANTEES.md, so lowering a floor does not falsify them and no SAFETY_CLAIM_HOMES entry was needed"
  - "The Open gaps item about live runs says whether a session follows the route to the Orchestrator is `UNKNOWN - verify`, not that no live run happened: install/README.md records launch forms a person verified live on Antigravity CLI, OpenCode and Pi"
  - "The concepts page says the reference has a page for every role 'with its one job and a link to its role file', which holds both before and after plan 43-14 widens the role pages"
  - "The registry's dated header annotations were added, not rewritten: one for 55 rows at the mechanics page, one for 60 rows at the concepts page, both derived from readRegistry().claims.length"

requirements-completed: [STORY-02, STORY-04, STORY-05]

duration: 20min
completed: 2026-11-18
commits: 4
plan_head_before: 40d45a63dbc4f8dba2e63dd6bb1183a250916074
plan_head_after: 5abcbf11a6e4538d48c31c9b3730c059873e0dc4
actuals:
  tokens: 15720   # chars/4 over the realized diff (62882 chars), 40d45a63..5abcbf11
  tasks: 3
  commits: 4

coverage:
  - id: D1
    description: "docs/how-it-works.md carries § How work flows with the C-28-033 anchor and bullets byte for byte; the registry row follows; agent-factory/README.md points to the page"
    requirement: STORY-04
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js (exit 0; anchors found: agent-factory/README.md 16, docs/how-it-works.md 1 at task 1, 60 verbatim comparisons byte-identical at the end)"
        status: pass
      - kind: other
        ref: "grep -rl 'claim: C-28-033' README.md AGENTS.md agent-factory/README.md docs/*.md prints exactly 'docs/how-it-works.md '"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#says the Orchestrator claims at dispatch, and no longer says a role claims its subtask"
        status: pass
    human_judgment: false
  - id: D2
    description: "The mechanics page: one mermaid block, six numbered steps, one section per step, § Open gaps with the exact GAP-D1 sentence, no cost or speed benefit"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "Task 2 acceptance greps: mermaid 1, GAP-D1 1, Open gaps 1, numbered 6, benefit words 0"
        status: pass
      - kind: other
        ref: "npm run check:story-docs (exit 0; GAP-D1 0 findings over 44/44, shipped links 0 findings over 39/39)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The core-concept page with its five sections, a GUARANTEES.md link and no `always`"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "Task 3 acceptance: the five headings present (OK), GUARANTEES.md 1, always 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every absolute on both pages is anchored with a contiguous new id and a measured row; the cardinality and both scan pins moved off the gates' refusals; each page's first commit descends from the corpus-join commit"
    requirement: STORY-04
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js && node scripts/check-audit-register.js && node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js (all exit 0)"
        status: pass
      - kind: other
        ref: "git merge-base --is-ancestor cfd56f60 0b1bb68f and cfd56f60 155bd9b9 (both exit 0)"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts and scripts/check-claim-anchors.test.ts (whole files)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The pages read clearly, the claim rows' measurements are honest, and the humans-decide wording does not overstate the safety floor"
    verification: []
    human_judgment: true
    rationale: "The gates prove each row's text is at its anchor and every count moved; no gate proves a mechanism was honestly measured or that the prose is accurate and clear. A person reads both pages and rows C-28-048..C-28-060 against the kit files they cite"
---

# Phase 43 Plan 09: How grugops works and the core concept Summary

**Two new shipped pages inside the claim gates: docs/how-it-works.md follows one request from the Orchestrator through the queue, notes, gate, trace and release to the person who decides, with one mermaid flowchart, the same steps as text, the moved § How work flows (C-28-033) and an Open gaps section carrying GAP-D1; docs/concepts.md explains the five ideas behind it. Thirteen new claim rows, C-28-048..C-28-060, all measured against named kit files.**

## Performance

- **Duration:** about 20 min (04:37Z to 04:57Z, after the required reading)
- **Tasks:** 3, plus one gate fix
- **Files modified:** 13 (3 created, 10 modified)

## Accomplishments

- `docs/how-it-works.md`: an opening, `## The flow at a glance` (a `flowchart LR` mermaid block and six numbered steps), then one section per step: the request, the Orchestrator splitting it, the queue and claims (`claim.js free/claim/done`, `queue.wip_limit`, `now-running.md`), notes admitted through `note.js` and refused as `unsealed` otherwise, the gate's recommendation, the rendered trace, the release step, and where merge and deploy are held. It ends with `## How work flows` (moved) and `## Open gaps`.
- `docs/concepts.md`: `# The core concept` with the five planned sections. Each section links its mechanics section in how-it-works.md. The humans-decide section names the git host as the hard floor and the ask rules as a speed bump, and links GUARANTEES.md.
- C-28-033 moved byte for byte. agent-factory/README.md keeps `## How work flows` and the line `See [How work flows](../docs/how-it-works.md#how-work-flows) in How grugops works.`
- Registry: rows C-28-048..C-28-055 (how-it-works) and C-28-056..C-28-060 (concepts), each `architecture`, `status: true`, with a mechanism naming the kit file, section or code it was measured against. C-28-033's `file`, `line` and `mechanism` changed. Two dated header annotations (55 rows, then 60 rows), derived from `readRegistry().claims.length`.

## Task Commits

1. **Task 1 (tracer): the move, end to end** — `0b1bb68f` docs(43-09): How work flows moves to docs/how-it-works.md with its claim
2. **Task 2: the mechanics** — `613fd2c9` docs(43-09): how-it-works walks the flow step by step
3. **Task 3: the core concept** — `155bd9b9` docs(43-09): concepts explains roles, shared context, board, gate and humans
4. **Gate fix (Rule 3)** — `5abcbf11` docs(43-09): disposition rows for the How work flows move

Tracer feedback gate (Task 1): not auto mode, `human_verify_mode: end-of-phase`, automated-only `<verify>`. Re-ran the full verify chain (exit 0, no FAIL line), 254 tests across four files, and all four acceptance criteria before expanding.

## Pin moves, read off each gate's refusal

| Pin | Move | Refusal (verbatim head) | Commit |
|---|---|---|---|
| PUBLIC_DOCS_SCAN_COUNT | 40 -> 41 | `the public-docs scan set derived 41 document(s), expected exactly 40 (… docs 29)` | 0b1bb68f |
| BANNED_CLAIM_SCAN_COUNT | 157 -> 158 | `the banned-claim scan set derived 158 document(s), expected exactly 157 (… publicDocs 42 …)` | 0b1bb68f |
| CLAIM_KIND_CARDINALITY architecture | 33 -> 41 | `architecture declares 33 but the registry carries 41` | 613fd2c9 |
| PUBLIC_DOCS_SCAN_COUNT | 41 -> 42 | `the public-docs scan set derived 42 document(s), expected exactly 41 (… docs 30)` | 155bd9b9 |
| BANNED_CLAIM_SCAN_COUNT | 158 -> 159 | `the banned-claim scan set derived 159 document(s), expected exactly 158 (… publicDocs 43 …)` | 155bd9b9 |
| CLAIM_KIND_CARDINALITY architecture | 41 -> 46 | `architecture declares 41 but the registry carries 46` | 155bd9b9 |

Each move has a dated history comment naming the page. The banned-claims runs reported 0 findings over 158/158 and 159/159 elements.

## Files Created/Modified

- `docs/how-it-works.md`, `docs/concepts.md`: the two pages
- `docs/audit/29-style-dispositions/43-09.md`: five LANG-03 disposition rows for the move
- `agent-factory/README.md`: the section's bullets and anchor leave; the heading and a pointer line stay
- `docs/audit/28-claim-registry.md`: C-28-033 re-homed; 13 new rows; two header annotations
- `scripts/check-audit-register.ts` / `.js`: CLAIM_KIND_CARDINALITY with dated notes
- `scripts/check-audit-register.test.ts`: MIRROR_ARCHITECTURE_CLAIMS 33 -> 41 -> 46, moved by hand with the map
- `scripts/check-public-docs-vocabulary.ts` / `.js`, `scripts/check-banned-claims.ts` / `.js`: the two scan pins
- `scripts/flow-guidance-text.test.ts`: reads the lifecycle bullet from its new home and asserts the README pointer

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] flow-guidance-text test read the moved bullet from the kit README**
- **Found during:** Task 1
- **Issue:** `scripts/flow-guidance-text.test.ts` "says the Orchestrator claims at dispatch …" looked for `- **The lifecycle**` in agent-factory/README.md and failed once the bullet moved.
- **Fix:** The case reads `docs/how-it-works.md` for the bullet (same five-line and wording assertions) and also asserts the README carries the pointer and no longer carries the bullet.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Commit:** 0b1bb68f

**2. [Rule 3 - Blocking] MIRROR_ARCHITECTURE_CLAIMS moved with CLAIM_KIND_CARDINALITY**
- **Found during:** Tasks 2 and 3
- **Issue:** `scripts/check-audit-register.test.ts` keeps a hand-moved mirror of the architecture count, tied to the map by its "mirror's distribution equals the declared map" case.
- **Fix:** Moved 33 -> 41 -> 46 in the same commits as the map, with dated notes, as plans 29-52 and 29.1-06 did.
- **Commits:** 613fd2c9, 155bd9b9

**3. [Rule 3 - Blocking] check-diff-disposition went red on the move**
- **Found during:** the post-task baseline gate run
- **Issue:** `node scripts/check-diff-disposition.js` exits 0 in 43-BASELINE.md but exited 1 after Task 3: `diff disposition — changed watched file(s): 5 finding(s) over 29 elements`, all in agent-factory/README.md (the removed anchor, the added pointer line, and the three base-commit lifecycle lines plan 41-06 had reworded). The kit README is in the LANG-03 watched corpus through the registry's safety arm.
- **Fix:** `docs/audit/29-style-dispositions/43-09.md`, one row per finding under D-28, each naming the registry change in the move's commit as its companion. The gate went back to exit 0 (`0 findings over 29/29 elements`), and `scripts/check-diff-disposition.test.ts` passed 153/153.
- **Files modified:** docs/audit/29-style-dispositions/43-09.md (new; not in the plan's files_modified)
- **Commit:** 5abcbf11

**4. [Plan wording] Task 1's pointer and opening sentence**
- The opening sentence of how-it-works.md says the page runs "to the point where a person decides whether to merge and release the change", not "to a person merging it", so the page states no merge outcome.
- how-it-works.md's opening line gained a link to concepts.md in Task 3, appended to the same line so no anchored line moved.

**Total deviations:** 3 auto-fixed (all Rule 3) and 1 wording note. **Impact:** two test files and one audit record outside files_modified; no scope change.

## Same-wave re-runs (plan 43-14)

None needed. Plan 43-14 committed nothing between `40d45a63` and `5abcbf11`, and no gate or test went red naming a 43-14 path. This plan staged only its own files, by name.

## Verification

- Every task `<automated>` command passed: `npm run build`, check-claim-anchors, check-audit-register, check-public-docs-vocabulary, check-banned-claims, `npm run check:story-docs`, check-state-paths, `npm run freshness:guarantees`, `npm run freshness` (93 `.js` fresh), `npm run check:build-parity`, all exit 0.
- Task vitest sets: Task 1 3 files 118/118, then 4 files 254/254 after commit; Task 2 10 files 638/638; Task 3 9 files 581/581.
- Every acceptance criterion passed, including both corpus-join ancestry checks (`cfd56f60` is an ancestor of `0b1bb68f` and of `155bd9b9`).
- 43-BASELINE.md gate table re-run after the last commit: 13 gates exit 0 and `check-flip-manifest` exit 1, as at base; `check-story-docs` and `npm run typecheck` exit 0.
- Broader targeted run (check-banned-claims, check-public-docs-vocabulary, installer-kit-home, installer-dry-run, check-foundation-guards, generate-catalog, catalog-freshness, check-state-paths, generate-safety-surface, check-flip-manifest, check-uat-oracles tests): 726 passed, 1 failed. The failure is the baseline LANG-07 case, same name as at base. An earlier run of the uat-gate-exit-contract tests showed only its five baseline reds.
- The full suite was not run; the orchestrator runs it after this wave.

## Issues Encountered

- Before the first commit, `scripts/check-banned-claims.test.ts` "THE MISSING DIRECTION … an intruder is NAMED" failed naming `docs/how-it-works.md`, because the page was untracked. It passed once the page was committed. A new page must be committed before that test can pass.

## Known Stubs

None. The `UNKNOWN - verify` markers in § Open gaps are intended: they state open gaps that install/README.md also records.

## Threat Flags

None. The plan adds documentation only: no endpoint, auth path, file access or schema change.

## User Setup Required

None.

## Next Phase Readiness

- Plan 43-10 can move C-28-027..C-28-030 into `docs/usage.md` the same way. That move will also owe LANG-03 disposition rows for agent-factory/README.md in `docs/audit/29-style-dispositions/`.
- Plan 43-11 can point README.md at docs/concepts.md and docs/how-it-works.md; the next free claim id is C-28-061.

## Self-Check: PASSED

- FOUND: docs/how-it-works.md, docs/concepts.md, docs/audit/29-style-dispositions/43-09.md
- FOUND commits: 0b1bb68f, 613fd2c9, 155bd9b9, 5abcbf11 (4 = `git rev-list --count 40d45a63..HEAD`)
- `gsd-tools check evaluation-scope --plan 43-09 --commits-only` resolved the plan's commits on this branch
