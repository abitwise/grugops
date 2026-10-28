---
id: ABC-002
title: Pseudo-legal move generation for all piece types
status: done
column: Done
size: M
priority: P0
epic: EPIC-001
feature: —
---

# ABC-002 — Pseudo-legal move generation for all piece types

## Problem

*User*: the engine and the move parser. *Pain*: they both need the answer to "what can move
here?", and neither can do anything without it. *Value*: the move list — the single most
reused computation in the project. Kept deliberately separate from legality filtering
(ABC-005) so each half can be tested on its own.

## Scope

- Pawn: single push, double push from the starting rank, diagonal captures. Blocked-square
  rules for both pushes.
- Knight: the eight offsets, with board-edge wrapping correctly excluded.
- Bishop, rook, queen: sliding rays that stop on the first occupied square, including that
  square when it holds an enemy piece and excluding it when it holds a friendly one.
- King: the eight adjacent squares (castling is ABC-004).
- A move representation carrying from-square, to-square, moving piece, captured piece (if
  any), and a flag slot the special-move ticket will extend.

## Out of scope

- Castling, en passant, and promotion — ABC-004.
- Filtering moves that leave the king in check — ABC-005. Output here is *pseudo-legal* on
  purpose: it may include moves that are illegal for king-safety reasons.
- Move ordering or scoring — EPIC-004.

## Acceptance (Given/When/Then)

- **Given** the starting position, **when** pseudo-legal moves are generated, **then**
  exactly 20 moves are returned (16 pawn, 4 knight).
- **Given** a lone white rook on `d4` on an otherwise empty board, **when** moves are
  generated, **then** exactly 14 moves are returned.
- **Given** a lone white knight on `a1` on an otherwise empty board, **when** moves are
  generated, **then** exactly 2 moves are returned — proving no edge wrapping.
- **Given** a white rook on `d4` with a friendly pawn on `d6` and an enemy pawn on `b4`,
  **when** moves are generated, **then** `d5` is included, `d6` and beyond are excluded,
  `b4` is included as a capture, and `a4` is excluded.
- **Given** a white pawn on `e2` with a piece on `e3`, **when** moves are generated, **then**
  neither `e3` nor `e4` appears — a blocked single push also blocks the double push.

## Dependencies

- `ABC-001` — consumes the position type and is tested against parsed FENs.

## Security / NFR triggers

- `NFR-001` (throughput) — this is the innermost loop of the search. Prefer precomputed
  offset/ray tables over per-call arithmetic. No numeric target asserted here; ABC-006
  measures it.
- No security trigger.

## Test notes

Isolated-piece-on-empty-board tests give exact, hand-checkable counts and pin down edge
wrapping, which is the classic mailbox-representation bug. Whole-position counts come later
via perft (ABC-006) — do not try to verify full correctness here, that is ABC-006's job.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `M` ✅ · priority `P0` ✅ · no blocker ✅
