---
phase: 28-kit-consistency-audit
plan: 07
subsystem: audit-artifacts
status: complete
tags: [audit-01, d-01, d-03, d-04, d-05, d-06, d-07, d-18, d-19, read-pass, green-transition, derived-set]

requires:
  - scripts/audit-model.ts (readRegister/readRegistry — the ONE parse authority; imported, never duplicated)
  - scripts/kit-model.ts (listWorkflows — the derived read set, generated not typed)
  - docs/audit/28-prepass-evidence.md (the 123 mechanical rows, read in full first)
  - agent-factory/config/factory.config.json (live config keys and dial values, read at run time)
  - agent-factory/seed/plans/{board,metrics,traceability}.md (the frozen column, metric and id sets)
provides:
  - "the 19 workflow register rows — all 37 rows now filled, and the D-05 completeness gate GREEN for the first time"
  - "17 located findings F-28-023..039 (5 cat-2, 3 cat-3, 5 cat-4, 2 cat-5, 2 cat-6), all deferred to Phase 29"
  - "docs/audit/28-safety-surface-exclusions.md — D-18's list, DERIVED from two sources and freshness-gated (41 entries)"
  - "scripts/generate-safety-surface.js — renderSafetySurface/safetySurfaceUnion/OUT/REGEN_COMMAND"
  - "the folded exclusion-list freshness guard inside scripts/check-audit-register.js"
  - "the D-01 amendment: 18 roles -> 17 at four sites, each carrying its derivation rule"
  - "the re-verification of every `fixed` disposition in the phase against the tree"
affects:
  - 28-08 (the last plan; the full sweep is green at every gate before it starts)
  - Phase 29 (28 deferred findings, a 41-entry exclusion list, and 6 located category-6 determinism sites)
  - Phase 30 (the claim registry's 6 `kind: safety` rows now also feed the exclusion list)
  - scripts/check-audit-register.test.ts (mirrors extended; the stale expected-red case inverted)

tech-stack:
  added: []
  patterns:
    - "derive the set from two already-maintained sources rather than hand-listing a third"
    - "an empty derived set is a NAMED refusal, never an empty artifact"
    - "PARSER admits, GATE refuses — reused for exclusion-list freshness"
    - "a stale expected-red assertion is INVERTED, never deleted — the real-tree case is the one worth keeping"
    - "assert the harness's own premise; four of mine were false and each was re-measured"
    - "a number in a generated file is derived, never typed — including in its prose"

key-files:
  created:
    - scripts/generate-safety-surface.ts
    - scripts/generate-safety-surface.js
    - scripts/generate-safety-surface.test.ts
    - docs/audit/28-safety-surface-exclusions.md
  modified:
    - docs/audit/28-disposition-register.md
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - package.json
    - .github/workflows/ci.yml
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

decisions:
  - "ZERO D-19 trivial fixes were taken in the 19 workflows, and that is a result rather than an omission. Every one of the 17 findings needs either a design decision (who owns the `Done` exit), a prose rewrite Phase 29 owns, or a packaging change (four modules the installer never materializes). None met D-19's bar of a correction forced by measurement and needing no design judgement. `git diff agent-factory/` is EMPTY across all three commits."
  - "The four not-installed-in-a-host-repo findings (F-28-028, F-28-035, F-28-037, F-28-038) are recorded PER FILE rather than folded into one corpus-wide row. Each names a DIFFERENT module and LANG-02 acts per file — the opposite call from F-28-009, which folded one identical sentence repeated seventeen times into a single row. The distinguishing question is whether a reader arriving at the file needs its own row to learn the fact."
  - "The plan's stated RATIONALE for folding the freshness guard into check-audit-register is false — that gate parses ONE artifact, not two; the registry belongs to check-claim-anchors. The DECISION was still followed and the reason corrected in the code comment: it belongs there because that gate enforces the `safety_surface` column's completeness, and 'every flag recorded' and 'the derived list matches those flags' are two halves of one question."
  - "The D-01 amendment could NOT be a Table B row, and the refusal was watched on a mirror before anything was written. Third plan in the phase to meet this instruction class (28-04, 28-06, 28-07); the grammar was not widened once. Recorded in the couplings section, which the parse authority's own refusal message names as the correct home."
  - "The stale expected-red case in check-audit-register.test.ts was INVERTED to assert exit 0, not deleted. Keeping it demanding exit 1 would make a completed register look like a regression; deleting it would drop the only case that runs the gate against the REAL artifact rather than a mirror."

metrics:
  duration: ~35m
  tasks: 3
  commits: 3
  files-changed: 12
  completed: 2026-08-12

actuals:
  tokens: 29675
  tasks: 3
  commits: 3
---

# Phase 28 Plan 07: The Workflow Read Pass and D-18's Derived List Summary

Nineteen workflow files read whole and recorded, turning AUDIT-01's completeness gate green for the
first time on two independent equalities; seventeen located findings, none of them fixed and each
saying why; a safety-surface exclusion list derived from two already-maintained sources rather than
hand-written, refusing to be empty and byte-gated against a fresh regeneration; and every `fixed`
disposition in the phase re-checked against the tree rather than accepted on the word of the plan
that recorded it.

## The register gate's PASS line, verbatim

This is the phase's completeness evidence, spliced from the run rather than retyped. Elided only in
the uncounted row's quoted observation, which the gate prints in full.

```
$ node scripts/check-audit-register.js ; echo "exit=$?"

[check_audit_register] the AUDIT-01 disposition register is complete against the derived kit (D-03 / D-05)
  PASS  AUDIT-01 completeness: equality one holds — 36 counted register row(s) set-equal in both
        directions to 36 derived file(s) (17 roles + 19 workflows); equality two holds — Table A
        declares 32 finding(s) and Table B carries 32, agreeing per file across all 37 row(s);
        1 uncounted row(s) recorded by name (agent-factory/roles/_role-switch-protocol.md — … );
        every observation substantive and every safety_surface recorded; and
        docs/audit/28-safety-surface-exclusions.md is byte-identical to a fresh regeneration of the
        D-18 union

== Result ==
ALL CHECKS PASSED
exit=0
```

**The green is a property of the REGISTER, not of the gate.** Nothing was loosened, no check was
removed and no row was dropped. `git diff` on `scripts/audit-model.ts` and `scripts/kit-model.ts`
across all three commits is **empty** — the parse authority and the listers are byte-unchanged, and
the only edit to the gate ADDS a check.

### Both D-03 equalities, recomputed independently of the gate

| Equality | Recomputed at run time | Holds |
|---|---|---|
| one — counted rows ≡ derived files | 36 counted, 36 derived, set-equal **both directions** | yes |
| two — declared findings = Table B rows | 32 = 32, **and per file, 0 mismatches across 37 rows** | yes |

Computed from `readRegister()` + `listRoles()`/`listWorkflows()` in a separate `node -e`, not read
from the PASS line — the line cannot vouch for itself.

## The read set was generated, never typed

```
$ node -e "const k=require('./scripts/kit-model.js'); console.log(k.listWorkflows().length, k.WORKFLOW_COUNT)"
19 19
```

**All 19 were read in full, inline, by the agent that wrote the verdicts** — no file was delegated to
a subagent (T-28-42/T-28-44), and `docs/audit/28-prepass-evidence.md` was read whole before any
workflow was opened (D-06's ordering). Total corpus 104,094 bytes, from `05-pr-quality-gate.md` at
13,831B down to `02-idea-to-epics.md` at 2,716B.

## Findings by category and disposition

| Category | This plan | Phase total | | Disposition | This plan |
|---|---|---|---|---|---|
| 1 — factual correctness | **0** | 4 | | `fixed` | **0** |
| 2 — reference integrity | 5 | 9 | | `deferred` → 29 | **17** |
| 3 — claim honesty | 3 | 4 | | `accepted` | 0 |
| 4 — internal consistency | 5 | 7 | | | |
| 5 — strangeness | 2 | 2 | | | |
| 6 — instruction determinism | **2** | **6** | | | |
| **Total** | **17** | **32** | | **Total** | **17** |

**Category 1 came out empty on the workflows, and that is a measurement.** Every workflow describes
decompose-and-enqueue over the shared verified context; the pre-pass's `retired-vocabulary` predicate
returns zero across the corpus, and no workflow names a spawn mode at all — the two-mode-versus-three-
tier defect (F-28-008, F-28-022) lives in role files, not here.

**All 6 category-6 findings in the phase are `deferred` → 29 and none was fixed.** Verified at run
time: `cat6 total: 6  all deferred->29: true  any fixed: false`. The parser refuses any other
disposition, so the parse succeeding is the proof rather than a claim of discipline.

## Zero trivial fixes were taken, and the diff proves it

```
$ git diff --stat 24dfc37..HEAD -- agent-factory/
(empty — 0 changed lines)
```

D-19's bar is a correction **forced by measurement and needing no design judgement**. 28-06 found
four such fixes in the roles; this read found none in the workflows, because every one of the 17
findings falls into one of three classes that fail that bar:

- **a design decision** — who owns the `Done` exit (F-28-030), what "capacity" means (F-28-033),
  where a carry-over item goes (F-28-034);
- **a prose rewrite Phase 29 owns** — the config literals restated inline (F-28-027), the metric
  mis-assignments (F-28-023, F-28-024, F-28-031), the unowned forward promise (F-28-025);
- **a packaging or installer change** — the four modules a host install never receives
  (F-28-028, F-28-035, F-28-037, F-28-038) and the un-seeded ignore rule (F-28-039).

Reporting an empty fix list is the honest outcome; taking a fix to make the list non-empty would be
the audit turning into a style pass on prose Phase 29 already owns.

## The largest thing this read found: four modules the kit names and no host install receives

Workflows 05, 16, 17 and 18 instruct a role to call `scripts/context-io.ts`, `scripts/claim.js` and
`scripts/compactor.ts` by repo-relative path, and workflow 16 states the rule as an absolute — *"The
only sanctioned writer of the shared context is `scripts/context-io.ts` … No role and no workflow
writes the `.grugops/context/` path by any other path."* **Measured, from the installer rather than
from recollection:**

```
$ grep -rn "context-io\|compactor\|claim\.js" install/
(zero hits)

install/install.ts:1215-1217   RUNNABLES = [
  ["scripts/runnable-ref/reference-check.js",      "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js",  "tools/grugops/test-skip-integrity.js"],
]
install/install.ts:1065        cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, {recursive:true})
```

Exactly **two** runnables reach a host repo and the kit `cpSync` copies `agent-factory/` only.
`package.json` is `private: true`, so a host cannot install them either. **The kit never says where
they come from**: `grep` for `context-io` in `AGENTS.md` and `agent-factory/README.md` returns zero.

**The one place they do exist is the Claude Code PLUGIN cache**, at
`${CLAUDE_PLUGIN_ROOT}/scripts/…` — a path no workflow names, and one that does not exist for the
standalone `.claude/` install form or for the four non-Claude-Code CLIs. Workflow 16's stop condition
closes the loop: *"The only way to record the result would be to hand-write the `.grugops/context/`
path → stop"*. A host agent following the workflow correctly must stop and can never record
anything.

Recorded as four findings rather than one because each names a different module and LANG-02 acts per
file. Every one is `deferred` — the correction is either a packaging change or a documented host
prerequisite, and both are architectural.

## Four more findings worth naming

- **F-28-025 — a forward promise nothing owns.** `04-ticket-to-pr.md:28` tells the reader mechanical
  no-second-red enforcement *"is planned for that quality gate"*. `05-pr-quality-gate.md` contains
  **zero** occurrences of the term, a repo-wide grep outside `.planning/` returns exactly one hit
  (the sentence itself), the deferral target was Phase 15 — completed 2026-06-13 as the TypeScript
  migration — and no roadmap phase or requirement names it. The only record of the deferral lives in
  `.planning/milestones/v1.2-phases/`, archived and invisible.
- **F-28-039 — a gitignore claim true of one repository only.** `18-context-compaction.md:72` asserts
  the ephemeral `threads/` tier *"is gitignored and is never committed"*. The rule is `.gitignore:12`
  in **this** repository; the installer writes no `.gitignore` into a target. The same section
  instructs committing the surrounding `notes/` and `index.*`, so an agent staging that directory
  sweeps in the trajectory it was just told is local-only.
- **F-28-036 — a fifth surface the safety sentence does not name.** `16-context-read-write.md:32`
  correctly qualifies the un-forgeable `human:<name>` stamp as Claude-Code-only and names the four
  non-CC CLIs as degraded. But `hooks/hooks.json` is the **only** hook wiring in the repository and
  it is plugin-level, so the standalone `.claude/` form is degraded too. Same shape 28-04 measured
  for the prod-deploy guard at C-28-023.
- **F-28-027 — a latent set-literal, currently correct.** `05-pr-quality-gate.md:31` restates
  `["lint","typecheck","unit","build"]`, `0.8` and `"ui-or-critical-path"` inline. All three match the
  shipped config **today**, which is why it is worth a row: a host that dials one leaves the sentence
  asserting the shipped default. This is the hand-maintained-set-drift class, inside the phase
  auditing for it. Workflow 09 shows the alternative — it names its keys and restates no value.

## Four claims that survived checking, and were not turned into findings

An audit that only reports hits is measuring its own appetite. Each of these was drafted as a
candidate and killed by checking its premise:

| Candidate | Measured | Verdict |
|---|---|---|
| `15-security-audit.md` claims ASVS L1=70, L2=253, L3=345 | counted the generated checklist: **345 rows, 70 at L1, cumulative 253 and 345** | **correct** — no finding |
| `09-daily-sweep.md` names 13 board columns as "the frozen set" | ordered set equality against `seed/plans/board.md`: **identical, same order** | **correct** — no finding |
| `13-incident.md` mints an `INC-xxxx` id the trace schema may not define | `seed/plans/traceability.md:26` defines `INC-xxxx incident` — **one line past where a shorter read stopped** | **premise false** — dropped |
| workflows 14-18 lack `## Metrics emitted` | `validate-agent-factory.ts:213-217` omits it from `WORKFLOW_SECTIONS` with the comment *"bonus and not asserted"* | **sanctioned** — no finding |

The `INC-xxxx` one is recorded in `13-incident.md`'s observation rather than silently omitted,
because a candidate that was considered and refuted is a different fact from one never considered.

## D-18's exclusion list — derived, not hand-listed

```
$ node scripts/generate-safety-surface.js
Wrote docs/audit/28-safety-surface-exclusions.md — 41 entries.
```

**41 = 37 register rows flagged `safety_surface: yes` + 4 registry files with no Table A row**
(`README.md`, `AGENTS.md`, `agent-factory/README.md`, `.claude-plugin/plugin.json`). The count was
**recomputed from `readRegister()` and `readRegistry()` at verification time**, not read from the
header, and the rendered set is set-equal to that recomputation.

**No real file is in both sources.** Table A holds only `agent-factory/` kit files and every
`kind: safety` claim lives in a public document outside it, so the de-duplication path cannot be
exercised by the shipped artifact — it is proven on a fixture instead, and this is stated rather than
left for a reader to assume the case was covered.

**Determinism:** two consecutive regenerations produce an empty `diff`.

**The `safety_surface` column is now `yes` on 37 of 37 rows and `no` on none** — the uniformity 28-06
predicted, confirmed from the other half. It is forced rather than chosen: *"Never merge, never
deploy; humans hold both"* appears in **every** workflow's `## Commit` section. So the derived list
covers the entire audited corpus, and the generated file says so in its own `## What this list does
not settle` section rather than presenting itself as selective.

### The flip-a-flag freshness transcript, on the REAL tree

Not on a fixture — this repository's recorded terminal lesson is that a green suite is not evidence
for a safety mechanism.

| Tree state | Gate |
|---|---|
| HEAD | **exit 0**, `ALL CHECKS PASSED` |
| `11-retro.md`'s `safety_surface` flipped `yes`→`no`, list untouched | **exit 1** — see below |
| reverted | **exit 0**, `git status --short` clean |

```
  FAIL  docs/audit/28-safety-surface-exclusions.md is STALE — the committed list differs from a
        fresh regeneration, so a `safety_surface` flag or a `kind: safety` claim moved without the
        derived list being rebuilt. Run `npm run generate:safety-surface` and commit the result
```

### Proving the RED is a measurement of the checks

All refusal cases were watched failing **against a deliberately permissive stub** — one that computes
the union correctly and then refuses nothing, dedupes nothing and sorts nothing — while the same run
showed the vacuous cases passing. That is what separates "the check is absent" from "the file is
absent", and it is the bar 28-03 and 28-04 each set.

| Stage | Result |
|---|---|
| permissive stub | **11 failed / 4 passed** — and the 4 that passed are exactly the ones that prove nothing alone (the fixed `OUT` literal, the two union-membership cases the stub implements, and the freshness green baseline before the guard existed) |
| real module | **15 passed** |

The empty-union case asserts a **throw**, not an empty file, and a second case asserts the message
says *why* — because an exclusion list with zero entries silently permits a style pass over every
file in the kit and presents as a clean green build (T-28-39). The one-byte case plants a single
trailing space to prove the comparison is exact and unnormalized.

## Two plan premises corrected by measurement

The false-premise class this repository has now hit in every plan of this phase.

1. **The freshness guard's stated rationale is wrong.** The plan says the predicate belongs in
   `check-audit-register.ts` because it is *"a predicate over the same two artifacts that gate
   already parses"*. That gate parses **one** — `readRegistry` is imported only by
   `check-claim-anchors.ts`. The **decision** was still followed, because a better reason exists and
   is now written into the code: this gate is the one enforcing the `safety_surface` column's
   completeness, and "every flag is recorded" and "the derived list matches those flags" are two
   halves of one question. The registry is reached only through the one parse authority, via
   `renderSafetySurface`, and is never parsed in the gate.
2. **The D-01 amendment cannot be a Table B row.** Task 3 directs recording it as a finding with
   disposition `fixed`. `readRegister()`'s foreign-key arm refuses a finding naming a file with no
   Table A row, and `.planning/ROADMAP.md` has none. **The refusal was watched on a mirror before
   anything was written to the tree**, and its message names the correct home:

   ```
   audit-model: refusing to parse … Table B's row at line 387 (F-28-040) names file
   ".planning/ROADMAP.md", which has no row in Table A. … If the note is about a file with no
   Table A row, it belongs in `## Recorded couplings and out-of-set notes`, which exists for
   exactly that case
   ```

   Third plan in the phase to meet this instruction class — 28-04 was told to file claim findings in
   Table B, 28-06 to renumber `F-28-A`…`F-28-G` into it, this plan to file a `.planning/` amendment.
   **One constraint, three plans, three refusals, and the grammar was not widened once.**

## Four verification harnesses of my own whose premises were false

Stated because this phase has hit the broken-harness class in every plan, and pretending my own
harnesses were clean would be the same failure pointed inward.

| Harness | False premise | Corrected measurement |
|---|---|---|
| board-column set equality | grabbed **every** backtick on the line, including `plans/board.md` and `wip_limits` → 17 "columns" vs 13 | restricted to the tail after `the frozen set:` → 13 vs 13, **ordered-equal** |
| ASVS requirement count | counted `\| ` table rows and bare `L1` substrings; the checklist uses `- [Vx.y.z] [L1]` list items → 0 rows, nonsense level counts | parsed the real row form → 345 rows, 70/253/345 cumulative, **claim correct** |
| F-28-016/017 fix re-verification | required a word between `the` and `brownfield`; the fix **deleted** that word → reported NOT FOUND on two fixes that had landed | matched the post-fix form → both present, plus a zero-occurrence counter-check on `Phase-4` |
| `INC-xxxx` trace-schema check | read `traceability.md` lines 1-25; the id scheme is at **line 26** → concluded the id was undefined | full read → `INC-xxxx incident` is defined; **candidate finding dropped** |

The third and fourth are the consequential ones: uncorrected, one would have reported two real fixes
as missing and the other would have shipped a fabricated finding.

## D-19 — every `fixed` disposition re-verified on the tree

**4 register rows checked, 4 held.** Each by reading the file **and** by a counter-check that the
pre-fix text is absent, because a fix present is a weaker statement than a fix present and the defect
gone.

| Finding | File | Verified on the tree | Counter-check |
|---|---|---|---|
| F-28-011 | `agents-md-scribe.md:41` | reads *"the other 16 roles"* | `grep -l` for the pointer returns **16** files; zero hits on *"the other 14 roles"* |
| F-28-013 | `compliance-officer.md:36` | reads *"and works through"* | zero files instruct **filling** a kit checklist path |
| F-28-016 | `brownfield-mapper.md:35` | reads *"under the brownfield bootstrap workflow"* | **zero** `Phase-4` occurrences under `agent-factory/roles/` |
| F-28-017 | `greenfield-mapper.md:36` | reads *"under the greenfield bootstrap workflow"* | same |

**Beyond the register, the other plans' fixes were re-verified rather than inherited:**

| What 28-05 / 28-02 recorded | Re-verified how | Result |
|---|---|---|
| 8 claim rows flipped after prose fixes | `check-claim-anchors.js` — 37 **byte-identical** verbatim comparisons | exit 0; registry now holds **zero** `false` rows (29 true / 9 overstated) |
| the AUDIT-02 drift fixes | `check-public-docs-vocabulary.js` + independent greps | exit 0; 0 hits for `handoff packet` in the 4 top docs, 0 for the dead path in `examples/` |
| both hygiene directories deleted | `test ! -d` on each | both **gone** |
| D-19 item 6, the AUDIT-04 pins | read all three sites | `@playwright/test 1.62.1`, `@axe-core/playwright 4.12.1` |
| D-19 item 7, the `oracleWr05Wording` hang | read `WR05_BEATS` | all three regexes `^`-anchored with a **consuming `[\s\S]` atom** after the lookaheads; `WR05_MAX_LINE_BYTES` present |

**The foundation gate's wall-clock runtime is 100–106 ms** across runs — the D-20 fix's effect stated
as a number rather than as a memory.

### The eight D-19 standing items, reconciled

All eight carry a closed disposition in `docs/audit/28-residual-sizing.md`. **One disagreement was
found and is recorded in the register rather than by editing that document**, which is outside this
plan's scope: item 8 names plans **28-03 and 28-06** as the recorders of the determinism findings.
28-03 built the machinery and recorded none; the correct list is **28-06 and 28-07** (four findings
plus two). The disposition itself — record-only, deferred to Phase 29 — is unchanged and correct.

## F-28-021's open half, answered rather than left open

28-06 measured that `_role-switch-protocol.md:17-18` claims every workflow references it by path
while three do not, and deferred the correction because those three were this plan's unread set.
Having read them: **the claim should be weakened, not the three files changed.** All three are seam
workflows and each says so in its own words — *"a seam workflow, not an SDLC stage: it has no owning
specialist and no queue of its own"* — and a role does not activate INTO a seam, it passes through
one while already active. There is no role switch to route.

**No new finding was minted.** The defect is a sentence in `_role-switch-protocol.md` and F-28-021
already holds that row; three duplicate rows would make one defect look like four and put the fix in
the wrong file.

## The two rewritten CI comments, quoted

Both gates were landed expected-red and are now green, so both comment blocks were rewritten to say
what the gate holds and what a red means. **Read rather than grepped**, as the acceptance criterion
requires — a grep for the word would also match unrelated prose in the same file.
`grep -ci "expected to fail red\|expected red" .github/workflows/ci.yml` now returns **0**.

**Above `node scripts/check-public-docs-vocabulary.js`:**

> WHAT IT HOLDS, AND WHAT A RED MEANS. It asserts that the ten scanned public documents carry ZERO
> retired grugops vocabulary, reading the literals from the one authority in
> `scripts/dead-vocabulary.ts`. A red here means a document reintroduced a retired path form or a
> retired prose form — most likely a v1.x description of the deleted handoff relay written back into
> text a user reads. Fix the DOCUMENT. Do not add an exemption and do not narrow the scan set:
> `PUBLIC_DOCS_SCAN_COUNT` is two-sided pinned precisely so removing a member to reach green is not
> available.
>
> It was landed RED on purpose (D-24) and turned GREEN by plan 28-05 — exit 1 with 18 hits across 8
> of 10 documents at the commit that introduced it, exit 0 after, with the gate itself byte-unchanged
> across the transition. That history is why a red here is credible: this guard has been watched
> catching the exact drift it exists for.

**Above `node scripts/check-audit-register.js`:**

> WHAT IT HOLDS, AND WHAT A RED MEANS. Three things, on every run. (1) Every file the derived listers
> return has a register row, by SET equality in both directions — a red here means a role or workflow
> was added, removed or renamed without its row, or a row names a file that no longer exists. (2) The
> findings each row DECLARES equals the Table B rows naming it, per file and in total — a red means a
> finding was added or deleted without its count. (3) The derived D-18 exclusion list at
> `docs/audit/28-safety-surface-exclusions.md` is byte-identical to a fresh regeneration — a red
> means a `safety_surface` flag or a `kind: safety` claim moved and the list was not rebuilt; run
> `npm run generate:safety-surface` and commit the result. It also refuses a blank observation, a
> bare-word observation, a disposition outside the closed set, a deferral with no target phase and a
> category-6 finding disposed as anything but deferred-to-29.
>
> It was landed RED on purpose (D-05, the same argument D-24 makes about the drift guard above) and
> turned GREEN by the read pass in plans 28-06 and 28-07 — exit 1 with `2 CHECK(S) FAILED` over 37
> blank observations at the commit that introduced it, exit 0 once all 37 rows were filled. BOTH D-03
> equalities were already green at that commit, so the red was precisely the unread files and nothing
> else. Nothing was loosened and no row was dropped to reach green; the register was filled.

## The D-01 amendment — three sites named, four found

28-03 predicted three stale sites and named them: `ROADMAP.md:95`, `ROADMAP.md:425`,
`REQUIREMENTS.md:72`. **All three were confirmed at those exact line numbers and amended.** A
**fourth** was found: `ROADMAP.md:467`, the D-01 note that *instructed* the amendment and, once made,
described outstanding work that was done. It now records the amendment instead of directing it.

Each of the three amended sites carries the derivation rule **in the same sentence as the number**,
so a reader who counts 18 files on disk meets the reason before the temptation. `grep` for
`18 roles` in both files now returns **zero**.

## Every gate in the sweep, with its exit code

| Command | Exit |
|---|---|
| `npm run build` | 0 |
| `npx tsc --noEmit` | 0 |
| `npx tsc -p tsconfig.tests.json --noEmit` | 0 |
| `npm run freshness` | 0 — **42** committed `.js` match a fresh rebuild (was 41) |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:context` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `node scripts/check-foundation-guards.js` | 0 — **100 ms** |
| `node scripts/check-kit-refs.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 |
| `node scripts/check-public-docs-vocabulary.js` | 0 |
| `node scripts/check-audit-register.js` | 0 |
| `node scripts/check-claim-anchors.js` | 0 |
| `node scripts/generate-safety-surface.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **45 files, 1540 passed, 2 skipped** (was 1525; +15 new) |

`npm test` was **not** run: it triggers the live claude-CLI e2e lane. The 2 skipped tests are
pre-existing and untouched.

**Every Phase 28 gate is wired at both ends, exactly once:**

| Gate | `ci.yml` | `package.json` |
|---|---|---|
| `check-public-docs-vocabulary.js` | 1 | 1 |
| `check-audit-register.js` | 1 | 1 |
| `check-claim-anchors.js` | 1 | 1 |
| `generate-safety-surface.js` | **0 — by design** | 1 |

The generator has no CI line on purpose: its freshness predicate runs **inside** the register gate,
which is already wired, so a second line would be a second invocation of one check.

## Prohibitions — Each Confirmed

| Prohibition | Evidence |
|---|---|
| No workflow prose edited except a D-19 trivial defect | `git diff 24dfc37..HEAD -- agent-factory/` is **0 lines**; the named fix list is empty and matches |
| No category-six determinism finding fixed | 6 cat-6 findings phase-wide, all `deferred` → 29; the parser refuses any other, so the parse is the proof |
| No observation is a bare word asserting an absence | 19/19 substantive; the gate's bare-observation arm names zero, and the 10 zero-finding rows state what was checked and what was found |
| No file dispatched to a subagent | every file read inline by the agent that wrote its verdict; zero `Agent`/`Task` calls |
| The exclusion list is not hand-authored | generated by `scripts/generate-safety-surface.js` from two sources, freshness-gated inside the register gate, proven to red on a real-tree flip |
| No `fixed` disposition accepted without re-verifying on the tree | 4 register rows + 8 registry rows + 2 deletions + 2 residual items, each re-measured; table above |
| The register's "does not prove" prose not softened | `## What this register does not prove` **byte-unchanged**; added prose only names new limits |
| No byte ceiling raised | `roleCeiling()` untouched; no `agent-factory/` file changed at all |
| No package installed | `git diff package.json` is **one line under `scripts`**; `dependencies` and `devDependencies` byte-identical to HEAD (T-28-45) |
| No second parser | `readRegister`/`readRegistry` **imported** from `audit-model.js`; `git diff` on `audit-model.ts` and `kit-model.ts` is empty |

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-39 (empty or short exclusion list) | mitigated | named empty-union **throw** with two cases asserting it and its reason; entry count **recomputed** at verification rather than read from the header; union drawn from two independently maintained sources so both must fail together |
| T-28-40 (generated list drifting from its sources) | mitigated | byte-exact freshness guard folded into the CI-wired register gate; **flip-a-flag reproduced on the real tree**, not asserted — HEAD 0, mutated 1, reverted 0; a one-byte trailing-space case proves the compare is unnormalized |
| T-28-41 (a `fixed` disposition never fixed) | mitigated | every `fixed` in the phase re-verified on the tree with a counter-check; 4 checked, 4 held, 0 corrected; the other plans' fixes re-measured rather than inherited |
| T-28-42 (an unearned `observation`) | mitigated as far as a mechanism reaches, residual **named** | inline reading so the read and the verdict share one context; pre-pass read in full first; every observation cites something falsifiable — a line number, a byte count, a config value, a counted set. The irreducible remainder stays in the register's own prose |
| T-28-43 (a stale expected-red CI comment) | mitigated | both comments rewritten and **quoted in full above**; `grep -ci` for the phrase returns 0; the matching stale **test assertion** was found and inverted too |
| T-28-44 (reading 19 files inline) | accepted | bounded set from one directory with an existing walk bound; 104 KB, budgeted |
| T-28-45 (npm/pip/cargo installs) | accepted, **verified** | no install occurred; `package.json` diff is one `scripts` line and both dependency blocks are byte-identical |

## Deviations from Plan

**No deviation rule 1, 2 or 4 was invoked.** Two structural corrections and one disclosed sequencing
choice:

1. **[Rule 3 — blocking] The D-01 amendment cannot be a Table B row.** Detailed above; the refusal
   was watched on a mirror and the record went where the parse authority's own message directs.
2. **[Premise correction] The freshness guard's stated rationale is false.** The decision was
   followed and the reason corrected in the code comment. Detailed above.
3. **[Sequencing, disclosed] The CI comment rewrite landed in task 2's commit, not task 3's.** Both
   comments live in one file and the register-gate comment had to change as a direct consequence of
   task 2 folding the freshness check into that gate. Splitting them would have left `ci.yml`
   half-edited across two commits for no gain.

**One in-latitude repair, not a deviation:** `check-audit-register.test.ts`'s mirrors were extended
with a registry and a generated exclusion list. Without it the folded guard fails closed on every
mirror — correct behaviour, but it would red 4 cases for a reason none of them is about. The stale
expected-red case in the same file was **inverted rather than deleted**, for the reason recorded in
the decisions block.

## Checkpoints

None. All three tasks were `type="auto"`. No checkpoint, decision, auth gate, package install or
architectural question arose.

## Known Stubs

**None.** No placeholder, hardcoded empty value, or unwired component was introduced. The 17 findings
are measurements, each carrying a category, a disposition, a target phase and a located reason.

The generated exclusion list is not a stub: it is complete against its two sources, its completeness
is asserted by a run-time recomputation, and its known limitation — that a per-file flag cannot
express sentence granularity — is written into the artifact itself rather than left to be discovered.

## Threat Flags

None. This plan added no network endpoint, no auth path and no schema change. It added one read-only
generator and one read-only guard, both `node:fs`-only with zero dependencies, whose `OUT` is a fixed
literal never derived from argv, env or file content.

## For the Next Plans

- **28-08** is the last plan. Every gate in the sweep is green before it starts, and the full suite is
  45 files / 1540 passed / 2 skipped. It owns D-19 items 2 and 3 (the byte-round-trip patch and the
  `floor-invariance.test.ts` timeout).
- **Phase 29 inherits 28 deferred findings** across roles and workflows, plus a **41-entry**
  freshness-gated exclusion list and **6** located category-6 determinism sites. Two pairs should be
  corrected together so one vocabulary lands at once: F-28-008 with F-28-022 (the two-mode spawn
  vocabulary), and F-28-015 with F-28-030 (the `Done` exit ownership, now claimed by three files).
- **The four not-installed findings (F-28-028, F-28-035, F-28-037, F-28-038) are the phase's largest
  single result and are NOT a Phase 29 prose problem.** LANG-02 can reword the sentences; it cannot
  make the modules reach a host. Whoever owns packaging should see them together.
- **Three findings still have no owner**, carried forward unchanged from 28-04 and 28-06: `CLAUDE.md`
  names a root `VERSION` file that does not exist, `CLAUDE.md` names the command shape as `/grug`
  where the kit ships `/grugops`, and the `AGENTS.md` kit-write rule is declared a safety rule with no
  `SAFETY_FLOORS` member holding it. `CLAUDE.md` has no Table A row and no plan in this phase claims
  it.
- **`agent-factory/seed/plans/board.md:64` reads *"handoffs complete, ticket sized"*** — a bare-word
  survival of the retired relay in a file that ships to every user. It is not a guard hit
  (`RETIRED_PROSE_FORMS` holds only `handoff packet` and `the handoff is the only memory`, and D-10
  forbids widening the matcher), and the seed directory has no Table A row. Recorded here because
  nothing else records it.
- **CI is green on all three Phase 28 gates** for the first time in the phase.

## Self-Check: PASSED

All four created artifacts exist on disk and all eight modified files carry their changes:

```
FOUND: scripts/generate-safety-surface.ts  .js  .test.ts
FOUND: docs/audit/28-safety-surface-exclusions.md   (41 entries)
FOUND: docs/audit/28-disposition-register.md        (37 rows, 32 findings)
FOUND: scripts/check-audit-register.ts  .js  .test.ts
FOUND: package.json  .github/workflows/ci.yml
FOUND: .planning/ROADMAP.md  .planning/REQUIREMENTS.md
```

All three commits present in `git log`: `7dfb2a6`, `6595fec`, `a27dc95`.
