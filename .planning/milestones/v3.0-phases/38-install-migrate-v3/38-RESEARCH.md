# Phase 38: install --migrate v3 - Research

**Researched:** 2026-10-28
**Domain:** Installer state migration (TypeScript tooling layer, Node 22+ `node:fs`, no new packages): a whole-or-nothing, proven, idempotent move of a host repository's planning state from `plans/` to `memory-bank/plans/`
**Confidence:** HIGH for the in-repo facts and seams (read this session); MEDIUM for the commit protocol and the proof design (recommendations built on read code); LOW for the real chess shapes (the user's copy is not on this machine, so only the committed trimmed replay fixture was read)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (not re-asked)
- [v3.0 D-8] The original monolith files stay unchanged in `memory-bank/plans/archive/pre-v3/`, outside
  every budget. Split files are new files. Nothing is deleted or rewritten in place.
- [Phase 36 D-01, D-02, D-05, D-06] Layout is detected by board-file presence. Roles treat "both" as new
  layout with a warning, but migrate refuses "both" (MIGRATE-04). The notice wording "run
  `install --migrate`" is already final. This phase must make sure the v2.x "already migrated to the
  two-root layout ... Nothing to do." arm (`install/install.ts`, around line 6580) no longer answers a
  repo that still holds `plans/board.md`, and a test pins it (Phase 36 WR-04, roadmap criterion 6).
- [Phase 37 D-04, D-05, D-14] The marker is `memory-bank/plans/.layout` with content `layout: v3`
  (`LAYOUT_MARKER_REL`, `LAYOUT_MARKER_CONTENT`). Migrate writes it as its last step.
- [Phase 37 D-03] `trace-render` already reads `.grugops/archive/context` (`CONTEXT_ARCHIVE_REL`), so
  moving finished context folders there drops no trace rows.
- [Phase 37 D-08, D-15] `state-roll` owns Done-row and progress rollover with its own conservation check.
  Archived Done rows stay placed through the `boardArchive` reader source.
- Board contract: the ticket body section `## Board notes` holds former row trailer text, copied
  verbatim. Trailers and meta are never parsed. No new ticket frontmatter key (v3.0 D-9).
- The existing `--migrate` is whole-or-nothing, with a pre-check before the first write. The new arm
  keeps that shape. Research proposes pure plan functions in a new `install/state-migrate.ts`, with
  `install.ts` only executing the plan and writing ledger entries.
- Every scratch install in tests and agent runs sets `GRUGOPS_HOME`.
- A frozen pre-v3 fixture lands in the first plan, before any migrate code (research Pitfall 2).

#### Board split
- **D-01:** Migrate cuts only the trailer from each row. The row becomes `- [ID] title  (meta)`, with the
  meta kept verbatim. Nothing is parsed out of meta or trailer. A row still over the 160-character budget
  after the cut is reported by name and size, not rewritten.
- **D-02:** The cut trailer is appended verbatim as a new `## Board notes` section at the end of that
  ticket's file, after a one-line provenance note (from the pre-v3 board, with the migration date). The
  section is always new, even when the ticket already has a `## Board notes` heading. The ticket's
  original file is kept unchanged under `archive/pre-v3/`, and the ticket with notes appended is written
  as a new file.
- **D-03:** A row with no ticket file does not get a new ticket. Its trailer goes verbatim to
  `memory-bank/plans/archive/pre-v3/board-orphan-notes.md`, one `## [ID]` section per row. Dry-run lists
  each such row. No ticket frontmatter is invented.
- **D-04:** Every `_Updated:` line goes verbatim to `memory-bank/plans/archive/pre-v3/board-updates.md`.
  The migrated board carries none. Agents write the one allowed line on their next update.

#### Trace and NFR split
- **D-05:** The old hand-appended `traceability.md` goes to `archive/pre-v3/` only. It is never split,
  because `trace-render` refuses hand-written trace files. As its last split step, migrate runs the
  materialized `tools/grugops/trace-render.js` against the staged tree, so the repo leaves migrate with a
  fresh index and per-ticket trace files built from note refs. If the render exits 2, migrate reports it
  by name and the seed's empty index stays. A render that could not run never counts as a pass.
- **D-06:** Each `nfr/NFR-xxx.md` holds the old table's header line and that NFR's row verbatim, then
  every section whose heading names that NFR ID (and only that one), verbatim. Sections that name no NFR,
  or name several, go to `memory-bank/plans/archive/pre-v3/nfr-notes.md`. That file sits outside `nfr/`,
  so the index-to-files rule (Phase 37 D-13) holds. Each index line
  `- [NFR-xxx](nfr/NFR-xxx.md) <category>: <target>` copies the category and target cell text without
  rewording it.

#### Budgets and marker
- **D-07:** Migrate always writes the marker after a successful split and proof, whatever the resulting
  sizes. Its closing lists every over-budget file with its bytes and its budget. The gate stays unblocked
  (Phase 37 D-12 records `state-check` exit 1 as an observation), and there is no exemption list
  (Phase 37 D-11). — **Reversibility:** costly — every migrated host repo carries the marker, and a
  later "marker only when clean" rule would need a second migrate path.
- **D-08:** After the split, migrate runs the same rollover that `state-roll.js` performs, reusing its
  plan and conservation functions rather than a second copy. Older Done rows go to
  `archive/board-done.md`. Dated `##` progress entries in `memory-bank/60-progress.md` go to
  `archive/progress.md`. Standing directives are not moved (still deferred).

#### Failure and state machine
- **D-09:** The conservation proof compares the original files against the split outputs, never against
  the `pre-v3` copies, which hold every line and would make the proof always pass. The multiset of
  non-blank original lines (exact bytes) must equal the multiset of lines in the split outputs, after
  removing a closed, named set of generated lines. The split outputs are the board, the appended
  `## Board notes` sections, the orphan notes, board updates, NFR files and NFR notes, plus the rolled
  Done and progress archives. The generated lines are provenance lines, headings migrate writes, and
  index lines. Separately, each `pre-v3` copy is byte-compared to its original. The old traceability
  file is archive-only, so it gets the byte compare only.
- **D-10:** Migrate builds the whole v3 tree in a staging directory beside the target, proves it, and
  only then renames it into place and moves `plans/` out of the way. On any failure (proof or I/O), only
  the staging directory is removed, `plans/` is untouched, the repo is exactly as before, and a re-run
  starts clean. The reason is printed by name. — **Reversibility:** reversible
- **D-11:** A v1.0 repo (in-repo `agent-factory/`) that also has the old `plans/` board is migrated in one
  run. The two-root arm runs first, then the v3 state arm, with one pre-check that covers both before any
  write.
- **D-12:** "Neither" layout (no board in either place): the v3 arm prints that there is no planning state
  to migrate and writes nothing, not even the marker. The other `--migrate` arms run as they do today. A
  plain install seeds v3 state.
- **D-13:** "Both" layout and a non-empty `.grugops/queue/claimed/` are pre-check refusals (MIGRATE-04).
  Nothing is written.

#### Context archive (opt-in, MIGRATE-06)
- **D-14:** With the opt-in flag, a `.grugops/context/<task>/` folder moves (rename only, never changed)
  to `.grugops/archive/context/` when its ticket ID has a row in the Done column or in
  `archive/board-done.md` after migration. Folders whose ID matches no ticket stay in place and are
  listed.

#### Fixture and dogfood
- **D-15:** The frozen pre-v3 fixture is trimmed from a real copy of `cli-chess-example`: real rows,
  trailers, `_Updated:` lines, trace rows and NFR sections, kept small and committed. The splitter must
  meet real hand-written shapes. The copy is **not** on this Linux machine yet. The research path is on
  macOS. The user will place a copy here and give the path, and the first plan needs it.
- **D-16:** MIGRATE-07 runs on that local copy, never the original, under a scratch `GRUGOPS_HOME`. It
  records before and after sizes per state file.

### Claude's Discretion
- The opt-in flag name (research proposes `--archive-done-context`).
- The staging directory name and location, as long as it sits on the same filesystem as the target so
  the final step is a rename, and uninstall and prune never mistake it for kit content.
- Dry-run output format (per-file byte counts are required) and the wording of refusals, the no-op and
  the over-budget list (clear voice, names the file and the command).
- How a second run proves the no-op. Board present plus a valid marker must yield no write. Test it
  byte for byte.
- The exact closed set of generated lines that D-09 removes, as long as it is named in one place and
  tested.
- How migrate gets `trace-render`'s logic to the staged tree (spawn the materialized runnable or call
  shared code), as long as there is one render owner.

### Deferred Ideas (OUT OF SCOPE)
- Moving standing directives out of a host's `60-progress.md` into `50-decisions/`: a manual cleanup or a
  later phase (carried from Phase 37).
- Archiving `.grugops/queue/done/` and `memory-bank/50-decisions/` (v3.0 D-7) through migrate: not in
  MIGRATE-01..07.
- A legacy per-ticket split of the old traceability (`archive/pre-v3/traceability/<ID>.md`): considered,
  not chosen.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGRATE-01 | `install --migrate` moves an old-layout repo to v3; `--dry-run` prints every planned move and split with per-file byte counts and writes nothing | §State machine; §Pattern 1 (pure plan, thin executor, DRY_RUN renders the same plan); **Pitfall 1: `install.js` has no `--dry-run` flag today, only `DRY_RUN=1`** |
| MIGRATE-02 | Originals unchanged in `memory-bank/plans/archive/pre-v3/`, split files new, nothing deleted or rewritten in place | §Pattern 3 (commit protocol; `plans/` moved whole into the archive, proven by `treeRecord`); Open Question 1 |
| MIGRATE-03 | Line-conservation proof; roll back on failure | §Pattern 4 (two-stage proof: split multiset with rejoin of cut rows, then `executeRoll`'s own proof); §Pattern 3 rollback; fault-inject harness for tests |
| MIGRATE-04 | Detect old/new/both/neither; refuse both and non-empty `queue/claimed/`; marker; byte-identical second run; v2.x two-root case not short-circuited | §State machine table; §Code Example 1; Pitfall 3 (the `isMigrated` arm at `install.ts:6596`) |
| MIGRATE-05 | Trailers copied verbatim into ticket bodies, never reinterpreted | §Pattern 2 (use `splitRow` on the RAW line; never `parseBoard`'s `trailer`, which is truncated at 1,024 chars); ticket identity rule |
| MIGRATE-06 | Opt-in move of finished-ticket context folders; trace render still reads them | §Pattern 5; trace-render already reads both roots (verified); Open Question 4 (task-to-ticket rule) |
| MIGRATE-07 | Dogfood on a copy of `cli-chess-example` under scratch `GRUGOPS_HOME`, before/after sizes | §Environment Availability (copy absent: human checkpoint); §Validation Architecture |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** tooling is TypeScript compiled with `tsc` to committed `.js`, freshness-checked; Node 22+; dev deps only `{typescript, vitest, @types/node}`; zero runtime deps on hosts. This phase adds no package.
- **Installers:** idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content.
- **No fabrication:** unknown commands are `UNKNOWN - verify`; never fake a passing gate, test result or citation. A render or proof that could not run never counts as a pass (D-05).
- **Single-source:** one owner per rule; generated copies only through the embed generator plus a freshness gate (Phase 36/37 rule).
- **Voice:** clear professional voice in every installer string (safety surface).
- **Brand:** lowercase `grugops`.
- **Safety:** humans hold merge and deploy (not touched by this phase).
- **GSD workflow enforcement:** edits only through GSD commands.
- **Repo-local rules found while researching (treat as constraints):**
  - `install/` never imports `scripts/` (33.1 D-18/D-28; pinned by `install/install.test.ts` "model delivery ... SPAWNING it, never by importing anything under scripts/"). install.ts reaches scripts only by spawning with `process.execPath`, never a shell. [VERIFIED: install/install.test.ts:4279-4289]
  - A new state path is added to `install/state-layout.ts` FIRST, as one constant; that module is constants only. [VERIFIED: install/state-layout.ts:14-21]
  - The board grammar has exactly one reader, `scripts/board-model.ts`; a generated copy inside a fresh `EMBED_SPECS` region is the sanctioned way to use it elsewhere. [VERIFIED: agent-factory/contracts/board.md:15-18; scripts/generate-runnable-embeds.ts:1-9]
  - Every mutating `node:fs` call site under `install/*.ts` is pinned in `install/installer-fs-census.test.ts` with its DRY_RUN classification; every content read of a user path goes through `install/user-file.ts` `readUserFile`. [VERIFIED: install/installer-fs-census.test.ts:1-30]
  - The old-spelling gate (`scripts/check-state-paths.ts`) fails on any `plans/` spelling or legacy path outside its allow-list; "never widen the allow-list to clear it". [VERIFIED: scripts/check-state-paths.ts:58-68, 246]

## Summary

Phase 38 adds a v3 state arm to the existing `--migrate` branch of `install/install.ts`. Everything it needs already exists in the repository except the arm itself: the layout reader (`stateLayout()`, `install.ts:878-895`), every v3 path and budget (`install/state-layout.ts`), the row grammar (`scripts/board-model.ts` `splitRow`, `parseBoard`, `parseTicketDocument`), the Done and progress roll planners plus an injected-I/O executor with its own line-conservation proof (`scripts/state-rules.ts` `planDoneRoll` ... `executeRoll`), the trace renderer that already reads both context roots, a whole-tree content record (`install/user-file.ts` `treeRecord`), and an out-of-process fault-injection harness for rollback tests (`scripts/fault-inject.test-support.ts`). The hard problems are not algorithms; they are seams: install may not import `scripts/`, the board grammar may have only one reader, every new fs call site is a census row, and the existing `isMigrated` arm short-circuits before any v3 step (WR-04).

The recommended shape: a **pure planner** `install/state-migrate.ts` that carries a **generated embed region** (the row grammar, the ticket grammar, the roll planners and proof, `sectionEndIndex`, `markerState`, the budget-finding functions) produced by `scripts/generate-runnable-embeds.ts` through a new non-runnable target kind, so there is no second copy and no `scripts/` import. `install.ts` reads every input through `readUserFile`, asks the planner for a plan (refusals, outputs, generated-line positions, proof result, over-budget list, dry-run lines), runs the in-memory proof in the **pre-check** (so a proof failure refuses before any write), then builds the staging tree, re-reads and re-proves it on disk, and commits with a short, rollback-able rename sequence. `plans/` itself moves whole into `memory-bank/plans/archive/pre-v3/plans/`, so the originals are the very same files, proven unchanged by `treeRecord` equality before and after.

Two literal mismatches between the success criteria and the code need a decision before planning: `install.js` has **no `--dry-run` flag** (only `DRY_RUN=1`, and an unknown flag exits 2), and D-05's "run trace-render against the staged tree" cannot work as written, because trace-render reads notes only from `<root>/.grugops/context` and `<root>/.grugops/archive/context` and refuses a symlink anywhere on those paths. The research recommends adding `--dry-run` as an alias of `DRY_RUN=1`, and running the renderer against the target root right after the staged tree is renamed into place (still before the marker).

**Primary recommendation:** Build `install/state-migrate.ts` as a pure planner over an embedded copy of the board grammar and roll rules; prove in memory at pre-check and again on disk in staging; commit by `rename(staging → memory-bank/plans)` then `rename(plans → memory-bank/plans/archive/pre-v3/plans)` with rollback; render, then write the marker last.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Layout detection (old/new/both/neither/unreadable) | Installer CLI (`install.ts` `stateLayout()`) | Pure planner (marker validity via embedded `markerState`) | `stateLayout()` already exists and is the one board-presence reader (Phase 36 D-01). |
| Board split, ticket append, orphan/updates files, NFR split | Pure planner (`install/state-migrate.ts`) | Embedded authorities (`board-model`, `state-rules`, `frontmatter`) | Pure functions are unit-testable on the frozen fixture; the grammar stays single-owner through the embed. |
| Done and progress rollover (D-08) | Pure planner calling embedded `state-rules` planners and `executeRoll` over an in-memory `RollIo` | `state-roll.js` remains the host owner | `executeRoll` takes its file operations as a parameter, so the same proof runs in memory. |
| Conservation proof (D-09) | Pure planner (in-memory, at pre-check) | Installer CLI (re-read of staged files, second proof) | Proving before the first write turns a missed shape into a refusal, not a rollback. |
| Reading user state, staging, commit, rollback | Installer CLI (`install.ts`) | `install/user-file.ts` (`readUserFile`, `wayTo`, `treeRecord`, `pathLimitProblem`) | The fs census requires every read through `readUserFile` and every mutation as a pinned call site. |
| Trace render after the move (D-05) | Kit runnable `trace-render.js` (spawned, `process.execPath`, no shell) | Installer CLI (reports exit code by name) | One render owner; install never imports `scripts/`. |
| Context folder archive (MIGRATE-06) | Installer CLI (renames) | Pure planner (selects folders) | Renames only; selection is pure over names and the post-migration board. |
| Layout marker (last step) | Installer CLI | `state-layout.ts` constants | Marker written last so a partial migrate leaves none (contract § The layout marker). |
| Over-budget closing (D-07) | Pure planner (embedded budget-finding functions over the planned outputs) | `state-check.js` (optional cross-check after the marker) | Computing from the plan also works under DRY_RUN. |

## Standard Stack

No external package is added. The "stack" is in-repo modules to reuse.

### Core (reuse, do not re-implement)
| Module / symbol | Where | Purpose in this phase |
|---|---|---|
| `stateLayout()` | `install/install.ts:878-895` | Old/new/both/neither/unreadable by board presence. [VERIFIED: read] |
| State constants | `install/state-layout.ts` | Every path, budget, the marker. Add the new archive paths here first. [VERIFIED: read] |
| `splitRow`, `parseBoard`, `normalizeDocument`, `stripHtmlComments`, `isTicketId`, `parseTicketDocument` | `scripts/board-model.ts` | Row grammar, ticket identity. Embed, never restate. [VERIFIED: read] |
| `planDoneRoll`, `planArchiveInsert`, `doneDuplicateRefusal`, `planProgressRoll`, `planProgressAppend`, `assembleRoll`, `checkConservation`, `executeRoll`, `lineEndings`, `lineEndingRefusal`, `utf8Bytes`, `markerState`, `boardBudgetFindings`, `doneRowFindings`, `indexLineFindings`, `fileBytesFinding`, `parseNfrIndex`, `nfrLinkTarget`, `stripControlChars` | `scripts/state-rules.ts` (imports nothing) | Roll, proof, marker validity, budgets, NFR index grammar. [VERIFIED: read exports list] |
| `sectionEndIndex` | `scripts/frontmatter.ts` | The one section-extent owner (LANG-07, Phase 37 D-16); NFR section extents and progress entries. [VERIFIED: read] |
| `readUserFile`, `readForWrite`, `wayTo`, `treeRecord`, `realPathThroughExisting`, `pathLimitProblem`, `kindAt` | `install/user-file.ts` | Bounded reads (8 MiB), hazard checks, whole-tree record. [VERIFIED: read] |
| `generate-runnable-embeds.ts` + `runnable-embeds-freshness.ts` | `scripts/` | Generate the embedded region into the new module; CI fails on drift. [VERIFIED: read] |
| `trace-render.js` | `scripts/runnable-ref/` (materialized to `tools/grugops/`) | Spawned once after the move. Reads `CONTEXT_REL` and `CONTEXT_ARCHIVE_REL`. [VERIFIED: scripts/runnable-ref/trace-render.ts:1161] |
| `fault-inject.test-support.ts` | `scripts/` | Fail one fs call at a named site from outside the program (rollback tests without a shipped test hook). [VERIFIED: read] |
| `makePreV3StateFixture`, `makeOldLayoutFixture`, `runInstall`, `snapshotTree` | `install/installer-paths.test-support.ts` and siblings | Test fixtures and byte-identical tree snapshots. [VERIFIED: read] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embedding the grammar and roll rules into `install/state-migrate.ts` | A fourth runnable `scripts/runnable-ref/state-migrate.ts` that install spawns | Keeps `install/` free of generated code, but moves the whole migrate (staging, proof, commit, ledger) across a process boundary, contradicting the carried-forward "pure planner in `install/state-migrate.ts`, install.ts executes". Not recommended. |
| Embedding | Restating `splitRow` in `install/` with an equivalence test (the `install/checkpoint-ask-rules.ts` precedent) | Violates the board contract's "no other module parses board rows". Not recommended. |
| In-memory `executeRoll` | Spawning `state-roll.js <staging-root>` | Works, but the staging root must then also hold `memory-bank/60-progress.md`, DRY_RUN would need an on-disk staging tree, and the roll output would have to be parsed from stdout. Not recommended. |

**Installation:** none. Before any `npx tsc`/`npx vitest`, run `npm ci` (see Environment Availability: `node_modules` is absent and `npx` then fetches the wrong packages).

## Package Legitimacy Audit

This phase installs no external package.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 user: node install/install.js --migrate [--dry-run] [--archive-done-context] --target <repo>
   |
   v
 arg parse --> guards (self-checkout, kit-home overlap) --> [plain-install pre-v3 refusal: skipped under --migrate]
   |
   v
 selection --> INSTALL_REFUSAL (marker unusable -> exit 3)
   |
   v
 --migrate branch
   |-- kit layout: detectOldLayout()  {isOldLayout | isMigrated | isClean}
   |-- state layout: stateLayout()    {pre-v3 | current | both | fresh | unreadable}
   |-- v3 PLAN (pure, in memory): read plans/**, 60-progress.md, seed via readUserFile
   |        -> refusals | outputs | generated-line positions | in-memory PROOF | over-budget | dry-run lines
   |
   |-- ONE PRE-CHECK (D-11, D-13): config carry + kit plan (when the install run will run) + v3 refusals + proof
   |        any refusal --> migrate INCOMPLETE banner, exit 3, NOTHING written
   |
   |-- isMigrated AND state != pre-v3 --> existing "already migrated" arm (no write) --> exit
   |-- isOldLayout --> migratePreSteps (config carry, agent-factory backup)
   |-- (isMigrated AND pre-v3) or isOldLayout or isClean --> fall through to the install run
   v
 install run: copyKit --> adapters --> ... --> [V3 ARM EXECUTES HERE when the plan has work]
   |      build staging (copies + split outputs + seed files) --> re-read --> on-disk PROOF
   |      --> COMMIT: rename staging -> memory-bank/plans ; replace 60-progress.md (if rolled) ;
   |                  rename plans -> memory-bank/plans/archive/pre-v3/plans ; treeRecord equality
   |          failure at any step --> roll back the steps done --> remove staging --> verify line, state as before
   |      --> (opt-in) rename finished context folders -> .grugops/archive/context/
   |      --> spawn trace-render.js <target> (exit 0 ok | 1 finding | 2 could-not-run, named)
   |      --> write memory-bank/plans/.layout  ("layout: v3")   <- LAST v3 step
   |      --> print over-budget list (D-07)
   v
 seedState (layout now "current": never-overwrite) --> materializeRunnable --> ask rules --> writeMarker (install.json)
```

### Recommended Project Structure
```
install/
├── state-layout.ts          # + PRE_V3_ARCHIVE_REL, ORPHAN/UPDATES/NFR_NOTES rels, QUEUE_CLAIMED_REL, staging prefix
├── state-migrate.ts         # NEW: pure planner + one generated <runnable-embeds> region (module target)
├── state-migrate.test.ts    # NEW: planner + proof unit tests over the frozen fixture and mutations
├── migrate-v3.test.ts       # NEW: committed install.js end-to-end (dry-run, run, second run, refusals, rollback)
├── fixtures/pre-v3-chess/   # NEW: frozen fixture; directory NOT named `plans` (materialized into <tmp>/plans by a helper)
└── install.ts               # --migrate branch: pre-check, executor, criterion-6 fix, --dry-run alias
scripts/
├── generate-runnable-embeds.ts   # + a non-runnable ("module") target kind, + one EMBED_SPECS row
└── state-rules.ts                # optional: extract state-roll's pure roll composition here (one composer)
```

### State machine (MIGRATE-04, D-11..D-13)

| Kit layout (`detectOldLayout`) | State layout (`stateLayout`) + marker | v3 arm | Kit arms | Writes |
|---|---|---|---|---|
| any | `both` | refuse (D-13) | not run | none, exit 3 |
| any | `unreadable` | refuse by path and code | not run | none, exit 3 |
| any | `pre-v3` + non-empty `.grugops/queue/claimed/` | refuse (D-13) | not run | none, exit 3 |
| isOldLayout (v1.0) | `pre-v3` | migrate, after the two-root steps (D-11) | config carry, kit backup, install run | full |
| isMigrated (v2.x two-root) | `pre-v3` | migrate (**criterion 6**) | install run (fall through, see Open Question 3) | full |
| isClean | `pre-v3` | migrate | install run | full |
| isMigrated | `current` + valid marker | no-op line | "already migrated" arm | none (second run: byte-identical) |
| isMigrated | `current` + no/invalid marker | note only, no write (Open Question 5) | "already migrated" arm | none |
| any | `fresh` (neither) | "no planning state to migrate", no write (D-12) | as today (clean falls through and seeds) | per existing arms |

### Pattern 1: Pure plan, thin executor, one plan rendered three ways
**What:** `planStateMigrate(inputs, now)` takes every byte it needs (the `plans/` tree as `{rel, bytes}` entries, `60-progress.md`, seed texts, `queue/claimed` listing, context listing, config `id_prefix`) and returns `{refusals, notes, files: [{rel, text, provenance[]}], movesWhole, roll, proof, overBudget, dryRunLines}`. It performs no I/O. `install.ts` (a) prints `dryRunLines` under DRY_RUN and stops the arm, (b) or writes `files` into staging and commits.
**When to use:** always; it is the established installer shape (`buildKitPlan` / `executeKitPlan`, `planConfigCarry`). [VERIFIED: install/install.ts:6548-6566]
**Clock:** pass the migration date in (`now`), so golden tests are byte-exact and the second run never re-derives a date.

### Pattern 2: Cut the trailer from the RAW line, never from the model
`parseBoard` truncates each row's `meta` and `trailer` to 1,024 characters (`MAX_META_CHARS`) [VERIFIED: scripts/board-model.ts:90 `export const MAX_META_CHARS = 1_024;` and :656-657 `const meta = parts.meta === null ? null : truncateAt(parts.meta, MAX_META_CHARS);` / `const trailer = truncateAt(parts.trailer, MAX_META_CHARS);`]. The chess board has rows up to 34,494 bytes. Use `parseBoard` only to find which lines are ticket rows (their `line` numbers, 1-based in the normalized text), then re-split the raw line:

- Row grammar: `const ROW = /^- \[([^\]]{1,64})\] (.*)$/;` and `const META_GAP = "  (";` [VERIFIED: scripts/board-model.ts:150, :166]
- `splitRow(rest)` returns `{title, meta, trailer}` with `meta`/`trailer` untrimmed; no `  (` or an unbalanced parenthetical gives `meta: null, trailer: ""` [VERIFIED: scripts/board-model.ts:530-553].
- Consequences the planner must state as rules, not discover: a row with a trailer but **no** two-space parenthetical (for example `- [X] title — merged ...`) has no trailer by the grammar, so nothing is cut and it is reported over budget (D-01); an unbalanced parenthetical is the same.
- The cut row text is `rawLine.slice(0, rawLine.length - trailer.length)` (prefix kept byte for byte, no `trimEnd`), with the line's own `\r` re-attached on a CRLF board.

### Pattern 3: Staging, commit and rollback (D-10) — recommended concrete protocol
1. **Staging location:** `<target>/memory-bank/.grugops-migrate-v3.<token>/` (sibling of the destination; `memory-bank` is in `STATE_ROOTS`, so prune and uninstall never touch it [VERIFIED: install/state-layout.ts:67-75]). Create `memory-bank/` only if absent and remember that, so a failure removes only what this run made.
2. **Build:** write every planned file (`wx`), including plain copies of every `plans/` file the split does not replace (tickets without trailers, epics, features, sprints, releases, uat, metrics, nested dirs such as `tickets/history/`), the seed files the old tree lacks (`.gitkeep` keepers, the seed `traceability.md` index, the seed NFR catalog text plus the generated index lines), `archive/pre-v3/{board-updates,board-orphan-notes,nfr-notes}.md`, `archive/board-done.md` and `archive/progress.md` when a roll ran. `archive/pre-v3/60-progress.md` holds the original progress bytes when the progress roll ran. Do **not** copy `plans/handoffs/` (retired relay; it travels with `plans/` into the archive).
3. **Re-read and prove on disk:** re-read every staged file, re-run the split proof and compare each plain copy byte for byte with its source.
4. **Freshness:** re-take `treeRecord(TARGET, "plans")` and the progress bytes; if either differs from the plan's, abort ("changed after it was read").
5. **Commit:**
   - (a) `renameSync(staging, memory-bank/plans)` — destination must not exist (pre-check) [CITED: man7.org/linux/man-pages/man2/rename.2.html "newpath must either not exist, or it must specify an empty directory"];
   - (b) when the progress roll ran: atomic replace of `memory-bank/60-progress.md` (temp sibling + rename);
   - (c) `renameSync(plans, memory-bank/plans/archive/pre-v3/plans)`;
   - (d) assert `treeRecord(TARGET, "memory-bank/plans/archive/pre-v3/plans") === recordBefore` (rename keeps bytes and modes, so equality is the byte compare D-09 asks for, for every original at once, the old traceability included).
6. **Rollback:** failure at (b): rename `memory-bank/plans` back to the staging name, then remove the staging tree. Failure at (c): restore `60-progress.md` from `archive/pre-v3/60-progress.md`, then as for (b). A rollback step that fails is a loud `verify` naming the exact state and the manual remedy (state-roll's `restore-failed` stage is the model [VERIFIED: scripts/state-rules.ts:1068-1078]).
7. **Crash safety:** a kill between (a) and (c) leaves `both`: a complete, proven v3 tree beside the untouched `plans/`. Roles already use the v3 tree with a warning (Phase 36 D-02), and the next `--migrate` refuses `both` (D-13). Word that refusal so it recognises this signature (`memory-bank/plans/archive/pre-v3/` present, no `.layout`) and prints the one manual step. The reverse order would leave `neither` on a crash, which D-12 answers with "nothing to migrate": never use it.
8. **Rename semantics:** a bind mount or another mount point returns EXDEV even when `st_dev` matches [CITED: man7.org rename(2) "rename() does not work across different mount points, even if the same filesystem is mounted on both"]. Check `st_dev` in the pre-check, and still treat EXDEV at commit as an I/O failure that rolls back. Never fall back to copy plus delete (research Pitfall 2).

### Pattern 4: The conservation proof (D-09), two stages plus a closed generated-line set
- **Stage A, the split.** Originals: the board and the NFR catalog (non-blank lines; a line is its content without the LF or CRLF terminator). Outputs: the split board, the `## Board notes` sections, the orphan notes, `board-updates.md`, every `nfr/NFR-*.md`, `nfr-notes.md`. Steps:
  1. Remove the generated lines **by position**, not by value: the plan declares, per output file, which line numbers it generated. Assert each removed line equals a template from the closed set (so a plan cannot hide an original line by calling it generated).
  2. **Rejoin cut rows:** for each cut, the board line `- [ID] title  (meta)` plus its trailer line (found under that ID's notes section) concatenate to exactly one original line. Put the joined line back in the output multiset and remove both pieces.
  3. Compare the two multisets exactly.
  The plain multiset rule in D-09 fails for every cut row without this rejoin step, so the rejoin must be a named part of the rule.
- **Stage B, the roll.** Run `executeRoll` over an in-memory `RollIo` (Done first, then progress), exactly as `state-roll` does. Its `checkConservation` derives expectations from `before` and line positions, never from the plan's own texts [VERIFIED: scripts/state-rules.ts:988-996]. Composing A then B proves the union D-09 names, with the rolled archives included.
- **Tickets:** each appended ticket must start with the original bytes exactly (prefix check). Only a separator newline, the generated heading and provenance line, and trailer lines follow.
- **Closed generated-line set, one exported constant in `state-migrate.ts`:** `## Board notes` heading; the provenance line (one template, date-parameterised); the orphan file title; `## [ID]` orphan headings; the `board-updates.md` title and provenance; the `nfr-notes.md` title and provenance; the per-NFR-file copies of the table header and separator rows. Roll skeletons come from `doneArchiveSkeleton`/`progressArchiveSkeleton` and belong to stage B, never respelled. `## Board notes` must equal the contract's spelling (bind with a test against `agent-factory/contracts/board.md` § Ticket body sections).
- **NFR catalog residue:** D-06 places only the table rows and NFR-named sections. Every other catalog line (title, `_Updated:`, comment block, prose, the original header and separator) must go **verbatim, in order, to `nfr-notes.md`**, or stage A cannot balance. HTML-commented example rows (the pre-v3 seed carries `| NFR-001 | Performance | ...` inside a comment) must be blanked with `stripHtmlComments` before table rows are found.
- **Run the proof twice:** once in memory during the pre-check (a failure is a refusal, nothing written), and once over the staged bytes re-read from disk (a failure removes the staging tree, per D-10).

### Pattern 5: Context archive (opt-in, D-14)
- Selection is pure: Done IDs = ticket rows under every `Done` column of the migrated board plus every row of `archive/board-done.md` after the roll. A task folder is moved only when (a) its ticket set is non-empty and every ID in it is Done, (b) no `pending/<task>.md` or `claimed/<task>/` queue entry names it, (c) `.grugops/archive/context/<task>` does not exist, and (d) it is a real directory (lstat, no link). Every other folder stays and is listed.
- Move = `renameSync` per folder (same filesystem; `.grugops/archive/` is created only if absent).
- Proof that trace survives: render before and after the moves gives byte-identical `traceability/` trees. This is a test, not runtime work.

### Anti-Patterns to Avoid
- **Reading `row.trailer` from `parseBoard`:** it is truncated (Pattern 2).
- **Importing `scripts/*.js` from `install/`:** red by `install/install.test.ts`; use the embed or a spawn.
- **Proving against the archive copies:** always passes (D-09).
- **Removing generated lines by value:** an original line equal to a template would vanish from the proof unseen.
- **`rmSync` on anything but this run's own staging path:** never on `plans/`, never on a stale staging dir from another run (report it instead).
- **Running the v3 arm's `migrateHandoffs` rename before the v3 move:** it renames `plans/handoffs` to `plans/handoffs.bak.<ISO>` and records a ledger backup at that path, which the v3 move then makes stale (Runtime State Inventory).
- **Writing the marker anywhere but last.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Board row split | a regex in install | embedded `splitRow` / `parseBoard` | one reader rule; 141-row corpus already proves it |
| Ticket identity | basename slicing | embedded `parseTicketDocument` + the stem rule ("`id` from the admitted frontmatter when it carries one, else the file's stem") [VERIFIED: scripts/board-model.ts:364] | same answer the board reader gives |
| Done/progress roll and its proof | a second roller | embedded `planDoneRoll`…`executeRoll` with an in-memory `RollIo` | D-08 forbids a second copy |
| Section extents (NFR sections, progress entries) | "next `##`" scan | embedded `sectionEndIndex` | fence-aware; LANG-07 owner (Phase 37 D-16) |
| Marker validity | string compare | embedded `markerState` | BOM/CRLF normalization rule |
| Budget list | hand math | embedded `boardBudgetFindings`, `fileBytesFinding`, `indexLineFindings`, `doneRowFindings` | same numbers state-check prints |
| Whole-tree byte proof of the archive | per-file hashing loop | `treeRecord` | already bounded, no link followed |
| Bounded user reads, hazards | `readFileSync` | `readUserFile`, `wayTo`, `readForWrite`, `pathLimitProblem` | fs census read axis |
| Trace render | rendering in install | spawn `trace-render.js` | one render owner |
| Rollback tests | an env test hook in install.js | `fault-inject.test-support.ts` preload | "no shipped program reads its switches" |
| Output sanitizing | ad hoc | embedded `stripControlChars` | user text printed in dry-run lines |

**Key insight:** the domain is "conserve every byte of hand-written prose". Each hand-rolled reader is a second interpretation that can silently drop text, and the proof is the only thing that makes such a loss loud.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Host `.grugops/install.json` ledger `backup` entries at `plans/handoffs.bak.<ISO>` (made by earlier `--migrate` runs: `backupDir` renames `plans/handoffs` aside and records it [VERIFIED: install/install.ts:3156-3190]). After `plans/` moves into the archive these paths go stale; uninstall then prints "install's backup of plans/handoffs is not present" [VERIFIED: install/uninstall.ts:613-618]. Context notes' `refs` may name old `plans/...` paths (append-only; trace classifies them as Code refs). | Decide (Open Question 6): rewrite those backup entries' `path` to the archive location through `rewriteLedger`, or accept the stale note. Notes: none (append-only by contract). |
| Live service config | None. grugops has no service; the git host's branch protection is unaffected. | none |
| OS-registered state | None found (no scheduler, no daemon). | none |
| Secrets/env vars | `GRUGOPS_HOME`, `GRUGOPS_SRC`, `INSTALL_MODE`, `DRY_RUN` are read by install; no name changes. | none |
| Build artifacts / installed things | A v2.x host's `tools/grugops/` lacks `state-check.js`, `state-roll.js` and `trace-render.js`; the kit home may hold a v2.x kit whose roles read `plans/`. A v3 state under a v2.x kit breaks those roles. | Run the install run on the isMigrated+pre-v3 path (Open Question 3), so copyKit and materializeRunnable refresh both. |

## Common Pitfalls

### Pitfall 1: The success criterion names a flag install.js does not have
**What goes wrong:** `node install/install.js --migrate --dry-run` exits 2 (`unknown argument: --dry-run`) [VERIFIED: install/install.ts:313 `USAGE_ERROR = \`unknown argument: ${a}\`;`]; preview is `DRY_RUN=1` (`const DRY_RUN = process.env.DRY_RUN === "1";` [VERIFIED: install/install.ts:340]; install/README.md:1416 documents `DRY_RUN=1 node install/install.js --migrate`).
**How to avoid:** add `--dry-run` as an alias that sets the same `DRY_RUN` const (the const is at line 340), document it, and update the flag censuses and README. The claim registry row C-28 at docs/audit/28-claim-registry.md:611 counts "seven named flags", so check whether it is an exhaustive claim.
**Warning signs:** a verifier running the literal criterion command gets exit 2.

### Pitfall 2: Trailer truncation silently drops text
See Pattern 2. The stage A proof catches it, but only if the planner uses the raw line. A test with the 34,494-byte chess row (present in `scripts/fixtures/board-replay/chess-board.md`, "EXACTLY ONE line survives at its full length") pins it.

### Pitfall 3: The two-root short-circuit (WR-04)
**What goes wrong:** `if (layout.isMigrated) { ... console.log("Nothing to do."); ... process.exit(...) }` [VERIFIED: install/install.ts:6596-6634, "Nothing to do." at :6631] runs for every v2.x repo with `.grugops/install.json`, before any v3 step. Every v2.x install seeded `plans/board.md`, so this is the main user population.
**How to avoid:** gate the arm on `stateLayout() !== "pre-v3"`. Test: install fresh, then reshape to v2.x (move `memory-bank/plans` aside, plant `plans/board.md`), run `--migrate`, assert stdout lacks "already migrated to the two-root layout" plus "Nothing to do.", assert the v3 tree and the marker exist. Keep R17 green: it plants `plans/handoffs` with no `plans/board.md`, so it stays `current` [VERIFIED: install/agents-record.test.ts:892-907].

### Pitfall 4: The handoffs backup writes inside `plans/` before the v3 move
**What goes wrong:** `migrateHandoffs()` runs on every `--migrate` path before the install run [VERIFIED: install/install.ts:6594-6595], renaming inside `plans/` and recording a ledger backup there. D-11's "one pre-check before any write" would be broken if the v3 pre-check came after it, and the record goes stale after the move.
**How to avoid:** take the v3 plan and its refusals before `migrateHandoffs`. When the v3 arm will move `plans/`, skip the handoffs backup with an `ok` line ("carried whole into the pre-v3 archive by the state move").

### Pitfall 5: The destination already exists
`memory-bank/plans/` present but without `board.md` (made by hand, or left over) makes rename fail with ENOTEMPTY or EEXIST, or on Windows EPERM. **Refuse it in the pre-check, naming the directory and its entries.** An empty directory may be renamed over on POSIX, but not on Windows (`claim.ts` documents MoveFileEx EPERM/EEXIST/EACCES on Windows [VERIFIED: scripts/claim.ts:20-21]); refusing every existing destination is the simple rule.

### Pitfall 6: Shapes the splitter will meet in real boards (from the committed chess replay fixture)
`_Updated:` lines of 2–4 KB each before the columns; HTML comment lines carrying "OUTGOING HEADER ... archived VERBATIM to .../tickets/history/..." (so **`tickets/` has a nested `history/` directory of non-ticket files**); rows with `  (meta)  — trailer`; a 34,494-byte row; headings in the three forms plus `## Columns (spec §6.1)`; non-column `## Notes (...)` sections [VERIFIED: scripts/fixtures/board-replay/chess-board.md, dogfood-board.md]. Note: that replay fixture's paths were rewritten to `memory-bank/plans/` by Phase 36, so it is **not** verbatim pre-v3 and is not the D-15 fixture.
**Also expect (not yet seen, needs the real copy):** a Done column holding non-row lines (nested bullets are unparsed lines), which makes `planDoneRoll` refuse. Recommendation: a refused roll is not a migrate refusal; skip that roll, print the planner's reason and the `state-roll` command, and let the over-budget list show `doneRows`.

### Pitfall 7: The old-spelling gate and the frozen fixture
The fixture's content contains `plans/` spellings, and a directory named `plans/` is a "legacy path" [VERIFIED: scripts/state-path-scan.ts:158-160]. Store the fixture under a directory not named `plans` and materialize it into `<tmp>/plans/` with a helper built from `LEGACY_STATE_ROOT_REL` (the `makePreV3StateFixture` precedent [VERIFIED: install/installer-paths.test-support.ts:146-167]). The file content still needs one allow-list entry with a D-15 reason; that is a recorded decision, not a widening to clear a finding.

### Pitfall 8: Census and pinned-count churn
New `renameSync`/`mkdirSync`/`writeFileSync`/`rmSync` call sites in `install.ts` must be classified in `installer-fs-census.test.ts`; each new mid-script `process.exit` changes a pinned count ("A MID-SCRIPT EXIT, the seventh of the pinned count" [VERIFIED: install/install.ts:6582-6583]); a new `EMBED_SPECS` row moves `EMBED_SPEC_COUNT` (now `3` [VERIFIED: scripts/generate-runnable-embeds.ts:317]); new state-layout constants move nothing pinned unless added to `STATE_ROOTS`/`BUDGETS`. The foundation-guard censuses (LANG-07 section-extent owners, the non-blocking reader census, the state-path census) admit generated copies only inside fresh `EMBED_SPECS` regions; confirm they iterate `EMBED_SPECS` rather than a path prefix.

### Pitfall 9: The embed generator stamps every target as a host runnable
Each region gets `RUNNABLE_SET_STAMP`, `RUNNABLE_SET` and `RUNNABLE_SELF`, and `RUNNABLE_SET` is derived from the targets' basenames; `state-check` reads every `RUNNABLE_SET` sibling for version skew [VERIFIED: scripts/generate-runnable-embeds.ts:28-34, :668-672; scripts/runnable-ref/state-check.ts:2579-2606]. Adding `install/state-migrate.ts` as a plain row would make every host's `state-check` remedy say "remove state-check.js, state-migrate.js, ..." and change every runnable's stamp. Add a target kind (for example `kind: "module"`) that is freshness-checked but excluded from the stamp and from `RUNNABLE_SET`. The generator also refuses `LEGACY_STATE_ROOT_REL` in a closure, so the module's hand-written part imports the legacy constants from `./state-layout.js` and the region embeds no `state-layout` root (that also avoids duplicate identifiers).

### Pitfall 10: Line endings and the BOM
Refuse a mixed-ending board, catalog, progress file or ticket to be appended in the pre-check (`lineEndings` gives `"none" | "lf" | "crlf" | "mixed"` [VERIFIED: scripts/state-rules.ts:1426-1429]). Keep a leading BOM on line 1 of the board as content. Write appended sections and generated files in the destination file's own ending.

### Pitfall 11: Running repository code
Spawning `<target>/tools/grugops/trace-render.js` executes a file the repository controls (it may be stale or edited: `materializeRunnable` never overwrites an edited copy). Prefer the kit's own `GRUGOPS_SRC/scripts/runnable-ref/trace-render.js`, byte-identical to a fresh materialization. Spawn with `process.execPath`, an argv array and no shell (install.test.ts pins no `shell: true`).

## Code Examples

### 1. The criterion-6 gate and the v3 decision (skeleton; names are recommendations)
```typescript
// install/install.ts, inside `if (MIGRATE) { ... }` BEFORE migrateHandoffs().
// stateLayout() returns "fresh" | "current" | "pre-v3" | "both" | { unreadable, code }  [VERIFIED: install/install.ts:889-894]
const state = stateLayout();
const v3 = state === "pre-v3" ? planStateMigrate(readMigrateInputs(), utcDate()) : null;   // pure; refusals inside
const refusals = [...carry.refusals, ...kitRefusals, ...stateRefusals(state), ...(v3?.refusals ?? [])];
// ... existing pre-check print + exit 3 when refusals.length > 0 ...
if (layout.isMigrated && state !== "pre-v3") { /* existing already-migrated arm, unchanged */ }
```

### 2. Cutting a row (pure; uses the embedded grammar)
```typescript
// Source: scripts/board-model.ts splitRow (embedded copy). Never parseBoard's truncated trailer.
function cutRow(rawLine: string): { kept: string; trailer: string } | null {
  const eol = rawLine.endsWith("\r") ? "\r" : "";
  const line = eol ? rawLine.slice(0, -1) : rawLine;
  const m = /^- \[([^\]]{1,64})\] (.*)$/.exec(line);       // only to reach `rest`; the row's admission came from parseBoard
  if (m === null) return null;
  const { meta, trailer } = splitRow(m[2] as string);
  if (meta === null || trailer === "") return null;         // nothing to cut (D-01)
  return { kept: line.slice(0, line.length - trailer.length) + eol, trailer };
}
// Proof rejoin: kept (without eol) + trailer === original line (without eol), byte for byte.
```
(The regex here is only illustrative. The plan must take `rest` from the embedded grammar, not from a second literal; the illustrative literal above is the `ROW` constant quoted in Pattern 2.)

### 3. The roll in memory (D-08), same planners as state-roll
```typescript
// Source: scripts/state-rules.ts RollIo / executeRoll (embedded). io is a Map over staged texts.
const files = new Map<string, string | null>([[BOARD_REL, splitBoard], [BOARD_DONE_ARCHIVE_REL, null]]);
const io = { read: (r: string) => files.get(r) ?? null, write: (r: string, t: string) => void files.set(r, t), remove: (r: string) => void files.set(r, null) };
const outcome = executeRoll(plan, io);   // { ok: true } | { ok: false, stage, reason }
```

### 4. Marker (last step)
```typescript
// LAYOUT_MARKER_REL = `${STATE_ROOT_REL}/.layout`; LAYOUT_MARKER_CONTENT = "layout: v3"  [VERIFIED: install/state-layout.ts:132, :138]
writeFileSync(join(TARGET, ...LAYOUT_MARKER_REL.split("/")), `${LAYOUT_MARKER_CONTENT}\n`, { flag: "wx" });
```

### Verbatim constants this phase builds on (all read this session)
- `export const STATE_ROOT_REL = "memory-bank/plans";` [install/state-layout.ts:28]
- `export const LEGACY_STATE_ROOT_REL = "plans";` [:34]
- `export const LEGACY_BOARD_REL = \`${LEGACY_STATE_ROOT_REL}/board.md\`;` [:58]
- `export const LEGACY_HANDOFFS_REL = \`${LEGACY_STATE_ROOT_REL}/handoffs\`;` [:60]
- `export const ARCHIVE_REL = \`${STATE_ROOT_REL}/archive\`;` [:105]; `BOARD_DONE_ARCHIVE_REL = \`${ARCHIVE_REL}/board-done.md\`` [:107]; `PROGRESS_REL = \`${MEMORY_BANK_REL}/60-progress.md\`` [:109]; `PROGRESS_ARCHIVE_REL = \`${ARCHIVE_REL}/progress.md\`` [:111]
- `export const QUEUE_REL = \`${GRUGOPS_DIR_REL}/queue\`;` [:121] — **there is no `claimed` constant**; add `QUEUE_CLAIMED_REL` (D-13 needs it). Also absent today, so to be added: `PRE_V3_ARCHIVE_REL` (`${ARCHIVE_REL}/pre-v3`), the three archive file rels and the staging prefix.
- `export const CONTEXT_ARCHIVE_REL = \`${GRUGOPS_ARCHIVE_REL}/context\`;` [:127]
- `BUDGETS`: `boardBytes: 24_576`, `boardRowChars: 160`, `boardUpdatedLines: 1`, `indexEntryBytes: 200`, `ticketBytes: 65_536`, `nfrBytes: 8_192`, `traceBytes: 8_192`, `progressBytes: 16_384`, `doneRows: 20` [:145-164]
- `const UPDATED_PREFIX = "_Updated:";` [scripts/state-rules.ts:215] — the D-04 rule should be the budget's own rule: lines that begin `_Updated:` in the comment-blanked text.
- `export const DONE_ARCHIVE_HEADING = "## Done (WIP unlimited)";` [scripts/state-rules.ts:744]; `export const PROGRESS_ARCHIVE_TITLE = "# Progress archive";` [:1184]
- `const NFR_INDEX_LINE = /^- \[(NFR-[0-9]+)\]\(([^)]*)\)(?: [\s\S]*)?$/;` [scripts/state-rules.ts:386]
- Pre-v3 NFR table header (seed before Phase 36): `| ID | Category | Target | Applies to | Verified by |` [VERIFIED: `git show 731c772a^:agent-factory/seed/plans/nfr-catalog.md`] — so category is cell 2 and target cell 3 of a seed-shaped table. Real catalogs may differ: confirm against the frozen fixture.
- `export const USER_FILE_MAX_BYTES = 8 * 1024 * 1024;` [install/user-file.ts:90]; `export const TREE_MAX_ENTRIES = 20_000;` [:453]
- `export const BACKUP_ORIGINS = ["in-repo-kit", "legacy-config", "handoffs", "edited-kit-file", "kit-home"] as const;` [install/install-marker.ts:924]
- `const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;` [scripts/context-io.ts:127] — task folder names carry no structured ticket ID.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `--migrate` on pre-v3 seeds nothing under `memory-bank/plans/` and leaves `plans/` alone (one `skipped` line) | v3 arm moves and splits | this phase | `install/pre-v3-layout.test.ts` cases (e), (i), (j), (m) and `docs/pre-v3-state-layout.md` § "What `--migrate` does in this release" must change in the same plan [VERIFIED: read] |
| ARCHITECTURE §2.4 "split traceability into `traceability/<ID>.md`", "keep the move on failure" | archive-only traceability + render (D-05); staging, nothing kept on failure (D-10) | discuss-phase 2026-10-27 | do not implement §2.4's versions |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `plans/` moves whole to `memory-bank/plans/archive/pre-v3/plans/` (originals at `archive/pre-v3/plans/board.md` etc.), rather than per-file copies at `archive/pre-v3/board.md` with `plans/` moved somewhere else | Pattern 3 | Wrong archive paths in docs and tests; D-10 names no destination for `plans/` |
| A2 | Trace render runs against the target root after the rename, from the kit-source copy, before the marker (not "against the staged tree" with "the materialized" copy) | Summary, Pitfall 11 | Deviates from D-05's wording; user must confirm |
| A3 | `--dry-run` is added as an install-wide alias of `DRY_RUN=1` | Pitfall 1 | Criterion 1 unmet, or flag census churn |
| A4 | isMigrated + pre-v3 falls through to the install run (kit refresh, runnables) | State machine | Without it a v2.x kit reads a moved state |
| A5 | Task folder to ticket: known ticket IDs found in the folder name (delimited), all Done, no queue entry | Pattern 5 | Wrong folders moved; refs-based alternative is heavier |
| A6 | A refused Done or progress roll does not refuse the migrate | Pitfall 6 | Strict reading of D-08 would block real boards |
| A7 | Epic/feature rows and rows outside columns are not cut | Pattern 2 | Board stays larger; no data risk |
| A8 | Windows refuses a directory rename onto an existing directory | Pitfall 5 | Only affects wording; pre-check refuses all existing destinations anyway |
| A9 | `archive/pre-v3/60-progress.md` keeps the original progress bytes when the progress roll rewrites `60-progress.md` | Pattern 3 | Otherwise `60-progress.md` is rewritten in place with no pre-v3 original, against MIGRATE-02's wording |

## Open Questions

1. **Where does `plans/` go (D-10 "moves plans/ out of the way")?**
   - What we know: the originals must sit unchanged under `archive/pre-v3/`, and nothing may be deleted.
   - Recommendation: rename `plans/` whole to `memory-bank/plans/archive/pre-v3/plans/` (A1). This needs no copy of any original, gives one `treeRecord` byte proof, and leaves no top-level leftover. The cost is that ticket bytes appear twice (live copy plus archive original, about 6 MB on chess).
2. **D-05 literal wording** (A2): confirm "after the rename, before the marker, kit-source copy".
3. **isMigrated + pre-v3: run the install run or only the state arm?** (A4) Recommend the install run, with the kit plan in the pre-check as `isOldLayout` already does.
4. **Task folder to ticket rule** (A5): folder name (cheap, matches D-14's "folders whose ID") vs note refs (principled, but needs note parsing in install through `readUserFile`).
5. **`current` layout with no or invalid marker under `--migrate`:** recommend a note and no write ("migrate does not mark state it did not migrate"); the user writes the marker by hand.
6. **Stale ledger backups under `plans/`:** re-path them through `rewriteLedger`, or accept uninstall's "not present" line.
7. **Opt-in context archive on an already-v3 repo:** recommend allowing it (move-only, idempotent). The byte-identical no-op test then runs without the flag, or after a run with it.
8. **Real shapes (D-15):** NFR section nesting (does a `###` under `## NFR-003` belong to NFR-003?), table cell escaping (`\|` inside cells), multi-line `_Updated:` paragraphs, ticket file naming (`ABC-001.md` vs slugged names). Decide only after the frozen fixture lands; plan 1 should produce a shape census of the fixture.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v26.12.1 (repo needs ≥22) | — |
| `node_modules` (typescript ~6.0.3, vitest ~4.1.8) | build, tests | ✗ | — | `npm ci` first. Without it `npx tsc` fetched the imposter package `tsc@2.0.4` and `npx vitest` fetched vitest 5.0.5, not the pinned ~4.1.8 (observed this session) |
| git | old-spelling gate (`git ls-files`) | ✓ | — | — |
| A copy of `cli-chess-example` | D-15 fixture, MIGRATE-07 dogfood | ✗ (not found on this machine) | — | none: blocking for plan 1 and the dogfood plan → `checkpoint:human-action` for the path |
| tmpfs `/tmp` vs ext4 repo | scratch tests | ✓ | — | fixtures live in one scratch dir, so renames stay on one filesystem |

**Missing dependencies with no fallback:** the chess copy (human must place it and give the path).
**Missing dependencies with fallback:** `node_modules` (`npm ci`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ~4.1.8 (devDependency), `globals: false` |
| Config file | `vitest.config.ts`, `tsconfig.tests.json` |
| Quick run command | `npm run build && npx vitest run install/state-migrate.test.ts` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` plus `npx tsc --noEmit`, `npm run freshness:runnable-embeds`, `npm run check:state-paths` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIGRATE-01 | `--migrate --dry-run` prints every move/split with bytes; `snapshotTree` identical before/after; real run gives the v3 tree | integration (committed install.js) | `npx vitest run install/migrate-v3.test.ts -t "dry-run"` | ❌ Wave 0 |
| MIGRATE-02 | `treeRecord(archive/pre-v3/plans) === treeRecord(plans) before`; no original path missing; appended tickets are new files whose prefix is the original | integration | `... -t "archive"` | ❌ |
| MIGRATE-03 | proof passes on the fixture; fails on each mutation (drop line, duplicate, byte change, original mislabelled generated, cut not rejoinable); fault-injected failure at each commit step leaves `snapshotTree` identical and no staging dir | unit + integration (fault-inject) | `npx vitest run install/state-migrate.test.ts -t "proof"` / `install/migrate-v3.test.ts -t "rollback"` | ❌ |
| MIGRATE-04 | both refused; claimed refused; neither writes nothing; second run byte-identical; v2.x two-root + pre-v3 migrates and lacks "Nothing to do." (criterion 6); R17 still green | integration | `... -t "state machine"`; `npx vitest run install/agents-record.test.ts -t R17` | ❌ / ✅ |
| MIGRATE-05 | every trailer byte appears verbatim under `## Board notes` (34,494-byte row included); board-corpus admitted-row count equal before/after (board plus Done archive) | unit | `... -t "trailer"` | ❌ |
| MIGRATE-06 | with the flag, Done folders renamed, others listed; trace tree byte-identical before vs after the moves | integration | `... -t "context archive"` | ❌ |
| MIGRATE-07 | dogfood table of before/after sizes | manual-only (user-owned copy) | recorded in the plan SUMMARY | — |

### Sampling Rate
- **Per task commit:** the quick command for the touched file plus `npx tsc --noEmit`.
- **Per wave merge:** full suite plus the freshness and state-path gates.
- **Phase gate:** full suite green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Frozen fixture + materializing helper (`install/fixtures/pre-v3-chess/`, helper in `installer-paths.test-support.ts`) — needs the chess path
- [ ] `install/state-migrate.test.ts`, `install/migrate-v3.test.ts`
- [ ] Update `install/pre-v3-layout.test.ts` (e)(i)(j)(m), `installer-fs-census.test.ts` rows, `installer-dry-run.test.ts`, `generate-runnable-embeds.test.ts` (new target kind, count 4)

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no (local CLI over the user's own repo) | — |
| V5 Input Validation | yes | the embedded board and ticket grammars; NFR ID regex; task names restricted to `TASK_NAME_RE` before a rename |
| V6 Cryptography | no (sha256 only as content records, `treeRecord`) | — |
| V7 Error handling and logging | yes | every refusal named; `stripControlChars` on printed user text; exit 2 is never a pass |
| V12 Files and resources | yes | `readUserFile` bound; lstat/`wayTo` (no link followed, no FIFO opened); `pathLimitProblem`; same-filesystem rename; no copy+delete |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Symlink in `plans/` or on the way to `memory-bank/` redirects writes outside the repo (29.2 CR-01 class) | Tampering | pre-check: `treeRecord` non-null and no `link`/`other` entries; `wayTo` for `memory-bank`, `.grugops`; refuse by name |
| Data loss by partial migrate | Tampering/DoS | staging plus proof plus rollback; marker last; never `rmSync` outside this run's staging |
| Change between plan and commit (TOCTOU, an agent writing) | Tampering | re-take `treeRecord` and progress bytes before commit; abort on change |
| Executing repo-controlled `tools/grugops/trace-render.js` | Elevation | spawn the kit-source copy with `process.execPath`, argv, no shell |
| Huge files or trees | DoS | 8 MiB per-file and 20,000-entry `treeRecord` bounds → refusal by name |
| Terminal escape sequences in trailer or ID previews | Spoofing | `stripControlChars` before printing |

## Sources

### Primary (HIGH confidence, read this session)
- `install/install.ts` (arg parse 255-337; `stateLayout` 878-895; refusal 3019-3040; `backupDir`/`migrateHandoffs` 3140-3204; `detectOldLayout` 3483-3522; seed 5637-5760; `--migrate` branch 6533-6646; run tail 8045-8076)
- `install/state-layout.ts` (whole file), `install/user-file.ts` (`readUserFile`, `treeRecord`), `install/install-marker.ts` (ledger kinds, `BACKUP_ORIGINS`), `install/uninstall.ts` (`reportBackup`)
- `scripts/board-model.ts`, `scripts/state-rules.ts`, `scripts/runnable-ref/state-roll.ts` (composition 1600-1720), `scripts/runnable-ref/trace-render.ts` (header, roots), `scripts/generate-runnable-embeds.ts`, `scripts/check-state-paths.ts`, `scripts/state-path-scan.ts`, `scripts/fault-inject.test-support.ts`, `scripts/context-io.ts`, `scripts/claim.ts`, `scripts/trace-model.ts`
- `agent-factory/contracts/board.md`, `agent-factory/seed/memory-bank/plans/*`, `docs/pre-v3-state-layout.md`, `install/README.md`
- `.planning/research/ARCHITECTURE.md` §2.2-2.4, `.planning/research/PITFALLS.md` Pitfalls 2, 5, gotchas; Phase 36 WR-04 records; Phase 37 CONTEXT D-12/D-15/D-16/D-20
- `scripts/fixtures/board-replay/chess-board.md`, `dogfood-board.md`

### Secondary (MEDIUM)
- man7.org rename(2): empty-directory target, EXDEV across mount points, atomic replace

### Tertiary (LOW)
- Real chess shapes beyond the trimmed replay fixture (not available on this machine)

## Metadata

**Confidence breakdown:**
- Standard stack (in-repo reuse): HIGH — every module and symbol was read.
- Architecture (embed, plan/execute, commit protocol): MEDIUM — built on read seams; the generator extension and commit order are recommendations.
- Pitfalls: HIGH for the code-level ones (flag, truncation, short-circuit, handoffs, census); LOW for the real-board shapes until the fixture lands.

**Research date:** 2026-10-28
**Valid until:** 2026-11-27 (in-repo facts; re-check if `install.ts`'s `--migrate` branch or `EMBED_SPECS` changes first)
