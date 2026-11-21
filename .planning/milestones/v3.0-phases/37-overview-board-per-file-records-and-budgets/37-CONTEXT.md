# Phase 37: Overview board, per-file records and budgets - Context

**Gathered:** 2026-10-21
**Status:** Ready for planning

<domain>
## Phase Boundary

State files stay small. The board becomes a one-line-per-ticket overview (contract changed first), each
NFR becomes its own file, each ticket gets its own rendered trace file, `nfr-catalog.md` and
`traceability.md` become one-line-per-entry indexes, and byte budgets are checked in grugops (validator)
and in every host repo (`tools/grugops/state-check.js`). `60-progress.md` and the board's Done column roll
older entries into archive files; `.grugops/queue/done/` and `memory-bank/50-decisions/` are archive-only.
Requirements: SPLIT-01..SPLIT-07. Moving an existing old-layout repo is Phase 38 (`install --migrate`),
not this phase.

</domain>

<decisions>
## Implementation Decisions

### Carried forward (not re-asked)
- [v3.0 D-6] Traceability is one file per ticket, rendered from published note refs, plus an index; every
  role and workflow "append to traceability" instruction is removed; `state-check` verifies index and files.
- [v3.0 D-7] `.grugops/queue/done/` and `memory-bank/50-decisions/` may only be moved to an archive folder;
  `60-progress.md` has a byte budget with older entries rolled into an archive file.
- [v3.0 D-9] No new ticket frontmatter key; the key set stays the 8 keys in
  `agent-factory/contracts/board.md`. New ticket detail (blocked reasons included) goes in the ticket body.
- [Phase 36] `install/state-layout.ts` is constants-only and the one place a state path or budget is
  spelled; every reader, writer, the validator, the installer and the runnables derive from it. Budget
  numbers reach host runnables by generation into a marked region plus a freshness gate (the
  `scripts/generate-hook-manifest.ts` pattern), never by hand copy.
- [Phase 36 D-01] Layout (old/new/both) is still detected by board-file presence. The marker below decides
  only WARN vs FAIL for budgets.
- Every scratch install in tests and agent runs sets `GRUGOPS_HOME`.
- The contract changes first: the board overview rule lands in `agent-factory/contracts/board.md` before
  any reader, seed, validator or role edit.
- Budgets are validator and runnable facts. `LARGE_BOARD_BYTES`, `LONG_LINE_CHARS` and `MAX_META_CHARS` in
  `scripts/board-model.ts` stay reader bounds that report and never refuse; budgets are not welded onto
  the reader.

### Trace render on hosts
- **D-01:** A new materialized runnable `tools/grugops/trace-render.js` (single file, `node:` builtins only,
  built from `scripts/trace-render.ts` plus the read path it needs from `context-io`) renders
  `memory-bank/plans/traceability/<ID>.md` per ticket and the `traceability.md` one-line index from
  published note refs. `state-check.js` stays read-only and checks that the rendered files are fresh. It
  joins the installer's `RUNNABLES` list with the existing four. In grugops's own tree the same render is
  freshness-checked in CI (`scripts/trace-freshness.ts` becomes a directory compare).
- **D-02:** Hosts run the render in WF05 (PR gate) and WF09 (daily sweep), before `state-check`. WF12
  (release) reads the rendered files. No role writes a trace file or the trace index by hand.
- **D-03:** The render reads both the live context root and the finished-ticket context archive root now.
  The archive path is a constant in `state-layout.ts` defined in this phase, so Phase 38's opt-in move
  (MIGRATE-06) cannot drop trace rows.

### Migrated signal (WARN vs FAIL)
- **D-04:** A layout marker file decides budget severity. `LAYOUT_MARKER_REL` is defined in
  `state-layout.ts` in this phase. No marker means budgets WARN. A valid marker means budgets FAIL (the
  validator) or exit 1 (`state-check`). The seed ships the marker, so a fresh v3 install counts as
  migrated from birth. Phase 38's migrate writes it as its last step. This amends Phase 36's note that
  Phase 38 adds its own marker: the constant and the file shape are owned here, and Phase 38 writes it.
  — **Reversibility:** costly — the marker path and content become a published contract that Phase 38's
  migrate and every installed host repo depend on.
- **D-05:** The marker body is one version line (for example `layout: v3`). Exactly that content is
  valid. Any other content is treated as absent (WARN) and reported by name, never guessed at.
- **D-06:** grugops's own repo gets the marker by hand in a plan in this phase, once its state passes every
  budget, so CI proves FAIL mode on a real tree.

### Done growth and rollover
- **D-07:** The Done column keeps the most recent N rows (N is a constant in `state-layout.ts`, starting
  at 20). Older Done rows move verbatim to `memory-bank/plans/archive/board-done.md`. The contract must
  state how a ticket whose Done row is archived stays placed. Today `ticket-unplaced` (one of seven closed
  conflict kinds) would fire for it. Any change to the conflict set or the reader is recorded in
  `agent-factory/contracts/board.md` first.
- **D-08:** Rollover is a separate runnable `tools/grugops/state-roll.js`. It moves whole entries (Done rows,
  progress entries) into their archive files, proves line conservation (every moved line appears in the
  archive, nothing else changes), and rolls back on mismatch. WF09 runs it when `state-check` reports a
  rollable surface over budget. `state-check` never writes.
- **D-09:** Only status entries in `60-progress.md` (dated `##` sections) roll, oldest first. Standing
  directives and rulings are not progress. Roles and workflows say to write them as decision records in
  `memory-bank/50-decisions/` (archive-only, never rolled). Reason: the dogfood progress file is mostly
  `## Standing directive …` sections that agents must keep reading, so an oldest-first rule would hide
  live rules.

### Budgets
- **D-10:** Starting budgets, recorded as constants in `state-layout.ts`. The researcher checks them against
  the seed and dogfood trees and may tune them; a change after planning needs a recorded reason.
  - board: 24 KB total; each ticket-row line at most 160 characters; at most one `_Updated:` line
  - index entry (`traceability.md`, `nfr-catalog.md`, and the Done archive if it is indexed): 200 B per line
  - ticket file: **64 KB** (the user chose a higher budget with no exemption list; dogfood p90 is about
    47 KB, the largest is 238 KB, and outliers fail until a human splits them)
  - NFR file: 8 KB
  - trace file: 8 KB
  - `60-progress.md`: 16 KB
  - Done column: N = 20 rows
- **D-11:** No exemption or grandfather list for over-budget tickets. — **Reversibility:** reversible
- **D-12:** In the WF05 PR gate, `state-check` exit 1 (a broken budget on a migrated repo) is recorded as an
  `observation` note and never blocks the gate. Exit 2 is could-not-run, recorded as such and never read as
  a pass. A missing exit code (signal) is could-not-run. `state-check` itself keeps the 0/1/2 contract of
  the other runnables, and grugops's own validator still FAILs on a migrated tree (SPLIT-04).
- **D-13:** The `nfr-catalog.md` index is kept by hand by agents, one line per `nfr/NFR-xxx.md` file.
  `state-check` verifies index and files in both directions (every line points to an existing file and
  every file has exactly one line). No generated NFR index, so no new NFR-file grammar or parser.

### Claude's Discretion
- How blocked reasons and other detail are laid out in the ticket body (a named section; no new key). The
  board row keeps `- [ID] title  (owner, since)`.
- Archive folder names for `.grugops/queue/done/` and `memory-bank/50-decisions/`, and how the
  "move only, never squash or prune" rule is stated and checked (workflow text plus a `state-check` report
  is enough; the installer already protects both roots).
- The exact line format of each index (trace, NFR, Done archive), within the 200 B entry budget.
- How the validator and `state-check` share budget logic (one owner of each rule; the runnable gets
  generated constants).
- Exact `state-check` and `state-roll` CLI flags, output lines and wording (clear voice, names the file
  and the budget).
- Whether `trace-render.js` is a bundled build or a `runnable-ref` source like the other four.

### Recorded at plan 37-01 checkpoints
- **D-14:** The layout marker is `memory-bank/plans/.layout` (option a, answered by the human on
  2026-10-22). Its valid content is `layout: v3`, with or without exactly one trailing newline; both are
  valid. The content is compared after one leading byte-order mark is removed and CRLF is folded to LF,
  the same two normalizations the board contract applies to board and ticket documents. Any other
  content is invalid. `LAYOUT_MARKER_REL` and `LAYOUT_MARKER_CONTENT` in `install/state-layout.ts`
  carry exactly these values. — **Reversibility:** one-way once released (Phase 38's migrate and every
  installed host repo carry the file).
- **D-15:** A ticket whose Done row is archived stays placed through a seventh reader source,
  `boardArchive` (option a, answered by the human on 2026-10-22), and the published snapshot moves to
  version 3. The archive `memory-bank/plans/archive/board-done.md` is read with the same `parseBoard`
  grammar. Archive rows count as placements for `ticket-unplaced` only. A ticket with a row on both
  the board and the archive is `ticket-duplicated`. An unreadable archive suppresses `ticket-unplaced`,
  on the contract's listing-completeness reasoning. The conflict kind set stays at seven. Plan 37-01
  records the decision and writes the contract; plan 37-12 implements the reader change, the version
  bump and the regenerated golden in one commit. — **Reversibility:** costly (a later change is
  another snapshot version and golden regeneration).

### Recorded after plan 37-05
- **D-16:** A verbatim generated copy of `sectionEndIndex` is not a second section-extent owner
  (answered by the human on 2026-10-22, raised by plan 37-05 and logged in deferred-items.md). The
  LANG-07 census in `scripts/check-foundation-guards.test.ts` (SECTION_EXTENT_OWNERS) admits such a
  copy only inside a generated region of an `EMBED_SPECS` target whose region is fresh, by the same
  rule plan 37-03 gave the state-path and non-blocking-reader censuses, and never by file name; a
  control case proves a hand-edited or out-of-region copy still fails. `scripts/frontmatter.ts` stays
  the one owner. Plan 37-11's `planProgressRoll` and the `state-roll` runnable get entry extents from
  `sectionEndIndex` through that embed, so an entry ends where `sectionEndIndex(text, from, 2)` says
  (fence-aware, and it also closes on a level-1 heading), not at a hand-written "next `##` heading"
  scan. The exemption for all generated regions and a 37-11 workaround were both rejected.
  — **Reversibility:** cheap (a census rule and its control case).

### Recorded before gap round 1
- **D-17:** Gap round 1 (of 4) covers exactly these items, chosen by the human on 2026-10-23 from
  37-VERIFICATION.md and 37-REVIEW.md: Gap 1 (CR-01), Gap 2 (CR-02), Gap 3 (the three hand-append
  sentences in WF02:41, WF03:9 and `_commit-convention.md`:52, plus a wider permanent scan), IN-03 (the
  validator's `directoryFindings` reads an unreachable directory as absent, the same class as CR-01),
  WR-01 (ticket-ID shape taken from the board grammar's one authority), WR-02 (one fence-aware answer
  to "which progress headings are dated entries") and WR-05 (a version stamp on each runnable's
  generated region and a named skew finding in `state-check`). WR-03, WR-04, WR-06, IN-01, IN-02,
  IN-04 and IN-05 stay open in 37-REVIEW-DISPOSITION.md. The CI-reachability human item (two older red
  gates ahead of the phase-37 lines in `ci.yml`) is not in this round. Agents follow
  37-GAP-PLANNING-BRIEF.md. — **Reversibility:** reversible (scope only).

### Recorded before gap round 2
- **D-18:** Gap round 2 (of 4) covers exactly these items, chosen by the human on 2026-10-23 from
  37-VERIFICATION.md (re-verification, `gaps_found` 11/13) and 37-REVIEW.md (round-1 review): the
  READ-1 family CR-03 (a dangling `notes` symlink reads as "no notes"), CR-04 (a symlinked task
  directory is dropped uncounted), IN-06 (`statSync` with `throwIfNoEntry: false` also returns
  undefined for ENOTDIR; the comment's premise is false) and IN-10 (state-check's `locate` and the
  renderer's `realDirectoryOrNull` give two answers to "is this context root present"), closed by one
  lstat-based "absent" owner where only an lstat ENOENT on the entry itself is absence; plus WR-08 (the
  hand-trace scan is derived from the truth's wording, not from the sentences it caught) and WR-09 (the
  WF02:41 and WF03:9 rewording, then regenerated adapters, catalog and skill twins). WR-07, WR-10,
  IN-07, IN-08 and IN-09 stay open in 37-REVIEW-DISPOSITION.md, as do the round-0 items D-17 left open.
  The CI-reachability human item is not in this round. Agents follow 37-GAP-PLANNING-BRIEF.md. —
  **Reversibility:** reversible (scope only).

### Recorded before gap round 3
- **D-19:** Gap round 3 (of 4) covers exactly these items, chosen by the human on 2026-10-24 from
  37-VERIFICATION.md (re-verification after round 2, `gaps_found` 11/13) and 37-REVIEW.md (round-2
  review): CR-05 (an absent context root beneath a link that leaves the repository root reads as "no
  tasks", and the render removes trace files with exit 0), the same shape in state-roll's
  `realDirectoryOrNull`, IN-13 (four hand copies of the repository boundary; one owner, the others
  deleted), IN-12 (the ENOENT-exempt rows and the shape-cell counter in `read-sites.test.ts` are looser
  than the rules they state), IN-11 (a stray non-directory entry in a context root gets its own remedy
  wording), WR-11 (the hand-trace scan misses determiner-less, possessive, adjective, plural and gerund
  spellings and copy/paste verbs) and the WR-09 remainder at WF03:46 (the Done condition omits the
  ticket identifier). WR-03, WR-04, WR-06, WR-07, WR-10, IN-01, IN-02, IN-04, IN-05, IN-07, IN-08 and
  IN-09 stay open in 37-REVIEW-DISPOSITION.md. The CI-reachability human item is not in this round. —
  **Reversibility:** reversible (scope only).
- **D-20:** CR-05 is closed by a canonical form, not by a wider absence answer (human, 2026-10-24).
  The repository root is resolved to its real path once. Below that real root, no component of the path
  to a context root, to the trace directory, or to any directory state-roll reads or writes may be a
  symbolic link; a link at any of those positions, present or dangling, whatever its target, is a
  could-not-run (exit 2 in the renderer and state-roll, a named `trace-not-compared` finding in
  state-check), and nothing is written or removed. Only an lstat ENOENT on a component whose parents
  are all real directories inside the real root is absence. This reverses the round-2 planner's flagged
  assumption that links are followed at the root, state and trace-directory positions. Links in the
  path above the repository root (for example macOS `/tmp` -> `/private/tmp`) are not affected.
  Positions below a context root (task, notes) keep the round-2 rules (a link there is already
  refused or checked inside the root); a plan that finds a position where that does not hold flags it
  for the human rather than widening D-20. — **Reversibility:** costly (a host that symlinks
  `.grugops` or `memory-bank` starts getting exit 2; the own repo has no such links, checked
  2026-10-24).

### Recorded before gap round 4
- **D-21:** Gap round 4 (of 4, the last on the cap) covers exactly these items, chosen by the human on
  2026-10-26 in /gsd-verify-work 37 from 37-UAT.md (gaps G-37-2 and G-37-4): G-37-2 (on a host whose
  package.json says `"type": "commonjs"`, the npm 11 `npm init -y` default, every program under
  `tools/grugops/` stops at its first import with a SyntaxError and exit 1, the finding code; the
  installer writes `tools/grugops/package.json` holding `{"type":"module"}` under the installer
  contract: idempotent, additive, dry-run-capable, reversible, recorded in the install ledger, removed
  by uninstall and never written over a user's file; plus a regression test with a planted commonjs
  host), and G-37-4: WR-12 (the hand-trace scan's
  comma-list and `per Workflow 16` exclusions reach the whole run; fix per 37-REVIEW.md), WR-14 (a
  non-directory context-root entry whose name falls outside the task grammar gets no remedy; ask the
  entry's lstat first) and IN-14 (state-check follows an in-root link at the board and the indexes,
  which state-roll and trace-render refuse). Nothing else. WR-13 is accepted and recorded in
  37-REVIEW-DISPOSITION.md (an open-set heuristic, held as content, not mechanism; the live scan set
  has 0 hits). The five round-3 rule changes the human kept (37-UAT.md test 3) stand. WR-03, WR-04,
  WR-06, WR-07, WR-10, IN-01, IN-02, IN-04, IN-05, IN-07, IN-08 and IN-09 stay open in
  37-REVIEW-DISPOSITION.md. The CI-reachability item (37-UAT.md test 1) is deferred to backlog 999.12
  and is not in this round. Agents follow 37-GAP-PLANNING-BRIEF.md §1.3. — **Reversibility:**
  reversible (scope only).
  Amended by the human on 2026-10-26, before execution: the `--check` line for
  `tools/grugops/package.json` is dropped. `--check` reports no runnable, and a re-run of the
  installer materializes the file. (The scope as first recorded also asked for the file to be
  "reported by `--check` where the other runnables are".)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/37-overview-board-per-file-records-and-budgets/37-GAP-PLANNING-BRIEF.md` — defect
  classes and rules for every gap round (D-17)

### Scope and milestone decisions
- `.planning/ROADMAP.md` § Phase 37: goal, success criteria, notes (D-6, D-7)
- `.planning/REQUIREMENTS.md`: SPLIT-01..SPLIT-07; MIGRATE-01..07 (Phase 38 consumes the marker, archive root and budgets)
- `.planning/PROJECT.md` § Key Decisions: v3.0 D-4, D-6, D-7, D-8, D-9, D-11
- `.planning/phases/36-state-layout-authority-path-move-and-protection/36-CONTEXT.md`: layout detection (D-01, D-02), fallback clause, old-spelling gate
- `.planning/research/ARCHITECTURE.md` and `.planning/research/SUMMARY.md`: dogfood measurements, state-check generated-region design, pitfalls 5-7
- `.planning/research/PITFALLS.md`: budget and trace pitfalls

### Contracts and authorities
- `agent-factory/contracts/board.md`: board grammar, closed 8-key ticket set, 7 closed conflict kinds (changes here first)
- `install/state-layout.ts`: path authority; gains budgets, the marker, the archive paths, N
- `agent-factory/contracts/context-note.md`: note refs the trace render reads

### Code touched
- `scripts/board-model.ts`: reader bounds (not budgets), conflict kinds
- `scripts/trace-render.ts`, `scripts/trace-freshness.ts`, `scripts/context-io.ts`: render source and freshness
- `scripts/validate-agent-factory.ts`: `checkTickets`, required state files, new budget check
- `scripts/generate-hook-manifest.ts` and `hooks/hook-entry.ts`: the generated-region and freshness precedent
- `install/install.ts` (`RUNNABLES`, around line 5729): runnable materialization into `tools/grugops/`
- `scripts/runnable-ref/*.ts`: existing runnable shape and exit contract

### Seed, workflows and roles
- `agent-factory/seed/memory-bank/plans/board.md`, `nfr-catalog.md`, `traceability.md`, `agent-factory/seed/memory-bank/60-progress.md`
- `agent-factory/workflows/05-pr-quality-gate.md`, `09-daily-sweep.md`, `12-release.md`, `16-context-read-write.md`
- Roles with traceability or NFR-catalog write instructions: `agent-factory/roles/architect-design.md`, `security-nfr.md`, `release-manager.md`, `incident-responder.md`, plus every role or workflow hit for "traceability" (about 52 append-style sites); edits are mechanical, and the full prose rewrite is Phase 40

### Dogfood evidence (read-only)
- `/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example`: board 754 KB (183 rows, 561 `_Updated:` lines, 171 Done rows), tickets 176 (p50 18 KB, p90 47 KB, max 238 KB), progress 90 KB, mostly standing directives

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/trace-render.ts`: already renders from note refs with a deterministic ref classifier; it becomes per-ticket output plus the index and reads two roots.
- `scripts/runnable-ref/` and `install.ts` `RUNNABLES`: the materialization path for `state-check.js`, `trace-render.js` and `state-roll.js`.
- `scripts/generate-hook-manifest.ts`: the pattern for generating budget constants into a marked region with a freshness gate.
- `scripts/board-model.ts` `parseTicketDocument` and the board parser: the only sanctioned readers; `state-check` must not grow a second board parser (it either embeds the same grammar by generation or limits itself to byte and line facts).

### Established Patterns
- "Derive the set, assert the count": new subpaths, budgets and runnables get two-sided pinned counts (`STATE_ROOT_COUNT` style).
- Runnable exit contract: 0 pass, 1 finding, 2 could-not-run (never a pass), no exit code means could-not-run.
- Contract-first grammar changes; one authority per predicate; never a second parser.

### Integration Points
- WF05 and WF09 call `trace-render.js`, then `state-check.js`; WF09 calls `state-roll.js` on a rollable over-budget surface.
- Validator budget check reads `state-layout.ts`; severity is decided by the marker.
- Seed gains `nfr/`, `traceability/` and `archive/` folders (`.gitkeep`) and the marker; the seed board, NFR catalog and traceability files are rewritten as overview and indexes.

</code_context>

<specifics>
## Specific Ideas

- The marker must work on the markdown-copy install path too: the seed carries it, so no installer code is needed for a fresh repo.
- Phase 38 must, in order: split, write tickets and trace, then write the marker last. A failed migrate leaves no marker, so budgets stay WARN.
- The 64 KB ticket budget is a deliberate choice to fail outliers honestly rather than carry an exemption list.

</specifics>

<deferred>
## Deferred Ideas

- Moving existing standing directives out of a host's `60-progress.md` into `50-decisions/`: a migrate concern (Phase 38) or a manual cleanup; this phase only sets the rule for new writes.
- Tightening budgets after dogfood data from a migrated repo: a future decision with a recorded reason.

</deferred>

---

*Phase: 37-overview-board-per-file-records-and-budgets*
*Context gathered: 2026-10-21*
