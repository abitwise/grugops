# Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes) - Research

**Researched:** 2026-06-21
**Domain:** Claude Code nested sub-agent spawning + file-based task queue scheduling + an atomic multi-file safety-guard inversion across a 5-tool wording surface
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
*(Copied verbatim from `23-CONTEXT.md` `<decisions>`. These are binding — research them, do not propose alternatives.)*

**23/24 scope seam — dual-running spine (Option A)**
- **D-01:** Phase 23 ships the **execution machinery only**: Orchestrator (decompose/schedule/gate), the `_role-switch-protocol.md` **step-4** claim+schedule wrapper + parallel-claim spawn variant, Workflow 17 (`17-task-claim.md`), the inverted `guard_wr05`, and the `queue` config object. The 18-role / 16-workflow bulk rewire + handoff-template **deletion** stay Phase 24.
- **D-02:** **Dual-running** — role files' Output sections are **untouched**, so handoffs keep being written in 23. Context notes are the **authoritative memory**; Phase 23 adds **no new handoff coupling**.
- **D-03:** Roles **already reference Workflow 16** for context read/write (VFY-03, Phase 21). Phase 23 adds **only the claim+schedule layer** around that existing I/O — it does **NOT** re-wire context I/O into roles.
- **D-04:** SC3 convergence proof in 23 = **fixture / spine-level test** — a seeded synthetic 2–3-subtask decomposition run through (a) the parallel spawn path and (b) the sequential drain, asserting **identical substrate state** (queue claim/done records + `.grugops/context/<task>/` notes, order-independent). No real-role LLM run here; that + the admitted-findings/gate-verdict oracle is Phase 26.
- **D-05:** Rewired step-4 is **thin and references, never inlines**: *"claim per WF17 → read/write context per WF16 → mark done."* Claim mechanics single-source in **Workflow 17**; note I/O single-source in **Workflow 16**.

**`queue` config object**
- **D-06:** New **top-level `queue` object** (sibling to `wip_limits` / `context`): `{ "wip_limit": 3, "claim_cap": 2, "stale_ttl_minutes": 30 }`. Edited **atomically** across the three config surfaces — `agent-factory/config/factory.config.json` + the `.md` twin (`factory.config.md`) + `agent-factory/seed/.grugops/factory.config.json`.
- **D-07:** `queue.wip_limit` (concurrent agent **WIDTH**, CLAIM-03) is **independent** from the existing per-column `wip_limits` (board **flow**). The Orchestrator respects **both**. Document the distinction crisply.
- **D-08:** **`claim_cap` folded in now** (default 2) — the Phase-20 deferred DeLM `MAX_CLAIMS_PER_DELEGATION` per-delegation anti-flood cap; same config blast radius as `wip_limit`.
- **D-09:** **`stale_ttl` surfaced as a dial now** (`stale_ttl_minutes`, default 30) — was a Phase-20 constant; generous default (must exceed one real agent turn).
- **D-10:** Defaults `3 / 2 / 30` are **dogfood-tunable** and **user-configurable by design**; Phase 26 measurement informs any adjustment.

**Orchestrator redefinition — surgical augmentation**
- **D-11:** **Augment, not rewrite.** Keep the 17-type classification + routing matrix (repurposed: "subtask → which role *claims* it"). Keep the caveman prompt; add ~4 tight lines (decompose / queue / width / no-relay / spawn-only-on-CC).
- **D-12:** New spine in Responsibilities: classify → **decompose into subtasks** → **enqueue** (thin pending files, each a `ref` to its `.grugops/context/<task>/` folder) → **schedule** (spawn-on-CC up to `wip_limit` / drain-on-4-CLIs via the rewired protocol + WF17) → **gate** → run the **stale-claim sweep**.
- **D-13:** Add explicit (clear voice) hard limit: *"Holds `Agent(<allowlist>)`; sets `queue.wip_limit`, never exceeds width; does **NOT** relay data between agents — the shared verified context is the only channel."* Merge/deploy limits unchanged. Document the **two modes** (parallel depth ≤5 / sequential concurrency-1) over the one substrate.
- **D-14:** The Phase-20-deferred **now-running board projection** ships as a **separate derived `.grugops/queue` artifact** (e.g. `now-running.md`) — deterministic, zero-token, freshness-gated render of `claimed/*/claim.md`, mirroring the Phase-20 `index.md` render. **NOT** folded into `plans/board.md`.

**WR-05 inversion mechanics**
- **D-15:** **Coordinator detection = a `coordinator: true` frontmatter marker** (semantic source of truth), NOT a filename hard-coded in the guard.
- **D-16:** **Both-direction guard assertion:** a coordinator **MUST** carry the `Agent(<allowlist>)` grant **and** a non-coordinator **MUST NOT**. A planted non-coordinator grant fails RED (SC4); a dropped coordinator grant *also* fails RED.
- **D-17:** **Allowlist = explicit enumerated least-privilege** — `Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, …)` listing the spawnable specialist wrappers, NOT a broad `Agent`. Claude-Code-only.
- **D-18:** **Atomic flip set** (one coordinated change): (1) `scripts/check-foundation-guards.ts` (+ `.js` + `.test.ts`) invert `guard_wr05`; (2) `scripts/check-uat-oracles.ts` WR-05 wording oracle (B3) flips in lockstep; (3) `_role-switch-protocol.md` drop the "No `Agent` tool" absolute → "coordinator only"; (4) `packaging/{subagent.frontmatter.md, slash-command.template.md}` prose + coordinator example; (5) `packaging/adapters.md` + `README.md` 5-tool tables (asymmetric — only the Claude Code row changes); (6) `.claude/agents/grugops-orchestrator.md` add `Agent(<allowlist>)` + `coordinator: true`; (7) `scripts/generate-catalog.ts` (+ regenerated catalog).
- **D-19:** The inversion is **asymmetric across the 5 tools** — only Claude Code's coordinator gains the grant; the four non-spawning CLIs stay sequential/no-spawn. Voice discipline holds (clear voice on guard/safety/catalog surfaces, caveman only inside role prompts).

### Claude's Discretion
- Exact derived-artifact filename(s) under `.grugops/queue/` (`now-running.md` vs other) and whether the render extends `claim.ts` or `context-io.ts`.
- Exact `stale_ttl` key/unit and the precise spawnable-role enumeration in the allowlist.
- Whether Workflow 17 (`17-task-claim.md`) also single-sources the stale-sweep protocol or just the claim, and its exact section shape (mirror `18-context-compaction.md`).
- The exact inverted prose across the flip set (subject to the voice rule above).
- Whether the now-running render needs its own freshness gate or rides the existing `freshness:context`.

### Deferred Ideas (OUT OF SCOPE)
- Handoff-template deletion + 18-role / 16-workflow bulk rewire + traceability migration → **Phase 24** (MIGR-01..04).
- Real-role dual-path equivalence oracle (admitted-`finding`s + gate verdict) + aggregate token-cost measurement → **Phase 26** (DOGF). A3/DOG-02 retires only when this oracle passes.
- Heartbeat / advisory-lease claim liveness → **v2.x** (PAR-05).
- `isolation: worktree` ↔ shared-context-path interaction → **`UNKNOWN - verify`**, resolved during the Phase 26 dogfood (not asserted green here).
- Default tuning (`wip_limit` / `claim_cap` / `stale_ttl`) → **Phase 26** dogfood measurement.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAR-01 | Orchestrator redefined router → decomposer/scheduler/gate: decomposes into queued subtasks, holds `Agent(<allowlist>)` + human merge/deploy gate, does **not** relay data | §Architecture Patterns (blackboard control component); D-11/D-12/D-13 confirm augment-not-rewrite; existing `orchestrator.md` read (router language + routing matrix to repurpose) |
| PAR-02 | Parallel role-agent execution on Claude Code via nested sub-agent spawning (v2.1.172 floor, depth ≤5) + Workflow 17 | §Standard Stack confirms nested spawn **v2.1.172+** and depth-5 cap from live docs; §Pitfall 1 the main-thread-vs-subagent allowlist nuance load-bearing for SC2 |
| PAR-03 | Degraded sequential path for the four non-spawning CLIs — concurrency-1 over the **same** substrate via the rewired step-4; identical on-disk artifacts | §Architecture Patterns (one-substrate-two-modes); §Validation Architecture SC3 spine oracle; existing `_role-switch-protocol.md` step-4 read |
| PAR-04 | `guard_wr05` inverted (no-spawn → coordinator-only-grant); flips atomically with packaging templates + docs catalog | §Architecture Patterns (atomic flip set); §Common Pitfalls 2/3 (half-flip, asymmetry); §Validation Architecture SC4 both-direction RED + B3 lockstep |
| CLAIM-03 | A WIP cap (`queue.wip_limit`) bounding concurrent agent **width** (platform caps depth-5, not width) | §Standard Stack confirms no platform width cap from live docs; §Pitfall 4 grugops must self-enforce; D-06/D-07 the `queue` object |
</phase_requirements>

## Summary

Phase 23 is **wiring + a coordinated safety-guard inversion**, not new science. Every external fact the planner needs is now verified against the live Claude Code documentation (fetched 2026-06-21). The two execution modes both ride the Phase-20 substrate (`.grugops/queue/{pending,claimed,done}/` + `.grugops/context/<task>/`) that already ships atomic claim (`claim.ts`), deterministic render (`context-io.ts`), and a freshness drift gate (`context-freshness.ts`). The only genuinely new code is (a) the `now-running.md` derived render + its freshness gate, (b) the inverted `guard_wr05` logic, and (c) the SC3 convergence spine fixture/oracle. Everything else is prose edits across a single coordinated flip set, plus a config object across the established 3-surface dial pattern.

The load-bearing verified facts: nested sub-agent spawning is real as of **v2.1.172** (matches CONTEXT exactly); depth is capped at **5 and is not configurable** (a depth-5 subagent does not receive the Agent tool); concurrent **width is NOT capped by the platform** — which is precisely why CLAIM-03's `queue.wip_limit` is grugops's responsibility. The `Agent(role-a, role-b)` enumerated allowlist syntax in `tools:` is confirmed, with one critical nuance for SC2 (see Pitfall 1): the parenthesized allowlist is only honored for the **main-thread** agent (`claude --agent` / the `agent` setting); inside a *subagent* definition the type list is ignored and `Agent` merely enables nested spawning up to the depth cap. `coordinator: true` is safe as a custom greppable marker — the supported-frontmatter table is a closed, documented set and `coordinator` is not in it, so the loader ignores unknown keys.

This phase **inverts a safety guard**. The project has a hard-won, documented lesson (CMP-02 carve-out bypassed 7× through green suites, closed only in round 8 by a structural fix + a parser-oracle fuzz test + an independent red-team). The same posture applies here: a green test suite is NOT proof that the WR-05 flip is correct. The both-direction assertion (D-16) plus an adversarial reproduction of each half-flip (planted non-coordinator grant; dropped coordinator grant; the asymmetric four-CLI rows silently growing a grant) is what closes SC4 honestly.

**Primary recommendation:** Treat the WR-05 inversion as ONE atomic commit across the 7-surface flip set (D-18), gate it with a **both-direction** `guard_wr05` (D-16) backed by RED fixtures for *each* half-flip and *each* asymmetry-drift, ship the `now-running.md` render as a `claim.ts` extension with its **own** queue-rooted freshness gate (the existing `freshness:context` only walks `.grugops/context/`, not `.grugops/queue/`), and prove SC3 with a hermetic seeded-decomposition spine fixture asserting order-independent substrate equality across both modes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Decompose request → subtasks | Orchestrator role prompt (`orchestrator.md`) | — | PAR-01: decomposition is a coordinator reasoning responsibility, expressed in role prose (caveman), not code |
| Enqueue subtask (thin `pending/` file + context ref) | Workflow 17 (`17-task-claim.md`) protocol + role prose | `claim.ts` (`transition`) | Single-source the queue-write protocol in WF17; the atomic mechanics already live in `claim.ts` |
| Atomic claim (pending → claimed) | `scripts/claim.ts` (`claimTask`, `mkdirSync`) | Workflow 17 references it | Already shipped Phase 20; CLAIM-02. The mechanism is code; the protocol is WF17 |
| Concurrent **width** cap (`queue.wip_limit`) | Orchestrator role prose (scheduler) | `factory.config.json` dial | CLAIM-03 — platform does NOT cap width; the coordinator enforces it at spawn time. This is a prompt-level scheduling rule, NOT a code lock |
| Per-delegation **claim cap** (`claim_cap`) | Orchestrator role prose | config dial | D-08 — anti-flood, a scheduling rule the coordinator honors |
| Spawn role-agents (parallel, CC only) | Claude Code `Agent` tool (platform) | `.claude/agents/grugops-orchestrator.md` frontmatter grant | PAR-02 — spawning is a platform capability; grugops grants it to the coordinator only |
| Sequential drain (4 CLIs) | `_role-switch-protocol.md` step-4 | Workflow 17 + Workflow 16 | PAR-03 — concurrency-1 over the same queue; no spawn |
| Stale-claim sweep | Orchestrator role prose (explicit run) | `claim.ts` (`sweepStale`, `stale_ttl_minutes`) | D-09/D-12 — mechanism shipped Phase 20; the coordinator triggers it; TTL now a dial |
| now-running projection | `claim.ts` (new render fn) + new freshness gate | Orchestrator surfaces it | D-14 — deterministic zero-token render of `claimed/*/claim.md`, queue-rooted |
| WR-05 guard (coordinator-only grant) | `scripts/check-foundation-guards.ts` (`guard_wr05`) | `check-uat-oracles.ts` B3 wording oracle | PAR-04 — mechanical enforcement of "only the coordinator spawns" |
| Human merge/deploy gate | `hooks/guard.ts` (UNCHANGED) | — | Safety floor unchanged; every spawned agent still hits the PreToolUse hook |

## Standard Stack

### Core

No new runtime dependencies. The "stack" is the platform capability + the existing tooling layer.

| Component | Version / Location | Purpose | Why Standard |
|-----------|-------------------|---------|--------------|
| Claude Code `Agent` tool (nested) | **v2.1.172+** floor for nested spawn | Parallel role-agent execution on Claude Code (PAR-02) | `[VERIFIED: code.claude.com/docs/en/sub-agents]` "As of Claude Code v2.1.172, a subagent can spawn its own subagents." Matches CONTEXT's claimed floor exactly. |
| `tools: Agent(role-a, role-b)` frontmatter | CC frontmatter, allowlist form since `Agent` rename (v2.1.63) | Least-privilege enumerated spawn grant for the coordinator (D-17) | `[VERIFIED: code.claude.com/docs/en/sub-agents]` "use `Agent(agent_type)` syntax in the `tools` field … This is an allowlist: only the `worker` and `researcher` subagents can be spawned." `Agent` was renamed from `Task` in **v2.1.63** (`Task(...)` still aliases). |
| `coordinator: true` custom frontmatter key | any CC version | Semantic, greppable coordinator marker for guard detection (D-15) | `[VERIFIED: code.claude.com/docs/en/sub-agents]` supported-frontmatter table is a closed, documented set; `coordinator` is NOT in it → the loader ignores unknown keys. Safe to use as a marker. |
| `scripts/claim.ts` (`claimTask` / `transition` / `sweepStale`) | shipped Phase 20 | Atomic claim + queue transitions + TTL stale-sweep | Reuse — `sweepStale(stage, ttlMs, …)` already takes a caller-supplied TTL; D-09 just wires it to a dial. |
| `scripts/context-io.ts` (`render`) | shipped Phase 20 | The exact pattern to clone for the `now-running.md` render (deterministic, zero-token, byte-reproducible, `GENERATED — do not hand-edit` header) | The `index.md` render precedent D-14 mandates mirroring. |
| `scripts/context-freshness.ts` | shipped Phase 20 | The clone-template for a **queue-rooted** `now-running` freshness gate | Mirror-spawn + byte-diff fail-closed pattern; but it walks `.grugops/context/`, NOT `.grugops/queue/` (see Pitfall 5). |
| `scripts/check-foundation-guards.ts` (`guard_wr05`) | shipped (negative form) | Host of the inverted both-direction guard (PAR-04) | Explicit SCAN-set guard aggregator; invert in place. |
| `scripts/check-uat-oracles.ts` (`oracleWr05Wording` B3) | shipped | The WR-05 wording-consistency oracle that flips in lockstep | Already encodes WR-05 closure "beats" across tracking docs — the asymmetry-drift catcher. |

### Supporting

| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| `factory.config.json` + `.md` twin + `seed/.grugops/factory.config.json` | `agent-factory/config/` + seed | The 3-surface `queue` config object (D-06) | Established dial pattern (same as `wip_limits`); edit all three atomically. |
| Workflow 18 (`18-context-compaction.md`) | `agent-factory/workflows/` | The section-shape pattern for the new Workflow 17 (`17-task-claim.md`) | D-05 / Claude's discretion — mirror its single-source shape. |
| Workflow 16 (`16-context-read-write.md`) | `agent-factory/workflows/` | Note I/O single-source that step-4 references (never inlines) | D-03/D-05 — roles already reference it; step-4 chains WF17→WF16. |
| `hooks/guard.ts` (PreToolUse prod-deploy guard) | `hooks/` | UNCHANGED safety floor; every spawned agent hits it | Cite as the "humans hold merge/deploy survives parallelism" proof; do NOT modify. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `coordinator: true` marker (D-15) | Hard-code the coordinator filename in the guard | Marker survives renames + multi-form adapter proliferation; makes "is this the coordinator?" first-class greppable. Filename hard-coding is brittle. **D-15 locked the marker.** |
| Enumerated `Agent(role-a, …)` (D-17) | Broad `Agent` (no parens) | Broad grant lets the coordinator spawn *any* subagent type; enumerated is least-privilege. `[VERIFIED]` both forms work; D-17 locked enumerated. |
| now-running render extends `claim.ts` | extend `context-io.ts` | `claim.ts` already owns `claimed/<task>/claim.md` (the now-running registry source). `context-io.ts` owns `.grugops/context/`, a different root. **Recommend `claim.ts`** — the data source lives there. (Claude's discretion.) |
| Own queue-rooted freshness gate for now-running | ride existing `freshness:context` | `context-freshness.ts` walks `.grugops/context/<task>/` only; `now-running.md` derives from `.grugops/queue/claimed/`. The existing gate will NOT see it. **Recommend a dedicated gate** (`queue-freshness` / `now-running-freshness`) cloning `context-freshness.ts`. (Claude's discretion — but the path mismatch makes "ride existing" a latent drift hole.) |

**Installation:** No package installs. Dev/build deps `{typescript, vitest, @types/node}` already present (D-13 build model). Host runtime deps remain **zero**.

**Version verification:** Nested-spawn floor **v2.1.172** confirmed verbatim against live docs 2026-06-21. `Agent` rename at **v2.1.63** confirmed. Closest-name nested-dir resolution noted at **v2.1.178** (`min-version` annotation) — not load-bearing here but adjacent. No npm versions to pin.

## Package Legitimacy Audit

> **Not applicable.** Phase 23 installs **no external packages**. It edits markdown + existing TypeScript tooling (`node:fs`-only, committed `.js`, freshness-checked) using only the already-present dev deps `{typescript, vitest, @types/node}`. Host runtime deps stay zero (CLAUDE.md Constraint: zero host runtime deps). No registry verification required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                            ┌─────────────────────────────────────────────┐
   /grug <request>  ───────▶│  ORCHESTRATOR (coordinator: true)            │
                            │  router → decomposer / scheduler / gate      │
                            │  • classify (17 types, repurposed matrix)    │
                            │  • decompose → N subtasks                    │
                            │  • holds Agent(<allowlist>) [CC only]        │
                            │  • holds human merge/deploy gate (unchanged) │
                            │  • does NOT relay data between agents         │
                            └───────────────┬─────────────────────────────┘
                                            │ enqueue (thin pending files,
                                            │ each a ref → .grugops/context/<task>/)
                                            ▼
                       ┌────────────────────────────────────────┐
                       │  .grugops/queue/                         │
                       │   pending/  ──claim (mkdirSync)──▶ claimed/ ──done─▶ done/
                       │   claimed/<task>/claim.md  (by/at/task)  │◀── derived render
                       └───────────┬──────────────────┬──────────┘     │
                                   │                   │                ▼
              ┌────────────────────┘                   │      now-running.md (D-14)
              │ MODE A: PARALLEL (Claude Code)          │      deterministic, zero-token,
              │ coordinator spawns role-agents via      │      freshness-gated render of
              │ Agent tool; nested depth ≤5;            │      claimed/*/claim.md
              │ WIDTH ≤ queue.wip_limit  (grugops cap)  │
              ▼                                         │ MODE B: SEQUENTIAL (4 CLIs)
   ┌──────────────────────┐                            │ _role-switch-protocol.md step-4
   │ role-agent (spawned)  │  each:                     │ concurrency-1 drain of SAME queue
   │  • claim 1 task       │  1. claim per WF17         │ (no spawn — degrade never break)
   │  • readContext (WF16) │  2. read/write ctx per WF16│
   │  • do the one job     │  3. mark done              │
   │  • §14 gate verifies  │                            ▼
   │  • appendNote (WF16)  │             ┌──────────────────────────────────┐
   │  • return summary     │────────────▶│  .grugops/context/<task>/         │
   └──────────────────────┘    BOTH      │   notes/ (append-only, authoritative)
        coordination is THROUGH          │   index.md / index.jsonl (derived,│
        the shared context ONLY,         │   freshness-gated)                 │
        never agent-to-agent             └──────────────────────────────────┘
                                            ▲
                  ┌─────────────────────────┘  CONVERGENCE (SC3 / D-04):
                  │  both modes produce IDENTICAL on-disk substrate state
                  │  (queue claim/done records + notes), order-independent.
                  │  Proven by a seeded synthetic 2–3-subtask spine fixture.
                  ▼
         ┌─────────────────────────────────────────────────────────────┐
         │  GUARD/ORACLE LAYER (atomic flip set, PAR-04)                 │
         │  guard_wr05 (both-direction): coordinator MUST grant          │
         │     Agent(<allowlist>); non-coordinator MUST NOT (D-16)       │
         │  oracleWr05Wording B3: closure-beat consistency across docs   │
         │  hooks/guard.ts (PreToolUse): humans hold merge/deploy — UNCHANGED
         └─────────────────────────────────────────────────────────────┘
```

A reader traces the primary use case top-to-bottom: a `/grug` request enters the Orchestrator, is decomposed into subtasks enqueued in `.grugops/queue/pending/`, then EITHER (Mode A) the coordinator spawns role-agents that atomically claim and run in parallel up to `wip_limit` width, OR (Mode B) the four non-spawning CLIs drain the same queue one claim at a time. Both modes write the same notes under `.grugops/context/<task>/` and the same claim/done records — convergence is the SC3 assertion.

### Recommended Project Structure

```
agent-factory/
├── roles/
│   ├── orchestrator.md              # AUGMENT: +decompose/schedule/gate spine, +4 caveman lines
│   └── _role-switch-protocol.md     # FLIP: step-4 rewire + drop "No Agent tool" absolute → coordinator-only
├── workflows/
│   ├── 16-context-read-write.md     # referenced by step-4 (unchanged)
│   ├── 17-task-claim.md             # NEW: single-source claim (+ maybe stale-sweep) protocol; mirror WF18 shape
│   └── 18-context-compaction.md     # section-shape pattern for WF17
├── config/
│   ├── factory.config.json          # +queue object (atomic)
│   └── factory.config.md            # +queue twin (atomic)
├── seed/.grugops/factory.config.json# +queue seed (atomic)
└── packaging/
    ├── subagent.frontmatter.md      # FLIP: coordinator example carries grant + marker
    ├── slash-command.template.md    # FLIP: prose
    └── adapters.md                  # FLIP: 5-tool table (ASYMMETRIC — only CC row)
scripts/
├── claim.ts (+.js +.test.ts)        # EXTEND: now-running render fn; wire stale_ttl dial
├── context-io.ts                    # render pattern reference (likely unchanged)
├── context-freshness.ts             # clone-template for the new queue-rooted gate
├── now-running-freshness.ts (+.js +.test.ts)  # NEW (recommended): queue-rooted freshness gate
├── check-foundation-guards.ts (+.js +.test.ts)# FLIP: guard_wr05 both-direction inversion
├── check-uat-oracles.ts             # FLIP: oracleWr05Wording B3 lockstep
└── generate-catalog.ts (+regenerated catalog) # FLIP: PAR-04 docs catalog
.claude/agents/
└── grugops-orchestrator.md          # FLIP: +Agent(<allowlist>) +coordinator: true
agent-factory/README.md              # FLIP: 5-tool table (ASYMMETRIC — only CC row)
```

### Pattern 1: Enumerated least-privilege spawn grant (the coordinator)

**What:** The coordinator (main-thread agent) grants exactly the spawnable specialist wrappers, no more.
**When to use:** Only `.claude/agents/grugops-orchestrator.md` (D-17, Claude-Code-only).
**Example:**
```yaml
# Source: code.claude.com/docs/en/sub-agents (verified 2026-06-21)
---
name: grugops-orchestrator
description: Single entry point for the grugops software factory …
coordinator: true                                   # D-15 greppable marker (loader ignores unknown keys)
tools: Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, …), Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
```
**Critical nuance (load-bearing for SC2 — see Pitfall 1):** The `Agent(types)` allowlist is honored **only because the orchestrator runs as the main-thread agent** (via the plugin/`agent` setting `{ "agent": "grugops-orchestrator" }`). Per the docs: *"The `Agent(agent_type)` allowlist syntax applies only to an agent running as the main thread with `claude --agent`. In a subagent definition, listing `Agent` in `tools` lets that subagent spawn nested subagents, but any type list inside the parentheses is ignored."*

### Pattern 2: Deterministic queue projection (now-running render, D-14)

**What:** A zero-token, byte-reproducible markdown render of `claimed/*/claim.md`, mirroring the `index.md` render in `context-io.ts`.
**When to use:** The human-facing "what is running right now" view; NOT folded into `plans/board.md`.
**Example:**
```typescript
// Source: pattern cloned from scripts/context-io.ts render() (Phase 20)
// In scripts/claim.ts (recommended home — it owns claimed/<task>/claim.md):
export function renderNowRunning(queueRoot = DEFAULT_QUEUE_ROOT): void {
  const claims = readdirSync(join(queueRoot, "claimed"))      // each <task>/claim.md
    .map(t => parseClaimFrontmatter(join(queueRoot, "claimed", t, "claim.md")))
    .filter(Boolean)
    .sort(byAtThenTask);                                       // deterministic order
  const md = [
    "<!-- GENERATED — do not hand-edit. Re-run: node scripts/claim.js now-running -->",
    "# Now running", "",
    "| task | by | since |", "|------|----|-------|",
    ...claims.map(c => `| ${c.task} | ${c.by} | ${c.at} |`),
  ];
  atomicWrite(join(queueRoot, "now-running.md"), md.join("\n") + "\n");
}
```
This render needs its **own** freshness gate (queue-rooted), because `context-freshness.ts` only walks `.grugops/context/`.

### Pattern 3: Both-direction WR-05 guard (D-16)

**What:** Invert `guard_wr05` from "no SCAN file may grant `Agent`" to "the `coordinator: true` file MUST grant `Agent(<allowlist>)`; every non-coordinator SCAN file MUST NOT."
**When to use:** `scripts/check-foundation-guards.ts` (PAR-04). The SCAN set stays an explicit file list, never a repo-wide grep (the established token-vs-prose care).
**Example (logic sketch, not final):**
```typescript
// Source: inversion of existing guard_wr05 in scripts/check-foundation-guards.ts
// For each file in WR05_SCAN:
//   isCoordinator = grepFiles([f], /^coordinator:\s*true\b/).length > 0
//   hasGrant      = grepFiles([f], WR05_COMMA).length || grepFiles([f], WR05_ARRAY).length
//   if (isCoordinator && !hasGrant) fail(`${f}: coordinator MUST grant Agent(<allowlist>) — dropped grant kills CC parallelism`);
//   if (!isCoordinator && hasGrant) fail(`${f}: non-coordinator MUST NOT grant Agent — rogue spawn`);
// PASS only if every file satisfies its direction.
```
Both halves must each have a RED fixture (Pitfall 2). Keep the clear (non-caveman) voice on the guard findings (CLAUDE.md hard rule).

### Anti-Patterns to Avoid
- **Repo-wide grep for the spawn grant.** Breaks the explicit-SCAN-set discipline; produces prose false-positives. The existing guard scans 4 explicit files — keep that, add the coordinator marker logic.
- **Folding now-running into `plans/board.md`** (D-14 forbids; it is a separate derived `.grugops/queue` artifact).
- **Inlining claim mechanics into step-4 or the orchestrator** (D-05 — step-4 references WF17 + WF16, never restates).
- **Editing the four non-CC rows when flipping the 5-tool tables** (D-19 asymmetry — only the Claude Code row gains the grant).
- **Treating a green `npm test` as proof the flip is correct** (project lesson — see Pitfall 2).
- **A central message bus / agent relay** (Out of Scope — coordination is through the shared context only).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic task claim | A new lock or `O_EXCL` claimer | `claim.ts` `claimTask` (`mkdirSync`, NFS-safe) — shipped Phase 20 | Already cross-platform tested; CLAIM-02 done. |
| Stale-claim reclaim | A new TTL sweeper | `claim.ts` `sweepStale(stage, ttlMs, …)` — caller-supplied TTL | D-09 only wires the existing TTL param to the `stale_ttl_minutes` dial. |
| Deterministic projection render | A bespoke template engine | Clone `context-io.ts` `render()` structure (GENERATED header + `atomicWrite`) | Byte-reproducible, freshness-friendly, zero-token. |
| Freshness/drift gate | A new diff approach | Clone `context-freshness.ts` (mirror-spawn → byte-diff → fail-closed) | Established fail-closed pattern; just re-root it at `.grugops/queue/`. |
| Spawn-grant enforcement | A custom AST/YAML parser | Extend the existing `grepFiles` + EREs in `guard_wr05` | The SCAN-set + token-EREs already catch comma + array + scoped `Agent(worker)` shapes. |
| Wording consistency across docs | Manual review | `oracleWr05Wording` B3 closure-beats + extend for the asymmetry | Mechanizes the drift catch the asymmetry needs. |
| Cross-platform atomic write | `writeFileSync` directly | `atomicWrite` (`context-io.ts`) — unlink-then-rename on Windows | Windows native rename fails on existing dest; already handled. |

**Key insight:** Phase 23's "new code" footprint is tiny precisely because Phase 20 front-loaded the concurrency primitives and render/freshness patterns. The risk is NOT building the wrong helper — it is the **coordinated wording flip** going half-done or asymmetric. Spend planning budget on the flip-set atomicity and its RED fixtures, not on re-deriving claim mechanics.

## Common Pitfalls

### Pitfall 1: The `Agent(allowlist)` parenthesized list is ignored inside a subagent (SC2 correctness)
**What goes wrong:** A planner assumes that granting `Agent(role-a, role-b)` to a *spawned* role-agent constrains what *it* can spawn nested. It does not.
**Why it happens:** The docs distinguish two cases. `[VERIFIED: code.claude.com/docs/en/sub-agents]`: the `Agent(agent_type)` allowlist *"applies only to an agent running as the main thread with `claude --agent`. In a subagent definition, listing `Agent` in `tools` lets that subagent spawn nested subagents, but any type list inside the parentheses is ignored."*
**How to avoid:** The enumerated least-privilege allowlist (D-17) is honored because the **orchestrator is the main-thread agent** (the plugin `agent` setting / `--agent`). For nested spawning by role-agents, the only platform control is **presence/absence of `Agent`** in `tools` + the **depth-5 cap** + grugops's **width cap** (`queue.wip_limit`). Plan SC2 around that: the coordinator's enumerated allowlist gates the *first* spawn level; depth + width gate the rest. Document this in `orchestrator.md` / WF17 so a reader does not over-trust nested allowlists.
**Warning signs:** A plan task that says "each role-agent grants `Agent(only-its-helpers)`" expecting enforcement — it will not be enforced; the role-agent can spawn any type up to depth 5.

### Pitfall 2: The WR-05 inversion is a safety-guard flip — a green suite is NOT proof
**What goes wrong:** The flip set lands, `npm test` is green, the guard is declared inverted — but a half-flip (dropped coordinator grant) silently kills CC parallelism, or a rogue non-coordinator grant slips through, and no test ever exercised it.
**Why it happens:** This project has a documented, hard-won lesson: the CMP-02 carve-out was bypassed **7×** through green suites (rounds 1–7) and closed only in round 8 by a STRUCTURAL fix + a fuzz/property oracle + an independent red-team. "Green suite ≠ proof" for any safety invariant. The same class of guard is being inverted here.
**How to avoid:** Implement the **both-direction** assertion (D-16) and write a RED fixture for EACH failure mode *before* (or in lockstep with) the flip:
  1. RED: a non-coordinator SCAN file with a planted `Agent` grant → guard FAILS (rogue spawn — the original WR-05 concern, now scoped to non-coordinators).
  2. RED: the coordinator SCAN file with its `Agent(<allowlist>)` grant **dropped** → guard FAILS (half-flip that silently kills CC parallelism — the new direction D-16 adds).
  3. RED: the `coordinator: true` marker removed from the orchestrator → guard FAILS (a rename/marker-loss must not silently demote the coordinator to "no grant required").
Then **adversarially reproduce a bypass**: hand-construct each half-flipped tree and confirm the committed `guard.js` (not just the `.ts`) fails RED against it (mirror the round-8 "RED→GREEN vs the COMMITTED .js" evidence discipline). Run code-review + an independent probe before marking PAR-04 done.
**Warning signs:** A plan that gates PAR-04 on "guard passes" without a corresponding "guard FAILS on planted bypass" fixture for *both* directions.

### Pitfall 3: Asymmetric flip drift — a non-CC row silently grows a spawn grant
**What goes wrong:** When editing the 5-tool tables (`adapters.md`, `README.md`) and the packaging templates, a copy-paste makes one of the four non-spawning CLIs (Codex / Gemini / OpenCode / Copilot) also read "spawns role agents," breaking the "degrade, never break, but never equal" invariant (Out-of-Scope: strict 5-tool parity retired).
**Why it happens:** The inversion is asymmetric (D-19) — only Claude Code's row changes. Bulk find-replace of "no spawn" → "coordinator spawns" hits all five rows.
**How to avoid:** Extend the `oracleWr05Wording` B3 oracle (`check-uat-oracles.ts`) with an **asymmetry assertion**: the four non-CC rows in `adapters.md` + `README.md` MUST still say "no spawn / sequential role-load"; only the Claude Code row may carry the spawn/coordinator language. Make the oracle FAIL if any non-CC row gains spawn wording. Treat this as the wording-drift catcher the phase explicitly needs.
**Warning signs:** A diff where the same line changed in more than one CLI row of a 5-tool table.

### Pitfall 4: Forgetting that the platform caps depth, not width (CLAIM-03)
**What goes wrong:** Relying on Claude Code to bound concurrent agents; it does not.
**Why it happens:** The docs cap **depth at 5** (`[VERIFIED]`: "A subagent at depth five does not receive the Agent tool and cannot spawn further. The limit is fixed and not configurable.") but document **no concurrent-width cap**. The "Run parallel research" section spawns multiple subagents with no stated ceiling.
**How to avoid:** `queue.wip_limit` is grugops's responsibility — the coordinator must NOT spawn more than `wip_limit` concurrent role-agents (a scheduling rule in `orchestrator.md` / WF17, enforced by the coordinator at spawn time, NOT by the platform). Document width-vs-depth crisply (D-13). Also document `claim_cap` (D-08) as the per-delegation anti-flood bound layered on top.
**Warning signs:** A success-criterion verification for SC2 that checks depth but never asserts "width never exceeds `wip_limit`."

### Pitfall 5: now-running freshness gate scoped to the wrong root
**What goes wrong:** The `now-running.md` render is added but rides the existing `freshness:context` gate, which never sees it (silent drift — a stale committed `now-running.md` ships).
**Why it happens:** `context-freshness.ts` walks `.grugops/context/<task>/` (verified by reading the file) and regenerates `index.md`/`index.jsonl` — it does NOT walk `.grugops/queue/claimed/`.
**How to avoid:** Ship a dedicated queue-rooted freshness gate (clone `context-freshness.ts`, re-root at `.grugops/queue/`, register it in the §14 gate alongside `freshness:context`). Add `scripts/` is already in `freshness.ts` `OUTPUT_DIRS`, so the new `.js` itself is build-freshness-covered; the **render output** (`now-running.md`) needs the new content-freshness gate. (This resolves the "Claude's discretion: own gate vs ride existing" question — own gate, because of the path mismatch.)
**Warning signs:** No new freshness script in the plan despite a new committed derived artifact.

### Pitfall 6: Inlining claim/note mechanics into step-4 or the orchestrator
**What goes wrong:** step-4 restates how to claim or how to write notes, forking the single-source.
**Why it happens:** It reads more self-contained inline.
**How to avoid:** D-05 — step-4 is thin: "claim per WF17 → read/write context per WF16 → mark done." Claim mechanics single-source in WF17; note I/O in WF16. The orchestrator references the protocol, the protocol references the workflows (the established `05-pr-quality-gate.md` reference pattern).
**Warning signs:** WF17 or WF16 content duplicated in `_role-switch-protocol.md` or `orchestrator.md`.

## Runtime State Inventory

> This phase is primarily additive (config object + new workflow + new render) plus a coordinated wording flip. It is **not** a rename/migration of stored runtime state — handoff removal + traceability migration are explicitly Phase 24. The inventory below confirms no runtime state is silently broken by the flip.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `.grugops/queue/{pending,claimed,done}/` + `.grugops/context/<task>/notes/` already shipped (Phase 20). No schema change in 23; the `queue` config object is new but `claim.md` frontmatter (by/at/task) is unchanged. | None — additive. Phase 24 (not 23) migrates handoff state. |
| Live service config | `.claude/agents/grugops-orchestrator.md` is the materialized coordinator adapter (in-repo, in git). Adding `coordinator: true` + `Agent(<allowlist>)` is a tracked file edit, not external UI/DB state. | Code edit (part of the atomic flip set, D-18 #6). |
| OS-registered state | None — grugops registers no OS-level tasks/services. | None — verified by absence of any scheduler/daemon in the kit. |
| Secrets/env vars | None referenced by this phase. (`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, `CLAUDE_CODE_FORK_SUBAGENT` exist on the platform but grugops does not set them.) | None. |
| Build artifacts | Committed `.js` for `claim.ts`, `check-foundation-guards.ts`, plus any NEW `.ts` (`now-running-freshness.ts`) must be rebuilt + freshness-checked (D-13). The regenerated docs catalog (`generate-catalog.ts` output) must be committed in the same flip. | Rebuild committed `.js` + regenerate catalog atomically with the source flip; run `npm run freshness`. |

**Nothing found in OS-registered state and secrets/env vars** — verified by the absence of any OS-scheduler or secret reference in the kit and in this phase's file-to-modify set.

## Code Examples

### Reading the existing claim record (the now-running source)
```typescript
// Source: scripts/claim.ts (Phase 20) — claim.md is the now-running registry record:
//   claimed/<task>/claim.md  carries frontmatter  by / at / task
// renderNowRunning reads these; the at field is ISO-8601 (the same field sweepStale parses).
// claim.ts already exports QUEUE_STAGES, claimTask, transition, sweepStale.
```

### The depth-5 + width-cap two-mode contract (for orchestrator.md / WF17 prose)
```
# Source: code.claude.com/docs/en/sub-agents (verified 2026-06-21) + CLAIM-03
PARALLEL (Claude Code only):
  - coordinator spawns role-agents via the Agent tool
  - nested spawn allowed (v2.1.172+); platform DEPTH cap = 5, fixed/not configurable
  - grugops WIDTH cap = queue.wip_limit (the platform does NOT cap width)
  - per-delegation claim_cap bounds one worker flooding claims
SEQUENTIAL (Codex / Gemini / OpenCode / Copilot):
  - concurrency-1 drain of the SAME queue via _role-switch-protocol.md step-4
  - no spawn; one window, role-load in turn
BOTH converge on identical on-disk substrate (SC3 / D-04).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Task` tool | `Agent` tool (`Task(...)` still aliases) | CC v2.1.63 | Guard EREs already match both `Agent` and `Task` — keep both in the inverted guard. |
| Flat-only subagents | Nested sub-agent spawning | CC v2.1.172 | Enables PAR-02 nested decomposition; the floor CONTEXT advertises. |
| (n/a) | Closest-name nested-dir resolution | CC v2.1.178 | Adjacent, not load-bearing; noted for completeness. |
| grugops: "No `Agent` tool. No sub-agent spawn." (absolute, all tools) | "coordinator only" (CC), sequential (4 CLIs) | THIS phase | The WR-05 inversion; asymmetric across the 5 tools (D-19). |

**Deprecated/outdated:**
- The blanket "grugops does NOT spawn sub-agents" line in `_role-switch-protocol.md:9` and `:43` — flips to coordinator-only (D-18 #3). Preserve the sequential-role-load description for the four CLIs.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The grugops orchestrator runs as the **main-thread agent** on Claude Code (via the plugin/`agent` setting `{ "agent": "grugops-orchestrator" }`), so its enumerated `Agent(<allowlist>)` is honored. | Pattern 1 / Pitfall 1 | If the orchestrator is instead itself a *spawned* subagent, the parenthesized allowlist is ignored (docs) and least-privilege at the first spawn level is lost — falls back to depth+width only. The CLAUDE.md "Stack Patterns by Variant" section already prescribes the main-thread design `{ "agent": "grugops-orchestrator" }`, so this is well-grounded but worth a one-line confirm in planning. |
| A2 | The now-running render best extends `claim.ts` (not `context-io.ts`) and needs its **own** queue-rooted freshness gate. | Standard Stack / Pitfall 5 | This is Claude's-discretion; if the planner extends `context-io.ts` instead, the queue-root path mismatch must still be solved or now-running drift ships silently. Either home works; the freshness-root mismatch is the real constraint. |
| A3 | Recommended spawnable-role enumeration includes the specialist wrappers that actually run delivery work (software-engineer, qe-e2e, security-nfr, …). The exact list is Claude's-discretion. | Pattern 1 / D-17 | An over-broad list re-creates the "broad `Agent`" risk; an under-broad list blocks a legitimate role spawn. Planner sets the precise enumeration against the actual `.claude/agents/grugops-*` set. |

**`UNKNOWN - verify` (NOT assumed green this phase):**
- `isolation: worktree` ↔ shared-context-path interaction — whether a worktree-isolated role-agent can still read/write the non-isolated `.grugops/context/` + `.grugops/queue/` paths. Docs confirm `isolation: worktree` gives an isolated *copy of the repository* branched from the default branch; whether the shared `.grugops/` path resolves to the parent or the worktree copy is **`UNKNOWN - verify`**, deferred to the Phase-26 dogfood. Do NOT assert this green in Phase 23.

## Open Questions

1. **Does a worktree-isolated subagent see the parent's `.grugops/` or its own copy?**
   - What we know: `isolation: worktree` gives "an isolated copy of the repository branched … from your default branch." Background subagents (non-worktree) share the parent CWD.
   - What's unclear: whether `.grugops/queue/` + `.grugops/context/` writes from a worktree subagent land in the shared tree or the isolated copy (which would break convergence).
   - Recommendation: `UNKNOWN - verify` — Phase 26 dogfood. Phase 23 should NOT document worktree-isolation as a supported parallel mode; the spine fixture (D-04) does not use real worktrees.

2. **Is naive `mkdirSync` claim sufficient under true CC background-subagent concurrency, or are advisory leases needed?**
   - What we know: `mkdirSync` is NFS-safe atomic; Phase 20 unit-tested it; true-parallel runtime is `UNKNOWN`.
   - What's unclear: race behavior under genuine simultaneous spawn.
   - Recommendation: out of scope for 23 (PAR-05 / Phase 26 decide). The SC3 spine fixture proves substrate equality deterministically, not under live race.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tooling layer (committed `.js`, tests, freshness) | ✓ (project prereq) | 22+ LTS | — (hard prerequisite per CLAUDE.md) |
| `typescript` (dev) | build `.ts` → committed `.js` | ✓ | dev dep | — |
| `vitest` (dev) | the guard/render/oracle tests | ✓ | dev dep | — |
| Claude Code (runtime, host) | Mode A parallel execution only | host-dependent | **v2.1.172+** floor for nested spawn | The four non-spawning CLIs (Mode B sequential) are the documented degrade path — the four-CLI sequential drain needs NO spawn capability. |

**Missing dependencies with no fallback:** none — the SC3 spine fixture and the guard/oracle/render all run on plain Node; no live Claude Code spawn is required for Phase-23 verification (real parallel dogfood is Phase 26).
**Missing dependencies with fallback:** Mode A parallel requires Claude Code v2.1.172+; absent it, the four-CLI sequential mode (Mode B) is the fallback — exactly the "degrade, never break" design.

## Validation Architecture

> `workflow.nyquist_validation` is **true** in `.planning/config.json` — this section is REQUIRED.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (project standard; co-located `*.test.ts`) |
| Config file | project `package.json` / vitest config (existing) |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**'` (avoids the live claude-CLI e2e lane that spends tokens / can hang — see project memory) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` for regression; `npm test` ONLY when the live e2e lane is intended (authed box, ~8 min) |

> **Project memory (load-bearing):** `npm test` triggers the live claude-CLI e2e lane (spends tokens, can hang ~8 min). Use the `--exclude` form for routine Phase-23 verification. The Phase-23 SC3 spine fixture is a hermetic deterministic test — it must NOT live in the e2e lane.

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| PAR-01 / SC1 | Orchestrator decomposes → enqueues thin `pending/` files (each a context ref); holds gate; does not relay | spine fixture (seeded decomposition produces expected queue files) | `npx vitest run scripts/<spine>.test.ts` | ❌ Wave 0 |
| PAR-02 / SC2 | Parallel claim + width ≤ `queue.wip_limit`; nested depth ≤5 documented; allowlist honored at main-thread | spine fixture asserts width never exceeds `wip_limit` over the seeded run; doc-presence assertion for depth-5 + width-vs-depth in orchestrator.md / WF17 | `npx vitest run scripts/<spine>.test.ts` | ❌ Wave 0 |
| PAR-03 / SC3 (D-04) | Sequential drain produces **identical on-disk substrate** to parallel — order-independent | **convergence spine oracle**: run a seeded synthetic 2–3-subtask decomposition through (a) parallel-spawn simulation and (b) sequential drain; assert equal claim/done records + equal `.grugops/context/<task>/notes/` set (order-independent canonical compare) | `npx vitest run scripts/<convergence>.test.ts` | ❌ Wave 0 |
| PAR-04 / SC4 (D-16) | `guard_wr05` both-direction: planted non-coordinator grant FAILS RED; **dropped** coordinator grant ALSO FAILS RED; marker-loss FAILS RED | guard RED fixtures (×3) run against the COMMITTED `guard.js` (not just `.ts`) | `npx vitest run scripts/check-foundation-guards.test.ts` | ⚠️ extend existing |
| PAR-04 (B3) | WR-05 wording closure-beats consistent across docs AND the four non-CC rows still say "no spawn" (asymmetry) | oracle assertion in `check-uat-oracles.ts` | `npx vitest run scripts/check-uat-oracles.test.ts` (or the oracle's runner) | ⚠️ extend existing |
| PAR-04 (catalog) | Regenerated docs catalog matches source (PAR-04 "docs catalog") | catalog freshness | `node scripts/catalog-freshness.js` | ✓ existing |
| D-14 / now-running | `now-running.md` is a byte-reproducible render of `claimed/*/claim.md`; stale committed render FAILS | dedicated **queue-rooted** freshness gate (clone `context-freshness.ts`) + a render unit test | `node scripts/<now-running-freshness>.js` + `npx vitest run scripts/claim.test.ts` | ❌ Wave 0 |
| D-13 / build | All new/changed committed `.js` byte-match a fresh rebuild | freshness | `npm run freshness` (or `node scripts/freshness.js`) | ✓ existing (`scripts/` already in OUTPUT_DIRS) |
| D-06 / config | `queue` object present + consistent across all three config surfaces | config-consistency assertion (mirror any existing config twin check) | per the existing config-validation path | ⚠️ verify a twin-consistency check exists |

### Sampling Rate
- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` (the changed guard/render/oracle/spine tests) + `npm run freshness`.
- **Per wave merge:** full non-e2e suite green + `node scripts/catalog-freshness.js` + the new queue freshness gate.
- **Phase gate:** full non-e2e suite green, freshness exit 0, ALL three `guard_wr05` RED fixtures proven RED→GREEN against the committed `.js`, the asymmetry oracle green, before `/gsd-verify-work`.

### Adversarial Reproduction (mandatory — this phase inverts a safety guard)
Per the project's hard-won lesson (CMP-02 carve-out bypassed 7× through green suites; closed only by a structural fix + fuzz/property oracle + independent red-team), a green suite is **not** sufficient evidence for the WR-05 flip. The phase gate MUST include:
1. **Both-direction RED proof against the committed `guard.js`:** hand-construct (a) a non-coordinator SCAN file with a planted `Agent` grant, (b) the coordinator file with the grant dropped, (c) the coordinator file with `coordinator: true` removed — confirm each makes the committed guard exit non-zero with a clear-voice message naming the offending file. Capture a RED-baseline → GREEN-after-fix artifact pair (mirror the 22-07 evidence discipline).
2. **Asymmetry-drift reproduction:** plant a spawn-wording edit in a non-CC row of `adapters.md` / `README.md` and confirm the extended B3 oracle FAILS.
3. **Independent probe:** a code-review pass (config `code_review: true`, standard depth) + an independent read of the inverted guard logic confirming no path PASSes a half-flip. Do not mark PAR-04 complete on green tests alone.

### Wave 0 Gaps
- [ ] `scripts/<convergence>.test.ts` — the SC3 dual-path spine fixture (seeded 2–3-subtask decomposition, order-independent substrate equality). Covers PAR-03/SC3, D-04.
- [ ] `scripts/<spine>.test.ts` — SC1/SC2 decomposition + width-cap assertions. Covers PAR-01/PAR-02.
- [ ] `scripts/now-running-freshness.ts` (+ `.js` + `.test.ts`) — queue-rooted render freshness gate. Covers D-14.
- [ ] Extend `scripts/check-foundation-guards.test.ts` with the THREE both-direction RED fixtures. Covers PAR-04/SC4, D-16.
- [ ] Extend the B3 oracle test with the four-CLI asymmetry assertion. Covers PAR-04 wording, D-19.
- [ ] Confirm (or add) a `queue`-object cross-surface consistency check among the three config files. Covers D-06.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface in this phase (markdown kit + tooling). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | **yes** | The spawn grant IS an access-control decision: only the coordinator may spawn (`Agent(<allowlist>)`); the both-direction `guard_wr05` is the mechanical enforcement. Least-privilege enumerated allowlist (D-17). The unchanged `hooks/guard.ts` PreToolUse gate enforces humans-hold-merge/deploy on every spawned agent. |
| V5 Input Validation | **yes** | The `now-running` render parses `claim.md` frontmatter (untrusted-ish on-disk content); `claim.ts` already hardens against forged multi-`at:` lines (queue-lock DoS — see the existing comment in `claim.ts` lines 111–112). The new render must use the same first-trusted-line discipline, not a permissive multi-match. |
| V6 Cryptography | no | `node:crypto` is used only for nonce generation (Phase 20); no new crypto in 23. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Rogue spawn grant on a non-coordinator role (privilege escalation — any role becomes a spawner) | Elevation of Privilege | Both-direction `guard_wr05` (D-16): non-coordinator with grant FAILS RED; explicit SCAN set. |
| Half-flip drops the coordinator grant → CC parallelism silently dies (availability/denial of capability) | Denial of Service | Both-direction `guard_wr05`: dropped coordinator grant FAILS RED (the new D-16 direction). |
| Asymmetric wording drift → a non-spawning CLI advertised as spawning (capability misrepresentation) | Spoofing / Information disclosure | Extended B3 asymmetry oracle: non-CC rows MUST retain "no spawn." |
| Forged `claim.md` frontmatter (smuggled `at:` line → un-sweepable claim = queue lock) | Tampering / DoS | Reuse `claim.ts`'s first-`at`-trusted parsing in the now-running render; do NOT add a permissive multi-match parser. |
| Width unbounded → resource exhaustion / token blow-up under parallel fan-out | Denial of Service | `queue.wip_limit` width cap (CLAIM-03) + `claim_cap` per-delegation cap (D-08); compaction (Phase 22) already in place. |
| Autonomous spawned agent merges/deploys | Elevation of Privilege | `hooks/guard.ts` PreToolUse UNCHANGED — every spawned agent hits the mechanical merge/deploy gate (humans decide). |

## Project Constraints (from CLAUDE.md)

| Directive | How Phase 23 honors it |
|-----------|------------------------|
| Markdown for everything except the TS tooling layer | New WF17 + role/packaging edits are markdown; only `claim.ts`/guard/freshness are TS. |
| D-13 build model: TS → `tsc` → committed `.js` → freshness-checked → vitest; deps `{typescript, vitest, @types/node}` only | Rebuild + freshness-check every changed/new committed `.js`; add no deps; `node:fs`-only. |
| Zero host runtime deps | No package installs; host runs committed `.js` with bare Node. |
| Safety (hard): agents never auto-merge/deploy; enforce mechanically | `hooks/guard.ts` UNCHANGED; cited as the survives-parallelism proof. |
| Single-source: role text once; adapters thin pointers | step-4 references WF17/WF16 (D-05); orchestrator references the protocol. |
| No fabrication: `UNKNOWN - verify`; never fake a passing gate | worktree-interaction left `UNKNOWN - verify`; adversarial RED proof required for the guard flip. |
| Voice discipline: caveman in role prompts; clear voice on security/guards/catalog | The ~4 added orchestrator lines stay caveman; guard/oracle/catalog/config wording is clear voice (D-19). |
| Brand: lowercase `grugops`; `/grug` shape | Unchanged; no brand-surface edits beyond the asymmetric tables. |
| Installers idempotent/additive/reversible | Install-seed changes for the `queue` object are additive; the heavier install/migrate work is Phase 24. |

## Sources

### Primary (HIGH confidence)
- `code.claude.com/docs/en/sub-agents` (fetched 2026-06-21) — `Agent` tool, `Agent(agent_type)` allowlist syntax + the main-thread-only nuance, nested spawn **v2.1.172**, depth-5 fixed cap, `Task`→`Agent` rename **v2.1.63**, supported-frontmatter closed set (custom keys ignored → `coordinator: true` safe), `isolation: worktree`, background subagents share CWD, no documented width cap.
- grugops repo read directly — `scripts/check-foundation-guards.ts` (`guard_wr05` lines 108–140, EREs match `Agent|Task` + comma/array/scoped forms), `scripts/check-uat-oracles.ts` (`oracleWr05Wording` B3 closure-beats), `scripts/claim.ts` (`claimTask`/`transition`/`sweepStale`, caller-supplied TTL, forged-`at` hardening), `scripts/context-io.ts` (`render`/`atomicWrite`/`noteId`), `scripts/context-freshness.ts` (walks `.grugops/context/` only), `scripts/freshness.ts` (`OUTPUT_DIRS=[install,scripts,hooks]`), `_role-switch-protocol.md`, `orchestrator.md`, `.claude/agents/grugops-orchestrator.md`, packaging templates, `README.md` 5-tool table, `factory.config.{json,md}` + seed.
- `.planning/REQUIREMENTS.md` (PAR-01..04, CLAIM-03, milestone decisions) + `.planning/ROADMAP.md` §Phase 23 (the 4 SCs) + `.planning/research/SUMMARY.md` (blackboard control component, one-coordinated-change WR-05, worktree UNKNOWN) + `23-CONTEXT.md` (19 locked decisions) + `20-CONTEXT.md` (substrate mechanics).

### Secondary (MEDIUM confidence)
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM` (verified prior sessions per CONTEXT): `MAX_CLAIMS_PER_DELEGATION = 2` (the `claim_cap` default D-08), blackboard control-component framing, append-only typed notes. `[CITED: arXiv 2606.10662]` — banked in 20-CONTEXT `<specifics>`; not re-fetched this session.

### Tertiary (project memory, load-bearing for process)
- Project memory: "grugops safety invariant: green suite insufficient" (CMP-02 bypassed 7×, closed by structural fix + fuzz oracle + red-team) — drives the adversarial-reproduction requirement for the guard flip.
- Project memory: "grugops npm test triggers live e2e" — drives the `--exclude '**/scripts/e2e/**'` test command for routine verification.
- Project memory: "grugops sequential role-load" — the no-spawn rule INVERTS for Claude Code here; `guard_wr05` flips.

## Metadata

**Confidence breakdown:**
- Standard stack (Claude Code spawn mechanics): **HIGH** — verified verbatim against live official docs 2026-06-21 (version floor, depth cap, allowlist nuance, custom-key safety all confirmed).
- Architecture (one-substrate-two-modes, blackboard control component): **HIGH** — grounded in the read repo + locked decisions + SUMMARY design; all primitives already shipped Phase 20.
- Pitfalls: **HIGH** — the load-bearing ones (main-thread allowlist nuance, depth-not-width, freshness-root mismatch, half-flip) are each traced to a verified doc line or a read source file; the adversarial-reproduction posture is grounded in the documented project lesson.
- Worktree interaction: **`UNKNOWN - verify`** (honestly deferred to Phase 26 — not asserted green).

**Research date:** 2026-06-21
**Valid until:** ~2026-07-21 (Claude Code is fast-moving — re-confirm the v2.1.172 nested floor + the main-thread allowlist nuance if planning slips past ~2 weeks; everything else is repo-internal and stable).
