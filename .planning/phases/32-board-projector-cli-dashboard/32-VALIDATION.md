---
phase: "32"
slug: "board-projector-cli-dashboard"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-13"
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled from `32-RESEARCH.md` §Validation Architecture (framework measured, commands run this session).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1.8` (devDependency; `globals: false`, so `describe`/`it`/`expect` are imported explicitly) |
| **Config file** | `vitest.config.ts` (`fileParallelism: false`; excludes `**/scripts/runnable-ref/fixtures/**` and `**/.temp/**`) |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts scripts/board-oracle.test.ts scripts/board-corpus.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Typecheck** | `npm run typecheck` |
| **Build twins** | `npm run build && npm run freshness && npm run check:build-parity` |
| **Estimated runtime** | quick ~15 s · full ~3 min |

**Never run bare `npm test`.** It is `vitest run` with no exclude and triggers the live claude-CLI
e2e lane (spends tokens, can hang). CI itself runs `npx vitest run --exclude '**/scripts/e2e/**'`
(`.github/workflows/ci.yml:174`).

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-*.test.ts`
- **After every plan wave:** `npx vitest run --exclude '**/scripts/e2e/**'` plus `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness`
- **Before `/gsd-verify-work`:** full suite green, plus `node scripts/check-foundation-guards.js`, `npm run check:imperative-lexicon`, and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`
- **Max feedback latency:** ~15 seconds (quick lane)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | DASH-01, DASH-02 | T-32-01 | row/heading regexes are linear-time over a 34 KB line | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-tracer.test.ts -t "grammar"` | ❌ W0 | ⬜ pending |
| 32-01-02 | 01 | 1 | DASH-03, DASH-07 | T-32-03 | `repoRoot` realpath-resolved, fixed literal subpaths | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-tracer.test.ts -t "read seam"` | ❌ W0 | ⬜ pending |
| 32-01-03 | 01 | 1 | DASH-07, DASH-08 | T-32-08 | one JSON document on stdout, diagnostics on stderr | integration (spawned child) | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-tracer.test.ts -t "end-to-end"` | ❌ W0 | ⬜ pending |
| 32-02-01 | 02 | 2 | DASH-02 | T-32-01 | comment strip is fail-closed on an unterminated `<!--` | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "comment"` | ❌ W0 | ⬜ pending |
| 32-02-02 | 02 | 2 | DASH-01, DASH-02 | T-32-01 | total line partition; no line dropped | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "partition"` | ❌ W0 | ⬜ pending |
| 32-02-03 | 02 | 2 | DASH-08 | T-32-07 | bounds + truncation on a ≥34 KB line | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "bounds"` | ❌ W0 | ⬜ pending |
| 32-02-04 | 02 | 2 | DASH-01, DASH-02 | — | the contract is the derivation source for every axis | gate | `npm run check:imperative-lexicon` | ✅ exists | ⬜ pending |
| 32-03-01 | 03 | 2 | DASH-05 | T-32-03, T-32-09 | read-verify-reread; ENOENT/torn → stale, never empty | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts -t "torn"` | ❌ W0 | ⬜ pending |
| 32-03-02 | 03 | 2 | DASH-05 | T-32-05, T-32-07 | queue tamper rule ported; bounded walk reports | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts -t "queue"` | ❌ W0 | ⬜ pending |
| 32-03-03 | 03 | 2 | DASH-04 | T-32-10 | debounce, mandatory poll floor, re-arm | integration | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts` | ❌ W0 | ⬜ pending |
| 32-04-01 | 04 | 3 | DASH-02 | T-32-01 | live corpus admitted by named disposition | replay | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-corpus.test.ts -t "admits"` | ❌ W0 | ⬜ pending |
| 32-04-02 | 04 | 3 | DASH-02 | T-32-01 | mutation corpus refused; no-op stripper turns it red | mutation | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-corpus.test.ts -t "discriminat"` | ❌ W0 | ⬜ pending |
| 32-04-03 | 04 | 3 | DASH-02 | T-32-01 | oracle cell count asserted 3 ways; wall-clock bound on the long-line cell | oracle | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-oracle.test.ts` | ❌ W0 | ⬜ pending |
| 32-05-01 | 05 | 3 | DASH-03 | T-32-02 | ticket path built only from an ID that matched the anchored regex | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "join"` | ❌ W0 | ⬜ pending |
| 32-05-02 | 05 | 3 | DASH-03 | — | seven conflict kinds, members and count two-sided | derived-set | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "conflict kinds"` | ❌ W0 | ⬜ pending |
| 32-05-03 | 05 | 3 | DASH-03, DASH-08 | — | golden byte-for-byte; all seven kinds present | golden | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "golden"` | ❌ W0 | ⬜ pending |
| 32-06-01 | 06 | 3 | DASH-06 | T-32-04 | no mutating `node:fs` symbol in the closure | import-graph guard | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-readonly.test.ts` | ❌ W0 | ⬜ pending |
| 32-06-02 | 06 | 3 | DASH-06, DASH-08 | T-32-04 | module ban: no child_process/net/http/https/worker_threads | import-graph guard | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-readonly.test.ts -t "no socket"` | ❌ W0 | ⬜ pending |
| 32-06-03 | 06 | 3 | DASH-06 | T-32-04 | the guard is reachable as a named npm script | gate | `npm run check:dashboard-readonly` | ❌ W0 | ⬜ pending |
| 32-07-01 | 07 | 4 | DASH-07, DASH-05 | T-32-06 | every rendered cell is control-character sanitized | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts -t "sanitize"` | ❌ W0 | ⬜ pending |
| 32-07-02 | 07 | 4 | DASH-07 | T-32-08, T-32-10 | exit contract; diagnostics on stderr; `--interval` validated | integration (spawned child) | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts -t "exit"` | ❌ W0 | ⬜ pending |
| 32-07-03 | 07 | 4 | DASH-07, DASH-05 | T-32-06 | non-TTY never emits ANSI; stale badge visible | integration (spawned child) | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts -t "non-tty"` | ❌ W0 | ⬜ pending |
| 32-08-01 | 08 | 4 | DASH-01 | — | one column authority; the inline pair is gone | integration | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` | ✅ exists | ⬜ pending |
| 32-08-02 | 08 | 4 | DASH-01 | — | board twins rewritten; frozen table unmoved | gate | `npm run check:imperative-lexicon` | ✅ exists | ⬜ pending |
| 32-08-03 | 08 | 4 | DASH-08 | T-32-SC | `package.json` gains no `dependencies` key | repo assertion | `git diff --exit-code -- package-lock.json` | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is **plan `32-01` task 1**, which lands `agent-factory/contracts/board.md` (every later test
derives its axes from that contract) together with the first test file. Nothing in this phase has a
test framework gap — vitest is installed and configured.

- [ ] `agent-factory/contracts/board.md` — the normative spec every corpus/oracle axis is derived from (must land first, D-04)
- [ ] `scripts/board-tracer.test.ts` — the end-to-end slice's own test (plan 32-01)
- [ ] `scripts/board-model.test.ts` — unit + derived-set + golden (plans 32-02, 32-05)
- [ ] `scripts/board-corpus.ts` + `scripts/board-corpus.test.ts` — corpus as data, `BOARD_CORPUS_COUNT` asserted (plan 32-04)
- [ ] `scripts/board-oracle.test.ts` — cross-product oracle, invariants I1–I5 (plan 32-04)
- [ ] `scripts/board-read.test.ts`, `scripts/board-watch.test.ts` — read seam and watch loop (plan 32-03)
- [ ] `scripts/board-dashboard.test.ts` — CLI contract, spawned child (plan 32-07)
- [ ] `scripts/board-readonly.test.ts` — DASH-06 import-graph guard (plan 32-06)
- [ ] `scripts/fixtures/board-snapshot/**` + `expected-snapshot.json` — golden tree with all seven conflict kinds (plan 32-05)
- [ ] `scripts/fixtures/board-replay/*.md` — the two real boards, structurally trimmed, one ≥34 KB line preserved (plan 32-04)
- [ ] RED baselines in the repo's established `NN-RED-baseline.txt` / `NN-GREEN-proof.txt` style (precedent: `25-06-RED-baseline.txt`) for each discrimination test — no-op stripper (32-04), planted writer (32-06), no-op debounce (32-03)
- [ ] Framework install: **none needed**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live TTY redraw looks calm and legible on a real terminal | DASH-07 | A pty is not modelled in this suite; the render function is unit-tested but the visual result is not | Run `npm run dashboard` in a real terminal in this repo, edit `plans/board.md` in another window, confirm the frame refreshes within ~1 s and does not flicker |
| Windows `fs.watch` behavior | DASH-04 | The `windows-latest` CI leg is Phase 33 / CAP-02 work | **`UNKNOWN - verify`** — not asserted this phase. The mandatory poll floor is the fallback by construction |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 32s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
