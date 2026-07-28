---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
verified: 2026-06-16T15:41:00Z
status: human_needed
score: 4/5
overrides_applied: 0
gaps:
  - truth: "Run for real, the harness honestly resolves the A1/A2/A3 + B3 items in their UAT files — status set from real runs, never faked; B1/B2 remain human-only"
    status: partial
    reason: "B3 resolved (19-03a, oracle PASS). A2/SAFE-02 resolved (19-03b, real Tier-2 run, 17.6s). A1 (D-31 plugin-cache pointer resolution) and A3 (DOG-02 dual-path parity, including 9 parity cells in examples/03-ticket-to-pr.md) remain [pending] — both agentic claude -p calls hit the 120s per-spawn budget and returned empty output (inconclusive timeout, not a product failure). Cells correctly left pending; no fabricated flip. This is a genuine partial on ROADMAP SC4 / UAT-AUTO-04."
    artifacts:
      - path: ".planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md"
        issue: "test 1 (A1 / D-31) = [pending]; test 2 (A2) = [passed] (OK)"
      - path: ".planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md"
        issue: "test 1 (A1 / D-31) = [pending]; test 3 (A3 / DOG-02) = [pending]; test 2 (A2) = [passed] (OK)"
      - path: "examples/03-ticket-to-pr.md"
        issue: "All 9 CC-native parity cells still read `pending human`; no live A3 run produced markers"
    missing:
      - "A real Tier-2 run with longer per-call timeout budget (>120s) for A1 (/grugops:plan) and A3 (ticket-to-PR on sub-agent path) to produce confirmation markers"
      - "Once markers are produced: flip cells in 05-HUMAN-UAT.md test 1, 06-HUMAN-UAT.md tests 1+3, and fill the 9 parity cells in examples/03-ticket-to-pr.md"
human_verification:
  - test: "A1 (D-31) — plugin-cache pointer resolution"
    expected: "With a longer per-spawn timeout, run `npm run test:e2e` (or manually run the Tier-2 A1 case). The `/grugops:plan` call should produce planning/Orchestrator output markers present AND no path-error substring. On success: flip 05-HUMAN-UAT.md test 1 and 06-HUMAN-UAT.md test 1 to [passed] with evidence note."
    why_human: "The A1 case drives a full Claude Code planning session via `claude -p /grugops:plan ...` — agentic, token-spending, takes several minutes. Cannot be verified deterministically. Requires dev with authed claude CLI and patience to let the call complete."
  - test: "A3 (DOG-02) — CC sub-agent dispatch dual-path parity"
    expected: "Drive the same ticket (ABC-001) through the CC sub-agent dispatch path headlessly. Produced handoff filenames (implementation-handoff.md, qe-handoff.md) and gate verdict (READY_FOR_HUMAN_REVIEW) must match the sequential path. Fill 9 pending cells in examples/03-ticket-to-pr.md and flip 06-HUMAN-UAT.md test 3 to [passed] with evidence note."
    why_human: "Both agentic claude -p calls for the 'take it to a PR' round-trip timed out at 120s. Resolving requires a longer-budget run, manual observation of the harness markers, or a human running the CC sub-agent path in a real Claude Code session and capturing the output."
---

# Phase 19: Factory Auto-UAT Harness Verification Report

**Phase Goal:** Convert the agent-unrunnable live-runtime human UATs into honest automation — no agent grading its own homework (Constraint #6, no fabrication). Stand up deterministic Tier-1 oracles wired into the §14 gate, plus a Tier-2 headless E2E harness that loud-skips when unauthed (never a silent pass). Running the harness for real then resolves the long-deferred live-runtime UATs.
**Verified:** 2026-06-16T15:41:00Z
**Status:** human_needed (4/5 ROADMAP success criteria verified; SC4 is partial — A1/A3 pending)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Tier-1 deterministic oracles exist, fail red, never fabricate: WR-05 wording (B3), hooks.json→guard wiring (A2), dual-path artifact-structure parity (A3) — authored in TypeScript, compiled to committed .js, freshness-checked, vitest-covered | VERIFIED | `node scripts/check-uat-oracles.js` exits 0, "ALL CHECKS PASSED" (real run confirmed). `scripts/check-uat-oracles.ts` = 340 lines, three exported oracle functions. `npx vitest run --exclude '**/scripts/e2e/**'` = 144 passed / 1 skipped. `npm run freshness` = exit 0, 13 .js files byte-identical. |
| SC2 | Tier-2 headless E2E harness uses `claude --print` to cover A1/A2/A3, gated on CLI present+authed, asserts on markers/structure (not exact prose), emits a LOUD SKIP (never silent green) when unavailable | VERIFIED | `scripts/e2e/uat-live.test.ts` = 356 lines, exports `LOUD_SKIP_MARKER`, `emitLoudSkipIfUnavailable`, `claudePresentAndAuthed`. BLOCKER-2 test (`-t "loud-skip"`) passed — 2 passed, 3 skipped (the live cases), exit 0. The loud-skip path is proven: forces probe false, asserts exact sentinel byte-for-byte. |
| SC3 | Both lanes wired into §14 quality gate / foundation-guards aggregator; docs/dogfood-human-runbook.md documents three lanes in clear (non-caveman) voice stating authoritative vs advisory | VERIFIED | `05-pr-quality-gate.md` references `check-uat-oracles.js` and `test:e2e` (reference-don't-restate, no oracle logic restated). `dogfood-human-runbook.md` grep for tier-1/tier-2/tier-3/authoritative/advisory = 9 matches. `node scripts/check-foundation-guards.js` exercises all three Tier-1 oracles in its run-all block and exits 0. |
| SC4 | Run for real, the harness honestly resolves A1/A2/A3 + B3 in their UAT files — status from real runs, never faked; B1/B2 human-only | PARTIAL | B3 resolved: 11-HUMAN-UAT.md scenario 3 = [passed] from oracle exit 0 (not hand-set). A2 resolved: 05-HUMAN-UAT.md test 2 and 06-HUMAN-UAT.md test 2 = [passed] from real Tier-2 A2-live run (deny string confirmed, 17.6s). A1 and A3: both agentic claude -p calls timed out at 120s per-spawn budget — captured output empty — cells correctly remain [pending]. Never fabricated (Constraint #6 upheld). |
| SC5 | Zero new host runtime dependency — claude-CLI E2E stays dev/CI-only, config/skip-gated; minimal markdown-copy install path (install/README.md §1) unaffected; dev deps stay {typescript, vitest} + @types/node | VERIFIED | `git diff package.json` shows only `test:e2e` script added — no devDependencies change. Zero new npm packages. Harness requires the `claude` CLI which is a dev/CI prerequisite, never a host runtime dep. The lane self-skips when CLI absent. |

**Score:** 4/5 SC verified (SC4 is partial — counts as human_needed, not a BLOCKER)

### Deferred Items

No items explicitly addressed in a later phase were found. The A1/A3 pending items are not scheduled in a post-Phase-19 roadmap entry; they require a gap-closure plan or a manual human run.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-uat-oracles.ts` | Tier-1 aggregator with 3 exported oracle functions | VERIFIED | 340 lines; exports `oracleWr05Wording`, `oracleHooksWiring`, `oracleParity`, `uatOracleFails`; run-all block + entry guard (D-07 pattern) |
| `scripts/check-uat-oracles.js` | Committed tsc build output, freshness-checked | VERIFIED | 305 lines; `npm run freshness` = exit 0; LF endings; not gitignored |
| `scripts/check-uat-oracles.test.ts` | Plant-and-run Vitest harness (planted-FAIL + real-tree-PASS per oracle) | VERIFIED | 159 lines; three named oracle cases + shared real-tree smoke; CHECK_ROOT mirror pattern |
| `scripts/e2e/uat-live.test.ts` | Gated Tier-2 E2E harness with LOUD_SKIP_MARKER, stubbable probe, BLOCKER-2 proof | VERIFIED | 356 lines; exports LOUD_SKIP_MARKER, emitLoudSkipIfUnavailable, claudePresentAndAuthed; -t "loud-skip" = 2 passed |
| `package.json` | `test:e2e` script added, no devDependencies change | VERIFIED | Line 12: `"test:e2e": "vitest run scripts/e2e"`; no devDependencies change confirmed |
| `agent-factory/workflows/05-pr-quality-gate.md` | References both lanes, reference-don't-restate style | VERIFIED | Contains `check-uat-oracles.js` and `test:e2e` references; no oracle logic restated inline |
| `docs/dogfood-human-runbook.md` | Three-lane documentation, authoritative vs advisory marking | VERIFIED | grep tier-1/tier-2/tier-3/authoritative/advisory = 9 matches; clear professional voice |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/check-uat-oracles.ts` | `hooks/guard.js` | `spawnSync` A2 oracle child process | VERIFIED | Real run: exit 0, deny-JSON returned for kubectl apply payload |
| `scripts/check-uat-oracles.test.ts` | `scripts/check-uat-oracles.js` | `CHECK_ROOT` mirror + spawnSync | VERIFIED | vitest suite 144 passed |
| `scripts/check-foundation-guards.ts` | `scripts/check-uat-oracles.ts` | import oracleWr05Wording/oracleHooksWiring/oracleParity/uatOracleFails | VERIFIED | grep shows 4 imports at line 52-56; invocations at lines 493-496; `node scripts/check-foundation-guards.js` shows "Phase 19 auto-UAT Tier-1 oracles" section + "ALL CHECKS PASSED" |
| `agent-factory/workflows/05-pr-quality-gate.md` | `scripts/check-uat-oracles.js` + `scripts/e2e/uat-live.test.ts` | Reference gate steps | VERIFIED | Both referenced without restating logic |
| `scripts/e2e/uat-live.test.ts` | `claude` CLI | spawnSync claude --version + auth status probe | VERIFIED (honesty gate proven) | BLOCKER-2: `-t "loud-skip"` passes; probe forces false → LOUD_SKIP_MARKER emitted; live cases skip (never run in this verification, per critical constraint) |

### Data-Flow Trace (Level 4)

Not applicable: the Tier-1 oracles are deterministic scripts (no dynamic state/store rendering). The Tier-2 harness renders live CLI output but is gated; data-flow traces on the live lane would require the API-token budget (prohibited by the critical constraint). The key honesty gate (BLOCKER-2 loud-skip test) was verified by running it.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Tier-1 oracle exits 0 over real tree, prints "ALL CHECKS PASSED" | `node scripts/check-uat-oracles.js` | Exit 0; "ALL CHECKS PASSED"; B3/A2/A3 structural PASS, A3 CC-native WARN (advisory, correct) | PASS |
| Foundation-guards aggregator exercises three Tier-1 oracles and exits 0 | `node scripts/check-foundation-guards.js` | Exit 0; shows "Phase 19 auto-UAT Tier-1 oracles" section; three PASS + one advisory WARN | PASS |
| Freshness gate stays green for all 13 committed .js files | `npm run freshness` | Exit 0; "All build outputs fresh: 13 committed .js file(s) match a fresh tsc rebuild" | PASS |
| Unit suite (excluding live E2E lane) stays at 144 passed | `npx vitest run --exclude '**/scripts/e2e/**'` | 144 passed / 1 skipped (11 files) | PASS |
| BLOCKER-2: loud-skip path proven (forces probe false → exact sentinel emitted) | `npx vitest run scripts/e2e/uat-live.test.ts -t "loud-skip"` | 2 passed / 3 skipped; LOUD_SKIP_MARKER emitted on console.warn | PASS |

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes are defined for this phase. The behavioral spot-checks above substitute as the phase's runnable verification (all allowed checks from `<allowed_checks>` were run).

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|---------|
| UAT-AUTO-01 | Tier-1 deterministic oracles (WR-05, hooks.json→guard, parity) | SATISFIED | `scripts/check-uat-oracles.ts` — three exported oracle functions; vitest-covered; tsc-compiled; freshness-green; `node scripts/check-uat-oracles.js` exits 0 |
| UAT-AUTO-02 | Tier-2 headless E2E harness, loud-skip, CLI-gated, never silent green | SATISFIED | `scripts/e2e/uat-live.test.ts` — LOUD_SKIP_MARKER, emitLoudSkipIfUnavailable, claudePresentAndAuthed; BLOCKER-2 proven; no CI secret required |
| UAT-AUTO-03 | Both lanes wired into §14 gate and foundation-guards aggregator; runbook names three lanes, authoritative vs advisory | SATISFIED | `05-pr-quality-gate.md` references both lanes; `check-foundation-guards.ts` imports + invokes all three oracles; `dogfood-human-runbook.md` names Tier-1/2/3 with authoritative marking |
| UAT-AUTO-04 | Harness run for real resolves A1/A2/A3 + B3 in UAT files — from real runs, never faked | PARTIAL | B3 resolved (oracle exit 0). A2 resolved (real Tier-2 run, 17.6s, deny string confirmed). A1 + A3 timed out at 120s — cells correctly remain [pending], never fabricated. REQUIREMENTS.md correctly shows `[ ]` (unchecked). |
| UAT-AUTO-05 | Zero new host runtime dependency; claude-CLI E2E dev/CI-only; no devDependencies change | SATISFIED | `git diff package.json` shows only `test:e2e` script; zero devDependencies change; harness self-skips when CLI absent |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `package.json` | 11 | `"test": "vitest run"` includes `scripts/e2e/` — the live lane is NOT excluded from `npm test` | WARNING | On an authed dev machine `npm test` will run the ~8-minute live lane (A1/A2/A3 cases, or loud-skip if unauthed). 19-03b SUMMARY explicitly flags this as a recommended follow-up (`"test": "vitest run --exclude 'scripts/e2e/**'"` or a vitest exclude in `vitest.config.ts`). Not a BLOCKER because the loud-skip gate handles the unauthed case, and CI without auth stays green via loud-skip. Does not violate UAT-AUTO-05 (no host runtime dep is added) but tightens it. |

No `TBD`, `FIXME`, or `XXX` markers found in any phase-19-modified files.

### Human Verification Required

#### 1. A1 (D-31) — Plugin-cache pointer resolution

**Test:** With a longer per-spawn timeout, run `npm run test:e2e` or manually execute `claude plugin marketplace add <path-to-repo> --scope local && claude plugin install grugops@grugops --scope local`, then `claude -p "/grugops:plan add a GET /version endpoint" --output-format json` in a throwaway temp repo containing `agent-factory/` and a minimal `AGENTS.md`. Assert: planning/Orchestrator markers present AND the substring `cache` + path-error absent.

**Expected:** The `/grugops:plan` command resolves the repo-relative `agent-factory/roles/*.md` pointers against the user's repo (not the plugin cache), produces planning output, and does NOT emit a path-resolution error. On success: flip `05-HUMAN-UAT.md` test 1 and `06-HUMAN-UAT.md` test 1 from `[pending]` to `[passed]` with an evidence note citing the run.

**Why human:** A1 drives a full Claude Code agentic planning session via `claude -p /grugops:plan ...`. It is token-spending, can take several minutes, and requires the developer's authed CLI. The two timed-out attempts in 19-03b returned empty output (inconclusive at 120s) — not a product failure, just a budget constraint.

#### 2. A3 (DOG-02) — CC sub-agent dispatch dual-path parity

**Test:** Drive the same ticket (ABC-001) through the CC sub-agent dispatch path headlessly (via `settings.json` `agent:` → `Agent` tool spawn) or in a live Claude Code session. Compare produced handoff filenames (`implementation-handoff.md`, `qe-handoff.md`) and gate verdict (`READY_FOR_HUMAN_REVIEW`) against the already-captured sequential path results in `examples/03-ticket-to-pr.md`.

**Expected:** Produced handoff filenames and gate verdict match the sequential path — "only the dispatch differs, never the content." Fill the 9 `pending human` cells in `examples/03-ticket-to-pr.md` and flip `06-HUMAN-UAT.md` test 3 from `[pending]` to `[passed]` with a captured-output evidence note.

**Why human:** Both Tier-2 A3-live `claude -p "take this ticket to a PR"` calls timed out at 120s in 19-03b. Resolving requires either a longer-budget automated run or a human running the CC sub-agent path in a real Claude Code session and capturing the handoff filenames + verdict from the output.

---

### Gaps Summary

The phase delivered all infrastructure goals cleanly:

- SC1/UAT-AUTO-01 VERIFIED: Three Tier-1 deterministic oracles are real, fail-red, never fabricating — confirmed by two separate live runs (`node scripts/check-uat-oracles.js` + `node scripts/check-foundation-guards.js`).
- SC2/UAT-AUTO-02 VERIFIED: The BLOCKER-2 loud-skip test passes; the honesty gate is proven, not assumed.
- SC3/UAT-AUTO-03 VERIFIED: Single-source gate wiring and three-lane runbook are in place.
- SC5/UAT-AUTO-05 VERIFIED: No new host runtime dependency introduced.

The only gap is SC4/UAT-AUTO-04 (partial): A1 and A3 remain `[pending]` because both agentic `claude -p` calls hit the 120s per-spawn budget during the real 19-03b run and produced empty output. This is an inconclusive timeout — honestly reported, never fabricated. B3 (Tier-1 oracle) and A2 (live Tier-2 deny test, 17.6s) are resolved. The partial is correctly reflected in `REQUIREMENTS.md` as `[ ]` (UAT-AUTO-04 unchecked).

The follow-up recommendation from 19-03b to exclude `scripts/e2e/` from `"test": "vitest run"` was noted as a WARNING (non-blocking; the loud-skip gate prevents false-green on unauthed machines).

---

_Verified: 2026-06-16T15:41:00Z_
_Verifier: Claude (gsd-verifier) — goal-backward analysis, codebase evidence only, SUMMARY.md claims independently confirmed_
