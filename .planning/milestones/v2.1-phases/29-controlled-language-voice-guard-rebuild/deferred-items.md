# Deferred items — phase 29

Out-of-scope discoveries logged during execution rather than fixed. Each names where it was found,
why it was not fixed, and what closing it would take.

## From plan 29-38 (2026-08-16)

### D-38-1 — `FORM_REMEDY` spells the procedural bound as a literal `20`

**Where:** `scripts/check-imperative-lexicon.ts`, `FORM_REMEDY["procedural-sentence-too-long"]`.

The remedy string reads "A procedural sentence is bounded at 20 words (WP-02)". The authority is
`PROCEDURAL_SENTENCE_MAX_WORDS`, and the two can disagree silently: changing the constant would
leave the refusal telling an author a bound the gate no longer applies. This is the set-literal
drift class one string over from the rule constant 29-38 introduced.

**Not fixed because** 29-38's prohibitions bound the edit to `WP-04`'s sentence, and interpolating
the bound changes the emitted bytes that plan's own pin compares. Closing it is one interpolation
plus a case asserting the refusal carries the constant's value.

### D-38-2 — `docs/audit/29-locator-unification.md:34` cites three stale line numbers

**Where:** row 4 of the §-table cites `scripts/check-imperative-lexicon.ts:478`, `:488`, `:627` as
the sites of `lines[i] === heading` / `/^## Steps\s*$/` / `/^#{1,2} /`.

Measured on today's tree: `:478` is a verb-list entry (`"Escalate",`), `:488` is `"Promote",` and
`:627` is a doc comment for a token-stripping helper. None is the cited construct. `STEPS_HEADING`
now sits at `:561` and the private `/^#{1,2} /` was deleted outright by plan 29-24.

**Not fixed because** it is an audit document owned by the WR-08 follow-up, and 29-38 edits no
`docs/` file. It is the same defect 29-37 closed in `check-foundation-guards.test.ts` — a site
addressed by its coordinates rather than by its code — one artifact over, and the fix is the same:
address the sites by their code, or delete the column.

### D-38-3 — a SUMMARY's own frontmatter is written after the run that would have caught it

**Where:** structural, across every plan. Observed as a live red at `2ca3ac3`.

`scripts/frontmatter.test.ts`'s D-49 false-red control parses **every tracked markdown file**,
including `.planning/`. A SUMMARY is written after the regression run it reports, so a frontmatter
defect in the SUMMARY itself cannot be caught by that plan's own evidence — it lands on `main` red
and the next plan discovers it. `29-37-SUMMARY.md` did exactly this; 29-38 repaired it as a Rule 3
blocker (commit `dd16917`).

**Not fixed because** the repair is a workflow change, not a code change. Closing it would mean
either a post-write parse check in the executor's own loop, or a `.planning/` exemption in the
control with its reason — and the second weakens a control written to have no exemptions.

**The trap, stated for the next executor:** `flattenBlock` joins a block sequence *before*
unquoting, so `scanEmbeddedDoubleQuoted` inspects every embedded `"…"` region no matter how the
sequence item itself was quoted. A backslash sequence outside `DQ_ESCAPE_ALLOWLIST` (`\"`, `\\`,
`\/`) inside any such region is refused. Write `` `split('\n')` `` in a single-quoted scalar, never
`` `split("\n")` ``.

### D-40-1 — an EMPTY `order:` key publishes workflow row 0, not a refusal

**Where:** `scripts/generate-catalog.ts`, the workflows loop. Pre-existing; NOT introduced by plan 29-40.

An ABSENT `order:` key refuses, because the pre-change code read `Number(fm.order)` with `fm.order`
`undefined` and `Number(undefined)` is `NaN`. A key that is PRESENT and EMPTY reaches `Number("")`,
which is `0` — an integer — so the workflow is published at row 0 with no finding. Plan 29-40
PRESERVED this exactly (`rawOrder` is `undefined` for an absent key and `""` for an empty one) and
disclosed it at the site, because that is what makes the plan's byte-identity claim honest rather
than a behaviour change smuggled inside a conversion.

**Measured in plan 29-40's session:** 0 of the 19 governed workflows carry an empty `order:`, so live
reachability is zero. The same is true of `tier:` on the roles side, where an empty value falls into
the existing `role tier must be core|enterprise, found ""` refusal and is therefore already correct.

**Not fixed because** the plan's contract was behaviour preservation proven as bytes, and its scope
was gap G-29-1. Changing a refusal boundary inside a gap-closure plan would put an unrelated
behavioural change behind that plan's byte proof. The fix is one line — treat a present-and-empty
`order:` as its own finding, the way `generate-role-adapters.ts` treats an empty `capabilities:` —
and it wants its own plan with its own planted case.

### D-40-2 — the D-50 IN-05 local-grammar classifier reads COMMENTS as code

**Where:** `scripts/frontmatter.test.ts`, `isGrammarSite` / `grammarSitesAmong`.

The classifier tests the raw source text of every tracked non-test `.ts` for a head-delimiter
construct AND a key-line construct. It has no comment stripping, so PROSE quoting a retired pattern
is read as a live construct. Measured in plan 29-40: after the private parser was deleted from
`scripts/generate-catalog.ts`, the module was still classified as a grammar site purely on the
strength of two comment lines that spelled the two deleted regexes.

**Closed in 29-40 by following the file's own convention instead** — plan 29-35 had already recorded
that "a comment that outlives its construct is the defect one module over" and deleted the retired
pattern's spelling with the pattern. 29-40 did the same: the FACTS about the deleted grammar are kept
in prose, the pattern text is not.

**Not fixed structurally because** the sibling guard file already has the structural answer —
`codeLinesOfSource` in `scripts/check-foundation-guards.test.ts`, whose docstring states that a name
mentioned in prose must neither satisfy nor falsify a membership test — and adopting it here is a
change to a safety classifier's input, in the fail-open direction: a commented-out grammar about to
be uncommented would stop being seen. That trade wants its own plan, its own planted discrimination
(a commented-out grammar vs a live one), and a deliberate decision, not a ride-along in a gap-closure
plan whose contract was behaviour preservation.

---

## Plan 29-41 — a SECOND test assertion moved, and the plan predicted one

**Severity:** minor — planned work whose scope was under-counted, not a defect in the shipped gate.
**Where:** `scripts/check-banned-claims.test.ts:387`, the case
"catches a token-economy claim and a comprehension claim in two different kit files".

Plan 29-41's gap contract map assigns exactly ONE test assertion to plan 29-42: the
`.toBe(1)` conditional-member cardinality pin at `:1673`. Measured after the rule landed, **two**
assertions fail, not one. The second is `expect(findingCount(stdout)).toBe(2)`.

**Why it moved, and why the movement is correct.** `COMPREHENSION_PLANT` is built from
`COMPREHENSION_CLAIM.literal`, and `COMPREHENSION_CLAIM` is selected with `find(l => l.group ===
"comprehension")` — the FIRST member, `improves comprehension`. So the plant is "The profile improves
comprehension for the model.", a line that now yields **two** occurrences rather than one: the
enumerated literal, plus the new bare-term rule matching on the co-occurring marker `improve`. That is
the same correct doubling that took `agent-factory/writing-profile.md:256` and `:288` from 1 to 2 each
and moved `BANNED_CLAIM_EXEMPT_SUPPRESSED` 10 -> 12. The gate is right; the hard-coded `2` is stale.

**Not fixed in 29-41** because `scripts/check-banned-claims.test.ts` is not in this plan's
`files_modified` and plan 29-42 owns the test surface. Editing it here is how a red gets cleared twice.

**Recommendation for 29-42, stronger than a re-pin.** Do NOT retype `2` as `3`. That number is a
function of how many literals happen to match one planted line, so it will go stale again the next time
a member is admitted — the set-literal drift class this repository has now paid for repeatedly. DERIVE
it: the module already exports `countBannedClaimOccurrences`, so the expected value can be computed
from `COMPREHENSION_PLANT` and `TOKEN_PLANT` through the gate's own matcher, exactly as `profileDoc`'s
`already` arithmetic already does for the reach fill.
