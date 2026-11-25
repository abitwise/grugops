---
phase: "44"
slug: "upstream-source-declaration-and-pin-check"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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

Statuses read from the phase-gate full-suite run on 2026-11-25 (12,368 tests; the only failure, `install/installer-fs-census.test.ts`, is the pre-existing DI-03 baseline red). Pass counts per filter: upstream-model 167, validate upstream 16, none declared 3, pinned bytes 2, adversarial git 5, subcommands 2, check states 7, never moves a pin 3, unknown 19, exit-contract upstream 3, fence 16, note upstream 1, blob-mismatch 4, trace-model upstream/BR 10.

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| UP-01 | closed keys, grammars, inside/ancestor refusal, absent block = no finding | unit | `npx vitest run scripts/upstream-model.test.ts` | ✅ | ✅ green |
| UP-01 | validator arm errs on malformed present block, silent when absent | unit (fixture) | `npx vitest run scripts/validate.test.ts -t upstream` | ✅ | ✅ green |
| UP-01 | no config / no `upstream` → exit 0, "no upstream sources declared" | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "none declared"` | ✅ | ✅ green |
| UP-02 | dirty tree, moved HEAD, autocrlf read identical pinned bytes; nothing written to `memory-bank/` | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "pinned bytes"` | ✅ | ✅ green |
| UP-02 | adversarial git (replace refs, GIT_DIR, partial clone, symlink, gitlink, `..`, over-ceiling, NUL) refused or neutralized | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "adversarial git"` | ✅ | ✅ green |
| UP-02 | git subcommand allow-list | unit | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "subcommands"` | ✅ | ✅ green |
| UP-03 | match / head-moved / blob-mismatch / UNKNOWN lines and exit codes | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "check states"` | ✅ | ✅ green |
| UP-03 | no write verb; config bytes unchanged | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "never moves a pin"` | ✅ | ✅ green |
| UP-04 | missing path, no git, absent commit, toplevel mismatch, malformed manifest, hash-algo mismatch → named `UNKNOWN - verify`, exit 2 | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "unknown"` | ✅ | ✅ green |
| UP-04 | exit-2 contract under injected throw | integration | `npx vitest run scripts/runnable-ref/runnable-exit-contract.test.ts` | ✅ | ✅ green |
| UP-05 | fence exact; forged END does not end fence; ANSI stripped | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "fence"` | ✅ | ✅ green (20 passed, 2026-11-25): plan 44-09 adds the forged-path cases that forge the path inside the BEGIN line (CR-01), plan 44-10 the cell-text cases (CR-02) |
| UP-05 | a listed path carrying ` blob=<x>` and the BEGIN tail is `UNKNOWN - verify` through `check`, `read <ID>` and `read --manifest`; a forged END inside a valid file stays inside the fence (CR-01) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "forged path"` | ✅ | ✅ green (3 passed) |
| UP-05 | prose in each of the four manifest cells, and a prose-like listed path, reaches neither stdout nor stderr of `check` or `read` (CR-02) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "cell text"` | ✅ | ✅ green (11 passed) |
| UP-05 | the path grammar accepts `a<c>b` only for ASCII letters, digits, `.`, `_`, `-` and `/` over every UTF-16 code unit | unit | `npx vitest run scripts/upstream-model.test.ts -t "code-point sweep"` | ✅ | ✅ green (1 passed) |
| UP-05 | a git message quoted in a reason names `<listed path>`, never the listed path (T-44-38) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "git message"` | ✅ | ✅ green (3 passed) |
| UP-05, UP-04 | Workflow 17 session-start step 4 reports `BLOCKED` with the reason Workflow 20 names, never a printed reason (CR-02 kit half) | unit | `npx vitest run scripts/flow-guidance-text.test.ts -t "session start step 4"` | ✅ | ✅ green (1 passed; file 166 passed) |
| UP-05 | every reworded safety clause in Workflows 20 and 17 has a disposition row | gate | `npm run check:diff-disposition` | ✅ | ✅ green (ALL CHECKS PASSED) |
| UP-02 | a partial clone under a git that reports 2.44 is refused before any object read, on either partial-clone key; a promisor set to false is not partial (WR-01) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "partial clone guard"` | ✅ | ✅ green (3 passed; older git played by a wrapper, no real git below 2.45 run) |
| TRC-02 | `upstream.js check` prints one `runnable-version-skew` line per sibling from another build, after the source lines, and the exit code is unchanged (WR-03) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "version skew"` | ✅ | ✅ green (11 passed) |
| UP-05 | `upstream:` ref round-trips through `note.js add/read` | integration | `npx vitest run scripts/runnable-ref/note.test.ts -t upstream` | ✅ | ✅ green |
| UP-06 | declared `entry_blob` ≠ blob at pin → `drift <id>: blob-mismatch` | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t "blob-mismatch"` | ✅ | ✅ green |
| TRC-02 | upstream ref → Requirement column; `BR-3` → Requirement, no phantom row | unit | `npx vitest run scripts/trace-model.test.ts` | ✅ | ✅ green |
| TRC-02 | embedded copies fresh | gate | `npm run freshness:runnable-embeds` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/upstream-model.test.ts` — grammars, manifest parse (CRLF, BOM, pipe-in-cell, duplicate ID, bad successor), pin-state decision table, fence, blob id (sha1 and sha256)
- [x] `scripts/runnable-ref/upstream.test.ts` — test-support helper building synthetic upstream repos in `mkdtemp` (isolated git config, invented IDs); shallow, partial, sha256, replace, symlink, submodule variants and the injection repo; generated at test time, nothing committed
- [x] `scripts/runnable-ref/runnable-exit-contract.test.ts` — row for `upstream`
- [x] `scripts/trace-model.test.ts` — upstream ref and `BR` cases
- [x] `scripts/validate.test.ts` — validator fixture cases for `upstream`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A live agent ignores instructions embedded in upstream content (canary file not created, pin unchanged, upstream untouched, no nested CLAUDE.md load in an `InstructionsLoaded` log) | UP-05 | Needs a live host agent session; behavior of a model cannot be asserted by a unit test | End-of-phase red-team UAT against the synthetic injection fixture; record the result |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** `nyquist_compliant: true` set on 2026-11-25 by plan 44-14, from the gap-closure round 1 filters: forged path 3, cell text 11, code-point sweep 1, version skew 11, partial clone guard 3, git message 3, flow-guidance-text 166 (step 4: 1), fence 20, each with no failure, and `check:diff-disposition` ALL CHECKS PASSED. The live UP-05 red-team round stays manual and owed at /gsd-verify-work.

## Validation Audit 2026-11-25

| Metric | Count |
|---|---|
| Gaps found | 1 |
| Resolved | 0 |
| Escalated | 1 |

## Validation Audit 2026-11-25 (gap-closure round 1, plans 44-09 to 44-14)

| Metric | Count |
|---|---|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

The gap was the UP-05 fence (CR-01 and CR-02). Plans 44-09 and 44-10 fixed it in the code and added the `forged path`, `cell text` and `code-point sweep` regressions; plans 44-11 to 44-13 added the `version skew`, `partial clone guard`, `git message` and Workflow 17 step 4 checks. Each filter was run on 2026-11-25 by plan 44-14 and passed with no failure. The full suite was not re-run here; the phase gate compares it by test name against the baseline. The live UP-05 red-team round stays a manual verification.

## Validation Audit 2026-11-25

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Audit after gap-closure round 1. The phase-gate full suite ran at d3a0869d on 2026-11-25: 12,440 tests, 12,437 passed, 2 skipped and 1 failed. The failure is the DI-03 baseline red in `install/installer-fs-census.test.ts`, which no row above covers. Every Per-Task Map command is green, and no requirement is PARTIAL or MISSING. The live UP-05 red-team round stays manual.
