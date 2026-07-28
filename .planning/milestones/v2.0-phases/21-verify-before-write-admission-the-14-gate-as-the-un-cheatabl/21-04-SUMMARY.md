---
phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
plan: 04
subsystem: shared-context-write-path
tags: [verifier, admission, crlf, parse-note, context-io, vfy, gap-closure, cr-01]
requires:
  - "scripts/context-io.ts parseNote()/readContext()/admit()/emitVerdict() (Phase 21 Plan 01 substrate)"
  - "scripts/context-io.test.ts verify-before-write admission block (Plan 01 — runAdmit + emitVerdict workhorse)"
provides:
  - "parseNote() normalizes CRLF/CR to LF before matching the frontmatter fence — a git-autocrlf (Windows) note parses identically to its LF form (CR-01 closed)"
  - "A CRLF round-trip admission test (RED-then-GREEN) over readContext + admit"
affects: []
tech-stack:
  added: []
  patterns:
    - "single-choke-point line-ending normalization (validate() text path and readContext admission path both feed from parseNote, so one normalize realigns them)"
key-files:
  created: []
  modified:
    - "scripts/context-io.ts"
    - "scripts/context-io.js"
    - "scripts/context-io.test.ts"
decisions:
  - "Normalize line endings in parseNote (the single choke point feeding both validate() and readContext) rather than at two edit sites — one normalize closes the validate/readContext CRLF split the verifier flagged"
  - "Normalize order: replace \\r\\n then lone \\r — covers both CRLF (Windows) and bare-CR notes; downstream m[1]/m[2]/body all operate on the normalized text so LF parsing is byte-unchanged"
metrics:
  duration: 3m
  completed: 2026-06-17
---

# Phase 21 Plan 04: CRLF Round-Trip Admission (CR-01) Summary

Closed CR-01, the single BLOCKER that left Phase 21 at 3/4 (VFY-01 PARTIAL): `parseNote()` in
`scripts/context-io.ts` now normalizes CRLF/CR to LF before matching the frontmatter fence, so a
real green §14-gate verdict note encoded with `\r\n` (the git `autocrlf=true` Windows default) is
parsed identically to its LF form. A legitimately-stamped finding is admitted regardless of the
verdict note's on-disk line endings — proven RED-then-GREEN.

## What was built

- **The fix — one normalization grafted into `parseNote`** (first statement, before the fence match):
  ```ts
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  ```
  Every downstream split/body extraction already reads `m[1]`/`m[2]`/`body`, so they now operate on
  the normalized text with no further change. A CLEAR-voice comment names WHY (CRLF/CR normalization
  so a git-autocrlf note parses identically to LF — without it readContext silently drops CRLF notes
  and admit() wrongly refuses a real verdict, CR-01). No new imports; pure string work (D-15 zero
  host runtime deps preserved).

- **The single-choke-point rationale honored:** `parseNote` feeds BOTH `validate()` (pure text path)
  and `readContext` (admission path). The verifier flagged that they disagreed on CRLF (validate
  rejected it, readContext silently dropped it). Normalizing in the shared choke point realigns them
  in one place — no second edit site.

- **CRLF round-trip test** (`scripts/context-io.test.ts`, new describe block
  `CRLF round-trip admission (CR-01)`), reproducing the bug exactly: plant a real green verdict via
  `mod.emitVerdict(task, id, contextRoot)` (which writes LF bytes), then rewrite every note file
  under `<contextRoot>/<task>/notes/` from `\n` to `\r\n` on disk, then `admit` a matching
  CRLF-encoded finding → exit 0. Three cases:
  - **admit path:** a CRLF verdict admits a matching CRLF-stamped finding (exit 0).
  - **read path:** `mod.readContext(task, contextRoot)` surfaces the CRLF-rewritten verdict
    (`by === "§14-gate"`, `refs` includes `§14-gate#<id>`) — direct proof readContext no longer
    silently drops the note.
  - **LF no-regression sibling:** the same scenario with LF-encoded notes still admits (exit 0),
    making the parity intent local and self-documenting.

- **D-15 build model honored:** rebuilt `scripts/context-io.js` via `tsc`; `npm run freshness` exits
  0 (16 committed `.js` files byte-match a fresh rebuild). The committed `.js` carries the
  normalization (`grep -c 'replace(/\r\n/g' scripts/context-io.js` = 1).

## TDD Gate Compliance

- RED gate: `test(21-04)` commit `3e4991a` — the CRLF admit + readContext cases fail before the
  parseNote normalization lands (the LF no-regression sibling passes immediately, as designed).
- GREEN gate: `fix(21-04)` commit `51f3b24` — the CRLF round-trip block is green; all 26 pre-existing
  context-io cases stay green; the committed `.js` is rebuilt and fresh.

## Deviations from Plan

None — plan executed exactly as written. The plan-checker's robustness note (a grep acceptance
criterion risked over-escaping) was honored by matching against the actual source bytes: the raw
regex literal `replace(/\r\n/g, "\n")` appears verbatim in the `.ts`/`.js`, and the verifying greps
(`grep -c 'replace(/\r\n/g' scripts/context-io.ts` / `.js` = 1 each) match those real bytes — no
substantive behavior assertion was weakened.

## Verification

- `npm run build && npm run freshness` → exit 0 (committed `.js` is a byte-faithful build, D-15).
- `npx vitest run scripts/context-io.test.ts` → 29 passed (the 3 new CRLF cases + all 26 pre-existing
  cases).
- `npx vitest run --exclude '**/scripts/e2e/**'` → 188 passed, 1 skipped (no wider-suite regression;
  the live-CLI e2e lane is excluded per the project's npm-test note).
- Behavior assertion (gap closed): a CRLF-encoded green §14-gate verdict admits a matching
  CRLF-stamped finding (exit 0); the admission semantics for an invalid stamp are unchanged — the fix
  alters only fence parsing, never WHICH notes admit (the D-09/D-01 refuse cases stay refused).
- Source inspection confirms the normalization lives in `parseNote` before the fence match and
  nowhere else (single choke-point fix; no second edit site).

## Self-Check: PASSED

- FOUND: `.planning/phases/21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl/21-04-SUMMARY.md`
- FOUND: commit `3e4991a` (RED test)
- FOUND: commit `51f3b24` (GREEN fix + rebuilt .js)
