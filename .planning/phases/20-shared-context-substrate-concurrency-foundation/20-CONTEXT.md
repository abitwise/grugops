# Phase 20: Shared-Context Substrate & Concurrency Foundation - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the **mechanical foundation** of the shared verified context — the typed-note
schema, the `context-io.ts` / `claim.ts` `node:fs` helpers, the committed-JSONL index +
`freshness:context` gate, the `.grugops/context/` + `.grugops/queue/{pending,claimed,done}/`
layout, and the `guard_context_writes` grep guard — so drift is caught **as it is written**,
before any role uses it.

**Requirements:** SCTX-01, SCTX-02, SCTX-03, SCTX-04, SCTX-05, CLAIM-01, CLAIM-02.

**OUT (later phases, do NOT pull in):** rewiring roles/workflows onto the substrate +
deleting handoffs (Phase 24); wiring roles to call the consolidation render on task-done
(Phase 24); the verify-before-write admission stamp + refuse-self-set + note-hygiene (Phase
21 / VFY); semantic LLM compaction (Phase 22 / CMP); `queue.wip_limit` width cap + the
human-facing "now-running" board projection + per-delegation claim cap (Phase 23); config
dials `context.compaction` / `human_admission` / `audit_retention` (Phases 22/25). This
phase rewires **no roles** and adds **no config dials**.
</domain>

<decisions>
## Implementation Decisions (LOCKED — do not revisit)

### Append safety & note storage
- **Per-note files as the write unit.** Each note is its own markdown file, published by
  atomic write-temp-then-`rename`; **lock-free**. The note files ARE the markdown source of
  truth. `appendNote` = write one NEW file, never mutate a shared file. This is the
  multi-process, filesystem-native analog of DeLM's "append-only list + writes-serialized-
  under-a-lock" (DeLM's `asyncio.Lock` is in-process-only and does NOT port to grugops's
  separate-process agents — see `<specifics>`).
- **Note identity = `<at-compact>-<by>-<kind>-<nonce>.md`** (e.g.
  `20260617T142305Z-engineer-finding-a1b2.md`). Time-prefix → legible `ls` timeline;
  `nonce` (`crypto.randomUUID()` slice, `node:crypto`, zero-dep) → lock-free uniqueness so
  two same-millisecond writers never clobber. **Authoritative order/replay is the
  `at`+`supersedes` fields per SCTX-04 — the filename is storage/convenience only.**
- **Note format = YAML frontmatter + markdown body** (kit-idiomatic CommonMark+frontmatter;
  every role/agent/skill/command already uses it). Frontmatter carries the SCTX-01
  provenance fence: `kind` / `by` / `at` / `verified_by` / `confidence` / `refs` (YAML list)
  / `supersedes` (note-id ref). Validator reuses existing frontmatter parsing; the JSONL
  index line = frontmatter→JSON. (Supersedes the research's HTML-comment pipe-fence sketch,
  which only made sense for the rejected shared-single-file model.)

### Per-task structure & consolidation
- **Per-task folder layout:**
  ```
  .grugops/context/<task>/
    index.md      ← templated, consolidated task-notes — the HUMAN-FACING artifact
                    (DERIVED: deterministic render of notes/, freshness-gated, zero-token)
    index.jsonl   ← derived machine event index (SCTX-03, committed, freshness-gated)
    notes/        ← append-only raw note files (the SCTX-04 audit substrate; git-tracked;
                    RETAINED for historical logging — never pruned on consolidation)
  ```
  (Exact filenames — `index.md` vs `<task>.md`, `index.jsonl` vs `events.jsonl` — are
  planner-final; the *structure* is what is locked.)
- **Consolidation is a DETERMINISTIC TS render** — `context-io.ts` reads `notes/`
  frontmatter and emits the templated `index.md`, byte-reproducible and freshness-gated.
  **Zero-token. NOT an LLM summary.** (DeLM's own `extract_structured_summary()` is exactly
  this — a zero-LLM deterministic extractor.) A *semantic* distillation is the Phase-22
  compaction layer, explicitly out of this phase.
- **Raw notes persist** (not pruned/replaced on consolidation) — preserves the append-only
  `git log` audit trail (SCTX-04). `index.md` is the face; `notes/` is the honest substrate.
- **The consolidated task-notes TEMPLATE is a Phase-20 contract artifact**, in
  `agent-factory/contracts/` (currently empty — its natural home), alongside the note-schema
  doc.
- **Boundary:** Phase 20 ships the render fn + template + freshness gate; *wiring roles to
  call render-on-done* is Phase 24.

### Concurrency model (partition + atomic net)
- **Write unit = the claimed task → single-writer common path.** The atomic queue-claim
  (`mkdirSync`, CLAIM-02) makes each task exclusively owned, so within-task writing is
  normally single-writer; genuine same-folder concurrency only at the **stale-claim reclaim**
  edge. This aligns with DOGF-02's "each task claimed exactly once" — the requirements
  already assume partition, not N-writers-one-file.
- **The primitive stays safe under concurrency anyway.** `appendNote`/`atomicWrite` MUST be
  un-clobbered under concurrent writes (SC-2 + DOGF-02 require it). Partition reduces how
  *often* concurrency is stressed; per-note-file rename keeps the primitive safe for the
  reclaim edge. Rare-by-design, safe-by-mechanism — do NOT weaken SC-2.

### Queue & claim mechanics
- **Queue = `.grugops/queue/{pending,claimed,done}/`;** transitions by atomic rename; no
  central lock manager. **Claim = `mkdirSync(claimed/<task>/)`** — atomic, NFS-safe,
  preferred over `O_EXCL`; a second claimant's `mkdir` throws `EEXIST` = claim lost (CLAIM-02).
- **The claim records `by` + `at` + task-ref** in `claimed/<task>/claim.md` (frontmatter) —
  this IS the "now-running" registry. `ls .grugops/queue/claimed/` + each `claim.md` =
  which agent is on which task since when. (Required anyway for the stale-sweep.)
- **Staleness = generous, configurable wall-clock TTL, evaluated at an EXPLICIT
  coordinator-run sweep** — NOT DeLM's 300 s (the default must exceed a real agent turn, or
  long-running work gets falsely reclaimed). **pid/host liveness is rejected** (not portable
  cross-machine / NFS). Heartbeat/lease liveness is **deferred to v2.x (PAR-05)**. DOGF-02
  ("a stale claim is reclaimed") is the honest gate.
- **Subtask file in `pending/` = thin but self-contained** — what-to-do + a `ref` to its
  `.grugops/context/<task>/` folder + the originating ticket — NOT a fat duplicate of the
  ticket (single-source discipline).

### Cross-platform proof (no-fabrication, Constraint #6)
- **Windows → real.** Add a `windows-latest` leg to the existing vitest matrix; the
  `unlinkSync`-then-`renameSync` branch actually executes on real Windows. No reason to mock
  what GitHub Actions runs for free.
- **NFS → deterministic + honest `UNKNOWN - verify`.** Unit-test the claim/atomic logic
  deterministically; **honestly mark true-NFS runtime `UNKNOWN - verify`** rather than fake a
  green. The eventual real gate is DOGF-02 (N-agent parallel dogfood under genuine concurrent
  spawn); PAR-05 (advisory leases) is the documented fallback IF `mkdirSync`-claim races on
  NFS. Mirrors Phase 19's honesty posture: real where runnable, loud-honest where not.

### Build model & patterns to clone (carried forward — D-13, LOCKED)
- TypeScript authored → `tsc` to **committed `.js`** → **freshness-checked** (rebuild-to-temp,
  byte-diff, fail-red on drift) → vitest-covered. Dev deps stay `{typescript, vitest}` (+
  type-only `@types/node`) — add NOTHING else. `node:fs`-only; **zero host runtime deps**.
- Clone the existing template: `scripts/freshness.ts` (drift gate) for `freshness:context`;
  `scripts/generate-catalog.ts` + `scripts/catalog-freshness.ts` + `*.test.ts` (generator +
  freshness + vitest) for the new helpers. Register `guard_context_writes` in
  `scripts/check-foundation-guards.ts` (the guard aggregator, alongside `guard_wr05` et al.).
- New helpers: **`context-io.ts`** (`readContext` / `appendNote` / `atomicWrite` + the
  deterministic `index.md` render + JSONL index regen) and **`claim.ts`** (`mkdirSync` claim
  + explicit stale-sweep). Windows unlink-then-rename in both.

### Schema (six kinds — SCTX-01, restated for downstream)
- Six note kinds: `claim` / `finding` / `decision` / `failed-attempt` / `observation` /
  `artifact-ref`.
- **CRITICAL naming distinction (surfaced via the DeLM dialog):** the `claim` **note-KIND**
  (a soft, unverified assertion that — per VFY-04, Phase 21 — can NEVER satisfy a `finding`'s
  admission) is a DIFFERENT concept from the **queue CLAIM** (hard work-ownership via atomic
  `mkdir`, CLAIM-01/02). DeLM conflates them into one TTL'd note; grugops keeps them separate.
  Docs/schema MUST NOT blur the two.

### Voice
- Clear (non-caveman) voice on the schema / validator / guard / freshness surfaces — they
  touch safety + the trace (CLAUDE.md hard rule, same as `freshness.ts`).

### Claude's Discretion
- Exact nonce length / token format against `node:crypto` specifics.
- Exact derived-artifact filenames (`index.md` vs `<task>.md`; `index.jsonl` vs
  `events.jsonl`) and per-task vs rolled JSONL granularity (SCTX-03 says per-task — confirm).
- Internal structure of the `index.md` / task-notes template (sections, ordering) — the
  *existence* of a deterministic template is locked; its exact shape is open.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked v2.0 design + requirements (read first)
- `.planning/research/SUMMARY.md` — the locked v2.0 decentralization design (shared-context
  file format, queue layout, `node:fs` concurrency primitives, zero-new-dep headline,
  pitfalls 1/5/7/10). HIGH confidence.
- `.planning/REQUIREMENTS.md` — SCTX-01..05, CLAIM-01/02 (this phase) + milestone decisions
  (committed-JSONL + `freshness:context`, markdown-wins, parallel-first).
- `.planning/ROADMAP.md` §"Phase 20" — the 5 success criteria this phase must make TRUE.

### Project constraints + build model
- `CLAUDE.md` — Constraints (esp. #6 no-fabrication, voice discipline, single-source, **zero
  host runtime deps**) + the TypeScript tooling-layer / committed-`.js` / freshness contract.
- `.planning/phases/15-typescript-tooling-migration/` (D-13) — TS→committed-`.js`+freshness
  model. `.planning/phases/19-.../19-CONTEXT.md` — the clone-the-pattern + honest-skip /
  `UNKNOWN - verify` precedent this phase mirrors.

### Existing code to clone / extend
- `scripts/freshness.ts` — build-output drift gate (clone for `freshness:context`).
- `scripts/generate-catalog.ts` + `scripts/catalog-freshness.ts` + `scripts/*.test.ts` —
  generator + freshness + vitest template for `context-io.ts` / `claim.ts`.
- `scripts/check-foundation-guards.ts` — the guard aggregator where `guard_context_writes`
  registers.
- `hooks/guard.ts` — the refuse-self-set / deny pattern (forward ref for Phase 21 VFY — NOT
  implemented this phase, but the precedent for the admission stamp).
- `agent-factory/contracts/` — EMPTY; home for the note-schema doc + the consolidated
  task-notes template.

### External prior art (verified this session)
- DeLM — arXiv 2606.10662 + `github.com/yuzhenmao/DeLM`
  (`shared_lessons.py`, `verifier.py`, `memory_compactor.py`, `prompts/note_rules.py`). The
  source of the shared-context / append-only / typed-note pattern; see `<specifics>` for the
  verified mechanics and where grugops deliberately diverges.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/freshness.ts` — rebuild-to-temp + byte-diff + fail-closed drift gate; the exact
  model for the `freshness:context` JSONL-mirror gate (SCTX-03).
- `scripts/generate-catalog.ts` + `catalog-freshness.ts` + co-located `*.test.ts` — the
  canonical "TS helper → committed `.js` → freshness → vitest" structural template to clone.
- `scripts/check-foundation-guards.ts` — registry-style aggregator (`guard_wr05`,
  `guard_voice`, `guard_adapter_size`, …); `guard_context_writes` (SCTX-05) slots in here.

### Established Patterns
- D-13 build model: `node:fs`-only TS, `tsc`→committed `.js`, freshness-checked, vitest,
  deps `{typescript, vitest, @types/node}` only — **the hard pattern for all new helpers**.
- `import.meta.dirname` to resolve repo root (Node 22+ floor); fail-closed gates (never
  report "fresh" on a failed rebuild).
- Guard scripts emit clear-voice findings on safety/build surfaces.

### Integration Points
- New seed dirs `.grugops/context/` + `.grugops/queue/{pending,claimed,done}/` — `install.ts`
  seeding is touched LATER (Phase 24 install update); Phase 20 defines the layout + helpers.
- `guard_context_writes` → `check-foundation-guards.ts` aggregator (and thereby the §14 gate
  `agent-factory/workflows/05-pr-quality-gate.md`, single-source — do NOT fork gate logic).
- `agent-factory/contracts/` (empty) gains the note schema + task-notes template.
</code_context>

<specifics>
## Specific Ideas

**DeLM verification (this session, against `github.com/yuzhenmao/DeLM` source):** the user's
detailed paraphrase of DeLM's conflict-prevention was CONFIRMED accurate, with one
load-bearing correction —

- DeLM's blackboard is an **in-process, in-memory append-only list (`SharedLessons._entries`)
  serialized by `asyncio.Lock`**, one per task. It also appends each entry to a per-task
  `.jsonl`, but the code comments that disk is best-effort and **"the in-memory copy is the
  authoritative read path"** — the file is never read back for coordination.
- **Therefore `asyncio.Lock` does NOT port to grugops** (whose agents are separate
  processes — CC subagents, and four CLIs as separate invocations; no shared heap, no
  cross-process lock without a lock-manager CLAIM-01 forbids). **This is *why* grugops uses
  per-note files + atomic rename: it is the filesystem-native serialization.**
- **grugops deliberately INVERTS DeLM's authority:** grugops's markdown is the durable
  source of truth and the JSONL is the derived, freshness-gated mirror — the opposite of
  DeLM's "memory authoritative, `.jsonl` throwaway." That inversion IS the auditable +
  human-gatable differentiator.

Confirmed DeLM specifics banked for later phases (NOT this phase): `MAX_CLAIMS_PER_DELEGATION
= 2` (→ Phase 23 backlog); `DEFAULT_CLAIM_TTL_SECONDS = 300` + expire-at-read (→ confirms the
TTL-staleness model, generalized to a generous configurable default); the deterministic
invalid-evidence phrase list in `verifier.py` (→ Phase 21 VFY-02, see Deferred).
</specifics>

<deferred>
## Deferred Ideas

- **DeLM invalid-evidence phrase list → Phase 21 (VFY-02).** `verifier.py`'s
  `_INVALID_EVIDENCE_PHRASES`: `"tbd"`, `"pending"`, `"not verified"`, `"unverified"`,
  `"should work"`, `"should pass"`, `"looks right"`, `"looks correct"`, `"seems to work"`,
  `"to be verified"`, `"will verify"`, `"n/a"` (match on `==` or `startswith` + non-alpha
  boundary). Concrete input for refuse-self-set / note-hygiene admission checks.
- **Per-delegation claim cap → Phase 23.** DeLM's `MAX_CLAIMS_PER_DELEGATION = 2`, considered
  alongside `queue.wip_limit` (CLAIM-03) — bound one noisy worker from flooding claims.
- **Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).** Only if naive `mkdir`/rename
  claim races under true parallel spawn (the `mcp_agent_mail` pattern is the documented
  fallback); DOGF-02 decides.
- **Human-facing "now-running" board projection + WIP width cap → Phase 23** (board-as-state
  over the WIP-limited queue). Phase 20 ships the underlying claim data + a minimal
  list/sweep only.
- **Semantic (LLM) distillation of task notes → Phase 22 (CMP).** Phase 20's consolidation is
  deterministic render only.
</deferred>

---

*Phase: 20-shared-context-substrate-concurrency-foundation*
*Context gathered: 2026-06-17*
