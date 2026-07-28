# Phase 24: Clean Handoff Removal & Traceability Migration - Research

**Researched:** 2026-06-22
**Domain:** Markdown-kit refactor + TS gate/render tooling (`node:fs`-only → `tsc` → committed `.js` → vitest), grep-to-zero atomic deletion, install-time state migration
**Confidence:** HIGH (all claims verified against live files this session; no external libraries introduced)

## Summary

This is a **migration phase with zero new substrate and zero new dependencies**. Every primitive it needs already exists and was verified live this session: the deterministic freshness-gated render (`scripts/context-io.ts render` + `scripts/now-running-freshness.ts`), the handoff-ref authority (`scripts/check-kit-refs.ts` Assertion 2 + 16-template ALLOW ERE), the never-delete-first backup primitive (`install/install.ts` `backupIfDiffers` + `isoStamp()` + `GRUGOPS_BACKUP_SUFFIX`), and an already-parsed `--migrate` flag. The work is **rewire-then-delete-atomically**, mirroring the Phase-23 WR-05 flip discipline, with a both-direction adversarial proof against the committed `.js`.

The single largest risk is the **green-suite-insufficient class** ([[grugops-safety-invariant-green-suite-insufficient]]): the grep-to-zero gate flip (D-13/D-15) and the trace-freshness gate (D-03) are trace/safety surfaces where a passing test suite is NOT proof. Both need a RED-vs-committed-`.js` adversarial reproduction. A second, subtler risk surfaced this session: **`scripts/check-kit-refs.ts` currently has NO test file** — the gate whose authority we are flipping is untested, so the D-15 adversarial proof must also stand up its first test harness.

**Primary recommendation:** Plan exactly two ordered stages (D-12): (1) rewire all 68 reference sites (18 roles + 16 workflows `00`–`15` + 3 packaging templates + AGENTS.md) so the kit grep hits zero, holding `guard_context_writes` green via reference-only WF16 wording (D-10); (2) one atomic deletion change that `rm`s all 17 templates (incl. `frontend-handoff.md`), flips `check-kit-refs.ts` Assertion 2 to "ZERO refs", drops `FROZEN_HANDOFFS` from the validator, re-points the traceability completeness check at the note-derived render, updates `generate-catalog.ts` / `check-uat-oracles.ts` / fixtures, removes the `plans/handoffs/` seed creation, and adds the `--migrate` handoffs-backup step — all proven RED-vs-`.js` before merge.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Inter-role memory (was handoffs) | Shared context substrate (`.grugops/context/`, Phase 20) | Queue `pending/` subtask file (Phase 23) | D-05 pull-not-push: role pulls context on-demand, publishes typed notes; sequencing owned by Orchestrator decompose (D-07) |
| Trace face (`plans/traceability.md`) | Deterministic render of note `refs` (`scripts/`, clone of `context-io.ts render`) | Validator completeness check (`validate-agent-factory.ts`) | D-01/D-04: notes are source of truth; `traceability.md` is the derived human-facing mirror, keyed by ticket id |
| Grep-to-zero authority | `scripts/check-kit-refs.ts` Assertion 2 (gate tier) | — | D-13: repurpose existing handoff-ref scan; never a new `guard_no_handoffs`, never a repo-wide grep |
| Trace freshness (fail-closed) | Standalone `freshness:*` gate (`scripts/`, clone of `now-running-freshness.ts`) | package.json script | D-03: `traceability.md` is per-repo runtime state in `plans/`, NOT committed kit output — needs a queue-twin-style gate, not the committed-`.js` freshness kind |
| User-state migration | `install/install.ts --migrate` (install tier) | `git revert` (rollback) | D-17/D-18: rename `plans/handoffs/` → `.bak.<ISO>`, never-delete-first, reuse `backupIfDiffers`/`isoStamp` |

## Standard Stack

No new packages. Dev/build deps remain `{typescript, vitest, @types/node}` only; host runtime is zero-dep committed `.js` (CLAUDE.md hard constraint, D-13 build model). **No Package Legitimacy Audit required** — this phase installs no external packages.

| Existing asset | Version | Purpose | Why standard here |
|---------|---------|---------|--------------|
| `scripts/context-io.ts` `render()` (line 913) | committed `.js` | Deterministic, byte-reproducible, zero-token note→markdown render | `[VERIFIED: live file]` Direct template for the `traceability.md` render (D-01) — sorts by `at` lexicographic + id tiebreak, GENERATED header, single trailing newline |
| `scripts/now-running-freshness.ts` | committed `.js` | Queue-rooted fail-closed drift gate (regen→byte-compare) | `[VERIFIED: live file]` Direct template for the D-03 trace-freshness gate — it is already the `.grugops/queue/`-rooted twin of `freshness:context`; the trace gate is its `plans/`-rooted twin |
| `scripts/check-kit-refs.ts` | committed `.js` | Handoff-ref authority over explicit SCAN set | `[VERIFIED: live file]` Assertion 2 (lines 158-180) + ALLOW ERE (lines 69-71) is the surgical grep-to-zero flip point (D-13) |
| `install/install.ts` `backupIfDiffers` (line 563) + `isoStamp()` (line 193) + `GRUGOPS_BACKUP_SUFFIX` (line 201) | committed `.js` | Never-delete-first rename-to-`.bak.<ISO>` primitive + anchored backup-shape matcher | `[VERIFIED: live file]` Exact primitives for D-18/D-20; `--migrate` flag already parsed (lines 88-89) |

## Package Legitimacy Audit

Not applicable — no external packages installed this phase. All work is internal markdown rewrites and TS edits to existing committed scripts.

## Architecture Patterns

### System Architecture Diagram (the cut-over)

```
STAGE 1 — REWIRE (kit text, grep must reach 0)
  18 roles ─┐
  16 wf 00-15 ─┼─► remove "read/write handoff" Output sections ──► reference WF16 (pull) + emit typed notes (publish)
  3 packaging ─┤                                                         │
  AGENTS.md ───┘                                                         ▼
                                              guard_context_writes (WR-01) stays GREEN
                                              (reference-only WF16 wording, D-10 — no raw .grugops/ write path)

STAGE 2 — ATOMIC DELETE (one change, RED-vs-.js proven before merge)
  rm agent-factory/handoffs/*.md (all 17, incl. frontend-handoff.md)
  rm scripts/fixtures/*/agent-factory/handoffs/  (8 fixture dirs)
  remove install.ts seedState plans/handoffs/ mkdir (lines 1004-1011)
        │
        ├─► check-kit-refs.ts Assertion 2: ALLOW-ERE filter ──► "ZERO agent-factory/handoffs/ refs"  (BACKPRESSURE)
        ├─► validate-agent-factory.ts: drop FROZEN_HANDOFFS (136-153, 253-256); re-point trace check (463-466)
        ├─► generate-catalog.ts: (no handoff refs found — verify regenerated catalog clean)
        ├─► check-uat-oracles.ts: FROZEN_HANDOFFS (318) names impl/qe handoff filenames — adjust oracle
        └─► fixture test expectations move (good/ + 7 bad/ trees lose handoffs/)

TRACE (parallel, MIGR-03)
  note refs (requirement/code/test/release) ──► render plans/traceability.md (clone context-io render)
                                                       │
                                                       ▼
                                          freshness:traceability gate (clone now-running-freshness, fail-closed)

USER STATE (MIGR-04)
  install.ts --migrate ──► backupIfDiffers(plans/handoffs → plans/handoffs.bak.<ISO>)  [never-delete-first, abort on collision]
```

### Pattern 1: Deterministic render of note refs → `traceability.md` (D-01)
**What:** Read notes via `readContext`, project `refs` onto Requirement│Code│Tests│UAT│Release columns keyed by ticket id, emit a GENERATED-header markdown table sorted deterministically.
**When to use:** This is the only acceptable shape for `traceability.md` (Option A — survives as a render, not hand-maintained, not deleted).
**Example:**
```typescript
// Source: scripts/context-io.ts:913-963 (render) — the verified template to clone
md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/<trace-render>.js -->");
// sort by at lexicographic, id tiebreak; single trailing newline; cell() escapes pipes
```
**Discretion (D-discretion):** extend `context-io.ts` with a `renderTraceability()` vs a new `trace-render.ts`. Recommendation: **new `scripts/trace-render.ts`** + its own `freshness:traceability` package.json script — keeps `context-io.ts` focused on the per-task substrate and matches the standalone-gate precedent (`now-running-freshness.ts`, `context-freshness.ts`, `catalog-freshness.ts` are each standalone, NOT folded into `check-foundation-guards.ts`).

### Pattern 2: Fail-closed render-drift gate (D-03)
**What:** Regenerate `plans/traceability.md` into a throwaway temp mirror, byte-compare against the committed file; any mismatch OR a regen that fails to run cleanly → exit non-zero. Vacuous pass when no notes exist yet.
**Example:**
```typescript
// Source: scripts/now-running-freshness.ts:130-157 — STALE byte-compare + fail-closed
if (!committed.equals(rebuilt)) { /* exit 1, name the file, "STALE" */ }
// fail-closed: a regen that did not run cleanly NEVER reports "fresh" (line 119)
```
**Key:** `traceability.md` lives in `plans/` (per-repo runtime state), so it is the `plans/`-rooted twin of the queue gate — NOT the committed-`.js` `freshness` kind. Wire as its own `freshness:traceability` package.json script.

### Pattern 3: Atomic flip with backpressure (D-13/D-14)
**What:** The `check-kit-refs.ts` Assertion 2 flip lands INSIDE the deletion change. Until the rewire is complete, the flipped gate (now "ZERO refs") fails red, so the deletion change cannot go green prematurely. Mirrors Phase-23 WR-05 D-18 atomic flip.

### Anti-Patterns to Avoid
- **A renamed packet** (D-08): a single "handoff-shaped" mega-note per role-run is forbidden — emit several one-kind-per-file notes.
- **A directive naming a successor** (D-07): the "Next agent / Next action" relay is fully dead. Advisory `finding`/`observation` ("this needs security review") is the ONLY residue — never names who acts.
- **Restating a raw `.grugops/...` write path in role prose** (D-10): trips `guard_context_writes` RED. Roles reference WF16, never restate.
- **A new `guard_no_handoffs` in `check-foundation-guards.ts`** (D-13): wrong location — that gate stays focused on live safety guards. Reuse `check-kit-refs.ts`.
- **A repo-wide grep** (D-13): preserve the explicit SCAN set (token economy).
- **Delete-first on user state** (D-18): always rename-to-backup; abort on collision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deterministic markdown render | A bespoke string builder | Clone `context-io.ts render` shape | Byte-reproducibility, GENERATED header, supersede-fold, trailing-newline already solved + tested |
| Render-drift detection | A timestamp/mtime check | Clone `now-running-freshness.ts` regen→byte-compare | mtime is unreliable in git; byte-compare-vs-fresh-regen is the proven fail-closed pattern |
| Backup-with-collision-guard | New rename logic | `install.ts` `backupIfDiffers` + `isoStamp()` | Never-delete-first, identical-no-backup, DRY_RUN, anchored `.bak.<ISO>` suffix all solved |
| ISO8601 backup name | `Date.now()` / custom format | `isoStamp()` = `toISOString().replace(/:/g,"-")` | Filesystem-safe (no colons), millisecond precision avoids routine collision (D-20) |

**Key insight:** This phase's entire value is *removal without regression*. Every "build" is actually a "clone an existing verified pattern" — the codebase already solved render, freshness, and backup three times each.

## Runtime State Inventory

> Rename/migration phase — all five categories answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | User's runtime-accumulated `plans/handoffs/<ID>-<stage>.md` instances (created by roles under the OLD relay). `install.ts:1004-1011` explicitly `mkdir`s `plans/handoffs/` on every install — so even fresh installs have an empty dir. | MIGR-04 `--migrate` renames it to `plans/handoffs.bak.<ISO>` (data migration via backup, never parse/convert — D-19). |
| **Live service config** | None — grugops is a file-and-prompt kit; no external service stores "handoff". Verified: no DB, no daemon (Out-of-Scope §). | None. |
| **OS-registered state** | None — no scheduler/launchd/systemd entries reference handoffs. Verified: kit is markdown + committed `.js`. | None. |
| **Secrets/env vars** | None reference "handoff". The only env vars touched (`GRUGOPS_HOME`, `GRUGOPS_BACKUP_SUFFIX` matcher, `DRY_RUN`) are migration-mechanics, not handoff names. | None. |
| **Build artifacts / fixtures** | (1) `scripts/fixtures/*/agent-factory/handoffs/` — **8 fixture dirs** (`good/` + `bad-ticket-mismatch/` + `bad-plugin-noname/` + `bad-workflow-no-commit/` + `bad-role-missing-section/` + `warn-only-no-trace/` + `bad-config-no-mode/` + `bad-ticket-bad-column/`) exist only to satisfy `FROZEN_HANDOFFS` existence checks. (2) Committed `.js` for every edited `.ts` (freshness-gated). (3) The regenerated catalog. | Delete the 8 fixture dirs + update fixture-based test expectations in the SAME atomic change (D-16). Rebuild `.js` (freshness 0). Regenerate catalog. |

**The canonical question — after every kit file is updated, what runtime systems still have the old string?** Only the user's `plans/handoffs/` runtime dir (handled by `--migrate`) and `install.ts`'s own `seedState` mkdir of that dir (must be removed so new installs never recreate it). MIGR-02's "delete the `plans/handoffs/` seed" is therefore **two edits**: confirm `agent-factory/seed/plans/` has no `handoffs/` (it does NOT — verified) AND remove the `install.ts:1004-1011` explicit mkdir.

## Common Pitfalls

### Pitfall 1: The 17th template (`frontend-handoff.md`) is invisible to the existing gates
**What goes wrong:** Both `validate-agent-factory.ts` `FROZEN_HANDOFFS` (lines 136-153) and `check-kit-refs.ts` ALLOW ERE (lines 69-71) enumerate only **16** templates. `frontend-handoff.md` (added with the Phase-16 frontend persona) is the 17th. A planner reading only the gate lists would delete 16 and orphan the 17th.
**Why it happens:** The gates predate the frontend persona; nobody added `frontend-handoff` to the frozen lists.
**How to avoid:** `rm` all 17 (verified count: `ls agent-factory/handoffs/` = 17 files). After deletion, grep the kit for `frontend-handoff` to confirm zero orphans (`frontend-ui.md` role has 2 handoff refs — verify they are removed in Stage 1).
**Warning signs:** A surviving `frontend-handoff` reference in `frontend-ui.md` or `14-ui-design-to-build.md` (8 handoff refs) after Stage 1.

### Pitfall 2: `check-kit-refs.ts` has NO test file — the gate we are flipping is untested
**What goes wrong:** D-15 demands a both-direction adversarial proof of the flipped Assertion 2, but there is no `scripts/check-kit-refs.test.ts` today (verified — file absent). Planting a `agent-factory/handoffs/` ref and asserting RED has nowhere to live, and the flip could silently misbehave.
**Why it happens:** `check-kit-refs.ts` was a `.sh`→TS port (Phase 15) of a build gate run in CI, never unit-tested.
**How to avoid:** Stand up `scripts/check-kit-refs.test.ts` in this phase as part of D-15. Use the `now-running-freshness.test.ts` idiom (verified live): a hermetic `CHECK_ROOT` mirror, run the committed `.js` via `spawnSync`, assert exit code + stdout token. Test cases: (a) clean kit → exit 0; (b) planted `agent-factory/handoffs/anything.md` ref in a SCAN file → exit 1 naming the stray; (c) the flip must run RED against the COMMITTED `.js` before the rewire completes (proves backpressure).
**Warning signs:** A green suite with no RED fixture — the terminal lesson ([[grugops-safety-invariant-green-suite-insufficient]]).

### Pitfall 3: `guard_context_writes` (WR-01) goes live against rewired prose
**What goes wrong:** Rewritten role Output sections that describe a context write by a raw path (`.grugops/context/...` co-occurring with `writeFileSync`/`appendFileSync`/`\bWrite\b`/`>`/`>>`/`echo` on one line) fire the guard RED.
**Why it happens:** D-10 wiring is new; the guard's SCAN set is the 17 role files + 16 workflows (verified `check-foundation-guards.ts:580-602`).
**How to avoid:** Roles reference WF16 and emit typed notes via the WF16 protocol — never restate a raw write path. The guard's CALIBRATION (lines 562-568) explicitly allows prose that NAMES the helper/path ("roles call context-io.ts") but fires on a TOKEN co-occurrence. Keep rewritten Output sections to "reference WF16; publish `decision`/`finding`/`artifact-ref` notes" — no inline `.grugops/...` + write-token lines.
**Warning signs:** `[guard_context_writes] ... raw context write` FAIL after Stage 1.

### Pitfall 4: The validator traceability check must re-point, not vanish
**What goes wrong:** `validate-agent-factory.ts:463-466` warns when a ticket has no `plans/traceability.md` row (keyed by ticket id = filename without extension). If the planner only deletes `FROZEN_HANDOFFS` and forgets this check, the trace-completeness guarantee (MIGR-03, the proof) silently weakens.
**Why it happens:** The two validator touch-points (existence check 253-256; trace check 434/463-466) are far apart in the file.
**How to avoid:** D-04: keep the "every ticket has a trace row" check, re-point it at the note-derived `traceability.md` render (still reads `plans/traceability.md`, lines 432-434 — minimal change since the render writes to the same path). The row source changes (notes, not handoffs) but the file path and the ticket-id key are unchanged, so the validator edit is minimal.

### Pitfall 5: `check-uat-oracles.ts` names handoff filenames in the A3 parity table
**What goes wrong:** `check-uat-oracles.ts:318` declares `FROZEN_HANDOFFS = ["implementation-handoff.md", "qe-handoff.md"]` and asserts the dual-path parity table NAMES them (lines 326-368). Deleting the templates without adjusting this oracle leaves it asserting against deleted artifacts.
**Why it happens:** A3/oracleParity (Phase 19) pinned handoff filenames as the parity anchor.
**How to avoid:** Adjust the oracle in lockstep (D-14 step 5). Note the A3/DOG-02 equivalence retirement is Phase 26, NOT here — this phase only stops the oracle from referencing deleted files; it does not retire the oracle.

### Pitfall 6: `--migrate` already exists (v1.2) — MIGR-04 must EXTEND, not collide
**What goes wrong:** `install.ts:88-89` already parses `--migrate`, and `migratePreSteps()` (lines 704+) already does v1.0→two-root **layout** migration (a DIFFERENT v1.2 `MIGR-01`). A planner who adds a brand-new `--migrate` branch creates a conflict.
**Why it happens:** Two different milestones both named a requirement "MIGR-01/04"; the flag literal is shared.
**How to avoid:** D-17 reconcile — fold the v2.0 handoffs-backup step INTO the existing `--migrate` orchestration (or as an additional pre-step in `migratePreSteps`). Reuse `backupIfDiffers` for `plans/handoffs/ → plans/handoffs.bak.<ISO>`. The existing flag already honors DRY_RUN, idempotence, and the anchored backup suffix — inherit all of it.

## Code Examples

### The backup primitive to reuse for `--migrate` (D-18/D-20)
```typescript
// Source: install/install.ts:563-585 — never-delete-first, identical-no-backup, DRY_RUN, returns true iff backed up
function backupIfDiffers(target, replacement, label): boolean {
  if (!existsSync(target)) return false;            // nothing to migrate → clean no-op (idempotent, D-20)
  // ... identical → "skipped (identical — no backup)" ...
  const backup = `${target}.bak.${isoStamp()}`;     // isoStamp() = toISOString().replace(/:/g,"-")
  if (DRY_RUN) { report("would-backup", `${label} → ${backup}`); return true; }
  renameSync(target, backup);                        // rename, never delete
}
```
For MIGR-04, the migrate variant has no `replacement` (D-19 no content conversion) — a thinner `backupDir(plans/handoffs)` that renames unconditionally when the dir exists and **aborts** if `plans/handoffs.bak.<ISO>` already exists (collision → clear message, D-18), else "nothing to migrate".

### The freshness-gate skeleton to clone for the trace gate (D-03)
```typescript
// Source: scripts/now-running-freshness.ts — main() gated behind isMain; greenfield vacuous pass;
// regen into temp mirror; byte-compare; fail-closed exit 1 on any non-clean regen or mismatch.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Push curated handoff packet to next named agent | Pull shared context on-demand + publish typed notes (D-05) | Phase 24 | Directional relay dead; Orchestrator owns sequencing (D-07) |
| `plans/traceability.md` hand-maintained / handoff-fed | Deterministic render of note `refs`, freshness-gated fail-closed (D-01/D-03) | Phase 24 | Notes are source of truth; stale trace = gate FAIL |
| Dual-write (handoffs still written, Phase 23 D-02) | Clean cut — no transitional dual-write (D-11) | Phase 24 | Handoff-writing removed from role Output sections entirely |

**Deprecated/removed this phase:**
- All 17 `agent-factory/handoffs/*.md` templates.
- `FROZEN_HANDOFFS` existence checks in `validate-agent-factory.ts`.
- The `install.ts` `seedState` `plans/handoffs/` mkdir (lines 1004-1011).
- 8 `scripts/fixtures/*/agent-factory/handoffs/` dirs.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `generate-catalog.ts` has zero handoff references (grep returned nothing) | Pattern 3 / D-14 step 3 | LOW — if the regenerated catalog enumerates handoff files indirectly (e.g. via a kit-tree walk), a catalog-freshness drift could appear after deletion. Verify by regenerating the catalog in the deletion change and running `freshness:catalog`. |
| A2 | Re-pointing the validator trace check is minimal (same `plans/traceability.md` path + ticket-id key) | Pitfall 4 | LOW — if the render changes the file's row format, the `trace.includes(id)` substring check (line 465) still passes as long as ticket ids appear in the rendered rows. Confirm the render emits ticket ids. |
| A3 | The 8 fixture dirs exist ONLY for `FROZEN_HANDOFFS` and carry no other test dependency | Runtime State Inventory | MEDIUM — a fixture-based test may assert handoff presence for an unrelated reason. Grep each fixture's consuming test (`validate-agent-factory.test.ts`, `install.test.ts:299-308`) before deleting. **Note: `install.test.ts:299-308` explicitly asserts `plans/handoffs/` IS seeded — that test expectation MUST move/invert in the same change.** |
| A4 | New `scripts/trace-render.ts` + standalone `freshness:traceability` is preferred over extending `context-io.ts` | Pattern 1 discretion | LOW — both satisfy D-01/D-03; this is explicit Claude's-discretion. Planner may choose either. |

## Open Questions

1. **Per-task vs batch trace render (D-discretion).**
   - What we know: D-03 fail-closed freshness must hold either way; the render rides the task-done consolidation hook Phase 20 deferred (D-02).
   - What's unclear: whether the Orchestrator batch-renders `traceability.md` at gate time, or each task-done fires it.
   - Recommendation: batch-render at gate time (fewer writes, the freshness gate catches any staleness regardless) — but leave to planner per discretion.

2. **Where exactly the task-done consolidation hook seam lives (D-02).**
   - What we know: Phase 20 deferred "wiring roles to call the consolidation render on task-done" to Phase 24. The render exists (`context-io.ts render`); the role-side call site is the seam.
   - What's unclear: whether the seam is in WF16, the Orchestrator decompose loop, or `_role-switch-protocol.md` step 4 (the deepest rewire, 11 handoff refs, currently "Produce the handoff").
   - Recommendation: the `_role-switch-protocol.md` step-4 rewrite is the natural call site — it already gates "produce output on task-done." Confirm during planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | committed `.js` + tsc build + vitest | ✓ (project floor) | 22+ LTS | — (hard prerequisite, CLAUDE.md) |
| typescript (`tsc`) | freshness build | ✓ dev dep | per package.json | — |
| vitest | test suite | ✓ dev dep | ~4.1.8 | — |

No external services, no network, no new tools. Code/config-only phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ~4.1.8 |
| Config file | `vitest.config.*` (project root; `test` script = `vitest run`) |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**'` (avoids the live claude-CLI e2e lane — see memory note) |
| Full suite command | `npm test` (NOTE: triggers the live e2e lane; prefer the excluded form for regression — [[grugops-npm-test-triggers-live-e2e]]) |
| Freshness gates | `npm run freshness` (committed `.js` drift) + `npm run freshness:context` + `npm run freshness:queue` + (NEW) `npm run freshness:traceability` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIGR-01 | Zero `agent-factory/handoffs/` refs in kit after rewire | gate | `node scripts/check-kit-refs.js` (flipped Assertion 2) | ✅ script / ❌ test (Wave 0) |
| MIGR-01 | `guard_context_writes` green on rewired prose | gate | `node scripts/check-foundation-guards.js` | ✅ `check-foundation-guards.test.ts` |
| MIGR-02 | 17 templates + 8 fixture dirs deleted; validator/catalog updated same change | unit + gate | `npx vitest run scripts/validate-agent-factory.test.ts install/install.test.ts` + `node scripts/validate-agent-factory.js` | ⚠️ expectations MOVE |
| MIGR-02 | install no longer seeds `plans/handoffs/` | unit | `npx vitest run install/install.test.ts` (invert the `:299-308` assertion) | ⚠️ assertion inverts |
| MIGR-03 | Trace preserved on note refs; `traceability.md` is a deterministic render | unit | `npx vitest run scripts/trace-render.test.ts` | ❌ Wave 0 |
| MIGR-03 | Stale trace fails closed | gate | `node scripts/<trace-freshness>.js` (clone now-running-freshness) | ❌ Wave 0 |
| MIGR-04 | `--migrate` backs up `plans/handoffs/` → `.bak.<ISO>` | unit | `npx vitest run install/install.test.ts` | ⚠️ extend existing migrate cases |

### D-15 Both-Direction Adversarial Proof (grep-to-zero flip — MANDATORY)
The flipped `check-kit-refs.ts` Assertion 2 is a trace/safety surface — a green suite is NOT proof ([[grugops-safety-invariant-green-suite-insufficient]]). Required, against the **committed `.js`** (not the `.ts`):
- **RED direction:** plant a `agent-factory/handoffs/anything.md` reference into a hermetic `CHECK_ROOT` mirror SCAN file → `node scripts/check-kit-refs.js` exits 1 naming the stray.
- **GREEN direction:** a clean (rewired, templates-deleted) mirror → exits 0.
- **Backpressure proof:** with the flip applied but the rewire incomplete, the gate runs RED against the committed `.js` (proves the change can't go green prematurely — mirrors the Phase-23 WR-05 both-direction discipline).
- File: **`scripts/check-kit-refs.test.ts` (NEW — does not exist today)** using the `now-running-freshness.test.ts` `spawnSync` + `CHECK_ROOT` idiom.

### D-03 Trace Freshness Test (fail-closed)
- exit 0 when committed `traceability.md` matches a fresh regen from notes.
- exit non-zero naming the file + "STALE" when a note is edited without re-render.
- greenfield vacuous pass (no notes yet → exit 0).
- fail-closed: a regen that does not run cleanly never reports "fresh".
- File: `scripts/<trace-freshness>.test.ts` (NEW, clone `now-running-freshness.test.ts`).

### D-18/D-20 `--migrate` Backup Test Cases
- **backup:** `plans/handoffs/` exists → renamed to `plans/handoffs.bak.<ISO>`; original gone; backup present; marker/report printed.
- **idempotent:** second `--migrate` with no `plans/handoffs/` → "nothing to migrate" clean no-op (exit 0, no new artifact).
- **dry-run:** `DRY_RUN=1 --migrate` → prints `would-backup ... → ...bak...`; filesystem unchanged.
- **never-clobber / collision abort:** a pre-existing `plans/handoffs.bak.<ISO>` of the same name → ABORT with a clear message, original untouched (D-18). (Millisecond `isoStamp` makes routine collision unlikely; the abort is the safety floor.)
- **reversible:** the `.bak` dir + `git revert` is the documented rollback (assert the README documents it).
- Files: extend `install/install.test.ts` migrate cases (already has 8 migrate cases at `:568+`).

### Sampling Rate
- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness`
- **Per wave merge:** full non-e2e suite + all four freshness gates + `node scripts/check-kit-refs.js` + `node scripts/check-foundation-guards.js` + `node scripts/validate-agent-factory.js`
- **Phase gate:** the D-15 adversarial RED-vs-`.js` reproduction run independently (orchestrator probe + code-review, per the Phase-23 lesson that a logic-probe ≠ the input-surface code-review).

### Wave 0 Gaps
- [ ] `scripts/check-kit-refs.test.ts` — NEW; covers MIGR-01 grep-to-zero + D-15 both-direction (the gate is currently untested).
- [ ] `scripts/trace-render.ts` + `scripts/trace-render.test.ts` — NEW; covers MIGR-03 render (D-01).
- [ ] `scripts/<trace-freshness>.ts` + test + `freshness:traceability` package.json script — NEW; covers D-03 fail-closed.
- [ ] Move/invert `install.test.ts:299-308` (asserts `plans/handoffs/` IS seeded) + `validate-agent-factory.test.ts` fixture expectations.
- [ ] Extend `install.test.ts` migrate cases with the 4 D-18/D-20 handoffs-backup cases.

## Security Domain

> `security_enforcement` treated as enabled (no `false` in config). This is a kit-text + tooling refactor with no auth/session/crypto surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | The `--migrate` flag parser already exits 2 on unknown args (`install.ts:94-97`); the backup-shape matcher `GRUGOPS_BACKUP_SUFFIX` is tightly anchored (no loose `*.bak`). |
| V6 Cryptography | no | — |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `--migrate` deletes user data (clobber/overwrite) | Tampering / Denial | Never-delete-first rename-to-backup (D-18); abort on `.bak.<ISO>` collision; reuse `backupIfDiffers`. CLAUDE.md installer hard constraint (additive, reversible, never-overwrite). |
| Faked grep-to-zero gate pass | Repudiation (trace = proof) | D-15 both-direction adversarial proof vs committed `.js`; no-fabrication (`UNKNOWN - verify`, never fake a gate). |
| Silent trace loss after handoff deletion | Repudiation | D-03 fail-closed freshness gate; D-04 validator trace-completeness check re-pointed, not removed. |
| `git revert` rollback leaves orphaned state | — | Documented rollback = backup dir + `git revert` (D-20); the `.bak.<ISO>` dir is preserved out-of-band so a revert + restore is lossless. |

**Voice discipline (CLAUDE.md hard rule):** the trace render, the grep-to-zero gate, the freshness gate, and the `--migrate` report/error strings are trace + safety surfaces → **clear professional voice, never caveman**. Caveman voice stays confined to the role prompts' persona blocks (D-discretion).

## Project Constraints (from CLAUDE.md)

- **Markdown-only kit; TS tooling layer only.** `node:fs`-only TS → `tsc` → committed `.js` → freshness-checked → vitest. Deps `{typescript, vitest, @types/node}` only; ZERO host runtime deps.
- **Single-source: reference, never restate.** Roles reference WF16 (D-10); gate logic single-sourced in `05-pr-quality-gate.md` / the existing scripts — never fork.
- **No-fabrication.** Never fake a passing gate/test/citation; `UNKNOWN - verify` for unknowns. (Directly governs D-15.)
- **Voice discipline.** Clear voice on trace / validator / gate / safety / installer surfaces; caveman only in role persona prompts.
- **Installers idempotent / additive / dry-run / reversible / never-overwrite.** (Governs D-17..D-20 — already honored by the existing `--migrate` machinery to inherit.)
- **Every committed `.js` must be a faithful `tsc` build of its `.ts`** (freshness gate, exit 0). Any `.ts` edit → rebuild before commit.
- **GSD workflow enforcement.** All edits go through a GSD command (this is plan-phase research).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | Rewire 18 roles + 16 workflows (`00`–`15`) + 3 packaging templates + AGENTS.md off handoffs onto the substrate (substrate-first) | Verified ref counts per file (heaviest: `_role-switch-protocol.md` 11, `00-bootstrap-greenfield.md` 12, `orchestrator.md` 7, `software-engineer.md` 5, `04`/`05` 9 each). `guard_context_writes` SCAN set + calibration (D-10). Workflows `16`/`17`/`18` confirmed 0 refs (note-native, leave them). |
| MIGR-02 | Delete 17 templates + `plans/handoffs/` seed; update validator + catalog SAME change | 17 templates confirmed (incl. `frontend-handoff.md`, the 17th, absent from both frozen lists). `FROZEN_HANDOFFS` at validator 136-153 + uses 253-256. `generate-catalog.ts` has zero handoff refs (A1). Seed = `install.ts:1004-1011` mkdir (NOT `agent-factory/seed/`, which has no handoffs dir — verified). 8 fixture dirs + `check-uat-oracles.ts:318` to adjust. |
| MIGR-03 | Migrate trace onto note `refs`; preserved end-to-end | `context-io.ts render` (913) is the render template; validator trace check (432-466) keyed by ticket id re-points (D-04). New `trace-render.ts` + `freshness:traceability` gate cloned from `now-running-freshness.ts`. |
| MIGR-04 | `install.ts --migrate` renames user `plans/handoffs/` → timestamped backup, never delete-first; `git revert` rollback | `--migrate` flag already parsed (88-89); `backupIfDiffers` (563), `isoStamp()` (193), `GRUGOPS_BACKUP_SUFFIX` (201) are the exact primitives. Fold the handoffs-backup into the existing v1.2 migrate orchestration (D-17 reconcile). 4 new test cases (D-18/D-20). |

## Sources

### Primary (HIGH confidence — live files this session)
- `agent-factory/handoffs/` (17 files), `agent-factory/roles/` (18), `agent-factory/workflows/` (19), `agent-factory/packaging/` (3) — counts + per-file handoff-ref tallies.
- `scripts/check-kit-refs.ts` — Assertion 2 (158-180), ALLOW ERE (69-71), SCAN set (45-55), no test file.
- `scripts/validate-agent-factory.ts` — `FROZEN_HANDOFFS` (136-153, 253-256), trace check (432-466).
- `scripts/check-foundation-guards.ts` — `guard_context_writes` (554-614), SCAN set + calibration (562-602).
- `scripts/check-uat-oracles.ts` — `FROZEN_HANDOFFS` parity (318, 326-368).
- `scripts/context-io.ts` — `render()` (913-963), `appendNote`/`readContext`/`atomicWrite`/`noteId`.
- `scripts/now-running-freshness.ts` (full) + `scripts/now-running-freshness.test.ts` (idiom).
- `scripts/context-freshness.ts` (header — the `freshness:context` kind that does NOT cover `plans/`).
- `install/install.ts` — flag parse (70-98), `isoStamp` (193), `GRUGOPS_BACKUP_SUFFIX` (201), `backupIfDiffers` (563-585), `migratePreSteps` (704+), `seedState` plans/handoffs mkdir (1004-1011).
- `install/install.test.ts` — migrate cases (568+), plans/handoffs seed assertion (299-308).
- `package.json` — scripts (freshness lanes), deps.
- `agent-factory/seed/plans/` — confirmed NO `handoffs/` dir.

### Secondary (MEDIUM confidence)
- `.planning/phases/24-.../24-CONTEXT.md` (D-01..D-20) — cross-checked against live files; CONTEXT line-number estimates confirmed accurate.
- MEMORY.md notes [[grugops-safety-invariant-green-suite-insufficient]], [[grugops-npm-test-triggers-live-e2e]].

### Tertiary (LOW confidence)
- A1 (`generate-catalog.ts` catalog regen behavior) — verify by regenerating in the deletion change.

## Metadata

**Confidence breakdown:**
- Standard stack (existing assets): HIGH — every reusable primitive read line-by-line.
- Architecture (rewire-then-atomic-delete): HIGH — mirrors verified Phase-23 WR-05 discipline; all touch-points pinned to live line numbers.
- Pitfalls: HIGH — the 17th-template, untested-gate, and shared-`--migrate`-flag pitfalls were each confirmed against source, not assumed.
- Validation architecture: HIGH for the clone templates (verified files); MEDIUM on fixture-expectation blast radius (A3).

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable internal codebase; revalidate if any of the 5 gate scripts or `install.ts` change before planning)
