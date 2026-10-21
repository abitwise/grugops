# Requirements: grugops

**Defined:** 2026-10-20
**Milestone:** v3.0 Specialist agents. Shared context. Coordinated work.
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grugops`, and gets a disciplined delivery team — a visible board, a shared context where nothing is written until it is verified, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy.

Decisions these requirements rest on: PROJECT.md Key Decisions tagged `[v3.0]` (D-1..D-9). Research: `.planning/research/SUMMARY.md`.

## v3.0 Requirements

### Graph memory (GRAPH)

- [x] **GRAPH-01**: A maintainer can read a recorded decision on graph memory (graphify and comparable tools evaluated) that states: not adopted, nothing built, what a user may do with such a tool themselves, and the trigger for revisiting it
- [x] **GRAPH-02**: The decision states that no graph-tool output enters the shared context without a verification stamp, and repeats no vendor token-saving number as a grugops result

### State layout (LAYOUT)

- [x] **LAYOUT-01**: A user's planning state lives under `memory-bank/plans/` (board, tickets, epics, features, sprints, releases, NFRs, traceability, metrics, UAT) — seed files, roles, workflows, tooling and docs all name the new paths
- [x] **LAYOUT-02**: One constants-only module owns every state path and budget; readers, writers, the validator, the installer and the uninstaller import it, and a gate fails on any old `plans/` spelling (slash, `join(...)` and backslash forms) outside a named allow-list, with a derived count
- [x] **LAYOUT-03**: Install pruning and uninstall both protect every state root, including `memory-bank/`, from one exported list
- [ ] **LAYOUT-04**: A user whose repo is still on the old layout keeps working after a kit update: roles fall back to `plans/` and print a one-line "run `install --migrate`" notice; a plain install refuses to seed new state on the old layout and names the command
- [x] **LAYOUT-05**: grugops's own repo state is moved to the new layout (dogfood)

### Per-file records and budgets (SPLIT)

- [ ] **SPLIT-01**: `board.md` is an overview: one short line per ticket per column and at most one `_Updated:` line; the board contract is changed first, and blocked reasons and other detail live in the ticket file
- [ ] **SPLIT-02**: Each NFR is its own file, and `nfr-catalog.md` is a one-line-per-NFR index
- [ ] **SPLIT-03**: Traceability is one file per ticket rendered from published note refs, with `traceability.md` as a one-line-per-ticket index; no role instructs an agent to append to traceability by hand
- [ ] **SPLIT-04**: The validator enforces per-file byte budgets for the board, indexes (per entry), tickets, NFR files, trace files and `60-progress.md`; budgets WARN on an unmigrated repo and FAIL on a migrated one
- [ ] **SPLIT-05**: A user's repo has a `tools/grugops/state-check.js` runnable (budgets generated from the layout module, freshness-gated) that checks budgets and index↔file integrity, called from the PR gate and daily-sweep workflows
- [ ] **SPLIT-06**: `60-progress.md` rolls older entries into an archive file when over budget; `queue/done/` and `50-decisions/` may only be moved to an archive folder, never squashed or pruned
- [ ] **SPLIT-07**: The ticket frontmatter key set stays closed (no new key without a recorded decision); new ticket detail goes into the ticket body

### Migration (MIGRATE)

- [ ] **MIGRATE-01**: A user can run `install --migrate` to move an old-layout repo to the v3 layout; `--dry-run` prints every planned move and split with per-file byte counts and writes nothing
- [ ] **MIGRATE-02**: Migration keeps the original monolith files unchanged in `memory-bank/plans/archive/pre-v3/` (outside every budget) and writes the split files as new files; nothing is deleted or rewritten in place
- [ ] **MIGRATE-03**: Migration proves line conservation (every original line appears in the split output or the archive) and rolls the split back if the proof fails
- [ ] **MIGRATE-04**: Migration detects old / new / both / neither layouts, refuses the "both" state and a non-empty `queue/claimed/`, writes a layout marker, and a second run is a byte-identical no-op
- [ ] **MIGRATE-05**: Board row trailers (blocked reasons, notes) are copied verbatim into ticket bodies, never reinterpreted
- [ ] **MIGRATE-06**: An opt-in flag moves finished-ticket `.grugops/context/` folders to a separate archive folder (move only; trace rendering still reads them)
- [ ] **MIGRATE-07**: Migration is dogfooded on a copy of `cli-chess-example` under a scratch `GRUGOPS_HOME`, with before/after sizes recorded

### Role machinery and engineer levels (TIER)

- [ ] **TIER-01**: The kit has a Tech Lead role that scores each ticket's complexity on a written per-factor rubric, records the score and the chosen engineer level in a note and the ticket body, and pre-plans the dev tasks
- [ ] **TIER-02**: One `software-engineer.md` role yields three generated Claude Code adapters — junior (haiku, effort medium), mid (sonnet), senior (opus) — each with its own effort; on the other five hosts the level is guidance
- [ ] **TIER-03**: Junior takes only tasks whose plan already fixes what to write, never security, migration, concurrency or test-integrity work; the D-09 amendment and the Claude Code v2.1.293 floor are recorded
- [ ] **TIER-04**: A stuck or twice-failed engineer escalates one level once, via a `failed-attempt` note and a queue re-enqueue — never a relayed prompt
- [ ] **TIER-05**: The kit has a Designer role that sets design strategy and guidelines; Frontend/UI reads them for per-ticket UI contracts
- [ ] **TIER-06**: Role and adapter sets stay derived: the adapter-name set, the coordinator's spawn allowlist, role/adapter counts, model/effort tiers and size ceilings all follow the filesystem, and the MODEL-01 baseline is re-pinned by recorded decision
- [ ] **TIER-07**: Roles can declare skills in frontmatter (`skills:`), admitted by the canonical frontmatter grammar

### Plain-language roles (PLAIN)

- [ ] **PLAIN-01**: No role carries a caveman block; the voice constraint, the section list, the voice guards, the writing profile, claim C-28-003 and `CLAUDE.md` change together in one atomic change, with the inverted guard seen failing first
- [ ] **PLAIN-02**: All 19 roles and the role-switch protocol are rewritten in clear, compact English that states each role's goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than today
- [ ] **PLAIN-03**: A role-rule inventory generated before the rewrite (no-fabrication, `UNKNOWN - verify`, WF16/WF18 pointers, absent-config fallback, board-move ownership as a partition) still holds after it
- [ ] **PLAIN-04**: All role files together stay within 67,383 bytes, enforced by a guard, with a recorded per-file ceiling for each role
- [ ] **PLAIN-05**: The engineer and Tech Lead roles carry grugops-authored "do less" rules adapted from ponytail (scope-first, reuse-before-build ladder, never-cut floor, one test for logic, `shortcut:` marker, "what was skipped" line), with MIT attribution in NOTICE and no borrowed benchmark numbers
- [ ] **PLAIN-06**: The PR review checklist has a lean-review lens that flags over-engineering
- [ ] **PLAIN-07**: Role text is a governed surface of the writing profile (lexicon and sentence gates pass on every role)

### Orchestrator flow (RUN)

- [ ] **RUN-01**: The Orchestrator's in-flight log is the queue's `claimed/` set rendered to `now-running.md`; it holds only running work and empties as tasks finish
- [ ] **RUN-02**: On every task completion the Orchestrator closes the finished agent and refills free capacity (`wip_limit` minus `claimed/` count, read from disk) with ready work — no timers, no polling
- [ ] **RUN-03**: "Session compaction" guidance (named apart from WF18 note compaction) tells the Orchestrator when to compact using signals it can observe, with a fresh session that re-reads the in-flight log as the fallback on every host
- [ ] **RUN-04**: The flow guidance lives in Workflow 17 with a one-line pointer in `orchestrator.md`, which stays under its size ceiling; it reads the same on all six hosts, with optional operator tips per host
- [ ] **RUN-05**: The queue tool (`claim.js`) ships to host repos as a materialized runnable so agents claim and complete tasks with it instead of by hand
- [ ] **RUN-06**: The Orchestrator starts tiered engineers by adapter name, never forks them and never overrides their model, and never claims a ticket itself

### Skills (SKILL)

- [ ] **SKILL-01**: Each role lists the skills it may use, with a built-in fallback checklist for when a skill is absent; the role-switch protocol tells non-Claude hosts how to find skills
- [ ] **SKILL-02**: A written evaluation of superpowers, code-simplifier, feature-dev, commit-commands, frontend-design and ui-ux-pro-max against grugops's floors (merge, branching, planning authority, telemetry, network, runtime deps) decides which are recommended
- [ ] **SKILL-03**: Recommended third-party skills are documented as optional, pinned installs — never vendored, never installed by grugops — and a rule stated once says grugops rules outrank any skill text
- [ ] **SKILL-04**: Frontend/UI uses ui-ux-pro-max when it is installed; the design-system files it creates are treated as user artifacts grugops reads but never writes
- [ ] **SKILL-05**: `install --check` warns (never fails, never installs) when a role declares a skill that is not found

### Story and docs (STORY)

- [ ] **STORY-01**: The README tells the new story — "grugops — Specialist agents. Shared context. Coordinated work." (lowercase brand) — replacing "the simple software factory"
- [ ] **STORY-02**: The main docs explain how grugops works and its core concept, show usage flows with worked examples, and link to every agent and skill page
- [ ] **STORY-03**: Every agent and skill has a reference page generated from the role and skill files and kept fresh by a gate
- [ ] **STORY-04**: Every new public page is inside the claim registry's checked file set before it is written; claims that move are re-dispositioned by id, never deleted
- [ ] **STORY-05**: The docs state open gaps honestly (own-session spawn capture is `UNKNOWN - verify`), make no cost or token-saving claims, and `CLAUDE.md` no longer names `/grug`

## Future Requirements

Deferred — tracked, not in this roadmap.

- **TIER-F1**: Calibrate the complexity rubric thresholds from about 30 scored tickets
- **TIER-F2**: Per-host level adapters on Codex, Copilot, OpenCode and Antigravity, behind a live capture and a per-host model config
- **RUN-F1**: Installer-written host compaction settings (Claude Code `autoCompactWindow`, Codex `model_auto_compact_token_limit`)
- **PLAIN-F1**: A measured comparison of old vs new roles on one ticket (tokens, rounds, quality) — the user may run it by hand
- Carried from v2.1: GAP-D1 own-session spawn capture, KIT-03/SPAWN-04 promotion, UATX-01/06, Windows (CAP-02, HOST-02), live per-host runs, backlog 999.1–999.11

## Out of Scope

| Feature | Reason |
|---------|--------|
| Adopting or building graph memory | Every candidate needs Python, SQLite or a graph DB; "not a database" stands (GRAPH-01) |
| Squashing or pruning `.grugops/context/`, `queue/done/` or `50-decisions/` | Audit trail stays whole; move-to-archive only (D-7, PROJECT decision) |
| Host-only mechanisms for flow or compaction | Behavior must be nearly the same on all six hosts |
| Vendoring third-party skills or depending on superpowers' coordinator loop | Runtime deps (Python), license drift, and a second dispatcher competing with the Orchestrator |
| Hidden automatic model routing | The level is a written, auditable Tech Lead decision |
| Haiku on judgment roles | D-2 limits haiku to the engineer junior level |
| Brand rename | Name kept; lowercase `grugops` kept |
| Cost or token-saving claims | Unmeasured; banned-claims gate |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GRAPH-01 | Phase 35 | Complete |
| GRAPH-02 | Phase 35 | Complete |
| LAYOUT-01 | Phase 36 | Complete |
| LAYOUT-02 | Phase 36 | Complete |
| LAYOUT-03 | Phase 36 | Complete |
| LAYOUT-04 | Phase 36 | Pending |
| LAYOUT-05 | Phase 36 | Complete |
| SPLIT-01 | Phase 37 | Pending |
| SPLIT-02 | Phase 37 | Pending |
| SPLIT-03 | Phase 37 | Pending |
| SPLIT-04 | Phase 37 | Pending |
| SPLIT-05 | Phase 37 | Pending |
| SPLIT-06 | Phase 37 | Pending |
| SPLIT-07 | Phase 37 | Pending |
| MIGRATE-01 | Phase 38 | Pending |
| MIGRATE-02 | Phase 38 | Pending |
| MIGRATE-03 | Phase 38 | Pending |
| MIGRATE-04 | Phase 38 | Pending |
| MIGRATE-05 | Phase 38 | Pending |
| MIGRATE-06 | Phase 38 | Pending |
| MIGRATE-07 | Phase 38 | Pending |
| TIER-01 | Phase 39 | Pending |
| TIER-02 | Phase 39 | Pending |
| TIER-03 | Phase 39 | Pending |
| TIER-04 | Phase 39 | Pending |
| TIER-05 | Phase 39 | Pending |
| TIER-06 | Phase 39 | Pending |
| TIER-07 | Phase 39 | Pending |
| PLAIN-01 | Phase 40 | Pending |
| PLAIN-02 | Phase 40 | Pending |
| PLAIN-03 | Phase 40 | Pending |
| PLAIN-04 | Phase 40 | Pending |
| PLAIN-05 | Phase 40 | Pending |
| PLAIN-06 | Phase 40 | Pending |
| PLAIN-07 | Phase 40 | Pending |
| RUN-01 | Phase 41 | Pending |
| RUN-02 | Phase 41 | Pending |
| RUN-03 | Phase 41 | Pending |
| RUN-04 | Phase 41 | Pending |
| RUN-05 | Phase 41 | Pending |
| RUN-06 | Phase 41 | Pending |
| SKILL-01 | Phase 42 | Pending |
| SKILL-02 | Phase 42 | Pending |
| SKILL-03 | Phase 42 | Pending |
| SKILL-04 | Phase 42 | Pending |
| SKILL-05 | Phase 42 | Pending |
| STORY-01 | Phase 43 | Pending |
| STORY-02 | Phase 43 | Pending |
| STORY-03 | Phase 43 | Pending |
| STORY-04 | Phase 43 | Pending |
| STORY-05 | Phase 43 | Pending |

**Coverage:**
- v3.0 requirements: 51 total
- Mapped to phases: 51 ✓
- Unmapped: 0

---
*Requirements defined: 2026-10-20*
*Last updated: 2026-10-20 after roadmap creation (Phases 35–43)*
