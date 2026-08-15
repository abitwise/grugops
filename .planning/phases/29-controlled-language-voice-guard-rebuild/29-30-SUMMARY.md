---
phase: 29-controlled-language-voice-guard-rebuild
plan: 30
subsystem: tooling
tags: [typescript, safety-surface, claim-registry, d18-union, gap-closure, adversarial]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "plan 29-28's fence-aware readRegistry and its parse tally — the registry arm cannot be pinned until the parse that produces it is trustworthy"
provides:
  - "check-audit-register equality four — the REGISTRY arm of the D-18 union pinned in BOTH directions at the source: a derived containment for the ADD direction, a two-sided per-kind cardinality for the REMOVE direction, and a two-sided CLAIM->HOME roster for the direction a cardinality is structurally blind to"
  - "SAFETY_CLAIM_HOMES — the one authority for the safety arm's membership AND its size; CLAIM_KIND_CARDINALITY's safety entry is derived from its length"
  - "registryArmFindings — a pure, exported predicate that never returns at the first defect, so its source-level floors (the SUM and the CLAIM_KINDS coverage) are drivable without perturbing a compiled constant"
  - "check-diff-disposition's residue partition — the union's markdown residue is a set of assertions with sources, replacing a sentence that described it; the containment pin's early return is removed so both arms speak in one run"
  - "the uncounted `safety_surface: yes` protocol row is watched by a named refusal — a hole neither containment nor equality three could cover"
affects: [29-32, LANG-03, audit-register, diff-disposition, safety-surface]

actuals:
  tokens: 96000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A COUNT is blind to MEMBERSHIP by construction: pair a cardinality with a roster keyed by the source's own primary key, or a count-preserving move passes every equality written over it"
    - "A gate that returns at its first corpus-level defect cannot report a two-arm narrowing as two defects; collect every finding, then return once"
    - "When a baseline and its test fixture describe the same set, write the fixture as literals and pin it against the baseline in a case of its own — a fixture DERIVED from the baseline follows it everywhere it moves and every perturbation probe measures nothing"
    - "A vouching set that fails CLOSED when short (more strays, not fewer) can be consumed without its own cardinality pin — state the direction at the site rather than adding a second floor"

key-files:
  created: []
  modified:
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.test.ts
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.test.ts
    - scripts/generate-safety-surface.test.ts

key-decisions:
  - "The registry arm is derived from readRegistry, never by parsing safetySurfaceUnion's rendered reason sentence — a rendered sentence is a presentation detail and a check that parses one is a second grammar over a third artifact"
  - "REGISTRY_ARM_NON_MARKDOWN is used in the ADD direction ONLY. A two-sided pin there would be a second, weaker duplicate of the per-kind cardinality, which owns the REMOVE direction alone"
  - "The plan's stated consumer equality (residue == the registry arm's markdown members) is FALSE on the live tree and would have been vacuous besides; it is implemented as a partition with two independently-sourced parts"
  - "SAFETY_CLAIM_HOMES was added beyond the plan, and it partially adopts the alternative the plan named as refused. The mandated adversarial pass MEASURED a bypass a cardinality cannot see; the distinction and the evidence are recorded in full below"
  - "The consumer's refusal states what it CANNOT name and points at the source gate, rather than implying it measured more than it did"

patterns-established:
  - "Ask which DIMENSION the predicate measures, not only which arm. Two pins covering one arm read as coverage — and so do two pins covering one arm's CARDINALITY while its MEMBERSHIP moves freely underneath them."

requirements-completed: []

coverage:
  - id: D1
    description: "The REGISTRY arm's ADD direction: a `kind: safety` claim naming a markdown file no derivation vouches for is a named refusal, and a non-markdown one outside the declared member is a different named refusal"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:692 — REDs a STRAY `kind: safety` row whose home NO derivation vouches for — a DIFFERENT defect"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:718 — REDs an UNDECLARED non-markdown safety claim, naming the file and the declared member"
        status: pass
    human_judgment: false
  - id: D2
    description: "The REGISTRY arm's REMOVE direction by cardinality: a one-cell `kind:` flip is a named refusal, falsifiable for EVERY declared kind, with the baseline's own SUM and coverage floors proven"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:660 — REDs a ONE-CELL `kind: safety` flip, naming the kind — round 3's exact WR-06 recipe"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:731 — THE PER-KIND PIN IS FALSIFIABLE FOR EVERY DECLARED KIND, not for one of them"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:873 — DELETING a kind from the declared map REDs on the SUM floor, naming the shortfall"
        status: pass
      - kind: other
        ref: "the pre/post hermetic-mirror reproduction below — union 41 -> 40 and both gates exit 0 under the PRE build; check-audit-register exits 1 under the POST build naming both kinds"
        status: pass
    human_judgment: false
  - id: D3
    description: "The REMOVE direction a cardinality is structurally blind to: a count-preserving REHOME of a safety claim is a named refusal, reported as CLAIM->HOME pairs"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:624 — REDs a REHOMED safety claim — the count-preserving move a cardinality is BLIND to"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:611 — the LIVE registry's safety arm equals the declared roster, in BOTH directions"
        status: pass
      - kind: other
        ref: "the B8 adversarial transcript below — seven gates exit 0 against the cardinality-only build, check-audit-register exits 1 against the closed build on the same bytes"
        status: pass
    human_judgment: false
  - id: D4
    description: "The union's markdown residue is asserted at the consumer: partitioned, both directions, with the descriptive sentence removed and its removal grepped"
    requirement: LANG-03
    verification:
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:1954 — REDs round 3's ONE-CELL `kind: safety` flip — from a DIFFERENT equality than the source's"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2010 — REDs a residue member NO safety claim and NO uncounted row vouches for — the other direction"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2070 — REDs the LONG direction — a NEW `kind: safety` claim widening the arm is a red too"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2094 — REDs the UNCOUNTED protocol row flipped `yes` -> `no` — a hole no other gate covers"
        status: pass
      - kind: other
        ref: "`node scripts/check-diff-disposition.js | grep -ac 'are public documents'` returns 0; the PASS line publishes 36 + 3 + 1 = 40"
        status: pass
    human_judgment: false
  - id: D5
    description: "A vacuous registry ARM is a named refusal in BOTH gates, at the granularity the flip operates at rather than only at the empty-union granularity"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:753 — REDs a VACUOUS registry arm — zero `kind: safety` rows is a named refusal, not an empty-set pass"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2041 — REDs a VACUOUS registry arm — zero `kind: safety` rows is a NAMED refusal here too"
        status: pass
    human_judgment: false
  - id: D6
    description: "The BOTH-ARMS probe: one cell of EACH arm moves at once and BOTH are named, with the finding COUNT asserted and shown rejecting an early-returning gate's output"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:767 — THE BOTH-ARMS PROBE: one cell of EACH arm moves at once, and BOTH are named"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2153 — THE BOTH-ARMS PROBE: one cell of EACH arm moves in one commit, and BOTH are named"
        status: pass
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:889 — the predicate reports EVERY defect it finds — it never returns at the first one"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every planted case asserts its own premise, and each premise assertion is SHOWN failing once against a no-op plant"
    requirement: LANG-03
    verification:
      - kind: unit
        ref: "scripts/check-audit-register.test.ts:804 — EVERY PREMISE ABOVE IS SHOWN FAILING on a no-op plant — a vacuous plant proves nothing"
        status: pass
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts:2128 — EVERY PREMISE ABOVE IS SHOWN FAILING on a no-op plant — a vacuous plant proves nothing"
        status: pass
    human_judgment: false
  - id: D8
    description: "The residual this plan does not close: which claims are SAFETY claims remains an editorial classification with no derivation, so the roster and the cardinality are measurement baselines rather than derived sets"
    requirement: LANG-03
    verification:
      - kind: other
        ref: "the Recorded Residuals table below, with the live reachability of each and the named condition under which each baseline goes stale"
        status: pass
    human_judgment: true
    rationale: "Whether an editorial column may legitimately rest on a hand-declared, fail-closed baseline is a human judgment. D-25 gives that shape standing for roleCeiling(); this plan applies the same argument to the registry's `kind` column and to the safety arm's roster, and records rather than hides that no derivation exists."

duration: 90min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 30: Both arms of the D-18 union pinned — and the dimension a cardinality could not see

**Round 2 pinned the D-18 union twice and both pins landed on the REGISTER arm, so flipping one `kind:` cell dropped `README.md` from the exclusion list with every gate green. The registry arm now has an equality in both directions at the source and a partitioned residue assertion at the consumer — and the mandated adversarial pass against that fix found a second, count-preserving bypass of the same class, which is closed in the same plan.**

## Performance

- **Duration:** ~90 min
- **Tasks:** 3
- **Files modified:** 5 (+ 2 committed `.js`)

## Accomplishments

- **WR-06 reproduced pre/post, both gates.** Under the PRE build: union 41 -> 40, `README.md` leaves, `check-audit-register` and `check-claim-anchors` both exit 0, and `check-diff-disposition` prints a green `the union's remaining 3 markdown entr(ies) are public documents` over a corpus that had silently lost a member. Under the POST build both ends red, from two different equalities.
- **The registry arm is pinned in three dimensions, not one.** Membership is vouched by derivation (layer one), cardinality is baselined two-sided with its own SUM and coverage floors (layer two b), and the arm's CLAIM->HOME roster is set-equal two-sided (layer two a).
- **A second bypass, found by attacking my own fix, is closed in the same plan.** A count-preserving REHOME defeated the cardinality AND the consumer's residue count while removing `README.md` from the exclusion list, with **all seven gates green**. Measured, not argued.
- **A hole nobody had named is closed as a by-product.** Flipping the UNCOUNTED protocol row's `safety_surface` to `no` removed the role-switch protocol's admission text from the watched corpus with every gate green — containment cannot cover it (it is not a derived kit file) and equality three constrains only counted rows.
- **The gate publishes numbers a reader can reconcile by hand.** `36 + 3 + 1 = 40`, printed on every green run, replacing a sentence about the residue that nothing checked.

## Task Commits

1. **Task 1 (TDD): equality four — the registry arm pinned in both directions, at the source** — `834af9b`
2. **Task 2 (TDD): the union's residue is asserted, not described** — `8c2babc`
3. **Task 3 (TDD): the harness cases, the BOTH-ARMS probe, and the rehome closure** — `b925091`

## Files Created/Modified

- `scripts/check-audit-register.ts` — `SAFETY_CLAIM_HOMES` (:194), `CLAIM_KIND_CARDINALITY` (:236, safety entry derived from the roster's length), `REGISTRY_ARM_NON_MARKDOWN` (:264), the pure `registryArmFindings` (:300), and equality four wired into `runAll` (:594) with the arm's size published in the PASS line
- `scripts/check-audit-register.test.ts` — the mirror registry rebuilt to the live 42-claim shape and the live roster; 12 new cases
- `scripts/check-diff-disposition.ts` — `RESIDUE_FROM_REGISTRY_COUNT` (:1403) and the residue partition (:1548); the containment pin's early return removed so both arms report in one run
- `scripts/check-diff-disposition.test.ts` — 8 new cases including the BOTH-ARMS probe and the no-op-plant premise demonstration
- `scripts/generate-safety-surface.test.ts` — its mirror follows the same live shape (Rule 3; see Deviations)

---

## LANG-03's three enumerated `missing:` items

| # | `29-VERIFICATION.md` item | Landed artifact | The case that pins it |
|---|---|---|---|
| 1 | "Pin the REGISTRY arm the way the register arm is pinned: derive the `kind: safety` claim files and compare them two-sided against a declared set … and publish the count — the gate's `the union's remaining N markdown entr(ies) are public documents` line is a description of the residue, not a check on it" | `check-audit-register.ts:194-455` (equality four: roster + cardinality + derived containment, all two-sided, arm size published) and `check-diff-disposition.ts:1403,1548-1650` (the residue partition; the descriptive sentence deleted) | `check-audit-register.test.ts:624,660,692,718,731,753,873` and `check-diff-disposition.test.ts:1934,1954,2010,2041,2070,2094` |
| 2 | "Make `readRegistry`'s heading scan fence-aware … so documentation cannot enter the exclusion list as live data" | **Closed by plan 29-28**, commits `3a16647` / `f3f85ee` / `ec47fda` / `a6e7a82`. NOT re-implemented here — round 3's brief refuses two competing repairs of the same lines. | `scripts/audit-model.test.ts` (20 cases landed by 29-28) |
| 3 | "Add a harness case that flips one `kind: safety` cell in a registry mirror and requires exit 1 — the register-arm equivalent already exists in both gates and is the pattern to copy" | Permanent cases in BOTH gates, plus the stray twin, the vacuity twin, the LONG direction, and the BOTH-ARMS probe neither single-arm harness could produce | `check-audit-register.test.ts:660,767` and `check-diff-disposition.test.ts:1954,2153` |

---

## The RED-first transcripts

Written before the fixes and run against the committed (pre-fix) build.

**Task 1** — 12 cases red, of which four are assertion failures against real shipped behaviour rather than unresolved imports:

```
 FAIL  ... > REDs a ONE-CELL `kind: safety` flip, naming the kind — round 3's exact WR-06 recipe
AssertionError: expected +0 to be 1 // Object.is equality
 FAIL  ... > REDs a STRAY `kind: safety` row whose home NO derivation vouches for — a DIFFERENT defect
AssertionError: expected +0 to be 1 // Object.is equality
 FAIL  ... > REDs a VACUOUS registry arm — zero `kind: safety` rows is a named refusal, not an empty-set pass
AssertionError: expected +0 to be 1 // Object.is equality

 Tests  12 failed | 25 passed (37)
```

The remaining eight red as unresolved imports of symbols that did not exist yet (`CLAIM_KIND_CARDINALITY`, `registryArmFindings`). That is the weaker RED and it is recorded as such.

**Task 2** — five cases red, four of them assertion failures against shipped behaviour:

```
     × the CONTROL — an unflipped mirror exits 0 and PUBLISHES three reconcilable numbers
     × REDs round 3's ONE-CELL `kind: safety` flip — from a DIFFERENT equality than the source's
     × REDs a residue member NO safety claim and NO uncounted row vouches for — the other direction
     × REDs a VACUOUS registry arm — zero `kind: safety` rows is a NAMED refusal here too
     × THE BOTH-ARMS PROBE: one cell of EACH arm moves in one commit, and BOTH are named

AssertionError: expected '…' to contain '3 from the registry arm'
AssertionError: expected +0 to be 1        (x3)
AssertionError: expected 1 to be greater than or equal to 2
```

That last line is the T-29-30-05 shape measured on the shipped gate: on a mirror where BOTH arms had moved, the pre-fix gate printed **one** finding.

---

## ADVERSARIAL SELF-REPRODUCTION — round 3's WR-06 recipe, pre and post

Hermetic mirrors built with `git archive HEAD | tar -x`, never the live tree. The mutation is round 3's exactly: flip `C-28-001`'s `kind: safety` to `kind: architecture` (one cell, line 69 of the registry), then regenerate the exclusion list as an author naturally would.

```
PREMISE OK: flipped line 69 of the registry, C-28-001 kind safety -> architecture

=== PRE build (hermetic mirror of HEAD = 0ec8b61) ===
  union = 40                            (clean mirror measured first: 41)
  README.md in union?  false
  generate-safety-surface   exit=0      Wrote … 40 entries.
  check-audit-register      exit=0      PASS  equality one holds … equality three holds … equality two holds …
  check-claim-anchors       exit=0      ALL CHECKS PASSED

=== POST build, the SAME mutated tree ===
  premise: post build carries equality four x8
  premise: registry line 69 = "- kind: architecture"
  union = 40
  check-audit-register      exit=1
  FAIL  equality four (kind cardinality): 2 claim kind(s) disagree with the declared measurement
        baseline — architecture declares 28 but the registry carries 29; safety declares 6 but the
        registry carries 5.
  check-claim-anchors       exit=0      (unchanged — it never had an opinion about `kind`)
```

Round 3's numbers reproduce byte for byte: **41 -> 40**, `README.md` gone, both gates green under the pre build.

### The same flip AT THE CONSUMER

A separate git mirror, because `check-diff-disposition` resolves a recorded base commit.

```
=== PRE build ===
check-diff-disposition exit=0
        watched corpus: 39 markdown file(s) of the 40-entry LANG-03 safety-surface union, covering
        all 36/36 derived kit file(s) (17 roles + 19 workflows; the union's remaining 3 markdown
        entr(ies) are public documents, which is why the kit is a MINIMUM here …

=== POST build, the SAME tree ===
check-diff-disposition exit=1
  FAIL  the registry arm's contribution to the watched corpus is 2 markdown file(s), expected
        exactly 3. The member(s) that SURVIVED are [AGENTS.md, agent-factory/README.md]; this gate
        cannot name the one that left, because after a `kind:` cell moves nothing in this repository
        still says that file was a safety-claim home — check-audit-register's equality four names
        the KIND that moved, at the source. …
```

**The PRE line is the defect in one sentence.** The gate printed `the union's remaining 3 markdown entr(ies) are public documents` — the number had already dropped from 4 to 3, the sentence still read as a statement of fact, and nothing checked it. Round 3's `0 of 36 derived kit files unwatched` is re-measured in the permanent case at `check-diff-disposition.test.ts:1954` rather than transcribed: the containment pin is silent here **by construction**, because the file that left was never a derived kit file.

---

## THE ADVERSARIAL PASS ON MY OWN FIX — and the second bypass it found

This repository's standing rule is that a green suite is not proof for a safety invariant. Eight attack shapes were run against the shipped build on hermetic mirrors, each with the exclusion list regenerated as an author would.

| # | attack | vs the CARDINALITY-ONLY build | vs the SHIPPED build | disposition |
|---|---|---|---|---|
| B1 | `kind: safety` -> `architecture` (round 3's own recipe) | `audit=1` | `audit=1` | closed by the cardinality |
| B2 | safety claim rehomed to an UNVOUCHED markdown file | `audit=1` | `audit=1` | closed by layer one |
| B3 | safety claim rehomed to `package.json` | `audit=1` | `audit=1` | closed by the non-markdown declaration |
| B4 | SWAP — demote one safety claim, promote an architecture claim on `agent-factory/writing-profile.md` | `audit=1` | `audit=1` | closed by layer one (the promoted home is unvouched) |
| B5 | every `kind: safety` -> `architecture` (vacuous arm) | `audit=1` | `audit=1` | closed by the vacuity refusal |
| B6 | the UNCOUNTED protocol row's `safety_surface` flipped `yes` -> `no` | `audit=0`, `anchors=0`, **`diff-disposition=1`** | same | **a hole no other gate covers**, closed at the consumer |
| B7 | CONTROL — unmutated | `audit=0` | `audit=0` | the control passes, so every red above is about its plant |
| **B8** | **REHOME a safety claim to another VOUCHED public document, transplanting its verbatim and its anchor** | **ALL SEVEN GATES EXIT 0** | **`audit=1`** | **THE FINDING. Closed in `b925091`.** |

### B8 is the finding

A cardinality is blind to MEMBERSHIP by construction. Measured against the build Task 1 and Task 2 produced:

```
plant: C-28-001 rehomed README.md -> CONTRIBUTING.md, verbatim transplanted, old anchor moved
  union 41 | README.md still excluded? false
  check-audit-register      exit=0
  check-claim-anchors       exit=0
  check-public-docs-vocabulary exit=0
  check-foundation-guards   exit=0
  check-banned-claims       exit=0
  check-imperative-lexicon  exit=0
```

Six safety claims before and six after. Three markdown residue members before and after. `README.md` — the front page of the project, and the home of C-28-001, the claim about humans holding merge and deploy — **left the D-18 exclusion list, and a controlled-language pass was free to reword it**, on a clean green build. That is LANG-03's truth failing for a fourth reason in a fourth round.

The closure is `SAFETY_CLAIM_HOMES`: the arm's roster, keyed by the registry's own primary key, set-equal two-sided as CLAIM->HOME pairs. Replayed against the closed build, on the same bytes:

```
premise: post-fix build carries the roster check x1
  union 41 | README.md still excluded? false
  check-audit-register exit=1
  FAIL  equality four (safety arm roster): the registry's `kind: safety` claims are not the roster
        SAFETY_CLAIM_HOMES records — declared but ABSENT [C-28-001 -> README.md], present but
        UNDECLARED [C-28-001 -> CONTRIBUTING.md]. This is the direction a per-kind count is
        structurally blind to …
```

**And the roster is the ONE authority for the arm's size**, not a second one: `CLAIM_KIND_CARDINALITY`'s `safety` entry is `SAFETY_CLAIM_HOMES.length`, so the two numbers cannot come to disagree. That is this phase's own "one authority per predicate" rule, applied to the thing the fix introduced.

### B6, the by-product

`agent-factory/roles/_role-switch-protocol.md` is watched by REGISTER reason **alone**: `listRoles()` drops underscore-prefixed entries by derivation, so it is not a derived kit file and containment cannot cover it, and equality three constrains only COUNTED rows. Flipping its one cell removed the coordinator-only spawn rule and the shared-context-is-the-only-channel invariant — both admission text — from the watched corpus with every gate green. It is now a named refusal at the consumer, with its own permanent case.

---

## The BOTH-ARMS probe, and its count assertion shown doing work

Round 3's finding is that two pins covering one arm read as coverage. So the probe moves ONE cell of EACH arm at once and requires BOTH to be named as separate findings in one run — asserting the **finding COUNT**, and asserting that the gate's own published tally (`N CHECK(S) FAILED`) equals the findings it actually printed.

The count assertion is proven to be doing work rather than riding along:

```ts
// An early-returning gate's observable output is its FIRST finding alone — the single-arm shape
// every other case accepts — and this assertion must reject it.
expect(() => expect(findings.slice(0, 1).length).toBeGreaterThanOrEqual(2)).toThrow();
```

This is the *observable* early-return, not a source mutation. The stronger evidence is upstream and was measured rather than constructed: **the pre-fix `check-diff-disposition` really did print one finding on a two-arm mirror**, because the containment pin returned before the residue was ever computed (`AssertionError: expected 1 to be greater than or equal to 2`, in the Task 2 RED transcript above). The early return is now removed and every corpus-level finding is collected before the single `verdict(); return;`.

---

## The published numbers

`check-audit-register`, on the live tree:

```
equality four holds — the union's OTHER arm carries 6 `kind: safety` claim(s) naming 4 distinct
file(s) (.claude-plugin/plugin.json, AGENTS.md, README.md, agent-factory/README.md), every markdown
one vouched for by publicDocsScan() or the derived kit (46 file(s)) and 1 non-markdown one(s)
declared by name, set-equal as CLAIM->HOME pairs to the 6-entry roster SAFETY_CLAIM_HOMES, with the
registry's kind distribution exactly safety 6, architecture 28, install 8 summing to the 42 claim(s)
parsed;
```

`check-diff-disposition`, on the live tree — three numbers that reconcile by hand against
`safetySurfaceUnion().length` (41 entries, of which 1 is non-markdown, leaving 40):

```
the union's remaining 4 markdown entr(ies) are its RESIDUE, asserted rather than described —
3 from the registry arm's `kind: safety` claims (expected 3) and 1 uncounted `safety_surface: yes`
register row (agent-factory/roles/_role-switch-protocol.md), so 36 + 3 + 1 = 40;
```

## Acceptance greps

```
$ grep -a -c 'readRegistry' scripts/check-audit-register.ts
2
$ grep -a -v '^\s*[/*]' scripts/check-audit-register.ts | grep -ac 'home of safety claim'
0
$ node scripts/check-diff-disposition.js | grep -ac 'are public documents'
0
```

The arm is derived from the parser, not from `safetySurfaceUnion`'s rendered reason text, and the unchecked sentence is gone.

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the seven gates | `node scripts/check-{foundation-guards,imperative-lexicon,diff-disposition,banned-claims,audit-register,claim-anchors,public-docs-vocabulary}.js` | all exit **0** |
| exclusion list | `node scripts/generate-safety-surface.js && git diff --stat docs/audit/28-safety-surface-exclusions.md` | **empty** — byte-unchanged; this plan pins the union, it does not move it |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0** — the counting greps above are trustworthy |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1950 passed / 2 skipped across 52 files** (plan 29-31 baseline: 1924 / 2 / 52 — **+26**, no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; every plant was on a mirror. Only the pre-existing `human-notes.txt`, `.gsd/`, `.planning/phases/29.1-…` |

Suite delta accounting, so a silently shrinking suite would be visible: `check-audit-register.test.ts` 25 -> 43 (**+18**), `check-diff-disposition.test.ts` 73 -> 81 (**+8**), `generate-safety-surface.test.ts` unchanged at 15. 1924 + 26 = 1950.

## Decisions Made

1. **The arm is derived from `readRegistry`, never from rendered text.** `safetySurfaceUnion` renders `home of safety claim C-28-NNN` per entry; a check that parsed that sentence would be a second grammar over a third artifact — the class this phase exists to delete. Grepped, comments filtered.
2. **`REGISTRY_ARM_NON_MARKDOWN` is one-directional, deliberately.** A two-sided pin there would be a second, weaker duplicate of the per-kind cardinality — removing `.claude-plugin/plugin.json` from the arm drops `safety` from 6 to 5 and the cardinality names it. One authority per predicate; the REMOVE direction has exactly one owner.
3. **The vouching set needs no cardinality pin of its own.** A short `publicDocsScan()` makes layer one report MORE strays, never fewer, so it fails closed. The direction is stated at the site instead of adding a second floor.
4. **The consumer's refusal states what it cannot name.** After a `kind:` cell moves, nothing in the repository still says the departed file was a safety-claim home, so the message names the SURVIVORS and the shortfall and points at the source gate. A message that named the missing file would be reading a set the gate no longer has.
5. **The roster is keyed by CLAIM ID, not by file path.** That is the distinction from the alternative the plan named as refused — see Deviation 2.
6. **The mirror fixtures are written as literals and pinned against the gate's declarations.** A fixture derived from the baseline it is used to falsify follows that baseline everywhere it moves, and every perturbation probe would then plant a mutation and measure nothing. `generate-safety-surface.test.ts` is the one exception and says why at its import: it carries no perturbation probe, and a second hand-copy there would be a set-literal with nothing watching it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's stated consumer equality is FALSE on the live tree, and would have been vacuous besides**

- **Found during:** Task 2, before writing a line of it
- **Issue:** The plan specifies "the markdown members of the watched corpus that are NOT derived-kit files must EQUAL the registry arm's derived markdown members." Measured: the residue is **four** files, not three — `AGENTS.md`, `README.md`, `agent-factory/README.md` **and `agent-factory/roles/_role-switch-protocol.md`**, the last of which is in the union by REGISTER reason (its uncounted row is flagged `yes`) and outside the derived kit because `listRoles()` drops underscore-prefixed entries. As written the equality reds on a correct tree. Worse, the equality is *vacuous for the direction it was written to catch*: `corpus.watched` IS `markdown(registerFlagged ∪ registryArm)`, so deriving the expectation from those same two registers and subtracting the kit reproduces the measurement exactly. A flipped `kind:` cell moves both sides together and the equality holds.
- **Fix:** Implemented as a PARTITION with two independently-sourced parts — the registry arm's markdown contribution against a cardinality baseline (the part that catches the flip), and the register's non-kit contribution set-equal two-sided against `PROTOCOL_FILE`, the one literal that declares it. The "no third source" identity is kept as the UNVOUCHED direction and is honestly the weaker half; both halves are stated at the site.
- **Files modified:** `scripts/check-diff-disposition.ts`
- **Committed in:** `8c2babc`

**2. [Rule 2 - Missing Critical] `SAFETY_CLAIM_HOMES` — added beyond the plan, and it partially adopts the alternative the plan named as refused**

- **Found during:** the mandated adversarial pass, after Tasks 1 and 2
- **Issue:** B8 above. A cardinality is blind to MEMBERSHIP by construction, and the residue count at the consumer is blind to it for the same reason. Rehoming a safety claim to another vouched public document removed `README.md` from the D-18 exclusion list with **all seven gates green**.
- **Why this is not simply following the plan:** the plan's Task 1 instructs "state the refused alternative: a hand-written list of protected files, which D-01 refuses outright", and it chose a cardinality on that basis. Shipping the cardinality alone would have shipped a measured, reproducible bypass of the very truth LANG-03 asserts, for the fourth round running. The 29-28 precedent is exact: its own adversarial pass found a fail-open its planned fix could not see, and it closed it rather than recording it, because the plan's own done-criterion forbade the shape. This plan's objective is "both arms of the union pinned in BOTH directions"; a membership-preserving-cardinality removal is that objective unmet.
- **The distinction from the refused shape, argued rather than asserted:** D-01's refusal is of a hand-written *"sentences you may not touch"* file — a set that GRANTS protection, in place of derivation. `SAFETY_CLAIM_HOMES` is keyed by CLAIM ID, the registry's own primary key: it asserts what the registry SAYS, it grants nothing (every file in it must independently pass layer one's derived containment before it means anything), it fails CLOSED on any add / delete / rehome, and its update is a same-commit companion (D-04) — the same standing D-25 gives `roleCeiling()`'s hand-maintained switch table. It is six entries.
- **Fix:** the roster, set-equal two-sided as CLAIM->HOME pairs, with `CLAIM_KIND_CARDINALITY`'s `safety` entry derived from its length so the arm's size has exactly one authority.
- **Files modified:** `scripts/check-audit-register.ts`, `scripts/check-audit-register.test.ts`
- **Committed in:** `b925091`

**3. [Rule 3 - Blocking] `scripts/generate-safety-surface.test.ts` is outside the plan's `files_modified` and had to change**

- **Found during:** the full regression run after Task 3
- **Issue:** That file's mirrors carry a one-claim registry and SPAWN `check-audit-register.js`. Equality four reds on them — correctly, because a one-claim registry is a shape the shipped artifact is not. One case failed: `exits 0 when the committed list matches a fresh regeneration`.
- **Fix:** its `defaultClaims()` now builds the roster plus per-kind fillers, and the mirror writes the roster's markdown homes so `publicDocsScan()` can vouch for them. It DERIVES the fixture from the gate's exports rather than hand-copying the roster a third time, and says why at the import: the drift pin and the perturbation probes both live in `check-audit-register.test.ts`, and a second uninspected copy would be the set-literal drift class with nothing watching it.
- **Files modified:** `scripts/generate-safety-surface.test.ts`
- **Committed in:** `b925091`

**4. [Rule 1 - Bug] A substring assertion in my own harness asserted the opposite of its property, and passed while doing it**

- **Found during:** Task 2
- **Issue:** the flip case asserted `expect(stdout).not.toContain("README.md")` to prove the refusal cannot name the departed file. `agent-factory/README.md` is a SURVIVOR and contains that substring, so the assertion could only ever fail — and had the survivor list been different it would have passed for entirely the wrong reason.
- **Fix:** the survivor list is now parsed back out of the message and compared as PATHS. Recorded rather than smoothed over, because it is the same harness-premise failure class this phase has now logged eight times.
- **Files modified:** `scripts/check-diff-disposition.test.ts`
- **Committed in:** `8c2babc`

**5. [Rule 1 - Bug] My first B1 measurement produced a FALSE detection**

- **Found during:** the adversarial pass
- **Issue:** the first rehome attack reported `audit=1` and I briefly read it as "the fix catches this". It did not: the exclusion list had not been regenerated, so the gate's folded FRESHNESS guard reported a stale artifact. The attack itself was invisible.
- **Fix:** every attack in the battery above regenerates the exclusion list first, exactly as an author would. Only then does the transcript mean what it says. This is the phase's recorded harness-premise class again, self-inflicted, and caught only by asking WHICH check produced the exit code.
- **Files modified:** none (evidence, not code)
- **Committed in:** `b925091` (the corrected battery is in this SUMMARY)

---

**Total deviations:** 5 auto-fixed (1 bug in the plan's own premise, 1 missing-critical closure found by attacking my own fix, 1 blocking sibling-harness repair, 2 bugs in my own harness and measurement).
**Impact on plan:** Deviations 1 and 2 are the ones that matter. Deviation 1 means the plan's consumer equality could not have been implemented as literally specified without either a false red or a vacuous check. Deviation 2 is the round's own lesson landing one dimension over: the plan asked "what does the OTHER ARM do", and attacking the answer showed the arm was still open in the MEMBERSHIP dimension while both new pins measured only its SIZE.

## Issues Encountered

- No auth gates, no package installs, no architectural decisions.
- No checkpoint was reached: the plan declares `autonomous: true` and every task is `type="auto"`.

## Known Stubs

None. Every new assertion has been seen failing against a build where the property does not hold — the twelve Task 1 cases and five Task 2 cases in the RED transcripts above, and the roster check against the B8 mirror. The eight Task 1 cases that red as unresolved imports rather than as wrong answers are disclosed as the weaker RED above rather than presented as behavioural.

## Recorded Residuals (not closed, by name and with live counts)

| id | what | direction | live count / reachability |
|---|---|---|---|
| V-29-30-01 | Which claims are SAFETY claims is an EDITORIAL classification and nothing in this repository derives it. Both `CLAIM_KIND_CARDINALITY` and `SAFETY_CLAIM_HOMES` are therefore measurement baselines, not derived sets. | fails CLOSED — any add, delete, reclassification or rehome reds until the baseline is updated in the same commit (D-04 / D-25) | 3 declared kinds, 6 roster entries; both re-derived live in `check-audit-register.test.ts:601,611` |
| V-29-30-02 | `publicDocsScan()` is consumed WITHOUT its own cardinality pin inside equality four. A GROWN scan set makes layer one more permissive. | fail-open only in the ADD direction, and only for a file that is genuinely a new public document; a SHORT scan set reports MORE strays, i.e. fails closed | 10 documents today; the count is pinned two-sided in its own gate (`PUBLIC_DOCS_SCAN_COUNT`) |
| V-29-30-03 | The consumer's refusal cannot NAME the file that left the arm; it names the survivors and points at equality four. | disclosed in the message itself | n/a — asserted as a property at `check-diff-disposition.test.ts:1954` |
| V-29-30-04 | A safety claim rehomed to a file that is BOTH vouched and already in the roster's home set would preserve the arm's FILE set — but not its CLAIM->HOME pairs, which is what the roster compares. No shape survives both the roster and layer one that this pass could construct. | — | 0 constructible in the 8-shape battery above |

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. Every `critical` and `high` row is dispositioned `mitigate` and landed: T-29-30-01 in `834af9b` + `8c2babc`, T-29-30-02 in `834af9b`, T-29-30-03 in `8c2babc`, T-29-30-04 in `834af9b` + `8c2babc`, T-29-30-05 in `8c2babc` (the early return removed) + `b925091` (both probes), T-29-30-06 in `834af9b`. `T-29-30-SC` (package installs) remains an empty input set — this plan installs nothing, per the zero-runtime-dependency constraint.

## Next Phase Readiness

- **LANG-03's three enumerated `missing:` items are all closed**, item 2 by plan 29-28 and items 1 and 3 here. Whether the truth now HOLDS is for verification to decide, not for this SUMMARY to assert.
- **A note for 29-32 and for the next round:** `SAFETY_CLAIM_HOMES` and `CLAIM_KIND_CARDINALITY` are same-commit companion edits to any registry change. Adding a claim reds `check-audit-register` until both are updated; that is the mechanism, not a nuisance.
- **The probe this round adds to the phase's record:** two pins over one arm read as coverage — and so do two pins over one arm's CARDINALITY while its MEMBERSHIP moves freely underneath them. Ask which DIMENSION each predicate measures, not only which arm.

## Self-Check: PASSED

All five modified source files exist on disk. All three task commits (`834af9b`, `8c2babc`, `b925091`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
