---
phase: 29-controlled-language-voice-guard-rebuild
plan: 11
subsystem: docs
tags: [kit-prose, checklists, controlled-language, acceptance-items, safety-partition, retired-vocabulary, named-leave-alone, generated-exclusion, dispositions, byte-growth]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 style contract every row cites"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 03
    provides: "guard_imperative_lexicon and guard_sentence_form, the 47-file four-part corpus, and the derived GENERATED exclusion at a two-sided count of 1"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, the docs/audit/29-style-dispositions/ seven-column contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 10
    provides: "the closed workflow track, the refuse-to-game-the-scanner bar, and the measure-a-no-op-with-the-same-rigour pattern"
provides:
  - "ALL THIRTEEN hand-authored checklists conforming — the checklists part of the governed corpus reports ZERO findings over its full visited denominator of 354 sentences, and guard_sentence_form falls 17 → 13 corpus-wide with its denominator unmoved at 2,165"
  - "the recorded finding that guard_imperative_lexicon's zero over this part is an EMPTY DENOMINATOR, not a clean bill: no hand-authored checklist carries a `## Steps` heading, so the predicate derives no element from the checklists at all"
  - "docs/audit/29-style-dispositions/29-11.md — 13 rows covering all 23 derived clauses, two safety partitions written before either file was opened, the marker-exclusion confirmation, and one named leave-alone with file, line, text and reason"
  - "four kit files that stop instructing a team to produce an artifact deleted two milestones ago, and the fifth occurrence recorded as a deliberate leave-alone rather than skipped"
  - "the checklists-part byte cost: 19,368 → 19,495 (+127 B, +0.66%), with nine of thirteen files byte-unchanged"
affects: [29-12, 29-13]

actuals:
  tokens: 71000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A predicate reporting ZERO over a part is two different facts — a clean denominator or an empty one — and the difference must be stated: guard_imperative_lexicon's zero over the checklists is an empty denominator, because no checklist carries a `## Steps` heading"
    - "A safety partition whose Set B turns out EMPTY is written and published anyway; an empty second half read out of an empty diff is indistinguishable from a partition nobody performed"
    - "Clearing a WP-06 finding by swapping the demonstrative for `it` is available on every instance and is refused every time — the pronoun is outside the predicate's closed token set while the defect stays exactly where it was"
    - "A retired-vocabulary MENTION in past-tense history is not a USE: the packaging document's occurrence explains why a guard counts rather than tests, and rewriting it into a present-tense claim would be its own defect"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-11.md
  modified:
    - agent-factory/checklists/00-index.md
    - agent-factory/checklists/compliance-checklist.md
    - agent-factory/checklists/definition-of-done.md
    - agent-factory/checklists/definition-of-done-enterprise.md
    - agent-factory/checklists/example-mapping.md
    - agent-factory/checklists/playwright-visual-regression-recipe.md
    - agent-factory/README.md
    - agent-factory/_commit-convention.md

key-decisions:
  - "guard_imperative_lexicon's ZERO over the checklists part is recorded as an EMPTY DENOMINATOR rather than reported as a pass. No hand-authored checklist carries a `## Steps` heading, so the predicate derives no element from this part; the corpus figure stays 0 over 139 and every one of those 139 bullets is a workflow's. Reporting it as a clean bill would be a verdict over a scan that visited nothing, which is the exact shape the gate's own per-part vacuity floor exists to refuse"
  - "Every checklist bullet in this part is an ACCEPTANCE ITEM, decided by section anchor exactly as the guard decides, and NONE was reshaped into an imperative. Nine of the thirteen files are byte-unchanged by the style pass. The per-section bullet counts are equal in all thirteen"
  - "`release-readiness-checklist.md`'s safety partition has an EMPTY Set B and the file is byte-unchanged in its entirety — the partition was written and published before the file was opened, because an empty diff cannot distinguish a partition that found nothing from one nobody performed"
  - "Swapping the bare demonstrative for `it` clears all four WP-06 findings and was refused four times. `it` is outside the closed demonstrative set the predicate enumerates, so the swap moves the text out of the predicate's reach while leaving the unresolvable subject exactly where it was. 29-08's refusal to move a period outside a quotation mark is the precedent"
  - "`agent-factory/packaging/subagent.frontmatter.md:204` is a NAMED LEAVE-ALONE with its file, line, text and reason recorded. It is accurate past-tense history explaining why `guard_adapter_body` counts the memory sentence rather than testing for it — a MENTION of the retired vocabulary, not a USE. Deleting it would remove the explanation a later editor needs in order not to reintroduce the relay"
  - "`agent-factory/README.md` and `agent-factory/_commit-convention.md` received a one-noun-phrase vocabulary fix and NOTHING ELSE. Style-rewriting either was available and refused: they are documentation about the kit rather than instructions an agent executes (D-36), and a file that receives the profile without entering the two-sided pinned count is a file the gate does not police and a later reader believes it does"
  - "`scripts/dead-vocabulary.ts` is byte-unchanged. No new retired-vocabulary literal was declared, and its boundary warning was obeyed — no execution-topology text was deleted anywhere"
  - "The sixth occurrence, `agent-factory/seed/plans/board.md:64`, is named in the register as 29-12's rather than left as an unexplained gap in the six-occurrence arithmetic"

patterns-established:
  - "State whether a predicate's zero came from a full denominator or an empty one — the two are different facts and only one of them is a pass"
  - "Publish a safety partition whose second half is empty, with the emptiness stated; a no-op partition is the one a later reader would most suspect was skipped"

requirements-completed: []

coverage:
  - id: D1
    description: "All thirteen hand-authored checklists carry the profile and the checklists part reports zero findings over its full visited denominator, with acceptance items left as acceptance items (LANG-02, LANG-04)"
    requirement: "LANG-02"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — `guard_sentence_form` falls 17 → 13 while its denominator is UNMOVED at 2,165 sentences; all four checklist findings go to zero and every remaining one is in the seed templates (7) or the contracts (6). `guard_imperative_lexicon` stays PASS at 0 over 139/139"
        status: pass
      - kind: integration
        ref: "the corpus arithmetic closes exactly: 17 − 4 = 13, and the checklists' own sentence denominator is 354 before and 354 after, so the other 34 governed members contributed nothing in either direction (34 of 34 byte-identical to the 29-10 tree at 1ee758e, by Node string equality against `git show`)"
        status: pass
      - kind: other
        ref: "per-section bullet counts equal in all thirteen files, by a Node walk mirroring the gate's own `deriveElements()` anchoring and reusing the same `fencedLineFlags()` authority. Nine of thirteen files are byte-unchanged by the style pass; every checklist bullet is an acceptance item and none was reshaped into an imperative"
        status: pass
      - kind: other
        ref: "six hermetic mutations against the COMMITTED tree each red the NAMED arm at the NAMED file and line; M0 control clean, post-restore control clean, every mutation asserted applied and every restore byte-identical, `git diff --stat -- agent-factory docs scripts` empty afterwards"
        status: pass
      - kind: other
        ref: "the gate still exits 1 overall — 13 `guard_sentence_form` findings, all `bare-demonstrative-subject`, in the seed templates and the contracts, which is 29-12's work"
        status: pass
    human_judgment: false
  - id: D2
    description: "The generated third-party checklist was never opened and its exclusion is derived, not named (LANG-02, D-42, T-29-63)"
    verification:
      - kind: integration
        ref: "`git diff --name-only -- agent-factory/checklists/security-nfr-checklist.md` returns NOTHING across both commits; `GENERATED_EXEMPT` derives exactly that one path against a two-sided `GENERATED_EXEMPT_COUNT` of 1"
        status: pass
      - kind: other
        ref: "the marker-exclusion confirmation is RECORDED in docs/audit/29-style-dispositions/29-11.md — the generator's four-line marker header quoted from lines 1-14, the only region of the file this plan read — rather than inferred from the file's absence from the diff"
        status: pass
    human_judgment: false
  - id: D3
    description: "The safety-bearing checklist text was partitioned and judged sentence by sentence (LANG-03, D-02)"
    requirement: "LANG-03"
    verification:
      - kind: other
        ref: "the four-row `compliance-checklist.md` and five-row `release-readiness-checklist.md` Set A tables were written and committed in the same commit as the edits and BEFORE either file was opened for editing. `release-readiness-checklist.md`'s Set B is EMPTY and the file is byte-unchanged in its entirety; `compliance-checklist.md`'s Set B has exactly one member, the subject noun phrase of its gate sentence"
        status: pass
      - kind: other
        ref: "no production permission widened, no human-confirmation requirement moved, no no-fabrication floor was touched, and no clear-voice sentence acquired caveman voice. `pr-review-checklist.md` and `definition-of-done.md` were partitioned the same way; `pr-review-checklist.md` is byte-unchanged"
        status: pass
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 1878/1878 elements`, exit 0, 1,502 rows across 7 files. This plan's share is 13 rows covering all 23 derived clauses, verified by re-implementing the gate's own `rowMatches()` over this register (23 derived, 0 uncovered) — including the checklists, which the gate itself does not watch"
        status: pass
      - kind: other
        ref: "the register proves every changed clause was dispositioned and nothing about any disposition's substance; the LANG-03 check is a named human reading the 13 rows against the diff"
        status: pass
    human_judgment: true
  - id: D4
    description: "The four retired-vocabulary occurrences are corrected, the fifth is a recorded leave-alone, and the correction did not over-reach (D-46, T-29-64, T-29-66, T-29-67)"
    verification:
      - kind: integration
        ref: "a NODE WALK over `agent-factory/checklists/`, `agent-factory/README.md` and `agent-factory/_commit-convention.md` — 16 files, 122,178 bytes, `readFileSync` + `String.includes` over seven needles including all three `dead-vocabulary.ts` literals — finds ZERO occurrences. Named as the method because a bare recursive grep reports zero on a binary-classified file with no warning. Every file also round-trips UTF-8 byte-identically"
        status: pass
      - kind: integration
        ref: "`agent-factory/packaging/subagent.frontmatter.md` is ABSENT from `git diff --name-only`, and its line-204 occurrence is recorded in the disposition file as a named leave-alone with file, line, text and reason"
        status: pass
      - kind: integration
        ref: "npm run check:public-docs exits 0 and node scripts/check-kit-refs.js exits 0 — the sibling gates that already police the same authority stay green, so the corrections are consistent with a live gate rather than a new local opinion"
        status: pass
      - kind: other
        ref: "`git diff -- scripts/` is EMPTY. `scripts/dead-vocabulary.ts` is byte-unchanged, no new literal was declared, and its boundary warning was obeyed — no execution-topology text (`one window, prior context dropped between roles`) was deleted anywhere"
        status: pass
    human_judgment: false
  - id: D5
    description: "The corpus did not grow by stealth and the out-of-corpus files got vocabulary fixes only (D-36, T-29-65)"
    verification:
      - kind: integration
        ref: "`GOVERNED_CORPUS_COUNT` is still 47 in four parts (workflows 19, checklists 13, seedTemplates 13, contracts 2); `APPROVED_STEP_VERBS` still 43; `TECHNICAL_NAMES` still 76; `GENERATED_EXEMPT` still 1"
        status: pass
      - kind: other
        ref: "`agent-factory/README.md` +28 B and `agent-factory/_commit-convention.md` +5 B — one noun phrase each, no sentence split, no clause reshaped, no profile rule applied. Neither is a member of the governed corpus and neither entered it"
        status: pass
    human_judgment: false
  - id: D6
    description: "Byte growth is measured and recorded per file rather than assumed (D-28)"
    verification:
      - kind: other
        ref: "thirteen-row growth table below, every value from `Buffer.byteLength` of the working-tree text against `Buffer.byteLength(git show 4d2b8f0:<path>)`; checklists part 19,368 → 19,495 (+127 B, +0.66%) against the research's own hand-authored baseline, which reproduces exactly"
        status: pass
      - kind: other
        ref: "the mechanism is NOT sentence splitting here — the sentence denominator is UNMOVED at 354, so not one sentence was split. 100 of the 127 bytes are two vocabulary corrections re-narrating onto the shared verified context; the four style fixes cost 39 B between them"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every repo gate and the regression lane are green, and the gate wall clocks and the two state-file numbers are re-measured"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped: identical to the 29-05 … 29-10 baseline"
        status: pass
      - kind: integration
        ref: "check-public-docs 0 · check-kit-refs 0 · check-diff-disposition 0 · check-foundation-guards 0 · check-banned-claims 0 · check-nul-bytes 0 · validate-agent-factory 0 · typecheck 0 · freshness 0 at 48 pairs · freshness:catalog 0"
        status: pass
      - kind: other
        ref: "imperative-lexicon 0.04 / 0.04 / 0.04 s (29-10 identical); diff-disposition 0.70 / 0.69 / 0.69 s (29-10 0.70 / 0.68 / 0.68); foundation guards 0.09 / 0.09 / 0.09 s. `.planning/STATE.md` longest line 7,966 (§F-2 baseline 7,994, below it) and longest backslash run 1 over 11 total (baseline 1, unmoved)"
        status: pass
    human_judgment: false

duration: 62min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 11: The Thirteen Hand-Authored Checklists Summary

**The checklists part closes at zero findings over its full visited denominator, and the headline number is smaller than the plan expected for a reason worth writing down: this part opened at FOUR findings, not forty. Nine of the thirteen files are byte-unchanged, because every checklist bullet here is an acceptance item rather than a procedural step and none was improved into an imperative. `guard_imperative_lexicon`'s zero over this part is recorded as an EMPTY DENOMINATOR rather than a clean bill — no hand-authored checklist carries a `## Steps` heading at all. A safety partition was published whose second half turned out empty, and the emptiness is stated rather than left to be read out of an empty diff. Four kit files stopped instructing a team to produce an artifact this project deleted two milestones ago, the fifth occurrence is a named leave-alone with its reason, and the sixth is named as 29-12's so the arithmetic closes.**

## Performance

- **Duration:** 62 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 9 (1 created, 8 modified)

## The predicate state, before and after

```
[guard_imperative_lexicon] …
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2;
        1 excluded by the derived `GENERATED` marker
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  PASS  imperative lexicon: 0 findings over 139/139 elements

[guard_sentence_form] …
        2165 sentence(s) — 414 procedural, 1751 descriptive;
        by finding kind: bare-demonstrative-subject 13
  FAIL  sentence form: 13 finding(s) over 2165 elements
```

The gate still exits **1**, and it should. The remaining **13** are all `bare-demonstrative-subject` and **not one is in a checklist**: seven are in the seed templates and six in the contracts, which is 29-12's work.

## The finding movement, with the denominators beside it

Findings from `node scripts/check-imperative-lexicon.js`; denominators from a Node walk mirroring the gate's own `deriveElements()` anchoring and reusing the same `fencedLineFlags()` authority, cross-checked against the gate's printed corpus totals on both sides.

| file | `guard_imperative_lexicon` | `guard_sentence_form` | `## Steps` bullets | sentences visited |
|---|---|---|---:|---:|
| `00-index.md` | — | 1 → **0** | 0 → 0 | 45 → 45 |
| `accessibility-checklist.md` | — | 0 → **0** | 0 → 0 | 27 → 27 |
| `compliance-checklist.md` | — | 1 → **0** | 0 → 0 | 18 → 18 |
| `definition-of-done.md` | — | 0 → **0** | 0 → 0 | 17 → 17 |
| `definition-of-done-enterprise.md` | — | 1 → **0** | 0 → 0 | 22 → 22 |
| `definition-of-ready.md` | — | 0 → **0** | 0 → 0 | 18 → 18 |
| `example-mapping.md` | — | 0 → **0** | 0 → 0 | 29 → 29 |
| `linter-recommendations.md` | — | 0 → **0** | 0 → 0 | 75 → 75 |
| `observability-slo-checklist.md` | — | 0 → **0** | 0 → 0 | 14 → 14 |
| `playwright-visual-regression-recipe.md` | — | 1 → **0** | 0 → 0 | 44 → 44 |
| `pr-review-checklist.md` | — | 0 → **0** | 0 → 0 | 15 → 15 |
| `release-readiness-checklist.md` | — | 0 → **0** | 0 → 0 | 16 → 16 |
| `uat-checklist.md` | — | 0 → **0** | 0 → 0 | 14 → 14 |
| **batch** | **— (no elements)** | **4 → 0** | **0 → 0** | **354 → 354** |
| **corpus** | **0 / 139 → 0 / 139** | **17 / 2,165 → 13 / 2,165** | **139 → 139** | **2,165 → 2,165** |

**No visited denominator moved anywhere** — not per file, not for the batch, not at the corpus level. That is unusual for this phase and it is the direct consequence of the finding kind: all four were `bare-demonstrative-subject`, which is fixed by naming a head noun inside an existing sentence rather than by splitting one. **Not one sentence in the checklists was split.**

**The corpus arithmetic closes exactly.** 17 − 4 = 13. The sentence denominator is 2,165 on both sides and this batch's delta is 0, so the other forty-one governed members contributed nothing in either direction.

### The `guard_imperative_lexicon` column is a dash, and that is the finding

The imperative column above is **not zero — it is empty**. **No hand-authored checklist carries a `## Steps` heading**, so `deriveElements()` derives no bullet from this part and the predicate never runs over it. All 139 bullets in the corpus figure are workflows'.

This is written down rather than reported as a pass because the two are different facts and only one of them is a verdict. A predicate that reports zero over zero elements has stated a check it did not perform — precisely the shape the gate's own **per-part vacuity floor** exists to refuse, and precisely the shape `reportMeasured()` was written to make unsayable. The plan's acceptance criterion asked for "zero findings over its full visited denominator"; the honest reading of that for this part is **zero `guard_sentence_form` findings over 354 sentences, and no imperative denominator at all.**

### What the four were

| finding kind | count | where |
|---|---:|---|
| `bare-demonstrative-subject` (WP-06) | 4 | `00-index` 1, `compliance-checklist` 1, `definition-of-done-enterprise` 1, `playwright-visual-regression-recipe` 1 |
| `descriptive-sentence-too-long` (WP-03) | **0** | none — no checklist sentence exceeds 25 words |
| `procedural-sentence-too-long` (WP-02) | **0** | none — there are no procedural sentences in this part |
| every other arm | **0** | none |
| **TOTAL** | **4** | over 354 sentences and 0 bullets in thirteen files |

## The acceptance-item finding — why nine of thirteen are byte-unchanged

The plan anticipated the distinction and it turned out to be the whole story. **Every bullet in this part is an acceptance item** — a condition that must hold — rather than an action to take. `- no secrets committed`, `- rollback known`, `- coverage meets threshold (config)`. WP-04 decides by section anchor exactly as the guard does, and none of these sits under a `## Steps` heading, so none is procedural and none takes the canonical step form.

**Not one was reshaped into an imperative**, and the per-section bullet counts prove it. Counted by a Node walk over the same `## `-heading anchor and `^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+` list-marker rule the gate uses; a bare recursive grep was not used, because a file classified as binary reports zero matches with no warning.

| file | sections and their bullet counts, before → after |
|---|---|
| `00-index.md` | no list bullets — its two tiers are tables (unchanged) |
| `accessibility-checklist.md` | preamble 6 → **6**, `## Automated checks (axe-core)` 3 → **3** |
| `compliance-checklist.md` | preamble 8 → **8** |
| `definition-of-done.md` | preamble 9 → **9** |
| `definition-of-done-enterprise.md` | preamble 11 → **11** |
| `definition-of-ready.md` | preamble 10 → **10** |
| `example-mapping.md` | preamble 9 → **9** |
| `linter-recommendations.md` | `## Per-stack linters` 4 → **4**, `` ## Config-dial wiring (`quality.lint`) `` 4 → **4** |
| `observability-slo-checklist.md` | preamble 6 → **6** |
| `playwright-visual-regression-recipe.md` | `## Tooling` 2 → **2**, `## The flake-resistance set` 7 → **7**, `## At the gate` 2 → **2** |
| `pr-review-checklist.md` | preamble 8 → **8** |
| `release-readiness-checklist.md` | preamble 8 → **8** |
| `uat-checklist.md` | preamble 9 → **9** |

**13 of 13 equal.** Not one bullet was added, removed, or moved between sections. `definition-of-done.md`'s D-46 correction replaced a bullet's text in place and its count is still 9.

## The four WP-06 corrections, and the fix that was available four times and refused four times

`guard_sentence_form`'s remedy for this arm reads *"name the antecedent"*, and the gate's own source states what it decides: *"`This is the drift` is a bare demonstrative subject, while `This workflow runs at release` is a demonstrative DETERMINER modifying a noun and is correct."* Each correction supplies the head noun the demonstrative was missing.

| file | before | after |
|---|---|---|
| `00-index.md:7` | `These are the gate contracts for grugops.` | `These checklists are the gate contracts for grugops.` |
| `compliance-checklist.md:7` | `This is a safety and compliance gate: …` | `The checklist is a safety and compliance gate: …` |
| `definition-of-done-enterprise.md:7` | `This is the enterprise superset of the lean Definition of Done.` | `This checklist is the enterprise superset of the lean Definition of Done.` |
| `playwright-visual-regression-recipe.md:12` | `This is a reference how-to.` | `This document is a reference how-to.` |

**The refusal, stated because it was available on every single one.** Swapping the bare demonstrative for the pronoun `it` clears all four findings instantly — `it` is not a member of `DEMONSTRATIVES`, the closed token set the predicate enumerates. That is clearing a finding by moving the text **outside the predicate's reach** while leaving the defect WP-06 exists to catch exactly where it was: the reader still cannot resolve the subject without the previous sentence. **It was not taken once.** This is 29-08's bar, which refused to move a period outside a quotation mark to defeat a splitter boundary rule, and 29-09's, which refused a deletion that would have cleared a finding by removing a safety floor.

`compliance-checklist.md` took the definite noun phrase rather than `This checklist` because the immediately preceding sentence already opens `Apply this checklist …`; `playwright-visual-regression-recipe.md` took `This document` because `This recipe` and `This file` each repeat a noun from an adjacent sentence. Neither substitution buys a WP-09 repetition to pay a WP-06 finding.

**No predicate was widened and no scan set was narrowed.** `git diff -- scripts/ package.json` is **empty** for this plan.

## The safety partitions, written before either file was opened

Both are in `docs/audit/29-style-dispositions/29-11.md`, committed in the same commit as the edits.

**`compliance-checklist.md` — Set A, four members.** The regulated-data condition, the control-reproduction and evidence-mapping requirement, the no-fabrication floor, and **all eight control bullets** — every one **byte-unchanged**. **Set B has exactly one member:** the subject noun phrase `This is`. The predicate of that sentence is Set A and did not move. The gate still calls itself a safety and compliance gate, the register stays clear voice, and no requirement was reworded, weakened or dropped.

**`release-readiness-checklist.md` — Set A, five members. Set B, EMPTY.** `The last two checks are the hard safety boundary: no release proceeds without a named human approval recorded, and the production action is always human-confirmed — never automated.` is **byte-unchanged — not one character**, as are `named human approval recorded`, `production action will be human-confirmed`, and the remaining six bullets. **The whole file is byte-unchanged.**

**The partition was published anyway, with its emptiness stated.** A safety partition that turns out to require no edit is exactly the one a later reader would suspect was never performed, because an empty diff cannot distinguish the two. 29-10 established this for a reconciliation that turned out to be a no-op; the same argument applies to a partition whose second half is empty.

`pr-review-checklist.md` and `definition-of-done.md` were partitioned the same way. `pr-review-checklist.md` has no Set B member and is byte-unchanged; `definition-of-done.md`'s single Set B member is the D-46 correction below.

## D-46 — the four corrections, the named leave-alone, and the sixth occurrence

Phase 24 deleted the seventeen static relay templates and the shared verified context replaced the relay. Six kit files still carried the vocabulary, and **why two audits missed them is structural rather than accidental**:

1. The Phase 28 vocabulary audit covered the **roles and the workflows**. None of these six is either.
2. `scripts/dead-vocabulary.ts` holds one **path form** (`agent-factory/handoffs/`) and two **prose forms** (`handoff packet`, `the handoff is the only memory`). **None of the six occurrences is any of those three literals** — they are the bare noun, pluralised or written as a checklist item — so no consumer of that one authority could see them.

**This plan declared no new literal.** `scripts/dead-vocabulary.ts` is byte-unchanged and its boundary warning was obeyed: only the memory-relay half is retired, so no execution-topology text was deleted anywhere.

| # | file:line | before | after |
|---|---|---|---|
| 1 | `checklists/definition-of-done.md:16` | `- handoff written` | `- work output published as typed notes into the shared verified context` |
| 2 | `checklists/example-mapping.md:10` | `block in the product and QE handoffs.` | `block in the product and QE typed notes in the shared verified context.` |
| 3 | `agent-factory/README.md:111` | `handoffs, epics, first tickets, and seed the board.` | `notes in the shared verified context, epics, first tickets, and seed the board.` |
| 4 | `agent-factory/_commit-convention.md:9` | `metrics, and handoffs` | `metrics, and context notes` |

**Occurrence 1 is the load-bearing one.** The lean Definition of Done required a team to produce an artifact this project deleted two milestones ago. A team following the checklist was instructed to produce something that no longer exists — a gate nobody could pass honestly. The replacement names the obligation that actually holds, is phrased as an acceptance item in the same lowercase noun-phrase form as its eight neighbours, and is 11 words against the 25-word descriptive bound.

**Occurrence 2 is the second.** It named where the discovery conversation's acceptance scenarios land. It was **re-narrated onto the shared verified context flow rather than noun-swapped**: `agent-factory/workflows/14-ui-design-to-build.md` reads the product `## Acceptance scenarios` *"from the shared verified context per Workflow 16"* and `agent-factory/roles/frontend-ui.md` says the same, so the replacement uses the kit's own existing vocabulary rather than minting a second spelling.

**Occurrences 3 and 4 are vocabulary-only, deliberately.** One noun phrase each, no sentence split, no clause reshaped, no profile rule applied. `agent-factory/README.md` grew 28 B and `agent-factory/_commit-convention.md` 5 B. Style-rewriting either was available and was **refused**: both are documentation *about* the kit rather than instructions an agent executes (D-36), and a file that receives the profile without entering the two-sided pinned corpus count is a file the gate does not police while a later reader believes it does. `GOVERNED_CORPUS_COUNT` is still **47**.

### The named leave-alone

| field | value |
|---|---|
| file | `agent-factory/packaging/subagent.frontmatter.md` |
| line | **204** |
| text | `memory is. Phase 24 deleted the seventeen static handoff templates and the shared context replaced the relay, so a body that loses that sentence has gone stale by omission.` |
| decision | **LEFT ALONE** — absent from `git diff --name-only` across both commits |
| reason | Accurate **past-tense history**, written to explain why `guard_adapter_body` *counts* the memory sentence rather than testing for its presence. It is a **mention** of the retired vocabulary, not a **use** of it. Rewriting accurate history into a present-tense claim would be its own defect, and deleting it would remove the explanation a later editor needs in order not to reintroduce the relay. |
| corroboration | `agent-factory/packaging/` is one of `GOVERNED_CORPUS_EXCLUDED_LOCATIONS`, excluded by name with its reason already recorded in the gate's own source — so the file is out of scope on two independent grounds. |

**The sixth occurrence is named rather than dropped.** `agent-factory/seed/plans/board.md:64` (`| Ready for Dev | handoffs complete, ticket sized | Orchestrator | 6 |`) is a seed template in plan 29-12's `files_modified`. It is recorded in the register so the six-occurrence arithmetic closes rather than leaving a reader to wonder which file it lost.

### The Node walk that proves zero, with its method named

```
files scanned: 16 (incl. the 1 generated file, read but not edited), bytes 122178
retired relay vocabulary occurrences: 0
files failing a UTF-8 round trip: 0
```

`readFileSync` + `String.includes` over seven needles — `handoff`, `handoffs`, `Handoff`, `HANDOFF`, and all three `dead-vocabulary.ts` literals — across `agent-factory/checklists/`, `agent-factory/README.md` and `agent-factory/_commit-convention.md`. **Named as the method because a bare recursive grep reports zero matches on a binary-classified file with no warning.** Every file also round-trips UTF-8 byte-identically, which is 29-05's `perl -pi -e` hazard checked rather than assumed; every edit here went through the structured editor and no byte-level tool was used.

## The byte growth, per file, with its mechanism named

Every value from `Buffer.byteLength` of the working-tree text against `Buffer.byteLength(git show 4d2b8f0:<path>)`.

| file | before | after | delta | % |
|---|---:|---:|---:|---:|
| `00-index.md` | 1804 | 1815 | **+11** | +0.61% |
| `accessibility-checklist.md` | 1917 | 1917 | **0** | 0.00% |
| `compliance-checklist.md` | 769 | 778 | **+9** | +1.17% |
| `definition-of-done.md` | 503 | 557 | **+54** | +10.74% |
| `definition-of-done-enterprise.md` | 998 | 1008 | **+10** | +1.00% |
| `definition-of-ready.md` | 857 | 857 | **0** | 0.00% |
| `example-mapping.md` | 2450 | 2484 | **+34** | +1.39% |
| `linter-recommendations.md` | 3500 | 3500 | **0** | 0.00% |
| `observability-slo-checklist.md` | 524 | 524 | **0** | 0.00% |
| `playwright-visual-regression-recipe.md` | 4687 | 4696 | **+9** | +0.19% |
| `pr-review-checklist.md` | 472 | 472 | **0** | 0.00% |
| `release-readiness-checklist.md` | 558 | 558 | **0** | 0.00% |
| `uat-checklist.md` | 329 | 329 | **0** | 0.00% |
| **checklists part total** | **19,368** | **19,495** | **+127** | **+0.66%** |

**The 19,368-byte hand-authored baseline from 29-RESEARCH §A-2 reproduces exactly**, unlike the workflow group's 104,094 figure that 29-10 falsified against the research's own command. It is used here as stated.

**The mechanism is NOT sentence splitting, and that is measurable rather than asserted.** The sentence denominator is **354 on both sides** — not one sentence was split anywhere in this part. Of the 127 bytes:

- **88 B** are `definition-of-done.md` and `example-mapping.md`'s two D-46 corrections, which re-narrate onto the shared verified context and are longer for that reason alone. `definition-of-done.md`'s +10.74% is the largest percentage in the phase so far and is an artifact of a 503-byte denominator: one bullet grew from 15 to 69 characters.
- **39 B** are the four WP-06 fixes — the cost of four head nouns, 9 to 11 bytes each.

Out of the checklists part, `agent-factory/README.md` grew **+28 B** and `agent-factory/_commit-convention.md` **+5 B**, both vocabulary-only.

**No byte ceiling exists for a checklist and none was added.**

## The untouched-part control, measured rather than assumed

| control | result | method |
|---|---|---|
| non-checklist governed members byte-identical to the 29-10 tree | **34 of 34** | Node string equality of `readFileSync` against `git show 1ee758e:<path>` |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged (workflows 19, checklists 13, seedTemplates 13, contracts 2) | the gate's own `GOVERNED_CORPUS_PARTS` via `import()` |
| `GENERATED_EXEMPT` | **1**, still `agent-factory/checklists/security-nfr-checklist.md` | the derived `GENERATED` marker, two-sided pin |
| generated OWASP checklist in the diff | **absent** | `git diff --name-only` over that path returns nothing |
| `agent-factory/packaging/` in the diff | **absent** | same |
| `agent-factory/seed/` and `agent-factory/contracts/` in the diff | **absent** — 29-12's files, untouched | same |
| `git diff --name-only -- scripts/ package.json` | **empty** | no predicate, no scan set, no dependency |

### The generated OWASP checklist — the exclusion confirmed, not inferred

The file is **89,840 bytes, 82% of its own directory, and 345 rows copied verbatim from a third-party standard**. Its header region was read — **lines 1 to 14 only** — and carries the generator's marker on line 4:

```
<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-asvs-checklist.js
     Source: OWASP ASVS 5.0.0 · OWASP/ASVS @ v5.0.0_release
     Commit: 5cf9b032440be53ce345ab3c130fda46ba1ce7a2 -->
```

**The file was not opened beyond that header and not edited**, and the confirmation is **recorded in the disposition file** rather than left to be inferred from the file's absence from the diff — which is the difference between a decision and a silence.

## Falsifiability — the guard still reds MY prose

**Six mutations against the COMMITTED tree**, each asserted applied before the guard ran and each restored byte-identically after.

| mutation | file | expected arm | result |
|---|---|---|---|
| M0 — unmutated control | — | none | **0 own findings** |
| M1 — the head noun removed | `00-index.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `00-index.md:7`** |
| M2 — the definite subject reverted | `compliance-checklist.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `compliance-checklist.md:7`** |
| M3 — the head noun removed | `definition-of-done-enterprise.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `definition-of-done-enterprise.md:7`** |
| M4 — the head noun removed | `playwright-visual-regression-recipe.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `playwright-visual-regression-recipe.md:12`** |
| M5 — the new DoD item extended past the bound | `definition-of-done.md` | `WP-03 [descriptive-sentence-too-long]` | **1 hit at `definition-of-done.md:16`, `33 words, bound 25`** |
| M6 — an `and/or` planted | `example-mapping.md` | `WP-07 [and-slash-or]` | **1 hit at `example-mapping.md:21`** |

Every mutation reported `applied=true` and `restored=true`, the post-restore control is clean again, and `git diff --stat -- agent-factory docs scripts` is **empty** afterwards. **No mutation required a predicate change to produce, and no predicate was touched to make any of them stop.**

M5 and M6 are the two that matter most here: M5 proves the length bound reaches the *new* text this plan wrote, and M6 proves the `and-slash-or` arm — which has found **zero** findings anywhere in this phase — is live rather than dead code.

## The disposition register

`docs/audit/29-style-dispositions/29-11.md` — **13 rows covering all 23 derived clauses**, every row read back through the gate's own seven-column rule to confirm it is visible (a row with any other cell count is silently skipped, which is the failure mode the count exists to catch). **Zero rows carry a companion cell, because zero changed clauses intersect the frozen set.**

**Coverage was verified by re-implementing the gate's own `rowMatches()` over this register** — 23 derived clauses, **0 uncovered** — including the ten clauses in the checklists, which the gate itself never watches. The clauses themselves were derived by mirroring `changedClauses()`: the same `git diff --unified=0` hunk parse, the same `segmentClauses()`, the same `normalizeSentence()` comparison.

```
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17,
        workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9;
        416 frozen clause(s), 55 frozen region(s); base 4d2b8f0
        36 watched file(s) changed since 4d2b8f0; 1878 changed clause(s) derived;
        1502 disposition row(s) across 7 file(s)
  PASS  diff disposition: 0 findings over 1878/1878 elements
```

**Only one of this plan's eight edited files is in the watched corpus** — `agent-factory/README.md`, one of the four public documents that host safety claims. The other seven are not watched, and rows were written for all of them anyway. The register is a record of judgement, not a receipt for a gate.

`agent-factory/README.md`'s edit sits at line 111, far from both of its registered claim anchors (`C-28-023` at line 14, `C-28-032` at line 78), and neither anchor's verbatim text is touched.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 1** — `guard_imperative_lexicon` PASSES at 0 over 139; `guard_sentence_form` FAILS at **13** over 2,165, none of them in a checklist |
| `npm run check:diff-disposition` | **exit 0** — `0 findings over 1878/1878 elements`, 1,502 rows across 7 files |
| `npm run check:public-docs` | **exit 0** |
| `node scripts/check-kit-refs.js` | **exit 0** |
| `node scripts/check-foundation-guards.js` | **exit 0** — the role track stays closed at 17/17 |
| `npm run check:banned-claims` · `check-nul-bytes.js` | both exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npm run freshness:catalog` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05…29-10 baseline — unmoved) |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged |
| `APPROVED_STEP_VERBS.length` | **43**, unchanged — **no verb was added** |
| `TECHNICAL_NAMES.length` | **76**, unchanged |
| `GENERATED_EXEMPT.length` | **1**, unchanged |
| `git diff 33be1b6 HEAD -- scripts/ package.json` | **empty** |
| imperative-lexicon wall clock, 3 runs | **0.04 / 0.04 / 0.04 s** (29-10 identical) |
| diff-disposition wall clock, 3 runs | **0.70 / 0.69 / 0.69 s** (29-10 0.70 / 0.68 / 0.68 — the register grew 1,489 → 1,502 rows) |
| foundation-guards wall clock, 3 runs | **0.09 / 0.09 / 0.09 s** (29-10 0.10 / 0.09 / 0.09) |
| this batch's largest file | `playwright-visual-regression-recipe.md` 4,696 B |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — below it; 29-08, 29-09 and 29-10 all measured 7,966) |
| `.planning/STATE.md` longest backslash run | **1** over 11 total backslashes (§F-2 baseline 1 — unmoved) |

## Counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method.

| count | value | method |
|---|---:|---|
| governed corpus files | **47** | the gate's own `GOVERNED_CORPUS_PARTS`, read through `import()` |
| hand-authored checklists | **13** | the same, `checklists` part after the derived `GENERATED` exclusion |
| non-checklist governed members byte-identical | **34 of 34** | Node string equality of `readFileSync` against `git show 1ee758e:<path>` |
| files failing a UTF-8 round trip | **0** | `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file, over all 16 walked |
| `## Steps` bullets in the checklists part | **0** before and after | Node walk reusing `fencedLineFlags()`, cross-checked against the gate's printed corpus total of 139 across 19 files |
| sentences visited, before / after | **354 / 354** (batch) · **2,165 / 2,165** (corpus) | same walk, same cross-check |
| per-section bullet counts | equal in **13 of 13** files | Node walk, section anchor + list marker |
| retired relay vocabulary in the corrected scope | **0** | Node walk, `readFileSync` + `String.includes`, 7 needles, 16 files, 122,178 bytes |
| disposition rows in `29-11.md` | **13** covering **23** derived clauses, **0** with a companion | the gate's own seven-column row rule and `rowMatches()`, re-implemented over the file |
| checklists-part bytes | 19,368 → 19,495 | `Buffer.byteLength` vs `Buffer.byteLength(git show 4d2b8f0:…)` |
| approved verbs | **43** | `APPROVED_STEP_VERBS.length` via `import()` |

## Deviations from Plan

### 1. [Measured deviation] The plan sized this part as a style rewrite; it is four findings and nine untouched files

- The plan's Task 1 action describes the full conversion catalogue — bold-label stripping, determiner and actor-subject re-narration, leading-conditional moves, procedural and descriptive sentence splitting, modal removal, chained-imperative splitting.
- **None of those arms had a single finding in this part.** The measured opening state is **four** findings, all `bare-demonstrative-subject`, in four files. The other nine files needed nothing and are byte-unchanged by the style pass.
- The reason is structural and is now recorded: **the checklists contain no procedural text at all.** No `## Steps` heading, so no bullet is procedural, so WP-01, WP-02, WP-05 and WP-08 have no subject here; and no descriptive sentence exceeds 25 words, so WP-03 has none either.
- The plan's own instruction — *"do not improve a correct acceptance item into a step"* — is what makes the small number the correct outcome rather than an under-delivery, and the per-section bullet counts are published above so the claim is checkable.

### 2. [Recorded correction] `guard_imperative_lexicon`'s zero over this part is an empty denominator, not a pass

- The plan's acceptance criterion reads *"Both guards report zero findings for all thirteen hand-authored checklists, and the checklists part of the corpus now reports zero findings over its full visited denominator."*
- `guard_imperative_lexicon` derives **zero elements** from this part, so it reports zero findings over zero elements. That is not a verdict; it is the vacuity shape `reportMeasured()` and the gate's per-part floor were both written to make unsayable.
- The criterion is therefore reported as met in the only honest reading — **zero `guard_sentence_form` findings over 354 visited sentences, and no imperative denominator at all** — and the distinction is written into the register and this summary rather than absorbed into a green tick.

### 3. [Recorded judgement] `release-readiness-checklist.md`'s Set B is empty and the file is byte-unchanged

- The plan asks for a two-way sentence partition on the compliance and release-readiness checklists, written before either is edited, with only the second set edited.
- The partition was written and published for both. **`release-readiness-checklist.md`'s second set is empty**: every sentence in the file is safety-bearing, none carried a finding, and the file is byte-unchanged in its entirety.
- Recorded as a judgement rather than omitted, on 29-10's precedent for a reconciliation that turned out to be a no-op. An empty diff cannot distinguish a partition that found nothing from one nobody performed.

### 4. [Recorded finding] Only one of this plan's eight edited files is in the `guard_diff_disposition` watched corpus

- The plan's `key_links` treats `guard_diff_disposition` as the gate over every changed clause in this plan.
- Measured: the watched corpus is the 41-entry LANG-03 safety-surface union — 18 roles, 19 workflows and 4 public documents. **The checklists are not in it, and neither is `agent-factory/_commit-convention.md`.** `agent-factory/README.md` is the only watched file this plan touches.
- **Rows were written for all eight anyway**, and their coverage was verified by re-implementing the gate's own `rowMatches()` (23 derived clauses, 0 uncovered), because the register is a record of judgement rather than a receipt for a gate. The measurement is recorded so a later reader does not mistake a green `check:diff-disposition` for proof that the checklist edits were dispositioned — that proof is the re-implementation above.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. None of the eight modified files carries `TODO`, `FIXME`, `placeholder` or `coming soon`, and every removed clause's content is either restated in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — whether a corrected Definition of Done item states the obligation a team can actually satisfy is a human judgement.** The register proves the clause was dispositioned; it proves nothing about whether *"work output published as typed notes into the shared verified context"* is the obligation the enterprise and lean tiers actually intend. This is the sharpest open question this plan leaves, because the replaced item is a **gate a team is measured against**.
- **The `and-slash-or` arm (WP-07) has found ZERO findings across the entire phase.** M6 proves it is live rather than dead, but no real kit text has ever tripped it. Whoever revisits the profile should decide whether an arm with no attested instance earns its place, and decide it as a judgement rather than by deleting it to tidy the output.
- **`agent-factory/seed/plans/board.md:64` still carries retired relay vocabulary.** The sixth occurrence, named here, owned by plan 29-12.
- **The three lowercase workflow display names remain untouched** — 29-10's residual, unchanged; it is a change to a derived set rather than a prose edit.
- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is still not seen.** 29-03's recorded residual, unchanged, and structurally moot for this part because it has no `## Steps` sections at all.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here across all 16 walked files and reports 0 failures; nothing in the build would have caught a failure.
- **`security-nfr.md` is still 101 bytes above its advisory WARN tier.** 29-07's residual, untouched; plan 29-13 owns the re-baseline.
- **The seed templates and the contracts remain unrewritten** — 13 `guard_sentence_form` findings, all `bare-demonstrative-subject`, split 7 seed and 6 contracts, which is why the gate still exits 1. That is 29-12's work.
- **`mark anything unverified \`UNKNOWN - verify\`` remains a pre-existing WP-10 repetition across three role `## Hard limits`.** Not surfaced by this plan's diff and not owned by it; carried forward unchanged from 29-10.

## Threat Flags

None beyond the plan's own register. Zero packages installed, no network path and no write path added.

- **T-29-63 (generated OWASP checklist) — asserted, not assumed.** `git diff --name-only` over that path returns nothing across both commits; `GENERATED_EXEMPT` still derives exactly it against a two-sided count of 1; and the marker-exclusion confirmation is **recorded in the register** rather than inferred from the file's absence.
- **T-29-64 (a DoD item requiring a deleted artifact) — mitigated and measured.** Corrected to the obligation that holds, re-narrated onto the shared verified context flow rather than noun-swapped, and verified by a Node walk finding zero remaining occurrences over 16 files and 122,178 bytes.
- **T-29-65 (corpus growth by stealth) — mitigated.** The two out-of-corpus files received one noun phrase each; `GOVERNED_CORPUS_COUNT` is still 47; both diffs are vocabulary-only with no sentence split or reshaped.
- **T-29-66 (over-reaching the vocabulary correction) — mitigated.** `scripts/dead-vocabulary.ts` is byte-unchanged, no new literal was declared, no execution-topology text was deleted, and `check-public-docs` and `check-kit-refs` — the two sibling gates over the same one authority — both exit 0.
- **T-29-67 (silently skipping the historical occurrence) — closed by a named record.** `agent-factory/packaging/subagent.frontmatter.md:204` is recorded with file, line, verbatim text and reason, and the file is absent from the diff.
- **T-29-68 (reshaping acceptance items into steps) — mitigated and measured.** Decided by section anchor exactly as the guard decides; per-section bullet counts published above and equal in **13 of 13** files; not one bullet added, removed or moved between sections.
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed; `git diff -- package.json` is empty.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-11.md
```

Commits claimed, verified in `git log`:

```
FOUND: 85e07ea  refactor(29-11): the thirteen hand-authored checklists onto the writing profile
FOUND: 4cc8bc4  fix(29-11): four kit files stop naming a relay this project deleted two milestones ago
```
