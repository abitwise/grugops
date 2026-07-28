# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- ✅ **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–19 (shipped 2026-06-16)
- ✅ **v2.0 Decentralized Factory — Shared Verified Context** — Phases 20–26 (shipped 2026-07-28)
- 🚧 **v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board** — Phases 27–33 (active, started 2026-07-28)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepened the kit itself: it opened with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase wrote into a guarded environment; then a senior-persona overhaul laid the substrate, BDD+TDD closed the business→engineer handoff, a frontend/UI persona and an ASVS security audit ran as parallel content streams, then a TypeScript tooling migration converted the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converged all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update landed as an independent track, a generated docs catalog documented the finished 17-role / 16-workflow set, and finally Phase 19 reopened the milestone post-Phase-18 to add an honest Tier-1/Tier-2 auto-UAT harness.

**v2.0 was a major architecture pivot, and it landed.** It replaced the centralized Orchestrator + static handoff packets with three DeLM-derived primitives (arXiv 2606.10662) — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other four CLIs degrade to sequential over the same files, converging on identical on-disk artifacts as proven by a dual-path equivalence oracle). The whole decentralization shipped with **zero new runtime dependencies** — `node:fs` + markdown + the Claude Code `Agent` tool on top of the v1.2 committed-`.js` tooling layer. grugops's differentiator held and is now mechanical: **"verified" means passed the §14 behavior gate**, recorded as an auditable, human-gatable `verified_by` stamp the writing agent cannot forge or self-set — never a black-box blackboard. Built foundation-first (20–22 mechanized the substrate, verifier, and compaction before any role used them), then parallel execution + grep-to-zero handoff removal (23–24), governance (25), and the equivalence-oracle dogfood last (26).

**Two honest outcomes worth keeping visible.** First, grugops's *own* success/cost gain remains **`UNKNOWN - verify`** — Phase 26 built the measurement and it reports no number rather than borrowing DeLM's. Second, the A3/DOG-02 waiver was **not** retired: Phase 26 built the evidence gate that would retire it, and the gate correctly refused to fire because one captured live run was missing (GAP-D1). Both are the no-fabrication constraint working as designed.

**The expensive lesson of v2.0:** across three safety invariants (CMP-02, WR-05, GOV-01) there were **13 documented cases where a fully green test suite still admitted a bypass** — each time because a heuristic detector was a strict subset of the real format's grammar, making the format the attack surface. Closure came only from structural fixes (one authority per predicate; delete the second grammar; move the gate to the point of effect) plus independent red-teaming plus self-reproduction. Budget for this on any future guard/oracle work.

**v2.1 is where a user actually runs it.** v2.0 proved the architecture *on disk*; the first real greenfield test proved that **no role agent ever spawned** — three stacked causes, all confirmed in source — and that two of the kit's headline claims did not survive measurement (caveman-as-token-economy, and a voice guard that stayed green while all 17 blocks drifted fully out of voice). The milestone is corrective and operational: the shared verified context, the queue, and the parallel/sequential dual path are **unchanged**. Its foundational structural fix is one sentence — **"derive the set, assert the count."** Four independent researchers converged on the same systemic defect: hand-maintained set literals (`WR05_SCAN` 4 files, `CTX_WORKFLOWS` 16 of 19, the validator's 14 workflows / 16 roles) drift from the filesystem and stay green. That is the v2.0 closure doctrine in a new shape — not a too-narrow *parser*, but a hand-maintained *list* that rots — and it is the mechanism by which the spawn defect survived a whole milestone. It must land before 17 new adapter files exist, or they land outside every guard meant to protect them.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Phase numbering is continuous across milestones — it never resets. v2.0 ran Phases 20–26; v2.1 continues from Phase 27.

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

### 🚧 v2.1 Autonomous Factory — Real Spawning, Controlled Language & Live Board (Phases 27–33) — ACTIVE

**Milestone goal:** Make the decentralized factory v2.0 designed actually *run* unattended — fix the spawn path so role agents execute in their own sessions, replace ambiguous agent-written prose with a controlled-language profile, let each project decide where a human is involved, and give the operator a live view of the board.

- [ ] **Phase 27: Spawn Correctness & Kit-Set Authority** — derive every guard/validator scan set from the filesystem, then generate all 17 role adapters and wire the coordinator where the runtime honors its allowlist
- [ ] **Phase 28: Kit Consistency Audit** — a real correctness-and-strangeness pass over 18 roles + 19 workflows, the `CLAUDE.md` v2.0 drift reconciled, and every public safety claim given an id
- [ ] **Phase 29: Controlled Language & Voice Guard Rebuild** — an ASD-STE100-derived writing profile for procedural/agent-written surfaces, a de-duplicated role skeleton, and a voice guard that measures voice instead of sentence shape
- [ ] **Phase 30: Per-Checkpoint Autonomy Matrix** — every human stop enumerated and dialable, the four safety floors lowerable only behind two keys, with mechanical claim-dropping
- [ ] **Phase 31: Autonomous Manual Testing** — browser-driven UAT where the committed Playwright spec is the evidence and the agent's narration never is
- [ ] **Phase 32: Board Projector & CLI Dashboard** — one board-grammar authority emitting a typed snapshot, rendered live by a read-only terminal dashboard
- [ ] **Phase 33: Live Capture & Windows Portability** — the captured live run that proves spawning and discharges GAP-D1, plus a green `windows-latest` leg

**Standing obligations from v2.0, and where each lands:**

| # | Obligation | Phase |
|---|------------|-------|
| 1 | **GAP-D1** — one captured live dual-path run → flip A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit | 33 (CAP-01) |
| 2 | **Windows-portability pass** — `windows-latest` leg green, then flip the Phase-20 human item | 33 (CAP-02) |
| 3 | **`orchestrator.md` size** — 7562B against a 7570B hard FAIL ceiling; trim *before* adding spawn text | 27 (SPAWN-06) |
| 4 | **Fail-safe residuals** — all fail-closed, none silent | 28 (AUDIT-01 disposition) |
| 5 | **Hygiene** — delete `agent-factory/handoffs/.gitkeep`; reconcile `CLAUDE.md` | 28 (AUDIT-01/02) |

## Phase Details

### Phase 27: Spawn Correctness & Kit-Set Authority

**Goal**: Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Depends on**: Nothing new (builds on the v2.0 substrate, which is unchanged)
**Requirements**: KIT-01, KIT-02, KIT-03, SPAWN-01, SPAWN-02, SPAWN-03, SPAWN-04, SPAWN-05, SPAWN-06, SPAWN-07
**Success Criteria** (what must be TRUE):

  1. `scripts/kit-model.ts` answers "what roles and workflows exist" by reading the filesystem with an asserted count, and every scan set — `WR05_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`, and the validator's role and workflow lists — resolves through it, so adding a role or workflow file changes every scan set with no hand edit and no stale literal survives. (KIT-01, KIT-02)
  2. The referential-integrity oracle **fails RED against today's tree** — 1 adapter on disk, 7 names granted, 17 roles — before any adapter is authored, and turns green only when the coordinator's spawn grant, the adapter directory, and the role corpus are the same set. (KIT-03)
  3. All 17 role adapters exist at `.claude/agents/grugops-<role>.md`, are produced by the templated generator from `agent-factory/roles/*.md` as thin pointers (never copies of role text), and a byte difference between a committed adapter and a fresh regeneration fails the freshness gate closed. (SPAWN-01, SPAWN-02)
  4. On Claude Code the coordinator runs as the **main-thread** agent so its `Agent(<allowlist>)` grant is honored by the runtime, and no non-coordinator adapter carries the `Agent` tool at all — a mechanism that holds on both the main-thread and subagent paths rather than relying on a frontmatter token the runtime ignores. (SPAWN-03, SPAWN-04)
  5. `guard_adapter_body` fails red on pre-v2.0 handoff/single-window prose anywhere in an adapter body — proven against the surviving `grugops-orchestrator.md:25` reference — `orchestrator.md` sits below its **7570-byte FAIL ceiling with the ceiling unchanged**, and the advertised Claude Code floor reads **v2.1.219+ at depth 3** everywhere it appears, with the v2.1.217–218 depth-1 window documented as a known-bad range that degrades loudly. (SPAWN-05, SPAWN-06, SPAWN-07)

**Plans**: 9/9 plans executed
Plans:
**Wave 1**

- [x] 27-01-PLAN.md — `scripts/kit-model.ts` derivation authority (explicit root arg, throws on vacuity, exact two-sided counts) proven end-to-end through `ROLE_FILES`; the KIT-03 referential-integrity oracle wired in and **failing RED against today's tree**, with RED/GREEN fixture tests [KIT-01, KIT-03]
- [x] 27-02-PLAN.md — installer and uninstaller self-derive their adapter/skill sets by readdir of `$GRUGOPS_SRC`, materialize-vs-copy routed by the resolver slot, uninstall intersected with the target so user-authored agents survive [KIT-02]

**Wave 2** *(blocked on 27-01)*

- [x] 27-03-PLAN.md — `check-foundation-guards.ts`: derive `ADAPTERS` (+ vacuity floor and skill count), rename and derive the spawn-grant scan set to kill the cross-file `WR05_SCAN` collision, derive `CTX_WORKFLOWS` 16→19; per-consumer assertions + the committed literal inventory [KIT-02]
- [x] 27-04-PLAN.md — `validate-agent-factory.ts` derives its frozen 14/16 lists (extension stripped at the call site); `check-kit-refs.ts` reaches `.claude/agents` as a directory, derives `MARKER_SITES` (D-27), and restates Assertion 3 as a two-sided derived predicate [KIT-02]
- [x] 27-05-PLAN.md — trim `orchestrator.md` below the 7165-byte WARN tier with the ceiling unchanged and no relocation; capability-keyed spawn instruction; depth-3 + tuning env var + real concurrency cap across the remaining surfaces, table asymmetry preserved [SPAWN-06, SPAWN-07]

**Wave 3** *(blocked on 27-05)*

- [x] 27-06-PLAN.md — `capabilities:` inline-scalar frontmatter on all 17 roles (closed vocabulary, background-subagent-safe); packaging template defines the specialist body, the coordinator body carrying the honest three-tier announcement (Full / Reduced / Degraded) selected by capability-sensing, and the capability→tool mapping [SPAWN-01]

**Wave 4** *(blocked on 27-01, 27-03, 27-06)*

- [x] 27-07-PLAN.md — `generate-role-adapters.ts` + the 17 committed thin-pointer resolver adapters (one coordinator with a generated 16-name grant, no spawn token on any other), turning the KIT-03 oracle GREEN; `adapters-freshness.ts` byte-and-set gate [SPAWN-01, SPAWN-02, KIT-03]

**Wave 5** *(blocked on 27-03, 27-04, 27-07)*

- [x] 27-08-PLAN.md — `dead-vocabulary.ts` as the one retired-vocabulary source (two justified consumers); `guard_adapter_body` both directions over the derived scan set + template; `guard_wr05` asserts tier-announcement presence and no non-coordinator spawn token [SPAWN-04, SPAWN-05]

**Wave 6** *(blocked on 27-07, 27-08)*

- [x] 27-09-PLAN.md — document the three entry tiers and the deliberate absence of main-thread wiring (`claude --agent grugops-orchestrator` as the full-capability path, no settings-parity claim); assert the in-repo half by command and verify the runtime half by hand against a real session [SPAWN-03]

**Ordering that is load-bearing inside this phase** — the kit-set authority and the referential-integrity oracle land **first**, the `orchestrator.md` trim lands **before** any spawn-allowlist text is added, and only then are the 17 adapters generated. Reversing that order reproduces the exact failure this phase exists to fix, with new names.

**Research flag:** plan with `--research-phase`. The main-thread-vs-subagent coordinator wiring (`--agent` flag / `settings.json` `{"agent": ...}`) must be validated against the real installed adapter flow (`install.ts`'s `materializeAdapter()`) — a genuine platform-schema integration point grugops has not used before.

### Phase 28: Kit Consistency Audit

**Goal**: The kit describes the architecture it actually ships, every role and workflow has been read with a recorded verdict, and every public safety claim carries an id — so a later phase has something concrete to void.
**Depends on**: Phase 27 (the derived scan sets and generated adapters are the tree the audit reads; auditing the stale tree would produce findings Phase 27 already dissolved)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):

  1. Each of the 18 roles and 19 workflows has a recorded disposition — fixed, accepted, or deferred with a reason — so no file is reviewed-but-unrecorded and the count of dispositions equals the count of files on disk. (AUDIT-01)
  2. `CLAUDE.md` describes the v2.0 architecture the repo actually has: no handoff packets, and an Orchestrator that decomposes rather than routes. (AUDIT-02)
  3. Every public safety claim in `README.md`, `AGENTS.md`, and `agent-factory/README.md` appears in a registry with an id, so Phase 30's claim-dropping mechanism has a named target rather than a prose search. (AUDIT-03)
  4. The `@playwright/test` and `@axe-core/playwright` pins in the gate templates match versions **verified at the time of change** (1.60.0 → 1.62.0, 4.11.3 → 4.12.1 as of 2026-07-28), with the verification recorded rather than assumed. (AUDIT-04)

**Plans**: TBD

**Note:** the `CTX_WORKFLOWS` derivation the research assigned here is already covered by KIT-02 in Phase 27; this phase consumes the derived sets rather than re-deriving them. Standing obligations #4 (fail-safe residuals) and #5 (hygiene — `agent-factory/handoffs/.gitkeep`) are dispositioned under AUDIT-01.

### Phase 29: Controlled Language & Voice Guard Rebuild

**Goal**: Procedural and agent-written prose follows one enumerated writing profile so two agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced block per role and is measured as voice, not as sentence shape.
**Depends on**: Phase 28 (the audit produces the safety-surface exclusion list and the claim registry this rewrite must honor; rewriting first means re-rewriting text the audit would have flagged)
**Requirements**: LANG-01, LANG-02, LANG-03, LANG-04, LANG-05, LANG-06, LANG-07, LANG-08
**Success Criteria** (what must be TRUE):

  1. The kit ships a grugops-authored, ASD-STE100-**derived** writing profile — enumerated rules plus a project Technical Names/Verbs set — with a non-affiliation and not-certified disclaimer, vendoring no part of the ASD dictionary. (LANG-01)
  2. The profile governs workflow steps, checklists, memory-bank, shared-context notes, board, and traceability; it leaves the fenced caveman identity blocks alone; and a named safety-surface exclusion list keeps load-bearing security, compliance, and admission text from being reworded by a style pass. (LANG-02, LANG-03)
  3. The guard is **named for the decidable subset it checks** — lexicon membership, sentence length, banned constructions — and nowhere in the kit is ASD-STE100 conformance claimed, nor a token-economy win, nor an LLM-comprehension benefit (that one stays `UNKNOWN - verify`). (LANG-04)
  4. The rebuilt voice guard **fails RED on all 17 current caveman blocks** as acceptance evidence before the rewrite lands, measures against a committed lexicon rather than sentence shape, and publishes a number with a denominator. (LANG-06)
  5. `## One job`, the caveman block, and `## Responsibilities` each say a thing once; `guard_ste` and the rebuilt voice guard read the fence through **one** parser, never two grammars over the same bytes; and byte ceilings are re-baselined exactly once at end of phase with every file ≤ its previous value and the delta recorded — never raised mid-phase. (LANG-05, LANG-07, LANG-08)

**Plans**: TBD

**Honesty floor for this phase:** STE likely *increases* token count (its rules forbid the telegraphic omission caveman relies on). The profile is justified on determinism and one-term-per-concept grounds only. Caveman-as-token-economy is disproven on this artifact and must not be restated.

### Phase 30: Per-Checkpoint Autonomy Matrix

**Goal**: A project decides where a human stops it, per checkpoint — including the four current safety floors — and a lowered floor is never silent: it takes a second key an agent cannot set, it shows up in the trace and in the run banner, and the public claim it backed is dropped.
**Depends on**: Phase 29 (the controlled-language pass touches governance and config prose; doing 30 first means rewriting freshly-written governance text and re-running this phase's expensive red-team gate a second time)
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, AUTO-06, AUTO-07
**Success Criteria** (what must be TRUE):

  1. Every human stop in the kit is a member of one closed, exported checkpoint set sourced from the `## Stop conditions` and role `## Hard limits` sections — and adding a checkpoint without a default is a **compile error**, not a silent default-open. (AUTO-01)
  2. A per-checkpoint ternary matrix (`block` / `notify` / `off`) replaces the `autonomy` scalar; any unknown, malformed, or unreadable value gates **at least as strictly as `block`**; and `readGovernanceConfig` / `readGovernanceConfigResult` collapse into a **single** discriminated-result reader whose failure path is fail-closed — the second authority is deleted, not joined by a third. (AUTO-02, AUTO-06)
  3. Lowering a safety floor requires **two keys** — a declaration in config (agent-writable, form-checked only) plus authorization via a per-floor session env var the hook process reads fresh (agent-unwritable) — so an agent that writes the config alone changes nothing, and no grant is blanket. (AUTO-03)
  4. `test_integrity` is enforced at the **point of effect** — `emitVerdict()` refuses GREEN — rather than being handed a false-equivalent env-var mechanism it cannot actually enforce; the hook-enforced vs in-process tier split is stated explicitly rather than papered over. (AUTO-04)
  5. A lowered floor is visible without reading config: the generated guarantees render and a per-run banner both name every non-default checkpoint, so a lowered floor can never leave an overstated claim standing in the docs — and a zero-config repo behaves **exactly** as it does today, with no floor lowered by omission. (AUTO-05, AUTO-07)

**Plans**: TBD

**This is the direct successor to Phase 25** — the hardest phase in the project (8 rounds; 13 documented green-suite-insufficient bypasses across the milestone; closure required a structural fix + ≥2 independent red-teams + self-reproduction). Its **red-team rounds are budgeted as scope, not overrun.** A green suite does not close a floor here.

**Research flag:** plan with `--research-phase`. The two-key floor-lowering mechanism and the `test_integrity`-to-point-of-effect move both touch `emitVerdict()`, a byte-frozen safety path, and deserve their own red-team round separate from the rest of the phase.

### Phase 31: Autonomous Manual Testing

**Goal**: An agent can drive a real browser to produce UAT evidence, and the only thing that counts as evidence is an artifact the §14 gate re-runs — never the agent's narration of what it saw.
**Depends on**: Phase 30 (browser evidence enters through the verify-before-write path, and Phase 30 is where that path's dialability is settled; evidence written against a floor whose semantics change a phase later would have to be re-derived)
**Requirements**: UATX-01, UATX-02, UATX-03, UATX-04, UATX-05, UATX-06
**Success Criteria** (what must be TRUE):

  1. A committed Playwright spec, re-run by the existing §14 gate, is the machine-verifiable evidence floor; an agent's narration or an MCP tool-call transcript never produces a stamp. (UATX-01)
  2. An agent authors those specs through browser MCP tooling, with `@playwright/mcp` pinned (pre-1.0) and the setup documented for all five host CLIs — and `package.json` gains nothing, because the server is `npx`-invoked by the user's own agent. (UATX-02)
  3. Claude in Chrome is available as an optional, clearly-labelled `verified_by: <named human>` lane and is **structurally barred** from producing a `§14-gate` stamp — attended-only, force-disabled under API-key auth, Claude-Code-only, so it can never be gate evidence. (UATX-03)
  4. An evidence note carries commit SHA + gate-run id + content hash, and a note whose SHA is not the HEAD the gate ran against is refused. (UATX-04)
  5. An absent or unusable browser produces a **loud skip** that leaves the UAT `pending` (reusing the existing Tier-2 convention verbatim, never a silent pass), and a generated spec containing a conditional or caught assertion is rejected over the **TypeScript AST** rather than by regex, so the claim matches the mechanism. (UATX-05, UATX-06)

**Plans**: TBD

**Research flag:** plan with `--research-phase`. Whether `mcp__claude-in-chrome__*` tools are reachable from inside a subagent is explicitly `UNKNOWN - verify`; verify before designing any flow that assumes it. The phase's core recommendation (Playwright as the floor) does not depend on the answer.

### Phase 32: Board Projector & CLI Dashboard

**Goal**: The operator watches the factory live from one read-only terminal view, fed by a single board-grammar authority whose typed snapshot a future web renderer could consume unchanged.
**Depends on**: Phase 30 (the autonomy banner names every non-default checkpoint) and Phase 28 (stabilized state surfaces)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):

  1. `scripts/board-model.ts` is the **only** board grammar in the tree — the column-heading parser is extracted from and **deleted in** `validate-agent-factory.ts` with the WR-03 prefix-match hardening ported verbatim — and the ticket-row and WIP-number grammars are pinned by a written spec plus a parse-oracle fuzz suite whose adversarial corpus includes the board's own large HTML-comment documentation block. (DASH-01, DASH-02)
  2. One typed `FactorySnapshot` joins board, ticket frontmatter, queue state, context notes, and traceability, and **surfaces** board-vs-frontmatter disagreement in a `conflicts[]` field rather than silently resolving it. (DASH-03)
  3. The dashboard follows a live run using directory-level `fs.watch` plus a **mandatory** polling floor and debounce (because grugops's own atomic-rename write path silently orphans a file-level watch), and never renders a torn read, a partial parse, or an ENOENT as an empty board — a stale snapshot shows a visible stale badge over the last good read. (DASH-04, DASH-05)
  4. The dashboard **cannot** write: an import-graph guard proves its module tree holds no mutating `node:fs` symbol, so read-only is mechanically enforced rather than asserted in prose. (DASH-06)
  5. `--json`, `--once`, and non-TTY modes work for CI and piping; the renderer degrades **visibly** rather than showing a confident wrong board; the snapshot shape is stable enough for a future web renderer to consume unchanged; and the dashboard adds **zero** runtime dependencies and opens no listening socket this milestone. (DASH-07, DASH-08)

**Plans**: TBD

**Research flag:** plan with `--research-phase`. The board ticket-row grammar is genuinely unmeasured in the wild (only two disagreeing HTML-comment examples exist) — sample real agent-written board rows before freezing the grammar, or the parser becomes a de-facto spec agents then drift away from.

**Windows caveat (honest, not a defect):** the `fs.watch` behavior this phase depends on is only *proven* on Windows once Phase 33 turns the `windows-latest` leg green. Until then this phase's Windows claim stays `UNKNOWN - verify` rather than asserted. This is a terminal renderer only — no web or frontend surface; the web renderer is explicitly deferred.

### Phase 33: Live Capture & Windows Portability

**Goal**: The milestone's headline claims are proven by capture rather than by a green suite — one live run shows role agents executing in their own sessions, which is also the evidence the project's oldest open item has waited for since v1.0.
**Depends on**: Phase 27 (spawning must genuinely work before it can be captured) and Phase 32 (the Windows `fs.watch` surface this phase turns green)
**Requirements**: CAP-01, CAP-02, CAP-03
**Success Criteria** (what must be TRUE):

  1. A **captured** live run shows role agents executing in their own sessions — the spawn fix proven by observation, never by the green suite that failed to detect the defect in the first place. (CAP-03)
  2. That capture (date + verdict) discharges GAP-D1: A3/DOG-02 flips together with the coupled `examples/03-ticket-to-pr.md` cleanup, in one edit — and a loud skip is never accepted as the capture. (CAP-01)
  3. The `windows-latest` CI leg exits 0 — path-assertion normalization, symlink-fixture privilege guard, buildable old-layout migrate fixture, temp-dir `tsc` mirror rebuild — which also turns the dashboard's Windows `fs.watch` surface from assumed into proven, and flips the Phase-20 human item on green. (CAP-02)

**Plans**: TBD

## Progress

**Execution order:** 27 → 28 → 29 → 30 → 31 → 32 → 33

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
| 22. Memory & Trajectory Compaction | v2.0 | 9/9 | Complete    | 2026-06-19 |
| 23. Parallel Execution & Orchestrator-as-Decomposer | v2.0 | 3/3 | Complete    | 2026-06-21 |
| 24. Clean Handoff Removal & Traceability Migration | v2.0 | 5/5 | Complete    | 2026-06-22 |
| 25. Governance-on-a-Dial | v2.0 | 13/13 | Complete | 2026-06-29 |
| 26. Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement | v2.0 | 6/6 | Complete | 2026-07-24 |
| 27. Spawn Correctness & Kit-Set Authority | v2.1 | 9/9 | In Progress|  |
| 28. Kit Consistency Audit | v2.1 | 0/TBD | Not started | - |
| 29. Controlled Language & Voice Guard Rebuild | v2.1 | 0/TBD | Not started | - |
| 30. Per-Checkpoint Autonomy Matrix | v2.1 | 0/TBD | Not started | - |
| 31. Autonomous Manual Testing | v2.1 | 0/TBD | Not started | - |
| 32. Board Projector & CLI Dashboard | v2.1 | 0/TBD | Not started | - |
| 33. Live Capture & Windows Portability | v2.1 | 0/TBD | Not started | - |

**Totals:** 33 phases · **4 milestones shipped** (v1.0 + v1.1 + v1.2 + v2.0) · **1 active** (v2.1, phases 27–33).

**v2.0 final:** all 7 phases (20–26) complete and archived 2026-07-28. Audit `tech_debt` — 28/28 requirements satisfied, 7/7 phases verified, 8/8 integration boundaries wired, 7/7 Nyquist compliant, no blockers. Closed as `override_closeout` (Phase 20's Windows-CI human item genuinely open; Phase 25's `unknown` is a frontmatter-parse artifact, not a gap). 11 open artifacts deferred, 9 of them pre-v2.0 carryover.

**v2.1 coverage:** all **46** v2.1 requirements mapped to exactly one phase — 0 unmapped, 0 duplicated. (`REQUIREMENTS.md` prose says "all 41 requirements retained"; the enumerated set is 46. The count was written before the categories were finalized. Fittingly, this is the milestone's own founding defect — a hand-maintained count that drifted from the enumerated reality — caught here by counting instead of trusting.)
