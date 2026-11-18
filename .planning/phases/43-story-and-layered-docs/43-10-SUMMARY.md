---
phase: 43-story-and-layered-docs
plan: "10"
subsystem: user-docs
status: complete
tags: [usage, jobs, start-table, claim-registry, STORY-01, STORY-02, STORY-04]

requires:
  - phase: 43-story-and-layered-docs
    provides: "shippedDocs() joined to the public-docs corpus (43-02), the story-docs gate (43-03), the reference role and skill pages with per-host invocation (43-04, 43-05, 43-14), the worked examples (43-07, 43-08), docs/how-it-works.md and docs/concepts.md and the move pattern for a claim (43-09)"
provides:
  - "docs/usage.md: § Start a session (the per-host start table, moved from README.md), § Usage across the supported host tools (moved, C-28-027..030), § Commands (C-28-007 and the command fence, moved, plus a link to each skill page), § Jobs with seven job sections, § Copy-paste Orchestrator prompts (moved)"
  - "README.md step 2 and the line under the top fence link docs/usage.md#start-a-session; C-28-007 and the command fence left README.md"
  - "agent-factory/README.md keeps the two moved headings, each with one pointer line to docs/usage.md"
  - "Claim rows C-28-061..C-28-068 (8 new, architecture, true); C-28-007 and C-28-027..030 re-homed with their ids; CLAIM_KIND_CARDINALITY architecture 46 -> 47 -> 54"
  - "PUBLIC_DOCS_SCAN_COUNT 42 -> 43 and BANNED_CLAIM_SCAN_COUNT 159 -> 160, each read off the gate's refusal"
  - "check-uat-oracles reads only a table whose header names a dispatch column; install/host-entry-docs.test.ts reads launch tables one table at a time"
  - "docs/audit/29-style-dispositions/43-10.md: 92 LANG-03 disposition rows for the README and kit README moves"
affects: [43-11, 43-12]

tech-stack:
  added: []
  patterns:
    - "A page with two per-host tables: a scanner that needs one row per host reads one table at a time (a run of consecutive `|` lines), and the dispatch oracle picks its table by a header column, so neither table's rows are read as the other's"
    - "Disposition rows can carry the gate's normalized clause in their before/after cells; normalizeSentence is idempotent on it (checked over all 54 Task 1 clauses)"

key-files:
  created:
    - docs/usage.md
    - docs/audit/29-style-dispositions/43-10.md
    - .planning/phases/43-story-and-layered-docs/43-10-task2-red.json
  modified:
    - README.md
    - agent-factory/README.md
    - docs/audit/28-claim-registry.md
    - install/host-entry-docs.test.ts
    - install/host-tools.test.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-uat-oracles.test.ts
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-diff-disposition.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.test.ts
    - examples/01-greenfield-bootstrap.md
    - examples/02-brownfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - examples/04-sprint-cycle.md
    - examples/05-release-run.md

key-decisions:
  - "docs/usage.md holds two per-host tables (the start table and the dispatch table), so check-uat-oracles reads only a table whose header row names a dispatch column, and START-1 and LIVE-3 read one table at a time; a dispatch table that loses its dispatch column fails `found 0 table row(s)` by name"
  - "§ Start a session puts the table first and the Claude Code paragraphs after it, so no host gets a block above the table; the moved text keeps its words and loses only its three-space list indent"
  - "Every new claim row (C-28-061..068) is `architecture`: each job's human step is stated as what the workflow tells the agent or at its checkpoint's default, and the release row points to docs/GUARANTEES.md, the way plan 43-09's rows did"
  - "The inline examples for the gate, UAT and the daily sweep are marked illustrative and not a captured run"

requirements-completed: [STORY-02, STORY-04, STORY-01]

duration: 23min
completed: 2026-11-18
commits: 4
plan_head_before: 625324e6d6984d72af49eb8ea147e330c6c2c9a5
plan_head_after: 5eaa72f4f586b9233b5f9938ac7ca4a2dd2bb292
actuals:
  tokens: 41898   # chars/4 over the realized diff (167590 chars), 625324e6..5eaa72f4; the RED evidence record's TAP output is part of it
  tasks: 3
  commits: 4

coverage:
  - id: D1
    description: "The per-host start table lives once, in docs/usage.md § Start a session; README.md links it; START-1, CAUTION-1 and LIVE-3 read it there"
    requirement: STORY-01
    verification:
      - kind: unit
        ref: "install/host-entry-docs.test.ts (whole file: START-1, CAUTION-1, LIVE-3 and their mutation cases)"
        status: pass
      - kind: other
        ref: "grep -c '^| \\*\\*Pi\\*\\* |' docs/usage.md = 1, README.md = 0; the corpus-join ancestry check exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "C-28-007 and C-28-027..030 moved to docs/usage.md with their ids, each anchor in exactly one file; the dispatch-table gates read docs/usage.md"
    requirement: STORY-04
    verification:
      - kind: other
        ref: "Task 2 acceptance loop over 007 027 028 029 030 prints OK; node scripts/check-claim-anchors.js (68 verbatim comparisons byte-identical)"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#wording 43-10 (two cases) and #wording 34-06: the PASS line's checked-row count equals registry hosts times table files; install/host-tools.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "§ Jobs: seven job sections, each with a request, linked roles, what lands on disk, the human step, and an example link or inline example"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "Task 3 job-section check: 7 checked, 0 problems; ../examples/0 links 5; ## Jobs 1; cost and speed words 0"
        status: pass
      - kind: other
        ref: "npm run check:story-docs, check:public-docs, check:banned-claims, check-state-paths (all exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The usage page reads clearly and host-neutrally, the job descriptions match the workflows, and rows C-28-061..068 are honestly measured"
    verification: []
    human_judgment: true
    rationale: "The gates prove the text sits at its anchors, the links resolve and no banned wording appears; no gate proves the job descriptions are accurate and clear or that each mechanism was honestly measured. A person reads docs/usage.md § Commands and § Jobs and rows C-28-061..068 against the workflow files they cite"
---

# Phase 43 Plan 10: The usage page Summary

**docs/usage.md is the one place to learn how to start grugops on each host and how to get each job done: it holds the per-host start table moved from README.md, the host-usage section and copy-paste prompts moved from agent-factory/README.md, the command list with C-28-007, and seven job sections (request, roles, what lands on disk, where a person steps in, and a worked or inline example). Five moved claims kept their ids; eight new claim rows, C-28-061..068.**

## Performance

- **Duration:** about 23 min (05:43Z to 06:06Z)
- **Tasks:** 3 (Task 2 in a RED and a GREEN commit)
- **Files modified:** 26 (3 created, 23 modified)

## Accomplishments

- `docs/usage.md`: `# Using grugops`, a two-sentence opening, `## Start a session` (the table, the installer paragraph after it, then the Claude Code paragraphs), `## Usage across the supported host tools` (C-28-027..030, byte for byte), `## Commands` (C-28-061, the example-command fence, C-28-007, the plugin-form paragraph and a link to each `reference/skills/<op>.md`), `## Jobs` and `## Copy-paste Orchestrator prompts` (moved byte for byte).
- `## Jobs`: Bootstrap a repository, Turn an idea into tickets, Take a ticket to a pull request, Run the PR gate, Build a UAT pack, Cut a release, Run a sprint and the daily sweep. Each names the skill page, links the workflow and the role pages, lists the v3 paths that land, and has an anchored "Where you step in" paragraph. Bootstrap links examples 01 and 02; idea to tickets 01; ticket to PR 03; release 05; sprint 04. The gate, UAT and daily sweep have an inline example (a fenced request, what lands, the human step).
- README.md: step 2 is one line linking `docs/usage.md#start-a-session`; the line under the top fence links the same place. C-28-001..006, C-28-008, C-28-009 and the guarantees pointer are untouched.
- agent-factory/README.md: `## Usage across the supported host tools` and `## Copy-paste Orchestrator prompts` each keep the heading and one line linking `../docs/usage.md#…`.
- Registry: C-28-007 (file, line, verbatim without the list indent, mechanism), C-28-027..030 (file, line, mechanism), C-28-008's mechanism notes the table's move; new rows C-28-061 (the command sentence) and C-28-062..068 (each job's human step). Two dated header annotations (61 rows, then 68 rows), derived from `readRegistry().claims.length`.

## Task Commits

1. **Task 1 (tracer): the start table moves** — `c56b346e` docs(43-10): the start table moves to docs/usage.md
2. **Task 2 RED** — `d723340f` test(43-10): the dispatch-table gates read docs/usage.md before the table moves
3. **Task 2 GREEN** — `e33c22fe` docs(43-10): host usage, commands and prompts move to docs/usage.md with their claims
4. **Task 3** — `5eaa72f4` docs(43-10): usage walks each job with its example

Tracer feedback gate (Task 1): not auto mode, `human_verify_mode: end-of-phase`, automated-only `<verify>`. The verify chain was re-run green (7 test files, 532 tests; build and the four gates exit 0) and the corpus-join ancestry check exited 0 before expanding.

## TDD Gate Compliance (Task 2)

- **RED:** `scripts/check-uat-oracles.test.ts > … > wording 34-06: the PASS line's checked-row count equals registry hosts times table files` failed on its exit-status assertion (`expected 1 to be +0`): with `ASYM_TABLE_FILES` naming docs/usage.md before the table moved, the gate read the start-table rows and reported each as lacking its dispatch wording. Command: `npx vitest run scripts/check-uat-oracles.test.ts --reporter=tap-flat --silent -t "checked-row count"`, exit 1. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on the planned behavior gap, not on a load, syntax or fixture fault. Record: `.planning/phases/43-story-and-layered-docs/43-10-task2-red.json`. Two earlier attempts at the record were classified `INVALID_RED (invalid_record)` because test console output and an unindented YAML diagnostic broke the TAP; the run was narrowed to the target test with `--silent`, and the record was not edited to make it parse.
- **GREEN:** `dispatchTableLines()` in check-uat-oracles plus the moves; the RED target, the two new 43-10 cases and the rest of the file pass.
- **REFACTOR:** none.

## Pin moves, read off each gate's refusal

| Pin | Move | Refusal (verbatim head) | Commit |
|---|---|---|---|
| PUBLIC_DOCS_SCAN_COUNT | 42 -> 43 | `the public-docs scan set derived 43 document(s), expected exactly 42 (root 4, examples 5, kitReadme 1, guarantees 1, skills 1, docs 31)` | c56b346e |
| BANNED_CLAIM_SCAN_COUNT | 159 -> 160 | `the banned-claim scan set derived 160 document(s), expected exactly 159 (kit 79, publicDocs 44, …, overlap 3)` | c56b346e |
| CLAIM_KIND_CARDINALITY architecture | 46 -> 47 | `architecture declares 46 but the registry carries 47` | e33c22fe |
| CLAIM_KIND_CARDINALITY architecture | 47 -> 54 | `architecture declares 47 but the registry carries 54` | 5eaa72f4 |

Each move has a dated history comment; MIRROR_ARCHITECTURE_CLAIMS moved by hand with the map. The banned-claims run reported 0 findings over 160/160 elements.

## Files Created/Modified

- `docs/usage.md`: the usage page
- `docs/audit/29-style-dispositions/43-10.md`: 92 disposition rows (50 for the start-table move, 42 for the second move)
- `README.md`, `agent-factory/README.md`: the moved text leaves; pointer lines stay
- `docs/audit/28-claim-registry.md`: five rows re-homed, C-28-008's mechanism note, eight new rows, two header annotations
- `install/host-entry-docs.test.ts`: START-1, CAUTION-1, LIVE-3 read docs/usage.md; `tableBodies`, `launchTables` and `soleLaunchTable` read one table at a time
- `install/host-tools.test.ts`: FLOOR names docs/usage.md
- `scripts/check-uat-oracles.ts` / `.js` / `.test.ts`: ASYM_TABLE_FILES, `dispatchTableLines`, mirror inputs, two new cases
- `scripts/check-audit-register.ts` / `.js` / `.test.ts`, `scripts/check-public-docs-vocabulary.ts` / `.js`, `scripts/check-banned-claims.ts` / `.js`: the pins
- `scripts/check-diff-disposition.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/frontmatter.test.ts`: read docs/usage.md where they read the moved kit README text
- `examples/01..05`: the start-table pointer names docs/usage.md

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two per-host tables on one page**
- **Found during:** Task 2
- **Issue:** The plan puts the start table and the moved dispatch table (C-28-028) on one page. check-uat-oracles, START-1 and LIVE-3 each required exactly one bold row per host per file, so docs/usage.md would show two rows per host: the oracle would read start-table rows as dispatch rows, and LIVE-3 would stop seeing the page as a launch table.
- **Fix:** check-uat-oracles reads only a table whose header names a dispatch column (`dispatchTableLines`), with two cases proving the selection and its fail-closed side; host-entry-docs reads launch tables one table at a time, line numbers kept file-relative.
- **Files modified:** scripts/check-uat-oracles.ts/.js/.test.ts, install/host-entry-docs.test.ts
- **Commits:** d723340f, e33c22fe

**2. [Rule 3 - Blocking] check-diff-disposition went red on both moves**
- **Found during:** Tasks 1 and 2
- **Issue:** README.md and agent-factory/README.md are watched files: 54 findings after Task 1, 42 after Task 2.
- **Fix:** `docs/audit/29-style-dispositions/43-10.md`, one row per distinct clause, as plan 43-09 did; the gate returned to `0 findings over 30/30 elements` each time.
- **Commits:** c56b346e, e33c22fe

**3. [Rule 1 - Bug] The LANG-07 fenced-heading case lost its live examples**
- **Found during:** Task 2
- **Issue:** `check-diff-disposition.test.ts` "every level-one heading BELOW a `## ` section … is FENCED, and there are some" required at least one such line in the watched corpus. The nine it measured were the fenced prompts, which moved to docs/usage.md, outside that corpus, so its floor could not be met.
- **Fix:** The live corpus still must have no offender; the non-vacuity floor moved to two planted documents (a fenced line is examined and passes, an unfenced one is examined and named). The case title and a dated comment say so.
- **Commit:** e33c22fe

**4. [Rule 1 - Bug] Two test harnesses still read the kit README for moved text**
- **Found during:** Task 3's broader test run
- **Issue:** `check-foundation-guards.test.ts` mirrors the uat-oracles inputs and lacked docs/usage.md (49 mirror cases failed with `docs/usage.md missing`); `frontmatter.test.ts` "no fenced heading in the WATCHED corpus …" required a fenced heading in agent-factory/README.md, which the prompts move removed. Both broke at e33c22fe and were repaired in 5eaa72f4.
- **Fix:** The mirror carries docs/usage.md in the kit README's place; the watched pair is README.md and docs/usage.md. Both files pass (343/344 with the baseline LANG-07 red; 295/295).
- **Commit:** 5eaa72f4

**5. [Rule 1 - Bug] The examples pointed at the start table in README.md**
- **Found during:** Task 3
- **Issue:** `examples/01..05` each said "see the start table in `README.md`", which no longer holds it.
- **Fix:** Each now links `../docs/usage.md#start-a-session`.
- **Commit:** 5eaa72f4

**6. [Plan wording] Small layout choices**
- § Start a session puts the table first and the Claude Code paragraphs after it, and replaces the bold "Start a session" label with the section heading; the moved paragraphs lost only their list indent.
- In § Commands the example fence comes before C-28-007, so its "the same operations" refers to the commands above it; the command sentence C-28-061 opens the section.
- The RED evidence record is committed in the phase directory.

**Total deviations:** 5 auto-fixed (2 Rule 3, 3 Rule 1) and 1 wording note. **Impact:** five test files, the examples and one audit record outside files_modified; no scope change.

## Verification

- Every task `<automated>` command passed; every acceptance criterion passed, including the corpus-join ancestry check, the C-28 single-file loop (OK), `"docs/usage.md"` 1 and `"agent-factory/README.md"` 0 in check-uat-oracles.ts, 2 pointer links in agent-factory/README.md, 5 example links, and 0 cost or speed words.
- 43-BASELINE.md gate table re-run after the last commit: every gate exits as at base (13 exit 0, `check-flip-manifest` exit 1); `check:story-docs`, `check-uat-oracles` and `npm run typecheck` exit 0; `npm run freshness` reports 93 `.js` fresh.
- Broader targeted run (16 files): 1385 passed; the only failures were the foundation-guards mirror cases fixed in Task 3 and the baseline LANG-07 case (`~/` directory). After the fix, check-foundation-guards.test.ts has only that baseline red, and frontmatter.test.ts passes 295/295.
- The full suite was not run; the orchestrator runs it after this wave.

## Issues Encountered

- docs/usage.md had to be in git's index (`git add -N`) before LIVE-3 could see it, as plan 43-09 found for its pages.

## Known Stubs

None.

## Threat Flags

None. The plan changes documentation and test or gate scoping only: no endpoint, auth path or schema change. T-43-30, T-43-31 and T-43-32 are mitigated as planned.

## User Setup Required

None.

## Next Phase Readiness

- Plan 43-11 can slim README.md further; the next free claim id is C-28-069.
- docs/usage.md is in the public-docs and banned-claims corpora and under the story-docs gate.

## Self-Check: PASSED

- FOUND: docs/usage.md, docs/audit/29-style-dispositions/43-10.md, .planning/phases/43-story-and-layered-docs/43-10-task2-red.json
- FOUND commits: c56b346e, d723340f, e33c22fe, 5eaa72f4 (4 = `git rev-list --count 625324e6..HEAD`)
