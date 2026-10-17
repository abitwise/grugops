---
phase: 33-live-capture-windows-portability
plan: 24
subsystem: context-io
tags: [windows, context-io, cap-02, row-236, wr-05, d-15, d-33-r3-01, canonicalDirectoryPath, canonicalWorkingDirectory, realpathSync-native, tracer, tdd, hook-manifest]

# Dependency graph
requires:
  - phase: 33-16
    provides: canonicalWorkingDirectory export and the cwd tier on rung 1 (the arm the CI red moved onto)
  - phase: 33-20
    provides: run 35579263776's re-derived inventory (Part 3 § 3.3) and the `unmeasured locally, by construction` wording
provides:
  - "D-33-R3-01: rung 1 (`realpathSync.native`) is the module's ONE published spelling of a directory; rung 2 is a fallback inside the ladder only (`assumption_delta = promote`)"
  - "`homeBoundary` second spelling and the env tier both through `canonicalDirectoryPath` (33-REVIEW WR-05 (a)/(b))"
  - "`tmp15(prefix)` derives through the module's exported `canonicalWorkingDirectory`; the WR-15 block compares two values spelled by ONE function"
  - "Tests W-ENV (RED-first) and W-HOME (premise + property) beside 33-16's Test W"
  - "The 35-row hand-off table for plan 33-31's pre-push inventory, with the 8.3 axis named unmeasured on every row"
affects: [33-31, 33-25..33-34 gap-closure round 3, CAP-02, WINDOWS.md row 236]

# Actuals (#2632) — same estimateTokens scale as the plan's `estimate` (chars/4 over the realized diff)
actuals:
  tokens: 7400
  tasks: 2
  commits: 3
plan_head_before: 1bd53b164ed03135599dcc1cee18b7006547bb42

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One spelling authority: every side of a directory comparison — module or test — is spelled by `canonicalDirectoryPath` (exported as `canonicalWorkingDirectory`); a test never calls a `realpathSync` variant where the module's export can be asked"
    - "Derive the set, assert the count: rung-2 / bare-resolve sites counted by grep before and after, and asserted in the plan's verify block"
    - "Decision before code: the published-spelling decision was committed (f20d398a) before the RED test (fd431918) and the GREEN change (a59321ae)"

key-files:
  created:
    - docs/audit/29-style-dispositions/33-24.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/16-context-read-write.md
    - .planning/STATE.md

key-decisions:
  - "D-33-R3-01 (assumption_delta = promote): rung 1 of canonicalDirectoryPath (realpathSync.native, the kernel's final path — long names on win32) is the module's one published spelling of a directory on every host; rung 2 stays a fallback rung INSIDE the ladder and is never a published spelling on its own. Evidence: the :11626 rung-identity property (rung 1 idempotent over rung 2's output, converse disproved by the 8.3 class); tier 0 and the cwd tier already publish rung 1; 33-15's W-23..W-25 derived through rung 1 read green on run 35579263776."
  - "TRUSTED_ROOT_TIERS[1] and the WF16 tier-1 line both say the env value is 'made absolute and canonicalised through the one ladder' — a mechanism sentence changed in one is changed in both, with a LANG-03 disposition row (docs/audit/29-style-dispositions/33-24.md)."
  - "The three env-tier cases that compared the tier's answer to a bare `resolve(...)` (30-11 RA2-1, 30-11 RA4-2, the 31-27 4-host control) now derive through the module's export — on darwin `/tmp` -> `/private/tmp`, the arm the plan predicted."

patterns-established:
  - "A `-t` title run per CI row is the hand-off shape for the next pushed run: 35 titles, each run once, each result line quoted, the axis this host cannot measure named on every row"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "D-33-R3-01 recorded (STATE.md + this summary) BEFORE any code edit, with its three evidence items and assumption_delta = promote"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "git log --oneline 1bd53b16..HEAD — f20d398a (docs, decision) precedes fd431918 (test, RED) precedes a59321ae (feat, GREEN)"
        status: pass
    human_judgment: false
  - id: D2
    description: "`homeBoundary`'s second spelling and the env tier's return value go through `canonicalDirectoryPath`; the two monotonicity-mirror anchors are byte-identical to pushed sha 9e1c1131"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "grep -a -c 'resolve(fromEnv' scripts/context-io.ts -> 0; non-comment realpathSync( in scripts/context-io.ts -> 1; both anchor counts -> 1; git diff 9e1c1131..HEAD shows no +/- line on either anchor"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#W-ENV (33-24, WR-05 (b)) and #W-HOME (33-24, WR-05 (a))"
        status: pass
    human_judgment: false
  - id: D3
    description: "`tmp15` and the four home comparisons derive through the module's exported `canonicalWorkingDirectory`; the rung-identity property is the only direct rung-2 call left in the test file"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "non-comment realpathSync( in scripts/context-io.test.ts -> 1 (:11626)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -> 665 passed (665)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Committed twins follow the module: scripts/context-io.js rebuilt, hooks/hook-entry.ts/.js manifest regenerated; parity and freshness green; every consumer of trustedRepoRoot green; full excluded-lane suite green once"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "npm run check:build-parity -> PASS 0 findings over 69/69; npm run freshness:hook-manifest -> fresh, 2 deciders, 26 module hashes"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' -> Test Files 78 passed (78), Tests 5377 passed | 2 skipped (5379); node scripts/check-foundation-guards.js -> ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 35 titles of 33-CI-MEASUREMENT.md Part 3 § 3.3 each green on this host, handed to plan 33-31 with the 8.3 axis named `unmeasured locally, by construction` on every row"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "darwin has no 8.3 short names; a local green is not the measurement. Whether row 236's class is closed on windows-latest is decided only by plan 33-31's pushed run (D-13)."

# Metrics
duration: 30min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 24: One spelling authority for the trusted-root directory — Summary

**Rung 1 (`realpathSync.native`) promoted to the module's sole published spelling by a decision recorded before any edit; the home boundary, the env tier and the WR-15 block's fixture helper all derive through `canonicalDirectoryPath`, so the 35-case class of WINDOWS.md row 236 has one authority on both sides of every comparison — on every arm 33-REVIEW WR-05 named, not only the one the CI red hit.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-21T15:09:20Z
- **Completed:** 2026-09-21T15:39:48Z
- **Tasks:** 2 (Task 1 tracer + TDD, Task 2 auto)
- **Files modified:** 7 (+1 created)

## The decision, first (D-33-R3-01)

Recorded in STATE.md and committed as `f20d398a` **before** the RED test (`fd431918`) and the GREEN
change (`a59321ae`) — `git log --oneline 1bd53b16..HEAD` shows the order.

**Decision.** The published spelling of a directory on every host is rung 1 of
`canonicalDirectoryPath` (`realpathSync.native`, the kernel's final path — long names on win32,
`runneradmin` not `RUNNER~1`). Rung 2 (`realpathSync`) stays a fallback rung INSIDE the ladder for a
platform that exposes no native variant and is never a published spelling on its own.
`assumption_delta = promote`.

**Evidence, all on disk before the decision:**

1. The rung-identity property (`scripts/context-io.test.ts:11626`, now the only direct rung-2 call
   in the file) proves `realpathSync.native(realpathSync(r)) === realpathSync.native(r)` — rung 1
   is idempotent over rung 2's output. The converse (rung 2 over rung 1's output giving rung 2's
   answer) is disproved by the 8.3 class itself: rung 2 preserves `RUNNER~1` where the kernel answers
   `runneradmin` (33-CI-MEASUREMENT.md Part 3 § 3.3).
2. Tier 0 (`hostDeliveredRoot`) already publishes rung 1, and 33-16 (`c1fca72b`) put the cwd tier on
   it.
3. 33-15 derived W-23..W-25 through rung 1 and all three read green on run 35579263776.

**The alternative, rejected:** defining rung 2 as the published spelling would put the cwd tier and
tier 0 back onto a spelling the kernel does not answer and re-open 33-16's W-21.

## Accomplishments

- **One authority on every arm WR-05 named.** `homeBoundary`'s second spelling is
  `canonicalDirectoryPath(named)` (raw `named` kept; `try/catch` kept; comment names the 8.3 miss
  and the `degenerate`-guard drop). The env tier returns `canonicalDirectoryPath(fromEnv.trim())`.
  The cwd tier was already on rung 1 (33-16). Three module-side spellers, one ladder.
- **One authority on the test side.** `tmp15(prefix)` is `mod.canonicalWorkingDirectory(freshTmp(prefix))`
  — the module's EXPORT, not a `realpathSync` variant called in the test. The four home comparisons
  at the 31-41 site derive through the same export. The three env-tier cases that compared to a bare
  `resolve()` derive through it too (the plan predicted this arm: on darwin a `/tmp/...` plant
  answers `/private/tmp/...`).
- **Tests W-ENV and W-HOME** beside 33-16's Test W. W-ENV RED-first (the red quoted below); W-HOME
  premise-first, its docblock stating which half darwin measures and which half 33-31 decides.
- **Prose and program moved together.** `TRUSTED_ROOT_TIERS[1]` and WF16 tier-1 line both read
  "made absolute and canonicalised through the one ladder"; the both-directions equality test is
  green; the LANG-03 gate asked for one disposition row and got it
  (`docs/audit/29-style-dispositions/33-24.md`).
- **Committed twins and manifest follow the module** in the same commit; parity and freshness green.
- **Every consumer green, full suite green once, foundation guards green.**
- **35-row hand-off for plan 33-31**, below.

## Site counts — derived by grep, before and after (non-comment lines)

| Set | Command | Before | After | Plan's expectation |
|---|---|--:|--:|---|
| rung-2 sites in `scripts/context-io.ts` | `grep -a -v '^\s*//' scripts/context-io.ts \| grep -a -v '^\s*\*' \| grep -a -c 'realpathSync('` | 2 (:4667 ladder rung 2, :4889 home boundary) | **1** (the ladder's own rung 2) | 2 -> 1 |
| bare-resolve env tier | `grep -a -c 'resolve(fromEnv' scripts/context-io.ts` | 1 (:5308) | **0** | 1 -> 0 |
| rung-2 sites in `scripts/context-io.test.ts` | same filter over the test file | 6 (:6227 tmp15, :11615 rung-identity, :16345/:16348/:16352/:16355 home comparisons) | **1** (:11626, the rung-identity property — the decision's evidence, labelled so in a one-line comment) | 6 -> 1 |
| `const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);` | `grep -a -c` | 1 | **1** | 1 |
| `for (const name of TRUSTED_ROOT_ENV_ORDER)` | `grep -a -c` | 1 | **1** | 1 |
| `process.platform` lines ADDED since pushed sha 9e1c1131 | `git diff 9e1c1131..HEAD -- scripts/context-io.ts scripts/context-io.test.ts \| grep -a -c '^+.*process\.platform'` | — | **0** | 0 |

**The two mirror anchors vs the last pushed sha** — `git diff 9e1c1131cec8943e2ac96233ed7e624720ced14b..HEAD -- scripts/context-io.ts | grep -a -c -E '^[-+].*(const discovered = cwd === null|for \(const name of TRUSTED_ROOT_ENV_ORDER\))'` -> `0`. The env-tier hunk, quoted, shows both as context lines only:

```
@@ -5305,7 +5315,12 @@ export function trustedRepoRoot(): string {
   if (delivered !== null) return delivered;
   for (const name of TRUSTED_ROOT_ENV_ORDER) {
     const fromEnv = process.env[name];
-    if (typeof fromEnv === "string" && fromEnv.trim() !== "") return resolve(fromEnv.trim());
+    // THROUGH THE ONE LADDER, not a bare `resolve` (plan 33-24, D-33-R3-01, closing 33-REVIEW
+    // WR-05 (b)). ...
+    if (typeof fromEnv === "string" && fromEnv.trim() !== "") return canonicalDirectoryPath(fromEnv.trim());
   }
```

## TDD record (Task 1, `tdd="true"`)

**RED — `fd431918` `test(33-24): add failing W-ENV and premise W-HOME beside Test W`.** Run on the
dispatch base (module untouched):

```
npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "W-ENV|W-HOME"
 × W-ENV (33-24, WR-05 (b)): the env tier spells CLAUDE_PROJECT_DIR through the ONE ladder — ...
AssertionError: CLAUDE_PROJECT_DIR: the env tier published the LINK spelling; the value must go
through canonicalDirectoryPath the way the cwd tier and tier 0 do (WR-05 (b)):
Expected: "/private/var/folders/y3/.../T/p33-24-wenv-oxinsI/real/proj"
Received: "/private/var/folders/y3/.../T/p33-24-wenv-oxinsI/link/proj"
 Tests  1 failed | 2 passed | 662 skipped (665)      exit 1
```

RED evidence record verified: `gsd_run check tdd-red-evidence` -> `RED_EVIDENCE_OK`
(`target_test_failed`, tests 3 / pass 2 / fail 1). Note for the record: vitest's `tap-flat`
reporter emits no `# tests/# pass/# fail` trailer, so the trailer was appended by counting the
`ok`/`not ok` lines without `# SKIP` — the derivation is stated inside the record.

W-HOME was green on the RED run, as its docblock says it must be: on darwin rung 2 already resolves a
directory symlink, so the LINK half is a premise + property; the 8.3 half is unmeasured locally.

**GREEN — `a59321ae` `feat(33-24): one spelling authority on every arm ...`.**
`npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts` -> `Tests 665 passed (665)`, exit 0.

**REFACTOR:** none needed; no commit.

## Tracer feedback gate (Task 1 is `type="tracer"`)

Interactive run, `human_verify_mode = end-of-phase`, the tracer's `<verify>` carries only
`<automated>` checks -> row 3 of checkpoints.md: re-run verify, continue on success. Every verify
command re-run on the committed tree and green (table above + 665/665). `Tracer verified end-to-end
— expanding` to Task 2.

## Probed arms (Task 1) — each with its vitest result

From `--reporter=verbose` over the whole file (665 lines, 0 `×`):

| Arm | Cases | Result |
|---|--:|---|
| WR-15 block cases planting a `TRUSTED_ROOT_ENV_ORDER` variable (ROW 6, GREEN 2, PRECEDENCE, EMPTY INPUT, step 1 x5 consumers, step 2 x5 consumers, CASCADE) | 15 | all ✓ |
| near/far step-limit cases (BOUND x3, step 3 x5 consumers, `the published step limit ...`) | 9 | all ✓ |
| CR-13 home-rooted cases (`31-23 — CR-13`) | 39 | 39 ✓ |
| WR-21 home-stop cases (`31-19 — WR-21`) | 18 | 18 ✓ |
| the three MONOTONICITY cases (31-15 `1413ms`, WR-21, CR-13) + tier-0 STRICT SUBSET | 4 | all ✓ |
| tier-0 block (`31-27 S1 — tier 0 ...`, incl. the 4-host control, the three rungs, W-21, W-ENV, W-HOME, TIERS equality) | 19 | 19 ✓ |
| whole `scripts/context-io.test.ts` | 665 | 665 ✓ |

`TRUSTED_ROOT_TIERS` / WF16 equality: `✓ the workflow's published resolution order equals TRUSTED_ROOT_TIERS in BOTH directions`.

## Task 2 — consumers, twins, gates (quoted)

```
npm run build                      -> tsc, exit 0
npm run generate:hook-manifest     -> Wrote hooks/hook-entry.ts manifest — 2 decider(s), 26 module hash(es)
npm run check:build-parity         -> PASS  Build parity: ... 0 findings over 69/69 elements   ALL CHECKS PASSED
npm run freshness:hook-manifest    -> Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.
npx tsc --noEmit                   -> exit 0
```

| Consumer file (derived: `grep -l trustedRepoRoot scripts/*.test.ts hooks/*.test.ts` + the plan's named set) | vitest summary line |
|---|---|
| `hooks/guard.test.ts` | `Tests  275 passed (275)` · 36.99s |
| `hooks/admission-guard.test.ts` | `Tests  73 passed (73)` |
| `scripts/floor-invariance.test.ts` | `Tests  136 passed (136)` |
| `scripts/context-io-writer-set.test.ts` | `Tests  195 passed (195)` |
| `scripts/board-read.test.ts` | `Tests  172 passed (172)` |
| `scripts/admission-server.test.ts` | `Tests  46 passed (46)` |
| `scripts/context-io.test.ts` | `Tests  665 passed (665)` |

Post-wave gate, once: `npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes` ->
`Test Files  78 passed (78)` · `Tests  5377 passed | 2 skipped (5379)` · `Duration  492.58s` · nul-bytes `ALL CHECKS PASSED` · exit 0.
`node scripts/check-foundation-guards.js` -> `ALL CHECKS PASSED`, exit 0.
Also run (because the WF16 line moved): `node scripts/check-diff-disposition.js` -> `PASS diff disposition — changed watched file(s): 0 findings over 39/39 elements`; `node scripts/check-imperative-lexicon.js` -> `ALL CHECKS PASSED`.
`npm test` was not run.

## Hand-off to plan 33-31 — the 35 rows of Part 3 § 3.3, each run by title on this host

Command per row: `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "<describe-prefix>.*<title>$"` (regex-escaped; each matched exactly one test). Line numbers are the run-35579263776 tree's, as § 3.3 lists them. **A green here is not the measurement**: darwin has no 8.3 short names, so the class row 236 records cannot be reached on this host at all. Plan 33-31's pushed run decides every row.

| Row | Line (§ 3.3) | Case | This host | 8.3 axis |
|---|---|---|---|---|
| N-1 | :6456 | ROW 6, GREEN: both variables unset and the cwd inside a project — the project's dial REFUSES | 1 passed / 664 skipped (665) · exit 0 · 44 ms | unmeasured locally, by construction |
| N-2 | :6501 | EMPTY INPUT: an empty or whitespace-only installer variable names nothing and falls through | 1 passed / 664 skipped (665) · exit 0 · 157 ms | unmeasured locally, by construction |
| N-3 | :6524 | CONTROL 3 (adjacency): when the cwd IS the project root, it answers at distance zero | 1 passed / 664 skipped (665) · exit 0 · 76 ms | unmeasured locally, by construction |
| N-4 | :6552 | BOUND, non-vacuous: an inner repository that DOES carry a configuration answers with its own | 1 passed / 664 skipped (665) · exit 0 · 50 ms | unmeasured locally, by construction |
| N-5 | :6718 | step 3 › the three in-process writers agree with the one function | 1 passed / 664 skipped (665) · exit 0 · 118 ms | unmeasured locally, by construction |
| N-6 | :6753 | step 3 › promoteAdmitted's fail-closed arm reads the SAME root (D-14 shape) | 1 passed / 664 skipped (665) · exit 0 · 39 ms | unmeasured locally, by construction |
| N-7 | :6947 | CASCADE: removing each step's input hands the answer to the next step, down to the kit | 1 passed / 664 skipped (665) · exit 0 · 156 ms | unmeasured locally, by construction |
| N-8 | :7164 | WR-21 › CONTROL 3: a project that is a DIRECT CHILD of the home directory still resolves to itself | 1 passed / 664 skipped (665) · exit 0 · 76 ms | unmeasured locally, by construction |
| N-9 | :7178 | WR-21 › CONTROL 1 (WR-15 intact): the row-6 spot-check still refuses, naming the dial | 1 passed / 664 skipped (665) · exit 0 · 81 ms | unmeasured locally, by construction |
| N-10 | :7247 | WR-21 › MUTATION PROOF: with the home stop removed, the ancestor IS adopted and IS written to | 1 passed / 664 skipped (665) · exit 0 · 191 ms | unmeasured locally, by construction |
| N-11 | :7315 | WR-21 › EMPTY INPUT: a home directory that cannot be determined degrades to the KIT, not to a walk | 1 passed / 664 skipped (665) · exit 0 · 101 ms | unmeasured locally, by construction |
| N-12 | :7350 | WR-21 › PRECEDENCE: a configuration beats the same directory's marker; the home stop beats both | 1 passed / 664 skipped (665) · exit 0 · 82 ms | unmeasured locally, by construction |
| W-20 | :7384 | WR-21 › the published step limit is the one the walk has, driven from the sentence itself | 1 passed / 664 skipped (665) · exit 0 · 102 ms | unmeasured locally, by construction |
| N-14 | :7469 | WR-21 › INNER: a vendored kit's in-repo configuration no longer outranks the repository's own | 1 passed / 664 skipped (665) · exit 0 · 104 ms | unmeasured locally, by construction |
| N-15 | :7484 | WR-21 › INNER, non-vacuous: where the repository root carries NO configuration, the nested one still answers | 1 passed / 664 skipped (665) · exit 0 · 46 ms | unmeasured locally, by construction |
| N-16 | :7502 | WR-21 › BELOW-HOME, recorded as R-31-19-01: a below-home ancestor configuration still governs | 1 passed / 664 skipped (665) · exit 0 · 43 ms | unmeasured locally, by construction |
| N-17 | :7746 | CR-13 › GREEN 1 (CR-13 / row 8): a repository ROOTED AT HOME reads its OWN dial | 1 passed / 664 skipped (665) · exit 0 · 39 ms | unmeasured locally, by construction |
| N-18 | :7775 | CR-13 › GREEN 1b (the home-rooted INSTALLED project): the installer's own marker is not consulted | 1 passed / 664 skipped (665) · exit 0 · 116 ms | unmeasured locally, by construction |
| N-19 | :7785 | CR-13 › GREEN 1c (the re-check's tree (b), DECIDED): dotfiles + a shared install resolve to HOME | 1 passed / 664 skipped (665) · exit 0 · 38 ms | unmeasured locally, by construction |
| N-20 | :7798 | CR-13 › RED 2 (the VENDORED KIT at a home candidate position): the NESTED project's dial governs | 1 passed / 664 skipped (665) · exit 0 · 115 ms | unmeasured locally, by construction |
| N-21 | :7825 | CR-13 › RED 2b (the MODULE'S OWN position at home): the running kit is not a project | 1 passed / 664 skipped (665) · exit 0 · 137 ms | unmeasured locally, by construction |
| N-22 | :7855 | CR-13 › INVARIANCE 1: `mkdir -p $HOME/.grugops/agent-factory` does not move the verdict | 1 passed / 664 skipped (665) · exit 0 · 77 ms | unmeasured locally, by construction |
| N-23 | :7869 | CR-13 › INVARIANCE 2: `touch $HOME/.grugops/install.json`, empty and `{}`, does not move the verdict | 1 passed / 664 skipped (665) · exit 0 · 112 ms | unmeasured locally, by construction |
| N-24 | :7889 | CR-13 › INVARIANCE 3: GRUGOPS_HOME unset, redirected, empty and $HOME all give one verdict | 1 passed / 664 skipped (665) · exit 0 · 154 ms | unmeasured locally, by construction |
| N-25 | :8130 | CR-13 › GREEN 3 (the MARKER-ONLY home): a home carrying `.git` and no configuration yields nearest | 1 passed / 664 skipped (665) · exit 0 · 40 ms | unmeasured locally, by construction |
| N-26 | :8152 | CR-13 › CONTROL 1 (verification row 9 / R-31-19-01): the tree one level BELOW home is unmoved | 1 passed / 664 skipped (665) · exit 0 · 45 ms | unmeasured locally, by construction |
| N-27 | :8165 | CR-13 › CONTROL 2 (31-15's own spot-check): an ordinary project's refusal still names the dial | 1 passed / 664 skipped (665) · exit 0 · 79 ms | unmeasured locally, by construction |
| N-28 | :8176 | CR-13 › CONTROL 3 (a repository directly under home): still resolves to itself | 1 passed / 664 skipped (665) · exit 0 · 76 ms | unmeasured locally, by construction |
| N-29 | :8199 | CR-13 › EMPTY: a home directory that cannot be determined still stops the search entirely | 1 passed / 664 skipped (665) · exit 0 · 116 ms | unmeasured locally, by construction |
| N-30 | :8415 | CR-13 › MUTATION 1: the MARKER requirement removed breaks GREEN 2 and GREEN 4, and nothing else | 1 passed / 664 skipped (665) · exit 0 · 140 ms | unmeasured locally, by construction |
| N-31 | :8443 | CR-13 › MUTATION 3: the KIND conjunct removed breaks RED 2 and NOT GREEN 1 / 1b / 1c | 1 passed / 664 skipped (665) · exit 0 · 150 ms | unmeasured locally, by construction |
| N-32 | :8460 | CR-13 › MUTATION 4: the MODULE-OWN exclusion removed breaks RED 2b and NOT GREEN 1 or RED 2 | 1 passed / 664 skipped (665) · exit 0 · 145 ms | unmeasured locally, by construction |
| N-33 | :8541 | CR-13 › R-31-19-06 OCCUPIED BY CONSTRUCTION (a): THREE operations make a bare home adoptable | 1 passed / 664 skipped (665) · exit 0 · 78 ms | unmeasured locally, by construction |
| N-34 | :8555 | CR-13 › R-31-19-06 OCCUPIED BY CONSTRUCTION (b): ONE operation degrades a governed answer to the kit | 1 passed / 664 skipped (665) · exit 0 · 88 ms | unmeasured locally, by construction |
| W-21 | :8605 | CR-13 › R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED | 1 passed / 664 skipped (665) · exit 0 · 147 ms | unmeasured locally, by construction |

**Plus the two new rows this plan adds for 33-31 to watch:** W-ENV and W-HOME (both ✓ here; on win32 the same ladder is asked on the 8.3 axis for the first time).

## Task Commits

1. **Decision before code** — `f20d398a` (docs): D-33-R3-01 into STATE.md
2. **Task 1 RED** — `fd431918` (test): W-ENV failing, W-HOME premise
3. **Task 1 GREEN + Task 2 twins** — `a59321ae` (feat): module, tests, `scripts/context-io.js`, `hooks/hook-entry.ts/.js`, WF16 line 55, disposition row

**Plan metadata:** see the final `docs(33-24)` commit (SUMMARY, STATE, ROADMAP, REQUIREMENTS).

## Files Created/Modified

- `scripts/context-io.ts` — `homeBoundary` second spelling and the env tier through `canonicalDirectoryPath`; `TRUSTED_ROOT_TIERS[1]` + the `trustedRepoRoot` docblock say so
- `scripts/context-io.js` — rebuilt twin
- `scripts/context-io.test.ts` — `tmp15` through the export; four home comparisons and three env-tier expectations through the export; W-ENV, W-HOME; one-line label on the rung-identity property
- `hooks/hook-entry.ts`, `hooks/hook-entry.js` — module hash of `scripts/context-io.js` regenerated
- `agent-factory/workflows/16-context-read-write.md` — tier-1 line
- `docs/audit/29-style-dispositions/33-24.md` — the one LANG-03 disposition row
- `.planning/STATE.md` — D-33-R3-01

## Decisions Made

- D-33-R3-01 (above), `assumption_delta = promote`.
- The WF16 tier-1 sentence changed with the program rather than staying "made absolute": the test asserts the two lists equal in both directions in structure, not text, but the plan's rule ("a mechanism sentence changed in one must change in both") is the one that keeps the prose honest.
- The three env-tier cases with a bare `resolve()` expectation were changed to derive through the export rather than kept — a `resolve()` on the test side is a second spelling authority, the very shape row 236 was.

## Deviations from Plan

**1. [Rule 3 - Blocking] LANG-03 disposition row for the WF16 line**
- **Found during:** Task 1 (updating the WF16 tier-1 sentence the plan told me to keep in step with `TRUSTED_ROOT_TIERS`)
- **Issue:** `agent-factory/workflows/16-context-read-write.md` is in the LANG-03 watched corpus; `node scripts/check-diff-disposition.js` -> `FAIL ... 16-context-read-write.md:55 (added) — no disposition row`, exit 1 — the ubuntu CI leg's repository-gates step would go red
- **Fix:** `docs/audit/29-style-dispositions/33-24.md`, one row (the removed side already has a row in `31-27.md`); gate -> `PASS 0 findings over 39/39 elements`
- **Files modified:** docs/audit/29-style-dispositions/33-24.md (created)
- **Committed in:** a59321ae

**2. [Rule 1 - Bug] Three env-tier expectations spelled by a second authority**
- **Found during:** Task 1 GREEN run (`3 failed | 662 passed`)
- **Issue:** 30-11 RA2-1, 30-11 RA4-2 and the 31-27 4-host control compared the env tier's answer to `resolve(...)` — a lexical spelling; on darwin `/tmp` -> `/private/tmp`. The plan's action paragraph predicted exactly this arm ("on darwin a raw `/var/...` plant answers `/private/var/...`").
- **Fix:** expectations derive through `mod.canonicalWorkingDirectory(...)`; comments rewritten to say why
- **Files modified:** scripts/context-io.test.ts
- **Verification:** 665/665
- **Committed in:** a59321ae

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug). **Impact:** both inside the plan's stated scope (WF16 in step with the program; the predicted env-tier arm). No scope creep; no platform conditional; no package installed.

## Issues Encountered

- `gsd_run check tdd-red-evidence` parses node:test-style TAP summaries; vitest's `tap` (nested) and `tap-flat` (no trailer) reporters both classified as `zero_tests_discovered`. Resolved by appending a trailer derived from the tap-flat `ok`/`not ok` lines (derivation recorded inside the record); verdict `RED_EVIDENCE_OK`.
- `npm run check:build-parity` is red between an edited `.ts` and its commit by construction (it diffs the tracked `.js` against HEAD); green on the committed tree, as quoted.

## Known Stubs

None. No placeholder values, no skipped tests, no unrun `<verify>` other than the 8.3 axis, which is already WINDOWS.md row 236 (`unrun-verify`, owner round 3) — not appended again; it stays `open` until plan 33-31's pushed run disposes it, per the plan's prohibition on flipping a row on a local green.

## Threat Flags

None new. The three trust boundaries in the plan's threat model (T-33-111 home boundary, T-33-112 env tier, T-33-113 fixture authority, T-33-114 manifest hash) are each mitigated as planned and each has a test or a gate quoted above. No new endpoint, auth path or schema.

## Next Phase Readiness

- Plan 33-25 onward can build on a module with one spelling authority on every arm WR-05 named.
- Plan 33-31's pre-push inventory has its 35 (+2) rows; the pushed run is the only measurement of the 8.3 axis.
- What this host cannot say: whether `RUNNER~1`-rooted temp fixtures and `runneradmin`-spelled walks now agree on windows-latest. `unmeasured locally, by construction`.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

- 8/8 files present on disk; 3/3 task commits found in git log (`f20d398a`, `fd431918`, `a59321ae`); `commits: 3` measured from the ledger base `1bd53b164ed03135599dcc1cee18b7006547bb42` (`git rev-list --count`), not narrated.
