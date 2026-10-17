---
phase: 29-controlled-language-voice-guard-rebuild
plan: 23
subsystem: tooling / audit gates
tags: [LANG-04, LANG-07, WR-02, WR-08, section-locator, fence-authority, exemption-reach]
requires:
  - "scripts/frontmatter.ts — fencedLineFlags, unfencedHeadingIndex, sectionEndIndex (plan 29-20's one authority)"
  - "agent-factory/writing-profile.md § `## Disclaimer and honesty floor` — the one named exemption region, READ but never modified"
provides:
  - "scripts/check-banned-claims.ts :: locateExemptRegion — delegating, zero private section predicates"
  - "scripts/check-banned-claims.ts :: BANNED_CLAIM_EXEMPT_SUPPRESSED — the exemption's REACH, pinned two-sided"
  - "scripts/check-banned-claims.ts :: countBannedClaimOccurrences — the one matcher, exported so a case can derive the reach independently of the run that publishes it"
affects:
  - "scripts/check-foundation-guards.test.ts (this module's frontmatter consumer-symbol pin moves from one symbol to three)"
tech-stack:
  added: []
  patterns:
    - "when a header and its code disagree, correct the HEADER — a prose claim wider than the assertion behind it is a set literal wearing a sentence"
    - "give a relaxation a MECHANISM, not an argument: publish what it bought and pin the number two-sided"
    - "pin the quantity the decision is ABOUT (suppressed occurrences), not the quantity that happens to be measurable (exempt lines)"
    - "one matcher, two callers — the number an exemption suppresses must be counted by the same code that would have reported it"
    - "derive the fixture from the pin, then assert the fixture reached it"
key-files:
  created: []
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "The exemption's reach is pinned on SUPPRESSED OCCURRENCES (10), not on exempt lines (62) — a line count moves on a reflow and teaches authors that the pin is noise (D-44)."
  - "The plan's premise that the paired NEGATIVE case is missing is FALSE: the outer bound was already asserted at check-banned-claims.test.ts:538 and the new case PASSED at HEAD. Kept as specified, recorded as an untested-by-name property rather than a live defect."
  - "The consumer-symbol pin moved in Task 2's commit rather than Task 3's, so no commit in this plan leaves the suite red — the same correction plan 29-22 made."
  - "The rewire's `trimEnd()` adoption is a real behaviour change with no case behind it; two were added (trailing space located AND counted, leading space still refused), because an unpinned widening is the shape this whole round exists to delete."
  - "The mirror's exemption region is filled to the declared reach through the gate's OWN counter, with a harness-premise case asserting it lands on the pin — a fixture derived from a pin still has to be shown to reach it."
metrics:
  duration: 30m
  completed: 2026-08-15
actuals:
  tokens: 16000
  tasks: 3
  commits: 3
status: complete
---

# Phase 29 Plan 23: The Exemption That Now Says How Far It Reaches Summary

`check-banned-claims.ts` declares no section predicate of its own, the header block that asserted
nothing had been relaxed now states the relaxation plan 29-18 actually made, and the amount of
prohibition the one named exemption lifts is published on every run and pinned two-sided — proven to
fire in both directions on a planted mirror.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | RED — the outer bound and the unmeasured reach | `3355a49` | check-banned-claims.test.ts |
| 2 | The locator consumes the authority; the header states the direction the code takes | `7eaa05b` | check-banned-claims.ts/.js/.test.ts, check-foundation-guards.test.ts |
| 3 | Prove the reach cannot move silently, in both directions | `32a6a0a` | check-banned-claims.test.ts |

## HEAD Transcripts, Verbatim

Three cases were written before any fix. Their HEAD status was recorded either way, per the plan.

### The REACH case — FAILED at HEAD, which is the point

```
 FAIL  scripts/check-banned-claims.test.ts > check-banned-claims — the exemption's outer bound and its published reach (WR-02) > REACH: the gate PUBLISHES how many banned-claim occurrences the exemption suppresses, and the number is PINNED
AssertionError: check-banned-claims.ts exports no occurrence counter, so the exemption's reach is measured by nothing: expected 'undefined' to be 'function'

Expected: "function"
Received: "undefined"
```

Nothing anywhere measured how much prohibition the exemption lifts. A future widening would have
been exactly as invisible as 29-18's was.

### The OUTER BOUND case — PASSED at HEAD

```
 ✓ … > OUTER BOUND: a claim below the fenced `## ` AND below the REAL later `## ` heading is still reported 39ms
```

**The plan's premise here is false, and it is recorded rather than rounded away.** See Deviation 1.

### The level-one measurement case — PASSED at HEAD

```
 ✓ … > MEASURED: every level-one heading in the live exemption document below line one is FENCED and sits ABOVE the region 0ms
```

## The Measured Suppressed-Occurrence Count, and the Command That Derived It

**10.** Derived at execution, never transcribed — the plan deliberately states no expected value,
because a transcribed expectation is the set-literal drift this repository has corrected three times.

```bash
node -e '
const fs=require("node:fs");
import("./scripts/check-banned-claims.js").then(m=>{
  const lines=fs.readFileSync("agent-factory/writing-profile.md","utf8").split("\n");
  const r=m.locateExemptRegion(lines);
  let total=0;
  for(let i=r.headingAt;i<r.endBefore;i++){
    const lower=lines[i].toLowerCase();
    for(const mem of m.BANNED_CLAIM_LITERALS){
      if(mem.requiresOnSameLine!==undefined && !mem.requiresOnSameLine.some(v=>lower.includes(v.toLowerCase()))) continue;
      const n=mem.literal.toLowerCase();
      let at=lower.indexOf(n);
      while(at!==-1){ total++; at=lower.indexOf(n,at+n.length); }
    }
  }
  console.log("SUPPRESSED OCCURRENCES:",total);
});'
```

The ten occurrences, with their positions in `agent-factory/writing-profile.md`:

| Line:col | Literal |
|---|---|
| 159:10 | `ASD-STE100` |
| 159:77 | `ASD-STE100` |
| 162:72 | `ASD-STE100` |
| 166:1 | `ASD-STE100` |
| 171:28 | `ASD-STE100` |
| 175:20 | `ASD-STE100` |
| 175:80 | `token-economy` |
| 176:13 | `comprehension benefit` |
| 198:12 | `token-economy` |
| 208:47 | `improves comprehension` |

The region spans 62 lines. **The pin is on the 10, not on the 62** — a reflow of the disclaimer moves
62 and lifts nothing, and a pin that reds for no reason is a pin authors learn to move without
reading.

## The Widening, Reproduced

The round-2 review's WR-02 measurement was re-derived here rather than quoted. On the review's own
fixture — a region carrying a fenced `## ` line, followed by a real `## ` heading:

| Locator | `endBefore` | Exempt BODY lines |
|---|---|---|
| pre-29-18 (fence-blind `/^## /`) | 11 | **4** |
| post-29-18 (fence-aware) | 16 | **9** |

Four became nine. The header directly above that change asserted `NOTHING BELOW IS RELAXED` and that
both truncation directions were fail-closed. A longer exemption is **less** checking.

## The Corrected Header, Verbatim

Replacing the paragraph that denied it (`scripts/check-banned-claims.ts`, above `locateExemptRegion`):

```
 * WHAT PLAN 29-18 ACTUALLY DID TO THIS EXEMPTION, STATED PLAINLY BECAUSE THE PARAGRAPH THAT USED TO
 * SIT HERE DENIED IT.
 *
 * The text this replaces asserted that nothing below was relaxed and that both truncation directions
 * were fail-closed. The first half was false. Making the close fence-aware moved the region's END
 * LATER, so strictly FEWER lines of the disclaimer document are scanned. Measured on the fixture the
 * round-2 review used, and reproduced in scripts/check-banned-claims.test.ts, the region's body went
 * from FOUR exempt lines to NINE. A LONGER EXEMPTION IS LESS CHECKING, NOT MORE. That is a
 * relaxation of a safety exemption, and a header claiming otherwise is a prose claim wider than the
 * assertion behind it — this repository's second systemic failure class wearing a sentence instead
 * of a set literal.
 *
 * WHY THE RELAXATION IS NONETHELESS RIGHT. A `## ` line the author wrote INSIDE a fenced example is
 * documentation and never structure. A region that stopped at one was not exempting fewer lines on
 * purpose; it was measuring the wrong bytes, and it truncated the disclaimer at the first heading
 * the disclaimer happened to QUOTE. The extra lines were always meant to be inside the region.
 *
 * AND THE RELAXATION IS GIVEN A MECHANISM RATHER THAN AN ARGUMENT. `BANNED_CLAIM_EXEMPT_SUPPRESSED`
 * below pins how many banned-claim occurrences this region actually lifts the prohibition on, the
 * gate publishes that number on every green run, and the two are compared two-sided. A future
 * widening is then an acknowledged edit with a reason, never a side effect of a heading landing
 * somewhere new — which is exactly how the widening above went unnoticed.
 *
 * THE ASYMMETRY WITH ITS SIBLING SURVIVES, AND IT IS THE HALF THAT WAS ALWAYS TRUE. Truncating THIS
 * region causes MORE of the document to be checked, so truncation here is fail-CLOSED. The sibling
 * locator in check-diff-disposition answers the same shape of question about a FROZEN region, and
 * truncation there is fail-OPEN — LESS gets protected. The two are NOT one bug at two addresses, and
 * a reader meeting both fixes in one round should not have to infer which is which.
```

The asymmetry note is deliberately worded to match `29-22-SUMMARY.md`'s, so the two read as one
matched pair rather than as two independent opinions.

## The Published PASS Line

```
  PASS  LANG-04: 82 document(s) carry zero banned claim literal outside the one named exemption
  region — kit 73, publicDocs 10, overlap 1; 20 pinned literal(s) across 3 group(s), of which 1 is
  conditional on a conformance verb from 6 pinned marker(s); 1 exemption region
  (agent-factory/writing-profile.md § ## Disclaimer and honesty floor — …), which suppresses 10
  banned-claim occurrence(s), pinned at 10; 4 candidate literal(s) refused at admission and recorded
  with their hit counts
```

## The Level Widening, Measured

`sectionEndIndex(…, 2)` closes on any heading of level at most two, where the deleted predicate
closed on `## ` only. Measured this session over `agent-factory/writing-profile.md`:

| Level-one heading line | Fenced? | Above the region heading (155)? |
|---|---|---|
| 106 | yes | yes |
| 109 | yes | yes |
| 112 | yes | yes |
| 115 | yes | yes |
| 118 | yes | yes |

**Five members, every one fenced, every one above the exemption heading** — matching the plan's
measurement exactly. The widening can only make the region end EARLIER (more gets checked, the
fail-CLOSED direction), and on this corpus it moves nothing. The case asserts the PROPERTY with a
non-vacuity floor first, not the line numbers: freezing 106/109/112/115/118 would red on a reflow of
a document this plan does not own, which is the same reasoning that puts the reach pin on
occurrences rather than lines.

## Gate Numbers, Before and After

| Measurement | Before (`9351a77`) | After (`32a6a0a`) |
|---|---|---|
| `check-banned-claims` | exit 0, `0 findings over 82/82 elements` | identical, plus `suppresses 10 … pinned at 10` |
| `locateExemptRegion` on the live profile | `{"headingAt":154,"endBefore":216}` | **byte-identical** |
| `check-foundation-guards` | exit 0 | exit 0 |
| `check-imperative-lexicon` | exit 0, `0 findings over 19/19` + `0 findings over 47/47` | identical |
| `check-diff-disposition` | exit 0, `37 changed since 4d2b8f0; 1880 clause(s); 1532 row(s)`, `0 findings over 37/37` | identical |
| `check-audit-register` / `check-claim-anchors` | exit 0 | exit 0 |
| `npm run freshness` | 48 committed `.js` fresh | 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 | exit 0 |

**Not one published number moved.** This fix is behaviour-preserving on the live corpus, so its proof
is a planted input and never a moved number. Full regression:
`npx vitest run --exclude '**/scripts/e2e/**'` → **51 files, 1847 passed, 2 skipped**. 29-22 left
1838 passed; this plan adds exactly the 9 cases below, and 1838 + 9 = 1847.

## Mutation Proof — Six Runs, Each With Its Own Premise Asserted

The harness refuses to report unless the committed `.js` **hash actually moved** and `tsc` accepted
the mutation. Both are the failure modes that produced false results in 29-20 and 29-22.

| Mutation | Premise | Cases that failed |
|---|---|---|
| M1 the suppressed-pin refusal DELETED | artifact moved, tsc ok | both falsifiability cases (2) |
| M2 `trimEnd()` dropped from the heading COUNT | artifact moved, tsc ok | the trailing-whitespace case (1) |
| M3 bound narrowed to level ONE | artifact moved, tsc ok | region-end, paired plant, extent, OUTER BOUND, appended-section (5) |
| M4 the reach not PUBLISHED on the PASS line | artifact moved, tsc ok | the REACH case (1) |
| M5 exempt lines skip the matcher again | artifact moved, tsc ok | 11, including the live-tree case |
| M6 a PRIVATE fence-blind close re-declared beside the authority | artifact moved, tsc ok | the four WR-06 fence-awareness cases (4) |

Every pinned axis is owned by at least one case that fails when that axis breaks. M2 is the one that
matters for the count/position split: it proves the exactly-one COUNT really does apply the
authority's equality and not a second one.

## The Nine New Cases

| Case | What it pins |
|---|---|
| OUTER BOUND | a claim below the fenced `## ` **and** below the real later `## ` is still reported |
| REACH | the published number equals the declared constant, derived independently |
| HARNESS PREMISE | the mirror's region really reaches the pin; the filler really carries one occurrence |
| trailing whitespace | the authority's `trimEnd()` equality is applied by **both** the count and the position |
| leading whitespace | the bound on that equality — a leading space is still not the heading |
| FALSIFIABLE UP | one additional claim inside the region reds, naming both numbers |
| FALSIFIABLE DOWN | one fewer claim also reds — two-sided |
| WIDENING NOT OPEN-ENDED | an appended real section's claim is reported **and** the reach is unmoved |
| MEASURED level-one | every level-one heading in the exemption document is fenced and above the region |

## Deviations from Plan

### 1. [Rule 1 — the plan asserts a fact its own repository falsifies] The "missing" paired NEGATIVE case was already there

- **Found during:** Task 1, at the first RED run, by reading the per-case status rather than the file total.
- **Truth affected:** *"The missing paired NEGATIVE case ships: a banned claim sitting below a fenced
  `## ` line AND below a later REAL `## ` heading is still reported. The existing paired-plant case
  covers only the second half, so the widening's outer bound has never been asserted."*
- **Measured:** `scripts/check-banned-claims.test.ts:538`, *"PAIRED PLANT: the region's REAL end still
  ends it — the same claim below that end IS reported"*, landed by plan 29-18, already builds exactly
  that document and already asserts exactly that property, including the derived line number. The new
  case **PASSED at HEAD**.
- **Resolution:** kept, as the plan's own acceptance criterion directs. It is not a duplicate for
  free: it drops the in-region claim so the fixture measures the region's REACH rather than its
  coverage, and it asserts the quoted heading is genuinely flagged fenced by the one authority before
  the verdict — a premise the 29-18 case does not check, and without which the fixture could measure
  an ordinary region end while appearing to measure the widening.
- **Stated plainly:** this was an **untested-by-name property, not a live defect.** M3 and M6 confirm
  it is now non-vacuous: both mutations red it.

### 2. [Rule 3 — blocking] Task 2 could not land without editing the test file, which its `<files>` list does not name

- **Found during:** Task 2, immediately after the reach pin built green on the live tree.
- **Issue:** `BANNED_CLAIM_EXEMPT_SUPPRESSED` is two-sided and applies inside the hermetic mirror,
  and the mirror's synthetic profile carried **zero** banned claims in its region. Five mirror cases
  went red — for a reason with nothing to do with what any of them asserts.
- **Fix:** `profileDoc()` fills the region to the declared reach, subtracting whatever the caller's
  `regionBody` already carries, counted through the gate's **own** exported counter rather than a
  second matcher typed in the test. This is the pattern the file already uses for
  `BANNED_CLAIM_SCAN_COUNT` (`FILLER_COUNT = COUNT − 11`), so the fixture tracks the pin instead of
  being re-typed beside it.
- **And the fixture is asserted to reach it.** A derived fixture is still a fixture: a new
  HARNESS PREMISE case checks that the filler sentence carries exactly **one** occurrence and that
  the default mirror's region lands on exactly `BANNED_CLAIM_EXEMPT_SUPPRESSED`. Without it, a filler
  carrying two occurrences would put every mirror at some other number and the ±1 falsifiability
  cases would still red — for the wrong reason, and indistinguishably.
- **The empty-region case takes `reach: 0` explicitly,** because filling it would contradict the
  property it exists to assert.

### 3. [Rule 2 — missing critical functionality] The rewire's `trimEnd()` adoption had no case behind it

- **Found during:** Task 3, at mutation design, when M2 (`trimEnd()` dropped from the count) initially
  reddened nothing.
- **Issue:** the deleted predicate compared the heading line RAW (`lines[i] === heading`). The shared
  authority normalises with `trimEnd()`. So `## Disclaimer and honesty floor ` went from being refused
  outright (`occurs 0 time(s)`) to being a located, exempt region. That is a real widening the plan
  describes only as "the axis on which the four deleted predicates disagreed" — and **no case
  anywhere pinned it**, in a plan whose entire subject is unpinned widenings.
- **Fix:** two cases, both directions. A trailing space is located **and** counted — the second half
  matters, because had only the position adopted the authority's equality, the count would have found
  zero headings and refused before the region was ever located, which is 29-20's own Deviation 3 one
  module over. A **leading** space is still not the heading, preserving the column-zero convention
  four gates share.

### 4. The consumer-symbol pin moved in Task 2's commit, not Task 3's

The plan assigns the `check-foundation-guards.test.ts` pin move to Task 3, but Task 2's import is what
makes the pin red, so deferring it would have committed a tree with a failing suite. The pin — and
the full comment the plan specifies, including the direction note distinguishing this fail-CLOSED
truncation from 29-16's and 29-22's fail-OPEN one — landed in `7eaa05b`. This is the same correction
plan 29-22 made for the same reason. Verified by `git diff 3ed76c1 -- scripts/check-foundation-guards.test.ts`:
the `check-imperative-lexicon.ts` entry is **byte-unchanged**, and the tree-wide grant-predicate zero
still holds.

## What Was Deliberately Not Touched

Confirmed by `git diff`:

- The exactly-one refusal text, the empty-region refusal text and the pinned literal set are
  **byte-unchanged**. The only edit inside the exactly-one refusal is the identifier interpolated into
  it (`headings.length` → `headingCount`); the rendered bytes are identical, which the two cases
  asserting `occurs 2 time(s)` / `occurs 0 time(s)` and `DUPLICATED region widens` confirm.
- `scripts/frontmatter.ts` — the authority is consumed, never widened. No opt-out parameter was added
  and none exists.
- `agent-factory/writing-profile.md` — **not modified**. Its bytes are the subject of the measurement,
  not of an edit. No file in the LANG-03 watched corpus changed, so **no disposition row is owed**
  under `docs/audit/29-style-dispositions/` and none was invented.
- `BANNED_CLAIM_SCAN_COUNT`, the derivation refusals, the per-part vacuity floor and every other
  refusal wording. This is a locator-and-honesty change, not a semantics change.

## Residuals Named, Not Absorbed

- **One heading equality still lives in this module, deliberately.** The exactly-one refusal needs a
  heading COUNT, and `unfencedHeadingIndex` answers "the FIRST such line". Wrapping it in a
  "find the next one after `i`" loop would be a second traversal with its own termination behaviour —
  the shape this round is deleting. The count therefore takes `fencedLineFlags` directly and applies
  the authority's own `trimEnd()` equality, which M2 proves. Note that plan 29-22's derived-site
  classifier would flag this expression as construct 0 (LOCATE by whole-line equality); that
  classifier is **scoped to `check-diff-disposition.ts`** and no pin covers this module, so the
  exemption is recorded here rather than left for a tree-wide derivation to trip over later.
- **The reach pin is corpus-coupled to the mirror.** Every mirror in
  `check-banned-claims.test.ts` must now land on `BANNED_CLAIM_EXEMPT_SUPPRESSED`. That coupling is
  what makes the pin fire inside a mirror at all, but it means a future case that plants inside the
  region must either pass `reach:` or accept the filler arithmetic. The HARNESS PREMISE case is what
  makes a mistake there loud rather than silent.
- **`scripts/audit-model.ts::tableUnder` still carries a private section locator of this class.**
  Logged by 29-22, still out of scope, still unfixed.
- **`check-imperative-lexicon.ts` is the last consumer holding a private section-end predicate.**
  Plan 29-24 moves it. Until then LANG-07 is not closed; this plan closes the third of four.
- **The reach pin measures OCCURRENCES, not risk.** Ten occurrences of six distinct literals is not
  the same claim as "the exemption is small". It is the quantity an exemption decision is about, and
  it is two-sided — that is all it asserts.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-23-SC` had an empty input set as predicted: no package-manager install occurred and
`package.json` is unchanged. `T-29-23-05` (the level widening) is accepted with its measurement
recorded above rather than mitigated with a carve-out, exactly as the register directs.

## Self-Check: PASSED

- `scripts/check-banned-claims.ts` — FOUND. `SAME_LEVEL_HEADING` has **zero** occurrences; the
  private exact-equality heading match is gone; `locateExemptRegion` delegates to
  `unfencedHeadingIndex` and `sectionEndIndex`.
- `scripts/check-banned-claims.js` — FOUND, fresh (48 committed `.js` match a fresh rebuild).
- `scripts/check-banned-claims.test.ts` — FOUND (9 new cases; 41 total in the file, 32 before).
- `scripts/check-foundation-guards.test.ts` — FOUND (this module's pin lists three symbols; the
  `check-imperative-lexicon.ts` entry byte-unchanged).
- commit `3355a49` — FOUND
- commit `7eaa05b` — FOUND
- commit `32a6a0a` — FOUND
</content>
</invoke>
