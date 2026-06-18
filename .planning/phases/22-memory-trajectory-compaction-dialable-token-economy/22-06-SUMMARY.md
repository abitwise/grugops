---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 06
subsystem: shared-context / compaction carve-out oracle
tags: [CMP-02, IN-02, carve-out, parser-validator-unification, gap-closure, safety-invariant]
status: complete
requires:
  - "scripts/context-io.ts (parseNote, validate — the shared write-path parser+validator)"
  - "scripts/compactor.ts (checkCarveOut — the read-path carve-out oracle)"
provides:
  - "ParsedFrontmatter.malformedLines — a line-shape anomaly signal recorded by parseNote"
  - "validate() rejection of any malformed in-fence line (write path + CLI validate verb)"
  - "checkCarveOut gate (a) malformedLines-reject + gate (b) shared validate() on every raw+promoted note"
affects:
  - "Phase 23+ parallel/sequential compaction (the carve-out oracle is now strict-equal to the writer)"
tech-stack:
  added: []
  patterns:
    - "read-path == write-path: the oracle runs the SAME validate() the writer runs (IN-02 completion)"
    - "class-not-named-shape defense: malformedLines flags ANY non-recognized in-fence line shape"
    - "gate-before-decision: both fail-closed gates run before any survival/byte-equal decision"
key-files:
  created:
    - .planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-RED-baseline.txt
    - .planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-GREEN-proof.txt
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/compactor.ts
    - scripts/compactor.js
    - scripts/compactor.test.ts
    - scripts/context-io.test.ts
decisions:
  - "[22-06] confidence is NOT a load-bearing carve-out provenance field — a normalized-shape (trailing-ws/CRLF) confidence value change is the agent's sanctioned compression latitude (CMP-01/CMP-03), so the matrix correctly ACCEPTS it; only its LINE-SHAPE anomaly is refused via gate (a)."
metrics:
  duration: 11m
  completed: 2026-06-18
  tasks: 4
  files: 6
---

# Phase 22 Plan 06: CMP-02 round-5 line-shape carve-out (parser/validator unification) Summary

Closed the 4th distinct CMP-02 bypass (whitespace / parser-projection drift) by completing the shared-layer IN-02 contract: the carve-out oracle's strictness is now PROVABLY EQUAL to the write path's. parseNote records a `malformedLines` line-shape signal; validate() rejects each entry; and checkCarveOut runs two fail-closed gates — (a) reject any malformedLines, (b) run the shared validate() — on every raw AND promoted note's verbatim on-disk bytes BEFORE any survival/byte-equal decision. Proven by RED→GREEN reproduction against the COMMITTED `scripts/compactor.js` (exit 0 pre-fix at 429f01c → exit 1 post-fix), `npm run freshness` exit 0, and 395-test non-e2e suite green.

## What was built

- **EDIT A — `parseNote.malformedLines` (context-io.ts):** parseNote now records the exact text of any non-recognized in-fence line. The recognized set is exactly: a blank line, the `refs:` block header, a `refs:` list item (`  - x`) consumed under a header, and a column-0 `key: value` scalar. Everything else (a leading-space/tab indented key, a `key : value` space-before-colon line, a stray `- item` outside a refs block, any junk line) is recorded as malformed. The lenient projection contract is preserved verbatim: last-value-wins on duplicate keys, pre-id tolerance, CRLF/CR normalized at parseNote before line splitting.
- **EDIT B — `validate()` rejection (context-io.ts):** symmetric with the existing duplicateKeys loop, validate() pushes a `structural FAIL: malformed frontmatter line "<line>" …` per malformedLines entry. The CLI `validate <file>` verb and appendNote's write path now refuse exactly these notes.
- **EDIT C — two fail-closed gates in `checkCarveOut` (compactor.ts):** checkCarveOut imports `validate` from `./context-io.js`; NoteFields gains `malformedLines` (sourced from parsed) and `text` (the verbatim on-disk bytes). Gate (a) rejects any malformedLines entry; gate (b) runs `validate(fields.text)` and rejects any structural finding — both on every raw AND promoted note, before the promoted-by-id map / byte-equal loop. Every new fail-closed message cites CMP-02 and uses CLEAR professional voice.
- **Tests:** the round-5 line-shape describe block (CR-01 indent + space-before-colon, CR-02 indented `by` on both sides, CR-03 column-0 empty verified_by), the held-out field × kind × line-shape MATRIX, and the context-io read-path==write-path IN-02 block (malformedLines + validate() symmetry, CRLF identity, trailing-ws tolerated, negative-control refs block).

## RED → GREEN transition (against the COMMITTED .js — not a unit-green claim)

- **RED (pre-fix, `22-06-RED-baseline.txt`):** against the committed `scripts/compactor.js` at commit 429f01c (HEAD docs-only since; `.js` unchanged), the CR-01/CR-02/CR-03 vitest reproductions FAIL (asserted exit-1 does not hold), and a direct `node scripts/compactor.js check <thread> <promoted>` on the CR-01 fixture returns **exit 0 / "carve-out intact"** — a §14-gate-verified finding silently dropped (its `verified_by` line indented one space, folded out raw-side).
- **GREEN (post-fix, `22-06-GREEN-proof.txt`):** after `npm run build`, the SAME CR-01 fixture returns **exit 1 / "carve-out FAIL"** naming `verified_by` and the malformed line (both gate (a) and gate (b) fire). `npm run freshness` exits 0 (17 committed `.js` match a fresh tsc rebuild — no drift). The round-5 reproductions + matrix all pass against the rebuilt committed `.js`.

## Byte-equal-loop residual-seam analysis (including `supersedes`)

Once gate (a) rejects any malformedLines, EVERY note reaching the byte-equal loop (compactor.ts) carries only recognized column-0 `key: value` lines, so the lenient parser's projection of each load-bearing field EQUALS its on-disk bytes — the loop can no longer compare `"" === ""` on a line whose bytes differ (the CR-02 laundering vector is closed before the loop runs). The one field validate() does not police by grammar is **`supersedes`** (it accepts any column-0 value); but gate (a) guarantees the `supersedes` line is a recognized column-0 line, and the byte-equal loop byte-equal-compares it under the matched id — so a byte-level alteration of `supersedes` still trips the loop. No field-specific seam survives. This analysis is recorded as a code comment at the byte-equal loop in compactor.ts. **WR-01:** a laundered line is now refused by gate (a)/(b) BEFORE the "altered to empty" vs "altered" message branch could misreport it, so the operator-facing FAIL message always echoes on-disk reality.

## Regression-safety grep result

A tighter parser touches all parseNote callers, so the repo was grepped for in-fence note shapes the new malformedLines check would now reject. **Result: zero illegitimate in-fence shapes — no grammar change needed.**
- No committed `.grugops/context` note `.md` exists (the runtime context dir is gitignored/absent).
- Committed `.md` files carrying a `kind:`/`verified_by:` frontmatter fence are role / workflow / checklist / contract DOCS — they are never fed through `parseNote` (the carve-out reads only `.grugops/context/**/notes/*.md` and `threads/*.md`).
- Grepping test-file in-fence literals for an INDENTED key or `key : value` shape found ONLY the intentional CR-01/CR-02 perturbations (compactor.test.ts:1299,1359,1418,1434). The one legal indented in-fence shape (`  - item` under `refs:`) is exempt in the grammar; the negative-control test proves it is not over-rejected.

## NoteFields.text == verbatim readFileSync bytes (confirmed)

Gate (b) feeds `fields.text` to `validate()`. `text` is set in `readNoteFields(text)` directly from the function's `text` argument, and the only production caller is `readNoteFields(readFileSync(join(dir, file), "utf8"))` (compactor.ts:166) — the VERBATIM on-disk bytes, never a re-serialization from the parsed scalars. This is load-bearing: a re-serialization would silently normalize an indented/CRLF line away before validate() saw it, re-opening the seam.

## CMP-01 / CMP-03 untouched (confirmed)

This plan edited only the parser/validator strictness (context-io.ts parseNote + validate) and the oracle's fail-closed gates (compactor.ts checkCarveOut). No change to the two-tier separation (writeThread / promote / appendNote sole-writer), the dial (`readCompactionDial`, COMPACTION_DIALS, default-aggressive), re-verify (`reVerify`/`degradeToClaim`/admit), or Workflow 18. The full non-e2e suite (which includes the CMP-01 two-tier + gitignore tests and the CMP-03 dial + re-verify tests) is green with no regressions.

## Deviations from Plan

### Auto-applied design judgment (no architectural change)

**1. [Rule 1/2 — correctness] Matrix `confidence` cells under normalized shapes assert ACCEPT, not refuse**
- **Found during:** Task 3 (building the field × kind × line-shape matrix).
- **Issue:** The plan's field set includes `confidence`. For the two parser-NORMALIZED shapes (trailing-whitespace trimmed, CRLF normalized), a `confidence` VALUE change is genuinely invisible to the carve-out — and correctly so: `confidence` is NOT a load-bearing carve-out provenance field (the byte-equal loop guards id/kind/by/at/verified_by/supersedes; validate() only requires confidence to be present/non-empty). A confidence recompression is the agent's sanctioned body-compaction latitude (CMP-01/CMP-03).
- **Resolution:** The matrix asserts refusal for every cell EXCEPT (normalized-shape × confidence), which it asserts is correctly ACCEPTED. The LINE-SHAPE anomaly of confidence (leading-space/tab/space-before-colon) is still refused via gate (a). This is the honest, non-over-claiming behavior — asserting refusal there would have demanded the oracle police a non-load-bearing field, contradicting the mechanical/semantic line (compactor.ts header) and CMP-03 dial latitude.
- **Files modified:** scripts/compactor.test.ts (documented inline).
- **Commit:** 9a62807

## TDD Gate Compliance

The plan is `type: execute` (not `type: tdd`), but it follows a RED-first contract by design. Gate sequence in git log: `test(22-06)` RED baseline (59c4d54) → `fix(22-06)` GREEN implementation (5c0afc6) → `test(22-06)` class-pinning matrix (9a62807) → `build(22-06)` byte-fresh + proof (4422c38). The RED commit's reproductions were captured FAILING against the committed pre-fix `.js` before any source edit; the fix flips them GREEN.

## Self-Check: PASSED

- FOUND: scripts/context-io.ts, scripts/context-io.js (contains `malformedLines`)
- FOUND: scripts/compactor.ts, scripts/compactor.js (contains `malformedLines` + `validate(`)
- FOUND: scripts/compactor.test.ts, scripts/context-io.test.ts
- FOUND: .planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-RED-baseline.txt
- FOUND: .planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-06-GREEN-proof.txt
- FOUND commits: 59c4d54, 5c0afc6, 9a62807, 4422c38
- GATE: `npm run build && npm run freshness && npx vitest run --exclude '**/scripts/e2e/**'` → freshness exit 0 (17 .js fresh), 395 passed / 1 skipped / 16 files
