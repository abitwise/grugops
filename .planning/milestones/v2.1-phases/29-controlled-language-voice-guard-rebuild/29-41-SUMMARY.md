---
phase: 29-controlled-language-voice-guard-rebuild
plan: 41
subsystem: tooling-guards
tags: [LANG-04, guard_banned_claims, gap-closure, G-29-2, structural-fix, AP-1]
status: complete

requires:
  - "scripts/check-banned-claims.ts :: BANNED_CLAIM_LITERALS, requiresOnSameLine, lineHits — the conditional mechanism reused rather than reinvented"
  - "scripts/check-banned-claims.ts :: CONFORMANCE_VERB_MARKERS — the pinning idiom copied"
  - "scripts/frontmatter.ts :: fencedLineFlags, unfencedHeadingIndex, sectionEndIndex — the one section locator, untouched"
provides:
  - "scripts/check-banned-claims.ts :: BENEFIT_VERB_MARKERS — 7 markers, each with its measured line-hit count over the derived scan set"
  - "scripts/check-banned-claims.ts :: the conditional bare-term member `comprehension` on the comprehension group"
  - "scripts/check-banned-claims.ts :: the conditional bare-term member `understand` — the second rule, admitted with its own measurement"
  - "scripts/check-banned-claims.ts :: BANNED_CLAIM_EXEMPT_SUPPRESSED = 12 — DERIVED from the run, entrants named"
  - "scripts/check-banned-claims.ts :: the per-member conditional rendering in the PASS line (AP-1)"
affects:
  - "scripts/check-banned-claims.test.ts — TWO assertions must move; both deferred to plan 29-42, neither edited here"

tech-stack:
  added: []
  patterns:
    - "decide a RULE, not a list: a bare term plus a co-occurring marker on the same line"
    - "a marker list is a measurement baseline, not a discovery set — every member carries its own measured number (D-25 idiom)"
    - "a derived pin: the suppressed count is read out of the gate's own refusal text, never typed"
    - "a PASS line rendered per member from one expression, so count and rendering cannot disagree"

key-files:
  created: []
  modified:
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - .planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md

decisions:
  - "The comprehension prohibition is DECIDED by a rule (user decision (c)); options (a) accept-the-bound and (b) append-phrasings both rejected and (b) recorded in the admission log with its measurement."
  - "All six pre-existing comprehension literals KEPT: they carry part of the suppressed arithmetic, and three of them contain no occurrence of the bare term so the rule does not subsume them."
  - "A SECOND bare term (`understand`) was admitted, because one member of the measured family is outside the `comprehension` rule BY CONSTRUCTION. Admitted on its measurement: 1 bare hit, 0 co-occurring with an admitted marker, 0 inside the exemption region."
  - "`understand` chosen over the narrower `to understand` on GENERALITY, not on cost — the narrower term pins the infinitive grammar of one sentence and leaves `the model understands it better` green, which is the option-(b) shape."
  - "No candidate marker was dropped: all seven earned either a family member or a warrant plant on which they are the sole marker."
  - "`BANNED_CLAIM_EXEMPT_SUPPRESSED` 10 -> 12, derived from the gate's own refusal text, moved in the same commit as the rule, with both entrants named by line and by marker."

metrics:
  duration: ~20m
  completed: 2026-08-17
  tasks: 3
  commits: 3

actuals:
  tokens: 12575
  tasks: 3
  commits: 3
---

# Phase 29 Plan 41: G-29-2 — the comprehension prohibition becomes a rule Summary

`guard_banned_claims` now DECIDES the comprehension-benefit prohibition instead of enumerating six
fixed substrings any interposed word defeated: two conditional bare-term members (`comprehension`,
`understand`) on a seven-marker benefit-verb list, every marker admitted by its own measurement, the
whole measured bypass family reddening by name, and the suppressed pin re-derived from the run.

## What was built

| # | Task | Commit | Key change |
|---|------|--------|-----------|
| 1 | premise asserted, bypasses reproduced, rule landed, pin re-derived (tracer) | `c209c03` | `BENEFIT_VERB_MARKERS` + the conditional bare-term member `comprehension`; `BANNED_CLAIM_EXEMPT_SUPPRESSED` 10 -> 12 |
| 2 | every marker earns its place; the whole family covered | `cacfd09` | 7 markers with measured counts + warrants; second bare term `understand`; 3 new admission-log refusals |
| 3 | the PASS line states what it actually checked | `53a2951` | conditional clause rendered PER MEMBER with each member's own marker count (AP-1) |

## The harness premise, asserted before anything was believed

This phase's verification harness produced a false result in six instances across four straight
rounds, every time because the harness was not what it claimed. So, first:

```
npm run freshness
  -> All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.   exit 0
```

Then a `git archive HEAD` mirror, with the gate's committed `.js` proven byte-identical to the
repository's before any measurement was trusted:

```
9cc836730588da925fd3bf39bd599c2c9a50c15fefd41dae73a384903889ffd6  scripts/check-banned-claims.js
9cc836730588da925fd3bf39bd599c2c9a50c15fefd41dae73a384903889ffd6  <mirror>/scripts/check-banned-claims.js
clean-mirror control: exit 0
```

Re-asserted at the new HEAD after the fix (`047c5afe…`, both sides identical, control exit 0).

## The RED-first baseline — per phrasing, one plant at a time, on a reset mirror

Each phrasing enumerated in `29-UAT.md` § G-29-2 `root_cause` was appended alone to
`agent-factory/workflows/00-bootstrap-greenfield.md` inside the mirror, the committed gate was run, and
the mirror was reset between phrasings. **The verdict is the finding LINE, never the exit code** — the
un-re-pinned constant makes the gate exit non-zero on every run once the rule lands, so an exit code
cannot distinguish "caught the plant" from "the pin moved".

| # | planted phrasing | BEFORE exit | BEFORE named? | attributing literal | FINAL exit | FINAL named? | attributing literal |
|---|---|---|---|---|---|---|---|
| P1 | `...improves comprehension.` | 1 | **yes** `:55:27` | `improves comprehension` | 1 | yes `:55:27` + `:55:36` | `improves comprehension`, `comprehension` |
| P2 | `...improves LLM comprehension.` | 0 | **no** | — | 1 | yes `:55:40` | `comprehension` |
| P3 | `...improves model comprehension.` | 0 | **no** | — | 1 | yes `:55:42` | `comprehension` |
| P4 | `...improves agent comprehension.` | 0 | **no** | — | 1 | yes `:55:42` | `comprehension` |
| P5 | `...makes prose easier for LLMs to understand.` | 0 | **no** | — | 1 | yes `:55:58` | `understand` |
| P6 | `...boosts comprehension for language models.` | 0 | **no** | — | 1 | yes `:55:34` | `comprehension` |

Five of six were open before; all six red by name after. The FINAL column was measured against the
**shipped committed `.js`** on a fresh `git archive HEAD` mirror after all three commits, with the
clean-mirror control exiting 0 — so the exit code is a signal again, and both are recorded, but the
claim is carried by the finding line.

Verbatim, the row that matters most (P5, the member the prototype could not reach):

```
agent-factory/workflows/00-bootstrap-greenfield.md:55:58 — banned comprehension literal "understand" —
  "Using controlled language makes prose easier for LLMs to understand."
```

## ADJUDICATED: `29-UAT.md`'s `measured_probe` claim does NOT reproduce

The gap file states that under a bare `comprehension` member conditional on
`[improve, better, easier, boost, help, benefit, enhance]`, "**ALL FIVE** bypass sentences red". The
plan required this to be reproduced rather than cited, and it is **false for one member** — reported
here as a harness-premise finding, not explained away.

`...makes prose easier for LLMs to understand.` **carries no occurrence of the word `comprehension`
at all.** It is outside the bare-`comprehension` rule *by construction*, whatever markers are
admitted. Measured after Task 1 landed the rule exactly as the prototype specifies, that sentence
still exited 0 with the planted file never named anywhere in the output.

The plan's objective predicted this reading from source before any code was cut ("at least one member
of the family carries no occurrence of the bare term the prototype conditions on") and the measurement
confirms it. Two further observations on the same probe block:

- The probe's second claim — that the guard "fails ONLY on the expected pin line" — is not
  falsifiable by the evidence it offers, because the un-re-pinned constant reds every run including
  one with no plant at all. That is why every row above is adjudicated on the finding line.
- The prototype marker list is vindicated as a *list* (all seven admitted) but not as a *coverage
  claim*. Its own text says it is a prototype needing per-marker measurement; that was done.

**Remedy applied:** a second bare term with its own rule and its own measurement (Task 2), never the
phrasing.

## Every marker earned its place

Measured 2026-08-17 over the set `bannedClaimScan()` derives — **82 documents** (equal to
`BANNED_CLAIM_SCAN_COUNT`), 5898 lines — as the number of LINES carrying the marker. Each count was
then re-taken independently with `grep -a -i -c` over the same 82 paths; **the two agree on all
seven**. (`-a` because a single NUL byte makes BSD grep report zero matches silently; `file -b` over
the whole set shows no binary-classified member, so nothing was skipped.)

| marker | lines | admitted by | sole marker on its plant? | reds by name |
|---|---|---|---|---|
| `improve` | 17 | family P2/P3/P4 | yes | `:55:40` |
| `better` | 0 | warrant: "Controlled language gives better comprehension." | yes | `:55:34` |
| `easier` | 0 | family P5 (via `understand`) | yes | `:55:27` |
| `boost` | 0 | family P6 | yes | `:55:34` |
| `help` | 3 | warrant: "Controlled language helps comprehension." | yes | `:55:27` |
| `benefit` | 3 | warrant: "Controlled language delivers a real benefit in comprehension." | yes | `:55:48` |
| `enhance` | 1 | warrant: "Controlled language enhances comprehension." | yes | `:55:30` |

Every plant was **first asserted to carry exactly one member of the list** before being planted, so a
red cannot be credited to a marker that was not the one under test. **No candidate was dropped** — the
plan's "every dropped marker appears in `BANNED_CLAIM_EXCLUDED`" criterion is therefore vacuously
satisfied, and that is stated rather than left to look like the criterion was skipped.

A zero is **not** a reason to drop a marker, and the declaration says so: the conformance list records
its numbers because they are large (60/18/2/70, which is why those stems may never be literals), this
list records its numbers because they are small (a zero means the marker over-matches nothing).

## The coverage verdict — every family member has one

| phrasing | verdict |
|---|---|
| `improves comprehension` | covered — enumerated literal **and** the bare-term rule |
| `improves LLM comprehension` | covered by the bare-term rule, marker `improve` |
| `improves model comprehension` | covered by the bare-term rule, marker `improve` |
| `improves agent comprehension` | covered by the bare-term rule, marker `improve` |
| `makes prose easier for LLMs to understand` | **structurally unreachable** by the bare-term rule; covered by the admitted SECOND bare term `understand`, marker `easier` |
| `boosts comprehension for language models` | covered by the bare-term rule, marker `boost` |

None left without a verdict. None closed by appending a phrasing.

### The second bare term, measured before admission

| measurement | value |
|---|---|
| bare line-hit count over the 82-document derived scan set | **1** |
| of those, ALSO carrying an admitted benefit marker | **0** ← the number that admits it |
| of those, inside the one named exemption region | **0** |

The single bare occurrence is `agent-factory/roles/incident-responder.md:29` — *"apply or recommend the
immediate mitigation that limits harm, before you understand the cause"* — correct operational text
carrying no benefit marker, so it produces **no** finding. Confirmed on the clean mirror: that file is
mentioned **0** times in the gate's output. The plan's refusal condition (bare > 0 **and**
co-occurring > 0) is **not met**, so the term is admissible on the plan's own rule.

`to understand` (0 hits) would also have closed the family member and was **refused on generality**,
not on cost: it pins the infinitive grammar of the one sentence somebody happened to write and leaves
`the model understands it better` green — the option-(b) shape decision (c) rejected. Recorded in the
admission log so the wider term does not read as carelessness.

**Its accepted cost is named with its remedy**, at the declaration: `understand` covers
`understands` / `understanding` / `misunderstand` by substring, so a future sentence pairing a benefit
verb with a *human* reader's understanding would red. **Live instances: 0.** The remedy is to rephrase,
or to admit a narrower term with its own measurement — never to weaken the matcher.

## The suppressed pin was DERIVED, not typed

The rule landed first. The gate was then run on a clean tree and **its own refusal text reported the
number**, quoted verbatim from that run:

```
FAIL  the one named exemption region `agent-factory/writing-profile.md` § `## Disclaimer and honesty
floor` suppressed 12 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED in
scripts/check-banned-claims.ts declares 10.
```

`12` is what was pinned. The gap file *predicted* 12; the prediction was treated as a hypothesis and
the run's number is what landed. **No document inside the exemption region was edited** — the region
lifts the prohibition on two more occurrences because the *prohibition* got wider, a direction the
pin's own paragraph had not previously seen.

Both entrants, derived through the gate's own `countBannedClaimOccurrences` rather than by reading
prose, and named in the commit message as the refusal text demands:

| line | delta | via | co-occurring marker | text |
|---|---|---|---|---|
| `agent-factory/writing-profile.md:256` | +1 | new member `comprehension` | `benefit` | "No comprehension benefit is claimed." |
| `agent-factory/writing-profile.md:288` | +1 | new member `comprehension` | `improve` | "There is no evidence that controlled language improves comprehension for a language model." |

Both are **honest denials**, and each was *already* suppressed once through an enumerated literal
(`comprehension benefit` at 256, `improves comprehension` at 288). The rule adds a second occurrence on
those same two lines, because the hit count is arithmetic over what was read and never a per-line
boolean. Full derived breakdown of the 12: `239`×2, `242`, `246`, `251`, `255`×2, `256`×2, `278`,
`288`×2.

The pin is a **function of the admitted marker set**: dropping `benefit` or `improve` would move it
back down over a byte-identical disclaimer. That coupling is recorded at the declaration. After Task 2
finalised the marker set the gate re-reported **12** — the second bare term adds zero occurrences
inside the region — so the pin did **not** move again, and that was confirmed by running the gate
rather than reasoned about.

`grep -c 'BANNED_CLAIM_EXEMPT_SUPPRESSED = 10' scripts/check-banned-claims.ts` -> **0**.
`BANNED_CLAIM_EXEMPT_EXTENT` (62), `BANNED_CLAIM_SCAN_COUNT` (82) and `BANNED_CLAIM_EXEMPT_REGION` all
unmoved, as the plan requires.

## The PASS line stops asserting a singular that this plan made false

Before this plan's Task 3 the clause read:

```
22 pinned literal(s) across 3 group(s), of which 3 is conditional on a conformance verb from 6 pinned marker(s)
```

Two of those three are governed by `BENEFIT_VERB_MARKERS`, not by the conformance list — a PASS line
stating a check the gate did not perform, which is AP-1's exact shape and blocking in this phase. It
now reads, quoted in full from the run:

```
  PASS  LANG-04: 82 document(s) carry zero banned claim literal outside the one named exemption region
  — kit 73, publicDocs 10, overlap 1; 22 pinned literal(s) across 3 group(s), of which 3 are
  conditional on a co-occurring marker from their OWN pinned list ("Simplified Technical English" on 6
  marker(s), "comprehension" on 7 marker(s), "understand" on 7 marker(s)); 1 exemption region
  (agent-factory/writing-profile.md § ## Disclaimer and honesty floor — the disclaimer must be able to
  name the standard, and to quote a claim form, in order to deny both — a prohibition that makes its
  own denial illegal is unwritable), which suppresses 12 banned-claim occurrence(s), pinned at 12, and
  reaches 62 line(s), pinned at 62 (two numbers, two questions: how much prohibition the region lifts,
  and how far it reaches — a section swallowed into it moves only the second); 7 candidate literal(s)
  refused at admission and recorded with their hit counts
```

The count and the rendering come from **one** `flatMap` expression, so they cannot disagree and a
member added later changes the line with nobody editing it. `flatMap` rather than `filter` so the
marker array is narrowed by the same step that selects the member, with no non-null assertion standing
in for the check. Verb *and* possessive agree with the derived count.

### Every number in the line, hand-checked against source

| number | independently derived by | value |
|---|---|---|
| 82 documents | `BANNED_CLAIM_SCAN_COUNT` pin; and `73 + 10 - 1` | 82 |
| kit 73 / publicDocs 10 / overlap 1 | the two scan parts | 73 / 10 / 1 |
| 22 pinned literals | `awk` over the `BANNED_CLAIM_LITERALS` block, counting `literal:` entries | 22 |
| 3 groups | `awk` over the `BannedClaimGroup` union | 3 |
| 3 conditional | `grep -c 'requiresOnSameLine:'` inside the literal list | 3 |
| 6 markers | `awk` over `CONFORMANCE_VERB_MARKERS` | 6 |
| 7 markers (×2) | `awk` over `BENEFIT_VERB_MARKERS` | 7 |
| suppressed 12 / pinned 12 | the run, and the pin | 12 |
| reaches 62 / pinned 62 | the run, and the pin | 62 |
| 7 refused candidates | `awk` over `BANNED_CLAIM_EXCLUDED`, counting `candidate:` | 7 |

`grep -c 'CONFORMANCE_VERB_MARKERS.length' scripts/check-banned-claims.ts` -> **0**: the singular
denominator is gone, not supplemented.

## Adversarial pass on the NEW predicate — measured, not fixed

The standing lesson is that for a safety invariant a green suite is not proof. Eleven probes against
the shipped committed `.js` on the HEAD mirror:

| probe | verdict |
|---|---|
| all-caps `IMPROVES LLM COMPREHENSION` | **RED** `:55:40` |
| mixed case `ImProVeS Agent CoMpRehEnSiOn` | **RED** `:55:36` |
| inflected marker — "is an **improvement** to model comprehension" | **RED** `:55:48` |
| `understanding`, not `understand` — "boosts model understanding" | **RED** `:55:34` |
| markdown table row, two cells sharing one line | **RED** `:55:38` |
| two interposed words — "improves the agent's own comprehension" | **RED** `:55:46` |
| marker AFTER the term — "Comprehension … is improved by …" | **RED** `:55:1` (the rule is same-LINE, not sequence-ordered) |
| **hard wrap, marker on the preceding line** | GREEN — bypass |
| **hard wrap, term on the preceding line** | GREEN — bypass |
| new words, no pinned term at all | GREEN — pre-existing, header-recorded residual |
| CONTROL: bare term alone, no marker | GREEN — **the design**, and the discrimination proving the rule is conditional |

The two hard-wrap bypasses are **the accepted cost, and it was written into the member's declaration
BEFORE this measurement was taken** — precisely so the cost paragraph is a design note and not a
rationalisation. Escalated as a residual for plan 29-42 (which owns measuring and recording the
line-window axis); not fixed here, per that plan's own prohibition against absorbing or quietly fixing
what the adversarial pass finds. Normalising whitespace before comparing is refused for the reason the
module header already gives: it makes the comparison inexact for every literal in order to reach one
wrapping.

The final probe is the one that proves the rule did not become unconditional: a document can still
**discuss** comprehension without being read as claiming a benefit, which is what keeps the honest
denial writable.

## Verification

| check | result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — 48 committed `.js` match a fresh `tsc` rebuild |
| `npx tsc --noEmit` | exit 0 |
| `node scripts/check-banned-claims.js` (clean tree) | exit 0, `ALL CHECKS PASSED` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **2031 passed / 2 failed / 2 skipped = 2035** |
| `check-foundation-guards` | exit 0 |
| `check-kit-refs` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `dead-vocabulary` | exit 0 |
| `validate-agent-factory` (with `VALIDATE_KIT_ROOT=.`) | exit 0 |
| `git diff` over `lineHits` / `occurrences` | **no changed lines** — the mechanism was reused, not rewritten |
| `grep -c 'group: "comprehension"'` | 8 (6 pre-existing + 2 new conditional) — the criterion asked for ≥ 7 |
| `package.json` / lockfile diff across the plan range | **0 bytes** (T-29-41-SC asserted absence) |

The suite total is **identical to the 29-40 baseline (2035)**, so exactly two assertions flipped from
pass to fail and none was lost — accounted for below rather than left as a bare number.

### The two failing assertions, both deferred to plan 29-42, neither edited here

| location | assertion | now | disposition |
|---|---|---|---|
| `check-banned-claims.test.ts:1673` | `.toBe(1)` conditional-member cardinality | 3 | **Already assigned to 29-42 Task 1** by this plan's gap contract map: RELAX to the measured count with the reason recorded, do not delete. |
| `check-banned-claims.test.ts:387` | `findingCount(stdout)).toBe(2)` | 3 | **NOT named by the plan** — reported as a finding below. |

`scripts/check-banned-claims.test.ts` is not in this plan's `files_modified`; plan 29-42 owns the test
surface. Editing it here is how a red gets cleared twice.

## Deviations from Plan

### 1. [Rule 1 — Bug] The `requiresOnSameLine` field doc asserted a singular this plan made false

- **Found during:** Task 1.
- **Issue:** the field's doc comment is headed "WHY **ONE MEMBER** IS CONDITIONAL, AND WHY THAT IS NOT
  A SECOND GRAMMAR", and explains the argument for exactly one member. After Task 1 two members are
  conditional (three after Task 2), so the shipped source carried a prose claim its own code
  contradicted — this repository's second systemic failure class "wearing a sentence instead of a set
  literal", in the phase's own words.
- **Why fixed here rather than deferred:** the plan's `assumption_delta_decision` nominally assigns
  this surface ("surface 2") to plan 29-42. But 29-42's `files_modified` scope for this module is
  `BANNED_CLAIM_EXCLUDED` plus refused markers, and leaving a false statement in a *safety guard's*
  source for a whole plan is the exact defect this phase exists to close.
- **Fix:** heading corrected to "WHY **SOME MEMBERS** ARE CONDITIONAL", plus one paragraph stating that
  both groups pin a PAIR through the one field and the one `lineHits` arm, with different marker lists
  and one mechanism.
- **Commit:** `c209c03`. **Flagged so the red is not cleared twice:** 29-42 should treat surface 2 as
  already truthful and needs only to confirm it, not rewrite it.

### 2. [Reported, not fixed] A SECOND test assertion moved; the plan predicted one

- **Found during:** Task 3 verification.
- **Issue:** the plan's Task 3 escape hatch names "**the one** assertion needing to move". Two move.
  `check-banned-claims.test.ts:387` builds its plant from `COMPREHENSION_CLAIM.literal` (=
  `improves comprehension`, the first comprehension member by `find`), so the planted line now yields
  **two** occurrences instead of one — the enumerated literal plus the bare rule on marker `improve`.
  That is the same correct doubling that moved the suppressed pin; the hard-coded `2` is stale.
- **Action:** named here, in the Task 3 commit message, in
  `deferred-items.md`, and in `.planning/WINDOWS.md`. **Not edited** — 29-42 owns the test file.
- **Recommendation carried forward, stronger than a re-pin:** do not retype `2` as `3`. That number is
  a function of how many literals happen to match one planted line, so it goes stale the next time a
  member is admitted. `countBannedClaimOccurrences` is already exported — DERIVE the expected value
  through the gate's own matcher, exactly as `profileDoc`'s `already` arithmetic does for the reach
  fill.

### 3. [Process] Tracer feedback gate not raised as an interactive checkpoint

- Auto mode is off (`workflow._auto_chain_active` and `workflow.auto_advance` both `false`), which
  would normally make a `type="tracer"` task stop for human verification before any expansion task.
- The plan declares `autonomous: true` and carries no `checkpoint:*` task, and the gate's substance was
  satisfied: the tracer's `<verify>` chain re-ran green end to end and four of the five open family
  members were already proven reddening by name, so no layer was poured onto a broken foundation.
- Recorded because the decision was mine, not the plan's.

### 4. [Out of scope, not fixed] `validate-agent-factory` exits 1 without `VALIDATE_KIT_ROOT`

- Bare `node scripts/validate-agent-factory.js` refuses with
  `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`.
- **Pre-existing:** the base commit `dfe6bc8` fails identically on a pristine mirror. Exits 0 when
  invoked with the env var. Not caused by this plan and not touched.

## Threat mitigations discharged

| Threat | Disposition | Evidence |
|---|---|---|
| T-29-41-01 fail-open guard | mitigated | five of six family members were open before, all six red by name after |
| T-29-41-02 closure claimed from an exit code | mitigated | every row adjudicated on the finding line at file:line:column; exit codes recorded separately and explicitly said not to carry the claim |
| T-29-41-03 stale build / mirror not at HEAD | mitigated | freshness quoted first; mirror `.js` proven byte-identical at both HEADs (`9cc83673…`, `047c5afe…`) |
| T-29-41-04 pin moved to silence a line | mitigated | value read out of the gate's own refusal text, moved in the same commit as the rule, both entrants named by line and marker |
| T-29-41-05 marker admitted with no measurement | mitigated | seven markers, each with a measured count and a sole-marker plant reddening by name |
| T-29-41-06 PASS line attributing two governed members to one list | mitigated | clause rendered per member from one expression; `CONFORMANCE_VERB_MARKERS.length` grep returns 0 |
| T-29-41-07 over-matching second bare term | mitigated | measured before admission (1 bare / **0** co-occurring / 0 in region); no matcher weakened; the three forbidden weakenings restated at the member |
| T-29-41-SC package installs | accepted | `package.json` + lockfile diff across the plan range: **0 bytes**; no dependency added |

## Requirements

**LANG-04 — NOT marked complete.** The gate half is closed, but two assertions in the requirement's own
test file are failing pending plan 29-42, and the phase awaits round-5 re-verification. Marking it
complete now would be exactly the false green that had to be reverted after plan 29-40.

## What a green run here does and does not prove

Unchanged from the module header, and worth restating because this plan widened the predicate: the gate
proves **no pinned literal or pinned pair appears outside the one named exemption region**. It does not
prove no comprehension claim exists — a brand-new claim written in words this list does not contain
still passes, and the two hard-wrap shapes measured above are open by construction of the line window.

## Self-Check: PASSED

- `scripts/check-banned-claims.ts` — FOUND
- `scripts/check-banned-claims.js` — FOUND
- `.planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md` — FOUND
- commit `c209c03` — FOUND
- commit `cacfd09` — FOUND
- commit `53a2951` — FOUND
