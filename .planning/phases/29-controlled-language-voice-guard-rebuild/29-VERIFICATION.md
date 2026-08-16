---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-16T14:04:14Z
status: human_needed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission. Carried unchanged through rounds 1, 2, 3 and 4 — not new work this round."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
re_verification:
  previous_status: gaps_found
  previous_score: 6/8
  gaps_closed:
    - "LANG-06 — round-4's CR-01 (SEC_VOICE_FILES pinned by CARDINALITY where MEMBERSHIP is meant) is CLOSED, confirmed independently here by running round-4's own successful bypass on both routes. SOURCE route: substituting `agent-factory/workflows/15-security-audit.md` for `agent-factory/checklists/definition-of-ready.md` in `SEC_VOICE_FILES` on a hermetic clone reds two named cases — `the SEC_VOICE roster is pinned two-sided against the guard source` (naming the member that LEFT and the member that ARRIVED as separate lists) and `the SEC_VOICE probe REDS on a SUBSTITUTED member`. COMMITTED-`.js` route: the same substitution applied to `scripts/check-foundation-guards.js` leaves the gate at exit 0 (as round 4 measured) but reds `npm run freshness` at exit 1, naming `scripts/check-foundation-guards.js` as STALE. Both halves reproduced from a clean baseline in this session."
    - "LANG-07 — round-4's V-29-29-01 / WR-08 (a THIRD section-extent grammar, fence-blind AND level-blind, duplicated verbatim in generate-catalog.ts and generate-role-adapters.ts, feeding the generated Claude Code adapter `description` text) is CLOSED. Both private grammars are DELETED and each generator now composes `unfencedHeadingIndex` + `sectionEndIndex(text, at + 1, 2)`, confirmed by direct read at both sites. The closure is proven MECHANICALLY HELD, not merely done: re-planting the historical `new RegExp` lookahead into generate-catalog.ts reds `floor item 1 is a MEASUREMENT` by file:line (`scripts/generate-catalog.ts:115`), and re-planting a DIFFERENTLY-SPELLED private grammar (a regex-literal `/^#{1,2} /` loop with no `new RegExp` at all — an evasion neither the round-4 review nor any round-4 plan named) reds FOUR separate assertions by module name: the owner set, the sixth-locator member probe, the consumer set, and the evasion case."
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
behavior_unverified_items: []
human_verification:
  - test: "Decide whether phase 29 may close with V-29-35-01 open, or whether it must be closed first. Read `docs/audit/29-locator-unification.md` §9.3c and `docs/audit/29-round4-residuals.md` §3, then confirm the disposition: `scripts/generate-catalog.ts:51` declares a private `parseFrontmatter` (`/^---\\n([\\s\\S]*?)\\n---\\n/`, key charset `[A-Za-z_]+`) beside the exported authority at `scripts/frontmatter.ts:3862`, while its sibling generator `generate-role-adapters.ts` imports the authority. Two grammars, one class of bytes."
    expected: "An explicit decision recorded in ROADMAP/REQUIREMENTS: either (a) accept it as a milestone-level residual carried past phase 29, with the reason, or (b) schedule its closure. This verification judges it does NOT falsify success criterion 5 — see the Scope Judgement section below — but the criterion's second clause and the project's D-24 principle read wider than the requirement text, and the round-4 record itself notes the residual set's net movement across round 4 was ZERO (one closed, one opened) and asks the next round to 'read that as the finding it is'. This report is that round."
    why_human: "A scope decision the user already made for round 4, whose stated horizon was the ROUND and not the PHASE. Verification can measure the divergence (round 4 measured 0 key-set differences over 36 governed documents; re-confirmed present in source here) but cannot decide whether the phase is permitted to close with a known duplicated authority still in the tree."
  - test: "Decide whether `guard_banned_claims`'s pinned literal set should grow. Measured empirically in this session on a hermetic clone: appending `This kit conforms to ASD-STE100.` to a governed workflow reds by name (`banned standard-name literal \"ASD-STE100\"`), appending `The writing profile reduces token count.` reds by name (`banned token-economy literal \"reduces token count\"`), but appending `The writing profile improves LLM comprehension.` PASSES — the pinned `comprehension` group holds `improves comprehension` / `improve comprehension` / `comprehension benefit` and four longer phrasings, none of which the interposed `LLM` matches."
    expected: "Either add the phrasing family to `BANNED_CLAIM_LITERALS`'s `comprehension` group with a same-commit count re-pin, or record acceptance of the disclosed bound. Note this is NOT a false claim today: `agent-factory/writing-profile.md`'s honesty floor already states verbatim that 'A brand-new conformance claim written without any of them is not mechanically detectable... it does not prove that no such claim exists', the four refused candidate literals are recorded with their hit counts and reasons, and an independent grep in this session found no such claim anywhere in the kit or public docs."
    why_human: "Where a decidable-subset guard's enumerated set should stop is an editorial judgement, not a verification result. The phase's own governing principle — guards are NAMED for the decidable subsets they check — makes an incomplete literal list legitimate when disclosed, which it is. The ROADMAP success criterion's wording is nonetheless stronger than the profile's disclosure, and the human owns that gap."
---

# Phase 29: Controlled Language & Voice Guard Rebuild — Verification Report (round 5)

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two
agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced
block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-16T14:04:14Z
**Status:** human_needed (0 gaps — the phase goal IS achieved; 2 scope decisions await the human)
**Re-verification:** Yes — fifth verification, after gap-closure round 4 (plans 29-33 … 29-39,
commits `57affa1..10cb212`) executed against round 4's two failed truths (LANG-06, LANG-07) and the
round-4 code review's 13 findings.

---

## Method Note — the premise of every check below, asserted before the check

This phase's recorded failure mode is a **verification harness that produces a false result** — seven
instances across five rounds by the phase's own count, four of them pointing toward the comfortable
conclusion. No premise is assumed here.

1. **No SUMMARY claim, no review claim and no residual-document claim is accepted as evidence.**
   Every load-bearing statement below was re-derived: by direct source read at the cited construct,
   by execution against the committed `.js`, or by planted-input reproduction.
2. **Two independent hermetic environments were used, and their difference mattered.** A
   `git archive HEAD | tar -x` mirror carries no `.git`, so five git-dependent cases in
   `check-foundation-guards.test.ts` fail there for reasons unrelated to any mutation — which would
   have produced a false RED had it been read as a detection. Every mutation experiment below was
   therefore re-run on a `git clone --local` at `10cb212`, where `git ls-tree`/`git show` resolve.
   *This is the first harness premise this round falsified, and it was falsified before it was used.*
3. **Every mutation experiment was baselined first.** A red after a plant is evidence only if the
   same command was green before it. Every plant below carries its own clean baseline.
4. **The live repository was never modified.** Final `git status --porcelain` shows only the
   pre-existing, out-of-scope `human-notes.txt` (M), `.gsd/` (??) and `.planning/phases/29.1-…/` (??).
5. **Freshness asserted before any `.js` reproduction was believed.** `npm run freshness` on a clean
   clone: `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild`, exit 0. Only
   then is a result from the committed `.js` treated as evidence about the `.ts` beside it.
6. **The regression baseline was independently reproduced, not inherited.** `npx vitest run --exclude
   '**/scripts/e2e/**'` on the clean clone: **52 files passed, 2029 passed / 2 skipped**, 125 s. The
   live e2e lane was not run.

**A green suite proves nothing here and is not offered as proof.** It is a floor. Four of the last
four rounds returned `gaps_found` against a green tree. What follows is reproduction, not tallies.

---

## Goal Achievement

### Observable Truths

| # | Truth (LANG-NN) | Status | Evidence — reproduced in this session |
|---|---|---|---|
| 1 | **LANG-01** — grugops-authored, ASD-STE100-**derived** writing profile ships with a non-affiliation / not-certified disclaimer and vendors no ASD dictionary text | ✓ VERIFIED | Direct read of `agent-factory/writing-profile.md`: seven sections, `## The rules` enumerated, `## Technical Names and Technical Verbs`, and `## Disclaimer and honesty floor` stating independent authorship, **derived from** rather than *is*, non-affiliation with ASD and STEMG, and **"No part of the ASD-STE100 specification text is reproduced here, in whole or in part, and no part of its controlled dictionary is included, vendored or redistributed."** Live gate re-run: `LANG-01: 76 Technical Name(s) DERIVED from the kit, never listed — roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13` — a derivation, not a maintained list. |
| 2 | **LANG-02** — the profile governs workflow steps, checklists, memory-bank, shared-context notes, board and traceability, and explicitly NOT the fenced caveman blocks | ✓ VERIFIED | Live gate re-run: `LANG-02: 47 governed document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2 … 47 of 47 opened`. **The four parts were expanded to files rather than accepted as labels:** `seedTemplates` = `agent-factory/seed/memory-bank/*` (9, incl. the ADR template) + `agent-factory/seed/plans/{board,traceability,metrics,nfr-catalog}.md` (4); `contracts` = `context-note.md` + `task-notes.template.md`. Every surface the criterion names is present by derivation. `agent-factory/roles/` is excluded **by name with its reason emitted in the pass line** ("governed by guard_voice, guard_caveman_voice and guard_role_clause_uniqueness … A second predicate over the same bytes from a second module is how two gates come to disagree about one corpus"). |
| 3 | **LANG-03** — a named safety-surface exclusion list is honoured so load-bearing security/compliance/admission text is never reworded by a style pass | ✓ VERIFIED — no regression under round 4's edits | Round 3's own successful bypass was re-run on a clean clone as a **regression probe**, because round 4 rewrote `audit-model.ts` heavily. Flipping `C-28-001`'s `kind: safety` → `kind: architecture` in `docs/audit/28-claim-registry.md` now reds **three independent ways**: `check-audit-register.js` exit 1 with *equality four (safety arm roster)* naming `[C-28-001 -> README.md]` as declared-but-absent, *equality four (kind cardinality)* naming `architecture 28→29, safety 6→5`, and `docs/audit/28-safety-surface-exclusions.md is STALE`; plus `check-diff-disposition.js` exit 1 — *"the registry arm's contribution to the watched corpus is 2 markdown file(s), expected exactly 3"*. Baseline before the plant: both gates exit 0. |
| 4 | **LANG-04** — guards NAMED for exactly the decidable subsets they check; `guard_banned_claims` holds the conformance prohibition mechanically | ✓ VERIFIED — with a disclosed literal-set bound (see human item 2) | Live gate output carries the two names verbatim with their own denominators: `[guard_imperative_lexicon] every '## Steps' bullet begins with a verb from the closed approved set, in bare imperative form, at position zero` → `0 findings over 19/19 elements`; `[guard_sentence_form] sentence length by section anchor — 20 words procedural, 25 descriptive — plus four banned constructions over closed token sets` → `0 findings over 47/47 elements`. `guard_banned_claims`: `82 document(s) … 20 pinned literal(s) across 3 group(s) … 1 exemption region … which suppresses 10 banned-claim occurrence(s), pinned at 10, and reaches 62 line(s), pinned at 62 … 4 candidate literal(s) refused at admission and recorded with their hit counts`. **Discrimination proven by plant, not by pass line:** an ASD-STE100 conformance sentence and a `reduces token count` sentence each red by name and by `file:line:col`. **The exemption region is two-sided:** the same sentence appended INSIDE the disclaimer section reds on BOTH the suppression count (11 vs 10) and the extent (65 vs 62 lines) — the swallow detector fires. WP-04's two-artifact pin re-tested: reverting the profile row to the level-agnostic spelling reds 2 of 62 cases, naming *which half* moved (`profile/wp04`). |
| 5 | **LANG-05** — `## One job`, the caveman block and `## Responsibilities` each say a thing once | ✓ VERIFIED | Live gate: `role clause uniqueness: 0 findings over 17/17 elements`. **Discrimination proven:** appending a 5th `## Responsibilities` bullet to `qe-e2e.md` restating its `## One job` sentence verbatim → `FAIL role clause uniqueness: 1 finding(s) over 17 elements`, gate exit 1. Baseline before the plant: 0/17, exit 0. |
| 6 | **LANG-06** — the rebuilt voice guard fails RED on all 17 blocks as acceptance evidence, measures against a committed lexicon rather than sentence shape, and publishes a number with a denominator | ✓ VERIFIED — all four halves reproduced | See the dedicated section below. Round-4's failed defect (CR-01) is closed on **both** routes; the RED-on-17 acceptance evidence was **re-executed from git history** rather than accepted from `29-01-SUMMARY.md`. |
| 7 | **LANG-07** — the lexicon guards and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes | ✓ VERIFIED — see the Scope Judgement for V-29-35-01 | See the dedicated section below. Exactly **one production fence state machine** in the tree; the third section-extent grammar is DELETED from both generators; and the deletion is proven mechanically held against **two** spellings, one of which no round-4 artifact anticipated. |
| 8 | **LANG-08** — byte ceilings re-baselined exactly once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Carried unchanged from rounds 1–4. **The prohibition half was re-measured here, not accepted:** `roleCeiling()`'s function body extracted from `scripts/check-foundation-guards.ts` at `57affa1^` and at `HEAD` hashes byte-identical, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7` at both ends; `git diff --name-only 57affa1^..HEAD -- agent-factory/roles/` returns **0 files**. No ceiling was raised, lowered or re-baselined by any plan of round 4. The delta is recorded in `docs/audit/29-ceiling-rebaseline.md`. |

**Score:** **8/8 truths verified** — 7 ✓ VERIFIED + 1 ⚠️ PASSED (override). 0 FAILED.
0 present-but-behaviour-unverified.

**This is the first round of five in which no truth fails.** Rounds 1–4 returned 4/8, 4/8, 6/8, 6/8.

---

## LANG-06, in full — the truth round 4 failed, re-derived from zero

Four separate claims live inside this criterion. Each was reproduced independently.

### 6a. The round-4 defect (CR-01) is closed — SOURCE route

`SEC_VOICE_FILES` is the one hand-maintained half of the voice corpus. Round 4 proved a member could
be **substituted** for any other valid-shaped path with every published number holding still.

```
BASELINE (clean clone @10cb212)
  $ npx vitest run scripts/check-foundation-guards.test.ts -t "SEC_VOICE"
    6 passed | 214 skipped

MUTATION — one token, in the .ts SOURCE
  "agent-factory/workflows/15-security-audit.md"  ->  "agent-factory/checklists/definition-of-ready.md"
  (SEC_VOICE_FILE_COUNT left at 2; path shape still agent-factory/**.md)

  FAIL  the SEC_VOICE roster is pinned two-sided against the guard source
        expected [ …(2) ] to deeply equal [ …(2) ]
        +   "agent-factory/checklists/definition-of-ready.md"
        -   "agent-factory/workflows/15-security-audit.md"
  FAIL  the SEC_VOICE probe REDS on a SUBSTITUTED member — the direction a cardinality is blind to
    2 failed | 4 passed
```

The pin names the member that **left** and the member that **arrived** as two separate lists — the
failure describes the defect rather than merely reporting inequality.

### 6b. The round-4 defect is closed — COMMITTED-`.js` route

Round 4's reproduction edited the committed `.js`, which no source-level assertion can see. Plan
29-33 disclosed this and named `npm run freshness` as the covering half. **Re-measured here, on a
mirror, from a clean baseline:**

```
$ npm run freshness                                  # clean mirror
  All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild      exit=0

$ sed -i '' 's|…/15-security-audit.md|…/definition-of-ready.md|' scripts/check-foundation-guards.js
$ node scripts/check-foundation-guards.js                                          exit=0   (as round 4 measured)
$ npm run freshness
  STALE: scripts/check-foundation-guards.js — committed build output differs from a fresh tsc rebuild.
  Freshness check FAILED: 1 stale build output(s) detected.                        exit=1
```

Both routes are covered. Neither closure was accepted from a SUMMARY.

### 6c. "Measures against a committed lexicon rather than sentence shape"

`CAVEMAN_LEXICON` (16 terms) and `CAVEMAN_LEXICON_MIN = 2` are committed in `scripts/voice-model.ts`.
**Discrimination proven by plant:** replacing `qe-e2e.md`'s caveman interior with three grammatically
clean, lexicon-free sentences —

```
  qe-e2e.md: tokens 0 / content words 22, banned 10
  FAIL  caveman voice: 1 finding(s) over 17 elements                gate exit=1
```

The measurement is *lexicon membership and banned-construction count*, not sentence length. Baseline
for the same file before the plant: `tokens 3 / content words 19, banned 0`.

**Fail-closed on a malformed fence, re-confirmed:** deleting the closing fence delimiter and planting
a caveman marker into a later section (round 3's bypass class) produces
`## Caveman prompt fence refused — reason unterminated; the clear-voice remainder was not determined,
so this file was NOT scanned` on **both** voice guards, gate exit 1. It does not fail open.

### 6d. "Fails RED on all 17 current caveman blocks as acceptance evidence before the rewrite lands"

This is a historical ordering claim, and it was **re-executed rather than read**. The guard first
appears in `73f67c6` (plan 29-01); `3cea7ce` is the accompanying record. The voice rewrite lands
later, in plans 29-05…07. Extracting the tree at `3cea7ce` and running **that tree's own guard
against that tree's own role corpus**:

```
$ git archive 3cea7ce | tar -x -C $MIR && cd $MIR && node scripts/check-foundation-guards.js
  PASS  voice: clear-voice surfaces free of caveman markers
  FAIL  caveman voice: 17 finding(s) over 17 elements                exit=1
```

**17 findings over 17 elements, before the rewrite, reproduced from git.** The acceptance evidence is
a fact about the repository, not a transcript in a SUMMARY.

### 6e. "Publishes a number with a denominator"

Live: `voice: 0 findings over 19/19 elements` and `caveman voice: 0 findings over 17/17 elements`,
plus round 4's WR-05 addition — a per-file four-number accounting reconciled by three named refusals:
`qe-e2e.md: scanned 45 clear-voice line(s), 0 marker line(s), caveman region 6 line(s), document 51
line(s)`, with `outsideLines + removedLines !== documentLines` an explicit refusal in the guard.

---

## LANG-07, in full — one parser, and how hard that was pushed

### 7a. Exactly one production fence state machine

`FENCE_MACHINES` in `scripts/frontmatter.test.ts` is **derived** over tracked `.ts` files, sorted, and
pinned two-sided at 3 with a cardinality floor: `scripts/frontmatter.ts`,
`scripts/check-foundation-guards.test.ts`, `scripts/generate-role-adapters.test.ts`. **Two of the
three are TEST files carrying deliberate plants** — the single *production* fence machine is
`scripts/frontmatter.ts`. `voice-model.ts` matches neither classifier arm: it *composes*
`FENCE_DELIMITER_LINE` rather than forking the machine.

Consumers confirmed by direct read: `check-imperative-lexicon.ts` (which hosts **both**
`guard_imperative_lexicon` and `guard_sentence_form`) imports `fencedLineFlags` +
`unfencedHeadingIndex` from `frontmatter.ts` and `BANNED_CONSTRUCTIONS` from `voice-model.ts`;
`check-foundation-guards.ts` (which hosts `guard_voice` and `guard_caveman_voice`) imports
`readCavemanFence` from `voice-model.ts`, which itself consumes `frontmatter.ts`. **The three guards
the criterion names read the fence through one parser.**

### 7b. The third section-extent grammar is deleted — and the deletion is mechanically held

Direct read at both former sites confirms the private `new RegExp` lookahead is gone and each
generator now composes the authority:

```ts
// scripts/generate-catalog.ts:114   AND   scripts/generate-role-adapters.ts:159 — identical, deliberately
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
}
```

**Deletion is not the finding — enforcement is.** Two plants, both from a clean 13-passing baseline:

| plant | result |
|---|---|
| the **historical** grammar re-introduced verbatim (`new RegExp(\`^## ${heading}\\n([\\s\\S]*?)(?=\\n## \|$(?![\\s\\S]))\`, "m")`) | **RED** — `floor item 1 is a MEASUREMENT: every \`new RegExp\`-built section bound in the tree is derived and named` → `expected [ 'scripts/generate-catalog.ts:115' ] to deeply equal []`. Caught **by file and line**. |
| a **differently-spelled** private grammar — a regex-**literal** `/^#{1,2} /` loop with **no `new RegExp` anywhere** (an evasion no round-4 review finding, plan or SUMMARY names) | **RED, four ways** — `the OWNER set is derived tree-wide … expected [ 'scripts/frontmatter.ts', …(1) ]`; `a SIXTH section locator makes the owner set fail, BY NAME`; `the CONSUMER set … no module may both declare a section-extent predicate and import the shared one`; `the six evasions … must not have made a new module an owner`. Every message names `scripts/generate-catalog.ts`. |

The second plant is the load-bearing one. This phase's recurring lesson is that a predicate's **set**
is the degree of freedom nobody derives. The owner classifier was attacked on the axis the round's own
artifacts did not cover, and it held.

### 7c. Scope Judgement — V-29-35-01, stated plainly as requested

**The finding is real and present.** `scripts/generate-catalog.ts:51` declares a private
`parseFrontmatter` (`/^---\n([\s\S]*?)\n---\n/`, key charset `[A-Za-z_]+`) beside the exported
authority at `scripts/frontmatter.ts:3862`. Confirmed by direct read here. Its sibling generator
`generate-role-adapters.ts` imports the authority (line 78). Two grammars parse one class of bytes.
Round 4 measured 0 key-set differences over 36 governed documents; it was recorded, not fixed, out of
scope by explicit user decision.

**My judgement: the scope decision does NOT leave success criterion 5 unmet, and here is why —
stated so it can be challenged rather than deferred to.**

Criterion 5's clause reads: *"`guard_imperative_lexicon` (with its sibling `guard_sentence_form`) and
the rebuilt voice guard read the fence through **one** parser, never two grammars over the same
bytes."* `REQUIREMENTS.md` LANG-07 is narrower still: *"…share **one** fence parser."* Both sentences
take the same subject — **those three guards**, and **the fence**. `generate-catalog.ts` is not one of
those guards, and `parseFrontmatter` is not the fence or the section extent. The criterion as written
is met, and §7a/§7b are its evidence.

**And here is what that judgement does not cover, said plainly.** The project's own D-24 principle —
one authority per predicate, tree-wide — reads wider than this criterion, and the tree violates it at
exactly one measured site. The round-4 record makes the point better than I can: *"a round that closes
a duplicated grammar and opens a duplicated parser has not reduced the number of duplicated
authorities in the tree — it has moved the duplication one level down. The next round should read that
as the finding it is."* This is that round, and I read it as the finding it is: **not a phase-29
blocker, but an open D-24 violation that must be carried forward by an explicit decision rather than
absorbed by the phase closing.** That is human verification item 1, and it is the reason this report is
`human_needed` rather than `passed`.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/writing-profile.md` | Enumerated rules, derived Technical Names, non-affiliation + not-certified disclaimer, no vendored dictionary | ✓ VERIFIED | 7 sections; disclaimer explicit on all four points; honesty floor discloses the guard's own bound |
| `scripts/frontmatter.ts` | The ONE section-locator + fence-machine authority | ✓ VERIFIED | Sole production fence machine (derived, pinned at 3 with two test-file plants); `unfencedHeadingIndex` / `sectionEndIndex` consumed by 8 modules |
| `scripts/voice-model.ts` | Single section-bounded caveman-fence reader + committed lexicon | ✓ VERIFIED | `readCavemanFence` fails closed on `unterminated` at both heading levels; `CAVEMAN_LEXICON` 16 terms, `CAVEMAN_LEXICON_MIN` 2; publishes `outsideLines`/`removedLines` |
| `scripts/check-foundation-guards.ts` | `guard_voice`, `guard_caveman_voice`, `guard_role_clause_uniqueness`, `roleCeiling()` | ✓ VERIFIED | All three publish findings-over-denominator; all three proven to discriminate by plant; `roleCeiling()` byte-identical across round 4 |
| `scripts/check-foundation-guards.test.ts` | `SEC_VOICE_MEMBERS` roster + per-member derived-property floor + substitution arm; section-extent owner scan; tripwire census | ✓ VERIFIED | Roster reds on substitution; owner scan reds on two independent grammar spellings; census relationships each have a named witness |
| `scripts/check-imperative-lexicon.ts` | `guard_imperative_lexicon` + `guard_sentence_form`, named for their decidable subsets | ✓ VERIFIED | Both names emitted with their own denominators (19/19, 47/47); no private fence or section grammar |
| `scripts/check-banned-claims.ts` | Mechanical conformance / token-economy / comprehension prohibition | ✓ VERIFIED (bound disclosed) | 20 literals, 3 groups, 82 docs; exemption region pinned two-sided on count AND extent; 4 refused candidates recorded with hit counts |
| `scripts/generate-catalog.ts` | No private section-extent grammar | ✓ VERIFIED / ⚠️ private `parseFrontmatter` remains | `sectionBody` composes the authority; `parseFrontmatter` at `:51` is V-29-35-01 (human item 1) |
| `scripts/generate-role-adapters.ts` | No private section-extent grammar; imports the authority | ✓ VERIFIED | `sectionBody` composes the authority; `parseFrontmatter` imported from `frontmatter.js` |
| `docs/audit/29-round4-residuals.md` | Round-4 disposition record, 13 rows, no silent drops | ✓ VERIFIED | 9 closed with re-run reproduction, IN-01..IN-04 deferred by named user decision; residual roll-up carries BOTH directions |
| `docs/audit/29-locator-unification.md` | §9.3a/b/c amendment + closure + escalation | ✓ VERIFIED | §9.3b records both deletions and the byte-identical artifact proof; §9.3c records V-29-35-01 with its measurement |
| `docs/audit/29-ceiling-rebaseline.md` | The LANG-08 delta record | ✓ VERIFIED | Present; prohibition half re-measured here by hash |

---

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-imperative-lexicon.ts` | `frontmatter.ts` | `fencedLineFlags`, `unfencedHeadingIndex`, `sectionEndIndex` | ✓ WIRED | Both lexicon guards read the one fence machine; no private grammar |
| `check-foundation-guards.ts` | `voice-model.ts` → `frontmatter.ts` | `readCavemanFence`, `CAVEMAN_LEXICON` | ✓ WIRED | Fence reader composes the authority's delimiter class |
| `generate-catalog.ts` | `frontmatter.ts` | `unfencedHeadingIndex` + `sectionEndIndex` | ✓ WIRED | Verified by re-plant: bypassing this link reds 4 named assertions |
| `generate-role-adapters.ts` | `frontmatter.ts` | `unfencedHeadingIndex`, `sectionEndIndex`, `parseFrontmatter` | ✓ WIRED | Adapter `description` (which drives auto-routing) derives through the authority |
| `check-foundation-guards.ts` (`SEC_VOICE_FILES`) | `check-foundation-guards.test.ts` (`SEC_VOICE_MEMBERS`) | source-byte parse, two-sided roster | ✓ WIRED | Substitution reds; `npm run freshness` covers the `.js` route |
| `check-audit-register.ts` / `check-diff-disposition.ts` | `docs/audit/28-claim-registry.md` | `kind: safety` → D-18 union | ✓ WIRED | Registry-arm flip reds both gates, three findings |
| `check-imperative-lexicon.ts` | `agent-factory/writing-profile.md` | WP-11 / WP-04 two-artifact anchor pin (6 members) | ✓ WIRED | Reverting the profile row reds 2 cases naming which half moved |

---

## Data-Flow Trace (Level 4)

| Artifact | Value | Source | Produces real data | Status |
|---|---|---|---|---|
| `guard_voice` pass line | `19/19 elements` | `ROLE_COUNT` (derived from `kit-model.ts`) + `SEC_VOICE_FILE_COUNT` | Yes — reds at 18/19 and 20/19 | ✓ FLOWING |
| `guard_caveman_voice` per-block line | `tokens N / content words M, banned K` | `countLexiconTokens` over `CAVEMAN_LEXICON` | Yes — plant produced `tokens 0 … banned 10` | ✓ FLOWING |
| `guard_voice` per-file accounting | `scanned / marker / region / document` line counts | `readCavemanFence`'s `outsideLines`/`removedLines` | Yes — reconciled by an explicit refusal | ✓ FLOWING |
| `LANG-01` Technical Names | `76` | 5 derived kit lists, never a literal roster | Yes — enumerated at run time | ✓ FLOWING |
| `LANG-02` governed corpus | `47 in 4 derived parts` | `readdir`-derived, expanded to files here | Yes — all 47 opened; membership matches the criterion's named surfaces | ✓ FLOWING |
| tripwire census | `modules/occurrences/classified/…` | real scan over `testModules()` | Yes — real counter mutations move it (below) | ✓ FLOWING |
| `SECTION_EXTENT_OWNERS` | `["scripts/frontmatter.ts"]` | tree-wide recursive derivation + vacuity floor | Yes — a plant adds a member | ✓ FLOWING |

---

## Behavioural Spot-Checks — every one a plant, from a clean baseline

| # | Behaviour under test | Plant | Result | Status |
|---|---|---|---|---|
| 1 | `SEC_VOICE` membership (round-4 CR-01) | substitute one member in the `.ts` | 2 named cases RED, member-in / member-out reported separately | ✓ PASS |
| 2 | `SEC_VOICE` `.js`-only route | substitute one member in the committed `.js` | gate exit 0, **`npm run freshness` exit 1**, file named STALE | ✓ PASS |
| 3 | section-extent authority, historical spelling | re-plant the deleted `new RegExp` grammar | RED at `scripts/generate-catalog.ts:115` | ✓ PASS |
| 4 | section-extent authority, **unanticipated** spelling | plant a regex-literal `/^#{1,2} /` loop, no `new RegExp` | RED in 4 assertions, module named | ✓ PASS |
| 5 | committed-lexicon voice measurement | lexicon-free clean prose inside a caveman fence | `tokens 0 / content words 22, banned 10`, exit 1 | ✓ PASS |
| 6 | fence fail-closed | delete the closing delimiter + plant a marker downstream | both voice guards refuse `unterminated`, exit 1 | ✓ PASS |
| 7 | clause uniqueness | duplicate `## One job` into `## Responsibilities` | `1 finding(s) over 17 elements`, exit 1 | ✓ PASS |
| 8 | conformance prohibition | `This kit conforms to ASD-STE100.` in a governed workflow | RED, literal + `file:line:col` named | ✓ PASS |
| 9 | token-economy prohibition | `The writing profile reduces token count.` | RED, literal named | ✓ PASS |
| 10 | comprehension prohibition | `The writing profile improves LLM comprehension.` | **PASS (not caught)** — unpinned phrasing; bound disclosed in the profile | ⚠️ see human item 2 |
| 11 | exemption-region swallow detector | banned sentence appended inside the disclaimer section | RED on **both** the suppression count and the extent | ✓ PASS |
| 12 | LANG-03 registry arm (regression probe) | flip `C-28-001` `kind: safety`→`architecture` | 3 findings across 2 gates, both exit 1 | ✓ PASS |
| 13 | WP-04 two-artifact pin (WR-06) | revert the profile row to level-agnostic | 2 cases RED, `profile/wp04` named | ✓ PASS |
| 14 | **tripwire census premise** — B5 | actually break `subjectOpenPastLine` to return `false` | `R6 the continuing-SUBJECT share fell below 2% (0 of 5533)` — **the exact id the transcribed row predicts** | ✓ PASS |
| 15 | **tripwire census premise** — B3 | actually break `parenBalanceNaive` to return `0` | `R4` fires (plus R5, R7) — matches the transcribed row's `toContain("R4")` | ✓ PASS |
| 16 | **tripwire census premise** — B4 | actually break `parenBalanceQuoteAware` to return `0` | `R7` fires — matches the transcribed row | ✓ PASS |
| 17 | LANG-06 acceptance evidence | run the 29-01-era guard on the 29-01-era corpus | `FAIL caveman voice: 17 finding(s) over 17 elements`, exit 1 | ✓ PASS |
| 18 | LANG-08 prohibition half | hash `roleCeiling()` body at `57affa1^` and `HEAD` | byte-identical; 0 role files touched | ✓ PASS |

**On checks 14–16.** Round 4's largest new surface is WR-07's conversion of six exact-equality census
pins to corpus-derived rate floors — precisely the kind of change that can trade discrimination for
quiet. Its discrimination case proves seven breakages against **transcribed** census numbers, which is
a harness premise nobody had asserted. I asserted it: three counters were **actually mutated in
source** and each produced the exact rule id its transcribed row claims. The case's own
`"the live tree must be clean before either population means anything"` guard is what caught them —
the premise assertion works. The conversion did not cost discrimination.

---

## Probe Execution

No `scripts/*/tests/probe-*.sh` files exist in this repository and no PLAN or SUMMARY of this phase
declares one; this project's equivalent mechanism is the seven repo gates plus the vitest harness,
all executed above. **Step 7c: SKIPPED (no probe scripts in this repository).** The round-4
`probe_coverage` arithmetic (22 surfaced = 9 authored + 11 attributed + 2 flagged planner
assumptions) is a planning artifact recorded in `docs/audit/29-round4-residuals.md` §5, including the
LANG-07 assumption the round itself records as **partly falsified**. That honesty is noted, and it is
the reason human item 1 exists.

---

## Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-02, 29-03, 29-31 | ASD-STE100-derived profile + disclaimer, no vendored dictionary | ✓ SATISFIED | Truth 1 |
| LANG-02 | 29-08..29-12, 29-24 | Profile applied to procedural surfaces, not to caveman blocks | ✓ SATISFIED | Truth 2 (all 4 derived parts expanded to files) |
| LANG-03 | 29-04, 29-28, 29-30, 29-37 | Named safety-surface exclusion list honoured | ✓ SATISFIED | Truth 3 (round-3 bypass now reds 3 ways) |
| LANG-04 | 29-02, 29-14..29-18, 29-31, 29-38 | Guards named for the decidable subset; conformance prohibition mechanical | ✓ SATISFIED | Truth 4; literal-set bound disclosed → human item 2 |
| LANG-05 | 29-05, 29-06, 29-07 | Role skeleton de-duplicated | ✓ SATISFIED | Truth 5 |
| LANG-06 | 29-01, 29-20, 29-27, 29-33, 29-34 | Voice guard measures lexicon, RED on 17 first | ✓ SATISFIED | Truth 6, all four halves reproduced |
| LANG-07 | 29-21..29-26, 29-29, 29-35, 29-36 | One fence parser, never two grammars | ✓ SATISFIED | Truth 7; V-29-35-01 → human item 1 |
| LANG-08 | 29-13, 29-19 | Ceilings re-baselined once, never raised mid-phase | ⚠️ SATISFIED via override | Truth 8; prohibition half re-measured by hash |

**No orphaned requirements.** `.planning/REQUIREMENTS.md` maps exactly LANG-01..LANG-08 to Phase 29
and every one is claimed by at least one executed plan.

**Traceability bookkeeping lag — for the human, not a gap.** `.planning/REQUIREMENTS.md`'s status
table still reads `Gaps Found` for LANG-01/03/04/05/06/07 and `Pending` for LANG-02/08, and the
checklist at lines 79–86 is entirely `[ ]`. All seven round-4 executors **deliberately declined** to
mark their requirement complete, leaving the decision to this verification. Per this report all eight
now resolve; the table and checklist should be updated once the two human items are dispositioned.

---

## Anti-Patterns Found

Scanned all 35 files changed in `57affa1^..HEAD` (22 non-`.planning/`).

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/audit-model.test.ts` | 476, 478 | literal `TBD` | ℹ️ Info | **Not a debt marker.** Test fixture data: `rowA(…, "TBD")` is an invalid cell value planted to prove `readRegister` throws, and `/TBD/` is the assertion that it does. The debt-marker gate does not apply to a fixture whose subject is the rejected string. |

**No `FIXME`, no `XXX`, no unreferenced `TBD` in any file changed by this phase.** No stub returns, no
hardcoded empty data reaching output, no console-log-only implementation.

**Two pre-existing executor-level deferrals are recorded, not dropped**, in
`.planning/phases/…/deferred-items.md`: **D-38-1** (`FORM_REMEDY` spells the procedural bound as a
literal `20` beside `PROCEDURAL_SENTENCE_MAX_WORDS` — the set-literal-drift class one string over) and
**D-38-2** (`docs/audit/29-locator-unification.md:34` cites three stale line numbers, all three
re-measured as wrong on today's tree). **D-38-3** is a workflow finding (a SUMMARY's frontmatter is
written after the run that would catch it; it bit this round twice, at `84b0f4b` and `dd16917`). All
three are minor, disclosed, and none touches a truth.

---

## Deferred Items

Round 4's four user-deferred findings (**IN-01** the scan-scope shortfall asserts an identity;
**IN-02** the claim-heading recogniser matches every single-token level-three heading; **IN-03** the
pass line computes the registry residue a third way; **IN-04** `headingShapedFenced` is published but
never asserted) are recorded in `docs/audit/29-round4-residuals.md` §2 with, for each, its location
re-measured on today's tree, its risk if never closed, and whether it is live or latent. Each is
fail-closed or latent with 0 live occurrences. **None is deferred to a later milestone phase** —
Phase 29.1 (per-role model assignment) touches `generate-role-adapters.ts`'s frontmatter emitter and
addresses none of them — so they are not listed in the `deferred` frontmatter block. They are
**decisions already taken by the user**, not gaps this round found, and they do not affect any truth.

---

## Human Verification Required

### 1. Decide whether phase 29 may close with `V-29-35-01` open

**Test:** Read `docs/audit/29-locator-unification.md` §9.3c and `docs/audit/29-round4-residuals.md`
§3, then confirm by direct read: `scripts/generate-catalog.ts:51` declares a private
`parseFrontmatter` beside the exported authority at `scripts/frontmatter.ts:3862`, while the sibling
generator imports the authority.

**Expected:** An explicit recorded decision — accept it as a milestone-level residual carried past
phase 29 with the reason, or schedule its closure. This report judges it does **not** falsify success
criterion 5 (§7c), and says equally plainly that it **does** violate the project's wider D-24
principle, that round 4's net residual movement was zero, and that the round-4 record itself asks the
next round to read that as a finding.

**Why human:** The user scoped this out for **round 4**. The phase is now closing. Whether a
round-scoped deferral survives phase closure is a decision, not a measurement.

### 2. Decide whether `guard_banned_claims`'s pinned literal set should grow

**Test:** Append `The writing profile improves LLM comprehension.` to any governed workflow file and
run `npm run check:banned-claims`. It passes. Compare against `This kit conforms to ASD-STE100.` and
`The writing profile reduces token count.`, which both red by name.

**Expected:** Either add the phrasing family to `BANNED_CLAIM_LITERALS`'s `comprehension` group with
a same-commit re-pin of the affected counts, or record acceptance of the disclosed bound. **This is
not a live false claim:** an independent grep across `agent-factory/`, `README.md`, `docs/catalog/`,
`install/` and `AGENTS.md` found no comprehension claim in any spelling, and the only near-hit
(`Maximum token win` in `18-context-compaction.md`) is one of the four candidate literals **refused at
admission with a recorded reason** — it describes a dial that genuinely sends less text, not a claim
about the writing profile.

**Why human:** Where a decidable-subset guard's enumerated set should stop is editorial. The profile's
honesty floor already discloses this exact bound verbatim; the ROADMAP criterion's wording is stronger
than that disclosure, and the human owns the difference.

---

## Gaps Summary

**There are none.** For the first time in five verification rounds, no truth fails.

Round 4 was asked to close two failed truths and 13 review findings. Both truths close, and both
closures were re-derived here from a clean baseline rather than accepted:

- **LANG-06** closes on **both** routes its own defect had — the source-level membership roster reds
  on a substitution and names which member left and which arrived, and `npm run freshness` reds on the
  `.js`-only route the source pin cannot see. Its three other halves were verified independently,
  including re-executing the RED-on-17 acceptance evidence **from git history** at `3cea7ce` rather
  than reading it out of a SUMMARY.
- **LANG-07** closes and is **held**. The third section-extent grammar is deleted from both
  generators, and the enforcement was attacked on an axis no round-4 artifact covers — a private
  grammar written as a regex *literal* rather than through `new RegExp` — where it red four ways by
  module name. That is the difference between "the fix landed" and "the prohibition holds."

**One thing this round did that the previous four did not: it asserted the premise of the round's own
newest harness.** WR-07's rate-floor conversion proves its discrimination against transcribed census
numbers. Three of those counters were actually mutated in source here, and each produced exactly the
rule id its transcribed row claims. Given that this phase has now had seven harness-produced false
results across five rounds — four of them agreeing with the comfortable answer — that check was the
one most worth running, and it held.

**What remains is not a gap; it is a decision.** `V-29-35-01` is a duplicated *frontmatter* parser,
one level below the *section-extent* duplication that round 4 deleted. It is measured at zero live
divergence, disclosed by name in two audit documents, and out of scope by the user's own round-4
decision. It does not falsify the criterion as written. It does mean the tree still carries one
duplicated authority, and the phase should not close by pretending otherwise — which is why this
report is `human_needed` and not `passed`.

---

_Verified: 2026-08-16T14:04:14Z_
_Verifier: Claude (gsd-verifier), round 5 — adversarial re-verification after gap-closure round 4_
_All reproductions run on `git clone --local` / `git archive` mirrors at `10cb212`; live repository unmodified_
