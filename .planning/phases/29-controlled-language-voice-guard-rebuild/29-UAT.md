---
status: diagnosed
phase: 29-controlled-language-voice-guard-rebuild
source: [29-VERIFICATION.md]
started: 2026-08-16T14:08:36Z
updated: 2026-08-17T00:00:00Z
---

## Current Test

[testing complete]

<!-- resolved test 2, retained for provenance
number: 2
name: guard_banned_claims — whether the pinned literal set should grow
expected: |
  Measured empirically on a hermetic clone during verification: appending
  `This kit conforms to ASD-STE100.` to a governed workflow reds by name; appending
  `The writing profile reduces token count.` reds by name; but appending
  `The writing profile improves LLM comprehension.` PASSES — the pinned
  `comprehension` group holds `improves comprehension`, `improve comprehension`,
  `comprehension benefit` and four longer phrasings, none of which the interposed
  `LLM` matches.

  Decide: either add the phrasing family to the `comprehension` group of
  `BANNED_CLAIM_LITERALS` with a same-commit count re-pin, or record acceptance of
  the disclosed bound.

  Not a live false claim today: `agent-factory/writing-profile.md`'s honesty floor
  already states verbatim that a brand-new conformance claim written without any of
  the pinned literals is not mechanically detectable, and an independent grep found
  no such claim anywhere in the kit or public docs.

  Why a human decides: where a decidable-subset guard's enumerated set should stop
  is an editorial judgement, not a verification result. The ROADMAP criterion's
  wording is nonetheless stronger than the profile's disclosure.
awaiting: user response
-->

## Tests

### 1. V-29-35-01 — a duplicated frontmatter grammar carried past the phase

expected: |
  Read `docs/audit/29-locator-unification.md` §9.3c and
  `docs/audit/29-round4-residuals.md` §3, then confirm the disposition.
  `scripts/generate-catalog.ts:51` declares a private `parseFrontmatter` beside the
  exported authority at `scripts/frontmatter.ts:3862`, while its sibling generator
  `generate-role-adapters.ts` imports the authority. Two grammars, one class of
  bytes. Measured at 0 key-set differences over 36 governed documents; re-confirmed
  present in source during verification.

  Decide: (a) accept as a milestone-level residual carried past phase 29, with the
  reason recorded, or (b) schedule its closure.

  Why a human decides: this is a scope decision you already made for round 4, whose
  stated horizon was the ROUND and not the PHASE. Verification can measure the
  divergence; it cannot decide whether the phase may close with a known duplicated
  authority still in the tree.
result: issue
reported: "decision 1: b - schedule closure"
severity: minor
decision: |
  (b) SCHEDULE ITS CLOSURE. Not accepted as a residual. The duplicate grammar is to
  be deleted and `scripts/generate-catalog.ts` converted to import the exported
  authority, matching the conversion already performed on its sibling
  `scripts/generate-role-adapters.ts`.
decided_at: 2026-08-17
note: |
  An earlier response in this session recorded (a) accept-as-residual; the human
  reviewed the evidence and reversed it to (b). The reversal is the decision of
  record.

### 2. guard_banned_claims — whether the pinned literal set should grow

expected: |
  Measured empirically on a hermetic clone during verification: appending
  `This kit conforms to ASD-STE100.` to a governed workflow reds by name; appending
  `The writing profile reduces token count.` reds by name; but appending
  `The writing profile improves LLM comprehension.` PASSES — the pinned
  `comprehension` group holds `improves comprehension`, `improve comprehension`,
  `comprehension benefit` and four longer phrasings, none of which the interposed
  `LLM` matches.

  Decide: either add the phrasing family to the `comprehension` group of
  `BANNED_CLAIM_LITERALS` with a same-commit count re-pin, or record acceptance of
  the disclosed bound.

  Not a live false claim today: `agent-factory/writing-profile.md`'s honesty floor
  already states verbatim that a brand-new conformance claim written without any of
  the pinned literals is not mechanically detectable, and an independent grep found
  no such claim anywhere in the kit or public docs.

  Why a human decides: where a decidable-subset guard's enumerated set should stop
  is an editorial judgement, not a verification result. The ROADMAP criterion's
  wording is nonetheless stronger than the profile's disclosure.
result: issue
reported: "decision 2: c - structural fix"
severity: major
decision: |
  (c) STRUCTURAL FIX. Neither accept the bound nor extend the literal list.
  Reuse the conditional mechanism already built for the `Simplified Technical
  English` member: match the bare term `comprehension` only when a benefit verb
  occurs on the same line, so the guard decides a RULE rather than enumerating a
  list. Option (b) — appending phrasings — was rejected as whack-a-mole: measured,
  it closes only the phrasings enumerated and leaves `improves agent comprehension`
  and `boosts comprehension for language models` green.
decided_at: 2026-08-17

## Summary

total: 2
passed: 0
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

<!--
Diagnosis provenance: root causes below were measured directly during this UAT
session against a hermetic `git clone` of HEAD (a72a6b5) in a scratch directory,
by running the committed `scripts/check-banned-claims.js` and by reading source.
No parallel debug agents were spawned — the root cause of each gap was already
decidable by inspection and by running the guard, and both were confirmed rather
than inferred. The working tree was not modified by any probe.
-->

- gap_id: G-29-1
  truth: "One frontmatter grammar governs the repo; no second parser for the same class of bytes (D-24, one authority per predicate)."
  status: failed
  reason: "User reported: decision 1: b - schedule closure"
  severity: minor
  test: 1
  root_cause: |
    `scripts/generate-catalog.ts` imports only `unfencedHeadingIndex` and
    `sectionEndIndex` from `./frontmatter.js` (line 36) and then declares its own
    private `parseFrontmatter` at line 51, used at lines 157 and 201. The exported
    authority `parseFrontmatter` at `scripts/frontmatter.ts:3862` is never imported
    by this file. The sibling generator `generate-role-adapters.ts` was already
    converted to the authority (import at line 78, call at line 257) and carries a
    comment at line 17 recording that it used to hold the same eight-line duplicate.
    generate-catalog.ts was missed by that conversion.
  artifacts:
    - path: "scripts/generate-catalog.ts"
      issue: "private parseFrontmatter at line 51 duplicates the exported authority; call sites at 157 and 201"
    - path: "scripts/generate-catalog.js"
      issue: "committed build output — must be regenerated so the freshness check stays green"
  missing:
    - "Delete the private parseFrontmatter from scripts/generate-catalog.ts"
    - "Add parseFrontmatter to the existing `from './frontmatter.js'` import at line 36"
    - "Adapt call sites 157 and 201 to the authority's Parsed<FrontmatterKeys> return shape (the private copy returns Record<string,string>) — this is the one non-mechanical step"
    - "Rebuild so committed scripts/generate-catalog.js matches its .ts source"
    - "Derive-the-set assertion: a test that fails if any scripts/*.ts declares a local function named parseFrontmatter, so a third copy cannot land green (set-literal drift class)"
  debug_session: ""

- gap_id: G-29-2
  truth: "The shipped kit and public docs carry no comprehension-benefit claim; guard_banned_claims decides that prohibition rather than enumerating a phrase list."
  status: failed
  reason: "User reported: decision 2: c - structural fix"
  severity: major
  test: 2
  root_cause: |
    The `comprehension` group of BANNED_CLAIM_LITERALS
    (scripts/check-banned-claims.ts:252-257) holds SIX fixed substrings — three
    short (`improves comprehension`, `improve comprehension`, `comprehension
    benefit`) and three longer paraphrases. Matching is plain case-insensitive
    substring, so ANY interposed word defeats it. Measured on a hermetic clone by
    appending one sentence to agent-factory/workflows/00-bootstrap-greenfield.md
    and running the guard:
      REDS  : "...improves comprehension."
      PASSES: "...improves LLM comprehension."
      PASSES: "...improves model comprehension."
      PASSES: "...improves agent comprehension."
      PASSES: "...makes prose easier for LLMs to understand."
      PASSES: "...boosts comprehension for language models."
    The UAT text under-reported this: it named ONE bypass, and the family is open.
    It also mis-stated the group size as seven (three plus "four longer phrasings");
    the actual count is six.
    NOT a live false claim today — independently grepped: the only `comprehen`
    lines in the 82-document scan set are the two DENIALS in
    agent-factory/writing-profile.md (256, 288), both inside the named exemption
    region beginning at line 235, plus one occurrence of the unrelated word
    "comprehensive" in agent-factory/checklists/security-nfr-checklist.md:161.
  artifacts:
    - path: "scripts/check-banned-claims.ts"
      issue: "comprehension group (lines 252-257) enumerates six fixed substrings; any interposed word bypasses every one"
    - path: "scripts/check-banned-claims.ts"
      issue: "BANNED_CLAIM_EXEMPT_SUPPRESSED = 10 (line 658) must be re-pinned in the same commit — the fix makes the two honest denials inside the exemption region match"
    - path: "scripts/check-banned-claims.test.ts"
      issue: "group allow-list at ~line 1660 pins exactly the three group names; the conditional-member count is pinned at exactly 1 (~line 1670) and a second conditional member will red it"
  missing:
    - "Add a conditional member { literal: 'comprehension', requiresOnSameLine: <benefit-verb markers> } to the comprehension group, reusing the requiresOnSameLine mechanism already proven by the 'Simplified Technical English' member"
    - "Pin the benefit-verb marker list the way CONFORMANCE_VERB_MARKERS is pinned, with the measured hit count that admitted each marker"
    - "Re-pin BANNED_CLAIM_EXEMPT_SUPPRESSED 10 -> 12 in the SAME commit, and say in the commit message which claims entered the region — the guard's own failure text demands exactly this and forbids moving the constant just to silence the line"
    - "Relax the test's `exactly one conditional member` assertion to the new measured count, with the reason recorded — do not delete the assertion"
    - "Record the rejected alternative in BANNED_CLAIM_EXCLUDED: appending phrasings (option b) was measured to cost 0 findings and move no pin, but leaves 'improves agent comprehension' and 'boosts comprehension for language models' green — enumeration cannot close this class"
    - "RED-first: add the five bypass sentences above as fixture cases that fail before the fix and pass after"
    - "Rebuild so committed scripts/check-banned-claims.js matches its .ts source"
  measured_probe: |
    The structural fix was prototyped on the clone and behaves as specified:
    with a bare `comprehension` member conditional on
    [improve, better, easier, boost, help, benefit, enhance] the corpus reports
    0 findings, ALL FIVE bypass sentences red, and the guard fails ONLY on the
    expected pin line — "suppressed 12 banned-claim occurrence(s), and
    BANNED_CLAIM_EXEMPT_SUPPRESSED ... declares 10". That failure is the designed
    re-pin protocol, not a defect in the approach.
    The marker list above is the PROTOTYPE list, not an admitted one: each marker
    still needs its own measured hit count before it is pinned.
  debug_session: ""
