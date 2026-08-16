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
