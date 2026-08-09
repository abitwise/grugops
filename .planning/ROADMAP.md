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

**Plans**: 45/46 plans executed — 43 executed; gap-closure round 8 (`27-43`…`27-46`) planned 2026-08-09
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

**Gap closure** *(from `27-VERIFICATION.md` — 5 failed truths, 1 human-needed, 7 warning-class items; waves restart at 1 because the nine plans above are complete)*

**Gap wave 1**

- [x] 27-10-PLAN.md — TRACER: one recursive adapter-set authority in `kit-model.ts` (`listAgentAdapters`/`listSkillAdapters`), the foundation guards' two duplicate directory reads deleted, a nested adapter refused by name, and the planted nested-coordinator bypass turned RED [KIT-02, KIT-03]

**Gap wave 2** *(blocked on 27-10)*

- [x] 27-11-PLAN.md — the adapter freshness gate consumes the authority, gains a hermetic kit root, gets a five-case test file, and is wired into the ubuntu-only CI gate block; `check-kit-refs` drops its duplicate derivation [KIT-02, SPAWN-02]
- [x] 27-12-PLAN.md — `scripts/frontmatter.ts` as the one format-aware frontmatter-value and fence authority; the line-anchored grant grammar deleted from both consumers; the folded-scalar bypasses turned RED; parser-oracle fuzz across the YAML scalar forms [SPAWN-04, KIT-03]
- [x] 27-13-PLAN.md — installer/uninstaller symmetry: one fail-loud contract for one derivation, a nested-source refusal, the runnable mirror made removable, and the control byte that broke grep over the installer replaced [KIT-02]

**Gap wave 3** *(blocked on 27-12)*

- [x] 27-14-PLAN.md — `guard_adapter_body` hardened: the positive half anchored to full sentences and counted exactly once, the packaging template checked against the fenced body shapes the generator copies, a vacuity floor that can fire, and the literal inventory's completeness claim made true [SPAWN-05]

**Gap wave 4** *(blocked on 27-14)*

- [x] 27-15-PLAN.md — the shipped capability announcement names a command that exists; three sources corrected, adapters regenerated inside a stated byte budget with both ceilings unchanged, and the command name pinned by a guard beat [SPAWN-01]

**Gap wave 5** *(blocked on 27-15)*

- [x] 27-16-PLAN.md — `coordinator-resolution-precheck.ts` discharges every observable precondition of the runtime check and prints the two human-only steps verbatim; one recording surface shipped empty and marked unverified [SPAWN-03]

**Gap wave 6** *(blocked on 27-16)*

- [x] 27-17-PLAN.md — blocking human-verify checkpoint: observe a real session, transcribe the observation verbatim, and update the requirement's status only if it matched [SPAWN-03]

**Gap closure round 2** *(from `27-REVIEW-GAPS.md` — a code review of the gap-closure half itself, diff `7f8d016..HEAD`: 3 critical, 5 warning, 2 info, all 10 scoped in. Every critical was reproduced on a hermetic mirror printing `ALL CHECKS PASSED`.)*

**Gap wave 7**

- [x] 27-18-PLAN.md — TRACER: the frontmatter authority refuses YAML anchors, aliases and merge keys instead of reading them as a clean no-grant, proven end-to-end from the module through the committed `.js` to the aggregator on the skill surface; the parser oracle gains a refused-form product with its own cardinality pin [SPAWN-04, KIT-03] *(CR-01)*

**Gap wave 8** *(blocked on 27-18)*

- [x] 27-19-PLAN.md — KIT-03 stops comparing filenames against frontmatter names without asserting the two agree; the identity authority is named, the founding defect stops reproducing, and the fixtures can express the namespace split [KIT-03, KIT-02] *(CR-02)*
- [x] 27-21-PLAN.md — the installers' INCOMPLETE banner gains a machine-readable exit code behind a blocking decision checkpoint, every test pin is enumerated from source and moved with the contract, and the coordinator precheck refuses on the banner as well as the status [KIT-02, SPAWN-03, SPAWN-07] *(WR-01)*
- [x] 27-23-PLAN.md — the adapter generator's second frontmatter grammar is deleted for byte-identical output, the freshness gate stops leaking its temp mirror, and `check-kit-refs` + `validate-agent-factory` gain direct CI steps [SPAWN-01, SPAWN-02, KIT-02, SPAWN-06] *(WR-03, IN-01, IN-02)*

**Gap wave 9** *(blocked on 27-19 and 27-21 — shared files, not shared logic)*

- [x] 27-20-PLAN.md — `guard_wr05`'s tier beats get the same comment-stripped, occurrence-counted treatment `guard_adapter_body` already has, and an agent adapter declaring no `tools` key becomes a named finding rather than a compliant silence [SPAWN-05, SPAWN-04] *(CR-03, WR-05)*
- [x] 27-22-PLAN.md — the installer's source derivation resolves a symlink the way the authority and the platform do, with a conformance fixture that can see the shape; `mappingDests` derives its own cardinality so a missed entry fails the parse [KIT-01, KIT-02] *(WR-02, WR-04)*

**Gap closure round 3** *(from `27-VERIFICATION.md` dated 2026-07-30T19:30:00Z — `gaps_found`, 7/10 clean, 3 partial with live reproduced defects, plus `27-REVIEW-GAPS-2.md`'s 4 Critical + 1 Warning. Waves restart at 1 because plans 27-01..27-23 are all executed. WR-03 and IN-02 are explicitly out of scope this round.)*

**Gap wave 1**

- [x] 27-24-PLAN.md — TRACER: the frontmatter authority refuses a YAML **tag** standing in front of a reference, closing the fail-open that returned in a new spelling; proven end-to-end from the module through the committed `.js` to the aggregator on the skill surface, with the tag axis enumerated by shape and both cardinality pins raised [KIT-03, SPAWN-04] *(CR-01)*

**Gap wave 2** *(blocked on 27-24)*

- [x] 27-25-PLAN.md — the `install.ts`/`uninstall.ts` derivation pair collapses into one shared `install/kit-source.ts` both import (D-28), still never importing `scripts/kit-model.ts`; the uninstall round-trip fixture gains the symlinked adapter and symlinked skill directory it previously only claimed [KIT-02] *(CR-02, WR-02)*

**Gap wave 3** *(27-26 blocked on 27-24; 27-27 blocked on 27-25 — split by shared file, not shared logic)*

- [x] 27-26-PLAN.md — the `tools`/`allowed-tools` key gets the cardinality arm its sibling `name` key received in 27-19, so a duplicate declaration is refused by name and count on both key spellings instead of passing both guards with the grant silently gone [SPAWN-04, KIT-03] *(WR-01)*
- [x] 27-27-PLAN.md — one cycle answer at both walk sites (D-29): a per-path ancestor stack replaces the installer's global visited set and `kit-model`'s absent guard, so a cycle terminates by contract and a directory reachable by two paths contributes both members [KIT-01, KIT-02] *(CR-03, D-29)*

**Gap wave 4** *(blocked on 27-25 and 27-27)*

- [x] 27-28-PLAN.md — the uninstaller implements the self-checkout refusal its README already publishes, on a marker that can actually fire, closing a reproduced data-loss path; every exit-code row becomes true of the binaries it claims to cover [KIT-02] *(CR-04, IN-01)*

**Ordering that is load-bearing in gap-closure round 3** — the tracer (27-24) closes the shared parser fail-open and establishes the RED-before / GREEN-after proof pattern before any expansion; 27-25's structural collapse must land before 27-27 can give the moved walk its cycle treatment and before 27-28 can add a refusal to the restructured uninstaller. Waves 3 and 4 are split by shared FILE rather than shared logic: 27-24 and 27-26 both edit `check-foundation-guards.test.ts`, and 27-25, 27-27 and 27-28 all edit `install/install.test.ts`.

**Gap closure round 4** *(from `27-VERIFICATION.md` dated 2026-07-31T13:00:00Z — `gaps_found`, 7/10 clean, with ONE live independently-reproduced BLOCKER shared by KIT-03 and SPAWN-04 plus four warning-tier KIT-02 residuals, against `27-REVIEW-GAPS-3.md`'s 1 Critical + 4 Warnings + 3 Infos. Waves restart at 1 because plans 27-01..27-28 are all executed. **D-31: nothing from round 3 is deferred — all eight findings close this round.**)*

**Gap wave 1**

- [x] 27-29-PLAN.md — TRACER: the frontmatter authority's double-quoted branch is INVERTED to an escape ALLOWLIST (D-30), so a backslash spelling nobody enumerated refuses BY DEFAULT instead of being deleted into a value no YAML loader computes; proven RED-before / GREEN-after against the committed `.js` at module and aggregator level, with an exhaustive dependency-free escape-alphabet property and both false-red controls [KIT-03, SPAWN-04] *(CR-01)*

**Gap wave 2** *(both blocked on 27-29; disjoint files, run in parallel)*

- [x] 27-30-PLAN.md — the second silent-SUCCESS arm in the same module is closed: a leading YAML directive line is refused by name instead of reading as "no frontmatter, no keys" (D-34), and the agent-adapter scoping gate gets the negative control that makes it load-bearing [KIT-03, SPAWN-04] *(IN-02, IN-01)*
- [x] 27-31-PLAN.md — both recursive walks get a WORK bound explicitly separate from the per-path cycle answer (D-35), and the cycle arm stops dropping members silently (D-36): reported as a verification finding in the installer, thrown as a named error in the kit-set authority, each matching that side's documented floor [KIT-01, KIT-02] *(WR-01, WR-04)*

**Gap wave 3** *(blocked on 27-31 — shared `install/install.ts` and `install/install.test.ts`)*

- [x] 27-32-PLAN.md — the self-checkout marker pair collapses into one exported constant naming the RUNTIME artifact, with a read-only real-repository existence assertion as the forcing function CR-04 never got (D-37); the stale duplicate-walk rationale is amended to D-28's and the equality it appeals to becomes a case (D-38); the reversal docs match the always-on refusal [KIT-02] *(WR-02, WR-03, IN-03)*

**Gap wave — round 5, wave 1**

- [x] 27-33-PLAN.md — the delimiter positions of `scripts/frontmatter.ts` DECLARE THE ONE LEGAL SPELLING (the payload followed only by `[ \t]`) and refuse everything else, whatever follows — graphic, invisible, combining, unassigned, private-use, or another dash (D-39, D-43); pinned by a NON-CIRCULAR sweep drawn from the negative space of the rejected alphabet and by a false-red control that consumes the one exported scan composition and asserts set equality; the grant enumeration refuses a nested paren or a quote instead of returning a short or altered list (D-41) [KIT-02, KIT-03, SPAWN-04] *(CR-01, WR-02)*

**Gap wave — round 5, wave 2** *(blocked on 27-33 — its aggregator-level case exercises the parser refusal 27-33 lands, and it widens the composition 27-33 creates)*

- [x] 27-34-PLAN.md — the shipped plugin-form `skills/` tree is derived from `kit-model` with an asserted cardinality, folded into the single exported spawn-grant scan composition, and named in `guard_wr05`'s PASS line, pinned by a plant case that targets a SKILL adapter; the plugin-default component directories `agents/` and `commands/` get an absence-or-coverage floor that closes the CLASS rather than the instance; the two distribution forms' relationship is asserted mechanically with a discriminating wrong-name case and the one legitimate divergence exempted by name (D-40); the name floor stops reporting "no name key" over a document with no frontmatter block at all (D-41) [KIT-02, KIT-03, SPAWN-04] *(CR-03, name-floor misdiagnosis)*

**Gap wave — round 5, wave 3** *(BUILD serialization, not a logical dependency — see below)*

- [x] 27-35-PLAN.md — the nested-adapter walk gains a fourth channel for directories it cannot read, both bare returns route through it, and the installer refuses them by name at exit 3, so a less readable tree no longer produces a more confident installer; the cross-site equality case extends to the unreadable arm, and both remaining exit-after-report tails set the exit code with the regression scan extended from two paths to four (D-41) [KIT-02] *(CR-02, WR-01)*

**Gap wave — round 6, wave 1**

- [x] 27-36-PLAN.md — the delimiter region's TWO REFUSAL ARMS collapse into ONE TOTAL CLASSIFIER whose verdict every call site consumes exhaustively under a compiler-checked never-branch (D-44), so the composite that satisfied neither arm — measured today, `ZWSP + --- + ZWSP` and seven siblings return the silent no-grant arm and flip the gate from exit 1 to `ALL CHECKS PASSED` over a live spawn grant — refuses by name at BOTH positions, killing the closing position's misleading unterminated-block diagnosis with it; pinned by a THREE-AXIS CROSS-PRODUCT sweep (leading × payload × trailing) enumerated as data with an expected-verdict rule that never calls the code under test, swept at both positions and both closing payload tokens, RED before and GREEN after (D-45) [KIT-03, SPAWN-04] *(round-5 CR-01, WR-02)*

**Gap wave — round 6, wave 2** *(BUILD serialization, not a logical dependency — file-disjoint from 27-36)*

- [x] 27-37-PLAN.md — the plugin-root component surface is DERIVED from the manifest schema CLAUDE.md documents, counted two-sided at nine, and partitioned exhaustively into seven FORBIDDEN, one covered elsewhere by a named function (`skills`), and one EXEMPT by name with two live bounds (`hooks/`, which exists on the live tree, executes commands via `PreToolUse`, and sat in no scan set at all) — replacing a hand-listed 2-of-9 literal inside a floor whose own comment claimed class-level closure; proven by three hermetic plants going from `ALL CHECKS PASSED`/exit 0 to exit 1 (D-46); and the counts guard stops silently swallowing a thrown per-part lister and stops claiming a set equality it skipped (D-47) [KIT-02] *(round-5 CR-02, WR-01)*

**Gap wave — round 6, wave 3** *(shares `scripts/frontmatter.ts` with 27-36; also build-serialized behind 27-37)*

- [x] 27-38-PLAN.md — the grant enumeration states ONE legal character set and refuses everything else, replacing the two ENUMERATED checks for a nested paren and a quote, so a flow-collection delimiter stops returning split, altered names on the success arm — measured today, `Agent(alpha[,]b, gamma)` yields three names, one invented and one lost, on the arm whose doc block promises a name is never dropped or altered; the unreachable escape branch's note is made true by a case rather than a comment, and the false-red cost is measured across every real enumeration in all 33 scan members (D-47) [KIT-03, SPAWN-04] *(round-5 IN-04)*

**Gap closure round 7** *(from `27-REVIEW-GAPS-6.md` dated 2026-08-04 — `issues_found` with **1 Critical**, 3 Warnings and 5 Infos, every finding constructed as a concrete input and run against the committed build, and CR-01 reproduced end to end on two hermetic `git archive HEAD` mirrors at `ALL CHECKS PASSED` exit 0. Waves restart at 1 because plans 27-01..27-38 are all executed. **D-50: nothing from round 6 is deferred — all nine findings close this round.** All four waves are single-plan: every plan of this round touches `scripts/frontmatter.*`, and `npm run build` is a whole-project `tsc` emit that rewrites every committed `.js`.)*

**Gap wave — round 7, wave 1**

- [x] 27-39-PLAN.md — TRACER: quote state is a property of the YAML SCALAR and not of the physical line, so it is CARRIED across a scalar's continuation lines instead of re-derived at every line boundary (D-48), closing all THREE directions of one defect in one edit — a `#` on a continuation line deleting a live `Agent(grugops-orchestrator)` grant (measured: three spellings return `{ok:true,value:false}` while libyaml returns the grant; the block-sequence spelling is the exact idiom all 7 skills and all 17 adapters use, and planted on both distribution twins it prints `ALL CHECKS PASSED` at exit 0), `*`/`!`/`&` on a continuation line failing RED on documentation a real loader accepts, and a `-` on a continuation line read as a new sequence item, which flips the whole key's join separator and makes `keysGrantedAgentNames` INVENT a name on its success arm; pinned by a FOURTH AXIS the three D-45 axes cannot see — scalar style × sigil × placement, 90 cells enumerated from outside the rule with every continuation cell RED before and GREEN after and every platform claim resolved against a real YAML 1.2 loader (D-49) [KIT-03, SPAWN-04] *(round-6 CR-01, WR-01, + the JOIN direction named in no review)*

**Gap wave — round 7, wave 2** *(shares all three `scripts/frontmatter.*` files with 27-39)*

- [x] 27-40-PLAN.md — the delimiter classifier stops discarding INDENTATION: the leading run gains one extra LABEL (never a second composable predicate — D-44 deleted that shape), so an indented `---` or `...` inside a legitimate block scalar or a wrapped value is content rather than a refusal of the whole document — measured, three files libyaml loads cleanly are refused today, the cheapest being a wrapped `description:` whose continuation starts with an ellipsis; the change is position-asymmetric on purpose and the reason is mechanical (at the closing position `not-a-delimiter` means *keep scanning* and the fallback is the unterminated-block REFUSAL, so no silent success can be created; at the opening position it means the keyless success arm, so indentation is not routed there); and `unquoteChecked` stops being applied inside a `|`/`>` block scalar, where YAML applies no quoting rules at all — which also stops a block-scalar `coordinator: "true"` from matching the coordinator marker (D-50) [KIT-03, SPAWN-04] *(round-6 WR-02, IN-02)*

**Gap wave — round 7, wave 3** *(shares all three `scripts/frontmatter.*` files with 27-39 and 27-40)*

- [x] 27-41-PLAN.md — `keysGrantedAgentNames` ACCOUNTS for every spawn-token occurrence in a value instead of only examining captures that formed, so a truncated enumeration stops impersonating a genuine unscoped grant — measured, `Agent(alpha, gamma`, `Agent(alpha, #b, gamma)` and `Read, Agent` are three different facts returning one answer on the success arm, while the function's own doc block claims the enumeration is examined before it is split; every occurrence lands in exactly one of three stated buckets with the arithmetic identity asserted, `SCOPED_GRANT` and `keysHaveSpawnGrant` byte-unchanged; and the prologue blank-line skip stops asking *is this line empty* with `String.prototype.trim()`, whose alphabet is narrower than the one this module declares — the THIRD application point of the defect D-39/D-42/D-43 spent two rounds correcting, measured as a lone ZWSP or SOFT HYPHEN hiding a live grant behind a keyless success while a lone NBSP does not (D-50) [KIT-03, SPAWN-04] *(round-6 WR-03, IN-01)*

**Gap wave — round 7, wave 4** *(Task 3 edits `scripts/frontmatter.ts`, which all three earlier plans own; also build-serialized)*

- [x] 27-42-PLAN.md — the three claim-accuracy findings get their assertions rather than better sentences: the partition floor's `unclaimedKeys` arm, unfalsifiable by construction because the forbidden set is computed as `schema \ (covered ∪ exempt)`, is extracted into a pure function so a case can feed it a hole and watch the arm fire, with the extraction proven faithful by a BYTE-IDENTICAL gate PASS line; `coverer` stops being a free-text string the gate prints as a coverage claim and becomes the lister FUNCTION resolved against `SPAWN_GRANT_SCAN_PARTS` by object identity, with the printed label derived from the resolution, and both bucket cardinalities move from vitest into the GATE two-sided so the exemption's own recorded promote trigger fires where it stops a release; and `frontmatter.ts`'s tree-wide one-grammar claim is SCOPED to the surfaces a guard reads with that scope DERIVED by a pattern scan — a third grammar fails red — rather than reworded, with the decision not to migrate `generate-catalog.ts` recorded with its reason (D-50) [KIT-02, KIT-03] *(round-6 IN-03, IN-04, IN-05)*

**Gap closure round 8** *(from `27-REVIEW-GAPS-7.md` dated 2026-08-08 — `issues_found` with **1 Critical**, 2 Warnings and 5 Infos, the critical reproduced end to end on three shipped surfaces with the whole foundation gate printing `ALL CHECKS PASSED` at exit 0 while a real YAML loader reads the grant, plus 4 bypasses and 0 false reds across a 240-cell libyaml differential. **D-53: all EIGHT findings close this round, none deferred** — the fourth application of the D-41/D-47/D-50 posture. Waves restart at 1 because plans 27-01..27-42 are all executed. All four waves are single-plan: three of them edit `scripts/frontmatter.*` and the fourth is build-serialized because `npm run build` is a whole-project `tsc` emit that rewrites every committed `.js`.)*

**Gap wave — round 8, wave 1**

- [x] 27-43-PLAN.md — TRACER: the comment scanner becomes the ONE authority on what quote state may CROSS a line boundary (D-51) — it is told whether the line's offset 0 is a node start, it tracks flow-collection depth as it walks, and it returns an ALREADY-GATED open quote, so the three seeding sites collapse to one unconditional assignment each and the separate node-start-quote predicate is DELETED rather than kept alongside; 27-39 promoted quote state to the scalar and gated the carry correctly but wired the SEEDING into only two of the three places a node can begin and into none of the places a node begins mid-line, so the union of its three arms was not the set of node starts — measured against the committed `.js` with a libyaml column, six documents carrying a live `Agent(grugops-orchestrator)` grant return `{ok:true,value:false}` (a key line with no value in both quoting styles, a key line carrying only a comment, a flow sequence, a flow mapping, and a block-sequence item whose dash line carries no value, the last of which also INVENTS a comma the document does not express), and the reviewer's measured one-liner is rejected BY NAME because it closes family (a) and leaves the flow-collection family returning the no-grant success arm; IN-03 closes in the same edit because D-51 is what makes the item path's seed a genuine read, with the invariant asserted at the site; pinned by axis 1's missing node-start placements (D-52) with every cell RED before and GREEN after, the repository-wide value map re-measured at zero new refusals, and all three shipped surfaces reproduced [KIT-03, SPAWN-04] *(round-7 CR-01, IN-03)*

**Gap wave — round 8, wave 2** *(shares `scripts/frontmatter.test.ts` with 27-43)*

- [x] 27-44-PLAN.md — the sweep's completeness claim moves OUT of the hand-listed axes and into a differential harness whose corpus is GENERATED and whose expected value is `/usr/bin/ruby -ryaml` cell by cell (D-52), with libyaml-rejected cells skipped and the skip PRINTED: every one of the six shipped scalar styles opens its scalar as the first token after the key on the key line or as the first token of a block-sequence item, so NEITHER CR-01 family was expressible and the sweep passed green at 90 cells over a live bypass, exactly as the round-6 sweep did — a cardinality assertion pins a list against shrinking and says nothing about incompleteness, and a truth table whose completeness claim is the product of two hand-listed axes is a claim about the axes rather than about the construct; the harness is proven a pin rather than decoration by running its own corpus against a `git archive` mirror of the pre-27-43 build and recording a non-empty disagreement set containing a cell from each family, its disagreement set is asserted EQUAL to a named exemption set with every exemption asserted to be in the safe direction only, and the loader is invoked once per run so its runtime never becomes the reason a later author narrows it; IN-02 closes here too — both construct arrays of the one-grammar detector gain cardinality pins and each construct gets a planted fixture that fails without it [KIT-03, SPAWN-04] *(round-7 WR-01, IN-02)*

**Gap wave — round 8, wave 3** *(shares all three `scripts/frontmatter.*` files with 27-43 and 27-44)*

- [x] 27-45-PLAN.md — the fence authority stops running over the whole document BEFORE the frontmatter region is located, so a column-0 fence inside the region no longer deletes content and returns the truncated result on the SUCCESS arm (D-53): measured, one document loses its whole `tools` key and another loses the token from its value, both on the success arm, while libyaml rejects both outright — scoped HONESTLY as a CONTRACT defect and NOT a confirmed live bypass, since the one spelling libyaml accepts the module already refuses in the safe direction; the region is located first and the strip's scope SHRINKS to the body used for the prose checks, never widens, with the design settled per document by the loader rather than by preference and the repository-wide cost re-measured with the module's own classifier (the planner's approximation: over 1136 tracked markdown files the located region is identical under both orderings, and zero of the 557 files opening with a raw delimiter carry a fence inside their region); IN-01 closes by extracting the spawn-occurrence balance comparison into a pure exported function a case can hand a FOURTH, unclassified kind, with the refusal asserted to fire by name and the wording proven byte-unchanged — 27-42's own remedy, applied to the arm 27-41 shipped anew in the same round; and IN-05 is RECORD-DON'T-FIX, dispositioned in the module header with its measurement (the module reads one region; libyaml's stream parser reads three documents, the second carrying the grant), an explicit `UNKNOWN - verify`, and an explicit statement that it is not claimed as a bypass [KIT-03, SPAWN-04] *(round-7 WR-02, IN-01, IN-05)*

**Gap wave — round 8, wave 4** *(build serialization only — no source file, test file or committed artifact is shared with the three plans above)*

- [ ] 27-46-PLAN.md — the plugin-component claim partition's two arms share ONE de-duplication discipline (D-53): the double-claimed arm de-duplicates implicitly because it filters over the schema's keys, the foreign arm filtered over the claims and inherited their multiplicity, so a key claimed by two buckets AND absent from the schema is interpolated TWICE into the guard's failure message — measured against the committed `.js` as the same key returned twice, with only the single-occurrence shape pinned today so nothing observes the duplicate; the arm now reports each non-schema claimed key at most once in first-occurrence order, deterministic rather than incidental because a non-reproducible guard message would trade a new defect for a cosmetic one, with the multiplicity DROPPED rather than preserved in a second field; the behaviour-preserving half is PROVEN by a byte-identical `kit counts:` PASS line and the whole-project compile this plan forces is proven not to have moved a parser cell by re-running 27-44's differential and 27-43's three surface reproductions at the end of the round [KIT-02, KIT-03] *(round-7 IN-04)*

**Ordering that is load-bearing in gap-closure round 8** — round 8 closes only the requirements the round-7 findings touch (KIT-03 and SPAWN-04 for the parser work, KIT-02 where a plan reaches the kit-set authority); the reviewer explicitly checked and found SOUND the five inverted assertions from 27-39 and 27-40 (each re-measured against libyaml), the `partitionPluginComponentClaims` extraction's behaviour preservation, coverer-by-identity on all four facts, the moved cardinality floors as products rather than bare literals, the anchor/alias/merge-key refusals, the invisible-code-point prologue widening, the two deliberately frozen in-block `trim()` sites, CRLF and tab handling, key-shape smuggling, and the block-scalar indentation indicators — and none of those is re-litigated. 27-43 leads because CR-01 is the live bypass and because 27-44's harness must be able to take its RED transcript against the pre-27-43 build; 27-44 is second because WR-01 is *why* seven rounds shipped green and D-52 closes it WITH D-51 rather than behind it; 27-45 comes after both because its region-location change must be measured against the scanner 27-43 shipped and re-verified through the harness 27-44 landed; 27-46 is last and its wave is build serialization only.

**The failure class, now on its eighth spelling, and what is different about the response** — the first five were INSIDE a predicate (the escape alphabet, the delimiter alphabet, the delimiter arm split, the delimiter arm composition, the enumeration alphabet). The sixth was in the ASSEMBLY that produced the value those predicates read. The seventh was the QUESTION a predicate asked. The eighth is the SET a split predicate's arms covered: 27-39's carry was gated correctly and seeded at two of three node starts, so the arms were each right and their union was short. D-51 deletes the split rather than adding a fourth arm, because a fact decided at the character where the position is known has no union to leak through. The standing lesson the record now supports: **after collapsing a split predicate, ask what INPUT the one remaining authority is handed, and whether that input can carry the position the answer depends on** — and, from D-52, a corpus and an expectation both written by hand over the same axes cannot fail on an axis nobody thought of.

**Ordering that is load-bearing in gap-closure round 7** — round 7 closes only the requirements the round-6 findings touch (KIT-03 and SPAWN-04 for the parser work, KIT-02 where a plan reaches the kit-set authority); the reviewer explicitly checked and found SOUND `classifyDelimiter`'s totality, `ENUMERATION_LEGAL_CHARS`' polarity, the nine-key schema derivation and its partition, the `hooks/` exemption bounds, `guardKitCounts`' per-part catch, the D-45 sweep's non-circularity and the D-47 enumeration sweep, and none of those is re-litigated. 27-39 leads because the multi-line scalar reset is BELOW every round-6 predicate — `classifyDelimiter` reasons about a line and is correct, `ENUMERATION_LEGAL_CHARS` reasons about a captured enumeration and is correct, and the value they reason about is assembled from several physical lines by a flattener whose per-line helpers reset at every boundary. **All four waves are single-plan and every wave boundary is a genuine shared file**, not merely build serialization: 27-39, 27-40 and 27-41 each edit `scripts/frontmatter.ts`, `.js` and `.test.ts`, and 27-42's IN-05 task edits `scripts/frontmatter.ts` after all three have finished with it. The whole-project `tsc` emit forces the same sequence independently.

**The failure class, now on its sixth spelling, and why the plan boundaries moved** — the five before it were all INSIDE a predicate: the escape alphabet, the delimiter alphabet, the delimiter arm split, the delimiter arm composition, the enumeration alphabet. The sixth is one level below all of them, in the ASSEMBLY that produces the value those predicates reason about. A name mangled upstream never reaches the allowlist that would have refused it. D-48's ratified consequence is that a root cause is not split by which side a finding happened to arrive from: an earlier draft of 27-39 deferred the JOIN direction to a separate plan, and that is the exact incrementalism that produced six consecutive rounds of "one more spelling". The standing lesson the record now supports: **before trusting a predicate's closure claim, ask what produced the value it reasons about, and whether that producer's state survives the construct's boundaries** — and, from D-49, a corpus generated over a smaller unit than the construct under test proves nothing about the construct.

**Ordering that is load-bearing in gap-closure round 6** — round 6 closes only the three requirements that FAILED round-5 verification (KIT-02, KIT-03, SPAWN-04); the other seven are verified clean and out of scope, and all five round-4 findings are confirmed closed and are not re-litigated. 27-36 leads because the composite-delimiter gap is the parser-level bypass both KIT-03 and SPAWN-04 inherit through the shared `keysHaveSpawnGrant`/`parseFrontmatter` path — one fix closes both requirements. 27-37 is logically independent and file-disjoint; its wave-2 placement is **build serialization only**, for the same reason recorded for round 5: `npm run build` is a whole-project `tsc` emit. 27-38 genuinely shares `scripts/frontmatter.ts` with 27-36.

**The failure class, now on its fifth spelling, and what changed about the response** — D-39 patched the alphabet with `trim()`. D-42 widened the alphabet. D-43 inverted the polarity correctly and split the predicate into two arms. Round 5's sweep then built exactly one construction per arm, so it was structurally incapable of failing on the composite it was written to detect — the **same** circularity D-43 warned about over the alphabet, moved one abstraction level up to the arm structure. Four rounds of patching the predicate's *contents* each shipped past a green suite. D-44 deletes the structure instead: a predicate total by construction has no union to leak through, and its exhaustive consumption is enforced by the compiler rather than by review. The standing lesson the record supports: **ask which set the predicate enumerates, and after splitting a predicate into arms, test their UNION** — every arm individually correct is not the same as the predicate being total.

**Ordering that is load-bearing in gap-closure round 5** — round 5 closes only the three requirements that FAILED round-4 verification (KIT-02, KIT-03, SPAWN-04); the other seven are verified clean and out of scope. 27-33 leads because CR-01 is the parser-level bypass both KIT-03 and SPAWN-04 inherit, and because 27-34 both exercises its refusal and widens the scan composition it creates. **All three waves are single-plan by design:** `npm run build` is a whole-project `tsc` emit that rewrites every committed `.js`, so two plans building concurrently can tear a file that then gets committed — non-intersecting `files_modified` does not prevent that, because the emit is not scoped to the files a plan owns. 27-35's `depends_on` is therefore serialization, not logic: it shares no source file, test file or committed artifact with either other plan.

**The amendment chain this round, recorded because how it kept going wrong is the most valuable thing the phase produced** — D-39 point 3 spelled the predicate `line.trim() === "---"`; measured, it missed 458 of 506 swept positions because `trim()` does not strip the Unicode format class. D-42 replaced that with the wider `[\s\p{Cf}\p{Cc}]`; measured, it still missed combining marks, unassigned and private-use code points, and the entirely ordinary `----` and `--- foo`. **Both were denylists whose own text claimed the opposite polarity.** D-43 states the LEGAL set instead — payload plus `[ \t]`, nothing else — and refuses the complement; measured false-red cost is zero across all 33 scan surfaces and all 1115 tracked markdown files. The corollary D-43 carries: a property sweep whose corpus is generated from the alphabet under test is circular, which is exactly how D-42 would have shipped green.

**Ordering that is load-bearing in gap-closure round 4** — the tracer (27-29) is the phase's only live BLOCKER and closes KIT-03 and SPAWN-04 with one change to one module, so it is proven against the committed `.js` before any expansion task runs. Wave 2 is genuinely parallel: 27-30 owns `scripts/frontmatter.*` and 27-31 owns the two walk sites, with zero `files_modified` overlap. Wave 3 is split by shared FILE, not shared logic — 27-31 and 27-32 both edit `install/install.ts` and `install/install.test.ts`, and 27-32's equality case asserts against the exact cycle path strings 27-31 records.

**Ordering that is load-bearing in gap-closure round 2** — `scripts/frontmatter.ts` is the identity and grant parsing authority. CR-01 changes what it answers and CR-02 and WR-03 both read from it, so 27-18 lands and is proven before any consumer moves. Waves 8 and 9 are split by shared FILE rather than by shared logic: 27-19 and 27-20 both edit `check-foundation-guards.ts`, and 27-21 and 27-22 both edit `install/install.ts`.

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
| 27. Spawn Correctness & Kit-Set Authority | v2.1 | 45/46 | In Progress|  |
| 28. Kit Consistency Audit | v2.1 | 0/TBD | Not started | - |
| 29. Controlled Language & Voice Guard Rebuild | v2.1 | 0/TBD | Not started | - |
| 30. Per-Checkpoint Autonomy Matrix | v2.1 | 0/TBD | Not started | - |
| 31. Autonomous Manual Testing | v2.1 | 0/TBD | Not started | - |
| 32. Board Projector & CLI Dashboard | v2.1 | 0/TBD | Not started | - |
| 33. Live Capture & Windows Portability | v2.1 | 0/TBD | Not started | - |

**Totals:** 33 phases · **4 milestones shipped** (v1.0 + v1.1 + v1.2 + v2.0) · **1 active** (v2.1, phases 27–33).

**v2.0 final:** all 7 phases (20–26) complete and archived 2026-07-28. Audit `tech_debt` — 28/28 requirements satisfied, 7/7 phases verified, 8/8 integration boundaries wired, 7/7 Nyquist compliant, no blockers. Closed as `override_closeout` (Phase 20's Windows-CI human item genuinely open; Phase 25's `unknown` is a frontmatter-parse artifact, not a gap). 11 open artifacts deferred, 9 of them pre-v2.0 carryover.

**v2.1 coverage:** all **46** v2.1 requirements mapped to exactly one phase — 0 unmapped, 0 duplicated. (`REQUIREMENTS.md` prose says "all 41 requirements retained"; the enumerated set is 46. The count was written before the categories were finalized. Fittingly, this is the milestone's own founding defect — a hand-maintained count that drifted from the enumerated reality — caught here by counting instead of trusting.)
