---
phase: 30-per-checkpoint-autonomy-matrix
plan: 10
subsystem: infra
tags: [red-team, adversarial-review, closure-standard, fence, commonmark, heading-authority, fence-machine, derived-set, governance-reader, typescript, fail-closed]

requires:
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's checkpoint roster, CHECKPOINT_DEFAULTS, floorEnvVarName and composeBanner; plan 30-03's single fail-closed readGovernanceConfig; plan 30-04's derivation of the roster from the workflow corpus; plan 30-07's generate-guarantees.ts and the guarantees freshness gate; plan 30-09's residual register read path"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "the one-authority-per-predicate doctrine, scripts/frontmatter.ts as the single heading/fence authority, check-foundation-guards' [B1] recogniser closure pin, and the D-64 canonical-form posture (name the canonical spelling, refuse the near-miss, never widen the parser)"
  - phase: 28-kit-consistency-audit
    provides: "docs/audit/28-residual-sizing.md, the claim registry and the frozen-anchor discipline check-diff-disposition enforces"
provides:
  - "30 closed bypasses across four adversarial rounds, each with a RED-first test, a mirror reproduction against the committed .js, a structural fix and a mutation proof read out of the emitted artifact"
  - "`carriageReturnLines` — LF declared the canonical line ending of the governed corpus, a lone CR refused by name"
  - "`blockContextFlags` — a §4.5-complete fence machine plus an HTML arm, consumed by the three section-extent questions while `fencedLineFlags` keeps the lax view; the two views are deliberately NOT nested and the divergence is measured"
  - "`atxOrSetextHeadingText`, `unfencedHeadingNearMisses`, `renderedText` — one CommonMark-aware heading classifier answering closing-hash, tab-separator, setext, numeric-reference and zero-width axes"
  - "INVERTED corpus membership for roles and workflows — the raw read admits every directory entry and the consumer refuses whatever the corpus rule does not admit, so there is no extension question left to get wrong"
  - "`isCanonicalMarkdownName` / `imitatesMarkdownName` — one imitation predicate for the tree, beside the alias set"
  - "`SUPPLIED_STATE_ROOT` — one expression answering 'was a state root supplied', read by both the branch and the scope caveat"
  - "`canonicalBase` + `governanceBaseContributions` — base identity answered by the candidate loop's own behaviour rather than by a string comparison"
  - "`atDocumentedDefault` + `matrixDepartures` — 'nothing is lowered' and 'everything is at its default' as separately named questions from one ordered rank, over one read and one walk"
  - "docs/audit/30-redteam-surface-b.md — the full round log: every finding, reproduction, fix, mutation proof, all eight reviewer reports, the self-reproduction records and THE FENCE"
  - "twenty recorded residuals V-30-10-01..20, each with the direction it fails in"
affects: [30-11, verify-work, check-diff-disposition, check-public-docs-vocabulary, generate-guarantees, validate-agent-factory, frontmatter, kit-model, checkpoints]

actuals:
  tokens: 136991
  tasks: 3
  commits: 16

tech-stack:
  added: []
  patterns:
    - "INVERT the membership test rather than lengthening the list: admit every entry the directory carries and refuse whatever the corpus rule does not admit, so a hand-maintained extension list stops being load-bearing"
    - "one machine, two projections — a strict CommonMark view for 'where does this section end' and a lax view for 'which lines are governed prose', with the divergence measured and stated rather than assumed nested"
    - "make the WITNESS the wider of two passes, so a membership comparison fires on disagreement instead of agreeing by shared blindness"
    - "answer an identity question with the loop's own behaviour (what did this base contribute?) rather than with a second string comparison"
    - "name each fix's NEW degree of freedom and assert its bound in the same commit, because three consecutive rounds measured that most findings are created by the previous round's fixes"
    - "a fence is written down rather than negotiated: when the round cap is reached with findings outstanding, the residuals are recorded with reproductions and directions and the surface is called fenced, not closed"

key-files:
  created:
    - docs/audit/30-redteam-surface-b.md
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-public-docs-vocabulary.ts
    - scripts/check-public-docs-vocabulary.js
    - scripts/check-public-docs-vocabulary.test.ts
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/generate-guarantees.ts
    - scripts/generate-guarantees.js
    - scripts/generate-guarantees.test.ts
    - scripts/autonomy-zero-config.test.ts
    - .planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md

key-decisions:
  - "THE FENCE (user decision, 2026-09-06): surface B is FENCED, not closed. Four rounds closed 30 findings; eight independent reviews at claude-opus ran and NOT ONE returned 'nothing new'; each round's own fixes created most of the next round's findings (3 of 6, 4 of 7, 7 of 9, and 2 of the 10 post-cap findings). The defect rate per round did not fall — the review budget ran out first. Calling this surface closed would assert a proposition eight consecutive reviews contradicted."
  - "A predicate is never fixed by widening it to accept one more spelling. Where the corpus is a CLOSED directory the test is INVERTED — admit everything present, refuse what the rule does not admit — which removes the extension question entirely. Where the corpus is OPEN (the whole repository, for public-docs) inversion does not apply and the hand-declared alias list remains; that asymmetry is stated at both sites rather than glossed, and is fenced as V-30-10-07/17."
  - "The strict and lax block-context views are NOT nested, and saying so is the point. Adopting §4.5's info-string rule and the ≤3-space indent for the LAX view was measured and DECLINED — it changed 8 governed documents, reddened 47 foundation-guard cases and narrowed the scan set on 6 documents (fail-open). Both rules were adopted only inside blockContextFlags, which answers section extent alone. Over the governed corpus the two views differ on exactly ONE line, measured, and reviewer 7 re-measured and confirmed it."
  - "'Nothing is lowered' and 'everything is at its default' are different questions and now have different predicates. Round 3's ordered isLowered left the sentence written for the old `!==` predicate standing, so a legitimate TIGHTENING published a page byte-identical to the zero-config page while composeBanner said the opposite about the same tree. atDocumentedDefault is the predicate composeBanner already asks, so the page and the banner are two readings of one rule."
  - "A three-way partition can lose a member where a two-way one could not, so matrixDepartures asserts its partition TOTAL against a denominator derived from CHECKPOINT_DEFAULTS rather than from any array that consumes it. Reviewer 8 then measured that the assertion is unreachable by construction (if/else if/else) and that the tightened bucket is never PUBLISHED when anything is also lowered — recorded as V-30-10-16, unfixed, because the cap was reached."
  - "The residual byte witness is made the WIDER of the two passes. R4-1 called it independent while it shared the leading-pipe row rule with the parse it witnessed; GFM makes outer pipes optional, so such a row was dropped by both at once. A membership comparison can only fire on an axis the two passes DISAGREE about."
  - "A green test suite is not a closure argument, and this plan proved the rule from an unexpected direction: `npm run typecheck` runs two projects and only one was ever run, so the tests project had been red since round 1 on two errors both introduced by this plan, under a green suite the whole time."
  - "The closure judgement is a HUMAN judgement. It is marked human_judgment: true in the coverage block below, because no mechanical result establishes 'no further bypass exists' and the measured trend says the opposite."

patterns-established:
  - "State each fix's new degree of freedom and assert its bound IN THE SAME COMMIT. Rounds 2, 3 and 4 measured that most of each round's findings were created by the previous round's fixes; the disclosure is what makes the next reviewer's job start where the last one ended."
  - "Assert the verification harness's own premise before believing any result. Across four rounds this caught: a mutation that never landed (noEmitOnError left the old .js), a RED that fired for an unrelated reason, a false control run against the pre-fix artifact, a mirror with no .git that failed before reaching the predicate, a plant in the one EXEMPT role, and a plant placed outside the region it was meant to enter. Both round-4 reviewers independently caught the same class in their own harnesses."
  - "When a container must be introduced around quoted evidence, disclose it and say why. Reviewer 7's report carries an unbalanced fence — it is a report about fence parsing — so embedding it verbatim required a longer fence, and the fact is recorded rather than silently normalised."

requirements-completed: [AUTO-01, AUTO-02, AUTO-05, AUTO-06, AUTO-07]

coverage:
  - id: D1
    description: "Every bypass found in rounds 1-4 is reproduced PRE-FIX on a mirror of the committed compiled artifact (mirror exits zero, current tree exits non-zero) and fixed structurally rather than by a widened pattern."
    requirement: "AUTO-01"
    verification:
      - kind: integration
        ref: "docs/audit/30-redteam-surface-b.md — 30 findings, each with its mirror reproduction and structural fix; e.g. R6-3 mirror 5919 bytes byte-identical to zero-config exit 0 -> tree 6069 bytes exit 1"
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#30-10 R6-3 — \"nothing is lowered\" is not \"everything is at its default\""
        status: pass
      - kind: unit
        ref: "scripts/generate-guarantees.test.ts#R6-5 — a row WITHOUT outer pipes is seen by the byte pass and refused, not dropped by both"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#30-10 R4 — R6-1 and R6-2: one supplied-root expression, one base identity"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every fix is mutation-proved in the artifact the tests load, with the mutation marker grepped in the emitted .js before any result is believed."
    requirement: "AUTO-02"
    verification:
      - kind: integration
        ref: "docs/audit/30-redteam-surface-b.md § R6-3 mutation proof — four mutations including the discriminating one (bucketing broken, totality assertion left LIVE -> 'the checkpoint roster has 14 members but only 13 were classified')"
        status: pass
      - kind: integration
        ref: "docs/audit/30-redteam-surface-b.md § R6-5 mutation proof — witness narrowed back to startsWith(\"|\"), and the pipe-less body extraction blinded; both KILLED"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fixing agent reproduces each closed bypass ITSELF against the fixed build, with the evidence named rather than the exit code alone."
    requirement: "AUTO-06"
    verification:
      - kind: integration
        ref: "docs/audit/30-redteam-surface-b.md § Round 4 — self-reproduction against the FIXED build (closure clause 5) — 11 bypasses, each with its refusal text or measured region"
        status: pass
      - kind: integration
        ref: "the same section records THREE probes discarded as false controls (a git archive mirror with no .git, a plant in the exempt role, a plant outside the region) before any row was believed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two independent reviews at the strongest available model ran after the final round, and their outcome — not the fixing agent's confidence — decided the surface."
    requirement: "AUTO-07"
    verification:
      - kind: integration
        ref: "docs/audit/30-redteam-surface-b.md § Round 4 reviews — reviewers 7 and 8, claude-opus, both reports recorded VERBATIM and sha-verified byte-identical (223 and 298 lines)"
        status: pass
    human_judgment: false
  - id: D5
    description: "THE CLOSURE JUDGEMENT ITSELF — whether surface B is closed or fenced. Both round-4 reviewers returned findings, so the surface is FENCED at D-22's cap with ten post-cap findings recorded as backlog."
    requirement: "AUTO-07"
    verification:
      - kind: manual
        ref: "the user chose `fence` at the Task 3 checkpoint on 2026-09-06 and confirmed the fence text and V-30-10-11..20 as written — see docs/audit/30-redteam-surface-b.md § THE DECISION"
        status: pass
    human_judgment: true
  - id: D6
    description: "The round cap is honored: no fifth round was run, and every post-cap finding became a recorded backlog item with a reproduction, a direction and a suggested structural fix."
    requirement: "AUTO-07"
    verification:
      - kind: manual
        ref: "V-30-10-11..20 in .planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md and in the round log § Backlog — the ten post-cap findings"
        status: pass
    human_judgment: false
---

# Phase 30 Plan 10: Red-team surface B Summary

Four adversarial gap-closure rounds against the derived checkpoint set, the collapsed governance reader, the structure validator, the guarantees render, the freshness gate and the run banner closed 30 bypasses under a RED-first / mirror-reproduce / structural-fix / mutation-prove standard — and ended in a **written fence rather than a closure**, because eight independent reviews ran and not one returned "nothing new".

## The decision, verbatim

> **Option chosen: `fence`** — fence at the round cap and record the outstanding findings as backlog.
> **Decided by:** the user, at the Task 3 checkpoint. **Date:** 2026-09-06.
> The user confirmed the fence text and the ten backlog entries `V-30-10-11` … `V-30-10-20` as written.

`closed` was not available on the evidence and was not argued for. `another-round` is forbidden by D-22, which this phase wrote in advance so the judgement would be made by a rule rather than by fatigue.

## The four rounds

| round | findings closed | created by the PREVIOUS round's fixes | reviews after it |
|---|---|---|---|
| 1 | 8 (B-1 … B-8) | — | 2, both found new |
| 2 | 6 (F1 … F6) | **3 of 6** | 2, both found new |
| 3 | 7 (R3-1 … R4-3) | **4 of 7** | 2, both found new |
| 4 | 9 (R5-1 … R6-6) | **7 of 9** | 2, both found new |
| **post-cap** | **0 — recorded as backlog** | **2 of 10** name a round-4 fix; a third reaches the harm through the inversion written to close it | — |

**30 closed. 10 outstanding. The defect rate per round did not fall; the budget ran out first.**

## All eight reviewer verdicts

| # | model | scope / lens | verdict |
|---|---|---|---|
| 1 | claude-opus | derivation + reader + validator | findings (round 2's F-set) |
| 2 | claude-opus | render + freshness + banner + pins | findings (round 2's F-set) |
| 3 | claude-opus | heading classifier + fence machine + frozen anchors | findings (round 3's R3-set) |
| 4 | claude-opus | validator + reader + render/freshness + pins | findings (round 3's R4-set) |
| 5 | claude-opus | heading classifier + fence machine + frozen anchors + membership | **FINDINGS: 3** (R5-1 … R5-3) |
| 6 | claude-opus | validator + reader + render/freshness + pins | **FINDINGS: 6** (R6-1 … R6-6) |
| 7 | claude-opus | heading/fence authority + frozen anchors + membership | **FINDINGS: 4** (R7-1 … R7-4) + a fence audit of V-30-10-01..10 |
| 8 | claude-opus | validator + reader + render/freshness + pins | **FINDINGS: 6** (R8-1 … R8-6) + a full package.json gate sweep |

Reviewers 7 and 8 are recorded verbatim in the round log and sha-verified byte-identical to their sources. Both asserted artifact identity on entry and exit, proved every renderer premise against the reference `commonmark` implementation including the negative cases, and each caught a false control in their own harness mid-review.

## The fence

Surface B is **FENCED, not closed**. The full text is in `docs/audit/30-redteam-surface-b.md` § *THE FENCE — FINAL*. Its core: the gates named in the log are **evidence, not proof** — each refuses a specific, named, reproduced bypass, and none establishes that no further bypass exists. Twenty residuals are recorded with the direction each fails in.

## The twenty residuals

| id | direction | one line |
|---|---|---|
| `V-30-10-01` | permissive (invisible) | the hook does not publish `checkpointRefusals`; no non-test consumer |
| `V-30-10-02` | permissive (invisible) | **the derivation AND both membership inversions have no shipped consumer** — see below |
| `V-30-10-03` | permissive | the hook's kit-root fallback base (surface A owns it) |
| `V-30-10-04` | mixed; **item 1 INVERTED by R6-2** | resolve-vs-realpath dedupe, one-space grant, `sectionsFound === filesWalked` vacuity |
| `V-30-10-05` | mixed | six round-3 observations; `COVERED_ELSEWHERE` resolves by file-exists + test-name substring, not by reach |
| `V-30-10-06` | mixed | eight round-4 observations; item 4 (named whitespace entities) is a closed decidable set |
| `V-30-10-07` | permissive | the alias list cannot be completed for an OPEN corpus; **bound understated** — see `V-30-10-17` |
| `V-30-10-08` | permissive; **direction was one-sided** | five §4.6 HTML block types unmodelled — the live hole is OVER-modelling, see `V-30-10-12` |
| `V-30-10-09` | permissive; **stated direction was wrong** | named references render identically and are not refused (they do not truncate differently) |
| `V-30-10-10` | process | `npm run typecheck` runs two projects and only one was in the loop; **remedy confirmed** by reviewer 8's full sweep |
| `V-30-10-11` | permissive + invisible | **HIGH** — section extent is strict, both collecting passes are lax; an indented closing fence separates them |
| `V-30-10-12` | permissive + invisible | **HIGH** — `HTML_BLOCK_OPEN` opens a phantom block on an autolink; 17 clauses un-frozen at 17/17. *Created by R5-2's fix* |
| `V-30-10-13` | permissive; ships to hosts | **MEDIUM** — the membership exemptions are NAME tests, not FILE tests; `roles/.gitkeep/` as a directory |
| `V-30-10-14` | permissive + invisible | **HIGH** — zero-glyph inline markup is not folded; `exceed_wip_limit` leaves the roster at 37/37 |
| `V-30-10-15` | publishes a false sentence | **MEDIUM** — "the FIRST is the one that governs" names the wrong file in the two-root shape |
| `V-30-10-16` | permissive + invisible | **MEDIUM** — the tightened bucket is computed, asserted total, never published. *Created by R6-3's fix* |
| `V-30-10-17` | permissive | **MEDIUM** — the alias list does not equal the authority its own comment names; `PUBLIC.scd` passes both gates |
| `V-30-10-18` | invisible to every test | **MEDIUM** — verdict on stdout, whole scope disclosure on stderr; every test reads them concatenated |
| `V-30-10-19` | permissive | **LOW** — the witness's number window is blindness shared with the parse |
| `V-30-10-20` | invisible | **LOW** — the collapsed-bases caveat is keyed on `stateRootSupplied`, not `basesCollapsed` |

## What the shipped validator does NOT do

Stated plainly for the phase verifier, because it is the strengthened form of `V-30-10-02` and it bounds what every other claim in this plan means:

**`scripts/validate-agent-factory.js` — the artifact a host actually runs — performs NONE of the corpus-membership or heading-form refusals this plan built.** It imports only the static `CHECKPOINTS` / `DISPOSITIONS`; `deriveCheckpoints` and `checkpointSites` have **no non-test consumer at all**. Reviewer 7 measured that the validator returns `ALL CHECKS PASSED` over a kit containing `roles/rogue.markdown`, `roles/.gitkeep/rogue-role.md`, a duplicate stop section or a near-miss heading. Every corpus refusal from rounds 1–4 lives either in `check-diff-disposition` (which needs a git working tree reaching the base commit) or in vitest. `matrixDepartures`' totality assertion is a further instance — unreachable by construction.

So: these refusals protect **this repository's CI**. They do not protect an installed kit, and nothing in this plan should be read as claiming they do.

## Deviations from plan

Three, all documented in the round log rather than only here:

1. **[Rule 1 — Bug] The tests-project typecheck had been red since round 1.** `npm run typecheck` runs `tsc --noEmit && tsc -p tsconfig.tests.json`; only the first was ever run, so two type errors introduced by this plan's own round-1 commit (`87700bf`) shipped through four rounds under a fully green suite. Both fixed in `ac57787`; the widened comparison was proved non-vacuous by planting an undeclared kind rather than left merely well-typed.
2. **[Rule 2 — Missing critical] `.gitkeep` was discovered live** in both corpus directories while building the membership inversion, so the exemption lists were created with written reasons rather than asserted empty. Reviewer 7 then measured that a name-based exemption is an unbounded container — recorded as `V-30-10-13`.
3. **[Rule 3 — Blocking] Three verification probes produced clean-looking results from inputs that never reached the predicate** and were re-done: a `git archive` mirror with no `.git` (the gate failed on "not a git repository" first), a plant in the one exempt role, and a plant placed before the frozen heading rather than inside the region.

## Known stubs

None. The ten post-cap findings are **not** stubs — they are recorded open defects with working reproductions, behind a fence the user approved, and they are live backlog rather than deferred implementation.

## Self-Check: PASSED

- `docs/audit/30-redteam-surface-b.md` — FOUND (3,464 lines, verified by `wc -l` after the decision section landed)
- `.planning/phases/30-per-checkpoint-autonomy-matrix/deferred-items.md` — FOUND
- 16 commits `87700bf` … the final metadata commit — all present on `main`
