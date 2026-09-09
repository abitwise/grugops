---
phase: 31-autonomous-manual-testing
plan: 25
subsystem: testing
tags: [uat-spec-integrity, exit-code-contract, could-not-run-boundary, parser, de-recursion, gap-closure-round-5]
status: complete
requires:
  - "31-17 (WR-19 / D-21 (1)): the shared chain budget, the de-recursed AST walk and the could-not-run boundary this plan MOVES"
  - "31-24 (CR-14 / D-27): the nearest-binding resolution in the same module, which this plan must not disturb"
provides:
  - "the per-file boundary covers the BYTES — the read, ts.createSourceFile, the parseDiagnostics inspection and findBannedConstructs are inside ONE try"
  - "PROCESS_BOUNDARY_MARKER — the reason `main`'s outer boundary writes, distinct from every per-file could-not-run reason"
  - "MainDependencies — the injected-dependency record that makes the process boundary REACHABLE by a case; every field defaults to the real function"
  - "deriveSpecPaths's directory walk de-recursed into an explicit worklist (the second self-recursion CR-15 named)"
  - "PATHOLOGICAL_INPUT_SHAPES — the corpus's coverage as a published, two-sidedly-bound set of 6 shapes"
  - "MEASUREMENT_BRANCH_STREAMS — the four reportMeasured branches with the stream each writes to and the code it returns, READ OFF that function"
  - "emitLoudSkipIfBrowserUnusable takes the caller's writer (PROBE 1's finding: the one position that wrote around main's output seam)"
affects:
  - scripts/runnable-ref/uat-spec-integrity.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - agent-factory/checklists/browser-uat-recipe.md
tech-stack:
  added: []
  patterns:
    - "a boundary is about WHICH WORK it encloses, not about which function it happens to wrap"
    - "hold the exit contract at BOTH the per-item and the per-process edge; 1 is a claim about the items, 2 is 'no claim was made'"
    - "de-recurse the CLASS, not the call the review reproduced"
    - "publish the branch/stream table by READING it off the mechanism; a requirement that would force the mechanism to move is a requirement to rewrite"
    - "a boundary nobody can reach is a boundary nobody has tested — inject the dependency, default it to the real one"
    - "a depth measured in a CHILD PROCESS is not a depth measured in THIS THREAD; derive the premise where you will consume it"
key-files:
  created: []
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-28: the {0,1,2} contract is held at TWO decided boundaries and nowhere else. (1) EVERYTHING done with a spec's bytes is inside one per-file could-not-run boundary, with deriveSpecPaths's directory walk de-recursed in the same edit so the fix covers the CLASS. (2) main's whole body is inside one process boundary that names the fault on stderr and returns 2 — 2 rather than 1 because 1 is a claim about the specs and a runnable that could not complete has made none; the try returns what the body returns. (3) The reached-measurement requirement is 'the measurement reaches the stream ITS BRANCH writes to', published as MEASUREMENT_BRANCH_STREAMS and READ OFF reportMeasured, which stays BYTE-UNCHANGED."
  - "PROBE 1's finding, fixed in this plan: emitLoudSkipIfBrowserUnusable wrote to process.stderr directly — the one position in main's body that bypassed main's own output seam, invisible to a probe that captured every other exit. It now takes the caller's writer, defaulting to the writer it always used."
  - "The corpus is generated at RUN TIME and removed in a finally: a 1,000-deep nesting, an invalid-UTF-8 file or a binary file committed under the fixtures directory would be type-checked by tsconfig.fixtures.json and would turn a different gate red for a reason unrelated to the ban."
patterns-established:
  - "Pattern: derive the exit sites by PARSING the module (2 + 7 + 4 = 13) and assert the driven count equals the derived one — a branch nobody reached is a branch nobody has tested"
  - "Pattern: a corpus shape declares its expected branch, stream and exit code UP FRONT; a shape whose measured branch differs fails the case rather than being re-declared to match"
  - "Pattern: assert at least one shape on each stream, so a stream expectation cannot be trivially satisfied by expecting one stream everywhere"
requirements-completed: [UATX-06]
coverage:
  - id: D1
    description: "CR-15 closed — the parse, the diagnostics read and the walk are inside ONE per-file could-not-run boundary, so a pathological parse input exits 2 with a measurement instead of exiting 1 with an empty stdout"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 2: the highest finishing depth passes on stdout; the next depth floors on stderr"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/31-25-probe at depths 500/630/631/1000/2000/5000 (pre-fix depth 1000: EXIT=1, stdout 0 B, RangeError, no measurement on either stream -> post-fix: EXIT=2, could-not-run reason naming the file, vacuity floor on stderr)"
        status: pass
      - kind: command
        ref: "mutation proof MUTANT 1 (the parse moved back outside the per-file try) — breaks 4 cases: GREEN 1, GREEN 1b, GREEN 2, ORDERING"
        status: pass
    human_judgment: false
  - id: D2
    description: "The process boundary — main's whole body inside one try that names the fault on stderr and returns 2, driven at three fault positions and asserted transparent for a legitimate 0 and 1"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 3a/3b/3c: a fault before, inside and after analyzeSpecs each exits 2 with a named reason"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 3d: the process boundary returns the body's own value for a legitimate 0 and 1"
        status: pass
      - kind: command
        ref: "mutation proof MUTANT 2 (the outer main try removed) — breaks 3 cases: GREEN 3a, 3b, 3c, and nothing else"
        status: pass
    human_judgment: false
  - id: D3
    description: "The directory walk de-recursed — the CLASS covered rather than the one call CR-15 reproduced; the remaining self-recursion set is DERIVED by a parse and has a stated disposition"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 4: a directory tree as deep as this platform permits is derived without a throw"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#PROBE 4: every remaining self-recursion in the module has a stated disposition"
        status: pass
    human_judgment: false
  - id: D4
    description: "The exit partition asserted over a published, two-sidedly-bound corpus of 6 pathological shapes — exit code AND the measurement reaching its branch's stream, with 3 shapes on stdout and 3 on stderr"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#Test 1: every shape exits inside {0,1,2} with its measurement on its branch's stream"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#Test 7: PATHOLOGICAL_INPUT_SHAPES is non-empty and every member is driven by a case"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#Test 8b: MEASUREMENT_BRANCH_STREAMS equals what reportMeasured actually does, in both directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#Test 9: every probe root the corpus creates is removed"
        status: pass
    human_judgment: false
  - id: D5
    description: "The recipe's exit-code paragraph names the two boundaries, discloses the non-unwinding fault as the residual, and its shape list is bound to PATHOLOGICAL_INPUT_SHAPES in both directions with a live seeded-fail control"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#Test 8: the recipe's shape list equals PATHOLOGICAL_INPUT_SHAPES in BOTH directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#SEEDED FAIL: a shape removed from the recipe list is caught"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the paragraph names the two boundaries and DISCLOSES what sits outside them"
        status: pass
    human_judgment: false
  - id: D6
    description: "WR-19's own closure re-measured intact, and the two loud skips, the ordinary path and the empty spec unmoved"
    requirement: UATX-06
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL 1: the 4,000-link call chain still reports `0 findings over 1/1`, exit 0, stderr empty"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL 2 / CONTROL 3 / EMPTY"
        status: pass
      - kind: command
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 62 test files, 3908 passed, 2 skipped"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-28 appended to 31-CONTEXT.md in the recorded form of D-21/D-27 and mirrored into the module's D-21 header block, with the 'what D-28 does NOT establish' residuals named"
    requirement: UATX-06
    verification:
      - kind: command
        ref: "grep -c '^#### Gap-closure decision — D-' 31-CONTEXT.md: 11 before, 12 after; git diff 1bedf3f..HEAD shows 92 insertions and 0 deletions"
        status: pass
    human_judgment: false

actuals:
  tokens: 26900
  tasks: 3
  commits: 6
  plan_head_before: 1bedf3fd2fa1f75cc04a96e02bdcd8aa3acd52b7

duration: 47 min
completed: 2026-09-10
---

# Phase 31 Plan 25: Every Exit Passes Through One Decided Boundary Summary

**CR-15 closed: `ts.createSourceFile` moved inside the per-file could-not-run boundary and `main`'s whole body inside a process boundary, so a 1,000-deep nesting now exits 2 with the vacuity floor on stderr instead of exiting 1 with an uncaught `RangeError` and no measurement on either stream — with the directory walk de-recursed, the partition asserted over a published six-shape corpus, and `reportMeasured` byte-unchanged.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-10T02:00Z
- **Completed:** 2026-09-10T02:47Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- **CR-15 closed at the register that failed.** Not the bound's value and not its unit — both of which D-21 (1) fixed — but WHICH WORK THE BOUNDARY ENCLOSES. One `try` in `analyzeSpecs` now encloses the read, `ts.createSourceFile`, the `parseDiagnostics` inspection and `findBannedConstructs`.
- **The contract is held at the PROCESS edge too.** `main`'s body sits inside one boundary that writes `PROCESS_BOUNDARY_MARKER` to stderr and returns 2, and returns the body's own value otherwise.
- **The CLASS, not the call.** `deriveSpecPaths`'s self-recursive directory walk — the second unguarded self-recursion CR-15 named — is an explicit worklist. A parse of the module now finds exactly ONE self-recursion left (`calleeDottedPath`), with a stated disposition.
- **The partition is asserted over a published set,** not over the one depth a reviewer tried: six shapes, generated at run time, bound to the recipe in both directions with a live seeded-fail control.
- **A probe found a real defect in this plan's own fix and it was fixed here** — `emitLoudSkipIfBrowserUnusable` wrote around `main`'s output seam.

## Task Commits

1. **Task 1 RED** — `37cbdef` (test) — CR-15 reproduced on this tree; 8 cases fail
2. **Task 1 GREEN** — `94b97a6` (fix) — both boundaries + the de-recursed walk, `.ts` and rebuilt `.js`
3. **Task 2 RED** — `7987fb7` (test) — the published set, the branch table and the recipe binding; 6 cases fail
4. **Task 2 GREEN** — `84965bd` (feat) — the two exported registers, the corrected recipe paragraph, D-28
5. **Task 3** — `bf8d3b0` (test) — the six standing probes, and the two defects they found

**Plan metadata:** the `docs(31-25)` commit that carries this SUMMARY, STATE.md and ROADMAP.md.

## Task 1 — CR-15: the depth table, pre-fix beside post-fix

Measured against the committed `scripts/runnable-ref/uat-spec-integrity.js`, from the single probe root `.temp/31-25-probe/` with the spec at `uat/p.uat.spec.ts`. The construct is the review's own: `const x: any = ((((…1…))));`.

| depth | PRE-FIX (at `1bedf3f`) | POST-FIX (at `94b97a6`) |
|---|---|---|
| 500 | EXIT=0 · stdout 57 B `UAT spec integrity: 0 findings over 1/1 uat specs checked` · stderr 0 B | EXIT=0 · identical |
| **630** (highest that parses) | EXIT=0 · the same pass line on STDOUT · stderr empty | EXIT=0 · identical |
| **631** (lowest that does not) | EXIT=1 · stdout 0 B · stderr `RangeError: Maximum call stack size exceeded` · **no measurement on either stream** | EXIT=2 · stdout **0 B** · stderr `The UAT spec uat/p.uat.spec.ts could not be analysed (Maximum call stack size exceeded); the check was NOT performed for that file, …` then `UAT spec integrity: ZERO uat specs were visited (1 derived) — this check was NOT performed.` |
| 1000 | EXIT=1 · stdout 0 B · stderr 1474 B, first line `…/node_modules/typescript/lib/typescript.js:33775`, `grep -c 'uat specs'` → **0** | EXIT=2 · stdout 0 B · stderr 324 B, `grep -c 'uat specs'` → **1** |
| 2000 | EXIT=1 · identical to 1000 | EXIT=2 · identical to 1000 |
| 5000 | EXIT=1 · identical to 1000 | EXIT=2 · identical to 1000 |

The pre-fix depth-1000 cell **matches `31-VERIFICATION.md` behavioral spot-check row 12 exactly**: uncaught `RangeError` at the TypeScript parser's `token()`, EXIT=1, stdout empty, no measurement.

**The post-fix stdout is EMPTY, and that is branch (1)'s CORRECT output, not the unfixed defect.** `reportMeasured`'s own source says so:

```ts
  // (1) VACUITY FLOOR — element level. A zero-element run can never print a pass line.
  if (m.visited === 0) {
    err(
      `UAT spec integrity: ZERO uat specs were visited (${m.expected} derived) — this check was NOT ` +
        `performed. A pass line here would state a check that did not run.\n`,
    );
    return 2;
  }
```

`err(...)`, not `out(...)`. A later reader must not read the empty stdout as CR-15 unfixed.

### GREEN 1b — the DENOMINATOR floor is a different branch, and it is reached too

The same pathological spec ALONGSIDE one clean spec: **EXIT=2**, stdout empty, stderr carrying `UAT spec integrity: visited 1 of 2 derived uat specs — the scan set is short, so the result covers less than it claims.` The two floors are different branches, with different messages, both reached, both loud.

### The adjacency pair, DISCOVERED rather than hard-coded

`630` parses (EXIT=0, pass line on STDOUT); `631` does not (EXIT=2, vacuity floor on STDERR). Both recorded as numbers. The suite does not hard-code them: the pair is bisected through the committed `.js`, whose two decided outcomes are the bisection predicate, so the corpus asserts something on a host with a different stack size instead of going quietly green.

### `reportMeasured` is BYTE-UNCHANGED

AST-extracted from both revisions and hashed:

```
1bedf3fd  1535 bytes  sha256 e44820eb8e15fcc4
HEAD      1535 bytes  sha256 e44820eb8e15fcc4
```

No hunk touches its body. The `scripts/vacuity.ts` mirror D-21 established was not re-authored. An earlier draft of this plan required a `visited/expected` line on STDOUT for every could-not-run shape; that requirement is unsatisfiable without moving a floor's output, so **the requirement was rewritten, not the mechanism**.

### GREEN 3, GREEN 4, and the controls

- **GREEN 3** is driven at three positions OUTSIDE `analyzeSpecs` — in the spec derivation, in the analysis, and inside `reportMeasured` itself — each exiting 2 with `PROCESS_BOUNDARY_MARKER` and an empty stdout. The `reportMeasured` position is the ONE shape for which the measurement requirement is vacuous by construction (the function that writes every measurement is the one that threw), and the case says so and asserts the named reason instead.
- **GREEN 3d** asserts the boundary is transparent: a clean run still returns 0 and a real finding still returns 1.
- **GREEN 4** derives a directory tree at the deepest level this platform permits — **476 levels**, where `mkdir` stops with `ENAMETOOLONG` at a 1015-byte path — with no throw and the derived set exactly `[<deep>/deep.uat.spec.ts]`. The residual is MEASURED rather than assumed: a like-for-like self-recursive frame overflows at **~8,075**, so `476 < 8,075` and the OLD recursive walk was **not reachable to exhaustion on this platform**. The de-recursion covers the class; it does not close a reachable input here, and the case says which.
- **CONTROL 1** re-measures WR-19's own closure: the 4,000-link chain → `0 findings over 1/1 uat specs checked`, EXIT=0, stderr empty — matching `31-17-SUMMARY.md`.
- **CONTROL 2**: `PARSER_ABSENT_MARKER` (`SKIPPED: the target repository does not provide a TypeScript parser…`) and `BROWSER_ABSENT_MARKER` (`SKIPPED: no usable browser lane — UAT…`) each emit exactly ONCE at exit 2, and neither carries the per-file wording `the check was NOT performed for that file`, so a reader can tell a loud skip from a could-not-run.
- **CONTROL 3 / EMPTY**: a clean spec exits 0 and a real finding exits 1, each with its measurement; a zero-byte spec contributes `visited` **1**, not 0 — a file that was checked, not one that could not be.
- **ORDERING** is a named case: the per-file reason precedes `reportMeasured`'s output on stderr for a floor run, and precedes the denominator floor for a mixed run.

### Mutation proofs (MOVEMENT 5)

Each mutant was applied to the `.ts`, rebuilt, and **the rebuilt `.js` was grepped for the mutant's own marker before any result was read** — the discipline `31-24-SUMMARY.md` established after a non-compiling mutant was measured as passing.

| # | mutant | cases broken | which |
|---|---|---|---|
| 1 | the parse moved back OUTSIDE the per-file `try` | **4** | GREEN 1, GREEN 1b, GREEN 2, ORDERING |
| 2 | the outer `main` `try` removed | **3** | GREEN 3a, GREEN 3b, GREEN 3c — and nothing else |

Both reverted; the rebuilt `.js` carries zero `MUTANT_` markers and the block is green again.

`npm run build` output count is unchanged at **60 committed `.js` files** — no new module was added.

## Task 2 — the corpus, the published sets, and the corrected recipe

`PATHOLOGICAL_INPUT_SHAPES` is exported, frozen, and its cardinality is **6**. `MEASUREMENT_BRANCH_STREAMS` is exported, frozen, and maps all **4** `reportMeasured` branches.

### The branch table, READ OFF the mechanism

| branch | published stream | published exit | `reportMeasured`'s own line |
|---|---|---|---|
| `vacuity_floor` | stderr | 2 | `err(...); return 2;` — `ZERO uat specs were visited (N derived)` |
| `denominator_floor` | stderr | 2 | `err(...); return 2;` — `visited V of E derived uat specs` |
| `findings` | stdout | 1 | `out(...); return 1;` — `N finding(s) over V/E uat specs checked` |
| `pass` | stdout | 0 | `out(...); return 0;` — `0 findings over V/E uat specs checked` |

Test 8b does not read this off the source text: it DRIVES all four branches, observes which stream each wrote to and what it returned, and asserts the published table equals the observation in both directions — so moving a floor's output moves this table and turns the corpus red rather than silently disagreeing with it. Two branches write to stdout and two to stderr, asserted as counts.

### The shape × branch × stream table, measured

| shape | declared branch | expected stream | exit | measured stream | measured text |
|---|---|---|---|---|---|
| a nesting depth the parser cannot finish | `vacuity_floor` | stderr | 2 | stderr | `ZERO uat specs were visited (1 derived) …` |
| the adjacent nesting depth the parser does finish | `pass` | stdout | 0 | stdout | `0 findings over 1/1 uat specs checked` |
| a spec far larger than any ordinary one | `pass` | stdout | 0 | stdout | `0 findings over 1/1 uat specs checked` |
| a spec carrying invalid UTF-8 byte sequences | `vacuity_floor` | stderr | 2 | stderr | `ZERO uat specs were visited (1 derived) …` |
| a spec opening with a byte-order mark | `pass` | stdout | 0 | stdout | `0 findings over 1/1 uat specs checked` |
| a spec whose bytes are binary | `vacuity_floor` | stderr | 2 | stderr | `ZERO uat specs were visited (1 derived) …` |

Every declared/measured pair agrees. **3 shapes land on a STDOUT branch and 3 on a STDERR branch**, so the stream assertion is proven not to be trivially satisfiable by expecting one stream everywhere. The BOM case additionally asserts `visited` is **1**, not 0 — a BOM is a checked file. Test 9 asserts the probe parent directory is empty after the corpus run.

### The corrected recipe paragraph, verbatim

```markdown
The three codes are held by decision at TWO boundaries, and nowhere else.

- **Per file.** Everything the checker does with a spec's bytes — the read, the parse, the
  parse-diagnostics inspection and the walk over the syntax tree — is inside one could-not-run
  boundary. A file the parser cannot finish is a file the checker did not check, so it is named on
  stderr and it does not count towards the visited total.
- **Per process.** The runnable's whole body is inside one boundary that names the fault on stderr
  and returns 2. A legitimate 0 and a legitimate 1 pass through it untouched; only a throw becomes 2.
  The code is 2 rather than 1 because 1 means "a finding", which is a claim about the specs, and a
  runnable that could not complete has made no claim about them.

What remains outside every boundary is a fault that terminates the process without unwinding — an
out-of-memory kill, or a signal. No `try` catches those, and the checker claims nothing about them.
Whether the Windows leg of this behaviour matches the POSIX one is an open `UNKNOWN - verify`.
```

The false absolute 31-17 added — "including a pathological one: it does not exit through an uncaught exception" — is **gone**, asserted by a case. The shape list that follows is bound to `PATHOLOGICAL_INPUT_SHAPES` in both directions, and the seeded-fail control (a shape deleted from the recipe copy) still discriminates.

### D-28

`grep -c '^#### Gap-closure decision — D-' .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`: **11 before, 12 after** — differs by exactly one. `git diff 1bedf3f..HEAD` on that file: **92 insertions, 0 deletions** (additions only, range pinned to this plan's base commit).

The decision text agrees in three places:

| where | what it says |
|---|---|
| `31-CONTEXT.md` § D-28 | the full recorded form: forced-by, the measured depth table, which register failed, the three sub-decisions, "What D-28 does NOT establish", `Reversibility: costly` |
| `uat-spec-integrity.ts` D-21 header block + the `analyzeSpecs` / `main` docstrings | the same three sub-decisions at the sites they govern, with the non-unwinding residual named |
| this SUMMARY's `key-decisions` | the same three sub-decisions in one paragraph |

## Task 3 — the six standing probes

| probe | verdict | what it measured |
|---|---|---|
| 1 — how is the boundary REACHED | **PASS, after a fix** | derived 13 exit sites, drove 13 |
| 2 — derive BOTH axes | **PASS, after a harness fix** | three fault positions, the counters, the stream split |
| 3 — what is the predicate's input assembled from | **PASS, after a harness fix** | three simultaneous-condition pairs |
| 4 — at which positions is the predicate even asked | **PASS** | one self-recursion left, with a disposition |
| 5 — assert the harness's own premise | **PASS** | 6 of 6 corpus cases carry a premise assertion |
| 6 — re-derive the pre-existing mutation set | **PASS** | 7 mutants, none broke fewer cases |

### PROBE 1 — the derived exit sites equal the driven ones · **PASS (found 1 defect, FIXED here)**

Command: `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts -t "PROBE 1"`.

The branch set is DERIVED by parsing the module with the host TypeScript, counting `return` statements OF each named function declaration (not of the closures inside it):

```
main returns: 2   runMain returns: 7   reportMeasured returns: 4     derived = 13
```

All 13 driven, each landing inside `{0,1,2}`: the body's own value (0) and the process boundary (2); no root arg (2), root not a directory (2), the browser lane unusable (2), a containment refusal (2), an empty derived set (2), the parser absent (2), the measured report (1); and the four `reportMeasured` branches (2, 2, 1, 0). **Driven count 13 = derived count 13.**

**Defect found.** The "browser lane unusable" site produced *nothing on either injected stream*. `emitLoudSkipIfBrowserUnusable` called `process.stderr.write` directly — the one position in `main`'s body that wrote around `main`'s own output seam. A probe that captured every other exit could not see it, and a seam with one hole cannot answer "which stream did this branch write to" for the branch it does not cover. **Fixed in this plan:** the function takes the caller's writer, defaulting to the writer it always used, so the CLI's bytes are unchanged. Re-probed: PASS.

### PROBE 2 — derive BOTH axes · **PASS (found 1 false harness premise, FIXED here)**

**(a) WHERE the boundary sits.** A fault forced at each of three positions:

| forced fault position | exit | stdout | stderr |
|---|---|---|---|
| BEFORE `analyzeSpecs` (in `deriveSpecPaths`) | 2 | empty | `PROCESS_BOUNDARY_MARKER` + `axis-a before` |
| INSIDE `analyzeSpecs` | 2 | empty | `PROCESS_BOUNDARY_MARKER` + `axis-a inside` |
| AFTER it (in `reportMeasured`) | 2 | empty | `PROCESS_BOUNDARY_MARKER` + `axis-a after` |

**(b) WHAT the boundary does to the COUNTERS.** With one pathological and one clean spec: `expected` = **2** (derived before the loop, unmoved by the boundary), `visited` = **1** (the caught file contributes nothing), `errors` = 1, naming the caught file.

> **A FALSE HARNESS PREMISE, found and fixed.** The first draft of (b) used the depth bisected through a CHILD PROCESS for an IN-PROCESS parse. A vitest worker thread runs with a different stack size, so the parse succeeded, `visited` came back **2**, and the case read as a defect in the boundary rather than a false premise in the harness. The depth is now discovered in process, where it is consumed. This is the **ninth** logged instance of a verification harness producing a false result about its own premise on this project.

**(c) THE STREAM SPLIT AS THE MECHANISM DEFINES IT.** Every branch wrote to the stream `MEASUREMENT_BRANCH_STREAMS` records for it and to no other; every per-file could-not-run reason reached stderr with stdout empty. The probe deliberately does NOT assert "every measurement reaches stdout" — that is false of branches (1) and (2) by design.

### PROBE 3 — what the exit code is assembled from · **PASS (found 2 hand-typed literals, FIXED here)**

| pair driven simultaneously | winning answer | decided? |
|---|---|---|
| a pathological spec + an absent parser | the parser loud skip, exit 2; the per-file boundary is never reached | **decided** — the parser load precedes `analyzeSpecs` in `main`'s stated order |
| a pathological spec + an empty derived set (the spec outside the `uat` segment) | the vacuity floor at `0 derived`, exit 2; the spec is never parsed | **decided** — an empty derived set is answered before the parser is needed |
| a browser-absent condition + a pathological spec | the D-15 loud skip, exit 2; nothing is said about spec contents | **decided** — `main`'s own comment: saying anything about contents when the lane cannot run them invites a reader to treat a checked spec as an exercised one |

The probe's first draft hand-typed both marker strings and disagreed with the shipped constants; it now reads `PARSER_ABSENT_MARKER` and `BROWSER_ABSENT_MARKER` off the module.

### PROBE 4 — at which positions is the predicate even asked · **PASS**

The set of self-recursive functions is DERIVED by parsing the module (a named function whose body contains a call to its own name), then partitioned against a disposition register in both directions:

| function | line | disposition |
|---|---|---|
| `calleeDottedPath` | 1146 | D-21 (1): bounded by ONE shared `CalleeStepBudget` threaded through the recursion and charged explicitly on the call link, AND called only from inside the per-file could-not-run boundary — an exhausted stack is a named could-not-run reason at exit 2, never an escaping throw |

Derived count **1**. `forEachDescendant` (de-recursed by D-21 (1)) and `deriveSpecPaths`'s `walk` (de-recursed by D-28 (1)) are both asserted ABSENT from the derived set. A function that starts calling itself lands outside the register and turns the case red naming itself.

Byte-touching positions outside the per-file boundary, each with a stated disposition:

| position | throw disposition | exit |
|---|---|---|
| `deriveSpecPaths` — `readdirSync` / `realpathSync` / `statSync` | each already a REFUSAL inside the function; anything it cannot answer escapes to the process boundary, driven rather than assumed | 2 |
| `loadTypeScriptFromTarget` — resolving `typescript` from the target | fail-closed by its own `catch` → `PARSER_ABSENT_MARKER` | 2 |
| `realBrowserProbe` — resolving `@playwright/test`, spawning the CLI, reading the browsers directory | fail-closed by its own `catch` ("an inconclusive probe skips, it never greens") | 2 |
| `defaultReadFile` — `readFileSync` on a spec | inside the per-file boundary's first `try` → a could-not-run reason | 2 |

No enumerated position can throw past every boundary.

### PROBE 5 — assert the harness's own premise · **PASS**

Every corpus case, before its conclusion, asserts (i) the generated spec is on disk at its generated byte length and (ii) the probe root derives exactly ONE spec — a corpus whose specs were never written would satisfy the partition vacuously at `0/0`. **6 cases carry the premise assertions; the corpus size is 6.** Equal.

### PROBE 6 — the mutation set, RE-DERIVED · **PASS**

Every mutant applied to the `.ts`, rebuilt, its own marker asserted present in the rebuilt `.js`, measured against `uat-spec-integrity.test.ts`, then reverted.

| mutant | recorded then | measured now | verdict |
|---|---|---|---|
| A (31-17) — the recursive descent starts a FRESH allowance | 4 (31-17), 4 (31-24) | **5** | up |
| B (31-17) — `forEachDescendant` restored to a self-recursive walk | 3, 3 | **4** | up |
| C (31-17) — the declared census emptied | 11, 33 | **33** | unmoved |
| D (31-17) — the fixture-binding exemption forced false | 8, 15 | **15** | unmoved |
| 1b (31-24) — the true pre-D-27 rule (containment removed AND the fixture position omitted) | 23 | **23** | unmoved |
| 2 (31-24) — "does SOME containing binding suppress?" instead of innermost | 5 | **5** | unmoved |
| 3 (31-24) — the exemption widened back to index 1 of ANY function-like | 2 | **5** | up |

**No pre-existing mutant breaks fewer cases than `31-17-SUMMARY.md` or `31-24-SUMMARY.md` recorded.** A and B rise because this plan's own boundary cases sit downstream of both; 3 rises for the same reason.

> Two mutants (D and 31-24's 3) failed to compile on their first draft (TS6133 — `ts` became unused). Both were caught by the build's exit code, never measured, and re-authored with `void ts;`. A mutation proof that measures a stale artifact is a false proof.

### Did any probe find a defect?

**Yes — three, all FIXED in this plan and re-probed:** the browser loud skip bypassing `main`'s output seam (PROBE 1, a production fix); the child-derived overflow depth used for an in-process parse (PROBE 2 (b), a harness fix); and two hand-typed marker literals in the probe itself (PROBE 3, a harness fix). All six probes ran.

### Residue

```
test ! -e .temp/31-25-probe                                    -> absent
find . -path ./node_modules -prune -o -type p -print           -> (nothing)
git status --short                                             -> only the four PRE-EXISTING
                                                                  non-plan entries
```

`git status --short .temp` is deliberately NOT the check: `.temp/` is gitignored at `.gitignore:19`, so it can never fail.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` — the per-file boundary over the bytes; `main`'s process boundary + `PROCESS_BOUNDARY_MARKER` + `MainDependencies` + `runMain`; the de-recursed directory walk; `PATHOLOGICAL_INPUT_SHAPES`; `MEASUREMENT_BRANCH_STREAMS`; `emitLoudSkipIfBrowserUnusable`'s injected writer; the D-28 header paragraph
- `scripts/runnable-ref/uat-spec-integrity.js` — the rebuilt artifact, committed with its source; freshness 60/60
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — the CR-15 boundary block (13 cases), the D-28 corpus block (7 cases), the recipe-binding block (3 cases) and the PROBE block (6 cases); the shared 31-25 helpers hoisted to file scope so the adjacency bisection has ONE authority
- `agent-factory/checklists/browser-uat-recipe.md` — the corrected exit-code paragraph, the two boundaries, the disclosed non-unwinding residual, the bound shape list
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-28 appended (92 lines, additions only)

## Decisions Made

- **D-28**, as recorded above and in `31-CONTEXT.md`.
- **`MainDependencies` is a production seam, justified the same way `analyzeSpecs`'s injectable `readFile` already is.** Without it the process boundary is unreachable by any case, and "a boundary nobody can reach is a boundary nobody has tested" is this module's own stated rule. Every field defaults to the real function.
- **The 31-25 helpers were hoisted to test-file scope rather than duplicated.** A second copy of the adjacency bisection would be a second authority for the same number.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The browser loud skip wrote around `main`'s output seam**
- **Found during:** Task 3, PROBE 1
- **Issue:** `emitLoudSkipIfBrowserUnusable` called `process.stderr.write` directly, so the one branch of `main`'s body it owns was invisible to any caller-provided writer. A seam with one hole cannot answer "which stream did this branch write to" for the branch it does not cover.
- **Fix:** the function takes the caller's writer as a third parameter, defaulting to the writer it always used; `main` passes its own `err`.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`, `.js`
- **Verification:** PROBE 1 drives the browser-unusable site through an injected sink and finds `BROWSER_ABSENT_MARKER`; CONTROL 2 confirms the CLI still emits it exactly once at exit 2.
- **Committed in:** `bf8d3b0`

**2. [Rule 1 - Bug] The GREEN 1 escape assertion asserted the absence of the diagnostic**
- **Found during:** Task 1, first GREEN run
- **Issue:** the case asserted `stderr` does NOT contain `Maximum call stack size exceeded`. The correct mechanism NAMES the cause in its could-not-run reason — that is what makes the four reasons distinguishable — so a correct mechanism failed a wrong assertion.
- **Fix:** the case now asserts the cause IS named, and that no stack FRAME (`^\s+at …:N:N`) escaped, which is what "decided refusal" means as distinct from "crash".
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** GREEN 1 green; MUTANT 1 still breaks it.
- **Committed in:** `94b97a6`

**3. [Rule 3 - Blocking] The GREEN 4 harness planted its spec at a path longer than the platform permits**
- **Found during:** Task 1 RED
- **Issue:** the deepest MKDIR-able directory plus a 16-character file name exceeds `PATH_MAX`; `writeFileSync` threw `ENAMETOOLONG` inside the harness and read as a checker defect.
- **Fix:** the case steps back one directory level at a time until the spec can be written, and asserts the resulting depth is greater than 1 so the case cannot go vacuous.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** GREEN 4 green at 476 levels.
- **Committed in:** `37cbdef`

**4. [Rule 1 - Bug] PROBE 2 (b) consumed a child-process measurement in-process**
- **Found during:** Task 3, PROBE 2
- **Issue:** described in full under PROBE 2 above — the ninth logged instance of a harness producing a false result about its own premise.
- **Fix:** the overflow depth is discovered in the thread that will consume it.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Committed in:** `bf8d3b0`

**5. [Rule 1 - Bug] PROBE 3 hand-typed two marker literals**
- **Found during:** Task 3, PROBE 3
- **Issue:** the probe asserted prose that disagreed with the shipped `PARSER_ABSENT_MARKER` / `BROWSER_ABSENT_MARKER`.
- **Fix:** it reads the published constants.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Committed in:** `bf8d3b0`

### Plan-text deviations

- **The plan's line citations were stale.** `31-24` moved `analyzeSpecs` from `~1605` to `~1963` and `reportMeasured` from `:1657-1670` to `:2029`. Every anchor was re-derived from the current source; the mechanisms named are the same ones.
- **`main` gained an injected-dependency record**, which the plan's MOVEMENT 3 did not name. It is what makes GREEN 3 and PROBE 2 (a) drivable at all; without it the process boundary would have been asserted only by inspection.
- **GREEN 4 could not be RED.** The old recursive walk was not reachable to exhaustion on this platform (476 vs ~8,075, measured). It is recorded as a control with its residual stated, not as a closure of a reachable input.

---

**Total deviations:** 5 auto-fixed (4 bugs, 1 blocking) + 3 recorded plan-text deviations
**Impact on plan:** one production fix (the output seam) found by this plan's own probes and closed inside it; the rest are harness corrections that make the assertions mean what they claim. No scope creep.

## Issues Encountered

- Two mutants failed to compile on their first draft (TS6133) and were caught by the build's exit code plus the marker grep before any result was read. Recorded because a mutation proof that measures a stale artifact is a false proof, and 31-24 recorded the same near-miss.
- `git commit -m` with a backtick-quoted identifier in the body was shell-expanded, dropping a word from the Task 3 message. Amended with `-F` from a file. Recorded so a later reader does not read `bf8d3b0`'s amend as a rewrite of content.

## Verification

| check | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 test files passed, 3908 passed, 2 skipped** |
| `npm run build && npm run typecheck` | clean |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `npm run check:build-parity` | clean at HEAD |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `test ! -e .temp/31-25-probe` · FIFO sweep · `git status --short` | absent · nothing · only the four pre-existing non-plan entries |
| `package.json` | byte-unchanged since the round base (`git diff --stat` empty) |

## Next Phase Readiness

- CR-15 is closed at the mechanism and the recipe agrees with it. `31-26` is the last plan of round 5.
- **UATX-06 is NOT flipped to Complete in `REQUIREMENTS.md`.** `ROADMAP.md` reserves that flip for a verification round, and `31-24` recorded the same. `requirements.ready-ids` blocks it anyway while `31-26` still declares it without a SUMMARY.
- **Residuals this plan leaves, named:** a fault that terminates the process without unwinding (out-of-memory, a signal) is outside both boundaries; the Windows leg is an open `UNKNOWN - verify`; and the de-recursed directory walk covers the class without closing a reachable input on this platform.

## Self-Check: PASSED

Files claimed as modified, verified present on disk:

```
FOUND: scripts/runnable-ref/uat-spec-integrity.ts
FOUND: scripts/runnable-ref/uat-spec-integrity.js
FOUND: scripts/runnable-ref/uat-spec-integrity.test.ts
FOUND: agent-factory/checklists/browser-uat-recipe.md
FOUND: .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
```

Commits claimed, verified in `git log`:

```
FOUND commit: 37cbdef   FOUND commit: 94b97a6   FOUND commit: 7987fb7
FOUND commit: 84965bd   FOUND commit: bf8d3b0
```

The three new exports are present in the COMMITTED `.js` (5 occurrences of
`PATHOLOGICAL_INPUT_SHAPES` / `MEASUREMENT_BRANCH_STREAMS` / `PROCESS_BOUNDARY_MARKER`), and
`git rev-list --count 1bedf3fd..HEAD` measured **5** production commits at SUMMARY-write time; the
frontmatter records **6**, which includes the metadata commit that carries this file.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-10*
