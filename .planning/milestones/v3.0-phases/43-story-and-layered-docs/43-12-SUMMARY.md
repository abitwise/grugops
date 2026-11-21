---
phase: 43-story-and-layered-docs
plan: 12
subsystem: docs
tags: [honesty-sweep, reader-review, claim-registry, hand-trace-scan, changelog, faq, phase-gate]

requires:
  - phase: 43-story-and-layered-docs
    provides: "v3 worked examples (43-07, 43-08), the docs pages (43-09, 43-10, 43-11), the reference pages (43-04, 43-05, 43-14), docs in the kit home (43-06, 43-15), the retired claim status and the baseline (43-01)"
provides:
  - "examples/ in the permanent hand-trace scan (SCAN_SET_SIZE 85)"
  - "docs/faq.md on the new story, with C-28-071 and C-28-072"
  - "board-corpus example rows cite commit 161bf23d for their transcription"
  - "CHANGELOG Unreleased entries for phase 43, with the dated docs/catalog/ removal"
  - "43-READER-REVIEW.md: 18 pages x 10 items, 12 findings, the phase gate"
  - "C-28-073 and C-28-074 registering two moved docs/usage.md absolutes"
affects: [43-13 UAT, phase verification]

actuals:
  tokens: 17300
  tasks: 3
  commits: 4
plan_head_before: f41f49c81f92bf0692b1f369d7be8401bb67a839
plan_head_after: efa0539ebec2c4ce3b5753d5f138c5134a0aace4

tech-stack:
  added: []
  patterns:
    - "A reader-review fix to anchored text re-measures the row's verbatim and mechanism in the same commit"
    - "A corpus row that no longer matches its source keeps its text and names the commit it was transcribed from"

key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/43-READER-REVIEW.md
    - .planning/phases/43-story-and-layered-docs/43-12-task1-red.json
  modified:
    - scripts/trace-instructions.test.ts
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md
    - docs/faq.md
    - docs/README.md
    - docs/usage.md
    - examples/01-greenfield-bootstrap.md
    - examples/02-brownfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - examples/04-sprint-cycle.md
    - docs/audit/28-claim-registry.md
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - scripts/board-corpus.ts
    - scripts/board-corpus.js
    - CHANGELOG.md

key-decisions:
  - "Board corpus: the four example rows keep their transcribed text; their notes name commit 161bf23d, the last commit that held them verbatim, because the v3 examples use the (owner, since) form"
  - "FAQ names no host; it links the start table for the list (plan: name every host or none)"
  - "Anchored overstatements in safety rows (C-28-001, C-28-023) and in the human-kept C-28-033 clause are stated UNKNOWN - verify for the 43-13 UAT, not reworded here"
  - "Two unanchored absolutes moved into docs/usage.md were registered (C-28-073, C-28-074) rather than left"

requirements-completed: [STORY-05, STORY-02, STORY-04]

coverage:
  - id: D1
    description: "examples/ joins the hand-trace scan; SCAN_SET_SIZE 80 -> 85; zero hits; Phase 37 deferred item resolved"
    requirement: STORY-05
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "docs/faq.md on the new story, naming the git host as the hard floor and linking GUARANTEES.md; C-28-071 and C-28-072 registered"
    requirement: STORY-05
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js && node scripts/check-audit-register.js && node scripts/check-banned-claims.js && npm run check:story-docs"
        status: pass
    human_judgment: false
  - id: D3
    description: "Board-corpus provenance notes name commit 161bf23d for the four example rows"
    verification:
      - kind: unit
        ref: "scripts/board-corpus.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "CHANGELOG Unreleased records the phase, with a dated docs/catalog/ removal line"
    verification: []
    human_judgment: true
    rationale: "Changelog wording for humans; no test reads it beyond the story-docs and banned-claim gates"
  - id: D5
    description: "The D-22 reader review of every new and changed page, with its fixes and the findings left for the UAT"
    requirement: STORY-05
    verification: []
    human_judgment: true
    rationale: "Overstatement and the newcomer read (STORY-01 probe) are reader judgments; F-07..F-12 are open for plan 43-13"
  - id: D6
    description: "Phase gate: every 43-BASELINE.md gate exits as at base; full suite failures equal the 21 baseline failures by name"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' at 4ec7c2ba (12031 total, 21 failed, all baseline)"
        status: pass
    human_judgment: false

duration: 41min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 12: Honesty sweep, reader review and phase gate Summary

**The worked examples are now held by the permanent hand-trace scan (85 files, zero hits); the FAQ tells the new story and names the git host as the hard floor in place of its unqualified never-merge sentence; the changelog records the phase with a dated `docs/catalog/` removal; a ten-item reader review of 18 pages fixed six overstatements and handed six judgments to the 43-13 UAT; and the phase gate matches the baseline exactly (21 failing tests, all baseline, no new one).**

## Performance

- **Duration:** 41 min (about 28 of them waiting on the full suite)
- **Started:** 2026-11-18T07:26:48Z
- **Completed:** 2026-11-18T08:08:05Z
- **Tasks:** 3
- **Files modified:** 18 (2 created, 16 modified)

## Accomplishments

- Task 1 (tracer): `EXAMPLES` joins `scanSet()` and the per-directory second listing in
  scripts/trace-instructions.test.ts. The size case failed at 80 naming 85 (RED record
  `43-12-task1-red.json`, `RED_EVIDENCE_OK`), and the pin moved to 85 with a dated history line. The
  scan reports zero line and paragraph hits. The Phase 37 deferred item on the hand-kept trace matrix
  reads `status: resolved` with a dated note naming plans 43-07, 43-08 and 43-12.
- Task 2: docs/faq.md rewritten: what grugops is (linking concepts and how it works), how it differs,
  lock-in (no host named; the start table lists them), the enterprise answer (written rules, the git
  host as hard floor, GUARANTEES.md), why "grug" with the grugbrain.dev attribution, and the
  children's-books answer unchanged. Two absolutes registered as C-28-071 and C-28-072.
- Task 2: board-corpus's four example rows keep their transcribed text; each note now names commit
  `161bf23d` (where `git show` holds the line verbatim) and the commit that rewrote the example.
- Task 2: CHANGELOG `## [Unreleased]`: Added (docs pages, reference pages, `retired` status), Changed
  (README front door and tagline, docs and examples in the kit home, v3 examples, CLAUDE.md commands),
  Removed (`docs/catalog/`, removed 2026-11-18, replaced by `docs/reference/`).
- Task 3: 43-READER-REVIEW.md with `## Checklist`, `## Pages` (18 rows x 10 items), `## Findings`
  (F-01..F-12, before and after text, commits) and `## Phase gate`.

## Task Commits

1. **Task 1: examples/ joins the hand-trace scan** - `7b79b080` (test)
2. **Task 2: faq, board-corpus provenance and the changelog** - `c0726b38` (docs)
3. **Task 3: reader review** - `4ec7c2ba` (docs, the first three fixes, committed before the full suite so the suite ran on a committed tree) and `efa0539e` (docs, the review file, the remaining fixes and the gate result)

## TDD Gate Compliance (Task 1)

- RED: `npx vitest run scripts/trace-instructions.test.ts --reporter=tap-flat`, exit 1; the target
  `has SCAN_SET_SIZE (80) files (plan 37-32)` failed with `scan set 85 files; … expected 85 to be 80`;
  97 other cases passed, the two-listing equality and the zero-hit scan among them. Classifier:
  `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: a valid RED on the planned
  assertion, caused only by the five examples joining both listings.
- GREEN: pin moved to 85; 98/98.
- The plan names one commit for the task, so RED and GREEN landed together in `7b79b080`; the RED
  record is committed beside it.

## Reader review results

Fixed (each before and after in 43-READER-REVIEW.md § Findings):
- F-01 docs/README.md claimed a reference page for every workflow.
- F-02 docs/usage.md: `merge and deploy stay with you` became `the workflows tell the agent to leave merge and deploy to you`.
- F-03 docs/faq.md's enterprise list sentence split (C-28-072 re-measured).
- F-04 examples 01-04: `No agent merges, and no agent deploys.` became run narration (`In this run, …`).
- F-05 docs/usage.md: two moved, never-registered absolutes registered as C-28-073 and C-28-074.
- F-06 example 02: `The kit never fabricates a command` became `The roles are told never to invent a command`.

Stated `UNKNOWN - verify` for plan 43-13's UAT (not passed):
- F-07 C-28-001 (concepts) and C-28-023 (kit README) keep `always`; both safety rows, measured `overstated`, accepted.
- F-08 `single-job "grug" agents` in C-28-001 and C-28-022.
- F-09 C-28-033's `exactly what it needs` (kept word for word by a human on 2026-11-04, D-04) and `accountable end to end`.
- F-10 unregistered absolutes on docs/skills.md and install/README.md, pages the registry has never covered.
- F-11 the newcomer read (STORY-01 probe) on every page.
- F-12 the Orchestrator's own reference page says `Loaded by the Orchestrator in turn`; Compliance Officer and Installer Workflows cells read `UNKNOWN - verify` (both from 43-14).

## Phase gate

- Every 43-BASELINE.md gate re-run: 13 exit 0 and `check-flip-manifest` exit 1 with the same single
  FAIL (the moved manifest), as at base. Also `check:story-docs` 0, `freshness:hook-manifest` 0,
  `npm run typecheck` 0. `check:build-parity` read 1 while the cardinality move's `.js` was
  uncommitted and **0 after `efa0539e`** (re-run: ALL CHECKS PASSED).
- Full suite once at `4ec7c2ba` (07:35:36Z-08:03:15Z): 12031 total, 12008 passed, 21 failed, 2
  skipped. The 21 failures equal 43-BASELINE.md § Full suite by file and test name (a scripted
  comparison found no new and no missing name).
- After the review's last edits: 16 test files that read the changed pages or the registry, 1636
  tests, 1635 passed, the one failure the baseline LANG-07 case. check-banned-claims and
  check-public-docs-vocabulary tests re-run after the commit: 172/172.
- No foundation-guard pin moved: the full suite and the targeted run show only LANG-07, and the
  43-06 and 43-15 handoff sections say `None`.

## Files Created/Modified

- `scripts/trace-instructions.test.ts` - examples/ in both listings; SCAN_SET_SIZE 85
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md` - worked-examples item resolved
- `docs/faq.md` - the new story; C-28-071, C-28-072 anchors
- `docs/README.md`, `docs/usage.md`, `examples/01..04` - reader-review fixes; C-28-073, C-28-074 anchors in usage
- `docs/audit/28-claim-registry.md` - rows C-28-071..074 and two dated count annotations (72, then 74 rows)
- `scripts/check-audit-register.ts/.js`, `scripts/check-audit-register.test.ts` - architecture 56 -> 58 -> 60, each read off the gate's refusal
- `scripts/board-corpus.ts/.js` - provenance notes for the four example rows
- `CHANGELOG.md` - Unreleased entries
- `.planning/phases/43-story-and-layered-docs/43-READER-REVIEW.md` - the review and the phase gate
- `.planning/phases/43-story-and-layered-docs/43-12-task1-red.json` - Task 1 RED evidence

## Decisions Made

See `key-decisions` above. In short: the corpus keeps real transcribed text with a commit citation
instead of being re-synced to the new rows; the FAQ names no host; anchored overstatements in safety
rows or human-decided text go to the UAT instead of being reworded by an executor.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MIRROR_ARCHITECTURE_CLAIMS moved with CLAIM_KIND_CARDINALITY**
- **Found during:** Tasks 2 and 3
- **Issue:** scripts/check-audit-register.test.ts keeps a hand-moved mirror of the architecture count (not in files_modified).
- **Fix:** moved 56 -> 58 -> 60 in the same commits as the map, with dated notes, as plans 43-09..43-11 did.
- **Commits:** `c0726b38`, `efa0539e`

**2. [Plan order] Task 3 landed in two commits**
- **Issue:** the full suite needs a committed tree to be attributable, and the review file needs the suite's result.
- **Fix:** the first three fixes were committed as `4ec7c2ba` before the suite; the review file, the later fixes and the gate result as `efa0539e` with the plan's subject.

**3. [Rule 2 - Correctness] Registering two absolutes on docs/usage.md (F-05)**
- **Issue:** checklist item 5 found two unanchored absolutes moved from README.md in plan 43-10.
- **Fix:** anchored and registered as C-28-073 and C-28-074 with measured mechanisms (install/README.md § 6, `targetAdapterFiles`, and a search of install/*.ts finding no `"agent"` key writer).
- **Commit:** `efa0539e`

**4. [Plan wording] The describe title in trace-instructions.test.ts names examples/**
- The scan-set describe block now reads `the scan set (plans 37-18, 43-12): tracked kit markdown, AGENTS.md and examples/*.md, counted two ways`, and the file header says what the set holds.

**Total deviations:** 2 auto-fixed (1 blocking pin, 1 correctness), 1 ordering note, 1 wording note. **Impact:** no scope change.

## Orchestrator-carried items

1. **Board corpus:** resolved by provenance, not re-sync (key decision above). board-corpus tests pass.
2. **Reader review inputs:** reviewed; how-it-works/concepts rows, usage § Commands and § Jobs, the
   README story, and the 43-14 reference rows are in the table. Judgments a human must make are
   F-07..F-12, none marked passed.
3. **Watched set change from 43-11:** recorded in the review's `## Phase gate` (README.md left, docs/concepts.md joined; 0 findings over 30/30).
4. **43-03 open items:** not addressed here and still open. CLAUDE.md's stack block no longer matches
   research/STACK.md (regenerating would undo the `/grugops` edits); whether check-flip-manifest's
   residual rule would flag the GAP-D1 sentence once its manifest exists is `UNKNOWN - verify` (the
   manifest is still missing, so the rule does not run).
5. **deferred-items.md (docs/dogfood-human-runbook.md):** still open; not in this plan's files and
   checkout-only. It needs a human choice: point it at commit `ab0cda98` or retire its parity step.
6. **Orchestrator post-wave fixes** (`dfc40f31`, `89e1f7e8`): noted; the hook manifest is fresh now.

## Issues Encountered

- `check:build-parity` reads uncommitted `.js` as moved; it passed after the commit, as earlier plans found.
- The user's `docs/audit/28-prepass-evidence.md`, `brand/readme-art.txt` and `~/` were never staged; the prepass file's modification time is still 2026-10-29.

## Known Stubs

None.

## Threat Flags

None. Documentation, test pins and registry rows only. T-43-36 (reader review), T-43-37 (FAQ
sentence gone: `grep -c "deploy prod on their own" docs/faq.md` prints 0) and T-43-38 (examples/ in
the scan with a moved, dated pin) are mitigated as planned.

## User Setup Required

None.

## Next Phase Readiness

Plan 43-13 (UAT) can take F-07..F-12 from 43-READER-REVIEW.md as its reader questions; the next free
claim id is C-28-075.

## Self-Check: PASSED

- FOUND: 43-READER-REVIEW.md, 43-12-task1-red.json, docs/faq.md, scripts/trace-instructions.test.ts
- FOUND commits on HEAD: 7b79b080, c0726b38, 4ec7c2ba, efa0539e (4 = `git rev-list --count f41f49c8..HEAD`)
- Acceptance: SCAN_SET_SIZE 85; deferred item `status: resolved` 1; `deploy prod on their own` 0; `GUARANTEES.md` in faq 1; `docs/catalog/` in Unreleased 1; `docs/reference/` in Unreleased 2; review table rows 37 (≥ 17); cost words over the listed pages 0; review sections all present.
