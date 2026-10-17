---
phase: 31-autonomous-manual-testing
plan: 41
subsystem: shared-verified-context
status: complete
tags: [gap-closure, round-9, write-path, residual-register, workflow-prose, WR-39, WR-40, WR-42, D-41]

requires:
  - "31-39 (D-39): actionOwnerRoot, the discriminated ActionOwner, the dial/record parameter split, ADMIT_FROZEN_SHA256 re-based to bb920698…81cd"
  - "31-40 (D-40): ROOT_DIVERGENCE_DISPOSITIONS and the derived root-argument census, which is what bounds R-31-33-01's remaining half"
provides:
  - "WRITE_PATH_RESIDUALS at 9 members, every one paired with a probe that DRIVES it"
  - "R-31-33-01 re-worded into a CLOSED half and a REMAINING half under one id"
  - "R-31-33-02 re-stated per branch against the post-31-39 tree"
  - "R-31-41-01: the widened refusal at promoteAdmitted's fall-through, with the shared-install answer MEASURED"
  - "R-31-41-02: the lean-retention scope D-39 (3) took"
  - "18-context-compaction.md's ledger paragraph, per route and per branch, with every residual named inline"
  - "the destination decline as a stop condition, reconciling the imperative restatement with the paragraph"
  - "D-41 in 31-CONTEXT.md"
affects:
  - "scripts/context-io.ts's exported contract (two new register members, two re-worded)"
  - "scripts/checkpoints.ts's WORKFLOW_STOP_BULLET_COUNT (42 -> 43)"

tech-stack:
  added: []
  patterns:
    - "a register's two-sided id binding is not a claim check — a THIRD side pairs each member with a probe that takes a reading"
    - "where a mechanism has branches, a claim about all of them is falsified by one; state it per branch"
    - "a section-anchored prose locator's SCOPE is asserted by a planted decoy, never read off the code"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-41.md
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-41-task1-red.json
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "D-41 (1): a claim is corrected by moving the mechanism where it can move, and by stating it PER BRANCH where it cannot — D-34's unstated second half"
  - "D-41 (2): the fourth false sentence was the DISCLOSURE itself; 31-33's publication of R-31-33-01 went stale in the round that closed what it disclosed"
  - "D-41 (3): the register gains a THIRD side — a probe per member — because two-sidedness asks whether a member is DISPOSITIONED, never whether it is TRUE"
  - "D-41 (4): the binding case's locator SCOPE is asserted by a planted decoy block, not read off the code"
  - "D-41 (5): the frozen `## Stop conditions` section is reconciled with the paragraph, each added clause carrying a companion cell"
  - "WR-42's reasoning was measured WRONG: the shared-install kit-side store DOES resolve, because copyKit copies the in-kit configuration"

requirements-completed: []

metrics:
  duration: "1h 30m"
  completed: 2026-09-13
  tasks: 3
  files: 13

actuals:
  tokens: 71000
  tasks: 3
  commits: 5

plan_head_before: 686b70e99333c2012fadb2137280b44103a6aa9d

coverage:
  - deliverable: "R-31-33-01 split into a closed half and a remaining half, each with its own measurement"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#R-31-33-01's REMAINING half (31-41): the ledger owner is a PARAMETER, and an explicit one still splits"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#R-31-33-01's published shape AGREES with the reading its probe takes"
        status: pass
    human_judgment: false
  - deliverable: "R-31-33-02 re-stated per branch against the post-31-39 tree, keeping the measured coincidence"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#POSITION 4 (the DEFAULT arguments): MEASURED, and recorded as R-31-33-02 rather than claimed closed"
        status: pass
    human_judgment: false
  - deliverable: "R-31-41-01 — the widened refusal, with the shared-install shape measured and its reachability derived"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#the three readings are taken against a kit home the COMMITTED installer created"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#the CONTROL discriminates: without the in-kit configuration the same store is refused BY NAME"
        status: pass
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#REACHABILITY (31-41, WR-42): the re-binding route's callers forward the destination, so a kit-side store is expressible"
        status: pass
    human_judgment: false
  - deliverable: "R-31-41-02 — the lean-retention scope, measured on both sides"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#R-31-41-02's published shape AGREES with the reading its probe takes"
        status: pass
    human_judgment: false
  - deliverable: "the two-sided binding grown to 9, watched failing in BOTH directions against confirmed mirrors"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition"
        status: pass
    human_judgment: false
  - deliverable: "the ledger paragraph rewritten per route and per branch, with every residual named inline"
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#the paragraph states each BRANCH's answer, and asserts no property of every route (31-41)"
        status: pass
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#every DERIVED note-then-ledger route is NAMED in the paragraph"
        status: pass
    human_judgment: false
  - deliverable: "the binding case's locator scope, asserted by a planted decoy rather than read"
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#LOCATOR SCOPE: a decoy block planted AFTER the section does not enter the paragraph (31-41)"
        status: pass
    human_judgment: false
  - deliverable: "the imperative restatement reconciled with the paragraph"
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#the imperative restatement AGREES with the paragraph: the destination decline has a stop condition"
        status: pass
    human_judgment: false
  - deliverable: "a disposition row per changed clause, with the standing debt unmoved"
    verification:
      - kind: command
        ref: "npm run check:diff-disposition — 78 -> 102 -> 78 finding(s) over 39 elements"
        status: pass
    human_judgment: true
    rationale: "The gate proves every clause was dispositioned or refused; whether a reworded stop condition still withholds the same permission is the named-human read LANG-03 requires."
---

# Phase 31 Plan 41: Every published claim about the write path, equal to what the write path does

Four published artefacts described a mechanism that is not in the tree — three sentences of
`18-context-compaction.md`'s ledger paragraph, a disclosure sentence beside them, and the residual
`R-31-33-02` — and the register that was supposed to catch that asks only whether a member is
*dispositioned*, never whether it is *true*. This plan re-states every claim per route and per
branch, pairs every register member with a probe that takes a reading, and measures the one shape
round 8 left `UNKNOWN - verify`.

## What this plan did

| Task | What landed | Commit |
|---|---|---|
| 1 (RED) | The probe pairing, the two converse mirrors, `R-31-33-01`'s remaining-half reproduction, `R-31-33-02`'s re-wording binding, and both halves of the shared-install measurement | `d96c93c` |
| 1 (GREEN) | `R-31-33-01` and `R-31-33-02` re-worded; `R-31-41-01` and `R-31-41-02` added; `31-CONTEXT.md`'s written dispositions | `94aec96` |
| 2 | The register's own prose read as two call sites on a derived axis — fixed on the prose side, the axis's input boundary disclosed | `1ac7c95` |
| 3 | The ledger paragraph per route and per branch, the stop condition, the locator-scope mirror, the disposition rows, `D-41` | `84d5369` |
| 3 (follow-on) | `WORKFLOW_STOP_BULLET_COUNT` 42 → 43, with the tagging list re-walked | `5fa16c2` |

## The measurements, taken BEFORE any re-wording

Every reading below was taken against the committed `scripts/context-io.js` under a scratch root
outside the repository tree, with each governance root's premise (`governanceRootOf(store) === root`)
asserted before any result was read.

### READING A — the no-argument defaults (`R-31-33-02`, `WR-39`)

```
DEFAULT_CONTEXT_ROOT       = <repo>/.grugops/context
governanceRootOf(default)  = <repo>
trustedRepoRoot()          = <repo>
actionOwnerRoot(default)   = { answered: true, root: <repo> }
```

**The two defaults COINCIDE on this box**, so the split is not observable here — the fact the
existing entry recorded, and the one a re-wording would most easily drop. What the reading also
shows is that the entry's published sentence is **false about the mechanism**: it said the GOV-02
event lands under `trustedRepoRoot()`, and after `31-39` the record follows
`actionOwnerRoot(contextRoot)` — the store's own owner — on every branch. What still reads
`trustedRepoRoot()` is the **dial**, which is `WR-10` working as decided.

### READING B — `R-31-33-01`'s two named shapes, and the one that remains

| Drive | Note lands | Record lands | Verdict |
|---|---|---|---|
| `appendNote`, store = HOME, dial = ELSEWHERE | HOME `notes:1` | HOME `ledger:1`, ELSEWHERE `ABSENT` | **CLOSED** |
| `admitAndAppend` non-gated, store = HOME, dial = ELSEWHERE | HOME `notes:1` | HOME `ledger:2`, ELSEWHERE `ABSENT` | **CLOSED** |
| `appendNote`, store = H2, dial = H2, **explicit** ledger owner naming E2 | H2 `notes:1` | H2 `ABSENT`, E2 `ledger:1` | **REMAINS** |

The separation that closed the first two **created** the third: the ledger owner is a parameter now,
and a parameter is a value a caller may supply. It is not silent — the `31-40` census reads that
argument position — but it is a freedom, and it is stated with its own reproduction rather than
inherited by implication.

### READING C — the widened refusal (`WR-42`)

`promoteAdmitted`'s fall-through, with a **bare directory** destination and with a **store-shaped**
directory outside every governed repository: both `DECLINED (destination-outside-governed-store)`.
Re-measured across dial retention values: refused by name under both `git` and `retained`, so the
refusal is **retention-independent on this route** — the fact the new stop condition states.

### READING D — the lean-retention scope (`R-31-41-02`)

`appendNote` into a store-shaped directory outside every governed repository:

```
audit_retention: git        -> WROTE, notes=1, no ledger in ANY root, no refusal
audit_retention: retained   -> REFUSED (destination-outside-governed-store)
```

This is `D-39 (3)`'s deliberate scope, measured on both sides. It had no register member.

## The shared-install measurement (`WR-42`'s `UNKNOWN - verify`) — and the review's reasoning was wrong

`WR-42` reasoned that a kit-side store at `~/.grugops/.grugops/context` "has no governance
configuration and no VCS marker written by `install/install.ts`", so `governanceRootOf` "would answer
`null` there and every promotion into it would throw".

**Driven against a kit home the COMMITTED `install/install.js` created** (`GRUGOPS_SRC` = this repo,
`GRUGOPS_HOME` = `<scratch>/.grugops`, `TARGET` = `<scratch>/hostrepo`, `HOME` = `<scratch>`):

| Reading | Value |
|---|---|
| kit home contents after install | exactly `agent-factory/` |
| `agent-factory/config/factory.config.json` under the kit home | **present** (the `in-kit` published candidate) |
| `.grugops/factory.config.json` under the kit home | absent |
| `scripts/context-io.js` under the kit home | **absent** — the installer materializes no writer there |
| a context store under either root | **absent** — the installer creates none |
| **READING 1** `governanceRootOf(<kit>/.grugops/context)` | **`<kit home>`**, not `null` |
| **READING 2** the root-anchoring conjunct | **true** |
| **READING 3** `promoteAdmitted(to = kit-side store)` | **ACCEPTED** |
| **CONTROL** the same, with the in-kit configuration removed | resolver `null`; the identical promotion `refused-by-name` |

`copyKit` copies the source's `agent-factory/` tree to `resolve(GRUGOPS_HOME, "agent-factory")`, and
that tree carries `config/factory.config.json` — which relative to the kit home is the `in-kit`
position of `governanceConfigCandidates`. The upward walk remembers it as `nearest`, the home
directory ends the walk without answering as a repository, and `nearest` is returned. **So the
widened refusal does not fire on the shipped shared-install shape**, and the control shows the
positive reading is attributable to that one file rather than to the walk.

### The reachability half, DERIVED rather than re-implemented

`deriveRouteCallers("promoteAdmitted", "context-io.js")` — the existing cross-file derivation, reused
in place rather than written a second time — returns **1** caller: `scripts/compactor.ts::promoteAdmitted`.
Reading its declaration: the destination it supplies is its own sixth parameter, forwarded unchanged
with no default and no constraint. **Cardinality 1, and 1 of 1 forwards.** So a kit-side destination
is *expressible* by a host workflow, and would arrive as a new caller rather than as a changed
constraint — which is what `R-31-41-01`'s closing criterion names.

## The register, before and after

| Member | Before | After |
|---|---|---|
| `R-31-21-01` … `R-31-29-01` | 5 members, unchanged | unchanged, each now paired with a probe |
| `R-31-33-01` | one text, closure recorded, remaining half implied | **two halves under one id**, each with its own measurement; closing criterion re-pointed at an unmet one |
| `R-31-33-02` | published the pre-`31-39` mechanism | **per branch**, against this tree, coincidence kept, decision as open as it was |
| `R-31-41-01` | — | **NEW** — the widened refusal, with the shared-install answer |
| `R-31-41-02` | — | **NEW** — `D-39 (3)`'s scope, measured on both sides |
| **cardinality** | 7 | **9**, asserted separately |

### The third side, and why two were not enough

The binding `31-29` installed asserts every member is *dispositioned* — a question about two id
sets. It never asks whether any member is *true*, which is how `R-31-33-02` published a departed
mechanism through two rounds with the binding green, the cardinality asserted and a seeded control
passing. Each member now carries a **probe** that takes a reading at run time; the reading is
asserted to agree with the fact the member's text states; and the probe table is bound to the
register in both directions with a cardinality.

Six of the nine probes already passed at the RED base, against the members that existed. One probe
was **corrected during RED**, not weakened: `R-31-21-03`'s first draft looked for the read-side
clause constant, and the reading the module actually emits at that position is *"refused rather than
waited on"* plus the canonical form — which is the residual's own property (a ledger append that
BLOCKED) rather than a clause key that never reaches that message.

### Both directions watched failing, each mirror confirmed different first

| Mirror | Built by | Live reading | Mirror reading |
|---|---|---|---|
| `31-CONTEXT.md` minus one written disposition | replacing `` `R-31-41-01` `` with a non-matching id | no orphaned member | orphaned member `["R-31-41-01"]` |
| the register minus one member | filtering `R-31-41-02` out of the exported id list | no orphaned disposition | orphaned disposition `["R-31-41-02"]` |

The pre-existing seeded control appended an id that was never real and watched **one** direction; a
deleted disposition leaving a cited id dangling is the failure this register's own docstring names
first, and no case drove it.

## The ledger paragraph, per route and per branch

### Every changed clause, with its disposition row

All 24 added clauses are rowed in `docs/audit/29-style-dispositions/31-41.md`, seven columns in the
README's order. The four deletions that matter:

| Deleted | Why it had to go |
|---|---|
| `Each route derives the owning repository from the context store it writes the note into.` | A universal over routes; round 8 measured it false at `admitAndAppend`'s gated branch whenever the store is ungoverned. |
| `Both halves of the action key on that one answer.` | Subject is "the action" — every action on every route. |
| `The derivation sits at the route's entry, above every branch that route takes.` | Quantified over branches; false at the non-gated branch always. |
| `An ordinary admission carrying no human disposition records itself in the repository whose dial admitted it.` | **The disclosure itself went stale.** It was `31-33`'s honest publication of `R-31-33-01`, and `31-39` closed the shape it disclosed — the non-gated branch now records itself in the repository its own STORE derives. |

The four statements that replace them, one per branch, each saying where the note lands, where the
record lands, what decides it, and what happens when the owner cannot be named:

- the re-binding route's **gated arm** — resolves at entry, writes both halves there, refuses by name
  a destination it cannot resolve;
- the re-binding route's **fall-through** — carries the same answer into a new admission; the same
  refusal fires; `R-31-41-01` records what the input set grew to;
- the admit-then-persist route's **gated branch** — resolves at entry, writes both halves there;
  an owner it cannot name refuses the admission *where a record would be written*;
- the admit-then-persist route's **non-gated branch** — hands the same answer to the admission
  authority; `R-31-33-01` records what remains.

The order guarantee and the over-record asymmetry are carried forward in substance. The only
quantified sentence left is a **negative** over the two just-enumerated routes — *"Neither route lets
it decide where a record lands"* — falsifiable at any one of the four branches and measured at all
four. Four residual ids are named inline at the sentences they qualify.

### The imperative restatement, reconciled

`## Stop conditions` was **silent** about the one decline every path of the re-binding route raises.
A reader following only the stop conditions would not know to stop for it — the same
claim-outruns-mechanism defect at a smaller scale. One bullet added, with its remedy, the forgery
price it points at, and each route's scope. The section is FROZEN by heading, so each of its five
added clauses carries a `companion` cell naming the section and the reason, per the directory's own
contract.

### The locator's SCOPE, asserted rather than read

`traceUpdatesParagraph()` anchors at `## Trace updates` and ends at the next `\n## `. That *looks*
bounded — and "it looks bounded" is a reading of the code, which is exactly how a Phase 29 fence
reader came to adopt an unrelated later block. The locator is now parameterized over text, and a
decoy block carrying **route-shaped prose and a fabricated residual id** is planted after the section
in a mirror **confirmed different from the live file before any result is read**. The case reads the
intended block: the decoy's `someOtherRoute` and `R-31-99-99` are both absent from the located
paragraph, and the mirror's paragraph is byte-equal to the live one.

## Verification

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **66 files, 4305 passed, 2 skipped, exit 0** |
| `npx vitest run … scripts/context-io.test.ts` | 660 passed |
| `npx vitest run … scripts/context-io-writer-set.test.ts` | 195 passed |
| `npx vitest run … install/install.test.ts` | passed (with the two above: 988 passed, 1 skipped) |
| `npm run check:residual-citations` | exit 0 — 5 path claims across 2 published rows, every one a tracked file |
| `npm run check:audit-register` | exit 0 — all four equalities hold |
| `npm run check:claim-anchors` | exit 0 — 47 rows, 47 byte-identical comparisons |
| `npm run check:banned-claims` | exit 0 |
| `npm run check:imperative-lexicon` | exit 0 |
| `npm run check:public-docs` | exit 0 |
| `npm run check:nul-bytes` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build && npm run check:build-parity` | exit 0 — no tracked build output moved |
| `npm run freshness` | exit 0 — all 61 committed `.js` match a rebuild |
| `npm run check:diff-disposition` | **78 finding(s) over 39 elements — the standing debt, unmoved.** Measured 78 → 102 → 78. Exit 1, pre-existing since `31-31`. |

`.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` are **byte-unchanged** by this plan
(`git diff --quiet` over the plan's whole commit range). `UATX-01` through `UATX-06` are unchecked
and every traceability row still reads `Gaps Found`.

## Deviations from Plan

### [Rule 1 - Bug] The register's own prose read as two call sites on a derived axis

- **Found during:** Task 2's verification, after Task 1's GREEN commit.
- **Issue:** `R-31-33-01`'s new reproductions spelled `appendNote(` inside string literals.
  `EXPECTED_APPEND_NOTE_CALL_SITES` counts `/appendNote\(/g` over source **text**, so the count moved
  **6 → 8**. Two comments raised a real red.
- **Fix:** reworded on the prose side — the reproductions now name the writer without the open
  parenthesis — and the count returned to **6** with no constant bumped and no assertion weakened.
- **Disclosed rather than converted:** the axis's INPUT boundary (a sentence can express a false
  positive, where the syntax-tree axes `31-40` built cannot) is recorded in `deferred-items.md` with
  its coordinate, its owner and what would force it closed. Converting it is a change to a derived
  axis this plan was not convened to move.
- **Commit:** `1ac7c95`.

### [Rule 3 - Blocker] The stop-bullet cardinality anchor moved with the reconciled section

- **Found during:** Task 3's full-suite run.
- **Issue:** adding one stop condition moved the two-sided `WORKFLOW_STOP_BULLET_COUNT` axis
  **42 → 43**. `scripts/checkpoints.ts` is not in the plan's `files_modified`; the axis caught a
  number the plan did not name, which is what its two-sidedness is for.
- **Fix:** bumped to 43 **and re-walked the tagging list**, per the anchor's own contract. The new
  bullet is a stop-and-fix whose remedy is stated in the bullet itself, so it hands to no human,
  carries no `checkpoint:` tag, and the checkpoint roster is unchanged. The reason it moved is
  recorded at the constant in the shape the previous two moves used. `scripts/checkpoints.test.ts`:
  147 passed.
- **Commit:** `5fa16c2`.

### [Rule 1 - Bug] Two `31-29`/`31-33` cases pinned the deleted sentences

- **Found during:** Task 3's full-suite run.
- **Issue:** `31-29 — the two workflow sentences are TRUE of the mechanism` asserted the three
  universals and the joined order sentence verbatim.
- **Fix:** re-pointed **deliberately** at the per-branch statements, with the reason written into the
  case. The property they exist to assert is unchanged and is now asserted four times, at the
  granularity where it is true. One comma was removed from the new prose so the pre-existing
  `refused by name before anything is written` assertion keeps its subject rather than being edited
  around. `scripts/context-io-writer-set.test.ts` asserts the three deleted universals are ABSENT, so
  they cannot return without turning that case red.
- **Commit:** `84d5369`.

### Task sequencing note (not a deviation in substance)

Task 2's two cases shipped inside Task 1's RED commit. Both edit `scripts/context-io.test.ts`, and
the shared-install measurement is what **decided** `R-31-41-01`'s text — writing the register entry
before its own measurement would have been the move this plan exists to remove. Task 2's reachability
case lives in `scripts/context-io-writer-set.test.ts` because the cross-file caller derivation it
must REUSE lives there; re-implementing it in the sibling file would have been two statements of one
question.

## Authentication Gates

None.

## TDD

`TDD_MODE=false`; `TDD_APPLICABLE=true`. Task 1 committed RED before GREEN.

- **RED:** `d96c93c` — 9 failed | 843 passed. Every failure names a register member that does not
  exist yet or a re-worded clause that is not there yet. 843 passing in the same run, including both
  halves of this plan's own measurement work and six of the nine probes against existing members —
  so the files parse, discover their tests and run them.
- **GREEN:** `94aec96`.
- **The red-evidence gate was ATTEMPTED and its MEASURED verdict recorded, not a fabricated one.**
  `gsd-tools check tdd-red-evidence` returns `INVALID_RED (invalid_record)` on this record. Two
  harness facts, both measured: the gate expects a **singular** `target_test` and a parseable
  top-level `exit_code`, and this phase has recorded a `target_tests` **array** since `31-35` because
  every RED here fails a set of cases; and even with a conforming record the transcript is unreadable
  to it, because `npx vitest run --reporter=tap` emits no `# tests` summary line
  (`grep -c '^# tests'` = **0** on this run's own transcript).
- **A discrepancy with the prior record is logged rather than resolved.** `31-40-task1-red.json`
  records this gate returning `zero_tests_discovered`. Re-run today against that same file it returns
  `invalid_record` — the schema arm fires first. The earlier record is left as written and the
  difference is recorded in this plan's evidence file, because a harness record is evidence about a
  run and not a standing claim.

## What this plan leaves OPEN, with a reason and what would force it closed

| Open item | Why it is open | What would force it closed |
|---|---|---|
| `R-31-33-01`'s REMAINING half — the ledger owner is a parameter, and an explicit one still splits | The freedom the `31-39` closure cost. Bounded by the `31-40` census, which reads that argument position, so a new diverging site must earn a register entry. | Removing the parameter from `appendNote`, whose one in-module caller passes a value identical to the default — expressible there, and NOT at `admit()`, where `admitAndAppend`'s non-gated branch genuinely needs an owner its dial root does not answer. A signature change to a byte-frozen authority is a dated decision. |
| `R-31-33-02` — the DEFAULT split | Unchanged and re-worded, not closed. On this box the two defaults coincide; under shared install the dial reads the host while the write follows the kit. | A dated decision naming ONE repository as the default owner of the shared verified context, applied to readers' and writers' defaults in the same change, with `WR-10` restated against it. |
| `R-31-41-02` — the lean-retention scope | `D-39 (3)`'s deliberate scope. Nothing lands in the wrong repository because nothing is recorded; what is open is that a note can sit in a store this module cannot attribute, with no surface saying so at write time. | A decision that attribution is a precondition of writing at all — the unscoped refusal `D-34` priced at 121 + 26 call sites and rejected. A cheaper partial: `render` reporting an unattributable store the way it reports a skipped entry. |
| `EXPECTED_APPEND_NOTE_CALL_SITES` counts TEXT, not calls | Raised by this plan's own prose and fixed on the prose side. Converting it is a change to a derived axis this plan was not convened to move. | The axis parsing its corpus with `ts.createSourceFile` and counting call expressions whose callee is `appendNote`, with the seeded mirror re-pointed at a real call. Recorded in `deferred-items.md` with an owner. |
| `T-31-18-01` / `T-31-39-04` — a destination's CONTENTS are not authenticated | Pre-existing and priced per position (`D-31`). Now named INLINE in the new stop condition's remedy, so a reader meets the price at the sentence that could otherwise read as permission. | A trust decision about destination provenance that does not rest on filesystem shape. |
| `check:diff-disposition` at 78 findings over 39 elements | Pre-existing, recorded across `31-31`…`31-40`, unmoved by this plan. Measured 78 → 102 → 78. | Its own plan. The base commit must not be moved forward and the clause comparison must not be loosened — both clear a finding by deleting its evidence. |
| `R-03` — the Windows leg | This phase's standing remainder. Every reading here was taken on darwin, including the installer run. | A Windows CI lane, which is a phase-level decision. |
| `UATX-01` … `UATX-06` remain UNCHECKED; every traceability row still reads `Gaps Found` | This is a gap-closure plan. Only a verification round may flip a requirement, and this phase has had eight rounds in which the executing round believed it had closed one. | A ninth verification round that independently reproduces, or fails to reproduce, the shapes this plan claims to have corrected. |

## What this plan does NOT claim

- **It changes no write-path behaviour.** No branch, no refusal, no parameter and no default moves.
  Every production change it rests on landed in `31-39`. What changes is what is SAID about them, and
  what a test can falsify about what is said.
- **A green probe pairing is not proof that a residual is well chosen.** It is proof that a published
  shape and an observed reading agree. Whether the shape is the right boundary to publish is a
  judgement no gate reaches.
- **It does not make an agent read the workflow.** Every role points at this file, and nothing in
  this kit can make an agent obey a pointer.

## Next

Ready for `31-42`.

## Self-Check: PASSED

- All `key-files.created` and `key-files.modified` exist on disk.
- All five commits exist in `git log`: `d96c93c`, `94aec96`, `1ac7c95`, `84d5369`, `5fa16c2`.
- `git rev-list --count 686b70e..HEAD` = **5**, MEASURED at SUMMARY-write time, before this file's
  own commit. A reader re-running after that commit gets **6**; the difference is this commit, and
  the instrument point is stated so the two readings can be told apart rather than reconciled by
  preference.
- Exactly **one** `D-41` heading exists in `31-CONTEXT.md`.
- Full suite re-run at the final committed tree: **66 files, 4305 passed, 2 skipped, exit 0**.
- Every plan-level `<verification>` command was re-run and its result is recorded in the table above,
  including the one that exits non-zero on a pre-existing, unmoved standing debt.
