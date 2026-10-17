---
phase: 33-live-capture-windows-portability
plan: 35
subsystem: prod-deploy / protected-branch guard (command model)
status: complete
tags: [safety, guard, cr-01, gap-closure, round-4, tracer]
requires: ["33-34"]
provides:
  - "governedToolsNamedBy re-projects each name piece's shell-resolved text as nested shell text (D-33-R4-03)"
  - "scripts/fixtures/cr01-nested-corpus.json: the 33-R4 nested corpus and the four nested families"
affects: ["33-36 (npm unique-prefix, xargs, the one docblock rewrite)", "33-43 (residual and handed-off ledger rows)", "33-40 (CI run over this plan's modules)"]
tech-stack:
  added: []
  patterns:
    - "recursive projection: lex, name, then re-project each significant piece, bounded by depth and a work budget, fail-closed beyond either"
    - "an expansion re-projects as a private-use sentinel that lexNames reads as an expansion again"
    - "a gap is read both as empty (whole piece, gap as [^/]*) and as a word boundary (every contiguous gap-delimited run)"
    - "a labelled JSON corpus fixture read by both test files; families are templates expanded over COMMAND_CHECKPOINT_RULES x CR01_SPLICES"
key-files:
  created:
    - scripts/fixtures/cr01-nested-corpus.json
  modified:
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - hooks/guard.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - .planning/STATE.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
decisions:
  - "D-33-R4-01 (human, 2026-09-23): round-4 guard scope is cheap two plus ledger. Recorded in STATE.md before any code."
  - "D-33-R4-03 (planner, 2026-09-23): the CR-01 class is closed in the one projection governedToolsNamedBy, for both arms, by recursive re-projection. Recorded in STATE.md before any code."
  - "The gap's two readings are carried by a sentinel plus a contiguous-run name reading, not by enumerating 2^n texts. Enumeration grows exponentially with the gap count."
  - "The one-authority assertion for the quoted '=kubectl' now expects kubectl. Under zsh eval that spelling runs (corpus row R4-13)."
metrics:
  duration: "29 min"
  completed: "2026-09-23"
  tasks: 3
  files: 8
estimate:
  tokens: 130000
actuals:
  tokens: 17700
  tasks: 3
  commits: 4
plan_head_before: 53888b9cdea0dda960c04008ea2db09c96ca6175
---

# Phase 33 Plan 35: CR-01 one register over, closed in the one projection

**The guard now reads a quoted governed command the way the nested shell will run it.** `governedToolsNamedBy` lexes each name piece's shell-resolved text again, recursively. The depth bound and a work budget cap the recursion, and past either cap it answers with every governed tool. Both arms ask this one function.

Result: all 28 in-scope rows now deny through `hooks/guard.js` and `hooks/hook-entry.js guard.js`. That is the 10 gap-4 rows plus 18 more rows found beyond the verifier's list. Every one of the 28 ran under bash or zsh with stub binaries, and every one was ALLOW on the round-3 build.

## What was built

- **`projectNames` (scripts/checkpoints.ts):** lexes the text, names every piece, and re-projects each piece that carries a literal a nested shell reads as syntax. The re-projection repeats until the text stops changing. It is bounded by `MAX_PROJECTION_DEPTH` (32) and by a budget of 32 × input length + 65 536 lexed characters. Past either bound, or past `MAX_NAME_VARIANTS` brace alternatives, it returns every governed tool.
- **Gap readings:** an expansion in a re-projected text becomes `GAP_SENTINEL` (U+E000). `lexNames` reads the sentinel as an expansion again, wherever it sits. `namesOfPiece` then reads each gap two ways:
  - **Empty:** the whole piece, with each gap as `[^/]*`. This covers `bash -c 'g\i'$X't push …'`.
  - **Word boundary:** every contiguous gap-delimited run. This covers `bash -c 'echo'$X'g\it push …'` with `X=';'`.
- **No second grammar and no second queue.** The opaque branch of `matchCommandCheckpoints` is unchanged. It already asks `governedToolsNamedBy(seg.raw)`, and that call now answers for the nested body.
- **`hooks/guard.ts` is byte-unchanged:** `git diff --stat 53888b9c -- hooks/guard.ts` is empty. The hook manifest was regenerated, so the decider hash in `hooks/hook-entry.ts` and `.js` changed.

## RED before the fix (quoted)

Task 1 RED ran against the round-3 committed `.js` (`b3acece3`). Command: `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts hooks/guard.test.ts -t "33-R4"`

```
     × hooks/guard.js: the tracer DENIES, both deny controls deny, the allow control allows (scrubbed env)
     × hooks/hook-entry.js guard.js: the tracer DENIES, both deny controls deny, the allow control allows (scrubbed env)
     × the tracer's quoted body names the tool; a quoted echo body names nothing
     × the tracer shape is matched by the command model; its allow control is not
AssertionError: bash -c 'g\it push origin main' $X: expected '' to contain '"permissionDecision":"deny"'
AssertionError: expected [] to deeply equal [ 'git' ]
AssertionError: expected 0 to be greater than 0
 Test Files  2 failed (2)
      Tests  4 failed | 2 passed | 693 skipped (699)
```

The 2 passing tests assert the fixture labels and the gap-4 deny controls. Those controls denied before the fix by definition.

The corpus was also replayed through both entry points, scrubbed environment, on the pre-fix build. All 28 in-scope rows returned `entry=ALLOW guard=ALLOW`. R4-18 was added in the GREEN commit, after the same pre-fix measurement returned ALLOW for it.

## Verification (quoted from the commands)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run build`, `npm run typecheck` | exit 0 |
| `npm run check:build-parity` (after commit) | `ALL CHECKS PASSED` |
| `npm run freshness` | `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.` |
| `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts hooks/guard.test.ts` | `Tests  699 passed (699)` after Task 1; `415 passed` and `311 passed` after Task 2 |
| full regression `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files  78 passed (78)` / `Tests  5746 passed \| 2 skipped (5748)` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `npm run check:nul-bytes` | `ALL CHECKS PASSED` |
| STATE.md longest line (`awk`) | `2524` (below 4000); no D-33-R4 decision line carries a backslash |
| `grep -c 'toBe(' scripts/checkpoints.test.ts` | base 198, now 219 |

`npm test` was never run.

## Proof the fix is load-bearing (Task 2)

- **Derived sweep:** `COMMAND_CHECKPOINT_RULES` × `CR01_SPLICES` × 4 fixture families gives 1640 cases. The test asserts that count equals its derivation and that every case gets its rule's checkpoint. On the round-3 build, 1240 of the 1640 were ALLOW. The two positional-parameter rows (R4-11, R4-12) are asserted separately.
- **Entry-point subset:** each rule contributes one splice (a backslash before its second character) in each family, 15 × 4 = 60 cases, count pinned. All 60 deny through both entry points. On the round-3 model 56 of the 60 were ALLOW. The other 4, `p\npm`, were already caught by the raw-name search.
- **Union floor:** the 153 held-capture Bash inputs and the over-denial floor were compared against the round-3 build, imported from git at `53888b9c`. No checkpoint set shrank, and the floor commands still name nothing. A scratch differential fuzz of 4.26 M random commands also found 0 deny→allow regressions.
- **Non-circularity, mutation 1:** a scratch copy with the re-projection call removed answers every family case exactly as the round-3 build did. All 1240 round-3 ALLOWs are ALLOW again, and all 28 in-scope corpus rows are ALLOW again. The other 400 cases are still caught by the kept raw-name search: splices at the name's edge, such as `\git` and `git''`.
- **Non-circularity, mutation 2:** removing the gap's boundary reading reopens exactly R4-06 and R4-18.
- **Depth bound:** an `eval $'…'` ANSI-C chain names exactly `["git"]` at 20 layers. At 40 layers it fails closed on every governed tool and both checkpoints, in under 5 s.

## For plan 33-36: facts for the single docblock rewrite

- **Closed by this plan:** the 28 in-scope rows of `scripts/fixtures/cr01-nested-corpus.json`, both arms.
  - V4-01..V4-10: the gap-4 `reason` list.
  - R4-01..R4-18:
    - ANSI-C bodies (plain and hex-escaped)
    - an expansion glued before, after, or inside the body
    - an expansion used as a word boundary, in a nested body and at the top level under `eval`
    - the double-quote escape level
    - a double-quoted here-string
    - `eval` word concatenation, with and without an opaque word
    - the positional `$@` and `$0` rows with no splice
    - zsh `eval '=kubectl'`
    - backtick and process-substitution trailing words
    - two nested shells
    - the flag-governed `vercel --prod`
  - These R4 rows need no opaque word: R4-09, R4-11, R4-12, R4-13. So the readable arm had the same hole.
- **Disclosed residual, stays ALLOW (ledger rows are plan 33-43's):**
  - RES-01: `K=git; bash -c "$K push origin main"`, a tool assembled from a shell variable.
  - RES-02: `bash -c "$(printf %s gi t) push origin main"`, a tool produced by a command substitution.
  - The sibling `bash -c 'x=g\it; $x push origin main'` is the same class. It is recorded in `deferred-items.md`.
- **Handed off, pinned ALLOW in the fixture with an owner:**
  - To 33-36: `npm pub` (LB-01) and the three xargs rows (LB-02..04).
  - To 33-43: the dashed `git-core/git-push` (LB-05), `git send-pack` (LB-06), and `gh api …/merge` (LB-07).
  - When the owner closes a row, it flips the row to `kind: deny` in the same commit. The Task 3 replay reddens on any silent change.
- **The `failClosedCheckpoints` docblock and the "WHAT IT STILL DOES NOT SEE" list were not rewritten here**, per the plan. 33-36 should state that the projection is now recursive, and that the remaining name-level residual is a name computed at run time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] An existing one-authority assertion encoded the hole**
- **Found during:** Task 1 GREEN.
- **Issue:** `expect(named("'=kubectl'")).toEqual([])` asserted that a quoted `=` names nothing. Under zsh, `eval '=kubectl' -n prod apply -f x` runs kubectl (row R4-13, measured with a stub), and the round-4 projection now names it.
- **Fix:** the assertion now expects `["kubectl"]`, with a comment giving the reason.
- **Files modified:** `scripts/checkpoints.test.ts`
- **Commit:** `312fafa8`

**2. [Rule 2 - Missing critical] Gap readings built without exponential enumeration**
- **Found during:** Task 1 design.
- **Issue:** the plan says to read each expansion both as empty and as a word boundary. Doing that literally, one text per gap choice, is 2^n and would fail-closed-deny ordinary long `echo "…$a…$b…"` lines. It would also miss mixed readings if cut down to two whole-text readings.
- **Fix:** a sentinel carries the gap into the nested text, and `namesOfPiece` adds the contiguous-run (boundary) reading. The run loop stops early once a run can no longer name a tool.
- **Files modified:** `scripts/checkpoints.ts`
- **Commit:** `312fafa8`

**3. [Rule 3 - Blocking] Corpus row R4-18 respelled**
- **Found during:** Task 1, measuring R4-18 before the fix.
- **Issue:** as first spelled (`eval echo$X'git' …`), R4-18 already denied on round 3 through the raw-name search.
- **Fix:** respelled with a splice (`eval echo$X'g\it' push origin main`). The new spelling was measured ALLOW on the pre-fix build and runs under bash with `X=';'`.

**4. Refactors with no behavior change**
- The round-3 over-denial floor list and the CR-01 spawn harness (`bare`, `reviewPayload`, `runAll`) were lifted to module scope, contents and bodies unchanged, so both rounds ask one list and one harness.

## Deferred Issues

Both are logged in `deferred-items.md`:

- **A pre-existing fail-closed throw, which this plan's recursion reaches in more places.** `namesOfVariant` throws `Invalid regular expression` on huge gap-dense pieces. The guard denies with its fail-closed text, so this is an over-denial, not a bypass. Removing the throw would turn a deny into an allow, which this plan does not do.
- **The `x=g\it; $x push` computed-name sibling**, owned by 33-43.

## Threat Flags

None. No new endpoint, auth path, or file access. The change only adds names to an existing projection.

## TDD Gate Compliance

- RED `b3acece3` (`test(33-35)`) comes before GREEN `312fafa8` (`feat(33-35)`).
- Tasks 2 and 3 are test-only commits: `5d1ceeb3` and `03847360`.
- The Task 1 tracer gate ran in interactive `end-of-phase` mode with automated-only `<verify>`. Its verify was re-run after GREEN: `Tests  699 passed (699)`, manifest fresh. So it continued to expansion without a checkpoint.

## Self-Check: PASSED

- FOUND: scripts/fixtures/cr01-nested-corpus.json, scripts/checkpoints.ts, scripts/checkpoints.js, scripts/checkpoints.test.ts, hooks/guard.test.ts, hooks/hook-entry.ts, hooks/hook-entry.js
- FOUND commits: b3acece3, 312fafa8, 5d1ceeb3, 03847360
- `hooks/guard.ts` diff against the dispatch base: empty
