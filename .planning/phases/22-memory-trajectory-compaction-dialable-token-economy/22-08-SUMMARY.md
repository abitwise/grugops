---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 08
subsystem: testing
tags: [compaction, carve-out, splitNotes, parseNote, fail-closure, CMP-02, TDD, typescript, vitest]

# Dependency graph
requires:
  - phase: 22-memory-trajectory-compaction-dialable-token-economy
    provides: "the CMP-02 carve-out oracle (compactor.ts), the shared parser parseNote + splitNotes read path (context-io.ts), and the round-6 multi-note thread representation (D-08)"
provides:
  - "A fail-closed splitNotes: a `---`-shaped line (incl. trailing-whitespace `--- `/`---\\t`) opening an id-bearing frontmatter run is RECOVERED as its own per-note record OR loudly refused (trailingMalformed → NoteDirResult.unparseable) — never silently absorbed into a prior note's body"
  - "isRecognizedFrontmatterLine: a single exported source-of-truth recognized-frontmatter-line predicate (IN-02) consulted by BOTH parseNote (its malformedLines decision) and splitNotes (its boundary key) — the splitter provably cannot drift from the parser"
  - "A self-checking writer-order guard pinning both note writers' field order (composeNote, composeThreadNote) to the splitter — a future field-reorder fails RED"
  - "Held-out RED-first end-to-end test corpus (kind-first / indented-id / trailing-space boundary-miss shapes via the writeThread free-scratch path) closing the 6th distinct CMP-02 bypass CLASS"
affects: [phase-22-verification, phase-26-equivalence-oracle, compaction-workflow-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fail-closure as the primary safety mechanism (recover OR refuse, never silently absorb) — broadened recognition is a usability layer ON TOP, not the floor"
    - "Boundary detection keyed on the load-bearing identity (an id-bearing frontmatter run) so broadened recognition coexists with body-`---` precision"
    - "Single exported source-of-truth grammar predicate shared by parser and splitter (no-drift coupling)"

key-files:
  created:
    - ".planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-08-RED-baseline.txt"
    - ".planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-08-GREEN-proof.txt"
  modified:
    - "scripts/context-io.ts"
    - "scripts/context-io.js"
    - "scripts/context-io.test.ts"
    - "scripts/compactor.test.ts"

key-decisions:
  - "Fork A (read-path-only) implemented as user-resolved; Fork B (write-path / one-note-per-file) not touched — writeThread / composeThreadNote / the threads/<agent>.md representation stay frozen"
  - "splitNotes recovers ANY region whose fence parses (parseNote non-null) as its own per-note record — even if it carries malformedLines or an empty id — and defers the fail-closed verdict to checkCarveOut's existing gates (a)/(b)/empty-id, which name the specific fault. This preserved the round-5 message-naming behavior while making buried notes visible."
  - "A note boundary is an id-BEARING frontmatter run (an `id:`-looking line at any indent within the run). Keying on the id lets a genuine kind-first note be RECOVERED while an id-less embedded `---key:value---` body block stays body — the round-5 body-`---` win."

patterns-established:
  - "Fail-closure floor + broadened-recognition usability layer: the safety invariant rests on 'recover or refuse', never on recognizing every exotic shape"
  - "Writer↔splitter coupling pinned by a structural test (a reorder fails RED), never an undocumented convention"

requirements-completed: [CMP-02]

# Metrics
duration: 21min
completed: 2026-06-19
status: complete
---

# Phase 22 Plan 08: CMP-02 Round-7 Fail-Closed Read-Path Gap Closure Summary

**A fail-closed splitNotes that shares parseNote's grammar via a single exported predicate and keys note boundaries on an id-bearing frontmatter run — closing the 6th CMP-02 bypass CLASS (kind-first / indented-id / trailing-space note #2 silently absorbed) with held-out RED→GREEN end-to-end proof against the committed compactor.js.**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-06-19T12:57:39Z
- **Completed:** 2026-06-19T13:18:09Z
- **Tasks:** 3
- **Files modified:** 4 (2 source/build, 2 test) + 2 evidence files

## Accomplishments
- Reproduced the LIVE 6th bypass end-to-end: against the committed pre-fix `scripts/compactor.js`, a kind-first / indented-id / trailing-space note #2 (each burying a §14-gate-verified finding, writer-reachable via the `writeThread` free-scratch path) is dropped at exit 0 "carve-out intact" (captured in `22-08-RED-baseline.txt`).
- Made `splitNotes` FAIL CLOSED on the whole CLASS: a `---`-boundary-shaped line (incl. trailing-whitespace `--- `/`---\t`) opening an id-bearing frontmatter run is recovered as its own per-note record OR routed to `trailingMalformed` → `NoteDirResult.unparseable` (loud refusal). A fence-ish id-bearing region is never silently swallowed into a prior body, regardless of the exotic shape.
- Introduced `isRecognizedFrontmatterLine` — a single exported source-of-truth grammar predicate (IN-02) consulted by both `parseNote` and `splitNotes`, so the splitter provably cannot drift from the parser. Broadened the boundary key past the old `/^id:/` subset: a genuine kind-first note #2 is now RECOVERED (count increments).
- Preserved the round-5 body-`---` win (an id-less embedded `---\nkey: value\n---` block stays note #1's body) by keying the boundary on the load-bearing id.
- Added a self-checking writer-order guard for BOTH `composeNote` and `composeThreadNote`; replaced the round-6 non-discriminating test #3 with a genuinely RED-first non-boundary-remainder-after-note-#2 case; rebuilt byte-fresh committed `.js` (`npm run freshness` exit 0); captured the end-to-end GREEN proof (`22-08-GREEN-proof.txt`).

## Task Commits

Each task was committed atomically:

1. **Task 1: RED-first held-out boundary-miss + fail-closure tests + RED baseline** - `0932cd2` (test)
2. **Task 2: splitNotes fails closed + shares parseNote's grammar (the source fix) + byte-fresh .js** - `891f82f` (feat)
3. **Task 3: writer-order guard + replace test #3 + GREEN proof** - `cde91f3` (test)

_Note: this TDD plan's RED (Task 1) → GREEN (Task 2 source fix) → guard/proof (Task 3) sequence maps to the test → feat → test gate order; the byte-fresh `.js` rebuild landed inside the Task-2 feat commit._

## Files Created/Modified
- `scripts/context-io.ts` - New exported `isRecognizedFrontmatterLine` predicate; `parseNote` malformed-branch coupled to it (no behavior change); `isBoundaryShapedLine` (trailing-whitespace-tolerant); `splitNotes` rewritten to detect an id-bearing frontmatter run as a boundary and recover-or-refuse each region (fail-closure). `readContext` / `noteId` / `composeNote` bytes UNTOUCHED.
- `scripts/context-io.js` - Byte-fresh `tsc` rebuild (D-13).
- `scripts/context-io.test.ts` - Round-7 splitNotes fail-closure units (3 shapes), broadened `splitNotes∘parseNote==parseNote` no-drift assertion on a kind-first note, and the composeNote writer-order guard.
- `scripts/compactor.test.ts` - Round-7 boundary-miss describe (kind-first / indented-id / trailing-space via the free-scratch path, end-to-end through `runCheck`); composeThreadNote writer-order guard (imports `splitNotes`/`parseNote` from the compiled context-io.js); replaced test #3 (non-boundary fence-shaped remainder after note #2) + safe-non-goal comment.
- `.planning/.../22-08-RED-baseline.txt` - Pre-fix exit-0 "carve-out intact" reproductions + vitest RED summary.
- `.planning/.../22-08-GREEN-proof.txt` - Post-fix exit-1 reproductions (kind-first names the dropped id; indented/trailing-space fail closed) + freshness exit 0 + full non-e2e suite green.

## Decisions Made
- **splitNotes recovers any parseable fence region, defers the fail-closed verdict downstream.** Rather than have `splitNotes` itself reject regions carrying malformedLines/empty-id, it splits them out as their own per-note records so `checkCarveOut`'s existing gate (a) (malformed line, names the laundered field), gate (b) (shared validator), and empty-id guard name the specific fault. This preserved the round-5 fault-message behavior (e.g. the CR-01 indented-`verified_by` tests still assert "verified_by") while making the buried note visible. Only a region whose fence does NOT parse (no closing `---`, or a `--- ` trailing-space open that `parseNote`'s anchored `^---\n` fence rejects) is routed to `trailingMalformed` and refused by file name.
- **Boundary keyed on an id-bearing run, not "any frontmatter-looking line."** A naive broadened candidate (`---` + any `key:`) made the body-`---` embedded `embedded: value` block a spurious 3rd note (regression). Keying recovery on an `id:`-looking line within the run — the carve-out's load-bearing identity — recovers kind-first while leaving id-less body blocks in the body.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-fix commit reference corrected from `b30243a` to `08d1716`**
- **Found during:** Task 1 (RED baseline capture)
- **Issue:** The plan repeatedly cites HEAD as `b30243a` (the round-6 pre-final-commit SHA from the 22-07 GREEN proof). The actual committed pre-fix `.js` artifact in this repo is at `08d1716` (`build(22-07): rebuild byte-fresh .js`), and current HEAD was `c7429d2` (the round-7 plan commit). The working-tree `.js` was clean and byte-identical to `08d1716`.
- **Fix:** Used the actual committed pre-fix `.js` (clean working tree == HEAD, confirmed `isNoteOpeningLine = /^id:/` present) as the RED baseline artifact, and `git checkout 08d1716 -- scripts/*.js` to re-confirm RED in Task 3. No source fix applied during Task 1.
- **Files modified:** none (reference-only; baseline captured against the real pre-fix artifact)
- **Verification:** RED baseline shows exit-0 "carve-out intact" for all three shapes against the committed pre-fix `.js`; GREEN proof shows the RED→GREEN transition against the rebuilt `.js`.
- **Committed in:** `0932cd2` (Task 1)

**2. [Rule 3 - Blocking] composeThreadNote guard uses an explicit context-io.js import (compactor does not re-export splitNotes)**
- **Found during:** Task 3 (writer-order guard)
- **Issue:** The plan's guard test asserts `composeThreadNote`'s output is recognized by `splitNotes`, but `compactor.js` imports `splitNotes` without re-exporting it, and `composeThreadNote` is not exported.
- **Fix:** Added an explicit `import` of the compiled `context-io.js` (`ctxio`) into `compactor.test.ts`, and exercised the real `composeThreadNote` output via the exported `writeThread` (the sanctioned id-bearing structured-fence path). No production export was added.
- **Files modified:** scripts/compactor.test.ts
- **Verification:** the guard passes against the post-fix `.js`; a kind-first reorder of the composed output is recovered (not silently absorbed); a future reorder that broke the id-bearing run would fail RED.
- **Committed in:** `cde91f3` (Task 3)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking/reference).
**Impact on plan:** Neither changed plan scope or intent. The pre-fix-SHA correction used the genuine committed artifact; the import is a test-only convenience. No corpus-narrowing, no acceptance-literal gaming, no write-path change (Fork B untouched).

## Issues Encountered
- **First splitNotes design over-rejected (regression caught by TDD).** An initial version required a recovered region to have `malformedLines.length === 0` and a non-empty id, which moved the round-5 CR-01/CR-02 indented-line tests from "gate (a) names the malformed line" to "unparseable names the file" (3 failures). Resolved by recovering any parseable fence region and deferring the fail-closed verdict to `checkCarveOut`'s existing gates — restoring the round-5 fault messages while keeping the boundary-miss closure. A naive broadened candidate also briefly turned the body-`---` embedded block into a spurious 3rd note; resolved by the id-bearing-run boundary key.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CMP-02 / SC2 round-7 closure is implemented and proven end-to-end. The fail-closure CLASS invariant (recover or refuse, never silently absorb) makes the silent-drop class structurally impossible for fence-ish id-bearing regions, and the writer-order guard removes the unguarded id-first coupling the round-6 verifier refused to certify.
- **Recommended next step:** re-verify 22-08 (`/gsd-verify-work` / the phase verifier) — per the project's standing lesson, a green vitest suite is NOT proof for this safety invariant; the verifier should adversarially re-reproduce the boundary-miss class against the committed `.js` and confirm no 7th bypass.
- Deferred (out of scope, carried forward): WR-03 (false-refusal of a faithful body containing a legitimate `---`+frontmatter sequence — fails SAFE), WR-02-broader (readContext fail-open), IN-02-broader (unknown-key allowlist in validate()). Fork B (write-path representation) remains rejected.

---
*Phase: 22-memory-trajectory-compaction-dialable-token-economy*
*Completed: 2026-06-19*

## Self-Check: PASSED
- All created files exist (22-08-SUMMARY.md, 22-08-RED-baseline.txt, 22-08-GREEN-proof.txt, scripts/context-io.ts, scripts/context-io.js).
- All task commits exist (0932cd2, 891f82f, cde91f3).
- RED baseline contains "carve-out intact"; GREEN proof contains "carve-out FAIL".
- `npm run freshness` exit 0; full non-e2e suite 418 passed / 1 skipped / 0 failed.
