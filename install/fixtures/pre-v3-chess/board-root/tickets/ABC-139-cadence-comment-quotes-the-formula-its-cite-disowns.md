---
id: ABC-139
title: A `command-input` test comment quotes `1 + one per non-advancing outcome`, the cadence formula its own cite calls wrong
status: done
column: Done
size: XS
priority: P3
epic: —
feature: —
---

# ABC-139 — make `ABC-035` `A3`'s comment state the render cadence that its cite states

> **Cut 2026-10-10 by BA/PM** (task `wave-2026-09-25`, subtask `bapm-abc010-qe129a-2026-10-10`) at
> wave tip `b98fb419`. The source is QE's `QE-129-a` (LOW), in
> `.grugops/context/qe-ABC-129/notes/…83afd95b`. Reasoning:
> `.grugops/context/bapm-abc010-qe129a-2026-10-10/notes/`.

## Problem

*User*: the next maintainer who reads `src/command-input.test.ts`'s `ABC-035` `A3` row, most likely
because `run.renders` went red.

*Pain*: the comment at `:412` gives the expected count as `` `1 + one per non-advancing outcome` ``.
It cites `runTurnLoop`'s docblock, "The render cadence" (`src/turn-loop.ts:279`). That paragraph reads
`` `1 + plies + take-backs + RE-EMITTING non-mutating outcomes` ``. It says the "count-every-outcome
form of this sentence is satisfied by a build that emits a frame on EOF" (`:284-286`), and the test
quotes exactly that form.

Under the docblock's own definitions the quoted formula contradicts the assertion next to it.
`runLines` answers `{ kind: "eof" }` after the three `board` lines (`:369`), and `eof` is one of the
seven non-advancing outcomes (`src/turn-loop.ts:105-106`). So the comment predicts 1 + 4 = **5**,
but the assertion is `toBe(4)`. A build that wrongly emits a frame on EOF reds the row with
"expected 5 to be 4". The comment then reads as if 5 were the contract. *(QE's register says "both
formulas give 4"; that holds only if `eof` is not counted.)*

*Value*: the narration agrees with its cite and its assertion. This is the same standard `ABC-129`
applied to the cite token ("each cite lands on what it names"). That ticket fenced out wording.

## Scope

One comment in `src/command-input.test.ts`, the `// …` block directly above
`expect(run.renders).toBe(4);` in "renders exactly once per prompt cycle, plus the loop's own first
frame". It states the cadence in the docblock's form, and it may give this input's arithmetic (1
initial frame + 3 re-emitting `board` outcomes; `eof` re-emits nothing). The spelling is the
Engineer's.

## Out of scope

- **Any executable line,** including the assertion's `4`.
- **Every other comment and file.** `:533`'s "four non-advancing outcomes" and `src/line-input.ts:89`'s
  "`ABC-019`'s four non-advancing outcomes" (production, a historical attribution) were not examined
  for this page. They are not part of the gap.
- **`src/turn-loop.ts`.** The docblock is right.

## Acceptance (Given/When/Then)

- **`A1` (the disowned form is gone).** **Given** the delivered tree, **when**
  `grep -cF '1 + one per non-advancing outcome' src/command-input.test.ts` runs, **then** it prints
  **0** (**1** at `b98fb419`).
- **`A2` (the comment states the cited form).** **Then** the comment block above
  `expect(run.renders).toBe(4);` contains `RE-EMITTING` (case-sensitive, as the docblock writes it),
  and it keeps the cite `runTurnLoop`'s docblock, "The render cadence". **And** if it gives
  arithmetic for this input, that arithmetic totals 4 and counts `eof` as emitting no frame.
- **`A3` (comment-only, one path).** **Then**
  `git diff --name-only <base>..<delivered> -- src` lists exactly `src/command-input.test.ts`.
  Every changed line in that file is a comment line by the TS AST comment ranges, and the
  comment-stripped TS print is identical at base and tip (owner Q4's conjunction; QE-129-b says
  never to use one measure alone).
- **`A4` (gates).** **Then** lint, typecheck, build and `npm test` exit 0 with the base's test count
  (**1,608** at `b98fb419`) and a skip count of 0.

## Dependencies

- **None open. Pullable now.** No open ticket edits `src/command-input.test.ts` (checked at
  `b98fb419`: every ticket page that names it is `done` or `dropped`).
- **UAT is waived:** 0 production lines, by the 2026-08-17 rule. **QE still hops** (`AGENTS.md`
  § QE validation authority).

## Security / NFR triggers

None. The ticket changes no executable line, no runtime path and no test count. `N8-LANE` is 0 ms
(no new test file).

## Test notes

1. Re-read `src/turn-loop.ts`'s "The render cadence" paragraph at the build's base before writing
   the comment. If the formula has moved, quote the base's text.
2. No new test is needed. `A1`–`A3` are the evidence, and the row's assertion is unchanged.

## Size and priority rationale

**`XS` (1):** one comment block in one test file, with no executable line. It calibrates with
`ABC-129` (`XS`, comment-only).

**`P3`:** no behaviour is wrong, and the assertion already reds the build the comment describes. The
cost is a misleading comment at the moment someone reads it in anger. **Not declined:** the comment
contradicts both its cite and its assertion, and no other ticket opens this file to fold it into.

## Definition of Ready

### DoR scored 2026-10-10 by BA/PM at cut — 10 of 10

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** quoted text, cite and assertion all at `b98fb419` |
| 2 | scope and out-of-scope clear | **✅** one comment block; neighbours fenced out |
| 3 | INVEST-shaped | **✅** independent, one file |
| 4 | acceptance testable and measurable | **✅** two greps, a path list, Q4's conjunction and the gate counts |
| 5 | dependencies known | **✅** none open |
| 6 | security/NFR triggers | **✅** none, stated |
| 7 | test notes present | **✅** two |
| 8 | size assigned | **✅** `XS` |
| 9 | priority assigned | **✅** `P3` |
| 10 | no major unresolved blocker | **✅** none |

## Delivery

**2026-10-10, Software Engineer** (task `wave-2026-09-25`, subtask `ticket-to-pr-ABC-139`).
- Branch `grugops/ABC-139-cadence-comment`, from `e7641dea`. The code is `0d22d9d6`
  (`src/command-input.test.ts` +5/−3, comment lines only).
- Not merged, not pushed.
- The decision and readings are in `.grugops/context/ticket-to-pr-ABC-139/` (`…5b2e91c4`, `…8d4a07e3`,
  `probe/`) and are not restated here.

**`A1`–`A4` are met. No stop condition fired.**
- The premise held at `e7641dea`: grep count 1, and `src/turn-loop.ts:279` was unchanged since `b98fb419`.
- The comment now quotes the docblock's `RE-EMITTING` formula and gives 1 + 0 + 0 + 3 = 4, with `eof` re-emitting
  nothing.
- Q4 holds on both measures, on QE's committed `exit132.mjs` (it ran; it was not refused) and on an SE AST-comment-range harness.
  The gate is green: 52 files, 1,608 tests, skip 0.
- **For QE:** `exit132.mjs`'s `POS-comment-only` control fails on this file, which has no block header. That control
  does not apply here (`…8d4a07e3`).

## QE 2026-10-10 (QE/E2E, `qe-ABC-139`, Workflow 04 review exit): PASS

Reviewed `e7641dea..daa5184a` (code `0d22d9d6`) in QE's own worktree. The readings and gaps are in
`.grugops/context/qe-ABC-139/` (`…a1b2e159` verdict, `…5460fd41` readings, `…01750927` gaps, `probe/`) and are
not restated here.

**`A1`–`A4` are MET. No test was added and no QE edit was made, because no sentence in the block is wrong.**

- **`A1`**: the grep count is 1 at `b98fb419` and `e7641dea`, and 0 at `0d22d9d6` and `daa5184a`.
- **`A2`**: the block `:412–416` sits directly above `:417`. It has `RE-EMITTING` ×1, the formula verbatim from
  `src/turn-loop.ts:279`, and the cite kept. Its arithmetic is 1 + 0 + 0 + 3 = 4, with `eof` re-emitting nothing.
- **`A3`**: one path, +5/−3. On QE's own harness, measure (a) (two-sided AST) finds 0 changed lines that are not
  comment-only, and (b) the stripped print is IDENTICAL, so Q4 HOLDS. All three POS controls fitted to this file
  hold, and every NEG fails. The SE's harness and `exit132.mjs` re-ran (they were not refused) and agree.
- **`A4`**: lint, typecheck and build exit 0. `npm test` runs 52 files with 1,608 passed and skip count 0.
  Integrity and lane-inventory report `No findings.`
- **The wording against the code**: a transient mutant where EOF emits a frame reds the row with "expected 5 to be 4".
  A mutant where `board` redraws for itself reds it with "expected 7 to be 4", which is three in all. "= 4", the
  `eof` clause and "one more frame per `board`, three in all" are each right.
- **Gaps, all INFO:**
  - `QE-139-a`: the docblock's "carry a message" gloss is looser than its by-kind code (BA/PM).
  - `QE-139-b`: the in-block reword is accepted.
  - `QE-139-c`: each Q4 measure is blind to one control on this file, so keep the AND (Orchestrator).
- UAT is waived (0 production lines, measured). The board move belongs to the Orchestrator. Not merged, not pushed.
