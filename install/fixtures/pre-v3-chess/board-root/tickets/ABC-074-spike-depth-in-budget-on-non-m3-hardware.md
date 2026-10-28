---
id: ABC-074
title: SPIKE — depth-in-budget on non-M3 target hardware (lifts NFR-005's PROVISIONAL marker)
status: dropped
column: Done
size: S
priority: P0
epic: EPIC-004
feature: —
---

# ABC-074 — the spike that is still owed, and it is not `ABC-008`

> **Cut 2026-08-16 by BA/PM** (task `epic-to-tickets-EPIC-004`, Workflow 03).
>
> **I was routed with "`ABC-008` discharged this — cut no spike". I checked and that is only half
> right, so I cut it.** `ABC-008` is `Done` (merged 2026-07-23) and it DID answer `RISK-002`'s
> go/no-go: **GO WITH CONSTRAINT**. But on **2026-07-30 Olger Oeselg ratified `ADR-0003` clause 2
> as amended**, and amendment **(2c)** re-pointed the mitigation at a **different measurement on
> different hardware**: *"It stays provisional until `EPIC-004`'s spike measures on target
> hardware."* `NFR-005`'s `Verified by` cell carries it so it cannot be lost — *"the provisional
> obligation has a home: `EPIC-004`'s own timeboxed spike (`RISK-002`'s mitigation) measures
> depth-in-budget on non-M3 target hardware, and that spike is the verification that LIFTS the
> PROVISIONAL marker."*
>
> `ABC-008` measured **nodes/sec on an M3 with no legality filtering at all**. This spike measures
> **depth reached inside a wall-clock budget, on a machine that is not an M3**. Different metric,
> different code, different machine. **`plans/board.md:142` is CORRECT as written and needs no
> correction.**

## Problem

*User*: every player who is not on the author's laptop.

*Pain*: **every performance number this project holds is one machine and one Node version.**
`plans/nfr-catalog.md` says so four separate times, and `ADR-0003` names the unvalidated **2–3x
slower-hardware factor** as *"the largest single unknown in this ADR"*. On the arithmetic a 3x
slower machine still clears depth 6 by ~1.5x and **loses precisely depth 7** — so the WARN level is
provisional and a depth-7 miss on slower hardware cannot today be told apart from a regression.

*Value*: it converts a level nobody can act on into one that can gate. Until it reports, every
downstream ticket in this epic inherits an untestable WARN.

## Scope

- Run the search — **whatever exists at the time this spike runs** — on **`kiwipete` and
  `position-6`**, the standing benchmark positions, at default difficulty.
- Record: **deepest ply completed inside 3 s**, wall clock at that ply, whether the 5 s ceiling was
  ever crossed, and the diagnostic node rate **with its node definition, position and machine**.
- Record the machine: CPU, core count, Node version, platform triple. **A figure without its
  machine is not a datum here.**
- Timeboxed. Throwaway. `spike/`-shaped like `npm run spike:perft`, **not production**.

## The blocker, stated first because it decides the ticket

**This project has no non-M3 machine on record, and getting one is not an agent's to arrange.**
Every measurement in `plans/nfr-catalog.md` and every ADR reads *Apple M3 (Mac15,13) / Node
v24.12.0 / darwin-arm64*. **Owner: the project owner.** This ticket is `Blocked` on hardware from
the moment it is cut, and it must be **visible on the board as blocked rather than quietly
skipped** — skipping it silently is how a provisional level becomes a permanent one.

## Out of scope

- **Re-deriving `NFR-005`'s target, or moving the depth-6 floor or the depth-7 level.** Those are
  Architect/Design's and the floor is Olger Oeselg's ratified text. This spike **measures against**
  them.
- **Lifting the marker.** The spike reports; **Architect/Design** rules on the marker.
- Spending any of `ADR-0003` clause 3's escape hatches. That ADR **authorizes none of them** and a
  spike does not authorize one either.
- **Node rate as a target.** It is a diagnostic here and nowhere else.

## Acceptance (Given/When/Then)

- **`A1` (both positions, both levels).** **Given** a non-M3 machine, **when** the search runs at
  default difficulty on `kiwipete` and on `position-6`, **then** the report states for each: deepest
  ply completed within **3 s**, whether **depth ≥ 6** was reached (the FAIL floor), and whether
  **depth 7** was reached (the WARN level).
- **`A2` (the ceiling is checked, not assumed).** **Then** the report states the maximum wall clock
  observed for a single move and whether it ever exceeded **5 s**.
- **`A3` (the machine is on every figure).** **Then** every recorded number carries CPU model, core
  count, Node version and platform triple. A figure missing any of the four is not accepted.
- **`A4` (the hardware factor is answered as a number).** **Then** the report states the measured
  ratio of this machine to the M3 baseline on the same positions, and says explicitly whether the
  **2–3x** assumption held, was optimistic, or was pessimistic.
- **`A5` (it leaves no production code behind).** **Then** `git diff --numstat` shows **no file
  under `src/`** changed by this ticket.
- **`A6` (it is timeboxed and says so).** **Then** the report records the time actually spent and
  the recommendation is one of **the marker LIFTS / the marker STAYS / the floor is MISSED and
  `ADR-0003` clause 3 is now live** — never a fourth, softer answer.

## Dependencies

- **A non-M3 machine — OPEN, and the blocker.** Owner: the project owner.
- **A search to measure — OPEN.** `A1` needs something that completes plies. **This is the one
  ordering awkwardness in this epic and it is named rather than hidden:** the spike is
  *before-the-full-build* by `RISK-002`'s shape, but it measures **depth**, which needs a search.
  **Ruling: it runs against `ABC-078`'s iterative-deepening loop the moment that lands — the
  earliest point at which a depth is a real number — and before `ABC-080`/`ABC-081` tune it.** A
  spike run against no search would repeat exactly `ABC-008`'s error of measuring a proxy.
- **`ABC-008` is MERGED** and is the source of `RISK-002`'s surviving constraint. **Not re-run, not
  re-argued.**

## Security / NFR triggers

- **`NFR-005` — this ticket IS its named verification.** Targets: depth ≥ 6 in 3 s (FAIL below),
  depth 7 in 3 s (WARN below), on `kiwipete` and `position-6`.
- **`NFR-004` — measured here as the 5 s ceiling check.**
- **`N8-LANE` — not triggered.** Nothing enters the default test lane; this is a throwaway harness.
- **Security — not triggered.** No input surface, no dependency, no `src/` change (`A5`).

## Test notes

1. **Rotate the condition order and discard a warm-up round**, per `NFR-008`'s own measurement
   protocol — this project has a written protocol for interleaved timing and it should be reused,
   not reinvented.
2. **Do not put a wall-clock assertion in the suite.** `plans/nfr-catalog.md` states the rule
   plainly: a wall-clock assertion is a test that passes or fails on the machine that runs it.
3. **Quote the node rate only with its definition.** Metric B (every node calls `legalMoves()`) and
   classic perft differ by **30x on the same code**.

## Size and priority rationale

**Size `S` (2).** A harness run and a written report. No production code, no design. The cost is
scheduling a machine, not building anything — and scheduling is not size.

**Priority `P0`.** It is `RISK-002`'s named mitigation on the board's only remaining `P0` epic, and
it is the only thing that can lift a marker every other ticket in this epic inherits.

## Definition of Ready

Assessed by BA/PM at the cutting hop, **2026-08-16**. **Result: 7 of 10 clean, 3 ⚠️ — NOT met;
stays in `Backlog`, and it will be `Blocked` when pulled.**

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** one machine, one Node version, on every figure in the catalog; `ADR-0003` names the gap itself |
| 2 | scope and out-of-scope clear | **✅** measures against the levels, rules on nothing; four fences |
| 3 | INVEST-shaped | **⚠️** **not independent** — it needs `ABC-078` to exist before a depth is a real number, which inverts `RISK-002`'s "before the build" shape. Named and ruled above, not resolved away |
| 4 | acceptance testable and measurable | **✅** six criteria: two positions × two levels, a 5 s ceiling check, four required machine fields, a numeric hardware ratio, and a three-valued verdict |
| 5 | dependencies known | **✅** the hardware blocker with its owner; the ordering ruling; `ABC-008` named as merged and not re-run |
| 6 | security/NFR triggers with a measurable target | **✅** `NFR-005` depth 6 / depth 7 in 3 s; `NFR-004` 5 s ceiling |
| 7 | test notes present | **✅** three, all pointing at protocols this project already wrote down |
| 8 | size assigned | **✅** `S` (2) |
| 9 | priority assigned | **✅** `P0` |
| 10 | no major unresolved blocker | **⚠️⚠️ TWO.** **(a) No non-M3 machine exists on this project's record** — owner's, not an agent's. **(b) The `A1`/`RISK-002` ordering tension** ruled above but not eliminated |
