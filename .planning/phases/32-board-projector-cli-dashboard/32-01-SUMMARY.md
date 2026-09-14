---
phase: 32-board-projector-cli-dashboard
plan: 01
subsystem: tooling
tags: [typescript, markdown-grammar, cli, node-stdlib, board-projector, asvs]

requires:
  - phase: 31-uat-spec-integrity-and-admission
    provides: "the canonical-form admission posture (D-64) this module's parser adopts, and the two-sided derived-set discipline every pin moved here follows"
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "D-12's discriminated reader result, which D-11's SourceState/SnapshotResult follows"
provides:
  - "agent-factory/contracts/board.md — the normative DASH-01 board grammar: three legal heading suffixes, one opaque meta, one opaque trailer, the comment pre-pass, the update-line class"
  - "scripts/board-model.ts — the ONE board-grammar authority, pure by construction (zero node:fs in its import closure)"
  - "scripts/board-read.ts — the named fs-touching seam: realpath-once root resolution, fixed-literal subpaths, the three-arm SourceState, the six-source tuple"
  - "scripts/board-dashboard.ts — the CLI: parseArgs, main(argv, io), sanitizeCell, the thin D-17 frame, one JSON document, exit 2 for usage and an unreadable root"
  - "FactorySnapshot at schemaVersion 1 — the published shape a future web renderer consumes (D-19)"
  - "the `dashboard` npm script"
affects: [32-02, 32-03, 32-04, 32-05, 32-06, 32-07, 32-08]

actuals:
  tokens: 38815
  tasks: 3
  commits: 7
plan_head_before: caeb9335f351587f3ac1ca36f81e54cb5cf41a74

tech-stack:
  added: []
  patterns:
    - "Three-module purity boundary: pure grammar / named read seam / process owner, with the boundary expressed as an import edge rather than a docblock"
    - "Discriminated SourceState whose `unavailable` arm carries NO value, making 'render an empty board because the file was missing' unrepresentable"
    - "Fixed-literal subpaths declared as one data object (FIXED_SUBPATHS) so the ASVS V12 claim is checkable by reading one value"
    - "Bounded directory listing that REPORTS truncation instead of throwing — a hung read is a stale badge, never a frozen screen"
    - "Every board string passes sanitizeCell before reaching stdout: board content is untrusted input to a terminal emulator"

key-files:
  created:
    - agent-factory/contracts/board.md
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-tracer.test.ts
  modified:
    - package.json
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-foundation-guards.test.ts
    - scripts/context-io.test.ts

key-decisions:
  - "SourceState<T> is declared ONCE in the pure board-model.ts and re-exported from board-read.ts, because FactorySnapshot embeds it and a second declaration is the set-literal drift class"
  - "FactorySnapshot.board is `BoardModel | null` — the null is D-11's no-empty-board guarantee expressed in the type rather than in prose"
  - "The three D-05 heading suffixes are matched against the trailing parenthetical located by lastIndexOf, never against the whole line (T-32-01, the 34,494-character line)"
  - "A malformed factory.config.json carries the LEAN view as its stale value rather than throwing or carrying nothing (T-32-09, CLAUDE.md C6)"
  - "Five two-sided derived-set pins moved, each AFTER the gate had read the new file and reported zero findings over the wider corpus"

patterns-established:
  - "Tracer shape: every task ships production-quality code with its committed .js twin; stubs only where filling them needs no architectural change"
  - "RED phase ships a SHAPE-ONLY stub module so the failing run fails on behaviour assertions, never on module resolution"
  - "A control byte needed by a test is BUILT with String.fromCharCode rather than typed, so the source file carries none of its own"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-07, DASH-08]

coverage:
  - id: D1
    description: "agent-factory/contracts/board.md is the normative DASH-01 grammar, with filled Headings and Rows sections, and it is inside the imperative-lexicon and banned-claim corpora"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "npm run check:imperative-lexicon (0 findings over 49/49 elements, contracts part 2 -> 3)"
        status: pass
      - kind: integration
        ref: "npm run check:banned-claims (0 findings over 120/120 elements, kit part 74 -> 75)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/board-model.ts parses the REAL plans/board.md to 13 columns in on-disk order with zero rows, and the 48-line HTML comment contributes nothing"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#parses the kit board to 13 columns in on-disk order, each with zero rows"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#gives the kit board's 48-line comment ZERO columns and ZERO rows"
        status: pass
      - kind: e2e
        ref: "node -e parseBoard(plans/board.md) -> '13 columns, 0 rows'"
        status: pass
    human_judgment: false
  - id: D3
    description: "board-model.ts is pure — no node:fs specifier outside its comment lines, and no trimStart anywhere"
    requirement: DASH-08
    verification:
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*|/\\*)' scripts/board-model.ts | grep -c 'node:fs' -> 0"
        status: pass
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*|/\\*)' scripts/board-model.ts | grep -c 'trimStart' -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The amended row grammar (D-01 + D-22) admits all six measured shapes with nothing inside meta or trailer parsed"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#board-model — the row grammar (D-01 as amended by D-22) (9 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "scripts/board-read.ts resolves the root once through realpath, refuses an unresolvable root by name, joins only fixed-literal subpaths, and returns the three-arm discriminated result"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#board-read — root resolution (T-32-03) (4 cases)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#board-read — the discriminated result on THIS repository (D-11, D-13) (4 cases)"
        status: pass
      - kind: e2e
        ref: "node -e readSnapshot('.') -> 'ok, queue unavailable'"
        status: pass
    human_judgment: false
  - id: D6
    description: "An absent .grugops/ is `unavailable` with present:false, never stale; a malformed config is stale and the projection continues"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#reports an ABSENT `.grugops/` as unavailable, never as stale (D-13)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#marks a MALFORMED config stale and keeps going, rather than throwing (T-32-09)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The CLI exits 0 with exactly one JSON document at schemaVersion 1, exits 0 with an ANSI-free plain frame, and exits 2 with an empty stdout on a usage error or an unreadable root"
    requirement: DASH-07
    verification:
      - kind: e2e
        ref: "scripts/board-tracer.test.ts#board-dashboard — the process contract, driven as a child (D-18, T-32-08) (6 cases)"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js . --once --json | JSON.parse -> 'one json document, schemaVersion 1'"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js . --once | LC_ALL=C grep -c ESC -> 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "--interval is clamped BY REFUSAL rather than by silent rounding, and sanitizeCell strips every C0/DEL/C1 code point before board content reaches a terminal"
    requirement: DASH-07
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#CLAMPS --interval BY REFUSAL, never by silent rounding (T-32-10, ASVS V5)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#SANITIZES board content on its way to the terminal, not merely its own chrome"
        status: pass
    human_judgment: false
  - id: D9
    description: "The `dashboard` npm script is wired, no runtime dependency was added, the lockfile is untouched and install/ is untouched"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#wires the `dashboard` npm script and adds no runtime dependency"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- package-lock.json; git status --porcelain install/ (empty)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The committed .js twins are faithful builds and the whole tree stays green"
    verification:
      - kind: integration
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness (64/64 outputs fresh)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 67 files, 4423 passed, 0 failed"
        status: pass
    human_judgment: false
  - id: D11
    description: "The published schemaVersion 1 shape is the RIGHT shape for the six later plans and for a future web renderer (D-19, one-way)"
    verification: []
    human_judgment: true
    rationale: "D-19 is explicitly one-way: adding a field later is additive, reinterpreting one breaks the golden and every consumer. No test can say whether the field list is the one plans 32-02 through 32-08 and a later renderer actually need — only a human reading the shape against the contract can."

duration: 50 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 01: The Tracer — board grammar to CLI, end to end

**One command on a checkout now reads the real `plans/board.md` through a pure grammar module, a named read seam and a CLI, and prints either one `schemaVersion: 1` JSON document or one ANSI-free 13-column frame — with the parser provably free of `node:fs` and the 48-line HTML comment provably contributing nothing.**

## Performance

- **Duration:** 50 min
- **Started:** 2026-09-14T07:25:21Z
- **Completed:** 2026-09-14T08:15:14Z
- **Tasks:** 3
- **Files modified:** 16 (8 created, 8 modified)

## Accomplishments

- **The contract exists and is governed.** `agent-factory/contracts/board.md` states D-05's three legal heading suffixes, D-01-as-amended-by-D-22's row grammar (one opaque `meta`, one opaque `trailer`, nothing inside either interpreted), the comment pre-pass, the update-line class and the identifier bound. It entered the imperative-lexicon corpus and the banned-claim corpus **by existing**, and both gates report zero findings over the wider corpus.
- **The purity boundary is an import edge, not a sentence.** `scripts/board-model.ts` carries no `node:fs` specifier outside its comment lines, no `trimStart` anywhere, and imports neither `context-io.js` nor `claim.js` (both export writers). `scripts/board-read.ts` is the one module that touches the disk. Plan 32-06's guard now has a subject to walk.
- **The single highest-value case in the phase passes.** The board's own 48-line HTML comment — which contains a structurally valid four-space-indented mini-board — contributes zero columns and zero rows, because a comment-blanking pre-pass runs before any heading or row scan and blanks characters while preserving newlines.
- **The measured row grammar round-trips all six observed shapes.** Bare rows, parentheticals that close the line, compact positional meta, trailing prose after the balanced close, nested parentheses inside the meta, and epic rows — plus the one unbalanced parenthetical in 141 corpus rows, which degrades to `meta: null` rather than being refused.
- **The wire works end to end.** `node scripts/board-dashboard.js . --once --json` exits 0 with exactly one JSON document at `schemaVersion: 1` and an empty stderr; `--once` without `--json` prints a 13-column ANSI-free frame with Blocked last; a usage error or an unreadable root exits 2 with an empty stdout and a named one-line message on stderr.

## Task Commits

1. **Task 1 RED: failing tracer tests for the board grammar** — `0206c5e6` (test)
2. **Task 1 GREEN: the board-grammar contract and the pure parser** — `dd4b4fa6` (feat)
3. **Task 2 RED: failing tests for the fs-touching read seam** — `3140dff6` (test)
4. **Task 2 GREEN: the read seam — one resolved root, one discriminated result** — `bc1293c9` (feat)
5. **Task 3 RED: failing tests for the CLI end of the wire** — `a4a11efc` (test)
6. **Task 3 GREEN: the CLI end of the wire — `--once`, `--json`, exit codes** — `ec4d049a` (feat)
7. **Deviation fix: admit the board contract into the banned-claim scan set** — `7e6a7cef` (fix)

_Each `tdd="true"` task produced a RED commit and a GREEN commit. No REFACTOR commit was needed: no task's GREEN implementation had an obvious cleanup that the next task did not already own._

## Files Created/Modified

- `agent-factory/contracts/board.md` — the normative DASH-01 grammar. Headings, Rows, Comments and Update lines are filled; Conflicts, Staleness, Bounds and Reconciliation are named headings that plan 32-02 fills.
- `scripts/board-model.ts` / `.js` — the ONE board authority. `SCHEMA_VERSION`, `HEADING_SUFFIXES` + `HEADING_SUFFIX_COUNT`, `stripHtmlComments`, `splitRow`, `boardColumnName`, `boardHasColumn`, `kebab`, `parseBoard`, `matchUpdateLine`, plus the `schemaVersion: 1` types including `FactorySnapshot` and `SourceState`.
- `scripts/board-read.ts` / `.js` — the fs-touching seam. `SOURCE_NAMES` + `SOURCE_COUNT`, `FIXED_SUBPATHS`, `resolveRepoRoot`, `repoSubpath`, `listDirectoryBounded`, `readSnapshot`, `BoardReadError`, `SnapshotResult`, `ReadError`, `Conflict`.
- `scripts/board-dashboard.ts` / `.js` — the CLI. `parseArgs`, `main(argv, io?)`, `sanitizeCell`, `POLL_FLOOR_MS`, `DEBOUNCE_MS`, `INTERVAL_HARD_FLOOR_MS`, `Options`, `ParsedArgs`, `DashboardIo`.
- `scripts/board-tracer.test.ts` — 74 cases over the real board, the read seam and the CLI, with five `PREMISE:` assertions guarding the harness itself.
- `package.json` — one new script, `dashboard`. No `dependencies` key; the lockfile is byte-unchanged.
- `scripts/check-imperative-lexicon.{ts,js,test.ts}`, `scripts/check-banned-claims.{ts,js}`, `scripts/check-foundation-guards.test.ts`, `scripts/context-io.test.ts` — the five derived-set pins, moved with entrants named.

## Decisions Made

1. **`SourceState<T>` is declared once in `board-model.ts` and re-exported from `board-read.ts`.** The plan's task-2 action says to export the union from the read seam. `FactorySnapshot` embeds one state per source and belongs in the pure module (it is the published shape, D-19, and carries no I/O), so declaring the union in `board-read.ts` as well would make the two modules mutually type-dependent — and declaring it twice is precisely the set-literal drift class this repository has already paid for. It is therefore declared in the module with no imports at all, and published from the module that produces it. The exported surface named in the plan is unchanged.

2. **`FactorySnapshot.board` is `BoardModel | null`.** D-11 forbids "an empty board" as an output state distinct from "zero rows under real headings". A non-nullable field would force a caller with no readable board to synthesize an empty one, which is exactly the confusion the value-less `unavailable` arm exists to prevent. `board` is `null` if and only if `sources.board` is `unavailable`, and the top-level discriminant says so first.

3. **The heading suffixes are matched against the trailing parenthetical, not the whole line.** `matchHeading` locates the parenthetical with one `lastIndexOf("(")` and applies a bounded, doubly-anchored pattern to the short tail. The measured corpus carries a 34,494-character line and this repository has a recorded superlinear-backtracking incident, so a whole-line lazy pattern was not worth the risk (T-32-01).

4. **A malformed config carries the LEAN view as its stale value.** Pattern 4's `stale` arm requires a value and a first read has no previous one. CLAUDE.md C6 requires the kit to run lean when config is absent or unusable, so the lean view is the honest carried value, and the stale badge stops anything reading it as the dial (T-32-09).

5. **The top-level result discriminant is the board's state, degraded by the config's.** An absent `.grugops/` does not make the result unavailable — that is exactly what D-12's per-source staleness exists to prevent. Verified on this tree: `readSnapshot('.')` reports `ok` while `sources.queue` reports `unavailable`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Five two-sided derived-set pins refused the new files until they were moved**

- **Found during:** Tasks 1, 2 and 3 (each new file tripped the pins that count its class)
- **Issue:** This repository pins every derived corpus two-sided, so a new governed markdown file or a new tracked `.ts` module turns a gate or a test red until its pin is moved with its entrant named. Five pins fired: `GOVERNED_CORPUS_COUNT` (48 → 49, `agent-factory/contracts/board.md` entering the contracts part 2 → 3), `BANNED_CLAIM_SCAN_COUNT` (119 → 120, the same file entering the kit part 74 → 75), `NON_TEST_MODULE_COUNT` (79 → 82 across three tasks), the two `scripts/`-scoped module enumerations (52 → 55), `TRIPWIRE_MODULES` (60 → 61, `scripts/board-tracer.test.ts`), and `CONFIG_PATH_SITE_COUNT` (9 → 10, `scripts/board-read.ts`). The plan named none of them.
- **Fix:** Each pin moved by exactly the arithmetic its own refusal message published, with a paragraph naming the entrant, its part and why the owner answers are unchanged — the discipline the existing entries in each file already follow. **Every pin moved AFTER the gate had read the new file**, so the entrant's admission was measured rather than assumed: the imperative-lexicon run reports 0 findings over 49/49 and the banned-claims run 0 over 120/120.
- **Files modified:** `scripts/check-imperative-lexicon.ts` / `.js` / `.test.ts`, `scripts/check-banned-claims.ts` / `.js`, `scripts/check-foundation-guards.test.ts`, `scripts/context-io.test.ts`
- **Verification:** `npm run check:imperative-lexicon`, `npm run check:banned-claims` and the full suite all green
- **Committed in:** `dd4b4fa6`, `bc1293c9`, `ec4d049a`, `7e6a7cef`

**2. [Rule 2 - Missing Critical] `scripts/board-read.ts` annotated as a NON-governance config reader (AUTO-06)**

- **Found during:** Task 3 (the full-suite run after the CLI landed)
- **Issue:** `scripts/context-io.test.ts` derives every tracked source that resolves a factory config path and requires each to be annotated, because AUTO-06 permits exactly ONE governance reader. `board-read.ts` names `agent-factory/config/factory.config.json` as a fixed literal, so it entered that derived set undocumented — which the test correctly reds rather than ignores.
- **Fix:** Added the annotation naming it a non-governance dial reader: it reads `mode`, `id_prefix` and `wip_limits` so the dashboard can SHOW the dial and cross-check the board's WIP numbers, it decides nothing, and a malformed dial marks the source stale rather than changing any behaviour. `CONFIG_PATH_SITE_COUNT` moved 9 → 10. AUTO-06's single governance reader (`scripts/context-io.ts`) is untouched.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** `scripts/context-io.test.ts` green (the AUTO-06 case asserts the governance reader is still exactly `scripts/context-io.ts`)
- **Committed in:** `ec4d049a`

**3. [Rule 2 - Missing Critical] `FactorySnapshot.board` made nullable**

- **Found during:** Task 2 (designing the unavailable arm)
- **Issue:** The type as written in task 1 would have forced a caller with no readable board to synthesize an empty `BoardModel`, which is the exact state D-11 forbids as an output.
- **Fix:** `board: BoardModel | null`, documented in place, with the invariant stated: null if and only if `sources.board` is `unavailable`. This touched `scripts/board-model.ts`, which is not in task 2's declared `<files>` list.
- **Files modified:** `scripts/board-model.ts` / `.js`
- **Verification:** `scripts/board-tracer.test.ts#returns an UNAVAILABLE result, never an `ok` result with zero columns`
- **Committed in:** `3140dff6`

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing-critical)
**Impact on plan:** All three were required for the plan's own artifacts to land on a green tree. None widened scope: the pin moves are bookkeeping the repository's own discipline demands of every entrant, the AUTO-06 annotation is a required disclosure, and the nullable field is D-11 expressed in the type rather than in prose.

## Design notes recorded rather than deviated

- **`repoSubpath` is exported and `listDirectoryBounded` is exercised now.** The plan's task-2 action specifies importing `readdirSync` and `MAX_WALK_ENTRIES`, but the four sources those would serve are deliberately unread until plan 32-03. Rather than leave dead imports (which `noUnusedLocals` refuses anyway), the bounded lister is a real exported function with its own cases — the `.tmp-` filter and the absent-directory arm — so plan 32-03 wires an already-tested helper instead of writing one.
- **`_previous` carries a leading underscore.** The parameter is declared now so plan 32-03's last-good carry-forward changes no caller; the underscore marks it unconsumed, and the docblock says so.

## Known Stubs

All five are plan-declared functionality gaps, named in the plan's objective as "allowed only where filling them later needs no architectural change". Every field involved exists in `schemaVersion: 1` from this commit, so filling it moves no boundary. All five are recorded in `.planning/WINDOWS.md` (entries 169–173, status `open`).

| File | Stub | Filled by |
|------|------|-----------|
| `scripts/board-model.ts` | `parseBoard` returns `updates`, `nonColumnSections`, `unparsed` and `bounds` empty or zero | plan 32-02 |
| `scripts/board-read.ts` | `tickets`, `queue`, `context` and `traceability` return the `unavailable` arm unread | plan 32-03 |
| `scripts/board-read.ts` | Reads are a single guarded `readFileSync`; read-verify-reread and last-good carry-forward are absent | plan 32-03 |
| `scripts/board-dashboard.ts` | `--watch` is accepted, reported on stderr and not honoured | plan 32-03 |
| `scripts/board-dashboard.ts` | The frame is the thin D-17 skeleton: no stale badge, conflict list, Now-running block, truncation or TTY redraw | plan 32-07 |

There are no architectural gaps. The three-module boundary, the published `schemaVersion: 1` shape, the discriminated result, the stdout/stderr/exit-code contract and the sanitizer are all final.

## Threat Flags

None. Every file created here sits inside the plan's own `<threat_model>`: the parser (T-32-01), the root resolution (T-32-03), the terminal render (T-32-06), the entry-guard tail (T-32-08), the config parse (T-32-09) and the interval validation (T-32-10) each carry the mitigation the register assigned them. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced — the projector is read-only by construction and opens no socket.

## Issues Encountered

- **The tracer feedback gate ran and passed.** Task 1 is `type="tracer"` with the default `gate="blocking"`; auto mode is off and `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` carries only automated checks, so the gate re-ran the whole `<verify>` block end to end before any expansion task. All four checks passed and expansion proceeded with no checkpoint.
- **HEAD is `main`, which the executor's own pre-commit assertion classifies as protected.** This project sets `git.branching_strategy: "none"` and `workflow.use_worktrees: false`, the orchestrator dispatched this plan explicitly as a sequential executor on the main working tree, and every prior phase in this repository committed the same way. Commits proceeded on `main`; recorded here so the choice is visible rather than silent. Adding `git.allow_default_branch_commits: true` to `.planning/config.json` would make the tree's intent explicit to the guard, and is left to the user rather than changed unilaterally.
- **Requirement IDs are NOT yet marked complete in `REQUIREMENTS.md`, and that is correct.** `requirements.ready-ids` reports 0 of 5 ready, because plans 32-02 through 32-08 declare the same `DASH-*` IDs and have no summaries yet. They become ready when the last declaring plan finishes.

## User Setup Required

None — no external service configuration required. The dashboard runs from a checkout with bare Node 22+ and zero runtime dependencies.

## Next Phase Readiness

Ready for **plan 32-02** (the full line partition, the fuzz-corpus axes, and the Conflicts / Staleness / Bounds / Reconciliation sections of the contract). The wave-1 boundary it builds on is fixed:

- `parseBoard(text) -> BoardModel` with all seven fields declared; 32-02 fills four of them and adds no field.
- `agent-factory/contracts/board.md` carries the four named headings 32-02 fills, and its axes are already the source the fuzz corpus derives from.
- `readSnapshot(repoRoot, previous?) -> SnapshotResult` — 32-03 fills the four unread sources and the read-verify-reread behind an unchanged signature.
- `main(argv, io?) -> number` with `sanitizeCell` and the header/column skeleton — 32-07 grows the frame without moving either.
- `jsImportClosure(ROOT, "scripts/board-dashboard.js")` now resolves to a three-module closure whose only `node:fs` import set is `{existsSync, readFileSync, readdirSync, realpathSync, statSync}` — the subject plan 32-06's guard needs.

**One concern to carry forward:** five two-sided pins moved in this plan alone, and plans 32-02 through 32-08 will each add tracked `.ts` files that move `NON_TEST_MODULE_COUNT` and the two `scripts/`-scoped enumerations again. Each bump is cheap, but a plan that forgets one leaves the tree red for a reason unrelated to its own work. Later plans should run the full suite before their final commit rather than only their own test file.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- All 8 files listed in `key-files.created` exist on disk (`[ -f ]` for each: 8 FOUND, 0 MISSING).
- All 7 commit hashes listed above resolve in `git log --oneline --all` (7 FOUND, 0 MISSING).
- `commits: 7` is MEASURED: `git rev-list --count caeb9335..HEAD` = 7, against the ledger base recorded in `plan_head_before`.
- Every task's `<acceptance_criteria>` was executed and passed; every plan-level `<verification>` command was executed and passed.
- Full suite: `npx vitest run --exclude '**/scripts/e2e/**'` — 67 files, 4423 passed, 2 skipped, 0 failed.
