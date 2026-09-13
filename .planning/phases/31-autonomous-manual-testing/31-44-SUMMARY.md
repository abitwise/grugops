---
phase: 31-autonomous-manual-testing
plan: 44
subsystem: verification-record
status: complete
tags: [gap-closure, round-9, closing-measurement, audit-record, residual-register, coverage-equality, fenced-phase]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "plans 31-39 through 31-43 (D-39..D-43) — the five fix plans of gap-closure round 9, whose evidence this plan re-measures; and docs/audit/31-round7-residuals.md, whose section shape and control spellings this record inherits"
provides:
  - "docs/audit/31-round8-residuals.md — the round-9 closing measurement: 11 findings + 3 missing: bullets re-driven at their original documents' own spellings, 30 control rows over CR-17..CR-25, every frozen floor re-measured whole, a 30-item disposition ledger with the coverage equality derived on both sides, and a residual register written as accepted-open residuals under the fence"
  - "CR-28 — a NEW Critical raised by this measurement and deliberately NOT repaired: a RENAMED import from a declared-foreign module is accepted at exit 0"
  - "two disagreements with prior records printed rather than absorbed (WR-42's reasoning, CR-17's byte count) plus one with a sibling SUMMARY (31-43's requirements-completed)"
  - "two harness false results from this session's own probes, logged rather than absorbed"
  - "31-VALIDATION.md's round-9 section: R-01/R-02/R-03 carried unchanged with their UNKNOWN - verify markers, plus R-05/R-06/R-08 newly recorded as unverifiable on this box"
  - "deferred-items.md's round-9 section, appended with 0 deletions"
affects: [phase-31-verification-round-9, phase-31-close]

actuals:
  tokens: 32290
  tasks: 3
  commits: 4
  plan_head_before: 6e95edcce3da04cd19c8d0b6b9253cf45ed986e0

tech-stack:
  added: []
  patterns:
    - "a closure round re-drives the ORIGINAL document's spelling: a paraphrase measures the fix, not the finding — and this round's paraphrase of one row is exactly what surfaced CR-28"
    - "every probe prints a CONTROL that must succeed, so a refusal in a probe row is known to be the module's and not the harness's"
    - "a coverage equality is checked in BOTH directions: items with no row AND rows naming an item the scan did not derive"
    - "a cleanliness predicate is demonstrated able to observe a change before an empty reading from it is called evidence"
    - "a red run is printed beside the green ones, with the discrimination driven rather than argued"

key-files:
  created:
    - docs/audit/31-round8-residuals.md
  modified:
    - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/STATE.md
    - .planning/WINDOWS.md

key-decisions:
  - "The filename convention was CONFIRMED against all four predecessor records rather than guessed: the filename carries the number of the fix round whose evidence is measured, one less than the writing round the `Round:` line states. Both numberings are live in this phase and the reading is stated in the document."
  - "CR-28 is RAISED and NOT REPAIRED. A closing measurement that fixes something has found a new defect, and a new defect belongs in a new plan with its own RED-first reproduction."
  - "The suite's RED run is recorded beside the two green ones. A round that reran until it liked the number and reported only that number would be doing the thing the record exists to prevent."
  - "STATE.md was updated by a targeted edit rather than `state.advance-plan`, because that verb's last-plan edge case sets a phase-complete status and this plan is forbidden from moving the phase's state."
  - "Every open item is written as an ACCEPTED-OPEN residual, because the developer fenced Phase 31 at this round on 2026-09-12. No open item is presented as closed, and no checkbox is flipped."

patterns-established:
  - "Confirm a naming convention against every predecessor and RECORD the reading, so the next author does not re-derive it"
  - "When a probe's paraphrase and its original disagree, drive the original AND pursue the paraphrase as a probe in its own right"
  - "Derive the disposition denominator with fenced blocks stripped, and record the strip's effect even when it is zero"

requirements-completed: []

coverage:
  - id: D1
    description: "Every reproduction 31-REVIEW.md and 31-VERIFICATION.md recorded is re-run at ONE commit at the original document's own spelling, with the pre-fix reading beside the post-fix one"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §2.0–§2.4 — 11 findings + 3 missing: bullets, each row citing its command and output"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-17 through CR-25 re-driven as CONTROLS at the same commit, each marked RE-DRIVEN with its reading or named not-driven with its reason"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §3 — 30 rows, 29 driven, 29 UNMOVED, 1 named not-driven"
        status: pass
    human_judgment: false
  - id: D3
    description: "A disposition for every derived finding, anti-pattern row, missing: bullet, non-verified artifact row, NOT_WIRED key link and owner-bearing deferred item, with the coverage equality measured on both sides"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §9 — 30 derived / 30 covered / 0 uncovered / 0 orphan, both sides derived at run time, each derivation throwing on a zero count"
        status: pass
    human_judgment: false
  - id: D4
    description: "The whole excluded-e2e suite measured with the exact command, every frozen floor re-measured whole, and the decider manifest checked as a whole"
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' → Test Files 66 passed (66), Tests 4349 passed | 2 skipped (4351), exit 0"
        status: pass
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §8.3 — guard.ts, hook-entry logic, admit()'s re-baselined span with its prior value, DECIDER_MANIFEST (2/26/14, 0 missing, 0 mismatch), TRIPWIRE_MODULES"
        status: pass
    human_judgment: false
  - id: D5
    description: "A residual register covering every boundary the round left open, with a reason and a closing condition per entry, written as accepted-open residuals under the fence"
    verification: []
    human_judgment: true
    rationale: "Whether the register is HONEST about what is open — rather than merely well-formed — is a judgement no gate reaches. It is the question the record itself names as the ninth round's useful one."
  - id: D6
    description: "CR-28 — a renamed import from a declared-foreign module is accepted at exit 0 — reproduced, its mechanism read from source, and left standing with an owner"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §5 — two reproductions at tsc exit 0, two bounding CONTROLS driven the other way, the module filter at uat-spec-integrity.ts:2533 quoted"
        status: pass
    human_judgment: false
  - id: D7
    description: "The environment proven clean by predicates demonstrated able to observe a change, and the deferred record appended without an earlier line moving"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §7.2–§7.3; git diff --numstat over deferred-items.md → 144 insertions, 0 deletions"
        status: pass
    human_judgment: false
  - id: D8
    description: "No requirement row, traceability row or phase checkbox moved"
    verification:
      - kind: other
        ref: "docs/audit/31-round8-residuals.md §11 — git diff --stat 54ea410..HEAD -- .planning/REQUIREMENTS.md empty; ROADMAP.md:100 still - [ ]"
        status: pass
    human_judgment: false

duration: 1h 25m
completed: 2026-09-13
---

# Phase 31 Plan 44: The round-9 closing measurement Summary

**Every reproduction round 8's documents recorded was re-driven at one commit at those documents' own
spellings — all eleven findings and all three `missing:` bullets CLOSED by measurement — and the
re-drive of the one row this session first paraphrased surfaced `CR-28`, a live Critical that the
green suite does not exercise, recorded with an owner and deliberately not repaired.**

## Performance

- **Duration:** 1h 25m (base commit `6e95edc` at 04:42:11, last commit at ~06:08 +0300)
- **Tasks:** 3 of 3
- **Commits:** 4 — three task commits (`fea8897`, `84b502e`, `2460b6b`) plus this plan's own
  metadata commit. `commits: 4` in the frontmatter is MEASURED as
  `git rev-list --count 6e95edc..HEAD` after that commit, not narrated.
- **Files:** 1 created, 4 modified
- **Measured at:** `6e95edcce3da04cd19c8d0b6b9253cf45ed986e0`, darwin 25.5.0 arm64, Node v24.12.0

## The pinned commit and the round base

| Reading | Value |
|---|---|
| commit measured | `6e95edc` (`6e95edcce3da04cd19c8d0b6b9253cf45ed986e0`), `2026-09-13 04:42:11 +0300` |
| round base | `54ea410` — the commit before `31-39`'s first, `plan_head_before` in `31-39-SUMMARY.md` |
| `git rev-list --count 54ea410..HEAD` | **35** |
| source diff over the round | `19 files changed, 7849 insertions(+), 419 deletions(-)` |
| `git diff 54ea410..HEAD -- package.json package-lock.json` | **empty** — no package-manager install ran |
| working-tree residue, before the first probe and after the last | **empty**, with the predicate demonstrated able to report a planted change |

## The reproduction table

**14 reproduction rows** — 11 findings of `31-REVIEW.md` plus the 3 `missing:` bullets of
`31-VERIFICATION.md` — **and all 14 MOVED in the direction the owning plan committed to.**

| Finding | Result | The measurement |
|---|---|---|
| `CR-26` | **MOVED — CLOSED** | the ungoverned-store call now returns `id: null` and refuses by name; zero notes in both roots; the CONTROL through a governed store still writes (`notes= 1 ledger= 1`) |
| `CR-27` | **MOVED — CLOSED** | probe and CONTROL now answer identically under the same unreadable trusted configuration; the asymmetry that WAS the finding is gone |
| `WR-37` | **MOVED — CLOSED** | `SURFACE_SWALLOW_SITES` derived at **9** positions where the review named 4, every one naming its arm; `surface-unreadable` in a 5-arm set |
| `WR-38` | **MOVED — CLOSED** | **8** member rows over **4** published ban sets, ids derived from the publishing constant's own name |
| `WR-39` | **MOVED — CLOSED** | `R-31-33-02`'s `shape`, read from the committed `.js`, states the post-fix behaviour |
| `WR-40` | **MOVED — CLOSED** | the workflow paragraph is per route and per branch with four residual ids inline; the universal sentence greps to 0 |
| `WR-41` | **MOVED — CLOSED** | the driver reports `identical-no-op` vs `write` from the target's own digests; the harness reads the planted position |
| `WR-42` | **MOVED — CLOSED**, with a disagreement | `R-31-41-01` published; the shared-install answer re-driven here — `governanceRootOf(<kit>/.grugops/context)` = the kit home, CONTROL = `null` |
| `IN-19` | **MOVED — CLOSED** | the host run names `.temp=1` only; `.git` and `node_modules` no longer fire; the counted thing is named in the line |
| `IN-20` | **MOVED — CLOSED** | 11-member outcome vocabulary, 13 CONTROL labels, `NOT ORDINARY (<outcome>)` for every non-ordinary outcome |
| `IN-21` | **MOVED — CLOSED** | the three-term partition is gone, its removal recorded in place |
| `missing:` [1] | **MOVED — CLOSED** | both write-both routes decline through ONE exported clause constant |
| `missing:` [2] | **MOVED — CLOSED** | `admit()` and `appendNote()` each take a `ledgerOwner` distinct from `repoRoot` |
| `missing:` [3] | **MOVED — CLOSED** | `ROOT_DIVERGENCE_DISPOSITIONS` (3), bound to a derived census, naming the one site a syntax-tree census cannot see |

## The control table

**30 rows over `CR-17` … `CR-25`. 29 DRIVEN, 29 UNMOVED. 1 named not-driven with its reason**
(`CR-22` position 4 — `DEFAULT_CONTEXT_ROOT` is still not exported, re-measured `false`, so the split
needs a shared-install layout; it is `R-31-33-02`).

**Nine of the closures had never been independently DRIVEN since the round that closed them.** Round
8's verifier confirmed `CR-22`, `CR-23`, `CR-24` and `CR-25` from a source read plus one suite run,
spending its reproduction budget on the two new Criticals; rounds 7 and 8 both accepted `CR-17`,
`CR-18`, `CR-19` and `CR-21` the same way. All of them are driven here.

## The suite, and the red run

| # | When | Result | Exit |
|---|---|---|---|
| 1 | before the record was written | `Test Files 66 passed (66)` · `Tests 4349 passed \| 2 skipped (4351)` · 470.42 s | **0** |
| 2 | with the round's four artifacts on disk | `Test Files 1 failed \| 65 passed (66)` · `Tests 1 failed \| 4348 passed \| 2 skipped` · 494.62 s | **1** |
| 3 | the same tree, unloaded machine | `Test Files 66 passed (66)` · `Tests 4349 passed \| 2 skipped (4351)` · 474.71 s | **0** |

Run 2's single failure was `Error: Test timed out in 5000ms` on a spawn-heavy parse-boundary case,
started while a prior run's processes were still winding down. **Discriminated by driving:** the same
file alone reports `385 passed (385)`; run 3 over a byte-identical tree is green at exactly run 1's
counts. It reads no planning artifact, so it is not the "docs-only commit reds the suite" mechanism
this phase carried at round 7 — it is the spawn-heavy-timeout class `STATE.md` already carries twice.
**All three readings are published, including the red one**, and the timeout is appended to
`deferred-items.md` with an owner.

## The frozen floors

| Floor | Fresh measurement | Baseline | Verdict |
|---|---|---|---|
| `hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001` | `FROZEN_GUARD_BLOB` identical | **EQUAL** |
| `hooks/hook-entry.ts` logic | total 32 182 / normalised 29 357 / **REMOVED 2 825**; sha256 `006cdb0f…330d` | `FROZEN_HOOK_ENTRY_LOGIC_SHA` identical | **EQUAL** — four plans of the round edited this file and none moved its LOGIC |
| **`admit()`'s span** | offset 245 861, **15 012 bytes**, ends on `}`; sha256 **`bb920698…81cd`** | `ADMIT_FROZEN_SHA256` identical. **PRIOR value `08df9e5c…09e9`** | **EQUAL to the NEW baseline** — the SIXTH value, moved deliberately under `D-39` |
| `DECIDER_MANIFEST`, whole | **2** deciders, **26** `(path, hash)` entries over **14** paths, **0** missing, **0** mismatches | `freshness:hook-manifest` agrees | **EVERY ENTRY CHECKED** |
| test-module tripwire | `ls scripts/*.test.ts \| wc -l` → **60** | `TRIPWIRE_MODULES = 60` | **EQUAL** |

## The disposition coverage, both sides measured

```
DERIVED item count                          : 30
rows parsed from the written ledger         : 30
items covered by at least one written row   : 30
items covered by NO written row             : 0
rows naming an item the scan did not derive : 0
EQUALITY CLOSES
```

No number is typed as an expected value. The LEFT side is seven scans over `31-REVIEW.md` (fences
stripped — 15 headings before, 15 after, **delta 0**, recorded as applied-and-empty),
`31-VERIFICATION.md` and `deferred-items.md`; the RIGHT side is parsed out of the record's own §9.2
rows. Both derivations throw on a zero count, and the fourth number checks the converse direction.

**Dispositions:** 27 CLOSED, 1 DECIDED-AND-NAMED (`GR-1`, whose two named defects are closed but
whose requirement row is not flipped), 2 DECIDED-AND-NAMED/CARRIED among the deferred items, and 4
CARRIED with owners.

## The residual register

**24 entries** across four sections — the write path (8), the UAT-spec modifier ban (7), the harness
and gates (12 rows), and the Windows remainder — each with the reason it is open and what would force
it closed. Because the developer fenced Phase 31 at this round on 2026-09-12, every entry is written
as an **accepted-open residual** rather than a queue entry, and none is presented as closed.

## Accomplishments

- **`docs/audit/31-round8-residuals.md`** — 976 lines: the reproduction table, the control table, the
  new finding, the disagreements, the environment proof, the gate record, the disposition ledger, the
  residual register, the requirement-row confirmation, and what the ninth round inherits.
- **`CR-28` raised and not repaired** — the only new defect this measurement found, reproduced on
  files `tsc` accepts at exit 0, with both bounding controls driven and the mechanism read from
  source (`deriveImportRenames` filters on `PLAYWRIGHT_TEST_MODULE`, so a declared-foreign rename is
  asked about its LOCAL name). No corpus row drives the shape.
- **Three disagreements with prior records, printed rather than absorbed** — `WR-42`'s stated
  consequence (measurably wrong), `CR-17`'s deny byte count (782 here vs 733 in round 7, explained by
  path length with the reason measured), and `31-43-SUMMARY.md`'s `requirements-completed` (the one
  summary of five asserting a completion the tree does not carry). **No prior record was edited.**
- **Two harness false results from this session's own probes, logged** — a note object missing `refs`
  whose `TypeError` the probe's classifier printed as a refusal, and note/ledger counters reading the
  wrong directories so every row read `notes= 0`. Both caught because the CONTROL rows failed the same
  way, which is the discrimination this phase's ledger exists to teach.
- **`31-VALIDATION.md`** — `R-01`/`R-02`/`R-03` carried unchanged with markers intact, `R-04` re-stated
  as CLOSED-by-harness, and `R-05`/`R-06`/`R-08` newly recorded as unverifiable on this box.
- **`deferred-items.md`** — appended under this round's own heading: **144 insertions, 0 deletions.**
- **`.planning/WINDOWS.md`** — four entries appended (`CR-28`, the un-retaken coverage one-shot,
  `31-43`'s frontmatter claim, the spawn-heavy timeout).

## Deviations from Plan

### 1. [Rule 3 — blocking] `check:diff-disposition` exits 1, and the plan's verify block treats a non-zero exit as a failure

- **Found during:** Task 1, Task 2.
- **Issue:** the plan's `<verify>` lists `npm run check:diff-disposition` among commands whose
  `fails_when` is "non-zero exit". That gate has exited 1 continuously since before this round, on a
  standing debt of 78 findings over 39 elements.
- **Resolution:** NOT repaired, and not treated as a stop. The plan's own `must_haves` and the
  predecessor record both name this debt as an open item, so the plan expects it open while its
  verify block reads it as a failure. Measured at every point in the round — round-7 close 78, after
  `31-39` 78, after `31-41` 78, here 78 — and recorded in the record §8.4 and §10.3 and in
  `deferred-items.md` as unmoved. Clearing it is a documentation pass of its own, and the gate's own
  remedy text forbids the two shortcuts.
- **Files modified:** none.

### 2. [Rule 3 — blocking] `state.advance-plan` was not run

- **Found during:** Task 3.
- **Issue:** the executor's state contract calls for `gsd_run query state.advance-plan`, whose
  documented behaviour includes a last-plan edge case that sets a phase-complete status. This is plan
  44 of 44, and the plan forbids moving the phase's state.
- **Resolution:** `state.update-progress`, `state.record-metric` and `state.record-session` were run
  as normal; `advance-plan` was replaced by a targeted edit of `Current Position`, `status`,
  `stopped_at`, `state_head` and `completed_plans`. The phase reads **IN PROGRESS, gap-closure round
  9 FENCED**.
- **Files modified:** `.planning/STATE.md`.

### 3. [Rule 1 — harness bug] The first `context-io` probe's note object omitted `refs`

- **Found during:** Task 1, before any result was read.
- **Issue:** `composeNote` threw `TypeError`, and the probe's catch-all classifier printed it as
  `REFUSED: note.refs is not iterable` — a harness defect wearing a refusal's clothes.
- **Fix:** the classifier re-throws `TypeError`; the note object carries `refs`. Every probe row then
  prints a CONTROL that must WRITE.
- **Verification:** the CONTROL rows write (`notes= 1 ledger= 1`) in §2 and §3.
- **Logged** as harness false-result instance 17 in `deferred-items.md`, not written into the ledger
  file (this plan writes no source, and the ledger's own test derives its premises from that file).

### 4. [Rule 1 — harness bug] The note and ledger counters read the wrong directories

- **Found during:** Task 1, before any result was read.
- **Issue:** notes land under `<store>/<task>/notes/` and the GOV-02 ledger under
  `<root>/.grugops/audit/admissions.jsonl`; the first counters looked elsewhere, so every row read
  `notes= 0 ledger= null` — including the CONTROLs.
- **Fix:** counters corrected until a CONTROL read `notes= 1 ledger= 1`.
- **Logged** as instance 18 in `deferred-items.md`, `status: closed` for this occurrence.

### 5. [Rule 3 — blocking] The suite's second run was RED

- **Found during:** Task 3's verify.
- **Issue:** one spawn-heavy case timed out at the 5000 ms default under load.
- **Resolution:** discriminated by driving the file alone (385/385) and by a third full run at
  identical counts to the first. **All three readings published**, including the red one; the timeout
  appended to `deferred-items.md` and `.planning/WINDOWS.md` with an owner. Not repaired — this plan
  writes no source and no test.

**Total deviations:** 5 — 2 blocking-gate readings recorded rather than repaired, 2 harness bugs
fixed inside the measurement before any result was read, 1 red suite run recorded with its
discrimination. **Impact:** none on the record's claims; two of the five are the reason the record's
probe rows carry CONTROLs at all.

## Known Stubs

None. This plan wrote no source and no test.

## Threat Flags

None. No file created or modified by this plan introduces network, auth, file-access or schema
surface. `package.json` is untouched and no package was installed.

## Issues Encountered

**`CR-28` is a live, reproducible Critical at this commit and is NOT closed.** It is recorded with an
owner and a closing criterion rather than repaired, per the standing rule this phase's closing plans
inherit. Six further items are carried with owners in the residual register; the three standing human
items (`R-01`, `R-02`, `R-03`) leave the phase open.

## Next

`31-44` is the last plan of Phase 31. **The phase is FENCED at gap-closure round 9 by the developer's
decision of 2026-09-12** — there is no round 10, and whatever closes Phase 31 will be a user override
rather than a green ninth verification. `UATX-01` through `UATX-06` remain UNCHECKED, all six
traceability rows still read `Gaps Found`, and `.planning/ROADMAP.md:100` still reads
`- [ ] **Phase 31: Autonomous Manual Testing**`. This plan flipped none of them.

A ninth verification round, if one is run, should start from `docs/audit/31-round8-residuals.md` §10
— the register — rather than from §2, because §2's question is already answered by measurement and
§10's is the one that is still open.

## Self-Check: PASSED

- `docs/audit/31-round8-residuals.md` exists on disk (976 lines).
- `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md`, `deferred-items.md`,
  `.planning/STATE.md` and `.planning/WINDOWS.md` all exist and are modified.
- All three task commits exist in `git log`: `fea8897`, `84b502e`, `2460b6b`; the metadata
  commit is the fourth, and `git rev-list --count 6e95edc..HEAD` reads **4**.
- Every plan-level `<verify>` command was run and its exit status and final line are recorded in the
  record §8.1; the one non-zero (`check:diff-disposition`) is documented as deviation 1.
- The coverage equality was re-run against the written ledger and closes: 30 / 30 / 0 / 0.
- The six requirement rows, the six traceability rows and the Phase 31 checkbox were read verbatim
  after the last write and are unchanged.
