---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 09
subsystem: shared-verified-context / memory-trajectory-compaction
tags: [CMP-02, carve-out-oracle, fail-closure, parser-unification, safety-invariant, round-8]
status: complete
requires:
  - "scripts/context-io.ts: parseNote (the single fence grammar), isRecognizedFrontmatterLine, isBoundaryShapedLine"
  - "scripts/compactor.ts: readNoteDir → NoteDirResult.unparseable channel, checkCarveOut fail-closed gates, writeThread free-scratch path"
provides:
  - "splitNotes' note-boundary decision DERIVED FROM parseNote (one grammar): boundary iff parseNote(region) non-null AND id-bearing, with a fail-closure trigger for id-looking-but-unparseable note-open attempts"
  - "the 7th CMP-02 silent-absorb bypass (blank-first / junk-first / CRLF fence-open) closed structurally — and the whole silent-absorb CLASS, proven by the parseNote-oracle fuzz test"
affects:
  - "scripts/context-io.js (byte-fresh tsc rebuild)"
  - "CMP-02 / SC2 carve-out oracle (read path only; Fork A)"
tech-stack:
  added: []
  patterns:
    - "parser unification: a read-path splitter derives its boundary decision by calling the single canonical parser (parseNote) on the candidate region, never a parallel line heuristic — so splitter and parser cannot drift"
    - "fail-closure trigger vs recover authority separation: an id-looking-but-unparseable note-open attempt is REFUSED (routed to trailingMalformed) while parseNote alone decides RECOVERY"
key-files:
  created:
    - ".planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-09-RED-baseline.txt"
    - ".planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-09-GREEN-proof.txt"
  modified:
    - "scripts/context-io.ts (splitNotes boundary unified with parseNote; looksLikeFrontmatterLine + opensIdBearingRun removed as boundary authority)"
    - "scripts/context-io.js (byte-fresh rebuild)"
    - "scripts/context-io.test.ts (parseNote-oracle fuzz + blank/junk/CRLF units + inter-note tiling + re-cast composeNote guard)"
    - "scripts/compactor.test.ts (round-8 fence-open e2e + re-cast composeThreadNote guard)"
decisions:
  - "UNIFY THE TWO PARSERS (Fork A, read-path only): splitNotes' boundary IS parseNote — boundary iff parseNote(region) non-null AND parsed id non-empty. The looksLikeFrontmatterLine(lines[i+1]) gate and the hand-rolled opensIdBearingRun line scan are REMOVED (grep -c both == 0 in .ts and .js); the dead looksLikeFrontmatterLine helper is deleted. One grammar, can't drift."
  - "FAIL-CLOSURE FLOOR retained via a non-authoritative trigger: a ---shaped open carrying an id-looking line that does NOT cleanly parse (trailing-space '--- ', indented ' id:', unclosed orphan) is a note-open ATTEMPT routed to trailingMalformed (refused). opensNoteAttempt is ONLY the refuse-vs-leave-as-body trigger — parseNote remains the sole RECOVER authority — so the round-5 id-less body-block win is preserved (id-less embedded block has no trigger, stays body)."
  - "Fork B (one-note-per-file write-path change) REJECTED and untouched: writeThread / composeThreadNote / the single multi-note threads/<agent>.md representation (D-08) stay frozen; only test guards added, no emitted bytes changed."
metrics:
  duration_min: 12
  completed: 2026-06-19T14:43:27Z
  tasks: 3
  files_changed: 4
  commits: 3
---

# Phase 22 Plan 09: UNIFY the two parsers — close the 7th CMP-02 silent-absorb bypass (and the CLASS) Summary

splitNotes' note-boundary decision is now DERIVED FROM parseNote (one grammar) instead of a parallel line heuristic that drifted from the parser seven times; the blank-first / junk-first / CRLF fence-open silent-absorb (the 7th bypass) is closed structurally, and the whole silent-absorb CLASS is proven closed by a parseNote-oracle property/table fuzz test plus held-out RED→GREEN end-to-end tests through the committed `node scripts/compactor.js check`.

## What was built

**Task 1 (commit `ff403c7`) — RED-first tests + baseline.** Authored, against the committed PRE-FIX `.js`:
- The **parseNote-oracle property/table fuzz test** (`context-io.test.ts`): generates note #2 variants across {0,1,2 leading blanks} × {junk/heading line} × {leading-indent on `id:`} × {kind-first vs id-first} × {trailing whitespace on the open fence} × {LF vs CRLF}, and for every variant parseNote accepts as id-bearing asserts splitNotes never returns the silent-absorb signature. A comment states explicitly this test (not the suite being green) is the closure evidence for the class — it catches a hypothetical shape #9 because the oracle IS parseNote, the single grammar.
- `splitNotes` blank-first / junk-first / CRLF blank-first **fail-closure units**.
- An **inter-note tiling** non-regression unit (GREEN pre- and post-fix; plan-checker WARNING fold-in).
- A **round-8 held-out e2e describe** (`compactor.test.ts`): each fence-open note #2 glued onto `threads/<agent>.md` via the sanctioned `writeThread` free-scratch (no-`note`-arg) path, driven end-to-end through `runCheck`, asserting exit 1 naming the dropped id or the refused file.
- `22-09-RED-baseline.txt`: each fence-open shape exits **0 "carve-out intact"** with the silent-absorb signature (count=1/trailing=null) against the committed pre-fix `.js`; the new tests FAIL (RED). No source change.

**Task 2 (commit `54344e0`) — the unification.** Rewrote `splitNotes`' boundary logic in `context-io.ts`:
- A column-0 `---`-shaped open is a NOTE BOUNDARY iff `parseNote(candidateRegion)` is non-null AND the parsed frontmatter carries a non-empty `id` (the `idBearing` predicate; `candidateRegionFrom` slices the open to its first `\n---` close — the same span parseNote's non-greedy regex picks). `parseNote` is the sole RECOVER authority (in the region walk).
- **Removed the bespoke boundary authority**: the `looksLikeFrontmatterLine(lines[i + 1])` single-line gate and the hand-rolled `opensIdBearingRun` line scan (`grep -c` both == 0 in `.ts` and `.js`); the now-dead `looksLikeFrontmatterLine` helper was deleted. No re-derived oracle survives to drift.
- **Fail-closure floor** retained via a non-authoritative trigger (`opensNoteAttempt` + `ID_LOOKING`): a `---`-shaped open carrying an id-looking line that does NOT cleanly parse (trailing-space `--- `, indented ` id:`, unclosed orphan) is a note-open ATTEMPT routed to `trailingMalformed` (refused), never silently absorbed. This is only the refuse-vs-leave-as-body trigger; parseNote decides recovery — so the round-5 id-less body-block win is preserved.

**Task 3 (commit `9ebf290`) — guards + byte-fresh `.js` + GREEN proof.** Re-cast both writer-order guards (composeNote in `context-io.test.ts`, composeThreadNote in `compactor.test.ts`) for the unified design: each writer's real output is parseNote-acceptable + id-bearing + exactly one splitNotes boundary; a field reorder that keeps the id is recovered (legal under unification); a dropped id loses note status (the id-keyed carve-out is detectable). Rebuilt the touched `.ts` to byte-fresh committed `.js` (`npm run freshness` exit 0). Captured `22-09-GREEN-proof.txt`.

## RED → GREEN evidence (end-to-end against the COMMITTED compactor.js)

Per fence-open shape, the exact transition:

| Shape | Pre-fix (committed) | Post-fix (rebuilt committed) |
|-------|---------------------|-------------------------------|
| (a) blank-first `---\n\nid:` | EXIT=0 "carve-out intact" (silent-absorb count=1/trailing=null) | EXIT=1 — `carve-out FAIL ... finding ... id "...r8blankfir" ... dropped`; splitNotes count grew to 2 |
| (b) junk/heading-first `---\n# heading\nid:` | EXIT=0 "carve-out intact" | EXIT=1 — `carve-out FAIL: malformed frontmatter line "# heading" ... engineer.md#1` + dropped finding `...r8junk` |
| (c) CRLF blank-first | EXIT=0 "carve-out intact" | EXIT=1 — `carve-out FAIL ... id "...r8crlf" ... dropped`; count grew to 2 |

Removed-predicate grep gates: `looksLikeFrontmatterLine(lines[i + 1])` → 0 and `opensIdBearingRun` → 0 in both `context-io.ts` and `context-io.js`. `npm run freshness` exit 0. Full non-e2e suite (`npx vitest run --exclude '**/scripts/e2e/**'`): **426 passed | 1 skipped**.

## Deviations from Plan

**None as architecture.** One implementation detail worth recording (covered by the plan's own fail-closure floor, not a re-opened decision):

**1. [Rule 2 — correctness] Fail-closure trigger required to preserve the round-7 three shapes.** A naive "boundary iff parseNote-id-bearing" alone REGRESSED the round-7 fail-closure units (trailing-space `--- `, indented ` id:`) and the round-6 non-boundary-tail test — those shapes parseNote does NOT accept as clean id-bearing notes, so under a parse-only boundary they silently absorbed instead of failing closed. The plan's Task-2 `<behavior>` and must_have #5 explicitly require these to be REFUSED (routed to `trailingMalformed`), so I added a non-authoritative `opensNoteAttempt` trigger (an `id:`-looking line anywhere in the run) that marks such a `---`-open as a note-open ATTEMPT → the region walk then refuses it via parseNote returning null/empty-id. parseNote remains the sole RECOVER authority; the trigger only stops a fence-ish note-open attempt from being swallowed. This satisfies the fail-closure floor while keeping the round-5 id-less body-block win (an id-less embedded block has no id-looking line → no trigger → stays body). Verified: all round-5/6/7 units stay GREEN. Found during: Task 2. Files: `scripts/context-io.ts`. Commit: `54344e0`.

## Scope / non-regression

- `git diff c199ec9..HEAD scripts/context-io.ts` is confined to two hunks: the `looksLikeFrontmatterLine` removal and the `splitNotes` boundary logic. `readContext`, `noteId`, and `composeNote` are NOT in the diff. `compactor.ts` is UNCHANGED across the whole plan (writers' emitted bytes frozen — Fork B). `compactor.js` unchanged.
- CMP-01 (two-tier compaction) and CMP-03 (context.compaction dial, re-verify, Workflow 18) untouched.
- Round-5 BODY-`---` win, round-6 byte-round-trip/CRLF, round-7 three-shape fail-closure units, and the inter-note tiling unit all pass.

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io.test.ts`, `scripts/compactor.test.ts` — all modified and present.
- `22-09-RED-baseline.txt` (contains "carve-out intact") and `22-09-GREEN-proof.txt` (contains "carve-out FAIL") — both present.
- Commits `ff403c7`, `54344e0`, `9ebf290` — all present in `git log`.
- Removed-predicate gates: `looksLikeFrontmatterLine(lines[i + 1])` == 0, `opensIdBearingRun` == 0 (both files).
- `npm run freshness` exit 0; full non-e2e suite 426 passed / 1 skipped.
