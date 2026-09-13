# Phase 32: Board Projector & CLI Dashboard - Context

**Gathered:** 2026-09-13
**Status:** Ready for planning

<domain>
## Phase Boundary

One board-grammar authority, `scripts/board-model.ts`, parses `plans/board.md` (column headings, WIP
numbers, ticket rows) and joins it with ticket frontmatter, queue state, context notes and
traceability into one typed `FactorySnapshot` that **surfaces** disagreement in `conflicts[]`. A
separate read-only process, `scripts/board-dashboard.ts`, renders that snapshot live in a terminal
(directory-level `fs.watch` + mandatory poll floor), and in `--json` / `--once` / non-TTY modes for
CI and piping. The column-heading parser is extracted from and deleted in
`scripts/validate-agent-factory.ts`. Read-only is enforced by an import-graph guard, not prose.

Out of scope: any web/HTTP renderer, any listening socket, any write path, any runtime dependency,
a `/grug board` skill (deferred), and any change to how agents write the board (deferred; see
"board bloat"). The Windows `fs.watch` claim stays `UNKNOWN - verify` until Phase 33 turns the
`windows-latest` leg green.

Requirements: DASH-01..DASH-08. Standing rule from Phase 31: four-round gap-closure cap.

</domain>

<decisions>
## Implementation Decisions

**Facts every decision was taken against (verified on the tree and on two real agent-written
boards, 2026-09-13):**

- Two live boards exist outside the repo at `~/Projects/hacks/grugops-examples/cli-chess-example/plans/board.md`
  (410 lines, 380 KB, one line of 34,494 chars, 25 `_Updated:` header lines, 20 `<!-- OUTGOING HEADER`
  comments) and `~/Projects/hacks/grugops-examples/dogfood-example/plans/board.md` (119 lines, 11 KB).
  Every ticket row in both is `- [ID] title  (…)`. The parenthetical has at least four disagreeing
  shapes: `(BA/PM, XS, P1, epic: EPIC-006, since: 2026-08-20, DoR 9/10 …)`, `(EPIC-004, S, P0, DoR 8/10, needs ABC-078)`,
  `(epic: EPIC-006, size: M, P1)  — merged to main 2026-06-06 (…)`, and `(owner: Software Engineer, since: …)`
  from the kit's own comment. The Done column carries prose paragraphs between rows. Epic rows
  (`- [EPIC-003] …`) sit in Backlog beside ticket rows. The chess board records a duplicate-row incident
  and two WIP-count corrections in its own header.
- The kit board (`plans/board.md`, seed twin `agent-factory/seed/plans/board.md`, 124 lines each, 2 prose
  lines apart) has a 48-line HTML comment (`:4-51`) containing a structurally valid mini-board
  (`## In Development (WIP 1/3)` + two rows, 4-space indented). `plans/traceability.md:15` has the same
  hazard. Nothing in `scripts/` strips HTML comments today.
- Headings on the kit board: 13 columns as `## <Name> (WIP n/m)` / `(WIP unlimited)` /
  `## Blocked (visible, time-tracked)`, plus non-column H2s `## Columns (spec §6.1)` and `## Conventions`
  and H3s `### Sizing/Priority/Blocked policy`. The original spec
  (`docs/initial/agent_factory_builder_spec_v2.md:604-621`) shows `## Blocked (2)` and bare rows with no
  parenthetical.
- The validator's whole board reader is `checkTickets()` at `scripts/validate-agent-factory.ts:721-762`.
  WR-03 hardening is the comment at `:729-734` and code at `:735-741`: `boardColumnName` strips
  `^##\s+` and `\s*\(WIP[^)]*\)\s*$`, `boardHasColumn` requires exact equality after the strip (the old
  `startsWith("## " + col + " ")` let column `In` match `In Development`). The strip does NOT normalize
  `Blocked (visible, time-tracked)` and turns `Columns (spec §6.1)` into a phantom column. Board↔ticket
  check at `:747-755` (`kebab(column) === status`). Vacuity guard `:723` returns when `plans/tickets/` is
  empty, which it is today. Nothing in the file is exported; it exits via `process.exit`.
- Ticket frontmatter fields (board contract `plans/board.md:37-42`, chess tickets confirm):
  `id, title, status, column, size, priority, epic, feature`. `scripts/canonical-frontmatter.ts` is the
  D-64 allow-list reader; `scripts/frontmatter.ts` is demoted to transformation-only (header `:1-40`).
- Existing readers to join: `readContext(task, contextRoot)` / `currentState(notes)`
  (`scripts/context-io.ts:1850/1857`, `NoteRecord` `:98-112`), queue layout and `renderNowRunning`
  (`scripts/claim.ts:1-43`, `:277`), traceability table header (`plans/traceability.md:35-36`, writer
  `scripts/trace-render.ts`). Config `factory.config.json#wip_limits` lists 10 limited columns.
- `atomicWrite` (`scripts/context-io.ts:896-926`, clone `scripts/claim.ts:218-248`) does
  unlink-then-rename on Windows `EPERM/EEXIST/EACCES`; that unlink is the ENOENT window DASH-05 names.
  Nothing in `scripts/` writes `plans/board.md`; agents edit it directly.
- Zero `--json`, `isTTY`, ANSI, or `fs.watch` usage exists in `scripts/*.ts`. Entry detection is
  `scripts/is-entry.ts` `isEntrypoint(import.meta.url)` and a test refuses any other
  `import.meta.url ===` comparison. Cleanest CLI shape: `coordinator-resolution-precheck.ts:591`
  `code = main(process.argv.slice(2)); process.exit(code)`.
- Import-graph walker exists: `scripts/js-import-closure.ts` (`jsImportClosure(root, entryRel)`,
  refuses rather than returns short). AST-derived symbol-set precedent with two-sided count:
  `scripts/context-io-writer-set.test.ts:15,250,254`. Walk bound idiom: `kit-model.ts` `MAX_WALK_ENTRIES`
  with the "a hung gate is not a red gate" rationale.
- `package.json` has no `dependencies` key at all; every script is `tsc --outDir .tmp-build && node scripts/<x>.js`;
  `freshness` covers `scripts/` so a new `.ts` + committed `.js` twin is gated automatically.

### Row grammar canonical form (DASH-01, DASH-02)

- **D-01: Only `- [ID] title` is grammar; the parenthetical is one opaque `meta: string`.** The
  canonical row is `^- \[<ID>\] <title>(  \((<meta>)\))?$` with the two-space gap before the
  parenthetical. Nothing inside `meta` is parsed, no key:value hints are extracted, so all four
  observed real-world shapes are legal and none becomes the de-facto spec. A row with no parenthetical
  is legal (`meta: null`). Rejected: a best-effort `hints` map (a second grammar to keep honest); a full
  parenthetical grammar (both live boards would be mostly refused).
  — **Reversibility:** costly — `meta` is part of the `schemaVersion: 1` snapshot shape (D-19); adding
  structured fields later is additive, but reinterpreting `meta` breaks the golden fixture and any
  consumer.
- **D-02: The ID is bounded by `^[A-Z][A-Z0-9]*-\d+$`, and when `factory.config.json#id_prefix` is
  present the prefix must equal it.** Rows whose prefix is `EPIC` or `FEAT` are a second named class
  (`epicRows[]`), not tickets, and are not joined against `plans/tickets/`. Any other bracket content
  makes the line `unparsed`. Rejected: any `PREFIX-number` with no config read; the shipped
  `[A-Z]{3}-\d{3}` shape only (the chess board is already at `ABC-117`).
- **D-03: A comment-aware pre-pass strips every `<!-- … -->` (including multi-line) before any heading
  or row scan; `_Updated:` lines are their own class.** The board's 48-line documentation block and its
  mini-board are therefore invisible to the grammar by construction, not by indentation. A line matching
  the canonical `_Updated: YYYY-MM-DD by <actor>` prefix becomes an `updates[]` entry `{date, actor, text}`;
  a non-matching `_Updated:` line is `unparsed`. **The parse-oracle fuzz suite's adversarial corpus MUST
  include the board's own comment block (both twins) and the traceability comment, asserting zero
  columns, zero rows, zero updates from them.** Any other non-blank line inside a column section that is
  neither heading, row, epic row nor update is `unparsed[]` with its line number, never dropped, so the
  renderer can say "3 unparsed lines in Done". Rejected: dropping `_Updated:` as noise; relying on the
  indent rule (one `trimStart()` turns the doc block into live state).
- **D-04: The written spec lives in the board's own comment AND a new normative contract.** The
  48-line HTML comment in `plans/board.md` and its seed twin is rewritten to state the canonical heading
  and row form in one short block (agent-facing copy; both twins must stay in sync and the existing
  near-twin relationship is asserted). `agent-factory/contracts/board.md` is the normative spec that
  `board-model.ts` cites in its header and from which the fuzz corpus's legal/illegal axes are
  derived. Rejected: contract only (agents editing the board never see the form); module docblock only.

### Column heading authority (DASH-01)

- **D-05: The heading canonical form is exactly three suffixes.** `## <Name> (WIP <n>/<m>)`,
  `## <Name> (WIP unlimited)`, `## Blocked (visible, time-tracked)`. A `##` heading whose suffix is not
  one of these is a **non-column heading** (`## Columns (spec §6.1)`, `## Conventions`) and opens no
  column; `###` headings never do. `<Name>` is whatever precedes the suffix, trimmed. The 13-column flow
  order in the contract is the render order.
- **D-06: "Ported verbatim" for WR-03 means semantics preserved, defects fixed, deviations named.**
  Exact-name equality after suffix strip is kept and pinned by the original counterexample (column `In`
  must NOT match `## In Development (WIP 0/3)`), and the prefix-match shape is asserted absent. Two
  deliberate deviations are recorded in the plan and the contract: the suffix strip widens from
  `(WIP …)` to D-05's three forms so `Blocked` normalizes to `Blocked`, and non-canonical suffixes no
  longer create phantom columns. The helper is deleted from `validate-agent-factory.ts`, which imports
  `board-model.js` (its first import from `scripts/`); `checkTickets()`'s membership and
  `kebab(column) === status` rule keep their current messages. Rejected: byte-for-byte port carrying
  both defects into `conflicts[]`.
- **D-07: `## Blocked (visible, time-tracked)` is the only legal Blocked heading.** The old spec's
  `## Blocked (2)` is recorded in the contract as documented non-grammar and refused loudly (it fails
  D-05, so it is a non-column heading and its rows become `unparsed`, which the renderer shows). Per
  D-64 posture: refuse outside the form, never widen the parser.
- **D-08: The column SET comes from the board's headings, cross-checked against config.** Headings
  matching D-05 define which columns exist and in what order they appear on disk.
  `factory.config.json#wip_limits` supplies the expected limit per column. A heading limit that
  disagrees with config is a `wip-limit` conflict; a config column with no heading is a
  `column-missing` conflict; a heading column absent from config is legal (unlimited or Blocked) and
  noted, not refused. Nothing is resolved silently. Rejected: config as the sole authority (a renamed
  column silently loses its rows); board only with no config read (loses the cross-check).
- **D-09: The WIP live number is parsed as `claimedLive` and compared to `rows.length`.** A mismatch is a
  `wip-count` conflict; the renderer shows both numbers (`claimed 2 / counted 3 / limit 3`). Nothing is
  auto-corrected. Epic rows are not counted toward WIP (they are a separate class per D-02); the contract
  says so.

### Conflicts & stale semantics (DASH-03, DASH-04, DASH-05)

- **D-10: `conflicts[]` has exactly these kinds, as a closed `as const` set with a two-sided count
  test:** `board-vs-ticket` (row under column X, ticket file says `column:` Y or `status !== kebab(column)`),
  `ticket-unplaced` (ticket file with no board row), `ticket-duplicated` (same ID under two or more
  headings; the row renders in both, the conflict names both), `row-without-file` (board row with no
  `plans/tickets/<ID>.md`; the row still renders), `wip-limit`, `wip-count`, `column-missing` (D-08/D-09).
  Every conflict carries `{kind, ticketId?, column?, expected, actual, source}`. Unparsed lines are NOT
  conflicts; they live in `unparsed[]`.
  — **Reversibility:** costly — kinds are part of the `schemaVersion: 1` shape (D-19); adding a kind is
  a version bump plus golden update.
- **D-11: The snapshot reader returns a discriminated result, following Phase 30 D-12.** Shape:
  `{ source: "ok" | "stale" | "unavailable", snapshot, conflicts, readErrors }`. Every file read is
  read-verify-reread (stat, read, stat; size and mtime must agree, else bounded retry). A failed or torn
  read, a partial parse, or an ENOENT on a path that existed at the previous read NEVER produces an
  empty section: the previous good value for that source is kept and the source is marked stale.
  There is no "empty board" output state distinct from "zero rows under real headings"; a board with
  no rows renders its columns with zero counts.
- **D-12: Staleness is per source, with one badge.** Each joined source (`board`, `tickets`, `queue`,
  `context`, `traceability`, `config`) carries `readAt` and `stale: {reason, since} | null`. The header
  shows one `STALE` badge naming the stale source(s) and the age of the last good read of each. `--json`
  carries the same per-source fields. Rejected: whole-snapshot staleness (one missing `.grugops/` would
  hide a fresh board).
- **D-13: Absent is a legitimate state; unreadable is stale.** `.grugops/` or `.grugops/queue/` not
  existing yields `queue: {present: false}` and renders as "no queue" with no badge; `plans/tickets/`
  empty is `tickets: []`. ENOENT on a file seen at the previous read, EACCES, and a torn read are
  `stale`. Rejected: any missing source is stale (every fresh repo shows STALE forever).
- **D-14: Poll floor 10 seconds (user's call: "tasks don't move that fast").** Directory-level
  `fs.watch` on `plans/`, `plans/tickets/`, `.grugops/queue/{pending,claimed,done}/`, `.grugops/context/`
  triggers an immediate debounced (250 ms) re-read, so the poll is the safety net for an orphaned
  watch (the atomic-rename path) or a filesystem without events, not the primary refresh path. The
  poll is mandatory and cannot be disabled. `--interval <ms>` overrides the poll period with a hard
  floor of 1000 ms. Each re-read is bounded with the `MAX_WALK_ENTRIES` idiom (a hung read is a stale
  badge, never a frozen screen). A watch that errors is closed, noted in `readErrors`, and re-armed on
  the next poll. Windows behaviour of `fs.watch` is `UNKNOWN - verify` until Phase 33 CAP-02.

### Dashboard surface & JSON shape (DASH-06, DASH-07, DASH-08)

- **D-15: Two modules, one boundary.** `scripts/board-model.ts` is pure: parse + join + conflict
  derivation, no `process`, no rendering, no timers. `scripts/board-dashboard.ts` owns argv, the watch
  loop, TTY detection and rendering. The validator imports only `board-model.js`.
- **D-16: Invocation is `node scripts/board-dashboard.js [repoRoot]` plus an npm script
  (`"dashboard": "tsc --outDir .tmp-build && node scripts/board-dashboard.js"`).** No new `/grug` skill,
  no installer shim, no adapter change this phase; the byte-gated skill-twin set and every derived count
  that pins it are untouched. Uses `isEntrypoint(import.meta.url)` and the `main(argv) => code` shape.
- **D-17: Live terminal layout, top to bottom:** header line (repo root, mode lean/enterprise from
  config, last read time, `STALE` badge per D-12, conflict count, `LARGE BOARD` warning per D-20);
  columns in contract flow order with `live/limit` (or `claimed n / counted m / limit k` on a `wip-count`
  conflict) and rows as `ID  title` truncated to terminal width, empty columns collapsed to one line,
  Blocked last; `Now running` from `.grugops/queue/claimed/*/claim.md` (`by`, `at`, `task`), or "no queue";
  `Conflicts` listed by kind; `Unparsed` count per column. No recent-notes block (deferred). Plain
  text with minimal ANSI (bold headers, one badge color); no cursor-addressing library, redraw by
  clearing the screen only when `stdout.isTTY`.
- **D-18: Non-TTY, `--once`, `--json` semantics.** `--once` (or `!stdout.isTTY` without `--json`)
  prints one frame and exits 0 even when stale or conflicted (state is in the frame; exit code is not
  the channel). `--json` prints exactly one JSON document of the D-11 result and nothing else on stdout;
  with `--once` implied unless `--watch` is also given, in which case it emits one JSON document per
  line (NDJSON) per re-read. Diagnostics go to stderr. Exit 2 only for usage errors and an unreadable
  `repoRoot`. Terminal rendering never happens when stdout is not a TTY.
- **D-19: The snapshot shape is stabilized by `schemaVersion: 1`, an exported TS type, and a
  fixture-pinned golden test.** `FactorySnapshot` and the D-11 result type are exported from
  `board-model.ts`; a committed fixture tree under `scripts/fixtures/` (a board with all seven conflict
  kinds, epic rows, `_Updated:` lines, unparsed prose, the HTML doc block, tickets, a queue and a
  context task) renders to a committed golden JSON byte-for-byte. Any shape change bumps
  `schemaVersion` and updates the golden in the same commit. No JSON Schema file this phase.
  — **Reversibility:** one-way — `schemaVersion: 1` is the published contract a future web renderer
  consumes unchanged (DASH-08); breaking it is a major bump for that consumer.
- **D-20: Large boards degrade visibly, never refuse.** A board over 1 MB or any single line over 64 KB
  is still parsed; the snapshot sets `bounds: {boardBytes, longestLine, exceeded: true}` and `meta` /
  `updates[].text` strings are truncated to a bounded length with a `…` marker and `truncated: true`.
  The header shows `LARGE BOARD (380 KB, longest line 34 KB)`. Rows are never dropped. Rejected: hard
  refuse over the ceiling (a growing board goes permanently stale); no bound.
- **D-21: Read-only is proven by an import-graph guard, with the mutating-symbol set derived, not
  hand-listed.** A test walks `jsImportClosure(ROOT, "scripts/board-dashboard.js")` and, for every
  module in the closure, derives its `node:fs` / `node:fs/promises` imported and member-accessed symbols
  by the TypeScript AST (the `context-io-writer-set.test.ts` idiom) and asserts the intersection with
  the mutating set is empty. The mutating set is itself derived: every `node:fs` export whose name
  matches the write-class stems (`write*`, `append*`, `rename*`, `unlink*`, `rm*`, `mkdir*`, `mkdtemp*`,
  `copy*`, `cp*`, `chmod*`, `chown*`, `truncate*`, `utimes*`, `link*`, `symlink*`, `create*Stream` write
  variants, `open` with a write flag literal) is enumerated from `import * as fs from "node:fs"` at test
  time, and the enumerated count is asserted two-sided against a pinned number so a Node upgrade that
  adds a writer turns the guard red rather than silently widening the allow. The guard also asserts the
  closure imports no `node:child_process`, `node:net`, `node:http`, `node:https`, or `node:worker_threads`
  (DASH-08 "no socket"). It runs in the repo suite AND as a `check:*` npm script. `board-model.ts` must
  not import `context-io.ts` or `claim.ts` wholesale (both export writers); it re-implements or imports
  only their pure readers, and the guard is what makes that a mechanical rule.

### Plan-time amendments (2026-09-13, from 32-RESEARCH.md measurements)
- **D-22: A row carries an opaque `trailer` after the parenthetical.** Measured: D-01's anchored regex admits 103/141 real rows (2/16 on the dogfood board) because 14 rows carry prose after the closing paren. The row grammar splits at the first `  (`, balanced-paren scans to the matching `)`, and keeps everything after it as `trailer: string | null`. Nothing inside `meta` or `trailer` is parsed. D-01 is amended, not replaced: `- [ID] title` stays the only grammar. Rejected: keeping the anchored form and refusing 38 real rows as non-conforming.
  — **Reversibility:** costly — `trailer` joins the `schemaVersion: 1` shape (D-19); it is removable later by tightening, never by reinterpretation.
- **D-23: The fs-touching read seam is a named `scripts/board-read.ts`.** `board-model.ts` stays pure (D-15) and a test asserts its import closure contains no `node:fs` at all; `board-read.ts` owns read-verify-reread (D-11) and is the explicit subject of the DASH-06 guard together with `board-dashboard.ts`. Rejected: folding the reader into `board-dashboard.ts`.
  — **Reversibility:** reversible — module layout only.
- **D-24: The line partition is total via `preamble` and `nonColumnSections[]`.** Lines before the first column heading land in `preamble` (string[]); non-column `##` sections such as `## Notes (...)` land in `nonColumnSections[]` as `{heading, lines}`. Every input line lands in exactly one of column rows, `epicRows[]`, `updates`, `preamble`, `nonColumnSections[]`, or `unparsed[]` (oracle invariant I1). The kit board's own `_Updated: <ISO date> by <role>_` placeholder is preamble, not an unparsed line. Rejected: dumping 176 chess-board preamble lines into `unparsed[]`.
  — **Reversibility:** costly — two fields join the `schemaVersion: 1` shape (D-19).

### Claude's Discretion

- Exact regexes and the fuzz generator's axes, as long as they are derived from
  `agent-factory/contracts/board.md` and include the corpus in D-03.
- Whether the two real boards in `~/Projects/hacks/grugops-examples/` are copied into
  `scripts/fixtures/` (size-trimmed) as a replay corpus, or only sampled into the synthetic fixture.
  They are the user's own artifacts; if copied, trim to the structural lines.
- The internal shape of `unparsed[]` and `updates[]` entries beyond the fields named above.
- Debounce implementation and the retry bound for read-verify-reread.
- How `--json --watch` is named (`--follow` is acceptable) as long as the semantics in D-18 hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Board grammar (the thing being pinned)
- `plans/board.md` — live kit board; lines 4-51 are the HTML comment that MUST be in the fuzz corpus; 14-21 heading format; 27-31 example rows; 37-45 board↔ticket contract
- `agent-factory/seed/plans/board.md` — seed twin (installer copies it); must stay near-identical to the live board
- `docs/initial/agent_factory_builder_spec_v2.md` §6.1 (lines 604-621) — the OLD, disagreeing board example (`## Blocked (2)`, bare rows); documented non-grammar per D-07; also line 293 lists "web UI, dashboards" as a non-goal, which the contract must address (this is a CLI projector)
- `agent-factory/config/factory.config.json` `#wip_limits`, `#id_prefix`, `#mode` — limits and prefix the projector cross-checks (D-02, D-08)
- `agent-factory/config/factory.config.md` — prose twin of the config
- `~/Projects/hacks/grugops-examples/cli-chess-example/plans/board.md` and `~/Projects/hacks/grugops-examples/dogfood-example/plans/board.md` — the two real agent-written boards (outside the repo, user-owned) whose row shapes drove D-01..D-03; the roadmap's research flag is discharged by them

### Code being extracted, joined, or reused
- `scripts/validate-agent-factory.ts:721-762` — `checkTickets()`; WR-03 comment 729-734, code 735-741 (to be deleted and imported from board-model); `kebab` 250-256; tests in `scripts/validate.test.ts`
- `scripts/canonical-frontmatter.ts` — D-64 allow-list frontmatter reader to use for ticket frontmatter
- `scripts/frontmatter.ts:1-40` — demotion header; transformation-only, not an authority
- `scripts/context-io.ts:98-112, 896-926, 1850-1857` — `NoteRecord`, `atomicWrite` (the ENOENT window), `readContext`/`currentState`
- `scripts/claim.ts:1-43, 64, 277-320` — queue layout, `QUEUE_STAGES`, `renderNowRunning` (the reader logic to mirror without importing the writer)
- `scripts/trace-render.ts`, `plans/traceability.md:4-36` — traceability table shape and its own comment hazard
- `scripts/js-import-closure.ts` — the import-graph walker for D-21
- `scripts/context-io-writer-set.test.ts:15, 250, 254` — AST-derived symbol set with two-sided count; the idiom for D-21
- `scripts/kit-model.ts:205-225` — `MAX_WALK_ENTRIES` and the "a hung gate is not a red gate" rationale (D-14)
- `scripts/is-entry.ts` — `isEntrypoint`; the only legal entry detection
- `scripts/coordinator-resolution-precheck.ts:293-307, 591` — banner + `main(argv) => code` CLI shape
- `scripts/freshness.ts:87`, `package.json` scripts — how a new `.ts`/`.js` twin is gated; every script is `tsc --outDir .tmp-build && node scripts/<x>.js`

### Prior decisions carried forward
- `.planning/phases/30-per-checkpoint-autonomy-matrix/30-CONTEXT.md` D-12 — discriminated reader result shape (D-11 here follows it); its deferred "banner in the dashboard" idea stays deferred
- `.planning/phases/27-*/27-CONTEXT.md` D-64 — canonical-form allow-list posture (D-03, D-05, D-07 here)
- `.planning/REQUIREMENTS.md` lines 127-136 (DASH-01..08), 149 (web renderer deferred), 157-158 (out of scope)
- `.planning/ROADMAP.md` Phase 32 entry — success criteria, research flag, Windows caveat

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `jsImportClosure` + the AST writer-set test idiom: the entire spine of the DASH-06 read-only guard exists; only the mutating-symbol derivation and the closure entry are new.
- `canonical-frontmatter.ts`: ticket frontmatter reader; no new YAML code.
- `readContext`/`currentState`, queue layout constants, traceability header: the join's inputs are already defined; the projector adds readers that tolerate torn reads, not new formats.
- `MAX_WALK_ENTRIES` idiom, `isEntrypoint`, `main(argv) => code`: CLI and bounding conventions to copy.
- `scripts/fixtures/` and `vitest.config.ts` (`fileParallelism: false`, `globals: false`): where the golden fixture tree lives and how tests are written.

### Established Patterns
- Derive the set, assert the count two-sided (KIT-01/02): applies to conflict kinds (D-10), the mutating-fs set (D-21), the three heading suffixes (D-05).
- One authority per predicate (Phase 29): the validator must import board-model, not keep a copy; `board-model.ts` cites the contract, the contract does not restate the regex.
- Canonical form + refuse outside it (D-64): headings, Blocked shape, ID shape, `_Updated:` prefix.
- Committed `.js` twins, `freshness` + `check:build-parity`: new modules ship as `.ts` + `.js` in the same commit.
- No `import.meta.url ===` outside `is-entry.ts`; no new `package.json` dependencies (net change none).

### Integration Points
- `validate-agent-factory.ts` gains its first `scripts/` import (`board-model.js`); `validate.test.ts` cases for board membership must keep passing with identical messages (D-06).
- Both board twins' HTML comment is rewritten (D-04); the seed copy is what installs, so `install.test.ts` seed assertions may reference it.
- `package.json` gains `dashboard` and a `check:dashboard-readonly` (name at planner's discretion) script; `freshness` picks up the new `.js` automatically.
- `docs/initial/agent_factory_builder_spec_v2.md:293` non-goal must be reconciled in `agent-factory/contracts/board.md` or a public-docs note (the `check:public-docs` gate may scan claims).

</code_context>

<specifics>
## Specific Ideas

- The single highest-value test in the phase: the board's own 48-line comment block, fed to the parser, yields zero columns, zero rows, zero updates (D-03).
- The renderer should be able to say "claimed 2 / counted 3 / limit 3" and "3 unparsed lines in Done" rather than pretend the board is clean.
- The user wants the dashboard to be calm: 10s poll, event-driven refresh only when something actually changed.
- Header should show `LARGE BOARD (380 KB, longest line 34 KB)` on a chess-sized board rather than stall or hide rows.

</specifics>

<deferred>
## Deferred Ideas

- **Board bloat rule for agents.** The chess board grew to 380 KB because roles wrote per-hop detail (blocked reasons, verbatim owner quotes, 34 KB `_Updated:` lines) onto the board instead of under each ticket (`plans/tickets/history/`). The user's `human-notes.txt` names this as a memory-bank contract problem (`board.md` 500 KB, `nfr-catalog.md` 120 KB, `traceability.md` 300 KB). Fixing it is a role/workflow rule and a possible size guard on agent writes, not a parser concern. Own phase or backlog item; the projector only measures and shows it (D-20).
- **`/grug board` skill / adapter** shelling out to `board-dashboard.js --once` (D-16 rejected for this phase).
- **Recent context notes block** in the terminal view (D-17 rejected: pulls every task index per re-read).
- **JSON Schema file** for the snapshot (D-19: type + golden only this phase).
- **Web renderer over `node:http` + SSE** consuming `schemaVersion: 1` unchanged (REQUIREMENTS.md future list; explicitly out of scope).
- **Phase 30's "banner at `/grug` session start / in the dashboard"** stays deferred; the header shows `mode` only.
- **Traceability per-ticket join** (Code/Tests/UAT/Release cells per row) beyond presence and status; this phase joins traceability as a source with per-ticket row lookup only as far as the golden fixture needs.
- Row-level sub-bullets (`    - [ABC-0..]` nested under a row in the chess Done column) are `unparsed` this phase; a nesting grammar was not discussed.

</deferred>

---

*Phase: 32-board-projector-cli-dashboard*
*Context gathered: 2026-09-13*
