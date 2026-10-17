---
phase: 29-controlled-language-voice-guard-rebuild
plan: 57
subsystem: testing
tags: [guard, lang-04, banned-claims, hard-wrap, residual-disclosure, audit-register, typescript, vitest]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "`docs/audit/29-round8-residuals.md` opened with its header block and §1 (plan 29-56); `guard_banned_claims`'s published header and module docblock already narrowed to the decided predicate (plan 29-56, D-55)"
provides:
  - "`V-29-57-01` — the hard-wrap axis with a statement, a FAIL-OPEN direction, three derived measurements and their commands, a reproduction re-run at HEAD, a named remedy, and D-56 as the recorded reason the remedy is not applied"
  - "the corrected reachability figure: 11 of 22 pinned members are wrap-reachable, derived — not the 16 multi-word members the round-7 review published as the reach"
  - "the in-source residual record at `scripts/check-banned-claims.ts` describing the wrap shape the reproduction actually uses, with the V- cross-reference, the direction and the derived counts"
  - "one permanent SOURCE-SHAPE case, mutation-proven in both directions, whose residual-section bounds are DERIVED from the file's own banner and closing rule"
affects: [29-58, 29-59, 29-60]

actuals:
  tokens: 9277
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "an accepted fail-open bound is disclosed as a `V-` id carrying a statement, a direction, a derived live count, a derived reach, a reproduction, a named remedy and the decision id that declines it — never as a paragraph"
    - "a figure published by a review with no recorded predicate is re-derived under a STATED definition, both values printed, and the disagreement named rather than reconciled"
    - "a source-shape case extracts its subject SECTION by the file's own anchors instead of a line range, and its vacuity floor is chosen so it cannot collide with the subject's actual size"

key-files:
  created: []
  modified:
    - docs/audit/29-round8-residuals.md
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts

key-decisions:
  - "D-56 applied as written: the matcher is NOT fixed, and that is a recorded decision with its reason rather than a silent omission. `lineHits()` and `countBannedClaimOccurrences` are byte-unchanged, 0 changed lines outside the derived docblock range, and no second input assembly exists anywhere in this round's output."
  - "The round-7 review's published reach — `16 of 22 literals reachable` (`29-REVIEW.md:225-226`) — is CORRECTED to 11, derived from `BANNED_CLAIM_LITERALS` itself. `multi-word` and `wrap-reachable` are different quantities: the five-member difference is the `comprehension` group, whose pinned bare terms survive every split of its own longer phrasings. The review's `6 of 7 token-economy members` is independently re-derived and CONFIRMED."
  - "The round-7 review's house-style figure (822 wraps / 2458 pairs / 60 files) is NOT carried, because its predicate is unrecorded and therefore unreproducible. A definition is stated here and the figure re-derived at HEAD: 757 / 2612 / 73. Both are printed; the disagreement is named as a disagreement and deliberately NOT reconciled, because without the review's predicate any attribution would be invented."
  - "`docs/audit/29-round7-residuals.md` is NOT edited. Its `V-29-42-01` row is ACCURATE about the co-occurrence window D-48/D-53 deleted; what `V-29-57-01` supersedes is a READING of that row, not the row. A prior round's record is history."
  - "The superseded justification is DELETED, not hedged at the same address — this phase's established remedy for a stale claim. The refusal of a global whitespace normalization is KEPT with its reason, because that half was correct and load-bearing."

patterns-established:
  - "Pattern: derive the section, not the line range. A source-shape case that slices `lines.slice(0, N)` drifts silently the first time the paragraph above its subject grows. This case finds its subject between the file's own banner and the next docblock rule."
  - "Pattern: a vacuity floor must not collide with the subject. A `toBeGreaterThan(20)` premise against a section that is exactly 20 lines pre-edit reds BEFORE the assertion under test — a premise tuned to the subject's size becomes a second, accidental subject."
  - "Pattern: prove the bypass with a DISCRIMINATION control, not just a reproduction. Identical mirror, identical file, identical words, identical members — only the newline positions differ. Wrapped: exit 0, file never named. Unwrapped: exit 1, three findings at file:line:column."

requirements-completed: []

coverage:
  - id: D1
    description: "The hard-wrap axis is DISCLOSED, not dropped: it carries a `V-` id, a derived reachability count, a derived live count, a FAIL-OPEN direction, its reproduction, and the named remedy it does not receive this round with the reason it does not."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "`docs/audit/29-round8-residuals.md` §4.1..§4.7 — `V-29-57-01` carries every field the round-7 §4.1-§4.6 entry shape uses"
        status: pass
      - kind: integration
        ref: "node scripts/check-banned-claims.js, check-audit-register.js, check-claim-anchors.js all exit 0 with the register landed; the gate's stdout is byte-identical to the pre-plan run"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every number in the disclosure is derived by a command recorded beside it and re-taken at HEAD; the count carried from a review or a prior register is zero, and one review figure is corrected rather than carried."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "three `node --input-type=module` measurements quoted verbatim with their output in §4.2, §4.3 and §4.4; the review's 16-of-22 and 822/2458/60 printed beside the derived 11-of-22 and 757/2612/73"
        status: pass
    human_judgment: true
    rationale: "Whether NOT reconciling the two house-style figures is the right call is an editorial judgment. The derivation and the disagreement are mechanical; the decision to print both and attribute neither is the thing a reviewer must agree with — §4.4 states the reason (the review's predicate is unrecorded, so any attribution would be invented)."
  - id: D3
    description: "The reachability count is DERIVED from the literal list, not inferred from word count, and the register states that multi-word and wrap-reachable are different quantities."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "§4.2 command output: total 22, multi-word 16, wrap-reachable 11, with the five NOT-reachable members printed with the pinned member that survives each split"
        status: pass
      - kind: unit
        ref: "the source and the register agree on 11 — `grep -o '11 of the 22 pinned members are' scripts/check-banned-claims.ts` and §4.2's table row both read 11"
        status: pass
    human_judgment: false
  - id: D4
    description: "The in-source residual record names the wrap shape the reproduction uses, cites the measured house-style figure, cross-references `V-29-57-01`, and no longer carries the superseded premise."
    requirement: "LANG-04"
    verification:
      - kind: unit
        ref: "scripts/check-banned-claims.test.ts#SOURCE SHAPE: the residual cross-references the V- id, and the superseded wrap-shape word is gone"
        status: pass
      - kind: integration
        ref: "RED on two separately extracted pre-edit mirrors (arm 1: 0 -> >=1; arm 2: 1 at line 70 -> 0); mutation-proven in both directions on two further fresh HEAD mirrors; clean control mirror green"
        status: pass
    human_judgment: false
  - id: D5
    description: "The matcher is NOT fixed and no second input assembly is added anywhere in this round."
    requirement: "LANG-04"
    verification:
      - kind: other
        ref: "derived diff analysis: one hunk at new-side 65..93; 0 changed lines outside the derived leading-docblock range (1..142); 0 changed lines inside lineHits (2046..2055) and countBannedClaimOccurrences (2063..2073)"
        status: pass
      - kind: integration
        ref: "the gate's stdout is byte-identical (cmp) before and after both commits; BANNED_CLAIM_LITERALS sha256 unmoved across b90712b..HEAD"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-18
status: complete
---

# Phase 29 Plan 57: The hard-wrap axis, disclosed and correctly premised Summary

**The one axis Phase 29 does not close now has an id — `V-29-57-01`, FAIL-OPEN, 11 of 22 members reachable, 0 live — measured three ways with every command recorded, and the source's own justification for accepting it, which argued from a wrap shape the reproduction does not use, is deleted rather than hedged.**

## Performance

- **Duration:** 15 min
- **Tasks:** 2/2
- **Commits:** 2
- **Files changed:** 4 (367 + 29 + 99 + 29 insertions, 3 + 6 + 0 + 6 deletions)

## Accomplishments

### Task 1 — `V-29-57-01`, measured three ways and left open (`cc758fd`)

`docs/audit/29-round8-residuals.md` §4 now carries the axis with a statement, the direction `FAIL-OPEN`, three derived measurements with their verbatim commands and outputs, the reproduction re-run at HEAD on fresh mirrors, the named remedy, and `D-56` quoted by id as the reason the remedy is not applied. §4.6 states what the entry supersedes; §4.7 states what it does not claim.

### Task 2 — the source stops arguing from a false premise (`59b0ed5`)

The residual paragraph at `scripts/check-banned-claims.ts` kept its two correct halves — matching is line-oriented, and a global whitespace normalization is refused with its reason — and lost the sentence that argued the bypass needs a wrap falling inside a word. In its place: the shape the reproduction uses, the measured house-style figure with a pointer to the command that produced it, the derived reachable count with its group breakdown, the direction, the live count, the `V-` cross-reference, and `D-56`.

## Verification Evidence

### Measurement one — wrap-REACHABILITY (§4.2)

Derived from `BANNED_CLAIM_LITERALS` itself. A multi-word member is wrap-reachable only if SOME inter-word split leaves neither fragment containing any other pinned member as a case-insensitive substring.

```
total members            = 22
multi-word members       = 16
wrap-reachable members   = 11
standard-name:  4 reachable of 7 member(s)
token-economy:  6 reachable of 7 member(s)
comprehension:  1 reachable of 8 member(s)
```

**The round-7 review published `16 of 22 literals reachable` (`29-REVIEW.md:225-226`). Derived: 11.** The five-member difference is the whole `comprehension` group's longer phrasings, each of which is still matched after any split because the list also pins the bare terms `comprehension` and `understand`, and one of them survives on one of the two lines. The measurement prints each NOT-reachable member with the surviving member that defeats its every split. The review's `6 of 7 token-economy members` is independently re-derived and **CONFIRMED**.

**Numbers carried from a review or a prior register: 0.**

### Measurement two — the LIVE count (§4.3)

Measured over `bannedClaimScan()`'s own corpus, not a hand-picked set: every adjacent non-blank line pair of every scanned document, joined with a single space, asking the 11 reachable members for occurrences visible in the joined projection and in NEITHER source line.

```
scanned documents (denominator) = 117
adjacent non-blank line pairs   = 4126
reachable members asked         = 11
WRAP-ONLY LIVE HITS             = 0
```

Zero hit lines were printed, which is why the hit list is empty rather than omitted. A non-zero result was required to HALT the plan rather than record an accepted bound over live instances.

### Measurement three — the house-style wrap figure (§4.4)

The review reports 822 wraps over 2458 pairs in 60 files but **does not state the predicate**, so it cannot be reproduced. A definition is stated instead — an adjacent pair of non-blank lines where the first's last non-whitespace character is not one of `.` `!` `?` and the second's first non-whitespace character is a lower-case ASCII letter — and the figure re-derived at HEAD:

| source | files | adjacent pairs | wraps | definition recorded? |
|---|---|---|---|---|
| `29-REVIEW.md:197-199` | 60 | 2458 | **822** | **no** |
| derived here, at HEAD | **73** | **2612** | **757** | yes |

**Not reconciled, deliberately.** Three of four numbers disagree and, without the review's predicate, attributing the disagreement to the file set, to the wrap test, or to both would be invented. Both establish the only load-bearing fact: roughly three adjacent non-blank line pairs in ten are mid-sentence wraps — the house style, not an exotic authoring act.

### The reproduction, re-run at HEAD — and its discrimination control

Three mirrors, `git archive HEAD | tar -x`, gate sha256 `9e6253aa…` shown identical to the repository on each, one plant per mirror.

**M1 — the WRAPPED plant** (round 7's four-line paragraph, appended to `agent-factory/workflows/13-incident.md`):

```
M1 exit=0
  PASS  banned claims: 0 findings over 117/117 elements
ALL CHECKS PASSED
grep -c "13-incident" <M1 output>  →  0
```

**M2 — clean control**, separately re-extracted: `exit=0`, `0 findings over 117/117 elements` — the same element count, so M1's green is not the green of a scan that shrank.

**M3 — the DISCRIMINATION control**, a third separate extract. The same claim, same members, same file, on ONE line instead of four:

```
M3 exit=1
  FAIL  banned claims: 3 finding(s) over 117 elements
        agent-factory/workflows/13-incident.md:46:26  — "token economy"
        agent-factory/workflows/13-incident.md:46:67  — "fewer tokens"
        agent-factory/workflows/13-incident.md:46:111 — "saves tokens"
1 CHECK(S) FAILED
```

**M3 is what makes M1 a finding rather than a coincidence.** The only difference is where the newlines fall.

### The corrected residual text, quoted in full

**Deleted** (taken as bytes from `git show b90712b:`, never retyped):

```
// shapes nobody measured. The literals are short enough to sit on one line, and a reviewer who
// wraps one mid-token has written something no reader would parse as a claim either.
```

**Landed** (`scripts/check-banned-claims.ts:65..:93`):

```
// A SECOND, NARROWER RESIDUAL, RECORDED FOR THE SAME REASON — and DIRECTED: FAIL-OPEN. Matching is
// line-oriented, so a pinned literal HARD-WRAPPED ACROSS A LINE BOUNDARY is not matched. The answer
// is deliberately NOT to normalize whitespace before comparing: that would make the comparison
// inexact for every literal in order to reach one wrapping, and an inexact comparison is how a gate
// starts admitting shapes nobody measured. That refusal stands, and it is not what changed here.
//
// WHAT CHANGED IS THE JUSTIFICATION, BECAUSE IT WAS FALSE. This paragraph used to argue that
// reaching the bypass takes a wrap falling INSIDE a word, which no reader would parse as a claim.
// It does not. Round 7's code review and round 7's verifier each independently reproduced it with a
// wrap falling BETWEEN TWO WORDS of a multi-word member — the shape markdown soft-joins back into a
// fully legible sentence, so a reader sees the claim this gate did not. Measured over this
// repository's own prose: 757 mid-sentence hard wraps across 2612 adjacent non-blank line pairs in
// 73 tracked agent-factory markdown files, roughly three pairs in ten. The stated definition of
// that figure and the command that produced it are in docs/audit/29-round8-residuals.md §4.4. It is
// the house style, not an exotic authoring act. An accepted bound argued from a false premise is
// worse than an undisclosed one, so the premise is DELETED rather than softened at this address.
//
// THE REACH IS THE DERIVED ONE, NOT THE MULTI-WORD COUNT. 11 of the 22 pinned members are
// wrap-reachable — 4 of 7 in standard-name, 6 of 7 in token-economy, 1 of 8 in comprehension. It is
// not 16, which is the multi-word count under another name: a split leaving another pinned member
// intact on one of the two lines is still matched, which is how the bare terms in this file's list
// defend their own longer phrasings. LIVE COUNT: 0, measured over the derived corpus rather than
// asserted. Both derivations are recorded, with their commands, at §4.2 and §4.3 of that record.
//
// OPEN, WITH AN ID: V-29-57-01. The named remedy — a SECOND, explicitly named wrap-joined input
// assembly, asked only of the multi-word members and carrying a per-line index so a finding still
// reports the ORIGINATING line — is NOT applied here. D-56 declines it for this round: it is new
// matcher surface against an axis with no live instance, in a phase where each round's fix produced
// the next round's finding. The axis stays visible and counted rather than closed by a heuristic.
```

### Acceptance greps

```
scripts/check-banned-claims.ts  mid-token: 0   (pre-edit 1)   V-29-57-01: 1   (pre-edit 0)
scripts/check-banned-claims.js  mid-token: 0   (pre-edit 1)   V-29-57-01: 1   (pre-edit 0)
"mid-token"  declared in the harness: 1        "V-29-57-01" declared in the harness: 1
```

The superseded word was **captured, not retyped**: read out of `scripts/check-banned-claims.ts:65..:70` as the sole `\bmid-[a-z]+\b` match, and independently out of `29-REVIEW.md` as the sole bolded `**mid-…**` token, the two agreeing.

### RED first, then GREEN, then mutation-proven

**RED, two arms, on two separately extracted pre-edit mirrors** (`git archive` of the round base; gate `.ts` sha256 `b4425ea3…` shown identical to `git show HEAD:`):

```
arm 1 (cross-reference missing):
  AssertionError: the residual record does not cross-reference V-29-57-01: expected 0 to be greater than or equal to 1
arm 2 (superseded word present) — isolated on a second mirror carrying only a probe cross-reference:
  AssertionError: the superseded wrap-shape word returned at line(s) 70: expected 1 to be +0
```

**GREEN after the edit and `npm run build`:** `Tests 1 passed | 117 skipped (118)`.

**Mutation proof, arm 2** — mirror `mirror-mutation-769b`, freshly extracted from HEAD after both commits, the superseded sentence restored from `git show b90712b:` as bytes, twin rebuilt inside the mirror:

```
gate.ts sha256 BEFORE mutation: a8f6a611…  (identical to the repository)
gate.ts sha256 AFTER mutation:  75200fea…
mid-token 1 | V-29-57-01 1
AssertionError: the superseded wrap-shape word returned at line(s) 82: expected 1 to be +0
Tests  1 failed | 117 skipped (118)
```

The id is still present in this mirror, so the failure is attributable to the restored sentence alone.

**Mutation proof, arm 1** — mirror `mirror-mutation-noid-434d`, a separate fresh HEAD extract with the id replaced:

```
V-29-57-01 0 | mid-token 0
AssertionError: the residual record does not cross-reference V-29-57-01: expected 0 to be greater than or equal to 1
```

**Clean control** — mirror `mirror-clean-5ccd`, a further separate fresh extract, gate sha256 `a8f6a611…` identical to the repository: `Tests 1 passed | 117 skipped (118)`, `node scripts/check-banned-claims.js` exit 0.

**Eleven mirrors were extracted across this plan and NONE was reused or reset:** `mirror-wrapplant`, `mirror-control`, `mirror-unwrapped`, `mirror-red-preedit`, `mirror-red-zeroocc`, `mirror-red2-idmissing`, `mirror-red2-zeroocc`, `mirror-red3-idmissing`, `mirror-mutation`, `mirror-mutation-noid`, `mirror-clean`.

### The matcher is untouched — derived, not asserted

```
hunks (new side): [{"start":65,"len":29}]
derived leading-docblock range:            1..142
changed lines OUTSIDE the docblock range:  0
lineHits                     new-side lines 2046..2055   changed lines inside: 0
countBannedClaimOccurrences  new-side lines 2063..2073   changed lines inside: 0
```

`BANNED_CLAIM_LITERALS` sha256 `0d981fd8…` unmoved across `b90712b..HEAD`. The gate's stdout is **byte-identical** (`cmp`) to the pre-plan run, part breakdown included: `kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, overlap 1`.

### The register's own location, before and after

```
bannedClaimScan().length                                  = 117
'docs/audit/29-round8-residuals.md' in the scan set        = false
members of the scan set under docs/                        = 0
```

The register is outside the derived scan set by construction, before and after it grew.

### Full sweep

```
npx vitest run --exclude '**/scripts/e2e/**'
  Test Files  52 passed (52)
  Tests       2130 passed | 2 skipped (2132)      exit 0     (+1 case over 29-56's 2129)
node scripts/check-banned-claims.js    exit 0
node scripts/check-audit-register.js   exit 0
node scripts/check-claim-anchors.js    exit 0
npm run freshness                      exit 0
npx tsc --noEmit                       exit 0
npm run typecheck                      exit 0
git diff --numstat b90712b..HEAD -- .planning/REQUIREMENTS.md              (empty)
git diff --numstat b90712b..HEAD -- docs/audit/29-round7-residuals.md      (empty)
git diff --numstat b90712b..HEAD -- package.json package-lock.json         (empty)
```

## Prohibitions — status

| prohibition | status | evidence |
|---|---|---|
| No wrap-joined input assembly, no whitespace normalization, no second matcher arm; `lineHits()` and every caller byte-unchanged (D-56) | **held** | One hunk at 65..93; 0 changed lines outside the derived docblock range and 0 inside either matcher function; gate stdout byte-identical |
| No number in the disclosure is transcribed | **held** | Each numeric cell in `V-29-57-01` is adjacent to the command that produced it; numbers carried from a review or a prior register: **0** |
| The disproven token-economy finding is not restated as a claim | **held** | `node scripts/check-banned-claims.js` exit 0 after the register landed; the register's location is outside the derived scan set, confirmed by the part breakdown quoted before and after; every literal named in this plan's output is named as a list member being matched |
| No requirement row flipped; `.planning/REQUIREMENTS.md` byte-unchanged; empty `requirements-completed:` | **held** | `git diff --numstat` empty; frontmatter above carries `requirements-completed: []` |
| `docs/audit/29-round7-residuals.md` is not rewritten | **held** | `git diff --numstat` empty across both commits |
| No package installed | **held** | `package.json` and `package-lock.json` byte-unchanged |

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The new case's vacuity floor collided with its own subject and masked the assertion under test**

- **Found during:** Task 2, re-watching RED after the case's section bounds were made derived
- **Issue:** The premise assertion read `expect(section.length).toBeGreaterThan(20)`. The derived residual section on the **pre-edit** source is exactly **20** lines, so the case reds with `the derived residual section is implausibly short: expected 20 to be greater than 20` — **before** either assertion under test ran. A RED transcript accepted at that point would have recorded the case failing for a reason with nothing to do with its subject. This is the vacuity-floor trap this phase has already been bitten by: a floor tuned near the subject's size stops being a premise and becomes a second, accidental subject.
- **Fix:** The floor was lowered to `> 5`, which only catches an extraction that returned nothing, and the real premise was restated as **content** — the section must contain `A SECOND, NARROWER RESIDUAL`, the sub-residual this case is about. An in-source note records the collision and its value's reason so a later editor does not raise the floor back. RED was then re-watched on a **new** fresh mirror and fails on the intended assertion.
- **Files modified:** `scripts/check-banned-claims.test.ts`
- **Commit:** `59b0ed5`

**2. [Rule 3 — Blocking] The plan's `:50..:70` line range for the residual record would have been a set-literal drift site**

- **Found during:** Task 2, writing the SOURCE-SHAPE case
- **Issue:** A first draft policed the residual with `src.split("\n").slice(0, 90)` — a hand-typed range chosen because the corrected block happens to end at line 93 with the cross-reference at 89. Any later growth of the paragraphs above it would move the cross-reference out of the window while the case stayed green.
- **Fix:** The section is now DERIVED from the file's own anchors: from the line carrying `RECORDED RESIDUAL, NOT CLAIMED AWAY` to the next `// ----` docblock rule, with both boundary discoveries asserted. Assertion (1) also moved from a whole-file search to a search inside that derived section, which is strictly stronger — an id parked elsewhere in the file no longer satisfies it.
- **Files modified:** `scripts/check-banned-claims.test.ts`
- **Commit:** `59b0ed5`

No architectural changes were needed and no user decision was required.

## A correction to a project warning, recorded because it was measured

The execution brief carried, from 29-56, the note that *"`tsc` strips comments, so a comment-only `.ts` edit produces a byte-identical `.js`"*. **That is not true of this file's leading docblock.** `removeComments` is not set in `tsconfig.json`, and the compiled twin carries the whole `//` header: this plan's comment-only `.ts` edit produced a **29-insertion / 6-deletion** diff in `scripts/check-banned-claims.js`, and `mid-token` had to be — and was — removed from the twin as well as the source. 29-56's observation held for the address it was measured at, not as a general rule. The acceptance greps above are therefore reported against **both** artifacts.

## Findings recorded rather than fixed

`V-29-57-01` itself is the finding this plan exists to record: the hard-wrap axis is **OPEN**, **FAIL-OPEN**, **11 of 22 members reachable**, **0 live** at HEAD, with a named remedy that `D-56` declines for this round and `D-58` fences out of Phase 29 entirely. §4.7 of the register states plainly what the id does not claim — in particular that the reach of 11 is a property of the current 22-member list and that `0 live` is a measurement at one commit which any prose edit can move, with nothing in the shipped tree that would report the move.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced. The change is one audit-document section, one source comment block with its rebuilt twin, and one test case; every guard remains read-only, Node-stdlib-only, with zero npm dependencies.

## Self-Check: PASSED

- `docs/audit/29-round8-residuals.md` — FOUND (511 lines, §4 present)
- `scripts/check-banned-claims.ts` — FOUND
- `scripts/check-banned-claims.js` — FOUND
- `scripts/check-banned-claims.test.ts` — FOUND
- commit `cc758fd` — FOUND
- commit `59b0ed5` — FOUND
