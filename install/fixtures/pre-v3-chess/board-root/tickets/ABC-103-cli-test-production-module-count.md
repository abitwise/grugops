---
id: ABC-103
title: `src/cli.test.ts` hard-codes the production-module count, so every new module reds the suite
status: done
column: Done
size: S
priority: P2
epic: —
feature: —
---

# ABC-103 — a test row that goes red for correct work, and has already cost two hops

> **Cut 2026-08-17 by BA/PM** (task `refinement-abc031-qe-repairs-2026-08-17`), routed from the
> `ABC-076` engineer and confirmed against the tree at that hop.

## Problem

*User*: every engineer who adds a production module — which, with `EPIC-003` and `EPIC-006` open, is
most of the remaining roadmap.

*Pain*: **`src/cli.test.ts:733` asserts `expect(productionModules()).toHaveLength(20)`.** It is a
global counter in a local row. **Any new file under `src/` that is not a test reds the suite**, with
a failure that names neither the new module nor the reason, and the only repair is for a human to
bump the literal by hand. **Measured 2026-08-17: it has already cost two hops in one day**
(`ABC-076` and `ABC-031`, both of which add a production module and neither of which is about the
CLI entry point).

*Value*: removing a recurring, self-inflicted red that trains engineers to edit an assertion they did
not write in order to land unrelated work — the exact reflex a suite must never teach. **The row's
stated purpose survives without the count.** Its own comment says it exists so *"the entry point is
flat in `src/`, where the licence guard can see it"*, and flatness is already carried by the two
`toContain` assertions and the `nested` check in the same `it` block. **The count adds no
discrimination to that purpose** — a nested `src/cli/main.ts` changes the flat listing, not its
length.

## Scope

- **`src/cli.test.ts:733` only.** Replace the hard-coded total with an assertion that carries the
  row's stated purpose — flatness and the presence of the two named modules — without a repo-wide
  count, or delete the row if the surviving assertions already carry it. **The engineer states which
  and why in the diff.**
- **Sweep for the same shape and report it.** `src/render-seam.test.ts:88` and
  `src/history-pane.nfr.test.ts:163` build the same listing. **Read them; report whether either
  asserts a total.** Repair any that do, under the same rule; if neither does, say so — the finding
  is the deliverable, not a guessed edit.

## Out of scope

- **Any production line.** This is a test-only change. Zero non-test files under `src/`.
- **The `ADR-0011` clause 1 licence-guard trigger itself.** It is not this ticket's to re-derive; the
  row is being made stable, not weaker in what it guards.
- **`ABC-029`'s / `NFR-002`'s module-count re-derivations.** Those count modules deliberately and are
  a different instrument.

## Acceptance (Given/When/Then)

- **`A1` (a new module no longer reds it).** **Given** the repaired suite, **when** an empty
  placeholder production module is added under `src/` and `npm test` is run, **then** the suite is
  **green** and no assertion names a module total. **When** the placeholder is removed, **then** the
  suite is still green. *(Both directions, so the repair is not merely a bumped literal.)*
- **`A2` (the purpose still has teeth).** **Given** the repaired suite, **when** `src/cli.ts` is
  moved to `src/cli/main.ts`, **then** the suite goes **red** on the flatness assertion in that same
  `it` block. *(The row is only worth keeping if this still fails; a repair that also loses this is a
  deletion in disguise.)*
- **`A3` (no total survives anywhere in the listing shape).** **Given** `src/cli.test.ts`,
  `src/render-seam.test.ts` and `src/history-pane.nfr.test.ts`, **when** each is read, **then** no
  assertion on a production-module listing asserts a length, size or count, and the diff states
  which of the three needed a change and which did not.
- **`A4` (test-only).** **Given** the delivered diff, **when** `git diff --numstat` is read, **then**
  **0** non-test files under `src/` changed, the suite is green with a skip count of **0**, and
  `PERFT_DEEP=1` is **32/32** exact.

## Dependencies

**None.** All three files are merged on `main`. **Ordering note, not a dependency:** the cheapest
time to land this is before the next production module, because every module added first pays the
manual bump again.

## Security / NFR triggers

- **`N8-LANE`**: **no test file is added** — this is an edit to existing files — so the per-file
  floor of 160 ms CPU does not apply and the expected lane effect is **zero, and slightly negative**
  (one fewer assertion). No measurement is owed unless a file is added.
- **Security: no trigger.** No production code, no new dependency, no user surface.

## Test notes

1. **Prove `A1` in both directions.** Add the placeholder, run, remove it, run. A one-directional
   check passes for a suite that was simply re-bumped.
2. **Do not weaken `A2` to make `A1` easy.** Deleting the whole `it` block satisfies `A1` and fails
   this ticket's point.
3. **Report the sweep even when it is empty.** *"Neither of the other two asserts a total"* is a
   result; silence is not.

## Lane cost — how many test FILES this ticket implies

**Zero.** Existing files only.

## Size and priority rationale

**Size `S` (2).** One assertion repaired with a stated rationale, plus a two-file read and a
two-direction check. **What would make it `M`:** deciding the licence guard needs a different
instrument — that is an ADR question and is out of scope here.

**Priority `P2`.** A real, recurring tax with a measured cost (two hops in one day) and no user
value of its own. It ranks below any ticket that ships player-visible behaviour and above anything
cosmetic, and it gets cheaper to pay the earlier it lands.

## Definition of Ready

Assessed against `agent-factory/checklists/definition-of-ready.md` by BA/PM, **2026-08-17**.
**Result: 10 of 10 MET. Requesting `Backlog`.**

| # | item | verdict |
|---|---|---|
| 1 | problem clear | **✅** every engineer adding a module; measured two-hop cost on 2026-08-17 |
| 2 | scope and out-of-scope clear | **✅** one line plus a named two-file sweep; three fences |
| 3 | INVEST-shaped | **✅** independent, small, testable |
| 4 | acceptance testable and measurable | **✅** four criteria, each an observable red/green, both directions on `A1` |
| 5 | dependencies known | **✅** none; one ordering note |
| 6 | security/NFR triggers | **✅** `N8-LANE` zero-file, expected effect zero; security not triggered |
| 7 | test notes present | **✅** three |
| 8 | size assigned | **✅** `S` (2), with the condition that would make it `M` |
| 9 | priority assigned | **✅** `P2`, with its ranking reason |
| 10 | no major unresolved blocker | **✅** none |
