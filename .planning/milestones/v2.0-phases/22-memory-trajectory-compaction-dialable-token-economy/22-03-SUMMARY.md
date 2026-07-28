---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 03
subsystem: compaction / carve-out safety oracle
tags: [CMP-02, carve-out, safety-oracle, gap-closure, tdd, D-13]
gap_closure: true
requires:
  - "scripts/compactor.ts (Phase 22-01/22-02 carve-out checker)"
  - "scripts/context-io.ts (appendNote/admit promotion + admission seam)"
  - "scripts/freshness.ts (D-13 byte-drift gate, auto-globs scripts/*.js)"
provides:
  - "checkCarveOut hardened against field mutation (CR-01), wholly-dropped verified findings (CR-02), ambiguous sibling borrowing (CR-03)"
  - "CLI check fails closed on a missing threadDir (WR-01)"
  - "failedAttemptId fails closed on an unrecoverable FA-id (WR-02); degradeToClaim throws on a non-template input (WR-03)"
  - "dial-independence asserted by construction across all three dials (WR-05/D-05)"
affects:
  - "scripts/compactor.ts"
  - "scripts/compactor.js"
  - "scripts/compactor.test.ts"
tech-stack:
  added: []
  patterns:
    - "RED-first adversarial oracle for a safety boundary (held-out cases proven RED against the committed .js before the fix, GREEN after)"
    - "affirmative existence check (stable-identity key set) rather than null-counterpart skip"
    - "deterministic 1:1 counterpart matching (verified_by stamp, else (kind, at) tuple) — never sameKind[0] borrowing"
    - "fail-closed post-condition guards (existsSync gate, null sentinel + explicit finding, throw-on-malformed-input)"
key-files:
  created: []
  modified:
    - "scripts/compactor.ts"
    - "scripts/compactor.js"
    - "scripts/compactor.test.ts"
decisions:
  - "[22-03] CR-01: provenance check refuses ANY alteration of a non-empty load-bearing field (drop-to-empty AND mutate-to-different-value); message distinguishes the two cases and names old + new values"
  - "[22-03] CR-02: a §14-gate-verified finding (non-empty verified_by) wholly dropped from the promoted set is refused by an affirmative existence check keyed on (kind, verified_by, by, at); an unverified note MAY still be dropped (agent body-compression latitude)"
  - "[22-03] CR-03: findCounterpart matches deterministically 1:1 — verified_by stamp first, else (kind, at) tuple — returning null when ambiguous; the CR-02 existence check (not a borrowed sibling) handles a dropped verified note"
  - "[22-03] WR-02: failedAttemptId returns null (no silent best-effort filename id) on an unrecoverable FA-token; checkCarveOut surfaces it as a named finding"
  - "[22-03] WR-03: degradeToClaim throws if post-conditions (kind: claim, confidence: UNKNOWN - verify, no residual §14-gate stamp) do not hold — the honest-degrade hatch cannot silently no-op"
metrics:
  duration: 6m
  completed: 2026-06-18
  tasks: 4
  files: 3
status: complete
---

# Phase 22 Plan 03: CMP-02 Carve-Out Hardening (Gap Closure) Summary

Hardened the `checkCarveOut` safety oracle in `scripts/compactor.ts` so the un-cheatable carve-out floor genuinely holds: it now refuses forged/mutated provenance stamps, wholly-dropped §14-gate-verified findings, ambiguous same-kind sibling borrowing, and the fail-open CLI/degrade/FA-id paths — each pinned by a held-out adversarial test proven RED against the committed `.js` before the fix and GREEN after, with `npm run freshness` exit 0 as the build-faithfulness proof.

## What Was Built

This `gap_closure: true`, `type: tdd` plan closed the single remaining Phase-22 blocker — **CMP-02 / SC2** — confirmed bypassable by `22-VERIFICATION.md` and `22-REVIEW.md` (three independent bypasses + two fail-open paths over a 14-green-test suite).

Executed the plan's 4-task RED→GREEN→HARDEN→REBUILD sequence exactly, in order, honoring the RED-first contract (no edit to `compactor.ts`/`.js` until Task 1 recorded RED).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | RED — six adversarial carve-out cases | `75653f8` | scripts/compactor.test.ts |
| 2 | GREEN — checkCarveOut + findCounterpart + CLI fail-closed (CR-01/02/03, WR-01, IN-01) | `0519474` | scripts/compactor.ts |
| 3 | HARDEN — failedAttemptId (WR-02), degradeToClaim throw (WR-03), dial byte-identity (WR-05) | `cd5d616` | scripts/compactor.ts, scripts/compactor.test.ts |
| 4 | REBUILD + FRESHNESS — byte-fresh compactor.js (D-13) | `f8f6988` | scripts/compactor.js |

## Completion Evidence (safety oracle — a green suite is NOT proof)

### Task 1 RED evidence (verbatim) — the held-out oracle is real, not vacuous

Run against the **currently committed** `scripts/compactor.js` (BEFORE any `.ts`/`.js` edit). The four bypass cases + the missing-dir case all FAILED (status `+0` / exit 0 / empty findings — i.e. the bypass was live):

```
 ❯ scripts/compactor.test.ts (20 tests | 5 failed | 14 skipped) 230ms
     × mutates verified_by to a forged stamp — refuse, naming verified_by 36ms
     × mutates by to a different non-empty value — refuse, naming by 26ms
     × wholly drops a verified finding with 2+ promoted notes — refuse, naming the dropped finding 27ms
     × drops by on one of two same-kind findings — refuse, naming by 29ms
     × CLI check fails closed on a missing threadDir — exit 1, never carve-out intact 26ms
 Test Files  1 failed (1)
      Tests  5 failed | 1 passed | 14 skipped (20)
```

Sample failure (the bypass exit-0 made visible):

```
AssertionError: a forged verified_by must be refused: expected +0 not to be +0 // Object.is equality
 ❯ scripts/compactor.test.ts:282:66
    expect(r.status, "a forged verified_by must be refused").not.toBe(0);
```

The 6th case (`carve-out findings are byte-identical across all three dials`) PASSED at RED — correct, since all three dials produced identical (empty) output against the un-hardened code.

### GREEN evidence (after the fix)

- `npx vitest run scripts/compactor.test.ts` — **22 passed (22)** (14 pre-existing + 6 Task-1 + 2 Task-3 hardening cases). No regression.
- The four bypass cases + the missing-dir case now PASS (refuse, named).

### REQUIRED build-faithfulness evidence (D-13)

```
> freshness
> tsc --outDir .tmp-build && node scripts/freshness.js
All build outputs fresh: 17 committed .js file(s) match a fresh tsc rebuild.
FRESHNESS_EXIT=0
```

`npm run freshness` exits 0 — committed `compactor.js` is byte-fresh vs `compactor.ts`.

### Regression lane (live e2e NOT run)

```
npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  16 passed (16)
      Tests  235 passed | 1 skipped (236)
VITEST_EXIT=0
```

The six adversarial CMP-02 cases are among the passing tests. The live `claude`-CLI e2e lane was deliberately excluded (project memory: it spends tokens / can hang ~8 min).

## How It Was Fixed (per blocker)

- **CR-01 (mutation):** provenance-field condition changed from "raw non-empty AND promoted empty" to "raw non-empty AND raw ≠ promoted". Refuses a `verified_by` swapped to `§14-gate#FORGED-999` and a `by` swapped `engineer→attacker`; the finding distinguishes dropped-to-empty vs altered-to-`<value>` (naming both old and new).
- **CR-02 (wholly-dropped verified finding):** new affirmative existence check keyed on the stable tuple `(kind, verified_by, by, at)`. Every raw note with a non-empty `verified_by` must appear in the promoted key set; absence is a named finding. Replaces the silent null-counterpart `continue`.
- **CR-03 (sibling borrowing):** `findCounterpart` now matches deterministically — unique `verified_by` stamp first, else the unique `(kind, at)` tuple — returning `null` when ambiguous. The unconditional double `return sameKind[0]` is gone (replaced by match-or-null, not collapsed to a single unconditional return per IN-02).
- **WR-01 (fail-open CLI):** `existsSync(threadDir)` guard before reading the raw thread; a missing dir prints a named error to stderr and `process.exit(1)`, never `carve-out intact`. `promotedDir` may legitimately be empty pre-promotion.
- **WR-02 (fail-open FA-id):** `failedAttemptId` returns `null` (no best-effort filename id) when no `FA-<token>` is recoverable; `checkCarveOut` surfaces it as a named finding.
- **WR-03 (fail-open degrade):** `degradeToClaim` asserts its post-conditions and throws on failure (`kind: claim`, `confidence: UNKNOWN - verify`, no residual `§14-gate#` stamp).
- **WR-05 / D-05 (dial-independence):** asserted by construction — `checkCarveOut` findings are byte-identical across `aggressive`/`balanced`/`retain-raw` for the same single-mutation input; `_dial` is read only in the signature, never in a branch.
- **IN-01:** the former "wholly-dropped durable note is the agent's call" comment is replaced with the enforced verified-must-survive / unverified-may-drop policy.

## Deviations from Plan

None — plan executed exactly as written, tasks 1→2→3→4 in order. No auto-fixes (Rules 1-3), no architectural changes (Rule 4), no authentication gates. Promotion still routes only through `context-io.appendNote` (no forked writer added). No external packages installed (`node:fs` only, D-13/D-15).

## Known Stubs

None. No hardcoded empties, placeholders, or unwired data paths introduced.

## TDD Gate Compliance

`type: tdd` plan. Gate sequence satisfied in git history:
- RED gate: `test(22-03): add six adversarial RED cases ...` (`75653f8`) — six cases, four bypass + missing-dir demonstrably RED against the committed `.js`.
- GREEN gate: `fix(22-03): harden checkCarveOut ...` (`0519474`) and `fix(22-03): fail-closed failedAttemptId ...` (`cd5d616`).
- REFACTOR: not required (no separate cleanup commit).

No test passed unexpectedly during RED (the dial-byte-identity case passing at RED is intentional and documented above, not a fail-fast condition — it is the WR-05 invariant, not a bypass case).

## Threat Flags

None beyond the plan's `<threat_model>`. T-22-06 through T-22-10 are now mitigated (each proven by a RED-then-GREEN case); T-22-SC (npm installs) remains `accept` — zero external packages installed.

## Self-Check: PASSED

- Files modified exist on disk: `scripts/compactor.ts`, `scripts/compactor.js`, `scripts/compactor.test.ts` (all tracked, committed).
- Commits exist: `75653f8`, `0519474`, `cd5d616`, `f8f6988` (verified in `git log`).
- `npm run freshness` exit 0; full regression lane GREEN (235 passed, 1 skipped).
