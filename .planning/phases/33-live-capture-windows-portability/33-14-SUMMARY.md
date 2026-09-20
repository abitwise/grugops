---
phase: 33-live-capture-windows-portability
plan: 14
subsystem: testing
tags: [windows, path-separator, posix, d-15, cap-02, check-public-docs-vocabulary, corpus-member, check-banned-claims, check-flip-manifest, tdd, mutation-proof]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-03's `scripts/posix-path.ts` (`toPosixWith(path, separator = sep)`) and the `scanKey` shape this plan mirrors; 33-07's flip gate as the second consumer of the corpus; 33-09's CI measurement (run 35499800942 § 2.4 rows W-1..W-10, § 2.5 (a)) naming the boundary"
provides:
  - "`corpusMember(rel, separator = sep)` exported from `scripts/check-public-docs-vocabulary.ts` — the ONE member-forming site of the public-docs corpus, `toPosixWith` imported from `./posix-path.js`; `walkFiles` publishes `acc.push(corpusMember(rel))`"
  - "Tests T, U, V in `scripts/check-public-docs-vocabulary.test.ts`: the separator seam (win32.sep on a POSIX host), the live corpus's separator independence against `git ls-files -- examples`, and the site pin (exactly one call, inside `walkFiles`)"
  - "The examples-part relationship case: `git ls-files -- examples` ∩ `isCanonicalMarkdownName` == the examples part, both directions, converse over the complement"
  - "Per-arm probe record for every consumer of `publicDocsCorpus()` / `publicDocsScan()` (below)"
affects: [33-20 pushed CI run, 33-23 ledgers (WINDOWS.md row 229, deferred-items.md), check-banned-claims, check-flip-manifest, check-audit-register]

# Actuals (#2632) — chars/4 over the realized diff (three files, ledger f93f46d8..HEAD), never a harness token count.
actuals:
  tokens: 5483
  tasks: 2
  commits: 3
plan_head_before: f93f46d869cab84de27b4f517c68a29ab01df62d

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A walked part's member is formed through one exported, separator-parameterized function at the accumulation site (`corpusMember`, mirroring `scanKey`); the recursion's `join` stays host-spelled because it composes a location the walk opens, not a spelling it publishes"
    - "Mutation proof on a POSIX host must go through the committed .js: the suite imports `./x.js`, so an identity-body mutant in the .ts is invisible until `tsc` emits it — and `noUnusedParameters`/`noEmitOnError` refuse to emit a mutant that drops its parameter"
    - "Pin the relationship, not the integer: both sides of a set equality derived (git on one side, the module on the other), with the converse over the complement stated even when vacuous"

key-files:
  created: []
  modified:
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts

key-decisions:
  - "Exactly one `corpusMember` call, at `acc.push` — the walk's over-budget refusal message keeps its `join(rel, entry)` spelling because Test V pins the call count at one per the plan; the message names the entry the walk stopped opening, is never compared, and no test pins its spelling (recorded as the fourth partition row below)"
  - "`bannedClaimScanOverlap()` stays 2 and is expected to read 2 on Windows: both overlap members (`agent-factory/README.md` in kit+publicDocs, `docs/GUARANTEES.md` in publicDocs+guarantees) reach the corpus through named literals, never through the walk, so the examples spelling could not move the overlap — it moved the tracked-path equality (W-1..W-3) instead"
  - "The plan's claim that check-audit-register's kit derivation is spelled through check-kit-refs's `relKey` is corrected by reading: it is `listRoles(ROOT).map(f => `${ROLES_SUBPATH}/${f}`)` — a `/` literal over bare readdir names — POSIX by construction, so the union with `publicDocsScan()` matches on every host without either module normalizing"
  - "No pin moved: `PUBLIC_DOCS_SCAN_COUNT` 11, `BANNED_CLAIM_SCAN_COUNT` 120, flip-manifest `publicDocs 12` / pinned 28 all byte-identical before and after on this host (POSIX no-op), so there was nothing to re-derive and `package.json` is untouched"

patterns-established:
  - "RED-first through the export's absence: the target test fails `corpusMember is not a function` (classified RED_EVIDENCE_OK), GREEN adds the function and its one call, and a separate compiled identity-body mutant reproduces the Windows spelling on darwin"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The corpus publishes one spelling per document on every host: `corpusMember` forms every walked member through `toPosixWith` at the accumulation site, proven in the win32 spelling on this POSIX host and mutation-proven against a compiled identity body"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#Test T: a backslash-walked member is published with forward slashes, a POSIX one is unchanged, and `/` is the identity"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#Test U: the live corpus is separator-independent — no member carries a backslash, every member is its own win32-formed spelling, and the examples part equals `git ls-files -- examples` both ways"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#Test V: the SITE, not a consumer — the module calls corpusMember exactly once outside its own definition, and that call is inside walkFiles"
        status: pass
      - kind: other
        ref: "mutation proof (uncommitted): `void toPosixWith; void separator; return rel;` compiled → Test T `expected 'examples\\03-ticket-to-pr.md' to be 'examples/03-ticket-to-pr.md'`, 1 failed / 30 passed; restored → 31 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every consuming arm probed over the fixed module with its ten CI titles passing on this host, the flip gate's part line quoted, the audit-register and vocabulary gates at exit 0, and the examples part pinned as a derived relationship"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list (+ THE MISSING DIRECTION, THE EQUALITY)"
        status: pass
      - kind: unit
        ref: "scripts/check-flip-manifest.test.ts#exits 0, names the status it read, and prints every part with the derived total beside the pin (+ the six converse/control titles W-5..W-10)"
        status: pass
      - kind: unit
        ref: "scripts/check-public-docs-vocabulary.test.ts#Task 2: the examples part equals `git ls-files -- examples` ∩ isCanonicalMarkdownName as a set, both directions — a sixth or renamed example moves both sides together"
        status: pass
      - kind: other
        ref: "node scripts/check-flip-manifest.js → `publicDocs 12 … derived total 28, pinned 28`, ALL CHECKS PASSED; npm run check:audit-register / check:banned-claims / check:public-docs → exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The ten windows-latest CI titles (W-1..W-10 on run 35499800942) are green on the pushed run"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "The mechanism is reproduced on darwin through the separator seam; the CI leg's conclusion is measured only by plan 33-20's pushed run (CAP-02 stays an edge row until that run's own conclusion field reads success)"

# Metrics
duration: 16 min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 14: The corpus member is formed once, in POSIX, at the walk — ten windows reds closed by mechanism Summary

**`publicDocsCorpus()` now publishes every `examples/` member through one separator-parameterized `corpusMember` at the walk's accumulation site (D-15), proven in the win32 spelling on this POSIX host and mutation-proven against a compiled identity body; every consumer arm — banned-claims (3 titles), flip-manifest (7 titles, `publicDocs 12`), audit-register, the gate itself — was probed over the fixed module and no integer pin moved.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-20T20:39:34Z
- **Completed:** 2026-09-20T20:55:46Z
- **Tasks:** 2 (Task 1 RED → GREEN, Task 2 one commit; 3 commits)
- **Files modified:** 3 (`scripts/check-public-docs-vocabulary.ts`, its committed `.js`, `scripts/check-public-docs-vocabulary.test.ts`)

## Accomplishments

- **Task 1 (the fix, red-first):** `export function corpusMember(rel: string, separator: string = sep): string { return toPosixWith(rel, separator); }` sits beside `walkFiles` with a docblock in `scanKey`'s shape; `walkFiles` now reads `acc.push(corpusMember(rel))`; `toPosixWith` is imported from `./posix-path.js` (`grep -a -c 'from "./posix-path.js"'` → `1`; `grep -c 'split(sep)'` → `0`). The recursion's `join(rel, entry)` is unchanged. The committed `.js` moved in the same commit (`bb784148`); `npm run check:build-parity` → `ALL CHECKS PASSED` after it landed.
- **Tests T, U, V** in `scripts/check-public-docs-vocabulary.test.ts` (31 cases, up from 28): T is the one assertion that discriminates on this host (`corpusMember("examples\\03-ticket-to-pr.md", win32.sep)` → `examples/03-ticket-to-pr.md`; a POSIX member unchanged; identity under `/`; the default is the two-argument form under `sep`); U walks the live corpus (no backslash, `m === corpusMember(m, win32.sep)`) and compares the examples part with `spawnSync("git", ["ls-files", "--", "examples"])` as sets in both directions; V reads the module source, drops comment lines, and asserts exactly one `corpusMember(` call outside the definition, located between `function walkFiles(` and the next top-level declaration, spelled `acc.push(corpusMember(rel))`.
- **Task 2 (every arm probed):** the three `check-banned-claims.test.ts` titles and the seven `check-flip-manifest.test.ts` titles the CI run named are shown passing by title (record below); `node scripts/check-flip-manifest.js` prints `publicDocs 12` with all five examples forward-slashed and `ALL CHECKS PASSED`; `npm run check:audit-register`, `check:banned-claims`, `check:public-docs` all exit 0; the relationship case pins the examples part to `git ls-files -- examples` ∩ `isCanonicalMarkdownName` (32 cases in the file).
- **Post-wave gate green:** `npx tsc --noEmit` OK; `npx vitest run --exclude '**/scripts/e2e/**'` → 78 files, 5358 passed | 2 skipped (5360), 487 s, exit 0; `npm run check:nul-bytes` → `ALL CHECKS PASSED`; test typecheck (`tsc -p tsconfig.tests.json --noEmit`) OK. `npm test` was not run.

## Task Commits

1. **Task 1 (RED):** `6681ead5` — `test(33-14): add failing tests for the POSIX corpus member formed once at the walk (D-15, CAP-02)`
2. **Task 1 (GREEN):** `bb784148` — `feat(33-14): form the public-docs corpus member once, in POSIX, at the walk's publishing site (D-15, CAP-02)`
3. **Task 2:** `4fe84114` — `test(33-14): pin the examples part as a relationship — git ls-files ∩ isCanonicalMarkdownName, both directions`

**Plan metadata:** see the final `docs(33-14)` commit.

### RED evidence (Task 1, quoted from the red run)

`npx vitest run --exclude '**/scripts/e2e/**' scripts/check-public-docs-vocabulary.test.ts` at `6681ead5` (test only, module untouched): exit 1, `Tests  3 failed | 28 passed (31)`.

- `Test T: …` — `TypeError: corpusMember is not a function`
- `Test U: …` — `TypeError: corpusMember is not a function`
- `Test V: …` — `AssertionError: call lines: : expected [] to have a length of 1 but got +0`

Record built from the vitest JSON (translated to the TAP shape) and classified by `gsd-tools check tdd-red-evidence`: `RED_EVIDENCE_OK` / `target_test_failed` for Test T as the target (and again with Test V as the target). GREEN at `bb784148`: `Tests  31 passed (31)`.

### Mutation proof (the Windows spelling on darwin)

The suite imports `./check-public-docs-vocabulary.js`, so a mutant must be COMPILED to be seen — an identity body in the `.ts` alone left the run at 31 passed (recorded as a pattern above, not as a finding). Two further mutants failed to emit under `noEmitOnError`: `return rel;` (TS6133 on the unused parameter) and `void separator; return rel;` (TS6133 on the unused `toPosixWith` import). The compilable mutant `void toPosixWith; void separator; return rel; // MUTANT` built and ran:

```
× Test T: a backslash-walked member is published with forward slashes, a POSIX one is unchanged, and `/` is the identity
AssertionError: expected 'examples\03-ticket-to-pr.md' to be 'examples/03-ticket-to-pr.md' // Object.is equality
      Tests  1 failed | 30 passed (31)
```

Tests U and V stayed green under the mutant on this host, as designed: U is the production consequence (a no-op check on POSIX, the measurement on windows-latest) and V pins the site. The `.ts` was restored from a scratch copy, `tsc` re-run (`grep -c MUTANT` → 0 in both files), and the suite read 31 passed again before the GREEN commit.

### The four-part partition (what publishes what, and why only one part needed the fix)

| Part | How its members are spelled | Host separator reachable? | Change |
|---|---|---|---|
| `root` | bare names from one `readdirSync(ROOT)` — no separator in any member | no | none |
| `examples` | `walkFiles` composes `join(rel, entry)` (host) and PUBLISHES through `corpusMember(rel)` | was yes; now normalized at formation | **the fix** |
| `kitReadme` | the literal `"agent-factory/README.md"` | no | none (verified by reading) |
| `guarantees` | `OUT` imported from `generate-guarantees.js`, a forward-slash literal | no | none (verified by reading) |

Fourth row of the partition, recorded rather than hidden: `walkFiles`'s over-budget refusal message interpolates `join(rel, entry)` (host-spelled) to name the entry at which the walk stopped opening entries. It is a message about a location, it is never compared by any consumer, no test pins its spelling, and Test V pins the call count at exactly one per the plan — so it is deliberately not routed through `corpusMember`. If a later round wants it POSIX, the change is a second call inside `walkFiles` and a count of two in Test V, both in this module.

## Per-arm probe record (Task 2)

Command: `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts scripts/check-flip-manifest.test.ts scripts/check-public-docs-vocabulary.test.ts` → exit 0, `Test Files  3 passed (3)`, `Tests  200 passed (200)` (199 before the Task 2 case).

**`check-banned-claims.ts` (`publicDocsMembers()` = `publicDocsCorpus().slice().sort()`, dedupe via `scanKey`, overlap via `bannedClaimScanOverlap`).** Where the changed value goes next: the examples members enter the `publicDocs` part already POSIX, so on Windows they now equal their `git ls-files` spellings in the tracked-surface equality. Expectation: **contradicted before, now met** for the three titles; **unchanged** for the overlap.

- `✓ … the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list` (W-1)
- `✓ … THE MISSING DIRECTION: every scan member is a TRACKED path, and an intruder is NAMED` (W-2)
- `✓ … THE EQUALITY, so nothing is dropped in silence: surfaced == admitted + excluded-by-name` (W-3)
- `✓ … the live tree's walked parts carry no host separator in any member, on every host` — carries the `bannedClaimScanOverlap()` `toBe(2)` pin (IN-05). Re-derived on this host through the module rather than trusted: parts `kit 75, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1`, `overlap: 2`, members `agent-factory/README.md` (kit+publicDocs) and `docs/GUARANTEES.md` (publicDocs+guarantees). Both overlap members reach the corpus through NAMED LITERALS (`kitReadmeMembers`, `guaranteesMembers`) and reach their other part through 33-03's `scanKey` or a literal, so they were already one spelling on Windows after 33-03; the five examples members live in `publicDocs` only. The Windows value is therefore expected to be 2 as well — the overlap counts documents present in two parts under one spelling, and no examples document is in two parts. The pin did not move and was not edited.
- `npm run check:banned-claims` → exit 0: `PASS  LANG-04: 120 document(s) … kit 75, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1, overlap 2 …` — `ALL CHECKS PASSED`.

**`check-flip-manifest.ts` (`deriveParts`: `publicDocs = publicDocsCorpus().slice().sort()`, compared against `33-FLIP-MANIFEST.md` § 1.5's forward-slash listing).** Where the changed value goes next: the derived side is now POSIX on every host and the listed side always was, so `derived but not listed: [examples\03-ticket-to-pr.md]` cannot recur. Expectation: **contradicted before, now met** for all seven.

- `✓ … exits 0, names the status it read, and prints every part with the derived total beside the pin` (W-4)
- `✓ … CONVERSE 1: the same cell surviving OUTSIDE the live-surface set (a plan record, an excluded ledger) passes` (W-5)
- `✓ … the same surviving cell does NOT fail the gate in the pre-capture state — before the flip those cells are correct` (W-6)
- `✓ … CONVERSE 2: every cell carrying a well-formed citation to an existing summary section passes` (W-7)
- `✓ … CONVERSE: a GAP-D1 line WITHOUT a deferral marker (the discharge note) passes, and so does the exempt history line` (W-8)
- `✓ … the flip commit is DERIVED from history — a later commit on top does not move the comparison` (W-9)
- `✓ … CONVERSE: an explicit --range over exactly the declared set passes in the discharged state` (W-10)
- `node scripts/check-flip-manifest.js` → exit 0, quoted:
  `[derivation] live-surface parts: publicDocs 12, docsTree 7, planningLedgers 5, archivedRecords 4, runtimeEvidence 1; overlap 1; derived total 28, pinned 28`
  `[derivation]   publicDocs: AGENTS.md, CHANGELOG.md, CLAUDE.md, CONTRIBUTING.md, README.md, agent-factory/README.md, docs/GUARANTEES.md, examples/01-greenfield-bootstrap.md, examples/02-brownfield-bootstrap.md, examples/03-ticket-to-pr.md, examples/04-sprint-cycle.md, examples/05-release-run.md`
  `ALL CHECKS PASSED`

**`check-audit-register.ts` (vouching set = `[...new Set([...publicDocsScan(), ...derived])]`).** Where the changed value goes next: a registry-arm file must be a member of the union; a smaller set produces more findings, so this arm fails closed and the fix can only remove findings on Windows, never add them. The kit side of the union is spelled `listRoles(ROOT).map((f) => `${ROLES_SUBPATH}/${f}`)` (and the workflows twin) — a `/` literal over bare `readdir` names, POSIX by construction — NOT through check-kit-refs's `relKey` as the plan's read_first stated; corrected by reading, the conclusion (spellings match on every host) holds either way. Expectation: **unchanged**. `npm run check:audit-register` → exit 0, `ALL CHECKS PASSED`.

**The vocabulary gate itself.** Its PASS line prints per-part counts and its FAIL lines print the published member as `path:line:text`. `node scripts/check-public-docs-vocabulary.js` over the real tree → exit 0: `PASS  AUDIT-02: 11 public document(s) carry zero retired vocabulary — root 4, examples 5, kitReadme 1, guarantees 1; 1 exempted by name (CHANGELOG.md …)`. Over a planted mirror (`CHECK_ROOT`, a sixth example carrying the retired path form) the printed member is the published form: `FAIL  retired path form "agent-factory/handoffs/" survives in a public document — examples/99-planted.md:3:See `agent-factory/handoffs/product-handoff.md` here.` — forward-slashed on this host as it always was; the point is that the printed spelling and the published spelling are now the same string on every host. `npm run check:public-docs` → exit 0, `ALL CHECKS PASSED`. Expectation: **unchanged** (`PUBLIC_DOCS_SCAN_COUNT` 11, per-part breakdown byte-identical before and after on this host).

**The 30-10 B-8 consumer census** (`the tree's consumers of each accessor are EXACTLY the declared ones, both directions`) stays green: the new import is INTO the authority, which the census excludes by identity, and `posix-path.ts` names neither accessor.

## Files Created/Modified

- `scripts/check-public-docs-vocabulary.ts` — `import { join, sep } from "node:path"`, `import { toPosixWith } from "./posix-path.js"`, the exported `corpusMember` with its docblock, `acc.push(corpusMember(rel))`, and one sentence on the `examples` part naming it as the corpus's only walked part
- `scripts/check-public-docs-vocabulary.js` — rebuilt in the GREEN commit; parity green
- `scripts/check-public-docs-vocabulary.test.ts` — imports `sep`, `win32`, `corpusMember`, `isCanonicalMarkdownName`; the `trackedExamples()` helper (`spawnSync("git", ["ls-files", "--", "examples"])` from `ROOT`); the 33-14 describe with Tests T, U, V and the Task 2 relationship case (32 cases, up from 28)

## Decisions Made

- **One call, at the accumulation.** The over-budget refusal message keeps `join(rel, entry)` (see the partition's fourth row) because the plan pins exactly one `corpusMember` call and the message is a location the walk names, never a member a consumer compares.
- **The overlap pin is re-derived, not trusted, and not moved.** `bannedClaimScanOverlap()` is 2 on this host with its two members named; the Windows expectation is 2 for the structural reason recorded above.
- **The plan's `relKey` attribution for check-audit-register is corrected** (it is a `/`-literal template over bare names); the arm's expectation is unchanged.
- **Test U keeps a RAW `git ls-files` comparison with a stated premise** (every tracked entry under `examples/` is canonical markdown today, asserted by name), while the Task 2 case is the relationship that survives a non-markdown file — two cases, two questions, neither an integer.

## Deviations from Plan

None — plan executed as written. Two clarifications, recorded rather than deviations: the mutation proof needed the mutant compiled (the suite reads the committed `.js`), and two of three candidate mutants were refused by `noEmitOnError` before the compilable one reproduced the Windows spelling; and the audit-register spelling attribution in the plan's read_first was corrected by reading, with no change to that arm's conclusion.

## Issues Encountered

- `npm run check:build-parity` reads `1 CHECK(S) FAILED` while a rebuilt `.js` is uncommitted (expected — the same observation 33-12 recorded); it read `ALL CHECKS PASSED` immediately after `bb784148` landed the `.ts`/`.js` pair together.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The ten CI titles W-1..W-10 are closed by mechanism on darwin; their conclusion on windows-latest is plan 33-20's measurement (D3 above is human-routed for exactly that reason). WINDOWS.md row 229 and the `deferred-items.md` item "`publicDocsCorpus()` publishes its `examples/` members host-separated" stay `open` per the plan — plan 33-23 resolves them after 33-20 measures.
- No consumer needs a follow-up edit: banned-claims, flip-manifest and audit-register all read the corrected member with no change of their own, which is the D-15 shape working as intended.
- CAP-01 and CAP-03 untouched by this plan.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 3 modified files present on disk; 3 task commits present in history; `commits: 3` measured from ledger `f93f46d869cab84de27b4f517c68a29ab01df62d`.
