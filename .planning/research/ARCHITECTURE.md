# Architecture Research: how v3.0 fits the existing grugops architecture

**Domain:** a file-based agent factory (markdown kit plus a TypeScript tooling layer compiled to committed `.js`) installed on top of six host coding-agent CLIs
**Milestone:** v3.0 "Specialist agents. Shared context. Coordinated work."
**Researched:** 2026-10-20
**Confidence:** HIGH for integration points and counts (read and measured on this tree, commit `2057ecb8`, and read-only on the dogfood repo). MEDIUM for the recommended designs, which are judgment. Host-platform facts from the web are LOW by the classify-confidence seam and are marked where they carry weight.

All counts below were measured with `grep -a` over `git ls-files` minus `.planning/` (1,171 tracked files). They were not estimated.

---

## 1. System overview: today vs v3.0

```
                         TODAY (v2.2.0)                                    v3.0 TARGET
┌───────────────────────── KIT (read-only, $GRUGOPS_HOME/agent-factory) ─────────────────────────┐
│ roles/ 17 + _role-switch-protocol      ──►  roles/ 19 (+tech-lead, +designer) + protocol        │
│   frontmatter: kind tier capabilities  ──►  + levels: (engineer only), + skills:                │
│   "## Caveman prompt" fence x17        ──►  removed; plain English; total bytes <= 67,383 B      │
│ workflows/ 19 (00..18)                 ──►  19 (WF17 gains flow control: refill/close/compact)  │
│ contracts/board.md (grammar)           ──►  board = overview grammar + budgets; new state-layout │
│ seed/plans/**, seed/memory-bank/**     ──►  seed/memory-bank/plans/** (nfr/, traceability/ dirs) │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────── GENERATORS / AUTHORITIES (grugops repo, compiled .js, freshness-gated) ─────────┐
│ kit-model.ts  listRoles ROLE_COUNT=17  ──►  ROLE_COUNT=19 + listAgentAdapterNames() (role→N)   │
│ model-tiers.ts TIERED (17 rows)        ──►  TIERED (19 rows) + LEVELS (3 rows) authority        │
│ generate-role-adapters.ts 1 role→1 ad. ──►  1 role→1..3 adapters; emits skills:                 │
│ generate-catalog.ts docs/catalog/README──►  + docs/reference/agents/*.md, skills/*.md           │
│ (none)                                 ──►  NEW install/state-layout.ts (paths + budgets)        │
│ trace-render.ts → plans/traceability.md──►  per-ticket files + index                             │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────── STATE (per host repo) ─────────────────────────────────────────────────────────┐
│ plans/board.md (718 KB in dogfood)     ──►  memory-bank/plans/board.md (one short line/ticket)   │
│ plans/traceability.md (1.9 MB)         ──►  memory-bank/plans/traceability.md (index) +          │
│                                             memory-bank/plans/traceability/<ID>.md              │
│ plans/nfr-catalog.md (369 KB)          ──►  memory-bank/plans/nfr-catalog.md (index) +           │
│                                             memory-bank/plans/nfr/NFR-xxx.md                    │
│ plans/tickets/*.md (up to 238 KB each) ──►  memory-bank/plans/tickets/*.md (+ budget)            │
│ .grugops/queue/{pending,claimed,done}  ──►  unchanged; claimed/ IS the in-flight log             │
│ .grugops/context/<task>/ (40 MB)       ──►  unchanged; finished folders MOVE to context-archive/ │
│ tools/grugops/*.js (4 runnables)       ──►  + tools/grugops/state-check.js (budgets on host)     │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component responsibilities that matter for v3.0

| Component (file) | Owns today | v3.0 change |
|---|---|---|
| `scripts/kit-model.ts` | The one authority for role, workflow and adapter sets; `ROLE_COUNT=17`, `WORKFLOW_COUNT=19`, `SPAWN_GRANT_SCAN_COUNT=33`, `INVARIANT` and `RESOLVER` text | Count bumps; new role-to-adapter-name expansion; `INVARIANT` text loses `plans/` |
| `scripts/model-tiers.ts` | `TIERED` table (17 rows, `MODEL_TIERS_COUNT = ROLE_COUNT`), `resolveModels` / `resolveEfforts`, `readModelsConfig` | +2 rows; new `LEVELS` table for engineer levels; dial keys accept level stems |
| `scripts/generate-role-adapters.ts` | One `.claude/agents/grugops-<stem>.md` per role; coordinator grant = all other adapter names | One role can emit several adapters; emits `skills:` |
| `scripts/check-foundation-guards.ts` (4,248 lines) | 15 guards incl. `guard_caveman_voice`, `guard_voice`, `guard_role_size` (`roleCeiling()` switch), `guard_referential_integrity`, `guard_model_assignment`, `guard_kit_counts` | Retire or invert voice guards; recompute ceilings; referential integrity becomes role→N |
| `scripts/board-model.ts` / `scripts/board-read.ts` | The ONE board grammar (Phase 32) and the read-only projector; `FIXED_SUBPATHS` (`board-read.ts:480`) | New paths; board becomes overview-only; reads per-ticket trace |
| `scripts/trace-render.ts` / `scripts/trace-freshness.ts` | Render `plans/traceability.md` from note refs; byte-compare freshness | Per-ticket files + index; archive root also read |
| `scripts/validate-agent-factory.ts` | Kit structure checks + state checks (`plans/board.md` etc., `checkTickets`) | New paths; per-file budgets; no `## Caveman prompt` section |
| `install/install.ts` (8,040 lines) | Seed walk of `seed/**` (`seedState`, line 5574), `--migrate` (config carry, in-repo kit backup, `plans/handoffs` backup), doctor `--check`, `RUNNABLES` (line 5616) | New migrate arm for the v3 state layout; refuse plain install on old layout; `memory-bank` added to protected dirs; one more runnable |
| `scripts/claim.ts` | Queue `pending/claimed/done`, `renderNowRunning` → `.grugops/queue/now-running.md` | No code change required; `claimed/` becomes the documented in-flight log |

---

## 2. State layout: who owns it today, and what each owner must change

### 2.1 Measured reference counts for `plans/`

Regex `(^|[^A-Za-z0-9_.-])plans/` (so `.planning/` and `phase-plans/` do not match):

| Area | Files | Occurrences | Note |
|---|---:|---:|---|
| **All tracked files outside `.planning/`** | **336** | **1,293** | |
| `agent-factory/` total | 45 | 242 | the shipped kit |
| — `agent-factory/roles/` | 17 | 106 | every role except `_role-switch-protocol.md`; most in `factory-coach.md` (12), `incident-responder.md` (9) |
| — `agent-factory/workflows/` | 19 | 107 | all 19 |
| — `agent-factory/contracts/` | 1 | 12 | `board.md` |
| — `agent-factory/packaging/`, `checklists/`, `seed/` | 2 / 2 / 2 | 6 / 2 / 5 | seed board and traceability comment blocks |
| — `agent-factory/README.md`, `writing-profile.md` | 1 / 1 | — | |
| `.claude/agents/` (generated) | 17 | 31 | the `INVARIANT` line in all 17, plus the coordinator body (`generate-role-adapters.ts:530`) |
| `.claude/skills/` + `skills/` (generated twins) | 7 + 7 | 13 (skills/) | `INVARIANT` |
| Root `AGENTS.md`, `CHANGELOG.md` | 2 | — | AGENTS.md lines 18, 38, 43, 93, 95, 155 |
| `docs/` | 14 | 284 | 11 under `docs/audit/` (history; do not rewrite), `docs/audit/28-claim-registry.md` has **9** lines citing `plans/` |
| `examples/` | 5 | 22 | |
| repo's own `plans/` | 2 | 5 | |
| TypeScript sources (non-test) | 14 | 133 | each has a committed `.js` twin (14 more files) |
| TypeScript tests | 23 | — | |
| `scripts/fixtures/` (md) | 183 | — | mostly full kit copies inside 11 validator fixture trees |

TypeScript sources by occurrences: `scripts/board-read.ts` 25, `install/install.ts` 22, `scripts/board-model.ts` 18, `scripts/validate-agent-factory.ts` 13, `scripts/check-banned-claims.ts` 12, `scripts/trace-freshness.ts` 11, `scripts/board-dashboard.ts` 10, `install/uninstall.ts` 10, `scripts/trace-render.ts` 4, `scripts/board-corpus.ts` 3, `scripts/check-imperative-lexicon.ts` 2, `scripts/kit-model.ts` 1 (`INVARIANT`), `scripts/generate-role-adapters.ts` 1, `install/kit-source.ts` 1. Many TS hits are comments and messages. The **load-bearing literals** are fewer:

- `scripts/board-read.ts:480-487` `FIXED_SUBPATHS` (`board`, `tickets`, `traceability`)
- `scripts/validate-agent-factory.ts:316-319` (required state files) and `:718-731` (`checkTickets`)
- `scripts/trace-render.ts` `DEFAULT_PLANS_ROOT` + `join(plansRoot, "traceability.md")`; `scripts/trace-freshness.ts` `PLANS_ROOT`, `relPath`
- `scripts/board-corpus.ts:158-159` (`KIT = "plans/board.md"`, `SEED = "agent-factory/seed/plans/board.md"`)
- `scripts/check-banned-claims.ts:916-917` (root-exclusion `"plans/"`, `"memory-bank/"`)
- `install/install.ts:2409` (doctor requires `plans/board.md`), `:3089` (`plans/handoffs` backup), `:3212` protected dirs
- `install/uninstall.ts:399` protected dirs (`["agent-factory", "plans", ".planning", ".grugops", "docs", "src"]`; **`memory-bank` is not in this list** today), `:606`, `:2883`
- `scripts/kit-model.ts:282` `INVARIANT` and `scripts/generate-role-adapters.ts:530`

Tracked files that live under a `plans/` directory: **79** (9 under `agent-factory/seed/plans/`, the repo's own `plans/`, and the rest fixtures).

### 2.2 The dogfood evidence (read-only, `cli-chess-example`)

| File | Size | What fills it |
|---|---:|---|
| `plans/board.md` | 717,788 B | 180,054 B of `_Updated:` lines before the columns (491 lines), **537,734 B in 173 ticket rows** (average 3.1 KB, max 34,494 chars). The rows are the larger problem, not the changelog. |
| `plans/traceability.md` | 1,893,270 B | 615 table rows over 180 distinct IDs; max line 58,647 chars. **Hand-appended by agents** ("ONE ROW APPENDED"), not the generated render: `scripts/trace-render.js` does not exist on host repos. |
| `plans/nfr-catalog.md` | 369,116 B | 10 NFR table rows plus 83 `##`/`###` commentary sections ("NOT ONE BYTE OF THE TABLE ROW WAS TOUCHED…") |
| `plans/tickets/` | 6.0 MB, 167 files | Largest ticket 238,187 B. **Moving blocked reasons into tickets without a ticket budget moves the bloat, it does not remove it.** |
| `memory-bank/60-progress.md` | 90,525 B | unbounded today |
| `memory-bank/50-decisions/` | 1.1 MB, 46 ADRs | unbounded today |
| `.grugops/queue/done/` | 6.2 MB, 1,128 files | never archived; 439 are hand-made `*.claim.md` files |
| `.grugops/context/` | 40 MB, 711 task folders | stays as is per the milestone; archive is move-only |
| `AGENTS.md` (host) | 24,343 B | close to Codex's 32 KiB cap |

The `_Updated:` lines carry "In flight: …" text. **The Orchestrator used the board as its in-flight log.** That is the root cause of the changelog, and it means area 4 (flow) and area 2 (state) are one design problem.

### 2.3 Required changes per owner

| Owner | New or modified | Change |
|---|---|---|
| **`install/state-layout.ts`** | **NEW** | The single authority for state paths and budgets: `STATE_ROOT_REL = "memory-bank/plans"`, every fixed subpath (`board.md`, `tickets/`, `traceability.md`, `traceability/`, `nfr-catalog.md`, `nfr/`, `metrics.md`, `epics/`, `features/`, `sprints/`, `releases/`, `uat/`, `archive/`), and the per-file budgets. Put it under `install/` on the `install/host-tools.ts` precedent (scripts already import `../install/host-tools.js`; install.ts imports only `install/*`). It must be **constants only, with no imports**. `board-read.ts` keeps a strict import closure enforced by `scripts/board-readonly.test.ts` (DASH-06), so the module has to qualify for the same exception `canonical-frontmatter.js` holds. Pin the subpath count two-sided ("derive the set, assert the count"). |
| `agent-factory/seed/` | MODIFIED | Move `seed/plans/**` to `seed/memory-bank/plans/**`. `seedState()` walks `seed/**` relative to the target, so the target path follows without installer code. Add `seed/memory-bank/plans/nfr/.gitkeep` and `traceability/.gitkeep`. Rewrite the seed `board.md` comment block (overview rule, budget, no `In flight:` text) and the seed `traceability.md` / `nfr-catalog.md` as indexes. |
| `agent-factory/contracts/board.md` (37,708 B) | MODIFIED | Contract first (the board-model header says a grammar change is "a decision recorded in the contract first"). New rules: one row = `- [ID] title  (owner, since)`, a trailer budget well below today's `MAX_META_CHARS = 1_024` reader cap (`board-model.ts:81`), at most one `_Updated:` line, no in-flight text. Today's `LARGE_BOARD_BYTES`/`LONG_LINE_CHARS` are **reader bounds that report and never refuse**. Keep them that way. Budgets are a separate validator fact and must not be welded onto the reader. |
| `scripts/board-model.ts` | MODIFIED (small) | Path strings in messages (`spelled\`plans/tickets/...\``, 18 sites) come from state-layout. `SCHEMA_VERSION = 2` moves only if the snapshot shape changes (for example a trace source that is now a directory). |
| `scripts/board-read.ts` | MODIFIED | `FIXED_SUBPATHS` comes from state-layout (or stays literal with an equality test against state-layout). The `traceability` source becomes the index plus `traceability/<ID>.md`. `SOURCE_NAMES`/`SOURCE_COUNT = 6` is a closed tuple ("a seventh joined source is a decision"), so add per-ticket trace as a change inside the `traceability` source, not as a seventh source. Note: the `config` source reads `agent-factory/config/factory.config.json`, not `.grugops/factory.config.json`. Unrelated to v3.0 but adjacent; check it during this edit. |
| `scripts/board-dashboard.ts` | MODIFIED (messages) | 10 path mentions; derives its watch directories from the source paths (`:800-829`), so a moved board changes the watched dir set. Re-run the watch tests. |
| `scripts/trace-render.ts` | MODIFIED | `renderTraceability` writes `traceability/<ID>.md` per row plus a generated index `traceability.md` (ID, status, link). `listTasks` must also read the context-archive root, or archiving a finished folder silently drops that ticket's rows. |
| `scripts/trace-freshness.ts` | MODIFIED | Byte-compare a directory (index + every per-ticket file, two-sided set equality), not one file. |
| `scripts/validate-agent-factory.ts` | MODIFIED | Required state files from state-layout; `checkTickets` reads the new ticket dir and the per-ticket trace (today it checks `trace.includes(id)` against one file); **new budget check** per state file from state-layout. Remove `"## Caveman prompt"` from `ROLE_SECTIONS` (`:237`). |
| `scripts/board-corpus.ts` | MODIFIED | `KIT`/`SEED` literals. |
| `scripts/check-banned-claims.ts` | MODIFIED | Root exclusions `memory-bank/` and `plans/` (`:916-917`): `plans/` becomes dead once the repo's own state moves. |
| `scripts/kit-model.ts` `INVARIANT` | MODIFIED | Text becomes `` `memory-bank/`, `.grugops/` = STATE ``. This one constant is byte-identical in 17 agent adapters, 7 `.claude/skills/*/SKILL.md`, 7 `skills/*/SKILL.md` and 2 packaging files, and it is mirrored in `AGENTS.md` § Kit vs state and in `orchestrator.md` line 7. One edit, then `generate:adapters`, `generate:skill-twins` and the freshness gates. |
| `install/install.ts` | MODIFIED | (a) doctor ref `:2409` → new board path; (b) **plain install on an old-layout repo must refuse to seed state** and print the `--migrate` command, or `seedState` lays a second, empty board beside the old one; (c) new migrate arm (section 2.4); (d) protected dirs gain `memory-bank`; (e) `RUNNABLES` gains `state-check.js`. |
| `install/uninstall.ts` | MODIFIED | Protected dirs gain `memory-bank` (`:399`); `RUNNABLES_MIRROR` gains the new runnable (the "edit the two together" rule at `install.ts:5611-5614`). |
| **`scripts/runnable-ref/state-check.ts`** → `tools/grugops/state-check.js` | **NEW** | Budget enforcement **on host repos**. This matters because host repos get no `scripts/`: `~/.grugops` holds only `agent-factory/`, and the materialized runnables are only `reference-check`, `test-skip-integrity`, `uat-spec-integrity`, `host-protection`. The validator never runs there today. Runnables are single-file and import only `node:` builtins, so the budget numbers must be **generated into a marked region** of the runnable from `install/state-layout.ts` and freshness-checked. This is the same pattern `scripts/generate-hook-manifest.ts` uses for `hooks/hook-entry.ts`'s `DECIDER_MANIFEST`. Hand-copying the numbers would be set-literal drift. Invoked by WF09 (daily sweep) and WF05 (gate) with the same exit contract as the other runnables (0 / 1 / 2, exit 2 never a pass). |
| `AGENTS.md` + `docs/audit/28-claim-registry.md` | MODIFIED | AGENTS.md claims C-28-012, C-28-015, C-28-016 and C-28-020 and README C-28-033 cite `plans/`. `scripts/check-claim-anchors.ts` requires claim text to be **byte-identical** at the anchor, so registry rows change in the same commit. `guard_agents_bytes` still caps AGENTS.md. |
| 17 roles, 19 workflows, 2 checklists, packaging, `agent-factory/README.md`, `examples/` (5) | MODIFIED | Path rewrite. Roles are rewritten wholesale in area 1, so do not edit role paths twice (build order, section 8). |
| `scripts/fixtures/**` | MODIFIED | 70 tracked fixture files under a `plans/` dir. The 11 validator fixture trees each carry a 17-role copy (**187 role files**). Every role or path change has to regenerate them. |
| repo's own `plans/`, `memory-bank/` | MODIFIED | Move to `memory-bank/plans/` (dogfood the layout on grugops itself). |

### 2.4 `install --migrate` for the v3 layout

The existing `--migrate` (`install.ts:6342+`) is an "old in-repo layout → two-root" migration with three arms: config carry (`migratePreSteps`, `:3513`), in-repo `agent-factory/` backup, and `plans/handoffs/` backup (`migrateHandoffs`, `:3088`). It is whole-or-nothing ("changes a target whole or not at all", `:6385`) and runs a pre-check before the first write. **Add a fourth arm, "v3 state layout", in a new module `install/state-migrate.ts`.** That module holds pure plan functions; install.ts only executes the plan and records ledger entries. install.ts is 8,040 lines, and a split-and-conserve algorithm should be unit-testable on its own.

Arm design (MEDIUM: recommendation):

1. **Pre-check (no writes):** detect `plans/board.md` with no `memory-bank/plans/board.md`; refuse if the destination exists and is not empty; refuse if `plans/` is a symlink or holds special files (reuse `install/user-file.ts` `readUserFile`).
2. **Move** `plans/` → `memory-bank/plans/` with one `renameSync`. Report `would-move` under `DRY_RUN`.
3. **Split, additively.** The monolith originals move **unchanged** to `memory-bank/plans/archive/pre-v3/`, and the split outputs are new files. Nothing is deleted or rewritten in place, which keeps "never overwrite or delete user content" literally true.
   - Board: header plus columns with each row cut to the overview shape. The cut trailer text is appended to that ticket file under `## Board notes (migrated)`, or to `archive/` when no ticket file exists. `_Updated:` lines go to `archive/pre-v3/board-updates.md`.
   - Traceability: group rows by the ticket ID in the first cell → `traceability/<ID>.md`. Rows with no ID and prose blocks → `traceability/_unassigned.md`. Then a fresh index.
   - NFR: each `| NFR-xxx |` row plus its following `## NFR-xxx …` / `### …` sections → `nfr/NFR-xxx.md`. Leftover sections (for example "Availability — why this catalog has NO availability row") → `nfr/_notes.md`. Then the index.
4. **Byte-conservation proof.** The multiset of non-blank input lines must equal the multiset of output lines plus the generated index lines. Refuse and roll back the split (keep the move) on mismatch. This is the "derive, assert the count" rule applied to data. A splitter fed hand-written prose will meet shapes nobody listed, and the conservation check is what turns a missed shape into a loud refusal instead of a silent loss.
5. **Context archive:** move-only, opt-in (`--archive-done-context`), keyed on task folders whose ticket is in `## Done`. `trace-render` and the board projector must read both roots first (section 2.3).

Dogfood the arm on a **copy** of `cli-chess-example` with `GRUGOPS_HOME` set to a scratch path. Without `GRUGOPS_HOME`, an install run overwrites the real `~/.grugops` kit.

---

## 3. Adapter generation: one role → three engineer levels, plus two new roles

### 3.1 How adapters are produced today (HIGH, read)

1. `generate-role-adapters.ts` calls `listRoles(ROOT)` (17 files), maps stem → `grugops-<stem>`, reads frontmatter `capabilities:` (closed vocabulary `read edit shell web plan admit` → tool names), and reads `## One job` + `## Activates when` for `description`.
2. `readModelsConfig(ROOT, stems)` reads `models` from `.grugops/factory.config.json` or `agent-factory/config/factory.config.json`. `resolveModels(stems, {preset, overrides})` / `resolveEfforts(...)` give one alias and one effort **per stem**. Preset `none` → `inherit`; preset `tiered` → the `TIERED` table (`model-tiers.ts:1017`, 17 rows with rationales, `MODEL_TIERS_COUNT = ROLE_COUNT`).
3. `render()` emits `name`, `description`, `coordinator: true` (orchestrator only), `tools`, `model`, `effort` (only when not `inherit`). The coordinator's `tools` = `Agent(<every other adapter name, sorted>)` + its own tools.
4. At install time, `install.ts` copies `GENERATOR_TWINS` (`:700`) into a temp dir and spawns the generator against the **user's** config (`:4495`), so the user's `models` dial shapes their adapters. Any new generator dependency joins `GENERATOR_TWINS`.
5. Other hosts get **no per-role adapters**. `scripts/generate-host-entries.ts` writes only the entry command or skill and one launch agent (`LAUNCH_SHAPES`: antigravity, opencode, copilot, pi). There, roles are loaded sequentially through `_role-switch-protocol.md`.

### 3.2 Smallest change for three engineer levels (MEDIUM: recommendation)

- **Role frontmatter** in `agent-factory/roles/software-engineer.md`: add `levels: junior mid senior`. Parsing uses `scripts/frontmatter.ts` `parseFrontmatter`, which already returns every occurrence (the generator refuses duplicates, as it does for `capabilities`). Role frontmatter is **not** under `CANONICAL_SCHEMA` (that schema governs adapter/skill frontmatter), so the new key needs no canonical-schema change.
- **`model-tiers.ts`: new `LEVELS` table**, the only place level → alias/effort/rationale lives: `junior → haiku`, `mid → sonnet`, `senior → opus`, each with an effort and a rationale, in the `TIERED` row style, with `LEVEL_COUNT = 3` pinned two-sided. Hand-writing `model:` into a role or wrapper is the anti-pattern CLAUDE.md names. A resolver-owned table is the sanctioned route.
- **`kit-model.ts`: new `listAgentAdapterNames(kitRoot)`**, which returns the derived adapter-name set (`grugops-<stem>` or `grugops-<stem>-<level>`). Every consumer that today computes `` `${AGENT_PREFIX}${stem}` `` switches to it: `guard_referential_integrity` (`check-foundation-guards.ts:3667`, "role corpus == adapter directory == coordinator grant closure"), `guard_model_assignment` (`:1987`, which compares adapter count to stem count and fails on a mismatch), `guard_effort_assignment`, `adapter-byte-baseline.test.ts`, and the generator itself. Do not leave a base `grugops-software-engineer` adapter: a fourth name for the same role is a second answer to one fact.
- **Generator:** for a role with `levels`, emit one adapter per level. The body gets one generated level line (for example "Work at the junior level: see `## Levels` in the role file."). The model and effort come from `LEVELS` unless `models.roles["software-engineer-junior"]` overrides them, so `readModelsConfig` must accept the expanded stem set as legal keys.
- **Role body:** one `## Levels` section in `software-engineer.md` that says what each level may take on (for example XS/S → junior, M → mid, L or cross-cutting → senior). That keeps the text single-source. Adapters stay pointers.

**Decision the roadmap must record:** MODEL-01 (Phase 29.1) says zero-config adapters are byte-identical to the pre-phase baseline, and `scripts/adapter-byte-baseline.test.ts` enforces exactly that. It asserts the working adapter set equals the set pinned at a 40-char commit, `count == ROLE_COUNT` (`:272-278`, `:335-345`), and that **no committed adapter carries an `effort:` line at zero config** (`:358-367`). Level adapters carry pinned models and efforts even at zero config, because the levels exist to differ. So MODEL-01 must be amended by recorded decision and the baseline re-pinned. It must not be "fixed" by loosening the test.

**`UNKNOWN - verify`:** whether `effort` applies to haiku. The Claude Code docs say "available levels depend on the model" (code.claude.com/docs/en/sub-agents, fetched 2026-10-20; seam tier LOW). If haiku ignores or rejects effort, the junior adapter should omit the line.

### 3.3 Tech Lead and Designer as new roles: what must follow (HIGH, measured)

Adding `tech-lead.md` and `designer.md` takes `ROLE_COUNT` 17 → 19. With engineer levels, agent adapters go 17 → **21** (18 one-to-one + 3 levels) and the coordinator grant goes 16 → **20** names.

| Must change | Where | Today → v3.0 |
|---|---|---|
| `ROLE_COUNT` | `scripts/kit-model.ts:107` | 17 → 19 |
| `SPAWN_GRANT_SCAN_COUNT` | `kit-model.ts:183` (17 agents + 7 skills + 7 plugin skills + 2 packaging) | 33 → 37; per-part membership assertion in `guardKitCounts` |
| `TIERED` rows | `model-tiers.ts:1017` | 17 → 19 (+ the new `LEVELS` 3); `tieredCorpusRefusals` compares the table to the corpus |
| `roleCeiling()` switch | `check-foundation-guards.ts:3421` | **hand-listed 17 cases**; "unknown role" fails. Add 2, and recompute every ceiling for the plain-language rewrite (section 4) |
| `TECHNICAL_NAMES_COUNT` | `check-imperative-lexicon.ts:865` | 76 → 78 (role display names from `# Role:` headings are derived; the pinned total moves) |
| `AUDIT_SET_COUNT` | `audit-prepass.ts:91` (= ROLE + WORKFLOW + 1) | 37 → 39 |
| `WATCHED_CORPUS_MIN` | `check-diff-disposition.ts:1461` | 36 → 38 (derived) |
| Coordinator adapter size | `.claude/agents/grugops-orchestrator.md` is 3,013 B; `AD_WARN = 3072`, `AD_FAIL = 4096` | about +110 B of grant names puts it **over WARN** (not FAIL); a `skills:` line adds more |
| Orchestrator routing matrix | `agent-factory/roles/orchestrator.md` (6,817 B; ceiling 7,570 / warn 7,165) | `code -> Software Engineer` becomes `size/plan -> Tech Lead; code -> Software Engineer (<level>)`; `design guidelines -> Designer` |
| Workflows | WF03 (epic→tickets) or WF04 (ticket→PR): Tech Lead step before dev; WF14 (ui-design-to-build): Designer before Frontend/UI | text only, no count change |
| Catalog | `docs/catalog/README.md` via `generate:catalog` + `freshness:catalog` | regenerated |
| Tests with literal `17` | 34 `toBe(17)`/`toHaveLength(17)` assertions in 16 test files (not all are role counts; check each) | rewrite to derive from `ROLE_COUNT` / `listAgentAdapterNames().length` |
| Validator fixtures | 11 trees × 17 role copies | regenerate |

Tech Lead output (MEDIUM): a `decision` note (an existing `NOTE_KINDS` member, `context-io.ts:69`) holding the complexity score, the chosen level and the dev-task plan, plus a short `## Tech Lead plan` section in the ticket file. **Do not add `level`/`complexity` to ticket frontmatter in v3.0.** `TICKET_KEYS` is a closed 8-key set with an `unknown-key` refusal (`board-model.ts:946-982`, "a change here is a decision recorded in the contract first"), and the board projector does not need the level to work.

---

## 4. Caveman retirement: where the voice is consumed and checked

### 4.1 Consumers (HIGH, read)

| Site | What it does | v3.0 action |
|---|---|---|
| 17 role files, `## Caveman prompt` fenced block | 2,805 B total (about 4 % of the 67,383 B role corpus) | delete the sections |
| `scripts/voice-model.ts` | `readCavemanFence`, `CAVEMAN_LEXICON`, `CAVEMAN_LEXICON_MIN`, `BANNED_CONSTRUCTIONS`, `segmentClauses`, `CLAUSE_MIN_WORDS` | **Do not edit this file.** `hooks/hook-entry.ts:266` pins the sha256 of `scripts/voice-model.js` in `DECIDER_MANIFEST`, because it is in the admission guard's import closure. Any edit forces `generate:hook-manifest` and touches the byte-frozen safety wrapper. `BANNED_CONSTRUCTIONS` is also imported by `check-imperative-lexicon.ts:210`, and `segmentClauses` by `guard_role_clause_uniqueness` and `check-diff-disposition.ts`. Change consumers only. |
| `check-foundation-guards.ts` `guardCavemanVoice` (`:3241`) | positive lexicon arm plus zero banned constructions inside each fence | delete the guard and its call (`:4207`) |
| `check-foundation-guards.ts` `guardVoice` (`:2930`), `EXPECTS_CAVEMAN_FENCE = new Set(ROLE_FILES)` (`:2817`) | clear-voice remainder must carry no caveman markers; a fence must exist on roles | **invert:** `EXPECTS_CAVEMAN_FENCE` becomes empty, so a fence on any role is a failure and the whole role body is scanned for lexicon markers. This proves the voice is gone instead of merely unchecked. |
| `check-foundation-guards.ts` `guardRoleSize` + `roleCeiling()` | per-file ceilings | recompute all; **add a corpus-total guard** (sum of derived role bytes ≤ 67,383 B, today's measured total over 18 files). The milestone budget is a total, and no per-file guard can express it. Whether the two new roles sit inside 67,383 B or the budget covers only the existing 18 is open (section 9). |
| `scripts/validate-agent-factory.ts:237` `ROLE_SECTIONS` | requires `## Caveman prompt` | remove the entry |
| `scripts/check-imperative-lexicon.ts:287-293` | excludes `agent-factory/roles/` because roles are "governed by guard_voice, guard_caveman_voice…" | **Recommend bringing roles into the writing-profile gate.** Without that, "plain language" has no decidable check, and the stated reason for the exclusion goes away with `guard_caveman_voice`. |
| `agent-factory/writing-profile.md` lines 8, 232, 303-306; "Governed surfaces" table | names the caveman fence as an excluded voice surface | rewrite; add role bodies as a build-time-gated surface |
| `scripts/check-diff-disposition.ts` + `docs/audit/29-style-dispositions/00-base.md` | every changed clause in roles + workflows since the recorded base needs a disposition row; frozen-set clauses need a same-commit companion | A full role rewrite changes every clause. **Re-base `00-base.md` by recorded decision** at the start of the rewrite, and keep the frozen safety clauses (hard limits) verbatim or companion-edited. Thousands of disposition rows would be noise. |
| `scripts/generate-catalog.test.ts:764` | assumes every role carries a fence | update |
| `scripts/adapter-byte-baseline.test.ts` | not caveman-coupled; affected by `INVARIANT` and new adapters (section 3.2) | re-pin by decision |
| 11 validator fixture trees (187 role copies) | the `good` fixture must pass `ROLE_SECTIONS` | regenerate |
| `CLAUDE.md` "Voice discipline" + "Constraints" | still says caveman voice in every role prompt | the PROJECT.md constraint is already revised (2026-10-20); CLAUDE.md drift is a known carried item |

The `guard_caveman_preserved` name appears only in comments; there is nothing to retire.

---

## 5. Orchestrator flow: where the in-flight log lives

**Recommendation (MEDIUM): the in-flight log is `.grugops/queue/claimed/`. No new file.**

- Each in-flight task already has exactly one record, `claimed/<task>/claim.md` (`by`, `at`, `task`), created by the atomic `mkdir` claim (`scripts/claim.ts:106`) and removed from `claimed/` by the `done` transition. It is **kept clean by construction**: closing an agent means transitioning its task to `done/`, and the log shrinks.
- `.grugops/queue/now-running.md` is already a generated, freshness-gated view of it (`renderNowRunning`, `claim.ts:277`; `freshness:queue`).
- **Refill rule:** free slots = `queue.wip_limit` − (number of `claimed/*/claim.md`). Spawn or claim that many from `pending/`, in board priority order (a started ticket outranks a new one, per orchestrator.md responsibility 2).
- **Close rule:** when an agent returns, transition its task to `done/` before anything else, then refill. Add optional `agent:` (host spawn handle, if any) and `level:` fields to `claim.md`. That is a contract change in WF17. `renderNowRunning` ignores unknown lines today, and its tamper rule rejects only multiple `at:` lines.
- **Compaction (~400k input tokens):** guidance only, per the milestone decision: record the in-flight state on disk (it already is the `claimed/` set), then compact, then re-read `claimed/` and the board. Claude Code has a subagent `autoCompactWindow` field (100,000–1,000,000 tokens; code.claude.com/docs/en/sub-agents, LOW by seam), but the milestone ruled out host-only mechanisms. Record it as declined, not as unknown.
- **Where the text goes:** extend `agent-factory/workflows/17-task-claim.md` (the orchestrator already defers "claim/schedule" there) with refill / close / compact steps. Do not add a workflow 19: a new workflow bumps `WORKFLOW_COUNT` and its derived consumers (`TECHNICAL_NAMES_COUNT`, `AUDIT_SET_COUNT`, checkpoints' stop-condition count in `scripts/checkpoints.ts`). `orchestrator.md` gets one pointer line and must stay under its ceiling.
- **Board relationship:** the board contract forbids in-flight text. The board holds column state; the queue holds who is working on it. The only join is the ticket ID in the subtask file.

**Gap that changes this design (`UNKNOWN - verify` on a live non-grugops host):** `scripts/claim.js` and `scripts/context-io.js` are not materialized into host repos. `RUNNABLES` holds 4 programs and a LICENSE, and `~/.grugops/` holds only `agent-factory/`. WF17 still says "via `scripts/claim.js` `claimTask`". The dogfood's 439 hand-made `done/*.claim.md` files show agents doing the protocol by hand. So the flow guidance has to be executable by hand (`mkdir`, `mv`), or `claim.js` has to become a runnable. On Claude Code the plugin's MCP admission server reaches `context-io.js` from the plugin root; on the other five hosts nothing does.

---

## 6. Skills per role

### 6.1 Declaration (MEDIUM: recommendation)

- **Role frontmatter key `skills:`**, space-separated like `capabilities:`, for example `skills: ui-ux-pro-max frontend-design` on `frontend-ui.md`. Frontmatter is machine-readable by the existing `parseFrontmatter`, the generator already reads role frontmatter, and keeping it out of the body keeps the byte budget for instructions. The body gets one sentence at most ("Use the skills listed in this role's frontmatter when the host has them").
- **Do not vendor third-party skills.** ui-ux-pro-max installs through its own `uipro-cli` (npm global) or a Claude Code plugin marketplace, lands in `.claude/skills/ui-ux-pro-max/`, and its search script needs Python 3 (LOW by seam; nextlevelbuilder/ui-ux-pro-max-skill docs). Shipping it would break "zero runtime dependencies installed".

### 6.2 Surfacing per host

| Host | Mechanism | grugops change |
|---|---|---|
| Claude Code | Subagent frontmatter `skills:` preloads the full skill content at startup (up to 32 names). It controls preloading only, not access. Skills with `disable-model-invocation: true` cannot be preloaded. A missing skill is skipped with a debug-log warning (code.claude.com/docs/en/sub-agents, fetched 2026-10-20; LOW by seam, vendor page). | Generator emits `skills:` per adapter. **`CANONICAL_SCHEMA` (`scripts/canonical-frontmatter.ts:196`) must admit `skills`**, because the canonical form refuses unknown keys (`unknown-key`), and the spawn-grant scan reads every adapter through it. The docs show a block YAML list. Whether the canonical grammar accepts a multi-line list or only a one-line flow list `[a, b]` is `UNKNOWN - verify`. Prefer the flow form if the grammar is line-based. |
| Codex, Antigravity, Copilot, Pi | No per-role adapters; roles are loaded sequentially. Each reads project skills from `.agents/skills/` (STACK.md, 34.1). | `_role-switch-protocol.md` step: "after loading a role, load each skill named in its `skills:` if the host lists it; otherwise continue and say so." Guidance only. |
| OpenCode | Project skills from `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` (opencode.ai/docs/skills, LOW by seam) | same protocol step |
| All | — | `install.js --check` (doctor) **WARNs** for each declared skill not found in the host's skill dirs, never installs it and never FAILs: a missing optional skill is not a broken install. Skill reference pages come from the catalog generator (section 7). |

The 7 shipped grugops skills (`.claude/skills/grugops-*`, `skills/*`, `.agents/skills/grugops`) are **entry commands**, not role skills. Keep them separate: `SKILL_ADAPTER_COUNT = 7` / `PLUGIN_SKILL_ADAPTER_COUNT = 7` do not move for role skills.

---

## 7. Story and layered docs

- Existing: `docs/catalog/README.md`, generated by `scripts/generate-catalog.ts` (roles plus workflows) and gated by `freshness:catalog`; `docs/GUARANTEES.md` (generated); `docs/faq.md`; root `README.md`.
- **Modify `generate-catalog.ts`** to also emit `docs/reference/agents/<stem>.md` (one per role, with its levels and skills from frontmatter) and `docs/reference/skills/<name>.md` (one per declared skill, listing the roles that use it and the host install note). These are generated, so they are freshness-gated by the existing gate, and the "links to every agent and skill page" requirement is checked rather than promised.
- **New hand-written pages** (how it works, core concept, usage flows, examples) join the public-docs scan of `scripts/check-public-docs-vocabulary.ts`. That scan has a two-sided `PUBLIC_DOCS_SCAN_COUNT` pin, so it moves. Any claim moved between README/AGENTS.md and the new pages must keep its `<!-- claim: C-28-0xx -->` anchor and registry row byte-identical (`check-claim-anchors.ts`).
- Do the docs last: they describe the final roles, levels, skills and state layout.

## 8. Graph-memory spike

Decision only, no build. The integration constraint for the decision record: any graph would have to be a **derived, regenerable index** under `.grugops/` with a freshness gate, like `.grugops/context/<task>/index.jsonl` (byte-reproducible, `freshness:context`). It could never be a source of truth, because "the shared verified context is the memory" and "a database stays out of scope". The spike does not block other work. Run it early so that, if it recommends a derived index, the state-layout authority can reserve the path.

---

## 9. Data-flow changes

```
TODAY                                              v3.0
System Analyst → ticket                            System Analyst → ticket
Orchestrator → "code -> Software Engineer"         Tech Lead → decision note (score, level, dev tasks)
  writes "In flight: …" into board _Updated:          + ticket "## Tech Lead plan"
Software Engineer → notes; board row grows         Orchestrator → claim → grugops-software-engineer-<level>
  (meta/trailer text, blocked reasons)               in-flight = .grugops/queue/claimed/ (no board text)
Every role appends a row to plans/traceability.md  role → memory-bank/plans/traceability/<ID>.md
Security/NFR appends commentary to nfr-catalog.md  Security/NFR → memory-bank/plans/nfr/NFR-xxx.md
nothing checks sizes on the host                   WF05/WF09 run tools/grugops/state-check.js (budgets)
                                                   board row = one short line; detail in ticket file
```

---

## 10. New vs modified components

**New**
- `install/state-layout.ts` (constants-only authority for paths and budgets) + test
- `install/state-migrate.ts` (pure split / conserve plan for the v3 migrate arm) + test
- `scripts/runnable-ref/state-check.ts` → `tools/grugops/state-check.js` (generated budget region + freshness gate, on the `generate-hook-manifest` pattern)
- `agent-factory/roles/tech-lead.md`, `agent-factory/roles/designer.md`
- `LEVELS` table in `scripts/model-tiers.ts`; `listAgentAdapterNames()` in `scripts/kit-model.ts`
- A corpus-total byte guard in `check-foundation-guards.ts`
- `docs/reference/agents/*.md`, `docs/reference/skills/*.md` (generated), plus the story / concept / usage pages
- A graph-memory decision record

**Modified**
- Generators: `generate-role-adapters.ts`, `generate-catalog.ts`, `generate-skill-twins.ts` (INVARIANT), `trace-render.ts`
- Authorities: `kit-model.ts` (counts, INVARIANT), `model-tiers.ts`, `canonical-frontmatter.ts` (`skills`)
- Readers and gates: `board-model.ts`, `board-read.ts`, `board-dashboard.ts`, `board-corpus.ts`, `trace-freshness.ts`, `validate-agent-factory.ts`, `check-foundation-guards.ts`, `check-imperative-lexicon.ts`, `check-banned-claims.ts`, `check-diff-disposition` base file, `audit-prepass.ts` count
- Installer: `install.ts` (migrate arm, old-layout refusal, doctor, protected dirs, RUNNABLES, GENERATOR_TWINS if the generator gains an import), `uninstall.ts`
- Kit: all roles (rewrite), `_role-switch-protocol.md` (levels and skills steps), WF03/04/05/09/14/17, contracts `board.md`, seed tree, `writing-profile.md`, `config/factory.config.md` (models dial for level stems), packaging docs
- `AGENTS.md`, `agent-factory/README.md`, `docs/audit/28-claim-registry.md`, `README.md`, `examples/`, fixtures, 23 tests that cite `plans/`, `adapter-byte-baseline.test.ts`

**Unchanged by design**
- `scripts/voice-model.ts` (hash-pinned by `hooks/hook-entry.ts`)
- `scripts/claim.ts`, `scripts/context-io.ts`, `.grugops/context/` layout
- The hook manifest and the admission guard

---

## 11. Suggested build order

Dependencies drive this order. Two rules:
1. Fix the state paths before the role rewrite, so the 106 role path references are rewritten once.
2. Add the generator machinery for levels and new roles before the rewrite, so all 19 roles are written once in the new voice.

| # | Phase | Delivers | Depends on | Why here |
|---|---|---|---|---|
| 35 | **Graph-memory spike** (short, can run in parallel with 36) | decision record | — | Cheap; can only affect whether state-layout reserves a derived-index path |
| 36 | **State-layout authority + path move** | `install/state-layout.ts`; seed moved; `board-read`/`validate`/`trace-*`/`board-corpus`/`check-banned-claims` on new paths; `INVARIANT` + regenerated adapters/skills; AGENTS.md + claim registry; protected dirs; old-layout install refusal; workflows/checklists/contracts path edits (roles only mechanically, or wait for 39) | — | Everything else names these paths |
| 37 | **Overview board + per-file splits + budgets** | board contract (overview rule), per-ticket trace render + freshness, per-NFR files, ticket/memory-bank budgets, `state-check` runnable + generated region, WF05/WF09 invocation | 36 | Budgets need the final file set |
| 38 | **`install --migrate` v3** | `install/state-migrate.ts`, conservation proof, dogfood on a copy of `cli-chess-example` under a scratch `GRUGOPS_HOME` | 36, 37 | Migrates into the layout 37 defines; highest data risk, so give it its own verification |
| 39 | **Level adapters + Tech Lead + Designer (machinery)** | `levels:` key, `LEVELS` table, `listAgentAdapterNames`, guard updates, count bumps, MODEL-01 amendment + baseline re-pin, `skills:` key + canonical-schema admission, two new role files (drafted plain), orchestrator routing | 36 | Counts and guards move once, before the rewrite touches every role |
| 40 | **Plain-language role rewrite + flow guidance** | voice guards retired / inverted, `ROLE_SECTIONS`, diff-disposition re-base, roles joined to the lexicon gate, corpus-total byte guard, all 19 roles + protocol rewritten, WF17 refill/close/compact, fixtures regenerated | 36, 37 (paths, budget wording), 39 (role set) | One pass over the role corpus |
| 41 | **Skills per role** | `skills:` populated per role, adapter emission, protocol step, doctor WARN for missing skills, evaluation of superpowers / code-simplifier / feature-dev / commit-commands / frontend-design / ui-ux-pro-max | 39 (key + schema), 40 (role text) | Needs the final roles |
| 42 | **Story + layered docs** | catalog generator emits agent/skill pages, new story pages, README | 39–41 | Describes the finished system |

Notes for the roadmap:
- 36 and 37 can merge if the roadmap wants fewer phases. Keep 38 separate: it is the only phase that rewrites user data.
- 39 before 40 is the important ordering. The reverse means every count-bearing guard moves twice, and the role corpus is rewritten under a moving ceiling table.
- If the milestone keeps the "capped gap rounds" practice, budget extra rounds for 38 (data-conserving splitter) and 39 (count-and-membership guards). Those are the two classes this repository has historically needed several rounds to close.

---

## 12. Anti-patterns to avoid

1. **A second copy of the budget numbers.** The runnable on host repos cannot import `install/state-layout.ts`, and it is tempting to retype the numbers. Generate the region and gate it instead (`generate-hook-manifest` precedent).
2. **A base `grugops-software-engineer` adapter kept "for compatibility" next to three levels.** It is a fourth answer to one fact, and `guard_referential_integrity` would need a carve-out. Derive the name set from frontmatter and assert its count.
3. **Moving blocked reasons into tickets with no ticket budget.** The dogfood's largest ticket is already 238 KB. Without a ticket budget the overview rule just relocates the bloat.
4. **Splitting the monoliths in place.** Hand-written prose has unlisted shapes. Move the originals into `archive/pre-v3/` unchanged, write the splits as new files, and prove line conservation.
5. **Editing `scripts/voice-model.ts` to delete caveman helpers.** It is hash-pinned inside the admission hook's frozen manifest. Delete the consumers instead.
6. **Treating `LARGE_BOARD_BYTES` / `LONG_LINE_CHARS` as the budget.** They are reader bounds that report and never refuse (`board-model.ts:59-70`). A budget is a validator and runnable fact.
7. **A new workflow file for flow control.** It moves `WORKFLOW_COUNT` and three derived pins for text that fits in WF17.

## 13. Open questions (must be decided, not discovered)

- Does the 67,383 B role budget cover the two new roles (19 files plus the protocol) or only the existing 18? This decides whether the rewrite must net-shrink.
- Should engineer levels keep pinned models when `models.preset = none` (zero config)? Recommended: yes, overridable per level stem. That requires amending MODEL-01 (section 3.2).
- Are per-ticket trace files generated (grugops CI renders from notes) or agent-written (host repos have no `trace-render.js`)? Recommended: one shape for both, agent-written on hosts, generated and freshness-checked in grugops's own tree.
- Should `claim.js` become a materialized runnable so WF17 is executable as written on host repos? (`UNKNOWN - verify` on a live non-grugops host; section 5.)
- Do `.grugops/queue/done/` (6.2 MB) and `memory-bank/50-decisions/` (1.1 MB) get budgets or archive folders in v3.0? Both are unbounded growth surfaces the milestone does not name.

## Sources

- Codebase, read and measured on this tree: `scripts/kit-model.ts`, `scripts/model-tiers.ts`, `scripts/generate-role-adapters.ts`, `scripts/check-foundation-guards.ts`, `scripts/voice-model.ts`, `scripts/board-model.ts`, `scripts/board-read.ts`, `scripts/trace-render.ts`, `scripts/trace-freshness.ts`, `scripts/validate-agent-factory.ts`, `scripts/claim.ts`, `scripts/canonical-frontmatter.ts`, `scripts/check-imperative-lexicon.ts`, `scripts/check-diff-disposition.ts`, `scripts/adapter-byte-baseline.test.ts`, `hooks/hook-entry.ts`, `install/install.ts`, `install/uninstall.ts`, `agent-factory/**` (HIGH)
- Dogfood repo, read-only: `/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example` (`plans/`, `memory-bank/`, `.grugops/`, `tools/grugops/`) (HIGH, measured)
- [Claude Code subagents: frontmatter `skills`, `effort`, `autoCompactWindow`](https://code.claude.com/docs/en/sub-agents), fetched 2026-10-20 (vendor page; LOW by classify-confidence seam)
- [OpenCode skills locations](https://opencode.ai/docs/skills) (LOW by seam)
- [ui-ux-pro-max installation](https://www.mintlify.com/nextlevelbuilder/ui-ux-pro-max-skill/installation) and [Claude Code platform page](https://www.mintlify.com/nextlevelbuilder/ui-ux-pro-max-skill/platforms/claude-code) (LOW by seam)

---
*Architecture research for: grugops v3.0 integration*
*Researched: 2026-10-20*
