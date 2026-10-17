---
phase: 29-controlled-language-voice-guard-rebuild
plan: 08
subsystem: docs
tags: [kit-prose, workflows, controlled-language, canonical-step-form, sentence-bounds, frozen-sections, dispositions, byte-growth]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 style contract every row below cites"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 03
    provides: "guard_imperative_lexicon and guard_sentence_form with their RED 81/125 and 264/1816 baseline, APPROVED_STEP_VERBS, the two sentence bounds and the 47-file four-part corpus"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, FROZEN_SECTION_ANCHORS, the docs/audit/29-style-dispositions/ contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 07
    provides: "the closed role track (foundation guards green at 17/17) and the precedent that a safety rule which cannot survive compression is DELETED from the compressed position rather than paraphrased"
provides:
  - "six of nineteen workflows on the canonical step form and both sentence bounds — 105 findings to 0, per file, on both new predicates"
  - "docs/audit/29-style-dispositions/29-08.md — 418 rows over 418 distinct changed clauses, 45 of them carrying a frozen-section companion cell"
  - "the measured per-file byte cost of the profile on workflow prose: +557 B over the batch, +0.54% over the whole 19-workflow group — the evidence D-28 defers the ceiling question to"
  - "the canonical replacement for the kit-wide `Each role reads…` context paragraph, for plans 29-09..29-11 to apply unchanged to the remaining thirteen workflows"
  - "the recorded finding that a split step RAISES the visited denominator, with the per-file numbers that make a raised denominator distinguishable from a narrowed one"
affects: [29-09, 29-10, 29-11, 29-12, 29-13]

actuals:
  tokens: 64573
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "When a merged over-long sentence is caused by the SPLITTER's boundary rule rather than by the prose, reorder or re-punctuate the boundary — never move a period outside a quotation mark to fool it, and never hide the text in a fence"
    - "A style split that mints a standalone imperative can accidentally COPY a prohibition that another file owns; the frozen-set text match catches it, and the right answer is to drop the copy, not to write it a companion cell"
    - "A raised denominator and a narrowed one look identical in a falling finding count — publish both numbers per file, and cross-check that the corpus delta equals the sum of the touched files' deltas"
    - "A register that is itself a markdown table cannot carry a literal pipe in a cell: the row silently fails the column count and is never read"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-08.md
  modified:
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - agent-factory/workflows/01-bootstrap-brownfield.md
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/workflows/05-pr-quality-gate.md

key-decisions:
  - "The actor is NOT deleted from a step; it moves to a trailing parenthetical wherever the workflow runs several agents in sequence, which is the shape the guard's own remedy text prescribes. In 02-idea-to-epics.md, where `## Agents involved` names exactly one agent, the parenthetical is redundant and was dropped instead"
  - "Three of the five modals removed were PROHIBITIONS, and each now says `never` rather than `may not` — stronger than the modal it replaced, which is the only direction a safety rule may move under a style pass"
  - "`Say no to bloat.` was DROPPED from 02-idea-to-epics.md rather than dispositioned: the split would have minted a workflow copy of ba-pm.md's `## Hard limits`, and writing it a companion cell would have recorded the duplication as considered rather than as prevented"
  - "Two sentence merges were caused by the SPLITTER's boundary rule (a closing quotation mark, a closing bold marker), not by the prose. Moving a period outside its quotation mark and fencing the text were both available and refused; the paragraph was reordered and four bold labels moved their full stop outside the bold instead"
  - "The visited denominators ROSE in five of six files, and that is recorded rather than reconciled away — the plan's acceptance asks for unchanged denominators, and the plan's own prescribed remedy (`split the step into two steps`) makes that impossible"
  - "The plan's 104,094-byte workflow baseline is not reproducible; the measured figure at the phase base commit is 104,048, with its command"

patterns-established:
  - "The judgement lives in the register's prose and the coverage lives in its table — at 418 rows, per-row prose would be filler, so the four transformations are argued once, in full, above the table"
  - "Mutation-test your OWN prose after turning a guard green on it: four mutations, each asserted applied, each restored byte-identical, each expected to red a NAMED arm"

requirements-completed: []

coverage:
  - id: D1
    description: "Six workflows carry the profile: canonical step form, both sentence bounds, no banned constructions (LANG-02, LANG-04 — partial; seven workflows and the checklist/seed/contract parts remain for 29-09..29-12)"
    requirement: "LANG-02"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — ZERO findings for all six files on BOTH predicates, down from 35 + 70 = 105; the corpus totals fall by exactly that amount (81 -> 46 and 264 -> 194), which proves the other thirteen files' findings did not move"
        status: pass
      - kind: other
        ref: "four hermetic mutations against the committed tree (bold label restored, actor subject restored, modal re-added, two split sentences re-merged) each red the NAMED arm at the NAMED file and line; each was asserted applied before the guard ran and restored byte-identical after"
        status: pass
      - kind: other
        ref: "the gate still exits 1 overall — thirteen governed files are unrewritten, and the per-file zero is what this plan proves"
        status: pass
    human_judgment: false
  - id: D2
    description: "The out-of-scope sections are provably untouched and the corpus denominator is provably unchanged"
    verification:
      - kind: integration
        ref: "`## Inputs required` bullet counts unchanged in all six (3/3/3/3/3/5) and `## Stop conditions` bullet counts unchanged in all six (1/2/1/2/2/3), counted by a Node walk over the same section-anchor + list-marker rule the gate uses"
        status: pass
      - kind: integration
        ref: "GOVERNED_CORPUS_COUNT still 47, in four parts (workflows 19, checklists 13, seedTemplates 13, contracts 2) with the one generated file still excluded by its derived marker"
        status: pass
      - kind: other
        ref: "all 41 untouched governed files are byte-identical to the pre-plan tree, compared by Node string equality against `git show`; `git diff --stat` names only this plan's six workflows and its disposition file"
        status: pass
      - kind: other
        ref: "`git diff d6b397c^ HEAD -- scripts/` is EMPTY — no predicate widened, no scan set narrowed, APPROVED_STEP_VERBS still 43 members"
        status: pass
    human_judgment: false
  - id: D3
    description: "The frozen structural sections were treated one judgement at a time, each recorded (LANG-03, partial)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 808/808 elements`, 647 rows across 4 files, exit 0. This plan's share is 418 rows over 418 distinct (file, clause) pairs, 45 of them carrying a companion cell"
        status: pass
      - kind: other
        ref: "the 45 frozen rows are two kinds and nothing else: two `## Stop conditions` bullets whose internal semicolon became a full stop (the withheld permission byte-identical), and the six `## Commit` sections whose parenthetical artifact enumeration became its own sentence (branch guard and `Never merge, never deploy; humans hold both.` byte-unchanged in every one)"
        status: pass
      - kind: other
        ref: "the register proves every changed clause was dispositioned and nothing about any disposition's substance; the LANG-03 check is a named human reading the 418 rows against the diff"
        status: pass
    human_judgment: true
  - id: D4
    description: "The byte growth is measured per file with its mechanism named, not assumed (D-28)"
    verification:
      - kind: other
        ref: "six-row growth table below, every value from `fs.statSync().size` against `git show d6b397c^`; batch +557 B (+1.67%), 19-workflow group 104,048 -> 104,605 (+0.54%)"
        status: pass
      - kind: other
        ref: "the mechanism is SENTENCE SPLITTING, not article restoration — the governed corpus was already normal English before this phase, and 02-idea-to-epics.md SHRANK by 25 B because two actor prefixes and one duplicated prohibition came out"
        status: pass
      - kind: other
        ref: "no byte ceiling exists for a workflow and none was added; `git diff -- scripts/check-foundation-guards.ts` is empty"
        status: pass
    human_judgment: false
  - id: D5
    description: "The regression lane and every other repo gate are green, and both new gates' wall clocks are recorded"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 51 files, 1,724 passed, 2 skipped: identical to the 29-05 / 29-06 / 29-07 baseline"
        status: pass
      - kind: integration
        ref: "check-foundation-guards 0 · check-banned-claims 0 · check-nul-bytes 0 · check-kit-refs 0 · validate-agent-factory 0 · typecheck 0 · freshness 0 at 48 pairs · freshness:catalog 0"
        status: pass
      - kind: other
        ref: "imperative-lexicon 0.05 / 0.04 / 0.04 s (29-03 baseline 0.04 / 0.04 / 0.04); diff-disposition 0.50 / 0.48 / 0.46 s; foundation guards 0.11 / 0.09 / 0.09 s. The largest governed file counts 2,081 words across 181 sentences in 1.2 ms"
        status: pass
    human_judgment: false

duration: 70min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 08: The First Six Workflows Summary

**The workflow track opened at six of nineteen and every finding in those six went to zero on both new predicates — 105 to 0 — with the largest non-conforming group in the kit (41 bold-label bullets, eleven of them here) converted, three of five removed modals turning a hedged prohibition into an unhedged one, one clause DROPPED rather than dispositioned because the split would have copied a role's hard limit into a workflow, no predicate widened and no scan set narrowed, and the guards proven still able to red my own prose by four restored mutations.**

## Performance

- **Duration:** 70 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 7 (1 created, 6 modified) — 628 insertions, 65 deletions since `d6b397c^`

## The finding movement, with the denominators beside it

Both numbers per file, side by side, because **a finding count that fell while its denominator also fell is a narrowed scan rather than a fixed document**. Findings are from `node scripts/check-imperative-lexicon.js`; denominators are from a Node walk that reuses the shared `fencedLineFlags()` authority and mirrors the gate's own `deriveElements()`, whose faithfulness is asserted by its per-part sums reproducing the gate's printed corpus totals **exactly** on both sides (125 / 1,816 before, 139 / 1,934 after).

| file | `guard_imperative_lexicon` | `guard_sentence_form` | bullets visited | sentences visited |
|---|---|---|---|---|
| `00-bootstrap-greenfield.md` | 5 → **0** | 10 → **0** | 6 → 10 | 38 → 55 |
| `01-bootstrap-brownfield.md` | 5 → **0** | 8 → **0** | 5 → 6 | 36 → 51 |
| `02-idea-to-epics.md` | 4 → **0** | 3 → **0** | 4 → 5 | 27 → 31 |
| `03-epic-to-tickets.md` | 5 → **0** | 4 → **0** | 5 → 8 | 31 → 37 |
| `04-ticket-to-pr.md` | 5 → **0** | 7 → **0** | 6 → 11 | 42 → 59 |
| `05-pr-quality-gate.md` | 11 → **0** | 38 → **0** | 11 → 11 | 105 → 164 |
| **batch** | **35 → 0** | **70 → 0** | **37 → 51** | **279 → 397** |

**The corpus arithmetic closes exactly, and that is the proof that nothing outside this batch moved.** The whole-corpus imperative count went 81 → 46, and 81 − 35 = 46. The whole-corpus sentence-form count went 264 → 194, and 264 − 70 = 194. The bullet denominator went 125 → 139, and 51 − 37 = 14. The sentence denominator went 1,816 → 1,934, and 397 − 279 = 118. **Every corpus-level delta is exactly this batch's delta**, so the other thirteen governed files contributed nothing in either direction.

**The denominators ROSE. They did not fall, and the direction is the whole point** — see *Deviations* 1.

```
[guard_imperative_lexicon] …
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2; 1 excluded by the derived `GENERATED` marker
        139 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  FAIL  imperative lexicon: 46 finding(s) over 139 elements

[guard_sentence_form] …
        1934 sentence(s) — 301 procedural, 1633 descriptive; by finding kind: descriptive-sentence-too-long 96,
        procedural-sentence-too-long 56, modal-in-procedural-step 9, bare-demonstrative-subject 31,
        more-than-one-instruction 2
  FAIL  sentence form: 194 finding(s) over 1934 elements
```

`46` and `194` are the **thirteen unrewritten files**, and the gate correctly still exits **1**. Zero of either number belongs to this plan's six.

### What the 105 were, by grammar

| finding kind | in this batch | where it concentrated |
|---|---:|---|
| `bold-label` (WP-01) | 11 | all eleven in `05-pr-quality-gate.md` — the concentration the research named |
| `determiner-subject` (WP-01) | 11 | `00` 3, `01` 2, `03` 1, `04` 3, `05` 0 |
| `actor-subject` (WP-01) | 11 | `00` 2, `01` 2, `02` 4, `03` 2, `04` 2 |
| `conditional-clause` (WP-01) | 2 | `01` 1, `03` 1 |
| `not-an-approved-verb` (WP-01) | 1 | `03` — `Tickets are written to …` |
| `procedural-sentence-too-long` (WP-02) | 30 | `05` 20 |
| `descriptive-sentence-too-long` (WP-03) | 31 | `05` 11 |
| `modal-in-procedural-step` (WP-05) | 6 | `05` 5, `01` 1 |
| `bare-demonstrative-subject` (WP-06) | 2 | `05` — two `This is …` openers |
| `more-than-one-instruction` (WP-08) | 1 | `00` — `Seed … and confirm …` |
| `and-slash-or` (WP-07) | **0** | none in this batch |
| **TOTAL** | **105** | over 37 bullets and 279 sentences in six files |

## The byte growth, per file, with its mechanism named

Every value from `fs.statSync().size` on the working tree against `Buffer.byteLength` of `git show d6b397c^:<path>`.

| file | before | after | delta | % |
|---|---:|---:|---:|---:|
| `00-bootstrap-greenfield.md` | 4547 | 4622 | **+75** | +1.65% |
| `01-bootstrap-brownfield.md` | 4217 | 4247 | **+30** | +0.71% |
| `02-idea-to-epics.md` | 2716 | 2691 | **−25** | **−0.92%** |
| `03-epic-to-tickets.md` | 3274 | 3308 | **+34** | +1.04% |
| `04-ticket-to-pr.md` | 4809 | 4929 | **+120** | +2.50% |
| `05-pr-quality-gate.md` | 13831 | 14154 | **+323** | +2.34% |
| **batch total** | **33394** | **33951** | **+557** | **+1.67%** |

Against the whole workflow group:

```sh
node -e 'const cp=require("child_process"),fs=require("fs");
const f=fs.readdirSync("agent-factory/workflows").filter(x=>x.endsWith(".md")).sort();
let b=0,a=0;for(const x of f){b+=Buffer.byteLength(cp.execSync(`git show 4d2b8f0:agent-factory/workflows/${x}`,{encoding:"utf8"}),"utf8");
a+=fs.statSync("agent-factory/workflows/"+x).size;}console.log(f.length,b,a);'
# 19  104048  104605      ->  +557 B, +0.54%
```

**The mechanism is sentence splitting, and nothing else.** Splitting adds a subject and a verb per new sentence; `05-pr-quality-gate.md` gained 59 sentences and 323 bytes, which is **5.5 bytes per new sentence** — the cost of a repeated subject, not of restored articles. There were no articles to restore: the governed corpus was already normal English before this phase touched it, and the profile does not govern the fenced caveman blocks where the article density is low.

**One file SHRANK.** `02-idea-to-epics.md` lost 25 bytes because four `BA/PM ` actor prefixes came off (the workflow names exactly one agent, so the parenthetical would be pure redundancy) and one duplicated prohibition was dropped. That is the honest counterweight to the growth, and it is why this table is per file rather than one number.

**No byte ceiling exists for a workflow, and none was added.** `git diff d6b397c^ HEAD -- scripts/` is empty. D-28 asks this phase to record what the profile costs; the record is above, and a later plan reasons from it.

## The out-of-scope sections, counted before and after

Counted by a Node walk over the same `## `-heading anchor and `^ {0,3}(?:[-*+]|\d{1,3}[.)])\s+` list-marker rule the gate uses. **A bare recursive grep was not used: a file classified as binary reports zero matches with no warning.**

| file | `## Inputs required` | `## Stop conditions` | `## Steps` |
|---|---|---|---|
| `00-bootstrap-greenfield.md` | 3 → **3** | 1 → **1** | 6 → 10 |
| `01-bootstrap-brownfield.md` | 3 → **3** | 2 → **2** | 5 → 6 |
| `02-idea-to-epics.md` | 3 → **3** | 1 → **1** | 4 → 5 |
| `03-epic-to-tickets.md` | 3 → **3** | 2 → **2** | 5 → 8 |
| `04-ticket-to-pr.md` | 3 → **3** | 2 → **2** | 6 → 11 |
| `05-pr-quality-gate.md` | 5 → **5** | 3 → **3** | 11 → **11** |

**Not one `## Inputs required` or `## Stop conditions` bullet was added, removed, or rewritten into an imperative.** They are noun phrases and conditionals by design, out of `guard_imperative_lexicon`'s scope; reshaping them would be conforming to a rule the profile does not make. Only `## Steps` moved, and only upward.

## The frozen sections — 45 companion cells, two kinds

`npm run check:diff-disposition` — **exit 0**:

```
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17,
        workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9;
        398 frozen clause(s), 55 frozen region(s); base 4d2b8f0
        23 watched file(s) changed since 4d2b8f0; 808 changed clause(s) derived; 647 disposition row(s) across 4 file(s)
  PASS  diff disposition: 0 findings over 808/808 elements
```

This plan's share is **418 rows over 418 distinct (file, clause) pairs**, of which **45 intersect the frozen set**. All 45 are one of exactly two shapes:

| shape | where | what moved | what did NOT |
|---|---|---|---|
| `## Stop conditions` semicolon → full stop | `00`, `02` — one bullet each | a 27-word bullet became two sentences | `Do not invent the user, the pain, or the value.` is **byte-identical**; the bullet is still a conditional, not an imperative; the section's bullet count is unchanged |
| `## Commit` parenthetical → its own sentence | all six | a 38-to-65-word leading instruction shed its artifact enumeration | the branch guard and `Never merge, never deploy; humans hold both.` are **byte-unchanged in all six**; no artifact left the list |

`04-ticket-to-pr.md` is the one variation: its `## Commit` ran to 52 words even after the enumeration came out, so the branch-guard parenthetical became its own sentence — `Never a protected branch: the implementation already lives on a \`grugops/ticket-to-pr-<id>\` working branch per \`autonomy=pr\`.` The guard, the branch name and the `autonomy=pr` rule all survive intact, and the row names the reason.

**No safety rule was compressed to make a sentence bound.** Where a rule would not survive a split, the split went elsewhere in the sentence.

## The clause that was DROPPED rather than dispositioned

`02-idea-to-epics.md` step 2 ended `…and the known risks; says no to bloat`. The split promoted that trailing clause to a standalone `Say no to bloat.` — and `guard_diff_disposition` immediately reported it **FROZEN by structuralSections**, because it normalizes to the exact clause `agent-factory/roles/ba-pm.md:47` states in its own `## Hard limits`.

**A style pass had just minted a workflow copy of a role's prohibition.** Writing it a companion cell was available and was refused: WP-10 and D-19 give a prohibition exactly one home, and the register would then have recorded the duplication as *considered* rather than as *prevented*. The clause was dropped. The step keeps the act — setting the MVP scope with its explicit non-goals and known risks — and `ba-pm.md` keeps the prohibition, byte-unchanged, as its sole home.

This is the frozen-set **text** match earning its keep, in the direction nobody planned for: it caught a duplicate being **created**, not a frozen sentence being edited.

## The two merges the SPLITTER caused, and the two fixes refused

`guard_sentence_form` ends a sentence at `.`, `!` or `?` **followed by whitespace**. Two constructions defeat that, and no rewording *inside* the affected sentence can fix either:

| construction | why it merges | example |
|---|---|---|
| a quoted request ending `… seed the board."` | the character before the space is `"` | a 38-word merged unit in `00`'s `## When to use` |
| a bold label ending `**Deterministic prefetch.**` | the character before the space is `*` | a 41-word merged unit in `05`'s step 1 |

**Two fixes were available and both were refused.** Moving the period outside its quotation mark (`… seed the board".`) would have imposed a punctuation convention on the kit to satisfy a scanner. Wrapping the text in a fence would have removed it from the scan entirely — a scan narrowing wearing a formatting change's clothes.

What was done instead: in `00` and `01` the `## When to use` paragraph was **reordered** so the quoted Orchestrator request ends it, and in `05` four bold labels that survive as emphasis carry their full stop **outside** the bold (`**Verdict emission (green result only)**.`). **The words are unchanged in every case**; only their order and one asterisk-vs-period position moved.

## The modals — three prohibitions got stronger

| file | before | after | what it is |
|---|---|---|---|
| `05` | `mandatory_gates … must pass` | `Pass every gate named in \`mandatory_gates\` …` | obligation → direct instruction |
| `05` | `a repo with no applicable linter can still reach …` | `A repo with no applicable linter still reaches …` | permission → fact |
| `05` | `the checker could not run (e.g. …)` | `the checker failed to run, for example …` | description of exit `2` |
| `05` | `the agent may not do it` | `the agent never does it` | **prohibition, strengthened** |
| `05` | `the agent may not self-author a justification` | `The agent never self-authors a justification` | **prohibition, strengthened** |
| `01` | `the known build/test/lint commands it can confirm` | `the build/test/lint commands the walk confirms` | modal dropped, meaning kept |

**`never` is stronger than `may not`, which is the only direction a safety rule is allowed to move under a style pass.** No gate name, threshold, selector value, exit code or result vocabulary changed anywhere in this batch: `PASS`, `PASS_WITH_RISKS`, `BLOCKED`, `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, `SPLIT_REQUIRED`, `SPLIT_REQUIRED`, `UNKNOWN - verify` and `§14-gate` all appear with their original spelling.

## Falsifiability — the guards still red MY prose

This is the plan that turns six files green, which makes tuning a predicate to fit the prose maximally tempting. So it was measured. Four mutations against the **committed** tree, each asserted applied before the guard ran and each restored byte-identically after:

| mutation | file | expected arm | result |
|---|---|---|---|
| M0 — unmutated control | — | none | **0 own findings** |
| M1 — a bold label restored | `05` step 2 | `WP-01 [bold-label]` | **exit 1**, 1 hit at `05:30` |
| M2 — an actor subject restored | `02` step 3 | `WP-01 [actor-subject]` | **exit 1**, 1 hit at `02:24` |
| M3 — `may not` re-added to a procedural step | `05` test-integrity | `WP-05 [modal-in-procedural-step]` | **exit 1**, 1 hit at `05:37` |
| M4 — two split sentences re-merged | `00` context paragraph | `WP-03 [descriptive-sentence-too-long]` | **exit 1**, 1 hit at `00:18`, `29 words, bound 25` |

Every mutation reported `restored=true`, and `git diff --stat -- agent-factory docs scripts` is **empty** afterwards. No mutation required a predicate change to produce, and no predicate was touched to make any of them stop.

## The disposition register

`docs/audit/29-style-dispositions/29-08.md` — **418 rows**, read back through the gate's own seven-column rule to confirm every one is visible (a row with any other cell count is silently skipped, which is the failure mode the count exists to catch).

**The judgement is in the file's prose; the coverage is in its table.** At 418 rows, per-row bespoke prose would be filler, so the four transformations are argued once and in full above the table — what the canonical step form is, why the actor moves rather than disappears, which modals became `never`, and which two merges the splitter caused. Each row then carries its group's accurate reason plus the six per-clause overrides where the judgement differed from its group.

**Two recording conventions are stated in the file rather than left to be noticed:**

1. **The pipe.** `readDispositionRows()` splits a row on `|`, so a cell containing a literal pipe fails the seven-column check and the row is **never read**. Two rows quote `` `off | ui-or-critical-path | always` ``; both write `/` instead. `normalizeSentence()` folds every non-alphanumeric to a space, so `|` and `/` normalize identically and the clause match is unaffected.
2. **Why unchanged text gets a row.** A workflow paragraph is a **single source line**. `git diff --unified=0` reports the whole line as touched when any clause on it moves, and the gate derives every clause on it. 128 of the 418 rows are unchanged text on a changed line, each marked as such — the same accounting 29-07 recorded, at six times the volume because these paragraphs are long.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 1** — 46 over 139 and 194 over 1,934; **zero of either belongs to this plan's six** |
| `npm run check:diff-disposition` | **exit 0** — `0 findings over 808/808 elements`, 647 rows across 4 files |
| `node scripts/check-foundation-guards.js` | **exit 0** — *ALL CHECKS PASSED*; the role track closed in 29-07 and this plan does not touch a role file |
| `npm run check:banned-claims` | exit 0 |
| `node scripts/check-nul-bytes.js` · `check-kit-refs.js` | both exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — every required workflow section still present |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npm run freshness:catalog` | exit 0; a second `generate:catalog` leaves `git status --porcelain docs/catalog/` **clean** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05/29-06/29-07 baseline — unmoved) |
| `GOVERNED_CORPUS_COUNT` | **47**, unchanged |
| `APPROVED_STEP_VERBS.length` | **43**, unchanged — **no verb was added** |
| `git diff d6b397c^ HEAD -- scripts/ package.json` | **empty** — no predicate, no scan set, no dependency |
| imperative-lexicon wall clock, 3 runs | **0.05 / 0.04 / 0.04 s** (29-03 baseline 0.04 / 0.04 / 0.04) |
| diff-disposition wall clock, 3 runs | **0.50 / 0.48 / 0.46 s** |
| foundation-guards wall clock, 3 runs | **0.11 / 0.09 / 0.09 s** (29-07: 0.12 / 0.10 / 0.10) |
| largest governed file timing | `05-pr-quality-gate.md` 14,154 B — 2,081 words over 181 sentences in **1.2 ms**, far under the 1 s bound |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — **below** it) |
| `.planning/STATE.md` longest backslash run | **1** (§F-2 baseline 1 — unmoved) |

The F-2 escape-doubling mechanism stayed dormant and the superlinear-regex incident did not recur.

## Counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every count names its method.

| count | value | method |
|---|---:|---|
| governed corpus files | **47** | the gate's own `GOVERNED_CORPUS_PARTS`, read through `import()` |
| untouched governed files byte-identical | **41 of 41** | Node string equality of `readFileSync` against `git show d6b397c^:<path>` |
| files failing a UTF-8 round-trip | **0** | `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file, over all six plus the register |
| `## Steps` bullets, before / after | 37 / 51 (batch) · 125 / 139 (corpus) | Node walk reusing `fencedLineFlags()`; **cross-checked against the gate's printed totals on both sides** |
| sentences visited, before / after | 279 / 397 (batch) · 1,816 / 1,934 (corpus) | same walk, same cross-check |
| `## Inputs required` / `## Stop conditions` bullets | unchanged in all six | Node walk, section anchor + list marker |
| disposition rows in `29-08.md` | **418** | the gate's own seven-column row rule, re-implemented over the file and matching the gate's reported total |
| approved verbs | **43** | `APPROVED_STEP_VERBS.length` via `import()` |

## Deviations from Plan

### 1. [Recorded, not fixed] The visited denominators ROSE, and the plan's acceptance asks for them unchanged

- **What the plan asks:** *"with the visited bullet count for those files unchanged from plan 29-03's RED transcript — the denominator did not move, only the findings."*
- **What happened:** the bullet denominator rose 37 → 51 across the batch and the sentence denominator rose 279 → 397. Per file, five of six rose; `05-pr-quality-gate.md`'s **bullet** count is the one that held at 11.
- **Why the criterion as written cannot be met.** The plan's own prescribed remedy for a `procedural-sentence-too-long` finding is *"split the step into two steps"*, and `guard_sentence_form`'s remedy text says the same. A split step **is** a second bullet. Satisfying the literal criterion would have required leaving over-long steps unsplit — that is, leaving findings.
- **Why the criterion's PURPOSE is nonetheless met, and measured.** T-29-44 is *scan-set narrowing to reach green*: a denominator that **falls** makes a falling finding count meaningless. Every denominator here **rose**, which is the opposite failure mode — more elements scanned, all of them clean. Three independent numbers make that checkable rather than assertable:
  1. `GOVERNED_CORPUS_COUNT` is still **47**, two-sided pinned;
  2. `git diff -- scripts/` is **empty**, so no scan set was edited;
  3. the corpus deltas equal this batch's deltas **exactly** (125 → 139 vs +14; 1,816 → 1,934 vs +118), which proves no other file's denominator moved in either direction.
- Recorded rather than reconciled away, because a criterion written absolutely deserves an explicit account when it is met in substance and not in letter.

### 2. [Measured correction] The plan's 104,094-byte workflow baseline is not reproducible; the measured figure is 104,048

- The plan's Task 2 acceptance names *"the workflow group's pre-phase 104,094-byte baseline."* Measured at the phase's own recorded base commit `4d2b8f0`, the 19 workflow files total **104,048 bytes** — which is also the figure plan 29-03's four-part corpus table recorded, so 104,048 is the number with two independent sources and 104,094 has none.
- The command is in the § *byte growth* section above and was run against both `4d2b8f0` and `d6b397c^` (identical, since no plan between them touched a workflow). Following 29-07's precedent, the measured figure is used and the unreproducible one is named here rather than quietly matched.

### 3. [Rule 2 — Scope] `Say no to bloat.` was dropped rather than dispositioned

Covered in full above. The plan says frozen intersections get a companion cell; this one got a deletion instead, because the intersection was a duplicate the style pass was **creating**, not a frozen sentence it was editing. Writing the cell would have satisfied the gate while recording the duplication as considered.

### 4. [Measured deviation] `docs/catalog/README.md` is in the plan's `files_modified` and is byte-unchanged

- The plan's frontmatter lists the catalog, and its Task 1 action says *"Where a `## When to use` first sentence changes, the catalog derives it, so regenerate the catalog in this plan's commit."*
- **No `## When to use` FIRST sentence changed in any of the six.** In `00` and `01` the paragraph was reordered *behind* its first sentence; in `05` the sentence that was split is the third. `generate:catalog` was run anyway and wrote zero bytes; `freshness:catalog` exits 0 and a second generation leaves `git status --porcelain docs/catalog/` clean. The condition the plan attaches the regeneration to did not arise, and the gate confirms it rather than the absence being assumed.

### 5. [Recording convention] Two register rows write `/` where the source writes `|`

Stated in the register itself and in § *the disposition register* above. Without it those two rows would fail the seven-column check and be **silently unread** — the exact fail-open the column count exists to catch — and the substitution is normalization-neutral.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. None of the six workflows carries `TODO`, `FIXME`, `placeholder` or `coming soon`, and every deleted clause's content is either stated elsewhere in the same file or recorded as a deliberate removal in a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — whether a rewritten workflow still instructs the same act is a human judgement.** The register proves every changed clause was dispositioned; it proves nothing about any disposition's substance. These are the files an agent executes, so a reworded step changes what the factory does. The written transformation account narrows what a reviewer must check; it does not decide it.
- **The kit-wide `Each role reads…` context paragraph now has two spellings in the corpus** — the split form in these six workflows and the 29-word original in the other thirteen. That is a live WP-09 one-term-per-concept split, open **by construction** until 29-09 through 29-11 land. The canonical replacement is written verbatim in `29-08.md` so those plans copy it rather than re-derive it.
- **The WP-09 workflow-naming defect is untouched.** Three of nineteen workflow display names are lowercase (`context read/write`, `task claim + schedule`, `context compaction`), pinned as an observation in `kit-model.test.ts` since 29-03. None of the three is in this batch; the fix belongs to the plan that rewrites those headings.
- **Six kit files still carry retired v1.x handoff vocabulary** (29-RESEARCH §A-2). None of the six is in this batch.
- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is still not seen.** 29-03's recorded residual, unchanged. Nothing in this batch relies on it, but nothing in this batch closes it either.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The round-trip check ran manually here and reports 0 failures over all seven files; nothing in the build would have caught a failure. Every edit in this plan went through the structured editor — no `perl -pi -e`, no byte-level rewrite.
- **`security-nfr.md` is still 101 bytes above its advisory WARN tier.** 29-07's residual, untouched by this plan; plan 29-13 owns the re-baseline.
- **Thirteen governed files remain unrewritten**, which is why both predicates still exit 1. That is 29-09 through 29-12's work, and the per-file zero is what this plan proves.

## Threat Flags

None beyond the plan's own register. Zero packages installed (`git diff d6b397c^ HEAD -- package.json` is empty), no network path and no write path added.

- **T-29-44 (scan-set narrowing to reach green) — mitigated and measured.** `GOVERNED_CORPUS_COUNT` still 47, `git diff -- scripts/` empty, every visited denominator published beside its finding count, and the corpus deltas proven equal to this batch's deltas. The denominators rose; see Deviation 1.
- **T-29-45 (reword of a frozen structural section) — mitigated.** 45 frozen intersections, every one carrying a named companion cell; the disposition gate exits **0** on a real commit. The branch guard and `Never merge, never deploy; humans hold both.` are byte-unchanged in all six `## Commit` sections, and the two `## Stop conditions` prohibitions are byte-identical.
- **T-29-46 (rewriting out-of-scope bullets to look conformant) — mitigated by count.** `## Inputs required` and `## Stop conditions` bullet counts asserted unchanged per section, before and after, in all six files.
- **T-29-47 (an unapproved verb entering the list silently) — closed by absence.** `APPROVED_STEP_VERBS.length` is **43** and `git diff -- scripts/` is empty. **No verb was added.** Where a natural verb was not a member, the closest member was used — `Shape` → `Draft`, `Define` → `Establish`, `Honor` → `Apply`, `Map` → `Walk`, `Review` → `Assess`, `Break` → `Split`.
- **T-29-48 (occurrence counts used to verify the rewrite) — mitigated.** Every count above names its method, no bare recursive grep was used for any of them, and the two denominator walks are cross-checked against the gate's own printed totals on both sides of the change.
- **T-29-49 (guard runtime over the 13.8 KB workflow after rewriting) — measured.** The now-14,154-byte file counts 2,081 words over 181 sentences in **1.2 ms**; the whole gate runs in 0.04–0.05 s over the 47-file corpus.
- **T-29-SC (package installs) — asserted by absence.** Zero packages installed.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-08.md
```

Commits claimed, verified in `git log`:

```
FOUND: d6b397c  refactor(29-08): six workflows onto the canonical step form and both sentence bounds
```
