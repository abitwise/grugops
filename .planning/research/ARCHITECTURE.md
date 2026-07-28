# Architecture Research

**Domain:** grugops v2.1 — integrating four new capabilities (board projector, CLI dashboard, per-checkpoint autonomy matrix, real spawn path) into the mature v2.0 file-based agent factory.
**Researched:** 2026-07-28
**Confidence:** HIGH on integration points — every claim below is grounded in a file read in this repo this session, with line numbers cited. MEDIUM where a shape is *designed here* (the snapshot type, the config schema) rather than observed.

> **Read first — this is an INTEGRATION study, not a redesign.** The shared verified context, the lock-free queue, the dual parallel/sequential path, and the §14 gate are **unchanged**. Everything below is expressed as *which existing file gets a NEW sibling vs a MODIFIED body*, with real paths. Nothing here invents a file that does not exist unless it is explicitly marked **NEW**.
>
> This file supersedes the v2.0 architecture study (archived under `.planning/milestones/`).

---

## Executive answer in one page

Three of the four v2.1 capabilities are structurally the *same* problem: **grugops has several predicates whose authority is a hard-coded list, and those lists have already drifted silently green.** The project's own doctrine — *"one format-aware authority per predicate; never a second grammar for the same format"* — is the design tool for all three.

Measured drift, verified this session:

| Predicate | Authorities in code | State on disk |
|---|---|---|
| "what is the workflow set?" | `validate-agent-factory.ts:118-133` (**14** entries), `check-foundation-guards.ts:593-610` `CTX_WORKFLOWS` (**16** entries), `generate-catalog.ts:154-156` (`readdirSync`, correct), `check-kit-refs.ts` `SCAN` (dir-level) | **19 files.** Two lists silently stale — 5 workflows unvalidated, 3 unguarded by `guard_context_writes` |
| "what is the role set?" | `validate-agent-factory.ts:144-161` (**16**, missing `frontend-ui`), `check-foundation-guards.ts:282-300` `ROLE_FILES` (**17**, correct), `roleCeiling()` switch `:487-525` (17 cases), `generate-catalog.ts:110-112` (`readdirSync`) | **17 roles.** One list stale |
| "which adapters exist / may spawn?" | `check-foundation-guards.ts:135-140` `WR05_SCAN` (4 files), `:244-247` `ADAPTERS` (2 files), `check-kit-refs.ts` `SCAN` (1 literal), `install.ts:481-490` `SKILLS`+`AGENT_REL`, `install.ts:792-795`, `uninstall.ts:88,433-441` | **1 adapter file, 7 names granted, 0 of the 7 exist** |
| "what columns does the board declare + WIP limit?" | `validate-agent-factory.ts:429-435` (headings only) — **1 code authority**, but **3 artifact declarations** | seed `## Columns` table (`board.md:58-72`), 13 `## <Name> (WIP n/m)` headings (`:76-100`), `factory.config.json:18-29` `wip_limits` (10 keys — 3 columns deliberately absent) |
| "which column is ticket X in?" | `validate-agent-factory.ts:437-449` reads ticket frontmatter; **nothing reads board rows** | 2 artifact declarations, 1 authority |
| "what is the board ticket-row grammar?" | **none** | exists only as an HTML-comment example, `agent-factory/seed/plans/board.md:25-31` — and the two examples there **disagree** on metadata keys |
| "is an admission gated / high-severity?" | `context-io.ts` `normalizeKind:1371`, `isHighSeverityRole:1383`, `isGatedNote:1403` — **one authority, imported by the hook** (`admission-guard.ts:66,196`) | **This is the model to copy.** It cost 8 rounds to reach |

So the build order writes itself: **unify the set-discovery predicate first**, because the adapter set (capability 4) *is* the role set, and the guard scan sets that would protect those adapters are the same hard-coded lists.

The board projector is **not** the second-parser risk it first appears to be — the existing validator parser reads *column headings only* and never touches ticket rows. The correct move is: extract the heading parser into `scripts/board-model.ts`, **delete** the validator's inline copy, and let the row parser be the *first* authority for a grammar that today has none — pinned by a written grammar and a parse oracle before anything consumes it.

The autonomy matrix's hard part is not the schema. It is that **two of the four floors are hook-enforced (un-forgeable) and two are in-process-enforced (env-forgeable).** A design that applies one env-var mechanism to all four would be precisely a "detector that is a strict subset of the real predicate."

---

## Standard Architecture

### System overview — where the four capabilities attach

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  KIT ROOT  ${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory   (read-only)          │
│  17 roles · 19 workflows · 11 checklists · packaging templates · seed/ · config │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                │  set-discovery  (NEW single authority)
                                ▼
                    ┌───────────────────────────┐
                    │  scripts/kit-model.ts     │  ← NEW  (P4/P5 authority)
                    │  listRoles() listWorkflows│
                    └──────┬─────────────┬──────┘
             ┌─────────────┘             └──────────────┬───────────────┐
             ▼                           ▼              ▼               ▼
  generate-catalog.ts        generate-role-adapters.ts  check-foundation  validate-
  (MODIFIED: import)         (NEW)                      -guards.ts        agent-factory.ts
                                      │                 (MODIFIED)        (MODIFIED)
                                      ▼
                        .claude/agents/grugops-*.md   (17 GENERATED pointer adapters)
                        + the coordinator's Agent(...) allowlist, derived
                                      │
                        adapters-freshness.ts  (NEW standalone gate)

┌────────────────────────────────────────────────────────────────────────────────┐
│  STATE ROOT  <repo>/   (per-repo, agent-written)                               │
│  .grugops/{factory.config.json, install.json, context/**, queue/**}            │
│  plans/{board.md, tickets/*.md, traceability.md, ...}   memory-bank/           │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                │ read-only join
                                ▼
                    ┌───────────────────────────────────────┐
                    │  scripts/board-model.ts               │  ← NEW  (P1/P2/P3 authority)
                    │  parseBoard()  readSnapshot()         │
                    │  → FactorySnapshot (typed, versioned) │
                    └───────┬───────────────────────┬───────┘
                            │                       │
            ┌───────────────┘                       └────────────────┐
            ▼                                                        ▼
  validate-agent-factory.ts (MODIFIED —          scripts/board-dashboard.ts (NEW)
  inline board parser DELETED, imports)          separate process · read-only ·
                                                 fs.watch + poll floor · ANSI render
                                                 · --json emits the SAME snapshot
                                                   (the future web renderer's seam)

┌────────────────────────────────────────────────────────────────────────────────┐
│  ENFORCEMENT PLANE  (the agent cannot reach it)                                 │
│  hooks/hooks.json → PreToolUse                                                  │
│    matcher "Bash"             → hooks/guard.js          (prod deploy · protected │
│                                                          branch push)            │
│    matcher "mcp__grugops__.*" → hooks/admission-guard.js (verify-before-write)   │
│                                      │                                          │
│                    imports scripts/autonomy-model.ts   ← NEW  (P7 authority)      │
│                    (floor registry: id → claim → tier → env key)                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Component responsibilities (NEW vs MODIFIED)

| Component | Status | Responsibility | Consumers |
|---|---|---|---|
| `scripts/kit-model.ts` | **NEW** | Sole authority for "what roles/workflows exist." `listRoles()` (readdir `agent-factory/roles`, drop `_`-prefixed → 17), `listWorkflows()` (`/^\d{2}-.+\.md$/` → 19). The exact rules `generate-catalog.ts:110-112,154-156` already proved correct. | catalog generator, adapter generator, both guards, validator |
| `scripts/board-model.ts` | **NEW** | Sole authority for reading factory state. Parses board columns/WIP, ticket frontmatter, board ticket rows; joins queue + notes + trace; emits `FactorySnapshot`. Read-only by construction. | validator, dashboard, `--json` consumers |
| `scripts/board-dashboard.ts` | **NEW** | Separate long-lived process rendering a `FactorySnapshot`. Zero deps, ANSI only. Never writes. Never load-bearing. | operator |
| `scripts/generate-role-adapters.ts` | **NEW** | Emits the 17 `.claude/agents/grugops-<role>.md` pointer adapters **and** the coordinator's `Agent(...)` allowlist, from `kit-model.listRoles()` + `agent-factory/packaging/subagent.frontmatter.md`. | build, freshness gate |
| `scripts/adapters-freshness.ts` | **NEW, standalone** | Regenerate-to-temp + `Buffer.equals` over the whole adapter set. Twin of `catalog-freshness.ts`; **not** folded into the aggregator (the D-07 precedent). | `npm run freshness:adapters`, CI |
| `scripts/autonomy-model.ts` | **NEW** | Sole authority for the checkpoint matrix + floor registry: checkpoint id → default → is-it-a-floor → enforcement tier → env key → the public claim it backs. | validator (form), both hooks (authority), dashboard (display), config docs |
| `scripts/validate-agent-factory.ts` | **MODIFIED** | Delete inline `boardColumnName`/`boardHasColumn` (`:429-435`), import `board-model`. Replace frozen `ROLES`/`WORKFLOWS` (`:118-161`) with `kit-model`. Replace the hard `production_requires_human_confirmation !== true` reject (`:391-398`) and the `test_integrity` enum (`:330`) with `autonomy-model` **form** checks. | CI |
| `scripts/check-foundation-guards.ts` | **MODIFIED** | `WR05_SCAN` (`:135-140`) and `ADAPTERS` (`:244-247`) become directory-derived; `CTX_WORKFLOWS` (`:593-610`) and `ROLE_FILES` (`:282-300`) come from `kit-model`. New `guard_adapter_body`. | CI |
| `hooks/guard.ts` | **MODIFIED** | `SELF_APPROVE` (`:88`) generalized from the single `APPROVAL` const to the whole approval-var family, so a new floor env cannot be inline-set. Consults `autonomy-model` for the merge/deploy floors. | Claude Code |
| `hooks/admission-guard.ts` | **MODIFIED** | Adds the verify-before-write floor-lowering branch using the same per-call env pattern it already implements (`:205-225`). Emits the ledger event when it honors a lowering. | Claude Code |
| `.claude/agents/grugops-orchestrator.md` | **MODIFIED → GENERATED** | Body purged of the pre-v2.0 handoff text at `:25`; thereafter produced by the generator so it cannot re-diverge from `subagent.frontmatter.md`. | Claude Code |
| `install/install.ts` / `install/uninstall.ts` | **MODIFIED** | `SKILLS`/`AGENT_REL` (`install.ts:481-490`), `adapterDests` (`:792-795`), the install loop (`:1286-1301`), and `uninstall.ts:88,433-441` iterate the derived adapter set instead of hard-coded names. | hosts |
| `agent-factory/seed/plans/board.md` | **MODIFIED** | Row grammar promoted from HTML-comment example (`:25-31`) to a pinned, documented grammar. | agents, board-model |

---

## Capability 1 — Board projector / read model

### The doctrine question, answered directly

**Does the dashboard create a second parser for a format that already has one? Partly yes, partly no — and the two halves need opposite treatments.**

`plans/board.md` is read by exactly one thing today: `validate-agent-factory.ts:419-443`. Read what it actually parses:

```ts
const boardColumnName = (line: string): string =>
  line.replace(/^##\s+/, "").replace(/\s*\(WIP[^)]*\)\s*$/, "").trim();
const boardHasColumn = (col: string): boolean =>
  boardLines.some((l) => l.startsWith("## ") && boardColumnName(l) === col.trim());
```

It parses **column headings only**. It never reads a ticket row, never reads the numbers inside `(WIP 0/3)`, never reads the `## Columns` table. Predicate by predicate:

- **P1 "what columns exist?"** — one existing authority. The dashboard needs the same predicate, so it must **import**, never re-derive. **Verdict: EXTRACT into `board-model.parseBoard()`; DELETE the validator's inline copy.** Leaving both is the failure mode; adding a third is worse. Non-negotiable. The WR-03 full-segment match at `:423-428` is hard-won (bare-prefix matching let `"In"` match `"## In Development (WIP 0/3)"`) — **port it verbatim, do not redesign it.**
- **P1b "what is each column's WIP live/limit?"** — no code authority; three artifact declarations. The dashboard must show WIP, so it is the first reader of the `(WIP n/m)` numbers. **Verdict: `parseBoard()` owns heading-WIP extraction; the snapshot carries the config `wip_limits` alongside it as `limitConflicts[]` — never silently preferring one.** Note `wip_limits` has 10 keys against 13 columns (Backlog/Done are unlimited, Blocked is "visible, time-tracked"), so the model needs `limit: number | "unlimited" | "tracked"`, not `undefined`.
- **P2 "which column is ticket X in?"** — two artifact declarations (ticket frontmatter `column:`/`status:`; the board row). One code authority (validator, frontmatter side only). **Verdict: ticket frontmatter is authoritative for placement; board rows are a human mirror. The snapshot exposes disagreement as `conflicts[]` and NEVER resolves it silently.** This is not a fudge — it is the honest render, and it makes the dashboard immediately valuable because drift is exactly what an operator needs to see.
- **P3 "what is the ticket-row grammar?"** — **zero** authorities. It exists only as a comment example (`agent-factory/seed/plans/board.md:25-31`):
  ```
  - [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)
  - [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)
  ```
  Two examples, two different metadata vocabularies, inside an HTML comment, with no code and no test. **Verdict: a row parser creates the FIRST authority — legitimate and required. But the grammar must be PINNED FIRST, or the parser silently becomes the de-facto spec while agents' free-text drifts away from it.** That divergence is the precise shape of the 13 documented v2.0 bypasses.

### Board markdown hardening — required, and here is the minimum

Do **not** invent a rigid machine format that fights the readable-markdown ethos. Pin exactly this much:

```
- [<ID>] <title>  (<key>: <value>, <key>: <value>)
```

- `<ID>` reuses the id shape already used by `trace-render.ts:56` — `/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/`. **Import that constant; do not write a second id regex.**
- The `(...)` tail is an **open** `key: value` map — parsed, not enum-checked — so `owner`/`since`/`PR`/`QE` and future keys all survive.
- `title` may not contain `[`, `]`, or an unescaped `(` opening the tail. Escaping follows the existing `cell()` convention — which is itself currently a **four-way duplicate** (`generate-catalog.ts:77`, `context-io.ts:1089`, `claim.ts:251`, `trace-render.ts:43`). Fold it into one shared module as part of this work; it is the same doctrine, cheaply paid.
- A `- `-leading line under a column that does not parse becomes `{ kind: "unparsed", raw, line }` in the snapshot. **Never dropped.** A dropped row is the confident-wrong-board failure.

Pin it with a **parse oracle**, not only unit tests: a property test that round-trips `render(parse(x)) === x` over a generated corpus, plus a fuzz corpus of adversarial titles (pipes, brackets, nested parens, CRLF, zero-width). The v2.0 lesson is explicit that a green unit suite is not proof for a format predicate; a parser oracle is the cheap equivalent that actually held.

### The typed snapshot

Designed so a CLI renderer today and an HTTP/web renderer later consume the **same shape**. The seam is `--json`: the renderer is a pure function of the snapshot, and `board-dashboard.js --json` prints exactly the object the renderer receives.

```ts
// scripts/board-model.ts
export const SNAPSHOT_SCHEMA_VERSION = 1;      // bump on any breaking shape change

export type WipLimit = number | "unlimited" | "tracked";

export interface BoardColumn {
  name: string;                    // "In Development"
  status: string;                  // kebab form, via the SAME kebab() the validator uses (:209)
  order: number;                   // heading order in board.md — the render order
  wipLive: number | null;          // from "(WIP 1/3)"; null when the heading carries no count
  wipLimitBoard: WipLimit | null;
  wipLimitConfig: WipLimit | null; // from factory.config.json#wip_limits
  rows: BoardRow[];
}

export type BoardRow =
  | { kind: "ticket"; id: string; title: string; meta: Record<string, string>; line: number }
  | { kind: "unparsed"; raw: string; line: number };   // surfaced, never dropped

export interface TicketRecord {
  id: string;                      // filename stem — the validator's existing key
  path: string;                    // plans/tickets/<id>.md
  column: string | null;           // frontmatter `column:`
  status: string | null;           // frontmatter `status:`
  size: string | null;
  priority: string | null;
  epic: string | null;
  feature: string | null;
}

export interface QueueSnapshot {
  pending: string[];               // .grugops/queue/pending/*.md
  claimed: Array<{ task: string; by: string; at: string; tampered: boolean }>;
  done: string[];
  wipLimit: number | null;         // factory.config.json#queue.wip_limit
  claimCap: number | null;
  staleTtlMinutes: number | null;
}

export interface ContextSnapshot {
  tasks: Array<{
    task: string;
    noteCount: number;
    kinds: Record<string, number>;   // NOTE_KINDS histogram (context-io.ts:47)
    lastAt: string | null;
    unverifiedFindings: number;      // findings with no live green verdict cross-check
  }>;
}

export interface AutonomySnapshot {              // capability 3 joins here
  checkpoints: Array<{ id: string; effective: string; default: string; isFloor: boolean }>;
  loweredFloors: Array<{
    id: string; loweredBy: string; reason: string; at: string;
    enforcementTier: "hook" | "in-process";
    claimDropped: string;                        // the public claim this lowering voids
  }>;
}

export type Severity = "info" | "warn" | "error";
export interface Diagnostic {
  severity: Severity;
  source: "board" | "tickets" | "queue" | "context" | "trace" | "config";
  path: string | null;
  message: string;
}

export interface FactorySnapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  generatedAt: string;                           // ISO; the ONLY nondeterministic field
  stateRoot: string;
  kitRoot: string | null;                        // from .grugops/install.json; null when uninstalled
  ok: boolean;                                   // false when ANY diagnostic is "error"
  board: { columns: BoardColumn[]; present: boolean };
  tickets: TicketRecord[];
  conflicts: Array<{                             // board row vs frontmatter — never resolved
    ticketId: string; boardColumn: string | null; ticketColumn: string | null;
  }>;
  queue: QueueSnapshot;
  context: ContextSnapshot;
  trace: { rowCount: number; ticketsWithoutRow: string[] };
  autonomy: AutonomySnapshot;
  diagnostics: Diagnostic[];
}
```

Design notes that carry weight:

- **`generatedAt` is the only wall-clock field.** Everything else is a pure function of disk. That preserves the byte-reproducibility discipline `trace-render.ts`, `claim.ts:renderNowRunning`, and `generate-catalog.ts` all maintain, and it makes a snapshot diffable in a test.
- **`ok` + `diagnostics[]` is the only degrade channel.** There is no throwing path out of `readSnapshot()`.
- **The renderer never reads the filesystem.** `render(snapshot): string`. That purity *is* the web seam: a future HTTP handler is `res.json(readSnapshot(root))` and nothing in `board-model.ts` changes.

### Where queue, context, and trace join

All three already have authorities. **Import them; parse nothing twice.**

| Join | Existing authority to import | Do NOT |
|---|---|---|
| queue claimed | `claim.ts` — the `at:`-count-then-first-match tamper discipline (`:291-299`), already load-bearing (T-23-01) | re-implement `claim.md` frontmatter parsing. Export the row extraction currently inlined in `renderNowRunning:277-302` and call it |
| queue pending/done | `readdirSync` + `TASK_NAME_RE` (`claim.ts:68`) | invent a second task-name allowlist |
| context notes | `context-io.readContext():803`, `currentState():838`, `parseNote():245` | parse note frontmatter. `parseNote` and `splitNotes` deliberately share one grammar (the Phase-22 structural fix) — never add a third reader |
| trace | `trace-render.buildRows(contextRoot):125` | parse the rendered `plans/traceability.md`. Reading the render instead of the source is exactly how a second grammar is born |
| config (governance) | `context-io.readGovernanceConfig():1220` / `readGovernanceConfigResult():1288` | write a second governance-config reader |

**Consequence to verify:** `board-model.ts` importing `context-io.js` and `claim.js` makes the dashboard transitively depend on both. Both are pure-stdlib and side-effect-free on import today (`claim.ts:324-327` and the sibling `isMain` guards). An import-time side effect in either would hand the dashboard a write path and break "read-only" — worth an explicit test.

### The larger option, flagged not chosen

**Option B: make `plans/board.md` a generated render** of ticket frontmatter + `wip_limits`, with a `freshness:board` gate — the pattern grugops has already applied **four** times (`generate-catalog`+`catalog-freshness`; `trace-render`+`trace-freshness`; `claim.js now-running`+`now-running-freshness`; `context-io.render`+`context-freshness`).

It eliminates P2's duplicate declaration entirely, which is the doctrine-pure outcome. It costs: rewriting `## Board moves` across 19 workflows (the agent's move becomes "edit ticket frontmatter, re-render"), rewriting the seed board's format comment, and losing free-form human scribbles on the board.

**Recommendation: not in v2.1.** The milestone is explicitly "corrective and operational, not architectural," and `conflicts[]` buys the drift visibility at a fraction of the cost. But design `board-model.ts` so Option B is a later *additive* step: keep `parseBoard()` and a future `renderBoard()` in the **same module** so they share the grammar by construction — the same one-module trick that finally closed CMP-02.

---

## Capability 2 — Dashboard process topology

### Root discovery

The dashboard is a **STATE-only** consumer. It needs `plans/`, `.grugops/`, `memory-bank/`; it does not need the kit. That matters, because the validator's C3 rule (`validate-agent-factory.ts:62-68`) — `VALIDATE_KIT_ROOT` has **no default**, unset is a hard error — exists to stop the *validator* false-greening in a dev checkout. Applying it to a dashboard would be cargo-culting: a dashboard with no kit is fine.

Resolution order (mirroring the installer's own model):

1. `--root <path>` (explicit wins).
2. `GRUGOPS_STATE_ROOT` env.
3. Walk up from `cwd` for the first dir containing `.grugops/install.json` — the marker `install.ts:1134-1140` writes as `{kitVersion, grugopsHome, kitRoot, installMode}`. Read `kitRoot` from it **for display only**, never to resolve state.
4. Walk up for the first dir containing `plans/board.md` (uninstalled / partial repos).
5. Fail with a named message listing the paths tried. **Never default to `.`** — the C3 *lesson* generalizes even though the C3 *mechanism* does not apply.

Vacuous-state handling is mandatory and has precedent: `now-running-freshness.ts:93-100` returns a **greenfield vacuous success** when `claimed/` does not exist. The grugops dev checkout itself has **no `.grugops/` directory** (verified), and the seed ships only `.grugops/factory.config.json` — no `queue/`, no `context/`. So "state root found, most subtrees absent" is the *normal* first-run case and must render an empty board, not an error.

### Event vs polling

**Polling is the correctness floor; `fs.watch` is the latency optimization.** Never watch-only.

- `fs.watch(dir, { recursive: true })` fails in exactly the ways this workload hits: it drops events under rapid writes, it reports `rename` for atomic-rename replacement (which is how `context-io.atomicWrite:664` and `claim.atomicWrite:224` write *every* file they own), and its recursive mode has divergent per-platform backends. Windows is a first-class constraint — `fs.watch` is a named Windows surface in the milestone's standing obligation #2, and the `windows-latest` leg is already red on 3 test files.
- Design: watch a **small explicit set** — `plans/`, `plans/tickets/`, `.grugops/queue/{pending,claimed,done}`, `.grugops/context/` — coalesce events into a **debounce window (~150 ms)**, and run an unconditional **reconcile tick** every N seconds (default 2 s, `--interval`) that re-reads regardless. A missed event self-heals within one tick; a watch setup failure degrades to pure polling behind a visible banner line (`WATCH: polling — fs.watch unavailable: <reason>`), never silently.
- Cheap change detection before a full re-parse: stat each tracked file for `(size, mtimeMs)` and skip the parse when the tuple set is unchanged. Keeps the 2 s tick nearly free on an idle repo.

### Torn reads

Two classes, needing different answers:

**Class A — written atomically.** `.grugops/context/**` (`context-io.atomicWrite`), the queue transitions and `now-running.md` (`claim.ts:83-100,224-247`), `plans/traceability.md` (`trace-render.ts:181` → `atomicWrite`). A reader sees either the old inode or the new one. **No mitigation needed.**

**Class B — written by agents with ordinary Write/Edit.** `plans/board.md`, `plans/tickets/*.md`, `.grugops/factory.config.json`. These can be observed half-written.

Mitigation, in order:

1. **Read-verify-reread.** `readFileSync` → capture `statSync` `(size, mtimeMs, ino)` before and after → retry if they differ. Bounded to 3 attempts with 50 ms backoff; on exhaustion emit a `warn` diagnostic and render the **previous good snapshot** with a staleness marker. Never render a partial parse as current.
2. **Structural sanity gate before accepting a parse.** A board that suddenly yields 0 columns where the previous snapshot had 13 is far more likely a torn read than a deletion. Treat a >50% column-count collapse as suspect: keep the previous snapshot, emit `warn`, let the next tick confirm. **Say plainly in the file header that this is a heuristic for a transient, not a safety predicate** — it is permitted to be a heuristic precisely because being wrong costs one render frame, not a safety bypass. The doctrine is about safety predicates, and blurring that boundary in either direction is its own error.
3. **Do not** add file locking. There is no lock manager anywhere in grugops by design (`claim.ts:5,12`); introducing one for a read-only viewer would be the worst possible place to start.

### Failure mode: degrade visibly

Hard rule: **never render a confident wrong board.**

| Failure | Behavior |
|---|---|
| state root not found | exit 1 with a named message + the paths tried. No TUI. |
| `plans/board.md` absent | render `BOARD: absent — plans/board.md not found`, keep queue/context panels. `board.present = false`. |
| board parse yields zero columns | `error` diagnostic; `BOARD: UNPARSEABLE` banner; render **no** columns rather than a plausible empty one. |
| a row fails the grammar | renders as `? <raw>` under its column in a distinct style; footer `N unparsed rows`. Never dropped. |
| board row ≠ ticket frontmatter | both rendered, marked `≠`; footer `N conflicts`. Never silently reconciled. |
| a ticket file unreadable | `warn` naming the path; omitted from `tickets[]` but its board row still renders. |
| config unreadable | `error`; WIP limits render `?/?`; **the autonomy panel renders `AUTONOMY: UNKNOWN — config unreadable`, never "all floors held."** This is the one place a wrong render would be a safety lie. |
| a claim record is tampered (multi-`at`) | surfaced as `tampered: true` and rendered explicitly — do **not** replicate `claim.ts:292`'s `continue`, which is correct for a *trusted render* and wrong for a *diagnostic view*. |

Add `--once` (render one frame to stdout, exit `0` when `ok`, `1` otherwise) so the honest degrade is CI-observable and testable without a TTY.

### Never load-bearing

Enforce it, do not merely assert it. `board-dashboard.ts` is **not** folded into `check-foundation-guards.ts` — following the D-07 precedent that keeps `catalog-freshness`, `context-freshness`, `now-running-freshness`, and `trace-freshness` standalone — and no role or workflow may name it as a required step. A one-line addition to the `guard_context_writes` family (grep the 17 roles + 19 workflows for the dashboard token) makes "never load-bearing" mechanical for almost nothing.

---

## Capability 3 — Per-checkpoint autonomy matrix

### The checkpoint inventory

Three tiers of stop exist today; only the first is dialable.

1. **The scalar** — `factory.config.json:5` `"autonomy": "pr"`, documented `diff|branch|pr` at `factory.config.md:14`. **The validator does not enum-check it** — `validate-agent-factory.ts:310-314` only requires `mode`/`cadence`/`autonomy` be non-empty *strings*. Direct consequence: **turning `autonomy` into an object breaks validation today** (`typeof cfgObj[key] !== "string"` fires). Schema change and validator change must land in the same commit.
2. **Prose stops** — `## Stop conditions` in **17 of 19** workflows (e.g. `05-pr-quality-gate.md:65-68` names self-fix exhaustion and the test-integrity exit-1 stop; `12-release.md:43` names the no-named-human-approval stop; `06-uat-pack.md:39` names never-self-sign), plus `## Hard limits` in every role. These are the checkpoints to enumerate into ids.
3. **The four mechanical floors:**

| Floor | Mechanism | File:line | Enforcement tier |
|---|---|---|---|
| Production deploy | PreToolUse deny unless `GRUGOPS_PROD_DEPLOY_APPROVED` is in the **hook's own** env; inline set/export refused | `hooks/guard.ts:34,88,119-137`; validator reject `validate-agent-factory.ts:391-398` | **hook — un-forgeable** |
| Protected-branch merge/push | same hook, `git push` patterns | `hooks/guard.ts:74-76` | **hook — un-forgeable** |
| Verify-before-write | `validate()` refuses self/hollow stamps; `emitVerdict()` sole `§14-gate` author; `admit()` cross-checks; hook binds stamp to `GRUGOPS_ADMISSION_APPROVED_BY` | `context-io.ts:548,881,966`; `hooks/admission-guard.ts:72,205-225` | **hook on Claude Code; in-process elsewhere** (already documented weaker at `admission-guard.ts:30-33`) |
| Test-integrity | enum `["warn","block"]` — no "off" | `validate-agent-factory.ts:330` | **in-process — forgeable** |

### The critical asymmetry, stated plainly

`admission-guard.ts:22-33` already writes down the mechanism that makes an env var un-forgeable:

> *"an agent's own inline `export VAR=...` lands in the child env it spawns, which the hook process never inherits; the human's session export DOES reach the hook."*

That holds **only because the hook process is spawned by the harness, not by the agent.** For an in-process check — the test-integrity checker at `tools/grugops/test-skip-integrity.js`, which the agent runs via Bash — the agent **is** the parent, so an env var it exports **is** inherited. Applying the same env mechanism to a test-integrity floor lowering would look identical in the config and be trivially forgeable. **That is a detector that is a strict subset of the real predicate.**

Therefore: **classify each floor by tier, and give the tiers different mechanisms and different honesty.**

### Config schema

```jsonc
{
  "autonomy": {
    "profile": "pr",                       // back-compat: the old scalar's meaning, preserved
    "checkpoints": {
      "ticket.dor_fail":            "auto",     // was a prose stop → now dialable
      "ticket.xl_split":            "auto",
      "gate.self_fix_exhausted":    "human",
      "gate.visual_baseline":       "human",
      "uat.signoff":                "human",
      "release.readiness":          "human",
      "incident.prod_action":       "human"
      // ... one id per enumerated stop; an ABSENT key is its documented safe default
    },
    "floors": {
      // A floor entry is a DECLARATION OF INTENT. It is INERT on its own.
      "prod_deploy":         { "held": true },
      "protected_merge":     { "held": true },
      "verify_before_write": { "held": true },
      "test_integrity":      { "held": true }
      // to lower:
      // "test_integrity": { "held": false, "lowered_by": "alice",
      //                     "reason": "vendored suite; skips justified out-of-band",
      //                     "at": "2026-08-01", "claim_dropped": "CLAIM-TINT-01" }
    }
  }
}
```

The `active-when-present / lenient-when-absent` contract from D-14 (`validate-agent-factory.ts:316-322`) applies verbatim: a missing `autonomy.checkpoints` means every checkpoint sits at its safe default, preserving zero-config (SC4).

### Where the opt-in lives — and why not in the config

**The config file cannot be the authority for a lowering.** It lives in STATE (`.grugops/factory.config.json`), agents hold `Write`, so an agent can author `"held": false, "lowered_by": "alice"` itself. This is structurally identical to the `verified_by` problem grugops already solved — by refusing self-stamps and cross-checking against an authority the writer does not control.

**Two-key design:**

- **Key 1 — declaration (in config).** States *which* floor, *by whom*, *why*, *which claim is dropped*. Agent-writable, therefore **never sufficient**. The validator checks its **form**: all four fields present; `lowered_by` non-empty and not `self`/`agent`/`grugops`; `claim_dropped` names a registered claim id; `at` parses. A malformed lowering is an `err()` → exit 1.
- **Key 2 — authorization (in the session env).** `GRUGOPS_FLOOR_<ID>_LOWERED_BY=<name>`, read **fresh per call by the hook process**, authorized only when it **equals** `config.autonomy.floors.<id>.lowered_by`. This is exactly the stamp-binding shape at `admission-guard.ts:216-225`: the agent supplies the claim, the hook validates it against an env the agent cannot reach. Neither key alone grants.

**One env var per floor — never a blanket `GRUGOPS_FLOORS_LOWERED`.** A blanket grant is a wildcard over a set-membership predicate: a second, weaker grammar for "which floor is approved," and one that silently widens as floors are added. Same reasoning that made `WR05_SCAN` enumerate rather than glob.

**And `hooks/guard.ts:88` must be generalized.** Today `SELF_APPROVE` is built from the single `APPROVAL` const:

```ts
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);
```

Adding new approval env vars without widening this leaves them inline-settable inside a Bash command. Widen to the family (`GRUGOPS_[A-Z0-9_]*(APPROVED|LOWERED_BY)[A-Z0-9_]*`) and — because that regex is now a *safety predicate over a format* — give it its own fuzz corpus. **This is a concrete hole that capability 3 opens if missed.**

### Enforcement points

| Floor | Tier | Where the lowering is honored | Honest claim |
|---|---|---|---|
| `prod_deploy` | hook | `hooks/guard.ts`, before the `DEPLOY.some(...)` deny at `:129-137` | Un-forgeable on Claude Code. On the other four CLIs there is no hook, so this floor was always procedural (`adapters.md:86-91` says so) — unchanged |
| `protected_merge` | hook | same | same |
| `verify_before_write` | hook (CC) / in-process (others) | `hooks/admission-guard.ts`, before the gated deny at `:206-225` | Un-forgeable on CC; **documented weaker** elsewhere, per the existing `:30-33` text |
| `test_integrity` | **in-process** | `tools/grugops/test-skip-integrity.js` | **Cannot be made un-forgeable by an env var.** Either (a) move enforcement to the point of effect — have `emitVerdict()` (`context-io.ts:881`, already the sole `§14-gate` author) refuse to emit GREEN when integrity was skipped without a valid lowering; or (b) accept and *label* a weak tier |

**Recommendation for `test_integrity`: do (a).** "Move the gate to the point of effect" is one of the four fixes named in the project's own terminal lesson, and here the point of effect is the verdict, not the checker. An agent that lowers `test_integrity` without authorization then gets no GREEN verdict, so `admit()` refuses its findings and the work degrades honestly to `UNKNOWN - verify` — machinery that already exists and needs no new trust.

### The floor registry — one authority

```ts
// scripts/autonomy-model.ts
export interface FloorSpec {
  id: string;                       // "test_integrity"
  envKey: string;                   // "GRUGOPS_FLOOR_TEST_INTEGRITY_LOWERED_BY"
  tier: "hook" | "in-process";
  defaultHeld: true;                // floors default held. Always.
  claim: string;                    // "CLAIM-TINT-01"
  claimText: string;                // the exact public sentence this floor backs
  enforcedAt: string;               // "hooks/guard.ts" | "context-io.ts:emitVerdict"
}
export const FLOORS: readonly FloorSpec[];
export function floorStatus(cfg, env): FloorStatus[];   // the ONE composition
```

Consumed by the validator (form only), both hooks (authority), `board-model` (display), and the config docs. **The hooks must not reconstruct the composition locally** — precisely the discipline `admission-guard.ts:189-199` documents ("the hook defines no classifier of its own"), and what finally closed GOV-01 after 8 rounds.

`claimText` is the mechanism for "the corresponding claim is dropped." Each public safety claim in `README.md` / `AGENTS.md` / `agent-factory/README.md` gets an id; the registry maps floor → claim; when a floor is lowered the dashboard and the ledger both name the voided claim verbatim.

### Trace and dashboard surfacing

**The record must be emitted by the authority, not the agent.** An agent that lowers a floor and simply omits the ledger append defeats any agent-side record. So: the hook (or `emitVerdict`) appends the event at the moment it honors a lowering, reusing `appendAuditLedger()` (`context-io.ts:1057`), its fixed-key event shape, and the single global ledger path (`:936`). New event kind `autonomy_floor_lowered` carrying `{floor_id, lowered_by, reason, claim_dropped, tier, at}`.

Dashboard: `AutonomySnapshot.loweredFloors` renders as a **persistent top banner**, not a sub-view —

```
⚠ FLOOR LOWERED: test_integrity (by alice, 2026-08-01) — claim CLAIM-TINT-01 does not hold
```

and, per the failure table, an unreadable config renders `AUTONOMY: UNKNOWN` — never an optimistic "all floors held."

---

## Capability 4 — Spawn path

### The defect, confirmed on disk

`.claude/agents/grugops-orchestrator.md:5` grants:

```
tools: Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr,
             grugops-architect-design, grugops-system-analyst, grugops-uat-planner,
             grugops-release-manager), Read, Grep, Glob, Bash, Edit, Write
```

`.claude/agents/` contains exactly one file. **Zero of the seven exist.** The allowlist also covers 7 of 17 roles and omits `greenfield-mapper`, the greenfield-bootstrap entry point.

And `:24-26` still reads:

> *"activate each role through the role-switch protocol ... — one window, drop prior context, **the handoff is the only memory** — demand a handoff packet from each"*

Its own source template, `agent-factory/packaging/subagent.frontmatter.md:50-51`, was correctly updated in v2.0 to *"the shared verified context is the only memory — require published notes from each."* **The template was fixed; the materialized adapter was not.** That is a copy-drift defect — which tells you the fix.

### Generated, not hand-authored

**Generate.** Reasons, in force order:

1. **The drift above is the proof.** A hand-maintained copy of a template diverged from it for an entire milestone. Generation plus a byte-freshness gate makes that mechanically impossible. This is the *structural* fix; a grep for handoff prose is the heuristic. Do both — but know which is which.
2. **The allowlist must derive from the same list as the adapter set.** Two hand-maintained lists of the same thing is the P5 failure again.
3. **17 near-identical pointer files.** `guard_adapter_size` (`check-foundation-guards.ts:248-249`) caps adapters at 3072 B WARN / 4096 B FAIL — a template trivially satisfies it; hand-authored files drift toward the cap.
4. **Precedent is exact.** `generate-catalog.ts` self-discovers the kit, emits deterministic bytes behind a `<!-- GENERATED -->` header, fails closed on a structural miss, and is guarded by the standalone `catalog-freshness.ts`. Clone that shape.

### Generator design

```
scripts/generate-role-adapters.ts
  inputs : kit-model.listRoles()                             → 17 role files
           agent-factory/packaging/subagent.frontmatter.md   → the SINGLE body template
           each role's `# Role:` H1 + `## One job` first sentence
             (the same extraction generate-catalog.ts:126-139 already performs
              — SHARE that helper, do not clone it)
  outputs: .claude/agents/grugops-<role>.md          × 17  (specialist: no spawn grant)
           .claude/agents/grugops-orchestrator.md    × 1   (coordinator: true + Agent(<derived>))
  invariants:
    - body is POINTER text only: cites agent-factory/roles/<role>.md, never copies it
    - preserves the kit-vs-state blockquote + the MAT_SLOT resolver block that
      install.ts:1001-1006 injects `KIT="…"` above (materialization must keep working)
    - exactly ONE file carries `coordinator: true`
    - the Agent(...) list = listRoles() minus the coordinator, sorted, comma-joined
    - deterministic bytes; single trailing newline; fail-closed on a missing H1 / One job
```

Two subtleties the generator must respect:

- **Materialization compatibility.** `install.ts:969-1016` `materializeAdapter()` strips and re-injects a `grugops:materialized-kit` block around `MAT_SLOT`, content-idempotently. Only the two **resolver** adapters get that treatment today (`:1296-1301`); the six dash-skills are plain copies (`:1286-1293`). Decide deliberately: the 17 role adapters should be **plain copies** — they need no kit-root resolution (they cite repo-relative paths and the orchestrator already resolved the kit). That keeps the resolver-adapter count at two and keeps `check-kit-refs.ts` Assertion 3's "three legal `$GRUGOPS_HOME` sites" intact.
- **Freshness compares the committed source, not the installed copy.** `adapters-freshness.ts` regenerates to temp and byte-compares `.claude/agents/*.md` in the repo. A host's materialized copy carries the injected `KIT=` block and is deliberately out of scope — the same boundary `catalog-freshness.ts` observes.

### Keeping the allowlist in sync mechanically

Three layers, each strictly stronger than the last:

1. **Derivation** — the grant is generated from `listRoles()`; it cannot omit a role that exists.
2. **`freshness:adapters`** — regenerate-to-temp + `Buffer.equals`. A hand-edit to the grant, or a new role file without a regen, fails red. This is the real sync guarantee.
3. **`guard_wr05` extension** — cross-check that every name inside `Agent(...)` resolves to an existing `.claude/agents/<name>.md`. This is the check that would have caught the current defect on day one, and it is nearly free. **Add it regardless of the other two.**

### Interaction with `guard_wr05` — a hole this capability opens

`guard_wr05` (`check-foundation-guards.ts:179-212`) asserts, over `WR05_SCAN`:

- exactly **one** `coordinator: true` file (`:204`),
- the coordinator **has** the grant,
- every non-coordinator scan file **lacks** it.

`WR05_SCAN` is a hard-coded **4-file list** (`:135-140`). **Adding 17 files to `.claude/agents/` puts them entirely outside the guard.** A planted `tools: Agent(...)` in `grugops-software-engineer.md` would pass green. The cardinality check still holds (a second `coordinator: true` would fail), but the "no non-coordinator holds a grant" direction — half the invariant — would cover 4 of 21 files.

**Fix: derive the scan set.**

```ts
const WR05_SCAN = [
  "agent-factory/packaging/subagent.frontmatter.md",
  "agent-factory/packaging/slash-command.template.md",
  ...listDirMd(".claude/skills", "SKILL.md"),   // bounded directory enumeration
  ...listDirMd(".claude/agents"),
];
```

The guard's stated discipline is *"an explicit SCAN set — NEVER a repo-wide grep"* (`:125-126,589-592`). A **bounded directory enumeration is not a repo-wide grep**; it is the same self-discovery `generate-catalog.ts` uses. And the alternative is worse in exactly the documented way: a frozen list that does not grow with the thing it guards **is** a detector that is a strict subset of the real set — the 14-vs-19 and 16-vs-17 drift above is the receipt. Write that reasoning into the code comment so a future reader does not "restore" the hard-coded list.

Apply identical treatment to `ADAPTERS` (`:244-247`, feeding `guard_adapter_size`) and to `check-kit-refs.ts`'s `SCAN` literal `.claude/agents/grugops-orchestrator.md`.

`oracleWr05Wording` (`check-uat-oracles.ts`, invoked at `check-foundation-guards.ts:646`) asserts wording consistency across the WR-05 surfaces and is **known brittle to edits** (a recorded v2.0 trap: STATE.md edits broke it). Expect to update it in the same change; do not read its failure as a signal the design is wrong.

### `guard_adapter_body` — the new body guard

The milestone asks to extend the guard set to adapter **bodies**. Scope it as a token grep over the derived adapter set for the retired vocabulary: `handoff`, `handoff packet`, `the handoff is the only memory`, `agent-factory/handoffs/`, `one window, drop prior context`. Calibrate token-vs-prose the way `guard_context_writes` documents at `:566-572`.

State honestly in the header: **this grep is defense-in-depth against hand-edits between regenerations; the generator plus `freshness:adapters` is the structural guarantee.** A grep alone is a subset-heuristic over English — the exact class that drifted green for a full milestone.

**Bonus catches in the same neighborhood:** `agent-factory/handoffs/.gitkeep` still exists (standing obligation #5), and `check-kit-refs.ts` Assertion 2 still allowlists 16 handoff-template basenames.

---

## Data flow — what changes

### Read path (NEW)

```
plans/board.md ─────────────────┐
plans/tickets/* ────────────────┤
.grugops/factory.config.json ───┤
.grugops/queue/{pending,        ├──► board-model.readSnapshot()
             claimed,done} ─────┤       │  (imports context-io.readContext,
.grugops/context/<task>/notes/*─┤       │   claim's row extraction, trace buildRows,
autonomy-model.floorStatus() ───┘       │   readGovernanceConfigResult)
                                        ▼
                                 FactorySnapshot
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                  render(snapshot)            JSON.stringify(snapshot)
                  → ANSI, CLI today           → the web renderer's seam, later
```

### Set-discovery path (CHANGED)

```
BEFORE:  agent-factory/roles/*   →  5 independent lists   (3 already drifted)
AFTER:   agent-factory/roles/*   →  kit-model.listRoles() →  every consumer
```

### Enforcement path (EXTENDED, not replaced)

```
agent tool call
     │
     ├─ Bash ─────────────► hooks/guard.js
     │                        ├─ SELF_APPROVE (WIDENED to the approval-var family)
     │                        ├─ DEPLOY patterns  (unchanged)
     │                        └─ autonomy-model.floorStatus(cfg, process.env)   ← NEW
     │                             └─ on honored lowering: appendAuditLedger()  ← NEW
     │
     └─ mcp__grugops__* ──► hooks/admission-guard.js
                              ├─ isGatedNote(by, kind, cfg)    [unchanged authority]
                              ├─ env + stamp binding           [unchanged]
                              └─ autonomy-model floor branch   ← NEW
```

---

## Anti-patterns to avoid in this milestone

### Anti-Pattern 1: Adding a board parser to the dashboard
**What people do:** write `parseBoard()` inside `board-dashboard.ts` because "it's just a viewer."
**Why it's wrong:** two grammars for one format is the documented failure mode that cost 8 rounds three separate times. A viewer's parser drifting from the validator's means the validator passes a board the dashboard renders wrong — or worse, the reverse.
**Do instead:** `board-model.ts` is the only parser; the validator's inline copy at `:429-435` is **deleted**, not left alongside.

### Anti-Pattern 2: Keeping the hard-coded guard scan lists "because explicit is safer"
**What people do:** add 17 adapters, then append them to `WR05_SCAN` by hand.
**Why it's wrong:** the same instinct produced `WORKFLOWS` (14 vs 19 on disk) and `ROLES` (16 vs 17). The list-maintenance step is exactly the thing that fails, silently and green.
**Do instead:** derive from a bounded directory; preserve "never a repo-wide grep" by *scoping* the enumeration, not by *freezing* it.

### Anti-Pattern 3: One env var for all four floors
**What people do:** `GRUGOPS_FLOORS_LOWERED=1`.
**Why it's wrong:** a wildcard grant over a set-membership predicate — a second, weaker grammar for "which floor is approved," widening silently as floors are added.
**Do instead:** one env key per floor, registered in `autonomy-model.FLOORS`, name-bound to the config's `lowered_by` the way `admission-guard.ts:216-225` binds the stamp.

### Anti-Pattern 4: Treating an env var as un-forgeable for an in-process check
**What people do:** gate `test_integrity` on `GRUGOPS_FLOOR_TEST_INTEGRITY_LOWERED_BY` and call it mechanical.
**Why it's wrong:** the agent is the parent of that process, so it inherits any env the agent exports. Un-forgeability at `admission-guard.ts:22-33` comes from the hook's *parentage*, not from env vars being magic.
**Do instead:** move the floor to the point of effect (`emitVerdict` refuses GREEN), or label the tier honestly as weaker — never both silently.

### Anti-Pattern 5: Letting the agent write the lowering record
**What people do:** have the role append the audit-ledger event after lowering a floor.
**Why it's wrong:** omission is undetectable. A record only an honest agent writes proves nothing.
**Do instead:** the hook (or `emitVerdict`) appends at the moment it honors the lowering.

### Anti-Pattern 6: Declaring the spawn fix green from a passing suite
**What people do:** adapters exist, guards pass, ship.
**Why it's wrong:** the milestone's own kickoff finding is that a fully green guard set coexisted with zero working spawns for a milestone. `guard_wr05` passed the entire time.
**Do instead:** a **captured live run** — which is also GAP-D1, the project's oldest open item.

### Anti-Pattern 7: A partially-generated board
**What people do:** generate the ticket rows into a hand-authored `board.md`.
**Why it's wrong:** a half-generated file has ambiguous authority and no clean freshness gate.
**Do instead:** fully authored (v2.1, with `conflicts[]` for visibility) or fully generated (later, with `freshness:board`). Not both.

---

## Integration points

### Internal boundaries

| Boundary | Communication | Notes |
|---|---|---|
| `board-model` ↔ `context-io` | direct import (`readContext`, `parseNote`) | must stay side-effect-free on import; verify the `isMain` guard pattern holds |
| `board-model` ↔ `claim` | direct import | export the `claim.md` row extraction currently inlined in `renderNowRunning:277-302`; keep the tamper discipline, change only the *response* (surface vs skip) |
| `board-model` ↔ `trace-render` | import `buildRows(contextRoot):125` | read the **source** (notes), never the rendered `traceability.md` |
| `board-dashboard` ↔ `board-model` | `readSnapshot()` + a pure `render()` | the renderer never touches `fs` — that purity **is** the web seam |
| `validate-agent-factory` ↔ `board-model` | import `parseBoard` | inline parser deleted; must be identity-preserving — the WR-03 full-segment match at `:423-428` is hard-won; port, do not redesign |
| `kit-model` ↔ everything | import | replaces 5 hard-coded lists |
| hooks ↔ `autonomy-model` | import `floorStatus` | hooks reconstruct **no** composition locally (the GOV-01 discipline) |
| `install`/`uninstall` ↔ adapter set | derived list | `install.ts:481-490,792-795,1286-1301`; `uninstall.ts:88,433-441` must remove exactly what install added |

### External surfaces

| Surface | Integration | Gotchas |
|---|---|---|
| `fs.watch` | Node 22 stdlib, `recursive: true` | platform-divergent; Windows CI leg currently red; atomic renames surface as `rename` not `change`; **always keep the poll floor** |
| Claude Code `Agent` tool | frontmatter grant | a parenthesized allowlist is honored only for the **main-thread** agent — `subagent.frontmatter.md:100-104` documents that a *spawned* subagent's nested list is ignored. Do not design nested scoping on it |
| Claude Code PreToolUse | `hooks/hooks.json` | two matchers today (`Bash`, `mcp__grugops__.*`). A floor lowering needing a **new** tool surface needs a **new matcher**, not a widened one |
| Session env | human-exported | the entire un-forgeability argument; hook parentage is the mechanism |

---

## Build sequence

Ordered by hard dependency, then by risk-reduction value.

### Phase A — Kit-set authority + guard scan derivation *(no dependencies; unblocks B)*
`kit-model.ts`; re-point `validate-agent-factory.ts:118-161`, `check-foundation-guards.ts:282-300,593-610`, `generate-catalog.ts:110-112,154-156`; derive `WR05_SCAN`, `ADAPTERS`, and `check-kit-refs.ts`'s SCAN literal.
**Immediately fixes three already-stale lists** (5 workflows unvalidated; 3 unguarded by `guard_context_writes`; `frontend-ui` unvalidated). Small, mechanical, high leverage. `roleCeiling()`'s 17-case switch will need a policy for a genuinely new role — keep the fail-red-on-unknown at `:540-542`; it is correct.

### Phase B — Spawn path *(depends on A)*
`generate-role-adapters.ts`; purge and regenerate `grugops-orchestrator.md` (kills the `:25` handoff text structurally); `adapters-freshness.ts`; `guard_wr05` name-resolution cross-check; `guard_adapter_body`; install/uninstall derived list. Land **before** the controlled-language/STE work so the STE role rewrite regenerates adapters once rather than fighting a hand-maintained set.

### Phase C — Captured live run / GAP-D1 *(depends on B)*
The proof, not a suite. Resolves the project's oldest open item, carried since v1.0.

### Phase D — Board model *(independent of A–C; parallelizable)*
Pin the row grammar in the seed; `board-model.ts` + parse oracle + fuzz corpus; delete the validator's inline parser; add row↔frontmatter `conflicts[]`; fold the four-way `cell()` duplicate into one module.

### Phase E — Dashboard *(depends on D)*
Root resolution; poll floor + `fs.watch` optimization; read-verify-reread; the degrade table; ANSI renderer; `--json`; `--once`. Touches Windows — sequence it with, or after, standing obligation #2 (the red `windows-latest` leg), since both hit `fs.watch` and path normalization.

### Phase F — Autonomy matrix *(no hard dependency; sequence after D, alongside E's banner)*
Enumerate the 17 `## Stop conditions` + role `## Hard limits` into checkpoint ids; `autonomy-model.ts` + floor registry + claim ids; config schema **and** validator in one commit (the `typeof === "string"` break at `:310-314`); widen `guard.ts:88` `SELF_APPROVE` + fuzz it; hook branches; `emitVerdict` point-of-effect for `test_integrity`; `appendAuditLedger` event; dashboard banner.

**Rationale:** A is a prerequisite for B and pays for itself immediately. B+C are the milestone's headline defect and its proof. D and E share no code with A/B and are genuinely parallelizable. F is last because it touches the most surfaces (config, validator, both hooks, `emitVerdict`, the ledger, the dashboard) and benefits from D's snapshot type and E's renderer already existing.

**Cross-cutting:** every phase adds committed `.js` under `scripts/` or `hooks/`, which `freshness.ts:43` `OUTPUT_DIRS` already covers — no gate wiring needed for the build-output check. New *domain* freshness gates (`freshness:adapters`) follow the standalone D-07 precedent and get their own `package.json` script, **not** a slot in `check-foundation-guards.ts`.

---

## Open questions for the roadmapper

1. **Board Option B timing.** Generated `board.md` + `freshness:board` is the doctrine-pure end state with four in-repo precedents. Recommended **out** of v2.1 — confirm, and record it as a v2.2 candidate so `board-model.ts` is designed to host `renderBoard()` in the same module.
2. **`test_integrity` floor mechanism.** The `emitVerdict` point-of-effect move is a change to a byte-frozen safety path (`context-io.ts:881`) and deserves its own red-team round rather than being bundled into F.
3. **Public claim ids.** `claim_dropped` needs a registry of the public safety claims in `README.md` / `AGENTS.md` / `agent-factory/README.md`. Enumerating them is a small standalone task and a natural companion to the kit consistency audit.
4. **Dashboard on non-Claude-Code hosts.** It is a plain Node process, so it runs anywhere Node 22 does — but it renders floors whose *enforcement* is Claude-Code-only. The banner must state the host's enforcement tier, or a Codex user reads "floor held" and gets only a procedural guarantee. Needs a wording decision.
5. **`orchestrator.md` size (standing obligation #3).** 7562 B against a 7165 B WARN (`check-foundation-guards.ts:489`). Capability 3 adds checkpoint-matrix text to it. Generation does not help — the *role file* is not generated. Trim or split before F lands.

---

## Confidence

| Area | Level | Basis |
|---|---|---|
| Existing board-parse surface | **HIGH** | grepped repo-wide; exactly one parser, `validate-agent-factory.ts:419-443` |
| Set-list drift (14/19, 16/17, 16/19) | **HIGH** | list contents read; directories counted |
| Spawn defect (7 granted, 0 exist) | **HIGH** | frontmatter read; `.claude/agents/` listed |
| Handoff text in the materialized adapter | **HIGH** | `:24-26` read verbatim; template at `:50-51` diverges |
| Env-var forgeability asymmetry | **HIGH** | mechanism documented in-repo at `admission-guard.ts:22-33`; the parentage reasoning follows directly |
| Snapshot shape | **MEDIUM** | designed here; unvalidated against a real renderer. Expect field churn — hence `schemaVersion` |
| `fs.watch` on Windows | **MEDIUM** | platform-divergent by documentation; the repo's Windows leg is currently red — **`UNKNOWN - verify` on the box** |
| Board row grammar in the wild | **LOW** | only two comment examples exist and they disagree on metadata keys. What agents *actually* write is unmeasured — **sample a real run before freezing the grammar** |

## Sources

- Repo files read this session: `scripts/validate-agent-factory.ts`, `scripts/check-foundation-guards.ts`, `scripts/generate-catalog.ts`, `scripts/claim.ts`, `scripts/trace-render.ts`, `scripts/freshness.ts`, `scripts/now-running-freshness.ts`, `scripts/context-io.ts` (export surface), `scripts/check-kit-refs.ts`, `hooks/guard.ts`, `hooks/admission-guard.ts`, `hooks/hooks.json`, `install/install.ts`, `install/uninstall.ts` (refs), `agent-factory/seed/plans/board.md`, `agent-factory/config/factory.config.json`, `agent-factory/config/factory.config.md`, `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/adapters.md`, `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `package.json`, `agent-factory/workflows/*.md` (`## Stop conditions` enumeration) — HIGH, primary
- `.planning/PROJECT.md` — v2.1 milestone scope, the two ratified constraint changes, the measured kickoff findings, the five standing obligations, and the v2.0 terminal lesson — HIGH

---
*Architecture research for: grugops v2.1 — Autonomous Factory: Real Spawning, Controlled Language & Live Board*
*Researched: 2026-07-28*
