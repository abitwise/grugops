# Project Research Summary

**Project:** grugops, milestone v3.0 "Specialist agents. Shared context. Coordinated work."
**Domain:** File-based multi-agent software-delivery kit (markdown roles, workflows, shared verified context, board, gates) with a TypeScript tooling layer, installed on six host coding-agent CLIs
**Researched:** 2026-10-20
**Confidence:** MEDIUM overall. Repo-internal findings are HIGH (read and measured at `2057ecb8` and on the dogfood repo). Host-platform and third-party claims are CITED vendor pages that the confidence seam rates LOW. Complexity thresholds and tier effects are LOW to MEDIUM.

Detail lives in `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md` and `PITFALLS.md` in this folder. This file does not repeat them.

## Executive Summary

v3.0 is a repair-and-specialize milestone on a mature, heavily guarded kit. Nothing new is built from scratch except two roles (Tech Lead, Designer), a state-layout authority and a migrate arm. The measured problem is state bloat: on the dogfood repo the board is 718 KB, traceability 1.9 MB, the NFR catalog 369 KB and the largest ticket 238 KB. The root cause is that agents used the board as their in-flight log and hand-appended to generated files. The comparables (BMAD, GSD, Claude Code agent teams) all converge on the same fix: one file per record, a small computed overview, an index per collection. Roles, tiers, flow and docs all sit on top of that layout, so the layout comes first.

The recommended approach is to add no runtime or dev dependency, keep tiers as Claude Code generated adapters (`haiku`/`sonnet`/`opus` aliases) and guidance everywhere else, make the in-flight log the existing `.grugops/queue/claimed/` set (already rendered to `now-running.md`), and treat third-party skills as documented optional installs with a role-text fallback. Rewrite the ponytail "do less" rules as grugops text with MIT attribution. Do not adopt any graph-memory tool: every candidate adds Python, SQLite or a graph DB, and a code graph is derived data that could enter the shared context with no verification stamp. The "graph" grugops owns is the markdown index layer.

The main risks are all repo-specific and repeat known failure classes. (1) A shared-kit update breaks unmigrated repos on the same machine. (2) `--migrate` is the first operation that rewrites user state, a data-loss surface that needed four rounds in 33.1 and 34.1. (3) Retiring caveman and rewriting 19 roles can silently drop load-bearing rules (`UNKNOWN - verify`, no-fabrication, board-move ownership) and invalidates registry claim C-28-003. (4) Three engineer adapters break every "one role, one stem, one adapter" derivation. (5) Hand-kept lists (protected dirs, allowlists, counts) rot while green. Mitigations: a single path authority with a derived count, a frozen pre-v3 fixture and a line-conservation proof for the splitter, a mechanically derived role rule inventory as the rewrite oracle, and "derive the set, assert the count" before any new file lands.

## Key Findings

### Recommended Stack (STACK.md)

No new dependency of any kind. All v3.0 work is markdown, frontmatter and `fs.statSync` byte budgets in the existing validator. Node 22+, committed `.js`, zero host runtime deps are unchanged.

**Core technologies:**
- Claude Code sub-agent `model` + `effort` frontmatter: the three engineer adapters (junior `haiku`, mid `sonnet`, senior `opus`), generated through the existing `model-tiers.ts` and `MODEL_ALIASES`/`EFFORT_LEVELS`. Needs Claude Code v2.1.293 or later for `haiku` to mean Haiku 5.5, which supports effort.
- Agent Skills `SKILL.md`: one portable format on all six hosts. Five read `.agents/skills/`; Claude Code reads only `.claude/skills/` and plugin `skills/`. Roles name skills, give both paths and a built-in fallback checklist.
- Markdown index files as the graph: `nfr-catalog.md`, `traceability.md`, ticket links, checked by the validator.
- Byte budgets (not tokens) via `fs.statSync`. No tokenizer dependency.
- Rewrite, do not install: ponytail rules (MIT, one 2.7 KB `AGENTS.md`). Add attribution to NOTICE. Do not carry its benchmark numbers (they trip `guard_banned_claims`).

**Platform facts that shape the design:**
- Five of six hosts can start a sub-agent on its own model (Claude Code, Codex, Copilot, OpenCode, Antigravity). Pi cannot. Only Claude Code has a portable alias vocabulary; every other host needs a provider-specific string. So tiers are generated for Claude Code only, guidance elsewhere.
- No host lets the agent compact itself, and current flagship models cannot see their own token count. "Compact near 400k" must be written around observable proxies, with a fresh-session resume from disk as the universal fallback. Operator tips only; the installer writes nothing.
- A fork-mode spawn runs on the Orchestrator's model and ignores the tier. Tiered engineers must be named, non-fork spawns.
- Copilot CLI also loads `.claude/agents/`, so the tier adapters appear there too (`UNKNOWN - verify` bare `haiku` fallback).

### Expected Features (FEATURES.md)

**Must have (table stakes):**
- Plain-language compact role prompts, caveman blocks retired, within today's 67,383 B role corpus.
- ponytail-derived "do less" rules inside the engineer role text (rules in the main session do not reach spawned agents, so they must live in the adapter's role text).
- One file per ticket, board as a generated overview, `plans/` under `memory-bank/`, NFR one per file, trace one per ticket, index files, validator budgets, `install --migrate`.
- Orchestrator keeps capacity full: refill to `wip_limit` on each completion, close finished agents, a derived in-flight log, compaction guidance.
- Every agent and skill has a reference page linked from one main doc (generated, not hand-listed).

**Should have (differentiators):**
- Tech Lead with an auditable per-factor complexity score (six factors F1-F6, sum 0-12) written in the ticket; score maps to junior/mid/senior by a fixed table; escalate one tier once on BLOCKED or a second gate failure.
- Designer role (strategy and guidelines) separate from Frontend/UI (per-ticket contract).
- `## Skills` per role with fallbacks; Frontend/UI uses ui-ux-pro-max when installed (optional, needs Python 3).
- Lean review lens and `shortcut:` marker in the PR review checklist and engineer role.
- Storyline and layered docs.

**Defer (v3.x and later):**
- Rubric threshold calibration (needs about 30 scored tickets), per-host tier adapters on Codex/OpenCode/Copilot/Antigravity (needs live capture and a per-host model config), installer-written compaction settings, shortcut-debt ledger, agent-teams mode, any graph memory.

**Anti-features (decided against):** hidden auto model router; haiku for judgment roles; embedding superpowers/feature-dev coordinator loops; vendoring third-party skills; host-specific keep-busy hooks as the mechanism; polling loops; Orchestrator implementing work; resuming a finished engineer for a new ticket; squashing or pruning finished tickets; printing per-repo savings numbers.

### Architecture Approach (ARCHITECTURE.md)

Make one constants-only path and budget authority, `install/state-layout.ts`, and route every reader, writer, validator and installer through it. Add a derived adapter-name set (`listAgentAdapterNames()`) in `kit-model.ts` and a `LEVELS` table in `model-tiers.ts`, so one role can emit one to three adapters. Put flow control in WF17 (no new workflow, so `WORKFLOW_COUNT` and its derived pins do not move). Do not edit `scripts/voice-model.ts`: it is hash-pinned inside the admission hook's frozen manifest; delete or invert its consumers instead. Host repos get no `scripts/`, so budget enforcement ships as a new materialized runnable `tools/grugops/state-check.js` whose budget numbers are generated into a marked region and freshness-gated.

**Major components:**
1. `install/state-layout.ts` (new): state root, fixed subpaths, per-file budgets; two-sided pinned subpath count.
2. `install/state-migrate.ts` (new): pure split/conserve plan for the v3 migrate arm; originals kept unchanged in an archive folder; line-multiset conservation proof.
3. `scripts/runnable-ref/state-check.ts` to `tools/grugops/state-check.js` (new): host-side budget check invoked by WF05 and WF09.
4. Tier machinery: `levels:` role frontmatter key, `LEVELS` table, `listAgentAdapterNames()`; adapters 17 to 21, roles 17 to 19, coordinator grant 16 to 20, `SPAWN_GRANT_SCAN_COUNT` 33 to 37.
5. `trace-render.ts`/`trace-freshness.ts` reworked for per-ticket files plus index, reading the archive root too.
6. In-flight log = `.grugops/queue/claimed/` (already rendered to `now-running.md`, freshness-gated); no second file.
7. Catalog generator extended to emit `docs/reference/agents/*.md` and `docs/reference/skills/*.md`.

### Critical Pitfalls (PITFALLS.md)

1. **Shared kit update breaks unmigrated repos** (kit is installed once per machine): decide a layout fallback or an update refusal before roles hard-code new paths.
2. **Non-idempotent or destructive `--migrate`:** own layout marker, four-state detection (old/new/both/neither), one atomic rename, refuse with non-empty `claimed/`, never delete originals, frozen pre-v3 fixture, `GRUGOPS_HOME` set in every scratch run.
3. **State moved out of prune/uninstall protection:** `memory-bank` is absent from the installer's protected list; replace both hand-typed lists with one exported `STATE_ROOTS`.
4. **Role rewrite drops load-bearing rules and caveman retirement leaves pinned guards:** generate a role rule inventory as the acceptance oracle; flip caveman atomically (`ROLE_SECTIONS`, `guard_caveman_voice`, `guard_voice`, `writing-profile.md`, C-28-003, `CLAUDE.md`), inverted guard watched RED first; do not edit `voice-model.ts`.
5. **Three engineer adapters break 1:N derivations:** derive the adapter set and the coordinator allowlist; define the config namespace once; tier rationales are quality arguments only (cost vocabulary is banned).
6. Also load-bearing: the board grammar is closed (`TICKET_KEYS` is 8 keys; put new detail in ticket bodies, record any new key in `contracts/board.md` first); per-ticket trace must stay generated or the archive rule silently drops trace rows; budgets must be WARN on unmigrated and FAIL on migrated repos, per-entry for indexes; `orchestrator.md` must stay under its 7,165 B WARN ceiling; third-party skills must be pinned, optional and never process-defining; docs must extend the claim-registry file set and state GAP-D1 honestly.

## Implications for Roadmap

All four researchers agree on the invariants: state layout and path authority before the role rewrite; migration as its own phase; graph spike independent; docs last. They differ in two places, resolved below.

- **Rewrite vs tier machinery order.** PITFALLS ordered A2, A1, A3. ARCHITECTURE ordered machinery (39) before the rewrite (40). Recommendation: machinery first. Counts, ceilings and adapter derivations then move once, and all 19 roles are written once under a stable ceiling table. The caveman flip stays the first plan of the rewrite phase, as PITFALLS requires.
- **Flow guidance placement.** ARCHITECTURE folded it into the rewrite phase; PITFALLS gave it its own area. Recommendation: separate phase after the rewrite. It edits WF17 and a pointer in `orchestrator.md` (already near its ceiling) and depends on the final role text and the level adapters.

Suggested phases, numbered from 35:

### Phase 35: Graph-memory decision record
**Rationale:** Cheap, independent, can run in parallel with 36. Only effect on others is whether `state-layout` reserves a derived-index path.
**Delivers:** A recorded decision in `.planning/` Key Decisions: do not adopt, build nothing; allowed posture (user may install a tool, roles may read its output as an aid, nothing enters shared context unverified); revisit trigger.
**Avoids:** Pitfall 19 (spike becoming a database), Pitfall 15 (restating vendor token claims). Zero files changed outside `.planning/`.

### Phase 36: State-layout authority, path move and protection
**Rationale:** Everything else names these paths. 101 role lines, 19 workflows, 14 TS sources and about 185 fixtures reference `plans/`.
**Delivers:** `install/state-layout.ts`; seed moved to `seed/memory-bank/plans/**`; readers, validator, trace tools, `board-corpus`, banned-claims exclusions on the new paths; `INVARIANT` text regenerated into adapters and skills; AGENTS.md and claim-registry rows updated; one exported `STATE_ROOTS` for prune and uninstall (adds `memory-bank`); old-layout behavior (see D-4); the repo's own `plans/` moved (dogfood).
**Avoids:** Pitfalls 1, 3, 4. Three-spelling derived grep-to-zero gate (slash, `join(...)`, backslash) with a named allow-list.
**Note:** Mechanical path edits to roles only if cheap; the full rewrite in Phase 40 rewrites them once.

### Phase 37: Overview board, per-file records and budgets
**Rationale:** Budgets need the final file set; board grammar decisions must land before the Tech Lead adds anything.
**Delivers:** Board contract updated first (overview row, one short line per ticket, no in-flight text, at most one `_Updated:` line); per-NFR files and per-ticket trace files with one-line indexes; trace render and freshness as directory compares reading the archive root; ticket and file budgets in the validator; `state-check.js` runnable with generated budget region, called from WF05 and WF09; roles' "Append to traceability" wording replaced (see D-6).
**Avoids:** Pitfalls 5, 6, 7. New detail goes in ticket bodies; no ninth ticket key without a recorded decision; budgets WARN until the layout marker says migrated; per-entry index budgets.

### Phase 38: `install --migrate` v3 (own phase, data-loss surface)
**Rationale:** The only phase that rewrites user data. Needs the final layout from 36 and 37. Give it its own verification and adversarial review rounds.
**Delivers:** `install/state-migrate.ts`; v3 layout marker; four-state detection; atomic directory move; additive split with originals kept unchanged in an archive folder (`archive/pre-v3/`); verbatim trailer copy into ticket bodies; line-conservation proof with rollback of the split; `--dry-run` with per-file byte counts; opt-in `--archive-done-context` (move-only); dogfood on a copy of `cli-chess-example` under a scratch `GRUGOPS_HOME`.
**Avoids:** Pitfalls 2, 5. Frozen pre-v3 fixture in the first plan; second run is a byte-identical no-op; refuse when `claimed/` is non-empty; refuse the both-roots state.

### Phase 39: Role machinery: levels, Tech Lead and Designer shells, skills key
**Rationale:** Move every count-bearing guard once, before the rewrite touches all roles.
**Delivers:** `levels:` key and `LEVELS` table; `listAgentAdapterNames()`; generator 1:N; `ROLE_COUNT` 17 to 19, `SPAWN_GRANT_SCAN_COUNT` 33 to 37, `TIERED` 19 rows, `roleCeiling()` entries, derived pins (`TECHNICAL_NAMES_COUNT`, `AUDIT_SET_COUNT`, `WATCHED_CORPUS_MIN`); config namespace for level stems; MODEL-01 amendment and baseline re-pin (D-3); `skills:` key and `CANONICAL_SCHEMA` admission (flow-form list preferred, grammar `UNKNOWN - verify`); Tech Lead and Designer role files (first draft, plain English); routing matrix; Tech Lead score rubric as a recorded note shape (no new ticket keys); named non-fork spawn rule; escalation as a queue re-enqueue with a `failed-attempt` note; junior hard exclusions (security, migration, concurrency, test integrity).
**Avoids:** Pitfalls 12, 13. Coordinator allowlist generated from the derived adapter list; tier rationales without cost vocabulary.

### Phase 40: Plain-language role rewrite
**Rationale:** One pass over the whole 19-role corpus plus the role-switch protocol, after paths (36-38) and the role set (39) are fixed.
**Delivers:** Atomic caveman flip as plan 1 (`ROLE_SECTIONS`, `guard_caveman_voice` inverted so no fence can return, `guard_voice` over whole files, `writing-profile.md`, C-28-003 re-dispositioned by id, `CLAUDE.md` Voice discipline); role rule inventory generated first and re-asserted after; `00-base.md` diff-disposition re-base by recorded decision with frozen safety clauses kept verbatim; corpus-total byte guard; ponytail ladder, floor, scope-first, finish-the-change, one-test-for-logic, `shortcut:` marker and "Not checked" line in `software-engineer.md` and the Tech Lead; Lean lens in `pr-review-checklist.md`; fixtures regenerated.
**Avoids:** Pitfalls 8, 9, 10, 11. Absent-config sentence byte-identical or its registry rows updated in the same commit.

### Phase 41: Orchestrator flow guidance
**Rationale:** Needs final role text and level adapters. Touches WF17 and a one-line pointer in `orchestrator.md`.
**Delivers:** Refill rule (free = `wip_limit` minus count of `claimed/`, computed from disk on each completion event, capped by DoR-passing work, no timers); close rule (on-disk `done/` transition plus published notes); `now-running.md` as the in-flight log with optional `agent:`/`level:` claim fields as a recorded contract change; session compaction written with observable proxies, named "session compaction" to avoid collision with WF18 note compaction, fresh-session resume as the universal fallback; operator tips for Claude Code, Codex and Pi; "never pass a per-invocation `model` to a tiered adapter"; Orchestrator never claims a ticket.
**Avoids:** Pitfall 14. No new hand-kept log, no token-count trigger, `orchestrator.md` under 7,165 B, dual-path equivalence oracle still green.

### Phase 42: Skills per role and skills evaluation
**Rationale:** Needs the `skills:` key (39) and final role text (40).
**Delivers:** `skills:` populated per role; `## Skills` guidance with conditional use and fallback; role-switch-protocol step; `--check` doctor WARN (never FAIL, never install) for declared skills not found; evaluation matrix for superpowers, code-simplifier, feature-dev, commit-commands, frontend-design, ui-ux-pro-max against grugops floors (merge, branch, planning authority, telemetry, network, runtime deps); precedence rule stated once (grugops outranks any skill); recommended skills by pinned reference; Designer content and Frontend/UI reading it; `design-system/` treated as a user artifact grugops references and never writes.
**Avoids:** Pitfalls 16, 17, 18. No preload of third-party skills. `allowed-tools` vs `permissions.ask` order verified or recorded `UNKNOWN - verify`.

### Phase 43: Story and layered docs
**Rationale:** Describes the finished system; the reference layer is generated from role and skill files.
**Delivers:** Catalog generator emits `docs/reference/agents/*.md` and `docs/reference/skills/*.md` (freshness-gated); README story, how-it-works, core concept, usage flows and examples; claim-registry file set extended to every new public page before writing; C-28-002/C-28-003 re-dispositioned by id (never delete anchors); GAP-D1 wording kept ("parallel on hosts with a spawn tool; own-session capture is `UNKNOWN - verify`"); `CLAUDE.md` `/grug` to `/grugops` drift fixed; cost/token sweep.
**Avoids:** Pitfalls 15, 20.

### Phase Ordering Rationale

- 36 before 37 before 38: each builds the layout the next consumes. 36 and 37 may merge if fewer phases are wanted, but keep 38 separate.
- 37 before 39: the Tech Lead consumes the board-grammar decisions rather than adding its own keys.
- 39 before 40: counts, ceilings and adapter derivations move once; roles are rewritten under a stable ceiling table.
- 41 after 40: flow text lives in a workflow plus one pointer line, under a settled `orchestrator.md`.
- 43 last: generated reference pages need every role, level and skill to exist.
- Budget extra gap rounds (under the four-round cap) for 38 (data-conserving splitter) and 39 (count-and-membership guards); both are classes this repo has historically needed several rounds to close.

### Research Flags

Needs deeper research during planning (`/gsd-plan-phase <N> --research-phase`):
- **Phase 38:** migrate state machine, trace-render multi-root design, shapes in real hand-written boards (conservation proof).
- **Phase 39:** kit-model variant mechanism, config namespace, `CANONICAL_SCHEMA` list grammar, per-host model-field semantics, `effort` behavior on haiku.
- **Phase 41:** what each of the six hosts exposes about context usage (assume nothing visible); whether `claim.js` must become a materialized runnable.
- **Phase 42:** `allowed-tools` vs `permissions.ask` evaluation order; per-host skill discovery.

Standard patterns, skip research-phase:
- **Phase 35:** decision record.
- **Phase 36:** large but mechanical; follows the v1.1 kit-vs-state rewrite precedent.
- **Phase 37:** well-defined once the contract is edited first.
- **Phase 40:** atomic-flip and inventory patterns already exist in the repo.
- **Phase 43:** catalog generator and registry anchors already exist.

### Decisions Needed From The Human

Items are open. Each should be resolved in requirements or in the named phase's discuss step.

- **D-1 Byte budget definition (Phase 40, affects 39).** Per-file ceilings re-baselined from the rewrite, or a single corpus total of 67,383 B? Do Tech Lead and Designer count inside it, or does it cover only the existing 18 files? Research: caveman fences free only about 2.3-2.7 KB; two new roles add about 3.3-3.7 KB each; a total that includes them forces a net cut of roughly 4-5 KB from existing roles. Recommend: a total budget that includes the two new roles, plus a recorded per-file `roleCeiling` entry for each, with flow detail kept in workflows.
- **D-2 D-09 "no haiku" amendment and Claude Code floor (Phase 39).** The junior tier reverses D-09 ("NO ROLE IS ASSIGNED `haiku`"). Recommend: amend by recorded decision, scoped to the engineer role only, junior restricted to tasks with F2=0 and F3=0, never security, migration, concurrency or test integrity; document Claude Code v2.1.293 as the floor for `haiku` plus `effort`, and have `--check` warn on an older version if it can read it (shelling out to `claude --version` is new behavior, `UNKNOWN - verify`). Also confirm the junior effort level (`low` vs `medium`).
- **D-3 MODEL-01 byte-identical-adapter amendment (Phase 39).** Level adapters carry pinned models and efforts at zero config, which `adapter-byte-baseline.test.ts` forbids. Recommend: amend MODEL-01 and re-pin the baseline by decision; do not loosen the test. Also decide whether a user's existing `models.roles.software-engineer` key collapses all three tiers, applies to one, or is refused.
- **D-4 Old-layout behavior of a v3 kit (Phase 36).** ARCHITECTURE recommends plain install refuse to seed state on an old layout and print the `--migrate` command. PITFALLS recommends roles use `memory-bank/plans/` if present, else `plans/`, with a one-line notice, so a shared-kit update never breaks unmigrated repos. These conflict. Recommend: PITFALLS option (degrade, never break) for the read path, plus ARCHITECTURE's refusal for the install seed path only.
- **D-5 Tiers Claude-Code-only or per-host (Phase 39).** Recommend Claude Code only in v3.0 (the only portable alias vocabulary; own-session spawn still unproven, GAP-D1), guidance on the other five hosts, documented by host as was done for Pi. Park per-host adapters behind a live capture.
- **D-6 Per-ticket trace files: generated or agent-written (Phase 37).** Host repos have no `trace-render.js`, and the 1.9 MB trace is evidence that agents hand-append today. PITFALLS wants it generated and every role's "Append to traceability" instruction removed; ARCHITECTURE recommends one shape for both, agent-written on hosts and generated and freshness-checked in grugops's own tree. Recommend: one file shape, roles publish refs per WF16, and a materialized render step or `state-check` verifies index-to-file integrity on hosts. Needs a decision before roles are rewritten.
- **D-7 Budgets for unbounded growth surfaces (Phase 37).** `.grugops/queue/done/` (6.2 MB, 1,128 files), `memory-bank/50-decisions/` (1.1 MB, 46 ADRs) and `memory-bank/60-progress.md` (90 KB) are unbounded and not named in the milestone. Decide per surface: budget, archive folder, or leave. `.grugops/context/` is excluded by the standing decision.
- **D-8 Migrate keeps originals in an archive folder (Phase 38).** Recommend yes. Monolith originals move unchanged to `memory-bank/plans/archive/pre-v3/`; split outputs are new files; nothing is deleted or rewritten in place. Confirm the folder name and whether originals count against any budget (recommend no).
- **D-9 Small items.** Whether `claim.js`/`context-io.js` become materialized runnables so WF17 is executable as written on host repos (dogfood shows agents doing the protocol by hand); whether roles join the governed writing-profile surfaces (recommend yes, gate watched RED first; otherwise record that roles are governed only by the inventory oracle and byte budget); whether to add a `level` ticket key (recommend no in v3.0, keep it in the Tech Lead decision note and ticket body).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Host capability rows quote vendor docs (CITED) but the seam rates web providers LOW. Open items: OpenCode v1 vs v2 line, Antigravity agent path, Copilot fallback for bare `haiku`, `effort` on haiku, self-visibility of token usage. |
| Features | MEDIUM | Prompt and skill text read verbatim (HIGH). Complexity thresholds are starting values (LOW); no independent rubric exists. Benchmarks are self-reported (ponytail, graphify). |
| Architecture | HIGH for integration points | Counts and call sites measured on the tree and the dogfood repo. Designs are judgment (MEDIUM). |
| Pitfalls | HIGH for repo-internal | Each cited from files at `2057ecb8`. External tool behavior and supply-chain figures are LOW. |

**Overall confidence:** MEDIUM. Phases 36-38 and 40 rest on HIGH evidence. Phases 39, 41 and 42 depend on host behavior that is documented but not live-verified.

### Gaps to Address

- **Per-invocation effort on Claude Code.** FEATURES says current docs allow a per-invocation `effort` parameter for non-fork subagents (and calls the GSD reference stale). STACK says no per-invocation effort is documented. Verify before the Orchestrator rule is written; tier adapters remain the right vehicle either way.
- **Path-occurrence counts differ.** ARCHITECTURE counts 1,293 occurrences in 336 files; PITFALLS counts 1,187 lines in 336 files. Different regexes. The Phase 36 gate must derive its own count rather than quote either.
- **Whether `claim.js` and `context-io.js` exist on hosts.** Not materialized today; resolve in Phase 41 (and D-9).
- **Canonical frontmatter grammar for `skills:`.** Block list vs flow list. Resolve in Phase 39.
- **Per-host context-usage visibility and OpenCode/Antigravity specifics.** Treat as invisible; guidance uses proxies.
- **Tier effect on cost or quality is unmeasured.** No cost claim ships until `scripts/measure-cost.ts` produces a real capture; calibrate the rubric from logged ticket records (about 30 scored tickets).
- **GAP-D1 (own-session spawn) is still unproven on Claude Code.** Docs and storyline must say so; do not extend spawning to other hosts in v3.0.
- **Skill supply-chain and telemetry claims** are LOW-confidence third-party reports; treat them as a reason to pin and disclose, not as measured fact.

## Sources

### Primary (HIGH confidence)
- Repo tree at `2057ecb8` and the read-only dogfood repo `cli-chess-example` (measured): `scripts/kit-model.ts`, `model-tiers.ts`, `generate-role-adapters.ts`, `check-foundation-guards.ts`, `board-model.ts`, `board-read.ts`, `trace-render.ts`, `trace-freshness.ts`, `validate-agent-factory.ts`, `claim.ts`, `canonical-frontmatter.ts`, `install/install.ts`, `install/uninstall.ts`, `agent-factory/**`, `docs/audit/28-claim-registry.md`, `.planning/PROJECT.md`
- ponytail, superpowers 7.0.0, Anthropic official plugins, ui-ux-pro-max, BMAD-METHOD, GSD gsd-core 1.18.0: files read verbatim (installed or via GitHub API), retrieved 2026-10-20
- Claude Code docs (sub-agents, model-config, skills, agent-teams, plugins-reference, costs), Codex, Copilot, OpenCode, Antigravity and Pi vendor docs and release notes, agentskills.io specification, retrieved 2026-10-20 (CITED; seam rates LOW)

### Secondary (MEDIUM confidence)
- ponytail benchmark reports (author-run, disclosed method, no independent replication)
- MAST (arXiv 2503.13657v3), Aider architect/editor mode, SWE-bench Verified difficulty labels, MetaGPT summaries

### Tertiary (LOW confidence, needs validation)
- Graphify cloud token-saving claim (71.5x self-reported; 5-10x independent), CodeGraph and Serena metadata, community model-routing rubrics, Haiku 4.5 press coverage, skill supply-chain studies (Snyk ToxicSkills, arXiv 2605.11418)

---
*Research completed: 2026-10-20*
*Ready for roadmap: yes, after the decisions in "Decisions Needed From The Human" are taken*
