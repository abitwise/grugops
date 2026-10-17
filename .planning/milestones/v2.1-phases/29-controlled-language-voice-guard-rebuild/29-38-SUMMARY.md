---
phase: 29-controlled-language-voice-guard-rebuild
plan: 38
subsystem: controlled-language-guards
tags: [lang-04, wr-06, wp-04, two-artifact-pin, d-11, d-39, d-33, gap-closure-round-4]
status: complete
requires:
  - agent-factory/writing-profile.md (the WP-04 and WP-11 rule rows, plan 29-31 — read as bytes, WP-04 row unchanged)
  - scripts/check-imperative-lexicon.ts (STEPS_SECTION_RULE trio, STEPS_HEADING, FORM_REMEDY)
  - scripts/check-imperative-lexicon.test.ts (the four-member WP-11 pin and its four-mutation probe)
provides:
  - STEPS_ANCHOR_RULE_ID and STEPS_ANCHOR_RULE — WP-04's decidable sentence spelled once in the gate
  - a procedural-too-long refusal COMPOSED from the rule constant rather than paraphrasing it
  - stepsAnchorPin — six members over two rules and two artifacts, renamed for what it holds
  - a six-mutation falsifiability probe plus a control mutation that breaks no member
  - the drift route measured GREEN before the change and RED after, against the built artifact
  - the profile's own record that both rows are held, and of what is still not held
affects:
  - 29-39 (WR-07 tripwire relationships; WR-08 sectionBody level axis)
  - any later plan editing agent-factory/writing-profile.md rule rows
actuals:
  tokens: 13400
  tasks: 3
  commits: 3
tech-stack:
  added: []
  patterns:
    - "a mechanism named for one rule while deciding two is the guard-naming defect at the identifier line, not only at the printed output"
    - "pin the DECIDABLE half of a rule and say why the other half is not pinned, rather than pinning a sentence the module cannot check"
    - "a falsifiability probe needs a CONTROL mutation, or it proves sensitivity and never specificity"
    - "derive the count a census will move independently of the census, BEFORE touching the census literal"
    - "a const cannot be read before its declaration; when a rule constant gains a consumer, MOVE the block rather than spelling the rule twice"
    - "flattenBlock joins a block sequence before unquoting, so an embedded double-quoted region is scanned whatever the item's own quoting is"
key-files:
  created:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md
  modified:
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/writing-profile.md
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-37-SUMMARY.md
key-decisions:
  - "Only WP-04's SECOND sentence is pinned. Its first names no heading spelling, so no drift of it is visible to this gate and pinning it would assert an agreement the module cannot check. The plan said decidable half; this records which half and why."
  - "The rule-constant block MOVED above FORM_REMEDY instead of the constants being declared apart. The plan asked for them beside the WP-11 constants, and a temporal-dead-zone crash makes the literal reading impossible without a move. The alternative, two declaration sites 160 lines apart, is how a sixth spelling gets written by somebody who found only the first."
  - "Tasks 1 and 2 landed in ONE commit. Splitting them would have shipped, deliberately, a mechanism named wp11Pin while holding WP-04 — the exact D-11/D-39 defect this plan closes — for the duration of one commit."
  - "main was RED at 2ca3ac3 and the prior-work regression floor of 2027 was not reachable there. 29-37-SUMMARY.md's own frontmatter failed the D-49 control. Repaired under Rule 3 as a blocker, in its own commit, with the expressed text preserved and verified against a real YAML loader."
  - "The tripwire census literals were RE-MEASURED and the delta derived independently twice before any literal was touched. Re-reading a counter from the loop that moved it can only agree with itself."
patterns-established:
  - "Two-sided rule pin: every published rule sentence a gate repeats is spelled once in the gate, emitted where the gate cites the rule, and compared as bytes against that rule's own table ROW."
  - "Probe completeness is asserted, not counted by eye: the mutation table's expected-key SET is asserted equal to the pin's own member-key set, so a member added without a mutation reds."
requirements-completed: [LANG-04]
coverage:
  - id: D1
    description: "WP-04's decidable sentence is spelled once in the gate and emitted in the refusal that already cited the rule"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts # WR-04 / WR-06: a prose-only `## Steps` section and an over-long step are RED, and the refusals name BOTH RULES"
        status: pass
      - kind: other
        ref: "occurrence count of the sentence in scripts/check-imperative-lexicon.ts = 1, derived by indexOf scan"
        status: pass
  - id: D2
    description: "The pin holds WP-04 from both artifacts and reds by name when either side drifts"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts # WR-05 / WR-06: the two-artifact pin FAILS on each of the SIX ways WP-11 and WP-04 can drift"
        status: pass
      - kind: other
        ref: "adversarial reproduction against the built .js — profile reversion reds profile/wp04, gate reword reds gate/wp04; transcripts in this SUMMARY"
        status: pass
  - id: D3
    description: "The profile records that both rows are held two-sided, and what is still not held"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "check-imperative-lexicon and check-banned-claims output byte-identical before and after the edit; WP-04 row byte-unchanged"
        status: pass
metrics:
  duration: 50m
  completed: 2026-08-16
---

# Phase 29 Plan 38: WR-06 — a published claim about two rules, held by an assertion about one

`WP-04`'s decidable sentence is now spelled once in the gate, emitted in the refusal that already
cited the rule, and held from both artifacts by a six-member pin named for the two rules it holds.
The drift it closes was measured passing everything first.

## The finding, reproduced before it was closed

Plan 29-31 narrowed **two** profile rows to the literal `## Steps` and published a section titled
"The heading spelling `WP-11` and `WP-04` decide, and the floor beneath it", asserting of both that
they "name the literal heading `## Steps` … because that is the spelling the gate decides." The
mechanism built beside it held `WP-11`'s two sentences only.

**The assertion count, measured with its filter shown.** Two commands, one filtering comment lines
and one narrowing to assertion expressions:

```
$ grep -rn "WP-04" scripts/*.test.ts
scripts/check-imperative-lexicon.test.ts:587:  it("the SAME 21-word sentence as prose is NOT a finding — the section anchor decides (WP-04)", …
scripts/check-imperative-lexicon.test.ts:1588:// `WP-11` and `WP-04` are published for `## Steps` and decided for that spelling only. Every other

$ grep -rn "WP-04" scripts/*.test.ts | grep -vE ':[0-9]+: *(//|\*|/\*)'
scripts/check-imperative-lexicon.test.ts:587:  it("the SAME 21-word sentence as prose is NOT a finding …

$ … | grep -E "expect\(|toContain|toBe|toEqual"
(none)
```

Raw **2**, comment-filtered **1** — and that one is a case NAME, not an assertion. Assertions naming
`WP-04` across every test module in the tree: **zero**.

**The reversion, run rather than argued.** The level-agnostic wording 29-31 removed as fail-open
(`A bullet under a steps heading is procedural.`) was restored to the row on a **git-backed clone of
`HEAD`** — a clone rather than a `git archive` mirror, because `git archive` produces no `.git` and
28 harness cases then fail for want of `git ls-files`, which would have drowned the signal.

| run | seven gates | non-e2e suite |
|---|---|---|
| unmutated clone (baseline) | all exit **0** | 2026 passed / 1 failed / 2 skipped |
| `WP-04` row reverted to the level-agnostic wording | all exit **0** | 2026 passed / 1 failed / 2 skipped |

Not one number moved. Gate-by-gate, both runs: `check-foundation-guards` 0, `check-imperative-lexicon`
0, `check-diff-disposition` 0, `check-banned-claims` 0, `check-audit-register` 0, `check-claim-anchors`
0, `check-public-docs-vocabulary` 0.

The single failure in **both** columns is not the mutation — see *The blocker* below.

## What was built

| Artifact | File | Kind |
|---|---|---|
| `STEPS_ANCHOR_RULE_ID`, `STEPS_ANCHOR_RULE` | `scripts/check-imperative-lexicon.ts` | `WP-04`'s id and decidable sentence, spelled once |
| the relocated five-constant rule block, above `FORM_REMEDY` | `scripts/check-imperative-lexicon.ts` | placement with its reason recorded |
| `FORM_REMEDY["procedural-sentence-too-long"]` composed from the constant | `scripts/check-imperative-lexicon.ts` | the gate's half of the pin |
| `wp04Row` | `scripts/check-imperative-lexicon.test.ts` | second row lookup |
| `stepsAnchorPin` / `stepsAnchorBroken` / `StepsAnchorPinMember` | `scripts/check-imperative-lexicon.test.ts` | renamed aggregate, six members |
| `gate/wp04`, `profile/wp04` | `scripts/check-imperative-lexicon.test.ts` | two new member keys |
| the six-mutation probe, its distinctness assertions and the control | `scripts/check-imperative-lexicon.test.ts` | falsifiability |
| the tripwire census, re-measured at this boundary | `scripts/check-foundation-guards.test.ts` | boundary re-measurement |
| the two-sided-pin paragraph | `agent-factory/writing-profile.md` | additive prose |

### The sentence is spelled once

```
occurrences of "A bullet under a `## Steps` heading is procedural." in check-imperative-lexicon.ts: 1
```

Counted by `indexOf` scan, not `grep -c` — `grep -c` counts matching **lines** and would have
reported 1 for a line carrying the sentence twice.

### The emission

Before, the refusal paraphrased the rule it cited:

```
Remedy: split the step into two steps. A procedural sentence is bounded at 20 words (WP-02) and the
section anchor decides that the bound applies here (WP-04).
```

After, it carries the rule's own bytes:

```
Remedy: split the step into two steps. A procedural sentence is bounded at 20 words (WP-02), and
WP-04 is what makes that bound the one applied here: A bullet under a `## Steps` heading is
procedural.
```

### The fixture had to grow, and the reason is the interesting part

`WP-04`'s sentence rides on `FORM_REMEDY`'s procedural-too-long entry, which is **rendered only when
a procedural sentence actually exceeds its bound**. The pin reads the stdout of the prose-only
`## Steps` mirror, which produces no such finding. A `gate/wp04` member read off that output would
have been asserting the sentence was absent — a member green for the wrong reason, which is the
shape this round keeps charging.

This was **probed before it was designed around**, not assumed: a throwaway case dumped the gate
output of a two-plant mirror and confirmed both refusals land in one run. The second plant is a
workflow carrying one over-long step bullet; it joins both file sets, so the `WP-11` inequality is
still produced by the prose-only plant alone. The case now asserts `[procedural-sentence-too-long]`
and the second file's name **before** the pin is consulted, so a `gate/wp04` failure can only be a
drift and never a fixture that quietly stopped producing the refusal.

## The proof the two new members are load-bearing

Both directions, against the **committed `.js`**, each restored immediately afterwards.

| mutation | result |
|---|---|
| `WP-04` row reverted to the level-agnostic wording, real tree | **2 failed / 60 passed** — `the PROFILE's WP-04 row does not carry WP-04's ANCHOR sentence: A bullet under a \`## Steps\` heading is procedural.` and `expected [ 'profile/wp04' ] to deeply equal []` |
| `STEPS_ANCHOR_RULE` reworded in the gate, rebuilt | **2 failed / 60 passed** — `the GATE's refusal does not carry WP-04's ANCHOR sentence: …` and `expected [ 'gate/wp04' ] to deeply equal []` |
| unmutated | 62 passed |

Each names the member, the artifact and the sentence.

**A third route is closed by the type checker, found by attempting it.** The first gate-side mutation
tried was reverting `FORM_REMEDY` to its paraphrase, leaving the constant declared and unused.
`tsc` exits **1** under `noUnusedLocals`, so the build never produced a `.js` and the suite ran
against the old artifact — 62 passed, proving nothing. That near-miss is recorded because it is
exactly how a mutation proof reports a false green: **the harness's own premise, that the artifact
under test is the mutated one, has to be asserted.** The mutation was replaced with a compilable
reword, which reds as shown above.

## The probe reaches six, and gains a control

Six mutations, one per member, each asserting its input changed before asserting the break, each
asserting the broken-key list equals exactly one key.

**Completeness is asserted rather than counted by eye.** A vacuity floor catches an empty mutation
table and never a silently short one, so the expected-key set is derived from the mutation table and
asserted (a) to have six distinct members and (b) to **equal the pin's own member-key set**. A
member added later without a mutation reds; a mutation duplicating a cell reds.

**The control.** Six arms that all red prove the pin is sensitive, never that it is specific, and a
pin that reds on every unrelated edit trains a maintainer to clear it unread — the behaviour this
same round writes a separate warning about. The control edits the gate's trailing scan-set advice
and both rows' STATUS cells, asserts all three inputs actually changed, and requires the broken-key
list to be **empty**.

## The rename

`wp11Pin` → `stepsAnchorPin`, `wp11Broken` → `stepsAnchorBroken`, `Wp11PinMember` →
`StepsAnchorPinMember`. `wp11Row` kept and `wp04Row` added beside it: they read two different rows,
and only the aggregate was misnamed.

**References updated: 9.** That is every occurrence of the three former identifiers at `HEAD~2`,
derived by counting them in `git show HEAD~2:scripts/check-imperative-lexicon.test.ts`. After the
change `grep -rn "wp11Pin\|wp11Broken\|Wp11PinMember" scripts/` returns **nothing** — no alias, and
no comment naming a former identifier as though it still exists. The rename rationale at the
declaration describes what the mechanism used to hold without spelling the retired names.

## The tripwire census, re-measured

Adding assertions moves four of the seven exact-equality counters in
`scripts/check-foundation-guards.test.ts`. They were **re-measured from the live tree**, never
adjusted until the case went green.

| counter | before | after | delta |
|---|---|---|---|
| modules | 47 | 47 | — |
| occurrences | 5589 | 5600 | +11 |
| classified | 5516 | 5527 | +11 |
| multi-line statements | 1146 | 1153 | +7 |
| quote-aware | 1139 | 1146 | +7 |
| counter disagreements | 15 | 15 | — |
| multi-line subjects | 636 | 641 | +5 |

**The +11 was derived independently of the census, twice, before any literal was touched** — over
the plan's diff (13 added, 2 removed, net +11) and over the whole file at `HEAD` versus the working
tree (252 → 263). Three derivations, one number. The occurrence and classified deltas being equal
says every added assertion opened its own classified line and none landed inside a string. The two
paren counters moved together, so this boundary adds no new instance of the measurement's own error
and the disagreement count is unchanged. The added comment was checked for the counted token: it
adds **0**.

## The profile edit, and its inertness

15 insertions, **0 deletions**. `WP-04`'s row is byte-unchanged — `git diff` on the file shows no
rule-table row moved at all. Rewording the row in the plan that pins it would have made the pin's
first green run a comparison against bytes this plan itself wrote.

The paragraph went into the **existing** rationale section that already makes the two-rule claim,
and it states what is not held in the same breath: `WP-04`'s first sentence names no spelling, and
the undecided ATX levels stay a disclosed floor, counted rather than decided.

**Confirmed by reading, as the plan required:**

- `agent-factory/writing-profile.md` is the **contract**, not a governed-corpus member.
  `governedCorpus()` returns 47 members across `workflows 19, checklists 13, seedTemplates 13,
  contracts 2`, and **zero** of them match `writing-profile`. The module's own header line 23 says
  so: "`agent-factory/writing-profile.md` is the contract".
- `roleCeiling()` switches on a role file's basename over 17 named cases and returns `""` by
  default. `writing-profile.md` is not a role file and the string `writing-profile` does not appear
  anywhere in `scripts/check-foundation-guards.ts`. **No byte ceiling covers this document.**

**Confirmed by measurement.** Both guards that read the file were captured before and after:

```
check-imperative-lexicon output BYTE-IDENTICAL before and after
check-banned-claims  output BYTE-IDENTICAL before and after
```

So the governed-document count (47 in 4 parts), the Technical Names count (76), and the exemption
region's two published numbers (suppresses **10** occurrences, reaches **62** lines) all held. The
third reader, `scripts/audit-model.ts`, mentions the profile only in a comment about registry rows.

## The blocker: `main` was red before this plan started

**`main` at `2ca3ac3` failed `npx vitest run --exclude '**/scripts/e2e/**'`.** The prior-work
regression floor of "2027 passed / 2 skipped" was the intended state and was not reachable there.

`scripts/frontmatter.test.ts`'s D-49 false-red control parses every tracked markdown file. Two
scalars in **`29-37-SUMMARY.md`'s own frontmatter** carried `\n` inside a double-quoted region,
which is not on `DQ_ESCAPE_ALLOWLIST` (`\"`, `\\`, `\/`), so the file was refused.

Fixed under deviation Rule 3 in its own commit, because it made this plan's own acceptance criterion
unreachable.

**The non-obvious part, found by bisection.** Re-quoting the sequence **item** does not help.
`flattenBlock` joins a block sequence *before* unquoting, so the joined value is not wholly quoted
and `scanEmbeddedDoubleQuoted` inspects every embedded `"…"` region regardless of the item's own
quoting. The embedded JS string literal had to change quote style. Both scalars are now single-quoted
YAML carrying `` `split('\n')` ``, and a real YAML loader (`/usr/bin/ruby -ryaml`, Psych/libyaml)
resolves them to the same text they expressed before:

```
patterns[3]: `^`/`$` under `m` break at CR, U+2028 and U+2029; `split('\n')` does not — …
decisions[2]: The witness regex spells its separators `[^\S\n]` — `\s` minus the newline. …
```

**The structural cause is worth naming: a SUMMARY is written after the regression run it reports**,
so a defect in the SUMMARY's own frontmatter cannot be caught by that plan's own evidence. Logged as
`D-38-3` in `deferred-items.md` with the trap spelled out for the next executor. This SUMMARY's
frontmatter carries no backslash at all.

## Verification

| criterion | evidence |
|---|---|
| mirror transcript: level-agnostic wording passes at HEAD | seven gates exit 0, suite 2026/1/2 identical to baseline (table above) |
| comment-filtered WP-04 assertion count before the change | raw 2, filtered 1 (a case name), assertions **0** — commands shown |
| `STEPS_ANCHOR_RULE_ID` / `STEPS_ANCHOR_RULE` exist; sentence appears once | occurrence scan = **1** |
| `FORM_REMEDY` composed from the constant | before/after refusal text quoted above |
| pin has six members; `profile/wp04` compared against the ROW; both lookups asserted found separately | `stepsAnchorPin(gateOutput, row, anchorRow)`, two `toBeDefined()` before any comparison |
| a case mutates the WP-04 row and asserts exactly `profile/wp04` breaks | mutation 6 of the probe, plus the real-tree reproduction |
| six mutations, six distinct keys, each asserting its mutation applied | probe; distinctness and set-equality asserted |
| a control asserts the broken-key list is empty | control mutation, three changed-ness assertions first |
| no former aggregate name remains; count recorded | `grep` returns nothing; **9** references updated |
| `npx vitest run scripts/check-imperative-lexicon.test.ts` exits 0 | **62 passed** |
| rationale paragraph added, WP-04 row byte-unchanged | 15 insertions / 0 deletions; no rule row in the diff |
| profile is the contract, no byte ceiling | `governedCorpus()` 47, zero matches; `roleCeiling()` default `""` |
| governed-document count identical across the edit | both gate outputs **byte-identical** |
| `npm run build` exits 0; `npm run freshness` fresh | 0; "All build outputs fresh: 48 committed .js file(s)" |
| non-e2e suite at or above the floor | **2027 passed / 2 skipped across 52 files**, exit 0 |
| all seven gates exit 0 | foundation-guards 0, imperative-lexicon 0, diff-disposition 0, banned-claims 0, audit-register 0, claim-anchors 0, public-docs-vocabulary 0 |
| `git diff --exit-code package.json package-lock.json` | exit **0** |

Note on the floor: the plan's criterion named 1987 (round 4). The live figure is 2027, which the
prior-work brief corrected; both are cleared.

## Deviations from Plan

### 1. [Rule 3 - Blocking] `main` was red; `29-37-SUMMARY.md` frontmatter repaired

**Found during:** Task 1's baseline measurement. **Issue:** the D-49 false-red control refused
`29-37-SUMMARY.md`, so the non-e2e suite could not exit 0 and Task 3's acceptance was unreachable.
**Fix:** two frontmatter scalars re-quoted, expressed text preserved and verified against a real
YAML loader. **Files:** `.planning/phases/29-controlled-language-voice-guard-rebuild/29-37-SUMMARY.md`.
**Commit:** `dd16917`.

### 2. [Plan deviation] Tasks 1 and 2 landed in one commit

The plan splits the pin extension (Task 1) from the rename (Task 2). Committing Task 1 alone would
have shipped, on purpose, a mechanism named `wp11Pin` while holding `WP-04` — precisely the D-11 /
D-39 defect this plan exists to close — for the length of one commit. They landed together in
`bd308d4`. Every Task 1 and Task 2 acceptance criterion is evidenced separately above.

### 3. [Plan deviation] The rule-constant block was MOVED, not extended in place

The plan asked for the new constants "immediately beside the WP-11 constants", which sat ~160 lines
**below** `FORM_REMEDY`. A `const` cannot be read before its declaration, so the literal reading is a
temporal-dead-zone crash at module load. The whole five-constant block moved above `FORM_REMEDY`
instead, keeping the constants beside each other and above their first use. Checked before moving:
the only line-number citation into this module (`docs/audit/29-locator-unification.md:34`) points at
lines well above the moved range — and is independently stale, logged as `D-38-2`.

### 4. [Plan correction] The RED reproduction used a clone, not a `git archive` mirror

The plan specifies `git archive HEAD`. That produces no `.git`, and **28** harness cases then fail
for want of `git ls-files` and reachable base commits — noise that would have hidden the one-test
signal. The `git archive` mirror was run first and its 28 failures diagnosed as harness artifacts
before switching to a `git clone`, which carries history and isolates the mutation to a single
variable. `check-diff-disposition` specifically cannot run at all without a repository.

### 5. [Plan deviation] `LANG-04` is NOT re-marked complete in `REQUIREMENTS.md`

`requirements mark-complete LANG-04` flipped the traceability row from `Gaps Found` to `Complete`.
**That was reverted.** Round-5 verification has not run, and every round-4 plan before this one
declined the same flip on the same grounds — the ROADMAP phase note says so in as many words:
"Neither LANG-06 nor LANG-07 is re-marked complete by any of the three plans — the closures await
round-5 re-verification". A requirement marked complete by the plan that claims to close it is the
self-certification this phase exists to remove, and CLAUDE.md's no-fabrication constraint outranks
the mechanical step. `requirements-completed: [LANG-04]` stays in this SUMMARY's frontmatter as the
plan's own claim; the traceability row stays `Gaps Found` until a verifier moves it.

### 6. [Rule 2 - Accuracy] The ROADMAP phase note said "3 of 7 executed"

It had said so since 29-35, through the landing of 29-36 and 29-37. Corrected to **6 of 7** with the
three later plans named, because a visible board carrying a number known to be wrong is the same
defect class as a rule published wider than its assertion.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

## Threat Flags

None. This plan introduced no network endpoint, auth path, file-access pattern or schema change. The
only new file-read is the existing profile read, widened by one additional row lookup in a test.

## Self-Check: PASSED

Files claimed created/modified, verified present:

```
FOUND: scripts/check-imperative-lexicon.ts
FOUND: scripts/check-imperative-lexicon.js
FOUND: scripts/check-imperative-lexicon.test.ts
FOUND: scripts/check-foundation-guards.test.ts
FOUND: agent-factory/writing-profile.md
FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md
```

Commits claimed, verified in `git log`:

```
FOUND: dd16917  fix(29-38): re-quote two 29-37 SUMMARY frontmatter scalars so the D-49 control parses
FOUND: bd308d4  feat(29-38): WP-04's decidable half held from both artifacts by a six-member pin
FOUND: dcd2ee8  docs(29-38): the profile records that both steps-anchor rows are held two-sided
```
