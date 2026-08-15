---
phase: 29-controlled-language-voice-guard-rebuild
plan: 20
subsystem: tooling / voice guards
tags: [LANG-06, LANG-07, CR-02, WR-01, WR-08, section-locator, fence-authority]
requires:
  - "scripts/frontmatter.ts — fencedLineFlags, FENCE_DELIMITER_LINE (the one fence toggle)"
  - "scripts/kit-model.ts — listRoles, ROLE_COUNT (corpus membership, derived)"
provides:
  - "scripts/frontmatter.ts :: unfencedHeadingIndex(text, heading) -> number"
  - "scripts/frontmatter.ts :: sectionEndIndex(text, from, level) -> number"
  - "the ONE section-locator authority plans 29-22, 29-23 and 29-24 consume"
affects:
  - "scripts/voice-model.ts (rewired; two private predicates deleted)"
  - "scripts/check-foundation-guards.ts (unchanged — verdict shape untouched)"
tech-stack:
  added: []
  patterns:
    - "compose the toggle, never fork it: both locators consume fencedLineFlags and declare no state of their own"
    - "one equality per predicate: the anchor's COUNT and POSITION apply the same trimEnd() rule"
    - "mutation-prove each pinned axis before believing a green suite"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/voice-model.ts
    - scripts/voice-model.js
    - scripts/voice-model.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "The section bound moved to frontmatter.ts rather than widening voice-model.ts's regex — the private SECTION_END constant is DELETED, not corrected (D-24)."
  - "The authority is fence-aware, which SUPERSEDES 29-14's `unterminated` expectation for a `## ` line inside a terminated fence interior. That expectation was a false red on correct bytes, the same class as WR-01."
  - "The anchor is a string constant compared with trimEnd(), not a regex, so the anchor COUNT and the anchor POSITION cannot come to disagree."
  - "The anchor count takes fencedLineFlags directly rather than looping unfencedHeadingIndex — a count is not a first index, and a 'next one after i' loop would be a second traversal with its own termination behaviour."
metrics:
  duration: 18m
  completed: 2026-08-15
actuals:
  tokens: 16000
  tasks: 3
  commits: 3
status: complete
---

# Phase 29 Plan 20: One Section-Locator Authority Summary

Both live bypasses are closed by moving the caveman section bound out of `voice-model.ts` into a
single fence-aware, level-aware locator pair in `scripts/frontmatter.ts`, with each pinned axis
mutation-proven and a third fail-open — introduced mid-plan and invisible to a green suite — found
and closed by adversarial probe.

## What Was Built

`scripts/frontmatter.ts` gained exactly two exported functions, declared beside `fencedLineFlags`
and consuming it:

- `unfencedHeadingIndex(text: string, heading: string): number` — first line not inside a fence
  whose `trimEnd()` equals `heading`, or `-1`.
- `sectionEndIndex(text: string, from: number, level: 1 | 2): number` — first line at `from` or
  later that is not inside a fence and is an ATX heading of level at most `level`, or
  `text.split("\n").length`.

`scripts/voice-model.ts` now declares **no section predicate and no anchor predicate of its own**.
The module-level `SECTION_END = /^## /` constant and its bounding loop are deleted; the
`CAVEMAN_HEADING_LINE = /^## Caveman prompt$/` regex is replaced by a string constant compared
through the authority's own equality.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 (tracer) | CR-02 end-to-end through a new shared authority | `f89794a` | frontmatter.ts/.js, voice-model.ts/.js, voice-model.test.ts, check-foundation-guards.test.ts |
| 2 | Pin the unified authority's SCOPE | `040d41e` | frontmatter.test.ts |
| 3 | WR-01 — the anchor scan consumes the authority | `0c35fae` | voice-model.ts/.js, voice-model.test.ts, check-foundation-guards.test.ts |

## RED Transcripts, Verbatim

### CR-02 at the reader — `npx vitest run scripts/voice-model.test.ts -t "level-one"`

```
 FAIL  scripts/voice-model.test.ts > readCavemanFence — the section bound (plan 29-14, CR-01) > the level-one bound: a `# ` heading closes the caveman section, exactly as `## ` does
AssertionError: expected { ok: true, …(2) } to deeply equal { ok: false, reason: 'missing' }

- Expected
+ Received

  {
-   "ok": false,
-   "reason": "missing",
+   "inside": "grug club rock cave smash",
+   "ok": true,
+   "outside": "You senior prose here with no fence at all.
+
+ # Appendix
+ Some later top-level section.
+ ",
  }
```

Reproduced independently against the committed build at HEAD:

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence([...].join("\n")))))'
{"ok":true,"inside":"grug club rock cave smash","outside":"You senior prose here with no fence at all.\n\n# Appendix\nSome later top-level section.\n"}
```

### CR-02 at the gate — `npx vitest run scripts/check-foundation-guards.test.ts -t "LEVEL-ONE lexicon-bearing"`

```
 FAIL  scripts/check-foundation-guards.test.ts > check-foundation-guards.js (SDLC-02 / SC2 fail-proof harness) > the full gate exits 1 on a de-fenced role carrying a later LEVEL-ONE lexicon-bearing fence
AssertionError: expected +0 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 0
```

### WR-01 at the reader — the quoted anchor

```
 FAIL  scripts/voice-model.test.ts > … > a fenced QUOTATION of the anchor is not a second heading — no `multiple` on correct bytes
AssertionError: expected false to be true // Object.is equality
```

Reproduced independently against the committed build at HEAD:

```
$ node -e 'import("./scripts/voice-model.js").then(m=>console.log(JSON.stringify(m.readCavemanFence([...].join("\n")))))'
{"ok":false,"reason":"multiple"}
```

## The Third Bypass — Introduced by Task 1, Found by Probe, Closed by Task 3

**The suite was green when this existed.** After Task 1 the bound was fence-aware while the anchor
scan still tested raw lines, and a predicate that is fence-aware in one half and fence-blind in the
other is not one authority — it is two, disagreeing inside a single function. An odd fence delimiter
**above** the anchor leaves the section's own boundary heading flagged, so the bound ran to EOF while
the anchor was still found, and the reader adopted a later section's block again:

```
Task 1 state:  readCavemanFence("```\nstray\n## Caveman prompt\nYou senior prose.\n## Notes\n```\ngrug club rock cave\n```\n")
               → {"ok":true,"inside":"grug club rock cave", …}     ← CR-02 in a different hat
After Task 3:  → {"ok":false,"reason":"missing"}                    ← fail-closed
```

Found by running an adversarial probe sweep against the built `.js` immediately after Task 1's
verification passed, not by any test. It is now pinned by
`an anchor that is itself INSIDE a fence donates no heading — the section is `missing``.

## Task 2 — Scope Pinned on Six Axes, Each Mutation-Proven

Ten cases in the new `describe("the section locator's scope (plan 29-20, CR-02 / WR-08)")` block:

1. the `from` bound (swept over every legal `from`; inclusive at its own end)
2. the EOF fallback is the ARRAY LENGTH, proven through a `[from, end)` slice
3. the level axis, five outcomes: `# ` and `## ` close at level 2, `### ` does not, only `# ` at level 1
4. the disclosed ATX-space / no-indent floor
5. fence-awareness at BOTH functions (a heading inside a fence closes nothing and is not located)
6. the same lines OUTSIDE a fence both close and locate — the other side of axis 5
7. the live hazard, derived from the watched corpus
8. trailing whitespace located, leading whitespace refused
9. the unterminated-fence fail-safe, inherited from the toggle
10. the derived fence-machine set, re-measured

**Case count: 10.**

The live-hazard case is derived, not transcribed. Measured this session:

| File | Level-one lines INSIDE a fenced example |
|---|---|
| `README.md` | 17 (`# install (Node 22+)`), 19 (`# then, in your coding agent:`) |
| `agent-factory/README.md` | 105, 109, 113, 116, 119, 122, 125, 128, 131 |

A locator that became level-aware but stayed fence-blind would truncate every `## ` section above
those lines AT them, in four gates at once.

### Mutation proof

The first mutation harness **produced a false result** and is recorded here because that is the
failure mode this phase keeps meeting. `npm run build` was piped to `/dev/null`; four of six
mutations made a local unused and failed `tsc`, so the tests read a stale `.js` and reported "10
passed" for mutations that were never in the build. Re-run with the build asserted:

| Mutation | Cases that failed |
|---|---|
| M1 `sectionEndIndex` fence-blind | fence-awareness, live-hazard corpus, unterminated fail-safe (3) |
| M2 level parameter ignored (always level 2) | the five-outcome level case (1) |
| M3 EOF fallback returns `lines.length - 1` | `from`, EOF, level, ATX-space, fence, unterminated (6) |
| M4 heading equality without `trimEnd()` | trailing/leading whitespace (1) |
| M5 search starts at 0, ignoring `from` | 8 of 10 |
| M6 `unfencedHeadingIndex` fence-blind | fence-awareness, unterminated fail-safe (2) |

Every axis is owned by a case that fails when that axis breaks.

### Fence-machine set, re-derived this session

```json
[
  "scripts/check-foundation-guards.test.ts",
  "scripts/frontmatter.ts",
  "scripts/generate-role-adapters.test.ts"
]
count: 3
```

Unmoved. The new locators match neither classifier arm — composing the toggle is not forking it.

## Gate Numbers, Before and After

| Gate | Before (`3ed76c1`) | After (`0c35fae`) |
|---|---|---|
| `check-foundation-guards` | exit 0, `caveman voice: 0 findings over 17/17 elements`, ALL CHECKS PASSED | identical |
| `check-imperative-lexicon` | exit 0 | exit 0 |
| `check-diff-disposition` | exit 0, `37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s) derived; 1532 disposition row(s) across 8 file(s)` | identical |
| `check-banned-claims` | exit 0 | exit 0 |
| `npm run freshness` | exit 0, 48 committed `.js` fresh | exit 0, 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 | exit 0 |

The live corpus is byte-unmoved, as the plan required. The proof of this fix is a planted input, not
a moved number.

## Adversarial Probe Sweep (final state)

| # | Shape | Verdict |
|---|---|---|
| 1 | de-fenced + later `# ` + fence | `missing` |
| 2 | de-fenced + later `## ` + fence | `missing` |
| 3 | de-fenced + later `### ` + fence | `ok` (correct — a subsection is inside the section) |
| 4 | anchor quoted in a fence, real one present | `ok`, real interior |
| 5 | anchor ONLY inside a fence | `missing` |
| 6 | anchor with trailing space | `ok` |
| 7 | anchor with leading space | `missing` |
| 8 | two anchors, one of them fenced | `ok` — not `multiple` |
| 9 | two real anchors | `multiple` |
| 10 | open fence above the anchor | `missing` |
| 11–12 | anchor is the last section, fence runs to EOF | `ok`, full interior |
| 13 | unterminated within its own section | `unterminated` |
| 14 | empty document | `missing` |
| 15 | anchor with a trailing `\r` (CRLF checkout) | `ok` |

## Deviations from Plan

### 1. [Rule 1 — the plan asserted a fact that the plan's own design falsifies] The 29-14 `unterminated` expectation is SUPERSEDED

- **Found during:** Task 1, at first GREEN run.
- **Truth affected:** *"the fail-CLOSED cost recorded in `voice-model.ts` survives the rewire
  unchanged — a `## ` line inside the fence interior still pulls the bound in front of the closing
  delimiter and the reader still refuses `unterminated`."*
- **Issue:** that truth cannot hold alongside the same plan's requirement that the authority be
  fence-aware. A `## ` line the author wrote INSIDE a fence is flagged by `fencedLineFlags`, so it
  closes nothing and the reader returns the true interior. The two requirements are contradictory;
  the fence-aware one is load-bearing for CR-02, WR-01 and three later plans, and the alternative —
  a fence-blind bound — is explicitly prohibited by this plan ("never give the authority an opt-out
  parameter that restores the fence-blind or level-two-only behaviour").
- **Resolution:** the superseded expectation is **not** silently re-baselined. The 29-14 case is
  rewritten to pin the new property with its old expectation and the reason for the move recorded
  in place, and a **new sibling case was added** so the fail-closed direction keeps a pin of its own:
  a genuinely unterminated fence (closing delimiter absent) still refuses `unterminated`.
- **Why this is not a weakening:** the old refusal was a false red on a well-formed fence — the same
  class as WR-01, produced by a locator that could not tell a written heading from a quoted one.
  Nothing became reachable that was not reachable before: the interior is measured in FULL by both
  consumers.
- **Files:** `scripts/voice-model.test.ts`. **Commit:** `f89794a`.

### 2. [Rule 1 — bug] The first draft of the gate case was VACUOUS and passed against the build it existed to fail

- **Found during:** Task 1 RED.
- **Issue:** the plant appended `# Notes` at end of file, copying 29-14's arrangement. But
  `## Caveman prompt` in `brownfield-mapper.md` is followed at line 18 by `## Reads`, so the
  pre-29-20 level-two bound already closed there and already returned `missing`. The case passed at
  HEAD, discriminating nothing.
- **Fix:** the level-one successor is inserted immediately below the de-fenced prose, ABOVE the next
  `## ` heading, and a **discrimination assertion** was added: the next unfenced level-two heading
  must sit BELOW both delimiters, so under the old bound the fence was inside the section and only
  the LEVEL axis can refuse it. Without that line the case could silently become vacuous again.
- **Files:** `scripts/check-foundation-guards.test.ts`. **Commit:** `f89794a`.

### 3. [Rule 2 — missing critical functionality] The anchor's COUNT and POSITION would have applied two different equalities

- **Found during:** Task 3 design.
- **Issue:** the plan directs the count to consume `fencedLineFlags` and the position to consume the
  shared locator. Left literally, the count would have kept testing `/^## Caveman prompt$/` while the
  position used the authority's `trimEnd()` equality — so a heading carrying one trailing space would
  be located by one half and not counted by the other. That is a two-grammar defect inside one
  function, in the plan whose whole subject is two-grammar defects.
- **Fix:** `CAVEMAN_HEADING_LINE` (regex) became `CAVEMAN_HEADING` (string), and the count is written
  with the same `trimEnd()` equality the locator applies. CR-01's whole-line property is preserved
  exactly — `## Caveman prompted` is still not this string.
- **Files:** `scripts/voice-model.ts`. **Commit:** `0c35fae`.

### 4. Consumer pin moved TWICE rather than once

The plan has Task 3 move `voice-model.ts`'s imported-symbol equality from one symbol to four. But
Task 1 already adds `sectionEndIndex`, and Task 1's own `<verify>` runs
`check-foundation-guards.test.ts` — so leaving the pin at one symbol would have failed Task 1's
verification. The pin moved to two symbols in `f89794a` and to four in `0c35fae`, each movement
acknowledged in place. The three sibling equalities are byte-unchanged (verified by diff); plans
29-22 through 29-24 move each with its own reason.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-20-SC` had an empty input set as predicted: no package-manager install occurred, and
`package.json` is unchanged.

## Residuals Named, Not Absorbed

- **The ATX floor is disclosed, not closed.** A bare `#` line (a legal empty h1 in CommonMark) and
  up-to-three-space-indented ATX are not recognised as headings. This is deliberate: it keeps the
  authority byte-compatible with the four predicates it replaces, so the unification cannot silently
  re-measure what any of the four gates scans. Widening either axis is a behaviour change to four
  gates at once and belongs in its own plan with its own corpus measurement. Recorded at the
  declaration in `scripts/frontmatter.ts`.
- **Three consumers still hold private section-end predicates** — `check-diff-disposition.ts`,
  `check-banned-claims.ts` and `check-imperative-lexicon.ts`. Plans 29-22, 29-23 and 29-24 move each.
  Until they do, LANG-07 is not closed; this plan closes only the consumer that carried a live bypass.

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND (exports `unfencedHeadingIndex`, `sectionEndIndex`)
- `scripts/frontmatter.js` — FOUND, fresh
- `scripts/frontmatter.test.ts` — FOUND (10 new cases)
- `scripts/voice-model.ts` — FOUND. Both private declarations are gone: `CAVEMAN_HEADING_LINE` has
  zero occurrences, and `SECTION_END` has exactly one — line 115, a comment recording the deletion,
  not a declaration.
- `scripts/voice-model.js` — FOUND, fresh
- `scripts/voice-model.test.ts` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- commit `f89794a` — FOUND
- commit `040d41e` — FOUND
- commit `0c35fae` — FOUND
