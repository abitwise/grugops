---
phase: 43-story-and-layered-docs
plan: "05"
subsystem: docs-generation
tags: [reference-docs, generator, freshness-gate, skill-pages, host-registry, claim-gates]

requires:
  - phase: 43-story-and-layered-docs
    provides: "the reference generator and tree gate (43-04), the story-docs gate (43-03), shippedDocs() joined to the public-docs corpus (43-02, join commit cfd56f60), 43-BASELINE.md (43-01)"
provides:
  - "scripts/generate-catalog.ts writes docs/reference/skills/<op>.md for every listPluginSkillAdapters() member: description, ## Invocation (one plain-text row per HOST_TOOLS host), ## Workflows, ## Roles it reaches, ## Allowed tools, and a repository-URL source"
  - "docs/reference/README.md gains a ## Skills table linking each skill page; its intro names role, skill and workflow files"
  - "scripts/catalog-freshness.ts mirrors skills/, .claude/skills/ and .claude-plugin/plugin.json as data and checks the skill pages equal PLUGIN_SKILL_ADAPTER_COUNT, two-sided"
  - "Fail-closed refusals, before any write: an unknown workflow or role path in a skill body, a plugin skill with zero or several matching standalone twins, a twin claimed by two plugin skills, no dispatcher, a bad plugin.json name or repository, a skill nested deeper than one directory"
  - "PUBLIC_DOCS_SCAN_COUNT 33 -> 40 and BANNED_CLAIM_SCAN_COUNT 150 -> 157, read off each gate's refusal"
affects: [43-12, 43-14]

actuals:
  tokens: 29776   # chars/4 over the realized diff (119103 chars), 89e1f7e8..3a1f4273
  tasks: 2
  commits: 5
plan_head_before: 89e1f7e8b8641c8353878dba4eebbc3728cfe77f
plan_head_after: 3a1f4273719be4979f03bed20abb158439b88b6f

tech-stack:
  added: []
  patterns:
    - "A generated page that tells a user what to type derives every spelling from the host registry and plugin.json; the Claude Code standalone command comes from the twin whose description equals the plugin skill's"
    - "A test mirror for a generator carries its repo-relative import closure (including ../install/ modules) and its data sources through one helper"

key-files:
  created:
    - docs/reference/skills/gate.md
    - docs/reference/skills/grugops.md
    - docs/reference/skills/map.md
    - docs/reference/skills/plan.md
    - docs/reference/skills/release.md
    - docs/reference/skills/ticket.md
    - docs/reference/skills/uat.md
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - scripts/catalog-freshness.ts
    - scripts/catalog-freshness.js
    - scripts/catalog-freshness.test.ts
    - docs/reference/README.md
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/board-readonly.test.ts

key-decisions:
  - "Invocation cells: the spawn host shows `/<twin name> \"<request>\"` (standalone skill) or `/<plugin name>:<skill name> \"<request>\"` (plugin); a sequential host shows its registry invoke text, prefixed `Through the dispatcher: ` on every page but the dispatcher's, with one sentence below the table saying to start the dispatcher and ask for the work"
  - "Roles reached are the exact role display names in `- <Display Name> — ` bullets of the named workflows' Agents involved sections; bullets whose text is not a display name (WF04's `Receiving role (...)`, WF16's `Every role.`) are skipped, not refused"
  - "The dispatcher's Roles section adds that the Orchestrator draws on the roles the request needs, mirroring the planned Workflows sentence, so the one derived role (Orchestrator) is not read as the whole set"
  - "allowed-tools is published as the frontmatter authority reads it (the block sequence flattened to `Read, Write, Bash, Glob, Grep`), on one line"
  - "No foundation-guard pin moved; the import edge moved board-readonly's CLOSURE_BASELINES row for scripts/generate-catalog.js, re-measured from jsImportClosure"

patterns-established:
  - "Skill page section order: description, Invocation, Workflows, Roles it reaches, Allowed tools, Source"

requirements-completed: [STORY-03, STORY-02]

coverage:
  - id: D1
    description: "One generated page per plugin skill under docs/reference/skills/, each with the provenance line, # <op>, the description, ## Allowed tools and the repository-URL source; the index's ## Skills table links exactly those pages, both ways, equal to the plugin skill ops"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#writes one page per listPluginSkillAdapters() member under docs/reference/skills/, each with the provenance line, `# <op>`, the description, the allowed tools and the repository-URL source"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#the committed index has one `## Skills` table that links exactly the committed skill pages, both ways, and both equal the plugin skill ops"
        status: pass
      - kind: other
        ref: "npm run build && npm run generate:catalog && git status --porcelain --untracked-files=all -- docs/reference (empty)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The tree gate covers docs/reference/skills/: MISSING skill page named, data sources that did not land refused by name, skill-page count two-sided against PLUGIN_SKILL_ADAPTER_COUNT"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/catalog-freshness.test.ts (18 cases, including MISSING skill page, skills/ and plugin.json not landed, PLUGIN_SKILL_ADAPTER_COUNT too few and too many)"
        status: pass
      - kind: other
        ref: "npm run freshness:catalog (exit 0, compared 27 page(s), 0 difference(s))"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each skill page's Invocation table names every host in plain text in registry order; the spawn host shows the standalone and plugin commands, sequential hosts show the registry invoke text (through the dispatcher except on the dispatcher's page); no typed command spelling in the generator; no bold-opening row"
    requirement: STORY-03
    verification:
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#gate.md's Invocation table has one plain-text row per HOST_TOOLS host, in registry order: the standalone and plugin commands for the spawn host, the dispatcher route for the sequential hosts"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#the dispatcher's page shows each sequential host's invoke text as is"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#no generated row opens with a bold cell, and the generator types no command spelling"
        status: pass
      - kind: unit
        ref: "install/host-entry-docs.test.ts and install/host-tools-prose.test.ts (whole files)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Workflows a skill names and the roles it reaches are derived and validated; an unknown workflow path, two twins sharing one description and two plugin skills claiming one twin each make the generator exit 1 naming the files, with no page changed"
    requirement: STORY-03
    verification:
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#gate.md lists the workflows its body names and links the roles they involve plus the roles the body names"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: a skill body naming a workflow listWorkflows does not hold → exit 1 naming the skill and the path, and no page changes"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: two standalone twins sharing one description → exit 1 naming both, and no page changes"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: two plugin skills matching one standalone twin's description → exit 1 naming both, and no page changes"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both claim gates scan the seven skill pages; pins moved off the gates' refusals; the skill pages' first commit descends from the corpus-join commit"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js (exit 0; 40 and 157 documents, 0 findings)"
        status: pass
      - kind: other
        ref: "git merge-base --is-ancestor cfd56f60 6ba6bc77 (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The skill pages read clearly to a person: the dispatcher sentence, the roles note on the dispatcher page and the invocation wording"
    verification: []
    human_judgment: true
    rationale: "No test judges whether generated prose is clear and accurate to a reader; a person must read the seven pages"

duration: 20min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 05: Skill reference pages Summary

**The reference generator now writes one page per grugops skill. Each page says what the skill does, how to start it on every supported host (spellings read from the host registry and plugin.json, never typed), which workflows it runs, which roles it reaches, and which tools it may use. The index gains a skills table, and the tree gate holds the seven pages.**

## Performance

- **Duration:** 20 min (from the recorded start; reading the plan and code came before it)
- **Started:** 2026-11-18T03:18:40Z
- **Completed:** 2026-11-18T03:38:30Z
- **Tasks:** 2
- **Files modified:** 19 in the diff (12 source and test files, 7 generated pages)

## Accomplishments

- `scripts/generate-catalog.ts` reads `listPluginSkillAdapters()`, the standalone twins (`listSkillAdapters()`), `listWorkflows()`, `.claude-plugin/plugin.json` and `HOST_TOOLS`, and builds seven skill pages into the same page map as the role pages. Before anything is written it refuses an unknown workflow or role path, a plugin skill with zero or several matching twins, a twin claimed by two plugin skills, a missing dispatcher, and a malformed plugin name or repository.
- The `frontmatter.js` import set is unchanged (`parseFrontmatter`, `sectionEndIndex`, `unfencedHeadingIndex`). The new imports are `HOST_TOOLS` from `../install/host-tools.js` and `listPluginSkillAdapters`, `listSkillAdapters`, `listWorkflows` from kit-model.
- `docs/reference/skills/gate.md` shows `/grugops-gate "<request>"` and `/grugops:gate "<request>"` on the Claude Code row, and the dispatcher route on the other hosts. The Codex row gives `$grugops`. Workflows are WF05 and WF16. Roles: Architect/Design, Orchestrator, QE/E2E, Security/NFR.
- `scripts/catalog-freshness.ts` prints `Reference fresh: compared 27 page(s), 0 difference(s)` (1 index + ROLE_COUNT + PLUGIN_SKILL_ADAPTER_COUNT).

### Pins moved, read off the gates' refusals

```
FAIL  the public-docs scan set derived 40 document(s), expected exactly 33 (root 4, examples 5, kitReadme 1, guarantees 1, skills 1, docs 28)
FAIL  the banned-claim scan set derived 157 document(s), expected exactly 150 (kit 79, publicDocs 41, installReadme 1, skillSources 7, claudeAdapters 28, pluginManifests 2, guarantees 1, skills 1, overlap 3)
PASS  banned claims: 0 findings over 157/157 elements
```

Entrants: the seven `docs/reference/skills/<op>.md` pages. Both pins carry dated history comments naming them.

### Foundation-guard and closure pins

`npx vitest run scripts/check-foundation-guards.test.ts scripts/board-readonly.test.ts` ran at the start, after Task 1 and after Task 2. `check-foundation-guards.test.ts` failed one case every time, and only that one: the baseline LANG-07 case "every remaining floor item's LIVE COUNT is DERIVED". Its message was identical to the baseline both times (`…(99)` vs `…(92)`, the untracked `~/` directory). No foundation-guard pin moved, and that file is unchanged. After Task 2, `board-readonly.test.ts` reported "the closure of scripts/generate-catalog.js is byte-for-byte what it was before the cutover". The row gained `install/host-tools.js`, measured with `jsImportClosure` as `["install/host-tools.js","scripts/frontmatter.js","scripts/generate-catalog.js","scripts/kit-model.js"]`, and it was moved with a dated entry. Re-run: 558/559, with the one failure being baseline LANG-07.

## Task Commits

1. **Task 1 RED** - `fc89c3ae` (test): failing skill-page and gate cases
2. **Task 1 GREEN: one generated reference page per grugops skill** - `6ba6bc77` (feat)
3. **Task 2 RED** - `84d34287` (test): failing invocation, workflow, role and refusal cases
4. **Task 2 GREEN: invocation per host, workflows and roles, all derived** - `0733613c` (feat)
5. **Extra edge case** - `3a1f4273` (test): two plugin skills claiming one twin

## RED / GREEN record

- **Task 1 RED:** 13 of 38 cases failed across the two files. Each failed on its planned assertion: the page total `expected 20 to be 27`, the missing skill pages `expected [] to deeply equal [ 'gate.md', … ]`, the absent `## Skills` heading, and gate cases exiting 0 where they should refuse. None failed on a load, syntax or fixture fault. Classifier: `gsd-tools check tdd-red-evidence` on target `writes the reference tree and exits 0, leaving the tree clean` returned `RED_EVIDENCE_OK / target_test_failed` (20 tests, 1 failed). First attempts were refused as `invalid_record` (Non-TAP data, Malformed TAP). Vitest's tap-flat reporter prints multi-line custom messages and array diffs unindented, so the target was narrowed with `-t` to one case whose assertion is a scalar. GREEN: 38/38.
- **Task 2 RED:** 5 new cases failed on their planned assertions. The Invocation table had 0 rows where 7 were expected, the dispatcher rows were absent, the Workflows section was empty, and both fail-closed mirrors exited 0. Classifier on target `gate.md's Invocation table has one plain-text row per HOST_TOOLS host…`: `RED_EVIDENCE_OK / target_test_failed` (26 tests, 1 failed). The guard case "no generated row opens with a bold cell, and the generator types no command spelling" passed in RED. That is expected for a regression guard over a tree that had neither. GREEN: 26/26.
- **Extra case (`3a1f4273`):** it was written after GREEN, so it was green on first run. To show it is not vacuous, it was run against the committed `.js` with the claimant check disabled: it failed, because the mutant wrote 8 skill pages and exited 0. The `.js` was restored, and `git diff` shows no change to it.

## Files Created/Modified

- `scripts/generate-catalog.ts` / `.js`: skill pages, skills table, twin match, dispatcher, workflow and role derivations, refusals
- `scripts/catalog-freshness.ts` / `.js`: three new data sources (a file is accepted for plugin.json), the skill-page count check
- `scripts/generate-catalog.test.ts`: repo-relative import closure, one mirror helper with the data sources, skill-page, index, invocation, workflow, role, guard and three refusal cases
- `scripts/catalog-freshness.test.ts`: mirrored data, PAGE_TOTAL, MISSING skill page, not-landed data sources, two-sided skill count
- `scripts/check-public-docs-vocabulary.ts` / `.js`, `scripts/check-banned-claims.ts` / `.js`: scan pins moved with dated history
- `scripts/board-readonly.test.ts`: CLOSURE_BASELINES row for scripts/generate-catalog.js
- `docs/reference/README.md`, `docs/reference/skills/*.md`: generated

## Decisions Made

See `key-decisions` in the frontmatter. In short: invocation spellings and roles come only from registry and kit data, bullets that are not role names are skipped, the dispatcher page notes that the Orchestrator chooses the workflow and the roles, and `allowed-tools` is printed exactly as the authority reads it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] board-readonly CLOSURE_BASELINES row moved by the new import edge**
- **Found during:** Task 2 (foundation-guard rerun)
- **Issue:** `scripts/board-readonly.test.ts` pins the import closure of `scripts/generate-catalog.js`. The new `../install/host-tools.js` import added one module. The file is not in the plan's `files_modified`, but the project notes give this exact remedy.
- **Fix:** re-measured the closure with `jsImportClosure` and updated the row with a dated comment naming plan 43-05 and the edge.
- **Verification:** board-readonly 215/215.
- **Committed in:** `0733613c`

**2. [Rule 2 - Accuracy] Dispatcher roles note**
- **Found during:** Task 2
- **Issue:** the derived roles list for the dispatcher holds only the Orchestrator. A reader could take that as everything the dispatcher reaches.
- **Fix:** the dispatcher page's Roles section opens with "The Orchestrator draws on the roles the request needs. The skill itself names, or runs a workflow that involves:". This mirrors the planned Workflows sentence.
- **Committed in:** `0733613c`

**3. [Test gap] A test for two plugin skills claiming one twin**
- **Found during:** after Task 2
- **Issue:** the must_haves name this edge, but the planned behaviour cases test only two twins sharing a description.
- **Fix:** added the case and checked it against a mutant (see RED / GREEN record).
- **Committed in:** `3a1f4273`

---

**Total deviations:** 3 (1 blocking pin, 1 accuracy note, 1 added test).
**Impact on plan:** none on scope.

## Issues Encountered

- After Task 1's edits, `scripts/check-banned-claims.test.ts` "THE MISSING DIRECTION: every scan member is a TRACKED path" failed because the new pages were not committed yet. After `6ba6bc77`: 136/136.
- The TDD classifier refused the first two RED records (see RED / GREEN record). This was a reporter-format limit, not a test fault.
- No same-wave re-run was needed: plan 43-15 made no commit during this run, and no gate went red on its files.

## Verification

Gates compared with 43-BASELINE.md, run after the last code commit:

| Gate | Exit |
|---|---|
| freshness:catalog | 0 |
| check:claim-anchors | 0 |
| check:audit-register | 0 |
| check:public-docs | 0 |
| check:banned-claims | 0 |
| freshness:guarantees | 0 |
| freshness:skill-twins | 0 |
| freshness (93 .js) | 0 |
| check:build-parity | 0 |
| check:state-paths | 0 |
| check-foundation-guards.js | 0 |
| check-kit-refs.js | 0 |
| check-flip-manifest.js | 1 (baseline red) |
| check-diff-disposition.js | 0 |
| check:story-docs | 0 |
| freshness:hook-manifest | 0 |

`npm run typecheck` and `tsc -p tsconfig.tests.json --noEmit` both exit 0.

Test files: generate-catalog 27/27, catalog-freshness 18/18, host-entry-docs + host-tools-prose green (99 across the four Task 2 files), and frontmatter, kit-model, check-public-docs-vocabulary, check-banned-claims, check-story-docs, installer-kit-home, host-tools, generate-skill-twins and skill-twins-freshness at 786/786. check-foundation-guards + board-readonly: 558/559, the one failure being baseline LANG-07.

All acceptance criteria pass: 7 skill pages, 1 `## Skills` heading, 7 `skills/` mentions in the index, STORY-04 ancestry (`cfd56f60` is an ancestor of `6ba6bc77`), `/grugops:gate` and `/grugops-gate` and `$grugops` in gate.md, 0 typed `/grugops` spellings in the generator, no bold-opening row under docs/reference.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 43-14 fills the role pages (D-14) in the same generator. The `roles` array and the page map are unchanged in shape. The skill pages link to the role pages by `../agents/<file>`.
- Plan 43-12 owns late pin moves and the CHANGELOG note.

---
*Phase: 43-story-and-layered-docs*
*Completed: 2026-11-18*

## Self-Check: PASSED

- FOUND: docs/reference/README.md, docs/reference/skills/{gate,grugops,map,plan,release,ticket,uat}.md, scripts/generate-catalog.ts, scripts/catalog-freshness.ts
- FOUND in HEAD's history: fc89c3ae, 6ba6bc77, 84d34287, 0733613c, 3a1f4273
