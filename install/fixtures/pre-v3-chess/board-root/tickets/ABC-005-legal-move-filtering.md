---
id: ABC-005
title: Legal move filtering and attack detection
status: done
column: Done
size: M
priority: P0
epic: EPIC-001
feature: —
---

# ABC-005 — Legal move filtering and attack detection

## Problem

*User*: the player, who must never be allowed to hang their own king, and the engine, which
must never search an impossible position. *Pain*: pseudo-legal moves include moves that
leave your own king in check — pinned pieces moving off the pin, kings walking into attacks,
failing to address an existing check. *Value*: the `legalMoves(position)` function the rest
of the project calls. This is the last piece needed before the game is rule-correct.

## Scope

- `isSquareAttackedBy(position, square, colour)` — the primitive underneath everything here.
- `legalMoves(position)` — pseudo-legal moves filtered so none leaves the mover's own king
  in check.
- `isInCheck(position)` for the side to move.
- Correct handling of the three cases that make this hard: absolute pins (a piece shielding
  its own king cannot move off the line), check evasion (only moves that resolve the check
  are legal), and en-passant discovered check (the rare case where an en-passant capture
  exposes the king along a rank, because *two* pawns leave the rank at once).

## Out of scope

- Checkmate and stalemate *detection* — ABC-007 consumes this ticket's output to decide them.
- Move ordering or evaluation — EPIC-004.

## Acceptance (Given/When/Then)

- **Given** the starting position, **when** legal moves are generated, **then** exactly 20
  moves are returned.
- **Given** a white king on `e1`, a white knight on `e2`, and a black rook on `e8`, **when**
  legal moves are generated, **then** no knight move appears — the knight is absolutely
  pinned.
- **Given** a white king in check from a single black rook, **when** legal moves are
  generated, **then** every returned move either captures the rook, blocks the line, or
  moves the king out of attack — and nothing else.
- **Given** a white king in check from a knight, **when** legal moves are generated, **then**
  every returned move either captures the knight or moves the king; no blocking move appears,
  because a knight check cannot be blocked.
- **Given** `8/8/8/K2pP2r/8/8/8/8 w - d6 0 1` (white king and pawn on the fifth rank with a
  black rook behind), **when** legal moves are generated, **then** the en-passant capture
  `exd6` is **absent**, because removing both pawns from the rank would expose the king.
- **Given** any position and its legal move list, **when** each move is applied, **then**
  the mover's king is not attacked in the resulting position — for every move, no exceptions.

## Dependencies

- `ABC-002` and `ABC-004` — the pseudo-legal move list this filters.
- `ABC-003` — filtering is implemented by apply, test, undo.

## Security / NFR triggers

- `NFR-001` (throughput) — legality filtering runs at every search node. A make/test/unmake
  filter is acceptable for this ticket; if the EPIC-004 spike shows it dominates the profile,
  a pin-aware generator becomes a separate optimization ticket. **Do not pre-optimize here** —
  correctness first, and the spike decides whether the optimization is ever needed.
- No security trigger.

## Test notes

The en-passant discovered-check case is the one nearly every implementation gets wrong and
the one perft position 3 exists to catch. Write that test explicitly, by FEN, rather than
trusting perft to find it later. The final acceptance bullet is a property test over all
perft positions and should be written as one.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `M` ✅ · priority `P0` ✅ · no blocker ✅
