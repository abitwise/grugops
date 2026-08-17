# Gap-closure round 4 — what was closed, what was deferred, and by whose decision

A verification round reads source and committed artifacts. It does not read the planning
conversation. So a finding that was deliberately placed out of scope, and whose reasoning lives only
in that conversation, is indistinguishable at the next round from a finding nobody noticed — and the
round after that records it as a silent drop. This file exists so that the four findings round 4
deferred read as **decisions**.

It is a record of what was decided. It is not a claim that nothing remains.

**Round:** gap-closure round 4, phase 29 (controlled-language-voice-guard-rebuild)
**Review:** `.planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md`, round 4,
reviewed 2026-08-16T04:55:00Z, diff base `3c40d0e`, 13 findings (1 critical, 8 warning, 4 info)
**Plans:** `29-33` through `29-39`, commits `57affa1..490e3c9`
**Written by:** plan 29-39, 2026-08-16
**Round-6 provenance note (plan 29-46, IN-04, 2026-08-17):** §3's `V-29-35-01` row was reshaped so
that its `residual` cell reads as a SUBJECT and its `status` cell carries both directions, matching
the shape `docs/audit/29-round5-residuals.md` §4 already uses for the same id — three documents, one
convention. **Both facts are retained: opened in round 4 by plan 29-35, closed in round 5 by plan
29-40**, together with the measurement and the out-of-scope-at-the-time disposition, which now live in
that row's `status after round 4` cell. No other row, cell or line in this file changed.

---

## 1. The round-4 disposition table

Thirteen findings, thirteen rows. Every finding is either closed by a named plan with an evidence
pointer, or deferred by a named decision.

| id | subject | disposition | plan | evidence |
|---|---|---|---|---|
| **CR-01** | `SEC_VOICE_FILES` pinned by CARDINALITY where MEMBERSHIP is meant — a security surface can be substituted out of `guard_voice` with the gate green | **closed** | 29-33 | `SEC_VOICE_MEMBERS` two-sided declared roster + a per-member derived-property floor + a SUBSTITUTION arm beside ADD and REMOVE in the falsifiability probe (`scripts/check-foundation-guards.test.ts`); §4 transcript below |
| **WR-01** | the `-1` contract classifier accepts a comparison that does nothing (`if (at === -1) { }`) | **closed** | 29-36 | the classifier now requires the guarded branch to LEAVE THE SCOPE, proven by a third plant (`guarded-but-inert`); blind-spot list corrected in both directions; §4 |
| **WR-02** | `readRegistry`'s "three numbers must agree" refusal is a tautology (`\|re ∧ ¬flags\| = \|re\| − \|re ∧ flags\|` by set algebra) | **closed** | 29-37 | the tautology DELETED and replaced by `canonicalClaimHeadingCensus`, a witness differing in KIND (a different recogniser AND a different traversal); the unfalsifiability was MEASURED over a 21-shape corpus rather than argued; §4 |
| **WR-03** | `REACH_FLOORS.I5` measures 5× wider than the invariant it exists to make reachable | **closed** | 29-36 | `REACH.I5` restated from I5's own predicate, naming no locator's answer; the floor moved 1800 → **720**, not to 360 as the review projected — the old set was wrong in BOTH directions and the errors partly cancelled; §4 |
| **WR-04** | `guard_voice`'s element floor carries a dead disjunct, and its paired test assertion cannot fail (`"".split("\n")` is `[""]`, never `[]`) | **closed** | 29-34 | the dead disjunct dropped and the floor worded as the condition that can occur; the vacuous line-count assertion replaced by a non-blank line count; §4 |
| **WR-05** | `guard_voice` publishes a per-file scanned line count and pins nothing about it — a vacuity floor catches an EMPTY denominator but never a SILENTLY SHORT one | **closed** | 29-34 | the reader publishes `outsideLines`/`removedLines` as counts of INDICES, `guard_voice` reconciles against them through three named refusals, and the remaining half is measured, bounded and DISCLOSED BY NAME as `VOICE_REMAINDER_RESIDUAL`, pinned against the guard source (commit `0e150a2`); §4 |
| **WR-06** | `WP-04`'s published row was narrowed to `## Steps` but is not held by the two-artifact pin | **closed** | 29-38 | `WP-04`'s decidable half added as pin members `gate/wp04` and `profile/wp04`, keyed on the anchor sentence, spelled as a constant in `check-imperative-lexicon.ts`, emitted in the sentence-form refusal; the four-mutation probe extended to six; §4 |
| **WR-07** | six exact-equality census pins over the whole test corpus red on every unrelated test edit | **closed** | **29-39** | the five values MEASURED to drift converted to relationships and corpus-derived RATE floors under ONE authority; the two vacuity pins kept EXACT with the reason at the declaration; the exact volumes relocated behind the commit-pinned case; cost paragraph written; discrimination proven end-to-end (§3, and 29-39-SUMMARY.md) |
| **WR-08** | `V-29-29-01`'s escalation understates the finding — the duplicated `sectionBody` is level-blind as well as fence-blind, and it feeds the generated adapters | **closed — folded into the LANG-07 closure** | 29-35 | **not unaddressed.** WR-08 asked for §9.3 of `docs/audit/29-locator-unification.md` to be amended to name BOTH axes and the consumer; §9.3a does that and §9.3b records the closure. The repair itself went further than the amendment: both copies of the third grammar were DELETED and both generators now consume the one section locator, with the generated adapters byte-identical across the change. Four permanent cases, two per generator, hold the fence axis and the level axis |
| **IN-01** | the scan-scope shortfall case asserts an identity, not a shortfall | **DEFERRED BY USER DECISION** | — | §2.1 |
| **IN-02** | the claim-heading recogniser matches every single-token level-three heading | **DEFERRED BY USER DECISION** | — | §2.2, and the source note plan 29-37 left at `scripts/audit-model.ts:922-929` |
| **IN-03** | the pass line computes the registry residue a third way | **DEFERRED BY USER DECISION** | — | §2.3 |
| **IN-04** | `headingShapedFenced` is published but never asserted | **DEFERRED BY USER DECISION** | — | §2.4, and the source note plan 29-37 left at `scripts/audit-model.ts:1152-1157` |

**Nine closed, four deferred. Thirteen accounted for, none dropped.**

---

## 2. The four deferrals, in full

The user decided this round's scope explicitly and placed all four of these findings outside it.
Each entry below states the finding, where it lives on **today's** tree, what the risk is if it is
never closed, and whether it is live or latent.

**A note on the line numbers.** The review cites line ranges measured against `3c40d0e`. Several
have drifted, because the plans of this round edited the same modules. Every site below is located
by its **code** and the line number is re-measured on today's tree — the review's cited range is
kept beside it so the two records reconcile. Addressing a site by its coordinates rather than by its
code is itself a recorded defect of this phase (`deferred-items.md` § D-38-2).

### 2.1 IN-01 — the scan-scope shortfall case asserts an identity, not a shortfall

**Where:** `scripts/frontmatter.test.ts:15776` (review cited `:15496-15517`), the assertion
`expect(unread.length).toBe(tracked.length - read.length)`.

**The finding.** That equality follows from `read.every(p => tracked.includes(p))`, asserted three
lines above, for any duplicate-free `read`. Nothing about the shortfall is pinned — not its size,
not its membership. A consumer of the locator appearing in `hooks/`, `install/` or
`scripts/runnable-ref/` changes no assertion here. The case name promises a re-measurement the
assertion does not deliver.

**Risk if never closed.** The disclosed scan-scope shortfall grows silently. A new unread consumer
of the section locator produces a longer failure message rather than a red, so the one mechanism
that would announce "this scan no longer covers what its name says" stays quiet. This is the
claim-wider-than-its-assertion class, which is the class this phase has spent four rounds removing.

**Live or latent.** Latent as a defect, live as a gap: the identity is true today and will remain
true; what is missing is any assertion that would fire.

**Disposition.** DEFERRED BY USER DECISION for round 4. This is neither a closure nor a drop. Closing
it is one change — pin `unread` against a declared sorted roster, or pin `unread.length` against a
declared number — and it was placed out of this round's scope by the user's explicit scoping
decision, not by an executor's judgement.

### 2.2 IN-02 — the claim-heading recogniser matches every single-token level-three heading

**Where:** `scripts/audit-model.ts:930`, `const CLAIM_HEADING_RE = /^###\s+(\S+)\s*$/` (review cited
`:1288-1303`; the constant moved when 29-37 restructured the module).

**The finding.** The pattern matches `### Steps`, `### Attribution`, `### Notes` — every
single-token level-three heading, not only a canonical `C-28-NNN` id. A claim whose verbatim quotes
such a heading is refused as a SWALLOWED claim heading. Fail-closed, and 0 live.

**Risk if never closed.** A false red on legitimate content: an `architecture` claim that quotes a
level-three heading inside its verbatim block cannot be committed. The failure direction is safe,
but a guard that refuses correct text trains its maintainer to widen it, which is how a safe
direction becomes an unsafe one.

**Live or latent.** Latent — 0 live occurrences.

**Plan 29-37 touched this module and deliberately did not fix it.** The source note is at
`scripts/audit-model.ts:922-929` and is confirmed present by reading. It records that narrowing the
pattern would change WHICH blocks the registry parses, while 29-37 was scoped to change what is
CHECKED and nothing about what is parsed, and that the pattern is byte-unchanged by that plan. This
file and that note agree.

**Disposition.** DEFERRED BY USER DECISION for round 4. Neither closed nor forgotten.

### 2.3 IN-03 — the pass line computes the registry residue a third way

**Where:** `scripts/check-diff-disposition.ts:1703`,
`const registryResidueSize = residue.filter((f) => f !== PROTOCOL_FILE).length`, consumed at `:1710`
and `:1712` (review cited `:1703-1713` — unmoved).

**The finding.** This is a third expression for a quantity `registryResidue` already holds. The
three agree only because the `unvouched` and `PROTOCOL_FILE`-present arms returned early.

**Risk if never closed.** If `PROTOCOL_FILE` ever also hosted a `kind: safety` claim, the published
identity `derivedKit + registryResidueSize + 1 = watched.length` would be off by one **while every
assertion passed** — a printed sum that is a description rather than a measurement, which is the
exact sentence this block was written to replace.

**Live or latent.** Latent, and conditional: it requires `PROTOCOL_FILE` to acquire a `kind: safety`
claim, which nothing today does.

**Disposition.** DEFERRED BY USER DECISION for round 4. Closing it is one substitution — reuse
`registryResidue.length` — and it was placed out of scope rather than taken.

### 2.4 IN-04 — `headingShapedFenced` is published but never asserted

**Where:** `scripts/audit-model.ts:1158-1161` (the tally) and `scripts/check-claim-anchors.ts:153`,
`:158`, `:416` (published, not asserted; review cited `audit-model.ts:1052-1064` and
`check-claim-anchors.ts:412-421`).

**The finding.** Hiding one real claim heading inside a fence yields a silently shorter claim list.
`check-claim-anchors` prints both numbers and asserts neither. The only thing that reds is
`CLAIM_KIND_CARDINALITY`'s sum in `check-audit-register` — a different gate, a hand-declared number,
and a message about kind distribution rather than about a fenced heading.

**Risk if never closed.** The fence-hidden-claim signal lives one gate away from the number that
would show it, so the refusal a reader meets does not describe the defect they have. A published
figure with no assertion beside it is a number that reads as evidence.

**Live or latent.** Latent — `headingShapedFenced` is 1 on the live tree and that one is genuine
documentation.

**Plan 29-37 touched this module and deliberately did not fix it.** The source note is at
`scripts/audit-model.ts:1152-1157` and is confirmed present by reading. It records the deferral and
adds the reason the obvious repair was refused: newly asserting this figure somewhere else would
**shut a deferred finding silently**. That note and this file agree.

**Disposition.** DEFERRED BY USER DECISION for round 4. Neither closed nor forgotten.

---

## 3. Carried residuals — the full roll-up, including what moved

A roll-up that lists only what survived cannot be reconciled against the previous round's list. Both
directions are recorded: the one this round CLOSED and the one this round OPENED.

| id | residual | status after round 4 | where |
|---|---|---|---|
| `V-29-26-01` | setext headings are invisible to the one section-extent authority | **carried, re-confirmed** — fail-open, 0 live | `docs/audit/29-locator-unification.md` §6 |
| `V-29-26-02` | non-recursive directory reads narrow the derived scans below what their names claim | **carried, narrowed** — 29-29 closed the owner scan; still live for the `-1` contract scan and `nonTestScripts()` | §6 |
| `V-29-26-03` | `FENCE_DELIMITER_LINE` is a prefix test, not an equality | **carried, re-confirmed** — fail-open, 0 live | §6 |
| `V-29-26-04` | indented fence delimiters are classified as governed prose | **carried, re-confirmed** — fail-closed only by the accident that the indented delimiters pair up; the round-4 review re-measured **4 live lines in `README.md`** (round 2 measured 6; the two figures are separate measurements at separate times, not a contradiction) | §6, §8 |
| `V-29-32-01` | a closed-fence, count-preserving swallow of the banned-claim exemption region | **carried, re-confirmed** | plan 29-32 |
| `V-29-29-01` | the duplicated `sectionBody` — a third section-extent grammar, fence-blind AND level-blind, feeding the generated Claude Code adapters and the catalogue | **CLOSED THIS ROUND by plan 29-35** — both copies deleted, both generators routed through the one authority, generated adapters byte-identical across the change | `docs/audit/29-locator-unification.md` §9.3b |
| `V-29-35-01` | a private `parseFrontmatter` in `scripts/generate-catalog.ts` beside the exported authority | **OPENED THIS ROUND by plan 29-35** — measured at **0 key-set differences over 36 governed documents**; recorded, NOT fixed; out of scope by the same user decision that deferred IN-01..IN-04. **CLOSED IN ROUND 5 by plan 29-40** — the private declaration deleted, the module routed through the exported authority, `docs/catalog/README.md` proven byte-identical, and a derived NAME-scoped owner tripwire added so a third copy reds the day it lands | `docs/audit/29-locator-unification.md` §9.3c |

**The net movement of the residual set across round 4 is zero: one closed, one opened.** That is
stated plainly because a round that closes a duplicated grammar and opens a duplicated parser has
not reduced the number of duplicated authorities in the tree — it has moved the duplication one
level down. The next round should read that as the finding it is.

**Round-5 addendum — the round-4 sentence above was acted on rather than merely read.** Round 5's UAT
put `V-29-35-01`'s disposition back to the human (test 1, decided 2026-08-17), because round 4's
out-of-scope horizon was the ROUND and not the PHASE. The decision of record is **(b) SCHEDULE ITS
CLOSURE**, filed as gap **G-29-1** and executed by plan **29-40**. So the net movement across rounds 4
and 5 together is **one duplicated authority removed**, not moved. The closure record, its byte
evidence and the tripwire's disclosed NAME-scoped bound are in
`docs/audit/29-locator-unification.md` §9.3c under "CLOSURE — plan 29-40, round 5"; the round-4
escalation text there is retained verbatim above it.

Round 5 also recorded, in the same place, the reason no assertion in this repository had said the
duplicate was there: **a duplicate declared LOCALLY is invisible to an IMPORTED-SYMBOL pin**, because
the module imports nothing to be pinned, and the section-extent owner scan could not see it either
because the duplicate answered a different predicate. That gap — not the duplicate itself — is what
the new derived owner tripwire closes.

Two further items are logged as executor-level deferrals in
`.planning/phases/29-controlled-language-voice-guard-rebuild/deferred-items.md` and are not re-argued
here: **D-38-1** (`FORM_REMEDY` spells the procedural bound as a literal `20` beside the constant
that owns it) and **D-38-2** (`docs/audit/29-locator-unification.md:34` cites three stale line
numbers). **D-38-3** is a workflow finding rather than a code one and is restated in §6 because it
bit this round twice.

---

## 4. The LANG-08 override, repeated rather than paraphrased

Repeated verbatim from `29-VERIFICATION.md`'s frontmatter, because a paraphrased override is a
second version of a decision.

> **must_have:** "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <=
> previous, delta recorded, never raised mid-phase"
>
> **reason:** "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline):
> re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom
> into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is
> recorded; only the re-baseline action itself was deferred, by choice, not by omission. Carried
> unchanged through rounds 1, 2 and 3 — not new work this round."
>
> **accepted_by:** "Olger Oeselg"
> **accepted_at:** "2026-08-15T09:57:04Z"

**The prohibition half held through every plan of round 4, and that is a measurement rather than an
assurance.**

| check | method | result |
|---|---|---|
| the ceiling table itself | `roleCeiling()`'s function body extracted from `scripts/check-foundation-guards.ts` at `57affa1^` and at `HEAD` and hashed | **byte-identical**, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7` at both ends |
| files under a ceiling | `git diff --name-only 57affa1^..HEAD -- agent-factory/roles/` | **0 files.** `guard_role_size` applies to the derived role corpus; no plan of this round touched a role document |
| the one `agent-factory/` file touched | `agent-factory/writing-profile.md`, by plans 29-31 and 29-38 (16833 B → 17961 B) | **not under a ceiling** — it is not a role file and `roleCeiling()` has no entry for it, so its growth is not a ceiling event and no ceiling was raised to accommodate it |

No ceiling was raised, lowered, or re-baselined by any plan of round 4.

---

## 5. Probe coverage — the arithmetic and its equality

Restated from plan 29-33's `probe_coverage` block so this artifact is readable alone. The spec-less
edge probe surfaced **22** applicable edges across LANG-01..LANG-08, all `unresolved` at the start of
the round.

| requirement | edges | disposition |
|---|---|---|
| LANG-01 | 4 (adjacency, empty, encoding, ordering) | attributed — held by executed plans 29-02 / 29-03 must_haves |
| LANG-02 | 1 (unclassified) | **flagged planner assumption** — never auto-dismissed |
| LANG-03 | 4 (adjacency, empty, encoding, ordering) | authored into plan 29-37's must_haves; 29-37 decided all four by cases |
| LANG-04 | 2 (empty, encoding) | authored into plan 29-38's must_haves |
| LANG-05 | 3 (adjacency, empty, ordering) | attributed — held by executed plans 29-05 / 29-06 / 29-07 must_haves |
| LANG-06 | 3 (adjacency, empty, ordering) | authored — adjacency and ordering into plan 29-33, empty into plan 29-34 |
| LANG-07 | 1 (unclassified) | **flagged planner assumption** |
| LANG-08 | 4 (adjacency, empty, ordering, concurrency) | attributed — held by executed plans 29-13 / 29-19 must_haves; the re-baseline itself sits under the §4 override |

**No-silent-drop equality:**

```
22 surfaced
 = 9 authored into this round's plans   (LANG-03 4 + LANG-04 2 + LANG-06 3)
 + 11 attributed to already-executed plans (LANG-01 4 + LANG-05 3 + LANG-08 4)
 + 2 flagged planner assumptions        (LANG-02 unclassified, LANG-07 unclassified)

9 + 11 + 2 = 22.   Zero dropped.
```

**The two unclassified edges and their assumptions, stated so a reader can challenge them.** Both
are planner assumptions, both unverified by a probe, and both are recorded here rather than counted
as resolved:

1. **LANG-02.** The probe returned "unclassified — review manually". The assumption: the surface
   split between governed procedural documents and the excluded fenced caveman blocks is already
   decided mechanically by the derived governed corpus (47 documents in 4 derived parts, roles
   named-excluded), and this round adds no new surface, so no new edge case is introduced.
2. **LANG-07.** Likewise unclassified. The assumption: the edge the probe could not classify is the
   one plans 29-35 and 29-36 address directly (a third grammar over the same bytes), so it is
   covered by named work rather than by an authored edge. **This assumption is now partly
   falsified** — 29-35 closed the third grammar and opened `V-29-35-01`, a private frontmatter
   parser one level down. The assumption said the edge was covered by named work; the named work
   found another instance of the same class. Recorded here rather than quietly left standing.
   **Round-5 update:** `V-29-35-01` is now closed by plan 29-40, so the named work did eventually
   reach it — one round later than the assumption implied, which is the part that was falsified.

---

## 6. The honest close

**A green suite is not proof for a safety invariant in this repository.** That sentence is this
phase's most expensive lesson and it is repeated here rather than assumed. Four of round 4's own
plans found that the fix their own plan prescribed was wrong or misplaced, and each found it by
measuring rather than by reading. The suite was green before each of those measurements.

Three things this record deliberately does not claim:

1. **It does not claim the round found everything.** Round 4 raised 13 findings against a tree whose
   suite was green and whose seven gates all exited 0. There is no reason to believe round 5 will
   raise zero.
2. **It does not claim the deferred four are harmless.** Each is fail-closed or latent today. That
   is a measured property of today's tree, not a property of the code.
3. **It does not claim the residual set shrank.** It did not. One residual closed and one opened
   (§3).

**One workflow defect bit this round twice and is restated here because it is invisible from inside
any single plan.** A SUMMARY is written *after* the regression run it reports, so a frontmatter
defect in the SUMMARY itself cannot be caught by that plan's own evidence. `29-34-SUMMARY.md` and
`29-37-SUMMARY.md` each broke the D-49 false-red control this way and each was repaired by the
*next* plan (commits `84b0f4b` and `dd16917`). It is logged as `D-38-3` in `deferred-items.md`. The
mitigation available to an executor today is to run the control a second time, after writing the
SUMMARY — which is a discipline, not a mechanism.

**Every requirement this round touched is left for round-5 verification to judge.** No plan of
round 4 marked its own requirement complete. That was not an oversight repeated seven times; it is
the correct posture for a phase whose last four verification rounds each returned `gaps_found`
against a green tree.

---

## 7. Final evidence — every closed finding re-tested against the tree that ships

Recorded by plan 29-39, task 3. Each finding below was re-tested against the FINAL tree rather than
accepted from the SUMMARY that claimed it.

### 7.1 The premise, asserted before any evidence

Every reproduction below is a claim about the `.ts` **only if** the committed `.js` is a faithful
build of it. Run first, before anything else:

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
exit=0
```

This phase has had a verification harness produce a false result in six instances across four
rounds, so the premise is stated rather than assumed. **It happened once more inside this very
task** — see §7.3.

### 7.2 The nine reproductions

Mirror: `git archive HEAD | tar -x` at `5038b80`, 1579 files.

| id | reproduction re-run | result on the final tree |
|---|---|---|
| **CR-01** | round 4's exact `sed` member substitution, with a caveman marker planted into `agent-factory/workflows/15-security-audit.md` on the mirror | **does not reproduce at the layer the finding names.** The finding is that the SOURCE-level pin was a cardinality where membership was meant; `SEC_VOICE_MEMBERS` now pins membership two-sided (18 references in the harness). The `.js`-only route still passes the gate **by construction** — see §7.3, where the half that catches it is measured |
| **WR-01** | the review's inert plant verbatim — `if (at === -1) { const noted = true; void noted; }` followed by `sectionEndIndex(text, at + 1, 2)` | **does not reproduce.** The shipped classifier returns the full verdict triple `guarded-but-inert-plant.ts=UNGUARDED`, `guarded-plant.ts=GUARDED`, `unguarded-plant.ts=UNGUARDED`, asserted as ONE expectation so a rule flipping two plants at once cannot pass two of three |
| **WR-02** | the tautology corpus | **does not reproduce.** `headingIdx.length === headingShapedLines - headingShapedFenced` survives at `scripts/audit-model.ts:1169` **inside a comment recording its deletion**, not as code. `canonicalClaimHeadingCensus` — a witness differing in KIND — is present and consulted |
| **WR-03** | the reach measurement | **does not reproduce.** `REACH_FLOORS.I5` is **720** (`section-locator-oracle.test.ts:688`), not 1800, and `I5` is now a block predicate derived from I5's own rule. Note the review projected 360; 29-36 measured **720** and recorded why the review's projection was wrong in both directions |
| **WR-04** | the dead disjunct and the vacuous assertion | **does not reproduce.** Both surviving occurrences of `bodyLines.length === 0` in the guard are in comments recording the removal (`:2146`, `:2302`); the live condition no longer carries it. In `voice-model.test.ts` the retired `split.length > 0` form survives twice — once quoted in a comment (`:579`) and once at `:631` **asserted `.toBe(true)` deliberately, to SHOW the retired form accepts a remainder the corrected form rejects**. The working assertion is the non-blank count at `:604` |
| **WR-05** | the near-total-swallow fixture | **does not reproduce.** `guard_voice` now publishes four reconciled numbers per file, observed live on the mirror: `15-security-audit.md: scanned 50 clear-voice line(s), 1 marker line(s), caveman region 0 line(s), document 50 line(s)`. The remaining half is disclosed by name as `VOICE_REMAINDER_RESIDUAL`, pinned against the guard source |
| **WR-06** | the level-agnostic profile reversion | **does not reproduce.** Reverting `WP-04`'s row to "A bullet under a steps heading is procedural." on the final tree reds **2 cases of 62**, by name: `the PROFILE's WP-04 row does not carry WP-04's ANCHOR sentence` and `expected [ 'profile/wp04' ] to deeply equal []` — the pin names WHICH half moved. Tree restored, `git status --porcelain agent-factory/` empty |
| **WR-07** | the added-assertion drift | **does not reproduce.** Measured against the shipped file: one added SINGLE-LINE assertion GREEN, one added MULTI-LINE assertion GREEN, twenty added assertions GREEN — where the old design reds on all three. Every breakage still reds: blind classifier → `R2,R3`; multi-line class dropped → `R5,R6`; naive counter → `R4,R5,R7`; quote-aware counter → `R7`; subject counter → `R6`; occurrence counter → `R1`. Zero discrimination lost |
| **WR-08** | the fenced and level-one section shapes | **does not reproduce.** The round-4 lookahead regexp occurs **0** times across all production sources. `sectionBody` in both generators is now four lines consuming the one authority — `unfencedHeadingIndex` then `sectionEndIndex(text, at + 1, 2)` — and honours the `-1` contract |

**No finding still reproduces.** Nothing in the list above is explained away; the one item that
needs a boundary drawn is CR-01, and it is drawn in §7.3 with the measurement rather than with prose.

### 7.3 The one boundary, and a false green inside this task's own harness

**CR-01's `.js`-only route still passes the gate**, and that is by construction rather than by
regression: the membership pin reads the `.ts` SOURCE, while round 4's reproduction edited the
committed `.js`. Plan 29-33 disclosed exactly this and named `npm run freshness` as the half that
covers it. Re-measured here:

```
$ CHECK_ROOT=$MIR node scripts/check-foundation-guards.js       # unmodified, marker planted
  FAIL  voice: 1 finding(s) over 19 elements                     exit=1
$ CHECK_ROOT=$MIR node $SUB/check-foundation-guards.js          # ONE member token substituted
  PASS  voice: 0 findings over 19/19 elements
  ALL CHECKS PASSED                                              exit=0
  ('15-security-audit' appears 0 times in the passing run)
```

and the half that catches it:

```
$ sed -i '' 's|".../15-security-audit.md"|".../definition-of-ready.md"|' scripts/check-foundation-guards.js
$ npm run freshness
STALE: scripts/check-foundation-guards.js — committed build output differs from a fresh tsc rebuild.
Freshness check FAILED: 1 stale build output(s) detected.
exit=1
$ # restored
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.    exit=0
```

**The first attempt at that measurement produced a FALSE GREEN, and it is recorded rather than
quietly corrected.** The check was first run as `cd $MIRROR && node $REPO/scripts/freshness.js`,
which reported `All build outputs fresh` at exit 0 over a mirror whose `.js` had just been
substituted. It read the REPO's files, not the mirror's, and it skipped the `tsc` rebuild the npm
script performs first — so it measured the wrong tree with the wrong premise and agreed with the
answer being hoped for. It was re-run correctly, in the repo, with backup and restore. This is the
seventh instance in five rounds of a harness in this phase producing a false result, and the fourth
where the false result pointed toward the comfortable conclusion.

### 7.4 The sweep

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run freshness` | 0 — 48 committed `.js` fresh |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run typecheck` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **2029 passed / 2 skipped across 52 files** (round-4 baseline was 1987) |
| `npm run check:public-docs` | 0 |
| `npm run check:banned-claims` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:diff-disposition` | 0 |
| `npm run check:imperative-lexicon` | 0 |
| `npm run check:nul-bytes` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `git diff --exit-code 57affa1^..HEAD -- package.json package-lock.json` | 0 — the supply-chain mitigation is asserted absence at ROUND scope; no plan of round 4 installed a package |
| `git status --porcelain` | clean of plants — every plant of every plan of this round was written to a mirror, a temp directory, or restored from a checksummed backup |

**And the suite being green proves none of this.** It is a floor. The evidence for each finding is
the reproduction beside it in §7.2, not the count in this table.
