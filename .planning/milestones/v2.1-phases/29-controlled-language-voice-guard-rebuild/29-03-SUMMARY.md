---
phase: 29-controlled-language-voice-guard-rebuild
plan: 03
subsystem: testing
tags: [typescript, guards, controlled-language, corpus-derivation, technical-names, fence-authority]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "kit-model.ts listRoles/listWorkflows + ROLE_COUNT/WORKFLOW_COUNT, the two-sided-pin-in-a-guard split, frontmatter.ts FENCE_DELIMITER_LINE, and the CHECK_ROOT hermetic-mirror seam"
  - phase: 28-kit-consistency-audit
    provides: "the check-public-docs-vocabulary.ts standalone-gate + synthesized-mirror house form, the D-24 RED-before-GREEN discipline, and the dead-vocabulary.ts one-list admission test"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "scripts/vacuity.ts reportMeasured — the shared element-level AP-1 rule both predicates fold through — and voice-model.ts's four CLOSED banned-construction token sets"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 02
    provides: "agent-factory/writing-profile.md — the WP-01..WP-10 rule ids every finding in this gate cites"
provides:
  - "scripts/check-imperative-lexicon.ts — two named predicates in one module: guard_imperative_lexicon (WP-01) and guard_sentence_form (WP-02..WP-08), both watched RED against the real tree"
  - "GOVERNED_CORPUS_PARTS / GOVERNED_CORPUS_COUNT — the 47-file corpus derived in four named parts with a per-part vacuity floor evaluated before the aggregate two-sided pin"
  - "GENERATED_MARKER / GENERATED_EXEMPT / GENERATED_EXEMPT_COUNT — the derived generated-file exclusion with its cardinality asserted two-sided"
  - "APPROVED_STEP_VERBS — the closed 43-verb canonical form, with its admission test written above the array"
  - "PROCEDURAL_SENTENCE_MAX_WORDS 20 / DESCRIPTIVE_SENTENCE_MAX_WORDS 25, selected by section anchor"
  - "TECHNICAL_NAMES / TECHNICAL_NAME_PARTS / TECHNICAL_NAMES_COUNT — 76 names derived from five kit sources and load-bearing in both predicates"
  - "kit-model.ts listRoleDisplayNames() and listWorkflowDisplayNames() (D-40), pinned two-sided in guard_kit_counts"
  - "frontmatter.ts fencedLineFlags() — the ONE fence state machine answering per line; stripFencedBlocks is now a projection of it"
  - "the npm script check:imperative-lexicon and one bare CI invocation with the four-part house comment"
affects: [29-05, 29-06, 29-07, 29-08, 29-09, 29-10, 29-11, 29-12, 29-13]

actuals:
  tokens: 49391
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One state machine, two projections: a per-line verdict function, with the line-dropping strip expressed through it — never a fourth machine in the consumer"
    - "Two named predicates in one module, each with its own header, its own denominator and its own reportMeasured fold"
    - "A canonical form declared and everything outside it refused, where the measured distribution has no head to adopt"
    - "A derived exclusion whose EXCLUDED SET has its own two-sided cardinality pin, so a second exempt member fails by name rather than shrinking the denominator"
    - "A derived set made load-bearing on purpose: TECHNICAL_NAMES moves verdicts (86 vs 87 findings), so a broken derivation cannot pass as decoration"
    - "A mirror whose per-part file counts are read from the gate's own exported parts, so a pin change moves the fixture automatically"

key-files:
  created:
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/check-claim-anchors.test.ts
    - agent-factory/writing-profile.md
    - package.json
    - .github/workflows/ci.yml

key-decisions:
  - "D-39 executed literally: two predicates get two names inside one module, because naming one guard for three unrelated predicates re-creates guard_caveman_preserved at the output line"
  - "D-40's display-name listers derive THROUGH the existing filename listers rather than re-walking the directory, so the vacuity refusal is inherited rather than restated"
  - "The gate needed per-LINE fence knowledge; the answer was to make frontmatter.ts's ONE machine answer per line and express stripFencedBlocks through it, never to write a fourth machine in the consumer"
  - "A markdown table ROW is split into CELLS before sentence measurement — a row is not a sentence, and charging a four-column row as one 40-word sentence would red correct tabular text"
  - "The modal arm takes voice-model.ts's closed `modal` set WHOLE; WP-05's wording was aligned to the shipped predicate rather than the list being filtered to an obligation subset"
  - "The bare-demonstrative rule keys on a CLOSED FUNCTION-WORD class (copula ∪ modal ∪ finite auxiliary), which is what makes it decidable without a dictionary"
  - "The plan's expected sentence figures (273/190 over 982) are ONE set at TWO thresholds; the shipped two-bound rule reports 86 + 127 over 1,816, and the research question asked of these same inputs answers 269/188"

patterns-established:
  - "When a consumer needs a finer-grained answer from an existing authority, WIDEN THE AUTHORITY'S QUESTION and re-express the old consumer through it — the count of authorities must not move"
  - "A fixture's actor plant is built from the MIRROR's own vocabulary, never from the real tree's, because the gate derives its sets from the tree it is pointed at"
  - "A reconciliation against a research figure is recorded in the gate's own header when the two numbers answer different questions, so a later reader does not read the difference as a defect"

requirements-completed: [LANG-01]

coverage:
  - id: D1
    description: "The controlled-language guard ships as TWO names for TWO predicates in one module, neither presented as enforcing conformance to any standard (LANG-04, partial — the corpus rewrites that turn both green are 29-08..29-12)"
    requirement: "LANG-04"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — two `[guard_*]` header blocks, two reportMeasured folds, two denominators; exit 1 (transcripts below)"
        status: pass
      - kind: unit
        ref: "scripts/check-imperative-lexicon.test.ts#the clean mirror — asserts both header names and both measured PASS lines are present"
        status: pass
      - kind: other
        ref: "`grep -c reportMeasured scripts/check-imperative-lexicon.ts` = 4 (one import, one comment, one fold per predicate); the module's header states outright that it enforces conformance with no published standard"
        status: pass
    human_judgment: false
  - id: D2
    description: "The governed corpus derives to 47 files in four named parts with a per-part vacuity floor evaluated BEFORE the aggregate two-sided pin, and the one generated file is excluded by a derived marker whose excluded-set cardinality is itself asserted two-sided (LANG-02, partial — the application to the corpus is 29-08..29-12)"
    requirement: "LANG-02"
    verification:
      - kind: unit
        ref: "check-imperative-lexicon.test.ts — four per-part zero cases (one per part) each asserting the floor's message appears BEFORE the aggregate pin, plus short-by-one and longer-by-one pin cases"
        status: pass
      - kind: unit
        ref: "check-imperative-lexicon.test.ts#a PLANTED SECOND GENERATED FILE — the file is excluded (the corpus pin does NOT move) and the cardinality assertion fails naming it"
        status: pass
      - kind: integration
        ref: "the live run prints `corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2` under BOTH guard headers, with the excluded file named inline with its reason"
        status: pass
    human_judgment: false
  - id: D3
    description: "The project Technical Names and Verbs set is DERIVED from the kit rather than listed, and it is load-bearing in both predicates (LANG-01)"
    requirement: "LANG-01"
    verification:
      - kind: unit
        ref: "kit-model.test.ts#display-name derivations (D-40) — 8 cases: order, `_` exclusion inherited, throw-naming-the-file on a missing heading (both listers), empty-heading refusal, inherited empty-directory refusal, live 17/19, and the WP-09 lowercase observation"
        status: pass
      - kind: integration
        ref: "guard_kit_counts prints `17 role and 19 workflow DISPLAY names derived from their headings (expected 17 / 19)` and fails two-sided in both directions"
        status: pass
      - kind: unit
        ref: "check-imperative-lexicon.test.ts — the config-key grew-by-one pin, the board-table zero floor, and `countWords collapses a MULTI-WORD Technical Name to one term`"
        status: pass
      - kind: other
        ref: "load-bearing proven by measurement, not asserted: the live run reports 86 over-long procedural sentences WITH the Technical-Name collapse and 87 without"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both predicates were watched failing RED against the real tree with published denominators, and the transcripts are on the record in the gate's source, in the CI comment and here"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — exit 1; 81 findings over 125 bullets, 264 findings over 1,816 sentences (transcripts below)"
        status: pass
      - kind: unit
        ref: "check-imperative-lexicon.test.ts#the clean mirror exits 0 — the GREEN control, without which a RED verdict proves nothing because a gate that always fails is trivially red"
        status: pass
      - kind: unit
        ref: "27 hermetic cases driving the COMMITTED .js through spawnSync against synthesized CHECK_ROOT mirrors, every one asserting `status` explicitly"
        status: pass
    human_judgment: false
  - id: D5
    description: "The tree still carries exactly THREE fence state machines and the new gate declares no fourth, no second vacuity rule, and no second corpus walk"
    verification:
      - kind: unit
        ref: "frontmatter.test.ts#27-53 WR-02 — the derived fence-machine set is unchanged at 3 members (270 cases pass with the new per-line projection in place)"
        status: pass
      - kind: unit
        ref: "check-foundation-guards.test.ts#the parser's non-test consumer list — the new gate imports EXACTLY [`fencedLineFlags`] and no verdict-bearing symbol"
        status: pass
      - kind: other
        ref: "the workflow part is listWorkflows(); the display names are kit-model's; the modal and copula sets are voice-model.ts's taken whole; the vacuity rule is vacuity.ts's"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-13
status: complete
---

# Phase 29 Plan 03: The Controlled-Language Gate — Two Names, Two Predicates, One Derived Corpus Summary

**The kit now has a gate that decides, in one shape, what a conforming step and a conforming sentence are — and it was watched failing on the real tree at 81 of 125 step bullets and 264 findings over 1,816 sentences, with a clean-mirror GREEN control proving it is not merely always red.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3
- **Commits:** 3
- **Files changed:** 15 (3 created, 12 modified)

## Accomplishments

- `scripts/check-imperative-lexicon.ts` (843 lines) ships **two named predicates in one module**.
  Each prints its own header, its own corpus line, its own detail line and its own
  `reportMeasured` fold, so a reader meets two verdicts with two denominators rather than one
  conflated number.
- The governed corpus **derives in four named parts** and is pinned two-sided at 47. The per-part
  vacuity floor runs **before** the aggregate pin, and the order is asserted by a case rather than
  assumed — a reader must meet *"this part contributes nothing"* before *"the total is short"*,
  because the second reads as a number to move and the first does not.
- The generated OWASP checklist is excluded **by a derived marker**, and the excluded set has its
  own two-sided cardinality pin. A planted second generated file is correctly excluded (the corpus
  count does not move) **and** fails the cardinality assertion by name — which is the whole point:
  without that assertion a second generated kit file would leave the scan in silence.
- `APPROVED_STEP_VERBS` is a **declared canonical form**, not a frequency cutoff. The distribution
  has no head to adopt, so the D-64 move applies: one legal shape, measured conformance.
- `guard_sentence_form` ships **two bounds selected by section anchor** plus four banned
  constructions over closed token sets. Passive voice is deliberately not banned, recorded in a
  ruled boundary-warning block in the source.
- `TECHNICAL_NAMES` is **derived from five kit sources** and is load-bearing in both arms — proven
  by measurement rather than argued: the live run reports 86 over-long procedural sentences with
  the multi-word collapse and 87 without.
- `kit-model.ts` gains `listRoleDisplayNames()` and `listWorkflowDisplayNames()` (D-40), each
  enumerating membership **through the existing lister** so the vacuity refusal is inherited rather
  than restated, and each pinned two-sided in `guard_kit_counts`.
- `frontmatter.ts` gains `fencedLineFlags()` and `stripFencedBlocks` is now **a projection of it**.
  The tree still carries exactly **three** fence state machines.

## Verbatim evidence

### The two RED transcripts

`node scripts/check-imperative-lexicon.js`, tree at HEAD, 2026-08-13 — **exit code 1**:

```
[guard_imperative_lexicon] every `## Steps` bullet begins with a verb from the closed approved set, in bare imperative form, at position zero (LANG-04 / WP-01, D-12, D-39)
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2; 1 excluded by the derived `GENERATED` marker (agent-factory/checklists/security-nfr-checklist.md — machine-generated from a third-party standard, so a style pass would be reverted on the next generation and would falsify its own verbatim-copy claim)
        125 `## Steps` bullet(s) across 19 file(s); 43 approved verb(s); 76 derived Technical Name(s)
  FAIL  imperative lexicon: 81 finding(s) over 125 elements

[guard_sentence_form] sentence length by section anchor — 20 words procedural, 25 descriptive — plus four banned constructions over closed token sets (LANG-04 / WP-02..WP-08, D-14, D-35, D-39)
        corpus: 47 file(s) in 4 part(s) — workflows 19, checklists 13, seedTemplates 13, contracts 2; 1 excluded by the derived `GENERATED` marker (agent-factory/checklists/security-nfr-checklist.md — machine-generated from a third-party standard, so a style pass would be reverted on the next generation and would falsify its own verbatim-copy claim)
        1816 sentence(s) — 236 procedural, 1580 descriptive; by finding kind: descriptive-sentence-too-long 127, procedural-sentence-too-long 86, more-than-one-instruction 3, modal-in-procedural-step 15, bare-demonstrative-subject 33
        passive voice is deliberately NOT checked (D-15) — the kit's own correct prose is saturated with it, so a passive check reds large volumes of accurate text and the only route back to green is tuning the detector

  FAIL  sentence form: 264 finding(s) over 1816 elements

== Result ==
2 CHECK(S) FAILED
```

**`[guard_imperative_lexicon]` — 81 findings over a visited denominator of 125, exit 1:**

| finding kind | count | example |
|---|---:|---|
| `bold-label` | **41** | `**Deterministic prefetch.** Before the model writes code, the Orchestrator gathers…` |
| `actor-subject` | 15 | `BA/PM defines the product — recording the product decisions and findings as typed notes…` |
| `determiner-subject` | 15 | `The Orchestrator pulls the ticket into development, respecting WIP limits.` |
| `not-an-approved-verb` | 7 | `Tickets are written to `plans/tickets/` and a traceability row is appended per ticket.` |
| `conditional-clause` | 3 | `When the behavior is unclear, the System Analyst clarifies it.` |
| **TOTAL** | **81** | over **125** `## Steps` bullets in **19** files; findings in **16** of them |

**`[guard_sentence_form]` — 264 findings over a visited denominator of 1,816, exit 1:**

| rule | finding kind | count |
|---|---|---:|
| `WP-03` | `descriptive-sentence-too-long` | **127** |
| `WP-02` | `procedural-sentence-too-long` | **86** |
| `WP-06` | `bare-demonstrative-subject` | 33 |
| `WP-05` | `modal-in-procedural-step` | 15 |
| `WP-08` | `more-than-one-instruction` | 3 |
| `WP-07` | `and-slash-or` | **0** |
| **TOTAL** | | **264** over **1,816** sentences (236 procedural, 1,580 descriptive) in 47 files; findings in **32** of them |

Sentence-length distribution over the same 1,816: median **9**, p90 **26**, max **65**.

Two representative finding lines, quoted from the run:

```
        agent-factory/workflows/00-bootstrap-greenfield.md:28 — WP-01 [actor-subject] first token "BA/PM" is not an approved step verb — "BA/PM defines the product — recording the product decisions and findings as typed notes per `agent-factory/workflows/16-context-read-write.md` — breaks the idea into epics, and writes the first tickets (epics/features/tickets to `plans/epics/`, `plans/features/`, `plans/tickets/`)."
        Remedy: the first token is a project Technical Name used as a SUBJECT. Re-narrate the step as an instruction to the agent that performs it; name the actor later in the sentence if it is load-bearing. Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is two-sided pinned, precisely so removing a member to reach green is not available
```

```
        agent-factory/workflows/10-sprint-review.md:25 — WP-02 [procedural-sentence-too-long] 21 words, bound 20 — "Validate each delivered item against its acceptance criteria — accept only what genuinely met the bar (BA/PM, with QE/E2E confirming coverage)."
        Remedy: split the step into two steps. A procedural sentence is bounded at 20 words (WP-02) and the section anchor decides that the bound applies here (WP-04). Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is two-sided pinned, precisely so removing a member to reach green is not available
```

### The four-part corpus derivation, measured

| part | files | bytes | derivation |
|---|---:|---:|---|
| `agent-factory/workflows/` | **19** | 104,048 | `kit-model.listWorkflows()` — never a second directory walk |
| `agent-factory/checklists/` (hand-authored) | **13** | 19,368 | flat markdown, minus the derived `GENERATED` exclusion |
| `agent-factory/seed/**` (templates) | **13** | 14,205 | walked, markdown only |
| `agent-factory/contracts/` | **2** | 15,185 | flat markdown |
| **governed total** | **47** | **152,806** | pinned two-sided at `GOVERNED_CORPUS_COUNT = 47` |
| *(excluded — `GENERATED` marker)* | *1* | *89,840* | pinned two-sided at `GENERATED_EXEMPT_COUNT = 1` |

The excluded file is `agent-factory/checklists/security-nfr-checklist.md`: **82% of its directory by
bytes**, 345 rows copied verbatim from a third-party standard, and it carries its own verbatim-copy
claim. Including it would have tripled the denominator and made every reported number meaningless.

**Excluded by name, with their reasons, named inline in the PASS line:**

| location | label | reason |
|---|---|---|
| `agent-factory/packaging/` | packaging documents | documentation about how the kit is PACKAGED for a host tool, not instructions an agent executes; several are literal frontmatter specimens whose bytes are the subject |
| `agent-factory/config/factory.config.md` | the config-dial documentation | reference documentation for every dial in `factory.config.json`; its rows are key definitions rather than steps |
| `agent-factory/roles/` | the role corpus | governed by `guard_voice`, `guard_caveman_voice` and `guard_role_clause_uniqueness`; a second predicate over the same bytes from a second module is how two gates come to disagree about one corpus |

### `APPROVED_STEP_VERBS` — 43 members, every one attested

Attestation measured two ways, and **both** are reported because they differ and the difference is
the point. Column A counts occurrences at position zero of a bare `## Steps` bullet **today**;
column B counts occurrences at a bullet head **after the leading bold label is stripped** — which is
exactly the transformation the `bold-label` remedy prescribes for the 41 findings above.

| verb | A | B | first attestation |
|---|---:|---:|---|
| `Append` | 1 | 1 | `workflows/10-sprint-review.md:28` |
| `Apply` | 0 | 1 | bold-label head; 10 prose occurrences |
| `Assemble` | 1 | 1 | `workflows/10-sprint-review.md:24` |
| `Assess` | 1 | 1 | `workflows/13-incident.md:22` |
| `Attach` | 1 | 1 | `workflows/12-release.md:26` |
| `Capture` | 1 | 1 | `workflows/13-incident.md:24` |
| `Claim` | 0 | 1 | bold-label head |
| `Clarify` | 1 | 1 | `workflows/07-backlog-refinement.md:26` |
| `Compile` | 1 | 1 | `workflows/12-release.md:24` |
| `Confirm` | 2 | 2 | `workflows/08-sprint-planning.md:25` |
| `Create` | 2 | 2 | `workflows/11-retro.md:25` |
| `Degrade` | 0 | 1 | bold-label head |
| `Distill` | 0 | 1 | bold-label head (`18-context-compaction.md:40`) |
| `Draft` | 1 | 1 | `workflows/10-sprint-review.md:26` |
| `Emit` | 1 | 2 | `workflows/15-security-audit.md:25` |
| `Escalate` | 1 | 1 | `workflows/09-daily-sweep.md:26` |
| `Establish` | 1 | 1 | `workflows/14-ui-design-to-build.md:29` |
| `Hand` | 0 | 1 | bold-label head (`18-context-compaction.md:49`) |
| `Identify` | 1 | 1 | `workflows/11-retro.md:23` |
| `Implement` | 0 | 1 | bold-label head |
| `List` | 1 | 1 | `workflows/10-sprint-review.md:27` |
| `Mark` | 1 | 2 | `workflows/07-backlog-refinement.md:30` |
| `Meet` | 1 | 1 | `workflows/14-ui-design-to-build.md:28` |
| `Obtain` | 0 | 1 | bold-label head |
| `Produce` | 1 | 1 | `workflows/09-daily-sweep.md:28` |
| `Promote` | 1 | 2 | `workflows/07-backlog-refinement.md:31` |
| `Propose` | 1 | 1 | `workflows/13-incident.md:23` |
| `Pull` | 2 | 2 | `workflows/07-backlog-refinement.md:25` |
| `Read` | 3 | 5 | `workflows/09-daily-sweep.md:22` |
| `Recommend` | 1 | 1 | `workflows/09-daily-sweep.md:27` |
| `Reconcile` | 1 | 1 | `workflows/09-daily-sweep.md:24` |
| `Record` | 3 | 3 | `workflows/11-retro.md:24` |
| `Run` | 1 | 2 | `workflows/04-ticket-to-pr.md:28` |
| `Seed` | 1 | 1 | `workflows/00-bootstrap-greenfield.md:31` |
| `Set` | 2 | 2 | `workflows/08-sprint-planning.md:23` |
| `Size` | 1 | 1 | `workflows/07-backlog-refinement.md:29` |
| `Split` | 1 | 1 | `workflows/07-backlog-refinement.md:28` |
| `Transition` | 0 | 1 | bold-label head |
| `Update` | 1 | 1 | `workflows/09-daily-sweep.md:25` |
| `Validate` | 1 | 1 | `workflows/10-sprint-review.md:25` |
| `Verify` | 1 | 1 | `workflows/14-ui-design-to-build.md:30` |
| `Walk` | 2 | 2 | `workflows/14-ui-design-to-build.md:27` |
| `Write` | 1 | 2 | `workflows/08-sprint-planning.md:26` |

**Column B has ZERO empty rows: all 43 verbs are attested at a bullet head in this corpus.** Eight
(`Apply`, `Claim`, `Degrade`, `Distill`, `Hand`, `Implement`, `Obtain`, `Transition`) are attested
only behind a bold label today — which is not a defect in the list, it is the 41-finding
`bold-label` group described from the other side. The admission test survives intact: no member
required deleting or reshaping correct text.

### The two display-name sets (D-40)

`node -e "import('./scripts/kit-model.js').then(m=>console.log(m.listRoleDisplayNames().length, m.listWorkflowDisplayNames().length))"` → `17 19`

**Roles (17):** AGENTS.md Scribe · Architect/Design · BA/PM · Brownfield Mapper · Compliance
Officer · Factory Coach · Frontend/UI · Greenfield Mapper · Incident Responder · Installer ·
Orchestrator · QE/E2E · Release Manager · Security/NFR · Software Engineer · System Analyst ·
UAT Planner

**Workflows (19):** Bootstrap greenfield · Bootstrap brownfield · Idea to epics · Epic to tickets ·
Ticket to PR · PR quality gate · UAT pack · Backlog refinement · Sprint planning · Daily sweep ·
Sprint review · Retro · Release · Incident · UI design to build · Security audit (OWASP ASVS) ·
**context read/write** · **task claim + schedule** · **context compaction**

The three bolded names are lowercase while the other sixteen are sentence-case — a real WP-09
one-term-per-concept defect the derivation surfaces the moment it runs. It is **recorded, not
fixed**: the heading IS the kit prose that plans 29-08 through 29-10 rewrite, and a case in
`kit-model.test.ts` pins the observation so those plans meet it rather than rediscover it.

`guard_kit_counts` now prints:

```
  PASS  kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17 / 19 / 7 / 7); 17 role and 19 workflow DISPLAY names derived from their headings (expected 17 / 19); the spawn-grant scan composition holds exactly 33 members …
```

### The derived Technical Names set (LANG-01)

| source | members | derivation |
|---|---:|---|
| role display names | 17 | `kit-model.listRoleDisplayNames()` |
| workflow display names | 19 | `kit-model.listWorkflowDisplayNames()` |
| config keys | 21 | `Object.keys()` over the shipped `agent-factory/config/factory.config.json` |
| note kinds | 6 | the `## The six note kinds` table in `agent-factory/contracts/context-note.md` |
| board columns | 13 | the column table in `agent-factory/seed/plans/board.md`, located by its exact header row |
| **deduped total** | **76** | pinned two-sided at `TECHNICAL_NAMES_COUNT = 76`; no member is shared by two sources |

Nothing is pasted. Each part carries its own zero floor, and the union carries the two-sided pin.

### The research reconciliation — recorded so the difference is not read as a defect

29-RESEARCH §A-10 reports *"273 sentences over 20 words, 190 over 25"*. Those are **one sentence set
measured at two thresholds**, so they overlap. The shipped rule is **two disjoint arms selected by
section anchor** (D-35 / WP-04), which is a different question and necessarily a different number.

Asked the research's question, of this gate's corpus, with this gate's own counter:

| question | this gate's inputs | 29-RESEARCH §A-10 |
|---|---:|---:|
| sentences over 20 words (all) | **269** | 273 |
| sentences over 25 words (all) | **188** | 190 |
| sentences over the PROCEDURAL bound (20) | **86** | — |
| sentences over the DESCRIPTIVE bound (25) | **127** | — |

The four- and two-sentence differences are exactly the multi-word Technical Names that count as one
term here and as N words there. **The research figure reproduces; it is simply not the figure a
two-bound rule reports.** This reconciliation is embedded in the gate's own source header too.

### Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-imperative-lexicon.js` | **exit 1** — 2 CHECK(S) FAILED, one measured block per predicate |
| `node scripts/check-banned-claims.js` | exit 0 |
| `node scripts/check-foundation-guards.js` | **exit 1 — the 29-01 baseline, unchanged**: exactly `caveman voice` 17/17 and `role clause uniqueness` 12 |
| `npm run build` / `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **47** committed `.js` pairs (46 + `check-imperative-lexicon`) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **50 files, 1,704 passed, 2 skipped** (baseline 49 / 1,669 / 2) |
| new cases | **35** — 8 in `kit-model.test.ts`, 27 in `check-imperative-lexicon.test.ts` |
| gate wall clock, 3 runs | **0.04 s / 0.04 s / 0.04 s** over 152,806 bytes |
| `05-pr-quality-gate.md` (13,711 B) timing case | 2,017 words counted in **1 ms** |
| derived fence state machines in the tree | **3** — unchanged (`frontmatter.ts`, `check-foundation-guards.test.ts`, `generate-role-adapters.test.ts`) |
| `.planning/STATE.md` longest line | **7,994** (§F-2 baseline 7,994 — unmoved) |

**End-of-wave-3 gate state, measured rather than inferred.** Every other repo gate re-run and
green: `check-public-docs-vocabulary`, `check-claim-anchors`, `check-audit-register`,
`check-kit-refs`, `check-nul-bytes`, `check-uat-oracles`, `coordinator-resolution-precheck`,
`validate-agent-factory` — all exit 0.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] The gate needed per-LINE fence knowledge and the tree had no way to give it**

- **Found during:** Task 2, designing the corpus walk.
- **Issue:** `stripFencedBlocks` is the one fence authority and it **drops** lines, which is exactly
  right for a prose check asking *"does this text contain X"* and useless for a gate that reports
  `file:line`. Writing a recogniser-plus-toggle loop in the new gate would have made it a **fourth**
  fence state machine — in the phase whose first plan spent an entire task deleting the two that had
  drifted apart on two of three malformed fence forms.
- **Fix:** the toggle moved into a new `fencedLineFlags(text): boolean[]` in `frontmatter.ts`, and
  `stripFencedBlocks` is now that verdict applied as a filter. **One machine, two projections.** The
  strip's behaviour is byte-preserved (delimiter lines never emitted, inside-lines dropped,
  unterminated fence extends to EOF and is never exposed) and all 270 `frontmatter.test.ts` cases
  pass unchanged, including the derived fence-machine set still at three members.
- **Files modified:** `scripts/frontmatter.ts`, `.js`.
- **Commit:** `00a2e5c`

**2. [Rule 2 — Missing critical functionality] WP-05's wording and the shipped predicate disagreed**

- **Found during:** Task 2, wiring the modal arm.
- **Issue:** `agent-factory/writing-profile.md` WP-05 read *"carries no modal of obligation"*. The
  only closed modal set in the tree is `voice-model.ts`'s `BANNED_CONSTRUCTIONS.modal` — eight
  members including `can`, `may`, `could`, `would`. Filtering it to an obligation subset would have
  created a **second modal list**, which is this repository's diagnosed drift class. Shipping the
  whole set while the contract said something narrower would have sent plans 29-08..29-12 rewriting
  to a rule the gate does not hold.
- **Fix:** the set is taken **whole** and WP-05's cell was aligned to the shipped predicate — *"A
  procedural step carries no modal verb."* The broader direction reds more text and never less,
  which is the safe direction for a corpus about to be rewritten anyway. The decision and its reason
  are recorded in the gate's header as a named residual.
- **Files modified:** `agent-factory/writing-profile.md`, `scripts/check-imperative-lexicon.ts`.
- **Commit:** `00a2e5c`. `check-claim-anchors` re-run: exit 0, 42 rows, all byte-identical — the
  edited line sits outside every anchor.

**3. [Rule 1 — Bug] A markdown table row measured as one sentence would have red'd correct tables**

- **Found during:** Task 2, first measurement pass.
- **Issue:** a four-column table row is not a sentence; it is four independent cells sharing a line.
  Measured whole, wide rows breach the 25-word bound routinely, and the only route back to green
  would be **rewriting tables into prose** — the heuristic-strict-subset shape this project refuses.
- **Fix:** a row is split into cells before sentence segmentation, and the reason is stated in
  source so it is not read as leniency. Measured both ways before choosing: row-mode reports 218
  findings and cell-mode 216 over the same corpus, so this is not a way of reaching a smaller
  number — it is the honest unit.
- **Files modified:** `scripts/check-imperative-lexicon.ts`.
- **Commit:** `00a2e5c`

**4. [Rule 1 — Bug] Two derived set-literal pins in sibling test files were one short**

- **Found during:** Task 2, the full suite run.
- **Issue:** `check-claim-anchors.test.ts` pins the set of `scripts/` sources declaring an `isEntry`
  guard two-sided (8 → 9 with the new gate), and `check-foundation-guards.test.ts` pins the
  parser's non-test consumer list (5 → 6).
- **Fix:** both pins moved **with a comment recording why**: the set GREW by the mechanism the block
  exists for — the new gate joined by existing, and the property assertion passed for it on the
  first run. The consumer pin additionally asserts the new gate imports **exactly**
  `["fencedLineFlags"]` and no verdict-bearing symbol, which is the D-64 Part C shape: consumers
  that take a declaration, not a verdict.
- **Files modified:** `scripts/check-claim-anchors.test.ts`, `scripts/check-foundation-guards.test.ts`.
- **Commit:** `00a2e5c`

**5. [Rule 1 — Bug] A temporal-dead-zone reference reported itself as a derivation refusal**

- **Found during:** Task 2, the first live run.
- **Issue:** the Technical Names parts are evaluated at module load and referenced `isTableRule`,
  which was declared as a `const` further down the file. Both table-derived parts reported
  *"Cannot access 'isTableRule' before initialization"* — a **wiring error wearing a derivation
  refusal's clothes**, which is precisely the class of message that reads as a corpus problem.
- **Fix:** the line-grammar block moved above the derivations that consume it, `isTableRule` became
  a hoisted function declaration, and the reason is recorded beside it so the ordering is not
  "tidied" back later.
- **Files modified:** `scripts/check-imperative-lexicon.ts`.
- **Commit:** `00a2e5c`

**6. [Rule 1 — Bug] The mirror shipped no generated document, so every behavioural case ran against a corpus the gate had already refused**

- **Found during:** Task 2, first test run — 11 of 27 cases red, including the GREEN control.
- **Issue:** `GENERATED_EXEMPT_COUNT` is pinned two-sided at 1. A synthesized mirror with no
  generated file fails that pin, so the gate exited 1 on the clean mirror and every plant case was
  measuring a refusal rather than its own plant.
- **Fix:** `makeMirror` writes `GENERATED_EXEMPT_COUNT` generated documents by default, derived from
  the gate's own pin. The planted-second-generated case then simply asks for one more, which is why
  that case's assertion that the **corpus count does not move** is meaningful.
- **Files modified:** `scripts/check-imperative-lexicon.test.ts`.
- **Commit:** `00a2e5c`

**7. [Rule 1 — Bug] The actor plant named a Technical Name the MIRROR had never heard of**

- **Found during:** Task 2, second test run.
- **Issue:** the plant was interpolated from the **real tree's** `TECHNICAL_NAMES` (`BA/PM`), but the
  gate derives its Technical Names from the tree `CHECK_ROOT` points at. In the mirror that word was
  simply unknown, so the bullet classified through the `not-an-approved-verb` arm while the case
  claimed to prove the `actor-subject` arm.
- **Fix:** the plant is built from the mirror's own role display name, and a **premise assertion**
  was added first — the real tree's derivation must return a display name containing `/`, which is
  what D-40 exists to guarantee. A case that proves the wrong arm is worse than no case.
- **Files modified:** `scripts/check-imperative-lexicon.test.ts`.
- **Commit:** `00a2e5c`

### Measured deviations from the plan's expected figures

**The plan's `[guard_sentence_form]` acceptance numbers are not reproducible by the predicate the
plan specifies, and the numbers were re-measured rather than engineered to match.**

The plan's criterion reads *"273 sentences over the 20-word procedural limit and 190 over the
25-word descriptive limit, over a visited total of 982"*. Those three figures come from
29-RESEARCH §A-10, where 273 and 190 are **one sentence set at two thresholds** (overlapping, not
split by anchor) and 982 is a denominator from a probe over 32 files rather than 47. A two-bound
rule cannot report them. What the shipped rule reports — 86 procedural over 20, 127 descriptive over
25, over 1,816 sentences — is recorded above together with a full reconciliation showing the
research figure reproduces at 269/188 when its own question is asked.

**The `[guard_imperative_lexicon]` figures exceed the plan's floor rather than missing it:** the plan
required *"at least 74 of 125"*; the measured answer is **81 of 125 across 19 files**, and the
grammar breakdown (41 bold-label, 15 actor-subject, 15 determiner-subject) reproduces
29-RESEARCH §A-4's classifier exactly.

**The Technical Names pin was measured, not predicted.** The plan named no cardinality; the derived
answer is 76 with no cross-source duplicate.

### Requirement marking

`requirements-completed` is **`[LANG-01]` only**.

- **LANG-01** is claimed by plans 29-02 and 29-03 and by no other. 29-02 shipped the profile and
  deliberately left the requirement Pending because the Technical Names set it promises was still
  a command in a document rather than a derivation in the build. This plan lands that derivation,
  consumes it in two predicates, and pins it two-sided. 29-03 is the last claimant, so LANG-01 is
  closed here.
- **LANG-02** is also claimed by plans 29-08 through 29-12. Its text requires the profile to be
  **applied** to the procedural and agent-written surfaces; this plan builds the gate that decides
  application, and the corpus rewrites are what satisfy it.
- **LANG-04** is also claimed by 29-08 through 29-12 for the same reason.

Marking either complete here would be the fabricated completion plans 29-01 and 29-02 both caught
and reverted.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. Every
derived set in the new gate is consumed by at least one predicate, and each one's non-vacuity is
asserted by a case.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — a non-conforming step written as PROSE with no list marker is not seen.**
  The imperative predicate is scoped to list items under `## Steps`. Widening to "every line under
  `## Steps`" would report the section's own explanatory prose as non-conforming steps. Recorded in
  the gate's header.
- **`UNKNOWN - verify` — the sentence split is line-oriented.** A sentence hard-wrapped across a
  line boundary is measured as two short sentences and can pass a bound it would breach if joined.
  Joining lines first would merge list items, table rows and headings into sentences nobody wrote,
  which is the larger error.
- **`UNKNOWN - verify` — `guard_sentence_form`'s modal arm is broader than WP-05's original
  wording**, and the profile was aligned to the predicate rather than the list filtered to a subset.
  Recorded in the header with the reason.
- **The WP-09 workflow-naming defect is open by design.** Three of nineteen workflow display names
  are lowercase. Pinned as an observation in `kit-model.test.ts`; the fix belongs to plans 29-08
  through 29-10, which rewrite the files that carry the heading.
- **Six kit files still carry retired v1.x handoff vocabulary** (29-RESEARCH §A-2), including a
  Definition-of-Done item and a board column entry criterion. This plan did not touch them; they
  are a corpus-rewrite item.
- **Both predicates are RED and stay RED until 29-08..29-12 land.** That is the D-24 acceptance
  evidence, and the CI comment above the gate says so with its exit code.

## Threat Flags

None beyond the plan's own register. This plan installs **zero** packages —
`git diff 9df6236..HEAD -- package.json` adds exactly one `scripts` entry and touches no dependency
— adds no network path and no write path. `scripts/check-imperative-lexicon.ts` is strictly
read-only and Node-stdlib-only.

T-29-16 (backtracking over a 13.8 KB workflow and an 89.8 KB checklist) was **measured rather than
assumed**: the whole gate runs in 0.04 s over 152,806 bytes, every split is
`String.prototype.split`, no regex nests a quantifier over the same character class, and the one
lookbehind is fixed-width. The single construct with adjacent same-class quantifiers — the table
rule row — was rewritten as a `startsWith` plus one anchored class before it shipped.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: scripts/check-imperative-lexicon.ts
FOUND: scripts/check-imperative-lexicon.js
FOUND: scripts/check-imperative-lexicon.test.ts
```

Commits claimed, verified in `git log`:

```
FOUND: e39451c  feat(29-03): derive the role and workflow display names, pinned two-sided in guard_kit_counts
FOUND: 00a2e5c  feat(29-03): guard_imperative_lexicon and guard_sentence_form, landed RED against the real tree
FOUND: 5be06a3  feat(29-03): wire the controlled-language gate at both ends and embed both RED transcripts
```
