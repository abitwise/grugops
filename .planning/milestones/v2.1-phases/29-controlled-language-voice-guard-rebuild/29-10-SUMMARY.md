---
phase: 29-controlled-language-voice-guard-rebuild
plan: 10
subsystem: docs
tags: [kit-prose, workflows, controlled-language, canonical-step-form, sentence-bounds, single-source-pointers, safety-partition, frozen-sections, dispositions, byte-growth]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 style contract every row cites"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 03
    provides: "guard_imperative_lexicon and guard_sentence_form, APPROVED_STEP_VERBS, the two sentence bounds and the 47-file four-part corpus"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, FROZEN_SECTION_ANCHORS, the docs/audit/29-style-dispositions/ contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 08
    provides: "the six-workflow conversion patterns and the canonical `Each role reads…` replacement copied verbatim here"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 09
    provides: "the constant-denominator mechanic (split INSIDE the bullet), the safety-partition-before-edit pattern, and the precedent that a PRE-EXISTING frozen-text duplication is refused a deletion"
provides:
  - "ALL NINETEEN workflows on the canonical step form and both sentence bounds — guard_imperative_lexicon now PASSES at 0 findings over 139/139 elements, its first green since it was written"
  - "docs/audit/29-style-dispositions/29-10.md — 466 rows over 465 distinct changed clauses, 58 carrying a frozen-section companion cell, with the pointer reconciliation and two safety partitions written before the files were opened"
  - "the recorded finding that NO role pointer quotes prose from either single-source workflow — all eighteen reference by PATH, measured by two derived scans rather than assumed"
  - "the complete workflow-group byte cost: 104,048 → 105,615 (+1,567 B, +1.51%) across plans 29-08, 29-09 and 29-10, at 4.5 B per new sentence"
  - "the corrected 104,094 baseline, now falsified by re-running the research's OWN command (`cat agent-factory/workflows/*.md | wc -c` at 4d2b8f0 returns 104,048)"
affects: [29-11, 29-12, 29-13]

actuals:
  tokens: 88000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Before editing a single-source document, run BOTH an exact-sentence scan and an 8-word shingle scan over the pointing corpus, reusing the gate's own normalizeSentence() — the shingle scan is what catches a PARTIAL quote the sentence scan misses"
    - "A pointer that references by PATH is not a quote, and the distinction is the whole reconciliation: eighteen role pointers named the workflow file and quoted none of its prose, so the reconciliation was a no-op that had to be MEASURED to be recorded as one"
    - "An inherited count from a prior plan's summary is re-measured before it is repeated: 29-09's `eight role files` for the `UNKNOWN - verify` collision is THREE for this clause, and the register names both numbers"
    - "Register rows are GENERATED from the gate's own clause segmentation with the raw fragment kept beside the normalized one — 466 hand-typed rows would be set-literal drift by construction"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-10.md
  modified:
    - agent-factory/workflows/13-incident.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/workflows/15-security-audit.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md

key-decisions:
  - "The pointer reconciliation was performed with TWO derived scans and its result — that no role pointer quotes any changed sentence — is recorded as a measurement rather than asserted. All eighteen role pointers reference `16-context-read-write.md` and `18-context-compaction.md` by PATH; the only cross-file quotes are sibling-workflow overlaps, and every sibling is inside this batch"
  - "29-09's `eight role files` for the `mark anything unverified \\`UNKNOWN - verify\\`` collision was NOT repeated. Asked of this exact clause with the gate's own `segmentClauses()`, the owners are THREE (`brownfield-mapper`, `release-manager`, `software-engineer`) and no workflow section and no registry anchor. The measured figure is used and the inherited one is named"
  - "The collision itself was refused a deletion, on 29-09's precedent: the repetition predates the phase and it is the incident workflow's no-fabrication floor"
  - "`16`'s twelve `## Steps` bullets include three OUTCOME bullets (`**gate-verifiable** → …`) that were converted to instructions (`Run the §14 gate when the result is **gate-verifiable** → …`) rather than moved into a table — the same refusal 29-09 made for `08-sprint-planning.md`'s nine field bullets"
  - "`18` step 5's label became `Run the re-verify on a promoted \\`finding\\`` rather than `Verify … again`, so the concept keeps its existing name (WP-09) while an approved verb still leads"
  - "Seven modals came out. Every one left its rule as strong or stronger: `may override … with` → `overrides … only with`, `must survive` → `survives` under an imperative lead, `can NEVER satisfy` → `NEVER satisfies`"
  - "No verb was added. `APPROVED_STEP_VERBS` is 43, unchanged, and `git diff -- scripts/ package.json` is empty"

patterns-established:
  - "Record a reconciliation that turned out to be a NO-OP with the same rigour as one that required edits — 'no pointer needed an edit' is only credible when the scan that established it is named"
  - "Generate register rows from the gate's own derivation and keep the raw fragment beside the normalized clause, so the register is both machine-matchable and human-readable"

requirements-completed: []

coverage:
  - id: D1
    description: "All nineteen workflows carry the profile, and the workflow part of the corpus reports zero findings over its full visited denominator (LANG-02, LANG-04)"
    requirement: "LANG-02"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — `PASS imperative lexicon: 0 findings over 139/139 elements`. This is the predicate's FIRST green: it opened at 81 over 125 in the 29-03 RED transcript. Sentence form falls 113 → 17, and ZERO of the 17 is in a workflow"
        status: pass
      - kind: integration
        ref: "per-file zero on BOTH predicates for all six, down from 30 + 96 = 126; corpus totals fall by exactly that amount (30 → 0 and 113 → 17), which proves the other 41 governed files' findings did not move"
        status: pass
      - kind: other
        ref: "six hermetic mutations against the COMMITTED tree (bold label restored in 16, actor subject restored in 14, `must` re-added in 18, `This is` restored in 17, the incident safety sentence re-merged in 13, `Enforcement` restored in 15) each red the NAMED arm at the NAMED file and line; M0 control clean, every mutation asserted applied, every restore byte-identical, `git diff --stat -- agent-factory docs scripts` empty afterwards"
        status: pass
      - kind: other
        ref: "the gate still exits 1 overall on `guard_sentence_form` — 17 findings across the hand-authored checklists, the seed templates and the contracts, which are 29-11 and 29-12's work"
        status: pass
    human_judgment: false
  - id: D2
    description: "The single-sourced pointers were reconciled and the reconciliation is recorded, not assumed (T-29-56)"
    verification:
      - kind: integration
        ref: "two derived scans over all 18 role files and all 19 workflows, both reusing `normalizeSentence()` from scripts/voice-model.ts: an exact-sentence scan (59 sentences from `16`, 69 from `18`) and an 8-word shingle scan (1,096 and 1,116 shingles). NO role file quotes any sentence or 8-gram of either workflow except the file PATH itself"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js exits 0 — the mechanical check that no role pointer sentence broke. The role track stays closed at 17/17"
        status: pass
      - kind: other
        ref: "six sibling-workflow overlaps found and each handled: four byte-unchanged on both sides, one (`A \\`claim\\` … satisfy a finding's admission requirement`) changed in BOTH `16` and `18` in the same commit, one (`self_fix_attempts`, owned by `05`) byte-unchanged in both"
        status: pass
    human_judgment: false
  - id: D3
    description: "The safety-bearing text in the incident, security-audit and task-claim workflows was partitioned and judged sentence by sentence (LANG-03)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 1878/1878 elements`, 1,489 rows across 6 files, exit 0. This plan's share is 466 rows over 465 distinct (file, before, after) triples, 58 carrying a companion cell"
        status: pass
      - kind: other
        ref: "the six-row `13-incident.md` and nine-row `15-security-audit.md` Set A tables in docs/audit/29-style-dispositions/29-10.md were written and committed BEFORE either file was opened for editing; four of six and six of nine safety sentences end byte-unchanged, including BOTH files' whole `## Stop conditions` in `13` and every withheld permission in `15`"
        status: pass
      - kind: other
        ref: "`17-task-claim.md`'s `## Stop conditions` is byte-unchanged — not one character. Its `## Commit` change carries a companion cell"
        status: pass
      - kind: other
        ref: "the register proves every changed clause was dispositioned and nothing about any disposition's substance; the LANG-03 check is a named human reading the 466 rows against the diff"
        status: pass
    human_judgment: true
  - id: D4
    description: "The verify-before-write seam did not move and the generated OWASP checklist was never opened (D-17, D-42)"
    verification:
      - kind: other
        ref: "`git diff -- scripts/ package.json` is EMPTY for this plan — no predicate entered the write path, none was widened, no dependency added. The sanctioned writer, the structured-tool channel, the PER-CALL admission-guard hook, the fresh-per-call session variable and the FINAL-structured-arguments reading all survive clause for clause"
        status: pass
      - kind: integration
        ref: "`git diff --name-only -- agent-factory/checklists/security-nfr-checklist.md` returns NOTHING, and `GENERATED_EXEMPT` still derives exactly that one path against a two-sided `GENERATED_EXEMPT_COUNT` of 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The workflow group's total byte growth is measured against its pre-phase baseline with the mechanism named (D-28)"
    verification:
      - kind: other
        ref: "six-row growth table below, every value from `fs.statSync().size` against `Buffer.byteLength(git show <commit>:<path>)`; batch +285 B (+0.72%), 19-workflow group 104,048 → 105,615 (+1,567 B, +1.51%) across plans 29-08, 29-09 and 29-10"
        status: pass
      - kind: other
        ref: "the mechanism is SENTENCE SPLITTING — 349 new workflow sentences for 1,567 bytes across the three plans is 4.5 B per sentence, the cost of a repeated subject. Article restoration contributed approximately NOTHING: 29-RESEARCH §C-5 measured the governed workflows at 11.4% articles before this phase — already normal English, with no dropped articles to restore"
        status: pass
      - kind: other
        ref: "no byte ceiling exists for a workflow and none was added; one file (`17-task-claim.md`) SHRANK by 42 B because six bold labels came off"
        status: pass
    human_judgment: false
  - id: D6
    description: "The other three corpus parts are provably byte-identical and the corpus denominator is provably unchanged (T-29-60)"
    verification:
      - kind: other
        ref: "all 28 checklist, seed-template and contract members byte-identical to the 29-09 tree, compared by Node string equality of `readFileSync` against `git show 91878ab:<path>`; 13 of 19 workflows likewise, the 6 differing being exactly this plan's"
        status: pass
      - kind: integration
        ref: "GOVERNED_CORPUS_COUNT still 47 in four parts (workflows 19, checklists 13, seedTemplates 13, contracts 2); APPROVED_STEP_VERBS still 43; TECHNICAL_NAMES still 76; GENERATED_EXEMPT still 1"
        status: pass
      - kind: other
        ref: "the `## Steps` bullet denominator is UNCHANGED in all six files (5/6/4/12/6/9) and at the corpus level (139 → 139); the sentence denominator's corpus delta (+130) equals this batch's delta exactly"
        status: pass
    human_judgment: false
  - id: D7
    description: "The regression lane and every other repo gate are green, and the gate wall clocks are recorded after the largest single change to the text those regexes run over"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped: identical to the 29-05 … 29-09 baseline"
        status: pass
      - kind: integration
        ref: "check-foundation-guards 0 · check-banned-claims 0 · check-nul-bytes 0 · check-kit-refs 0 · validate-agent-factory 0 · typecheck 0 · freshness 0 at 48 pairs · freshness:catalog 0"
        status: pass
      - kind: other
        ref: "imperative-lexicon 0.04 / 0.04 / 0.04 s (29-09 0.05 / 0.04 / 0.04); diff-disposition 0.70 / 0.68 / 0.68 s (29-09 0.58 / 0.55 / 0.59 — the rise is the register growing 1,023 → 1,489 rows); foundation guards 0.10 / 0.09 / 0.09 s"
        status: pass
    human_judgment: false

duration: 95min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 10: The Last Six Workflows Summary

**The workflow track closes: all nineteen workflows now carry the profile, `guard_imperative_lexicon` reports its FIRST green — 0 findings over 139/139 elements, down from the 81-over-125 it opened at — and every `## Steps` bullet denominator in this batch held constant while 126 findings went to zero. The pointer reconciliation the plan feared turned out to be a NO-OP, and it was measured rather than assumed: two derived scans prove all eighteen role pointers reference the single-source workflows by PATH and quote none of their prose. An inherited count was re-measured and corrected instead of repeated, the frozen-text collision 29-09 handed forward arrived exactly as predicted and was refused a deletion for the same reason, and six restored mutations prove the guards still red my own prose.**

## Performance

- **Duration:** 95 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 7 (1 created, 6 modified)

## The predicate's first green

```
[guard_imperative_lexicon] …
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2;
        1 excluded by the derived `GENERATED` marker
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  PASS  imperative lexicon: 0 findings over 139/139 elements

[guard_sentence_form] …
        2165 sentence(s) — 414 procedural, 1751 descriptive;
        by finding kind: bare-demonstrative-subject 17
  FAIL  sentence form: 17 finding(s) over 2165 elements
```

`guard_imperative_lexicon` was watched failing at **81 over 125** in the 29-03 RED transcript, before a single word of the corpus was rewritten. It is now **0 over 139** — a larger denominator, fully clean. That is the D-24 acceptance evidence closing on the arm this plan owns.

The gate still exits **1**, and it should: `guard_sentence_form`'s remaining **17** findings are all `bare-demonstrative-subject`, and **not one of them is in a workflow**. They are the hand-authored checklists, the seed templates and the contracts — 29-11 and 29-12's work.

## The finding movement, with the denominators beside it

Both numbers per file, side by side, because **a finding count that fell while its denominator also fell is a narrowed scan rather than a fixed document**. Findings from `node scripts/check-imperative-lexicon.js`; denominators from a Node walk mirroring the gate's own `deriveElements()` and reusing the same `fencedLineFlags()` authority, cross-checked against the gate's printed corpus totals on both sides.

| file | `guard_imperative_lexicon` | `guard_sentence_form` | bullets visited | sentences visited |
|---|---|---|---|---|
| `13-incident.md` | 0 → **0** | 7 → **0** | 5 → **5** | 32 → 40 |
| `14-ui-design-to-build.md` | 2 → **0** | 14 → **0** | 6 → **6** | 45 → 67 |
| `15-security-audit.md` | 1 → **0** | 13 → **0** | 4 → **4** | 42 → 55 |
| `16-context-read-write.md` | 12 → **0** | 24 → **0** | 12 → **12** | 71 → 107 |
| `17-task-claim.md` | 6 → **0** | 12 → **0** | 6 → **6** | 63 → 77 |
| `18-context-compaction.md` | 9 → **0** | 26 → **0** | 9 → **9** | 79 → 116 |
| **batch** | **30 → 0** | **96 → 0** | **42 → 42** | **332 → 462** |

**The bullet denominator did not move** — not per file, not in aggregate, and not at the corpus level. 29-09's constant-denominator mechanic was applied throughout: an over-long step is split **inside its own bullet**, never into a second bullet, because `deriveElements()` pushes one bullet per list LINE.

**The corpus arithmetic closes exactly.** Imperative 30 → 0, and 30 − 30 = 0. Sentence form 113 → 17, and 113 − 96 = 17. Bullets 139 → 139, and this batch's delta is 0. Sentences 2,035 → 2,165, and this batch's delta is +130. **Every corpus-level delta equals this batch's delta**, so the other forty-one governed members contributed nothing in either direction.

### What the 126 were, by grammar

| finding kind | in this batch | where it concentrated |
|---|---:|---|
| `descriptive-sentence-too-long` (WP-03) | 41 | spread; `16` 8, `18` 9, `14` 8, `15` 7 |
| `procedural-sentence-too-long` (WP-02) | 37 | `16` 12, `18` 11 |
| `bold-label` (WP-01) | 21 | `16` 9, `18` 6, `17` 6 — the seam workflows' step labels |
| `bare-demonstrative-subject` (WP-06) | 9 | `18` 3, `16` 2, one each in `13`/`14`/`15`/`17` |
| `modal-in-procedural-step` (WP-05) | 7 | `16` 2, `18` 2, one each in `14`/`15`/`17` |
| `not-an-approved-verb` (WP-01) | 4 | `18`'s three dial-value bullets, `15`'s `Enforcement` |
| `determiner-subject` (WP-01) | 4 | `16` 3, `14` 1 |
| `more-than-one-instruction` (WP-08) | 2 | `13` (`Create … and hand`), `18` (`Distill … and write`) |
| `actor-subject` (WP-01) | 1 | `14` — `Frontend/UI authors …` |
| `and-slash-or` (WP-07) | **0** | none in this batch, and none anywhere in the phase |
| **TOTAL** | **126** | over 42 bullets and 332 sentences in six files |

## The complete nineteen-file movement, across all three workflow plans

| point | `guard_imperative_lexicon` | `guard_sentence_form` | workflow bullets | workflow sentences | 19-workflow bytes |
|---|---|---|---:|---:|---:|
| `4d2b8f0` — phase base | 81 / 125 | 264 / 1,816 | 125 | 858 | 104,048 |
| after 29-08 (`6d3b6f2`) | 46 / 139 | 194 / 1,934 | 139 | 976 | 104,605 |
| after 29-09 (`91878ab`) | 30 / 139 | 113 / 2,035 | 139 | 1,077 | 105,330 |
| **after 29-10 (`1ee758e`)** | **0 / 139** | **17 / 2,165** | **139** | **1,207** | **105,615** |

The finding columns are corpus-wide (47 files); the bullet and sentence columns are the 19 workflows only, so the two can be read against each other without conflating denominators.

**No visited denominator FELL across any of the three plans.** The bullet denominator rose once — 125 → 139 in 29-08, recorded there as its Deviation 1, because that plan split steps into second bullets — and has been **constant at 139 through 29-09 and 29-10**. The sentence denominator rose monotonically (858 → 976 → 1,077 → 1,207), which is the opposite of the scan-narrowing failure mode: more elements scanned, all of them clean.

Per-plan sentence deltas: +118, +101, **+130**. Each equals its plan's own batch delta exactly, so no plan moved a file outside its batch.

## The pointer reconciliation — a no-op, and measured to be one

`16-context-read-write.md` and `18-context-compaction.md` are single-source documents. The kit's `## Hard limits` sections rely on that single-sourcing when they say *"this role references it and does not restate it"*. A change to a sentence the pointers **quote** silently turns single-sourcing into paraphrase, so the check ran **before either file was opened**.

**Two derived scans**, both reusing `normalizeSentence()` from `scripts/voice-model.ts` — the same normalizer `guard_diff_disposition` and `guard_role_clause_uniqueness` use, so a match here is a match there:

| scan | what it looks for | `16` | `18` |
|---|---|---:|---:|
| exact-sentence | every sentence of ≥6 normalized words, looked up in an index over all 18 roles + all 19 workflows | 59 sentences scanned | 69 sentences scanned |
| 8-word shingle | every normalized 8-gram, same corpus — catches a PARTIAL quote the sentence scan misses | 1,096 shingles, 93 shared | 1,116 shingles, 95 shared |

**The result: no role file quotes any prose from either workflow.** Every one of the eighteen role pointers references by **path**, in the form

```
Context I/O: read and write the shared context per `agent-factory/workflows/16-context-read-write.md`
             — that workflow is the single source; this role references it and does not restate it.
```

The only 8-gram shared between a role file and either target is the file path itself. **No role pointer needed an edit**, and `node scripts/check-foundation-guards.js` exits **0** afterwards — the mechanical confirmation.

**What the scans DID find is sibling-workflow overlap, and every sibling is inside this batch:**

| quoted text | owner | also in | outcome |
|---|---|---|---|
| `Do not loop, do not fake a stamp.` | `16` `## Stop conditions` | `18` | **byte-unchanged in both** |
| `This workflow records verified context; it never merges and never deploys — humans hold both.` | `16` `## Commit` | `18` | **byte-unchanged in both** |
| `The board move belongs to the invoking workflow.` | `18` `## Board moves` | `17` | **byte-unchanged in both** |
| `… there is one protocol, named here, not forked into each role.` | `16` `## When to use` | `17`, `18` | **byte-unchanged in all three** |
| `A \`claim\` … satisfy a finding's admission requirement` | `16` step 4 | `18` step 6 | **changed in BOTH, in this same commit** — the modal came out of each (`can NEVER satisfy` → `NEVER satisfies`; `can never satisfy` → `never satisfies`) |
| the `self_fix_attempts` reference | `05-pr-quality-gate.md` | `16`, `18` | **byte-unchanged in both**; both still say the loop lives in `05` and is neither restated nor re-dialled |

**Every one is either byte-unchanged on both sides or changed on both sides in the same commit.** No single-sourced sentence acquired a second spelling.

This is worth writing down precisely **because it is a negative result.** "No pointer needed an edit" is only credible when the scan that established it is named, and a reconciliation that turns out to be a no-op is exactly the one a later reader would suspect was skipped.

## D-17 — the seam did not move

`16-context-read-write.md` holds the verify-before-write seam, and D-17 recorded that a style predicate deliberately stays out of that path.

- `scripts/context-io.ts` is still named as the single sanctioned writer, in the same three places.
- The `mcp__grugops__propose_note` structured-tool channel, the PER-CALL PreToolUse `admission-guard` hook, the FRESH-per-call session variable the agent's own child env cannot reach, and the FINAL-structured-arguments reading all survive **clause for clause**. Step 3's sub-bullet a went from one 6-sentence paragraph to twenty conforming sentences with **no clause dropped**.
- The two accepted stamps, the `human_admission` dial, the non-CC degradation and the GOV-02 ledger sentence all keep their meaning.
- **`git diff -- scripts/ package.json` is EMPTY.** No predicate entered that path and none was widened to accommodate the rewritten prose.

## `13-incident.md` and `15-security-audit.md` — the partitions, written before the files were opened

Both partitions are in `docs/audit/29-style-dispositions/29-10.md`, written and committed in the same commit as the edits.

**`13-incident.md` — Set A, six safety sentences.** Production action, human confirmation, the blameless floor, the no-fabrication floor.

| # | what it is | outcome |
|---|---|---|
| A1 | `Propose the mitigation and the rollback to limit harm; stop the bleeding before the analysis.` | **byte-unchanged** |
| A2 | the blameless-postmortem step | split into three; `never blames a person` and the `## Root cause (systemic, not personal)` framing **word-for-word** |
| A3 | the no-fabrication floor | split into three, **every clause word-for-word**, two sentence-initial capitals |
| A4 | **the whole `## Stop conditions`** — including `Production action is always human-confirmed` | **byte-unchanged — not one character** |
| A5 | `The postmortem never blames a person; it examines the system and the process.` | **byte-unchanged** |
| A6 | `The mitigation/rollback production action stays human-confirmed — never merge, never deploy; humans hold both.` | **byte-unchanged** |

**`15-security-audit.md` — Set A, nine safety sentences.** Six of nine are **byte-unchanged**, including four of its five `## Stop conditions` bullets, the `autonomy=pr` merge withholding and the `## Commit` closing sentence. The three that moved kept every requirement word-for-word:

- `may override … with a stated reason and a named owner` → **`overrides … only with a stated reason and a named owner`**. The modal came out (WP-05) and the requirement is now unhedged: the permission no longer reads as optional, and both conditions are still required.
- Two `## Stop conditions` bullets turned one internal semicolon into a full stop. `An unbacked tick is a fabricated gate.` is byte-unchanged; both bullets still open with their condition.

**`17-task-claim.md`'s `## Stop conditions` is byte-unchanged — not one character** — and its `## Commit` change carries a companion cell. The queue's `EEXIST`-is-not-an-error rule, the never-two-agents-on-one-task rule and the never-relay-data-agent-to-agent rule all survive word-for-word.

**No production permission widened, no actor changed, no modal entered a permission, and no clear-voice sentence acquired caveman voice** in any of the three.

## The frozen collision 29-09 handed forward, met — and its count corrected

`13-incident.md` `## Metrics emitted` ends `mark anything unverified \`UNKNOWN - verify\``. Splitting the 34-word sentence in front of it put that clause in the diff, the frozen set matched it on **text**, and the gate demanded a companion cell for a clause whose substance did not change at all — only its sentence-initial capital, which `normalizeSentence()` folds away.

**Dropping it was available and was refused**, on 29-09's precedent and for 29-09's reason: the repetition **predates the phase**, it is the incident workflow's no-fabrication floor, and deleting a safety instruction to clear a duplication finding is the wrong direction.

**The inherited count was re-measured rather than repeated.** 29-09's summary records *"the `## Hard limits` of eight role files"* for its own instance in `12-release.md`. Asked of **this** clause with the gate's own `segmentClauses()`, the owners are **THREE** — `brownfield-mapper.md`, `release-manager.md`, `software-engineer.md` — and **no** workflow `## Stop conditions`, **no** workflow `## Commit` and **no** registry anchor. The register names both numbers, so a later reader comparing the two registers meets the difference as a correction rather than as a defect in one of them.

## The out-of-scope sections, counted before and after

Counted by a Node walk over the same `## `-heading anchor and `^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+` list-marker rule the gate uses. **A bare recursive grep was not used: a file classified as binary reports zero matches with no warning.**

| file | `## Inputs required` | `## Stop conditions` | `## Steps` | `## Agents involved` |
|---|---|---|---|---|
| `13-incident.md` | 3 → **3** | 1 → **1** | 5 → **5** | 1 → **1** |
| `14-ui-design-to-build.md` | 4 → **4** | 4 → **4** | 6 → **6** | 3 → **3** |
| `15-security-audit.md` | 4 → **4** | 4 → **4** | 4 → **4** | 1 → **1** |
| `16-context-read-write.md` | 5 → **5** | 3 → **3** | 12 → **12** | 2 → **2** |
| `17-task-claim.md` | 4 → **4** | 3 → **3** | 6 → **6** | 2 → **2** |
| `18-context-compaction.md` | 4 → **4** | 3 → **3** | 9 → **9** | 3 → **3** |

**Not one bullet was added, removed, or moved between sections anywhere in this batch.** One `## Inputs required` bullet in `16` and one in `14` were split **for length only** and stay noun phrases; four `## Stop conditions` bullets were split at an internal separator and stay conditionals.

## The byte growth, per file, with its mechanism named

Every value from `fs.statSync().size` against `Buffer.byteLength` of `git show 91878ab:<path>`.

| file | before | after | delta | % |
|---|---:|---:|---:|---:|
| `13-incident.md` | 3730 | 3781 | **+51** | +1.37% |
| `14-ui-design-to-build.md` | 5489 | 5628 | **+139** | +2.53% |
| `15-security-audit.md` | 4732 | 4795 | **+63** | +1.33% |
| `16-context-read-write.md` | 9255 | 9321 | **+66** | +0.71% |
| `17-task-claim.md` | 6717 | 6675 | **−42** | **−0.63%** |
| `18-context-compaction.md` | 9783 | 9791 | **+8** | +0.08% |
| **batch total** | **39706** | **39991** | **+285** | **+0.72%** |

**The complete nineteen-file workflow total, against the pre-phase baseline — the number D-28 exists to produce:**

| point | 19-workflow bytes | delta | new sentences | B / sentence |
|---|---:|---:|---:|---:|
| `4d2b8f0` — phase base (measured) | 104,048 | — | — | — |
| after 29-08 | 104,605 | +557 (+0.54%) | +118 | 4.7 |
| after 29-09 | 105,330 | +725 (+0.69%) | +101 | 7.2 |
| after 29-10 | **105,615** | **+285 (+0.27%)** | **+130** | **2.2** |
| **whole workflow group** | | **+1,567 (+1.51%)** | **+349** | **4.5** |

```sh
node -e 'const cp=require("child_process"),fs=require("fs");
const f=fs.readdirSync("agent-factory/workflows").filter(x=>x.endsWith(".md")).sort();
let b=0,a=0;for(const x of f){b+=Buffer.byteLength(cp.execSync(`git show 4d2b8f0:agent-factory/workflows/${x}`,{encoding:"utf8"}),"utf8");
a+=fs.statSync("agent-factory/workflows/"+x).size;}console.log(f.length,b,a);'
# 19  104048  105615      ->  +1,567 B, +1.51%
```

**The mechanism is sentence splitting, and nothing else.** 349 new sentences cost 1,567 bytes across the whole group — **4.5 bytes per new sentence**, the cost of a repeated subject. This plan's 2.2 B per sentence is the lowest of the three, because `17-task-claim.md` **shrank by 42 B**: six bold step labels came off and their content compressed into the instruction, so the removed markup outweighed the added subjects.

**Article restoration contributed approximately NOTHING, and that is measured rather than assumed.** 29-RESEARCH §C-5 counted the governed workflows at **11.4% articles** (1,771 of 15,584 words) *before* this phase — already normal English, with no dropped articles to restore. For contrast, the fenced caveman blocks run 5.5%, and the profile deliberately does not govern them.

**No byte ceiling exists for a workflow, and none was added.** D-28 asks this phase to record what the profile costs; the record is above, and a later plan reasons from it rather than from an estimate written before it.

## The untouched-part control, measured rather than assumed

| control | result | method |
|---|---|---|
| checklist + seed-template + contract members byte-identical to the 29-09 tree | **28 of 28** | Node string equality of `readFileSync` against `git show 91878ab:<path>` |
| workflow members byte-identical to the 29-09 tree | **13 of 19** — the 6 differing are exactly this plan's | same |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged (workflows 19, checklists 13, seedTemplates 13, contracts 2) | the gate's own `GOVERNED_CORPUS_PARTS` via `import()` |
| `GENERATED_EXEMPT` | **1**, still `agent-factory/checklists/security-nfr-checklist.md` | the derived `GENERATED` marker, two-sided pin |
| generated OWASP checklist in the diff | **absent** | `git diff --name-only -- agent-factory/checklists/security-nfr-checklist.md` returns nothing |
| `git diff --stat` beyond this plan's files | six workflows, the register — nothing else | `git diff --stat` |

## Falsifiability — the guards still red MY prose

This is the plan that turns the last six files green and takes a predicate to its first zero, which makes tuning it to fit the prose maximally tempting. So it was measured. **Six mutations against the COMMITTED tree**, each asserted applied before the guard ran and each restored byte-identically after:

| mutation | file | expected arm | result |
|---|---|---|---|
| M0 — unmutated control | — | none | **0 own findings** |
| M1 — a bold label restored | `16` step 3 | `WP-01 [bold-label]` | **1 hit at `16:31`** |
| M2 — the actor subject restored | `14` step 1 | `WP-01 [actor-subject]` | **1 hit at `14:25`** |
| M3 — `must` re-added to a procedural step | `18` step 3 | `WP-05 [modal-in-procedural-step]` | **1 hit at `18:49`** |
| M4 — `This is` restored | `17` `## The claim/note seam` | `WP-06 [bare-demonstrative-subject]` | **1 hit at `17:26`** |
| M5 — the incident safety sentence re-merged | `13` `## Metrics emitted` | `WP-03 [descriptive-sentence-too-long]` | **1 hit at `13:35`, `34 words, bound 25`** |
| M6 — `Enforcement is verified …` restored | `15` step 4 | `WP-01 [not-an-approved-verb]` | **1 hit at `15:26`** |

Every mutation reported `applied=true` and `restored=true`, the post-restore control is clean again, and `git diff --stat -- agent-factory docs scripts` is **empty** afterwards. **No mutation required a predicate change to produce, and no predicate was touched to make any of them stop.** Every edit went through the structured editor — no `perl -pi -e`, no byte-level rewrite (29-05's hazard).

## The disposition register

`docs/audit/29-style-dispositions/29-10.md` — **466 rows over 465 distinct (file, before, after) triples**, read back through the gate's own seven-column rule to confirm every one is visible (a row with any other cell count is silently skipped, which is the failure mode the count exists to catch). **58 rows carry a filled companion cell.**

**The rows were GENERATED, not hand-typed.** A generator mirrors `changedClauses()` — the same `git diff --unified=0` hunk parse, the same sentence split, the same clause separators, the same `normalizeSentence()` — but keeps the **raw fragment beside the normalized clause**, so the register is both machine-matchable and human-readable. 466 hand-typed rows would be set-literal drift by construction, which is one of the two systemic failure classes this repository has diagnosed in itself.

**The judgement is in the file's prose; the coverage is in its table.** The pointer reconciliation, the D-17 seam statement, the two safety partitions, the verb-substitution table, the frozen-section shapes and the collision refusal are all argued above the table; each row then carries its section's accurate reason, with a per-clause override for the collision.

```
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17,
        workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9;
        416 frozen clause(s), 55 frozen region(s); base 4d2b8f0
        36 watched file(s) changed since 4d2b8f0; 1878 changed clause(s) derived;
        1489 disposition row(s) across 6 file(s)
  PASS  diff disposition: 0 findings over 1878/1878 elements
```

Of the 466 rows: **216 added-only**, **118 removed-only**, and **132 unchanged text on a changed line** (a workflow paragraph is a single source line, so `git diff --unified=0` reports every clause on it when any clause moves). The 132 are written as one row each with an identical `before` and `after`, which is why 466 rows satisfy 598 findings.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 1** — but `guard_imperative_lexicon` **PASSES at 0 over 139**; the 17 remaining `guard_sentence_form` findings are all outside the workflows |
| `npm run check:diff-disposition` | **exit 0** — `0 findings over 1878/1878 elements`, 1,489 rows across 6 files |
| `node scripts/check-foundation-guards.js` | **exit 0** — the role track stays closed at 17/17; no role pointer broke |
| `npm run check:banned-claims` | exit 0 |
| `node scripts/check-nul-bytes.js` · `check-kit-refs.js` | both exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — every required workflow section still present |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npm run freshness:catalog` | exit 0; `generate:catalog` wrote **zero bytes** and `git status --porcelain docs/catalog/` is clean |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05…29-09 baseline — unmoved) |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged |
| `APPROVED_STEP_VERBS.length` | **43**, unchanged — **no verb was added** |
| `TECHNICAL_NAMES.length` | **76**, unchanged |
| `git diff 1ee758e^ HEAD -- scripts/ package.json` | **empty** — no predicate, no scan set, no dependency |
| imperative-lexicon wall clock, 3 runs | **0.04 / 0.04 / 0.04 s** (29-09 0.05 / 0.04 / 0.04) |
| diff-disposition wall clock, 3 runs | **0.70 / 0.68 / 0.68 s** (29-09 0.58 / 0.55 / 0.59 — the rise is the register growing 1,023 → 1,489 rows) |
| foundation-guards wall clock, 3 runs | **0.10 / 0.09 / 0.09 s** (29-09 0.11 / 0.10 / 0.10) |
| largest governed file timing | `05-pr-quality-gate.md` 14,154 B — 2,081 words in **1 ms**, 176 clauses in **2 ms** (from the suite's own timing assertions) |
| this batch's largest files | `18-context-compaction.md` 9,791 B, `16-context-read-write.md` 9,321 B |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — below it; 29-08 and 29-09 both measured 7,966) |
| `.planning/STATE.md` longest backslash run | **1** over 11 total backslashes (§F-2 baseline 1 — unmoved) |

**The largest single change to the text these regexes run over cost the prose scanner nothing** — `guard_imperative_lexicon` is unchanged at 0.04 s while its sentence denominator rose 6.4%. The F-2 escape-doubling mechanism stayed dormant and the superlinear-regex incident did not recur. The diff-disposition rise is entirely register size, not corpus size.

## Counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method.

| count | value | method |
|---|---:|---|
| governed corpus files | **47** | the gate's own `GOVERNED_CORPUS_PARTS`, read through `import()` |
| non-batch governed files byte-identical | **41 of 41** (28 non-workflow + 13 workflow) | Node string equality of `readFileSync` against `git show 91878ab:<path>` |
| files failing a UTF-8 round-trip | **0** | `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file, over all six plus the register |
| `## Steps` bullets, before / after | 42 / 42 (batch) · 139 / 139 (corpus) | Node walk reusing `fencedLineFlags()`; **cross-checked against the gate's printed totals on both sides** |
| sentences visited, before / after | 332 / 462 (batch) · 2,035 / 2,165 (corpus) | same walk, same cross-check |
| `## Inputs required` / `## Stop conditions` / `## Agents involved` bullets | unchanged in all six | Node walk, section anchor + list marker |
| disposition rows in `29-10.md` | **466** over **465** distinct triples, **58** with a companion | the gate's own seven-column row rule, re-implemented over the file |
| frozen-clause owners of `mark anything unverified \`UNKNOWN - verify\`` | **3** role `## Hard limits`, 0 workflow sections, 0 registry anchors | the gate's own `segmentClauses()` over each anchor's located region |
| approved verbs | **43** | `APPROVED_STEP_VERBS.length` via `import()` |
| workflow-group bytes | 104,048 → 105,615 | `fs.statSync().size` vs `Buffer.byteLength(git show 4d2b8f0:…)` |
| workflow article density, pre-phase | **11.4%** (1,771 / 15,584) | 29-RESEARCH §C-5, cited not re-derived |

## Deviations from Plan

### 1. [Measured correction, and now falsified by its own command] The plan's 104,094-byte workflow baseline

- The plan's Task 2 action names *"the 104,094-byte pre-phase baseline"*, inherited from 29-RESEARCH §A-2, which states the figure beside the command `cat agent-factory/workflows/*.md | wc -c`.
- 29-08 and 29-09 both recorded that 104,094 *"has no source"*. **This plan went further and re-ran the research's own command against a hermetic export of `4d2b8f0`: it returns `104048`.** So the figure is not merely unsourced — it is not reproducible by the method the research states produced it.
- **104,048 is used throughout**, and it now has three independent sources: 29-03's four-part corpus table, `sum(statSync)` over `git show 4d2b8f0`, and the research's own `cat | wc -c` re-run.

### 2. [Recorded correction] 29-09's "eight role files" for the frozen collision is three for this clause

- Covered in full above. 29-09's summary and register report eight owners for its instance of `mark anything unverified \`UNKNOWN - verify\``; this clause has **three**, measured with the gate's own `segmentClauses()` over each frozen anchor's located region.
- The corrected number is used and the inherited one is named, in both the register row and the register prose. An inherited count repeated without re-measurement is how a summary becomes a source of numbers nobody checked — which is the failure this project has diagnosed in itself twice.

### 3. [Measured deviation] `docs/catalog/README.md` is in the plan's `files_modified` and is byte-unchanged

- The plan's Task 1 action says *"Where a `## When to use` first sentence changes, regenerate the catalog in this plan's commit."*
- **No `## When to use` FIRST sentence changed in any of the six.** All six catalog-derived opening sentences are byte-identical; the changes in `13`, `15`, `16`, `17` and `18` are to the second and later sentences of that paragraph. `generate:catalog` was run anyway and wrote **zero bytes**; `freshness:catalog` exits 0 and a second generation leaves `git status --porcelain docs/catalog/` clean. The condition the regeneration attaches to did not arise, and the gate confirms it rather than the absence being assumed. This is the same outcome 29-08 and 29-09 both recorded.

### 4. [Recorded judgement] Two `## Commit` leads keep their bespoke wording rather than adopting the kit-wide `the artifacts this workflow wrote`

- Sixteen workflows now open `## Commit` with `Commit the artifacts this workflow wrote per …`. `16`, `17` and `18` open with `the context notes`, `the queue and context state` and `the compact, re-verified context` respectively.
- Normalising all three to `the artifacts` was available and was **not** taken. It is a WP-09 improvement, but it is a larger change to a frozen section than the shape fix the plan asks for, and each bespoke lead names what that specific seam workflow actually commits. The minimal change — shedding the parenthetical into `The artifacts are …` — was made instead, and the residual is recorded below rather than silently absorbed.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. None of the six workflows carries `TODO`, `FIXME`, `placeholder` or `coming soon`, and every removed clause's content is either restated in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — whether a rewritten workflow still instructs the same act is a human judgement.** The register proves every changed clause was dispositioned; it proves nothing about any disposition's substance. This is sharpest in `16-context-read-write.md`, whose step 3 sub-bullet went from one dense paragraph to twenty sentences about the admission mechanism, and in `18`'s carve-out step. The written partitions and the pointer-scan record narrow what a reviewer must check; they do not decide it.
- **The kit-wide `Each role reads…` paragraph now has ONE spelling across all nineteen workflows.** 29-08's live WP-09 split is **CLOSED for the workflow corpus** — the canonical replacement from `29-08.md` was copied verbatim into `13`, `14` and `15` (the single-role variant into `13` and `15`, on `11-retro.md`'s precedent). No third spelling was minted.
- **`mark anything unverified \`UNKNOWN - verify\`` is a pre-existing WP-10 repetition across three role `## Hard limits` and two workflows.** Surfaced by this plan's diff, refused a deletion, not owned by this plan. Whoever revisits WP-10 will meet it again, now with a measured owner count.
- **The WP-09 workflow-naming defect is UNTOUCHED and now belongs to nobody.** Three of nineteen workflow display names are lowercase — `context compaction`, `context read/write`, `task claim + schedule` — pinned as an observation in `kit-model.test.ts` since 29-03. All three are in **this** batch, and this plan **did not fix them**: the `# Workflow:` heading is the derivation source for `listWorkflowDisplayNames()`, which feeds `TECHNICAL_NAMES` and its two-sided count, so changing a display name is a change to a derived set rather than a prose edit. It is out of a prose plan's scope, and it is now the last workflow-corpus WP-09 item open.
- **Three `## Commit` leads keep bespoke wording** (`16`, `17`, `18`) where sixteen say `the artifacts this workflow wrote`. Deviation 4.
- **Six kit files still carry retired v1.x handoff vocabulary** (29-RESEARCH §A-2). None of the six in this batch is among them.
- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is still not seen.** 29-03's recorded residual, unchanged.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here and reports 0 failures over all seven files; nothing in the build would have caught a failure.
- **`security-nfr.md` is still 101 bytes above its advisory WARN tier.** 29-07's residual, untouched; plan 29-13 owns the re-baseline.
- **The hand-authored checklists, the seed templates and the contracts remain unrewritten** — 17 `guard_sentence_form` findings, all `bare-demonstrative-subject`, which is why the gate still exits 1. That is 29-11 and 29-12's work.

## Threat Flags

None beyond the plan's own register. Zero packages installed (`git diff 1ee758e^ HEAD -- package.json` is empty), no network path and no write path added.

- **T-29-56 (single-sourced pointer sentences) — mitigated and measured.** Two derived scans over the whole pointing corpus before either file was opened; no role pointer quotes any changed sentence; six sibling overlaps each byte-unchanged on both sides or changed on both sides in the same commit; `check-foundation-guards` exits 0.
- **T-29-57 (verify-before-write seam) — mitigated by absence.** `git diff -- scripts/` is empty; every seam clause survives word-for-word.
- **T-29-58 (generated OWASP checklist) — asserted, not assumed.** `git diff --name-only` over that path returns nothing, and `GENERATED_EXEMPT` still derives exactly it against a two-sided count of 1.
- **T-29-59 (reword of a frozen structural section) — mitigated.** 58 frozen intersections, every one carrying a named companion cell; the disposition gate exits **0** on a real commit at 1,878/1,878 elements. `17`'s and `13`'s `## Stop conditions` are byte-unchanged entirely.
- **T-29-60 (scan-set narrowing to reach green) — mitigated and measured.** `GOVERNED_CORPUS_COUNT` still 47, `git diff -- scripts/` empty, **every bullet denominator unchanged**, the sentence denominator published per file, the corpus deltas proven equal to this batch's deltas, and the full three-plan denominator history published so a raised denominator stays distinguishable from a narrowed one.
- **T-29-61 (guard runtime after the whole workflow group is rewritten) — measured.** `guard_imperative_lexicon` is unchanged at 0.04 s while its sentence denominator rose 6.4%; the diff-disposition rise is register size, not corpus size.
- **T-29-62 (an unapproved verb entering the list silently) — closed by absence.** `APPROVED_STEP_VERBS.length` is **43** and `git diff -- scripts/` is empty. **No verb was added.**
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-10.md
```

Commits claimed, verified in `git log`:

```
FOUND: 1ee758e  refactor(29-10): the last six workflows onto the canonical step form, pointers reconciled first
```
</content>
