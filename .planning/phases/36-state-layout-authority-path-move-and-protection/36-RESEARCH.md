# Phase 36: State-layout authority, path move and protection - Research

**Researched:** 2026-10-20 (tree at `218b12db`)
**Domain:** In-repo refactor and path migration: TypeScript tooling (installer, uninstaller, validator, board reader, trace tools), markdown kit (roles, workflows, seeds, AGENTS.md), generated adapters and skills, and a derived grep-to-zero gate
**Confidence:** HIGH for the code facts (read this session). MEDIUM for the design recommendations. No external libraries are involved.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (milestone decisions, not re-asked)
- [v3.0, D-4] Roles read `memory-bank/plans/` when present, otherwise `plans/`, with a one-line
  "run `install --migrate`" notice; a plain install refuses to seed state on the old layout.
- `install/state-layout.ts` is constants-only and is the only place a state path or budget is spelled.
  Readers, writers, the validator, the installer and the uninstaller import it.
- One exported `STATE_ROOTS` (adds `memory-bank`) replaces the hand-typed protected lists in
  `install/install.ts` (`isPruneProtected`) and `install/uninstall.ts` (`isProtected`); count pinned two-sided.
- The old-spelling gate covers three spellings (slash, `join(...)`, backslash) and derives its counts; it
  never types an expected number.
- Every scratch install in tests and agent runs sets `GRUGOPS_HOME`.

#### Layout detection
- **D-01:** Layout is decided by board-file presence: `memory-bank/plans/board.md` exists means new layout;
  otherwise `plans/board.md` means old layout. No layout marker is added in this phase (Phase 38 adds its
  own marker for migrate). Works on the markdown-copy install path where the installer never ran.
- **D-02:** When both `plans/board.md` and `memory-bank/plans/board.md` exist, the new layout wins and a
  one-line warning names `plans/` as stale. Roles and install proceed on `memory-bank/plans/`; nothing
  is merged or deleted. (Phase 38's migrate may still treat "both" as its own refusal state; that is
  Phase 38's call.)
- **D-03:** The fallback rule is stated once: AGENTS.md § Kit vs state plus the generated INVARIANT text
  that reaches every role, adapter and skill. Roles name only `memory-bank/plans/...` paths. No per-role
  fallback text, and no copy in WF16.
- **D-04:** The `plans/` fallback is a declared v3.x transition and is removed in v4.0. Record this as a
  decision (PROJECT.md Key Decisions) so the dual-root reader has a named end. — **Reversibility:** costly —
  removing it later breaks any repo still unmigrated; the date is a published promise in docs.

#### Old-layout install behavior
- **D-05:** A plain `install` on an old-layout repo refuses the whole install: it writes nothing, prints
  the `install --migrate` command, and exits non-zero (use the installer's existing refusal exit-code
  convention). This applies only to the per-repo install; `--update` (kit-home only), `--check`,
  `--migrate` and uninstall are not blocked. A "both" repo (D-02) is new layout, so install proceeds with
  the warning. — **Reversibility:** reversible
- **D-06:** The notice uses the final wording now ("run `install --migrate`"), even though the v3 migrate
  arm lands in Phase 38. v3.0 ships Phases 36–38 together, so no released kit shows the gap. Phase 38
  owns making the command move state, and must make sure the existing "already migrated to the two-root
  layout" short-circuit does not swallow the v3 move.
- **D-07:** `install --check` (doctor) reports the state layout: old layout is a WARN naming the
  `--migrate` command (never FAIL); new and both are reported too. The doctor's board check reads its
  path from `state-layout.ts`.

#### Old-spelling gate
- **D-08:** All fixture trees under `scripts/fixtures/` (~185 files) move to `memory-bank/plans/`. Add one
  named old-layout fixture used by the fallback, refusal and doctor tests.
- **D-09:** Historical records are allow-listed and never rewritten: `docs/audit/**` and `CHANGELOG.md`
  (entries before v3.0 record what was true then).
- **D-10:** The allow-list is per file (paths or globs, each with a reason), not per line. The gate prints
  the derived per-spelling count inside allowed files and fails on any site outside them. Allowed files
  also include the code that must name the old path (fallback detection, install refusal, and later the
  migrate arm).
- **D-11:** `.planning/` is excluded from the scan, as a named exclusion in the gate (not a silent skip).

#### Dogfood move and ordering
- **D-12:** grugops's own `plans/` (20 KB, no tickets) moves with `git mv plans memory-bank/plans` by
  hand in a plan, preserving history. Phase 38's migrate is not used.
- **D-13:** Order of work: (1) `state-layout.ts` + `STATE_ROOTS` + prune/uninstall protection tests;
  (2) seed move, repo move, and path edits in readers, writers, validator, docs, workflows, roles and
  regenerated adapters/skills; (3) old-layout fallback text, install refusal and doctor report;
  (4) the grep-to-zero gate turns on last, once sites outside the allow-list reach zero. The suite stays
  green across waves.

### Claude's Discretion
- Exact file location and export names inside `install/state-layout.ts` (research proposes
  `STATE_ROOT_REL = "memory-bank/plans"` plus fixed subpaths); budget constants may be placeholders
  until Phase 37 fills them.
- Exact wording of the one-line notice and the stale-`plans/` warning (clear voice, names the command).
- How the gate is wired (validator check vs `scripts/` guard) as long as the allow-list and counts are
  derived and it runs in CI.
- Whether `board-read.ts` `FIXED_SUBPATHS` imports from state-layout or keeps a literal with an equality
  test.

### Deferred Ideas (OUT OF SCOPE)
- Layout marker and four-state detection (old/new/both/neither) — Phase 38.
- Per-file byte budgets and their enforcement — Phase 37 (state-layout may hold placeholders).
- Removing the `plans/` fallback — v4.0 (D-04).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-01 | A user's planning state lives under `memory-bank/plans/` (board, tickets, epics, features, sprints, releases, NFRs, traceability, metrics, UAT); seed files, roles, workflows, tooling and docs all name the new paths | § Seed move (one `git mv`, no installer code); § Site inventory by category; Open Question 1 (there is no UAT seed today) |
| LAYOUT-02 | One constants-only module owns every state path and budget; readers, writers, validator, installer and uninstaller import it; a gate fails on any old `plans/` spelling (slash, `join(...)`, backslash) outside a named allow-list, with a derived count | § Pattern 1 (state-layout.ts); § Pattern 5 (the gate); § Derived counts (the 1,293 vs 1,187 discrepancy explained) |
| LAYOUT-03 | Install pruning and uninstall both protect every state root, including `memory-bank/`, from one exported list | § Pattern 2 (one protected list; fold `isSeededState`) |
| LAYOUT-04 | An old-layout repo keeps working after a kit update: roles fall back to `plans/` with a one-line notice; plain install refuses to seed on the old layout and names the command | § Pattern 3 (where the fallback text must live so an unmigrated repo actually sees it); § Pattern 4 (refusal, seed skip under `--migrate`, doctor) |
| LAYOUT-05 | grugops's own repo state moves to the new layout (dogfood) | § Dogfood move; CI self-validation `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Tooling is TypeScript compiled with `tsc` to committed `.js`; a freshness/build-parity gate fails on drift. A new `install/state-layout.ts` needs its committed `install/state-layout.js` twin.
- Host machines run committed `.js` with zero runtime dependencies; `install/` imports nothing from `scripts/` (the D-18 decoupling, restated at `install/install.ts:83-89`). The authority must therefore live under `install/`, and `scripts/` imports `../install/state-layout.js` (precedent: `scripts/validate-agent-factory.ts:83` imports `../install/host-tools.js`).
- Installers stay idempotent, additive, dry-run capable and reversible; never overwrite or delete user content.
- Single-source: role text lives once; adapters are thin generated pointers. Edit sources, then regenerate.
- No fabrication: unknown commands are `UNKNOWN - verify`; never fake a gate or count.
- Minimal AGENTS.md (WARN 20,480 B / FAIL 28,672 B; today 8,137 B).
- Clear voice in safety, install and refusal text. Brand: lowercase `grugops`.
- GSD workflow: edits go through `/gsd-execute-phase`.
- Repo hazards (from memory and STATE): never run `npm test` (it starts the live e2e lane); run `npx vitest run --exclude '**/scripts/e2e/**'` or targeted files. Every scratch install sets `GRUGOPS_HOME`. Derive sets and assert counts. BSD grep skips binary files silently and has no `-P`.

## Summary

This phase is a large, mostly mechanical path move with four places where the mechanics hide real design decisions. The move itself is cheap where the code already derives from one constant: `seedState()` walks `agent-factory/seed/**` relative to the target, so `git mv agent-factory/seed/plans agent-factory/seed/memory-bank/plans` moves every seeded path with no installer code. The board dashboard's watched directories already derive from `board-read.ts` `FIXED_SUBPATHS`. Most other sites are hand-spelled literals: 1,293 slash-form occurrences, 273 quoted-segment occurrences and 15 backslash occurrences outside `.planning/`, across 345 tracked files. The two counts in the roadmap (1,293 vs 1,187) are the same regex counted two ways, occurrences vs lines, both over 336 files. They do not disagree.

The four hidden design points:

1. **The fallback text must reach a repo that cannot be refreshed.** `--update` refreshes only the kit home, and a plain install on an old-layout repo now refuses (D-05). So an unmigrated repo keeps its v2 `AGENTS.md` and its v2 adapters, which carry the old INVARIANT. The fallback rule written into the new `AGENTS.md` and the new INVARIANT never arrives there. The only text such a repo reads from the new kit is kit-home files: roles, workflows and protocol. `agent-factory/roles/orchestrator.md` line 8 is the kit-home copy of the invariant, and the fallback clause has to be in it too. Without it LAYOUT-04 fails in exactly the scenario it exists for (Pitfall 1).
2. **The gate collides with the fallback text.** The fallback rule has to spell `plans/`, and it is copied into about 33 generated files. A per-file allow-list (D-10) would exempt every one of those files completely. The recommended answer is one exported clause constant in `state-layout.ts`. The gate removes exact occurrences of that clause before it counts.
3. **About 190 installer tests plant `plans/board.md`.** The fixture is "a user-owned board that must survive" (`install/install.test.ts:278`, 181 `makeFixture()` calls, plus `installer-paths.test-support.ts:137`). Once D-05's refusal lands, every one of those installs refuses. The fixtures must move to `memory-bank/plans/board.md` before the refusal turns on.
4. **`--migrate` would create the "both" state.** The existing two-root `--migrate` falls through into the normal install run, which seeds `memory-bank/plans/**`. A v1.0 repo carrying `plans/board.md` would end up with a new empty board beside the old one. `seedState` must skip the `memory-bank/plans/` subtree whenever the target is on the old layout.

**Primary recommendation:** Create `install/state-layout.ts`: constants only, no imports, POSIX-relative strings. Point every tooling site at it. Fold the two protected lists and `isSeededState` into one exported list. Put the one fallback clause, exported from state-layout, into the INVARIANT, AGENTS.md and the orchestrator.md invariant line. Refuse a plain install before the agent picker. Switch on a git-derived three-spelling gate last; its allow-list carries reasons and its counts come only from its own scan.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State path and budget names | `install/state-layout.ts` (constants module) | — | `install/` may not import `scripts/`, so the shared authority must sit in `install/` |
| Seeding state | Installer `seedState()` | Seed tree `agent-factory/seed/**` | The path follows the seed tree; no code change |
| Protecting state from removal | Installer prune + uninstaller | `state-layout.ts` export | Two removal paths, one list |
| Old-layout detection and refusal | Installer (per-repo install path, doctor) | — | Only the installer and doctor run on host repos; `scripts/` is never shipped to hosts |
| Old-layout fallback for agents | Kit markdown (orchestrator.md invariant line, AGENTS.md, INVARIANT in generated adapters and skills) | — | Agents are the "readers" on host repos; the tooling readers run only in grugops's own repo |
| Reading state in grugops's repo | `board-read.ts`, `validate-agent-factory.ts`, `trace-render.ts`, `trace-freshness.ts`, `board-corpus.ts` | `state-layout.ts` | Dev and CI tooling, new layout only |
| Old-spelling enforcement | New `scripts/check-state-paths.ts` gate + test, wired in CI | `state-layout.ts` (supplies the spellings) | Repo-gate precedent: `scripts/guard-retired.test.ts` |

## Standard Stack

No new packages. The phase uses what is already in the repo.

| Tool | Version (verified locally) | Purpose |
|------|---------------------------|---------|
| Node | v26.11.1 locally; CI pins Node 22 (`package.json` `engines.node >=22`) | Runs the committed `.js` |
| TypeScript | 6.0.3 (`~6.0.3`) | `tsc` build to committed `.js` |
| Vitest | 4.1.8 | Tests |
| git | 2.56.0 | `git mv` for the dogfood and fixture moves; `git ls-files -z` for the gate's scan set |

## Package Legitimacy Audit

Not applicable. This phase installs no external packages.

## Derived counts (the method, and how the two roadmap numbers reconcile)

**Method:** a Node script, not grep. It ran `git ls-files -z` at `218b12db`, read every tracked regular file in full (`readFileSync`, so no binary skip), and confirmed **0 tracked files contain a NUL byte**. It applied three regexes:

| Spelling | Regex used | Meaning |
|---|---|---|
| slash | `/(?<![A-Za-z0-9_.\-])(?<!memory-bank\/)plans\//g` | `plans/` as a path segment, not preceded by an identifier character or `memory-bank/` |
| segment (the `join(...)` form) | `/(?<![A-Za-z0-9_])["'\`]plans["'\`]/g` | a quoted `plans` token: `join(x, "plans", …)`, array members, `` `plans` `` in prose |
| backslash | `/(?<![A-Za-z0-9_.\-])(?<!memory-bank\\)(?<!memory-bank\\\\)plans\\/g` | `plans\` (Windows form, raw or escaped) |

**Results outside `.planning/` [VERIFIED: Node count script run this session at 218b12db]:**

| Measure | Value |
|---|---|
| slash occurrences / lines / files | **1,293 / 1,187 / 336** |
| segment occurrences | **273** |
| backslash occurrences | **15** |
| files with any of the three | **345** |
| tracked paths under a `plans/` directory (not under `memory-bank/plans/`) | **88** |
| `.planning/` (excluded, D-11) | 3,614 slash / 85 segment / 34 backslash in 360 files |

**Reconciliation:** ARCHITECTURE's regex `(^|[^A-Za-z0-9_.-])plans/` gives 1,293 **occurrences**. Counted per **line** it gives 1,187, the PITFALLS number. Both cover 336 files. One regex, two units. Neither number covers the segment or backslash spellings, so a slash-only gate would miss 288 sites.

**Inside vs outside the D-09 allow-list (`docs/audit/**`, `CHANGELOG.md`):** inside 224 slash + 2 segment + 0 backslash. Outside 1,069 slash + 271 segment + 15 backslash in 333 files. Adding `docs/initial/**` (Open Question 3) brings outside-slash down to 1,017.

**Slash occurrences by category (files / occurrences):**

| Category | Files | slash | segment | backslash |
|---|---:|---:|---:|---:|
| `scripts/fixtures/**` | 185 | 231 | 0 | 0 |
| tests (`*.test.ts`, `*.test-support.ts`) | 28 | 184 | 239 | 13 |
| tooling `.ts` (non-test) | 16 | 133 | 17 | 1 |
| compiled `.js` twins | 16 | 121 | 15 | 1 |
| `agent-factory/roles/` | 17 | 106 | 0 | 0 |
| `agent-factory/workflows/` | 19 | 107 | 0 | 0 |
| `agent-factory/` other (contracts/board.md 12, packaging 6, checklists 2, README 3, writing-profile 1) | 7 | 24 | 0 | 0 |
| `agent-factory/seed/` | 2 | 5 | 0 | 0 |
| `.claude/agents` + `.claude/skills` (generated) | 24 | 31 | 0 | 0 |
| `skills/*/SKILL.md` (plugin sources) | 7 | 13 | 0 | 0 |
| `docs/audit/**` | 11 | 221 | 2 | 0 |
| `docs/` other (initial spec 52, design/shared-install 10, dogfood runbook 1) | 3 | 63 | 0 | 0 |
| `examples/` | 5 | 22 | 0 | 0 |
| `install/README.md` | 1 | 18 | 0 | 0 |
| `AGENTS.md` / `CHANGELOG.md` / repo `plans/` | 1 / 1 / 2 | 6 / 3 / 5 | 0 | 0 |

Tooling `.ts` sources by slash / segment: `scripts/board-read.ts` 25/2, `install/install.ts` 22/3, `scripts/board-model.ts` 18/0, `scripts/validate-agent-factory.ts` 13/0, `scripts/check-banned-claims.ts` 12/1, `scripts/trace-freshness.ts` 11/4, `scripts/board-dashboard.ts` 10/4, `install/uninstall.ts` 10/1, `scripts/trace-render.ts` 4/1, `scripts/board-corpus.ts` 3/0, `scripts/check-imperative-lexicon.ts` 2/0, `install/kit-source.ts` 1/0, `scripts/kit-model.ts` 1/0, `scripts/generate-role-adapters.ts` 1/0, `scripts/check-platform-shapes.ts` 0/1, `scripts/posix-path.ts` 0/0/1 (a comment example). Many are comments and messages. Comments count too, because the gate scans file text.

## Site inventory: load-bearing literals (read this session)

| Site | Verbatim today | Change |
|---|---|---|
| `install/install.ts:3211-3212` | `function isPruneProtected(p: string): boolean {` / `const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];` [VERIFIED: install/install.ts:3211-3218] | Import the one protected list |
| `install/uninstall.ts:398-399` | `function isProtected(p: string): boolean {` / `const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];` [VERIFIED: install/uninstall.ts:398-406] | Same import |
| `install/uninstall.ts:626-627` | `// isProtected covers .grugops/ and plans/; memory-bank/ is the other seeded tree.` / `const isSeededState = (rel: string): boolean => rel === "memory-bank" \|\| rel.startsWith("memory-bank/");` [VERIFIED: install/uninstall.ts:624-627] | Delete once `memory-bank` is in the protected list (one rule, one place); `reverseDir` (`:739`) keeps calling `isProtected` |
| `install/install.ts:2409` (doctor) | `[join(TARGET, "plans", "board.md"), statRef, "file"],` [VERIFIED: install/install.ts:2403-2411] | Layout-aware board ref (Pattern 4) |
| `install/install.ts:3089` | `return backupDir(join(TARGET, "plans", "handoffs"), "plans/handoffs/", "handoffs");` [VERIFIED: install/install.ts:3088-3089] | Stays at the legacy location (the old relay lived there); spell from a `LEGACY_HANDOFFS_REL` constant |
| `scripts/board-read.ts:480-487` | `board: "plans/board.md",` `tickets: "plans/tickets",` `queue: ".grugops/queue",` `context: ".grugops/context",` `traceability: "plans/traceability.md",` `config: "agent-factory/config/factory.config.json",` [VERIFIED: scripts/board-read.ts:480-487] | Import from state-layout. The dashboard's watched directories follow automatically (`watchDirForSubpath`, `scripts/board-dashboard.ts:807`) |
| `scripts/validate-agent-factory.ts:315-319` | `"plans/board.md",` `"plans/traceability.md",` `"plans/nfr-catalog.md",` `"plans/metrics.md",` [VERIFIED: scripts/validate-agent-factory.ts:314-321]; also `checkTickets` `:718-731` (`stateListDir("plans/tickets")`, `stateRead("plans/board.md")`, `stateRead("plans/traceability.md")`, `` `plans/tickets/${f}` ``) | Import |
| `scripts/trace-render.ts:38` | `const DEFAULT_PLANS_ROOT = join(ROOT, "plans");` [VERIFIED: scripts/trace-render.ts:38] | `join(ROOT, STATE_ROOT_REL)` |
| `scripts/trace-freshness.ts:77` | `const PLANS_ROOT = CHECK_ROOT ? join(CHECK_ROOT, "plans") : join(ROOT, "plans");` [VERIFIED: scripts/trace-freshness.ts:77]; also `:120` `join(tmp, "plans")`, `:145` `toPosix(join("plans", "traceability.md"))` | Import. Its mirror is `jsImportClosure`-derived, so the imported module is mirrored automatically |
| `scripts/board-corpus.ts:158-159` | `const KIT = "plans/board.md";` / `const SEED = "agent-factory/seed/plans/board.md";` [VERIFIED: scripts/board-corpus.ts:158-159] | Import |
| `scripts/check-imperative-lexicon.ts:671` | `const BOARD = "agent-factory/seed/plans/board.md";` [VERIFIED: scripts/check-imperative-lexicon.ts:671] | Import |
| `scripts/check-banned-claims.ts:916-917` | `"memory-bank/",` / `"plans/",` [VERIFIED: scripts/check-banned-claims.ts:913-918] | Delete the `"plans/"` root entry once the repo's `plans/` is gone; `memory-bank/` already covers `memory-bank/plans/`. Check the partition-cardinality and coverage cases in `check-banned-claims.test.ts` |
| `scripts/kit-model.ts:282-283` | `` export const INVARIANT = "> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)"; `` [VERIFIED: scripts/kit-model.ts:282-283] | New text (Pattern 3). It must keep the `check-kit-refs` MARKER substring `"If the kit dir is absent, STOP — do not hunt."` [VERIFIED: scripts/check-kit-refs.ts:160-163] |
| `scripts/generate-role-adapters.ts:530` (coordinator body) | `` "`AGENTS.md` and `plans/board.md` (respect every WIP limit), and act as that role.", `` [VERIFIED: scripts/generate-role-adapters.ts:529-530] | New path |
| `scripts/board-model.ts` | 18 message sites, e.g. `` spelled`plans/tickets/${id}.md exists …` `` (lines 1468-1480, 1750) | Interpolate from state-layout; regenerate `scripts/fixtures/board-snapshot/expected-snapshot.json` (1 site) |

Hand copies of the invariant: `agent-factory/packaging/slash-command.template.md:32`, `agent-factory/packaging/subagent.frontmatter.md:48,97`, `agent-factory/roles/orchestrator.md:8` (compressed form), `AGENTS.md:43`, and 7 hand-authored plugin sources `skills/*/SKILL.md`. `generate-skill-twins.ts:252` locates INVARIANT in each source by exact full-line equality, so every source must be edited to the byte-identical new text before `npm run generate:skill-twins`.

## Architecture Patterns

### System Architecture Diagram

```
             install/state-layout.ts  (constants only, zero imports)
             STATE_ROOT_REL, subpaths, LEGACY_*, protected list, fallback clause
                 |                    |                         |
     +-----------+----------+         |                         +-------------------------+
     v                      v         v                                                   v
install/install.ts    install/uninstall.ts   scripts/* (board-read, board-model,     scripts/check-state-paths.ts
 - layout probe        - isProtected          validator, trace-render/freshness,      git ls-files -> 3 regexes built
   (new|old|both|       (imported list)       board-corpus, banned-claims,            from LEGACY/STATE constants ->
    fresh)                                    imperative-lexicon, kit-model)          minus fallback clause -> counts
 - plain install: old? --> REFUSE (stderr, exit 1, before picker, nothing written)    inside / outside allow-list
 - --migrate: old? -----> seedState skips memory-bank/plans/** (no "both" created)    -> exit 0 / 1 / 2
 - both? ---------------> warn "plans/ is stale", proceed
 - seedState: agent-factory/seed/memory-bank/plans/** -> $TARGET/memory-bank/plans/**
 - --check: layout line (new ok | old WARN + --migrate cmd | both WARN) + board stat on resolved path
 - prune: isPruneProtected (imported list)

Host repo session (after --update, repo NOT migrated):
  old .claude/agents adapter (v2 INVARIANT) --KIT=--> ~/.grugops/agent-factory/roles/orchestrator.md (v3)
       line 8 invariant + fallback clause --> agent sees: memory-bank/plans/board.md absent, plans/board.md present
       --> uses plans/ and prints once "run `install --migrate`"
```

### Recommended file layout
```
install/state-layout.ts      # NEW: authority (constants only)
install/state-layout.js      # NEW: committed tsc twin
scripts/check-state-paths.ts # NEW: the old-spelling gate (CLI, exit 0/1/2)
scripts/check-state-paths.js # NEW: committed twin
scripts/check-state-paths.test.ts  # NEW: gate cases (live tree, mutation per spelling, converse allow-list checks)
agent-factory/seed/memory-bank/plans/**   # MOVED from agent-factory/seed/plans/** (+ uat/.gitkeep, see Open Q1)
memory-bank/plans/**                      # MOVED from plans/** (dogfood, git mv)
scripts/fixtures/<tree>/memory-bank/plans/**  # MOVED (12 trees: 11 validator trees + board-snapshot)
```

### Pattern 1: `install/state-layout.ts`, constants only
**What:** One module that spells every state path. POSIX-relative strings, no imports, no functions, no I/O. It must qualify for the `board-readonly.test.ts` closure rules (board-read imports it): a module with no imports adds no fs symbol, so `EXPECTED_CLOSURE_FS_SYMBOLS` is unchanged.
**Example (proposed shape; names are discretion):**
```typescript
// install/state-layout.ts — constants only. No imports, no functions, no I/O.
export const STATE_ROOT_REL = "memory-bank/plans";
/** The pre-v3 root. Read only by the fallback, the install refusal, the doctor and (Phase 38) --migrate. Removed in v4.0 (D-04). */
export const LEGACY_STATE_ROOT_REL = "plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
export const TRACEABILITY_REL = `${STATE_ROOT_REL}/traceability.md`;
export const NFR_CATALOG_REL = `${STATE_ROOT_REL}/nfr-catalog.md`;
export const METRICS_REL = `${STATE_ROOT_REL}/metrics.md`;
// epics, features, sprints, releases, uat: same shape. nfr/, traceability/, archive/ are reserved for Phases 37-38.
export const LEGACY_BOARD_REL = `${LEGACY_STATE_ROOT_REL}/board.md`;
export const LEGACY_HANDOFFS_REL = `${LEGACY_STATE_ROOT_REL}/handoffs`;
/** Per-repo state roots (first path segment under the target). */
export const STATE_ROOTS = Object.freeze(["memory-bank", ".grugops", LEGACY_STATE_ROOT_REL] as const);
/** Every tree prune and uninstall must never touch: the state roots plus the user-owned trees. */
export const PROTECTED_ROOTS = Object.freeze([...STATE_ROOTS, "agent-factory", ".planning", "docs", "src"] as const);
/** The one fallback sentence (D-03). Copied verbatim into INVARIANT, AGENTS.md and orchestrator.md line 8. */
export const LEGACY_FALLBACK_CLAUSE = "If only the old `plans/board.md` exists, use `plans/` and say once: run `install --migrate`.";
```
All names and the clause wording above are proposals [ASSUMED]. The root names in `PROTECTED_ROOTS` are today's list (verified above) plus `memory-bank`.

- **Keep the strings POSIX and join them with `path.join(root, rel)`.** That is the existing `FIXED_SUBPATHS` practice (`join(root, FIXED_SUBPATHS[source])`, `board-read.ts:984`). Never split the new root into `"memory-bank", "plans"` segments: the gate's segment regex would flag the `"plans"` token.
- **Budgets:** export nothing numeric in Phase 36. A typed number with no consumer is a fabricated budget. Phase 37 adds budgets next to the paths. The existing `board-model.ts` reader bounds (`MAX_META_CHARS`, `LARGE_BOARD_BYTES`, `LONG_LINE_CHARS`) report and never refuse; ARCHITECTURE § 2.3 says not to weld budgets onto them. Leave them.
- **`FIXED_SUBPATHS` (discretion):** import the three state entries (`board`, `tickets`, `traceability`) from state-layout. The literal-plus-equality-test option leaves a second spelling that the gate must then allow. Importing costs nothing: the closure walk follows relative imports, and `assertInsideRoot` accepts `../install/` because it stays inside the repo root.
- **`kit-model.ts` INVARIANT:** keep it a literal in `kit-model.ts` and add a test that it contains `LEGACY_FALLBACK_CLAUSE` and `STATE_ROOT_REL`. Importing state-layout into `kit-model.ts` would force `install/state-layout.js` into three **hand-listed** mirrors, `scripts/adapters-freshness.ts:220-235` (and the similar lists in `catalog-freshness.ts` and `skill-twins-freshness.ts`). That failure is loud (the mirrored generator does not start), but it is extra churn for no gain.

### Pattern 2: one protected list, read by both removal paths
Replace the array literal inside `isPruneProtected` and `isProtected` with the imported list. **Keep both function names.** `install/path-spelling-census.test.ts` classifies their `p === TARGET` comparisons by the keys `"install.ts:isPruneProtected:==="` and `"uninstall.ts:isProtected:==="`. Then delete `isSeededState`: once `memory-bank` is protected, `reverseDir`'s `isSeededState(entry.path) || isProtected(...)` becomes `isProtected(...)`. Derive the uninstall "preserved" banner (`install/uninstall.ts:2883`, `console.log("  agent-factory/  plans/  .planning/  docs/  src/ …")`) from the same list.

Tests (Pitfall 3): plant a recorded backup ledger entry under `memory-bank/plans/` (and one under each protected root). Run `--prune-old-kit` and assert the line `left … (under a protected path …)` (`install/install.ts:3228`). Plant a recorded file entry under `memory-bank/plans/`, run uninstall, and assert the line `(protected path — never removed)` (`uninstall.ts:513`). Add a one-list structural test: `install.ts` and `uninstall.ts` contain no array literal holding `".planning"` together with `"agent-factory"`, so a second copy of the list cannot come back. Pin the list size two-sided as a named constant compared with `.length`, the `ROLE_COUNT` idiom, per CONTEXT.

Behavior change check: today `memory-bank/` is protected only for `dir` entries (`isSeededState` in `reverseDir`). Install records no seeded files (the 39 recorded file entries contain no seed file; `install/installer-cross-version.test.ts:50-52`), so widening `isProtected` to `memory-bank` changes no current outcome. It also covers Phase 38's `memory-bank/plans/archive/pre-v3/` backups ahead of time.

### Pattern 3: where the fallback rule must live (LAYOUT-04, Pitfall 1)
D-03 places the rule in AGENTS.md § Kit vs state and in the generated INVARIANT. Both are **per-repo copies** that an unmigrated repo never receives:
- `--update` is kit-home only: "-- kit refresh (kit-home-only; per-repo state untouched) --" (`install/install.ts`, `--update` branch).
- Install rewrites an existing `AGENTS.md` only when the ledger proves install wrote it and nobody edited it (`install/install.ts:6932-6960`), and adapters only on an install run. D-05 refuses that run on the old layout.

So after `--update`, an old-layout repo runs v2 adapters (old INVARIANT says `plans/` = STATE) and v2 `AGENTS.md` against v3 roles that say `memory-bank/plans/board.md`. The one invariant copy that lives in the kit home is **`agent-factory/roles/orchestrator.md:8`**, and every session starts at the Orchestrator. That line must carry `LEGACY_FALLBACK_CLAUSE` verbatim. It is the INVARIANT text that "reaches every role" in D-03's sense, not per-role text. Byte cost: `orchestrator.md` is 6,817 B; the path edits add about 60 B and the clause about 110 B, so about 6,990 B, under WARN 7,165 and FAIL 7,570 (`roleCeiling`, `scripts/check-foundation-guards.ts:3423-3424`). Plugin-form users also get the new INVARIANT through the plugin cache.

Put the same clause in: `INVARIANT` (`kit-model.ts`), `AGENTS.md` § Kit vs state (its line-43 copy), the two packaging copies and the 7 `skills/*/SKILL.md` sources. Then run `generate:adapters` and `generate:skill-twins`.

### Pattern 4: install refusal, seed skip, doctor report (D-05, D-07)
**Layout probe** (in `install.ts`; the doctor uses it too). Use the `user-file.ts` primitives and classify each board path as absent, present or unreadable:
- absent = lstat answers `ENOENT` or `ENOTDIR`. `ENOTDIR` matters: `closing-claims.test.ts:516` plants "a regular file named plans", which must not read as old layout.
- any other lstat error (`EACCES`, `ELOOP`) = **unreadable, never absent**. Reading `EACCES` as "absent" is the P32 CR-02 fail-open class ("bare-catch EACCES→absent"). Here it would seed a second board.
- Decision: new present → `new` (plus old not absent → `both`). New absent and old present → `old`. Either unreadable on a plain install → refuse with the reason. Both absent → `fresh`.

**Refusal placement:** after the self-checkout guard and the kit-home overlap guard, which both use the "one stderr sentence, exit 1, nothing on stdout, nothing written" convention (`install/install.ts`, the `refusing: target looks like…` and `the kit home … overlaps` blocks). Place it **before** `SELECTION_WHY` (the interactive agent picker, `:6196`), so a user is not asked to pick agents and then refused. Print `migrateCommand(...)` (`install/install.ts:584`) with the agents the user named by flag (`SELECTED_BY_FLAG`), the precedent the `--migrate` pre-write refusal uses. Skip the refusal when `MIGRATE`, `CHECK`, `UPDATE` or `PRUNE_OLD_KIT` is set; the last three branch off earlier anyway.

**Exit-site pin:** this adds a mid-script `process.exit(`. Re-pin `install/install.test.ts:5884` `"mid-script exit sites: 11"` → 12 and `:5889` `"raw occurrences including prose: 12"` → 13, with a dated reason, and update the test title ("the eleven MID-SCRIPT exit sites").

**Seed skip:** in `seedState()`, when the layout is `old` (reachable only under `--migrate` once the refusal exists), skip every seed path under `STATE_ROOT_REL` and report `skipped` with the migrate notice. Without this, the two-root `--migrate` fall-through (`install/install.ts:6450-6455`, "FALL THROUGH into the install run below") creates the `both` state on every v1.0 repo that has `plans/board.md`. On `both`: print one `note` line naming `plans/` as stale (never a `verify`, which would turn the run INCOMPLETE with exit 3).

**Doctor:** replace the fixed board ref (`:2409`) with the resolved board path. Add one layout line: `new` → `ok`, `old` → `docWarn(...)` naming `doctorInstallCommand()`-style `--migrate` text (and the board stat runs on `LEGACY_BOARD_REL` so an old repo is not a FAIL), `both` → `docWarn` (stale `plans/`). Note that `--strict` promotes WARN to exit 1 by design (`doctor()`'s `STRICT` arm).

### Pattern 5: the old-spelling gate
**Model:** `scripts/guard-retired.test.ts`. It uses a `git ls-files -z` scan set, latin1 reads (so no binary skip), a named exclusion list, a non-vacuity floor and a mutation case. Build it as a CLI (`scripts/check-state-paths.ts`, exit 0 clean / 1 sites outside / 2 could not run, for example git failed) plus a test, wired at both ends: `package.json` `check:state-paths` and a line in the CI "Freshness gates + repo gates (ubuntu only)" block. The repo records more than once that a gate run only by another step is "borrowed, not wired".
- **Spellings come from imports.** Build the three regexes from `LEGACY_STATE_ROOT_REL` and `STATE_ROOT_REL`. The gate then contains no literal `plans` and needs no allow-list entry of its own. The mutation test builds its plants from the same constants.
- **Exclusion:** `.planning/` is named and printed (D-11).
- **Clause subtraction:** remove exact occurrences of `LEGACY_FALLBACK_CLAUSE` from each file's text before counting. The alternative is to allow-list all ~33 files that carry the INVARIANT, which would exempt them completely (Open Question 2).
- **Allow-list:** `ReadonlyArray<{ glob; reason }>`. Minimum: `install/state-layout.ts` and its `.js` (the authority names the legacy root), `docs/audit/**` and `CHANGELOG.md` (D-09). The install refusal and the doctor spell nothing old when they interpolate the constants, so they need no entry.
- **Derived, never typed:** the gate prints per-spelling counts inside allowed files and outside, both computed. Converse checks in the test: every allow-list entry matches at least one tracked file **and** at least one site, so a dead entry is red. Never assert the list's length as a number (CONTEXT: the count is derived, not typed). Also scan tracked **paths**, which catches a fixture tree that was not moved.
- **Wire last (D-13 step 4):** run it once read-only first and record the outside count (it must be 0) in the plan SUMMARY.

### Pattern 6: the adapter byte baseline (a hidden red test)
`scripts/adapter-byte-baseline.test.ts` compares every `.claude/agents/*.md` byte for byte with the pinned commit `PRE_PHASE_ADAPTER_BASELINE = "6f8411effe80b3f22d0d668e1fa40fa78e3a8088"` [VERIFIED: scripts/adapter-byte-baseline.test.ts:75]. It already admits two recorded divergences as stated transforms (33-28 tools line; 34-07 D-14 host phrase). The baseline orchestrator adapter contains the old INVARIANT (line 10) and `` `AGENTS.md` and `plans/board.md` `` (line 24), measured with `git show 6f8411e…:.claude/agents/grugops-orchestrator.md`. Changing INVARIANT reds all 17 adapters. Add a **third recorded divergence**: a stated transform from the old INVARIANT line to the new one (assert exactly one occurrence per adapter), plus the coordinator board line. Do **not** re-pin; the file says why. Changing INVARIANT twice (once for paths in step 2, once for the clause in step 3) means two regenerations and two transform edits. Prefer landing the final INVARIANT once.

### Anti-Patterns to Avoid
- **A slash-only grep "to zero":** it misses 288 segment and backslash sites (PITFALLS 4).
- **Adding `plans/` to `scripts/dead-vocabulary.ts` `RETIRED_PATH_FORMS`:** `check-kit-refs` Assertion 2 then requires zero hits in the adapters, where the fallback clause must stay until v4.0. `plans/` is a declared legacy, not retired vocabulary.
- **Reading `EACCES` as absent** in the layout probe (fail-open; see Pattern 4).
- **Splitting the new root into `"memory-bank", "plans"` segments** (trips the segment gate; one string instead).
- **Per-role fallback text** (D-03 forbids it; orchestrator.md line 8 is the invariant line, not role prose).
- **Re-pinning the adapter baseline** instead of adding a stated transform.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path hazard checks (links, FIFOs, a non-directory on the way) | a new `existsSync` probe | `install/user-file.ts` `wayTo`, `kindAt`, `gone`, `readForWrite`, `readUserFile` | DC-1/DC-3 history: `existsSync` is false for a dangling link and true for a FIFO |
| The printed `--migrate` command | a string with `install.js --migrate` | `migrateCommand(agents)` / `agentCommand(...)` (`install/install.ts:584`) | Carries this run's kit home, mode and source as `GRUGOPS_HOME`/`INSTALL_MODE`/`GRUGOPS_SRC` (D-38) |
| Tracked-file scan | `grep -r` | `git ls-files -z` + latin1 `readFileSync` (the `guard-retired.test.ts` pattern) | BSD grep skips binary files silently and has no `-P` |
| Mirror of a module closure | another hand list | `jsImportClosure` (already used by `trace-freshness.ts`) | Hand lists drift |
| Scratch installs in tests | a bare `spawnSync("node", ["install/install.js"])` | `runInstall` from `install/installer-paths.test-support.ts:381` (sets `GRUGOPS_HOME`, `GRUGOPS_SRC`, `TARGET`) | A run without `GRUGOPS_HOME` overwrites the real `~/.grugops` |
| Snapshot before/after | ad-hoc diffs | `snapshotTree` / `treeEntries` (test-support) | Already used by the write-set derivation |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | grugops's own `plans/` (9 tracked files, 20 KB, no tickets): `git mv plans memory-bank/plans` (D-12). No `.grugops/` exists in this repo (`git ls-files .grugops` is empty, so `trace-freshness` passes vacuously). Host repos already installed with v2.x hold `plans/**`; that is the old-layout case handled by fallback, refusal and doctor, and data moves in Phase 38. The dogfood `cli-chess-example` is old layout; it is read-only here. | Code edit + `git mv` (repo). No data migration in this phase |
| Live service config | None. No external service stores the path. CI (`.github/workflows/ci.yml`) has 0 old spellings. Verified by the count script (0 hits in `.github/`). | Add the new gate line to CI |
| OS-registered state | None. No scheduler, launchd or pm2 entry references grugops paths. | None |
| Secrets/env vars | `GRUGOPS_HOME`, `GRUGOPS_SRC`, `TARGET`, `VALIDATE_ROOT`, `VALIDATE_KIT_ROOT`, `CHECK_ROOT`, `INSTALL_MODE`, `DRY_RUN`: none names `plans`. | None |
| Build artifacts / installed copies | (a) committed `.js` twins of every edited `.ts`: `npm run build`, then `npm run freshness` / `check:build-parity`. (b) Generated files: `.claude/agents/*` (17), `.claude/skills/*` (7), host entries, catalog, guarantees: run their generators and freshness gates. (c) Already-installed host repos keep their v2 `.claude/agents`, `AGENTS.md` and skills until a re-install, which D-05 refuses on the old layout. That is why the clause must be in orchestrator.md (Pattern 3). (d) The developer's real `~/.grugops` kit: untouched as long as every scratch run sets `GRUGOPS_HOME`. | Regenerate + freshness gates; nothing to do for (c) beyond Pattern 3 |

## Common Pitfalls

### Pitfall 1: The fallback rule never reaches an unmigrated repo
**What goes wrong:** the rule exists only in per-repo copies (`AGENTS.md`, adapters) that `--update` never touches and D-05 never lets install refresh.
**How to avoid:** put the clause in `agent-factory/roles/orchestrator.md:8`. Add a test that every kit-home carrier and INVARIANT contain `LEGACY_FALLBACK_CLAUSE`.
**Warning signs:** a fallback test that installs a v3 kit into the old-layout fixture by running the install (it refuses), instead of pairing a v2-shaped repo with a v3 kit home.

### Pitfall 2: The fixture board trips the refusal
**What goes wrong:** `makeFixture()` (181 calls in `install/install.test.ts`, plus the exported copy in `installer-paths.test-support.ts:131-139`, used by `installer-dry-run`, `ledger`, `closing-claims`, `kit-route`, `settings-json-provenance` and `marker-binding` tests) plants `plans/board.md` as "a user-owned board that must survive". After D-05, those installs refuse.
**How to avoid:** move both fixtures to `memory-bank/plans/board.md` (from `BOARD_REL`) in the same plan as, or before, the refusal. Keep the "survives install and uninstall" assertions on the new path.

### Pitfall 3: Hand-typed count pins move
Known pins that this phase changes. Each needs a dated re-pin with its reason, never a silent bump:
- `install/path-spelling-census.test.ts:65` `const SCANNED_FILE_COUNT = 9;` → 10 when `install/state-layout.ts` lands (it scans every non-test `install/*.ts`).
- `install/install.test.ts:5884/5889` exit sites 11/12 → 12/13 (the refusal).
- `install/installer-never-installed.test.ts:116` `const WRITE_PATH_COUNT = 102;`: the seed move keeps the file count (9 seed files) and the directory count (`plans` + 5 subdirs becomes `memory-bank/plans` + 5 subdirs). Adding `uat/.gitkeep` makes it 104. Re-derive; do not assume.
- `scripts/check-banned-claims.test.ts` partition/coverage cases when `"plans/"` leaves `BANNED_CLAIM_EXCLUDED_LOCATIONS`.
- `scripts/adapter-byte-baseline.test.ts` (Pattern 6).

### Pitfall 4: `memory-bank/plans/` matches a naive `plans/` regex
**What goes wrong:** after the move, every new spelling contains `/plans/`. A naive gate reports thousands of false sites, and someone widens the allow-list to get to green.
**How to avoid:** lookbehind `(?<!memory-bank/)` on the slash form, and the equivalents for backslash. The gate test must include a plant of the **new** spelling that must stay unreported.

### Pitfall 5: The claim registry is live, not history
**What goes wrong:** `scripts/check-claim-anchors.js` requires each claim's text to be byte-identical at its anchor. AGENTS.md claims C-28-012 (line 18), C-28-015 (line 38), C-28-016 (line 43) and C-28-020 (line 155), and `agent-factory/README.md` C-28-033, spell `plans/`. Their verbatim blocks live in `docs/audit/28-claim-registry.md`. D-09 says `docs/audit/**` is never rewritten.
**How to avoid:** edit those five verbatim blocks in the same commit as their anchors. The allow-list exempts the file from the gate; it does not forbid this edit (Open Question 4).

### Pitfall 6: Role byte ceilings
Mechanical substitution adds 12 B per site. Measured per role, from size + 12 × sites against `roleCeiling` (FAIL / WARN): six roles cross **WARN** but stay under FAIL. They are `frontend-ui.md` 3,787 vs WARN 3,757, `greenfield-mapper.md` 2,936 vs 2,882, `qe-e2e.md` 3,671 vs 3,617, `security-nfr.md` 5,018 vs 4,830 (FAIL 5,102: only 84 B left), `system-analyst.md` 3,025 vs 3,000, and `uat-planner.md` 3,379 vs 3,350. WARNs do not fail the build (`check-foundation-guards.ts`: "WARNs do NOT fail the build"). Do not add the fallback clause to `security-nfr.md`. The orchestrator adapter (3,013 B) crosses adapter WARN 3,072 (`AD_WARN`, FAIL `AD_FAIL = 4096`) once the INVARIANT grows by more than 59 B; WARN only.

### Pitfall 7: "Old layout" already means something else
`detectOldLayout()` (`install/install.ts:3394`), `makeOldLayoutFixture` and the `--migrate` banner ("old in-repo layout → two-root") mean the **v1.0 vendored-kit** layout. Name the new concept differently, for example "pre-v3 state layout" or `stateLayout()` returning `"legacy"`. Name the D-08 fixture to match (`makePreV3StateFixture`), and build it at run time from `LEGACY_BOARD_REL`, so no tracked `plans/` path is needed for it.

### Pitfall 8: Hand-listed mirrors
If any module that `adapters-freshness`, `catalog-freshness` or `skill-twins-freshness` copies by hand (`kit-model.js`, `generate-role-adapters.js`, `frontmatter.js`, `model-tiers.js`) starts importing `../install/state-layout.js`, the mirrored generator fails to start and the gate goes red. Either keep those modules import-free of state-layout (recommended for `kit-model.ts`), or add `install/state-layout.js` to each mirror list.

## Code Examples

### Layout probe (proposed; uses existing primitives)
```typescript
// install/install.ts — names are proposals [ASSUMED]; wayTo/kindAt are install/user-file.ts exports read this session.
type BoardAt = "absent" | "present" | { unreadable: string };
function boardAt(rel: string): BoardAt {
  const p = join(TARGET, rel);
  const way = wayTo(TARGET, p);              // a missing dir on the way → "absent"
  if (way === "absent") return "absent";
  if (way !== null) return { unreadable: `${way.at} ${way.reason}` }; // link or non-dir on the way
  try { lstatSync(p); return "present"; }
  catch (e) { const c = errCode(e); return c === "ENOENT" || c === "ENOTDIR" ? "absent" : { unreadable: c }; }
}
```
Note: `wayTo` reports a non-directory on the way (a regular file named `plans`) as `blocked`. The planner must decide whether a blocked legacy path counts as old layout. Recommended: no. A `plans` that is a regular file holds no board.

### Gate core (proposed)
```typescript
// scripts/check-state-paths.ts — sketch [ASSUMED]
import { LEGACY_STATE_ROOT_REL as OLD, STATE_ROOT_REL as NEW, LEGACY_FALLBACK_CLAUSE } from "../install/state-layout.js";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const parent = esc(NEW.slice(0, NEW.lastIndexOf("/")));   // "memory-bank"
const SPELLINGS = {
  slash: new RegExp(`(?<![A-Za-z0-9_.\\-])(?<!${parent}/)${esc(OLD)}/`, "g"),
  segment: new RegExp(`(?<![A-Za-z0-9_])["'\`]${esc(OLD)}["'\`]`, "g"),
  backslash: new RegExp(`(?<![A-Za-z0-9_.\\-])(?<!${parent}\\\\)(?<!${parent}\\\\\\\\)${esc(OLD)}\\\\`, "g"),
};
// text = readFileSync(f, "latin1").split(LEGACY_FALLBACK_CLAUSE).join("");
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two hand-typed protected lists plus a third predicate (`isSeededState`) | One exported list | This phase | Set-literal drift class closed for removal paths |
| `plans/` at repo root | `memory-bank/plans/` | This phase (v3.0) | Fallback until v4.0 (D-04) |
| A single-spelling grep-to-zero (v1.1 kit-vs-state rewrite) | A three-spelling gate whose counts come from its own scan and that names its exclusions | This phase | Catches `join` and backslash forms |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Export names and shape of `install/state-layout.ts` (`STATE_ROOT_REL`, `LEGACY_*`, `STATE_ROOTS` vs `PROTECTED_ROOTS`, `LEGACY_FALLBACK_CLAUSE`) | Pattern 1 | Low; naming is discretion |
| A2 | Splitting `STATE_ROOTS` (state) from `PROTECTED_ROOTS` (state + user trees), with both removal paths importing `PROTECTED_ROOTS`, satisfies "one exported list" | Pattern 2 | Medium: CONTEXT says "one exported `STATE_ROOTS`". Alternative: name the single full list `STATE_ROOTS` |
| A3 | The fallback clause wording | Patterns 1, 3 | Low; discretion (clear voice, names the command) |
| A4 | The gate subtracts the exact fallback clause before counting, rather than allow-listing each carrier file | Pattern 5 | Medium: D-10 says per-file. Needs confirmation (Open Q2) |
| A5 | `seedState` skips `memory-bank/plans/**` on an old-layout target under `--migrate` | Pattern 4 | Medium: without it, `--migrate` creates "both" on v1.0 repos |
| A6 | Refusal placed before the agent picker; prints flag-named agents only | Pattern 4 | Low |
| A7 | Seeding `memory-bank/plans/uat/.gitkeep` satisfies LAYOUT-01's "UAT" | Open Q1 | Medium: no role writes there today |
| A8 | A blocked or non-directory legacy `plans` does not count as old layout; `EACCES` refuses | Code Examples | Medium |

## Open Questions

1. **What does "UAT under `memory-bank/plans/`" mean?** Today there is no `plans/uat/` in the seed. UAT packs are published as typed notes (`agent-factory/roles/uat-planner.md:32`), and Playwright specs go to the repo's e2e directory (`workflows/06-uat-pack.md:26`). Recommendation: reserve a `uat` subpath constant and seed `memory-bank/plans/uat/.gitkeep` so SC1 is literally true and testable; change no role behavior. Confirm with the human.
2. **The fallback clause vs a per-file allow-list (D-10).** The clause spells `plans/` in about 33 generated or copied files. Recommendation: subtract the one exported clause, exact text only, before counting. This is not a per-line allow-list, because the text comes from one constant. Confirm, or accept allow-listing every carrier file.
3. **`docs/initial/**` (52 sites, the original spec) and `docs/design/shared-install.md` (10, the v1.1 design record).** Both read as history. `scripts/guard-retired.test.ts` already excludes `docs/initial/` as history. D-09 names only `docs/audit/**` and `CHANGELOG.md`. Recommendation: allow-list `docs/initial/**` as history; rewrite `shared-install.md`, which is still the design reference for the two-root install. Confirm.
4. **Claim registry edits.** Editing the five verbatim blocks in `docs/audit/28-claim-registry.md` is forced by `check-claim-anchors`. Record a one-line decision that the live registry is not a "historical record" under D-09.
5. **D-13 order vs editing INVARIANT once.** Step 2 changes the INVARIANT path text and step 3 adds the clause. Doing both in one plan halves the regenerations and the baseline-transform edits. The planner chooses.
6. **`check-platform-shapes.ts:670`** plants `join(scratch, "d\u0001x", "plans")`. Is the name significant to that shape test? Probably not; rename it to the new root. Verify when editing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, tests, installer | ✓ | v26.11.1 (CI: 22) | — |
| TypeScript (`tsc`) | committed `.js` twins | ✓ | 6.0.3 | — |
| Vitest | tests | ✓ | 4.1.8 | — |
| git | `git mv`, the gate's scan set | ✓ | 2.56.0 | — |

No missing dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`globals: false`, import explicitly) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run <changed test files>` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (about 31 min; **never `npm test`**, which starts the live e2e lane) |
| Build/typecheck | `npm run build && npm run typecheck`; `npm run freshness` (build parity) |
| Repo gates | `node scripts/check-foundation-guards.js`, `node scripts/check-kit-refs.js`, `node scripts/check-claim-anchors.js`, `node scripts/check-banned-claims.js`, `node scripts/check-imperative-lexicon.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `npm run freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries`, `freshness:catalog`, `freshness:guarantees`, `npm run generate:adapters` + clean-tree check |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | Fresh install seeds the whole set under `memory-bank/plans/`; nothing under `plans/` | integration (scratch install, `GRUGOPS_HOME` set) | `npx vitest run install/install.test.ts -t "two-root"` (rewrite `:740-749`) | ✅ (edit) |
| LAYOUT-01 | Kit, docs and tooling name new paths | gate | `node scripts/check-state-paths.js` | ❌ Wave 0/4 |
| LAYOUT-02 | Only `state-layout.ts` spells state paths in tooling; gate fails on a planted site per spelling and ignores a new-path spelling; allow-list entries are live | unit + mutation | `npx vitest run scripts/check-state-paths.test.ts` | ❌ |
| LAYOUT-02 | `FIXED_SUBPATHS`, validator, trace tools read the authority | unit | `npx vitest run scripts/board-read.test.ts scripts/validate.test.ts scripts/trace-freshness.test.ts scripts/trace-render.test.ts` | ✅ (edit) |
| LAYOUT-03 | Prune and uninstall refuse a recorded path under `memory-bank/plans/` and under every protected root; one list | integration + structural | `npx vitest run install/installer-prune.test.ts install/uninstall-removal.test.ts` (+ new cases) | ✅ (add cases) |
| LAYOUT-04 | Plain install on the pre-v3 fixture: exit 1, stderr names `--migrate`, target byte-identical (`snapshotTree`) | integration | new case in `install/install.test.ts` or a new `install/state-layout.test.ts` | ❌ |
| LAYOUT-04 | `--migrate` on an old target does not create `memory-bank/plans/board.md` | integration | same file | ❌ |
| LAYOUT-04 | "both" proceeds with one stale-`plans/` note | integration | same file | ❌ |
| LAYOUT-04 | `--check` on old: exit 0, WARN names `--migrate`; on both: WARN; on new: ok | integration | same file | ❌ |
| LAYOUT-04 | INVARIANT, AGENTS.md and `orchestrator.md:8` carry `LEGACY_FALLBACK_CLAUSE` verbatim | unit | new case (e.g. in `scripts/kit-model.test.ts`) | ❌ |
| LAYOUT-05 | Repo state at `memory-bank/plans/`; validator passes on it | gate | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`; `test ! -e plans` | ✅ |

### Sampling Rate
- **Per task commit:** the changed test files plus `npm run build && npm run typecheck`.
- **Per wave merge:** `npx vitest run install/` or `npx vitest run scripts/`, whichever the wave touched, plus the repo gates listed above.
- **Phase gate:** full `npx vitest run --exclude '**/scripts/e2e/**'` once, green, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `install/state-layout.ts` + `.js`; `path-spelling-census` re-pin 9 → 10
- [ ] Named pre-v3 fixture builder in `install/installer-paths.test-support.ts` (built at run time from `LEGACY_BOARD_REL`)
- [ ] `scripts/check-state-paths.ts` + `.test.ts` (wired last, D-13)

## Security Domain

ASVS level 1 (`security_asvs_level: 1`, `security_block_on: high`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no (local CLI; the git host is the hard floor for merge and deploy) | — |
| V5 Input Validation | yes: target paths and on-disk shapes | `user-file.ts` `wayTo` / `readForWrite` / `readUserFile` |
| V6 Cryptography | no | — |
| V12 Files and Resources | yes: never follow links out of the target; never delete user state | the protected list, `readForWrite`, ledger `owns()` |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prune or uninstall removes user state under `memory-bank/plans/` | Tampering / DoS (data loss) | `memory-bank` in the one protected list; planted-path tests on both removal paths |
| Seeding a second empty board beside an old one (plain install or `--migrate` fall-through) | Tampering (silent state fork) | Refusal on plain install; seed skip on old layout |
| `EACCES` or a link read as "absent", leading to seeding through or beside unreadable state | Tampering | ENOENT/ENOTDIR-only absence; unreadable refuses |
| False-green gate (binary skip, slash-only regex, typed counts, stale allow-list) | Repudiation (trace lies) | latin1 reads over `git ls-files -z`; three spellings; converse allow-list checks; mutation plants |
| Scratch install overwrites the real kit home | Tampering | `GRUGOPS_HOME` in every run (`runInstall`) |

## Sources

### Primary (HIGH confidence; read this session)
- `install/install.ts` (`isPruneProtected` 3207-3218; doctor refs 2403-2411; `migrateHandoffs` 3088-3089; `seedState` 5574-5588; `--migrate` branch 6342-6455; refusal guards; exit-site residual 8014-8037; `migrateCommand` 584)
- `install/uninstall.ts` (`isProtected` 398-406; `isSeededState` 624-627; `reverseDir`; preserved banner 2883)
- `install/user-file.ts` (`wayTo`, `kindAt`, `gone`, `readForWrite`)
- `scripts/board-read.ts` 480-487; `scripts/validate-agent-factory.ts` 314-321, 718-731; `scripts/kit-model.ts` 282-283; `scripts/generate-role-adapters.ts` 529-530; `scripts/generate-skill-twins.ts` 236-262; `scripts/trace-render.ts` 38; `scripts/trace-freshness.ts` 60-160; `scripts/board-corpus.ts` 158-159; `scripts/check-imperative-lexicon.ts` 671; `scripts/check-banned-claims.ts` 855-925; `scripts/check-kit-refs.ts` 160-163; `scripts/dead-vocabulary.ts`; `scripts/guard-retired.test.ts`; `scripts/adapter-byte-baseline.test.ts` 60-200; `scripts/check-foundation-guards.ts` (role ceilings 3415-3490, adapter size 1519-1545); `scripts/board-readonly.test.ts` (closure premises); `scripts/adapters-freshness.ts` 200-240
- `install/path-spelling-census.test.ts` 65, 260-300; `install/install.test.ts` 272-279, 5862-5890; `install/installer-never-installed.test.ts` 100-116; `install/installer-cross-version.test.ts` 28-52; `install/installer-paths.test-support.ts` 131-170, 338, 381, 820-960
- `.github/workflows/ci.yml` (repo-gate block); `package.json`; `tsconfig*.json`
- `.planning/research/ARCHITECTURE.md` § 2; `.planning/research/PITFALLS.md` Pitfalls 1-4; `.planning/research/SUMMARY.md` § Phase 36, D-4; `.planning/REQUIREMENTS.md`; `.planning/ROADMAP.md`; `.planning/PROJECT.md` Key Decisions [v3.0]
- Node count script over `git ls-files -z` at `218b12db` (method and output above)

### Secondary / Tertiary
- None. No web sources were needed: the phase involves no external library or platform behavior.

## Metadata

**Confidence breakdown:**
- Site inventory and counts: HIGH (measured and read)
- Architecture recommendations: MEDIUM (judgment; four need human confirmation, see Open Questions)
- Pitfalls: HIGH (each tied to a read line or a measured pin)

**Research date:** 2026-10-20
**Valid until:** until the next commit that touches `install/`, `scripts/` or `agent-factory/`. Re-run the count script at plan time; counts are a snapshot at `218b12db`.
