---
phase: 33-live-capture-windows-portability
plan: 19
subsystem: testing
tags: [windows, cap-02, gap-closure, json-stringify, quoteValue, freshness, discrimination-pair, build-parity, tsc, createRequire, process.execPath, npx, tdd]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability (33-06)
    provides: the compiler launch `scripts/freshness.ts` uses — `typescript/lib/tsc.js` through `createRequire(import.meta.url)`, run under `process.execPath`; the two refusal sentences naming the locate and launch layers
  - phase: 33-live-capture-windows-portability (33-09)
    provides: the pushed windows-latest run 35499800942 whose rows W-11 and W-29 this plan closes; `deferred-items.md`'s `check-build-parity.ts:132` item
  - phase: 33-live-capture-windows-portability (33-02)
    provides: the harness stability the freshness matrix runs under
provides:
  - "`scripts/check-foundation-guards.test.ts` (o-prefix): both halves of the property compare through `JSON.stringify`, the guard's own `quoteValue` escaping, so the echoed sibling path is matched as the guard publishes it on every host (W-11)"
  - "`scripts/freshness.test.ts` DISCRIMINATION PAIR: the pre-fix arm asserts the host-independent fact (the pre-fix gate never names the plant, in no line of its stdout) and `prefixShape(run)` classifies the two measured pre-fix shapes, refusing a third (W-29)"
  - "`scripts/check-build-parity.ts` (+ committed `.js`): the compiler is `typescript/lib/tsc.js` resolved through the module's own require chain and run under `process.execPath` in the checkout root — the 33-06 launch, second consumer; an unresolvable entry is a refusal naming the locate layer"
  - "Tests AF and AG in `scripts/freshness.test.ts` (the compiler-launch suite): the launch read from the source, the gate's measured PASS line on a built clone, and the locate-layer arm named; `TRIPWIRE_MODULES` unchanged at 72"
affects: [33-20 (the pushed run that measures W-11 and W-29), 33-23 (the ledger flips: WINDOWS.md rows 228 and 235, the deferred-items.md o-prefix, W-29 and check-build-parity entries), ci-windows]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate (chars/4 over the realized diff)
actuals:
  tokens: 7312
  tasks: 3
  commits: 4
plan_head_before: 973b39bcc70b31e1fede12e8eaf8b5356147643e

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Assert an echoed value in the form the producer PUBLISHES it, read from the producer's one escaping (`quoteValue` = `JSON.stringify`), never in the raw host spelling — the separator cannot split the assertion and no platform read is needed"
    - "A historical-checkout arm asserts the host-independent FACT (did not name the plant) plus a named classification over the OBSERVED output shapes that refuses a third shape and logs which one the leg took — a disjunction over output, never a platform branch (D-14/D-16 discipline)"
    - "Launch a dev-dependency's CLI as a node script through its resolved entry and `process.execPath`, never through the npm/npx shim (33-06's launch, now in both compiler consumers)"
    - "A gate whose verdict is `git diff` over tracked outputs is exercised against a built, diff-clean clone, not the checkout — on the checkout its verdict describes the developer's index state, not the module"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.test.ts
    - scripts/freshness.test.ts
    - scripts/check-build-parity.ts
    - scripts/check-build-parity.js

key-decisions:
  - "W-11: the o-prefix property compares `JSON.stringify(siblingDeep)` on the positive half and `JSON.stringify(siblingDeep.slice(m.length))` on the negative — one escaping on both halves, derived from `quoteValue`, so the negative cannot pass by asking for a spelling the section never carries"
  - "W-29: the pre-fix arm's evidence is 'did not name the plant', asserted twice — the post-fix sentence `STALE COMMITTED OUTPUT: hooks/guard.js` absent (the ONE sentence the pair discriminates on) AND the plant path in no line of the pre-fix stdout (the pre-fix gate's own vocabulary was `STALE: <path>`, so the first negative alone is vacuous against it)"
  - "`prefixShape` has exactly two accepted values, both measured: `green-vacuous` (exit 0 + fresh line, every POSIX run) and `no-compiler-vacuous` (exit 1 + `the rebuild did not compile cleanly` + no `TS\\d{4}` on either stream + no fresh line, windows-latest run 35499800942); `unexpected` is refused; the shape is logged"
  - "Tests AF/AG run the WORKING TREE's committed `scripts/check-build-parity.js` against an 8th, built, diff-clean clone (`postfix-parity`) with `CHECK_ROOT` pointed at it, not against the checkout: the gate's verdict is `git diff` over tracked `.js`, which on the checkout reports modified-but-uncommitted output as 'moved' (33-17 measured this) — a verdict about staging state, not the launcher. PROVENANCE pin moved 7 -> 8 with the reason beside it"
  - "AG classifies `located` / `locate-refusal` / `unexpected` over the observed output with `NODE_PATH` removed, asserts the layer is named whichever arm the host gives, and refuses the pre-33-06 null-status 'the build did not complete' sentence; on this host it takes `locate-refusal`"
  - "`check-build-parity.ts` passes no `--outDir`: the gate rebuilds IN PLACE by design (its subject is whether tracked outputs move), so only the launcher changed; the `check:build-parity` script contract (`tsc --outDir .tmp-build && node scripts/check-build-parity.js`) is untouched"
  - "The ledger is not touched here: WINDOWS.md rows 228/235 and the three deferred-items.md entries stay `open` for plan 33-23, which owns the `Resolved by:` flips (its files_modified names both files; 33-17/33-18 followed the same rule)"

patterns-established:
  - "Published-form assertion: compare through the producer's escaping, not the host spelling"
  - "Two-shape classification with a refused third, logged — the D-16 named-skip discipline applied to a historical checkout's output"
  - "One compiler launch, two gates: freshness.ts and check-build-parity.ts share the mechanism byte-for-byte in intent"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The o-prefix case matches the echoed sibling path in the guard's published JSON form on both halves (W-11)"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts -t \"o-prefix\" (1 passed | 299 skipped, exit 0)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts -t \"guard_model_assignment\" (44 passed, the whole describe block)"
        status: pass
      - kind: other
        ref: "darwin reproduction of the W-11 shape: sibling directory named `mirX\\TRA` (a backslash, legal on POSIX) — the old raw-spelling assertion reds with `expected '  FAIL  model-assignment violation:…' to contain '/var/folders/…'`, the JSON-form assertion passes; fixture restored (`grep -c 'mirX\\\\TRA'` = 0)"
        status: pass
      - kind: other
        ref: "grep -a -c 'toContain(JSON.stringify(siblingDeep))' scripts/check-foundation-guards.test.ts = 1; grep -a -c 'process.platform' = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The discrimination pair's pre-fix arm asserts what every host can observe and classifies the two measured pre-fix shapes (W-29)"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts (11 passed at Task 2; 13 passed after Task 3) — `DISCRIMINATION PAIR: pre-fix shape = green-vacuous`"
        status: pass
      - kind: other
        ref: "the same file with `npx` unreachable on PATH (node, npm, git only; `command -v npx` empty) — 11 passed, `DISCRIMINATION PAIR: pre-fix shape = no-compiler-vacuous` (the windows-latest 35499800942 shape, on darwin)"
        status: pass
      - kind: other
        ref: "MUTANT-B (the compile-failure sentence misspelt in `prefixShape`) under the same no-npx PATH: `pre-fix shape = unexpected`, 1 failed | 10 passed; restored (`grep -c MUTANT-B` = 0)"
        status: pass
      - kind: other
        ref: "grep -a -c 'no-compiler-vacuous' scripts/freshness.test.ts = 3; grep -a -c 'expect(after.status, msg).toBe(1)' = 1; the `STALE COMMITTED OUTPUT: ${PLANT_REL}` assertion on `after.stdout` present (line 2 of the grep); `process.platform` count 1 = the pre-existing harness `NEEDS_SHELL` read, none added"
        status: pass
    human_judgment: false
  - id: D3
    description: "`check-build-parity.ts` launches the compiler the 33-06 way (createRequire + process.execPath, no shim), with Tests AF/AG in the compiler-launch suite and the committed .js rebuilt in the same commit"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts -t \"check-build-parity\" (2 passed | 11 skipped; `Test AG: locate shape = locate-refusal`)"
        status: pass
      - kind: other
        ref: "RED (bb6a1ffc): AF fails on `expected '// check-build-parity.ts — the WORKIN…' to contain 'createRequire(import.meta.url).resolv…'`; `check tdd-red-evidence` RED_EVIDENCE_OK (2 tests / 1 pass / 1 fail counted from the tap-flat output). GREEN (010781eb): 2 passed with npx reachable AND unreachable"
        status: pass
      - kind: other
        ref: "AG on the OLD module with npx unreachable (the win32 shape on darwin): `locate shape = unexpected`, stderr `FAIL  the build did not complete, so this check states nothing about the build outputs:` — 1 failed; on the new module: `locate-refusal`, passes"
        status: pass
      - kind: other
        ref: "grep -a -c '\"npx\"' scripts/check-build-parity.ts = 0; npm run build && npm run check:build-parity (`0 findings over 69/69 elements`, ALL CHECKS PASSED) && npx tsc --noEmit (exit 0); npm run freshness on HEAD 010781eb: `All build outputs fresh: 69 committed .js file(s)`; TRIPWIRE_MODULES = 72 unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "The post-wave gate: full excluded suite, typecheck, nul-bytes"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' (78 files, 5366 passed | 2 skipped pre-existing, exit 0) && npm run check:nul-bytes (ALL CHECKS PASSED)"
        status: pass
    human_judgment: false

# Metrics
duration: 22min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 19: W-11, W-29 and the build-parity launcher closed by derivation Summary

**The o-prefix echo is matched in `quoteValue`'s JSON form; the discrimination pair's pre-fix arm asserts "never names the plant" over two measured shapes with a refused third; and `check-build-parity.ts` takes 33-06's `createRequire` + `process.execPath` compiler launch, red-first, with its `.js` rebuilt — no platform conditional, no history patched, no census pin moved.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-20T22:16:33Z
- **Completed:** 2026-09-20T22:39:01Z
- **Tasks:** 3 (Task 3 TDD: RED + GREEN, no REFACTOR needed)
- **Files modified:** 4

## Accomplishments

- **W-11 (row 228, `check-foundation-guards.test.ts` o-prefix):** the refusal renders the illegal `models.preset` through `quoteValue` = `JSON.stringify` (scripts/model-tiers.ts:1067, :1409), so the published spelling of the sibling path is `JSON.stringify(siblingDeep)` — identical to the raw path where no byte needs escaping, doubled backslashes on win32. Both halves now compare through that escaping. Reproduced on darwin by giving the sibling directory a backslash in its name: the old assertion reds with W-11's exact shape, the new one passes.
- **W-29 (row 235, `freshness.test.ts` DISCRIMINATION PAIR):** the pre-fix arm no longer asserts exit 0. It asserts the fact every host can observe — the pre-fix gate does not name the plant — and `prefixShape(run)` classifies the run as `green-vacuous` (POSIX) or `no-compiler-vacuous` (windows-latest 35499800942), refusing `unexpected`. Both shapes were measured on this host (npx reachable / unreachable), and the refusal arm was proven live by mutation.
- **The `check-build-parity.ts:132` open item:** the `spawnSync("npx", ["tsc"])` launch is gone; the module resolves `typescript/lib/tsc.js` through `createRequire(import.meta.url)` and spawns `process.execPath` in the checkout root (in place, no `--outDir`, as the gate's subject requires). An unresolvable entry returns a `BuildParityResult` naming the locate layer. Tests AF/AG live in `scripts/freshness.test.ts`, so `TRIPWIRE_MODULES` stays 72. `npm run check:build-parity` is green on the committed tree (`0 findings over 69/69`).

## Task Commits

1. **Task 1: o-prefix compares the published JSON form (W-11)** — `028ec889` (fix)
2. **Task 2: the pre-fix arm asserts what every host can observe (W-29)** — `0e93d26b` (fix)
3. **Task 3: check-build-parity launches the compiler the 33-06 way** — RED `bb6a1ffc` (test), GREEN `010781eb` (feat)

TDD gate compliance: `test(33-19)` precedes `feat(33-19)`; the RED record returned `RED_EVIDENCE_OK` from `check tdd-red-evidence` (target AF, `expected '// check-build-parity.ts — the WORKIN…' to contain 'createRequire(import.meta.url).resolv…'`, exit 1, 2 tests / 1 pass / 1 fail counted from the same tap-flat output, full `file > describe > title` targetTest — 33-17's method). No REFACTOR commit — the `nothingStated` helper landed inside GREEN and nothing was left to clean.

## Task 1 — every arm probed, classified

`grep -n 'not a legal preset name' scripts/check-foundation-guards.test.ts` finds ONE site (the o-prefix case): it is the only case that echoes a caller-supplied path through the preset refusal — **moved** to the JSON form. The four sibling cases in the same describe block that assert a mirror path (`(o)`, `(o-reason)`, `(o-rel-reason)`, `(o-rel-word)`) assert `not.toContain(m)` — a disclosure negative against the mirror root, whose paths reach the section through `relativeToRoot` (a plain-text rewrite, no JSON escaping), so the raw spelling IS the published form there — **already correct-form**, unchanged; they were green on the windows run (W-11 was the file's only surviving red). The whole `guard_model_assignment` block: 44 passed.

## Task 2 — the pair's two shapes, measured

| Shape | Observed on | Exit | stdout | Compiler text |
|---|---|---|---|---|
| `green-vacuous` | every POSIX run; this host with `npx` on PATH | 0 | `All build outputs fresh: …` | present (tsc ran) |
| `no-compiler-vacuous` | windows-latest 35499800942 (row W-29); this host with `npx` off PATH | 1 | `Freshness check FAILED: the rebuild did not compile cleanly …`, `stderr: (no stderr)` | none |
| `unexpected` | MUTANT-B only | — | — | refused: 1 failed |

Why the plant path is asserted absent from every line and not only the post-fix sentence: the pre-fix gate at `020905f9` prints `STALE: <path>` (read with `git show`), so `not.toContain("STALE COMMITTED OUTPUT: hooks/guard.js")` alone is vacuous against it — it asks the pre-fix gate for a sentence it never had. The post-fix spelling stays asserted because it is the ONE sentence the pair discriminates on (asserted present on `after`). `ORDERING INDEPENDENCE`, `CONTROL`, Test 1 and the post-fix arm are byte-unchanged.

## Task 3 — the launcher, and where its tests live

- `scripts/check-build-parity.ts`: `createRequire` import; `nothingStated(reason)` builds the visited-0 result; the locate refusal mirrors `freshness.ts`'s sentence (`the compiler could not be located from this checkout (<err>), so this check states nothing about the build outputs`); `spawnSync(process.execPath, [tscEntry], { cwd: root, encoding: "utf8" })`; `build.error !== undefined || build.status !== 0` reads both fields; the IN-01 paragraph records the `npx.cmd` case as no longer reachable and names that as the reason the launch moved (the shim spelt in backticks; the double-quoted spelling count is 0). Header's "one `npx tsc` invocation" updated.
- **Test AF** (structural + behavioural): the three source predicates, then the working tree's `check-build-parity.js` run with `CHECK_ROOT` = the `postfix-parity` clone; asserts exit 0, the `reportMeasured` PASS line, its numerator and denominator equal to `git ls-files -- '*.js'` in the clone (derived by a different command shape), `> 0`, and `ALL CHECKS PASSED`.
- **Test AG**: `check-build-parity.js` + `is-entry.js` + `vacuity.js` copied to a temp root outside the checkout, `NODE_PATH` removed, `CHECK_ROOT` = the parity clone; the walk from the copy to `/` is recorded in the message; shape `located` / `locate-refusal` / `unexpected`; the null-status sentence refused on every arm. This host: `locate-refusal`.
- On the OLD module AG was green on POSIX (npx reachable from the clone's cwd — the launch succeeds through the shim exactly as it does on ubuntu) and RED with `npx` unreachable (`FAIL  the build did not complete …`, the win32 shape). AF was RED on the structural half. Both green on the new module either way.

## Files Created/Modified

- `scripts/check-foundation-guards.test.ts` — o-prefix: `toContain(JSON.stringify(siblingDeep))` / `not.toContain(JSON.stringify(siblingDeep.slice(m.length)))`, comment names `quoteValue`, run 35499800942 and row 228
- `scripts/freshness.test.ts` — header updated; `PrefixShape`, `COMPILER_TEXT`, `prefixShape`; pair comment rewritten and the pre-fix arm reformulated with the shape logged; `PARITY_TS`/`PARITY_JS`/`PARITY_SIBLINGS`; `dirname` import; `parityClone` fixture (clone 9 in the matrix comment, the 8th clone), PROVENANCE pin 8; `PARITY_PASS_RE`, `LocateShape`, `locateShape`, `runParity`; the `check-build-parity.js` describe with Tests AF and AG
- `scripts/check-build-parity.ts` — the 33-06 launch; locate-layer refusal; IN-01 paragraph updated; header wording
- `scripts/check-build-parity.js` — rebuilt twin (freshness 69/69, parity 69/69)

## Decisions Made

See `key-decisions` in the frontmatter. The two that go beyond the plan's letter are recorded as deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The pre-fix negative is also asserted in the pre-fix gate's own vocabulary**
- **Found during:** Task 2 (read_first of `freshness.ts` at `PRE_FIX_SHA` via `git show 020905f9:scripts/freshness.ts`)
- **Issue:** the plan's pre-fix assertion is `not.toContain("STALE COMMITTED OUTPUT: <plant>")`. The pre-fix gate never printed that sentence — its stale line was `STALE: <path>` — so on its own the assertion cannot fail against the pre-fix tree even if that gate DID detect the plant: a vacuous negative, the class this phase's ledger exists to catch.
- **Fix:** the plan's assertion is kept (it is the sentence the pair discriminates on) and a second assertion requires the plant path to appear in NO line of the pre-fix stdout, whatever the spelling; the comment says why both are there.
- **Files modified:** scripts/freshness.test.ts
- **Verification:** both shapes green; MUTANT-B refused
- **Committed in:** `0e93d26b`

**2. [Rule 1 - Bug] Test AF's behavioural half runs against a built clone, not the checkout**
- **Found during:** Task 3 (read_first of `buildParity` — its verdict is `git diff --name-only -- '*.js'`, working tree vs index — and 33-17's Issues Encountered: the gate "reports the `.js` as moved while it is modified-but-uncommitted")
- **Issue:** the plan's behaviour says "run from the repository root exits 0 … on this tree". On the checkout that verdict is a function of the developer's index: any unstaged `.ts` edit makes the in-place build move its `.js` relative to the index and the gate (correctly) reports it moved — the test would red on the staging state, not the launcher, and the in-place build would rewrite the developer's working tree from inside the suite.
- **Fix:** an 8th clone (`postfix-parity`) is made and built in `beforeAll`; AF runs the WORKING TREE's `scripts/check-build-parity.js` with `CHECK_ROOT` = that clone (the module under test is still the tree in front of it; the tree it measures is diff-clean by construction). PROVENANCE's clone pin moves 7 -> 8 with the reason beside it. The plan's separate acceptance gate `npm run check:build-parity` on this tree was run as written and is green.
- **Files modified:** scripts/freshness.test.ts
- **Verification:** AF green with npx reachable and unreachable; `npm run check:build-parity` green on HEAD
- **Committed in:** `bb6a1ffc` (RED), `010781eb` (GREEN)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** every plan-named assertion, file, grep gate and command is present and green; the two changes make one negative non-vacuous and one behavioural test hermetic. No scope creep; no platform conditional; no historical checkout patched; `TRIPWIRE_MODULES` = 72.

## Issues Encountered

- `check tdd-red-evidence` needs node-runner `# tests/pass/fail` lines that vitest's `tap-flat` reporter omits; appended, counted from the same output's non-SKIP `ok`/`not ok` rows, exactly as 33-17 and 33-18 did.
- Test AG cannot be RED on a POSIX host against the old module in the ordinary environment: `npx` is reachable from the clone's cwd, so the shim launch succeeds — the same reason the parity step was green on ubuntu. Its layer assertion was measured RED on darwin by removing `npx` from PATH (node, npm, git only), which is the win32 shape; the RED gate's target is AF, which fails structurally.
- A comment in Task 2 originally spelt the literal `process.platform`; reworded to "host-platform branch" so the file's grep count stays at its baseline (the one pre-existing `NEEDS_SHELL` read).

## Ledger state (for plan 33-23)

Nothing in `.planning/WINDOWS.md` or `deferred-items.md` was edited (33-23 owns the `Resolved by:` flips). Citations for it:

- WINDOWS.md row 228 (W-11, `check-foundation-guards.test.ts:10824`) — addressed by mechanism in `028ec889` (Task 1); flips on 33-20's pushed windows run reading green.
- WINDOWS.md row 235 (W-29, `freshness.test.ts` DISCRIMINATION PAIR) — addressed by mechanism in `0e93d26b` (Task 2); both pre-fix shapes measured on darwin; flips on 33-20's pushed windows run.
- deferred-items.md "One windows red in `scripts/check-foundation-guards.test.ts` is NOT ADDRESSED: the o-prefix echo" — `028ec889`, Task 1.
- deferred-items.md "`scripts/check-build-parity.ts:132` still launches the compiler through `spawnSync("npx", ["tsc"])` with no shell" — closed in `010781eb` (Task 3, RED `bb6a1ffc`); not a CI-measured class (ubuntu-scoped step), proven offline: `npm run check:build-parity` green under the new launcher, AF/AG green with `npx` unreachable. Resolvable without a 33-20 run id.

No new WINDOWS.md entry: no stub, skipped test or unrun verify was left behind (`gsd_run windows append` not needed).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 7's remaining plans (33-13, 33-16) and 33-20's pushed run are unaffected by this plan's files.
- For 33-20: the windows leg is expected to report `DISCRIMINATION PAIR: pre-fix shape = no-compiler-vacuous` and `Test AG: locate shape = locate-refusal` (or `located`) in its log, and the o-prefix case green.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- FOUND: scripts/check-foundation-guards.test.ts, scripts/freshness.test.ts, scripts/check-build-parity.ts, scripts/check-build-parity.js
- FOUND commits: 028ec889, 0e93d26b, bb6a1ffc, 010781eb (`git rev-list --count 973b39bc..HEAD` = 4, matching `commits: 4`)
- Full excluded suite 5366 passed | 2 skipped, exit 0; `npm run check:nul-bytes` ALL CHECKS PASSED
