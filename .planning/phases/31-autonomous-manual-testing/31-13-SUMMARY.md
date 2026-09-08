---
phase: 31-autonomous-manual-testing
plan: 13
subsystem: testing
tags: [typescript, ast, playwright, uat, spec-integrity, guard]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-11's D-17 head/tail membership rule (isBannedModifierPath) and the deleted BANNED_CONSTRUCTS literal"
  - phase: 31-autonomous-manual-testing
    provides: "31-12's reverse partition over the declared @playwright/test surface, and its depth-bound premise"
  - phase: 31-autonomous-manual-testing
    provides: "31-10's derive-the-set discipline in scripts/context-io-writer-set.test.ts (premise assertion, signature per site, watched-fail mirror)"
provides:
  - "D-18: a CallExpression callee link resolves to its inner path plus a `()` marker segment, so test.info().skip reaches the D-17 rule with head `test` and tail `skip` — with no member added to any set"
  - "BANNED_CONFIGURED_PATHS + enabledOptionKeys + isBannedModifierCall: the configured-soft escape decided as a path-PLUS-enabled-option pair, so expect.configure({ retries: 2 }) stays admitted"
  - "deriveImportRenames + canonicaliseHeadSegment: an ImportSpecifier rename AND a namespace import of @playwright/test canonicalised before the head segment is read"
  - "An AST-DERIVED decline-site set over the arm-(c) resolver closure, bound in both directions to decided constructs or named residuals, with a watched-fail seeded-branch mirror"
  - "Three type-checked corpus fixtures (call-link, import-rename, configured-soft) with mutation controls"
  - "A declared TestInfo surface and Expect.configure, with the two new walked members dispositioned"
  - "browser-uat-recipe.md boundary prose that states the reverse walk covers declared property chains only"
affects: [31-14, 31-15, browser-uat-recipe, uat-spec-integrity]

actuals:
  tokens: 33526
  tasks: 4
  commits: 6
plan_head_before: d7b856deb8db7b0a5aaea27ece34ea8c3b2f77ac

tech-stack:
  added: []
  patterns:
    - "Decide a declining SHAPE rather than enumerate a new member: the marker-segment call link refuses test.info().skip through the existing head/tail rule with nothing added to any set"
    - "Derive the DECLINE set from the source: the resolver closure is followed back from the membership call's arguments, every position that ends resolution without a path is signed, and each is bound to a decision or a named residual in both directions"
    - "Two-axis residual accounting: a RESOLUTION residual is bound to a derived decline site; a MEMBERSHIP residual is a path that resolves and is simply not a member. Asserted disjoint and summing to the register"
    - "Partition a prose boundary list against the exported register plus a bounded remainder, so a claim the mechanism does not carry lands in neither bucket"

key-files:
  created:
    - scripts/runnable-ref/fixtures/modifier-call-link.uat.spec.ts
    - scripts/runnable-ref/fixtures/import-rename.uat.spec.ts
    - scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/playwright-test.d.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-18 (1): a CallExpression callee link RESOLVES, to its inner path plus a `()` marker segment. `test.info().skip` becomes a three-segment path with head `test` and tail `skip`, so D-17's existing rule refuses it with NO new member. The marker lands in the routing position D-17 already decided is outside the membership question, which is why no decided list of call-bearing heads was needed. `expect(x).soft` stays legitimate BY CONSTRUCTION: its head is the marked `expect()` call, so its path is `expect().soft`, neither a banned exact path nor a banned head."
  - "D-18 (2): the configured-soft escape is a PATH PLUS AN ENABLED OPTION, not a path. BANNED_CONFIGURED_PATHS maps `expect.configure` to `soft`; enabledOptionKeys reads the keys assigned the `true` KEYWORD in the call's first object literal; isBannedModifierCall joins the halves and delegates the pure-path half to isBannedModifierPath. Refusing the path alone would have refused the legitimate `expect.configure({ retries: 2 })`."
  - "D-18 (3): an import rename is canonicalised before the head segment is read, from ImportSpecifier.propertyName — a literal already in the source, needing no type checker. MODULE-SCOPED to `@playwright/test`, disclosed as a residual with what would force it open."
  - "The DECLINE set is derived, not remembered: the arm-(c) resolver closure is followed back from the membership call's arguments, 14 decline sites are signed off the AST, and every one is bound to a decided construct or a named residual in both directions. Writing five more residual sentences would have been the fourth instance of the class Phase 31 keeps being caught by."
  - "[Rule 2] A NAMESPACE import of the framework (`import * as pw from \"@playwright/test\"; pw.test.skip(...)`) was found BY the derivation and is DECIDED, not disclosed: the local name sits in the import clause as a literal, so calling it unresolvable would have stated something false. The namespace head is dropped before membership."
  - "Extending the reverse partition's walk to descend call-signature return types is NOT in this round. It would move the denominator of every coverage assertion 31-12 landed, and the verifier's missing item (c) asked for the DISCLOSURE, not the extension. The boundary is now stated in the recipe."

patterns-established:
  - "Pattern: a resolver that must decline nothing silently states its exits as `return null` / bare `return`, so an AST predicate can enumerate them — and a helper that only rewrites its input returns the INPUT rather than a fresh null, so it contributes no false decline site"
  - "Pattern: a signature for a value-less decline site is its position (enclosing function, statement-kind chain) plus its guard text, because there is no returned literal to sign it with"

requirements-completed: [UATX-05, UATX-06]

coverage:
  - id: D1
    description: "The three TestInfo modifier spellings (test.info().skip/.fail/.fixme) are refused at exit 1 by the committed .js, where the pre-fix artifact reported 0 findings at exit 0"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses test.info().skip() — the TestInfo runtime spelling"
        status: pass
      - kind: integration
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/cr07-probe/red1 (probe repository, pre-fix and post-fix outputs quoted below)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The configured-soft escape expect.configure({ soft: true })(...) is refused, while expect.configure({ retries: 2 }) and { soft: false } stay admitted"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses expect.configure({ soft: true })(...) — the soft-assertion escape"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#does NOT refuse expect.configure({ retries: 2 }) — the false-positive control"
        status: pass
    human_judgment: false
  - id: D3
    description: "An import-renamed head and a namespace import of @playwright/test are canonicalised before membership is asked; a rename from any other module is not"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses a modifier call on an import-renamed head"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses a modifier call reached through a namespace import"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the rename map is MODULE-SCOPED: a rename from another module is not canonicalised"
        status: pass
    human_judgment: false
  - id: D4
    description: "The resolver's decline set is derived from the source by AST, asserted member-wise and count-wise, bound to decisions or named residuals in both directions, and proven to move by exactly one under a seeded branch"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the binding record's KEY SET equals the derived set, in BOTH directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a SEEDED extra decline branch moves the count UP by exactly one and arrives UNBOUND"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE CONVERSE: every member of UNRESOLVABLE_CALLEE_RESIDUALS is accounted for"
        status: pass
    human_judgment: false
  - id: D5
    description: "Three type-checked corpus fixtures carry the newly decided constructs, and deleting each marked region drops the fixture to zero findings"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#modifier-call-link.uat.spec.ts drops to zero findings when its marked region is removed"
        status: pass
      - kind: integration
        ref: "npm run typecheck (tsc -p tsconfig.fixtures.json) — 0 diagnostics naming any file under scripts/runnable-ref/fixtures/"
        status: pass
    human_judgment: false
  - id: D6
    description: "The declared surface gains info/TestInfo and Expect.configure; the reverse partition's two new walked members are dispositioned and its disjointness, union, cardinality and depth-bound cases still hold"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the buckets' UNION equals the derived set"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the walk's premises hold: no diagnostics, both roots, a non-empty set, and the bound reached"
        status: pass
    human_judgment: false
  - id: D7
    description: "browser-uat-recipe.md quotes four rule constants by value under a both-directions equality test, carries the residual register verbatim as a partitioned boundary list, and states that the reverse walk covers declared property chains only"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's four quoted lists equal the exported constants, in both directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the boundary list PARTITIONS into register members and the bounded remainder"
        status: pass
    human_judgment: false
  - id: D8
    description: "The D-15 loud-skip contract and the D-12 exit-code contract are unchanged by this plan, re-measured rather than assumed"
    requirement: UATX-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#uat-spec-integrity.js — the D-15 two-stage browser loud skip (UATX-05)"
        status: pass
      - kind: integration
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/cr07-probe — exit 1 with 7 findings over 8/8 uat specs checked"
        status: pass
    human_judgment: false
  - id: D9
    description: "D-18 is recorded in 31-CONTEXT.md and in the runnable's decision header, with D-13 through D-17 byte-unchanged"
    requirement: UATX-06
    verification:
      - kind: other
        ref: "git diff --stat on 31-CONTEXT.md — 76 insertions, 0 deletions; grep for D-14:/D-17:/D-18 exits 0"
        status: pass
    human_judgment: false

duration: 45 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 13: Shape Resolution for the UAT Spec-Integrity Ban Summary

**D-18 makes the D-14 arm-(c) ban reachable at the SHAPE-RESOLUTION register: a call link resolves to its inner path plus a `()` marker so `test.info().skip` is refused by D-17's existing head/tail rule with no member added, a configured-soft escape is decided as a path-plus-enabled-option pair, an import rename and a namespace import are canonicalised before the head is read, and the set of shapes the resolver still declines is DERIVED from its own AST and bound to decisions or named residuals in both directions.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-09-08T18:05:02Z
- **Completed:** 2026-09-08T18:49:47Z
- **Tasks:** 4
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- All five constructs the round-3 verifier reproduced at `0 findings over 1/1 uat specs checked`, exit 0, are refused at exit 1 by the rebuilt committed `.js`, on the verifier's own probe-repository shape. No control moved.
- The fix is in SHAPE RESOLUTION and in a new option axis — not in a widened literal. `BANNED_MODIFIER_HEADS`, `BANNED_MODIFIER_TAILS` and `BANNED_EXACT_PATHS` are byte-unchanged.
- The resolver's decline set is derived from the source by AST (14 sites), signed by position and guard, asserted member-wise and count-wise separately, and bound to a decided construct or a named residual in BOTH directions.
- A sixth shape found by that derivation — a namespace import of `@playwright/test` — was decided rather than disclosed, because it is readable from the source text alone.
- The recipe's boundary list is now a partition against the exported register, and its completeness paragraph states what the reverse walk can and cannot see.

## Task Commits

1. **Task 1 (tracer): the verifier's own probe, RED then GREEN** — `d88e7ae` (test, RED) and `e69cb4d` (feat, GREEN)
2. **Task 2: derive the DECLINE set and bind every member both ways** — `47440fc` (feat)
3. **Task 3: corpus fixtures, the declared surface, and the recipe's boundary prose** — `a998c47` (test, RED) and `e36cc00` (feat, GREEN)
4. **Task 4: self-red-team — the three-way cross-check and the pin the fixtures moved** — `f50d3a5` (test)

## The RED measurement, quoted verbatim

A throwaway probe repository was built at `.temp/cr07-probe/`, one repo root per construct group, each with a resolvable `typescript` and a spec at a path carrying a `uat/` segment with the `.uat.spec.ts` suffix (D-05). The **currently committed** `scripts/runnable-ref/uat-spec-integrity.js` was run against it **before any source change**. The probe directory was deleted after each measurement round, because `.temp/` is not in `SKIPPED_DIRECTORIES` and a spec-shaped file left there reds the suite's "derives zero specs from grugops's own repository root" case.

```
=== red1 ===   (test.info().skip())
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== red2 ===   (test.info().fail())
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== red3 ===   (test.info().fixme(true, "later"))
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== red4 ===   (expect.configure({ soft: true })(locator).toBeVisible())
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== red5 ===   (import { test as it }; it.skip(...); it.describe.only(...))
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== controlA ===   (test.describe.serial.only)
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:3: banned modifier call — `test.describe.serial.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== controlB ===   (six legitimate constructs)
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== controlC ===   (expect(locator).soft, chained assertion)
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

**The resolver's answer was MEASURED, not inferred.** Before changing anything, `calleeDottedPath` was run against each construct's callee to confirm the assumption "the resolver declines it":

```
test.info().skip()                   -> null , "test.info"
test.info().fail()                   -> null , "test.info"
test.info().fixme(...)               -> null , "test.info"
expect.configure({soft:true})(...)   -> null , null , "expect.configure"
it.skip(...) [renamed]               -> "it.skip"
it.describe.only(...) [renamed]      -> "it.describe.only"
expect(loc).soft(...)                -> null , "expect"
expect(loc).toBeVisible()            -> null , "expect"
test.describe.serial.only(...)       -> "test.describe.serial.only"
```

Two different failures, both in the same register: the call-bearing chains resolved to `null` (the rule was never asked), and the renamed heads resolved fine but to `it.*`, which is not a banned head.

## The GREEN measurement, same probe, same repository

```
=== red1 ===
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:4: banned modifier call — `test.info().skip` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== red2 ===
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:4: banned modifier call — `test.info().fail` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== red3 ===
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:4: banned modifier call — `test.info().fixme` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== red4 ===
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:5: banned modifier call — `expect.configure` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== red5 ===
UAT spec integrity: 2 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:3: banned modifier call — `test.skip` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
e2e/uat/subject.uat.spec.ts:8: banned modifier call — `test.describe.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== controlA ===
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
e2e/uat/subject.uat.spec.ts:3: banned modifier call — `test.describe.serial.only` decides which scenarios the quality gate re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or one whose acceptance criterion failed.
EXIT=1
=== controlB ===
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
=== controlC ===
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

And the plan's own verify command, over the whole probe root:

```
$ node scripts/runnable-ref/uat-spec-integrity.js .temp/cr07-probe
UAT spec integrity: 7 finding(s) over 8/8 uat specs checked
… controlA/…:3 test.describe.serial.only · red1/…:4 test.info().skip · red2/…:4 test.info().fail
… red3/…:4 test.info().fixme · red4/…:5 expect.configure · red5/…:3 test.skip · red5/…:8 test.describe.only
EXIT=1
```

## Task 4: every caller re-run with a LEGITIMATE input

The whole fixture corpus and the control set were run against **two artifacts on the same inputs**: the pre-fix committed `.js` (extracted from `d88e7ae`) and the post-fix committed `.js` at HEAD. This is the probe this repository's own history says each prior round skipped — running the changed resolver against legitimate constructs, not only against forged ones.

### The corpus, before and after

| Fixture | PRE-FIX (`d88e7ae` .js) | POST-FIX (HEAD .js) |
|---|---|---|
| caught-assertion.uat.spec.ts | 2 finding(s) over 1/1, EXIT=1 | 2 finding(s) over 1/1, EXIT=1 |
| clean.uat.spec.ts | 0 findings over 1/1, EXIT=0 | 0 findings over 1/1, EXIT=0 |
| conditional-assertion.uat.spec.ts | 8 finding(s) over 1/1, EXIT=1 | 8 finding(s) over 1/1, EXIT=1 |
| **configured-soft.uat.spec.ts** | **0 findings over 1/1, EXIT=0** | **1 finding(s) over 1/1, EXIT=1** |
| element-access-modifier.uat.spec.ts | 2 finding(s) over 1/1, EXIT=1 | 2 finding(s) over 1/1, EXIT=1 |
| **import-rename.uat.spec.ts** | **0 findings over 1/1, EXIT=0** | **2 finding(s) over 1/1, EXIT=1** |
| **modifier-call-link.uat.spec.ts** | **0 findings over 1/1, EXIT=0** | **3 finding(s) over 1/1, EXIT=1** |
| modifier-call.uat.spec.ts | 1 finding(s) over 1/1, EXIT=1 | 1 finding(s) over 1/1, EXIT=1 |
| modifier-family.uat.spec.ts | 2 finding(s) over 1/1, EXIT=1 | 2 finding(s) over 1/1, EXIT=1 |
| modifier-group-clean.uat.spec.ts | 0 findings over 1/1, EXIT=0 | 0 findings over 1/1, EXIT=0 |
| union-all-arms.uat.spec.ts | 3 finding(s) over 1/1, EXIT=1 | 3 finding(s) over 1/1, EXIT=1 |

Every pre-existing fixture is unmoved. Exactly the three fixtures this plan added moved, each from exit 0 to exit 1.

### The controls, before and after

| Construct | PRE-FIX | POST-FIX |
|---|---|---|
| `expect(locator).toBeVisible()` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `expect.configure({ retries: 2 })` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `test.step(...)` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `test.describe.serial(...)` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `test.describe.configure(...)` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| a plain `test(...)` | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `expect(locator).soft` — chained | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `test.describe.serial.only` (CONTROL A) | 1 finding(s), EXIT=1 | 1 finding(s), EXIT=1 |
| `test.describe.only` (round-1 control) | 1 finding(s), EXIT=1 | 1 finding(s), EXIT=1 |
| `test.fail` (WR-12 control) | 1 finding(s), EXIT=1 | 1 finding(s), EXIT=1 |
| `test["skip"]` (bracket control) | 1 finding(s), EXIT=1 | 1 finding(s), EXIT=1 |
| `const t = test; t.skip` (alias residual) | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `test[m]` computed (residual) | 0 findings, EXIT=0 | 0 findings, EXIT=0 |
| `import { test as it } from "./x"` (module scope) | 0 findings, EXIT=0 | 0 findings, EXIT=0 |

Nothing moved. Seven legitimate constructs still admitted, four refusals still refused, three disclosed residuals still passing exactly as the register says they do.

## The derived decline set, with every member's disposition

Derived by parsing `scripts/runnable-ref/uat-spec-integrity.ts`, following the arm-(c) condition's arguments back through `findBannedConstructs`'s local constants to the functions that produce them, closing over the call graph, and emitting one signature per position at which resolution ends without producing a path. **Membership of this enumeration is asserted equal to the derived set by the test suite, not by hand** (`the binding record's KEY SET equals the derived set, in BOTH directions`).

Derived roots: `isBannedModifierCall`, `calleeDottedPath`, `canonicaliseHeadSegment`, `enabledOptionKeys`, `deriveImportRenames`. Transitive closure adds `isBannedModifierPath` and `isTypeAssertionLike`. **COUNT = 14.**

| # | Site (function \| statement chain \| guard \| return) | Disposition |
|---|---|---|
| 1 | `calleeDottedPath \| Block \|  \| return null;` | **residual** — the 512-step bound was exhausted; a stated limit, not a silence |
| 2 | `calleeDottedPath \| Block>ForStatement>Block \|  \| return null;` | **residual** — the node kind fell through every descent case: a non-identifier head |
| 3 | `calleeDottedPath \| …>IfStatement \| !ts.isStringLiteralLike(arg) \| return null;` | **residual** — a bracket member computed from a variable has no name in the source text |
| 4 | `calleeDottedPath \| …>IfStatement \| inner === null \| return null;` | **decided** — D-18 (1) decides the call link; this guard only PROPAGATES an inner decline that is itself a site above |
| 5 | `deriveImportRenames \| …>IfStatement \| !isImportDeclaration(node) \| return;` | **decided** — a statement that is not an import declaration carries no binding |
| 6 | `deriveImportRenames \| …>IfStatement \| !ts.isStringLiteralLike(node.moduleSpecifier) \| return;` | **decided** — a parseable import's module specifier is always a string literal; a narrowing, not a shape |
| 7 | `deriveImportRenames \| …>IfStatement \| clause === undefined \| return;` | **decided** — a side-effect-only import binds no name |
| 8 | `deriveImportRenames \| …>IfStatement \| named === undefined \| return;` | **decided** — a default-only import binds a name to a default export the declared surface does not carry |
| 9 | `deriveImportRenames \| …>IfStatement \| node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE \| return;` | **residual, NEWLY CREATED BY THIS PLAN** — the module scope of the rename/namespace canonicalisation |
| 10 | `deriveImportRenames \| Block>IfStatement>Block \| typeof isImportDeclaration !== "function" \|\| … \| return null;` | **residual** — the target's parser exposes no import predicates |
| 11 | `enabledOptionKeys \| Block>IfStatement \| !isObjectLiteral(first) \| return null;` | **residual** — the options argument is not an object literal |
| 12 | `enabledOptionKeys \| Block>IfStatement \| !ts.isCallExpression(call) \| return null;` | **decided** — the arm-(c) site only ever passes a call; a non-call has no option literal by definition |
| 13 | `enabledOptionKeys \| Block>IfStatement \| first === undefined \| return null;` | **decided** — a call with no arguments enables no option, which is the correct answer |
| 14 | `enabledOptionKeys \| Block>IfStatement>Block \| typeof isObjectLiteral !== "function" \|\| … \| return null;` | **residual** — the target's parser exposes no object-literal predicates |

**Site 9 is a residual this plan's own change created**, and it is stated as such: the rename map is module-scoped because following a re-export across files needs the module resolution D-13 forbids shipping. What would force it open: a reproduced evasion through a fixture-extension re-export, which would make it a resolution question rather than a scope choice.

### The two residual axes, kept apart

`UNRESOLVABLE_CALLEE_RESIDUALS` has 7 members. Six are **resolution** residuals, each bound to at least one derived site above. One — the aliased binding — is a **membership** residual: `const t = test; t.skip()` resolves perfectly to `t.skip`; the head is simply not a banned head. The same sentence covers `testInfo.skip()` via the fixture parameter, the shape `31-REVIEW.md` listed for completeness. The two axes are asserted disjoint and asserted to sum to the register's size, so a resolution site cannot hide behind a membership sentence.

### The three-way cross-check

The recipe's boundary list, the exported register and the derived decline set were cross-checked in both directions. **No disagreement was found.** The boundary list partitions exactly into the 7 register members (verbatim) plus 8 decided non-residual bullets, with nothing left over — asserted by `the boundary list PARTITIONS into register members and the bounded remainder`, and watched failing against a fabricated bullet.

## The watched-fail mirrors

| Mirror | Expected behaviour | Measured |
|---|---|---|
| One extra decline branch seeded into `calleeDottedPath` | count moves UP by exactly one, seeded signature present, nothing else moves, key-set equality names it unbound | PASS |
| The seed anchor changed so the mutation matches nothing | the PREMISE fires, not the count | `AssertionError: PREMISE: the seed anchor was not found EXACTLY once in the runnable, so the mirror is not the source plus one branch — anchor: …` |
| The seeded text never lands in the mirror | the PREMISE fires, not the count | `AssertionError: PREMISE: the seeded branch did not land exactly once in the mirror: expected +0 to be 1` |
| The arm-(c) host declaration renamed | the PREMISE fires, not the member comparison | PASS (`assertDeclinePremise` throws; `sites` is empty) |
| A fabricated boundary bullet added to the recipe | the partition reports it by name | `AssertionError: 1 boundary bullet(s) are neither a member of UNRESOLVABLE_CALLEE_RESIDUALS nor a decided non-residual bullet: A fabricated callee shape is not resolved, claimed here and nowhere else.` |
| The declared surface's `fixme` replaced by `mute` | the reverse partition reports `test.mute` undecided | PASS |

## D-18, as recorded

D-18 is recorded in three places that must agree: `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` (76 insertions, **0 deletions** — D-13 through D-17 byte-unchanged), the decision header of `scripts/runnable-ref/uat-spec-integrity.ts`, and this summary's `key-decisions` block. `agent-factory/checklists/browser-uat-recipe.md` quotes the four rule constants by value under the both-directions equality test and carries the residual register verbatim.

Its three sub-decisions and its "what it does not establish" clause are in `key-decisions` above and in full in `31-CONTEXT.md`.

## Review Dispositions Ledger

| Finding | Severity | Disposition | Acceptance evidence |
|---|---|---|---|
| CR-07 — `test.info().skip()` / `.fail()` / `.fixme()` and `expect.configure({ soft: true })(...)` pass at exit 0; the rule is never asked about a callee containing a call, and the boundary is disclosed nowhere | Critical | **incorporated** | MEASURED PROBE OUTPUT (pre-fix exit 0 / post-fix exit 1, both quoted above) plus TESTS: the four refusal cases, the two false-positive controls and the three position cases |
| WR-14 — an import-renamed head evades the rule and the disclosed alias residual's justification is false for it | Warning | **incorporated** | TESTS: `refuses a modifier call on an import-renamed head`, `the rename map is MODULE-SCOPED`, plus the `import-rename.uat.spec.ts` fixture and its mutation control; PROSE: the module-scope residual now states the true reason |
| CR-07's `testInfo.skip()` via the fixture parameter | Critical (listed for completeness) | **deferred as a named residual** | TEST: the alias residual is bound on the MEMBERSHIP axis of the converse check, with the fixture-parameter shape named in its disposition text; PROSE: the register sentence the recipe carries verbatim |
| CR-07's "the reverse partition cannot ever find it" (reason 3) | Critical (sub-claim) | **partially incorporated, remainder disclosed** | PROSE: the recipe's completeness paragraph now states the walk covers DECLARED PROPERTY CHAINS ONLY and does not descend through a call signature's return type, asserted by TEST; TESTS: `info` declared so the forward direction compiles the shape, and `test.info` dispositioned in the reverse partition |
| **NEW (this plan, Rule 2): a namespace import of `@playwright/test`** | Critical-equivalent, found by this plan's own derivation | **incorporated** | TESTS: `refuses a modifier call reached through a namespace import`, plus the other-module and legitimate-call controls; the shape is DECIDED, not disclosed, because the local name is a literal in the import clause |

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` — D-18's decision header; the call-link branch in `calleeDottedPath`; `BANNED_CONFIGURED_PATHS`, `isBannedModifierCall`, `enabledOptionKeys`, `deriveImportRenames`, `canonicaliseHeadSegment`; five new residual sentences; the arm-(c) call site rewired to one membership authority
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — the CR-07/WR-14 refusal and control block, the decline-set derivation with its binding record and mirrors, the namespace block, the three new corpus cases, the fourth quoted constant, the boundary-list partition
- `scripts/runnable-ref/fixtures/modifier-call-link.uat.spec.ts` — the three TestInfo modifier spellings, marked region plus twin
- `scripts/runnable-ref/fixtures/import-rename.uat.spec.ts` — the renamed head, marked region plus twin on the same renamed binding
- `scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts` — the escape plus the `retries` false-positive control
- `scripts/runnable-ref/fixtures/playwright-test.d.ts` — `TestInfo` and `test.info()`, `Expect.configure`, each with the file's `UNKNOWN - verify` caveat
- `agent-factory/checklists/browser-uat-recipe.md` — the fourth constant as a PAIR, the call-link and rename/namespace prose, the configured-soft entry in the Refused list, the property-chains-only completeness disclosure, the derived-decline-set bullet, five new residual bullets
- `scripts/check-foundation-guards.test.ts` — `NON_TEST_MODULE_COUNT` 69 → 72, with each new corpus file named and its reason
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-18

## Decisions Made

See `key-decisions` in the frontmatter and the full D-18 entry in `31-CONTEXT.md`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A namespace import of the framework was an undisclosed evasion**

- **Found during:** Task 2, by the decline-set derivation itself
- **Issue:** `import * as pw from "@playwright/test"; pw.test.skip(...)` resolved cleanly to `pw.test.skip`, whose head is `pw`, so the head-set check declined it. Measured against the post-Task-1 committed `.js`: `resolved: "pw.test.skip"`, zero findings. This is a real evasion of the same D-14 arm (c) ban, in the same register CR-07 is about, and no round had named it.
- **Fix:** `deriveImportRenames` now maps a `NamespaceImport`'s local name to a `*` marker and `canonicaliseHeadSegment` DROPS that head segment before membership is asked. Decided rather than disclosed, because the local name is a literal already in the import clause — calling it unresolvable would have stated something false about why it is not decided.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts` / `.js`, `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** three cases — refused through the namespace, not refused through another module, not refused for a legitimate namespace call
- **Committed in:** `47440fc`

**2. [Rule 2 - Missing Critical] The "no enumerable ban list" assertion was array-only**

- **Found during:** Task 2
- **Issue:** D-18 added a `Record`-shaped constant. The existing assertion scanned exported ARRAYS only, so a future round could have smuggled a ban list back in as `{ "test.mute": true }` with every gate over it still green — the same drift, one container type over.
- **Fix:** the scan now covers exported plain objects, with `BANNED_CONFIGURED_PATHS` as the one admitted exception, admitted for a stated reason (its keys decide nothing alone; each maps to an option that must be enabled) and additionally asserted to stay paired and segment-shaped.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** the case's premise floors plus the whole suite
- **Committed in:** `47440fc`

**3. [Rule 1 - Bug] `NON_TEST_MODULE_COUNT` did not move in the commit that added the fixtures**

- **Found during:** Task 4, by the full regression run
- **Issue:** the three new corpus fixtures are non-test `.ts` files under `scripts/`, so the two-sided module pin in `scripts/check-foundation-guards.test.ts` fired (72 measured against 69 pinned), failing six LANG-07 cases. The pin's own documented convention is that the number moves in the SAME commit as the files; Task 3's commit did not move it.
- **Fix:** 69 → 72, with each of the three files named and its reason, in the form the eleven prior steps of that block established. Both owner answers are unchanged: no fixture declares a frontmatter parser and none locates a section.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**'` — 62 files, 3461 passed, 2 skipped
- **Committed in:** `f50d3a5`

### Scope moved earlier, not added

The recipe's residual bullets were updated in Task 1's commit rather than Task 3's, because the plan's own rule is that the recipe moves in the same commit as the mechanism, and Task 1 changed the register. The completeness paragraph, the fourth quoted constant and the Refused-list entries stayed in Task 3 as planned.

### Refinement of the plan's converse check

The plan asked that "every member of `UNRESOLVABLE_CALLEE_RESIDUALS` is asserted to be referenced by at least one entry". Taken literally against the derived decline set alone, that check would have failed for the alias residual — which is not a resolution decline at all. Folding the two together would have let a resolution site hide behind a membership sentence. The converse is therefore asserted over a two-axis partition (resolution residuals bound to derived sites, membership residuals bound to a small record with a written reason), asserted disjoint and asserted to sum to the register. This satisfies the plan's criterion and is strictly more precise than conflating the axes.

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** All three were necessary for correctness. Deviations 1 and 2 CLOSE holes of exactly the class this plan exists to close, and both were surfaced by the plan's own derivation rather than by a later verifier — which is the derivation earning its place. Deviation 3 is a pin repair. No scope creep.

## Issues Encountered

None that required problem-solving beyond the deviations above. Two harness premises fired during the work and were correct to fire: the `DISCRIMINATES` mirror's anchor stopped being unique the moment `TestInfo` declared a `fixme` of its own, and the reverse partition's `fixtureCalledSurfacePaths` began resolving call-link paths the `getPropertiesOfType` walk cannot reach. Both were reported by their own premise assertions rather than by a silent wrong answer, and both are now handled explicitly with the reason written down.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or FIXME was introduced by this plan.

## Threat Flags

None. This plan introduces no network endpoint, no auth path, no file-access pattern and no schema change at a trust boundary. The threat register's six entries (`T-31-13-01` … `T-31-13-07`, plus `T-31-13-SC`) are each mitigated or accepted as the plan dispositioned them, and `T-31-13-SC` needed no gate: no package-manager install was performed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Round-3 gap 1 (`CR-07` / `WR-14`) is closed at the shape-resolution register, measured against the committed `.js` on the verifier's own probe shape.
- `31-14` (wave 2) may now append its own dated decision to `31-CONTEXT.md`; D-18 occupies the position after D-17 and edits nothing above it.
- Round-3 gap 2 (`CR-08` — `compactor.promote` of a human-disposed finding) is untouched by this plan and is owned by `31-14`. `WR-15`/`WR-16`/`IN-08`/`IN-09` are owned by `31-15`.
- Standing residual carried forward, not closed: extending the reverse partition's walk to descend call-signature return types. It would move the denominator of every coverage assertion `31-12` landed, and is now disclosed in the recipe rather than assumed away.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*
