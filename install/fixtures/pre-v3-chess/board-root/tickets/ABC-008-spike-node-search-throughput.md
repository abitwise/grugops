---
id: ABC-008
title: SPIKE — measure Node search throughput ceiling
status: done
column: Done
size: S
outcome: GO WITH CONSTRAINT — time-based per-move budget is mandatory for EPIC-004
priority: P0
epic: EPIC-004
feature: —
kind: spike
timebox: one working session
---

# ABC-008 — SPIKE: measure Node search throughput ceiling

> **This is a spike, not a feature.** Its deliverable is a *decision*, not code. The benchmark
> code written here is throwaway and must be deleted or quarantined under `spike/` — it is
> explicitly **not** the ABC-001..ABC-005 implementation and must not be grown into it.
> Timeboxed: one working session. If the answer is not clear by then, stop and escalate
> rather than extending.

## Problem

*User*: the whole project, and specifically whoever has to decide whether EPIC-004 is
buildable as scoped. *Pain*: `RISK-002` — two product decisions are coupled and unverified.
The engine targets ~1400-1700 Elo (needs search depth), and the stack is TypeScript on Node
(may not deliver the nodes/sec that depth requires). If Node cannot reach the throughput,
either the strength target or the stack has to move — and finding that out *after* EPIC-004
is built is the expensive way to learn it.

*Value*: converts a guess into a measurement, for a fraction of the cost of building the
engine and discovering the problem late.

## The circularity, and how this spike handles it

A true measurement needs the real move generator — which is ABC-001..ABC-005 and does not
exist. This spike therefore measures a **structurally representative** hot loop, not real
chess:

- a flat, allocation-light board representation (typed arrays) of the shape ABC-001 will use
- in-place make/unmake against an undo record, of the shape ABC-003 will use
- sliding-piece ray generation, the most expensive part of ABC-002
- a recursive perft-shaped tree walk, the shape ABC-006 will use

The moves it generates do **not** need to be legal or even correct. Correctness is not what
is being measured — the cost of the operations is. This is the only way to get the number
before the generator exists, and it is why the code is throwaway.

**Consequence to state plainly:** the resulting number is an *estimate with a known bias*.
Real generation will be somewhat slower (legality filtering, special moves). The spike
should therefore be read against a margin, not as a precise prediction.

## Scope

- Project scaffold — `package.json`, `tsconfig.json`, and a test runner, on the configured
  stack (TypeScript on Node). **The scaffold is not throwaway**; ABC-001 inherits it. This is
  in scope here because the spike has to run on the real stack for its number to mean anything.
- A throwaway benchmark under `spike/` implementing the representative loop above.
- Measurement of nodes/sec at a fixed tree depth, reported with the machine and Node version.
- Fill the verified gate commands into the root `AGENTS.md` command slots, replacing
  `UNKNOWN - verify` for the slots that are now real.

## Out of scope

- Any correct chess. Legality, special moves, and check detection are ABC-001..ABC-005.
- Building the actual engine, evaluation, or search — EPIC-004 proper.
- Optimizing the benchmark to chase a better number. The point is an honest baseline of the
  straightforward approach, not the best achievable number.

## Acceptance (Given/When/Then)

- **Given** the scaffold, **when** `npm test` and `npm run typecheck` are run, **then** both
  execute successfully and their real commands are recorded in `AGENTS.md`.
- **Given** the throwaway benchmark, **when** it runs at a fixed depth, **then** it reports a
  nodes/sec figure together with the Node version and the machine it ran on.
- **Given** the measured figure, **when** it is compared against `NFR-001` (≥ 1,000,000
  nodes/sec, generation-only), **then** the comparison is recorded as an `observation` note
  carrying the actual number — never a bare pass/fail.
- **Given** the measurement, **when** the spike closes, **then** a `decision` note records one
  of exactly three outcomes:
  - **GO** — throughput supports ~1400-1700 on TypeScript/Node; both product decisions stand.
  - **GO WITH CONSTRAINT** — reachable only with a named constraint (e.g. lower depth plus
    stronger move ordering); the constraint is written down and EPIC-004 inherits it.
  - **NO GO** — the stack or the strength target must change; the spike states which, and the
    decision escalates to the requester because it reverses a choice they made.
- **Given** the spike is closed, **when** the repo is inspected, **then** no benchmark code
  remains outside `spike/`, and nothing in `src/` depends on anything in `spike/`.

## Dependencies

None — that is the point of running it first.

## Security / NFR triggers

- `NFR-001` Move-generation throughput, target ≥ 1,000,000 nodes/sec. This spike is the
  first measurement of it.
- `NFR-005` Search throughput, target ≥ 500,000 nodes/sec with evaluation. This spike
  measures generation only and so gives an **upper bound** on NFR-005, not a measurement of
  it. State it as an upper bound; do not report it as if evaluation had been measured.
- No security trigger. No network, no user input, no secrets.

## Test notes

A spike's "test" is the honesty of its number. Two rules:

1. Report the measurement exactly as it ran — machine, Node version, depth, and the actual
   figure. A spike that rounds in its own favour defeats its own purpose.
2. Record the result as an `observation` (a neutral measured fact) and the go/no-go as a
   `decision`. **Not** as a `finding` — a `finding` requires a real `§14-gate#<id>` stamp,
   and a benchmark number on one machine is not gate-verified. Claiming otherwise would be
   exactly the fabrication the note schema exists to prevent.

The scaffold, unlike the benchmark, does get a real test: one trivial passing test proving
the runner works, which is what ABC-001 builds its suite on.

## Definition of Ready

Problem ✅ · scope + out-of-scope ✅ · INVEST ✅ · acceptance measurable ✅ · dependencies ✅ ·
NFR triggers ✅ · test notes ✅ · size `S` ✅ · priority `P0` ✅ · no blocker ✅
