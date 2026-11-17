---
phase: 43-story-and-layered-docs
plan: "02"
subsystem: testing
tags: [claim-gates, public-docs-corpus, installer, kit-source, shipped-docs]

requires:
  - phase: 43-story-and-layered-docs
    provides: "43-BASELINE.md (plan 43-01): gate exit codes and the 21 known full-suite failures"
provides:
  - "install/kit-source.ts SHIPPED_DOCS_ROOTS, CHECKOUT_ONLY_DOCS (path + why) and shippedDocs(srcRoot): the one declaration of which user docs ship"
  - "A `docs` part in the public-docs corpus derived from shippedDocs(), so every shipped page under docs/ is inside both claim gates the moment it exists"
  - "PUBLIC_DOCS_SCAN_COUNT 14 and BANNED_CLAIM_SCAN_COUNT 131, read off each gate's refusal"
  - "The join commit cfd56f60, found by `git log --grep=\"join the public-docs corpus\"`"
  - "Test mirror option omitShippedDocs in both gate test files; the planted-page STORY-04 proof"
affects: [43-03, 43-04, 43-05, 43-06, 43-07, 43-08, 43-09, 43-10, 43-11, 43-12, 43-14, 43-15]

actuals:
  tokens: 9957
  tasks: 2
  commits: 2
plan_head_before: 3ce96808a9768612c18f3584f46aa2e946a46bd7
plan_head_after: c25b9b700e677d5345f8b3af9b5dbdc6726389a9

tech-stack:
  added: []
  patterns:
    - "A shipped-docs membership rule declared once in install/, read by scripts/ (new scripts/ -> install/kit-source.js edge)"
    - "Gate test mirrors size their shipped-docs fillers from the gate's own pin, so later pin moves need no mirror edit"

key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/deferred-items.md
  modified:
    - install/kit-source.ts
    - install/kit-source.js
    - install/installer-kit-home.test.ts
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-flip-manifest.test.ts

key-decisions:
  - "shippedDocs returns null, never a partial list, when any source root or nested directory cannot be read or the walk passes MAX_WALK_ENTRIES; checkout-only directories are not descended into"
  - "The public-docs default mirror writes docs/faq.md plus fillers sized from PUBLIC_DOCS_SCAN_COUNT, so the clean mirror keeps meeting the pin as later plans add or delete shipped pages"
  - "In check-banned-claims.test.ts the pages under docs/ admitted by the shipped-docs rule are derived from shippedDocs(), not enumerated; the named half (GUARANTEES, skills) stays enumerated and pinned at 2"

patterns-established:
  - "A new public page under docs/ joins both claim gates by existing; its plan moves the two scan pins off the gates' refusals"

requirements-completed: [STORY-04, STORY-02, STORY-05]

coverage:
  - id: D1
    description: "shippedDocs() derives the shipped user docs once: sorted POSIX paths, checkout-only paths and non-.md files left out, null on an unreadable root, [] on empty roots"
    requirement: STORY-02
    verification:
      - kind: unit
        ref: "install/installer-kit-home.test.ts#shippedDocs: the shipped user docs, declared once (plan 43-02, D-11, D-27)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every CHECKOUT_ONLY_DOCS entry names a path that exists and has a reason; the persisting pages are members on the live tree"
    requirement: STORY-02
    verification:
      - kind: unit
        ref: "install/installer-kit-home.test.ts#every CHECKOUT_ONLY_DOCS entry names a path that exists in this checkout and carries a reason"
        status: pass
      - kind: unit
        ref: "install/installer-kit-home.test.ts#on the live tree: the persisting pages are members and no checkout-only path is"
        status: pass
    human_judgment: false
  - id: D3
    description: "The public-docs corpus has a `docs` part; both claim gates scan docs/faq.md and docs/catalog/README.md, and the pins moved 12 -> 14 and 129 -> 131 off the gates' refusals"
    requirement: STORY-04
    verification:
      - kind: other
        ref: "node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js (exit 0)"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#the scan set is the concatenation of its six named parts, none empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "A page planted under docs/ in a mirror joins the banned-claim scan with no code change, and `fewer tokens` in it turns the gate red naming the file; the control passes"
    requirement: STORY-04
    verification:
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#PLANT: a page planted under docs/ joins the scan with no code change, and `fewer tokens` in it is named"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#CONTROL: the same planted page without the literal passes — the red above is the literal's"
        status: pass
    human_judgment: false
  - id: D5
    description: "The `docs` part refuses an empty and an unreadable derivation by name, in both gates"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "scripts/check-public-docs-vocabulary.test.ts#REFUSES an empty `docs` part by name (omitShippedDocs)"
        status: pass
      - kind: integration
        ref: "scripts/check-public-docs-vocabulary.test.ts#REFUSES a `docs` part whose derivation could not read a source root"
        status: pass
      - kind: integration
        ref: "scripts/check-banned-claims.test.ts#REPORTS an empty `docs` corpus part through the imported refusal channel (omitShippedDocs)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Each pin's history comment quotes its gate's refusal and names the entrants (STORY-05: no pin moved by arithmetic)"
    requirement: STORY-05
    verification: []
    human_judgment: true
    rationale: "Whether a comment quotes the refusal faithfully and names the right entrants is read, not asserted by a test"

duration: 20min
completed: 2026-11-17
status: complete
---

# Phase 43 Plan 02: Shipped docs join the public-docs corpus Summary

**One derived list in install/kit-source.ts (shippedDocs, with five checkout-only paths and their reasons) now decides which user docs ship, and the public-docs corpus reads it as a `docs` part, so every page written under docs/ is inside both claim gates the moment it exists.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-11-17T22:46:41Z
- **Completed:** 2026-11-17T23:06:49Z
- **Tasks:** 2
- **Files modified:** 10 (plus deferred-items.md created)

## Accomplishments

- `install/kit-source.ts` exports `SHIPPED_DOCS_ROOTS = ["docs", "examples"]`, `CHECKOUT_ONLY_DOCS` (docs/audit/, docs/design/, docs/initial/, docs/dogfood-human-runbook.md, docs/pre-v3-state-layout.md, each with a `why`) and `shippedDocs(srcRoot)`. install/ imports nothing from scripts/.
- `scripts/check-public-docs-vocabulary.ts` imports `shippedDocs` from `../install/kit-source.js` and adds the `docs` part (docs/ subset minus docs/GUARANTEES.md and docs/skills.md), with two named refusals pushed into the shared refusal channel.
- Both scan pins moved off their gates' refusals, with dated history comments naming docs/faq.md and docs/catalog/README.md.
- The planted-page mirror case proves the rule covers a page before it is written (STORY-04, D-21).

### RED lines read off the gates (part added, pins not yet moved)

```
FAIL  the public-docs scan set derived 14 document(s), expected exactly 12 (root 4, examples 5, kitReadme 1, guarantees 1, skills 1, docs 2)
FAIL  the banned-claim scan set derived 131 document(s), expected exactly 129 (kit 79, publicDocs 15, installReadme 1, skillSources 7, claudeAdapters 28, pluginManifests 2, guarantees 1, skills 1, overlap 3)
```

Both runs reported zero findings (`PASS banned claims: 0 findings over 131/131 elements`). The `docs` part's members on the live tree were `["docs/catalog/README.md", "docs/faq.md"]`.

### Foundation-guard pins

- Pre-edit run of `scripts/check-foundation-guards.test.ts` (344 tests): 1 failed — `LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24) every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose`.
- After Task 1 and after Task 2: the same 1 failed, same name (LANG-07, listed in 43-BASELINE.md). The new `scripts/` -> `install/kit-source.js` edge moved no foundation-guard pin, so none was edited. `node scripts/check-foundation-guards.js` exits 0.

### Task 2 RED evidence (by mutation)

Task 2's cases test behaviour Task 1 shipped (the tracer ordering), so they passed on first run (211/211). To show they fail on their own assertions, the committed `.js` was mutated (the `docs` part removed from scripts/check-public-docs-vocabulary.js; `isCheckoutOnlyDoc` forced to `false` in install/kit-source.js), the cases run, then `npm run build` restored both files (empty `git diff` afterwards). Under the mutation 11 cases failed, including every new gate and contract case:

- `returns sorted POSIX paths, keeps nested pages, and leaves out checkout-only paths and non-.md files` — `expected [ 'docs/a/b.md', …(11) ] to deeply equal [ 'docs/a/b.md', 'docs/faq.md', …(2) ]`
- `PLANT: a page planted under docs/ joins the scan …` — `expected '  FAIL  the banned-claim scan set der…' to match /…/planted-new-page\.md:\d+:\d+ — banned token-economy literal "fewer tokens"/`
- `REFUSES an empty \`docs\` part by name (omitShippedDocs)` — `expected '…' to contain 'public-docs scan derivation refused: …'`
- also `returns [] when docs/ and examples/ exist …`, `on the live tree …`, the planted-page CONTROL, the banned-claims `omitShippedDocs` case, and `REFUSES a \`docs\` part whose derivation could not read a source root`.

The symlink/cycle, null-root and recorded-paths cases do not depend on either mutation and stayed green, as expected.

## Task Commits

1. **Task 1: shippedDocs, the `docs` corpus part, the two pins** — `cfd56f60` (feat) — `feat(43-02): the shipped user docs join the public-docs corpus`
2. **Task 2: the derivation's contract, the empty part, the planted page** — `c25b9b70` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `install/kit-source.ts` / `.js` — SHIPPED_DOCS_ROOTS, CHECKOUT_ONLY_DOCS, shippedDocs()
- `scripts/check-public-docs-vocabulary.ts` / `.js` — the `docs` part, its two refusals, PUBLIC_DOCS_SCAN_COUNT 14
- `scripts/check-banned-claims.ts` / `.js` — BANNED_CLAIM_SCAN_COUNT 131, docs/ exclusion comment rewritten
- `scripts/check-public-docs-vocabulary.test.ts` — mirror docs pages, `omitShippedDocs`, `"docs"` in the part-name array, independent docs count in corpusFromDisk, two refusal cases
- `scripts/check-banned-claims.test.ts` — mirror docs page, `omitShippedDocs`, admission set extended by rule, checkout-only absence, probe copy, push-site pin 6 -> 8, planted-page case and control, refusal-channel case
- `scripts/check-flip-manifest.test.ts` — planted corpus lists docs/runbook.md under publicDocs
- `install/installer-kit-home.test.ts` — shippedDocs unit and live-tree cases
- `.planning/phases/43-story-and-layered-docs/deferred-items.md` — the out-of-scope hook-manifest drift

## Decisions Made

- shippedDocs gives null rather than a partial list on any read failure or on passing MAX_WALK_ENTRIES (threat T-43-06), and does not descend into a checkout-only directory, so record trees neither cost walk budget nor fail the walk.
- An absent source root counts as unreadable (null), as in srcSkillNames: a source checkout missing docs/ or examples/ is broken.
- The pages under docs/ admitted by the shipped-docs rule are derived in check-banned-claims.test.ts, not enumerated. An enumerated list would need an edit for each new page, which STORY-04 forbids. That half is bounded by the rule, by a non-empty floor and by a new assertion that no checkout-only path is a scan member.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The public-docs default mirror writes fillers sized from the pin, not one page**
- **Found during:** Task 1
- **Issue:** The plan said the default mirror should write one shipped docs page (docs/faq.md). With the pin at 14 the clean mirror would then derive 13 and fail the pin. Every later plan of this phase moves the pin and edits no mirror, so a fixed page count would also turn the clean mirror red in each of those plans.
- **Fix:** The default mirror writes docs/faq.md plus `PUBLIC_DOCS_SCAN_COUNT − (the other parts' members) − 1` fillers, the rule check-banned-claims.test.ts already uses for its kit fillers. The banned-claims mirror writes one page (docs/faq.md), as the plan says, because its fillers already absorb pin moves.
- **Files modified:** scripts/check-public-docs-vocabulary.test.ts
- **Verification:** both test files 167/167 after Task 1
- **Committed in:** cfd56f60

**2. [Rule 1 - Bug] Five existing gate-test cases pinned the pre-change world**
- **Found during:** Task 1
- **Issue:** The new part moved four existing assertions in check-banned-claims.test.ts and one in check-public-docs-vocabulary.test.ts: the refusal-push-site count (6), the admission set under the `**/docs/` segment (exactly GUARANTEES and skills, in two cases), the probe build copy (it did not copy install/kit-source.js, so the import failed in two cases), and corpusFromDisk (no docs part, 13 vs 15).
- **Fix:** push-site pin 6 -> 8 with a dated note; admission set = the named pair plus `admittedByTheShippedDocsRule()`, with a non-empty floor and a new assertion that no checkout-only path is a scan member; the probe copy gains install/kit-source.js; corpusFromDisk counts docs/ pages with its own recursive read and the imported CHECKOUT_ONLY_DOCS.
- **Files modified:** scripts/check-banned-claims.test.ts, scripts/check-public-docs-vocabulary.test.ts
- **Verification:** 167/167
- **Committed in:** cfd56f60

**3. [Rule 3 - Blocking] check-flip-manifest.test.ts was not in files_modified and went red**
- **Found during:** Task 1 (run of every test file importing the changed modules)
- **Issue:** Its planted corpus holds docs/runbook.md, a shipped page by the new rule, so the gate derived publicDocs 6 against a manifest listing 5; 9 cases failed.
- **Fix:** The planted manifest lists docs/runbook.md under publicDocs, and the three count strings read `publicDocs 6 … overlap 3` (pin unchanged at 10), with a dated comment.
- **Files modified:** scripts/check-flip-manifest.test.ts
- **Verification:** 37/37
- **Committed in:** cfd56f60

**4. [Rule 2 - Missing critical] Extra refusal and link cases**
- **Found during:** Task 2
- **Issue:** The plan's behaviour list did not cover the `docs` part's null refusal, a symlinked page or a symlink cycle, and left the banned-claims `omitShippedDocs` option with no case of its own.
- **Fix:** Added a source-root-unreadable case (public-docs), a symlink and cycle unit case, and a banned-claims refusal-channel case.
- **Files modified:** scripts/check-public-docs-vocabulary.test.ts, install/installer-kit-home.test.ts, scripts/check-banned-claims.test.ts
- **Committed in:** c25b9b70

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 missing critical)
**Impact on plan:** All four follow directly from the new edge. No scope creep: no production behaviour beyond the plan's was added.

## Issues Encountered

- **Same-wave re-runs:** none needed. Plan 43-01 had finished (its SUMMARY and the baseline commit 6b2e7db0 were in `git log`) before this plan's first edit, so the two plans did not share a half-edited tree.
- **Out of scope, logged to deferred-items.md:** `npm run freshness:hook-manifest` exits 1, and `scripts/context-io.test.ts` case "31-37 WR-36 …" fails with "the grugops hook module "scripts/audit-model.js" does not match the frozen manifest" (it fails the same way when run alone). scripts/audit-model.js changed in plan 43-01 (5c281053, 680b2958) and hooks/hook-entry.ts was not regenerated. The manifest names none of this plan's files. Neither check is in 43-BASELINE.md.
- **build-parity before commit:** `npm run check:build-parity` flagged the three uncommitted `.js` before the Task 1 commit (it compares against the committed tree) and passed after it.

## Verification

- `npm run build && npx vitest run scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts` — 167 passed (Task 1); with install/installer-kit-home.test.ts, 211 passed (Task 2).
- `node scripts/check-public-docs-vocabulary.js && node scripts/check-banned-claims.js && node scripts/check-audit-register.js && npm run freshness:guarantees` — all exit 0.
- `npm run freshness && npm run check:build-parity && node scripts/check-foundation-guards.js` — all exit 0 (92 committed .js fresh).
- `npx vitest run scripts/check-foundation-guards.test.ts` — 343/344, the one failure is LANG-07 (baseline).
- `npm run typecheck` — exit 0.
- The 14 gates in 43-BASELINE.md: every exit code equals the baseline (13 exit 0; check-flip-manifest exit 1 with the same single FAIL, the moved manifest).
- Acceptance greps: join commit count 1; `name: "docs"` 1; `export function shippedDocs` 1; `from "../scripts/` in install/kit-source.ts 0; `planted-new-page` 3; `omitShippedDocs` 4; `ls scripts/*.test.ts | wc -l` 85; `docs/catalog` in the three test files 0.
- Related test files (24 importing the changed modules), run after Task 1: failures by name were LANG-07 and the seven context-io cases in 43-BASELINE.md, the nine flip-manifest cases fixed above, and the WR-36 case logged as out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 43-03 (link check) and 43-06 (installer) can import `shippedDocs`, `SHIPPED_DOCS_ROOTS` and `CHECKOUT_ONLY_DOCS` from install/kit-source.js.
- Every later page under docs/ joins both gates on its first commit; each such commit must move PUBLIC_DOCS_SCAN_COUNT and BANNED_CLAIM_SCAN_COUNT off the gates' refusals. Test mirrors need no edit for those moves.
- When plan 43-04 deletes docs/catalog/README.md, both pins drop by one; no test this plan wrote names that page.
- The hook-manifest drift in deferred-items.md needs `npm run generate:hook-manifest` from whichever plan owns scripts/audit-model.ts.

## Self-Check: PASSED

- FOUND: install/kit-source.ts, install/kit-source.js, install/installer-kit-home.test.ts, scripts/check-public-docs-vocabulary.ts, scripts/check-banned-claims.ts, scripts/check-flip-manifest.test.ts, .planning/phases/43-story-and-layered-docs/deferred-items.md
- FOUND: cfd56f60, c25b9b70 (both ancestors of HEAD)

---
*Phase: 43-story-and-layered-docs*
*Completed: 2026-11-17*
