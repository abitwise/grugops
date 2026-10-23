---
phase: 37-overview-board-per-file-records-and-budgets
plan: 23
subsystem: testing
tags: [auth-1, wr-02, state-rules, state-check, state-roll, frontmatter, generate-runnable-embeds, typescript]

requires:
  - phase: 37-22
    provides: the generator and the D-16 admission rule for generated copies inside fresh EMBED_SPECS regions
provides:
  - "WR-02 closed: progressEntries(text, sectionEnd) is the one fence-aware answer to 'which progress headings are dated entries', for state-check's ROLLABLE report and for state-roll's planner"
  - "state-check's generated region carries scripts/frontmatter.ts sectionEndIndex (EMBED_SPECS), admitted by the D-16 rule with no census edit"
  - "planProgressRoll's two refusals that only a second classifier could reach are removed"
  - "PROGRESS_CORPUS agreement table (10 rows, count asserted) and the one-classifier syntax-tree census"
affects: [37-24, 37-27]

actuals:
  tokens: 10944
  tasks: 2
  commits: 2
plan_head_before: 2312990ff11a8ed06b3cfe6697f74badb4189011
plan_head_after: 1788c7618ec967c1e52e5f052cff68edf88d1846

tech-stack:
  added: []
  patterns:
    - "A classifier asks the section-extent owner which lines are headings (sectionEnd(text, i, 2) === i) instead of keeping its own heading or fence test"
    - "An agreement table carries a hand-authored expected column, so three answers that agree on a wrong value still fail"

key-files:
  created:
    - scripts/runnable-ref/progress-agreement.test.ts
  modified:
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/state-rules.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/state-roll.test.ts

key-decisions:
  - "progressEntries classifies line i as a `##` section heading only when SECTION_HEADING matches and sectionEnd(text, i, 2) === i; a fenced line, a line in an HTML block and a bare `##` are no heading (the owner needs a space after the hashes)"
  - "planProgressRoll's fenced-dated-heading refusal and inner-heading ambiguity refusal are removed: with one classifier every classified heading starts a level-2 section, so none can sit inside another entry's extent. The agreement table shows no corpus row reaches a refusal; run against the pre-plan runnables, both refusals were reachable (rows 1-4, 9, 10 and the bare `##` row)"
  - "A third state-rules case also encoded the second answer (a bare `##` was standing) and was rewritten, not deleted"

patterns-established:
  - "One classifier census: the heading regular expressions are read only inside progressEntries, no other heading-shaped regular expression exists in the module, and planProgressRoll passes its own sectionEnd"

requirements-completed: [SPLIT-06]

coverage:
  - id: D1
    description: "WR-02 end to end: an over-budget progress file whose only dated heading is fenced, beside `## Standing directive`: state-check (marker on) prints no ROLLABLE progress line and its progressBytes note names `## Standing directive` and memory-bank/50-decisions/; state-roll exits 0 with `Nothing can roll`. With a real dated entry above the fence: ROLLABLE, and state-roll --dry-run plans that entry with the fence inside its line span"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#WR-02: a dated heading inside a fenced block is no entry: not ROLLABLE, and the D-09 note names `## Standing directive` and the decisions folder (plan 37-23)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#WR-02: the same file with a real dated entry above the fence is ROLLABLE (plan 37-23)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#WR-02: a dated heading inside a fenced block is no entry: the file is unchanged, exit 0, `Nothing can roll` (plan 37-23)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#WR-02: with a real dated entry above the fence, --dry-run plans that entry, the fence inside its line span (plan 37-23)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fence-aware classifier: progressEntries asks the owner at every `##` line and classifies only where it starts a section; a fenced `## Not a heading` moves as content of its entry; a fenced dated heading opens no entry"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#WR-02: a `##` line inside a fenced block is no heading, dated or not; the owner decides, so an unterminated fence hides the rest (plan 37-23)"
        status: pass
      - kind: unit
        ref: "scripts/state-rules.test.ts#a `##` heading inside a fenced block within a moved entry is no heading: it moves as content of its entry (plan 37-23, WR-02)"
        status: pass
      - kind: unit
        ref: "scripts/state-rules.test.ts#a dated heading inside a fenced block opens no entry: the roll moves the real entry and leaves the fence; with the fence alone there is nothing to roll (plan 37-23, WR-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Agreement table over PROGRESS_CORPUS (10 rows, count asserted): per row the classifier, state-check's ROLLABLE line and state-roll --dry-run's PLAN line equal a hand-pinned answer, state-roll exits 0, and every planned entry is one the classifier dated"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/progress-agreement.test.ts#the table ran all 10 rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "One-classifier census: SECTION_HEADING and DATED_HEADING are read only inside progressEntries; the module's only heading-shaped regular expressions are those two; progressEntries calls its sectionEnd parameter and planProgressRoll passes its own sectionEnd"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#one classifier: only progressEntries decides which progress lines are dated entries (plan 37-23, D-17, WR-02, AUTH-1)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Generator and gates: sectionEndIndex embedded in state-check's region (`// from scripts/frontmatter.ts`), census untouched; build, typecheck, freshness, runnable-embeds, traceability, foundation guards, state paths, NUL bytes and own-tree state-check all exit 0"
    verification:
      - kind: other
        ref: "npm run build; npm run typecheck; npm run -s freshness; npm run -s freshness:runnable-embeds; npm run -s freshness:traceability; node scripts/check-foundation-guards.js; node scripts/check-state-paths.js; node scripts/check-nul-bytes.js; node scripts/runnable-ref/state-check.js ."
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 23: WR-02, one fence-aware answer to which progress headings are dated entries Summary

**progressEntries now takes the section-extent owner and classifies a `##` line only where `sectionEnd(text, i, 2) === i`. state-check passes a generated copy of sectionEndIndex and state-roll passes its own copy, so a fenced example heading is no entry for either. The daily sweep can no longer be told ROLLABLE for a file that state-roll then refuses.**

## Performance

- **Duration:** 24 min (most of it the 13-minute regression subset)
- **Started:** 2026-10-23T14:14:23Z
- **Completed:** 2026-10-23T14:38:50Z
- **Tasks:** 2
- **Files modified:** 12 (1 created)

## Accomplishments

- `scripts/state-rules.ts`: `progressEntries(text, sectionEnd: SectionEndFn)`. Its docstring now says it asks the one section-extent owner which lines are headings. A fenced line, a line in an HTML block and a bare `##` are no heading. It still does not answer where an entry ends. `planProgressRoll` calls `progressEntries(texts.blanked, sectionEnd)`. The `headingAt` map and the two refusals in `blockOf` that only a second classifier could reach are removed. The module's "WHAT IS REFUSED" list is updated, and a new "WHICH HEADINGS ARE ENTRIES" paragraph explains why the refusals cannot fire. Every other refusal is kept.
- `EMBED_SPECS`: the state-check row gains `{ module: "scripts/frontmatter.ts", roots: ["sectionEndIndex"] }`, with a dated plan 37-23 paragraph in the comment. The state-check region now has a `// from scripts/frontmatter.ts` block. No name in that closure clashed with the region. State-roll's region follows the progressEntries and planProgressRoll change.
- `scripts/runnable-ref/state-check.ts`: `progressReport` passes the generated `sectionEndIndex`. The header paragraph on the ROLLABLE report and progressReport's docstring now say so.
- The LANG-07 census (`scripts/check-foundation-guards.test.ts`) is unchanged and passes. `git diff --quiet HEAD -- scripts/check-foundation-guards.test.ts` exits 0. The copy is admitted by the D-16 rule.

## Task Commits

1. **Task 1: End-to-end WR-02, a fenced dated heading is not an entry for state-check or for state-roll (tracer)**: `c194d52a` (fix)
2. **Task 2: The agreement table over the progress corpus, and the one-classifier census**: `1788c761` (test)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the `<verify>` block has only automated checks. Both blocks were run and passed. The first block was build, typecheck, runnable-embeds and 5 test files (612 passed). The second was freshness, foundation guards, state paths and own-tree state-check, all exit 0. The plan then continued to Task 2 with no checkpoint.

## Class table: AUTH-1, "which progress headings are dated entries" (final)

| Site | Answer before | Answer after | Covered by |
|------|---------------|--------------|------------|
| scripts/state-rules.ts progressEntries | fence-blind; a bare `##` was standing | asks sectionEnd at every `##` line; the one answer | Task 1 cases, D2 unit cases, the table, the census |
| scripts/state-rules.ts planProgressRoll blockOf: the fenced-dated-heading refusal and the inner-heading ambiguity refusal | a second, fence-aware answer | removed; unreachable with one classifier (the table: no row refuses; the pre-plan runnables refused rows 1-4, 9 and 10, and the bare `##` row) | Task 1, the table, mutation C |
| scripts/state-rules.ts planProgressAppend: does a moved heading still open an entry in the archive | asks sectionEnd, the same owner | unchanged. Its heading-text duplicate refusal is WR-06, out of round 1 scope, see 37-REVIEW-DISPOSITION.md | unchanged cases |
| scripts/state-rules.ts rollableSurfaces and progressBytesFinding | read progressEntries' result | follow the owner | the state-check WR-02 cases, the table |
| generated copies in scripts/runnable-ref/state-check.ts and scripts/runnable-ref/state-roll.ts | followed state-rules.ts; state-check had no extent owner | regenerated; state-check now embeds sectionEndIndex | `npm run freshness:runnable-embeds` |
| agent-factory/workflows/09-daily-sweep.md:23 | prose, no classification | unchanged; consistent with D-09 | none needed |
| scripts/validate-agent-factory.ts | measures the progress file by size only | not in the class | none needed |

## RED runs

**Task 1**, with the new cases run against the unchanged committed runnables at `2312990f` (`npx vitest run ... -t WR-02`): 3 failed, 1 passed.
- state-check, fenced-only file with the marker: it printed `ROLLABLE  progress: 16,385 bytes, keeps 16,384 bytes (BUDGETS.progressBytes) — run node tools/grugops/state-roll.js <root>`. The assertion that expected no progress ROLLABLE line failed.
- state-roll, the same file: exit 2 with `Error: memory-bank/60-progress.md: the entry \`## 2020-01-01 example entry\` (line 4) sits inside a fenced block, so it opens no entry; move it out of the fence by hand. Nothing was rolled.` (expected 0).
- state-roll --dry-run, real entry above the fence: exit 2, the same refusal at line 7. The oldest "dated" heading was the fenced 2020-01-01 one.
- state-check, real entry above the fence: passed, because ROLLABLE was already printed. This case is the control.

This reproduces 37-REVIEW WR-02: state-check prints ROLLABLE, and state-roll exits 2 with `sits inside a fenced block`.

**Task 2.** The table and the census were written after Task 1's fix, so against `c194d52a` they passed (11/11 and 3/3). Their RED evidence is mutation C below, which runs the table against the pre-plan runnables, together with mutations A and B.

## Rewritten state-rules cases (none deleted; case count 127 -> 132)

| Case | Old expectation | New expectation |
|---|---|---|
| `a \`##\` heading inside a fenced block within a moved entry is refused as ambiguous, never moved as part of it` -> `... is no heading: it moves as content of its entry (plan 37-23, WR-02)` | `planProgressRoll` refuses, reason contains `` `## Not a heading` on line 4 `` | progressEntries classifies lines 1 and 9 only (line 4 is nothing); the plan rolls; the 2026-09-01 block's lines equal the fenced entry verbatim and contain `## Not a heading` |
| `a dated heading inside a fenced block is refused: it opens no entry` -> `a dated heading inside a fenced block opens no entry: the roll moves the real entry and leaves the fence; with the fence alone there is nothing to roll (plan 37-23, WR-02)` | refuse, reason contains `inside a fenced block` | roll with `dated` 1, the one block is `2026-10-02 — new`, every moved line is after line 4, 17,000 bytes move; with the fence beside `## Standing directive` alone: `{ kind: "none", dated: 0, standing: ["Standing directive"] }` |
| `a \`###\` or deeper heading is neither dated nor standing, and a bare \`##\` is standing` -> `... and neither is a bare \`##\`: the section-extent owner reads no heading there (plan 37-23)` | standing `[{ heading: "", line: 4 }]` | standing `[]` (deviation 1) |

Every other `progressEntries` call in the tests now passes `sectionEndIndex`. New cases: the fence and unterminated-fence classification case, a PREMISE case that the classifier asks the passed function at every `##` line and classifies only where it starts a section, and the three census cases.

## Mutation proofs (working tree only; each committed first, then reverted with `git checkout --`)

- **A: classify every SECTION_HEADING line** (drop `|| sectionEnd(text, n, 2) !== n`). Only `state-rules.js` was rebuilt, so the committed runnables kept the fix. 10 failed / 160 passed. The table's three fenced-only rows (backtick, tilde, CRLF) failed with `expected { unit: true, rollable: false, ... } to deeply equal { unit: false, rollable: false, ... }`, and so did the row-count case. The census case `progressEntries asks its section-extent parameter ...` failed, as did the 5 classifier and roll unit cases.
- **B: the same mutation regenerated into both runnables' regions** (`node scripts/generate-runnable-embeds.js`, `npx tsc --noEmitOnError false`). Then the three answers agree with each other but not with the hand-pinned column. 9 failed: table rows 1-4 and 9, the row count, and the four Task 1 runnable cases. state-roll --dry-run planned `PLAN    progress  \`## 2020-01-01 example entry\`  lines 4-6`, which moves a fenced heading and the fence's closing line as an entry. So without the census and the table, a fence-blind classifier would now tear a fence instead of refusing. That is why the census case pins one classifier.
- **C: the table against the pre-plan code** (`git show 2312990f:` of state-rules.js, state-check.js and state-roll.js written into the tree): 8 failed. These were rows 1-4, 9 and 10 (state-roll exit 2 `sits inside a fenced block`, and state-check ROLLABLE on the fenced-only rows), the bare `##` row (the old inner-heading ambiguity refusal fired) and the row count.
- After the revert: `git status --porcelain scripts/state-rules.ts` was empty, `npm run build` passed, `npm run -s freshness:runnable-embeds` reported 3 targets fresh, and `npm run -s freshness` reported 86 files fresh.

## Regression comparison

The derived subset (the plan's `git grep -l` list, 63 files, with the new test file staged so the tree-counting guards saw it): `npx vitest run --exclude '**/scripts/e2e/**' $F` gave 60 passed and 3 failed files, 5,935 passed, 10 failed and 2 skipped tests, in 787 s. All 10 failures are 37-BASELINE.md members: canonical-corpus `provenance: every cited source artifact resolves on disk` (1), context-io-writer-set `31-14 ...` (2) and context-io `31-23 PROBE 5 ...` plus the six `31-29 ...` cases (7). No new failure. The gates all exited 0: `npm run -s freshness` (86 fresh), `freshness:runnable-embeds` (3 fresh), `freshness:traceability`, `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js` and `node scripts/check-nul-bytes.js`. `pgrep -fl vitest` was empty after each run.

## Files Created/Modified

- `scripts/state-rules.ts` / `.js`: the fence-aware progressEntries, planProgressRoll passing the owner, the two refusals and `headingAt` removed, comments updated
- `scripts/generate-runnable-embeds.ts` / `.js`: sectionEndIndex root on the state-check row and its dated comment
- `scripts/runnable-ref/state-check.ts` / `.js`: the generated sectionEndIndex block, progressReport passes it, and the header and docstring updated
- `scripts/runnable-ref/state-roll.ts` / `.js`: regenerated region
- `scripts/runnable-ref/progress-agreement.test.ts` (new): PROGRESS_CORPUS and the agreement table
- `scripts/state-rules.test.ts`: three rewritten cases, `sectionEndIndex` passed to every progressEntries call, the classification, PREMISE and census cases
- `scripts/runnable-ref/state-check.test.ts`, `scripts/runnable-ref/state-roll.test.ts`: the WR-02 runnable cases
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md`: one new open entry (see Threat Flags)

## Decisions Made

- I kept the plan's shape: one owner call per `##` line, `sectionEnd(text, n, 2) !== n` then skip. Walking from heading to heading would cost the same, since each owner call scans the whole text.
- The agreement table pins a hand-authored `dated` per row and also asserts that every heading state-roll plans is one the classifier dated. Mutation B shows why: three answers that agree on a fence-blind result still fail.
- The table runs state-check with the D-14 marker, so every row is exit 1 with one finding and never exit 2. state-roll must exit 0 on every row, not only on ROLLABLE rows, because no corpus row is a refusal shape.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A third state-rules case encoded the second answer**
- **Found during:** Task 1, step 5
- **Issue:** `a \`###\` or deeper heading is neither dated nor standing, and a bare \`##\` is standing` expected a bare `##` to be standing content. The plan's step 2 says a bare `##` is neither, because the owner's heading needs a space after its hashes. So this case went red with the fix.
- **Fix:** rewritten (not deleted) to expect `standing: []`, and listed in the rewritten-cases table above
- **Files modified:** scripts/state-rules.test.ts
- **Verification:** the state-rules suite passes; mutation A turns it red
- **Committed in:** c194d52a

**2. [Process] The mutated build needed `npx tsc --noEmitOnError false`**
- **Found during:** Task 2, mutation B
- **Issue:** with the owner test removed, the `sectionEnd` parameter is unused, and `npm run build` refuses it (TS6133)
- **Fix:** emitted the mutated build with `--noEmitOnError false` for the proof only; reverted afterwards and rebuilt clean
- **Committed in:** not committed (proof only)

---

**Total deviations:** 2 (1 Rule 1 test rewrite, 1 proof-procedure note). **Impact on plan:** none on scope. The rewritten case is the same class the plan named.

## Issues Encountered

- The regression subset takes about 13 minutes on one worker, more than the 10-minute foreground limit. It was run in the background and its output kept in the scratchpad.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: dos | scripts/state-rules.ts (progressEntries, through the embedded copy in scripts/runnable-ref/state-check.ts) | state-check now asks sectionEndIndex once per `##` line, and the owner rescans the whole file on each call, so the cost grows with `##` lines x lines. Measured on the committed .js: 1,000 headings 56 ms, 4,000 in 0.9 s, 16,000 (395 KiB) in 14 s. Only a progress file over 16,384 bytes is read (ceiling 16 MiB). state-roll already had this shape. Logged open in deferred-items.md for human triage; the linear fix belongs to the LANG-07 owner or the SectionEndFn contract, outside this plan. |

## User Setup Required

None.

## Next Phase Readiness

- WR-02 is closed for both runnables. Plan 37-24 runs the mid-round full non-e2e suite, and 37-27 is the round gate.
- One new open deferred item: the quadratic classifier cost above.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
