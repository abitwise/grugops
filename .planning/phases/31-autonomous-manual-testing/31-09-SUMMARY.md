---
phase: 31-autonomous-manual-testing
plan: 09
subsystem: testing
tags: [context-io, admission, typescript, ast-derivation, governance, tdd]

requires:
  - phase: 31-autonomous-manual-testing (plan 31-05)
    provides: "the admission authority reached from appendNote for the artifact-ref kind (D-03), and the derived writer-set harness this plan extends"
  - phase: 31-autonomous-manual-testing (plan 31-01)
    provides: "admit()'s four refusal families (D-01/D-03/D-04/D-14) and emitVerdict's sha-bearing green verdict"
provides:
  - "appendNote consults admit() UNCONDITIONALLY — the kind axis is deleted, not widened, so the set of kinds the writer routes is by construction the set the authority adjudicates"
  - "a module-private appendPreAdmittedNote: the one deliberate admission skip, with its caller set derived by AST, its call-site count asserted separately, and its non-export asserted off the parsed source"
  - "one governance root for the writer, the hook, the admission server and the CLI — both writer defaults moved to trustedRepoRoot() in the same change"
  - "R-21 (the duplicate retained-ledger event) CLOSED as a consequence of routing admitAndAppend's adjudicated branches through the private route"
  - "a measured, dispositioned blast radius: every appendNote call site under scripts/, hooks/ and install/ enumerated by derivation and exercised"
  - "workflows 16, 17 and 18 state what the mechanism does; 31-05-SUMMARY and 31-08-SUMMARY carry appended dated corrections with zero deletions"
affects: [phase-31 verification round 3, any future note-writer, any future admission predicate]

actuals:
  tokens: 34538
  tasks: 3
  commits: 6
plan_head_before: 0d81b450046813e32b06af6eab4acc79ac1a5e6b

tech-stack:
  added: []
  patterns:
    - "Delete the axis, do not widen it: when a predicate is scoped by a comparison the authority already owns, remove the comparison rather than lengthening it"
    - "A deliberate safety skip is module-private, justified at its site, and bounded by a DERIVED caller set with a separately-asserted call-site count"
    - "A mutation mirror that RESTORES a deleted scoping is a sharper control than one that neutralizes the call"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-09.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/compactor.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-05-SUMMARY.md
    - .planning/phases/31-autonomous-manual-testing/31-08-SUMMARY.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "Delete appendNote's kind axis rather than widen it — the writer expresses no opinion about which kinds admission applies to, so the link cannot be present for one kind and absent for another"
  - "Take the module-private pre-admitted route deliberately and bound it by AST derivation, rather than avoid it as 31-05 reasoned; that bound was not available then and it collapses R-21 instead of widening it"
  - "The convergence oracle's seeded note becomes an UNSTAMPED claim (the plan's own stated fallback) rather than a genuinely-emitted verdict, because making the stamp genuine was MEASURED to make a Tier-1 oracle a second member of the D-09 verdict-author set"
  - "Assumption A2 corrected by measurement: the repository root reads governance source `ok` (from agent-factory/config/factory.config.json), not `absent` — the operative consequence (the lean dial applies) holds"
  - "IN-04 recorded as a disclosed residual with its direction rather than closed, as a failing-on-change assertion instead of a sentence"

patterns-established:
  - "Assert the harness's own PREMISE before the claim built on it — the parse found declarations, and it found the subject function"
  - "A residual is recorded as an assertion that goes red when it changes, never as prose"

requirements-completed: [UATX-01, UATX-04]

coverage:
  - id: D1
    description: "appendNote refuses a finding bearing a fabricated §14-gate stamp; nothing is written and nothing is rendered"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-09 — CR-05: the fabricated finding stamp > REFUSES the verifier's fabricated §14-gate stamp on a finding and writes NOTHING"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-09 — CR-05: the fabricated finding stamp > the fabricated per-run id appears NOWHERE in the rendered index.md"
        status: pass
      - kind: e2e
        ref: "node .temp/cr05-probe.mjs against the committed scripts/context-io.js — exit 0, file count 0 (exit 1, id returned, 1 file at HEAD before this plan)"
        status: pass
    human_judgment: false
  - id: D2
    description: "appendNote carries no kind test; the two exported writers agree on one note, and the legitimate stamped path still writes"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-09 — CR-05: the fabricated finding stamp > admitAndAppend refuses the identical note with the SAME authority text"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-09 — CR-05: the fabricated finding stamp > WRITES a finding stamped against a REAL live green verdict, and the id is the filename"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#31-09 — re-scoping the authority call to one kind re-opens the fabricated finding stamp > a mirror that RESTORES the kind scoping writes the fabricated finding the live module refuses"
        status: pass
    human_judgment: false
  - id: D3
    description: "The one deliberate admission skip is module-private, has a derived one-member caller set, an asserted call-site count, and no export modifier"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#31-09 — the private pre-admitted write route is bounded by derivation > the derived caller set has exactly the expected MEMBERS"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#31-09 — the private pre-admitted write route is bounded by derivation > the derivation DISCRIMINATES — a seeded second caller moves BOTH the set and the count"
        status: pass
    human_judgment: false
  - id: D4
    description: "The governance root has one answer across the writer and the admission-guard hook"
    requirement: UATX-04
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#31-09 — WR-10: one governance root for the writer and the hook > the writer's admission and the hook's decision read the SAME configuration source"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-09 — WR-10: one governance root for the writer and the hook > WATCHED FAILING: reverting the default to the install root REFUSES the same note"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every appendNote call site under scripts/, hooks/ and install/ is enumerated by derivation, exercised and dispositioned"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#31-05 — the reachability remainder is written down > the appendNote call sites in tracked non-test sources are counted"
        status: pass
      - kind: e2e
        ref: "node scripts/check-uat-oracles.js — ALL CHECKS PASSED (the one external caller the unconditional admission refused)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Workflows 16, 17 and 18 describe the admission the writer performs; both summary overclaims carry appended dated corrections"
    verification:
      - kind: other
        ref: "git diff --numstat over 31-05-SUMMARY.md and 31-08-SUMMARY.md across this plan: 42/0 and 42/0 — insertions only, zero deletions"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon && check:banned-claims && check:public-docs && check:claim-anchors — all ALL CHECKS PASSED"
        status: pass
    human_judgment: true
    rationale: "Whether the corrected prose now says what the mechanism does is a reading judgment. The gates prove the prose is well-formed and that the original claim lines survive verbatim; they cannot prove the replacement sentence is the right one."

duration: 61 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 09: Close CR-05 — the fabricated finding stamp Summary

**`appendNote` now consults the admission authority for every note it takes: the kind comparison that scoped 31-05's wiring to `artifact-ref` is deleted rather than widened, the one deliberate skip is a module-private route whose caller set is derived and counted, and both writers resolve governance from `trustedRepoRoot()`.**

## Performance

- **Duration:** 61 min
- **Started:** 2026-09-08T12:28:08Z
- **Completed:** 2026-09-08T13:29:00Z
- **Tasks:** 3
- **Files modified:** 16 (15 modified, 1 created)

## Accomplishments

- **The round-2 verifier's live bypass is closed at its own coordinates.** A `finding` carrying
  `verified_by: "§14-gate#fabricated-run-id"` is refused by the committed `scripts/context-io.js`,
  the task's notes directory gains zero files, and `render()` prints nothing.
- **The axis is deleted, not widened.** `appendNote` carries no kind comparison, no allow-list and no
  derived kind set. It consults `admit()` unconditionally, so the set of kinds it routes is by
  construction the set the authority adjudicates — the link cannot be present for one kind and absent
  for another, which is the shape this phase has now paid for four times.
- **The new axis is bounded before it can rot.** Deleting the kind axis moved the degree of freedom to
  the one route that still skips admission. `appendPreAdmittedNote` is module-private, its caller set
  is derived from the source by the TypeScript AST and asserted equal to `{admitAndAppend}`, its
  call-site count is asserted as a separate expectation, and a seeded second caller moves both.
- **`R-21` is CLOSED rather than widened.** 31-05 disclosed a duplicate GOV-02 ledger event because
  `admitAndAppend` admitted and then persisted through a second admission. Routing its two
  already-adjudicated branches through the private route collapses the duplicate. Had the kind axis
  been deleted without it, the duplicate would have widened to every kind.
- **Governance has one root.** Both `appendNote` and `admitAndAppend` default `repoRoot` to
  `trustedRepoRoot()` — the same reader `hooks/guard.ts`, `hooks/admission-guard.ts`,
  `scripts/admission-server.ts` and the CLI `admit` verb ask — moved in one change, and watched
  failing against a mirror whose defaults are reverted.
- **The blast radius is measured, not inferred.** Every `appendNote` call site is enumerated by
  derivation with its enclosing function, each is exercised, and each disposition is recorded below.

## Task Commits

1. **Task 1 (RED)** — `dece3c0` `test(31-09)`: the failing CR-05 cases
2. **Task 1 (GREEN)** — `6491f48` `feat(31-09)`: delete the kind axis, add the private route, move both governance defaults
3. **Task 2** — `012364d` `feat(31-09)`: blast radius, derived caller set, WR-10 governance cases
4. **Task 3** — `c08eb3f` `docs(31-09)`: workflows 16/17/18, both summary corrections, the disposition register
5. **Deviation** — `2deff78` `fix(31-09)`: keep the step-4 sentence clear of `guard_context_writes`
6. **Deviation** — `076675f` `fix(31-09)`: seed the oracle honestly, refreeze the hook manifest

_No `refactor(31-09)` commit: Movement 2's split into `composeValidatedNote` landed inside the GREEN
commit because it is the mechanism, not a cleanup after it. Nothing further needed cleaning._

## TDD Gate Compliance

| Gate | Commit | Evidence |
|---|---|---|
| RED | `dece3c0` | `gsd-tools check tdd-red-evidence` → **`RED_EVIDENCE_OK`** (`target_test_failed`), 6 tests / 2 pass / 4 fail. The TAP was transcribed from vitest's own JSON result file for the run that happened — a format adapter, never a synthesized result. |
| GREEN | `6491f48` | `scripts/context-io.test.ts` 301/301 passing after the change. |
| REFACTOR | — | Not needed; no cleanup commit made. |

**Honest note on Task 2's discipline.** Task 2's own additions (the private-route derivation, the
WR-10 governance cases) were written against code that had already landed in Task 1, so they are
coverage additions rather than a RED→GREEN cycle. What stands in for RED there is the mutation
control: the seeded-second-caller case and the reverted-default mirror were each watched producing
the opposite result. Task 2's *pre-existing* RED was real and observed: the call-site constant failed
at 6≠4, the removed mirror anchor failed, both compactor cases failed, and
`node scripts/check-foundation-guards.js` crashed at `equivDoWork`.

## The pre-fix output, verbatim

**The failing test, before the fix** (`npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "31-09"`):

```
 ❯ scripts/context-io.test.ts (301 tests | 4 failed | 295 skipped) 25ms
     × REFUSES the verifier's fabricated §14-gate stamp on a finding and writes NOTHING 7ms
     × the refusal reproduces the AUTHORITY's own D-01 text, not a message composed at the writer 1ms
     × the fabricated per-run id appears NOWHERE in the rendered index.md 8ms
     × admitAndAppend refuses the identical note with the SAME authority text 1ms

 FAIL  … > REFUSES the verifier's fabricated §14-gate stamp on a finding and writes NOTHING
AssertionError: expected [Function] to throw an error
- Expected:
null
+ Received:
undefined

 FAIL  … > the fabricated per-run id appears NOWHERE in the rendered index.md
AssertionError: expected '<!-- GENERATED — do not hand-edit. Re…' not to contain 'fabricated-run-id'
+ | 2026-09-08T01:00:00Z | finding | qe-e2e | high | §14-gate#fabricated-run-id | the checkout flow passes end to end |
```

That last line is the verifier's `index.md` row, reproduced byte-for-byte by the test.

**The probe against the committed `.js`, BEFORE this plan's commits** (`node .temp/cr05-probe.mjs` at
`0d81b45`):

```
module      : /Users/olgeroeselg/Projects/public/grugops/scripts/context-io.js
outcome     : appendNote RETURNED a note id: 20260908T010000Z-qe-e2e-finding-2b825de1
threw       : false
file count  : 1
PROBE FAIL: the fabricated finding was not refused, or a file was left behind.
EXIT=1
```

**The same probe AFTER** (exit 0):

```
outcome     : appendNote THREW: context-io.appendNote: refusing to write a note the admission authority did not accept. Nothing was written:
threw       : true
file count  : 0
PROBE PASS: the fabricated finding was refused and nothing was written.
```

`.temp/` is gitignored; the probe is a throwaway and is not committed.

## The blast radius: every `appendNote` call site, measured and dispositioned

Derived by AST from `git ls-files 'scripts/*.ts' 'hooks/*.ts' 'install/*.ts'` minus `*.test.ts`, with
the enclosing function resolved from the parse — not read off by eye.

| # | Site | Enclosing | Exercised how | Disposition | Reason |
|---|---|---|---|---|---|
| 1 | `scripts/context-io.ts:1109` | — (the `export function appendNote(` declaration) | n/a | **counted, not a call** | The regex the writer-set test uses counts `appendNote(` occurrences, and the declaration is one. Named so the constant's value is legible. |
| 2 | `scripts/compactor.ts:615` | `promote` | `scripts/compactor.test.ts` (2 cases repaired) | **admits, unchanged shape** | A pass-through. A promoted note is now re-admitted at the destination by the same authority, for every kind. Its two fixtures wrote a `§14-gate#SEED-001` finding into a substrate holding no verdict; both were given a REAL live green verdict rather than re-kinded. |
| 3 | `scripts/check-uat-oracles.ts:531` | `equivDoWork` | `node scripts/check-uat-oracles.js` | **admits, untouched** | A soft `observation` with an empty `verified_by`. The lean dial applies, so nothing refuses it. |
| 4 | `scripts/check-uat-oracles.ts:541` | `equivDoWork` | `node scripts/check-uat-oracles.js` | **REFUSED — the one external caller** | It seeded a `finding` wearing `§14-gate#R26-DOGF01-0001` against a substrate holding no verdict: the CR-05 bypass in miniature. It crashed `check-foundation-guards.js`, which imports this oracle. Resolved by recording the note honestly as an unstamped `claim` — see the deviation below. |
| — | `scripts/context-io.ts` `admitAndAppend` ×2 | `admitAndAppend` | `scripts/context-io.test.ts` | **moved off `appendNote`** | Both branches had already adjudicated their note; they now call the private pre-admitted route. This is why the constant moved. |

**`EXPECTED_APPEND_NOTE_CALL_SITES`: 6 → 4.** Measured by running the derivation the constant
documents, not adjusted until green. The two lost occurrences are `admitAndAppend`'s.

**Private-route derivation, measured:** callers `["admitAndAppend"]`, call-sites `2`, `exported=false`.

## Red-team pass (the plan's standing obligation, not optional)

This is the fourth round on this predicate family, so the plan required asking which SET the predicate
enumerates, at which POSITIONS it is asked, and — the converse — what the NEW axis is once the kind
axis is gone. 15 adversarial probes were run against the committed `.js`.

| # | Question | Result |
|---|---|---|
| Q1 | `appendNote(finding, fabricated stamp)` | REFUSED, 0 files |
| Q2 | Can `admitAndAppend`'s **gated** branch (the one that skips `admit()`) carry a gate stamp? | REFUSED — it requires `HUMAN_STAMP_RE`, and both regexes are fully anchored with disjoint prefixes over a class excluding `#` and `:` |
| Q3 | 4 dual-shaped `verified_by` values trying to satisfy both regexes at once | ALL REFUSED |
| Q4 | 6 untyped-caller `kind` values (`"finding "`, `" finding"`, `"FINDING"`, `"artifact-ref"`, `"not-a-kind"`, `""`) + a fabricated stamp — the writer has NO kind test now | ALL REFUSED. This is strictly stronger than 31-05's `normalizeKind` choice: a padded kind cannot skip a call that is not conditional. |
| Q5 | `compactor.promote(finding, fabricated stamp)` | REFUSED, 0 files |
| Q6 | Is the private route on the module's export surface under any name? | NO — 26 exports, 0 matching |
| Q7 | Do the ADMITTED bytes equal the WRITTEN bytes? (a compose/write gap would be a bypass) | The note on disk re-admits under the same authority, 0 findings |
| Q8 | Does the CLI expose an unadmitted write verb? | NO — verbs are `validate`, `admit`, `emit-verdict`, `render`; an `append` verb does not exist (exit 1) |
| Q10 | Can an agent author `by: §14-gate` through the sanctioned writer? | REFUSED as an impersonation flag |
| Q11 | Does `emitVerdict` refuse a non-clean integrity (`"finding"`, `"unknown"`, `"CLEAN"`, `"clean "`)? | All 4 return `null`, writing nothing |

**Q9 — the residual this pass found, disclosed rather than closed.** An in-process caller that can
import `scripts/context-io.js` can MINT its own green verdict through the exported `emitVerdict` and
then admit a finding against it. Measured:

```
Q9a emitVerdict('SELF-MINTED') -> 20260908T132933Z-§14-gate-finding-8a8c9cba
Q9b appendNote(finding stamped against it) -> 20260908T040000Z-qe-e2e-finding-08286b3f
Q9c notes on disk: 2
```

**Direction, stated honestly: this plan strictly IMPROVES that position and does not close it.**
Before 31-09 the minting step was not even necessary — `appendNote` did not consult D-01 at all, so
the same finding wrote with no verdict anywhere. What bounds minting today is `emitVerdict` being the
only author of the reserved identity (Q10), the D-09 verdict-author-set bar in
`scripts/chrome-lane-bar.test.ts` asserting exactly one repository source invokes it, and that file's
own already-disclosed residual 1 (a syntactic predicate an alias defeats). Closing it would mean
changing who may call the emitter, which is outside this plan's declared scope and is a decision, not
a fix. Recorded here and in `.planning/WINDOWS.md` so it is a measurement rather than a silence.

## Files Created/Modified

- `scripts/context-io.ts` / `.js` — `composeValidatedNote` (private), `appendPreAdmittedNote`
  (private, the one deliberate skip), `appendNote`'s unconditional authority call, both `repoRoot`
  defaults moved to `trustedRepoRoot()`, both `admitAndAppend` branches re-pointed with their reason
  written at each site
- `scripts/context-io.test.ts` — the CR-05 describe block, the WR-10 governance-root block, the IN-04
  disclosure, four repaired fixtures, the re-pointed `R-21` case
- `scripts/context-io-writer-set.test.ts` — the private-route derivation (premise, members, count,
  export modifier, discrimination), PART FIVE-A re-pointed at a kind-scoping-restoring mirror, the
  re-measured call-site constant
- `scripts/check-uat-oracles.ts` / `.js` — the seeded note recorded honestly as an unstamped `claim`;
  the header sentence that described the old fixture moves with it
- `scripts/compactor.test.ts` — two fixtures given real live green verdicts
- `hooks/hook-entry.ts` / `.js` — the frozen module manifest regenerated
- `agent-factory/workflows/16-context-read-write.md`, `17-task-claim.md`, `18-context-compaction.md` —
  the three prose sites
- `docs/audit/29-style-dispositions/31-09.md` — 18 rows, one per clause this plan changed
- `31-05-SUMMARY.md`, `31-08-SUMMARY.md` — appended dated corrections, insertions only
- `deferred-items.md` — two pre-existing conditions recorded with their measurements

## Decisions Made

1. **Delete the kind axis rather than widen it.** A longer allow-list would keep a second, narrower
   statement of a question the authority already answers in full, and merely postpone the next round.
2. **Take the private-route horn 31-05 declined, and bound it by derivation.** 31-05 reasoned that any
   suppression of the second admission would either hand `appendNote` an agent-reachable parameter or
   create an unbound second write path. The second horn is now taken deliberately: not exported, one
   derived caller, an asserted call-site count, a reason at each site. That bound was not available to
   31-05, and with it the duplicate ledger event collapses instead of widening to every kind.
3. **The oracle's seed becomes an unstamped `claim`, not a genuinely-emitted verdict.** Making the
   stamp genuine was implemented and MEASURED first, and it broke a different bar — see the deviation.
4. **A2 corrected by measurement.** The plan predicted `readGovernanceConfig(ROOT).source === "absent"`.
   Measured: `ok`, from `agent-factory/config/factory.config.json` (the second standard candidate;
   there is indeed no `.grugops/factory.config.json`). The operative consequence A2 was about — the
   lean dial applies, so D-04 and D-14 do not fire across the suite — holds, and is now a failing
   assertion rather than an assumption.
5. **IN-04 disclosed, not closed.** The GOV-02 ledger event is appended before the write chokepoint
   can refuse. Direction: an extra audit line, never a missing one. Recorded as an assertion that goes
   red the day it moves.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Four suite fixtures wrote a gate-stamped finding into a substrate with no verdict**
- **Found during:** Task 1 (GREEN)
- **Issue:** `context-io.test.ts` (2 cases), the 31-01 A5 byte-identity loop, and `compactor.test.ts`
  (2 cases) each wrote a `finding` stamped `§14-gate#SEED-001` or `#RUN8` with no verdict planted.
  Under the unconditional admission these are refused — correctly. One of them carried a comment
  stating the bypass as a design choice: *"appendNote … does NOT gate a finding (that is admit()'s job
  and this fix deliberately did not widen it). So the write succeeds with no verdict planted."*
- **Fix:** Each fixture's stamp is made GENUINE with a real live green verdict via `emitVerdict`,
  rather than the case being re-kinded or the assertion weakened. Where a case asserted "exactly one
  file", the assertion became a delta against the planted verdict plus an address-by-id, so the
  "one write per call" contract is still pinned. The stale comment is replaced with a correction.
- **Files modified:** `scripts/context-io.test.ts`, `scripts/compactor.test.ts`
- **Verification:** `scripts/context-io.test.ts` 307/307, `scripts/compactor.test.ts` 185/185
- **Committed in:** `6491f48`, `012364d`

**2. [Rule 1 - Bug] `R-21`'s disclosure case asserted a duplicate the fix collapses**
- **Found during:** Task 1 (GREEN)
- **Issue:** The case asserted 2 retained ledger events for one artifact-ref. Routing
  `admitAndAppend`'s branches through the private route makes it 1.
- **Fix:** The assertion changes DIRECTION with a written account of why 31-05's reasoning no longer
  holds, rather than being deleted. The case still goes red the day the count changes again.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** the case passes asserting 1 and 2
- **Committed in:** `6491f48`

**3. [Rule 3 - Blocking] `guard_context_writes` false-positive on `§14-gate#<id>`**
- **Found during:** Task 3
- **Issue:** `node scripts/check-foundation-guards.js` exited 1 with `SCTX-05 raw context write`. The
  guard fires when a `.grugops/context/` path shares a line with a write token, and its token set
  includes `(?<![-<=])>>?`. My added sentence put `§14-gate#<id>` on workflow 18's step-4 line, whose
  `>` is preceded by `d` — so the guard read it as a shell redirect. The guard's own header documents
  that it errs toward a false positive here on purpose.
- **Fix:** The PROSE moved, not the guard: the sentence reads `§14-gate` without `#<id>`. Widening the
  guard to reach green would be the exact failure class this plan exists to close.
- **Files modified:** `agent-factory/workflows/18-context-compaction.md`, `docs/audit/29-style-dispositions/31-09.md`
- **Verification:** `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`
- **Committed in:** `2deff78`

**4. [Rule 4 → resolved by the plan's own stated fallback] Making the oracle's stamp genuine made a Tier-1 oracle a second verdict author**
- **Found during:** Task 2, caught by the full suite
- **Issue:** Task 2's Movement 2 was implemented as written — `equivDoWork` emitted a real green
  verdict through `emitVerdict`, and both `node scripts/check-uat-oracles.js` and
  `node scripts/check-foundation-guards.js` went green. But the full suite reported
  `scripts/chrome-lane-bar.test.ts` failing: *"the derived author set has the expected MEMBER —
  expected [Array(2)] to deeply equal ['scripts/context-io.ts']"*. That file derives the set of
  repository sources invoking the verdict carve-out and asserts exactly ONE member, because a second
  author is a second route to the machine stamp. It is the **D-09** bar **UATX-03** rests on, recorded
  `✓ VERIFIED` in BOTH verification rounds. Its own message says a second author "needs a decision,
  never a bumped constant".
- **Why it was not resolved by widening the constant:** moving a truth two verification rounds
  recorded as verified, to buy a fixture a decoration, is not a gap-closure plan's call to make.
- **Fix:** The plan's own stated fallback, taken literally — *"the fallback is to record the seeded
  note honestly under an unstamped kind and say so in the header — never to reintroduce a writer route
  that skips admission."* The seed is a `claim` with an empty `verified_by`, carrying the frozen run id
  in `refs` as an ordinary reference. The oracle measures substrate convergence, which a claim
  converges on identically; the stamp was decoration on a convergence test, and the file's own header
  always said gate/admission logic is tested by its own suites. The oracle additionally now asserts
  that NO note on either path carries a `§14-gate` stamp, so re-acquiring the decoration reds this
  lane rather than passing quietly. `emitVerdict` is no longer imported.
- **Files modified:** `scripts/check-uat-oracles.ts` / `.js`
- **Verification:** `scripts/chrome-lane-bar.test.ts` 3 previously-failing cases pass;
  `node scripts/check-uat-oracles.js` → `ALL CHECKS PASSED`
- **Committed in:** `076675f`

**5. [Rule 3 - Blocking] The frozen hook manifest no longer matched `scripts/context-io.js`**
- **Found during:** the full-suite run after Task 3
- **Issue:** `hooks/guard.test.ts` and `scripts/floor-invariance.test.ts` failed: the wrapper
  fail-closes and DENIES every tool call when a module in a decider's closure does not match the
  frozen manifest. `scripts/context-io.js` is in both deciders' closures. Left unfixed this would deny
  every Bash and propose-note call on any host that installed this build.
- **Fix:** `npm run generate:hook-manifest` (which regenerates and rebuilds), then committed. This is
  the sanctioned workflow for a manifest-covered module change, not a bypass.
- **Files modified:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** `hooks/guard.test.ts` + `scripts/floor-invariance.test.ts` 366/366
- **Committed in:** `076675f`

---

**Total deviations:** 5 (2 Rule 1 bugs, 2 Rule 3 blockers, 1 Rule 4 resolved by the plan's own written
fallback rather than by escalation).
**Impact on plan:** All five were consequences of the change, discovered by measurement rather than by
reading. None weakened a gate: two fixtures were made genuinely admissible, one prose line moved
around a guard rather than the guard around it, one disclosure flipped direction with its reason
recorded, and the oracle took the fallback the plan had already written down.

## Issues Encountered

- **`npm run check:diff-disposition` fails on 75 clauses this plan did not write.** Measured on a
  hermetic clone at `012364d`, BEFORE this plan's first prose commit: **78** undispositioned clauses
  across four workflow files, owned by plans 31-05, 31-06 and 31-08, none of which wrote a disposition
  file. This plan wrote `docs/audit/29-style-dispositions/31-09.md` covering all 17 clauses it changed,
  verified by set difference against that measured baseline (the count fell 78→75 because three
  baseline clauses were replaced by this plan's rewrites and its own rows now cover them). Writing
  rows for another plan's clauses would put a reason in the register this plan cannot vouch for — a
  claim broader than what was measured, which is the defect 31-09 exists to correct. Recorded in
  `deferred-items.md` with the measurement and the remedy.
- **`node scripts/validate-agent-factory.js` exits 1 bare.** It requires `VALIDATE_KIT_ROOT`; with
  `VALIDATE_KIT_ROOT=$PWD` it exits 0 and prints `ALL CHECKS PASSED`. An invocation contract, not a
  structural failure, and unrelated to anything this plan changed. Recorded in `deferred-items.md`.
  The plan's acceptance criterion named the bare form, which is the stale half of the record.

## Known Stubs

None. No hardcoded empty value, placeholder, `TODO` or `FIXME` was introduced.

## Verification

| Gate | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 files passed, 3335 passed / 2 skipped (3337)** — at the 62-file floor round 2 recorded; test count grew 3318 → 3337 from this plan's additions |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | exit 0; `no tracked build output moved`; `60 committed .js file(s) match a rebuild` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/validate-agent-factory.js` | exit 0 with `VALIDATE_KIT_ROOT` set (see Issues) |
| `node .temp/cr05-probe.mjs` | exit 0, file count 0 (exit 1, id returned, 1 file before this plan) |
| `check:imperative-lexicon` / `banned-claims` / `public-docs` / `claim-anchors` | all `ALL CHECKS PASSED` |
| `check:diff-disposition` | all 17 of this plan's clauses dispositioned; 75 pre-existing (see Issues) |
| Red-team, 15 probes against the committed `.js` | 14 refused; 1 residual disclosed and measured (Q9) |

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change was
introduced. The change removes a write route's discretion and adds no surface.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `UATX-01`'s central claim now holds at the writer: an agent's self-supplied claim wearing a gate
  stamp it never earned is refused by the sanctioned writer, for every kind, against the artifact a
  host actually runs.
- **`CR-06` is still open** — `test.describe.serial.only` / `test.describe.parallel.only` walk past
  `BANNED_CONSTRUCTS`. That is plan `31-10`'s scope, not this one's, and `UATX-06` stays failed until
  it lands.
- **Carried for round 3's attention:** the Q9 verdict-minting residual above. It is not a regression
  and it is strictly better than the pre-plan position, but it is the honest answer to "at which
  positions is the predicate asked", and it is bounded by a syntactic derivation whose own residual
  list already names an alias as defeating it.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*

## Self-Check: PASSED

Every claim above that names a file, a commit or a source fact was re-verified after the SUMMARY was
written, against the tree rather than against the narrative.

| Claim | Check | Result |
|---|---|---|
| The created file exists | `[ -f docs/audit/29-style-dispositions/31-09.md ]` | FOUND |
| This SUMMARY exists | `[ -f .planning/phases/31-autonomous-manual-testing/31-09-SUMMARY.md ]` | FOUND |
| All 7 commits exist | `git log --oneline --all` for `dece3c0 6491f48 012364d c08eb3f 2deff78 076675f 661c725` | ALL FOUND |
| "neither is exported" | `grep -c "export function appendPreAdmittedNote\|export function composeValidatedNote" scripts/context-io.ts` | **0** |
| "`appendNote` carries no kind test" | `sed -n '/^export function appendNote(/,/^}/p' scripts/context-io.ts \| grep -c "note.kind"` | **0** — the writer references the kind field not once, anywhere in its body |
| `commits: 6` in `actuals` | `git rev-list --count 0d81b45..HEAD` at SUMMARY time | **6** (the 7th is this metadata commit itself) |
