---
phase: 29-controlled-language-voice-guard-rebuild
plan: 15
subsystem: diff-disposition-gate
tags: [LANG-03, CR-02, per-carrier-attribution, fail-closed, three-commit-harness]
status: complete
requires:
  - "scripts/check-diff-disposition.ts — changedClauses, touchedLines, segmentClauses (the range-level derivation the carrier derivation reuses)"
  - "docs/audit/29-style-dispositions/00-base.md — the recorded base commit, byte-unchanged by this plan"
  - "scripts/generate-safety-surface.ts safetySurfaceUnion() — the watched corpus, re-derived at execution"
provides:
  - "WORKING_TREE_CARRIER — the named sentinel for an uncommitted change set"
  - "Carrier / listCarriers / carrierFilesTouched — the ordered change sets between the recorded base and the working tree"
  - "attributeClauses / attributionKey — the map from (file, normalized clause) to the carriers that changed it"
  - "companionSatisfied — the per-clause, per-carrier companion predicate shared by BOTH non-structural arms"
  - "REGISTRY_COMPANION — the claim-registry path as one spelling"
  - "changedClausesIn(TreeSpan, files) — the generalized derivation; changedClauses is now its range case"
  - "MirrorSpec.commits — the harness can express three commits, so `same commit` and `since base` are finally distinguishable"
affects:
  - "guard_diff_disposition — the companion rule on registryAnchors and positiveGuardLiterals"
  - "plans 29-16..29-19 — every kit change from here is judged against the per-carrier rule (one-way, D-15-A)"
tech-stack:
  added: []
  patterns:
    - "Decide the predicate against the CHANGE SET that produced the element, not against the range that contains it"
    - "A predicate that cannot be evaluated is a refusal with its OWN wording, never a fall-through to satisfied"
    - "Extend the harness until it can EXPRESS the difference, and prove the new case red, before touching the predicate"
    - "Assert the harness's own premise per fixture — here, the commit count and per-payload commit membership"
key-files:
  created: []
  modified:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
decisions:
  - "D-15-A: the companion edit is decided PER CARRIER — the commit that actually changed the clause, never the range"
  - "D-15-B: an uncommitted change set is a NAMED carrier (WORKING_TREE_CARRIER), not an unattributed pass"
  - "D-15-C: the attribution map is keyed on normalized clause TEXT, never the line number"
  - "D-15-D: an unresolvable attribution is a refusal with its own wording (NO CARRIER FOUND), distinct from a missing companion edit"
  - "D-15-E: both arms closed in ONE edit; positiveGuardLiterals was only accidentally safe"
metrics:
  duration: 18m
  completed: 2026-08-15
actuals:
  tokens: 96000
  tasks: 3
  commits: 3
---

# Phase 29 Plan 15: Per-Carrier Companion Attribution Summary

`guard_diff_disposition` now decides the companion-edit rule against the change set that actually
changed each frozen clause, so a companion edit somewhere in the range no longer satisfies every
later reword — the rule the contract string always claimed.

## The decision checkpoint

The plan opened with a blocking `checkpoint:decision`. It was raised to the user and resolved:
**`per-carrier`**. The rejected alternative (`per-clause-pairing`) would have required the contract
wording to be WEAKENED to match a weaker check and does not generalise to the positive-literal arm.
No contract string was weakened; both were strengthened.

Before answering, the premises were re-derived rather than taken from the plan — which is where the
two drifts below came from.

## What Was Built

**CR-02 — the defect.** `scripts/check-diff-disposition.ts:1142` and `:1147` decided both
non-structural arms with `allChangedFiles.includes(<companion>)`, where `allChangedFiles` was
`git diff --name-only <base>` — the **whole range**. The contract strings said "the SAME commit".
Those are different questions, and the difference is not academic: once any commit in the range
touched the companion, every frozen clause from that source was satisfied for the rest of the phase,
with no per-clause correspondence and no check at all.

On the live tree it was already true. `git diff --name-only 4d2b8f0` contains
`docs/audit/28-claim-registry.md` (commit `7ec9173`, plan 29-07), so line 1142 was an unconditional
`true` and every registry-anchored frozen clause was unprotected under a clean green.

The reason no test caught it was structural: `makeMirror` built exactly **two** commits, so
"same commit" and "since base" are the same statement in every fixture written before this one. The
harness had to gain a third commit before the fix could be believed.

## Task 1 — the harness can express three commits, RED first (commit `24513a4`)

`MirrorSpec.commits` is an ordered list of commit payloads applied between the base commit and the
final plant commit. It is additive: a spec that omits it builds exactly the two-commit mirror this
file has always built, so no existing case changed shape.

**The harness asserts its own premise, per mirror**, because this is the round where a harness
premise is what failed:

1. the number of commits between the recorded base and HEAD equals payloads **+ 1** (the final plant
   commit, which always exists because `BASE_FILE` is always written into it); and
2. every path named by payload `i` appears in commit `i` and in **no other** post-base commit —
   catching a collapse in either direction.

A three-commit fixture that silently collapsed into two would prove the exact opposite of what its
case claims, and nothing else here would notice.

`makeDivergentMirror` builds a recorded base that is **not an ancestor of HEAD** — the shape a
rebase or force-push leaves, and the one the base file names in its own words. That is the
constructible unattributable case: the frozen clause is in the base's tree and not in HEAD's, so it
appears on the removed side of the range diff while no commit in `base..HEAD` ever touched the file
carrying it.

**Plants derived, never typed.** The anchored sentence comes from the copied registry through the
existing premise-asserted `ANCHOR_CLAIM`; the positive literal is derived from the gate's exported
set by filtering for the three (of nine) literals that segment to exactly one clause AND resolve to
`positiveGuardLiterals` in the frozen map. Planting one of the other six would prove the wrong arm —
the failure 29-03's actor-subject fixture already hit in this file.

A premise case proves both companion touches are **visible to git and invisible to both
derivations**: `readRegistry` returns identical verbatims (42) and `derivePositiveGuardLiterals`
returns identical literals (9) with zero refusals. Without that, the three-commit cases would red on
a SHORT-derivation refusal instead of on the companion rule — a red for the wrong reason.

### RED transcript — against the pre-fix committed build (`f41ce090…`)

```
 Test Files  1 failed (1)
      Tests  3 failed | 24 passed (27)
```

**Registry arm, three commits — the bypass, verbatim:**

```
 FAIL  ... > a companion touched in an earlier commit does not satisfy a later frozen reword
AssertionError: expected '\n[guard_diff_disposition] every clau…' not to contain 'ALL CHECKS PASSED'

[guard_diff_disposition] every clause changed in the LANG-03 watched corpus is dispositioned, and a frozen intersection carries its same-commit companion edit (LANG-03, D-01..D-05)
        watched corpus: 40 markdown file(s) of the 41-entry LANG-03 safety-surface union; 1 non-markdown entr(ies) named and not watched (...)
        frozen set: registry verbatim anchors 42/42, roles `## Hard limits` 17/17, workflows `## Stop conditions` 19/19, workflows `## Commit` 19/19, positive guard literals 9/9; 180 frozen clause(s), 55 frozen region(s); base 067385e
        1 watched file(s) changed since 067385e; 1 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  PASS  diff disposition: 0 findings over 1/1 elements

== Result ==
ALL CHECKS PASSED
```

**Positive-literal arm, three commits — the same bypass, verbatim:**

```
 FAIL  ... > a guard source touched in an earlier commit does not satisfy a later frozen reword
AssertionError: expected '\n[guard_diff_disposition] every clau…' not to contain 'ALL CHECKS PASSED'

        frozen set: ... positive guard literals 9/9; 180 frozen clause(s), 55 frozen region(s); base 6e3b90d
        1 watched file(s) changed since 6e3b90d; 1 changed clause(s) derived; 1 disposition row(s) across 1 file(s)
  PASS  diff disposition: 0 findings over 1/1 elements

== Result ==
ALL CHECKS PASSED
```

**Fail-closed case — red for the right reason, but with the WRONG wording:**

```
 FAIL  ... > an unattributable frozen clause is reported rather than satisfied
AssertionError: expected '…' to contain 'no carrier'

  FAIL  diff disposition: 1 finding(s) over 1 elements
        agent-factory/workflows/00-bootstrap-greenfield.md:14 (removed) — FROZEN by registryAnchors: ...
        Owed companion edit: docs/audit/28-claim-registry.md must change in the SAME commit (Phase 28 / D-25).
== Result ==
1 CHECK(S) FAILED
```

**Both same-commit controls were GREEN in this same pre-fix run** (they are among the 24). A control
that was never green before the change proves nothing about the change; these two were.

The banner assertion is placed **before** the exit-code assertion in both three-commit cases, on
purpose: when the case fails it must print the gate's whole passing transcript, because that
transcript *is* the bypass evidence.

## Task 2 — attribute every frozen clause to its carrier (commit `8c4d5b0`)

`changedClauses` was generalized to `changedClausesIn(TreeSpan, files)`; the old export is now its
range case, so the range side and the carrier side stay the same kind of object — same hunk parsing,
same `segmentClauses`, same normalized keys. **A carrier's two sides are read from that carrier's
own trees, never from the working tree**, or a clause's text would be read out of a tree the carrier
never had.

| New export | What it is |
|---|---|
| `Carrier`, `WORKING_TREE_CARRIER` | a change set; the named sentinel for the uncommitted one |
| `listCarriers(base)` | `rev-list --reverse base..HEAD`, oldest-first, plus the sentinel when the tree is dirty |
| `carrierFilesTouched(carrier)` | the paths one carrier touched (modified **and** untracked for the sentinel) |
| `attributeClauses(base, watched)` | `(file, clause) -> carriers that changed it` |
| `companionSatisfied(...)` | the per-clause predicate shared by **both** non-structural arms |
| `REGISTRY_COMPANION` | the registry path, spelled once |

**Keyed on normalized clause TEXT, deliberately not the line number.** A clause's line differs
between the range diff and a single carrier's diff by exactly the number of lines edited above it, so
a line-keyed map would fail to attribute correct history and every multi-commit range would read as
unattributable. The frozen set is already keyed on normalized text, so this keeps one notion of
clause identity across the gate.

**Bounded work, unbounded correctness.** Each carrier's touched-file set is read once and intersected
with the watched corpus first; the clause derivation runs only for carriers that touched a watched
file. The carrier list is **not capped** — a cap narrows the check silently, the same act as
narrowing the corpus.

**Fail-closed, said in its own words.** Two different failures get two different messages, because
collapsing them would send the second author to write a companion edit that cannot help:

- *carriers exist, none touched the companion* → `Carrier(s) that changed this clause: … — none of
  them touched the companion.` + the owed companion edit.
- *no carrier at all* → `NO CARRIER FOUND: no carrier among the N change set(s) … An attribution the
  gate cannot make is a REFUSAL, not a pass.`

A **non-vacuity floor** sits **above** the per-clause loop: a non-empty changed set with an empty
attribution map fails by name once, rather than as N identical findings — on the same principle as
the existing zero-clause refusal.

**Both contract strings strengthened, neither weakened**, and both now name the working-tree carrier.
`grep -c 'SAME commit'` still returns `2`.

### Acceptance probes

```
allChangedFiles, non-comment lines in .ts : 0     (criterion: 0)
allChangedFiles, committed .js            : 0     (deleted, not renamed in comments)
allChangedFiles, anywhere in .ts          : 1     (the comment naming the deleted defect)
grep -c 'SAME commit' .ts                 : 2     (criterion: >= 2)
npm run freshness                         : exit 0 — 48 committed .js match a fresh tsc rebuild
second `npm run build`                    : git status --porcelain UNCHANGED
npm run typecheck                         : exit 0
```

### Live gate, before and after

```
                     PRE-FIX          POST-FIX
watched files changed   37               37
changed clauses       1880             1880
disposition rows      1532             1532
exit                     0                0
wall clock            1.04s            1.67s
carriers                 —   43 change set(s), 9 examined, working tree IS a carrier
```

Counts are byte-identical against the plan's recorded pre-change values of **37 / 1880 / 1532**. The
wall clock grew 0.63s; the carrier count (43) and the number of carriers whose clauses were actually
derived (9) are recorded beside it, per T-29-47.

## Task 3 — the live bypass, reproduced and closed

**Hermetic, not live-tree.** `git clone --no-hardlinks` produced a full-history clone (the recorded
base `4d2b8f0` verified reachable — `git archive` was NOT usable here, because this gate's entire
left-hand side is a diff and an archive carries no history). A second directory held the **pre-fix**
build; the two build directories were verified to differ in **exactly one file**:

```
PRE  (saved):    f41ce0900c0263b590662db712839f6de87ff9ec2e08b05e0c953eab1f726786
HEAD (post-fix): 5ea83db727981e14fec3c6bb429a9c8961d728c6da4426c63ef7a28ca05b56ad
DIFFERS: check-diff-disposition.js          (and nothing else)
```

The plant is the reviewer's own case: delete `AGENTS.md:11` — `All work starts with the
Orchestrator: `agent-factory/roles/orchestrator.md`.`, a registry-anchored sentence — leaving the
claim registry untouched in that change. Both builds were pointed at the **identical** planted root
via `CHECK_ROOT`.

### PRE-FIX build, planted tree — the bypass

```
        38 watched file(s) changed since 4d2b8f0; 1881 changed clause(s) derived; 1532 disposition row(s) across 8 file(s)
  PASS  diff disposition: 0 findings over 1881/1881 elements

== Result ==
ALL CHECKS PASSED
PRE_EXIT=0
```

### POST-FIX build (committed HEAD), same planted tree — closed

```
        carriers: 44 change set(s) between 4d2b8f0 and the working tree, of which 10 touched a watched file and had their clauses derived; the uncommitted working tree IS a carrier
        38 watched file(s) changed since 4d2b8f0; 1881 changed clause(s) derived; 1532 disposition row(s) across 8 file(s)
  FAIL  diff disposition: 1 finding(s) over 1881 elements
        AGENTS.md:11 (removed) — FROZEN by registryAnchors: a claim-registry verbatim anchor, byte-compared live by scripts/check-claim-anchors.js
        clause: "all work starts with orchestrator agent factory roles orchestrator md"
        Carrier(s) that changed this clause: <working tree> — none of them touched the companion.
        Owed companion edit: docs/audit/28-claim-registry.md must change in the SAME commit as the clause — the commit that actually changed it, not merely somewhere in the range — or, for an uncommitted edit, in the same working-tree change set (Phase 28 / D-25).

== Result ==
1 CHECK(S) FAILED
POST_EXIT=1
```

The finding names the file, the clause, the registry-anchor source **and the carrier**.

### The live POSITIVE control — not a blanket refusal

The same deletion, with the registry touched in the **same working-tree change set**:

```
 M AGENTS.md
 M docs/audit/28-claim-registry.md
  PASS  diff disposition: 0 findings over 1881/1881 elements
== Result ==
ALL CHECKS PASSED
CONTROL_EXIT=0
```

### Measured effect on the REAL range

Re-derived at execution time through the gate's own exports (`changedClauses`, `deriveFrozenSet`,
`safetySurfaceUnion`, `attributeClauses`, `listCarriers`), with the base read from the base file
rather than typed:

```
$ node scratch/measure-final.mjs
recorded base (read from the base file, not typed): 4d2b8f079cc43d7d6184729966492789fb4dc05e
watched corpus: union entries = 41 | markdown watched = 40 | paths under scripts/ = 0
changed clauses in range: 1880
INTERSECTION registryAnchors        = 0
INTERSECTION positiveGuardLiterals  = 0
INTERSECTION structuralSections     = 192 (29-16 scope, untouched by this plan)
carriers: 44 | working tree is a carrier: true
attribution map entries: 1513 | carriers examined: 9
companions — registry: docs/audit/28-claim-registry.md | positive: [ 'scripts/check-foundation-guards.ts' ]
```

**Both arms measure ZERO — matching the planner's measured zero.** No finding is produced, nothing is
escalated, and no HALT was required. The recorded base was not moved and the corpus was not narrowed.

**The upper-bound caveat is kept visible.** These counts are raw `frozen.text` membership, whereas
the gate applies `region !== null → structuralSections` precedence **first** (`:1130`). The measured
numbers are therefore an **upper bound** on what each arm would actually see. Since both are 0, both
arms are genuinely 0 — but the caveat is recorded rather than dropped now that it happens to be
convenient.

**The watched corpus contains ZERO `scripts/` paths** (`safetySurfaceUnion()` → 41 entries, 40
markdown, 0 under `scripts/`), which is why this plan's own source edits produce no changed clause
and need no disposition row. Re-derived, not assumed.

### Adversarial self-check — the fix DISCRIMINATES

A green suite is not proof for a safety guard. `companionSatisfied` was temporarily mutated back to
the old range-wide semantics expressed in the new machinery
(`[...attribution.touched.values()].some(...)`), rebuilt, and the suite re-run:

```
     × a companion touched in an earlier commit does not satisfy a later frozen reword
     × a guard source touched in an earlier commit does not satisfy a later frozen reword
     × REDs an uncommitted frozen reword whose companion was touched in an earlier COMMIT
      Tests  3 failed | 28 passed (31)
```

Exactly the three cases that encode the per-carrier rule went red; **both same-commit controls stayed
green**. The mutation was reverted from a saved copy and verified by sha256
(`1d2fc1d4067c7f5b…`), with `git diff --stat` on both files empty afterwards.

### Four gates and the regression floor

```
check-foundation-guards.js   exit=0  (0s)
check-imperative-lexicon.js  exit=0  (0s)
check-banned-claims.js       exit=0  (0s)
check-diff-disposition.js    exit=0  (2s)      # re-run AFTER the .planning/ state writes

$ npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  51 passed (51)
      Tests  1743 passed | 2 skipped (1745)
   Duration  107.47s
REGRESSION_EXIT=0
```

Against 29-14's baseline of **51 files / 1732 passed / 2 skipped**: files unchanged, passed **+11** —
exactly the eleven new cases, skips unchanged. No test was removed or weakened. The plan's floor was
51 / 1725 / 2. The bare test script was never invoked; every run used `--exclude '**/scripts/e2e/**'`
or a single named file.

### Scope and cleanliness

```
$ git diff --stat 6c31d91..HEAD          # 29-14 closed at 6c31d91
 scripts/check-diff-disposition.js      | 306 ++++++---
 scripts/check-diff-disposition.test.ts | 524 ++++++++++++-
 scripts/check-diff-disposition.ts      | 387 +++++++++---
 3 files changed, 1123 insertions(+), 94 deletions(-)

$ git diff -- docs/audit/29-style-dispositions/00-base.md
(empty — 0 lines; the recorded base did not move)

$ git status --porcelain
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
```

Exactly the three files the plan names, and exactly the three pre-existing out-of-scope entries. **No
plant residue** — the reproduction lived entirely in a temp clone, so the live tree was never planted
into and no revert could be forgotten.

## Deviations from Plan

### Measured drifts against the plan's stated figures

The plan's numbers were measured before waves 13 and this round's plan commits landed. Both were
re-derived at execution time and the plan's are stale.

**1. [Rule 1 — stale measurement] The range is 41 commits, not 36.**

- **Derivation:** `git rev-list --count 4d2b8f07…..HEAD` → **41** at plan start (43 carriers at
  Task 2 time, 44 by Task 3, as this plan's own commits landed). The plan states 36.
- **Effect:** none on the verdict; it raises the per-carrier option's cost slightly, which is why the
  wall clock and carrier count are recorded. Exactly **one** commit in the range touches the registry
  (`7ec9173`, 29-07) and **zero** touch `scripts/check-foundation-guards.ts` — both as the plan says.

**2. [Rule 1 — stale measurement] 170 of 416 frozen entries were unprotected, not 42.**

- **Derivation:** `deriveFrozenSet()` groups the 416-entry frozen text map as
  `registryAnchors=170 | structuralSections=239 | positiveGuardLiterals=7`. The plan's "42" is the
  count of registry **anchors** (registry rows), not the count of **clauses** they expand to — one
  multi-clause verbatim contributes several. The blast radius of CR-02 on the registry arm was
  therefore 170 frozen clause entries.
- **Effect:** none on the fix; it makes the defect larger than stated, not smaller.

**3. [Recorded, not a deviation] The `region !== null` precedence caveat.**

The intersection counts reported above are raw `frozen.text` membership and are an **upper bound**,
because the gate resolves `structuralSections` positionally before consulting the text map. Kept
visible deliberately rather than dropped once both arms measured 0.

### Auto-fixed issues

**4. [Rule 1 — Bug] `state.advance-plan`, `roadmap.update-plan-progress` and `add-decision` all wrote
wrong counters.**

- **Issue:** `advance-plan` wrote `Plan: 15 of 19 complete — next 29-15` (its own plan, not the
  next). `roadmap.update-plan-progress` mangled the Plans line to
  `**Plans**: 14/19 plans executed — 14/19 executed; …` — wrong count *and* destroyed the original
  wording. `state.add-decision` then silently reverted `completed_plans` from 89 back to 88.
- **Fix:** corrected by hand to `Plan: 15 of 19 complete — next 29-16`, ROADMAP restored to
  `**Plans**: 19 plans — 15/19 executed; gap-closure round 1 adds 6 (29-14 .. 29-19, waves 13-18)`,
  and `completed_plans: 89` written **last**, after every tool write.
- **Derived, not guessed:** 66 (phase 27) + 8 (phase 28) + 15 (phase 29, including this plan) = **89**
  SUMMARY files on disk. `completed_phases` was **left at 2** (27 and 28 complete; 29 executing),
  which `percent: 25` = 2/8 confirms — 29-14's hand-correction to `3` is not supported by disk
  evidence and was not carried forward.
- **Files:** `.planning/STATE.md`, `.planning/ROADMAP.md`. Known GSD counter quirk, third occurrence
  in this phase.

**5. [Rule 2 — missing critical behaviour] Merge-commit carriers, handled and documented.**

`diff-tree -r` emits nothing for a merge, so a merge carrier touches no watched file and attributes
no clause. A change entering the range only through a merge is therefore unattributable and
**REFUSED by name**, never admitted — the safe direction. This repository's history is linear
(`git.branching_strategy: none`) so the case does not arise today; the reason is recorded at the
function rather than left for a later reader to rediscover.

**6. [Rule 2] Root-commit carriers.** `<sha>^` does not resolve on a root commit, which would have
thrown inside the carrier walk — and a gate that dies is not a gate that failed. `--root` on
`diff-tree` handles both cases in one invocation.

### Honest bookkeeping on which cases were proven red

| Case | Status |
|---|---|
| registry arm, three commits | **RED against the pre-fix build**, green after |
| positive-literal arm, three commits | **RED against the pre-fix build**, green after |
| unattributable frozen clause | **RED against the pre-fix build** (wrong wording), green after |
| registry same-commit control | **GREEN before and after** |
| guard-source same-commit control | **GREEN before and after** |
| empty attribution map; carrier-count line; working-tree carrier ×2 | written **after** the fix — pins, not bypass reproductions. Three of them were nonetheless shown to discriminate by the mutation run above; the carrier-count line case was not (it asserts output that did not exist pre-fix and could not have been run against it). |

### Residual, stated rather than hidden

The rule proves **co-change**, not semantic correspondence: a companion file touched in the same
commit satisfies the clause even if the touch is unrelated (this plan's own fixtures use an appended
comment). That is inherent to D-25's file-level pairing and is what the rejected `per-clause-pairing`
option would have addressed on the registry arm alone. Not a regression — the previous rule was
strictly weaker — but it is the honest ceiling of what this gate now proves.

### Threat register — dispositions honoured

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-29-45 | mitigate | Per-clause, per-carrier satisfaction; unattributable clauses refused by name; non-vacuity refusal above the loop. Two three-commit cases + two same-commit controls + a mutation run proving discrimination |
| T-29-46 | mitigate | Every invocation through the single array-form wrapper, no shell; `--` kept between revisions and paths on every diff; the base stays in the canonical 40-char form; `WORKING_TREE_CARRIER`'s angle brackets keep the sentinel outside the SHA form so it can never land in a revision position |
| T-29-47 | mitigate | Touched-file set read once and intersected with the corpus before any clause derivation: 43 carriers, **9** examined. No cap. Carrier count published; wall clock 1.04s → 1.67s recorded |
| T-29-48 | accept | Findings quote public kit prose; no secret in the corpus |
| T-29-49 | mitigate | `npm run build` in the same task as the source edit, `.js` committed with `.ts`, freshness 48/48, second build idempotent |
| T-29-SC | accept | Zero packages installed; `package.json` untouched and not in `files_modified` |

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced. No test was
skipped and every `<verify>` in the plan was run.

## Threat Flags

None. This plan adds no network endpoint, auth path or schema at a trust boundary. It adds read-only
`git` invocations (`rev-list`, `diff-tree`, `status`, `ls-files`) through the module's existing
single array-form wrapper, on the same trust boundary the gate already crossed.

## Verification Against the Plan

| Plan verification item | Result |
|---|---|
| Both three-commit cases exit 1 after, exited 0 before | PASS — transcripts recorded verbatim |
| Both same-commit controls exit 0 throughout | PASS — green in the pre-fix run and after |
| The range-wide changed-file list is deleted, not bypassed | PASS — 0 non-comment in `.ts`, 0 in committed `.js` |
| Unattributable clause reported with wording distinct from a missing companion | PASS — `NO CARRIER FOUND`, pinned by two separate cases |
| The gate prints its carrier count and the working-tree carrier's presence | PASS — `carriers: 43 … the uncommitted working tree IS a carrier` |
| Live-range intersection counts measured; non-zero halts | PASS — both **0**, matching the planner; nothing to escalate |
| Recorded base and watched corpus byte-unchanged | PASS — base diff empty; corpus re-derived at 41/40/0 |
| Four gates exit 0; regression, typecheck, freshness exit 0 | PASS — 0/0/0/0; 51 files / 1743 passed / 2 skipped; 48/48 fresh |
| `git status --porcelain` lists exactly the three pre-existing entries | PASS |

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — three-commit harness, RED | `24513a4` | `scripts/check-diff-disposition.test.ts` |
| 2 — CR-02, both arms, per-carrier | `8c4d5b0` | `scripts/check-diff-disposition.ts`, `.js`, `.test.ts` |
| 3 — reproduction, measurement, regression floor | (no source change; recorded here) | — |

## Self-Check

- `scripts/check-diff-disposition.ts` — FOUND (`WORKING_TREE_CARRIER`, `listCarriers`,
  `carrierFilesTouched`, `attributeClauses`, `companionSatisfied`, `REGISTRY_COMPANION` all present;
  `allChangedFiles` 0 non-comment)
- `scripts/check-diff-disposition.js` — FOUND (rebuilt, freshness 48/48, `allChangedFiles` count 0)
- `scripts/check-diff-disposition.test.ts` — FOUND (31 tests, 11 new)
- commit `24513a4` — FOUND
- commit `8c4d5b0` — FOUND

## Self-Check: PASSED
