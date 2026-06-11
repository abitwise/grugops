---
phase: 11-senior-persona-overhaul
fixed_at: 2026-06-11T00:00:00Z
review_path: .planning/phases/11-senior-persona-overhaul/11-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-06-11T00:00:00Z
**Source review:** .planning/phases/11-senior-persona-overhaul/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (the four WR-## warnings — CR/BLOCKER count was 0; the three IN-## info findings are out of scope per `fix_scope: critical_warning`)
- Fixed: 4
- Skipped: 0

All four in-scope warnings target the foundation-guard logic's false-negative surface
(`scripts/check-foundation-guards.sh`) and its fail-proof harness
(`scripts/check-foundation-guards.test.sh`). Both files are POSIX `sh`; all fixes stay
POSIX-compatible. After every guard-script change the clean tree was re-run
(`sh scripts/check-foundation-guards.sh` → `ALL CHECKS PASSED`, exit 0) and the harness was
re-run (`sh scripts/check-foundation-guards.test.sh` → `ALL CHECKS PASSED`, exit 0). Each
guard-logic fix also gained a dedicated RED proof case so the bypass it closes is now
mechanically demonstrated to fail.

## Fixed Issues

### WR-02: `guard_wr05` YAML-array pattern misses a quoted array item (`- "Agent"`)

**Files modified:** `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`
**Commit:** caa4114
**Applied fix:** Changed `WR05_ARRAY` from `^[[:space:]]*-[[:space:]]*(Agent|Task)\b` to
`^[[:space:]]*-[[:space:]]*["'\'']?(Agent|Task)\b`, adding an optional single/double-quote class
between the dash and the token. Verified the old pattern does NOT match `  - "Agent"` (bypass
confirmed) while the new pattern matches the double-quoted, single-quoted, and bare forms, keeping
the clean tree GREEN. Added a `wr05-array-quoted` planted-violation case to the harness
(`printf '\n  - "Agent"\n'` appended to the SKILL.md adapter) asserting the guard fails red with
`spawn grant` — RED-proven.
**Note:** Logic-bearing (a regex that mechanically enforces grugops's core no-spawn-grant safety
contract). Flagged for human verification of the regex below.

### WR-01: `guard_caveman_preserved` accepts a fully-sanded block that keeps only a `You are …` opener

**Files modified:** `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`
**Commit:** 366d955
**Applied fix:** Replaced the single-marker grep over `CAVEMAN_MARKERS="$VOICE_MARKERS|^You\b"`
(which passed any block retaining the universal `You are <Role>.` opener) with the count-based
test from the review: a block now needs `>=2` `^You`-cadence lines OR `>=1` bare grug idiom
(`VOICE_MARKERS`); a single opener fails. Removed the now-unused `CAVEMAN_MARKERS` variable.
Verified all 16 clean caveman blocks carry between 4 and 11 `^You` lines (min 4), so the `>=2`
threshold keeps the clean tree GREEN while rejecting a single-opener sand. Added a `|| true` to the
`grep -c` assignment — `grep -c` exits 1 on a zero count, which under `set -e` aborted the script
inside the command substitution exactly on the fully-sanded (zero-`^You`) block this guard must
FLAG; without the guard `|| true` the script crashed before the summary printed. Added a
`caveman-single-opener` RED case (block sanded to one opener + flowing prose, 1 `^You` line, no
idiom) asserting the guard fails red with `sanded to prose`. Confirmed the OLD logic PASSES this
single-opener block (bypass) and the NEW logic FLAGS it.
**Note:** Logic-bearing (changes the guard's pass/fail threshold). Flagged for human verification
that the `>=2 ^You OR >=1 idiom` rule is the intended evidence-of-voice bar.

### WR-03: `guard_voice` silently drops the file tail on a malformed `## Caveman prompt` fence

**Files modified:** `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`
**Commit:** 4d7a2d0
**Applied fix:** Added an `END { if (skip) print "__UNCLOSED_CAVEMAN_FENCE__" }` action to the
strip awk (an END action only — the fence anchor itself is untouched, honoring D-10
forward-compat), then a `grep -qF '__UNCLOSED_CAVEMAN_FENCE__'` after the strip that emits a
file-naming finding (`unterminated ## Caveman prompt fence — clear-voice tail not scanned`) and
`continue`s. Reproduced the bug: with an unbalanced fence the old strip awk produced NOTHING (the
clear-voice tail — `## Hard limits`, safety lines — was silently dropped). The sentinel carries no
VOICE_MARKER so it is detected by its own grep, not confused with a caveman marker. Verified the
clean tree stays GREEN (all 16 blocks have balanced fences) and a role with its closing ``` deleted
now fails red. Added a `voice-unclosed-fence` RED case (deletes the closing fence of `qe-e2e.md`)
asserting the guard fails red with `unterminated`.
**Note:** Logic-bearing (adds a new failure path to guard_voice). Flagged for human verification.

### WR-04: Missing-file test cases trip multiple guards' missing-file branches — weak attribution

**Files modified:** `scripts/check-foundation-guards.test.sh`
**Commit:** cafab6f
**Applied fix:** Tightened the two shared-file missing-file assertions to guard-specific phrases
instead of the bare filename. The `voice-missing` case (removes `compliance-officer.md`) now
asserts `required voice file missing` — the exact string `guard_voice` emits at the guard's
line 211. The `caveman-missing` case (removes `ba-pm.md`) now asserts `caveman prompt block
missing` — the substring `guard_caveman_preserved`'s presence-check branch emits. Empirically
confirmed that removing a shared role file prints the filename on THREE guards' branches
(`required voice file missing` / `required role file missing (caveman prompt block missing or
empty)` / `missing (role required)`), so the bare-filename assertions could pass even if the named
guard's own presence-check regressed; the guard-specific phrases now bind each test to its claimed
code path. Both tightened assertions pass against the real guard output.
**Note:** Test-only change (no guard logic altered); the asserted phrases were verified against the
guards' actual emitted output, so no human verification of logic is required.

## Deviations from the review's suggested fix

- **WR-01:** The review's minimal snippet did not include `|| true` on the `grep -c` assignment.
  Under the repo's mandatory `set -eu`, `grep -c` returning 1 on a zero count aborts the script
  inside `$( … )` — precisely on the sanded zero-`^You` block the guard must flag. Added `|| true`
  to make the count safe. This is an adaptation to the real code's `set -e` discipline, consistent
  with the existing `|| true` idiom used elsewhere in the guard.
- **WR-04 (caveman case):** The review cited "line 287" for the caveman phrase, but the missing-
  FILE branch that the `caveman-missing` test actually triggers is the guard's presence-check
  branch (line 276 region), which emits `… caveman prompt block missing or empty`. Both that branch
  and the empty-block branch (line 287 region) contain the substring `caveman prompt block missing`,
  so asserting that substring binds the test to `guard_caveman_preserved` regardless — the line
  number in the review was off by the missing-file vs empty-block distinction, but the asserted
  phrase is correct and verified against the real output.
- **WR-02 / WR-01 / WR-03 RED proofs:** The review asked (WR-02) to "add a planted `- "Agent"`
  case." Beyond that, RED proof cases were also added for WR-01 (single-opener sand) and WR-03
  (unterminated fence) so each guard-logic fix is mechanically demonstrated to close its bypass —
  matching the harness's existing one-planted-violation-per-guard no-fabrication contract.

---

_Fixed: 2026-06-11T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
