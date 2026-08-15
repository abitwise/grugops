---
phase: 29-controlled-language-voice-guard-rebuild
plan: 25
subsystem: tooling / verification harness + audit gates
tags: [LANG-06, LANG-07, WR-05, WR-06, WR-07, IN-03, section-locator, harness-premise, set-literal-drift]
requires:
  - "scripts/frontmatter.ts — unfencedHeadingIndex, sectionEndIndex, fencedLineFlags (plan 29-20's one authority)"
  - "scripts/kit-model.ts — listRoles, ROLE_COUNT (the derived role corpus)"
provides:
  - "scripts/check-foundation-guards.test.ts :: a DERIVED, tree-wide, two-sided, falsifiable owner scan for the section-extent predicate"
  - "scripts/check-foundation-guards.test.ts :: a DERIVED, two-sided consumer list for the section-locator authority, cardinality pinned"
  - "scripts/check-foundation-guards.test.ts :: a DERIVED tripwire over every test module for adjacent byte-identical assertions"
  - "scripts/audit-model.ts :: tableUnder — delegating, zero private section predicates (the FIFTH and last locator of the class)"
  - "scripts/check-foundation-guards.test.ts :: ROLE_DIR_REL — the role directory named once, with rolePath and roleRel derived from it"
affects:
  - "scripts/check-audit-register.js (its parse authority is rewired; transcript byte-identical)"
  - "scripts/check-foundation-guards.test.ts (the frontmatter consumer pin moves from eight members to nine)"
tech-stack:
  added: []
  patterns:
    - "a floor the call's own refusal already guarantees is documentation of intent, never a check"
    - "`toContain` is a substring test; two identical calls assert one thing twice — count occurrences and assert the PARTITION"
    - "an exemption is worth more as a MECHANISM than as a name on an allow-list: make the conjunction exclude it and assert the exclusion"
    - "a line-scoped source classifier is blind to the multi-line spelling of the same construct — scope the second half to the BLOCK"
    - "floor non-vacuity PER ELEMENT, not only in total: a scan that read 46 files and classified nothing in half of them still reports a healthy sum"
    - "give each planted site exactly ONE construct per arm, or the per-construct removal probe reports a decoration as load-bearing"
decisions:
  - "The owner scan reported TWO members and the extra was CLOSED, not absorbed: `audit-model.ts::tableUnder` — logged by 29-22, re-logged by 29-23, named by 29-24 as the only known survivor — now delegates to the one authority. Writing it into the expected list would have been the 'absorb rather than escalate' failure the plan's own criterion forbids."
  - "29-24's demanded exemption for `HEADING_LINE` is STRUCTURAL rather than a named exception. The conjunction requires a heading recogniser USED in a position that terminates or bounds a scan; `continue` does neither, so no module is exempted BY NAME anywhere in the block, and the exclusion is asserted twice."
  - "The recogniser arm requires a literal SPACE after the hashes, narrower than 29-22's third construct whose trailing class admits a BACKSLASH and therefore recognises `/^#\\d+$/` — an issue reference. Both sides of the narrowing are asserted on planted lines."
  - "The tripwire's scope is every `*.test.ts` under `scripts/` (46 modules), not the five the plan hand-lists — a five-member literal is the set-literal drift this repository has corrected three times."
  - "The consumer list written down is what the derivation REPORTED (five), not what the plan predicted (four)."
metrics:
  duration: 95m
  completed: 2026-08-15
actuals:
  tokens: 96000
  tasks: 3
  commits: 4
status: complete
---

# Phase 29 Plan 25: The Harness Tells the Truth, and LANG-07 Becomes a Derivation Summary

Three harness assertions now reach the properties their names claim, their shared class has a derived
tripwire instead of a third hand-fix, and LANG-07's central claim — that exactly one module owns the
section-extent predicate — is a two-sided, non-vacuous, falsifiable scan over the live tree whose
answer is ONE only because the fifth locator was closed rather than exempted.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | WR-05, WR-06 and IN-03 — three assertions that assert less than their names claim | `64bfc96` | voice-model.test.ts, check-foundation-guards.test.ts |
| 2 | LANG-07 as a derivation — one owner, tree-wide and two-sided | `9865568` | audit-model.ts/.js/.test.ts, check-foundation-guards.test.ts |
| 3 | Close the harness defect CLASS derivationally | `ab509a2` | check-foundation-guards.test.ts |
| — | Correct a stale count in the tripwire's own comment | `d0bd42d` | check-foundation-guards.test.ts |

## The Two Inherited Complications, Each Answered

The execution brief named two live findings from earlier waves that this plan's derivation had to
confront. Neither was quietly dropped.

### 1. The fifth locator — FIXED, not exempted

`scripts/audit-model.ts::tableUnder` was logged by 29-22, re-logged by 29-23, and named by 29-24 as
"the ONLY known remaining member of the class outside the four reconciled consumers". All three left
it out of scope.

Run tree-wide, the owner scan reported it as a member, and the plan's own acceptance criterion says
an extra is **"named and escalated as a LANG-07 failure rather than added to the expected list"**.
The strongest form of escalation available to an executor is to close it, so it is closed. Three
private predicates are deleted:

| Question | Deleted predicate | Replacement |
|---|---|---|
| where is the anchor | `lines.findIndex((l) => l.trim() === heading)` | `unfencedHeadingIndex` — `trimEnd()`, fence-aware |
| where does the section end | `if (lines[i].startsWith("## ")) break;` | `sectionEndIndex(text, start + 1, 2)` |
| is this line data | *(nothing — fence-blind)* | `fencedLineFlags(text)`, consulted per line |

Scoping the derivation's file set to exclude it would have been the exact defect the derivation
exists to close.

### 2. 29-24's classifier survivor — a STATED EXEMPTION, and it is structural

29-24 measured its own module at 4 → **1**, not 4 → 0, and recorded that the survivor is
`HEADING_LINE`, a heading RECOGNISER the same plan instructs the module to keep. Its instruction to
this plan was explicit: **state an exemption rather than widen the classifier.**

The exemption is stated, and it is a mechanism rather than a name on an allow-list. A section-extent
construct is a conjunction — a heading recogniser **used in a position that terminates or bounds a
scan**. `HEADING_LINE`'s only use is `if (HEADING_LINE.test(raw)) continue;`, and `continue` skips one
element without terminating or bounding anything. The conjunction's second half excludes it, so **no
module is exempted by name anywhere in the block.**

That exclusion is asserted rather than assumed, twice:

- `check-imperative-lexicon.ts` must match the recogniser arm and produce **zero** sites — the same
  discrimination the fence-machine scan proves on its own file.
- `continue` must be **absent** from the terminator constructs, because the exemption rests on it and
  a construct list is a hand-maintained set like any other.

Widening the classifier to reach zero would have been the failure mode. Narrowing it to reach one
would have been the same failure wearing the other hat.

## The Owner Scan's Derived Member List, Verbatim

Produced by running the classifier over the live tree in the session that wrote this line:

```
non-test modules scanned: 41

=== frontmatter.ts
   sectionEndIndex :: if (!flags[i] && closes.test(lines[i])) return i;

TOTAL SITES: 1
```

Before the fifth locator was closed, the same scan over the same tree reported **two**:

```
=== audit-model.ts
   tableUnder :: if (lines[i].startsWith("## ")) break;

=== frontmatter.ts
   sectionEndIndex :: if (!flags[i] && closes.test(lines[i])) return i;

TOTAL SITES: 2
```

`SECTION_EXTENT_OWNERS = ["frontmatter.ts"]`, `SECTION_EXTENT_OWNER_COUNT = 1`.

## The Consumer Scan's Derived Member List — FIVE, Not the Four the Plan Predicted

```json
[
  "audit-model.ts",
  "check-banned-claims.ts",
  "check-diff-disposition.ts",
  "check-imperative-lexicon.ts",
  "voice-model.ts"
]
count: 5
```

The plan states "after plans 29-20 through 29-24 that list is the four guard modules" and then
instructs the executor to "write down whatever the derivation reports rather than whatever this plan
expects". The derivation reports five, because this plan added the fifth. The `frontmatter.js`
consumer pin also moves **eight → nine** for the same reason, and its comment records why.

The two sets are asserted **disjoint**: no module may both declare a section-extent predicate and
import the shared one, which is the shape that let `voice-model.ts` be fence-aware in one half and
fence-blind in the other at plan 29-20.

## WR-06 Reproduced — The Retired Pair PASSES a Build Where One Consumer Went Silent

This is the finding, demonstrated rather than argued. `guard_caveman_voice`'s refusal detail was
mutated to a different string (premise asserted: `tsc` accepted, committed `.js` hash moved), so the
gate emitted **one** refusal line instead of two.

**The new occurrence count REDS:**

```
 × the full gate exits 1 on a de-fenced role carrying a later lexicon-bearing fence
 × the full gate exits 1 on a de-fenced role carrying a later LEVEL-ONE lexicon-bearing fence
AssertionError: each of the two voice guards must name the file and the reason INDEPENDENTLY —
this is an occurrence count, not a substring test: expected [ Array(1) ] to have a length of 2 but got 1
```

**The retired byte-identical pair PASSES on the same bytes:**

```
 Test Files  1 passed (1)
      Tests  1 passed | 179 skipped (180)
```

Nothing else in the case moved — not the exit code, not the two absent PASS lines, not the negative
measurement regex. The occurrence count is the only assertion in that case that can see a silent
consumer.

The count is not the whole property either, so the **partition** is asserted beside it: exactly one
line at column zero (`guard_voice`) and exactly one indented (`guard_caveman_voice`). A count of two
alone is satisfied by one consumer printing twice.

## WR-05 — The Floor That Could Not Fail

`expect(names.length).toBeGreaterThan(0)` sat three lines below a comment promising that "a short
denominator here would let a role slip out of the control silently". `listRoles()` calls `refuseEmpty`
before returning, so it **throws** on an empty roles directory: the floor was guaranteed by the very
call it was checking. Sixteen of seventeen roles could vanish and this control passed.

It now asserts `toHaveLength(ROLE_COUNT)`, imported from the kit authority rather than typed. The
falsifiability sibling copies the kit to a temp root, removes one role and asserts three things in
order: the mirror reproduces `ROLE_COUNT` before the removal (the control), the strengthened form
rejects the short list, and **the retired floor accepts it** — which is the finding rather than a
decoration on it.

## WR-06 Axis Two, and the Latent Bug in the Review's Own Fix

Every pattern about the planted role is built from `MALFORMED_ROLE` and each negative is demonstrated
capable of matching a synthesized line before being asserted to match none. **Five** sites were
routed, not the one the review named — the plan's own prohibition is "never fix a harness defect only
at the address the review named".

The review proposes `MALFORMED_ROLE.replace(".", "\\.")`. The single-argument string form of `replace`
substitutes only the **first** occurrence, so a role file ever named with two dots would ship an
unescaped one — a latent second defect inside the fix for the first. A full metacharacter escape is
used and the reason is recorded in source.

## IN-03 — The Directory Named Once

The review named two bypass sites. Measured, there were **three** filesystem plant sites
(`plantCavemanBlock`, the LANG-07 oracle loop, the vacuity case) and **five** repo-relative
restatements built by template literal. All eight now derive from a single `ROLE_DIR_REL` constant
through `rolePath` (filesystem) and `roleRel` (the form the guards print).

The acceptance-criterion grep now returns three lines:

```
141:const ROLE_DIR_REL = "agent-factory/roles";
4445:    expect(DERIVED_ROLE_INPUTS).toContain("agent-factory/roles/orchestrator.md");
4447:      "agent-factory/roles/_role-switch-protocol.md",
```

**Line 141** is the single declaration — the helper's own source of truth. **Lines 4445 and 4447** are
the EXPECTED VALUES of an assertion about `DERIVED_ROLE_INPUTS`, and they are deliberately literal:
building an expected value from the same expression as the value under test makes the assertion a
tautology. Both survivors are named with a reason, as the criterion requires.

## The Duplicate-Assertion Tripwire

Derived over every `*.test.ts` under `scripts/`, wider than the plan's five-member hand-list because a
five-member literal is the set-literal drift this repository has corrected three times.

| Measurement | Value |
|---|---|
| test modules scanned | **46** |
| classified assertion lines | **4706** |
| modules contributing zero assertion lines | **0** |
| adjacent byte-identical pairs | **0** |

**The zero is proven non-vacuous against a real historical input.** Run over
`check-foundation-guards.test.ts` at commit `3ed76c1` — the tree as it stood before this plan — the
same classifier reports exactly **one** pair, at line 4251:

```
expect(o).toContain(`${rel}: ## Caveman prompt fence refused — reason missing`);
```

which is WR-06 at the address the round-2 review named. The live answer is zero only because that
pair became an occurrence count in this plan's first commit.

**"Within one test body" is guaranteed by adjacency, not approximated by it.** Two consecutive lines
cannot straddle a test boundary, because a boundary is spelled `});` or `it("…", () => {` and neither
classifies as an assertion line. That argument is itself asserted, over six boundary spellings plus
two positive controls.

**Non-vacuity is floored per element as well as in total**, because this project has recorded a
vacuity floor that caught an EMPTY denominator and missed a SILENTLY SHORT one. Both floors were
mutation-proven to fire:

| Mutation | Result |
|---|---|
| a duplicate of `expect(status).toBe(0);` planted in `check-banned-claims.test.ts:295` | the pair assertion REDS, naming file and line |
| a scratch test module with zero classified assertion lines added to `scripts/` | the per-file floor REDS: `expected [ 'zz-scratch-barren.test.ts' ] to deeply equal []` |

## Mutation Proof of the `audit-model.ts` Rewire — Six Runs, Each With Its Own Premise

The harness refuses to report unless `tsc` accepted the mutation **and** the committed `.js` hash
actually moved. Both are the failure modes that produced false results in 29-20 and 29-22.

| Mutation | Premise | Cases that failed |
|---|---|---|
| M1 close narrowed to level ONE | artifact moved, tsc ok | 4 (`## Table B` stops closing Table A) |
| M2 the DELETED `## `-only close restored | artifact moved, tsc ok | the level-one case (1) |
| M3 anchor made fence-blind (deleted `findIndex` equality) | artifact moved, tsc ok | the fenced-quotation and trailing/leading cases (2) |
| M4 close widened to level THREE | artifact moved, tsc ok | the level-three case (1) |
| M5 anchor equality back to `trim()` | **PREMISE FAILED** — `unfencedHeadingIndex` became unused, tsc rejected it, artifact did not move | — |
| M5b same mutation with the symbol kept live | artifact moved, tsc ok | the trailing/leading case (1) |
| M6 the fenced-row skip deleted | artifact moved, tsc ok | the fenced-row case (1) |

M5 is recorded rather than dropped: the harness caught its own bad mutation instead of reporting a
green for a build that never happened — the same class 29-22's M2 and 29-24's M6/M8 caught.

## The Live Register, Before and After

| Measurement | Before (`5ae12b6`) | After |
|---|---|---|
| Table A rows | 37 | **37** |
| Table B findings | 32 | **32** |
| `check-audit-register` | exit 0 | exit 0, **transcript byte-identical** (`diff` clean) |

The rewire is behaviour-preserving on the live corpus, so its proof is a planted input and never a
moved number.

## Gate Numbers — Every One Matches Plans 29-20 Through 29-24

| Gate | Value |
|---|---|
| `check-foundation-guards` | exit 0, `caveman voice: 0 findings over 17/17 elements`, ALL CHECKS PASSED |
| `check-imperative-lexicon` | exit 0, `0 findings over 19/19`; `2166 sentence(s) — 414 procedural, 1752 descriptive`; `0 findings over 47/47`; `47 of 47 opened` |
| `check-diff-disposition` | exit 0, `37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s) derived; 1532 disposition row(s) across 8 file(s)` |
| `check-banned-claims` | exit 0 |
| `check-audit-register` | exit 0 |
| `check-claim-anchors` | exit 0 |
| `check-public-docs-vocabulary` | exit 0, `watched corpus: 40 markdown of a 41-entry union, covering 36/36 derived kit files` |
| `npm run freshness` | exit 0, 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 |

Full regression: `npx vitest run --exclude '**/scripts/e2e/**'` → **51 files, 1871 passed, 2 skipped**
(both skips pre-existing). 29-24 left 1857; this plan adds exactly 14 (1 + 5 + 5 + 3), and
1857 + 14 = 1871.

## The Disposition Obligation, Confirmed Absent by Measurement

`scripts/audit-model.ts` is not in the LANG-03 watched corpus (markdown under `agent-factory/` plus
four public documents) and is not a Table A row (Table A holds 17 roles + 19 workflows + 1 protocol).
Confirmed by the gate itself: `check-diff-disposition` still reports **37 watched files changed / 1880
clauses / 1532 rows**, byte-identical to before the edit.

**No disposition row is owed under `docs/audit/29-style-dispositions/` and none was invented.**

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] This plan is declared test-only; it had to change source

- **Found during:** Task 2, at the first tree-wide measurement.
- **Plan text affected:** *"No new source files… No `.js` build output changes, because this plan
  modifies test modules only."*
- **Why it cannot hold:** the owner scan reported two members, and the same plan requires exactly one
  with any extra *"named and escalated as a LANG-07 failure rather than added to the expected list"*.
  Those two instructions cannot both be satisfied by a test-only change. Absorbing `audit-model.ts`
  into the expected list is precisely the "absorb rather than escalate" failure the round is about.
- **Resolution:** the fifth locator is closed. `scripts/audit-model.ts`, its committed `.js` and its
  test module are modified, with five cases pinning both directions of every widened axis and six
  mutations attributing each.

### 2. [Rule 1 — the plan asserts a fact the tree falsifies] The consumer list is FIVE, not four

- **Plan text affected:** *"After plans 29-20 through 29-24 that list is the four guard modules."*
- **Measured:** five. The plan's next sentence is the one that governs — *"write down whatever the
  derivation reports rather than whatever this plan expects"* — and it is followed.

### 3. [Rule 1 — bug in my own harness] The level-one case discriminated NOTHING, and only a mutation said so

- **Found during:** Task 2, by running M2 after the suite went green — not by reading.
- **Issue:** the first fixture put only PROSE between `# Appendix` and `## Table B — findings`. The
  deleted `## `-only close walks past the level-one heading and then stops at the level-two one,
  harvesting **the same rows**. Restoring the deleted close reddened **zero** cases. The case's own
  "discrimination assertion" compared where the two closes STOP, which was true and irrelevant.
- **Fix:** a PIPE ROW is planted under the level-one successor, so the two closes differ in what they
  COLLECT. The discrimination assertion now compares the harvested lines and names the extra one.
  M2 re-run: exactly one case reds.
- **The lesson, stated:** two closes can stop at different lines and still collect the same rows.
  Comparing indices is not comparing answers.

### 4. [Rule 1 — bug in my own harness] The classifier was LINE-SCOPED and blind to the commoner spelling

- **Found during:** Task 2, by running the classifier over a planted two-line form.
- **Issue:** the first draft required the recogniser and the terminator on ONE line. It therefore saw
  `if (line.startsWith("## ")) break;` — the spelling `audit-model.ts` happened to use — and was blind
  to the identical locator written as `if (line.startsWith("## ")) {` / `end = i;` / `break;` / `}`.
  A tree-wide scan reporting "exactly one owner" while blind to the commoner spelling of the thing it
  counts is a false measurement, and it would have shipped a green LANG-07 claim.
- **Fix:** the terminator search is BLOCK-SCOPED — it reaches into the consequent the recogniser line
  opens and stops at the first non-blank line indented no deeper, which is the line closing that
  block. The window bound is stated, and the derived answer is identical at 4, 6 and 10 lines, so
  nothing depends on its value. Both directions are pinned: the multi-line form is a NAMED member of
  the planted answer, and the control's `return seen;` sits inside the line window and is correctly
  not reached because it is outside the block.

### 5. [Rule 1 — bug in my own harness] A planted site carried TWO terminator constructs, so a removal probe passed vacuously

- **Found during:** Task 2, by reading the received value of the falsifiability probe.
- **Issue:** the first planted fixture gave one function both `end = i;` and `break;`. Dropping either
  terminator construct left the derived list unchanged, so the probe reported a decoration as
  load-bearing — the same false-probe class 29-22 recorded as its Deviation 3.
- **Fix:** the fixture is split so each planted site carries exactly ONE construct per arm, and an
  assertion requires that dropping any one terminator construct costs **exactly one** site.

### 6. [Rule 1 — bug in my own harness] `HASH` referenced before initialization

- **Found during:** Task 2, at the first run after the member-level probe landed.
- **Issue:** `PLANTED_SIXTH_LOCATOR` used the character-code constants declared 45 lines below it.
  Vitest reported `ReferenceError: Cannot access 'HASH' before initialization` and collected **zero
  tests** from the file.
- **Why it is recorded rather than quietly fixed:** `npx tsc --noEmit` was **silent** on it, because
  `tsconfig.json` excludes `**/*.test.ts`. A typecheck that does not read the harness is not a check
  on the harness, and "tsc passed" is not evidence about a test module in this repository.
- **Fix:** the constants are hoisted above their first use, with the reason for their character-code
  form recorded at the declaration.

### 7. [Rule 2] The recogniser arm is NARROWER than 29-22's third construct, and the narrowing is measured

29-22's `CLOSE by heading PREFIX` construct is `/\^#\{?[\d,]*\}?[ \\]/`, whose trailing class admits a
BACKSLASH — so it recognises `/^#\d+$/` in `scripts/trace-render.ts`, an ISSUE-REFERENCE pattern that
is not a heading in any sense. 29-22's own summary records exactly this noise as its reason for
staying module-scoped. The arm here requires a literal SPACE, which is what the plan's definition says
and what every heading recogniser in this tree spells. Both sides are asserted on planted lines, and
`trace-render.ts` is asserted absent from the answer for that reason.

### 8. Scope widened: three IN-03 plant sites and five WR-06 pattern sites, not the two and one named

The review names two IN-03 sites and one WR-06 axis-two site. Measured, there are three plant sites
plus five repo-relative restatements, and five patterns hard-coding the role filename inside
`MALFORMED_ROLE`'s scope. All are routed, under the plan's own prohibition against fixing a harness
defect only at the address the review named.

### 9. The tripwire's stale self-measurement, caught and corrected in its own commit

The tripwire's comment recorded 4693 classified assertion lines — the count taken BEFORE the block was
appended, which the block's own 13 assertion lines then falsified. Re-measured to 4706 and restated as
a snapshot rather than a pin, with the mistake recorded in place. The case floors the number rather
than fixing it, precisely so the comment cannot become load-bearing.

## What Was Deliberately Not Touched

Confirmed by `git diff 5ae12b6`:

- `scripts/frontmatter.ts` — the authority is consumed, never widened. No opt-out parameter was added
  and none exists.
- Every verdict, refusal wording, closed set and threshold in `audit-model.ts` other than
  `tableUnder`'s three predicates. This is a locator change, not a semantics change.
- `boardColumns`' terminator in `check-imperative-lexicon.ts` — where a TABLE ends is not where a
  SECTION ends, and 29-24's decision on it stands.
- Every file in the LANG-03 watched corpus (measured above; the gate's three numbers are unmoved).

## Residuals Named, Not Absorbed

- **The owner scan is a floor, not a proof.** Six shapes it cannot see are named at the classifier: a
  recogniser built from concatenated fragments or `new RegExp(...)`; a slice/index/charAt prefix form;
  a bound expressed through a helper (the resolution follows const-bindings, never call graphs); a
  whitespace-class recogniser (`/^#{1,6}\s/`), which no module uses today; a locator in a language the
  scan does not read or in a `.js` file it does not enumerate; and a terminator placed outside the
  block its recogniser opens.
- **The tripwire is a floor against one shape.** Four shapes it misses are named: a duplicate pair
  separated by any line, a pair differing only in whitespace inside a template literal, a duplicate
  across two CASES rather than within one, and any assertion not beginning with `expect(`.
- **`tsc --noEmit` does not read test modules.** `tsconfig.json` excludes `**/*.test.ts`, so a
  reference-before-initialization in the harness surfaces only under vitest, and it surfaces as ZERO
  COLLECTED TESTS rather than as a failure — a shape that could read as a pass to a careless
  transcript. Recorded here because a future plan may want the harness typechecked.
- **`audit-model.ts`'s row loop is now fence-aware, and the live corpus exercises none of it.** The
  register's one fenced block (lines 499-502) carries no pipe rows today, so the new skip has an empty
  input set on the shipped tree. Its verdict is nonetheless PINNED by a permanent case, so the
  disclosure is a measurement rather than a belief.
- **The register's anchor no longer admits a leading-space heading.** That is a NARROWING as well as a
  normalisation. The live register's headings are column-zero, so it moves nothing today, and both
  directions carry a case.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-25-SC` had an empty input set as predicted: no package-manager install occurred and
`package.json` is unchanged. `T-29-25-01` through `T-29-25-05` are all **mitigated** as the register
directs, each with a demonstration recorded above rather than an assertion of intent.

## Self-Check: PASSED

Every item below was measured in this session, not remembered.

- `scripts/voice-model.test.ts` — FOUND. Imports `ROLE_COUNT`; the control asserts
  `toHaveLength(ROLE_COUNT)`; `toBeGreaterThan(0)` no longer appears on the role list. **40 tests**
  (was 39).
- `scripts/check-foundation-guards.test.ts` — FOUND. **188 tests** (was 180): five LANG-07 cases plus
  three tripwire cases. The `agent-factory/roles` grep returns exactly three lines, listed above with
  a reason each. The frontmatter consumer pin lists nine members.
- `scripts/audit-model.ts` — FOUND. `tableUnder` takes `text`, calls `unfencedHeadingIndex`,
  `sectionEndIndex` and `fencedLineFlags`, and declares no section predicate. No `startsWith("## ")`
  and no `l.trim() === heading` survives in it.
- `scripts/audit-model.js` — FOUND, fresh (48 committed `.js` match a fresh rebuild).
- `scripts/audit-model.test.ts` — FOUND. **59 tests** (was 54).
- `.planning/phases/29-controlled-language-voice-guard-rebuild/29-25-SUMMARY.md` — this file.
- commit `64bfc96` — FOUND
- commit `9865568` — FOUND
- commit `ab509a2` — FOUND
- commit `d0bd42d` — FOUND
