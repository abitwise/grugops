---
phase: 31-autonomous-manual-testing
plan: 24
subsystem: testing
tags: [uat-spec-integrity, ast-ban, lexical-scope, gap-closure-round-5, security, false-negative]
status: complete
requires:
  - "31-17 (WR-20 / D-21 (2)): the file-scoped declared-name census this plan replaces"
  - "31-16 (CR-10 / D-20 (3)): the TestInfo fixture-parameter map whose binding position is now recorded"
  - "31-13 (WR-14 / D-18 (3)): the import-rename and namespace canonicalisation the scope rule governs"
provides:
  - "DeclaredBinding — { name, start, end, suppresses }, the record a declaration becomes"
  - "BindingScope — the { bindings, position } PAIR the canonicaliser takes, so a caller cannot forget the position"
  - "bindingRangeFor — the ONE place a range is computed, with an explicit arm per declaration KIND"
  - "deriveDeclaredBindings — replaces deriveDeclaredNames; records the fixture position as NON-suppressing"
  - "resolveBinding — the ONE resolution authority: innermost wins, non-suppressing wins an exact tie"
  - "canonicalAssertionHead — arms (a)/(b) ask about a canonicalised head (PROBE 4)"
  - "shadowed-rename.uat.spec.ts as the UNION fixture, able to fail in BOTH directions"
affects:
  - scripts/runnable-ref/uat-spec-integrity.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - agent-factory/checklists/browser-uat-recipe.md
tech-stack:
  added: []
  patterns:
    - "a suppression rule inside a BAN is never monotone in the safe direction; state the direction it moves the answer"
    - "resolve a reference to the NEAREST binding that contains it, and ask the predicate WITH a position"
    - "a range is computed per declaration KIND, because the kinds disagree about where a binding begins"
    - "an exemption is a POSITION, never membership of the map it constrains"
    - "a corpus control that can only stay green cannot fail for the reason it exists"
    - "a mutant that breaks zero cases is a branch nobody derived — delete it rather than keep it for symmetry"
key-files:
  created: []
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-27: a reference is resolved to the NEAREST binding of its name that lexically contains it, and only that binding decides whether the canonicalisation is suppressed. Ranges are per declaration KIND (var and function declarations hoist; let/const/class begin at their own declaration). The TestInfo fixture-binding position is RECORDED as a non-suppressing binding rather than omitted, so an inner fixture parameter beats an outer declaration. The disclosure states the direction a suppression moves a BAN."
  - "PROBE 4's finding, fixed in this plan: arms (a) and (b) compared a RAW head identifier, so an import rename or a namespace defeated the caught/conditional assertion ban at exit 0. They now consume arm (c)'s already-canonicalised path."
requirements-completed: [UATX-06]
coverage:
  - id: D1
    description: "CR-14 closed — a declaration suppresses a canonicalisation only where its own range contains the reference"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 1 (row 10): a dead inner `const it` no longer admits a module-scope renamed modifier"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 2: a dead inner `const pw` no longer admits a module-scope NAMESPACE modifier"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 3: an index-0 helper parameter no longer admits the fixture-parameter spelling"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/31-24-probe (all three spellings, pre-fix 0 findings/EXIT=0 -> post-fix 1 finding(s)/EXIT=1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The module-scope `const testInfo = 1;` spelling the round-5 adversarial check measured is refused, and the case discriminates innermost-wins from any-containing-binding"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 5: a MODULE-SCOPE `const testInfo` no longer beats the fixture PARAMETER that shadows it"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 5b: under an ANY-CONTAINING-BINDING resolver the same spec is still admitted"
        status: pass
      - kind: command
        ref: "mutation proof MUTANT 2 (any-containing-binding) — breaks 5 cases, all in the RED 5 family"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-23 closed — the fixture-binding exemption is index 1 of a function that is itself a call's SECOND ARGUMENT"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED 4 (WR-23): a helper's SECOND parameter sharing a renamed name is not a false refusal"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#WR-23 — the exemption is index 1 of a function that is a CALL's SECOND ARGUMENT, nothing else"
        status: pass
      - kind: command
        ref: "mutation proof MUTANT 3 (exemption widened back) — breaks RED 4 and its unit case"
        status: pass
    human_judgment: false
  - id: D4
    description: "WR-24 closed — the corpus fixture can fail in BOTH directions"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the UNION fixture is on disk and reports EXACTLY ONE finding with its region present"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the UNION fixture returns to ZERO findings once its marked region is removed"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the UNION fixture DISCRIMINATES: under the file-scoped rule its region-present half is admitted"
        status: pass
    human_judgment: false
  - id: D5
    description: "IN-12 closed — stripRoutingLinks is computed once per arm, with findings byte-identical"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#every function that normalises does it EXACTLY ONCE, and the callers are derived"
        status: pass
      - kind: command
        ref: "21 driven specs (13 fixtures + 8 spellings) diffed before and after the dedupe — byte-identical"
        status: pass
    human_judgment: false
  - id: D6
    description: "PROBE 4's finding fixed — the caught/conditional assertion arms ask about a canonicalised head"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED A (caught, RENAMED head): `import { expect as check }` no longer defeats arm (a)"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED B (caught, NAMESPACE head): `pw.expect(...)` no longer defeats arm (a)"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#RED C (conditional, RENAMED head): the same rename no longer defeats arm (b)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The disclosure moved with the mechanism — the D-21 header direction claim, the residual register and the recipe"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the residual register states the NEAREST-BINDING rule and no longer claims file scope"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the D-21 header no longer calls the suppression MONOTONE IN THE SAFE DIRECTION"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's residual bullets are the exported residual array, verbatim"
        status: pass
    human_judgment: false
duration: ~1h10m
completed: 2026-09-10
commits: 5
plan_head_before: 0f90a5b0d74255b51def1f2848948c839a0eb8dc
actuals:
  tokens: 50017
  tasks: 3
  commits: 5
---

# Phase 31 Plan 24: One nearest-binding resolution authority, asked with a position — Summary

**CR-14's two-line evasion of the whole rename/namespace/fixture ban family is closed by replacing a file-scoped census of NAMES with a per-file list of BINDINGS carrying per-kind ranges, resolved innermost-first at the position of the call being decided; WR-23's mirror-image false refusal is closed in the same edit; and the plan's own red-team found and fixed a third path — the caught/conditional assertion arms were still comparing a RAW head identifier.**

## Performance

- **Duration:** ~1h 10m
- **Tasks:** 3
- **Files modified:** 6
- **Commits:** 5 (measured: `git rev-list --count 0f90a5b..HEAD`)

## Accomplishments

- **CR-14 closed.** `deriveDeclaredNames` (a per-file SET of names) is replaced by
  `deriveDeclaredBindings` (an ordered list of `{ name, start, end, suppresses }`), and
  `canonicaliseHeadSegment` now takes a `{ bindings, position }` PAIR and asks one authority,
  `resolveBinding`, which returns the INNERMOST record of that name containing that position.
- **The measured module-scope spelling is closed too, and the case proves the rule was CHOSEN.**
  Narrowing to plain containment would have left `const testInfo = 1;` + `({page}, testInfo)`
  admitted. The fixture-binding position is now RECORDED as a NON-suppressing binding instead of
  being omitted, which is what makes the inner parameter beat the outer `const`.
- **WR-23 closed in the same edit.** The exemption is narrowed from index 1 of ANY function-like node
  to index 1 of a function that is itself a call's SECOND ARGUMENT — the position the fixture map
  actually binds.
- **WR-24 closed.** `shadowed-rename.uat.spec.ts` gained a `MUTATE-REMOVE` region carrying a genuine
  module-scope renamed modifier call, so the fixture now fails in BOTH directions.
- **IN-12 closed, and the guard over it STRENGTHENED.** `stripRoutingLinks` runs once per arm into a
  local. Because that removed the normaliser's name from the arms' operand text, the CR-09
  path-consumer derivation now FOLLOWS an operand identifier to its local's initialiser — otherwise
  that guard would have gone quietly true for any local whatever.
- **PROBE 4 found a third evasion and it is fixed here, not deferred.** Arms (a) and (b) compared the
  raw head identifier against `expect`/`assert`, so `import { expect as check }` and
  `import * as pw` both defeated the caught and conditional assertion bans at exit 0.
- **D-27 appended** to `31-CONTEXT.md` (10 → 11 gap-closure decisions, additions only).

## Task Commits

1. **Task 1 (RED): the four CR-14 spellings and WR-23, driven against the committed `.js`** — `ad0d7e4` (test)
2. **Task 1 (GREEN): one nearest-binding resolution authority, asked with a position** — `3da6673` (fix)
3. **Task 2: the corpus fails in BOTH directions, one normalisation per arm, D-27** — `2b175ad` (feat)
4. **Task 3 (RED): PROBE 4 finds a rename/namespace evasion of the assertion arms** — `ca5a34e` (test)
5. **Task 3 (GREEN): the assertion arms ask about a canonicalised head** — `20b18e7` (fix)

## THE SPELLINGS, PRE-FIX AND POST-FIX

Every pre-fix cell was driven against the committed `scripts/runnable-ref/uat-spec-integrity.js` at
`0f90a5b` from a probe root under `.temp/31-24-probe/`, before any source change. Every post-fix cell
was driven against the rebuilt committed `.js`. Finding text is quoted with the shared trailing
sentence elided.

| case | pre-fix | post-fix |
|---|---|---|
| **RED 1** (row 10) renamed import + dead inner `const it` | `0 findings over 1/1` · EXIT=0 | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:2: banned modifier call — `test.skip` `` · EXIT=1 |
| **RED 2** namespace import + dead inner `const pw` | `0 findings over 1/1` · EXIT=0 | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:2: … `test.skip` `` · EXIT=1 |
| **RED 3** index-0 helper parameter named `testInfo` | `0 findings over 1/1` · EXIT=0 | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:5: … `test.info().skip` `` · EXIT=1 |
| **RED 4** (WR-23) helper's SECOND parameter shares the renamed name | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:2: … `test.skip` `` · EXIT=1 | `0 findings over 1/1` · EXIT=0 |
| **RED 5a** module-scope `const testInfo`, spec ALONE | `0 findings over 1/1` · EXIT=0 | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:4: … `test.info().skip` `` · EXIT=1 |
| **RED 5 PAIR** (`a` with the const, `b` without, ONE run) | `1 finding(s) over 2/2` · only ``uat/b.uat.spec.ts:2: … `test.info().skip` `` · EXIT=1 | `2 finding(s) over 2/2` · ``uat/a…:4`` **and** ``uat/b…:2`` · EXIT=1 |
| **RED 5b** the same spec under a seeded any-containing-binding resolver | — | still admitted (see below) |
| **CONTROL 1** (row 11) the declaration-free file | `1 finding(s) over 1/1` · ``uat/a.uat.spec.ts:2: … `test.skip` `` · EXIT=1 | unchanged |
| **CONTROL 2** (row 1) `expect.configure({retries:2}).soft` | `1 finding(s)` · ``…:3: … `expect.configure().soft` `` · EXIT=1 | unchanged |
| **CONTROL 3** (row 2) `…configure({soft:true})` | `1 finding(s)` · ``…:3: … `expect.configure().configure` `` · EXIT=1 | unchanged |
| **CONTROL 4** (row 3) plain `testInfo.skip()` | `1 finding(s)` · ``…:3: … `test.info().skip` `` · EXIT=1 | unchanged |
| **CONTROL 5** WR-20's own legitimate spec | `0 findings over 1/1` · EXIT=0 | unchanged |
| **CONTROL 6** module-scope declaration, NO inner binding | `0 findings` | `0 findings` (suite case) |
| **CONTROL 7** the KIND matrix | — | table below |
| **CONTROL 8** the exact-range tie | — | non-suppressing wins; shape driven from source |
| **CONTROL 9** the derived list shuffled | — | every answer unchanged |

The pre-fix **RED 1** and **CONTROL 1** cells match `31-VERIFICATION.md` behavioral spot-check rows 10
and 11 exactly. The pre-fix **RED 5 PAIR** matches the round-5 adversarial checker's measurement
exactly: `0 findings`/EXIT=0 for the file carrying the `const`, and `1 finding(s) over 2/2`/EXIT=1
with **only** `uat/b` named when both are in one run.

**Why the post-fix RED 5 cell names `test.info().skip`:** the reference `testInfo.skip()` is bound by
the index-1 fixture PARAMETER, which is recorded as a NON-suppressing binding, so it is the nearest
binding and the module-scope `const` is never consulted.

**RED 5b, the discrimination, recorded:** the same spec's binding list carries a *suppressing*
containing record of `testInfo` (the module-scope `const`, whose TDZ range runs to end of file) **and**
a *non-suppressing* nearer one (the parameter). A resolver answering "does SOME containing binding
suppress?" returns the `const` and admits the construct — measured, both as a unit predicate over the
shipped records and as the source-level MUTANT 2 below. So this case distinguishes the two candidate
rules, not merely broken from fixed.

## CONTROL 7 — the KIND matrix, derived

Every range below is read off `bindingRangeFor(ts, sf, declaration)`; the `arm` column is the
function's own returned arm, not a reader's inference.

| kind | derived range | arm | enclosing node | reference at | suppresses? |
|---|---|---|---|---|---|
| catch-clause binding | `[31,49)` | `catch` | `catch (it) { it; }` | 44 | yes |
| `for-of` `let` head | `[19,46)` | `tdz` | `let it of [1]) { void it; }` | 36 | yes |
| `for` `var` head | `[0,59)` | `hoisted` | the whole enclosing `function f` | 47 | yes |
| arrow parameter | `[10,28)` | `parameter` | `(it: number) => it` | 23 | yes |
| class-method parameter | `[10,38)` | `parameter` | `m(it: number) { return it; }` | 26 | yes |
| nested function declaration | `[0,44)` | `hoisted` | the whole enclosing `function outer` | 34 | yes |
| object-method parameter | `[12,40)` | `parameter` | `m(it: number) { return it; }` | 28 | yes |
| switch-case `let` | `[46,68)` | `tdz` | the innermost block inside the clause | 58 | yes |
| import binding | — | NOT COUNTED | — | — | never |

**The hoisting and TDZ rows give OPPOSITE answers for a reference ABOVE the declaration, and that
opposition is the decided rule.** Driven end to end, one spec per kind, reference held constant:

| declaration written AFTER the reference | findings |
|---|---|
| `var it = …` in the same function | **0** — hoists, so the reference is legitimately its own |
| `function it(){}` in the same function | **0** — same |
| `let it = …` in the same block | **1** — TDZ: the range starts at the declaration |
| `const it = …` in the same block | **1** — same |
| `class it {}` in the same block | **1** — same |

A catch-clause binding suppresses INSIDE its catch block and not outside it: the driven spec with one
reference in each place reports exactly **1** finding, at the outside one (line 9).

**CONTROL 8, the tie, and how it was constructed.** A tie needs two records of one name with the
identical range and opposite `suppresses`. That is reachable through `test("s", function (testInfo,
testInfo) { return testInfo.skip(); })` — a duplicate parameter name a type checker rejects and
`createSourceFile` accepts, because it does no binding. Index 0 is suppressing, index 1 is the fixture
position and is not; both range over the same function expression; the resolution returns the
NON-suppressing record and the construct is refused (`test.info().skip`), which is the ban's safe
direction. The unit case drives both list orders and gets the same answer, so the rule is the
comparator's and not the array's.

**CONTROL 9.** The derived list is reversed and rotated; every resolution answer is unchanged.

**ADJACENCY, all three cases.** Inclusive start, exclusive end: a range `[0,40)` does not contain
position 40 and does contain 39; a range `[40,80)` does contain 40 and does not contain 39; a range
beginning at the call's END does not contain the call's START, which is the position compared. The
third touching case is driven from source: `let it = it.skip(1);` puts the reference inside the
declaration's own range, so it IS suppressed — the lexically correct answer, since that reference is a
TDZ error at run time.

**EMPTY, both cases.** A file with no declarations yields `[]`, and `resolveBinding` returns
`undefined` for it. A parser missing any declaration predicate (or `NodeFlags`, or `getEnd`) yields
`null`, and `canonicaliseHeadSegment(…, null)` applies the rewrite — the pre-D-21 behaviour. Both
suppress nothing.

**"A constant is not a position", measured.** With each reference's own position, a two-call file
answers `it.skip` for the helper's call and `test.skip` for the module-scope one; with a file-level
`0` for both, the helper's legitimate call becomes `test.skip` too. Separately, a module-scope
`var it` hoists to the SourceFile, whose range starts at 0, so position `0` there suppresses every
call in the file — CR-14 through the back door, driven rather than trusted.

**Both canonicaliser callers, derived.** A case parses the module, collects every
`canonicaliseHeadSegment(...)` call and its 4th argument, asserts the count is **2**, asserts the one
`scope` local is initialised from an expression containing `node.getStart(sf)`, and asserts each
call's scope argument is either a `getStart(sf)`-bearing expression or that local.

## Mutation proofs

Each mutant was applied to the `.ts`, rebuilt, measured against
`scripts/runnable-ref/uat-spec-integrity.test.ts`, then reverted and rebuilt. **Every mutant's
compilation was asserted before its result was read** — the first draft of MUTANT 1 did not compile
(`position` unused, TS6133), `npm run build` left the previous `.js` in place, and the run reported
`235 passed`, i.e. a *stale artifact measured as a passing mutant*. It was caught by grepping the
rebuilt `.js` for the mutant's own marker. This is the third round in which a mutation harness
produced a false result; the marker check is now part of the harness.

| # | mutant | cases broken | what it proves |
|---|---|---|---|
| **1** | `resolveBinding`'s containment test removed (file-scoped by range) | **12** | the containment test is load-bearing for every spelling whose suppressing declaration sits textually AFTER the reference: RED 1, RED 2, the three TDZ kinds, the catch case, the union case, all three adjacency cases, the constant-position case |
| **1b** | the TRUE pre-D-27 rule: containment removed **and** the fixture position omitted | **23** | RED 1, 2, **3** and **5** all return to their pre-fix answers. This is the mutant the plan predicted for #1; #1 alone restores only half the old rule, because the fixture record's later start still wins the comparator |
| **2** | "does SOME containing binding suppress?" instead of innermost | **5** | RED 5, RED 5 PAIR, RED 5b and both CONTROL 8 cases — **and nothing else**. This is the mutant that proves the plan chose the right rule and not merely a narrower one |
| **3** | the fixture exemption widened back to any index-1 parameter | **2** | RED 4 and the WR-23 unit case — the narrowing is exactly what closes WR-23 |
| **E** | the assertion arms compare the RAW head identifier again | **4** | PROBE 4's three RED spellings plus the derived caller-count case |
| **I** | `canonicalAssertionHead` never recognises a head | **10** | the whole arm-(a)/(b) family, so the new predicate is not a no-op |
| **H** | the call-marker strip removed from the assertion head | **0** | **the branch was DELETED.** The outer link of a chain resolves to `expect().toBeVisible`, but the inner link is `expect(...)` and both are visited, so the strip could never change an answer. A branch no case can reach is a branch nobody derived |

## The plan's own probes (Task 3)

All six ran. **PROBE 4 found a defect; it was fixed in this plan and re-probed.** The residue check
is one that can OBSERVE its target: `test ! -e .temp/31-24-probe` succeeds,
`find . -path ./node_modules -prune -o -type p -print` prints nothing, and `git status --short` shows
no residue. `git status --short .temp` is deliberately NOT the check — `.temp/` is gitignored at
`.gitignore:19`, so it prints nothing whatever that directory contains and can never fail.

### PROBE 1 — HOW IS THIS GATE REACHED · **PASS**

Command: `node <probe1.py>` driving eight legitimate specs against BOTH the pre-fix `.js`
(`git show 0f90a5b:…`) and the post-fix one. Consumer set derived by parse: `canonicaliseHeadSegment`
has **2** callers (arm (c) in `findBannedConstructs`, and the scenario-head resolution in
`deriveTestInfoParameterNames`); `deriveDeclaredBindings` has **1**; `resolveBinding` has **1**;
`bindingRangeFor` has **1**; `isFixtureBindingPosition` has **1**.

| legitimate input | pre-fix | post-fix | verdict |
|---|---|---|---|
| clean spec, no shadowing | 0 findings / 0 | 0 findings / 0 | PASS |
| WR-20's genuinely shadowed helper | 0 findings / 0 | 0 findings / 0 | PASS |
| helper whose SECOND parameter shadows the rename | **1 finding / 1** | **0 findings / 0** | PASS (WR-23's false refusal gone) |
| fixture parameter used legitimately | 0 findings / 0 | 0 findings / 0 | PASS |
| namespace import used legitimately | 0 findings / 0 | 0 findings / 0 | PASS |
| namespace local name shadowed in a helper | 0 findings / 0 | 0 findings / 0 | PASS |
| class-method parameter shadowing the rename | 0 findings / 0 | 0 findings / 0 | PASS |
| arrow parameter shadowing the rename | 0 findings / 0 | 0 findings / 0 | PASS |

No consumer produces a finding for a spec that produced none pre-fix. Zero false refusals introduced.

### PROBE 2 — DERIVE BOTH AXES · **PASS**

- **(a) the declaration KINDS** — eight shapes driven, each with its derived range and its own
  returned arm (table above). Every one takes the arm the plan assigned it.
- **(b) the EXEMPTION's own scope** — in a file carrying both a fixture callback and an ordinary
  two-parameter helper, exactly **one** non-suppressing record exists
  (`{"name":"testInfo","start":51,"end":110,"suppresses":false}`); **no** record of one name shares an
  exact range with an opposite-`suppresses` record; **no** position is both exempt and counted.
- **(c) the ORDER** — the census is built before the fixture map and the map consumes it. Driven with
  a file whose renamed head is locally bound inside a helper: with the binding list, the fixture map
  derives `["testInfo"]`; without it (pre-D-21), `["testInfo","shadowInfo"]`. The census REMOVED
  `shadowInfo`, so the order is load-bearing and its direction is the safe one.
- **(d) the UNION of the two canonicalisations** — one file exercising rename, namespace and
  fixture-parameter at once. With the three declarations in an UNRELATED nested function:
  **3 finding(s)**, one per family (`test.skip` line 9, `test.only` line 10, `test.info().fixme` line
  11), EXIT=1. With the three declarations at MODULE scope BEFORE the calls: **0 findings** — the
  decided answer (CONTROL 6: module scope reaches the whole file where nothing nearer binds), and a
  measured bound on it: that shape does not compile.
  `npx tsc -p <probe>` reports `error TS2440: Import declaration conflicts with local declaration of
  'it'`, so reaching the residual at module scope requires a file a type checker rejects.
- **(e) the NESTING axis** — three bindings of one name at three depths, reference at the innermost:
  records derived at `[186,256)`, `[132,278)`, `[80,296)`; position 243 resolves to `[186,256)`,
  which is `function c`, the deepest. Neither outer one is consulted.

### PROBE 3 — WHAT IS THE PREDICATE'S INPUT ASSEMBLED FROM · **PASS**

One row per shape, recording which position the containment comparison actually uses.

| shape | CallExpression `getStart(sf)` | head identifier `getStart(sf)` | same? | resolved | label |
|---|---|---|---|---|---|
| head identifier on a different LINE from the chain | 94 | 94 | yes | no binding → `test.skip` | decided |
| a call nested in another call's argument list | 113 | 113 | yes | no binding → `test.skip` | decided |
| a call inside a template-literal expression | 102 | 102 | yes | no binding → `test.skip` | decided |
| a declaration and a call in the SAME statement | 72 | 72 | yes | `[61,112)` sup=true → `it.skip` | decided (TDZ) |
| a call in a DEFAULT-PARAMETER initialiser | 62 | 62 | yes | no binding → `test.skip` | decided |
| a call inside a DECORATOR | 130 | 130 | yes | no binding → `test.skip` | decided |

In every shape the position compared is the CallExpression's own `getStart(sf)`, which equals the head
identifier's start — the leftmost character of the reference. No shape disagrees with the lexical
reading.

### PROBE 4 — AT WHICH POSITIONS IS THE PREDICATE EVEN ASKED · **FAIL, then FIXED**

Enumerated every path from a call expression to a membership question:

| path | operand | asks the canonicaliser? | disposition |
|---|---|---|---|
| arm (c) → `isBannedModifierCall` | `dottedPath` | yes, at the call's position | decided |
| ↳ `isBannedModifierPath` exact-path arm | `stripRoutingLinks(dottedPath)` | yes (same value) | decided |
| ↳ `isBannedModifierPath` head/tail arm | un-normalised segments of the SAME canonicalised path | yes | decided (D-17) |
| the per-chain dedup key | `stripRoutingLinks(dottedPath)` | yes; decides no membership | decided |
| `chainEnabledOptionKeys` | option literals only, no head | n/a | decided |
| **arms (a)/(b)** | **`head.text === "expect" \|\| "assert"`** | **NO** | **DEFECT** |

Measured against the committed `.js` before the fix:

```
### arms (a)/(b) on a RENAMED expect head, caught
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
### the same shape with the un-renamed head
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/s.uat.spec.ts:4: caught assertion — the `expect` call sits inside a try block, …
EXIT=1
```

The namespace spelling (`pw.expect(...)`) and the CONDITIONAL arm measured the same way — three
spellings, all `0 findings`/EXIT=0. That is WR-14's defect (a head-set check defeated by two words in
an import line) in the one arm family D-18 (3) never reached, and it was disclosed nowhere.

**Fixed in this plan** (Rule 2 — missing critical functionality; a ban arm defeated by a rename is an
admission, the exact defect class this phase exists to close). The arms now ask
`canonicalAssertionHead(dottedPath)`, consuming arm (c)'s already-canonicalised path, so the rename
map, the namespace drop and D-27's scope rule reach them by construction rather than by a second
reading of the same maps. A second route through the head identifier was written and then **deleted**
after measurement showed `calleeHeadIdentifier` declines exactly where `calleeDottedPath` does; so was
the call-marker strip (MUTANT H, 0 cases). The caller count is therefore still **2**, and the case
that asserts it now records the reversal.

Re-probed after the fix: all three spellings refused; the un-renamed control unmoved and still
reported once; a LOCAL `check` shadowing the rename produces zero findings (the scope rule governs the
new route); a legitimate straight-line assertion on a renamed head is not refused (the arms refuse a
CONTEXT, not a head).

### PROBE 5 — EVERY SHAPE THE RESOLVER DECLINES, PROBED WITH A CONSTRUCTED SPEC · **PASS**

Register cardinality **9 → 9** (one member rewritten; none added, none removed).

| # | residual member | measured | matches its own sentence? |
|---|---|---|---|
| 1 | an aliased binding (`const t = test;`) | 0 findings / 0 | yes |
| 2 | a computed member from a variable | 0 findings / 0 | yes |
| 3 | a rename through another module | 0 findings / 0 | yes |
| 4 | a callee whose head is not an identifier | 0 findings / 0 | yes |
| 5 | a chain past the 512-step bound | 0 findings / 0 | yes |
| 6 | an option enabled only by an object literal with `true` | 0 findings / 0 | yes |
| 7 | a parser missing the predicates | not constructible as a SPEC — it is a property of the TARGET's parser module; exercised by the suite's injected-parser cases | yes, with a stated reason |
| 8 | a destructured TestInfo second parameter | 0 findings / 0 | yes |
| 9 | the NEAREST-binding rule (rewritten this plan) | declaration in a non-containing scope → **1 finding / 1** | yes |
| 9b | the same member's no-binder clause: a `typeof`-guarded conditional `var` | 0 findings / 0 | yes — the clause discloses exactly this |

### PROBE 6 — THE MUTATION SET, RE-DERIVED · **PASS**

Re-run on the final tree against `uat-spec-integrity.test.ts`:

| mutant (31-17) | recorded then | measured now | verdict |
|---|---|---|---|
| A — the recursive descent starts a FRESH allowance | 4 | **4** | unmoved |
| B — `forEachDescendant` restored to a self-recursive walk | 3 | **3** | unmoved |
| C — the declared census emptied | 11 | **33** | up |
| D — the fixture-binding exemption forced false | 8 | **15** | up |

No pre-existing mutant breaks fewer cases than `31-17-SUMMARY.md` recorded.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` — `DeclaredBinding`, `BindingScope`,
  `bindingRangeFor`, `deriveDeclaredBindings`, `resolveBinding`, the positioned canonicaliser, the
  narrowed `isFixtureBindingPosition`, `ASSERTION_HEADS` + `canonicalAssertionHead`, the IN-12
  dedupe, the corrected D-21 header direction claim and the rewritten residual member.
- `scripts/runnable-ref/uat-spec-integrity.js` — rebuilt with `npm run build`; freshness green at
  60/60.
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — the scope corpus, the IN-12 derivation, the
  PROBE 4 corpus, and the updated census/decline-site/consumer records.
- `scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts` — now the UNION fixture.
- `agent-factory/checklists/browser-uat-recipe.md` — the boundary list re-quoted from the register,
  the scope paragraphs replaced, and the assertion rows' canonicalised head disclosed.
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-27 appended.

## Decisions Made

- **D-27** (recorded in full in `31-CONTEXT.md`): nearest-binding resolution replaces file-scope
  membership; ranges per declaration KIND; the fixture-binding position RECORDED as non-suppressing;
  the disclosure states the direction a suppression moves a BAN.
- **The assertion arms consume arm (c)'s already-canonicalised path**, rather than gaining a
  canonicaliser call of their own. Two authorities for one question is what this file forbids, and
  the second route was measured redundant before it was deleted.
- **Per-kind ranges are decided inside ONE function that RETURNS its arm**, so the suite can assert
  which rule decided a range rather than only the two numbers it produced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — missing critical functionality] The caught/conditional assertion arms were defeated by an import rename or a namespace**

- **Found during:** Task 3, PROBE 4.
- **Issue:** arms (a) and (b) asked their membership question about the RAW head identifier's text,
  so `import { expect as check }` and `import * as pw` reached it with a head the one canonicaliser
  never saw. Measured: `0 findings`/EXIT=0 for all three spellings, against `1 finding(s)`/EXIT=1 for
  the identical un-renamed file. Disclosed nowhere.
- **Fix:** the arms ask `canonicalAssertionHead(dottedPath)`, reusing arm (c)'s canonicalised path;
  the recipe discloses that the four assertion rows read a canonicalised head.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` / `.test.ts`,
  `agent-factory/checklists/browser-uat-recipe.md`.
- **Verification:** RED-first (`ca5a34e`), then GREEN (`20b18e7`); mutants E (4 cases) and I (10
  cases); full excluded-e2e suite 62/62 green.
- **Committed in:** `ca5a34e` (RED) and `20b18e7` (GREEN). The plan scoped Task 3 to the test file
  only; the source change is this deviation.

**2. [Rule 3 — blocking] The register/recipe edits had to land in Task 1's commit, not Task 2's**

- **Found during:** Task 1, MOVEMENT 5.
- **Issue:** the plan scheduled the `UNRESOLVABLE_CALLEE_RESIDUALS` rewrite and the recipe re-quote in
  Task 2, but the suite asserts register↔recipe set-equality in BOTH directions and asserts the D-21
  header's direction sentence. Splitting them across commits would have left an intermediate commit
  with a red suite.
- **Fix:** the residual member, the recipe boundary list and the recipe scope paragraphs moved in
  Task 1's GREEN commit (`3da6673`); Task 2 kept the fixture, the coarseness-case replacement, IN-12
  and D-27.
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**'` green at every commit.

**3. [Rule 1 — bug] The rewritten residual member broke the sentence-form guard**

- **Found during:** Task 1.
- **Issue:** the register member is quoted verbatim into `browser-uat-recipe.md`, which is inside the
  Phase 29 `guard_sentence_form` corpus. Four of its sentences exceeded the 25-word descriptive bound
  (27, 35, 27 and 45 words), and `check-imperative-lexicon.test.ts` turned red.
- **Fix:** the member was rewritten as short declarative sentences carrying the same content. No
  claim was dropped.
- **Verification:** `node scripts/check-imperative-lexicon.js .` → `ALL CHECKS PASSED`.

**4. [Rule 1 — bug] The Task-2 case asserted paths the resolver does not produce**

- **Found during:** Task 2.
- **Issue:** an IN-12 behaviour case asserted `isBannedModifierCall("expect.configure()", …)` is
  banned. It is not: `stripRoutingLinks` drops a MARKED last segment too, so that string normalises
  to `expect`. The call marker is appended only when a LATER segment is read off the call, so a bare
  configured call resolves to `expect.configure`.
- **Fix:** the case uses the paths `calleeDottedPath` really produces, and records the mistake in its
  own comment.
- **Verification:** the case now passes and would fail if either arm stopped normalising.

**5. [Rule 1 — bug] The CR-09 path-consumer guard would have gone vacuous under IN-12**

- **Found during:** Task 2, MOVEMENT 3.
- **Issue:** that guard asserts each normalised arm's operand text contains `stripRoutingLinks(`. The
  dedupe replaced the inline call with a LOCAL, so the check would have passed for any local
  whatever.
- **Fix:** the derivation now FOLLOWS an operand identifier to its local's initialiser within the same
  function, and a seeded case shows a local initialised from the RAW path is caught.
- **Verification:** the seeded-wrong-local case; the seeded-regrowth case; MUTANT H's discipline.

**6. [Rule 1 — bug] The mutation harness measured a STALE artifact**

- **Found during:** Task 1, MOVEMENT 6.
- **Issue:** MUTANT 1's first draft left `position` unused (TS6133), `npm run build` failed, the
  previous `.js` stayed on disk, and the run reported `235 passed` — a broken mutant read as a
  passing one.
- **Fix:** the harness asserts the build's exit code AND greps the rebuilt `.js` for the mutant's own
  marker before reading any result. Every mutant in this summary was measured through it.
- **Note:** this is the third round in this phase in which a verification harness produced a false
  result. Asserting the harness's own premise is now part of the mutation idiom here.

---

**Total deviations:** 6 auto-fixed (1 × Rule 2, 1 × Rule 3, 4 × Rule 1). No Rule 4 architectural
question arose; no checkpoint was reached.

## The measured bound this plan adds to the module-scope residual

The residual says a MODULE-scope declaration reaches the whole file except where an inner binding is
nearer. PROBE 2(d) measured a bound on how far that reaches in practice: a module-scope declaration
of a name the file also IMPORTS is illegal TypeScript
(`error TS2440: Import declaration conflicts with local declaration of 'it'`), so the rename and
namespace families cannot be evaded that way in a spec that type-checks. The fixture-parameter family
has no such collision, which is exactly why RED 5 was the spelling that survived a plain containment
rule. This is recorded here rather than added to the register: it is a fact about TypeScript, not a
property of this mechanism, and the register must state only what the mechanism decides.

## Verification

| command | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 test files, 3878 passed, 2 skipped** |
| `npm run typecheck` | pass (`tsc --noEmit` + tests + fixtures targets) |
| `npx tsc -p tsconfig.fixtures.json --noEmit` | pass — the new fixture construct type-checks |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-imperative-lexicon.js .` | `ALL CHECKS PASSED` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `test ! -e .temp/31-24-probe` | pass |
| `find . -path ./node_modules -prune -o -type p -print` | empty |
| `grep -c '^#### Gap-closure decision — D-' 31-CONTEXT.md` | 10 → **11**, +1 |
| `git diff 0f90a5b..HEAD --numstat -- 31-CONTEXT.md` | `109  0` — additions only |

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced by this plan.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file-access pattern and no schema change.
It narrows an existing suppression rule and narrows an existing exemption; both movements reduce what
the checker admits.

## Self-Check: PASSED

- `scripts/runnable-ref/uat-spec-integrity.ts` — FOUND
- `scripts/runnable-ref/uat-spec-integrity.js` — FOUND
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — FOUND
- `scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts` — FOUND
- `agent-factory/checklists/browser-uat-recipe.md` — FOUND
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — FOUND
- commit `ad0d7e4` — FOUND
- commit `3da6673` — FOUND
- commit `2b175ad` — FOUND
- commit `ca5a34e` — FOUND
- commit `20b18e7` — FOUND
