---
phase: 28-kit-consistency-audit
plan: 06
subsystem: audit-artifacts
status: complete
tags: [audit-01, d-02, d-06, d-07, d-18, d-19, read-pass, disposition-register, duplicate-grammar]

requires:
  - scripts/audit-model.ts (readRegister — the ONE parse authority; imported, never duplicated)
  - scripts/kit-model.ts (listRoles — the derived read set, generated not typed)
  - docs/audit/28-prepass-evidence.md (the 123 mechanical rows, read in full first)
  - agent-factory/config/factory.config.json (live config keys, for categories 2 and 4)
provides:
  - "18 of the 37 disposition-register rows filled — 17 derived roles + the D-02 protocol row"
  - "15 located findings F-28-008..022 (4 fixed, 11 deferred to Phase 29)"
  - "the safety_surface column for all 18 rows — D-18's input for Phase 29's LANG-02 exclusion list"
  - "the measured refutation of the _role-switch-protocol.md step-4 handoff candidate"
  - "the measured impossibility of the F-28-001..007 renumbering, recorded in the register"
affects:
  - 28-07 (fills the remaining 19 workflow rows; the gate stays RED until it does)
  - 28-05 (still owns `## Recorded couplings and out-of-set notes` — untouched by this plan)
  - Phase 29 (11 deferred findings; LANG-08 owns the ceiling re-baseline F-28-008 waits on)
  - scripts/check-audit-register.test.ts (one case repaired — second grammar removed)

tech-stack:
  added: []
  patterns:
    - "ask the ONE parse authority for a column; never substring-match the row"
    - "assert the finding's own premise before recording it — two were refuted and dropped or restated"
    - "a refused instruction is recorded as a measured refusal, never worked around by widening a grammar"
    - "a byte-reducing deletion in preference to a path substitution when a label resolves to nothing"
    - "a uniform column is stated as a limit, never left to pass for a measurement"

key-files:
  created: []
  modified:
    - docs/audit/28-disposition-register.md
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/greenfield-mapper.md
    - scripts/check-audit-register.test.ts

decisions:
  - "The F-28-001..007 renumbering 28-03 handed this plan is STRUCTURALLY IMPOSSIBLE and was not performed. All seven name files outside the derived audit set, and readRegister()'s foreign-key arm refuses them. The refusal was watched on a mirror before anything was written. The grammar was not widened, Table A was not extended, and the band is left as a documented hole with the reason in the register."
  - "safety_surface is `yes` on all 18 rows, and the uniformity is named in the register rather than disguised. Every role's `## Hard limits` carries permission-bearing or no-fabrication text and the flag is per FILE, so `yes` is the honest value under D-18's stated asymmetry. The consequence — an exclusion list that excludes the whole role corpus does not narrow LANG-02's work — is written down as Phase 29's problem, not resolved by manufacturing variance."
  - "Four defects fixed under D-19, eleven findings deferred. The line drawn: a fix is taken only when the correction is forced by measurement and needs no design judgement. The `Done` board-ownership collision (F-28-015) was DEFERRED for exactly that reason — choosing between the Release Manager and the Orchestrator is a design decision, and an audit that settles one has stopped auditing."
  - "The `Phase-4` labels were fixed by DELETING the label, not by substituting a workflow path. Deletion leaves a sentence that already names the one workflow that exists, and it removes bytes from two files that were already in ceiling WARN — so no ceiling was raised and no role was trimmed to fit one."
  - "Rule 1 auto-fix on scripts/check-audit-register.test.ts: it selected counted rows by the substring `| yes |`, a SECOND GRAMMAR over the register's bytes that was only accidentally correct while every safety_surface was `—`. Repaired to read the column through readRegister(), and to perform the lister set-equality its own comment claimed but never did."

metrics:
  duration: ~75m
  tasks: 2
  commits: 2
  files-changed: 6
  completed: 2026-08-12

actuals:
  tokens: 121000
  tasks: 2
  commits: 2
---

# Phase 28 Plan 06: The Role Read Pass Summary

Eighteen kit files read whole and recorded — seventeen derived roles plus the one protocol file the
count excludes and drift does not — producing fifteen located findings, four one-line defect fixes,
a safety-surface flag on every row, and three measured refusals: a carried-in candidate that did not
reproduce, a renumbering obligation that the parse authority forbids, and a test predicate that was
reading the wrong column.

## The read set was generated, never typed

```
$ node -e "const k=require('./scripts/kit-model.js'); console.log(JSON.stringify(k.listRoles()))"
["agents-md-scribe.md","architect-design.md","ba-pm.md","brownfield-mapper.md",
 "compliance-officer.md","factory-coach.md","frontend-ui.md","greenfield-mapper.md",
 "incident-responder.md","installer.md","orchestrator.md","qe-e2e.md","release-manager.md",
 "security-nfr.md","software-engineer.md","system-analyst.md","uat-planner.md"]
count 17   ROLE_COUNT 17
```

**All 17 were read in full, inline, by the agent that wrote the verdicts** — no file was delegated to
a subagent (T-28-34), and the read set matched the generated list exactly, member for member.
`orchestrator.md` was read first, as the plan directs, because it is the file the other 16 are
consistent or inconsistent with. `docs/audit/28-prepass-evidence.md` was read in full before any role
file was opened, so every read started pre-seeded (D-06's ordering).

The 18th file, `agent-factory/roles/_role-switch-protocol.md`, was read whole under the same six
categories. `counted: no` changed nothing about the read.

## Findings by category and disposition

| Category | Count | | Disposition | Count |
|---|---|---|---|---|
| 1 — factual correctness | 4 | | `fixed` | 4 |
| 2 — reference integrity | 4 | | `deferred` → 29 | 11 |
| 3 — claim honesty | 1 | | `accepted` | 0 |
| 4 — internal consistency | 2 | | | |
| 5 — strangeness | 0 | | | |
| 6 — instruction determinism | 4 | | | |
| **Total** | **15** | | **Total** | **15** |

All four category-6 findings are `deferred` to phase 29 — not by discipline but because
`readRegister()` refuses anything else, so the parse succeeding is the proof. Verified at run time:
`cat6 all deferred->29: true`.

Six of the seventeen roles carry **zero** findings — `ba-pm`, `factory-coach`, `frontend-ui`,
`incident-responder`, `software-engineer`, `system-analyst`, `uat-planner` (seven, in fact). Their
observations state what was checked and what was found in order, which is a different statement from
a bare word and is what the gate's bare-observation refusal is for.

## The four defects fixed under D-19

Every one is named here with its finding id, and `git diff --stat agent-factory/roles/` matches this
list exactly — **4 files changed, 4 insertions, 4 deletions**, one line each.

| Finding | File | Before → after |
|---|---|---|
| F-28-011 | `agents-md-scribe.md:41` | `the other 14 roles` → `the other 16 roles` |
| F-28-013 | `compliance-officer.md:36` | `and fills \`agent-factory/checklists/compliance-checklist.md\`` → `and works through …` |
| F-28-016 | `brownfield-mapper.md:35` | `under the Phase-4 brownfield bootstrap workflow` → `under the brownfield bootstrap workflow` |
| F-28-017 | `greenfield-mapper.md:36` | `under the Phase-4 greenfield bootstrap workflow` → `under the greenfield bootstrap workflow` |

**F-28-013 is the one that mattered.** `compliance-officer.md` instructed the role to *fill* a file
under `agent-factory/`, which is a WRITE into the read-only kit and a direct contradiction of
`AGENTS.md:43` § Kit vs state — a rule AGENTS.md declares a safety rule and which this role's own
header block quotes four lines above. It was the only such instruction in the corpus: `grep` for a
role telling an agent to fill or write a kit path returns exactly one hit. The correction is a
**re-narration, not a path swap** (D-11's posture): `release-manager.md:33`, `security-nfr.md:32` and
`uat-planner.md:32` all already say *"work through"* for their kit checklists, and the same sentence
already publishes the assessment as typed notes per Workflow 16 — so the write it named was never the
mechanism, only the wording.

**F-28-011 was measured, not eyeballed.** `grep -l "Follow the 12 coding rules" agent-factory/roles/*.md`
returns **16** files — the 17 `listRoles()` members minus the Scribe itself, which is the one role
that authors the rules rather than inheriting them. The text said 14, a count stale since a 15-role
kit.

**F-28-016 / F-28-017 were fixed by deletion, deliberately.** Both files were already in ceiling
WARN before this plan (2746B ≥ 2693B and 2924B ≥ 2882B). Substituting the workflow path would have
added ~40 bytes each and pushed them toward FAIL; deleting the dangling `Phase-4` label leaves a
sentence that already names the one workflow that exists and removes 8 bytes from each.

### Byte-ceiling effect of the four fixes, measured

| File | Before | After | WARN | FAIL |
|---|---|---|---|---|
| `agents-md-scribe.md` | 4094B | **4094B** (byte-neutral) | 4301 | 4544 |
| `compliance-officer.md` | 4425B | **4433B** (+8) | 4555 | 4813 |
| `brownfield-mapper.md` | 2746B (WARN) | **2738B** (−8) | 2693 | 2845 |
| `greenfield-mapper.md` | 2924B (WARN) | **2916B** (−8) | 2882 | 3045 |

**No ceiling was raised and no role was trimmed to fit one.** `guard_role_size` reports the same
8 roles in WARN before and after; the two mapper files are strictly smaller than they were.

## Three things this read measured rather than transcribed

### 1. The `_role-switch-protocol.md` step-4 candidate is REFUTED

The carried-in candidate — that step 4 still demands *"write the role's handoff file under
`agent-factory/handoffs/`"* — **does not reproduce.** Step 4 now reads *"RECORD the work output as
typed notes per Workflow 16"*, fully re-narrated onto the shared-verified-context flow.

Measured, not glanced at:

```
$ grep -nic "handoff" agent-factory/roles/_role-switch-protocol.md
0
```

Zero occurrences, case-insensitively, in **any** form. That covers the specific gap the plan named:
the file is in `check-kit-refs`'s SCAN set, so `RETIRED_PATH_FORMS` (`["agent-factory/handoffs/"]`)
already asserts the *path* to zero — but a surviving passage naming the retired relay **without**
naming its path would be invisible to that assertion, and that is the case `guard_adapter_body`
covers for adapters and nothing covers here. It did not materialise. `docs/design/shared-install.md`
records a historical state; Phase 24's rewrite reached this file.

**The read was still worth its cost**, and not because a null result is interesting: it found two
*other* claims the file makes about the rest of the kit that no longer hold.

**F-28-021** — lines 17-18 assert *"Every entry point (the Orchestrator's responsibilities, every
workflow's 'Agents involved' block) references THIS file by path."* **Measured false:**

```
$ for f in agent-factory/workflows/*.md; do grep -q "_role-switch-protocol" "$f" || echo "MISSING: $f"; done
MISSING: agent-factory/workflows/16-context-read-write.md
MISSING: agent-factory/workflows/17-task-claim.md
MISSING: agent-factory/workflows/18-context-compaction.md
```

16 of 19, not 19 of 19 — and all 19 carry an `Agents involved` block, so the three exceptions are not
files that lack the block the sentence keys on. The second half of the claim (*"nobody else inlines
the steps"*) holds. Deferred rather than fixed: the correction is a choice between weakening the
claim and adding the reference to three workflow files, and those three are **28-07's** read set.

**F-28-022** — the file calls the single-window sequential role-load *"the default substrate"*, which
v2.0 reversed for Claude Code. Same class as F-28-008 below, and worse here because the Degraded tier
is the tier that points *at* this file.

### 2. The F-28-001..007 renumbering is structurally impossible — and the parse authority refuses it

28-03 handed this plan the obligation to enter `docs/audit/28-residual-sizing.md`'s `F-28-A`…`F-28-G`
into Table B as `F-28-001`…`F-28-007`. **All seven name files outside the derived audit set:**

| Id | File it names | Table A row? |
|---|---|---|
| F-28-A | `.planning/ROADMAP.md` | no |
| F-28-B | `.planning/milestones/…/22-VERIFICATION.md` | no |
| F-28-C | `scripts/context-io.ts` | no |
| F-28-D | `scripts/check-uat-oracles.ts` | no |
| F-28-E | `.planning/phases/28-kit-consistency-audit/` | no |
| F-28-F | `28-02-PLAN.md` | no |
| F-28-G | `scripts/context-io.ts` ↔ `scripts/frontmatter.ts` | no |

Table A holds only `agent-factory/` roles and workflows — verified at run time:
`Table A files all under agent-factory/ ? true`.

**The refusal was watched, on a mirror, before anything was written** — the plan-premise discipline
this repository has needed six times:

```
$ # planted `| F-28-001 | .planning/ROADMAP.md | 4 | fixed |  | originally F-28-A … |` on a mirror
audit-model: refusing to parse docs/audit/28-disposition-register.md — Table B's row at line 166
(F-28-001) names file ".planning/ROADMAP.md", which has no row in Table A. … If the note is about a
file with no Table A row, it belongs in `## Recorded couplings and out-of-set notes`, which exists
for exactly that case
```

**The grammar was not widened, the ids were not forced into rows, and Table A was not extended.**
Extending it would break the D-03 equality this phase built and would admit non-kit files to a set
whose entire definition is the derived kit. The seven remain findings of the sizing document, under
their original letter ids, and `F-28-001`…`F-28-007` are left a **documented hole** so a reader
following the trail lands on nothing rather than on an unrelated finding wearing the id they wanted.
The register now records this in place of the impossible instruction.

This is the same refusal plan 28-04 met from the other direction when its plan told it to file claim
findings in Table B. Two plans, one instruction class, one refusal — the constraint is the parse
authority's, not a preference.

### 3. A finding whose own premise was false, dropped before it shipped

A category-6 finding against `ba-pm.md:34` was drafted: *"Size and prioritize at refinement; flag
`XL` to split"* with the `XS=1 S=2 M=3 L=5 XL=8` scale living only in `orchestrator.md:71`. Checking
the premise killed it — the scale is **also** at `agent-factory/seed/plans/board.md:110` (*"T-shirt
size maps to points: `XS=1, S=2, M=3, L=5, XL=8`. **XL must be split**"*), and `ba-pm.md:22`'s
`## Reads` already names `plans/board.md`. The premise was wrong; the finding was dropped rather than
softened, and `ba-pm.md` carries 0 findings with the near-miss recorded in its observation.

F-28-018's premise was corrected the same way: `agent-factory/packaging/adapters.md` **does** ship
(the kit root is `$GRUGOPS_HOME/agent-factory`, `install/install.ts:136`), so the finding is that
`installer.md` carries no POINTER to it — not that the artifact is missing.

## The test regression, and why it is the phase's own subject

`npx vitest run` went red after task 2 on **one** case:

```
FAIL scripts/check-audit-register.test.ts > the committed register's 36 counted paths equal the
     LIVE listers' output — expected 37 to be 36
```

The register is correct — `readRegister()` reports `rows 37 counted 36` — so this was a broken
oracle, not a broken artifact. The cause:

```ts
.filter((l) => l.startsWith("| agent-factory/") && l.includes("| yes |"))
```

**A second grammar over the register's bytes, inside the harness for the gate that exists to stop
exactly that.** The substring predicate is only accidentally equivalent to *"the `counted` column
says yes"*: it holds while every `safety_surface` is the unfilled marker `—`, and breaks the moment a
row carries `safety_surface: yes`, because it then matches the **wrong cell**. Demonstrated:

```
old substring predicate selects: 37
parse authority selects:         36
the extra row the substring dragged in: agent-factory/roles/_role-switch-protocol.md
row `| … | protocol | no | yes | 2 | … |`  ->  includes("| yes |") == true
```

An **uncounted** row counted as counted, by a text match, in a file whose whole subject is a register
that must not be read by two grammars.

**Fixed (deviation Rule 1)** by asking the one parse authority for the column. And a second false
premise in the same case was fixed with it: the comment said *"generated at run time from the listers
and compared"*, but **the body compared nothing against any lister** — it asserted two cardinalities
and never touched `listRoles()` or `listWorkflows()`, so a register naming 36 *wrong* paths passed
it. It now performs the set equality it always claimed.

**The repair was proven to bite, not just to go green** — a green test proves nothing on its own here:

| Input | New assertion |
|---|---|
| the real tree | sets equal → **passes** |
| a decoy: 36 rows, cardinality intact, **one path swapped** | sets equal `false` → **fails** |

The old count-only body passed that decoy. The new one refuses it.

## The `safety_surface` column came out uniform, and that is stated

**All 18 rows are `yes`. Zero `no`.** This is the honest value, not a default: every role's
`## Hard limits` carries permission-bearing or no-fabrication text — *"Do not write production
code"*, *"you never deploy prod yourself"*, *"an agent that self-signs has removed the one human the
gate exists for"*, *"never fake a test result"* — and D-18's flag is per **file**, so one
load-bearing sentence makes the file a safety surface. The plan's stated asymmetry (mark `yes` where
the judgement is close) points the same way.

**But a column with no variance decides nothing, and saying so is part of the measurement.** An
exclusion list that excludes the entire role corpus does not narrow LANG-02's work — it relocates the
question to which *sentences* are load-bearing, a granularity this column cannot express. That is
written into the register itself, beneath Table A, as Phase 29's problem rather than resolved here by
manufacturing variance to make the column look discriminating.

Run-time confirmation: `safety_surface yes=18 no=0 —=19` (the 19 are 28-07's workflow rows).

## Out-of-set items the plan asked about

- **`oracleWr05Wording` (`scripts/check-uat-oracles.ts:110-134`).** Confirmed present, with its own
  in-code note naming *"Owner: plan 28-06 (the disposition register)"*. **It has no Table A row and
  cannot get one** — the same refusal as F-28-A..G above. It is `docs/audit/28-residual-sizing.md`'s
  F-28-D and stays there. Reported here as the plan directs. Its `WR05_SCAN` still hand-lists four
  `.planning/` documents in a repository that archives `.planning/` at milestone close; whether it is
  still load-bearing remains open and belongs to whoever owns the oracle, not to AUDIT-01.
- **The five-tool dispatch table (`agent-factory/README.md:38-44`).** The plan asked me to *"confirm
  28-05 already recorded it."* **Measured: 28-05 has not run** — it is wave 6, this plan is wave 5,
  and no `28-05-SUMMARY.md` exists. It does **own** the item explicitly: `28-05-PLAN.md` names the
  table at lines 169-170, 195 and 234, including *"predates the three-tier vocabulary"*. So the item
  has an owner and a plan; it simply has not executed yet. Recorded as what it is rather than as the
  confirmation the plan expected.
- **Two more `Phase-N` build-phase labels survive outside the audit set**, same class as F-28-016/017
  and with no Table A row: `agent-factory/checklists/00-index.md:9` (*"the Phase-6 validator"*) and
  `agent-factory/seed/plans/board.md:105` (*"The Phase-4 scrum cadence"*). Not fixed, not filed —
  they belong in `## Recorded couplings and out-of-set notes`, which is **28-05's** section and was
  deliberately left untouched by this plan.
- **`CLAUDE.md` names the command shape as `/grug`**, while the kit ships `/grugops` (standalone
  `.claude/skills/grugops/`) and `/grugops:<op>` (plugin form). `orchestrator.md:40`'s `/grugops` is
  therefore **correct** and was not treated as a defect; the drift is in `CLAUDE.md`, which has no
  Table A row. This joins 28-04's recorded `CLAUDE.md` drift (a root `VERSION` file that does not
  exist) as a second CLAUDE.md finding with no owner.

## Verification Results

| Check | Result |
|---|---|
| plan task-1 automated check | **exit 0** — `all 17 role rows filled and counts agree` |
| plan task-2 automated check | **exit 0** — `rows 37 counted 36` |
| `readRegister()` per-file finding counts | **no mismatches**; declared total **15** = Table B rows **15** (both D-03 equalities at both granularities) |
| every category-6 row `deferred` → 29 | `true` — and the parse succeeding is the proof |
| `safety_surface` | `yes=18 no=0 —=19`; zero role or protocol rows left at the marker |
| `node scripts/check-audit-register.js` | **exit 1**, `2 CHECK(S) FAILED` — **19 distinct files named, all `agent-factory/workflows/`, zero under `roles/`** |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/check-claim-anchors.js` | exit 0 (28-04's gate unaffected) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `node scripts/check-public-docs-vocabulary.js` | untouched — 28-01's intended red, not run against by this plan |
| `npm run freshness` | exit 0 |
| `npx tsc --noEmit` / `npm run typecheck` | exit 0 (both) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **exit 0 — 44 files, 1525 passed, 2 skipped** (was 1525 passed before the plan; one case repaired, none added) |
| `git diff --stat agent-factory/roles/` | 4 files, **4 insertions, 4 deletions** — matches the D-19 table exactly |
| `git diff package.json` | **empty** across both commits (T-28-38) |
| `git diff scripts/kit-model.ts` / `scripts/audit-model.ts` | **empty** — no second lister, no widened grammar |
| `## Recorded couplings and out-of-set notes` | **unchanged** — 28-05's section, untouched |

The 2 skipped tests are pre-existing and untouched.

## The register gate remains RED, and that is the expected state

`node scripts/check-audit-register.js` exits **1** with `2 CHECK(S) FAILED`. **This plan does not
report a pass and does not claim the green transition.** The 19 workflow rows are unfilled and they
are **28-07's**. What changed is *which* rows are red: the failure list went from 37 rows to 20 and
now to 19, and it names zero role rows and no longer names the protocol row. The shape of the red is
the deliverable — it is now precisely the unread workflows and nothing else.

## Prohibitions — Each Confirmed

| Prohibition | Evidence |
|---|---|
| No role prose edited except a D-19 trivial defect | `git diff --stat agent-factory/roles/` = 4 files / 4 insertions / 4 deletions, one line each, each named above with its finding id |
| No category-six determinism finding fixed | 4 cat-6 findings, all `deferred` → 29; `readRegister()` refuses any other, so the parse is the proof |
| No observation is a bare word asserting an absence | 18/18 substantive; the gate's bare-observation arm names zero of them, and the 7 zero-finding rows state what was checked |
| No file dispatched to a subagent | every file read inline by the agent that wrote its verdict; zero `Agent`/`Task` calls in this plan |
| No finding recorded against a file with no Table A row | 15/15 name Table A members; the one attempt to do otherwise was made on a **mirror**, watched refused, and never written to the tree |
| No byte ceiling raised, no role trimmed to fit one | `roleCeiling()` untouched; `guard_role_size` reports the same 8 WARN roles before and after; the two edited mapper files are **smaller** |
| The register's "does not prove" prose not softened | `## What this register does not prove` byte-unchanged; the added prose only names a **new** limit (the uniform column) |
| `## Recorded couplings and out-of-set notes` not touched | still `*(Empty until 28-05.)*` |

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-33 (an unearned `observation`) | mitigated as far as a mechanism reaches, residual **named** | files read inline so the read and the verdict sit in one context; pre-pass read in full first; every observation cites something checkable — a line number, a byte count, a config value, a grep result — so a reader can falsify any of them. The irreducible remainder stays named in the register's own prose. |
| T-28-34 (a delegated verdict) | mitigated | no subagent was spawned; every verdict was written by the agent that read the bytes |
| T-28-35 (a false `safety_surface: no`) | mitigated — **zero `no` values exist** | the failure mode requires a `no`, and there are none. The opposite risk (a uniform column deciding nothing) is the one that materialised and it is written into the register rather than left to be discovered. |
| T-28-36 (a category-6 finding fixed) | mitigated | structural parser refusal, not convention; all 4 cat-6 rows are `deferred` → 29 and verified at run time |
| T-28-37 (reading 18 files inline) | accepted | bounded at 18 files from one directory; the cost was context, and it was budgeted |
| T-28-38 (npm/pip/cargo installs) | accepted, **verified** | no install occurred; `git diff package.json` is empty across both commits |

## Deviations from Plan

**Rule 1 applied once** — the `check-audit-register.test.ts` second-grammar defect above. It was
introduced by 28-03, surfaced by this plan's own edit, and fixed with a control that was proven to
bite on a same-cardinality decoy.

**Two plan premises corrected by measurement** (the false-premise class this repository has now hit
across four consecutive plans):

1. **The F-28-001..007 renumbering cannot be performed.** The plan states it as a task-1 action and
   28-03's summary hands it over by name. The committed parse authority refuses every one of the
   seven. Recorded as a measured refusal in the register; grammar untouched.
2. **"Confirm 28-05 already recorded [the dispatch table]"** presumes 28-05 has run. It has not —
   28-05 is wave 6 and this plan is wave 5. Reported as ownership-confirmed-but-not-yet-executed.

**One finding dropped for a false premise of its own** — the `ba-pm.md` sizing-scale finding, killed
by `seed/plans/board.md:110`. Recorded here rather than silently omitted, because a finding that was
considered and refuted is a different fact from one never considered.

**One in-latitude choice, not a deviation:** two stale prose paragraphs in the register were updated
— the header's *"until then every observation is empty"* (false once 18 rows were filled) and the
`safety_surface` note's *"carries `—` on every row above"* (false for 18 of 37). Leaving them would
have made the artifact assert something untrue about itself, which is the failure this register
exists to refuse. Neither edit softens or removes a "what this does not prove" statement.

## Checkpoints

None. Both tasks were `type="auto"`. No checkpoint, decision, auth gate, package install or
architectural question arose.

## Known Stubs

**None introduced by this plan.** The 19 unfilled workflow rows are 28-03's declared stub and
**28-07's** deliverable, not this plan's omission — they are why `check-audit-register.js` still
exits 1, and both the CI workflow file and the gate's own header record the expected-red and its
reason, so it cannot reach `/gsd-ship` silently.

## For the Next Plans

- **28-07** fills the 19 workflow rows. The `F-28-0NN` band is used through **F-28-022**; start at
  `F-28-023`. `F-28-001`…`F-28-007` are a permanent documented hole — **do not reuse them**, and do
  not attempt the renumbering: the parse authority refuses it and the reason is now in the register.
  `F-28-2NN` remains 28-04's.
- **28-07 also owns F-28-021's other half.** Three workflows (`16-context-read-write.md`,
  `17-task-claim.md`, `18-context-compaction.md`) do not reference `_role-switch-protocol.md` while
  that file claims all of them do. 28-07 reads all three; it is the plan that can decide whether to
  add the reference or weaken the claim.
- **28-07 derives D-18's exclusion list.** The register side is now `yes` on all 18 filled rows.
  If the workflow rows come out uniformly `yes` too, the derived list is *every file in the kit* —
  and the honest output is that plus the statement that the column cannot express sentence
  granularity, not a list that pretends to narrow anything.
- **Phase 29 inherits 11 deferred findings.** Two of them, **F-28-008** and **F-28-022**, are the
  same defect in two files (the two-mode spawn vocabulary where three tiers ship) and should be
  corrected together so one vocabulary lands in both at once. F-28-008 is **blocked on LANG-08's
  ceiling re-baseline** — `orchestrator.md` has 75 bytes of headroom and the text it needs is longer
  than that.
- **Two CLAUDE.md findings now have no owner** — the non-existent root `VERSION` file (28-04) and the
  `/grug` vs `/grugops` command-shape drift (this plan). `CLAUDE.md` has no Table A row and no plan
  in this phase claims it.
- **CI is red on two Phase 28 gates** (`check-public-docs-vocabulary` from 28-01, and
  `check-audit-register`), green on `check-claim-anchors`. All three are the recorded, intended
  state.

## Self-Check: PASSED

All 6 modified files exist on disk and carry the changes described (`docs/audit/28-disposition-register.md`,
four role files, `scripts/check-audit-register.test.ts`), and both commits (`7788978`, `9a498c6`) are
present in `git log`.
