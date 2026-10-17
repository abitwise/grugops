---
phase: 29-controlled-language-voice-guard-rebuild
plan: 09
subsystem: docs
tags: [kit-prose, workflows, controlled-language, canonical-step-form, sentence-bounds, frozen-sections, release-safety-partition, dispositions, byte-growth]

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
    provides: "the six-workflow conversion patterns, the canonical `Each role reads…` replacement copied verbatim here, and the precedent that a duplication a style pass CREATES is dropped rather than dispositioned"
provides:
  - "thirteen of nineteen workflows on the canonical step form and both sentence bounds — 97 findings to 0 across this plan's seven, per file, on both predicates"
  - "docs/audit/29-style-dispositions/29-09.md — 376 rows over 376 distinct changed clauses, 65 carrying a frozen-section companion cell, with the release workflow's three-way sentence partition written before its first edit"
  - "the recorded finding that a split sentence need NOT become a split bullet: every `## Steps` bullet denominator in this batch is unchanged, which is the constant 29-08's raised denominators could not offer"
  - "the measured per-file byte cost: +725 B over the batch, workflow group 104,048 → 105,330 (+1.23%) across plans 29-08 and 29-09"
affects: [29-10, 29-11, 29-12, 29-13]

actuals:
  tokens: 79000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A `## Steps` bullet carrying three conforming sentences is ONE bullet and three sentences — `deriveElements()` pushes one bullet per list LINE — so an over-long step can be split INSIDE its own bullet and the bullet denominator held constant"
    - "A frozen-TEXT intersection can be raised by a clause that did not change at all: the split moved a sentence boundary in front of it, which put its line in the diff, and the frozen set matches on text across the whole union"
    - "When a plan's prose instruction (`edit only the second set`) contradicts its own acceptance criteria, the reading taken is recorded in the register rather than resolved silently"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-09.md
  modified:
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/workflows/08-sprint-planning.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/10-sprint-review.md
    - agent-factory/workflows/11-retro.md
    - agent-factory/workflows/12-release.md

key-decisions:
  - "Every over-long step was split INSIDE its own bullet rather than into a second bullet, so all seven files' `## Steps` bullet denominators are unchanged (4/7/13/7/5/4/6). This is a deliberate departure from 29-08, where five of six denominators rose; both routes reach the same conforming text, and this one leaves the denominator T-29-51 is about provably fixed"
  - "`08-sprint-planning.md`'s nine bold-label field bullets became `Record **Goal** as …` instructions. Converting the field list to a table or a fence was available and REFUSED: either would have moved nine bullets out of the scan while presenting as a formatting change"
  - "`12-release.md`'s three-way sentence partition was written into the register BEFORE the file was opened for editing, and nine Set A safety sentences are enumerated with what happened to each. Five of the nine are byte-unchanged, including the WHOLE `## Stop conditions` section"
  - "The plan's `edit only the second set` was read against its own objective (`the shape may conform; the permission may not move`), because four Set A sentences carry findings and the literal reading makes the plan's acceptance unmeetable. The reading is recorded in the register and as Deviation 1 rather than resolved silently"
  - "`mark anything unverified \\`UNKNOWN - verify\\`` in `12-release.md` intersects the frozen set from role `## Hard limits`, is byte-unchanged on both sides, and PREDATES this plan. Dropping it was available and refused — it is the release workflow's no-fabrication floor, and deleting a safety instruction to clear a duplication finding is the wrong direction"
  - "No verb was added. `Work through` became `Walk … end to end` on 29-08's `Map` → `Walk` precedent; `For each …` became `Record`; nine bold labels became `Record`"

patterns-established:
  - "Publish the bullet denominator beside the finding count even when it did not move — an unchanged denominator is the strongest form of the T-29-51 answer, and it is only credible if it was measured rather than assumed"
  - "For a safety file, write the sentence partition into the durable register first, enumerate every safety sentence with its outcome, and state which ones are byte-unchanged"

requirements-completed: []

coverage:
  - id: D1
    description: "Seven more workflows carry the profile: canonical step form, both sentence bounds, no banned constructions (LANG-02, LANG-04 — partial; six workflows and the checklist/seed/contract parts remain for 29-10..29-12)"
    requirement: "LANG-02"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — ZERO findings for all seven files on BOTH predicates, down from 16 + 81 = 97; corpus totals fall by exactly that amount (46 -> 30 and 194 -> 113), which proves the other twelve governed files' findings did not move"
        status: pass
      - kind: other
        ref: "five hermetic mutations against the COMMITTED tree (bold label restored in 08, determiner subject restored in 06, `should` re-added in 09, the release safety sentence re-merged in 12, `Work` restored in 12) each red the NAMED arm at the NAMED file and line; M0 control clean, every mutation asserted applied, every restore byte-identical, `git diff --stat` empty afterwards"
        status: pass
      - kind: other
        ref: "the gate still exits 1 overall — six governed workflows plus the checklist/seed/contract parts are unrewritten, and the per-file zero is what this plan proves"
        status: pass
    human_judgment: false
  - id: D2
    description: "The out-of-scope sections are provably untouched and the corpus denominator is provably unchanged"
    verification:
      - kind: integration
        ref: "`## Inputs required` bullet counts unchanged in all seven (3/4/3/3/3/3/4) and `## Stop conditions` bullet counts unchanged in all seven (1/1/2/2/1/1/1), counted by a Node walk over the same section-anchor + list-marker rule the gate uses. `## Steps` bullet counts ALSO unchanged (4/7/13/7/5/4/6)"
        status: pass
      - kind: integration
        ref: "GOVERNED_CORPUS_COUNT still 47 in four parts (workflows 19, checklists 13, seedTemplates 13, contracts 2) with the one generated file still excluded by its derived marker; APPROVED_STEP_VERBS still 43"
        status: pass
      - kind: other
        ref: "all 40 non-batch governed files are byte-identical to the 29-08 tree, compared by Node string equality against `git show 6d3b6f2`; their finding counts are 30 and 113 before and after — unmoved, and equal to the whole-corpus totals"
        status: pass
      - kind: other
        ref: "`git diff 91878ab^ HEAD -- scripts/ package.json` is EMPTY — no predicate widened, no scan set narrowed, no dependency added"
        status: pass
    human_judgment: false
  - id: D3
    description: "The release workflow's safety text was partitioned before it was touched, and its permissions are unchanged (LANG-03)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 1280/1280 elements`, 1023 rows across 5 files, exit 0. This plan's share is 376 rows over 376 distinct (file, clause) pairs, 65 carrying a companion cell"
        status: pass
      - kind: other
        ref: "the nine-row Set A table in docs/audit/29-style-dispositions/29-09.md was written BEFORE the file was edited; five of the nine safety sentences are byte-unchanged, including the WHOLE `## Stop conditions` section (zero findings, zero characters changed)"
        status: pass
      - kind: other
        ref: "the register proves every changed clause was dispositioned and nothing about any disposition's substance; the LANG-03 check is a named human reading the 376 rows against the diff"
        status: pass
    human_judgment: true
  - id: D4
    description: "The byte growth is measured per file with its mechanism named, not assumed (D-28)"
    verification:
      - kind: other
        ref: "seven-row growth table below, every value from `fs.statSync().size` against `git show 6d3b6f2`; batch +725 B (+2.34%), 19-workflow group 104,605 -> 105,330 (+0.69% this plan, +1.23% across 29-08 and 29-09 against the 104,048 phase-base measurement)"
        status: pass
      - kind: other
        ref: "the mechanism is SENTENCE SPLITTING — 101 new sentences for 725 bytes is 7.2 B per sentence, the cost of a repeated subject, not of restored articles"
        status: pass
      - kind: other
        ref: "no byte ceiling exists for a workflow and none was added; `git diff -- scripts/` is empty"
        status: pass
    human_judgment: false
  - id: D5
    description: "The regression lane and every other repo gate are green, and the gate wall clocks are recorded"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped: identical to the 29-05 / 29-06 / 29-07 / 29-08 baseline"
        status: pass
      - kind: integration
        ref: "check-foundation-guards 0 · check-banned-claims 0 · check-nul-bytes 0 · check-kit-refs 0 · validate-agent-factory 0 · typecheck 0 · freshness 0 at 48 pairs · freshness:catalog 0"
        status: pass
      - kind: other
        ref: "imperative-lexicon 0.05 / 0.04 / 0.04 s (29-08 baseline identical); diff-disposition 0.58 / 0.55 / 0.59 s (29-08 0.50 / 0.48 / 0.46 — the rise is the register growing from 647 to 1,023 rows); foundation guards 0.11 / 0.10 / 0.10 s"
        status: pass
    human_judgment: false

duration: 85min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 09: The Middle Seven Workflows Summary

**Thirteen of nineteen workflows now carry the profile — this plan's seven went 97 findings to 0 on both predicates while holding every `## Steps` bullet denominator CONSTANT (a departure from 29-08, and the strongest available answer to scan-narrowing), the release workflow's nine safety sentences were partitioned in writing before the file was opened with five of the nine ending byte-unchanged including its entire `## Stop conditions`, one frozen-text collision was surfaced and refused a deletion rather than a rationalisation, no predicate was widened and no scan set narrowed, and five restored mutations prove the guards still red my own prose.**

## Performance

- **Duration:** 85 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 8 (1 created, 7 modified)

## The finding movement, with the denominators beside it

Both numbers per file, side by side, because **a finding count that fell while its denominator also fell is a narrowed scan rather than a fixed document**. Findings from `node scripts/check-imperative-lexicon.js`; denominators from a Node walk mirroring the gate's own `deriveElements()` and reusing the same `fencedLineFlags()` authority, cross-checked against the gate's printed corpus totals on both sides.

| file | `guard_imperative_lexicon` | `guard_sentence_form` | bullets visited | sentences visited |
|---|---|---|---|---|
| `06-uat-pack.md` | 4 → **0** | 6 → **0** | 4 → **4** | 28 → 38 |
| `07-backlog-refinement.md` | 1 → **0** | 14 → **0** | 7 → **7** | 38 → 59 |
| `08-sprint-planning.md` | 9 → **0** | 8 → **0** | 13 → **13** | 42 → 49 |
| `09-daily-sweep.md` | 1 → **0** | 19 → **0** | 7 → **7** | 37 → 59 |
| `10-sprint-review.md` | 0 → **0** | 10 → **0** | 5 → **5** | 34 → 44 |
| `11-retro.md` | 0 → **0** | 11 → **0** | 4 → **4** | 30 → 43 |
| `12-release.md` | 1 → **0** | 13 → **0** | 6 → **6** | 38 → 56 |
| **batch** | **16 → 0** | **81 → 0** | **46 → 46** | **247 → 348** |

**The bullet denominator did not move — not per file, not in aggregate, and not at the corpus level.** That is the criterion plan 29-08 could not meet and recorded as a deviation. See § *the mechanic that made it possible*.

**The corpus arithmetic closes exactly.** Imperative 46 → 30, and 46 − 16 = 30. Sentence form 194 → 113, and 194 − 81 = 113. Bullets 139 → 139, and this batch's delta is 0. Sentences 1,934 → 2,035, and this batch's delta is +101. **Every corpus-level delta equals this batch's delta**, so the other twelve governed workflows and the twenty-eight non-workflow members contributed nothing in either direction.

```
[guard_imperative_lexicon] …
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2;
        1 excluded by the derived `GENERATED` marker
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  FAIL  imperative lexicon: 30 finding(s) over 139 elements

[guard_sentence_form] …
        2035 sentence(s) — 334 procedural, 1701 descriptive; by finding kind:
        bare-demonstrative-subject 26, descriptive-sentence-too-long 41,
        procedural-sentence-too-long 37, more-than-one-instruction 2, modal-in-procedural-step 7
  FAIL  sentence form: 113 finding(s) over 2035 elements
```

`30` and `113` are the **six remaining workflows plus the checklist, seed and contract parts**, and the gate correctly still exits **1**. Zero of either number belongs to this plan's seven.

### The untouched-file control, measured rather than assumed

| control | result | method |
|---|---|---|
| non-batch governed files byte-identical to the 29-08 tree | **40 of 40** | Node string equality of `readFileSync` against `git show 6d3b6f2:<path>` |
| non-batch `guard_imperative_lexicon` findings | **30 → 30** | per-file tally of the gate's own output, before and after |
| non-batch `guard_sentence_form` findings | **113 → 113** | same |
| non-batch files whose finding count moved | **none** | same |
| `git diff --stat` beyond this plan's files | seven workflows, the register — nothing else | `git diff --stat` |

### What the 97 were, by grammar

| finding kind | in this batch | where it concentrated |
|---|---:|---|
| `bold-label` (WP-01) | 9 | all nine in `08-sprint-planning.md` — the §6.2 sprint field list |
| `determiner-subject` (WP-01) | 2 | `06` |
| `actor-subject` (WP-01) | 2 | `06` — `BA/PM validates …`, `QE/E2E validates …` |
| `conditional-clause` (WP-01) | 1 | `07` — `When the \`bdd\` dial is not \`off\`, …` |
| `not-an-approved-verb` (WP-01) | 2 | `09` (`For each …`), `12` (`Work through …`) |
| `descriptive-sentence-too-long` (WP-03) | 55 | `09` 12, `12` 10 |
| `procedural-sentence-too-long` (WP-02) | 19 | `07` 5, `09` 5 |
| `bare-demonstrative-subject` (WP-06) | 5 | `12` 2, `08`/`09`/`10` 1 each |
| `modal-in-procedural-step` (WP-05) | 2 | `07` (`can deliver`), `09` (`should move`) |
| `and-slash-or` (WP-07) | **0** | none in this batch |
| `more-than-one-instruction` (WP-08) | **0** | none in this batch |
| **TOTAL** | **97** | over 46 bullets and 247 sentences in seven files |

## The mechanic that made the constant denominator possible

`deriveElements()` pushes **one bullet per list LINE** and then splits that line into sentences. A `## Steps` bullet carrying three conforming sentences is therefore **one bullet and three sentences**.

So every over-long step in this batch was fixed **inside its own bullet**:

```
- 1. The UAT Planner assembles the UAT pack — business scenarios, test data, … (36 words, 1 bullet)
+ 1. Assemble the UAT pack as typed notes per Workflow 16 (UAT Planner). The pack holds the
+    business scenarios, the test data, and the pass/fail criteria. It also holds the signoff
+    checklist naming the human role, and the known limitations. Work through `…uat-checklist.md`.
                                                                     (4 sentences, still 1 bullet)
```

Plan 29-08 used the other route — *"split the step into two steps"*, which is `guard_sentence_form`'s own remedy text — and its bullet denominators rose in five of six files, recorded there as Deviation 1. Both routes produce conforming text. This one leaves the number T-29-51 is about **provably fixed**, which is why it was chosen here and why it is written down: a later reader comparing the two summaries would otherwise read the difference as an inconsistency.

## `12-release.md` — the partition, written before the file was opened

The full three-way partition is in `docs/audit/29-style-dispositions/29-09.md`, written and committed in the same commit as the edit. Reproduced here because it is this plan's most load-bearing artifact.

**Set A — the clear-voice safety text that withholds a production deploy pending a named human.** Nine sentences. Meaning and register fixed; only shape may conform.

| # | what it is | outcome |
|---|---|---|
| A1 | the deploy-gate prose (`who must approve`, `human-confirmed`, mechanical enforcement is a later phase) | split into three sentences, **every clause word-for-word** |
| A2 | `The Release Manager prepares the release and requires approval; it never deploys prod itself.` | **byte-unchanged** |
| A3 | `Record a named human approval, then a named human confirms the production action.` | **byte-unchanged** |
| A4 | the `production_requires_human_confirmation: true` sentence (three permissions) | split into four sentences; `This is keyed to` → `The step is keyed to` (WP-06); **all three permissions word-for-word** |
| A5 | `only after a named human approves the deploy does the ticket move to \`Done\`` | promoted to its own sentence, **word-for-word** |
| A6 | the no-fabrication floor (`never fake a passing gate …`, `mark anything unverified \`UNKNOWN - verify\``) | split into three sentences, **word-for-word**, two sentence-initial capitals |
| A7 | **the whole `## Stop conditions` section** | **byte-unchanged — not one character** |
| A8 | `A release reaches \`RELEASED\` only after a named human approves and confirms the production action.` | **byte-unchanged** |
| A9 | `The commit records the release; it does not deploy it — never merge, never deploy; the production action stays human-confirmed and humans hold both.` | **byte-unchanged** |

**Five of the nine are byte-unchanged. The four that moved kept every permission clause word-for-word.** No permission widened, no actor changed, no modal entered or left a permission, and no clear-voice sentence acquired caveman voice. `12-release.md` carried **zero** findings in `## Stop conditions`, which is why that section is the one place in this batch where the honest answer was to do nothing at all.

**Set B — style-only prose** (the flow line, the Release Manager task enumeration, the context paragraph, the inputs bullet, step 5's verb, the board-move mechanics, the output enumeration, the trace mechanics, the `## Commit` artifact enumeration). **Set C — already conforming** (steps 1–4, the catalog-derived first sentence, and `## Stop conditions`).

The same partition-first treatment at lower ceremony was applied to `08-sprint-planning.md` and `10-sprint-review.md`: their human-decision sentences (`if an item is not Ready, leave it in \`Ready\` and do not commit it`, `leave acceptance to a named human`, `Never self-sign or fake a pass.`) kept their meaning and their words; only their sentence boundaries moved.

## The frozen sections — 65 companion cells, three kinds

`npm run check:diff-disposition` — **exit 0**:

```
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17,
        workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9;
        406 frozen clause(s), 55 frozen region(s); base 4d2b8f0
        30 watched file(s) changed since 4d2b8f0; 1280 changed clause(s) derived;
        1023 disposition row(s) across 5 file(s)
  PASS  diff disposition: 0 findings over 1280/1280 elements
```

This plan's share is **376 rows over 376 distinct (file, clause) pairs**, of which **65 intersect the frozen set**:

| shape | where | what moved | what did NOT |
|---|---|---|---|
| `## Commit` parenthetical → its own sentence | all seven | a 36-to-46-word instruction shed its artifact enumeration | the branch guard, the branch name, and `Never merge, never deploy; humans hold both.` are **byte-unchanged in every one**; no artifact left any list |
| `## Stop conditions` semicolon → full stop | `07`, `08`, `09` (both bullets), `10`, `11` | one internal semicolon per bullet | the bullet still **opens with its condition**; the prohibition's words are unchanged apart from its sentence-initial capital; every section's bullet count is unchanged |
| frozen **text** collision from outside a frozen section | `12` `## Metrics emitted` | **nothing — the clause is byte-unchanged on both sides** | see below |

`12-release.md` needed two sentences for its artifact enumeration rather than one (27 words in a single sentence), so it reuses `05-pr-quality-gate.md`'s existing `They also include …` continuation rather than a new shape. **`12-release.md`'s `## Stop conditions` was not touched at all.**

## The frozen collision that changed nothing and still owed a cell

`mark anything unverified \`UNKNOWN - verify\`` in `12-release.md`'s `## Metrics emitted` was reported **FROZEN by structuralSections**, on both the added and the removed side.

**Nothing about it changed.** It is stated verbatim in the `## Hard limits` of eight role files, the frozen set matches on **text** across the whole union, and the em-dash clause boundary in front of it already existed. Splitting the sentence *before* it put its source line in the diff, so the gate derived it on both sides and demanded a cell for a clause with an identical `before` and `after`.

**Dropping it was available and was refused.** 29-08's precedent covers a duplication a style pass **creates**; this repetition predates the phase. Deleting the release workflow's no-fabrication floor to clear a duplication finding is the wrong direction for the kit's most safety-critical file. The row names the eight frozen owners, states that the clause is byte-unchanged, and records the pre-existing WP-10 repetition as a residual this plan surfaced and does not own.

## The out-of-scope sections, counted before and after

Counted by a Node walk over the same `## `-heading anchor and `^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+` list-marker rule the gate uses. **A bare recursive grep was not used: a file classified as binary reports zero matches with no warning.**

| file | `## Inputs required` | `## Stop conditions` | `## Steps` | `## Agents involved` |
|---|---|---|---|---|
| `06-uat-pack.md` | 3 → **3** | 1 → **1** | 4 → **4** | 3 → **3** |
| `07-backlog-refinement.md` | 4 → **4** | 1 → **1** | 7 → **7** | 3 → **3** |
| `08-sprint-planning.md` | 3 → **3** | 2 → **2** | 13 → **13** | 2 → **2** |
| `09-daily-sweep.md` | 3 → **3** | 2 → **2** | 7 → **7** | 1 → **1** |
| `10-sprint-review.md` | 3 → **3** | 1 → **1** | 5 → **5** | 3 → **3** |
| `11-retro.md` | 3 → **3** | 1 → **1** | 4 → **4** | 1 → **1** |
| `12-release.md` | 4 → **4** | 1 → **1** | 6 → **6** | 1 → **1** |

**Not one bullet was added, removed, or moved between sections anywhere in this batch.** One `## Inputs required` bullet (`09-daily-sweep.md`) was split **for length only** and stays a noun phrase; one `## Stop conditions` bullet per touched file was split at its semicolon and stays a conditional.

## The byte growth, per file, with its mechanism named

Every value from `fs.statSync().size` against `Buffer.byteLength` of `git show 6d3b6f2:<path>`.

| file | before | after | delta | % |
|---|---:|---:|---:|---:|
| `06-uat-pack.md` | 3192 | 3294 | **+102** | +3.20% |
| `07-backlog-refinement.md` | 5423 | 5623 | **+200** | +3.69% |
| `08-sprint-planning.md` | 4395 | 4492 | **+97** | +2.21% |
| `09-daily-sweep.md` | 5482 | 5602 | **+120** | +2.19% |
| `10-sprint-review.md` | 3789 | 3825 | **+36** | +0.95% |
| `11-retro.md` | 3735 | 3802 | **+67** | +1.79% |
| `12-release.md` | 4932 | 5035 | **+103** | +2.09% |
| **batch total** | **30948** | **31673** | **+725** | **+2.34%** |

The running workflow-group total across plans 29-08 and 29-09:

| point | 19-workflow bytes | delta |
|---|---:|---:|
| `4d2b8f0` — phase base (measured; see 29-08 Deviation 2) | 104,048 | — |
| `6d3b6f2` — after 29-08 | 104,605 | +557 (+0.54%) |
| after 29-09 | **105,330** | **+725 (+0.69%)** |
| **running total** | | **+1,282 (+1.23%)** |

```sh
node -e 'const cp=require("child_process"),fs=require("fs");
const f=fs.readdirSync("agent-factory/workflows").filter(x=>x.endsWith(".md")).sort();
let b=0,a=0;for(const x of f){b+=Buffer.byteLength(cp.execSync(`git show 4d2b8f0:agent-factory/workflows/${x}`,{encoding:"utf8"}),"utf8");
a+=fs.statSync("agent-factory/workflows/"+x).size;}console.log(f.length,b,a);'
# 19  104048  105330
```

**The mechanism is sentence splitting, and nothing else.** 101 new sentences cost 725 bytes — **7.2 bytes per new sentence**, the cost of a repeated subject. There were no articles to restore: the governed corpus was already normal English before this phase, and the profile does not govern the fenced caveman blocks. This batch's per-sentence cost is slightly higher than 29-08's 5.5 B because more of its splits repeat a multi-word subject (`The Orchestrator`, `The UAT Planner`, `Release Manager`) rather than a pronoun.

**No file shrank in this batch**, which is the honest difference from 29-08 — that plan's one shrinking file came from dropping a duplicated prohibition, and this plan dropped nothing.

**No byte ceiling exists for a workflow, and none was added.** D-28 asks this phase to record what the profile costs; the record is above, and a later plan reasons from it.

## Falsifiability — the guards still red MY prose

This is the plan that turns seven more files green, which makes tuning a predicate to fit the prose maximally tempting. So it was measured. Five mutations against the **committed** tree, each asserted applied before the guard ran and each restored byte-identically after:

| mutation | file | expected arm | result |
|---|---|---|---|
| M0 — unmutated control | — | none | **0 own findings** |
| M1 — a bold label restored | `08` step 4 | `WP-01 [bold-label]` | **1 hit at `08:27`** |
| M2 — a determiner subject restored | `06` step 1 | `WP-01 [determiner-subject]` | **1 hit at `06:24`** |
| M3 — `should` re-added to a procedural step | `09` step 6 | `WP-05 [modal-in-procedural-step]` | **1 hit at `09:27`** |
| M4 — the release safety sentence re-merged | `12` step 6 | `WP-02 [procedural-sentence-too-long]` | **1 hit at `12:28`** |
| M5 — `Work through` restored | `12` step 5 | `WP-01 [not-an-approved-verb]` | **1 hit at `12:27`** |

Every mutation reported `applied=true` and `restored=true`, the post-restore control is clean again, and `git diff --stat -- agent-factory docs scripts` is **empty** afterwards. **No mutation required a predicate change to produce, and no predicate was touched to make any of them stop.**

## The disposition register

`docs/audit/29-style-dispositions/29-09.md` — **376 rows**, read back through the gate's own seven-column rule to confirm every one is visible (a row with any other cell count is silently skipped, which is the failure mode the count exists to catch).

**The judgement is in the file's prose; the coverage is in its table.** The release partition, the nine-bold-label decision, the constant-denominator mechanic, the verb-substitution table and the frozen-collision refusal are all argued above the table; each row then carries its group's accurate reason, with per-section overrides for `12-release.md` naming which partition set governed it.

**Two recording conventions are inherited from 29-08 and restated in the file rather than left to be noticed:** the pipe substitution (one clause quotes `` `READY_TO_RELEASE | BLOCKED | RELEASED` ``; its rows write `/`, which `normalizeSentence()` folds identically), and why 96 of the 376 rows carry unchanged text — a workflow paragraph is a single source line, so `git diff --unified=0` reports every clause on it.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 1** — 30 over 139 and 113 over 2,035; **zero of either belongs to this plan's seven** |
| `npm run check:diff-disposition` | **exit 0** — `0 findings over 1280/1280 elements`, 1,023 rows across 5 files |
| `node scripts/check-foundation-guards.js` | **exit 0** — the role track stays closed at 17/17; this plan touches no role file |
| `npm run check:banned-claims` | exit 0 |
| `node scripts/check-nul-bytes.js` · `check-kit-refs.js` | both exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — every required workflow section still present |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npm run freshness:catalog` | exit 0; `generate:catalog` wrote **zero bytes** and `git status --porcelain docs/catalog/` is clean |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05…29-08 baseline — unmoved) |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged |
| `APPROVED_STEP_VERBS.length` | **43**, unchanged — **no verb was added** |
| `git diff 91878ab^ HEAD -- scripts/ package.json` | **empty** — no predicate, no scan set, no dependency |
| imperative-lexicon wall clock, 3 runs | **0.05 / 0.04 / 0.04 s** (29-08 identical) |
| diff-disposition wall clock, 3 runs | **0.58 / 0.55 / 0.59 s** (29-08 0.50 / 0.48 / 0.46 — the register grew 647 → 1,023 rows) |
| foundation-guards wall clock, 3 runs | **0.11 / 0.10 / 0.10 s** (29-08 0.11 / 0.09 / 0.09) |
| largest governed file timing | `05-pr-quality-gate.md` 14,154 B — 176 clauses in **1.6 ms**; this batch's largest, `09-daily-sweep.md` 5,602 B, 61 clauses in **0.3 ms** |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — below it; 29-08 measured the same 7,966) |
| `.planning/STATE.md` longest backslash run | **1** over 11 total backslashes (§F-2 baseline 1 — unmoved) |

The F-2 escape-doubling mechanism stayed dormant and the superlinear-regex incident did not recur.

## Counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method.

| count | value | method |
|---|---:|---|
| governed corpus files | **47** | the gate's own `GOVERNED_CORPUS_PARTS`, read through `import()` |
| non-batch governed files byte-identical | **40 of 40** | Node string equality of `readFileSync` against `git show 6d3b6f2:<path>` |
| files failing a UTF-8 round-trip | **0** | `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file, over all seven plus the register |
| `## Steps` bullets, before / after | 46 / 46 (batch) · 139 / 139 (corpus) | Node walk reusing `fencedLineFlags()`; **cross-checked against the gate's printed totals on both sides** |
| sentences visited, before / after | 247 / 348 (batch) · 1,934 / 2,035 (corpus) | same walk, same cross-check |
| `## Inputs required` / `## Stop conditions` / `## Agents involved` bullets | unchanged in all seven | Node walk, section anchor + list marker |
| disposition rows in `29-09.md` | **376** | the gate's own seven-column row rule, re-implemented over the file and matching the gate's reported total |
| approved verbs | **43** | `APPROVED_STEP_VERBS.length` via `import()` |
| workflow-group bytes | 104,048 → 105,330 | `fs.statSync().size` vs `Buffer.byteLength(git show 4d2b8f0:…)` |

## Deviations from Plan

### 1. [Recorded judgement] The plan's "edit only the second set" contradicts its own acceptance, and the reading taken is written down

- **What the plan asks:** *"write a three-way sentence partition … Then edit only the second set"* — the second set being the style-only prose, with Set A the clear-voice safety text.
- **What is also true:** four Set A sentences carry findings (A1 37 words, A4 29 words plus a bare demonstrative, A5 inside a 36-word sentence, A6 29 words). Editing only Set B leaves `12-release.md` non-conforming and makes the plan's own acceptance — *"Both guards report zero findings for all seven files"* — unreachable.
- **The reading taken**, from the plan objective's own wording (*"The shape may conform; the permission may not move, and the clear-voice register stays"*): Set A membership governs **what may change about a sentence** — its shape only — not **whether the sentence is touched**.
- **What makes that checkable rather than assertable:** the nine-row Set A table names every safety sentence and its outcome; five of the nine are byte-unchanged; the four that moved kept every permission clause word-for-word, and the whole `## Stop conditions` section is untouched.
- Recorded here and in the register rather than silently resolved, because a plan instruction that cannot be followed literally deserves an explicit account of what was done instead.

### 2. [Deliberate divergence from 29-08] The bullet denominators were held CONSTANT rather than allowed to rise

- 29-08 recorded as its Deviation 1 that the plan's *"denominator did not move"* criterion could not be met, because the prescribed remedy (*"split the step into two steps"*) makes a split step a second bullet.
- This plan met the criterion, by splitting inside the bullet instead. Both are conforming text; the plans are not inconsistent, they took different routes to the same rule.
- Written down because a reader comparing the two summaries would otherwise read `4 → 10` in one and `4 → 4` in the other as a contradiction rather than as a method change.

### 3. [Rule 2 — Safety] A frozen-text collision was refused a deletion

`mark anything unverified \`UNKNOWN - verify\`` in `12-release.md`. Covered in full above. 29-08 dropped a clause rather than dispositioning it; this plan did the opposite, and the difference is that 29-08's duplication was **created** by its style pass while this one **predates the phase** and sits in the kit's most safety-critical file.

### 4. [Measured deviation] `docs/catalog/README.md` is in the plan's `files_modified` and is byte-unchanged

- The plan's Task 1 action says *"Where a `## When to use` first sentence changes, regenerate the catalog in this plan's commit."*
- **No `## When to use` FIRST sentence changed in any of the seven.** The changes in `07`–`12` are to the second and later sentences of that paragraph. `generate:catalog` was run anyway and wrote zero bytes; `freshness:catalog` exits 0 and a second generation leaves `git status --porcelain docs/catalog/` clean. The condition the regeneration attaches to did not arise, and the gate confirms it rather than the absence being assumed. This is the same outcome 29-08 recorded.

### 5. [Corrected baseline, inherited] The plan's 104,094-byte workflow baseline is not reproducible

The plan's Task 2 action names *"the 104,094-byte pre-phase baseline"*. Measured at the phase's recorded base commit `4d2b8f0`, the 19 workflow files total **104,048 bytes** — the figure 29-03's corpus table and 29-08's growth table both record. 104,048 is used throughout, with its command; 104,094 has no source.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. None of the seven workflows carries `TODO`, `FIXME`, `placeholder` or `coming soon`, and every removed clause's content is either restated in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — whether a rewritten workflow still instructs the same act is a human judgement.** The register proves every changed clause was dispositioned; it proves nothing about any disposition's substance. This is sharpest in `12-release.md`, and the Set A table exists to narrow what a reviewer must check rather than to decide it for them.
- **The kit-wide `Each role reads…` paragraph now has one spelling in thirteen workflows and the 29-word original in six.** 29-08's live WP-09 split is **narrowed, not closed** — it remains open by construction until 29-10 and 29-11 land. The canonical replacement stays in `29-08.md`; this plan copied it rather than re-deriving it, and `09-daily-sweep.md` and `11-retro.md` carry the single-role variant of the same split, recorded per row.
- **`mark anything unverified \`UNKNOWN - verify\`` is a pre-existing WP-10 repetition across eight roles and two workflows.** Surfaced by this plan's diff, refused a deletion, and not owned by this plan. Whoever rewrites `13-incident.md` will meet it again.
- **The WP-09 workflow-naming defect is untouched.** Three of nineteen workflow display names are lowercase (`context read/write`, `task claim + schedule`, `context compaction`), pinned as an observation in `kit-model.test.ts` since 29-03. All three are in the remaining six, so the fix belongs to the plan that rewrites those headings.
- **Six kit files still carry retired v1.x handoff vocabulary** (29-RESEARCH §A-2). None of the seven in this batch is among them.
- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is still not seen.** 29-03's recorded residual, unchanged.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here and reports 0 failures over all eight files; nothing in the build would have caught a failure. Every edit went through the structured editor — no `perl -pi -e`, no byte-level rewrite.
- **`security-nfr.md` is still 101 bytes above its advisory WARN tier.** 29-07's residual, untouched; plan 29-13 owns the re-baseline.
- **Six governed workflows plus the checklist, seed and contract parts remain unrewritten**, which is why both predicates still exit 1. That is 29-10 through 29-12's work.

## Threat Flags

None beyond the plan's own register. Zero packages installed (`git diff 91878ab^ HEAD -- package.json` is empty), no network path and no write path added.

- **T-29-50 (release production-confirmation language) — mitigated and recorded.** The three-way partition was written before the file was opened; five of nine Set A sentences are byte-unchanged including the whole `## Stop conditions`; the four that moved kept every permission clause word-for-word; the reshaped sentence still names `production_requires_human_confirmation: true`.
- **T-29-51 (scan-set narrowing to reach green) — mitigated and measured.** `GOVERNED_CORPUS_COUNT` still 47, `git diff -- scripts/` empty, **every bullet denominator unchanged**, the sentence denominator published per file, and the corpus deltas proven equal to this batch's deltas.
- **T-29-52 (reword of a frozen structural section) — mitigated.** 65 frozen intersections, every one carrying a named companion cell; the disposition gate exits **0** on a real commit at 1,280/1,280 elements.
- **T-29-53 (rewriting out-of-scope bullets to look conformant) — mitigated by count.** Four sections' bullet counts asserted unchanged per file, before and after, in all seven.
- **T-29-54 (an unapproved verb entering the list silently) — closed by absence.** `APPROVED_STEP_VERBS.length` is **43** and `git diff -- scripts/` is empty. **No verb was added.**
- **T-29-55 (occurrence counts) — mitigated.** Every count above names its method; no bare recursive grep was used for any of them; the denominator walk is cross-checked against the gate's own printed totals on both sides.
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-09.md
```

Commits claimed, verified in `git log`:

```
FOUND: 91878ab  refactor(29-09): seven workflows onto the canonical step form, release safety text partitioned first
```
