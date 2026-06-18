# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- 🚧 **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (active)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: it opened with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase wrote into a guarded environment; then a senior-persona overhaul laid the substrate, BDD+TDD closed the business→engineer handoff, a frontend/UI persona and an ASVS security audit ran as parallel content streams, then a TypeScript tooling migration converted the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converged all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update landed as an independent track, a generated docs catalog documented the finished 17-role / 16-workflow set, and finally Phase 19 reopened the milestone post-Phase-18 to add an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 is a major architecture pivot.** It replaces the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other four CLIs degrade to sequential over the same files). The entire decentralization ships with **zero new runtime dependencies** — `node:fs` + markdown + the Claude Code `Agent` tool on top of the v1.2 committed-`.js` tooling layer. grugops's defensible differentiator over DeLM and every multi-agent framework is strict: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp — never a black-box blackboard. The build is foundation-first (Phases 20–22 mechanize the substrate, verifier, and compaction before any role uses them), then parallel execution + clean handoff removal (23–24), governance (25), and an equivalence-oracle dogfood last (26) that honestly retires the A3/DOG-02 dual-path waiver — and only then. grugops's *own* success/cost gain stays `UNKNOWN - verify` until Phase 26 measures it; DeLM's benchmark numbers are never claimed as grugops's.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v2.0 continues from Phase 19, starting at Phase 20.

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

### 🚧 v2.0 Decentralized Factory — Shared Verified Context (Phases 20–26) — ACTIVE

- [x] **Phase 20: Shared-Context Substrate & Concurrency Foundation** — the atomic-write helpers, the typed-note schema, the verify-stamp validator hooks, the file-based queue, and the grep guard — mechanized before any role writes to the shared context (all 4 plans executed 2026-06-17 — awaiting phase verification) (completed 2026-06-17)
- [x] **Phase 21: Verify-Before-Write Admission** — the §14 gate as the un-cheatable verifier; refuse-self-set; the read-before-act / write-after-verify protocol (Workflow 16) (completed 2026-06-17 — 4/4 plans incl. CR-01 CRLF gap-closure 21-04; verification 4/4)
- [ ] **Phase 22: Memory & Trajectory Compaction** — two-tier memory + the `context.compaction` dial + the load-bearing-field carve-out (Workflow 18), landed before parallel fan-out makes the token tax real (all 4 plans executed 2026-06-18; CMP-02 gap-closure round 3 22-04 stable-id rewrite closed 7 bypasses but re-verification = GAPS_FOUND: CMP-02 still bypassable by CR-01 [failed-attempt path skips the byte-equal check] + CR-03 [no raw-side id-collision guard], both reproduced at exit 0 — round 4 `/gsd-plan-phase 22 --gaps` pending. CMP-01 + CMP-03 verified.)
- [ ] **Phase 23: Parallel Execution & Orchestrator-as-Decomposer** — Orchestrator router→decomposer/scheduler/gate, nested CC spawning + the degraded sequential path, the inverted WR-05 guard, the WIP cap (Workflow 17)
- [ ] **Phase 24: Clean Handoff Removal & Traceability Migration** — rewire all 18 roles + 16 workflows onto the substrate, then delete all 17 handoff templates in one grep-to-zero change; migrate the trace, never drop it
- [ ] **Phase 25: Governance-on-a-Dial** — `context.human_admission` + `context.audit_retention` enterprise tiers over the decentralized substrate; the un-dialable safety floor unchanged
- [ ] **Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement** — the equivalence oracle (on-disk parity), the N-agent parallel dogfood, and the honest token-cost measurement; A3/DOG-02 retired ONLY when the oracle passes

## Phase Details

### Phase 20: Shared-Context Substrate & Concurrency Foundation

**Goal**: Establish the shared verified-context substrate and atomic concurrency primitives — the file locations, the typed-note schema with provenance, the only-sanctioned write path, and the file-based task queue — so that drift is caught as it is written, before any role uses them.
**Depends on**: Nothing new (builds on the v1.2 committed-`.js` tooling layer)
**Requirements**: SCTX-01, SCTX-02, SCTX-03, SCTX-04, SCTX-05, CLAIM-01, CLAIM-02
**Success Criteria** (what must be TRUE):

  1. A note authored against the six-kind schema (`claim`/`finding`/`decision`/`failed-attempt`/`observation`/`artifact-ref`) carries a complete provenance fence (`by`/`at`/`verified_by`/`confidence`/`refs`/`supersedes`) and the markdown is the source of truth; a note missing a required provenance field is a validator structural FAIL.
  2. Two concurrent writes through `appendNote`/`atomicWrite` produce two distinct, un-clobbered notes (no lost-update, no torn append) — proven on a cross-platform path including the Windows unlink-then-rename sequence.
  3. A subtask file moves `pending → claimed → done` by atomic rename, and a `claim.ts` claim via `mkdirSync` is exclusive (a second claimant on the same task fails) with no central lock manager.
  4. The committed per-task JSONL index regenerates byte-identically from the markdown; editing the markdown without regenerating the index trips the `freshness:context` gate (fail-closed), and the markdown wins on any conflict.
  5. `guard_context_writes` fails RED if any shipped role/workflow text writes the shared context by a path other than the sanctioned `context-io.ts` helpers (a planted raw-write fixture proves it).

**Plans**: 4 plans (2 waves)
Plans:
**Wave 1**

- [x] 20-01-PLAN.md — note-schema contract docs + context-io.ts (atomicWrite/appendNote/readContext + deterministic index render + schema validate) [SC-1, SC-2]
- [x] 20-02-PLAN.md — claim.ts: mkdirSync atomic claim + pending→claimed→done rename transitions + generous-TTL stale-sweep [SC-3]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 20-03-PLAN.md — context-freshness.ts freshness:context drift gate (clone catalog-freshness.ts; markdown wins, fail-closed) [SC-4]
- [x] 20-04-PLAN.md — guard_context_writes foundation guard + windows-latest CI leg [SC-5, SC-2 Windows runtime]

### Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier)

**Goal**: Wire the differentiator mechanically — a `finding` is admitted to the shared context only with a real, non-self verification stamp — so the replacement memory is trustworthy before it becomes the sole memory.
**Depends on**: Phase 20 (the schema, validator hooks, and write path must exist)
**Requirements**: VFY-01, VFY-02, VFY-03, VFY-04
**Success Criteria** (what must be TRUE):

  1. A `finding` carrying `verified_by: §14-gate#<id>` (a real gate verdict), a passing test reference, or a named human is admitted; a `finding` with no such stamp is refused.
  2. A `finding` whose `verified_by` is missing, `self`, or the writing agent is a validator structural FAIL — a RED fixture proves a hollow/self-authored stamp fails (mirroring the prod-deploy hook's refuse-self-set).
  3. A role following Workflow 16 (`16-context-read-write.md`) reads the shared context before acting and writes only after verification, and every other role references that single-source protocol rather than restating it.
  4. The §14 gate's bounded `self_fix_attempts` loop drives a bounded verify→regenerate cycle, and the `claim` / `UNKNOWN - verify` escape hatch is honest and explicitly non-load-bearing (a `claim` can never satisfy a `finding`'s admission).

**Plans**: 4 plans (3 waves) — Wave 3 is the CR-01 gap-closure pass after initial verification scored 3/4
Plans:
**Wave 1**

- [x] 21-01-PLAN.md — extend context-io.ts validate() with the refuse-self/impersonation FAIL set + the context-aware admission cross-check (Posture B); RED-then-GREEN fixtures [VFY-01, VFY-02]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 21-02-PLAN.md — §14 gate emits a `by: §14-gate` green verdict (unique per-run id) via context-io.ts on READY_FOR_HUMAN_REVIEW; single-source, references the bounded self_fix_attempts loop [VFY-01, VFY-04]
- [x] 21-03-PLAN.md — author Workflow 16 (single-source read/write/admission protocol) + sync context-note.md + the one-line WF16 pointer in all 17 roles [VFY-03, VFY-04]

**Wave 3 — gap closure** *(closes CR-01 from 21-VERIFICATION.md, which scored SC-1 PARTIAL)*

- [x] 21-04-PLAN.md — CR-01: normalize CRLF/CR to LF in parseNote so a git-autocrlf (Windows) verdict note is read identically to its LF form; RED-then-GREEN CRLF round-trip test over readContext + admit; rebuild + freshness-verify the committed .js [VFY-01]

### Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy)

**Goal**: Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context — landed before parallel fan-out makes the cost real.
**Depends on**: Phase 21 (compacted output is re-verified before write — needs the admission gate)
**Requirements**: CMP-01, CMP-02, CMP-03
**Success Criteria** (what must be TRUE):

  1. An agent's verbose trajectory stays in `.grugops/context/threads/<agent>.md` while only a compact distillation reaches the shared context, and that promoted distillation is re-verified before write.
  2. Compaction never drops a load-bearing field — `verified_by`, `failed-attempt`, `supersedes`, and `by`/`at` provenance survive compaction; a RED test fails if any is dropped.
  3. The `context.compaction: aggressive|balanced|retain-raw` dial changes how aggressively trajectories are distilled, defaults to `aggressive` when absent (lean), and is documented across all three config surfaces.
  4. A role following Workflow 18 (`18-context-compaction.md`) compacts by the single-source protocol, and other roles reference it rather than restating it.

**Plans**: 4/5 plans complete

- [x] 22-01-PLAN.md — compactor.ts carve-out invariant checker (RED-first) + committed compactor.js + the context.compaction dial across all 3 config surfaces + the threads/ .gitignore entry (CMP-01/02/03)
- [x] 22-02-PLAN.md — author WF18 single-source compaction protocol + bump the catalog count test 17→18 + add the one-line WF18 pointer to all 17 roles (CMP-03)
- [x] 22-03-PLAN.md — gap-closure: harden the checkCarveOut safety oracle so CMP-02/SC2 genuinely holds — adversarial RED-first cases + fix CR-01 (mutation/forged stamp), CR-02 (wholly-dropped verified finding), CR-03 (multi-same-kind borrow), WR-01 (fail-closed missing threadDir), WR-02/03/05 hardening, rebuild byte-fresh compactor.js (CMP-02)
- [x] 22-04-PLAN.md — gap-closure round 3: STABLE-ID REWRITE — promoted noteId to an explicit frozen `id:` frontmatter field; rewrote checkCarveOut to an id-keyed exact 1:1 match (affirmative existence + fail-closed + byte-equal load-bearing fields) over an ASYMMETRIC required-survival set (currentState folds out only soft non-verified notes; verified findings + failed-attempts survive unconditionally); DELETED the verifiedKey Set + findCounterpart tuple fallback; strict drop policy; readNoteFields read-path duplicate-key reject; 7 held-out RED-first cases (CR-01/CR-02 P7/CR-02 P8/IN-01/FORGED-FOLD/RAW-FOLD-VERIFIED + read-path duplicate-id); rebuilt byte-fresh compactor.js + context-io.js (CMP-02) — executed 2026-06-18, awaiting phase re-verification
- [ ] 22-05-PLAN.md — gap-closure round 4: ORACLE UNIFICATION — collapse the durable/failed-attempt enforcement seam. Fold the FA path into the ONE id-keyed exact-match + byte-equal pass (no `kind: failed-attempt` exemption — closes CR-01 provenance laundering); add the raw-side id-collision guard mirroring the promoted-side guard (closes CR-03 — verbatim 22-04 must-have); key FA survival on the frozen id not the body token (WR-01); validate `kind ∈ NOTE_KINDS` for every note (WR-03); fail closed on an unparseable raw .md (WR-02); export ONE shared frontmatter parser from context-io.ts and adopt it on the compactor read path (IN-02); generalized parameterized (field × kind) RED-first mutation sweep + the two named reproductions proven RED→GREEN against the committed .js; rebuild byte-fresh compactor.js + context-io.js (CMP-02)

### Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes)

**Goal**: Run both execution paths — parallel on Claude Code, sequential on the four other CLIs — on the one shared substrate: redefine the Orchestrator from router to decomposer/scheduler/gate, invert the WR-05 guard, and cap concurrent width.
**Depends on**: Phase 22 (compaction must be in place before the first parallel fan-out)
**Requirements**: PAR-01, PAR-02, PAR-03, PAR-04, CLAIM-03
**Success Criteria** (what must be TRUE):

  1. The Orchestrator decomposes work into queued subtasks, holds `Agent(<allowlist>)` and the human merge/deploy gate, sets `queue.wip_limit`, and does NOT relay data between agents (coordination is through the shared context only).
  2. On Claude Code, role agents claim tasks and run in parallel via nested sub-agent spawning (depth ≤5); concurrent agent *width* never exceeds `queue.wip_limit` (CLAIM-03 — grugops's responsibility, since the platform caps depth, not width).
  3. The four non-spawning CLIs drain the same queue at concurrency-1 via the rewired `_role-switch-protocol.md` step-4, producing identical on-disk artifacts to the parallel path (one substrate, two modes that converge).
  4. `guard_wr05` is inverted from "no role grants `Agent`" to "only the coordinator grants `Agent(<allowlist>)`", and it flips atomically with the packaging templates and the docs catalog (a planted non-coordinator grant fails RED).

**Plans**: TBD

### Phase 24: Clean Handoff Removal & Traceability Migration

**Goal**: Cut over cleanly from static handoff packets to the shared verified context as the sole inter-role memory — rewire every reader first, then delete in one grep-to-zero change — while preserving the requirement→code→test→release trace.
**Depends on**: Phases 20–23 (the substrate must exist, verify, compact, and be read/written by roles before any handoff is removed)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04
**Success Criteria** (what must be TRUE):

  1. All 18 roles + 16 workflows + 3 packaging templates + AGENTS.md read and write the shared context with zero remaining references to static handoffs (a grep-to-zero gate proves it).
  2. All 17 handoff templates and the `plans/handoffs/` seed are deleted, and `validate-agent-factory.ts` + `generate-catalog.ts` are updated in the SAME change (the validator and catalog never reference a deleted artifact).
  3. The requirement→code→test→release traceability is carried onto note `refs`/trace fields — the trail is preserved end-to-end, never dropped.
  4. `install.ts --migrate` renames a user's `plans/handoffs/` state to a timestamped backup (never delete-first), and `git revert` is the documented rollback.

**Plans**: TBD

### Phase 25: Governance-on-a-Dial

**Goal**: Expose the enterprise governance tiers over the now-stable decentralized substrate — human-gated high-severity admission and audit retention — without touching the lean defaults or the un-dialable safety floor.
**Depends on**: Phase 24 (the substrate is the sole memory and roles are rewired before governance is layered on)
**Requirements**: GOV-01, GOV-02
**Success Criteria** (what must be TRUE):

  1. With `context.human_admission: high-severity` (or `all`), an agent proposes a verified note and a NAMED human disposes high-severity entries (security/architecture/release) before admission; with `off` (lean default) routine verified notes admit without a human stop.
  2. `context.audit_retention: git|retained` controls audit-trail retention, and all three config files are updated in lockstep with lean defaults preserved (zero-config still runs lean).
  3. The un-dialable safety floor is unchanged and not bypassable by any dial setting — verify-before-write, no-fabrication, test-integrity, and humans-hold-merge/deploy all hold regardless of governance configuration.

**Plans**: TBD

### Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement

**Goal**: Turn "degrade, never break" and "verified means verified" from prose into proof — a dual-path equivalence oracle on on-disk artifacts, an N-agent parallel dogfood, and an honest token-cost measurement — and retire A3/DOG-02 only when the oracle passes.
**Depends on**: Phase 25 (both execution paths and the full substrate must be wired end-to-end before the oracle is meaningful)
**Requirements**: DOGF-01, DOGF-02, DOGF-03
**Success Criteria** (what must be TRUE):

  1. A dual-path equivalence oracle (replacing `oracleParity` A3 in `check-uat-oracles.ts`) runs the same seeded task (a) parallel on Claude Code and (b) sequential via single-window role-load and asserts ON-DISK equivalence — the same set of admitted `finding`s, the same gate verdict, the same artifact.
  2. A parallel N-agent dogfood produces N distinct un-clobbered notes, each task is claimed exactly once, and a stale claim is reclaimed — confirming the `isolation: worktree` ↔ shared-context-path interaction.
  3. Aggregate token cost is measured so the ~50% cost claim is DEMONSTRATED with grugops's own numbers or honestly marked `UNKNOWN - verify` (DeLM's benchmark numbers are never asserted as grugops's).
  4. A3/DOG-02 is marked retired ONLY after the equivalence oracle passes — never on handoff deletion alone.

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Substrate, Config & State Skeleton | v1.0 | 5/5 | Complete | 2026-06-02 |
| 2. Shared Contracts | v1.0 | 4/4 | Complete | 2026-06-03 |
| 3. Roles & AGENTS.md Substrate | v1.0 | 8/8 | Complete | 2026-06-03 |
| 4. Workflows, Cadence & Backpressure | v1.0 | 7/7 | Complete | 2026-06-03 |
| 5. Packaging, Adapters, Install & Distribution | v1.0 | 5/5 | Complete | 2026-06-03 |
| 6. Validation, Brand & Dogfood | v1.0 | 5/5 | Complete | 2026-06-04 |
| 7. Shared-Home Foundation & Path Rewrite | v1.1 | 4/4 | Complete | 2026-06-06 |
| 8. Two-Root Installer | v1.1 | 4/4 | Complete | 2026-06-07 |
| 9. Doctor & Two-Root Validator | v1.1 | 6/6 | Complete | 2026-06-08 |
| 10. SDLC-Coverage Audit & Foundation Guards | v1.2 | 4/4 | Complete | 2026-06-10 |
| 11. Senior Persona Overhaul | v1.2 | 5/5 | Complete | 2026-06-10 |
| 12. BDD + TDD Wiring | v1.2 | 5/5 | Complete | 2026-06-11 |
| 13. Frontend/UI Persona & Design→Build Workflow | v1.2 | 3/3 | Complete | 2026-06-11 |
| 14. Security Audit (OWASP ASVS) & Checklist Re-Anchor | v1.2 | 3/3 | Complete | 2026-06-13 |
| 15. TypeScript Tooling Migration | v1.2 | 6/6 | Complete | 2026-06-13 |
| 16. §14 Gate Convergence — Lint, UI/E2E & Test-Integrity | v1.2 | 3/3 | Complete | 2026-06-14 |
| 17. Install --migrate / --update | v1.2 | 3/3 | Complete | 2026-06-15 |
| 18. Browsable Docs Catalog | v1.2 | 2/2 | Complete | 2026-06-15 |
| 19. Factory Auto-UAT Harness — Tier 1 Oracles + Tier 2 Headless E2E | v1.2 | 4/4 | Closed (A3/DOG-02 waived → next milestone) | 2026-06-16 |
| 20. Shared-Context Substrate & Concurrency Foundation | v2.0 | 4/4 | Complete    | 2026-06-17 |
| 21. Verify-Before-Write Admission | v2.0 | 4/4 | Complete    | 2026-06-17 |
| 22. Memory & Trajectory Compaction | v2.0 | 3/3 | Awaiting re-verification | 2026-06-18 |
| 23. Parallel Execution & Orchestrator-as-Decomposer | v2.0 | 0/? | Pending | - |
| 24. Clean Handoff Removal & Traceability Migration | v2.0 | 0/? | Pending | - |
| 25. Governance-on-a-Dial | v2.0 | 0/? | Pending | - |
| 26. Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement | v2.0 | 0/? | Pending | - |

**Totals:** 26 phases · 92 plans complete · 3 milestones shipped (v1.0 + v1.1 + v1.2). Active milestone: **v2.0 Decentralized Factory — Shared Verified Context** (Phases 20–26, 28 requirements, 12 plans executed across Phases 20–22). Phase 20: all 4 plans executed (2 waves) — awaiting phase verification. Phase 21: complete — 4/4 plans (incl. CR-01 CRLF gap-closure 21-04); verification passed 4/4. Phase 22: all 4 plans executed 2026-06-18 (incl. CMP-02 gap-closure round 3 22-04 stable-id rewrite); re-verification 2026-06-18 = GAPS_FOUND — CMP-02 carve-out still bypassable by CR-01 (failed-attempt path skips the byte-equal provenance check) + CR-03 (no raw-side id-collision guard), both reproduced at exit 0 via code-review + adversarial reproduction (green suite alone passed). CMP-01 + CMP-03 verified. Next: Phase 22 round 4 (`/gsd-plan-phase 22 --gaps` — must close BOTH CR-01 + CR-03 + FA-cluster warnings), then Phase 23 (Parallel Execution & Orchestrator-as-Decomposer).
