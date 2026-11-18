---
phase: 43-story-and-layered-docs
plan: "04"
subsystem: docs-generation
tags: [reference-docs, generator, freshness-gate, claim-gates, catalog-retirement]

requires:
  - phase: 43-story-and-layered-docs
    provides: "shippedDocs() joined to the public-docs corpus (43-02, join commit cfd56f60); the story-docs gate (43-03); 43-BASELINE.md (43-01)"
provides:
  - "scripts/generate-catalog.ts writes docs/reference/README.md (roles and workflows tables) and docs/reference/agents/<role-stem>.md for every kit-model listRoles() member; pages built into one map, page paths lstat-checked, strays deleted, then written"
  - "scripts/catalog-freshness.ts is the reference-tree gate: jsImportClosure mirror plus role and workflow data, SET (EXTRA, MISSING), BYTES (STALE), zero-page refusal, two-sided ROLE_COUNT check, CHECK_ROOT override, `compared N page(s), M difference(s)`"
  - "docs/catalog/ deleted (D-16a: removed, not a pointer)"
  - "PUBLIC_DOCS_SCAN_COUNT 14 -> 33 and BANNED_CLAIM_SCAN_COUNT 131 -> 150, read off each gate's refusal"
  - ".gitattributes pin docs/reference/** text eol=lf"
affects: [43-05, 43-12, 43-14]

actuals:
  tokens: 36854   # chars/4 over the realized diff (147416 chars), 9e93d358..ba5678e4
  tasks: 2
  commits: 2
plan_head_before: 9e93d3581f13f3de23145d70e6db50b2e1d46af5
plan_head_after: ba5678e4f13fb777a0396213189c929e785b5cf7

tech-stack:
  added: []
  patterns:
    - "A generator that owns a directory builds every page into a Map first, lstat-checks every output path (no write through a link), deletes only regular stray .md files, then writes"
    - "A tree freshness gate mirrors the generator's derived import closure (jsImportClosure) plus hand-listed data directories, and refuses when a data directory did not land"

key-files:
  created:
    - docs/reference/README.md
    - docs/reference/agents/*.md (19 role pages)
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - scripts/catalog-freshness.ts
    - scripts/catalog-freshness.js
    - scripts/catalog-freshness.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/audit-model.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - vitest.config.ts
    - .gitattributes
  deleted:
    - docs/catalog/README.md

key-decisions:
  - "docs/catalog/ is deleted, not left as a one-line pointer (D-16a); the dated CHANGELOG note stays with plan 43-12"
  - "The tree gate honours CHECK_ROOT (the host-entries pattern) so every planted case runs in a hermetic mirror and never mutates the shared checkout"
  - "The index paragraph says the pages come from the role and workflow files; it does not name skill files, because no skill page exists until plan 43-05 (no-fabrication rule)"
  - "The generator refuses before any delete or write when docs/reference, docs/reference/agents or a page path is a link or another non-regular file (T-43-13)"

patterns-established:
  - "Index row links a role to its page as agents/<role-file>; a test holds the index link set, the on-disk page set and listRoles() equal both ways"

requirements-completed: [STORY-03, STORY-02]

coverage:
  - id: D1
    description: "The generator writes docs/reference/README.md and one page per listRoles() member, each opening with the provenance line, the display name, the One job first sentence and the source link; two runs give byte-identical pages"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#writes one page per listRoles() member under docs/reference/agents/, each opening with the provenance line, the display name, the One job sentence and the source link"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#byte-reproducible: regenerating twice yields identical bytes"
        status: pass
      - kind: other
        ref: "npm run generate:catalog && git status --porcelain --untracked-files=all -- docs/reference (empty)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The index lists roles core first then by display name, workflows in numeric order, and links exactly the committed role pages, both ways, equal to listRoles()"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#the index lists roles core first then by display name, and workflows in numeric order"
        status: pass
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#the committed index links exactly the committed role pages, both ways, and both equal the listRoles() stems"
        status: pass
    human_judgment: false
  - id: D3
    description: "A generator run that fails before writing (no `# Role:` H1) leaves every page byte-unchanged and deletes no stray page; a link at a page path is refused without writing through it"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#fail-closed: a kit file with no H1 → exit 1, no partial write"
        status: pass
      - kind: integration
        ref: "scripts/generate-catalog.test.ts#refuses, writing nothing, when a page path is a link: it never writes through it"
        status: pass
    human_judgment: false
  - id: D4
    description: "npm run freshness:catalog compares the whole docs/reference/ tree and fails naming each MISSING, EXTRA or STALE page, a link at a page path, a failing regeneration, a zero-page regeneration and a role-page count other than ROLE_COUNT"
    requirement: STORY-03
    verification:
      - kind: integration
        ref: "scripts/catalog-freshness.test.ts (13 cases, each arm proven red against a mutant gate)"
        status: pass
      - kind: other
        ref: "npm run freshness:catalog (exit 0, compared 20 page(s), 0 difference(s))"
        status: pass
    human_judgment: false
  - id: D5
    description: "docs/catalog/ is gone and no shipped markdown links to it; both claim gates scan the reference pages and their pins moved off the gates' refusals"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js (exit 0; 33 and 150 documents, 0 findings)"
        status: pass
      - kind: other
        ref: "git grep -n docs/catalog -- '*.md' ':!.planning' ':!docs/audit' (exit 1, nothing)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Each pin's dated history comment quotes its gate's refusal and names the 20 entrants and docs/catalog/README.md's exit"
    requirement: STORY-03
    verification: []
    human_judgment: true
    rationale: "Whether a history comment quotes the refusal faithfully and names the right entrants is read, not asserted by a test"

duration: 15min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 04: The reference tree replaces the catalog Summary

**The catalog generator now writes docs/reference/README.md and 19 role pages from kit-model listRoles(), a tree gate fails on any missing, extra or stale page, docs/catalog/ is deleted, and both claim gates scan the 20 new pages.**

## Performance

- **Duration:** 15 min (measured from the recorded start; the test runs ran in the background inside it)
- **Started:** 2026-11-18T01:18:30Z
- **Completed:** 2026-11-18T01:34:20Z
- **Tasks:** 2
- **Files modified:** 37 in the diff (17 source and config files, 20 generated pages, 1 deletion folded into a rename)

## Accomplishments

- `scripts/generate-catalog.ts` takes its role set from `listRoles(ROOT)`, builds every page into one `Map`, lstat-checks the output directory, the agents directory and every page path, deletes regular stray `.md` files only, then writes. The workflow read keeps `readdirSync(WORKFLOWS_DIR).filter(isNumberedWorkflowFile).sort()` byte for byte; the generator still imports exactly `parseFrontmatter`, `sectionEndIndex`, `unfencedHeadingIndex` from frontmatter.js, and nothing imports it.
- Role page skeleton per `<context>`: provenance line, `# <display name>`, the One job first sentence, `Full role: [agent-factory/roles/<file>](../../../agent-factory/roles/<file>)`. Plan 43-14 adds the D-14 content.
- `scripts/catalog-freshness.ts` rewritten as the tree gate. On the committed tree it prints `Reference fresh: compared 20 page(s), 0 difference(s); …` (N = ROLE_COUNT + 1).
- `docs/catalog/README.md` deleted; `.gitattributes`, `vitest.config.ts`, `scripts/audit-model.ts` and `scripts/audit-model.test.ts` no longer describe it in the present tense.

### Pins moved, read off the gates' refusals

```
FAIL  the public-docs scan set derived 33 document(s), expected exactly 14 (root 4, examples 5, kitReadme 1, guarantees 1, skills 1, docs 21)
FAIL  the banned-claim scan set derived 150 document(s), expected exactly 131 (kit 79, publicDocs 34, installReadme 1, skillSources 7, claudeAdapters 28, pluginManifests 2, guarantees 1, skills 1, overlap 3)
PASS  banned claims: 0 findings over 150/150 elements
```

Entrants: docs/reference/README.md and the 19 agents pages (+20); exit: docs/catalog/README.md (-1). After the move both gates pass, and the public-docs gate reports zero retired-vocabulary hits over 33 documents.

### Foundation-guard pins

`npx vitest run scripts/check-foundation-guards.test.ts` was run at the plan's start, after Task 1's edges and after Task 2: 344 tests, 343 passed, 1 failed each time. The one failure is the baseline LANG-07 case ("every remaining floor item's LIVE COUNT is DERIVED", the untracked `~/` directory). No pin moved, so none was edited; `scripts/check-foundation-guards.test.ts` is unchanged.

## Task Commits

1. **Task 1: generator, tree gate, catalog retired, scan pins** - `5b34e14c` (feat)
2. **Task 2: gate failure arms, index equality, derived fixtures, leftovers** - `ba5678e4` (test)

## RED / GREEN record

- **Task 1 RED** (before any generator or gate change): `npx vitest run scripts/catalog-freshness.test.ts scripts/generate-catalog.test.ts` → 16 of 21 failed, each on the absent tree or the old output: `expected 'Catalog fresh: docs/catalog/README.md…' to contain 'Reference fresh:'`, `expected +0 to be 20` (snapshot of docs/reference empty), `ENOENT … docs/reference/README.md`, and the mirror cases exiting 1 because the old generator wrote to docs/catalog/, which the retargeted mirrors no longer create. Semantic assessment: every failure was the planned missing behaviour (no reference tree), none a load or syntax fault. GREEN: 21 of 21 passed.
- **Task 2: unexpected GREEN, investigated.** The new gate cases passed on their first run, because Task 1 already shipped the full tree gate that `<context>` describes (EXTRA, MISSING, non-regular, zero-page and ROLE_COUNT arms). To prove the cases are not vacuous, the committed `scripts/catalog-freshness.js` was mutated with each arm disabled and the file run against it: 7 of 13 failed, exactly the seven arm cases (EXTRA, two MISSING, link, zero pages, ROLE_COUNT too few, ROLE_COUNT too many). The file was then restored from a copy, and `git diff` shows no change. No RED commit precedes Task 2's commit; the commit subject is the plan's.

## Files Created/Modified

- `scripts/generate-catalog.ts` / `.js` - the reference generator (index and role pages, stray deletion, link refusal)
- `scripts/catalog-freshness.ts` / `.js` - the reference-tree freshness gate
- `scripts/generate-catalog.test.ts` - retargeted to docs/reference, whole-tree snapshot and restore, page, ordering, stray, link and index-equality cases, fixtures derived from kit-model
- `scripts/catalog-freshness.test.ts` - hermetic CHECK_ROOT mirror cases for every gate arm, a fake script root with a stub generator, leftover check, wiring
- `scripts/check-public-docs-vocabulary.ts` / `.js`, `scripts/check-banned-claims.ts` / `.js` - scan pins moved, with dated history comments
- `docs/reference/README.md`, `docs/reference/agents/*.md` - generated
- `docs/catalog/README.md` - deleted
- `scripts/audit-model.ts` / `.js`, `scripts/audit-model.test.ts`, `vitest.config.ts`, `.gitattributes` - catalog comments and the eol pin
- `hooks/hook-entry.ts` / `.js` - manifest regenerated

## Decisions Made

- docs/catalog/ deleted rather than left as a pointer (D-16a, planner's choice in `<objective>`).
- The gate honours CHECK_ROOT so plants never touch the shared checkout (the plan expected the real tree to be planted and restored; a mirror gives the same proof without racing other plans' gates).
- The index paragraph names role and workflow files only (see Deviations, item 2).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hook manifest regenerated for the audit-model.js comment edit**
- **Found during:** Task 2
- **Issue:** the comment-only edit to `scripts/audit-model.ts` changes the committed `scripts/audit-model.js`, which `hooks/hook-entry.ts` freezes by hash; `npm run freshness:hook-manifest` went red.
- **Fix:** `npm run generate:hook-manifest`, then committed `hooks/hook-entry.ts` and `hooks/hook-entry.js` with the change (the project notes' remedy).
- **Verification:** `npm run freshness:hook-manifest` → `Hook manifest fresh: 1 decider(s), 15 module hash(es)`; `scripts/floor-invariance.test.ts` 136/136 after the commit; `context-io.test.ts -t WR-36` 7 passed.
- **Committed in:** `ba5678e4`

**2. [No-fabrication rule] The index paragraph does not name skill files**
- **Found during:** Task 1
- **Issue:** `<context>` asks for a paragraph saying the pages are generated "from the role, skill and workflow files", but no skill page or skills table exists until plan 43-05.
- **Fix:** the paragraph says "from the role and workflow files"; plan 43-05 can add skills when the skills table exists.
- **Committed in:** `5b34e14c`

**3. [Rule 1 - Stale comment] scripts/audit-model.test.ts named docs/catalog/ in the present tense**
- **Found during:** Task 2 (the plan's `docs/catalog` grep over `*.ts`)
- **Issue:** the test header said "docs/catalog/README.md is GENERATED"; the file is not in `files_modified`.
- **Fix:** comment-only edit naming the reference pages.
- **Committed in:** `ba5678e4`

**4. [Scope note] scripts/check-banned-claims.ts needed no comment edit in Task 2**
- The plan's "near line 722" present-tense mention was already rewritten by plan 43-02; the file's only `docs/catalog` mentions are the dated pin histories at lines 1619 and 1634.

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 no-fabrication, 1 stale comment) plus 1 scope note.
**Impact on plan:** none on scope; each keeps a gate green or a sentence true.

## Issues Encountered

- After Task 1's edits, `scripts/check-banned-claims.test.ts` "THE MISSING DIRECTION: every scan member is a TRACKED path" failed naming the 20 reference pages, because they were not yet committed. Re-run after commit `5b34e14c`: passed.
- After Task 2's edits, `npm run check:build-parity` (hooks/hook-entry.js, scripts/audit-model.js "moved when the build ran") and `scripts/floor-invariance.test.ts` ("hooks/hook-entry.ts has no uncommitted modification") were red, both measured against HEAD. Re-run after commit `ba5678e4`: build parity ALL CHECKS PASSED, floor-invariance 136/136.
- No same-wave re-run was needed: no other plan committed during this run.

## Verification

Gates against 43-BASELINE.md, after the last commit: freshness:catalog 0, check:claim-anchors 0, check:audit-register 0, check:public-docs 0, check:banned-claims 0, freshness:guarantees 0, freshness:skill-twins 0, freshness 0 (93 .js), check:build-parity 0, check:state-paths 0, check-foundation-guards.js 0, check-kit-refs.js 0, check-flip-manifest.js 1 (baseline red), check-diff-disposition.js 0; also check:story-docs 0 and freshness:hook-manifest 0. `npm run typecheck` 0.

Test files: catalog-freshness + generate-catalog 31/31; with kit-model, frontmatter, audit-model, hooks/admission-guard and floor-invariance 770/771 before the commit (the one red cleared after it); check-public-docs-vocabulary, check-banned-claims, check-story-docs, installer-kit-home, check-flip-manifest, frontmatter, kit-model and audit-model 808/809 before the Task 1 commit (the tracked-path red cleared after it).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 43-05 can add `docs/reference/skills/*.md` and a skills table through the same page map; the tree gate's agents count check is ROLE_COUNT only, so a skills count check would be added there.
- Plan 43-14 fills the role pages (D-14) in the same generator.
- Plan 43-12 writes the dated CHANGELOG note for the removal of docs/catalog/.

---
*Phase: 43-story-and-layered-docs*
*Completed: 2026-11-18*

## Self-Check: PASSED

- FOUND: docs/reference/README.md, docs/reference/agents/orchestrator.md (19 pages), scripts/generate-catalog.ts, scripts/catalog-freshness.ts
- ABSENT (as intended): docs/catalog/README.md
- FOUND in HEAD's history: 5b34e14c, ba5678e4
