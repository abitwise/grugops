# Phase 24: Clean Handoff Removal & Traceability Migration - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Cut over **cleanly** from static handoff packets to the shared verified context as the
**sole** inter-role memory: **rewire every reader first, then delete in one grep-to-zero
change** — while preserving the requirement→code→test→release trace.

**Requirements:** MIGR-01, MIGR-02, MIGR-03, MIGR-04.

**Headline principle (locked this session — the design intent):** *no large one-off handoffs.*
Each role's job comes from **the workflow + its queued subtask** (the thin `pending/` file:
what-to-do + a `ref` to its `.grugops/context/<task>/` folder + the originating ticket — Phase
20), **not** from a packet that tells it what to do. The role **pulls** the shared context it
needs **on-demand** to solve that task (selective read), and **publishes its work output as
typed notes**. *Push-a-curated-packet-to-the-next-named-agent* is replaced by
*pull-what-you-need + publish-your-output*.

**Scope surface (scouted this session):** 68 kit files reference "handoff" — **18 roles**, the
**16 SDLC workflows** (`00`–`15`; the 3 substrate workflows `16`/`17`/`18` are already
note-native and need no rewire), the **3 packaging templates** (`agent-factory/packaging/`:
`adapters.md`, `slash-command.template.md`, `subagent.frontmatter.md`), **AGENTS.md**, plus the
gates (`validate-agent-factory.ts`, `generate-catalog.ts`, `check-kit-refs.ts`,
`check-uat-oracles.ts`, `check-foundation-guards.ts`). There are **17 handoff templates** in
`agent-factory/handoffs/`.

**OUT (later phases — do NOT pull in):**
- The real-role dual-path **equivalence oracle** (admitted-`finding`s + gate-verdict
  equivalence) + aggregate token-cost measurement → **Phase 26** (DOGF). Deleting/rewiring alone
  never retires A3/DOG-02 — only the passing oracle does.
- `context.human_admission` / `context.audit_retention` config dials → **Phase 25**.
- Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).
- New substrate primitives — the substrate, queue, atomic-claim, verify-before-write admission,
  and compaction already exist (Phases 20–22); this phase **uses** them, it builds none.
</domain>

<decisions>
## Implementation Decisions

### Trace migration — MIGR-03 (Area 1)
- **D-01:** `plans/traceability.md` **survives** as a **deterministic render** of note
  `refs`/trace fields (Option A — not deleted, not hand-maintained). Same family as the Phase-20
  `index.md` and Phase-23 `now-running.md` renders. The **notes are the source of truth**;
  `traceability.md` is the human-facing derived face. (Rejected: B = delete it and have the
  validator read trace directly from note `refs`; C = keep it hand-maintained with notes merely
  feeding it.)
- **D-02:** The trace render **rides the task-done consolidation hook** that Phase 20 explicitly
  **deferred to Phase 24** ("wiring roles to call the consolidation render on task-done").
- **D-03:** `traceability.md` is **freshness-gated fail-closed** — editing notes without
  re-rendering trips a gate (a `freshness:context`-style gate, since `traceability.md` is per-repo
  runtime state in `plans/`, NOT committed kit output, so it is **not** the committed-`.js`
  freshness kind). The trace is the proof → stale trace = gate FAIL, never a silent pass.
- **D-04:** Rows stay **keyed by ticket ID** (the current `validate-agent-factory.ts` behavior,
  ticket id = filename without extension), columns **Requirement │ Code │ Tests │ UAT │ Release**
  populated from note `refs`. The validator's existing "every ticket has a trace row" completeness
  check **re-points** at the render/notes (minimal validator change).

### Roles → typed notes — MIGR-01 (Area 2)
- **D-05:** **Pull-not-push** (the headline principle, restated as a binding decision). Roles do
  not consume curated packets; they **read shared context on-demand** for what they need and
  **publish work output as typed notes**.
- **D-06:** **Kind mapping:** decisions → `decision`; risks/findings → `finding` / `observation`;
  deliverables → `artifact-ref`; trace IDs (requirement/code/test/release) → the note `refs` field.
- **D-07:** **The directional relay is fully dead.** Handoffs' *"Next agent / Next action"* fields
  are **deleted** — the Orchestrator owns sequencing (decompose→enqueue, Phase 23). A role MAY
  still surface *"this needs security review"* as an **advisory `finding`/`observation`** (picked up
  by the Orchestrator's decompose) — but **never** as a directive that names a successor. Advisory
  findings are the only residue of the old relay.
- **D-08:** **Several one-kind-per-file notes per role-run**, never a single "handoff-shaped"
  mega-note (the Phase-20 one-note-one-file-one-kind model). A renamed packet is NOT acceptable.
- **D-09:** **Uneven rewire depth across the 18 roles is fine.** ~12 roles have real handoff
  **Output sections** to fully convert; others (mappers, `agents-md-scribe`, `factory-coach`,
  `installer`) only **mention** handoffs incidentally → mention-removal. All 18 reach **zero**
  handoff references; no identical template is forced onto every role.
- **D-10:** Roles **reference Workflow 16, never restate** the note schema or name a raw
  `.grugops/...` write path (the Phase-21 VFY-03 "reference, never restate" rule). This is also what
  keeps **`guard_context_writes` (WR-01) green** when its false-positive watch goes live on the
  rewritten role prose — the guard fails RED on any shipped role/workflow text that writes context
  by a path other than the sanctioned `context-io.ts` helpers (Phase 20 SC-5).
- **D-11:** **Clean cut, no transitional dual-write.** Phase 23's D-02 dual-running (handoffs still
  written) **ends here** — the rewire removes handoff-writing from role Output sections entirely.

### Grep-to-zero gate + atomic cut — MIGR-01/02 (Area 3)
- **D-12:** **Two stages, ordered:** (1) **rewire** every reader so handoff refs → 0 in the kit
  text; (2) **delete** in one atomic change. The SC sequence ("rewire first, then delete in one
  grep-to-zero change") is binding.
- **D-13:** **Grep-to-zero authority = repurpose `check-kit-refs.ts` Assertion 2** — flip from
  *"every `agent-factory/handoffs/` ref is a known template basename / dir / placeholder"* → **"ZERO
  `agent-factory/handoffs/` refs"** (drop the 16-template ALLOW ERE). It already owns the
  handoff-ref scan over an **explicit SCAN set** (shipped kit + adapters + AGENTS.md — the right
  scope, **never a repo-wide grep**, token-economy preserved). NOT a new `guard_no_handoffs` in
  `check-foundation-guards.ts` (that stays focused on the live safety guards). The Assertion-2 flip
  lands **inside** the deletion change, providing the backpressure: the change cannot go green until
  the rewire is complete.
- **D-14:** **One atomic deletion change** (mirrors the Phase-23 WR-05 D-18 atomic-flip):
  1. `rm` all **17** handoff templates in `agent-factory/handoffs/` — **including the un-frozen
     `frontend-handoff.md`** (note: `validate-agent-factory.ts` `FROZEN_HANDOFFS` + the
     `check-kit-refs.ts` ERE only enumerate **16**; `frontend-handoff.md`, added with the Phase-16
     frontend persona, is the 17th — it must be deleted too and not orphaned).
  2. `validate-agent-factory.ts` — drop `FROZEN_HANDOFFS` existence checks + re-point the
     traceability completeness check (per D-01/D-04).
  3. `generate-catalog.ts` (+ regenerated catalog) — no reference to a deleted artifact.
  4. `check-kit-refs.ts` — the Assertion-2 flip (D-13).
  5. `check-uat-oracles.ts` — adjust any handoff-referencing oracle in lockstep.
  6. Test fixtures (see D-16) in the same change.
- **D-15:** **Both-direction adversarial proof vs the committed `.js`** (per
  [[grugops-safety-invariant-green-suite-insufficient]]): a **planted** `agent-factory/handoffs/`
  ref must fail the flipped gate **RED**; a clean kit passes GREEN. A green suite alone is
  insufficient — adversarially reproduce the bypass against the committed `.js` before marking
  done.
- **D-16:** **Delete the fixture handoff dirs in the same change** —
  `scripts/fixtures/*/agent-factory/handoffs/` exist only to satisfy the old `FROZEN_HANDOFFS`
  check; once that's gone they go too, keeping fixtures honest to the new no-handoffs structure
  (update any fixture-based test expectations in the same atomic change).

### `install.ts --migrate` UX — MIGR-04 (Area 4)
- **D-17:** **New standalone explicit `--migrate` flag** (never auto-run, never silent) — a routine
  `--update`/`--check` must never silently mutate a user's `plans/` state. (Planner reconciles with
  whatever `install.ts` flags exist today from the v1.2 install migrate/update track.)
- **D-18:** **Backup-not-delete:** rename `plans/handoffs/` → `plans/handoffs.bak-<ISO8601>/`,
  **never delete-first**, **never clobber** an existing backup. On the rare backup-name collision,
  **abort with a clear message** rather than overwrite.
- **D-19:** **No content conversion.** `--migrate` only backs up the directory; it does **not**
  parse legacy free-form handoff files into typed notes (lossy/risky — the backup preserves them
  for the human; the trace going forward is note-native).
- **D-20:** **Honor installer constraints:** dry-run capable (`--dry-run` prints the rename it
  would do), idempotent (a second run finds nothing to migrate → clean no-op; a user with no
  `plans/handoffs/` → "nothing to migrate"), reversible (the backup dir + `git revert` is the
  documented rollback). Prints exactly what it did.

### Claude's Discretion
- Exact filename/location of the trace render function (extend `context-io.ts` vs a new
  `trace-render.ts`) and whether it shares the existing `freshness:context` gate or gets its own.
- The exact `decision`/`finding`/`artifact-ref` note shapes each role emits, and the precise per-role
  Output-section wording (caveman voice inside role prompts; clear voice on the trace/validator/gate
  surfaces, since they touch the trail and safety — CLAUDE.md hard rule).
- The per-workflow rewire ordering across the 16 SDLC workflows and the exact wording removed.
- The ISO8601 precision used in the backup dir name (must be unique enough to avoid routine
  collision).
- Whether the `traceability.md` render is invoked per-task-done or batch-rendered by the
  Orchestrator at gate time (so long as D-03 fail-closed freshness holds).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked v2.0 design + requirements (read first)
- `.planning/ROADMAP.md` §"Phase 24" — the 4 success criteria this phase must make TRUE
  (grep-to-zero rewire; atomic delete + validator/catalog same-change; trace preserved on note
  `refs`; `--migrate` backup-not-delete).
- `.planning/REQUIREMENTS.md` — **MIGR-01..04** (the four migration requirements) + the milestone
  LOCKED decisions (committed-JSONL + `freshness:context`, markdown-wins, parallel-first,
  decentralized substrate replaces handoffs).
- `.planning/research/SUMMARY.md` — the locked v2.0 decentralization design (shared-context format,
  queue layout, `node:fs` primitives, "shared verified context replaces handoffs").

### Prior-phase substrate this phase migrates ONTO (read in order)
- `.planning/phases/20-shared-context-substrate-concurrency-foundation/20-CONTEXT.md` — the
  six-kind note schema + provenance fence, `context-io.ts` (`appendNote`/`atomicWrite`/`readContext`
  + the **deterministic `index.md` render**), `freshness:context` gate, `guard_context_writes`. The
  **task-done consolidation render** is the Phase-20-deferred hook D-02 rides; the `index.md` render
  is the pattern the trace render (D-01) clones.
- `.planning/phases/21-.../21-CONTEXT.md` — VFY-03 "all roles **reference** WF16, never restate"
  (the rule behind D-10) + the verify-before-write admission stamp the notes pass through.
- `.planning/phases/22-.../22-CONTEXT.md` — compaction layer (the notes this phase writes are the
  same notes that get compacted).
- `.planning/phases/23-parallel-execution-orchestrator-as-decomposer-one-substrate-/23-CONTEXT.md`
  — D-02 dual-running (the coupling D-11 severs); the Orchestrator decompose→enqueue that owns
  sequencing (behind D-07); the **WR-05 atomic-flip + both-direction adversarial proof** discipline
  D-14/D-15 mirror.

### Project constraints + build model
- `CLAUDE.md` — Constraints (#6 **no-fabrication / never fake a passing gate**, **voice discipline**
  clear on trace+safety surfaces, **single-source**, installers idempotent/additive/dry-run/
  reversible, **zero host runtime deps**) + the **D-13** TypeScript→committed-`.js`→freshness build
  model that any gate/render change MUST follow.

### Files to modify / delete (the migration surface, scouted this session)
- `agent-factory/handoffs/*.md` — the **17 templates to delete** (incl. `frontend-handoff.md`).
- `agent-factory/roles/*.md` — **18 roles**; ~12 with real handoff Output sections (heaviest:
  `_role-switch-protocol.md`, `orchestrator.md`, `software-engineer.md`, `qe-e2e.md`), the rest
  mention-only.
- `agent-factory/workflows/00-..15-*.md` — the **16 SDLC workflows** to rewire (`16`/`17`/`18` are
  already note-native — leave them).
- `agent-factory/packaging/{adapters.md, slash-command.template.md, subagent.frontmatter.md}` — the
  3 packaging templates.
- `AGENTS.md` — substrate-level handoff references.
- `scripts/validate-agent-factory.ts` — `FROZEN_HANDOFFS` (≈ lines 135–148, 253–255) + the
  traceability completeness check (≈ lines 414–466, reading `plans/traceability.md`).
- `scripts/check-kit-refs.ts` — Assertion 2 + the 16-template ERE (≈ lines 69–71, 159–173) — the
  grep-to-zero flip (D-13).
- `scripts/generate-catalog.ts` — catalog generator (must not reference deleted artifacts).
- `scripts/check-uat-oracles.ts`, `scripts/check-foundation-guards.ts` — handoff-referencing
  oracles/guards to adjust.
- `scripts/context-io.ts` / `scripts/claim.ts` / `scripts/freshness.ts` — the render + freshness
  patterns the trace render clones.
- `scripts/fixtures/*/agent-factory/handoffs/` — fixture handoff dirs to delete (D-16).
- `install.ts` (compiled `install.js`) + `install/README.md` — the `--migrate` flag (D-17..20).

### External prior art (verified prior sessions)
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM`: the shared-context / append-only typed-note
  / deterministic `extract_structured_summary()` model grugops's substrate is built on.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/context-io.ts` — the deterministic, freshness-gated `index.md` render is the **direct
  template for the `traceability.md` render** (D-01); `appendNote`/`readContext` are what roles call
  (via WF16) for publish/pull.
- `scripts/check-kit-refs.ts` — already the **handoff-ref authority** with an explicit SCAN set; the
  grep-to-zero flip (D-13) is a surgical edit to Assertion 2, not a new gate.
- `scripts/validate-agent-factory.ts` — `FROZEN_HANDOFFS` existence check + `plans/traceability.md`
  completeness check are the two validator touch-points (D-04/D-14).
- `scripts/freshness.ts` — the fail-closed drift-gate pattern for D-03's trace freshness gate.

### Established Patterns
- **Deterministic, zero-token, freshness-gated renders** for human-facing derived artifacts
  (`index.md` → `now-running.md` → now `traceability.md`).
- **Single-source: reference, never restate** (roles → WF16; gate logic single-sourced, never
  forked) — behind D-10.
- **Atomic flip set + both-direction adversarial proof vs the committed `.js`** (the WR-05 / Phase-23
  discipline) — behind D-14/D-15.
- **Explicit SCAN set for ref/guard gates** (never a repo-wide grep) — preserved by D-13.
- **D-13 build model:** `node:fs`-only TS → `tsc` to committed `.js` → freshness-checked → vitest;
  deps `{typescript, vitest, @types/node}` only.

### Integration Points
- The **task-done consolidation hook** (Phase-20-deferred) is where both the note-consolidation
  render AND the `traceability.md` render fire (D-02).
- `guard_context_writes` (WR-01) goes **live against the rewired role prose** this phase — D-10 keeps
  it green by holding roles to reference-only WF16 wording.
- `check-kit-refs.ts` flip + the deletion + validator/catalog/oracle/fixture updates are **one
  atomic change** (D-14); the §14 quality gate (`05-pr-quality-gate.md`) runs them — single-source,
  do NOT fork gate logic.

### Planner notes (clarifications, not new decisions)
- **The "`plans/handoffs/` seed" (MIGR-02) is effectively already absent** — `agent-factory/seed/`
  has no `plans/handoffs/` dir (seed = `plans/{epics,features,releases,sprints,tickets}` only). So
  MIGR-02's seed-deletion is mostly a **verify-install-never-creates-it** check; the real user-state
  handling is MIGR-04's `--migrate` on a runtime-accumulated `plans/handoffs/`.
- **Workflow count reconciliation:** there are 19 workflow files (`00`–`18`); MIGR-01's "16
  workflows" = the SDLC set `00`–`15`. The 3 substrate workflows (`16-context-read-write`,
  `17-task-claim`, `18-context-compaction`) are already note-native and out of the rewire.
</code_context>

<specifics>
## Specific Ideas

- **User's framing (verbatim intent, this session):** *"produce software without large one-off
  handoffs, but rather have work output for each role and each role knows what they need to do in the
  large-scale workflow. Context for each role can be gathered based on its need how to solve the
  task."* → encoded as the **pull-not-push** headline principle and D-05/D-07. This directional
  preference has been consistent since Phase 23 (`<specifics>`: "User prefers NO handoffs").
- **Trace = the proof** → the bias on every open question was toward **preservation + fail-closed**
  (Area 1: keep `traceability.md` as a render, freshness-gate it fail-closed) over the purer-but-
  riskier "delete and read from notes" option.
- **Safety-invariant discipline applies to the gate flip** — green tests ≠ proof; D-15 requires an
  independent adversarial reproduction vs the committed `.js`, per the terminal lesson in
  [[grugops-safety-invariant-green-suite-insufficient]].
</specifics>

<deferred>
## Deferred Ideas

- **Real-role dual-path equivalence oracle (admitted-`finding`s + gate verdict) + aggregate
  token-cost measurement → Phase 26 (DOGF).** A3/DOG-02 retires only when this oracle passes —
  rewiring/deleting handoffs alone does NOT retire it.
- **`context.human_admission` / `context.audit_retention` governance dials → Phase 25.**
- **Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).**
- None of the above is in Phase 24 scope — discussion stayed within the migration boundary.

</deferred>

---

*Phase: 24-clean-handoff-removal-traceability-migration*
*Context gathered: 2026-06-21*
