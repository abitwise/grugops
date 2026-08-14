---
phase: 29-controlled-language-voice-guard-rebuild
plan: 13
subsystem: tooling
tags: [byte-ceilings, re-baseline, held, corpus-growth, growth-mechanism, article-density, fail-closed-default, phase-closeout, lang-08-partial]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 01
    provides: "guard_role_size's roleCeiling() switch table with its D-25 not-derived argument and its fail-closed default, plus voice-model.ts's readCavemanFence() authority"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 07
    provides: "the command-derived 17-role byte table this plan re-measured rather than trusted, and the security-nfr.md WARN residual it handed over"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 10
    provides: "the falsification of 29-RESEARCH.md's 104,094 workflow baseline, reproduced independently here"
  - phase: 29-controlled-language-voice-guard-rebuild
    plan: 12
    provides: "the closed governed corpus at 0/139 and 0/2,166, and the measured 152,806 -> 154,651 B corpus growth this plan decomposes"
provides:
  - "THE CEILING TABLE WAS NOT EDITED — checkpoint answered `hold-rebaseline`; scripts/check-foundation-guards.ts is byte-unchanged against the phase base 4d2b8f0, so LANG-08's never-raised half holds ABSOLUTELY, by absence"
  - "docs/audit/29-ceiling-rebaseline.md — the seventeen-row command-derived transcript, the recorded human reasoning, and the ratchet-down values PRESERVED as a deferred finding"
  - "the finding that the plan's own derivation would RAISE 12 of 17 ceilings, and the exact mechanical partition explaining it: a row raises iff its current size exceeds the 2026-06-10 baseline its ceiling encodes"
  - "docs/audit/29-corpus-growth.md — the four-part growth record D-28 requires in place of inventing ceilings, with the mechanism TESTED by article density rather than asserted"
  - "the measured finding that the whole kit SHRANK 578 B: governed +1,845, roles -2,423"
  - "the measured finding that the two voices moved APART — governed prose 10.72% -> 11.00% articles, fenced caveman blocks 5.43% -> 0.00%"
  - "a three-part case pinning roleCeiling()'s fail-closed default by EXIT STATUS, with a scratch-build falsifier that softens the default branch"
affects: [30]

actuals:
  tokens: 9681
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "When a plan's stated derivation produces a prohibited result, report the result and surface the decision — never adjust the derivation until the arithmetic comes out the way the plan expected"
    - "Test a growth MECHANISM rather than asserting it: if the claim is 'not article restoration', measure article density on both sides and let the number decide"
    - "A fail-closed default is pinned by three parts, not one: a green control, a red plant, and a scratch build whose softened default turns the same plant green — a bare nonzero exit is satisfied by any co-firing guard"
    - "When a gate refuses the artifact path a plan named, read the gate's own refusal wording before working around it — it usually states which shape is correct"

key-files:
  created:
    - docs/audit/29-ceiling-rebaseline.md
    - docs/audit/29-corpus-growth.md
  modified:
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "`hold-rebaseline` — the ceiling table was NOT edited, by human decision at the plan's blocking checkpoint. The reasoning is recorded verbatim rather than paraphrased from the option label: the twelve raises are Phases 13-27 growth the ceilings absorbed as headroom, not this phase's doing, and re-deriving the margin from today's size would convert consumed headroom into permanent new headroom. Holding costs nothing today because every measured size is already under its current ceiling"
  - "LANG-08 is recorded as PARTIALLY satisfied and is NOT marked complete. Its never-raised-mid-phase half holds absolutely and its delta-recorded half is met; its re-baseline half DID NOT HAPPEN. Marking the requirement complete would be the fabricated-completion shape this phase exists to delete"
  - "The plan's stated derivation — recompute FAIL at +12% and WARN at +6% from today's measured size — would RAISE both tiers on 12 of 17 roles. Reported as measured. No percentage was adjusted and no row was rounded toward a passing answer"
  - "The raise/no-raise partition is mechanical rather than a judgement: a row raises IFF its current size exceeds the baseline its ceiling encodes. Asserted, not eyeballed — the predicate (current > encodedBaseline) and the predicate (proposed > current) agree on all 17 rows, on both tiers"
  - "The ratchet-down alternative — min(recomputed, current) per tier, 5 rows lower and 12 held, satisfying at-most on 17 of 17 — is PRESERVED with its per-tier values and its -1,069 B / -14.6% headroom figure. Deferred, not discarded"
  - "The transcript does NOT live at the plan's named docs/audit/29-style-dispositions/29-13.md. check:diff-disposition REFUSES a register file carrying a `## Dispositions` heading with zero rows, and this plan disposes no prose clause. Inventing a row, and adding the file to DISPOSITION_NON_ROWS, were both refused"
  - "frontend-ui.md's ceiling baseline is 3544 and is marked RECOVERED rather than recorded — its case comment states none, and 3544 is the unique integer reproducing its pair under every rounding combination that reproduces it at all"
  - "Three legacy cases round their FAIL tier differently from the other fourteen (orchestrator, security-nfr, frontend-ui use floor/round where every Phase-21/22 case uses ceil). Immaterial to every verdict here (<=1 B against raises of 22-421 B) and named so a future re-derivation's +-1 drift is accountable"
  - "The growth mechanism was TESTED rather than asserted. Article density moved 0.28pp across the governed corpus, so the corpus was already normal English; the decisive figure is +350 sentences for +388 words, at 5.27 B per new sentence"
  - "No byte ceiling was added for any workflow, checklist, seed template or contract, and no aggregate corpus budget was adopted. The aggregate's failure mode is illustrated by this phase's own -578 B, which would pass while concealing +323 on one file and -330 on another"

patterns-established:
  - "Report the arithmetic the plan asked for even when it contradicts what the plan expected, and put the decision to a human rather than picking the reading that lets execution continue"
  - "Preserve a rejected-for-now option with its full derived values, so the next phase meets a decision already reasoned through instead of rediscovering it"

requirements-completed: []

coverage:
  - id: D1
    description: "No byte ceiling was raised at any point in Phase 29, and the table stayed hand-maintained rather than derived (LANG-08, D-25, D-26)"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "`git diff 4d2b8f0 HEAD -- scripts/check-foundation-guards.ts` is EMPTY. Not one numeric literal in roleCeiling() moved in either direction, in any of the thirteen plans. The never-raised-mid-phase prohibition holds ABSOLUTELY, by absence rather than by comparison"
        status: pass
      - kind: other
        ref: "the table is still a hand-maintained switch with a fail-closed `default: return \"\"`. It was not derived, and D-25's argument for that is intact and unedited"
        status: pass
    human_judgment: false
  - id: D2
    description: "LANG-08's re-baseline half DID NOT HAPPEN, and is recorded as such rather than as a pass"
    requirement: "LANG-08"
    verification:
      - kind: other
        ref: "the checkpoint was answered `hold-rebaseline`. LANG-08 asks for ceilings 're-baselined once at end of phase, every file <= previous, delta recorded, never raised mid-phase'. Never-raised: SATISFIED absolutely. Delta recorded: SATISFIED, in docs/audit/29-ceiling-rebaseline.md and docs/audit/29-corpus-growth.md. Re-baselined once: **DID NOT HAPPEN**"
        status: gap
      - kind: other
        ref: "the requirement is deliberately NOT marked complete in REQUIREMENTS.md, and this summary states why. A vacuous pass reported as a pass is the exact shape 29-11 and 29-12 refused on the empty imperative denominator"
        status: pass
    human_judgment: true
  - id: D3
    description: "The seventeen-row transcript is command-derived, in listRoles() order, with the at-most comparison stated and equality recorded as passing (LANG-08, D-27)"
    verification:
      - kind: integration
        ref: "17 rows in `listRoles(\".\")` sorted order read through `import()`; current sizes from `Buffer.byteLength(readFileSync)`; pre-phase sizes from `Buffer.byteLength(git show 4d2b8f0:<rel>)`; the WARN/FAIL pairs PARSED out of the committed `scripts/check-foundation-guards.js` by a regex over roleCeiling()'s case arms — the file that actually runs, read rather than transcribed"
        status: pass
      - kind: other
        ref: "the comparison operator is stated explicitly in the transcript as at-most rather than strictly-less, with 'a role whose value lands exactly on its previous ceiling PASSES; equality is not a breach' written beside the table"
        status: pass
      - kind: other
        ref: "the proof is a one-shot transcript compared against the git-previous table, NOT a permanent fixture pinning old values — D-27 honoured, and no second place to edit was created"
        status: pass
    human_judgment: false
  - id: D4
    description: "The measurement was cross-checked against the running record and any discrepancy named rather than smoothed (T-29-76)"
    verification:
      - kind: integration
        ref: "all seventeen values reproduce 29-07-SUMMARY.md's published table EXACTLY, and so does its 63,793 B total. **There is no discrepancy of any size on any row**, and the transcript says so explicitly rather than staying silent"
        status: pass
      - kind: integration
        ref: "the reason is visible in git: `git log -- agent-factory/roles/` shows the last commit touching the directory is 1b611d1, plan 29-07's third. Plans 29-08..29-12 moved workflows, checklists, seed templates and contracts only, so 29-07's table and today's measurement read the same tree"
        status: pass
      - kind: other
        ref: "29-RESEARCH.md §A-1's eight-roles-above-WARN set reproduces exactly from `git show 4d2b8f0:`, and seven of the eight are now under their WARN tier"
        status: pass
    human_judgment: false
  - id: D5
    description: "roleCeiling()'s fail-closed default is pinned by a case against the committed .js, by exit status (T-29-77, D-25)"
    verification:
      - kind: unit
        ref: "a three-part case in scripts/check-foundation-guards.test.ts: (a) `consistentMirror()` unplanted exits 0; (b) the same mirror plus an 18th role the table has no case for exits NONZERO, and the guard_role_size line naming it is a **FAIL** carrying `no documented ceiling` and no size verdict; (c) the same mirror and plant against a scratch build whose `default: return \"\"` is softened to `return \"999999 999999\"` yields a PASS line reading `within ceiling` for the planted file"
        status: pass
      - kind: other
        ref: "part (c) is the half that carries the weight. A bare `status !== 0` on an 18-role mirror is satisfied by guard_kit_counts alone, which legitimately fails in the same run; only the mutation shows the default branch is what refuses an undocumented role. scratchGuardFiles() THROWS if the replacement matches nothing, so a silently-non-applying mutation cannot leave the case reporting a control it never exercised"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts — 170 passed, up exactly one from the 169 baseline"
        status: pass
    human_judgment: false
  - id: D6
    description: "The governed corpus growth is recorded per part and per file, with no ceiling invented for it (D-28, T-29-79)"
    requirement: "LANG-08"
    verification:
      - kind: integration
        ref: "docs/audit/29-corpus-growth.md. Four parts: workflows 104,048 -> 105,615 (+1,567, +1.51%), checklists 19,368 -> 19,495 (+127, +0.66%), seed 14,205 -> 14,285 (+80, +0.56%), contracts 15,185 -> 15,256 (+71, +0.47%); corpus 152,806 -> 154,651 (+1,845, +1.21%). Walked over GOVERNED_CORPUS_PARTS through import(), 47 of 47, against `git show 4d2b8f0:<path>`"
        status: pass
      - kind: integration
        ref: "`grep -ci 'ceiling' docs/audit/29-corpus-growth.md` finds 12 occurrences and every one is a REFERENCE — to the role table, to the two rejections, or to docs/audit/29-ceiling-rebaseline.md. **No ceiling is declared for any governed-corpus file**"
        status: pass
      - kind: other
        ref: "both rejected alternatives are recorded with their reasons. The aggregate-budget rejection is illustrated by this phase's own arithmetic: a 64-file budget would report -578 B and pass comfortably while concealing +323 on 05-pr-quality-gate.md and -330 on agents-md-scribe.md"
        status: pass
    human_judgment: false
  - id: D7
    description: "The growth mechanism is named AND tested, not asserted (D-28, D-34)"
    verification:
      - kind: integration
        ref: "article density measured over the governed corpus at both commits: **10.72% -> 11.00%, a rise of 0.28 percentage points**. The corpus was already normal English before this phase. Per part: workflows 11.25 -> 11.64, checklists 8.14 -> 8.19, seed 7.61 -> 7.52 (a FALL), contracts 12.69 -> 12.77"
        status: pass
      - kind: other
        ref: "29-RESEARCH.md §C-5's figures reproduce: it measured 11.4% over workflows and 8.0% over checklists against 11.25% and 8.14% here, the difference being word-tokenizer only"
        status: pass
      - kind: other
        ref: "the decisive figure for splitting: the corpus gained **350 sentences** (the gate's own denominator, 1,816 -> 2,166, monotonic, never falling) for only **388 words** — about one word per sentence, which is a full stop, a capital and a short subject noun. **5.27 bytes per new sentence.** Even charging all 108 added articles at 4 B each accounts for at most 432 B, **23%** of the 1,845"
        status: pass
      - kind: integration
        ref: "the excluded caveman blocks measured through the same readCavemanFence() authority the voice guards use, 17 of 17 fences read: **5.43% articles / 3.13% copulas pre-phase, 0.00% / 0.00% now**, and 608 -> 426 words. The two voices moved APART, which a single corpus-wide figure would have averaged into a number describing neither"
        status: pass
    human_judgment: false
  - id: D8
    description: "Every gate in the phase is green at the close, and the timing and state-file numbers are re-measured"
    verification:
      - kind: integration
        ref: "thirteen gates, all exit 0: foundation-guards 0 · imperative-lexicon 0 · banned-claims 0 · diff-disposition 0 · public-docs 0 · claim-anchors 0 · audit-register 0 · nul-bytes 0 · kit-refs 0 · validate-agent-factory 0 · build 0 · typecheck 0 · freshness 0 at **48** pairs"
        status: pass
      - kind: integration
        ref: "all six freshness gates exit 0: freshness:catalog · freshness:adapters · freshness:skill-twins · freshness:context · freshness:queue · freshness:traceability"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — **51 files, 1,725 passed, 2 skipped**, up exactly one from the 29-05..29-12 baseline of 1,724, which is this plan's single new case"
        status: pass
      - kind: other
        ref: "foundation-guards wall clock 0.12 / 0.10 / 0.11 s against the 0.127 s pre-phase baseline — BELOW it. imperative-lexicon 0.05 / 0.04 / 0.04 s; diff-disposition 0.76 / 0.80 / 0.79 s. `.planning/STATE.md` longest line **7,966** (§F-2 baseline 7,994, below it) and longest backslash run **1** over 11 total (baseline 1, unmoved)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Zero packages were installed across the phase (T-29-SC)"
    verification:
      - kind: integration
        ref: "`dependencies`, `devDependencies`, `peerDependencies` and `optionalDependencies` are all **byte-identical** between `git show 4d2b8f0:package.json` and HEAD, compared through JSON.stringify. devDependencies is still exactly `{@types/node ~22, typescript ~6.0.3, vitest ~4.1.8}`"
        status: pass
      - kind: other
        ref: "the only package.json change in the whole phase is one added `scripts` key — `check:diff-disposition`, written by plan 29-04. 23 -> 24 script keys, zero dependency movement"
        status: pass
    human_judgment: false

duration: 62min
completed: 2026-08-14
status: complete
---

# Phase 29 Plan 13: The Byte-Ceiling Re-baseline Summary

**The ceiling table was measured and NOT edited. The plan's own derivation — recompute FAIL at +12% and WARN at +6% from today's size — would have RAISED both tiers on twelve of seventeen roles, because every ceiling encodes a 2026-06-10-era baseline that twelve roles have since outgrown. That is Phases 13–27 growth the ceilings absorbed as headroom, not this phase's doing, and re-deriving the margin would have made consumed headroom permanent. The finding was reported as measured and put to a human, who chose `hold-rebaseline`. So `scripts/check-foundation-guards.ts` is byte-unchanged against the phase base — LANG-08's never-raised half holds absolutely, by absence, while its re-baseline half DID NOT HAPPEN and is recorded as a gap rather than as a pass. What the phase cost is recorded instead: the governed corpus grew 152,806 → 154,651 B (+1.21%) while the role corpus shrank 66,216 → 63,793 B (−3.66%), so the whole kit is 578 bytes SMALLER than before the writing profile. The mechanism was tested rather than asserted — article density moved 0.28 points, and the corpus gained 350 sentences for 388 words.**

## Performance

- **Duration:** 62 min
- **Tasks:** 3 (one a blocking human checkpoint)
- **Commits:** 3
- **Files changed:** 3 (2 created, 1 modified)

## The decision

| field | value |
|---|---|
| checkpoint | Task 2, `checkpoint:decision`, `gate="blocking"` |
| options offered | `approve-rebaseline`, `approve-ratchet-down` *(surfaced by the transcript, not in the plan)*, `approve-partial`, `hold-rebaseline` |
| **selected** | **`hold-rebaseline`** |

**The reasoning, recorded as given rather than paraphrased from the option label:**

> The twelve raises are Phases 13–27 growth that the ceilings absorbed as headroom, not this phase's
> doing, and re-deriving the margin from today's size would convert consumed headroom into permanent
> new headroom. Holding costs nothing today because every measured size is already under its current
> ceiling. The accepted price is that the ceilings keep encoding the 2026-06-10-era baseline, so a
> later phase measuring growth against them is measuring against a stale reference.

The `approve-ratchet-down` analysis was read and understood and **was not rejected as wrong.** The
choice was not to move the table at all this phase, so it is preserved as a deferred finding with its
full per-tier values.

## LANG-08, reported honestly

LANG-08 reads: *"Byte ceilings re-baselined **once** at end of phase, every file ≤ previous, delta
recorded, never raised mid-phase."* Three clauses, three different answers:

| clause | status | evidence |
|---|---|---|
| never raised mid-phase | **SATISFIED, absolutely** | `git diff 4d2b8f0 HEAD -- scripts/check-foundation-guards.ts` is **empty**. Not one literal moved in either direction across thirteen plans |
| delta recorded | **SATISFIED** | `docs/audit/29-ceiling-rebaseline.md` (17 rows) and `docs/audit/29-corpus-growth.md` (4 parts, 64 files) |
| re-baselined once, every file ≤ previous | **DID NOT HAPPEN** | held by decision |

**The requirement is deliberately NOT marked complete in `REQUIREMENTS.md`.** Marking it complete
because two of three clauses hold would be the fabricated-completion shape this phase spent twelve
plans refusing — the same shape 29-11 and 29-12 refused when they declined to report an empty
imperative denominator as a pass.

## The seventeen-row transcript

Full table, with the encoded baselines and the ratchet-down values: **`docs/audit/29-ceiling-rebaseline.md`**.

| role | pre-phase | current | Δ | cur WARN | cur FAIL | prop WARN | prop FAIL | at-most? |
|---|---:|---:|---:|---:|---:|---:|---:|:--|
| `agents-md-scribe.md` | 4094 | 3764 | −330 | 4301 | 4544 | 3990 | 4216 | **yes** |
| `architect-design.md` | 3790 | 3574 | −216 | 4016 | 4243 | 3789 | 4003 | **yes** |
| `ba-pm.md` | 3672 | 3605 | −67 | 3901 | 4180 | 4038 | 4326 | **RAISE** |
| `brownfield-mapper.md` | 2738 | 2580 | −158 | 2693 | 2845 | 2735 | 2890 | **RAISE** |
| `compliance-officer.md` | 4433 | 4292 | −141 | 4555 | 4813 | 4550 | 4808 | **yes** |
| `factory-coach.md` | 3464 | 3448 | −16 | 3633 | 3839 | 3655 | 3862 | **RAISE** |
| `frontend-ui.md` | 3872 | 3724 | −148 | 3757 | 3969 | 3948 | 4171 | **RAISE** |
| `greenfield-mapper.md` | 2916 | 2873 | −43 | 2882 | 3045 | 3046 | 3218 | **RAISE** |
| `incident-responder.md` | 3540 | 3481 | −59 | 3598 | 3802 | 3690 | 3899 | **RAISE** |
| `installer.md` | 3546 | 3325 | −221 | 3727 | 3938 | 3525 | 3725 | **yes** |
| `orchestrator.md` | 7090 | 6802 | −288 | 7165 | 7570 | 7211 | 7619 | **RAISE** |
| `qe-e2e.md` | 3695 | 3608 | −87 | 3617 | 3822 | 3825 | 4041 | **RAISE** |
| `release-manager.md` | 4230 | 4001 | −229 | 4510 | 4765 | 4242 | 4482 | **yes** |
| `security-nfr.md` | 5027 | 4931 | −96 | 4830 | 5102 | 5227 | 5523 | **RAISE** |
| `software-engineer.md` | 3722 | 3507 | −215 | 3697 | 3906 | 3718 | 3928 | **RAISE** |
| `system-analyst.md` | 3020 | 2962 | −58 | 3000 | 3170 | 3140 | 3318 | **RAISE** |
| `uat-planner.md` | 3367 | 3316 | −51 | 3350 | 3540 | 3515 | 3714 | **RAISE** |
| **total** | **66,216** | **63,793** | **−2,423** | | | | | **5 of 17** |

**The comparison is at-most, not strictly-less** — a role landing exactly on its previous ceiling
passes, and equality is not a breach. It is stated that way in the transcript beside the table.

### The git-previous versus committed comparison, for all 34 numbers

**All 34 are unchanged.** `git diff 4d2b8f0 HEAD -- scripts/check-foundation-guards.ts` is empty, so
every one of the seventeen FAIL values and seventeen WARN values is byte-identical to its git-previous
value. `new ≤ old` therefore holds on 34 of 34 by identity. That is the outcome under `hold`, and it
is a different fact from a re-baseline that happened to land on the same numbers.

### Why twelve would have raised — the partition is mechanical

Every ceiling is a 2026-06-10-era measured baseline plus a margin, with the baseline stated in the
case's own trailing comment. Recomputing the same margin from **today's** size raises the ceiling for
any role larger today than that baseline.

| | rows | encoded baseline vs current |
|---|---|---|
| lowers | `agents-md-scribe` (−293), `architect-design` (−214), `compliance-officer` (−5), `installer` (−191), `release-manager` (−253) | current **below** baseline |
| RAISES | `ba-pm` (+122), `brownfield-mapper` (+40), `factory-coach` (+21), `frontend-ui` (+180), `greenfield-mapper` (+155), `incident-responder` (+87), `orchestrator` (+43), `qe-e2e` (+196), `security-nfr` (+375), `software-engineer` (+20), `system-analyst` (+132), `uat-planner` (+156) | current **above** baseline |

**Asserted rather than eyeballed:** the predicate `(current > encodedBaseline)` and the predicate
`(proposed > current)` agree on **all seventeen rows, on both tiers.** Raises run +22 B
(`software-engineer` FAIL) to +421 B (`security-nfr` FAIL 5102 → 5523).

**This phase did not cause it.** Every one of the seventeen roles shrank this phase.

### Two smaller findings, recorded because a future re-derivation needs both

- **`frontend-ui.md`'s baseline is 3544, and it is RECOVERED, not recorded.** Its case comment states
  none (`// Phase 13 — 17th role (UI-01)`). 3544 is the unique integer in [3000, 4000) reproducing its
  pair, and it is unique under all four rounding combinations that reproduce it at all.
- **The rounding convention is not uniform.** Fourteen cases reproduce exactly under `ceil` on both
  tiers. Three do not, all on FAIL, all the oldest: `orchestrator` (7570.08 → 7570), `security-nfr`
  (5102.72 → 5102), `frontend-ui` (3969.28 → 3969) use floor/round. **Immaterial to every verdict
  here** — ≤1 B against raises of 22–421 B — and named so that a future re-derivation's ±1 drift is
  accountable rather than mysterious.

### The preserved ratchet-down finding

`min(recomputed, current)` per tier satisfies at-most on **17 of 17**: five rows lower
(`agents-md-scribe` 3990/4216, `architect-design` 3789/4003, `compliance-officer` 4550/4808,
`installer` 3525/3725, `release-manager` 4242/4482), twelve hold at their current values. Corpus FAIL
headroom **7,300 → 6,231 B, a 1,069 B / 14.6% tightening**, with no role landing in WARN or FAIL.
**Deferred, not discarded** — recorded in full in `docs/audit/29-ceiling-rebaseline.md`.

## The measurement, cross-checked

**All seventeen values reproduce `29-07-SUMMARY.md`'s published table exactly, and so does its 63,793 B
total. There is no discrepancy of any size on any row.** Said explicitly, because "there was nothing
to reconcile" is a different fact from silence, and a transcript that quietly reconciles is worth
nothing as a control.

The reason is in git: the last commit touching `agent-factory/roles/` is **`1b611d1`**, plan 29-07's
third. Plans 29-08 … 29-12 moved workflows, checklists, seed templates and contracts only.

## The corpus growth record

`docs/audit/29-corpus-growth.md`. Walked over the gate's own `GOVERNED_CORPUS_PARTS` through
`import()` — **47 of 47** — against `Buffer.byteLength(git show 4d2b8f0:<path>)`.

| part | files | pre | post | Δ | % |
|---|---:|---:|---:|---:|---:|
| workflows | 19 | 104,048 | 105,615 | **+1,567** | **+1.51%** |
| checklists | 13 | 19,368 | 19,495 | **+127** | **+0.66%** |
| seed templates | 13 | 14,205 | 14,285 | **+80** | **+0.56%** |
| contracts | 2 | 15,185 | 15,256 | **+71** | **+0.47%** |
| **governed corpus** | **47** | **152,806** | **154,651** | **+1,845** | **+1.21%** |
| role corpus | 17 | 66,216 | 63,793 | **−2,423** | **−3.66%** |
| **both** | **64** | **219,022** | **218,444** | **−578** | **−0.26%** |

**Putting the whole kit on the writing profile made it 578 bytes smaller.** The D-19 role-skeleton
de-duplication outweighs everything the profile cost the governed corpus.

**Thirteen of the 47 governed files are byte-unchanged and three shrank** (`02-idea-to-epics.md` −25,
`17-task-claim.md` −42, `60-progress.md` −7). Largest absolute increase `05-pr-quality-gate.md` +323 B
(+2.34% on the kit's largest file); largest proportional `definition-of-done.md` +10.74%, which is
**+54 bytes on a 503-byte file**.

### The research baseline that does not reproduce

§A-2 states **104,094 / 19,368 / 14,205 / 15,185**. Three reproduce exactly. **The workflow figure
does not: 104,048 at `4d2b8f0`, 46 bytes lower.** Reproduced through the research's own command shape
(`git archive 4d2b8f0 agent-factory/workflows | tar -xO | wc -c` → `104048`) as well as through the
gate's membership, so it is not a file-set artifact. This confirms 29-10's independent finding. The
measured 104,048 is used throughout; adopting 104,094 would report a delta no command produces.

## The mechanism, TESTED rather than asserted

The hypothesis worth ruling out is **article restoration** — that governed prose was telegraphic and
the profile made it English. If so, article density must rise.

| surface | pre | post | Δ |
|---|---:|---:|---:|
| workflows | 11.25% | 11.64% | +0.39 pp |
| checklists | 8.14% | 8.19% | +0.05 pp |
| seed templates | 7.61% | 7.52% | **−0.09 pp** |
| contracts | 12.69% | 12.77% | +0.08 pp |
| **governed corpus** | **10.72%** | **11.00%** | **+0.28 pp** |

**The corpus was already normal English at 10.72% before this phase began.** §C-5's own figures
reproduce (it measured 11.4% workflows / 8.0% checklists against 11.25% / 8.14% here; the difference
is word-tokenizer only).

**The mechanism is sentence splitting**, and the decisive number is the ratio: the corpus gained
**350 sentences** — the gate's own denominator moved 1,816 → 2,166, monotonically, never falling —
for only **388 words**. About one word per sentence is exactly what a split costs: a full stop, a
capital, often a short subject noun. **5.27 bytes per new sentence.** The extreme reading bounds it
too: all 108 added articles charged at 4 B each are **432 B, 23%** of the 1,845.

### The two voices moved apart

Measured through the same `readCavemanFence()` authority the voice guards use, **17 of 17 fences read**:

| | words | articles | article % | copulas | copula % |
|---|---:|---:|---:|---:|---:|
| caveman blocks, pre-phase | 608 | 33 | **5.43%** | 19 | 3.13% |
| caveman blocks, post-phase | 426 | **0** | **0.00%** | **0** | **0.00%** |

**The caveman blocks now contain no article and no copula at all, and shrank 30% by word count.**
Pre-phase `qe-e2e.md` read *"You are QE/E2E. You break the feature."* — clear-voice English wearing
the label. It now reads *"You QE/E2E. You hit feature with club until feature admit truth."*

So the phase did the **opposite** thing to each voice, and both are the intended direction. A single
corpus-wide article figure would have averaged them into a number describing neither. This also closes
the standing note that the caveman voice had drifted out while its guard stayed green: it has not
drifted back, and the density is now zero rather than merely low.

## The fail-closed default, pinned by exit status

The property has to survive whichever phase eventually moves the table, so the case was written and
kept even though this plan held.

| half | fixture | assertion | result |
|---|---|---|---|
| control | `consistentMirror()`, unplanted | exit 0 | **pass** |
| red | + an 18th role the table has no case for | nonzero; the guard_role_size line is a **FAIL** naming `no documented ceiling`, with **no size verdict** | **pass** |
| falsifier | same mirror, same plant, scratch build with `default: return ""` → `return "999999 999999"` | the planted file gets a **`within ceiling` PASS** | **pass** |

**The falsifier is the half that carries the weight.** A bare `status !== 0` on an 18-role mirror is
satisfied by `guard_kit_counts` alone, which legitimately fails in the same run; only the mutation
shows the default branch is what refuses an undocumented role. `scratchGuardFiles()` throws if the
replacement matches nothing, so a silently-non-applying mutation cannot leave the case reporting a
control it never exercised.

## What was NOT done, and why

**No byte ceiling for any workflow, checklist, seed template or contract.** D-28.
`grep -ci 'ceiling' docs/audit/29-corpus-growth.md` finds 12 occurrences and **every one is a
reference** — to the role table, to the two rejections, or to the sibling document.

**No aggregate corpus budget.** Rejected because an aggregate lets one file balloon while others
shrink, and this phase supplies its own illustration: a 64-file budget would report **−578 B** and pass
comfortably while concealing `05-pr-quality-gate.md` +323 and `agents-md-scribe.md` −330.

## Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 0** — 17/17 roles pass; **one WARN**, `security-nfr.md 4931B >= 4830B`, the unchanged pre-existing residual |
| `npm run check:imperative-lexicon` | exit 0 |
| `npm run check:banned-claims` | exit 0 |
| `npm run check:diff-disposition` | exit 0 |
| `npm run check:public-docs` | exit 0 |
| `npm run check:claim-anchors` | exit 0 |
| `npm run check:audit-register` | exit 0 |
| `npm run check:nul-bytes` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `npm run build` · `npm run typecheck` | exit 0 · exit 0 |
| `npm run freshness` | exit 0 — **48** committed `.js` pairs, unchanged |
| six freshness gates (`catalog`, `adapters`, `skill-twins`, `context`, `queue`, `traceability`) | all exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **51 files, 1,725 passed, 2 skipped** (baseline 1,724 + this plan's one case) |
| foundation-guards wall clock, 3 runs | **0.12 / 0.10 / 0.11 s** against the 0.127 s pre-phase baseline — **below it** |
| imperative-lexicon wall clock, 3 runs | 0.05 / 0.04 / 0.04 s |
| diff-disposition wall clock, 3 runs | 0.76 / 0.80 / 0.79 s (29-12: 0.74 / 0.70 / 0.71) |
| `.planning/STATE.md` longest line | **7,966** (§F-2 baseline 7,994 — below it; unmoved since 29-08) |
| `.planning/STATE.md` longest backslash run | **1** over 11 total (baseline 1 — unmoved) |
| `git diff 4d2b8f0 HEAD -- scripts/check-foundation-guards.ts` | **empty** |
| dependency sets vs `4d2b8f0` | **byte-identical**, all four; only one `scripts` key added phase-wide |

## Deviations from Plan

### 1. [Rule 3 - Blocking] The plan's named artifact path cannot hold this document

- The plan names `docs/audit/29-style-dispositions/29-13.md` in `files_modified`, `must_haves.artifacts`
  and Task 1's `<files>`. It was written there first, and `check:diff-disposition` **refused it**:
  `FAIL … has a '## Dispositions' heading and ZERO rows under it`.
- **The refusal is correct, and the gate's own wording says why.** Its sibling refusal — for a register
  file with no `## Dispositions` heading at all — reads *"A disposition file whose rows are invisible
  is worse than an absent one: it reads as work done."* The directory admits exactly one shape.
- **This plan disposes nothing, measurably.** It changes no file in the 41-entry LANG-03 watched corpus
  and no governed prose of any kind; `changedClauses()` derives nothing for it.
- Two ways to keep the literal path existed and **both were refused**: inventing a row for a clause
  that did not change, and adding `29-13.md` to `DISPOSITION_NON_ROWS` — a hand-maintained exemption
  literal, the exact drift class this milestone deletes.
- The document moved to **`docs/audit/29-ceiling-rebaseline.md`**, beside this plan's other artifact.
  **Flagged at the checkpoint and explicitly approved by the human.**
- **Commit:** `555d3b1`

### 2. [Measured deviation] The plan expected the at-most assertion to hold; it fails on 12 of 17

- The checkpoint's context states *"What it should show: … every proposed FAIL at most its current FAIL
  and every proposed WARN at most its current WARN, and eight roles that sat above their WARN tier
  before this phase now sitting under it."*
- **The second half reproduced exactly** — 8 above WARN pre-phase, 1 now. **The first half did not.**
- Reported as measured. **No percentage was adjusted and no row was rounded toward a passing answer.**
  The plan's own checkpoint names this as the condition making it the wrong moment to proceed as
  written, so it went to the human rather than being resolved by the executor.
- The transcript also surfaced a **fourth option the plan does not list** — `approve-ratchet-down` —
  because presenting only options that either raise a ceiling or do nothing would have framed the
  decision dishonestly.
- **Commits:** `555d3b1`, `c93fdbe`

### 3. [Held decision] Task 3's re-baseline branch did not execute

- Task 3 reads *"If the re-baseline was approved, edit only the numeric literals…"* and *"If a partial
  or a hold was chosen, record which rows moved and which did not."* The hold branch ran.
- **Zero rows moved.** All 34 numbers are unchanged, by identity rather than by comparison.
- The acceptance criterion *"`node scripts/check-foundation-guards.js` exits 0 … and **zero** WARN
  lines for role size"* is **not met, and could not be under a hold**: `security-nfr.md` sits 101 B
  above its unchanged advisory WARN tier, exactly as 29-07 handed it over. The criterion was written
  for the edited table; the pre-existing WARN is untouched, not newly caused. Recorded rather than
  reported as met.
- **Commits:** `c93fdbe`, `ce5e907`

### 4. [Measured deviation] One of the plan's four stated pre-phase totals does not reproduce

- Task 3's `read_first` supplies §A-2's four totals as inputs: **104,094** workflows, 19,368
  checklists, 14,205 seed, 15,185 contracts.
- Three reproduce exactly. **The workflow figure measures 104,048 at `4d2b8f0` — 46 B lower** —
  through the research's own command shape and through the gate's membership.
- Not averaged and not explained away: the measured value is used, the plan's value is named as
  falsified, and 29-10's independent finding is credited rather than re-litigated.
- **Commit:** `ce5e907`

## Known Stubs

**None.** This plan introduced no hardcoded empty value, placeholder string or unwired data path. Its
only code change is a test case that runs three real guard invocations against two hermetic mirrors
and one scratch build; its two documents contain no `TODO`, `FIXME`, `placeholder` or `coming soon`.
Every number in both documents is produced by a command run in this plan, and each one names its
method.

## Residuals recorded rather than closed

**This is the phase's last plan, so these have nowhere else to land.** Every one is carried forward
deliberately, with the reasoning that left it open.

### This plan's own

- **LANG-08's re-baseline half is UNMET and the requirement is NOT marked complete.** Held by
  decision. The never-raised and delta-recorded halves are satisfied; the re-baseline did not happen.
- **The seventeen ceilings now describe a PRE-REWRITE kit.** They encode a 2026-06-10-era baseline
  against a corpus that shrank 2,423 B this phase, so the headroom they report is **1,069 B larger
  than the rewrite earned**, and growth measured against them is measured against a stale reference.
- **The ratchet-down values are ready to apply and are recorded in full** in
  `docs/audit/29-ceiling-rebaseline.md` — but **re-measure first**, because they are a reading of the
  tree at `9dfb8af`.
- **`frontend-ui.md`'s baseline 3544 is RECOVERED, not recorded**, and the three legacy FAIL-rounding
  cases (`orchestrator`, `security-nfr`, `frontend-ui`) use floor/round where fourteen use `ceil`.
  Both matter to whoever moves the table next.

### Carried forward from earlier plans

- **`security-nfr.md` is 101 B above its advisory WARN tier** (171 B under FAIL), and the WARN line is
  live in every green run. 29-07 refused to close it because the only remaining bytes sit in prose its
  written partition classifies as safety-bearing — the ASVS filter rule and the trigger list — and
  refused a further 37 B from deleting a `## Responsibilities` item whole. WARN contributes nothing to
  the exit code.
- **`security-nfr.md` `## Reads` bullet 3 breaches WP-03** at ~32 words against the 25-word descriptive
  bound. 29-07 left it because fixing it under byte pressure would have made a style repair
  indistinguishable from byte-buying. **That pressure is gone now, and this plan did not take it up**
  — it changes no governed or role prose at all, and opening a role file to fix one bullet would have
  put a prose edit in the plan that owns the arithmetic.
- **The WP-09 lowercase workflow-naming defect** — three offenders: `context compaction`,
  `context read/write`, `task claim + schedule`. 29-10 declined it because `# Workflow:` headings are
  the derivation source for `listWorkflowDisplayNames()` → `TECHNICAL_NAMES` → a two-sided pinned
  count, so renaming changes a **derived set**, not prose. **This plan does not own that pin either**,
  and it is re-recorded with that reasoning rather than silently dropped.
- **No gate detects a non-UTF-8 byte in kit markdown.** 29-05's `perl -pi -e` rewrite silently wrote a
  raw latin-1 `0xA7` into seven files; `check-nul-bytes` looks only for NUL and markdown readers decode
  lossily to U+FFFD. A one-line round-trip check over the derived kit corpus would close it. This plan
  ran the round trip by hand over its own files (0 failures) — **nothing in the build would have caught
  a failure.**
- **`guard_sentence_form` segments per source LINE**, so a wrapped sentence is cut at the line break
  and a mid-sentence relative pronoun at a line head can false-positive the bare-demonstrative arm.
  29-12 met one at `context-note.md:35`, refused both available gaming fixes and split the sentence on
  independent grounds. A green gate means none currently does, not that none can.
- **`guard_imperative_lexicon`'s `0 over 139` is an empty denominator over three of the corpus's four
  parts.** Checklists, seed templates and contracts carry no `## Steps` heading, so **all 139 bullets
  are workflows'.** Not a defect — the gate's own source argues why `## Steps` is the honest surface —
  but it must never be reported as corpus-wide.
- **The `and-slash-or` arm (WP-07) has found zero real findings in the entire phase.** Mutation-proven
  live in 29-11, never tripped by real kit text. Whoever revisits the profile should decide whether an
  arm with no attested instance earns its place.
- **`readDispositionRows()` silently drops a register row containing an escaped pipe** — it splits on
  `|`, a row with escaped cells arrives at 17 cells, and it is skipped wordlessly. 29-12 has an
  attested instance. The failure mode is invisible by design: the row is in the file, reads as work
  done, and nothing reads it.
- **`mark anything unverified 'UNKNOWN - verify'` remains a pre-existing WP-10 repetition** across
  three role `## Hard limits`. Unchanged; deleting a no-fabrication floor to clear a duplication
  finding is the wrong direction.
- **A non-conforming step written as PROSE with no list marker is still not seen.** 29-03's residual,
  unchanged.

## Threat Flags

None beyond the plan's own register. No network path, no write path, no new dependency.

- **T-29-75 (ceiling values raised rather than lowered) — mitigated, and the threat was LIVE.** This is
  the one threat in the register that actually fired: the plan's own derivation produced twelve raises.
  Every value was compared against its git-previous value with an at-most assertion, the comparison is
  recorded, a blocking human checkpoint reviewed the seventeen-row transcript, and **no value was
  edited at all.** The mitigation worked as designed rather than being unneeded.
- **T-29-76 (a delta no command reproduces) — mitigated.** Every current size is produced by a command
  in this plan; the disagreement with 29-RESEARCH's workflow figure is recorded with both numbers and
  the reproducing command rather than reconciled; the agreement with 29-07's table is recorded as an
  agreement rather than left silent.
- **T-29-77 (fail-closed default weakened) — mitigated, three-part.** Green control, red plant asserted
  by exit status and by FAIL-line kind, and a scratch-build falsifier that softens the default branch
  and turns the same plant green.
- **T-29-78 (losing the pre-rewrite baseline) — did NOT materialise.** The table was not edited, so the
  pre-rewrite baseline is still the live one. The one-shot transcript now records both the live values
  and the deferred alternative.
- **T-29-79 (inventing governed-corpus ceilings under pressure) — mitigated and asserted.** Twelve
  `ceiling` occurrences in the growth document, every one a reference; no declaration for any governed
  file; both rejected alternatives recorded with their reasons.
- **T-29-80 (aggregator runtime after the whole kit was rewritten) — mitigated and measured.**
  0.12 / 0.10 / 0.11 s against the 0.127 s pre-phase baseline — **below it.** `.planning/STATE.md`
  longest line 7,966 and longest backslash run 1, both unmoved.
- **T-29-SC (package installs) — asserted by absence.** All four dependency sets byte-identical to
  `4d2b8f0` by `JSON.stringify` comparison; the only `package.json` change phase-wide is one added
  `scripts` key.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: docs/audit/29-ceiling-rebaseline.md
FOUND: docs/audit/29-corpus-growth.md
```

Commits claimed, verified in `git log`:

```
FOUND: 555d3b1  test(29-13): measure all seventeen role ceilings and pin the fail-closed default
FOUND: c93fdbe  docs(29-13): record the hold decision and preserve the ratchet-down finding
FOUND: ce5e907  docs(29-13): the four-part corpus growth record, with its mechanism measured
```

File claimed NOT created, verified absent:

```
ABSENT: docs/audit/29-style-dispositions/29-13.md  (deviation 1)
```
