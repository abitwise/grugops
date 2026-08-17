---
phase: 29-controlled-language-voice-guard-rebuild
round: 6
verified: 2026-08-17T21:30:00Z
status: gaps_found
score: 3/5 must-haves verified (this round's scope: LANG-04's two round-5 gaps closed; LANG-04's overall mechanical guarantee still fails, on two NEW grounds this round's own review found; LANG-07 regression-clean; requirements traceability inverted)
behavior_unverified: 0
overrides_applied: 0
re_verification: true
re_verification_scope:
  round: 6 (gap-closure round, plans 29-43, 29-44, 29-45, 29-46, 29-47)
  previous_status: gaps_found (29-VERIFICATION-round5.md, 2026-08-17) -> LANG-07 verified/Complete-recommended, LANG-04 failed on CR-01 (CHANGELOG.md unscanned) and CR-02 (verb-marker enumeration relocated, not deleted) -> gap-closure plans 29-43..29-47 executed -> this verification
  gaps_closed:
    - "Round-5 CR-02 (verb-marker enumeration relocated from the phrase slot to the verb slot) — CLOSED BY DELETION. `BENEFIT_VERB_MARKERS`, `CONFORMANCE_VERB_MARKERS` and the `requiresOnSameLine` field are gone from source, twin and type (0/0/0 by grep, confirmed independently). `lineHits` carries no conditional arm. The nine plants that bypassed the pre-change gate (5 comprehension-verb, 4 conformance-verb) all red by name on the final tree — independently confirmed via the full non-e2e suite (2068/2068 passed) and `node scripts/check-banned-claims.js` exiting 0 with `115/115 elements` scanned."
    - "Round-5 CR-01 (CHANGELOG.md silently outside the scan set, carrying two live token-economy occurrences) — CLOSED. `publicDocsCorpus()` now exists beside `publicDocsScan()`; `check-banned-claims.ts` consumes the corpus (confirmed by grep: `publicDocsCorpus` imported at line 140, `publicDocsScan()` nowhere referenced in that file). `BANNED_CLAIM_SCAN_COUNT` moved 82 -> 115. `CHANGELOG.md` is inside the live scan set (confirmed: gate reports 115/115 elements including publicDocs 11, which is the corpus that admits CHANGELOG.md)."
  gaps_remaining:
    - "The truth this round's own plan 29-47 declared as its second must-have — 'guard_banned_claims's own PASS-line claim is TRUE OF THE CORPUS IT ACTUALLY SCANS' — is FAILED on two grounds this round's own code review (29-REVIEW-round6.md) found and this verification independently reproduced. CR-01 (round 6): the sole exemption region (`agent-factory/writing-profile.md` § Disclaimer and honesty floor) is bounded only by LINE COUNT, not by CONTENT — a live, disproven token-economy claim substituted for the honest denial at line 288 leaves both pins (`suppressed=14`, `extent=62`) unmoved and the gate exits 0, `ALL CHECKS PASSED`. CR-02 (round 6): the kit's two shipped JSON manifests (`.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`) are user-visible claim surfaces (read by every `/plugin marketplace add` user) that no gate scans at all — planting `improves comprehension` into `marketplace.json`'s `description` field exits 0, unnamed, on every sibling gate."
    - "A requirement-marking inversion (V-29-47-05, opened by round 6's own residual register): `.planning/REQUIREMENTS.md` currently carries `LANG-04 | Phase 29 | Complete` and `LANG-07 | Phase 29 | Gaps Found` — the exact inverse of round 5's verified recommendation (LANG-07 -> Complete, LANG-04 -> stays Gaps Found). Set by plan 29-45's docs commit `d5360dc` via an automated `requirements mark-complete` step acting on round-6 SUMMARY `requirements-completed:` fields, before any round-6 verification existed."
  regressions: []
gaps:
  - truth: "LANG-04 — `guard_banned_claims`'s own PASS-line claim ('the shipped kit and the public documents carry no conformance, token-economy or comprehension claim, outside one named exemption region') holds mechanically, with no fail-open route"
    status: failed
    reason: "Two live, independently reproduced fail-open bypasses exist on the tree at HEAD. (1) The sole exemption region is bounded only by line position, not by content: substituting a live disproven claim for one denial sentence inside the region leaves both cardinality pins unmoved and the gate green. (2) The gate's scan class is markdown-only by construction; the two shipped JSON plugin manifests that carry the kit's public-facing marketing description are never read by any gate, and a planted banned claim in `.claude-plugin/marketplace.json`'s `description` field is invisible to all seven repo gates. Both were found by this round's own code review (29-REVIEW-round6.md CR-01/CR-02) and independently reproduced by this verification on hermetic `git archive HEAD` mirrors with sha256-verified gate binaries (identical to the repository's `6f0722fa...b385ba`)."
    artifacts:
      - path: "scripts/check-banned-claims.ts"
        issue: "`locateExemptRegion`/`BANNED_CLAIM_EXEMPT_SUPPRESSED`/`BANNED_CLAIM_EXEMPT_EXTENT` (around lines 1241-1537) pin the region's cardinality (how much it lifts, how far it reaches) but nothing pins its CONTENT — a same-line-count substitution of one occurrence for another inside the region is invisible to both pins."
      - path: "scripts/check-banned-claims.ts"
        issue: "`BANNED_CLAIM_EXCLUDED_LOCATIONS` (lines 729-735) and the module's scan-part derivation are markdown-scoped; `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are outside both the scan and the exclusion list, and outside every markdown scan by construction."
    missing:
      - "Close CR-01 structurally: either pin the composition of the suppressed/extent breakdown per-group (raises the cost, does not close it), or — the reviewer's stronger fix — require every suppressed occurrence to sit inside a registry-anchored, byte-frozen block (extending the `check-claim-anchors` mechanism that already covers C-28-039/C-28-042 over the exemption region), so the carve-out is bounded positionally AND by content."
      - "Close CR-02: add the two `.claude-plugin/*.json` manifests as a sixth derived scan part (or an equivalent declared non-markdown claim-surface class), move `BANNED_CLAIM_SCAN_COUNT` with the entrants named, and widen the coverage case's denominator beyond `git ls-files '*.md'` so the next non-markdown claim surface reds on the day it lands."
      - "Re-run this verification's two mirror reproductions (documented below) against the fix and confirm both now red by name before recommending LANG-04 -> Complete."
  - truth: "`.planning/REQUIREMENTS.md`'s Phase 29 traceability rows for LANG-04 and LANG-07 reflect the verified state of each requirement"
    status: failed
    reason: "The tree carries `LANG-04 | Phase 29 | Complete` and `LANG-07 | Phase 29 | Gaps Found` (both `:82`/`:183` and `:186` in REQUIREMENTS.md). This is the exact inverse of the correct state: LANG-04 is NOT met (see the truth above — two live, reproduced bypasses of its mechanical guarantee), and LANG-07 IS met (round 5 genuinely closed it via plan 29-40's deletion of the private `parseFrontmatter`, and this round's regression check — `grep -c \"function parseFrontmatter\" scripts/generate-catalog.ts` = 0, `npm run freshness:catalog` = fresh — confirms no round-6 plan disturbed it). The flip was set by an automated `requirements mark-complete` step reading each round-6 SUMMARY's `requirements-completed: [LANG-04]` field on commit `d5360dc`, before any round-6 verification existed — it is a process artifact, not a verified fact."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Line ~82/183 checkbox and traceability row read LANG-04 as `[x]`/`Complete`; line ~85/186 read LANG-07 as `[ ]`/`Gaps Found`. Both are wrong."
    missing:
      - "Flip both rows: LANG-04 -> `[ ]` / `Gaps Found` (traceability row `Phase 29 | Gaps Found`); LANG-07 -> `[x]` / `Complete` (traceability row `Phase 29 | Complete`)."
      - "This correction belongs to the verifier/orchestrator applying this report, not to a phase plan — plan 29-47 deliberately left `.planning/REQUIREMENTS.md` byte-unchanged specifically to reserve this verdict for verification (confirmed: `git diff --exit-code f718069..HEAD -- .planning/REQUIREMENTS.md` exits 0)."
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 29 (gap-closure round 6): Verification Report

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two agents reading the same instruction reach the same act; the caveman voice lives in exactly one fenced block per role and is measured as voice, not as sentence shape.
**This round's scope:** Close round 5's two failed truths on **LANG-04** — CR-01 (`CHANGELOG.md` unscanned) and CR-02 (the verb-marker enumeration was a relocation, not a deletion) — via plans 29-43 through 29-47 (`f718069..HEAD`, commit `2f66124`).
**Verified:** 2026-08-17T21:30:00Z
**Status:** gaps_found
**Re-verification:** Yes — round 6 gap-closure, following round 5's verdict (`29-VERIFICATION-round5.md`, `gaps_found`, 1/2, recommending LANG-07 -> Complete and LANG-04 -> stays Gaps Found).

## Method

This round's own code review (`29-REVIEW-round6.md`, 2 critical / 6 warning / 4 info findings) already
re-derived every published number independently and reproduced its two critical findings on hermetic
mirrors. I did not take that review's word for either finding: I built my own fresh `git archive HEAD`
mirrors, confirmed each mirror's committed `scripts/check-banned-claims.js` was sha256-identical to the
repository's (`6f0722fa6fb8f82d3875c1df3f239ff4db193e6fb9fb40e70da8224c19b385ba` on both), and reproduced
both critical findings myself from scratch — documented under Behavioral Spot-Checks below. I also
independently confirmed the round's two genuine closures (CR-01/CR-02 from round 5) by grep, by the
gate's own PASS line, and by running the full non-e2e suite once. I read `docs/audit/29-round6-residuals.md`
in full (1173 lines) as the round's own disposition record, and cross-checked its `V-29-47-05` finding
(the requirements inversion) against `.planning/REQUIREMENTS.md` and `git log` directly rather than
accepting the residual register's transcript alone.

This repository's phase 29 record now holds nine documented false harness results across five rounds,
including one produced by this very round's own adversarial pass (caught before publication, per
`docs/audit/29-round6-residuals.md` §2.1). A green suite is treated as evidence of nothing on this phase
without an independent reproduction alongside it.

## Goal Achievement — This Round's Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **LANG-04 (round-5 CR-02)** — the verb/subject-marker enumeration is DELETED, not relocated to a third slot | ✓ VERIFIED | `grep -rn "BENEFIT_VERB_MARKERS\|CONFORMANCE_VERB_MARKERS\|requiresOnSameLine" scripts/check-banned-claims.ts scripts/check-banned-claims.js scripts/check-banned-claims.test.ts` → 0 hits (independently run). `npx tsc --noEmit` → exit 0. Full non-e2e suite: 52 files, 2068 passed / 2 skipped, exit 0 (independently run). `node scripts/check-banned-claims.js` → `ALL CHECKS PASSED`, `0 findings over 115/115 elements`. |
| 2 | **LANG-04 (round-5 CR-01)** — `CHANGELOG.md` and the pre-exemption public-document corpus are inside the live scan set | ✓ VERIFIED | `grep -n "publicDocsCorpus\|publicDocsScan" scripts/check-banned-claims.ts` shows the corpus imported at line 140 and consumed at line 789; `publicDocsScan()` is never referenced in this file. Gate PASS line reports `kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1` = 115, and `publicDocs 11` is the pre-exemption corpus that includes `CHANGELOG.md`. |
| 3 | **LANG-04 (overall)** — `guard_banned_claims`'s own PASS-line claim is mechanically true, with no fail-open route | ✗ FAILED | Independently reproduced on two fresh sha256-verified mirrors (see Behavioral Spot-Checks): (a) a content substitution inside the sole exemption region leaves both cardinality pins unmoved and the gate green; (b) a banned claim planted into `.claude-plugin/marketplace.json`'s shipped `description` field is invisible to every gate. Both are round-6's own review findings (CR-01, CR-02 in `29-REVIEW-round6.md`), reproduced fresh rather than taken on the review's word. |
| 4 | **LANG-07 (regression)** — one frontmatter grammar still governs the tree; round 6 did not reintroduce a second parser | ✓ VERIFIED | `grep -c "function parseFrontmatter" scripts/generate-catalog.ts` → 0 (independently run). `npm run freshness:catalog` → "Catalog fresh: docs/catalog/README.md matches a fresh regeneration." (independently run). Plan 29-46 edited `generate-catalog.ts` (deleted stale cardinality comments) without touching the frontmatter import. |
| 5 | **Process** — `.planning/REQUIREMENTS.md`'s LANG-04/LANG-07 rows reflect the verified state | ✗ FAILED | `.planning/REQUIREMENTS.md:82` and `:183` read LANG-04 `[x]`/`Complete`; `:85`/`:186` read LANG-07 `[ ]`/`Gaps Found` — the exact inverse of truths 3 and 4 above. Set by commit `d5360dc` (plan 29-45's docs commit, via an automated per-SUMMARY `requirements-completed:` marker), before any round-6 verification. |

**Score:** 3/5 truths verified this round.

## LANG-04 — explicit disposition (per the verification brief's must-check #1)

**LANG-04 cannot be called met.** Two fail-open findings from this round's own code review were
independently reproduced by this verification, on fresh hermetic mirrors with a sha256-verified gate
binary, and neither is disclosed anywhere as an accepted residual or covered by an override:

- **CR-01 (round 6).** The sole exemption region (`agent-factory/writing-profile.md` § "Disclaimer and
  honesty floor") is bounded only by position (`headingAt`/`endBefore`, cardinality pins `suppressed=14`,
  `extent=62`). Nothing bounds its content. I built a fresh mirror, confirmed its gate binary
  sha256-matched the repository's, then replaced line 288 — the honest denial "There is no evidence that
  controlled language improves comprehension for a language model." — with "grugops is a token economy:
  the token economy is the whole product." Both pins stayed exactly at 14 and 62; `check-banned-claims`
  exited 0, `ALL CHECKS PASSED`. The only visible change was the unpinned per-group breakdown
  (`token-economy 2, comprehension 4` -> `token-economy 4, comprehension 2`) inside a PASS line nothing
  asserts against.
- **CR-02 (round 6).** `.claude-plugin/marketplace.json`'s `description` field is the exact string a user
  meets running `/plugin marketplace add`. I planted `"grugops marketplace — controlled language that
  improves comprehension for language models and saves tokens."` into that field on a fresh mirror and ran
  the gate: `ALL CHECKS PASSED`, `0 findings over 115/115 elements`. The gate's scan class is markdown-only
  by construction (`BANNED_CLAIM_EXCLUDED_LOCATIONS` is markdown-prefix-scoped and the scan parts all walk
  `*.md`); the module dispositions exactly one non-markdown path
  (`.claude/settings.local.json`) and says nothing about the class boundary, so both shipped JSON
  manifests are outside the gate and outside the exclusion list.

Both are FAIL-OPEN and reachable with no protocol violation — no re-pin step, no author error required.
The user decision of record for this axis (D-48/D-53) was that the carve-out is deliberately POSITIONAL
rather than lexical; CR-01 shows the positional carve-out has no content bound, and CR-02 shows the
gate's own class boundary (markdown) leaves a live, user-facing claim surface unguarded entirely. Neither
defect existed in the form measured here before this round — the exemption region only became the *sole*
carve-out this round (D-53 deleted the co-occurrence alternative), and the round's own residual register
(`docs/audit/29-round6-residuals.md` §4, `V-29-47-02`/`V-29-47-03`) already names the region's
boundary-stability issues as open, but neither that register nor this round's plans disposition CR-01's
content-bound gap or CR-02's JSON-manifest gap as accepted — they are the code review's fresh findings,
carried forward here as blocking, per this repository's standing rule that a green suite (or an
undisclosed residual) is not proof for a safety invariant.

**Recommendation:** LANG-04 stays `Gaps Found`. A round-7 gap-closure plan should close CR-01 (bind the
exemption region by content, e.g. extending `check-claim-anchors`'s byte-freeze mechanism over it) and
CR-02 (add the two `.claude-plugin/*.json` manifests as a named, derived scan part).

## Requirements traceability inversion — explicit disposition (per the verification brief's must-check #2)

**The tree's current state is wrong and must be corrected to:**

| Requirement | Current REQUIREMENTS.md state | Correct state | Reason |
|---|---|---|---|
| LANG-04 | `[x]` / `Complete` | `[ ]` / `Gaps Found` | Not met — see the explicit disposition above. Two live, independently reproduced fail-open bypasses of the guard's own PASS-line guarantee. |
| LANG-07 | `[ ]` / `Gaps Found` | `[x]` / `Complete` | Met — round 5 genuinely closed it (private parser deleted, catalog byte-identical, owner tripwire 221/221 green), round 6 did not touch the frontmatter-authority wiring, and this round's regression check (independently run above) confirms no drift. |

This is the exact inverse of round 5's recorded verdict (`29-VERIFICATION-round5.md`: "LANG-07 →
`Complete`. LANG-04 → stays `Gaps Found`"). It was set by commit `d5360dc` (plan 29-45's docs commit)
acting on each round-6 plan's `requirements-completed: [LANG-04]` SUMMARY field through an automated
`requirements mark-complete` step — a process artifact of the executor pipeline, not a verified fact.
Plan 29-47 deliberately left `.planning/REQUIREMENTS.md` byte-unchanged (`git diff --exit-code
f718069..HEAD -- .planning/REQUIREMENTS.md` exits 0, independently confirmed) specifically to reserve
this determination for verification. **This report is that determination: both rows must be corrected
before the next round or ship step reads REQUIREMENTS.md.**

### Required Artifacts (this round)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-public-docs-vocabulary.ts` | `publicDocsCorpus()` exported beside `publicDocsScan()` | ✓ VERIFIED | Both symbols present; `check-banned-claims.ts` imports the corpus |
| `scripts/check-banned-claims.ts` | consumes the pre-exemption corpus; no marker/verb enumeration remains on any axis | ✓ VERIFIED (this axis) / ✗ STUB-EQUIVALENT (the exemption-region and JSON-manifest axes) | Marker deletion confirmed by grep (0/0/0); the surviving carve-out (the exemption region) is content-unbound and the scan class excludes shipped JSON — both independently reproduced |
| `scripts/check-banned-claims.test.ts` | permanent cases for the CHANGELOG plant, the corpus/scan relationship, tracked-markdown coverage | ✓ VERIFIED (as far as it goes) | Cases exist and pass (part of the 2068-test run); none of this round's new cases attack the exemption-region content axis or the JSON-manifest axis — consistent with those being the review's fresh findings rather than a regression in covered territory |
| `scripts/generate-catalog.ts` | stale cardinality comments deleted, frontmatter authority untouched | ✓ VERIFIED | 0 local `parseFrontmatter`; `freshness:catalog` clean |
| `scripts/check-nul-bytes.ts` | widened to the full forbidden control-byte class | ✓ VERIFIED (mechanically) | `npm run check:nul-bytes`-equivalent gate not independently re-run this round (out of this round's two-truth focus), but full non-e2e suite (which includes `check-nul-bytes.test.ts`) passed 2068/2068 |
| `docs/audit/29-round6-residuals.md` | round's disposition record | ✓ VERIFIED as a record | 1173-line record read in full; its own §3.6/§4 entries for `V-29-47-05` (requirements inversion) match what I independently confirmed against `.planning/REQUIREMENTS.md` and `git log`; its CR-01/CR-02 status is correctly NOT claimed closed anywhere in the record ("The verdict on LANG-04 belongs to the verifier") |
| `.planning/REQUIREMENTS.md` | reflects verified LANG-04/LANG-07 state | ✗ FAILED | Inverted — see disposition above |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `publicDocsCorpus()` | `check-banned-claims.ts`'s `publicDocsMembers()` | named import at line 140, called at line 789 | ✓ WIRED | Confirmed by grep; `CHANGELOG.md` is inside the scanned corpus |
| `BannedClaimLiteral` type | `lineHits()` | field removed from type, no conditional arm remains | ✓ WIRED (mechanically) | Confirmed: `requiresOnSameLine` absent from source, twin and tests; `lineHits()`'s body (quoted in the round's own residual register and spot-checked here) has no conditional predicate |
| exemption region pins (`suppressed`, `extent`) | the region's actual content | cardinality-only, no content digest | ✗ NOT WIRED (the gap) | Both pins measure quantity, neither measures content; a same-count substitution is invisible to both — independently reproduced |
| `BANNED_CLAIM_EXCLUDED_LOCATIONS` / scan parts | `.claude-plugin/*.json` | none — markdown-only scan class | ✗ NOT WIRED (the gap) | Neither file is a scan-part member nor an exclusion-list member; independently reproduced as unread |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Markers/verb-list fully deleted | `grep -rn "BENEFIT_VERB_MARKERS\|CONFORMANCE_VERB_MARKERS\|requiresOnSameLine" scripts/check-banned-claims.{ts,js} scripts/check-banned-claims.test.ts` | 0 hits | ✓ PASS |
| Typecheck | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Full non-e2e suite (run once) | `npx vitest run --exclude '**/scripts/e2e/**'` | 52 files, 2068 passed / 2 skipped, exit 0 | ✓ PASS |
| Live gate, clean tree | `node scripts/check-banned-claims.js` | `ALL CHECKS PASSED`, `0 findings over 115/115 elements` | ✓ PASS |
| `generate-catalog.ts` frontmatter regression | `grep -c "function parseFrontmatter" scripts/generate-catalog.ts` + `npm run freshness:catalog` | 0; "Catalog fresh" | ✓ PASS |
| **CR-01 reproduction (mine, independent of the review)** | fresh `git archive HEAD` mirror, sha256-verified gate (`6f0722fa...b385ba`, matches repo), replaced `writing-profile.md:288`'s honest denial with a live token-economy claim, re-ran gate | `suppressed` pin stayed 14, `extent` pin stayed 62, exit 0, `ALL CHECKS PASSED` (only the unpinned per-group breakdown moved) | ✓ REPRODUCES CR-01 — confirmed live bypass |
| **CR-02 reproduction (mine, independent of the review)** | fresh mirror, same sha256 verification, edited `.claude-plugin/marketplace.json`'s `description` to `"grugops marketplace — controlled language that improves comprehension for language models and saves tokens."`, re-ran gate | exit 0, `ALL CHECKS PASSED`, `0 findings over 115/115 elements` — the planted claim never named | ✓ REPRODUCES CR-02 — confirmed live bypass |

### Requirements Coverage

| Requirement | Source Plan | Description (abridged) | Status | Evidence |
|--------------|-------------|--------------------------|--------|----------|
| LANG-04 | 29-43, 29-44, 29-45, 29-46, 29-47 | guard enforces the profile's decidable subset; conformance prohibition mechanical, held by `guard_banned_claims` | ✗ BLOCKED | Round-5's two named gaps genuinely closed; two NEW round-6 blockers (CR-01/CR-02) reopen the mechanical guarantee — see explicit disposition above |
| LANG-07 | (not touched this round; verified in round 5, regression-checked here) | one fence parser, never two grammars over the same bytes | ✓ SATISFIED | Regression-clean; see truth #4 above. Currently mismarked `Gaps Found` in REQUIREMENTS.md — correction required |

LANG-01, LANG-02, LANG-03, LANG-05, LANG-06, LANG-08 are outside this round's scope (no round-6 plan
declares them in `requirements:`) and are not re-verified here; their status in REQUIREMENTS.md is
unchanged by this report. No requirement ID declared across plans 29-43..29-47 (`LANG-04` five times) is
missing from REQUIREMENTS.md's Phase 29 mapping — no orphans. All eight `LANG-` ids (`LANG-01`..`LANG-08`)
are present in REQUIREMENTS.md's Phase 29 row with no gaps in the enumeration.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/check-banned-claims.ts` | 1241, 1301, 1528-1537 | exemption-region pins are cardinality-only, no content bound | 🛑 BLOCKER (CR-01, this round's review, independently reproduced) | A same-count content substitution inside the sole carve-out is invisible to the gate |
| `scripts/check-banned-claims.ts` | 676-735, 864-867 | scan class is markdown-only; shipped JSON manifests undispositioned | 🛑 BLOCKER (CR-02, this round's review, independently reproduced) | `.claude-plugin/marketplace.json`'s public-facing description is an unread claim surface |
| `scripts/check-banned-claims.ts` | 645-667 | in-source record of a closed residual (`V-29-42-03`) is false on five counts, byte-unchanged all round | ⚠️ WARNING (V-29-47-01, informational, fail-closed direction) | Documentation-register consistency issue, not a live safety gap |
| `.github/workflows/ci.yml` | 221, 321 | CI comments describe both widened gates at their pre-widening scope (82 docs / NUL-only) | ⚠️ WARNING (V-29-47-06, informational) | Gates run correctly; only the workflow's own description of them is stale |
| `.planning/REQUIREMENTS.md` | 82-85, 183-186 | LANG-04/LANG-07 rows inverted against the round-5 verified verdict | 🛑 BLOCKER (process) | A requirement marked Complete that the verifier failed, and vice versa — see disposition above |

No unreferenced `TBD`/`FIXME`/`XXX` markers found in the round's changed files (per `29-REVIEW-round6.md`,
independently spot-checked with `grep -rn "TBD\|FIXME\|XXX" scripts/check-banned-claims.ts
scripts/check-nul-bytes.ts scripts/generate-catalog.ts scripts/check-public-docs-vocabulary.ts` → 0 hits).

### Human Verification Required

None. Both blocking findings (CR-01, CR-02) and the requirements inversion are independently reproducible
and their disposition (FAILED, not UNCERTAIN) does not require a human judgment call — both bypasses were
demonstrated end to end on sha256-verified hermetic mirrors, and the requirements-row inversion is a
direct file-content comparison against round 5's recorded, human-legible recommendation.

### Gaps Summary

**Round 5's two named gaps on LANG-04 are genuinely closed.** The verb/subject-marker enumeration
(`BENEFIT_VERB_MARKERS`, `CONFORMANCE_VERB_MARKERS`, `requiresOnSameLine`) is deleted from source, twin,
type and tests — not moved a third time — confirmed independently by grep, typecheck, and a full 2068-test
suite run. `CHANGELOG.md` and the wider public-document corpus are inside the live scan set (82 → 115
documents) — confirmed independently by grep of the import graph and by the gate's own PASS-line
breakdown.

**LANG-04 is still not closed**, on two grounds this round's own code review found and this verification
independently reproduced from scratch, on fresh sha256-verified mirrors:

1. **CR-01.** The sole exemption region — the *only* carve-out left standing after this round deleted the
   marker mechanism — is bounded by position, not by content. A live, disproven claim substituted for a
   denial sentence inside the region is invisible to both cardinality pins and the gate exits 0.
2. **CR-02.** The gate's scan class is markdown-only by construction. The kit's two shipped JSON plugin
   manifests — the strings every `/plugin marketplace add` user reads — are outside the scan and outside
   the exclusion list. A banned claim planted into `marketplace.json`'s `description` is invisible to
   every one of the seven repo gates.

Both are BLOCKER-severity per this repository's standing rule that a green suite is not proof for a safety
invariant — the gate exits 0 with `ALL CHECKS PASSED` on both independently reproduced bypasses, and
neither is disclosed anywhere as an accepted, dispositioned residual.

**Separately, `.planning/REQUIREMENTS.md` is currently wrong** for both requirements this round and its
predecessor touched: LANG-04 reads `Complete` (should be `Gaps Found`, per the finding above) and LANG-07
reads `Gaps Found` (should be `Complete`, per round 5's genuine closure and this round's clean regression
check). This was set by an automated process step before any round-6 verification existed, and must be
corrected as part of applying this report.

**Recommendation:** LANG-04 stays `Gaps Found`; route to a round-7 gap-closure plan addressing CR-01 (bind
the exemption region by content — extend `check-claim-anchors`'s byte-freeze mechanism over it, per the
round-6 review's suggested fix) and CR-02 (add the two `.claude-plugin/*.json` manifests as a named,
derived scan part and widen the coverage case's denominator beyond `*.md`). Correct
`.planning/REQUIREMENTS.md`'s LANG-04 and LANG-07 rows to their verified states before the next round or
ship step reads that file.

---

_Verified: 2026-08-17T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
