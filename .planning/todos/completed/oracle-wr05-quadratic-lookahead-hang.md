---
title: oracleWr05Wording hangs the foundation guard on any long line (quadratic lookahead)
created: 2026-08-04
severity: high
area: scripts/check-uat-oracles.ts
found_during: phase 27 wave 1 (execute-phase 27, plan 27-36 post-merge gate)
resolves_phase: 28
---

> **Closed by Phase 28, plan 28-02** (D-20, all three axes). `WR05_BEATS` regexes are now
> `^`-anchored with a trailing `[\s\S]` instead of pure zero-width lookaheads, and
> `WR05_MAX_LINE_BYTES` bounds the per-line work because `.planning/STATE.md` is an
> unbounded-line input. Verified at HEAD: `scripts/check-uat-oracles.ts:204-217`.

## What

`oracleWr05Wording` in `scripts/check-uat-oracles.ts` tests every line of the four
`WR05_SCAN` tracking docs with beat regexes built from **pure zero-width lookaheads**:

```js
const WR05_BEATS = [
  { label: "beat1: spawn grant dropped in Phase 8",
    re: /(?=.*\bdropped\b)(?=.*\bPhase[ -]?8\b)/i },
  { label: "beat2: guarded by guard_wr05 in Phase 10",
    re: /(?=.*guard_wr05)(?=.*\bPhase[ -]?10\b)/i },
  { label: "beat3: re-verified GREEN after Phase 11",
    re: /(?=.*re-verified GREEN)(?=.*\bPhase[ -]?11\b)/i },
];
```

`grepFiles` calls `re.test(line)` per line. Because the pattern contains **no consuming
atom**, a non-match is retried at every start position in the line, and each attempt
scans forward through `.*` with backtracking. Cost is quadratic in line length.

## Why it matters

`check-foundation-guards.js` — this repository's own safety gate — becomes
**non-terminating**, not merely slow. It is also the gate the whole vitest suite depends
on (`check-foundation-guards.test.ts` spawns it 112 times), so a single long line in any
of the four scan docs makes the entire suite unrunnable.

## Reproduced

During phase 27 wave 1, `.planning/STATE.md` line 18 (`prior_activity_desc`) reached
526,947 chars. Measured on hermetic `git archive` mirrors:

| tree | guard result |
|---|---|
| `78616c9` (before the long line) | `ALL CHECKS PASSED`, exit 0, fast |
| `2a2a18e` (with the 527 KB line) | **no termination inside 180 s**, 99% CPU, killed |
| after line repaired (`3f564e5`) | `ALL CHECKS PASSED`, exit 0, **0.41 s** |

The guard prints the `[oracleWr05Wording]` header and never returns — the header is the
last output, which makes the location unambiguous.

## Note on the trigger

The 527 KB line was itself a separate defect (a backslash escape cascade in the state
write path, 62 → 524,286 backslashes over ~13 state writes; see commit `3f564e5`). That
trigger is repaired, but **the oracle remains vulnerable to any long line from any
source** — a pasted transcript, a long verification narrative, a wide table row.

## Suggested fix

Give each beat regex a consuming anchor so a failed match cannot be retried at every
offset — e.g. test the two tokens independently against the line, or anchor with `^`
and let the lookaheads ride on a single anchored position:

```js
re: /^(?=[\s\S]*\bdropped\b)(?=[\s\S]*\bPhase[ -]?8\b)/i
```

An `^`-anchored pattern is attempted once per line instead of once per character, which
restores linear cost without changing which lines match.

Pin it with a test that feeds a ~500 KB single line and asserts the oracle returns
within a bounded time.

## Scope note

Not fixed in phase 27. All three round-6 plans (27-36, 27-37, 27-38) explicitly prohibit
editing files outside their declared `files_modified`, and `scripts/check-uat-oracles.ts`
is in none of them. Raised here for its own routing.
