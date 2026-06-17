---
phase: 20
slug: shared-context-substrate-concurrency-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `20-RESEARCH.md` § Validation Architecture. Per-task IDs are
> assigned by the planner; the SC→test map below is the binding contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (globals:false → explicit imports; spawn-the-compiled-`.js` child-process oracle idiom) |
| **Config file** | `package.json` `scripts.test = "vitest run"` |
| **Quick run command** | `npx vitest run scripts/context-io.test.ts scripts/claim.test.ts scripts/context-freshness.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | ~20 seconds (excludes the live claude-CLI e2e lane, which spends tokens/can hang) |

> **Test idiom (mandatory, from every existing `*.test.ts`):** spawn the **COMPILED `.js`**
> as a child process (never the `.ts`); assert exit-code-as-signal + finding text;
> plant-and-restore any mutated committed file under `afterEach`/`afterAll`; use a hermetic
> temp mirror (`mkdtempSync`+`cpSync`) + a `CHECK_ROOT`/fixture-root override for guard/freshness
> fail cases. **Prove BOTH a PASS path and a planted FAIL** — a gate that can only pass is
> fabricated green (CLAUDE.md Constraint #6).

---

## Sampling Rate

- **After every task commit:** `vitest run scripts/<artifact>.test.ts` + `npm run build` (keep committed `.js` fresh) + `npm run freshness` (build-output gate auto-covers the new `.js`).
- **After every plan wave:** full suite `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness` + `npm run freshness:catalog` + `npm run freshness:context` (new) + `node scripts/check-foundation-guards.js`.
- **Before `/gsd-verify-work`:** full suite green + all three freshness gates green + the foundation-guard aggregator green.
- **Max feedback latency:** ~20 seconds.
- **Honest carve-out:** true-NFS runtime atomicity is carried as `UNKNOWN - verify` (not a failing gate); DOGF-02 (Phase 26) is the eventual real concurrency oracle.

---

## SC → Test Map (ROADMAP Success Criteria — the binding contract)

| SC | Behavior | Test Type | Automated Command | Status |
|----|----------|-----------|-------------------|--------|
| SC-1 | Six-kind note with a complete provenance fence validates; a note missing a required provenance field is a validator structural **FAIL** | deterministic validator unit (GOOD fixture exit 0 + one-mutation BAD fixture nonzero naming the missing field) | `npx vitest run scripts/context-io.test.ts` | ⬜ pending |
| SC-2 | Two concurrent writes via `appendNote`/`atomicWrite` produce two distinct un-clobbered notes (no lost-update, no torn append), incl. the Windows unlink-then-rename path | (a) concurrent-write unit (N writers → N distinct well-formed files); (b) **real `windows-latest` CI leg** runs the unlink-then-rename branch | `npx vitest run scripts/context-io.test.ts` on `os: [ubuntu-latest, windows-latest]` | ⬜ pending |
| SC-3 | `pending→claimed→done` by atomic rename; `mkdirSync` claim is exclusive (2nd claimant fails `EEXIST`); no central lock manager | deterministic claim unit (claim once → true; same task again → false/EEXIST; rename transitions assert moves; sweep reclaims a TTL-expired claim) | `npx vitest run scripts/claim.test.ts` | ⬜ pending |
| SC-4 | Committed per-task JSONL regenerates **byte-identically** from markdown; editing markdown without regenerating trips `freshness:context` (fail-closed); markdown wins | freshness-drift unit: fresh tree → exit 0 "fresh"; plant a byte of drift → nonzero "STALE"; break regen → fail-closed nonzero | `npx vitest run scripts/context-freshness.test.ts` + `npm run freshness:context` | ⬜ pending |
| SC-5 | `guard_context_writes` fails **RED** on a planted raw-write bypassing `context-io.ts`; passes on the sanctioned-only tree | planted-fixture guard test (hermetic-mirror plant: append a raw write line, run compiled guard with `CHECK_ROOT` → nonzero naming SCTX-05; real tree → green) | `npx vitest run scripts/check-foundation-guards.test.ts` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/context-io.test.ts` — SC-1 (schema validate FAIL) + SC-2 (concurrent un-clobbered writes + Windows branch)
- [ ] `scripts/claim.test.ts` — SC-3 (rename transitions + `mkdirSync` exclusivity + TTL sweep reclaim)
- [ ] `scripts/context-freshness.test.ts` — SC-4 (fresh PASS / planted-drift STALE / fail-closed) — clone `catalog-freshness.test.ts`
- [ ] `scripts/check-foundation-guards.test.ts` — EXTEND with the SC-5 planted-raw-write `guard_context_writes` case
- [ ] `.github/workflows/*.yml` — add `windows-latest` to the test-job matrix (SC-2 real Windows-branch proof — locate the existing workflow first)
- [ ] `package.json` — add `"freshness:context"` script (mirror `freshness:catalog`)
- [ ] No framework install needed (vitest present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| True-NFS `mkdirSync`/rename atomicity under genuine concurrent multi-host spawn | CLAIM-02 / SC-3 | No NFS mount in CI; faking a green violates Constraint #6 | Carried as `UNKNOWN - verify`; the real gate is DOGF-02 (Phase 26 N-agent parallel dogfood). PAR-05 (advisory leases) is the documented fallback IF `mkdirSync`-claim races on NFS. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
