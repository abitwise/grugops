---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-15T19:58:02Z
depth: standard
round: 3 (adversarial review of gap-closure round 2, diff 3ed76c1..HEAD)
files_reviewed: 17
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/voice-model.ts
  - scripts/voice-model.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-diff-disposition.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-audit-register.ts
  - scripts/check-audit-register.test.ts
  - scripts/audit-model.ts
  - scripts/audit-model.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/section-locator-oracle.test.ts
  - agent-factory/writing-profile.md
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Phase 29 (gap-closure round 2): Code Review Report

**Reviewed:** 2026-08-15T19:58:02Z
**Depth:** standard
**Diff range:** `3ed76c1..HEAD` (plans 29-20 … 29-26)
**Status:** issues_found

## Summary

The round's central structural move — deleting five private section-extent predicates and replacing
them with `unfencedHeadingIndex` / `sectionEndIndex` in `scripts/frontmatter.ts` — is sound in its
mechanics: both functions compose the one fence toggle, the `[from, lineCount]` contract holds at
every generated input, the level axis is pinned two-sided, and the consumers' import sets are pinned
by a derived scan that is proven falsifiable by a planted sixth module.

Two things are wrong at the level this project cares about.

**First, making `sectionEndIndex` fence-aware silently reopened the founding defect in
`readCavemanFence`, in a shape nobody probed.** A fence opened inside the caveman section and closed
*after* a later `#` / `##` heading now swallows every intervening section into `inside` and deletes
those lines from `outside`. `outside` can be driven to the empty string, at which point `guard_voice`
scans zero bytes for that file and prints a pass. On the pre-round-2 build the same bytes returned
`{ok:false, reason:"unterminated"}`. The module's own header (`voice-model.ts:123-128`) asserts the
old fail-closed behaviour is "UNCHANGED BY THE REWIRE" and forbids "a second arm that reaches past
the bound" — the code now reaches past the bound, and `voice-model.test.ts` supersedes half of that
paragraph without correcting it. Recorded variant **C1** in `docs/audit/29-locator-unification.md §6`
found this shape in `locateExemptRegion` and dismissed it as "Nothing NEW" because the
`BANNED_CLAIM_EXEMPT_SUPPRESSED` pin covers it. The voice guards have no equivalent pin, and the
variant was never run against `readCavemanFence`.

**Second, the "exactly one owner" claim that LANG-07 rests on is still false, and the module it is
false in is `audit-model.ts` — the very module plan 29-25 rewired and declared "the fifth and last
locator of the class."** `readRegistry` (`audit-model.ts:893, 933-950`) answers "where does this
block start and end" with a fence-blind heading recogniser plus a deferred index bound. It is
invisible to plan 29-25's owner classifier on *both* arms, and the classifier's own disclosed floor
asserts that the shape it misses is one "which no module in this tree uses today" — which is untrue
at line 893. I reproduced the consequence: a claim block written **inside a fenced example** is
parsed as a live `kind: safety`, `status: true` registry row, which enters `safetySurfaceUnion` and
therefore the D-18 exclusion list that LANG-02 consults to decide which files may not be reworded.
That is documentation read as live data, in the same round whose founding rule is that it must not be.

Live input sets for both criticals are **zero on the shipped tree** (0 role files whose caveman
interior contains a level ≤ 2 heading; 0 fenced `###` lines in the claim registry) — the same
posture as recorded residuals V-29-26-01 and -03. Neither is protected by a mechanism.

Six warnings follow, including one vacuous invariant in the new parser oracle: **I5 is unreachable in
all 7200 cells** (measured: 0 documents carry a second occurrence of the cell heading), so the sweep
never exercises the fenced-quotation-plus-real-heading shape that WR-01 was actually about.

The build is green. `npx vitest run scripts/section-locator-oracle.test.ts scripts/voice-model.test.ts
scripts/frontmatter.test.ts` → 327 passed. Every finding below is reachable through a passing suite.

---

## Critical Issues

### CR-01: the fence-aware bound lets the caveman block swallow later sections and empty `guard_voice`'s scan surface

**File:** `scripts/voice-model.ts:200-229` (bound consumed at `:200`, `outside` computed at `:226-228`);
authority at `scripts/frontmatter.ts:527-542`
**Severity:** Critical — fail-open, regression vs `3ed76c1`, no mechanism

**Issue.**
`sectionEndIndex` skips lines the one fence toggle flags. The caveman fence's *own interior* is
flagged. So a `#` or `##` heading written between the opening delimiter and the closing delimiter no
longer closes the section — and the close scan therefore keeps running past it. Every line from the
opening delimiter to the closing delimiter, *however many later sections that spans*, lands in
`inside` and is removed from `outside` by the filter at `:227`.

`guard_voice` scans `verdict.outside` and publishes **no measurement at all** — it is the one
foundation guard that does not fold through `reportMeasured`, so it emits a bare
`pass("voice: clear-voice surfaces free of caveman markers")` with no denominator. Nothing anywhere
notices that it scanned zero bytes.

**Reproduction** (against the committed `.js`):

```
$ node -e 'import("./scripts/voice-model.js").then(m=>{
  const d=["## Caveman prompt","```","grug club rock cave","","## Notes",
           "you no think, big brain swamp demon","```",""].join("\n");
  const v=m.readCavemanFence(d);
  console.log(v.ok, JSON.stringify(v.outside),
              m.countLexiconTokens(v.inside),
              JSON.stringify(m.countBannedConstructions(v.inside)));})'
true ""  8  {"article":0,"copula":0,"modal":0,"subordinator":0}
```

`outside` is the empty string. `guard_caveman_voice` passes both arms (8 ≥ 2 tokens, 0 banned).
`guard_voice` scans nothing and passes. The same bytes on the pre-round-2 build:

```
$ git show 3ed76c1:scripts/voice-model.js > /tmp/old/voice-model.js   # + frontmatter.js
$ node -e '…readCavemanFence(same document)…'
{"ok":false,"reason":"unterminated"}
```

**Failure scenario.** An author rewords `## Hard limits` (or any non-caveman section) into caveman
voice — the exact thing `guard_voice` exists to refuse — and hides it by leaving the caveman fence
open across the `##` heading above it. Both voice guards go green. Every published number
(`tokens N / content words M, banned K`) is computed over bytes belonging to another section, which
is the phase's founding defect verbatim.

Measured live reachability: **0 of 17 role files** carry a level ≤ 2 heading inside their caveman
interior today. The direction is nonetheless fail-open and the exemption is unmeasured.

**Why this is not variant C1.** `docs/audit/29-locator-unification.md §6` records C1 for
`locateExemptRegion` and dismisses it because `BANNED_CLAIM_EXEMPT_SUPPRESSED` reds when the swallowed
text carries a banned claim. The voice guards have no such pin: `readCavemanFence` publishes an
`inside` measurement but nothing measures `outside`, and nothing pins how far the fence may reach.

**Recommended direction.** Do not widen the reader. Give the exemption a mechanism the same shape
`check-banned-claims.ts` got in 29-23:

1. Refuse when `sectionEnd` is not the section the anchor opened — i.e. compute the *fence-blind*
   level-≤2 successor as well, and refuse `unterminated` by name when the fence's closing delimiter
   sits beyond it. That restores the pre-round-2 fail-closed direction without reintroducing a private
   predicate: it is one extra call to the same authority over a text with the caveman fence's own
   delimiters neutralised, or an explicit `heading-inside-interior` refusal arm.
2. And/or publish and two-side-pin what `guard_voice` actually scanned — `outside` line count per
   file — so a remainder that collapses is a red, not a silent pass. `guard_voice` is currently the
   only foundation guard with no measurement at all.

Whichever is chosen, correct `voice-model.ts:123-128` (see WR-01) in the same commit.

---

### CR-02: `readRegistry` is a sixth, fence-blind section locator, and it adopts a fenced example as a live safety claim

**File:** `scripts/audit-model.ts:893` (`CLAIM_HEADING_RE`), `:933-936` (the anchor scan), `:948` (the bound)
**Severity:** Critical — fail-open into the D-18 exclusion list; invisible to both derived scans; falsifies LANG-07

**Issue.**
```ts
const CLAIM_HEADING_RE = /^###\s+(\S+)\s*$/;          // :893
for (let i = 0; i < lines.length; i++) {
  if (CLAIM_HEADING_RE.test(lines[i])) headingIdx.push(i);   // :935 — no fence awareness
}
…
const end = n + 1 < headingIdx.length ? headingIdx[n + 1] : lines.length;   // :948
```

By the owner scan's own published definition — "a HEADING RECOGNISER … USED on a line that TERMINATES
OR BOUNDS a scan … a loop `break`, a `return` of an index, or an assignment to a bound" — this is a
section-extent construct. It is missed twice over:

- the **recogniser arm** requires a literal space (`/\/\^#(?:\{[\d,]+\})? /`); this one spells `\s+`.
  The classifier's own disclosed floor names that shape as item 4 and asserts it is one "**which no
  module in this tree uses today**" (`check-foundation-guards.test.ts`, LANG-07 block header). That
  statement is false at `audit-model.ts:893`, today.
- the **terminator arm** never sees it: the bound is not on or near the recogniser line — the indices
  are collected into an array and consumed 13 lines later.

So `SECTION_EXTENT_OWNERS = ["frontmatter.ts"]` and `SECTION_EXTENT_OWNER_COUNT = 1` are green over a
tree that has two owners, in the module plan 29-25 rewired and `docs/audit/29-locator-unification.md
§3` presents as the derivation that makes "the last member" a measurement rather than a belief.

**Reproduction** — a registry carrying a quoted example claim block:

    # Claim registry

    ### C-28-001
    - file: README.md
    - line: 4
    - kind: architecture
    - depends_on: autonomy
    - status: true

    ```
    The real claim sentence.
    ```

    ## How to write a claim block

    An example, quoted rather than declared:

    ```
    ### C-28-999
    - file: PHANTOM.md
    - line: 1
    - kind: safety
    - depends_on: none
    - status: true
    ```
    The phantom claim sentence.
    ```

```
$ node -e 'import("./scripts/audit-model.js").then(m=>console.log(
    JSON.stringify(m.readRegistry(FIXTURE_ROOT).claims.map(c=>({id:c.id,file:c.file,kind:c.kind})))))'
[{"id":"C-28-001","file":"README.md","kind":"architecture"},
 {"id":"C-28-999","file":"PHANTOM.md","kind":"safety"}]
```

**Failure scenario.** `generate-safety-surface.ts:85-90` unions `readRegistry(root).claims` filtered to
`kind === "safety"` into `docs/audit/28-safety-surface-exclusions.md` — the header of that generator
states it is "the list Phase 29's LANG-02 consults to decide which files a controlled-language pass
may reword, and which it may not touch." A `kind: safety` row planted in a **fenced example** therefore
adds a file to that exclusion list. Adding to an exclusion list is the fail-open direction for LANG-02:
a file becomes untouchable by the language pass on the strength of a code sample.

Nothing pins it. `check-audit-register`'s new equality three (`check-audit-register.ts:241-290`) pins
only the **register** arm's `safety_surface: yes` values. `check-diff-disposition`'s new containment
pin (`check-diff-disposition.ts:1437-1497`) floors only `derivedKit ⊆ watched`, so extra members are
invisible in both gates (see WR-06).

Measured live reachability: **0 fenced `###` lines** in `docs/audit/28-claim-registry.md` today
(42 claim-heading-shaped lines, 0 fenced). Same posture as V-29-26-01/-03.

**Recommended direction.** Close the sixth locator the way the first five were closed, in
`audit-model.ts` and not by widening the classifier: derive `headingIdx` from an unfenced scan
(`fencedLineFlags`, already imported in this module since 29-25), and take the block's end from the
same source. Then correct the owner classifier's floor item 4 — either recognise `#{n,m}\s` or state
truthfully that a module uses it and that this is an accepted blind spot. Retiring a false statement
about the tree is not optional in a repository whose second named systemic failure class is "a prose
claim wider than the assertion behind it".

---

## Warnings

### WR-01: the caveman reader's header asserts behaviour the same round deleted

**File:** `scripts/voice-model.ts:123-128`

**Issue.** The paragraph reads:

> THE COST, STATED SO IT IS NOT LATER "FIXED", AND UNCHANGED BY THE REWIRE: a `## ` line INSIDE the
> fence interior truncates the section before the closing delimiter, so such a document is refused
> `unterminated` … Do not add a second arm that reaches past the bound to find something it can vouch
> for; reaching past is the defect, not the remedy.

Both halves are now false. Measured:

```
$ node -e '…readCavemanFence(["# Role","## Caveman prompt","```","grug smash rock",
    "## Sneaky heading inside the fence","me think club","```","","## Notes","```","const a=1;","```",""]…)'
{"ok":true,"inside":"grug smash rock\n## Sneaky heading inside the fence\nme think club", …}
```

`voice-model.test.ts` explicitly supersedes the first half ("a heading INSIDE a terminated fence
closes nothing — the interior is returned whole") and records why; the source paragraph 100 lines
above it was left asserting the opposite, and the second half ("reaching past is the defect") is now
a description of what the shipped code does (CR-01).

**Failure scenario.** The next reader of this module derives its fail direction from this paragraph,
concludes the reader is fail-closed on an interior heading, and does not look for CR-01 — which is
exactly what happened between plan 29-20 and the round's own adversarial pass.

**Fix.** Rewrite the paragraph to state the shipped direction and the new cost, and either state
CR-01's exposure as a named residual or close it. A cost paragraph that survives the change it
describes is the class of defect WR-04 in this same round was raised for.

---

### WR-02: `audit-model.ts` now carries two disagreeing fence recognisers, one of them private

**File:** `scripts/audit-model.ts:986` (`parseClaimBlock`) vs `scripts/frontmatter.ts:390`
(`FENCE_DELIMITER_LINE`), consumed at `audit-model.ts:414-416` (`tableUnder`)

**Issue.** After 29-25, `tableUnder` decides "is this line fenced" through `fencedLineFlags`, i.e.
through `/^```/`. Thirty lines further down, `parseClaimBlock` decides the same question with a
private recogniser:

```ts
if (lines[i].trim() === "```") {   // :986
```

The two disagree on two axes:

| line (backtick runs written as B) | `FENCE_DELIMITER_LINE` = /^BBB/ | `parseClaimBlock` = trim() === "BBB" |
|---|---|---|
| `BBBtext` — a delimiter carrying an info string | delimiter | **not** a delimiter |
| `   BBB` — a delimiter indented three spaces (legal CommonMark) | **not** a delimiter | delimiter |

`check-foundation-guards.test.ts` pins `importedSymbols("audit-model.ts", "frontmatter")` with the
message "*never a heading-equality or section-end predicate of its own*", and
`docs/audit/29-locator-unification.md §3` presents this module as reconciled. It is reconciled in one
half and privately spelled in the other — the precise shape 29-20 called out for `voice-model.ts`
("fence-aware in one half and fence-blind in the other … is not one authority").

The frontmatter fence-machine scan cannot see it: its recogniser arm matches a regex literal or
`.startsWith("```")`, not an equality, and there is no toggle.

**Failure scenario.** A claim block whose verbatim fence is written as ```` ```text ```` is refused
("carries no fenced block") on correct bytes; an indented delimiter is read as a real one by
`parseClaimBlock` while `fencedLineFlags` in the same module says it is not. Both are avoidable by
composing the one class.

**Fix.** Import `FENCE_DELIMITER_LINE` (or better, consume `fencedLineFlags`, already imported at
`:54-58`) in `parseClaimBlock`. If the equality form is deliberate, say so at the declaration and
record the disagreement as a named residual — but it is not currently disclosed anywhere.

---

### WR-03: invariant I5 in the new parser oracle is unreachable in all 7200 cells

**File:** `scripts/section-locator-oracle.test.ts:401-406`; corpus generator at `:253-333`

**Issue.** I5 ("no EARLIER line satisfies the same two conditions") loops
`for (let i = 0; i < Math.min(at, lines.length); i++) if (isTheHeading(i)) …`. It can only fire on a
document containing **two** occurrences of the cell's heading. The generator inserts the candidate
exactly once (`buildCell` → `wrapCandidate`), and no fixed line in `ORDINARY_HEAD` / `ORDINARY_TAIL`
can equal any candidate spelling (every candidate contains the literal `Candidate`).

Measured by re-running the axis cross-product:

```
cells 7200  docs with >=2 occurrences of the cell heading: 0
```

So I5 is asserted 7200 times and has never been shown able to fail. Neither falsifiability probe
reaches it either: `docs/audit/29-locator-unification.md §4` records the level-two-only probe as
breaking I2/I3 and the fence-blind probe as breaking **I4 only**.

**Failure scenario.** The defect WR-01 was actually written for is *a role file that quotes its own
required heading inside an example while also declaring it* — a document with a fenced occurrence AND
an unfenced one, where the fence-blind scan picks the earlier quoted line and the authority must pick
the later real one. The sweep never generates that document. `headFenceBlind` fails 1440 cells only
because the candidate is fenced and the authority correctly returns `-1`; the *ordering* discrimination
— the half that makes `unfencedHeadingIndex` correct rather than merely fence-aware — is untested.
An implementation returning the last unfenced match instead of the first would sweep clean.

**Fix.** Add a corpus axis (or a second candidate insertion) that places a fenced occurrence and an
unfenced occurrence of the same heading in one document, in both orders. Then re-run the fence-blind
probe and require it to break **I5** as well as I4, and require the level-agnostic case to break I4
alone. Update `docs/audit/29-locator-unification.md §4`'s probe table with the new failure counts.

---

### WR-04: `locateExemptRegion` does not check the locator's `-1`, and the two predicates are no longer one expression

**File:** `scripts/check-banned-claims.ts:530-549`

**Issue.** Before 29-23 the heading index came out of the same array the count was built from
(`headings[0]`), so "count is exactly 1" made "index is valid" true by construction. It is now two
separate traversals with two separately-spelled predicates:

```ts
for (let i = 0; i < lines.length; i++) {                       // the COUNT, over `lines`
  if (!fenced[i] && lines[i].trimEnd() === …heading) headingCount += 1;
}
if (headingCount !== 1) { fail(…); return null; }
const headingAt = unfencedHeadingIndex(text, …heading);        // :544 — the LOCATE, over `text`
const endBefore = sectionEndIndex(text, headingAt + 1, 2);     // :548 — NOT guarded on -1
const body = lines.slice(headingAt + 1, endBefore);            // :549
```

They agree today only because `text === lines.join("\n")` and both spell `trimEnd()` equality against
`fencedLineFlags`. If either drifts — a caller that splits on `/\r?\n/`, a future normalisation change
in one place only — `headingAt` is `-1`, `sectionEndIndex(text, 0, 2)` returns the document's first
level ≤ 2 heading, `body = lines.slice(0, end)`, and the returned `{headingAt: -1, endBefore}` makes
the scan's exemption test `i >= region.headingAt` **true for every line from 0**. That is a fail-open
widening of a safety exemption reached through a `-1` nobody checked.

**Fix.** Guard it explicitly, and make the failure loud rather than silent:

```ts
const headingAt = unfencedHeadingIndex(text, BANNED_CLAIM_EXEMPT_REGION.heading);
if (headingAt === -1) {
  fail(`the exempt heading was COUNTED once and LOCATED zero times — the count predicate and the ` +
       `shared locator disagree about which lines are the region's heading; refusing rather than ` +
       `exempting from line 0`);
  return null;
}
```

The same shape applies to `check-diff-disposition.ts`'s `readDispositionRows` (already guarded) — this
is the one site of the pattern that is not.

---

### WR-05: WP-11 is published wider than the predicate that enforces it, and the two artifacts already disagree

**Files:** `agent-factory/writing-profile.md:54`; `scripts/check-imperative-lexicon.ts:561, 1270-1271,
1414-1421`; case at `scripts/check-imperative-lexicon.test.ts:1238-1283`

**Issue, two halves.**

1. **Scope.** The profile publishes "**A steps section** carries at least one list item … or move the
   explanatory paragraphs under a heading that is **not a steps heading**", marked `decidable`. The
   gate's anchor is `const STEPS_HEADING = /^## Steps\s*$/` — level two, exactly. A `### Steps` or
   `# Steps` section written entirely as prose violates the published rule and is invisible to the
   gate: it contributes no member to `stepsFiles`, so the set equality that produces the WP-11
   refusal never fires. A rule marked `decidable` that a gate decides for only one of its spellings
   is the same claim/behaviour disagreement WR-04 was raised for, one level up.

2. **The cross-artifact mechanism is narrower than the comment claims it is.** The case comment says
   "the guard's enforcement and the kit's own documentation are held to ONE sentence in TWO artifacts,
   so a future reword of either alone is a red". The assertion pins only the first sentence
   (`STEPS_RULE_SENTENCE`). The remedy half already differs, on the day it landed:

   - gate: `Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not \`## Steps\``
   - profile: `Write the procedure as list items, or move the explanatory paragraphs under a heading that is not a steps heading.`

   A reword of either alone is *not* a red; it has already happened.

**Fix.** Either narrow the published rule to the spelling the gate decides (`## Steps`), or widen
`STEPS_HEADING` and re-measure the corpus. Then pin the whole rule text — both sentences — in both
artifacts, or delete the second sentence from one of them so the pinned string is the entire rule.

---

### WR-06: the new watched-corpus pin covers only the register arm of the D-18 union

**File:** `scripts/check-diff-disposition.ts:1437-1497` (containment) and `:1346-1362`
(`WATCHED_CORPUS_MIN`); `scripts/check-audit-register.ts:241-290` (equality three)

**Issue.** The union is `register rows flagged safety_surface: yes` ∪ `registry rows of kind: safety`
(`generate-safety-surface.ts:73-98`). Round 2 pinned it twice — and both pins land on the **register**
arm:

- equality three pins the register's flagged set two-sided against the derived kit;
- the consumer pins `derivedKit ⊆ corpus.watched` plus `derivedKit.length === WATCHED_CORPUS_MIN`.

Containment is one-directional by design (the union legitimately carries public documents beyond the
kit), so **any number of extra members from the registry arm passes both gates silently**, in both
directions: a `kind: safety` claim removed from the registry drops its file out of the LANG-02
exclusion list with no equality anywhere; a claim added — including one fabricated from a fenced
example, CR-02 — adds one.

The gate's own PASS line prints
`the union's remaining ${corpus.watched.length - WATCHED_CORPUS_MIN} markdown entr(ies) are public
documents`, which is a *description* of the residue, not a check on it.

**Fix.** Pin the registry arm the way the register arm is pinned: derive the `kind: safety` claim
files and compare them two-sided against a declared set (or against the public-document scan
`check-banned-claims.ts` already derives), and publish the count. "The remaining N are public
documents" should be an assertion with a source, not a sentence in a transcript.

---

## Info

### IN-01: dead condition in the oracle's I2 guard

**File:** `scripts/section-locator-oracle.test.ts:357`

`if (end >= 0 && end < lines.length)`. `sectionEndIndex` returns `i` (where `i >= Math.max(from,0) >= 0`)
or `lines.length` (`>= 1`); it cannot return a negative. The `end >= 0` conjunct is unreachable-false and
is dead. Harmless, but in a file whose subject is invariants that cannot fail, a condition that cannot
fail is noise. Drop it, or move it into I1 where a negative answer *would* be a real violation for a
future broken locator passed to `endViolations`.

### IN-02: the authority takes `text` while every consumer already holds `lines` and `flags`

**File:** `scripts/frontmatter.ts:512-542`; callers at `check-banned-claims.ts:530-548`,
`voice-model.ts:184-200`, `check-imperative-lexicon.ts:713-717, 885-891`, `audit-model.ts:411-416`

Each call re-runs `text.split("\n")` and `fencedLineFlags(text)`. `readCavemanFence` splits the same
document three times and runs the fence machine three times. That is a performance note (out of v1
scope) but it has a correctness edge worth recording: consumers that already hold a `lines` array
must keep it byte-consistent with whatever string they hand the authority.
`check-banned-claims.locateExemptRegion` does exactly this — it counts over the caller's `lines` and
locates over `lines.join("\n")` — which is what makes WR-04 reachable at all. A
`(lines, flags)`-shaped overload, or passing the already-computed `flags` in, would remove the class.

### IN-03: the duplicate-assertion tripwire is blind to ~9% of the assertions it counts

**File:** `scripts/check-foundation-guards.test.ts` (LANG-07 harness block, `isAssertionLine` /
`duplicateAssertionPairsIn`)

Measured on the live tree: 4806 `expect(` occurrences across 47 test modules; 4751 lines classified;
**453** of the classified lines are multi-line openers (`expect(` with the subject and matcher on
following lines). For those, a duplicated assertion's opener lines are never adjacent, so the pair is
invisible. The floor's disclosed miss #4 names the shape; the published figure ("4693 classified
assertion lines") reads as coverage it does not have. Consider reporting the multi-line share beside
the total, or normalising a multi-line `expect(` call to one logical line before comparison.

---

## Confirmed, not re-discovered

Per the review brief, these recorded findings were checked and hold as recorded; they are **not**
counted above:

| id | status at HEAD |
|---|---|
| V-29-26-01 (setext headings invisible to the ATX-only authority) | confirmed; `sectionEndIndex` recognises ATX only |
| V-29-26-02 (`readdirSync` non-recursive; scans read 41/49 and 47/53) | confirmed; `nonTestScripts()` and `testModules()` both non-recursive |
| V-29-26-03 (`FENCE_DELIMITER_LINE` is a prefix test) | confirmed; `/^```/` at `frontmatter.ts:390` |
| V-29-26-04 (indented fence delimiters invisible; 6 live `README.md` lines) | confirmed |
| Residual 4 (indented code blocks donate step bullets) | confirmed and pinned by a live case |
| T-29-23-05 (banned-claim exemption level widening) | confirmed; fail-closed as recorded |

CR-02 and WR-02 are **adjacent** to V-29-26-03/-04 — all four live in the fence grammar rather than
the section locator — and support §8's recorded recommendation that they are plausibly one follow-up
plan. CR-01 is adjacent to variant **C1** but is a different module with no equivalent pin.

---

_Reviewed: 2026-08-15T19:58:02Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
