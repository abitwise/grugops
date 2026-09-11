---
phase: 31-autonomous-manual-testing
plan: 33
subsystem: safety-guards
tags: [context-io, gov-02-ledger, governance-root, skip-arms, derived-axis, gap-closure, round-7]
requires:
  - phase: 31-autonomous-manual-testing
    provides: "D-31's governanceRootOf authority, the note-then-ledger order (D-24), the ReadPositionRefusal discriminant (D-31 (3)), and the derived writer/decline axes"
  - phase: 31-autonomous-manual-testing
    provides: "31-32's D-33 remove-axis closure, which left the excluded-e2e suite green at the round-7 base"
provides:
  - "promoteAdmitted derives the destination's owning repository at its ENTRY, above every branch, and carries it onto every return path including the human-stamp fall-through"
  - "admitAndAppend derives the same answer at its entry; its gated branch appends the GOV-02 event there rather than at repoRoot"
  - "READ_POSITION_CONDITIONS as a runtime constant, with ReadPositionCondition derived from it and NOTE_SKIP_ARMS spreading it"
  - "a skipped notes/ entry named by the condition that is TRUE of it, read from ReadPositionRefusal.condition"
  - "WRITE_PATH_RESIDUALS entries R-31-33-01 and R-31-33-02, each driven by its own case"
  - "decision D-34, amending D-31's NOT-ESTABLISHED bullet explicitly"
affects: [scripts/context-io.ts, scripts/context-io.js, hooks/hook-entry.ts, agent-factory/workflows/18-context-compaction.md]
actuals:
  tokens: 39799
  tasks: 3
  commits: 6
plan_head_before: 78a9d163324baf5273304d7cbf9624233923ff8d
tech-stack:
  added: []
  patterns:
    - "a property claimed of a FUNCTION is installed at the function's ENTRY, above every branch"
    - "a published set SPREADS the authority's own constant rather than restating it as a second literal"
    - "a refusal arm is READ FROM the discriminant, never re-derived by the caller"
    - "a boundary that cannot be closed is PUBLISHED as a residual with the measurement that rejected the alternative"
key-files:
  created:
    - docs/audit/29-style-dispositions/31-33.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/compactor.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
key-decisions:
  - "D-34 (1): a property claimed of a FUNCTION is established at the function's ENTRY. promoteAdmitted's derivation and its destination-outside-governed-store decline move above the HUMAN_STAMP_RE fall-through, with no return between the function's first line and them."
  - "D-34 (2): a property claimed of a SET is asserted over a set DERIVED from the module's own AST — the appendAuditLedger root arguments and the skip-arm register both."
  - "D-34 (3): NOTE_SKIP_ARMS spreads READ_POSITION_CONDITIONS, so a sixth condition cannot arrive filed under a fifth arm's name."
  - "The decline clause order changes: destination-outside-governed-store now precedes every other clause, because the derivation cannot sit at the entry while its own decline sits eight clauses down."
  - "REJECTED, with the number that rejected it: giving admit() a ledger-root parameter distinct from its dial root. admit() is byte-frozen and takes ONE root for both; routing the record through a derived root routes the DIAL through it too, measured as 63 existing cases going RED on the dial. Published as R-31-33-01."
  - "REJECTED, with the number that rejected it: refusing an ungoverned contextRoot at appendNote/admitAndAppend. Measured: 121 and 26 existing call sites, and it reverses D-31's deliberate decision that the destination constraint is the re-binding route's property."
  - "CR-22 position 4 is MEASURED and PUBLISHED as R-31-33-02 rather than claimed closed: closing it decides where the shared verified context lives by default, which reverses either WR-10 or DEFAULT_CONTEXT_ROOT."
patterns-established:
  - "a distinctness claim is asserted over the axis that COLLAPSED (the arm cell), not over the whole rendered row — comparing whole rows passes on the pre-fix module"
  - "a fixture that only passed because a clause sat below a return is RE-AIMED, never re-baselined"
requirements-completed: [UATX-01, UATX-04]
coverage:
  - id: D1
    description: "promoteAdmitted derives the destination's owning repository at its ENTRY and carries it onto every return path, including the human-stamp fall-through"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#POSITION 1 (the fall-through): the note and its GOV-02 event land in the SAME repository"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 1 (CR-20 unmoved): the GATED promotion still lands both halves in the derived destination"
        status: pass
    human_judgment: false
  - id: D2
    description: "an ungoverned destination is a named decline raised before anything is written, on the fall-through path as well as the gated path"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#POSITION 2 (an UNGOVERNED destination): a NAMED decline, raised before anything is written"
        status: pass
    human_judgment: false
  - id: D3
    description: "admitAndAppend's gated branch appends the GOV-02 event at the root derived from its own contextRoot, not at repoRoot"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#POSITION 3 (admitAndAppend): the note and its GOV-02 event land in the SAME repository"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#GREEN 3: a deliberately DIFFERENT repoRoot can no longer move a record, at the three aimable appends"
        status: pass
    human_judgment: false
  - id: D4
    description: "the GOV-02 append still strictly precedes the note write at every derived write-both route (D-24 / WR-22 unmoved)"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 2 (D-24 / WR-22 unmoved): the GOV-02 append still PRECEDES the note write, per route"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#admitAndAppend: transposing its two statements turns the order assertion RED"
        status: pass
    human_judgment: false
  - id: D5
    description: "every condition that stops a note from being read is reported under an arm that is true of it, read from the authority's discriminant"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#every planted condition reports its OWN arm, read from the authority's discriminant"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#NO rendered row's detail contradicts its arm — asserted as a property over every arm"
        status: pass
    human_judgment: false
  - id: D6
    description: "NOTE_SKIP_ARMS is bound to ReadPositionCondition in both directions with an asserted cardinality, and the distinctness claim covers every ordered pair"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#NOTE_SKIP_ARMS and ReadPositionCondition are bound in BOTH directions, with a cardinality"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the FULL pairwise cross product of arms produces DISTINCT rendered rows"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#a SEEDED sixth condition moves the derived arm count by exactly one"
        status: pass
    human_judgment: false
  - id: D7
    description: "18-context-compaction.md states what the mechanism now does at both routes it names, with a disposition row for every changed clause"
    requirement: "UATX-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the ledger sentence describes the DERIVED destination, not a separately-named repository"
        status: pass
      - kind: manual
        ref: "npm run check:diff-disposition — 80 at the round-7 base, 86 with the prose and no rows, 78 with the rows; zero remaining clauses naming this file"
        status: pass
    human_judgment: false
  - id: D8
    description: "admit()'s frozen span and the prod-deploy guard blob are unmoved"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#admit()'s function span byte-hash equals the pinned pre-25-09 baseline (frozen, not green-inferred)"
        status: pass
      - kind: manual
        ref: "git hash-object hooks/guard.ts -> 669725bc1c616ab57123e22090d93d57eff1b001"
        status: pass
    human_judgment: false
  - id: D9
    description: "CR-22 position 4 (the DEFAULT arguments) — the split is NOT observable on this box because the kit and the host repository are one directory here"
    requirement: "UATX-01"
    verification:
      - kind: manual
        ref: "scripts/context-io.test.ts#POSITION 4 (the DEFAULT arguments): MEASURED, and recorded as R-31-33-02 rather than claimed closed"
        status: pass
    human_judgment: true
    rationale: >
      The measurement is machine-driven and the residual is machine-bound, but the DISPOSITION is a
      human call: closing this position means deciding whether the default shared verified context
      belongs to the kit or to the host repository, and either answer reverses a prior decision with
      a written reason (WR-10's host dial, or DEFAULT_CONTEXT_ROOT's kit store). Recorded as
      R-31-33-02 with the measurement rather than taken inside a gap-closure plan.
duration: 102min
completed: 2026-09-11
status: complete
---

# Phase 31 Plan 33: One Repository Per Action, and an Arm That Names What Is True Summary

**CR-22 and CR-24 closed by moving two properties to where they are established — the owning
repository derived at every write-both route's ENTRY rather than inside one arm, and a skipped
note's arm read from the authority's own discriminant rather than hand-typed beside it — with the
two boundaries that could not be closed published as driven residuals rather than claimed shut.**

## Performance

- **Duration:** 102 min
- **Started:** 2026-09-11T07:44:30Z
- **Completed:** 2026-09-11T09:26:51Z
- **Tasks:** 3
- **Files modified:** 10 (1 created)

## Accomplishments

### CR-22 — the three independently-reproduced positions, before and after

Every measurement below was taken in a scratch directory outside the repository tree, against the
**committed `scripts/context-io.js`**, with three real `mkdtemp` governance roots each asserted
`governanceRootOf(store) === root` **before any result was read**. Both probes printed the premise
line per root; the counts are the note count and ledger line count in **all three** roots after
every call — a probe that reads only the root it expects cannot see the split at all.

```
premise ORIGIN: governanceRootOf(store) === root -> true
premise THIRD:  governanceRootOf(store) === root -> true
premise DEST:   governanceRootOf(store) === root -> true
premise UNGOV:  governanceRootOf(store) -> null
```

| position | call | BEFORE (ORIGIN / THIRD / DEST) | AFTER |
|---|---|---|---|
| 1 — `promoteAdmitted` fall-through | `("T-3", …, verified_by:"", to=THIRD.store, repoRoot=DEST)` | notes 0/1/0, ledger ABSENT/**ABSENT**/**1** | notes 0/1/0, ledger ABSENT/**1**/**ABSENT** |
| 2 — ungoverned destination | the same call with `to=UNGOV.store` | UNGOV notes **1**; DEST ledger 1→**2** | **DECLINED (`destination-outside-governed-store`)**; UNGOV notes 0, no task dir, every candidate ledger unchanged |
| 3 — `admitAndAppend` | `("T-2", verified_by:"human:alice", contextRoot=DEST.store, repoRoot=THIRD)` | DEST notes **1** ledger **ABSENT**; THIRD notes 0 ledger **1** | DEST notes **1** ledger **1**; THIRD notes 0 ledger **ABSENT** |
| 4 — the DEFAULTS | no `contextRoot`, no `repoRoot` | note root `…/grugops/.grugops/context` → owner `…/grugops`; ledger root `trustedRepoRoot()` = `…/grugops` | **UNCHANGED — and the two COINCIDE on this box**, so the split is not observable here. Published as `R-31-33-02`, not claimed closed. |

Position 2's decline now fires on the **gated** path and the **fall-through** path alike, which is
what makes it a property of the function rather than of one arm.

### The fix is positional, not another predicate

`promoteAdmitted` derives `destinationRoot = governanceRootOf(to)` and raises its decline as the
**first thing the body does after `assertSafeTask`**. There is no return between the function's
first line and the derivation, so no path can reach a write without it. The fall-through passes that
derived root into `appendNote`. `admitAndAppend` derives the same answer at **its** entry and its
gated branch appends there.

`ADMIT_FROZEN_SHA256` re-measured **equal**: `08df9e5c15754f8b3f3bde417475652d3d3861c50fd5458704b29651b83709e9`.
`git diff 78a9d16..HEAD -- scripts/context-io.ts` shows **no byte changed inside the frozen span** —
the ledger root is threaded at the boundary, never by editing the frozen arm. `FROZEN_GUARD_BLOB`
re-measured `669725bc1c616ab57123e22090d93d57eff1b001`.

### CR-24 — the arm that names what is true

Reproduced first, with the review's own three plants plus a FIFO and a dangling symlink:

```
BEFORE   NOTE_SKIP_ARMS = ["unparseable","not-a-regular-file","vanished"]
         | …-acce0001.md | not-a-regular-file | …IS present and could not be opened (EACCES)…
         | …-fifo0001.md | not-a-regular-file | …is not a regular file…
         | …-over0001.md | not-a-regular-file | …It IS a regular file; what disqualifies it is its size…
         stat of the over-ceiling plant: isFile=true size=8388609 (ceiling 8388608)

AFTER    NOTE_SKIP_ARMS = ["unparseable","unopenable","not-a-regular-file","above-ceiling","vanished"]
         | …-acce0001.md | unopenable         |
         | …-fifo0001.md | not-a-regular-file |
         | …-over0001.md | above-ceiling      |
         | …-dang0001.md | vanished           |
         | …-unpa0001.md | unparseable        |
```

The published member list, quoted rather than paraphrased:
`["unparseable", "unopenable", "not-a-regular-file", "above-ceiling", "vanished"]` — cardinality 5,
asserted as `conditions.length + readerOwned.length` with the condition set at 3 and the reader-owned
set at exactly `["unparseable", "vanished"]`.

The EACCES case **ran and is quoted**: the premise case measured `chmod 000 denies a read to this
process -> true` on this box, so the `unopenable` arm is measurable here rather than
`UNKNOWN - verify`.

**Pairs compared:** 20 ordered pairs over 5 arms, which equals `5 × 4` — the count the arm
cardinality implies. The comparison is over the **arm cell**, not the whole row: comparing whole rows
PASSES on the pre-fix module, because two conditions filed under one arm still carry different detail
text, which is exactly how a collapsed arm reads as distinct to a test and identical to the human who
scans the arm column.

**Zero-skip byte identity**, proven with `cmp` against a capture taken from the pre-change committed
`.js`:
`cmp "<scratch>/zeroskip-before.md" "<scratch>/zeroskip-after.md"` → **exit 0, identical**.

### The derived route-set axis

`GREEN 3` drives all **three aimable `appendAuditLedger` call sites** — `promoteAdmitted`'s
fall-through arm, its gated re-binding arm, and `admitAndAppend`'s gated branch — each with a
`repoRoot` deliberately under a different repository from the store the note enters, and asserts the
record follows the store while the caller's `repoRoot` holds **notes 0, ledger ABSENT** across all
three. The route-set cardinality is held by the pre-existing derived axis in
`scripts/context-io-writer-set.test.ts` (`deriveNoteLedgerRoutes`), whose transposition control and
converse-shrink control were both re-aimed to the new argument name and re-driven green.

### Mutation proofs, in order

**Task 1** — mutant: the entry derivation moved back below the fall-through, keyed on `repoRoot`,
carrying `__GSD_MUTANT_31_33__`.
`npm run build` → `grep -c "__GSD_MUTANT_31_33__" scripts/context-io.js` → **1, MARKER FOUND**
(grepped BEFORE any result was read) → cases **3 failed / 7 passed** → reverted → marker count **0**
→ **10 pass / 0 fail**.

**Task 2** — mutant: the catch hand-labelling one arm again, carrying `__GSD_MUTANT_31_33_ARM__`.
`npm run build` → `grep -c` → **1, MARKER FOUND** → cases **3 failed / 7 passed** → reverted →
marker count **0** → **10 pass / 0 fail**.

### Hygiene

`find . -path ./node_modules -prune -o -type p -print` printed **nothing**.
`find .temp -mindepth 1` printed **nothing**. Every probe ran under the session scratchpad, removed
at the end of each probe (`scratch removed: gone`).
`git diff -- package.json package-lock.json` is **empty** (T-31-33-SC): this plan ran **no**
package-manager install.

## Task Commits

1. **Task 1 RED: three-root cases for CR-22's four positions** — `7610fef` (test). RED evidence:
   10 tests, 4 pass, 6 fail; `gsd_run check tdd-red-evidence` → `RED_EVIDENCE_OK
   (target_test_failed)`.
2. **Task 1 GREEN: the owning repository derived at every write-both route's ENTRY** — `77da7d8`
   (feat). `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io.test.ts`,
   `scripts/context-io-writer-set.test.ts`, `scripts/compactor.test.ts`, `hooks/hook-entry.{ts,js}`,
   `31-CONTEXT.md`.
3. **Task 2 RED: skip-arm cases for CR-24 and the Skipped-entries finding** — `70645d7` (test). RED
   evidence: 10 tests, 3 pass, 7 fail; `RED_EVIDENCE_OK (target_test_failed)`.
4. **Task 2 GREEN: the arm read from the discriminant, the arm set bound to the authority** —
   `8e6acd7` (feat). `scripts/context-io.{ts,js}`, `scripts/context-io.test.ts`,
   `hooks/hook-entry.{ts,js}`.
5. **Task 3: the workflow sentence, the disposition file, the manifest and D-34** — `6e07462`
   (docs). `agent-factory/workflows/18-context-compaction.md`,
   `docs/audit/29-style-dispositions/31-33.md`, `31-CONTEXT.md`, `scripts/context-io.test.ts`.

**Plan metadata:** `14d6bf1` (docs) — this summary, `STATE.md`, `ROADMAP.md` and
`deferred-items.md`.

`commits: 6` in the frontmatter is MEASURED, not narrated:
`git rev-list --count 78a9d163324baf5273304d7cbf9624233923ff8d..HEAD` → 6 at the closing commit,
which is the five task commits above plus this metadata commit.

No `refactor(31-33)` commit exists: neither task's GREEN left a shape that needed one, and a
refactor commit with no change would be a fabricated gate.

## Files Created/Modified

**Created**
- `docs/audit/29-style-dispositions/31-33.md` — nine disposition rows covering every clause this plan
  changed, plus the two `31-29` rowed as one two-sentence cell.

**Modified**
- `scripts/context-io.ts` / `.js` — the entry-level derivation and decline in `promoteAdmitted`; the
  derived ledger root in `admitAndAppend`; `READ_POSITION_CONDITIONS` as a runtime constant;
  `NOTE_SKIP_ARMS` spreading it; the discriminant-read catch; `R-31-33-01` and `R-31-33-02`.
- `scripts/context-io.test.ts` — two new describe blocks (20 cases); the 31-29 IN-14 distinctness
  case corrected; the WR-18, CR-08, CR-05, WR-15 and D-19 fixtures re-aimed.
- `scripts/context-io-writer-set.test.ts` — `EXPECTED_DECLINE_ORDER` re-derived with the adjacency's
  reason; `stageProbe` and the entry-set fixtures re-aimed; the order-axis anchors updated.
- `scripts/compactor.test.ts` — the CR-05 and D-19 pass-through fixtures re-aimed.
- `hooks/hook-entry.{ts,js}` — `DECIDER_MANIFEST` regenerated; `scripts/context-io.js` →
  `909b4771c2e4d977d9682e0e24405c26709b19c180ccf0ae6a6b7f41912248a4`, equal to a fresh digest of the
  committed file, with the manifest re-derived as a whole (2 deciders, 26 module hashes).
- `agent-factory/workflows/18-context-compaction.md` — six clauses.
- `31-CONTEXT.md` — the D-34 block.
- `deferred-items.md` — the pre-existing `check:diff-disposition` failure.

## Decisions Made

See the `key-decisions` block above. The two that matter most for the next round:

**Two boundaries are PUBLISHED rather than claimed closed**, each with the number that rejected the
alternative and each driven by its own case. `R-31-33-01`: an append reached **through** the
byte-frozen `admit()` still follows the caller's `repoRoot`, because that authority takes one root
for both the dial read and the append — routing the record through a derived root routes the DIAL
through it too, measured as **63** existing cases going RED on the dial rather than on the ledger.
`R-31-33-02`: CR-22's fourth position, measured coinciding on this box.

**The clause order changed, and the cost is stated.** `destination-outside-governed-store` now
precedes every other decline, including `unreadable-governance-config` and
`origin-outside-trusted-store`, which `WR-25` deliberately ordered. The derivation cannot sit at the
entry while its own decline sits eight clauses down, and the new adjacency carries its reason in
`EXPECTED_DECLINE_ORDER`'s docstring.

## Deviations from Plan

**[Rule 4 → recorded, not asked] The ledger-root parameter is NOT added to `admit()`, and
`appendNote` gets no new parameter**
- **Found during:** Task 1, MOVEMENT 3.
- **Issue:** the plan's artifact table and `31-REVIEW.md`'s own `Fix:` block ask for a ledger-root
  parameter on `appendNote` / `admit` / `admitAndAppend` defaulting to `governanceRootOf(contextRoot)`.
  The plan's own prohibitions forbid touching `admit()`'s frozen byte-span or re-basing
  `ADMIT_FROZEN_SHA256` — and that span is extracted from `export function admit(` to its matching
  brace, so it **includes the parameter list**. The two asks are in direct conflict.
- **Measured rather than argued.** The implementation that satisfies the review — threading a
  derived root into `admit()`'s existing root slot — was written, built and run: **63 tests RED**
  across 4 files, every one failing on the **governance dial** rather than on the ledger, because
  `admit()` uses that one parameter for both. A second measurement ruled out the adjacent
  alternative (refuse an ungoverned `contextRoot` at those writers): an instrumented run counted
  **121** `appendNote` calls and **26** `admitAndAppend` calls presenting an ungoverned `contextRoot`
  in the existing suite, and **6** of those reaching the gated branch.
- **Fix:** the three GOV-02 appends this module can AIM — `promoteAdmitted`'s two arms and
  `admitAndAppend`'s gated branch — are aimed at the derived root, which closes all three
  independently-reproduced positions. The appends reached through the frozen authority are published
  as `R-31-33-01` with the measurement and the criterion that would close them.
- **Files:** `scripts/context-io.ts`, `31-CONTEXT.md` (D-34's second rejected alternative).
- **Verification:** `R-31-33-01 DISCLOSED: an append reached THROUGH the frozen authority still
  follows repoRoot` drives the boundary; `ADMIT_FROZEN_SHA256` re-measured equal.
- **Committed in:** `77da7d8`.

**[Rule 4 → recorded, not asked] `admitAndAppend` does NOT decline an ungoverned `contextRoot`**
- **Found during:** Task 1, MOVEMENT 3 (`"decline when the derived root is null, with the same named
  clause"`).
- **Issue:** doing so reverses `D-31`'s explicit NOT-ESTABLISHED bullet — "this is a property of the
  RE-BINDING route, not of the module" — which is a decision about the module's contract rather than
  a fix for the finding. Measured cost above.
- **Fix:** the decline stays a property of `promoteAdmitted`, now at its entry so it covers every
  path. `R-31-33-01` records what is left and D-34 records the rejected alternative with its numbers.
- **Committed in:** `77da7d8`.

**[Rule 4 → recorded, not asked] CR-22 position 4 is MEASURED and PUBLISHED, not closed**
- **Found during:** Task 1, MOVEMENT 1 / GREEN 1.
- **Issue:** the defaults name the KIT's store for the note and the HOST repository for the ledger.
  Making them name one repository requires choosing which — and deriving `repoRoot` from the kit
  store reverses `WR-10` (the host repository is the ONE trusted dial answer every tier asks), while
  re-pointing `DEFAULT_CONTEXT_ROOT` at the host repository moves every READER's default with it and
  decides where the shared verified context lives.
- **Fix:** measured on this tree, recorded as `R-31-33-02` with its case, and named in D-34's
  `WHAT D-34 DOES NOT ESTABLISH`. On this box the two coincide, so the split is **not observable
  here** — stated as such rather than reported as a pass.
- **Committed in:** `77da7d8`.

**[Rule 2 - Missing critical] D-34 was written in Task 1 rather than Task 3**
- **Found during:** Task 1 GREEN.
- **Issue:** `WRITE_PATH_RESIDUALS` is bound two-sided against `31-CONTEXT.md` by
  `DIRECTION 1: every EXPORTED member has a WRITTEN disposition`. Adding `R-31-33-01`/`R-31-33-02`
  in Task 1 without their dispositions leaves Task 1 RED.
- **Fix:** Task 1 wrote the parts it establishes (D-34 (1), (2), both residuals, both rejected
  alternatives); Task 3 EXTENDED the same block with D-34 (3), the suite-encoded-the-bug note, the
  workflow-correction paragraph and the explicit D-31 amendment. No commit claims something not yet
  true when it is made.
- **Committed in:** `77da7d8` and `6e07462`.

**[Rule 1 - Bug] Two of my own RED cases passed pre-fix and were sharpened**
- **Found during:** Task 2 RED.
- **Issue:** the cross-product case compared whole rendered rows (which differ by detail text even
  when the arm has collapsed) and the contradiction case compared the authority's answer against the
  **fixture's** expected arm rather than the **rendered** arm. Both passed on the defective module.
- **Fix:** the cross product compares the ARM CELL — the axis that collapsed — and the contradiction
  property compares the authority's discriminant against the rendered arm. Both then failed RED and
  both are killed by the Task 2 mutant.
- **Committed in:** `70645d7`.

**[Rule 1 - Bug] The D-19 ledger case was VACUOUS and is re-aimed**
- **Found during:** Task 1 GREEN, collateral triage.
- **Issue:** `scripts/context-io.test.ts`'s `D-19 ledger` case read `repoRoot`'s ledger and asserted
  it did not grow. Post-`D-31` the promotion's event goes to the DESTINATION's derived root, so that
  assertion could not fail whatever the route did.
- **Fix:** both halves are measured where they land — the origin's repository, the destination's
  repository (one `re_bound` event), and `repoRoot` asserted to hold no ledger at all.
- **Committed in:** `77da7d8`.

**[Rule 1 - Bug] `Test 6a`'s construction is unreachable by design and is re-aimed**
- **Found during:** Task 1 GREEN.
- **Issue:** it seeded the origin under `repoRoot` and read `repoRoot`'s ledger. An admission is now
  recorded in the repository that OWNS the store it wrote into, and a governance root owns exactly
  ONE store — so "origin and destination in the same repository" is not a shape that exists.
- **Fix:** the D-19 (4) property is reached by the construction that does exist — promote twice. The
  first appends the `re_bound` event; the second meets a ledger that already records the id and
  appends nothing.
- **Committed in:** `77da7d8`.

**[Rule 3 - Blocking] Fixtures staging bare temp directories as destinations were RE-AIMED**
- **Found during:** Task 1 GREEN (63 → 28 → 3 → 0 red).
- **Issue:** `stageProbe`, the entry-set cases, the WR-15 driver, the CR-08 provenance cases and the
  CR-05 probes all passed a bare `mkdtemp` directory as `to`. Each was exercising a shape the route
  was never meant to accept — they passed only because the destination clause sat below the
  fall-through's return.
- **Fix:** each stages a real governed store; `stageProbe` and the entry-set fixtures stage it
  **inside the probe's own governance root**, which is the property this plan installs expressed as
  a fixture. No assertion was relaxed.
- **Committed in:** `77da7d8`.

**[Rule 3 - Blocking] The `EXPECTED_DECLINE_ORDER` adjacency moved**
- **Found during:** Task 1 GREEN.
- **Issue:** moving the decline to the entry puts `destination-outside-governed-store` ahead of
  clauses `WR-25` deliberately ordered.
- **Fix:** the constant is updated and the new adjacency carries a written reason in its docstring,
  including what the move costs a caller. D-34 records it as a stated cost rather than a slipped-in
  reorder.
- **Committed in:** `77da7d8`.

**[Rule 3 - Blocking] `WP-03` refused a 26-word sentence**
- **Found during:** Task 3.
- **Issue:** `Each route derives … and both halves of the action key on that one answer.` measured
  26 words against the 25-word descriptive bound.
- **Fix:** split in two, exactly as `31-29`'s own ledger sentences were, with its own disposition
  row. The prose was split rather than the corpus narrowed.
- **Committed in:** `6e07462`.

**Total deviations:** 10 (3 Rule-4-class recorded rather than asked, 3 Rule 1, 3 Rule 3, 1 Rule 2).
**Impact on plan:** all three independently-reproduced CR-22 positions and CR-24 are closed at the
coordinates they were raised on. CR-22's fourth position and the appends inside the byte-frozen
authority are the two boundaries this plan does NOT close, each published with its measurement,
its driven case and the criterion that would close it.

## Issues Encountered

**`npm run check:diff-disposition` is a pre-existing FAIL and remains one.** Measured 80 findings at
the round-7 base, 86 with the prose and no rows, **78** with the rows — below the count `31-31`
recorded and `31-32` re-measured. **Zero** remaining findings name a clause this plan authored; every
one names `05-pr-quality-gate.md`, `17-task-claim.md` or the frozen `## Stop conditions` region
`31-29` wrote. The plan's `<verify>` block asks this command to exit 0; it does not, and did not at
the base. Logged to `deferred-items.md` with `status: open` rather than cleared by narrowing the
corpus or moving the recorded base — both of which the gate's own remedy text forbids and both of
which would clear the finding by deleting its evidence.

**The plan's `<precondition>` for Task 2's EACCES probe was honoured, not assumed.** The premise case
measured `chmod 000` denying this process a read, so the `unopenable` arm is measured here rather
than recorded `UNKNOWN - verify`.

**Commits landed on `main`.** `git.branching_strategy` is `"none"` in `.planning/config.json`, the
orchestrator dispatched this plan as a sequential executor on the main working tree, and every prior
plan in this phase committed the same way. The executor protocol's protected-branch halt exists to
catch worktree drift; this is the project's configured, precedented state rather than drift.

## Bypass Probe Run

Per this repository's standing lesson that a green suite is not proof for a safety invariant, each
fix was adversarially probed before it was called done:

1. **"How is the gate REACHED, not only what does it refuse."** `promoteAdmitted`'s decline existed
   and was correct; the ordinary path returned above it. The probe that found this was driving the
   **fall-through** rather than the arm the previous round's reproduction walked.
2. **"Derive both sides of any set equality."** `NOTE_SKIP_ARMS` and `ReadPositionCondition` were two
   hand-typed literals that disagreed while both read complete. The arm set now spreads the
   authority's constant, asserted in both directions with a cardinality and a seeded sixth condition.
3. **"Ask what BOUNDS the predicate's input."** The cross-product case was run against the
   **pre-fix** module first and PASSED — because it compared whole rows. It was sharpened to compare
   the arm cell and re-run RED. Two of my own cases were caught this way.
4. **"Try to bypass your own fix."** Both mutants were applied to the SOURCE, rebuilt, and the
   **rebuilt `.js` grepped for the mutant's own marker with the grep result read BEFORE any test
   result** — the harness-premise assertion this phase has needed six times.

**Result:** the four measured positions are closed; the two positions the mechanism does not reach
are published as driven residuals rather than counted as closed.

## User Setup Required

None.

## Next Phase Readiness

The round-7 gap-closure wave-2 work is complete and the full excluded-e2e suite is GREEN at the
closing commit (64 files, 4157 passed, 2 skipped). `UATX-01` through `UATX-06` remain UNCHECKED in
`.planning/REQUIREMENTS.md`, every traceability row still reads `Gaps Found`, and the Phase 31
checkbox in `.planning/ROADMAP.md` is unmoved — `git diff --quiet HEAD -- .planning/REQUIREMENTS.md
.planning/ROADMAP.md` passes. Only a verification round may move them.

**What the next verification round should probe first**, given this plan's own residuals:
- `R-31-33-01` — drive `appendNote` and `admitAndAppend`'s non-gated branch with a divergent
  `repoRoot` and confirm the disclosure matches the mechanism, then decide whether `admit()`'s freeze
  should be re-based to separate the dial root from the ledger root.
- `R-31-33-02` — the DEFAULT split is unobservable on this box. It needs a shared-install-shaped
  layout, or a decision about where the shared verified context lives.
- The clause-order change: confirm no caller depends on `origin-outside-trusted-store` preceding
  `destination-outside-governed-store`.
- `CR-23` and `CR-25` (UATX-06) are untouched by this plan and remain open.

## Self-Check: PASSED

- Every `key-files.created` path exists (`[ -f ]`): `docs/audit/29-style-dispositions/31-33.md`
  FOUND.
- Every commit hash resolves: `7610fef`, `77da7d8`, `70645d7`, `8e6acd7`, `6e07462` all FOUND;
  `git log --oneline --all --grep="31-33"` returns 6.
- TDD gate: `git log --grep="^test\(31-33\):"` → 2; `"^feat\(31-33\):"` → 2. Both tdd tasks carry a
  RED and a GREEN commit.
- Plan `<verification>` re-run at the closing commit: suite exit 0 (64/64 files, 4157 passed);
  `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness &&
  npm run freshness:hook-manifest` all pass; `check:claim-anchors`, `check:audit-register`,
  `check-foundation-guards`, `check-uat-oracles` all `ALL CHECKS PASSED`;
  `ADMIT_FROZEN_SHA256` and `FROZEN_GUARD_BLOB` re-measured equal; `check:diff-disposition` 78 vs the
  recorded 80 (a pre-existing FAIL, recorded above and deferred, not faked into a pass);
  `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` byte-unchanged.
