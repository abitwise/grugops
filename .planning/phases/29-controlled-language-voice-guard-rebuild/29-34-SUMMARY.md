---
phase: 29-controlled-language-voice-guard-rebuild
plan: 34
subsystem: foundation-guards
tags: [lang-06, wr-04, wr-05, voice-guard, vacuity-floor, gap-closure-round-4]
status: complete
requires:
  - scripts/voice-model.ts (readCavemanFence — the ONE reader that owns the fence indices)
  - scripts/check-foundation-guards.ts (guardVoice, neutralizePhrases, the element floor)
  - scripts/frontmatter.ts (sectionEndIndex — the delimiter-neutralised bound, unchanged)
provides:
  - outsideLines / removedLines — the reader's line accounting, counts of INDICES
  - the named accounting throw in readCavemanFence
  - three named guard_voice refusals — accounting, neutralisation line count, reconciliation
  - a three-number per-element measurement line
  - assertRemainderScannable — one predicate for the live-corpus control and its probe
  - VOICE_REMAINDER_RESIDUAL — the WR-05 disclosure pinned against the guard source
affects:
  - scripts/voice-model.ts
  - scripts/voice-model.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
tech-stack:
  added: []
  patterns:
    - "derive the element count independently of the loop that consumes it"
    - "an index count and a split length are different answers — splitting an EMPTY string on a newline yields ONE empty element, never zero"
    - "a vacuity floor catches an EMPTY denominator but never a SILENTLY SHORT one"
    - "assert the harness's own premise before the assertion it enables"
    - "a residual is DISCLOSED at the declaration and the disclosure is pinned, not left to prose"
key-files:
  created: []
  modified:
    - scripts/voice-model.ts
    - scripts/voice-model.js (compiled)
    - scripts/voice-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js (compiled)
    - scripts/check-foundation-guards.test.ts
decisions:
  - "`removedLines` is derived from the INDEX ARITHMETIC and `outsideLines` by COUNTING the removal predicate, deliberately by two different routes. Deriving the second as `lines.length - outsideLines` would have made the accounting identity a tautology that can never fail and therefore witness nothing."
  - "The reconciliation sits BELOW the element floor, not above it. A zero-retained remainder walks an array of one empty element, so the comparison would report an off-by-one for a file whose real defect is a swallowed document. The ordering is load-bearing."
  - "The guard contributes the ONE number the reader cannot supply — the document's own line count off `text`. It never recomputes where the caveman region ends; that would be the second-grammar defect this phase exists to delete (D-22, D-24)."
  - "A per-file table of 19 hand-measured minimum ratios was REFUSED. D-28 already refused that shape for byte ceilings; adding one here to close a warning about an unmeasured number would trade a bounded, disclosed residual for this repository's second named systemic failure class."
  - "The residual pin asserts each sentence occurs EXACTLY ONCE, not merely that it is present. The first roster draft carried a non-distinctive member and the falsifiability sibling is what found it."
metrics:
  duration: 55m
  completed: 2026-08-16
actuals:
  tokens: 96000
  tasks: 3
  commits: 3
---

# Phase 29 Plan 34: guard_voice line accounting Summary

`guard_voice`'s per-file scanned line count now has an independent witness — the document's own total,
counted off `text` by the guard and reconciled against the reader's retained/removed indices — and the
element floor tests a condition that can actually occur instead of one no string can satisfy.

## What was built

| Artifact | File | Kind |
|---|---|---|
| `outsideLines`, `removedLines` | `scripts/voice-model.ts` (`CavemanFenceResult` ok arm) | new result fields |
| the named accounting throw | `scripts/voice-model.ts` (`readCavemanFence`) | new refusal |
| the accounting-identity finding | `scripts/check-foundation-guards.ts` | new refusal (a) |
| the `neutralizePhrases` line-count finding | `scripts/check-foundation-guards.ts` | new refusal (b) |
| the `bodyLines` vs `outsideLines` reconciliation | `scripts/check-foundation-guards.ts` | new refusal (c) |
| the three-number per-element line | `scripts/check-foundation-guards.ts` | widened measurement |
| THE WR-05 RESIDUAL paragraph | `scripts/check-foundation-guards.ts` | disclosure at the declaration |
| `assertRemainderScannable` | `scripts/voice-model.test.ts` | one predicate, two consumers |
| `VOICE_REMAINDER_RESIDUAL` | `scripts/check-foundation-guards.test.ts` | pinned disclosure roster |

Seven new cases in `check-foundation-guards.test.ts`, four in `voice-model.test.ts`.

## Task 1 — the bypass reproduced at exit 0, then made visible

### RED, against the COMMITTED `.js`, on a `git archive HEAD` mirror

The plan's fixture is a role file whose caveman fence legally spans all but one line of its document,
entirely within the delimiter-neutralised bound (the anchor is the document's only `##` heading, so
the section runs to EOF and nothing is reached past a level ≤ 2 heading).

```
$ git archive HEAD | tar -x -C $W/mir
$ CHECK_ROOT=$W/mir node scripts/check-foundation-guards.js   # CONTROL, unplanted
        uat-planner.md: scanned 44 clear-voice line(s), 0 marker line(s)
ALL CHECKS PASSED                                              exit=0

$ # 42-line role file: title, anchor, fence open, 39 caveman lines, fence close
$ CHECK_ROOT=$W/mir node scripts/check-foundation-guards.js
        uat-planner.md: scanned 1 clear-voice line(s), 0 marker line(s)
  PASS  voice: 0 findings over 19/19 elements
        uat-planner.md: tokens 10 / content words 342, banned 0
  PASS  caveman voice: 0 findings over 17/17 elements
ALL CHECKS PASSED                                              exit=0
```

**44 lines of clear-voice remainder became 1, and the whole gate exited 0.** No published number
contradicted it: `visited` 19, `expected` 19, both voice guards green. This is WR-05 in full.

(First draft of the fixture repeated one filler line 36 times and reddened
`guard_role_clause_uniqueness`, which would have made the exit-0 claim untestable. The lines were made
distinct so the ONLY thing the transcript demonstrates is guard_voice's blindness.)

### POST-fix, same fixture, fresh `git archive HEAD` mirror of the shipped tree

```
$ CHECK_ROOT=$W/final node $W/final/scripts/check-foundation-guards.js
        uat-planner.md: scanned 1 clear-voice line(s), 0 marker line(s), caveman region 42 line(s), document 43 line(s)
  PASS  voice: 0 findings over 19/19 elements
ALL CHECKS PASSED                                              exit=0
```

The shrink is now ON THE TRANSCRIPT — `scanned 1 … caveman region 42 … document 43`. It is **not
refused**, and that is deliberate and disclosed: the accounting closes the direction where a remainder
shrinks *without* the region growing. A region that honestly grew is the residual, recorded in task 3.

### The accounting, and why the identity is not a tautology

`removedLines` comes from the INDEX ARITHMETIC (`1 + (close - open + 1)`); `outsideLines` comes from
COUNTING the one removal predicate the `outside` filter itself applies. Two routes, so their sum is a
real check: it holds exactly when the anchor sits outside `[open, close]` and the range is contiguous.
Deriving the second as `lines.length - outsideLines` would have been a subtraction compared against
itself — the shape this round is charged with removing.

Proven reachable rather than asserted, by a scratch copy of the compiled `voice-model.js` with the
arithmetic half made to over-count by one:

```
✓ readCavemanFence — the accounting premise (plan 29-34) >
  throws by name when retained + removed does not equal the document's line count
```

The case asserts the mutation applied, asserts the UNMUTATED reader accepts the same fixture (so the
throw is caused by the mutation and not the bytes), then asserts the throw and its message shape.

### The guard's three refusals, each mutation-proven

| Refusal | What it catches | Proven by |
|---|---|---|
| (a) accounting | the reader's indices stop describing the bytes | `voice-model.js` mutated to return `removedLines + 1` |
| (b) neutralisation | `neutralizePhrases` adds or drops a line | its `/grug` replacement mutated to insert a newline |
| (c) reconciliation | the walked array is short against the published retained count | `body = verdict.outside` mutated to drop one line |

Transcript for (c), scratch build against a clean mirror:

```
$ CHECK_ROOT=$W/mir2 node $S/scripts/check-foundation-guards.js
  agent-factory/roles/agents-md-scribe.md: the scanned remainder does not match the reader's
  accounting — the marker scan walked 44 line(s) while the reader retained 45; the scan is short,
  so the published count describes bytes that were not scanned
  FAIL  voice: 17 finding(s) over 19 elements
exit=1
```

The finding NAMES which side is short. The sibling guard stays green in every one of the four scratch
runs, so each red is attributable to guard_voice rather than to a build that broke everything.

**The first draft of (c)'s mutation was wrong and the ordering caught it.** Mutating
`bodyLines = body.split("\n")` to `.slice(1)` reds refusal **(b)** — the neutralisation premise — not
(c), because the drop lands after the pre-neutralisation count. The mutation was moved to the point
the guard TAKES the remainder, so (a) and (b) both still hold and (c) is the only arm that can fire. A
probe that reds for the wrong reason reports a mechanism it never exercised.

### The harness's own premise

`every guard_voice element line publishes three numbers that ACCOUNT for each other` parses the rows
out of the `[guard_voice]` section by regex and asserts, BEFORE any claim about them, that the row
count equals `ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC)` — the same two authorities the guard's own
denominator uses. A regex that silently matched nothing would otherwise make every assertion a claim
about an empty list. It further asserts that `ROLE_COUNT` rows carry a NON-ZERO caveman region, so the
identity is not holding trivially on rows where the region is always zero.

## Task 2 — the floor states a condition that can occur

**The guard.** `bodyLines.length === 0` is unreachable-false for every possible string. The shipped
condition is now the reader's retained-INDEX count, which really can be zero:

```ts
if (outsideLines === 0 || body.trim() === "") {
```

The finding text was REPLACED, not supplemented — it names the retained count and the content bytes,
and the retired `collapsed to N line(s)` wording is asserted ABSENT so a message describing an untested
condition cannot survive beside the new one.

**The module header, quoted side by side** (the acceptance criterion asks for both):

| | text |
|---|---|
| before | `an ELEMENT-LEVEL floor: a scanned line count of ZERO on any voice file is a finding naming that file. … so zero is a defect by construction` |
| after | `an ELEMENT-LEVEL floor: a remainder that RETAINS NO LINES, or that retains lines carrying no content, is a finding naming that file. … so both halves are defects by construction` |

**Both routes into the floor are now exercised, and they are not interchangeable.** The pre-existing
case empties a SEC_VOICE surface: that branch declares the whole document to be the remainder, so it
reaches the floor's *emptiness* half at `retains 1 line(s) … carries 0 byte(s)`. The new case plants a
role file that is nothing but an anchor and a fence, which reaches the *retained-index* half at
`retains 0 line(s)` — the half WR-04 says could not fire — with the reader's NON-refusal asserted as
its premise so the case cannot be reporting the refusal arm under the floor's name.

**The test.** `voice-model.test.ts`'s live-corpus control asserted
`v.outside.split("\n").length > 0`, true of every possible value, under a comment claiming a line count
was chosen "because that is the number guard_voice now publishes per file". The replacement makes that
argument true: `assertRemainderScannable` asserts the NON-BLANK line count, the verdict's own
`outsideLines` — the number the guard actually publishes — and the byte length. One predicate, driven
by both the control and its probe, because a probe carrying its own copy proves a predicate that is not
the one shipped.

Its falsifiability sibling drives each arm separately (a swallowed remainder, a zero retained count
with content, a positive retained count over blank lines only), asserts a well-formed value does NOT
throw, and shows the RETIRED form ACCEPTING the bytes the corrected form rejects.

**Live corpus verdicts unchanged**, recorded as a before/after transcript pair over the whole
`[guard_voice]` section:

```
$ diff <(sed 's/, caveman region.*//' voice.before) <(sed 's/, caveman region.*//' voice.after)
VOICE SECTION IDENTICAL once the two NEW fields are stripped
```

This plan changed what is MEASURED, not what is found.

## Task 3 — the residual measured, bounded, disclosed and pinned

### The measurement, derived in-session over all 19 voice elements

`retained / document`, with the document total read off the file bytes independently of the reader.
The accounting identity `retained + region === total` holds on **19 of 19**.

| element | retained | caveman region | document | ratio |
|---|---|---|---|---|
| factory-coach.md | 43 | 7 | 50 | **0.8600** ← min |
| frontend-ui.md | 43 | 7 | 50 | 0.8600 |
| incident-responder.md | 43 | 7 | 50 | 0.8600 |
| agents-md-scribe.md | 45 | 7 | 52 | 0.8654 |
| ba-pm.md | 46 | 7 | 53 | 0.8679 |
| release-manager.md | 46 | 7 | 53 | 0.8679 |
| software-engineer.md | 46 | 7 | 53 | 0.8679 |
| brownfield-mapper.md | 42 | 6 | 48 | 0.8750 |
| compliance-officer.md | 43 | 6 | 49 | 0.8776 |
| greenfield-mapper.md | 43 | 6 | 49 | 0.8776 |
| installer.md | 43 | 6 | 49 | 0.8776 |
| system-analyst.md | 43 | 6 | 49 | 0.8776 |
| security-nfr.md | 44 | 6 | 50 | 0.8800 |
| uat-planner.md | 44 | 6 | 50 | 0.8800 |
| architect-design.md | 45 | 6 | 51 | 0.8824 |
| qe-e2e.md | 45 | 6 | 51 | 0.8824 |
| orchestrator.md | 75 | 7 | 82 | **0.9146** ← max |
| 15-security-audit.md | 48 | 0 | 48 | 1.0000 (declared no fence) |
| security-nfr-checklist.md | 419 | 0 | 419 | 1.0000 (declared no fence) |

**Roles: min 0.8600 (`factory-coach.md`, `frontend-ui.md`, `incident-responder.md` — all 43 of 50),
max 0.9146 (`orchestrator.md` — 75 of 82). Every caveman region is 6 or 7 lines.** The two SEC_VOICE
surfaces are 1.000 by declaration, carrying no fence at all. The corpus sits nowhere near the bound:
the reproduction fixture that passes at exit 0 sits at 0.023.

### The residual, recorded at the declaration

Beside the element floor, in prose a later reader meets as a decision:

- the accounting catches a remainder that **shrank without the caveman region growing**;
- it does **not** catch a caveman region that **legitimately grew** — with the exit-0 reproduction and
  its printed numbers quoted inline;
- what bounds that direction today is the **delimiter-neutralised section bound** in `voice-model.ts`:
  a swallow cannot cross a level-one or level-two heading, so a region can only ever absorb its own
  section, and that is a property of the reader rather than a check in this guard;
- the measured distribution above, with an instruction to re-measure rather than trust the sentence.

### The refused alternative, named

A per-file table of nineteen hand-measured minimum ratios — the `roleCeiling()` shape, failing closed
on an unknown key — is **REFUSED**. D-28 already refused exactly that shape for byte ceilings on the
grounds that nineteen new hand-measured baselines are new set-literal surface, and a hand-maintained
set rotting while every published number holds still is this repository's second named systemic failure
class. Adding one here to close a warning about an unmeasured number would trade a known, bounded,
disclosed residual for the phase's own worst-known defect class.

### The disclosure is PINNED, and the pin discriminates

`VOICE_REMAINDER_RESIDUAL` holds four load-bearing sentences compared against the guard's source bytes.
Two properties beyond mere presence:

1. **EXACTLY ONCE, not merely present.** A member that also occurs elsewhere cannot be shown to be
   load-bearing — deleting it from the disclosure leaves the pin satisfied by the other copy.
2. **Position, asserted as an ordering** against the floor's own shipped condition rather than a line
   number, so it reds when the paragraph drifts away from what it qualifies and not on unrelated edits.

The falsifiability sibling deletes each member in turn from a copy of the source and asserts the pin
sees it, plus an unrelated-edit control proving the probe discriminates between the disclosure and the
file.

**The sibling earned its place immediately.** The first roster draft carried `"It does NOT"` as a
member. That string occurs elsewhere in the module, so removing it from the disclosure left the pin
green — a pin over the file, not over the paragraph. The sibling caught it, and the structural fix was
the `EXACTLY ONCE` assertion, which makes the class of defect impossible rather than fixing the one
instance.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 48 committed .js file(s)" |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **2001 passed / 2 skipped across 52 files** (round-4 baseline 1987) |
| `npx vitest run scripts/voice-model.test.ts` | exit 0 — 47 passed |
| `npx vitest run scripts/check-foundation-guards.test.ts` | exit 0 — 218 passed |
| `check-foundation-guards` | exit 0 |
| `check-imperative-lexicon` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `check-banned-claims` | exit 0 |
| `check-audit-register` | exit 0 |
| `check-claim-anchors` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `git diff --exit-code 12d2e09..HEAD -- package.json package-lock.json` | exit 0 — byte-unchanged; no dependency added |
| `git status --porcelain` | no stray artifact — every plant was on a mirror outside the repo |

**A green suite is not proof.** What is offered as evidence is the exit-0 RED transcript from the
committed build, four mutation-proven refusals (each with the sibling guard shown green in the same
run), the reader's throw proven reachable on a scratch module, the retired assertion shown ACCEPTING
what the corrected one rejects, and the byte-identical live-corpus verdict diff — not the passing count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The tripwire census denominator moved three times and was RE-MEASURED each time**

- **Found during:** every task, running the module's own census pin.
- **Issue:** `scripts/check-foundation-guards.test.ts` publishes six numbers describing its OWN bytes
  (plan 29-25), so every added case moves all six. This is the D-04 same-commit companion working as
  designed, not a defect in it.
- **Fix:** measured from the live tree at each task boundary with a probe line that is neither an
  occurrence nor a classified line (asserted: the probe was reverted and `grep -c` confirmed zero
  residue each time). Never adjusted-until-green. Net movement, with the delta accounted for at the
  declaration:

  | number | 29-33 | 29-34 | delta |
  |---|---|---|---|
  | occurrences | 5391 | 5453 | +62 |
  | classified lines | 5319 | 5380 | +61 |
  | statement-level multi-line | 1084 | 1103 | +19 |
  | quote-aware multi-line | 1078 | 1097 | +19 (the SAME delta — the counters did not diverge) |
  | counter disagreements | 14 | 14 | UNCHANGED |
  | subject-only multi-line | 589 | 604 | +15 |

  **The +62 / +61 one-line gap is accounted for**, not rounded past: one added COMMENT in
  `voice-model.test.ts` quotes the retired vacuous assertion verbatim to explain what was wrong with
  it. That comment is a raw occurrence and is not a classified line. Same census-counts-its-own-prose
  effect 29-33 recorded, arriving this time from the other module.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commits:** `78692ef`, `8e212e0`, `0e150a2`

**2. [Rule 2 — Missing critical functionality] The residual pin roster needed an EXACTLY-ONCE floor**

- **Found during:** Task 3, running the falsifiability sibling for the first time.
- **Issue:** the pin member `"It does NOT"` occurs elsewhere in the module, so deleting it from the
  disclosure left the pin green. A roster member that is not distinctive pins the file rather than the
  paragraph — the same "the pin proves something other than what it claims" class the plan is closing.
- **Fix:** the member was replaced with a distinctive full clause AND, structurally, every member is
  now asserted to occur EXACTLY ONCE. That makes the defect class impossible rather than fixing the one
  instance.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `0e150a2`

### Task-boundary note

The plan assigns `voice-model.test.ts`'s vacuous-assertion replacement to task 2. It landed in task 1's
commit (`78692ef`) because task 1's live-corpus loop had to call the same predicate, and shipping two
implementations of one assertion for one commit is precisely the shape this plan is deleting. Task 2's
commit carries the guard floor, the module header and the finding-wording change.

### Execution-flow note

The plan's task 1 is `type="tracer"`, whose interactive protocol is to stop at a
`checkpoint:human-verify` after committing. It was run end to end instead, because the plan frontmatter
declares `autonomous: true` and `.planning/config.json` sets `workflow.human_verify_mode:
"end-of-phase"`. The tracer's `<verify>` was re-run after its commit and passed, which is the gate the
checkpoint exists to enforce.

### What this plan did NOT do

- **No byte ceiling was raised.** LANG-08's prohibition half is untouched.
- **No safety surface was reworded.** The two SEC_VOICE surfaces were not edited.
- **No second fence or section-extent grammar was introduced.** `outsideLines`/`removedLines` are a
  projection of indices `readCavemanFence` already held; `sectionEndIndex` is untouched.
- **No package was installed.** Manifest and lockfile are byte-unchanged.
- **LANG-06 was NOT marked complete.** Round-5 verification decides that, not this plan.

## Known Stubs

None. No placeholder, empty-value or TODO was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
The plan's register is discharged as follows: **T-29-34-01** (`mitigate`) — the accounting is published
and reconciled, and the direction it does not cover is disclosed and bounded (partial by design, stated
as such); **T-29-34-02** (`mitigate`) — three numbers on the element line with the total derived
independently of the reader; **T-29-34-03** (`mitigate`) — the dead disjunct removed, the condition
restated as the reachable one, the header corrected; **T-29-34-04** (`mitigate`) — the non-vacuous
predicate plus a falsifiability sibling over each arm. **T-29-34-SC** (`accept`) — discharged by
asserted absence: `package.json` and `package-lock.json` byte-unchanged across the plan.

## Self-Check

- `scripts/voice-model.ts` — FOUND
- `scripts/voice-model.js` — FOUND
- `scripts/voice-model.test.ts` — FOUND
- `scripts/check-foundation-guards.ts` — FOUND
- `scripts/check-foundation-guards.js` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- commit `78692ef` — FOUND
- commit `8e212e0` — FOUND
- commit `0e150a2` — FOUND

## Self-Check: PASSED
