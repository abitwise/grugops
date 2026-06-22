# Requirements: grugops — v2.0 Decentralized Factory (Shared Verified Context)

**Defined:** 2026-06-16
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, an auditable requirement→code→test→release trail, and (from v2.0) a **shared verified context** that parallel agents build on — entirely as readable markdown, with humans always holding merge and deploy.

**Grounded in:** DeLM — *Decentralized Multi-Agent Systems with Shared Context* (Mao & Mirhoseini, 2026; arXiv 2606.10662). grugops extracts the best parts (shared verified context, file-based task queue, parallel agents, memory compaction) and differentiates on its own ground: the verified context is **auditable and human-gated**, with the existing §14 quality gate as the verifier. Full research: `.planning/research/SUMMARY.md`.

**Milestone decisions (from kickoff + requirements gating):**

- Architecture: **parallel-first, Claude Code primary**; the other four CLIs degrade to sequential over the same shared context (strict 5-tool parity retired — degrade, never break).
- Migration: **clean replacement** of static handoffs — the shared verified context becomes the sole inter-role memory.
- Context index storage: **committed derived JSONL** guarded by a `freshness:context` drift gate (markdown is the source of truth; JSONL is the machine-parsable mirror).
- Claude Code floor: **v2.1.172 (nested)** — role agents may themselves decompose and spawn (depth ≤5).
- Both **Governance-on-a-Dial (GOV)** and the **Dogfood/Dual-Path Oracle (DOGF)** are IN v2.0.
- Honesty floor: grugops's *own* success/cost gain is `UNKNOWN - verify` until DOGF measures it — DeLM's benchmark numbers are never claimed as grugops's.

---

## v2.0 Requirements

Requirements for the decentralization milestone. Each maps to exactly one roadmap phase (20–26). REQ-IDs continue grugops's `[CATEGORY]-[NUMBER]` scheme.

### SCTX — Shared Verified Context Substrate

- [x] **SCTX-01**: A typed-note schema — six kinds (`claim` / `finding` / `decision` / `failed-attempt` / `observation` / `artifact-ref`) carried in a markdown section with a provenance metadata fence (`by` / `at` / `verified_by` / `confidence` / `refs` / `supersedes`); the markdown is the source of truth.
- [x] **SCTX-02**: `context-io.ts` — `node:fs`-only helpers (`readContext` / `appendNote` / `atomicWrite`) compiled to committed `.js`, Windows-safe (unlink-then-rename), freshness-checked like the rest of the tooling layer.
- [x] **SCTX-03**: A committed per-task JSONL index derived from the markdown, guarded by a `freshness:context` drift gate (regenerate → byte-diff, fail-closed); the markdown wins on any conflict.
- [x] **SCTX-04**: An append-only, git-tracked context audit trail — every note carries `by` / `at` / `verified_by` / `supersedes`; the trace replays from `at` + `supersedes` (not file position); `git log` is the tamper-evident attribution.
- [x] **SCTX-05**: `guard_context_writes` — a foundation guard that fails red if any shipped role/workflow text writes the shared context by a path other than the sanctioned `context-io.ts` helpers.

### CLAIM — File-Based Task Queue & Atomic Claim

- [x] **CLAIM-01**: A file-based task queue at `.grugops/queue/{pending,claimed,done}/` — subtask files transition state by atomic rename; no central lock manager.
- [x] **CLAIM-02**: `claim.ts` — atomic claim via `mkdirSync` (NFS-safe, preferred over `O_EXCL`) + a stale-claim sweep rule; `node:fs`-only, committed `.js`, cross-platform tested.
- [x] **CLAIM-03**: A WIP cap (`queue.wip_limit`) bounding concurrent agent *width* (the platform caps spawn depth at 5, not width — the width cap is grugops's responsibility).

### VFY — Verify-Before-Write Admission

- [x] **VFY-01**: A `finding` is admitted to the shared context only with a real §14-gate verdict, a passing test reference, or a named human — recorded as `verified_by: §14-gate#<id>`.
- [x] **VFY-02**: Refuse-self-set — a `verified_by` that is missing, `self`, or the writing agent on a `finding` is a validator structural FAIL; a RED fixture proves a hollow/self-authored stamp fails (mirrors the prod-deploy hook + v1.2 test-integrity carve-out).
- [x] **VFY-03**: Workflow 16 (`16-context-read-write.md`) — the single-source read-before-act / write-after-verify / verify-admission protocol that all roles reference (never restate).
- [x] **VFY-04**: The §14 gate's bounded `self_fix_attempts` loop is reused as the bounded verify→regenerate loop; the `claim` / `UNKNOWN - verify` escape hatch stays honest and explicitly non-load-bearing.

### CMP — Memory & Trajectory Compaction

- [x] **CMP-01**: `compactor.ts` — two-tier compaction: the verbose local trajectory stays in `.grugops/context/threads/<agent>.md`; only compact verified distillations promote to the shared context.
- [x] **CMP-02**: A load-bearing-field carve-out — `verified_by`, `failed-attempt`, `supersedes`, and `by`/`at` provenance are compaction-exempt; a RED test fails if any is dropped. _(ROUND 6 (22-07) EXECUTED 2026-06-19 — **awaiting phase verification**. The 5th distinct bypass (MULTI-NOTE THREAD FILE — a §14-gate-verified finding / required failed-attempt buried as note #2+ in one threads/<agent>.md was read only at the first fence and dropped at exit 0) is closed READ-PATH-ONLY: a shared body-consuming `splitNotes()` (boundary = column-0 `---` + an `id:` line, a strict subset of parseNote's recognized lines so a carved note == a parsed note, no drift; a body `---` / embedded `---key:value---` block is NOT a boundary) + per-note `readNoteDir` keyed `<file>#<n>` (both round-5 gates + byte-equal/required-survival run PER NOTE) + `trailingMalformed`→`NoteDirResult.unparseable` fail-closed (WR-01). IN-01 closed: `noteId` exported from context-io.ts and reused by composeThreadNote (no inline id formula). RED→GREEN proven vs the COMMITTED scripts/compactor.js — 22-07-RED-baseline.txt exit 0 "carve-out intact" → 22-07-GREEN-proof.txt exit 1 naming the dropped id; `npm run freshness` exit 0; full non-e2e suite 409 passed/1 skipped; 14 new held-out tests (5 multi-note RED-first + 9 splitNotes unit incl. body-byte round-trip + body-`---` + shared-grammar). Write representation + readContext UNCHANGED; WR-02/WR-03/broader-IN-02 DEFERRED. Earlier rounds: 22-05 oracle unification (CR-01-r4 + CR-03), 22-06 round-5 line-shape gates. See 22-07-SUMMARY.md. Green suite ≠ proof — closure rests on the RED→GREEN evidence against the committed .js, pending the round-6 verifier.)_
- [x] **CMP-03**: A `context.compaction: aggressive|balanced|retain-raw` dial (lean default `aggressive`); compacted output is re-verified before write; Workflow 18 (`18-context-compaction.md`) is the single-source protocol.

### PAR — Parallel Execution & Orchestrator-as-Decomposer

- [x] **PAR-01**: The Orchestrator is redefined from sole router to decomposer/scheduler/gate — it decomposes work into queued subtasks, holds `Agent(<allowlist>)`, holds the human merge/deploy gate, and does **not** relay data (the blackboard control component).
- [x] **PAR-02**: Parallel role-agent execution on Claude Code via nested sub-agent spawning (v2.1.172 floor; agents may themselves decompose, depth ≤5) + Workflow 17 (`17-task-claim.md`).
- [x] **PAR-03**: A degraded sequential path for the four non-spawning CLIs — concurrency-1 over the *same* substrate via the rewired `_role-switch-protocol.md` step-4; one substrate, two execution modes that converge on identical on-disk artifacts.
- [x] **PAR-04**: `guard_wr05` inverted — from "no role grants `Agent`" to "only the coordinator grants `Agent(<allowlist>)`"; flips atomically with the packaging templates + the docs catalog.

### MIGR — Clean Handoff Removal & Traceability Migration

- [ ] **MIGR-01**: Rewire all 18 roles + 16 workflows + 3 packaging templates + AGENTS.md off static handoffs onto the context substrate (substrate-first, before any deletion). _(Plan 24-01 done: 18 roles + 3 packaging + AGENTS.md; the 16-workflow half remains in Plan 24-02.)_
- [ ] **MIGR-02**: Delete all 17 handoff templates + the `plans/handoffs/` seed; update `validate-agent-factory.ts` + `generate-catalog.ts` in the *same* grep-to-zero change.
- [ ] **MIGR-03**: Migrate the requirement→code→test→release traceability onto note `refs`/trace fields — the trail is preserved, never dropped.
- [ ] **MIGR-04**: `install.ts --migrate` renames user `plans/handoffs/` state to a timestamped backup (never delete-first); rollback is `git revert`.

### GOV — Governance-on-a-Dial

- [ ] **GOV-01**: `context.human_admission: off|high-severity|all` — the agent proposes a verified note; a named human disposes high-severity (security / architecture / release) entries; mirrors the prod-deploy hook extended to memory.
- [ ] **GOV-02**: `context.audit_retention: git|retained` — all three config files updated in lockstep; lean defaults preserved; the un-dialable safety floor (verify-before-write, no-fabrication, test-integrity, humans-hold-merge/deploy) is unchanged.

### DOGF — Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement

- [ ] **DOGF-01**: A dual-path equivalence oracle in `check-uat-oracles.ts` (replacing the `oracleParity` A3 check) — the same seeded task run (a) parallel on Claude Code and (b) sequential via single-window role-load; assert ON-DISK context + verdict equivalence (same admitted findings, same gate result, same artifact).
- [ ] **DOGF-02**: A parallel N-agent dogfood — N distinct un-clobbered notes, each task claimed exactly once, a stale claim reclaimed (extends the Tier-2 headless E2E harness). Confirms `isolation: worktree` ↔ shared-context-path interaction.
- [ ] **DOGF-03**: Aggregate token-cost measurement so the ~50% cost claim is *demonstrated* or honestly marked `UNKNOWN - verify`; A3/DOG-02 is retired **only** when the oracle passes.

## v2.x Requirements

Deferred to a future release. Tracked, not in this roadmap.

### Future

- **GOV-03**: Human-gated high-severity admission promoted to default-on (validate routine verify-then-write first).
- **CLAIM-04**: Dependency-aware queue ordering (`[deps:...]`) — once the flat queue is proven non-colliding.
- **CMP-04**: Compaction tuning knobs beyond the three-value dial — once the default is validated.
- **PAR-05**: Advisory file leases (the `mcp_agent_mail` pattern) — only if naive `mkdir`/rename claim races under true parallel spawn (DOGF decides).
- **Carry-ins from v1.2** (unrelated to decentralization, schedule opportunistically): per-repo kit-version pin + skew warning (SKEW-01), doctor `--fix` (FIX-01), plugin-form path resolution / publish as a CC plugin (PLUGIN-01).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Central message bus / agent-to-agent chat relay | Recreates the exact bottleneck DeLM removes; coordination is through the shared context only (stigmergy, not chatter). |
| Hosted platform, database, queue daemon, or custom runtime | The boundary is unchanged — grugops is a file-and-prompt kit; the host coding agent is the runtime. |
| Autonomous merge to protected branches / auto-deploy to production | Humans decide, agents execute — enforced mechanically by the unchanged prod-deploy hook. |
| Claiming DeLM's benchmark numbers (+10.5pp / ~50%) as grugops's own | No fabrication; grugops's own gain is measured in DOGF or marked `UNKNOWN - verify`. |
| Strict 5-tool capability parity | Retired by decision — the four non-Claude-Code CLIs degrade to sequential over the same context; they never break, but they are not equal. |
| New runtime dependencies on host machines | Decentralization is built on `node:fs` + markdown + the Claude Code `Agent` tool; the committed-`.js` zero-runtime-dep model is preserved. |

## Traceability

Which phases cover which requirements. Confirmed during roadmap creation (2026-06-16) — every v2.0 requirement maps to exactly one phase (20–26); no orphans, no duplicates.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCTX-01 | Phase 20 | Complete |
| SCTX-02 | Phase 20 | Complete |
| SCTX-03 | Phase 20 | Complete |
| SCTX-04 | Phase 20 | Complete |
| SCTX-05 | Phase 20 | Complete |
| CLAIM-01 | Phase 20 | Complete |
| CLAIM-02 | Phase 20 | Complete |
| CLAIM-03 | Phase 23 | Complete |
| VFY-01 | Phase 21 | Complete |
| VFY-02 | Phase 21 | Complete |
| VFY-03 | Phase 21 | Complete |
| VFY-04 | Phase 21 | Complete |
| CMP-01 | Phase 22 | Complete |
| CMP-02 | Phase 22 | Complete |
| CMP-03 | Phase 22 | Complete |
| PAR-01 | Phase 23 | Complete |
| PAR-02 | Phase 23 | Complete |
| PAR-03 | Phase 23 | Complete |
| PAR-04 | Phase 23 | Complete |
| MIGR-01 | Phase 24 | In Progress (24-01 done; 24-02 owes the 16-workflow half) |
| MIGR-02 | Phase 24 | Pending |
| MIGR-03 | Phase 24 | Pending |
| MIGR-04 | Phase 24 | Pending |
| GOV-01 | Phase 25 | Pending |
| GOV-02 | Phase 25 | Pending |
| DOGF-01 | Phase 26 | Pending |
| DOGF-02 | Phase 26 | Pending |
| DOGF-03 | Phase 26 | Pending |

**Coverage:**

- v2.0 requirements: 28 total
- Mapped to phases: 28 (confirmed by roadmapper — proposed mapping verified against SUMMARY.md per-phase "Delivers" with no correction needed)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-16*
*Last updated: 2026-06-16 — traceability confirmed at roadmap creation (28/28 mapped to Phases 20–26, 0 unmapped)*
