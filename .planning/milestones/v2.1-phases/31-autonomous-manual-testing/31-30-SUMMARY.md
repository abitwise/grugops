---
phase: 31-autonomous-manual-testing
plan: 30
subsystem: infra
tags: [ci, windows, exit-codes, installer, disposition-register, audit-trail, gap-closure]

requires:
  - phase: 31-25
    provides: "D-28's two exit-code boundaries and its own 'what D-28 does NOT establish' block naming the non-unwinding fault — the gap this plan answers at the caller"
  - phase: 31-27
    provides: "the `.temp/**` vitest exclusion and canonicalDirectoryPath — the runner hygiene this plan's residue predicate measures, and the R-31-19-03 instrument half"
  - phase: 31-28
    provides: "the S2 type-checker cutover and PROGRAM_UNAVAILABLE_REASON — the runnable whose reachable return set this plan derives from source"
  - phase: 31-29
    provides: "governanceRootOf and the write-side ceiling — and, measured here, two disposition rows whose multi-sentence `after` cells cover nothing"
provides:
  - "a FOURTH arm in the §14 gate's exit-code branch: a run that produced NO exit code is could-not-run, never a pass and never a finding"
  - "scripts/uat-gate-exit-contract.test.ts — the arm set derived from the workflow's prose, the runnable's reachable returns derived from its AST, both bound"
  - "scripts/check-platform-shapes.ts — the shape corpus driven on the running platform with a LOUD, RECORDED skip list"
  - "two new steps on the PRE-EXISTING windows-latest CI leg, one of them Windows-scoped and demanding a non-empty remainder"
  - "R-04 CLOSED by a five-outcome installer round-trip harness against the real committed installer"
  - "three owed disposition files (31-21.md, 31-22.md, 31-23.md) with DERIVED attribution — the debt falls 112 -> 80"
  - "docs/audit/harness-false-result-instances.md — one tracked list, contiguous ordinals, the round-5 collision annotated and no SUMMARY rewritten"
  - "decision D-32 with an explicit 'what D-32 does NOT establish' block"
affects: [31-31, ci, windows-portability, disposition-register, installer]

actuals:
  # estimateTokens scale (chars/4) over the realized diff for the WHOLE plan range,
  # b0232ae..HEAD — 196,714 chars. Estimate was 80,000; the plan came in over it, driven by
  # three derived-set pins firing (each needing a re-derivation and a written decision) and by
  # one deviation that removed a whole probe position.
  tokens: 49179
  tasks: 3
  # MEASURED, and stated at its FIXED POINT so it stops moving.
  #
  # This number chases itself: every commit that corrects it is another commit. It was written
  # at 4 (the count when the SUMMARY was composed), re-measured at 6 (after the SUMMARY and the
  # state/roadmap commits), and 6 was already stale once the correction and the broken-windows
  # ledger commits landed. So it is stated as the value it HAS once the commit carrying this
  # note is in: `git rev-list --count b0232ae..HEAD` -> 9, checkable by anyone at any later HEAD
  # because the base is pinned.
  #
  # Composition, in order:
  #   49bb4cd  feat  task 1 — the gate's fourth arm
  #   8cff6d8  feat  task 2 — the Windows leg and R-04
  #   382ef2b  docs  task 3 — the debt, the tally, D-32
  #   96726c6  fix   deviation 5/6 — the dropped ledger position and the call-site decision
  #   67cdaee  docs  this SUMMARY
  #   39b2db3  docs  state + roadmap
  #   195fd83  docs  the first correction to this field
  #   6a7b933  docs  the broken-windows ledger rows
  #   (this)   docs  the fixed-point correction
  commits: 9
plan_head_before: b0232aeac0293b6b957f5d0bdbf352e8662552a8

tech-stack:
  added: []
  patterns:
    - "answer a recorded non-establishment at the CALLER when the callee structurally cannot"
    - "a skip list is a DIFFERENTIAL measurement — run the probe on every platform so the EMPTY half is observed too"
    - "a human item whose `why_human` describes a harness is a harness"
    - "attribute a debt with the gate's OWN attribution, never with a guess; claim no clause whose carrier set omits the named plan"
    - "a tally becomes an INDEX by being one list with the numbering read off it; a prior SUMMARY is annotated, never rewritten"
    - "when a derived pin fires, re-derive and write the DECISION — do not bump the constant"

key-files:
  created:
    - scripts/uat-gate-exit-contract.test.ts
    - scripts/check-platform-shapes.ts
    - scripts/check-platform-shapes.js
    - docs/audit/29-style-dispositions/31-21.md
    - docs/audit/29-style-dispositions/31-22.md
    - docs/audit/29-style-dispositions/31-23.md
    - docs/audit/29-style-dispositions/31-30.md
    - docs/audit/harness-false-result-instances.md
  modified:
    - .github/workflows/ci.yml
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/checklists/browser-uat-recipe.md
    - install/install.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/context-io-writer-set.test.ts
    - package.json
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-32 (1): a run that produced NO exit code is a fourth arm at the CALLER, not a fifth exit code at the runnable — a process killed by a signal runs no `catch` clause, so the runnable structurally cannot answer for it"
  - "D-32 (2): a platform claim is a MEASUREMENT or a recorded skip and never a green row; the corpus runs on EVERY leg because a skip list nobody has watched be empty is a list nobody has watched"
  - "D-32 (3): a human item whose `why_human` describes a harness is a harness — R-04 is closed by five cases against the real committed installer"
  - "D-32 (4): a debt is paid in the OWNING plan's file with DERIVED attribution, and `00-base.md` and the watched corpus are asserted unmoved"
  - "D-32 (5): a tally becomes an index by being ONE list with the numbering read off it; the round-5 collision is annotated and neither SUMMARY is rewritten"
  - "R-03 was MIS-SCOPED in the record: the windows-latest job has existed since plan 20-04, and adding it again would have been a fabricated closure"

patterns-established:
  - "Pattern: derive a caller's branch arms from its OWN prose, fail-closed on an unresolvable region, and assert the callee's reachable outcomes are a SUBSET of them"
  - "Pattern: a probe's SKIP is a first-class recorded artifact carrying shape, position, platform and reason — and an empty list prints `(none)` explicitly so 'nothing skipped' and 'never produced' are distinguishable"
  - "Pattern: a disclosed test seam (`FORCE_ABSENT`) exists so the arm a platform cannot reach is still watched somewhere a developer can see it"
  - "Pattern: when a guard fires on a probe, move the PROBE — widening the predicate or publishing a new export from a safety module is adding a shipped surface for a test"

requirements-completed: []  # UATX-02, UATX-03 and UATX-05 are this plan's declared requirements and
# are DELIBERATELY not marked complete. `.planning/ROADMAP.md` §"Phase 31" states the governing rule
# in its own words: "UATX-01…UATX-06 stay `[ ]` / Gaps Found: only a verification round may flip a
# requirement." Executing a gap-closure plan is not verifying it.

coverage:
  - id: D1
    description: "The §14 gate's exit-code branch carries a FOURTH arm — a run that produced no exit code is recorded as could-not-run with the signal named, never a pass and never a finding."
    requirement: "UATX-05"
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#derives FOUR arms, pairwise distinct, from the UAT spec-integrity bullet"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the signal arm names could-not-run, and says never a pass and never a finding"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#CONTROL: the three pre-existing arms are byte-identical to what plan 31-25 left"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every outcome the spec-integrity runnable can reach has a caller arm: its reachable return values are derived from its syntax tree and asserted a SUBSET of the numeric arms, with an unfollowable return red rather than dropped."
    requirement: "UATX-05"
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#derives the runnable's reachable return values from its syntax tree, with nothing unresolved"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#SEEDED MIRROR: a fifth return no arm handles turns the subset assertion red"
        status: pass
    human_judgment: false
  - id: D3
    description: "Two steps added to the PRE-EXISTING windows-latest CI leg drive the portable shape corpus, the exit-code contract and the R-31-19-03 directory-identity premise, with the skip list asserted rather than merely printed."
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the new corpus step runs on EVERY leg, so the empty half of the skip list is observed too"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the Windows-scoped step IS Windows-scoped, and it demands a non-empty remainder"
        status: pass
      - kind: integration
        ref: "node scripts/check-platform-shapes.js (exit 0, 13 driven rows, skip list printed)"
        status: pass
    human_judgment: true
    rationale: "The steps were DRIVEN on darwin. What a windows-latest runner reports — which shapes it skips, whether the directory-identity verdict is degenerate, whether the two browser-absence probe stages behave identically — is not measurable from this box and is not claimed. That reading is the R-03 remainder and needs a human to take it off a real Windows run."
  - id: D4
    description: "R-04 CLOSED: the installer round-trip on a pre-existing host install runs as a five-outcome harness against the real committed install.js and uninstall.js."
    requirement: "UATX-02"
    verification:
      - kind: integration
        ref: "install/install.test.ts#R-04 (1): an install into an EMPTY temporary home succeeds and materializes the whole set"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#R-04 (2): a second install is idempotent as a SET, and the cardinality is asserted"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#R-04 (3): an install over the PRIOR shape materializes the Phase-31 runnable (the whole point)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#R-04 (4): the uninstaller removes the Phase-31 runnable it materialized"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#R-04 (5): an uninstall from a home with NOTHING installed is a clean no-op (edge probe 2)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The check:diff-disposition debt is paid down 112 -> 80 by three disposition files written for their owning plans with DERIVED attribution, without moving the base commit or narrowing the watched corpus."
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition (112 findings before, 80 after; corpus 40, base 4d2b8f0 both unchanged)"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#`00-base.md` still records the base commit round 5 measured against"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40"
        status: pass
    human_judgment: true
    rationale: "This directory's own README records the governing limit: 'It records that a change was considered. It does not record that the consideration was correct.' Whether each of the 32 rows states the right reason for the clause it covers is a human reading of the rows against the diff, and no gate reaches it."
  - id: D6
    description: "The harness-instance tally becomes an INDEX: one tracked list with contiguous unique ordinals, the round-5 collision annotated, and no SUMMARY rewritten."
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the tracked list exists and its ordinals are contiguous from one, with no duplicate"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#every ordinal-claiming sentence in the scanned set appears in the tracked list"
        status: pass
      - kind: other
        ref: "git diff --name-only b0232ae..HEAD -- '.planning/phases/31-autonomous-manual-testing/*SUMMARY.md' (empty)"
        status: pass
    human_judgment: true
    rationale: "The list is a FLOOR, not a total: a harness corrected silently leaves no citation and cannot appear in it, and §9.4's claim that 31-23 recorded a further unnumbered instance could not be substantiated. Whether the thirteen rows are the right thirteen is a human reading of the phase's records."
  - id: D7
    description: "Decision D-32 recorded in 31-CONTEXT.md with an explicit 'what D-32 does NOT establish' block naming R-01, R-02, the Windows remainder, R-31-19-03's remainder, the 80 remaining findings with owners, the 14 unguarded mkfifo sites, and the instance list's floor."
    verification: []
    human_judgment: true
    rationale: "A decision record's adequacy — whether the non-establishment block names everything it should — is a human judgement about completeness, and the failure mode is an omission no scan can see."

duration: 82 min
completed: 2026-09-10
status: complete
---

# Phase 31 Plan 30: Process-side and portability-side closure Summary

**A fourth arm in the §14 gate for a runnable killed by a signal, two shape-corpus steps on the CI leg that already existed, R-04 closed by a harness that was always possible, and the round-5 debt paid down 112 → 80 with the measuring stick unmoved.**

## Performance

- **Duration:** 82 min
- **Started:** 2026-09-10T12:15:00Z (approx — first read of the plan)
- **Completed:** 2026-09-10T13:37:44Z
- **Tasks:** 3
- **Files modified:** 17 (8 created, 9 modified)

## Accomplishments

- **D-28's recorded non-establishment is answered at the one caller that can answer for it.** A run
  that produced no exit code — killed by a signal or by the operating system — is now a fourth arm in
  `05-pr-quality-gate.md` step 3: recorded as could-not-run with the signal named, short-circuiting to
  the blocked terminal result exactly as exit `2` does, never read as a pass and never as a finding.
- **`R-03` was mis-scoped in the record, and the correction is the substance.** The
  `windows-latest` job has existed since plan `20-04`. Two STEPS were appended to it instead — one on
  every leg so the skip list is a differential measurement, one Windows-scoped under
  `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS` so an empty remainder there is a FAILURE.
- **`R-04` is CLOSED by a harness.** Five outcomes driven against the real committed installer and
  uninstaller, with every measured value recorded.
- **The `check:diff-disposition` debt fell 112 → 80** — 32 clauses dispositioned in three files
  written for their owning plans, every row's attribution taken from the gate's OWN
  `attributeClauses()` rather than from a guess, with `00-base.md`'s base commit and the watched
  corpus both asserted unmoved.
- **The harness-instance tally became an index.** Thirteen rows, contiguous ordinals, the round-5
  collision annotated, and both colliding SUMMARYs left saying exactly what they said.
- **Three derived pins fired and each forced a DECISION rather than a bump**, and a fourth guard
  fired correctly enough to remove a whole probe position.

## Task Commits

1. **Task 1: the gate's fourth arm, end to end** — `49bb4cd` (feat)
2. **Task 2: the Windows leg drives the shapes, and R-04 stops being a human item** — `8cff6d8` (feat)
3. **Task 3: pay the debt, index the tally, record D-32** — `382ef2b` (docs)
4. **Deviation fix: drop the GOV-02 ledger position** — `96726c6` (fix)

**Plan metadata:** `67cdaee` (this SUMMARY), `39b2db3` (state + roadmap), `195fd83` and this
commit (the `commits:` field, corrected to its fixed point), `6a7b933` (broken-windows ledger).
**Measured total:** `git rev-list --count b0232ae..HEAD` → **9**, with the base pinned so the
number stays checkable at any later HEAD. The full composition is listed in the `actuals` block.

## Measured evidence

### Task 1 — the exit-code arms

| Measurement | Command | Result |
|---|---|---|
| the arm set BEFORE the change | derived from `05-pr-quality-gate.md`'s own prose | **cardinality 3** — `0`, `1`, `2` |
| the paragraph, verbatim | — | ``Branch on the exit code. `0` → every UAT spec is clean, pass. `1` → a spec-integrity finding, which the gate flags, naming the file and the line. `2` → the checker did not run, which is an error distinct from a clean fail. Exit `2` is recorded as such and never read as a pass.`` |
| the signal drive, for real | `node scripts/runnable-ref/uat-spec-integrity.js <40-spec probe repo>`, SIGKILL at 80 ms (a 286 ms run) | `EXIT CODE: null`, `SIGNAL: "SIGKILL"`, **0 bytes stdout, 0 bytes stderr** |
| the same, with SIGTERM | as above | `EXIT CODE: null`, `SIGNAL: "SIGTERM"`, 0 bytes both streams |
| did any derived arm match? | — | **No.** `null` is not `0`, `1` or `2`. |
| the arm set AFTER | same derivation | **cardinality 4** — `0`, `1`, `2`, `no exit code` |
| CONTROL: the three existing arms | quoted before and after | **byte-identical**, asserted as a permanent case |
| the runnable's reachable returns | derived from `uat-spec-integrity.ts`'s AST, following `main` → `runMain` → `reportMeasured` through the `??`-default alias | **`{0, 1, 2}`**, `unresolved: []`, 3 functions walked |
| subset assertion | `{0,1,2} ⊆ numeric arms {0,1,2}` | holds |
| seeded mirror — a fifth return | `return 7` injected into `main` | derived set gains `7`, subset assertion **RED** |
| seeded mirror — arm removal | one arm removed from the prose | count moves **4 → 3**, exactly one |
| recipe ↔ workflow agreement | both directions over the numeric arms | holds; the non-numeric arm is disclosed by the recipe, which now points at the caller |

### Task 1 — the residue predicate, measured rather than asserted

With `.temp/31-30-residue-probe.txt` planted:

```
$ git check-ignore -v .temp/31-30-residue-probe.txt
.gitignore:19:.temp/	.temp/31-30-residue-probe.txt

$ git status --short .temp
                                  ← EMPTY. exit 0. The file is right there.

$ find .temp -mindepth 1 -maxdepth 1 -name '31-30*'
.temp/31-30-residue-probe.txt     ← the real predicate sees it
```

That is why rounds 3, 4 and 5 could measure a clean `.temp/` while 57 artifacts survived under it.
The predicate is now a real listing plus a named-pipe sweep, and both are permanent cases.

### Task 2 — the Windows leg, enumerated FROM the file before anything was written

The `test` job declares `os: [ubuntu-latest, windows-latest]`. Measured by parsing the workflow, the
Windows leg ALREADY ran six steps: `Checkout` (`fetch-depth: 0`), `Setup Node 22`,
`Install (dev deps only — typescript/vitest/@types/node)`,
`Build (every other leg — a compile; parity is asserted on ubuntu, see above)`,
`Typecheck (shipped source + test-inclusive target)` and `Vitest (e2e lane excluded)`.
**No sentence in this plan claims a new job was added, because none was.**

What it did NOT do was make legible what the platform could not construct. Two steps were appended:

| Step | Guard | What it does |
|---|---|---|
| `Platform shape corpus, exit-code contract and directory identity (every leg)` | none | `node scripts/check-platform-shapes.js` — the differential measurement |
| `Windows shape remainder is recorded, not silent (windows only)` | `matrix.os == 'windows-latest'` | the same gate with `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS: "1"`, under which an EMPTY skip list is a FAILURE |

Both sit BEFORE the vitest step, for a measured reason recorded below. Neither ubuntu-only gate moved,
and the freshness/repo block is still the LAST step — which `(r-bound-synthetic)` depends on.

**`node scripts/check-platform-shapes.js` on darwin: exit 0, 13 driven rows.**

```
  note path                      ordinary regular file (CONTROL)    not refused (correct)
  note path                      directory                          named refusal
  note path                      FIFO                               named refusal
  note path                      symlink … (CONTROL — it resolves to one)  not refused (correct)
  DECIDER_MANIFEST module path   ordinary regular file (CONTROL)    not refused (correct)
  DECIDER_MANIFEST module path   directory                          named refusal
  DECIDER_MANIFEST module path   FIFO                               named refusal
  DECIDER_MANIFEST module path   symlink … (CONTROL)                not refused (correct)
  spec-integrity exit contract   no repository root argument        exit 2
  spec-integrity exit contract   a root that does not exist         exit 2
  spec-integrity exit contract   a root that is a regular file      exit 2
  spec-integrity exit contract   a root deriving zero specs         exit 2
  R-31-19-03 directory identity  darwin home vs parent              distinct

SKIPPED SHAPES (0):
  (none) — this platform constructed every shape in the corpus
```

**The skip list's non-empty arm, reached through the disclosed `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT`
seam** (darwin constructs every shape, so without it that arm would never execute where a developer
can watch it):

```
SKIPPED SHAPES (2):
  shape="FIFO" position="note path" platform=darwin: named pipes on Windows live in the \\.\pipe\ …
  shape="FIFO" position="DECIDER_MANIFEST module path" platform=darwin: named pipes on Windows …
```

**And the silent-remainder arm is RED:** with `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS=1` and an empty
list the gate exits **1** naming `the skip list is EMPTY`.

**`R-31-19-03`, measured on darwin:**

```
R-31-19-03 — directory identity on darwin
  home        /Users/olgeroeselg  dev:ino=16777234:497384
  its parent  /Users              dev:ino=16777234:16989
  degenerate  no — the identity sets are trusted
```

This plan supplies the INSTRUMENT. The residual's own register entry says it is measurable only on a
platform reporting degenerate identity, so it is **SHRUNK, not closed**, and the Windows verdict is
the remainder.

### Task 2 — the installer round-trip (R-04), five outcomes, every value measured

| # | Outcome | Measured |
|---|---|---|
| 1 | install into an EMPTY temporary home | `readdirSync(home)` is `[]` before; installer exits **0**; materialized SET has **3** members, equal to the derived `RUNNABLES` destinations |
| 2 | second install idempotent as a SET | set equality both directions, cardinality **3 = 3**, `tools/grugops/uat-spec-integrity.js` byte-identical across runs |
| 3 | install over the PRIOR shape | third runnable removed → premise asserted at **2**; re-install exits **0**; the file exists, byte-identical to `scripts/runnable-ref/uat-spec-integrity.js`; the run prints `created … tools/grugops/uat-spec-integrity.js` and `(target already has it — D-04)` for the other two; the set returns to **3** |
| 4 | uninstall removes it | exits **0**; gone; `materializedSet` is `[]`; prints `… (grugops runnable, byte-identical to source)`; `CLAUDE.md` and `plans/board.md` untouched |
| 5 | uninstall from a home with NOTHING installed | exits **0**, clean no-op: the content-addressed tree snapshot is byte-identical before and after |

`npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts` → **136 passed, 1 skipped**.

### Task 3 — the debt, before and after

`npm run check:diff-disposition` at `8cff6d8`, before a Task-3 row was written:
`39 watched file(s) changed since 4d2b8f0; 2250 changed clause(s) derived` →
**`112 finding(s) over 39 elements`** (round 5 recorded 110).

| File | round 5 | before | **after** | Owner of what remains |
|---|---|---|---|---|
| `05-pr-quality-gate.md` | 38 | 38 | **38** | `31-04`/`31-05`/`31-06`/`31-08` |
| `06-uat-pack.md` | 25 | 25 | **25** | `31-04`/`31-05`/`31-06`/`31-08` |
| `16-context-read-write.md` | 16 | 16 | **10** | `31-15` |
| `17-task-claim.md` | 2 | 2 | **2** | `31-05`/`31-06`/`31-08` |
| `18-context-compaction.md` | 29 | 31 | **5** | `31-29` — a NEW finding, below |
| **total** | **110** | **112** | **80** | |

**This plan's own contribution to the debt is ZERO, measured by set difference rather than asserted:**
its Task-1 workflow edit moved the count 112 → 116, and `docs/audit/29-style-dispositions/31-30.md`
covered exactly the four clauses it added, returning it to 112.

**`00-base.md`'s `base_commit` is still `4d2b8f079cc43d7d6184729966492789fb4dc05e` and the gate still
reports `watched corpus: 40 markdown file(s)`.** Both are now asserted by cases — the gate's own
message names moving either as clearing a finding by deleting its evidence.

**Attribution is DERIVED.** `attributeClauses()` — the gate's own attribution, the same one
`companionSatisfied` consults — was run over the watched corpus and each undispositioned clause mapped
to its carrier commits. `31-23.md` (6 rows) covers the clauses whose carrier is `a38be64` alone.
`31-22.md` (12 rows, 6 with a filled `companion` cell for the frozen `## Stop conditions` section) and
`31-21.md` (14 rows) cover clauses carried by `12c7733` and `b3f666f`/`8cde300` respectively, six and
fourteen of which are ALSO carried by `31-29`'s commits because a one-line paragraph makes every
clause on it a changed clause of every carrier that touched the line. Those are claimed on
AUTHORSHIP, and each file says so in its own scope note. **No clause was claimed whose carrier set did
not include the named plan.**

### Task 3 — the tally

`docs/audit/harness-false-result-instances.md`: **13 rows, ordinals 1..13, contiguous, no duplicate.**
Each row names the record, the false premise, how it was caught, and the ordinal that record CLAIMED.

**No SUMMARY was edited.** `git diff --name-only b0232ae..HEAD -- '.planning/phases/31-autonomous-manual-testing/*SUMMARY.md'`
is **empty** over the whole plan, and a case reads `31-22-SUMMARY.md` and `31-25-SUMMARY.md` still
claiming "ninth" — which is the collision, preserved rather than repaired.

The ordinal gate's own scan, measured at this commit: **31 documents** (29 `*-SUMMARY.md` + 2
`docs/audit/31-*.md`), **11 ordinal claims across 6 documents**. The case asserts both numbers as a
vacuity floor, because a scan matching nothing would report an empty `missing` list and pass forever.

**A derived check confirms all five round-6 PLAN files carry `debt does not grow`, with the plan count
asserted at 5.**

## Files Created/Modified

- `agent-factory/workflows/05-pr-quality-gate.md` — the fourth exit-code arm (4 added clauses)
- `agent-factory/checklists/browser-uat-recipe.md` — points at the caller that decides the outcome it discloses
- `scripts/uat-gate-exit-contract.test.ts` — NEW, 32 cases: the arm derivation, the AST return derivation, both seeded mirrors, the recipe agreement, the residue predicate, the CI wiring, the skip list, the tally gate, the measuring stick, the round-6 debt criterion
- `scripts/check-platform-shapes.ts` / `.js` — NEW, the platform shape corpus with a recorded skip list
- `.github/workflows/ci.yml` — two steps appended to the pre-existing `windows-latest` leg
- `package.json` — `check:platform-shapes`
- `install/install.test.ts` — the five R-04 round-trip cases
- `docs/audit/29-style-dispositions/31-21.md` / `31-22.md` / `31-23.md` — the three owed files
- `docs/audit/29-style-dispositions/31-30.md` — this plan's own four clauses
- `docs/audit/harness-false-result-instances.md` — NEW, the tracked tally
- `scripts/check-foundation-guards.test.ts` — three derived pins re-derived (see Deviations)
- `scripts/context-io-writer-set.test.ts` — one derived pin, with the decision written out
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — R-01..R-04, the debt, the tally, and three new findings
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-32

## Decisions Made

**D-32**, appended to `31-CONTEXT.md` with five sub-decisions and an explicit
"what D-32 does NOT establish" block. The five, in one line each:

1. A run that produced no exit code is a fourth arm at the CALLER — the runnable structurally cannot
   answer for a signal death, because a killed process runs no `catch` clause.
2. A platform claim is a MEASUREMENT or a recorded skip and never a green row; the corpus runs on
   every leg because a skip list nobody has watched be empty is a list nobody has watched.
3. A human item whose `why_human` describes a harness is a harness.
4. A debt is paid in the owning plan's file with DERIVED attribution, and the measuring stick does not
   move.
5. A tally becomes an index by being one list with the numbering read off it; a prior SUMMARY is
   annotated, never rewritten.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan named a symbol that does not exist in the runnable**

- **Found during:** Task 1 (MOVEMENT 3)
- **Issue:** the plan's `read_first` and `behavior` name `runAnalysis` as the function whose return
  values must be derived. `scripts/runnable-ref/uat-spec-integrity.ts` has no such function; the
  reachable-return chain is `main` → `runMain` → `reportMeasured`.
- **Fix:** the derivation follows the REAL chain, resolving the `const report = deps.reportMeasured ?? reportMeasured`
  alias to its `??` default (the function the CLI actually runs) rather than hard-coding a name. A
  return it cannot follow is recorded as UNRESOLVED and turns the case red — asserted by its own
  seeded mirror.
- **Files modified:** `scripts/uat-gate-exit-contract.test.ts`
- **Verification:** `unresolved: []`, 3 functions walked, `{0,1,2}` derived; a seeded unfollowable
  return produces a non-empty `unresolved`.
- **Committed in:** `49bb4cd`

**2. [Rule 3 - Blocking] `TRIPWIRE_MODULES` fired on the new test module**

- **Found during:** Task 1
- **Issue:** `scripts/check-foundation-guards.test.ts` pins the test-module count EXACTLY, and adding
  `uat-gate-exit-contract.test.ts` moved it. The pin firing is the pin working.
- **Fix:** RE-DERIVED rather than incremented — `ls scripts/*.test.ts | wc -l` reports 58 — with the
  reason written into the constant's history block. Unlike the three bumps before it, this one lands
  in the SAME commit as the module it counts, and the comment says why.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` — 286 passed
- **Committed in:** `49bb4cd`

**3. [Rule 3 - Blocking] `(r-class-authority)` refused the new test file's own CI-block locator**

- **Found during:** Task 2
- **Issue:** the first draft located the ubuntu gate block by spelling its step name. `scripts/ci-workflow.testkit.ts`
  is the ONE authority for that question, and the guard derives its member set from the IMPORT and
  refuses any `scripts/*.test.ts` carrying a locator of its own. It named the file by name.
- **Fix:** the authority is imported and its constant used. `UBUNTU_BLOCK_READER_COUNT` re-derived
  2 → 3 with the reason recorded, in the same commit.
- **Files modified:** `scripts/uat-gate-exit-contract.test.ts`, `scripts/check-foundation-guards.test.ts`
- **Verification:** 286 passed
- **Committed in:** `8cff6d8`

**4. [Rule 3 - Blocking] Three derived module-corpus pins fired on the new non-test module**

- **Found during:** Task 2
- **Issue:** `scripts/check-platform-shapes.ts` is the first TOOLING module added to
  `NON_TEST_MODULE_COUNT`, and the `scripts/`-scoped corpus pin moved with it.
- **Fix:** re-derived — `git ls-files '*.ts'` minus `.test.ts`/`.d.ts` reports 75 with the module
  tracked, `ls scripts/*.ts` minus tests reports 52 — at all four sites (74→75, and 51→52 in three
  places including the `51 * 3` comparison count), each with its own reason.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 286 passed
- **Committed in:** `8cff6d8`

**5. [Rule 1 - Bug] The GOV-02 ledger position made the probe a governance-dial reader**

- **Found during:** the plan-level verification run
- **Issue:** the plan's `behavior` block names THREE positions including the GOV-02 ledger path.
  Reaching `appendAuditLedger` needs a governing configuration with `audit_retention` retained, so the
  fixture spelled a `factory.config.json` path and both dial names. Three cases in
  `scripts/context-io.test.ts` went red, including `exactly ONE site is the governance reader, and it
  is scripts/context-io.ts (AUTO-06)` — which admits exactly one and has no annotation escape.
- **Fix:** the POSITION was dropped, not the guard widened. The module does not read a dial; it writes
  a fixture, and the predicate cannot tell those apart — but widening it, or publishing a new export
  from a safety module so a probe can compose a fixture, would be adding a shipped surface for a test,
  and hiding the fixture bytes in a `.json` the scan does not read would clear the gate without
  answering the question it asks. Driven rows 17 → 13; the forced skip list 3 → 2.
- **Files modified:** `scripts/check-platform-shapes.ts` / `.js`, `.planning/…/deferred-items.md`
- **Verification:** `scripts/context-io.test.ts` + `scripts/uat-gate-exit-contract.test.ts` — 599 passed
- **Committed in:** `96726c6`

**6. [Rule 3 - Blocking] `EXPECTED_APPEND_NOTE_CALL_SITES` fired, and forced a decision**

- **Found during:** the plan-level verification run
- **Issue:** the probe's child-process driver source calls `appendNote`, and the pin's own message says
  "each one is a place an artifact-ref could be authored, so the count is a decision rather than a
  bumped constant".
- **Fix:** the decision was MADE and written out: the site is COUNTED (it genuinely is such a place),
  and what bounds it is stated — a `mkdtemp` destination removed in a `finally`, a `kind: observation`
  with no `refs`, and the same admission authority every other caller uses. Why it lives in a non-test
  source is answered too: the corpus must run as a CI STEP on the Windows leg independently of the
  suite. 5 → 6.
- **Files modified:** `scripts/context-io-writer-set.test.ts`
- **Verification:** 166 passed
- **Committed in:** `96726c6`

---

**Total deviations:** 6 auto-fixed (2 × Rule 1 bug, 4 × Rule 3 blocking).
**Impact on plan:** five of the six are derived-set guards firing exactly as designed on new files, and
each was resolved by RE-DERIVING and recording a decision rather than by adjusting a constant until the
case passed. The sixth removed one of three probe positions; the loss is measured, named, and carried
with an owner and a criterion. No scope creep, and no gate was relaxed.

## Issues Encountered

**A finding this plan raises and does NOT fix: five of `31-29`'s disposition rows cover nothing.**
`docs/audit/29-style-dispositions/31-29.md` exists and carries six rows, so `31-29` did write its file.
Two of those rows pack MULTIPLE SENTENCES into one `after` cell. `rowMatches()` compares
`normalizeSentence(row.after)` against a SINGLE derived clause, so a multi-sentence cell normalizes to
one long string that matches no clause at all. Both rows are substantively correct and both are
ineffective at the gate. **This is a CLASS, not one file's slip** — any row whose `before`/`after` is
not exactly one clause covers nothing, silently, while reading as work done, and no derived check
exists for it today. Owner `31-29`; criterion recorded in `deferred-items.md`.

**A second finding, and the reason the two new CI steps sit BEFORE the vitest step: fourteen of the
fifteen `mkfifo` call sites in this repository's test modules carry no platform guard.** They either
call `execFileSync("mkfifo", …)` bare or assert `spawnSync("mkfifo", …).status === 0` as a PREMISE. On
a Windows runner each is a failure rather than a skip. Attribution is by FILE and by commit and is
derived (`31-29` 8 sites' file, `31-21`, `31-27`, `30-11`); a per-site attribution was NOT derived and
is not claimed. **This is a property of the SOURCE, so darwin can measure it; what a Windows run then
does is NOT measurable from here and is NOT claimed.** Pre-existing, in four modules this plan does not
otherwise touch. Carried with an owner and a criterion.

## Known Stubs

None. Every case added by this plan drives a real mechanism against a real artifact — the committed
`.js` runnables, the committed installer, the real workflow prose, the real `.temp/` directory and a
real temporary home. Nothing returns a hardcoded value in place of a measurement.

## Windows measurement disclosure (no fabrication)

**Every measurement in this SUMMARY was taken on darwin.** The executor runs on darwin and cannot run a
Windows job. What this plan did about Windows is ENCODE two CI assertions; it did not measure their
outcome. The following rows are `UNKNOWN - verify` and are recorded as such rather than claimed:

| Row | Status |
|---|---|
| whether the FIFO shape is skipped on `windows-latest` | `UNKNOWN - verify` — expected, and asserted non-empty by the Windows step, but not observed |
| whether the symlink shape is skipped there | `UNKNOWN - verify` |
| whether `BROWSER_ABSENT_MARKER`'s two probe stages behave identically there | `UNKNOWN - verify` — both are resolution-and-existence checks, which is an ARGUMENT, not a measurement |
| whether `PARSER_ABSENT_MARKER` is reached there | `UNKNOWN - verify` |
| the `R-31-19-03` directory-identity verdict on Windows | `UNKNOWN - verify` — the instrument is wired; the reading is not taken |
| whether the `windows-latest` vitest step can reach green at all, given 14 unguarded `mkfifo` sites | `UNKNOWN - verify` — the SOURCE property is measured; the run's behaviour is not |

## Requirement rows — deliberately NOT flipped

`UATX-02`, `UATX-03` and `UATX-05` are this plan's declared requirements and **none is marked
complete.** `.planning/ROADMAP.md` §"Phase 31" states the rule in its own words: only a verification
round may flip a requirement, and executing a gap-closure plan is not verifying it. `requirements-completed`
is an empty array by decision, and `requirements.mark-complete` was not run.

## Plan-level verification

| Criterion | Result |
|---|---|
| four arms derived from the prose, covering every reachable outcome | **PASS** — 4 arms, `{0,1,2}` reachable, subset holds |
| the Windows leg drives the portable shapes with an asserted skip list; no new-job claim | **PASS** — `node scripts/check-platform-shapes.js` exit 0, 13 rows; `windows-latest` occurrences: 6 |
| the installer round-trip runs with five measured outcomes; R-04 closes | **PASS** — 136 passed, 1 skipped |
| the three owed disposition files exist with traced attribution; base and corpus unmoved | **PASS** — 112 → 80; base `4d2b8f0`; corpus 40 |
| the tally is one list, contiguous unique ordinals, derived document scan | **PASS** — 13 rows; 31 documents; 11 claims |
| `R-01`/`R-02` open with markers and owners; `R-03` shrunk to a stated remainder | **PASS** — quoted verbatim in `deferred-items.md` |
| `hooks/guard.ts` byte-frozen, no `DECIDER_MANIFEST` entry relaxed | **PASS** — `git hash-object hooks/guard.ts` = `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB` (`scripts/floor-invariance.test.ts:245`); `git diff b0232ae..HEAD -- hooks/` is empty |

**Gate battery, all at `96726c6`:** `check:build-parity` PASS · `freshness` PASS (61 committed `.js`
fresh) · `check:audit-register` PASS · `check:residual-citations` PASS · `check:claim-anchors` PASS ·
`check:imperative-lexicon` PASS · `check:nul-bytes` PASS · `check-foundation-guards` PASS ·
`check-uat-oracles` PASS · `npm run typecheck` PASS (all three targets).

**Full regression suite:** `npx vitest run --exclude '**/scripts/e2e/**'` →
**64 files passed, 4128 passed, 2 skipped, 0 failed**, 357 s.

**Probe residue after the final measurement:** `find .temp -mindepth 1` → **0 entries**;
`find .temp -type p` → **0 FIFOs**. Every probe root this plan created lives under the OS temp
directory or the session scratchpad, outside the repository tree.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for `31-31`, the round-6 closing measurement. What it inherits from this plan: a debt at **80**
  with every remaining finding owned by name; a tracked instance list whose next ordinal is **14**; a
  Windows leg whose remainder is stated rather than assumed; and one new finding class (a disposition
  row whose `after` packs multiple sentences covers nothing) that no derived check catches.
- **Not ready, and not claimed:** `R-01` and `R-02` need a named human. `R-03` and `R-31-19-03` need a
  reading taken off a real `windows-latest` run. The 14 unguarded `mkfifo` sites need their own plan.

## Self-Check: PASSED

- All 14 key files verified present on disk with `[ -f ]`.
- All 4 commits verified present with `git log --oneline --all`.
- Every plan-level `<verification>` bullet re-run and recorded above.
- Every task's `<acceptance_criteria>` re-run; the two that could not be satisfied as written
  (the `runAnalysis` symbol, the third probe position) are recorded as deviations 1 and 5 with the
  measured reason, not silently skipped.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-10*
