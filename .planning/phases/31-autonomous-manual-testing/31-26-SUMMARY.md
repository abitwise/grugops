---
phase: 31-autonomous-manual-testing
plan: 26
subsystem: verification-record
tags: [closing-measurement, reproduction-ledger, residual-register, gap-closure-round-5, audit]
status: complete
requires:
  - "31-21..31-25: the five fix plans whose closures this plan MEASURES rather than inherits"
  - "31-VERIFICATION.md (round 5) and 31-REVIEW.md: the FINDING documents whose own probe spellings every row is driven from"
  - "docs/audit/31-round4-residuals.md: the section shape this record follows, and the source of IN-13's two items"
provides:
  - "docs/audit/31-round5-residuals.md — the paired reproduction ledger, the disposition ledger, the residual register, the probe index and the baseline-health record"
  - "IN-13 §4.3 and §4.4 resolved BY NAME"
  - "the finding that the git-status-based .temp/ residue gate was INERT in rounds 3, 4 and 5, with the hazard reproduced in-session"
  - "three deferred items with owners and criteria: the grown check:diff-disposition debt, the .temp/ collection hazard, and the unregistered R-31-21-* residuals"
affects:
  - docs/audit/31-round5-residuals.md
  - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
  - .planning/phases/31-autonomous-manual-testing/deferred-items.md
  - .planning/STATE.md
  - .planning/ROADMAP.md
tech-stack:
  added: []
  patterns:
    - "drive the FINDING's own probe spelling, never the fixer's fixture"
    - "a cleanliness gate that cannot fail is a gate that was never run — replace it with a predicate that can observe its target"
    - "derive the denominator with a command; state the equality rather than implying it"
    - "assert the harness's own premise before reading its result"
key-files:
  created:
    - docs/audit/31-round5-residuals.md
  modified:
    - .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
    - .planning/STATE.md
    - .planning/ROADMAP.md
key-decisions:
  - "No decision recorded. A measurement plan that recorded a decision would be deciding something it did not build — the plan's own assumption-delta says so, and this plan honours it. 31-CONTEXT.md is byte-unchanged: the gap-closure decision count stays at 12 (D-17..D-28)."
  - "The UATX requirement flips are WITHHELD although requirements.ready-ids reports 6/6 ready, on ROADMAP.md's governing sentence. requirements.mark-complete was not run."
requirements-declared: [UATX-01, UATX-02, UATX-03, UATX-04, UATX-05, UATX-06]
requirements-completed: []
metrics:
  duration: ~1h
  completed: 2026-09-10
commits: 4
plan_head_before: 78bdb27e4a67b61ca2ab2673606b784429872957
actuals:
  tokens: 30000
  tasks: 3
  commits: 4

coverage:
  - deliverable: "All sixteen round-5 behavioral spot-checks re-driven at ONE commit with the FINDING documents' own probe spellings, paired with the result each replaces"
    human_judgment: false
    verification:
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js <probe root> — rows 1,2,3,10,11,12 driven; row 10 moved 0 findings/EXIT=0 -> 1 finding/EXIT=1"
        status: pass
      - kind: command
        ref: "node <ctx probe> against committed scripts/context-io.js + compactor.js — rows 4,5,6 driven; row 4 moved promoted -> DECLINED (origin-outside-trusted-store), destNotes [], ledgerDelta 0"
        status: pass
      - kind: command
        ref: "mkfifo <ctx>/T-9/notes/<id>.md; timeout 10 node <probe> — row 7 moved EXIT=124/0 bytes -> EXIT=0 in 43 ms naming note-path-not-a-regular-file"
        status: pass
      - kind: command
        ref: "env -u CLAUDE_PROJECT_DIR -u GRUGOPS_PROJECT_DIR HOME=<planted repo> node <probe> — row 8 moved kit/off/WROTE -> planted home/high-severity/REFUSED"
        status: pass
      - kind: command
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — row 13: Test Files 62 passed (62), Tests 3908 passed | 2 skipped (3910), exit 0"
        status: pass
      - kind: command
        ref: "npm run freshness / check-foundation-guards.js / check-uat-oracles.js / git hash-object hooks/guard.ts — rows 14, 15, 16 all unmoved"
        status: pass
  - deliverable: "The five review-only probe variants the round-5 verifier never ran are each driven: CR-12's ledger FIFO, CR-14's namespace and index-0-helper spellings (and its control), WR-23's helper spec"
    human_judgment: false
    verification:
      - kind: command
        ref: "mkfifo <repoRoot>/.grugops/audit/admissions.jsonl; timeout 15 node <probe> — EXIT=0 in 59 ms, DECLINED (unreadable-audit-ledger), DEST-AFTER []"
        status: pass
      - kind: command
        ref: "namespace and index-0-helper specs — both moved 0 findings/EXIT=0 -> 1 finding/EXIT=1"
        status: pass
      - kind: command
        ref: "the review's WR-23 helper spec verbatim — moved 1 finding/EXIT=1 (naming a construct absent from the file) -> 0 findings/EXIT=0"
        status: pass
  - deliverable: "UATX-02, UATX-03, UATX-04 and UATX-05 re-measured by their own mechanisms rather than inherited"
    human_judgment: false
    verification:
      - kind: command
        ref: "node scripts/check-foundation-guards.js — guard_playwright_mcp_pin PASS, pin 0.0.78, 0 findings over 7/7 elements across 122 markdown files"
        status: pass
      - kind: test
        ref: "scripts/chrome-lane-bar.test.ts — Test Files 1 passed (1), Tests 15 passed (15), driven as its own file"
        status: pass
      - kind: command
        ref: "ADMIT_FROZEN_SHA256 byte-identical at 49dfa26 and HEAD; git diff 49dfa26..HEAD -- scripts/context-io.ts | grep -cE '(artifact-ref|content_hash|gate_run|SHA_HEX_RE)' -> 0"
        status: pass
      - kind: command
        ref: "PARSER_ABSENT_MARKER driven directly (exit 2, 1 emission); BROWSER_ABSENT_MARKER through its three suite cases; the vacuity floor on this repo's own root (exit 2)"
        status: pass
  - deliverable: "Every repository gate green at ONE commit, and the frozen floors re-measured whole rather than assumed"
    human_judgment: false
    verification:
      - kind: command
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness — all exit 0; freshness reports 60 committed .js files fresh"
        status: pass
      - kind: command
        ref: "the WHOLE DECIDER_MANIFEST walked with its premise asserted: 26 parsed entries == 26 64-hex literals, 14 distinct files, 0 mismatches"
        status: pass
      - kind: command
        ref: "git hash-object hooks/guard.ts == FROZEN_GUARD_BLOB (669725bc...); git diff --stat 49dfa26..HEAD -- package.json empty"
        status: pass
  - deliverable: "Every finding of 31-REVIEW.md, every anti-pattern row and every missing: bullet carries a disposition backed by a measurement taken in this session"
    human_judgment: false
    verification:
      - kind: command
        ref: "denominators DERIVED: 11 findings (grep -cE '^### (CR|WR|IN)-[0-9]+:' == the frontmatter's total of 11), 7 anti-pattern rows, 6 missing: bullets, 16 spot-check rows"
        status: pass
      - kind: command
        ref: "docs/audit/31-round5-residuals.md sections 7 and 8 — 24 rows against 24 source items, 23 closed and 1 closed with one named sub-item carried"
        status: pass
  - deliverable: "IN-13's two load-bearing UNKNOWN - verify items each resolved BY NAME, with 31-18-SUMMARY.md left byte-unchanged"
    human_judgment: false
    verification:
      - kind: command
        ref: "31-23 PROBE 6's three-spelling measurement settles section 4.3: round 4 measured the ADJUSTED spelling, because the ORIGINAL driven inside a repository resolves to the enclosing checkout"
        status: pass
      - kind: command
        ref: "a per-dial clause table DRIVEN in this session settles section 4.4: forged origin -> origin-outside-trusted-store at all four dials; legitimate anchored origin -> human-stamp-not-gated-at-destination at off/absent and PROMOTED at high-severity/all"
        status: pass
      - kind: command
        ref: "git diff --stat 49dfa26..HEAD -- 31-18-SUMMARY.md empty; git log --oneline over the same range -> 0 commits touch it"
        status: pass
  - deliverable: "The .temp/ residue gate rounds 3-5 relied on is recorded as INERT, and the hazard it could not see is reproduced in-session"
    human_judgment: false
    verification:
      - kind: command
        ref: "git check-ignore -v .temp/g.txt -> .gitignore:19:.temp/; git status --short .temp prints nothing with 58 entries present"
        status: pass
      - kind: command
        ref: "a contaminated suite run (vitest collected .temp/31-26-probe/wr19chain/uat/p.uat.spec.ts; 2 unrelated files failed; SIGSEGV exit 139, no summary line) and a clean run at the SAME commit (62/3908/2, exit 0)"
        status: pass
      - kind: command
        ref: "the replacement predicates: find . -path ./node_modules -prune -o -type p -print (empty); test ! -e .temp/31-2N-probe for all six; HOME restored; the zero-spec derivation case green in isolation after cleanup"
        status: pass
  - deliverable: "The round's residual register and the aggregated self-red-team probe index, written into one tracked document"
    human_judgment: true
    rationale: "The cardinalities are measured (11 + 6 + 9 + 4 members, 30 probes, 7 defects found) but the ADEQUACY of each residual's reason and closing criterion as prose is not something a test can assert. Every one of the five fix plans marked the equivalent obligation human_judgment: true; a verification round reading them is the check."
  - deliverable: "No requirement checkbox, traceability row or phase checkbox moved by this round"
    human_judgment: false
    verification:
      - kind: command
        ref: "git diff --stat 49dfa26..HEAD -- .planning/REQUIREMENTS.md empty; the same over the plan's own pinned range empty; no ROADMAP hunk touches the Phase 31 checkbox line"
        status: pass
      - kind: command
        ref: "requirements.ready-ids reports 6/6 ready and requirements.mark-complete was NOT run"
        status: pass
---

# Phase 31 Plan 26: The Closing Measurement of Gap-Closure Round 5 Summary

**All five Criticals, four Warnings and two Infos of gap-closure round 5 are independently
re-reproduced CLOSED at one commit against the committed `.js` using the FINDING documents' own
probe spellings — sixteen of sixteen spot-checks driven, the five failing rows all moved and the
eleven passing rows all unmoved, plus five review-only variants the verifier never ran — with
IN-13's two load-bearing `UNKNOWN - verify` items resolved by name, the whole 26-entry frozen
manifest re-measured, and the `.temp/` residue gate three rounds relied on recorded as INERT after
its hazard was reproduced in-session.**

This plan wrote no source. It measured.

## What shipped

| Artifact | Kind | Where |
|---|---|---|
| the paired reproduction ledger, the disposition ledger, the residual register, the probe index and the baseline-health record | NEW tracked document, 14 sections | `docs/audit/31-round5-residuals.md` |
| the four human-verification items, carried with markers intact and an incremented count | CHANGED | `31-VALIDATION.md` |
| the deferral posture stated, plus three deferred items with owners and criteria | CHANGED | `deferred-items.md` |
| round-5 gap closure recorded; the next action named as a SIXTH verification round | CHANGED (`status:` + `stopped_at:`) | `.planning/STATE.md` |
| the `31-26` plan checkbox | CHANGED `[ ]` → `[x]` (a plan row, never the phase row) | `.planning/ROADMAP.md` |

## Task 1 — every reproduction and every control re-driven at one commit

**Measured at `78bdb27`**, darwin 25.5.0 arm64, Node v24.12.0, with
`git status --porcelain -- scripts hooks agent-factory install docs` empty.

### The five previously-FAILING rows, each MOVED

| Row | Round-5 result | This round |
|---|---|---|
| **4 (CR-16)** — an ordinary in-repository directory promoted into a FRESH destination id | `promotedId` = the note's id, `threw: null`, the destination holds the file | `promotedId: null`, `DECLINED (origin-outside-trusted-store)`, `destNotes: []`, `ledgerDelta: 0` |
| **7 (CR-12)** — a FIFO at a note path under `timeout 10` | **EXIT=124**, 0 bytes stdout, 0 bytes stderr | **EXIT=0 in 43 ms**, `REFUSED … (note-path-not-a-regular-file)`, position still a FIFO |
| **8 (CR-13)** — `trustedRepoRoot()` with `HOME` at a planted repository root | the KIT; dial `off`; the self-stamped high-severity finding **WROTE** | the planted repository; `source: ok`, dial **`high-severity`**; the identical note **REFUSED** |
| **10 (CR-14)** — a renamed import with a dead inner `const it = 1;` | `0 findings over 1/1`, **EXIT=0** | `1 finding(s) over 1/1`, **EXIT=1**, `:2: … test.skip` |
| **12 (CR-15)** — a 1,000-nested-paren spec | uncaught `RangeError`, **EXIT=1**, stdout empty, no measurement | **EXIT=2**, stdout 0 B, stderr carrying the named could-not-run reason **and** the vacuity floor; **0** escaping stack frames |

### The eleven previously-PASSING rows, each UNMOVED

Rows 1, 2, 3 (the round-4 modifier closures — row 3 recorded by the verifier as *implied* and
**directly driven here** for the first time), 5 (the occupied-destination decline), 6 (CR-08's
legitimate promotion, destination note byte-identical to the origin, `ledgerDelta: 1`), 9 (the
below-home control, `R-31-19-01`), 11 (the declaration-free file still refused), 13 (the full suite),
14 (freshness, 60), 15 (both guards `ALL CHECKS PASSED`), 16 (`git hash-object hooks/guard.ts` =
`FROZEN_GUARD_BLOB`). **Zero rows are marked not-driven.**

### The five review-only variants the verifier never ran — all five MOVED

CR-12's ledger FIFO (`EXIT=124` with the note already written → `EXIT=0` in 59 ms,
`DECLINED (unreadable-audit-ledger)`, `DEST-AFTER []`); CR-14's namespace spelling and its
index-0-helper spelling (both `0 findings`/EXIT=0 → `1 finding(s)`/EXIT=1), plus the helper's own
control; and WR-23's helper spec (a false `1 finding(s)` naming a construct absent from the file →
`0 findings`, EXIT=0).

### Three disagreements, both figures printed

1. **Row 5's clause name moved while its verdict did not.** The verifier's own row-5 input — a
   forged origin at an occupied destination — now names `origin-outside-trusted-store` rather than
   `destination-id-occupied`, because `WR-25`'s fix put the operand clause ahead of the dial clause
   and ahead of the occupancy clause. Both halves are driven separately, so CR-11's closure is
   measured **at its own clause** rather than inferred from a decline a different clause produced.
2. **The index-0-helper finding's LINE differs** (this session `:4`, `31-24` `:5`) because the probe
   files place a statement differently. Construct, count and exit code all agree.
3. **Row 12's stderr size differs by three units** (327 bytes / 325 chars here, `324` in `31-25`).
   Resolved arithmetically: the message carries one em-dash (3 bytes, 1 char), so 327 B = 325 chars,
   and 325 chars minus the trailing newline = 324. The two records agree on content and differ in
   the unit counted.

A fourth apparent disagreement — `31-21`'s and `31-22`'s different "before" digests for the
`DECIDER_MANIFEST` — dissolves on measurement: it is one chain of three moves across three plans
(`2ccb6628…` → `58ed2236…` → `791f854d…` → `64ceee72…`), each with its artifact, none relaxed.

## Task 2 — the whole repository green at one commit, and the frozen floors re-measured

15 gates recorded with their exact output lines: suite **62 files / 3908 passed / 2 skipped**,
build, typecheck (3 projects), build parity, freshness (**60** committed `.js`), foundation guards
(**0.20 s**), UAT oracles, the frozen-floor + both hook suites (**439** tests), the structure
validator, the fixtures and tests typechecks, and four text gates. **`check:diff-disposition` is
red** — see the deviation below.

**The doctrine sentence is beside the green, not instead of it:** the suite exercised **ZERO** of
round 5's five Critical defects before the round's fixes, for the **fifth consecutive round**, and
the record says so in one sentence so a later reader cannot mistake the floor for the proof.

**The frozen floors were re-measured as a WHOLE**, with the harness asserting its own premise first,
because a walk that matches zero entries also reports `0 mismatches`:

```
premise: region found; 26 parsed entries == 26 64-hex literals in the region -> true
deciders: 2   ENTRIES CHECKED (the WHOLE manifest): 26   distinct module files: 14
MISMATCHES: 0
```

`FROZEN_GUARD_BLOB` and `ADMIT_FROZEN_SHA256` are both unchanged and neither is re-based;
`package.json` is byte-unchanged under both the plan's own pinned range and the real round base; the
round added **0** new committed `.js` files.

## Task 3 — dispositions, IN-13, the register, and the requirement rows left alone

**24 disposition rows against 24 derived source items** — 11 numbered findings (the derived count
equals the review's frontmatter total of 11), 7 anti-pattern rows and 6 `missing:` bullets. **23
closed by measurement; 1 (A11 / IN-13) closed with one named sub-item carried.** No row asserts a
closure this session did not measure.

**IN-13 §4.3, resolved by name.** Round 4 measured the **ADJUSTED** WR-21 spelling. `31-23` PROBE 6
drove a third cell nobody had: the ORIGINAL spelling **driven inside a repository** resolves to the
*enclosing checkout* — `S-BOUNDARY-WINS` fires first — so it cannot reproduce WR-21 from where every
round-4 probe ran, and could not have produced round 4's transcript. What remains, by name, is
`R-31-19-01`, a live residual re-measured UNMOVED here.

**IN-13 §4.4, resolved by name.** The disagreement is **temporal, not factual**, and both records
are vindicated. A per-dial table driven in this session, with both operands varied so the two clauses
are separable:

| dial | forged in-repository origin | legitimate anchored origin |
|---|---|---|
| `off` | `origin-outside-trusted-store` | `human-stamp-not-gated-at-destination` |
| absent | `origin-outside-trusted-store` | `human-stamp-not-gated-at-destination` |
| `high-severity` | `origin-outside-trusted-store` | **PROMOTED** |
| `all` | `origin-outside-trusted-store` | **PROMOTED** |

The round-4 document measured the pre-fix left column (the dial clause first — which is exactly what
`31-REVIEW.md` filed as WR-25, **citing §4.4 by name**); `31-18-SUMMARY.md`'s table is what the
post-fix mechanism does. The right column proves the dial clause was not weakened.
**`31-18-SUMMARY.md` is byte-unchanged** — `git diff --stat 49dfa26..HEAD` empty, **0** commits touch
it.

**IN-13's own `UNKNOWN - verify`** about `WORKFLOW_STOP_BULLET_COUNT` and `NON_TEST_MODULE_COUNT` is
**carried by name, not closed** — this round did not independently re-derive either.

**The residual register**: 11 governance-root members, 6 admission-route members, 9 modifier-ban
members (one rewritten), 4 exit-contract residuals, plus 4 `31-21` residuals recorded as held in
`31-CONTEXT.md` prose rather than in an exported two-sidedly-bound register, and 2 this round's own
measurements add. Each with the shape, the reason, the owner and what would force it closed.

**The probe index**: **30** self-red-team probes across the five fix plans (6 each, all run),
**7** of which found a defect — two of them *production* fixes for defects **no review named**
(`31-24` PROBE 4's assertion arms, `31-25` PROBE 1's output seam).

## The finding this round most wants read: the residue gate was inert, and its hazard is real

`docs/audit/31-round4-residuals.md` §5 used `git status --short .temp` as its cleanliness row, and
rounds 3, 4 and 5 each carried a gate of that shape. **Measured:** `.temp/` is gitignored at
`.gitignore:19`, so that command prints nothing however full the directory is. **A gate that cannot
fail is a gate that was never run.**

The hazard it could not see was then **reproduced by accident in this session**. With one leftover
probe spec under `.temp/`, the full suite collected it as a test file, two unrelated suite files
reported failures (`uat-spec-integrity.test.ts` 1, `hooks/guard.test.ts` 5) and the process died on
**SIGSEGV, exit 139**, with no `Test Files` summary line ever printed. `git status --short .temp` was
silent throughout. After `rm -rf` of the probe root, the identical command at the identical commit
returned `62 passed` / `3908 passed | 2 skipped`, exit 0. **Both transcripts are recorded**; every
gate figure in the record comes from the clean run.

The replacement predicates can observe their target: `test ! -e .temp/31-2N-probe` for all six plans,
the FIFO sweep `find . -path ./node_modules -prune -o -type p -print` (empty), the real `HOME`
confirmed, and the zero-spec derivation case re-confirmed green **in isolation after cleanup**.

## Deviations from Plan

### 1. [Rule 1 — bug, in this plan's own harness] The first context probe wrote the governance dial at the wrong level

- **Found during:** Task 1, driving rows 5 and 6.
- **Issue:** the dial lives under a `context` key (`{"context":{"human_admission":…}}`). The probe
  wrote it at the top level, so every destination read `human_admission: off` and rows 5 and 6 came
  back naming `human-stamp-not-gated-at-destination`. Recorded as a disagreement with the fixers,
  that would have been a **false finding against `31-22` and `31-23`**.
- **Fix:** the premise was checked by asking `readGovernanceConfig` directly and printing what it
  answered, then the probe was corrected and re-run. **This is at least the tenth logged instance in
  this phase of a verification harness producing a false result about its own premise** — see the
  next deviation for why the count is stated that way.
- **Verification:** rows 4, 5a, 5b, 6 and 6b all re-driven; `31-22`'s CONTROL 2 and CONTROL 3
  reproduced exactly.

### 2. [Recorded, not fixed] The phase's harness-instance count has collided

`31-22-SUMMARY.md` calls its ORDER-mirror correction "the **ninth** logged instance";
`31-25-SUMMARY.md` calls its PROBE 2(b) correction "the **ninth**". Two plans of the same round both
claimed number nine, and `31-21`, `31-23` and `31-24` recorded further instances without numbering
them. Recorded as a finding about the phase's own bookkeeping rather than repaired by assigning
numbers this plan cannot justify; this plan's own instance is stated as "at least the tenth".
**Criterion that closes it:** one derived list of the instances in one place, with the numbering read
off that list rather than typed into each summary.

### 3. [Rule 3 — blocking, then recorded] `check:diff-disposition` grew from 75 to 110, and the round owns 35 of them

- **Found during:** Task 2, MOVEMENT 1.
- **Issue:** the gate reports `110 finding(s) over 39 elements`, up from the `75` `31-20` recorded.
  Attribution is **derived, not assumed**: `18-context-compaction.md` went **0 → 29** (owed by
  `31-21` and `31-22`) and `16-context-read-write.md` **10 → 16** (+6 owed by `31-23`); the other
  three watched files are untouched by the round; and
  `git diff --name-status 49dfa26..HEAD -- docs/audit/29-style-dispositions/` is **empty** — the
  round wrote no disposition file where round 4 wrote four.
- **Why it was NOT fixed here:** unchanged from the `31-09`, `31-14`, `31-19` and `31-20` entries —
  writing rows for another plan's clauses puts a `before`/`after` and a reason in the register that
  this plan did not make and cannot vouch for. The gate was red before the round and is red after it;
  what moved is the count and the ownership.
- **Where it landed:** `deferred-items.md`, with owners (`31-21`, `31-22`, `31-23` for the new 35)
  and the unchanged criterion — one disposition file per owning plan, and **do not** move
  `00-base.md`'s base commit or narrow the watched corpus.

### 4. [Rule 2 — missing critical, recorded not fixed] `R-31-21-01..04` are held in prose, not in an exported register

`TRUSTED_ROOT_RESIDUALS` and `PROMOTE_ADMITTED_RESIDUALS` are bound two-sidedly by cases; `31-21`'s
four residuals are not. They live in `31-CONTEXT.md`'s D-24 block; in the source tree `R-31-21-01`
appears once in a test's message string and `R-31-21-03` once in a source comment, and the other two
appear in neither. The register's own contract — "adding a member without dispositioning it turns a
test red rather than shipping quietly" — has no purchase on them. **Recorded with an owner and a
criterion rather than fixed**, because adding an exported register is a source change and a closing
measurement plan that writes source has found a new defect, which belongs in its own plan.

### 5. [Recorded] The plan's own `<verify>` range does not resolve to the round base

`git rev-list -n1 --before=2026-09-09T19:00:00Z HEAD` resolves to `34f6989` — `31-21`'s GREEN
commit, strictly **inside** the round — not to the round base `49dfa26`. **The measured values are
unaffected** (`package.json` and `.planning/REQUIREMENTS.md` are byte-unchanged under both ranges),
but both ranges are run and recorded rather than the imprecision being silently satisfied, exactly as
`docs/audit/31-round4-residuals.md` §5 recorded its own plan's imprecise `fails_when`.

### 6. [Recorded] `.temp/31-21-derive-probe.mjs` survived its plan's cleanup

`.temp/` holds 58 entries; 57 pre-date this round's first fix commit and one — mtime
`2026-09-09T22:02:38Z` — was written by `31-21` **outside** its declared single probe root, so
`test ! -e .temp/31-21-probe` passed over it. It is a `.mjs`, not a `*.uat.spec.ts`, so it cannot
contaminate a spec derivation. Named with its owner and a criterion in `deferred-items.md` rather
than left unexplained. **This plan created nothing that survives.**

### 7. [Process] Committed on `main`

`git.branching_strategy: "none"` and `workflow.use_worktrees: false`; the orchestrator directed
sequential execution on the main working tree, as for `31-21` through `31-25`. The executor's
default-branch commit assertion was overridden on that direction. The four pre-existing uncommitted
entries (`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/`, `.planning/state.json`)
were never staged, reverted or stashed.

**Total deviations:** 1 auto-fixed (harness bug), 1 blocking-then-recorded, 1 missing-critical
recorded-not-fixed, 4 recorded. **Impact:** none on scope. Three of the seven are findings this
closing measurement RAISED — the grown disposition debt, the unregistered residuals, and the
reproduced `.temp/` hazard — and each carries an owner and a criterion instead of a silent fix.

## Requirements — the flips WITHHELD, with the governing sentence quoted

`requirements.ready-ids` reports **6/6 requirement(s) ready to mark complete**, because `31-26` is
the last plan of this phase declaring `UATX-01` … `UATX-06` and no sibling blocks them any more.
**`requirements.mark-complete` was NOT run, and no row moved.**

The governing sentence, quoted verbatim from `.planning/ROADMAP.md`:

> UATX-01, UATX-05 and UATX-06 stay `[ ]` / Gaps Found throughout: only a verification round may
> flip them.

and, from the same file:

> **The phase stays `In Progress`: executing a gap-closure round is not verifying it, and a fifth
> verification round has not run.**

This plan's own `must_haves.truths` says the same thing ("Only a verification round may flip a
requirement; a gap-closure plan that flips one is asserting its own success"), and `31-24-SUMMARY.md`
records the identical decision after its own tooling flipped two rows and they were reverted by hand.
**Every one of the six is withheld, not only the two blocked ones** — the sentence reserves the flip
for a verification round, and this is not one.

Proven unmoved rather than asserted:

```
$ git diff --stat 49dfa26..HEAD -- .planning/REQUIREMENTS.md      (empty)
$ git diff --stat 34f6989..HEAD -- .planning/REQUIREMENTS.md      (empty)
$ git diff 49dfa26..HEAD -- .planning/ROADMAP.md | grep '^[-+].*Phase 31: Autonomous Manual Testing'
(no hunk touches the Phase 31 checkbox line)
```

The only ROADMAP edit this plan makes is the **`31-26` plan row**, `[ ]` → `[x]`, matching
`31-21` … `31-25`. The **Phase 31 checkbox stays unchecked**.

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 test files passed, 3908 passed, 2 skipped**, exit 0; **0** files reporting `0 passed`; **0** paths collected from `.temp/` |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | all exit 0; `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `node scripts/check-foundation-guards.js && node scripts/check-uat-oracles.js` | both `ALL CHECKS PASSED`; **0.21 s** and **0.10 s** after the STATE.md write |
| `npx tsc -p tsconfig.fixtures.json --noEmit && npx tsc -p tsconfig.tests.json --noEmit` | both clean; no diagnostic names a file under `scripts/runnable-ref/fixtures/` |
| `find . -path ./node_modules -prune -o -type p -print` | prints nothing |
| `test ! -e .temp/31-2{1,2,3,4,5,6}-probe && git status --short` | exit 0; only the four pre-existing non-plan entries; no `uat/*.uat.spec.ts` outside the fixtures directory and no probe `.mjs` at the repository root |
| `awk '{ if (length($0) > m) m = length($0) } END { print m }' .planning/STATE.md` | **7995** (bound 20000); the rewritten `status:` field is 3756 chars; **0** quadruple-backslash runs |
| `git diff --stat 49dfa26..HEAD -- package.json` / `-- .planning/REQUIREMENTS.md` | both empty |
| `git hash-object hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001` = `FROZEN_GUARD_BLOB` |
| `31-CONTEXT.md` gap-closure decisions | **12** (`D-17` … `D-28`), byte-unchanged by this plan — a measurement plan records no decision |

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. No `<verify>` command went unrun,
and no row of the ledger claims a closure without a quoted measurement taken in this session.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file-access pattern and no schema change
at a trust boundary. It modifies no source file.

## Issues Encountered

Three, all recorded above as deviations 3, 4 and 6, each with an owner and a criterion in
`deferred-items.md`: the `check:diff-disposition` debt grown to 110 with 35 owed by this round's own
plans; `R-31-21-01..04` held in prose rather than in an exported register; and
`.temp/31-21-derive-probe.mjs` surviving its plan's cleanup. **None is a blocker for the sixth
verification round**, and none is fixed here, because a closing measurement plan that writes source
has found a new defect that belongs in its own RED-first plan.

## Next

**A SIXTH verification round.** `docs/audit/31-round5-residuals.md` is the artifact it starts from:
a paired reproduction ledger, 24 dispositions against 24 source items, IN-13 resolved by name, a
residual register with a closing criterion per member, an index of all 30 self-red-team probes, and
the baseline-health record with the doctrine sentence beside it. **§5.3 first** — the `.temp/`
contamination hazard is reproduced there, and any sixth-round figure taken without the FIFO sweep and
the per-plan probe-root existence tests is taken with an instrument this record has shown to be
blind.

## Self-Check: PASSED

Files claimed created or modified, verified present on disk:

```
FOUND: docs/audit/31-round5-residuals.md
FOUND: .planning/phases/31-autonomous-manual-testing/31-VALIDATION.md
FOUND: .planning/phases/31-autonomous-manual-testing/deferred-items.md
FOUND: .planning/STATE.md
FOUND: .planning/ROADMAP.md
```

Commits claimed, verified in `git log --oneline --all`:

```
FOUND: ecab826  docs(31-26) — Task 1, the paired reproduction ledger
FOUND: 4514557  docs(31-26) — Task 2, the one-commit gate record and the frozen floors
FOUND: 19e548e  docs(31-26) — Task 3, the dispositions, IN-13, the register
```

`commits: 4` is MEASURED from the on-disk plan ledger
(`git rev-list --count 78bdb27e4a67b61ca2ab2673606b784429872957..HEAD`), and includes the metadata
commit that carries this file. `actuals.tokens: 30000` is `chars/4` over the realized diff — 104,991
characters committed across the three task commits, plus this SUMMARY — on the same scale the plan's
`estimate.tokens: 80000` used.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-10*
