# Gap-closure round 5 — what was closed, what was attacked, and what is left open by name

**Round:** 5 (plans `29-40`, `29-41`, `29-42`; code range `803b9c1..HEAD`)
**Written:** 2026-08-17, by plan `29-42` task 3
**Gap source:** `29-UAT.md` § Gaps — `G-29-1` and `G-29-2`, both from the round-5 UAT session
**Predecessor record:** `docs/audit/29-round4-residuals.md` (round 4). This file matches that
format deliberately rather than inventing a second shape.

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation.
So a decision that lives only in a conversation — "this is out of scope for this round", "this
residual is accepted", "this alternative was measured and refused" — is indistinguishable from a
silent drop when the next round comes to read the tree. This file is where round 5's decisions live so
they can be read.

It also carries the round's adversarial attempt log, **including the attempts that succeeded**. A
green suite is not proof for a safety invariant in this repository, and this phase's own record
contains six false harness results across four consecutive rounds. The credible artifact is a written
list of what was tried and what happened, not an assurance that nothing remains.

---

## 1. The round-5 disposition table

Two gaps, both from the UAT, both with an explicit user decision.

| id | subject | user decision | disposition | plan | evidence |
|---|---|---|---|---|---|
| **G-29-1** | `scripts/generate-catalog.ts:51` declares a private `parseFrontmatter` beside the exported authority at `scripts/frontmatter.ts:3862`, while its sibling generator `generate-role-adapters.ts` imports the authority. Two grammars, one class of bytes (D-24). Carried as `V-29-35-01` since round 4. | **(b) schedule its closure** — "Not accepted as a residual." An earlier response in the same session recorded (a) accept-as-residual; the human reviewed the evidence and reversed it to (b), and the reversal is the decision of record. | **closed** | `29-40` | the private declaration DELETED, the module routed through the exported authority, `docs/catalog/README.md` proven byte-identical across the change, and a DERIVED name-scoped owner tripwire added so a third copy reds the day it lands. `docs/audit/29-locator-unification.md` §9.3c; `29-40-SUMMARY.md` |
| **G-29-2** | The `comprehension` group of `BANNED_CLAIM_LITERALS` enumerated six fixed substrings. Matching is plain case-insensitive substring, so ANY interposed word defeated all six at once: five of the six phrasings the UAT enumerated exited 0 with the planted file never named. | **(c) structural fix** — neither accept the bound nor extend the literal list. Reuse the `requiresOnSameLine` mechanism so the guard decides a RULE. Option (b), appending phrasings, rejected by name as whack-a-mole. | **closed** | `29-41` (the rule) + `29-42` (the test surface, the admission log, this record) | `BENEFIT_VERB_MARKERS` (7 markers, each with its own measured line-hit count) plus TWO conditional bare-term members; the whole measured family reddening by name at file:line:column; `BANNED_CLAIM_EXEMPT_SUPPRESSED` re-derived 10 → 12 from the gate's own refusal text. `29-41-SUMMARY.md`, `29-42-SUMMARY.md`, §3 below |

### 1.1 Two findings against the gap file's own text, recorded because a gap file is evidence

Both were produced by measurement, not by reading, and both are recorded rather than smoothed over.

1. **`29-UAT.md` § G-29-2's `measured_probe` does NOT reproduce.** It states that under a bare
   `comprehension` member conditional on `[improve, better, easier, boost, help, benefit, enhance]`,
   "**ALL FIVE** bypass sentences red". Measured against the committed `.js` on a `git archive HEAD`
   mirror after the rule landed exactly as the prototype specifies, one member of the family —
   `...makes prose easier for LLMs to understand.` — **still exited 0 with the planted file never
   named anywhere in the output.** It carries no occurrence of the word `comprehension` at all and is
   outside that rule *by construction*, whatever markers are admitted. Remedy applied: a SECOND bare
   term (`understand`) with its own measurement, never an appended phrasing.
2. **The same probe's second claim is not falsifiable by the evidence it offers.** It says the guard
   "fails ONLY on the expected pin line" — but the un-re-pinned constant reds every run, including one
   with no plant at all. Every verdict in round 5 is therefore adjudicated on the **rendered finding
   line at file:line:column**, never on the exit code.

---

## 2. The adversarial attempt log

**The premise was asserted before any transcript here was believed.** Six false harness results across
four rounds of this phase were each produced by a harness that was not what it claimed.

```
npm run freshness
  -> All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.   exit 0
```

The attacks then ran against a `git archive HEAD` mirror at `1c9354e`, with the mirror's committed gate
proven byte-identical to the repository's before the first plant:

```
4bb7712b732aa898d8b5858960cd9e130b7225ab814ad2e998d0db8fd1c8dc6d  scripts/check-banned-claims.js         (repo)
4bb7712b732aa898d8b5858960cd9e130b7225ab814ad2e998d0db8fd1c8dc6d  <mirror>/scripts/check-banned-claims.js
clean-mirror control: exit 0
```

**The axis under attack.** Plan 29-41 introduced one degree of freedom the old enumeration did not
have: a co-occurrence **WINDOW**. `lineHits` is asked once per element of `text.split("\n")`, so the
window is one physical line — and the governed corpus is authored, hard-wrapped prose. The question
this round had to ask is not only *which characters* the predicate accepts but *at which positions it
is even asked*, and *what its input is assembled from*.

Thirteen attempts. Each was planted alone into the mirror, the mirror was reset between attempts, and
the verdict is the rendered finding line on the planted file.

| # | aim | attempt | exit | finding on the planted file | verdict |
|---|---|---|---|---|---|
| A1 | **MECHANISM** — the window itself | hard wrap: the benefit marker ends one physical line, the bare term opens the next (`...language improves` / `the comprehension of the model.`) | 0 | **none** | **GREEN — BYPASS.** `V-29-42-01` |
| A2 | **MECHANISM** — the window itself | hard wrap, other direction: the bare term first, the marker on the following line | 0 | **none** | **GREEN — BYPASS.** `V-29-42-01` |
| A3 | INPUT — what one physical line can contain | markdown table row, marker and bare term in DIFFERENT CELLS of one physical line | 1 | `00-bootstrap-greenfield.md:57:13 "comprehension"` | RED — the rule fires. A false-POSITIVE surface, not a bypass. `V-29-42-02` |
| A4 | INPUT — encoding | case variance, the whole claim upper case | 1 | `:55:34 "comprehension"` | RED — the matcher lowercases both sides |
| A5 | INPUT — encoding / line ending | CRLF: a carriage return sits INSIDE the line the matcher lowercases | 1 | `:55:36 "comprehension"` | RED — the CR is trailing residue and does not separate the pair |
| A6 | INPUT — the fence | the claim inside a fenced `text` example | 1 | `:56:36 "comprehension"` | RED — the module deliberately does not skip fences, as designed |
| A7 | the exemption boundary, ONE LINE **INSIDE** | the claim REPLACES line 240 of `writing-profile.md`, inside the region (line count preserved so the extent pin cannot move) | 1 | **none** — suppressed | CORRECT. The non-zero exit is the suppressed-pin refusal (12 → 13), which is the designed re-pin protocol and is exactly why adjudication is on the finding line |
| A8 | the exemption boundary, ONE LINE **OUTSIDE** | the same claim replaces line 233, immediately ABOVE the exempt heading | 1 | `writing-profile.md:233:34 "comprehension"` | RED — the exemption is region-scoped, and the two boundaries are one line apart and distinguishable |
| A9 | **MECHANISM** — can a markdown construct separate the pair? | the marker inside a link LABEL, the bare term outside it, one line (`See [how we improve it](./x.md) for the comprehension of the model.`) | 1 | `:55:41 "comprehension"` | RED — a markdown construct does not defeat the co-occurrence |
| A10 | **MECHANISM** — text a reader would not call part of the sentence | the marker appears ONLY inside an HTML comment on that line (`The kit reports comprehension. <!-- improve this later -->`) | 1 | `:55:17 "comprehension"` | RED — the condition is SATISFIED by non-prose text. A false-POSITIVE surface. `V-29-42-04` |
| A11 | **MECHANISM** — text a reader would not call part of the sentence | the marker appears ONLY inside a link TARGET / URL (`...comprehension, see [the note](./improve-plan.md).`) | 1 | `:55:18 "comprehension"` | RED — same class as A10. `V-29-42-04` |
| A12 | **CONTROL** — the design | the bare term ALONE on the line, no benefit marker anywhere | 0 | none | GREEN — **the design.** The discrimination proving the rule stayed CONDITIONAL, so the honest denial remains writable |
| A13 | **CONTROL** — the clean mirror | no plant at all | 0 | none | GREEN — the control that makes every RED above a measurement rather than a gate that always fails |

Three attempts aimed at the **mechanism** rather than at its inputs (A1/A2, A9, A10/A11), which is
what the round needed: two of them found the fail-open bound and two found a fail-closed one.

---

## 3. The residuals this round opened, measured and LEFT OPEN

Every one of these is **measured, named, given a live count, and not fixed here.** Quietly absorbing a
measured adjacency and quietly fixing one are both wrong; this phase has established the third option.
All four are out of scope for round 5 **by the same user decision that set the round's scope** — the
UAT recorded exactly two gaps and decisions (b) and (c) on those two, and nothing else.

**None of these is a bypass being concealed, and none is a silent drop.** Each is written here with
both addresses so a verification round reads it as a decision.

### 3.1 `V-29-42-01` — a claim split across a hard wrap is outside the co-occurrence window

- **Direction: FAIL-OPEN.** A real claim can be written and the gate stays green.
- **Addresses:** the window — `scripts/check-banned-claims.ts` `lineHits`, asked once per element of
  `text.split("\n")`; and the members it applies to — the two conditional bare terms in
  `BANNED_CLAIM_LITERALS`.
- **Reproduced:** A1 and A2 above, both directions, both exit 0 with the planted file never named.
- **LIVE COUNT, derived from the governed corpus rather than asserted:**

  | number | value | how |
  |---|---|---|
  | documents in the derived scan set | **82** | `bannedClaimScan()` |
  | lines | **5898** | the same traversal |
  | lines ending **MID-SENTENCE** — i.e. non-empty, followed by a non-empty line, and not ending in `.!?:;\|>` | **1983** (33.6% of all lines) | traversal over `bannedClaimScan()` counting that predicate; the predicate is stated here in full because it is an operationalization of "hard wrap" and its bound should be visible — it over-counts list continuations and structural rows |
  | **LIVE instances of the bypass SHAPE** — adjacent non-exempt lines, one carrying a benefit marker and the other a bare term, with neither line carrying both | **0** | the same traversal |

  So the residual is **highly reachable** (a third of the corpus's lines are hard wraps) and has **zero
  live instances today**. Both numbers matter: the first is why it cannot be dismissed, the second is
  why it did not have to be fixed this round.
- **Written down BEFORE it was measured.** Plan 29-41 recorded this cost in the member's own
  declaration paragraph before running the measurement, precisely so the paragraph reads as a design
  note and not as a rationalisation composed after the result.
- **The remedy that is REFUSED:** normalising whitespace before comparing. It would make the
  comparison inexact for every literal in the list in order to reach one wrapping, and the module's
  forbidden-alternative paragraph already names that class. If this is ever closed, the answer is a
  predicate that reasons about a SENTENCE with its own measured false-red cost — not a weaker matcher.

### 3.2 `V-29-42-02` — a markdown table row is one physical line, so co-occurrence is easier to trigger

- **Direction: FAIL-CLOSED.** Nothing is under-reported; a correct table can be reported.
- **Address:** the same window. Two cells of one row share one physical line, so a table whose `claim`
  column says `improve` and whose `effect` column says `comprehension for the model` reds — even
  though no sentence in it makes the claim.
- **Reproduced:** A3, exit 1, `00-bootstrap-greenfield.md:57:13`.
- **LIVE COUNT: 0.** No row in the 82-document scan set carries a benefit marker and a bare term in
  one row today.
- **Remedy when the first one is written:** rephrase the row, or admit a narrower term with its own
  measurement — never weaken the matcher.

### 3.3 `V-29-42-03` — the exempt document's own description of this gate is a wording behind it

- **Direction: FAIL-CLOSED for the guard; the inaccuracy is in the DOCUMENT's description of it.**
- **Addresses:** `agent-factory/writing-profile.md`, inside the exemption region — the sentence "The
  gate proves that no pinned literal appears outside this section; it does not prove that no such
  claim exists"; and the accurate form in `scripts/check-banned-claims.ts`'s header, which says no
  pinned literal **or pinned pair**.
- **LIVE COUNT: 1.** `agent-factory/roles/incident-responder.md:29:103` carries the pinned bare term
  `understand` outside the region and the gate is green, because that line carries no benefit marker.
- **The distinction is recorded rather than collapsed.** The sentence has been *structurally*
  imprecise since plan 29-02, when the discipline's name became a conditional member — but that member
  has **zero** unpaired occurrences outside the region, so the sentence was *vacuously true on the live
  tree* until plan 29-41 admitted `understand`. It became LIVE-false in round 5, not earlier.
- **Why it is not edited here.** The sentence sits INSIDE the exemption region, so any edit to it moves
  `BANNED_CLAIM_EXEMPT_EXTENT` (a line count, pinned two-sided at 62) and requires its D-04
  diff-disposition row; an edit introducing a pinned literal would move
  `BANNED_CLAIM_EXEMPT_SUPPRESSED` (pinned at 12) as well. `git diff --exit-code
  agent-factory/writing-profile.md` exits 0 for this whole round.
- Also recorded in source, at the exemption region's declaration, so the source and this file point at
  each other.

### 3.4 `V-29-42-04` — the co-occurrence condition is satisfied by text a reader would not call prose

- **Direction: FAIL-CLOSED.**
- **Address:** the same window. `lineHits` receives the raw line, so a marker occurring ONLY inside an
  HTML comment, or ONLY inside a link target / URL, satisfies the co-occurrence condition for a bare
  term elsewhere on that line.
- **Reproduced:** A10 (`<!-- improve this later -->`, exit 1, `:55:17`) and A11
  (`[the note](./improve-plan.md)`, exit 1, `:55:18`).
- **LIVE COUNT: 0** for each shape, measured over the 82-document scan set: no line carries a bare
  term together with a benefit marker whose only occurrence is inside a comment, and none where the
  only occurrence is inside a link target.
- **This is the same class as A3 and deliberately given its own id**, because the *reason* differs: A3
  is about markdown STRUCTURE putting two sentences on one line, this is about a line carrying
  NON-PROSE text. A single id would have merged two different remedies.

### 3.5 One residual this round found in its OWN harness, and fixed rather than carried

Recorded because it produced two false results inside plan 29-42's own acceptance checks, which makes
it the round's seventh harness-premise failure and the reason for a new permanent assertion.

A raw **NUL byte** was written into `scripts/check-banned-claims.test.ts` during execution. BSD `grep`
then classified the whole file as binary and reported **ZERO matches with no warning** and exit status
1 — indistinguishable from "the string is absent". Two of plan 29-42's own acceptance greps returned a
confident, false `0` because of it, and one of those greps was checking that a stale singular had been
removed. It had not: the removal comment **quoted** the stale phrase verbatim, which this repository's
own convention forbids for exactly this reason (a gate scanning source text without stripping comments
re-registers a quoted deletion as a live site).

Fixed in the same plan, because a defect this plan introduced is not a residual to escalate: the byte
is gone, the quotation is replaced by a description, and a permanent case now refuses any control byte
outside `\n` and `\t` in either the gate's source or its harness, with a non-empty-file floor beneath
it. `file -b` reports `Unicode text, UTF-8 text` for both.

---

## 4. Carried residuals — the full roll-up, in BOTH directions

A roll-up listing only what survived cannot be reconciled against the previous round's list, so every
`V-` marker in the tree is listed with its status after round 5 — closures included.

| id | residual | status after round 5 | where |
|---|---|---|---|
| `V-29-26-01` | setext headings are invisible to the one section-extent authority | **carried, unchanged** — fail-open, 0 live | `docs/audit/29-locator-unification.md` §6 |
| `V-29-26-02` | non-recursive directory reads narrow the derived scans below what their names claim | **carried, unchanged** — still live for the `-1` contract scan and `nonTestScripts()` | §6 |
| `V-29-26-03` | `FENCE_DELIMITER_LINE` is a prefix test, not an equality | **carried, unchanged** — fail-open, 0 live | §6 |
| `V-29-26-04` | indented fence delimiters are classified as governed prose | **carried, unchanged** — fail-closed only by the accident that the indented delimiters pair up; last measured at 4 live lines in `README.md` | §6, §8 |
| `V-29-32-01` | a closed-fence, count-preserving swallow of the banned-claim exemption region | **carried, unchanged** | plan 29-32; `BANNED_CLAIM_EXEMPT_EXTENT`'s declaration |
| `V-29-29-01` | the duplicated `sectionBody` — a third section-extent grammar, fence-blind AND level-blind | **closed in round 4** by plan 29-35 | `docs/audit/29-locator-unification.md` §9.3b |
| `V-29-35-01` | a private `parseFrontmatter` in `scripts/generate-catalog.ts` beside the exported authority | **CLOSED THIS ROUND by plan 29-40** — declaration deleted, module routed through the authority, `docs/catalog/README.md` byte-identical, derived owner tripwire added. This is `G-29-1`, closed by user decision (b) | §9.3c |
| `V-29-42-01` | a claim split across a hard wrap escapes the co-occurrence window | **OPENED THIS ROUND** — fail-open, 1983 hard wraps / **0 live instances** | §3.1 |
| `V-29-42-02` | a markdown table row puts marker and term on one physical line | **OPENED THIS ROUND** — fail-closed, 0 live | §3.2 |
| `V-29-42-03` | the exempt document's own description of this gate is behind the source's | **OPENED THIS ROUND** — fail-closed, **1 live** | §3.3, and `scripts/check-banned-claims.ts` at the exemption declaration |
| `V-29-42-04` | a marker inside an HTML comment or a link target satisfies co-occurrence | **OPENED THIS ROUND** — fail-closed, 0 live | §3.4 |

**Net movement across round 5: one closed (`V-29-35-01`), four opened.** That is stated plainly rather
than presented as progress. Round 4's record asked the next round to read a net-zero movement "as the
finding it is"; round 5's movement is net **+3**, and the honest reading is that the round attacked a
NEW predicate on an axis nothing had attacked before, so four of the five items above are the
*output of having looked* rather than evidence of decay. Three of the four are fail-CLOSED and have
zero live instances. One — `V-29-42-01` — is fail-OPEN, and it is the one a future round should own.

---

## 5. The LANG-08 override, repeated rather than paraphrased

Repeated verbatim from `29-VERIFICATION.md`'s `overrides:` frontmatter, because a paraphrased override
is a second version of a decision.

> **must_have:** "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <=
> previous, delta recorded, never raised mid-phase"
>
> **reason:** "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline):
> re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom
> into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is
> recorded; only the re-baseline action itself was deferred, by choice, not by omission. Carried
> unchanged through rounds 1, 2, 3 and 4 — not new work this round."
>
> **accepted_by:** "Olger Oeselg"
> **accepted_at:** "2026-08-15T09:57:04Z"

**The prohibition half held through every plan of round 5, and that is a measurement rather than an
assurance.** Range `803b9c1..HEAD`.

| check | method | result |
|---|---|---|
| the ceiling table itself | `roleCeiling()`'s function body extracted from `scripts/check-foundation-guards.ts` at `803b9c1` and at `HEAD` and hashed | **byte-identical**, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7` at both ends — and the SAME hash round 4 recorded, so the table has not moved across two rounds |
| files under a ceiling | `git diff --name-only 803b9c1..HEAD -- agent-factory/` | **0 files.** Not one plan of round 5 touched any document under `agent-factory/`, so no ceiling was even approached |
| the exempt document | `git diff --exit-code agent-factory/writing-profile.md` | **exit 0** — unedited for the whole round, which is also `V-29-42-03`'s disposition |

No ceiling was raised, lowered, or re-baselined by any plan of round 5. Plans checked: `29-40`,
`29-41`, `29-42`.

**Supply chain, at round scope, as asserted absence.** `git diff --exit-code 803b9c1..HEAD --
package.json package-lock.json` exits **0**: byte-unchanged across the round's full commit range. No
package was installed by any plan of round 5, and `RESEARCH.md` carries no new package row for this
round, so no legitimacy checkpoint was required.

---

## 6. Probe coverage — the arithmetic and its equality

Restated from plan `29-40`'s `probe_coverage` block so this artifact is readable alone. The spec-less
edge-probe fallback applies (Phase 29 has no SPEC file; `EDGE_ABSENT=1`, `PROHIB_ABSENT=1`). Total
items surfaced: **22** — LANG-01 4, LANG-02 1, LANG-03 4, LANG-04 2, LANG-05 3, LANG-06 3, LANG-07 1,
LANG-08 4.

| disposition | count | items |
|---|---|---|
| **authored** into `must_haves.truths` | **2** | LANG-04 `empty` and LANG-04 `encoding`, both `verification: explicit`, authored in plan `29-41`. Discharged in plan `29-42`: the `empty` edge as the vacuity and empty-marker-array cases (task 1), the `encoding` edge as the case and CRLF arms of the attack (A4, A5 above) |
| **flagged** assumption — in scope, unclassified | **1** | LANG-07 `unclassified`. **Never auto-dismissed** — an `unclassified` row stays `unresolved` by rule. Plan `29-40` read it as the byte-equality question and answered that question WITHOUT claiming the row resolved |
| **flagged** assumption — out of scope this round | **19** | LANG-01 4, LANG-02 1, LANG-03 4, LANG-05 3, LANG-06 3, LANG-08 4. These belong to work executed across plans 29-01..29-39; round 5's scope is exactly the two gaps in `29-UAT.md`. Naming each dropped requirement id with its item count is what keeps this from being a silent drop |

**No-silent-drop equality: 2 authored + 20 flagged = 22 surfaced.** ✓

**A harness-premise catch is carried forward from plan `29-40`, not dropped:** the orchestrator's
inline note predicted "LANG-07 ×2" and instructed the planner to re-derive missing rows from a
four-category set. The file on disk carries exactly ONE LANG-07 row and its category is `unclassified`,
which is not one of the four. Deriving as instructed would have manufactured an item that does not
exist. The file won.

---

## 7. The honest close

**A green suite is not proof for a safety invariant in this repository.** That is not modesty; it is
this phase's measured record. Six false harness results across four consecutive rounds, a seventh
inside round 5's own acceptance checks (§3.5), and in round 4 a set of executor self-verifications that
were the best of any phase and still shipped three bypasses — because each verified against its own
predicate and none asked what BOUNDS the predicate's input.

What round 5 can honestly claim:

- `G-29-1` is closed by DELETION of a duplicate grammar, with the generated artifact proven
  byte-identical and a derived tripwire so a third copy reds on arrival.
- `G-29-2` is closed by a RULE, not by an appended list. Five of six family members were open before
  and all six red by name after, each verdict read from a rendered finding line at file:line:column on
  a `git archive HEAD` mirror with a passing clean control.
- Every one of the seven admitted benefit markers has a measured hit count and a permanent case in
  which it is the ONLY marker on the line, so no marker is in the list that nothing proved does
  anything.
- The whole family is held by cases proven able to FAIL: each asserts the reconstructed pre-fix grammar
  and the shipped gate DISAGREE on its planted document. Five mutations of the shipped source were each
  watched reddening a named case.
- The pin that encoded the one-conditional-member singular was **relaxed to the measured count with its
  reason at the assertion, never deleted**, and it is still an equality, so a fourth member reds.
- The rejected alternative is on the record with the number that refused it: option (b) gains **0**
  findings over 82 documents and 5898 lines and moves no pin, and the refusal is held by an assertion
  as well as by a paragraph.

What round 5 does **not** claim:

- That no comprehension claim can be written. `V-29-42-01` is fail-open, measured, and reachable across
  a third of the corpus's lines.
- That the enumerated half is complete. The gate proves no pinned literal **or pinned pair** appears
  outside the one named exemption region. A brand-new claim in words this list does not contain still
  passes, and that residual is recorded in the gate's own source as well as here.
- That the four items in §3 are closed. They are **open, named, counted, and directional**. This file
  lists what was decided; it does not claim nothing remains.

**Requirements.** No requirement is re-marked complete by this record. `LANG-04` and `LANG-07` remain
**Gaps Found** pending round-6 re-verification — that verdict belongs to the verifier, not to the plan
that did the work.
