# Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement - Research

**Researched:** 2026-07-01
**Domain:** Deterministic dual-path equivalence oracle + real-worktree N-agent dogfood + honest token-cost harness, on the existing v2.0 substrate (TypeScript tooling → committed `.js` twins). This phase EXERCISES and MEASURES; it does not re-architect.
**Confidence:** HIGH on the code seams (every claim read from source this session); LOW / `UNKNOWN - verify` on the `claude --output-format json` token-usage field schema (deliberately not fabricated).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** A3/DOG-02 flips to **retired only when BOTH** (a) the deterministic on-disk equivalence oracle is green **AND** (b) **one captured live dual-path run** exists (an authed CI/Tier-2 run OR a one-time human run via `docs/dogfood-human-runbook.md`). The deterministic oracle drives the *same committed code two ways* — it does NOT exercise real dual *dispatch*, so it cannot alone retire the CC-native column (which legitimately reads `pending human`).
- **D-02:** The **deterministic equivalence oracle is the always-on CI gate** (Tier-1, no LLM, green-without-a-key). Until the live capture exists, DOG-02 stays **pending** and the live path **loud-skips** (a skip is never a pass). Phase *completion* (the retired flip) carries a dependency on one authed-or-human captured run; the planner must surface that dependency, not hide it.
- **D-03:** The seeded §14-gate verdict is a **frozen synthetic stamp** baked into the fixture (`verified_by: §14-gate#<fixed-id>` + a frozen verdict string), **not** a real in-process gate/`emitVerdict` invocation. Gate/admission LOGIC is tested elsewhere. Keep the Tier-1 lane deterministic and tightly scoped.
- **D-04:** Equivalence is asserted via `context-io` **`currentState()`** canonical projection (sort by `at` then id, fold superseded). The seeded decomposition must include **≥1 admitted `finding` carrying the frozen stamp** plus the frozen gate verdict.
- **D-05:** "The same **artifact**" = the **on-disk admitted-note set + the verdict string**, NOT byte-identical generated code/prose.
- **D-06:** The DOGF-02 **gating** test uses **real git worktrees**: N `node` processes, each `cwd`'d into its own real worktree, **all pinned to ONE shared absolute `contextRoot`** (and one shared queue root).
- **D-07 (crux to confirm):** `context-io`'s `DEFAULT_CONTEXT_ROOT` resolves **script-relative** (`import.meta.dirname`). In a worktree that default is **worktree-LOCAL**, so agents would NOT see each other's notes unless `contextRoot` is explicitly overridden to a single shared absolute path outside the worktrees. Queue + shared context live OUTSIDE the worktrees; only code edits are isolated.
- **D-08:** Substrate primitives are already in place — reuse, don't rebuild: `claim.claimTask`/`transition` (atomic), `claim.sweepStale(ttlMs)` (the DOGF-02 seed), `context-io.appendNote`/`readContext`/`currentState`. N-agent width honors `queue.wip_limit` (=3).
- **D-09:** A **live N-agent claude spawn** dogfood is **Tier-2 confirmation only** (gated, loud-skip), not the gating proof.
- **D-10:** Build the token-cost harness (parse aggregate usage from `claude --output-format json`), **default to `UNKNOWN - verify`** when no authed run. Never fabricate; never assert DeLM's +10.5pp / ~50% as grugops's.
- **D-11:** **Cost does NOT gate retirement.** SC4 gates the retired flip on the equivalence oracle + D-01's captured live run, not on the cost figure.
- **D-12:** Retirement mechanics follow Phase-24 discipline: **replace** `oracleParity` with the real equivalence oracle (do not bare-delete), update its importer/aggregator (`check-foundation-guards.ts`) in the **same change**, flip DOG-02/A3 to *resolved* in tracking docs **only after** the oracle is green + the live capture exists, and **preserve the requirement→trace** — never assert against deleted artifacts.

### Claude's Discretion
- Exact seeded decomposition shape (task count, note kinds/bodies) — minimal but include the stamped finding (D-04); model on `convergence-spine.test.ts`.
- Whether DOGF-01's oracle is a new exported function in `check-uat-oracles.ts` that reuses `convergence-spine`'s replay logic, or a shared helper both import.
- TTL value used to demonstrate `sweepStale` reclaim (generous, deterministic).

### Deferred Ideas (OUT OF SCOPE)
- **pid/host claim liveness** — v2.x PAR-05; `sweepStale` stays wall-clock-TTL only.
- **A grugops-measured cost ratio as a hard deliverable** — deferred to a later authed run; ship the harness + honest `UNKNOWN - verify` (D-10/D-11).
- **Re-testing §14-gate admission/guard logic** — covered by existing suites; the oracle uses a frozen synthetic stamp (D-03).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOGF-01 | Dual-path equivalence oracle in `check-uat-oracles.ts` (replacing `oracleParity`) — same seeded task run (a) parallel-on-CC-sim and (b) sequential; assert ON-DISK context + verdict equivalence. | Q2 (exact `oracleParity` seam + aggregator edit sites), Q3 (`convergence-spine` replay engine to promote), Q4 (seeded fixture + frozen stamp). |
| DOGF-02 | Parallel N-agent dogfood — N distinct un-clobbered notes, each task claimed once, a stale claim reclaimed; confirms `isolation: worktree` ↔ shared-context-path. | Q1 (`contextRoot` shadowing crux + exact override seam + cross-process atomicity), Q6 (Tier-2 live extension). |
| DOGF-03 | Aggregate token-cost measurement — demonstrated with grugops numbers or honestly `UNKNOWN - verify`. | Q5 (harness design; field schema `UNKNOWN - verify`). |
| DOG-02 retirement | A3/DOG-02 retired ONLY when the oracle passes (+ D-01 captured live run). | Q7 (retirement mechanics, every tracking site, deleted-artifact hazard). |
</phase_requirements>

## Summary

Everything the phase needs already exists and is verified working; the job is to *wire three proofs* and *retire one waiver* without touching the substrate. The single deterministic gating deliverable (DOGF-01) is a straight promotion of the logic already living in `scripts/convergence-spine.test.ts` — its `makeSubstrate`/`doWork`/`canonical(currentState())` engine — into a new exported oracle in `scripts/check-uat-oracles.ts` that **replaces** `oracleParity` (line 329) and is updated in lockstep at its two aggregator call sites in `scripts/check-foundation-guards.ts` (import line 62, invoke line 643). The N-agent worktree dogfood (DOGF-02) reuses `claim.claimTask`/`transition`/`sweepStale` and `context-io.appendNote`/`currentState` unchanged; the one design fact to encode everywhere is that `DEFAULT_CONTEXT_ROOT`/`DEFAULT_QUEUE_ROOT` are **script-relative** (`import.meta.dirname`), so every call must pass an explicit shared absolute root or worktrees silently diverge. The cost harness (DOGF-03) is a parse-and-record shell over `claude --output-format json`, defaulting to `UNKNOWN - verify`.

**Primary recommendation:** Extract the `currentState()`-projection comparator from `convergence-spine.test.ts` into a small shared helper (e.g. `scripts/dual-path-equivalence.ts`) that BOTH the existing test and the new Tier-1 oracle import; seed the fixture with a `finding` carrying a literal `verified_by: §14-gate#<fixed-id>` stamp and a frozen `READY_FOR_HUMAN_REVIEW` string (no `emitVerdict`, no `admit()` — D-03); do the `oracleParity`-replace + `check-foundation-guards.ts` importer update in ONE commit; rebuild the committed `.js` twins and keep `npm run freshness` at exit 0; and structure the phase so every mechanical deliverable lands green/loud-skip **without** an authed run, with the retired-flip as a final evidence-gated step (D-01/D-02).

## Loud Flags — code contradicts / complicates a CONTEXT.md assumption

1. **`emitVerdict` is the ONLY sanctioned writer of a `by: §14-gate` verdict note — and D-03 forbids invoking it.** `validate()` (context-io.ts:614) rejects ANY note authored `by: §14-gate` as impersonation unless `trustedGateEmission=true`, which only `emitVerdict()` (context-io.ts:881) sets. So the fixture **cannot** `appendNote` a real gate-authored verdict note, and D-03 explicitly says "not a real … `emitVerdict` invocation." **Resolution (recommended, see Q4):** the "frozen gate verdict" is NOT a `by: §14-gate`-authored note. It is (a) the frozen `verified_by: §14-gate#<fixed-id>` stamp on the admitted `finding` (which passes `appendNote`→`validate()` structurally because `GATE_STAMP_RE` matches — no verdict note and no `admit()` call are required), plus (b) the frozen verdict STRING `READY_FOR_HUMAN_REVIEW` asserted as a fixture constant in the equivalence comparison. Do **not** call `admit()` (it would demand a live green verdict note under the task, re-testing admission logic — out of scope per D-03). This keeps the Tier-1 lane deterministic, key-free, and scoped exactly as D-03/D-04 intend. The planner must state this explicitly in the plan so an executor does not reach for `emitVerdict`/`admit`.

2. **The Tier-2 `A3-live` test STILL names the Phase-24-DELETED handoff filenames.** CONTEXT D-12 says "the current oracle already stopped naming the Phase-24-deleted handoff filenames" — true for the **Tier-1** `oracleParity` (it dropped them, see check-uat-oracles.ts:318-323, 351-353), but **NOT** for the **Tier-2** `A3-live` case: `scripts/e2e/uat-live.test.ts:325` sets `FROZEN_HANDOFFS = ["implementation-handoff.md", "qe-handoff.md"]` and asserts both dispatch paths emit them (lines 346-359). The **human runbook** (`docs/dogfood-human-runbook.md` Check 3 step 2, lines 151-152 and Step 4, lines 174-177) and the **parity table** in `examples/03-ticket-to-pr.md` (lines 55, 79-84, 174) also still name `agent-factory/handoffs/…`. Under MIGR-02 those templates were deleted. **Any extension of A3-live for the N-agent live dogfood, and the retirement flip, MUST retarget the equivalence assertion onto on-disk note-set + verdict-string equivalence (D-05), never onto the deleted handoff filenames (Pitfall 5).** This is a real inconsistency to fix as part of the retirement, not to preserve.

3. **`currentState()` sorts by `at` then `id`, and `id` carries a random nonce** (`noteId`, context-io.ts:752-756: `randomUUID().slice(0,8)`). Two independent runs of the same seeded task produce notes with DIFFERENT ids. The equivalence comparator MUST project away `id` (as `convergence-spine.test.ts:121-123` does: it maps to `{kind, at, body}` and sorts by `at` then `body`). For findings, extend the projection to `{kind, at, verified_by, confidence, refs, body}` — everything EXCEPT the nonce-bearing `id`. Do not compare `id`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deterministic on-disk equivalence gate (DOGF-01) | TS tooling layer → committed `.js` (`check-uat-oracles.ts` + a shared comparator helper) | Aggregator (`check-foundation-guards.ts`) folds the fail signal | Tier-1, no-LLM, CI-green; must run with bare Node and be freshness-gated like every script. |
| N-agent worktree dogfood (DOGF-02 gating) | Vitest hermetic test driving committed `claim.js` + `context-io.js` across real `git worktree`s | Tier-2 live `claude` spawn (D-09) | Deterministic, token-free; real worktrees exercise the shadowing UNKNOWN without an LLM. |
| Token-cost measurement (DOGF-03) | TS harness parsing `claude --output-format json` | — | Measurement-only; defaults to `UNKNOWN - verify`; never gates. |
| Live dual dispatch confirmation (D-01 evidence) | Tier-2 `uat-live.test.ts` (authed) OR human runbook | — | Only a real authed/human run exercises real dispatch; loud-skip otherwise. |
| Retirement flip (SC4) | Markdown tracking docs (STATE/REQUIREMENTS/examples) | — | Doc-only, gated on oracle-green + captured live run; trace preserved. |

## Standard Stack

No new packages. This phase adds **zero** dependencies — it is `node:fs`/`node:path`/`node:child_process` + Vitest (already a devDependency) + the committed `.js` tooling twins, plus the host `git` and (Tier-2 only) `claude` CLIs.

### Core (all already present — verified this session)
| Component | Version / Location | Purpose | Why Standard |
|-----------|--------------------|---------|--------------|
| Node.js | v24.12.0 present; `engines.node >=22` (package.json:6) | Runs committed `.js` twins with bare Node | The project runtime; zero host deps. `import.meta.dirname` (used by both defaults) needs Node ≥20.11 — satisfied. |
| Vitest | `~4.1.8` (package.json:23); confirmed `vitest/4.1.8` | Hermetic test harness for the oracle + worktree dogfood | The repo's only test runner; `globals:false` so import test fns explicitly. |
| TypeScript | `~6.0.3` (package.json:22) | Authors `.ts`, `tsc`-compiles to committed `.js` | The D-13 tooling-layer contract. |
| `git` | 2.54.0; `git worktree` present | Real worktrees for the D-06 dogfood | Native; no dependency. |
| `claude` CLI | 2.1.197 present + authed (this box) | Tier-2 live lane only (D-09) — loud-skips when absent/unauthed | dev/CI-only, NEVER a host runtime dep. |

### Supporting — the exact reuse targets (do not rebuild)
| Symbol | File:line | Signature | Use |
|--------|-----------|-----------|-----|
| `appendNote` | context-io.ts:761 | `(task, note: NoteInput, body, contextRoot=DEFAULT_CONTEXT_ROOT, precomputedId?) => id` | Seed notes; write dogfood notes. Pass explicit `contextRoot`. |
| `readContext` | context-io.ts:803 | `(task, contextRoot=DEFAULT_CONTEXT_ROOT) => NoteRecord[]` | Read notes for equivalence. |
| `currentState` | context-io.ts:838 | `(notes: NoteRecord[]) => NoteRecord[]` (pure; sort by `at` then `id`, fold `supersedes`) | The canonical equivalence projection (D-04). |
| `validate` | context-io.ts:548 | `(text, trustedGateEmission=false) => string[]` | Structural check `appendNote` runs internally; a finding with `§14-gate#<id>` passes without a live gate. |
| `claimTask` | claim.ts:106 | `(queueRoot, task, by) => boolean` (atomic `mkdirSync`; EEXIST→false) | Each dogfood task claimed exactly once. |
| `transition` | claim.ts:143 | `(queueRoot, task, from, to) => void` (atomic rename) | pending→claimed→done. |
| `sweepStale` | claim.ts:178 | `(queueRoot, ttlMs, now=Date.now()) => string[]` (reclaimed task names; wall-clock TTL only) | The stale-claim reclaim property; `now` injectable for determinism. |
| `emitVerdict` | context-io.ts:881 | `(task, id, contextRoot=…, at=…) => id` | The ONLY `by: §14-gate` writer — **do NOT use in the fixture (D-03).** Documented so the planner knows why not. |
| `admit` | context-io.ts:966 | `(task, text, contextRoot=…, repoRoot=ROOT) => string[]` | Context-aware admission cross-check — **NOT called by the oracle (D-03).** |

**Installation:** none. `npm ci` already provides Vitest + TypeScript; no `npm install <pkg>` in this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** All code uses Node stdlib (`node:fs`, `node:path`, `node:child_process`, `node:crypto`, `node:os`, `node:url`) plus the existing dev-only devDependencies (`typescript`, `vitest`, `@types/node`), which were vetted in prior phases. No `SLOP`/`SUS` risk introduced. (Package Legitimacy Gate: no candidates to check.)

## Architecture Patterns

### System data-flow (DOGF-01 deterministic oracle)

```
                    seeded decomposition (fixture: task list + note-inputs incl. 1 stamped finding)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼ Mode A (parallel-spawn sim)              ▼ Mode B (sequential drain)
   claim all up to width → doWork (fan-out order)   claim one → doWork → done, repeat
   → transition all to done                         (strict serial)
              │                                          │
     writes notes/<id>.md under                 writes notes/<id>.md under
     SHARED-STYLE per-mode contextRoot A         per-mode contextRoot B
              │                                          │
              └──────────────► currentState(readContext(task, root)) ◄────────┘
                               projected to {kind,at,verified_by,confidence,refs,body}  (id dropped)
                                              │
                          assertEqual(canonA, canonB)  +  assert verdict string frozen
                                              │
                    exported oracle → increments shared FAILS in check-uat-oracles.ts
                                              │
                    check-foundation-guards.ts invokes it + folds uatOracleFails() → exit 0/1
```

### DOGF-02 N-agent worktree dogfood (deterministic, token-free)

```
ONE shared absolute queueRoot  (outside all worktrees)  ─┐
ONE shared absolute contextRoot (outside all worktrees) ─┤
                                                          │  N node child processes,
   worktree-1/  (git worktree add) ── node proc, cwd=wt1 ─┤  EACH passing the SAME
   worktree-2/                     ── node proc, cwd=wt2 ─┤  absolute roots to every
   worktree-N/ (N = wip_limit = 3) ── node proc, cwd=wtN ─┘  claim/context call
                                                          │
   each: claimTask(queueRoot,task) → transition → appendNote(task,…,contextRoot) → transition done
                                                          │
   assert: N distinct un-clobbered notes (unique <id>.md) │ each task claimed exactly once (EEXIST losers)
   then: force one stale claim (write claim.md with old `at`) → sweepStale(queueRoot, ttl, now) reclaims it
```

### Pattern: promote a test's replay engine into a shared, importable comparator (Claude's-discretion resolution)

**What:** Extract the `canonical()`/projection logic from `convergence-spine.test.ts:113-126` into `scripts/dual-path-equivalence.ts` (a committed `.ts`→`.js` helper) exporting e.g. `projectTaskState(contextRoot, task): ProjectedNote[]` and `assertEquivalent(a, b): string[]`. Both the existing test AND the new oracle import it — single-source, no drift.
**When to use:** Because the new Tier-1 oracle in `check-uat-oracles.ts` and the SC3 `convergence-spine.test.ts` must use the *same* equivalence definition; duplicating it invites drift (the exact class of bug the whole codebase guards against — cf. the IN-02 single-source parser lesson in context-io.ts).
**Example (projection that drops the nonce id, mirrors convergence-spine.test.ts:121-123):**
```typescript
// Source: scripts/convergence-spine.test.ts:113-126 (verified), generalized for findings.
function projectTaskState(contextRoot: string, task: string) {
  return ctx.currentState(ctx.readContext(task, contextRoot))
    .map(nr => ({ kind: nr.kind, at: nr.at, verified_by: nr.verified_by,
                  confidence: nr.confidence, refs: nr.refs, body: nr.body })) // NOTE: no `id`
    .sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.body.localeCompare(b.body));
}
```

### Pattern: the `check-uat-oracles.ts` oracle contract (slot the new oracle into this exact shape)

**What:** An exported `oracleXxx(): void` that calls the module-level `pass()`/`fail()`/`warn()` (check-uat-oracles.ts:53-63), reads inputs via the `CHECK_ROOT`-honoring `abs()`/`readText()` helpers (lines 44-50), and increments the shared `FAILS`. It is (a) invoked in the standalone `runAll()` (line 392) guarded by the `isEntry` check (lines 410-414), AND (b) imported + invoked by the aggregator.
**Example (the replacement seam):** replace `oracleParity` (line 329) with `oracleDualPathEquivalence()`; keep the same export-and-invoke wiring so the aggregator picks it up through the shared `FAILS`/`uatOracleFails()` (line 68).

### Anti-Patterns to Avoid
- **Calling `emitVerdict`/`admit` in the Tier-1 fixture** — re-tests admission logic, needs a live verdict note, and contradicts D-03. Use a literal frozen stamp instead.
- **Comparing `id`** in the equivalence check — the nonce guarantees a false failure. Project it away.
- **Relying on `DEFAULT_CONTEXT_ROOT`/`DEFAULT_QUEUE_ROOT` across worktrees** — script-relative defaults silently diverge (D-07). Pass explicit shared absolute roots everywhere.
- **Asserting the deleted handoff filenames** (`implementation-handoff.md`/`qe-handoff.md`) anywhere the retirement touches — assert on-disk note-set + verdict string instead (D-05, Pitfall 5).
- **Bare-deleting `oracleParity`** — replace it and update the importer in the same change (D-12, Phase-24 discipline).
- **Running `npm test` for regression** — it triggers the live e2e lane (project memory). Use the exclude form (Q8).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File-position-independent note equivalence | A custom diff/sort | `context-io.currentState()` (context-io.ts:838) | Already the canonical replay (sort by `at`+id, fold superseded); reused across the codebase. |
| Atomic exactly-once claim | A lockfile/PID scheme | `claim.claimTask` `mkdirSync` (claim.ts:106-137) | NFS-safe atomic create-or-fail; EEXIST→false is the exactly-once proof. |
| Stale-claim reclaim | New TTL/liveness code | `claim.sweepStale` (claim.ts:178) — the explicit DOGF-02 seed | Wall-clock TTL, `now` injectable, returns reclaimed names; pid/host liveness is deferred (PAR-05). |
| Un-clobbered concurrent note write | Append-to-one-file locking | `appendNote` → fresh unique `notes/<id>.md` (context-io.ts:761-800) | Each note is its own nonce-named file via temp+rename; N writers never collide. |
| Live-CLI honesty gating | A new skip mechanism | `claudePresentAndAuthed` + `emitLoudSkipIfUnavailable` + `LOUD_SKIP_MARKER` (uat-live.test.ts:74-102) | Proven loud-skip keystone; a skip is never a pass. |
| The oracle pass/fail harness | A new reporting shell | `pass`/`fail`/`warn`/`uatOracleFails`/`CHECK_ROOT` (check-uat-oracles.ts:44-68) | The Tier-1 contract the aggregator already folds. |

**Key insight:** every primitive this phase needs was purpose-built in Phases 20-23 and is verified working. The phase's risk is entirely in *wiring correctly* (the shared-root discipline, the replace-in-lockstep, the honesty of the cost number) — not in building anything.

## Runtime State Inventory

> This is a wire-and-measure phase, not a rename/refactor. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a string that changes. The ONE build-artifact concern is routine: any `.ts` edit requires rebuilding its committed `.js` twin and passing `npm run freshness` (see Q8). No data migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the oracle uses hermetic temp dirs (`mkdtempSync`), never a persistent datastore. | none |
| Live service config | None. | none |
| OS-registered state | None. | none |
| Secrets/env vars | `GRUGOPS_PROD_DEPLOY_APPROVED` must NEVER be set by any harness (uat-live.test.ts:56, 294-299). Read-only assertion of absence only. | none (do not set) |
| Build artifacts | Committed `.js` twins of any edited `.ts` (`check-uat-oracles.js`, `check-foundation-guards.js`, and a new `dual-path-equivalence.js` if added). | `npm run build` then `npm run freshness` exit 0 |

## Common Pitfalls

### Pitfall 1: worktree-local context-root shadowing (the named v2.0 UNKNOWN)
**What goes wrong:** N agents each `cwd`'d in a worktree write to *their own* `.grugops/context`, never seeing each other's notes; the dogfood passes vacuously.
**Why it happens:** `DEFAULT_CONTEXT_ROOT = join(import.meta.dirname, "..", ".grugops", "context")` (context-io.ts:82-83) and `DEFAULT_QUEUE_ROOT` (claim.ts:60-61) resolve relative to the *script file's* location. A worktree has its own checkout of `scripts/context-io.js`, so `import.meta.dirname` differs per worktree → the default is worktree-LOCAL. (Note: it is script-relative, **not** cwd-relative — a forgetful call writes to the imported script's checkout, not to `cwd`.)
**How to avoid:** pass ONE explicit absolute `contextRoot` and ONE absolute `queueRoot`, both OUTSIDE every worktree, to EVERY `appendNote`/`readContext`/`emitVerdict`/`admit`/`claimTask`/`transition`/`sweepStale` call (D-07). All N processes should import the SAME committed `context-io.js`/`claim.js` (e.g. the main checkout's) or, if importing worktree-local copies, still pass the shared roots — the roots are what matter, not which copy is imported.
**Warning signs:** the assertion "N distinct notes under one task" finds notes split across N different context roots; each worktree grows its own `.grugops/`.

### Pitfall 2: comparing the nonce-bearing `id` (false-negative equivalence)
**What goes wrong:** two runs of the same seed compare unequal.
**Why it happens:** `noteId` appends `randomUUID().slice(0,8)` (context-io.ts:754); `currentState` keeps `id` in each record.
**How to avoid:** project to `{kind, at, verified_by, confidence, refs, body}` and drop `id` (mirror convergence-spine.test.ts:121-123).
**Warning signs:** intermittent failures whose only diff is the `id` field.

### Pitfall 3: reaching for `emitVerdict`/`admit` in the Tier-1 fixture
**What goes wrong:** either a thrown "invalid note" (a hand-written `by: §14-gate` note fails `validate`) or scope-creep into admission logic + a required live verdict note.
**Why it happens:** intuition says "a gate verdict on disk needs the gate."
**How to avoid:** D-03 — the frozen synthetic stamp `verified_by: §14-gate#<fixed-id>` on the finding passes `validate` structurally (GATE_STAMP_RE, context-io.ts:648); `READY_FOR_HUMAN_REVIEW` is a fixture constant. No `emitVerdict`, no `admit`.
**Warning signs:** the oracle imports `emitVerdict` or `admit`; the fixture writes a `by: §14-gate` note.

### Pitfall 4: bare `npm test` during regression (token burn + hang)
**What goes wrong:** `npm test` = `vitest run` includes `scripts/e2e/` — the live `claude` lane; on an authed box it spends tokens / can hang ~8 min (project memory).
**How to avoid:** regression = `npx vitest run --exclude '**/scripts/e2e/**'`; live lane = `npm run test:e2e`.
**Warning signs:** a "unit" run invoking `claude`.

### Pitfall 5: asserting against Phase-24-deleted handoff artifacts
**What goes wrong:** the retirement/oracle references `implementation-handoff.md`/`qe-handoff.md` (deleted under MIGR-02) — a permanently-red or dishonest anchor.
**Why it happens:** the Tier-2 `A3-live` test and the parity docs still name them (see Loud Flag 2).
**How to avoid:** retarget onto on-disk note-set + verdict-string equivalence (D-05); when reworking A3-live and the parity table, remove the deleted filenames.
**Warning signs:** a grep for `implementation-handoff.md` still hits live assertions after the retirement.

### Pitfall 6: `sweepStale` no-op looks like a pass
**What goes wrong:** the reclaim assertion passes without ever reclaiming (TTL too large / clock too close).
**Why it happens:** `sweepStale` is deliberately conservative — fresh claims are left alone (claim.ts:203).
**How to avoid:** seed a claim with an old `at` and call `sweepStale(queueRoot, ttlMs, now)` with an injected `now` far past `at+ttl`; assert the returned array CONTAINS the task and the subtask is back in `pending/`.
**Warning signs:** `sweepStale` returns `[]` yet the test "passes."

## Code Examples

### Seeded fixture with a frozen-stamped admitted finding (D-03/D-04) — no emitVerdict, no admit
```typescript
// Source: derived from convergence-spine.test.ts:92-109 (doWork) + context-io.ts:648 (GATE_STAMP_RE),
// context-io.ts:859 (VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW").
const FIXED_ID = "R26-DOGF01-0001";                 // frozen per-run id (fixture constant)
const GATE_STAMP = `§14-gate#${FIXED_ID}`;           // literal — passes validate() structurally
const FROZEN_VERDICT = "READY_FOR_HUMAN_REVIEW";     // frozen verdict STRING (not a gate call)

function doWork(sub, task) {
  // soft notes (no stamp needed) + ONE admitted finding carrying the frozen §14-gate stamp
  ctx.appendNote(task, { kind: "observation", by: "engineer", at: `2026-06-21T10:00:00.000Z`,
    verified_by: "", confidence: "high", refs: [], supersedes: null }, `observed ${task}`, sub.contextRoot);
  ctx.appendNote(task, { kind: "finding", by: "engineer", at: `2026-06-21T10:00:30.000Z`,
    verified_by: GATE_STAMP, confidence: "high", refs: [GATE_STAMP], supersedes: null },
    `${FROZEN_VERDICT}: seeded finding for ${task}`, sub.contextRoot);
}
```

### N-process worktree pinning (DOGF-02) — one shared absolute root
```typescript
// Source: claim.ts:106/143/178 signatures (all take queueRoot as first positional — already explicit).
const SHARED_QUEUE   = join(shared, "queue");    // OUTSIDE every worktree
const SHARED_CONTEXT = join(shared, "context");  // OUTSIDE every worktree
// each child (cwd = its worktree) runs, e.g. via `node -e` or a tiny committed runner:
claim.claimTask(SHARED_QUEUE, task, `agent-${i}`);          // EEXIST → claim lost (exactly-once)
claim.transition(SHARED_QUEUE, task, "pending", "claimed");
ctx.appendNote(task, note, body, SHARED_CONTEXT);           // fresh unique notes/<id>.md, un-clobbered
claim.transition(SHARED_QUEUE, task, "claimed", "done");
// stale reclaim: write a claim.md with an old `at`, then:
const reclaimed = claim.sweepStale(SHARED_QUEUE, ttlMs, /*now*/ oldAt + ttlMs + 1); // returns [task]
```

### Cost harness skeleton (DOGF-03) — honest default
```typescript
// Parse the aggregate-usage object from `claude -p <req> --output-format json`.
// The EXACT field names are UNKNOWN - verify (see Q5). Default to UNKNOWN - verify with no authed run.
function measureCost(json: unknown): { input?: number; output?: number; total?: number; note: string } {
  const usage = (json as any)?.usage ?? (json as any)?.result?.usage;   // shape UNKNOWN - verify
  if (!usage) return { note: "UNKNOWN - verify: no usage object in --output-format json output" };
  // ...map fields ONLY after verifying them against a real authed run; never assert DeLM's numbers.
  return { note: "UNKNOWN - verify: field schema not confirmed in this session" };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `oracleParity` structural grep of a parity table naming static handoffs | On-disk `currentState()` equivalence of two replay modes | This phase (DOGF-01) | Replaces a doc-shape check with a real substrate-convergence proof. |
| Static handoff files as the dual-path artifact | Typed notes in the shared context (Workflow 16) | Phase 24 (MIGR) | The retirement must assert notes, not deleted filenames (Pitfall 5). |
| A3/DOG-02 human-waived to "next milestone" | Retired on oracle-green + one captured live run | This phase (SC4/D-01) | Honest closure, not deletion-based. |

**Deprecated/outdated:**
- `implementation-handoff.md` / `qe-handoff.md` as parity anchors — deleted (MIGR-02); still referenced in `uat-live.test.ts`, the runbook, and `examples/03-ticket-to-pr.md` (fix as part of retirement).
- `scripts/validate-agent-factory.mjs` naming in `examples/03-ticket-to-pr.md:143` — the tooling is TypeScript→`.js` now (`validate-agent-factory.js`); a stale `.mjs` reference, cosmetic but worth correcting if the file is touched.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `claude --output-format json` exposes an aggregate `usage` object with input/output/total token fields (exact names unconfirmed). | Q5 / DOGF-03 | Cost harness reads the wrong field → a fabricated/empty number. Mitigated: default `UNKNOWN - verify`; verify against a real authed run before mapping. |
| A2 | All N worktree processes importing the SAME committed `context-io.js`/`claim.js` + passing shared absolute roots is sufficient for cross-process atomicity (no OS-level fcntl needed). | Q1 | If a filesystem's `mkdir`/`rename` isn't atomic (true NFS), exactly-once could break — but this is the very UNKNOWN the dogfood exists to surface; local APFS/ext4 are atomic. CI NFS-atomicity remains `UNKNOWN - verify` (STATE.md:384). |

**All other claims in this document were read directly from source this session and are `[VERIFIED]` by file:line.**

## Open Questions (RESOLVED)

1. **Exact `claude --output-format json` usage schema (DOGF-03).**
   - What we know: the harness must parse aggregate usage; `uat-live.test.ts` already uses `--output-format json` and raises `maxBuffer` for verbose transcripts (lines 164, 181).
   - What's unclear: the precise field path/names carrying input/output/total tokens and cost.
   - Recommendation: `UNKNOWN - verify`. Capture one real `claude -p 'hi' --output-format json` output in THIS repo (the box is authed) as a fixture, map fields from it, and record the capture date; until then the harness returns `UNKNOWN - verify`. Never assert DeLM's +10.5pp / ~50%.
   - RESOLVED: deferred to `UNKNOWN - verify` per D-10 until an authed capture is mapped (reflected in plan 26-03).

2. **Which committed `.js` do the N worktree child processes import?**
   - What we know: the roots (passed explicitly) determine correctness, not the importer.
   - Recommendation: import the MAIN checkout's `scripts/context-io.js`/`claim.js` (stable path) and pass shared absolute roots — simplest and removes any doubt about worktree-local script copies. Document it in the plan.
   - RESOLVED: N worktree child processes import the MAIN checkout's committed .js and pass shared absolute roots (adopted in plan 26-02).

3. **Does DOGF-01 assert `done/` set equivalence too (as convergence-spine does, line 159)?**
   - Recommendation: yes — mirror convergence-spine's dual assertion (same `done/` records AND same per-task `currentState`), plus the frozen verdict string. Cheap and strengthens SC1.
   - RESOLVED: yes — assert done/-set equivalence AND per-task currentState + the frozen verdict string (adopted in plan 26-01).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All (runs `.js` twins, Vitest) | ✓ | v24.12.0 (≥22 floor) | — |
| `git worktree` | DOGF-02 gating dogfood (D-06) | ✓ | git 2.54.0 | — (required; no fallback) |
| Vitest | Oracle + dogfood tests | ✓ | 4.1.8 | — |
| TypeScript (`tsc`) | Build committed twins + freshness | ✓ | ~6.0.3 | — |
| `claude` CLI (authed) | Tier-2 live dogfood + D-01 captured run + DOGF-03 real number | ✓ (this box, 2.1.197, authed) | 2.1.197 | Loud-skip (Tier-2) / human runbook (D-01) / `UNKNOWN - verify` (cost) |

**Missing dependencies with no fallback:** none (all present on this box).
**Missing dependencies with fallback:** `claude` may be absent/unauthed on CI — by design the live lane loud-skips, the cost stays `UNKNOWN - verify`, and D-01's evidence comes from the human runbook. The deterministic gating deliverables (DOGF-01, DOGF-02, cost *harness*) need NO authed run.

## Validation Architecture

> `workflow.nyquist_validation: true` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`globals:false`) |
| Config file | none dedicated — driven by `package.json` scripts; tests co-located as `scripts/*.test.ts` |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**'` (Tier-1 + hermetic tests, NO live lane) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` for regression; `npm run test:e2e` for the gated live lane separately |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOGF-01 | Two replay modes converge on-disk (same admitted-note set + verdict) | unit (hermetic) | `npx vitest run scripts/check-uat-oracles.test.ts` | ⚠️ extend — add a dual-path-equivalence RED/GREEN case; keep the parity-red tests updated for the replaced oracle |
| DOGF-01 | New oracle folds RED into the aggregator | unit | `npx vitest run scripts/check-uat-oracles.test.ts -t "parity\|equivalence"` | ⚠️ update the two `oracleParity` tests (test.ts:203, 221) to the new oracle |
| DOGF-01 | Aggregator invokes new oracle + exits red on defect | unit | `node scripts/check-foundation-guards.js` (smoke, test.ts:235) | ✅ update import/invoke sites |
| DOGF-02 | N distinct un-clobbered notes; each task claimed once; stale claim reclaimed; shared-root vs worktree-local | unit (hermetic, real worktrees) | `npx vitest run scripts/<new>-worktree-dogfood.test.ts` | ❌ Wave 0 — new test file |
| DOGF-02 (live) | N-agent live `claude` spawn confirmation | e2e (gated, loud-skip) | `npm run test:e2e` | ⚠️ extend `uat-live.test.ts` (retarget off deleted handoffs) |
| DOGF-03 | Cost harness parses usage or returns `UNKNOWN - verify` | unit (fixture) + e2e (real number) | `npx vitest run scripts/<new>-cost.test.ts` | ❌ Wave 0 — new harness + fixture |
| Build integrity | Committed `.js` twins match source after edits | gate | `npm run build && npm run freshness` (exit 0) | ✅ existing gate |

### Sampling Rate
- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness`.
- **Per wave merge:** full non-e2e suite + `node scripts/check-foundation-guards.js` (exit 0).
- **Phase gate:** non-e2e suite green + freshness 0 + (for the retired flip only) a captured live run (Tier-2 authed OR human runbook) recorded as evidence.

### Wave 0 Gaps
- [ ] `scripts/dual-path-equivalence.ts` (+ committed `.js`) — shared `currentState()` comparator both the test and the oracle import (Claude's-discretion resolution).
- [ ] New oracle `oracleDualPathEquivalence()` in `scripts/check-uat-oracles.ts` replacing `oracleParity` (line 329) + update `check-foundation-guards.ts` (lines 62, 643).
- [ ] Update `scripts/check-uat-oracles.test.ts` (lines 203, 221) from parity-string tests to equivalence RED/GREEN tests.
- [ ] New `scripts/*-worktree-dogfood.test.ts` — real `git worktree` N-process dogfood (DOGF-02).
- [ ] New cost harness + fixture (DOGF-03) with `UNKNOWN - verify` default.
- [ ] Extend `scripts/e2e/uat-live.test.ts` A3-live for the N-agent live confirmation AND retarget it off the deleted handoff filenames.
- [ ] Rebuild committed `.js` twins for every edited `.ts`; `npm run freshness` exit 0.

## Security Domain

> `security_enforcement: true` — section included. This phase adds no new attack surface (test/measurement code + doc edits); the relevant controls are the EXISTING safety floors it must not weaken.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (safety floor) | `GRUGOPS_PROD_DEPLOY_APPROVED` never set by any harness (uat-live.test.ts:56, 294-299); humans hold deploy (V14). |
| V5 Input Validation | yes | Any spawned `claude`/`node` uses arg-array `spawnSync` (never `shell:true` on the data path — uat-live.test.ts:167-169; check-uat-oracles.ts:291). New harness code must follow this. |
| V6 Cryptography | no (nonce is `randomUUID`, not security-bearing — context-io.ts:754) | — |
| V12 File handling | yes | Task names are allowlisted `^[A-Za-z0-9._-]+$` (context-io.ts:86, claim.ts:68); `writeNoteFile` path-containment (context-io.ts:706). New fixtures must use safe task names + hermetic temp roots. |

### Known Threat Patterns for this phase's code
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A harness self-approving a prod deploy | Elevation of Privilege | Never set the approval env; assert its ABSENCE only (uat-live.test.ts:294-299). |
| Command injection via a spawned CLI arg | Tampering | Arg-array `spawnSync`, no `shell:true` on any data path. |
| A fabricated "pass" from a skipped/absent live run | Repudiation | Loud-skip keystone (`LOUD_SKIP_MARKER`); a skip never flips a UAT; cost defaults `UNKNOWN - verify`. |
| Asserting against deleted artifacts (false trace) | Repudiation | Assert on-disk note-set/verdict, preserve requirement→trace (D-12, Pitfall 5). |

## Sources

### Primary (HIGH confidence — read from source this session)
- `scripts/context-io.ts` — `DEFAULT_CONTEXT_ROOT` (82-83), `appendNote` (761), `readContext` (803), `currentState` (838), `validate`/`GATE_STAMP_RE` (548/648), `emitVerdict` (881), `admit` (966), `noteId` nonce (752), `VERDICT_GREEN_MARKER` (859).
- `scripts/claim.ts` — `DEFAULT_QUEUE_ROOT` (60-61), `claimTask` (106), `transition` (143), `sweepStale` (178).
- `scripts/check-uat-oracles.ts` — harness (44-68), `oracleParity` (329), `runAll`/`isEntry` (392-414).
- `scripts/check-foundation-guards.ts` — oracle import (59-64), invoke + fold (640-644).
- `scripts/convergence-spine.test.ts` — `makeSubstrate`/`doWork`/`canonical` replay engine (55-126), assertions (155-168).
- `scripts/e2e/uat-live.test.ts` — `claudePresentAndAuthed`/`emitLoudSkipIfUnavailable`/`LOUD_SKIP_MARKER` (67-102), A3-live + deleted-handoff refs (320-361).
- `scripts/check-uat-oracles.test.ts` — CHECK_ROOT mirror harness + the two `oracleParity` tests (202-232).
- `docs/dogfood-human-runbook.md`, `examples/03-ticket-to-pr.md` — retirement/parity tracking sites.
- `package.json` — build/test/freshness scripts (9-18); `.planning/REQUIREMENTS.md` (DOGF-01/02/03, lines 71-73); `.planning/STATE.md` (retirement history, waiver, CI NFS UNKNOWN).
- Environment probes: `node v24.12.0`, `git 2.54.0` (worktree present), `claude 2.1.197` authed, `vitest 4.1.8`.

### Secondary (MEDIUM)
- `.planning/config.json` — `nyquist_validation:true`, `security_enforcement:true`.

### Tertiary (LOW / UNKNOWN - verify)
- `claude --output-format json` token-usage field schema — NOT captured this session (token-cost fabrication trap); marked `UNKNOWN - verify`.

## Metadata

**Confidence breakdown:**
- Reuse seams (context-io/claim/oracle/aggregator) — HIGH — every signature and line read from source.
- Equivalence-oracle promotion design — HIGH — `convergence-spine.test.ts` is a working template; the only judgment is helper-extraction (Claude's discretion, resolved: extract).
- Worktree shadowing crux (D-07) — HIGH — `DEFAULT_CONTEXT_ROOT`/`DEFAULT_QUEUE_ROOT` are provably script-relative; cross-process atomicity via `mkdirSync`/unique-file-write is verified, with true-NFS atomicity the standing `UNKNOWN - verify`.
- Token-cost field schema — LOW / `UNKNOWN - verify` — deliberately not fabricated.
- Retirement tracking sites — HIGH — every doc site enumerated; the deleted-handoff inconsistency in the Tier-2 test/docs is flagged.

**Research date:** 2026-07-01
**Valid until:** ~2026-07-31 (stable internal codebase; re-verify only if the substrate scripts change before planning).
