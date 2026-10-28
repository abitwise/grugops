---
id: ABC-004
title: Special moves — castling, en passant, promotion
status: done
column: Done
size: L
priority: P0
epic: EPIC-001
feature: —
---

# ABC-004 — Special moves: castling, en passant, promotion

## Problem

*User*: any player who castles, or promotes, or plays an en-passant capture — so, every
player. *Pain*: these three are where chess rules stop being uniform, and they are the
single largest source of silent move-generation bugs. *Value*: the rules that make the game
actually chess, implemented once with their edge cases pinned down by tests.

This is the gnarliest ticket in the epic. It is sized `L` for that reason, not because it is
a lot of code.

## Scope

**Castling** — generation and apply/undo:
- Kingside and queenside, both colours; king moves two squares and the rook jumps over.
- Blocked when: rights lost, any square between king and rook occupied, the king is in
  check, or the king passes through or lands on an attacked square.
- Rights lost when the king moves, when a rook moves, and when a rook is *captured on its
  home square* — the commonly-missed case.

**En passant** — generation and apply/undo:
- Available only on the move immediately after an enemy pawn's double push.
- The captured pawn is removed from a square the capturing pawn never occupies.
- Undo restores the captured pawn to its own square, not the destination square.

**Promotion** — generation and apply/undo:
- A pawn reaching the last rank generates **four** distinct moves (Q, R, B, N), not one.
- Capture-promotions generate all four as well.
- Undo restores a pawn, not the promoted piece.

## Out of scope

- Legality filtering for ordinary king safety — ABC-005. Castling's own through-check rule
  is in scope here because it is a castling rule, not a general legality rule.
- SAN notation for these moves (`O-O`, `e8=Q`) — EPIC-003.

## Acceptance (Given/When/Then)

- **Given** `r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1`, **when** moves are generated, **then**
  both castling moves appear for White.
- **Given** that position with a knight on `b1`, **when** moves are generated, **then**
  queenside castling is absent and kingside castling is present.
- **Given** a position where `f1` is attacked by a black piece, **when** White's moves are
  generated, **then** kingside castling is absent — the king may not pass through check.
- **Given** a position where the white king is in check, **when** moves are generated,
  **then** no castling move appears.
- **Given** a position where Black captures the rook on `h1`, **when** the capture is
  applied, **then** White's kingside castling right is cleared.
- **Given** a black pawn double push from `d7` to `d5` next to a white pawn on `e5`,
  **when** White's moves are generated, **then** `exd6` en passant appears; **when** any
  other move is played first and the position returns, **then** it no longer appears.
- **Given** that en-passant capture applied and then undone, **when** the FEN is read,
  **then** the black pawn is back on `d5` and the white pawn is back on `e5`.
- **Given** a white pawn on `e7` with `e8` empty, **when** moves are generated, **then**
  exactly 4 moves to `e8` appear, one per promotion piece.
- **Given** a promotion applied and undone, **when** the FEN is read, **then** a pawn stands
  on the seventh rank and no promoted piece remains.

## Dependencies

- `ABC-002` — extends pseudo-legal generation.
- `ABC-003` — extends apply/undo with the special-case undo records.

## Security / NFR triggers

- `NFR-001` (throughput) — special-move handling must not add a branch to the common path;
  keep it flag-driven.
- No security trigger.

## Test notes

Every acceptance case above is a hand-built FEN with an exact expected outcome — write them
as a table. Extend ABC-003's make/unmake property test to cover these move types; a
promotion or en-passant undo bug is exactly what that property test exists to catch.
This ticket is not "done" until perft (ABC-006) passes, since perft is what proves the
combinations are right, but its own acceptance cases must pass first.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `L` ✅ · priority `P0` ✅ · no blocker ✅
