---
phase: 30-per-checkpoint-autonomy-matrix
plan: 02
subsystem: infra
tags: [safety-floor, checkpoints, claim-registry, typescript, fail-closed, derived-set]

requires:
  - phase: 28-kit-consistency-audit
    provides: SAFETY_FLOORS, the claim registry's depends_on vocabulary and its membership enforcement, the floor→claims index
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's checkpoints.ts roster, ternary vocabulary, fail-closed canonicalizer and derived FLOOR_CHECKPOINTS; plan 30-03's single fail-closed governance reader"
provides:
  - "a four-member SAFETY_FLOORS — `open_pr`, `test_integrity`, `production_requires_human_confirmation`, `protected_branch_merge` — with the `autonomy` scalar retired"
  - "every floor's configPath migrated to the dotted `checkpoints.<id>` form, with the matching cells on both shipped JSON config twins"
  - "a five-row registry `depends_on` remap plus a rewritten floor→claims index, with no claim deleted or struck through"
  - "`commit_to_branch` as a non-floor roster member at `off`, and the roster widened to five"
  - "`NON_DIALABLE_INVARIANTS` — the three floor-invariance test-harness properties recorded as permanently outside the matrix, asserted disjoint from CHECKPOINTS in both directions"
  - "`STRICTEST_MATRIX` — the fail-closed answer every governance-reader refusal branch now returns, closing an 11-of-12 fail-open a permissive default opened"
  - "the AUTO-05 floor→claims join asserted at its adjacency, empty and ordering edges, before a renderer exists to hide them"
  - "readRegistry's duplicate-claim-id refusal proven live by mutation, plus a fixture row count against an independently derived denominator"
affects: [30-04, 30-05, 30-06, 30-09, floor-invariance, check-claim-anchors, validate-agent-factory]

actuals:
  tokens: 22192
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A permissive default in a closed roster forces a SECOND constant: `CHECKPOINT_DEFAULTS` answers `the config says nothing`, `STRICTEST_MATRIX` answers `we could not read the config` — the two stop being interchangeable the moment one default is not the strictest value"
    - "Remap the DEPENDENT surface first and watch the enforcement refuse, then change the authority — a remap that never showed red proves only that two files agree"
    - "When the instructed RED is not producible because the defect was already closed, buy the discrimination by MUTATION and record which state was actually measured"
    - "Assert the verification harness's own premise before believing its verdict: check that the mutation reached the artifact under test"

key-files:
  created: []
  modified:
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/audit-model.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/check-audit-register.test.ts
    - scripts/check-claim-anchors.test.ts
    - scripts/check-diff-disposition.test.ts
    - scripts/generate-safety-surface.test.ts
    - docs/audit/28-claim-registry.md
    - agent-factory/config/factory.config.json
    - agent-factory/seed/.grugops/factory.config.json

key-decisions:
  - "The four floor ids are `open_pr`, `test_integrity`, `production_requires_human_confirmation`, `protected_branch_merge` — user decision `four-with-open-pr`, approved as recommended with no corrections"
  - "`commit_to_branch` exists as a NON-floor roster member at default `off`; a floor whose documented default is permissive would be a floor in name only, which is the con that disqualified the alternative"
  - "`test_integrity` maps `warn` → `notify` and `block` → `block`; `off` is refused for this ONE id by the validator as a documented per-id restriction (TINT-03), never by removing `off` from the ternary for every other checkpoint"
  - "AUTO-07's `no floor is lowered by omission` is a claim about FLOORS, so the roster keeps `block` for all four floors and the assertion was narrowed to the floor set rather than left as `every default is block`, which had become false"
  - "A permissive roster default must NOT survive a failed read: every refusal branch in the governance reader returns STRICTEST_MATRIX, not CHECKPOINT_DEFAULTS"
  - "The shipped config's new checkpoint cells were written at the ROSTER DEFAULT rather than at the legacy grade value, because declaring a floor at the permissive value would print an unauthorized-lowering banner on every run and be enforced as `block` anyway"

patterns-established:
  - "Two constants for two questions: the roster default answers `unconfigured`, the strictest matrix answers `unreadable` — never one constant serving both"
  - "RED the dependent surface against the unchanged authority, so the enforcement is proven live before the authority moves"
  - "A retirement is complete when the retired name RESOLVES TO NOTHING — asserted by looking it up and getting `undefined`, not by grepping for its absence"

requirements-completed: [AUTO-01, AUTO-05]

coverage:
  - id: D1
    description: "SAFETY_FLOORS carries exactly the four decided ids, `autonomy` is retired, and every member is a roster member"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#SAFETY_FLOORS carries exactly the four decided ids, and every one is a roster member"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#the RETIRED scalar resolves to nothing — asking the floor list for it returns undefined"
        status: pass
      - kind: integration
        ref: "node -e SAFETY_FLOORS.length===4 && every configPath startsWith 'checkpoints.'"
        status: pass
      - kind: other
        ref: "adversarial probe C: dropping `open_pr` from SAFETY_FLOORS → check:claim-anchors refuses by name + 4 unit failures"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every registry `depends_on` value resolves to a live floor, and the membership enforcement was proven live rather than assumed"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#no registry row depends on the retired scalar, and the live registry still parses"
        status: pass
      - kind: integration
        ref: "npm run check:claim-anchors → 47 rows parsed, all 4 safety floor(s) mapped"
        status: pass
      - kind: other
        ref: "measured RED: rows remapped BEFORE the floor set changed → `claim C-28-001 carries depends_on naming [open_pr], which is outside the safety-floor set [autonomy, …]`"
        status: pass
      - kind: other
        ref: "adversarial probe A: `depends_on: autonomy` planted back into the live registry → refused by name"
        status: pass
    human_judgment: false
  - id: D3
    description: "FLOOR_CHECKPOINTS' length is asserted against a count computed from SAFETY_FLOORS outside the filtering loop"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#FLOOR_CHECKPOINTS' length equals a count computed from SAFETY_FLOORS OUTSIDE the filtering loop"
        status: pass
      - kind: other
        ref: "adversarial probe B: a fifth floor with no roster seat → 2 unit failures naming it"
        status: pass
    human_judgment: false
  - id: D4
    description: "NON_DIALABLE_INVARIANTS records the three test-harness properties and is disjoint from CHECKPOINTS in both directions"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#no non-dialable invariant is a checkpoint (a later phase cannot quietly PROMOTE one)"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#no checkpoint is a non-dialable invariant (a later phase cannot quietly DEMOTE one)"
        status: pass
      - kind: other
        ref: "adversarial probes D and E: promoting `refuse-self` into the roster → 4 failures; demoting `open_pr` into the exclusion set → 5 failures"
        status: pass
    human_judgment: false
  - id: D5
    description: "A `Checkpoint` union member with no CHECKPOINT_DEFAULTS entry is a tsc diagnostic, demonstrated rather than asserted"
    requirement: "AUTO-01"
    verification:
      - kind: other
        ref: "tsc probe: TS1360 at scripts/checkpoints.ts(112,12) plus TS2741 at hooks/guard.ts(203,5), (208,3) and scripts/context-io.ts(1545,39); transcript below"
        status: pass
    human_judgment: false
  - id: D6
    description: "A permissive roster default cannot survive a failed config read — every refusal branch returns the strictest matrix"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#an UNREADABLE config (non-JSON) → STRICTEST plus a refusal, and source='unreadable'"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#STRICTEST_MATRIX is the whole roster at `block`, and it is NOT CHECKPOINT_DEFAULTS"
        status: pass
      - kind: integration
        ref: "adversarial probe F/G: 12 corruption shapes → 12/12 fail closed at HEAD; 11/12 BYPASS against the reverted reader"
        status: pass
    human_judgment: false
  - id: D7
    description: "The AUTO-05 floor→claims join is correct at its adjacency, empty and ordering edges"
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#ADJACENCY: rows sharing ONE depends_on value are disclosed independently, never merged"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#EMPTY: a SINGLE safety row renders as a valid join of one, so the floor is not `>1`"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#ORDERING: entries are in ascending claim-id order, and that is the ONLY ordering rule"
        status: pass
    human_judgment: false
  - id: D8
    description: "readRegistry refuses a duplicate claim id, and an all-unique fixture's row count matches an independently derived denominator"
    requirement: "AUTO-05"
    verification:
      - kind: unit
        ref: "scripts/audit-model.test.ts#refuses a duplicate claim id with a named throw whose message carries the duplicated id"
        status: pass
      - kind: unit
        ref: "scripts/audit-model.test.ts#ALL-UNIQUE ids parse, and the row count equals an INDEPENDENTLY derived count of the fixture"
        status: pass
      - kind: other
        ref: "mutation: deleting the `dupIds` refusal reds 6 tests, and a consumer Map keyed by id then resolves C-28-001 to the LATER row"
        status: pass
    human_judgment: false
  - id: D9
    description: "The shipped kit's checkpoint posture is reconciled with the legacy `autonomy` grade and the duplicate `test_integrity` cell is collapsed"
    verification: []
    human_judgment: true
    rationale: "NOT DELIVERED HERE and deliberately so — recorded as V-30-02-01 and V-30-02-02. The shipped config now declares `checkpoints.open_pr: block` beside `autonomy: \"pr\"` (which D-06 maps to `open_pr: off`) and `checkpoints.test_integrity: block` beside `quality.test_integrity: \"warn\"`. Neither is enforced at run time yet, so nothing behaves differently, but a human must decide when and how the legacy keys retire."

duration: 47 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 02: The Settled Floor Set Summary

**The documentary `autonomy` scalar is retired from `SAFETY_FLOORS` and replaced by `open_pr`; the five registry rows it backed are remapped onto the checkpoints that actually hold them, every floor moves onto a `checkpoints.<id>` cell, and the first permissive default in the roster turns out to have opened an 11-of-12 fail-open in the governance reader that this plan closes.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-05T15:47:00Z
- **Completed:** 2026-09-05T16:34:00Z
- **Tasks:** 3 (one a resolved decision checkpoint)
- **Files modified:** 15

## Task 1 — the decision, as the user gave it

The orchestrator put the checkpoint to the human before dispatching this executor. The response was
**`four-with-open-pr` — approved as recommended, no corrections.** Recorded here verbatim, per the
task's acceptance criteria:

**The four floor ids.**

| id | configPath after this plan | tier |
|---|---|---|
| `open_pr` | `checkpoints.open_pr` | floor |
| `test_integrity` | `checkpoints.test_integrity` | floor |
| `production_requires_human_confirmation` | `checkpoints.production_requires_human_confirmation` | floor |
| `protected_branch_merge` | `checkpoints.protected_branch_merge` | floor |

`commit_to_branch` exists as a **non-floor** roster member, default `off`.

**The five-row remap, by claim id.**

| Claim | `depends_on` before | `depends_on` after |
|---|---|---|
| C-28-001 | `autonomy, production_requires_human_confirmation, protected_branch_merge` | `open_pr, production_requires_human_confirmation, protected_branch_merge` |
| C-28-010 | `autonomy, production_requires_human_confirmation, protected_branch_merge` | `open_pr, production_requires_human_confirmation, protected_branch_merge` |
| C-28-023 | `autonomy, production_requires_human_confirmation, protected_branch_merge` | `open_pr, production_requires_human_confirmation, protected_branch_merge` |
| C-28-032 | `autonomy` | `open_pr, protected_branch_merge` |
| C-28-038 | `autonomy, production_requires_human_confirmation, protected_branch_merge` | `open_pr, production_requires_human_confirmation, protected_branch_merge` |

C-28-018 is the sixth `kind: safety` row and never named `autonomy`; it is unchanged.

**The `test_integrity` value mapping.** `warn` → `notify`, `block` → `block`. `off` is refused **for
this one id** by the validator as a documented per-id restriction (the TINT-03 carve-out), **not** as
a fourth disposition value and **not** by removing `off` from the ternary for every other checkpoint.

## Accomplishments

- **The floor set is four ids and the retired name resolves to nothing.** Asking `SAFETY_FLOORS` for
  `autonomy` returns `undefined`, `CHECKPOINTS` does not contain it, and the floor derivation throws
  rather than being talked into producing it. A retirement is only complete when the name stops
  answering.
- **The enforcement was proven live before the authority moved.** The registry rows were remapped
  FIRST, against the unchanged floor set, and `check:claim-anchors` refused the file by name. Only
  then did `SAFETY_FLOORS` change. A remap that never showed red proves that two files agree, which
  is not the same fact.
- **Every floor is now held by a `checkpoints.<id>` cell.** `test_integrity` moved off
  `quality.test_integrity` and `production_requires_human_confirmation` off its top-level boolean, so
  `safetyFloorLiveValue` needed no change — but the cells had to be created, which the plan's file
  inventory did not anticipate (deviation 1).
- **The first permissive default in the roster exposed a real fail-open, and it was measured.**
  `commit_to_branch: off` made "fall back to the roster defaults on a bad config" stop meaning "fail
  closed". Against a reverted reader, **11 of 12 corruption shapes** hand back `off` for a member a
  repository may have declared `block`. `STRICTEST_MATRIX` closes all 11.
- **The exclusion set is data, and it is fenced from both sides.** `NON_DIALABLE_INVARIANTS` records
  the three `floor-invariance.test.ts` properties D-04 places permanently outside the matrix, each
  with the reason it is a test-harness property. Promoting one into the roster reds 4 tests;
  demoting a checkpoint into it reds 5.
- **The AUTO-05 join edges are asserted before a renderer exists to hide them.** The remap put four
  rows on one `depends_on` value, which is the first time adjacency was even reachable.

## Task Commits

1. **Task 1: the four floor ids and the five-row remap** — no commit; a decision checkpoint resolved
   by the human before dispatch, recorded above and in STATE.md.
2. **Task 2: SAFETY_FLOORS remap plus the non-dialable invariant record** — `366c0b9` (feat)
3. **Task 3: readRegistry refuses a duplicate claim id** — `e8e9e77` (test)

## Files Created/Modified

- `scripts/audit-model.ts` / `.js` — `SAFETY_FLOORS` rewritten to the four decided ids with migrated
  `configPath`s and a header recording what changed and why; new `NON_DIALABLE_INVARIANTS` export
  and its `NonDialableInvariant` interface
- `scripts/checkpoints.ts` / `.js` — `Checkpoint` union and `CHECKPOINT_DEFAULTS` widened to five
  members; new `STRICTEST_MATRIX`; the all-`block` claim in the defaults comment narrowed to floors
- `scripts/context-io.ts` / `.js` — all four refusal branches (whole-file-not-an-object,
  `checkpoints`-not-an-object, short-matrix, unreadable) return `STRICTEST_MATRIX`; their refusal
  messages now say `enforced at \`block\`` rather than `enforced at its default`
- `scripts/checkpoints.test.ts` — a `matrix()` helper deriving full matrices from the roster
  defaults (so a widening is not a dozen mechanical edits); two new describe blocks (11 cases);
  the `every default is block` case narrowed to floors
- `scripts/audit-model.test.ts` — the AUTO-05 join block (5 cases) and the Task 3 duplicate-id /
  denominator block (7 cases); `autonomy` fixtures moved to `open_pr`
- `scripts/check-audit-register.test.ts`, `scripts/check-claim-anchors.test.ts`,
  `scripts/check-diff-disposition.test.ts`, `scripts/generate-safety-surface.test.ts` — registry
  fixtures moved off the retired id (deviation 2)
- `docs/audit/28-claim-registry.md` — five `depends_on` cells remapped; the floor→claims index
  rewritten with two paragraphs recording the retirement and the `protected_branch_merge` cell
- `agent-factory/config/factory.config.json`, `agent-factory/seed/.grugops/factory.config.json` —
  three new `checkpoints` cells (deviation 1)

## The `tsc` diagnostic from the defaultless-member experiment

A sixth `Checkpoint` union member was added with no `CHECKPOINT_DEFAULTS` entry, `tsc --noEmit` was
run, and the member was removed. Quoted as produced:

```
scripts/checkpoints.ts(112,12): error TS1360: Type '{ readonly protected_branch_merge: "block"; readonly production_requires_human_confirmation: "block"; readonly test_integrity: "block"; readonly open_pr: "block"; readonly commit_to_branch: "off"; }' does not satisfy the expected type 'Record<Checkpoint, Disposition>'.
  Property 'deliberately_defaultless_probe' is missing in type '{ readonly protected_branch_merge: "block"; readonly production_requires_human_confirmation: "block"; readonly test_integrity: "block"; readonly open_pr: "block"; readonly commit_to_branch: "off"; }' but required in type 'Record<Checkpoint, Disposition>'.
```

The `satisfies` clause is the primary diagnostic, and it does not stand alone — the same omission
also reds three CONSUMER sites that build a total matrix, which is the property that matters:

```
hooks/guard.ts(203,5): error TS2741: Property 'deliberately_defaultless_probe' is missing …
hooks/guard.ts(208,3): error TS2741: Property 'deliberately_defaultless_probe' is missing …
scripts/context-io.ts(1545,39): error TS2741: Property 'deliberately_defaultless_probe' is missing …
```

`hooks/guard.ts` was NOT edited by this plan — the probe was a temporary source change to
`checkpoints.ts` alone, reverted immediately, and `git diff --stat hooks/` is empty on both task
commits. The byte-freeze at `d91c2006` is untouched.

## Every red run, as measured

| # | What was made red | Command | Measured result |
|---|---|---|---|
| 1 | **Task 2 RED (the instructed one).** Five registry rows remapped to `open_pr` while `SAFETY_FLOORS` still held `autonomy` | `npm run check:claim-anchors` | **1 CHECK(S) FAILED.** `refusing to parse docs/audit/28-claim-registry.md — claim C-28-001 carries \`depends_on\` naming [open_pr], which is outside the safety-floor set [autonomy, test_integrity, production_requires_human_confirmation, protected_branch_merge]` |
| 2 | **The consumer-direction compile proof.** Roster widened before the test matrices were derived | `npm run typecheck` | **6 × TS2345** in `scripts/checkpoints.test.ts` — every partial matrix literal named the three missing members. Fixed by deriving from `CHECKPOINT_DEFAULTS`, not by retyping the literals |
| 3 | **The premise this plan broke.** The existing suite asserted every checkpoint reads `block` on a degenerate config | `npx vitest … checkpoints.test.ts` | **5 failed**, four of them `expected 'off' to be 'block'` on the unreadable / non-object branches. This is what surfaced the fail-open |
| 4 | **Task 3 mutation.** The `dupIds` refusal deleted from `readRegistry` | `npx vitest … audit-model.test.ts` | **6 failed** — the four new refusal cases plus the two pre-existing ones. The instructed RED (a duplicate fixture that PARSES) is not producible against HEAD; see below |
| 5 | Task 3 mutation, the consequence | node probe against the mutated `.js` | Both rows survive the parse, and a consumer `Map` keyed by claim id resolves `C-28-001` to the **later** row: an `overstated` status shadowed by `true` |

## On the RED Task 3 asked for, and the state actually found

The plan's action text says to "close the last-wins duplicate path in `readRegistry()`", and its
acceptance criteria ask the SUMMARY to record "the pre-fix state in which the duplicate fixture
parsed successfully."

**There is no last-wins path, and there was none at the start of this plan.** Plan 29-28 already
added the refusal at `readRegistry`'s `dupIds` check, and it already mirrors `readRegister()`'s Table
A duplicate-`file` refusal in every respect the plan asks for: the same `duplicates()` helper, the
same `refuse()` call, the same named throw, the same message shape, and the same detection point
(after the rows are built, before anything is computed over them). `scripts/audit-model.test.ts` also
already carried one case for it.

Writing the requested RED down would have been a fabricated measurement, so it is not written down.
The discrimination the RED would have bought was bought by **mutation** instead — row 4 above — and
what the mutation shows about the shape is worth recording exactly: without the refusal,
`readRegistry` does **not** silently take the last occurrence at the parse level; it returns **both**
rows. The last-wins happens one layer up, in any consumer that keys a `Map` by claim id — which is
what row 5 measured, and which is precisely the `status`-shadowing hazard plan 30-09 makes
load-bearing.

**What genuinely did not exist and was added:** an all-unique fixture's row count checked against a
denominator computed by an **independent text scan authored in the test file** — never `Registry`'s
own published figures and never the loop that built the rows. The existing pins compare published
denominators against the LIVE registry only, so a FIXTURE that parsed short (three of four, rather
than zero) had nothing to be short against.

## Adversarial verification (a green suite is not proof for a safety invariant)

Seven probes, each an attempt to make the invariant this plan installs fail while the suite stays
green. Every probe was reverted and the tree verified clean afterwards.

| Probe | The bypass attempted | Result |
|---|---|---|
| **A** | Plant `depends_on: autonomy` back into the LIVE registry | **REFUSED by name** — `claim C-28-001 carries depends_on naming [autonomy], which is outside the safety-floor set [open_pr, …]` |
| **B** | Add a fifth `SAFETY_FLOORS` member with no roster seat (a floor nothing derives) | **RED, 2 cases** — the every-floor-is-a-roster-member case and the configPath case both name it |
| **C** | DROP `open_pr` from `SAFETY_FLOORS` (shrink what is protected) | **RED both tiers** — `check:claim-anchors` refuses the registry, and 4 unit cases fail including the outside-the-loop denominator |
| **D** | PROMOTE `refuse-self` from the exclusion set into the roster | **RED, 4 cases** — both disjointness directions plus the non-vacuity case |
| **E** | DEMOTE `open_pr` from the roster into the exclusion set | **RED, 5 cases** |
| **F** | 12 config-corruption shapes against a repo that DECLARED `commit_to_branch: block` | **12/12 fail closed** — every shape returns `block`, with a refusal recorded on 11 of them |
| **G** | The same 12 shapes against the reader with `STRICTEST_MATRIX` reverted to the roster defaults | **11/12 BYPASS** — `commit_to_branch=off` on every corruption shape, including `source=unreadable`. The suite reds 3 cases, so the fix is discriminated as well as necessary |

Corruption shapes in F/G: valid control · corrupt JSON · empty file · whitespace-only · NUL bytes ·
BOM + corrupt · `checkpoints` as an array · whole file as an array · `checkpoints` as a string ·
truncated mid-value · `checkpoints: null` · whole file as a number.

**Two probe runs produced FALSE RESULTS, and the cause was the same both times.** Probe A first
reported PASS (no bypass detected) and probe G first reported 12/12 fail-closed (fix unnecessary).
Neither was true. In A, a BSD `sed` command using the empty-pattern-reuse form `s//…/` silently
edited nothing, so the gate correctly passed an unmodified file. In G, `npm run build` **failed**
with `TS6133: 'STRICTEST_MATRIX' is declared but its value is never read` — the mutation left an
unused import — so `scripts/context-io.js` was never regenerated and the probe measured the
UNMUTATED artifact. Both were caught only by asserting the harness's own premise afterwards:
`grep -n` on the file for A, and `grep -c STRICTEST_MATRIX scripts/context-io.js` plus the build exit
code for G. **A probe that reports "no bypass" without first proving it changed the thing under test
is not evidence.** The corrected runs are the ones in the table.

**What this does NOT prove.** These probes cover the floor SET and the config READ. They say nothing
about whether `open_pr`, `test_integrity` or `commit_to_branch` are ENFORCED anywhere — no hook
consults them yet, which is later plans' work — nor about the two-key rule end to end, which only a
spawned `guard.js` can establish. `open_pr`'s floor status today is about what a lowering would mean,
not about a stop anything currently performs.

## Decisions Made

Beyond the Task 1 decision recorded above:

**`STRICTEST_MATRIX` is a second constant, not a re-flattened first one.** The tempting fix for the
fail-open was to give `commit_to_branch` a `block` default like everything else, which would have
made every existing assertion pass unchanged. That would have contradicted D-06 (the grade default is
permissive) and, worse, would have restored the coincidence that made the bug possible: two different
questions — "what does an unconfigured repo get?" and "what does an unreadable config get?" — sharing
one answer only because the answers happened to be equal. The two are now separate constants, and a
test asserts they are **not** equal, so a later phase that re-flattens the defaults cannot silently
re-merge them.

**AUTO-07's assertion was narrowed, not deleted.** `every roster member's default is block` became
`every FLOOR's default is block`, derived from `FLOOR_CHECKPOINTS` rather than from a transcribed list.
The requirement's actual claim is about floors; the broader sentence was true only while the roster
happened to contain nothing else. Narrowing it to what AUTO-07 says keeps the assertion honest as the
roster widens in plan 30-04.

**Registry claim TEXT was not touched.** Only `depends_on` cells and the floor→claims index moved.
Whether any of those sentences must now be recorded `dropped` is plan 30-09's measurement, and the
prohibition in this plan's frontmatter — a public claim must never be deleted or struck through when
its floor is lowered — is honoured: the five rows, their anchors and their `mechanism` prose are all
intact, and the index gained a paragraph recording what the retirement did rather than losing one.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The migrated `configPath`s have nowhere to resolve without new config cells**

- **Found during:** Task 2
- **Issue:** the plan directs every floor's `configPath` to the dotted `checkpoints.<id>` form so
  `safetyFloorLiveValue` needs no change. But `safetyFloorLiveValue` **throws** on a path that does
  not resolve, and `scripts/audit-model.test.ts` asserts every backed floor's path resolves in the
  live `factory.config.json`. Only `checkpoints.protected_branch_merge` and
  `checkpoints.production_requires_human_confirmation` existed (plan 30-01). The plan's
  `files_modified` lists no config file, so it is unshippable as written.
- **Fix:** `checkpoints.test_integrity: "block"`, `checkpoints.open_pr: "block"` and
  `checkpoints.commit_to_branch: "off"` added to `agent-factory/config/factory.config.json` and its
  seed twin, at the ROSTER DEFAULT. Writing the legacy grade values instead
  (`open_pr: off`, `test_integrity: notify`) was considered and rejected: both are floor-tier, so a
  permissive declaration is an unauthorized lowering — enforced as `block` anyway and printed on
  every guard run as `NOT AUTHORIZED`, which looks lowered and behaves blocked.
- **Files modified:** both JSON config twins
- **Verification:** `every floor's configPath is the dotted checkpoints.<id> form, and it resolves
  live`; `check:imperative-lexicon` still derives 22 config keys; `validate-agent-factory` passes
- **Committed in:** `366c0b9`
- **Residual, recorded not fixed:** the markdown twin `factory.config.md` still does not document the
  `checkpoints` object at all (it did not after plan 30-01 either), and the shipped values are now
  stricter than the legacy grade the same file declares. Both are V-30-02-01.

**2. [Rule 3 - Blocking] Four test files carried registry fixtures naming the retired id**

- **Found during:** Task 2
- **Issue:** `scripts/audit-model.test.ts`, `scripts/check-audit-register.test.ts`,
  `scripts/check-claim-anchors.test.ts`, `scripts/check-diff-disposition.test.ts` and
  `scripts/generate-safety-surface.test.ts` build registry fixtures with
  `- depends_on: autonomy`. Once the floor set drops it, those fixtures are refused at parse time and
  11 tests fail on an error unrelated to what they measure. None is in the plan's `files_modified`.
- **Fix:** every fixture moved to `open_pr`; no assertion changed. `check-claim-anchors.test.ts`'s
  `FLOORS` baseline string — a mirror carrying one safety claim per floor, so unrelated cases do not
  trip over floor-coverage — moved to the four live ids.
- **Verification:** all five suites green (583 cases across the 8 affected files)
- **Committed in:** `366c0b9`

**3. [Rule 2 - Missing Critical] A permissive roster default silently opened a fail-open in the governance reader**

- **Found during:** Task 2, surfaced by the existing suite going red on its own premise
- **Issue:** `scripts/context-io.ts`'s four refusal branches returned `CHECKPOINT_DEFAULTS`, and their
  own comment justified it: "Branches 1 and 3 reach the roster DEFAULT rather than `off`, and every
  default is `block`, so no degenerate shape can lower a checkpoint." Adding `commit_to_branch: off`
  makes that premise FALSE. A repository that had declared `commit_to_branch: block` and then
  corrupted its config would have had the corruption GRANT the permission it refused.
- **Fix:** new `STRICTEST_MATRIX` in `scripts/checkpoints.ts`, derived from `CHECKPOINTS`, returned by
  all four refusal branches. The zero-config branch (`checkpoints` absent, file readable) keeps the
  roster defaults — that one is not a failed read. Refusal messages updated from "enforced at its
  default" to "enforced at `block`", which is now what actually happens.
- **Files modified:** `scripts/checkpoints.ts` / `.js`, `scripts/context-io.ts` / `.js`,
  `scripts/checkpoints.test.ts`
- **Verification:** probes F and G — **11 of 12 corruption shapes bypass without the fix, 0 of 12
  with it**; 3 unit cases discriminate
- **Committed in:** `366c0b9`
- **Note:** `scripts/context-io.ts` is not in the plan's `files_modified` either. It had to be,
  because this is the point of effect: fixing it in the guard would leave the hole open for the next
  consumer of the reader.

**4. [Rule 1 - Bug] The `every default is block` assertion had become false**

- **Found during:** Task 2
- **Issue:** `scripts/checkpoints.test.ts` asserted every roster default is `block`, and
  `scripts/checkpoints.ts`'s comment said the same. D-06 makes that false for `commit_to_branch`.
  Deleting the case would have removed AUTO-07's only unit-level assertion.
- **Fix:** narrowed to the claim AUTO-07 actually makes, derived from `FLOOR_CHECKPOINTS`: every
  FLOOR defaults to `block`, the non-floor arm is exercised, and the one permissive member is asserted
  by name. Both the test and the source comment were corrected together.
- **Verification:** probe C (dropping a floor) reds this case, so the narrowing did not hollow it out
- **Committed in:** `366c0b9`

**5. [Rule 3 - Blocking] Six partial-matrix test literals stopped compiling**

- **Found during:** Task 2
- **Issue:** `Record<Checkpoint, Disposition>` is total, so every object literal in the test file had
  to name all five members. Editing six literals by hand would have made every future roster widening
  a mechanical multi-site edit — the hand-maintained-set rot this module exists to refuse.
- **Fix:** a `matrix(overrides)` helper spreading `CHECKPOINT_DEFAULTS`. A new checkpoint now arrives
  in every test at its default with no edit.
- **Verification:** `npm run typecheck` clean; all 45 cases in the file pass
- **Committed in:** `366c0b9`

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 missing-critical, 1 bug).
**Impact on plan:** no scope creep. Four were unavoidable consequences of the floor-set change
reaching surfaces the plan's inventory did not list (the config twins, five test files, the reader's
refusal branches, six type-total literals). The fifth — deviation 3 — is the plan's most important
outcome and was not anticipated by it: introducing the first permissive default in a closed roster is
what made "fall back to the defaults" stop meaning "fail closed", and it was found because the
existing suite asserted its own premise loudly enough to red.

## Issues Encountered

**`check:build-parity` reds mid-task, by design.** After editing a `.ts` and rebuilding, the gate reds
until the paired `.js` is committed. Green immediately after each commit. Same mechanism plan 30-03
recorded; not a failure.

**One pre-existing suite failure, not this plan's.** `scripts/frontmatter.test.ts`'s D-49 false-red
control fails on `.planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md`
(`V-30-01-01` in `deferred-items.md`). Baseline before this plan: **1 failed / 2521 passed**. After:
**1 failed / 2545 passed** — the same single failure, +24 new tests. This plan's diff touches neither
`scripts/frontmatter.*` nor that document.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path. Every assertion added was watched fail — by
mutation or by adversarial probe — before it was allowed to pass.

## Threat Flags

None. This plan adds no network endpoint, no auth path and no schema at a trust boundary. It installs
zero packages: `git diff 25a7b4c..HEAD -- package.json package-lock.json` is empty, so T-30-SC holds
as asserted absence at plan scope.

The plan's three substantive register entries are addressed: **T-30-07** (repudiation via duplicate
handling) by the mutation-proven refusal, the shadowed-`status` case and the independent fixture
denominator; **T-30-08** (tampering with the `depends_on` remap) by the measured RED before the floor
set moved, plus probe A; **T-30-09** (a floor silently dropped) by the outside-the-loop denominator
and the two-directional disjointness, both discriminated by probes B, C, D and E.

## Full verification record

| Gate | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | 57 files, **2545 passed / 2 skipped / 1 failed** (the pre-existing `frontmatter` false-red) |
| `npx vitest … checkpoints.test.ts audit-model.test.ts` | 45 + 121 = **166 passed** |
| `npm run build` · `npm run typecheck` | exit 0 |
| `npm run check:build-parity` | PASS (post-commit) |
| `npm run freshness` | PASS — 52 committed `.js` fresh |
| `npm run check:claim-anchors` | PASS — 47 rows, 47 byte-identical comparisons, **all 4 safety floor(s) mapped** |
| `npm run check:audit-register` | PASS — 6 `kind: safety` claims, kind distribution safety 6 / architecture 33 / install 8 = 47 |
| `check:banned-claims` `check:imperative-lexicon` `check:diff-disposition` `check:public-docs` `check:nul-bytes` | all PASS |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `freshness:catalog` `:adapters` `:skill-twins` `:context` `:queue` `:traceability` | all PASS |
| Floor-set probe (`SAFETY_FLOORS.length === 4`, every `configPath` under `checkpoints.`) | PASS |
| Adversarial probes A–G | 7 attempted bypasses, **0 succeeded** (2 harness false results caught and corrected) |
| `git diff --stat hooks/` across both task commits | empty — the byte-frozen guard is untouched |

**Note on `actuals.tokens`:** 22192 is chars/4 over the realized diff (88,769 chars across 15 files),
the same scale the plan's `estimate: 72000` uses. The estimate was ~3.2× the actual; the plan's own
`confidence: low` was well placed, and the overshoot came from budgeting for a `readRegistry` fix that
turned out to be already done.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for 30-04.** It widens the `Checkpoint` union from the derived tag set and adds the
  validator's `autonomy` refusal. It will find a five-member roster, `SAFETY_FLOORS` at four ids all
  on `checkpoints.<id>` cells, and a `matrix()` test helper that absorbs a widening without edits.
- **Three live constraints for later plans in this phase:**
  1. **A new FLOOR must default to `block`.** The assertion is derived from `FLOOR_CHECKPOINTS`, so a
     permissive floor default is red without anyone remembering to check. A new NON-floor member may
     default permissively — and if it does, confirm it flows through `STRICTEST_MATRIX` on every
     refusal branch, not through `CHECKPOINT_DEFAULTS`.
  2. **A new floor id needs a `checkpoints.<id>` cell in both JSON twins in the SAME commit**, or
     `safetyFloorLiveValue` throws and `audit-model.test.ts` reds.
  3. **`STRICTEST_MATRIX` and `CHECKPOINT_DEFAULTS` are asserted UNEQUAL.** Re-flattening every
     default to `block` reds that case on purpose — the two constants answer two different questions
     and must not become interchangeable again.
- **Two items handed to a later plan:** V-30-02-01 (the shipped posture vs the legacy `autonomy: pr`
  grade, and `factory.config.md` still not documenting `checkpoints`) and V-30-02-02
  (`test_integrity` holding two config cells until the legacy key retires, TINT-03 intact).
- **For plan 30-09:** the `status`-shadowing hazard is closed ahead of it. Two rows sharing a claim id
  are refused at parse time, so a `dropped` status cannot be laundered by a later duplicate row.

## Self-Check: PASSED

- All 15 modified files exist on disk (`[ -f ]` verified); this plan created no file, so there is
  nothing to check in that direction.
- Both task commits found in `git log --oneline --all`: `366c0b9`, `e8e9e77`.
- Every task's `<acceptance_criteria>` re-run and passing, including the two the plan phrased against
  a state that did not exist (Task 3's pre-fix RED) — recorded as measured, not as predicted.
- Every plan-level `<verification>` command re-run and recorded in the table above.
- The one suite failure is the documented pre-existing `V-30-01-01`, confirmed by name and by diff
  scope.
- Every adversarial probe reverted; `git status --short` shows no unintended working-tree change.

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*
