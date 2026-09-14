---
phase: 32-board-projector-cli-dashboard
plan: 07
subsystem: cli
tags: [terminal-rendering, ansi, ndjson, exit-codes, sigint, ascii-sanitization, tdd]

requires:
  - phase: 32-01
    provides: the thin D-17 frame, `sanitizeCell`, `parseArgs`, `main(argv, io) => code`, the injected `DashboardIo`
  - phase: 32-03
    provides: `scripts/board-read.ts` (the read seam, per-source stale states, `SOURCE_NAMES`), the watch loop, `createLoop`/`run`/`LoopDeps`
  - phase: 32-05
    provides: `CONFLICT_KINDS`, the joined `FactorySnapshot`, and the `scripts/fixtures/board-snapshot/` tree that manufactures all seven conflict kinds
  - phase: 32-06
    provides: `check:dashboard-readonly`, the import-graph guard the render work had to stay inside
provides:
  - the full D-17 terminal frame — header, columns, `Now running`, `Conflicts`
  - a single `STALE` badge whose source list is derived from the result's own per-source states
  - `claimed n / counted m / limit k` on a `wip-count` conflict instead of a silently chosen number
  - a per-column unparsed-line count, so the frame can say what the grammar declined
  - a `LARGE BOARD` marker with human-rounded bytes and longest line
  - `truncateCell` — a width cut that never splits a surrogate pair, applied after sanitization
  - `STYLE` / `PLAIN_STYLE` / `CLEAR_SCREEN` — one renderer, two stylings, escapes only on a TTY
  - the completed D-18 mode contract — `--once`, `--json`, `--watch`, non-TTY implication
  - a one-line named stderr failure with exit 2 in place of any escaping stack (T-32-08)
  - `handleInterrupt` — the SIGINT contract as a function a case can drive
  - `scripts/board-dashboard.test.ts` — 32 cases, direct-call and spawned-process halves
affects: [32-08, phase-33-windows-ci, future-web-renderer]

actuals:
  tokens: 23745
  tasks: 3
  commits: 5
plan_head_before: 204f78c6

tech-stack:
  added: []
  patterns:
    - "One renderer, two stylings: the non-TTY path passes empty escape constants rather than running a second implementation"
    - "Sanitize before truncate, so a stripped escape sequence cannot move where the cut falls"
    - "The badge's source list is derived from the result's own keys, never from a second literal beside SOURCE_NAMES"
    - "A pure render function (no process, no env, no clock) is what makes a terminal frame testable without a pty"
    - "A two-sided count pin moves only after the gate that owns it has read the new file and reported zero findings"

key-files:
  created:
    - scripts/board-dashboard.test.ts
    - 32-07-RED-baseline.txt
    - 32-07-GREEN-proof.txt
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-tracer.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The header line is the ONE line exempt from width truncation: everything that says the frame is not to be trusted — the stale badge, the conflict count, the large-board marker — lives there, and a narrow terminal cutting the badge off would leave a frame that looks confident for exactly the reason it should not be."
  - "`truncateCell` cuts on a code unit and backs off one unit rather than splitting a surrogate pair; grapheme clusters and east-asian width are NOT modelled, and the boundary is written down rather than implied."
  - "The plan's 'stderr is empty against the fixture tree' was split into two cases, because the committed fixture deliberately carries a tampered claim: one case removes it in a temp copy and asserts stderr is exactly empty, the other keeps it and asserts the diagnostic is on stderr and out of the document on stdout."
  - "Task 2's RED cases and GREEN wiring landed in one commit by mistake; the commit message was amended to say so rather than to claim a RED it does not contain, and the RED run is reproduced in 32-07-GREEN-proof.txt."
  - "Task 3 ships no production code, so every one of its cases was green on arrival; three defects were planted into the committed .js and reverted to prove each case discriminates."

patterns-established:
  - "Style is applied around a whole line AFTER truncation, never inside a cell, so an escape can never count toward the width"
  - "A spawned-process half decides what a CI consumer receives; a direct-call half decides which branch was selected"
  - "When a suite ships no behaviour, mutation probes against the committed artifact are what give its green meaning"

requirements-completed: [DASH-05, DASH-07]

coverage:
  - id: D1
    description: "The full D-17 frame — header (root, mode, read time, conflict count), columns in flow order with Blocked last, empty columns collapsed to one line, `Now running`, and `Conflicts` grouped by kind"
    requirement: "DASH-07"
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#names the resolved root, the mode, the read time and the conflict count, with no LARGE BOARD marker"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#collapses an empty column to exactly one line and renders Blocked last whatever its on-disk position"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#groups conflicts by kind in CONFLICT_KINDS declaration order, each naming expected and actual"
        status: pass
    human_judgment: false
  - id: D2
    description: "A board that went away under a live run renders the STALE badge AND the previous column values — never zero columns"
    requirement: "DASH-05"
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#carries the STALE badge and the PREVIOUS column values rather than zero columns, exiting 0"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#names BOTH stale sources and the age of each last good read in exactly ONE badge (D-12)"
        status: pass
      - kind: other
        ref: "mutation probes A and B in 32-07-GREEN-proof.txt — badge deleted, and stale-renders-zero-columns; each reds the case above"
        status: pass
    human_judgment: false
  - id: D3
    description: "No escape sequence originating in board content can reach a terminal: every cell is sanitized before truncation, and a non-TTY run emits no escape byte at all"
    requirement: "DASH-07"
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#sanitizes a title carrying a CSI and an OSC sequence — no ESC byte survives into the frame"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#emits no ESC byte at all when stdout is a pipe rather than a tty (non-tty, T-32-06)"
        status: pass
      - kind: other
        ref: "mutation probe C in 32-07-GREEN-proof.txt — a non-empty PLAIN_STYLE reds both non-tty cases"
        status: pass
    human_judgment: false
  - id: D4
    description: "The exit code is never the state channel: 0 for a stale board and for a conflicted board alike, 2 only for a usage error and an unreadable root, with a one-line named stderr message in place of any stack"
    requirement: "DASH-07"
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#exits 0 for a STALE result and exits 0 for a CONFLICTED result — the code is not the channel"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#exits 2 with exactly ONE named stderr line when an exception escapes inside main (T-32-08)"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#exits 2 with an EMPTY stdout and a NAMED stderr message on a path that does not exist"
        status: pass
    human_judgment: false
  - id: D5
    description: "`--json` writes exactly one document with every diagnostic on stderr, and `--json --watch` writes one complete document per line per re-read"
    requirement: "DASH-07"
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#exits 0 with exactly ONE JSON document on stdout and an EMPTY stderr for --once --json"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#emits two or more lines, each parsing INDEPENDENTLY as a complete document, and exits 0 on SIGINT"
        status: pass
      - kind: other
        ref: "node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json | <seven-kind check> => 'cli: seven kinds through the wire'"
        status: pass
    human_judgment: false
  - id: D6
    description: "Two dashboards against one repository produce two independent complete outputs: no shared state, no lockfile, no socket between them"
    requirement: "DASH-07"
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#produces two COMPLETE independent documents and exits 0 twice, with no lock between them"
        status: pass
      - kind: other
        ref: "npm run check:dashboard-readonly — 24 cases, green after the render work"
        status: pass
    human_judgment: false
  - id: D7
    description: "The live TTY redraw is calm and legible on a real terminal — no flicker, readable at a human width"
    requirement: "DASH-07"
    verification: []
    human_judgment: true
    rationale: "This suite has no pty. The render function is unit-tested and the clear sequence is asserted, but the VISUAL result on a real terminal is not measured by any case, and a green assertion over a simulated terminal is the weakest possible evidence about a real one. Recorded as a manual-only verification in 32-VALIDATION.md with its instructions."

duration: 36 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 07: The D-17 Frame and the D-18 Process Contract Summary

**The projector now shows what it read — a derived STALE badge over the previous values rather than zero columns, `claimed 2 / counted 3 / limit 3` instead of a silently chosen number, a per-column unparsed count, and a width cut that cannot split a surrogate pair — and a pipe receives exactly one JSON document or one per line with every diagnostic on stderr, exit 0 for stale and conflicted alike, exit 2 for nothing but a usage error and an unreadable root.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-09-14T12:30:00Z
- **Completed:** 2026-09-14T13:06:00Z
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- **The frame degrades visibly rather than lying.** The `STALE` badge is derived from the result's own per-source states, so a board removed under a live run renders the previous columns and rows WITH the badge. This was measured from outside the process, which is the only place DASH-05's promise matters: a spawned `--watch` child, its board deleted mid-run, still printed `[stale]  STALE: board (0s, enoent)  9 conflicts` over `In Development` and `ABC-104`.
- **The renderer names disagreements instead of resolving them.** A `wip-count` conflict renders `claimed 2 / counted 3 / limit 3`; each column carries its unparsed-line count; conflicts are grouped by kind in `CONFLICT_KINDS` declaration order with expected and actual on every entry.
- **Board content cannot reach a terminal as a control sequence.** Every cell goes through `sanitizeCell` BEFORE truncation, so a stripped sequence cannot move where the cut falls, and a non-TTY run emits no byte 27 at all — asserted both in-process and through a real pipe.
- **One renderer, two stylings.** `STYLE` and `PLAIN_STYLE` are the only difference between the TTY and non-TTY paths; a named case asserts the styled frame is byte-identical to the plain one once the SGR sequences are removed, with a premise assertion that the styling did something in the first place.
- **The process contract is measured from outside.** Seven spawned-process cases cover the single-document rule, the NDJSON rule under SIGINT, the two exit-2 conditions, the ANSI-free pipe, the stale degradation and two genuinely overlapping children.
- **The suite was proven to discriminate.** Task 3 ships no production code, so its cases were green on arrival — the situation in which a suite is most likely to be measuring nothing. Three defects were planted into the committed `scripts/board-dashboard.js` and reverted; each reds the case that claims to catch it.

## Task Commits

1. **Task 1 RED: the D-17 frame against the thin 32-01 renderer** — `56272cc1` (test)
2. **Task 1 GREEN: the full D-17 frame** — `dc257361` (feat)
3. **Task 2: modes and the exit contract** — `32d9674e` (feat; carries both halves of the cycle, see Deviations)
4. **Task 3: the CLI contract as a spawned process** — `25d9d6be` (test)
5. **The test-module tripwire, 67 -> 68** — `c96bc62d` (test)

**Plan metadata:** see the `docs(32-07)` commit that carries this file.

## Files Created/Modified

- `scripts/board-dashboard.ts` / `.js` — `renderHeader`, `renderColumns`, `renderNowRunningBlock`, `renderConflicts`, `renderFrame`, `truncateCell`, `STYLE`, `PLAIN_STYLE`, `CLEAR_SCREEN`, `DEFAULT_WIDTH`, `handleInterrupt`; `emit` now selects the styling and the redraw from `io.isTty`; `main` catches anything escaping it; `DashboardIo` gained `columns`
- `scripts/board-dashboard.test.ts` — 32 cases in two halves: direct-call layout and branch selection, spawned-process stream and exit-code contract
- `scripts/board-tracer.test.ts` — the 32-01 "Blocked is the last LINE" case narrowed to D-17's actual claim
- `scripts/check-foundation-guards.test.ts` — `TRIPWIRE_MODULES` 67 -> 68 with the module it counts named
- `32-07-RED-baseline.txt`, `32-07-GREEN-proof.txt` — the RED runs, the already-green cases named as regression pins, and the three mutation probes

## Decisions Made

- **The header is exempt from truncation, and that is a decision rather than an oversight.** Everything that says the frame is not to be trusted lives on it. A wrapped header is ugly; a silently dropped badge is a lie.
- **`truncateCell` models code units and surrogate pairs, and nothing else.** Grapheme clusters and east-asian width need a table this kit does not ship. The boundary is written into the docblock rather than left for a reader to discover from a misaligned column.
- **`handleInterrupt` is a function, not a closure in the entry tail.** A closure under `isEntrypoint` can only be observed by signalling a process, which proves the exit code and proves nothing about whether the watch handles were closed and the timers cleared before the process went away.
- **The `--interval` floor is named by the usage block, not by each refusal message.** That is what actually passes, and `32-07-GREEN-proof.txt` says so rather than implying each refusal states the number.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A neighbouring test had stopped measuring what its name claimed**
- **Found during:** Task 1 (the full D-17 layout)
- **Issue:** `scripts/board-tracer.test.ts` carried "puts Blocked last in the frame", asserting `blockedAt === lines.length - 1`. That was equivalent to D-17's column-order claim only while the frame ENDED at the last column. The full layout puts `Now running` and `Conflicts` after the columns, so the assertion had silently become "the frame ends at Blocked".
- **Fix:** Narrowed to D-17's actual claim — "puts Blocked last among the COLUMNS of the frame", asserting `blockedAt === max(index of each of the 13 kit columns)`, with a PREMISE assertion that every kit column is present at all. The old expectation is quoted in the new case's comment.
- **Files modified:** `scripts/board-tracer.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-tracer.test.ts` — 74 passed
- **Committed in:** `dc257361`

**2. [Rule 3 - Blocking] The EXACT test-module tripwire fired on the new test file**
- **Found during:** the full-suite run after Task 3
- **Issue:** `scripts/check-foundation-guards.test.ts` pins the test-module census two-sided and EXACT on purpose. `scripts/board-dashboard.test.ts` landing moved the live census 67 -> 68, so the pin fired — the pin working, not the pin being in the way.
- **Fix:** Moved to 68 AFTER the run that fired it, in which that module's other 285 cases had already read the new file and reported zero findings. Re-derived rather than incremented: `ls scripts/*.test.ts | wc -l` reports 68, agreeing with the live census, and the reason is recorded beside the constant in the shape the 62 -> 64, 64 -> 66 and 66 -> 67 moves used.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` 286 passed; full suite 4679 passed, 2 skipped, 74 files
- **Committed in:** `c96bc62d`

**3. [Rule 1 - Bug] Two vacuity defects in this plan's own first-draft cases**
- **Found during:** Task 3 (self-review of what each case actually does)
- **Issue:** (a) The concurrency case wrapped `spawnSync` in a `Promise.all`. `spawnSync` BLOCKS, so the second child started only after the first had exited — the exact arrangement a shared lock would survive unnoticed, asserting nothing about concurrency. (b) A dead `const child = spawnSync; void child;` line survived an edit.
- **Fix:** The concurrency case now starts both children with async `spawn` before awaiting either, so they genuinely overlap; the dead line was removed.
- **Files modified:** `scripts/board-dashboard.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts` — 32 passed; `npx tsc -p tsconfig.tests.json` clean
- **Committed in:** `25d9d6be`

### Deviations from the plan's wording

**4. Task 3 behaviour 1: "stderr is empty" against the committed fixture is false by construction**
- **Issue:** The fixture deliberately carries a tampered claim (`.grugops/queue/claimed/abc-105-tampered/claim.md`, two `at:` lines) so plan 32-03's tamper-skip arm is reached by a committed artifact. A run against it always produces one stderr diagnostic.
- **Resolution:** Split into two cases that between them say more than the original: one runs against a temp copy with the tampered claim removed and asserts stderr is EXACTLY empty and stdout is exactly one line; the other keeps the committed tree, asserts (behind a PREMISE) that the diagnostic IS on stderr, and that stdout still parses as one document. Recorded in `32-07-GREEN-proof.txt`.

**5. Task 2's RED and GREEN halves landed in one commit**
- **Issue:** The cases were written and run RED first and the wiring second, but both were staged together. The commit was labelled `test(...)` describing a RED it did not contain.
- **Resolution:** The message was amended to state plainly that the commit carries both halves and that the granularity — not the cycle — was what was lost. The RED run (exit 1, 24 tests, 4 failed, each failure named) is reproduced verbatim in `32-07-GREEN-proof.txt`, so the discrimination it proves stays auditable.

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking) + 2 plan-wording deviations recorded.
**Impact on plan:** No scope creep. Two of the three auto-fixes were tests that had stopped measuring what they claimed — the failure class this repository has paid for repeatedly — and both were narrowed rather than deleted.

## Issues Encountered

None beyond the deviations above. The four behaviours that were genuinely absent at Task 2's baseline (no screen clear on a TTY run, `io.columns` ignored, an exception escaping `main`, a watcher still open after the interrupt) each failed on a named assertion before the wiring landed, and each passes after it.

## Known Stubs

None. Every exported symbol the plan named is implemented and exercised; no placeholder value, empty return or "coming soon" string was introduced.

## Threat Flags

None. The plan's `<threat_model>` names seven threats and every one has its mitigation asserted: T-32-06 (sanitize before truncate, unit + piped), T-32-08 (one named stderr line, unit + spawned), T-32-10 (`--interval` refused, never coerced), T-32-22 (stale badge over carried-forward values, spawned + two mutation probes), T-32-23 (one buffered write per document, spawned NDJSON), T-32-04 (`check:dashboard-readonly` green after the render work), T-32-SC (`git diff --exit-code -- package.json package-lock.json` clean). No new network endpoint, auth path, file-access pattern or schema change was introduced — the module gained no import beyond `CONFLICT_KINDS` from the already-in-closure `board-model.js`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 32-08** (delete the validator's inline column-heading pair and import `board-model.js`). Nothing in this plan touched `scripts/validate-agent-factory.ts`.
- **DASH-05 and DASH-07 are complete** and both are now satisfied by every plan that declares them (32-01 and 32-03 have summaries).
- **One manual-only verification is outstanding for the phase:** the live TTY redraw, recorded in `32-VALIDATION.md` with its instructions (`npm run dashboard` in a real terminal, edit `plans/board.md` in another window, confirm the frame refreshes within ~1 s without flicker). It is `human_judgment: true` in the coverage block above and is NOT claimed by any case.
- **Windows `fs.watch` remains `UNKNOWN - verify`** (Phase 33 / CAP-02). Nothing here asserts it; the mandatory poll floor is the fallback by construction.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*
