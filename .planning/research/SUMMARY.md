# Project Research Summary

**Project:** grugops v2.0 — Decentralized Factory (Shared Verified Context)
**Domain:** File-based markdown agent-factory kit gaining a decentralized architecture — shared verified-context substrate + file-based task queue + parallel agent execution (Claude Code primary; four CLIs degrade to sequential over the same files)
**Researched:** 2026-06-16
**Confidence:** HIGH

---

## Executive Summary

grugops v2.0 is a major architecture pivot: replacing the centralized Orchestrator + static handoff packets with three DeLM-derived primitives — a **shared verified context** (typed notes, read-before-act / write-after-verify), a **file-based task queue** (agents claim work atomically without a central router), and **parallel agents** (Claude Code primary via the `Agent` tool; the other four CLIs degrade to sequential over the same files). The headline finding from all four research files, stated plainly: **the entire decentralization is buildable with zero new runtime dependencies** — `node:fs` + markdown + the Claude Code `Agent` tool, on top of the committed-`.js` tooling layer already shipped in v1.2. No new npm deps on hosts; no broker, daemon, or platform.

The milestone's defensible differentiator over DeLM and every surveyed multi-agent framework (AutoGen, CrewAI, LangGraph, Swarm) is strict: **"verified" means passed the §14 behavior gate** (lint + typecheck + unit + build + Playwright UI/E2E + visual regression + test-integrity), not DeLM's grounding-only string-match. The shared context note carrying a `verified_by: §14-gate#id` stamp is behavior-tested and human-gatable; no surveyed system ships a comparable correctness verifier. grugops's wedge is **auditable + human-gated + governance-on-a-dial over a decentralized substrate** — demonstrable without claiming DeLM's benchmark numbers. The own task-success/cost gain is `UNKNOWN - verify` until dogfooded.

The key risks are well-characterized across all four files and map cleanly to a foundation-first build order: race conditions on shared-context writes (mitigated by `atomicWrite`/`appendNote` helpers shipped FIRST in Phase 20 before any role writes); verification gaps where a self-authored stamp collapses the differentiator (mitigated by a refuse-self-set validator check + RED fixture in Phase 21); token bloat from the 15x multi-agent tax erasing the ~50% cost story (mitigated by two-tier compaction in Phase 22 before parallel fan-out makes the tax real); and the degraded-sequential divergence trap — "degrade, never break" is a slogan until a dual-path equivalence oracle proves it on on-disk artifacts (Phase 26). Deleting handoffs alone does NOT retire A3/DOG-02; only the passing equivalence oracle does.

---

## Key Findings

### Recommended Stack

The stack for v2.0 is intentionally minimal: no new dependencies, no new execution model beyond what ships in v1.2. The only new code is three `node:fs`-only TypeScript helpers (`context-io.ts`, `claim.ts`, `compactor.ts`) compiled to committed `.js`, freshness-checked like the rest of the tooling layer. All concurrency the decentralized architecture needs — atomic publish, atomic queue claim, append-only log — maps directly to stdlib: `renameSync` (atomic-replace on POSIX), `mkdirSync` (NFS-safe atomic claim, preferred over `O_EXCL`/`'wx'` because state may be networked), and `appendFileSync` for small JSONL metadata lines. Windows requires `unlinkSync`-then-`renameSync` (Windows native rename fails if the destination exists — the cross-platform mandate that motivated the TS pivot still applies here).

Claude Code parallel execution is driven by the `Agent` tool (renamed from `Task` at v2.1.63; nested spawning supported since v2.1.172). Background subagents run concurrently and share the project working directory — which is precisely what makes a file-based shared context work without IPC. The platform caps spawn depth at 5 for background trees but **does not cap concurrent width** — grugops's `queue.wip_limit` is the width cap. The four non-spawning CLIs (Codex, Gemini, OpenCode, Copilot) use the existing single-window sequential role-load unchanged; step-4 of `_role-switch-protocol.md` is rewired to read/write the shared context instead of handoff packets, and that is the entire "degraded sequential" stack change.

**Core technologies:**

- **Markdown (CommonMark, append-only per-task context file):** the shared verified context source of truth — readable, diffable, git-native, auditable. Replaces static handoff packets.
- **JSONL (derived per-task event index):** machine-parsable mirror of context notes for the validator/freshness gate; parsed by stdlib `JSON.parse`, no YAML lib. Derived, never authoritative — the markdown wins on conflict.
- **`node:fs` (Node 22+ stdlib):** all concurrency primitives — `renameSync` (atomic publish), `mkdirSync` (NFS-safe atomic claim), `appendFileSync` (small JSONL lines). Zero runtime deps; already the only thing the committed `.js` tooling uses.
- **Claude Code `Agent` tool + background subagents:** the parallel execution mechanism; shared CWD gives all subagents access to `.grugops/context/`. Grant to the Orchestrator/coordinator only via `Agent(<allowlist>)`.
- **`_role-switch-protocol.md` sequential role-load:** the degraded path for four CLIs — rewire step-4 only; no new stack needed.

**Shared-context file format (locked design):** markdown source of truth + JSONL derived index, per task, under `.grugops/context/`. Per-note shape: a markdown section with a `<!-- kind | by | at | verified_by | confidence | refs | supersedes -->` metadata fence, mirrored as a single compact JSONL line. Six note kinds: `claim`, `finding`, `decision`, `failed-attempt`, `observation`, `artifact-ref`. A `finding` requires a real, non-self `verified_by` stamp — the admission gate.

### Expected Features

**Must have (table stakes — missing any = the decentralization is not credible or safe):**

- **Shared verified context substrate** — typed notes, read-before-act / write-after-verify, the sole inter-role memory. Replaces all 17 handoff templates.
- **Verify-before-write admission control** — a `finding` admitted only with a §14 gate verdict, a passing test ref, or a named human. Refuse-self-set (verifier is not verified). RED fixture proves hollow stamps fail.
- **File-based task queue + atomic async claim** — `pending/->claimed/->done/` by atomic rename; `mkdirSync` NFS-safe claim; stale-claim sweep as a role/workflow rule; no central lock manager.
- **Parallel agents on Claude Code + graceful sequential degradation on the other four CLIs** — one tool-neutral substrate; sequential = concurrency-1 of the same path.
- **Memory/trajectory compaction (dialable)** — two-tier memory (local trajectory + shared verified gist); bounds the 15x multi-agent token tax; compaction-exempt fields: `verified_by`, `failed-attempt`, `supersedes`, all provenance.
- **Append-only git-tracked context audit trail** — `by`/`at`/`verified_by`/`supersedes` on every note; trace replays from `at`+`supersedes` (not file position); git log is the tamper-evident attribution.
- **Orchestrator redefinition** — router to bootstrap + decompose + schedule + human-gate (blackboard control component). Holds `Agent(<allowlist>)`; does not relay data.
- **Clean removal of static handoff packets** — rewire all 18 roles + 16 workflows; grep-to-zero; substrate-first before deletion.
- **Humans hold merge/deploy — UNCHANGED** — `hooks/guard.js` PreToolUse, standalone, every spawned agent hits it.

**Should have (grugops's differentiators over DeLM and the frameworks):**

- **"Verified" = §14 behavior gate** — the un-cheatable admission stamp; DeLM's verifier proves only grounding/non-hallucination.
- **Human-gated context admission (dialable)** — `context.human_admission: off | high-severity | all`; agent proposes, named human disposes for high-severity entries.
- **Governance-on-a-dial over the decentralized substrate** — one config flag scales lean (solo-sane, aggressive compaction, small WIP) to enterprise (named-human admission, full ASVS gate, retained audit).
- **Board-as-state as the human-readable queue view** — the WIP-limited markdown board mirrors `.grugops/queue/`; decentralized and legible.
- **Failure-as-shared-constraint** — a verified `failed-attempt` note stops parallel agents re-trying a dead end; recorded, honest, no-fabrication floor.

**Defer to v2.x:**

- Human-gated high-severity admission promoted to default-on (validate routine verify-then-write first).
- Dependency-aware queue ordering (`[deps:...]`) — once the flat queue is proven non-colliding.
- Compaction tuning knobs (aggressive/balanced/retain-raw) — once the default is validated.
- Benchmark grugops's own success/cost gain vs the v1.x centralized model — `UNKNOWN - verify` until the Phase-26 dogfood measures it.
- Carry-ins from v1.2 (SKEW-01, FIX-01, PLUGIN-01) — unrelated to decentralization; schedule opportunistically.

### Architecture Approach

The architecture is a blackboard system realized in files: the **shared verified context is the blackboard**, the **§14 gate is admission control onto the blackboard**, the **shrunk Orchestrator is the control component** (scheduler/decomposer + human-gate holder, not a router), and **per-file atomic claims are the per-key concurrency**. Roles coordinate only through the shared context — never agent-to-agent, never through a relay. The Orchestrator decomposes work into queued subtasks, spawns up to `queue.wip_limit` background subagents (Claude Code) or drains the queue one claim at a time (four CLIs), and all paths converge on the same `.grugops/context/<task>.md` + `.events.jsonl` on-disk artifacts. The old maxim "the handoff is the memory" mutates to "the verified context is the memory."

**Major components:**

1. **Shared verified context** (`.grugops/context/<task>.md` + `<task>.events.jsonl` + `threads/<agent>.md`) — the blackboard; append-only markdown SoT with JSONL derived index; per-agent local trajectories compacted separately.
2. **Verifier (admission control)** — the existing §14 gate (`05-pr-quality-gate.md`) reused as the admission stamp; a `finding` without a real non-self `verified_by` is a structural failure (validator).
3. **File-based task queue** (`.grugops/queue/{pending,claimed,done}/`) — directory of subtask files; atomic rename IS the claim; `mkdirSync` NFS-safe variant.
4. **Coordinator / Orchestrator** (`orchestrator.md` modified) — decompose + schedule + gate; holds `Agent(<allowlist>)`; does not relay data; still holds the human merge/deploy gate.
5. **Role agents (16 specialists, each modified)** — claim a task, `readContext`, do the one job, §14 gate verifies, `appendNote`, return summary; verbose trajectory stays local.
6. **Three new workflows** (16-context-read-write, 17-task-claim, 18-context-compaction) — single-source protocols referenced by all roles, not restated; same pattern as `05-pr-quality-gate.md`.
7. **Three new TS helpers** (`context-io.ts`, `claim.ts`, `compactor.ts`) — the only new code; `node:fs`-only, committed `.js`, freshness-checked; the single sanctioned write path enforced by `guard_context_writes`.
8. **WR-05 guard inverted** — from "no role grants `Agent`" to "only the coordinator grants `Agent(<allowlist>)`"; flips in one coordinated change with the packaging templates + catalog (Phase 23).
9. **Audit trail** — `git log` over append-only context files + per-note provenance; trace replays from `at`+`supersedes`; board projects the queue for human legibility.

**Blast radius summary:** 3 new TS helpers + 3 new workflows + 1 new context-note schema + 2 new checklists. Modified: `orchestrator.md` (heavy), `_role-switch-protocol.md` (heavy), 16 specialist roles, all 16 workflows (handoff refs to context refs), `validate-agent-factory.ts`, `check-foundation-guards.ts`, `check-uat-oracles.ts` (replace `oracleParity` A3 with dual-path equivalence oracle), `generate-catalog.ts`, `freshness.ts`, `install.ts`, config x 3, AGENTS.md, packaging x 3. Removed: all 17 handoff templates + `plans/handoffs/` seed.

### Critical Pitfalls

1. **Race conditions on shared-context writes** — Two parallel subagents doing naive `Write`/`writeFileSync` of the context file produces lost-update, interleaved-append, or torn-read corruption of the sole inter-role memory. Mitigation: `atomicWrite`/`appendNote` are the ONLY sanctioned write paths (committed `.js` helpers); `guard_context_writes` fails red on any raw write in shipped role/workflow text; N-agent dogfood asserts N distinct un-clobbered notes. Must ship in Phase 20 before any role writes to the shared context.

2. **Verification gaps — the differentiator collapses if the verifier is bypassable** — An agent writing `verified_by: self` or citing a non-existent gate run turns "verified" into "self-graded," forfeiting grugops's entire wedge over DeLM. Mitigation: refuse-self-set (verifier is not verified, mirroring the prod-deploy hook); the validator treats a missing/self-authored/unresolvable `verified_by` on a `finding` as a structural failure; a RED fixture proves a hollow stamp FAILS. The `claim` escape hatch remains honest and non-load-bearing. Human-gated admission for high-severity notes (Phase 25). This is the milestone's thesis pitfall.

3. **Token bloat — the 15x multi-agent tax erasing the ~50% cost win** — Unbounded shared-context growth + Anthropic's documented 15x token multiplier for multi-agent systems (especially tightly-interdependent coding work) can erase the DeLM cost story entirely. Over-aggressive compaction dropping load-bearing fields (`verified_by`, `failed-attempt`, `supersedes`) inverts the gain. Mitigation: two-tier memory (verbose local trajectory stays in the agent's window; only compact verified distillations promote to shared); `context.compaction` dial with load-bearing-fields-exempt carve-out; compacted output goes through verify-before-write; `queue.wip_limit` caps concurrent width (the platform caps depth-5, not width). Ship compaction in Phase 22 before parallel fan-out makes the tax real.

4. **Degraded-sequential divergence trap (A3/DOG-02)** — "Degrade, never break" is a slogan until proven. If the sequential path and parallel path produce materially different outcomes for the same task, a Codex/Gemini/OpenCode/Copilot user silently gets worse results than a Claude Code user. Deleting handoffs does NOT retire this concern — it moves it from handoff-parity to execution-parity. Mitigation: one tool-neutral substrate (sequential = concurrency-1 of the same code path, never a separate schema); a dual-path equivalence oracle (`check-uat-oracles.ts`) that asserts on ON-DISK context + verdict artifacts (not `--print` stdout — the A3 test-design flaw). This oracle, passing, is what honestly retires the waiver. Phase 26.

5. **Clean-handoff-removal breakage** — The handoff concept threads through 17 templates + 18 roles + 16 workflows + `_role-switch-protocol.md` + the validator + the catalog + the installer seed + traceability. A big-bang delete that misses any downstream reader ships a broken factory mid-pivot. Mitigation: substrate-first ordering (the shared context must exist and be wired before any handoff is deleted); grep-to-zero gate (deletion is complete only when grep returns zero stale references); validator + catalog updated in the SAME change as the deletion; rename-to-backup user `plans/handoffs/` state on `--migrate`, never delete-first. Phase 24 depends on Phases 20-21 being solid.

---

## Implications for Roadmap

Based on research, the build spine is **foundation-first Phase 20 through 26**, continuing from v1.2's last phase (19). The ordering is load-bearing: the cross-cutting guards and the only-new-code helpers must be mechanized BEFORE any role writes to the shared context — exactly as v1.2 front-loaded foundation guards before capability phases.

### Phase 20: Shared-Context Substrate and Concurrency Foundation

**Rationale:** The atomic-write helpers, the provenance schema, the verify-stamp validator extension, the grep guard, and cross-platform behavior tests must exist BEFORE any role writes to the shared context. This is the foundation everything else depends on. Building it first means drift is caught as it is written, not after.
**Delivers:** `context-io.ts` (`atomicWrite`/`appendNote`/`readContext`, Windows `unlink`-then-`rename` guard), `claim.ts` (`mkdirSync`/`renameSync` atomic claim + stale-sweep, NFS-safe), the note schema (`context-note.md` with typed kinds + provenance fence), the JSONL index convention, the new `.grugops/context/` + `.grugops/queue/` seed dirs, the validator extension (provenance + JSONL-mirror checks), `guard_context_writes` (grep guard over shipped role/workflow text), cross-platform behavior tests (Windows/NFS). No roles rewired yet.
**Addresses:** Table-stakes shared context substrate (the new file locations), atomic-claim primitive (decentralization needs a non-colliding claim), append-only audit trail discipline.
**Avoids:** Pitfalls 1 (write races), 5 (double-claim / starvation), 7 (schema half — provenance), 10 (cross-platform atomicity). Also the schema half of Pitfall 2.
**Research flag:** Standard patterns — the `node:fs` concurrency model and Claude Code sub-agent API are HIGH-confidence verified. Windows/NFS behavior tests need CI setup that may require environment investigation.

### Phase 21: Verify-Before-Write Admission (the §14 Gate as the Un-Cheatable Verifier)

**Rationale:** The differentiator must be wired mechanically before handoffs are removed. The replacement memory must verify before it can be trusted as the sole memory. This is the milestone's thesis: "verified means passed the §14 behavior gate, not just grounded in a source."
**Delivers:** The validator's verify-stamp check + refuse-self-set (`verified_by` in {self, writing-agent, absent} causes validator FAIL); the RED fixture (hollow/self-set stamp FAILS); Workflow 16 (`16-context-read-write.md`) as the single-source read-before-act / write-after-verify / verify-admission protocol; the §14 gate's terminal verdict as the context admission stamp (`verified_by: §14-gate#id`); the bounded verify->regenerate loop reusing the existing `self_fix_attempts` pattern; the `claim` escape hatch made honest and non-load-bearing.
**Addresses:** Core differentiator (auditable + un-cheatable verifier), verify-before-write table-stakes, the `claim`/`finding`/`UNKNOWN - verify` discipline extended to the memory substrate.
**Avoids:** Pitfall 3 (verification gaps). The human-admission dial is deferred to Phase 25.
**Research flag:** HIGH confidence on the mechanism — the §14 gate exists and is the ready-made verifier; this is mostly wiring + a new RED fixture, not new verification science.

### Phase 22: Memory and Trajectory Compaction (Dialable, Token-Economy)

**Rationale:** Compaction must land BEFORE parallel fan-out makes the 15x multi-agent token tax real. Without it, the first real parallel run on Claude Code can erase the cost story on the first try.
**Delivers:** `compactor.ts` (two-tier compaction; load-bearing-field-preservation test — RED on dropped `verified_by`/`failed-attempt`/`supersedes`); Workflow 18 (`18-context-compaction.md`); the `context.compaction: aggressive|balanced|retain-raw` dial; the `.grugops/context/threads/<agent>.md` local-trajectory convention; compacted-output re-verification discipline. Lean default: aggressive compact. Hard carve-out: `verified_by`, `failed-attempt`/`constraint`, `supersedes`, `by`/`at` provenance are compaction-exempt.
**Addresses:** Memory/trajectory compaction (table stakes — guards the 15x token blow-up); two-tier memory (DeLM alignment); cost discipline (the ~50% story depends on this).
**Avoids:** Pitfall 4 (token bloat / lossy compaction). The fan-out cap is Phase 23.
**Research flag:** MEDIUM — the compaction logic is a design choice. The two-tier structure is well-grounded in DeLM's model; the exact compaction trigger and exempt-field enforcement need implementation validation.

### Phase 23: Parallel Execution and Orchestrator-as-Decomposer (One Substrate, Two Modes)

**Rationale:** Spawning introduces the WIP cap, the coordinator-only Agent grant, and the inverted WR-05 guard — a coordinated change with the packaging templates + catalog. Both execution paths (parallel CC + sequential four CLIs) are built on the one substrate here. The tool-neutral design must be proven non-forking before handoffs are removed.
**Delivers:** `orchestrator.md` rewrite (router to decompose + schedule + gate; holds `Agent(<allowlist>)`; sets `queue.wip_limit`); `_role-switch-protocol.md` parallel-claim variant + removal of the "No `Agent` tool" absolute (now: coordinator only); Workflow 17 (`17-task-claim.md`); the inverted `guard_wr05` (coordinator-only, one coordinated change with packaging templates + catalog); `queue.wip_limit` cap; the degraded sequential path as concurrency-1 of the same path; the depth-5 background cap explicitly documented. Confirm `isolation: worktree` and shared-context-path interaction (UNKNOWN - verify during dogfood).
**Addresses:** Parallel agents on Claude Code + graceful sequential degradation (table stakes); Orchestrator redefinition (table stakes); board-as-state as queue view (differentiator); WR-05 inversion (unlocks spawning for the coordinator only).
**Avoids:** Pitfall 6 (builds both paths on one substrate — proves they do not fork); Pitfall 8 (WIP cap + coordinator-only spawn); Pitfall 2 decompose half (minimize shared mutable state).
**Research flag:** MEDIUM — the `Agent` tool API and nesting behavior are HIGH-confidence verified. The WR-05 inversion is a coordinated multi-file change that must land atomically; the worktree and shared-context-path interaction is UNKNOWN until dogfooded.

### Phase 24: Clean Handoff Removal and Traceability Migration

**Rationale:** Substrate-first cutover: the shared context must exist and be wired (Phases 20-21) and roles must read/write it (Phase 23 provides the routing model) before any handoff template is deleted. This phase has the largest blast radius in the kit. Never delete-first.
**Delivers:** (24a) Rewire all 18 roles + 16 workflows + 3 packaging templates + AGENTS.md off handoffs onto the context substrate; migrate the REQ->code->test->release trace onto note `refs`/trace fields. (24b) Delete all 17 handoff templates + `plans/handoffs/` seed; update `validate-agent-factory.ts` + `generate-catalog.ts` in the SAME grep-to-zero change; `install.ts` updated (seed context + queue; rename-to-backup user `plans/handoffs/` state on `--migrate`, never delete-first); DoR/DoD checklists updated. `git revert` is the rollback.
**Addresses:** Clean removal of static handoff packets (table stakes); traceability migration; the audit-trail differentiator carried through the handoff removal without losing the REQ->release trace.
**Avoids:** Pitfall 9 (clean-handoff-removal breakage — substrate-first, grep-to-zero, validator + catalog updated same change); Pitfall 7 migration half (traceability migrated, not dropped).
**Research flag:** MEDIUM-HIGH — the blast radius is large (17 handoffs + 18 roles + 16 workflows + tooling). A pre-deletion grep enumeration is mandatory. The phase should be planned with a complete checklist of every handoff reference before any file is touched.

### Phase 25: Governance-on-a-Dial

**Rationale:** After the substrate is stable and roles are rewired, the enterprise governance knobs are safe to expose. The lean defaults are already wired; this phase adds the optional escalation tiers without touching the safety floor.
**Delivers:** `context.human_admission: off|high-severity|all` — agent proposes verified note; named human disposes for high-severity entries (security/architecture/release); mirrors the prod-deploy hook pattern extended to memory. `context.audit_retention: git|retained`. All three config files updated in lockstep. Lean defaults confirmed: `human_admission: off`, `compaction: aggressive`, `wip_limit: 3-4`, `dependency_ordered: false`. Un-dialable floor unchanged: verify-before-write, no-fabrication, test-integrity, humans-hold-merge/deploy.
**Addresses:** Governance-on-a-dial (differentiator); human-gated context admission (differentiator, enterprise half of Pitfall 3).
**Avoids:** Solo-user over-taxation (lean defaults unchanged); the anti-feature of autonomous high-severity admission.
**Research flag:** LOW — the config dial pattern is established from v1.2. New knobs follow the same pattern as `quality.*`/`security.*`. No new mechanism required.

### Phase 26: Dogfood, Dual-Path Oracle, and A3/DOG-02 Retirement (LAST)

**Rationale:** This phase is where "degrade, never break" and "verified means verified" stop being prose and become proof. It is deliberately last — the oracle can only be meaningful once both execution paths exist and the substrate is wired end-to-end. This is also where the cost story is measured, not asserted.
**Delivers:** The dual-path equivalence oracle in `check-uat-oracles.ts` (replacing `oracleParity` A3): same seeded task run (a) parallel on Claude Code and (b) sequential via single-window role-load; assert ON-DISK context + verdict equivalence — same set of admitted `finding`s, same gate result, same artifact. The Tier-2 headless E2E harness extended: N background subagents write N distinct un-clobbered notes, each task claimed exactly once, stale claim reclaimed. Aggregate token cost measured (so the ~50% claim is demonstrated, not asserted — `UNKNOWN - verify` until now). Confirm `isolation: worktree` and shared-context-path interaction. A3/DOG-02 honestly retired only when the oracle passes.
**Addresses:** A3/DOG-02 retirement (the explicit reason the milestone exists); cost measurement (the ~50% `UNKNOWN - verify` resolved or not); Pitfall 6 (equivalence oracle on on-disk artifacts).
**Avoids:** The "waiver marked retired with no proof" anti-pattern that produced the original A3 waiver.
**Research flag:** HIGH need for research-phase during planning — this is the first true parallel dogfood. The equivalence oracle design, harness extension, and cost-measurement approach all need careful planning. Flag for `/gsd-plan-phase --research-phase 26`.

### Phase Ordering Rationale

- **Foundation before content** (Phases 20-22 before 23-26): the atomic-write helpers, verify-stamp check, and compaction must be mechanized before any role uses them — exactly the v1.2 lesson of front-loading foundation guards.
- **Verify before remove** (Phase 21 before Phase 24): the replacement memory must be verifiable before it becomes the sole memory. Deleting handoffs without a trusted substrate leaves the factory without memory mid-pivot.
- **Compact before fan-out** (Phase 22 before Phase 23): the 15x token tax arrives with the first parallel run; compaction must be in place before that run.
- **Substrate wired before handoffs deleted** (Phase 23 before Phase 24a before Phase 24b): roles must read/write context before handoff templates are removed. Within Phase 24: rewire first (24a), then delete (24b) in one grep-to-zero coordinated change.
- **WR-05 inversion is one coordinated change** (Phase 23): the guard + packaging templates + catalog flip together; a half-flipped guard either blocks the legitimate coordinator spawn or leaks rogue spawns.
- **Equivalence oracle last** (Phase 26): meaningful only when both paths are fully wired end-to-end.

### Research Flags

Phases likely needing `/gsd-plan-phase --research-phase <N>` during planning:

- **Phase 26 (Dogfood, Dual-Path Oracle, A3/DOG-02 Retirement):** first true parallel dogfood; equivalence oracle design + cost-measurement harness design are novel to grugops; worktree/shared-context-path interaction is UNKNOWN until exercised.
- **Phase 24 (Clean Handoff Removal):** blast radius requires a complete mechanical enumeration (grep of all handoff references) before planning can be done confidently. The traceability migration needs careful design.
- **Phase 23 (Parallel Execution):** the `isolation: worktree` and shared-context-path interaction is UNKNOWN; the WR-05 coordinated flip touches many files simultaneously.

Phases with standard patterns (research-phase optional or skip):

- **Phase 20 (Substrate and Concurrency Foundation):** `node:fs` atomicity model is HIGH-confidence verified; the note schema and queue layout are settled design choices from STACK.md. Standard TS helper + validator extension pattern.
- **Phase 21 (Verify-Before-Write):** reuses the existing §14 gate machinery and the v1.2 RED-fixture discipline. Well-documented pattern — the §14 gate exists, this is wiring.
- **Phase 22 (Compaction):** design is settled from STACK.md/FEATURES.md; the TS helper pattern is established. MEDIUM complexity design choice, not novel research needed.
- **Phase 25 (Governance-on-a-Dial):** follows the established `factory.config.json` x 3 dial pattern exactly. No new mechanism.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `node:fs` concurrency primitives verified against Node v26.x docs + multiple corroborating sources. Claude Code `Agent` tool, nesting (v2.1.172+), background subagents, shared CWD verified against `code.claude.com/docs/en/sub-agents` June 2026. Windows rename non-atomicity and NFS `O_EXCL` unreliability re-verified June 2026. The zero-new-dep headline is solid. |
| Features | HIGH | DeLM verifier mechanics verified from arXiv 2606.10662 full text + GitHub source. The "DeLM verifier proves grounding, not correctness" differentiation thesis confirmed directly from the paper. The 15x multi-agent token tax confirmed from Anthropic Engineering blog. Prior-art blackboard / stigmergy / framework survey cross-verified from multiple sources. |
| Architecture | HIGH | Integration study grounded in the actual `agent-factory/` + `scripts/` tree, read directly. The blast radius (17 handoffs + 18 roles + 16 workflows + tooling) is measured via grep. Dependency ordering and the three-new-workflow pattern follow established v1.2 conventions. |
| Pitfalls | HIGH | Concurrency pitfalls re-verified against primary sources (Node docs, Windows rename issues, NFS locking). Claude Code spawn limits re-verified (depth-5 cap documented, width cap absent). The v1.x inherited pitfalls are grounded in the actual v1.2 build experience. |

**Overall confidence: HIGH**

### Gaps to Address

- **`UNKNOWN - verify` — grugops's own task-success / cost gain:** DeLM's +9.3pp/~50% are on DeLM's harness, not grugops's. Handle: do not claim DeLM's numbers; the Phase-26 dogfood cost/success measurement is the honest gate. The pitch stands on auditable + gated + governance (demonstrable).

- **`UNKNOWN - verify` — `isolation: worktree` and shared-context-path interaction:** Whether a worktree-isolated code-editing agent can still read/write the non-isolated `.grugops/context/` path is not confirmed. Handle: flag for Phase-23/Phase-26 dogfood confirmation before the worktree pattern is documented as supported.

- **`UNKNOWN - verify` — atomic claim robustness under true parallel spawn:** Whether naive `mkdirSync`/rename is sufficient under true Claude Code background-subagent concurrency vs needing advisory leases is a dogfood question. The `mcp_agent_mail` file-lease pattern is the documented fallback. Handle: Phase-26 double-claim test with N background subagents is the gate.

- **`UNKNOWN - verify` — Windows/NFS behavior tests:** The freshness check proves source->output parity, not runtime behavior on Windows/NFS. Handle: Phase-20 must include Windows + NFS-like mount CI tests, or mark the cross-platform claim as `UNKNOWN - verify` until tested.

- **Decision needed (human) — JSONL mirror as committed artifact vs runtime state:** Recommend runtime state (ephemeral per-task, not kit content; the markdown is the durable record, git is the audit log). If the decision goes the other way, a `freshness:context` gate must be added. Handle: resolve at Phase-20 planning before the installer is updated.

- **Decision needed (human) — minimum advertised Claude Code version:** v2.1.63 (flat parallel, nesting as documented enhancement) vs v2.1.172 (nested fan-out). Recommend advertising v2.1.63 floor. Handle: resolve at Phase-23 planning; affects packaging docs.

---

## Sources

### Primary (HIGH confidence)

- `code.claude.com/docs/en/sub-agents` — `Agent` tool, nested spawn v2.1.172+, depth-5 background cap, background subagents share CWD, plugin agents ignore hooks; verified June 2026
- `nodejs.org/api/fs` (v26.x) — `renameSync`, `openSync('wx')`/`O_EXCL`, `mkdirSync`, `appendFileSync`/`O_APPEND`; flags table, exclusive-create, network-filesystem caveat
- `arxiv.org/abs/2606.10662` + `arxiv.org/html/2606.10662` (DeLM full text) — verifier two-stage mechanics (string-match + cheap-LLM), write-before-publish ordering, dependency-aware queue, +9.3pp SWE-bench Verified Avg@1, ~$0.12/task, no human-in-the-loop/audit confirmed directly from the paper
- `github.com/yuzhenmao/DeLM` — `shared_lessons.py`, `verifier.py`, `memory_compactor.py`; two-tier memory; `lessons/`, `events.jsonl`, `trajectories/` outputs
- `anthropic.com/engineering/multi-agent-research-system` — 15x token multiplier, multi-agent less effective for tightly-interdependent coding work, external-memory + resume guidance
- grugops repo read directly (`agent-factory/roles/*`, `agent-factory/workflows/*`, `agent-factory/handoffs/*`, `agent-factory/checklists/*`, `scripts/*`, grep enumeration) — the integration blast radius, existing component interfaces, the v1.2 foundation guard patterns
- `.planning/PROJECT.md` — v2.0 milestone scope, Key Decisions (parallel-first/CC-primary, clean handoff replacement, no-spawn reversal for CC, A3/DOG-02 waiver), hard constraints
- Windows `rename` non-atomicity: `github.com/jprichardson/node-fs-extra/issues/835`, `github.com/nodejs/node/issues/29481`, Wikipedia Rename(computing), Hacker News atomic-writing-on-Windows
- NFS `O_EXCL` unreliability: `0pointer.de/blog/projects/locking`, Red Hat solutions/43001, pemungkah.com file-locking

### Secondary (MEDIUM confidence)

- `github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents` — append-to-decisions.md drop-box, git log as free audit trail, file-claim O(1)
- `arxiv.org/pdf/2602.23193` (ESAA: Event Sourcing for Autonomous Agents) — append-only logs, attribution under concurrency
- `klu.ai/glossary/blackboard-system` + DataFlair + Engineering Notes — blackboard architecture, per-key locks, control-component conflict resolution
- `galileo.ai/blog/multi-agent-llm-systems-fail` + `redis.io/blog/why-multi-agent-llm-systems-fail` — 79% failures specification/coordination; context poisoning, unbounded context, full-state rebroadcast bottleneck
- LangGraph vs CrewAI vs AutoGen 2026 comparisons — reducer concurrent-merge, checkpointing, handoff-as-function
- `openai.com/swarm` + VentureBeat Swarm overview — stateless handoff model (the contrast: what grugops is moving away from)
- `github.com/andrasq/node-fslock`, `npm proper-lockfile` — NFS-safe `mkdir` approach confirmation

### Tertiary (for context, not load-bearing)

- `apxml.com/courses/agentic-llm-memory-architectures` — stigmergy / file-in-out-dir software example
- `github.com/dicklesworthstone/mcp_agent_mail` — advisory file leases (the documented fallback if naive claim races under true parallel spawn)
- `arxiv.org/pdf/2506.04133` (TRiSM for Agentic AI) — trust/risk/security management framing

---

*Research completed: 2026-06-16*
*Ready for roadmap: yes*
