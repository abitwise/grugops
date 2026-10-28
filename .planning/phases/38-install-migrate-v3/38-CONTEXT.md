# Phase 38: install --migrate v3 - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning (the MIGRATE-07 dogfood and the frozen fixture need the user's copy of
`cli-chess-example` on this machine; the path is still to come)

<domain>
## Phase Boundary

A user with an old-layout repo (`plans/board.md`, no `memory-bank/plans/board.md`) runs one command,
`install --migrate`, and the repo moves to the v3 layout that Phases 36 and 37 defined. The command deletes
nothing, proves nothing was lost, and is a byte-identical no-op on a second run. `--dry-run` prints every
planned move and split with per-file byte counts and writes nothing. It is the first grugops operation
that rewrites user state (v3.0 D-8). Requirements: MIGRATE-01..MIGRATE-07.

Not in this phase: moving standing directives out of `60-progress.md`, archiving `.grugops/queue/done/` or
`memory-bank/50-decisions/`, tightening budgets, and removing the `plans/` fallback (v4.0).

</domain>

<decisions>
## Implementation Decisions

### Carried forward (not re-asked)
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

### Board split
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

### Trace and NFR split
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

### Budgets and marker
- **D-07:** Migrate always writes the marker after a successful split and proof, whatever the resulting
  sizes. Its closing lists every over-budget file with its bytes and its budget. The gate stays unblocked
  (Phase 37 D-12 records `state-check` exit 1 as an observation), and there is no exemption list
  (Phase 37 D-11). — **Reversibility:** costly — every migrated host repo carries the marker, and a
  later "marker only when clean" rule would need a second migrate path.
- **D-08:** After the split, migrate runs the same rollover that `state-roll.js` performs, reusing its
  plan and conservation functions rather than a second copy. Older Done rows go to
  `archive/board-done.md`. Dated `##` progress entries in `memory-bank/60-progress.md` go to
  `archive/progress.md`. Standing directives are not moved (still deferred).

### Failure and state machine
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

### Context archive (opt-in, MIGRATE-06)
- **D-14:** With the opt-in flag, a `.grugops/context/<task>/` folder moves (rename only, never changed)
  to `.grugops/archive/context/` when its ticket ID has a row in the Done column or in
  `archive/board-done.md` after migration. Folders whose ID matches no ticket stay in place and are
  listed.

### Fixture and dogfood
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — MIGRATE-01..07
- `.planning/ROADMAP.md` § Phase 38 — success criteria 1–6, research flag, gap-round budget note
- `.planning/PROJECT.md` Key Decisions `[v3.0, D-4]`, `D-7`, `D-8`, `D-11`

### Prior phase decisions
- `.planning/phases/36-state-layout-authority-path-move-and-protection/36-CONTEXT.md` — layout detection,
  refusal, notice wording, WR-04 hand-off
- `.planning/phases/37-overview-board-per-file-records-and-budgets/37-CONTEXT.md` — marker (D-04, D-05,
  D-14), trace render (D-01..D-03), rollover (D-07..D-09, D-15), budgets (D-10..D-13)

### Research
- `.planning/research/ARCHITECTURE.md` §2.2 (dogfood measurements), §2.4 (migrate arm sketch). §2.4's
  "split traceability into `traceability/<ID>.md`" and "keep the move on failure" are superseded by
  D-05 and D-10 above.
- `.planning/research/PITFALLS.md` Pitfalls 1, 2, 5 (no interpretation of trailers, frozen fixture, the
  already-migrated short-circuit), plus the symlink-hazard and `GRUGOPS_HOME` rows

### Contracts
- `agent-factory/contracts/board.md` — § Ticket body sections (`## Board notes`), § Rows (meta and
  trailer are opaque), § Overview and budgets, § The Done archive
- `install/state-layout.ts` — every path, budget and marker constant migrate uses (no new spelling
  elsewhere)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `install/install.ts` `detectOldLayout()` (~3507), `migratePreSteps()`, `migrateHandoffs()` and the
  `--migrate` branch (~6540–6640): the whole-or-nothing pre-check, refusal banner,
  `printMigrateIncomplete`, `migrateCommand()`, and the already-migrated arm that must be fixed.
- `scripts/runnable-ref/state-roll.ts`: `planDoneRoll`, `planProgressRoll`, `checkConservation`,
  `executeRoll`, `splitRow`, `normalizeDocument`, `lineEndings` and `lineEndingRefusal`, for D-08 and as
  the model for D-09.
- `scripts/runnable-ref/trace-render.ts` and the materialized `tools/grugops/trace-render.js`, for D-05.
- `install/user-file.ts` `readUserFile`, `readForWrite`, `realTargetPath`: special-file and symlink
  hazards on source and destination (Phase 37 D-20 canonical-form rule).
- `scripts/board-model.ts` and `scripts/board-corpus.ts`: the row grammar, plus a corpus whose admitted
  row count must be equal before and after migration (Pitfall 5 oracle).
- `install/agents-record.test.ts` R17: the existing already-migrated test to extend.

### Established Patterns
- Pure plan functions plus a thin executor. Refusals are collected before the first write. `DRY_RUN`
  renders the same plan.
- Constants only from `state-layout.ts`. The old-spelling gate allow-list must name the migrate module.
- The 0/1/2 exit contract for runnables. Exit 2 is never a pass.

### Integration Points
- The `--migrate` branch in `install/install.ts`, the install ledger (record every write), uninstall and
  prune protection (`STATE_ROOTS`; the staging directory must not be prunable kit content), and
  `install --check` (the doctor should report a migrated repo as new layout).

</code_context>

<specifics>
## Specific Ideas

- Dogfood shapes to expect (chess): board 718 KB (180 KB of `_Updated:` lines, 173 rows with trailers up
  to 34 KB), traceability 1.9 MB (615 rows), NFR catalog 369 KB (10 rows plus 83 commentary sections),
  167 tickets (largest 238 KB), `60-progress.md` 90 KB, 711 context folders.
- The research flag stands: plan with `/gsd-plan-phase 38 --research-phase`. Research the migrate state
  machine, trace render over two roots, and the shapes found in real hand-written boards.
- Budget the extra gap rounds for this phase under the four-round cap.

</specifics>

<deferred>
## Deferred Ideas

- Moving standing directives out of a host's `60-progress.md` into `50-decisions/`: a manual cleanup or a
  later phase (carried from Phase 37).
- Archiving `.grugops/queue/done/` and `memory-bank/50-decisions/` (v3.0 D-7) through migrate: not in
  MIGRATE-01..07.
- A legacy per-ticket split of the old traceability (`archive/pre-v3/traceability/<ID>.md`): considered,
  not chosen.

</deferred>

---

*Phase: 38-install-migrate-v3*
*Context gathered: 2026-10-27*
