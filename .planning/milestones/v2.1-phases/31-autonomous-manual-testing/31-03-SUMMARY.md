---
phase: 31-autonomous-manual-testing
plan: 03
subsystem: testing
tags: [playwright-mcp, supply-chain, version-pin, checklist, foundation-guard, vacuity-floor, mutation-testing]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-02's BANNED_CONSTRUCTS, PARSER_ABSENT_MARKER and BROWSER_ABSENT_STAGES — the shipped constants this recipe quotes"
  - phase: 31-autonomous-manual-testing
    provides: "31-01's sha / gate_run / content_hash artifact-ref fields — the provenance shape this recipe documents"
  - phase: 29-language-guards
    provides: scripts/vacuity.ts reportMeasured — the four ordered branches the new guard folds through
provides:
  - agent-factory/checklists/browser-uat-recipe.md — the single home for agent-authored browser UAT
  - the pinned browser-MCP setup for all five host CLIs, with package.json unchanged
  - PLAYWRIGHT_MCP_PIN_SOURCE and guardPlaywrightMcpPin — the pin guard that READS the literal rather than restating it
  - the attended Chrome lane's attended-only predicate, its vendor-side half, and its absence on four hosts
affects: [31-04 chrome-lane, 05-pr-quality-gate wiring, 06-uat-pack authoring step]

actuals:
  tokens: 14664
  tasks: 2
  commits: 4
plan_head_before: 9343314cbae98ec9d585296037e92b74b00fbffb
# commits MEASURED with `git rev-list --count 9343314..HEAD` at SUMMARY-write time (4 production
# commits: docs, RED, GREEN, hardening). The docs close-out commit carrying this file lands after
# the measurement, so re-running the command later reports 5.
# tokens is chars/4 over `git diff 9343314..HEAD` (58656 chars) — the estimate's scale, not a
# harness token count. The plan estimated 64000; the realized diff is 4.4x smaller.

tech-stack:
  added: []
  patterns:
    - "Read the fact, never restate it: a guard over a documented version reads the literal out of its one home and asserts its own source carries no version literal"
    - "Fail closed on the authority: an absent, unreadable, mention-free or version-free source each FAIL by name, and no fallback default exists"
    - "An unreachable floor is exercised through a scratch build, not left present-but-unexercised"

key-files:
  created:
    - agent-factory/checklists/browser-uat-recipe.md
  modified:
    - agent-factory/checklists/00-index.md
    - install/README.md
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js

key-decisions:
  - "The pin bullet is written as a full pinned specifier so it IS the first occurrence the guard reads, making the prose claim and the mechanism agree literally rather than approximately"
  - "An occurrence is the package name plus whatever version token runs to a delimiter, so a floating specifier is a FINDING rather than something the pattern declines to see; an empty version token is also a finding"
  - "The authority is the FIRST mention in the recipe, never the first one that parses — searching until something works would adopt a version nobody nominated"
  - "The planning tree is excluded from the scan with the reason recorded in source: it deliberately records the registry's current version beside the pinned one, so scanning it would convict correct text"
  - "The guard runs last among the foundation guards: it is the only one whose subject is a third-party version rather than the kit's own structure, and nothing above it reads its result"
  - "Three cardinality pins moved (GOVERNED_CORPUS_COUNT, BANNED_CLAIM_SCAN_COUNT and the exported-pins test), contradicting the plan's claim that no count needed bumping"

patterns-established:
  - "Pattern: assert the ABSENCE of a restated fact — the acceptance test greps the guard's own source region, comments included, for a version literal"
  - "Pattern: when a mutant survives, add the case that discriminates it rather than declaring the mutant equivalent; record the genuinely equivalent ones by name"

requirements-completed: [UATX-02]

coverage:
  - id: D1
    description: "The browser-UAT recipe is the single home for the pinned browser-MCP setup across all five host CLIs, and grugops installs nothing for it"
    requirement: "UATX-02"
    verification:
      - kind: other
        ref: "node -e '(text.match(/@playwright\\/mcp@/g)||[]).length >= 5' over the recipe — 7 occurrences, all equal"
        status: pass
      - kind: other
        ref: "grep -c 'mcp@latest' agent-factory/checklists/browser-uat-recipe.md — 0"
        status: pass
      - kind: other
        ref: "git diff 9343314..HEAD -- package.json — empty"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-live) passes on the real tree and reports what it scanned"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every pinned mention across the kit and the docs equals the ONE literal in the recipe, and the guard reports what it scanned rather than asserting a pass"
    requirement: "UATX-02"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-drift) a DIFFERENT version anywhere in the scan set is one finding naming file, found and pin"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-floating) a floating specifier is a finding of the same shape"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-drift-two) two mentions of the SAME wrong version are TWO findings, never one merged row"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-equal) two files each carrying an EQUAL mention are two visited elements, zero findings"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-versionless-mention) a mention with NO version anywhere in the scan set is a finding"
        status: pass
      - kind: other
        ref: "adversarial mutation of the guard: 11 mutants, 10 killed, 1 recorded as equivalent (transcript in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both routes by which the pin guard could silently pass are closed: a zero-occurrence or short scan, and a missing or unparseable authority"
    requirement: "UATX-02"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-vacuity) a scan set that yields ZERO occurrences FAILS with the zero-elements message"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-short-scan) a loop that stops early reports a SHORT scan, never a clean one"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-no-authority) a mirror whose recipe is GONE fails naming the recipe, never assuming a version"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-unparseable-authority) a recipe carrying NO pinned mention fails naming the recipe"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-versionless-authority) a recipe whose first mention carries NO version fails naming the recipe"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#(pin-first-not-first-parseable) the authority is the FIRST mention, never the first one that parses"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#(pin-no-version-literal) the guard declares NO version of its own"
        status: pass
    human_judgment: false
  - id: D4
    description: "The recipe's prose claims match the shipped mechanisms: the ban set as BANNED_CONSTRUCTS decides it, the content hash as a recomputable digest rather than a security control, and the attended lane's absence on four hosts stated once"
    requirement: "UATX-03"
    verification: []
    human_judgment: true
    rationale: "Prose-to-mechanism correspondence was established by reading BANNED_CONSTRUCTS, its deliberate-exclusion comment and the context-note contract while writing, and by the D-12 absence being an assertion about what does NOT exist in any adapter. No automated test compares the recipe's sentences against those sources, so a human must confirm the wording still matches after any change to either side."
  - id: D5
    description: "The recipe is indexed in exactly one tier table and pointed at from the install README, and every derived text gate stays green over the enlarged corpus"
    verification:
      - kind: other
        ref: "grep -c browser-uat-recipe over 00-index.md (1) and install/README.md (1)"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon — 0 findings over 48/48 elements"
        status: pass
      - kind: other
        ref: "npm run check:banned-claims — 0 findings over 119/119 elements"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js — ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D6
    description: "The attended-only predicate as documented matches what `claude auth status --json` actually reports on an API-key-only box and under a long-lived setup token"
    verification: []
    human_judgment: true
    rationale: "Research assumptions A2 and A3 are unreachable without destroying this box's real credentials, and A4 (field-name stability) was measured on exactly one Claude Code version. The recipe states the predicate positively and fail-closed and carries both residuals as UNKNOWN - verify. The Windows leg of every browser probe is unverified per the standing WINDOWS.md posture."

duration: 45 min
completed: 2026-09-07
status: complete
---

# Phase 31 Plan 03: The Browser-UAT Recipe and the Pin Guard Summary

**One enterprise-tier checklist carrying the pinned `@playwright/mcp` setup for all five host CLIs, the evidence and provenance rules, the ban set quoted from the shipped constant and the attended Chrome lane's four-host absence — plus a foundation guard that reads the pin literal out of that recipe and refuses to pass a scan it did not perform.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-09-07T17:35:00Z
- **Completed:** 2026-09-07T18:20:00Z
- **Tasks:** 2
- **Files modified:** 11 (1 created, 10 modified)

## Accomplishments

- The pinned browser-MCP setup is documented **once**, for all five host CLIs, with the pin
  substituted into every registration and `mcp@latest` appearing zero times. `package.json` gained
  nothing: no dependency, no script, no configuration key.
- The pin has **one home and one reader**. The guard extracts the literal from the recipe and
  declares no version of its own; an acceptance test greps the guard's own source region — comments
  included — and requires zero version literals in it.
- The guard **fails closed on its own authority** in four distinct shapes, each named by test: an
  absent recipe, an unreadable one, one carrying no pinned mention, and one whose first mention
  carries no version. There is no fallback default version anywhere in the code path.
- Both silent-pass routes are **reachable by test**, not merely present. The zero-occurrence floor
  and the short-scan floor are exercised through the scratch-build harness, because the authority is
  itself a member of the scan set and a partial loop has no natural cause.
- The claim matches the mechanism. The ban set is quoted from `BANNED_CONSTRUCTS` and names the
  three deliberate exclusions; the content hash is described as a recomputable digest that is
  explicitly not tamper-proof and not a security token, with the un-hashed transitive imports
  disclosed.
- **Eleven mutants, ten killed.** Four survived the first round and each one produced a new
  discriminating case rather than a shrug.

## Task Commits

1. **Task 1: the recipe, its index row and the install pointer** — `2b1e7bc` (docs)
2. **Task 2 RED: the pin guard's contract** — `9dd2eaf` (test)
3. **Task 2 GREEN: `guard_playwright_mcp_pin`** — `ab5d452` (feat)
4. **Task 2 hardening: four mutation-survivor gaps closed** — `4db9017` (test)

**Plan metadata:** see the `docs(31-03)` commit that carries this file.

_Note: the plan's Task 2 is `tdd="true"`; its RED, GREEN and hardening commits are the three above._

## Files Created/Modified

- `agent-factory/checklists/browser-uat-recipe.md` — the new enterprise-tier recipe: evidence
  boundary, spec location, the pin and five registrations, provenance, the ban set, the two loud
  skips, the attended Chrome lane, and the platform note.
- `agent-factory/checklists/00-index.md` — one enterprise-tier row, and no other table.
- `install/README.md` — one short section pointing at the recipe by name and stating that grugops
  installs nothing for it.
- `scripts/check-foundation-guards.ts` / `.js` — `PLAYWRIGHT_MCP_PIN_SOURCE`, the occurrence
  pattern, the sorted derived walk, `guardPlaywrightMcpPin`, and its registration in the run tail.
- `scripts/check-foundation-guards.test.ts` — 13 pin cases plus the recipe's entry in `GUARD_INPUTS`.
- `scripts/check-imperative-lexicon.ts` / `.js` / `.test.ts` — `GOVERNED_CORPUS_COUNT` 47 → 48.
- `scripts/check-banned-claims.ts` / `.js` — `BANNED_CLAIM_SCAN_COUNT` 118 → 119.

## Decisions Made

- **The pin bullet is a full pinned specifier.** The plan's shape for the bullet followed the sibling
  recipe (`` `@playwright/mcp` `0.0.78` ``), which the guard's occurrence pattern would not have
  matched — so the bullet the prose calls "the single home" would not have been the literal the
  guard reads. Writing it as one specifier makes the claim and the mechanism agree literally.
- **A floating specifier is a finding, not an unseen token.** The occurrence pattern captures
  whatever version token runs to a delimiter, so `@latest` is compared like any other version. A
  pattern that only recognised dotted numerals would have declined to see the exact anti-pattern the
  pin exists to prevent.
- **A mention with no version is also a finding.** A mention nobody can check is not a mention this
  guard may skip.
- **The authority is the FIRST mention, never the first that parses.** "Search until something
  works" would silently adopt a version nobody nominated when the nominated one is malformed.
- **The planning tree is not a scan root**, with the reason recorded in source rather than implied:
  it deliberately records the registry's current version beside the pinned one, so scanning it would
  convict correct text.
- **Absent scan roots are reported, never dropped.** A hermetic mirror carries only some of the five
  configured roots, so the guard prints how many of them it read and names the missing ones. A scan
  that narrowed itself says so on its own line.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Three cardinality pins had to move; the plan said none did**

- **Found during:** Task 1
- **Issue:** The plan states "The checklist cardinality constants pin roles, workflows, skill
  adapters and plugin skills, not checklists, so no count needs bumping." Two derived scan sets
  disagree, and both are two-sided: `GOVERNED_CORPUS_COUNT` in
  `scripts/check-imperative-lexicon.ts` derives its checklist part from a directory listing (47,
  breakdown `checklists 13`), and `BANNED_CLAIM_SCAN_COUNT` in `scripts/check-banned-claims.ts`
  derives a `kit` part that includes every checklist (118, breakdown `kit 73`). A new checklist
  enters both by existing, which is exactly what a two-sided pin is for.
- **Fix:** `GOVERNED_CORPUS_COUNT` 47 → 48, `BANNED_CLAIM_SCAN_COUNT` 118 → 119, and the exported-pins
  assertion in `scripts/check-imperative-lexicon.test.ts` 47 → 48. Each move names the entrant and
  records its admission test in a comment beside the constant, per the convention both files already
  use for their prior moves.
- **Verification:** the run that moved the pins reported `0 findings over 48/48 elements` and
  `0 findings over 119/119 elements` — the entrant costs zero reds on correct text.
- **Committed in:** `2b1e7bc`

**2. [Rule 3 - Blocking] Every foundation-guards mirror would have red on a missing authority**

- **Found during:** Task 2 (before the RED test)
- **Issue:** `scripts/check-foundation-guards.test.ts` builds hermetic mirrors from an explicit
  `GUARD_INPUTS` copy manifest. The new guard reads its pin literal from the recipe by fixed
  subpath and fails closed when it is absent, so every unrelated plant case in that file would have
  failed on a missing recipe instead of on the violation it planted — and the deliberate
  `(pin-no-authority)` deletion case would have proven nothing.
- **Fix:** the recipe joins `GUARD_INPUTS`, with the reason recorded beside it.
- **Verification:** `scripts/check-foundation-guards.test.ts` 281 passed.
- **Committed in:** `9dd2eaf`

**3. [Rule 2 - Missing Critical] The plan's occurrence rule left two shapes undecided**

- **Found during:** Task 2
- **Issue:** The plan says the guard extracts "the first `@playwright/mcp@<version>` occurrence" and
  compares the rest, which leaves undecided what a mention with an EMPTY version token is, and
  whether a malformed first mention may be skipped in favour of a later valid one. Both are silent
  routes to a weaker check.
- **Fix:** an empty version token is a finding in the scan set and a fail-closed refusal in the
  authority; the authority is the first mention unconditionally. Both are pinned by test
  (`(pin-versionless-mention)`, `(pin-versionless-authority)`, `(pin-first-not-first-parseable)`).
- **Verification:** mutants M4 and M9 both survived until these cases existed, then died.
- **Committed in:** `ab5d452` and `4db9017`

**4. [Scope note, not a defect] The plan's pin-bullet shape was changed**

- The plan's Task 1 asked for the pin "in the pinned-version-with-a-verification-date shape the
  sibling recipe uses", which separates the package name from the version. Followed literally, the
  bullet would not have been an occurrence of the pattern the guard reads, so the file's stated
  single home and the guard's actual authority would have been different bytes. The verification
  date is kept; the package and version are joined.

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical) + 1 scope note.
**Impact on plan:** every fix was necessary for a plan criterion to be reachable or honest. No scope
creep: no dependency added, no `package.json` change, no new config key, no new checklist beyond the
one the plan specifies.

## Adversarial verification (a green suite is not proof)

Per this repository's standing rule, the implementation was mutated and the suite re-run. Each
mutation was asserted to have applied, and the tree was restored and rebuilt after every run.

| Mutant | What it defeats | Round 1 | After hardening |
|---|---|---|---|
| M1 `if (o.version !== pin)` → `if (false)` | the comparison itself | 3 failed / 7 passed | — |
| M2 findings deduplicated by version | one row per wrong place | 1 failed / 9 passed | — |
| M3 `visited += 1` → `visited = occurrences.length` | the short-scan denominator floor | **12 passed (SURVIVED)** | 1 failed / 12 passed |
| M4 `o.version !== ""` tolerated | a mention with no version | **12 passed (SURVIVED)** | 2 failed / 10 passed |
| M5 the recipe-absent branch replaced by a `warn` | fail-closed on a missing authority | 12 passed | **equivalent — see below** |
| M6 `expected` floored at 1 | the reported denominator | 12 passed | **equivalent — see below** |
| M7 the walk never recurses | the derived scan set | 7 failed / 5 passed | — |
| M8 `visited` and `expected` both floored at 1 | BOTH vacuity floors | **13 passed (SURVIVED)** | 1 failed / 12 passed |
| M9 authority = first PARSEABLE mention | "search until something works" | **13 passed (SURVIVED)** | 1 failed / 12 passed |
| M10 a versionless authority accepted | fail-closed on an unparseable pin | 1 failed / 11 passed | — |
| M11 `.planning` added to the scan roots | the recorded input boundary | 1 failed / 12 passed | — |
| *(control, unmutated)* | — | **13 passed** | **13 passed** |

**Ten killed, one equivalent, and the equivalence is argued rather than asserted.** M5 deletes the
recipe-absent branch, but the very next branch reads the file and catches the read error, naming the
same path and failing closed — two independent paths for one condition, which is why removing one
changes no observable behaviour. M6 was re-run as M8 with both counters floored, which is the
mutation that actually reaches the floors; in that form it dies.

**What this does NOT prove.** The sorted-walk determinism claim has no test: reproducing a
directory-read order that differs between platforms is not something this harness can stage, so the
claim rests on `Array.prototype.sort` over the collected repo-relative paths and is recorded here as
an argument rather than as evidence. The guard also cannot see a pinned mention written outside its
five configured roots — the boundary is recorded in source and asserted by M11, but a document
placed in a sixth location would be invisible to it.

## Issues Encountered

- **`gsd_run check tdd-red-evidence` cannot classify this repository's runner.** The verb parses
  `node --test` TAP summary lines, which Vitest does not emit. Synthesizing them would be
  fabricating a gate input, so it was not done. The RED gate is recorded as `UNKNOWN - verify` at
  the tooling level and satisfied manually from the real transcript: 9 cases discovered, 9 failed,
  first failure `guardPlaywrightMcpPin not found in the source`. Carried forward from 31-02, where
  the same mismatch was recorded; it affects every TDD plan in this repository.
- **A commit message lost two backticked words to shell expansion.** `git commit -m` with an
  unescaped backtick ran the enclosed word as a command substitution. Caught by reading the message
  back, and amended from a file. Later messages were written to a file first.
- **Commits were made on `main`.** The executor's generic pre-commit guard reports `main` as
  protected and there is no `git.allow_default_branch_commits` key. This project is configured
  `branching_strategy: "none"` and `use_worktrees: false`, the dispatch explicitly placed this
  executor on `main`, and every prior phase commit is on `main`. The config was **not** edited to
  self-authorize.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced. The two
`UNKNOWN - verify` items in the recipe (subagent reachability of the Chrome tools, and the Windows
leg of every browser probe) are disclosed unknowns carried from research, not stubs — the recipe
records them as unverified rather than claiming either answer, and nothing in the Playwright floor
depends on them.

## User Setup Required

None — no external service configuration required. `package.json` gained no dependency and the
installer writes no MCP configuration into any repository. The browser-MCP registration and the
browser binaries are the user's own prerequisites, documented rather than performed.

## Next Phase Readiness

- **Ready for 31-04.** The recipe is the named home the Chrome-lane work points at, and the attended
  predicate, the human-name grant and the four-host absence are all stated there once.
- **`UATX-02` is marked Complete.** `UATX-03` is declared by 31-04 as well, so the shared-ID gate
  correctly holds it at Pending until that plan finishes.
- **For a later pin bump:** edit the first pinned mention in
  `agent-factory/checklists/browser-uat-recipe.md`, re-pin every other mention in the same edit, and
  run `node scripts/check-foundation-guards.js`. Research finding F-01 records that the registry's
  `latest` had already moved past the locked pin when this plan ran; the locked value still resolves
  and was implemented as locked, not re-opened.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-07*

## Self-Check: PASSED

- `agent-factory/checklists/browser-uat-recipe.md` exists on disk (`[ -f ]`, 1/1 FOUND).
- All five commits resolve in `git log --all`: `2b1e7bc`, `9dd2eaf`, `ab5d452`, `4db9017`, `426ea0b`.
- `git rev-list --count 9343314..HEAD` = 5 including this file's own docs commit; the frontmatter
  records 4, the count at SUMMARY-write time, with the discrepancy stated there.
- Plan `<verification>` re-run at close-out: the four text gates, `npm run build`,
  `npm run typecheck`, `npm run check:build-parity`, `npm run freshness` (60 committed `.js` fresh),
  `node scripts/check-foundation-guards.js` (`ALL CHECKS PASSED`) and
  `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` all exit 0. Full suite 3249 passed /
  2 skipped over 60 files. Bare `npm test` was never run.
- Only the plan's own files were touched; the four pre-existing uncommitted paths
  (`.planning/milestone.lock`, `human-notes.txt`, `.gsd/`, `.planning/state.json`) were left alone.

## Correction — 2026-09-08

Appended by plan 31-07, the gap-closure plan for gap 3 of `31-VERIFICATION.md`. No line above this
heading has been edited: the record of what was believed at the time is part of the trail.

The Decisions Made bullet **"A floating specifier is a finding, not an unseen token"** was true for a
NON-AUTHORITY mention and false for the authority itself. `guardPlaywrightMcpPin` read its pin as the
first `@playwright/mcp@` mention in `agent-factory/checklists/browser-uat-recipe.md` and adopted the
captured token with no assertion on its shape. `31-VERIFICATION.md` confirmed by code inspection
(`scripts/check-foundation-guards.ts:3838-3855`, `const pin = first.version;`) that a recipe whose
first mention floated would have made the pin the dist-tag string itself; every other mention
re-pinned to match would then have compared equal to it, and the guard would have reported a clean
pass over a kit that pins nothing. Plan 31-07 reproduced that configuration against the guard as
committed before changing it: the guard exited 0 and printed
`PASS playwright MCP pin \`latest\` — pinned mention(s) over 43 markdown file(s): 0 findings over 7/7 elements`.

Plan 31-07 closes it with `PIN_CONCRETE_VERSION_RE`, an anchored concrete-version assertion applied
to the authority's captured token before that token is adopted as the pin. It refuses a dist-tag by
name and cites the source file, its line and the rejected token. The scan-side comparison is
unchanged, so a floating specifier at a non-authority mention is still reported as drift rather than
as a shape fault — during a half-applied bump the number of places that are wrong is the whole
question.

The original bullet is left in place.
