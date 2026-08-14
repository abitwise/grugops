# Plan 29-13 — the byte-ceiling before-and-after transcript

This plan changes no governed prose. It owns the **arithmetic** every prose plan from 29-05 onward
was forbidden to touch: the once-only re-baseline of `roleCeiling()` (LANG-08, D-25 … D-28).

**This file is the CONTROL.** D-27 declines a permanent test fixture pinning the previous values,
because that would be a second place to edit and a second thing to keep true. This transcript and git
history are the whole record.

## THE DECISION: `hold-rebaseline`. The table was NOT edited.

**`scripts/check-foundation-guards.ts` is byte-unchanged by this plan**, as it has been since 29-05.
The seventeen ceilings still read exactly as they did before Phase 29 began.

The transcript below was put to a human at the plan's blocking checkpoint, and the answer was to hold.
**The reasoning, recorded rather than paraphrased from the option label:**

> The twelve raises the transcript found are **Phases 13–27 growth that the ceilings absorbed as
> headroom, not this phase's doing.** Re-deriving the margin from today's size would convert consumed
> headroom into permanent new headroom. **Holding costs nothing today**, because every measured size
> is already under its current ceiling. The accepted price is that the ceilings keep encoding the
> 2026-06-10-era baseline, so a later phase measuring growth against them is measuring against a
> stale reference.

The `approve-ratchet-down` option below was **read and understood, and was not rejected as wrong.**
The choice was not to move the table at all this phase. It is therefore recorded here as a
**preserved, deferred finding** — with its per-tier values — so whoever moves the table next can act
on it without re-deriving anything. See *The alternative that DOES satisfy LANG-08*, below.

**LANG-08 is satisfied vacuously and is recorded as such rather than as a pass.** Its text is
*"byte ceilings re-baselined once at end of phase, every file ≤ previous, delta recorded."* No ceiling
was re-baselined, so no ceiling rose — the prohibition half holds absolutely, by absence. The
re-baseline half **did not happen**, and pretending otherwise would be the fabricated-completion shape
this whole phase exists to delete. The delta is recorded, which is the part that carries forward.

## Method — every number below was produced by a command in this plan

| what | how |
|---|---|
| the seventeen role files, and their ORDER | `listRoles(".")` from `scripts/kit-model.js`, read through `import()` — never a directory listing retyped |
| current size | `Buffer.byteLength(readFileSync(rel))` on the working tree at `9dfb8af` |
| pre-phase size | `Buffer.byteLength(git show 4d2b8f0:<rel>)` — the phase base commit 29-04 recorded and 29-12 reproduced |
| current WARN / FAIL | parsed out of the **committed `scripts/check-foundation-guards.js`** — the file that actually runs — by a regex over `roleCeiling()`'s `case` arms, so the table is read rather than transcribed |
| the encoded baseline | read from each case's own trailing comment (`measured N B` / `baseline N B`); the one case that states none is recovered by inverting the convention over the integers |

Nothing here is copied from `29-05-SUMMARY.md`, `29-06-SUMMARY.md`, `29-07-SUMMARY.md` or from
`29-RESEARCH.md` §A-1. Those are the cross-check, below, not the source.

## The seventeen-row transcript

Rows are in `listRoles()` sorted order, so this table and the git-previous one are diffable line for
line. `prop` is the plan's stated derivation: **FAIL = current measured size + 12%, WARN = current
measured size + 6%**, with `ba-pm.md` left at its documented **+20% / +12%** PERS-02 headroom.

**The comparison is at-most, not strictly-less.** A role whose value lands exactly on its previous
ceiling PASSES; equality is not a breach.

| role | pre-phase | current | Δ | cur WARN | cur FAIL | prop WARN | prop FAIL | WARN ≤ ? | FAIL ≤ ? |
|---|---:|---:|---:|---:|---:|---:|---:|:--:|:--:|
| `agents-md-scribe.md` | 4094 | 3764 | −330 | 4301 | 4544 | 3990 | 4216 | **yes** | **yes** |
| `architect-design.md` | 3790 | 3574 | −216 | 4016 | 4243 | 3789 | 4003 | **yes** | **yes** |
| `ba-pm.md` | 3672 | 3605 | −67 | 3901 | 4180 | 4038 | 4326 | **NO — RAISE** | **NO — RAISE** |
| `brownfield-mapper.md` | 2738 | 2580 | −158 | 2693 | 2845 | 2735 | 2890 | **NO — RAISE** | **NO — RAISE** |
| `compliance-officer.md` | 4433 | 4292 | −141 | 4555 | 4813 | 4550 | 4808 | **yes** | **yes** |
| `factory-coach.md` | 3464 | 3448 | −16 | 3633 | 3839 | 3655 | 3862 | **NO — RAISE** | **NO — RAISE** |
| `frontend-ui.md` | 3872 | 3724 | −148 | 3757 | 3969 | 3948 | 4171 | **NO — RAISE** | **NO — RAISE** |
| `greenfield-mapper.md` | 2916 | 2873 | −43 | 2882 | 3045 | 3046 | 3218 | **NO — RAISE** | **NO — RAISE** |
| `incident-responder.md` | 3540 | 3481 | −59 | 3598 | 3802 | 3690 | 3899 | **NO — RAISE** | **NO — RAISE** |
| `installer.md` | 3546 | 3325 | −221 | 3727 | 3938 | 3525 | 3725 | **yes** | **yes** |
| `orchestrator.md` | 7090 | 6802 | −288 | 7165 | 7570 | 7211 | 7619 | **NO — RAISE** | **NO — RAISE** |
| `qe-e2e.md` | 3695 | 3608 | −87 | 3617 | 3822 | 3825 | 4041 | **NO — RAISE** | **NO — RAISE** |
| `release-manager.md` | 4230 | 4001 | −229 | 4510 | 4765 | 4242 | 4482 | **yes** | **yes** |
| `security-nfr.md` | 5027 | 4931 | −96 | 4830 | 5102 | 5227 | 5523 | **NO — RAISE** | **NO — RAISE** |
| `software-engineer.md` | 3722 | 3507 | −215 | 3697 | 3906 | 3718 | 3928 | **NO — RAISE** | **NO — RAISE** |
| `system-analyst.md` | 3020 | 2962 | −58 | 3000 | 3170 | 3140 | 3318 | **NO — RAISE** | **NO — RAISE** |
| `uat-planner.md` | 3367 | 3316 | −51 | 3350 | 3540 | 3515 | 3714 | **NO — RAISE** | **NO — RAISE** |
| **total (17 roles)** | **66,216** | **63,793** | **−2,423** | | | | | **5 of 17** | **5 of 17** |

## The assertion the plan asked for, and its result

> *"Assert, for all seventeen, that the proposed FAIL is at most the current FAIL and the proposed
> WARN is at most the current WARN."*

**The assertion FAILS on twelve of seventeen rows, on both tiers, on the same twelve rows.** Only
`agents-md-scribe.md`, `architect-design.md`, `compliance-officer.md`, `installer.md` and
`release-manager.md` satisfy it.

This is reported as measured. It is not smoothed, and no percentage was quietly adjusted to make it
come out right.

### Why — the partition is exact, and it is not about this phase's rewrite

Every ceiling in the table encodes a **2026-06-10-era measured baseline**, stated in its own trailing
comment. The current ceilings are that baseline plus a margin. Recomputing the same margin from
**today's** size therefore raises the ceiling for any role whose size today is larger than the
baseline the ceiling encodes.

| role | encoded baseline | current | current − baseline | recompute verdict |
|---|---:|---:|---:|:--|
| `agents-md-scribe.md` | 4057 | 3764 | **−293** | lowers |
| `architect-design.md` | 3788 | 3574 | **−214** | lowers |
| `ba-pm.md` | 3483 | 3605 | +122 | RAISES |
| `brownfield-mapper.md` | 2540 | 2580 | +40 | RAISES |
| `compliance-officer.md` | 4297 | 4292 | **−5** | lowers |
| `factory-coach.md` | 3427 | 3448 | +21 | RAISES |
| `frontend-ui.md` | 3544 *(recovered)* | 3724 | +180 | RAISES |
| `greenfield-mapper.md` | 2718 | 2873 | +155 | RAISES |
| `incident-responder.md` | 3394 | 3481 | +87 | RAISES |
| `installer.md` | 3516 | 3325 | **−191** | lowers |
| `orchestrator.md` | 6759 | 6802 | +43 | RAISES |
| `qe-e2e.md` | 3412 | 3608 | +196 | RAISES |
| `release-manager.md` | 4254 | 4001 | **−253** | lowers |
| `security-nfr.md` | 4556 | 4931 | +375 | RAISES |
| `software-engineer.md` | 3487 | 3507 | +20 | RAISES |
| `system-analyst.md` | 2830 | 2962 | +132 | RAISES |
| `uat-planner.md` | 3160 | 3316 | +156 | RAISES |

**The partition is mechanical, not a judgement: a row raises if and only if its current size exceeds
the baseline its ceiling encodes.** Asserted rather than eyeballed — the predicate
`(current > encodedBaseline)` and the predicate `(proposedFAIL > currentFAIL)` agree on all seventeen
rows, and so do `(current > encodedBaseline)` and `(proposedWARN > currentWARN)`.

**This phase did not cause it.** Every one of the seventeen roles SHRANK this phase — the corpus went
66,216 → 63,793 B, **−2,423 B, −3.66%**. The twelve raises are the accumulated growth of Phases 13
through 27, which the ceilings absorbed as *headroom* rather than as a re-baseline. Re-deriving the
margin from today's size would convert that consumed headroom into permanent new headroom, which is
exactly the widening D-25's own comment refuses.

### The `frontend-ui.md` baseline was recovered, not assumed

Its case is the one whose comment records no baseline (`// Phase 13 — 17th role (UI-01)`). It was
recovered by inverting the convention over every integer from 3000 to 3999 under all nine
floor/round/ceil combinations: **3544 is the unique solution**, and it is unique under all four
combinations that reproduce the pair. It is marked *(recovered)* above so a later reader does not
mistake it for a recorded value.

### A second, smaller finding: the rounding convention is not uniform

Fourteen of the seventeen cases reproduce **exactly** under `ceil` on both tiers from their recorded
baseline. Three do not, all on the FAIL tier, and all three are the oldest cases in the table:

| role | baseline × ratio | table value | rounding actually used |
|---|---:|---:|---|
| `orchestrator.md` | 6759 × 1.12 = 7570.08 | 7570 | floor / round |
| `security-nfr.md` | 4556 × 1.12 = 5102.72 | 5102 | **floor** |
| `frontend-ui.md` | 3544 × 1.12 = 3969.28 | 3969 | floor / round |

Every case added by Phases 21 and 22 uses `ceil` on both tiers. The `prop` column above uses `ceil`,
the newer and stricter of the two. **The choice is immaterial to every verdict in this transcript** —
the three legacy rows differ by at most 1 byte, while the twelve raises range from +20 to +421 bytes.

## The alternative that DOES satisfy LANG-08 — PRESERVED, DEFERRED, NOT APPLIED

**These values were not written to the table.** They are recorded so the next phase to touch
`roleCeiling()` can act on them without re-deriving anything, and so that the option is met as a
decision already reasoned through rather than rediscovered.

LANG-08 asks for *"every file ≤ previous."* A ceiling that only ever ratchets **down** satisfies that
by construction: take `min(recomputed, current)` per tier.

| role | new WARN | new FAIL | change |
|---|---:|---:|---|
| `agents-md-scribe.md` | 3990 | 4216 | **lowered** (−311 / −328) |
| `architect-design.md` | 3789 | 4003 | **lowered** (−227 / −240) |
| `ba-pm.md` | 3901 | 4180 | unchanged |
| `brownfield-mapper.md` | 2693 | 2845 | unchanged |
| `compliance-officer.md` | 4550 | 4808 | **lowered** (−5 / −5) |
| `factory-coach.md` | 3633 | 3839 | unchanged |
| `frontend-ui.md` | 3757 | 3969 | unchanged |
| `greenfield-mapper.md` | 2882 | 3045 | unchanged |
| `incident-responder.md` | 3598 | 3802 | unchanged |
| `installer.md` | 3525 | 3725 | **lowered** (−202 / −213) |
| `orchestrator.md` | 7165 | 7570 | unchanged |
| `qe-e2e.md` | 3617 | 3822 | unchanged |
| `release-manager.md` | 4242 | 4482 | **lowered** (−268 / −283) |
| `security-nfr.md` | 4830 | 5102 | unchanged |
| `software-engineer.md` | 3697 | 3906 | unchanged |
| `system-analyst.md` | 3000 | 3170 | unchanged |
| `uat-planner.md` | 3350 | 3540 | unchanged |

**Five rows lower, twelve hold. Every row is at most its previous value, so the at-most assertion
holds on 17 of 17.** Total FAIL headroom across the corpus falls from **7,300 B to 6,231 B** — a
**1,069 B, 14.6%** tightening — and **no role lands in WARN or FAIL** under the new values:
`security-nfr.md` is the only role above any WARN tier, and it is above the same unchanged 4830 it
was already above.

This is a smaller act than a full re-derivation, and it is the only one available that does not raise
a ceiling. **It was deferred, not discarded.**

## What the next phase to touch this table needs, in one place

1. **The ceilings now describe a PRE-REWRITE kit.** Every value encodes a 2026-06-10-era baseline, and
   the corpus it was measured against no longer exists: the seventeen roles shrank 66,216 → 63,793 B
   during Phase 29. Growth measured against these ceilings is growth measured against a stale
   reference, and the headroom they report is **1,069 B larger than the rewrite earned**.
2. **`frontend-ui.md`'s baseline is 3544, and it is RECOVERED rather than recorded.** Its case comment
   states no baseline (`// Phase 13 — 17th role (UI-01)`). 3544 is the unique integer that reproduces
   its pair, under every rounding combination that reproduces it at all. Anyone re-deriving that row
   should treat the value as inferred and say so, exactly as this transcript does.
3. **Three legacy cases round their FAIL tier differently from the other fourteen** —
   `orchestrator.md`, `security-nfr.md` and `frontend-ui.md` use floor/round where every Phase-21 and
   Phase-22 case uses `ceil`. Applying `ceil` uniformly would move those three by at most 1 byte, so
   it is safe; it is named because a re-derivation that silently normalised them would look like an
   unexplained ±1 drift in a diff nobody could account for.
4. **The ratchet-down values above are ready to apply as they stand**, provided the corpus has not
   moved. **Re-measure first.** These numbers are a reading of the tree at `9dfb8af`, and their whole
   value is that they were measured rather than assumed.

## The measurement, cross-checked against the running record

`29-07-SUMMARY.md` published a seventeen-role byte table for this plan to consume. This plan
re-measured rather than trusting it.

**All seventeen values reproduce exactly, and so does the 63,793 B total. There is no discrepancy of
any size on any row.** Stated explicitly, because a transcript that quietly reconciles is worth
nothing as a control, and "there was nothing to reconcile" is a different fact from silence.

The reason is visible in git: the last commit to touch `agent-factory/roles/` is **`1b611d1`**, plan
29-07's third commit. Plans 29-08 through 29-12 changed workflows, checklists, seed templates and
contracts — **no role file moved after the role track closed**, so 29-07's table and today's
measurement are readings of the same tree.

Both figures also agree with `29-RESEARCH.md` §A-1's pre-phase column: the eight roles it recorded
above their WARN tier — `brownfield-mapper`, `frontend-ui`, `greenfield-mapper`, `qe-e2e`,
`security-nfr`, `software-engineer`, `system-analyst`, `uat-planner` — reproduce exactly from
`git show 4d2b8f0:`, and **seven of those eight are now under it.** The one that is not is
`security-nfr.md`, 101 B above its advisory WARN tier and 171 B under FAIL, exactly as 29-07 handed
it over.

## The fail-closed default, pinned by a case rather than re-checked by hand

`roleCeiling()`'s `default: return ""` branch makes `guard_role_size` fail red naming any role the
table does not know. D-25 names this as half the reason the table is not derived: deriving it would
give role #18 an automatic ceiling instead of forcing an author to measure and record one.

That property has to survive whichever phase eventually moves the table — and the case was written and
kept even though this plan held, because the property is worth pinning on its own merits.
`scripts/check-foundation-guards.test.ts` already carried a case asserting the *line* appears; it
deliberately asserts nothing about the exit code. This plan adds the other half — **the exit-status
assertion, with the control that makes an
exit code mean something**:

| half | fixture | assertion |
|---|---|---|
| control | `consistentMirror()`, unplanted | exits **0** |
| red | the same mirror + an 18th role the table has no case for | exits **nonzero**, and the guard_role_size line for it is a **FAIL** naming `no documented ceiling` — never a size verdict |
| falsifier | the same mirror, same plant, one scratch mutation: `default: return ""` → `default: return "999999 999999"` | the planted file now gets a **`within ceiling` PASS** — proving the empty string is the mechanism, not some co-firing guard |

The falsifier is the half that matters. A bare `status !== 0` on an 18-role mirror is satisfied by
`guard_kit_counts` alone, which legitimately fails in the same run; only the mutation shows that the
default branch is what refuses an undocumented role.

## What this plan did NOT do

**`scripts/check-foundation-guards.ts` is byte-unchanged for the whole plan**, and
`git diff -- scripts/check-foundation-guards.ts` is empty against the phase base `4d2b8f0`. Not one
numeric literal in `roleCeiling()` moved, in either direction. Under the `hold-rebaseline` decision
that is the outcome, not an interim state.

## Why this document is not in `docs/audit/29-style-dispositions/`

The plan names this artifact `docs/audit/29-style-dispositions/29-13.md`. It was written there first,
and `npm run check:diff-disposition` **refused it**:

```
  FAIL  docs/audit/29-style-dispositions/29-13.md has a `## Dispositions` heading and ZERO rows
        under it. The table takes 7 columns — file, line, before, after, rule, disposition,
        companion — and a row with any other count is not read
```

**The refusal is correct and the gate's own wording says why.** Its sibling refusal — for a register
file carrying no `## Dispositions` heading at all — reads *"A disposition file whose rows are
invisible is worse than an absent one: it reads as work done."* The directory admits exactly one
shape: a heading with at least one seven-column row. There is no sanctioned "this plan disposed
nothing" form, deliberately.

**This plan disposes nothing, and that is measurable rather than claimed.** It changes no file in the
41-entry LANG-03 watched corpus and no governed-corpus prose of any kind. Its edits are
`scripts/check-foundation-guards.test.ts`, `scripts/check-foundation-guards.ts` (numeric literals and
trailing comments inside `roleCeiling()` only), `scripts/check-foundation-guards.js`, and two
documents under `docs/audit/`. `changedClauses()` derives no clause for any of them, so there is
nothing for `rowMatches()` to cover.

The two ways to keep the plan's literal path were to **invent a row** for a clause that did not
change, or to **add `29-13.md` to `DISPOSITION_NON_ROWS`** — a hand-maintained exemption literal, the
exact drift class this milestone exists to delete. Both were refused. The document moved instead, to
sit beside this plan's other artifact, `docs/audit/29-corpus-growth.md`.
