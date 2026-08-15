---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-15T23:20:00Z
status: gaps_found
score: 4/8 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
re_verification:
  previous_status: gaps_found
  previous_score: 4/8
  gaps_closed: []
  gaps_remaining:
    - "LANG-03 — all three of round 2's enumerated `missing:` items LANDED (equality three at the source, containment + derived-count pin at the consumer, harness cases in both gates). The truth still fails: those pins cover only the REGISTER arm of the D-18 union. The REGISTRY arm is unpinned in both directions, reproduced live here — flipping ONE `kind:` cell drops README.md from the watched corpus and from the exclusion list with zero gates red (WR-06 + CR-02)."
    - "LANG-04 — all three of round 2's enumerated `missing:` items LANDED (Residual 1 retired by decision with the rule named in the refusal, Residual 4 recorded, permanent cases for both shapes). The truth still fails: WP-11 is PUBLISHED level-agnostic and marked `decidable` while `STEPS_HEADING = /^## Steps\\s*$/` decides one spelling only, so the guard does not enforce exactly the profile's decidable subset — LANG-04's literal text (WR-05)."
    - "LANG-06 — all three of round 2's enumerated `missing:` items LANDED and round 2's CR-02 shape now fails closed (independently re-run: `{ok:false,reason:\"missing\"}` at BOTH heading levels). The truth still fails on a NEW, reproduced, fail-open REGRESSION vs 3ed76c1 in the same reader: making the bound fence-aware lets the caveman fence swallow later sections and drive `outside` to the empty string, so guard_voice scans zero bytes and passes (CR-01)."
    - "LANG-07 — round 2's WR-08 (four private section-end predicates) IS closed structurally: one authority in `frontmatter.ts`, five consumers, the consumer list pinned two-sided with a planted-sixth falsifiability probe. The truth still fails on a SIXTH locator (`audit-model.ts:893-950`) invisible to the classifier on both arms, and on a second private fence recogniser in that same module (CR-02, WR-02)."
  regressions:
    - "LANG-06 / voice-model.ts — `readCavemanFence` on a caveman fence left open across a later `##` heading returned `{ok:false,reason:\"unterminated\"}` at 3ed76c1 and returns `{ok:true, outside:\"\"}` at HEAD. Both builds run here, back to back, from the committed `.js`. This is the phase's founding defect, reopened by the round's own structural fix."
    - "LANG-07 / audit-model.ts — plan 29-25 declared `tableUnder` \"the FIFTH and last locator of the class\" and the round's audit transcript presents `SECTION_EXTENT_OWNER_COUNT = 1` as a measurement. `readRegistry` in the SAME module is a section-extent construct the classifier misses on both arms; the pin runs green (re-run here) over a two-owner tree."
gaps:
  - truth: "LANG-03 — a named safety-surface exclusion list is honoured so that load-bearing security, compliance, and admission text is never reworded by a style pass"
    status: failed
    reason: >
      Round 2's three enumerated `missing:` items all landed and were confirmed here by direct read,
      not accepted from any SUMMARY: `check-audit-register.ts:241-290` now asserts equality three
      (the register's `safety_surface: yes` rows against the derived kit, two-sided, reported as two
      separate defects); `check-diff-disposition.ts:1437-1497` adds `derivedKit ⊆ corpus.watched`
      plus `derivedKit.length === WATCHED_CORPUS_MIN` (36 = ROLE_COUNT + WORKFLOW_COUNT, imported
      from a module `watchedCorpus()` never calls); and both gates carry a harness case that flips one
      `safety_surface` cell and requires exit 1. Round 2's specific defect is CLOSED.
      The truth is still not held. Both pins land on the REGISTER arm of the D-18 union
      (`generate-safety-surface.ts:73-98`: register rows flagged `safety_surface: yes` ∪ registry rows
      of `kind: safety`). The REGISTRY arm carries four members no pin touches — measured here:
      `.claude-plugin/plugin.json`, `AGENTS.md`, `README.md`, `agent-factory/README.md` are in the
      union by registry reason ALONE. Reproduced end to end on a mirror: flip C-28-001's `kind: safety`
      to `kind: architecture` (one cell), and `README.md` leaves the union (41 → 40) AND the watched
      corpus. `check-audit-register` and `check-claim-anchors` both exit 0 on the flipped tree — the
      floor-coverage check still passes because three other claims cover the same floors — and the new
      consumer pin does not fire, verified by re-running its own arithmetic: 0 of 36 derived kit files
      are unwatched, because `README.md` was never a kit file. This is WR-06 in `29-REVIEW.md`, and
      CR-02 supplies the other direction: a claim block written inside a FENCED example parses as a
      live `kind: safety` row and adds a file to the same list (reproduced below).
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "the round-2 pin (1437-1497) floors `derivedKit ⊆ watched` only; the registry arm's members are outside the derived kit, so any number of them may be added or removed silently (WR-06)"
      - path: "scripts/check-audit-register.ts"
        issue: "equality three (241-290) pins the register arm's `safety_surface` VALUES two-sided; the registry arm's `kind: safety` rows have no equality anywhere in the tree"
      - path: "scripts/audit-model.ts"
        issue: "readRegistry (893, 933-950) is fence-blind, so a fenced example can fabricate a `kind: safety` row that enters the exclusion list (CR-02)"
    missing:
      - "Pin the REGISTRY arm the way the register arm is pinned: derive the `kind: safety` claim files and compare them two-sided against a declared set (or against the public-document scan check-banned-claims.ts already derives), and publish the count — the gate's `the union's remaining N markdown entr(ies) are public documents` line is a description of the residue, not a check on it"
      - "Make readRegistry's heading scan fence-aware (consume `fencedLineFlags`, already imported in that module since 29-25) and take the block's end from the same source, so documentation cannot enter the exclusion list as live data"
      - "Add a harness case that flips one `kind: safety` cell in a registry mirror and requires exit 1 — the register-arm equivalent already exists in both gates and is the pattern to copy"
  - truth: "LANG-04 — a guard enforces exactly the profile's decidable subset and is named for that subset (guard_imperative_lexicon: lexicon membership at imperative position; guard_sentence_form: sentence length and banned constructions); guard_banned_claims holds the conformance prohibition mechanically"
    status: failed
    reason: >
      Round 2's three enumerated `missing:` items all landed, confirmed here by direct read: Residual 1
      was RETIRED BY DECISION rather than left contradicting the gate — a prose-only `## Steps` section
      is RED and the refusal now NAMES the rule (`check-imperative-lexicon.ts:1414-1421` prints
      `WP-11: A steps section carries at least one list item.`); WR-09 is recorded as Residual 4 and
      pinned by a live case; and `check-imperative-lexicon.test.ts:1237-1290+` carries a permanent case
      for each shape. `guard_banned_claims` remains mechanical and passes.
      The truth is still not held, one level up. `agent-factory/writing-profile.md:54` publishes WP-11
      as "**A steps section** carries at least one list item. Write the procedure as list items, or move
      the explanatory paragraphs under a heading that is **not a steps heading**." and marks it
      `decidable`. The gate's anchor is `const STEPS_HEADING = /^## Steps\s*$/` — level two, exactly.
      A `### Steps` or `# Steps` section written entirely as prose violates the published decidable rule
      and contributes no member to `stepsFiles`, so the set equality that produces the WP-11 refusal
      never fires: the guard enforces a PROPER SUBSET of the rule the profile publishes as decided.
      Second half, verified at both artifacts: the case comment claims "the guard's enforcement and the
      kit's own documentation are held to ONE sentence in TWO artifacts", but `STEPS_RULE_SENTENCE`
      pins only the first sentence — the remedy halves already disagree on the day they landed
      ("not `## Steps`" in the gate against "not a steps heading" in the profile). This is WR-05, and it
      is the same claim/behaviour disagreement round 2 charged against this truth as WR-04.
      Live reachability: 0 — every `Steps` heading in the governed corpus is `## Steps` (19 measured).
      Latent and FAIL-OPEN.
    artifacts:
      - path: "agent-factory/writing-profile.md"
        issue: "line 54 publishes WP-11 level-agnostically ('a steps section', 'not a steps heading') and marks it `decidable`, while the gate decides `## Steps` only (WR-05)"
      - path: "scripts/check-imperative-lexicon.ts"
        issue: "STEPS_HEADING (561) is /^## Steps\\s*$/; STEPS_SECTION_RULE (1270-1271) pins the first sentence only, and the remedy sentence at 1414-1421 differs from the profile's"
    missing:
      - "Choose one and record it: narrow the published rule to the spelling the gate decides (`## Steps`), or widen STEPS_HEADING to the level class and re-measure the governed corpus"
      - "Pin the WHOLE rule text — both sentences — in both artifacts, or delete the second sentence from one of them so the pinned string is the entire rule"
      - "Add a case for the currently-invisible spelling (a prose-only `### Steps` section) asserting the INTENDED verdict, so the decision above is held by a test rather than by prose"
  - truth: "LANG-06 — the rebuilt voice guard measures voice against a committed lexicon (i.e. reliably identifies which bytes are the caveman block)"
    status: failed
    reason: >
      Round 2's three enumerated `missing:` items all landed, and round 2's own CR-02 shape now fails
      closed — re-run here against the committed `.js`, not accepted from a SUMMARY: a de-fenced
      `## Caveman prompt` followed by a `# Appendix` carrying an unrelated fence returns
      `{ok:false, reason:"missing"}`, and so does the level-two variant. The bound is no longer this
      module's to decide; `voice-model.ts:200` consumes `frontmatter.ts`'s `sectionEndIndex`, and both
      the per-case and full-gate pins exist (`voice-model.test.ts:254`,
      `check-foundation-guards.test.ts:5056`).
      The truth fails on a NEW defect the same fix created. `sectionEndIndex` skips lines the one fence
      toggle flags (`frontmatter.ts:535-537`), and the caveman fence's OWN INTERIOR is flagged — so a
      `#`/`##` heading written between the opening and closing delimiters no longer closes the section,
      and the close scan runs past it. Every line from the opening delimiter to the closing delimiter
      lands in `inside` and is filtered out of `outside` at `voice-model.ts:226-228`. Reproduced here
      against the committed `.js`, and against 3ed76c1 for the direction:
        HEAD:    readCavemanFence(...) -> ok:true, outside: "", inside: 8 lexicon tokens
        3ed76c1: readCavemanFence(...) -> {ok:false, reason:"unterminated"}
      `guard_voice` (`check-foundation-guards.ts:2071-2107`) scans `verdict.outside` and is the one
      foundation guard that does NOT fold through `reportMeasured` — its live PASS line is a bare
      "voice: clear-voice surfaces free of caveman markers" with no denominator, beside
      guard_caveman_voice's "0 findings over 17/17 elements". Nothing notices it scanned zero bytes.
      The failure scenario is the phase's founding defect verbatim: reword `## Hard limits` into caveman
      voice, leave the fence open across the heading above it, and both voice guards go green.
      Live reachability: 0 of 17 role files carry a level ≤ 2 heading inside their caveman interior
      today (measured). Direction is FAIL-OPEN and the exemption has no mechanism.
      Compounding it, `voice-model.ts:123-128` still asserts the deleted behaviour ("UNCHANGED BY THE
      REWIRE ... such a document is refused `unterminated`", "Do not add a second arm that reaches past
      the bound") — both halves are now false at HEAD (WR-01).
    artifacts:
      - path: "scripts/voice-model.ts"
        issue: "the fence-aware bound at :200 lets the caveman fence swallow later sections; `outside` at :226-228 can be driven to the empty string (CR-01) — and the header at :123-128 documents the opposite direction (WR-01)"
      - path: "scripts/check-foundation-guards.ts"
        issue: "guardVoice (2053-2111) publishes a bare pass() with no denominator, so a collapsed scan surface is indistinguishable from a clean one"
    missing:
      - "Restore the fail-closed direction without a private predicate: compute the FENCE-BLIND level-≤2 successor as well and refuse `unterminated` by name when the closing delimiter sits beyond it, or add an explicit `heading-inside-interior` refusal arm"
      - "Publish and two-side-pin what guard_voice actually scanned — the `outside` line count per file — so a remainder that collapses is a red rather than a silent pass"
      - "Correct scripts/voice-model.ts:123-128 in the same commit so the module's stated fail direction matches the shipped one"
      - "Add a permanent case planting a fence opened inside the caveman section and closed after a later `##` heading, asserting the intended verdict AND asserting `outside` is non-empty"
  - truth: "LANG-07 — guard_imperative_lexicon (with its sibling guard_sentence_form) and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes"
    status: failed
    reason: >
      Round 2's WR-08 IS closed structurally and that is confirmed here by direct read, not by SUMMARY:
      `frontmatter.ts:512-539` exports `unfencedHeadingIndex`/`sectionEndIndex`, five modules consume
      them, the four private section-end predicates are deleted, the level axis is pinned two-sided, and
      the consumer list is pinned by a derived scan proven falsifiable by a planted sixth module. Both
      of round 2's enumerated `missing:` items landed.
      The truth still fails, on evidence the round's own audit did not have.
      (a) CR-02 — `audit-model.ts:893` declares `CLAIM_HEADING_RE = /^###\s+(\S+)\s*$/`, scans raw lines
      for it at `:935` with no fence awareness, and takes the block's end from the next heading index at
      `:948`. By the owner scan's own published definition that is a section-extent construct. It is
      missed on BOTH arms: the recogniser arm requires a literal space (`/\/\^#(?:\{[\d,]+\})? /`) and
      this one spells `\s+`; the terminator arm never sees it because the bound is 13 lines from the
      recogniser. The classifier's own disclosed floor, item 4
      (`check-foundation-guards.test.ts:1030-1031`), names that shape and asserts it is one "which no
      module in this tree uses today" — false at `audit-model.ts:893`, today. So
      `SECTION_EXTENT_OWNERS = ["frontmatter.ts"]` / `SECTION_EXTENT_OWNER_COUNT = 1` is green over a
      two-owner tree; the named test was run here in isolation and passes. Reproduced: a claim block
      written INSIDE a fenced example parses as a live row —
      `[{"id":"C-28-001",...},{"id":"C-28-999","file":"PHANTOM.md","kind":"safety","status":"true"}]`.
      (b) WR-02 — `audit-model.ts:986` decides "is this line a fence delimiter" with a private
      `lines[i].trim() === "```"` while `tableUnder` in the same module answers it through
      `fencedLineFlags` / `FENCE_DELIMITER_LINE` (`/^```/`). The two disagree on two axes (an info
      string; a three-space-indented delimiter). Two grammars over the same bytes is the literal text of
      this must-have, and the module carrying both is the one plan 29-25's SUMMARY calls "the FIFTH and
      last locator of the class" and `docs/audit/29-locator-unification.md §3` presents as the
      derivation that makes "the last member" a measurement rather than a belief.
      This is also the project's named set-literal-drift class: a hand-declared owner list green over a
      set the classifier no longer enumerates completely.
      Live reachability of the fenced-registry-row route: 0 of 42 claim-heading-shaped lines in
      `docs/audit/28-claim-registry.md` are fenced today (measured through the same fence toggle).
    artifacts:
      - path: "scripts/audit-model.ts"
        issue: "readRegistry (893, 933-950) is a sixth section-extent construct invisible to the owner classifier on both arms (CR-02); parseClaimBlock (986) is a second, private fence recogniser disagreeing with FENCE_DELIMITER_LINE (WR-02)"
      - path: "scripts/check-foundation-guards.test.ts"
        issue: "SECTION_EXTENT_OWNERS/COUNT (1231-1232) pass over a two-owner tree; the floor's item 4 (1030-1031) states a falsehood about this tree"
    missing:
      - "Close the sixth locator in audit-model.ts, not by widening the classifier: derive `headingIdx` from an unfenced scan (fencedLineFlags, already imported since 29-25) and take the block's end from the same source"
      - "Have parseClaimBlock consume the one fence authority instead of its private `trim() === \"```\"` equality, or disclose the disagreement as a named residual at the declaration"
      - "Correct the owner classifier's floor item 4 — either recognise `#{n,m}\\s` or state truthfully that a module uses it and that this is an accepted blind spot; a floor asserting a falsehood about the tree is the 'prose claim wider than the assertion behind it' class"
      - "Re-derive SECTION_EXTENT_OWNERS after the fix and require the planted-sixth probe to still discriminate"
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 29: Controlled Language & Voice Guard Rebuild — Verification Report (round 3)

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two
agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced
block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-15T23:20:00Z
**Status:** gaps_found
**Re-verification:** Yes — third verification, after gap-closure round 2 (plans 29-20 … 29-26,
commits `3ed76c1..HEAD`) executed against round 2's four gaps.

## Method Note — what counts as evidence here, and what does not

The round-2 baseline is preserved byte-identical at `29-VERIFICATION-round2.md` (`gaps_found`, 4/8).
This file is the current measurement and replaces it.

Nothing below is taken from a SUMMARY. Round 2's executors were unusually candid about their own
deviations, and their claims are treated as hypotheses. Every load-bearing statement in this report
was re-derived in this session by one of three means, and the means is named beside each:

1. **Direct source read** at the cited line numbers.
2. **Execution against the committed `.js`** — and `npm run freshness` was run first
   (`All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild`), so a reproduction
   against the `.js` is evidence about the `.ts` I read.
3. **Planted input on a hermetic mirror** built with `git archive HEAD`, never on the live tree.
   `git status --porcelain` at the end shows only the pre-existing out-of-scope `human-notes.txt` (M),
   `.gsd/` (??) and `.planning/phases/29.1-.../` (??). No source file was modified.

**A green gate is not evidence for this phase, and this round proves it again.** All seven repo gates
exit 0 on HEAD and the non-e2e suite is **1878 passed / 2 skipped across 52 files** (run once here),
WHILE both criticals below reproduce. That is the project's own standing lesson, and it is why the
score did not move.

Because round 2 enumerated a `missing:` list per failed truth, this report answers two separate
questions for each one and never conflates them: **did the enumerated items land** (all of them did,
across all four truths) and **is the truth now true** (for none of the four).

## Goal Achievement

### Observable Truths

| # | Truth (LANG-NN) | Status | Evidence |
|---|---|---|---|
| 1 | LANG-01 — grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation / not-certified disclaimer and vendors no ASD dictionary text | ✓ VERIFIED | Unchanged. `agent-factory/writing-profile.md` § *Disclaimer and honesty floor* (line 176) present; round 2's only edit to this file was the additive WP-11 row and its rationale section (diff read in full). |
| 2 | LANG-02 — the profile is applied to workflow steps, checklists, memory-bank, shared-context notes, board and traceability, and explicitly NOT to the fenced caveman blocks | ✓ VERIFIED | Live gate output re-run here: `LANG-02: 47 governed document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2 … 47 of 47 opened`, with `agent-factory/roles/` named-excluded and the reason stated in the output. The governed corpus derives from `kit-model`, not from the D-18 list, so CR-02 does not reach it — but see the hazard note below. |
| 3 | LANG-03 — a named safety-surface exclusion list is honoured so load-bearing security/compliance/admission text is never reworded by a style pass | ✗ FAILED | All three round-2 `missing:` items landed (equality three, containment + count pin, harness cases in both gates) — confirmed by read. The truth fails one arm to the right: the REGISTRY arm of the same union is unpinned in both directions. Reproduced on a mirror — one `kind:` cell flip drops `README.md` from the union (41 → 40) and from the watched corpus, `check-audit-register` and `check-claim-anchors` both exit 0, and the new consumer pin does not fire (0 of 36 kit files unwatched). See gap #1. |
| 4 | LANG-04 — guards named for exactly the decidable subsets they check; guard_banned_claims holds the conformance prohibition mechanically | ✗ FAILED | All three round-2 `missing:` items landed (Residual 1 retired by decision, Residual 4 recorded, permanent cases for both) — confirmed by read. The truth fails one level up: WP-11 is published level-agnostic and marked `decidable`, `STEPS_HEADING` decides `## Steps` only, and the two-artifact pin covers the first sentence while the remedy halves already disagree. See gap #2. |
| 5 | LANG-05 — `## One job`, the caveman block and `## Responsibilities` each say a thing once | ✓ VERIFIED | Unchanged; not touched by round 2's file set (`git diff 3ed76c1..HEAD --stat` read in full — no role file changed). `guard_role_clause_uniqueness` passes on HEAD. |
| 6 | LANG-06 — the voice guard measures voice against a committed lexicon (reliably identifies which bytes are the caveman block) | ✗ FAILED | All three round-2 `missing:` items landed and round 2's CR-02 shape now fails closed (re-run: `{ok:false,reason:"missing"}` at both heading levels). The truth fails on a NEW fail-open REGRESSION: HEAD returns `ok:true` with `outside: ""` on bytes 3ed76c1 refused `unterminated`; guard_voice then scans zero bytes and publishes a PASS with no denominator. Both builds run back to back here. See gap #3. |
| 7 | LANG-07 — the lexicon guards and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes | ✗ FAILED | Round 2's WR-08 IS closed structurally (one authority, five consumers, private predicates deleted, consumer list pinned two-sided with a falsifiability probe) — confirmed by read. The truth fails on a SIXTH locator in `audit-model.ts:893-950` invisible to the classifier on both arms (owner pin re-run here: green over a two-owner tree; a fenced example parses as a live `kind: safety` row), plus a second private fence recogniser at `:986`. See gap #4. |
| 8 | LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Carried forward unchanged from rounds 1 and 2. `hold-rebaseline` accepted by Olger Oeselg 2026-08-15; the prohibition half holds by construction and the delta is in `docs/audit/29-ceiling-rebaseline.md`. |

**Score:** 4/8 truths verified (LANG-01, LANG-02, LANG-05, LANG-08-via-override).
4/8 failed (LANG-03, LANG-04, LANG-06, LANG-07). 0 present-but-behaviour-unverified.

### The headline number is unchanged; what it is made of is not

Round 2 also scored 4/8, and reading that as "no progress" would be wrong in both directions.

**What genuinely closed.** All twelve of round 2's enumerated `missing:` items — three per failed
truth — landed, and each was confirmed here independently rather than accepted:

| round-2 defect | status at HEAD | how confirmed |
|---|---|---|
| CR-01 (r2): unpinned watched corpus, register arm | **closed** | `check-audit-register.ts:241-290` equality three, two-sided, two directions reported separately; `check-diff-disposition.ts:1437-1497` containment + `WATCHED_CORPUS_MIN` derived from a module `watchedCorpus()` never calls; harness cases in both gates |
| CR-02 (r2): `SECTION_END = /^## /` level-one-blind | **closed** | re-run against the committed `.js`: the round-2 bypass bytes now return `{ok:false,reason:"missing"}` at both levels |
| WR-04 (r2): gate contradicted its own Residual 1 | **closed by decision** | Residual 1 retired; the prose-only `## Steps` refusal now names `WP-11` and the rule sentence, and the rule is published in the profile |
| WR-09 (r2): indented code blocks donate step bullets | **closed as a disclosed residual** | recorded as Residual 4, pinned by a live case asserting the intended verdict |
| WR-08 (r2): four disagreeing section-end predicates | **closed structurally** | one authority in `frontmatter.ts:512-539`; five consumers; four private predicates deleted; level axis pinned two-sided; consumer list derived and pinned, falsifiable by a planted sixth module |

That is a real structural round, and it is not the same round as round 1.

**Why the truths did not close anyway.** Three of the four failures are the SAME SHAPE one step
outward from the fix, and one is a regression the fix itself created:

- LANG-03's pin covers the arm the reproduction used and not the arm beside it.
- LANG-04's contradiction moved from the module's in-file residual to the kit's published rule.
- LANG-07's unification deleted five locators and left a sixth in the module it declared last.
- LANG-06's bound became fence-aware, and fence-awareness is what reopened the founding defect.

The recurring probe this round adds to the phase's record: **when a fix is scoped to the arm the
reproduction used, ask what the OTHER arm of the same union / the other spelling of the same rule /
the other half of the same module does** — and, for a predicate made fence-aware, **ask which bytes
are themselves fenced.** `sectionEndIndex` is correct; the caveman fence's own interior being flagged
is what makes a correct authority produce the wrong section.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/writing-profile.md` | Enumerated rules, Technical Names derivation, disclaimer | ⚠️ WIRED BUT INCOMPLETE | Disclaimer and rule table present (LANG-01 unaffected). WP-11, added this round, is published wider than the gate that decides it — WR-05, charged against LANG-04 |
| `scripts/frontmatter.ts` (`unfencedHeadingIndex`, `sectionEndIndex`) | ONE section-locator authority | ✓ VERIFIED as an authority | Composes the one fence toggle; `[from, lineCount)` contract holds; level axis pinned two-sided; five consumers pinned. The authority is right; one consumer's use of it is not (CR-01) |
| `scripts/voice-model.ts` (`readCavemanFence`) | Single, section-bounded caveman-fence authority | ✗ INCORRECT (fail-open regression) | Bound now delegated correctly, but a fence open across a later heading swallows every intervening section and empties `outside` — CR-01, reproduced against both builds |
| `scripts/check-foundation-guards.ts` (`guard_voice`) | Scan the clear-voice remainder and publish a measurement | ⚠️ HOLLOW | Wired to the one reader, but the only foundation guard with no denominator; a zero-byte scan prints the same PASS as a full one |
| `scripts/check-imperative-lexicon.ts` | Enforce the profile's decidable subset exactly | ⚠️ WIRED BUT INCOMPLETE | Consumes the shared authority; Residual 1 retired and Residual 4 disclosed; enforces one spelling of a rule published for all — WR-05 |
| `scripts/check-diff-disposition.ts` (`guard_diff_disposition`) | Watch a pinned corpus | ⚠️ WIRED BUT INCOMPLETE | Register arm now pinned by containment + derived count; registry arm unpinned in both directions — WR-06, reproduced |
| `scripts/check-audit-register.ts` (equality three) | Pin the `safety_surface` VALUES two-sided | ✓ VERIFIED | New this round; two directions reported as two defects; reuses `derived` so equalities one and three cannot disagree |
| `scripts/check-banned-claims.ts` (`locateExemptRegion`) | Locate the exemption through the shared authority | ⚠️ WIRED, UNGUARDED `-1` | Consumes the authority, but the COUNT traverses `lines` and the LOCATE traverses `text`; `headingAt === -1` is unchecked and would widen the exemption from line 0 — WR-04 |
| `scripts/audit-model.ts` (`readRegistry`, `parseClaimBlock`) | No private section or fence predicate after 29-25 | ✗ TWO PRIVATE GRAMMARS | Sixth section-extent construct (CR-02) and a second fence recogniser (WR-02), in the module the round declared last |
| `scripts/section-locator-oracle.test.ts` | A parser oracle over the authority | ⚠️ ONE VACUOUS INVARIANT | 7200 cells, six invariants; I5's loop body is unreachable in every cell — confirmed by reading the generator: `wrapCandidate` inserts the candidate exactly once and no fixed corpus line contains `Candidate` |
| `docs/audit/29-locator-unification.md` | Re-runnable transcript, residual set, human decision | ✓ VERIFIED (as a transcript) | §7 residual set and §8 `reopen-for-survivors` present and honest, including "the round does NOT close" |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `voice-model.ts` | `frontmatter.ts` `sectionEndIndex` | import + call at `:200` | ✓ WIRED, ✗ WRONG RESULT | The authority is consumed correctly and returns the wrong section because the caveman interior is fenced (CR-01) |
| `check-foundation-guards.ts` `guard_voice` | `voice-model.ts` `readCavemanFence` | import + call at `:2071` | ✓ WIRED, ⚠️ UNMEASURED | Scans `verdict.outside`; no `reportMeasured`, so a collapsed remainder is a silent pass |
| `check-diff-disposition.ts` | `generate-safety-surface.ts` `safetySurfaceUnion` | import at `:154`, call at `:1371` | ✓ WIRED, ⚠️ HALF-PINNED | Register arm pinned two-sided; registry arm's four members unpinned in both directions |
| `generate-safety-surface.ts` | `audit-model.ts` `readRegistry` | call at `:92` (`kind === "safety"`) | ✓ WIRED, ✗ FENCE-BLIND SOURCE | A fenced example can fabricate a member of the D-18 exclusion list |
| `check-foundation-guards.test.ts` owner classifier | the tree's section-extent constructs | derived scan over `nonTestScripts()` | ✗ INCOMPLETE DERIVATION | Reports one owner over a two-owner tree; the floor's item 4 asserts the missed shape is unused in this tree |
| `check-banned-claims.ts` `locateExemptRegion` count | its own locate | `lines` vs `text` | ⚠️ TWO TRAVERSALS, ONE UNGUARDED | Agree today only because `text === lines.join("\n")`; `-1` unchecked (WR-04) |

### Data-Flow Trace (Level 4)

No UI/DB surface. The equivalent question for this phase is **which bytes a guard measures**, and
that is where the defects live. Traced:

| Consumer | Value | Source | Produces real data | Status |
|---|---|---|---|---|
| `guard_voice` | the clear-voice remainder | `readCavemanFence(...).outside` | can be driven to `""` with no signal | ✗ HOLLOW |
| `guard_caveman_voice` | the caveman interior | `readCavemanFence(...).inside` | can be bytes from another section | ✗ WRONG SOURCE (same defect) |
| `guard_diff_disposition` | the watched corpus | `safetySurfaceUnion()` markdown members | register arm pinned; registry arm movable | ⚠️ PARTIALLY PINNED |
| D-18 exclusion list | the protected file set | register ∪ registry arms | a fenced example can add a member | ✗ ADMITS DOCUMENTATION AS DATA |
| `guard_imperative_lexicon` WP-11 arm | `stepsFiles` | `/^## Steps\s*$/` over the governed corpus | correct for one spelling of a rule published for all | ⚠️ NARROWER THAN PUBLISHED |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Committed `.js` is a faithful build of the `.ts` read here | `npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild` | ✓ PASS (premise of every reproduction below) |
| Seven repo gates on HEAD | `node scripts/{check-foundation-guards,check-imperative-lexicon,check-diff-disposition,check-banned-claims,check-audit-register,check-claim-anchors,check-public-docs-vocabulary}.js` | all seven `ALL CHECKS PASSED`, exit 0 | ✓ PASS (and does NOT contradict the four failures — see Method Note) |
| NUL-byte gate (memory: grep silently skips binary-classified files) | `node scripts/check-nul-bytes.js` | exit 0 | ✓ PASS (so the greps in this report are trustworthy) |
| Regression suite, once, e2e excluded | `npx vitest run --exclude '**/scripts/e2e/**'` | 52 files, **1878 passed**, 2 skipped, 118s | ✓ PASS |
| **CR-01 at HEAD** | `node -e '…readCavemanFence(caveman fence open across "## Notes")…'` | `ok:true`, `outside: ""`, `inside` = 8 lexicon tokens, 0 banned | ✗ **CONFIRMS FAIL-OPEN REGRESSION** |
| **CR-01 at 3ed76c1** | same bytes, `git show 3ed76c1:scripts/voice-model.js` | `{"ok":false,"reason":"unterminated"}` | ✗ **CONFIRMS IT IS A REGRESSION, NOT A CARRY-OVER** |
| round-2 CR-02 shape at HEAD | de-fenced caveman + `# Appendix` with an unrelated fence | `{"ok":false,"reason":"missing"}`; level-two variant likewise | ✓ CONFIRMS ROUND-2 DEFECT FIXED |
| CR-01 live reachability | `readCavemanFence` over all 17 role files, `/^#{1,2} /` in `inside` | 17 role files, **0** with a level ≤ 2 heading inside the interior | ℹ️ latent today, fail-open, unmeasured |
| `guard_voice` publishes no denominator | live gate stdout | `PASS voice: clear-voice surfaces free of caveman markers` beside `PASS caveman voice: 0 findings over 17/17 elements` | ✗ CONFIRMS UNMEASURED |
| **CR-02 reproduction** | `readRegistry(fixture)` on a registry whose second claim block sits inside a fenced example | `[{"id":"C-28-001",…},{"id":"C-28-999","file":"PHANTOM.md","kind":"safety","status":"true"}]` | ✗ **CONFIRMS DOCUMENTATION READ AS LIVE DATA** |
| LANG-07 owner pin green over a two-owner tree | `npx vitest run scripts/check-foundation-guards.test.ts -t "the OWNER set is derived tree-wide"` | 1 passed | ✗ CONFIRMS THE PIN CANNOT SEE `audit-model.ts:893` |
| CR-02 live reachability | fence-toggle scan of `docs/audit/28-claim-registry.md` | 42 claim-heading-shaped lines, **0** fenced | ℹ️ latent today, fail-open, unmeasured |
| **WR-06 reproduction (new, this verification)** | mirror registry with C-28-001 `kind: safety` → `architecture`; `safetySurfaceUnion(mirror)` | union 41 → 40; **`README.md` DROPPED**; `check-audit-register` exit 0; `check-claim-anchors` exit 0 | ✗ **CONFIRMS THE ROUND-2 PIN DOES NOT COVER THE REGISTRY ARM** |
| WR-06, consumer pin re-run on the flipped union | `derivedKit ⊆ watched` and `derivedKit.length === WATCHED_CORPUS_MIN` | `WATCHED_CORPUS_MIN 36 · derivedKit 36 · watched md 39 · kit files unwatched 0` → pin does NOT fire | ✗ CONFIRMS THE NARROWING IS SILENT |
| Registry-arm-only members of the D-18 union | `safetySurfaceUnion()` filtered to registry-only reasons | `.claude-plugin/plugin.json`, `AGENTS.md`, `README.md`, `agent-factory/README.md` (4 members, 0 pins) | ✗ CONFIRMS THE UNPINNED SET |
| WR-05 live reachability | `grep -rn "^#{1,3} Steps$" agent-factory/` | 19 hits, **all `## Steps`**; 0 `#`/`###` | ℹ️ latent today, fail-open |
| WR-03 (I5 vacuity) | read `buildCell`/`wrapCandidate`/`ORDINARY_HEAD`/`ORDINARY_TAIL`/`AXIS_LEVEL` | candidate inserted exactly once; every spelling contains `Candidate`; no fixed line does → I5's loop body unreachable in all cells | ✗ CONFIRMS THE INVARIANT IS VACUOUS |
| V-29-26-04 still live | `grep -c '^\s\+```' README.md` | 4 indented delimiters (two example blocks) | ✓ CONFIRMS THE RECORDED RESIDUAL |
| Requirements traceability | union of `requirements:` over all 26 plans vs REQUIREMENTS.md Phase 29 rows | both are exactly LANG-01..08 | ✓ PASS (no orphans) |
| Debt-marker scan over round-2 source | `grep -an -E "\b(TBD\|FIXME\|XXX)\b"` over the 9 modified source files | one hit, `check-diff-disposition.ts:1130`, `TBD` as example text inside a comment listing sentinel spellings | ✓ PASS (no unresolved debt markers) |
| Working tree cleanliness after all reproductions | `git status --porcelain` | only the pre-existing `human-notes.txt` (M), `.gsd/` (??), `.planning/phases/29.1-.../` (??) | ✓ PASS (all plants were on mirrors) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exists in this repository and no PLAN declares one; this phase's
equivalent runnable evidence is the seven gates, the oracle, and the reproductions above, all executed
in this session. **Step 7c: N/A (no probe scripts in this project).**

### Requirements Coverage

| Requirement | Source plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-02, 29-03 | Grugops-authored ASD-STE100-derived profile, disclaimer, no vendoring | ✓ SATISFIED | Profile + § Disclaimer and honesty floor present; round-2 diff additive only |
| LANG-02 | 29-03, 29-08..12, 29-17, 29-24 | Profile applied to procedural surfaces, not to caveman blocks | ✓ SATISFIED | Live gate: 47 governed, 47/47 opened, `agent-factory/roles/` named-excluded with reason |
| LANG-03 | 29-04, 29-07, 29-08..12, 29-15, 29-16, 29-21, 29-22, 29-26 | Safety-surface exclusion honoured mechanically | ✗ BLOCKED | Registry arm unpinned both directions; one-cell flip drops README.md, reproduced on a mirror (WR-06 + CR-02) |
| LANG-04 | 29-02, 29-03, 29-08..12, 29-17, 29-18, 29-23, 29-24, 29-26 | Guard enforces exactly the decidable subset; conformance prohibition mechanical | ✗ BLOCKED | WP-11 published wider than `STEPS_HEADING` decides; two-artifact pin covers one sentence (WR-05) |
| LANG-05 | 29-01, 29-05, 29-06, 29-07 | Role skeleton de-duplicated | ✓ SATISFIED | Untouched by round 2; `guard_role_clause_uniqueness` green |
| LANG-06 | 29-01, 29-05..07, 29-14, 29-18, 29-20, 29-25, 29-26 | Voice guard rebuilt, RED evidence, lexicon-based measurement | ✗ BLOCKED | CR-01: fail-open regression vs 3ed76c1, reproduced against both builds |
| LANG-07 | 29-01, 29-20..26 | One fence parser, never two grammars over the same bytes | ✗ BLOCKED | CR-02 + WR-02: a sixth section locator and a second fence recogniser, both in `audit-model.ts` |
| LANG-08 | 29-13, 29-19 | Byte ceilings re-baselined once, delta recorded, never raised | ⚠️ ACCEPTED (override) | `hold-rebaseline`, authorised 2026-08-15 |

**No orphaned requirements.** The union of `requirements:` across all 26 plans is exactly
LANG-01..08, and REQUIREMENTS.md's Phase 29 row set is the same eight.

### REQUIREMENTS.md checkbox reconciliation — asked for explicitly, answered explicitly

The task asked whether LANG-07's `[x]` mark is still supportable. **It is not.** More broadly, the
checkbox column is stale in **five of eight rows**, in BOTH directions, so it is not evidence about
anything and should not be read as any:

| Row | REQUIREMENTS.md today | This verification | Supportable? |
|---|---|---|---|
| LANG-01 (`:79`) | `[x]` / Complete | ✓ VERIFIED | yes |
| LANG-02 (`:80`) | `[ ]` / **Pending** | ✓ VERIFIED | **stale — understates**: LANG-02 has verified in all three rounds |
| LANG-03 (`:81`) | `[x]` / Complete | ✗ FAILED | **no** — failed in rounds 1, 2 and 3 |
| LANG-04 (`:82`) | `[x]` / Complete | ✗ FAILED | **no** — failed in rounds 1, 2 and 3 |
| LANG-05 (`:83`) | `[x]` / Complete | ✓ VERIFIED | yes |
| LANG-06 (`:84`) | `[x]` / Complete | ✗ FAILED | **no** — failed in rounds 1, 2 and 3 |
| LANG-07 (`:85`) | `[x]` / **Complete** | ✗ FAILED | **NO.** The mark rests on the one-parser claim. `audit-model.ts:893-950` is a second section-extent authority and `:986` is a second fence recogniser; the owner pin that would have caught either is green over a two-owner tree, and the classifier's own published floor asserts the missed shape is unused in this tree. Both were reproduced here. |
| LANG-08 (`:86`) | `[ ]` / Pending | ⚠️ PASSED (override) | consistent with a deferred re-baseline |

`.planning/ROADMAP.md:96` correctly carries Phase 29 as `[ ]`, which is the one status line that
agrees with the evidence. Reconciling the REQUIREMENTS.md rows is a documentation fix, not a code
fix, and is deliberately NOT listed as a gap — but leaving it stale is how a later reader concludes
the phase closed.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/voice-model.ts` | 123-128 | A cost paragraph asserting behaviour the same round deleted ("UNCHANGED BY THE REWIRE"; "reaching past is the defect") | ⚠️ Warning | Both halves false at HEAD. The next reader derives the fail direction from it and does not look for CR-01 — which is exactly what happened between 29-20 and the round's own adversarial pass (WR-01) |
| `scripts/check-foundation-guards.test.ts` | 1030-1031 | A disclosed floor asserting a falsehood about the tree ("which no module in this tree uses today") | 🛑 Blocker (part of gap #4) | The project's named "prose claim wider than the assertion behind it" class, inside the assertion meant to close it |
| `scripts/section-locator-oracle.test.ts` | 401-406 | An invariant asserted 7200 times whose loop body is unreachable in every cell | ⚠️ Warning | The ordering discrimination that makes `unfencedHeadingIndex` correct rather than merely fence-aware is untested; an implementation returning the LAST unfenced match would sweep clean (WR-03) |
| `scripts/section-locator-oracle.test.ts` | 357 | `end >= 0` conjunct is unreachable-false | ℹ️ Info | Dead condition in a file whose subject is invariants that cannot fail (IN-01) |
| `scripts/check-banned-claims.ts` | 530-549 | A `-1` return from the shared locator consumed unguarded | ⚠️ Warning | Would widen a safety exemption from line 0 if the count and locate traversals ever drift; the only site of the pattern that is not guarded (WR-04) |
| `scripts/check-foundation-guards.ts` | 2053-2111 | A guard with no denominator | 🛑 Blocker (part of gap #3) | Zero-byte scan and full scan print the same PASS |
| `scripts/audit-model.ts` | 986 | A private fence recogniser (`trim() === "```"`) beside `fencedLineFlags` in the same module | 🛑 Blocker (part of gap #4) | Disagrees with `FENCE_DELIMITER_LINE` on an info string and on an indented delimiter (WR-02) |
| `.planning/REQUIREMENTS.md` | 79-86, 180-187 | Five stale status marks, in both directions | ⚠️ Warning | A checkbox read as evidence would close a phase with two reproduced fail-open bypasses |

No unresolved debt markers: the single `TBD` hit in the phase's modified source is example text inside
a comment enumerating sentinel spellings a companion-cell check refuses.

### Human Verification Required

**None.** Every gap is mechanically confirmed — direct code read plus, for all four, execution or a
planted input on a hermetic mirror. Nothing here needs subjective or visual judgment.

Recorded for continuity, not as a verification item: the human operator already decided
`reopen-for-survivors` at plan 29-26's blocking checkpoint on 2026-08-15
(`docs/audit/29-locator-unification.md §8`), with the consequence stated there as "gap-closure round 2
does NOT close … Phase 29 is not complete, no LANG requirement is verified or closed by this round."
This report is consistent with that decision and adds the measurement it deferred: **which of the four
previously-failing truths closed (none) and why (four distinct reasons, none of them the reason round
2 gave)**. The four surviving variants V-29-26-01…04 were re-checked and hold as recorded;
V-29-26-04 remains live at 4 indented delimiters in `README.md`.

### Gaps Summary

Four of eight LANG requirements have a live-reproducible defect blocking goal achievement, while all
seven repo gates exit 0 and 1878 tests pass. That is the third consecutive round in which this phase's
green suite and its truth value disagree.

1. **LANG-03 (WR-06 + CR-02, reproduced today).** The round-2 fix pinned the register arm of the D-18
   union on both sides. The registry arm — four members, including `README.md` and `AGENTS.md` — has
   no equality anywhere. Flipping one `kind:` cell drops `README.md` from the exclusion list and the
   watched corpus with every gate green; a fenced example can add a phantom member from the other
   direction.
2. **LANG-04 (WR-05, latent, fail-open).** WP-11 is published as a level-agnostic `decidable` rule and
   decided for `## Steps` alone. The gate enforces a proper subset of the rule the kit publishes, and
   the "one sentence in two artifacts" pin covers the first sentence while the remedy halves already
   disagree.
3. **LANG-06 (CR-01, reproduced today, REGRESSION).** Making the section bound fence-aware reopened
   the phase's founding defect in a shape nobody probed: the caveman fence's own interior is fenced,
   so a heading inside it no longer closes the section, the fence swallows every intervening section,
   and `outside` collapses to the empty string. `guard_voice` then scans zero bytes and prints a PASS
   with no denominator. The identical bytes were refused `unterminated` at 3ed76c1.
4. **LANG-07 (CR-02 + WR-02, reproduced today).** The round deleted five section locators and left a
   sixth in `audit-model.ts` — the module it declared "the fifth and last" — invisible to the owner
   classifier on both arms, with a second private fence recogniser thirty lines away. A fenced example
   parses as a live `kind: safety` registry row. The owner pin is green over a two-owner tree, and the
   classifier's own floor states a falsehood about this tree.

LANG-08 stays closed by the already-authorised `hold-rebaseline` override. **No override is suggested
for LANG-03, LANG-04, LANG-06 or LANG-07:** each is a logic or scope defect with a fix already
sketched, not an intentional deviation with an equivalent alternative implementation. CR-01 in
particular is a regression against a build that was already correct on those bytes, which is the one
category an override must never absorb.

---

_Verified: 2026-08-15T23:20:00Z_
_Verifier: Claude (gsd-verifier)_
