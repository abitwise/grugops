# Plan 40-01 — D-30 disposition base move and role-rule stand-in

This plan moves the recorded base commit of the Phase 29 diff-disposition gate
(`scripts/check-diff-disposition.js`) once, by a recorded decision, and adds one declared arm to that
gate: for files under `agent-factory/roles/`, the derived role-rule inventory check
(`scripts/check-role-rules.js`, decision D-27) stands in for per-clause disposition rows. Nothing else
about the gate changes. This file is the record of what the move retires, so the move does not delete
evidence silently.

## THE DECISION: D-30, quoted verbatim from 40-CONTEXT.md

> **D-30:** **Diff-disposition gate (Phase 29, `scripts/check-diff-disposition.ts`):** record a
> decision that moves `docs/audit/29-style-dispositions/00-base.md` to the commit just before Phase
> 40, and that **for role files the role-rule inventory guard stands in for per-clause disposition
> rows** during this rewrite. Frozen safety clauses in non-role files stay verbatim. Today the gate
> treats `## Hard limits` sentences as FROZEN by `structuralSections`; the planner works out the exact
> mechanism (watched-corpus scope, a recorded exception, or similar) so the gate stays mechanical and
> fails closed. — **Reversibility:** costly — it changes the scope of a Phase 29 safety gate and its
> recorded base, and undoing it means re-dispositioning every clause changed since.

**What this is NOT.** It is not a narrowing of the watched corpus: all 42 watched files (19 roles, 19
workflows, `AGENTS.md`, `README.md`, `agent-factory/README.md` and `_role-switch-protocol.md`) stay
watched, and the gate still derives every changed clause in every one of them. It is not an override
tier for workflows or root documents: a changed clause in a workflow, `AGENTS.md`, `README.md` or
`agent-factory/README.md` still needs its disposition row, and a reworded workflow `## Stop
conditions` or `## Commit` clause still needs its filled companion cell. It is not a blanket bypass
for role files either: a role clause that equals a claim-registry verbatim anchor or a positive guard
literal is never admitted by the stand-in and still owes its companion edit.

**The mechanism.** `00-base.md` carries a second frontmatter key, `role_standin:
scripts/check-role-rules.js`, read by its own canonical-form regex (a `scripts/<kebab>.js` path and
nothing else). When the key is present the gate spawns `node <value> --check` once, from its CLI path
only, never at module load (the admission hook imports this module through `scripts/checkpoints.ts`).
If that run exits 0, a changed role clause that is frozen only by `structuralSections` or that has no
disposition row is admitted and counted on the line `N role clause(s) admitted by the role-rule
inventory stand-in (D-30)`. If the script is missing, the spawn fails, or it exits non-zero, every
such role clause is a finding naming the stand-in failure. A key whose value is not in the canonical
form is a named refusal. A tree without the key behaves exactly as before.

## Method — every number below was produced by a command in this plan

| what | how |
|---|---|
| old base | `4d2b8f079cc43d7d6184729966492789fb4dc05e`, the `base_commit` plan 29-04 recorded |
| new base | `e8d7802ccf8ebf428a47703f6001327325e3aea3`, the Phase 40 start commit: `git rev-parse HEAD` taken before plan 40-01's first commit, also recorded as `source_commit` in `docs/audit/40-role-rule-inventory.json` |
| totals at the old base | `node scripts/check-diff-disposition.js` on the tree at the new base: exit 1, "42 watched file(s) changed since 4d2b8f0; 3358 changed clause(s) derived; 2500 disposition row(s) across 64 file(s)", **721 finding(s) over 42 elements** |
| per-kind counts | the finding lines of that run, grouped by file kind and reason (table below) |
| reproduce | check out the parent of the commit that adds this file and run `node scripts/check-diff-disposition.js`; the parent still records the old base |

### The 721 findings this move retires

| kind | reason | findings |
|---|---|---:|
| workflow (`agent-factory/workflows/`) | no disposition row | 342 |
| role (`agent-factory/roles/`) | no disposition row | 269 |
| root `README.md` | no disposition row | 58 |
| root `AGENTS.md` | no disposition row | 11 |
| `agent-factory/README.md` | no disposition row | 10 |
| workflow | FROZEN by structuralSections | 23 |
| role | FROZEN by structuralSections | 8 |
| **total** | | **721** |

Phase 39 kept this count at exactly 721 as a recorded pre-existing red. These findings describe
changes committed between `4d2b8f0` and the Phase 40 start commit; they are retired by this decision,
not dispositioned, and the reproduce command above recovers every one of them by name.

## Scope end

The stand-in holds for `agent-factory/roles/` until a later recorded decision ends it. Phases 41 and
42 edit role files too, so it is not limited to Phase 40. Ending it means removing the `role_standin`
key from `00-base.md` by a recorded decision; from that commit on, every changed role clause needs its
disposition row again. Like the base itself, the stand-in is not a remedy for a red gate: it fails
closed, so a red inventory check makes every changed role clause a finding.
