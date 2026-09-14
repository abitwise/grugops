---
phase: 32-board-projector-cli-dashboard
plan: 13
subsystem: infra
tags: [typescript, vitest, ast, terminal-safety, ansi, ndjson, cli, stderr]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "sanitizeCell and the T-32-06 stdout discipline (plan 32-03); the DashboardIo injection point and the spawned-process case idiom (plan 32-07); unreadableSources and the reshaped readErrors (plans 32-09, 32-10)"
provides:
  - "warn(io, ...lines) — the single stderr write expression in scripts/board-dashboard.ts, applying the existing sanitizeCell to every diagnostic"
  - "STDERR_WRITE_SITE_COUNT — a two-sided pin over an AST-derived census that also asserts the surviving site's enclosing function name"
  - "A stderr write-site collector that finds the member, global-process, aliased and destructured spellings of the channel, and refuses the routes it cannot name a call site for"
  - "USAGE_LINES — the usage block held as lines, so a refusal quoting an unvalidated argv token cannot forge a line of its own"
  - "The corrected --json framing contract at all three prose sites, with JSON_FRAMING_PROSE_SITES pinning the count and the superseded wording asserted absent"
  - "A spawned --help case binding the printed help text to the measured line counts"
affects: [board-projector, dashboard, phase-32-verification]

actuals:
  tokens: 16000
  tasks: 2
  commits: 3
plan_head_before: 169c4e3992d4c0f4ef9361bd5491e6d45bc6d8c5

tech-stack:
  added: []
  patterns:
    - "A sanitizing CHOKEPOINT rather than a sanitize at each call site, with the site count derived from the module's own AST and the surviving site's enclosing function asserted by name"
    - "A write-site collector that tracks LOCAL BINDINGS of the channel and collects detached capabilities as opaque, so a spelling the collector cannot name fails the guard instead of shortening its answer"
    - "Prose bound to a measurement: a source-text site count for the sentences, a spawned --help case for the printed text, and spawned line counts for the behaviour the sentences describe"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-13-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-13-GREEN-proof.txt
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-dashboard.test.ts

key-decisions:
  - "`warn` is VARIADIC over lines rather than the review's single-line sketch. `sanitizeCell` removes the newline along with every other C0 code point, so text a caller passes cannot introduce a line break — and the refusal text quotes an unvalidated argv token. Structure that is genuinely the program's own (the usage block) arrives as separate arguments."
  - "`refuse` no longer folds the usage block into its message, and `USAGE` is held as `USAGE_LINES`. Folding it in would have forced the caller to split on a newline the argv token could supply, which is how a refusal starts forging lines of its own."
  - "The entry tail's direct `process.stderr.write` routes through `warn(defaultIo(), ...)`. It is the path a raw Node stack takes, and T-32-08 says a stack must never be the last thing a piped consumer reads."
  - "The test's control-code-point measure is spelled independently of the module's own `CONTROL_CODE_POINTS`. Importing it would make every inertness assertion circular — a regression that widened the module's class would widen the measurement in the same commit."
  - "Control CODE POINTS are counted, not bytes. The diagnostic's own em dash is UTF-8 E2 80 94, whose continuation bytes sit inside the C1 byte range, so a byte count could never return zero and the RED baseline would have measured nothing."
  - "The --watch --json line-count case from plan 32-07 was EXTENDED with the whole-stream assertion rather than duplicated. A second live-loop child would have cost roughly 2.5 s of CI wall time to measure a contract already under measurement."
  - "DASH-07 and DASH-08 are NOT marked complete. Plan 32-14 also declares both and has no SUMMARY, so the shared-ID gate reports 0/2 ready — which matches this plan's own success criterion that no phase status is flipped to Complete by a gap-closure round."

patterns-established:
  - "For a safety invariant, pin the number of PLACES the invariant is applied, derived from the AST, and assert WHICH function holds the surviving one — a count of one in the wrong function is still a bypass."
  - "A derived-set census ships with a discrimination probe over a constructed module, and with an `opaque` list of routes the pass cannot decide, asserted empty."
  - "A corrected sentence ships with the measurement it describes: a site count over the source, a spawned case over the printed text, and a spawned case over the behaviour."

requirements-completed: []

coverage:
  - id: D1
    description: "No control code point from a board file, a ticket file or argv reaches stderr: an OSC title and a screen-clear CSI planted in a ticket's first line, and an OSC sequence in the repoRoot argument, are both inert in the captured stderr while the diagnostic line survives and still names what went wrong"
    requirement: DASH-07
    verification:
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#strips an OSC title and a screen-clear planted in a ticket's first line, keeping the refusal"
        status: pass
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#strips an OSC sequence carried in the repoRoot argument, keeping the refusal"
        status: pass
      - kind: other
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-13-GREEN-proof.txt sections 1 and 2 — both reviewer reproductions re-run against the rebuilt scripts/board-dashboard.js, 0 control code points against a RED baseline of 3 and 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one stderr write expression exists in scripts/board-dashboard.ts, it is inside the sanitizing helper, and the count is derived from the module's AST rather than typed out"
    requirement: DASH-07
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#pins the stderr write-site count two-sided at one, inside `warn`"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#PREMISE: the collector finds every spelling, and refuses the routes it cannot name"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#PREMISE: the parse read the module and reported no syntactic error"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ordinary non-ASCII text survives sanitization: an em dash, an accented letter and an emoji each reach stderr unchanged"
    requirement: DASH-07
    verification:
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#POSITIVE CONTROL: ordinary non-ASCII text survives to stderr unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three docblock sentences promising exactly one JSON document state the real D-18 contract: one document per line, one line per frame, exactly one frame unless --watch is given"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#states the per-line contract at every site, and nowhere promises a single document"
        status: pass
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#prints the form's name in the help text a user actually reads"
        status: pass
    human_judgment: false
  - id: D5
    description: "The corrected prose is bound to measured behaviour — a spawned --json --once emits exactly one line and a spawned --json --watch emits more than one, each independently parseable while the whole stream is not"
    requirement: DASH-08
    verification:
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#emits exactly ONE line for --once --json, and the whole stream parses as one document"
        status: pass
      - kind: e2e
        ref: "scripts/board-dashboard.test.ts#emits two or more lines, each parsing INDEPENDENTLY as a complete document, and exits 0 on SIGINT"
        status: pass
      - kind: other
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-13-GREEN-proof.txt section 5 — 1 line for --once --json; 3 lines for --watch --json --interval 1000 over 2.4 s, 3/3 parseable individually, whole stream not parseable"
        status: pass
    human_judgment: false

duration: 22 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 13: One stderr chokepoint, and a JSON contract that describes the program Summary

**Every diagnostic the dashboard writes now passes through a single `warn` that applies the existing `sanitizeCell`, proven by an AST census pinned two-sided at one write site inside that function; and the three sentences promising "exactly one JSON document" now state the per-line contract D-18 actually decided, bound to spawned line counts.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-14T22:14:00Z
- **Completed:** 2026-09-14T22:36:29Z
- **Tasks:** 2
- **Files modified:** 5 (3 modified, 2 created)

## Accomplishments

- **CR-05 closed.** Both of the reviewer's reproductions — an OSC window-title sequence plus a screen-clear CSI carried out of a ticket's first line, and an OSC sequence carried in the `repoRoot` argument — were re-run against the committed binary (3 and 4 control code points on stderr), then against the rebuilt one (0 and 0), with the diagnostic line still present and still naming the ticket path and the refused root.
- **One chokepoint, not six sanitized call sites.** `warn(io, ...lines)` is now the only expression in `scripts/board-dashboard.ts` that writes to stderr. The former six — `emit`'s read-error loop, `refresh`'s catch, `run`'s usage path, `run`'s root-refusal catch, `main`'s catch, and the entry tail's direct `process.stderr.write` — all route through it. `sanitizeCell` itself is untouched: what is removed is still decided in one place, and this changed only where it is applied.
- **The census is derived, and it asks the harder question.** A `typescript` AST pass over the module collects every `.write` call on a member access named `stderr`, plus calls through a locally bound or destructured channel, and collects detached write capabilities and computed members as `opaque` and asserts that list empty. The count is pinned two-sided at 1 **and** the surviving site's enclosing function name is asserted to be `warn` — a count of one in the wrong function is still a bypass.
- **WR-06 closed.** The file header, the `USAGE` block and `emit`'s docblock now state one contract in one shape. `USAGE` names the form (JSON Lines) once. A source-text pin holds the site count at 3 and asserts the superseded wording is gone.
- **The prose is anchored to a measurement.** A spawned `--help` case asserts the printed text carries the JSON Lines wording; a spawned `--once --json` case pins exactly one non-empty line; and the `--watch --json` case now also asserts the **whole stream does not parse as a single document** — the assertion that would have caught the defect, because it is the exact thing the old sentence promised.

## Task Commits

1. **Task 1 (RED): reproduce CR-05 on stderr, and derive the write-site census** — `e7dd4f61` (test)
2. **Task 1 (GREEN): one stderr chokepoint — every diagnostic through the sanitizer** — `b984b2b8` (feat)
3. **Task 2: the JSON framing prose describes the program, and cases measure it** — `338d9262` (docs)

## Files Created/Modified

- `scripts/board-dashboard.ts` — `warn` added as the single stderr write site; six call sites replaced; `USAGE_LINES` split out of `USAGE`; `refuse` narrowed to one line; the header's T-32-06 sentence corrected to name both channels; the three `--json` framing sentences corrected.
- `scripts/board-dashboard.js` — rebuilt by `npm run build`; `check:build-parity` clean.
- `scripts/board-dashboard.test.ts` — the AST census with its premise and discrimination cases, the two inertness cases, the positive control, the prose site count, the `--help` wording pin, the `--once --json` line count, and the whole-stream assertion added to the existing NDJSON case (+9 cases, 38 → 41 in this file).
- `.planning/phases/32-board-projector-cli-dashboard/32-13-RED-baseline.txt` — both reproductions against the committed artifact, with the instrument and why it counts code points.
- `.planning/phases/32-board-projector-cli-dashboard/32-13-GREEN-proof.txt` — both post-fix reproductions, the census output, the prose site count, the measured line counts, the corrected `USAGE` text, every gate result, the wall-time delta, and what is deliberately not closed.

## Decisions Made

1. **`warn` is variadic over lines, not the review's single-line sketch.** `sanitizeCell` removes the newline along with every other C0 code point. A single-line `warn` fed `parsed.message` would have collapsed the multi-line usage block into one unreadable line; a `warn` that preserved newlines inside the text would have let file bytes and argv tokens forge a second diagnostic. Making each argument one line puts the line boundary in the caller's hands and keeps the content unable to add one.
2. **`refuse` no longer folds `USAGE` into its message, and `USAGE` is held as `USAGE_LINES`.** This follows directly from decision 1: the alternative was for `run` to split `parsed.message` on a newline, and `parsed.message` quotes an unvalidated argv token.
3. **The test's control-range spelling is deliberately independent of the module's.** This is the one place in the file where a second spelling is the point rather than the defect: importing `CONTROL_CODE_POINTS` would make a regression that widened the module's class widen the measurement in the same commit.
4. **Code points, not bytes.** The em dash in every read-error diagnostic is UTF-8 `E2 80 94`. A raw-byte instrument could never report zero, so the RED baseline would have been measuring its own instrument.
5. **The `--watch` case was extended, not duplicated.** Plan 32-07 already spawns a bounded live-loop child with a deterministic SIGINT; a second one would have added ~2.5 s of wall time to measure the same contract.
6. **No requirement is marked complete.** `requirements.ready-ids` reports 0/2 ready for DASH-07 and DASH-08, because plan 32-14 also declares both and has no SUMMARY. That agrees with this plan's own success criterion that a gap-closure round flips no phase status.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The plan's single-line `warn` would have broken the usage block and left a line-forgery route open**

- **Found during:** Task 1 (the structural fix)
- **Issue:** The review's sketch is `warn(io, line)` applying `sanitizeCell` to one string. `run`'s usage path passes `parsed.message`, which `refuse` builds as `board-dashboard: <reason>\n\n<USAGE>`. `sanitizeCell` removes U+000A along with the rest of C0, so the sketch would have collapsed the whole usage block onto one line. Preserving newlines instead would have been worse: `<reason>` quotes an argv token, so a newline in argv would have let a caller forge additional diagnostic lines.
- **Fix:** `warn` takes lines variadically and sanitizes each; the usage block is held as `USAGE_LINES` and passed as separate arguments; `refuse` returns only its one line.
- **Files modified:** `scripts/board-dashboard.ts`
- **Verification:** `node scripts/board-dashboard.js --help` and the existing "exits 2 with the usage on stderr" case both still show the block laid out; the argv inertness case measures 0 control code points.
- **Committed in:** `b984b2b8`

**2. [Rule 3 - Blocking] The per-line contract phrase was split across comment line breaks, so the prose site count read 1 of 3**

- **Found during:** Task 2 (the prose site pin)
- **Issue:** The first attempt at the corrected header and `USAGE` wrapped "one complete JSON document per line" across a comment newline and across two `USAGE_LINES` elements. The site count derived from the source read 1 rather than 3 — a true measurement of prose that a human grepping for the contract would also have failed to find.
- **Fix:** Reflowed both so the contract phrase sits on one physical line at each of the three sites.
- **Files modified:** `scripts/board-dashboard.ts`
- **Verification:** `[32-13] --json framing prose sites: 3; superseded "exactly one JSON document" occurrences: 0`
- **Committed in:** `338d9262`

**3. [Rule 3 - Blocking] The plan asked for two new spawned line-count cases; equivalents already existed**

- **Found during:** Task 2
- **Issue:** Plan 32-07 already ships a `--once --json` single-line case and a bounded `--watch --json` NDJSON case. Adding two more would have duplicated a live-loop child (~2.5 s of CI wall time) to measure a contract already under measurement — which the plan's own warning about unbounded watch cases argues against.
- **Fix:** The genuinely missing assertion — the whole stream does NOT parse as one document — was added to the existing `--watch` case. One new `--once --json` case was added anyway, because it is the case that states the "exactly one frame unless `--watch`" half of the corrected sentence in the corrected sentence's own terms.
- **Files modified:** `scripts/board-dashboard.test.ts`
- **Verification:** measured delta 5.83 s at 38 cases → 5.88 s at 41 cases for this file.
- **Committed in:** `338d9262`

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking)
**Impact on plan:** All three strengthen the plan's own goals rather than widen them. Deviations 1 and 2 are corrections the plan could not have foreseen without running the code; deviation 3 avoids paying CI time for a measurement that already exists. No scope creep: no exit code, no published field and no rendered frame changed.

## Named Non-Goals, With Their Reasons

Recorded rather than silently dropped, as the plan requires:

- **`parseTicketDocument` running the ticket grammar's control check over `lines[0]` before quoting it** (suggested by CR-05). Not done. That would put a second sanitizing authority in a second module for a predicate this plan has just given exactly one authority at the emit boundary — the one-predicate-one-authority rule this repository has paid five gap-closure rounds to learn.
- **`--json --help` refusing, or emitting the usage as a JSON document** (suggested by WR-06). Not done. That is a change to the exit contract rather than a documentation defect, and D-18 did not decide it.

## Known Stubs

None. No placeholder, no skipped test and no unrun `<verify>` was introduced by this plan. The two `skipped` cases in the full-suite figure below are pre-existing root-privilege skips unrelated to this plan.

## Issues Encountered

None beyond the three deviations above. `npm run check:build-parity` reports FAILED while the rebuilt `scripts/board-dashboard.js` is uncommitted — that is the check working as designed, and it reports clean after each build output is committed.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts` | 41 passed (41), 5.88 s |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) | 74 files, 4776 passed \| 2 skipped, 419.92 s |
| `npm run build && npx tsc --noEmit && npx tsc -p tsconfig.tests.json` | exit 0 |
| `npm run check:build-parity` | clean |
| `npm run check:dashboard-readonly` | 24 passed; `EXPECTED_CLOSURE_FS_SYMBOL_COUNT` unmoved at 6 |
| `npm run check:nul-bytes` | ALL CHECKS PASSED |
| `npm run check:imperative-lexicon` | ALL CHECKS PASSED |
| `npm run check:banned-claims` | ALL CHECKS PASSED |
| `npm run check:public-docs` | ALL CHECKS PASSED |
| `npm run check:claim-anchors` | ALL CHECKS PASSED |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| CR-05 content reproduction, rebuilt binary | 0 control code points (RED: 3); refusal present, names `ABC-900.md` |
| CR-05 argv reproduction, rebuilt binary | 0 control code points (RED: 4); refusal present, exit 2 |
| `--once --json` line count | 1 |
| `--watch --json --interval 1000`, SIGINT at 2.4 s | 3 lines; 3/3 parseable individually; whole stream not parseable |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-05 and WR-06 are closed with reproductions on both sides of the fix. Plan 32-14 remains, and it is the plan that declares all eight DASH requirements; DASH-07 and DASH-08 stay open until it produces a SUMMARY.
- **The verification round's own lesson applies to this closure too.** A green suite is not proof for a safety invariant. What is offered here is narrower and checkable: the effect was reproduced before and after, the number of places the invariant is applied is derived from the module's AST rather than typed out, the collector's ability to fire was proven on four spellings, and the routes it cannot decide are collected and asserted empty. The residual the census cannot see is a stderr channel reaching this module by a route no name in the file mentions — for example a channel handed in through a value whose origin is another module. Nothing here asserts that away.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- `32-13-RED-baseline.txt`, `32-13-GREEN-proof.txt`, `32-13-SUMMARY.md`, `scripts/board-dashboard.ts` and `scripts/board-dashboard.test.ts` all present on disk.
- Commits `e7dd4f61`, `b984b2b8` and `338d9262` all present in `git log --all`.
- Every task `<acceptance_criteria>` re-run and recorded in the Verification Results table above.
