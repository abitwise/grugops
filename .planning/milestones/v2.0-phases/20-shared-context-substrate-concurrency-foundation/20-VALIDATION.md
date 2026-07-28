---
phase: 20
slug: shared-context-substrate-concurrency-foundation
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-17
audited: 2026-07-21
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
| SC-1 | Six-kind note with a complete provenance fence validates; a note missing a required provenance field is a validator structural **FAIL** | deterministic validator unit (GOOD fixture exit 0 + one-mutation BAD fixture nonzero naming the missing field) | `npx vitest run scripts/context-io.test.ts` | ✅ green |
| SC-2 | Two concurrent writes via `appendNote`/`atomicWrite` produce two distinct un-clobbered notes (no lost-update, no torn append), incl. the Windows unlink-then-rename path | (a) concurrent-write unit (N writers → N distinct well-formed files); (b) **real `windows-latest` CI leg** runs the unlink-then-rename branch | `npx vitest run scripts/context-io.test.ts` on `os: [ubuntu-latest, windows-latest]` | ✅ green — SC-2 tests observed ✓ on a real windows-latest runner (run 29824410110, 2026-07-21); job-level exit 0 is a Manual-Only item below |
| SC-3 | `pending→claimed→done` by atomic rename; `mkdirSync` claim is exclusive (2nd claimant fails `EEXIST`); no central lock manager | deterministic claim unit (claim once → true; same task again → false/EEXIST; rename transitions assert moves; sweep reclaims a TTL-expired claim) | `npx vitest run scripts/claim.test.ts` | ✅ green (incl. fully green on the windows-latest leg) |
| SC-4 | Committed per-task JSONL regenerates **byte-identically** from markdown; editing markdown without regenerating trips `freshness:context` (fail-closed); markdown wins | freshness-drift unit: fresh tree → exit 0 "fresh"; plant a byte of drift → nonzero "STALE"; break regen → fail-closed nonzero | `npx vitest run scripts/context-freshness.test.ts` + `npm run freshness:context` | ✅ green (incl. fully green on the windows-latest leg) |
| SC-5 | `guard_context_writes` fails **RED** on a planted raw-write bypassing `context-io.ts`; passes on the sanctioned-only tree | planted-fixture guard test (hermetic-mirror plant: append a raw write line, run compiled guard with `CHECK_ROOT` → nonzero naming SCTX-05; real tree → green) | `npx vitest run scripts/check-foundation-guards.test.ts` | ✅ green local+ubuntu; windows-latest false-fire root-caused (CRLF checkout) and fixed via `.gitattributes` LF pins 2026-07-21 — Windows re-proof is a Manual-Only item below |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/context-io.test.ts` — SC-1 (schema validate FAIL) + SC-2 (concurrent un-clobbered writes + Windows branch)
- [x] `scripts/claim.test.ts` — SC-3 (rename transitions + `mkdirSync` exclusivity + TTL sweep reclaim)
- [x] `scripts/context-freshness.test.ts` — SC-4 (fresh PASS / planted-drift STALE / fail-closed) — clone `catalog-freshness.test.ts`
- [x] `scripts/check-foundation-guards.test.ts` — EXTEND with the SC-5 planted-raw-write `guard_context_writes` case
- [x] `.github/workflows/ci.yml` — `windows-latest` in the test-job matrix (created in 20-04; the workflow did not previously exist)
- [x] `package.json` — `"freshness:context"` script present (mirrors `freshness:catalog`)
- [x] No framework install needed (vitest present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| True-NFS `mkdirSync`/rename atomicity under genuine concurrent multi-host spawn | CLAIM-02 / SC-3 | No NFS mount in CI; faking a green violates Constraint #6 | Carried as `UNKNOWN - verify`; the real gate is DOGF-02 (Phase 26 N-agent parallel dogfood). PAR-05 (advisory leases) is the documented fallback IF `mkdirSync`-claim races on NFS. |
| `windows-latest` CI job exits 0 (SC-2 job-level criterion; SC-5 tests executing green on a real Windows checkout) | SC-2 / SC-5 | Only observable on a pushed GitHub Actions run — cannot be executed from a darwin box. First two real runs (2026-07-15, 2026-07-21) were red: `.gitattributes` pinned only committed `.js` to LF, so all other text checked out CRLF on the runner and broke line-anchored/byte-exact oracles (SC-5 guard false-fired; the SC-2-specific tests themselves passed). Root cause fixed 2026-07-21 (all text types pinned `eol=lf`; renormalize proved a no-op — no committed blob had CRLF). | On the next push to main, observe the `test (windows-latest)` job of `ci.yml`: expect exit 0 with the full vitest summary green. When observed, this row is retired. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (all commands are `vitest run`)
- [x] Feedback latency < 30s (quick run ≈ 10s observed)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-21 via `/gsd-validate-phase` audit — 164/164 across the four SC test files locally; full suite 794 passed / 1 skipped; all freshness gates + foundation-guard aggregator exit 0.

---

## Validation Audit 2026-07-21

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

**Gap:** SC-5 PARTIAL — `guard_context_writes` calibration cases ("prose stays GREEN", real-tree smoke) false-fired on the `windows-latest` CI leg (runs 29416908887 and 29824410110; ubuntu green both times). Root cause: `.gitattributes` pinned only committed `.js` + the catalog README to LF, so every other text file checked out CRLF on the Windows runner (Git for Windows `autocrlf=true`), breaking line-anchored regexes and byte-exact oracles suite-wide (~26 Windows failures, most outside Phase 20's scope: install, catalog/ASVS reproducibility, the P25 `admit()` byte-hash baseline).

**Resolution:** extended `.gitattributes` to pin all text types (`*.md *.ts *.json *.yml *.sh` etc.) to `eol=lf`; `git add --renormalize .` proved a no-op (no committed blob contained CRLF — the corruption existed only on Windows checkout). Local proof: full suite 794 passed / 1 skipped, `freshness` + `freshness:catalog` + `freshness:context` + foundation-guard aggregator all exit 0. The Windows re-proof (job exits 0) is only observable on the next pushed CI run — recorded as a Manual-Only row, not claimed.

**Also observed (positive):** the SC-2 Windows unlink-then-rename proof that 20-VERIFICATION.md carried as "never observed on a real runner" HAS now been observed — the SC-2 concurrent-writer and atomic-write tests passed ✓ on the real `windows-latest` runner in run 29824410110.
