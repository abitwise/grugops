---
phase: 29-controlled-language-voice-guard-rebuild
plan: 06
subsystem: docs
tags: [kit-prose, role-skeleton, caveman-voice, byte-ceilings, dispositions, generator-cascade]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "voice-model.ts (readCavemanFence, CAVEMAN_LEXICON, CAVEMAN_LEXICON_MIN, BANNED_CONSTRUCTIONS, segmentClauses, normalizeSentence), guard_caveman_voice and guard_role_clause_uniqueness with their RED 17/12 baseline"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 03
    provides: "listRoleDisplayNames / listWorkflowDisplayNames, guard_imperative_lexicon, guard_sentence_form"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 04
    provides: "guard_diff_disposition, the docs/audit/29-style-dispositions/ contract and its recorded base commit 4d2b8f0"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 05
    provides: "the proven nine-step per-role pipeline, the D-30 fallback sentence in its kit-legal form, the `## Responsibilities` deletion rule, and the derived voice-guard count helpers"
provides:
  - "fifteen of seventeen role files on the canonical D-19 skeleton — only the two dual-voice safety roles remain"
  - "docs/audit/29-style-dispositions/29-06.md — 97 rows over 108 distinct changed clauses, one frozen intersection with its companion cell"
  - "the orchestrator's rewritten `## One job` first sentence, which is the main-thread coordinator adapter's routing description"
  - "the measured correction that `incident-responder.md` frees exactly zero bytes from the trailing-sentence delete, verified in this plan rather than carried from research"
affects: [29-07, 29-13, 29.1]

actuals:
  tokens: 21400
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Remove before add, per file, with a measured byte transcript at each step — and when a further removal lands AFTER the add, record five measurement points rather than tidying the sequence back to four"
    - "The caveman block is the section that gives up its content, which is what makes it safe for the block to become maximally grug"
    - "A prohibition inside an act keeps the act and loses the clause; an item whose SUBJECT is a boundary goes whole"
    - "Let the gate enumerate the changed clauses before writing the register, then verify the register against the gate rather than against a hand-read diff"

key-files:
  created:
    - docs/audit/29-style-dispositions/29-06.md
  modified:
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/incident-responder.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/installer.md
    - agent-factory/roles/release-manager.md
    - .claude/agents/grugops-greenfield-mapper.md
    - .claude/agents/grugops-uat-planner.md
    - .claude/agents/grugops-system-analyst.md
    - .claude/agents/grugops-qe-e2e.md
    - .claude/agents/grugops-incident-responder.md
    - .claude/agents/grugops-orchestrator.md
    - .claude/agents/grugops-installer.md
    - .claude/agents/grugops-release-manager.md
    - docs/catalog/README.md

key-decisions:
  - "D-41 executed literally again: `You are <Role>.` rewritten in all eight blocks; ZERO `^You are ` lines survive in the fifteen rewritten roles, and the two that remain are the two safety files 29-07 owns"
  - "The orchestrator's `## One job` was compressed 29 words -> 17 while retaining every routing-matchable term (decompose, subtasks, route, role agent, shared queue), because that sentence IS the main-thread adapter's `description`"
  - "`You spawn agents only when spawn tool there.` was deleted from the orchestrator's block rather than rewritten as attitude: it is a telegraphic paraphrase of a CAPABILITY rule, and a fenced paraphrase of a capability rule is the worse of the two risks"
  - "release-manager `## Responsibilities` item 4 (the human deploy gate) was deleted whole under the 29-05 rule, with a companion cell — recorded as a judgement about a safety rule, not as a tidy"
  - "No byte ceiling was raised, considered, or edited; all eight files land under their WARN tier, and only ONE role in the whole corpus is still above WARN — `security-nfr.md`, which 29-07 owns"

patterns-established:
  - "A disposition row's `before`/`after` cell is matched by `normalizeSentence(cell) === clause` on the WHOLE cell — so a cell must be the exact source text of ONE derived clause, with no ` — `, ` ; ` or ` : ` separator inside it"
  - "An em-dash-separated `## One job` sentence yields TWO clauses to the gate, so the head fragment and the tail fragment each need their own row"
  - "Verify every number written into the register with the same command the generator uses, before committing — a register carrying a wrong count is worse than one carrying none"

requirements-completed: []

coverage:
  - id: D1
    description: "Fifteen roles say each thing once — the what in `## One job`, identity in the caveman block, the how in `## Responsibilities`, every prohibition in `## Hard limits` alone (LANG-05, partial — 29-07 holds the remaining two)"
    requirement: "LANG-05"
    verification:
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — guard_role_clause_uniqueness 5 -> 1 finding over 17 elements; the one survivor is compliance-officer.md, which this plan does not own (transcript below)"
        status: pass
      - kind: other
        ref: "one `## Responsibilities` item deleted whole (release-manager 4), three prohibition CLAUSES dropped from items whose subject is an act (uat-planner 4, system-analyst 4, incident-responder 3, installer 3), each with a disposition row naming the `## Hard limits` sentence that keeps the rule"
        status: pass
      - kind: other
        ref: "D-19 section ownership is still NOT mechanically enforced — carried forward from 29-01/29-05 as a residual, held by per-file review plus the uniqueness guard's observable half"
        status: pass
    human_judgment: true
  - id: D2
    description: "Fifteen caveman blocks carry measured voice — lexicon tokens at or above the minimum and zero banned constructions — with the per-block measurement published (LANG-06, partial)"
    requirement: "LANG-06"
    verification:
      - kind: integration
        ref: "guard_caveman_voice prints `tokens 3..5 / content words 16..41, banned 0` for all eight; 10 -> 2 findings over an unmoved 17-element denominator"
        status: pass
      - kind: other
        ref: "`^You are ` returns 0 across the fifteen rewritten roles by two independent methods (Node walk and `grep -ac`); the 2 that remain are security-nfr.md and compliance-officer.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every changed clause carries a disposition row and every frozen intersection carries its companion edit (LANG-03, partial)"
    requirement: "LANG-03"
    verification:
      - kind: integration
        ref: "npm run check:diff-disposition — `0 findings over 264/264 elements`, 198 rows across 2 files, exit 0"
        status: pass
      - kind: other
        ref: "one frozen `## Hard limits` intersection named by the gate (system-analyst.md:16 `do not choose framework`), answered with a companion cell rather than an exemption"
        status: pass
      - kind: other
        ref: "the register proves dispositioning happened and nothing about any disposition's substance; the LANG-03 check is a named human reading the 97 rows against the diff"
        status: pass
    human_judgment: true
  - id: D4
    description: "No byte ceiling was raised; every file is under its FAIL tier with the transcript recorded at four measurement points (five for greenfield-mapper)"
    verification:
      - kind: other
        ref: "`git diff 41b91a5 HEAD -- scripts/check-foundation-guards.ts` is EMPTY — roleCeiling() is untouched"
        status: pass
      - kind: integration
        ref: "guard_role_size PASSes 16 of 17 roles with no WARN; headroom to WARN +9..+509, to FAIL +172..+768 (transcript below)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The generator cascade ran once, in D-47 order, in the same commit as the role edits, leaving three byte gates green"
    verification:
      - kind: integration
        ref: "freshness:adapters / freshness:skill-twins / freshness:catalog all exit 0; a second full regeneration after the commit leaves `git status --porcelain` clean over .claude/, agent-factory/ and docs/catalog/"
        status: pass
      - kind: other
        ref: "`git show --stat 1364ec8` carries the eight roles, their eight adapters and the catalog in one commit"
        status: pass
    human_judgment: false
  - id: D6
    description: "The nine untouched roles are unchanged in bytes, and the two roles still failing are exactly the two the dedicated plan owns"
    verification:
      - kind: other
        ref: "all nine untouched roles are byte-IDENTICAL against 41b91a5; `git diff --stat` names exactly the eight roles, eight adapters, the catalog and the register"
        status: pass
      - kind: integration
        ref: "guard_caveman_voice names exactly two failing roles — security-nfr.md and compliance-officer.md — and guard_role_clause_uniqueness names one, compliance-officer.md"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-08-13
status: complete
---

# Phase 29 Plan 06: Eight More Roles onto the Canonical Skeleton Summary

**The two role-prose guards moved a second time by prose rather than by predicate — 10 red caveman blocks to 2 and 5 duplicate clause groups to 1 — with all eight rewritten files landing *under* their WARN tier, the orchestrator shedding 288 bytes and 363 bytes of WARN headroom it was told not to spend, no ceiling touched, and 97 disposition rows covering all 108 distinct clauses the gate derived from both sides of the diff.**

## Performance

- **Duration:** 30 min
- **Tasks:** 2
- **Commits:** 2
- **Files changed:** 18 (1 created, 17 modified)

## The eight-row byte transcript

Every value produced by `wc -c` run in this plan. Ceilings transcribed from `roleCeiling()`, which
this plan does not modify. Rows in the order the plan required — ascending headroom, hardest budget
settled first.

| role | before | after removals | freed | after fallback | **final** | WARN | headroom | FAIL | headroom |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `greenfield-mapper.md` | 2916 | 2791 | 125 | 2897 | **2873** | 2882 | **+9** | 3045 | +172 |
| `uat-planner.md` | 3367 | 3210 | 157 | 3316 | **3316** | 3350 | **+34** | 3540 | +224 |
| `system-analyst.md` | 3020 | 2856 | 164 | 2962 | **2962** | 3000 | **+38** | 3170 | +208 |
| `qe-e2e.md` | 3695 | 3502 | 193 | 3608 | **3608** | 3617 | **+9** | 3822 | +214 |
| `incident-responder.md` | 3540 | 3375 | 165 | 3481 | **3481** | 3598 | **+117** | 3802 | +321 |
| `orchestrator.md` | 7090 | 6696 | 394 | 6802 | **6802** | 7165 | **+363** | 7570 | +768 |
| `installer.md` | 3546 | 3219 | 327 | 3325 | **3325** | 3938 | +613 | 3727 | **+402** |
| `release-manager.md` | 4230 | 3895 | 335 | 4001 | **4001** | 4510 | **+509** | 4765 | +764 |

`greenfield-mapper.md` is the one row where **final** differs from **after fallback**, and the
difference is recorded rather than tidied — see *Deviations* below. Every other file's fallback
measurement IS its final.

Total over the eight files: **1,884 bytes** removed, **848** added back, **net −1,036**.

**All eight entered or sat near WARN and all eight leave below it.** Five of the eight
(`greenfield-mapper`, `uat-planner`, `system-analyst`, `qe-e2e` and, in the wider corpus,
`security-nfr`) were above their WARN tier when this phase began. Four of those five are now under
it. After this plan **exactly one role in the entire seventeen-file corpus is still above WARN** —
`security-nfr.md` at 5027 against 4830, which plan 29-07 owns.

`git diff 41b91a5 HEAD -- scripts/check-foundation-guards.ts` is **empty**. The ceiling table was
never edited, and no role came close enough to FAIL for the D-37 escalation to arise.

## The eight `## One job` sentences, before and after

Word counts measured by splitting the same first sentence `generate-catalog.ts`'s `firstSentence()`
extracts — the string that becomes the adapter `description`.

| role | before | trailing sentence | after | words |
|---|---:|---|---|---:|
| `greenfield-mapper` | 23 | 4 words | `Shape empty land into a repo structure, a stack choice, and a first architecture sketch.` | **15** |
| `uat-planner` | 22 | 7 words | `Plan business acceptance so a named human can accept the work.` | **11** |
| `system-analyst` | 22 | 11 words | `Map the system behavior a product ticket implies, so the work is design-ready.` | **13** |
| `qe-e2e` | 24 | 9 words | `Break the feature with tests and report the gaps.` | **9** |
| `incident-responder` | 23 | **NONE** | `Stop the bleeding first, then write a blameless postmortem.` | **9** |
| `orchestrator` | 29 | 8 words | `Decompose each request into subtasks and route each to the right role agent over the shared queue.` | **17** |
| `installer` | 25 | 8 words | `Make this factory usable in the current tool.` | **8** |
| `release-manager` | 31 | 4 words | `Cut a release and hand it to a named human for approval.` | **12** |

All eight are at or under the 20-word bound. Every one is now a single act.

## `incident-responder.md` — the two-part byte breakdown

The research names this as the one role in the kit whose `## One job` is a single sentence, so
D-19's trailing-sentence delete frees it **zero** bytes. That was verified in this plan rather than
carried: the `firstSentence()` split over the pre-edit file returns the whole section, and the
trailing remainder is the empty string. The table above records `NONE` in its trailing column for
that reason, against 4-to-11-word trailing sentences in every other row.

Its whole budget therefore came from two places, measured separately:

| step | bytes | running total |
|---|---:|---:|
| baseline | — | 3540 |
| **caveman-block reduction (D-09)** | **−30** | 3510 |
| **`## One job` first-sentence compression, 23 words → 9 (D-19, WP-02)** | **−90** | 3420 |
| `## Responsibilities` item 3 prohibition clause dropped (D-19, WP-10) | −45 | 3375 |
| + D-30 when-absent fallback sentence | +106 | **3481** |

**30 bytes from the block, 90 from the sentence** — the two the plan asks to be broken out. The
third line is recorded beside them rather than folded into either, because attributing it to one of
the two named sources would misstate where the bytes came from. The file lands 117 under WARN and
321 under FAIL.

## `orchestrator.md` — the widest blast radius in the batch

Its `## One job` first sentence is what `generate-role-adapters.js` turns into the **main-thread
coordinator's `description`**, which is the string that drives routing. It was compressed from 29
words to 17, and the regenerated adapter is the proof the compression kept its routing surface:

```diff
-description: "Decompose each request into subtasks, route each to the right role agent within hard limits, and schedule them over the shared queue — config/board first, scope small, WIP/width enforced. Use when: Any incoming request — every `/grugops` starts here."
+description: "Decompose each request into subtasks and route each to the right role agent over the shared queue. Use when: Any incoming request — every `/grugops` starts here."
```

Every routing-matchable term survives — *decompose*, *subtasks*, *route*, *role agent*, *shared
queue* — while the `within hard limits` qualifier and the `config/board first, scope small,
WIP/width enforced` tail move to the sections that own them (`## Responsibilities` items 1, 2 and 4,
`## Hard limits`, and the WIP gate subsection).

Its caveman block was the largest in the kit — 15 non-blank lines, 86 content words, 7 banned
constructions — and therefore both the most content to remove under D-09 and the most headroom
available. **394 bytes came out, 106 went back in, and the file ends 363 under its WARN tier and 768
under FAIL.** The plan's instruction was not to spend that headroom. It was not spent: the file is
**288 bytes smaller than it started**, and the standing obligation not to grow `orchestrator.md` is
satisfied in the shrinking direction.

One deletion there deserves naming. `You spawn agents only when spawn tool there.` was **deleted
rather than rewritten as attitude**. It is a telegraphic paraphrase of a capability rule — the
spawn-tool-keyed PARALLEL/SEQUENTIAL split — that the coordinator hard limit states precisely and at
length in clear voice. Leaving a compressed paraphrase of a capability rule inside a fenced block is
the greater of the two risks, so it went and its row says so.

## The measured caveman lines (guard_caveman_voice)

`node scripts/check-foundation-guards.js`, tree at HEAD, 2026-08-13:

```
        agents-md-scribe.md: tokens 5 / content words 26, banned 0
        architect-design.md: tokens 4 / content words 24, banned 0
        ba-pm.md: tokens 5 / content words 25, banned 0
        brownfield-mapper.md: tokens 4 / content words 21, banned 0
        compliance-officer.md: tokens 0 / content words 41, banned 3
        factory-coach.md: tokens 5 / content words 30, banned 0
        frontend-ui.md: tokens 4 / content words 34, banned 0
        greenfield-mapper.md: tokens 3 / content words 16, banned 0
        incident-responder.md: tokens 4 / content words 27, banned 0
        installer.md: tokens 3 / content words 22, banned 0
        orchestrator.md: tokens 5 / content words 41, banned 0
        qe-e2e.md: tokens 3 / content words 19, banned 0
        release-manager.md: tokens 3 / content words 22, banned 0
        security-nfr.md: tokens 0 / content words 21, banned 1
        software-engineer.md: tokens 4 / content words 28, banned 0
        system-analyst.md: tokens 3 / content words 25, banned 0
        uat-planner.md: tokens 3 / content words 18, banned 0
  FAIL  caveman voice: 2 finding(s) over 17 elements
  agent-factory/roles/compliance-officer.md: positive arm: 0 lexicon term(s), needs >= 2; negative arm: 3 banned construction(s) (article 2, copula 1, modal 0, subordinator 0), needs 0
  agent-factory/roles/security-nfr.md: positive arm: 0 lexicon term(s), needs >= 2; negative arm: 1 banned construction(s) (article 0, copula 1, modal 0, subordinator 0), needs 0
```

**Fifteen clean measured lines, two named failures.** The eight new blocks carry **3 to 5 distinct
lexicon terms against a floor of 2**, and **zero** banned constructions. The two remaining lines are
byte-identical to plan 29-01's RED transcript and to 29-05's, and they are exactly the two dual-voice
safety files — `security-nfr.md` and `compliance-officer.md` — that the dedicated plan owns. The
fifteen-of-seventeen state is a measurement, not a claim.

## The uniqueness verdict, before and after

Plan 29-05 left five groups. This plan's eight files carried **four** of them, and all four are
gone. No new group appeared:

| group | file | status |
|---|---|---|
| `"make this factory usable in current tool"` x2 @ 9, 14 | `installer.md` | **cleared** |
| `"detect host coding agent"` x2 @ 15, 30 | `installer.md` | **cleared** |
| `"cut releases not corners"` x2 @ 9, 14 | `release-manager.md` | **cleared** |
| `"do not choose framework"` x2 @ 16, 44 | `system-analyst.md` | **cleared** |

```
  FAIL  role clause uniqueness: 1 finding(s) over 17 elements
  compliance-officer.md: "do not invent legal advice" x3 at line(s) 9, 17, 45
```

The single survivor belongs to `compliance-officer.md`, untouched here and owned by 29-07.

In three of the four cleared groups the caveman block was the side that gave the clause up, which is
what D-09's content-surrender predicts. `release-manager` is the exception worth naming: *"Cut
releases, not corners"* is **attitude**, not a fact and not a prohibition, so the **caveman block is
the side that kept it** and `## One job` is the side that gave it up. The rule that decides which
side goes is the section that owns the content, not the section that is easier to edit.

### A measured correction to the plan's own read_first

The plan's `read_first` cites §B-3 for `greenfield-mapper` carrying one duplicate group. **It carries
zero**, and it carried zero before this plan ran — the guard's own output on the pre-edit tree names
only `compliance-officer`, `installer` (two), `release-manager` and `system-analyst`. The reason is
`CLAUSE_MIN_WORDS`: `greenfield-mapper`'s repeated sentence is *"You do not overbuild."*, which
normalizes to `do not overbuild` — three words, below the four-word floor, so it is discarded before
the equality is ever asked. The four groups above are therefore the whole of this batch's share, and
5 − 1 remaining = 4 cleared closes the arithmetic.

## The generator cascade (D-47)

Run in order — adapters, then skill twins, then catalog — inside the role-edit commit:

```
generate-role-adapters: wrote 17 adapters (coordinator grugops-orchestrator grants 16 names)
generate-skill-twins:   rendered 7 twin(s) from skills, 0 written, 7 already identical
generate-catalog:       wrote 17 roles and 19 workflows to docs/catalog/README.md
```

| gate | exit |
|---|---|
| `npm run freshness:adapters` | **0** |
| `npm run freshness:skill-twins` | **0** |
| `npm run freshness:catalog` | **0** |

A second full regeneration **after** the commit leaves `git status --porcelain` clean over
`.claude/`, `agent-factory/` and `docs/catalog/`. **The skill twins moved zero bytes again**, which
is D-47's two-hop shape confirmed a second time: the twins are downstream of the *adapters* and read
no `## One job`, and none of this plan's eight roles is one of the seven twinned skills.

The eight regenerated descriptions, all of which still read as routing triggers:

```
"Shape empty land into a repo structure, a stack choice, and a first architecture sketch. Use when: Need shaping of empty land."
"Plan business acceptance so a named human can accept the work. Use when: Need business acceptance."
"Map the system behavior a product ticket implies, so the work is design-ready. Use when: Need flows or system rules."
"Break the feature with tests and report the gaps. Use when: Need tests."
"Stop the bleeding first, then write a blameless postmortem. Use when: `mode=enterprise`, or a production incident, or a failing SLO."
"Decompose each request into subtasks and route each to the right role agent over the shared queue. Use when: Any incoming request — every `/grugops` starts here."
"Make this factory usable in the current tool. Use when: `mode=enterprise`, or an install or adapter request."
"Cut a release and hand it to a named human for approval. Use when: `mode=enterprise`, or a release request — work in `Ready to Release` is signed off and ready to ship."
```

## The disposition register

`npm run check:diff-disposition` — **exit 0**:

```
        15 watched file(s) changed since 4d2b8f0; 264 changed clause(s) derived; 198 disposition row(s) across 2 file(s)
  PASS  diff disposition: 0 findings over 264/264 elements
```

The 264 total covers both 29-05's seven files and this plan's eight. This plan's share is **130 gate
findings collapsing to 108 distinct (file, clause) pairs, answered by 97 rows** — a row matches by
file *and* clause rather than by line, so one row answers a clause reported on both sides of the
diff or at two lines.

**One frozen `## Hard limits` intersection**, named by the gate and answered with a companion cell
rather than an exemption:

| file | frozen clause | why it was touched |
|---|---|---|
| `system-analyst.md` | `do not choose framework` | caveman-block restatement deleted — it was one side of the duplicate group at lines 16 and 44 |

**The frozen text itself is byte-unchanged.** What moved is its *duplicate* elsewhere in the file.
`git diff 41b91a5 HEAD -- agent-factory/roles/` touches **no line inside any `## Hard limits`
section** in any of the eight files.

### The `## Responsibilities` rule, applied and extended

29-05 wrote the rule down; this batch is the first to exercise both of its arms in one plan.

| role | item | verdict |
|---|---|---|
| `release-manager` | 4 — *"Stop at the human gate…"* | **deleted whole.** Its subject is the human deploy gate, a boundary `## Hard limits` states. |
| `uat-planner` | 4 | **clause dropped, item kept** — `— without writing code` |
| `system-analyst` | 4 | **clause dropped, item kept** — `No framework choice, no code.` |
| `incident-responder` | 3 | **clause dropped, item kept** — `that examines the system, never a person` |
| `installer` | 3 | **clause dropped, item kept** — `Stay additive: never overwrite or delete user content;` |

The `release-manager` deletion is a safety rule and is recorded as a judgement rather than a tidy.
`## Hard limits` retains *"Deploy only after a named human approves; production action is always
human-confirmed."* byte-unchanged in the same commit and is now the sole home of that gate. The
permission withheld is identical; it is stated once in the section that owns it instead of twice.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 1** — `caveman voice: 2/17`, `role clause uniqueness: 1/17`; the expected state at the end of wave 6 |
| `node scripts/check-imperative-lexicon.js` | **exit 1** — the 29-03 baseline, unchanged (roles are outside its governed corpus) |
| `npm run check:banned-claims` | exit 0 |
| `npm run check:diff-disposition` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,724 passed, 2 skipped** (29-05 baseline 51 / 1,724 / 2 — unmoved) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 — required section headings still validate |
| `check-kit-refs` · `check-nul-bytes` · `check-claim-anchors` · `check-audit-register` · `check-public-docs-vocabulary` · `check-uat-oracles` | all exit 0 |
| aggregator wall clock, 3 runs | **0.11 s / 0.09 s / 0.09 s** (29-05: 0.11 / 0.10 / 0.09; 29-01 baseline 0.12 / 0.09 / 0.09) |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — *below* it) |
| `.planning/STATE.md` longest backslash run | **1** (§F-2 baseline 1 — unmoved) |
| `git diff 41b91a5 HEAD -- package.json` | empty — zero packages installed |

The derived voice-guard count helpers 29-05 installed did their job: both counts fell (10 → 2, 5 →
1) and the two suite cases stayed green without anyone retyping a literal. The F-2 escape-doubling
mechanism stayed dormant across this plan's writes and the superlinear-regex incident did not recur.

## Occurrence counts, with the method that produced each (F-3)

A bare recursive grep reports zero matches on a binary-classified file with no warning, so every
count below names its method and two independent methods were run.

| count | value | method |
|---|---:|---|
| role files walked | 18 total / 17 in-set | Node `fs` walk over `agent-factory/roles`, `_`-prefixed filtered — the `listRoles()` rule |
| files failing a UTF-8 round-trip | **0** | Node: `Buffer.compare(Buffer.from(buf.toString('utf8'),'utf8'), buf)` per file |
| lines starting `You are ` | **2** (was 11 after 29-05, 17 at 29-01) | Node walk, per-line `startsWith` |
| — same, cross-check | **2** | `grep -acE '^You are '` — forced text mode |
| files carrying the D-30 sentence | **15** (was 7) | Node walk, `includes` |
| — same, cross-check | **15** | `grep -alc` — forced text mode |
| `file -b` classification of the eight | all `Unicode text, UTF-8 text` | `file(1)` |

Both methods agree at every count. The two surviving `You are ` openers are in `security-nfr.md` and
`compliance-officer.md`; **zero** survive in this plan's eight files or in 29-05's seven.

**The 29-05 encoding hazard did not recur.** No byte-level rewrite tool was used in this plan —
every edit went through the structured editor — and the UTF-8 round-trip check over all 17 role
files reports 0 failures, cross-checked by `file(1)`.

## The untouched-role control

The nine roles this plan does not own, `git show 41b91a5:<path>` against the working tree:

```
agents-md-scribe         3764 ->   3764  IDENTICAL
architect-design         3574 ->   3574  IDENTICAL
ba-pm                    3605 ->   3605  IDENTICAL
brownfield-mapper        2580 ->   2580  IDENTICAL
compliance-officer       4433 ->   4433  IDENTICAL
factory-coach            3448 ->   3448  IDENTICAL
frontend-ui              3724 ->   3724  IDENTICAL
security-nfr             5027 ->   5027  IDENTICAL
software-engineer        3507 ->   3507  IDENTICAL
```

`git diff --stat 41b91a5 HEAD -- . ':!.planning'` names exactly **18 files** — the eight roles,
their eight adapters, the catalog and the register — 204 insertions and 84 deletions. Nothing else
in the repository moved.

## Deviations from Plan

### Ordering deviation, recorded rather than tidied

**1. [D-37 ordering] `greenfield-mapper.md` took a further 24-byte removal AFTER its fallback sentence had landed**

- **Found during:** Task 1, the first role in the batch.
- **What happened:** the file measured 2916 → **2791** after its removals, then **2897** with the
  D-30 sentence appended. 2897 is comfortably under its 3045 FAIL ceiling but **15 bytes above its
  2882 WARN tier**, and it had entered the plan 34 bytes above WARN. A fourth caveman line —
  `Shiny stack wake demon.` — was then deleted, taking the file to **2873**, nine under WARN.
- **Why it is recorded:** D-37's ordering rule exists so that a file which breaches its ceiling
  always has a legal removal left. That invariant held throughout — the file was never above FAIL and
  the removal was still available when it was wanted. But the sequence really was
  remove → measure → add → measure → **remove again**, which is five measurement points and not the
  four the plan specifies, and writing it up as four would have described a run that did not happen.
  The transcript above carries both numbers.
- **Why the deleted line was the right 24 bytes:** it was decoration. The block still carries three
  distinct lexicon terms against a floor of two, and a block padded to raise its token count is the
  sprinkle-to-green shape D-07 names. The alternative — leaving the file above an advisory tier —
  was available and was the weaker outcome, since the whole batch otherwise clears WARN.
- **Files modified:** `agent-factory/roles/greenfield-mapper.md`.
- **Commit:** `1364ec8`

### Auto-fixed issues

**2. [Rule 1 — Bug] A disposition row carried a wrong word count**

- **Found during:** Task 2, when the eight `## One job` word counts were measured with the same
  `firstSentence()` split `generate-catalog.ts` uses.
- **Issue:** the `greenfield-mapper` row claimed the rewritten sentence was **14 words**. Measured,
  it is **15**. The number was written from a hand count while drafting the register rather than
  from the command.
- **Fix:** corrected to 15 and re-verified. A register whose whole purpose is to be read by a human
  against the diff is worse carrying a wrong number than carrying none, and the same class of defect
  — a hand-typed count that the build never checks — is the set-literal drift this repository has
  diagnosed in itself twice.
- **Files modified:** `docs/audit/29-style-dispositions/29-06.md`.
- **Commit:** `c0ef2d0`

### Measured corrections to the plan's own figures

- **`greenfield-mapper` carries ZERO duplicate clause groups, not the one §B-3 records.** Measured on
  the pre-edit tree; the cause is `CLAUSE_MIN_WORDS` discarding `do not overbuild` at three words.
  This batch's share of the five outstanding groups is therefore **four**, all four are cleared, and
  the arithmetic closes at 5 − 1 = 4.
- **The plan's per-role freed-byte figures from §A-1b are the trailing-sentence delete alone and
  understate the real removals by 3× to 7×.** Research budgets 22 / 38 / 53 / 47 / 0 / 39 / 61 / 27
  bytes; measured removals were 125 / 157 / 164 / 193 / 165 / 394 / 327 / 335. The difference is the
  first-sentence compression and the caveman-block content removal, neither of which the §A-1b budget
  models — which is why every file cleared WARN rather than merely FAIL.
- **`incident-responder`'s zero-freed claim is confirmed independently.** Its `## One job` trailing
  remainder is the empty string, against 4-to-11-word trailing sentences in the other seven.

### Requirement marking

`requirements-completed` is deliberately **empty**, and LANG-05, LANG-06 and LANG-03 all stay
`Pending`.

LANG-05 and LANG-06 are claimed by this plan **and by 29-07**, which rewrites the two remaining
dual-voice safety roles; LANG-03 is claimed by several further plans.
`gsd-tools requirements.mark-complete` marks every id in a plan's frontmatter, so running it here
would close requirements that two unrewritten role files still owe work against — the fabricated
completion plans 29-01 through 29-05 each caught and reverted.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced. The eight
rewritten role files carry no `TODO`, `FIXME`, `placeholder` or `coming soon`, and every deleted
sentence's content is either stated elsewhere in the same file or recorded as a deliberate removal in
a disposition row.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — D-19's section-ownership rule is still not mechanically enforced.** Carried
  from 29-01 and 29-05, unchanged. `guard_role_clause_uniqueness` catches a limit *restated*; nothing
  catches a prohibition stated once in the wrong section.
- **`orchestrator.md`'s WIP gate subsection still carries a prohibition outside `## Hard limits`** —
  *"Refuse to pull past a WIP limit or exceed width without a written reason"*. Left in place
  deliberately: it is an operational rule inside a capability surface, `## Hard limits` states the
  same boundary, and moving it would edit a safety subsection for no behavioural gain. The same
  shape as 29-05's `frontend-ui` `## Reads` residual.
- **`UNKNOWN - verify` — whether a rewritten role still withholds the same permission is a human
  judgement.** The register proves every changed clause was dispositioned; it proves nothing about
  any disposition's substance. The LANG-03 and LANG-06 manual checks are a named human reading the 97
  rows against the diff. This matters more in this batch than in 29-05, because `release-manager`
  item 4 and the orchestrator's spawn-tool line are both safety-adjacent deletions.
- **No gate in this tree detects a non-UTF-8 byte in kit markdown.** 29-05's residual, unchanged. The
  round-trip check was run manually here and reports 0 failures; nothing in the build would have
  caught a failure. A one-line round-trip check over the derived kit corpus would hold it.
- **`security-nfr.md` is the last role above its WARN tier**, at 5027 against 4830, and §A-1b projects
  it breaching its 5102 FAIL ceiling on D-19 + D-30 alone. Plan 29-07 owns it, and the D-26 remedy —
  raising the table — remains unavailable.

## Threat Flags

None beyond the plan's own register.

- **T-29-32 (byte-ceiling tampering) — closed by absence.** `git diff 41b91a5 HEAD --
  scripts/check-foundation-guards.ts` is empty; `roleCeiling()` is byte-unchanged, and the D-37
  escalation never arose because every file cleared WARN.
- **T-29-33 (the orchestrator's routing description) — mitigated and measured.** Rewritten once,
  regenerated in the same commit, byte-gated by the adapter freshness check, asserted at 17 words and
  shown above to retain every routing-matchable term. A second regeneration leaves the tree clean.
- **T-29-34 (reword of a safety-surface file) — mitigated.** 97 rows, one frozen intersection with a
  companion cell, gate exit 0. No `## Hard limits` line was edited in any of the eight files.
- **T-29-35 (a fact surviving only in a caveman block) — mitigated.** Every deleted line's fact is
  named in its row against the clear-voice section that states it. The residual above records that
  the substance of that judgement is a human check, not a gate's.
- **T-29-36 (occurrence counts) — mitigated.** Every count carries its method and two independent
  methods agree.
- **T-29-37 (aggregator runtime) — measured:** 0.11 / 0.09 / 0.09 s, inside the historical band.
- **T-29-SC (package installs) — asserted by absence:** `git diff 41b91a5 HEAD -- package.json` is
  empty. Zero packages installed.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-style-dispositions/29-06.md
```

Commits claimed, verified in `git log`:

```
FOUND: 1364ec8  refactor(29-06): eight more roles onto the canonical skeleton
FOUND: c0ef2d0  docs(29-06): correct the greenfield-mapper `## One job` word count in the register
```
</content>
