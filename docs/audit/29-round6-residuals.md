# Gap-closure round 6 — what was closed, what was attacked, and what is left open by name

**Round:** 6 (plans `29-43`, `29-44`, `29-45`, `29-46`, `29-47`; code range `f718069..HEAD`)
**Written:** 2026-08-17, by plan `29-47`
**Gap source:** `29-VERIFICATION-round5.md` — two failed truths, both on `LANG-04`; and
`29-REVIEW-round5.md` — twelve findings (2 blockers, 6 warnings, 4 infos)
**Predecessor records:** `docs/audit/29-round5-residuals.md` (round 5) and
`docs/audit/29-round4-residuals.md` (round 4). This file matches that format deliberately rather than
inventing a third shape for a third instance.

## What this artifact is for

A verification round reads source and committed artifacts. It does not read a planning conversation.
So a decision that lives only in a conversation — "this is out of scope for this round", "this
residual is accepted", "this alternative was measured and refused", "this finding's remedy was
overtaken by a later decision" — is indistinguishable from a silent drop when the next round comes to
read the tree. This file is where round 6's decisions live so they can be read.

It also carries the round's adversarial attempt log, **including the attempts that succeeded**. A
green suite is not proof for a safety invariant in this repository, and this phase's own record
contains six false harness results across four consecutive rounds, a seventh inside round 5's own
acceptance checks, an eighth inside plan 29-43, and — recorded below at §2.1 — **a ninth produced by
this round's own adversarial pass, which would have published a fail-open bypass of the sole
carve-out that does not exist.** The credible artifact is a written list of what was tried and what
happened, not an assurance that nothing remains.

---

## 1. The round-6 disposition table

Two failed truths from `29-VERIFICATION-round5.md`, both on `LANG-04`, both with a locked decision.

| id | subject | locked decision | disposition | plan | evidence |
|---|---|---|---|---|---|
| **truth 1 / CR-02** | `guard_banned_claims` was to DECIDE the comprehension prohibition rather than enumerate a phrase list. What shipped in round 5 was `BENEFIT_VERB_MARKERS`, a seven-stem hand-authored list gating the bare term — the same enumeration one slot to the left, defeated by `increases`, `raises`, `gives…sharper`, `aids` and `makes…understand`, all five reproduced at exit 0 with the planted file never named. | **D-48** — the carve-out is POSITIONAL, not lexical; `BENEFIT_VERB_MARKERS` is DELETED, not replaced. The reviewer's subject-side pin (`controlled language` / `this profile` / `the kit` / `the voice`) is refused **by name**: it is a third hand-authored list over an equally open class and buys one round. **D-49** — the admission cost measured BEFORE the change, not after. **D-53** — the deletion EXTENDS to the standard-name group and `requiresOnSameLine` comes off the TYPE, not out of the lists. | **closed** | `29-44` | Both marker constants deleted; the field removed from `BannedClaimLiteral` (a member declaring one fails to compile — TS2353, demonstrated then reverted); `lineHits`'s conditional arm and the PASS line's conditional clause deleted with them; conditional members **3 → 0**. Nine sentences that exited 0 with the planted file never named now red by name at `file:line:column`, re-proven on the FINAL tree at §2.3 and §2.4. `BANNED_CLAIM_EXEMPT_SUPPRESSED` re-derived **12 → 14** off the gate's own refusal text. The one real false red paid in PROSE (`incident-responder.md:29`, 4 bytes), never by weakening the matcher. `29-44-SUMMARY.md`; §2.4, §3.1 below |
| **truth 2 / CR-01** | `guard_banned_claims`'s own PASS line claims the shipped kit and the public documents carry no conformance, token-economy or comprehension claim. `CHANGELOG.md` was silently outside the scan set — the module consumed `publicDocsScan()`, the public-document set AFTER another gate's own `CHANGELOG.md` exemption had been subtracted — and carried **two live** `token-economy` occurrences, the disproven claim this gate's founding transcript calls "the drift this gate exists for". | **D-50** — export `publicDocsCorpus()` beside `publicDocsScan()` so **each consumer names which question it is asking**; `check-banned-claims.ts` consumes the corpus; move the pin with the entrant named; rewrite the two sentences so the changelog records the MECHANISM without restating the disproven claim; correct the bound paragraph the import graph falsified. Plus **WR-02**'s four further unscanned classes, each admitted or named with a reason. | **closed** | `29-43` | `BANNED_CLAIM_SCAN_COUNT` **82 → 83 → 115**, every value read off the gate's own refusal text rather than computed by hand. `CHANGELOG.md:30` and `:68` rewritten with no entry falsified and no heading touched. **The `.claude/` transitive-coverage argument was TESTED and REFUTED**, turning an intended exclusion into an admission across 17 shipped adapters; `skills/` (7 files) was found only by deriving the remainder and appears in no round-5 finding. **Zero markdown classes uncovered.** Re-proven on the FINAL tree at §2.3 (C1–C6). `29-43-SUMMARY.md` |

### 1.1 The verb-axis defect, as a finding of record — disposition **CLOSED BY DELETION**

Round 5's residual register carried **no `V-` id** for the defect that failed its own must-have. This
section is where it lives, because a finding with no surviving id still belongs in the trail — and
after a deletion there is no id left to carry it.

**The mechanism.** `BANNED_CLAIM_LITERALS`'s bare comprehension term was declared with
`requiresOnSameLine: BENEFIT_VERB_MARKERS`, a seven-stem hand-authored list
(`improve`, `better`, `easier`, `boost`, `help`, `benefit`, `enhance`). `lineHits` reported the term
ONLY on a line that also carried one of the seven. The rule was `bare term AND some member of a
hand-authored list, on one line` — which closes the seven verbs somebody happened to write down and
leaves the next synonym green, with the pinned term present on the line.

**The five plants that defeated it, verbatim**, reproduced by the round-5 reviewer against the
committed `.js` on a hermetic mirror, one plant at a time, mirror reset between attempts:

```
exit=0  named=0   Controlled language increases comprehension for language models.
exit=0  named=0   Controlled language raises comprehension for LLMs.
exit=0  named=0   Controlled language gives models sharper comprehension.
exit=0  named=0   Controlled language aids comprehension for agents.
exit=0  named=0   Controlled language makes models understand prose faster.
```

Row 1 is family member **F6** (`boosts comprehension for language models`) with **one word changed**.
F6 is a permanent case asserted to red by name at `file:line:column`; its one-word neighbour was green
and unnamed. That is the definition of holding a spelling rather than a prohibition.

**All five red by name on the final tree** — c1 through c5 in §2.3, and the two-direction table in
§2.4.

**Disposition: CLOSED BY DELETION, not by an id.** Deleting the axis means there is nothing left to
carry: no marker list, no conditional arm, no field on the type. A `V-` id opened against a mechanism
that no longer exists would read in the next round as a live residual with a permanently zero count —
the AP-1 shape this round closed twice elsewhere.

#### The two source passages that asserted the spelling problem was closed while round 5 was shipping it

This is the part a tidy record omits and the part a later round needs. **Round 5's own prose denied the
defect it was shipping**, in two places.

**Passage 1 — the rule member's docblock, `scripts/check-banned-claims.ts:380-383` at the round's base
`f718069`:**

> `improves LLM comprehension`, `improves model comprehension`, `improves agent comprehension` and
> `boosts comprehension for language models` are all findings WITHOUT ANY OF THEM BEING ENUMERATED,
> and an interposed word no longer defeats the whole group at once. **That is the difference between
> a guard that holds a prohibition and a guard that holds the spellings somebody thought of.**

The guard still held spellings; only the slot had moved. **What stands there now:**

> AND HERE IS WHAT IS STILL NOT PROVED, STATED WITHOUT HEDGING, BECAUSE THE SENTENCE ABOVE ABOUT
> "a guard that holds a prohibition rather than the spellings somebody thought of" IS FINALLY TRUE
> OF THIS CODE AND WAS NOT TRUE WHEN IT WAS FIRST WRITTEN. It became true by DELETION of the axis
> it had been moved to, in round 6 — not by having been right all along in round 5, which shipped
> that sentence about the very list it was shipping. A comprehension, conformance or
> token-economy claim written WITHOUT ANY PINNED LITERAL still passes this gate. What the gate
> proves is exactly what the module header claims and no more: no pinned literal appears outside
> the one named exemption region. The surviving enumeration is named with its member count and its
> direction at the list's own declaration above.

**Passage 2 — the `BANNED_CLAIM_EXCLUDED` option-(b) rejection entry, at the same base:**

> User decision (c) replaced the enumeration with a RULE instead (the two conditional bare terms
> above). **This refusal is held by an ASSERTION as well as by this paragraph:
> `check-banned-claims.test.ts` pins the enumerated-comprehension count two-sided at 6, so appending
> a phrasing reds by name.**

That assertion holds the *phrase* list's cardinality at 6 and says nothing whatever about the marker
list's completeness — a coverage claim wider than its mechanism, which is this round's recurring
subject. **What stands there now:**

> User decision (c) replaced the enumeration with a RULE, and round 6 then deleted the rule's
> conditional half rather than move its enumeration a third time; the two bare terms above are
> unconditional literals now. WHAT AN ASSERTION ACTUALLY HOLDS, STATED NARROWLY BECAUSE THIS SENTENCE
> USED TO CLAIM MORE: check-banned-claims.test.ts pins the enumerated-comprehension count two-sided
> at 6, so APPENDING A PHRASING to that group reds by name. That pin holds the PHRASE list's
> cardinality and says nothing about any other axis — it never did. What closes the axis an appended
> phrasing would have exploited is not an assertion at all: the conditional half of this group is
> DELETED, so there is no verb, phrase or subject list left to append to.

Both are corrected in place rather than deleted. A corrected paragraph with no record of its
correction teaches nothing.

### 1.2 The part round 6 nearly repeated — measured, escalated, and then extended by the user as D-53

This is the more useful half of the story, and it is written down because **the axis was found by
PLANNING rather than by review**, which is the transferable part.

**The measurement.** While authoring plans `29-43`..`29-47`, the identical defect was found surviving
one member over — on the group that gives the gate its name. `Simplified Technical English` was gated
by `CONFORMANCE_VERB_MARKERS` (`conform`, `complian`, `certif`, `endors`, `approv`, `accredit`), so
every conformance verb outside that list passed. Reproduced through the gate's own
`countBannedClaimOccurrences` on 2026-08-17: `conforms to Simplified Technical English` yields **1**
finding, while `follows` / `meets` / `adheres to` / `is written in` each yield **0**.

**The escalation.** The planner ESCALATED it rather than acting on it, on the correct reading that
D-48 named two bare terms and that D-51's reasoning rested explicitly on that third member staying
conditional — D-51 says in terms: *"WR-06 survives D-48: `Simplified Technical English` still carries
`CONFORMANCE_VERB_MARKERS`, so a conditional member with an empty marker list is still a reachable
shape."* Acting on the measurement without the decision would have been a plan quietly widening its
own scope on the strength of its own finding.

**The extension.** The user read the measurement and **extended the decision** rather than accepting
the escalation, as **D-53**: the apparatus is deleted outright on both groups, `requiresOnSameLine`
comes off the type, and conditional members go 3 → 0. D-48's own arithmetic admitted it for free — the
discipline's name occurs on exactly **two** lines, `writing-profile.md:239` and `:241`, and **both are
inside the named exemption region**, so unconditional costs **0** new findings outside it.

**The four plants, before and after, on the same harness:**

| plant | PRE-change (base `50e966e`, gate `c59b783d…`) | FINAL TREE (base `223df86`, gate `6f0722fa…`) |
|---|---|---|
| `conforms to Simplified Technical English` **(control)** | exit 1, named at `:45:29` | exit 1, named at `:45:29` |
| `follows Simplified Technical English` | **exit 0, NOT named** | **exit 1, named at `:45:25`** |
| `meets Simplified Technical English` | **exit 0, NOT named** | **exit 1, named at `:45:23`** |
| `adheres to Simplified Technical English` | **exit 0, NOT named** | **exit 1, named at `:45:28`** |
| `is written in Simplified Technical English` | **exit 0, NOT named** | **exit 1, named at `:45:31`** |

**The conformance-verb axis is recorded as CLOSED by D-53, not as an open escalation.** The
before-and-after transcripts above are its evidence, and the control row is what keeps the other four
honest: the harness did not simply start reddening everything.

**What a record showing only the final state would have lost:** that the second instance of this
defect was found by someone writing a plan, by re-running the review's own reproduction against a
member the review never mentioned — and that the correct response to finding it was to escalate, not
to fix it inside the plan that found it.

---

## 2. The adversarial attempt log

### 2.0 The premise, asserted before any transcript below was believed

In this order, and quoted.

**Freshness.** The committed `.js` the attacks run is provably a build of its `.ts`:

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
FRESHNESS_EXIT=0
```

**The mirror's identity.** Mirror built with `git archive HEAD` at base commit
`223df86cd047411b6b49ff4ac88c593363e8db51`, and the mirror's committed gate proven byte-identical to
the repository's **before the first plant**:

```
6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba  scripts/check-banned-claims.js         (repo)
6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba  /private/tmp/r6/pristine/scripts/check-banned-claims.js
tracked files: 1600      mirror files: 1600
```

The mirror lives under `/private/tmp`, never `/tmp` — plan 29-43's catch, where the macOS `/tmp`
symlink made `import.meta.url` miss the module's `isEntry` guard, the gate never ran, and `exit=0`
with zero bytes of output read as a pass.

**The clean-mirror control, at exit 0:**

```
[CONTROL-clean] exit=0 premise=TRUE bytes=1237 named=0
  PASS  banned claims: 0 findings over 115/115 elements
  PASS  LANG-04: 115 document(s) carry zero banned claim literal outside the one named exemption
        region — kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1;
        22 pinned literal(s) across 3 group(s), matched UNCONDITIONALLY — the gate enumerates what is
        banned and nothing about how it is said; 1 exemption region … which suppresses 14
        banned-claim occurrence(s) (standard-name 8, token-economy 2, comprehension 4), pinned at 14,
        and reaches 62 line(s), pinned at 62 …
ALL CHECKS PASSED
```

Every attempt below was planted **alone** onto a mirror **reset from the pristine extract**, and every
verdict is adjudicated on the **rendered finding line at `file:line:column`**, never on the exit code —
round 5 recorded that an un-re-pinned constant makes the exit non-zero for an unrelated reason, and
this round reproduces that behaviour on nine of its own attempts.

### 2.1 The ninth false harness result — produced by THIS pass, caught before it was written down

This is recorded first, ahead of the log it nearly corrupted, because it is the round's most
transferable finding and it happened here rather than in a predecessor.

Attempt **R2** aimed at the last line of the exemption region. The plant helper replaced line 296 of
`agent-factory/writing-profile.md` — the region's final index — with a conformance-and-comprehension
claim. The gate returned:

```
[R2-last-inside] exit=0 premise=TRUE bytes=1237 named=0
    PIN: PASS  LANG-04: … suppresses 14 banned-claim occurrence(s) … pinned at 14 … reaches 62 line(s), pinned at 62
```

Read at face value that is **a fail-open bypass of the sole carve-out**: a live claim on the region's
last line, zero findings, and *neither pin moved* — meaning nothing in the tree noticed at all. It
would have been the most serious finding this phase has produced.

It is false. The plant never landed:

```
$ grep -c -F "conforms to Simplified Technical English and improves" "$W/agent-factory/writing-profile.md"
0
$ wc -l < "$W/agent-factory/writing-profile.md"   # mirror
295
$ wc -l < "$PRIS/agent-factory/writing-profile.md" # pristine
295
```

`awk 'NR==296'` cannot match a file with 295 records. The document ends in a newline, so
`split("\n")` yields a 296-element array whose last element is the empty string after that newline —
an index the region genuinely covers, and a line `awk` cannot address. The helper was a **silent
no-op**, and the gate then correctly reported an unmodified tree.

**The premise that was missing was not the gate's — it was the PLANT'S.** The 29-43 protocol asserts
that the gate ran (non-empty output carrying its own banner), and that assertion passed here: the gate
did run, on a tree nobody had modified. Asserting the harness produced output says nothing about
whether the harness produced the *input*.

The harness was corrected to assert three premises before any verdict is believed — the gate ran, the
**plant landed** (the needle is present in the mirror file), and the mirror gate is sha256-identical to
the repository's — and every attempt below carries `plant=LANDED`. Where an attempt produced a named
finding quoting its own planted sentence verbatim, the landing is proven by the transcript itself.

**The lesson, stated for the next round: assert the premise on BOTH SIDES of the harness.** Every one
of the nine false results this phase has recorded was produced by a harness that was not what it
claimed, and this one extends the class — the harness was not doing what it claimed *to the input*,
where every previous instance was about the output. An attack pass whose plants do not land reports
that the guard is broken; it is the same defect as one whose gate does not run, wearing the other
face.

### 2.2 The degrees of freedom THIS round's change introduces, named before the attacks

Round 5's adversarial log has thirteen attempts and its own honest framing, and it still missed the
defect that mattered, because every attempt varied an INPUT and none varied the one degree of freedom
the round's own design decision had added. So this round names its new degrees of freedom in writing
first, and every attempt below is labelled with the one it aims at.

Deleting the conditional apparatus — both marker lists, the `lineHits` arm, the PASS-line clause and
the `requiresOnSameLine` field on the type — removes the verb axis on BOTH groups and opens four
others.

| # | the degree of freedom | why THIS CHANGE created it |
|---|---|---|
| **DOF-1** | **substring reach** | Every pinned term is now asked about at **every position**, where the marker requirement used to filter most of them out. All three widened terms match unconditionally, so they also match inside longer words, inside negations, and inside inflections nobody enumerated. |
| **DOF-2** | **non-prose positions** | Same cause, different consequence: the matcher is asked on the raw line, so a term inside a fence, an HTML comment, a link target or a table cell is now matched **on its own**, with no marker needed to make the pairing. Round 5's `V-29-42-02` / `-04` described the *marker* reaching those positions; after the deletion the *term* reaches them directly. |
| **DOF-3** | **the exemption region as the SOLE carve-out** | This is the one to spend the most attempts on. Before D-53 a legal denial could survive **either** by sitting inside the region **or** by not carrying a marker on its line. The second route is gone. Every sentence in the kit that names the standard or the topic in order to deny a claim about it now depends **entirely** on the region's boundary being where the gate thinks it is. A boundary defect that was a nuisance in round 5 is a correctness defect now. |
| **DOF-4** | **term membership** | With no marker mechanism, the only thing still enumerated is the pinned literal list itself. A claim written with none of its members passes. That is the residual this gate has always had, and after a deletion-shaped closure it is the ONLY thing standing between the gate and the prohibition's full scope — so it is demonstrated with plants rather than asserted. |

A fifth axis is not new but was widened by plan 29-43 and had never been attacked: **the corpus**, which
grew 82 → 115 documents. Four classes entered the scan this round and nobody had asked whether the
file-scoped exemption and the two pins behave correctly over them.

### 2.3 The log — forty-four attempts, one plant per reset mirror

Every row carries its aim, its plant, its exit code, what was named at `file:line:column` or its
absence, and its verdict. **The attempts that found nothing are recorded too**; an attack log listing
only successes is an advertisement.

Unless stated otherwise the plant target is `agent-factory/workflows/13-incident.md` (44 lines;
plants append at line 45).

#### DOF-1 — substring reach

| # | plant | exit | named | verdict |
|---|---|---|---|---|
| S1 | `Controlled language raises the comprehensions of every model that reads it.` | 1 | `13-incident.md:45:32` `"comprehension"` | RED. The **plural** is reached — the term matches inside the inflected form. |
| S2 | `Controlled language gives a model a firmer understanding of the step.` | 1 | `:45:44` `"understand"` | RED. The **gerund** is reached. |
| S3 | `A model that reads unclear prose does not understand the step.` | 1 | `:45:43` `"understand"` | RED. The **negated** form reds — the gate reports a sentence that *denies* the claim. FALSE-POSITIVE surface. |
| S4 | `A reader who skims this step will misunderstand the rollback order.` | 1 | `:45:38` `"understand"` | RED. The term matched **inside a longer word** whose meaning is the opposite. FALSE-POSITIVE surface. |
| S5 | `The rollback order is written to be understandable at a glance.` | 1 | `:45:37` `"understand"` | RED. **Inside a longer word**, ordinary operational English, no claim of any kind. FALSE-POSITIVE surface. |
| S6 | `Ambiguous prose produces incomprehension in an agent reading it.` | 1 | `:45:28` `"comprehension"` | RED. **Inside a longer word**, prefix side. FALSE-POSITIVE surface. |

**Four of six are false-positive surfaces**, all fail-CLOSED, and all four are `V-29-44-01`'s reach —
measured here for the first time. See §3.1.

#### DOF-2 — non-prose positions

| # | plant | exit | named | verdict |
|---|---|---|---|---|
| N1 | the claim inside a fenced ```` ```text ```` example | 1 | `:47:21` `"improves comprehension"`, `:47:30` `"comprehension"` | RED — the module deliberately does not skip fences, as designed. Unchanged from round 5. |
| N2 | `The rollback order is fixed. <!-- comprehension of it is the reader problem -->` | 1 | `:45:35` `"comprehension"` | RED. The term inside an **HTML comment** reds on its own now; no marker is involved. |
| N3 | `See [the note](./improves-comprehension-plan.md) before you act.` | 1 | `:45:27` `"comprehension"` | RED. A **filename** carrying the term reds. FALSE-POSITIVE surface, and a new one — round 5's `V-29-42-04` needed a *marker* in the target; here the term alone in a path is enough. |
| N4 | a markdown table row: `\| terse voice \| comprehension for the model \|` | 1 | `:48:17` `"comprehension"` | RED. A **table cell** reds on its own. |

All four fail-CLOSED. N2/N3/N4 are the same class round 5 opened as `V-29-42-02` and `V-29-42-04`,
**re-caused**: the co-occurrence window that produced them is gone, and the term's own unconditional
reach produces them instead. Recorded at §3.1 and §4 rather than allowed to look closed.

#### DOF-3 — the exemption region as the sole carve-out (eleven attempts)

The region is `agent-factory/writing-profile.md` § `## Disclaimer and honesty floor`. Measured on the
final tree: `headingAt = 234`, `endBefore = 296`, `extent = 62`, and the document's
`split("\n")` array has **296 elements** — so `endBefore === lines.length`.

Plant text where not stated: `The grugops kit conforms to Simplified Technical English and improves comprehension.`

| # | aim | plant | exit | named | verdict |
|---|---|---|---|---|---|
| R1 | boundary — **first line inside** | line 236 (blank) replaced; line count preserved | 1 | **none** | CORRECT — suppressed. Suppressed pin 14 → **17**, which is the designed re-pin refusal and is exactly why adjudication is on the finding line. |
| R2 | boundary — **last content line inside** | line 295 replaced; line count preserved | 1 | **none** | CORRECT — suppressed. Pin 14 → **17**. (This is the corrected R2; the first attempt at it produced §2.1's false result.) |
| R2b | boundary — the **trailing element** after the final newline, i.e. the region's true last index | the claim concatenated at EOF with no newline | 1 | **none** | CORRECT — suppressed. Pin 14 → **17**. The region genuinely covers the post-newline element. |
| R3 | boundary — **one line before the heading** | line 234 (blank) replaced; line count preserved | 1 | `writing-profile.md:234:29`, `:234:62`, `:234:71` | RED — **the boundary discriminates at one line's resolution.** The region is region-scoped and its top edge is exact. |
| R4 | boundary — **is there anything AFTER the region?** | the claim appended on a new line at EOF | 1 | **none** | **NO. There is no "after".** `endBefore === lines.length`: the sole carve-out is **unbounded at the bottom**. Suppressed 14 → 17 AND extent 62 → **63**; both pins fire. Fail-CLOSED today, but see `V-29-47-02` (§3.2). |
| R5 | boundary — **the heading line itself** | line 235 rewritten to `## Disclaimer and honesty floor <claim>` | 1 | 17 findings named — the 3 planted **plus all 14 previously suppressed** | RED, loudly. The heading no longer matches, so `headingCount = 0`, the gate REFUSES (`a VANISHED region makes the disclaimer illegal`), and the whole carve-out collapses. **The region cannot be destroyed silently.** |
| R6 | **stability** — a level-2 heading inserted ABOVE the region, claim inside the shifted region | 2 lines inserted at 234; claim at the shifted first blank | 1 | **none** | Suppressed 14 → **17**. The claim is correctly still inside. But note what did NOT move: see R6b. |
| **R6b** | **stability** — the region MOVED, with **no claim at all** | `## An inserted section above the carve-out` + a blank inserted at line 234 | **0** | **none** | **GREEN. Nothing noticed.** Suppressed **14**, extent **62** — both pins unmoved, `ALL CHECKS PASSED`. The region's POSITION is pinned by nothing. Benign today (a rigid translation preserves the covered content) and recorded as `V-29-47-03` (§3.3). |
| R7 | **stability** — a section appended INSIDE the region at EOF, then the claim under it | `### A sub-section appended inside the carve-out` + claim | 1 | **none** | Suppressed 14 → **17** AND extent 62 → **66**. Both pins fire. A level-3 heading does not terminate a level-2 region, which is correct and is what the extent pin exists to publish. |
| R8 | **stability** — a level-2 heading appended at EOF (which ENDS the region), claim AFTER it | `## A new section that terminates the carve-out` + claim | 1 | `writing-profile.md:299:29`, `:299:62`, `:299:71` | RED — **correct.** The region's bottom edge follows the next level-2 heading, so text appended after a new heading is outside the carve-out and is reported. |
| R9 | **duplication** — a SECOND copy of the exempt heading | line 234 replaced with the exempt heading | 1 | 14 findings — every previously suppressed occurrence | RED, loudly. `that heading occurs 2 time(s) in the file. Exactly one is required, asserted two-sided … a DUPLICATED region widens the hole`. **The carve-out cannot be duplicated silently.** |

**Ten of the eleven behave correctly and loudly. One — R6b — is green and is a new residual.**

#### DOF-4 — term membership: five real claims written with NONE of the pinned literals

These are the kind of sentence a well-meaning contributor would actually write. Each was planted alone
onto a reset mirror, each under the `plant=LANDED` assertion.

| # | plant | exit | named | verdict |
|---|---|---|---|---|
| T1 | `Controlled language makes prose quicker for a language model to parse.` | **0** | none | **GREEN — PASSES.** |
| T2 | `The terse voice lifts model accuracy on every instruction it reads.` | **0** | none | **GREEN — PASSES.** |
| T3 | `grugops is written to a controlled-English standard and meets it in full.` | **0** | none | **GREEN — PASSES.** A conformance claim, in words the list does not contain. |
| T4 | `This profile cuts the number of tokens a model must read on every run.` | **0** | none | **GREEN — PASSES.** A token-economy claim, in words the list does not contain. |
| T5 | `Writing to this profile gives agents a firmer grasp of each step.` | **0** | none | **GREEN — PASSES.** |

**This is not new and it is not a regression.** It is the residual the module header has always
declared, and after D-53's deletion it is the ONLY thing standing between the gate and the
prohibition's full scope. It is recorded with the plants that demonstrate it, at §3.4, because a round
that closed a defect by deletion is exactly the round most likely to be read as having closed the
class. **Round 6 did not close it and does not claim to.**

#### The widened corpus — one plant per entrant, plus the exclusion boundary

Plant: `The grugops kit conforms to Simplified Technical English.`

| # | document | entered the scan | exit | named | verdict |
|---|---|---|---|---|---|
| C1 | `CHANGELOG.md` | **this round** (29-43, D-50) | 1 | `CHANGELOG.md:123:29` | RED — the entrant is genuinely scanned. This is CR-01's closure, re-proven on the final tree. |
| C2 | `install/README.md` | **this round** (29-43, WR-02) | 1 | `install/README.md:496:29` | RED |
| C3 | `skills/gate/SKILL.md` | **this round** (29-43, derived remainder) | 1 | `skills/gate/SKILL.md:24:29` | RED |
| C4 | `.claude/agents/grugops-ba-pm.md` | **this round** (29-43, transitive argument refuted) | 1 | `.claude/agents/grugops-ba-pm.md:29:29` | RED |
| C5 | `docs/faq.md` — named in `BANNED_CLAIM_EXCLUDED_LOCATIONS` | no | **0** | none | GREEN — **the boundary discriminates.** An excluded prefix genuinely excludes, and the exclusion carries a written reason. |
| C6 | `memory-bank/00-index.md` — named in `BANNED_CLAIM_EXCLUDED_LOCATIONS` | no | **0** | none | GREEN — same. A decision, not a defect. |

#### D-53's discrimination proof — the four unlisted conformance verbs, re-run on the FINAL tree

Plan 29-44 proved these on the tree it produced. Three plans have landed since, two of which touched
the same module, so they are re-run here on the tree that ships.

| # | plant | exit | named | verdict |
|---|---|---|---|---|
| v-conforms_to **(CONTROL)** | `The grugops kit conforms to Simplified Technical English.` | 1 | `13-incident.md:45:29` | RED — the control that keeps the other four honest. |
| v-follows | `…follows Simplified Technical English.` | 1 | `:45:25` | RED |
| v-meets | `…meets Simplified Technical English.` | 1 | `:45:23` | RED |
| v-adheres_to | `…adheres to Simplified Technical English.` | 1 | `:45:28` | RED |
| v-is_written_in | `…is written in Simplified Technical English.` | 1 | `:45:31` | RED |

#### The five round-5 comprehension bypasses, re-run on the FINAL tree

| # | plant | exit | named | verdict |
|---|---|---|---|---|
| c1 | `Controlled language increases comprehension for language models.` | 1 | `:45:31` `"comprehension"` | RED |
| c2 | `Controlled language raises comprehension for LLMs.` | 1 | `:45:28` `"comprehension"` | RED |
| c3 | `Controlled language gives models sharper comprehension.` | 1 | `:45:42` `"comprehension"` | RED |
| c4 | `Controlled language aids comprehension for agents.` | 1 | `:45:26` `"comprehension"` | RED |
| c5 | `Controlled language makes models understand prose faster.` | 1 | `:45:34` `"understand"` | RED |

#### The two controls

| # | attempt | exit | named | verdict |
|---|---|---|---|---|
| CONTROL-clean | no plant at all | **0** | none | GREEN — the control that makes every RED above a measurement rather than a gate that always fails. 1237 bytes, banner present. |
| CONTROL-legal-denial | a legal denial planted INSIDE the region: `No conformance with ASD-STE100 Simplified Technical English is claimed, and no comprehension benefit is claimed.` | 1 | **none** — `PASS  banned claims: 0 findings over 115/115 elements` | **CORRECT — SUPPRESSED.** The carve-out holds: the topic stays writable positionally. The non-zero exit is the suppressed pin at 14 → 18, which is that pin working as designed. |

### 2.4 The two-direction movement — nine plants, measured on the same harness at both ends

Plan 29-44's pre-change transcripts were taken on a `git archive` mirror at base `50e966e`, gate
sha256 `c59b783df586c72871308451ebef2025e3605c845ee105bf2f7b3565da393d69`, clean control exit 0 /
1277 bytes. This round's post-change transcripts are on base `223df86`, gate sha256
`6f0722fa…b385ba`, clean control exit 0 / 1237 bytes. **Without the "before" column the deletion is
not evidence**, so both are quoted side by side.

| plant | PRE-change (29-44, base `50e966e`, gate `c59b783d…`) | POST-change / FINAL TREE (base `223df86`, gate `6f0722fa…`) |
|---|---|---|
| `conforms to` **(control)** | exit 1, named at `:45:29` | exit 1, named at `:45:29` |
| `follows` | **exit 0, NOT named** | **exit 1, named at `:45:25`** |
| `meets` | **exit 0, NOT named** | **exit 1, named at `:45:23`** |
| `adheres to` | **exit 0, NOT named** | **exit 1, named at `:45:28`** |
| `is written in` | **exit 0, NOT named** | **exit 1, named at `:45:31`** |
| `increases comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:31`** |
| `raises comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:28`** |
| `gives models sharper comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:42`** |
| `aids comprehension` | **exit 0, NOT named** | **exit 1, named at `:45:26`** |
| `makes models understand prose faster` | **exit 0, NOT named** | **exit 1, named at `:45:34`** |

**Nine plants, nine measured 0-to-named movements, one unmoved control.** That is D-53's
discrimination proof and D-48's, taken end to end rather than inferred from a green suite.

---

## 3. The residuals — measured, named, directed, counted, and LEFT OPEN

Every one is **measured, named, given a live count, and not fixed here.** Quietly absorbing a measured
adjacency and quietly fixing one are both wrong; this phase established the third option, and this
plan's first prohibition enforces it — `git diff --stat` for plan 29-47 shows exactly one changed
file, this one.

### 3.1 `V-29-44-01` — the widened bare terms are a false-red surface over the whole of ordinary English

- **Direction: FAIL-CLOSED.** The gate over-reports here; nothing is hidden by it. That is the
  admissible direction for a safety guard and it is still a cost somebody pays.
- **Addresses:** `scripts/check-banned-claims.ts` at the `understand` and `comprehension` members'
  declarations (the id string is cross-referenced from source at `:459` and `:578`, and from the
  committed twin at `:375` and `:483` — grepped in both files, quoted here so the register and the
  source point at each other); and this section.
- **THE REACH IS THE WHOLE TERM NOW, NOT A MARKER-GATED SLICE OF IT, AND THE DELETION IS WHAT WIDENED
  IT.** Round 6 is the first round to MEASURE that reach rather than describe it. Four plants, each
  ordinary English making no claim whatever, each RED by name:

  | plant | named | what it actually says |
  |---|---|---|
  | `…does not understand the step.` | `:45:43` | a **denial** |
  | `…will misunderstand the rollback order.` | `:45:38` | the **opposite** meaning, matched inside a longer word |
  | `…written to be understandable at a glance.` | `:45:37` | ordinary operational English |
  | `Ambiguous prose produces incomprehension…` | `:45:28` | the **opposite** meaning, prefix side |

  Plus the plural (`comprehensions`, `:45:32`) and the gerund (`understanding`, `:45:44`). The reach
  covers the inflected, the negated, the compounded and the inside-a-longer-word forms on **both**
  bare terms, and it reaches non-prose positions on its own — an HTML comment (`:45:35`), a table cell
  (`:48:17`) and, newly measured here, **a filename in a link target** (`:45:27`).
- **LIVE COUNT: 0**, re-derived over the FINAL 115-document corpus with the gate's own matcher:

  ```
  DERIVED SCAN CARDINALITY: 115 (pin BANNED_CLAIM_SCAN_COUNT = 115)
  TOTAL LINES over the derived scan set: 7380
  LIVE banned-literal occurrences OUTSIDE the region: 0
  ```

  The derived cardinality is recorded so a short scan cannot make a low count look like a clean bill.
- **THE REMEDY, WHICH IS THE SAME ONE PLAN 29-44 APPLIED:** rephrase the sentence, or admit a narrower
  term with its own measurement. **NEVER weaken the matcher** — the three forbidden weakenings
  (fenced-block skip, whole-word-only match, below-a-marker skip) stay forbidden, and a whole-word-only
  match is precisely the "fix" S4/S5/S6 invite.

### 3.2 `V-29-47-02` — the sole carve-out is UNBOUNDED AT THE BOTTOM, and its only backstop is a pin whose designed remedy is to move it

- **OPENED THIS ROUND.**
- **Direction: FAIL-OPEN.** Reachable only through the re-pin protocol, which is why it is a residual
  and not a bypass.
- **Address:** `scripts/check-banned-claims.ts` `locateExemptRegion` — `endBefore = sectionEndIndex(text, headingAt + 1, 2)`, and `## Disclaimer and honesty floor` is the **last** level-2 section
  of `agent-factory/writing-profile.md`.
- **Measured on the final tree:**

  ```
  region: {"headingAt":234,"endBefore":296}   extent: 62   lines.length: 296
  ```

  `endBefore === lines.length`. **There is no line after the region.** Anything appended to that
  document — a paragraph, a level-3 section, a footnote — lands INSIDE the sole carve-out (R4, R7, R2b
  all confirm it).
- **Why it is a residual and not a bypass:** both pins fire on an append. R4 moved suppressed 14 → 17
  *and* extent 62 → 63; R7 moved them to 17 and 66. The gate refuses. **But the refusal's own
  instruction is to move the constant** — "Read the region, say in the commit which claim entered or
  left it, and then move the constant" — so the route from an appended claim to a permanently exempt
  one is exactly one re-pin by an author who read the refusal as noise. Before D-53 that author's
  claim would also have needed a marker on its line; now the region is the only thing standing there.
- **LIVE COUNT: 0.** No claim sits below the region today; the document is byte-unchanged for the whole
  round (`git diff --exit-code f718069..HEAD -- agent-factory/writing-profile.md` exits 0).
- **Remedy:** bound the region explicitly — a closing sentinel, or an assertion that the region is not
  the document's last section — so that "appended below the disclaimer" is a different fact from
  "inside the disclaimer". **Never** widen the matcher and never relax either pin.

### 3.3 `V-29-47-03` — the region's POSITION is pinned by nothing; a rigid translation moves it silently

- **OPENED THIS ROUND.**
- **Direction: FAIL-OPEN in principle, benign in fact today.** Recorded as the distinct fact it is
  rather than collapsed into "no effect".
- **Address:** the same two pins. `BANNED_CLAIM_EXEMPT_SUPPRESSED` measures **how much** prohibition
  the region lifts and `BANNED_CLAIM_EXEMPT_EXTENT` measures **how far** it reaches. Neither measures
  **where it starts**.
- **Reproduced:** R6b. A level-2 heading and a blank line inserted immediately above the exempt
  heading move the region from `headingAt = 234` to `236`, and the gate returns:

  ```
  [R6b-move-only] exit=0 premise=TRUE plant=LANDED named=0
      PIN suppressed: suppresses 14 banned-claim occurrence(s)
      PIN extent:     reaches 62 line(s), pinned at 62
  ```

  `ALL CHECKS PASSED`. Both pins unmoved. **The carve-out moved and nothing in the tree noticed.**
- **Why it is benign today:** a rigid translation carries the region's content with it, so the same 62
  lines stay exempt and the same 14 occurrences stay suppressed. A move that covered *different*
  content would change the extent or the suppressed count and would red. So the shape is currently
  content-preserving by arithmetic rather than by assertion.
- **LIVE COUNT: 0.**
- **Why it is recorded anyway:** this is the round-3 count-preserving-swallow shape (`V-29-32-01`)
  re-measured on the round-6 tree, and D-53 made it cost more than it did then, because the region is
  now the sole carve-out. A property that holds by arithmetic and not by assertion is a property the
  next editor can break without seeing it.
- **Remedy:** pin the region's position — or, better, assert the region's **content digest** rather
  than its two scalar projections, so a region covering different bytes reds regardless of which
  scalar happens to be preserved. Never relax either existing pin.

### 3.4 `V-29-47-04` — the surviving enumeration: a claim written in words the list does not contain PASSES

- **OPENED THIS ROUND as a numbered residual**, though the property itself is not new: it is what the
  module header has always declared. It is given an id here because after a deletion-shaped closure on
  two groups at once, an undeclared residual is one a reader will assume was closed.
- **Direction: FAIL-OPEN.** This is the only fail-open direction on the prohibition axis, and it is
  the whole of it.
- **Address:** `BANNED_CLAIM_LITERALS` in `scripts/check-banned-claims.ts` — **22 members across 3
  groups**, matching the statement plan 29-44 wrote at the list's own declaration
  (`scripts/check-banned-claims.ts:293`: `MEMBERS: 22, across 3 groups`;
  `:295`: `DIRECTION: FAIL-OPEN`).
- **Demonstrated, not asserted.** Five plants, each written with **none** of the 22 pinned literals,
  each exit 0 with the planted file never named — T1 through T5 in §2.3. Two of them are claims on
  groups the round widened: T3 is a **conformance** claim (`is written to a controlled-English
  standard and meets it in full`) and T4 is a **token-economy** claim (`cuts the number of tokens a
  model must read`).
- **LIVE COUNT: 0** by construction — a claim nobody has written has no occurrences. The count that
  matters is the demonstrated reachability above, not a corpus tally, and saying so is the honest form.
- **Remedy — and the one that is REFUSED.** The refused remedy is to append the five spellings above,
  which is option (b) at a third slot and buys one round. The list of WHAT IS BANNED is the
  prohibition's subject and cannot be derived away; **a prohibition with nothing enumerated forbids
  nothing.** Adding to it is an act of deciding one more thing is forbidden, and each addition needs
  its own measured false-red cost. What must never happen is a new list of WAYS OF SAYING IT.

### 3.5 `V-29-47-01` — the in-source record of `V-29-42-03` is false on five counts, and no plan of this round touched it

- **OPENED THIS ROUND.**
- **Direction: informational** — fail-CLOSED for the guard, since nothing is under-reported. The defect
  is in the module's own description of itself, which is the same class as WR-03 and IN-02, in the
  file whose subject is exactly this.
- **Address:** `scripts/check-banned-claims.ts:645-667` and the identical block in the committed twin
  `scripts/check-banned-claims.js`.
- **Byte-identical across the whole round**, so this is not something a round-6 plan broke — it is
  something every round-6 plan walked past:

  ```
  $ git show f718069:scripts/check-banned-claims.ts | sed -n '598,620p' | shasum -a 256
  cb618a74429ab9c92e33bba74f950eb15b8553aad943f4e429422ab76e4984dd  -
  $ sed -n '645,667p' scripts/check-banned-claims.ts | shasum -a 256
  cb618a74429ab9c92e33bba74f950eb15b8553aad943f4e429422ab76e4984dd  -
  ```

- **The five false statements, each with the measurement that falsifies it:**

  | # | what the block says | measured on the final tree |
  |---|---|---|
  | 1 | `That sentence is now LIVE-FALSE, with a count` | The count is **0**. Live banned-literal occurrences outside the region: 0 over 115 documents / 7380 lines. The sentence is no longer live-false. |
  | 2 | `measured over the 82-document derived scan set` | The scan set is **115** (`BANNED_CLAIM_SCAN_COUNT = 115`, moved by 29-43). |
  | 3 | `agent-factory/roles/incident-responder.md:29:103 … correct operational text carrying no benefit marker` | 29-44 rephrased that line. `grep -a -c -i "understand" agent-factory/roles/incident-responder.md` → **0**. The cited address carries no occurrence. And there are **no benefit markers** — `grep -a -c BENEFIT_VERB_MARKERS` → 0 in source, twin and harness. |
  | 4 | `This module's header states the accurate form — no pinned literal OR PINNED PAIR outside the region` | The header at `:57` reads, verbatim: `THIS GATE PROVES that no pinned literal appears outside the one named exemption region.` The phrase `pinned pair` occurs **exactly once in the whole file — at `:653`, inside the citation itself.** The block cites a wording that exists nowhere except in its own citation. |
  | 5 | `a conditional member has existed since the discipline's name was pinned` (present perfect, describing a live shape) | Conditional members: **0**. Union of member keys over all 22 members: `["group","literal"]`. Members carrying any third property: 0. Members carrying a list-valued field: 0. |

- **LIVE COUNT: 5 false statements at 1 address, in 2 files** (the `.ts` and its committed twin).
- **Why it survived:** every other stale statement in this module is marked. `:203-210` is headed
  `THE HISTORY IS RECORDED HERE BECAUSE A TYPE WITH A FIELD DELETED LOOKS LIKE A TYPE THAT NEVER HAD
  ONE` and is written in the past tense; `:271` and `:598` are dated, attributed measurement records
  over the 82-document corpus, which is the convention plan 29-46 deliberately kept for
  `generate-catalog.ts`'s two surviving numbers; `:1345` says `A CO-OCCURRENCE ARM USED TO SIT HERE`.
  **This block alone is written in the live present tense and carries no date and no marker**, so
  every grep for stale prose that the round ran passed over it.
- **Remedy:** rewrite the block as a dated CLOSURE note in the tense its siblings use — `V-29-42-03`
  is closed (§4), so the block should record what it recorded and when it stopped being true, rather
  than continue to assert it. **Not fixed here:** this plan's first prohibition forbids repairing a
  finding the adversarial pass produced, and `scripts/check-banned-claims.ts` is not in this plan's
  `files_modified`. Escalated to the next round.

### 3.6 `V-29-47-05` — `LANG-04` is marked **Complete** on the tree, against the round-5 verifier's explicit verdict

- **OPENED THIS ROUND.**
- **Direction: FAIL-OPEN on the process, not on the guard.** A requirement marked complete by the
  plans that did the work is a verdict nobody verified.
- **Address:** `.planning/REQUIREMENTS.md` — the `LANG-04` checkbox at `:82` and its traceability row
  at `:183`.
- **Measured, by walking the round's commits:**

  ```
  f718069   LANG-04=Gaps Found    LANG-07=Gaps Found
  1834f4d   LANG-04=Gaps Found    LANG-07=Gaps Found
  56ee625   LANG-04=Gaps Found    LANG-07=Gaps Found
  b97808c   LANG-04=Gaps Found    LANG-07=Gaps Found
  1a18b54   LANG-04=Gaps Found    LANG-07=Gaps Found
  f4b10ef   LANG-04=Complete      LANG-07=Gaps Found
  223df86   LANG-04=Complete      LANG-07=Gaps Found
  ```

  The single commit that touched the file across `f718069..HEAD` is `d5360dc`, plan 29-45's docs
  commit — the flip is the executor's `requirements mark-complete` step acting on each round-6
  SUMMARY's `requirements-completed: [LANG-04]` field.
- **It is the exact INVERSE of the round-5 verdict.** `29-VERIFICATION-round5.md` recommends, in terms:
  *"LANG-07 → `Complete`. LANG-04 → stays `Gaps Found`"*. The tree carries **LANG-04 Complete** and
  **LANG-07 Gaps Found**.
- **LIVE COUNT: 2** — one requirement marked complete that the verifier failed, one left as
  `Gaps Found` that the verifier passed.
- **Remedy:** the verifier sets both. **Not fixed here** — this plan's second prohibition asserts
  `.planning/REQUIREMENTS.md` byte-unchanged, and a plan correcting its own requirement's status is
  the defect, not the fix. Escalated.

### 3.7 The three window residuals — CLOSED BY CONSTRUCTION, each with its closing measurement

`V-29-42-01`, `V-29-42-02` and `V-29-42-04` are every one of them a property of a co-occurrence window
that D-53 removed outright. "The mechanism is gone, so the residual is gone" is an **argument**, and
this repository does not accept an argument in place of a measurement — so each gets a closing
measurement before it is marked closed.

**Why a measurement was taken when the conclusion was obvious:** this phase's record contains nine
false harness results, one of them produced by this very pass (§2.1), and every one was produced by
exactly the confidence that a conclusion was obvious.

#### The construct's ABSENCE, SHOWN rather than argued

Not "unused" — **absent**, on three independent axes.

```
$ for id in requiresOnSameLine BENEFIT_VERB_MARKERS CONFORMANCE_VERB_MARKERS; do … grep -a -c … ; done
requiresOnSameLine         scripts/check-banned-claims.ts         0
requiresOnSameLine         scripts/check-banned-claims.js         0
requiresOnSameLine         scripts/check-banned-claims.test.ts    0
BENEFIT_VERB_MARKERS       (all three files)                      0 / 0 / 0
CONFORMANCE_VERB_MARKERS   (all three files)                      0 / 0 / 0
```

```
members: 22
union of member keys: ["group","literal"]
members carrying ANY third property: 0
members carrying a LIST-valued field:  0
```

```ts
function lineHits(line: string): LineHit[] {
  const lower = line.toLowerCase();
  const out: LineHit[] = [];
  for (const member of BANNED_CLAIM_LITERALS) {
    for (const at of occurrences(lower, member.literal.toLowerCase())) {
      out.push({ member, at });
    }
  }
  return out;
}
```

No conditional arm, no marker parameter, no second predicate. The field is gone from the type — a
member declaring one does not compile (29-44 demonstrated TS2353 and reverted it), and a member
carrying a third property under any other name reds on 29-45's tripwire.

#### `V-29-42-01` — a claim split across a hard wrap is outside the co-occurrence window

- **The property it described:** `lineHits` is asked once per element of `text.split("\n")`, so a
  marker ending one physical line and a bare term opening the next escaped the pairing. **Direction
  was FAIL-OPEN**, reachable across 1983 of round 5's 5898 lines, 0 live.
- **Reproduction re-run (round 5's A1 and A2, both directions):**

  ```
  [REPRO-V-29-42-01-A1] exit=1 plant=LANDED named=1
      13-incident.md:46:5 — banned comprehension literal "comprehension" — "the comprehension of the model, write every step this way."
  [REPRO-V-29-42-01-A2] exit=1 plant=LANDED named=1
      13-incident.md:45:5 — banned comprehension literal "comprehension" — "The comprehension of the model is what"
  ```

  Both RED, and **each is named on the line carrying the bare term** — the marker's line plays no
  part, because there is no pairing to escape.
- **Live count of the shape, re-derived over the final 115-document corpus:** adjacent non-exempt
  lines, one carrying a historical benefit word and the other a bare term with neither carrying both —
  **0 live instances**, and the shape has no subject.
- **Status: CLOSED BY CONSTRUCTION** by plan 29-44 (D-48, extended by D-53). The fail-open it
  described is gone: the claim it let through now reds.

#### `V-29-42-02` — a markdown table row puts two cells on one physical line

- **The property it described:** two cells of one row share one physical line, so a table whose cells
  read `improve` and `comprehension for the model` reddened without any sentence making the claim.
  **Direction was FAIL-CLOSED**, 0 live.
- **Reproduction re-run (round 5's A3):**

  ```
  [REPRO-V-29-42-02-A3] exit=1 plant=LANDED named=1
      13-incident.md:48:13 — banned comprehension literal "comprehension" — "| improve | comprehension for the model |"
  ```

  Still RED — **but for a different reason.** The finding is attributed to the bare term alone at the
  cell that carries it; `improve` is inert. Measured directly: N4 plants a row carrying **only**
  `comprehension` and it reds identically.
- **Live count over the final corpus: 0.**
- **Status: CLOSED BY CONSTRUCTION** — *the residual as described* is closed, because the window it
  described does not exist. **The false-positive SURFACE it pointed at is NOT closed; it MIGRATED**
  into `V-29-44-01`'s whole-term reach and is measured there (§3.1). Recording only the first half
  would be the silent drop this file exists to prevent.

#### `V-29-42-04` — the co-occurrence condition is satisfied by text a reader would not call prose

- **The property it described:** `lineHits` receives the raw line, so a marker occurring ONLY inside an
  HTML comment or ONLY inside a link target satisfied the pairing for a term elsewhere on the line.
  **Direction was FAIL-CLOSED**, 0 live for each shape.
- **Reproductions re-run (round 5's A10 and A11):**

  ```
  [REPRO-V-29-42-04-A10] exit=1 plant=LANDED named=1
      13-incident.md:45:17 — banned comprehension literal "comprehension" — "The kit reports comprehension. <!-- improve this later -->"
  [REPRO-V-29-42-04-A11] exit=1 plant=LANDED named=1
      13-incident.md:45:5 — banned comprehension literal "comprehension" — "For comprehension, see [the note](./improve-plan.md)."
  ```

  Both RED, both attributed to the bare term; the marker in the comment and the marker in the target
  are inert. N2 and N3 confirm it directly by planting the term with no marker anywhere.
- **Live count over the final corpus: 0.**
- **Status: CLOSED BY CONSTRUCTION** — same reading as `V-29-42-02`, and the same caveat, with one
  addition measured this round: N3 shows the surface got **wider**, not narrower. Round 5 needed a
  marker inside the link target; the final tree reds on a **filename that merely contains the term**.
  That widening is `V-29-44-01`'s, recorded at §3.1.

### 3.8 `V-29-42-03` — CLOSED, and TRUE rather than vacuously true

Round 5 opened this because the exempt document's own description of the gate was a wording behind the
source's, and it was **live-false with 1 instance**. It closes on **both** sides this round, and which
side closed it matters.

- **The document's sentence, at `agent-factory/writing-profile.md:264`, byte-unchanged all round:**

  > The gate proves that no pinned literal appears outside this section; it does not prove that no
  > such claim exists.

- **The source's sentence, at `scripts/check-banned-claims.ts:57`:**

  > `THIS GATE PROVES that no pinned literal appears outside the one named exemption region.`

- **They now say the same thing.** Round 5's asymmetry was that the source claimed more — "no pinned
  literal **or pinned pair**" — because a pinned pair was a shape that existed. D-53 deleted the pair,
  so the source's own form collapsed to the document's. `git diff --exit-code f718069..HEAD -- agent-factory/writing-profile.md` exits **0**: the document was never edited. **The gap closed by the
  source coming down to the document, not by the document being brought up.**
- **The live count went 1 → 0**, because plan 29-44 rephrased
  `agent-factory/roles/incident-responder.md:29`. `grep -a -c -i "understand"` over that file: **0**.
- **TRUE, not merely VACUOUSLY true — and these are recorded as the distinct facts they are.** Round 5
  noted the sentence was *vacuously* true before plan 29-41 (the conditional member had zero unpaired
  occurrences, so the sentence happened not to be falsified). That is not this round's situation. The
  sentence is now **accurate by construction**: there is no mechanism it under-describes, because
  there is no pair. Its live count of 0 is a separate and additional fact, and it is the one that could
  change tomorrow — a future `understand` in ordinary prose would move the count to 1 without making
  the sentence inaccurate, because the sentence describes what the gate proves, not what the corpus
  contains.
- **Status: CLOSED** by plan 29-44 (D-53), with the closure resting on the mechanism rather than on
  the corpus. **But its in-source RECORD was not updated and is now false on five counts — that is
  `V-29-47-01`, §3.5.** A residual whose subject closed while its written record went on asserting the
  open state is the shape this whole file exists to catch, and it is recorded rather than smoothed
  over.

### 3.9 **WR-06** — discharged, remedy superseded; the guard clause deliberately NOT shipped

WR-06 gets a verdict in the residual sections and not only in the reconciliation table, because a
finding whose remedy silently evaporates is indistinguishable from one that was dropped.

- **The finding was CORRECT when raised.** A case named `REFUSES a conditional member declared with an
  EMPTY marker array` asserted a refusal that only the *harness* performed; the gate refused nothing.
  A member with an empty marker list would have been a prohibition matching nothing, forever,
  silently — and the invariant lived in the wrong artifact. The remedy was to move the refusal into
  `runAll()`.
- **Its remedy was overtaken by a decision that removed the invariant's SUBJECT.** D-53 removed
  `requiresOnSameLine` from `BannedClaimLiteral` entirely, so an empty-marker member is **not a shape
  the type admits**. A loop in `runAll()` guarding it has no subject and could never fire — and a gate
  that counts an unrunnable check in its PASS line is **AP-1**, the exact defect WR-06 was raised
  about, re-created by its own remedy.
- **Verdict: DISCHARGED BY DELETING THE MECHANISM. Remedy SUPERSEDED. The guard clause is deliberately
  NOT shipped.** Measured, not asserted: across the round's full commit range the diff of
  `scripts/check-banned-claims.ts` adds **zero** lines looping over a member marker list, and plan
  29-45's task 1 — the task that owned WR-06 — did not touch that module at all.
- **The successor property, named, so "superseded" is not a silent drop with better vocabulary.** The
  property WR-06 protected is *a marker mechanism cannot exist unnoticed*, and it is held now by two
  things rather than none:
  1. **The TYPE.** A member declaring an EXCESS property does not compile (TS2353, demonstrated in
     29-44 then reverted), and `noEmitOnError` is on, so that route cannot even build.
  2. **A NAMED CASE, justified by the route the compiler does NOT cover** —
     `scripts/check-banned-claims.test.ts:598`, `TRIPWIRE: every pinned member's key set is exactly
     the two declared fields, and no value is a list`. `tsc` does not refuse an editor who ADDS the
     field back to the `BannedClaimLiteral` **interface** and then declares it on a member; that is
     type-correct and every compiler check stays green. The tripwire reds on that route, because it
     reads the members' OWN KEYS rather than a spelling, and it was mutation-proven in exactly that
     direction (`npx tsc --noEmit` at exit **0** while the case reddened by name), with an
     independently derived denominator and a list-shape arm beside it.

  Measured on the final tree: union of member keys over all 22 members is `["group","literal"]`;
  members carrying any third property, **0**; members carrying a list-valued field, **0**.

---

## 4. Carried residuals — the full roll-up, in BOTH directions

A roll-up listing only what survived cannot be reconciled against the previous round's list, so **every
`V-` marker in the tree** is listed with its status after round 6 — closures, narrowings and deletions
included. **Every count in this table was produced by this round's own measurement (§3), not
transcribed from round 5.**

| id | residual | status after round 6 | live count (re-measured) | where |
|---|---|---|---|---|
| `V-29-26-01` | setext headings are invisible to the one section-extent authority | **carried, unchanged** — fail-open | 0 | `docs/audit/29-locator-unification.md` §6 |
| `V-29-26-02` | non-recursive directory reads narrow the derived scans below what their names claim | **carried, unchanged** — still live for the `-1` contract scan and `nonTestScripts()` | live, unquantified this round (subject untouched by round 6) | §6 |
| `V-29-26-03` | `FENCE_DELIMITER_LINE` is a prefix test, not an equality | **carried, unchanged** — fail-open | 0 | §6 |
| `V-29-26-04` | indented fence delimiters are classified as governed prose | **carried, unchanged** — fail-closed only by the accident that the indented delimiters pair up | **4** live lines in `README.md`, re-measured this round (`grep -a -c -E '^[[:space:]]+\`\`\`' README.md` → 4) | §6, §8 |
| `V-29-32-01` | a closed-fence, count-preserving swallow of the banned-claim exemption region | **carried, unchanged** — and it costs MORE now that D-53 makes the region the sole carve-out. Its sibling shape was re-measured this round and opened as `V-29-47-03` | 0 | plan 29-32; `BANNED_CLAIM_EXEMPT_EXTENT`'s declaration; §3.3 |
| `V-29-29-01` | the duplicated `sectionBody` — a third section-extent grammar | **closed in round 4** by plan 29-35 | — | `29-locator-unification.md` §9.3b |
| `V-29-35-01` | a private `parseFrontmatter` beside the exported authority | **closed in round 5** by plan 29-40 | — | §9.3c |
| `V-29-42-01` | a claim split across a hard wrap escapes the co-occurrence window | **CLOSED BY CONSTRUCTION by plan 29-44** (D-48/D-53) — the window it described does not exist. Construct absence SHOWN (§3.7); reproductions A1 and A2 re-run and both now RED by name | 0 — and the shape has no subject | §3.7 |
| `V-29-42-02` | a markdown table row puts two cells on one physical line | **CLOSED BY CONSTRUCTION by plan 29-44** — as described. **The false-positive SURFACE it pointed at MIGRATED into `V-29-44-01`** and is measured there; recording only the closure would be a silent drop | 0 | §3.7, §3.1 |
| `V-29-42-03` | the exempt document's own description of this gate is behind the source's | **CLOSED by plan 29-44** — and **TRUE, not vacuously true**: the gap closed by the SOURCE coming down to the document (D-53 deleted the pinned pair), not by the document being edited. `agent-factory/writing-profile.md` is byte-unchanged for the whole round | **1 → 0** (`incident-responder.md:29` rephrased; `grep -a -c -i understand` → 0) | §3.8 |
| `V-29-42-04` | a marker inside an HTML comment or a link target satisfies co-occurrence | **CLOSED BY CONSTRUCTION by plan 29-44** — as described. Same migration caveat as `-02`, and the surface got **wider**: a filename merely containing the term now reds (N3) | 0 | §3.7, §3.1 |
| `V-29-44-01` | the widened bare terms are a false-red surface over the whole of ordinary English | **OPENED IN 29-44, and its REACH MEASURED FOR THE FIRST TIME THIS ROUND** — fail-closed. Six plants: plural, gerund, negated, compounded, and two inside-a-longer-word forms, all RED by name | **0** live over 115 documents / 7380 lines | §3.1; source `scripts/check-banned-claims.ts:459`, `:578` |
| `V-29-47-01` | the in-source record of `V-29-42-03` is false on five counts and byte-unchanged all round | **OPENED THIS ROUND** — informational; not fixed here | **5** false statements at 1 address, in 2 files | §3.5 |
| `V-29-47-02` | the sole carve-out is unbounded at the bottom; `endBefore === lines.length` | **OPENED THIS ROUND** — fail-OPEN through the re-pin protocol | 0 | §3.2 |
| `V-29-47-03` | the region's POSITION is pinned by nothing; a rigid translation moves it silently | **OPENED THIS ROUND** — fail-open in principle, benign by arithmetic today | 0 | §3.3 |
| `V-29-47-04` | the surviving enumeration: a claim in words the list does not contain PASSES | **OPENED THIS ROUND as a numbered residual** (the property itself is not new) — fail-OPEN, demonstrated by five plants | 0 by construction; reachability demonstrated | §3.4 |
| `V-29-47-05` | `LANG-04` is marked **Complete** on the tree against the round-5 verifier's explicit verdict | **OPENED THIS ROUND** — process, fail-open; not fixed here | **2** (one wrongly Complete, one wrongly Gaps Found) | §3.6 |

### 4.1 Residuals carried from the round-6 SUMMARYs, not `V-`-numbered

| id | residual | status after round 6 | live count |
|---|---|---|---|
| 29-44 **R1** | 30 disposition rows can never match, because their `file` cell is a code span — `rowMatches()` compares `row.file !== c.file` with no backtick stripping | **carried, open** — fail-CLOSED. This plan authored no disposition row and could not have tripped it | **30**, re-measured this round: 1534 rows read under `## Dispositions` across the directory, 30 code-span `file` cells, all in `docs/audit/29-style-dispositions/29-12.md` |
| 29-43 **R2** | `CHANGELOG.md:67` still reads `sharper-per-token` — outside `BANNED_CLAIM_LITERALS`, so the gate does not flag it | **carried, unmoved** — fail-open. Re-confirmed live at HEAD (`grep -a -n` → line 67) | **1** |
| 29-45 **R4** | nothing in this repository catches an unmeasured assertion about an EXTERNAL tool's behaviour. `check-nul-bytes.ts`'s header asserted git's binary heuristic is NUL-based; it is a ratio heuristic counting BACKSPACE and ESCAPE as printable, and the claim was believed for two phases | **carried, class OPEN** — informational. The one instance is corrected; **no mechanism exists** | 0 instances in that module; the class is unbounded |
| 29-46 **R1** | the acceptance grep `0*15` is a substring pattern, not a cardinality predicate — it over-matches document identifiers and byte offsets | **carried** — fail-CLOSED (an over-matcher cannot let a stale range through), but it forces edits a plan elsewhere forbids | **0** after 29-46 |
| 29-46 **R2** | nothing reds if two workflows declare the same `order`; the catalog would silently publish them in `readdirSync` order | **carried, open** — fail-open | **0**, re-measured this round: 19 workflows declare `order`, **0 duplicate values** |

### 4.2 The net movement, stated plainly rather than as progress

**Closed this round: six** — `V-29-42-01`, `-02`, `-04` (by construction), `V-29-42-03` (by
mechanism), plus round-5's two blockers CR-01 and CR-02 and the conformance-verb axis D-53 extended
into. **Opened this round: five** — `V-29-47-01` through `-05`.

Round 5's own movement was net **+3** and its record asked the next round to read that as *the output
of having looked*. Round 6's is net **−1** on the `V-` register, and the honest reading is narrower
than it sounds: **three of the six closures are one deletion**, and two of those three closed *as
described* while the false-positive surface they pointed at migrated into `V-29-44-01` rather than
vanishing. What genuinely closed is the **fail-OPEN** half — the axis on which a real claim could be
written and the gate stayed green. Every residual left open on the prohibition axis except
`V-29-47-04` is fail-CLOSED.

The five newly opened items are also the output of having looked, and **two of them
(`V-29-47-02`, `-03`) exist only because D-53 made the exemption region the sole carve-out** — this
round's own change created the surface this round's own pass then found. That is what naming the
degrees of freedom before attacking is for.

---

## 5. The LANG-08 override, repeated rather than paraphrased

Repeated **verbatim** from `29-VERIFICATION.md`'s `overrides:` frontmatter, byte-identical to the
quotation in `docs/audit/29-round5-residuals.md` §5 (both blocks extracted and hashed:
`7cc139860131a159f99869f532c65c9e069b06d03d5551260e33476431666624`), because a paraphrased override is
a second version of a decision.

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

**The prohibition half held through every plan of round 6, and that is a MEASUREMENT rather than an
assurance.** Range `f718069..HEAD` (16 commits).

| check | method | result |
|---|---|---|
| the ceiling table itself | `roleCeiling()`'s function body extracted from `scripts/check-foundation-guards.ts` at `f718069` and at `HEAD` and hashed | **byte-identical**, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7`, 1967 B at both ends — and the **same hash rounds 4 and 5 recorded**, so the table has not moved across three rounds |
| files under a ceiling | `git diff --name-only f718069..HEAD -- agent-factory/` | **exactly one**: `agent-factory/roles/incident-responder.md`, edited by plan 29-44 |
| that one file against its ceiling | `roleCeiling("incident-responder.md")` = `"3802 3598"` (FAIL / WARN) | **3481 B → 3485 B.** +4 B, consuming 4 of 113 B of headroom to WARN and 317 B to FAIL. **Neither ceiling approached; neither moved.** |
| the exempt document | `git diff --exit-code f718069..HEAD -- agent-factory/writing-profile.md` | **exit 0** — unedited for the whole round, which is also `V-29-42-03`'s and `V-29-47-02`'s disposition |

Round 5's record could say "**0** files under a ceiling". **Round 6 cannot and does not** — one role
file was edited, so the byte count is stated against the ceiling instead. No ceiling was raised,
lowered or re-baselined by any plan of round 6. Plans checked: `29-43`, `29-44`, `29-45`, `29-46`,
`29-47`.

**Supply chain, at round scope, as asserted absence.** `git diff --exit-code f718069..HEAD --
package.json package-lock.json` exits **0**: byte-unchanged across the round's full commit range. No
package was installed by any plan of round 6, and `RESEARCH.md` carries no new package row for this
round, so no legitimacy checkpoint was required.

---

## 6. Probe coverage — the arithmetic, its equality, and a disagreement recorded

**Total probe items surfaced: 22** — LANG-01 4, LANG-02 1, LANG-03 4, LANG-04 2, LANG-05 3, LANG-06 3,
LANG-07 1, LANG-08 4. The spec-less edge-probe fallback applies (Phase 29 has no SPEC file;
`EDGE_ABSENT=1`, `PROHIB_ABSENT=1`).

| disposition | count | items |
|---|---|---|
| **authored** into `must_haves.truths` | **2** | LANG-04 `empty` and LANG-04 `encoding`, both `verification: explicit`, authored in plan `29-41`, discharged in `29-42`. **Both were subsequently RETIRED with their properties recorded** — the `empty` edge's subject (an empty marker array) is a shape D-53 removed from the type, which is WR-06's disposition at §3.9; the `encoding` edge survives as the CRLF and case arms and is re-covered this round by DOF-1/DOF-2 |
| **flagged** assumption — in scope, unclassified | **1** | LANG-07 `unclassified`. **Never auto-dismissed** — an `unclassified` row stays `unresolved` by rule. Plan `29-40` read it as the byte-equality question and answered that question WITHOUT claiming the row resolved. **Still unresolved entering round 7**, and `LANG-07` is `Gaps Found` on the tree despite the round-5 verifier recommending `Complete` — see `V-29-47-05` |
| **flagged** assumption — out of scope this round | **19** | LANG-01 4, LANG-02 1, LANG-03 4, LANG-05 3, LANG-06 3, LANG-08 4. These belong to work executed across plans `29-01`..`29-39`; round 6's scope is exactly the two failed truths and the twelve findings of round 5. Naming each dropped requirement id with its item count is what keeps this from being a silent drop |

**No-silent-drop equality: 2 authored + 20 flagged = 22 surfaced.** ✓

### 6.1 The derivation source, and why this round could not re-derive from a live file

The plan directs the arithmetic to be **derived rather than transcribed**, on the strength of round 5's
own §6 catch where the orchestrator's predicted row count disagreed with the file and **the file won**.
Applying the same discipline to this round produces a finding rather than a fresh derivation:

- **No round-6 plan carries a `probe_coverage` block.** Measured: `grep -c probe_coverage` over
  `29-43-PLAN.md` … `29-47-PLAN.md` returns **0** for all five.
- **The only committed derivation is plan `29-40`'s block**, and that block names its own source as
  `/tmp/coverage29.json`, read directly rather than from an orchestrator excerpt.
- **`.planning/phases/29-.../COVERAGE.md` is not the probe register.** It is the API-integration
  coverage file and its entire content is one sentence: *"No external API integration: Phase 29
  rewrites markdown kit prose and adds four build-time guards using Node stdlib only; nothing in scope
  calls a network service, SDK, or external endpoint."* It carries no probe rows and cannot produce
  this arithmetic.

**So the total above is carried from plan `29-40`'s committed block and is labelled as carried, not as
re-derived.** What IS independently derivable was derived: the eight `LANG-` requirement ids all exist
in `.planning/REQUIREMENTS.md`'s Phase 29 mapping (`| 29 | Controlled Language & Voice Guard Rebuild |
LANG-01..08 | 8 |`), with no orphan and no missing id. **The one disagreement this derivation found is
recorded as `V-29-47-05` (§3.6): the traceability rows for `LANG-04` and `LANG-07` are the exact
inverse of the round-5 verifier's stated verdict.**

---

## 7. The honest close

**A green suite is not proof for a safety invariant in this repository.** That is not modesty; it is
this phase's measured record. Nine false harness results now — six across four consecutive rounds, a
seventh inside round 5's own acceptance checks, an eighth inside plan 29-43, and a ninth **inside this
round's own adversarial pass** (§2.1), which would have published a fail-open bypass of the sole
carve-out that does not exist.

### What round 6 CAN honestly claim

- **The corpus the PASS line describes is the corpus it reads.** 82 → 115 documents, every entrant
  named, each pin value read off the gate's own refusal text rather than computed by hand. Four
  entrants planted on the final tree and all four RED by name; two excluded classes planted and both
  correctly silent. Zero markdown classes sit outside the gate without a written decision.
- **NEITHER prohibition enumerates anything about HOW a claim is phrased, on either group.** Both
  marker lists are deleted, `lineHits`'s conditional arm and the PASS line's conditional clause with
  them, and the field is gone from the TYPE — so restoring a marker list is a compile error, not a
  one-line addition. Conditional members **3 → 0**.
- **The gate's whole predicate is a pinned literal list plus one named exemption region.**
- **Nine sentences that passed at exit 0 with the planted file never named now red by name at
  `file:line:column`**, and the movement is measured on the same harness in both directions with an
  unmoved control (§2.4).
- **The one real false red the widening created was paid in PROSE, not by weakening the matcher** —
  4 bytes in `agent-factory/roles/incident-responder.md`, with the three forbidden weakenings still
  forbidden and the forbidden-alternative paragraph hashed byte-identical.
- **The exemption region survived eleven attempts.** Its top edge discriminates at one line's
  resolution (R3 vs R1); it cannot be destroyed silently (R5) or duplicated silently (R9); a section
  appended inside it moves both pins (R4, R7); and text after a new level-2 heading is correctly
  outside it (R8).
- **A legal denial inside the region is still writable and still silent** — `0 findings over 115/115
  elements` on a line naming the standard, the discipline and the comprehension topic in order to deny
  claims about all three.
- **Every finding of round 5 is accounted for by name**, including the one whose remedy was superseded
  and the one that never had an id.

### What round 6 does **NOT** claim

**Term membership first, because a round that closed a defect by DELETION on two groups at once is the
round most likely to be read as having closed the CLASS.**

1. **The surviving enumeration is `BANNED_CLAIM_LITERALS` itself — 22 members across 3 groups,
   direction FAIL-OPEN — and a claim written in words it does not contain PASSES THIS GATE.** This is
   demonstrated, not asserted: five real claims were planted on the final tree and all five exited 0
   with the planted file never named (§2.3, DOF-4), and two of them are claims on groups this round
   widened — a conformance claim (`is written to a controlled-English standard and meets it in full`)
   and a token-economy claim (`cuts the number of tokens a model must read`). The list of WHAT IS
   BANNED is the prohibition's own subject and cannot be derived away; a prohibition with nothing
   enumerated forbids nothing. **What changed is which KIND of list is load-bearing, not that the
   gate stopped having one.** Carried as `V-29-47-04`.
2. **The region attacks established the boundary's LOCATION, not its STABILITY.** Ten of eleven
   attempts behaved correctly and loudly. The eleventh did not: **the region can be moved by a rigid
   translation with neither pin noticing** (`V-29-47-03`), and **the region has no bottom boundary at
   all** — `endBefore === lines.length`, so anything appended to `agent-factory/writing-profile.md`
   lands inside the sole carve-out, backstopped only by two pins whose own refusal text instructs the
   author to move them (`V-29-47-02`). Before D-53 a claim in that position would also have needed a
   marker; now the region is the only thing standing there.
3. **That the false-positive surface shrank.** It did not. `V-29-42-02` and `V-29-42-04` closed *as
   described*, and the surface they pointed at MIGRATED into `V-29-44-01`, where this round measured
   it for the first time: the plural, the gerund, the **negated** form, the **compounded** form, two
   **inside-a-longer-word** forms, an HTML comment, a table cell and — newly — a **filename in a link
   target** all red on ordinary English making no claim whatever.
4. **That the module's own prose is true.** `V-29-47-01`: the in-source record of `V-29-42-03` is false
   on five counts, byte-unchanged across all sixteen commits of this round, and every stale-prose grep
   the round ran passed over it because it is the one such block written in the live present tense
   with no date and no marker.
5. **That the five items in §3.1–§3.6 are closed.** They are **open, named, counted, and
   directional**. This file lists what was decided; it does not claim nothing remains.

### Requirements

**No requirement is re-marked complete by this record**, and plan `29-47` asserts
`.planning/REQUIREMENTS.md` byte-unchanged. `LANG-04`'s verdict belongs to the verifier, not to the
plans that did the work — which is precisely why `V-29-47-05` records that the tree already carries
`LANG-04` as **Complete** and `LANG-07` as **Gaps Found**, the exact inverse of the round-5 verifier's
stated recommendation, set by plan 29-45's docs commit `d5360dc` and not by any verification.
