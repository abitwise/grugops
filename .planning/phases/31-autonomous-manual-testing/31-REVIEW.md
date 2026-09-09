---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-09T15:45:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/29-style-dispositions/31-16.md
  - docs/audit/29-style-dispositions/31-17.md
  - docs/audit/29-style-dispositions/31-18.md
  - docs/audit/29-style-dispositions/31-19.md
  - docs/audit/31-round4-residuals.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/checkpoints.js
  - scripts/checkpoints.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts
  - scripts/runnable-ref/fixtures/playwright-test.d.ts
  - scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts
  - scripts/runnable-ref/fixtures/testinfo-fixture-param.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
findings:
  critical: 5
  warning: 4
  info: 2
  total: 11
status: issues_found
---

# Phase 31: Code Review Report (incremental — gap-closure round 4, plans 31-16..31-20)

**Reviewed:** 2026-09-09T15:45:00Z
**Depth:** standard
**Scope:** `a16786b..HEAD` (19f72e1), the 25 source files listed above
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This round was convened to close CR-09 (the `()` marker defeating both whole-path arms), CR-10 (the
`testInfo` fixture-parameter spelling), CR-11 (a promotion destroying a destination note), WR-17
(the caller-supplied proof operand), WR-18 (the dial read for readability only), WR-19 (the
per-frame step bound and the uncaught `RangeError`), WR-20 (the scope-blind canonicaliser), WR-21
(the unbounded governance-root walk) and IN-10.

**All nine are closed as filed**, and every closure below was re-measured on this tree against the
committed `.js`, not taken from a summary. Baseline health, measured here: `npm run freshness` →
`All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` (so the `.js`
provably matches the `.ts` for every file in scope); `node scripts/check-foundation-guards.js` and
`node scripts/check-uat-oracles.js` → `ALL CHECKS PASSED`; `npx vitest run` over
`uat-spec-integrity.test.ts`, `context-io.test.ts`, `context-io-writer-set.test.ts` and
`compactor.test.ts` → `Test Files 4 passed`, `Tests 937 passed`, exit 0 (one transient failure was
my own probe contamination under `.temp/`; after cleanup, green — recorded because
`docs/audit/31-round4-residuals.md` §5 names that exact hazard). `git status --porcelain -- scripts
hooks agent-factory install docs` is empty at the end of this review; every probe directory was
deleted.

**Five new Criticals and four Warnings.** For the fifth consecutive round the pattern repeats
exactly: **every one of this round's four fixes created or preserved a defect one register over,
and the green suite exercises none of them.**

- **The CR-11 fix put a `readFileSync` on the module's single note-write chokepoint.** A non-regular
  file at a note path now makes **every note write in the module hang forever** with zero bytes on
  both streams — the exact hazard `readGovernanceConfigCandidate`'s own 25-line comment 2,400 lines
  below documents, measured and refuses (`scripts/context-io.ts:3382-3401`). Measured: `timeout 10
  node …` → exit 124. Before this round the chokepoint never read the destination.
- **The WR-21 fix reinstated the WR-15 defect at one position.** A repository whose root **is** the
  user's home directory is never inspected, so its `human_admission: high-severity` dial is silently
  replaced by the kit's lean default. Measured: the identical note is **WRITTEN** there and
  **REFUSED** in a control tree one level below home. None of `R-31-19-01..04` names this.
- **The WR-20 fix is a one-line, file-scoped off switch for both canonicalisations.** Measured:
  `it.skip(...)` after `import { test as it }` plus a dead `const it = 1;` → `0 findings`, exit 0.
  Same for a namespace import and for `testInfo.skip()`. WR-14's and CR-10's closures are each one
  unrelated declaration away from being undone. It is disclosed as "coarseness" and asserted green
  by `uat-spec-integrity.test.ts:4742`; the D-21 header calls it "MONOTONE IN THE SAFE DIRECTION",
  which for a **ban** is inverted.
- **The WR-19 fix guarded `findBannedConstructs` and left `ts.createSourceFile` outside the
  boundary.** Measured: 1,000 nested parentheses — a quarter of the round-4 probe's depth —
  reproduce WR-19 verbatim (uncaught `RangeError`, **empty stdout**, exit 1, no measurement line,
  both floors bypassed), falsifying the recipe paragraph added this round at
  `browser-uat-recipe.md:310-315`.
- **The WR-17 fix does not constrain the operand for the ordinary in-repository case.** Measured: an
  origin at `<repo>/tmp/forged` — an ordinary directory a caller authored, in the decline sentence's
  own words — promotes a `human:mallory` finding **and** appends a `disposed_by` GOV-02 ledger line.
  Workflow 18 tells the agent that copy is mechanically refused. It is not.

No `<structural_findings>` block was supplied, so every finding is narrative. Numbering continues
the existing sequences (`CR-12+`, `WR-22+`, `IN-12+`).

## Prior findings status

| Prior | Status | Evidence (measured on this tree, against the committed `.js`) |
|---|---|---|
| CR-09 `expect.configure({retries:2}).soft(...)` / `.configure({soft:true})(...)` pass at exit 0 | **closed** | Probe repo, `node scripts/runnable-ref/uat-spec-integrity.js <root>`: both → `1 finding(s) over 1/1`, EXIT=1, naming `expect.configure().soft` and `expect.configure().configure`. Control `expect.configure({retries:2})(locator)` chained and invoked → `0 findings`, EXIT=0. Closed **by rule**: `stripRoutingLinks` is one normaliser both whole-path arms read; no member added to any set |
| CR-10 `testInfo.skip()` through the second callback parameter | **closed as filed; new bypass → CR-14** | `test("a", async ({page}, testInfo) => { testInfo.skip(); … })` → `1 finding(s)`, EXIT=1, naming `test.info().skip` — the same canonical path the call-link spelling produces. Closed from the parse (`deriveTestInfoParameterNames`), not by a new head member |
| CR-11 a promotion silently overwrites an already-admitted destination note | **closed** | Legitimate `observation` admitted at the destination under id `…-qe-observation-a34610ba`; a forged `finding` reusing that id, authored in a recognised `.grugops/context` origin store, promoted → `DECLINED (destination-id-occupied)`; destination note still `kind: observation`. Closed at the point of effect (`writeNoteFile`) **and** named in the register — but see CR-12 for what the chokepoint read costs |
| WR-17 the proof's left operand is bytes the caller supplies | **closed only for the out-of-repository case → CR-16** | Forged origin outside `.grugops/` and outside the trusted root → `DECLINED (origin-outside-trusted-store)`. An ordinary directory **inside** the repository root still passes; measured in CR-16 |
| WR-18 the dial is read for readability, never for its value | **closed** | Destination dial `off`, note `by: security-nfr` / `kind: finding` / `verified_by: human:mallory` → `DECLINED (human-stamp-not-gated-at-destination)`; same note under `high-severity` → promotes. `isGatedNote` is asked once; no second local composition of the dial |
| WR-19 the 512-step bound restarts per recursion frame; a deep chain kills the process | **closed as filed; the same harm survives one call over → CR-15** | 4000-link call chain `test.a()…skip()` → `0 findings over 1/1`, EXIT=0, stderr empty, measurement line printed. One shared `CalleeStepBudget`, an explicit-stack `forEachDescendant`, and a could-not-run `catch` around `findBannedConstructs` |
| WR-20 a shadowing local binding is falsely refused | **closed as filed; the false refusal survives at one position → WR-23, and the fix opened CR-14** | The review's legitimate spec → `0 findings over 1/1`, EXIT=0 |
| WR-21 the walk climbs into a home-directory-shaped ancestor | **closed for the shape the review reproduced; a new hole at one position → CR-13** | With `HOME` set so the planted ancestor **is** `os.homedir()`, `trustedRepoRoot()` returns the kit. `REPO_BOUNDARY_MARKERS` is 9 members, `TRUSTED_ROOT_STOP_CONDITIONS` publishes 6 stops, `TRUSTED_ROOT_RESIDUALS` carries 8, and `16-context-read-write.md:49-56` is asserted set-equal to the export in both directions with a seeded-fail control |
| IN-10 the configured-soft control is never chained or invoked | **closed** | `configured-soft.uat.spec.ts:44` is now `await expect.configure({ retries: 2 })(page.getByTestId("invoice-total")).toBeVisible();`, and the `MUTATE-REMOVE` region carries all four escapes including the converse inner-link ordering |
| IN-11 baseline / freeze consistency | **re-measured, unchanged** | `npm run freshness` 60/60 fresh, so the committed `.js` in scope matches its `.ts`. The two `DECIDER_MANIFEST` entries moved with their artifacts (`2107434e…` / `2ccb6628…`) |
| IN-04, IN-06, IN-09 | **carried** | Unchanged this round |

## Critical Issues

### CR-12: the CR-11 fix put an unguarded `readFileSync` on the module's single note-write chokepoint, so a non-regular file at a note path makes **every note write hang forever** — the exact hazard this file documents, measured and refuses 2,400 lines below

**File:** `scripts/context-io.ts:982-985` (`if (existsSync(resolvedFinal)) { … existing =
readFileSync(resolvedFinal, "utf8") }`), `:969-1002` (`writeNoteFile`, reached by `appendNote`,
`appendPreAdmittedNote` and `emitTrusted`/`emitVerdict`/`emitCheckpointNote`), `:3382-3401` (the
same file's `readGovernanceConfigCandidate` header — "WHY THIS IS NOT `existsSync` + `readFileSync`
… **readFileSync on a path that is not a regular file BLOCKS** … no exit, zero bytes of stdout and
zero bytes of stderr at 20 seconds … One allowed `mkfifo` turned BOTH guards off"), `:2425-2430`
(`ledgerRecordsId`, the second new instance of the same pair, added by the WR-18 fix)

**Issue:** Before this round `writeNoteFile` never read the destination: it asserted path
containment and called `atomicWrite`, which writes a temp file and renames over whatever is there.
The CR-11 fix added a destination **read** at the chokepoint. `readFileSync` on a FIFO blocks at
`open(2)` until a writer appears; there is no timeout, no `O_NONBLOCK`, and no regular-file check —
all three of which this same module already implements, in the reader written 2,400 lines further
down, for exactly this reason and after exactly this measurement.

**Reproduced on this tree**, against the committed `scripts/context-io.js`:

```
1. io.appendNote(..., precomputedId="…-qe-observation-deadbeef")   -> wrote, EXIT=0     (control)
2. mkfifo <ctx>/T-9/notes/20260909T050000Z-qe-observation-cafe0001.md
3. io.appendNote(..., precomputedId="…-qe-observation-cafe0001")   -> EXIT=124 (timeout 10s)
                                                                      stdout: empty, stderr: empty
```

The same hang was measured on `promoteAdmitted` through a FIFO at
`<repoRoot>/.grugops/audit/admissions.jsonl` (`timeout 15` → exit 124) — there the note file had
**already been written** before the process wedged, so the destination holds a human-disposed
finding with no ledger line, which is precisely what `18-context-compaction.md:83` now claims can
never happen. (The `appendFileSync` half of that path is pre-existing; the `readFileSync` in
`ledgerRecordsId` is new this round.)

Four things make this a BLOCKER rather than a robustness note:

1. **It is on the chokepoint, so it is on every writer.** `appendNote`, `admitAndAppend`,
   `promoteAdmitted`, `emitVerdict` and `emitCheckpointNote` all end on this line. A guard hook that
   emits a checkpoint note hangs the tool call; a PreToolUse hook that never answers is, in this
   project's own measured words, "the same event as an allow".
2. **The failure is silent on both streams.** No exception, no exit code, no diagnostic — the one
   outcome this whole surface is audited against.
3. **The path is caller-influenced.** `promoteAdmitted` takes its id from `sourceId` outright, and
   `appendNote`/`emitTrusted` accept a `precomputedId`; `noteId` composes the rest from `at` and
   `by`. An adversary who can plant one FIFO chooses which write wedges.
4. **The fix already exists in this file.** `readGovernanceConfigCandidate` opens with `O_NONBLOCK`,
   `fstat`s the descriptor, refuses anything that is not a regular file, and closes it. The
   chokepoint needs the same three lines and got none of them.

**Fix:** Read the destination through the same primitive the module already trusts, rather than a
second habit:

```ts
// writeNoteFile: the destination read must not be able to block. A note path occupied by anything
// that is not a REGULAR FILE is not something this write may replace and is not something it may
// wait on — it is the fail-closed refusal below, decided in bounded time.
const existing = readRegularFileOrNull(resolvedFinal); // O_NONBLOCK open + fstat + close, as
                                                       // readGovernanceConfigCandidate already does
if (existing !== null && existing === text) return;    // the decided idempotent case, unchanged
if (existing !== null || pathIsOccupied(resolvedFinal)) throw /* append-only refusal */;
```

Factor that reader out of `readGovernanceConfigCandidate` so there is ONE non-blocking file read in
this module rather than two habits, and route `ledgerRecordsId` through it too. Add a case that
plants a FIFO at a note path and at the ledger path and asserts a bounded refusal — the shape this
round's own probes never exercised, because every one of them wrote into a directory containing only
regular files.

---

### CR-13: the WR-21 fix reinstates the WR-15 defect at one position — a repository whose **root is the user's home directory** never has its dial read, so a self-stamped high-severity finding is WRITTEN where the identical tree one level lower REFUSES it

**File:** `scripts/context-io.ts:3066` (`if (isAtOrAboveHome(dir, home)) return nearest;` — the home
stop is asked **before** the directory is inspected for a configuration or a marker), `:3014-3018`
(`isAtOrAboveHome`), `:3051-3080` (`projectRootFromWorkingDirectory`), `:3305-3325`
(`R-31-19-01`, which names the ancestor-**below**-home case and not this one), `:3107-3140`
(`TRUSTED_ROOT_STOP_CONDITIONS`), `agent-factory/workflows/16-context-read-write.md:54`,
`scripts/context-io.ts:2892-2900` (the same file rejecting `.grugops` as a boundary marker because
it "moves cases in the UNSAFE direction … a configuration moving from refused to admitted, which is
the WR-15 defect this order exists to close")

**Issue:** `S-HOME` wins over `S-BOUNDARY`, and it wins *before* the directory is examined. A
repository rooted at `$HOME` — a dotfiles checkout, or simply an agent run in the home directory —
therefore has both its `.git` marker and its `.grugops/factory.config.json` skipped, and
`trustedRepoRoot()` falls through to `GOVERNANCE_FALLBACK_BASE`, the kit, whose shipped dial is
lean. That is the WR-15 verdict direction exactly: **a configuration moving from refused to
admitted.**

**Reproduced on this tree**, both project-directory variables genuinely removed from the child
environment, against the committed `scripts/context-io.js`:

```
tree:   <H>/.git, <H>/.grugops/factory.config.json {human_admission: high-severity}, cwd <H>/work/sub
HOME=<H>  (so <H> IS os.homedir())
  trustedRepoRoot()  -> /Users/olgeroeselg/Projects/public/grugops     ← the KIT
  dial               -> "off"   (source: ok)
  appendNote(finding, by: security-nfr, verified_by: "human:mallory")  -> WROTE
                        20260909T010000Z-security-nfr-finding-25aa82fe

CONTROL — the identical tree one level BELOW home (<H2>/proj/.git + <H2>/proj/.grugops/…), cwd <H2>/proj/work
  appendNote(the SAME note)  -> REFUSED
                        "admission REFUSED (human_admission: high-severity)"
```

The two runs differ in nothing but whether the repository root is the home directory.

Three things make this a BLOCKER:

1. **It is the defect WR-15 was convened to close, at a reachable position.** The whole point of
   step 3 is that the TARGET repository's dial decides on the four non-CC hosts, where the in-script
   refusal is the only tier available (D-12). Here it does not.
2. **No residual names it.** `R-31-19-01` names a configuration at an ancestor **below** home;
   `R-31-19-02` names `HOME` being process-settable; `R-31-19-03` names degenerate inodes;
   `R-31-19-04` names an unknown VCS marker. A configuration **at** home is in none of them, and the
   register's own contract is that "adding a member without dispositioning it turns a test red
   rather than shipping quietly" — this arrived without a member at all.
3. **The published prose reads the other way.** `16-context-read-write.md` now tells a reader the
   third step is "the repository root's own configuration where the upward search reaches a
   repository root", and lists `S-BOUNDARY` ("ends at the first ancestor carrying a version-control
   marker") as a stop in its own right. For a home-rooted repository the search never reaches the
   root and the marker is never seen.

**Fix:** Make the home stop asymmetric — refuse to climb **past** home, but let the home directory
itself answer when it is the repository:

```ts
for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
  const isHome = isHomeItself(dir, home);
  if (isAboveHome(dir, home)) return nearest;          // never inspect an ANCESTOR of home
  const carriesConfig = governanceConfigCandidates(dir).some(existsSync);
  if (carriesConfig && nearest === null) nearest = dir;
  const isBoundary = REPO_BOUNDARY_MARKERS.some((m) => existsSync(join(dir, m)));
  if (isBoundary) return carriesConfig ? dir : nearest;
  if (isHome) return nearest;                          // home is inspected ONCE, then the walk ends
  …
}
```

That keeps the threat WR-21 named closed — `~/.grugops` alone, with no marker, is still not adopted,
because the shared-install kit root carries no repository marker — while a genuine checkout rooted at
`$HOME` governs itself. Whichever shape is chosen, it is a decision beside D-23 and needs a
`R-31-19-05` member stating the cost, plus a case that plants `.git` **and** a strict dial at the
home directory and asserts the answer.

---

### CR-14: the D-21 (2) declared-name census is a **one-line, file-scoped off switch** for both canonicalisations, so WR-14's and CR-10's closures each evaporate on any spec carrying an unrelated declaration of the head name

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1435` (`if (declaredNames !== null &&
declaredNames.has(segments[0])) return dottedPath;` — the rule is asked once, before either map, for
the WHOLE file), `:1369-1400` (`deriveDeclaredNames`, a file-level census), `:1341-1346` (the
"MONOTONE IN THE SAFE DIRECTION" claim), `:289-297` (the D-21 header's "WHAT D-21 DOES NOT
ESTABLISH"), `:262` (`UNRESOLVABLE_CALLEE_RESIDUALS`, the file-scoped member),
`agent-factory/checklists/browser-uat-recipe.md:192-206`,
`scripts/runnable-ref/uat-spec-integrity.test.ts:4742-4758` (the case that asserts this green)

**Issue:** The census is a per-file set of every name the file declares, and the canonicaliser
returns its input unchanged for any head in it. For a **ban**, returning the input unchanged means
`it.skip` is asked as `it.skip`, whose head is not a banned head — so the construct is admitted.
Suppressing a rewrite is not the safe direction here; it is the only direction in which this rule can
change an answer, and it changes it from *refused* to *accepted*.

**Reproduced on this tree**, against the committed `scripts/runnable-ref/uat-spec-integrity.js`:

```
import { test as it, expect } from "@playwright/test";
it.skip("scenario", async ({ page }) => {
  const it = 1; void it;                            // ← a dead, unrelated declaration
  await expect(page.locator("x")).toBeVisible();
});
                                                    -> 0 findings over 1/1,  EXIT=0
   the SAME file without `const it = 1;`            -> 1 finding(s),          EXIT=1 (`test.skip`)

import * as pw from "@playwright/test";
pw.test.skip("scenario", async ({ page }) => { const pw = 1; void pw; … });
                                                    -> 0 findings over 1/1,  EXIT=0

import { test, expect } from "@playwright/test";
function helper(testInfo: number) { return testInfo; }        // ← index-0 parameter, counted
test("scenario", async ({ page }, testInfo) => { testInfo.skip(); … });
                                                    -> 0 findings over 1/1,  EXIT=0
   the SAME file without `helper`                   -> 1 finding(s),          EXIT=1 (`test.info().skip`)
```

**This is disclosed and it is asserted green** — the residual member at `:262` states the mechanism,
the recipe repeats it at `:200-206`, and `uat-spec-integrity.test.ts:4742` drives the first shape and
asserts `[]` under the header "THE COARSENESS, MEASURED rather than described". Three things make it
a BLOCKER anyway:

1. **The disposition is unpriced.** The register says one declaration suppresses the rewrite for the
   whole file; it does not say that this is a two-line, deliberately-writable evasion of the entire
   rename/namespace/fixture-parameter family. WR-14 and CR-10 were each Critical; both are now one
   dead `const` away from where they were before 31-13 and 31-16.
2. **The header's direction claim is inverted.** `:1341` — "THE RULE IS MONOTONE IN THE SAFE
   DIRECTION. It can only STOP a rewrite" — is the sentence a future reader will rely on when
   deciding whether the census may be widened. Stopping a rewrite is the *unsafe* direction for a
   ban, and the test comment beside it ("the checker says less than it could") states the fact while
   the code comment states the opposite reading of it.
3. **The register's own doctrine forbids this trade being made quietly.** `browser-uat-recipe.md:250`
   — "Widening the rule is a new decision and a gap-closure round, never a quiet edit". Narrowing it
   from three closed spellings to zero for any file that declares a name is the same magnitude of
   change in the other direction, and it arrived inside a fix for a false positive.

**Fix:** Make the suppression as narrow as the false positive it exists for. The parse already
carries enough to do it without a binder: suppress only when the declaration's **enclosing
function/block encloses the call site**, which is a `getStart`/`getEnd` containment test on nodes the
walk already visits:

```ts
// A declaration suppresses a rewrite only for call sites INSIDE the declaration's own scope node.
// deriveDeclaredNames records { name, start, end } of the enclosing function/block; the canonicaliser
// is asked with the CALL's position and suppresses only when some record contains it.
if (declaredNames.someContaining(segments[0], callStart)) return dottedPath;
```

That refuses WR-20's spec (the `it` parameter's scope is `inner`, which does not contain the
scenario call) and keeps `it.skip` at module scope refused. If the range test is judged too much,
then the disposition must be re-taken explicitly: record it as a decision beside D-21, state in the
recipe's "Deliberately outside the rule" list that **a spec author can disable the canonicalisation
for a file with one declaration**, and correct `:1341` so it does not call a false-negative widening
the safe direction.

---

### CR-15: `ts.createSourceFile` sits **outside** the could-not-run boundary the WR-19 fix added, so WR-19's exact harm reproduces at a quarter of the round-4 probe's depth — and the recipe paragraph added this round asserts it cannot

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1605` (the `createSourceFile` call, in no
`try`), `:1613-1630` (the `try`/`catch` that covers `findBannedConstructs` alone), `:260-270` (D-21
(1)'s claim that the exit code is "inside the D-12 contract BY DECISION on every path"),
`agent-factory/checklists/browser-uat-recipe.md:309-315` ("The checker holds these three codes by
decision on every path it can take, **including a pathological one**: it does not exit through an
uncaught exception"), `:820-880` (`deriveSpecPaths`'s `walk`, a second self-recursive descent the
fix did not touch)

**Issue:** WR-19's harm was never "the resolver recurses" — it was "an uncaught throw means
`reportMeasured` is never reached, so the vacuity floor and the denominator floor are bypassed by
construction while stdout stays silent". The fix bounded the resolver, de-recursed the AST walk, and
wrapped `findBannedConstructs`. It did not wrap the **parser**, which is a recursive-descent parser
running on attacker-or-author-controlled source, one line above the `try`.

**Reproduced on this tree**, against the committed `.js` (a spec containing
`const x: any = ((((…1…))));`):

```
depth  500 nested parens -> UAT spec integrity: 0 findings over 1/1 uat specs checked   EXIT=0
depth 1000 nested parens -> EXIT=1   stdout: (empty)
                            stderr: RangeError: Maximum call stack size exceeded
                                      at …/node_modules/typescript/lib/typescript.js:33775 token()
depth 2000 / 5000        -> identical
```

Compare the WR-19 reproduction the same probe harness now returns for the closed shape: a 4000-link
call chain → `0 findings over 1/1`, EXIT=0, stderr empty. **The bypass threshold moved from 4000 to
1000, in the opposite direction from the fix.** Exit 1 is inside `{0,1,2}` only by the same accident
WR-19 named — Node's uncaught-exception code — and the D-12 contract reads 1 as "a finding, the gate
blocks", so a check that never ran is reported as a check that found something, with no
`visited/expected` line to contradict it.

`deriveSpecPaths`'s directory `walk` is the second unguarded self-recursion in the same file and is
also outside any `try`; it is far less reachable, and it is named here so the fix covers the class
rather than the one call.

**Fix:** Move the boundary to the file, not to one function inside it:

```ts
// analyzeSpecs: EVERYTHING this runnable does with a spec's bytes is inside the could-not-run
// boundary — the parse included. A file the parser cannot finish is a file we did not check.
let specFindings: string[];
try {
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const diagnostics = (sf as unknown as ParsedSourceFile).parseDiagnostics;
  if (diagnostics !== undefined && diagnostics.length > 0) { errors.push(…); continue; }
  specFindings = findBannedConstructs(ts, sf, rel);
} catch (cause) { errors.push(…); continue; }
```

and wrap `main`'s body in one outer `try` returning 2, so the contract is held by decision at the
process boundary as well as per file. Add a corpus/suite case at depth 1000 asserting a
measurement line on stdout and an exit inside `{0,1,2}` — the shape neither this round's fixture nor
its probes exercise, because both drive a deep **chain** and never a deep **nesting**. Then the
recipe's paragraph is true as written.

---

### CR-16: `originIsTrusted`'s second arm accepts **any directory under the repository root**, so the WR-17 closure does not hold for the ordinary in-repository case — and Workflow 18 tells the agent that the workaround is mechanically refused

**File:** `scripts/context-io.ts:1486-1491` (`originIsTrusted` — `resolvedFrom === trusted ||
resolvedFrom.startsWith(trusted + sep)`), `:1424-1429` (the `origin-outside-trusted-store` decline
sentence: "an **ordinary directory a caller authored and named** would let that caller supply the
very bytes its own write is judged against: a flag wearing a filesystem path"),
`agent-factory/workflows/18-context-compaction.md:56` ("**It refuses an ordinary directory.**"),
`:75` ("Never copy the origin notes into a directory to make the promotion pass. Copying them is
hand-authoring a context path by another name, **and the constraint refuses it**."),
`scripts/context-io.ts:1455-1470` (`T-31-18-01`, which does name the `trustedRepoRoot()` arm)

**Issue:** The agent that calls `promoteAdmitted` runs **inside** the repository. Every directory it
can create is therefore under `trustedRepoRoot()` and satisfies arm 2. The constraint the fix added
excludes only origins outside the repository — which is not where a caller authoring its own proof
would put one.

**Reproduced on this tree**, against the committed `scripts/context-io.js` + `scripts/compactor.js`,
`CLAUDE_PROJECT_DIR=<proj>`, dial `{human_admission: high-severity, audit_retention: retained}`:

```
1. well-formed bytes obtained in a scratch store   -> 20260909T020000Z-security-nfr-finding-a801a1f1
2. those bytes COPIED to <proj>/tmp/forged/T-1/notes/   (an ordinary directory, no .grugops anywhere)
3. comp.promoteAdmitted("T-1", id, note, body, "<proj>/tmp/forged", "<proj>/.grugops/context")
     -> WROTE 20260909T020000Z-security-nfr-finding-a801a1f1     (no decline)
   dest notes:  [ '20260909T020000Z-security-nfr-finding-a801a1f1.md' ]
   dest ledger: 1 line   ({..., "disposed_by":"human:mallory", "re_bound":true})
```

Step 2 is verbatim the action `18-context-compaction.md:75` instructs the agent is refused. The WR-18
fix additionally makes the forged promotion **append a `disposed_by` GOV-02 event** into the
destination repository's committed audit trail — the record `admitAndAppend`'s W3 arm exists to
prevent forging.

`T-31-18-01` does name the `trustedRepoRoot()` arm and dispositions the shape-recognition capability
`accept`. That makes the *capability* disclosed. What is not disclosed, and what makes this a
BLOCKER rather than a residual, is that the two artifacts a reader and an **agent** actually consult
— the decline sentence the caller is shown and the workflow's stop conditions — both assert the
opposite of the measured behaviour, on a safety register whose entire contract is that the claim
matches the mechanism.

**Fix:** Either constrain arm 2 to the shape arm 1 already recognises —

```ts
function originIsTrusted(from: string): boolean {
  const resolvedFrom = resolve(from);
  if (isRecognisedContextStore(resolvedFrom)) return true;      // <X>/.grugops/context, anywhere
  // arm 2, NARROWED: a context store reached from the module's own root, not any directory in it.
  return resolvedFrom === resolve(join(trustedRepoRoot(), ".grugops", "context"));
}
```

— which loses nothing (a cross-repository origin still matches arm 1 by shape); or, if an arbitrary
in-repository origin is genuinely wanted, **rewrite both agent-facing sentences** so they say what
the code does, and give the copy-the-notes-in workaround its own `PROMOTE_ADMITTED_RESIDUALS` member
rather than leaving it as an instruction the mechanism does not honour. Whichever is chosen, drive a
case whose origin is an ordinary directory *inside* the trusted root — the shape this round's probes
never used, because every one of them forged outside it.

## Warnings

### WR-22: the note write and the ledger append are two non-atomic steps, and the ledger read fails open, so `18-context-compaction.md`'s new "the destination never holds a human-disposed finding with no ledger line" is an assertion rather than a property

**File:** `scripts/context-io.ts:1704` (`appendPreAdmittedNote` — the note is written **first**),
`:1705-1720` (the `ledgerRecordsId` + `appendAuditLedger` pair, second), `:2425-2442`
(`ledgerRecordsId` returns `false` on any read failure), `agent-factory/workflows/18-context-compaction.md:83`

**Issue:** Three separate ways the claim fails, one of them measured:

1. **Measured.** With a FIFO at `<repoRoot>/.grugops/audit/admissions.jsonl`, the promotion writes
   the note and then wedges (`timeout 15` → exit 124). The destination holds the human-disposed
   finding; the ledger holds nothing. Any crash, `SIGINT` or ENOSPC between the two calls produces
   the same state.
2. **Fail-open read.** `ledgerRecordsId` returns `false` for an unreadable or EACCES ledger, so a
   re-binding appends a **duplicate** event keyed on the same id — the exact duplicate 31-09
   collapsed and the reason D-19 (4) gave for appending nothing.
3. **Retention-gated.** The look and the append happen only under `audit_retention: "retained"`.
   Under any other retention the sentence is vacuous, which the workflow paragraph does not say.

**Fix:** Append the ledger event **before** the note write and make the note write the step that can
fail (a ledger line for a note that was not written is an over-record, which is the safe direction
for an audit trail); route `ledgerRecordsId` through the same non-blocking regular-file reader CR-12
asks for and treat an unreadable ledger as a refusal rather than as "no record"; and scope the
workflow sentence to `retained` explicitly.

---

### WR-23: WR-20's false refusal survives verbatim wherever the shadowing binding sits at a function's **second** parameter — and the recipe paragraph added this round says it cannot

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1405-1411` (`isFixtureBindingPosition` — index
1 of **any** function-like node is exempt from the census, not only a `test(...)` scenario
callback), `:1382` (the `!isFixtureBindingPosition(node)` guard), `:262` (the residual sentence, "A
name shadowed only there is still canonicalised"),
`agent-factory/checklists/browser-uat-recipe.md:192-197`

**Issue:** The exemption is stated as a position so the census does not depend on the map it
constrains — a sound argument — but the position is not narrowed to the callback the fixture map
actually reads. Any helper whose second parameter shares a renamed import's local name reopens WR-20
exactly.

**Reproduced on this tree:**

```ts
import { test as it, expect } from "@playwright/test";
function inner(n: number, it: { skip: (x: number) => number }): number {
  return it.skip(n);                       // ← a LOCAL `it` at index 1
}
it("the invoice total is shown", async ({ page }) => {
  inner(1, { skip: (x: number) => x });
  await expect(page.getByTestId("invoice-total")).toBeVisible();
});
```
```
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:5: banned modifier call — `test.skip` decides which scenarios the quality gate re-runs …
EXIT=1
```

A legitimate spec is refused and the finding names `test.skip`, a construct absent from the file —
the identical failure, with the identical misleading message, that WR-20 was convened to close. The
recipe now states the opposite as an absolute: "A file that renames the framework import to `it` and
separately binds a local `it` is therefore not refused, **and no finding names a construct the file
does not contain**" (`:194-196`). That sentence is false of the file above.

The severity is bounded by rarity, which is why this is a Warning and not a Blocker — but the
direction is a false refusal, and CR-14's fix would extend the same code path.

**Fix:** Narrow the exemption to the position the fixture map reads — index 1 of a function passed as
the **second argument of a `test(...)`-headed call** — which `deriveTestInfoParameterNames` already
locates and which keeps the exemption a position rather than a name:

```ts
function isFixtureBindingPosition(ts: TsApi, param: TsParameterDeclaration): boolean {
  const owner = param.parent as TsFunctionLikeExpression | undefined;
  if (owner?.parameters?.[1] !== param) return false;
  const call = owner.parent;                       // the function must be a call's SECOND argument
  return ts.isCallExpression(call) && call.arguments[1] === owner;
}
```

and add the shape above to `shadowed-rename.uat.spec.ts` as a second control.

---

### WR-24: `shadowed-rename.uat.spec.ts` cannot fail for CR-14's reason — the corpus proves only the false-positive half of the scope rule, and the two halves live in different files

**File:** `scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts:31-42`,
`scripts/runnable-ref/fixtures/import-rename.uat.spec.ts` (the "still refused" half, a file with no
declaration), `scripts/runnable-ref/uat-spec-integrity.test.ts:4718-4733`

**Issue:** The new fixture carries a renamed import, a shadowing declaration, and **no genuine
renamed modifier call**. Its contract is "stay at zero findings", so a fix that disabled the
canonicalisation entirely would keep it green — which is exactly the state CR-14 measures. The
"STILL REFUSED" evidence lives in a *different* corpus file that contains no declaration, so the
**union** — one file that both declares the name and genuinely calls the modifier through the
rename — is never asserted anywhere in the corpus. This is round-3's IN-10 one fixture over: the
control cannot fail for the reason the fixture exists.

The suite does carry the union at `uat-spec-integrity.test.ts:4718-4733`, but that case shadows a
**different** name (`helpers`), which is the easy direction; the same-name union is asserted at
`:4742` as accepted rather than refused.

**Fix:** Give the fixture a `MUTATE-REMOVE` region containing a genuine `it.skip(...)` at module
scope alongside the shadowed helper, and assert it is still reported once — under CR-14's scope-aware
fix that is the correct answer, and under the current file-scoped rule the fixture turns red, which
is the point.

---

### WR-25: the `promoteAdmitted` clause order puts the dial clause ahead of the operand clause, so an untrusted origin under a non-gating destination is reported as a dial problem and the workflow's copy-the-notes stop condition is never the message the agent sees

**File:** `scripts/context-io.ts:1587-1592` (`human-stamp-not-gated-at-destination`),
`:1598-1605` (`origin-outside-trusted-store`, evaluated after),
`agent-factory/workflows/18-context-compaction.md:75-77`,
`docs/audit/31-round4-residuals.md` §4.4 (which records the same ordering as an `UNKNOWN - verify`
disagreement with `31-18-SUMMARY.md`'s recorded post-fix table)

**Issue:** Measured order in the committed `.js`: `empty-source-id` →
`unreadable-governance-config` → `human-stamp-not-gated-at-destination` →
`origin-outside-trusted-store` → `no-such-origin-note` → … . So under `human_admission: off` or an
absent configuration — the lean posture most repositories run — a caller that names a forged origin
is told the **destination's dial** is the problem, and the workflow's remedy for that clause is
"Promote it as a new admission with an empty or `§14-gate` stamp, or **set the destination's
`human_admission` dial**". Following the message a non-gating destination gives you widens the dial
in response to an origin fault.

The safety consequence is nil — all four dial values refuse — but the register's own reason for
existing is that the caller is told **which** clause failed, and `31-18-SUMMARY.md`'s recorded WR-17
table disagrees with the committed artifact on exactly these two rows.

**Fix:** Evaluate the operand constraint before the dial: `origin-outside-trusted-store` is a
statement about the caller's input and `human-stamp-not-gated-at-destination` is a statement about
the environment, and the input fault is the more specific answer. Then reconcile
`31-18-SUMMARY.md`'s table (or annotate it — a prior round's record is history and is never
rewritten) and add a two-sided case asserting the order rather than leaving it to reading order.

## Info

### IN-12: `isBannedModifierCall` calls `stripRoutingLinks` three times on the same input

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:359`, `:396`, `:400`

**Issue:** The presence check and the value read each recompute the normalised path, and the exact
arm recomputes it a third time. The comment at `:392-395` explains correctly *why* both positions
must read the one normaliser; computing it once into a local satisfies that argument and removes the
chance of the two positions drifting apart when the function is next edited.

**Fix:** `const compared = stripRoutingLinks(dottedPath);` once at the top of the pure-path arm, and
once in `isBannedModifierCall`, then compare against `compared` at every position.

---

### IN-13: `docs/audit/31-round4-residuals.md` is thorough and self-critical, and two of its own `UNKNOWN - verify` items are load-bearing for this review

**File:** `docs/audit/31-round4-residuals.md` §4.3 (which spelling the round-4 verifier ran for
WR-21), §4.4 (the clause-name disagreement), §6.2 (the eighth logged instance of a verification
harness producing a false result about its own premise)

**Issue:** Recorded, not a defect. §4.3's honesty is what let CR-13 be found: the document prints
both readings of the WR-21 probe and chooses neither, and the reading it calls "closed" is the one
this review confirms while the position it never asked about — a configuration **at** home rather
than at an ancestor of it — is CR-13. §6.2's false-pass account (a two-space brace pattern matching
zero deciders and reporting `0 mismatches`) is the correct instinct applied to the right target; the
same instinct applied to `analyzeSpecs`'s boundary would have found CR-15.

One `UNKNOWN - verify` for this round, stated rather than absorbed: I did not independently re-derive
`WORKFLOW_STOP_BULLET_COUNT` 39→42 or `NON_TEST_MODULE_COUNT` 72→74. Both are asserted two-sidedly by
the green suite and by the disposition files, and the comment beside each records the re-walk rather
than a bump — but I read the argument, I did not re-run the derivation.

**Fix:** None required.

---

_Reviewed: 2026-09-09T15:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: a16786b_
