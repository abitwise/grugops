---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-15T00:00:00Z
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
  gaps_closed:
    - "LANG-08 — closed via the authorized hold-rebaseline override (preserved unchanged from round 1; not new work in this round)"
  gaps_remaining:
    - "LANG-03 — round-1's specific defect (registryAnchors range-wide companion check) is fixed via per-carrier attribution, but a new, differently-shaped fail-open hole (unpinned watched corpus) was found and live-reproduced in the same enforcement mechanism"
    - "LANG-04 — round-1's specific defect (LIST_MARKER's 3-space depth bound) is fixed, but two new scope-mismatch defects (WR-04, WR-09) were found in the widened predicate"
    - "LANG-06 — round-1's specific defect (unbounded to-EOF fence scan) is fixed, but the section bound it introduced only closes on a level-two heading, not a level-one one, and the bypass was live-reproduced"
  regressions:
    - "LANG-07 — VERIFIED in round 1 on the strength of a single shared fence-delimiter class; round 2's independent code review found FOUR disagreeing implementations of the related 'where does a section end' predicate (WR-08), which is the direct architectural cause of the LANG-06 bypass. Re-assessed FAILED this round on evidence round 1 did not have."
gaps:
  - truth: "LANG-03 — a named safety-surface exclusion list is honoured so that load-bearing security, compliance, and admission text is never reworded by a style pass"
    status: failed
    reason: >
      Confirmed by direct code read of `scripts/check-diff-disposition.ts`'s `watchedCorpus()`
      (lines ~1276-1292) and its only consumer-side floor (`corpus.watched.length === 0` check,
      lines ~1330-1337): the watched corpus is `safetySurfaceUnion(root)` filtered to markdown, with
      no lower-bound pin analogous to the four `cardinalities` checks or `POSITIVE_GUARD_LITERAL_COUNT`
      that the same file uses for every other derived set. `docs/audit/28-disposition-register.md`'s
      `safety_surface` column is unconstrained in how many rows may carry `yes`, and the register file
      itself lives under `docs/` so it is not a member of the corpus it derives — an edit that flips one
      cell narrows the left-hand side of the entire gate with no disposition row owed for the edit that
      did it. This is CR-01 in round 2's `29-REVIEW.md`, reproduced there end-to-end on the live tree:
      reword a frozen `## Hard limits` sentence, flip one register cell `yes` -> `no`, regenerate, and
      all four gates (`check-diff-disposition`, `check-audit-register`, `check-claim-anchors`,
      `check-foundation-guards`) exit 0. Round 1's specific defect in this same guard (the
      `registryAnchors` companion check testing range-wide file presence instead of same-commit
      correspondence) IS fixed — confirmed independently here via direct read of the new
      `carrierFilesTouched`/`attributeClauses` per-commit derivation (lines ~898-1067) and the
      `isCompanionFilled` canonical-form check (line 1162) — but a comparably fail-open hole was found
      elsewhere in the same enforcement surface.
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "watchedCorpus() (~1276-1292) and its only floor (~1330-1337, zero-check only) admit an arbitrarily narrowed corpus with no minimum-cardinality pin (CR-01 in round-2 29-REVIEW.md)"
    missing:
      - "Pin a minimum watched-corpus cardinality (e.g. derived-role-count + derived-workflow-count) the way every sibling derivation in this file is pinned, per the fix sketch in round-2 29-REVIEW.md CR-01"
      - "Or close the hole at its source: assert set equality in check-audit-register.ts between rows with safety_surface: yes and the derived kit file set, so a no on a role/workflow row is a named refusal rather than a silent de-scoping"
      - "Add a harness case that flips one safety_surface flag in a register mirror and requires exit 1"
  - truth: "LANG-04 — guards named for exactly the decidable subsets they check (guard_imperative_lexicon: lexicon membership at imperative position; guard_sentence_form: sentence length and banned constructions)"
    status: failed
    reason: >
      Confirmed by direct code read of `scripts/check-imperative-lexicon.ts`: round 1's specific defect
      (`LIST_MARKER` admitting at most 3 leading spaces, invisible to CommonMark sub-bullets) IS fixed —
      the marker is now `/^[ \t]*(?:[-*+]|\d{1,3}[.)])\s+/` (line ~511), unbounded in depth, with the
      widening argued in the module's own comment. But the widened predicate introduces two new
      scope-mismatch defects, both confirmed present in round-2 `29-REVIEW.md` and not contested by
      independent read: (1) WR-04 — the new `expected`/`visited` set-equality check now REDs a `##
      Steps` section written as prose with no list marker at all, a shape the module's own recorded
      "Residual 1" (lines ~71-74) explicitly documents as out of scope ("a paragraph under that heading
      is not a bullet and is not measured as one"). The guard's enforcement and its own in-file
      documentation now contradict each other for a plausible, ordinary authoring shape. (2) WR-09 —
      the depth-unbounded `LIST_MARKER`/`ORDERED_MARKER` also match a line inside a four-space-indented
      CommonMark *code block* (as opposed to a fenced one), because `fencedLineFlags` only recognizes
      backtick fences, not indented code blocks; such a line is silently counted as a phantom step
      bullet. Both are fail-closed (over-admission / false red) rather than fail-open, and neither
      currently misfires on the live corpus, but both mean the guard is not enforcing "exactly" the
      subset its own naming and documentation claim — the same standard round 1 applied to the
      then-latent CR-03.
    artifacts:
      - path: "scripts/check-imperative-lexicon.ts"
        issue: "the stepSetRefusal fold (~1274-1295) contradicts Residual 1 (~71-74) for a prose-only ## Steps section (WR-04); LIST_MARKER/ORDERED_MARKER (~511, ~807) admit indented-code-block lines that fencedLineFlags cannot see (WR-09)"
    missing:
      - "Decide and record one answer for WR-04: either retire Residual 1 (a ## Steps heading must carry bullets — a defensible rule, but state it in agent-factory/writing-profile.md) or derive the denominator from files whose ## Steps section carries at least one non-blank, non-heading line, independent of the bullet loop"
      - "Either record WR-09 as a residual beside residuals 1-3, or teach fencedLineFlags the indented-code-block form so one authority answers the 'is this line documentation' question for both fence spellings"
      - "Add permanent test cases for both: a prose-only ## Steps section asserting the intended (not accidental) verdict, and a four-space-indented numbered line under ## Steps asserting the intended verdict"
  - truth: "LANG-06 — the rebuilt voice guard measures voice against a committed lexicon (i.e. reliably identifies which bytes are the caveman block)"
    status: failed
    reason: >
      Confirmed by direct code read of `scripts/voice-model.ts:102`: round 1's specific defect
      (`readCavemanFence` scanning to end-of-file with no section bound) IS fixed — the open and close
      scans are now bounded by a computed `sectionEnd`, confirmed by direct read of the bounding loop at
      lines ~140-165. But the bound itself, `const SECTION_END = /^## /;`, recognizes only a level-two
      heading as closing the caveman section — a level-one `# ` heading does not close it, so the
      original failure mode survives in narrowed form: a role whose caveman section has been reworded
      into plain prose (or de-fenced) still adopts an unrelated later fenced block, provided the
      intervening heading is `# ` rather than `## `. This is CR-02 in round 2's `29-REVIEW.md`, and it
      was independently reproduced here as well as by the reviewer: calling `readCavemanFence` on a
      document with a fence-less `## Caveman prompt` section followed by a `# Appendix` containing an
      unrelated fenced block returns `{ ok: true, inside: "grug club rock cave smash", ... }` — the
      wrong bytes, accepted as correct. `check-imperative-lexicon.ts:488` answers the identically-shaped
      "what closes a section" question with `/^#{1,2} /` (both levels), so the tree disagrees with
      itself about the same predicate — see LANG-07 below, which is the structural cause of this gap.
      The historical acceptance-evidence sub-claim (17/17 RED before the rewrite) and the
      "publishes a number with a denominator" sub-claim both still hold and are not re-litigated here.
    artifacts:
      - path: "scripts/voice-model.ts"
        issue: "SECTION_END = /^## /; at line 102 does not recognize a level-one heading as closing the section (CR-02 in round-2 29-REVIEW.md)"
    missing:
      - "Widen SECTION_END to /^#{1,2} / — the same class check-imperative-lexicon.ts's SECTION_HEADING_LINE already declares — per the fix sketch in round-2 29-REVIEW.md CR-02"
      - "Add a permanent voice-model.test.ts case planting a de-fenced caveman section followed by a # top-level heading containing an unrelated fence, asserting { ok: false, reason: \"missing\" }"
      - "Add a full-gate check-foundation-guards.test.ts case asserting exit 1 on the same shape (the pair plan 29-14 already wrote for the ## arm)"
  - truth: "LANG-07 — guard_imperative_lexicon (with its sibling guard_sentence_form) and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes"
    status: failed
    reason: >
      Verified in round 1 on the strength of a single shared fence-delimiter class
      (`FENCE_DELIMITER_LINE` in `frontmatter.ts`, consumed by both `voice-model.ts` and
      `check-imperative-lexicon.ts` without re-declaration). That sharing is still true and still
      confirmed. But round 2's independent code review (WR-08 in `29-REVIEW.md`) found that the closely
      related predicate this must-have is actually protecting against re-diverging on — "where does a
      section end" — has FOUR separate, disagreeing implementations across the four guard modules
      (`voice-model.ts`, `check-diff-disposition.ts`, `check-banned-claims.ts`,
      `check-imperative-lexicon.ts`), differing on both heading-equality strictness and fence-awareness.
      Independently confirmed by direct read: `voice-model.ts:102` is `/^## /` (fence-blind, level-two
      only) while `check-imperative-lexicon.ts:488` is `/^#{1,2} /` (both levels). This divergence is
      not cosmetic — it is the direct architectural cause of the CR-02 bypass charged against LANG-06
      above: two authorities answer the identical question about the identical bytes with different
      grammars. "Never two grammars over the same bytes" is the literal text of this must-have, and the
      review found four. Delimiter-sharing alone does not satisfy the must-have when the section-bound
      question that sits on top of it is unshared and demonstrably produces different answers.
    artifacts:
      - path: "scripts/voice-model.ts"
        issue: "SECTION_END (line 102) is a private, differently-shaped section-close predicate from the one in check-imperative-lexicon.ts (line 488) and the two in check-diff-disposition.ts / check-banned-claims.ts (WR-08 table in 29-REVIEW.md)"
      - path: "scripts/check-diff-disposition.ts"
        issue: "its own section-close predicate (~line 535) differs again from all three siblings"
      - path: "scripts/check-banned-claims.ts"
        issue: "its own section-close predicate (~line 498) differs again from all three siblings"
    missing:
      - "Export one section-locator pair from frontmatter.ts (unfencedHeadingIndex / sectionEndIndex), per the fix sketch in round-2 29-REVIEW.md WR-08, and have all four modules consume it instead of a private predicate"
      - "Pin the consumer list two-sided, the way check-foundation-guards.test.ts already pins the eight fencedLineFlags consumers"
deferred: []
human_verification: []
---

# Phase 29: Controlled Language & Voice Guard Rebuild Verification Report

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two
agents reading the same instruction reach the same act; the caveman voice lives in exactly one
fenced block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-15T00:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — second verification, after the gap-closure round (plans 29-14 through
29-19) executed against round 1's four gaps.

## Method Note

Round 1 (`2026-08-14`) found `gaps_found` at 4/8 (LANG-03, LANG-04, LANG-06, LANG-08 failed) and its
report is what this file replaces; LANG-08's frontmatter override (deliberate `hold-rebaseline` human
decision at plan 29-13's checkpoint, accepted 2026-08-15) is **preserved unchanged** per the task
instructions. A round-2 code review (`29-REVIEW.md`, `issues_found`, 2 critical / 9 warning / 3 info)
ran against the gap-closure work and is the primary independent source for this re-verification, but
every finding it treats as load-bearing for a LANG-NN truth was re-derived here directly against the
current source — reading `voice-model.ts`, `check-diff-disposition.ts`, and
`check-imperative-lexicon.ts` at the named line numbers, and independently confirming the specific
regexes, bounds, and derivations described — rather than accepted on the review's or any SUMMARY's
word. Where the review's fix for a round-1 defect could be independently confirmed as landed (e.g. the
per-carrier attribution replacing the range-wide `registryAnchors` check, or the depth-unbounded
`LIST_MARKER`), that confirmation is recorded below alongside the newly-found defect in the same
guard, because "the original bug is fixed" and "the truth is satisfied" are different claims and this
phase's own standing lesson (project memory: "grugops safety invariant: green suite insufficient") is
exactly the case where those two get conflated.

All four automated gates print `ALL CHECKS PASSED` and exit 0 on the current tree (re-run here, not
assumed) — that state coexists with three of the four failed truths below, each confirmed by direct
code read and/or reproduction, not by grep-only inference.

## Goal Achievement

### Observable Truths

| # | Truth (mapped to LANG-NN) | Status | Evidence |
|---|---|---|---|
| 1 | LANG-01 — a grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation/not-certified disclaimer and vendors no ASD dictionary text | ✓ VERIFIED | Unchanged from round 1; `agent-factory/writing-profile.md`'s "Disclaimer and honesty floor" section states non-affiliation and no vendored ASD text. Existence/naming claim, unaffected by round-2 findings. |
| 2 | LANG-02 — the profile is applied to workflow steps, checklists, memory-bank, shared-context notes, board, and traceability, and explicitly not to the fenced caveman blocks | ✓ VERIFIED | Unchanged from round 1; live gate output confirms "47 governed document(s) ... 47 of 47 opened" and `agent-factory/roles/` remains named-excluded with a stated reason. Past-application claim, unaffected by round-2 findings. |
| 3 | LANG-03 — a named safety-surface exclusion list is honoured so load-bearing security/compliance/admission text is never reworded by a style pass | ✗ FAILED | Round 1's specific defect (registryAnchors range-wide companion check) is fixed — confirmed via direct read of the new per-carrier `attributeClauses`/`isCompanionFilled` logic. A new, differently-shaped fail-open hole was found and live-reproduced: the watched corpus itself (`safetySurfaceUnion`) has no pinned lower bound, so one register-cell flip silently narrows what the gate protects, with all four gates still exiting 0. See gap #1 (CR-01, round-2 review). |
| 4 | LANG-04 — guards named for exactly the decidable subsets they check; guard_banned_claims holds the conformance prohibition mechanically | ✗ FAILED | Round 1's specific defect (LIST_MARKER's 3-space depth bound missing CommonMark sub-bullets) is fixed — confirmed via direct read, now depth-unbounded. But the widened predicate now REDs a documented-out-of-scope shape (prose-only `## Steps`, contradicting the module's own Residual 1) and over-admits indented-code-block lines as phantom bullets. `guard_banned_claims` itself remains confirmed mechanical and unaffected. See gap #2 (WR-04, WR-09, round-2 review). |
| 5 | LANG-05 — `## One job`, the caveman block, and `## Responsibilities` each say a thing once | ✓ VERIFIED | Unchanged from round 1; not touched by the gap-closure round or the round-2 review's file list. |
| 6 | LANG-06 — the voice guard measures voice against a committed lexicon (i.e. reliably identifies which bytes are the caveman block) | ✗ FAILED | Round 1's specific defect (unbounded to-EOF fence scan) is fixed — confirmed via direct read, the scan is now bounded by a computed `sectionEnd`. But the bound (`/^## /`) only closes on a level-two heading; a level-one `# ` heading still lets the original bypass through in narrowed form, confirmed by direct reproduction of `readCavemanFence` returning `ok: true` with the wrong bytes. See gap #3 (CR-02, round-2 review). |
| 7 | LANG-07 — `guard_imperative_lexicon`/`guard_sentence_form` and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes | ✗ FAILED | Verified in round 1 on shared fence-delimiter evidence alone. Round 2's independent review found the closely related "where does a section end" predicate has FOUR disagreeing implementations across the guard modules, confirmed here by direct read of two of them (`/^## /` vs `/^#{1,2} /`) — the direct architectural cause of gap #6's bypass. Re-assessed FAILED on evidence round 1 did not have. See gap #4 (WR-08, round-2 review). |
| 8 | LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ⚠️ PASSED (override) | Unchanged from round 1: the re-baseline action itself was deliberately deferred at a human checkpoint (`hold-rebaseline`); "never raised" and "delta recorded" hold by construction and are documented in `docs/audit/29-ceiling-rebaseline.md`. Accepted by authorized override — see frontmatter. |

**Score:** 4/8 truths verified (LANG-01, LANG-02, LANG-05, LANG-08-via-override). 4/8 failed
(LANG-03, LANG-04, LANG-06, LANG-07).

### Why the net score did not improve despite three defects being fixed

The gap-closure round (29-14 through 29-19) genuinely fixed all three of round 1's specific,
named defects — confirmed independently here by direct code read, not merely accepted from the
round-2 review or any SUMMARY:

- **round-1 CR-02** (`check-diff-disposition.ts`'s `registryAnchors` range-wide companion check) is
  now a real per-commit `carrierFilesTouched`/`attributeClauses` derivation with a three-commit
  harness, confirmed present in source.
- **round-1 CR-03** (`check-imperative-lexicon.ts`'s `LIST_MARKER` 3-space depth bound) is now
  depth-unbounded, confirmed present in source.
- **round-1 CR-01** (`voice-model.ts`'s to-EOF fence scan) is now bounded by a computed
  `sectionEnd`, confirmed present in source.

But each fix, examined adversarially rather than accepted as closing its LANG-NN item, either
uncovered a sibling defect in the same enforcement surface (LANG-03's new unpinned-corpus hole,
LANG-04's two scope-mismatch defects) or was itself incomplete in a way a second, independent code
review caught (LANG-06's bound recognizing only one of two heading levels). A fourth truth
(LANG-07), previously verified on narrower evidence, is now assessed FAILED because the newly
surfaced WR-08 finding — four disagreeing section-boundary grammars — falls squarely inside what
LANG-07 explicitly prohibits and is the direct cause of LANG-06's live bypass. Net: three items
fixed at the specific-defect level, one new regression at the truth level, zero net change in the
verified count, and one closure via an already-authorized override (LANG-08) that was not new work
in this round.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/writing-profile.md` | Enumerated rules, Technical Names derivation, disclaimer | ✓ VERIFIED | Unchanged from round 1 |
| `docs/audit/28-safety-surface-exclusions.md` + `generate-safety-surface.js` | Named safety-surface union | ⚠️ WIRED BUT INCOMPLETE | Correctly derives its list today (confirmed: "37 watched file(s)"), but the list itself has no pinned floor — see LANG-03 gap |
| `scripts/voice-model.ts` (`readCavemanFence`) | Single, section-bounded caveman-fence authority | ⚠️ STUB-LIKE (present, wired, incorrect) | Bounded now (round-1 fix landed) but the bound is under-inclusive for level-one headings — CR-02 (round 2) |
| `scripts/check-imperative-lexicon.ts` (`guard_imperative_lexicon`, `guard_sentence_form`) | Enforce WP-01..WP-08 over the governed corpus exactly | ⚠️ STUB-LIKE (present, wired, incorrect) | Depth bound fixed (round-1 fix landed); new scope mismatch vs its own documented residual — WR-04/WR-09 (round 2) |
| `scripts/check-diff-disposition.ts` (`guard_diff_disposition`) | Freeze structural/registry/positive-guard-literal sections, require same-commit companion, watch a pinned corpus | ⚠️ STUB-LIKE (present, wired, incorrect) | registryAnchors companion fixed (round-1 fix landed, per-carrier attribution confirmed); watched corpus itself unpinned — CR-01 (round 2) |
| `scripts/check-banned-claims.ts` (`guard_banned_claims`) | Mechanically prohibit conformance/token-economy/comprehension claims | ✓ VERIFIED | Unchanged mechanism; pinned-literal design confirmed still in place, currently passing 0/82 findings |
| `docs/audit/29-ceiling-rebaseline.md` | Byte-ceiling re-baseline transcript | ✓ VERIFIED (as a transcript) — the re-baseline it transcribes remains deliberately deferred | Unchanged from round 1; covered by the LANG-08 override |
| `docs/audit/29-corpus-growth.md` | Growth measurement, per file and per part | ✓ VERIFIED | Unchanged from round 1 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` (`guard_voice`, `guard_caveman_voice`) | `voice-model.ts` (`readCavemanFence`) | import + call | ✓ WIRED, ⚠️ INCORRECT BOUND | Wired unchanged; the function it calls is bounded but the bound admits a level-one-heading bypass |
| `check-imperative-lexicon.ts` | `frontmatter.ts` (`fencedLineFlags`) | import + call | ✓ WIRED | Confirmed; fence-delimiter class itself is correctly shared |
| `check-diff-disposition.ts` | `generate-safety-surface.ts` (`safetySurfaceUnion`) | import + call | ✓ WIRED, ⚠️ UNPINNED OUTPUT | Wired unchanged; the derivation it consumes has no minimum-cardinality floor |
| `check-diff-disposition.ts` (registryAnchors arm) | per-carrier git history | `carrierFilesTouched` / `attributeClauses` | ✓ WIRED AND CORRECT | New this round; confirmed a real same-commit predicate, closing round-1's CR-02 |
| `voice-model.ts` `SECTION_END` vs `check-imperative-lexicon.ts` `SECTION_HEADING_LINE` vs `check-diff-disposition.ts`/`check-banned-claims.ts` section-close predicates | (should be) one shared authority | private per-module regex, four instances | ✗ NOT UNIFIED | WR-08 (round 2): four disagreeing implementations of the same predicate — the direct violation of LANG-07 and the architectural cause of the LANG-06 bypass |

### Data-Flow Trace (Level 4)

Not applicable in the conventional sense (no UI/DB data-rendering surface). The relevant "data flow"
for this phase is which bytes a guard measures as "the caveman block" or "the watched corpus" —
covered above under Required Artifacts and Key Link Verification, since that is precisely where the
phase's defects live (a guard measuring the wrong bytes while reporting a clean verdict).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| All four gates exit 0 on current HEAD | `node scripts/check-foundation-guards.js` / `check-imperative-lexicon.js` / `check-diff-disposition.js` / `check-banned-claims.js` | All four printed `ALL CHECKS PASSED`, exit 0 (re-run here) | ✓ PASS (green suite; does not contradict the failed truths above — see Method Note) |
| CR-01 (round 2) code inspection — watched-corpus floor | `Read scripts/check-diff-disposition.ts:1276-1345` | Only a zero-length check exists; no minimum-cardinality pin | ✗ CONFIRMS DEFECT PRESENT |
| CR-02 (round 2) code inspection — SECTION_END bound | `Read scripts/voice-model.ts:93-165` | `SECTION_END = /^## /` (line 102); bounding loop confirmed present but level-one-blind | ✗ CONFIRMS DEFECT PRESENT |
| WR-08 (round 2) code inspection — cross-module predicate divergence | `Read scripts/check-imperative-lexicon.ts:478-488` vs `voice-model.ts:102` | `/^#{1,2} \/` vs `/^## \/` — confirmed disagreeing | ✗ CONFIRMS DEFECT PRESENT |
| round-1 CR-02 fix confirmation — per-carrier companion attribution | `Read scripts/check-diff-disposition.ts:898-1067, 1162, 1500-1524` | `carrierFilesTouched`, `attributeClauses`, `isCompanionFilled` present and consumed per-carrier, not range-wide | ✓ CONFIRMS ROUND-1 DEFECT FIXED |
| round-1 CR-03 fix confirmation — depth-unbounded LIST_MARKER | `Read scripts/check-imperative-lexicon.ts:511, 519` | `/^[ \t]*(?:[-*+]\|\d{1,3}[.)])\s+/`, no leading-space cap | ✓ CONFIRMS ROUND-1 DEFECT FIXED |
| Requirements traceability | `grep -n "LANG-0[1-8]" REQUIREMENTS.md` + `grep "requirements:" *-PLAN.md` | All 8 IDs present in REQUIREMENTS.md; union of all 19 plans' `requirements:` fields matches exactly | ✓ PASS (no orphans) |
| Debt-marker scan | `grep -n "TBD\|FIXME\|XXX"` over the 6 key phase files | One hit, `check-diff-disposition.ts:1114`, inside a comment listing sentinel spellings a companion-cell check refuses (`TBD` as example text, not a debt marker) | ✓ PASS (no unresolved debt markers) |
| Working tree cleanliness | `git status --porcelain` | Only pre-existing, out-of-scope `human-notes.txt` (M), `.gsd/` (??), `.planning/phases/29.1-.../` (??) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-02, 29-03 | Grugops-authored ASD-STE100-derived profile, disclaimer, no vendoring | ✓ SATISFIED | Unchanged from round 1 |
| LANG-02 | 29-03, 29-08..12, 29-17 | Profile applied to procedural/agent-written surfaces, not caveman blocks | ✓ SATISFIED | Unchanged from round 1 |
| LANG-03 | 29-04, 29-07, 29-08..12, 29-15, 29-16 | Safety-surface exclusion honoured mechanically | ✗ BLOCKED | CR-01 (round 2): watched corpus unpinned, live-reproduced bypass |
| LANG-04 | 29-02, 29-03, 29-08..12, 29-17, 29-18 | Guards named for exactly the decidable subset; no banned claims | ✗ BLOCKED | WR-04/WR-09 (round 2): scope mismatch vs own documented residual and fence-blind indented code |
| LANG-05 | 29-01, 29-05, 29-06, 29-07 | Role skeleton de-duplicated | ✓ SATISFIED | Unchanged from round 1 |
| LANG-06 | 29-01, 29-05, 29-06, 29-07, 29-14, 29-18 | Voice guard rebuilt, RED evidence, lexicon-based measurement | ✗ BLOCKED | CR-02 (round 2): section bound half-fixed, level-one-blind, live-reproduced |
| LANG-07 | 29-01 | One fence parser, not two grammars | ✗ BLOCKED (newly, this round) | WR-08 (round 2): four disagreeing section-boundary grammars, root cause of the LANG-06 bypass |
| LANG-08 | 29-13, 29-19 | Byte ceilings re-baselined once, delta recorded, never raised | ⚠️ ACCEPTED (override) | `docs/audit/29-ceiling-rebaseline.md`; hold-rebaseline authorized 2026-08-15 |

No orphaned requirements: REQUIREMENTS.md's Phase 29 row set (LANG-01..08) matches exactly the union
of `requirements:` fields declared across all 19 plans (29-01 through 29-19).

### Anti-Patterns Found

None new at the debt-marker level. `grep -n "TBD\|FIXME\|XXX"` over the phase's key modified files
returns one hit that is example text inside a comment, not a debt marker (see spot-check table). The
seven defects charged against LANG-03/04/06/07 above (CR-01, CR-02, WR-04, WR-08, WR-09, round 2; plus
the two round-1 defects independently confirmed fixed) are logic/scope defects surfaced by the round-2
code review and independently confirmed here by direct reading and, for CR-01/CR-02, by reproduction —
not grep-visible markers.

### Human Verification Required

None. All four gaps below are mechanically confirmed (direct code read, plus live reproduction for
CR-01 and CR-02) rather than requiring subjective/visual judgment.

### Gaps Summary

Four of eight LANG requirements have a genuine, currently-live or currently-latent-but-reproducible
defect blocking full goal achievement, despite all four automated gates printing `ALL CHECKS PASSED`
and the full regression suite (not re-run in full this pass; confirmed green as of the round-2 review
and unmodified since) being green. This is the same pattern flagged in round 1 and matches the
project's own standing lesson (memory: "grugops safety invariant: green suite insufficient"). The
gap-closure round genuinely fixed all three of round 1's specific named defects (independently
reconfirmed here, not merely accepted from the review), but each fix either uncovered a sibling defect
in the same enforcement surface or was itself incomplete, and one previously-verified truth (LANG-07)
regressed to failed on evidence a second, independent code review surfaced that round 1 did not have.

1. **LANG-03 (CR-01, round 2, live today):** `check-diff-disposition.ts`'s watched corpus has no
   pinned minimum size. A single `safety_surface` register-cell flip silently narrows the entire
   protected corpus, and the register file that carries the flip is not itself watched — reproduced
   end to end by the round-2 reviewer with all four gates exiting 0 after the narrowing.
2. **LANG-04 (WR-04 + WR-09, round 2, latent):** the fix for round 1's indented-bullet gap now REDs a
   prose-only `## Steps` section the module's own "Residual 1" documents as out of scope, and
   separately over-admits indented-code-block lines as phantom step bullets. Not currently triggered
   on the live corpus but reproducible and self-contradictory with in-file documentation.
3. **LANG-06 (CR-02, round 2, live today):** `readCavemanFence`'s section bound (`/^## /`) does not
   recognize a level-one heading, so a de-fenced caveman section can still adopt an unrelated later
   fence when the intervening heading is `# ` rather than `## ` — reproduced directly against the
   committed function.
4. **LANG-07 (WR-08, round 2, newly failed this round):** four guard modules implement "where does a
   section end" four different, disagreeing ways. This is the direct architectural cause of gap #3 and
   falls squarely inside what LANG-07's text prohibits ("never two grammars over the same bytes").

LANG-08 remains closed by the already-authorized `hold-rebaseline` override, unchanged from round 1 —
see frontmatter. No new override is suggested for LANG-03, LANG-04, LANG-06, or LANG-07: each is a
logic/scope defect with a fix already sketched in `29-REVIEW.md`, not an intentional deviation with an
equivalent alternative implementation.

---

_Verified: 2026-08-15T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
