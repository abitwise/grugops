# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- ✅ **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (shipped 2026-07-28)
- ✅ **v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board** — Phases 27–34.1 (shipped 2026-10-18, gaps accepted)
- 🚧 **v3.0 Specialist agents. Shared context. Coordinated work.** — Phases 35–43 (in progress, started 2026-10-20)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: it opened with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase wrote into a guarded environment; then a senior-persona overhaul laid the substrate, BDD+TDD closed the business→engineer handoff, a frontend/UI persona and an ASVS security audit ran as parallel content streams, then a TypeScript tooling migration converted the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converged all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update landed as an independent track, a generated docs catalog documented the finished 17-role / 16-workflow set, and finally Phase 19 reopened the milestone post-Phase-18 to add an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 was a major architecture pivot, and it landed.** It replaced the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other CLIs degrade to sequential over the same files, converging on identical on-disk artifacts as proven by a dual-path equivalence oracle). grugops's differentiator is mechanical: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp the writing agent cannot forge or self-set.

**v2.1 made it runnable and closed with its headline unproven.** Every guard and validator scan set now derives from the filesystem and all 17 role adapters are generated from one source; a controlled-language profile is held by three gates; per-role model and effort dials reach installed repos; every human stop is a dialable checkpoint over a git-host hard floor (the Bash command-parsing guard was retired, 33.1 D-17); a read-only live board renders the state; Pi joined as a sixth host and the installer installs per named agent. The captured live run proving role agents work in their own sessions (GAP-D1, CAP-01/CAP-03) was attempted three times and read `fail` each time — it is carried forward, not fabricated. Seven of thirteen phases closed by recorded human decision at the four-round gap-closure cap. Audit: `milestones/v2.1-MILESTONE-AUDIT.md` (`gaps_found`, 52/64, accepted).

**The expensive lesson, twice over:** a green suite is a precondition, never proof, for a safety invariant (v2.0: 13 catches). v2.1 added the remedy for loops that will not converge — a canonical form that refuses everything outside one allow-list, or moving enforcement to the system of record — and a four-round cap after which a human closes the phase by decision.

**v3.0 makes the kit easier to read and keeps its state files small.** The measured problem is state bloat on the dogfood repo (board 718 KB, traceability 1.9 MB, NFR catalog 369 KB), caused by agents using the board as their in-flight log and hand-appending to generated files. v3.0 moves planning state under `memory-bank/plans/` behind one path authority, splits it into one file per record with small indexes and byte budgets, migrates existing repos without deleting anything, adds a Tech Lead that sizes work for three engineer levels and a Designer, rewrites every role in plain English, keeps the Orchestrator's capacity full, lets roles pick skills, and retells the story with layered docs. Graph memory is decided against, not built.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v2.1 ran Phases 27–34.1; v3.0 runs Phases 35–43.

<details>
<summary>✅ v1.0 MVP — Full Agent Factory v2 (Phases 1–6) — SHIPPED 2026-06-04</summary>

- [x] Phase 1: Substrate, Config & State Skeleton (5/5 plans) — completed 2026-06-02
- [x] Phase 2: Shared Contracts (4/4 plans) — completed 2026-06-03
- [x] Phase 3: Roles & AGENTS.md Substrate (8/8 plans) — completed 2026-06-03
- [x] Phase 4: Workflows, Cadence & Backpressure (7/7 plans) — completed 2026-06-03
- [x] Phase 5: Packaging, Adapters, Install & Distribution (5/5 plans) — completed 2026-06-03
- [x] Phase 6: Validation, Brand & Dogfood (5/5 plans) — completed 2026-06-04

Full phase details + milestone summary: `milestones/v1.0-ROADMAP.md` · requirements: `milestones/v1.0-REQUIREMENTS.md`

</details>

<details>
<summary>✅ v1.1 Install & Distribution (Phases 7–9) — SHIPPED 2026-06-08</summary>

- [x] Phase 7: Shared-Home Foundation & Path Rewrite (4/4 plans) — completed 2026-06-06
- [x] Phase 8: Two-Root Installer (4/4 plans) — completed 2026-06-07
- [x] Phase 9: Doctor & Two-Root Validator (6/6 plans) — completed 2026-06-08

Full phase details + milestone summary: `milestones/v1.1-ROADMAP.md` · requirements: `milestones/v1.1-REQUIREMENTS.md` · audit: `milestones/v1.1-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v1.2 SDLC Depth, Quality Discipline & Browsable Docs (Phases 10–19) — SHIPPED 2026-06-16</summary>

- [x] Phase 10: SDLC-Coverage Audit & Foundation Guards (4/4 plans) — completed 2026-06-10
- [x] Phase 11: Senior Persona Overhaul (5/5 plans) — completed 2026-06-10
- [x] Phase 12: BDD + TDD Wiring (5/5 plans) — completed 2026-06-11
- [x] Phase 13: Frontend/UI Persona & Design→Build Workflow (3/3 plans) — completed 2026-06-11
- [x] Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor (3/3 plans) — completed 2026-06-13
- [x] Phase 15: TypeScript Tooling Migration (6/6 plans) — completed 2026-06-13
- [x] Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity (3/3 plans) — completed 2026-06-14
- [x] Phase 17: Install --migrate / --update (3/3 plans) — completed 2026-06-15
- [x] Phase 18: Browsable Docs Catalog (2/2 plans) — completed 2026-06-15
- [x] Phase 19: Factory Auto-UAT Harness — Tier 1 Oracles + Tier 2 Headless E2E (4/4 plans) — closed 2026-06-16 (A3/DOG-02 live dual-path parity human-waived → next milestone)

Full phase details + milestone summary: `milestones/v1.2-ROADMAP.md` · requirements: `milestones/v1.2-REQUIREMENTS.md` · audit: `milestones/v1.2-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v2.0 Decentralized Factory — Shared Verified Context (Phases 20–26) — SHIPPED 2026-07-28</summary>

- [x] Phase 20: Shared-Context Substrate & Concurrency Foundation (4/4 plans) — completed 2026-06-17
- [x] Phase 21: Verify-Before-Write Admission (4/4 plans) — completed 2026-06-17
- [x] Phase 22: Memory & Trajectory Compaction (9/9 plans) — completed 2026-06-19 (8 rounds; 7 distinct bypasses of one silent-absorb class, closed structurally)
- [x] Phase 23: Parallel Execution & Orchestrator-as-Decomposer (3/3 plans) — completed 2026-06-21 (guard_wr05 inverted)
- [x] Phase 24: Clean Handoff Removal & Traceability Migration (5/5 plans) — completed 2026-06-22 (all 17 handoff templates deleted grep-to-zero)
- [x] Phase 25: Governance-on-a-Dial (13/13 plans) — completed 2026-06-29 (8 rounds; closed on 2 independent red-teams NO_BYPASS + 19/19 self-repro + human approval)
- [x] Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement (6/6 plans) — completed 2026-07-24 (retirement gate correctly held shut — GAP-D1)

Full phase details + milestone summary: `milestones/v2.0-ROADMAP.md` · requirements: `milestones/v2.0-REQUIREMENTS.md` · audit: `milestones/v2.0-MILESTONE-AUDIT.md` · phase artifacts: `milestones/v2.0-phases/`

</details>

<details>
<summary>✅ v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board (Phases 27–34.1) — SHIPPED 2026-10-18 (gaps accepted)</summary>

- [x] Phase 27: Spawn Correctness & Kit-Set Authority (66/66 plans) — completed 2026-08-11 (closed by user override; KIT-03/SPAWN-04 held open)
- [x] Phase 28: Kit Consistency Audit (8/8 plans) — completed 2026-08-12
- [x] Phase 29: Controlled Language & Voice Guard Rebuild (60/60 plans) — completed 2026-08-18 (closed by user override; LANG-04 rewritten as content, D-59)
- [x] Phase 29.1: Per-Role Model Assignment (INSERTED) (25/25 plans) — closed 2026-09-03 by user override D-29.1-19
- [x] Phase 29.2: Model Assignment Delivery Path (INSERTED) (6/6 plans) — completed 2026-09-07
- [x] Phase 30: Per-Checkpoint Autonomy Matrix (11/11 plans) — completed 2026-09-07
- [x] Phase 31: Autonomous Manual Testing (44/44 plans) — closed 2026-09-13 by user override D-44 (UATX-01/06 open)
- [x] Phase 32: Board Projector & CLI Dashboard (34/34 plans) — completed 2026-09-17
- [x] Phase 32.1: Board Dashboard Deferred Residuals (INSERTED) (15/15 plans) — completed 2026-09-18
- [x] Phase 33: Live Capture & Windows Portability (43/43 plans) — closed 2026-09-25 by human override D-33-R4-08 (CAP-01..03 not met, GAP-D1 open)
- [x] Phase 33.1: Phase 33 Leftovers: Guard Retirement First (INSERTED) (43/43 plans) — completed 2026-10-05 (Bash guard retired, D-17)
- [x] Phase 34: Model Effort Dial & Pi Support (36/36 plans) — closed 2026-10-10 by human decision D-28 (HOST-02 open)
- [x] Phase 34.1: Per-agent installer (INSERTED) (62/62 plans) — closed 2026-10-17 by human decision D-48

Full phase details + milestone summary: `milestones/v2.1-ROADMAP.md` · requirements: `milestones/v2.1-REQUIREMENTS.md` · audit: `milestones/v2.1-MILESTONE-AUDIT.md` · phase artifacts: `milestones/v2.1-phases/` · quick tasks: `milestones/v2.1-quick/`

</details>

### 🚧 v3.0 Specialist agents. Shared context. Coordinated work. (Phases 35–43) — ACTIVE

**Milestone goal:** Make grugops easier to understand, cheaper to run and better at keeping parallel work moving: plain-language roles, a state layout whose files stay small, a Tech Lead that sizes work for three engineer levels, an Orchestrator that keeps capacity full, roles that pick skills, and a new storyline with layered docs.

- [x] **Phase 35: Graph-memory decision record** - one recorded decision: graph memory is not adopted, nothing is built, what a user may do with such a tool themselves, and when to revisit (completed 2026-10-20)
- [x] **Phase 36: State-layout authority, path move and protection** - planning state moves under `memory-bank/plans/` behind one constants-only path authority, protected from prune and uninstall, with old-layout repos still working (completed 2026-10-21)
- [ ] **Phase 37: Overview board, per-file records and budgets** - the board becomes a one-line-per-ticket overview, NFRs and traceability become one file per record with indexes, and byte budgets are checked in grugops and in host repos
- [ ] **Phase 38: install --migrate v3** - an old-layout repo moves to the v3 layout with one command that keeps every original, proves line conservation and re-runs as a no-op (the data-loss surface, in its own phase)
- [ ] **Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key** - a Tech Lead scores and pre-plans, one engineer role yields junior/mid/senior adapters on Claude Code, a Designer role exists, roles can declare skills, and every role and adapter set stays derived
- [ ] **Phase 40: Plain-language role rewrite** - caveman retired in one atomic change; all 19 roles and the role-switch protocol rewritten in clear, compact English within 67,383 bytes, every load-bearing rule kept, "do less" rules added
- [ ] **Phase 41: Orchestrator flow guidance** - the Orchestrator reads running work from disk, refills free capacity on each completion, knows when to start a fresh session, and the same guidance works on all six hosts
- [ ] **Phase 42: Skills per role and evaluation** - each role names the skills it may use with a fallback, third-party skills are evaluated and recommended only as optional pinned installs, and the doctor warns on a missing skill
- [ ] **Phase 43: Story and layered docs** - the README tells the new story, the main docs explain how grugops works with worked examples, and every agent and skill has a generated, freshness-gated reference page

**Dependencies:** 35 is independent and may run in parallel with 36. 36 → 37 → 38. 37 → 39, so 39 may run in parallel with 38. 39 → 40 → 41. 42 needs both 39 and 40. 43 needs every other phase.

**Gap-closure cap:** every phase gets at most four gap-closure rounds; after that a human closes it by decision or override, with the residuals recorded. Budget the extra rounds for Phase 38 (the data-conserving splitter) and Phase 39 (count-and-membership guards); this repo has needed several rounds to close both classes before.

**Research flags:** plan Phases 38, 39, 41 and 42 with `/gsd-plan-phase <N> --research-phase`. Phases 35, 36, 37, 40 and 43 follow patterns already in the repo.

**Decisions this milestone rests on:** PROJECT.md Key Decisions tagged `[v3.0]` (D-1..D-9). Research: `research/SUMMARY.md` (detail in `research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`).

**Carried from v2.1 and not scheduled here:** GAP-D1 own-session spawn capture, KIT-03/SPAWN-04 promotion, UATX-01/06, Windows (CAP-02, HOST-02), live per-host runs, backlog 999.1–999.11 (see REQUIREMENTS.md Future Requirements). The `CLAUDE.md` `/grug` drift lands in Phase 43 (STORY-05).

## Phase Details

### Phase 35: Graph-memory decision record

**Goal**: A maintainer can read one recorded decision that settles graph memory for v3.0: not adopted and nothing built, so no later phase builds or reserves anything for it
**Depends on**: Nothing (independent; may run in parallel with Phase 36)
**Requirements**: GRAPH-01, GRAPH-02
**Success Criteria** (what must be TRUE):
  1. A maintainer can open one recorded decision that names graphify and the comparable tools evaluated and states that graph memory is not adopted and nothing is built (GRAPH-01)
  2. The decision states what a user may do with such a tool themselves and names the concrete trigger for revisiting the decision (GRAPH-01)
  3. The decision states that no graph-tool output enters the shared context without a verification stamp, and it repeats no vendor token-saving number as a grugops result (GRAPH-02)
  4. No file outside `.planning/` changes in this phase

**Plans**: 1/1 plans complete

Plans:
**Wave 1**

- [x] 35-01-PLAN.md — TRACER: the `[v3.0, D-10]` Key Decisions row leads to `35-DECISION.md` (not adopted, nothing built); then the tools table, reasons, posture, stamp rule, no-figure vendor statement and both-conditions trigger; then a reader review confirms no figure, and git checks confirm no change outside `.planning/` and green PROJECT.md readers [GRAPH-01, GRAPH-02]

**Notes**: Standard pattern (decision record); no research phase needed.

### Phase 36: State-layout authority, path move and protection

**Goal**: Every part of grugops names planning state under `memory-bank/plans/` through one path authority, state is never pruned or uninstalled, and a repo still on the old layout keeps working after a kit update
**Depends on**: Nothing (first phase of the layout chain; builds on shipped v2.1)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05
**Success Criteria** (what must be TRUE):
  1. A fresh install seeds the board, tickets, epics, features, sprints, releases, NFRs, traceability, metrics and UAT under `memory-bank/plans/`, and seed files, roles, workflows, tooling and docs all name the new paths (LAYOUT-01)
  2. One constants-only layout module is the only place a state path or budget is spelled: readers, writers, the validator, the installer and the uninstaller import it, and a gate fails on any old `plans/` spelling (slash, `join(...)` or backslash form) outside a named allow-list whose count is derived, not typed (LAYOUT-02)
  3. Install pruning and uninstall both leave every state root, including `memory-bank/`, untouched, and both read that set from one exported list (LAYOUT-03)
  4. A user whose repo is still on the old layout keeps working after a kit update: roles fall back to `plans/` and print a one-line "run `install --migrate`" notice, and a plain install refuses to seed new state there and names the command (LAYOUT-04)
  5. grugops's own repo state lives in the new layout and its validator and gates pass on it (LAYOUT-05)

**Plans**: 14/14 plans complete

Plans:
**Wave 1**

- [x] 36-01-PLAN.md — TRACER: `install/state-layout.ts` (constants only, `STATE_ROOTS`, `LEGACY_FALLBACK_CLAUSE`) and one protected list read by prune and uninstall; then the two-sided count pin and one-list checks; then the scan core `scripts/state-path-scan.ts` every later plan proves its slice with [LAYOUT-02, LAYOUT-03]

**Wave 2**

- [x] 36-02-PLAN.md — TRACER: the seed moves to `agent-factory/seed/memory-bank/plans/` (plus `uat/`), the doctor checks the board there and every seed-board reader follows, in one green commit [LAYOUT-01, LAYOUT-02]

**Wave 3**

- [x] 36-03-PLAN.md — TRACER: install.ts names the legacy handoffs directory through the authority with unchanged output; then every remaining installer test does, the backup-listing helper reading ENOENT and ENOTDIR as absent [LAYOUT-02]

**Wave 4**

- [x] 36-04-PLAN.md — TRACER: the board tracer reads the repository board through `FIXED_SUBPATHS`; then the read-seam and watch tests derive every state path from that table (no behavior change) [LAYOUT-02]

**Wave 5**

- [x] 36-05-PLAN.md — TRACER: the dashboard and model tests follow `FIXED_SUBPATHS`; then path-agnostic examples take the new spelling (no behavior change) [LAYOUT-02]

**Wave 6**

- [x] 36-06-PLAN.md — TRACER: `git mv plans memory-bank/plans` and the 12 fixture trees, with the reader table, model messages, validator, corpus and banned-claims entry flipped in one green commit [LAYOUT-02, LAYOUT-05]

**Wave 7**

- [x] 36-07-PLAN.md — TRACER: the trace tools root the traceability file at the authority; then prose, fixture content and re-sealed notes [LAYOUT-02]

**Wave 8**

- [x] 36-08-PLAN.md — TRACER: one role, its workflow and the board contract name `memory-bank/plans/`; then every role, workflow and kit doc, with the fallback clause on `orchestrator.md` line 8 [LAYOUT-01, LAYOUT-04]

**Wave 9**

- [x] 36-09-PLAN.md — TRACER: the new `docs/pre-v3-state-layout.md` is the one home install/README.md links to; then examples, the runbook and the design record name the v3 paths [LAYOUT-01]

**Wave 10**

- [x] 36-10-PLAN.md — TRACER: the new INVARIANT reaches every adapter and skill twin in one regeneration, with a third stated baseline transform [LAYOUT-01, LAYOUT-04]

**Wave 11**

- [x] 36-11-PLAN.md — TRACER: AGENTS.md, the packaging copies and the claim registry carry the clause, held by an every-carrier test [LAYOUT-04, LAYOUT-01]

**Wave 12**

- [x] 36-12-PLAN.md — TRACER: a plain install on a pre-v3 repository refuses, names `--migrate` and writes nothing [LAYOUT-04]

**Wave 13**

- [x] 36-13-PLAN.md — TRACER: `--migrate`, a both repository and the doctor handle the pre-v3 layout without forking state; then the v4.0 end is recorded (`[v3.0, D-11]`) and published [LAYOUT-04]

**Wave 14**

- [x] 36-14-PLAN.md — TRACER: `scripts/check-state-paths.ts` proves zero sites outside a per-file allow-list, then is wired in CI and package.json; then converse, boundary and LAYOUT-02 ownership cases and the phase-close full regression [LAYOUT-02, LAYOUT-01]

**Notes**: D-4 sets the old-layout behavior. The gate derives its own count of old spellings (research counts disagree: 1,293 occurrences vs 1,187 lines in 336 files). Every scratch install sets `GRUGOPS_HOME`. Full role prose waits for Phase 40; path edits here are mechanical.

### Phase 37: Overview board, per-file records and budgets

**Goal**: State files stay small: the board is a one-line-per-ticket overview, NFRs and traceability are one file per record with one-line indexes, and byte budgets are checked both in grugops and in every host repo
**Depends on**: Phase 36
**Requirements**: SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04, SPLIT-05, SPLIT-06, SPLIT-07
**Success Criteria** (what must be TRUE):
  1. The board contract changes first; the board then shows one short line per ticket per column and at most one `_Updated:` line, blocked reasons and other detail live in the ticket body, and the ticket frontmatter key set is unchanged unless a recorded decision adds a key (SPLIT-01, SPLIT-07)
  2. Each NFR is its own file and each ticket has its own trace file rendered from published note refs, with `nfr-catalog.md` and `traceability.md` as one-line-per-entry indexes, and no role tells an agent to append to traceability by hand (SPLIT-02, SPLIT-03)
  3. The validator enforces per-file byte budgets for the board, index entries, tickets, NFR files, trace files and `60-progress.md`, warning on an unmigrated repo and failing on a migrated one (SPLIT-04)
  4. A host repo has a `tools/grugops/state-check.js` runnable, with budgets generated from the layout module and freshness-gated, that checks budgets and index↔file integrity, and the PR gate and daily-sweep workflows call it (SPLIT-05)
  5. When `60-progress.md` goes over budget, older entries roll into an archive file; `queue/done/` and `50-decisions/` can only be moved to an archive folder, and nothing squashes or prunes them (SPLIT-06)

**Plans**: 32/39 plans executed

Plans:
**Wave 1**
- [x] 37-01-PLAN.md — Marker and archived-Done decisions (checkpoints), board contract first, budget and path constants

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 37-02-PLAN.md — scripts/state-rules.ts and the validator budget pass (WARN unmigrated, FAIL migrated)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 37-03-PLAN.md — Embed generator, its freshness gate, and the host state-check runnable (board budget, marker severity)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 37-04-PLAN.md — state-check checks every budget; --json, sanitized output, read-only proof

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 37-05-PLAN.md — state-check NFR index integrity, rollable report and move-only report (directory keepers are not records)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 37-06-PLAN.md — scripts/trace-model.ts and the host trace-render runnable (per-ticket files, two roots)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 37-07-PLAN.md — trace-render --check and its refusals (hand-written files, case-fold collisions, visible skips, keepers left alone)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 37-08-PLAN.md — Own-tree trace render and directory-compare freshness gate in CI (mid-phase full run 1)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 37-09-PLAN.md — state-check trace freshness on hosts (split from 37-08)

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 37-10-PLAN.md — state-roll runnable: Done rows move to the archive with a conservation proof

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 37-11-PLAN.md — state-roll: dated progress entries, refusals, dry run, re-run after an interrupted roll

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 37-12-PLAN.md — Board reader seventh source boardArchive, snapshot version 3

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 37-13-PLAN.md — Installer materializes the three runnables; v3 seed; marker on fresh layouts only (mid-phase full run 2)

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 37-14-PLAN.md — Roles, part 1: trace sections rendered, NFR one file each, board overview rule

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 37-15-PLAN.md — Roles, part 2, and the commit convention

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 37-16-PLAN.md — Workflows, part 1: WF05 render and state-check (D-12), WF09 roll and move-only, WF12, WF16, NFR seeding

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 37-17-PLAN.md — Workflows, part 2: trace and commit sentences (WF18's bound paragraph kept)

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 37-18-PLAN.md — Substrate, contract wording and checklists; the permanent hand-trace scan test

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 37-19-PLAN.md — grugops's own state on v3 forms with its marker (D-06); phase gate

Gap round 1 of 4 (D-17; sequential on main; 37-GAP-PLANNING-BRIEF.md):

**Wave 20** *(blocked on Wave 19 completion)*
- [x] 37-20-PLAN.md — CR-02 and EXIT-1: an unlistable context root and any unexpected throw are exit 2 in all three runnables; the fault-injection harness

**Wave 21** *(blocked on Wave 20 completion)*
- [x] 37-21-PLAN.md — CR-01: one "read was complete" predicate; an incomplete note read writes and removes nothing (exit 2) and state-check never says fresh

**Wave 22** *(blocked on Wave 21 completion)*
- [x] 37-22-PLAN.md — WR-01: the trace takes the ticket shape from the board grammar; every planned name checked before the first write

**Wave 23** *(blocked on Wave 22 completion)*
- [x] 37-23-PLAN.md — WR-02: one fence-aware dated-entry classifier for state-check and state-roll

**Wave 24** *(blocked on Wave 23 completion)*
- [x] 37-24-PLAN.md — WR-05: a generated build stamp in each runnable and the runnable-version-skew finding; the three update together

**Wave 25** *(blocked on Wave 24 completion)*
- [x] 37-25-PLAN.md — READ-1 table: every read site of the three runnables, derived, counted and failed

**Wave 26** *(blocked on Wave 25 completion)*
- [x] 37-26-PLAN.md — IN-03 and the validator's READ-1 table: only ENOENT is absent

**Wave 27** *(blocked on Wave 26 completion)*
- [x] 37-27-PLAN.md — Gap 3 and SCAN-1: the widened hand-trace scan and the three sentences; gap round 1 full regression

Gap round 2 of 4 (D-18; sequential on main; 37-GAP-PLANNING-BRIEF.md §1.1):

**Wave 28** *(blocked on Wave 27 completion)*
- [x] 37-28-PLAN.md — CR-03, CR-04, IN-06: one lstat-based absence owner (entryPresence); the walk and one generated task read and listing in both runnables; a dangling notes link or a link task is a failed task

**Wave 29** *(blocked on Wave 28 completion)*
- [x] 37-29-PLAN.md — IN-10 and every other absence decision of trace-render and state-check on the owner; the one-owner census over both

**Wave 30** *(blocked on Wave 29 completion)*
- [x] 37-30-PLAN.md — state-roll on the owner, the readRegularFileOrNull comment corrected; the one-owner census over all three runnables

**Wave 31** *(blocked on Wave 30 completion)*
- [x] 37-31-PLAN.md — READ-1 shape table over the owner's derived callers, and ENOENT at every derived read site with a reasoned exemption list

**Wave 32** *(blocked on Wave 31 completion)*
- [x] 37-32-PLAN.md — WR-08 hand-trace scan from the truth, WR-09 rewording of WF02 and WF03; gap round 2 full regression

Gap round 3 of 4 (D-19 scope, D-20 canonical form; sequential on main; 37-GAP-PLANNING-BRIEF.md §1.2):

**Wave 33** *(blocked on Wave 32 completion)*
- [ ] 37-33-PLAN.md — CR-05: one root-chain owner (rootChainPresence); trace-render's directories and state-check's trace directories on it; no link below the root on the chain is followed; the owner's unit contract

**Wave 34** *(blocked on Wave 33 completion)*
- [ ] 37-34-PLAN.md — trace-render's file positions (pre-write check, readText) on the owner; IN-13 for trace-render; links above the root still render

**Wave 35** *(blocked on Wave 34 completion)*
- [ ] 37-35-PLAN.md — state-check's every state path on the owner; the marker behind a root-chain link is exit 2, never WARN mode; a link at a listed folder is the folder's one finding (flagged); IN-13 for state-check

**Wave 36** *(blocked on Wave 35 completion)*
- [ ] 37-36-PLAN.md — state-roll's directories and files on the owner (the CR-05 shape in state-roll); IN-13 for state-roll

**Wave 37** *(blocked on Wave 36 completion)*
- [ ] 37-37-PLAN.md — IN-11: a stray context-root entry, a dangling or looping link included, is named with its own remedy, from one owner; the wider block recorded beside IN-09

**Wave 38** *(blocked on Wave 37 completion)*
- [ ] 37-38-PLAN.md — READ-1 class table for D-20 (chain positions derived from the owner, every link shape, one state-check outcome per position), IN-12 exempt rows and shape counter, IN-13 census over all three runnables

**Wave 39** *(blocked on Wave 38 completion)*
- [ ] 37-39-PLAN.md — WR-11 hand-trace scan widened from the reproductions, WR-09 remainder at WF03:46; gap round 3 full regression

**Cross-cutting constraints:**
- The edits are the mechanical minimum (the full prose rewrite is Phase 40): no role gains a new section, and every role stays within its existing size budget

**Notes**: D-6 (trace per ticket, rendered) and D-7 (archive-only surfaces). New ticket detail goes in ticket bodies, not new keys.

### Phase 38: install --migrate v3

**Goal**: A user with an old-layout repo moves it to the v3 layout with one command that deletes nothing, proves nothing was lost, and is safe to run twice
**Depends on**: Phase 37
**Requirements**: MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-04, MIGRATE-05, MIGRATE-06, MIGRATE-07
**Success Criteria** (what must be TRUE):
  1. `install --migrate --dry-run` prints every planned move and split with per-file byte counts and leaves the repo unchanged; `install --migrate` then moves the repo to the v3 layout (MIGRATE-01)
  2. After migration the original monolith files sit unchanged in `memory-bank/plans/archive/pre-v3/`, outside every budget, the split files are new files, board row trailers (blocked reasons, notes) appear verbatim in ticket bodies, and nothing was deleted or rewritten in place (MIGRATE-02, MIGRATE-05)
  3. Migration proves that every original line appears in the split output or the archive, and when the proof fails it rolls the split back and says why (MIGRATE-03)
  4. Migration detects old, new, both and neither layouts, refuses the "both" state and a non-empty `queue/claimed/`, writes a layout marker, and a second run is a byte-identical no-op (MIGRATE-04)
  5. With the opt-in flag, finished-ticket `.grugops/context/` folders are moved, not changed, into a separate archive folder and trace rendering still reads them; the whole migration has been run on a copy of `cli-chess-example` under a scratch `GRUGOPS_HOME` with before/after sizes recorded (MIGRATE-06, MIGRATE-07)
  6. On an installed v2.x two-root repo that still holds the pre-v3 board (`plans/board.md`, no `memory-bank/plans/board.md`), `install --migrate` moves it to the v3 layout; the v2.x arm's "already migrated to the two-root layout ... Nothing to do." short-circuit no longer answers that layout, and a test pins it (MIGRATE-04; carried from Phase 36 WR-04 by UAT decision 2026-10-21)

**Plans**: TBD
**Research flag**: plan with `--research-phase` (migrate state machine, trace-render over two roots, the shapes found in real hand-written boards for the conservation proof).
**Notes**: The first operation that rewrites user state (D-8). A frozen pre-v3 fixture comes first. Budget extra gap rounds under the four-round cap.

### Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key

**Goal**: The kit can match each ticket to the right engineer level: a Tech Lead scores and pre-plans, one engineer role yields three level adapters on Claude Code, a Designer role exists, and roles can declare skills, while every role and adapter set still follows the filesystem
**Depends on**: Phase 37
**Requirements**: TIER-01, TIER-02, TIER-03, TIER-04, TIER-05, TIER-06, TIER-07
**Success Criteria** (what must be TRUE):
  1. A Tech Lead role scores a ticket's complexity on a written per-factor rubric, records the score and the chosen engineer level in a note and in the ticket body, and pre-plans the dev tasks (TIER-01)
  2. A Claude Code install gets three engineer adapters generated from one `software-engineer.md`: junior (haiku, effort medium), mid (sonnet) and senior (opus), each with its own effort; on the other five hosts the level is guidance; the MODEL-01 baseline is re-pinned by recorded decision, not by loosening the test (TIER-02, TIER-06)
  3. The junior level takes only tasks whose plan already fixes what to write and never security, migration, concurrency or test-integrity work, with the D-09 amendment and the Claude Code v2.1.293 floor recorded; a stuck or twice-failed engineer escalates one level once through a `failed-attempt` note and a queue re-enqueue, never a relayed prompt (TIER-03, TIER-04)
  4. A Designer role sets design strategy and guidelines, and the Frontend/UI role reads them for each ticket's UI contract (TIER-05)
  5. The adapter-name set, the coordinator's spawn allowlist, role and adapter counts, model and effort tiers and size ceilings all follow the filesystem with no hand-typed list, and a role can declare `skills:` in frontmatter that the canonical frontmatter grammar admits (TIER-06, TIER-07)

**Plans**: TBD
**Research flag**: plan with `--research-phase` (kit-model variant mechanism, config namespace for level stems, `CANONICAL_SCHEMA` list grammar for `skills:`, per-host model-field semantics, `effort` on haiku).
**Notes**: D-2, D-3, D-5 and D-9 (no `level` ticket key). Counts move once here so Phase 40 writes under a stable ceiling table; research expects roles 17 → 19 and adapters 17 → 21, which the guards must derive, not type. Tier rationales are quality arguments only. Budget extra gap rounds under the four-round cap.

### Phase 40: Plain-language role rewrite

**Goal**: Every role reads as clear, compact English that says more about the role than today, within today's byte budget, and keeps every rule that holds the factory safe
**Depends on**: Phase 39
**Requirements**: PLAIN-01, PLAIN-02, PLAIN-03, PLAIN-04, PLAIN-05, PLAIN-06, PLAIN-07
**Success Criteria** (what must be TRUE):
  1. No role carries a caveman block; the voice constraint, the section list, the voice guards, the writing profile, claim C-28-003 and `CLAUDE.md` changed together in one atomic change, and the inverted guard was seen failing before it passed (PLAIN-01)
  2. All 19 roles and the role-switch protocol state each role's goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than before, and the role-rule inventory generated before the rewrite (no-fabrication, `UNKNOWN - verify`, WF16/WF18 pointers, absent-config fallback, board-move ownership as a partition) still holds after it (PLAIN-02, PLAIN-03)
  3. All role files together stay within 67,383 bytes, a guard fails when they go over, and each role has a recorded per-file ceiling (PLAIN-04)
  4. The engineer and Tech Lead roles carry grugops-authored "do less" rules (scope-first, reuse-before-build ladder, never-cut floor, one test for logic, `shortcut:` marker, "what was skipped" line) with ponytail's MIT attribution in NOTICE and no borrowed benchmark numbers, and the PR review checklist has a lean-review lens that flags over-engineering (PLAIN-05, PLAIN-06)
  5. Role text is a governed surface of the writing profile, and the lexicon and sentence gates pass on every role (PLAIN-07)

**Plans**: TBD
**Notes**: D-1 (one corpus total that includes Tech Lead and Designer). The caveman flip is the first plan. `scripts/voice-model.ts` is hash-pinned in the admission hook's frozen manifest: change its consumers, not the file.

### Phase 41: Orchestrator flow guidance

**Goal**: The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Depends on**: Phase 40
**Requirements**: RUN-01, RUN-02, RUN-03, RUN-04, RUN-05, RUN-06
**Success Criteria** (what must be TRUE):
  1. `now-running.md`, rendered from the queue's `claimed/` set, is the Orchestrator's only in-flight log; it holds only running work and empties as tasks finish (RUN-01)
  2. When a task completes, the Orchestrator closes the finished agent and refills free capacity (`wip_limit` minus the `claimed/` count read from disk) with ready work, using no timers and no polling, and agents claim and complete tasks with the shipped `claim.js` runnable instead of by hand (RUN-02, RUN-05)
  3. Workflow 17 holds "session compaction" guidance, named apart from WF18 note compaction, that uses signals the Orchestrator can observe, with a fresh session that re-reads the in-flight log as the fallback on every host; `orchestrator.md` carries a one-line pointer and stays under its size ceiling (RUN-03, RUN-04)
  4. The flow guidance reads the same on all six hosts, with only optional operator tips per host (RUN-04)
  5. The Orchestrator starts tiered engineers by adapter name, never forks them, never overrides their model, and never claims a ticket itself (RUN-06)

**Plans**: TBD
**Research flag**: plan with `--research-phase` (what each host exposes about context use, assumed invisible; whether Claude Code allows a per-invocation `effort`; how `claim.js` ships as a materialized runnable).
**Notes**: D-9 (`claim.js` ships to host repos). `orchestrator.md` stays under its 7,165 B WARN ceiling and the dual-path equivalence oracle stays green.

### Phase 42: Skills per role and evaluation

**Goal**: Each role knows which skills it may use and what to do without them, third-party skills are recommended only as optional pinned installs after a written evaluation, and the doctor warns when a declared skill is missing
**Depends on**: Phase 39, Phase 40
**Requirements**: SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05
**Success Criteria** (what must be TRUE):
  1. Each role lists the skills it may use with a built-in fallback checklist for when a skill is absent, and the role-switch protocol tells non-Claude hosts where to find skills (SKILL-01)
  2. A maintainer can read a written evaluation of superpowers, code-simplifier, feature-dev, commit-commands, frontend-design and ui-ux-pro-max against grugops's floors (merge, branching, planning authority, telemetry, network, runtime deps) that decides which are recommended (SKILL-02)
  3. Recommended skills are documented as optional, pinned installs that grugops never vendors or installs, and one rule, stated once, says grugops rules outrank any skill text (SKILL-03)
  4. Frontend/UI uses ui-ux-pro-max when it is installed and treats the design-system files it creates as user artifacts that grugops reads but never writes (SKILL-04)
  5. `install --check` warns, and never fails or installs anything, when a role declares a skill that is not found (SKILL-05)

**Plans**: TBD
**Research flag**: plan with `--research-phase` (`allowed-tools` vs `permissions.ask` evaluation order, per-host skill discovery).
**Notes**: No third-party skill is preloaded or made process-defining.

### Phase 43: Story and layered docs

**Goal**: A newcomer understands what grugops is and how to use it from the README and main docs, reaches a generated reference page for every agent and skill, and finds every claim honest
**Depends on**: Phases 35–42
**Requirements**: STORY-01, STORY-02, STORY-03, STORY-04, STORY-05
**Success Criteria** (what must be TRUE):
  1. The README opens with "grugops — Specialist agents. Shared context. Coordinated work." in the lowercase brand and no longer calls grugops "the simple software factory" (STORY-01)
  2. The main docs explain how grugops works and its core concept, walk through usage flows with worked examples, and link to every agent and skill page (STORY-02)
  3. Every agent and skill has a reference page generated from its role or skill file, and a gate fails when a page is missing or stale (STORY-03)
  4. Every new public page was inside the claim registry's checked file set before it was written, and every claim that moved was re-dispositioned by id, never deleted (STORY-04)
  5. The docs state open gaps honestly (own-session spawn capture is `UNKNOWN - verify`), make no cost or token-saving claims, and `CLAUDE.md` no longer names `/grug` (STORY-05)

**Plans**: TBD
**Notes**: Reference pages come from the existing catalog generator; claim anchors keep their ids.

## Progress

**Execution order:** numeric, 35 → 43. Allowed overlaps: 35 with 36; 38 with 39; 41 with 42.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 35. Graph-memory decision record | v3.0 | 1/1 | Complete    | 2026-10-20 |
| 36. State-layout authority, path move and protection | v3.0 | 14/14 | Complete    | 2026-10-21 |
| 37. Overview board, per-file records and budgets | v3.0 | 32/32 | In Progress | - |
| 38. install --migrate v3 | v3.0 | 0/TBD | Not started | - |
| 39. Role machinery: engineer levels, Tech Lead and Designer roles, skills key | v3.0 | 0/TBD | Not started | - |
| 40. Plain-language role rewrite | v3.0 | 0/TBD | Not started | - |
| 41. Orchestrator flow guidance | v3.0 | 0/TBD | Not started | - |
| 42. Skills per role and evaluation | v3.0 | 0/TBD | Not started | - |
| 43. Story and layered docs | v3.0 | 0/TBD | Not started | - |

## Backlog

### Phase 999.1: Installer adversarial e2e lane — turn the per-plan red-team into a bounded, repeatable test flow (BACKLOG)

**Goal:** [Captured for future planning] Replace the ad-hoc, open-ended red-team agent that phase 33.1 ran after every gap plan with a bounded, deterministic end-to-end test lane for `install.js` / `uninstall.js`. The lane drives the committed `.js` in throwaway git repos and kit homes, and runs on a fixed, enumerated scenario corpus with a severity/likelihood bar. Without that bar, every reproduced edge case became new in-scope work and phase 33.1 stalled. See `999.1-installer-adversarial-e2e-lane/999.1-IDEA.md`.
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: Bound the readModelsConfig read (DC-3 residual from Phase 34, D-18) (BACKLOG)

**Goal:** [Captured for future planning] `readModelsConfig` in `scripts/model-tiers.ts` reads the `models` configuration with `existsSync` followed by `readFileSync` on a user-controlled path, so a FIFO at `.grugops/factory.config.json` hangs the adapter generator (defect class DC-3, 33.1-GAP-PLANNING-BRIEF.md). Phase 34 did not fix it, by decision D-18, and disclosed it in 34-VALIDATION.md "Residuals". A fix must not create a second implementation of `install/user-file.ts` `readUserFile`, the one bounded reader of a user path. It would either share that reader across the installer/scripts boundary or move the bound to a place both can reach, and it needs a DC-3 class test (FIFO and directory at the path, run finishes within a timeout).
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.3: Document `fable` as a model alias (BACKLOG)

**Goal:** [Captured for future planning] 34-RESEARCH.md Q6 found that Claude Code's sub-agents page lists `fable` as a model alias, but `MODEL_ALIASES` in `scripts/model-tiers.ts` does not include it. Phase 34 left `MODEL_ALIASES` unchanged. The A1 marker that held the alias set may now be citable. Re-fetch the primary source, cite it, and decide whether `fable` joins the closed vocabulary, together with the docs and tests that derive from it.
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.4: Kit discovery on non-Claude hosts after a scripted install (BACKLOG — absorbed into Phase 34.1, 2026-10-10)

**Goal:** [Captured for future planning; re-scoped 2026-10-10 by plan 34-30] The design question (34-RESEARCH.md Q7: how a host with no Claude Code adapter finds the shared kit after a scripted install) is answered by 34-CONTEXT.md D-26, the marker route, built in plans 34-27 to 34-29: `AGENTS.md` and the installer-written pointers carry `KIT_ROUTE`, which names the `kitRoot` field of `.grugops/install.json`, and `install.js --check` prints one `reach` line per host. What remains is a live run on each non-Claude host after a scripted install, each `UNKNOWN - verify` until run: Pi (the 34-UAT.md test 2 re-run), Copilot, Codex, OpenCode and Gemini. The Pi prompt template stays a pointer with no resolver slot (D-26).
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.5: Follow-up — Phase 34 deferred UAT follow-up: Test 3 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 34 verification
**Source phase:** 34
**Deferred at:** 2026-10-10 during /gsd-verify-work 34 session completion
**Follow-ups:**
- [ ] Test 3: skip, windows is not in current support, I have windows machine, but will test on it after completing all phases and new upcoming phases as well (which i have not yet described and planned) (deferred 2026-10-10)

### Phase 999.6: Follow-up — Phase 34.1 deferred UAT follow-up: Test 14 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 34.1 verification
**Source phase:** 34.1
**Deferred at:** 2026-10-14 during /gsd-verify-work 34.1 session completion
**Follow-ups:**
- [ ] Test 14: DI-11 fix option (a): apply the claims-nothing rule to every arm of removeAskRules (report left/skipped, return gone), so a partial uninstall over a claims-nothing ask-rules entry counts no verify and prints no no-op --<agent> finishing command; also stops a FULL run exiting 3 over it (deferred 2026-10-14)

### Phase 999.7: Follow-up — Phase 34.1 deferred UAT follow-up: Test 15 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 34.1 verification
**Source phase:** 34.1
**Deferred at:** 2026-10-14 during /gsd-verify-work 34.1 session completion
**Follow-ups:**
- [ ] Test 15: WR-40: reword install-marker.ts:454 'it does not read as a grugops install marker' for a field defect of install's own marker to name the field, and widen the NOT_INSTALLS / MATRIX_NOT_INSTALLS censuses to the class; bundle with the D-41 wording backlog item (DI-15/DI-22) (deferred 2026-10-14)

### Phase 999.8: Follow-up — Phase 34.1 deferred UAT follow-up: Test 11 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 34.1 verification
**Source phase:** 34.1
**Deferred at:** 2026-10-14 during /gsd-verify-work 34.1 session completion
**Follow-ups:**
- [ ] Test 11: D-41 backlog item (DI-15/DI-22) plus UAT note: root README.md quick start (line 18) and install/README.md examples (e.g. line 59) show a bare 'node install/install.js' that only works from the checkout; show the installer by absolute path (or path from the target repo) with --target and an agent flag, and update the main README install section (deferred 2026-10-14)

### Phase 999.9: Follow-up — Phase 34.1 deferred UAT follow-up: Test 16 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 34.1 verification
**Source phase:** 34.1
**Deferred at:** 2026-10-14 during /gsd-verify-work 34.1 session completion
**Follow-ups:**
- [ ] Test 16: DI-23 and DI-24 wording (bundle with WR-40): over a foreign read, three uninstall lines still call the file 'the install marker'; a directory or FIFO at the marker path gets a verify calling it 'the one record install keeps' (deferred 2026-10-14)

### Phase 999.10: Follow-up — Phase 34.1 residuals accepted at close (D-48) (BACKLOG)

**Goal:** [Captured for future planning] Resolve the review findings and deferred items phase 34.1 accepted open at close (D-47, D-48). Sources: `34.1-per-agent-installer/34.1-REVIEW-DISPOSITION.md`, `34.1-REVIEW.md`, `deferred-items.md`, `34.1-VERIFICATION.md` (truth 12 override).
**Source phase:** 34.1
**Deferred at:** 2026-10-17 at phase close (D-48)
**Follow-ups:**
- [ ] WR-44: at a terminal over an unreadable marker, Enter on the detection-only agent list makes detected agents "named by the user", and the refusal prints them as "the same agents again"; the verifier's suggested fix is to refuse before drawing the list when INSTALL_REFUSAL is set, with one terminal row (bundle with IN-45)
- [ ] IN-45: at a terminal the agent list is asked before the refusal, and over a foreign read the answer is thrown away
- [ ] IN-43: the per-site arms kept "for a marker that changes during the run" have no run that exercises them
- [ ] IN-44: the refusal's decision and its malformed-ledger wording have more than one authority
- [ ] IN-46: an `unbound` marker of this directory (no `target`, or no ledger) is still replaced, and its earlier records are dropped (class boundary for the human)
- [ ] IN-47: a message-references test title still pins the retired `SELECTION` argument
- [ ] IN-48: over a blocked marker with nothing detected, the flag-less command the refusal prints leads to a third step, an exit 1
- [ ] IN-49: a refused `--migrate` run prints the install run header above the migrate banner
- [ ] DI-26: with `.grugops` a regular file or a link to nothing, the uninstaller's closing still calls `.grugops/` seeded state
- [ ] DI-27: install over an unreadable kit-home record copies the kit and leaves that run's backup unrecorded

### Phase 999.11: Test suite layers, speed and value (BACKLOG)

**Goal:** [Captured for future planning] Make the vitest suite stop gating progress. Today a full run is 31 min, with 8395 tests over 114 files, run one file at a time. Split the suite into separately runnable unit, integration and e2e layers, consolidate duplicate tests, audit whether each guardrail and gate family still gives grugops value, and set the executor testing approach. That approach: run the related subset while coding, then each layer in turn (unit, then integration, then e2e), with e2e run once at the end. Planned as a `/gsd-quick` (human, 2026-10-18). See `999.11-test-suite-layers-and-speed/999.11-IDEA.md`.
**Source phase:** quick 261018-hs8
**Deferred at:** 2026-10-18 during /gsd-quick 261018-hs8
**Follow-ups:**
- [ ] Speed: parallelize files outside a sequential tree-mutating project; share scratch installs; move 10 s+ corpus sweeps out of the default lane
- [ ] Find duplicate or overlapping tests and consolidate them
- [ ] Value audit of each guard or gate family against the grugops failure it prevents; record each retirement as a decision
- [ ] Three layers (unit, integration, e2e), each with its own npm script; e2e only once after the other layers pass; plain `npm test` never starts the live lane
- [ ] Executor testing approach: related subset while coding, then unit, then integration, then e2e; write it into the executor brief or a project skill
- [ ] Fix or quarantine the flaky `scripts/board-watch-live.test.ts`, and clear the 20-21 stale base failures
