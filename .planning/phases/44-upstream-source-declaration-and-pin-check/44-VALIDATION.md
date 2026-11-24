---
phase: "44"
slug: "upstream-source-declaration-and-pin-check"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-24"
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 |
| **Config file** | `vitest.config.ts` (excludes runnable fixtures and `.temp/`) |
| **Quick run command** | `npx vitest run scripts/upstream-model.test.ts scripts/runnable-ref/upstream.test.ts scripts/trace-model.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (more than 600 s; compare failures by name against a baseline) |
| **Estimated runtime** | ~30 seconds (quick); >600 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run the quick run command plus `npx tsc --noEmit`
- **After every plan wave:** Run the quick run command, `npm run freshness`, and the guard scripts (`check-foundation-guards.js`, `check-audit-register.js`, `check-imperative-lexicon.js`, `check-banned-claims.js`, `check-claim-anchors.js`)
- **Before `/gsd-verify-work`:** Full suite must be green against the baseline (compare by test name); red-team round recorded
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

To be filled by the planner and executor from the plans. Seed map from 44-RESEARCH.md § Validation Architecture:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| UP-01 | closed keys, grammars, inside/ancestor refusal, absent block = no finding | unit | `npx vitest run scripts/upstream-model.test.ts` | ❌ W0 | ⬜ pending |
| UP-01 | validator arm errs on malformed present block, silent when absent | unit (fixture) | `npx vitest run scripts/validate.test.ts -t upstream` | ✅ file, ❌ cases | ⬜ pending |
| UP-01 | no config / no `upstream` → exit 0, "no upstream sources declared" | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "none declared"` | ❌ W0 | ⬜ pending |
| UP-02 | dirty tree, moved HEAD, autocrlf read identical pinned bytes; nothing written to `memory-bank/` | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "pinned bytes"` | ❌ W0 | ⬜ pending |
| UP-02 | adversarial git (replace refs, GIT_DIR, partial clone, symlink, gitlink, `..`, over-ceiling, NUL) refused or neutralized | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "adversarial git"` | ❌ W0 | ⬜ pending |
| UP-02 | git subcommand allow-list | unit | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "subcommands"` | ❌ W0 | ⬜ pending |
| UP-03 | match / head-moved / blob-mismatch / UNKNOWN lines and exit codes | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "check states"` | ❌ W0 | ⬜ pending |
| UP-03 | no write verb; config bytes unchanged | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "never moves a pin"` | ❌ W0 | ⬜ pending |
| UP-04 | missing path, no git, absent commit, toplevel mismatch, malformed manifest, hash-algo mismatch → named `UNKNOWN - verify`, exit 2 | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "unknown"` | ❌ W0 | ⬜ pending |
| UP-04 | exit-2 contract under injected throw | integration | `npx vitest run scripts/runnable-ref/runnable-exit-contract.test.ts` | ✅ file, ❌ row | ⬜ pending |
| UP-05 | fence exact; forged END does not end fence; ANSI stripped | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "fence"` | ❌ W0 | ⬜ pending |
| UP-05 | `upstream:` ref round-trips through `note.js add/read` | integration | `npx vitest run scripts/runnable-ref/note.test.ts -t upstream` | ✅ file, ❌ case | ⬜ pending |
| UP-06 | declared `entry_blob` ≠ blob at pin → `drift <id>: blob-mismatch` | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "blob-mismatch"` | ❌ W0 | ⬜ pending |
| TRC-02 | upstream ref → Requirement column; `BR-3` → Requirement, no phantom row | unit | `npx vitest run scripts/trace-model.test.ts` | ✅ file, ❌ cases | ⬜ pending |
| TRC-02 | embedded copies fresh | gate | `npm run freshness:runnable-embeds` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/upstream-model.test.ts` — grammars, manifest parse (CRLF, BOM, pipe-in-cell, duplicate ID, bad successor), pin-state decision table, fence, blob id (sha1 and sha256)
- [ ] `scripts/runnable-ref/upstream.test.ts` — test-support helper building synthetic upstream repos in `mkdtemp` (isolated git config, invented IDs); shallow, partial, sha256, replace, symlink, submodule variants and the injection repo; generated at test time, nothing committed
- [ ] `scripts/runnable-ref/runnable-exit-contract.test.ts` — row for `upstream`
- [ ] `scripts/trace-model.test.ts` — upstream ref and `BR` cases
- [ ] `scripts/validate.test.ts` — validator fixture cases for `upstream`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A live agent ignores instructions embedded in upstream content (canary file not created, pin unchanged, upstream untouched, no nested CLAUDE.md load in an `InstructionsLoaded` log) | UP-05 | Needs a live host agent session; behavior of a model cannot be asserted by a unit test | End-of-phase red-team UAT against the synthetic injection fixture; record the result |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
