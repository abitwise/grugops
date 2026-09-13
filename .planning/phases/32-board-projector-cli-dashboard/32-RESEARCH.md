# Phase 32: Board Projector & CLI Dashboard - Research

**Researched:** 2026-09-13
**Domain:** Markdown grammar authority + filesystem watching + typed snapshot projection, Node stdlib only, TypeScript compiled to committed `.js`
**Confidence:** HIGH (every in-repo claim read this session; every grammar claim measured against a 141-row corpus; the `fs.watch` orphaning claim reproduced)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/32-board-projector-cli-dashboard/32-CONTEXT.md` `<decisions>`. **D-01 through D-21 are locked.** This research does not propose alternatives to them; where a measurement contradicts a decision's *stated rationale* it is raised in `## Open Questions` for the user, not silently re-decided.

**Row grammar canonical form (DASH-01, DASH-02)**

- **D-01: Only `- [ID] title` is grammar; the parenthetical is one opaque `meta: string`.** The canonical row is `^- \[<ID>\] <title>(  \((<meta>)\))?$` with the two-space gap before the parenthetical. Nothing inside `meta` is parsed, no key:value hints are extracted, so all four observed real-world shapes are legal and none becomes the de-facto spec. A row with no parenthetical is legal (`meta: null`). Rejected: a best-effort `hints` map (a second grammar to keep honest); a full parenthetical grammar (both live boards would be mostly refused). — **Reversibility:** costly — `meta` is part of the `schemaVersion: 1` snapshot shape (D-19).
- **D-02: The ID is bounded by `^[A-Z][A-Z0-9]*-\d+$`, and when `factory.config.json#id_prefix` is present the prefix must equal it.** Rows whose prefix is `EPIC` or `FEAT` are a second named class (`epicRows[]`), not tickets, and are not joined against `plans/tickets/`. Any other bracket content makes the line `unparsed`.
- **D-03: A comment-aware pre-pass strips every `<!-- … -->` (including multi-line) before any heading or row scan; `_Updated:` lines are their own class.** A line matching the canonical `_Updated: YYYY-MM-DD by <actor>` prefix becomes an `updates[]` entry `{date, actor, text}`; a non-matching `_Updated:` line is `unparsed`. **The parse-oracle fuzz suite's adversarial corpus MUST include the board's own comment block (both twins) and the traceability comment, asserting zero columns, zero rows, zero updates from them.** Any other non-blank line inside a column section that is neither heading, row, epic row nor update is `unparsed[]` with its line number, never dropped.
- **D-04: The written spec lives in the board's own comment AND a new normative contract.** The 48-line HTML comment in `plans/board.md` and its seed twin is rewritten to state the canonical heading and row form. `agent-factory/contracts/board.md` is the normative spec that `board-model.ts` cites in its header and from which the fuzz corpus's legal/illegal axes are derived.

**Column heading authority (DASH-01)**

- **D-05: The heading canonical form is exactly three suffixes.** `## <Name> (WIP <n>/<m>)`, `## <Name> (WIP unlimited)`, `## Blocked (visible, time-tracked)`. A `##` heading whose suffix is not one of these is a **non-column heading** and opens no column; `###` headings never do. The 13-column flow order in the contract is the render order.
- **D-06: "Ported verbatim" for WR-03 means semantics preserved, defects fixed, deviations named.** Exact-name equality after suffix strip is kept and pinned by the original counterexample (column `In` must NOT match `## In Development (WIP 0/3)`), and the prefix-match shape is asserted absent. Two deliberate deviations are recorded: the suffix strip widens from `(WIP …)` to D-05's three forms, and non-canonical suffixes no longer create phantom columns. The helper is deleted from `validate-agent-factory.ts`, which imports `board-model.js`; `checkTickets()`'s membership and `kebab(column) === status` rule keep their current messages.
- **D-07: `## Blocked (visible, time-tracked)` is the only legal Blocked heading.** The old spec's `## Blocked (2)` is recorded in the contract as documented non-grammar and refused loudly.
- **D-08: The column SET comes from the board's headings, cross-checked against config.** A heading limit that disagrees with config is a `wip-limit` conflict; a config column with no heading is a `column-missing` conflict; a heading column absent from config is legal and noted, not refused.
- **D-09: The WIP live number is parsed as `claimedLive` and compared to `rows.length`.** A mismatch is a `wip-count` conflict; the renderer shows both numbers. Nothing is auto-corrected. Epic rows are not counted toward WIP.

**Conflicts & stale semantics (DASH-03, DASH-04, DASH-05)**

- **D-10: `conflicts[]` has exactly these kinds, as a closed `as const` set with a two-sided count test:** `board-vs-ticket`, `ticket-unplaced`, `ticket-duplicated`, `row-without-file`, `wip-limit`, `wip-count`, `column-missing`. Every conflict carries `{kind, ticketId?, column?, expected, actual, source}`. Unparsed lines are NOT conflicts.
- **D-11: The snapshot reader returns a discriminated result, following Phase 30 D-12.** `{ source: "ok" | "stale" | "unavailable", snapshot, conflicts, readErrors }`. Every file read is read-verify-reread (stat, read, stat). A failed or torn read, a partial parse, or an ENOENT on a path that existed at the previous read NEVER produces an empty section.
- **D-12: Staleness is per source, with one badge.** Each joined source (`board`, `tickets`, `queue`, `context`, `traceability`, `config`) carries `readAt` and `stale: {reason, since} | null`.
- **D-13: Absent is a legitimate state; unreadable is stale.** `.grugops/` not existing yields `queue: {present: false}`; `plans/tickets/` empty is `tickets: []`. ENOENT on a file seen at the previous read, EACCES, and a torn read are `stale`.
- **D-14: Poll floor 10 seconds.** Directory-level `fs.watch` on `plans/`, `plans/tickets/`, `.grugops/queue/{pending,claimed,done}/`, `.grugops/context/` triggers an immediate debounced (250 ms) re-read. The poll is mandatory and cannot be disabled. `--interval <ms>` overrides the poll period with a hard floor of 1000 ms. Each re-read is bounded with the `MAX_WALK_ENTRIES` idiom. A watch that errors is closed, noted in `readErrors`, and re-armed on the next poll. Windows behaviour is `UNKNOWN - verify` until Phase 33 CAP-02.

**Dashboard surface & JSON shape (DASH-06, DASH-07, DASH-08)**

- **D-15: Two modules, one boundary.** `scripts/board-model.ts` is pure: parse + join + conflict derivation, no `process`, no rendering, no timers. `scripts/board-dashboard.ts` owns argv, the watch loop, TTY detection and rendering. The validator imports only `board-model.js`.
- **D-16: Invocation is `node scripts/board-dashboard.js [repoRoot]` plus an npm script.** No new `/grug` skill, no installer shim, no adapter change this phase. Uses `isEntrypoint(import.meta.url)` and the `main(argv) => code` shape.
- **D-17: Live terminal layout, top to bottom:** header line (repo root, mode, last read time, `STALE` badge, conflict count, `LARGE BOARD` warning); columns in contract flow order with `live/limit` and rows as `ID  title` truncated to terminal width, empty columns collapsed to one line, Blocked last; `Now running` from `.grugops/queue/claimed/*/claim.md`, or "no queue"; `Conflicts` listed by kind; `Unparsed` count per column. No recent-notes block. Plain text with minimal ANSI; redraw by clearing the screen only when `stdout.isTTY`.
- **D-18: Non-TTY, `--once`, `--json` semantics.** `--once` (or `!stdout.isTTY` without `--json`) prints one frame and exits 0 even when stale or conflicted. `--json` prints exactly one JSON document and nothing else on stdout; with `--once` implied unless `--watch` is also given, in which case NDJSON per re-read. Diagnostics to stderr. Exit 2 only for usage errors and an unreadable `repoRoot`.
- **D-19: The snapshot shape is stabilized by `schemaVersion: 1`, an exported TS type, and a fixture-pinned golden test.** A committed fixture tree under `scripts/fixtures/` renders to a committed golden JSON byte-for-byte. — **Reversibility:** one-way.
- **D-20: Large boards degrade visibly, never refuse.** A board over 1 MB or any single line over 64 KB is still parsed; `bounds: {boardBytes, longestLine, exceeded: true}`; `meta` / `updates[].text` truncated with a `…` marker and `truncated: true`. Rows are never dropped.
- **D-21: Read-only is proven by an import-graph guard, with the mutating-symbol set derived, not hand-listed.** A test walks `jsImportClosure(ROOT, "scripts/board-dashboard.js")` and derives each module's `node:fs` symbols by the TypeScript AST, asserting the intersection with the mutating set is empty. The mutating set is itself derived and its count asserted two-sided against a pinned number. The guard also asserts no `node:child_process`, `node:net`, `node:http`, `node:https`, `node:worker_threads`. It runs in the repo suite AND as a `check:*` npm script. `board-model.ts` must not import `context-io.ts` or `claim.ts` wholesale.

### Claude's Discretion

- Exact regexes and the fuzz generator's axes, as long as they are derived from `agent-factory/contracts/board.md` and include the corpus in D-03.
- Whether the two real boards in `~/Projects/hacks/grugops-examples/` are copied into `scripts/fixtures/` (size-trimmed) as a replay corpus, or only sampled into the synthetic fixture.
- The internal shape of `unparsed[]` and `updates[]` entries beyond the fields named above.
- Debounce implementation and the retry bound for read-verify-reread.
- How `--json --watch` is named (`--follow` is acceptable) as long as the semantics in D-18 hold.

### Deferred Ideas (OUT OF SCOPE)

- Board bloat rule for agents (a role/workflow rule, own phase or backlog item; the projector only measures and shows it per D-20).
- `/grug board` skill / adapter shelling out to `board-dashboard.js --once`.
- Recent context notes block in the terminal view.
- JSON Schema file for the snapshot.
- Web renderer over `node:http` + SSE.
- Phase 30's "banner at `/grug` session start / in the dashboard".
- Traceability per-ticket join beyond presence and status.
- Row-level sub-bullets (nested `- [ABC-0..]` under a row) — `unparsed` this phase.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | `board-model.ts` is the single authority; column-heading parser extracted from and deleted in `validate-agent-factory.ts`, WR-03 hardening ported | §Extraction Site (exact code + line ranges read this session), §Architecture Patterns Pattern 1, §Pitfall 6 (the `checkTickets()` vacuity guard means the validator's board path is currently unexercised on this tree) |
| DASH-02 | Row grammar pinned by written spec + parse-oracle fuzz suite whose corpus includes the board's own HTML-comment block | §Measured Board Corpus (141 rows, 5 sources), §Pitfall 1 (the locked D-01 form refuses 27% of the corpus), §Pitfall 2 (the D-03 corpus assertion is **vacuous** as currently worded), §Pitfall 10 (D-04's board rewrite is constrained by an existing derived set CONTEXT.md did not name), §Architecture Patterns Pattern 3 (`canonical-corpus.ts` + `section-locator-oracle.test.ts` are the two established precedents) |
| DASH-03 | Typed `FactorySnapshot` joins board + ticket frontmatter + queue + context + traceability, surfaces `conflicts[]` | §Join Inputs (every reader located and read), §Pitfall 4 (`renderNowRunning` writes — the queue reader must be re-implemented, with its tamper rule), §Open Q2 (pure-model vs reader seam) |
| DASH-04 | Directory-level `fs.watch` + mandatory poll floor + debounce | §Filesystem Watching (orphaning reproduced this session on macOS/Node 24; debounce necessity measured), §Code Examples |
| DASH-05 | Read-verify-reread, last-good snapshot, visible stale badge; never an empty board | §Filesystem Watching (mtime resolution measured), §`atomicWrite` ENOENT window (source read), §Pitfall 5 |
| DASH-06 | Import-graph guard proves no mutating `node:fs` symbol | §Read-Only Enforcement (mutating-symbol enumeration run on Node 24.12.0; false positives named), §Pitfall 7 (the `check:*` script cannot use the TypeScript AST — zero of 25 runnable check scripts import a non-builtin) |
| DASH-07 | `--json`, `--once`, non-TTY; degrade visibly | §Standard Stack (zero `isTTY`/ANSI/`--json` precedent exists in the tree), §Architecture Patterns Pattern 5 |
| DASH-08 | Snapshot shape stable for a future web renderer; zero runtime deps; no listening socket | §Standard Stack, §Package Legitimacy Audit (N/A — no packages), §Read-Only Enforcement (the module-ban half of D-21) |

</phase_requirements>

---

## Summary

This phase is almost entirely a **grammar-freezing** exercise wearing a dashboard's clothes. The renderer is straightforward Node stdlib work with no dependency and no novel API; the risk concentrates in `board-model.ts`, because the moment it ships it becomes the de-facto spec that agents must write to, and grugops has a recorded, expensive failure class for exactly this shape (Phase 27's twelve rounds of widening a parser, closed only by a canonical-form cutover).

The most consequential research finding is a **measured contradiction between D-01's regex and D-01's own rationale.** D-01 states the anchored form `^- \[<ID>\] <title>(  \((<meta>)\))?$` makes "all four observed real-world shapes legal." Measured against every board row that exists — 141 rows across the two real agent-written boards, the old spec, and the repo's own `examples/` — the anchored form admits **103 of 141 (73.0%)**. On the dogfood board it admits **2 of 16 (12.5%)**, because fourteen of its rows carry trailing prose after the closing parenthesis (`- [DOG-001] Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)`). A minimally-changed variant — split `rest` at the **first** `  (`, balanced-paren scan to its match, everything after it an opaque `trailer` — admits **141 of 141 (100%)** and captures `meta` on 140 of them, degrading the one unbalanced row to `meta: null` rather than refusing it. The choice between "refuse 27% loudly" and "add one opaque `trailer` field" is a user decision, not a planner decision, because D-01's reversibility is recorded as costly; it is raised in Open Questions rather than assumed.

The second finding is that **the phase's self-declared highest-value test is vacuous as worded.** D-03 requires the fuzz corpus to feed the board's own 48-line HTML comment block to the parser and assert zero columns, zero rows, zero updates. Measured: with an anchored `^##` / `^- \[` scanner and **no comment stripping at all**, that assertion already passes on all three real boards — because both mini-boards inside those comments happen to be four-space indented, and the traceability comment's example row is a table row, not a bullet. A comment-strip implementation and a no-op would be indistinguishable on today's corpus. The corpus must therefore add an *unindented* comment variant (the mutation the strip actually defends against) before the assertion discriminates. This is the `section-locator-oracle.test.ts` lesson — "satisfied is not reached" — recurring one phase later.

The third finding is empirical and supports DASH-04 exactly as written: a file-level `fs.watch` on a path rewritten by grugops's `atomicWrite` fires **once** on the first tmp+rename, then goes permanently silent — including for a subsequent *direct* write, because the watch is bound to the orphaned inode. A directory-level watch on the same directory kept firing for every event. Reproduced this session on darwin / Node v24.12.0.

**Primary recommendation:** Build `board-model.ts` as three separable layers (pure grammar → pure join → a thin read seam the dashboard owns), freeze the row grammar only after the user rules on the `trailer` question, make the fuzz corpus adversarial by mutation rather than by transcription, and implement DASH-06's `check:*` entry as a vitest wrapper — not a second stdlib scanner — so the repo does not acquire two authorities for one predicate.

---

## Architectural Responsibility Map

This is a terminal-only, single-process, read-only CLI. There is no browser, server, CDN, or database tier. The tiers below are the *process-internal* layers the phase's own D-15 boundary implies.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Board column/row/WIP grammar | Pure model (`board-model.ts`) | — | D-15 makes this module pure; the validator imports it for heading membership only, and a pure function is what makes that import safe (no `process`, no timers, no fs) |
| Ticket frontmatter admission | Pure model, delegating to `canonical-frontmatter.ts` | — | `canonical-frontmatter.ts` imports **no** `node:fs` at all — verified — so it is already a pure text→`Admission` function and composes into a pure model |
| Snapshot join + conflict derivation | Pure model | — | D-03/D-10 are derivations over already-read text; keeping them pure is what makes the golden fixture (D-19) a byte-for-byte function of its inputs |
| File reading, read-verify-reread, torn-read retry | Read seam | Dashboard | D-15 forbids `process`/timers in the model but says nothing about who reads; see Open Q2 — a named `board-read.ts` is the cleanest answer, and it is the module the DASH-06 guard actually constrains |
| Watch arming, debounce, poll floor, re-arm | Dashboard (`board-dashboard.ts`) | — | Timers and `fs.watch` handles are process state |
| argv parsing, TTY detection, exit codes | Dashboard | — | D-16/D-18; `isEntrypoint` + `main(argv) => code` is the repo's established shape |
| Terminal rendering / ANSI / width truncation | Dashboard | — | D-17; no library, minimal ANSI |
| `--json` / NDJSON serialization | Dashboard | Pure model (supplies the typed value) | D-18; stdout discipline is process state, the value is not |
| Read-only enforcement | Test + `check:*` gate | — | D-21; mechanical, over the compiled `.js` closure |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` (`readFileSync`, `readdirSync`, `statSync`, `existsSync`, `watch`) | Node 22+ (CI) / 24 (dev) | All reading and watching | The repo's hard rule: zero runtime dependencies. `package.json` has **no `dependencies` key at all** — verified. |
| `node:path` (`join`, `resolve`, `relative`, `sep`) | Node 22+ | Path composition, POSIX normalization | Every existing script uses exactly this pair; `toPosix = (p) => p.split(sep).join("/")` is the repo's normalization idiom (`scripts/freshness.ts:99`) |
| TypeScript | `~6.0.3` (devDependency) | Authoring; `tsc` → committed `.js` | D-13, ratified. `tsconfig.json` `"outDir": "./"`, `"rootDir": "./"`, `"newLine": "lf"`, `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true` — read this session |
| Vitest | `~4.1.8` (devDependency) | Test suite | `vitest.config.ts` sets `fileParallelism: false`; the repo default is `globals: false`, so `describe`/`it`/`expect` are imported explicitly in every test |

### Supporting (in-repo modules to reuse, not rebuild)

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/is-entry.ts` → `isEntrypoint(import.meta.url)` | The **only** legal entry detection | D-16. `scripts/check-foundation-guards.test.ts` refuses any other `import.meta.url ===` comparison anywhere in the tree |
| `scripts/js-import-closure.ts` → `jsImportClosure(root, entryRel)` | The transitive closure of a committed `.js`'s relative imports | D-21. Returns sorted repo-relative POSIX paths, **refuses rather than returns short** on an unresolvable edge |
| `scripts/canonical-frontmatter.ts` → `admit(text, options?)` | D-64 allow-list frontmatter reader | Ticket frontmatter. Imports **no** `node:fs` — pure. Returns `Admission` (a discriminated union) with 23 enumerated `REFUSAL_CODES` |
| `scripts/kit-model.ts` → `MAX_WALK_ENTRIES` | `export const MAX_WALK_ENTRIES = 10000;` | D-14's bounded re-read. Note the idiom: `kit-model.ts` **throws** on exceeding it; `check-banned-claims.ts:996` **reports** — the dashboard wants the reporting form (a hung read is a stale badge, never a frozen screen) |
| `scripts/coordinator-resolution-precheck.ts:589-591` | The `main(argv) => code` CLI shape | D-16. Tail is `let code = 1; try { code = main(process.argv.slice(2)); } catch (e) { … }` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `fs.watch` + poll floor | `chokidar` | Violates the hard zero-runtime-dependency rule and the explicit `## Out of Scope` line in REQUIREMENTS.md ("New runtime dependencies. Confirmed net change to `package.json`: **none**"). Not available. |
| Plain-text redraw with `\x1b[2J` | `blessed` / `ink` / `neo-blessed` | Same rule. D-17 already specifies "no cursor-addressing library" |
| `fs.watch` on a directory | `fs.watchFile` (polling, `interval` default 5007 ms) | `watchFile` *is* the poll; D-14 already mandates a poll floor, so `watchFile` would be a third mechanism for the same job. Use `setInterval` + a full re-read so the poll and the event path share one code path |
| `recursive: true` on the watch | Explicit per-directory watches (D-14) | **D-14's explicit list is the correct call.** `recursive` is the platform-variable part of the API — macOS (FSEvents) and Windows (ReadDirectoryChangesW) support it, other platforms historically do not, and misuse throws `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Avoiding it removes the entire platform matrix from this phase's risk |

**Installation:** none. This phase installs nothing.

---

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.**

The Package Legitimacy Gate was not run because there is no candidate package to run it against. `package.json` on this tree carries **no `dependencies` key at all** `[VERIFIED: package.json, read this session]`; `devDependencies` is exactly `{"@types/node": "~22", "typescript": "~6.0.3", "vitest": "~4.1.8"}` and REQUIREMENTS.md's `## Out of Scope` states "New runtime dependencies. Confirmed net change to `package.json`: **none**" `[VERIFIED: .planning/REQUIREMENTS.md:158]`.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Planner obligation:** the plan must assert the *absence* of change, not merely refrain from adding. Recommend a task-level verification `git diff --exit-code -- package.json package-lock.json` at phase close, which is the same fail-closed posture `check:build-parity` already uses.

---

## Measured Board Corpus (the research flag's discharge)

The roadmap flagged the ticket-row grammar as "genuinely unmeasured in the wild." It is now measured. Every board-row-shaped line reachable from this machine was parsed by a probe run this session.

### Corpus inventory

| Source | Rows | Notes |
|--------|-----:|-------|
| `~/Projects/hacks/grugops-examples/cli-chess-example/plans/board.md` | 113 | 410 lines, 380,605 bytes, longest line 34,494 chars; 6 of the 113 are `EPIC-` rows |
| `~/Projects/hacks/grugops-examples/dogfood-example/plans/board.md` | 16 | 119 lines, 11,052 bytes |
| `docs/initial/agent_factory_builder_spec_v2.md:604-621` | 8 | The old, disagreeing spec example |
| `examples/02-brownfield-bootstrap.md:64-66` | 3 | In-repo, not previously named in CONTEXT.md |
| `examples/05-release-run.md:68` | 1 | In-repo, not previously named in CONTEXT.md |
| `plans/board.md` + `agent-factory/seed/plans/board.md` | 0 live | Both ship empty; their 2 rows each live inside the HTML comment, four-space indented |
| **Total live rows** | **141** | |

`[VERIFIED: measured this session — a Node probe over each file, counting `^- \[` matches]`

### Conformance of the locked D-01 form

| Source | Rows | D-01 anchored `^- \[ID\] title(  \(meta\))?$` | Candidate (first `  (` + balanced scan + opaque trailer) |
|--------|-----:|---:|---:|
| chess | 113 | 94 (83.2%) | 112 meta-captured + 1 `meta: null` = 113 (100%) |
| dogfood | 16 | **2 (12.5%)** | 16 (100%) |
| old spec | 8 | 3 (37.5%) | 8 (100%) — the 5 non-matching are **bare rows with no parenthetical**, legal under both |
| examples/ | 4 | 4 (100%) | 4 (100%) |
| **Total** | **141** | **103 (73.0%)** | **141 (100%)** |

`[VERIFIED: measured this session]`

### The observed row shapes, verbatim

Six distinct shapes were observed. Quoting exactly (truncated at 120 chars where the line is long):

1. **Bare, no parenthetical** — `docs/initial/agent_factory_builder_spec_v2.md:616`
   `- [ABC-016] Empty-state UI`
2. **Canonical, parenthetical closes the line** — `plans/board.md:28` (inside the comment)
   `    - [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)`
3. **Compact positional meta** — chess `:215`
   `- [ABC-080] Move ordering — MVV-LVA, killers, hash move  (EPIC-004, M, P0, DoR 8/10, needs ABC-078)`
4. **Meta + trailing prose after the close paren** — dogfood `:54` — **this is the shape D-01 refuses**
   `- [DOG-001] Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)`
5. **Nested parens inside the meta** — chess `:199`
   ``- [ABC-105] Nothing observes the QE hop — a ticket can reach `Done` with no QE note and no one notices  (BA/PM, **M (5), P2**, epic: —, …``
6. **Epic row** — chess `:249`
   `- [EPIC-003] Move input and controls  (owner: BA/PM, **size: XL — corrected from M, 22 points over nine tickets …`

**Unbalanced parentheses occur exactly once in 141 rows** — chess `:334` (`- [ABC-042] The entry point — argv, the resolved colour, and the first frame  (M, P0, epic: EPIC-006, **MERGED …`, whose parenthetical never closes). Any balanced-scan implementation must define its behaviour on this row; falling back to `meta: null` with the whole remainder as `title` keeps the row legal and loses nothing.

**ID conformance is perfect:** 141 of 141 bracket contents match D-02's `^[A-Z][A-Z0-9]*-\d+$`, and 141 of 141 carry a prefix of `ABC`, `DOG`, `EPIC`, or `FEAT`. Note that the dogfood board's `DOG-` prefix will **not** equal `factory.config.json#id_prefix` (`"ABC"` `[VERIFIED: agent-factory/config/factory.config.json, `"id_prefix": "ABC"`]`) in any repo that kept the shipped default — D-02's prefix-equality clause must be checked against *that repo's* config, not grugops's. The dogfood repo presumably sets `DOG`; unverified (its config was not read).

### Heading and column conformance

`[VERIFIED: measured this session]`

| Source | Columns matching D-05 | Non-column `##` headings | Config columns with no heading |
|--------|---:|---|---|
| `plans/board.md` | 13 | `## Columns (spec §6.1)`, `## Conventions` | 0 |
| chess | **11** | `## Columns (spec §6.1)`, `## Conventions` | **2 — `In Analysis`, `In Design`** |
| dogfood | 13 | `## Columns (spec §6.1)`, `## Conventions`, `## Notes (bootstrap, 2026-06-05)`, `## Notes (refinement, 2026-06-06)`, `## Notes (analysis, 2026-06-06)`, `## Notes (design, 2026-06-06)` | 0 |

Two live validations of locked decisions fall out of this:

- **D-08's `column-missing` conflict fires on a real board today.** The chess board renders 11 of 13 columns; `factory.config.json#wip_limits` names `In Analysis` and `In Design` and neither has a heading. The chess board's own ticket `ABC-055` is literally titled *"This board defines 13 columns and renders 10 — In Analysis, In Design and Ready for Dev have no heading"*, so this is a defect a human already found by hand and the projector would have surfaced automatically.
- **D-05's non-column rule is load-bearing on the dogfood board.** Four `## Notes (…)` headings would each open a phantom column under the validator's current `startsWith("## ")`-plus-strip logic, which is exactly the phantom-column defect D-06 records as a deliberate deviation.

### WIP-count conformance

`[VERIFIED: measured this session]`

| Board | Columns with a claimed number | `claimed != counted` (`wip-count` conflicts) |
|-------|---:|---:|
| chess | 9 (all limited columns) | **0** — every limited column claims 0 and counts 0 |
| dogfood | 10 | **0** — `Ready for Dev (WIP 1/6)` claims 1, counts 1 |
| kit | 11 | 0 |

The 52 Backlog rows and 53 Done rows on the chess board sit under `(WIP unlimited)` headings, which claim nothing. **D-09's `wip-count` conflict is therefore currently unexercised anywhere in the wild** — the synthetic fixture (D-19) must manufacture it, and it must not be believed on the strength of a real-board replay alone.

### `_Updated:` conformance

`[VERIFIED: measured this session]`

- chess: **25** `_Updated:` lines, all 25 matching the canonical `^_Updated: \d{4}-\d{2}-\d{2} by ` prefix. All 25 sit in the header region *before* the first column heading (lines 2–175; first column heading is at 177).
- dogfood: 1, canonical.
- kit `plans/board.md:2`: `_Updated: <ISO date> by <role>_` — a placeholder that **does not** match the canonical prefix. Under D-03 it is `unparsed`. A freshly-installed board would therefore render at least one unparsed line on day one unless the pre-column region is classed separately (see Open Q3).

---

## Extraction Site (DASH-01)

The site named in CONTEXT.md is confirmed exactly.

`scripts/validate-agent-factory.ts` — the **whole** board reader is one function, `checkTickets()`, at lines **721-762**, called once at line **845** `[VERIFIED: scripts/validate-agent-factory.ts, read this session]`.

The WR-03 comment is lines 729-734 and the code lines 735-741, quoted verbatim:

```ts
  // Full-segment column match (WR-03): a board heading "## <name> (WIP …)" names the
  // column <name>; we compare <name> for EQUALITY with the ticket column, never by bare
  // prefix. The old `startsWith("## " + col + " ")` accepted word-prefixes — col "In"
  // wrongly matched "## In Development (WIP 0/3)" — letting a genuinely wrong column slip
  // the membership check. We normalize each `## ` line by dropping a trailing ` (WIP …)`
  // marker and trimming, then require an exact match.
  const boardColumnName = (line: string): string =>
    line
      .replace(/^##\s+/, "")
      .replace(/\s*\(WIP[^)]*\)\s*$/, "")
      .trim();
  const boardHasColumn = (col: string): boolean =>
    boardLines.some((l) => l.startsWith("## ") && boardColumnName(l) === col.trim());
```

The two board↔ticket messages that D-06 requires to keep their exact wording are at 747-755:

```ts
    if (column && !boardHasColumn(column)) {
      err(`${rel}: column "${column}" is not a board column`);
    }
    if (column && status && kebab(column) !== status) {
      err(
        `${rel}: status "${status}" does not match column "${column}" (expected kebab "${kebab(column)}")`,
      );
    }
```

`kebab` is defined once at lines 250-256:

```ts
const kebab = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
```

The vacuity guard is line 722-723:

```ts
  const ticketFiles = stateListDir("plans/tickets").filter((f) => f.endsWith(".md"));
  if (ticketFiles.length === 0) return; // D-43 vacuity: zero tickets → green
```

`plans/tickets/` on this tree contains only `.gitkeep` `[VERIFIED: ls plans/tickets, this session]`, so **the entire board-reading path of the validator is dead code on the live tree** and is exercised only by the fixture trees.

The validator's current imports are `[VERIFIED: scripts/validate-agent-factory.ts:53-71]`:

```
53:import { readFileSync, existsSync, readdirSync, realpathSync } from "node:fs";
54:import { join, resolve, sep } from "node:path";
59:import { listRoles, listWorkflows } from "./kit-model.js";
64:import { CHECKPOINTS, DISPOSITIONS } from "./checkpoints.js";
71:import { governanceConfigCandidates } from "./context-io.js";
```

D-06's claim that `board-model.js` would be "its first import from `scripts/`" is **inaccurate** — the file already imports three `scripts/` modules including `context-io.js`. This matters only for the plan's prose; it does not change the work. `[VERIFIED: the five import lines above]`

**Tests that pin the behaviour:** `scripts/validate.test.ts:133` and `:513` both assert `["bad-ticket-bad-column", /not a board column/i]`. The fixtures that drive them:

- `scripts/fixtures/bad-ticket-bad-column/plans/board.md` has 4 headings (`## Ready (WIP 0/8)`, `## In Development (WIP 0/3)`, `## In Review (WIP 0/3)`, `## Done (WIP unlimited)`) and one ticket whose frontmatter is `column: Nonexistent Column` / `status: nonexistent-column`.
- `scripts/fixtures/bad-ticket-mismatch/plans/tickets/ABC-001.md` is `column: In Development` / `status: in-review`.

Both fixtures are already D-05-conformant, so the extraction should not disturb them. **However**: `scripts/fixtures/good/plans/board.md` and the six other fixture boards must each be re-measured against D-05 before the extraction lands, or a phantom-column fixture will flip from green to red for a reason the plan did not intend.

---

## Join Inputs (DASH-03)

Every reader named in CONTEXT.md was located and read.

| Source | Reader | Status for this phase |
|--------|--------|----------------------|
| Board | none exists — `checkTickets()` inlines a `split("\n")` | New. `board-model.ts` |
| Ticket frontmatter | `scripts/canonical-frontmatter.ts` → `admit(text, options?)` at `:538` | **Directly importable.** Verified it imports **no** `node:fs` and **no** `node:path` — a pure text function. Exports `CANONICAL_SCHEMA` (`:177`), `REFUSAL_CODES` (`:93`, 23 codes), `Admission` (`:134`), `admittedValuesFor` (`:869`) |
| Queue / now-running | `scripts/claim.ts` → `renderNowRunning(queueRoot)` at `:277` | **NOT importable.** Its final statement is `atomicWrite(join(queueRoot, "now-running.md"), md.join("\n"))` — it is a *writer*. The reader logic (lines 278-306) must be re-implemented in the dashboard's read seam |
| Queue layout constants | `scripts/claim.ts:64` `export const QUEUE_STAGES = ["pending", "claimed", "done"] as const;` | Importing this one constant still drags the whole module (and its writers) into the closure. Re-declare or extract (see Pitfall 4) |
| Context notes | `scripts/context-io.ts:1850` `readContext(task, contextRoot)`, `:1857` `currentState(notes)`, `:98` `interface NoteRecord` | **NOT importable wholesale** — `context-io.ts` also exports `atomicWrite` (`:896`) and the derived note-writer set. D-21 names this explicitly |
| Traceability | `plans/traceability.md:35-36` — a fixed pipe table, header `\| Ticket \| Title \| Epic \| Feature \| NFRs \| Code (PR/files) \| Tests \| UAT \| Release \| Status \|` | New reader. The file carries its own multi-line HTML comment at `:4-34` containing an **example table row** (`:15`), so the comment-strip pre-pass is needed here too |
| Config | `agent-factory/config/factory.config.json` — `mode`, `id_prefix`, `wip_limits` (10 keys) | Plain `JSON.parse`. `governanceConfigCandidates` in `context-io.ts` resolves candidate paths but is not needed for a fixed literal |

`[VERIFIED: each file and line range read this session]`

**`.grugops/` does not exist on this tree** `[VERIFIED: find .grugops returned nothing]`. This is D-13's `queue: {present: false}` path, and it is the *default* state for a grugops checkout, not an edge case.

### The `atomicWrite` ENOENT window

`scripts/context-io.ts:896-926`, quoted verbatim in the part DASH-05 names:

```ts
    if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
      // Windows branch: remove the destination, then retry the rename.
      try {
        unlinkSync(finalPath);
      } catch {
        /* not-present is fine */
      }
      renameSync(tmp, finalPath);
    }
```

Between `unlinkSync(finalPath)` and `renameSync(tmp, finalPath)` the destination does not exist. A reader that stats in that window gets ENOENT on a file it read successfully a moment earlier — exactly the state D-11 requires be shown as `stale`, never as an empty section. `scripts/claim.ts:218-248` carries the same branch under the name `atomicRename`. Note the header's own scoping: *"For note publication the final path is ALWAYS fresh/unique so the Windows branch never fires; it exists for the single-writer derived-artifact (index.\*) regen."* So the window is Windows-only and narrow — but `plans/board.md` is not written by `atomicWrite` at all (nothing in `scripts/` writes it; agents edit it directly `[VERIFIED: grep over scripts/ found no writer for plans/board.md]`), so the board's torn-read risk comes from an **agent's editor**, not from grugops.

---

## Filesystem Watching (DASH-04, DASH-05)

### The orphaning claim — reproduced

A probe run this session on darwin 25.5.0 / Node v24.12.0 armed both a file-level and a directory-level watch on the same target, then performed a direct write, two `tmp`+`rename` cycles, and a final direct write:

```
after direct write   -> file: ["change:board.md"]  dir: ["change:wtest","change:wtest","rename:board.md","rename:board.md"]
after tmp+rename #1  -> file: ["rename:board.md"]  dir: ["rename:board.md.tmp-1","rename:board.md","rename:board.md"]
after tmp+rename #2  -> file: []                   dir: ["rename:board.md.tmp-2","rename:board.md","rename:board.md"]
after direct write#2 -> file: []                   dir: ["rename:board.md"]
node v24.12.0 platform darwin
```

`[VERIFIED: probe output pasted above, run this session]`

Three findings, all load-bearing:

1. **The file-level watch dies after the first rename and never recovers** — it missed the second rename *and* a subsequent plain write, because it is bound to the replaced inode. This is precisely DASH-04's stated premise, now measured rather than asserted.
2. **The directory-level watch survived every operation** and additionally reported the `.tmp-*` sibling. The re-read must therefore ignore `*.tmp-*` filenames, or it will read a half-written temp file.
3. **A single logical change produces 2–4 events.** One plain write produced four directory events on macOS. Debounce is not a nicety; without it the re-read fires 2–4× per change. This matches Node's own documented caveat that on macOS `fs.watch()` may emit multiple `'change'` events for a single modification `[CITED: https://nodejs.org/docs/latest-v22.x/api/fs.html#caveats]`.

### Watch survival across directory deletion

A second probe deleted and recreated the *watched directory itself*:

```
A after rmdir       -> events: ["change:wtest2","change:wtest2"] errors: []
A after recreate    -> events: [… ,"rename:x.md"] errors: []
```

On macOS the watch survived (FSEvents is path-keyed). `[VERIFIED: probe output, this session]` This is **platform-specific**: on Linux the same operation orphans an inotify watch, and Node's own caveat is that *"If the watched file is deleted and recreated, it is assigned a new inode. The watcher will emit an event for the deletion but may not properly track the new file"* `[CITED: https://nodejs.org/docs/latest-v22.x/api/fs.html#caveats]`. D-14's "a watch that errors is closed, noted in `readErrors`, and re-armed on the next poll" is the right design, and the macOS result means **the re-arm path will not be exercised on the developer's machine** — it needs an explicit test that closes and re-arms deliberately rather than relying on a platform to produce the error.

### Event volume on a large board

A single `writeFileSync` of 380 KB produced **2** directory events, not a stream. `[VERIFIED: probe output, this session]` A 380 KB board does not generate an event storm; the debounce is defending against multiplicity, not volume.

### Read-verify-reread viability

`statSync` on APFS returned `mtimeMs` with sub-millisecond resolution (`…%1 === 0.633056640625`) `[VERIFIED: probe output, this session]`. On that filesystem an `mtimeMs` comparison is a usable torn-read detector. It is **not** universally usable: filesystems with 1-second `mtime` granularity (older ext3, some network mounts) will report equal mtimes across a same-second rewrite. The size comparison (`stat.size === Buffer.byteLength(text)`) is the portable half and must not be dropped in favour of mtime alone.

### Node's documented `fs.watch` caveats, in full

`[CITED: https://nodejs.org/docs/latest-v22.x/api/fs.html#caveats]`

- On Windows, events may not be emitted at all.
- On macOS, multiple `'change'` events may fire for one modification.
- On Linux, some systems may not report `filename` in the callback — **so the debounced re-read must never depend on the `filename` argument being non-null.**
- `recursive` is **not** the default (`false`) and is supported on macOS and Windows; using it where unsupported throws `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`.
- `fs.watchFile` polls with a default `interval` of 5007 ms.
- On Windows no events are emitted if the watched directory is moved or renamed, and `EPERM` is reported when it is deleted `[CITED: nodejs/node issue discussions, secondary]`.

Per the roadmap's own Windows caveat, none of the Windows claims above can be *demonstrated* by this phase — the `windows-latest` CI leg is Phase 33 / CAP-02 work. The phase's Windows claim stays `UNKNOWN - verify`.

---

## Read-Only Enforcement (DASH-06)

### The closure walker is ready

`jsImportClosure(root, entryRel)` returns the transitive closure of *relative* import specifiers as sorted repo-relative POSIX paths, and throws `ImportClosureError` rather than returning short on an unresolvable or escaping edge `[VERIFIED: scripts/js-import-closure.ts, read this session]`. Its own docblock names the limit that matters here:

> *"Bare specifiers are node builtins or packages … A bare specifier is therefore skipped, not refused."*

So the closure walk gives the **module set** but says nothing about which `node:fs` symbols each module imports. The symbol derivation is the new work, and `scripts/check-platform-shapes.ts:76` already establishes that a runnable check script may import `closureTargets` from this module.

### Mutating-symbol enumeration — measured

Enumerating `node:fs` and `node:fs/promises` exports against D-21's write-class stems on **Node v24.12.0** `[VERIFIED: probe output, this session]`:

- `node:fs` — **53** matches:
  `appendFile appendFileSync chmod chmodSync chown chownSync copyFile copyFileSync cp cpSync createWriteStream ftruncate ftruncateSync futimes futimesSync lchmod lchmodSync lchown lchownSync link linkSync lutimes lutimesSync mkdir mkdirSync mkdtemp mkdtempDisposableSync mkdtempSync open openAsBlob openSync opendir opendirSync rename renameSync rm rmSync rmdir rmdirSync symlink symlinkSync truncate truncateSync unlink unlinkSync utimes utimesSync write writeFile writeFileSync writeSync writev writevSync`
- `node:fs/promises` — **22** matches:
  `appendFile chmod chown copyFile cp lchmod lchown link lutimes mkdir mkdtemp mkdtempDisposable open opendir rename rm rmdir symlink truncate unlink utimes writeFile`

**Three false positives are in that list and must be excluded by name, with the exclusion itself asserted:**

| Symbol | Caught by stem | Actually |
|--------|---------------|----------|
| `opendir` / `opendirSync` | `^open` | Read-only directory iterator. The dashboard may legitimately want `opendirSync` for the bounded walk |
| `openAsBlob` | `^open` | Read-only |
| `open` / `openSync` | `^open` | **Ambiguous** — mutating only with a write flag. D-21 already says "`open` with a write flag literal", which means the derivation cannot be purely name-based for this one symbol |

An exclusion list is itself a hand-maintained set literal — the repo's recorded second systemic failure class. The honest shape is: derive by stem, then subtract a **named, justified** exclusion set whose cardinality is also asserted two-sided, so adding a fourth exclusion is a decision rather than a bumped constant. That is the `context-io-writer-set.test.ts` posture applied one level down.

### The pinned-count trap (a real, concrete risk)

D-21 requires "the enumerated count is asserted two-sided against a pinned number so a Node upgrade that adds a writer turns the guard red." The count is **53 on Node v24.12.0** `[VERIFIED: probe this session]`. `mkdtempDisposableSync` is **not documented in Node 22's `fs` API reference** `[CITED: https://nodejs.org/docs/latest-v22.x/api/fs.html — the page lists `fs.mkdtempSync` and no `mkdtempDisposableSync`]`; whether it is present on the Node 22 *runtime* used in CI was not verified (no Node 22 is installed on this machine).

The risk is structural regardless of that one symbol: **CI pins `node-version: 22` `[VERIFIED: .github/workflows/ci.yml:50-52]` while the developer's machine is on Node v24.12.0 `[VERIFIED: node --version]`, and a bare two-sided count over a runtime enumeration is a function of the runtime.** A pin that is green locally will be red in CI, or vice versa, for a reason that has nothing to do with the dashboard.

**Falsification recipe the planner should build in** (this is what would turn the above from a prediction into evidence): make the guard print the enumerated count and the Node version on every run, and pin *per major* (`process.versions.node.split(".")[0]`) with an explicit message naming both, or drop the node-side pin entirely and pin instead the **closure's own** `node:fs` symbol set two-sided — which is the number the phase actually cares about ("the dashboard imports exactly these five read symbols") and which no Node upgrade can move.

### The `check:*` script constraint — a hard blocker for D-21 as literally worded

D-21 says the guard "runs in the repo suite AND as a `check:*` npm script."

**Measured: zero of the 25 committed runnable `scripts/*.ts` files import anything other than a `node:` builtin or a relative `./*.js`.** A grep for `^import … from "<non-dot, non-n>"` across every non-test `scripts/*.ts` returned **no matches** `[VERIFIED: grep over scripts/*.ts excluding *.test.ts, this session]`. Conversely, `typescript` is imported by exactly five files, and all five are `.test.ts`: `check-platform-shapes.test.ts:38`, `context-io-writer-set.test.ts:33`, `context-io.test.ts:43`, `nonblocking-reader-parity.test.ts:38`, `uat-gate-exit-contract.test.ts:44` `[VERIFIED: grep, this session]`.

A `scripts/check-dashboard-readonly.ts` that imports `typescript` would be the first runnable script in the tree to depend on a devDependency at runtime. That is not forbidden by any gate I could find (no zero-dependency guard exists over `scripts/` — searched), but it breaks a 25-of-25 invariant and would make that `check:*` script unrunnable from a checkout without `npm ci`, which is a shape the repo has deliberately avoided everywhere else.

Three ways out, in recommendation order:

1. **`"check:dashboard-readonly": "npx vitest run scripts/board-dashboard-readonly.test.ts"`.** One authority, one implementation, satisfies "runs as a `check:*` npm script" literally, adds no `.ts`/`.js` twin, and the AST derivation stays where `typescript` is already legal. Cost: the check now needs `node_modules`, same as `npm test`.
2. A stdlib-only `check-dashboard-readonly.ts` that scans the compiled `.js` closure with regexes, *plus* the AST test. **This creates two authorities for one predicate** — the exact failure Phase 29 spent five rounds on (LANG-04's relocated enumeration). Not recommended without an explicit decision recording why.
3. Import `typescript` in the runnable script. Breaks the 25/25 invariant; would need a recorded deviation.

### The module-ban half (DASH-08 "no socket")

Asserting the closure imports no `node:child_process` / `node:net` / `node:http` / `node:https` / `node:worker_threads` requires reading **bare** specifiers, which `jsImportClosure` deliberately skips. The closure gives the file list; a second pass over each file's source (AST in the test) supplies the bare specifiers. Two known-safe transitive deps: `is-entry.ts` imports `realpathSync` from `node:fs` and `pathToFileURL`/`fileURLToPath` from `node:url` — all read-only `[VERIFIED: scripts/is-entry.ts:22-23]`.

---

## Architecture Patterns

### System Architecture Diagram

```
  agent edits (direct)                grugops writes (atomicWrite: tmp + rename)
  plans/board.md                      .grugops/queue/**, .grugops/context/**
  plans/tickets/*.md                  plans/traceability.md
  agent-factory/config/*.json
         │                                          │
         └──────────────────┬───────────────────────┘
                            ▼
              ┌─────────────────────────────┐
              │  fs.watch (DIRECTORY level) │   plans/, plans/tickets/,
              │  + setInterval poll floor   │   .grugops/queue/{pending,claimed,done}/,
              │    (10 s, mandatory)        │   .grugops/context/
              └─────────────┬───────────────┘
                            │ event → debounce 250 ms ──┐
                            │ poll tick ────────────────┤ (whichever fires first wins;
                            ▼                           │  both enter the SAME re-read)
              ┌─────────────────────────────┐ ◄─────────┘
              │  READ SEAM                  │
              │  per source:                │
              │   stat → read → stat        │  size + mtime must agree
              │   bounded by MAX_WALK_*     │  retry N, else keep last-good
              │   ignore *.tmp-* names      │
              └─────────────┬───────────────┘
                            │ {text, readAt, stale|null}  per source  (D-12)
                            ▼
              ┌─────────────────────────────┐
              │  PURE GRAMMAR               │  board-model.ts
              │  strip <!-- --> (D-03)      │
              │  → columns   (D-05)         │  non-canonical ## suffix → non-column
              │  → rows      (D-01/D-02)    │  EPIC/FEAT → epicRows[]
              │  → updates[] (D-03)         │
              │  → unparsed[] w/ line nos   │  never dropped
              └─────────────┬───────────────┘
                            │      ┌──── canonical-frontmatter.admit()  (tickets)
                            │      ├──── claim.md reader (re-implemented, tamper rule kept)
                            ▼      ├──── traceability table reader
              ┌─────────────────────────────┐
              │  PURE JOIN + CONFLICTS      │  board × tickets × queue × context × trace × config
              │  7 kinds, closed as const   │  D-10; nothing resolved silently
              │  bounds{} (D-20)            │
              └─────────────┬───────────────┘
                            │  FactorySnapshot  { schemaVersion: 1, … }
                            ▼
              ┌─────────────────────────────┐
              │  DISCRIMINATED RESULT       │  { source: "ok"|"stale"|"unavailable", … }  D-11
              └─────────────┬───────────────┘
                 ┌──────────┴──────────┬─────────────────┐
                 ▼                     ▼                 ▼
         TTY renderer          --json / NDJSON      --once frame
         (ANSI, clear,         (stdout only,        (exit 0 even
          width truncate)       diagnostics→stderr)  when stale)
                                       │
                                       └──► (deferred) web renderer, schemaVersion: 1 unchanged

  ┌──────────────────────────────────────────────────────────────────────┐
  │  validate-agent-factory.ts  ──imports──►  board-model.js (columns only) │
  │  its inline boardColumnName/boardHasColumn DELETED                    │
  └──────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
scripts/
├── board-model.ts             # pure: grammar + join + conflicts. No process, no fs, no timers.
├── board-model.js             #   committed twin (tsc)
├── board-read.ts              # the read seam: stat/read/stat, retry, bounded walk, last-good
├── board-read.js              #   committed twin  (see Open Q2 — may be folded into the dashboard)
├── board-dashboard.ts         # argv, watch loop, debounce, poll, TTY, render, --json
├── board-dashboard.js         #   committed twin
├── board-corpus.ts            # the adversarial corpus as DATA (canonical-corpus.ts idiom)
├── board-corpus.js            #   committed twin
├── board-model.test.ts        # unit + golden fixture
├── board-oracle.test.ts       # cross-product parse oracle (section-locator-oracle.test.ts idiom)
├── board-corpus.test.ts       # replay: every corpus row, expected disposition BY NAME
├── board-dashboard.test.ts    # argv/exit/TTY/--json/--once, spawned as a child process
├── board-readonly.test.ts     # DASH-06 import-graph guard
└── fixtures/
    └── board-snapshot/        # the D-19 golden fixture tree
        ├── plans/board.md                  # all 7 conflict kinds, epic rows, _Updated:,
        ├── plans/tickets/*.md              #   unparsed prose, the HTML doc block
        ├── plans/traceability.md
        ├── .grugops/queue/claimed/<task>/claim.md
        ├── .grugops/context/<task>/…
        ├── agent-factory/config/factory.config.json
        └── expected-snapshot.json          # the byte-for-byte golden

agent-factory/
└── contracts/
    └── board.md               # the normative spec board-model.ts cites (D-04)
```

### Pattern 1: One authority, imported — not copied

The Phase 29 lesson, stated as a mechanic: `validate-agent-factory.ts` must **import** `boardColumns` from `board-model.js` and the inline `boardColumnName`/`boardHasColumn` pair must be **deleted**, with a test asserting the old prefix-match shape is absent from the file. D-06 names the counterexample that must be pinned: column `"In"` must NOT match `## In Development (WIP 0/3)`.

```ts
// scripts/board-model.ts — the ONE column authority.
// Contract: agent-factory/contracts/board.md §Headings.
//
// D-05: exactly three legal suffixes. Anything else is a NON-COLUMN heading and opens
// no column — which is the deliberate deviation from the pre-Phase-32 helper, whose
// `\s*\(WIP[^)]*\)\s*$` strip turned `## Columns (spec §6.1)` into a phantom column
// named `Columns (spec §6.1)` and left `## Blocked (visible, time-tracked)` unnormalized.

export const HEADING_SUFFIXES = [
  { kind: "limited",   re: /^(.*?)\s*\(WIP\s+(\d+)\/(\d+)\)$/ },
  { kind: "unlimited", re: /^(.*?)\s*\(WIP\s+unlimited\)$/ },
  { kind: "blocked",   re: /^(Blocked)\s*\(visible, time-tracked\)$/ },
] as const;
export const HEADING_SUFFIX_COUNT = 3; // asserted two-sided; a fourth form is a decision
```

### Pattern 2: The comment-strip pre-pass must preserve line numbers

`unparsed[]` carries line numbers (D-03), so the strip cannot delete lines — it must blank them. The shape that works:

```ts
/** Replace every `<!-- … -->` body with spaces, preserving every `\n`, so line numbers survive. */
export function stripHtmlComments(text: string): string {
  let out = "", i = 0;
  while (i < text.length) {
    const s = text.indexOf("<!--", i);
    if (s === -1) { out += text.slice(i); break; }
    out += text.slice(i, s);
    const e = text.indexOf("-->", s + 4);
    if (e === -1) { out += text.slice(s).replace(/[^\n]/g, ""); break; }  // unterminated: blank to EOF
    out += text.slice(s, e + 3).replace(/[^\n]/g, "");
    i = e + 3;
  }
  return out;
}
```

The unterminated-comment branch is not hypothetical: an agent that opens `<!--` and never closes it would otherwise expose the rest of the board to the grammar. Blanking to EOF is the fail-closed direction (a board renders empty and *visibly* so, rather than partially and confidently).

### Pattern 3: The fuzz suite — two established precedents, both already in the tree

`scripts/canonical-corpus.ts` (1926 lines) is the **corpus-as-data** precedent and is the closer fit for DASH-02. Its shape, worth copying wholesale:

- Every row carries `{kind: "bypass"|"control"|"divergence", round, sourceId, sourcePath, transcription: "verbatim"|"framed", expectedCode}`.
- `CORPUS_COUNT` is exported and asserted, so a silently-lost row cannot pass as a smaller corpus (`:1881`).
- `unresolvedSources(root)` resolves every cited path so a row cannot outlive the record that justifies it (`:1924`).
- Its docblock states the vacuity trap explicitly: *"admitting everything and refusing everything are both trivially achievable, and only the two together say the grammar discriminates."* **DASH-02 needs both halves: the 141-row live corpus must be ADMITTED, and a mutation corpus must be REFUSED.**

`scripts/section-locator-oracle.test.ts` (1458 lines) is the **cross-product invariant** precedent. It generates a corpus by crossing eight labelled axes (`AXIS_LEVEL`, `AXIS_FENCING`, `AXIS_TRAILING`, `AXIS_LEADING`, `AXIS_POSITION`, `AXIS_SHAPE`, `AXIS_REQUEST_LEVEL`, `AXIS_DUPLICATE`), asserts cell count three ways (product, loop counter, array length, `:744-753`), asserts per-axis label coverage (`:768`), and checks **structural invariants of the answer** rather than transcribed expected outputs. Its recorded scar is the one to inherit: *"A vacuity floor catches an EMPTY denominator and has never caught a SILENTLY SHORT one."*

Suggested axes for the board oracle, derived from the measured corpus:
`AXIS_COMMENT` (absent / indented mini-board / **unindented mini-board** / unterminated) × `AXIS_HEADING_SUFFIX` (limited / unlimited / blocked / `(2)` / `(spec §6.1)` / bare / `###`) × `AXIS_ROW_TAIL` (closes at EOL / trailing prose / no parenthetical / unbalanced) × `AXIS_ID` (conforming / `EPIC-` / `FEAT-` / lowercase / no dash / wrong prefix) × `AXIS_GAP` (two spaces / one space / tab) × `AXIS_UPDATED` (canonical / placeholder / absent) × `AXIS_POSITION` (pre-column / in-column / in-non-column-section).

Structural invariants over the answer (no transcribed outputs):
- I1 every input line is accounted for in exactly one of `columns[].rows`, `epicRows`, `updates`, `unparsed`, `preamble`, or "blank/heading" — the partition is total and disjoint. *This one invariant is what makes "never dropped" checkable.*
- I2 no `column`, `row`, `epicRow` or `update` has a line number inside any `<!-- … -->` span of the raw input.
- I3 `columns.length` equals the count of raw lines matching one of the three D-05 suffixes outside a comment span.
- I4 every `unparsed[]` entry's line number resolves to a non-blank raw line.
- I5 `sum(columns[].rows.length) + epicRows.length` equals the count of D-01-legal rows outside a comment span.

### Pattern 4: Discriminated results, following Phase 30 D-12

```ts
export type SourceState<T> =
  | { readonly source: "ok";          readonly value: T; readonly readAt: string }
  | { readonly source: "stale";       readonly value: T; readonly readAt: string;
      readonly stale: { readonly reason: "enoent" | "eacces" | "torn" | "bounded"; readonly since: string } }
  | { readonly source: "unavailable"; readonly present: false };
```

`"unavailable"` is D-13's *absent is legitimate* case and deliberately carries **no** `value` — the type makes "render an empty board because the file was missing" unrepresentable rather than merely discouraged.

### Pattern 5: The CLI shape

```ts
// tail of scripts/board-dashboard.ts — mirrors scripts/coordinator-resolution-precheck.ts:589-591
import { isEntrypoint } from "./is-entry.js";

export function main(argv: readonly string[]): number { /* … */ }

if (isEntrypoint(import.meta.url)) {
  let code = 2;
  try { code = main(process.argv.slice(2)); }
  catch (e) { console.error(`board-dashboard: ${(e as Error).message}`); code = 2; }
  process.exit(code);
}
```

`isEntrypoint` is mandatory: `scripts/check-foundation-guards.test.ts` refuses any other `import.meta.url ===` spelling in the tree, and the reason is recorded in `scripts/is-entry.ts:1-20` — a symlinked invocation path makes a hand-rolled comparison false, and *"the script exits 0 having printed nothing and done nothing. A caller reading the exit code reads a pass."*

### Anti-Patterns to Avoid

- **Importing `scripts/claim.js` or `scripts/context-io.js` from anything in the dashboard closure.** Both export writers; D-21's guard is what makes this mechanical, but the plan should not rely on the guard to *discover* it — design it out.
- **Widening the row regex once per counter-example.** This is the recorded Phase 27 failure (twelve rounds). Decide the canonical form once, against the measured corpus, and refuse outside it.
- **A `trimStart()` anywhere in the heading or row scan.** Both real mini-boards are four-space indented; a single `trimStart()` turns documentation into live state. Anchor at `^`.
- **Depending on the `filename` argument of the `fs.watch` callback.** Node documents it as `null` on some Linux systems.
- **Transcribing expected parser output into the oracle.** `section-locator-oracle.test.ts` names this as the thing it deliberately does not do.
- **A hand-typed list where a derivation is available** — the repo's recorded second systemic failure class.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Is this module being run or imported?" | `import.meta.url === pathToFileURL(process.argv[1]).href` | `isEntrypoint` from `scripts/is-entry.ts` | A symlinked path makes the hand-rolled form silently exit 0 having done nothing; a foundation-guard test refuses every other spelling |
| "Which committed `.js` does this one need?" | A hand-listed mirror set | `jsImportClosure(root, entryRel)` | Four hand-maintained lists went stale in one commit and failed 92 cases across seven files (plan 30-01) |
| YAML frontmatter reading | A regex over `---` blocks | `admit()` from `scripts/canonical-frontmatter.ts` | D-64 canonical-form reader with 23 enumerated refusal codes; `scripts/frontmatter.ts` is explicitly demoted to transformation-only |
| Bounded directory walking | An ad-hoc counter | `MAX_WALK_ENTRIES` from `scripts/kit-model.ts` (`= 10000`) | Already the tree's shared bound; `check-banned-claims.ts:996` shows the *reporting* variant the dashboard needs |
| Kebab-casing a column name | A new `toKebab` | `kebab` at `validate-agent-factory.ts:250-256` — **export it or move it into `board-model.ts`** | D-06 keeps `kebab(column) === status` as the rule; two spellings of it is the drift class |
| A file-level watch on `plans/board.md` | `watch(boardPath, …)` | `watch(dirname(boardPath), …)` + debounce | Measured this session: the file-level watch dies after the first atomic rename and never recovers |
| Recursive watching | `watch(dir, { recursive: true })` | Explicit per-directory watches (D-14's list) | `recursive` is the platform-variable part of the API; D-14's explicit list sidesteps it entirely |
| A second "is this a board column" predicate | A copy in the validator | Import `board-model.js` | Phase 29's whole lesson; D-06 mandates the deletion |

**Key insight:** this repository has paid, in measured rounds, for exactly three mistakes this phase is positioned to repeat — a widened parser (P27, 12 rounds), a hand-maintained set literal (the spawn defect, 7 granted names / 0 adapter files), and a second copy of one predicate (P29, 5 rounds). All three are available here: the row grammar, the conflict-kind and mutating-fs sets, and the column predicate. Every one of them has a derivation or an import available instead.

---

## Common Pitfalls

### Pitfall 1: D-01's regex refuses 27% of every board row that exists

**What goes wrong:** The locked form `^- \[<ID>\] <title>(  \((<meta>)\))?$` anchors the closing parenthesis at end-of-line. Fourteen of the dogfood board's sixteen rows, and nineteen of the chess board's 113, carry prose *after* the parenthetical. Those 38 rows become `unparsed`, so the dashboard renders `Done` with 1 row and "14 unparsed lines" on the very first real board it is pointed at.
**Why it happens:** D-01's rationale says "all four observed real-world shapes are legal," and the shape catalogue in CONTEXT.md lists `(epic: EPIC-006, size: M, P1)  — merged to main 2026-06-06 (…)` as one of them — but the regex as written does not admit it. The catalogue and the regex disagree.
**How to avoid:** Resolve before any code is written. The minimal change measured at 100% coverage: split `rest` at the **first** `  (`, balanced-paren scan to its match, expose `{title, meta, trailer}` with `trailer` opaque and possibly empty. One extra field, still nothing parsed, still one grammar. Alternative: keep D-01 and accept that the projector's first job on a real board is to name 38 unparsed rows — which is arguably the *honest* outcome and consistent with D-07's "refuse loudly" posture, but it is a user decision because D-19 makes the shape one-way.
**Warning signs:** an `unparsed` count in the tens on a board a human considers well-formed.

### Pitfall 2: The phase's highest-value test is vacuous as currently worded

**What goes wrong:** D-03 requires the corpus to feed the board's own comment block to the parser and assert zero columns, zero rows, zero updates. Measured this session: with an anchored `^##` / `^- \[` scanner and **the comment strip removed entirely**, that assertion already passes on `plans/board.md`, `agent-factory/seed/plans/board.md`, the chess board and the dogfood board — because every mini-board inside every comment happens to be four-space indented, and `plans/traceability.md:15`'s example is a pipe-table row, not a bullet. A correct implementation and a no-op are indistinguishable on the transcribed corpus.
**Why it happens:** The corpus is transcribed from artifacts that happen to be safe. This is `section-locator-oracle.test.ts`'s recorded scar — *"I5 was asserted 7200 times and never once evaluated against a document that could break it"* — one phase later.
**How to avoid:** The corpus must be **mutated**, not only transcribed. Add, at minimum: (a) the kit comment block with its mini-board un-indented; (b) the same block with the mini-board indented by one space and by a tab; (c) an unterminated `<!--`; (d) a comment opened *inside* a column section. Then add the discrimination half: a deliberately broken stripper (a no-op) must turn the assertion red. `canonical-corpus.test.ts`'s `mirrorWithExtraWriter` idiom is the established way to prove a sweep can fail.
**Warning signs:** the strip test passes on the first run with no red baseline recorded.

### Pitfall 3: `wip-count` and `wip-limit` conflicts are unexercised in the wild

**What goes wrong:** Measured: zero `claimed != counted` mismatches across all three real boards. Every limited column on the chess board claims 0 and counts 0; the 105 real rows all sit under `(WIP unlimited)` headings, which claim nothing. A replay-only test suite would report full green while D-09's comparison was never once evaluated against a disagreeing pair.
**Why it happens:** Agents keep the limited columns drained and let Backlog/Done grow, so the interesting number lives where no number is claimed.
**How to avoid:** The D-19 synthetic fixture must manufacture all seven conflict kinds. The plan should state the fixture's conflict inventory as a checklist and assert it two-sided (seven kinds declared, seven kinds present in the golden).
**Warning signs:** the golden JSON's `conflicts[]` has fewer than seven distinct `kind` values.

### Pitfall 4: `renderNowRunning` is a writer, and the reader inside it carries a security rule

**What goes wrong:** `scripts/claim.ts:277` `renderNowRunning` ends in `atomicWrite(…)`. Importing it — or anything from `claim.js` — pulls `writeFileSync`, `renameSync`, `unlinkSync`, `rmSync`, `mkdirSync` into the dashboard's closure and reds the DASH-06 guard. So the queue reader must be re-implemented. The trap is that lines 278-306 are not plain reading; they carry a load-bearing security rule recorded at `:270-276`:

> *"A claim.md is written with EXACTLY ONE `at:` line; MORE than one is a tampered/malformed record … A tampered record is NEVER emitted as a trusted row … a forged second `at:` line is a queue-lock DoS."*

**Why it happens:** "Re-implement the reader" reads as a mechanical copy; the rule lives in a comment above the function, not in the lines being copied.
**How to avoid:** Port the multi-`at` skip (`if ((claimText.match(/^at:/gm) ?? []).length > 1) continue;`), the `TASK_NAME_RE` guard, and the `existsSync(claimMd)` check verbatim, and cite `claim.ts:270-276` in the new reader's docblock. Better: extract the pure reader out of `claim.ts` into a module both can import, so there is one authority — but that touches `claim.ts` and its tests, which is scope the planner must weigh.
**Warning signs:** a `NowRunningRow` reader with no `at`-count check.

### Pitfall 5: `.tmp-*` siblings enter the directory watch

**What goes wrong:** Measured: the directory watch fired `rename:board.md.tmp-1` before `rename:board.md`. A debounced re-read that globs `plans/tickets/*.md` while a `.tmp-*` sibling exists could read a half-written file — and `atomicWrite`'s temp name is `${finalPath}.tmp-${pid}-${Date.now()}-${uuid8}`, which does **not** end in `.md`, so the `.md` filter happens to protect ticket reads today. It does not protect a directory listing that counts entries.
**How to avoid:** Filter `.tmp-` explicitly in every listing, not incidentally by extension. The read-verify-reread (stat/read/stat with size agreement) is the second line of defence.

### Pitfall 6: The validator's board path is dead code on this tree

**What goes wrong:** `checkTickets()` returns at line 723 when `plans/tickets/` has no `.md` files, and it has none `[VERIFIED: ls plans/tickets → only .gitkeep]`. So a regression introduced by the extraction would not be caught by running the validator on the live tree — only by the fixture-driven tests in `validate.test.ts`.
**How to avoid:** Before extracting, run the validator against each of the seven fixture trees under `scripts/fixtures/` and record the output as a RED/GREEN baseline; after extracting, compare block by block. This is the blast-radius-measured posture `check-foundation-guards.ts` records for its own Phase 29 migration (13 blocks compared, 0 differences).

### Pitfall 7: The `check:*` script cannot use the TypeScript AST

Covered in full under §Read-Only Enforcement. Summary: 25 of 25 runnable check scripts import only node builtins and relative `./*.js`; the five files importing `typescript` are all `.test.ts`. D-21's "AND as a `check:*` npm script" needs an explicit resolution in the plan.

### Pitfall 8: The pinned `node:fs` symbol count is a function of the Node version

Covered in full under §Read-Only Enforcement. CI is Node 22, dev is Node 24.12.0, and the stem enumeration returned 53 symbols on Node 24 including `mkdtempDisposableSync`, which Node 22's `fs` documentation does not list.

### Pitfall 10: An existing gate derives a set from the seed board's column table and **throws** if its header row moves

**What goes wrong:** D-04 rewrites the 48-line HTML comment in `plans/board.md` and its seed twin. `scripts/check-imperative-lexicon.ts` derives one of its five "Technical Names" parts — `boardColumns` — from `agent-factory/seed/plans/board.md`, anchored on an exact literal `[VERIFIED: scripts/check-imperative-lexicon.ts:663-664]`:

```ts
const BOARD = "agent-factory/seed/plans/board.md";
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";
```

and at `:784-787`:

```ts
  const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
  if (at === -1) {
    throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  }
```

The throw is caught by `derivedNamePart` and turned into a `DERIVATION_REFUSALS` entry (`:681-692`), which reds `npm run check:imperative-lexicon`. The loop then walks rows until the first non-`|` line, taking each row's first cell as a column name.

**Why it matters:** CONTEXT.md's `## Integration Points` does not name this gate. The board's table at `plans/board.md:58-72` and its seed twin are therefore **shared state between this phase and an existing derived set** — the same board table is simultaneously prose documentation, this phase's contract cross-reference, and another gate's authority for what a column is called.

**How to avoid:** Treat `BOARD_TABLE_HEADER` and the 13 table rows as frozen for D-04's purposes. Edit the HTML comment above them freely; do not rename a column, reorder the table, change the header cells, or move the table out of the seed board. If a column name genuinely must change, it moves in **three** places at once (the table, the `##` heading, and `factory.config.json#wip_limits`) and the plan must say so. The docblock at `:770-777` also records a warning worth inheriting: the loop terminates at the first non-table line deliberately, because *"a table can end long before its section does, and replacing this with `sectionEndIndex` would harvest every later table in the same section as board columns."*

**Warning signs:** `check:imperative-lexicon` reporting a derivation refusal naming `boardColumns`.

**Bonus finding:** `agent-factory/contracts/` already exists and contains `context-note.md` and `task-notes.template.md` `[VERIFIED: ls agent-factory/contracts/]`. D-04's `agent-factory/contracts/board.md` therefore lands in an established directory with an established sibling to copy in structure. No gate enumerates that directory (only `context-note.md` is referenced by path), so adding a file there triggers nothing.

### Pitfall 9: Pre-column and non-column-section lines have no home in D-03

**What goes wrong:** D-03 classes "any other non-blank line **inside a column section**" as `unparsed`. The chess board has **176 lines before its first column heading** — 25 `_Updated:` lines, ~20 single-line `<!-- OUTGOING HEADER … -->` comments, a blockquote, and prose — plus a `## Columns (spec §6.1)` section containing a 13-row markdown table and a `## Conventions` section with three `###` subsections. The dogfood board adds four `## Notes (…)` sections. None of these is "inside a column section." If they fall into `unparsed[]` the renderer says "176 unparsed lines" and the signal is buried; if they fall nowhere, the "never dropped" promise and oracle invariant I1 both fail.
**How to avoid:** Add a `preamble` / `nonColumnSections[]` bucket to the snapshot shape, so every line is accounted for and only *in-column* surprises reach `unparsed[]`. This is a `schemaVersion: 1` shape decision and must be settled before the golden is committed. Note the same issue makes the kit board's own `_Updated: <ISO date> by <role>_` placeholder render as an unparsed line on a fresh install.

---

## Code Examples

### Candidate row parse (the 100%-coverage variant measured this session)

```ts
// Contract: agent-factory/contracts/board.md §Rows.
// Measured against the 141-row live corpus: 141/141 legal, 140/141 with `meta` captured.
// The one exception (an unbalanced parenthetical) degrades to meta:null rather than refusing.

const ROW = /^- \[([^\]]*)\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]*-\d+$/;
const EPIC_ID = /^(EPIC|FEAT)-\d+$/;

export type RowParts = {
  readonly title: string;
  readonly meta: string | null;
  readonly trailer: string;   // "" when the parenthetical closes the line
};

/** Split the post-ID remainder at the FIRST two-space-paren, scanning to its balanced close. */
export function splitRow(rest: string): RowParts {
  const i = rest.indexOf("  (");
  if (i === -1) return { title: rest, meta: null, trailer: "" };
  let depth = 0, j = i + 2;
  for (; j < rest.length; j++) {
    if (rest[j] === "(") depth++;
    else if (rest[j] === ")" && --depth === 0) break;
  }
  if (depth !== 0) return { title: rest, meta: null, trailer: "" }; // unbalanced: whole remainder is title
  return { title: rest.slice(0, i), meta: rest.slice(i + 3, j), trailer: rest.slice(j + 1) };
}
```

The **first**-occurrence rule (not last) is what makes shape 5 work: a title containing ` (` uses a single space (`Login 500 (runtime .env not loaded) + API request/error logging  (epic: …)`), and the two-space gap discriminates. This holds on all 141 rows.

### Debounce + mandatory poll floor, sharing one re-read path

```ts
// D-14. The poll is the safety net for an orphaned watch or an event-less filesystem;
// the watch is the low-latency path. BOTH enter refresh() so there is one code path.
const POLL_FLOOR_MS = 10_000;
const DEBOUNCE_MS = 250;
const INTERVAL_HARD_FLOOR_MS = 1_000;

let pending: NodeJS.Timeout | null = null;
function schedule(): void {
  if (pending !== null) clearTimeout(pending);
  pending = setTimeout(() => { pending = null; void refresh(); }, DEBOUNCE_MS);
}

const watchers = new Map<string, import("node:fs").FSWatcher>();
function arm(dir: string): void {
  if (watchers.has(dir) || !existsSync(dir)) return;
  try {
    // NO `recursive: true` — that is the platform-variable part of the API (D-14's list is explicit).
    // The `filename` argument is deliberately UNUSED: Node documents it as null on some Linux systems.
    const w = watch(dir, () => schedule());
    w.on("error", (e) => { w.close(); watchers.delete(dir); noteReadError(dir, e); }); // re-armed next poll
    watchers.set(dir, w);
  } catch (e) { noteReadError(dir, e); }
}

setInterval(() => { for (const d of WATCH_DIRS) arm(d); void refresh(); }, pollMs).unref();
```

`.unref()` matters for `--once`: an un-unref'd interval keeps the process alive past the single frame.

### Read-verify-reread

```ts
/** stat → read → stat. Size must agree with the bytes read AND with the second stat. */
export function readStable(path: string, retries = 3): { text: string; torn: false } | { torn: true } {
  for (let i = 0; i < retries; i++) {
    try {
      const a = statSync(path);
      const text = readFileSync(path, "utf8");
      const b = statSync(path);
      // Size is the PORTABLE half — mtime granularity is 1s on some filesystems, so a
      // same-second rewrite can report equal mtimes. Measured on APFS: sub-ms resolution.
      if (a.size === b.size && b.size === Buffer.byteLength(text, "utf8") && a.mtimeMs === b.mtimeMs) {
        return { text, torn: false };
      }
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "EACCES") return { torn: true }; // caller keeps last-good
      throw e;
    }
  }
  return { torn: true };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline board parsing in `validate-agent-factory.ts` | One `board-model.ts` authority the validator imports | This phase (DASH-01) | The validator loses ~20 lines and gains an import; the grammar gains a spec and a fuzz suite |
| `startsWith("## " + col + " ")` prefix match | Exact equality after suffix strip | WR-03, already landed | Column `In` no longer matches `In Development`; this phase widens the *strip* without weakening the *equality* |
| Widen the parser per counter-example | Define a canonical form, refuse outside it | Phase 27 D-64 | The posture D-03/D-05/D-07 inherit |
| Hand-listed mirror sets | `jsImportClosure` derivation | Phase 30 | DASH-06's spine already exists |
| Hand-listed writer sets | AST-derived set + two-sided count | `context-io-writer-set.test.ts` | D-21's idiom |
| `fs.watch` with `recursive: true` for cross-platform recursive watching | Explicit per-directory watches (Linux lacked native recursive support for years; Node later added it, and misuse still throws `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`) | — | D-14's explicit list is already the modern-safe choice |

**Deprecated/outdated:**
- `docs/initial/agent_factory_builder_spec_v2.md:604-621` is the **old, disagreeing** board example. It renders `## Blocked (2)` and bare rows. D-07 records it as documented non-grammar. Its `:290-296` `## Out of scope` block lists `- web UI, dashboards, SaaS platform` verbatim — the contract or a public-docs note must reconcile that this phase ships a *terminal projector*, not a web UI.
- `scripts/frontmatter.ts` is demoted to transformation-only; `canonical-frontmatter.ts` is the reader.

---

## Runtime State Inventory

Not applicable — this is an additive greenfield phase, not a rename/refactor/migration. The one *deletion* it performs (the inline column parser in `validate-agent-factory.ts`) touches no stored data, no live service config, no OS-registered state, no secret or env var, and no build artifact beyond the committed `.js` twins that `npm run freshness` and `check:build-parity` already gate.

Explicitly checked and empty:
- **Stored data:** none — nothing in `scripts/` writes `plans/board.md`; agents edit it directly (verified by grep).
- **Live service config:** none — no socket, no daemon, no external service (DASH-08).
- **OS-registered state:** none.
- **Secrets/env vars:** none new. Existing env-var seams in the tree (`VALIDATE_KIT_ROOT`, `GRUGOPS_HOME`, `GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL`) are untouched.
- **Build artifacts:** two-to-four new `scripts/*.js` twins, automatically picked up by `freshness` (whose `OUTPUT_DIRS` is `["install", "scripts", "hooks"]`).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | v24.12.0 (dev) / 22 (CI, `.github/workflows/ci.yml:52`) | none needed; `engines` is `>=22` |
| `tsc` (typescript) | build, committed twins | ✓ | `~6.0.3` devDependency | none |
| vitest | test suite | ✓ | `~4.1.8` devDependency | none |
| `node:fs.watch` (non-recursive, directory) | DASH-04 | ✓ on darwin (measured) | — | Poll floor is mandatory anyway (D-14), so an unavailable watch degrades to 10 s polling |
| `node:fs.watch` on Windows | DASH-04 | **UNKNOWN - verify** | — | Phase 33 / CAP-02 turns the `windows-latest` leg green; until then the claim is not asserted |
| `~/Projects/hacks/grugops-examples/*` | corpus sampling only | ✓ | — | The 12 in-repo rows (`examples/`, old spec) plus the synthetic fixture; the replay corpus is Claude's-discretion per CONTEXT.md |
| TTY | live mode only | ✓ | — | D-18: `!stdout.isTTY` → single frame, exit 0 |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Windows `fs.watch` behaviour — the mandatory poll floor is the fallback by construction, which is why D-14 makes it non-disableable.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `~4.1.8` |
| Config file | `vitest.config.ts` (`fileParallelism: false`; excludes `**/scripts/runnable-ref/fixtures/**` and `**/.temp/**`; `globals: false` so `describe`/`it`/`expect` are imported) |
| Quick run command | `npx vitest run scripts/board-model.test.ts scripts/board-oracle.test.ts scripts/board-corpus.test.ts` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` |
| Typecheck | `npm run typecheck` (`tsc --noEmit` + `tsconfig.tests.json` + `tsconfig.fixtures.json`) |
| Build twins | `npm run build` then `npm run freshness` and `npm run check:build-parity` |

**Do not run bare `npm test`** — it is `vitest run` with no exclude and triggers the live claude-CLI e2e lane. CI uses `npx vitest run --exclude '**/scripts/e2e/**'` (`.github/workflows/ci.yml:174`) and so should every local run.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | `board-model.ts` is the only column authority; the inline pair is gone from `validate-agent-factory.ts` | unit + absence assertion | `npx vitest run scripts/board-model.test.ts -t "column authority"` | ❌ Wave 0 |
| DASH-01 | WR-03 counterexample: column `"In"` does not match `## In Development (WIP 0/3)` | unit | `npx vitest run scripts/board-model.test.ts -t "WR-03"` | ❌ Wave 0 |
| DASH-01 | Validator's two messages unchanged; all 7 fixture trees give identical verdicts | integration | `npx vitest run scripts/validate.test.ts` | ✅ exists (`:133`, `:513`) — must stay green |
| DASH-02 | Live corpus (141 rows, 5 sources) is ADMITTED | replay | `npx vitest run scripts/board-corpus.test.ts -t "admits the live corpus"` | ❌ Wave 0 |
| DASH-02 | Mutation corpus (unindented comment, `## Blocked (2)`, tab gap, lowercase id, unterminated `<!--`) is REFUSED by a named disposition | replay | `npx vitest run scripts/board-corpus.test.ts -t "refuses"` | ❌ Wave 0 |
| DASH-02 | The comment block of both board twins + `plans/traceability.md:4-34` yields 0 columns / 0 rows / 0 updates — **and a no-op stripper turns this red** | oracle + discrimination | `npx vitest run scripts/board-corpus.test.ts -t "documentation block"` | ❌ Wave 0 |
| DASH-02 | Cross-product oracle: 7 axes, cell count asserted 3 ways, per-axis label coverage, invariants I1–I5 | oracle | `npx vitest run scripts/board-oracle.test.ts` | ❌ Wave 0 |
| DASH-03 | Golden fixture → byte-for-byte `expected-snapshot.json`; all 7 conflict kinds present | golden | `npx vitest run scripts/board-model.test.ts -t "golden"` | ❌ Wave 0 |
| DASH-03 | `CONFLICT_KINDS` members AND cardinality asserted two-sided | derived-set | `npx vitest run scripts/board-model.test.ts -t "conflict kinds"` | ❌ Wave 0 |
| DASH-04 | Debounce coalesces an N-event burst into one re-read | unit (fake timers) | `npx vitest run scripts/board-dashboard.test.ts -t "debounce"` | ❌ Wave 0 |
| DASH-04 | Poll floor fires a re-read with **no** watch armed at all (the orphaned-watch safety net) | integration | `npx vitest run scripts/board-dashboard.test.ts -t "poll floor"` | ❌ Wave 0 |
| DASH-04 | A watch that errors is closed, recorded in `readErrors`, and re-armed on the next poll | integration (forced close) | `npx vitest run scripts/board-dashboard.test.ts -t "re-arm"` | ❌ Wave 0 |
| DASH-05 | Torn read (size disagreement) → previous good value kept, source marked `stale` | unit | `npx vitest run scripts/board-read.test.ts -t "torn"` | ❌ Wave 0 |
| DASH-05 | ENOENT on a path seen at the previous read → `stale`, not empty | unit | `npx vitest run scripts/board-read.test.ts -t "enoent"` | ❌ Wave 0 |
| DASH-05 | Absent `.grugops/` → `{present: false}`, **no** stale badge (D-13) | unit | `npx vitest run scripts/board-read.test.ts -t "absent"` | ❌ Wave 0 |
| DASH-06 | Closure of `board-dashboard.js` holds no mutating `node:fs` symbol | import-graph guard | `npx vitest run scripts/board-readonly.test.ts` + `npm run check:dashboard-readonly` | ❌ Wave 0 |
| DASH-06 | Discrimination: a mirror with `writeFileSync` planted in one closure module turns the guard red | mutation | `npx vitest run scripts/board-readonly.test.ts -t "discriminates"` | ❌ Wave 0 |
| DASH-06 | Mutating-set derivation is non-vacuous (premise assertions: the enumeration found > 0 symbols) | premise | `npx vitest run scripts/board-readonly.test.ts -t "PREMISE"` | ❌ Wave 0 |
| DASH-07 | `--once` exits 0 while stale AND while conflicted | integration (spawned child) | `npx vitest run scripts/board-dashboard.test.ts -t "once"` | ❌ Wave 0 |
| DASH-07 | `--json` emits exactly one parseable document on stdout and nothing else; diagnostics on stderr | integration (spawned child) | `npx vitest run scripts/board-dashboard.test.ts -t "json"` | ❌ Wave 0 |
| DASH-07 | Non-TTY never emits ANSI | integration (spawned child) | `npx vitest run scripts/board-dashboard.test.ts -t "non-tty"` | ❌ Wave 0 |
| DASH-07 | Exit 2 on usage error and on unreadable `repoRoot`; exit 0 otherwise | integration | `npx vitest run scripts/board-dashboard.test.ts -t "exit"` | ❌ Wave 0 |
| DASH-08 | Closure imports no `node:child_process` / `node:net` / `node:http` / `node:https` / `node:worker_threads` | import-graph guard | `npx vitest run scripts/board-readonly.test.ts -t "no socket"` | ❌ Wave 0 |
| DASH-08 | `package.json` gains no `dependencies` key | repo assertion | `git diff --exit-code -- package.json package-lock.json` | ❌ Wave 0 |
| DASH-08 | `schemaVersion: 1` present; golden update and version bump land in the same commit | golden | `npx vitest run scripts/board-model.test.ts -t "schemaVersion"` | ❌ Wave 0 |
| — | Committed `.js` twins are faithful builds | build gate | `npm run freshness && npm run check:build-parity` | ✅ exists |

### Sampling Rate

- **Per task commit:** `npx vitest run scripts/board-*.test.ts` (< 30 s target; the oracle's cross-product must be sized to keep it there — `section-locator-oracle.test.ts` generates ~7200 cells and stays fast, so a comparable budget is realistic)
- **Per wave merge:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness` + `npm run check:build-parity` + `npm run typecheck`
- **Phase gate:** full suite green, plus `node scripts/check-foundation-guards.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `agent-factory/contracts/board.md` — the normative spec every test derives its axes from (**must land first**; D-04)
- [ ] `scripts/board-corpus.ts` — the corpus as data (live + mutation halves), `CORPUS_COUNT` exported and asserted
- [ ] `scripts/fixtures/board-snapshot/**` — the golden fixture tree with all seven conflict kinds
- [ ] `scripts/fixtures/board-snapshot/expected-snapshot.json` — the committed golden
- [ ] `scripts/board-model.test.ts`, `board-oracle.test.ts`, `board-corpus.test.ts`, `board-read.test.ts`, `board-dashboard.test.ts`, `board-readonly.test.ts`
- [ ] A RED baseline for each discrimination test (broken stripper, planted writer, no-op debounce), captured **before** the fix, in the repo's established `NN-RED-baseline.txt` / `NN-GREEN-proof.txt` style (precedent: `25-06-RED-baseline.txt`, `25-06-GREEN-proof.txt` at the repo root)
- [ ] Re-measure all seven existing `scripts/fixtures/*/plans/board.md` against D-05 before the extraction lands
- [ ] Framework install: none needed

---

## Security Domain

`workflow.security_enforcement` is `true`, `security_asvs_level` is `1`, `security_block_on` is `"high"` (`.planning/config.json`). `agent-factory/config/factory.config.json` carries `"security": {"asvs_level": "L1", "block_on": "high"}`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No identity surface; single local process |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No multi-principal surface. The *read-only* property is a safety control, not an access-control one, and is enforced by DASH-06 |
| V5 Input Validation | **yes** | `--interval <ms>` must be validated as an integer with the 1000 ms hard floor and rejected (exit 2) otherwise — never `parseInt` and proceed on `NaN`. The board, tickets, and traceability files are **untrusted input to the parser**: every regex must be bounded (no catastrophic backtracking) because the corpus contains a 34,494-character line |
| V6 Cryptography | no | Nothing signed, hashed, or encrypted this phase |
| V7 Error Handling & Logging | **yes** | D-18: diagnostics to stderr, one JSON document to stdout. An exception must not leak a raw Node stack as the last thing a piped consumer sees (the chess board's `ABC-115` records exactly that defect class in another product) |
| V12 File & Resource | **yes** | `repoRoot` comes from argv. Every joined subpath must be a **fixed literal** joined against the resolved root, never derived from file *content*. The repo's precedent is explicit: `claim.ts:38-44` — *"The queue root is never derived from argv / env / a queue file's content as an absolute path"* — and `kit-model.ts` — *"Fixed literal subpaths — never argv/env/content-derived (ASVS V12)"*. Reject a `repoRoot` that does not resolve, exit 2 |
| V13 API | no | No API surface; no listening socket (DASH-08) |
| V14 Configuration | **yes** | `factory.config.json` is parsed; a malformed JSON must degrade to a `config` source marked stale, never crash the loop |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| ReDoS on a 34 KB single line | Denial of Service | Linear-time regexes only; no nested quantifiers. This repo has a recorded superlinear-backtracking incident (`oracleWr05Wording` turned a 0.47 s guard into 383 s on a long line). **Assert a wall-clock bound on the oracle's longest-line cell.** |
| Path traversal via a board row's content | Tampering | No path is ever derived from board content. Ticket lookup is `join(root, "plans/tickets", `${id}.md`)` where `id` already matched `^[A-Z][A-Z0-9]*-\d+$` — the anchored ID regex *is* the allowlist |
| Path traversal via a queue task directory name | Tampering | Port `TASK_NAME_RE = /^[A-Za-z0-9._-]+$/` and the `task === "." \|\| task === ".."` rejection from `claim.ts` verbatim |
| Forged second `at:` line in a `claim.md` (queue-lock DoS) | Denial of Service | Port the multi-`at` skip from `claim.ts:295-297`; never emit a tampered record as a trusted row |
| An unbounded directory walk on a pathological tree | Denial of Service | `MAX_WALK_ENTRIES` in the reporting form — "a hung gate is not a red gate"; a hung read becomes a stale badge |
| A dashboard that could write | Tampering / Elevation | DASH-06's import-graph guard; REQUIREMENTS.md's `## Out of Scope` names a write-capable dashboard explicitly |
| Symlink escape from `repoRoot` | Tampering | `realpathSync` the root once, then `relative(root, target)` must not start with `..` — the `assertInsideRoot` idiom already in `js-import-closure.ts:74-82` |

**Threats explicitly out of scope this phase:** anything network-facing (no socket), anything multi-tenant (single local process), anything write-capable (mechanically prevented).

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `./CLAUDE.md` that bind this phase. The planner must verify compliance against each.

| # | Directive | Binding on this phase |
|---|-----------|----------------------|
| C1 | **Tech stack**: Markdown for everything except the tooling layer, which is TypeScript compiled with `tsc` to committed `.js`, freshness-checked | `board-model.ts` / `board-dashboard.ts` + committed twins; `npm run freshness` must stay green |
| C2 | **Zero runtime dependencies on host machines**; dev/build deps are `{typescript, vitest}` (+ `@types/node`) and are never shipped | No package may be added. `check:dashboard-readonly` must not require a shipped dep |
| C3 | **Node 22+ is a hard install prerequisite** | Do not use a Node 24-only API. `mkdtempDisposableSync` is a reminder that the surface differs |
| C4 | **Safety (hard)**: agents never merge a protected branch and never deploy to prod without named human confirmation; prefer *mechanical* enforcement | The DASH-06 guard is the mechanical form of "this thing cannot write" — prose is not sufficient |
| C5 | **Single-source**: role text lives once; adapters are thin pointers, never copies | Applied to code as "one authority per predicate": D-06's deletion is mandatory, not optional |
| C6 | **Zero-config first**: every role honors `factory.config.json` when present, runs lean with defaults when absent | A missing or malformed `factory.config.json` must not break the dashboard (D-08's cross-check degrades, D-13's `unavailable`) |
| C7 | **Voice discipline**: caveman voice in role prompts; **clear voice in security findings, compliance, money, and disclaimers** | `board-model.ts`, `board-dashboard.ts`, `agent-factory/contracts/board.md` and every test are technical/safety surfaces → **clear professional voice throughout**, matching `claim.ts:36-37` and `check-foundation-guards.ts:57-58` |
| C8 | **No fabrication**: unknown commands are marked `UNKNOWN - verify`; never fake a passing gate, test result, or citation | The Windows `fs.watch` claim stays `UNKNOWN - verify`. The dashboard must never render a confident board it did not read (D-11) |
| C9 | **Minimal AGENTS.md**: keep the substrate short and high-signal | If AGENTS.md gains a dashboard line, watch `guard_agents_bytes` (WARN 20480 / FAIL 28672, below Codex's 32768 cap) |
| C10 | **Brand**: always lowercase `grugops`; `/grug` command shape | D-16 adds no skill, so no command-name surface this phase |
| C11 | **GSD Workflow Enforcement**: no direct repo edits outside a GSD workflow | Planner/executor discipline |
| C12 | **Installers**: idempotent, additive, dry-run-capable, reversible; never overwrite user content | D-16 adds no installer shim; if the board twins are edited (D-04), the seed copy is what installs — `install.test.ts` seed assertions must be re-checked |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `node:fs` mutating-stem enumeration returns a **different** count on Node 22 than the 53 measured on Node 24.12.0 | Read-Only Enforcement, Pitfall 8 | If wrong, the pinned-count concern is smaller than stated — but the *structural* risk (a runtime-derived count pinned across two Node majors) stands regardless. Falsify by running the enumeration on both CI legs and printing the count |
| A2 | `mkdtempDisposableSync` is absent from the Node 22 **runtime** (verified only that it is absent from the Node 22 **docs**, and present on the Node 24.12.0 runtime) | Read-Only Enforcement | Same as A1; this is the specific symbol that would move the count |
| A3 | The dogfood example repo sets `factory.config.json#id_prefix` to `"DOG"` (its config was not read; only its board was) | Measured Board Corpus | If it still reads `"ABC"`, D-02's prefix-equality clause would refuse all 16 of its rows — which would be a *live* example of a config/board disagreement the projector should surface as a conflict rather than a refusal |
| A4 | On Linux, a directory `fs.watch` is orphaned by delete+recreate of the watched directory (measured only that it **survives** on macOS) | Filesystem Watching | If Linux also survives, the re-arm path is dead code everywhere and should still be tested deliberately rather than removed |
| A5 | No existing gate forbids a runnable `scripts/*.ts` from importing a devDependency (searched; found none) | Pitfall 7 | If such a gate exists and I missed it, option 3 is closed and the recommendation (option 1, the vitest wrapper) is simply forced rather than preferred |
| A6 | `section-locator-oracle.test.ts`'s ~7200-cell cross-product runs fast enough that a comparable board oracle fits a < 30 s quick-run budget | Validation Architecture | If the board oracle's cells are more expensive (larger documents), the sampling rate must move the oracle to per-wave rather than per-commit |
| ~~A7~~ | ~~`install.test.ts` asserts something about the seed board's bytes~~ — **FALSIFIED this session, no longer an assumption** | Project Constraints C12 | **Resolved:** `install/install.test.ts` references `plans/board.md` at `:150, :157, :571, :609, :985, :3628, :4919, :5083` and every one of them concerns a **user-owned** fixture board whose content is the literal `"user board\n"`, written by `makeFixture()` to prove user data survives an install and an uninstall. **No install test reads the seed board's bytes.** D-04's rewrite does not touch `install.test.ts`. `[VERIFIED: install/install.test.ts:150-157 (`writeFileSync(join(d, "plans", "board.md"), "user board\n")`), :4919 (`expect(readFileSync(join(target, "plans", "board.md"), "utf8")).toBe("user board\n")`)]` |
| ~~A8~~ | ~~No gate other than `check-imperative-lexicon` derives anything from either board twin~~ — **CONFIRMED this session, no longer an assumption** | Pitfall 10 | **Resolved:** `grep -rn "plans/board" scripts/*.ts hooks/*.ts install/*.ts` (excluding `*.test.ts`) returns six hits, and exactly one is a derivation: `check-imperative-lexicon.ts:663`. The others are `check-banned-claims.ts:750,757` (prose comments), `generate-role-adapters.ts:487` (a literal sentence emitted into every adapter — *"`AGENTS.md` and `plans/board.md` (respect every WIP limit), and act as that role."*), `validate-agent-factory.ts:307` (a required-file **presence** list, content-blind), and `validate-agent-factory.ts:725` (the read this phase replaces). **Only the imperative-lexicon derivation constrains D-04's edit.** `[VERIFIED: grep output, this session]` |

---

## Open Questions (RESOLVED at plan time, 2026-09-13)

> Q1 -> D-22 (opaque `trailer`), Q2 -> D-23 (`scripts/board-read.ts`), Q3 -> D-24 (`preamble` + `nonColumnSections[]`) — recorded in 32-CONTEXT.md as plan-time amendments. Q4 -> 32-06 (vitest wrapper), Q5 -> 32-06 (closure-side pin blocking, node-side count version-labelled), Q6 -> 32-04 (trimmed replay boards), Q7 -> 32-01/32-02 (`agent-factory/contracts/board.md` reconciliation).

1. **Does D-01 admit a `trailer`, or does it refuse 27% of the live corpus?** (BLOCKING — the answer changes `schemaVersion: 1`, which D-19 records as one-way)
   - What we know: the anchored form admits 103/141 rows (73.0%), and 2/16 on the dogfood board. A first-`  (`+balanced-scan variant with an opaque `trailer` admits 141/141 and captures `meta` on 140/141. Both keep "nothing inside the parenthetical is parsed."
   - What's unclear: whether the user intends the trailing-prose shape to be *legal* (add `trailer`) or *loudly refused* (keep D-01, and accept that the projector's first useful act is naming 38 non-conforming rows — which is defensible under D-07's posture).
   - Recommendation: put both options to the user at plan time with the measured numbers. If in doubt, add `trailer` — it is strictly more permissive, costs one opaque string, and is *removable* later by tightening the contract, whereas making `meta` mean something different later is the costly direction D-01 already warns about.

2. **Where does the read seam live?** (BLOCKING for module layout)
   - What we know: D-15 says `board-model.ts` is pure — "no `process`, no rendering, no timers" — and D-11 puts read-verify-reread in "the snapshot reader." D-21 constrains the closure of `board-dashboard.js`, whatever is in it.
   - What's unclear: whether the fs-touching reader is a third module (`board-read.ts`) or lives inside `board-dashboard.ts`.
   - Recommendation: a named `board-read.ts`. It keeps the model provably pure (a test can assert `board-model.js`'s closure imports **no** `node:fs` at all, which is a stronger and cheaper claim than "no mutating symbol"), it gives the torn-read tests a unit-level seam, and it makes the DASH-06 guard's subject explicit.

3. **Where do pre-column and non-column-section lines go?** (BLOCKING for `schemaVersion: 1`)
   - What we know: the chess board has 176 lines before its first column heading; the dogfood board has four `## Notes (…)` sections. D-03 only classes lines "inside a column section."
   - What's unclear: whether these become `unparsed[]` (noisy — "176 unparsed lines"), a separate `preamble`/`nonColumnSections[]` bucket, or are silently ignored (which breaks "never dropped" and oracle invariant I1).
   - Recommendation: a `preamble` field plus `nonColumnSections[]`, so the partition is total. Also resolves the kit board's own `_Updated: <ISO date> by <role>_` placeholder showing up as an unparsed line on every fresh install.

4. **How does `check:dashboard-readonly` run without importing `typescript` into a runnable script?**
   - What we know: 25 of 25 runnable check scripts import only node builtins and relative `./*.js`; all five `typescript` importers are `.test.ts`.
   - Recommendation: `"check:dashboard-readonly": "npx vitest run scripts/board-readonly.test.ts"`. One authority, one implementation, no new twin. Record the deviation from the `tsc --outDir .tmp-build && node scripts/<x>.js` script shape explicitly, since it is the first check script that is not that shape.

5. **Is the mutating-set pin over `node:fs`, or over the closure's own symbols?**
   - What we know: the `node:fs` enumeration is a function of the Node version (53 on v24.12.0); the closure's own `node:fs` symbol set is a function of the code and would be a handful of read symbols.
   - Recommendation: pin **both**, but make the closure-side pin the *blocking* one and the node-side count a printed, version-labelled observation rather than a hard equality. That keeps "a Node upgrade that adds a writer turns the guard red" (the new symbol appears in the printed delta) without reddening CI for a reason unrelated to the dashboard.

6. **Do the two real example boards get copied into `scripts/fixtures/`?** (Claude's discretion per CONTEXT.md)
   - Recommendation: copy them **structurally trimmed** — every heading, every row's first 120 characters, every `_Updated:` line's first 120 characters, every comment delimiter, with the long tails elided and the elision *marked*. This keeps the replay honest (the shapes that drove D-01 stay in the tree and outlive the user's local directories) without importing 380 KB. Preserve **one** deliberately long line (≥ 34 KB) as the D-20 / ReDoS bound case, since that is exactly the input the truncation and the regex bounds exist for.

7. **How is the old spec's `dashboards` non-goal reconciled?**
   - What we know: `docs/initial/agent_factory_builder_spec_v2.md:293` lists `- web UI, dashboards, SaaS platform` under `## Out of scope`. `check:public-docs` exists and scans vocabulary, though a grep found no "dashboard" term in its lists.
   - Recommendation: state the reconciliation in `agent-factory/contracts/board.md` — this is a read-only terminal projector over files that already exist, not a web UI, not a SaaS, not a socket — and cite the REQUIREMENTS.md `## Out of Scope` lines that keep the web renderer and any listening socket deferred.

---

## Sources

### Primary (HIGH confidence — read or executed this session)

- `.planning/phases/32-board-projector-cli-dashboard/32-CONTEXT.md` — D-01..D-21, canonical refs, deferred list
- `.planning/REQUIREMENTS.md:127-136, 149, 157-158` — DASH-01..08, deferred web renderer, out-of-scope exclusions
- `scripts/validate-agent-factory.ts:53-71, 250-256, 715-762, 845` — imports, `kebab`, `checkTickets()`, WR-03 comment + code, the two error messages, the vacuity guard
- `scripts/js-import-closure.ts` (whole file) — `relativeSpecifiers`, `jsImportClosure`, `copyImportClosure`, `closureTargets`, `assertInsideRoot`, the bare-specifier scope note
- `scripts/is-entry.ts` (whole file) — `isEntrypoint`, the symlink rationale
- `scripts/context-io.ts:98, 896-926, 1850, 1857` — `NoteRecord`, `atomicWrite` with the Windows unlink-then-rename branch, `readContext`, `currentState`
- `scripts/claim.ts:1-70, 64, 270-325` — queue layout docblock, `QUEUE_STAGES`, `TASK_NAME_RE`, `renderNowRunning` + its multi-`at` tamper rule + its terminal `atomicWrite`
- `scripts/canonical-frontmatter.ts` (export surface) — `admit`, `REFUSAL_CODES`, `CANONICAL_SCHEMA`, `Admission`; confirmed zero `node:fs`/`node:path` imports
- `scripts/kit-model.ts:200-225` — `MAX_WALK_ENTRIES = 10000`, the throw-vs-report floor, ASVS V12 fixed-literal note
- `scripts/canonical-corpus.ts:1-90, 147, 201, 1881, 1893-1930` — the corpus-as-data precedent, `CORPUS_COUNT`, `unresolvedSources`, the vacuity-trap statement
- `scripts/section-locator-oracle.test.ts:1-105, 146, 394-405, 744-776` — the cross-product oracle precedent, invariants I1–I6, the three-way cell-count derivation, the "satisfied is not reached" scar
- `scripts/context-io-writer-set.test.ts:1-60, 230-262` — the AST-derived set with two-sided count and PREMISE assertions
- `scripts/check-foundation-guards.ts:1-80` — guard roster, "Strictly READ-ONLY … Node stdlib ONLY", blast-radius comparison table
- `scripts/check-platform-shapes.ts:62-76` — a runnable check script consuming `closureTargets`; node-builtins-only import list
- `scripts/freshness.ts:75-100` — `OUTPUT_DIRS = ["install", "scripts", "hooks"]`, `toPosix`
- `scripts/coordinator-resolution-precheck.ts:585-595` — the `main(argv) => code` tail
- `scripts/validate.test.ts:133, 513` + `scripts/fixtures/bad-ticket-bad-column/**`, `bad-ticket-mismatch/**` — the tests and fixtures that pin the extraction
- `plans/board.md` (whole file, 124 lines) + `agent-factory/seed/plans/board.md` (diff) — the 48-line comment at `:4-51`, the 13 headings, the two prose differences between twins
- `plans/traceability.md:1-36` — the comment at `:4-34` with its example row at `:15`, the fixed table header at `:35-36`
- `agent-factory/config/factory.config.json` — `mode: "lean"`, `id_prefix: "ABC"`, `wip_limits` (10 keys), `security.asvs_level: "L1"`
- `docs/initial/agent_factory_builder_spec_v2.md:290-296, 602-622` — the `dashboards` non-goal; the old board example with `## Blocked (2)` and bare rows
- `examples/02-brownfield-bootstrap.md:64-66`, `examples/05-release-run.md:68` — four in-repo rows not named in CONTEXT.md
- `package.json`, `tsconfig.json`, `vitest.config.ts`, `.github/workflows/ci.yml:25-55, 152-245` — no `dependencies` key, compiler options, `fileParallelism: false`, the OS matrix, Node 22 pin, the `npx vitest run --exclude '**/scripts/e2e/**'` step
- `~/Projects/hacks/grugops-examples/cli-chess-example/plans/board.md` and `~/Projects/hacks/grugops-examples/dogfood-example/plans/board.md` — the two real agent-written boards
- **Probes executed this session** (outputs pasted in-line above): row-grammar conformance over 141 rows; heading/comment-strip differential; per-column claimed-vs-counted; `fs.watch` file-vs-directory orphaning under tmp+rename; watch survival across directory delete+recreate; event count for a 380 KB write; `statSync` mtime resolution; `node:fs` / `node:fs/promises` mutating-stem enumeration on Node v24.12.0

### Secondary (MEDIUM confidence)

- https://nodejs.org/docs/latest-v22.x/api/fs.html#caveats — `fs.watch` Availability / Inodes / Filename caveats, `recursive` platform support, `fs.watchFile` `interval` default 5007 ms
- https://nodejs.org/docs/latest-v22.x/api/fs.html — the Node 22 `fs` API surface; `fs.mkdtempDisposableSync` is not listed

### Tertiary (LOW confidence — not relied on for any recommendation)

- WebSearch results on `fs.watch` recursive platform support (nodejs/node issues #36005, commit 34bfef9, third-party watcher READMEs) — corroborating only; every claim used above is also in the official docs or was measured

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — every module, version, and convention read from the tree this session; the stack is fixed by a hard project rule (zero deps) with no room for alternatives
- Board grammar / corpus: **HIGH** — 141 rows measured by probe across five sources; the conformance percentages are computed, not estimated
- Architecture / extraction site: **HIGH** — exact function, exact line ranges, exact code quoted verbatim
- `fs.watch` behaviour on macOS: **HIGH** — reproduced, output pasted
- `fs.watch` behaviour on Windows: **UNKNOWN - verify** — Phase 33 / CAP-02; deliberately not asserted
- `node:fs` symbol count across Node majors: **MEDIUM** — Node 24 enumeration measured; Node 22 runtime not available on this machine (A1/A2)
- Pitfalls: **HIGH** for 1, 2, 3, 4, 5, 6, 7, 9, 10 (each measured or read from source); **MEDIUM** for 8 (rests on A1/A2)
- Security domain: **MEDIUM-HIGH** — ASVS mapping is reasoned from the phase's actual surface; every mitigation cites an existing in-repo precedent

**Research date:** 2026-09-13
**Valid until:** 2026-10-13 (30 days — the in-repo facts are stable; re-measure the corpus if either example board is edited, and re-run the `node:fs` enumeration on any Node major bump)
