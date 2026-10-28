---
id: ABC-001
title: Position state and FEN round-trip
status: done
column: Done
size: M
priority: P0
epic: EPIC-001
feature: —
---

# ABC-001 — Position state and FEN round-trip

## Problem

*User*: every other ticket in this project. *Pain*: without one agreed representation of a
chess position, the renderer, the parser, the engine, and the opening book each invent their
own and disagree at the edges. *Value*: one position type that can be created from a FEN
string and written back to the identical string — which makes every later ticket testable
against published positions instead of hand-built fixtures.

## Scope

- Position type holding: piece placement (8x8), side to move, castling rights (4 flags),
  en-passant target square (or none), halfmove clock, fullmove number.
- Piece encoding covering the six types and two colours.
- `parseFEN(string) -> Position` and `toFEN(Position) -> string`.
- Rejection of malformed FEN with a named reason (wrong field count, bad rank length,
  illegal character, no king, etc.) rather than a silent partial parse.
- Square addressing helpers and algebraic square names (`a1`-`h8`).

## Out of scope

- Move generation, legality, apply/undo — ABC-002 through ABC-005.
- Rendering the board for humans — EPIC-002.
- Zobrist hashing — belongs with repetition detection (ABC-007).

## Acceptance (Given/When/Then)

- **Given** the standard starting FEN, **when** it is parsed and re-serialized, **then** the
  output string is byte-identical to the input.
- **Given** each of the six standard perft position FENs, **when** each is parsed and
  re-serialized, **then** every output is byte-identical to its input.
- **Given** a FEN with an en-passant target (`... w KQkq e3 0 1`), **when** parsed, **then**
  the en-passant square is `e3` and re-serialization preserves it.
- **Given** a FEN with partial castling rights (`... w Kq - 5 12`), **when** parsed, **then**
  exactly those two rights are set and the halfmove clock is 5 and fullmove is 12.
- **Given** a malformed FEN (5 fields instead of 6; a rank summing to 9 squares; the
  character `x` in the placement field), **when** parsed, **then** it throws an error naming
  the specific fault, and no partially-built position is returned.

## Dependencies

None. This is the first ticket in the epic; everything else depends on it.

## Security / NFR triggers

- `NFR-001` (throughput, EPIC-001) — the position type is the search's hot data structure.
  No target is asserted at this ticket; the measurement happens in ABC-006 and the EPIC-004
  spike. Flagged here only so the implementer prefers flat, allocation-light structures over
  convenience objects.
- No security trigger. FEN input is local and untrusted only in the sense that a user can
  mistype it; the named-error requirement covers that.

## Test notes

Round-trip is the core test and it is cheap: a table of known FENs, parse → serialize →
assert identity. Add the malformed-FEN cases as a table too. This ticket is where the
project's test-table pattern gets set, so keep it obvious.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `M` ✅ · priority `P0` ✅ · no blocker ✅
