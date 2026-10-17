---
phase: 29-controlled-language-voice-guard-rebuild
plan: 18
subsystem: controlled-language-guards
tags: [LANG-04, LANG-06, IN-03, WR-06, case-agreement, bounded-exemption, fence-authority]
status: complete
requires:
  - "scripts/voice-model.ts countLexiconTokens — the ONE case-insensitive implementation of the caveman-occurrence match"
  - "scripts/frontmatter.ts fencedLineFlags — the single fence toggle, consumed rather than reimplemented"
  - "scripts/check-foundation-guards.test.ts consistentMirror / rolePath — the root-honest mirror helpers (29-14)"
  - "scripts/check-banned-claims.test.ts profileDoc / makeMirror — the hermetic CHECK_ROOT mirror builder"
provides:
  - "neutralizePhrases — three case-INSENSITIVE replacements agreeing with the counter, bound asserted from both sides"
  - "locateExemptRegion — EXPORTED, and both its section-extent questions decided by the one fence toggle"
  - "ExemptRegion — exported so a case can assert the region's extent as a number"
affects:
  - "guard_voice — a sentence-initial brand phrasing in correct clear-voice prose no longer reds it"
  - "guard_banned_claims — the exemption region survives a fenced `## ` line and a fenced quotation of its own heading"
  - "the ./frontmatter.js non-test consumer pin — SEVEN to EIGHT, moved with its reason"
tech-stack:
  added: []
  patterns:
    - "An EXEMPTION must answer the identity question exactly the way the predicate it exempts from answers it"
    - "A widening is proven from BOTH sides — permissive cases that newly pass AND scope controls that must stay red"
    - "Test the UNION on ONE line: an exemption and a violation together is the only shape that tells bounded from prefix-swallowing"
    - "Assert the MECHANISM through what the gate PRINTS, not only through its exit code"
    - "Order the richer assertion FIRST so a RED names the guard instead of reporting a bare number"
    - "One format-aware authority per predicate — consume the toggle, never re-declare the delimiter class"
    - "Name the fail-closed / fail-open ASYMMETRY in source when two structurally identical fixes ship in one round"
    - "Commit, THEN mutate, THEN restore from the commit; every mutation script exits non-zero on a no-op apply or a failed build"
decisions:
  - "D-18-A: the fix is three `i` flags and nothing else — the replacement ORDER and the three marker-free fillers are byte-unchanged, because the order is load-bearing and already documented"
  - "D-18-B: the bound is THREE PHRASINGS, not a `grug` prefix; asserted by two controls that are green on BOTH builds plus one union case that is red before and green after"
  - "D-18-C: `locateExemptRegion` is EXPORTED — no exit code can express where a region STOPS, and a predicate a case cannot reach is a predicate nothing pins (the phase-27 disclosure precedent)"
  - "D-18-D: the two named refusals and the empty-region refusal are byte-unchanged; the fix narrows WHICH LINES are consulted, never what a refusal says"
  - "D-18-E: the plan's `grep -c 'gi)'` criterion is unsatisfiable against this code shape and was replaced by `grep -c '/gi,'` (0 → 3), which measures the same property"
  - "D-18-F: the ./frontmatter.js consumer pin moves 7 → 8 rather than being loosened — the pin going red is the pin working"
metrics:
  duration: 42m
  completed: 2026-08-15
actuals:
  tokens: 78000
  tasks: 3
  commits: 5
---

# Phase 29 Plan 18: Case-Agreeing Neutralizer, Fence-Aware Exemption Region Summary

Both remaining in-scope findings were one authority disagreeing with another about the same
question, and both are closed by making the second authority READ the first — with the one exemption
this plan widens bounded from both sides and measured.

## The two defects, and the single shape they share

| ID | The two authorities | What disagreed | Direction |
|---|---|---|---|
| IN-03 | `neutralizePhrases` vs `countLexiconTokens` | whether a caveman occurrence is decided case-insensitively | fail-CLOSED (reds correct text) |
| WR-06 | `locateExemptRegion` vs `fencedLineFlags` | whether a `## ` line inside a fence is structure | fail-CLOSED (checks more, refuses a correct document) |

Both are behaviour-preserving on the live tree — measured on both sides, not assumed. That is exactly
why every proof below is a planted adversarial input rather than a moved number.

---

## Task 1 — the neutralizer and the counter agree about case (IN-03)

### The RED transcripts, verbatim, against the pre-change committed build (`422b31f`, plan 29-17)

Each of the three permissive plants goes into `agents-md-scribe.md` on a GREEN
`consistentMirror()`, so a nonzero exit is attributable to the plant. All three convict at
`guard_voice`, and the run ends `1 CHECK(S) FAILED` — one check, named.

```
+ [guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
+   FAIL  voice-discipline violation:
+ agent-factory/roles/agents-md-scribe.md:
+ 46:Grug voice is reserved for the fenced block.
```

```
+ [guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
+   FAIL  voice-discipline violation:
+ agent-factory/roles/agents-md-scribe.md:
+ 46:Grug wink stays out of a security finding.
```

```
+ [guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
+   FAIL  voice-discipline violation:
+ agent-factory/roles/agents-md-scribe.md:
+ 46:Run /GRUG to start the factory.
```

And the union/mechanism case, whose printed line is the direct evidence that the exemption did NOT
fire at all on the pre-change build:

```
+ [guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
+   FAIL  voice-discipline violation:
+ agent-factory/roles/agents-md-scribe.md:
+ 46:Grug voice, then grug smash the rock.
```

Full case ledger against `422b31f`:

```
 × guard_voice: a sentence-initial `Grug voice` in clear voice does NOT red the guard (IN-03)
 × guard_voice: a sentence-initial `Grug wink` in clear voice does NOT red the guard (IN-03)
 × guard_voice: the brand command in UPPER CASE in clear voice does NOT red the guard (IN-03)
 ✓ guard_voice: a sentence-initial `Grug smash` is NOT exempt and still reds (IN-03 scope control)
 ✓ guard_voice: a brand phrase adjacent to a bare caveman token does NOT protect it (IN-03 scope control)
 × guard_voice: on one line the brand phrase IS neutralized and the adjacent token is NOT (IN-03)
      Tests  4 failed | 2 passed
```

**The two scope controls are GREEN on the pre-change build and GREEN after.** A control that was
never green before the change proves nothing about the change, and these two are the whole reason
the widening is safe.

### The GREEN transcripts after

```
$ npx vitest run scripts/check-foundation-guards.test.ts
      Tests  179 passed (179)
```

All six cases green; the pre-existing 173 unchanged.

### The fix — three flags, and nothing else

```
-        .replace(/\/grug/g, "BRANDCMD")
-        .replace(/grug voice/g, "voice-meta")
-        .replace(/grug wink/g, "wink-meta"),
+        .replace(/\/grug/gi, "BRANDCMD")
+        .replace(/grug voice/gi, "voice-meta")
+        .replace(/grug wink/gi, "wink-meta"),
```

That is the ENTIRE executable diff of `scripts/check-foundation-guards.ts`. The replacement ORDER and
the three marker-free fillers are byte-unchanged; the order is load-bearing and its reason was already
recorded beside the function.

Source now states the fact that makes this a CORRECTION rather than a widening: the identity of a
caveman occurrence is decided in exactly one place (`countLexiconTokens`, whose own header says it is
the one implementation and that a consumer must never build its own), and the neutralizer is a named
exemption FROM that one decision. An exemption that disagrees with it about case is wrong in both
directions at once — it reds correct text on one side and leaves a hole on the other. The BOUND is
named too: three phrasings, not a `grug` prefix.

### The bound, asserted from both sides

| Direction | Case | Pre-change | Post-change |
|---|---|---|---|
| permissive | `Grug voice is reserved for the fenced block.` | RED | green |
| permissive | `Grug wink stays out of a security finding.` | RED | green |
| permissive | `Run /GRUG to start the factory.` | RED | green |
| **scope control** | `Grug smash the rock.` still convicts | green | green |
| **scope control** | `Grug voice, then grug smash the rock.` still convicts, and `grug smash the rock.` is named in the finding | green | green |
| union / mechanism | the SAME line prints `voice-meta, then grug smash the rock.` | RED | green |

The last row is the one that makes the widening measurable rather than asserted. `guardVoice` prints
the line AFTER neutralization, so the printed text says which phrasings were exempted and which
survived: on one line, the brand phrase IS rewritten to its marker-free filler and the adjacent
caveman token is NOT. A widening proven only in the permissive direction would have shipped without
this row, and the two controls alone would pass on a build where the exemption never fired.

### The live aggregator did not move

```
sha256 before : a1ef20b0bf28f3beb6eab6624c33bdaa21002cb6b434ee173722a1154e1cdc71
sha256 after  : a1ef20b0bf28f3beb6eab6624c33bdaa21002cb6b434ee173722a1154e1cdc71
diff before after : empty
exit code before / after : 0 / 0
```

Compared by digest AND by `diff` in both directions.

### The frozen source this file owns is undisturbed

```
$ git diff -U0 -- scripts/check-foundation-guards.ts | grep '^@@'
@@ -2014,0 +2015,26 @@ const EXPECTS_CAVEMAN_FENCE = new Set<string>(ROLE_FILES);
@@ -2020,3 +2046,3 @@ function neutralizePhrases(text: string): string {

$ git diff -- scripts/check-foundation-guards.ts | grep '^[-+]' | grep -cE 'MEMORY_FORM_|TIER_BEATS|ceiling'
0

$ node scripts/check-diff-disposition.js | grep -o 'positive guard literals [0-9]*/[0-9]*'
positive guard literals 9/9
```

Two hunks, both inside or immediately above the neutralization function. The four frozen declarations
sit at lines **761** (`TIER_BEATS`) and **1234–1238** (the three memory-form constants) — ABOVE the
edit, so the added comment is structurally incapable of retargeting the first-textual-occurrence
extractor even if it had named one, and it names none. `9/9` holds.

### Acceptance probes

```
/gi, in scripts/check-foundation-guards.ts, pre-change (33aaa25) : 0
/gi, in scripts/check-foundation-guards.ts, post-change          : 3   (lines 2046, 2047, 2048)
all three inside neutralizePhrases                               : yes (source read)
node scripts/check-foundation-guards.js                          : exit 0
```

### Adversarial self-check — per arm, apply-checked and build-checked

| Mutation | Applied | Build | Cases red | Which |
|---|---|---|---|---|
| A — brand-command flag reverted to `/g` | yes | 0 | 1 | the UPPER CASE case |
| B — `grug voice` flag reverted to `/g` | yes | 0 | 2 | the `Grug voice` case + the union/mechanism case |
| C — `grug wink` flag reverted to `/g` | yes | 0 | 1 | the `Grug wink` case |

**Disjoint and covering** — 1 + 2 + 1 = the four cases that were RED before the fix. No arm shipped
uncovered. The mutation script exits `9` on a no-op apply and `8` on a non-zero build, and its result
is discarded in either case, because a mutation that silently did not mutate is the same class of
defect as a gate that silently does not check. The working tree was restored from the commit after
each run, never by reverting uncommitted work.

**Commits:** `33aaa25` (RED), `96f1bc8` (fix + rebuilt `.js`).

---

## Task 2 — the exemption region reads the one fence authority (WR-06)

### The RED transcript, and each case's own mechanism

Four distinct mechanisms, not four instances of one symptom — each lands on a different wrong answer:

```
 × a fenced `## ` line inside the region does NOT truncate it
     agent-factory/writing-profile.md:15:29 — banned standard-name literal "ASD-STE100" —
     "The grugops kit conforms to ASD-STE100."          (an exempt claim REPORTED)

 × PAIRED PLANT: the region's REAL end still ends it
     AssertionError: expected 2 to be 1                 (both plants reported, not one)

 × a FENCED occurrence of the region heading does not count toward the exactly-one assertion
     FAIL  the one named exemption region is declared as `agent-factory/writing-profile.md` §
     `## Disclaimer and honesty floor`, and that heading occurs 2 time(s) in the file …
                                                        (a correct document REFUSED)

 × the region's EXTENT is a number: it ends AFTER a fenced heading, not at it
     AssertionError: expected 11 to be greater than 11  (endBefore lands ON the fenced heading)

 ✓ TWO UNFENCED occurrences still produce the existing two-sided refusal, wording unchanged
 ✓ PREMISE: the live exemption document carries ZERO fenced heading lines
      Tests  4 failed | 28 passed (32)
```

The fourth is the one no exit code can express, and it is why `locateExemptRegion` was exported: a
gate that exempts the right lines and one that exempts too few both speak through findings, and they
differ only in where the region stops.

The fifth is the BOUND from the other side — making a fenced heading invisible must not make a real
second heading invisible too — and it is green on both builds with its refusal wording asserted
verbatim.

The sixth is the PREMISE, and its being green is what makes the behaviour-preserving claim a
measurement rather than a coincidence.

### The fix

```ts
// The toggle, computed ONCE over the document and consulted by BOTH scans below.
const fenced = fencedLineFlags(lines.join("\n"));

if (!fenced[i] && lines[i] === BANNED_CLAIM_EXEMPT_REGION.heading) headings.push(i);
…
if (!fenced[i] && SAME_LEVEL_HEADING.test(lines[i])) { endBefore = i; break; }
```

No second toggle, no re-declared delimiter class, **no opt-out parameter** — an opt-out is a second
grammar with extra steps. The two named refusals and the empty-region refusal keep their exact
wording and their fail-closed `null` return.

**The asymmetry is stated in source, not left to be inferred.** A truncated EXEMPTION region is
fail-CLOSED: more of the document gets checked, and a fenced quotation of the heading turns a correct
document into a named refusal. Its sibling in `check-diff-disposition` — 29-16's frozen-region
locator — is fail-OPEN: less gets protected. Both are one grammar too many; only one of them was ever
dangerous, and a reader meeting both fixes in one round should not have to infer which is which.

### GREEN after, and the live verdict proven unmoved

```
$ npx vitest run scripts/check-banned-claims.test.ts
      Tests  32 passed (32)

sha256 before : 0d26f0d711f01d740e622f5e587569e27148b0f509f385703e806893cf0858f3
sha256 after  : 0d26f0d711f01d740e622f5e587569e27148b0f509f385703e806893cf0858f3
diff before after : empty
  PASS  banned claims: 0 findings over 82/82 elements
exit code before / after : 0 / 0
```

The export-only intermediate step was ALSO verified byte-identical before the fence threading landed,
so the two changes are separable and neither is credited with the other's neutrality.

**Fenced lines re-derived at execution time in the exemption document**, through the same authority
the gate now consults:

```
agent-factory/writing-profile.md : 0 fenced `## ` lines, 0 fenced occurrences of the region heading
                                   (non-vacuity: the document DOES carry fences and DOES carry the heading)
```

The planner expected `0`; confirmed.

### The planted region numbers

```
fenced heading index in the fixture : 11
region endBefore, pre-change        : 11   (truncated AT the fenced heading)
region endBefore, post-change       : 21   (= the index of `## After the region`, the REAL end)
region headingAt                    : = lines.indexOf(BANNED_CLAIM_EXEMPT_REGION.heading)
```

The paired plant's expected line numbers are DERIVED from the fixture document at run time, never
typed, and the fixture asserts its own premise first: the two identical sentences are on DISTINCT
lines, the exempt one below the fenced heading and the reported one below the real end.

### Acceptance probes

```
grep -c 'fencedLineFlags' scripts/check-banned-claims.ts                  : 3   (criterion >= 2)
FENCE_DELIMITER_LINE in non-comment source                                : 0   (criterion 0)
node scripts/check-banned-claims.js                                       : exit 0
```

### Adversarial self-check — per arm

| Mutation | Applied | Build | Cases red | Which |
|---|---|---|---|---|
| D — heading match made fence-blind | yes | 0 | 1 | the fenced-heading-count case |
| E — region-end scan made fence-blind | yes | 0 | 3 | truncation + paired plant + the numeric extent |

Disjoint and covering: 1 + 3 = the four cases that were RED before the fix. Both arms independently
load-bearing.

**Commits:** `fb75e90` (RED + the export), `cbb6401` (fix + rebuilt `.js`).

---

## Task 3 — the round's closing floor

### Every exit code and count, this session

```
npm run typecheck                                    exit 0
npm run freshness                                    exit 0  — 48 committed .js match a fresh tsc rebuild
npx vitest run --exclude '**/scripts/e2e/**'         exit 0
    Test Files  51 passed (51)
         Tests  1799 passed | 2 skipped (1801)
      Duration  117.31s

node scripts/check-foundation-guards.js              exit 0   (0.10s)
node scripts/check-imperative-lexicon.js             exit 0   (0.05s)
node scripts/check-banned-claims.js                  exit 0   (0.05s)
node scripts/check-diff-disposition.js               exit 0   (1.84s)
VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js    exit 0
node scripts/check-kit-refs.js                                exit 0
```

Published counts, live tree:

```
  PASS  imperative lexicon — governed file(s) carrying a `## Steps` section: 0 findings over 19/19 elements
  PASS  sentence form — governed file(s): 0 findings over 47/47 elements
  PASS  LANG-01: 76 Technical Name(s) DERIVED from the kit — roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13
  PASS  banned claims: 0 findings over 82/82 elements
  PASS  LANG-04: 82 document(s) … kit 73, publicDocs 10, overlap 1; 20 pinned literal(s) across 3 group(s)
        positive guard literals 9/9
```

The plan's floor was 51 files / 1725 passed / 2 skipped. Against 29-17's **51 / 1787 / 2**: files
unchanged, passed **+12** — exactly the twelve new cases (six for IN-03, six for WR-06), skips
unchanged. No test was removed or weakened.

**The bare `npm test` script was never invoked.** Every run in this plan's transcript used
`--exclude '**/scripts/e2e/**'` or a single named file with a `-t` filter.

### The five-row cross-plan comparison table

| Plan | 4 gate exits | Regression files / passed / skipped | freshness pairs | aggregator wall clock |
|---|---|---|---|---|
| 29-14 | 0 / 0 / 0 / 0 | 51 / 1732 / 2 | 48 | recorded as `0s` (sub-second, unrounded value not captured) |
| 29-15 | 0 / 0 / 0 / 0 | 51 / 1743 / 2 | 48 | recorded as `0s` (same) |
| 29-16 | 0 / 0 / 0 / 0 | 51 / 1769 / 2 | 48 | 0.13s |
| 29-17 | 0 / 0 / 0 / 0 | 51 / 1787 / 2 | 48 | 0.11s |
| **29-18** | **0 / 0 / 0 / 0** | **51 / 1799 / 2** | **48** | **0.10s** |

Every moved number is attributed:

- **passed 1732 → 1743 → 1769 → 1787 → 1799.** Each step is the cases the owning plan claims:
  +11 (29-15), +26 (29-16), +18 (29-17), +12 (29-18). No unattributed movement.
- **file count 51 and skips 2 are flat across all five plans.** No test file was added or removed and
  no test was newly skipped.
- **freshness pair count is flat at 48** across all five, so no plan added or dropped a compiled unit.
- **aggregator wall clock 0.13 → 0.11 → 0.10s.** Monotonically DOWN across the three plans that
  captured it with two decimals; this plan added three regex flags and no quantifier or character
  class, so the superlinear-backtracking surface did not grow.
- **`check-diff-disposition` runs 1.87s (29-16) → 1.77s (29-17) → 1.84s (29-18).** Ordinary run-to-run
  variation on a gate that walks the whole diff; no plan changed it this round.
- **Unattributed drift found: NONE.**

**One honest gap in this table:** 29-14 and 29-15 recorded their gate timings rounded to whole
seconds, so their aggregator figures are `0s` rather than a two-decimal number. That is a
non-comparable cell, stated rather than back-filled with a number nobody measured at the time.

### The dormant escape-doubling incident, re-derived

```
.planning/STATE.md   longest line      : 7994 chars (line 17)
.planning/STATE.md   escape-run count  : 0   (grep -c '\\\\')
.planning/STATE.md   total lines       : 989
aggregator wall clock (3 runs)         : 0.10s / 0.10s / 0.10s
```

Zero escape runs and a longest line three orders of magnitude below the 262143-character runs of the
recorded incident. The superlinear regex meeting a pathological state file is DORMANT, and the
aggregator is unchanged at 0.10s.

### Working tree

```
$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
```

Exactly the three pre-existing out-of-scope entries. **No plant residue** — every reproduction lived
in a temp-dir mirror under the OS temp dir, so the live tree was never planted into. `package.json` is
untouched and zero packages were installed.

```
$ git diff --stat 422b31f..HEAD          # 29-17 closed at 422b31f
 scripts/check-banned-claims.js          |  49 ++++-
 scripts/check-banned-claims.test.ts     | 164 ++++++++++++++++-
 scripts/check-banned-claims.ts          |  55 ++++++-
 scripts/check-foundation-guards.js      |  32 +++-
 scripts/check-foundation-guards.test.ts | 131 ++++++++++++++
 scripts/check-foundation-guards.ts      |  32 +++-
 6 files changed, 449 insertions(+), 14 deletions(-)
```

Exactly the six files the plan names in `files_modified`, and no others.

---

## What this round did NOT close — named, because a green run must not imply otherwise

The gap-closure round addressed eight of the fifteen findings in `29-REVIEW.md` (CR-01, CR-02, CR-03,
WR-02, WR-05, WR-06, IN-01, IN-03) plus the LANG-08 override. **Seven findings were placed out of
scope by the user and remain OPEN.** A passing floor at the end of this round is not a closed review.

| ID | Still open — one line |
|---|---|
| **WR-01** | `guard_voice` reports line numbers from the FILTERED remainder, not from the source file, so a finding's line number does not locate the offending line in the document. |
| **WR-03** | Three near-identical directory walks exist, two of which have no cycle answer. |
| **WR-04** | `GENERATED_EXEMPT` is pinned by CARDINALITY only, with no membership assertion — a decoy can displace a real member while the count holds. |
| **WR-07** | The positive-guard-literal extractor scrapes source with `indexOf`, and its module-load cache is keyed on string identity of the root. |
| **WR-08** | Plan 29-04's path-literal de-duplication is incomplete — two more spellings remain. |
| **IN-02** | `rows` is computed and discarded on two of three frozen-source branches. |
| **IN-04** | `countWords`'s replacement loop terminates only by an unstated argument. |

Note that **WR-01 is adjacent to this plan's own IN-03 fix**: both concern `guard_voice`'s treatment
of the neutralized/filtered remainder. This plan changed WHICH phrasings are neutralized; it did NOT
change how line numbers are derived from the remainder, and it makes no claim about WR-01. The
reported line `46:` in every RED transcript above is a remainder line number, not a source line
number — WR-01 exactly, visible in this plan's own evidence and deliberately not fixed here.

## Honest ceilings

- **IN-03 is closed for CASE and for nothing else.** The exemption and the counter now answer the
  identity question the same way with respect to letter case. Unicode confusables, NFD spellings and
  a `grug` split across a line boundary were not probed, and no claim is made about them. The counter
  itself normalizes nothing.
- **The bound is proven on the shapes tested, not on the shape space.** Two controls and one union
  case establish that the exemption does not swallow an adjacent bare token. They do not establish
  that no string exists which the widened exemption swallows and the narrow one did not. The strongest
  statement available is the mutation result: every one of the three flags is independently
  load-bearing, and reverting any of them reddens a case.
- **WR-06 is closed for THIS locator.** The review named three fence-blind locators; 29-16 closed the
  frozen-region one, 29-17 closed the two table scans, and this plan closes the exemption region.
  Nothing is claimed about any locator outside those three.
- **The live tree proves nothing about either fix and was never asked to.** Both are behaviour-
  preserving at `a1ef20b0…` and `0d26f0d7…`, which is exactly why every proof is a planted input.
- **A green suite remains insufficient for a safety guard.** The twelve new cases are a floor. The
  ONE case that found a real coverage gap this session was not in the test files at all — it was the
  `./frontmatter.js` consumer pin, which went red the moment an eighth consumer landed.

## Threat register — dispositions honoured

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-29-60 | mitigate | Widening bounded to three phrasings and asserted from BOTH sides: three permissive cases RED before / green after, two scope controls green on both builds (including a line carrying a brand phrase AND a bare caveman token together), one union case proving the exemption fired and stopped. Live output byte-identical at sha256 `a1ef20b0…`. Three per-arm mutations, disjoint and covering |
| T-29-61 | mitigate | No declaration name written into any comment; the four frozen declarations sit ABOVE the edit at lines 761 and 1234–1238; two-hunk scoped diff touches none of them; `positive guard literals 9/9` re-asserted after the edit |
| T-29-62 | mitigate | Region located through the single fence toggle; a fenced heading neither truncates (`endBefore` 11 → 21) nor relocates it; both named refusals unchanged and their case green with wording asserted verbatim; two per-arm mutations, disjoint and covering |
| T-29-63 | mitigate | Three regex flags added; no quantifier and no character class added anywhere. Aggregator wall clock 0.10s against 29-17's 0.11s; STATE.md longest line 7994 chars with 0 escape runs |
| T-29-64 | mitigate | Seven still-open review findings named by identifier and one-line description, with an explicit statement that a green run does not close them — and WR-01's residual pointed out inside this plan's own transcripts |
| T-29-SC | accept | Zero packages installed; `package.json` untouched and absent from the diff |

## Deviations from Plan

### 1. [Rule 3 — an acceptance criterion unsatisfiable as written] `grep -c 'gi)'` replaced

The plan requires `grep -c 'gi)' scripts/check-foundation-guards.ts` to increase by exactly 3. That
string cannot appear: in `.replace(/x/gi, "y")` the regex flags are followed by a COMMA, never by a
closing parenthesis. The count is `0` both before and after the edit, so the criterion as written is
satisfied by no correct implementation and by no incorrect one either.

Replaced with `grep -c '/gi,'`, which measures the intended property — **0 → 3** — plus a source read
confirming all three increments are inside `neutralizePhrases` (lines 2046–2048). Recorded as D-18-E
rather than silently substituted.

### 2. [Rule 3 — a two-sided pin caught a real, intended change] The `./frontmatter.js` consumer pin moved 7 → 8

`check-banned-claims.ts` became the eighth non-test consumer of the fence toggle, and the two-sided
consumer list in `check-foundation-guards.test.ts` went red on the full regression run. That is the
pin working exactly as designed — it is the same list 29-16 moved 6 → 7 for the identical reason.

Moved with its reason recorded alongside its three siblings, plus the takes-exactly-`fencedLineFlags`
assertion for the new entry, and the fail-closed / fail-open direction stated against 29-16's sibling.
`scripts/check-foundation-guards.test.ts` is in this plan's `files_modified` (Task 3), so no file
outside the plan's scope was touched. Commit `4b2fea0`. Recorded as D-18-F.

### 3. [Rule 2 — missing coverage the plan's case list did not carry] The union/mechanism case

The plan specifies three permissive cases and two scope controls. The two controls PASS on the
pre-change build, and they would also pass on a build where the exemption never fired at all — so
between them they establish that the exemption does not over-reach, and nothing about whether it
reaches at all on a line that also carries a violation.

A sixth case closes that: on ONE line carrying both, the gate must print
`voice-meta, then grug smash the rock.` — the brand phrase neutralized, the adjacent token surviving.
It is RED before and green after, and mutation B confirms it is independently load-bearing. This is
the project's own "after splitting a predicate into arms, test their UNION" rule applied to the arms
this plan created.

### 4. [Recorded, not a deviation] The permissive cases assert the banner BEFORE the exit code

On a build where the exemption disagrees with the counter, `expect(status).toBe(0)` alone reports
`1 !== 0` and says nothing about which guard convicted — the RED would have been a bare number. The
output assertion runs first so the failure prints the whole run, which is how the four verbatim
`guard_voice` transcripts above exist at all. Both assertions still run.

### 5. [Recorded] `locateExemptRegion` and `ExemptRegion` are newly EXPORTED

A disclosure, made deliberately and for one stated reason recorded in source: the region's EXTENT is
a number no exit code can express. Proven behaviour-neutral in its own step — the gate's full output
was byte-identical after the export and before the fence threading landed — so the export is not
credited with the fix's neutrality nor the fix with the export's.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced. No test was
skipped and every `<verify>` in the plan was run.

## Threat Flags

None. This plan adds no network endpoint, auth path or schema at a trust boundary. It adds no new I/O
of any kind: `fencedLineFlags` reads an in-memory string, and the aggregator's file reads are
unchanged.

## Verification Against the Plan

| Plan verification item | Result |
|---|---|
| Three sentence-initial brand phrasings stop reding the voice guard | PASS — three cases, each RED against `422b31f` with the verbatim finding recorded, green after |
| Two adjacent-violation controls still red | PASS — both green on BOTH builds, one of them carrying a brand phrase and a bare caveman token on one line, plus a union case proving the exemption fired and stopped |
| The aggregator's full output is byte-identical before and after | PASS — sha256 `a1ef20b0…` both sides, `diff` empty |
| The four frozen declarations are untouched and the 9/9 literal count holds | PASS — two-hunk scoped diff, zero matches on the declaration names, `positive guard literals 9/9` |
| A fenced heading neither truncates nor relocates the banned-claim exemption region | PASS — `endBefore` 11 → 21 asserted as a number; the fenced-quotation case exits 0 with no `occurs 2 time(s)` |
| That guard's output is byte-identical at 0 findings over 82 elements | PASS — sha256 `0d26f0d7…` both sides, `0 findings over 82/82 elements` |
| All four gates, the validator and the kit-reference check exit 0 | PASS — 0/0/0/0, 0, 0 |
| Regression, typecheck and freshness exit 0 | PASS — 51 files / 1799 passed / 2 skipped; 48/48 fresh |
| The cross-plan comparison table and the still-open finding list are recorded | PASS — five rows with every moved number attributed; seven findings named |
| `git status --porcelain` lists exactly the three pre-existing out-of-scope entries | PASS |
| No command in this task's transcript is the bare test script | PASS |

## Requirements — advanced, deliberately NOT marked complete

`LANG-04` and `LANG-06` are left `[ ]` / Pending in `REQUIREMENTS.md`, on exactly the reasoning 29-17
recorded. This plan advances both — the voice guard no longer reds correct clear-voice text (LANG-06)
and the banned-claim guard locates its exemption through the same authority every sibling uses
(LANG-04) — but plan **29-19** of this same round still targets LANG-08's override, and **phase
verification has not run**. Checking a box now would publish a completion this plan cannot vouch for,
which is the repository's own no-fabrication rule applied to its own traceability trail. They are
advanced here and closed by whoever closes the round.

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — IN-03 RED | `33aaa25` | `scripts/check-foundation-guards.test.ts` |
| 1 — IN-03 fix | `96f1bc8` | `scripts/check-foundation-guards.ts`, `.js` |
| 2 — WR-06 RED + export | `fb75e90` | `scripts/check-banned-claims.ts`, `.js`, `.test.ts` |
| 2 — WR-06 fix | `cbb6401` | `scripts/check-banned-claims.ts`, `.js` |
| 3 — the consumer pin moves 7 → 8 | `4b2fea0` | `scripts/check-foundation-guards.test.ts` |

## Self-Check

- `scripts/check-foundation-guards.ts` — FOUND (three `/gi,` replacements at lines 2046–2048, all
  inside `neutralizePhrases`; `MEMORY_FORM_*` and `TIER_BEATS` byte-unchanged)
- `scripts/check-foundation-guards.js` — FOUND (rebuilt, freshness 48/48)
- `scripts/check-foundation-guards.test.ts` — FOUND (179 tests, 6 new + the moved consumer pin)
- `scripts/check-banned-claims.ts` — FOUND (`fencedLineFlags` imported and consumed, count 3;
  `FENCE_DELIMITER_LINE` count 0 in non-comment source; `locateExemptRegion` exported)
- `scripts/check-banned-claims.js` — FOUND (rebuilt, freshness 48/48)
- `scripts/check-banned-claims.test.ts` — FOUND (32 tests, 6 new)
- commits `33aaa25`, `96f1bc8`, `fb75e90`, `cbb6401`, `4b2fea0` — all FOUND

## Self-Check: PASSED
