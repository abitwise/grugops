---
phase: 29-controlled-language-voice-guard-rebuild
plan: 47
subsystem: testing
tags: [audit, adversarial, residual-register, banned-claims, harness-premise, reconciliation]

requires:
  - phase: 29-43
    provides: the 115-document corpus every measurement in this record is taken over
  - phase: 29-44
    provides: the deleted co-occurrence apparatus whose absence this record measures, and the nine plants it re-runs
  - phase: 29-45
    provides: WR-06's disposition and the type-level tripwire this record verifies has a successor property
  - phase: 29-46
    provides: a tree at freshness exit 0, so the final tree this record adjudicates is the tree that ships
provides:
  - "`docs/audit/29-round6-residuals.md` — the round's disposition record in rounds 4 and 5's idiom, third instance of one shape"
  - "the NINTH false harness result of this phase, produced by THIS pass and caught before publication — a plant that never landed rendering as a fail-open bypass of the sole carve-out"
  - "four degrees of freedom named in writing BEFORE the attack log, each with why the change created it"
  - "44 attempts, one plant per reset mirror, 11 of them aimed at the exemption region including two boundary-STABILITY attacks"
  - "nine plants re-run on the FINAL tree with a measured 0-to-named movement in both directions on the same harness"
  - "`V-29-42-01`, `-02`, `-04` CLOSED BY CONSTRUCTION, each with a closing MEASUREMENT rather than the obvious argument"
  - "`V-29-42-03` CLOSED and recorded as TRUE rather than vacuously true, with which side closed it stated"
  - "six residuals opened and LEFT OPEN: `V-29-47-01` through `-06`"
  - "the twelve-row reconciliation verified against SUMMARY evidence, with SUPERSEDED distinguished from DONE"
affects: [29-verification-round6, the round-6 residual register, .github/workflows/ci.yml drift]

actuals:
  tokens: 24987
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Assert the harness's premise on BOTH SIDES. Nine false results in this phase; eight were about the OUTPUT (the gate did not run). The ninth was about the INPUT — the plant did not land — and it renders identically to a fail-open bypass."
    - "A residual closed BY CONSTRUCTION still gets a closing measurement: show the construct ABSENT rather than unused, then re-run the reproduction that opened it."
    - "When a residual closes, ask separately whether the SURFACE it pointed at closed. Two of the three window residuals closed as described while the false-positive surface migrated to another id."
    - "Name the degrees of freedom the round's own change introduces, in writing, BEFORE the attack log — then label every attempt with the one it aims at."
    - "A stale-prose grep finds only prose someone marked. The one block written in the live present tense with no date and no marker is the one every grep passes over."

key-files:
  created:
    - docs/audit/29-round6-residuals.md
  modified: []

key-decisions:
  - "The round-2 R2 result was REFUSED rather than published. exit=0 with both pins unmoved on a claim planted at the region's last line reads as the most serious finding this phase could produce; the plant had not landed, and the harness was corrected before any verdict was believed."
  - "No residual found by the pass was FIXED. Six were opened, measured, directed, counted and escalated — including two in files this plan could have reached in one edit."
  - "`V-29-42-02` and `-04` are recorded as CLOSED BY CONSTRUCTION *as described*, with the migration of their false-positive surface into `V-29-44-01` stated in the same breath. Recording only the closure would have been the silent drop this file exists to prevent."
  - "No `V-` id was opened for CR-02, against the round-5 verification's explicit `missing:` bullet. That bullet's own condition (\"even if the structural closure is deferred\") did not hold, and an id against a deleted mechanism is a live residual with a permanently zero count — AP-1."
  - "The probe arithmetic is labelled CARRIED, not re-derived. No round-6 plan carries a `probe_coverage` block and COVERAGE.md is not the probe register; saying so is more honest than transcribing a number and calling it derived."
  - "`LANG-04`'s tree status was recorded as a finding rather than corrected. A plan correcting its own requirement's status is the defect, not the fix."

patterns-established:
  - "Assert that the PLANT LANDED, not only that the gate ran. A needle-present check in the mirror file, per attempt."
  - "Where an attempt produced a named finding quoting its own planted sentence verbatim, the landing is proven by the transcript itself — state that rather than re-running it."
  - "Confirm gate wiring by reading the CI file, not by asserting it. The reading found the workflow describing both widened gates at their pre-widening scope."

requirements-completed: []

coverage:
  - id: D1
    description: "The adversarial pass attacks the axis THIS round's change introduces, and the pass is directed rather than assorted"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "four degrees of freedom named in writing before the log (substring reach, non-prose positions, the region as SOLE carve-out, term membership), each with the sentence explaining why the change created it; every one of 44 attempts labelled with the one it aims at"
        status: pass
      - kind: integration
        ref: "git-archive mirror at base 223df86, gate sha256 6f0722fa...b385ba verified byte-identical to the repository's, clean-mirror control at exit 0/1237 B; one plant per reset mirror; adjudication on the rendered finding line"
        status: pass
    human_judgment: false
  - id: D2
    description: "The exemption region — made the SOLE carve-out by D-53 — is attacked at its boundary and for its stability"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "eleven region attempts: five boundary positions (R1, R2, R2b, R3, R5) and four stability attacks (R4, R6, R6b, R7, R8, R9), both pins recorded for each. Ten behave correctly and loudly; R6b is green and is opened as V-29-47-03"
        status: pass
      - kind: other
        ref: "measured on the final tree: headingAt=234, endBefore=296, lines.length=296 — endBefore === lines.length, so the carve-out is unbounded at the bottom (V-29-47-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-53's closure is proven in both directions on the same harness — a measured 0-to-named movement"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "the four unlisted conformance verbs (follows, meets, adheres to, is written in) re-run on the FINAL tree, all four exit 1 named at file:line:column against 29-44's pre-change transcripts where each produced none; conforms-to control unmoved at :45:29 in both"
        status: pass
      - kind: integration
        ref: "the five round-5 comprehension bypasses re-run on the FINAL tree, all five red by name; nine plants, nine measured movements, both tables quoted side by side"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every carried residual carries a count THIS round produced, and the three closed by construction carry a closing measurement"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "construct absence SHOWN on three axes: grep 0/0/0 over three identifiers x three files; member key union ['group','literal'] with 0 third properties and 0 list-valued fields; lineHits quoted in full with no conditional arm"
        status: pass
      - kind: integration
        ref: "the five reproductions that opened V-29-42-01/-02/-04 (round-5 A1, A2, A3, A10, A11) re-run on the final tree, each now RED and each attributed to the bare term alone; live counts re-derived over 115 documents / 7380 lines -> 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "All twelve round-5 findings are reconciled against SUMMARY evidence, and no bullet is silently dropped"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "twelve rows, each naming the discharging plan/task and the evidence read in that plan's SUMMARY; 10 discharged, CR-02 by deletion, WR-06 superseded with its successor property checked twice; six missing: bullets matched to artifacts with SUPERSEDED distinguished from DONE"
        status: pass
    human_judgment: true
    rationale: "Whether the evidence read in a SUMMARY genuinely discharges the finding it is cited against is a reading, not a predicate. Each row quotes the specific transcript, mutation or hash it rests on so that reading can be checked."
  - id: D6
    description: "The round closes by stating what it does NOT claim, with term membership first and demonstrated by plants"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "five claims written with NONE of the 22 pinned literals planted one per reset mirror under the plant-landed assertion, all five exit 0 with the planted file never named; two of them are claims on groups this round widened"
        status: pass
      - kind: other
        ref: "the surviving-enumeration statement carries 22 members / 3 groups / direction FAIL-OPEN, matching scripts/check-banned-claims.ts:293 and :295 which plan 29-44 wrote at the list's declaration"
        status: pass
    human_judgment: false

duration: 33min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 47: The Round Attacked The Axis Its Own Change Opened — Summary

**Forty-four attempts against the four degrees of freedom D-53's deletion introduced, named in writing before the log; the ninth false harness result of this phase produced by this very pass and caught before it published a fail-open bypass of the sole carve-out that does not exist; nine plants re-run on the final tree with a measured 0-to-named movement in both directions; three window residuals CLOSED BY CONSTRUCTION each with a closing measurement rather than the obvious argument; all twelve round-5 findings reconciled against SUMMARY evidence with SUPERSEDED distinguished from DONE; and six residuals opened, measured, directed, counted and left open — none fixed, in a plan whose whole diff is one file under `docs/audit/`.**

## Performance

- **Duration:** 33 min
- **Tasks:** 3 of 3
- **Files created:** 1. **Files modified:** 0.

## Task Commits

1. **Task 1 (tracer): the round's own new degrees of freedom named, then attacked** — `ef7ea4f` (docs)
2. **Task 2: the disposition record — what round 5 claimed falsely, not only what round 6 fixed** — `54f6e2a` (docs)
3. **Task 3: the twelve-row reconciliation verified against evidence, and the sweep** — `351d3c0` (docs)

No `.ts` was touched, so no committed `.js` twin needed rebuilding; `npm run freshness` exits 0 at each of the three commits.

---

## The finding of the plan: the ninth false harness result, produced HERE

Attempt **R2** aimed at the last line of the exemption region — the sharpest position on the axis D-53 made load-bearing. The gate returned:

```
[R2-last-inside] exit=0 premise=TRUE bytes=1237 named=0
    PIN: PASS  LANG-04: … suppresses 14 banned-claim occurrence(s) … pinned at 14 … reaches 62 line(s), pinned at 62
```

Read at face value: **a live claim on the sole carve-out's last line, zero findings, and neither pin moved** — nothing in the tree noticed at all. It would have been the most serious finding this phase has produced, and it was one paragraph from being written down.

It is false. The plant never landed:

```
$ grep -c -F "conforms to Simplified Technical English and improves" "$W/agent-factory/writing-profile.md"
0
$ wc -l < "$W/agent-factory/writing-profile.md"    # mirror
295
$ wc -l < "$PRIS/agent-factory/writing-profile.md" # pristine
295
```

`awk 'NR==296'` cannot match a file with 295 records. The document ends in a newline, so `split("\n")` yields a 296-element array whose last element is the empty string after that newline — an index the region genuinely covers and `awk` cannot address. The helper was a **silent no-op**, and the gate then correctly reported an unmodified tree.

**The 29-43 protocol did not catch it, and could not.** That protocol asserts the gate produced non-empty output carrying its own banner — and here it did. The gate ran. It ran on a tree nobody had modified. **Asserting the harness produced OUTPUT says nothing about whether it produced the INPUT.**

The harness now asserts three premises per attempt — the gate ran, the **plant landed** (needle present in the mirror file), the mirror gate is sha256-identical — and every attempt in the record carries `plant=LANDED`. Corrected, R2 behaves exactly as R1 and R2b do: suppressed, pin 14 → 17.

**The transferable form: every one of this phase's nine false results was a harness that was not what it claimed, and eight of them were about the output. This one extends the class to the input, where it renders identically to a fail-open bypass.**

---

## The four degrees of freedom, named before the attacks

Round 5's log has thirteen attempts and its own honest framing, and it still missed the defect, because every attempt varied an INPUT and none varied the degree of freedom the round's own design decision had added. So this round wrote its own down first:

| # | the degree of freedom | why THIS CHANGE created it |
|---|---|---|
| DOF-1 | **substring reach** | every pinned term is now asked at every position, where the marker requirement used to filter most of them out |
| DOF-2 | **non-prose positions** | the term now reaches a fence, a comment, a link target and a table cell **on its own**; round 5's ids described the *marker* reaching those places |
| DOF-3 | **the region as the SOLE carve-out** | before D-53 a legal denial survived either by sitting inside the region **or** by carrying no marker; the second route is gone |
| DOF-4 | **term membership** | with no marker mechanism, the only surviving enumeration is the pinned literal list itself |

Plus the corpus, widened 82 → 115 this round and never attacked. **Eleven of the 44 attempts aimed at DOF-3**, which is where the round's own change concentrates the risk.

## What the pass found

**Ten of eleven region attempts behave correctly and loudly.** The top edge discriminates at one line's resolution (R3 reds at `:234`, R1 is suppressed at `:236`); the region cannot be destroyed silently (R5 collapses the whole carve-out and reds 17 findings) or duplicated silently (R9 refuses with `that heading occurs 2 time(s)`); an append moves both pins (R4: suppressed 14 → 17 **and** extent 62 → 63); and text after a new level-2 heading is correctly outside (R8 reds at `:299`).

**The eleventh, R6b, is green.** A heading inserted immediately above the exempt heading moves the region and **neither pin notices** — `exit=0`, suppressed 14, extent 62, `ALL CHECKS PASSED`.

**All five term-membership plants pass.** Five claims a well-meaning contributor would actually write, none containing any of the 22 pinned literals, all exit 0 with the planted file never named — including a conformance claim and a token-economy claim on groups this round widened.

**Four of six substring-reach plants are false-positive surfaces.** `does not understand` (a denial), `misunderstand`, `understandable` and `incomprehension` all red on ordinary English making no claim whatever. That reach had been *described* by `V-29-44-01` and never *measured*.

## The six residuals opened — and not one fixed

| id | subject | direction | live count |
|---|---|---|---|
| `V-29-47-01` | the in-source record of `V-29-42-03` is false on five counts and byte-unchanged all round | informational | **5** statements at 1 address, in 2 files |
| `V-29-47-02` | the sole carve-out is unbounded at the bottom — `endBefore === lines.length` | **fail-OPEN** via the re-pin protocol | 0 |
| `V-29-47-03` | the region's POSITION is pinned by nothing; a rigid translation moves it silently | fail-open in principle, benign by arithmetic | 0 |
| `V-29-47-04` | the surviving enumeration: a claim in words the list does not contain PASSES | **fail-OPEN** | 0 by construction; reachability demonstrated by 5 plants |
| `V-29-47-05` | `LANG-04` is marked **Complete** on the tree, against the round-5 verifier's explicit verdict | process, fail-open | **2** |
| `V-29-47-06` | `.github/workflows/ci.yml` describes BOTH widened gates at their pre-widening scope | informational | **2** at 2 addresses |

Two of these — `V-29-47-01` and `V-29-47-06` — are one edit away and were deliberately left. The plan's first prohibition is that a residual found by the adversarial pass is **measured, named, directed, counted and escalated**, never repaired inside the plan that found it.

### `V-29-47-01`, because it is the sharpest

The in-source record of `V-29-42-03` (`scripts/check-banned-claims.ts:645-667` and its committed twin) is byte-identical across all sixteen commits of the round — hashed at both ends, `cb618a74…4984dd` — and is now false on five counts:

1. `That sentence is now LIVE-FALSE, with a count` — the count is **0**.
2. `measured over the 82-document derived scan set` — the scan set is **115**.
3. it cites `incident-responder.md:29:103` as carrying the term — 29-44 rephrased that line; `grep -a -c -i understand` over the file is **0** — and describes it as `carrying no benefit marker`, when there are no benefit markers at all.
4. it cites the module header as stating `no pinned literal OR PINNED PAIR outside the region`. The header at `:57` says only `no pinned literal`. **The phrase `pinned pair` occurs exactly once in the whole file — at `:653`, inside the citation itself.** The block cites a wording that exists nowhere but in its own citation.
5. `a conditional member has existed since…` — conditional members: **0**; member key union `["group","literal"]`.

**Why every stale-prose grep of the round passed over it:** every other stale statement in that module is *marked*. `:203-210` is headed `THE HISTORY IS RECORDED HERE…` in the past tense; `:271` and `:598` are dated, attributed measurement records over the 82-document corpus — the convention plan 29-46 deliberately kept; `:1345` says `A CO-OCCURRENCE ARM USED TO SIT HERE`. **This block alone is written in the live present tense with no date and no marker.**

### `V-29-47-05`, found by trying to derive the probe arithmetic

Walking the round's commits:

```
f718069   LANG-04=Gaps Found    LANG-07=Gaps Found
…
1a18b54   LANG-04=Gaps Found    LANG-07=Gaps Found
f4b10ef   LANG-04=Complete      LANG-07=Gaps Found
223df86   LANG-04=Complete      LANG-07=Gaps Found
```

`29-VERIFICATION-round5.md` recommends, in terms: *"LANG-07 → `Complete`. LANG-04 → stays `Gaps Found`"*. The tree carries **the exact inverse**, set by plan 29-45's docs commit `d5360dc` — the executor's `requirements mark-complete` step acting on each round-6 SUMMARY's `requirements-completed: [LANG-04]` field, before any round-6 verification exists. **This plan's `requirements-completed` is deliberately empty for that reason.**

---

## The closing measurements for the three CLOSED-BY-CONSTRUCTION residuals

"The mechanism is gone, so the residual is gone" is an argument. Each got a measurement, and the reason is written at the measurement: this phase's record contains nine false harness results, one of them produced by this very pass, and every one was produced by exactly the confidence that a conclusion was obvious.

**The construct's ABSENCE, shown on three independent axes** — grep `0/0/0` for `requiresOnSameLine`, `BENEFIT_VERB_MARKERS` and `CONFORMANCE_VERB_MARKERS` across `.ts`, `.js` and `.test.ts`; member key union `["group","literal"]` with 0 third properties and 0 list-valued fields; and `lineHits` quoted in full with no conditional arm.

**The reproductions that opened each, re-run:**

| id | round-5 reproduction | verdict on the final tree |
|---|---|---|
| `V-29-42-01` | A1 / A2 — the claim split across a hard wrap, both directions | **both RED**, each named on the line carrying the **bare term**; the marker's line plays no part. The fail-OPEN it described is gone. |
| `V-29-42-02` | A3 — a table row, marker and term in different cells | **RED — for a different reason.** Attributed to the bare term alone; `improve` is inert (N4 confirms it directly with no marker present). |
| `V-29-42-04` | A10 / A11 — the marker only in an HTML comment / only in a link target | **both RED**, both attributed to the bare term; N2 and N3 confirm directly. |

**And the half a tidy record would have dropped:** `V-29-42-02` and `-04` closed **as described**, and the false-positive **surface** they pointed at **migrated into `V-29-44-01`** rather than vanishing — measured here for the first time, and **wider than round 5's**: N3 shows a filename merely containing the term now reds, where round 5 needed a marker inside the target.

**`V-29-42-03` closed too, and TRUE rather than vacuously true.** The gap closed by the **source coming down to the document**: round 5's asymmetry was that the source claimed "no pinned literal **or pinned pair**" because a pinned pair existed; D-53 deleted the pair. `agent-factory/writing-profile.md` is byte-unchanged for the whole round (`git diff --exit-code f718069..HEAD` exits 0). The live count went 1 → 0 separately, because 29-44 rephrased the one instance. Two distinct facts, recorded distinctly.

---

## Prohibition verifications — each command run, with its real output

### P1. No residual found by the adversarial pass is FIXED

```
$ git diff --stat ef7ea4f~1..HEAD
 docs/audit/29-round6-residuals.md | 1172 +++++++++++++++++++++++++++++++++++++
 1 file changed, 1172 insertions(+)
```

**Exactly one file changed, and it is under `docs/audit/`.** No source file, no test file, no kit document. Six residuals were opened; zero were repaired.

**Status: enforced.**

### P2. No requirement is re-marked complete

```
$ git diff --exit-code .planning/REQUIREMENTS.md ; echo $?
0
$ git diff --exit-code ef7ea4f~1..HEAD -- .planning/REQUIREMENTS.md ; echo $?
0
```

`LANG-04` stays as the tree has it, and **its state is recorded as a finding (`V-29-47-05`) rather than corrected** — a plan correcting its own requirement's status is the defect, not the fix. This SUMMARY's `requirements-completed` is empty.

**No ROADMAP progress note was written by this plan** beyond the mechanical `roadmap update-plan-progress` counter refresh; see Deviations.

**Status: enforced.**

### P3. A residual CLOSED BY CONSTRUCTION still gets a closing measurement

All three carry: the property restated, the construct shown **absent** on three axes (not merely unused), the reproduction that opened it **re-run** with its new verdict, and a live count re-derived over the final corpus — **before** the word CLOSED appears. Quoted in full above and at §3.7 of the record.

**Status: enforced.**

### P4. The round closes by stating what it does NOT claim, term membership FIRST

The honest close's second heading opens with the surviving enumeration — 22 members, 3 groups, direction **FAIL-OPEN** — and demonstrates it with the five plants rather than asserting it. Two of the five are claims on groups this round widened. The register carries it as `V-29-47-04` with direction FAIL-OPEN.

```
$ grep -a -n "MEMBERS: 22" scripts/check-banned-claims.ts
293: * MEMBERS: 22, across 3 groups. The count is published on every green run and pinned by a case.
295: * DIRECTION: FAIL-OPEN, and the consequence stated plainly. …
```

The record's statement matches what plan 29-44 wrote at the list's own declaration.

**Status: enforced.**

### P5. The freshness premise and the mirror's identity asserted BEFORE any transcript

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
FRESHNESS_EXIT=0

6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba  scripts/check-banned-claims.js         (repo)
6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba  <mirror>/scripts/check-banned-claims.js
tracked files: 1600      mirror files: 1600

[CONTROL-clean] exit=0 premise=TRUE bytes=1237 named=0
ALL CHECKS PASSED
```

Base commit `223df86cd047411b6b49ff4ac88c593363e8db51`. The mirror lives under `/private/tmp`, never `/tmp` — plan 29-43's catch. **And a third premise was added mid-pass and is the plan's own finding: the plant must land.**

**Status: enforced.**

---

## The LANG-08 override, measured rather than assured

```
$ diff <(round-5 §5 block) <(round-6 §5 block) && echo BYTE-IDENTICAL
BYTE-IDENTICAL
sha256 both: 30c8f1518afd9441cd89fe304a73df6458d88262526592ac37afc137dc2d51e1
```

| check | result |
|---|---|
| `roleCeiling()`'s body hashed at `f718069` and `HEAD` | **byte-identical**, `c4d66b0e…f30e7`, 1967 B both ends — the same hash rounds 4 and 5 recorded |
| files under a ceiling touched this round | **exactly one** — `agent-factory/roles/incident-responder.md` |
| that file against its ceiling | **3481 B → 3485 B** against `"3802 3598"`; 4 of 113 B of headroom to WARN |

Round 5 could say "0 files under a ceiling". **Round 6 cannot and does not** — the byte count is stated against the ceiling instead, as the plan required.

---

## Verification commands, recorded by name

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run freshness` | 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run typecheck` | 0 |
| `npm run check:public-docs` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:banned-claims` | 0 — "0 findings over 115/115 elements" |
| `npm run check:imperative-lexicon` | 0 |
| `npm run check:diff-disposition` | 0 |
| `npm run check:nul-bytes` | 0 — 1601 tracked files, zero forbidden control bytes |
| `node scripts/check-foundation-guards.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2068 passed, 2 skipped** |

**`npm test` was NOT run** (it spawns the live claude-CLI e2e lane).

**Suite: 2068 passing, unchanged from 29-46's baseline — this plan adds no case and changes no source (+0).** Against round 5's baseline of 2054 the round moved +14, accounted for per plan in the record §8.5. The 2 skips are pre-existing.

`git diff --exit-code f718069..HEAD -- package.json package-lock.json` exits **0** across all eighteen commits of the round (T-29-47-SC discharged by asserted absence). `git status --porcelain` carries no plant, mirror or fixture — every plant was written to a `/private/tmp` mirror.

---

## Deviations from Plan

### 1. [Rule 1 — bug] The harness's own plant helper was a silent no-op, and the first R2 verdict was false

- **Found during:** Task 1, at attempt R2.
- **Issue:** `plant_replace` used `awk NR==<n>`, which cannot address the trailing element a file ending in a newline produces under `split("\n")`. The plant silently did nothing and the gate correctly reported an unmodified tree — rendering as `exit=0`, both pins unmoved, i.e. a fail-open bypass of the sole carve-out.
- **Fix:** a third premise assertion added to the harness — the planted needle must be present in the mirror file — and every subsequent verdict gated on it. R1, R2, R2b and R3 were re-run under it; R2 corrected to the last **content** line and R2b added for the trailing element specifically.
- **Escalated, not absorbed:** recorded as §2.1 of the record, the phase's ninth harness-premise failure, with the transferable form stated (assert the premise on BOTH sides of the harness).
- **Committed in:** `ef7ea4f`.

### 2. [Rule 2 — missing critical functionality] Two residuals found in files this plan does not own, both left open

- **Found during:** Task 1 (`V-29-47-01`) and Task 3 (`V-29-47-06`).
- **Issue:** `scripts/check-banned-claims.ts:645-667` carries five false statements about a residual that closed; `.github/workflows/ci.yml:221` and `:321` describe both widened gates at their pre-widening scope. Both are one edit away.
- **Disposition:** **NOT FIXED.** The plan's first prohibition is explicit that a residual found by the adversarial pass is measured, named, directed, counted and escalated. Both carry addresses, live counts, directions and remedies.
- **Committed in:** `ef7ea4f`, `351d3c0`.

### 3. [Rule 3 — blocking] The probe arithmetic could not be re-derived, so it is labelled CARRIED

- **Found during:** Task 2.
- **Issue:** the plan directs the arithmetic to be derived "from the coverage file". `COVERAGE.md` is the API-integration file (one sentence, no probe rows), and `grep -c probe_coverage` over all five round-6 plans returns **0** — no round-6 plan carries such a block. The only committed derivation is plan 29-40's, whose own source was a session temp file.
- **Fix:** the total is labelled **CARRIED, not re-derived**, and the reason is stated at §6.1. What *is* independently derivable was derived — the eight `LANG-` ids in `.planning/REQUIREMENTS.md`'s Phase 29 mapping, no orphan and no missing id — **and that derivation is what surfaced `V-29-47-05`.**
- **Committed in:** `54f6e2a`.

### 4. [documented] The ROADMAP's mechanical progress counters

`roadmap update-plan-progress 29` refreshes the phase row's plan/summary counts. **No status flip and no narrative text was written.** Recorded here with its exact effect so a verification round can see precisely what changed.

**Total deviations:** 4 (1 × Rule 1, 1 × Rule 2, 1 × Rule 3, 1 documented). **Impact:** no scope creep — no source file, test file, kit document or requirement row was touched by this plan.

---

## Residuals observed but NOT closed by this plan

All six are in the record at §3.1–§3.6 and §8.4 with both addresses, a direction, a live count and a remedy: `V-29-47-01` (five false statements in the in-source record of a closed residual), `V-29-47-02` (the carve-out unbounded at the bottom), `V-29-47-03` (the region's position pinned by nothing), `V-29-47-04` (the surviving enumeration, fail-open), `V-29-47-05` (`LANG-04` marked Complete against the verifier's verdict), `V-29-47-06` (the CI workflow's two stale gate descriptions).

Carried and re-measured rather than transcribed: 29-44's **R1** (30 code-span disposition rows, re-measured from 1534 rows read), 29-43's **R2** (`CHANGELOG.md:67` `sharper-per-token`, 1 live), 29-45's **R4** (nothing catches an unmeasured claim about an external tool — **and `V-29-47-06` is a fresh instance of the adjacent class**), 29-46's **R1** and **R2** (0 duplicate workflow `order` values, re-measured over 19).

## Known Stubs

None. This plan authored no code, no assertion and no predicate.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. `T-29-47-SC` discharged by asserted absence.

## Next Phase Readiness

- **The round-6 verifier owns:** `LANG-04`'s verdict, and correcting `LANG-04`/`LANG-07`'s traceability rows per `V-29-47-05`.
- **A round-7 plan owns, if there is one:** `V-29-47-01` (rewrite the block as a dated closure note in the tense its siblings use), `V-29-47-02` (bound the region explicitly so "appended below the disclaimer" differs from "inside it"), `V-29-47-03` (assert the region's content digest rather than two scalar projections), `V-29-47-06` (name the constant or quote the banner in `ci.yml` rather than restating a number and a class), and the carried R-items.
- **The tree as this round leaves it:** 115 documents, 22 literals across 3 groups all unconditional, `BANNED_CLAIM_EXEMPT_SUPPRESSED` 14 (published by group 8/2/4), `BANNED_CLAIM_EXEMPT_EXTENT` 62, `check-nul-bytes` over 1601 tracked paths deciding the whole forbidden control-byte class, suite 2068/2, all fourteen gates at exit 0.

## Self-Check: PASSED

Created file verified present:

```
FOUND: docs/audit/29-round6-residuals.md   (1172 lines, Unicode text, UTF-8 text)
```

Commits verified present in `git log`:

```
FOUND: ef7ea4f  docs(29-47): the round's own new degrees of freedom named, then attacked
FOUND: 54f6e2a  docs(29-47): the disposition record — what round 5 claimed falsely, not only what round 6 fixed
FOUND: 351d3c0  docs(29-47): the twelve-row reconciliation verified against evidence, and the sweep
```

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-17*
