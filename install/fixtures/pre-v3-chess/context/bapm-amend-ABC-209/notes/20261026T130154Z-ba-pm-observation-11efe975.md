---
id: 20261026T130154Z-ba-pm-observation-11efe975
kind: observation
by: ba-pm
at: 2026-10-26T13:01:54Z
verified_by: 
confidence: high on the re-reads at 82f799ce; the two readings are named choices, each keeping the bar
refs:
  - ABC-209
  - EPIC-008
  - ADR-0025
  - ADR-0032
  - NFR-009
  - A2
  - A3
  - A4
  - A6
  - plans/tickets/ABC-209-the-transposition-table-is-kept-across-the-moves-of-one-game.md
  - orch-2026-10-26u/20261026T125807Z-orchestrator-decision-388d6d51
  - arch-design-ABC-209/20261026T125648Z-architect-design-decision-2e73dcd9
  - arch-design-ABC-209/20261026T125648Z-architect-design-observation-b7d4b710
  - orch-2026-10-26t/20261026T123731Z-orchestrator-decision-e496fc70
  - bapm-ready-ABC-209/20261026T123609Z-ba-pm-decision-955d0031
  - bapm-amend-ABC-208/20261026T023835Z-ba-pm-decision-e8505f19
  - grugops/bapm-amend-ABC-209
  - 82f799ce
  - ABC-208
  - ABC-215
supersedes: 
seal: sha256:cf3825eb47c24dbd3f43f073cba2cc3f6bf676f44107aadb37545c518e9a0b1a
---

# BA/PM: ABC-209 amend hop. Two named readings that keep the bar, the cite re-reads at 82f799ce, and flags

Task `bapm-amend-ABC-209`, records only, at `main` `82f799ce`.

## Re-reads at `82f799ce`
- `git diff d0b1fff8 82f799ce -- src` is empty, so the design's cites hold as probed.
- `src/engine.ts:550` reads `clearTable();`. `src/search.ts:605` reads `if (switches.table) clearTable();`.
- `src/command-input.ts:123` reads `{ token: "new", outcome: "take-back" },`.
- `clearTable` is exported at `src/transposition.ts:78`.
- `ADR-0025` § Proposed amendment 2026-10-26 is present, with Status PROPOSED and reading (b).

## Reading 1: `A4`, "move 1 and move 40 of one game" read as "search 1 and search 40 through one token"
- **Chosen:** the engine's move is one engine search. 40 searches through one token is one game's 40 engine moves.
  The graded bar is `heapUsed` ≤ 1 MiB, as written.
- **`arrayBuffers`:** the design reads it at the same two points. It is placed as a reading, with over 1 MiB the same
  `NFR-009` STOP (§ NFR triggers: "a growth over 1 MiB is a STOP"). It is not added as a new graded bar.
- **Alternative rejected:** grading `arrayBuffers` as a second `A4` bar. That would add a criterion, which this hop
  may not do.
- The earlier dated line (`bapm-ready-ABC-209`: QE fixes the 40-move game and its budget) still holds.

## Reading 2: `A3`, the Given is one instrumented pair chosen by QE
- **Chosen:** "Given two consecutive moves of one game" is the fixture of one instrumented test ("instrumented in a
  test only"). QE picks a pair whose reply is the stored hash move. The bar stays ≥ 1 entry.
- **Why it matters:** in the probe the root was stored 19 times of 21. A pair whose reply was not searched can read 0
  at the first probe, so a universal reading over every pair would fail by construction. The page never read it
  that way. This line pins the fixture; it does not lower the bar.
- **Alternative rejected:** "every consecutive pair". It is not what the criterion says, and the design does not
  promise it.

## Scope 1 on `undo`
- The amendment's table also clears at the CLI's `undo`. That follows from the strict-prefix rule and is not a new
  game path, so `A2` is not widened to it. `A2` checks `new`, the process start, `ucinewgame` and a non-continuing
  `position`.

## Flags (for the Orchestrator)
- LOW: the frontmatter `status: ready` / `column: Ready` is stale against the board (In Design). Left as it was, per
  the precedent. Sync it at the move if you want.
- Page length: 285 lines, under the 300-line budget.
- `plans/traceability.md` holds 1 586 lines on `main`, so the history flagged in `bapm-amend-ABC-208` is restored.
