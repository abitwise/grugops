# Phase 30: Per-Checkpoint Autonomy Matrix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-05
**Phase:** 30-per-checkpoint-autonomy-matrix
**Areas discussed:** Checkpoint set & which floors, Two keys / notify / trace, Reader collapse + test_integrity, Guarantees render & banner, Red-team budgeting

---

## Checkpoint set & which floors

| Option | Description | Selected |
|---|---|---|
| Tagged bullets, two-sided | Explicit `checkpoint: <id>` tag per real stop; parser derives the set; roster must equal it exactly | ✓ |
| Parse every bullet as a checkpoint | No tags; noisy, every wording edit changes the set | |
| Hand-listed roster + count assertion | Roster is authority; the set-literal drift class Phase 27 fought | |

| Option | Description | Selected |
|---|---|---|
| SAFETY_FLOORS is canonical | floor-invariance invariants recorded as non-dialable test properties, out of the matrix | ✓ |
| Union of both lists | refuse-self / no-fabrication become dialable | |
| Reconcile into one new list | rewrite both; touches registry depends_on | |

| Option | Description | Selected |
|---|---|---|
| Retire `autonomy`; remap registry rows | scalar refused by validator if present | ✓ |
| Keep `autonomy` as a checkpoint id | preserves the join, name no longer describes a stop | |
| Keep scalar alongside matrix | two authorities | |

| Option | Description | Selected |
|---|---|---|
| Every checkpoint ternary, floors need key two | uniform rule | ✓ |
| Floors are block-only | contradicts AUTO-03 | |

Follow-up round:

| Option | Description | Selected |
|---|---|---|
| Trailing backticked tag (canonical form, refuse otherwise) | | ✓ |
| HTML comment on the bullet line | | |
| Separate frontmatter list per role | | |

| Option | Description | Selected |
|---|---|---|
| snake_case verb-noun, global ids | | ✓ |
| Prefixed by owner | | |

| Option | Description | Selected |
|---|---|---|
| Two checkpoints: commit_to_branch, open_pr | legacy diff/branch/pr map mechanically | ✓ |
| Drop the grades entirely | | |
| You decide | | |

| Option | Description | Selected |
|---|---|---|
| One id, N sites, roster records site count | id→sites map also asserted | ✓ |
| One id, sites unchecked | | |

**User's choice:** all recommended options.
**Notes:** none.

---

## Two keys, notify, trace

| Option | Description | Selected |
|---|---|---|
| Flat `checkpoints: { id: value }` object | unknown id refused + gated as block | ✓ |
| Nested by tier | | |
| You decide | | |

| Option | Description | Selected |
|---|---|---|
| Per-floor `GRUGOPS_FLOOR_<ID>=<name>` | same-command self-approval refused | ✓ |
| One var listing granted floors | edges toward blanket grant | |
| Signed token file outside the repo | | |

| Option | Description | Selected |
|---|---|---|
| Gate as block, name the missing key, record it | | ✓ |
| Gate as block, silent | | |
| Refuse the whole run | | |

| Option | Description | Selected |
|---|---|---|
| Allow + shared-context note + banner line | | ✓ |
| Allow + stderr only | | |
| Ask (Claude Code permission prompt) | host semantics diverge | |

**User's choice:** all recommended options; "Next area" without follow-ups.

---

## Reader collapse + test_integrity

| Option | Description | Selected |
|---|---|---|
| model-tiers.ts third reader out of scope, disclosed | comment + reader-count test | ✓ |
| Fold it into the single reader | reopens 29.1/29.2 | |
| Fold it as a follow-up phase | | |

| Option | Description | Selected |
|---|---|---|
| admit() refuses write, degrades to UNKNOWN - verify | | ✓ |
| Throw | | |

| Option | Description | Selected |
|---|---|---|
| Explicit argument from the gate run | signature change deliberate | ✓ |
| emitVerdict re-reads the gate log | second parser in a safety path | |
| You decide | | |

| Option | Description | Selected |
|---|---|---|
| Emit nothing; finding stays UNKNOWN - verify | | ✓ |
| Emit an explicit RED verdict note | | |

**User's choice:** all recommended options; "Next area".

---

## Guarantees render & banner

| Option | Description | Selected |
|---|---|---|
| New `docs/GUARANTEES.md` + one anchored pointer line per public doc | | ✓ |
| Generated section inside README and AGENTS.md | | |
| You decide | | |

| Option | Description | Selected |
|---|---|---|
| Replace the anchored sentence with a generated disclosure | registry status `dropped` | ✓ |
| Delete the sentence and the anchor | breaks bijection | |
| Strike-through | voice rule | |

| Option | Description | Selected |
|---|---|---|
| Every hook denial or notify | | ✓ |
| Gate run (workflow 05) header | | ✓ |
| `/grug` session start | | |
| Install `--check` doctor | | |

| Option | Description | Selected |
|---|---|---|
| One fixed line: 'all checkpoints at default' | | ✓ |
| Nothing when all defaults | | |

**User's choice:** as marked; "Wrap up".

---

## Red-team budgeting

| Option | Description | Selected |
|---|---|---|
| Two surfaces: (A) two-key hook + emitVerdict, (B) rest | A after B's set is green | ✓ |
| One surface | | |
| Three surfaces | | |

| Option | Description | Selected |
|---|---|---|
| Cap 4 per surface, then D-58-style fence | | ✓ |
| No cap | | |
| Cap 6 | | |

| Option | Description | Selected |
|---|---|---|
| Structural fix + mirror repro + 2 independent red-teams | | ✓ |
| Structural fix + mirror repro | | |

| Option | Description | Selected |
|---|---|---|
| Unfreeze once, re-freeze in the same commit | D-04 companion | ✓ |
| Move two-key logic to a new hook file | two authorities | |

**User's choice:** all recommended options; "I'm ready for context".

## Claude's Discretion

- `off` on a floor needs the same env var as `notify`.
- Non-hook hosts keep the documentary tier, disclosed.
- Banner line format, notify note body layout, render at install `--check`, migration note location.

## Deferred Ideas

- Fold the `model-tiers.ts` reader into the single governance reader.
- Banner at `/grug` start and in the install doctor.
- Interactive `permissionDecision: ask` tier on Claude Code.
- Matcher-completeness over untagged Stop conditions prose.
