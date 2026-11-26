# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- ✅ **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (shipped 2026-07-28)
- ✅ **v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board** — Phases 27–34.1 (shipped 2026-10-18, gaps accepted)
- ✅ **v3.0 Specialist agents. Shared context. Coordinated work.** — Phases 35–43.1 (shipped 2026-11-21, tech debt accepted)
- 🚧 **v3.1 Upstream design, consultation and one-command install** — Phases 44–48 (in progress, started 2026-11-24)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: an SDLC-coverage audit and mechanical foundation guards, senior personas, BDD+TDD, a frontend/UI persona, an ASVS security audit, the TypeScript tooling migration, the converged §14 quality gate, install migrate/update, a generated docs catalog, and an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 was a major architecture pivot, and it landed.** It replaced the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other CLIs degrade to sequential over the same files, converging on identical on-disk artifacts as proven by a dual-path equivalence oracle). grugops's differentiator is mechanical: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp the writing agent cannot forge or self-set.

**v2.1 made it runnable and closed with its headline unproven.** Every guard and validator scan set derives from the filesystem and all role adapters are generated from one source; a controlled-language profile is held by three gates; per-role model and effort dials reach installed repos; every human stop is a dialable checkpoint over a git-host hard floor (the Bash command-parsing guard was retired, 33.1 D-17); a read-only live board renders the state; Pi joined as a sixth host and the installer installs per named agent. The captured live run proving role agents work in their own sessions (GAP-D1, CAP-01/CAP-03) read `fail` each time it was attempted — it is carried forward, not fabricated.

**v3.0 made the kit easier to read and kept its state files small.** Planning state moved under `memory-bank/plans/` behind one path authority and was split into one file per record with small indexes and byte budgets; `install --migrate` moves existing repos without deleting anything. A Tech Lead sizes work for three engineer levels, a Designer role exists, every role is plain English, Workflow 17 keeps the Orchestrator's capacity full, roles may declare skills, and layered docs tell the new story. Graph memory was decided against, not built. Closed `tech_debt` by accepted override: 51/51 requirements, verification for phases 36–43 stale. Audit: `milestones/v3.0-MILESTONE-AUDIT.md`.

**v3.1 builds from an upstream design and installs with one command.** A grugops repository can declare a separate, approved design package as a read-only upstream source, pinned by commit and read in place, so tickets trace to upstream IDs, and a question or change that belongs upstream leaves as a build request that a human carries; grugops never decides what the product is. One parameterized consultant role gives sourced second opinions, alone or as a panel that reports where its lenses disagree. A user installs grugops with one pinned `npx` command copied from the README, and the public docs name `install --migrate`. Release: `3.1.0`, additive.

**The expensive lesson, twice over:** a green suite is a precondition, never proof, for a safety invariant (v2.0: 13 catches). v2.1 added the remedy for loops that will not converge — a canonical form that refuses everything outside one allow-list, or moving enforcement to the system of record — and a four-round cap after which a human closes the phase by decision.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v3.0 ran Phases 35–43.1; v3.1 runs Phases 44–48.

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

<details>
<summary>✅ v3.0 Specialist agents. Shared context. Coordinated work. (Phases 35–43.1) — SHIPPED 2026-11-21 (tech debt accepted)</summary>

- [x] Phase 35: Graph-memory decision record (1/1 plans) — completed 2026-10-20
- [x] Phase 36: State-layout authority, path move and protection (14/14 plans) — completed 2026-10-21 (verification stale at close)
- [x] Phase 37: Overview board, per-file records and budgets (42/42 plans) — completed 2026-10-27 (verification stale at close)
- [x] Phase 38: install --migrate v3 (11/11 plans) — completed 2026-10-28 (verification stale at close)
- [x] Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key (20/20 plans) — completed 2026-10-31 (verification stale at close)
- [x] Phase 40: Plain-language role rewrite (25/25 plans) — completed 2026-11-04 (PLAIN-03 by override; verification stale at close)
- [x] Phase 41: Orchestrator flow guidance (29/29 plans) — completed 2026-11-15 (RUN-04 live runs on five hosts unrun; verification stale at close)
- [x] Phase 42: Skills per role and evaluation (8/8 plans) — completed 2026-11-17 (ratify-none; verification stale at close)
- [x] Phase 43: Story and layered docs (15/15 plans) — completed 2026-11-18 (verification stale at close)
- [x] Phase 43.1: Close v3.0 P1 debt (INSERTED) (17/17 plans) — completed 2026-11-21 (12 P1 items closed; ubuntu CI green)

Full phase details + milestone summary: `milestones/v3.0-ROADMAP.md` · requirements: `milestones/v3.0-REQUIREMENTS.md` · audit: `milestones/v3.0-MILESTONE-AUDIT.md` · phase artifacts: `milestones/v3.0-phases/` · quick tasks: `milestones/v3.0-quick/`

</details>

### 🚧 v3.1 Upstream design, consultation and one-command install (Phases 44–48) — ACTIVE

**Milestone goal:** A grugops repository builds from an approved design package that another system produced, sends questions and requirement changes back to that system as build requests, and gets second opinions from one parameterized consultant role, without grugops ever deciding what the product is. Installing grugops becomes one command a user copies from the README.

- [x] **Phase 44: Upstream source declaration and pin check** - a user declares a read-only upstream design source pinned by commit and entry-file blob; roles read it only at the pin through one reader, the Orchestrator reports pin state at session start, and upstream refs render in the trace's Requirement column (completed 2026-11-25)
- [ ] **Phase 45: Traceability, build requests and architecture as input** - tickets cite upstream IDs that are checked at the pin; a question or change that belongs upstream becomes a build request that blocks its tickets until a human sets a new pin; an upstream architecture is given input and grugops floors never move
- [ ] **Phase 46: One-command install and install --migrate docs** - a user installs, updates, checks, migrates and uninstalls with one pinned `npx grugops@<version>` command from the README, releases publish from CI with human-approved staging, and the public docs name `install --migrate`
- [ ] **Phase 47: Universal consultant** - one parameterized consultant role, dispatched only by the Orchestrator, answers from declared sources first as `claim` or `observation`, sends upstream-scope questions to build requests, and in panel mode ends with where its lenses disagree
- [ ] **Phase 48: Feature docs and the 3.1.0 release** - the public docs explain upstream sources, build requests and the consultant with claim anchors, and grugops ships as `3.1.0` through the new release path

**Dependencies:** 44 → 45 → 47 → 48. Phase 46 depends on nothing in v3.1 and may run in parallel with 44 and 45. Phase 48 needs every other phase.

**Do first (human, INST-07, S-04):** the npm name `grugops` was unpublished on 2026-11-24 (`npm view grugops` returned E404), so anyone can take it. Phase 46's first plan prepares a publishable manifest, and a named human publishes `3.1.0-rc.0` by hand under dist-tag `next` as early in the milestone as possible, even while Phases 44 and 45 run. Trusted publishing can be configured only after the package exists.

**Gap-closure cap:** every phase gets at most four gap-closure rounds; after that a human closes it by decision or override, with the residuals recorded. Budget the extra rounds for Phase 44 (an untrusted read path) and Phase 47 (a new advisory output).

**Red-team rounds:** one adversarial red-team round each for Phase 44 (upstream text is untrusted input, and a source's own agent instructions must not be followed) and Phase 47 (consultant output must not be laundered into a decision or answer an upstream-scope question). This is the class of change that cost v2.0 thirteen bypasses.

**Research flags:** plan Phases 44, 45, 46 and 47 with `/gsd-plan-phase <N> --research-phase`; Phase 45's research is narrow. Phase 48 follows patterns already in the repo.

**Public repository rule:** every fixture and example uses a synthetic upstream with invented IDs. The upstream system is described generically; no committed file names a private repository, product or person.

**Decisions this milestone rests on:** scoping decisions S-01..S-08 in REQUIREMENTS.md (human, 2026-11-24). Research: `research/SUMMARY.md` (decisions D1–D10; detail in `research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`).

**Carried and not scheduled here:** GAP-D1 own-session spawn capture, KIT-03/SPAWN-04 promotion, UATX-01/06, the windows-latest test leg (CAP-02, HOST-02; only the new packed-tarball install job is in scope), live per-host runs (RUN-04), stale verification for v3.0 phases 36–43, backlog 999.1–999.12, and the domain-packs part of 999.13 (see REQUIREMENTS.md Future Requirements).

## Phase Details

### Phase 44: Upstream source declaration and pin check

**Goal**: A user can point grugops at an approved upstream design package, and every role reads exactly the pinned version of it, safely, without copying it and without the pin moving on its own
**Depends on**: Nothing in v3.1 (builds on shipped v3.0.0); opens with a decision gate
**Requirements**: UP-01, UP-02, UP-03, UP-04, UP-05, UP-06, TRC-02
**Success Criteria** (what must be TRUE):
  1. A user declares one or more upstream sources in `.grugops/factory.config.json` (id, a relative path to a checkout outside the product repository, pinned commit, entry file with its blob hash, owned scope), the validator refuses a malformed declaration, and a repository with no declaration behaves as v3.0.0 does (UP-01)
  2. At session start the Orchestrator reports each source as match, drift or `UNKNOWN - verify`, and a declared entry-file blob that differs from the blob at the pinned commit is reported as a mismatch; nothing in grugops moves a pin, and only a named human edits one (UP-03, UP-06)
  3. Roles read upstream content only at the pinned commit, through one sanctioned reader that uses git object reads: a dirty working tree, a moved HEAD or CRLF line endings in the source checkout do not change what a role reads, and no upstream content is copied into `memory-bank/` (UP-02)
  4. A missing or unreadable source makes the dependent work `BLOCKED` with a named reason and nothing is guessed; upstream text enters the shared context only as cited `claim` notes, and a synthetic fixture with embedded instructions shows the instructions are not followed (UP-04, UP-05)
  5. A rendered trace shows `upstream:<source>:<id>@<commit>` refs in the Requirement column and never as phantom ticket rows, and the `BR` prefix is reserved for build requests (TRC-02)

**Plans**: 14/14 plans complete (gap-closure round 1 of 4 planned: 44-09 to 44-14)

Plans:
**Wave 1**
- [x] 44-01-PLAN.md — Tracer: a declared source checks as `match` end to end through `upstream.js`; TRC-02 trace rule; seventh embed row

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 44-02-PLAN.md — Unit-pin every upstream grammar and decision; prove an upstream ref travels from a claim note to the Requirement column
- [x] 44-03-PLAN.md — Install and uninstall `tools/grugops/upstream.js`; prove no host read rule for a source (D-20); census pins

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 44-04-PLAN.md — Validator `upstream` arm refusing malformed declarations by name; config field reference
- [x] 44-05-PLAN.md — Every check state and exit code; the untrusted checkout cannot steer git (replace refs, GIT_DIR, fsmonitor, lazy fetch)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 44-06-PLAN.md — The fenced `read` verb (manifest-only, 64 KiB ceiling); injection fixture; red-team round prepared

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 44-07-PLAN.md — The upstream contract and Workflow 20, registered with every gate (each count re-derived)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 44-08-PLAN.md — Workflow 17 session-start step, Orchestrator key, AGENTS.md third-root line, config pointer; names for Phases 45/47; open confirmation items

**Gap-closure round 1** (44-VERIFICATION.md gap: the D-17 fence, CR-01 and CR-02; plus WR-01, WR-03, WR-04, IN-02, IN-03, IN-04, IN-06). Waves are sequential: every plan rebuilds or reads the same committed `.js`.

**Gap wave 1**
- [x] 44-09-PLAN.md — Tracer: an ASCII manifest path grammar so a listed path cannot forge the fence's blob id (CR-01); fenceLines guard; `forged path` red-team regressions through check and read

**Gap wave 2** *(blocked on gap wave 1 completion)*
- [x] 44-10-PLAN.md — Tracer: the verifier's Status-cell reproduction fails closed; every bad cell named by column and line, no manifest text or listed path outside the fence (CR-02, IN-03); `cell text` regressions

**Gap wave 3** *(blocked on gap wave 2 completion)*
- [x] 44-11-PLAN.md — Tracer: `upstream.js check` reports a sibling program from another build (`runnable-version-skew`, WR-03, TRC-02)

**Gap wave 4** *(blocked on gap wave 3 completion)*
- [x] 44-12-PLAN.md — Tracer: the partial-clone guard before any object read, on both keys (WR-01); IN-04, IN-06; git messages never echo a listed path (T-44-38)

**Gap wave 5** *(blocked on gap wave 4 completion)*
- [x] 44-13-PLAN.md — Workflow 20 and Workflow 17 put only the fixed reason `upstream <source>: <cause>` into BLOCKED (CR-02 kit half), with disposition rows

**Gap wave 6** *(blocked on gap wave 5 completion)*
- [x] 44-14-PLAN.md — The upstream contract, config reference and install README state the shipped rules (CR-01, CR-02, WR-03, WR-04, IN-02); re-close T-44-15, T-44-19, T-44-30; Nyquist and review dispositions from evidence

**Notes**: The discussion opens with a decision gate: the names (S-06: the sources config key, the consult dial key and values, the build-request statuses) and the upstream export shape (ID grammar, supersession marker, entry manifest), stubbed as a minimal declared manifest if upstream has not settled it. S-02 sets the source location and S-05 the ownership. TRC-02 sits here, not in Phase 45, because the trace renderer's runnable carries a generated copy of `trace-model.ts`: adding the `upstream.js` runnable and changing the trace model in one phase moves the runnable set and embeds once. `AGENTS.md` gains one line for the third root, within its byte budget. Research flag: pin semantics (CRLF, shallow clones, SHA-256 repositories, reads across repositories without a fetch), the injection fence, whether a git read through Bash triggers nested `CLAUDE.md` or `AGENTS.md` loading, and per-host reads outside the repository (`UNKNOWN - verify` on Codex CLI, Antigravity CLI, Copilot CLI and Pi). Budget one adversarial red-team round on the untrusted read path.

### Phase 45: Traceability, build requests and architecture as input

**Goal**: The trail runs from an upstream decision to a ticket, and anything that belongs upstream leaves as a build request that a human carries, so grugops never decides what the product is
**Depends on**: Phase 44 (the ref grammar, the pin and the sanctioned reader)
**Requirements**: TRC-01, TRC-03, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, ARCH-01, ARCH-02
**Success Criteria** (what must be TRUE):
  1. A BA/PM ticket cites the upstream IDs it implements as `upstream:<source>:<id>@<commit>` or states `none (build-internal)`, and the validator fails a cited ID that does not exist at the pinned commit under the ID grammar the source declares (TRC-01, TRC-03)
  2. A role that needs something upstream owns gets a build-request file with a stable ID, the upstream IDs it touches, the raising pin, options with a recommended default and the tickets it blocks; BA/PM is its single writer, a duplicate request is not filed twice, a request moves only through the closed lifecycle, and the folder stays within a byte budget that the validator and `state-check` enforce (BR-01, BR-03, BR-07)
  3. A ticket waiting on a build request stays in `Blocked` with a bullet naming the request, a board from before v3.1 validates unchanged under v3.1 (cross-version test), and upstream waits escalate on their own threshold, not on `blocked_escalation_days` (BR-02, BR-06)
  4. The human sees a carry list of open build requests to take upstream, and grugops writes nothing into the upstream repository; a request is answered only when a human sets a new pin, and the answer enters the shared context as a `claim` citing the upstream ID and pin (BR-04, BR-05)
  5. When upstream provides a stack or architecture decision, the Greenfield Mapper and the Architect take it as given input (ADR status `Accepted (upstream)`) and a deviation becomes a build request; a conflict with a grugops floor (the §14 gate, security and NFR gates, verify-before-write, the git-host floor) becomes a build request plus a human stop, and the floor does not move (ARCH-01, ARCH-02)

**Plans**: 14/14 plans executed (3 gap-closure plans for UAT gaps G-45-1 and G-45-9)

Plans:
**Wave 1**
- [x] 45-01-PLAN.md — Tracer: an open build request reaches the carry list through `upstream.js requests`; the hardened git read moves to `scripts/upstream-git.ts` with no behavior change
- [x] 45-02-PLAN.md — Architecture as input: Workflow 00 step 1, `Accepted (upstream)` in both ADR templates, Workflow 20's floor rule stated once with its human stop, one pointer line in each of five roles (no split, D-18)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 45-03-PLAN.md — The complete build-request grammar and lifecycle (TDD), opened by a decision checkpoint on the History forms; the carry and escalation derivations

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 45-04-PLAN.md — `BUDGETS.buildRequestBytes` and the one parser in the validator and `state-check` (BR-07)
- [x] 45-05-PLAN.md — The seeded build-request folder on install, re-install and `--migrate`; the BR-02 cross-version test and the deliberate skew run

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 45-06-PLAN.md — `upstream.escalation_days`, the `## Upstream` statement reader, the citation and changed-ID decisions, and the manifest-at-commit, listed-blob and ancestry reads

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 45-07-PLAN.md — The complete `requests` verb: carry list, upstream waits, overlaps, answer proposal and `not-descendant`, read-only
- [x] 45-08-PLAN.md — The validator's TRC-01 statement check and TRC-03 citation check; `UNKNOWN - verify` never a pass or a failure

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 45-09-PLAN.md — The build-request contract, the upstream and board contract changes, the install guide line, gate registrations

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 45-10-PLAN.md — Workflow 20's build-request procedure, per-bullet escalation rule and human-only stop; `escalation_days` in the config reference

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 45-11-PLAN.md — Workflows 03, 09 and 17 call the procedure: citation or statement, the sweep's upstream-waits line, session-start `requests`

**Gap closure (UAT 2026-11-26: G-45-1, G-45-9)**
**Wave 1**
- [x] 45-12-PLAN.md — Grammar: a named human's `withdrawn, by human:<name>` closes an `open` build request (grammar, embeds, contract; UAT decision 1)
- [x] 45-14-PLAN.md — The floor exception in every role-facing copy of the given-input rule (Architect, Greenfield Mapper, Workflow 00 step 1); orchestrator.md points at Workflow 20

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 45-13-PLAN.md — Workflow 20: canonical floors plus the gates, BA/PM files before the floor stop, the floor-stop bullet only a named human lifts, human-only withdrawals of deviation and floor-conflict requests, the WR-03 unblock rule

**Notes**: S-01 settles the board status (a waiting ticket stays in `Blocked`; no new column), S-05 the architecture ownership, and S-07 the merge of architecture as input into this phase. If planning finds the architecture work larger than pointer lines, one Workflow 00 step and the ADR status, split it into its own phase by recorded decision. Every role edit is one pointer line (BA/PM, System Analyst, Architect, Designer, Greenfield Mapper); the procedure lives in the upstream-sources workflow. Research flag (narrow): the Blocked bullet against older installed `state-check.js` copies and the metrics "Blocked time", and the separate sweep threshold. A machine-checkable answer link stays deferred (BR-F1). Names settled in Phase 44 (S-06, 44-CONTEXT.md), to build here: the build-request statuses are `open`, `carried`, `answered` and `withdrawn`, where `carried` means a human took it upstream, and there is no `declined` (D-04); a role signals with an `observation` whose body opens with `Build-request:`, which Workflow 20 already uses for reader refusals (D-05); the threshold key is `upstream.escalation_days`, default `10`, added to the `upstream` closed key set in this phase together with its behavior (D-06); build-request files live at `memory-bank/plans/build-requests/BR-<n>.md` through a new `BUILD_REQUESTS_REL` constant in `install/state-layout.ts`, added in this phase together with its reader (D-07); `BR` is already reserved in the trace.

### Phase 46: One-command install and install --migrate docs

**Goal**: A user installs grugops into the repository they are in with one pinned command copied from the README, without cloning, and the same command updates, checks, migrates and removes it
**Depends on**: Nothing in v3.1 (independent; may run in parallel with Phases 44 and 45)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08, INST-09, INST-10, DOC-01
**Success Criteria** (what must be TRUE):
  1. A user runs `npx grugops@<version> --<agent>` copied from the README inside a git repository and gets the same install a checkout gives, without cloning; the same command form runs uninstall, update, `--check`, `--migrate` and `--dry-run`, and the README shows `npx.cmd` for Windows PowerShell 5.1 (INST-01, INST-02, INST-10)
  2. The command refuses Node below 22, the home directory and a folder that is not a git repository with a clear message, and from a subfolder it targets the git top level; every follow-up command it prints is the versioned `npx` form, never a cache path, and uninstall from a freshly fetched package restores the tree (INST-03, INST-04, INST-05)
  3. The packed tarball carries every file the installer reads, with no runtime dependencies and no lifecycle scripts, and a packed-tarball install test gates each release, green on ubuntu and on a windows-latest job (INST-06, INST-10)
  4. `npm view grugops` shows `3.1.0-rc.0` under dist-tag `next`, published by hand by a named human early in the milestone; after that, releases publish only from CI through trusted publishing, staged until a named human approves, with no long-lived npm token (INST-07)
  5. PROJECT.md records the decision that amends the Out of Scope line (no global binary is documented or required; `npm i -g` is unsupported); the README documents the Claude Code plugin one-liner as a second, Claude-Code-only path with one plugin name everywhere; and README.md, docs/usage.md and docs/how-it-works.md name `install --migrate` and link the pre-v3 page in a form that resolves from the kit home (INST-08, INST-09, DOC-01)

**Plans**: TBD
**Notes**: Claim the npm name first (S-04, research D8 and D9): the first plan prepares a publishable manifest (today's `package.json` is the private `grugops-tooling`) so a named human can publish `3.1.0-rc.0`. `install.js` stays the single installer (D-07/D-08) behind a thin dispatcher that checks Node. S-03 amends the v1.1 Out of Scope line; the docs never show `-g` or `@latest`. The migrate docs ride here because both changes rewrite the README install claims. The plugin-name drift includes `CLAUDE.md` (`grug@grugops`) against `install/README.md` (`grugops@grugops`). Research flag: the first publish and staging, provenance through staging, the installer run from an ephemeral package source end to end, and the Windows proof; whether trusted publishing can publish a brand-new package's first version is `UNKNOWN - verify`. The existing windows-latest test leg stays out of scope; only the packed-tarball install job must be green. No agent approves a staged publish.

### Phase 47: Universal consultant

**Goal**: A role or a human can get a sourced second opinion on a question outside the upstream owner's scope, from one consultant or a panel whose deliverable is where the lenses disagree, and the opinion never becomes verified memory on its own
**Depends on**: Phase 44 (declared sources first) and Phase 45 (upstream-scope questions become build requests; the role byte budget left after its pointer lines)
**Requirements**: CON-01, CON-02, CON-03, CON-04, CON-05, CON-06, CON-07, CON-08
**Success Criteria** (what must be TRUE):
  1. One parameterized consultant role (topic and lens) exists with its procedure in a new workflow; its byte allocation is written before the role, and the role corpus stays within its budget (CON-01)
  2. Only the Orchestrator dispatches the consultant, on a `CONSULT` request from BA/PM, the System Analyst, the Architect or the Designer, or on a human's request; with no config it runs only on request (CON-02)
  3. The consultant answers from declared sources first and cites them; beyond them it answers only questions outside the upstream owner's scope, with sources or `UNKNOWN - verify`, and a question in the upstream owner's scope becomes a build request, never an answer (CON-03, CON-05)
  4. Consultant output enters the shared context only as `claim` or `observation`; a decision that rests on it cites it, and a compliance, privacy or money claim goes to a named human (CON-04)
  5. With the dial at panel (enterprise; single is the lean default) the lenses answer independently, can run on different model tiers through the `models` dial, can include a risk lens that maps critical and major risks when the question calls for it, and one synthesis ends with where they disagree and why, with no vote (CON-06, CON-07, CON-08)

**Plans**: TBD
**Notes**: The last kit change: its byte budget depends on what Phases 44 and 45 spent (the role corpus is near 61 KB against a 64,000 B warning). Registering a 20th role and a new workflow moves many pins (role and workflow counts, ceilings, model tiers, generated adapters, hook manifest, catalog, install census tests); plan one task that regenerates everything. S-08: no always-on skeptic lens. Out of scope: multi-round debate, a judge that picks a winner, one role per domain. Research flag: CON-08 reverses the research default of one consultant adapter, so how lenses reach different model tiers (role schema tier values in `scripts/canonical-frontmatter.ts` are `UNKNOWN - verify`), and panel isolation (one context folder per lens, then one synthesis task). Budget one adversarial red-team round on the new advisory output. Domain packs stay in backlog 999.13. Names settled in Phase 44 (S-06, 44-CONTEXT.md), to build here: the dial is `consult.mode` with values `single` and `panel`, lean `single` and enterprise `panel`, an object so `consult.lenses` can join; with no config a consult runs only on request (D-03); a role asks with an `observation` whose body opens with `Consult:` (D-05).

### Phase 48: Feature docs and the 3.1.0 release

**Goal**: A reader can learn the new features from the public docs, and a user can install the released `3.1.0` with the documented command
**Depends on**: Phases 44, 45, 46 and 47
**Requirements**: DOC-02, DOC-03
**Success Criteria** (what must be TRUE):
  1. The public docs explain how to declare an upstream source, how a build request goes from raised to answered by a new pin, and how to ask the consultant, single or panel, and each new public claim carries a claim anchor held by the claim registry (DOC-02)
  2. `agent-factory/VERSION`, `.claude-plugin/plugin.json`, `package.json` and the README install line read `3.1.0`, the version agreement gate passes, and CHANGELOG has a `[3.1.0]` entry (DOC-03)
  3. The packed-tarball install test passes on the `3.1.0` tarball, which carries every file Phases 44–47 added, and after a named human tags `v3.1.0` and approves the staged publish, `npx grugops@3.1.0 --claude` installs from the registry (DOC-03)

**Plans**: TBD
**Notes**: Standard pattern (docs plus the claim-anchor mechanics from v3.0); no research phase needed. Tagging, pushing and approving the publish are human steps.

## Progress

**Execution order:** numeric, 44 → 48. Allowed overlap: 46 with 44 and 45 (its name-claim plan first).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 44. Upstream source declaration and pin check | v3.1 | 14/14 | Complete    | 2026-11-25 |
| 45. Traceability, build requests and architecture as input | v3.1 | 14/14 | In Progress | - |
| 46. One-command install and install --migrate docs | v3.1 | 0/TBD | Not started | - |
| 47. Universal consultant | v3.1 | 0/TBD | Not started | - |
| 48. Feature docs and the 3.1.0 release | v3.1 | 0/TBD | Not started | - |

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

### Phase 999.12: Follow-up — Phase 37 deferred UAT follow-up: Test 1 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 37 verification
**Source phase:** 37
**Deferred at:** 2026-10-26 during /gsd-verify-work 37 session completion
**Follow-ups:**
- [ ] Test 1: Unblock CI so a push reaches state-check.js . and the validator: re-point the 19 archive-path tests to .planning/milestones/v2.1-phases/; re-base or retire the GAP-D1 flip manifest (check-flip-manifest.ts:66 plus 6 stale derivations); human review of the 31 FROZEN diff-disposition clauses, then a recorded decision on the 690 others (write rows, move base 4d2b8f0, or retire the gate). (deferred 2026-10-24)
  - Note (2026-11-19): phase 43.1 closed the first two clauses under decision 43.1 D-01. Plan 43.1-01 re-pointed the archive-path tests (D0-D4; commits `cba0b729`, `76cb009a`) and retired the flip manifest gate from CI (D6; commit `ce0025fa`). The diff-disposition clause stays open.

### Phase 999.13: Consultant and business-domain packs (BACKLOG)

**Goal:** [Captured for future planning] Let a team add advisory consultant roles for its business domain: business-type domain experts, and non-software roles such as a game studio's game designer, artist and sound artist. Consultants support the BA/PM and answer business questions. They are advisory only: no code, no claims, no gates. A pack is a folder of role and checklist markdown, admitted by the existing role guards (`admitRole`, byte ceilings) and ratified by typed name. Milestone-sized; shape after v3.0. See `999.13-consultant-and-business-domain-packs/999.13-IDEA.md`.
**Source phase:** 42
**Deferred at:** 2026-11-16 during /gsd-execute-phase 42 (human)
**Promoted in part (2026-11-24):** the consultant core moved into milestone v3.1 (Phase 47, CON-01..08). Ratified domain packs and dynamic consultants stay here as backlog (REQUIREMENTS.md CON-F1).
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.14: Upstream design sources, build requests and a universal consultant (BACKLOG — promoted into v3.1, 2026-11-24)

**Goal:** [Captured for future planning] Let a grugops repository build from an approved design package that another system produced (first case: a separate game-studio repository of Claude Code agents). Roles read the package in place, pinned by commit, and BA/PM traces tickets to its IDs. A question the package does not answer, or a change to what the product is, goes back upstream as a build request that a human carries; grugops never decides it. One parameterized consultant role (topic and lens) answers from the declared sources first, and otherwise only questions outside the upstream owner's scope, as `claim` notes; panel mode reports where the lenses disagree. Refines 999.13 and leaves its packs part there. Additive, so a MINOR release (`3.1.0`). See `999.14-upstream-design-sources-and-universal-consultant/999.14-IDEA.md`.
**Deferred at:** 2026-11-24 (human, design discussion after the v3.0.0 release)
**Promoted (2026-11-24):** into milestone v3.1: upstream sources and the trace ref grammar in Phase 44, traceability, build requests and architecture as input in Phase 45, the universal consultant in Phase 47, and the public docs in Phase 48. The packs part stays in 999.13.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
