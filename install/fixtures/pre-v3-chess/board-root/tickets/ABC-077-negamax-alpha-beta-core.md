---
id: ABC-077
title: Negamax with alpha-beta — the recursion core, driven by a caller, never by a fixed budget
status: done
column: Done
size: M
priority: P0
epic: EPIC-004
feature: —
---

# ABC-077 — the search core. **Its depth parameter is a recursion argument, not a per-move budget.**

> **Cut 2026-08-16 by BA/PM** (task `epic-to-tickets-EPIC-004`, Workflow 03).
>
> **Read this before reading the scope.** `RISK-002`'s surviving constraint — *"`EPIC-004`'s
> per-move budget **must be time-based (iterative deepening against a wall clock), not
> depth-based**"* — is **non-negotiable and ratified** (`plans/nfr-catalog.md` "Survives:"; restated
> in `ADR-0003` "Unchanged by the ratification"). I verified the paragraph says exactly that.
>
> **This ticket takes a `depth` argument, and that does not contradict the constraint** — but only
> because the constraint is guarded here rather than assumed. Iterative deepening *is* a loop that
> calls a depth-limited search repeatedly; the forbidden thing is a **fixed depth being the per-move
> budget**. `A6` makes that a criterion instead of an intention: this module ships with **no public
> entry point that answers "what move should I play"**. `ABC-078` owns that, and it owns the clock.

## Problem

*User*: the player who wants a move chosen for a reason.

*Pain*: `ABC-076` scores a position; nothing looks ahead. A one-ply evaluator captures a defended
queen and loses it next move.

*Value*: alpha-beta is the difference between an evaluator and an opponent, and it is where the
epic's *"does not play the losing move"* acceptance criterion starts to be reachable.

## Scope

- **Negamax with alpha-beta pruning**, taking `(position, depth, alpha, beta)` and returning a
  score plus the best move at the root.
- **Terminal scoring** — checkmate scored relative to distance from the root so a mate in 2 is
  preferred to a mate in 4; stalemate and the drawn cases scored 0. *(Pushed here from `ABC-076`
  because it needs the root distance an evaluator cannot see.)*
- **Node counting**, exposed for the diagnostic rate figure.
- Uses `gameStatus` at leaves. `ADR-0002` keeps `positionCounts` optional *precisely* so a bare
  `gameStatus(position)` at a search leaf is legitimate — the architecture audit records this.

## Out of scope

- **The wall clock, the per-move budget, and the public "give me a move" entry point** —
  **`ABC-078`**, and the reason is `RISK-002`.
- **Quiescence** (`ABC-079`), **move ordering** (`ABC-080`), **the transposition table**
  (`ABC-081`). Each lands on top of this and each is separately measurable — which is the point of
  cutting them apart.
- **In-tree repetition detection** — `ABC-081`, with the TT, because both consume the same key
  array (`ADR-0002` clause 3).
- **Parallelism.** `EPIC-004`'s threading decision is **`UNKNOWN - verify`** (`ADR-0005` `F6`) and
  is **Architect/Design's**. This ticket is single-threaded and says so; it does not decide.

## Acceptance (Given/When/Then)

- **`A1` (it agrees with brute force).** **Given** the positions of `src/perft.test.ts` at depth 3,
  **when** searched with alpha-beta and with pruning disabled, **then** the returned **scores are
  identical** in every case. *(Alpha-beta must not change the value, only the work — this is the
  only test that catches a window bug.)*
- **`A2` (it prunes).** **Given** the same runs, **then** alpha-beta visits **< 40%** of the nodes
  the unpruned search visits, at depth 3 on `kiwipete`. *(A "working" alpha-beta with the bounds
  never applied passes `A1` and fails this.)*
- **`A3` (mate is found and preferred short).** **Given** a position with a forced mate in 2,
  **when** searched at depth ≥ 4, **then** the returned move is the mating move and the score
  exceeds any non-mate score. **Given** a position with mate in 2 *and* mate in 4 available, **then**
  the mate in 2 is chosen.
- **`A4` (it never returns an illegal move).** **Given** **≥ 200** positions from the perft corpus,
  **then** the returned root move is in `legalMoves(position)` — **200/200**.
- **`A5` (stalemate is 0, not a loss).** **Given** a stalemate position, **then** the score is
  **exactly 0** and not a mate score. *(The single most common negamax bug.)*
- **`A6` (`RISK-002`'s guard, as a criterion).** **Then** the delivered module exports **no function
  that selects a move without a caller-supplied depth**, and no default value for `depth` exists
  anywhere in it — asserted by reading the delivered signatures in a test, not by review. **A
  default depth is a fixed-depth per-move budget wearing a parameter's name.**
- **`A7` (position integrity).** **Then** after any search returns, the input `Position` is
  **byte-identical** to before, over the whole corpus — make/unmake balance.

## Dependencies

- **`ABC-076` must land first — OPEN.** Nothing to maximise without it.
- **`src/legal.ts`, `src/apply.ts`, `src/gameend.ts` — MERGED**, and `ADR-0003` clause 1 ratified
  `legal.ts` unchanged. **This ticket does not touch it.**
- **Architect/Design's threading ruling — OPEN**, but **not a blocker for this ticket**: it ships
  single-threaded, which is what every shape of that decision starts from. It **is** a blocker for
  any later parallel work, and nothing here forecloses it.

## Security / NFR triggers

- **`NFR-005`** — depth-in-budget. This ticket produces the first real depth numbers on `kiwipete`
  and `position-6`; report them **with node definition, position and machine**, as diagnostics.
  **No depth verdict is taken here** — `ABC-078` owns the 3 s budget the levels are measured in.
- **`NFR-004` — NOT triggered here and that is deliberate.** There is no wall clock in this ticket.
- **`N8-LANE` — ≤ 650 ms CPU.** **⚠️ `A1`/`A2` at depth 3 over the perft corpus may not fit.** If it
  does not, the depth-3 sweep goes behind an opt-in env flag like `PERFT_DEEP`, and a small subset
  stays in the default lane. Decide with a measurement, not a guess.
- **Security — not triggered.** No input surface.

## Test notes

1. **Build the pruning-disabled mode as a test-only switch, not a shipped option** — coding rule 7.
   `A1` and `A2` both need it; nothing else does.
2. **`A5` first.** Stalemate-scored-as-mate is the classic failure and it passes `A1`–`A4`.
3. **`A6` reads the delivered module's exports.** It is a shape assertion, and it exists because
   `RISK-002`'s constraint is otherwise unfalsifiable at this layer.
4. **Do not re-test move generation.** `PERFT_DEEP` proves it 32/32 exact; `A4` checks the search's
   *choice*, not the generator.

## Size and priority rationale

**Size `M` (3).** One recursive function, one terminal-scoring rule, and a differential oracle that
already exists (the unpruned search). **Not `L`:** every hard part of a search — ordering, the
table, quiescence, the clock — is deliberately in another ticket.

**Not `XL`. No `SPLIT_REQUIRED`.**

**Priority `P0`.** Three of the epic's five acceptance criteria run through it.

## Definition of Ready

Assessed by BA/PM, **2026-08-16**. **Result: 8 of 10 clean, 2 ⚠️ — NOT met; stays in `Backlog`.**

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** one-ply evaluation loses material; stated as behaviour, not as a missing module |
| 2 | scope and out-of-scope clear | **✅** five fences, each naming the ticket that takes the work |
| 3 | INVEST-shaped | **⚠️** **not independent** — `ABC-076` must land first |
| 4 | acceptance testable and measurable | **✅** seven: identical scores vs unpruned, **< 40%** nodes, mate-distance preference, **200/200** legal, exact 0 stalemate, a delivered-signature guard, byte-identical position |
| 5 | dependencies known | **✅** one open ticket; three merged modules; the threading ruling named with its owner and its non-blocking status argued |
| 6 | security/NFR triggers with a measurable target | **✅** `NFR-005` diagnostics with definitions; `NFR-004` explicitly not triggered; lane bar with a **named risk and a decided remedy** |
| 7 | test notes present | **✅** four |
| 8 | size assigned | **✅** `M` (3) |
| 9 | priority assigned | **✅** `P0` |
| 10 | no major unresolved blocker | **⚠️** **the `N8-LANE` fit of `A1`/`A2` is unmeasured** and could force an opt-in split of the test. The remedy is decided; the measurement is not taken |
