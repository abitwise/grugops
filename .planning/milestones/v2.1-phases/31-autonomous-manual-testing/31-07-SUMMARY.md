---
phase: 31-autonomous-manual-testing
plan: 07
subsystem: infra
tags: [supply-chain, foundation-guards, playwright-mcp, version-pin, typescript, vitest]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-03's guard_playwright_mcp_pin, its scan set, its measured pass line and the recipe that holds the one pin literal"
provides:
  - "PIN_CONCRETE_VERSION_RE — an anchored concrete-version shape assertion applied to the pin authority before it is adopted"
  - "A named refusal on a floating authority citing the source file, its line and the rejected token"
  - "Five test cases covering both floating-authority configurations, the watched-fail control, and the two degenerate authorities"
  - "A rationale comment and a 31-03-SUMMARY correction that each claim exactly what the code decides"
affects: [pin bumps of @playwright/mcp, any future widening of what counts as a valid pin]

actuals:
  tokens: 5400
  tasks: 2
  commits: 2
plan_head_before: 1033e6f0fd1265b7cb3cd58529d927858ad38b59

tech-stack:
  added: []
  patterns:
    - "Validate what an authority READ before adopting it as the fact everything else is compared against — equality can never decide anything about the authority itself"
    - "Prove a new assertion by restoring the bypass in a mutated copy of the committed build, not by watching the assertion pass"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md

key-decisions:
  - "The shape assertion is scoped to the AUTHORITY branch only; the scan-side comparison is untouched so a non-authority floating specifier keeps failing as drift"
  - "The shape pattern is an allow-list (anchored major.minor.patch with an optional prerelease tail), not a deny-list of known dist-tag names"
  - "The new refusal reuses the one authorityRemedy sentence rather than composing a second remedy"
  - "Build metadata is refused loudly; widening the pattern is a decision, never a silent edit"

patterns-established:
  - "Authority-shape assertion: a value read out of prose is validated in place before it becomes the comparison basis"
  - "Watched-fail via runMutatedGuardIn: compose the existing scratch-build helpers rather than fork them, and return both source arms so the case can assert the mutation moved the file"

requirements-completed: [UATX-02]

coverage:
  - id: D1
    description: "A kit whose EVERY @playwright/mcp@ mention floats — the authority's own included — exits non-zero instead of printing a clean pass"
    requirement: UATX-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-authority-floats-all) a kit whose EVERY mention floats — the authority's own included — exits non-zero"
        status: pass
    human_judgment: false
  - id: D2
    description: "A kit whose authority alone floats reports the SHAPE fault on the authority — file, line and rejected token — rather than convicting the correctly-pinned mentions as drift"
    requirement: UATX-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-authority-floats-only) ONLY the authority floating is reported as the SHAPE fault on the authority, naming its file, line and token — not merely as drift elsewhere"
        status: pass
    human_judgment: false
  - id: D3
    description: "The shape assertion is the control: replacing the concrete-version predicate with a permissive one in a mutated copy of the committed guard restores the exit-0 bypass"
    requirement: UATX-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-shape-watched-fail) with the concrete-version predicate replaced by a PERMISSIVE one, the all-floating kit exits 0 again"
        status: pass
    human_judgment: false
  - id: D4
    description: "The degenerate authorities are decided rather than assumed: an EMPTY captured token reaches its own refusal with distinct text, and a scan set whose only mention-carrying file is the authority still prints a measured pass line with a non-zero numerator"
    requirement: UATX-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-empty-authority-distinct) an EMPTY captured token reaches its own refusal, distinct in text from the shape refusal"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-authority-only-scan-set) a scan set whose ONLY mention-carrying file is the authority still prints a MEASURED pass line with a non-zero numerator"
        status: pass
    human_judgment: false
  - id: D5
    description: "The four pre-existing scan-side cases still hold unchanged, so the shape assertion did not turn drift into a shape fault"
    requirement: UATX-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts — 286 passed (286)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The guard's rationale comment and 31-03-SUMMARY.md each claim exactly what the code decides, split by where the mention sits"
    requirement: UATX-02
    verification:
      - kind: other
        ref: "git diff --stat -- .planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md → 25 insertions, 0 deletions"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-no-version-literal) the guard declares NO version of its own"
        status: pass
    human_judgment: true
    rationale: "The mechanical half is proven (insertions-only, no version literal introduced), but whether a corrected comment now claims exactly what the code does is a reading judgment — this gap exists because the previous comment passed every mechanical check while asserting a control that did not exist."

duration: 24 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 07: Pin-Authority Shape Assertion Summary

**`guardPlaywrightMcpPin` now refuses a floating specifier at the pin authority with an anchored concrete-version allow-list, closing the bypass where a `@latest` first mention became the pin and every re-pinned mention compared equal to it.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-09-08T11:18:30Z
- **Completed:** 2026-09-08T11:42:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Reproduced gap 3 as a RED test before changing a line of the guard: an all-floating kit exited 0 with a clean measured pass line.
- Added `PIN_CONCRETE_VERSION_RE` and one authority branch that refuses a non-concrete token by name, citing file, line and rejected token.
- Watched the assertion fail: a permissive predicate in a mutated copy of the committed `.js` restores the exit-0 bypass.
- Decided the degenerate authorities (empty token, authority-only scan set) with their own cases rather than leaving them assumed.
- Corrected the guard's rationale comment and appended a dated, insertions-only correction to `31-03-SUMMARY.md`.

## Task Commits

1. **Task 1: RED-first — make the authority float, then assert its shape** — `f471c5c` (fix)
2. **Task 2: correct the rationale comment and append the dated correction** — `4f5be55` (docs)

Measured, not narrated: `git rev-list --count 1033e6f..HEAD` = 2 at SUMMARY-write time. The plan's
own metadata commit lands after this file is written and is therefore not in that count.

## Files Created/Modified

- `scripts/check-foundation-guards.ts` — `PIN_CONCRETE_VERSION_RE` (L3788) with its rationale; the authority shape branch (L3895-3904); the corrected `PIN_OCCURRENCE_SOURCE` comment.
- `scripts/check-foundation-guards.js` — the committed build of the above; rebuilt and committed in the same commit as its `.ts` each time.
- `scripts/check-foundation-guards.test.ts` — `pinCarriersIn`, `floatEveryPinIn`, `runMutatedGuardIn` and five new cases.
- `.planning/phases/31-autonomous-manual-testing/31-03-SUMMARY.md` — appended `## Correction — 2026-09-08`.

## RED evidence (recorded before the fix)

**RED 1 — `(pin-authority-floats-all)`, run against the guard as committed at `1033e6f`.** Exit
status `0`. The guard's own section, verbatim:

```
        pin `latest` read from agent-factory/checklists/browser-uat-recipe.md (line 40); 43 markdown file(s) walked across 2 of 5 configured root(s); ABSENT root(s) reported rather than dropped: README.md, docs, install
        the planning tree is deliberately outside this scan: it records the registry's current version beside the pinned one on purpose, so scanning it would convict correct text
  PASS  playwright MCP pin `latest` — pinned mention(s) over 43 markdown file(s): 0 findings over 7/7 elements
```

The assertion that moved: `expected +0 not to be +0` on `r.status`. A kit that pins nothing read as
a clean, fully-measured pass.

**RED 2 — `(pin-authority-floats-only)`, same commit.** Exit status non-zero, but for the wrong
reason and naming the wrong lines:

```
        pin `latest` read from agent-factory/checklists/browser-uat-recipe.md (line 40); 43 markdown file(s) walked across 2 of 5 configured root(s); ABSENT root(s) reported rather than dropped: README.md, docs, install
  FAIL  playwright MCP pin `latest` — pinned mention(s) over 43 markdown file(s): 6 finding(s) over 7 elements
  agent-factory/checklists/browser-uat-recipe.md:57: found `0.0.78`, expected the pin `latest` — bump the literal in agent-factory/checklists/browser-uat-recipe.md and re-pin every mention, or correct this one
  ... (five more identical rows, lines 58, 67, 76, 88, 102)
```

The guard adopted the dist-tag as the pin and convicted the **six correctly pinned mentions**. The
assertion that moved: `expected '        pin \`latest\` read from agent-…' to contain 'is not a
concrete version'`.

**RED 3 — `(pin-shape-watched-fail)`, same commit.** Failed with
`Error: scratchGuard: the mutation of check-foundation-guards.js matched nothing, so the scratch
build is identical to the committed one` — the constant did not exist to mutate.

**Honest accounting of the other two new cases.** `(pin-empty-authority-distinct)` and
`(pin-authority-only-scan-set)` both **passed before the fix**. They are not RED cases and are not
claimed as such: they are the degenerate-input decisions the plan asked for, and they exist to hold
the empty-token refusal distinct from the new shape refusal and to hold the single-carrier scan set
readable as a measurement. Calling them RED would be the fabrication this phase exists to delete.

## GREEN evidence (after the fix)

- `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts` → **286 passed (286)**, 1 file. All five new cases green; the four pre-existing scan-side cases (`pin-drift`, `pin-floating`, `pin-drift-two`, `pin-equal`) unchanged and green.
- `(pin-shape-watched-fail)` green: with `PIN_CONCRETE_VERSION_RE` replaced by `/^[\s\S]*$/` in a scratch copy of the committed `.js`, the all-floating mirror exits **0** and prints `0 findings over …` again. The case also asserts the mutated source differs from `GUARD_JS` and contains the permissive literal, so a silently no-opped mutation cannot read green.
- `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED` on the real tree.
- Full regression: `npx vitest run --exclude '**/scripts/e2e/**'` → **62 files passed, 3318 passed / 2 skipped**. Bare `npm test` was never run.
- `npm run build && npm run typecheck && npm run check:build-parity` → green (`Build parity: no tracked build output moved when tsc ran.`).
- `npm run freshness` → `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.`
- `npm run check:imperative-lexicon`, `check:banned-claims`, `check:public-docs`, `check:claim-anchors` → all four `ALL CHECKS PASSED`.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` → `ALL CHECKS PASSED`.

## Acceptance criteria

**Task 1**

| Criterion | Result |
|---|---|
| `grep -c PIN_CONCRETE_VERSION_RE` in `.ts` ≥ 2 | 2 at end of Task 1 (3 after Task 2's comment) — PASS |
| `grep -c PIN_CONCRETE_VERSION_RE` in `.js` ≥ 1 | 2 — PASS |
| New branch between the empty-version branch and the pin adoption | `guardPlaywrightMcpPin` opens L3855; empty-version branch L3888; **shape branch L3895-3904**; `const pin = first.version;` L3905 — PASS |
| `authorityRemedy` count +1 exactly | 5 → 6 — PASS |
| Pin-guard describe block gains ≥ 4 cases | 13 → **18** (+5) — PASS |
| Pre-fix outputs of both floating-authority cases quoted verbatim | See RED evidence above — PASS |
| Watched-fail asserts mutated source differs AND exits 0 | Both asserted in `(pin-shape-watched-fail)` — PASS |
| `TRIPWIRE_MODULES` count 1, value unchanged | 1 occurrence, **value 56**, unchanged. **No guarded module was added** — this plan hardens an existing guard, so the tripwire count is correctly untouched — PASS |
| `node scripts/check-foundation-guards.js` ends `ALL CHECKS PASSED` | PASS |

**Task 2**

| Criterion | Result |
|---|---|
| Rationale comment names `PIN_CONCRETE_VERSION_RE` (+1 grep) | 2 → 3 — PASS |
| No-version-literal acceptance case still passes | `(pin-no-version-literal)` green; the new constant's source carries no `\d+.\d+.\d+` literal — PASS |
| Last section heading begins `Correction` and carries an ISO date | `## Correction — 2026-09-08` — PASS |
| `git diff --stat` on `31-03-SUMMARY.md` shows insertions only | `25 ++++`, **0 deletions** — PASS |
| Correction cites `31-VERIFICATION.md`, `guardPlaywrightMcpPin`, `PIN_CONCRETE_VERSION_RE` | All three named — PASS |
| `npm run freshness` reports every committed `.js` fresh | 60/60 fresh — PASS |

## Decisions Made

- **The shape pattern is an allow-list, not a dist-tag deny-list.** Refusing `latest`, `next` and `beta` by name would pass the next tag nobody thought of. The guard admits a shape and refuses everything outside it — the same posture that finally closed Phase 27's frontmatter round.
- **The assertion is on the authority branch only.** Applying it to the scan set would turn a half-applied bump into a shape fault and lose the per-mention drift report, which is the whole question when a bump is half-applied.
- **One remedy sentence.** The new refusal reuses `authorityRemedy` rather than composing a second, matching the one-home discipline the pin itself follows.
- **`runMutatedGuardIn` composes the existing scratch helpers rather than reimplementing them.** `scratchGuardFiles` already refuses a no-op mutation; a second implementation would be a second place for that refusal to rot. It returns both source arms so the case asserts the mutation applied at the case level too.
- **`pinCarriersIn` derives the mention-carrying file set rather than listing it.** A hand-maintained list is the set-literal drift class this repository has been bitten by before.

## Deviations from Plan

**1. [Rule 3 - Blocking] `runMutatedGuardIn` was composed from the existing scratch harness rather than authored as a new copier**

- **Found during:** Task 1, Movement 3
- **Issue:** The plan specifies `runMutatedGuardIn(checkRoot, mutate)` as a helper that "copies the guard's import closure into a fresh temp directory, applies a textual mutation … and runs node against that copy." `scratchGuardFiles` + `runScratch` already do exactly that, including the throw-on-no-op-mutation guarantee the plan requires.
- **Fix:** Implemented `runMutatedGuardIn` as a named thin composition of those two, returning `{ result, before, after }` so the case can additionally assert the mutation moved the file.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `(pin-shape-watched-fail)` green; it asserts `after !== before` and that the permissive literal is present.
- **Committed in:** `f471c5c`

**2. [Scope note] `(pin-authority-only-scan-set)` asserts the derived carrier set rather than planting a synthetic single-mention recipe**

- **Found during:** Task 1, Movement 4
- **Issue:** Rewriting the mirrored recipe down to a single mention risked reddening unrelated guards that read that same recipe (31-06 added recipe-quoting assertions), which would have made the case's exit-0 assertion prove something about a different guard.
- **Fix:** The case instead *derives* the mention-carrying file set with `pinCarriersIn` and asserts it equals `[browser-uat-recipe.md]` — the authority is the only carrier — then asserts the measured pass line has a non-zero numerator equal to its denominator.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** Case green; the `toEqual([PIN_SOURCE_REL])` premise is derived from the mirror at run time, so it reds if another file ever gains a mention.
- **Committed in:** `f471c5c`

---

**Total deviations:** 2 (1 blocking-avoidance, 1 fixture-scope). **Impact:** No scope creep. Neither
changes what the plan asserts; both change how the assertion is reached, in each case to avoid a
case that would have proven something other than what it claims.

## Issues Encountered

None that required problem-solving. `npm run check:build-parity` reads red while the rebuilt `.js`
is uncommitted — that is the gate working as designed, and it went green immediately after each
task commit.

## Flagged, not fixed (out of the gap set)

These are named rather than silently changed, per the plan's assumptions section and the scope
boundary. None is a regression introduced here.

- **A1 (WR-09, plan-flagged).** The occurrence pattern admits `.` as a version character, so a
  sentence-final mention is a false FAIL. Untouched: widening what counts as a mention is a decision
  about the predicate's input.
- **A2 (WR-05 / WR-03, plan-flagged).** The pin guard's denominator floor is exercised only through
  the scratch build, and the no-version-literal case scans the guard region rather than the whole
  file. Both unchanged.
- **A4 (NEW, found while matching the existing branch shape).** Every early-return branch in
  `guardPlaywrightMcpPin` calls `fail()` — which itself does `FAILS += 1` — and then does
  `FAILS += 1` again. The counter is therefore incremented twice per authority refusal, including by
  the branch this plan added, which follows the plan's explicit instruction to match the shape of the
  three branches above it. This affects only the trailing `N CHECK(S) FAILED` tally, never the exit
  status or any finding text, and it pre-dates this plan by four branches. Left as found: correcting
  it would touch four branches this gap did not open and would move a number other cases may read.

## Threat Flags

None. This plan installs nothing, adds no dependency, opens no endpoint and changes no trust
boundary. It tightens the existing supply-chain control named in the plan's own threat register
(T-31-33 through T-31-36, all `mitigate`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap 3 of `31-VERIFICATION.md` is closed with a watched-fail control. `UATX-02`'s mechanical half is
  in place.
- Remaining gap-closure plan in this phase: **31-08**. Phase 31 should be re-verified against
  `31-VERIFICATION.md` once it lands; this SUMMARY does not claim the phase is verified.
- For a future pin bump the procedure is unchanged, with one addition: the first mention in
  `agent-factory/checklists/browser-uat-recipe.md` must now be a concrete version or the guard
  refuses it by name.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*

## Self-Check: PASSED

- All four modified files exist on disk (`[ -f ]`, 4/4 FOUND) plus the appended `31-03-SUMMARY.md`.
- All three commits resolve in `git log --all`: `f471c5c`, `4f5be55`, `089f910`.
- `git rev-list --count 1033e6f..HEAD` = 3 including this file's own docs commit; the frontmatter
  records 2, the measured count at SUMMARY-write time, with the reason stated in Task Commits.
- Plan `<verification>` re-run at close-out: `npx vitest run --exclude '**/scripts/e2e/**'`
  (62 files, 3318 passed / 2 skipped), `node scripts/check-foundation-guards.js`
  (`ALL CHECKS PASSED`), `npm run build`, `npm run typecheck`, `npm run check:build-parity`,
  `npm run freshness` (60 committed `.js` fresh), the four text gates, and
  `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` all exit 0. Bare `npm test` was
  never run.
- Only this plan's files were staged, by explicit path. The four pre-existing uncommitted paths
  (`.planning/milestone.lock`, `human-notes.txt`, `.gsd/`, `.planning/state.json`) were left alone.
