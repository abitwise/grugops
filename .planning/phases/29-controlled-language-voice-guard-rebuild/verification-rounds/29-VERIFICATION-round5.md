---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-17T16:10:00Z
status: gaps_found
score: 1/2 must-haves verified (this round's scope: LANG-07 verified, LANG-04 failed)
behavior_unverified: 0
overrides_applied: 0
re_verification: true
re_verification_scope:
  round: 5 (gap-closure round, plans 29-40, 29-41, 29-42)
  previous_status: human_needed (29-VERIFICATION.md, 2026-08-16) -> UAT surfaced 2 gaps (G-29-1, G-29-2) -> gap-closure plans 29-40/41/42 executed -> this verification
  gaps_closed:
    - "G-29-1 / LANG-07 — the duplicate flat frontmatter parser in scripts/generate-catalog.ts is deleted; the module consumes the one authority in scripts/frontmatter.ts; docs/catalog/README.md proven byte-identical; a derived, name-scoped owner tripwire reds a third copy. Independently reproduced."
  gaps_remaining:
    - "G-29-2 / LANG-04 — the delivered 'structural fix' (BENEFIT_VERB_MARKERS, a 7-stem hand-authored verb list gating the comprehension bare term) is itself an enumeration defeated by any unlisted benefit verb. Independently reproduced: 'Controlled language increases comprehension for language models.' exits 0, never named, while the identical sentence with a listed verb ('improves') reds. This is the same failure class G-29-2 was opened to close, relocated from the phrase slot to the verb slot, and it is undisclosed — no V- id, no live count, no direction — anywhere in this round's own residual register."
  regressions: []
gaps:
  - truth: "LANG-04 — guard_banned_claims DECIDES the comprehension-benefit prohibition rather than enumerating a phrase list (must_haves.truths, plan 29-41)"
    status: failed
    reason: "The delivered mechanism (BENEFIT_VERB_MARKERS, a hand-authored 7-stem verb list gating the bare 'comprehension' term via requiresOnSameLine) is defeated by any benefit verb outside the list. Reproduced independently on a git-archive-HEAD mirror: 'Controlled language increases comprehension for language models.' -> exit 0, ALL CHECKS PASSED, never named. The control sentence with a listed verb ('improves') reds correctly. This is not a narrower residual of the original bug — it is the identical defect (an enumerable set defeats coverage) relocated one slot to the left, and it is not disclosed anywhere: no V- id, no live count, no fail-open/fail-closed direction in docs/audit/29-round5-residuals.md, whose §3 register only carries the soft-wrap window (V-29-42-01) and three other items. The user's decision of record for G-29-2 was explicitly (c) STRUCTURAL FIX, with (a) accept-the-bound and (b) append-phrasings both REJECTED as 'whack-a-mole... it closes only the phrasings enumerated'. The shipped verb marker list is whack-a-mole with verbs instead of phrases, so option (c) was not actually delivered."
    artifacts:
      - path: "scripts/check-banned-claims.ts"
        issue: "BENEFIT_VERB_MARKERS (7 hand-authored stems: improve, better, easier, boost, help, benefit, enhance) gates the bare-term conditional member; any verb outside this list (increases, raises, gives...sharper, aids, and 'makes...understand' variants) produces zero findings on a live comprehension-benefit claim"
    missing:
      - "Open V-29-42-05 (or similar) recording the verb-marker enumeration as a disclosed, named, fail-open residual with its live count (0 today) and direction, exactly as the other three round-5 residuals are recorded — this is the minimum honest floor even if the structural closure is deferred"
      - "Decide and implement a genuinely positional/structural rule (e.g. pin the SUBJECT side — 'controlled language', 'this profile', 'the kit', 'the voice' — rather than the open class of benefit verbs), per the reviewer's suggested remedy in 29-REVIEW-round5.md CR-02 fix section, and measure its false-red cost over the 82-document scan set before admitting it"
      - "Correct the source docblock at scripts/check-banned-claims.ts:380-383 and the BANNED_CLAIM_EXCLUDED option-(b) rejection paragraph, both of which currently assert the spelling problem is closed when it has only moved"
  - truth: "guard_banned_claims's own PASS-line claim — 'the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region' — is true (bears on LANG-04's mechanical-enforcement guarantee)"
    status: failed
    reason: "CHANGELOG.md is silently outside the scan set check-banned-claims.ts consumes (publicDocsScan(), which is the public-document set AFTER check-public-docs-vocabulary.ts's own CHANGELOG.md exemption has been subtracted — and that exemption's own declaration states in terms that it 'does not exempt CHANGELOG.md from any other gate'). Reproduced independently: CHANGELOG.md carries two live, unconditional 'token economy'/'token-economy' literal occurrences today (lines 30, 68) — the disproven claim this gate's own founding D-44 transcript names as 'the drift this gate exists for'. Planting the identical D-44 draft conformance claim into CHANGELOG.md on a hermetic mirror exits 0 and is never named; the identical bytes in README.md exit 1 and are named twice. This predates round 5 (the derivation is unchanged in this diff) and was not reported in rounds 1-4, but it was not surfaced or addressed by this round's closure of G-29-2 either, and it directly falsifies the guard's own PASS-line claim that LANG-04 asks it to make truthfully."
    artifacts:
      - path: "scripts/check-banned-claims.ts"
        issue: "consumes publicDocsScan() (post-exemption) instead of the pre-exemption public-document corpus; CHANGELOG.md is a root markdown document by check-public-docs-vocabulary.ts's own classification (10 = 4 root md minus the CHANGELOG.md exemption + 5 examples + 1 kit README) and falls out of scope silently"
      - path: "CHANGELOG.md"
        issue: "lines 30 and 68 carry live, unscanned occurrences of the banned token-economy literal group"
    missing:
      - "Export the pre-exemption public-document corpus from check-public-docs-vocabulary.ts alongside the post-exemption scan set, so each consumer names which question it is asking; have check-banned-claims.ts consume the pre-exemption corpus and move BANNED_CLAIM_SCAN_COUNT 82 -> 83 with CHANGELOG.md named as the entrant"
      - "Delete or rewrite the two token-economy sentences at CHANGELOG.md:30 and :68 so the changelog records the mechanism (compaction) without restating the disproven claim"
      - "Add a permanent case in check-banned-claims.test.ts planting a banned literal in CHANGELOG.md and asserting the gate names it"
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 29 (gap-closure round 5): Verification Report

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced block per role and is measured as voice, not as sentence shape.
**This round's scope:** Close two UAT gaps — **G-29-1** (LANG-07, plan 29-40) and **G-29-2** (LANG-04, plans 29-41 + 29-42) — surfaced by `29-UAT.md` against the prior verification (`29-VERIFICATION.md`, 2026-08-16, `human_needed`, 8/8 must-haves).
**Verified:** 2026-08-17T16:10:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 5 gap-closure, following UAT decisions (b) schedule-closure for G-29-1 and (c) structural-fix for G-29-2.

## Method

This report does not re-derive what the round's own code review (`29-REVIEW-round5.md`, committed
`188472a`) already measured — that review's every published number was independently spot-checked by
me and reproduced. Where the review found a blocker, I reproduced the blocker myself on a fresh
`git archive HEAD` mirror, one plant per mirror, before accepting it as fact. Where the review found
clean work, I ran the same class of check independently (tripwire test suite, catalog freshness,
frontmatter import grep) rather than taking the review's word alone.

## Goal Achievement — This Round's Two Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **LANG-07** — one frontmatter grammar governs the tree; `generate-catalog.ts` declares no parser of its own | ✓ VERIFIED | `grep -n "function parseFrontmatter" scripts/generate-catalog.ts` → 0 hits (only a historical comment at line 20). `parseFrontmatter` imported from `./frontmatter.js` at line 76, called at 214 and 283. `npm run freshness:catalog` → "Catalog fresh: docs/catalog/README.md matches a fresh regeneration." `FRONTMATTER_PARSER_OWNERS` / `FRONTMATTER_PARSER_OWNER_COUNT` in `check-foundation-guards.test.ts:1719-1720` asserted at exactly `["scripts/frontmatter.ts"]`; ran the full 221-case file — 221/221 passed. `V-29-35-01` recorded CLOSED in both `docs/audit/29-locator-unification.md` §9.3c and `docs/audit/29-round4-residuals.md`'s roll-up. |
| 2 | **LANG-04** — `guard_banned_claims` DECIDES the comprehension-benefit prohibition rather than enumerating a phrase list (user decision (c), structural fix; (a) and (b) explicitly rejected) | ✗ FAILED | Reproduced independently: `increases comprehension`, an unlisted benefit verb, bypasses the gate entirely (exit 0, `ALL CHECKS PASSED`, never named) while `improves comprehension` — a listed verb — reds correctly. `BENEFIT_VERB_MARKERS` is a hand-authored 7-stem list; the guard still holds a spelling list, one slot to the left of where it held one before. See Gaps below. |

**Score:** 1/2 this round's truths verified.

### Related finding bearing on LANG-04 (not part of the round's authored must-haves, but falsifies the guard's own PASS-line claim)

`check-banned-claims.ts`'s PASS line asserts "the shipped kit and the public documents carry no
conformance, token-economy or comprehension claim, outside one named exemption region." Reproduced
independently: `CHANGELOG.md` is silently outside the gate's scan set and carries two live,
unconditional `token-economy` literal occurrences today (`CHANGELOG.md:30`, `:68`) — the exact claim
this gate's own D-44 transcript calls "the drift this gate exists for." This defect pre-dates round 5
(the derivation is unchanged in the round's diff) and was not reported in rounds 1-4, but it was
neither surfaced nor addressed by this round's G-29-2 closure, and it directly contradicts the
guarantee LANG-04 requires `guard_banned_claims` to hold mechanically. See Gaps below.

### Required Artifacts (this round)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/generate-catalog.ts` | no private frontmatter parser; consumes `scripts/frontmatter.ts` authority | ✓ VERIFIED | 0 local `parseFrontmatter` declarations; three-symbol import matches sibling's set |
| `scripts/generate-catalog.test.ts` | permanent cases for unreadable frontmatter, duplicated key, empty-valued cadence | ✓ VERIFIED | `npx vitest run scripts/generate-catalog.test.ts` — passes as part of the 87-test combined run I executed |
| `scripts/check-foundation-guards.test.ts` | derived `FRONTMATTER_PARSER_OWNERS` tripwire over recursive module set | ✓ VERIFIED | 221/221 tests pass; owner set asserted `["scripts/frontmatter.ts"]` |
| `scripts/check-banned-claims.ts` | comprehension prohibition decided by a rule, not an enumeration | ✗ STUB-EQUIVALENT | The rule exists mechanically (uses `requiresOnSameLine`) but its marker-list half is exactly the enumeration the round was built to remove; independently reproduced bypass |
| `scripts/check-banned-claims.test.ts` | permanent cases holding the whole measured family, relaxed cardinality pin, unambiguous plant selection | ✓ VERIFIED (as far as it goes) | The cases that exist pass and correctly discriminate the *named* family from `29-UAT.md`; they do not (and could not, by construction) cover the undisclosed verb-axis bypass, because no case in this round attacks the verb axis |
| `docs/audit/29-round5-residuals.md` | round's disposition record, both gaps, attack log, residuals | ⚠️ INCOMPLETE | Exists, well-formed, matches round-4's idiom; records G-29-2 as **closed** and does not carry the verb-axis residual (CR-02) as a named item — the register's own honesty floor is not met on this one axis |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `generate-catalog.ts` frontmatter reads | `scripts/frontmatter.ts::parseFrontmatter` | named import, both call sites | ✓ WIRED | Verified by grep and by `freshness:catalog` byte-identity |
| `BENEFIT_VERB_MARKERS` | `lineHits`'s `requiresOnSameLine` arm | conditional member declaration | ✓ WIRED (mechanically) | Confirmed the mechanism runs; the *coverage* of that mechanism is the gap, not its wiring |
| `docs/audit/29-round5-residuals.md` | the next verification round | committed artifact, read by this report | ⚠️ PARTIAL | Records three of the four residuals introduced or exposed this round; omits the fourth (verb-axis enumeration) entirely |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Listed-verb comprehension claim reds | plant "Controlled language improves comprehension for language models." on `git archive HEAD` mirror, run committed `check-banned-claims.js` | exit 1, named at file:line:col | ✓ PASS |
| Unlisted-verb comprehension claim bypasses | plant "Controlled language increases comprehension for language models." (same mirror, same doc) | exit 0, `ALL CHECKS PASSED`, never named | ✓ REPRODUCES CR-02 (this is the failing behavior, correctly reproduced) |
| CHANGELOG.md scan-set gap | plant D-44 draft claim into `CHANGELOG.md` on mirror vs identical bytes into `README.md` | CHANGELOG.md: exit 0, unnamed. README.md: exit 1, named twice | ✓ REPRODUCES CR-01 |
| `generate-catalog.ts` no longer declares its own parser | `grep -c 'function parseFrontmatter' scripts/generate-catalog.ts` | 0 | ✓ PASS |
| Catalog byte-identity | `npm run freshness:catalog` | "Catalog fresh: ... matches a fresh regeneration." | ✓ PASS |
| Owner tripwire suite | `npx vitest run scripts/check-foundation-guards.test.ts` | 221 passed | ✓ PASS |
| Full non-e2e suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 52 files, 2054 passed / 2 skipped / 0 failed | ✓ PASS |
| Typecheck | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Seven repo gates | `npm run check:public-docs`, `:audit-register`, `:claim-anchors`, `:banned-claims`, `:imperative-lexicon`, `:diff-disposition`, `:nul-bytes` | all `ALL CHECKS PASSED` | ✓ PASS mechanically — **but `check:banned-claims`'s PASS line is itself the false claim under CR-01/CR-02; a green gate is not proof here** |

### Requirements Coverage

| Requirement | Source Plan | Description (abridged) | Status | Evidence |
|--------------|-------------|--------------------------|--------|----------|
| LANG-07 | 29-40 | one fence parser, never two grammars over the same bytes | ✓ SATISFIED | see truth #1 above |
| LANG-04 | 29-41, 29-42 | guard enforces exactly the profile's decidable subset; conformance prohibition mechanical, held by `guard_banned_claims` | ✗ BLOCKED | see truth #2 and the related PASS-line finding above |

LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-08 are outside this round's scope (not touched by
plans 29-40/41/42) and are not re-verified here; their status in `REQUIREMENTS.md` is unchanged by
this report.

No requirement ID declared in plans 29-40/41/42 (`LANG-07`, `LANG-04`, `LANG-04`) is missing from
`REQUIREMENTS.md`'s Phase 29 mapping — no orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/check-banned-claims.ts` | 326-334 | `BENEFIT_VERB_MARKERS` — hand-authored enumeration presented as closing an enumeration defect | 🛑 BLOCKER (CR-02) | The very failure class G-29-2 was opened to remove is reproduced, undisclosed |
| `scripts/check-banned-claims.ts` | 125-128, imports `publicDocsScan()` | scan set silently excludes a document the owning module itself classifies as public | 🛑 BLOCKER (CR-01) | 2 live disproven-claim occurrences in `CHANGELOG.md` unscanned |
| `scripts/check-banned-claims.ts` | 974-979 | `BANNED_CLAIM_EXEMPT_SUPPRESSED`'s breakdown paragraph reads 6+3+2=11 against a pin of 12; measured breakdown is 6+2+4=12 | ⚠️ WARNING | Arithmetic in a comment does not sum to its own pin; does not affect gate behavior |
| `scripts/generate-catalog.ts` | 13, 257, 260, 347 vs 28, 302 | two contradictory workflow counts (16 vs 19) four lines apart, one stale, one added this round | ⚠️ WARNING | Comment drift, no behavioral effect (regex-driven, range-free at the contract) |
| `scripts/check-banned-claims.test.ts` | 292-320 | new control-byte assertion duplicates (weaker) an existing repo-wide gate (`check-nul-bytes.ts`) without naming it | ⚠️ WARNING | Not a correctness defect; a missed opportunity to consolidate authorities |
| `scripts/check-banned-claims.ts` | 455-463, 471-475 | `understand` substring member is the largest new false-red surface this round introduces and carries no `V-` id (unlike the two zero-live shapes that do) | ⚠️ WARNING | Documentation-register consistency issue, not a safety gap (fail-CLOSED direction) |
| `scripts/check-banned-claims.test.ts` | 2110-2142 | case name claims the *gate* refuses an empty-marker-array member; only the *test* does | ⚠️ WARNING | Case-name/assertion mismatch, AP-1-adjacent |

No unreferenced `TBD`/`FIXME`/`XXX` markers found in the round's changed files.

### Human Verification Required

None. Both blocking findings (CR-01, CR-02) are independently reproducible and their disposition
(FAILED, not UNCERTAIN) does not require a human judgment call — the user's decision of record for
G-29-2 was explicit (structural fix, enumeration rejected), and the delivered mechanism is
demonstrably still an enumeration on a different axis. This is a mechanical falsification of the
must-have, not an editorial question.

### Gaps Summary

**LANG-07 is genuinely closed.** Plan 29-40's work — deleting the private parser, routing through the
authority, proving byte-identity, and adding a derived owner tripwire — holds up under independent
reproduction on every axis checked: no private parser remains, the catalog is byte-identical, the
tripwire suite is 221/221 green, and the audit trail records the closure in both places that named it
open. This can move to `Complete`.

**LANG-04 is not closed**, on two independently reproduced grounds:

1. **CR-02 (the round's own scope).** The "structural fix" the user explicitly ordered — decide a
   rule rather than enumerate a phrase list — is not what shipped. `BENEFIT_VERB_MARKERS` is a
   7-stem hand-authored list, and any benefit verb outside it (`increases`, `raises`, `aids`, and
   others) defeats the rule on a live comprehension-benefit claim, exactly as any interposed word
   defeated the old six-phrase enumeration. This is not a narrower residual of the original bug — it
   is the identical defect relocated one slot to the left, unmeasured against the axis that would
   have found it (the round's 13-item adversarial log attacked the window, the encoding, and the
   exemption boundary; none varied the verb), and undisclosed in `docs/audit/29-round5-residuals.md`,
   whose own honesty floor names three other new-this-round residuals but not this one.
2. **CR-01 (pre-existing, newly surfaced, still unaddressed).** `CHANGELOG.md` is silently outside
   the gate's scan set and carries two live occurrences of the exact claim (`token-economy`) this
   gate's founding transcript names as its reason to exist. This is not new to this round, but this
   round's closure of G-29-2 did not surface or address it, and it directly falsifies the LANG-04
   guarantee that `guard_banned_claims` mechanically holds the prohibition.

Both are BLOCKER-severity per this repository's standing rule that a green suite is not proof for a
safety invariant — the gate exits 0 with `ALL CHECKS PASSED` on both reproduced bypasses.

**Recommendation:** LANG-07 → `Complete`. LANG-04 → stays `Gaps Found`; route to a round-6
gap-closure plan addressing CR-02 (open `V-29-42-05` at minimum, then pursue the reviewer's suggested
positional/subject-side rule) and CR-01 (widen the scan corpus to the pre-exemption public-document
set and clean the two live `CHANGELOG.md` occurrences).

---

_Verified: 2026-08-17T16:10:00Z_
_Verifier: Claude (gsd-verifier)_
