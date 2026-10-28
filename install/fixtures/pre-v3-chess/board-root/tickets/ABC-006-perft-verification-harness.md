---
id: ABC-006
title: Perft verification harness
status: done
column: Done
size: S
priority: P0
epic: EPIC-001
feature: —
---

# ABC-006 — Perft verification harness

## Problem

*User*: everyone downstream, though none of them ever calls it. *Pain*: RISK-001 — a
move-generation bug does not crash, it silently invalidates every game and every search
built on top. Unit tests on hand-built positions cannot find the combinations that matter.
*Value*: perft is the chess world's standard correctness proof. Exact node counts at depth
against published positions is the difference between "the rules look right" and "the rules
are right."

This ticket is small in code and large in consequence: it is the acceptance gate for
EPIC-001 as a whole.

## Scope

- `perft(position, depth) -> number` — count leaf nodes of the legal move tree at depth.
- `perftDivide(position, depth)` — per-first-move breakdown, the standard tool for bisecting
  which move subtree is wrong. Without divide, a failing perft is nearly undebuggable.
- A test suite over the six standard positions (startpos, Kiwipete, and positions 3-6) at
  depths that keep the suite fast enough for the default test run, with the deeper counts
  behind a slower opt-in task.
- A nodes/sec measurement printed by the harness, feeding `NFR-001` and the EPIC-004 spike.

## Out of scope

- Fixing the bugs perft finds — those are defects against ABC-002, ABC-004, and ABC-005, and
  are fixed there.
- Search, evaluation, or any use of perft for benchmarking beyond raw nodes/sec.

## Acceptance (Given/When/Then)

- **Given** the starting position, **when** perft runs, **then** the counts are exactly
  `1:20`, `2:400`, `3:8902`, `4:197281`, `5:4865609`.
- **Given** the Kiwipete position
  `r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1`, **when** perft
  runs, **then** the counts are exactly `1:48`, `2:2039`, `3:97862`, `4:4085603`.
- **Given** all six standard positions, **when** the suite runs to its configured depths,
  **then** every count matches the published value exactly. A near-miss is a failure; there
  is no tolerance.
- **Given** a deliberately broken generator (e.g. en-passant generation disabled), **when**
  perft runs, **then** the suite fails — proving the harness actually detects regressions
  rather than passing vacuously.
- **Given** `perftDivide` at depth 3 on Kiwipete, **when** it runs, **then** it prints one
  line per legal first move and the printed counts sum to the depth-3 total.

## Dependencies

- `ABC-005` — perft counts *legal* moves, so it needs the full legal generator.
- `ABC-004` — the special-move combinations are most of what perft is checking.

## Security / NFR triggers

- `NFR-001` Move-generation throughput, target **≥ 1,000,000 nodes/sec**. This ticket is
  where that number is first measured. If the measurement lands materially below target,
  **do not silently accept it** — raise it against `RISK-002`, because the engine's strength
  target depends on it.
- No security trigger.

## Test notes

⚠️ **Transcribe the full perft table from the Chess Programming Wiki "Perft Results" page at
implementation time.** The counts quoted above for startpos and Kiwipete are the widely
published values and are stated here to make the acceptance measurable — but treat the wiki
as authoritative and verify every number against it before encoding the table. A wrong
expected value sends the engineer hunting a bug that does not exist, which is a worse
failure than having no test.

The broken-generator case should be run once by hand during development to confirm the
harness bites; it does not need to ship as a permanent test.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `S` ✅ · priority `P0` ✅ · no blocker ✅
