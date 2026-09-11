---
phase: 31-autonomous-manual-testing
plan: 38
subsystem: audit
tags: [gap-closure, round-7, closing-measurement, reproduction-pairing, control-ledger, frozen-floors, residual-register]
requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-32..31-37 — the six round-7 fix plans and decisions D-33 … D-38, whose claims this plan re-measures rather than repeats"
  - phase: 31-autonomous-manual-testing
    provides: "31-REVIEW.md (13 findings) and 31-VERIFICATION.md (4/6, one regression) — the probe spellings this plan re-drives"
  - phase: 31-autonomous-manual-testing
    provides: "docs/audit/31-round6-residuals.md — the section shape this record follows rather than replaces"
  - phase: 31-autonomous-manual-testing
    provides: "D-33 (2) — the review-to-corpus coverage obligation, handed here as a once-per-round one-shot"
provides:
  - "docs/audit/31-round7-residuals.md — the round's whole record: probe set, pairing table, control ledger, disposition ledger, one-commit gate record, frozen floors, register cardinalities, the coverage equality, the residual register and the environment proof"
  - "14 round-6 control rows, all UNMOVED — including the four closures the round-7 verifier accepted rather than measured"
  - "the D-33 coverage one-shot discharged, with both sides derived, under two predicates, with the disagreement named"
  - "a residual register with an owner and a closing criterion per row, so round 8 starts from a lookup"
affects:
  - docs/audit/31-round7-residuals.md
  - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
  - .planning/phases/31-autonomous-manual-testing/deferred-items.md
  - .planning/STATE.md
actuals:
  tokens: 27318
  tasks: 3
  commits: 3
  plan_head_before: 3baab0d3378bd09fb8302505e013e19af9fe53ec
  commits_instrument: "git rev-list --count 3baab0d..HEAD, measured at SUMMARY write. The closing metadata commit is the fourth and is not counted here."
  tokens_instrument: "chars/4 over `git diff 3baab0d..HEAD` added/removed lines (109,275 chars). The plan's 90,000-token estimate is on a different, larger instrument; the two are not compared."
tech-stack:
  added: []
  patterns:
    - "strip fenced regions BEFORE scanning a markdown document for headings — a transcript quoted inside a finding is not a finding"
    - "a cleanliness predicate run concurrently with the thing it measures answers about the measurement, not about the tree"
    - "when a plan's acceptance criterion names an artifact its own round deleted, substitute the equivalent under what landed and record the substitution"
    - "state a coverage equality under BOTH predicates when neither is derived from a rule, rather than picking the one that passes"
key-files:
  created:
    - docs/audit/31-round7-residuals.md
  modified:
    - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/STATE.md
key-decisions: []
patterns-established:
  - "re-drive EVERY prior-round closure as a control, not only the ones the current verifier re-drove — four of round 6's five rested on one reading taken two rounds ago"
  - "derive the doctrine paragraph: count the deciding constant's occurrences in test files at the round base rather than asserting the suite was uninformative"
  - "log the harness's own false results in the same document as the results they nearly corrupted"
requirements-completed: [UATX-01, UATX-02, UATX-03, UATX-04, UATX-05, UATX-06]
coverage:
  - deliverable: "every round-7 reproduction re-run at one commit with the finding documents' own spellings, paired with its pre-round figure"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §2 — 30 round-7 rows, each with a quoted measurement taken at 3baab0d"
    status: verified
    human_judgment: false
  - deliverable: "every round-6 closure re-driven as a control at the same commit"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §3 — 14 rows, 14 driven, 14 UNMOVED; the four never independently measured since round 6 are named"
    status: verified
    human_judgment: false
  - deliverable: "one disposition row per item over a derived denominator"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §10 — 13 findings + 1 regression = 14 rows, denominator measured by command"
    status: verified
    human_judgment: false
  - deliverable: "the one-commit gate record, with the suite as a floor and the round-base RED beside it"
    kind: automated-test
    ref: "docs/audit/31-round7-residuals.md §8.1 — 18 gates; `npx vitest run --exclude '**/scripts/e2e/**'` → 66 files, 4208 passed, 2 skipped, exit 0"
    status: verified
    human_judgment: false
  - deliverable: "the frozen floors and the whole DECIDER_MANIFEST re-measured"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §8.3 — FROZEN_GUARD_BLOB, FROZEN_HOOK_ENTRY_LOGIC_SHA (byte floor printed first), ADMIT_FROZEN_SHA256, all 26 manifest entries, the tripwire, the {0,1,2} partition"
    status: verified
    human_judgment: false
  - deliverable: "the review-to-corpus coverage equality, both sides derived, disclosed as a one-shot"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §9 — 5/5 under one predicate, 2/5 under a stricter one, disagreement named and carried as a residual"
    status: partial
    human_judgment: true
    rationale: "Neither predicate is derived from a rule separating findings a UAT spec can drive from findings whose closure is a stderr line, an absence or a doc edit. Choosing between them is a judgment; both numbers are published rather than one, and the gap is carried with an owner."
  - deliverable: "the residual register, with a reason and a closing criterion per open boundary"
    kind: manual
    ref: "docs/audit/31-round7-residuals.md §11 — the write path, the ban register (10 members), the input boundary, the harness, the Windows remainder"
    status: verified
    human_judgment: false
  - deliverable: "the three standing human items carried with their UNKNOWN - verify markers intact"
    kind: manual
    ref: ".planning/phases/31-autonomous-manual-testing/31-VALIDATION.md — the round-8 carry-forward table, R-01/R-02/R-03 each with a named owner; R-04 re-stated closed by 31-30's harness"
    status: verified
    human_judgment: true
    rationale: "Whether an item stays open is a judgment about what a harness can establish. All three are carried unchanged; none is closed by inference, and R-03's remainder is recorded as LARGER by four shapes rather than unchanged."
duration: 36m
completed: 2026-09-11
status: complete
---

# Phase 31 Plan 38: Round-7 Closing Measurement Summary

Re-ran every round-7 reproduction and every round-6 closure at one commit with the finding
documents' own probe spellings, dispositioned all fourteen items over a derived denominator, and
wrote `docs/audit/31-round7-residuals.md` — the record round 8 starts from.

## Performance

- **Duration:** 36 minutes
- **Tasks:** 3 of 3
- **Commits:** 3 task commits (plus this plan's closing metadata commit)
- **Measured at:** `3baab0d3378bd09fb8302505e013e19af9fe53ec`, darwin 25.5.0 arm64, Node v24.12.0
- **Round base:** `d484b9e`; `git rev-list --count d484b9e..HEAD` = 38
- **Source written by this plan:** none. `git diff --name-only HEAD -- scripts hooks agent-factory install` is empty.

## Accomplishments

**44 probe rows derived, 44 driven, 5 named as not driven with their reasons.** 30 round-7 rows and
14 round-6 control rows, every one taken at one commit against the committed `.js`, with the tree
proven clean before the first probe and after the last.

**The four Criticals, measured at their filed coordinates:**

- **CR-22** — three of four positions CLOSED. The `promoteAdmitted` fall-through now lands note and
  GOV-02 event together in THIRD (was: note THIRD, ledger DEST). An ungoverned destination is
  `DECLINED (destination-outside-governed-store)` with nothing written. `admitAndAppend` lands both
  in DEST3 (was: note DEST, ledger THIRD). Position 4 is not drivable from outside the module and is
  carried as `R-31-33-02`.
- **CR-23** — CLOSED at four positions, including **both halves** of D-35's discriminant. The
  review's own spec — `describe.skip` from a declared foreign module — moves `0 findings`/EXIT=0 to
  `1 finding(s)`/EXIT=1 with `tsc` exit 0; so does `expect.soft` from `other-assert`; so does a real
  `.d.ts` FILE with no `declare module` block, which the review never drove.
- **CR-24** — CLOSED. An EACCES regular file now reports arm `unopenable` and a 9 437 184-byte
  regular file reports `above-ceiling`. Both previously reported `not-a-regular-file`. `NOTE_SKIP_ARMS`
  is 5 and SPREADS `READ_POSITION_CONDITIONS` rather than restating it.
- **CR-25** — CLOSED. The 8-hop chain that accepted at exit 0 with zero bytes of stderr now exits 2
  with a named cause. The 7-hop chain moved DOWN to exit 2 as well — the price D-36 recorded in
  advance, and never a pass. The container regression the fix itself created stays closed; the
  index-signature shape is a disclosed, driven remainder.

**The regression is closed and its mechanism is measured gone.** The suite was RED at the round base
(`1 failed | 63 passed`, `1 failed | 4127 passed | 2 skipped`) on a self-referential coverage oracle
that read `31-REVIEW.md` at run time. At `MEASURED_AT`: `REVIEW_MD` 0 occurrences,
`reviewFindingsNamingThisRunnable` 1 (a comment), `CORPUS_COVERAGE` 2 (both comments) — no run-time
read remains. Suite: **66 files, 4208 passed, 2 skipped, exit 0, 426.55 s.**

**Fourteen round-6 control rows, all UNMOVED.** Four of round 6's five closures — CR-17, CR-18,
CR-19, CR-21 — had **not** been independently measured since round 6; the round-7 verifier accepted
them from `31-REVIEW.md`'s reading. All four are driven here: the FIFO at a manifest path denies in
32 ms at both deciders and at a directory too; all four live CR-18 spellings still refuse; the 9 MiB
write is still refused by name with its control untouched; both CR-21 argument forms still refuse.

**The doctrine is derived, not asserted.** At the round base, `SURFACE_DEPTH_BOUND` and
`SURFACE_NODE_BOUND` appeared **zero** times in any test file; so did `ReadPositionRefusal` and
`READ_POSITION_CONDITIONS`; `NOTE_SKIP_ARMS`'s two occurrences were in a case that *expected* two of
three conditions to share one arm. Two of the four Criticals were decided by constants the suite
never named.

**Every frozen floor re-measured whole.** `hooks/guard.ts` → `669725bc…b001` = `FROZEN_GUARD_BLOB`.
The wrapper normalisation printed **total 32 182 / normalised 29 357 / REMOVED 2 825** before its
digest was read, and matched `FROZEN_HOOK_ENTRY_LOGIC_SHA` at the value `31-37` re-took.
`admit()`'s 12 151-byte span matched `ADMIT_FROZEN_SHA256`. All **26** `DECIDER_MANIFEST` entries
over 14 distinct paths: 0 missing, 0 mismatches. Tripwire 60 = 60, re-derived by its documented
method.

## Task Commits

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Re-run every round-7 reproduction and every round-6 closure at ONE commit | `193e348` | `docs/audit/31-round7-residuals.md` (created) |
| 2 | A disposition for every item, the gate record, the frozen floors, the coverage equality | `06a5f62` | `docs/audit/31-round7-residuals.md` |
| 3 | Carry the human items, update the validation and deferred records, write a short STATE.md | `2f8b2bc` | `31-VALIDATION.md`, `deferred-items.md`, `.planning/STATE.md` |

## Files Created/Modified

**Created:** `docs/audit/31-round7-residuals.md` (891 lines) — the round's whole record.

**Modified:** `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md` (the round-8
carry-forward table), `.planning/phases/31-autonomous-manual-testing/deferred-items.md` (the
round-7 closing re-measurement of every open entry), `.planning/STATE.md`.

## Decisions Made

**None — a closing measurement decides nothing.** No new decision id is recorded, and
`31-CONTEXT.md` is untouched.

## Deviations from Plan

### 1. [Substitution] The plan's coverage step assumes an artifact its own round deleted

- **Found during:** Task 2
- **Issue:** The plan asks for the review-to-corpus coverage to be asserted against
  `docs/audit/31-review-corpus-manifest.md` and a `row(id, ...covers)` marker signature. Measured:
  no such file exists, and `row` is `function row(id: string): string` — one argument. Both predate
  `D-33` (`remove-axis`, answered by a named human on 2026-09-11), which DELETED the review-coverage
  axis and handed this plan a once-per-round one-shot instead.
- **Substitution:** SIDE A derived from `31-REVIEW.md`'s own `### (CR|WR|IN)-NN:` headings with
  fenced regions stripped; SIDE B from the corpus file's own `row("…")` markers attributed to their
  enclosing `it()` cases. Both counts printed, both derivations throwing on zero.
- **Recorded in:** `docs/audit/31-round7-residuals.md` §9.1.

### 2. [Correction] The "Skipped-entries finding" is a markdown-parse artifact, not a fifteenth item

- **Found during:** Task 1, deriving the probe set
- **Issue:** The convening brief enumerated fifteen items including "the Skipped-entries finding".
  Measured: `31-REVIEW.md:433`'s `## Skipped entries` is inside a fenced block (`:430`–`:442`) — the
  verbatim `render()` transcript quoted inside `CR-24`'s own reproduction. Stripping fences before
  the heading scan yields **13** headings, equal to the review's own frontmatter `total: 13`.
- **Action:** The item set is 13 findings + 1 regression = 14. CR-24 keeps one row. The parse
  artifact is recorded (§6.1) so round 8 does not carry a phantom forward.

### 3. [Rule 3 — blocking] `prior_activity_desc` was a 7 995-character line, above the plan's own ceiling

- **Found during:** Task 3
- **Issue:** The plan's acceptance criterion and its `<verify>` assert `.planning/STATE.md`'s longest
  line is at most 4 000 characters. Measured before the write: **7 995**, in `prior_activity_desc` —
  stale Phase-27 narration, superseded twice. This repository has previously combined a pathological
  STATE line with a superlinear guard predicate to turn a sub-second gate into a multi-minute one.
- **Fix:** shortened to a 363-character pointer naming the artifacts that hold the narration and the
  reason it was shortened. Measured after the write: longest line **2 524**, doubled-backslash runs
  **0**. Recorded in `deferred-items.md`; the state writer's behaviour is unchanged.

### 4. [Recorded, not repaired] The coverage predicate over-includes

- **Found during:** Task 2
- **Issue:** Under the STRICT predicate the coverage equality is **2 of 5**; under the weaker one it
  is **5 of 5**. The gap is `WR-35`, `IN-16` and `IN-17` — findings whose closure is a stderr line,
  an absence and a doc-block edit, none of which a UAT spec can drive. Neither predicate is derived
  from a rule separating the two classes.
- **Action:** NOT repaired — this plan writes no source. Both numbers published, the disagreement
  named, and the item carried in `deferred-items.md` and §11.3 with **owner: round 8's planner**.

## Issues Encountered

### Two harness false results, logged rather than absorbed

**Instance 15 — the governance dial written at the wrong key.** The first `admitAndAppend` probe
planted `{ "human_admission": "high-severity" }` at the config root; the module reads
`{ "context": { "human_admission": … } }`. Every dial value then produced the identical
`admission REFUSED (W3)` and **zero** files on disk — which reads exactly like a closure of CR-22
position 3, and is not one. Caught by driving all three dial values and observing they could not be
told apart: a dial that changes nothing is a dial that was not read. The probe was rebuilt against
the config shape `scripts/context-io.test.ts:2409-2414` writes, and only then was any result read.
**Not appended to `docs/audit/harness-false-result-instances.md` by this plan** — that file is bound
by `scripts/harness-instance-ledger.test.ts`'s derived-premise case, and this plan writes no source.
Owner: round 8's fix plan.

**A second, self-inflicted one.** The first full-suite run went RED on `POINT 7: no probe root is
left under '.temp'` — because this session's own AST probe roots were sitting under
`.temp/31-38-probe/`. The suite was measuring the measurement. Residue removed, suite re-run clean.
It is also why §7.2 records that the `.temp`/FIFO sweep must be taken AFTER the suite, and prints
the mid-flight readings (`.temp/31-27-parity-zwUXSg`, a live FIFO at
`.temp/31-27-parity-M7TqHw/scripts/checkpoints.js`) that prove it.

### One gate is RED, and it is pre-existing

`npm run check:diff-disposition` → `78 finding(s) over 39 elements`, exit 1. 80 at the round-6 close
and at the round-7 base; 78 after `31-33`; **78 here** — down 2 over the round, still open. Every
remaining finding names a clause in a file this round did not author. The gate's own remedy text
forbids the two shortcuts (narrowing the corpus, moving the recorded base). Carried with
`status: open`.

### Five probes named as NOT driven

`WR-32`'s untracked-candidate probe and its third-implementation spelling probe (both need a `.ts`
written under `scripts/`); `WR-36`'s end-to-end shared-corpus drive (needs a mirrored kit; the corpus
lives in the suite); `CR-22` position 4's live split (`DEFAULT_CONTEXT_ROOT` is not exported and the
split needs a shared-install layout); and the round-base RED suite re-run at `d484b9e` (quoted from
`31-VERIFICATION.md` row 7 as the pre-round figure, per this table's convention). Each is enumerated
by name in §1.2 and counted apart in §4.1.

### The commit-branch assertion, stated rather than silent

The executor's standard pre-commit assertion refuses a commit whose HEAD is the resolved default
branch. This project sets `git.branching_strategy: "none"`, every one of the 38 commits in this
round landed on `main`, and the orchestrating brief directs sequential commits on the main working
tree. The three task commits were made on `main` accordingly. **No configuration was changed to
silence the assertion**, and no `git stash`, `git clean` or force-push was run at any point.

## User Setup Required

None.

## Next Phase Readiness

**The round-7 score, as measured at `3baab0d`:**

| Item | Status at `MEASURED_AT` |
|---|---|
| `CR-22` | **CLOSED at 3 of 4 positions.** Position 4 open as `R-31-33-02` (not drivable from outside the module) |
| `CR-23` | **CLOSED**, four positions, both halves of the discriminant |
| `CR-24` | **CLOSED** |
| `CR-25` | **CLOSED** at its filed coordinate; the index-signature shape is a disclosed, driven remainder |
| the suite REGRESSION | **CLOSED**; suite green at 66 files / 4208 passed / 2 skipped |
| `WR-31`, `WR-32`, `WR-33`, `WR-34`, `WR-36` | **CLOSED** |
| `WR-35` | **ACCEPTED-AS-RESIDUAL** — the silence is closed, the narrowing retained by `D-33 (5)` |
| `IN-16`, `IN-17`, `IN-18` | **CLOSED** |
| the "Skipped-entries finding" | **NOT AN ITEM** — a fenced transcript inside CR-24 |
| round 6's `CR-17`, `CR-18`, `CR-19`, `CR-20`, `CR-21` | **all UNMOVED** as controls; four measured independently for the first time since round 6 |

**Nothing reproduced at `MEASURED_AT` that a round-7 plan claimed closed.** Every open item below was
either published as a residual by the plan that owned it, or is pre-existing, or was raised by this
measurement and left unrepaired on purpose.

**Open residuals, with owners:**

| Item | Owner |
|---|---|
| `R-31-33-01` — `admit()` cannot take a ledger root distinct from its dial root (63 cases went RED on the alternative) | `31-33`, published |
| `R-31-33-02` — the DEFAULT arguments split kit and host; `CR-22` position 4 | `31-33`, published |
| `RR-13` — a head the spec file hand-`declare`s for itself | `31-34`, published |
| the INDEX-SIGNATURE shape, and `frameworkSurface`'s two inner `catch` blocks | `31-35`, published |
| the installed-package magnitude behind `SURFACE_DEPTH_BOUND` / `SURFACE_NODE_BOUND` | unassigned — `UNKNOWN - verify`, the package cannot be installed here |
| `.temp` in `SKIPPED_DIRECTORIES` — disclosed, not reverted | `31-32`, published |
| the D-33 coverage one-shot, and its over-inclusive predicate | **round 8's planner** (raised here) |
| harness false-result instance 15, unappended to the ledger | **round 8's fix plan** (raised here) |
| `R-31-31-01` — the ambient `declare const it: unknown;` spelling | still round 8's fix plan; no round-7 plan took it |
| the GOV-02 shapes position dropped from `check-platform-shapes` | unassigned; criterion recorded |
| four `TRUSTED_ROOT_RESIDUALS` closed only on the Claude Code hook path | the register |
| `check:diff-disposition`, 78 findings over 39 elements | unassigned |
| the multi-sentence disposition-row class; 14 of 15 unguarded `mkfifo` sites | `31-29` / their own plans |
| `R-01`, `R-02`, `R-03` — the three standing human items, `UNKNOWN - verify` intact | a named human / a real `windows-latest` run |

**What did NOT move, deliberately:** `UATX-01` … `UATX-06` are unchecked, all six traceability rows
read `Gaps Found`, and the Phase 31 checkbox is unchecked with status `In Progress`.
`.planning/REQUIREMENTS.md` is byte-unchanged over the whole round. **Only a verification round may
flip a requirement, and an eighth verification round has not run.**

## Self-Check: PASSED

- `docs/audit/31-round7-residuals.md` — FOUND, and `git ls-files --error-unmatch` confirms it is
  tracked.
- `.planning/phases/31-autonomous-manual-testing/31-VALIDATION.md`, `deferred-items.md`,
  `.planning/STATE.md` — all FOUND and modified.
- `git log --oneline --all --grep="31-38"` → `2f8b2bc`, `06a5f62`, `193e348` — all three task
  commits FOUND.
- `git status --porcelain -- scripts hooks agent-factory install .github vitest.config.ts package.json`
  → empty. `git diff --name-only HEAD -- scripts hooks agent-factory install` → empty. **No source
  written.**
- `git hash-object hooks/guard.ts` → `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB`.
- `awk` longest STATE.md line → **2 524**, exit 0. `grep -c '\\\\'` → **0**.
- `git diff --quiet HEAD -- .planning/REQUIREMENTS.md` → exit 0.
- `npm run freshness:traceability` → exit 0. `npm run check:nul-bytes` → `ALL CHECKS PASSED`.
- `npm run check:residual-citations`, `check:audit-register`, `check:claim-anchors`,
  `check:banned-claims` → all `ALL CHECKS PASSED` against the finished record.
- `find .temp -mindepth 1` → empty; `find . -path ./node_modules -prune -o -type p -print` → empty,
  both taken after the suite finished.
- One gate is RED and it is recorded, not hidden: `check:diff-disposition`, 78 findings, pre-existing.
