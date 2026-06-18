# Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy) - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Bound the multi-agent token tax with **two-tier memory**, landed *before* Phase 23's
parallel fan-out makes the cost real. The verbose local trajectory stays in the agent's
own thread tier; only a **compact, re-verified** distillation promotes to the shared
verified context (Phase 20/21's substrate). Deliverables: a new `scripts/compactor.ts`
helper, a new `agent-factory/workflows/18-context-compaction.md` single-source protocol,
and a new `context.compaction` config dial.

**Requirements:** CMP-01, CMP-02, CMP-03.

**The framing pivot (sets the whole design):** compaction/distillation is *semantic*, but a
zero-host-dep `node:fs` helper cannot summarize. So, mirroring Phase 21 exactly
(`context-io.ts` enforces mechanically; the agent supplies the judgment): **the agent
compresses note *bodies* (the intelligence — caveman token-economy applied to memory);
`compactor.ts` protects note *structure* (a deterministic carve-out invariant checker).**
This body/frontmatter seam is the spine of every decision below.

**Voice:** Clear professional voice throughout — the compactor, the dial, and Workflow 18
are trace + safety + token-economy surfaces (CLAUDE.md hard rule, same posture as
`context-io.ts`, `hooks/guard.ts`, and Workflow 16).

**OUT (later phases / deferred — do NOT pull in):**
- Periodic **re-compaction of the already-admitted shared context itself** (DeLM's
  Stage-1→Stage-2 hierarchical re-summary of the blackboard) → **CMP-04, deferred to v2.x**
  ("compaction tuning knobs beyond the three-value dial — once the default is validated").
  Phase 22 is **trajectory → shared only**. (USER-CONFIRMED boundary.)
- `queue.wip_limit`, parallel fan-out, nested spawning, the inverted WR-05 guard,
  Orchestrator-as-decomposer → **Phase 23**.
- Deep rewiring of all 18 roles + 16 workflows onto the substrate, and **deletion** of the
  17 static handoff templates → **Phase 24**. Phase 22 adds only the cheap one-line WF18
  pointer to roles (same pattern as the WF16 pointer added in Phase 21).
- Mechanical un-forgeable `human:<name>` signal → **Phase 25** (`context.human_admission`).
- A `guard_context_protocol_single_source` foundation guard → **Phase 24** (build it when
  the deep rewiring lands; flag only now).
</domain>

<decisions>
## Implementation Decisions (LOCKED — do not revisit)

### Division of labor — the body/frontmatter seam (CMP-01, CMP-02)
- **D-01 — The agent compresses bodies; `compactor.ts` protects structure.** The agent
  (following Workflow 18) reads its verbose local trajectory and writes the terse gist —
  collapsing the *narrative prose* of note bodies. `compactor.ts` never summarizes (it is
  `node:fs`-only, zero host runtime deps — D-15; it CANNOT call an LLM). This is Phase 21's
  pattern reused: the tool is the un-cheatable mechanical floor, the role is the intelligence.
- **D-02 — `compactor.ts` is a carve-out *invariant checker* over `(raw thread → proposed
  promoted notes)`.** Its mechanical, deterministic job before promotion:
  1. Every `failed-attempt` note id present in the raw thread **survives** into the promoted
     set (failure-as-shared-constraint — DeLM's reusable dead-ends are never compacted away).
  2. The load-bearing provenance fields `verified_by` / `supersedes` / `by` / `at` are
     **intact** on every promoted note.
  3. Promotion happens **only** via `context-io.ts`'s `appendNote` — `compactor.ts` does NOT
     fork a writer (single sanctioned write path preserved; Phase-21 admission still fires).
  On any dropped load-bearing element → **refuse, exit 1, name the fault** (mirrors
  `context-io.ts`'s hard-reject and `hooks/guard.ts`). A RED test proves a drop of *each*
  carve-out element fails (CMP-02).
- **D-03 — `compactor.ts` does NO semantic structural folding.** USER-DECIDED (fork resolved:
  dumb-guard-only over heuristic dedup). The *only* fold it may reuse is `context-io.ts`'s
  existing deterministic `currentState()` `supersedes` collapse. "Drop a duplicate
  observation" is a judgment in disguise → that is the agent's job, not the tool's. Keep the
  tool mechanically dumb and un-cheatable; the mechanical/semantic line stays crisp.

### The dial — tunes body verbosity, never the carve-out (CMP-03)
- **D-04 — `context.compaction: aggressive | balanced | retain-raw`.** The dial changes only
  **how compressed note bodies are** and **how much of the raw trajectory reaches the
  read-by-default (shared) tier** — never *which* durable notes promote.
  - `aggressive` (**lean default when absent**): only the compact gist in shared context; raw
    stays in the local `threads/` tier, unfolded on demand. Max token win.
  - `balanced`: gist + a fuller mid-tier summary promoted.
  - `retain-raw`: full trajectory bodies admitted to shared context (enterprise/audit — pay
    the tokens to keep everything in the durable record; this is what makes `threads/` being
    ephemeral acceptable — see D-07).
- **D-05 — The promoted *note set* is dial-invariant; the carve-out is un-dialable.** The
  durable kinds (`finding` / `decision` / `failed-attempt` / `artifact-ref`) and the
  load-bearing fields (D-02) survive identically at all three levels. The dial NEVER turns the
  carve-out off. This is what keeps D-02's invariant check enforceable regardless of dial.
- **D-06 — Documented across all three config surfaces.** `agent-factory/config/factory.config.json`,
  `agent-factory/config/factory.config.md` (field reference + the lean→enterprise config-dial
  contract table), and the seed `agent-factory/seed/.grugops/factory.config.json`. Lean
  zero-config still runs (`aggressive` default when the key is absent).

### The local trajectory tier — `threads/` (CMP-01)
- **D-07 — `threads/` is gitignored ephemeral local scratch, NOT committed.** USER-DECIDED
  (fork resolved: ephemeral over committed+retained). Only the **compact verified context** is
  committed and reviewed → clean PRs, honest token economy, and the audit story stays "git log
  over the *verified* context," not over every raw agent thought. Consequence: `retain-raw`
  (D-04) means "promote the raw *into* the committed shared context" — the **dial**, not git,
  decides what becomes durable. Unfold-on-demand operates within the live session, not post-hoc
  from git history.
- **D-08 — Thread keying is per-task-per-agent: `.grugops/context/<task>/threads/<agent>.md`.**
  USER-DECIDED (fork resolved: per-task-per-agent over the requirement's literal flat
  `threads/<agent>.md`). Rationale: under Phase-23 parallel fan-out one agent type can run
  concurrently on different tasks; a flat per-agent file would collide. Logged as a deliberate,
  user-confirmed refinement of CMP-01's literal path wording.
- **D-09 — Lifecycle.** A thread is created on an agent's first write for a task, appended to
  as the agent works, compacted at handback (D-11), and — being gitignored ephemeral — is local
  scratch that is not part of the permanent audit trail. The permanent trail is the committed
  shared context.

### Workflow 18 — trigger + the re-verify (CMP-03)
- **D-10 — `18-context-compaction.md` is the single-source protocol** (clear voice), authored
  in Phase 22. Every role references it via a one-line pointer (same cheap additive pattern as
  the Phase-21 WF16 pointer); nobody restates it. WF18 **references** Workflow 16's admission
  rules for the re-verify rather than restating them.
- **D-11 — Trigger: the write-after-verify / task-handback boundary (primary), plus
  opportunistic mid-task on context-window pressure (secondary).** One distillation pass when
  the agent finishes its unit and is about to promote — NOT per-write (per-write distillation
  fights the atomic `appendNote` and wastes tokens). The mid-task pass is the "store essential
  info before proceeding" checkpoint (Anthropic's multi-agent guidance) that frees the agent's
  window.
- **D-12 — Re-verify reuses Phase-21's `admit()`; it adds no new verification machinery.**
  Only a promoted `finding` re-hits admission: its `§14-gate#<id>` stamp must still cross-check
  a live green verdict. Compressing a finding's *body* does NOT invalidate the verdict (the
  verdict verified the *work*, not the prose), so a faithful compaction re-admits cheaply; a
  compaction that materially changed the finding such that its stamp no longer holds is
  **refused → honestly degrade to a `claim` with `confidence: UNKNOWN - verify`** (Phase-21
  D-11 escape hatch). Soft kinds (`claim` / `observation` / `decision` / `failed-attempt` /
  `artifact-ref`) need no stamp and pass through (Phase-21 D-08).

### Build model (carried forward — D-13 of v1.2, LOCKED)
- **D-13 — `compactor.ts` follows the committed-`.js` contract.** TypeScript authored → `tsc`
  to committed `.js` → freshness-checked (rebuild-to-temp, byte-diff, fail-red) → vitest-covered
  (`compactor.test.ts`, RED-fixture-first for the CMP-02 carve-out). `node:fs` / `node:path` /
  `node:crypto` only; **zero host runtime deps**. Reuse `context-io.ts` primitives
  (`readContext`, `currentState`, `appendNote`, `admit`) — do NOT re-implement note I/O or
  admission inside `compactor.ts`.

### Claude's Discretion
- The exact body-compression *tiers* the dial expresses (how "gist" vs "mid-tier summary" are
  shaped in WF18 prose) — the dial's three behaviors are locked (D-04/D-05); the prose shape is
  planner-final.
- Whether the carve-out checker (D-02) is one `compactor.ts` function or a small set — the
  *separation of concerns* (body=agent, structure=tool) is locked; the surface is open.
- Exact `.gitignore` entry wording/location for the `threads/` tier (D-07) and whether the
  seed/installer creates the `threads/` parent dir.
- Internal section ordering of `18-context-compaction.md`.
- The mid-task pressure-trigger threshold/heuristic (D-11 secondary) — advisory, planner-final.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked design + requirements (read first)
- `.planning/REQUIREMENTS.md` — CMP-01/02/03 (this phase) + the v2.0 milestone decisions; the
  CMP-04 deferral that fixes the out-of-scope boundary (D — re-compacting the shared context).
- `.planning/ROADMAP.md` §"Phase 22" — the 4 success criteria this phase must make TRUE, and the
  upstream/downstream framing (depends on Phase 21's admission gate; precedes Phase 23 fan-out).
- `.planning/phases/21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl/21-CONTEXT.md`
  — the admission gate Phase 22's re-verify (D-12) reuses; the WF16-pointer additive pattern
  (D-10 mirrors it); the refuse/hard-reject/escape-hatch posture (D-02, D-12 mirror it).
- `.planning/phases/20-shared-context-substrate-concurrency-foundation/20-CONTEXT.md` — the
  substrate layout, per-note files, markdown-wins, `currentState`/`supersedes` replay (D-03 reuses).

### The schema + write path + verifier (build ON these, do not fork)
- `agent-factory/contracts/context-note.md` — the authoritative note schema. The six kinds, the
  provenance fence (the load-bearing fields of the D-02 carve-out), the required-field rule, and
  the `claim`-KIND ≠ queue-CLAIM distinction.
- `scripts/context-io.ts` — the ONLY sanctioned write path. Reuse `readContext`, `currentState`
  (the `supersedes` fold, D-03), `appendNote` (the sole promotion path, D-02), and `admit` (the
  re-verify, D-12). `compactor.ts` calls these; it never re-implements note I/O or admission.
- `scripts/context-io.test.ts` — the RED-fixture-first vitest idiom to extend in `compactor.test.ts`.
- `agent-factory/workflows/16-context-read-write.md` — Workflow 16, the read/write/admission
  single-source protocol. WF18 (D-10) references its admission rules for the re-verify; it is the
  model WF18 follows (single-source, referenced not restated).
- `agent-factory/workflows/05-pr-quality-gate.md` — the §14 gate; the verdict the re-verify (D-12)
  cross-checks against; the "advise loudly, never hide / never a faked pass" posture.

### Config surfaces (update all three in lockstep — D-06)
- `agent-factory/config/factory.config.json` — add `context.compaction`.
- `agent-factory/config/factory.config.md` — field reference + the lean→enterprise config-dial
  contract table.
- `agent-factory/seed/.grugops/factory.config.json` — the seeded per-repo config twin.

### Project constraints + build model
- `CLAUDE.md` — Constraints: no-fabrication (#6), voice discipline (clear voice on
  safety/trace/token surfaces), single-source, zero host runtime deps, the D-13
  TypeScript/committed-`.js`/freshness contract.
- `.planning/research/SUMMARY.md` + `.planning/research/FEATURES.md` — the locked v2.0
  decentralization design + DeLM grounding (two-tier memory; selective-unfold; the three
  cost-saving sources; the 15× multi-agent token warning compaction exists to bound).
- `.planning/phases/15-typescript-tooling-migration/` — the D-13 build model in detail.

### External prior art
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM`. Compaction = hierarchical summarization
  (atomic ref-tagged bullets → highly-compact gists; read gists by default, selectively unfold).
  Cost saving from three sources: shared failures as reusable constraints (D-02's
  `failed-attempt` carve-out), compact patch-summaries replacing full traces, selective unfold.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/context-io.ts` — `readContext` / `currentState` (the deterministic `supersedes`
  fold D-03 reuses), `appendNote` (the sole promotion path D-02 routes through), `admit` (the
  re-verify D-12 reuses), `NoteRecord` / `NoteInput` / `NOTE_KINDS`. `compactor.ts` is a thin
  helper ON TOP of these — it never re-implements note I/O or admission.
- `scripts/context-io.test.ts`, `scripts/catalog-freshness.test.ts` — the RED-fixture-first
  vitest pattern for `compactor.test.ts` (prove a dropped carve-out element FAILS, per CMP-02).
- `hooks/guard.ts` — the refuse / exit-1 / name-the-fault + documented-honest-residual style the
  carve-out checker (D-02) mirrors.

### Established Patterns
- D-13 build model: `node:fs`-only TS → committed `.js` → freshness-checked → vitest. The hard
  pattern for `compactor.ts` (+ its committed `.js` + freshness coverage).
- Single-source workflow files referenced (not restated) by every consumer — the model WF18
  follows (D-10), exactly as WF16 did in Phase 21.
- The cheap one-line workflow pointer added to role files (Phase-21 WF16 pointer) — the additive,
  low-risk pattern Phase 22 repeats for the WF18 pointer.
- Clear-voice on safety/trace/token surfaces; `UNKNOWN - verify` over a faked pass (D-12 degrade).

### Integration Points
- `compactor.ts` is a NEW `scripts/` helper that imports `context-io.ts`; it must register in
  the freshness check + the committed-`.js` set like its siblings.
- `18-context-compaction.md` is a NEW workflow file (ordinal 18, continuing the frozen 00–17
  sequence — WF16/17 are the Phase-21/23 additions); the one-line pointer is added to role files.
- The `threads/` tier lives under `.grugops/context/<task>/threads/<agent>.md` (D-08) and is
  **gitignored** (D-07) — a `.gitignore` entry is added; the shared context dirs stay committed.
- The dial reads from the three config surfaces (D-06); no new dial-reading machinery — follow
  how `quality.*` / `security.*` keys are already read by roles/workflows.
- `validate-agent-factory.ts` / `generate-catalog.ts` will see the new workflow file (catalog
  row) — confirm the catalog/validator pick up WF18 (Phase 22 is additive; the deep validator
  rewiring is Phase 24).
</code_context>

<specifics>
## Specific Ideas

**The body/frontmatter seam, stated once (the spine):** bodies are the agent's to compress
(semantic, the role's intelligence, caveman token-economy); frontmatter + structure (the
`failed-attempt` notes, `verified_by` / `supersedes` / `by` / `at`) are the tool's to protect
(mechanical, deterministic, un-cheatable). Every Phase-22 decision falls out of this seam.

**The dial is a body-verbosity knob, not a correctness knob.** `aggressive` → `balanced` →
`retain-raw` moves the slider on how much *prose* survives and how much raw reaches the shared
tier. It can NEVER drop a durable note or a load-bearing field — the carve-out is the un-dialable
safety floor (mirrors how `test_integrity` is `warn|block`-only, never off).

**Re-verify is cheap because the verdict verified the work, not the words.** Compressing a
finding's body keeps its `§14-gate#<id>` stamp valid against the live green verdict, so
re-admission via `admit()` is a stamp cross-check, not a re-run of the gate. The only refusal is
when compaction materially changed the finding — then it honestly degrades to a `claim`.

**`threads/` ephemeral is what makes `retain-raw` meaningful.** Because the local tier is
gitignored scratch (D-07), "I want the raw kept" is expressed by the dial promoting raw INTO the
committed shared context (`retain-raw`), not by committing `threads/`. The dial owns durability.
</specifics>

<deferred>
## Deferred Ideas

- **Re-compaction of the already-admitted shared context itself** (DeLM Stage-1→Stage-2
  hierarchical re-summary of the blackboard) → **CMP-04, v2.x** (already deferred:
  "compaction tuning knobs beyond the three-value dial — once the default is validated").
  Phase 22 is trajectory→shared only (USER-CONFIRMED boundary).
- **Committed/retained `threads/` with post-hoc unfold from git history** → rejected for Phase 22
  (D-07 chose gitignored ephemeral). Re-openable only if the `retain-raw` dial proves insufficient
  for an audit need in the Phase-26 dogfood.
- **A `guard_context_protocol_single_source` foundation guard** (assert no role restates the
  compaction protocol) → **Phase 24**, when the deep rewiring lands.
- **Heuristic/semantic dedup inside `compactor.ts`** → rejected (D-03, dumb-guard-only). Stays the
  agent's job.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 22-memory-trajectory-compaction-dialable-token-economy*
*Context gathered: 2026-06-18*
