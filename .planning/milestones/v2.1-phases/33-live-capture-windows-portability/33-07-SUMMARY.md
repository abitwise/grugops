---
phase: 33-live-capture-windows-portability
plan: 07
subsystem: tooling
tags: [flip-manifest, gap-d1, check-gate, derive-the-set, planted-repository, vitest, typescript]

requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-01's census re-pin procedure (check-foundation-guards.test.ts, check-claim-anchors.test.ts) and the capture summary's section names (capture-live.ts) the citation form points at
  - phase: 29-controlled-language
    provides: check-diff-disposition.ts's inverted design (derive what changed from git; the no-verdict-on-failure text; planted-repository reproductions as permanent cases) and check-banned-claims.ts's parts array, per-part vacuity floor and two-sided pin wording
  - phase: 30-red-team
    provides: the frontmatter authority's fence projection and heading-occurrence question (fencedLineFlags, unfencedHeadingIndices) this gate takes instead of a grammar of its own
provides:
  - "33-FLIP-MANIFEST.md: the declared GAP-D1 flip — five derived live-surface parts with per-part counts and a pinned total of 28, four named ledger exclusions, two anchored history exemptions, a five-marker deferral vocabulary, 62 flip rows (one per cell), 10 correction rows, the D-18 citation form, a two-valued status field"
  - "scripts/check-flip-manifest.ts (+ .js): the gate — declared side parsed from the manifest, actual side derived from git and the tree; residual, citation and commit-set rules in force only when discharged; every underived input is NO verdict"
  - "scripts/check-flip-manifest.test.ts: 37 planted-repository cases, every refusal with its converse, the two mandatory reproductions RED before the rules existed"
  - "check:flip-manifest npm script and a ci.yml gate-block step, so the gate is reached"
affects: [33-10 capture summary section names, 33-11 the flip commit and its enforcing-mode run, any later scope amendment to the manifest]

actuals:
  tokens: 43853
  tasks: 3
  commits: 5
plan_head_before: 6b33fb9e5b144755bfb388cbce114f9574f2ff7c

tech-stack:
  added: []
  patterns:
    - "Tables identified by header row, never by heading: the manifest's machine-readable structures are markdown tables the gate finds by their first header cells, so the gate owns no section-extent grammar"
    - "A declaration checked against the tree it describes in BOTH states: a pre-flip anchor must be present before the flip and absent after; a post-flip marker the reverse; a ledger row open then not open — the manifest cannot drift from the tree silently"
    - "The flip commit is derived from history (git log -S over the manifest for the status line, parent not discharged), never recorded in the manifest"
    - "Two-state gate: the pre-capture state is a declared phase whose derivations still refuse, not a bypass"

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md
    - scripts/check-flip-manifest.ts
    - scripts/check-flip-manifest.js
    - scripts/check-flip-manifest.test.ts
  modified:
    - .github/workflows/ci.yml
    - package.json
    - scripts/check-foundation-guards.test.ts
    - scripts/check-claim-anchors.test.ts
    - scripts/check-public-docs-vocabulary.test.ts
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "The live-surface parts are: publicDocs (the repo's own publicDocsCorpus(), 12), docsTree (tracked markdown under docs/ minus docs/audit/**, 7), planningLedgers (top-level .planning/*.md minus four named closed-period records, 5), archivedRecords (the flip class's files under .planning/milestones/, 4), runtimeEvidence (*-RUNTIME-EVIDENCE.md, 1); overlap 1; pinned total 28"
  - "`.planning/PROJECT.md` is declared in the flip set although D-17 did not name it: the census found four current-state sentences (L51, L175, L239, L241) that would survive the flip as false claims; one dated Evolution line (L322) is exempt by anchor"
  - "`docs/audit/**` is out of the docs part by criterion (the record shelf), so the disposition register's two `pending human` lines describing plan 28-05's diff stay; the register receives an appended discharge note (a marker row) instead"
  - "The residual rule's second token is GAP-D1 plus one of five measured deferral markers, with two anchored history exemptions (a PROJECT.md Evolution entry, a STATE.md decision-log entry) — the marker vocabulary is content, the flip class is the enumeration, the rule is the net"
  - "The correction class holds ten rows, not RESEARCH's five: nine archived nine-cell sentences (the table has seven data rows, `grep -aon '9 [^|]\\{0,40\\}cells'`) plus the runtime-evidence heading `## Slots — all empty, all UNVERIFIED`, false about its own file since the 2026-07-29 observation filled the slots"
  - "The runtime-evidence document's slots are NOT empty (filled by the July 2026 human observation, corroboration under D-01), so its flip row is a marker: a second, headless-capture block appended, the human observation kept verbatim"
  - "20-HUMAN-UAT.md's five rows are declared with their evidence class stated (the CI run id in 33-CI-MEASUREMENT.md, never the capture summary) because plan 33-11's one flip commit includes the file"
  - "The gate is wired into ci.yml and package.json rather than CI_EXEMPT: over the real tree it asserts in every CI run that the manifest still describes the tree, and after the flip it enforces over the derived flip commit"

patterns-established:
  - "Manifest grammar: `**Manifest status:** \\`<value>\\`` line; tables found by header (`Setting|Value`, `Part|Derivation rule`, `Part|Member`, `Excluded ledger`, `Deferral marker`, `Exempt file`, `#|File|Kind`, `#|File|Line|Stale fragment`); a cell in one backtick pair or a `` `` x `` `` pair is unwrapped; `\\|` is a literal pipe"
  - "Flip-row kinds: status, anchor (present then absent), marker (absent then present), parity-row (`row N \"label\"`; label checked before, citation form on every data cell after), ledger-row (`id N` via the JSON appendix; open then not open)"

requirements-completed: [CAP-01]

coverage:
  - id: D1
    description: "The manifest declares the live-surface set as named parts with per-part derivation rules and counts, states what is out of scope and why, separates the flip and correction classes, fixes the citation form, carries the two-valued status field and the WINDOWS.md rule"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "test -s 33-FLIP-MANIFEST.md && grep -ac '^| ' 33-FLIP-MANIFEST.md -> 131 rows (>= 20)"
        status: pass
      - kind: other
        ref: "npm run check:nul-bytes -> ALL CHECKS PASSED (2398 tracked files, zero control bytes)"
        status: pass
      - kind: other
        ref: "grep -ac 'pending human' examples/03-ticket-to-pr.md -> 9"
        status: pass
      - kind: integration
        ref: "node scripts/check-flip-manifest.js -> every one of 62 flip rows, 10 correction rows and 2 exemption anchors resolves against the pre-capture tree"
        status: pass
    human_judgment: false
  - id: D2
    description: "The gate derives both sides independently, prints each part with its count and the derived total beside the pin, refuses per-part vacuity and pin drift with the banned-claims wording, applies the residual and commit-set rules only when discharged, and reports NO verdict on an underived input"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "npm run build && npm run check:build-parity && npm run typecheck -> ALL CHECKS PASSED / clean"
        status: pass
      - kind: integration
        ref: "node scripts/check-flip-manifest.js -> exit 0; output names `status: pre-capture` and `live-surface parts: publicDocs 12, docsTree 7, planningLedgers 5, archivedRecords 4, runtimeEvidence 1; overlap 1; derived total 28, pinned 28`"
        status: pass
      - kind: unit
        ref: "scripts/check-flip-manifest.test.ts#the floored, pinned live-surface set; #an underived input is NO verdict; #the commit-set rule (D-17)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every refusal the gate can issue has been seen to fire on a planted tree and has a passing converse; the two mandatory reproductions were run RED before the rules existed"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-flip-manifest.test.ts -> 37 passed (37)"
        status: pass
      - kind: unit
        ref: "gsd-tools check tdd-red-evidence over the RED run's TAP -> RED_EVIDENCE_OK for both target tests (see 'The RED runs' below)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' -> 78 files, 5326 passed, 2 skipped"
        status: pass
    human_judgment: false
  - id: D4
    description: "The scoping assumption behind the live-surface set — a live surface makes a CURRENT claim; a closed-period record is history — and the PROJECT.md addition, the docs/audit exclusion and the two anchored exemptions that follow from it"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "CAP-01's edge was left unresolved by the planner on purpose: which documents are live surfaces is a scoping decision over this repository's own records, falsifiable by reading the manifest's section 1 against the measured token lines it lists, not by any test"

duration: 54min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 07: The flip manifest and its gate Summary

**The GAP-D1 flip is declared before any capture exists — a manifest whose live-surface scope is five derived, floored parts pinned at 28, whose flip class has one row per cell (62) and whose correction class is kept apart (10) — and a gate that parses that declaration, derives the other side from git and the tree, checks every declared locator against the tree in both states, and was watched refuse on planted repositories before its two rules were written.**

## Performance

- **Duration:** 54 min
- **Started:** 2026-09-19T22:59:14Z
- **Completed:** 2026-09-19T23:53:28Z
- **Tasks:** 3
- **Files modified:** 10 (4 created, 6 modified)

## Accomplishments

- `33-FLIP-MANIFEST.md`: the scope rule written into the manifest as an allow-list of named parts, each with its derivation command, its listed members and its count, plus four ledger exclusions with reasons, two anchored history exemptions, a five-marker deferral vocabulary measured from the current-state sentences, 62 flip rows across 14 files, 10 correction rows, the exact D-18 citation form, and a status field whose two values gate the residual and commit-set rules.
- `scripts/check-flip-manifest.ts`: reads the manifest's tables by header row; derives `publicDocs` from the repository's own corpus, `docsTree` / `planningLedgers` / `runtimeEvidence` from `git ls-files -z`, `archivedRecords` from the flip table; floors each part, compares the listing with the derivation, compares the deduplicated total with the pin; resolves every anchor, marker, parity row, ledger row, correction fragment and exemption in the declared state; derives the flip commit from history and compares its changed set with the declared set; scans the live-surface set for the two residual tokens; parses every flipped parity cell for the citation form and asks the heading authority whether the cited section exists. An unreadable manifest, a failed git call, a missing table, an undeclared state or a missing capture summary reports no verdict.
- `scripts/check-flip-manifest.test.ts`: 37 permanent cases on real git repositories under the OS temp dir, one planted tree per case, removed afterwards; every refusal asserts its text; every refusal has a converse.
- The gate is reached: a `ci.yml` gate-block step (with the two-state contract explained beside it) and `check:flip-manifest` in `package.json`; the reachability census (`every scripts/check-*.js appears in ci.yml, or declares why not`) is what demanded it.

## Task Commits

1. **Task 1: The manifest** - `9176a89f` (docs)
2. **Task 2: The gate** - `4aca0b80` (feat, the gate without its two rules) → `f975f4c8` (test, RED) → `550deeda` (feat, GREEN: the residual and citation rules)
3. **Task 3: Planted-tree reproductions** - `485675ef` (test)

**Plan metadata:** see the follow-up docs commit.

Commits measured from the plan ledger: `git rev-list --count 6b33fb9e..HEAD` = 5.

## The RED runs (Task 3's mandatory reproductions, before the rules existed)

Commit `4aca0b80` carried the gate with everything except the residual rule and the citation rule. Commit `f975f4c8` added the harness and nine cases. Run at that commit:

```
$ npx vitest run --exclude '**/scripts/e2e/**' scripts/check-flip-manifest.test.ts
 ❯ scripts/check-flip-manifest.test.ts (9 tests | 2 failed)
     ✓ exits 0, names the status it read, and prints every part with the derived total beside the pin
     × RED 1: a `pending human` cell surviving inside the derived live-surface set, in an undeclared file, exits 1 and names file and line
     ✓ CONVERSE 1: the same cell surviving OUTSIDE the live-surface set (a plan record, an excluded ledger) passes
     ✓ the same surviving cell does NOT fail the gate in the pre-capture state — before the flip those cells are correct
     × RED 2: a flipped parity cell with no parenthetical exits 1 and names the cell
     ✓ CONVERSE 2: every cell carrying a well-formed citation to an existing summary section passes
     ✓ (three grammar cases)
AssertionError: expected '[derivation] manifest .planning/phase…' to contain 'docs/runbook.md:5'
      Tests  2 failed | 7 passed (9)
```

Both targets failed on the planned assertion (the refusal text absent, `ALL CHECKS PASSED` printed instead), not on a load error. The same run under `--reporter=tap-flat` with the three `# tests / # pass / # fail` summary lines appended (vitest's TAP omits them; the counts are 9 / 7 / 2, read off the flat `ok` / `not ok` lines) was classified by `gsd-tools check tdd-red-evidence` as `RED_EVIDENCE_OK` / `target_test_failed` for each target separately. After `550deeda`: 9/9; after `485675ef`: 37/37, four consecutive full-file runs.

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` - the declaration (D-17, D-18, D-19): status field, settings, five parts, exclusions, deferral markers, exemptions, members, 62 flip rows, 10 correction rows, the citation form, what the manifest does not decide
- `scripts/check-flip-manifest.ts` / `.js` - the gate; exports the parsers (`parseTables`, `splitTableRow`, `unwrapCell`, `parseManifest`, `declaredSet`, `parseCitation`, `deriveParts`, `deriveFlipCommit`, `changedFiles`) behind the one entry guard
- `scripts/check-flip-manifest.test.ts` - the planted-tree suite and its manifest renderer
- `.github/workflows/ci.yml` - the gate-block step after `check-residual-citations.js`
- `package.json` - `check:flip-manifest`
- `scripts/check-foundation-guards.test.ts` - census pins re-derived: `NON_TEST_MODULE_COUNT` 88→89, the `scripts/`-scoped corpus 61→62 (three sites), the frontmatter consumer list 11→12 (`check-flip-manifest.ts` takes `fencedLineFlags` and `unfencedHeadingIndices`, both declarative), gate-module targets 10→11, `TRIPWIRE_MODULES` 71→72
- `scripts/check-claim-anchors.test.ts` - isEntry-guard delegation census 16→17
- `scripts/check-public-docs-vocabulary.test.ts` - the new `publicDocsCorpus` consumer declared with the direction its narrowing fails in (a denominator: smaller set, fewer findings, fails open — so the corpus, not the scan)
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - the pre-existing `check:diff-disposition` red over README.md

## The measured scope, so a reader can check it rather than trust it

| Part | Rule | Count | Token lines today |
|---|---|---:|---|
| `publicDocs` | `publicDocsCorpus()` | 12 | `examples/03-ticket-to-pr.md` 9 × `pending human`; `CHANGELOG.md` 2 × GAP-D1 with no deferral marker |
| `docsTree` | `git ls-files -- docs`, `.md`, not `docs/audit/` | 7 | `docs/dogfood-human-runbook.md` 3 × `pending human` |
| `planningLedgers` | top-level `.planning/*.md` minus MILESTONES, RETROSPECTIVE, v1.2-SDLC-COVERAGE-AUDIT, v2.1-MILESTONE-AUDIT | 5 | PROJECT L51/L175 (T2), L239/L241 (T1), L322 (exempt); REQUIREMENTS L181; STATE L1481/1572/1577/1580/1583 (T2), L658 (exempt) |
| `archivedRecords` | the flip table's `.planning/milestones/` files | 4 | 06-HUMAN-UAT 1, 06-VERIFICATION 8, 19-VERIFICATION 2 |
| `runtimeEvidence` | `*-RUNTIME-EVIDENCE.md` | 1 | none (the marker row) |

Total 28 after one overlap (`docs/GUARANTEES.md`). Repo-wide the same tokens sit in 46 and 47 files; everything outside these 28 is named in the manifest's section 1.6 as history.

Three premises from the plan's inputs were corrected by reading, and the manifest records each:

1. RESEARCH counted five archived "9 cells" sentences; the census found nine (`06-HUMAN-UAT.md:32`, `06-VERIFICATION.md:10,32,133`, `19-VERIFICATION.md:10,17,20,26,127`). All are correction rows.
2. The plan and RESEARCH describe the runtime-evidence document's slots as empty; they were filled on 2026-07-29 by the human observation (`status: performed-observation-matches-expected`). The flip row is therefore a marker (append the headless block), and the file's own heading `## Slots — all empty, all UNVERIFIED` is a tenth correction row.
3. D-17's file list omits `.planning/PROJECT.md`, whose current-milestone and carried-obligations sections carry four sentences that would be false after the flip. Declared, with the reason, as rows F59-F62.

## Decisions Made

See `key-decisions` in the frontmatter. The one that most needs a second reader is the scoping assumption itself (coverage D4): that `docs/audit/**`, the four top-level closed-period records, and every unnamed phase and milestone record are history, while `PROJECT.md` is current state. The manifest lists every token line the assumption puts on either side.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The gate wired into ci.yml and package.json**
- **Found during:** Task 2 (the census suites after the module landed)
- **Issue:** `check-foundation-guards.test.ts` refuses a `scripts/check-*.js` that ci.yml does not invoke and no exemption names ("a gate that is never reached passes by not running"). The plan's file list carried neither `ci.yml` nor `package.json`.
- **Fix:** a gate-block step after `check-residual-citations.js` with the two-state contract explained beside it, and `check:flip-manifest`; the gate-module class pin moved 10→11. Chosen over `CI_EXEMPT` because over the real tree the pre-capture run is itself a check (the manifest must keep describing the tree until 33-11 uses it) and the enforcing run after the flip must be repeated by CI, not by hand.
- **Files modified:** `.github/workflows/ci.yml`, `package.json`, `scripts/check-foundation-guards.test.ts`
- **Verification:** the reachability cases green; `node scripts/check-flip-manifest.js` exit 0 on this tree
- **Committed in:** `4aca0b80`

**2. [Rule 3 - Blocking] Census pins re-derived for the new module and suite**
- **Found during:** Task 2 and Task 3
- **Issue:** the two-sided pins a new `scripts/*.ts` moves by construction (33-01 / 33-03 procedure): non-test modules 88, the `scripts/`-scoped corpus 61 (three sites), the isEntry-guard census 16, the frontmatter consumer list (11 modules), the test-module tripwire 71; and `check-public-docs-vocabulary.test.ts` refuses an undeclared consumer of `publicDocsCorpus`.
- **Fix:** each re-derived independently (`git ls-files '*.ts'` minus tests reports 89; the scoped walk 62; `grep -l 'const isEntry ='` minus tests 17; `grep -l 'from "./frontmatter.js"'` minus tests 12; `ls scripts/*.test.ts | wc -l` 72) and moved with the derivation recorded in each pin's comment block, in the same commit as the module or the suite; the corpus consumer declared with its narrowing direction.
- **Files modified:** `scripts/check-foundation-guards.test.ts`, `scripts/check-claim-anchors.test.ts`, `scripts/check-public-docs-vocabulary.test.ts`
- **Verification:** the six census suites 817/817; full lane 5326 passed
- **Committed in:** `4aca0b80`, `485675ef`

**3. [Rule 1 - Bug] Ten manifest anchor cells carried a stray inner backtick pair**
- **Found during:** Task 2, the gate's first pre-capture run
- **Issue:** the cells written in the double-backtick form (`` `` x `` ``) for anchors that themselves contain a backtick were written as `` `` `x` `` ``, so the unwrapped anchor began and ended with a backtick the file does not carry; the gate refused all ten by name ("the manifest does not describe the tree it is read against").
- **Fix:** the ten cells rewritten; the grammar rule stated in the manifest's "How the gate reads this document" paragraph.
- **Files modified:** `33-FLIP-MANIFEST.md`
- **Verification:** `node scripts/check-flip-manifest.js` → every one of 62 flip rows, 10 correction rows, 2 exemption anchors resolves
- **Committed in:** `4aca0b80`

**4. [Rule 1 - Bug] A root commit's changed set read as empty**
- **Found during:** Task 2 RED harness (the control case)
- **Issue:** `git diff-tree --no-commit-id --name-only -r <root commit>` prints nothing without `--root`, so the informational line on a single-commit tree read `changed set of HEAD (0)`.
- **Fix:** `--root` added to the invocation.
- **Files modified:** `scripts/check-flip-manifest.ts`
- **Committed in:** `f975f4c8`

**5. [Rule 3 - Blocking] A transient git object-write failure in the planted-tree harness**
- **Found during:** Task 3 (two of the first four full-file runs)
- **Issue:** `git add -A` in a fresh temp repository died with `error: <path>: failed to insert into database / fatal: updating files failed` (git 2.55.0, darwin). Not reproduced in a 60-repository stress loop of the same env; not caused by the gate, which is spawned only after the commit lands.
- **Fix:** the harness retries that ONE stderr message a bounded three times with a short wait and still throws on anything else; the hazard is named in the harness comment.
- **Files modified:** `scripts/check-flip-manifest.test.ts`
- **Verification:** four consecutive full-file runs 37/37; the full lane 5326 passed
- **Committed in:** `485675ef`

---

**Total deviations:** 5 auto-fixed (2 bugs, 2 blocking, 1 missing critical). **Impact on plan:** all necessary for correctness or for the tree's own gates to admit the module; the manifest's scope decisions (PROJECT.md added, docs/audit excluded, 20-HUMAN-UAT declared with its evidence class) are recorded in the manifest with reasons rather than as deviations, because the plan asked for the parts to be proposed and adjusted with a recorded reason.

## Issues Encountered

- `gsd-tools check tdd-red-evidence` parses `node --test`-style TAP (`# tests N` / `# pass N` / `# fail N`), which vitest's `tap` and `tap-flat` reporters do not emit; the three summary lines were appended to the flat output from its own `ok` / `not ok` counts before classification. The counts are the reporter's, not narrated.
- While confirming that the 21 `check:diff-disposition` findings predate this plan, the working tree was briefly checked out at `6b33fb9e` (read-only, no commit, no stash) and returned to `main`; the branch, HEAD and the staged working-tree changes were verified intact afterwards. `git log 6b33fb9e..HEAD -- README.md` is empty; the findings are commit `52377a7a`'s. Logged in `deferred-items.md` and in `.planning/WINDOWS.md` (row 225, via `gsd-tools windows append`, lint-warning).
- The plan-level `npm run check:diff-disposition` is therefore red on this tree for a pre-existing reason outside this plan's files; the other four document gates (`check:nul-bytes`, `check:banned-claims`, `check:residual-citations`, `check:claim-anchors`) exit 0.

## Verification (plan-level)

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | 78 files, 5326 passed, 2 skipped, exit 0 |
| `node scripts/check-flip-manifest.js` | exit 0; `status: pre-capture`; `publicDocs 12, docsTree 7, planningLedgers 5, archivedRecords 4, runtimeEvidence 1; overlap 1; derived total 28, pinned 28`; 62 / 10 / 2 locators resolve; changed set of HEAD printed as informational |
| `npm run build && npm run check:build-parity && npm run typecheck` | clean / ALL CHECKS PASSED / clean |
| `npm run check:nul-bytes` | ALL CHECKS PASSED (2398 tracked files) |
| `npm run check:diff-disposition` | 1 CHECK(S) FAILED — 21 pre-existing README.md clauses from `52377a7a`, outside this plan (deferred-items, WINDOWS row 225) |

## Known Stubs

None. The manifest's post-flip values are deliberately unfilled (they come from the capture, plan 33-10) and the manifest says so; that is the declared pre-capture state, not a stub.

## Next Phase Readiness

- Plan 33-10 must write `33-CAPTURE-SUMMARY.md` beside the manifest with headings the flipped cells can cite by text (the gate tries levels 1-6 of `<heading text>`); `capture-live.ts` already emits `## Run`, `## CAP-03 verdict (D-02) — run <label>`, `## Dual-path equivalence (D-07)`, `## Completion`.
- Plan 33-11's one flip commit must change exactly the 14 declared files (the manifest itself included, its status set to the second value in that commit) and must edit `.planning/PROJECT.md`, which its `<files>` list does not yet name; the manifest is the instruction. Post-flip prose must avoid the literal `pending human` and the five deferral markers on any GAP-D1 line in the 28 live-surface documents, or the gate names the line.
- Open for 33-11's reading: whether `docs/audit/28-disposition-register.md`'s discharge note should begin with the declared marker `Discharged by plan 33-11` (a marker row fixes the literal), and whether row 214 (WINDOWS.md) is still open when the flip lands (declared on the premise that 33-08 leaves the ledger untouched).

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 4 created files present on disk; 5 task commits present in history (9176a89f, 4aca0b80, f975f4c8, 550deeda, 485675ef); commits measured from the plan ledger = 5; no control byte in this file or the manifest.
