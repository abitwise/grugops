---
id: ABC-003
title: Apply and undo a move with full state restoration
status: done
column: Done
size: M
priority: P0
epic: EPIC-001
feature: —
---

# ABC-003 — Apply and undo a move with full state restoration

## Problem

*User*: the search in EPIC-004, which walks millions of positions. *Pain*: a search that
copies the whole position at every node is too slow, and one that mutates without a perfect
undo silently corrupts every branch above it. *Value*: make/unmake that provably restores
the exact prior state — the property the entire engine rests on.

## Scope

- `makeMove(position, move)` mutating in place, updating: piece placement, side to move,
  castling rights, en-passant square, halfmove clock (reset on pawn move or capture,
  incremented otherwise), fullmove number (incremented after Black's move).
- `unmakeMove(position, move)` restoring every one of those fields exactly.
- An undo record carrying the state that cannot be derived from the move alone — the
  captured piece, the prior castling rights, the prior en-passant square, the prior halfmove
  clock.

## Out of scope

- Special-move apply/undo (castling rook movement, en-passant capture square, promotion
  piece swap) — ABC-004 extends this ticket's mechanism.
- Repetition history — ABC-007.

## Acceptance (Given/When/Then)

- **Given** any of the six standard perft positions, **when** every pseudo-legal move is
  applied and then undone in turn, **then** the resulting FEN equals the original FEN for
  every move, with zero exceptions.
- **Given** a position after a capture is applied and undone, **when** the FEN is read,
  **then** the captured piece is back on its square and the halfmove clock has its prior
  value.
- **Given** a white pawn double push from `e2` to `e4`, **when** applied, **then** the
  en-passant square is `e3`; **when** undone, **then** it returns to its prior value.
- **Given** a non-pawn, non-capture move, **when** applied, **then** the halfmove clock
  increments by exactly 1.
- **Given** any Black move, **when** applied, **then** the fullmove number increments by
  exactly 1; **given** any White move, **then** it does not change.

## Dependencies

- `ABC-001` — the position and FEN serializer (the FEN is how the test asserts identity).
- `ABC-002` — supplies the moves to apply.

## Security / NFR triggers

- `NFR-001` (throughput) — make/unmake runs once per search node and is the hottest path in
  the project. In-place mutation with an undo record is the required approach; full position
  copying is explicitly rejected here.
- No security trigger.

## Test notes

The headline test is a property test, not an example test: over every perft position × every
pseudo-legal move, assert `toFEN(unmake(make(p, m))) === toFEN(p)`. This single test catches
almost every state-restoration bug and should be written before the implementation.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `M` ✅ · priority `P0` ✅ · no blocker ✅
