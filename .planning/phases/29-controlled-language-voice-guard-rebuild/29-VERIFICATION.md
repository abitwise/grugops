---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-16T05:20:00Z
status: gaps_found
score: 6/8 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission. Carried unchanged through rounds 1, 2 and 3 — not new work this round."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
re_verification:
  previous_status: gaps_found
  previous_score: 4/8
  gaps_closed:
    - "LANG-03 — round-2's WR-06 (registry arm of the D-18 safety-surface union unpinned) is CLOSED, confirmed independently here by reproducing round-2's own successful bypass on a hermetic mirror: flipping C-28-001's `kind: safety` to `kind: architecture` now reds check-audit-register.js (exit 1, 'equality four (safety arm roster)') and check-diff-disposition.js (exit 1, 'the registry arm's contribution ... is 2 markdown file(s), expected exactly 3'), where round 3 measured both exiting 0. CR-02 (readRegistry fence-blind) is likewise closed."
    - "LANG-04 — round-3's WR-05 (WP-11 published wider than STEPS_HEADING decides) is CLOSED: WP-11's profile text and the gate's decided spelling are now both `## Steps`, level-two only, held by a four-member two-sided pin with a four-mutation falsifiability probe. WP-04's row was narrowed to the same spelling in the same edit, though (per round-4 review's WR-06) it is not independently pinned the way WP-11 is — recorded as a residual, not a live mismatch (verified by direct read: no drift exists on the current tree)."
  gaps_remaining:
    - "LANG-06 — round-3's specific defect (SECTION_END recognising only a level-two heading, then the fence-aware rewrite's own fail-open regression on a fence left open across a later heading) IS fixed and independently re-confirmed here (bounded read, both heading levels refuse `unterminated`). The truth still fails on a DIFFERENT, NEW defect the same round's own fix introduced: `SEC_VOICE_FILES` — the one hand-maintained half of the voice-guard scan set — is pinned by CARDINALITY (`SEC_VOICE_FILE_COUNT = 2`) where MEMBERSHIP is what matters. A one-token substitution (replace one member path with any other existing markdown path) leaves every published number unchanged and drops the real security surface out of the scan entirely. Reproduced end to end here, independently of round-4's `29-REVIEW.md` CR-01, on a hermetic `git archive HEAD` mirror."
    - "LANG-07 — round-3's specific defect (WR-08: four disagreeing private section-end predicates across voice-model.ts / check-diff-disposition.ts / check-banned-claims.ts / check-imperative-lexicon.ts) IS closed structurally: one authority in frontmatter.ts, five consumers, confirmed by direct read. Plan 29-29 itself surfaced and ESCALATED (not closed) a further violation of the same must-have while deriving the closure's own falsifiability floor: `sectionBody` in scripts/generate-catalog.ts:87 and scripts/generate-role-adapters.ts:127 is a THIRD, independently-maintained, fence-blind AND level-blind section-extent grammar, duplicated verbatim between the two generators, confirmed present in source by direct read here. Its output feeds the generated Claude Code role adapters and the kit catalogue (description / 'Use when' / 'One job' text), so it is not a dead code path. LANG-07's literal text is 'never two grammars over the same bytes' — the tree currently has three."
  regressions: []
gaps:
  - truth: "LANG-06 — the rebuilt voice guard measures voice against a committed lexicon (i.e. reliably identifies which bytes are the caveman block)"
    status: failed
    reason: >
      Round 3's CR-01 (a caveman fence left open across a later heading swallowing subsequent
      sections and driving `outside` to the empty string) is fixed and independently reconfirmed
      here by direct read of `voice-model.ts` and by re-running `readCavemanFence` against both the
      round-3 bypass bytes (now `{ok:false, reason:"unterminated"}` at both `#` and `##` levels) and
      the live corpus (`outside` non-empty on all 17 role files). But round 3's own fix
      (`SEC_VOICE_FILE_COUNT`, plan 29-27) introduced a new, independently reproduced fail-open
      bypass in the same guard's scan-SET, rather than in the fence reader. `SEC_VOICE_FILES` is the
      one hand-maintained half of `VOICE_FILES` (the other half is derived from `kit-model.ts`'s role
      list). Its declaration states the remedy is "the one already used for the role half: DECLARE
      the number, then compare the DERIVED set against it" — but there is no derived set for this
      half to compare against; what actually ships is a cardinality (`SEC_VOICE_FILE_COUNT = 2`) plus
      a path-shape assertion (`startsWith("agent-factory/") && endsWith(".md")`), neither of which
      changes when one member is SUBSTITUTED for another existing markdown path. Reproduced here
      end-to-end on a hermetic `git archive HEAD` mirror, independently of `29-REVIEW.md`'s CR-01:
      a caveman marker was planted into `agent-factory/workflows/15-security-audit.md`; the unmodified
      guard (built from the committed `.js`) correctly reds (`FAIL voice: 1 finding(s) over 19
      elements`); a `.js` with ONE token substituted (`15-security-audit.md` replaced by
      `agent-factory/checklists/definition-of-ready.md` in `SEC_VOICE_FILES`, count left at 2) drops
      the contaminated file from the scan entirely and reports `PASS voice: 0 findings over 19/19
      elements`, and the full gate exits 0. This is the phase's own founding failure class (a
      hand-maintained scan set drifting silently while every published number holds still) recurring
      inside the fix built to close a different instance of it in the same file.
    artifacts:
      - path: "scripts/check-foundation-guards.ts"
        issue: "SEC_VOICE_FILES (:1985) / SEC_VOICE_FILE_COUNT (:2002) pin cardinality only; no mechanism (reportMeasured visited/expected, secVoicePinMismatch, the path-shape assertion, or EXPECTS_CAVEMAN_FENCE) detects a member SUBSTITUTED for another valid-shaped path (CR-01 in round-4 29-REVIEW.md, independently reproduced here)"
    missing:
      - "Pin the MEMBERS, not the count, the way SAFETY_CLAIM_HOMES already does for the analogous D-18 registry arm: assert secVoiceMembers equals a declared, sorted roster, two-sided"
      - "Add a substitution arm to the falsifiability probe beside the existing add/remove arms in check-foundation-guards.test.ts (a member REPLACED, not only added or removed)"
      - "Correct the declaration comment at check-foundation-guards.ts:1990-2001: there is no derived set for this half to compare against, and asserting there is repeats the class this pin exists to prevent"
  - truth: "LANG-07 — guard_imperative_lexicon (with its sibling guard_sentence_form) and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes"
    status: failed
    reason: >
      Round 3's WR-08 (four disagreeing private section-end predicates in voice-model.ts,
      check-diff-disposition.ts, check-banned-claims.ts, check-imperative-lexicon.ts) is closed
      structurally, confirmed here by direct read: `frontmatter.ts` exports `unfencedHeadingIndex` /
      `sectionEndIndex` as one authority, five modules consume it, and the four private predicates
      are deleted. But the closure round's own plan (29-29), while deriving the falsifiability floor
      for that closure, measured and explicitly ESCALATED (not absorbed) a further, independent
      violation of the same must-have: `sectionBody`, duplicated verbatim in
      `scripts/generate-catalog.ts:87` and `scripts/generate-role-adapters.ts:127`, answers "where
      does this `## ` section end" through a private `new RegExp(...)` whole-document lookahead
      (`(?=\\n## |$(?![\\s\\S]))`), independent of `frontmatter.ts`'s authority. It is BOTH fence-blind
      (a `## ` line quoted inside a fenced example inside a role or workflow file terminates the
      capture early) AND level-blind (the terminator is `\\n## ` only — a level-one heading does not
      close the section — the identical level-axis defect that cost this phase plans 29-14 and 29-20
      in `voice-model.ts`). Confirmed present in source by direct read here at both cited line
      numbers, byte-identical between the two files. This is not a dead or cosmetic path: its output
      becomes the `description` / `Use when` / `One job` text in the generated Claude Code role
      adapters (`generate-role-adapters.ts:274,280`) and the catalogue rows
      (`generate-catalog.ts:133,177`), consumed by `npm run freshness:adapters`. LANG-07's must-have
      text is literally "never two grammars over the same bytes"; the tree currently ships three
      section-extent grammars (the shared authority, plus this one duplicated in two files) reading
      the same class of bytes. Live reachability is 0 today (0 fenced `## ` lines and 0 post-section
      level-one headings across the governed corpus, measured), matching this phase's recurring
      "correct today, unmeasured forever" pattern.
    artifacts:
      - path: "scripts/generate-catalog.ts"
        issue: "sectionBody (:80-86) is a third, private, fence-blind, level-blind section-extent grammar, duplicated verbatim in generate-role-adapters.ts (V-29-29-01 / WR-08 in round-4 29-REVIEW.md, confirmed present by direct read here)"
      - path: "scripts/generate-role-adapters.ts"
        issue: "sectionBody (:122-128) is the second copy of the same private grammar; its output feeds generated adapter description/Use-when/One-job text"
    missing:
      - "Delete the third grammar rather than widening the owner classifier to tolerate it: replace both sectionBody definitions with one call each to unfencedHeadingIndex + sectionEndIndex(text, at + 1, 2), per the fix already sketched in docs/audit/29-locator-unification.md §9.3"
      - "Re-derive and re-pin the section-extent-owner set after the fix, and require the existing planted-sixth falsifiability probe (or its successor) to still discriminate against a re-introduced private copy"
      - "Add a permanent case (in generate-catalog.test.ts / generate-role-adapters.test.ts, or a shared oracle) planting a fenced ## line and a post-section level-one heading inside a role/workflow fixture, asserting the intended (non-truncated, non-swallowed) section body"
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 29: Controlled Language & Voice Guard Rebuild — Verification Report (round 4)

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two
agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced
block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-16T05:20:00Z
**Status:** gaps_found
**Re-verification:** Yes — fourth verification, after gap-closure round 3 (plans 29-27 … 29-32,
commits `3c40d0e..HEAD`) executed against round 3's four gaps (LANG-03, LANG-04, LANG-06, LANG-07).

## Method Note — what this round checked and how

The round-3 baseline is preserved at `29-VERIFICATION-round2.md`'s companion file (round 3's own
report is what this file replaces on disk; round 3's content is fully reproduced in the git history
at `29-VERIFICATION.md` prior to this write). This report does not accept any SUMMARY's or the
round-4 code review's claims (`29-REVIEW.md`) without independent confirmation of every load-bearing
statement:

1. **Direct source read** at the cited line numbers, for every artifact and every closure claim.
2. **Execution against the committed `.js`** — `npm run freshness` was run first and reports "All
   build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild," so a reproduction against
   the `.js` is evidence about the `.ts` read alongside it.
3. **Planted input on hermetic mirrors** built with `git archive HEAD`, never on the live tree. Two
   independent mirror reproductions were run in this session (the LANG-06 substitution bypass and the
   LANG-03 registry-arm-flip bypass, the latter to confirm round 3's specific defect is genuinely
   closed rather than merely claimed closed). `git status --porcelain` at the end of this session
   shows only the pre-existing, out-of-scope `human-notes.txt` (M), `.gsd/` (??) and
   `.planning/phases/29.1-.../` (??) — no source file in this repository was modified.

**A green gate is still not evidence for this phase.** All seven repo gates exit 0 on HEAD, `npm run
typecheck` is clean, and the non-e2e regression suite is **1987 passed / 2 skipped across 52 files**
(run once here) — while one of the two remaining failed truths (LANG-06) has a reproduced, live,
fail-open bypass. This is the fourth consecutive round in which this phase's green suite and its
truth value disagree on at least one requirement, matching the project's own standing lesson
(memory: "grugops safety invariant: green suite insufficient").

**What changed since round 3.** Round 3 closed two of its four failed truths (LANG-03, LANG-04) at
the truth level, confirmed independently here rather than accepted from `29-REVIEW.md` or any
SUMMARY. The other two (LANG-06, LANG-07) remain failed, but for **different, newly-surfaced
reasons** than round 3 charged against them — in LANG-06's case, a defect introduced by round 3's own
fix; in LANG-07's case, a defect the closure round's own plan (29-29) found and explicitly escalated
rather than closing. Neither is a truth-level regression (neither was VERIFIED in round 3), and no
previously-VERIFIED truth (LANG-01, LANG-02, LANG-05, LANG-08-via-override) regressed this round.

## Goal Achievement

### Observable Truths

| # | Truth (LANG-NN) | Status | Evidence |
|---|---|---|---|
| 1 | LANG-01 — grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation / not-certified disclaimer and vendors no ASD dictionary text | ✓ VERIFIED | Unchanged; `agent-factory/writing-profile.md`'s "Disclaimer and honesty floor" section present. Round 3's only edits to this file were additive (WP-11/WP-04 narrowing and its rationale section). Live gate re-run: `LANG-01: 76 Technical Name(s) DERIVED from the kit, never listed`. |
| 2 | LANG-02 — the profile is applied to workflow steps, checklists, memory-bank, shared-context notes, board and traceability, and explicitly NOT to the fenced caveman blocks | ✓ VERIFIED | Live gate re-run here: `LANG-02: 47 governed document(s) in 4 derived part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2 … 47 of 47 opened`, `agent-factory/roles/` named-excluded with the stated reason (governed by the separate voice/caveman/clause-uniqueness guards). |
| 3 | LANG-03 — a named safety-surface exclusion list is honoured so load-bearing security/compliance/admission text is never reworded by a style pass | ✓ VERIFIED | Round 3's register-arm pin (equality three in check-audit-register.ts) plus round 3's registry-arm pin (equality four / SAFETY_CLAIM_HOMES roster + RESIDUE_FROM_REGISTRY_COUNT in check-diff-disposition.ts / check-audit-register.ts) close the D-18 union's remaining unpinned members. Independently reproduced here: flipping C-28-001's `kind: safety` -> `kind: architecture` on a hermetic mirror — the exact attack round-3's own verification measured as silently succeeding (both gates exit 0, README.md dropped from the union) — now reds BOTH `check-audit-register.js` (exit 1, "equality four (safety arm roster)") and `check-diff-disposition.js` (exit 1, "the registry arm's contribution ... is 2 markdown file(s), expected exactly 3"). |
| 4 | LANG-04 — guards named for exactly the decidable subsets they check; guard_banned_claims holds the conformance prohibition mechanically | ✓ VERIFIED | Round 3's WR-05 (WP-11 published level-agnostic while STEPS_HEADING decides `## Steps` only) is closed: `writing-profile.md:54` and `check-imperative-lexicon.ts`'s STEPS_HEADING/STEPS_SECTION_RULE now agree on the level-two spelling, held by a four-member, four-mutation two-sided pin (`wp11Pin`), confirmed by direct read. WP-04's row was narrowed in the same edit and today matches the gate's decided spelling (confirmed by direct read of both artifacts); round-4's `29-REVIEW.md` WR-06 notes WP-04 lacks WP-11's independent two-sided pin — a real residual (recorded under Anti-Patterns below) but not a live mismatch on the current tree. `guard_banned_claims` remains mechanical, confirmed passing (0/82 findings). |
| 5 | LANG-05 — `## One job`, the caveman block and `## Responsibilities` each say a thing once | ✓ VERIFIED | Unchanged; not touched by round 3's file set. Live gate re-run: `role clause uniqueness: 0 findings over 17/17 elements`. |
| 6 | LANG-06 — the voice guard measures voice against a committed lexicon (reliably identifies which bytes are the caveman block) | ✗ FAILED | Round 3's own CR-01 (fence swallowing later sections) is fixed and reconfirmed by direct read and re-execution against both heading levels. A NEW, independently-reproduced fail-open bypass exists in the same guard's SCAN SET: `SEC_VOICE_FILES` is pinned by cardinality only, and a member substitution (proven on a hermetic mirror, end-to-end, with a caveman marker planted in the real security-audit workflow) drops the contaminated file from the scan while every published number holds still and the gate exits 0. See gap #1. |
| 7 | LANG-07 — the lexicon guards and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes | ✗ FAILED | Round 3's WR-08 (four disagreeing private section-end predicates) is closed structurally — one authority in frontmatter.ts, five consumers, confirmed by direct read. Plan 29-29 itself measured and ESCALATED a further violation of the same must-have (not absorbed as closed): `sectionBody`, duplicated verbatim in `generate-catalog.ts:87` and `generate-role-adapters.ts:127`, is a third, fence-blind AND level-blind section-extent grammar feeding generated adapter/catalogue text, confirmed present in source by direct read here. See gap #2. |
| 8 | LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Carried forward unchanged from rounds 1, 2 and 3. `hold-rebaseline` accepted by Olger Oeselg 2026-08-15; the prohibition half holds by construction and the delta is recorded in `docs/audit/29-ceiling-rebaseline.md`. |

**Score:** 6/8 truths verified (LANG-01, LANG-02, LANG-03, LANG-04, LANG-05, LANG-08-via-override).
2/8 failed (LANG-06, LANG-07). 0 present-but-behaviour-unverified.

### Why the score moved from 4/8 to 6/8, and why it did not move to 8/8

Round 3 genuinely closed LANG-03 and LANG-04 at the truth level — not merely at the level of the
specific defects round 3's own gap report named. Both closures were independently re-derived here,
including reproducing round-3's own previously-successful bypass for LANG-03 and watching it fail
closed on the current tree, which is the strongest evidence this report can offer for "the truth now
holds" rather than "the fix landed."

LANG-06 and LANG-07 did not close, but for a materially different reason than in round 3: in both
cases, the specific defect round 3's gap report named IS fixed, confirmed independently here by
direct read and (for LANG-06) by re-execution. What kept both truths failed is a **second, distinct**
instance of the same must-have's prohibited shape, surfaced by the closure round's own work:

- **LANG-06**: the round-3 fix to the fence READER (where the caveman block's bytes are) is correct
  and holds. The new failure is in the guard's scan SET (which FILES are voice-scanned at all) — a
  hand-maintained list pinned by count instead of by membership, the same class of defect ("derive
  the set, assert the count," from this milestone's own founding finding) recurring inside the very
  fix meant to close a different instance of it.
- **LANG-07**: the round-3 fix genuinely unifies the four guard modules onto one section-locator
  authority. The new failure is a fifth-and-sixth location — two generator scripts, outside the four
  guard modules the unification round scoped to — that answer the identical "where does a section
  end" question with a private, duplicated regex. Plan 29-29 found this defect itself, while deriving
  the falsifiability floor for its own closure, and recorded it as an open escalation rather than
  quietly absorbing it as closed. That is the round behaving correctly under adversarial pressure; it
  does not change that the must-have — "never two grammars over the same bytes" — is not yet true of
  this tree.

Both remaining gaps share a structural signature worth naming for a fifth round, if one is needed:
**a closure that pins a NEW authority perfectly can still leave an ADJACENT, differently-shaped
instance of the same violation unexamined**, because the round's own scope was drawn around the
defect it set out to fix rather than around the full extent of the must-have's prohibition. LANG-06's
scope was "the fence reader"; the scan-set membership question sits one field over in the same file.
LANG-07's scope was "the four guard modules"; the two generator scripts sit one directory over,
answering a structurally identical question.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/writing-profile.md` | Enumerated rules, Technical Names derivation, disclaimer | ✓ VERIFIED | Disclaimer, WP-11/WP-04 narrowed rows, rationale section present |
| `scripts/frontmatter.ts` (`unfencedHeadingIndex`, `sectionEndIndex`) | ONE section-locator authority for the guard modules | ✓ VERIFIED as an authority, ⚠️ incomplete as "the only one in the tree" | Correctly composed and consumed by five guard modules; a sixth-and-seventh consumer class (the two generators) answers the same question through a private grammar instead |
| `scripts/voice-model.ts` (`readCavemanFence`) | Single, section-bounded caveman-fence authority | ✓ VERIFIED (fence-reading half) | Delimiter-neutralised projection confirmed; both heading levels refuse `unterminated` on the round-3 bypass bytes |
| `scripts/check-foundation-guards.ts` (`guard_voice`, `SEC_VOICE_FILES`) | Scan set reliably covers every voice surface, including non-role security surfaces | ✗ INCORRECT (fail-open) | `SEC_VOICE_FILES`/`SEC_VOICE_FILE_COUNT` pin cardinality, not membership — a substitution is invisible to every published number (CR-01, gap #1) |
| `scripts/check-diff-disposition.ts` / `scripts/check-audit-register.ts` | Watch a pinned corpus (D-18 union, both arms) | ✓ VERIFIED | Register arm (equality three) and registry arm (equality four / SAFETY_CLAIM_HOMES) both pinned two-sided; round-3's own bypass reproduced here and confirmed now fails closed |
| `scripts/check-imperative-lexicon.ts` | Enforce the profile's decidable subset exactly, named for it | ✓ VERIFIED | WP-11 pinned two-sided with a four-mutation probe; WP-04 narrowed to match but unpinned (residual, not a live mismatch) |
| `scripts/audit-model.ts` (`readRegistry`, `parseClaimBlock`) | No private section or fence predicate | ✓ VERIFIED (fence-awareness) | `parseClaimBlock` now consumes `FENCE_DELIMITER_LINE`; fenced phantom claim rows are excluded, confirmed by the module's own equality (though that equality is itself a tautology under set algebra per round-4 review WR-02 — a test-quality residual, not a live bypass) |
| `scripts/generate-catalog.ts`, `scripts/generate-role-adapters.ts` (`sectionBody`) | Consume the one section-locator authority | ✗ TWO PRIVATE, DUPLICATED GRAMMARS | Verbatim-duplicated, fence-blind, level-blind `new RegExp` lookahead — the third grammar LANG-07 forbids (gap #2) |
| `docs/audit/29-locator-unification.md` | Re-runnable transcript, residual set, honest closure statement | ✓ VERIFIED (as a transcript) | §9.3 names the escalation and states plainly "LANG-07's truth is therefore NOT fully closed on this tree" |
| `docs/audit/29-ceiling-rebaseline.md` | Byte-ceiling re-baseline transcript | ✓ VERIFIED (as a transcript) — re-baseline itself remains deliberately deferred | Unchanged; covered by the LANG-08 override |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `voice-model.ts` `readCavemanFence` | `frontmatter.ts` `sectionEndIndex` | delimiter-neutralised projection, call at `:200` | ✓ WIRED AND CORRECT | Re-confirmed at both heading levels on the round-3 bypass bytes |
| `check-foundation-guards.ts` `guard_voice` | `check-foundation-guards.ts` `SEC_VOICE_FILES` | array literal, iterated into `VOICE_FILES` | ✗ WIRED, MEMBERSHIP UNPINNED | Cardinality-only pin admits a same-count substitution; reproduced end to end |
| `check-diff-disposition.ts` | `generate-safety-surface.ts` `safetySurfaceUnion` | import + call | ✓ WIRED, BOTH ARMS PINNED | Register arm (equality three) and registry arm (equality four) both confirmed pinned; round-3 bypass reproduced and now fails closed |
| `check-imperative-lexicon.ts` `wp11Pin` | `writing-profile.md` WP-11 text | source-level string comparison | ✓ WIRED AND CORRECT | Four-member, four-mutation probe confirmed by direct read |
| `check-imperative-lexicon.ts` WP-04 enforcement | `writing-profile.md` WP-04 text | no assertion connects them | ⚠️ AGREE TODAY, UNPINNED | Both currently say "level-two only"; nothing reds if they drift apart (residual, WR-06 round-4 review) |
| `generate-catalog.ts` / `generate-role-adapters.ts` `sectionBody` | `frontmatter.ts` `unfencedHeadingIndex`/`sectionEndIndex` | — no link exists — | ✗ NOT WIRED (private duplicate instead) | Both generators answer the section-extent question through their own regex, never the shared authority |

### Data-Flow Trace (Level 4)

No UI/DB surface. The equivalent question for this phase is **which bytes a guard measures or a
generator emits**, and that is where both remaining defects live.

| Consumer | Value | Source | Produces intended data | Status |
|---|---|---|---|---|
| `guard_voice` | which files are voice-scanned | `SEC_VOICE_FILES` array (hand-maintained, cardinality-pinned) | a substituted member is silently unscanned | ✗ HOLLOW MEMBERSHIP |
| `guard_diff_disposition` | the watched D-18 corpus | `safetySurfaceUnion()`, both register and registry arms | both arms now independently derived and pinned two-sided | ✓ FLOWING |
| `guard_imperative_lexicon` WP-11 arm | `stepsFiles` | `/^## Steps\s*$/` over the governed corpus, pinned against the profile text | correct and held two-sided | ✓ FLOWING |
| generated role-adapter `description`/`Use when`/`One job` | section body text | `sectionBody()` — a private, duplicated, fence-blind/level-blind regex | a fenced or post-level-one-heading section would be truncated silently (0 live today) | ⚠️ STATIC GRAMMAR, UNMEASURED |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Committed `.js` is a faithful build of the `.ts` read here | `npm run freshness` | "All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild" | ✓ PASS (premise of every reproduction below) |
| Seven repo gates on HEAD | `node scripts/{check-foundation-guards,check-imperative-lexicon,check-diff-disposition,check-banned-claims,check-audit-register,check-claim-anchors,check-public-docs-vocabulary}.js` | all seven exit 0 | ✓ PASS (does not contradict the two failures below — see Method Note) |
| `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.tests.json` | clean, exit 0 | ✓ PASS |
| Regression suite, once, e2e excluded | `npx vitest run --exclude '**/scripts/e2e/**'` | 52 files, **1987 passed**, 2 skipped, ~123s | ✓ PASS |
| **LANG-06 CR-01, independently reproduced** | planted a caveman marker in `agent-factory/workflows/15-security-audit.md` on a `git archive HEAD` mirror; ran the unmodified guard, then a `.js` with one member substituted in `SEC_VOICE_FILES` (count unchanged) | unmodified: `FAIL voice: 1 finding(s) over 19 elements`; substituted: `PASS voice: 0 findings over 19/19 elements`, gate exit 0 | ✗ **CONFIRMS FAIL-OPEN BYPASS, INDEPENDENTLY OF 29-REVIEW.MD** |
| **LANG-03 round-3 bypass, re-run to confirm closure** | flipped `C-28-001`'s `kind: safety` -> `kind: architecture` in `docs/audit/28-claim-registry.md` on a fresh `git archive HEAD` mirror; ran `check-audit-register.js` and `check-diff-disposition.js` | `check-audit-register.js` exit 1 ("equality four (safety arm roster)"); `check-diff-disposition.js` exit 1 ("the registry arm's contribution ... is 2 markdown file(s), expected exactly 3") | ✓ **CONFIRMS ROUND-3'S FIX GENUINELY CLOSES THE PREVIOUSLY-SUCCESSFUL ATTACK** |
| **LANG-07 third grammar, source-read confirmation** | `Read scripts/generate-catalog.ts:80-88`, `scripts/generate-role-adapters.ts:112-129` | both declare `function sectionBody` with `new RegExp(\`^## ${heading}\\n([\\s\\S]*?)(?=\\n## \|$(?![\\s\\S]))\`, "m")`, byte-identical, no `fencedLineFlags`/`unfencedHeadingIndex` import | ✗ CONFIRMS THE THIRD GRAMMAR IS PRESENT AND UNCHANGED FROM THE ESCALATION |
| WP-04/WP-11 spelling agreement, live reachability | `grep -n "WP-04\|WP-11" agent-factory/writing-profile.md`, `grep -n "STEPS_HEADING" scripts/check-imperative-lexicon.ts` | profile: "`## Steps`" heading named for both rows; gate: `STEPS_HEADING = /^## Steps\s*$/` | ✓ CONFIRMS NO LIVE MISMATCH (residual is forward-drift risk only) |
| Requirements traceability | union of `requirements:` over all 26 plans vs REQUIREMENTS.md Phase 29 rows | both are exactly LANG-01..08 | ✓ PASS (no orphans) |
| Debt-marker scan over round-3-modified source | `grep -anE '\b(TBD\|FIXME\|XXX)\b'` over the 9 non-test files round 3 touched | one hit, `check-diff-disposition.ts:1140`, `TBD` as example text inside a comment enumerating sentinel spellings a companion-cell check refuses | ✓ PASS (no unresolved debt markers) |
| Working tree cleanliness after all reproductions | `git status --porcelain` | only the pre-existing `human-notes.txt` (M), `.gsd/` (??), `.planning/phases/29.1-.../` (??) | ✓ PASS (all plants were on mirrors) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exists in this repository and no PLAN declares one; this phase's
equivalent runnable evidence is the seven gates and the reproductions above, all executed in this
session. **Step 7c: N/A (no probe scripts in this project).**

### Requirements Coverage

| Requirement | Source plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-02, 29-03 | Grugops-authored ASD-STE100-derived profile, disclaimer, no vendoring | ✓ SATISFIED | Unaffected by round 3 |
| LANG-02 | 29-03, 29-08..12, 29-17, 29-24 | Profile applied to procedural surfaces, not to caveman blocks | ✓ SATISFIED | Live gate re-run: 47/47 governed, roles named-excluded |
| LANG-03 | 29-04, 29-07, 29-08..12, 29-15, 29-16, 29-21, 29-22, 29-26, 29-28, 29-30 | Safety-surface exclusion honoured mechanically | ✓ SATISFIED | Register + registry arms both pinned; round-3's own successful bypass now reproduced and reproduced-closed |
| LANG-04 | 29-02, 29-03, 29-08..12, 29-17, 29-18, 29-23, 29-24, 29-26, 29-31 | Guard enforces exactly the decidable subset; conformance prohibition mechanical | ✓ SATISFIED | WP-11 pinned two-sided; WP-04 narrowed and agreeing (unpinned residual noted, not blocking) |
| LANG-05 | 29-01, 29-05, 29-06, 29-07 | Role skeleton de-duplicated | ✓ SATISFIED | Untouched; guard passes |
| LANG-06 | 29-01, 29-05..07, 29-14, 29-18, 29-20, 29-25, 29-26, 29-27 | Voice guard rebuilt, RED evidence, lexicon-based measurement | ✗ BLOCKED | CR-01: SEC_VOICE_FILES cardinality-only pin, fail-open substitution reproduced end to end |
| LANG-07 | 29-01, 29-20..26, 29-28, 29-29, 29-32 | One fence parser, never two grammars over the same bytes | ✗ BLOCKED | V-29-29-01: a third, duplicated, fence-blind/level-blind grammar in two generator scripts |
| LANG-08 | 29-13, 29-19 | Byte ceilings re-baselined once, delta recorded, never raised | ⚠️ ACCEPTED (override) | `hold-rebaseline`, authorised 2026-08-15, carried unchanged |

**No orphaned requirements.** The union of `requirements:` across all 26 plans is exactly LANG-01..08,
matching REQUIREMENTS.md's Phase 29 row set exactly.

### REQUIREMENTS.md checkbox reconciliation

`.planning/REQUIREMENTS.md`'s Phase 29 rows were already corrected once between round 3 and this
verification (commit `27fd0f3`, "revert premature Complete requirements after gaps found"). The
current state (checkbox list at lines 79-86; traceability table at lines 180-187) reads:

| Row | REQUIREMENTS.md today | This verification | Supportable? |
|---|---|---|---|
| LANG-01 | `[ ]` / Gaps Found | ✓ VERIFIED | **stale — understates** |
| LANG-02 | `[ ]` / Pending | ✓ VERIFIED | **stale — understates** |
| LANG-03 | `[x]` / Complete | ✓ VERIFIED | **yes — matches** |
| LANG-04 | `[ ]` / Gaps Found | ✓ VERIFIED | **stale — understates** |
| LANG-05 | `[ ]` / Gaps Found | ✓ VERIFIED | **stale — understates** |
| LANG-06 | `[ ]` / Gaps Found | ✗ FAILED | **yes — matches** |
| LANG-07 | `[x]` / Complete | ✗ FAILED | **NO — overstates.** `generate-catalog.ts`/`generate-role-adapters.ts`'s duplicated `sectionBody` is a third section-extent grammar, confirmed present by direct read; the mark should not be `[x]`/Complete while this must-have's literal text is violated in source. |
| LANG-08 | `[ ]` / Pending | ⚠️ PASSED (override) | consistent with a deferred re-baseline |

`.planning/ROADMAP.md:96` carries Phase 29 as `[ ]`, which agrees with the evidence. Updating
REQUIREMENTS.md's per-row marks to LANG-01/02/03/04/05 = Complete, LANG-06/07 = Gaps Found is a
documentation fix and is not itself listed as a gap here, but the current LANG-07 `[x]` is
specifically flagged: a reader trusting that mark alone would conclude a requirement is closed that
this verification finds actively violated in source, with a working reproduction on file.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/check-foundation-guards.ts` | 1985-2008 | `SEC_VOICE_FILES` pinned by cardinality where membership is claimed to be pinned | 🛑 Blocker (gap #1) | The declaration comment asserts a derived-set comparison that does not exist for this half |
| `scripts/generate-catalog.ts` | 80-86 | Private, duplicated, fence-blind/level-blind section-extent regex | 🛑 Blocker (gap #2) | Third grammar over the same class of bytes LANG-07 forbids; feeds generated user-facing text |
| `scripts/generate-role-adapters.ts` | 122-128 | Byte-identical duplicate of the above | 🛑 Blocker (gap #2, same finding) | Same risk, second file |
| `scripts/check-imperative-lexicon.ts` | writing-profile.md:47 / gate STEPS_HEADING | WP-04's row agrees with the gate today but carries no two-sided pin (unlike WP-11's) | ⚠️ Warning | Forward-drift risk only; not a current mismatch (confirmed by direct read) |
| `scripts/audit-model.ts` | ~1046-1078 | `readRegistry`'s "three numbers must agree" refusal is a tautology under set algebra (round-4 review WR-02) | ⚠️ Warning | Weakens the strength of CR-02's closure evidence without reopening a live bypass (parseClaimBlock's fence-awareness fix stands independently) |
| `scripts/check-foundation-guards.ts` | 2174-2183 | `guard_voice`'s element floor carries a dead disjunct (`bodyLines.length === 0` is unreachable, since `"".split("\n")` is `[""]`) | ⚠️ Warning | The floor still catches the fully-collapsed case via its second disjunct; a *silently short* (not empty) remainder is unmeasured (round-4 review WR-04/WR-05) |

No unresolved debt markers: the single `TBD` hit in round-3-modified source is example text inside a
comment enumerating sentinel spellings a companion-cell check refuses.

### Human Verification Required

**None.** Both remaining gaps are mechanically confirmed — direct code read plus, for LANG-06,
end-to-end reproduction on a hermetic mirror independent of `29-REVIEW.md`; for LANG-07, direct
source read confirming the escalation's own claim. Nothing here needs subjective or visual judgment.

Recorded for continuity, not as a verification item: `docs/audit/29-locator-unification.md §9.3`
states in the round's own words, "LANG-07's truth is therefore NOT fully closed on this tree," and
`29-29-SUMMARY.md` states the same for the escalation as a whole ("V-29-29-01 is a measured, pinned,
fence-blind third grammar in two generators, escalated rather than absorbed"). This verification's
LANG-07 finding is consistent with — not a discovery ahead of — what the executing plan itself
already told the human operator.

### Gaps Summary

Two of eight LANG requirements have a live-reproducible or directly-confirmed-in-source defect
blocking goal achievement, while all seven repo gates exit 0, typecheck is clean, and 1987 tests
pass. That is the fourth consecutive round in which this phase's green suite and its truth value
disagree on at least one requirement — though, notably, the count of disagreeing requirements
dropped from four to two this round, and two requirements (LANG-03, LANG-04) that failed in three
consecutive prior rounds are now independently confirmed to genuinely hold, including by reproducing
and watching fail closed the exact bypass that succeeded against them in round 3.

1. **LANG-06 (CR-01, reproduced today, end to end, independently of 29-REVIEW.md).** The fence-reading
   half of the voice guard is fixed and holds. `SEC_VOICE_FILES`, the guard's one hand-maintained
   scan-set member list, is pinned by count rather than by membership; a same-count substitution
   removes the real security-audit surface from the scan while the gate prints a clean pass.

2. **LANG-07 (V-29-29-01, confirmed present in source today).** The four-guard-module unification is
   real and holds. Two code-generation scripts outside that unification's scope answer the identical
   "where does a section end" question through a private, duplicated, fence-blind and level-blind
   regex, feeding the generated Claude Code adapters' and the kit catalogue's user-facing text. The
   closure round's own plan found and escalated this rather than closing it.

LANG-08 stays closed by the already-authorised `hold-rebaseline` override, unchanged since round 1.
**No override is suggested for LANG-06 or LANG-07:** both are logic/scope defects with a fix already
sketched (in `29-REVIEW.md` for LANG-06, in `docs/audit/29-locator-unification.md §9.3` for LANG-07),
not intentional deviations with an equivalent alternative implementation. LANG-06's CR-01 in
particular is exactly the failure class ("a hand-maintained set literal drifts from the filesystem
and stays green") this milestone's own founding finding names — recurring inside the very fix meant
to close a different instance of it in the same file.

---

_Verified: 2026-08-16T05:20:00Z_
_Verifier: Claude (gsd-verifier)_
