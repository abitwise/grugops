---
phase: 29-controlled-language-voice-guard-rebuild
plan: 33
subsystem: foundation-guards
tags: [lang-06, cr-01, voice-guard, set-literal-drift, gap-closure-round-4]
status: complete
requires:
  - scripts/check-foundation-guards.ts (SEC_VOICE_FILES, SEC_VOICE_FILE_COUNT, VOICE_FILES)
  - scripts/generate-safety-surface.ts (safetySurfaceUnion — arm A of the property floor)
  - scripts/generate-asvs-checklist.ts (the OUT literal — arm B of the property floor)
  - scripts/kit-model.ts (listRoles — the derived role half, for the disjointness assertion)
provides:
  - SEC_VOICE_MEMBERS — a declared SORTED roster pinned two-sided against the guard source
  - secVoiceRosterMismatch — the roster pin as a value-returning predicate
  - parseAsvsChecklistOut — arm-B source-literal parser, throws by name
  - secVoiceDerivedProperty — the per-member arm-A/arm-B classifier
  - a SUBSTITUTION arm in the SEC_VOICE falsifiability probe, beside ADD and REMOVE
affects:
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts (declaration comment only; no production logic changed)
tech-stack:
  added: []
  patterns:
    - "derive the set, assert the count — never the reverse (this repository's second systemic failure class)"
    - "a hand-maintained roster is legitimate only when it fails CLOSED against a same-commit companion (D-01/D-04)"
    - "assert the harness's own premise before the assertion it enables"
    - "test the UNION of a split predicate's arms, not the arms in isolation"
key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js (compiled)
decisions:
  - "The cardinality pin was KEPT, not replaced. SEC_VOICE_FILE_COUNT catches ADD and REMOVE through the reportMeasured denominator at GATE RUN TIME, which the source-level roster does not. This plan added the missing third direction rather than swapping two working mechanisms for one."
  - "No roster literal was added to the guard SOURCE. Two literals in one file compared against each other is one number compared with itself — the critique that file already records at guardCavemanVoice's `expected`. The companion lives in the test, where it is a genuinely independent second artifact."
  - "The false sentence in the declaration paragraph was DELETED rather than amended. A paragraph that survives the change it describes is the same defect one module over."
  - "Two residuals are ADMITTED and named in source rather than closed: (a) a change editing the guard literal, the roster and the property source in ONE commit is a D-04 reviewability guarantee, not a mechanical one; (b) the source-level pins do not see a committed-.js edit, and npm run freshness is the half that does — measured, not assumed."
metrics:
  duration: 20m
  completed: 2026-08-16
actuals:
  tokens: 74000
  tasks: 3
  commits: 4
---

# Phase 29 Plan 33: SEC_VOICE membership pin Summary

`SEC_VOICE_FILES` — the one hand-maintained half of `guard_voice`'s scan set — is now pinned by
MEMBERSHIP and by a derived per-member PROPERTY, not only by cardinality, so a one-token substitution
that drops a security surface out of the voice scan reds by name in three separate places instead of
leaving every published number unchanged at exit 0.

## What was built

| Artifact | File | Kind |
|---|---|---|
| `SEC_VOICE_MEMBERS` | `scripts/check-foundation-guards.test.ts` | declared sorted roster constant |
| `SEC_VOICE_DECOY` | `scripts/check-foundation-guards.test.ts` | the exact path round 4 substituted in |
| `secVoiceRosterMismatch` | `scripts/check-foundation-guards.test.ts` | value-returning pin predicate |
| `parseAsvsChecklistOut` | `scripts/check-foundation-guards.test.ts` | source-literal parser (arm B), throws by name |
| `secVoiceDerivedProperty` | `scripts/check-foundation-guards.test.ts` | per-member arm-A / arm-B classifier |
| "the SEC_VOICE roster is pinned two-sided against the guard source" | `scripts/check-foundation-guards.test.ts` | new case |
| "every SEC_VOICE member satisfies a DERIVED property, and the two arms' UNION is the roster" | `scripts/check-foundation-guards.test.ts` | new case |
| "the SEC_VOICE probe REDS on a SUBSTITUTED member — the direction a cardinality is blind to" | `scripts/check-foundation-guards.test.ts` | new case |

No production symbol was created. `SEC_VOICE_FILES`, `SEC_VOICE_FILE_COUNT`, `VOICE_FILES`,
`VOICE_FILE_COUNT`, `EXPECTS_CAVEMAN_FENCE`, `parseSecVoiceMembers`, `parseSecVoiceCount` and
`secVoicePinMismatch` all pre-existed and were kept. The only production edit is a comment.

## Task 1 — the bypass reproduced end to end, then refused

### RED, against the COMMITTED `.js`, on a `git archive HEAD` mirror

Transcript A — the unmodified committed `check-foundation-guards.js`, a caveman marker planted into
`agent-factory/workflows/15-security-audit.md` on the mirror:

```
$ git archive HEAD | tar -x -C $W/mir
$ cp scripts/*.js $W/sub/
$ printf '\nsecurity review no think, just smash the shiny rock.\n' \
      >> $W/mir/agent-factory/workflows/15-security-audit.md

$ CHECK_ROOT=$W/mir node scripts/check-foundation-guards.js ; echo exit=$?
        15-security-audit.md: scanned 50 clear-voice line(s), 1 marker line(s)
  FAIL  voice: 1 finding(s) over 19 elements

== Result ==
1 CHECK(S) FAILED
exit=1
```

Transcript B — the SAME mirror, one token substituted inside the copied `.js` and nothing else:

```
$ sed -i '' 's|"agent-factory/workflows/15-security-audit.md"|"agent-factory/checklists/definition-of-ready.md"|' \
      $W/sub/check-foundation-guards.js

$ CHECK_ROOT=$W/mir node $W/sub/check-foundation-guards.js ; echo exit=$?
        definition-of-ready.md: scanned 21 clear-voice line(s), 0 marker line(s)
  PASS  voice: 0 findings over 19/19 elements

== Result ==
ALL CHECKS PASSED
exit=0
```

`grep -c "15-security-audit" b.txt` → **0**. The planted file is not named anywhere in the passing
run: it left the scan entirely. Every published number held still — `visited` 19, `expected` 19, the
declared count 2, `secVoicePinMismatch` silent, the path-shape assertion satisfied.

### GREEN — the roster

`SEC_VOICE_MEMBERS` is a sorted `readonly` roster compared two-sided and order-insensitively against
the members parsed from the guard source. `secVoiceRosterMismatch(src)` is the pin as a VALUE — the
same shape `secVoicePinMismatch` already uses — so the falsifiability probe drives the SAME
comparison the permanent assertion drives rather than a second implementation of it. Its message
reports **declared-but-absent** and **present-but-undeclared** as two separate lists, because a
failure saying only that "a string moved" cannot say which half drifted, and a substitution moves
both at once.

**The harness's own premise is asserted before the equality:** the parse is non-empty, the roster is
non-empty, every parsed member is a repo-relative markdown path, and the parse is asserted to have
REACHED the literal the roster describes (`parsed.some(m => roster.includes(m))`). A regex that
silently matched an empty list would make the equality `[] === []` and the roster would pin nothing.

**Probe edge LANG-06/ordering** is answered by construction: the comparison is a two-way set
difference and therefore order-insensitive, so the DECLARATION is separately asserted equal to its
own sorted copy. It cannot drift into an order the comparison hides.

**Probe edge LANG-06/adjacency** is enforced rather than commented: the two halves of `VOICE_FILES`
touch, and `agent-factory/roles/security-nfr.md` is already a `ROLE_FILES` member that the guard's
declaration has always said must not be added here — with nothing enforcing it. The role half is
DERIVED from `listRoles` (the same lister the guard uses, never restated), the derivation is asserted
non-empty, `security-nfr.md` is asserted to really be a role file (so the disjointness assertion is
not vacuous), and no roster member may be a member of the role half.

**The pin is over the `.ts` SOURCE while the reviewer's reproduction edited the committed `.js`.**
The half of the closure covering that route is `npm run freshness`, measured in task 3 below rather
than asserted.

## Task 2 — the derived per-member property floor

Every roster member must satisfy at least one property derived from elsewhere in the tree:

- **Arm A** — membership in `safetySurfaceUnion()`, imported from `./generate-safety-surface.js`
  exactly as `scripts/check-diff-disposition.ts` already imports it. `agent-factory/workflows/15-security-audit.md`
  is a member (`register row flagged safety_surface: yes (kind: workflow)`).
- **Arm B** — equality with the path parsed out of `scripts/generate-asvs-checklist.ts`'s `OUT`
  literal. The module has top-level side effects and does not export `OUT`, so it is read as BYTES.

**Why two arms.** `security-nfr-checklist.md` is GENERATED by the ASVS generator, so it can never
appear in the disposition register that feeds arm A — a generated artifact is not an audited source
row. Arm B is therefore a two-artifact pin between two independently maintained files: the generator
that WRITES the checklist and the guard that SCANS it must agree about where it lives.

**The UNION is the assertion.** Testing arms independently and never their union is a recorded
failure of this phase. The set of members satisfying arm A OR arm B is asserted equal to the roster,
sorted, two-sided — and each arm is SEPARATELY asserted to be a proper subset (non-empty and strictly
shorter than the roster), so a later edit collapsing the two arms into one reds instead of silently
dropping a member.

**The decoy discriminates.** `agent-factory/checklists/definition-of-ready.md` — the exact path round
4 substituted in — is asserted absent from arm A, unequal to arm B's path, rejected by the
classifier, AND asserted to be a real tracked document (so the floor is what refuses it, not its
non-existence). Without this the floor could pass because every `agent-factory/**.md` path happens to
satisfy something.

**The arm-B parser is proven able to refuse.** `parseAsvsChecklistOut("const OUT = somethingElse;")`
is asserted to throw by name. A parser returning `undefined` on a rename would quietly move arm B's
member to "vouched by nothing" while the union assertion blamed the roster.

### Mutation-proven discrimination

A green suite is not proof, so the floor was measured against the exact scenario it exists for: a
**same-commit rewrite** moving BOTH the guard literal and the declared roster to the decoy. Run on a
scratch copy of the test module (created, run, deleted; `git status` confirmed clean after):

```
$ npx vitest run scripts/zz-mutation-29-33.test.ts -t "SEC_VOICE"
 ✓ the SEC_VOICE roster is pinned two-sided against the guard source          <- PASSES, as expected
 × every SEC_VOICE member satisfies a DERIVED property, and the two arms' UNION is the roster
   AssertionError: expected [ Array(1) ] to deeply equal [ …(2) ]
 × the SEC_VOICE probe REDS on a SUBSTITUTED member — the direction a cardinality is blind to
   AssertionError: the substitution must actually change the source
 Tests  2 failed | 4 passed | 205 skipped
```

The roster equality passes (both artifacts agree) and the **property floor reds** — which is exactly
the mechanism the floor was added for. The substitution case's own premise assertion also fired
correctly, refusing to run against bytes its mutation had not changed.

### The falsifiability probe now carries three directions

- **ADD** and **REMOVE** stay on the cardinality pin's case, renamed so both are visible in the
  reported case name. Neither was deleted for the new arm.
- **SUBSTITUTE** gets its own case, asserting in this order: (1) the mutation applied; (2) the parsed
  member count is UNCHANGED, and the decoy really arrived while the real surface really left; (3)
  `secVoicePinMismatch` returns `null` — the cardinality pin's blindness is MEASURED, so the roster's
  necessity is evidence rather than a claim; (4) `secVoiceRosterMismatch` is non-null and names both
  paths; (5) the property floor rejects the decoy, and the substituted source's unvouched-for members
  are asserted to be exactly `[decoy]`.

## Task 3 — the declaration states what ships, and the `.js` route is measured

The paragraph at `check-foundation-guards.ts:1989` claimed the remedy applied here was the role
half's: "DECLARE the number, then compare the DERIVED set against it." **There is no derived set for
this half and none was compared.** The sentence was DELETED, not amended — a paragraph that survives
the change it describes is the same defect one module over.

The replacement states that this half has no single lister and cannot have one (one member is a
register-flagged safety surface, the other is a generated artifact that can never enter the
disposition register), then names the three mechanisms and what each catches:

1. **the `reportMeasured` denominator** — ADD and REMOVE, at gate run time; explicitly BLIND to a
   substitution, with the reproduction cited;
2. **the declared roster** — SUBSTITUTION, at source level, in `check-foundation-guards.test.ts`;
3. **the per-member property floor** — a roster itself rewritten to a non-security path.

It also names both residuals so the next reader meets them as decisions: the D-04 same-commit
companion edit is ADMITTED (a reviewability guarantee, not a mechanical one — the property floor
narrows it, it does not close it), and the source-level pins do not see a committed-`.js` edit.

### The committed-`.js` route, MEASURED

Control, on a fresh `git archive HEAD` mirror of the post-fix tree:

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
exit=0
```

Then ONE member substituted inside the committed `scripts/check-foundation-guards.js` only, with the
`.ts` untouched:

```
$ sed -i '' 's|"agent-factory/workflows/15-security-audit.md"|"agent-factory/checklists/definition-of-ready.md"|' \
      scripts/check-foundation-guards.js
$ cmp <(git show HEAD:scripts/check-foundation-guards.ts) scripts/check-foundation-guards.ts
PREMISE CONFIRMED: the mirror .ts is byte-identical to HEAD — only the .js was edited
$ grep -c "definition-of-ready" scripts/check-foundation-guards.ts
0

$ npm run freshness
STALE: scripts/check-foundation-guards.js — committed build output differs from a fresh tsc rebuild.
        Run `npm run build` and commit the result.
Freshness check FAILED: 1 stale build output(s) detected.
exit=1
```

**`npm run freshness` REDS and names the file.** No escalation was required.

### Both halves of the closure, visible side by side

Re-running round 4's reproduction against the POST-fix committed `.js` on a fresh planted mirror:

```
$ CHECK_ROOT=$W/mir2 node scripts/check-foundation-guards.js          # unmodified
  FAIL  voice: 1 finding(s) over 19 elements                          exit=1
$ CHECK_ROOT=$W/mir2 node $W/mir/scripts/check-foundation-guards.js   # .js substituted
  PASS  voice: 0 findings over 19/19 elements
ALL CHECKS PASSED                                                     exit=0
```

The gate at RUN TIME is still blind to a `.js`-only substitution — by construction, and now
disclosed in source rather than left as an unstated assumption. Freshness is what catches it. Both
halves are named in the declaration paragraph.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm run freshness` (clean tree) | exit 0 — "All build outputs fresh: 48 committed .js file(s)" |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **1990 passed / 2 skipped across 52 files** (round-4 baseline 1987) |
| `npx vitest run scripts/check-foundation-guards.test.ts -t "SEC_VOICE"` | exit 0 — **6 passed** |
| `check-foundation-guards` | exit 0 |
| `check-imperative-lexicon` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `check-banned-claims` | exit 0 |
| `check-audit-register` | exit 0 |
| `check-claim-anchors` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `git diff --exit-code 12d2e09..HEAD -- package.json package-lock.json` | exit 0 — byte-unchanged; no dependency added |
| `git status --porcelain` | no stray artifact — every plant was on a mirror outside the repo |

The six SEC_VOICE case names, all three probe directions present:

```
✓ SEC_VOICE_FILES cardinality is pinned against SEC_VOICE_FILE_COUNT, and the pin is not vacuous
✓ the SEC_VOICE roster is pinned two-sided against the guard source
✓ every SEC_VOICE member satisfies a DERIVED property, and the two arms' UNION is the roster
✓ the SEC_VOICE probe REDS on a SUBSTITUTED member — the direction a cardinality is blind to
✓ the SEC_VOICE cardinality pin REDS on an ADDED and on a REMOVED member — the falsifiability probe
✓ the SEC_VOICE cardinality drift REDS THE GATE ITSELF, not only a source-level assertion
```

**A green suite is not proof.** What is offered as evidence here is the RED transcript from the
committed build, the mutation-proven discrimination of the property floor against the same-commit
rewrite, and the measured freshness red on the `.js`-only route — not the passing count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The tripwire denominator is a same-commit companion pin and had to be re-measured**

- **Found during:** Task 3, running the full non-e2e regression.
- **Issue:** `scripts/check-foundation-guards.test.ts` publishes six numbers describing its OWN
  bytes (`TRIPWIRE_EXPECT_OCCURRENCES` and five siblings, plan 29-25). Adding three SEC_VOICE cases
  moved all six, so the suite failed at `expected 5391 to be 5353`. This is the pin working as
  designed — it is the D-04 same-commit companion for this module — not a defect in it.
- **Fix:** All six RE-MEASURED from the live tree (never adjusted until green), with the delta
  accounted for at the declaration:

  | number | before | after | delta |
  |---|---|---|---|
  | occurrences | 5353 | 5391 | +38 |
  | classified lines | 5281 | 5319 | +38 (the same 38 lines) |
  | statement-level multi-line | 1069 | 1084 | +15 |
  | quote-aware multi-line | 1063 | 1078 | +15 (the SAME delta — the counters did not diverge) |
  | counter disagreements | 14 | 14 | UNCHANGED |
  | subject-only multi-line | 577 | 589 | +12 |

  Round 3's figures (`ROUND_3_TRIPWIRE`) were left untouched: they are reproduced from `0ec8b61` by
  the premise case and are not a baseline this plan may move.
- **Measured en route, and worth recording:** the census counts raw occurrences of the scanned token
  over these very bytes, so a comment SPELLING that token literally becomes one. The first draft of
  the explanatory paragraph read 5392 instead of 5391 for exactly that reason. The prose was reworded
  and the declaration now warns a later editor.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `12c9b3c`

### Execution-flow note

The plan's task 1 is `type="tracer"`, whose interactive-mode protocol is to stop at a
`checkpoint:human-verify` after committing. It was run end-to-end instead, because the plan
frontmatter declares `autonomous: true` and `.planning/config.json` sets
`workflow.human_verify_mode: "end-of-phase"` — a mid-plan human checkpoint would contradict both.
The tracer's `<verify>` was re-run end to end after its commit and passed, which is the gate the
checkpoint exists to enforce.

## Known Stubs

None. No placeholder, empty-value or TODO was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
The plan's own register (T-29-33-01 … T-29-33-04, all `mitigate`) is discharged by the roster
(T-29-33-01), the measured freshness red (T-29-33-02), the deleted declaration sentence
(T-29-33-03) and the property floor (T-29-33-04). T-29-33-SC (`accept`) is discharged by asserted
absence: `package.json` and `package-lock.json` are byte-unchanged across the plan.

## Self-Check

- `scripts/check-foundation-guards.test.ts` — FOUND
- `scripts/check-foundation-guards.ts` — FOUND
- `scripts/check-foundation-guards.js` — FOUND
- commit `57affa1` — FOUND
- commit `354d88e` — FOUND
- commit `7f1c149` — FOUND
- commit `12c9b3c` — FOUND

## Self-Check: PASSED
