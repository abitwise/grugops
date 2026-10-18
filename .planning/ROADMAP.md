# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- ✅ **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (shipped 2026-07-28)
- ✅ **v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board** — Phases 27–34.1 (shipped 2026-10-18, gaps accepted)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: it opened with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase wrote into a guarded environment; then a senior-persona overhaul laid the substrate, BDD+TDD closed the business→engineer handoff, a frontend/UI persona and an ASVS security audit ran as parallel content streams, then a TypeScript tooling migration converted the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converged all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update landed as an independent track, a generated docs catalog documented the finished 17-role / 16-workflow set, and finally Phase 19 reopened the milestone post-Phase-18 to add an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 was a major architecture pivot, and it landed.** It replaced the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other CLIs degrade to sequential over the same files, converging on identical on-disk artifacts as proven by a dual-path equivalence oracle). grugops's differentiator is mechanical: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp the writing agent cannot forge or self-set.

**v2.1 made it runnable and closed with its headline unproven.** Every guard and validator scan set now derives from the filesystem and all 17 role adapters are generated from one source; a controlled-language profile is held by three gates; per-role model and effort dials reach installed repos; every human stop is a dialable checkpoint over a git-host hard floor (the Bash command-parsing guard was retired, 33.1 D-17); a read-only live board renders the state; Pi joined as a sixth host and the installer installs per named agent. The captured live run proving role agents work in their own sessions (GAP-D1, CAP-01/CAP-03) was attempted three times and read `fail` each time — it is carried forward, not fabricated. Seven of thirteen phases closed by recorded human decision at the four-round gap-closure cap. Audit: `milestones/v2.1-MILESTONE-AUDIT.md` (`gaps_found`, 52/64, accepted).

**The expensive lesson, twice over:** a green suite is a precondition, never proof, for a safety invariant (v2.0: 13 catches). v2.1 added the remedy for loops that will not converge — a canonical form that refuses everything outside one allow-list, or moving enforcement to the system of record — and a four-round cap after which a human closes the phase by decision.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v2.1 ran Phases 27–34.1; the next milestone continues from Phase 35.

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
