# Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning (research-first — see `<canonical_refs>` and the research flag below)

<domain>
## Phase Boundary

The **last v2.0 phase.** Turn three v2.0 claims from prose into mechanical proof, then retire the long-deferred A3/DOG-02 dual-path UAT:

- **DOGF-01** — a dual-path **equivalence oracle** (replacing the structural-grep `oracleParity` A3 check in `scripts/check-uat-oracles.ts`) that asserts the parallel-on-CC path and the sequential single-window role-load path produce **equivalent on-disk state** (same admitted findings, same gate verdict, same artifact).
- **DOGF-02** — a parallel **N-agent dogfood**: N distinct un-clobbered notes, each task claimed exactly once, a stale claim reclaimed — specifically exercising the `isolation: worktree` ↔ shared-context-path interaction (the flagged v2.0 UNKNOWN).
- **DOGF-03** — an **aggregate token-cost measurement** so grugops's own ~50% cost story is either demonstrated with grugops's own numbers or honestly marked `UNKNOWN - verify`.
- **Retirement** — A3/DOG-02 is flipped to retired **only** when the equivalence oracle passes (never on handoff deletion alone).

**Out of scope (new capabilities → their own phase / v2.x):** pid/host claim liveness (deferred to v2.x PAR-05); any new role/workflow; re-testing §14-gate admission logic or guard logic already covered elsewhere; changing the substrate write path, schema, or `claim.ts`/`context-io.ts` behavior (this phase *exercises and measures*, it does not re-architect).
</domain>

<decisions>
## Implementation Decisions

The four discussed forks are all **locked** to the recommended option. Cross-cutting honesty principles follow.

### Area ① — The retirement bar (the honesty crux)
- **D-01:** A3/DOG-02 flips to **retired only when BOTH** (a) the deterministic on-disk equivalence oracle is green **AND** (b) **one captured live dual-path run** exists as recorded evidence (an authed CI/Tier-2 run, OR a one-time human run via `docs/dogfood-human-runbook.md`). Rationale: the deterministic oracle proves the *substrate converges on disk* — real and new — but it drives the *same committed code two ways*, so it does **not** exercise real dual *dispatch* (sequential AGENTS.md role-load vs CC sub-agent spawn), which is exactly what DOG-02 was about. Retiring on the deterministic oracle alone would soft-over-claim the CC-native column, which today still legitimately reads `pending human`.
- **D-02:** The **deterministic equivalence oracle is the always-on CI gate** (Tier-1, no LLM, green-without-a-key). Until the live capture (b) exists, DOG-02 stays **pending** and the live path **loud-skips** (a skip is never a pass — the existing Tier-2 honesty keystone). This means phase *completion* (the actual retired flip) carries a dependency on one authed-or-human captured run; the planner must surface that dependency, not hide it.

### Area ② — Seeded fixture & equivalence definition
- **D-03:** The seeded task's §14-gate verdict is a **frozen synthetic stamp** baked into the fixture (`verified_by: §14-gate#<fixed-id>` + a frozen verdict string), **not** a real in-process gate/`emitVerdict` invocation. Rationale: the oracle proves both paths admit the **same** finding + verdict on disk; gate/admission LOGIC is tested elsewhere (`oracleHooksWiring` scopes to wiring only; admission has its own suites). Keep the Tier-1 lane deterministic and tightly scoped.
- **D-04:** Equivalence is asserted via `context-io` **`currentState()`** canonical projection (sort by `at` then id, fold superseded) — the existing file-position-independent replay used by `convergence-spine.test.ts`. The seeded decomposition must include **≥1 admitted `finding` carrying the frozen stamp** (stronger than convergence-spine's soft-only observation/decision notes), plus the frozen gate verdict.
- **D-05:** "The same **artifact**" = the **on-disk admitted-note set + the verdict string**, **not** byte-identical generated code/prose (live LLM output is not byte-deterministic — that's *why* the gating bar is deterministic and the live run is confirmation only).

### Area ③ — N-agent dogfood realism & the worktree crux
- **D-06:** The DOGF-02 **gating** test uses **real git worktrees**: N `node` processes, each `cwd`'d into its own real git worktree, **all pinned to ONE shared absolute `contextRoot`** (and one shared queue root). This actually exercises the named UNKNOWN — *does a worktree-local `.grugops/` shadow the shared one?* — while staying fully deterministic and token-free.
- **D-07 (the crux finding to confirm & document):** `context-io`'s `DEFAULT_CONTEXT_ROOT` resolves **script-relative** (`<repo>/.grugops/context` via `import.meta.dirname`). In a git worktree that default is **worktree-LOCAL**, so agents would NOT see each other's notes unless `contextRoot` is **explicitly overridden to a single shared absolute path** outside the worktrees. Design conclusion to prove: the **queue + shared context live outside the worktrees; only the code edits are isolated.** Research must confirm the exact override mechanism and that atomic `claim` (mkdirSync) + un-clobbered `appendNote` hold cross-worktree.
- **D-08:** The substrate primitives are **already in place** — reuse, don't rebuild: `claim.claimTask`/`transition` (atomic), `claim.sweepStale(ttlMs)` (explicitly tagged the *DOGF-02 seed*; wall-clock TTL, caller-supplied, returns reclaimed task names, conservative no-op path), `context-io.appendNote`/`readContext`/`currentState`. The N-agent count and width honor `queue.wip_limit` (currently `3` in `agent-factory/config/factory.config.json`).
- **D-09:** A **live N-agent claude spawn** dogfood is **Tier-2 confirmation only** (gated, loud-skip), not the gating proof.

### Area ④ — Cost measurement honesty & retirement mechanics
- **D-10:** Build the **token-cost measurement harness** (parse aggregate usage from `claude --output-format json`), but **default to `UNKNOWN - verify`** whenever no authed run is available. **Never fabricate; never assert DeLM's +10.5pp / ~50% benchmark numbers as grugops's.** A real grugops number fills in later from an authed run, with explicit caveats.
- **D-11:** **Cost does NOT gate retirement.** SC4 gates the retired flip on the **equivalence oracle** (+ D-01's captured live run), not on the cost figure. DOGF-03 is a parallel measurement deliverable.
- **D-12:** Retirement mechanics follow Phase-24 discipline: **replace** the `oracleParity` function with the real equivalence oracle (do not bare-delete), update its **importer/aggregator** (`scripts/check-foundation-guards.ts` imports + invokes `oracleParity`) in the **same change**, flip DOG-02/A3 to *resolved* in the tracking docs **only after** the oracle is green + the live capture exists, and **preserve the requirement→trace** — never assert against deleted artifacts (the current oracle already stopped naming the Phase-24-deleted handoff filenames).

### Claude's Discretion
- Exact seeded decomposition shape (task count, note kinds/bodies) — keep it minimal but include the stamped finding (D-04); model on `convergence-spine.test.ts`'s fixture.
- Whether DOGF-01's oracle is a new exported function in `check-uat-oracles.ts` that internally reuses `convergence-spine`'s replay logic, or a shared helper both import — planner/researcher to choose the cleanest single-source factoring.
- TTL value used to demonstrate `sweepStale` reclaim in the dogfood (generous, deterministic).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition & requirements
- `.planning/ROADMAP.md` — Phase 26 goal + the four Success Criteria (SC1–SC4) and the v2.0 honesty floor.
- `.planning/REQUIREMENTS.md` — DOGF-01 / DOGF-02 / DOGF-03 (lines ~71–73).
- `.planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/` — where A3/DOG-02 (UAT-AUTO-03) was originally deferred/waived; the Tier-1+Tier-2 architecture's origin.

### The oracle to replace + its harness pattern (Tier-1, deterministic)
- `scripts/check-uat-oracles.ts` — the current structural-grep `oracleParity` (A3, ~line 329) to **replace**; the pass/fail/warn harness pattern, the `CHECK_ROOT` override, the standalone-vs-import entry guard, the exported `uatOracleFails()`. Committed twin: `scripts/check-uat-oracles.js`. Tests: `scripts/check-uat-oracles.test.ts`.
- `scripts/check-foundation-guards.ts` — the **aggregator** that imports + invokes `oracleParity` (lines ~62, ~643); must be updated in lockstep when the oracle is replaced. Committed twin: `scripts/check-foundation-guards.js`.

### The existing dual-path equivalence logic to promote/reuse
- `scripts/convergence-spine.test.ts` — Phase 23's SC3/D-04 deterministic dual-path on-disk equivalence oracle (parallel-spawn sim vs sequential drain, compared via `currentState()`). This is the logic DOGF-01 promotes into a real Tier-1 oracle. Hermetic, never in the e2e lane.

### Tier-2 live harness to extend (DOGF-02 live confirmation, A3-live)
- `scripts/e2e/uat-live.test.ts` — the gated headless `claude --print` harness: the `claudePresentAndAuthed()` probe, the `emitLoudSkipIfUnavailable()` single skip-decision point, the **exported `LOUD_SKIP_MARKER`**, the existing **A3-live (DOG-02)** dual-dispatch case to extend for the N-agent dogfood, and the never-set-`GRUGOPS_PROD_DEPLOY_APPROVED` safety rule.
- `docs/dogfood-human-runbook.md` — the human-run path that can satisfy D-01's "captured live run."

### The substrate primitives (reuse — already built)
- `scripts/claim.ts` — `claimTask` (atomic mkdirSync), `transition` (pending→claimed→done rename), **`sweepStale(ttlMs)`** (the explicit *DOGF-02 seed*; wall-clock TTL reclaim, returns reclaimed names; NO pid/host liveness — that's v2.x PAR-05). Committed twin: `scripts/claim.js`.
- `scripts/context-io.ts` — `appendNote`, `readContext`, `currentState`, and **`DEFAULT_CONTEXT_ROOT`** (the script-relative default — the D-07 worktree-shadowing crux). Committed twin: `scripts/context-io.js`.
- `agent-factory/config/factory.config.json` — `queue.wip_limit` (=3) and `wip_limits`; the concurrency width for the N-agent dogfood.

### Retirement-mechanics target
- `examples/03-ticket-to-pr.md` — carries the DOG-02 dual-path parity table (`Sequential AGENTS.md path` / `CC-native sub-agent path` columns, frozen `READY_FOR_HUMAN_REVIEW` verdict) that the current `oracleParity` reads and the new oracle/retirement supersedes.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`convergence-spine.test.ts` replay logic** — `makeSubstrate` / `doWork` / `canonical` (via `currentState()`) is the deterministic dual-path equivalence engine; DOGF-01 promotes a stamped-finding variant of it into `check-uat-oracles.ts`.
- **`claim.sweepStale(ttlMs)`** — already the DOGF-02 seed; the dogfood exercises it for the stale-reclaim property (no new reclaim code).
- **Tier-2 honesty scaffolding** — `claudePresentAndAuthed` / `emitLoudSkipIfUnavailable` / `LOUD_SKIP_MARKER` / the `it.skipIf(!LIVE)` pattern; the N-agent live dogfood extends this rather than inventing a new gating model.
- **`check-uat-oracles.ts` harness** — `pass`/`fail`/`warn`, `CHECK_ROOT` mirror override, `uatOracleFails()` export, standalone-entry guard; the new oracle slots into this contract.

### Established Patterns
- **Tier-1 (deterministic, no-LLM, CI-green) vs Tier-2 (gated live, loud-skip)** is the load-bearing split — DOGF-01 is Tier-1 (gates retirement); the live dual-path + N-agent + cost-from-real-run are Tier-2/loud-skip.
- **Committed `.ts` → `.js` twin + freshness gate** — every script change rebuilds the committed `.js`; `npm run freshness` must stay exit 0.
- **No-fabrication / refuse-self-set** — never flip a UAT from a skip; never set the approval env; never quote external benchmark numbers as grugops's.
- **`currentState()` canonical replay** — the file-order-independent equivalence comparator across the codebase.

### Integration Points
- New oracle replaces `oracleParity` **and** updates its importer `check-foundation-guards.ts` in one change (single-source aggregator fail signal).
- Shared context root override is the integration seam for the worktree dogfood (D-07): callers pass an absolute `contextRoot`/queue root; the default is worktree-local and must not be relied on across worktrees.
- Regression run is `npx vitest run --exclude '**/scripts/e2e/**'` (or `npm test` minus the e2e lane); the live lane is `npm run test:e2e` — note (project memory) that bare `npm test` triggers the live claude-CLI e2e lane.
</code_context>

<specifics>
## Specific Ideas

- The retirement flip is the *only* part of this phase that carries a live-run dependency (D-01/D-02). Everything else — the deterministic oracle, the real-worktree N-process dogfood, the cost harness — lands green/loud-skip **without** an authed run. The planner should structure the phase so the deterministic/mechanical deliverables complete independently, and the retired flip is a final, evidence-gated step.
- Model the seeded fixture and worktree dogfood on the existing hermetic-temp-dir + committed-`.js`-driven style (`convergence-spine.test.ts`, the e2e harness) — drive the committed `.js`, never the `.ts`.
</specifics>

<deferred>
## Deferred Ideas

- **pid/host claim liveness** — explicitly out (v2.x PAR-05); `sweepStale` stays wall-clock-TTL only.
- **A grugops-measured cost ratio as a hard phase deliverable** — deferred to a later authed run; this phase ships the harness + honest `UNKNOWN - verify` (D-10/D-11).
- **Re-testing §14-gate admission/guard logic** — out of scope; covered by existing suites; the oracle uses a frozen synthetic stamp (D-03).

None other — discussion stayed within phase scope.
</deferred>

---

*Phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement*
*Context gathered: 2026-06-29*
