---
phase: 31-autonomous-manual-testing
plan: 20
subsystem: verification-evidence
tags: [gap-closure, round-4, closing-measurement, residual-register, disposition-ledger, audit]
status: complete

requires:
  - phase: 31-16
    provides: "D-20 — the marker-aware normaliser and the positional TestInfo binding (CR-09, CR-10, IN-10)"
  - phase: 31-17
    provides: "D-21 — the one-budget chain bound and the scope-aware canonicaliser (WR-19, WR-20)"
  - phase: 31-18
    provides: "D-22 — append-only at the write chokepoint, the trusted proof operand, the dial's value (CR-11, WR-17, WR-18)"
  - phase: 31-19
    provides: "D-23 — the home-directory stop and the published stop set (WR-21)"
provides:
  - "docs/audit/31-round4-residuals.md — the round's tracked record: a 31-row reproduction pairing table, a 35-row disposition ledger, a 24-member residual register, and the one-commit gate record"
  - "the eleven behavioral spot-checks re-driven in BOTH directions, with the plan's own miscount corrected against the committed table"
  - "three recorded disagreements, each with both figures printed and marked UNKNOWN - verify"
  - "an independent re-derivation of the checkpoint bookkeeping 31-REVIEW.md left as UNKNOWN - verify"
  - "the four standing human-verification items carried forward in 31-VALIDATION.md with their markers intact"
  - "deferred-items.md re-measured against a live diff-disposition count rather than the newest stale one"
affects: [31-VERIFICATION round 5, any later plan touching uat-spec-integrity, context-io, compactor or trustedRepoRoot]

actuals:
  tokens: 21164
  tasks: 3
  commits: 4

plan_head_before: 263d1a316175e040fa343de0311eb3a534babac2

tech-stack:
  added: []
  patterns:
    - "re-run a finding with the SOURCE DOCUMENT's own spelling; a closure that re-measures its own fixture has measured the fix and not the finding"
    - "when a fix moves a clause in FRONT of the one under test, run BOTH spellings and record both"
    - "derive the denominator with a command and STATE the equality, so a short ledger cannot be short silently"
    - "assert a measurement harness's own premise before believing its result — an empty denominator reports zero mismatches"
    - "a green suite is recorded as a FLOOR beside the reproductions, never in place of them"

key-files:
  created:
    - docs/audit/31-round4-residuals.md
  modified:
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md

key-decisions:
  - "The closure is structured reproductions-FIRST (§2–§5) with the suite recorded afterwards as a floor (§6), because for four consecutive verification rounds on this phase the green suite exercised NONE of the defects that round found."
  - "WR-21 is dispositioned PARTIALLY CLOSED, not closed: the at-or-above-home shape is closed and the below-home shape reproduces unchanged as residual R-31-19-01. Which of the two the round-4 verifier probed is UNKNOWN - verify, because neither source document records whether HOME was overridden."
  - "Where 31-18's clause ordering put WR-17's refusal in FRONT of the CR-11 clause under test, BOTH spellings were run — the round-4 original and an adjusted one that lets CR-11's own clause be the one asked — and both results recorded with the reason for the adjustment."
  - "The plan's own 'four failing / seven passing' split and its 'eleven rows plus three gate rows' read-first sentence were both measured against the committed table and found wrong (5 fail / 3 pass / 3 warning; 15 rows). The MEASURED values are used and the discrepancies are recorded rather than absorbed."
  - "31-18-SUMMARY.md's post-fix WR-17 table names a different decline clause on two of four rows than this re-measurement does. Both figures are printed and neither is chosen: UNKNOWN - verify."
  - "IN-11's own UNKNOWN - verify about checkpoint bookkeeping WAS independently re-derived this round, and the tautological first attempt at that re-derivation is recorded rather than discarded."

patterns-established:
  - "A closure round's denominator is DERIVED with a stated command and its exclusions are named individually, so 'no finding without a row' is an equality a reader can check rather than a claim."
  - "A residual is written as a situation with four fields — shape, reason as an argument, owning decision, and what would force it closed — so the next round starts from a register instead of rediscovering it as a finding."

requirements-completed: []

coverage:
  - id: D1
    description: "Every reproduction 31-VERIFICATION.md and 31-REVIEW.md recorded is re-run VERBATIM at one commit against the committed .js, using those documents' own probe spellings, and each result is paired with the result it replaces."
    requirement: UATX-06
    verification:
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js <probe> — 18 AST probes built from the source documents' spellings; results in docs/audit/31-round4-residuals.md §2.1–§2.3"
        status: pass
      - kind: command
        ref: "node probes against the committed scripts/context-io.js + scripts/compactor.js — CR-11 (both spellings), WR-17's four-row per-dial table, WR-18's six-row table, CR-08's legitimate promotion"
        status: pass
      - kind: command
        ref: "child-process probes with both project-directory variables REMOVED — WR-21 original / adjusted / above, WR-15's control, the inner-configuration case"
        status: pass
    human_judgment: false
  - id: D2
    description: "All eleven behavioral spot-checks are re-driven and stated beside their round-4 result, so the failing rows are shown moving and the passing rows are shown unmoved."
    requirement: UATX-01
    verification:
      - kind: other
        ref: "docs/audit/31-round4-residuals.md §3 — the both-directions table; 16 MOVED, 10 UNMOVED, 1 PARTIAL, 4 deferred to the gate record; partition sums to 31"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every finding, anti-pattern row and missing: bullet carries exactly one disposition row, and the ledger's totals are stated beside the source documents' own."
    verification:
      - kind: other
        ref: "docs/audit/31-round4-residuals.md §7–§8 — 11 + 10 + 8 + 6 = 35 rows against 34 source items; every `closed` row cites a measurement; rows citing none say UNKNOWN - verify in the disposition cell"
        status: pass
    human_judgment: false
  - id: D4
    description: "The whole excluded-e2e suite and every repository gate are measured green at ONE recorded commit with a clean tree, and the suite is recorded as a floor rather than as proof."
    verification:
      - kind: command
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — Test Files 62 passed (62), Tests 3702 passed | 2 skipped (3704), at 27f613a"
        status: pass
      - kind: command
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness — all clean; freshness reports 60 committed .js fresh"
        status: pass
      - kind: command
        ref: "node scripts/check-foundation-guards.js && node scripts/check-uat-oracles.js — both ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D5
    description: "The frozen floors are RE-MEASURED rather than assumed: guard.ts against FROZEN_GUARD_BLOB, and the WHOLE decider manifest against the current digest of every file it names."
    verification:
      - kind: command
        ref: "git hash-object hooks/guard.ts -> 669725bc1c616ab57123e22090d93d57eff1b001, equal to FROZEN_GUARD_BLOB"
        status: pass
      - kind: command
        ref: "the manifest walk — 26 entries checked across 2 deciders, 0 mismatches, with the harness's own premise asserted (26 parsed == 26 hex literals)"
        status: pass
      - kind: test
        ref: "scripts/floor-invariance.test.ts + hooks/guard.test.ts + hooks/admission-guard.test.ts — 439 passed"
        status: pass
    human_judgment: false
  - id: D6
    description: "The measurement environment is proven clean and the zero-specs canary is re-confirmed in isolation after cleanup."
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#derives zero specs from grugops's own repository root — 1 passed | 193 skipped, run in isolation after cleanup"
        status: pass
      - kind: command
        ref: "find .temp -name '*.uat.spec.ts' | wc -l -> 0; git status --short .temp -> empty"
        status: pass
    human_judgment: false
  - id: D7
    description: "UATX-01..06 stay unchecked and Gaps Found; the Phase 31 roadmap entry is not marked complete; no source file is modified."
    verification:
      - kind: command
        ref: "grep -c '^- \\[ \\] \\*\\*UATX-0' .planning/REQUIREMENTS.md -> 6; grep -c '^| UATX-0. | Phase 31 | Gaps Found |' -> 6; Phase 31 roadmap line still '- [ ]'"
        status: pass
      - kind: command
        ref: "git status --porcelain -- scripts hooks agent-factory install -> empty at every commit of this plan"
        status: pass
    human_judgment: false
  - id: D8
    description: "Whether the disposition of each finding is the one a reviewer would accept, whether the residual register's reasons are arguments rather than assertions, and whether WR-21's PARTIAL disposition is the right call."
    verification: []
    human_judgment: true
    rationale: "The mechanical halves are asserted — the pairing table's row count equals a derived denominator, the ledger's totals are stated as an equality, every closed row cites a measurement, and every figure is reproducible from a quoted command. Whether a PARTIAL disposition on WR-21 is acceptable rather than a sixth-round blocker is a judgment only a verification round may make, and it is deliberately left to it."

duration: ~55 min
completed: 2026-09-09
---

# Phase 31 Plan 20: The round-4 evidence re-measured against the finished tree — Summary

**Gap-closure round 4 closes with its evidence re-run against the FINDINGS' own probes rather than
the fix plans' fixtures: 31 reproductions paired at one commit, all eleven spot-checks driven in both
directions, 35 disposition rows against 34 source items, 24 residuals collected into one tracked
register — and WR-21 recorded as PARTIALLY closed rather than closed.**

## Performance

- **Duration:** ~55 min (start approximate — the plan's `record_start_time` step was not stamped at
  t=0; the first task commit is `2026-09-09T11:47:27Z` and the last `2026-09-09T12:08:17Z`)
- **Completed:** 2026-09-09
- **Tasks:** 3 of 3
- **Files changed:** 3 (1 created, 2 modified) — plus this summary and the metadata commit
- **Source files changed:** **0**, asserted at every commit

## Accomplishments

- **`docs/audit/31-round4-residuals.md`** (828 lines) — the round's tracked record, in twelve
  sections: the derived probe set, the 31-row pairing table, the both-directions spot-check table,
  the disagreements, the clean-environment proof, the one-commit gate record with its floor
  statement, the 35-row disposition ledger, the totals equality, the 24-member residual register,
  what the round did not do, the requirement-row confirmation, and what round 5 inherits.
- **Every reproduction re-run with the SOURCE DOCUMENT's spelling.** 18 AST probes, 4 context-io /
  compactor probes and 5 trusted-root probes, all against the committed `.js`, every probe directory
  deleted immediately after its measurement.
- **The one-commit gate record**, taken at `27f613a` with a clean tree: 62 test files / 3702 passed /
  2 skipped, build + typecheck + build-parity + freshness clean, both guard runnables `ALL CHECKS
  PASSED`, the structure validator green under its documented invocation contract.
- **Every frozen floor re-measured**, including the WHOLE 26-entry decider manifest rather than only
  the two entries this round moved.
- **Three disagreements found and recorded** rather than absorbed, each with both figures printed.
- **`IN-11`'s own `UNKNOWN - verify` independently re-derived** and closed.

## The headline finding: WR-21 is PARTIALLY closed

This is the one thing the fifth verification round should read first, and it is why this plan's
disposition for `WR-21` is **not** `closed`.

```
### ORIGINAL spelling — a planted ancestor merely NAMED `home`; the real HOME untouched
  homedir():         /Users/olgeroeselg
  trustedRepoRoot(): …/T/r5-root-BFADlp/home          ← the planted ancestor, STILL ADOPTED
  dial:              "all"

### ADJUSTED spelling — HOME set so the planted ancestor IS os.homedir()
  trustedRepoRoot(): /Users/olgeroeselg/Projects/public/grugops   ← the KIT
  dial:              "off"
```

`D-23` bounds the walk at `os.homedir()` and above. An ancestor **below** the home directory is still
adopted — deliberately, because refusing it would revert `WR-15`'s own green control (`project/a/b/c`
resolves to `project` with no marker on the path). `31-19` recorded the disagreement at the time as
residual **`R-31-19-01`**; this round is that residual's live evidence.

**`UNKNOWN - verify`:** neither `31-VERIFICATION.md` row 11 nor `31-REVIEW.md`'s WR-21 transcript
records whether `HOME` was overridden in the round-4 probe. Read literally (a scratchpad path that is
not under the real home directory) the round-4 probe is the ORIGINAL spelling and is **not** closed by
this round; read as intending a genuine home directory it is the ADJUSTED spelling and **is** closed.
Both readings are recorded; neither is chosen.

## Task Commits

1. **Task 1 (tracer) — re-run every round-4 reproduction and pair each result** — `27f613a` (docs)
2. **Task 2 — measure the whole repository at one commit and re-measure every frozen floor** —
   `e870287` (docs)
3. **Task 3 — disposition every finding, write the residual register, leave the requirement rows** —
   `3f93e4b` (docs)

**Commits:** `git rev-list --count 263d1a3..HEAD` = **3** at the moment this summary was written; the
plan's full ledger span at close is **4**, the three task commits plus the single combined
SUMMARY / STATE / ROADMAP metadata commit. `plan_head_before` is `263d1a3…`, persisted at
`.git/gsd-plan-head-before-31-20`, and is the base `/gsd-verify-work` will re-measure from with the
same instrument.

## The measurements, in one place

### The pairing table's denominator, DERIVED

| Shape | Where | Count |
|---|---|---|
| Behavioral Spot-Check rows | `31-VERIFICATION.md` | 15 |
| fenced MEASUREMENT blocks (5 `ts` blocks excluded by name — fix proposals and probe inputs) | `31-REVIEW.md` | 9 |
| "Prior findings status" rows carrying a measured Evidence cell (3 excluded by name) | `31-REVIEW.md` | 7 |
| **denominator** | | **31** |

The pairing table carries **31** rows. Partition: **16 MOVED**, **10 UNMOVED**, **1 PARTIAL**,
**4 deferred to the gate record**. 16 + 10 + 1 + 4 = 31.

### What moved

| Finding | Round-4 | Round-5 |
|---|---|---|
| CR-09 (chained `.soft`) | `0 findings`, EXIT=0 | `1 finding`, EXIT=1, naming `expect.configure().soft` |
| CR-09 second variant (chained `.configure({soft:true})`) | `0 findings`, EXIT=0 | `1 finding`, EXIT=1, naming `expect.configure().configure` |
| CR-10 (`testInfo.skip()` / `.fail()`) | `0 findings`, EXIT=0 | `1 finding`, EXIT=1, naming `test.info().skip` / `.fail` |
| CR-11 (destination overwrite) | same id returned, nothing thrown, note replaced | DECLINED; destination byte-unchanged, both spellings |
| WR-17 (four-row per-dial table) | `promoteAdmitted` WROTE on all four rows | REFUSED on all four rows |
| WR-18 (dial value never read) | `human_admission` zero occurrences in the body | `isGatedNote` consulted; both routes agree on all six dial values |
| WR-19 (4000-link chain) | `RangeError`, EXIT=1, stdout empty | EXIT=0, measurement line on stdout, stderr empty |
| WR-20 (shadowed rename) | `1 finding`, EXIT=1, naming a construct absent from the file | `0 findings`, EXIT=0 |
| WR-21 | ancestor adopted, dial `all` | **PARTIAL** — see above |

### What did NOT move, and was measured to prove it

All three round-4 `✓ PASS` rows, and all seven measured "Prior findings status" closures: CR-07 (3
findings, EXIT=1, plus three controls), WR-14 (both spellings), CR-08, WR-15, WR-16, IN-07, IN-08.

**The load-bearing "nothing broke" row is CR-08.** `31-18` added three decline clauses to the very
function CR-08's closure depends on. Re-driven: the legitimate human-disposed promotion still WROTE,
`compactor.promote` still threw the D-04 refusal, and the GOV-02 ledger still held exactly **1** line.
A round that added clauses and never re-drove the legitimate case would be repeating CR-08 itself.

### The gates, at `27f613a`

| Gate | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | 62 files / **3702 passed** / 2 skipped, exit 0 |
| `npm run build` / `typecheck` / `check:build-parity` | clean; `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `node scripts/check-foundation-guards.js` / `check-uat-oracles.js` | both `ALL CHECKS PASSED` |
| `git hash-object hooks/guard.ts` | `669725bc1c616ab5…`, **equal to** `FROZEN_GUARD_BLOB`; not re-based |
| the WHOLE `DECIDER_MANIFEST` | **26 entries checked** across 2 deciders, **0 mismatches** |
| `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` |
| `npm run check:diff-disposition` | **75 findings over 39 elements** — pre-existing, reconciled, unclosed |

The suite grew 3566 → 3702 across the round's four fix plans; the file count never left 62.

**These figures are a FLOOR, not the closure argument.** For four consecutive verification rounds on
this phase the green suite exercised **none** of the defects that round found — the round-4 report
says so in its own words, for the fourth time. The audit document states this explicitly in §6.4 with
the four-round table, so a later reader cannot mistake §6.1 for the argument.

## Disagreements recorded, not absorbed

1. **`31-18-SUMMARY.md`'s post-fix WR-17 table vs this re-measurement.** On the `off` and `absent`
   rows it records `origin-outside-trusted-store`; this round measures
   `human-stamp-not-gated-at-destination`. The measured clause order in the committed `.js` puts the
   WR-18 clause first, so the likely cause is that `31-18` took the table before its own Task-3
   clause landed — a hazard `31-18-SUMMARY.md` itself records one paragraph later. All four rows
   refuse in both records, so the safety consequence is nil; what differs is which clause the caller
   is told about. **Both printed; `UNKNOWN - verify`.**
2. **Row 3's "1 finding" (verification) vs "2 findings" (review).** Re-run both: the bare `it.skip`
   alone gives 1, the full `it.skip` + `it.describe.only` spelling gives 2. A difference in probe
   CONTENT, not in behaviour — the verifier's own parenthetical says so. **Resolved, no
   `UNKNOWN - verify` needed.**
3. **WR-21's two spellings** — above.

## Deviations from Plan

### 1. [Rule 1 — a plan premise contradicted by measurement] The plan's spot-check split does not match the committed table

- **Found during:** Task 1, MOVEMENT 3.
- **Plan premise:** truth 2 and Task 1's `behavior` block say "the four that FAILED are shown moving
  and the seven that PASSED are shown unmoved".
- **Measured** off `31-VERIFICATION.md`'s own status column: **3** `✓ PASS`, **5** `✗ FAIL`, **3**
  `⚠️`. 3 + 5 + 3 = 11. Neither of the plan's numbers is in the table.
- **Resolution:** all eleven are paired in both directions regardless, so nothing is lost; the
  MEASURED split is used and the plan's paraphrase is recorded in §3 as the stale half of the record.
  Adopting the plan's number would have carried an unmeasured figure forward, which is the class this
  phase keeps paying for.

### 2. [Rule 1 — same class] The plan's Task-1 read-first says "eleven rows plus the three gate rows"

- The committed table carries **15** rows: 11 behavioral and **4** gate rows. Task 2's own read-first
  says "rows 12 through 15", which is four and agrees. The measured value is used and the discrepancy
  is recorded in §1.3.

### 3. [Rule 2 — missing critical] The CR-11 probe needed a second spelling to measure the clause under test

- **Found during:** Task 1, MOVEMENT 2.
- **Issue:** `31-18`'s clause order puts `origin-outside-trusted-store` (WR-17) **before**
  `destination-id-occupied` (CR-11). The round-4 CR-11 probe authored its forged origin in an
  ordinary caller-named directory, which is now refused by the earlier clause — so re-running only
  that spelling proves the write is refused but says nothing about whether the DESTINATION is read,
  which is the whole of CR-11.
- **Fix:** both spellings run and both recorded, with the reason for the adjustment stated (§4.2).
  The plan's own `behavior` block asks for exactly this where a fix changes a probe's required shape.

### 4. [Rule 1 — a bug in this round's own measurement harness] The manifest walk reported `0 mismatches` from an EMPTY denominator

- **Found during:** Task 2, MOVEMENT 2.
- **Issue:** the first parse of the `DECIDER_MANIFEST` region used a two-space closing-brace pattern
  taken from the `.ts` source; the emitted `.js` indents with four, so the walk matched **zero**
  deciders and reported a green `0 mismatches`.
- **Fix:** the harness now asserts its own premise before reporting — the region must exist, the walk
  must find at least one decider, and the parsed entry count must equal an independently derived
  count of 64-hex literals in the region. It then reported 26 entries and 0 mismatches.
- **Recorded** in §6.2, because it is the **eighth** logged instance in this phase of a verification
  harness producing a false result about its own premise.

### 5. [Rule 1 — the same class, one register over] The first re-derivation of `RECORDED_TOTAL_SITES` was a tautology

- **Found during:** Task 3, MOVEMENT 4.
- **Issue:** the first attempt summed `CHECKPOINT_SITE_COUNTS` — a **hand-recorded** table — and
  compared the sum to `RECORDED_TOTAL_SITES`. `scripts/checkpoints.ts` names that exact move as a
  tautology in its own comment.
- **Fix:** the sum was re-taken over the **DERIVED** sites Map from `deriveCheckpoints()`, which is
  independent of the recorded table, and `WORKFLOW_STOP_BULLET_COUNT` was additionally re-derived by
  a hand `awk` over all 19 workflow files, outside the module entirely. Three-way agreement at **42**;
  derived sites sum **17**.
- **Recorded** in §7.4 with the false start.

### 6. [Rule 3 — blocking] The `state.add-decision` file inputs had to move inside the repository

- The SDK rejects a `--summary-file` outside the repository root (`Path escapes allowed directory`).
  The decision texts were written to a temporary path under `.temp/` inside the repository and
  deleted immediately after. No content changed.

**Total deviations:** 6 — 2 plan premises contradicted by measurement, 1 missing probe spelling,
2 false results from this round's own harnesses (both caught by asserting the harness's premise),
1 blocking tooling constraint.
**Impact:** none widens the plan's scope. Deviations 4 and 5 are the reason two of this document's
figures can be trusted at all; both are written into the record rather than quietly corrected.

## Authentication Gates

None.

## Known Stubs

None. No `<verify>` was left unrun, no test was skipped by this plan, and no measurement is asserted
without a command. Every figure this document publishes was produced by a command quoted beside it.

Three `UNKNOWN - verify` markers are **deliberate** and are recorded as such rather than as stubs:
the WR-21 probe-spelling question (§4.3), the WR-17 clause-name disagreement (§4.4), and the three
carried Info-level items `31-REVIEW.md` itself left unmeasured (`IN-04`, `IN-06`, and four of
`IN-09`'s five residuals).

## Threat Flags

None. This plan adds no code, no endpoint, no auth path, no file-access pattern and no schema. It
runs read-only probes against already-committed artifacts and writes three markdown documents.

## What this plan does NOT close

- **The four human-verification items stay OPEN** with their `UNKNOWN - verify` markers intact, now
  carried through rounds 2, 3, 4 and this closing measurement — re-stated with a carry-forward count
  in `31-VALIDATION.md`. Every probe in this round ran on darwin only.
- **The `check:diff-disposition` debt is measured and unclosed**: 75 findings over 39 elements, 65
  owned by `31-05`/`31-06`/`31-08` and 10 by `31-15`. `00-base.md`'s base commit was not moved and
  the watched corpus was not narrowed.
- **`WR-21`'s below-home shape** — `R-31-19-01`.
- **The prose-adequacy half of the recipe and decision documents** — asserted mechanically (verbatim
  quotation, both-directions set equality) but not as reading. All four fix plans marked it
  `human_judgment: true`; so does this one.

## Requirements

`UATX-01` through `UATX-06` remain **unchecked** in `.planning/REQUIREMENTS.md` (lines 120–125) and
their traceability rows still read **`Gaps Found`** (lines 212–217). The Phase 31 entry in
`.planning/ROADMAP.md` (line 100) is **not** marked complete. All three confirmations were made by
reading the files, and are recorded in §11 of the audit document. `requirements-completed` is
deliberately empty: only a verification round may flip a requirement, and a gap-closure plan that
flips one is certifying itself.

## Next

Gap-closure round 4 is complete: `31-16`, `31-17`, `31-18`, `31-19` executed and this closing
measurement written. **The next artifact this phase produces is a fifth verification round**
(`/gsd-verify-work 31`). It should begin from `docs/audit/31-round4-residuals.md` — §2 for the
pairing table, §7 for the ledger, §9 for the residual register — and read **§4.3 first**.

## Self-Check: PASSED

- `docs/audit/31-round4-residuals.md` — FOUND (828 lines)
- `.planning/phases/31-autonomous-manual-testing/deferred-items.md` — FOUND, carries the `31-20` entry
- `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md` — FOUND, carries the round-5
  carry-forward section with 4 `OPEN — UNKNOWN - verify` rows
- commits `27f613a`, `e870287`, `3f93e4b` — all FOUND in `git log --oneline --all`
- `git rev-list --count 263d1a3..HEAD` = **3** at summary-write, measured against the ledger base
  persisted at `.git/gsd-plan-head-before-31-20`
- `git diff --diff-filter=D --name-only 263d1a3..HEAD` — **empty**; no file was deleted
- `git status --porcelain -- scripts hooks agent-factory install` — **empty**

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-09*
