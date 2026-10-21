# Phase 37: Overview board, per-file records and budgets - Research

**Researched:** 2026-10-21
**Domain:** In-repo TypeScript tooling (state layout authority, board grammar, trace render, host runnables, installer seed), markdown kit prose
**Confidence:** HIGH for the code facts (every one read this session); MEDIUM for the recommended designs in Claude's-discretion areas

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (not re-asked)
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

#### Trace render on hosts
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

#### Migrated signal (WARN vs FAIL)
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

#### Done growth and rollover
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

#### Budgets
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

### Deferred Ideas (OUT OF SCOPE)
- Moving existing standing directives out of a host's `60-progress.md` into `50-decisions/`: a migrate
  concern (Phase 38) or a manual cleanup; this phase only sets the rule for new writes.
- Tightening budgets after dogfood data from a migrated repo: a future decision with a recorded reason.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPLIT-01 | `board.md` is an overview: one short line per ticket per column, at most one `_Updated:` line; contract changed first; detail lives in the ticket file | Contract-first ordering (§ Architecture Pattern 1); board budget measured through the embedded `parseBoard` (Pattern 3); Done archive placement design (Pattern 5); dogfood row measurements (§ Budget check) |
| SPLIT-02 | Each NFR is its own file; `nfr-catalog.md` is a one-line-per-NFR index | `NFR_DIR_REL` constant; one index-line grammar owned by the rules module (Pattern 4); state-check two-direction integrity (D-13) |
| SPLIT-03 | Trace is one file per ticket rendered from published note refs; `traceability.md` is a one-line index; no role says append by hand | Embed-by-generation of `readContext`'s builtins-only closure (Pattern 2, measured 27 declarations, 385 lines); two roots (D-03); 17 roles and 19 workflows carry a required `## Trace updates` section that must be rewritten, not removed (Pitfall 6) |
| SPLIT-04 | Validator enforces per-file byte budgets; WARN unmigrated, FAIL migrated | Shared rules module + marker (Pattern 4); `--strict` on own tree must stay green (Pitfall 9) |
| SPLIT-05 | `tools/grugops/state-check.js` with generated budgets, freshness-gated, checks budgets and index↔file integrity, called by WF05/WF09 | Generator + freshness gate (Pattern 2); RUNNABLES/RUNNABLES_MIRROR/REMOVABLE_COUNT pins (Pitfall 7); CI wiring inside the existing ubuntu block (Pitfall 8) |
| SPLIT-06 | `60-progress.md` rolls older entries into an archive when over budget; `queue/done/` and `50-decisions/` move-only | `state-roll.js` with line-conservation proof (Pattern 6); dogfood progress has **zero** dated status entries (Pitfall 4) |
| SPLIT-07 | Ticket frontmatter key set stays closed; detail goes in the body | `TICKET_KEYS` / `TICKET_KEY_COUNT = 8` already pinned two-sided; recommended body section layout (§ Code Examples) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Tooling is TypeScript compiled with `tsc` to committed `.js`; a freshness check proves the committed `.js` matches its source. Host machines run committed `.js` with zero runtime dependencies on Node 22+. Dev deps are only `{typescript, vitest, @types/node}`; no bundler may be added.
- Safety (hard): agents never merge a protected branch or deploy to production; the git host is the floor. Nothing in this phase may weaken that.
- Single-source: role text lives once; adapters are thin pointers. Edits to role prose must be followed by the adapter/catalog/skill-twin generators and their freshness gates.
- Zero-config first: every role honors `factory.config.json` when present and runs lean when absent.
- Voice discipline: clear professional voice in every trace, safety, security and compliance surface. All new runnable output, contract text and finding wording is clear voice. (Memory note: caveman voice was retired for v3.0 roles; clear voice is the rule for every surface this phase touches.)
- Installers: idempotent, additive, dry-run capable, reversible; never overwrite or delete user content.
- No fabrication: unknown commands are `UNKNOWN - verify`; never fake a gate, a test result or a citation. A runnable exit 2 is never a pass.
- Minimal `AGENTS.md`: keep it short; push detail into the files it points to.
- Brand: lowercase `grugops`.
- GSD workflow enforcement: file edits go through `/gsd-execute-phase`.
- Memory-derived hazards: scratch `install.js` runs must set `GRUGOPS_HOME`; never run bare `npm test` (it starts the live claude-CLI e2e lane); hand-maintained sets rot while green, so derive each set and assert its count.

## Summary

Phase 36 left a constants-only path authority (`install/state-layout.ts`, 87 lines) with no budgets, a board grammar with one sanctioned reader (`scripts/board-model.ts`), a trace render that writes one monolithic file from note refs (`scripts/trace-render.ts`), and four materialized host runnables that are single files importing only `node:` builtins. This phase adds budgets, a marker, archive paths and new record directories to the authority; splits the trace into per-ticket generated files; adds three host runnables (`state-check`, `trace-render`, `state-roll`); and rewrites the seed, the board contract and the trace instructions in every role and workflow.

The central technical question is how a single-file, builtins-only host runnable can use the board grammar, the note read path and the budget numbers without a second copy of any of them. The measured answer is that all three are already import-free: `parseBoard`'s declaration closure in `board-model.ts` imports nothing (354 lines), `readRawNotesWithSkips` + `recordFromParsed` in `context-io.ts` close over `node:crypto`, `node:fs` and `node:path` only (27 declarations, 385 lines), and `state-layout.ts` imports nothing. So one generator can **embed each authority's declaration closure verbatim into a marked region** of each runnable source, and one freshness gate can prove each region is a faithful derivation. This is the `generate-hook-manifest.ts` pattern widened from a hash table to source text, and it is the "embed the same grammar by generation" option CONTEXT.md already sanctions. No bundler is needed, and no code moves out of `context-io.ts` (whose source is parsed by several guard tests).

Six findings change what the plans must contain: (1) the installer's `seedState` re-seeds any missing seed file on every install, so a marker in the seed would mark an already-populated new-layout repo as migrated on its next install; the marker must be seeded only when the layout is `fresh`. (2) A generated region that spells `memory-bank/plans` breaks the Phase 36 LAYOUT-02 ownership test, which pins the literal holders to exactly three files. (3) `freshness:traceability` is not wired in CI today, and the committed `memory-bank/plans/traceability.md` is the hand-written table, not the render; the gate passes only because `.grugops/context/` does not exist. (4) The dogfood `60-progress.md` has zero dated `##` status entries, so D-09's rollover would roll nothing there. (5) Only 309 of 3,308 dogfood notes (9.3%) carry a `seal:` line, and the one note reader skips unsealed notes, so a render through it shows a small share of the dogfood trace and must report the skips by count. (6) The board projector's traceability reader keys on a header cell `Ticket`, while the current render writes `| Requirement | …`, so the projector already reads zero trace rows from any rendered file.

**Primary recommendation:** Land the contract and the constants first, then one builtins-only rules module (`scripts/state-rules.ts`) that owns every budget, index-line, marker and progress-entry predicate, then one embed generator with one freshness gate that writes the rules, the board grammar, the note read path and the layout constants into the three runnables. Seed the marker only on a `fresh` layout.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State paths, budgets, marker path, archive paths, N | Constants authority (`install/state-layout.ts`) | — | Phase 36 rule: the one place a state path or budget is spelled |
| Budget, index-line, marker, progress-entry and Done-roll predicates | Shared rules module (`scripts/state-rules.ts`, builtins-only, pure) | Embedded into runnables by generation | One owner per rule; the validator imports it, runnables embed it |
| Board grammar | `scripts/board-model.ts` | Embedded into `state-check` and `state-roll` | Only sanctioned reader; embedded copy is byte-identical by gate |
| Note reading (seal, FIFO-safe read, parse) | `scripts/context-io.ts` read closure | Embedded into `trace-render` (and `state-check` for the freshness compare) | One read authority; unsealed notes skipped by name |
| Trace model (classify refs, build per-ticket text, index text) | New pure module (`scripts/trace-model.ts`) | Embedded into both trace runnables | Render and freshness compare must agree byte for byte |
| Budget enforcement in grugops | Validator (`scripts/validate-agent-factory.ts`) | CI | SPLIT-04 |
| Budget and integrity enforcement in hosts | `tools/grugops/state-check.js` (read-only) | WF05, WF09 | SPLIT-05; never writes |
| Rollover writes | `tools/grugops/state-roll.js` | WF09 | D-08; the only writer of archives besides humans |
| Trace file writes | `tools/grugops/trace-render.js` | WF05, WF09 | D-01/D-02; no role writes a trace file |
| Placing archived Done tickets | Board reader (`scripts/board-read.ts` + `joinSnapshot`) | Board contract | D-07; a reader change recorded in the contract first |
| Marker seeding | Installer `seedState` | Seed tree | D-04 plus the fresh-only rule (Pitfall 1) |
| Authoring rules (overview row, body sections, NFR files, progress entries, move-only) | Kit prose (contract, seed comments, roles, workflows) | — | Agents follow prose; the runnables check the outcome |

## Standard Stack

No external package is added. Every capability uses the existing toolchain.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (`tsc`) | 6.0.3 (`~6.0.3` in package.json) [VERIFIED: `npx tsc --version` and package.json:51] | Compile runnables and the generator to committed `.js`; its compiler API powers the embed generator at dev time only | Already the tooling layer (D-13) |
| Vitest | 4.1.8 (`~4.1.8`) [VERIFIED: `npx vitest --version` and package.json:52] | Unit and spawn tests | Repo standard |
| Node.js | `>=22` engines; local v26.11.1, CI pins 22 [VERIFIED: package.json:7-8, ci.yml "Setup Node 22"] | Runs committed `.js` on hosts | Hard prerequisite |
| `node:fs`, `node:path`, `node:crypto` | builtins | All runnable I/O and the note seal digest | Runnables are builtins-only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embed-by-generation | A bundler (esbuild, rollup) | Adds a dev dependency outside `{typescript, vitest}`; rejected by the stack constraint |
| Embed-by-generation | Materialize several files into `tools/grugops/` with relative imports | Breaks D-01's "single file"; more ledger entries and uninstall rows |
| Embed-by-generation | Move the note read path out of `context-io.ts` into its own module | Several guard tests parse `context-io.ts` source (`context-io.test.ts`, `context-io-writer-set.test.ts`, `nonblocking-reader-parity.test.ts`, `floor-invariance.test.ts`); a move risks reddening them. Embedding needs no move |
| `state-check` embeds the render | `state-check` spawns `node tools/grugops/trace-render.js --check` | Spawning works (host-protection spawns `gh`) but couples two runnables and turns a missing sibling into exit 2. Embedding keeps `state-check` self-contained |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package. No registry lookup or legitimacy check applies.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                 install/state-layout.ts  (constants: paths, budgets, marker, N, counts)
                          |                         |
                          v                         v
   scripts/state-rules.ts (pure predicates)   scripts/board-model.ts (parseBoard)   scripts/context-io.ts (read closure)
          |        |                                  |                                   |
          |        +----------------------+-----------+-----------------+-----------------+
          v                               |                             |
 scripts/validate-agent-factory.ts        v                             v
 (grugops CI: budgets WARN/FAIL     scripts/generate-runnable-embeds.ts  -->  marked regions in
  by marker; index<->file)          (TS AST declaration closure,              scripts/runnable-ref/state-check.ts
          |                          builtins-only check)                     scripts/runnable-ref/trace-render.ts
          v                               |                                   scripts/runnable-ref/state-roll.ts
      ERROR / WARNING              scripts/runnable-embeds-freshness.ts            |  tsc -> committed .js
                                   (re-derive, compare, exit 1 on drift)          v
                                                                         install.ts RUNNABLES -> host tools/grugops/*.js

 Host repo, WF05 / WF09:
   .grugops/context/**/notes + CONTEXT_ARCHIVE_REL/**/notes
        --> trace-render.js <repo>  --> memory-bank/plans/traceability/<ID>.md + traceability.md index
        --> state-check.js <repo>   --> exit 0 / 1 (finding) / 2 (could not run)
                 | marker valid?  yes: budgets are findings (exit 1)   no: budgets are warnings (exit 0, printed)
                 | rollable surface over budget? (Done rows > N, progress > budget with dated entries)
                 v
   WF09 only: state-roll.js <repo> --> moves whole entries, proves conservation, rolls back on mismatch
   WF05: exit 1 -> observation note, never blocks; exit 2 or signal -> could-not-run, never a pass
```

### Recommended Project Structure
```
install/state-layout.ts                  # + record dirs, archive paths, marker, budgets, N, two-sided counts
scripts/state-rules.ts                   # NEW pure, builtins-only: budget checks, index-line grammar, marker validity,
                                         #     progress status-entry grammar, Done-roll plan, conservation proof
scripts/trace-model.ts                   # NEW pure: classify refs, per-ticket text, index text (from NoteRecord[])
scripts/generate-runnable-embeds.ts      # NEW generator: declaration-closure embed into marked regions
scripts/runnable-embeds-freshness.ts     # NEW gate: re-derive every region, exit 1 on drift
scripts/runnable-ref/state-check.ts      # NEW runnable (read-only)
scripts/runnable-ref/trace-render.ts     # NEW runnable (writes trace files; --check is read-only)
scripts/runnable-ref/state-roll.ts       # NEW runnable (writes archives)
scripts/trace-render.ts                  # becomes a thin repo entry over trace-model (or is retired in favour of the runnable)
scripts/trace-freshness.ts               # directory compare over traceability/ + index
agent-factory/seed/memory-bank/plans/{nfr,traceability,archive}/.gitkeep, .layout (marker)
```

### Pattern 1: Contract first, then constants, then everything else
**What:** `agent-factory/contracts/board.md` gains the overview authoring rule, the Done-archive placement rule and the trace-index reading rule before any reader, seed, validator or role edit (locked). The contract already states its own change protocol: "A newly admitted shape is recorded here first and implemented afterwards" [VERIFIED: agent-factory/contracts/board.md:580-581] and "There are exactly seven kinds. The set is closed, and an eighth kind is a decision recorded here first" [VERIFIED: agent-factory/contracts/board.md:248-249].
**When to use:** Wave 1, plan 1.
**Note:** The overview rule is an **authoring and budget** rule, not a grammar change. The reader keeps admitting long rows (its bounds stay `LARGE_BOARD_BYTES = 1_048_576`, `LONG_LINE_CHARS = 65_536`, `MAX_META_CHARS = 1_024` [VERIFIED: scripts/board-model.ts:72-83]); the validator and `state-check` report the budget.

### Pattern 2: Embed-by-generation (one generator, one freshness gate)
**What:** A generator reads an authority module with the TypeScript compiler API, computes the transitive closure of named top-level declarations, refuses if the closure references any import whose specifier does not start with `node:`, and writes the declarations' source text verbatim (plus the merged `node:` import lines) between two marker comments in each runnable source. A freshness gate re-runs the derivation and exits 1 on any difference, exactly as `hook-manifest-freshness.ts` does.

**Measured closures (this session, with a TS-AST closure script over the live sources):**

| Authority | Roots | Declarations | Lines | Imports in closure |
|-----------|-------|--------------|-------|--------------------|
| `scripts/board-model.ts` | `parseBoard` | 41 | 354 | none |
| `scripts/context-io.ts` | `readRawNotesWithSkips`, `recordFromParsed` | 27 | 385 | `node:crypto` createHash; `node:fs` closeSync, existsSync, constants (as fsConstants), fstatSync, openSync, readSync, readdirSync; `node:path` join |
| `scripts/context-io.ts` | `readContext` | 31 | 393 | as above plus `node:path` dirname (via `ROOT = join(import.meta.dirname, "..")`) — **use the narrower roots above**, so no `import.meta`-relative default root reaches a host |
| `install/state-layout.ts` | `BOARD_REL`, `TICKETS_REL` | 3 | 3 | none |

[VERIFIED: closure script run over scripts/board-model.ts, scripts/context-io.ts and install/state-layout.ts this session]

**The precedent being widened** [VERIFIED: scripts/generate-hook-manifest.ts:18-19]:
```typescript
export const MANIFEST_OPEN = "// <hook-manifest> GENERATED — do not edit by hand; run `npm run generate:hook-manifest`";
export const MANIFEST_CLOSE = "// </hook-manifest>";
```
`rewriteHookEntry` replaces the text between the two markers and returns `{ changed, text }`; the freshness gate fails when `changed` is true [VERIFIED: scripts/generate-hook-manifest.ts:89-99, scripts/hook-manifest-freshness.ts].

**Rules for the generator (recommended):**
- One spec table: `{ target runnable, authority module, root names }[]`, with its row count pinned two-sided.
- Refuse a closure that reaches a non-`node:` import (state-layout is import-free, so its constants embed as declarations, not imports).
- Merge `node:` named imports per specifier into the region; the hand-written part of each runnable imports builtins as namespaces (`import * as nodeFs from "node:fs"`) so names never collide with embedded named imports.
- Refuse two embeds that declare the same top-level name in one target.
- Emit declarations in source order per authority, so a reordering in the authority shows as drift rather than being normalized away.

### Pattern 3: Budgets measured through the grammar, owned once
**What:** Every budget is a pure function in `scripts/state-rules.ts` that takes already-read text (and for the board, the `BoardModel` from `parseBoard`) and returns findings. The validator imports it; each runnable embeds it. Pitfall 7 of the milestone research says "Define the board budget in terms of the grammar ... Measure it with `board-model`, not with a raw byte count" [CITED: .planning/research/PITFALLS.md:173-175]. Embedding `parseBoard` makes that possible on hosts.
**Board facts to measure:** total UTF-8 bytes; for each `columns[].rows[]` row, the length of its source line; the count of `updates[]` plus the count of `unparsed[]` lines that begin `_Updated:` (the seed's own `_Updated: <ISO date> by <role>_` line does not match `UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/` [VERIFIED: scripts/board-model.ts:151], so counting `updates[]` alone would miss it).
**Unit:** state "characters" as UTF-16 code units, the unit the contract already uses for `LONG_LINE_CHARS` [VERIFIED: agent-factory/contracts/board.md:486].

### Pattern 4: One marker, two severities
**What:** `scripts/state-rules.ts` exports `markerState(text | null): "absent" | "valid" | { invalid: reason }`. The validator maps a budget finding to `err` when valid and `warn` otherwise; `state-check` exits 1 when valid and prints WARN lines with exit 0 otherwise. An invalid marker is itself a named WARNING (D-05). Absence alone is **not** a warning (see Pitfall 9).

### Pattern 5: Archived Done rows stay placed (recommended design for D-07)
**What:** The Done archive file is itself a board-grammar document with exactly one heading, `## Done (WIP unlimited)`, read by the same `parseBoard`. The reader gains a seventh source, `boardArchive`, and `joinSnapshot` treats the archive's rows as placements **only** for `ticket-unplaced` and `ticket-duplicated` (a ticket on the board and in the archive is a duplicate, which catches a half-done roll). Archive rows never count toward WIP and never raise `column-missing`. `ticket-unplaced` is additionally gated on the archive source being `ok` (absent counts as an empty archive), on the same reasoning the contract already gives for the tickets listing [VERIFIED: agent-factory/contracts/board.md:272-277].
**Why this over a status exemption:** exempting `status: done` tickets from `ticket-unplaced` would make a done ticket with no row anywhere silent, which is the "resolved in silence" failure the contract forbids.
**Cost, stated:** the sources tuple is closed and pinned: `SOURCE_NAMES = ["board","tickets","queue","context","traceability","config"]` and `SOURCE_COUNT = 6`, with the comment "A seventh joined source is a decision recorded in the phase context and in the contract, never a bumped constant" [VERIFIED: scripts/board-read.ts:457-472]. A new source changes the published snapshot, so `SCHEMA_VERSION = 2` [VERIFIED: scripts/board-model.ts:60] moves to 3 and `scripts/fixtures/board-snapshot/expected-snapshot.json` is regenerated in the same commit, per the contract's rule "any change to the published shape moves this number and regenerates the golden in the same commit" [VERIFIED: agent-factory/contracts/board.md:558-559]. This needs a recorded decision (see Open Question 1).

### Pattern 6: Rollover with a conservation proof
**What:** `state-roll.js <repo> [--dry-run]` computes a plan with pure functions from `state-rules.ts`, writes the archive first, then the source, both atomically (temp file + rename), then re-reads both and checks: `old_source_lines == new_source_lines + moved_lines` as an ordered sequence with the moved block removed, and `new_archive == old_archive` with the moved block inserted at the stated position. On any mismatch it writes the old bytes back to both files and exits 1 naming the mismatch. It refuses (exit 2) when the Done column holds anything but rows and blank lines, rather than guessing where an entry ends.
**Done ordering:** the contract states that a new Done row is written at the top of the Done column, so "most recent N" means the first N rows by position. The parser never reads dates from `meta`, which "is not interpreted" [VERIFIED: agent-factory/contracts/board.md:157-161]. The dogfood Done column is already newest-first (first rows `ABC-176`, `ABC-191`, `ABC-188`; last rows `ABC-093`, `ABC-108`, `ABC-142`) [VERIFIED: cli-chess-example plans/board.md Done section, read this session].
**Progress:** a status entry is a `##` heading that begins with an ISO date (for example `## 2026-10-21 — <summary>`); everything else is standing content and never rolls (D-09).

### Anti-Patterns to Avoid
- **A second board parser or note parser in a runnable.** Embed by generation instead.
- **Retyping budget numbers in a runnable.** Generate them.
- **A budget welded onto `board-model.ts` reader bounds.** Locked out by CONTEXT.md.
- **Deleting the `## Trace updates` section from roles or workflows.** It is a required section prefix (see Pitfall 6); rewrite its body.
- **A vacuous trace freshness pass when the index exists.** Render from zero notes and compare; the committed hand table in grugops's own tree must fail that compare.
- **Deriving a trace or NFR file path from link text.** Derive the path from the identifier and require the link to equal that spelling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundling a runnable | A string-concatenation bundler | The embed generator over the TS AST (dev-only `typescript`) | ESM import semantics, aliases (`constants as fsConstants`) and name collisions |
| Reading notes on hosts | A new frontmatter reader | Embedded `readRawNotesWithSkips` + `recordFromParsed` | Seal check, FIFO-safe read, 8 MiB ceiling (`NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024` [VERIFIED: scripts/context-io.ts:1196]) |
| Reading the board on hosts | A `^- \[` regex | Embedded `parseBoard` | Comment blanking, heading forms, line partition |
| Path containment for reads | `path.resolve` prefix checks | The `realpathSync`-based approach `board-read.ts` documents (`insideRoot`) | Lexical resolve misses symlinks (CR-04 history recorded in board-read.ts header) |
| Atomic writes | `writeFileSync` in place | Temp file + rename, as `context-io.ts` `atomicWrite` does | Torn files on crash |
| Freshness | A new compare framework | The `rewriteHookEntry` + gate shape | Already proven, already understood by CI |

**Key insight:** every grammar in this repository took several review rounds to close. A second copy of any of them, however small, restarts that cost. Byte-identical embedding plus a freshness gate keeps one grammar.

## Runtime State Inventory

This phase changes formats and adds files rather than renaming, but it changes what existing installed trees mean.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Host repos on the new layout (Phase 36 path) with monolithic boards and no marker; grugops's own `memory-bank/plans/traceability.md` is the hand table, not the render [VERIFIED: file read this session] | Marker seeding must skip non-fresh layouts (Pitfall 1); own tree re-rendered and marker placed by hand (D-06) |
| Live service config | None. grugops has no hosted service | None |
| OS-registered state | None | None |
| Secrets/env vars | None. New runnables read no env var; `GRUGOPS_HOME` is a test hazard only | None |
| Build artifacts | Hosts keep `tools/grugops/*.js` from an older kit forever: `materializeRunnable` never overwrites an existing file and reports one that differs [VERIFIED: install/install.ts:5785-5799] | State it in the install docs: an updated `state-check.js` reaches an existing host only after the user removes the old copy or reinstalls into a clean `tools/grugops/`. Out of scope to change |

## Common Pitfalls

### Pitfall 1: The seed marker marks an unmigrated repo as migrated
**What goes wrong:** `seedState` copies every seed file the target lacks, on every install, on the `current` and `both` layouts too; it skips state-root seed paths only for `pre-v3` and unreadable layouts [VERIFIED: install/install.ts:5691-5720]. A marker in the seed is therefore written into an existing new-layout repo with a large board on its next install, and budgets switch to FAIL with no migration.
**How to avoid:** seed `LAYOUT_MARKER_REL` only when `stateLayout()` returns `"fresh"`. The layout type is `"current" | "pre-v3" | "both" | "fresh" | { unreadable, code }` [VERIFIED: install/install.ts:867]. On any other layout, print one `skipped` line naming the marker and stating that Phase 38's migrate writes it. A test installs over a fixture with `memory-bank/plans/board.md` and no marker and asserts the marker is absent afterwards (with `GRUGOPS_HOME` set to a temp path).
**Warning signs:** a test that only installs into an empty directory.

### Pitfall 2: The generated region breaks the LAYOUT-02 ownership test
**What goes wrong:** `scripts/check-state-paths.test.ts` asserts that the modules holding a string literal containing `STATE_ROOT_REL` are exactly `["install/state-layout.ts", "scripts/generate-role-adapters.ts", "scripts/kit-model.ts"]` [VERIFIED: scripts/check-state-paths.test.ts:324]. An embedded `export const STATE_ROOT_REL = "memory-bank/plans";` in a runnable source is a fourth holder.
**How to avoid:** amend the ownership case in the same plan as the generator: a holder outside the three is admitted only when every such literal lies inside a generated region, and the region's freshness gate is green. Record the amendment with its reason; never add the runnables to the list by name alone.
**Also:** never embed `LEGACY_STATE_ROOT_REL` (`"plans"`): its quoted form is the `segment` spelling the old-spelling gate counts [VERIFIED: scripts/state-path-scan.ts spellingPatterns]. Choose roots whose closure does not reach it.

### Pitfall 3: The trace freshness gate is not in CI, and the own tree is not a render
**What goes wrong:** `ci.yml` runs eight `freshness*` scripts; `freshness:traceability` is not among them [VERIFIED: grep of .github/workflows/ci.yml returned 0 matches]. The committed `memory-bank/plans/traceability.md` carries the hand header `| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |`, while the render writes `| Requirement | Code | Tests | UAT | Release |` [VERIFIED: scripts/trace-render.ts:171]. The gate passes only through its greenfield branch ("no .grugops/context/ notes tree exists yet ... vacuous pass") [VERIFIED: scripts/trace-freshness.ts:98-104].
**How to avoid:** the directory-compare rewrite renders from zero notes when the context roots are absent and compares the result against the committed index and directory; add the gate to the existing ubuntu gate step. Re-render grugops's own index as part of the seed/own-tree plan.

### Pitfall 4: Rollover rolls nothing on the dogfood
**What goes wrong:** the dogfood `memory-bank/60-progress.md` is 90,525 bytes in 16 `##` sections, none of them dated; ten are `Standing directive`/`Standing rulings`/`Standing fact` sections and the rest are `What works`, `What's left`, `Known issues`, `The branch stack …`, `Governance facts …`, `Next action` [VERIFIED: section scan of cli-chess-example this session]. The seed has the same three undated headings [VERIFIED: agent-factory/seed/memory-bank/60-progress.md].
**How to avoid:** the seed progress file changes to dated status entries (comment block states the entry form) and the three standing headings either go or are kept short and marked "not rolled". State-check reports an over-budget progress file with no rollable entry as a finding (exit 1 on a migrated repo), naming the standing sections and pointing to `50-decisions/`. Moving dogfood directives is deferred (CONTEXT.md).

### Pitfall 5: A sealed-only render looks empty on existing repos
**What goes wrong:** the one note reader skips a note without a valid seal as `unsealed` [VERIFIED: scripts/context-io.ts:2219-2224]. In the dogfood, 309 of 3,308 tracked note files carry a `seal:` line at all (presence only, validity not checked) [VERIFIED: git ls-files + grep in cli-chess-example this session]. The current render also swallows a whole unreadable task with `catch { continue; }` [VERIFIED: scripts/trace-render.ts:132-136].
**How to avoid:** the render prints, every run, the counts of tasks read, notes read and notes skipped per arm (`vanished`, `not-a-regular-file`, `above-ceiling`, `unopenable`, `unparseable`, `unsealed`), and never swallows a task. Weakening the seal is not an option. The user should be told the dogfood trace will be sparse (Open Question 4).

### Pitfall 6: Rewriting trace instructions breaks required sections
**What goes wrong:** `ROLE_SECTIONS` and `WORKFLOW_SECTIONS` both require the prefix `"## Trace updates"` [VERIFIED: scripts/validate-agent-factory.ts:243-266]; 17 of 18 role files and the workflows carry it (the 18th is `_role-switch-protocol.md`). Grep finds 48 lines matching append-style traceability wording across roles, workflows, checklists and `AGENTS.md`.
**How to avoid:** keep the heading (its suffix may change, since the match is a prefix), replace the body with "publish the refs in a note per Workflow 16; the trace is rendered, never edited". Add a test that derives the scan set from `kit-model` (`listRoles`, `listWorkflows`) plus the checklists and `AGENTS.md`, asserts the set size equals the derived count, and finds zero append-to-traceability instructions. After prose edits run `generate:adapters`, `generate:catalog`, `generate:skill-twins`, `generate:host-entries` and their freshness gates, plus the prose gates (`check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-public-docs-vocabulary`).

### Pitfall 7: Pinned counts move when files land
**What goes wrong:** several two-sided pins move with this phase:
- `RUNNABLES` and `RUNNABLES_MIRROR` must stay the same mapping [VERIFIED: install/install.ts:5754-5764, install/uninstall.ts:2795-2802, install/install.test.ts:6103].
- `REMOVABLE_COUNT = 41` in `install/record-truth.test.ts:358` [VERIFIED] counts files install created; three runnables make it 44.
- `NON_TEST_MODULE_COUNT = 101` [VERIFIED: scripts/check-foundation-guards.test.ts:2279] equals `git ls-files '*.ts'` minus tests and `.d.ts` (101 measured this session); every new non-test module moves it.
- `TRIPWIRE_MODULES = 75` counts `ls scripts/*.test.ts` [VERIFIED: scripts/check-foundation-guards.test.ts:9816]; new top-level test files move it (tests under `scripts/runnable-ref/` do not).
- `STATE_ROOT_COUNT = 7` [VERIFIED: install/state-layout.ts:78] does not move unless a new first-segment root is protected.
- `install/state-layout.test.ts` asserts "every subpath of the state root is the state root plus exactly one segment" [VERIFIED: install/state-layout.test.ts, `describe("every *_REL constant is POSIX-relative")`]; `memory-bank/plans/archive/board-done.md` is two segments and fails it. Amend the rule to "a subpath of a declared subtree constant is that subtree plus one segment", with the reason recorded.
**How to avoid:** every pin moves with a dated note naming the module that landed, re-derived rather than incremented, as the existing notes do.

### Pitfall 8: A new CI step after the ubuntu gate block reds a guard
**What goes wrong:** `check-foundation-guards.test.ts` asserts the committed workflow carries no step marker after the ubuntu gate block ("The day a step is appended to ci.yml this assertion reds") [VERIFIED: scripts/check-foundation-guards.test.ts:11990-11999].
**How to avoid:** add `npm run freshness:traceability` and the embed freshness gate as lines inside the existing "Freshness gates + repo gates (ubuntu only)" run block, and add matching `package.json` scripts.

### Pitfall 9: `--strict` on grugops's own tree
**What goes wrong:** `scripts/validate.test.ts` asserts the validator is green on the own tree bare **and** `--strict` with zero warnings [VERIFIED: scripts/validate.test.ts:233-244]. If the absence of a marker were itself a WARNING, `--strict` would fail until D-06 lands, and every validator fixture without a marker would gain a warning.
**How to avoid:** a missing marker prints on the informational `SCOPE`-style line (stderr, not a WARNING). Budget findings exist only when a budget is broken. An invalid marker is a WARNING by name (D-05).

### Pitfall 10: Generated trace files that cannot meet their budget
**What goes wrong:** a trace file is generated, so a human cannot shorten it. Estimated over the dogfood refs with the render's own classifier and ignoring the seal (an upper bound): 206 tickets, p50 1,808 B, p90 5,713 B, max 19,334 B (`ABC-083`), 14 over 8,192 B [VERIFIED: scratch estimate this session; format overhead approximated as 60 B].
**How to avoid:** keep 8 KB (with the seal gate far fewer tickets reach it), and word the finding so it names the ticket and says the remedy is splitting the ticket's work, not editing the file. Flagged for confirmation (A6).

### Pitfall 11: Case-folded trace file names collide
**What goes wrong:** `isTicketRef` accepts lowercase prefixes (`/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/`) [VERIFIED: scripts/trace-render.ts:59-64]. On macOS and Windows defaults, `abc-1.md` and `ABC-1.md` are one file.
**How to avoid:** the render refuses (exit 1, naming both identifiers) when two trace keys fold to the same file name, rather than letting one overwrite the other. `install/kit-plan-limits.test.ts` already tests the same class for kit destinations.

### Pitfall 12: The board projector's traceability source
**What goes wrong:** `parseTraceability` in `board-read.ts` locates the table by a header whose first cell is `"Ticket"` (`TRACE_HEADER_CELL = "Ticket"`) [VERIFIED: scripts/board-read.ts:1860]. The render's header starts `Requirement`, so the projector reads zero rows from any rendered file today.
**How to avoid:** make the new index a pipe table whose first header cell is `Ticket`, or change `parseTraceability` to read the index through the rules module's index-line grammar. Either way, record it in the contract's "Reconciliation and non-goals" section, and fold any published-content change into the same `SCHEMA_VERSION` bump as Pattern 5. A new import into `board-read.ts` must keep its import closure read-only (`scripts/board-readonly.test.ts`, DASH-06).

## Code Examples

### The authority today (what the new constants sit beside)
```typescript
// Source: install/state-layout.ts:24, 33-51 [VERIFIED: read this session]
export const STATE_ROOT_REL = "memory-bank/plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
export const NFR_CATALOG_REL = `${STATE_ROOT_REL}/nfr-catalog.md`;
export const TRACEABILITY_REL = `${STATE_ROOT_REL}/traceability.md`;
export const METRICS_REL = `${STATE_ROOT_REL}/metrics.md`;
```

### Recommended additions (names and paths are recommendations, not existing values)
```typescript
// [ASSUMED] names and paths; budget numbers are D-10 (locked); keep the module constants-only
export const NFR_DIR_REL = `${STATE_ROOT_REL}/nfr`;
export const TRACE_DIR_REL = `${STATE_ROOT_REL}/traceability`;
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;                 // outside every budget
export const BOARD_DONE_ARCHIVE_REL = `${ARCHIVE_REL}/board-done.md`;    // D-07 (path locked)
export const PROGRESS_REL = "memory-bank/60-progress.md";
export const PROGRESS_ARCHIVE_REL = `${ARCHIVE_REL}/progress.md`;
export const DECISIONS_REL = "memory-bank/50-decisions";
export const DECISIONS_ARCHIVE_REL = `${ARCHIVE_REL}/decisions`;
export const QUEUE_DONE_REL = ".grugops/queue/done";
export const QUEUE_DONE_ARCHIVE_REL = ".grugops/archive/queue-done";
export const CONTEXT_REL = ".grugops/context";
export const CONTEXT_ARCHIVE_REL = ".grugops/archive/context";          // D-03
export const LAYOUT_MARKER_REL = `${STATE_ROOT_REL}/.layout`;           // D-04
export const LAYOUT_MARKER_CONTENT = "layout: v3\n";                     // D-05
export const BUDGETS = Object.freeze({
  boardBytes: 24 * 1024, boardRowChars: 160, boardUpdatedLines: 1,
  indexEntryBytes: 200, ticketBytes: 64 * 1024, nfrBytes: 8 * 1024,
  traceBytes: 8 * 1024, progressBytes: 16 * 1024, doneRows: 20,
} as const);
export const BUDGET_COUNT = 9; // two-sided: equals Object.keys(BUDGETS).length
```
Note: `Object.freeze` over an object literal is a call expression; the constants-only test bans imports, functions and classes, not calls, and `STATE_ROOTS` already uses `Object.freeze` [VERIFIED: install/state-layout.ts:63].

### Ticket body sections (SPLIT-07, Claude's discretion)
```markdown
---
id: ABC-014
title: Asset allocation chart
status: blocked
column: Blocked
---
## Blocked
- 2026-10-21, raised by Software Engineer: waiting on ADR-0007 (owner: Architect/Design)

## Board notes
Anything that used to sit in a board row trailer, verbatim.
```
The closed key set stays `id title status column size priority epic feature` with `TICKET_KEY_COUNT = 8` [VERIFIED: scripts/board-model.ts:948-960]. The body "is the ticket's prose and is never interpreted" [VERIFIED: agent-factory/contracts/board.md:112-113].

### Index lines (Claude's discretion; each at most 200 bytes)
```markdown
<!-- nfr-catalog.md: one line per nfr/<ID>.md, kept by hand -->
- [NFR-001](nfr/NFR-001.md) Performance: p95 API under 300 ms on read endpoints

<!-- traceability.md: generated; first header cell is Ticket so board-read keeps reading it -->
| Ticket | Trace |
| --- | --- |
| ABC-012 | [traceability/ABC-012.md](traceability/ABC-012.md) |
```
Integrity rule: the checker derives the expected link target from the identifier and requires the line's link to equal it exactly; it never opens a path taken from link text.

### Runnable exit contract (existing, to copy)
```typescript
// Source: scripts/runnable-ref/reference-check.ts [VERIFIED: read this session]
// missing input path -> stderr message, process.exit(2)
// findings -> one line each (or --json {ok:false, findings}), process.exit(1)
// clean -> "No findings." (or --json {ok:true, findings:[]}), process.exit(0)
```

### Recommended CLI shapes
```
node tools/grugops/trace-render.js <repo-root>            # writes traceability/<ID>.md + traceability.md; 0/1/2
node tools/grugops/trace-render.js <repo-root> --check    # read-only compare; 0 fresh / 1 stale / 2 could not run
node tools/grugops/state-check.js  <repo-root> [--json]   # read-only; 0 / 1 (findings, marker valid) / 2
node tools/grugops/state-roll.js   <repo-root> [--dry-run] # moves whole entries; 0 / 1 (conservation failed, rolled back) / 2
```
Every finding line names the file, the measured value, the budget and its unit, for example `memory-bank/plans/board.md: 31,204 bytes, budget 24,576 bytes (BUDGETS.boardBytes)`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Trace appended by hand in every role | Trace rendered from note refs (`trace-render.ts`) | Phase 24 (MIGR-03) | Roles still say "append"; this phase removes it |
| One monolithic `traceability.md` | One file per ticket plus a one-line index | This phase | Freshness becomes a directory compare |
| No layout marker | `LAYOUT_MARKER_REL` decides WARN vs FAIL | This phase (D-04) | Phase 38 writes it last |
| Budgets nowhere | Constants in `state-layout.ts`, checked by validator and `state-check` | This phase | Phase 36 left the "every budget" clause vacuous on purpose |

**Deprecated/outdated:**
- The seed traceability comment "Roles append rows as work is done" [VERIFIED: agent-factory/seed/memory-bank/plans/traceability.md comment block]: replaced by the generated-index header.
- The seed board example row with a trailer (`— in flight`): replaced by the overview form.

## Budget check against seed and dogfood (D-10)

| Budget | Seed / own tree | Dogfood (`cli-chess-example`, read-only) | Recommendation |
|--------|-----------------|------------------------------------------|----------------|
| Board 24 KB | seed 5,976 B; own 5,934 B | 778,050 B, 1,323 lines, 190 rows, 605 `_Updated:` lines | Keep. After migration with N = 20 Done rows the dogfood holds about 31 rows plus about 6 KB of scaffolding |
| Row 160 chars | no rows | 71 of 190 rows exceed 160 once `  (owner: software-engineer, since: 2026-10-21)` is added; 19 of 190 exceed 160 with `- [ID] title` alone (titles p50 86, p90 147, max 260) | Keep 160 for new writes. Phase 38 copies titles verbatim, so a few migrated rows will FAIL until a human shortens them; tell Phase 38 |
| `_Updated:` at most 1 | 1 (placeholder form) | 605 | Keep |
| Ticket 64 KB | none | 183 files; p50 18,400 B, p90 42,880 B, max 238,187 B; 8 over 64 KB | Keep (D-11, no exemptions) |
| NFR 8 KB | none | 11 NFR rows in a 388,918 B catalog; row p50 3,839 B, p90 13,840 B, max 18,160 B | Keep; several migrated NFRs will exceed it |
| Trace 8 KB | none | estimated p90 5,713 B, max 19,334 B, 14 of 206 over (upper bound, seal ignored) | Keep; see Pitfall 10 and A6 |
| Progress 16 KB | seed 422 B; own 429 B | 90,525 B, no dated entries | Keep; see Pitfall 4 |
| Index entry 200 B | n/a | n/a | Keep; the recommended index lines are 60 to 120 B |
| Done N = 20 | 0 | 179 Done rows | Keep |

[VERIFIED: wc, grep and awk measurements over agent-factory/seed, the own tree and /Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example this session]

Dogfood ticket file names are `ABC-001-position-state-and-fen.md` style, so a file stem is not the identifier there. Identity comes from the `id` key when present [VERIFIED: agent-factory/contracts/board.md:95]. Trace files are keyed by identifier (`traceability/<ID>.md`), never by ticket stem.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Marker path `memory-bank/plans/.layout` with content `layout: v3\n` | Code Examples | Costly (D-04): Phase 38 and hosts depend on it. Confirm before the constants plan |
| A2 | A marker with a CRLF line ending or a leading BOM is valid after the same two normalizations `normalizeDocument` applies to boards and tickets (contract: board.md:115-121) | Pattern 4 | Without it, a Windows `autocrlf` checkout reads every marker as invalid and budgets stay WARN on Windows CI |
| A3 | Archive names: `memory-bank/plans/archive/{progress.md,decisions/}`, `.grugops/archive/{queue-done,context}` | Code Examples | Low; discretion area, but Phase 38 MIGRATE-06 consumes `CONTEXT_ARCHIVE_REL` |
| A4 | Archived Done rows are placed through a seventh reader source and `SCHEMA_VERSION` 3 | Pattern 5 | Needs a recorded decision; the alternative (status exemption) silences a real conflict |
| A5 | New Done rows are written at the top of the Done column, so "most recent" means first by position | Pattern 6 | If agents append at the bottom, the roll archives the newest rows |
| A6 | Trace file budget stays 8 KB even though trace files are generated | Pitfall 10 | Some tickets FAIL with no file-level remedy |
| A7 | Index line formats shown in Code Examples | Code Examples | Low; discretion area |
| A8 | The progress status-entry form is a `##` heading beginning with an ISO date | Pattern 6 | Rollover rolls nothing if agents write another form |
| A9 | `state-check` embeds the trace render rather than spawning `trace-render.js --check` | Alternatives | Low; either meets D-01 |
| A10 | Absence of a marker is informational, not a WARNING | Pitfall 9 | If it is a WARNING, `--strict` reds on the own tree and fixtures |

## Open Questions

1. **Placing archived Done tickets (D-07).**
   - What we know: `ticket-unplaced` fires for a ticket with no row; the source tuple and conflict set are closed and pinned; a new source bumps the schema.
   - What's unclear: whether the user accepts a seventh source and `SCHEMA_VERSION` 3.
   - Recommendation: seventh source `boardArchive`, recorded in the contract first (Pattern 5).
2. **Marker path and normalization (D-04, D-05).**
   - Recommendation: `memory-bank/plans/.layout`, content `layout: v3`, BOM and CRLF normalized only. Confirm, because the choice is costly to reverse.
3. **Progress seed shape (D-09).**
   - What we know: the seed's three undated headings never roll.
   - Recommendation: seed a comment that defines dated status entries and drop or shrink the three headings.
4. **Sparse trace on existing repos.**
   - What we know: about 9% of dogfood notes carry a seal line; the reader skips the rest by name.
   - Recommendation: keep the seal authority and report skip counts; tell the user before Phase 38's dogfood run.
5. **Trace file budget for a generated file (A6).**
   - Recommendation: keep 8 KB; finding wording points at splitting the ticket.
6. **Should `scripts/trace-render.ts` survive as a repo entry?**
   - Recommendation: keep it as a thin wrapper over `trace-model.ts` + `context-io.ts` so grugops's own tooling keeps one import graph, and make the generated header command-neutral ("GENERATED by grugops trace-render — do not hand-edit") so the own-tree render and the host render produce identical bytes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling and runnables | ✓ | v26.11.1 local; CI pins 22 | — |
| TypeScript | Build, embed generator | ✓ | 6.0.3 | — |
| Vitest | Tests | ✓ | 4.1.8 | — |
| git | Ownership and state-path gates (`git ls-files`) | ✓ | 2.56.0 | — |
| Dogfood tree | Budget measurements (read-only) | ✓ | `/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example` | — |

Known local-only noise: `install/installer-fs-census.test.ts` fails on Node 26 (`openAsBlobSync` unclassified), and about 20 tests fail because archived phase-27/31/33 records are absent [VERIFIED: .planning/phases/36-state-layout-authority-path-move-and-protection/deferred-items.md]. Capture this baseline before the first plan so new failures are told apart.

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8, `globals: false` (explicit imports) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run <changed test files>` (tests drive the committed `.js`, so run `npm run build` first) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (never bare `npm test`) |
| Gates after prose or generated-file changes | `npm run freshness`, `npm run freshness:traceability`, the new embed freshness script, `npm run freshness:adapters`, `npm run freshness:catalog`, `npm run freshness:skill-twins`, `npm run freshness:host-entries`, `node scripts/check-state-paths.js`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPLIT-01 | Board over 24 KB, a row over 160 chars, two `_Updated:` lines each produce a finding; WARN without marker, ERROR with it | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/validate.test.ts` | ❌ Wave 0 (`state-rules.test.ts`) |
| SPLIT-01 | Archived Done row keeps its ticket placed; a ticket on board and archive is `ticket-duplicated`; unreadable archive suppresses `ticket-unplaced` | unit | `npx vitest run scripts/board-model.test.ts scripts/board-read.test.ts scripts/board-tracer.test.ts` | ✅ (extend) |
| SPLIT-02 | NFR index↔file both directions: missing file, file without line, two lines for one file, link not equal to derived path | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts` | ❌ Wave 0 |
| SPLIT-03 | Per-ticket render from two roots; skip counts printed; case-fold collision refused; byte-reproducible | spawn | `npx vitest run scripts/runnable-ref/trace-render.test.ts scripts/trace-render.test.ts` | ❌ / ✅ (rewrite) |
| SPLIT-03 | Directory compare fails on extra file, missing file, changed byte; renders from zero notes when roots are absent | spawn | `npx vitest run scripts/trace-freshness.test.ts` | ✅ (rewrite) |
| SPLIT-03 | No role, workflow, checklist or `AGENTS.md` line tells an agent to append to traceability; scan set derived and counted | unit | `npx vitest run scripts/trace-instructions.test.ts` | ❌ Wave 0 |
| SPLIT-04 | Every budget in `BUDGETS` is checked by the validator (derived from the object, count asserted) | unit | `npx vitest run scripts/validate.test.ts install/state-layout.test.ts` | ✅ (extend) |
| SPLIT-05 | Embedded regions equal a fresh derivation; a hand edit inside a region reds; closure with a non-`node:` import refused | unit + spawn | `npx vitest run scripts/generate-runnable-embeds.test.ts` | ❌ Wave 0 |
| SPLIT-05 | `state-check.js` copied into a bare temp dir (no `node_modules`) runs and exits 0/1/2 correctly (host emulation, as reference-check.test.ts does) | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts` | ❌ Wave 0 |
| SPLIT-05 | Install materializes the three runnables; uninstall removes them; marker seeded only on `fresh` | spawn (GRUGOPS_HOME temp) | `npx vitest run install/install.test.ts install/record-truth.test.ts` | ✅ (extend) |
| SPLIT-06 | Roll moves rows past N and oldest dated progress entries; conservation proven; a forced mismatch restores both files byte for byte; refuses non-row lines in Done | spawn | `npx vitest run scripts/runnable-ref/state-roll.test.ts` | ❌ Wave 0 |
| SPLIT-07 | Key set stays eight; contract names the body sections | unit | `npx vitest run scripts/board-model.test.ts` | ✅ (existing pin) |

### Sampling Rate
- **Per task commit:** the quick command for the touched test files, after `npm run build`.
- **Per wave merge:** the full non-e2e suite plus the gates listed above.
- **Phase gate:** full non-e2e suite green against the captured baseline, every freshness gate green, own tree validator green bare and `--strict` with the marker in place (D-06).

### Wave 0 Gaps
- [ ] `scripts/state-rules.test.ts` — budget, index-line, marker, progress-entry, Done-roll and conservation predicates
- [ ] `scripts/generate-runnable-embeds.test.ts` — derivation, refusal of non-builtin closures, drift detection
- [ ] `scripts/runnable-ref/state-check.test.ts`, `trace-render.test.ts`, `state-roll.test.ts` — spawn and host-emulation cases
- [ ] `scripts/trace-instructions.test.ts` — derived scan set, zero append instructions
- [ ] Baseline capture of the known failing tests (deferred-items.md) before the first plan

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | Runnables run with the user's own permissions |
| V5 Input Validation | yes | Every state file is untrusted input: identifiers checked against the board identifier shape before they become file names; link targets compared to the derived path, never opened |
| V6 Cryptography | yes (existing) | The note seal uses `node:crypto` sha256 through the embedded authority; never re-implemented |
| V7 Error Handling and Logging | yes | Exit 2 is could-not-run and never a pass; C0, C1 and DEL removed from every printed value, as the board contract requires for its own output |
| V12 Files and Resources | yes | Realpath containment under the repo root; FIFO-safe reads (embedded `readRegularFileOrNull`); size ceilings before reading; atomic temp+rename writes; no write outside the fixed archive and trace paths |
| V14 Configuration | yes | Marker content validated exactly; invalid content reported by name |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal through a ticket or NFR identifier or an index link | Tampering | Identifier shape check; derived paths only; realpath containment |
| Symlinked `traceability/` or archive directory pointing outside the repo | Tampering | Resolve every write target's parent with `realpathSync` and refuse outside the root |
| FIFO or device at a note, ticket or index path hanging the runnable | Denial of service | Open with `O_NONBLOCK`, `fstat` regular-file check, size ceiling (the embedded context-io read) |
| Terminal control sequences in titles or file names echoed by `state-check` | Tampering | Strip C0, C1 and DEL before printing |
| A forged marker switching budgets to WARN | Repudiation | WF05 still records every finding; the validator in grugops CI reads its own tree. The marker is a severity switch, not a security boundary, and the docs must say so |
| A partial roll losing lines | Tampering / data loss | Conservation proof and byte-exact rollback (D-08) |

## Sources

### Primary (HIGH confidence, read this session)
- `install/state-layout.ts`, `install/state-layout.test.ts` — authority, encoding and constants-only rules
- `agent-factory/contracts/board.md` — grammar, closed sets, conflicts, bounds, schema version rule
- `scripts/board-model.ts`, `scripts/board-read.ts` — reader, sources, traceability parser
- `scripts/trace-render.ts`, `scripts/trace-freshness.ts`, `scripts/context-io.ts` — render, gate, note read path, seal
- `scripts/generate-hook-manifest.ts`, `scripts/hook-manifest-freshness.ts` — generated-region precedent
- `scripts/validate-agent-factory.ts`, `scripts/validate.test.ts` — required sections, strict expectations
- `install/install.ts` (`RUNNABLES`, `materializeRunnable`, `seedState`, `stateLayout`), `install/uninstall.ts` (`RUNNABLES_MIRROR`)
- `scripts/check-state-paths.ts`, `scripts/state-path-scan.ts`, `scripts/check-state-paths.test.ts` — old-spelling gate and ownership case
- `scripts/check-foundation-guards.test.ts`, `install/record-truth.test.ts` — pinned counts
- `.github/workflows/ci.yml`, `package.json` — gate wiring
- `agent-factory/seed/**`, `memory-bank/**` — seed and own-tree state
- `.planning/phases/36-*/36-VERIFICATION.md`, `36-14-SUMMARY.md`, `deferred-items.md`

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` (milestone research; cross-checked against code above)

### Measurements
- Dogfood tree `/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example` (read-only): file sizes, row and title lengths, Done ordering, progress sections, note seal presence, estimated rendered trace sizes
- Declaration-closure script over the TS AST (scratchpad, not committed)

No external documentation was needed: the phase uses no library beyond the existing toolchain. The research-plan seam was not invoked for that reason, and graphify is disabled in this project.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; versions probed.
- Architecture: MEDIUM-HIGH — closures and pins measured; the embed generator, archive source and marker path are recommendations awaiting confirmation.
- Pitfalls: HIGH — each one reproduced from source or measurement this session.

**Research date:** 2026-10-21
**Valid until:** 2026-11-20 (in-repo facts move with each commit; re-measure pinned counts at task start)
