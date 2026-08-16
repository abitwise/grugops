---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-16T04:55:00Z
depth: standard
round: 4
diff_base: 3c40d0e
files_reviewed: 21
files_reviewed_list:
  - agent-factory/writing-profile.md
  - docs/audit/29-locator-unification.md
  - scripts/audit-model.ts
  - scripts/audit-model.test.ts
  - scripts/check-audit-register.ts
  - scripts/check-audit-register.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-claim-anchors.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-diff-disposition.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/generate-safety-surface.test.ts
  - scripts/section-locator-oracle.test.ts
  - scripts/voice-model.ts
  - scripts/voice-model.test.ts
findings:
  critical: 1
  warning: 8
  info: 4
  total: 13
status: issues_found
---

# Phase 29 (gap-closure round 3): Code Review Report

**Reviewed:** 2026-08-16T04:55:00Z
**Depth:** standard
**Diff range:** `3c40d0e..HEAD` (plans 29-27 … 29-32)
**Status:** issues_found

## Summary

**Round 3's eight findings are genuinely closed, and I verified each one against the committed
build rather than against the summaries.** CR-01's document now returns `{ok:false,
reason:"unterminated"}`; a `kind: safety` claim planted inside a fenced example is excluded from the
registry parse (42 claims, `headingShapedFenced: 1`); the unclosed-fence swallow of the banned-claim
exemption is caught at the point of effect while the extent pin stays silent (which is exactly the
argument 29-32 makes for why two numbers are needed); a rehomed safety claim reds equality four by
name; the last-match locator now breaks I5 alone; the WP-11 two-artifact pin reds on all four drift
routes. Build is fresh (48 committed `.js`), the whole non-e2e suite is green (52 files, 1987
passed), and all seven gates exit 0.

**One thing shipped that is worse than what it replaced, and I reproduced it end to end.**

Plan 29-27 added `SEC_VOICE_FILE_COUNT = 2` beside `SEC_VOICE_FILES` and wrote, at the declaration,
that the remedy for a hand-maintained set is "the one already used for the role half: DECLARE the
number, then compare the DERIVED set against it." There is no derived set for this half — it is the
one part of the voice corpus with no lister — so what actually ships is a **cardinality plus a
prefix/suffix shape filter**, and a *substitution* moves neither. Replacing
`agent-factory/workflows/15-security-audit.md` with any other existing `agent-factory/**.md` path
leaves `SEC_VOICE_FILE_COUNT` at 2, `visited` at 19, `expected` at 19, and the source-level pin
(`secVoicePinMismatch`, which compares two lengths) silent. I planted a caveman marker into
`15-security-audit.md` on a mirror: the shipped guard reds; the one-token-substituted guard prints
`PASS voice: 0 findings over 19/19 elements` and the whole gate exits 0. That is a
count-preserving membership change in a safety scan set — the phase's own third named failure
class — introduced by the plan that claimed to close it for this set.

Eight warnings follow. The three sharpest are structural rather than cosmetic:

* **the corrected reach counter measures 5× wider than the invariant it was written to make
  reachable.** `REACH.I5` requires two *raw* occurrences of the heading; I5 can only fire on two
  *unfenced* ones with the answer above zero. Measured over the shipped 21600-cell corpus:
  reach floor **1800**, cells that could actually violate I5 **360**. WR-03 was "an invariant
  asserted 7200 times without once being evaluated against a document that could break it"; the
  number published as the closure condition overstates the exercise by 1440 cells.
* **the `-1` contract classifier accepts an inert comparison.** `if (at === -1) { }` followed by
  `at + 1` is classified GUARDED (reproduced against the shipped classifier on a planted module).
  The block's disclosed blind-spot list names five shapes and not this one, while the case is titled
  "the UNGUARDED set over the live tree is EMPTY."
* **`readRegistry`'s new "three numbers must agree" refusal cannot fail.** Both expressions consume
  the same `CLAIM_HEADING_RE` and the same `fencedLineFlags(text)`, so
  `|unfenced ∧ re| = |re| − |fenced ∧ re|` holds by set algebra. Its own comment claims it is *not*
  "one expression and a subtraction of its own output, which is 29-REVIEW § WR-03's shape one layer
  down" — it is exactly that shape.

Also of note: `V-29-29-01` (the duplicated `sectionBody` helper) is escalated as *fence-blind*; it is
also **level-blind** — its terminator is `(?=\n## |…)`, so a level-one heading does not close the
section. That is the same level half-fix that cost this phase plans 29-14 and 29-20, surviving in the
two generators that produce the Claude Code adapters.

---

## Critical Issues

### CR-01: `SEC_VOICE_FILES` is pinned by CARDINALITY where MEMBERSHIP is meant — a security surface can be substituted out of `guard_voice` with the gate green

**Files:** `scripts/check-foundation-guards.ts:1985-2008` (the set, the count, the denominator);
pin at `scripts/check-foundation-guards.test.ts:6144-6222`
**Severity:** BLOCKER — fail-open in a safety guard's scan set; not disclosed; reproduced end to end

**Issue.**
`SEC_VOICE_FILES` is the non-derived half of `VOICE_FILES`. Plan 29-27 added:

```ts
const SEC_VOICE_FILE_COUNT = 2;                              // :2002
const VOICE_FILES = [...ROLE_FILES, ...SEC_VOICE_FILES];
const VOICE_FILE_COUNT = ROLE_COUNT + SEC_VOICE_FILE_COUNT;  // :2008
```

with the declaration stating the remedy is "the one already used for the role half: DECLARE the
number, then compare the DERIVED set against it." The role half really is derived (`listRoles`).
**This half is not derivable and no derivation is compared against it.** Every mechanism that exists
is blind to a substitution:

| mechanism | what it decides | sees a substitution? |
|---|---|---|
| `reportMeasured` `visited` vs `expected` | 19 vs 19 | no — both counts unchanged |
| `secVoicePinMismatch` (`:6171`) | `members.length === declared` | no — lengths unchanged |
| the shape assertion (`:6185`) | every member `startsWith("agent-factory/") && endsWith(".md")` | no, for any such path |
| `fileExists(f)` branch | the substituted path exists | no — it does |
| `EXPECTS_CAVEMAN_FENCE` | derived from `ROLE_FILES` only | no — sec surfaces are not members |

**Reproduction** (against the committed `.js`, no repo file modified):

```
$ cp scripts/*.js /tmp/sub2/
$ sed -i '' 's|"agent-factory/workflows/15-security-audit.md"|"agent-factory/checklists/definition-of-ready.md"|' \
      /tmp/sub2/check-foundation-guards.js          # ONE token, count unchanged

# a caveman marker planted into the security-audit workflow on a mirror
$ CHECK_ROOT=/tmp/mir node scripts/check-foundation-guards.js       | grep voice
  FAIL  voice: 1 finding(s) over 19 elements
$ CHECK_ROOT=/tmp/mir node /tmp/sub2/check-foundation-guards.js     | grep voice
  PASS  voice: 0 findings over 19/19 elements

$ CHECK_ROOT=<repo> node /tmp/sub2/check-foundation-guards.js ; echo $?
ALL CHECKS PASSED
0
```

**Failure scenario.** The realistic route is not sabotage, it is maintenance: `15-security-audit.md`
is split into two workflows, or a red is "cleared" by repointing the entry, and the security-audit
workflow leaves the caveman-marker scan while every published number holds still. `guard_voice` is
the guard whose whole job is that a safety surface is not reworded into caveman voice; the security
audit workflow and the security-NFR checklist are the two surfaces it covers that no role derivation
reaches.

This is the shape 29-30 itself found one module over ("a count-preserving REHOME keeps every
cardinality identical while a file leaves the list") and closed with a ROSTER. The same remedy was
not applied here.

**Fix.** Pin the MEMBERS, not the count — the roster shape `SAFETY_CLAIM_HOMES` already uses:

```ts
// scripts/check-foundation-guards.test.ts — replace the length comparison
const SEC_VOICE_MEMBERS = [
  "agent-factory/checklists/security-nfr-checklist.md",
  "agent-factory/workflows/15-security-audit.md",
] as const;                       // sorted, two-sided
expect(parseSecVoiceMembers(GUARD_TS_SRC).slice().sort())
  .toEqual([...SEC_VOICE_MEMBERS].sort());
```

and add the substitution direction to the falsifiability probe beside the existing add/remove arms
(a member REPLACED, not only added or removed). Then correct the declaration comment at
`check-foundation-guards.ts:1990-2001`: there is no derived set for this half, and saying there is
is the claim-wider-than-its-assertion class inside the pin built to prevent it.

---

## Warnings

### WR-01: the `-1` contract classifier accepts a comparison that does nothing

**Files:** `scripts/frontmatter.test.ts:15228-15294` (the classifier), `:15388-15403` (the claim);
contract prose at `scripts/frontmatter.ts:512-546`

**Issue.** `contractSitesIn` marks a site GUARDED as soon as `guardRe(bound)` matches any line in the
window before the identifier's first use. It never checks that the comparison *does* anything.

Reproduced against the shipped classifier on a planted module:

```ts
const at = unfencedHeadingIndex(text, heading);
if (at === -1) {
  // noted, but not acted on
}
const end = sectionEndIndex(text, at + 1, 2);   // <- the defect, unchanged
```
```
site line 3 bound at guarded true
```

The authority's own contract (`frontmatter.ts:517-521`) says the value "MUST [be checked] BEFORE THE
RETURNED VALUE IS USED as an index, as a slice bound, or as an argument to `sectionEndIndex`" and
names defaulting-to-zero as the forbidden repair. A comparison whose consequent falls through *is*
defaulting to zero, spelled differently. The block's disclosed blind-spot list (items 1–5,
`:15166-15181`) names a helper-expressed guard, an unbound call, a `.js` file, the non-recursive
read and the window — not this.

**Fix.** Require the guarded branch to leave the scope: after a `guardRe` hit, look on that line or
in its consequent for `return`, `throw`, `continue`, or a `fail(` call, and classify a comparison
with no exit as UNGUARDED. Then add a third plant (`guarded-but-inert-plant.ts`) beside the two
existing ones so the new arm is proven able to fire.

### WR-02: `readRegistry`'s "three numbers must agree" refusal is a tautology

**File:** `scripts/audit-model.ts:1046-1078`

**Issue.** The block declares two tallies and asserts

```ts
if (headingIdx.length !== headingShapedLines - headingShapedFenced) { refuse(...); }   // :1066
```

`headingIdx = unfencedMatchIndices(text, CLAIM_HEADING_RE)`, which is
`{ i : !fencedLineFlags(text)[i] && CLAIM_HEADING_RE.test(lines[i]) }`. `headingShapedLines` is
`|{ re }|` and `headingShapedFenced` is `|{ re ∧ flags }|` over the *same* `text`, the *same*
`fencedLineFlags`, and the *same* non-global `RegExp` object. The identity
`|re ∧ ¬flags| = |re| − |re ∧ flags|` holds unconditionally. **No input can make this refusal fire.**

The comment at `:1052-1057` asserts the opposite: "TWO SEPARATE EXPRESSIONS over the same text, never
by one expression and a subtraction of its own output. A harness that counts with the loop it is
auditing is this repository's newest recorded failure (29-REVIEW § WR-03), and this is the same shape
one layer down." It is the same shape, on the wrong side of the sentence.

Contrast the version this round got right: `frontmatter.test.ts:15373-15385` counts *occurrences*
with a `g`-flagged `match` against a classifier that counts *lines* — two answers of different kinds,
which can genuinely disagree.

**Fix.** Either delete the assertion and say the denominator is a projection with no independent
witness, or give it one that differs in kind — e.g. count claim ids parsed out of `claims` and
compare against a `grep`-style occurrence count of `/^###\s+C-28-\d{3}\s*$/` over the raw bytes, so a
recogniser that drifted (`\S+` admitting a non-canonical id) is visible.

### WR-03: I5's reach predicate is 5× wider than the invariant, so `REACH_FLOORS.I5` does not measure what 29-29 exists to have measured

**File:** `scripts/section-locator-oracle.test.ts:605` (the predicate), `:627-634` (the floor),
`:642` (`TWO_UNFENCED_CELLS`)

**Issue.**
```ts
I5: (c) => occurrencesOf(c) >= 2 && unfencedHeadingIndex(c.text, c.heading) > 0,
```
`occurrencesOf` (`:582`) counts every line whose `trimEnd()` equals the heading — **fenced or not**.
I5's loop body (`:498-503`) only reports when an earlier line is *unfenced* AND equals the heading.
So the whole `fenced-before` arm of axis 8 counts toward the reach floor while being structurally
incapable of violating I5.

Measured over the shipped corpus by re-running the axis cross-product:

```
cells 21600   I5 reach (shipped predicate) 1800   I5 breakable (>= 2 UNFENCED occurrences) 360
```

`REACH_FLOORS.I5 = 1800` is therefore 1440 cells wider than the property, and the case's own message
— "invariant I5 is … EXERCISED by 1800 cell(s) — a zero here means it has never been evaluated
against a document that could break it" — is untrue of 1440 of them. The same over-count applies in
kind to `TWO_UNFENCED_CELLS = 720`, which does not carry I5's `at > 0` half.

The *closure* still holds: `headLastUnfenced` really does break I5 and nothing else, and that probe
is the load-bearing evidence. What is wrong is the number published as the plan's closure condition
— the exact defect (a count standing in for the predicate it claims to measure) that WR-03 was
raised about.

**Fix.** State I5's precondition from I5's own predicate:

```ts
I5: (c) => {
  const flags = fencedLineFlags(c.text);
  const lines = c.text.split("\n");
  const at = unfencedHeadingIndex(c.text, c.heading);
  return at > 0 && lines.some((l, i) => i < at || (!flags[i] && l.trimEnd() === c.heading))
      && lines.filter((l, i) => !flags[i] && l.trimEnd() === c.heading).length >= 2;
},
```
then re-derive `REACH_FLOORS.I5` (expect 360) and re-derive `TWO_UNFENCED_CELLS` against the same
rule. Keep `occurrencesOf` for the corpus-shape case, where raw occurrences are what is being
promised.

### WR-04: guard_voice's element floor carries a dead condition, and its paired test assertion cannot fail

**Files:** `scripts/check-foundation-guards.ts:2174-2183`; `scripts/voice-model.test.ts:486-493`

**Issue, two halves of one mistake — `"".split("\n")` is `[""]`, never `[]`.**

1. **The guard.** `if (bodyLines.length === 0 || body.trim() === "")`. `bodyLines = body.split("\n")`
   has length ≥ 1 for every string, so the first disjunct is unreachable-false. Only the second ever
   fires, and the finding then reports `collapsed to 1 line(s) with no content`. The module header
   (`:2100-2101`) states the floor as "a scanned line count of ZERO on any voice file is a finding" —
   which is not the condition shipped, and a scanned line count of zero cannot occur.

2. **The test.** `expect(v.outside.split("\n").length, "…must leave a NON-ZERO clear-voice remainder
   — … zero means the fence swallowed the document").toBeGreaterThan(0)` is true for every possible
   value. Its comment explicitly chooses the line count over a length: "A LINE COUNT rather than a
   length, because that is the number guard_voice now publishes per file, so the two cannot drift
   apart." The half chosen for the drift argument is the vacuous half; only the following
   `outside.trim().length > 0` does any work.

**Fix.** In the guard, drop the dead disjunct and word the floor as what it is (`body.trim() === ""`
→ "the clear-voice remainder carries no content"), and correct `:2100-2101`. In the test, assert the
non-blank line count — `v.outside.split("\n").filter(l => l.trim() !== "").length` — which is both
non-vacuous and closer to the number the guard publishes.

### WR-05: guard_voice publishes a per-file scanned line count and pins nothing about it

**File:** `scripts/check-foundation-guards.ts:2165-2183`

**Issue.** Round-3 CR-01's second remedy was: "publish and two-side-pin what `guard_voice` actually
scanned — `outside` line count per file — so a remainder that collapses is a red, not a silent
pass." What shipped publishes the number and pins only its **zero-content** case. The denominator
that exists (`visited`/`expected`) is at the FILE level, not the LINE level, so a remainder driven
from 45 lines to one non-blank line prints `scanned 1 clear-voice line(s)` and passes.

This is the project's own recorded lesson — "a vacuity floor catches an EMPTY denominator but never
a SILENTLY SHORT one" — applied to the guard that lesson was written for. Reachability is now bounded
by the delimiter-neutralised bound (the swallow cannot cross a level ≤ 2 heading), which is why this
is a warning and not a blocker; but the bound is the only thing holding it, and nothing measures the
bound's effect per file.

**Fix.** Add a per-file floor derived from the file's own size rather than a magic constant, e.g.
refuse when `bodyLines.length < totalLines - cavemanSectionLines`, or publish and pin the *ratio*
`outside lines / document lines` with a two-sided corpus-measured floor the way `roleCeiling()`
handles its table. At minimum, record the residual by name at the declaration so a later reader meets
it as a decision rather than inferring it from a printed number.

### WR-06: `WP-04`'s published row was narrowed to `## Steps` but is not held by the two-artifact pin

**Files:** `agent-factory/writing-profile.md:47` and `:91-102`;
`scripts/check-imperative-lexicon.test.ts:1247-1300`

**Issue.** Plan 29-31 narrowed **two** rows and titled the new profile section "The heading spelling
`WP-11` and `WP-04` decide, and the floor beneath it", asserting both "name the literal heading
`## Steps` … because that is the spelling the gate decides." The mechanism built beside it
(`wp11Pin`, four members, four mutations) holds `WP-11`'s two sentences only. `WP-04`'s row carries
no constant in the gate, no membership in `wp11Pin`, and no assertion anywhere
(`grep -n "WP-04" scripts/*.test.ts` returns two comment lines and one unrelated case name).

So `WP-04` can drift back to "a bullet under a steps heading is procedural" — the level-agnostic
wording 29-31 removed as *fail-open* — with no red, in the same document and the same commit shape
that WR-05 was raised for. A published claim about two rules held by an assertion about one is the
class this plan exists to remove.

**Fix.** Add `WP-04`'s decidable half as a fifth and sixth pin member (`gate/wp04`,
`profile/wp04`) keyed on the sentence "A bullet under a `## Steps` heading is procedural.", spell it
as a constant in `check-imperative-lexicon.ts` beside `STEPS_SECTION_RULE`, and emit it in the
sentence-form refusal that already cites WP-04 at `:1236`. Extend the four-mutation probe to six.

### WR-07: six exact-equality census pins over the whole test corpus red on every unrelated test edit

**File:** `scripts/check-foundation-guards.test.ts:7700-7706`, asserted at `:7854-7873`

**Issue.**
```ts
const TRIPWIRE_MODULES = 47;
const TRIPWIRE_EXPECT_OCCURRENCES = 5353;
const TRIPWIRE_CLASSIFIED_LINES = 5281;
const TRIPWIRE_MULTILINE_STATEMENTS = 1069;
const TRIPWIRE_MULTILINE_STATEMENTS_QUOTE_AWARE = 1063;
const TRIPWIRE_COUNTER_DISAGREEMENTS = 14;
const TRIPWIRE_MULTILINE_SUBJECTS = 577;
```
Every one is `toBe`, over *all 47 test modules*. Adding a single `expect(` anywhere in the repository
moves three of them. The property being defended — "no test module carries two adjacent
byte-identical assertions" — does not depend on any of these values; they are denominators.

The consequence is behavioural rather than logical: the only way to clear the resulting red is to
bump the number, which is precisely the reflex this same round writes refusals against ("Do NOT widen
the pin until it stops firing", `check-banned-claims.ts:1027`; "LOWERING a count or NARROWING the arm
are the two ways to clear this finding by deleting what it measures",
`check-audit-register.ts:411`). A pin that fires on every unrelated commit trains the maintainer to
clear it without reading it, and no cost paragraph at the declaration says so.

**Fix.** Keep `TRIPWIRE_MODULES` and `census.barren` as equalities (they are the vacuity floor).
Convert the four volume counters to *relationships* that are invariant under adding assertions — the
file already asserts three of them at `:7876-7891` (`occurrences ≥ classified`,
`multiLineStatements ≥ multiLineSubjects`, `|naive − quoteAware| ≤ disagreements`) — plus a
lower-bound floor (`classified > 1000`). If an exact snapshot is wanted, put it behind the round-3
premise case, which already reproduces a fixed commit and cannot drift.

### WR-08: V-29-29-01's escalation understates the finding — the duplicated `sectionBody` is level-blind as well as fence-blind, and it feeds the generated adapters

**File:** `docs/audit/29-locator-unification.md:592-622` (§9.3);
subject at `scripts/generate-catalog.ts:86-90` and `scripts/generate-role-adapters.ts:126-130`

**Issue.** §9.3 escalates the helper as "a **third grammar** … and it is **fence-blind**". Both
statements are correct and neither is the whole finding:

```ts
const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");
```

The terminator is `\n## ` — **level two only**. A level-ONE heading after the section does not close
it, so the capture runs on into the next top-level section. That is byte-for-byte the defect
`voice-model.ts`'s `SECTION_END = /^## /` was, which cost this phase plan 29-14 (the half-fix) and
plan 29-20 (the correction), and whose argument is written out at `frontmatter.ts:450-470` as the
reason the level axis is pinned two-sided. The escalation does not name it, so a reader who acts on
§9.3 will fix fence-awareness and leave the level axis exactly as it was.

The consequence is also unstated. `sectionBody` is not a reporting helper: its output becomes
`description` / `Use when` / `One job` in the **generated Claude Code role adapters**
(`generate-role-adapters.ts:274, 280`) and the catalogue rows (`generate-catalog.ts:133, 177`). A
truncated or over-long capture silently changes an adapter's routing text, and `npm run
freshness:adapters` would then require the truncated output to be committed.

Live reachability re-measured: **0** fenced `## ` lines and 0 post-section level-one headings across
the 17 roles + 19 workflows, so this is latent on today's tree — the same posture as
V-29-26-01/-03/-04.

**Fix.** Amend §9.3 to name both axes and the consumer, and record the level axis in the escalation
so the follow-up plan's acceptance covers it. The repair itself is one call each to
`unfencedHeadingIndex` + `sectionEndIndex(text, at + 1, 2)`, which deletes the third grammar rather
than widening the owner classifier's definition to swallow it.

---

## Info

### IN-01: the scan-scope shortfall case asserts an identity, not a shortfall

**File:** `scripts/frontmatter.test.ts:15496-15517`

`expect(unread.length).toBe(tracked.length - read.length)` follows from
`read.every(p => tracked.includes(p))` asserted three lines above, for any duplicate-free `read`.
Nothing about the shortfall is pinned — not its size, not its membership — so a consumer of the
locator appearing in `hooks/`, `install/` or `scripts/runnable-ref/` changes no assertion here. The
case name ("THE DISCLOSED SCAN-SCOPE SHORTFALL … IS RE-MEASURED") promises more than the assertion
delivers. Pin `unread` against a declared sorted list, or pin `unread.length` against a declared
number, so a new unread module is a red rather than a longer failure message.

### IN-02: the new swallow refusal fires on any one-word `### ` line inside a claim's verbatim

**File:** `scripts/audit-model.ts:1288-1303`

`CLAIM_HEADING_RE = /^###\s+(\S+)\s*$/` matches `### Steps`, `### Attribution`, `### Notes` — every
single-token level-three heading, not only a canonical `C-28-NNN` id. A claim whose verbatim quotes
such a heading (a plausible thing for an `architecture` claim about the writing profile to do) is now
refused as "SWALLOWED n claim heading(s)". Fail-closed and 0 live, but the module discloses only the
parity blind spot, not this false-red shape. Either test the *canonical* id form here (the same
`C-28-\d{3}` shape `parseClaimBlock` validates ten lines later) or record the shape as a named
residual beside the refusal.

### IN-03: the pass line computes the registry residue a third way

**File:** `scripts/check-diff-disposition.ts:1703-1713`

`registryResidueSize = residue.filter(f => f !== PROTOCOL_FILE).length` is a third expression for a
quantity `registryResidue` (`:1595`) already holds. They agree only because the `unvouched` and
`PROTOCOL_FILE`-present arms returned early. If `PROTOCOL_FILE` ever also hosted a `kind: safety`
claim, the published identity `derivedKit + registryResidueSize + 1 = watched.length` would be off by
one while every assertion passed — a printed sum that is a description again, which is the sentence
this block replaced. Reuse `registryResidue.length`.

### IN-04: `headingShapedFenced` is published but never asserted; the fence-hidden-claim signal lives one gate away

**Files:** `scripts/audit-model.ts:1052-1064`; `scripts/check-claim-anchors.ts:412-421`

Hiding one real claim heading inside a fence is a silently shorter claim list:

```
$ node -e '…readRegistry(mirror)…'
claims: 41 shaped: 42 fenced: 1
```

`check-claim-anchors` prints both numbers and asserts neither; `readRegistry`'s own equality is
vacuous (WR-02). The only thing that reds is `CLAIM_KIND_CARDINALITY`'s sum in
`check-audit-register` — a different gate, a hand-declared number, and a message about kind
distribution rather than about a fenced heading. Consider asserting `headingShapedFenced === 0` in
`check-claim-anchors` with a named refusal (a claim heading inside a fenced example is documentation
the registry has no use for), so the signal sits where the number is published.

---

## Confirmed closed — round 3's findings, re-verified against the build

| round-3 id | status at HEAD | evidence |
|---|---|---|
| CR-01 (caveman fence swallows later sections) | **closed** | CR-01's exact document → `{ok:false,reason:"unterminated"}`; `# `/`## ` interior both refuse; `### ` interior still returns whole; `outside` non-empty on all 17 roles |
| CR-02 (`readRegistry` is a sixth, fence-blind locator) | **closed** | fenced phantom `C-28-999 kind: safety` excluded — `claims 42, shaped 43, fenced 1`; parity refusal + point-of-effect swallow refusal added |
| WR-01 (reader header asserts deleted behaviour) | **closed** | `voice-model.ts:123-167` rewritten with the shipped direction, the circularity, and the measured 0-live cost |
| WR-02 (two fence recognisers in `audit-model.ts`) | **closed** | `parseClaimBlock` now tests `FENCE_DELIMITER_LINE`; the both-directions behaviour change is disclosed with its 0-claim live effect |
| WR-03 (I5 unreachable) | **closed** (see WR-03 above for the reach *number*) | eighth axis; `headLastUnfenced` breaks I5 alone; the round-3 sub-corpus reproduces reach 0 over 7200 cells |
| WR-04 (`locateExemptRegion` unchecked `-1`) | **closed** | one array under both traversals + a named refusal + a tree-wide class scan (see WR-01 above for the classifier's strength) |
| WR-05 (WP-11 published wider than enforced) | **closed for WP-11**, open for WP-04 (WR-06) | rows narrowed; four-member pin with a four-mutation probe; undecided-level tally refuses above zero |
| WR-06 (only the register arm of the D-18 union pinned) | **closed** | equality four (roster + cardinality + vouching, two-sided) and `RESIDUE_FROM_REGISTRY_COUNT`; rehome of `C-28-001` reds by name |
| IN-01 (dead `end >= 0` conjunct) | **closed** | moved into I1 and exercised by `endAlwaysNegative` |
| IN-03 (tripwire blind to ~9% of assertions) | **closed** (see WR-07 for the pin shape) | census publishes four numbers plus its own measurement error; the multi-line miss is an asserted intended verdict |

## Carried residuals, re-confirmed and NOT counted above

`V-29-26-01` (setext invisible), `V-29-26-02` (non-recursive reads — narrowed by 29-29 for the owner
scan, still live for the `-1` contract scan and `nonTestScripts()`), `V-29-26-03` (prefix fence
test), `V-29-26-04` (indented delimiters, 4 live lines in `README.md`), `V-29-32-01` (closed-fence
count-preserving swallow of the exemption region), `V-29-29-01` (the duplicated `sectionBody` — see
WR-08 for the axis its escalation omits). All were re-checked and hold as recorded.

---

_Reviewed: 2026-08-16T04:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
