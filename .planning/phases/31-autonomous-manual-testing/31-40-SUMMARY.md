---
phase: 31-autonomous-manual-testing
plan: 40
subsystem: shared-verified-context
tags: [typescript, ast-derivation, census, governance, audit-ledger, gap-closure]
status: complete

requires:
  - phase: 31-autonomous-manual-testing
    provides: "plan 31-39's one owner authority (`actionOwnerRoot` / `ActionOwner`), the separated governance-DIAL and LEDGER-owner parameters on `admit`/`appendNote`, and the `WritePathResidual` interface this register copies"
provides:
  - "`deriveRootArgumentSites` — every call to a write-path entry point across the repository's tracked `.ts` sources, with the expression supplied for the DIAL argument and for the LEDGER argument, attributed to the nearest named enclosing scope"
  - "`ROOT_DIVERGENCE_KINDS` + `RootDivergenceKind` — a kind vocabulary closed at three members, with the type DERIVED from the constant so a compiler and a test read one object"
  - "`ROOT_DIVERGENCE_DISPOSITIONS` — one written disposition per diverging call site, bound to the census in BOTH directions, plus the one site a syntax-tree census cannot see"
  - "a cross-file fallback ban over the owner authority's derived call-site set, with its cardinality asserted"
  - "two ledger floors that CAN fail, replacing an equality that could not, each watched failing against a confirmed mirror"
  - "rows 15 and 16 of `docs/audit/harness-false-result-instances.md`, both ordinals read off the table"
affects: [31-41, phase-31-verification-round-9, context-io, compactor, check-uat-oracles, check-platform-shapes]

actuals:
  tokens: 78000
  tasks: 3
  commits: 4
  plan_head_before: 23f6348ab20b1b560a6169b31c0bdc0ea62b2084

tech-stack:
  added: []
  patterns:
    - "A census over BOTH arguments of one call, because two Criticals at two coordinates were one defect on two different parameters"
    - "An axis assembled beside another axis, never FROM it: the sibling's exclusion is recorded and deliberately not consumed, with the finding it would have deleted named in the docstring"
    - "A kind vocabulary held as a runtime constant with the type derived from it, so `closed at three` is a fact a test can read rather than a union only a compiler sees"
    - "A register entry's reason QUOTES its site, and the quotation is checked: every backticked span over 40 characters must occur verbatim in the file the entry's site names"
    - "A boundary a derivation cannot reach gets a COORDINATE (`visible_to_census: false`), not a category"

key-files:
  created:
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-40-task1-red.json
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io-writer-set.test.ts
    - scripts/harness-instance-ledger.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - docs/audit/harness-false-result-instances.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-40 (1): TWO axes, because CR-26 and CR-27 are one defect on two different arguments. A census over one argument would have found one and reported green over the other."
  - "D-40 (2): the entry points AND their argument positions are derived from context-io.ts's own declarations — 31-39 moved both positions, and typed indices would have read the wrong argument while staying green."
  - "D-40 (3): the sibling order axis's tail-delegation exclusion is deliberately ABSENT, with CR-27 named in the derivation's docstring and the fall-through asserted PRESENT as a member."
  - "D-40 (4): the kind vocabulary is closed at three by a runtime constant the type is made of; `derived-and-refusing` is deliberately unoccupied on this tree, with the reason written."
  - "D-40 (5): this tree measured 78 sources, 4 entry points, 10 call sites, 2 divergences, 3 register entries, 3 authority call sites — recorded as measured, not as expected."
  - "D-40 (6): IN-21's equality is REMOVED rather than repaired; the review's `all rows name evidence` mirror reproduces the live reading (no-evidence count is already 0), so the mirror is written in the direction that moves."
  - "D-40 (7): both carried harness false results become rows; the self-inflicted one is judged a row from its PREMISE rather than its verdict, with the alternative reading written into the ledger's notes."

requirements-completed: []

coverage:
  - id: D1
    description: "The dial-argument and ledger-argument census — derived from `git ls-files` across 78 tracked `.ts` sources, members and cardinality asserted separately, with the file count and site count floored before any membership claim"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#PREMISE: the corpus was listed, the entry points parsed, and the walk found call sites"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the census has the expected MEMBERS"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the census has the expected COUNT, asserted separately from the membership"
        status: pass
    human_judgment: false
  - id: D2
    description: "The tail-delegation exclusion that would have deleted CR-27's own coordinate is deliberately absent, and `promoteAdmitted`'s fall-through is asserted present on the ledger axis"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the LEDGER axis keeps the tail delegation the sibling order axis drops — CR-27's coordinate"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every divergence carries a disposition from a vocabulary closed at three members, bound to the census in BOTH directions, with each reason quoted verbatim from its own site"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#DIRECTION 1: every DIVERGING census site has a register entry, looked up by handle"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#DIRECTION 2: every census-visible register entry names a site the census still finds"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the kind vocabulary is CLOSED at three members, by a constant the type is derived from"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#every entry's REASON quotes its own site's file rather than paraphrasing it"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the one-half-action claim is MEASURED, not asserted: an ungoverned root keeps no ledger"
        status: pass
    human_judgment: false
  - id: D4
    description: "The fallback shape that produced CR-26 is banned over the derived authority call-site set with its cardinality, cross-file rather than module-local, and watched failing"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the authority's call sites are derived over the corpus, by MEMBERS and by COUNT"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#NOT ONE of them is the operand of a nullish, logical-or or conditional default"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#a mirror RESTORING a default at one authority call site turns the ban RED"
        status: pass
    human_judgment: false
  - id: D5
    description: "The walk starts at the SOURCE FILE, proven by three seeded scope mirrors plus a top-level control and a dispositionless-divergence mirror — five in all, each anchored and each confirmed different from the live source"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the top-level CONTROL: a seeded top-level writer moves the count by exactly one"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#WR-27 (a): a seeded writer inside an ARROW moves the count by exactly one"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#WR-27 (b): a seeded writer inside a CLASS METHOD moves the count by exactly one"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#WR-27 (c): a seeded writer inside a NON-TOP-LEVEL BLOCK moves the count by exactly one"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#a mirror adding a DIVERGING call site with no register entry turns the disposition case RED"
        status: pass
    human_judgment: false
  - id: D6
    description: "IN-21's by-construction partition replaced by a floor and a ceiling, both sides measured at run time from the parsed rows, each watched failing against a confirmed mirror"
    requirement: UATX-04
    verification:
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#every MECHANISM a row claims is greppable in the evidence that row itself names"
        status: pass
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#a mirror with EVERY row's path citations stripped turns the new FLOOR red"
        status: pass
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#a mirror with a MAJORITY of rows stripped turns the new CEILING red"
        status: pass
    human_judgment: false
  - id: D7
    description: "Both harness false results round 8 handed forward are dispositioned as rows 15 and 16, ordinals read off the table, every claimed mechanism substantiated by the gate rather than by reading"
    requirement: UATX-04
    verification:
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts#the tracked list exists and its ordinals are contiguous from one, with no duplicate"
        status: pass
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#every MECHANISM a row claims is greppable in the evidence that row itself names (checked count 11 -> 17)"
        status: pass
    human_judgment: false

duration: "2h 5m"
completed: 2026-09-13
---

# Phase 31 Plan 40: The Root-Argument Census Summary

The set of places a write path can aim the governance dial or the audit record somewhere other than
the answer its own inputs derive is now DERIVED from source across the repository's 78 tracked `.ts`
files, COUNTED, and DISPOSITIONED from a vocabulary closed at three members — so a ninth recurrence
of the `CR-26`/`CR-27` family cannot land in silence.

## What this plan is answering

`31-VERIFICATION.md` round 8's THIRD `missing:` bullet: *"a derived test enumerating every call site
that supplies `appendNote`'s `repoRoot` argument from a value other than the caller's own trusted
root … so a future third write-both route … cannot reopen this class silently a ninth time"*. Plan
`31-39` closed the two COORDINATES round 8 measured. This plan closes the CLASS. It also
dispositions the two harness false results `31-38`'s own deferred record handed to this round by
name.

## Accomplishments

### The census — two axes, because two Criticals were one defect on two arguments

`deriveRootArgumentSites` parses each tracked source and walks from the **SourceFile**, carrying the
nearest named enclosing scope, collecting every call whose callee resolves to a write-path entry
point of `scripts/context-io.ts`. For each call it records the expression supplied at the DIAL
position, at the STORE position and at the LEDGER position, plus whether the call is the whole
expression of a `return`.

**Everything about the alphabet is derived.** A write-path entry point is an exported function taking
BOTH a governance-dial parameter and a destination-store parameter — which admits `admit`,
`admitAndAppend`, `appendNote`, `promoteAdmitted` and excludes `readGovernanceConfig`, a pure reader
that takes a dial root and writes nothing. The argument POSITIONS are derived too: `31-39` moved
both (a seventh parameter on `appendNote`, a fifth on `admit`), and a census carrying hand-written
indices would have read the wrong argument while staying green — this repository's second named
failure class arriving inside the axis built to close it.

**Alias resolution is load-bearing, not decoration.** `scripts/compactor.ts` imports the re-binding
route as `ctxPromoteAdmitted`; and — the sharper case — `scripts/canonical-frontmatter.ts` exports an
unrelated function ALSO called `admit`, which four tracked sources call. A name-matching search would
have enrolled every one of them in a census about governance roots they have nothing to do with.

**The tail-delegation exclusion is deliberately ABSENT.** The sibling note-then-ledger ORDER axis
excludes a note write that is the whole expression of a `return`, correctly, because on that path no
ledger work in the enclosing function runs at all. `promoteAdmitted`'s fall-through IS that shape and
IS the line `CR-27` was filed on. The flag is RECORDED so a reader can see the shape and never
consumed as an exclusion; the absence is stated in the derivation's own docstring with `CR-27` named,
and a case asserts the fall-through present as a member.

### Measured on this tree

| Reading | Value |
|---|---|
| tracked `.ts` sources scanned (tests and `.d.ts` excluded) | **78** (floor 70, asserted before any membership claim) |
| write-path entry points derived | **4** — `admit`, `admitAndAppend`, `appendNote`, `promoteAdmitted` |
| census call sites | **10** |
| divergences | **2**, both on the DIAL axis, both in the Tier-1 oracle |
| register entries | **3** (2 census-visible + 1 the census cannot see) |
| owner-authority call sites | **3**, none an operand of a default expression |

The ten members:

| Handle | Dial | Ledger |
|---|---|---|
| `scripts/admission-server.ts::handleProposeNote#admitAndAppend@1` | `repoRoot` → `trustedRepoRoot()` — agrees | absent |
| `scripts/check-uat-oracles.ts::equivDoWork#appendNote@1` | `governanceRoot` — **DIVERGES** | absent |
| `scripts/check-uat-oracles.ts::equivDoWork#appendNote@2` | `governanceRoot` — **DIVERGES** | absent |
| `scripts/compactor.ts::promote#appendNote@1` | absent | absent |
| `scripts/compactor.ts::promoteAdmitted#promoteAdmitted@1` | absent | absent |
| `scripts/compactor.ts::reVerify#admit@1` | absent | absent |
| `scripts/context-io.ts::<module>#admit@1` | `admitRoot` → `trustedRepoRoot()` — agrees | absent |
| `scripts/context-io.ts::admitAndAppend#admit@1` | `repoRoot` (own param) | `actionOwner` → `actionOwnerRoot(contextRoot)` |
| `scripts/context-io.ts::appendNote#admit@1` | `repoRoot` (own param) | `ledgerOwner` (own param) |
| `scripts/context-io.ts::promoteAdmitted#appendNote@1` | `repoRoot` (own param) | `destinationOwner` → `actionOwnerRoot(to)` — **CR-27's coordinate, tail delegation, present** |

`scripts/context-io.ts::<module>#admit@1` is the CLI `admit` verb, which lives inside the
`if (isMain)` entry block. The walk shape `WR-27` closed is therefore not hypothetical here: a
top-level-function-only walk would have missed a production call site that exists on this tree today.

### The register, and the vocabulary closed at three

`ROOT_DIVERGENCE_KINDS` is a runtime constant and `RootDivergenceKind` is
`(typeof ROOT_DIVERGENCE_KINDS)[number]`, so the compiler and the test read ONE object; the census
asserts the cardinality AND that the type is still made of the constant. A fourth kind cannot be
filed, which is the point.

| Id | Site | Kind | Visible |
|---|---|---|---|
| `RD-31-40-01` | `scripts/check-uat-oracles.ts::equivDoWork#appendNote@1` | `one-half-action` | yes |
| `RD-31-40-02` | `scripts/check-uat-oracles.ts::equivDoWork#appendNote@2` | `one-half-action` | yes |
| `RD-31-40-03` | `scripts/check-platform-shapes.ts::writeContextDriver#appendNote@text` | `published-residual` | **no** |

Both oracle entries QUOTE their own call-site comments rather than paraphrasing them, and the
quotation is checked: every backticked span over 40 characters in an entry's reason must occur
verbatim in the file its site names. The `one-half-action` claim is MEASURED rather than asserted —
a case reads `readGovernanceConfig(<fresh temp dir>).config.audit_retention` and asserts it is not
`retained`, so "this action writes no audit record" is a fact read off the module rather than a
sentence in a register.

`derived-and-refusing` is unoccupied on this tree, deliberately: both write-both routes derive and
refuse, but from their OWN inputs, so they are not divergences and need no entry.

### The five confirmed mirrors

Each is anchored, each asserts its anchor occurs exactly once before substitution, and each is
confirmed different from the live source before any result is read.

| Mirror | Before | After |
|---|---|---|
| top-level control (`seededTopLevelWriter`) | 10 sites | 11 |
| arrow function (`seededArrowWriter`) | 10 sites | 11 |
| class method (`seededMethodWriter`) | 10 sites | 11 |
| non-top-level block (`<module>`) | 10 sites | 11 |
| restored `\|\|` fallback at `actionOwnerRoot(to)` | offender set `[]` | exactly `scripts/context-io.ts::promoteAdmitted#actionOwnerRoot@1` |
| dispositionless divergent site | divergences 2, unregistered `[]` | divergences 3, unregistered exactly the seeded handle |

### IN-21 — a floor that can fail

The assertion the review named compared three terms that PARTITION the row set by construction, so it
held for every possible input including the ones the file exists to reject. It is REMOVED rather than
repaired: the property it reached for is already true of the counting authority by construction.

What replaced it, both sides measured at run time from the parsed rows with no typed numeral as an
expected value:

- **FLOOR** — substantiated mechanism claims must exceed the rows making no checkable claim at all.
  Live reading after this plan: **17 > 8**. Fails on a table growing mostly by rows citing nothing.
- **CEILING** — at most half the rows may name no readable evidence. Live reading: **0 of 16**.

A single counting authority (`tally`) now serves the live ledger and both mirrors, and `readRows`
takes its text, so the mirrors go through the same parser rather than a second one.

### Rows 15 and 16 of the harness-false-result ledger

Both ordinals READ OFF the table. Row 15's raising record claimed **15** and the table offered
**15**; the agreement is PRINTED in the row's own column rather than assumed, because a column that
only ever shows agreement is a column nobody would notice going wrong. No prior record was edited.

Row 16 is the self-inflicted one, and round 8's record offered the reading that a harness measuring
its own residue is not a false premise about the subject. The judgement taken is that it IS a row,
argued from the PREMISE rather than the verdict: the harness's premise was *"the `.temp` tree I am
reading belongs to the subject"*, and that premise was false. The alternative reading is written into
the ledger's notes, so the next reader disagrees with an argument rather than with a silence.

Every mechanism the two rows claim in backticks is greppable in the evidence they themselves cite —
the checked count rose **11 → 17** and the ordinals are contiguous 1..16, both verified by the gate
rather than by reading.

## Task-by-task

| Task | Commit | What landed |
|---|---|---|
| 1 (RED) | `a5dedf7` | the census, the classification, the fallback ban and the five mirrors — 8 failed / 183 passed, every failure naming the register the GREEN step adds |
| 1 (GREEN) | `7da502c` | `ROOT_DIVERGENCE_KINDS`, `RootDivergenceKind`, `RootDivergenceDisposition`, `ROOT_DIVERGENCE_DISPOSITIONS`; `hooks/hook-entry` regenerated |
| 2 | `38cf20d` | IN-21's equality removed; the floor, the ceiling, the `tally` authority and the two mirrors |
| 3 | `217c893` | ledger rows 15 and 16 with the notes; the `D-40` decision body |

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **66 files passed, 4285 passed, 2 skipped, exit 0** |
| `npm run build && npm run typecheck` | exit 0 |
| `npm run check:build-parity` | PASS — no tracked build output moved |
| `npm run freshness` | PASS |
| `npm run check:audit-register` / `check:residual-citations` / `check:claim-anchors` | PASS |
| `npm run check:public-docs` / `check:banned-claims` / `check:imperative-lexicon` / `check:nul-bytes` | PASS |
| `npm run check:platform-shapes` | PASS |
| `npm run generate:safety-surface`, `freshness:traceability`, `freshness:context` | PASS |
| `npm run check:diff-disposition` | **pre-existing FAIL, UNMOVED at 78 findings over 39 elements** — identical to `31-39`'s measurement; this plan touched no watched kit markdown |

Test count moved **4262 → 4285** (+23: 22 census cases, plus the IN-21 mirrors net of the removed
assertion).

## Deviations from Plan

### 1. [Rule 3 — Blocker] `hooks/hook-entry`'s pinned module hash went stale

- **Found during:** Task 1 GREEN, at the first full-suite run after the register landed.
- **Issue:** `hooks/hook-entry.ts` carries a manifest pinning a SHA256 per module in each decider's
  closure, and `scripts/context-io.js` is in that closure. Changing it turned the hook fail-closed,
  which cascaded into **33 failures across 5 files** — 27 in `hooks/guard.test.ts`, 2 in
  `scripts/context-io.test.ts`, 1 in `scripts/check-platform-shapes.test.ts`, 2 in
  `scripts/uat-gate-exit-contract.test.ts`, and the one in `scripts/floor-invariance.test.ts` that
  NAMED the cause (`hooks/admission-guard.js's manifest carries a stale hash for
  scripts/context-io.js`).
- **Fix:** `npm run generate:hook-manifest` — 2 deciders, 26 module hashes. Not one assertion was
  touched or weakened: all 33 were one stale hash read 33 ways.
- **Files modified:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** the next full run fell to a single failure, which was the working-tree
  cleanliness case (`hooks/hook-entry.ts has no uncommitted modification`) — it cleared on commit.
- **Commit:** `7da502c`

### 2. [Recorded, not auto-fixed] The IN-21 ceiling mirror is written in the opposite direction

- **Found during:** Task 2.
- **Issue:** the review's remedy names a mirror *"whose rows all name evidence"* to move the
  ceiling's reading. On this tree **every row already names evidence** — the live no-evidence count
  is **0**, asserted as the mirrors' own anchor — so a mirror in that direction reproduces the live
  reading exactly and moves nothing.
- **Fix:** the mirror is written in the direction that MOVES: a majority of rows stripped of their
  citations, which takes the no-evidence count 0 → 14 and turns the ceiling red. The substitution and
  its measurement are written into the case's own comment and into `D-40 (6)` rather than left as an
  unexplained difference from the remedy.
- **Commit:** `38cf20d`

### 3. [Recorded] Commits were made on `main`

- The executor's generic pre-commit assertion treats the resolved default branch as protected. This
  project sets `git.branching_strategy: "none"` and `workflow.use_worktrees: false`, the orchestrator
  dispatched this plan explicitly as *"a SEQUENTIAL executor agent on the main working tree (branch
  `main`)"*, and all 39 prior plans of this phase committed to `main`. No drift occurred: `main` is
  the configured and intended target. `.planning/config.json` was NOT modified to add an override —
  changing a user's configuration to silence a guard is not a fix.

## Authentication Gates

None.

## TDD notes

Task 1 ran a real RED→GREEN: the census axis was committed FIRST (`a5dedf7`) and failed **8 of 191**
cases, every failure naming `ROOT_DIVERGENCE_KINDS` or `ROOT_DIVERGENCE_DISPOSITIONS` as undefined,
while the entire census derivation — corpus premise, members, cardinality, the `CR-27` member, the
divergence set, four scope mirrors and the fallback ban — passed. That is an intentional RED on the
planned behaviour, not a load failure, a syntax error or a zero-discovery run. Evidence:
`.planning/phases/31-autonomous-manual-testing/red-evidence/31-40-task1-red.json`.

**The RED gate itself could not be used, and that is recorded rather than worked around.**
`gsd_run check tdd-red-evidence` returned `INVALID_RED (zero_tests_discovered)` on the transcript.
Measured, not assumed: the gate's parser is `parseNodeTestSummary`, which reads node:test's
`# tests / # pass / # fail` TAP summary lines; `npx vitest run --reporter=tap` emits none
(`grep -c '^# tests'` over the transcript = **0**), so the classifier fail-closes before it can look
at the target test. No verdict was fabricated. This plan's type is `execute` and `TDD_MODE` was
false, so that gate is not the authorizing gate for GREEN here.

Task 2's subject is entirely a test-file assertion, so it has no production half to make green; its
RED/GREEN discipline is carried by the two mirrors, each watched turning its assertion red.

## Known Stubs

None.

## Threat Flags

None. This plan adds no branch, no refusal, no parameter and no network, file or auth surface: it
adds an enumeration, a register of written dispositions, and two documentation rows.

## What this plan leaves OPEN, with a reason and what would force it closed

| Open item | Why it is open | What would force it closed |
|---|---|---|
| `RD-31-40-03` — the write-path call `check-platform-shapes` assembles as module TEXT | A syntax-tree census sees calls that are CODE. This one is a string at rest, and no AST walk over this repository will ever report it. | The driver becoming a committed fixture module the gate imports, or a second census that parses the assembled text as TypeScript before it is written — a parser this repository does not have and should not grow for one site. |
| The census resolves bindings ONE HOP, in source order | `const repoRoot = trustedRepoRoot();` above a call is the production shape and resolving it keeps the register free of entries for sites that agree. A value assembled through two bindings reads as a divergence and must earn an entry — the safe direction for a default. | A real site whose agreement is only expressible through two hops. It would arrive as a red DIRECTION 1, which is the intended way to learn it. |
| The register names REPOSITORIES, not trustworthy ones | Unchanged from `D-31` / `D-39`: an agent that can `mkdir` a version-control marker and a readable configuration can construct one. | Carried as `T-31-18-01` / `T-31-39-04`; out of scope for an enumeration. |
| `derived-and-refusing` is an unoccupied kind | No site on this tree derives its own root AND refuses while diverging from its caller's trusted root. Naming it now is cheaper than inventing a name under the pressure of a round that has already found the site. | A site of that shape landing. |
| The Windows leg | `R-03`, this phase's standing remainder, unchanged. | A Windows CI leg. |
| `check:diff-disposition` at 78 findings over 39 elements | Pre-existing, recorded across `31-31`…`31-39`, unmoved by this plan. Every finding names a clause in a file this plan did not touch. | Its own plan; the base commit must not be moved forward, because that clears the finding by deleting its evidence. |
| `31-38`'s two other carried items — the `D-33 (2)` coverage predicate's over-inclusion, and the `31-REVIEW.md` fenced-heading scanning rule | Named by `31-38` with owners; neither is a harness false result, so neither is in this plan's Task 3 scope. | Carried forward unchanged in `deferred-items.md`, named here so they are not lost between rounds. |

## What this plan does NOT claim

- **It does not flip a requirement.** `UATX-01` through `UATX-06` remain UNCHECKED in
  `.planning/REQUIREMENTS.md`, every traceability row still reads `Gaps Found`, and the Phase 31
  checkbox in `.planning/ROADMAP.md` is still unchecked — both files verified **byte-unchanged** by
  this plan. Only a verification round may change that, and this phase has now had eight rounds in
  which the executing round believed it had closed one.
- **It does not close `CR-26` or `CR-27`.** `31-39` did. This plan makes a ninth recurrence of their
  class visible, which is a different claim and a weaker one.
- **A green census is not proof that no such defect exists.** It is proof that a defect of this shape
  at a call site the census can see must carry a written disposition to ship.

## Next

Ready for `31-41`.

## Self-Check: PASSED

- `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io-writer-set.test.ts`,
  `scripts/harness-instance-ledger.test.ts`, `hooks/hook-entry.ts`, `hooks/hook-entry.js`,
  `docs/audit/harness-false-result-instances.md`, `31-CONTEXT.md` and
  `red-evidence/31-40-task1-red.json` all present on disk.
- All four commits present: `a5dedf7`, `7da502c`, `38cf20d`, `217c893` —
  `git rev-list --count 23f6348..HEAD` = **4**, MEASURED at the instrument point the protocol
  defines: SUMMARY-write time, before this file's own commit. A reader re-running the same command
  AFTER that commit gets **5**, and the difference is this commit, not a discrepancy — the
  instrument point is stated so the two readings can be told apart rather than reconciled by
  preference.
- Full suite re-run at the final tree: 66 files, 4285 passed, 2 skipped, exit 0.
