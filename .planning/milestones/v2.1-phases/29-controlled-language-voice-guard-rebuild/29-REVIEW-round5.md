---
phase: 29-controlled-language-voice-guard-rebuild
reviewed: 2026-08-17T12:44:46Z
depth: standard
round: 5
diff_base: 803b9c12cdd03ae3dedfc790ba3ac72847f459ee
head: ba45880
files_reviewed: 11
files_reviewed_list:
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.test.ts
  - scripts/generate-catalog.ts
  - scripts/generate-catalog.js
  - scripts/generate-catalog.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/frontmatter.test.ts
  - docs/audit/29-round5-residuals.md
  - docs/audit/29-locator-unification.md
  - docs/audit/29-round4-residuals.md
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 29 (gap-closure round 5): Code Review Report

**Reviewed:** 2026-08-17T12:44:46Z
**Depth:** standard
**Diff range:** `803b9c1..HEAD` (`ba45880`; plans 29-40, 29-41, 29-42)
**Status:** issues_found

## Summary

**Every number this round publishes, I re-derived independently, and every one of them is honest.**
82 documents / 5898 lines / 1983 mid-sentence lines (33.6%); `comprehension` on exactly two lines,
both inside the exemption region at `writing-profile.md:256` and `:288`; `understand` on exactly one,
`incident-responder.md:29`; exemption extent 62; suppressed 12; the seven per-marker line counts
(`improve` 17, `better` 0, `easier` 0, `boost` 0, `help` 3, `benefit` 3, `enhance` 1) reproduce
exactly. Build is fresh (`npm run freshness`: 48 committed `.js` match a fresh `tsc` rebuild),
`npx tsc --noEmit` exits 0, the non-e2e suite is green (52 files, 2054 passed / 2 skipped / 0
failed), `npm run freshness:catalog` exits 0 and regenerating the catalog leaves
`docs/catalog/README.md` byte-identical. No file in this diff is binary-classified (`file -b` reports
UTF-8 text for all eleven), so no grep in this review was silently blind.

29-40 is clean work. I independently ran both grammars — the deleted flat `key: value` copy and the
authority — over all 17 roles and 19 workflows for `tier`, `order` and `cadence`: **0 differences, 0
refusals**. The byte-identity claim is true, the three planted cases genuinely discriminate (the
`HISTORICAL_FLAT_KV_GRAMMAR` control makes each one able to fail), the two `sectionBody` copies are
byte-identical as their comment requires, and the name-scoped owner tripwire's bound is disclosed at
its declaration.

**Two things are wrong, and both are the same failure the round was built to remove: a prohibition
whose published scope is wider than the mechanism behind it. I reproduced both end to end on a
`git archive HEAD` mirror whose gate is byte-identical to the repository's
(`b405a886…13fe9`).**

1. **`CHANGELOG.md` is silently outside the banned-claim scan set, and it carries two live occurrences
   of the banned `token economy` / `token-economy` literals** — the exact disproven claim whose
   deletion from `18-context-compaction.md` is this gate's founding RED transcript. The gate reports
   `82 document(s) carry zero banned claim literal` and exits 0. `check-banned-claims.ts` consumes
   `publicDocsScan()`, which is the public-document set **after** another gate's own exemption has
   been subtracted — and that exemption's declaration states, in terms, that it "does not exempt
   `CHANGELOG.md` from any other gate." I planted the D-44 draft claim
   (`The grugops kit conforms to ASD-STE100 Simplified Technical English.`) in `CHANGELOG.md`: exit 0,
   `ALL CHECKS PASSED`, the file never named. The same bytes in `README.md`: exit 1, named twice.

2. **The comprehension rule did not eliminate the enumeration — it relocated it from the PHRASE slot
   to the VERB slot, and the new bypass is undisclosed.** `BENEFIT_VERB_MARKERS` is a hand-authored
   list of seven stems, so a benefit verb outside it defeats the rule even though the pinned bare term
   is present. Five claims planted one at a time on the mirror — `increases comprehension for language
   models`, `raises comprehension for LLMs`, `gives models sharper comprehension`, `aids comprehension
   for agents`, `makes models understand prose faster` — **all five exit 0 with the planted file never
   named**, which is byte-for-byte the evidence shape `G-29-2` itself used. None of the thirteen
   adversarial attempts touched this axis; all thirteen attacked the window, the encoding, or the
   exemption boundary. And the source's prose actively denies it: the rejection of option (b) reads
   "it closes the five spellings somebody happened to write down and leaves the next interposed word
   green", which is the same objection with "verb" substituted for "phrasing".

Six warnings follow. The sharpest is arithmetic: **`BANNED_CLAIM_EXEMPT_SUPPRESSED`'s breakdown
paragraph is wrong and does not sum to its own pin.** It says "Six of the twelve are the standard's
name, three are the token-economy claim, and these are the other two halves of a pair each" —
6 + 3 + 2 = 11, for a pin of 12. Measured through the gate's own matcher: standard-name **6**,
token-economy **2**, comprehension **4**. The 12 was derived from the run and is right; the
sub-breakdown was read rather than derived, in the paragraph that opens by saying the entrants were
"derived through the gate's own `countBannedClaimOccurrences` rather than by reading the prose".

Round 4's carry-overs are outside this diff's file scope and were not re-verified; `SEC_VOICE_MEMBERS`
now appears in `check-foundation-guards.ts` (round-4 CR-01's remedy) and `WP-04` now appears 21 times
in `check-imperative-lexicon.test.ts` (round-4 WR-06's remedy), so both look addressed, but I make no
verification claim about work whose subject files are not in this review's scope.

---

## Critical Issues

### CR-01: `CHANGELOG.md` — a public document by the owning module's own classification — is outside the banned-claim scan set, with two live banned-literal occurrences

**Files:** `scripts/check-banned-claims.ts:125-128` (the import), `:643-647`
(`BANNED_CLAIM_EXCLUDED_LOCATIONS`), `:3-4` (the module's scope claim);
subject at `scripts/check-public-docs-vocabulary.ts:100-126` (`PUBLIC_DOCS_EXEMPT`)
**Severity:** BLOCKER — fail-open in a safety guard's scan set; **2 live instances**; undisclosed;
reproduced end to end in both directions
**Status:** pre-existing (the derivation is unchanged in this diff), and **not reported in rounds 1–4**
(`grep -n "install/README\|BANNED_CLAIM_EXCLUDED_LOCATIONS\|publicDocsScan"` over
`29-REVIEW*.md` returns nothing)

**Issue.**

`check-banned-claims.ts` takes its public-document half whole, with an explicit reason:

```ts
// The public-document half of the scan set is DERIVED BY THE MODULE THAT ALREADY OWNS IT. Deriving
// root markdown and examples/ a second time here would be a second membership rule over one
// corpus, which is how two scan sets come to disagree about what a public document is.
import { publicDocsScan } from "./check-public-docs-vocabulary.js";
```

That reasoning is right and the consequence is the defect: `publicDocsScan()` does not answer "what is
a public document". It answers "what is a public document **that the dead-vocabulary check applies
to**". `check-public-docs-vocabulary.ts:306-307` says so:

```
// The pinned cardinality. 10 today: 4 root markdown files (5 minus the CHANGELOG.md exemption) +
// 5 examples + 1 kit README.
```

So the owning module **classifies `CHANGELOG.md` as a root public document** and then subtracts it —
and its exemption block states the bound in terms:

> **THE BOUND:** the exemption forgoes the vocabulary check for this ONE named file and nothing else.
> It does not exempt any other root document, **and it does not exempt `CHANGELOG.md` from any other
> gate.**

It does exempt it from this gate, by construction. And the exemption's *reason* — "the retired
vocabulary inside it describes WHAT THE PROJECT USED TO SHIP" — is specific to the dead-vocabulary
predicate and has no bearing on a conformance claim, a token-economy claim, or a comprehension claim.
`CHANGELOG.md` also appears nowhere in `BANNED_CLAIM_EXCLUDED_LOCATIONS` (`docs/`, `.planning/`,
`scripts/`), whose block header exists precisely so that "absence reads as a decision rather than by
silent omission".

**This is live, not theoretical:**

```
$ grep -a -n -E "token economy|token-economy" CHANGELOG.md
30:- Dialable memory and trajectory compaction for token economy, with a load-bearing-field carve-out
68:  preserved as the token-economy mechanism.
```

Both are members of `BANNED_CLAIM_LITERALS` group `token-economy`, unconditional. This is the same
claim the gate's own D-44 transcript (`check-banned-claims.ts:95-100`) records catching in
`18-context-compaction.md` and calls "the drift this gate exists for" — project measurement on
2026-07-28 disproved it. It survives, unscanned, in the document `CLAUDE.md`'s stack table names as a
public deliverable ("Keep a Changelog 1.1.0 — `CHANGELOG.md` format; Release Manager role output").

**Reproduction** (hermetic `git archive HEAD` mirror; mirror gate byte-identical to the repository's,
sha256 `b405a886257ed38d587fb50f40b2610e643c5298f21027994db871c79da13fe9`; clean-mirror control exit
0; no repository file modified):

```
# A — the D-44 draft claim appended to CHANGELOG.md
$ printf '\nThe grugops kit conforms to ASD-STE100 Simplified Technical English.\n' >> $MIR/CHANGELOG.md
$ CHECK_ROOT=$MIR node scripts/check-banned-claims.js ; echo $?
ALL CHECKS PASSED
0                          # CHANGELOG.md never named anywhere in the output

# B — the SAME bytes appended to README.md (the control)
$ printf '\nThe grugops kit conforms to ASD-STE100 Simplified Technical English.\n' >> $MIR/README.md
$ CHECK_ROOT=$MIR node scripts/check-banned-claims.js ; echo $?
  README.md:68:29 — banned standard-name literal "ASD-STE100" — "The grugops kit conforms to ..."
  README.md:68:40 — banned standard-name literal "Simplified Technical English" — "..."
1
```

B ran with A's plant still in place, so the run naming `README.md` and not `CHANGELOG.md` is the
discrimination.

The consequence for the artifacts this round produced: `check-banned-claims.ts:3-4` states the gate
"Asserts that the shipped kit and the public documents carry ZERO controlled-language conformance
claim, ZERO token-economy win claim and ZERO comprehension-benefit claim — anywhere except one named
exemption region." That sentence is **live-false with two occurrences**, and
`29-round5-residuals.md` §7's "what round 5 can honestly claim" does not name it.

**Fix.** Do not weaken anything; make the two scan sets disagree *visibly* instead of silently.
`check-public-docs-vocabulary.ts` should export the pre-exemption set beside the post-exemption one, so
each consumer names which question it is asking:

```ts
// scripts/check-public-docs-vocabulary.ts
/** Every derived public document, BEFORE any per-gate exemption. */
export function publicDocsCorpus(): string[] { /* root md + examples + kit README, unfiltered */ }
/** The corpus MINUS PUBLIC_DOCS_EXEMPT — the set the VOCABULARY check applies to, and only it. */
export function publicDocsScan(): string[] {
  return publicDocsCorpus().filter((p) => !PUBLIC_DOCS_EXEMPT.includes(p));
}
```

then in `check-banned-claims.ts` consume `publicDocsCorpus()`, move
`BANNED_CLAIM_SCAN_COUNT` 82 → 83 in the same commit with `CHANGELOG.md` named as the entrant, and
delete or rewrite the two `token economy` sentences at `CHANGELOG.md:30` and `:68` (a changelog may
record that the *mechanism* was compaction; it may not restate the disproven claim). Add a case in
`check-banned-claims.test.ts` that plants a banned literal in `CHANGELOG.md` and asserts the gate
names it — the mirror already writes that file, so the fixture cost is one line. Finally, correct
`PUBLIC_DOCS_EXEMPT`'s bound paragraph: as written it asserts a property the import graph falsifies.

---

### CR-02: the comprehension rule moved the enumeration from the phrase to the VERB — a benefit verb outside `BENEFIT_VERB_MARKERS` reproduces `G-29-2` exactly, and the residual is undisclosed

**Files:** `scripts/check-banned-claims.ts:326-334` (`BENEFIT_VERB_MARKERS`), `:228-324` (the
docblock that denies this), `:376-425` (the rule member), `:1093-1108` (`lineHits`);
`docs/audit/29-round5-residuals.md` §2 (the 13-attempt log), §3 (the residual register), §7
**Severity:** BLOCKER — fail-open in a safety guard; reproduced with the same evidence shape the gap
used; not recorded as a residual; contradicted by the source's own prose

**Issue.**

The rule is `bare term AND some member of a seven-stem hand-authored list, on one line`. The closure
argument in the docblock is that the old enumeration failed because "any INTERPOSED WORD defeated
every one of the six at once", and that appending phrasings was refused because "it closes the five
spellings somebody happened to write down and leaves the next interposed word green."

**The identical objection applies to the marker list and is nowhere recorded.** The rule closes the
seven verb stems somebody happened to write down and leaves the next synonym green — with the pinned
bare term present on the line.

Reproduced against the committed `.js` on the same hermetic mirror, one plant at a time onto
`agent-factory/workflows/00-bootstrap-greenfield.md`, mirror reset between attempts:

```
exit=0  named=0   Controlled language increases comprehension for language models.
exit=0  named=0   Controlled language raises comprehension for LLMs.
exit=0  named=0   Controlled language gives models sharper comprehension.
exit=0  named=0   Controlled language aids comprehension for agents.
exit=0  named=0   Controlled language makes models understand prose faster.
```

Row 1 is family member **F6** (`boosts comprehension for language models`) with one word changed.
F6 is a permanent case, asserted to red by name at `file:line:column`; its one-word neighbour is
green and unnamed. That is the definition of holding a spelling rather than a prohibition.

**Three things make this a BLOCKER rather than an accepted bound:**

1. **The prose asserts the opposite.** `:380-383`: "so `improves LLM comprehension`, `improves model
   comprehension`, `improves agent comprehension` and `boosts comprehension for language models` are
   all findings WITHOUT ANY OF THEM BEING ENUMERATED, and an interposed word no longer defeats the
   whole group at once. **That is the difference between a guard that holds a prohibition and a guard
   that holds the spellings somebody thought of.**" The guard still holds spellings; the slot moved.
2. **The 13-attempt log never asked.** A1/A2 attacked the window, A3–A6 the input encoding and
   markdown structure, A7/A8 the exemption boundary, A9–A11 non-prose text, A12/A13 controls. Not one
   attempt varied the VERB — the one degree of freedom the round's own design decision introduced
   alongside the window. §2 states "the axis under attack" is the window; the marker set is the other
   half of the same predicate and went unexamined.
3. **It is not covered by any recorded residual.** `V-29-42-01` is the window. §7's "A brand-new claim
   in words this list does not contain still passes" does not reach it: `comprehension` **is** in the
   list, and the gate is still green. `BANNED_CLAIM_EXCLUDED`'s option-(b) entry claims the refusal
   "is held by an ASSERTION as well as by this paragraph: `check-banned-claims.test.ts` pins the
   enumerated-comprehension count two-sided at 6, so appending a phrasing reds by name" — that
   assertion holds the *phrase* list at 6 and says nothing about the marker list's completeness.

The docblock does say the list is "a MEASUREMENT BASELINE, NOT A DISCOVERY SET, and it is
hand-authored on purpose". That justifies hand-authoring; it does not disclose that an unlisted verb
produces a green run on a real claim carrying a pinned literal, and it does not carry a `V-` id, a
live count, or a direction — the four things every other residual in §3 carries.

**Fix.** Two parts, and the first is mandatory even if the second is deferred.

1. **Record it, with the honesty the other four get.** Open `V-29-42-05`: *direction FAIL-OPEN;
   address `BENEFIT_VERB_MARKERS` and the `requiresOnSameLine` arm in `lineHits`; reproduced with the
   five plants above; live instances 0*. Add it to §3, to §4's roll-up, and to §7's "what round 5 does
   **not** claim". Then correct `:380-383` and the option-(b) rejection paragraph so neither asserts
   that the spelling problem is gone — it is one slot to the left. Making the net movement `+4` instead
   of `+3` is the honest number.
2. **Then close it structurally rather than by a ninth stem.** Adding `increase`, `raise`, `aid` is
   option (b) at the verb level and will need a tenth next round. The shape that decides instead of
   enumerating is a POSITIONAL rule over the pinned term: a bare comprehension term is a finding when
   it appears as the **object of a transitive verb whose subject is the kit / controlled language** —
   i.e. pin the *subject* side (`controlled language`, `this profile`, `the kit`, `the voice`), which
   is a bounded, measurable, kit-authored vocabulary, rather than the open class of benefit verbs.
   Measure its false-red cost over the 82 documents before admitting it, exactly as the seven markers
   were measured, and record the number that admits it.

---

## Warnings

### WR-01: `BANNED_CLAIM_EXEMPT_SUPPRESSED`'s breakdown is wrong and does not sum to its own pin

**File:** `scripts/check-banned-claims.ts:974-979`

**Issue.** The paragraph reads:

> BOTH ARE HONEST DENIALS … Six of the twelve are the standard's name, three are the token-economy
> claim, and these are the other two halves of a pair each.

6 + 3 + 2 = **11**, against a pin of **12**. Measured by walking the region with the gate's own
matcher (`writing-profile.md`, region `[234, 296)`):

| group | occurrences | addresses |
|---|---|---|
| `standard-name` (`ASD-STE100`) | **6** | 239:10, 239:77, 242:72, 246:1, 251:28, 255:20 |
| `token-economy` (`token-economy`) | **2** | 255:80, 278:12 |
| `comprehension` | **4** | 256:13 ×2, 288:47, 288:56 |
| **total** | **12** | |

So token-economy is 2 (and was 2 at the old pin of 10 as well — 6 + 2 + 2 = 10, so the "three" was
never true), and the comprehension half is 4, not 2. The `12` itself is correct and was derived from
the run; the sub-breakdown was read. That distinction is the whole point of the paragraph it sits in,
which opens "The two entrants, **each derived through the gate's own `countBannedClaimOccurrences`
rather than by reading the prose**".

**Fix.** Replace the sentence with the measured table above, and derive it rather than type it — a
`--breakdown` mode on the gate, or a case that prints the per-group tally, so the next re-pin cannot
restate a count nobody took:

```ts
// Twelve, by group, taken from the region walk: standard-name 6 (ASD-STE100 ×6), token-economy 2
// (255:80, 278:12), comprehension 4 (256:13 twice — the enumerated literal AND the rule; 288:47 the
// enumerated literal, 288:56 the rule). 6 + 2 + 4 = 12.
```

### WR-02: four further document classes sit outside the banned-claim scan set with no recorded reason

**File:** `scripts/check-banned-claims.ts:629-647`

**Issue.** `BANNED_CLAIM_EXCLUDED_LOCATIONS` names `docs/`, `.planning/`, `scripts/` and its block
header exists so that an exclusion "reads as a decision rather than … a silent omission". Enumerating
tracked markdown against the derived scan set, these are outside it and unnamed:

| path class | files | what it is |
|---|---|---|
| `install/README.md` | 1 | the hand-authored, user-facing install guide — the document `check-public-docs-vocabulary.ts:6` itself calls "the start-here guide the installer" points at |
| `.claude/agents/*.md`, `.claude/skills/*/SKILL.md` | 24 | the generated adapters and skill twins (derived from role text, so covered transitively — but that transitivity is nowhere stated) |
| `memory-bank/*.md` | 9 | project brief / product / architecture prose |
| `plans/board.md` | 1 | the visible board |

`grep -a -i` over all of these finds no banned literal today, so unlike CR-01 there is **0 live
count** — which is why this is a warning. But `install/README.md` in particular is exactly the kind of
document a conformance claim gets written into, and its absence currently reads as an oversight.

**Fix.** Either add each class to `BANNED_CLAIM_EXCLUDED_LOCATIONS` with its reason (and for `.claude/`
state the transitive-coverage argument explicitly, naming the generator that makes it true), or add
`install/README.md` as a third part of the derivation and move `BANNED_CLAIM_SCAN_COUNT` with it. Do
not leave them unmentioned.

### WR-03: `generate-catalog.ts` now states two contradictory workflow counts four lines apart, and this round added the correct one without fixing the stale one

**File:** `scripts/generate-catalog.ts:13`, `:257`, `:260`, `:347` (stale) vs `:28`, `:302` (added
this round, correct); same drift in the committed `scripts/generate-catalog.js`

**Issue.** Measured: `agent-factory/workflows/` holds **19** files, orders `0..18`, unique. The file
says both:

```
:13   // workflows/ keeps all 16 numbered files (00..15).
:257  // ── Read + parse workflows (all 16 numbered files 00..15) ──
:260  // Match the documented contract: numbered workflow files only (`NN-*.md`, 00..15).
:347  // Workflows: numeric `order` ascending (0..15, unique — no tie-break needed).
```

and, added by plan 29-40 fifteen lines above the first of those:

```
:28   // MEASURED BEFORE THE CHANGE, over the 17 roles and 19 workflows this generator reads …
:302  // … Measured in session: 0 of the 19 workflows carry an empty `order:`.
```

The stale statements predate this round, but 29-40 wrote a correct count into the same header block
and left the contradicting one four lines below it. In a file whose own new comment says "a comment
that outlives its construct is a defect, and so is one that resurrects it for a reader that cannot
tell prose from code", a header asserting two different cardinalities for the corpus it walks is the
same class — set-literal drift wearing a sentence, which is this repository's named second systemic
failure mode.

**Fix.** Correct `:13`, `:257`, `:260`, `:347` to `19 numbered files (00..18)` / `0..18`. Better:
delete the range from the prose entirely — the regex `/^\d{2}-.+\.md$/` is the contract and it is
range-free, so any number written beside it is a second declaration that can only rot. The `unique —
no tie-break needed` claim is currently true (verified: orders `0..18`, all distinct) and can stay.

### WR-04: the new control-byte assertion is a second, weaker authority over a predicate `check-nul-bytes.ts` already decides repo-wide, and §3.5's account of the fix omits the existing gate

**Files:** `scripts/check-banned-claims.test.ts:292-320`; `docs/audit/29-round5-residuals.md` §3.5;
subject at `scripts/check-nul-bytes.ts`

**Issue.** §3.5 records the NUL-byte harness failure and states the remedy: "a permanent case now
refuses any control byte outside `\n` and `\t` in either the gate's source or its harness". It does
not mention that `scripts/check-nul-bytes.js` — landed in Phase 28, over **every** tracked path with
no exemption list — already decides the NUL half of that predicate:

```
$ node scripts/check-nul-bytes.js
  PASS  1588 tracked file(s) scanned as raw bytes, ZERO carrying a NUL byte; the scanned set is every
        path `git ls-files` reports, with no exemption list and nothing filtered …
```

The mechanism to catch the byte existed and covered 1588 files. What failed was that it was not run
before two greps were believed. The remedy shipped instead is a 2-file assertion, which on the NUL
axis is a **weaker duplicate** of an existing authority — the D-24 shape this very round closed one
module over. It is not a pure duplicate (it also rejects `0x01`–`0x1f` and `0x7f`, which
`check-nul-bytes` does not), which is why this is a warning rather than a blocker.

**Fix.** In §3.5, name `scripts/check-nul-bytes.js` and state the real lesson — *the gate existed and
was not run* — because "we added an assertion" is a weaker and less transferable conclusion than "run
the repo-wide gate before believing a grep". Then either widen `check-nul-bytes.ts` to the full
control-byte class (one authority, 1588 files, the strictly better coverage) and delete the NUL half
of the new case, or keep the new case and say at its declaration which axis it adds and which axis is
already owned elsewhere.

### WR-05: the `understand` false-red surface is the largest one this round introduced and is the only new surface with no `V-` id

**Files:** `scripts/check-banned-claims.ts:455-463` (the disclosure), `:471-475` (the member);
`docs/audit/29-round5-residuals.md` §3

**Issue.** §3 opens four residual ids this round. Two of them — `V-29-42-02` (a table row) and
`V-29-42-04` (a marker inside an HTML comment or link target) — are fail-CLOSED surfaces at **0 live**.
The `understand` substring member is a fail-CLOSED surface of strictly larger reach and it gets no id:
it also matches `understands`, `understanding` and `misunderstand`, and 24 lines of the 82-document
corpus already carry a benefit marker (`improve` 17, `help` 3, `benefit` 3, `enhance` 1). "This helps
a new joiner understand the state" is a standard documentation construction, and the source itself
names that exact sentence as the shape that would red.

The source discloses it well at `:455-463`, with its remedy ("REPHRASE the sentence, or admit a
narrower term with its own measurement — NEVER weaken the matcher") and `Live instances: 0`. The
inconsistency is in the register: a reader auditing §3 or §4 for this round's new surfaces will find
two zero-live table/comment shapes and not this one.

**Fix.** Open `V-29-42-05`/`-06` (numbered after CR-02's) for the `understand` false-red class, with
direction FAIL-CLOSED, live count 0, reach 24 marker-carrying lines, and the remedy already written in
source. Cross-reference it from the member declaration so source and register point at each other, as
`V-29-42-03` already does.

### WR-06: "REFUSES a conditional member declared with an EMPTY marker array" — the gate refuses nothing; only the harness does

**File:** `scripts/check-banned-claims.test.ts:2110-2142` (the case);
`scripts/check-banned-claims.ts:1093-1108` (`lineHits`), `:1379-1403` (the PASS line)

**Issue.** The case name is a claim about the **gate**. Nothing in the gate refuses a conditional
member whose marker list is empty. `lineHits`'s arm is:

```ts
if (member.requiresOnSameLine !== undefined &&
    !member.requiresOnSameLine.some((v) => lower.includes(v.toLowerCase()))) {
  continue;
}
```

`[].some(...)` is `false`, so such a member `continue`s on every line, forever, silently — a
prohibition that matches nothing — while the PASS line keeps counting it in
`${BANNED_CLAIM_LITERALS.length} pinned literal(s)`. The only thing preventing it from shipping is
this test's `expect(m.requiresOnSameLine?.length ?? 0).toBeGreaterThan(0)`. A case whose *name*
attributes a refusal to the gate is the shape round 4's IN-01 was raised about (a case name promising
more than the assertion delivers), and here it also misattributes *which artifact* holds the invariant.

Mitigating: the PASS line does render `"comprehension" on 0 marker(s)`, so it is visible — but visible
in a PASS line is not refused, and the gate's own AP-1 rule is that a PASS line must never state a
check it did not perform.

**Fix.** Two lines in the gate, so the invariant lives where its subject does:

```ts
// scripts/check-banned-claims.ts, in runAll() before the scan
for (const m of BANNED_CLAIM_LITERALS) {
  if (m.requiresOnSameLine !== undefined && m.requiresOnSameLine.length === 0) {
    fail(`the conditional literal "${m.literal}" declares an EMPTY marker list — the arm in ` +
         `lineHits skips it on every line, so it is a pinned prohibition that matches nothing while ` +
         `the PASS line still counts it. Give it markers with their measured hit counts, or delete it`);
  }
}
```

and rename the case to "the marker list of every conditional member is non-empty, and the gate refuses
one that is not" once the refusal exists.

---

## Info

### IN-01: `hits: -1` is an unmeasured-sentinel smuggled into a field typed as a count

**File:** `scripts/check-banned-claims.ts:567-575`

`{ candidate: "STE, as a bare literal", hits: -1, reason: "REFUSED WITHOUT MEASUREMENT …" }`. The type
is `readonly hits: number`, the whole list's purpose is "recorded with the hit count that rejected
them", and no assertion constrains the field (`the admission log records every refused candidate with a
reason` checks only `candidate` and `reason` length). A magic `-1` meaning "not measured" in a field
whose contract is "the measurement" is the conflation this module refuses everywhere else. Prefer
`hits: number | null` with `null` documented as *refused without measurement*, and assert
`hits === null || hits >= 0` in the admission-log case.

### IN-02: a comment in `generate-catalog.test.ts` claims edit-robustness that the next line removes

**File:** `scripts/generate-catalog.test.ts` (the unreadable-frontmatter case)

The comment says: "The line number is DERIVED from the planted bytes rather than typed in, **so an
unrelated edit to `qe-e2e.md` cannot turn this pin into a nuisance red**". The interpolation into the
expected message is indeed derived — but the very next statement is
`expect(fenceLine, "…").toBe(11)`, and eight lines earlier `expect(closingAt, "…").toBe(4)`. Either
premise reds on any edit to `qe-e2e.md` that shifts a line. The premise assertions are *right* to
exist (they prove the fixture is the fixture); the sentence claiming immunity is wrong. Reword it to
"the number in the MESSAGE is derived; the two premises below are deliberately brittle, because a
fixture whose premise moved is not the fixture the case was measured on."

### IN-03: `findingCount(stdout)` no longer pins a number, only matcher/renderer agreement

**File:** `scripts/check-banned-claims.test.ts` (the two-plants case, replacing `toBe(2)`)

`expect(findingCount(stdout)).toBe(countBannedClaimOccurrences([TOKEN_PLANT],0,1) +
countBannedClaimOccurrences([COMPREHENSION_PLANT],0,1))` is genuinely non-circular in the sense the
comment claims (one side is the matcher, the other is arithmetic over the rendered output of a separate
process). But the *number* is no longer pinned: a matcher that began over-matching moves both sides
together and the case stays green, with only the `>= 1` floors as a backstop. The comment's argument
for the change (re-typing 2 → 3 goes stale) is sound; the loss is not stated. Add a two-sided range or
a per-literal breakdown assertion (`the token plant yields exactly 1, the comprehension plant exactly
2`) so growth is visible.

### IN-04: two audit-document headings now assert their own contradiction

**Files:** `docs/audit/29-locator-unification.md:702` (§9.3c);
`docs/audit/29-round4-residuals.md:164`

§9.3c's heading reads "V-29-35-01 — a private `parseFrontmatter` beside the exported one, MEASURED and
OUT OF SCOPE — **CLOSED by plan 29-40**", and the round-4 table row now reads "**OPENED THIS ROUND by
plan 29-35** … **CLOSED IN ROUND 5 by plan 29-40**" in one cell. The trail-not-tidy-state convention is
explicitly justified in the body and I agree with it — but a heading is what a reader greps and what a
table of contents renders, and "OUT OF SCOPE — CLOSED" reads as an unresolved edit rather than as a
trail. Keep the verbatim body; retitle the heading to
"§9.3c V-29-35-01 — a private `parseFrontmatter` beside the exported one — **CLOSED (plan 29-40,
round 5); round-4 escalation retained below**".

---

## Verification performed

| check | command | result |
|---|---|---|
| build freshness | `npm run freshness` | 48 committed `.js` match a fresh `tsc` rebuild |
| typecheck | `npx tsc --noEmit` | exit 0 |
| unit suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 52 files, 2054 passed / 2 skipped / 0 failed |
| the gate itself | `node scripts/check-banned-claims.js` | exit 0; 82/82, suppressed 12, extent 62, 22 literals / 3 conditional |
| catalog reproducibility | `npm run freshness:catalog`; `npm run generate:catalog` + `git diff --exit-code docs/catalog/README.md` | both exit 0; 17 roles / 19 workflows |
| NUL/binary visibility | `file -b` on all 11 reviewed files | all UTF-8 text; no grep in this review was blind |
| repo-wide NUL gate | `node scripts/check-nul-bytes.js` | 1588 files, 0 NUL bytes |
| 29-40 behavioural equivalence | both grammars run over 17 roles + 19 workflows for `tier`/`order`/`cadence` | **0 differences, 0 refusals** — the byte-identity claim holds |
| every published corpus number | independent traversal of `bannedClaimScan()` | 82 docs / 5898 lines / 1983 mid-sentence; `comprehension` ×2 (both in region); `understand` ×1; extent 62; suppressed 12; all 7 marker counts exact |
| CR-01 | hermetic `git archive HEAD` mirror, gate sha256-verified | claim in `CHANGELOG.md` → exit 0, unnamed; same bytes in `README.md` → exit 1, named twice |
| CR-02 | same mirror, 5 plants, reset between each | all 5 exit 0, planted file never named |

## Carried residuals — re-confirmed, NOT counted above

`V-29-26-01` (setext invisible), `V-29-26-02` (non-recursive reads), `V-29-26-03` (prefix fence test),
`V-29-26-04` (indented delimiters), `V-29-32-01` (closed-fence count-preserving swallow),
`V-29-42-01`…`-04` (opened this round). All hold as recorded in §3–§4 of
`docs/audit/29-round5-residuals.md`. `V-29-35-01` is genuinely closed — I verified the deletion, the
byte-identical catalog, and that the name-scoped owner tripwire's six matching / five non-matching
plants all behave as asserted.

Round-4 findings CR-01, WR-01…WR-08 and IN-01…IN-04 are **not re-verified here**: their subject files
are outside this diff's scope. `SEC_VOICE_MEMBERS` (round-4 CR-01) and 21 `WP-04` references (round-4
WR-06) now exist, which suggests both were addressed, but that is an observation and not a
verification.

---

_Reviewed: 2026-08-17T12:44:46Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Round: 5 — diff `803b9c1..ba45880`_
