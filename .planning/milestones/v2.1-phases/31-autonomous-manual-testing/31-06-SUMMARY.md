---
phase: 31-autonomous-manual-testing
plan: 06
subsystem: testing
tags: [typescript-ast, playwright, uat, spec-integrity, red-team, gap-closure]

# Dependency graph
requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-02's uat-spec-integrity runnable, its D-14 three-arm ban and its fixture corpus"
  - phase: 31-autonomous-manual-testing
    provides: "31-04's derived-set + watched-fail contract-test idiom and section-region extractor (scripts/chrome-lane-bar.test.ts)"
provides:
  - "calleeDottedPath — one exported normaliser resolving a callee to a head-first dotted path across property access, string-literal element access, parentheses, non-null and type assertions"
  - "BANNED_CONSTRUCTS as nine dotted-path strings: D-14's six re-expressed plus test.describe.skip/only/fixme"
  - "UNRESOLVABLE_CALLEE_RESIDUALS — the two shapes a parser-only runnable cannot resolve, exported as prose the recipe quotes"
  - "scripts/runnable-ref/fixtures/playwright-test.d.ts + tsconfig.fixtures.json — a declared @playwright/test surface and a no-emit target wired into npm run typecheck"
  - "A surface harness proving every banned spelling is a construct that surface has, with its partition computed by the compiler and watched failing"
affects: [31-07, 31-08, any future edit to the UAT ban set or the browser-UAT recipe]

actuals:
  tokens: 13916        # chars/4 over the REALIZED diff (55,666 added chars across 5e6ea6f..HEAD)
  tasks: 3
  commits: 3
  plan_head_before: 5e6ea6ff17b517090eace9310f9136e20598153e

tech-stack:
  added: []
  patterns:
    - "One normaliser, one comparison: a callee SHAPE question belongs to a single function, so a new spelling is taught once and two matchers can never disagree"
    - "A hand-declared third-party surface + a dedicated no-emit tsconfig target, wired into the command CI already runs, turns a parse corpus into evidence that can fail"
    - "Partition-by-the-same-question: the ban set is split by asking the declared surface which heads it exports, so a member added later is classified automatically rather than carved out by hand"
    - "Set-EQUALITY between a doc region and an exported constant, derived by a strict grammar over backtick spans — substring search would count describe.skip as present whenever test.describe.skip is"

key-files:
  created:
    - scripts/runnable-ref/fixtures/playwright-test.d.ts
    - scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts
    - tsconfig.fixtures.json
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts
    - scripts/runnable-ref/fixtures/clean.uat.spec.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - tsconfig.tests.json
    - package.json
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "BANNED_CONSTRUCTS becomes dotted-path STRINGS and gains three members rather than replacing D-14's six: the two bare-describe names are retained, so the decided set is a strict superset of what D-14 named and nothing stops being banned"
  - "A CallExpression link deliberately does NOT resolve in calleeDottedPath — expect(x).soft is not expect.soft, and resolving through a call would refuse legitimate chained assertions"
  - "loadTypeScriptFromTarget now validates isElementAccessExpression and isStringLiteralLike; an unusable parser is a loud skip, never a throw that would exit outside the D-12 { 0, 1, 2 } contract"
  - "The three type-assertion predicates are declared OPTIONAL and guarded at their call site: their absence on an older target parser costs one resolvable callee shape (a documented residual), not the whole walk"
  - "The declared @playwright/test surface is disclosed as a hand transcription whose drift from upstream is an open UNKNOWN - verify; it is never described as an authority on the package's API"
  - "A no-substitution template literal member (test[`skip`]) is resolved, because the disclosed residual claims the gap is a NON-LITERAL expression — leaving it unresolved would have made the disclosure false"

patterns-established:
  - "Pattern: derive a doc-versus-constant agreement by a grammar over code spans, then assert SET EQUALITY in both directions, so neither a missing member nor an invented one can pass"
  - "Pattern: assert the harness's own PREMISE (non-empty generated source, generated count equal to the partition size, each member present) before trusting a clean compile"

requirements-completed: [UATX-02, UATX-06]

coverage:
  - id: D1
    description: "Arm (c) decides its callee as a dotted path, so test.describe.only/skip/fixme and every bracket-notation spelling are refused with one finding each"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses test.describe.only and names the dotted path"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses a bracket-notation modifier call and resolves it to the same dotted path"
        status: pass
      - kind: e2e
        ref: "node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo> over the verifier's spec — 3 findings, EXIT=1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The decided set has nine members, is iterated from one exported constant, and nothing D-14 named stopped being banned"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#exports BANNED_CONSTRUCTS as the nine dotted paths, a strict superset of D-14's six"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses every member of BANNED_CONSTRUCTS, iterated from the exported constant"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#reports one finding per member when every member appears in ONE spec"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fixture corpus is compiled against a declared @playwright/test surface by a target npm run typecheck runs"
    requirement: "UATX-02"
    verification:
      - kind: integration
        ref: "npx tsc -p tsconfig.fixtures.json — exit 0, zero diagnostics"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#npm run typecheck runs the fixtures target, so the check is not outside the command"
        status: pass
      - kind: integration
        ref: "watched fail: reintroducing the describe import makes npm run typecheck exit 2 with TS2724"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every banned spelling is proven to exist on the declared surface; the remainder is derived by the same question, not carved out"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#every banned spelling whose head the surface exports type-checks against it"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the harness DISCRIMINATES: a fabricated member the surface lacks is a diagnostic"
        status: pass
    human_judgment: false
  - id: D5
    description: "The recipe's ban set and residual list are quoted from the exported constants and asserted to agree with them"
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's ban-set region lists exactly the members of BANNED_CONSTRUCTS"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's residual bullets are the exported residual array, verbatim"
        status: pass
    human_judgment: false
  - id: D6
    description: "The declared @playwright/test surface matches the real package at the 1.62.1 pin"
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify (assumption A1). The package cannot be installed under this repository's zero-runtime-dependency and fixed-dev-dependency constraint, so nothing here re-checks the transcription against a released Playwright. What IS mechanically established is narrower and is what the gap needed: a fixture importing a binding the declared surface does not carry fails npm run typecheck."

# Metrics
duration: 47 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 06: Close gap 2 — arm (c) against the spellings Playwright actually has

**A dotted-path callee normaliser feeding one comparison against a nine-member ban set, a fixture corpus compiled against a declared `@playwright/test` surface by a target `npm run typecheck` runs, and a harness proving every banned spelling is a construct that surface carries.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-08T07:25:00Z
- **Completed:** 2026-09-08T08:12:23Z
- **Tasks:** 3
- **Files modified:** 15 (3 created, 12 modified)

## Accomplishments

- **The verifier's live bypass is closed at its own coordinates.** `test.describe.only`, `test.describe.skip` and `test["skip"]` in one spec now report one finding each and exit 1, where the committed `.js` previously reported `0 findings over 1/1 uat specs checked` and exited 0.
- **One normaliser, one comparison.** `calleeDottedPath` resolves property-access chains of any depth, string-literal (and no-substitution-template-literal) element access, parentheses, non-null assertions, `as` / `<T>` / `satisfies` assertions and optional-chaining calls to one path string. `findBannedConstructs` inspects no callee shape at all — the grep for `isPropertyAccessExpression` inside that function returns 0.
- **The set is a strict superset of D-14's.** Nine dotted paths; the two bare-describe names are retained, so nothing D-14 named stopped being banned.
- **The corpus can now fail.** A hand-declared `@playwright/test` surface with deliberately no `describe` export, compiled by `tsconfig.fixtures.json`, wired into `npm run typecheck` as a third `tsc` invocation.
- **The cross-check that would have caught the gap now exists.** The ban set is partitioned by asking the declared surface which heads it exports; the exported partition (7) compiles with zero diagnostics and the remainder (2) is asserted by value.
- **Claim and mechanism are bound.** The recipe's ban set and residual bullets are quoted from the two exported constants, and a test asserts set equality in both directions.

## Task Commits

1. **Task 1: RED-first — reproduce the bypass, then decide the callee as a dotted path** — `e5dbad9` (fix)
2. **Task 2: make the fixture corpus type-checked evidence** — `741fec1` (test)
3. **Task 3: prove every banned spelling exists on the surface; re-quote the recipe** — `78b9ce2` (test)

## RED and GREEN evidence

This is a gap-closure round on a safety invariant, so the pre-fix outputs are recorded verbatim beside the post-fix ones. A suite that was green before and after would prove nothing — this defect shipped past a 47-of-47 green suite.

### Task 1 — the checker

**RED, end to end through the committed `.js`** (the verifier's own coordinates: a temp repository whose `node_modules` resolves `typescript`, the spec planted under a `uat/` segment):

```
$ node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo>
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

**RED, unit:** `10 failed | 34 passed (44)` — the ten new cases, listed by name:

```
refuses test.describe.only and names the dotted path
refuses test.describe.skip and names the dotted path
refuses test.describe.fixme and names the dotted path
refuses a bracket-notation modifier call and resolves it to the same dotted path
refuses a bracket-notation modifier written with a no-substitution template literal
the spec 31-VERIFICATION.md ran exits 1 with one finding per construct
refuses every member of BANNED_CONSTRUCTS, iterated from the exported constant
reports one finding per member when every member appears in ONE spec
resolves a parenthesised, non-null-asserted, type-asserted and optional-chained callee
exports the two unresolvable callee shapes as named residuals
```

**GREEN, end to end through the committed `.js`, same repository, same spec:**

```
$ node scripts/runnable-ref/uat-spec-integrity.js <tmp-repo>
UAT spec integrity: 3 finding(s) over 1/1 uat specs checked
e2e/uat/verifier.uat.spec.ts:3: banned modifier call — `test.describe.only` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
e2e/uat/verifier.uat.spec.ts:10: banned modifier call — `test.describe.skip` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
e2e/uat/verifier.uat.spec.ts:17: banned modifier call — `test.skip` removes the scenario from the evidence the quality gate re-runs, so a green lane would certify a scenario nobody exercised.
EXIT=1
```

**GREEN, unit:** `44 passed (44)` after the fix; `56 passed (56)` after Tasks 2 and 3.

### Task 2 — the corpus

**RED, the first run of the new target against the uncorrected corpus** (`npx tsc -p tsconfig.fixtures.json`, exit 2):

```
scripts/runnable-ref/fixtures/clean.uat.spec.ts(28,44): error TS2339: Property 'dismiss' does not exist on type 'Locator'.
scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts(13,65): error TS7031: Binding element 'page' implicitly has an 'any' type.
scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts(12,24): error TS2724: '"@playwright/test"' has no exported member named 'describe'. Did you mean 'Describe'?
```

The third diagnostic is the gap-2 defect, reproduced by the mechanism that should have caught it originally. The first two are separate findings the same run surfaced — see Deviations.

**GREEN:** `npx tsc -p tsconfig.fixtures.json` exit 0, zero diagnostics; `npm run typecheck` exit 0 across all three targets.

**Watched fail (the control is a control, not a coincidence).** The `describe` import reintroduced into `union-all-arms.uat.spec.ts`, then `npm run typecheck` run in full:

```
scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts(12,24): error TS2724: '"@playwright/test"' has no exported member named 'describe'. Did you mean 'Describe'?
scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts(12,24): error TS6133: 'describe' is declared but its value is never read.
REAL_EXIT=2
```

Restored, `RESTORED_EXIT=0`.

### Task 3 — the surface harness and the recipe

- **Discrimination, watched:** appending the fabricated `test.mute` to the generated source yields a non-empty diagnostic set naming `mute` (case: *the harness DISCRIMINATES*).
- **Recipe drift A, watched:** dropping `test.describe.fixme` from the recipe bullet → `AssertionError: expected [ 'describe.only', …(7) ] to deeply equal [ 'describe.only', …(8) ]`.
- **Recipe drift B, watched:** dropping the aliased-binding residual bullet → `AssertionError: the recipe does not carry the residual: An aliased binding is not refused: …`.

## Acceptance criteria — measured

| Criterion | Result |
|---|---|
| `BANNED_CONSTRUCTS.length` | `9` |
| every member a string | `true` |
| `UNRESOLVABLE_CALLEE_RESIDUALS.length` | `2` |
| `grep -c 'calleeDottedPath'` in the `.ts` | `4` (≥ 3) |
| `isPropertyAccessExpression` in `findBannedConstructs` (non-comment lines 597–647) | `0` |
| union case computes the expected count from the constant | yes — `expect(findings.length).toBe(BANNED_CONSTRUCTS.length)` |
| negative case for an unbanned dotted path | yes — `test.describe`, `test.step`, plain `test` all accepted |
| `tsconfig.fixtures.json` `noEmit` | `true` |
| `grep -c 'tsconfig.fixtures.json' package.json` | `1`, inside the `typecheck` value |
| `tsc` invocations inside the `typecheck` value | `3` |
| `grep -c 'UNKNOWN - verify'` in the `.d.ts` | `1` |
| union fixture: `describe.only` vs `test.describe.only` | `2` vs `2` — every describe modifier reached through the test object |
| `grep -c '@playwright/test'` in the element-access fixture | `1` |
| element-access fixture findings | exactly `2`, asserted in the test file |
| `git diff -- tsconfig.json` | empty (byte-identical) |
| recipe: `test.describe.only` = 1, bare `describe.only` listing = 1, total `describe.only` = 2 | `1 + 1 = 2` ✓ |
| partition sizes asserted numerically and remainder by value | `7` / `2`, remainder `["describe.only", "describe.skip"]` |
| `PREMISE`-prefixed assertions in the test file | `19` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |

## Verification (plan `<verification>` block)

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | `56 passed (56)` |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) | `62 files, 3313 passed \| 2 skipped` |
| `npx tsc -p tsconfig.fixtures.json` | exit 0, no `error TS` |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | green; `Build parity: no tracked build output moved when tsc ran.` |
| `npm run check:imperative-lexicon / check:banned-claims / check:public-docs / check:claim-anchors` | all four `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |

`npm test` was never run — it launches the live claude-CLI e2e lane against real credentials.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` — `calleeDottedPath`, `UNRESOLVABLE_CALLEE_RESIDUALS`, the nine-member `BANNED_CONSTRUCTS`, arm (c) reduced to one comparison, two more predicates validated at parser load.
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — 22 new cases across three blocks: the real spellings, the corpus-inside-a-target controls, and the surface/recipe harnesses.
- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — the declared surface, with no `describe` export and its drift disclosed as `UNKNOWN - verify`.
- `scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts` — the two bracket-notation constructs, mutation-marked.
- `scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts` — imports only `{ test, expect }`; arm (c) is now `test.describe.only`.
- `scripts/runnable-ref/fixtures/clean.uat.spec.ts` — `Locator.dismiss()` replaced with `click()`.
- `tsconfig.fixtures.json` — the third, no-emit target.
- `tsconfig.tests.json` — the stale reason corrected in place.
- `package.json` — `typecheck` gains the third `tsc` invocation.
- `agent-factory/checklists/browser-uat-recipe.md` — the nine members re-quoted, two residual bullets added, a sentence stating that the callee is recognised by its dotted path.
- `scripts/check-banned-claims.ts` / `.js` / `.test.ts`, `scripts/check-foundation-guards.test.ts` — two two-sided pins moved in the same commit as the files that moved them.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing ones:

1. **Widen, never replace.** The two bare-describe names stay in the set. D-14 named them, and another framework's bare `describe` can be imported into a spec file, so the decided set is strictly wider than D-14's and nothing stops being banned.
2. **A call breaks the path.** `calleeDottedPath` returns `null` on a `CallExpression` link, so `expect(x).soft` is not read as `expect.soft`. Resolving through a call would have started refusing legitimate chained assertions — the widening's own failure mode, tested by a negative case.
3. **A template-literal member is resolved, not deferred.** The disclosed residual says the unresolvable case is a member computed from a NON-LITERAL expression. Leaving `` test[`skip`] `` unrefused would have made that disclosure false, so `isStringLiteralLike` (which covers both literal forms) is the predicate, not `isStringLiteral`.
4. **The declared surface claims no authority.** Its header states plainly that it is a hand transcription, that the package cannot be installed here to derive it, and that its drift is an open `UNKNOWN - verify` — then states the narrower thing it does establish.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `clean.uat.spec.ts` called `Locator.dismiss()`, a method Playwright has no such member for**
- **Found during:** Task 2 (writing the declared surface)
- **Issue:** The fixture called `page.getByTestId("promo-banner").dismiss()`. Real Playwright `Locator` carries no `dismiss`. Declaring it on the surface to make the corpus compile would have fabricated an API member inside the very file whose job is to be honest about the API — the same defect class as the `describe` import, one file over.
- **Fix:** Replaced with `.click()`, which keeps the assertion-free try/catch/finally the fixture exists to exercise.
- **Files modified:** `scripts/runnable-ref/fixtures/clean.uat.spec.ts`
- **Verification:** `tsc -p tsconfig.fixtures.json` exit 0; the adversarial-negative case still passes and still asserts the file carries `try {`, `finally {`, `if (` and a `test.skip` in prose.
- **Committed in:** `741fec1`

**2. [Rule 3 - Blocking] The modifier declarations needed a title-plus-body signature, not only a loose one**
- **Found during:** Task 2 (RED run)
- **Issue:** `TS7031: Binding element 'page' implicitly has an 'any' type` in `modifier-call.uat.spec.ts`. A single `(...args: unknown[])` signature gives a fixture's `async ({ page }) => {}` body no contextual type, so the target would have reported implicit-any noise instead of checking anything useful.
- **Fix:** Each modifier declares two signatures — the title-plus-body form the corpus writes, and a loose catch-all the ban-set harness's single-argument calls need. Both are documented in the file, and the header paragraph was corrected so it no longer says "one loose call signature".
- **Files modified:** `scripts/runnable-ref/fixtures/playwright-test.d.ts`
- **Verification:** `tsc -p tsconfig.fixtures.json` exit 0.
- **Committed in:** `741fec1`

**3. [Rule 2 - Missing Critical] An unusable target parser could have thrown instead of loud-skipping**
- **Found during:** Task 1 (adding predicates to the `TsApi` surface)
- **Issue:** The walk gained two unconditional predicate calls (`isElementAccessExpression`, `isStringLiteralLike`). `loadTypeScriptFromTarget` validated only three functions, so a target module missing either would have thrown mid-analysis and exited outside the D-12 `{ 0, 1, 2 }` contract — a crash a caller cannot classify.
- **Fix:** Both predicates are validated at parser load, so an unusable parser is a loud skip exactly like an absent one. The three type-assertion predicates are declared OPTIONAL and guarded at their call site instead, because their absence costs one resolvable callee shape (a documented residual) rather than the whole walk.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts` / `.js`
- **Verification:** the parser-absent loud-skip case still passes; full suite green.
- **Committed in:** `e5dbad9`

**4. [Rule 3 - Blocking] Two two-sided set pins fired, as designed**
- **Found during:** Task 3 (full regression run)
- **Issue:** 8 failures across two files. `tsconfig.fixtures.json` is a new tracked `.json` that was neither scanned nor excluded by name by `check-banned-claims` (the WR-02 coverage equality, `1572` vs `1573`), and the new fixture moved the LANG-07 non-test module corpus from 66 to 67.
- **Fix:** `tsconfig.fixtures.json` dispositioned BY NAME in `BANNED_CLAIM_EXCLUDED_LOCATIONS` with its reason written into the block header beside its two `tsconfig` siblings (exact-path cardinality pin `7` → `8`); `NON_TEST_MODULE_COUNT` `66` → `67` with the new corpus file named and its reason recorded, including the explicit note that the `.d.ts` does not move the number because the walk excludes `.d.ts` by construction.
- **Files modified:** `scripts/check-banned-claims.ts` / `.js` / `.test.ts`, `scripts/check-foundation-guards.test.ts`
- **Verification:** full suite `3313 passed | 2 skipped`; `check:banned-claims` and `check-foundation-guards.js` both `ALL CHECKS PASSED`.
- **Committed in:** `78b9ce2`

**5. [Rule 3 - Blocking] The residual prose exceeded the recipe's 25-word descriptive bound**
- **Found during:** Task 3 (`npm run check:imperative-lexicon`)
- **Issue:** `WP-03 [descriptive-sentence-too-long]` at 31 and 29 words on the two new residual bullets. The bullets are the exported strings verbatim, so the recipe could not be fixed alone without breaking the verbatim-agreement test.
- **Fix:** Both strings shortened AT THEIR SOURCE in `UNRESOLVABLE_CALLEE_RESIDUALS` into two sentences each, and the recipe updated with the same bytes in the same commit. The prohibition in this plan's frontmatter — the claim and the mechanism must move together — was honoured by construction.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts` / `.js`, `agent-factory/checklists/browser-uat-recipe.md`
- **Verification:** `check:imperative-lexicon` `ALL CHECKS PASSED`; the verbatim-agreement test passes and was watched failing.
- **Committed in:** `78b9ce2`

### Acceptance-criteria commands adjusted (not skipped)

Two of the plan's acceptance-criteria commands do not run as written. Both were replaced with an equivalent that asks the same question, and the substitution is recorded rather than the criterion being dropped.

1. `node -e "import('./scripts/runnable-ref/uat-spec-integrity.js').then(m=>console.log(...))"` prints the CLI usage error instead of the value. `node -e` leaves `process.argv[1]` undefined, and the module's `invokedAsScript()` deliberately FAILS TOWARDS RUNNING on an inconclusive answer, so the top-level `process.exit(2)` runs before the dynamic import resolves. Replaced with the identical import from a `.mjs` file (which has a defined `argv[1]`): `9`, `true`, `2`.
2. `grep -o 'tsc' package.json | wc -l` inside the `typecheck` value yields 5, not 3 — `tsconfig.tests.json` and `tsconfig.fixtures.json` each contain `tsc` as a substring of `tsconfig`. Counted `tsc ` (with the trailing space) instead: `3` invocations.
3. `node -e "require('./tsconfig.fixtures.json')"` fails because the file carries a leading `//` header, the same JSONC shape `tsconfig.tests.json` already uses and the same shape the plan's own action text asks for ("Its header explains why a third target exists"). Read with the comment lines stripped: `noEmit = true`.

---

**Total deviations:** 5 auto-fixed (1 bug, 1 missing-critical, 3 blocking) plus 3 acceptance-criteria command substitutions.
**Impact on plan:** No scope creep. Deviations 1 and 2 are the corpus telling the truth about itself for the first time — exactly what Task 2 exists to enable. Deviations 4 and 5 are this repository's own set-literal and prose guards firing on a legitimate change and being moved in the same commit as the change, which is the discipline they exist to enforce.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

## Threat Flags

None. The plan installs nothing (`T-31-SC`), adds no dependency, opens no network path and changes no on-disk format or exit-code contract. The two `accept`-disposition threats (`T-31-31` unresolvable callee shapes, `T-31-32` declared-surface drift) are both disclosed in source, in the recipe and in this summary rather than left as silences.

## Issues Encountered

- The plan's three acceptance-criteria commands that do not run as written (see above). Each was replaced with an equivalent, never skipped.
- The full regression suite takes ~7 minutes; `npm test` was avoided throughout because it triggers the live claude-CLI e2e lane.

## Residuals carried forward (named, not silent)

- **A1 — the declared surface's drift from upstream `@playwright/test` is an open `UNKNOWN - verify`.** Stated in the `.d.ts` header, in the plan's assumptions, and in coverage entry D6.
- **A2 — two callee shapes stay unresolved** (an aliased binding, a member computed from a non-literal expression). Exported as `UNRESOLVABLE_CALLEE_RESIDUALS`, quoted in the recipe, and pinned by a test that asserts both really do pass today, so a future change closing one is visible.
- **A3 — 31-REVIEW.md WR-01 is NOT closed by this plan.** A `.uat.spec.ts` one directory outside a `uat/` segment is still silently unchecked while the pass line claims a full count. It is a real adjacent defect in this same file, it is outside the three verification gaps, and it is surfaced here so the next round has it rather than rediscovering it.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Gap 2 of `31-VERIFICATION.md` is closed at the verifier's own coordinates and re-runnable: the recorded spec now exits 1 with one finding per construct.
- `UATX-06`'s mechanical half is now decided over spellings Playwright actually produces, and `UATX-02`'s corpus is inside a typecheck target.
- 31-07 and 31-08 are unblocked by this plan; gap 3 (the `guard_playwright_mcp_pin` authority shape check) remains open and is not touched here.

## Self-Check: PASSED

- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — FOUND
- `scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts` — FOUND
- `tsconfig.fixtures.json` — FOUND
- `e5dbad9`, `741fec1`, `78b9ce2` — all three present in `git log`
- `git rev-list --count 5e6ea6f..HEAD` = `3`, matching the `commits:` field measured, not narrated

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*
