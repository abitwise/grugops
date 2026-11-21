---
phase: 37-overview-board-per-file-records-and-budgets
plan: 24
subsystem: testing
tags: [auth-1, read-1, wr-05, runnable-stamp, generate-runnable-embeds, state-check, install-readme, typescript]

requires:
  - phase: 37-23
    provides: the state checker's EMBED_SPECS row with sectionEndIndex, and the regenerated three regions
provides:
  - "WR-05 closed: every state runnable's generated region carries RUNNABLE_SET_STAMP (a sha256 the generator computes over all three generated bodies), RUNNABLE_SET and RUNNABLE_SELF"
  - "scripts/runnable-stamp.ts: the one owner of the stamp line's shape (formatRunnableStampLines for the generator, readRunnableStamp for state-check)"
  - "state-check reports runnable-version-skew for a sibling with a different, missing or repeated stamp, or a present sibling it could not read, under the marker's severity"
  - "install/README.md: the three state programs carry one build stamp and are removed and installed again together"
affects: [37-25, 37-26, 37-27, phase-38]

actuals:
  tokens: 22430
  tasks: 2
  commits: 2
plan_head_before: 8838c64c85f020c688bb378ab820bc6e001d59c4
plan_head_after: dffa92d0d50c3a4c3ba7b81ddacf9200540ed64c

tech-stack:
  added: []
  patterns:
    - "A copy that lives separately on a host carries a generated stamp of the authorities it was built from; the freshness gate re-derives the stamp with the region, so it is never hand-written"
    - "A stamp is computed over the whole spec set, so an edit embedded by one program moves the stamp of all three"

key-files:
  created:
    - scripts/runnable-stamp.ts
    - scripts/runnable-stamp.js
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/state-rules.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/state-check.test.ts
    - scripts/generate-runnable-embeds.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/README.md

key-decisions:
  - "The stamp is `sha256:` plus the hex sha256 of, per EMBED_SPECS row in order, the target path, NUL, the generated import lines and declarations joined by newlines, NUL. The stamp lines themselves are outside the hash, so there is no circularity"
  - "deriveRegion(spec, root, set = EMBED_SPECS) refuses a spec that is not a member of set (by identity); the three generated names are claimed before any authority, so an authority declaring one is refused by name"
  - "readRunnableStamp returns stamp / none / ambiguous with a count; the stamp it returns includes the `sha256:` prefix"
  - "An absent sibling is no finding (a host may run state-check alone); a refusal from the non-blocking reader is a finding naming its condition (unopenable, not-a-regular-file, above-ceiling)"
  - "The sibling's rel is its path under the repository root when state-check's own directory resolves inside the root (tools/grugops/state-roll.js), else its absolute path"

patterns-established:
  - "Mirror tests for a whole-set stamp: edit one authority declaration only one target embeds, derive all three regions over the mirror, assert every stamp moved and nothing else changed in the other two"

requirements-completed: [SPLIT-05]

coverage:
  - id: D1
    description: "Each of the three state runnables carries exactly one stamp line inside its region, the three stamps are equal and equal runnableSetStamp(EMBED_SPECS); each committed .js carries the same stamp, RUNNABLE_SET and its own RUNNABLE_SELF"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#each of the three targets holds exactly one stamp line inside its region, and the three stamps are equal"
        status: pass
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#each committed .js carries the same stamp, RUNNABLE_SET and its own RUNNABLE_SELF (read as text: a runnable runs on import)"
        status: pass
    human_judgment: false
  - id: D2
    description: "state-check with the three programs side by side: equal stamps exit 0 with no finding; a changed stamp digit is one FINDING naming trace-render.js and both stamps (exit 1, in --json findings); a removed stamp line says no build stamp; an absent sibling is no finding; without the marker it is a WARN at exit 0; inside the root the rel is tools/grugops/<name>"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — a sibling built from other authorities is runnable-version-skew (plan 37-24, D-17, WR-05)"
        status: pass
    human_judgment: false
  - id: D3
    description: "READ-1 for siblings: a mode-000 sibling is a finding naming unopenable, a FIFO is a finding naming not-a-regular-file in bounded time, a copy with two stamp lines says it carries 2 build stamps"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a sibling at mode 000 is runnable-version-skew naming `unopenable`, never a pass"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a FIFO at a sibling path is runnable-version-skew naming `not-a-regular-file`, in bounded time"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a sibling copy holding two stamp lines: the finding says it carries 2 build stamps"
        status: pass
    human_judgment: false
  - id: D4
    description: "The stamp is computed and whole-set: an edit inside boardBudgetFindings (embedded by state-check only) moves all three stamps on a mirror; a hand-edited stamp makes the freshness gate exit 1 naming that target; RUNNABLE_SET equals the installer's RUNNABLES destination names, two-sided, count 3"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#the build stamp moves with every authority and cannot be hand-written (plan 37-24, D-17, WR-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "install/README.md tools/grugops bullet: never-overwrite sentence kept; the three state programs carry one build stamp, are removed and installed again together, and state-check reports runnable-version-skew"
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js; node scripts/check-claim-anchors.js; node scripts/check-kit-refs.js; the 13 test files that name install/README.md (1530 passed, 1 skipped)"
        status: pass
    human_judgment: true
    rationale: "Whether the paragraph reads clearly to a host maintainer is a prose judgment; the gates prove only that it passes the banned-claim, anchor and kit-reference scans"

duration: 53min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 24: WR-05, a generated build stamp in every state runnable, and state-check names a sibling built from other authorities Summary

**Every state runnable's region now carries `RUNNABLE_SET_STAMP`, a sha256 the generator computes over all three programs' generated bodies, plus `RUNNABLE_SET` and `RUNNABLE_SELF`. state-check reads trace-render.js and state-roll.js beside it through the embedded non-blocking reader and the one stamp reader (`scripts/runnable-stamp.ts`), and reports a named `runnable-version-skew` finding under the marker's severity when a sibling was built from other authorities or cannot be read.**

## Performance

- **Duration:** 53 min (30 of them the mid-point full run)
- **Started:** 2026-10-23T14:41:56Z
- **Completed:** 2026-10-23T15:35:19Z
- **Tasks:** 2
- **Files modified:** 15 (2 created)

## Accomplishments

- `scripts/runnable-stamp.ts` (new, import-free): `RUNNABLE_STAMP_NAME`, `RUNNABLE_SET_NAME`, `RUNNABLE_SELF_NAME`, `RUNNABLE_STAMP_DECLARED_NAMES`, `RUNNABLE_STAMP_LINE` (built from `RUNNABLE_STAMP_NAME`, one capture for `sha256:<64 hex>`), `formatRunnableStampLines(stamp, set, self)` (refuses a malformed stamp, a repeated name, or a self outside the set, so the generator cannot write a line the reader refuses), type `RunnableStampRead` and `readRunnableStamp(text)`.
- `scripts/generate-runnable-embeds.ts`: `deriveBody(spec, root)` (the import lines and declarations), `runnableSetStamp(set, root)`, and `deriveRegion(spec, root, set = EMBED_SPECS)` writing EMBED_OPEN, imports, the three stamp lines, declarations, EMBED_CLOSE. The three generated names are claimed before any authority. A new THE BUILD STAMP header paragraph. The state checker's row gains `{ module: "scripts/runnable-stamp.ts", roots: ["readRunnableStamp"] }` with a dated plan 37-24 comment. `rewriteRunnable` passes EMBED_SPECS.
- `scripts/state-rules.ts`: IntegrityKey `"runnable-version-skew"` with a dated comment (type only; the .js is unchanged).
- `scripts/runnable-ref/state-check.ts`: `runnableSkewFindings()` runs in the main try after the trace report; its findings join the sorted list, so they take the marker's severity. A SIBLINGS header paragraph. Every note names the program; the stamp-mismatch note names both stamps and the remedy (remove the three programs and install them again together). state-check writes nothing and never replaces a sibling.
- The current stamp is `sha256:4f9ef10f423294e9367c9eb9bc11c072e09505f6b221144ed646bb9539466581` in all three regions and all three .js files.
- `npm run freshness:runnable-embeds` still takes about 0.3 s, so no closure cache was added.

## Task Commits

1. **Task 1: End-to-end WR-05, a computed stamp in every region, and state-check names a sibling built from other authorities (tracer)**: `0c3f51a4` (fix)
2. **Task 2: The stamp pins, the unreadable-sibling rows, the installer's names, and the README**: `dffa92d0` (test)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the `<verify>` block had only automated checks. Both blocks were run again after the commit and passed: `npm run -s freshness` (87 fresh), `freshness:runnable-embeds` (3 fresh), the own-tree state-check with `--json` (no runnable-version-skew, exit 0), and the two Task 1 test files (115 passed). The plan then continued to Task 2 with no checkpoint.

## Class table: AUTH-1, a copy that lives separately on a host (final)

| Site | Carries a generated copy of an authority | Materialized into a host repository | Covered by |
|------|-------------------------------------------|-------------------------------------|------------|
| scripts/runnable-ref/state-check.ts | yes | yes (tools/grugops/state-check.js) | 37-24 stamp; reads its siblings (D2, D3) |
| scripts/runnable-ref/trace-render.ts | yes | yes | 37-24 stamp (D1, D4) |
| scripts/runnable-ref/state-roll.ts | yes | yes | 37-24 stamp (D1, D4) |
| scripts/runnable-ref/reference-check.ts, test-skip-integrity.ts, uat-spec-integrity.ts, host-protection.ts | no generated region | yes | not in the class (no embedded authority to drift) |
| hooks/hook-entry.ts (generated region from scripts/generate-hook-manifest.ts) | yes | no: it runs from the kit, not copied into a host repository | not in the class |

The RUNNABLE_SET case (D4) holds the first three rows equal to the installer's RUNNABLES rows whose source is an EMBED_SPECS target's .js, two-sided, count 3.

## RED run

Against the committed runnables at `8838c64c`, before any edit: the three .js files were copied into one scratch directory beside a clean repository with the D-14 marker, and the copied trace-render.js was changed to a different build (its `TRACE_GENERATED_HEADER` value edited). `grep -c RUNNABLE_SET_STAMP` was 0 in all three. state-check printed `No findings.` and exited 0, and `--json` gave `"ok":true,"findings":[]`. Nothing could be compared, because no stamp existed. This reproduces 37-REVIEW WR-05.

Task 2's cases were written after Task 1's fix, so they passed when written. Their RED evidence is mutation D below. It runs every new state-check case against the pre-plan runnables, together with mutations A to C.

## Mutation proofs (working tree only; each made after the task commits, then reverted with `git checkout --`)

- **A: the stamp comparison never reports.** In state-check.ts, `read.stamp === RUNNABLE_SET_STAMP` became `read.stamp === read.stamp`, then rebuilt. 3 failed and 7 passed of the plan 37-24 state-check cases: the changed-digit case, the no-marker WARN case and the tools/grugops/ case.
- **B: a hand-edited stamp.** One hex digit of `RUNNABLE_SET_STAMP` in scripts/runnable-ref/state-roll.ts was changed on the tree (`4f9e...` to `5f9e...`). `node scripts/runnable-embeds-freshness.js` exited 1 with `Runnable-embeds freshness check FAILED: scripts/runnable-ref/state-roll.ts: ...`. After the revert it reported 3 targets fresh.
- **C: the stamp over the target's own body only** (`stampOver([spec], [own])` in deriveRegion), then rebuilt. 4 of the 23 generator cases failed: committed freshness, the two existing mirror cases, and the new stamp-moves-for-all-three case.
- **D: every new state-check case against the pre-plan runnables** (`git show 8838c64c:` of the three .js written into the tree): 8 failed and 2 passed. The mode-000 and FIFO cases failed with state-check exiting 0 and printing `MOVE-ONLY ...` (an unreadable sibling read as a pass). The other cases failed on their PREMISE that a stamp exists. The two that passed are the clean-repository and absent-sibling cases, which expect no finding.
- After the reverts, `git status --porcelain scripts/` was empty, `git status --porcelain scripts/runnable-ref/state-check.ts` was empty, `npm run -s freshness` reported 87 fresh and `freshness:runnable-embeds` reported 3 fresh.

## Mid-point full run and comparison with 37-BASELINE.md

`npx vitest run --exclude '**/scripts/e2e/**'` (one worker by config) ran from 2026-10-23T15:04:44Z to 15:34:48Z, 1,803 s. Test files: 6 failed, 121 passed (127). Tests: 20 failed, 9,212 passed, 2 skipped (9,234). The 20 failures are exactly the 20 cases of 37-BASELINE.md: installer-fs-census (1), canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 and the six 31-29 cases (7), harness-instance-ledger (4) and uat-gate-exit-contract (5). No failure is new, so no file from plans 37-20 to 37-23 needed a fix. `pgrep -fl vitest` was empty after the run.

Gates after the run, all exit 0: `npm run -s typecheck`, `npm run -s freshness`, `freshness:runnable-embeds`, `freshness:traceability`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-foundation-guards`, `check-state-paths`, `check-nul-bytes`, and `node scripts/runnable-ref/state-check.js .`.

## Files Created/Modified

- `scripts/runnable-stamp.ts` / `.js` (new): the stamp line's one owner
- `scripts/generate-runnable-embeds.ts` / `.js`: deriveBody, runnableSetStamp, the stamp in deriveRegion, the claimed names, the EMBED_SPECS root
- `scripts/state-rules.ts`: the IntegrityKey
- `scripts/runnable-ref/state-check.ts` / `.js`: runnableSkewFindings, the SIBLINGS header, the regenerated region
- `scripts/runnable-ref/trace-render.ts` / `.js`, `scripts/runnable-ref/state-roll.ts` / `.js`: regenerated regions with the stamp lines
- `scripts/generate-runnable-embeds.test.ts`: synthetic cases pass `[spec]` and expect the three stamp lines; the not-a-member and claimed-name cases; the committed-stamp, mirror and RUNNABLE_SET cases; GATE_SCRIPTS held equal to the gate's relative import closure
- `scripts/runnable-ref/state-check.test.ts`: the ten sibling cases
- `scripts/check-foundation-guards.test.ts`: LANG-07 module-count pins re-derived (deviation 1)
- `install/README.md`: the paragraph in the tools/grugops/ bullet

## Decisions Made

- The stamp hashes the body without the stamp lines and with each target path, so the stamp line never feeds its own hash and a renamed target moves it.
- Remedy text is given for stamp mismatch, missing stamp and ambiguous stamps. The unreadable note names the condition and states that the build could not be compared, as the plan words it.
- I did not add a closure cache. The freshness gate stays at about 0.3 s, far under the plan's 30 s trigger.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] LANG-07 module-count pins for the new module**
- **Found during:** Task 1 verify
- **Issue:** scripts/check-foundation-guards.test.ts pins the non-test module corpus (109), the `scripts/`-scoped corpus (70, two sites) and the comparison count (70 * 3). Adding scripts/runnable-stamp.ts made 7 cases red.
- **Fix:** the counts were re-derived, not incremented: `git ls-files '*.ts'` minus tests and `.d.ts` gives 110, and `ls scripts/*.ts` minus tests gives 71. Each pin gained a dated plan 37-24 reason line. No predicate was changed.
- **Files modified:** scripts/check-foundation-guards.test.ts (outside the plan's files list)
- **Verification:** the file passes 320/320; `node scripts/check-foundation-guards.js` exits 0
- **Committed in:** 0c3f51a4

**2. [Rule 3 - Blocking] The freshness-gate mirror lacked the generator's new import**
- **Found during:** Task 1
- **Issue:** the existing mirror case copied three scripts, and the generator now imports `./runnable-stamp.js`
- **Fix:** a `GATE_SCRIPTS` list that a PREMISE assertion holds equal to the gate's relative import closure, read from the compiled .js, so the next new import fails loudly
- **Files modified:** scripts/generate-runnable-embeds.test.ts
- **Committed in:** 0c3f51a4

---

**Total deviations:** 2 auto-fixed (Rule 3). **Impact on plan:** none on scope. The first is the known module-count-pin lesson from plans 37-20 to 37-23.

## Issues Encountered

- `npm run generate:runnable-embeds` could not run while state-check.ts called names not yet embedded. As in plan 37-23, I emitted with `npx tsc --noEmitOnError false`, ran the generator, then ran `npm run build`.

## For the human

**A costly assumption to raise before the release that ships it (planner assumption, not a CONTEXT.md decision).** The stamp line shape becomes a cross-version contract between the host copies of the three state programs:

```
export const RUNNABLE_SET_STAMP = "sha256:<64 lowercase hex>";
export const RUNNABLE_SET = Object.freeze([...] as const);
export const RUNNABLE_SELF = "<file name>";
```

From the release that ships it, state-check reads this line in sibling programs that may come from other kit versions, so a later change to the shape must keep reading this one. One module (`scripts/runnable-stamp.ts`) owns the shape, so such a change is one edit. Also: the stamp is a version marker between programs, not a security boundary (T-37-54, accepted). Anyone who can edit tools/grugops/ can edit it.

## User Setup Required

None.

## Next Phase Readiness

- WR-05 is closed. Plans 37-25 and 37-26 follow, and 37-27 is the round gate with the second full run.
- Phase 38 hosts are the first to meet the skew finding. Programs installed before this release carry no stamp, so on a host where state-check is updated alone, the finding says "carries no build stamp", as intended.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*

## Self-Check: PASSED

- Created files exist: scripts/runnable-stamp.ts, scripts/runnable-stamp.js
- Task commits are ancestors of HEAD: 0c3f51a4, dffa92d0
- Acceptance criteria re-run: the behavior cases pass; one stamp line per region with three equal stamps (a test asserts it); `npm run -s freshness:runnable-embeds` exits 0; the own-tree state-check exits 0; install/README.md contains `runnable-version-skew` once, and the never-overwrite sentence is still there; both required mutation proofs are recorded; `git status --porcelain scripts/runnable-ref/state-check.ts` is empty; the full run shows no failure outside the 20 baseline cases
