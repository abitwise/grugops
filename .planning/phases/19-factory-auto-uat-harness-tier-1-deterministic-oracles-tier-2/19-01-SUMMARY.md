---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: "01"
subsystem: tooling/auto-uat-harness
tags: [auto-uat, oracles, foundation-guards, tier-1, deterministic, no-fabrication, typescript]
requires:
  - "scripts/check-foundation-guards.ts (aggregator spine + CHECK_ROOT + pass/fail/warn + grepFiles)"
  - "hooks/guard.js (committed deny-guard the A2 oracle spawns)"
  - "hooks/hooks.json (PreToolUse Bash wiring)"
  - "examples/03-ticket-to-pr.md (DOG-02 dual-path parity table)"
  - "the four .planning WR-05 tracking docs"
provides:
  - "scripts/check-uat-oracles.ts/.js — standalone Tier-1 aggregator with three deterministic oracles (B3 wording, A2 wiring, A3 parity), exported for import"
  - "scripts/check-uat-oracles.test.ts — plant-and-run Vitest harness (planted-FAIL + real-tree-PASS per oracle)"
  - "foundation-guards aggregator now invokes the three Tier-1 oracles and fails closed (UAT-AUTO-05)"
affects:
  - "scripts/check-foundation-guards.ts/.js/.test.ts (run-all block extended; fails closed on a Tier-1 oracle failure)"
tech-stack:
  added: []
  patterns:
    - "Standalone-not-folded aggregator with an import.meta entry guard (D-07 precedent from catalog-freshness.ts) — direct-run executes the exit tail; import exposes the functions without double-running"
    - "Exported fail-count accessor (uatOracleFails()) so an importing aggregator folds the oracle fail signal into its own FAILS counter"
    - "Tolerant per-beat lookahead regexes (action token + phase on the same line) instead of a verbatim summary slug that appears in no doc"
    - "Child-process wiring assertion: read hooks.json, spawn the committed guard.js with a matched payload, assert the deny-JSON — wiring contract only, never re-testing guard logic"
key-files:
  created:
    - "scripts/check-uat-oracles.ts"
    - "scripts/check-uat-oracles.js"
    - "scripts/check-uat-oracles.test.ts"
  modified:
    - "scripts/check-foundation-guards.ts"
    - "scripts/check-foundation-guards.js"
    - "scripts/check-foundation-guards.test.ts"
decisions:
  - "Adopted the PREFERRED wiring path (function import + invoke + fold uatOracleFails() into FAILS), not the spawnSync fallback — a clean import is feasible because the oracle module honors the SAME CHECK_ROOT override, so the foundation-guards hermetic mirror plant exercises the oracles through the aggregator too."
  - "The A2 oracle never references GRUGOPS_PROD_DEPLOY_APPROVED at all (0 refs) — cleaner than the plan's 'only in a comment' allowance; the deny is asserted precisely because the var is absent."
  - "oracleParity surfaces the still-`pending human` CC-native column as a WARN (advisory, never increments FAILS) — the structural floor passes while the no-fabrication rule is honored: the oracle never claims the CC-native path confirmed."
metrics:
  duration: "~20m"
  completed: "2026-06-16"
  tasks: 3
  files: 6
---

# Phase 19 Plan 01: Tier-1 Deterministic Oracle Lane Summary

Stood up the honest, no-LLM half of the auto-UAT harness — a standalone `scripts/check-uat-oracles.ts` aggregator carrying three fail-red, never-fabricate oracles (B3 WR-05 wording-consistency, A2 hooks.json→guard.js wiring, A3 dual-path structural parity), its freshness-clean committed `.js`, a plant-and-run Vitest harness proving each oracle both PASS and FAIL-red — and folded all three into the foundation-guards aggregator so `node scripts/check-foundation-guards.js` exercises them and fails closed.

## What Was Built

**Task 1 — `scripts/check-uat-oracles.ts` (commit `447b11a`).** Cloned the `check-foundation-guards.ts` aggregator spine verbatim (`CHECK_ROOT` override, `abs`/`fileExists`/`readText`, the `FAILS` counter with `pass`/`fail`/`warn` where WARN never increments, `grepFiles`). Three exported oracle functions:
- **`oracleWr05Wording` (B3 / UAT-AUTO-01)** — `WR05_SCAN` = the four `.planning` docs; asserts each of the three semantic beats (Phase 8 dropped / Phase 10 `guard_wr05` / Phase 11 re-verified GREEN) is present in every file via tolerant per-beat lookahead regexes, NOT the literal "dropped P8 → guarded P10 → re-verified P11" slug (which appears verbatim in no doc). CR-01 missing-file fail-red. Each beat regex required tuning so beat2 tolerates STATE.md's `guard_wr05` (`scripts/check-foundation-guards.sh`) `in Phase 10` (the `.sh` dot breaks naive `[^.]*` adjacency) — verified against all four live docs.
- **`oracleHooksWiring` (A2 / UAT-AUTO-02)** — reads `hooks/hooks.json` (CR-01 + fail-closed `JSON.parse` per ASVS V5), asserts `PreToolUse[0].matcher === "Bash"` and the command references `guard.js` (substring, not a string-equal of the `${CLAUDE_PLUGIN_ROOT}` wrapper), then spawns the committed `guard.js` with a `kubectl apply` payload and asserts `"permissionDecision":"deny"`. Wiring contract only — never re-tests guard logic (covered 26/26 by `guard.test.ts`). Never sets the approval var.
- **`oracleParity` (A3 / UAT-AUTO-03)** — reads `examples/03-ticket-to-pr.md`, asserts the two dispatch-column headers, the frozen handoff filenames (`implementation-handoff.md`, `qe-handoff.md`), and the frozen verdict (`READY_FOR_HUMAN_REVIEW`); surfaces the still-`pending human` CC-native column as an advisory WARN, never as a confirmed match.

Standalone run-all block + `ALL CHECKS PASSED` / exit 0/1 tail, guarded by an `import.meta`-vs-argv entry check so importing the module does not double-run the exit tail (D-07 precedent). `export const uatOracleFails()` exposes the accumulated count.

**Task 2 — `scripts/check-uat-oracles.test.ts` + committed `.js` (commit `506580c`).** Cloned the `check-foundation-guards.test.ts` `CHECK_ROOT` mirror/plant harness (`mirror()`/`runIn()`/`out()`/`afterAll` cleanup; temp prefix `grugops-uat-`). `GUARD_INPUTS` = the four scan docs + `hooks/hooks.json` + `hooks/guard.js` + `examples/03-ticket-to-pr.md`. Per oracle: a planted-FAIL case (strip a WR-05 beat / mutate the matcher + the command away from `guard.js` / remove a frozen verdict + handoff) tagged `-t "wording"`/`"wiring"`/`"parity"`, plus CR-01 missing-file cases, plus one shared real-tree GREEN smoke asserting `ALL CHECKS PASSED`. `npm run build` emits the committed LF `.js`; `*.test.ts` excluded from emit (no `.test.js` leaked).

**Task 3 — foundation-guards aggregator wiring (commit `d884cff`).** `check-foundation-guards.ts` now imports the three oracles + `uatOracleFails` from `./check-uat-oracles.js`, invokes all three in the run-all block under a `== Phase 19 auto-UAT Tier-1 oracles (UAT-AUTO-05) ==` header, and folds their fail count into `FAILS` so the existing exit tail goes non-zero when any one fails. The oracle bodies are NOT restated (single-source). The test gains the seven Tier-1 inputs to `GUARD_INPUTS` and a plant case proving the aggregator goes red when a Tier-1 oracle fails. The six original guards + the literal `ALL CHECKS PASSED` tail are preserved.

## Verification Results

- `npm run build` — green (committed `.js` emitted, LF) for `check-uat-oracles.js` and the re-emitted `check-foundation-guards.js`.
- `npx vitest run scripts/check-uat-oracles.test.ts` — green; `-t "wording"`/`"wiring"`/`"parity"` each exit 0 (planted-FAIL proves RED, smoke proves GREEN).
- `npx vitest run scripts/check-foundation-guards.test.ts` — green; 22 cases (21 original + the new Tier-1 plant).
- `node scripts/check-uat-oracles.js` — exit 0 over the real tree, prints `ALL CHECKS PASSED`.
- `node scripts/check-foundation-guards.js` — exit 0, exercises all three Tier-1 oracles; fails closed (exit non-zero) when a Tier-1 oracle is planted to fail (proven by the new plant case).
- `npm run freshness` — exit 0 (13 committed `.js` byte-identical to a fresh `tsc` rebuild; D-13 drift gate green).
- Full Vitest suite — 144 passed / 1 pre-existing skip (11 files).
- Zero new devDependency (`git diff package.json` clean).

## Deviations from Plan

None — plan executed as written. Two plan-sanctioned discretionary choices were exercised: (1) the PREFERRED function-import wiring path over the spawnSync fallback (a clean import is feasible — see Decisions), and (2) the A2 oracle references the approval env var nowhere (0 refs), stricter than the plan's "only in a comment" allowance.

## Threat Surface Notes

No new security surface beyond the plan's `<threat_model>`. The A2 oracle spawns `guard.js` with an arg-array (never `shell:true` on the data path — T-19-01) and never sets `GRUGOPS_PROD_DEPLOY_APPROVED`; the JSON parse is wrapped fail-closed (T-19-03); all file reads are fixed literals joined to `import.meta.dirname`/`CHECK_ROOT` (T-19-04); zero packages installed (T-19-SC).

## Known Stubs

None. The CC-native parity column reading `pending human` in `examples/03-ticket-to-pr.md` is an intentional, documented no-fabrication state — its live fill is Plan 02's Tier-2 A3-live run, and `oracleParity` deliberately surfaces it as an advisory WARN rather than marking it confirmed.

## Self-Check: PASSED

All three created script files + the SUMMARY exist on disk; all three per-task commits (`447b11a`, `506580c`, `d884cff`) are present in the git history.
