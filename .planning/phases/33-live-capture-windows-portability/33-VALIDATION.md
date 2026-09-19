---
phase: "33"
slug: "live-capture-windows-portability"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-19"
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (dev-only; no framework install needed) |
| **Config file** | `vitest.config.ts` (plan 33-02 adds `testTimeout`, `hookTimeout`, `slowTestThreshold`) |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**' <file>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **NEVER run** | `npm test` — bare `vitest run`, collects the live lane, spends tokens on an authenticated box |
| **Build gate** | `npm run build && npm run check:build-parity` (after any `.ts` change) |
| **Typecheck gate** | `npm run typecheck` (shipped source + test-inclusive + fixture targets) |
| **Estimated runtime** | full lane ~14 min locally; single-file quick runs seconds to ~90 s |

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**' <the touched test file>`,
  plus `npm run build && npm run check:build-parity` whenever a `.ts` changed.
- **After every plan wave:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run typecheck` +
  `node scripts/check-platform-shapes.js` + `npm run check:nul-bytes`.
- **Before `/gsd-verify-work`:** full suite green locally, **then a pushed CI run with BOTH legs
  exiting 0** (CAP-02's literal bar, measured in plan 33-09).
- **Max feedback latency:** < 90 s for any single-file quick run.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 33-01-01 | 01 | 1 | CAP-03 | T-33-01..06 | Deny read only from a CLI-emitted channel; redaction fails closed; approval key never set | integration | `node scripts/capture-live.js --dry-run --out <dir>` | ❌ created by this task | ⬜ pending |
| 33-01-02 | 01 | 1 | CAP-03 | T-33-01 / T-33-03 | Raw-line match false, decoded match true; both home spellings redacted | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts` | ❌ created by this task | ⬜ pending |
| 33-01-03 | 01 | 1 | CAP-03 | T-33-05 | Readiness is a derived verdict distinct from the exit code | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts -t "precondition"` | ❌ created by 33-01-02 | ⬜ pending |
| 33-02-01 | 02 | 2 | CAP-02 | T-33-09 | No host-OS predicate on any bound | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts` | ✅ | ⬜ pending |
| 33-02-02 | 02 | 2 | CAP-02 | T-33-10 | ENOENT tolerated; any other read error re-thrown | unit | `rm -rf .temp && npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | ✅ | ⬜ pending |
| 33-02-03 | 02 | 2 | CAP-02 | T-33-08 | Derived depth bound; a refusal instead of a throw | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts -t "as deep as this platform permits"` | ✅ | ⬜ pending |
| 33-03-01 | 03 | 2 | CAP-02 | T-33-15 / T-33-16 | Normalize at the emit point only; partition written down | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/posix-path.test.ts` | ❌ created by this task | ⬜ pending |
| 33-03-02 | 03 | 2 | CAP-02 | T-33-15 | Dashboard stays mechanically read-only after the edit | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-kit-refs.test.ts scripts/board-dashboard.test.ts scripts/context-io.test.ts` | ✅ | ⬜ pending |
| 33-03-03 | 03 | 2 | CAP-02 | T-33-13 / T-33-14 | Mixed-spelling dedupe; exemption region located exactly once | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts` | ✅ | ⬜ pending |
| 33-07-01 | 07 | 2 | CAP-01 | T-33-36 / T-33-37 | Scope is an allow-list of derived parts, written into the manifest | source | `test -s <manifest> && grep -ac '^\| ' <manifest>` | ❌ created by this task | ⬜ pending |
| 33-07-02 | 07 | 2 | CAP-01 | T-33-34 / T-33-35 / T-33-38 | Two independently derived sides; no verdict over an underived input | integration | `node scripts/check-flip-manifest.js` | ❌ created by this task | ⬜ pending |
| 33-07-03 | 07 | 2 | CAP-01 | T-33-34 | Every refusal reproduced on a planted tree, each with its converse | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-flip-manifest.test.ts` | ❌ created by this task | ⬜ pending |
| 33-08-01 | 08 | 2 | CAP-01 | T-33-40 / T-33-43 | Keystone intact; approval key absence asserted at run time | unit | `npx vitest run scripts/e2e/uat-live.test.ts -t "loud-skip"` | ✅ | ⬜ pending |
| 33-08-02 | 08 | 2 | CAP-01 | T-33-41 / T-33-44 | One bound, two consumers; the ledger untouched here | unit | `git diff --exit-code -- .planning/WINDOWS.md` | ✅ | ⬜ pending |
| 33-08-03 | 08 | 2 | CAP-03 | T-33-42 | Header-only edit; matcher behavior identical | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/prod-deploy-deny-match.test.ts` | ✅ | ⬜ pending |
| 33-04-01 | 04 | 3 | CAP-02 | T-33-18 / T-33-21 | Spelling normalized, coverage not loosened; vacuity floor | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` | ✅ | ⬜ pending |
| 33-04-02 | 04 | 3 | CAP-02 | T-33-20 | No site normalized twice; watcher stays unconditional | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts scripts/check-uat-oracles.test.ts scripts/board-tracer.test.ts scripts/board-dashboard.test.ts` | ✅ | ⬜ pending |
| 33-04-03 | 04 | 3 | CAP-02 | T-33-19 | Two named arms, observed pair printed, no host branch | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts scripts/board-watch.test.ts scripts/board-model.test.ts scripts/generate-guarantees.test.ts` | ✅ | ⬜ pending |
| 33-05-01 | 05 | 3 | CAP-02 | T-33-26 / T-33-27 | Absence simulated, printed and survived | unit | `YAML_ORACLE_RUBY=grugops-no-such-interpreter npx vitest run --exclude '**/scripts/e2e/**' scripts/frontmatter.test.ts` | ✅ | ⬜ pending |
| 33-05-02 | 05 | 3 | CAP-02 | T-33-23 | Skip taken on the measurement; every absence counted in one remainder | integration | `node scripts/check-platform-shapes.js` | ✅ | ⬜ pending |
| 33-05-03 | 05 | 3 | CAP-02 | T-33-24 / T-33-25 | The arm under test answers; remainder size derived | unit | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts` | ✅ | ⬜ pending |
| 33-06-01 | 06 | 3 | CAP-02 | T-33-30 / T-33-31 | Canonical both sides; a contract disagreement is a finding | unit | `npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts` | ✅ | ⬜ pending |
| 33-06-02 | 06 | 3 | CAP-02 | T-33-29 | The failure names its layer | integration | `rm -rf .temp && npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts` | ✅ | ⬜ pending |
| 33-06-03 | 06 | 3 | CAP-02 | T-33-32 | The precondition script is provably unchanged | unit | `git diff --exit-code -- scripts/coordinator-resolution-precheck.ts` | ✅ | ⬜ pending |
| 33-09-01 | 09 | 4 | CAP-02 | T-33-47 | Every workflow command run locally and recorded | integration | `npx vitest run --exclude '**/scripts/e2e/**'` | ✅ | ⬜ pending |
| 33-09-02 | 09 | 4 | CAP-02 | T-33-46 | Blocking human confirmation before the push | **manual (blocking checkpoint)** | — | n/a | ⬜ pending |
| 33-09-03 | 09 | 4 | CAP-02 | T-33-48 / T-33-49 | Both legs read from the run; ledger only via the tool | integration | `gh run list --branch main --limit 5 --json databaseId,headSha,conclusion,createdAt` | ✅ | ⬜ pending |
| 33-10-01 | 10 | 5 | CAP-03 | T-33-52..56 | Zero-token readiness filed before any spend | integration | `node scripts/capture-live.js --dry-run --out .planning/phases/33-live-capture-windows-portability` | ❌ created by 33-01 | ⬜ pending |
| 33-10-02 | 10 | 5 | CAP-03 | T-33-56 | Per-occasion go; spend floor stated | **manual (blocking checkpoint)** | — | n/a | ⬜ pending |
| 33-10-03 | 10 | 5 | CAP-03 / CAP-01 | T-33-52..58 | One run; redaction and citation re-checkable after the fact | integration | `node scripts/capture-live.js --verify-artifacts --out .planning/phases/33-live-capture-windows-portability` | ❌ created by 33-01 | ⬜ pending |
| 33-11-01 | 11 | 6 | CAP-01 | T-33-61 | One-way flip gated by a human decision | **manual (blocking checkpoint)** | — | n/a | ⬜ pending |
| 33-11-02 | 11 | 6 | CAP-01 | T-33-59 / T-33-63 | Exactly the declared set; state-document line ceiling | integration | `node scripts/check-flip-manifest.js` | ❌ created by 33-07 | ⬜ pending |
| 33-11-03 | 11 | 6 | CAP-01 | T-33-60 | Residual set clean over a bounded denominator | integration | `npm run check:banned-claims && npm run check:public-docs && npm run check:claim-anchors && npm run check:residual-citations` | ✅ | ⬜ pending |
| 33-11-04 | 11 | 6 | CAP-01 | T-33-63 / T-33-64 | One artifact cited per row; state loads cleanly | integration | `node ~/.claude/gsd-core/bin/gsd-tools.cjs query state.load` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Every Wave-0 artifact is created by the FIRST task of the plan that needs it, inside wave 1 or 2 —
no task carries a `MISSING` sentinel and no plan waits on a scaffold another plan owns.

- [ ] `scripts/e2e/fixtures/capture-sample.jsonl` — the synthetic stream covering every parser
      (created by 33-01 Task 1): one init frame with plugins, two spawn tool-use blocks with distinct
      roles, nested frames for one and a task notification for the other, a hook response carrying a
      real deny envelope, a hook response carrying the admission guard's envelope as the negative
      control, and a result frame with cost and duration.
- [ ] `scripts/e2e/fixtures/capture-target/` — the runnable fixture project (created by 33-01 Task 1);
      no TypeScript anywhere under it, so it does not enter the build or the tracked-source census.
- [ ] `scripts/capture-live.test.ts` — the offline both-directions predicate suite (33-01 Task 2).
- [ ] `scripts/posix-path.test.ts` — the separator-parameterized normalizer's own suite (33-03 Task 1).
- [ ] `scripts/check-flip-manifest.test.ts` — the planted-tree reproduction suite (33-07 Task 3).
- [ ] `vitest.config.ts` gains `testTimeout`, `hookTimeout` and `slowTestThreshold` (33-02 Task 1) —
      the hook bound is the gap RESEARCH found in D-14.
- [ ] No framework install is needed; no package is added.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A live captured run shows at least two distinct granted role agents executing with own-session evidence | CAP-03 | A model call cannot be a CI gate: it costs money (≥ 4.33 USD measured) and D-09 caps it at one run per gap-closure round behind a blocking human go | Plan 33-10: dry run exits 0 and reports ready → blocking checkpoint states the spend floor → `node scripts/capture-live.js` → the summary's CAP-03 verdict and its named reasons |
| The push to the protected default branch | CAP-02 | Humans hold merge on this project, mechanically not by prose | Plan 33-09 Task 2: read the pre-push inventory, `git log --oneline origin/main..HEAD`, then answer the blocking checkpoint |
| The one-way GAP-D1 flip across four milestones' records | CAP-01 | D-17 rates it one-way; undoing it is a second manifest-driven edit plus a status reversal, not a revert | Plan 11 Task 1: read the capture summary and the manifest, then select flip, hold, or correction-only |
| Both CI legs exit 0 | CAP-02 | Only a pushed run can answer it; a local suite on one operating system cannot | Plan 33-09 Task 3: read both legs' conclusion fields from the run's own metadata and record the run id |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a named blocking checkpoint (three checkpoints, each
      gating an irreversible act: money, a protected branch, a one-way ledger flip)
- [x] Sampling continuity: no 3 consecutive automated tasks without an automated verify
- [x] Wave 0 covers all MISSING references — each is created by the first task of its owning plan
- [x] No watch-mode flags
- [x] Feedback latency < 90 s for single-file runs
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
