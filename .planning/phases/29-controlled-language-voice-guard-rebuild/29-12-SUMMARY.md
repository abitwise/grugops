---
phase: 29-controlled-language-voice-guard-rebuild
plan: 12
subsystem: docs
tags: [kit-prose, seed-templates, contracts, controlled-language, derived-technical-names, retired-vocabulary, safety-partition, segmentation-artifact, dispositions, byte-growth, corpus-closeout]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 style contract every row cites, and the § Governed surfaces table that states the build-time/runtime split"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 03
    provides: "guard_imperative_lexicon and guard_sentence_form, the 47-file four-part corpus, and TECHNICAL_NAMES derived from the board columns and the note kinds this plan edits around"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, the seven-column register contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 10
    provides: "the measure-a-no-op-with-the-same-rigour pattern and the generate-rows-from-the-gate's-own-derivation pattern"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 11
    provides: "the empty-denominator distinction, the refuse-the-`it`-swap bar, and the named sixth D-46 occurrence this plan closes"
provides:
  - "THE GOVERNED CORPUS CLOSES — `node scripts/check-imperative-lexicon.js` exits 0 for the first time: guard_sentence_form PASSES at 0 findings over 2166/2166 elements, and guard_imperative_lexicon holds its 0 over 139/139"
  - "all thirteen shipped seed templates and both contracts conforming, with every derived Technical Name byte-identical — TECHNICAL_NAMES unmoved at 76, the thirteen board columns and the six note kinds untouched"
  - "the recorded finding that guard_imperative_lexicon's zero over BOTH of these parts is an EMPTY DENOMINATOR — no seed template and neither contract carries a `## Steps` heading, so all 139 bullets in the corpus figure are workflows'"
  - "the recorded finding that context-note.md:35's WP-06 hit was a PER-LINE SEGMENTATION ARTIFACT on a relative pronoun, not a prose defect — predicate untouched, limitation left open as a residual"
  - "agent-factory/seed/plans/board.md no longer ships an entry criterion requiring an artifact Phase 24 deleted — the sixth and last D-46 occurrence, closing 29-11's arithmetic"
  - "docs/audit/29-style-dispositions/29-12.md — 30 rows covering all 59 derived clauses across the fifteen files, 0 silently skipped"
  - "the two part byte costs: seed 14,205 → 14,285 (+80 B, +0.56%) and contracts 15,185 → 15,256 (+71 B, +0.47%)"
affects: [29-13]

actuals:
  tokens: 79000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A guard finding that is a FALSE POSITIVE gets recorded as one and fixed on independent grounds — never by widening the predicate and never by re-wrapping the line so the fragment head moves out of its reach"
    - "Before writing a register row, check that no cell contains a pipe: readDispositionRows() splits on `|` and SILENTLY SKIPS any row whose cell count is not seven, so an escaped-pipe cell publishes a row nothing reads"
    - "A green check:diff-disposition is not proof a plan's edits were dispositioned when none of its files is in the watched corpus — coverage is proven by re-implementing rowMatches(), and the distinction is stated"
    - "A derivation input inside a prose file is edited by CELL POSITION: boardColumns() and tableFirstCellsUnderHeading() read the FIRST cell, so a second-cell correction is provably out of the derived set's reach"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-12.md
  modified:
    - agent-factory/seed/memory-bank/00-index.md
    - agent-factory/seed/memory-bank/50-decisions/ADR-template.md
    - agent-factory/seed/memory-bank/60-progress.md
    - agent-factory/seed/plans/board.md
    - agent-factory/seed/plans/metrics.md
    - agent-factory/seed/plans/nfr-catalog.md
    - agent-factory/seed/plans/traceability.md
    - agent-factory/contracts/context-note.md
    - agent-factory/contracts/task-notes.template.md

key-decisions:
  - "guard_imperative_lexicon's ZERO over the seed templates AND the contracts is recorded as an EMPTY DENOMINATOR rather than reported as a pass. Neither part carries a single `## Steps` heading, so deriveElements() derives no bullet from either and the predicate never runs over them; all 139 bullets in the corpus figure are workflows'. This is 29-11's finding reproduced independently on two more parts, and it means the imperative predicate has NEVER run over three of the corpus's four parts"
  - "context-note.md:35's WP-06 finding was a PER-LINE SEGMENTATION ARTIFACT and is recorded as one. The `that` is a relative pronoun in the middle of a correct 21-word sentence; deriveElements() segments per source LINE, so the wrapped continuation became a fragment of its own. Widening the predicate was refused outright, and re-wrapping the line to move `that` off a fragment head was refused as the same shape as the `it` swap. The sentence was split on independent grounds and the predicate's limitation is left OPEN as a residual"
  - "The `it` swap clears all thirteen findings instantly and was refused thirteen times. `it` is outside the closed DEMONSTRATIVES set the predicate enumerates, so the swap moves text out of the predicate's reach while leaving the unresolvable subject in place. Seventeen refusals across 29-11 and 29-12 now"
  - "The board's thirteen column names and the six note kinds are byte-identical. Both are derived Technical Names sources, and both derivations read the FIRST table cell — boardColumns() and tableFirstCellsUnderHeading() — so the second-cell D-46 correction is provably out of their reach. TECHNICAL_NAMES is 76 on both sides"
  - "board.md:64's entry criterion was RE-NARRATED, not noun-swapped. `handoffs complete, ticket sized` became `analysis and design recorded as typed notes per Workflow 16, ticket sized`, using the kit's own existing spelling from 02-idea-to-epics.md, 03-epic-to-tickets.md and 00-bootstrap-greenfield.md rather than minting a second spelling for the same flow"
  - "board.md:25 adopted `Example row shape (this is a comment, …)` — the spelling nfr-catalog.md:16 and traceability.md:12 already use verbatim — rather than re-wrapping the line to hide the fragment head. The antecedent is now inside the sentence, which is what WP-06 actually asks for"
  - "Neither contract states or implies that the build-time gate governs runtime-written notes, so NO sentence was added to either. Both were read in full for such a claim; a correction with nothing to correct is a claim of its own. The measurement is recorded rather than left silent"
  - "The safety partition for both contracts was written and committed in the same commit as the edits. context-note.md's Set A has ELEVEN members and every one is byte-unchanged — including the entire admission paragraph and the no-fabrication floor clause itself. Set B is four subject noun phrases"
  - "scripts/dead-vocabulary.ts is byte-unchanged, no new literal was declared, and `git diff -- scripts/ package.json` is EMPTY for the whole plan"

patterns-established:
  - "Record a guard finding that is a false positive AS a false positive, fix the prose on independent grounds, and leave the predicate's limitation open — a green gate that was reached by tuning is worth less than a red one that was understood"
  - "Check a register row for pipes before writing it: a seven-column table that splits on `|` silently drops any row carrying an escaped pipe, so the row reads as work done and is read by nothing"

requirements-completed: []

coverage:
  - id: D1
    description: "All thirteen shipped seed templates and both contracts carry the profile, and the governed corpus reports zero findings over its full visited denominator (LANG-02, LANG-04, D-18, D-24 of Phase 28)"
    requirement: "LANG-02"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js EXITS 0 for the first time. `guard_sentence_form` PASSES at `0 findings over 2166/2166 elements`, down from the 264-over-1,816 it was watched failing at in the 29-03 RED transcript; `guard_imperative_lexicon` holds `0 findings over 139/139`. LANG-02 and LANG-01 both PASS"
        status: pass
      - kind: integration
        ref: "the two parts opened at THIRTEEN findings — 7 seed, 6 contracts, every one `bare-demonstrative-subject` — and close at zero. The corpus arithmetic closes exactly: 13 − 13 = 0, and the sentence denominator moved 2,165 → 2,166, a RISE of exactly this plan's own single deliberate split"
        status: pass
      - kind: other
        ref: "the 13 findings measured at this plan's start ARE the 29-03 RED-transcript state for these parts: all 15 files are byte-identical from the phase base 4d2b8f0 to the 29-11 tree b9c18a2 (15 of 15, by Node string equality against `git show`), so no earlier plan moved them"
        status: pass
      - kind: other
        ref: "eight hermetic mutations against the COMMITTED tree each red the NAMED arm at the NAMED file and line; M0 control clean, post-restore control clean, every mutation asserted applied and every restore byte-identical, `git diff -- agent-factory docs scripts` empty afterwards"
        status: pass
    human_judgment: false
  - id: D2
    description: "guard_imperative_lexicon's zero over these two parts is an EMPTY DENOMINATOR and is reported as one, never as a pass"
    verification:
      - kind: integration
        ref: "`grep -rn '^## Steps' agent-factory/seed agent-factory/contracts` returns NOTHING, and a Node walk mirroring deriveElements() and reusing the same fencedLineFlags() authority derives `stepBullets=0` for all 15 files. All 139 bullets in the corpus figure are workflows'"
        status: pass
      - kind: other
        ref: "recorded in the register and in this summary in those terms. With 29-11's checklists finding, the imperative predicate has now been measured as never having run over THREE of the corpus's four parts"
        status: pass
    human_judgment: false
  - id: D3
    description: "No derived Technical Name moved and the verify-before-write seam is untouched (D-13, D-17, D-40, T-29-69, T-29-71)"
    verification:
      - kind: integration
        ref: "`TECHNICAL_NAMES.length` is 76 on both sides, read through `import()`. The derived board column set is byte-identical — `[\"Backlog\",\"Ready\",\"In Analysis\",\"In Design\",\"Ready for Dev\",\"In Development\",\"In Review\",\"In Security/NFR\",\"Ready for UAT\",\"In UAT\",\"Ready to Release\",\"Done\",\"Blocked\"]` — as is the note-kind set `[\"claim\",\"finding\",\"decision\",\"failed-attempt\",\"observation\",\"artifact-ref\"]`"
        status: pass
      - kind: other
        ref: "exactly one board table row appears in `git diff -- agent-factory/seed/plans/board.md`, and its FIRST cell is `Ready for Dev` on both sides. boardColumns() and tableFirstCellsUnderHeading() both read the first cell only, so a second-cell edit is out of the derivation's reach by construction rather than by luck"
        status: pass
      - kind: integration
        ref: "`git diff --name-only -- scripts/context-io.ts` returns NOTHING and `git diff -- scripts/ package.json` is EMPTY for the whole plan. The admission paragraph — refuse-self FAIL set, live-GREEN gate cross-check, PER-CALL PreToolUse admission-guard hook, FRESH-per-call session variable, FINAL-structured-arguments reading, session-scoped grant, GOV-02 ledger sentence — is byte-unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "The safety-bearing contract text was partitioned and judged sentence by sentence (LANG-03, D-02)"
    requirement: "LANG-03"
    verification:
      - kind: other
        ref: "the eleven-row context-note.md and seven-member task-notes.template.md Set A tables in docs/audit/29-style-dispositions/29-12.md were written and committed in the SAME commit as the edits. ALL ELEVEN Set A members are byte-unchanged, including the whole admission paragraph and the no-fabrication floor clause `an unstamped note cannot enter the verified context`. Set B is four subject noun phrases in one file and two in the other"
        status: pass
      - kind: integration
        ref: "npm run check:diff-disposition exits 0 — `0 findings over 1880/1880 elements`, 1,532 rows across 8 files"
        status: pass
      - kind: other
        ref: "NONE of this plan's fifteen files is in the watched corpus, so that green run is NOT the proof. Coverage was proven by re-implementing the gate's own rowMatches() and changedClauses() over this register: 59 derived clauses across all fifteen files, 0 uncovered, 30 rows read, 0 silently skipped"
        status: pass
      - kind: other
        ref: "the register proves every changed clause was dispositioned and nothing about any disposition's substance; the LANG-03 check is a named human reading the 30 rows against the diff"
        status: pass
    human_judgment: true
  - id: D5
    description: "The shipped board template no longer carries an entry criterion naming a deleted artifact, and the correction did not over-reach (LANG-03, D-46, T-29-70)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "a NODE WALK over `agent-factory/seed/` and `agent-factory/contracts/` — 21 files, 31,005 bytes, `readFileSync` + `String.includes` over seven needles including all three `dead-vocabulary.ts` literals — finds ZERO occurrences. Named as the method because a bare recursive grep reports zero on a binary-classified file with no warning. Every file also round-trips UTF-8 byte-identically (0 failures)"
        status: pass
      - kind: other
        ref: "the replacement was re-narrated onto the kit's own existing `recorded as typed notes per Workflow 16` spelling — the form 02-idea-to-epics.md, 03-epic-to-tickets.md and 00-bootstrap-greenfield.md already use — rather than noun-swapped, so no second spelling was minted (WP-09). 12 words against the 25-word bound, in the same lowercase noun-phrase form as its twelve neighbouring criteria"
        status: pass
      - kind: other
        ref: "`scripts/dead-vocabulary.ts` is byte-unchanged, no new literal was declared, and its boundary warning was obeyed — no execution-topology text was deleted anywhere. `node scripts/check-kit-refs.js` and `npm run check:public-docs` both exit 0"
        status: pass
      - kind: other
        ref: "mutation M4 proves the WP-03 length bound reaches the NEW criterion text: a 26-word variant reds `descriptive-sentence-too-long` at `board.md:64` against bound 25"
        status: pass
    human_judgment: false
  - id: D6
    description: "The build-time versus runtime surface split is stated rather than implied (LANG-02, D-16, T-29-72)"
    verification:
      - kind: other
        ref: "both contracts were read IN FULL for a claim that the build-time gate governs runtime-written notes and NEITHER makes one — context-note.md speaks only of the runtime validator `scripts/context-io.ts`, task-notes.template.md only of the render function and the freshness:context drift gate. NO sentence was added to either, because a correction with nothing to correct is a claim of its own"
        status: pass
      - kind: other
        ref: "the split is stated where D-16 puts it — agent-factory/writing-profile.md § Governed surfaces already marks `contracts` as build-time gate and the runtime-written notes and board/traceability rows as instruction via agent-factory/workflows/16-context-read-write.md. That file is byte-unchanged by this plan"
        status: pass
      - kind: other
        ref: "recorded as a measurement rather than left silent, on 29-10's precedent for a reconciliation that turned out to be a no-op"
        status: pass
    human_judgment: false
  - id: D7
    description: "Placeholders are provably still placeholders and the corpus did not grow by stealth (D-36, T-29-74)"
    verification:
      - kind: other
        ref: "every per-file sentence denominator is EQUAL before and after in all thirteen seed templates (part total 350 → 350), by a Node walk mirroring deriveElements() and reusing the same fencedLineFlags() authority. Six of thirteen seed templates are byte-unchanged entirely"
        status: pass
      - kind: integration
        ref: "GOVERNED_CORPUS_COUNT still 47 in four parts; APPROVED_STEP_VERBS still 43 — no verb was added; GENERATED_EXEMPT still 1. `git diff -- scripts/ package.json` is EMPTY"
        status: pass
      - kind: other
        ref: "non-batch governed members byte-identical to the 29-11 tree: 32 of 32, by Node string equality of readFileSync against `git show b9c18a2:<path>`"
        status: pass
    human_judgment: false
  - id: D8
    description: "Byte growth is measured and recorded per file rather than assumed (D-28)"
    verification:
      - kind: other
        ref: "fifteen-row growth table below, every value from `Buffer.byteLength` of the working-tree text against `Buffer.byteLength(git show 4d2b8f0:<path>)`. Seed part 14,205 → 14,285 (+80 B, +0.56%) and contracts 15,185 → 15,256 (+71 B, +0.47%) — BOTH plan-stated baselines reproduce EXACTLY"
        status: pass
      - kind: other
        ref: "the mechanism is NOT sentence splitting: the seed denominator is unmoved at 350 and the contracts moved by ONE. 151 bytes bought 13 head nouns, one re-narrated board criterion (+42 B of the board's +55) and one sentence split. One file SHRANK — 60-progress.md by 7 B, because an actor-subject re-narration is shorter than the copula it replaced"
        status: pass
    human_judgment: false
  - id: D9
    description: "Every repo gate and the regression lane are green, and the gate wall clocks and the two state-file numbers are re-measured"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped: identical to the 29-05 … 29-11 baseline"
        status: pass
      - kind: integration
        ref: "imperative-lexicon 0 (FIRST exit 0) · diff-disposition 0 · foundation-guards 0 · banned-claims 0 · nul-bytes 0 · kit-refs 0 · public-docs 0 · freshness:context 0 · validate-agent-factory 0 · typecheck 0 · freshness 0 at 48 pairs · freshness:catalog 0"
        status: pass
      - kind: other
        ref: "imperative-lexicon 0.08 / 0.07 / 0.07 s; diff-disposition 0.74 / 0.70 / 0.71 s (29-11 0.70 / 0.69 / 0.69 — the register grew 1,516 → 1,532 rows); foundation guards 0.13 / 0.12 / 0.12 s. `.planning/STATE.md` longest line 7,966 (§F-2 baseline 7,994, below it) and longest backslash run 1 over 11 total (baseline 1, unmoved)"
        status: pass
    human_judgment: false

duration: 71min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 12: The Thirteen Seed Templates and Both Contracts Summary

**The governed corpus closes. `node scripts/check-imperative-lexicon.js` exits 0 for the first time since it was written: `guard_sentence_form` PASSES at 0 findings over 2166/2166 elements, down from the 264-over-1,816 it was watched failing at on the real tree, and `guard_imperative_lexicon` holds its 0 over 139/139. Both new predicates go green having been watched failing first, which is what D-18 and Phase 28's D-24 asked for. Two findings in this batch are worth more than the eleven routine ones: `guard_imperative_lexicon`'s zero over BOTH of these parts is an EMPTY DENOMINATOR — neither part carries a single `## Steps` heading, so with 29-11's checklists the predicate has now been measured as never having run over three of the corpus's four parts. And one of the thirteen findings was a FALSE POSITIVE: `context-note.md:35` reported a bare demonstrative subject on a relative pronoun in the middle of a correct sentence, because the predicate segments per source LINE. Widening it was refused, re-wrapping the line to hide the fragment head was refused, the sentence was split on independent grounds, and the predicate's limitation is left OPEN as a residual rather than buried under the green it would otherwise have produced. The shipped board template also stops requiring an artifact this project deleted two milestones ago — the sixth and last D-46 occurrence, which closes 29-11's arithmetic.**

## Performance

- **Duration:** 71 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 10 (1 created, 9 modified)

## The gate, before and after

```
[guard_imperative_lexicon] …
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2;
        1 excluded by the derived `GENERATED` marker
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  PASS  imperative lexicon: 0 findings over 139/139 elements

[guard_sentence_form] …
        2166 sentence(s) — 414 procedural, 1752 descriptive; by finding kind: none
  PASS  sentence form: 0 findings over 2166/2166 elements

  PASS  LANG-02: 47 governed document(s) in 4 derived part(s) … 47 of 47 opened
  PASS  LANG-01: 76 Technical Name(s) DERIVED from the kit, never listed
                 — roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6, boardColumns 13

== Result ==  ALL CHECKS PASSED       (exit 0)
```

## The complete corpus close-out

| point | `guard_imperative_lexicon` | `guard_sentence_form` | corpus bullets | corpus sentences | 47-file bytes |
|---|---|---|---:|---:|---:|
| `4d2b8f0` — phase base, the RED transcript | **81 / 125** | **264 / 1,816** | 125 | 1,816 | 152,806 |
| after 29-08 | 46 / 139 | 194 / 1,934 | 139 | 1,934 | — |
| after 29-09 | 30 / 139 | 113 / 2,035 | 139 | 2,035 | — |
| after 29-10 — the workflow track closes | **0 / 139** | 17 / 2,165 | 139 | 2,165 | — |
| after 29-11 — the checklists track closes | 0 / 139 | 13 / 2,165 | 139 | 2,165 | — |
| **after 29-12 — the corpus closes** | **0 / 139** | **0 / 2,166** | **139** | **2,166** | **154,651** |

**No visited denominator ever FELL across the whole phase.** The bullet denominator rose once (125 → 139 in 29-08) and has been constant at 139 since. The sentence denominator rose monotonically — 1,816 → 1,934 → 2,035 → 2,165 → 2,165 → **2,166** — which is the opposite of the scan-narrowing failure mode: more elements scanned every time, and all of them now clean.

**The whole governed corpus grew 152,806 → 154,651 bytes: +1,845 B, +1.21%**, across all four parts and all seven content plans. Measured by `Buffer.byteLength` of the working tree against `Buffer.byteLength(git show 4d2b8f0:<path>)`, over the gate's own `GOVERNED_CORPUS_PARTS` membership.

**The corpus-wide zero is reported because it was OBSERVED, not assembled.** 29-11 landed before this plan ran (`b9c18a2`), its 13-finding hand-off reproduced exactly, and the single gate invocation above visits all 47 files in one pass.

## The finding movement, with the denominators beside it

Findings from `node scripts/check-imperative-lexicon.js`; denominators from a Node walk mirroring the gate's own `deriveElements()` anchoring and reusing the same `fencedLineFlags()` authority, cross-checked against the gate's printed corpus totals on both sides.

| file | `guard_imperative_lexicon` | `guard_sentence_form` | `## Steps` bullets | sentences visited |
|---|---|---|---:|---:|
| `00-index.md` | — | 1 → **0** | 0 → 0 | 36 → 36 |
| `10-project-brief.md` | — | 0 → **0** | 0 → 0 | 8 → 8 |
| `20-product.md` | — | 0 → **0** | 0 → 0 | 8 → 8 |
| `30-architecture.md` | — | 0 → **0** | 0 → 0 | 10 → 10 |
| `40-contributing.md` | — | 0 → **0** | 0 → 0 | 8 → 8 |
| `ADR-template.md` | — | 1 → **0** | 0 → 0 | 13 → 13 |
| `60-progress.md` | — | 1 → **0** | 0 → 0 | 10 → 10 |
| `70-runbook.md` | — | 0 → **0** | 0 → 0 | 10 → 10 |
| `80-glossary.md` | — | 0 → **0** | 0 → 0 | 10 → 10 |
| `board.md` | — | 1 → **0** | 0 → 0 | 131 → 131 |
| `metrics.md` | — | 1 → **0** | 0 → 0 | 35 → 35 |
| `nfr-catalog.md` | — | 1 → **0** | 0 → 0 | 25 → 25 |
| `traceability.md` | — | 1 → **0** | 0 → 0 | 46 → 46 |
| **seed part** | **— (no elements)** | **7 → 0** | **0 → 0** | **350 → 350** |
| `context-note.md` | — | 4 → **0** | 0 → 0 | 187 → **188** |
| `task-notes.template.md` | — | 2 → **0** | 0 → 0 | 67 → 67 |
| **contracts part** | **— (no elements)** | **6 → 0** | **0 → 0** | **254 → 255** |
| **corpus** | **0 / 139 → 0 / 139** | **13 / 2,165 → 0 / 2,166** | **139 → 139** | **2,165 → 2,166** |

**Exactly one denominator moved anywhere in this plan**, and it is the deliberate sentence split at `context-note.md:34` described below. The corpus delta (+1) equals this batch's delta exactly, so the other thirty-two governed members contributed nothing.

### The `guard_imperative_lexicon` column is a dash on every row, and that is a finding

The imperative column is **not zero — it is empty**, in **all fifteen files**. `grep -rn '^## Steps' agent-factory/seed agent-factory/contracts` returns **nothing**, and the Node walk derives `stepBullets=0` for every one. `deriveElements()` derives no bullet from either part, so the predicate never runs over them.

Recorded rather than reported as a pass, for 29-11's reason: a predicate reporting zero over zero elements has stated a check it did not perform. **With 29-11's checklists, the imperative predicate has now been measured as never having run over THREE of the corpus's four parts.** All 139 bullets in its corpus figure are workflows'. That is not a defect in the gate — `## Steps` is the honest surface and the gate's own source argues why — but it is a fact about what "0 over 139" covers, and a later reader should meet it as one.

The honest reading of the plan's acceptance criterion for these parts is therefore **zero `guard_sentence_form` findings over 350 seed sentences and 255 contract sentences, and no imperative denominator at all.**

### What the thirteen were

| finding kind | count | where |
|---|---:|---|
| `bare-demonstrative-subject` (WP-06) | **13** | seed 7, contracts 6 |
| `descriptive-sentence-too-long` (WP-03) | **0** | none — no sentence in either part exceeds 25 words |
| `procedural-sentence-too-long` (WP-02) | **0** | none — there are no procedural sentences in either part |
| every other arm | **0** | none |

The plan's Task 1 action anticipates the full conversion catalogue — canonical step form, bold-label stripping, modal removal, chained-imperative splitting. **Not one of those arms had a single finding here**, for the same structural reason 29-11 found in the checklists: with no `## Steps` heading there is no procedural text, so WP-01, WP-02, WP-05 and WP-08 have no subject in this corpus at all.

## The finding that was NOT a defect — and the two fixes that were refused

`context-note.md:35` reported `WP-06 [bare-demonstrative-subject]` on `"that is not already in \`notes/\`."`

**That `that` is a relative pronoun in the middle of a correct sentence.** The real sentence read:

> `index.md` and `index.jsonl` are derived, byte-reproducible renders of the `notes/` frontmatter and carry no information that is not already in `notes/`.

21 words, inside the 25-word bound, with no demonstrative subject anywhere in it.

**The cause is in the gate's own source.** `deriveElements()` segments per source LINE — `chunk.split(SENTENCE_SPLIT)` runs over one line at a time — so a sentence that wraps is cut at the line break and the continuation becomes a fragment of its own. A fragment beginning `that is` then matches the WP-06 arm even though its antecedent sits on the previous line inside the same real sentence. The same mechanism explains why several of the thirteen were reported truncated (`"This is the file roles"`, `"This is the no-fabrication floor: an"`).

**Two fixes were available and both were refused:**

1. **Widening the predicate** to join wrapped lines before segmenting. Refused outright. This is the plan that takes the last predicate in the corpus to zero, which makes tuning it to fit the prose maximally tempting and maximally wrong.
2. **Re-wrapping the line** so `that` no longer lands at a fragment head. Refused. The bytes of the sentence would be unchanged and only its line breaks would move — clearing a finding by moving text out of the predicate's reach, which is the same shape as the `it` swap this phase has now refused seventeen times.

**What was done instead:** the sentence was split into two on independent grounds — it chains two predicates (`are … renders` and `carry no information`) onto one subject. The split removes the artifact as a **consequence** rather than as its purpose, and it is the only change in this plan that moves a denominator.

**The limitation is left OPEN.** A green `guard_sentence_form` does not mean no wrapped sentence in the corpus can produce this artifact again; it means none currently does. It is recorded in the register and in the residuals below so whoever revisits WP-06 meets it as a judgement with a worked example, rather than discovering it when the next wrapped relative clause reds a plan that has nothing wrong with it.

## The thirteen corrections, and the swap that was available on every one

`guard_sentence_form`'s remedy for this arm reads *"name the antecedent"*, and the gate's own source states what it decides: *"`This is the drift` is a bare demonstrative subject, while `This workflow runs at release` is a demonstrative DETERMINER modifying a noun and is correct."*

| file:line | before | after |
|---|---|---|
| `00-index.md:10` | `This is the project's persistent working memory.` | `This bank is the project's persistent working memory.` |
| `ADR-template.md:9` | `This is the copy-target for an architecture decision record.` | `This template is the copy-target for an architecture decision record.` |
| `60-progress.md:8` | `This is the file roles check to learn the current state of the work.` | `Roles check this file to learn the current state of the work.` |
| `board.md:25` | `… as work moves, e.g. (this is a comment, NOT a live row — …)` | `… as work moves. Example row shape (this is a comment, NOT a live row — …)` |
| `metrics.md:7` | `This is grugops's delivery metric tracker.` | `This file is grugops's delivery metric tracker.` |
| `nfr-catalog.md:7` | `This is the single list of non-functional targets …` | `This catalog is the single list of non-functional targets …` |
| `traceability.md:7` | `This is the single requirement -> … matrix for grugops.` | `This file is the single requirement -> … matrix for grugops.` |
| `context-note.md:21` | `This is the same CommonMark + frontmatter shape every role, workflow, and skill file already uses.` | `Every role, workflow, and skill file already uses the same CommonMark + frontmatter shape.` |
| `context-note.md:35` | the relative-clause artifact | the sentence split — above |
| `context-note.md:95` | `This is the no-fabrication floor: an unstamped note …` | `The required-field rule is the no-fabrication floor: an unstamped note …` |
| `context-note.md:141` | `These are two unrelated concepts that happen to share the word "claim".` | `The \`claim\` note-KIND and the queue CLAIM are two unrelated concepts that happen to share the word "claim".` |
| `task-notes.template.md:20` | `This is what lets the \`freshness:context\` drift gate …` | `That reproducibility is what lets the \`freshness:context\` drift gate …` |
| `task-notes.template.md:67` | `This is the at-a-glance answer to …` | `That section is the at-a-glance answer to …` |

**Every head noun comes from the document's own existing vocabulary** (WP-09): `bank` from `00-index.md`'s own `read before you fill this bank`; `template` from `ADR-template.md`'s own `this template ships with NO example values`; `catalog` from `# NFR Catalog`; `The required-field rule` from the section heading `### Required-field rule (the validator contract)`; `That reproducibility` from the bullet's own **Byte-reproducible** label; `That section` from the item's own **A current-state section** label. Nothing was minted.

**Two copular forms were rejected for repeating their own predicate's head noun** — `This tracker is … delivery metric tracker` and `This matrix is … release matrix` — and took `This file` instead. **Two were re-narrated onto an actor or a named pair** rather than given a determiner: `60-progress.md` because its neighbours already use the actor voice, and `context-note.md:141` because a section titled CRITICAL DISTINCTION should not open with a subject a reader cannot resolve.

**`board.md:25` is the one that could most easily have been gamed.** The `e.g.` in front of it is what made the parenthetical a fragment head. Re-wrapping the line was available; instead it took the spelling `nfr-catalog.md:16` and `traceability.md:12` **already use verbatim** — `Example row shape (this is a comment, …)` — so no third spelling was minted and the antecedent now sits inside the sentence, which is what WP-06 actually asks for.

**The refusal, stated because it was available thirteen times.** Swapping the demonstrative for `it` clears every one of these instantly: `it` is not a member of `DEMONSTRATIVES`, the closed token set the predicate enumerates. **It was not taken once.** With 29-11's four, that is seventeen refusals.

## The derived Technical Names, held byte-identical

Two of these fifteen files are derivation inputs for the guard's own vocabulary, so a name reworded here for style would change what the guard reads as a Technical Name as a side effect of a style edit.

| derivation | source | result |
|---|---|---|
| board columns (13) | the table under `\| Column \| Entry means \| Exit owner \| WIP (default) \|` | **byte-identical** — `["Backlog","Ready","In Analysis","In Design","Ready for Dev","In Development","In Review","In Security/NFR","Ready for UAT","In UAT","Ready to Release","Done","Blocked"]` |
| note kinds (6) | the table under `## The six note kinds` | **byte-identical** — `["claim","finding","decision","failed-attempt","observation","artifact-ref"]` |
| **`TECHNICAL_NAMES.length`** | the five derived parts | **76 → 76** |

**The protection is structural, not careful.** `boardColumns()` and `tableFirstCellsUnderHeading()` both read the **first** cell of each row (`firstCell(lines[i])`) and stop at the first non-table line. The D-46 correction changes a **second** cell, so it is out of the derivation's reach by construction. `git diff -- agent-factory/seed/plans/board.md` shows exactly one table row, with `Ready for Dev` identical on both sides.

## D-46 — the sixth and last occurrence

| field | value |
|---|---|
| file:line | `agent-factory/seed/plans/board.md:64` |
| before | `\| Ready for Dev \| handoffs complete, ticket sized \| Orchestrator \| 6 \|` |
| after | `\| Ready for Dev \| analysis and design recorded as typed notes per Workflow 16, ticket sized \| Orchestrator \| 6 \|` |

**This one matters more than the other five, because the file is a SHIPPED TEMPLATE.** Every project bootstrapped from grugops inherited a board whose `Ready for Dev` column could be entered only by producing an artifact Phase 24 deleted — a gate nobody could pass honestly.

**Why it survived two audits is structural rather than accidental.** `scripts/check-kit-refs.ts` **deliberately excludes `agent-factory/seed/`**, and its own source states the reason: the bundled seed files are STATE TEMPLATES whose references resolve in the TARGET repo, not against the kit root (the D-03 exclusion). The Phase 28 vocabulary audit covered the roles and the workflows, and this is neither. And none of `dead-vocabulary.ts`'s three literals matches the bare plural `handoffs`.

**The replacement was re-narrated, not noun-swapped.** `agent-factory/workflows/03-epic-to-tickets.md` already reads *"Record the clarified behavior as typed notes per Workflow 16 — the `In Analysis` exit"*, and `02-idea-to-epics.md` and `00-bootstrap-greenfield.md` use the same `recorded as typed notes per Workflow 16` spelling. It is a lowercase noun phrase in the same form as its twelve neighbouring criteria and 12 words against the 25-word bound.

### The Node walk that proves zero, with its method named

```
needles=7  files=21  bytes=31005  retiredVocabOccurrences=0  utf8RoundTripFailures=0
```

`readFileSync` + `String.includes` over seven needles — `handoff`, `handoffs`, `Handoff`, `HANDOFF`, and all three `dead-vocabulary.ts` literals read through `import()` — across `agent-factory/seed/` and `agent-factory/contracts/`. **Named as the method because a bare recursive grep reports zero matches on a binary-classified file with no warning.** Every file also round-trips UTF-8 byte-identically, which is 29-05's `perl -pi -e` hazard checked rather than assumed; every edit here went through the structured editor and no byte-level tool was used.

**29-11's six-occurrence arithmetic now closes:** four corrected there, one named leave-alone at `packaging/subagent.frontmatter.md:204`, and this one.

## The contracts — the safety partition, written before either file was opened

Published in `docs/audit/29-style-dispositions/29-12.md`, committed in the same commit as the edits.

**`context-note.md` — Set A, eleven safety-bearing sentences. ALL ELEVEN are byte-unchanged.** The sanctioned-writer sentence and the never-by-any-other-path rule; the append-only rule; the nonce disclaimer (`not a security token` … `never be treated as a credential or capability token`); the authoritative-order rule; the structural-FAIL rule and `it never silently accepts an incomplete note`; **the no-fabrication floor clause itself** (`an unstamped note cannot enter the verified context`); **the entire admission paragraph** — refuse-self FAIL set, live-GREEN gate cross-check, PER-CALL PreToolUse `admission-guard` hook, FRESH-per-call session variable, FINAL-structured-arguments reading, session-scoped grant, GOV-02 ledger sentence, non-CC degradation; the `kind`-outside-the-set FAIL; the six-kind table and its heading; the `claim`-kind carve-out; and `They must never be blurred in a single sentence, a shared field, or a shared code path.`

**Set B is four subject noun phrases and nothing else.** The no-fabrication floor sentence changed **only its subject** — `This is` became `The required-field rule is`, and the floor it introduces is byte-identical.

**`task-notes.template.md` — Set A, seven members, all byte-unchanged**: the four determinism rules, the three escaping rules **in their stated order**, the injection-mitigation sentence, `It is never hand-edited.` and the fail-closed drift-gate sentence. **Set B is two subject noun phrases.**

**No production permission widened, no requirement was reworded or dropped, no modal entered a permission, and no clear-voice sentence acquired caveman voice.**

## D-17 — the write seam did not move

`git diff --name-only -- scripts/context-io.ts` returns **nothing**, and **`git diff -- scripts/ package.json` is EMPTY for the whole plan**. D-17 recorded that a runtime style check inside the sanctioned note-write path was considered and rejected; this plan conforms the prose *around* that seam and changes nothing about the seam itself.

## The build-time / runtime surface split — checked, and nothing to correct

D-16 requires the split to be stated rather than implied, and the plan asks whether either contract implies the build-time gate governs runtime-written notes.

**Both contracts were read in full for such a claim and neither makes one.** `context-note.md` speaks only of *the validator* — `scripts/context-io.ts`, which admits or rejects a note at run time — and never of a style gate. `task-notes.template.md` speaks only of the render function and the `freshness:context` drift gate, both of which act on artifacts that exist.

**No sentence was added to either contract, deliberately.** A correction with nothing to correct is a claim of its own. The split is stated where D-16 puts it: `agent-factory/writing-profile.md` § *Governed surfaces*, whose table already marks `contracts` as **build-time gate** and the runtime-written notes and board/traceability rows as **instruction, via `agent-factory/workflows/16-context-read-write.md`**. That file is byte-unchanged by this plan.

**Recorded as a measurement rather than left silent**, on 29-10's precedent: a check that turns out to be a no-op is exactly the one a later reader would suspect was never performed.

## The byte growth, per file, with its mechanism named

Every value from `Buffer.byteLength` of the working-tree text against `Buffer.byteLength(git show 4d2b8f0:<path>)`.

| file | before | after | delta | % |
|---|---:|---:|---:|---:|
| `00-index.md` | 1489 | 1494 | **+5** | +0.34% |
| `10-project-brief.md` | 400 | 400 | **0** | 0.00% |
| `20-product.md` | 364 | 364 | **0** | 0.00% |
| `30-architecture.md` | 484 | 484 | **0** | 0.00% |
| `40-contributing.md` | 412 | 412 | **0** | 0.00% |
| `ADR-template.md` | 713 | 722 | **+9** | +1.26% |
| `60-progress.md` | 429 | 422 | **−7** | **−1.63%** |
| `70-runbook.md` | 464 | 464 | **0** | 0.00% |
| `80-glossary.md` | 356 | 356 | **0** | 0.00% |
| `board.md` | 5169 | 5224 | **+55** | +1.06% |
| `metrics.md` | 1115 | 1120 | **+5** | +0.45% |
| `nfr-catalog.md` | 1135 | 1143 | **+8** | +0.70% |
| `traceability.md` | 1675 | 1680 | **+5** | +0.30% |
| **seed part total** | **14,205** | **14,285** | **+80** | **+0.56%** |
| `context-note.md` | 10937 | 10984 | **+47** | +0.43% |
| `task-notes.template.md` | 4248 | 4272 | **+24** | +0.56% |
| **contracts part total** | **15,185** | **15,256** | **+71** | **+0.47%** |
| **both parts** | **29,390** | **29,541** | **+151** | **+0.51%** |

**Both plan-stated baselines — 14,205 B and 15,185 B — reproduce EXACTLY**, unlike the workflow group's 104,094 figure that 29-10 falsified against the research's own command.

**The mechanism is NOT sentence splitting, and that is measurable rather than asserted.** The seed denominator is **350 on both sides** and the contracts moved by **one**. Of the 151 bytes:

- **42 B** are the board's D-46 criterion, which re-narrates onto the shared verified context and is longer for that reason alone.
- **13 B** are `board.md:25` adopting the siblings' `Example row shape` spelling.
- **~96 B** are twelve head nouns, 5 to 9 bytes each, and one sentence split.

**One file SHRANK.** `60-progress.md` lost 7 bytes: an actor-subject re-narration (`Roles check this file to learn …`) is shorter than the copular construction it replaced. **No byte ceiling exists for a seed template or a contract and none was added.**

## The untouched-part control, measured rather than assumed

| control | result | method |
|---|---|---|
| non-batch governed members byte-identical to the 29-11 tree | **32 of 32** | Node string equality of `readFileSync` against `git show b9c18a2:<path>` |
| my 15 files byte-identical from `4d2b8f0` to `b9c18a2` | **15 of 15** | same — so the 13 findings ARE the 29-03 RED state for these parts |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged | the gate's own `GOVERNED_CORPUS_PARTS` via `import()` |
| `TECHNICAL_NAMES.length` | **76**, unchanged | same |
| `APPROVED_STEP_VERBS.length` | **43**, unchanged — **no verb was added** | same |
| `GENERATED_EXEMPT` | **1**, unchanged | the derived `GENERATED` marker, two-sided pin |
| generated OWASP checklist in the diff | **absent** | `git diff --name-only` over that path returns nothing |
| `git diff -- scripts/ package.json` | **empty** | no predicate, no scan set, no dependency |
| files failing a UTF-8 round trip | **0** over 21 walked | `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` |

## Falsifiability — the guard still reds MY prose

**Eight mutations against the COMMITTED tree**, each asserted applied before the guard ran and each restored byte-identically after.

| mutation | file | expected arm | result |
|---|---|---|---|
| M0 — unmutated control | — | none | **0 findings corpus-wide** |
| M1 — the head noun removed | `00-index.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `00-index.md:10`** |
| M2 — the actor re-narration reverted | `60-progress.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `60-progress.md:8`** |
| M3 — the `e.g.` restored | `board.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `board.md:25`** |
| M4 — the NEW D-46 criterion extended past the bound | `board.md` | `WP-03 [descriptive-sentence-too-long]` | **1 hit at `board.md:64`, `26 words, bound 25`** |
| M5 — the floor's subject reverted | `context-note.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `context-note.md:95`** |
| M6 — the named pair removed | `context-note.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `context-note.md:141`** |
| M7 — the head noun removed | `task-notes.template.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `task-notes.template.md:67`** |
| M8 — the copular form restored | `context-note.md` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `context-note.md:21`** |

Every mutation reported `applied=true` and `restored=true`, the post-restore control is clean again, and `git diff -- agent-factory docs scripts` is **empty** afterwards. **No mutation required a predicate change to produce, and no predicate was touched to make any of them stop.**

**M4 is the one that matters most.** It proves the WP-03 length bound reaches the *new* board criterion this plan wrote — the text a bootstrapped project will inherit — rather than only the text that was already there.

## The disposition register

`docs/audit/29-style-dispositions/29-12.md` — **30 rows covering all 59 derived clauses** across the fifteen files, **0 rows silently skipped**, **0 rows carrying a companion cell** because zero changed clauses intersect the frozen set (verified: neither contract nor any seed file carries a `claim: C-` marker, and the frozen structural anchors are role `## Hard limits` and workflow `## Stop conditions` / `## Commit` only).

**Clauses were DERIVED and coverage was verified by re-implementing the gate's own `rowMatches()` and `changedClauses()`** — the same `git diff --unified=0` hunk parse, the same `segmentClauses()`, the same `normalizeSentence()`.

```
        37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s) derived;
        1532 disposition row(s) across 8 file(s)
  PASS  diff disposition: 0 findings over 1880/1880 elements
```

**NONE of this plan's fifteen files is in the watched corpus** — the 41-entry LANG-03 safety-surface union is 18 roles, 19 workflows and 4 public documents. The `37 watched file(s) changed` figure was already 37 at `HEAD` before this plan ran; **the delta from 29-11's recorded 36 belongs to 29-11's own second commit, not to this plan.** Rows were written for all fifteen files anyway, and the green run above is explicitly **not** the proof — the re-implementation is.

### A row with an escaped pipe is a row nothing reads

The first draft of the `board.md:64` row wrote the table row verbatim, with `\|` around each cell. `readDispositionRows()` splits on `|` and **silently skips any row whose cell count is not seven** — the row came out at **17 cells** and was dropped without a word. It was caught only because coverage was re-implemented rather than assumed from a green gate, and it is recorded here because the failure mode is invisible by design: the row is in the file, it reads as work done, and nothing reads it. The board row is now written with `·` separators, and the reason is stated in its own disposition cell.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 0 — the FIRST**. `guard_imperative_lexicon` 0/139, `guard_sentence_form` **0/2,166**, LANG-01 and LANG-02 both PASS |
| `npm run check:diff-disposition` | **exit 0** — `0 findings over 1880/1880 elements`, 1,532 rows across 8 files |
| `node scripts/check-foundation-guards.js` | **exit 0** — the role track stays closed at 17/17 |
| `npm run check:banned-claims` · `check-nul-bytes.js` · `check-kit-refs.js` · `check:public-docs` | all exit 0 |
| `npm run freshness:context` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npm run freshness:catalog` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05…29-11 baseline — unmoved) |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged |
| `TECHNICAL_NAMES.length` · `APPROVED_STEP_VERBS.length` · `GENERATED_EXEMPT.length` | **76** · **43** · **1**, all unchanged |
| `git diff 04780f7^ HEAD -- scripts/ package.json` | **empty** |
| imperative-lexicon wall clock, 3 runs | **0.08 / 0.07 / 0.07 s** (29-11 0.04 / 0.04 / 0.04) |
| diff-disposition wall clock, 3 runs | **0.74 / 0.70 / 0.71 s** (29-11 0.70 / 0.69 / 0.69 — the register grew 1,516 → 1,532 rows) |
| foundation-guards wall clock, 3 runs | **0.13 / 0.12 / 0.12 s** (29-11 0.09 / 0.09 / 0.09) |
| this batch's largest file | `context-note.md` 10,984 B |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — below it; 29-08 … 29-11 all measured 7,966) |
| `.planning/STATE.md` longest backslash run | **1** over 11 total backslashes (§F-2 baseline 1 — unmoved) |

The wall-clock rises against 29-11 are small absolute numbers on a warm-versus-cold process and are recorded as measured rather than smoothed; every figure is well inside the timing assertions the suite itself enforces (`countWords` over the 14 KB `05-pr-quality-gate.md` in **1 ms**, `segmentClauses` in **1 ms**).

## Counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method.

| count | value | method |
|---|---:|---|
| governed corpus files | **47** | the gate's own `GOVERNED_CORPUS_PARTS`, read through `import()` |
| seed templates · contracts | **13** · **2** | the same, by part |
| `## Steps` bullets in the seed and contract parts | **0** before and after | Node walk reusing `fencedLineFlags()`, cross-checked against the gate's printed corpus total of 139 across 19 files |
| sentences visited, before / after | **350 / 350** (seed) · **254 / 255** (contracts) · **2,165 / 2,166** (corpus) | same walk, same cross-check |
| non-batch governed members byte-identical | **32 of 32** | Node string equality of `readFileSync` against `git show b9c18a2:<path>` |
| my 15 files byte-identical `4d2b8f0` → `b9c18a2` | **15 of 15** | same |
| retired relay vocabulary in seed + contracts | **0** | Node walk, `readFileSync` + `String.includes`, 7 needles, 21 files, 31,005 bytes |
| files failing a UTF-8 round trip | **0** | `Buffer.compare` per file, over all 21 walked |
| disposition rows in `29-12.md` | **30** covering **59** derived clauses, **0** with a companion, **0** silently skipped | the gate's own seven-column row rule and `rowMatches()`, re-implemented over the file |
| seed-part bytes · contracts-part bytes | 14,205 → 14,285 · 15,185 → 15,256 | `Buffer.byteLength` vs `Buffer.byteLength(git show 4d2b8f0:…)` |
| whole governed corpus bytes | 152,806 → 154,651 | same, over `GOVERNED_CORPUS_PARTS` membership |

## Deviations from Plan

### 1. [Measured deviation] The plan sized this as a style rewrite; it is thirteen findings and six untouched files

- The plan's Task 1 action describes the full conversion catalogue and instructs that instructional prose "get the canonical step form where they sit under a `## Steps` section and the descriptive limit otherwise."
- **No seed template and neither contract carries a `## Steps` section**, so the first half of that instruction has no subject at all, and the descriptive limit was already met everywhere — **zero WP-03 findings in either part before this plan ran**.
- The measured opening state is **thirteen** findings, every one `bare-demonstrative-subject`. Six of the thirteen seed templates needed nothing and are byte-unchanged.
- The plan's own instruction — *"do not turn a placeholder into an imperative"* — is what makes the small number the correct outcome rather than an under-delivery, and the per-file sentence denominators are published above so the claim is checkable.

### 2. [Recorded correction] One of the thirteen findings was a false positive, and it is recorded as one

- Covered in full above. `context-note.md:35`'s WP-06 hit landed on a **relative pronoun** in the middle of a correct 21-word sentence, because `deriveElements()` segments per source LINE.
- The plan's acceptance criterion asks for zero findings. It is met — but reaching it by widening the predicate or by re-wrapping the line would have been the two failure modes this phase exists to refuse, and both were available. The sentence was split on independent grounds instead.
- **The predicate's limitation is left OPEN as a residual.** The plan does not ask for this and no gate demands it; it is recorded because a green gate reached over an unexamined false positive is worth less than a red one that was understood.

### 3. [Recorded correction] `guard_imperative_lexicon`'s zero over these parts is an empty denominator, not a pass

- The plan's acceptance criteria read *"Both guards report **zero** findings for all thirteen seed templates"* and *"for both contracts."*
- `guard_imperative_lexicon` derives **zero elements** from either part. It reports zero findings over zero elements, which is the vacuity shape `reportMeasured()` and the gate's per-part floor were both written to make unsayable.
- Reported in the only honest reading — **zero `guard_sentence_form` findings over 350 and 255 visited sentences, and no imperative denominator at all** — and 29-11's identical finding on the checklists is now confirmed on two further parts.

### 4. [Recorded finding] A register row with an escaped pipe is silently dropped

- Covered above. The `board.md:64` row was first written with the board row's own pipes escaped; `readDispositionRows()` read it at **17 cells** and skipped it without a word.
- Caught by the coverage re-implementation, not by the gate. Recorded because the failure mode publishes a row that reads as work done and is read by nothing — the same class as 29-11's seven-column warning, now with an attested instance.

### 5. [Measured finding] `check:diff-disposition`'s green run does not cover this plan

- The plan's `key_links` treats `guard_diff_disposition` as the gate over every changed clause here.
- Measured: **none of this plan's fifteen files is in the 41-entry watched corpus.** The `37 watched file(s) changed` figure was already 37 at `HEAD` before this plan ran, so the delta from 29-11's recorded 36 is 29-11's own, not this plan's.
- Rows were written for all fifteen anyway and coverage was proven by re-implementing `rowMatches()` (59 derived, 0 uncovered), so a later reader does not mistake a green gate for proof.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. The seed templates ship deliberately EMPTY by design — that is their stated contract, not a stub — and **their emptiness is unchanged**: every per-section structure, every table header and every placeholder line is byte-identical in form, and six of the thirteen files are byte-unchanged entirely. None of the nine modified files carries a new `TODO`, `FIXME`, `placeholder` or `coming soon`, and every removed clause's content is either restated in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — whether the corrected `Ready for Dev` entry criterion states the condition a team can actually satisfy is a human judgement.** The register proves the clause was dispositioned; it proves nothing about whether *"analysis and design recorded as typed notes per Workflow 16"* is the entry condition the Orchestrator actually enforces. This is the sharpest open question this plan leaves, because the replaced text is a **column gate in a template every bootstrapped project inherits**.
- **The WP-06 predicate's per-line segmentation is UNRESOLVED and now has a worked example.** `deriveElements()` cuts a wrapped sentence at its line break, so a relative pronoun at a line head can red the bare-demonstrative arm. One instance was met, refused two gaming fixes, and fixed on independent grounds. **A green `guard_sentence_form` does not mean the corpus cannot produce another.** Whoever revisits WP-06 should decide this as a judgement, not discover it.
- **`guard_imperative_lexicon` has now been measured as never having run over three of the corpus's four parts.** Checklists (29-11), seed templates and contracts all carry zero `## Steps` headings. Its `0 over 139` is entirely the workflows. Not a defect — the gate's own source argues why `## Steps` is the honest surface — but a fact about coverage that should not be read as corpus-wide.
- **`mark anything unverified \`UNKNOWN - verify\`` remains a pre-existing WP-10 repetition across three role `## Hard limits`.** Carried forward unchanged from 29-10 and 29-11. Not surfaced by this plan's diff and not owned by it; **deleting a no-fabrication floor to clear a duplication finding is the wrong direction** and was not done.
- **The `and-slash-or` arm (WP-07) has found ZERO findings across the entire phase**, and this plan adds no instance either. 29-11's M6 proved it live rather than dead. Whoever revisits the profile should decide whether an arm with no attested instance in the whole corpus earns its place.
- **The three lowercase workflow display names remain untouched** — 29-10's residual, unchanged; it is a change to a derived set rather than a prose edit.
- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is still not seen.** 29-03's recorded residual, unchanged, and structurally moot for these parts because neither has a `## Steps` section.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here across all 21 walked files and reports 0 failures; nothing in the build would have caught a failure.
- **`security-nfr.md` is still 101 bytes above its advisory WARN tier.** 29-07's residual, untouched; **plan 29-13 owns the re-baseline**, and this summary hands it the measured corpus growth it needs: +1,845 B, +1.21%, across 47 files.

## Threat Flags

None beyond the plan's own register. Zero packages installed (`git diff -- package.json` is empty), no network path and no write path added.

- **T-29-69 (derived Technical Names set) — mitigated and measured.** `TECHNICAL_NAMES.length` is 76 on both sides; the board column set and the note-kind set are byte-identical member for member; the one changed board row has an identical FIRST cell; and the protection is structural — both derivations read the first cell only, so a second-cell edit cannot reach them.
- **T-29-70 (stale board column entry criterion) — mitigated and measured.** Corrected to the criterion that holds, re-narrated onto the kit's own existing spelling, and verified by a Node walk finding zero remaining occurrences over 21 files and 31,005 bytes. Mutation M4 proves the length bound reaches the new text.
- **T-29-71 (verify-before-write seam) — mitigated by absence.** `git diff --name-only -- scripts/context-io.ts` returns nothing; `git diff -- scripts/ package.json` is empty; the whole admission paragraph is byte-unchanged.
- **T-29-72 (claiming the gate governs runtime notes) — checked, nothing to correct.** Both contracts read in full; neither makes the claim; **no sentence was added**; the split stays stated in the profile's own § *Governed surfaces* table, which is byte-unchanged.
- **T-29-73 (reporting a corpus-wide zero that was not observed) — mitigated.** 29-11 landed at `b9c18a2` before this plan ran, its 13-finding hand-off reproduced exactly, and the corpus-wide zero comes from a single gate invocation that visits all 47 files and prints `47 of 47 opened`.
- **T-29-74 (reshaping placeholders into steps) — mitigated and measured.** Decided by section anchor exactly as the guard decides; there is no `## Steps` anchor in either part; every per-file sentence denominator is equal in all thirteen seed templates and six are byte-unchanged entirely.
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed; `package.json` is byte-unchanged.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-12.md
```

Commits claimed, verified in `git log`:

```
FOUND: 04780f7  refactor(29-12): the thirteen seed templates onto the writing profile, the stale board criterion corrected
FOUND: f6db329  refactor(29-12): both contracts onto the writing profile — the governed corpus closes at zero
```
