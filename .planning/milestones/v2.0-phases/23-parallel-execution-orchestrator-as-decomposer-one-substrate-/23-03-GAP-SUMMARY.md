---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate-
plan: 23-03-GAP
subsystem: foundation-guards / auto-uat-oracles / queue-freshness
tags: [wr-05, safety-guard, fence-strip, cardinality, asymmetry-oracle, entry-guard]
requires:
  - The Phase 23 WR-05 inversion (23-03) and its committed guard/oracle .js
provides:
  - guard_wr05 fence-immunity + exactly-one-coordinator cardinality (CR-01 closed)
  - broadened asymmetry spawn-wording detection (WR-01)
  - per-tool all-row asymmetry validation (WR-03)
  - import-safe now-running-freshness module (WR-04)
affects:
  - scripts/check-foundation-guards.ts (+.js, +.test.ts)
  - scripts/check-uat-oracles.ts (+.js, +.test.ts)
  - scripts/now-running-freshness.ts (+.js)
tech-stack:
  added: []
  patterns:
    - "General fence-strip before a line-anchored frontmatter grep (documentation examples are not live frontmatter)"
    - "Cardinality assertion alongside per-file directional checks (a marker cannot promote a file out of the must-not set)"
    - "main() + import.meta-vs-argv entry guard for standalone gates (mirrors claim.ts isMain / check-uat-oracles.ts isEntry)"
key-files:
  created:
    - .planning/phases/23-parallel-execution-orchestrator-as-decomposer-one-substrate-/23-03-GAP-proof.txt
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-uat-oracles.test.ts
    - scripts/now-running-freshness.ts
    - scripts/now-running-freshness.js
decisions:
  - "Strip fenced blocks before the WR-05 scan rather than excluding subagent.frontmatter.md from the scan set — the fence-strip + cardinality is the durable fix and keeps the doc file under the guard."
  - "WR-01 spawn token uses a (?<!no ) lookbehind so the broadened concept-catch coexists with the legitimate 'no spawn' wording (Node 22+ floor supports lookbehind; typecheck confirms)."
  - "WR-03 asserts exactly one row per tool per file — verified the real tree has one row per tool in both adapters.md and README.md, so no false-RED."
metrics:
  duration_sec: 366
  completed: 2026-06-21
  commits: 1
  files_changed: 9
status: complete
---

# Phase 23 Plan 23-03-GAP: WR-05 Guard/Oracle Gap Closure Summary

Closed the one BLOCKER and three warnings the Phase 23 code review raised against the atomic
WR-05 safety-guard inversion: the guard is now immune to fenced documentation examples and
asserts exactly one coordinator, the asymmetry oracle catches the parallelism CONCEPT across
every per-tool row, and the queue-freshness gate is import-safe. All fixes are structural and
proven against the committed `.js`, not just the test suite.

## What changed

### CR-01 (BLOCKER) — guard_wr05 fence-immunity + coordinator cardinality

`subagent.frontmatter.md` legitimately carries a fenced coordinator example
(`coordinator: true` + `tools: Agent(...)`). The pre-fix guard greps line-by-line, fence-agnostic,
so it read that documentation example as a second live coordinator — the "exactly the real
coordinator holds the grant" invariant was hollowed, and an innocuous doc edit could flip the
file RED.

Structural fix:
- Added `stripFencedBlocks(text)` — a general fence operation that drops every line inside a
  ```` ``` ````-delimited fence using the same line-state toggle as `stripCavemanBlock`, with a
  **fail-safe** unterminated-fence path (the opened-but-unclosed tail stays inside-fence and is
  never emitted, so a malformed doc can never leak an unguarded grant). It is a distinct
  general-fence helper, factored cleanly — not a fork of the caveman-section parser.
- `guardWr05` now reads each SCAN file once, fence-strips the body, then applies the
  **byte-identical** `WR05_COORDINATOR` / `WR05_COMMA` / `WR05_ARRAY` EREs per surviving line.
  Only the input changed (fenced lines removed); the real adapter's non-fenced frontmatter
  marker/grant remains detected.
- Added an exactly-one-coordinator **cardinality** assertion: collect every file whose
  fence-stripped body carries the marker and FAIL (clear voice, naming the files) if the count
  is not 1. The existing per-file dropped-grant / rogue-spawner directional fails are kept.

### WR-01 — broadened asymmetry spawn-wording

`ASYM_SPAWN_WORDING` matched only `coordinator` and the exact phrase "spawn(s) role agents".
Broadened to the concept: `coordinator|parallel|concurren|fan-?out|dispatch[^|]*agent|(?<!no )\bspawn`.
The `(?<!no )` lookbehind keeps the broadened catch from tripping the legitimate
"Sequential role-load — no spawn" wording every non-CC row carries. The real CC row (which
already says "concurrent"/"spawns") still matches in the gained direction; the four real non-CC
rows still pass.

### WR-03 — validate every per-tool row, assert one-per-tool

`oracleWr05Wording` used `lines.find` (first matching row only). Switched to `lines.filter`,
validate each matching row in its direction, and assert exactly one row per tool per file so a
duplicate/legacy overview row cannot hide asymmetry drift. Verified the real tree carries one
row per tool per file in both `adapters.md` and `README.md` — no false-RED.

### WR-04 — import-safe queue-freshness gate

`now-running-freshness.ts` ran `mkdtempSync`/`cpSync`/`spawnSync`/`process.exit` as top-level
side effects. Wrapped the body in `main()` gated behind the same
`import.meta.url === pathToFileURL(process.argv[1]).href` check the siblings use (`claim.ts`
`isMain`, `check-uat-oracles.ts` `isEntry`). Importing the module is now side-effect-free;
the committed `.js` was rebuilt.

## Tests added

- `guard_wr05 FENCED coordinator example … is ignored → guard PASSES` (CR-01 fence-immunity).
- `guard_wr05 LIVE second coordinator (non-fenced) → nonzero + 'found 2'` (CR-01 cardinality).
- `wording WR-01: non-CC row gains 'parallel fan-out' wording → nonzero + names the row`.

All three drive the committed `.js` through the `CHECK_ROOT` mirror harness. The three existing
half-flip RED fixtures (dropped grant / marker removed / rogue grant) were re-verified to still
fail RED after the change.

## Adversarial proof (green-suite-insufficient lesson)

`23-03-GAP-proof.txt` captures five cases run directly against the committed `.js` in hand-built
`CHECK_ROOT` mirrors:
- (a) fenced-example-only SCAN file → `check-foundation-guards.js` exit 0.
- (b) live second coordinator → exit non-zero, "found 2" cardinality fail.
- (c) non-CC row gaining "parallel fan-out" → `check-uat-oracles.js` exit non-zero, asymmetry drift.
- (d) importing `now-running-freshness.js` → exit 0, no gate run (import-safe).
- (e) real-tree control → both committed guards exit 0 (no false-RED introduced).

All five PASS.

## Deviations from Plan

None — the gap-closure scope was executed as written. WR-02 and IN-01/IN-02/IN-03 were
explicitly deferred per the brief and are recorded below.

## Deferred Issues (out of this gap-closure scope, per the brief)

- **WR-02** — `oracleParity`'s `pending human` advisory regex is whole-file, not cell-scoped;
  scope it to the CC-native column cell in a follow-up.
- **IN-01** — the plain-specialist example in `subagent.frontmatter.md` reuses
  `name: grugops-orchestrator`; rename to a specialist for clarity.
- **IN-02** — `ASYM_ROWS` lists Claude Code last while the branch special-cases it; introduce a
  `CC_LABEL` constant.
- **IN-03** — `generate-catalog.test.ts` is in scope only as a no-substance Phase-23 touch.

## Constraints honored

- `hooks/guard.ts` / `hooks/guard.js` unchanged.
- Clear professional voice on all guard/oracle findings.
- No literal grant token left in a guard `<action>`/comment in a form the guard's own negative
  grep would self-trip.
- Every changed committed `.js` byte-matches a fresh `tsc` rebuild (`npm run freshness` exit 0).
- New tests stay out of `scripts/e2e/`; they drive the committed `.js`, never the `.ts`.

## Verification

- `npx vitest run` over the three targeted suites: 45/45 green.
- Full non-e2e regression (`npx vitest run --exclude '**/scripts/e2e/**'`): 451 passed, 1 skipped.
- `node scripts/check-foundation-guards.js`, `check-uat-oracles.js`, `now-running-freshness.js`:
  all exit 0 on the real tree.
- `node scripts/catalog-freshness.js` exit 0; `npm run freshness` exit 0 (18 committed `.js` fresh).

## Self-Check: PASSED

- Commit `b32613b` present in `git log`.
- `23-03-GAP-proof.txt` exists in the phase dir.
- All three committed `.js` rebuilt and freshness-clean.

## Note for the orchestrator

The phase is **not** marked complete here — verification is the orchestrator's. This plan only
closed the review's CR-01/WR-01/WR-03/WR-04 findings on the WR-05 safety surface.
