---
phase: 29-controlled-language-voice-guard-rebuild
verified: 2026-08-14T21:15:00Z
status: gaps_found
score: 4/8 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission."
    accepted_by: "Olger Oeselg"
    accepted_at: "2026-08-15T09:57:04Z"
gaps:
  - truth: "LANG-03 — a named safety-surface exclusion list is honoured so that load-bearing security, compliance, and admission text is never reworded by a style pass"
    status: failed
    reason: >
      guard_diff_disposition's registryAnchors companion-edit rule decides "the companion changed"
      by testing whether docs/audit/28-claim-registry.md appears ANYWHERE in `git diff --name-only
      <base>` (range-wide), not whether it changed in the SAME commit as the frozen clause. Confirmed
      independently on the live tree: `git diff --name-only 4d2b8f0 -- docs/audit/28-claim-registry.md`
      returns a hit right now, so every one of the 42 registryAnchors frozen clauses (170 clause
      occurrences per code review) is presently unprotected — a rework of a registry-anchored
      load-bearing sentence today would satisfy the companion check regardless of whether an actual
      companion edit occurred in the same commit. The exclusion LIST itself (41-file safety-surface
      union) is intact and correctly derived; the FREEZE mechanism that is supposed to make the
      "never reworded" promise mechanical, not just a list, is the part that is currently vacuous.
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "lines 1039-1041 (allChangedFiles) and 1141-1142 (registryAnchors satisfied check) use a range-wide file-presence test instead of a same-commit / per-clause pairing (CR-02 in 29-REVIEW.md)"
    missing:
      - "Resolve which commit actually carries each changed clause and require the companion edit in that commit, or narrow to per-clause pairing against a diff of docs/audit/28-claim-registry.md (fix sketch already in 29-REVIEW.md CR-02)"
      - "Apply the same treatment to the positiveGuardLiterals arm, which has the identical shape and is only currently safe because scripts/check-foundation-guards.ts has not changed in the range"
      - "Add a three-commit harness case: companion touched in commit 2, frozen clause changed in commit 3, expect exit 1"
  - truth: "LANG-04 — the guard is named for exactly the decidable subset it checks (guard_imperative_lexicon: lexicon membership at imperative position)"
    status: failed
    reason: >
      guard_imperative_lexicon's own banner claims "every `## Steps` bullet begins with a verb ...
      at position zero." LIST_MARKER only admits up to three leading spaces
      (`/^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+/`), confirmed by direct read of
      scripts/check-imperative-lexicon.ts:480. A CommonMark sub-bullet indented four or more spaces
      under a numbered step is invisible to the guard: it is not counted as a `## Steps` bullet (so
      WP-01 never sees it, and the denominator does not even record the loss), is reclassified
      `procedural === false` (measured against WP-03's 25-word bound instead of WP-02's 20), and is
      skipped by WP-05 and WP-08 entirely. The live corpus has zero such bullets today (139 counted,
      matching the gate's own PASS output), so this is a latent hole rather than a currently wrong
      count — but the guard is not enforcing "exactly" the decidable subset it is named for; it is
      enforcing a narrower, undocumented subset (top-level bullets only).
    artifacts:
      - path: "scripts/check-imperative-lexicon.ts"
        issue: "LIST_MARKER (line ~480) and the inSteps/isBullet/procedural logic (lines ~698-717) do not admit indented sub-bullets (CR-03 in 29-REVIEW.md)"
    missing:
      - "Widen LIST_MARKER to admit any nesting depth and keep the ## Steps section anchor sticky across ### sub-headings"
      - "Re-run the gate and disposition whatever new findings the widened denominator produces"
      - "Add a harness case planting a four-space-indented non-conforming bullet and asserting exit 1 plus a bullet count of N+1"
  - truth: "LANG-06 — the rebuilt voice guard measures voice against a committed lexicon (i.e. reliably identifies which bytes are the caveman block)"
    status: failed
    reason: >
      readCavemanFence (scripts/voice-model.ts:93-128, confirmed by direct read) is documented as
      locating "the SECTION-ANCHORED caveman fence" but is not section-bounded: after finding the
      `## Caveman prompt` heading it scans forward to end of file for the first fence delimiter, with
      no bound at the next `## ` heading. A role file whose Caveman prompt section carries no fence
      (or is reworded to plain prose) silently adopts a LATER fence elsewhere in the file as "the
      caveman block" — both guard_voice and guard_caveman_voice then pass, measuring the wrong bytes.
      This is not hypothetical: orchestrator.md already carries two independent fenced blocks outside
      its caveman section (confirmed: fence delimiters at lines 14/19 for the caveman section and
      44/53 for an unrelated later block), so the failure mode's precondition already exists in the
      shipped corpus and only requires the caveman section's own fence to be removed or malformed to
      trigger it. On the CURRENT well-formed 17 role files this does not misfire (every caveman
      section's own fence is the first one found), so the acceptance-evidence claim ("fails RED on
      all 17 blocks before the rewrite," verified in 29-01-SUMMARY.md's 17/17 RED transcript, 0
      lexicon tokens / 597 content words, 54 banned constructions) and the "publishes a number with a
      denominator" claim (confirmed live: "0 findings over 17/17 elements") both hold. What does not
      hold is the ongoing, present-tense guarantee that the guard reliably measures the SECTION it
      claims to — that guarantee has a proven, reproducible bypass (CR-01 in 29-REVIEW.md).
    artifacts:
      - path: "scripts/voice-model.ts"
        issue: "readCavemanFence (lines 93-128) scans to EOF instead of bounding to the next `## ` heading; the close scan has the same unbounded shape; CAVEMAN_HEADING_LINE is also a prefix match"
    missing:
      - "Bound both the open and close fence scans to the caveman section (stop at the next `## ` heading) and refuse rather than reach past when the section carries no fence (fix sketch already in 29-REVIEW.md CR-01)"
      - "Anchor the heading regex to `/^## Caveman prompt\\s*$/` so 'Caveman prompted' cannot match"
      - "Add a permanent voice-model.test.ts case planting a de-fenced caveman section with a later unrelated fence, and a check-foundation-guards.test.ts case asserting the full gate exits 1 on it"
  - truth: "LANG-08 — byte ceilings are re-baselined exactly once at end of phase, every file at most its previous value, delta recorded, never raised mid-phase"
    status: failed
    reason: >
      Confirmed via docs/audit/29-ceiling-rebaseline.md and `git diff -- scripts/check-foundation-guards.ts`
      against the phase base (empty diff): the ceiling table (`roleCeiling()`) is byte-unchanged for
      the entire phase. This was a deliberate, informed, recorded human decision at plan 29-13's
      blocking checkpoint ("hold-rebaseline") — not an oversight, and the plan document itself is
      explicit that this does NOT satisfy LANG-08 ("LANG-08 is satisfied vacuously ... the re-baseline
      half did NOT happen"). The "never raised" half holds by construction (nothing moved) and "delta
      recorded" holds (docs/audit/29-ceiling-rebaseline.md and docs/audit/29-corpus-growth.md both
      exist with full transcripts). But the central action the roadmap text names — "re-baselined
      exactly once" — did not occur zero-to-one times; it occurred zero times. This is reported here
      as a gap rather than silently accepted, per the same honesty standard the phase's own plan
      applied to itself.
    artifacts:
      - path: "docs/audit/29-ceiling-rebaseline.md"
        issue: "documents the hold-rebaseline decision and preserves a ready-to-apply ratchet-down alternative (min(recomputed, current) per tier) that was never applied"
    missing:
      - "Either apply the preserved ratchet-down values (5 rows lower, 12 hold, 0 raised — already computed in docs/audit/29-ceiling-rebaseline.md) to satisfy LANG-08 literally, or record a formal VERIFICATION.md override accepting 'hold-rebaseline' as phase-closing given the deliberate human decision already made at the 29-13 checkpoint"
deferred: []
human_verification: []
---

# Phase 29: Controlled Language & Voice Guard Rebuild Verification Report

**Phase Goal:** Procedural and agent-written prose follows one enumerated writing profile so two
agents reading the same instruction reach the same act; the caveman voice lives in exactly one
fenced block per role and is measured as voice, not as sentence shape.

**Verified:** 2026-08-14T21:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

**Method note.** A code review (`.planning/phases/29-controlled-language-voice-guard-rebuild/29-REVIEW.md`,
status `issues_found`, 3 critical / 8 warning / 4 info) had already run against this phase. Rather than
restate it, every critical finding was independently re-derived against the current HEAD (`d7521d9`,
clean tree) by reading the named source lines directly and, for CR-02, by re-running the exact `git
diff` command the review used. All three critical findings reproduced unfixed and unchanged. This
report answers the goal-backward question the review does not: **given these defects, which of the
phase's observable truths are actually true of the codebase right now**, distinguishing an
EXISTENCE/NAMING claim (which a bypassable guard can still satisfy) from an ENFORCEMENT claim (which
a bypass falsifies).

### Observable Truths

| # | Truth (mapped to LANG-NN) | Status | Evidence |
|---|---|---|---|
| 1 | LANG-01 — a grugops-authored, ASD-STE100-derived writing profile ships with a non-affiliation/not-certified disclaimer and vendors no ASD dictionary text | ✓ VERIFIED | `agent-factory/writing-profile.md` read in full. "Disclaimer and honesty floor" section states non-affiliation, "No part of the ASD-STE100 specification text is reproduced here ... no part of its controlled dictionary is included, vendored or redistributed." Existence/naming claim only — satisfied regardless of any guard bug. |
| 2 | LANG-02 — the profile is applied to workflow steps, checklists, memory-bank, shared-context notes, board, and traceability, and explicitly not to the fenced caveman blocks | ✓ VERIFIED | `docs/audit/29-corpus-growth.md`: 47 governed documents measurably rewritten (+1,845 B, +1.21%, article density stable at 10.72%→11.00% — normal English, not a mechanical strip). `GOVERNED_CORPUS_EXCLUDED_LOCATIONS` in `check-imperative-lexicon.ts` excludes `agent-factory/roles/` by name with a stated reason, so role/caveman prose is never touched by this guard. This is a past-application claim — satisfied. (The guard's ongoing enforcement *completeness* over step bullets is assessed separately under LANG-04, truth 4, where it fails.) |
| 3 | LANG-03 — a named safety-surface exclusion list is honoured so load-bearing security/compliance/admission text is never reworded by a style pass | ✗ FAILED | `docs/audit/28-safety-surface-exclusions.md` (41-file union) and `generate-safety-surface.js` correctly derive the watched corpus (confirmed: gate reports "40 markdown file(s) of the 41-entry LANG-03 safety-surface union"). But the enforcement mechanism has a live, confirmed bypass: `check-diff-disposition.ts`'s registryAnchors companion check tests range-wide file presence, not same-commit correspondence. `git diff --name-only 4d2b8f0 -- docs/audit/28-claim-registry.md` returns a hit **right now**, so all 42 registryAnchors frozen clauses are currently unprotected. This is an ENFORCEMENT claim ("never reworded") and the mechanism enforcing it is provably non-functional today. See gap #1. |
| 4 | LANG-04 — guards named for exactly the decidable subsets they check (`guard_imperative_lexicon`, `guard_sentence_form`); no ASD-STE100/token-economy/comprehension claim anywhere in the kit; `guard_banned_claims` holds that prohibition mechanically | ✗ FAILED | Naming confirmed correct via grep (`guard_imperative_lexicon`, `guard_sentence_form` both present and consistently referenced). `guard_banned_claims` confirmed mechanical: pinned-literal design in `check-banned-claims.ts`, currently passing "0 findings over 82/82 elements" with one named, justified exemption region. BUT: direct read of `check-imperative-lexicon.ts:480` confirms `LIST_MARKER` admits at most 3 leading spaces, so an indented CommonMark sub-bullet under `## Steps` is invisible to the guard — it is not enforcing "exactly" the decidable subset its own banner claims ("every `## Steps` bullet ... at position zero"). Latent on the current corpus (0 such bullets exist today) but reproducible and unfixed. See gap #2. |
| 5 | LANG-05 — `## One job`, the caveman block, and `## Responsibilities` each say a thing once (skeleton de-duplicated) | ✓ VERIFIED | Spot-checked `agent-factory/roles/uat-planner.md`: `## One job` states the role's purpose once, `## Caveman prompt` is a distinct voice restatement, `## Responsibilities` is a distinct numbered action list — no restated content across the three sections. Role corpus shrank 66,216→63,793 B (−3.66%) across all 17 files, consistent with de-duplication rather than net rewrite bloat. |
| 6 | LANG-06 — the voice guard is rebuilt to measure voice against a committed lexicon (not sentence shape), fails RED on all 17 current blocks as acceptance evidence before the rewrite, and publishes a number with a denominator | ✗ FAILED | Historical acceptance-evidence sub-claim VERIFIED: `29-01-SUMMARY.md` documents a 17/17 RED transcript (0 lexicon tokens / 597 content words, 54 banned constructions) captured before the rewrite landed. "Publishes a number with a denominator" VERIFIED live: current gate output reads "0 findings over 17/17 elements". BUT the "measures against a committed lexicon" claim is an ongoing, present-tense guarantee, and its precondition — reliably identifying which bytes ARE the caveman block — has a proven, reproducible bypass: `readCavemanFence` (`voice-model.ts:93-128`, read directly) scans to EOF for a fence delimiter instead of bounding to the section's own next `## ` heading. `orchestrator.md` already contains a second, unrelated fenced block after its caveman section (confirmed: fence lines 14/19 vs 44/53), so the precondition for misattribution already exists in the shipped corpus. See gap #3. |
| 7 | LANG-07 — `guard_imperative_lexicon`/`guard_sentence_form` and the rebuilt voice guard read the fence through ONE parser, never two grammars over the same bytes | ✓ VERIFIED | Confirmed structurally: `FENCE_DELIMITER_LINE` is defined once in `frontmatter.ts:390` and imported (not re-declared) by `voice-model.ts:58`; `check-imperative-lexicon.ts` consumes the same class via `frontmatter.ts`'s `fencedLineFlags` (`check-imperative-lexicon.ts:145,691`). This is a de-duplication/naming claim about the delimiter authority, not about the correctness of the one reader built on it — that correctness question is CR-01, already charged against LANG-06 above, not double-counted here. |
| 8 | LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file ≤ previous, delta recorded, never raised mid-phase | ✗ FAILED | `git diff -- scripts/check-foundation-guards.ts` against phase base `4d2b8f0` is empty — the ceiling table never moved. `docs/audit/29-ceiling-rebaseline.md` documents this as a deliberate human decision ("hold-rebaseline") at plan 29-13's blocking checkpoint, and states plainly in its own text: "the re-baseline half did NOT happen." "Never raised" and "delta recorded" both hold; "re-baselined once" — the central action — did not occur. See gap #4 (this looks intentional; override suggested below). |

**Score:** 4/8 truths verified (LANG-01, LANG-02, LANG-05, LANG-07). 4/8 failed (LANG-03, LANG-04, LANG-06, LANG-08).

### Why LANG-02/03/04 were left "Pending" in REQUIREMENTS.md and whether that reflects real missing work

Orchestrator's known-facts flagged this as a specific question. Independent finding: **the row-flip
gap and the real-work gap are different things, and both are partially true.**

- The **application work** for LANG-02 (rewriting workflows/checklists/seed/contracts onto the
  profile) is genuinely complete and measured (`docs/audit/29-corpus-growth.md`). The "Pending"
  checkbox is stale bookkeeping, not a sign of missing work, for this sub-claim.
- The **enforcement work** for LANG-03 (registryAnchors same-commit freeze) and the **enforcement
  completeness** for LANG-04 (indented-bullet coverage) are genuinely incomplete — not stale
  bookkeeping, but real, reproducible, currently-uncommitted-fix defects independently confirmed
  above (CR-02, CR-03). The "Pending" checkboxes for LANG-03 and LANG-04 are therefore accurate,
  not stale.
- So: LANG-02's row should be flipped to Complete (the work is done); LANG-03 and LANG-04's rows
  are correctly still Pending — the gates named for them exist and are wired, but do not yet
  enforce what they claim to enforce.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/writing-profile.md` | Enumerated rules, Technical Names derivation, disclaimer | ✓ VERIFIED | Present, substantive, disclaimer and honesty-floor sections confirmed by direct read |
| `docs/audit/28-safety-surface-exclusions.md` + `generate-safety-surface.js` | Named 41-file safety-surface union | ✓ VERIFIED (existence/naming) | Derivation confirmed via live gate output ("41-entry LANG-03 safety-surface union") |
| `scripts/voice-model.ts` (`readCavemanFence`) | Single, section-bounded caveman-fence authority | ⚠️ STUB-LIKE (present, wired, incorrect) | Exists, imported by `check-foundation-guards.ts` (both `guard_voice` and `guard_caveman_voice`), but not section-bounded — CR-01 |
| `scripts/check-imperative-lexicon.ts` (`guard_imperative_lexicon`, `guard_sentence_form`) | Enforce WP-01..WP-08 over the governed corpus | ⚠️ STUB-LIKE (present, wired, incomplete) | Exists, wired into `npm run check:imperative-lexicon`, currently green, but `LIST_MARKER` misses indented bullets — CR-03 |
| `scripts/check-diff-disposition.ts` (`guard_diff_disposition`) | Freeze structural/registry/positive-guard-literal sections, require same-commit companion | ⚠️ STUB-LIKE (present, wired, incorrect for one arm) | Exists, wired, currently green, but `registryAnchors` companion check is range-wide not same-commit — CR-02, confirmed vacuous on HEAD today |
| `scripts/check-banned-claims.ts` (`guard_banned_claims`) | Mechanically prohibit conformance/token-economy/comprehension claims | ✓ VERIFIED | Pinned-literal design, one named exemption region, currently passing 0/82 findings |
| `docs/audit/29-ceiling-rebaseline.md` | Byte-ceiling re-baseline transcript | ✓ VERIFIED (as a transcript) — but the re-baseline it transcribes did not happen | Documents `hold-rebaseline`; ceiling table byte-unchanged for the phase |
| `docs/audit/29-corpus-growth.md` | Growth measurement, per file and per part | ✓ VERIFIED | 47 governed docs +1.21%, 17 roles −3.66%, mechanism (sentence splitting) tested and isolated from article-restoration hypothesis |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` (`guard_voice`, `guard_caveman_voice`) | `voice-model.ts` (`readCavemanFence`) | import at line 306, called at 2045/2194 | ✓ WIRED | Confirmed by grep; both guards consume the same function |
| `check-imperative-lexicon.ts` | `frontmatter.ts` (`fencedLineFlags`) | import at line 145, called at line 691 | ✓ WIRED | Confirmed; same `FENCE_DELIMITER_LINE` class as `voice-model.ts` |
| `check-diff-disposition.ts` | `generate-safety-surface.ts` (`safetySurfaceUnion`) | import at line 147, called at line 939 | ✓ WIRED | Confirmed; drives the 41-entry watched corpus |
| `check-diff-disposition.ts` (registryAnchors arm) | `docs/audit/28-claim-registry.md` companion check | `allChangedFiles.includes(...)` at line 1142 | ⚠️ WIRED BUT INCORRECT | Wired, but the predicate it evaluates (range-wide presence) does not match its stated contract (same-commit) — confirmed vacuously true on HEAD via direct `git diff` reproduction |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| All four gates exit 0 on current HEAD | `node scripts/check-foundation-guards.js` / `check-imperative-lexicon.js` / `check-banned-claims.js` / `check-diff-disposition.js` | All four printed `ALL CHECKS PASSED`, exit 0 | ✓ PASS |
| Full regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 51 files, 1725 passed, 2 skipped, 100.4s | ✓ PASS |
| CR-02 reproduction (registryAnchors companion vacuity) | `git diff --name-only 4d2b8f0 -- docs/audit/28-claim-registry.md` | Returns `docs/audit/28-claim-registry.md` | ✗ CONFIRMS BYPASS IS LIVE |
| CR-01 code inspection (fence-scan bound) | `Read scripts/voice-model.ts:93-128` | Open/close scans run to `lines.length` (EOF), no `## ` bound | ✗ CONFIRMS DEFECT PRESENT |
| CR-03 code inspection (LIST_MARKER indent bound) | `Read scripts/check-imperative-lexicon.ts:480` | `/^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+/` — max 3 spaces | ✗ CONFIRMS DEFECT PRESENT |
| Debt-marker scan | `grep -n "TBD\|FIXME\|XXX"` over 6 key phase files | No output | ✓ PASS (no unresolved debt markers) |
| Working tree cleanliness (no verification-induced changes) | `git status --porcelain` | Only pre-existing `human-notes.txt` (M), `.gsd/` (??), `.planning/phases/29.1-.../` (??) — none touched by this verification | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| LANG-01 | 29-02, 29-03 | Grugops-authored ASD-STE100-derived profile, disclaimer, no vendoring | ✓ SATISFIED | `agent-factory/writing-profile.md` |
| LANG-02 | 29-03, 29-08..12 | Profile applied to procedural/agent-written surfaces, not caveman blocks | ✓ SATISFIED | `docs/audit/29-corpus-growth.md`; `GOVERNED_CORPUS_EXCLUDED_LOCATIONS` |
| LANG-03 | 29-04, 29-07, 29-08..12 | Safety-surface exclusion honoured mechanically | ✗ BLOCKED | CR-02: registryAnchors companion check vacuous on HEAD |
| LANG-04 | 29-02, 29-03, 29-08..12 | Guards named for exactly the decidable subset; no banned claims | ✗ BLOCKED | CR-03: guard_imperative_lexicon misses indented bullets |
| LANG-05 | 29-01, 29-05, 29-06, 29-07 | Role skeleton de-duplicated | ✓ SATISFIED | Spot check + corpus shrink |
| LANG-06 | 29-01, 29-05, 29-06, 29-07 | Voice guard rebuilt, RED evidence, lexicon-based measurement | ✗ BLOCKED (partial) | Historical RED evidence and denominator VERIFIED; ongoing lexicon-measurement reliability FAILED (CR-01) |
| LANG-07 | 29-01 | One fence parser, not two grammars | ✓ SATISFIED | `FENCE_DELIMITER_LINE` single-source confirmed |
| LANG-08 | 29-13 | Byte ceilings re-baselined once, delta recorded, never raised | ✗ BLOCKED | `docs/audit/29-ceiling-rebaseline.md`; re-baseline explicitly not performed (deliberate) |

No orphaned requirements: REQUIREMENTS.md's Phase 29 row set (LANG-01..08) matches exactly the union of `requirements:` fields declared across all 13 plans.

### Anti-Patterns Found

None. `grep -n "TBD\|FIXME\|XXX"` over the phase's key modified files (`voice-model.ts`, `check-imperative-lexicon.ts`, `check-diff-disposition.ts`, `check-foundation-guards.ts`, `check-banned-claims.ts`, `writing-profile.md`) returned no hits. The three defects found (CR-01/02/03) are not marked debt in-source; they are logic bugs surfaced by the independent code review and confirmed here by direct reading and reproduction, not by a grep-visible marker.

### Human Verification Required

None. All four gaps below are mechanically confirmed (direct code read plus, for CR-02, a live reproduction command) rather than requiring subjective/visual judgment.

### Gaps Summary

Four of eight LANG requirements have a genuine, currently-live defect blocking full goal achievement,
despite all four automated gates currently printing `ALL CHECKS PASSED` and the full regression suite
being green. This is the exact pattern the project's own standing lesson warns about (memory:
"grugops safety invariant: green suite insufficient" — for a guard/oracle, green tests are not proof;
adversarially reproduce the bypass before marking complete). A prior code review already did that
adversarial work; this verification independently re-derived and confirmed all three critical
findings against the current committed `.js` / `.ts` on HEAD, with no source files modified in the
process (`git status --porcelain` unchanged apart from pre-existing, out-of-scope files).

1. **LANG-03 (CR-02, live today):** the `registryAnchors` same-commit companion rule is provably
   vacuous right now — `docs/audit/28-claim-registry.md` already appears in the range diff, so the
   freeze check for 42 registry-anchored clauses passes unconditionally for the remainder of this
   phase's diff range.
2. **LANG-04 / LANG-02 enforcement completeness (CR-03, latent):** `guard_imperative_lexicon` cannot
   see an indented `## Steps` sub-bullet; it silently narrows to top-level bullets only, contradicting
   its own "every bullet" banner. Not currently triggered (0 such bullets in the corpus) but
   reproducible and unfixed.
3. **LANG-06 (CR-01, latent but precondition already shipped):** `readCavemanFence`'s fence scan is
   not section-bounded. `orchestrator.md` already carries a second, unrelated fenced block after its
   caveman section, so the failure precondition exists in the shipped kit today; it only requires the
   caveman section's own fence to go missing or malformed to misattribute the wrong bytes as "the
   caveman block," passing both voice guards on a de-fenced role.
4. **LANG-08 (deliberate, already self-disclosed):** the byte-ceiling re-baseline the roadmap text
   asks for did not happen — a recorded, reasoned human decision at plan 29-13's checkpoint, which the
   plan document itself states does not satisfy LANG-08. A ready-to-apply fix (ratchet-down values,
   0 rows raised) is preserved in `docs/audit/29-ceiling-rebaseline.md`.

**This looks intentional for LANG-08 only.** To accept the `hold-rebaseline` decision as satisfying
phase close, add to this file's frontmatter:

```yaml
overrides:
  - must_have: "LANG-08 — byte ceilings re-baselined exactly once at end of phase, every file <= previous, delta recorded, never raised mid-phase"
    reason: "Deliberate human decision at plan 29-13's blocking checkpoint (hold-rebaseline): re-deriving the margin from today's smaller corpus would convert Phases 13-27's absorbed headroom into permanent new headroom. The prohibition half (never raised) holds absolutely; the delta is recorded; only the re-baseline action itself was deferred, by choice, not by omission."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

CR-01, CR-02 and CR-03 are not deviations with an equivalent alternative implementation — they are
logic defects in shipped gates, each with a fix already sketched in `29-REVIEW.md`. No override is
appropriate for those three; they need code changes and a closure plan.

---

_Verified: 2026-08-14T21:15:00Z_
_Verifier: Claude (gsd-verifier)_
