---
phase: 43-story-and-layered-docs
plan: "14"
subsystem: docs-generation
tags: [reference-docs, generator, role-pages, host-registry, model-tiers, levels]

requires:
  - phase: 43-story-and-layered-docs
    provides: "the reference generator, the role page skeleton and the tree gate (43-04); the skill pages and the HOST_TOOLS import (43-05)"
provides:
  - "Every docs/reference/agents/<stem>.md carries a `| Field | Value |` table (Tier, Capabilities, Skills, Workflows, Source), `## Adapters per host` with one plain-text row per HOST_TOOLS host, and the six sections One job, Activates when, Output, Board moves, Hard limits and Stop when copied through sectionBody"
  - "The Orchestrator page shows each sequential host's launch form from launchInvoke, with its live-run note or `UNKNOWN - verify: no live run`"
  - "A generated `## Levels` section on any role whose adapter specs carry a level: adapter, level, model and effort from zeroConfigAssignments, a sentence linking the models dial in agent-factory/config/factory.config.md, and the role file's own `## Levels` text"
  - "Fail-closed refusals before any write: a role missing one of the six sections, two roles with one display name, a level the zero-config answer refuses, a role file with `capabilities:` declared twice"
  - "The generator's output line counts the workflow bullets that name no role (8 on the committed kit)"
affects: [43-12]

actuals:
  tokens: 27049   # chars/4 over the realized diff (108195 chars), b352f4fc..be511671
  tasks: 2
  commits: 4
plan_head_before: b352f4fc38e45ae1758acc2b566f7304008c2550
plan_head_after: be5116710b4b321ab07cbe2ee0621b8fed172539

tech-stack:
  added: []
  patterns:
    - "A role page cell no source answers reads `UNKNOWN - verify`; a source that refuses (role-skills reader, zero-config resolver) is either published as `UNKNOWN - verify (<reason>)` or refused before any write"
    - "A generated section is keyed on derived data (spec.level), never on a role name"

key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/.red/43-14-task1-red.json
    - .planning/phases/43-story-and-layered-docs/.red/43-14-task2-red.json
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - scripts/board-readonly.test.ts
    - docs/reference/agents/*.md (19 role pages)

key-decisions:
  - "Launch cells append LAUNCH_NOT_LIVE only when launchLiveNote is null, because launchInvoke already ends with the live note for a form a human ran live; each launch row carries the note or the not-live mark exactly once"
  - "The generator refuses (exit 1) when zeroConfigAssignments refuses, so a levels table never shows a guessed model; the plan's `levels: a b` mirror became that refusal case, and the second-leveled-role case uses `levels: junior senior`"
  - "A leveled role with no `## Levels` section of its own gets an `UNKNOWN - verify` line in place of that text, never invented wording"
  - "No foundation-guard pin moved; the generator's import edges moved board-readonly's CLOSURE_BASELINES row twice, each re-measured from jsImportClosure"

patterns-established:
  - "Role page order: provenance, # name, One job sentence, header table, ## Levels (leveled roles only), ## Adapters per host, the six sections, Full role link"

requirements-completed: [STORY-03, STORY-02]

coverage:
  - id: D1
    description: "Every role page carries the header table, one plain-text adapters row per registry host in registry order and the six role sections verbatim, with no Reads or Responsibilities"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#every role page carries the header table, one plain-text adapters row per host and the six sections verbatim, and no Reads or Responsibilities"
        status: pass
      - kind: other
        ref: "grep -l '^## <section>$' docs/reference/agents/*.md | wc -l prints 19 for each of the six sections"
        status: pass
      - kind: other
        ref: "npm run generate:catalog && git status --porcelain --untracked-files=all -- docs/reference (empty after each task commit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Software Engineer page lists its three level adapters under Claude Code; the Orchestrator page lists grugops-orchestrator and each launch host's launch form with its live note or the not-live mark; no row opens bold, so LIVE-3's set is unchanged"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#the Software Engineer page lists its level adapters under Claude Code; the Orchestrator page lists its launch form on each launch host"
        status: pass
      - kind: unit
        ref: "install/host-entry-docs.test.ts and install/host-tools-prose.test.ts (whole files)"
        status: pass
      - kind: other
        ref: "grep -rnE '^[|] *[*]{2}' docs/reference (exit 1, no line)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Workflows, skills and capabilities are derived: Tech Lead links WF04, unmatched bullets are counted in the output line, absent capabilities and refused skills read UNKNOWN - verify, declared skills are listed"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#the Tech Lead page links WF04, and a bullet naming no role is counted in the output line, never linked"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#a role with `capabilities` removed reads UNKNOWN - verify; declared skills are listed; a refused declaration reads UNKNOWN - verify plus the reason"
        status: pass
    human_judgment: false
  - id: D4
    description: "Fail closed with no page changed: a role missing `## Stop when`, two roles sharing a display name, and a level the zero-config answer refuses each exit 1 naming the file(s)"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: a role missing `## Stop when` → exit 1 naming the file, and every page is byte-unchanged"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: two roles with the same `# Role:` name → exit 1 naming both files, and every page is byte-unchanged"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: a level the zero-config answer refuses → exit 1 naming the refusal, and every page is byte-unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Software Engineer page has one `## Levels`: junior haiku xhigh, mid sonnet high, senior opus medium from zeroConfigAssignments, the dial sentence linking factory.config.md, the role's own text naming the Tech Lead; no other role has the section; a planted second leveled role gets one; no page names scripts/model-tiers.ts or uses the word parallel"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#the levels section (plan 43-14, D-13), all four cases"
        status: pass
      - kind: unit
        ref: "scripts/model-dial-consistency.test.ts (whole file)"
        status: pass
      - kind: other
        ref: "grep -c '^## Levels$' docs/reference/agents/software-engineer.md → 1; ! grep -rq scripts/model-tiers.ts docs/reference → exit 0; grep -rlwi parallel docs/reference | wc -l → 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The role pages read clearly to a newcomer: the adapters wording (including the in-turn sentence on the Orchestrator's own page), the dial sentence, and the two roles whose Workflows cell reads UNKNOWN - verify"
    requirement: STORY-02
    verification: []
    human_judgment: true
    rationale: "Readability and whether the derived UNKNOWN cells should be resolved in the workflow files are judgments, not test assertions"

duration: 12min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 14: Full role pages and the engineer levels section Summary

**Each of the 19 role reference pages now carries a derived header table, the adapters per host, the six sections copied from its role file, and, for the Software Engineer, a levels table built from the same zero-config resolver the adapters use.**

## Performance

- **Duration:** 12 min, measured from the recorded start (2026-11-18T05:00:36Z) to the last task commit (05:13Z). Reading and test-writing before the recorded start are not in it.
- **Tasks:** 2
- **Files modified:** 23 in the diff (generator `.ts`/`.js`, two test files, 19 generated pages)

## Accomplishments

- `scripts/generate-catalog.ts` builds each role page from the role file, the workflows, `readRoleSkills` (via `./role-skills-reader.js`, never `canonical-frontmatter.js` directly), kit-model `listAgentAdapterSpecs`, the host registry (`HOST_TOOLS`, `LAUNCH_AGENT_NAME`, `launchInvoke`, `launchLiveNote`, `LAUNCH_NOT_LIVE`) and `zeroConfigAssignments`. The `./frontmatter.js` import set is still exactly `parseFrontmatter`, `sectionEndIndex`, `unfencedHeadingIndex`.
- Header table rows: Tier, Capabilities (frontmatter value or `UNKNOWN - verify`), Skills (`none declared` on every committed role; a refused declaration reads `UNKNOWN - verify (<reason>)`), Workflows (links in numeric order; Compliance Officer and Installer read `UNKNOWN - verify`, because no workflow's `## Agents involved` names them), Source.
- `## Adapters per host`: plain host names in registry order. Claude Code shows the role's adapter names. The sequential hosts show `Loaded by the Orchestrator in turn; no per-role adapter.`, and on the Orchestrator page each launch host adds `Launch: <launchInvoke>`. Copilot CLI's form also carries `(UNKNOWN - verify: no live run)`.
- The output line reports `8 workflow bullet(s) name no role` (WF04's `Receiving role (…)` among them).
- `## Levels` on software-engineer.md only, keyed on `spec.level`; the Orchestrator page and every other page were byte-unchanged by Task 2.

### Foundation-guard pins

`npx vitest run scripts/check-foundation-guards.test.ts` ran at the start, after Task 1's edges and after Task 2's: 344 tests, 343 passed, 1 failed each time. The one failure is the baseline LANG-07 case ("every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose", the untracked `~/` directory). No pin moved, and `scripts/check-foundation-guards.test.ts` is unchanged. No install/-only failure appeared.

### board-readonly CLOSURE_BASELINES (re-measured from jsImportClosure)

- After Task 1: `+ scripts/canonical-frontmatter.js, scripts/is-entry.js, scripts/role-skills-reader.js` (the test's own failure message listed exactly these three).
- After Task 2: `+ scripts/model-tiers.js`.
- Each move has a dated 2026-11-18 history comment naming plan 43-14 and the edge. No module's import of `scripts/js-import-closure.js` changed, so the walker-caller counts did not move.

## Task Commits

1. **Task 1 RED** - `c3fb0000` (test): failing cases for the full role pages
2. **Task 1 GREEN** - `ef9e9d1d` (feat): each role page carries its header, adapters and the six role sections
3. **Task 2 RED** - `dd7ab9e4` (test): failing cases for the engineer levels section
4. **Task 2 GREEN** - `be511671` (feat): the engineer page shows each level's adapter, model and effort

## RED / GREEN record

- **Task 1 RED:** `npx vitest run scripts/generate-catalog.test.ts -t "every role page carries the header table" --reporter=tap-flat --silent` exited 1 with the target failing on `the header table: expected false to be true`. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`); the record is `.red/43-14-task1-red.json`. Semantic assessment: the target ran and failed on its first planned assertion, the missing D-14 table. The five sibling cases failed the same way: no adapters rows, no Workflows or Capabilities cell, and exit 0 where the refusals expect 1. There was no load or fixture fault. A first capture was refused as `invalid_record` (Malformed TAP), because vitest's TAP printed a multi-line `actual`. I changed the assertion to a boolean form, re-ran and recorded that run. GREEN: 35/35 in the file after regeneration.
- **Task 2 RED:** `-t "the Software Engineer page has one"` exited 1 on `one levels section: expected +0 to be 1`, giving `RED_EVIDENCE_OK`; the record is `.red/43-14-task2-red.json`. The siblings failed the same way: the planted leveled role had no section, and `levels: a b` still exited 0. GREEN: 39/39.

## Files Created/Modified

- `scripts/generate-catalog.ts` / `.js` - the role page header, adapters table, six sections, duplicate-name refusal, unmatched-bullet count, levels section
- `scripts/generate-catalog.test.ts` - 12 new cases in two describe blocks (full role pages; levels section)
- `scripts/board-readonly.test.ts` - the generator's CLOSURE_BASELINES row, re-measured twice
- `docs/reference/agents/*.md` - regenerated (19 pages)
- `.planning/phases/43-story-and-layered-docs/.red/43-14-task{1,2}-red.json` - RED evidence records

## Decisions Made

See `key-decisions` above. In short: one live note per launch row, refuse rather than guess a level's model, `UNKNOWN - verify` for a missing own-levels text, and no foundation-guard pin moved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] board-readonly CLOSURE_BASELINES row for scripts/generate-catalog.js**
- **Found during:** Task 1 (and again in Task 2)
- **Issue:** the new imports moved the generator's import closure, and `scripts/board-readonly.test.ts` pins it. The file is not in `files_modified`; the project notes name this remedy.
- **Fix:** re-measured with `jsImportClosure` and moved the row with dated history comments.
- **Verification:** `npx vitest run scripts/board-readonly.test.ts` 215/215.
- **Committed in:** `ef9e9d1d`, `be511671`

**2. [Rule 1 - Test bug] The last section's slice ran into the `Full role:` line**
- **Found during:** Task 1 GREEN
- **Issue:** the new test compared `## Stop when` up to the next `## ` or end of page, so it took in the page's closing `Full role:` line.
- **Fix:** the slice now stops at `Full role: `. The generator was not changed for this.
- **Committed in:** `ef9e9d1d`

**3. [Plan literal adjusted] `levels: a b` mirror**
- **Found during:** Task 2 design
- **Issue:** the plan's mirror gives a second role `levels: a b` and expects a levels section. But `zeroConfigAssignments` refuses a level the level table does not hold, so no model or effort exists for `a` or `b`. Publishing one would be fabrication.
- **Fix:** the generator exits 1 on that refusal, and `levels: a b` is now a fail-closed case. The "second role gets the section, no name check" case uses `levels: junior senior` on tech-lead.md.
- **Committed in:** `dd7ab9e4`, `be511671`

**4. [Scope note] scripts/catalog-freshness.ts/.js and docs/reference/README.md unchanged**
- Both are in `files_modified`, but neither needed a change. The tree gate mirrors the derived import closure, and role-skills-reader.js and model-tiers.js read no extra data file in the mirror (`npm run freshness:catalog` 0, catalog-freshness.test.ts green). The index content did not change.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 test bug), 1 plan-literal adjustment, 1 scope note.
**Impact on plan:** none on scope; each keeps a pin true or prevents a fabricated row.

## Issues Encountered

- No same-wave re-run was needed: plan 43-09 had finished (its SUMMARY was committed) before this plan started, and no other plan committed during this run.

## Verification

Gates against 43-BASELINE.md, after the last commit: freshness:catalog 0 (compared 27 pages, 0 differences), check:claim-anchors 0, check:audit-register 0, check:public-docs 0, check:banned-claims 0, freshness:guarantees 0, freshness:skill-twins 0, freshness 0 (93 .js), check:build-parity 0, check:state-paths 0, check-foundation-guards.js 0, check-kit-refs.js 0, check-flip-manifest.js 1 (baseline red), check-diff-disposition.js 0. Also: check:story-docs 0, freshness:hook-manifest 0, typecheck 0.

Test files:
- generate-catalog, catalog-freshness, host-entry-docs, host-tools-prose, model-dial-consistency, skills-kit-text and board-readonly: 420/420.
- check-foundation-guards: 343/344 (the baseline LANG-07 case). model-tiers, frontmatter and kit-model passed in the same run, 979/980 in all.
- audit-model, generate-safety-surface, check-public-docs-vocabulary, check-banned-claims, check-story-docs, role-skills-reader, model-dial-consistency, mode-census and floor-invariance: 573/573.

Acceptance criteria:
- Each of the six headings is on 19 pages.
- `grugops-software-engineer-junior` appears on the engineer page (1).
- `readRoleSkills` appears in the generator 2 times; `canonical-frontmatter` is imported 0 times.
- No page under docs/reference uses the word parallel (0).
- No row opens with a bold cell: grep exits 1 and prints nothing.
- `^## Levels$` appears once; `haiku.*xhigh` matches once; no page names `scripts/model-tiers.ts`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 43-12 owns late pin moves and the CHANGELOG note; this plan moved no scan pin and no foundation-guard pin.
- For human review (D6): the Orchestrator's own page says "Loaded by the Orchestrator in turn" on its sequential-host rows, which the plan's wording fixes. The Workflows cell of Compliance Officer and Installer reads `UNKNOWN - verify`, because no workflow bullet names them.

---
*Phase: 43-story-and-layered-docs*
*Completed: 2026-11-18*

## Self-Check: PASSED

- FOUND: scripts/generate-catalog.ts, scripts/generate-catalog.js, docs/reference/agents/orchestrator.md (with `## Hard limits`), docs/reference/agents/software-engineer.md (with `## Levels`), both RED records
- FOUND in HEAD's history: c3fb0000, ef9e9d1d, dd7ab9e4, be511671
