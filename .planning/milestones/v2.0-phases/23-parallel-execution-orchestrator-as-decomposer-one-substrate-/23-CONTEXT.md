# Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes) - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire **both** execution modes onto the one shared substrate built in Phases 20–22:
- **Parallel** on Claude Code — the coordinator spawns role-agents that atomically claim queued
  subtasks (nested spawning, depth ≤5), with concurrent **width** capped by `queue.wip_limit`.
- **Sequential** on the four non-spawning CLIs (Codex, Gemini, OpenCode, Copilot) — concurrency-1
  drain of the *same* queue via the rewired `_role-switch-protocol.md` step-4.

Both modes converge on identical on-disk substrate artifacts (one substrate, two modes). The phase
redefines the Orchestrator from **router → decomposer/scheduler/gate**, inverts `guard_wr05`
(no-spawn → coordinator-only-spawn) **atomically** across the guard + packaging + wording surface +
catalog, and adds the `queue.wip_limit` width cap (+ `claim_cap` + `stale_ttl`).

**Requirements:** PAR-01, PAR-02, PAR-03, PAR-04, CLAIM-03.

**OUT (later phases — do NOT pull in):**
- The bulk rewire of all 18 roles + 16 workflows off handoffs + deletion of the 17 handoff
  templates + the `plans/handoffs/` seed + traceability migration → **Phase 24** (MIGR-01..04).
- The real-role dual-path **equivalence oracle** (admitted-`finding`s + gate-verdict equivalence) +
  aggregate token-cost measurement → **Phase 26** (DOGF). Deleting/rewiring alone never retires
  A3/DOG-02 — only the passing oracle does.
- `context.human_admission` / `context.audit_retention` config dials → Phase 25.
- Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).
</domain>

<decisions>
## Implementation Decisions

### 23/24 scope seam — dual-running spine (Option A)
- **D-01:** Phase 23 ships the **execution machinery only**: Orchestrator (decompose/schedule/gate),
  the `_role-switch-protocol.md` **step-4** claim+schedule wrapper + parallel-claim spawn variant,
  Workflow 17 (`17-task-claim.md`), the inverted `guard_wr05`, and the `queue` config object. The
  18-role / 16-workflow bulk rewire + handoff-template **deletion** stay Phase 24.
- **D-02:** **Dual-running** — role files' Output sections are **untouched**, so handoffs keep being
  written in 23. Context notes are the **authoritative memory**; Phase 23 adds **no new handoff
  coupling**. *(User preference: no handoffs — see `<specifics>`. Phase 24 handoff removal is the
  prioritized next step honoring this; do not deepen handoff coupling here.)*
- **D-03:** Roles **already reference Workflow 16** for context read/write (VFY-03, Phase 21 — "all
  roles reference, never restate"; confirmed in `orchestrator.md`). Phase 23 adds **only the
  claim+schedule layer** around that existing I/O — it does **NOT** re-wire context I/O into roles.
- **D-04:** SC3 convergence proof in 23 = **fixture / spine-level test** — a seeded synthetic
  2–3-subtask decomposition run through (a) the parallel spawn path and (b) the sequential drain,
  asserting **identical substrate state** (queue claim/done records + `.grugops/context/<task>/`
  notes, order-independent). No real-role LLM run here; that + the admitted-findings/gate-verdict
  oracle is Phase 26.
- **D-05:** Rewired step-4 is **thin and references, never inlines**:
  *"claim per WF17 → read/write context per WF16 → mark done."* Claim mechanics single-source in
  **Workflow 17**; note I/O single-source in **Workflow 16**.

### `queue` config object
- **D-06:** New **top-level `queue` object** (sibling to `wip_limits` / `context`):
  `{ "wip_limit": 3, "claim_cap": 2, "stale_ttl_minutes": 30 }`. Edited **atomically** across the
  three config surfaces — `agent-factory/config/factory.config.json` + the `.md` twin
  (`factory.config.md`) + `agent-factory/seed/.grugops/factory.config.json`.
- **D-07:** `queue.wip_limit` (concurrent agent **WIDTH**, CLAIM-03) is **independent** from the
  existing per-column `wip_limits` (board **flow**). The Orchestrator respects **both**. Document the
  distinction crisply — same naming-collision care Phase 20 applied to "`claim` note-kind vs queue
  CLAIM."
- **D-08:** **`claim_cap` folded in now** (default 2) — the Phase-20 deferred DeLM
  `MAX_CLAIMS_PER_DELEGATION` per-delegation anti-flood cap; same config blast radius as `wip_limit`.
- **D-09:** **`stale_ttl` surfaced as a dial now** (`stale_ttl_minutes`, default 30) — was a Phase-20
  constant; Phase 23 actively drains/sweeps the queue under real concurrency, so the coordinator
  stale-claim sweep TTL becomes dialable. Generous default (must exceed one real agent turn).
- **D-10:** Defaults `3 / 2 / 30` are **dogfood-tunable** and **user-configurable by design** (config
  dial); Phase 26 measurement informs any adjustment. Lean defaults, never silently overridden.

### Orchestrator redefinition — surgical augmentation
- **D-11:** **Augment, not rewrite.** Keep the 17-type classification + the routing matrix
  (repurposed: "subtask → which role *claims* it" instead of "request → which role *runs* it"). Keep
  the caveman prompt; add ~4 tight lines (decompose / queue / width / no-relay / spawn-only-on-CC),
  preserving voice/token economy.
- **D-12:** New spine in Responsibilities: classify → **decompose into subtasks** → **enqueue** (thin
  pending files, each a `ref` to its `.grugops/context/<task>/` folder) → **schedule** (spawn-on-CC up
  to `wip_limit` / drain-on-4-CLIs via the rewired protocol + WF17) → **gate** → run the
  **stale-claim sweep**.
- **D-13:** Add explicit (clear voice) hard limit: *"Holds `Agent(<allowlist>)`; sets
  `queue.wip_limit`, never exceeds width; does **NOT** relay data between agents — the shared verified
  context is the only channel."* Merge/deploy limits unchanged. Document the **two modes**
  (parallel depth ≤5 / sequential concurrency-1) over the one substrate.
- **D-14:** The Phase-20-deferred **now-running board projection** ships as a **separate derived
  `.grugops/queue` artifact** (e.g. `now-running.md`) — deterministic, zero-token,
  freshness-gated render of `claimed/*/claim.md`, mirroring the Phase-20 `index.md` render. **NOT**
  folded into `plans/board.md`.

### WR-05 inversion mechanics
- **D-15:** **Coordinator detection = a `coordinator: true` frontmatter marker** (semantic source of
  truth), NOT a filename hard-coded in the guard. Survives renames + the multi-form adapter
  proliferation (standalone agent / plugin / template); makes "is this the coordinator?" a first-class
  greppable property.
- **D-16:** **Both-direction guard assertion:** a coordinator **MUST** carry the `Agent(<allowlist>)`
  grant **and** a non-coordinator **MUST NOT**. A planted non-coordinator grant fails RED (SC4); a
  dropped coordinator grant *also* fails RED (catches a half-flip that would silently kill CC
  parallelism — matches "flips atomically").
- **D-17:** **Allowlist = explicit enumerated least-privilege** — `Agent(grugops-software-engineer,
  grugops-qe-e2e, grugops-security-nfr, …)` listing the spawnable specialist wrappers, NOT a broad
  `Agent`. Claude-Code-only (the four CLIs never spawn).
- **D-18:** **Atomic flip set** (one coordinated change — the guard/oracle goes red against the
  wording otherwise):
  1. `scripts/check-foundation-guards.ts` (+ committed `.js` + `.test.ts`) — invert `guard_wr05`.
  2. `scripts/check-uat-oracles.ts` — the **WR-05 wording-consistency oracle (B3)** flips in lockstep.
  3. `agent-factory/roles/_role-switch-protocol.md` — drop the *"No `Agent` tool. No sub-agent spawn."*
     **absolute** → "coordinator only."
  4. `agent-factory/packaging/subagent.frontmatter.md` + `slash-command.template.md` — prose +
     coordinator example carrying the grant + marker.
  5. `agent-factory/packaging/adapters.md` + `agent-factory/README.md` — the 5-tool tables,
     **asymmetric** edit (only the Claude Code row changes; the four other CLIs keep "no spawn").
  6. `.claude/agents/grugops-orchestrator.md` — add `Agent(<allowlist>)` + `coordinator: true`.
  7. `scripts/generate-catalog.ts` (+ regenerated catalog) — PAR-04's named "docs catalog."
- **D-19:** The inversion is **asymmetric across the 5 tools** — only Claude Code's coordinator gains
  the grant; the four non-spawning CLIs stay sequential/no-spawn. This nuance is load-bearing across
  the entire wording surface; voice discipline holds (clear voice on guard/safety/catalog surfaces,
  caveman only inside role prompts).

### Claude's Discretion
- Exact derived-artifact filename(s) under `.grugops/queue/` (`now-running.md` vs other) and whether
  the render extends `claim.ts` or `context-io.ts`.
- Exact `stale_ttl` key/unit and the precise spawnable-role enumeration in the allowlist.
- Whether Workflow 17 (`17-task-claim.md`) also single-sources the stale-sweep protocol or just the
  claim (planner decides), and its exact section shape (mirror `18-context-compaction.md`).
- The exact inverted prose across the flip set (subject to the voice rule above).
- Whether the now-running render needs its own freshness gate or rides the existing `freshness:context`.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked v2.0 design + requirements (read first)
- `.planning/ROADMAP.md` §"Phase 23" — the 4 success criteria this phase must make TRUE.
- `.planning/REQUIREMENTS.md` — PAR-01..04, CLAIM-03 + the milestone LOCKED decisions (parallel-first,
  CC floor v2.1.172 nested, coordinator-only Agent grant, committed-JSONL + `freshness:context`).
- `.planning/research/SUMMARY.md` — the v2.0 decentralization design; esp. §"Phase 23" (≈ lines
  128–133), the blackboard control-component framing (≈ line 70), "WR-05 inversion is one coordinated
  change" (≈ line 166), the `isolation: worktree` UNKNOWN (≈ lines 131/175), and the CC version-floor
  open question now resolved to **v2.1.172** (≈ line 209).

### Phase-20 substrate (the foundation this phase schedules over)
- `.planning/phases/20-shared-context-substrate-concurrency-foundation/20-CONTEXT.md` — substrate +
  queue + atomic-claim mechanics LOCKED; the deferred ideas routed **→ Phase 23** (per-delegation
  claim cap, now-running projection) and **→ PAR-05** (leases).

### Project constraints + build model
- `CLAUDE.md` — Constraints (#6 no-fabrication, voice discipline, single-source, **zero host runtime
  deps**) + the D-13 TypeScript→committed-`.js`→freshness build model.

### Files to modify / extend
- `agent-factory/roles/orchestrator.md` — the role to **augment** (router → decompose/schedule/gate).
- `agent-factory/roles/_role-switch-protocol.md` — step-4 rewire + drop the "No `Agent` tool" absolute.
- `agent-factory/workflows/16-context-read-write.md` — context I/O single-source (referenced by step-4).
- `agent-factory/workflows/18-context-compaction.md` — sibling workflow; the **pattern** for the new
  `17-task-claim.md`.
- `scripts/check-foundation-guards.ts` (`guard_wr05` ≈ lines 108–140) + `.test.ts` companion — invert.
- `scripts/check-uat-oracles.ts` — the WR-05 wording oracle (B3) to flip in lockstep.
- `scripts/claim.ts` + `scripts/context-io.ts` — existing Phase-20 helpers; the now-running render
  extends these.
- `agent-factory/config/factory.config.json` + `factory.config.md` (twin) +
  `agent-factory/seed/.grugops/factory.config.json` — the three config surfaces for the `queue` object.
- `agent-factory/packaging/{subagent.frontmatter.md, slash-command.template.md, adapters.md}` +
  `agent-factory/README.md` — the wording surface (asymmetric edit).
- `.claude/agents/grugops-orchestrator.md` — the materialized coordinator adapter.
- `scripts/generate-catalog.ts` — the docs catalog (PAR-04).

### External prior art (verified prior sessions)
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM`: `MAX_CLAIMS_PER_DELEGATION = 2` (the
  `claim_cap` default), the blackboard control component, append-only typed notes.
- `code.claude.com/docs/en/sub-agents` — `Agent` tool, nested spawn **v2.1.172+**, depth-5 background
  cap, background subagents share CWD.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/claim.ts` — atomic `mkdirSync` claim + explicit stale-sweep (Phase 20); the now-running
  render + `stale_ttl` dial wire in here.
- `scripts/context-io.ts` — deterministic `index.md`/JSONL render (Phase 20); the model for the
  zero-token, freshness-gated `now-running.md` render.
- `scripts/freshness.ts` — rebuild-to-temp + byte-diff fail-closed drift gate; pattern for any new
  derived render's freshness check.
- `scripts/check-foundation-guards.ts` — the guard aggregator hosting `guard_wr05` (explicit 4-file
  SCAN set, never a repo-wide grep).
- `scripts/generate-catalog.ts` — the browsable docs catalog generator (Phase 18).

### Established Patterns
- D-13 build model: `node:fs`-only TS → `tsc` to committed `.js` → freshness-checked → vitest; deps
  `{typescript, vitest, @types/node}` only; **zero host runtime deps**.
- **Explicit SCAN set** for guards (never a repo-wide grep) — token-vs-prose care (RESEARCH A3).
- **Deterministic, zero-token, freshness-gated renders** for human-facing derived artifacts
  (`index.md` precedent → `now-running.md`).
- **Single-source workflows referenced, never restated** (the `05-pr-quality-gate.md` / WF16 / WF17
  pattern); role files reference the protocol, the protocol references the workflows.
- **Config edit = json + `.md` twin + seed, atomic** (the established 3-surface change).

### Integration Points
- New `queue` config object → the 3 config surfaces; read by the augmented Orchestrator.
- `coordinator: true` marker → the orchestrator adapter frontmatter + the inverted `guard_wr05`.
- `now-running.md` render → `claim.ts`/`context-io.ts` + a freshness gate; surfaced by the Orchestrator.
- Workflow 17 (`17-task-claim.md`) → referenced by `_role-switch-protocol.md` step-4 + the Orchestrator.
- `guard_wr05` → `check-foundation-guards.ts` aggregator → the §14 gate (`05-pr-quality-gate.md`,
  single-source — do NOT fork gate logic).
</code_context>

<specifics>
## Specific Ideas

- **User prefers NO handoffs** (directional). Phase 23 honors the 23/24 boundary (deletion stays
  Phase 24) but adds **no new handoff coupling** and makes context notes the authoritative memory —
  Phase 24's handoff removal is the **prioritized** next step that realizes this preference.
- **The WR-05 flip is asymmetric** — only Claude Code's coordinator gains the `Agent(<allowlist>)`
  grant; the four non-spawning CLIs keep "no spawn." Every wording edit must preserve that asymmetry.
- **Convergence is proven at the fixture/spine level in 23** (identical substrate state across both
  paths for a seeded synthetic task); the full real-role dual-path dogfood + token-cost measurement is
  Phase 26.
</specifics>

<deferred>
## Deferred Ideas

- **Handoff-template deletion + 18-role / 16-workflow bulk rewire + traceability migration → Phase 24
  (MIGR-01..04).** User prefers this happen — prioritize it as the immediate next milestone step.
- **Real-role dual-path equivalence oracle (admitted-`finding`s + gate verdict) + aggregate
  token-cost measurement → Phase 26 (DOGF).** A3/DOG-02 retires only when this oracle passes.
- **Heartbeat / advisory-lease claim liveness → v2.x (PAR-05)** — only if naive `mkdirSync`/rename
  claim races under true parallel spawn; `mcp_agent_mail` file-lease is the documented fallback.
- **`isolation: worktree` ↔ shared-context-path interaction → `UNKNOWN - verify`**, resolved during
  the Phase 26 dogfood (not asserted green here).
- **Default tuning (`wip_limit` / `claim_cap` / `stale_ttl`) → Phase 26** dogfood measurement informs
  any change to `3 / 2 / 30`.

</deferred>

---

*Phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate-two-modes*
*Context gathered: 2026-06-21*
