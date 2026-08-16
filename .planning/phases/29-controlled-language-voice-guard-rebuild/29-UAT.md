---
status: testing
phase: 29-controlled-language-voice-guard-rebuild
source: [29-VERIFICATION.md]
started: 2026-08-16T14:08:36Z
updated: 2026-08-16T14:08:36Z
---

## Current Test

number: 1
name: |
  Decide whether phase 29 may close with V-29-35-01 open, or whether it must be
  closed first.
expected: |
  An explicit decision recorded in ROADMAP/REQUIREMENTS: either (a) accept it as a
  milestone-level residual carried past phase 29, with the reason, or (b) schedule
  its closure. Verification judges it does NOT falsify success criterion 5, but the
  criterion's second clause and the project's D-24 principle read wider than the
  requirement text, and round 4's residual set moved net ZERO (one closed, one
  opened).
awaiting: user response

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
result: [pending]

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
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
