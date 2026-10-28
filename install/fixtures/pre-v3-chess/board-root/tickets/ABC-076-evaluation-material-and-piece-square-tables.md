---
id: ABC-076
title: Evaluation — material and piece-square tables (the scoring floor)
status: done
column: Done
size: M
priority: P0
epic: EPIC-004
feature: —
---

# ABC-076 — a number for a position, from the side to move's point of view

> **Cut 2026-08-16 by BA/PM** (task `epic-to-tickets-EPIC-004`, Workflow 03). **First of three
> evaluation tickets** (`ABC-082` pawn structure, `ABC-083` king safety + mobility). Split by term,
> not by module, because each term is independently valuable, independently testable and
> independently reversible — and because one "evaluation" ticket would have sized `XL`.

## Problem

*User*: the player who wants an opponent that does not hang pieces.

*Pain*: a search with no evaluation is a random-move generator with extra steps. Nothing in merged
`src/` scores a position — there is no `eval` module and no scoring function anywhere.

*Value*: material + piece-square tables is the cheapest thing that produces recognisably
non-idiotic chess, and it is the term every later term is measured against.

## Scope

- A pure function: position → centipawn score, **negamax convention — positive is good for the side
  to move.**
- **Material**: standard piece values, hand-tuned, stated as constants in one place.
- **Piece-square tables**: one table per piece type, mirrored for black. Deliberately small and
  hand-written.
- **No search, no state, no cache.**

## Out of scope

- **Pawn structure** (`ABC-082`), **king safety and mobility** (`ABC-083`).
- **Any learned or tuned-by-machine component.** `EPIC-004`'s permanent non-goal: no NNUE, no
  neural evaluation.
- **Endgame-specific tables or tapered evaluation.** Not requested; coding rule 5. If a later
  ticket needs it, that ticket asks for it.
- **Terminal scoring** (mate, stalemate, draw). That is the search's — `ABC-077` — because the score
  of mate depends on distance to root, which an evaluator of a bare position cannot know.

## Acceptance (Given/When/Then)

- **`A1` (symmetry — the property that catches side-to-move sign bugs).** **Given** any position and
  its colour-mirrored twin (pieces swapped, ranks flipped, side to move flipped, castling rights
  swapped, `epSquare` mirrored), **when** both are evaluated, **then** the scores are **exactly
  equal**. Corpus, enumerated because the named source holds only **six** positions: those six
  (`src/perft.test.ts`'s `PERFT_SUITE`) **plus every position one legal ply from each**
  (20+48+14+6+44+46 = 178, that file's own depth-1 counts) = **184 positions**, and their mirrors.
  **Assert all 184.** *(What fails this, measured at QE 2026-08-17: a hard-coded sign error on the
  side-to-move negation — 170 of 184 mismatch. What does NOT fail it, also measured: a wrong
  piece-square table entry or a wrong material value, at any corpus size — under a mirrored-INDEX
  implementation the equality is an algebraic identity of the read. `A1` green is therefore **not**
  evidence about table contents, and `ABC-082`/`ABC-083` must not read it as such.)*
- **`A2` (the start position is balanced).** **Given** `startpos`, **then** the score is **exactly
  0**.
- **`A3` (material dominates, and by the stated amounts).** **Given** `startpos` with one black
  knight removed, **then** the score for white is **≥ +250** and **≤ +400** centipawns — i.e. the
  piece-square component cannot swamp a minor piece.
- **`A4` (the tables actually do something).** **Given** two positions identical in material but
  with a white knight on `b1` vs on `e4`, **then** the `e4` position scores **strictly higher** for
  white.
- **`A5` (purity).** **Given** any position, **when** it is evaluated **twice**, **then** the scores
  are identical and the `Position` object is **byte-identical before and after** (asserted, because
  `zobristKey` on this codebase transiently mutates and that trap is on record).
- **`A6` (cost).** **Then** measured mean cost per call on the `src/perft.test.ts` position set is
  reported with machine and Node version. **Bar: ≤ 1,100 ns**, which is the highest leaf-evaluation
  cost `ADR-0003`'s depth table models and still clears depth 7 in 0.68 s. Above it, the depth
  arithmetic this epic rests on stops holding.

## Dependencies

- **`src/position.ts` — MERGED.** Board representation is `ADR-0001`'s 0x88; the tables index it.
- **None open.** This ticket is independent of the search and of the key seam.

## Security / NFR triggers

- **`NFR-005` — `A6`'s ≤ 1,100 ns/call bar** is this ticket's contribution to depth-in-budget. It is
  the input `ADR-0003`'s model uses; it is not a depth claim.
- **`N8-LANE` — ≤ 650 ms CPU**, inherited by name.
- **Security — not triggered.** Pure arithmetic, no input surface. **Firing threshold:** it fires if
  the diff touches any file outside the new evaluation module and its test file.

## Test notes

1. **`A1` constrains the SHAPE of the score, not the CONTENTS of the tables** (measured at QE
   2026-08-17); the corpus is kept because `ABC-082`/`ABC-083` need its size and its
   castling/`epSquare` mirroring, not because it widens what `A1` detects. Write the mirror helper
   first; every later evaluation ticket (`ABC-082`, `ABC-083`) reuses it and must extend `A1`'s
   corpus, not fork it — `ABC-082` `A7` makes that mechanical.
   The one-ply expansion is merged `legalMoves` (`src/legal.ts:42`) + `makeMove`/`unmakeMove`
   (`src/apply.ts:122`/`:152`) — no new machinery, and deterministic, so the 184 is stable.
2. **`A5`'s byte-identical assertion is not paranoia** — this project has a merged function that
   transiently mutates the position it reads.
3. **Do not assert exact centipawn totals** beyond `A2`. They are hand-tuned and will move; assert
   relations (`A3`, `A4`) that survive tuning.

## Size and priority rationale

**Size `M` (3).** One pure module, seven tables, and a property test with a mirror helper. The
tables are typing, not thinking. **Not `L`:** no state, no async, no dependency edge beyond
`position`.

**Not `XL`. No `SPLIT_REQUIRED`.**

**Priority `P0`.** `ABC-077` cannot be tested without it, and it is on the critical path.

## Definition of Ready

Assessed by BA/PM, **2026-08-16**. **Result: 10 of 10 clean — DoR MET.**

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** no scoring function exists in merged `src/`; the user pain is the hanging piece |
| 2 | scope and out-of-scope clear | **✅** four fences, including terminal scoring pushed to `ABC-077` with a stated reason |
| 3 | INVEST-shaped | **✅** genuinely independent — zero open dependencies |
| 4 | acceptance testable and measurable | **✅** six: exact-equality symmetry over 184 enumerated mirrored pairs (`A1` corpus repaired 2026-08-17, its claim narrowed to what QE measured 2026-08-17), exact 0 at startpos, a bounded material window, a strict ordering, byte-identical purity, a ≤ 1,100 ns bar |
| 5 | dependencies known | **✅** one merged module; nothing open |
| 6 | security/NFR triggers with a measurable target | **✅** ≤ 1,100 ns/call, ≤ 650 ms CPU lane, a falsifiable security threshold |
| 7 | test notes present | **✅** three |
| 8 | size assigned | **✅** `M` (3) |
| 9 | priority assigned | **✅** `P0` |
| 10 | no major unresolved blocker | **✅** none |
