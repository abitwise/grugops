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

## WR-06: the 31 frozen-section findings this move retired, read by a named human

D-30 keeps frozen safety clauses outside role files verbatim, yet 31 clauses in workflow `## Stop conditions` and `## Commit`
sections and role `## Hard limits` sections changed between `4d2b8f0` and the Phase 40 start commit `e8d7802` with no disposition
row, and the base move retired them unread. They were produced by running `node scripts/check-diff-disposition.js` in a throwaway
worktree at `8578f8ad1ad4137cb25be475667ef2b6b1e51a93` (the parent of `557531419e`, which still records the old base): exit 1,
"42 watched file(s) changed since 4d2b8f0; 3358 changed clause(s) derived; 2500 disposition row(s) across 64 file(s)", 721
finding(s) over 42 elements, the record's totals, of which exactly 31 lines read `FROZEN by structuralSections`.

How to read a row: `line`, `side` and `region` are the gate's own report. `before` is the source text at `4d2b8f0` and `after` is
the source text at `e8d7802` (each line at the parent of `557531419e` is byte-identical to `e8d7802`). Each cell quotes the
sentence that holds the finding's clause. A removed and an added finding of the same clause sit in adjacent rows and show both
texts. An added clause with no removed counterpart shows `—` for `before`, and its comparison quotes what the region held at
`4d2b8f0`. The comparison is the agent's advice; the disposition is the named human's alone.

| # | file | line | side | region | before | after | comparison | disposition |
|---|---|---|---|---|---|---|---|---|
| 1 | agent-factory/roles/factory-coach.md | 45 | removed | `## Hard limits`, lines 44-51 | Read the metrics, not the vibes — every finding cites a value in `plans/metrics.md`, never an opinion. | Read the metrics, not the vibes — every finding cites a value in `memory-bank/plans/metrics.md`, never an opinion. | **Reworded, same permission.** Paired with row 2. Only the path changes, from `plans/metrics.md` to `memory-bank/plans/metrics.md` (the memory-bank move); the rule that every finding cites a value, never an opinion, is the same. | accepted by Olger |
| 2 | agent-factory/roles/factory-coach.md | 44 | added | `## Hard limits`, lines 43-50 | Read the metrics, not the vibes — every finding cites a value in `plans/metrics.md`, never an opinion. | Read the metrics, not the vibes — every finding cites a value in `memory-bank/plans/metrics.md`, never an opinion. | **Reworded, same permission.** Paired with row 1; same reading. | accepted by Olger |
| 3 | agent-factory/roles/factory-coach.md | 45 | removed | `## Hard limits`, lines 44-51 | Report the snapshot exactly as it stands; never fake a count, a trend, or a gate result, and mark anything unverified `UNKNOWN - verify`. | Report the snapshot exactly as it stands; never fake a count, a trend, or a gate result, and mark anything unverified `UNKNOWN - verify`. | **Same text, line moved.** Paired with row 4. The sentence is byte-identical; the gate reports it because the paragraph moved from line 45 to line 44 when a line above it was removed and the path in the first sentence changed. | accepted by Olger |
| 4 | agent-factory/roles/factory-coach.md | 44 | added | `## Hard limits`, lines 43-50 | Report the snapshot exactly as it stands; never fake a count, a trend, or a gate result, and mark anything unverified `UNKNOWN - verify`. | Report the snapshot exactly as it stands; never fake a count, a trend, or a gate result, and mark anything unverified `UNKNOWN - verify`. | **Same text, line moved.** Paired with row 3; same reading. | accepted by Olger |
| 5 | agent-factory/roles/factory-coach.md | 45 | removed | `## Hard limits`, lines 44-51 | A flattering retro that hides the regression is the most expensive kind. | A flattering retro that hides the regression is the most expensive kind. | **Same text, line moved.** Paired with row 6. Byte-identical; reported only because the paragraph moved from line 45 to line 44. | accepted by Olger |
| 6 | agent-factory/roles/factory-coach.md | 44 | added | `## Hard limits`, lines 43-50 | A flattering retro that hides the regression is the most expensive kind. | A flattering retro that hides the regression is the most expensive kind. | **Same text, line moved.** Paired with row 5; same reading. | accepted by Olger |
| 7 | agent-factory/roles/factory-coach.md | 45 | removed | `## Hard limits`, lines 44-51 | The tickets are for the factory itself; do not invent waste the data does not show. | The tickets are for the factory itself; do not invent waste the data does not show. | **Same text, line moved.** Paired with row 8. Byte-identical; reported only because the paragraph moved from line 45 to line 44. | accepted by Olger |
| 8 | agent-factory/roles/factory-coach.md | 44 | added | `## Hard limits`, lines 43-50 | The tickets are for the factory itself; do not invent waste the data does not show. | The tickets are for the factory itself; do not invent waste the data does not show. | **Same text, line moved.** Paired with row 7; same reading. | accepted by Olger |
| 9 | agent-factory/workflows/00-bootstrap-greenfield.md | 53 | added | `## Commit`, lines 52-54 | — | The artifacts are the seeded board, the first tickets, the context notes recorded per Workflow 16, the memory-bank and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 49, ending "and the traceability rows"; that item became "the rendered trace files". The branch guard and "Never merge, never deploy; humans hold both." are unchanged on the line; only the list of committed files changed. | accepted by Olger |
| 10 | agent-factory/workflows/01-bootstrap-brownfield.md | 49 | added | `## Commit`, lines 48-50 | — | The artifacts are the brownfield map, the seeded board, the safe first tickets, the security-nfr note recorded per Workflow 16 and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 48, ending "and the traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 11 | agent-factory/workflows/02-idea-to-epics.md | 44 | added | `## Commit`, lines 43-45 | — | The artifacts are the epics, the board update, the product notes recorded per Workflow 16 and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 43, ending "and the traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 12 | agent-factory/workflows/03-epic-to-tickets.md | 49 | added | `## Commit`, lines 48-50 | — | The artifacts are the tickets, the board moves, the system-analysis notes recorded per Workflow 16 when produced, and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 46, ending "and the traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 13 | agent-factory/workflows/04-ticket-to-pr.md | 76 | added | `## Commit`, lines 75-77 | — | The artifacts are the board moves, the metrics and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 51 listed "the board moves, the implementation / QE / security-nfr context notes recorded per Workflow 16, the metrics, and the updated traceability rows"; the notes moved to the next sentence on the line and the traceability rows became "the rendered trace files". On the same line the guard was reworded from "(never a protected branch; ... working branch per `autonomy=pr`)" to "Never a protected branch: ... working branch per `checkpoints.open_pr`" (the autonomy dial was replaced by checkpoints); "never a protected branch" and "Never merge, never deploy; humans hold both." still hold. | accepted by Olger |
| 14 | agent-factory/workflows/05-pr-quality-gate.md | 68 | removed | `## Stop conditions`, lines 65-69 | The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. | The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. | **Same text, line moved.** Paired with row 15. Byte-identical; the bullet moved from line 68 to line 72 because the section moved down four lines. | accepted by Olger |
| 15 | agent-factory/workflows/05-pr-quality-gate.md | 72 | added | `## Stop conditions`, lines 69-73 | The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. | The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. | **Same text, line moved.** Paired with row 14; same reading. | accepted by Olger |
| 16 | agent-factory/workflows/05-pr-quality-gate.md | 68 | removed | `## Stop conditions`, lines 65-69 | Stop and route it back for splitting. | Stop and route it back for splitting. | **Same text, line moved.** Paired with row 17. Byte-identical; moved from line 68 to line 72. | accepted by Olger |
| 17 | agent-factory/workflows/05-pr-quality-gate.md | 72 | added | `## Stop conditions`, lines 69-73 | Stop and route it back for splitting. | Stop and route it back for splitting. | **Same text, line moved.** Paired with row 16; same reading. | accepted by Olger |
| 18 | agent-factory/workflows/05-pr-quality-gate.md | 72 | added | `## Stop conditions`, lines 69-73 | — | A state-check result is never a stop condition; Step 3 records it. | **Added.** A new sentence appended to the split bullet (commit `1d6f94c6`, plan 37-16, which added `node tools/grugops/state-check.js .` to Step 3). It removes no existing stop: the self-fix-budget, human-only-failure and too-large stops all still stand. It scopes the new state check as recorded, not blocking. The agent reads this as no existing rule loosened; the human should confirm that a non-blocking state check is intended. | accepted by Olger |
| 19 | agent-factory/workflows/05-pr-quality-gate.md | 78 | added | `## Commit`, lines 77-79 | — | The artifacts are the gate result and recommendation, the gate-pass-rate metric, the board move and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 74 listed these in one parenthesis with the QE / security-nfr notes, "the updated traceability rows" and the green `§14-gate` verdict note; the notes and the verdict note moved to the next two sentences on the line, and the traceability rows became "the rendered trace files". "The gate recommends only — never merge, never deploy; humans hold both." is unchanged. | accepted by Olger |
| 20 | agent-factory/workflows/06-uat-pack.md | 52 | added | `## Commit`, lines 51-53 | — | The artifacts are the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 45, ending "and the updated traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 21 | agent-factory/workflows/07-backlog-refinement.md | 49 | added | `## Commit`, lines 48-50 | — | The artifacts are the refinement notes recorded per Workflow 16, the re-sized/re-prioritized tickets, the `Backlog -> Ready` board moves and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 49 held the same list in a parenthesis, ending "and the confirmed traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 22 | agent-factory/workflows/08-sprint-planning.md | 57 | added | `## Commit`, lines 56-58 | — | The artifacts are the `memory-bank/plans/sprints/SPRINT-xx.md` file, the sprint-plan notes recorded per Workflow 16, the board moves and the velocity metric. | **Reworded, same permission.** At `4d2b8f0` line 57 held the same list in a parenthesis with the path `plans/sprints/SPRINT-xx.md`; the only changes are the parenthesis becoming a sentence and the memory-bank path. Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 23 | agent-factory/workflows/09-daily-sweep.md | 54 | added | `## Commit`, lines 53-55 | — | The artifacts are the reconciled `memory-bank/plans/board.md`, the flow metrics in `memory-bank/plans/metrics.md` and the `memory-bank/60-progress.md` record. | **Reworded, same permission.** At `4d2b8f0` line 50 listed "the reconciled `plans/board.md`, the flow metrics in `plans/metrics.md`, the `memory-bank/60-progress.md` record, and the kept-current traceability statuses"; the paths moved under `memory-bank/` and the traceability statuses gave way to the rendered trace files in row 24. Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 24 | agent-factory/workflows/09-daily-sweep.md | 54 | added | `## Commit`, lines 53-55 | — | They also include the rolled lines with their archive files, and the rendered trace files. | **Added.** The rolled lines and their archive files are new to the list (nothing at `4d2b8f0` line 50 named them); the rendered trace files replace the old "kept-current traceability statuses". This widens what the sweep commits on its guarded branch, not what it may do: the branch guard and "Never merge, never deploy; humans hold both." are unchanged on the line. | accepted by Olger |
| 25 | agent-factory/workflows/10-sprint-review.md | 49 | added | `## Commit`, lines 48-50 | — | The artifacts are the review notes appended to `memory-bank/plans/sprints/SPRINT-xx.md`, the velocity metric and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 49 held the same list in a parenthesis with the path `plans/sprints/SPRINT-xx.md`, ending "and the confirmed traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 26 | agent-factory/workflows/11-retro.md | 43 | added | `## Commit`, lines 42-44 | — | The artifacts are the retro notes recorded per Workflow 16, the `factory`-tagged improvement tickets and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 43 held the same list in a parenthesis, ending "and the traceability rows linking them to their waste", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 27 | agent-factory/workflows/12-release.md | 51 | added | `## Commit`, lines 50-52 | — | The artifacts are the release notes recorded per Workflow 16 and the `memory-bank/plans/releases/REL-xxxx.md` record with its approval entry. | **Reworded, same permission.** At `4d2b8f0` line 49 opened its parenthesis with the same two items, with the path `plans/releases/REL-xxxx.md`. "The commit records the release; it does not deploy it — never merge, never deploy; the production action stays human-confirmed and humans hold both." is unchanged. | accepted by Olger |
| 28 | agent-factory/workflows/12-release.md | 51 | added | `## Commit`, lines 50-52 | — | They also include the board move, the metric and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 49 ended its parenthesis with "the board move, the metric, and the release-linked traceability rows"; the traceability rows became "the rendered trace files". The no-deploy sentence quoted in row 27 is unchanged. | accepted by Olger |
| 29 | agent-factory/workflows/13-incident.md | 44 | added | `## Commit`, lines 43-45 | — | The artifacts are the postmortem notes recorded per Workflow 16, the follow-up tickets, the escaped-defects metric, and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 44 held the same list in a parenthesis, ending "and the incident-linked traceability rows", now "the rendered trace files". "The mitigation/rollback production action stays human-confirmed — never merge, never deploy; humans hold both." is unchanged. | accepted by Olger |
| 30 | agent-factory/workflows/14-ui-design-to-build.md | 52 | added | `## Commit`, lines 51-53 | — | The artifacts are the board context, the frontend design-contract note recorded per Workflow 16, and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` the same list sat in a parenthesis on line 48, ending "and the updated traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |
| 31 | agent-factory/workflows/15-security-audit.md | 47 | added | `## Commit`, lines 46-48 | — | The artifacts are the board context, the security-nfr audit notes recorded per Workflow 16, and the rendered trace files. | **Reworded, same permission.** At `4d2b8f0` line 47 held the same list in a parenthesis, ending "and the updated traceability rows", now "the rendered trace files". Branch guard and "Never merge, never deploy; humans hold both." unchanged. | accepted by Olger |

Count: 31 rows = 23 workflow + 8 role, the per-kind FROZEN counts in the table above.

The agent reads the 31 rows as 19 reworded with the same permission, 10 with the same text on a moved line, 2 added, and 0
changed. This is advice only.

Read by: Olger, 2026-11-02

> accept-all, Olger

The reply accepts all 31 rows and flags none, so WR-06 leaves no open follow-up.

## CR-01 round 2: the stand-in no longer admits a safety sentence (2026-11-02)

By the named human's decision (Olger, 2026-11-02), the role-rule inventory stand-in refuses any changed role clause that carries a `SAFETY_RULE_FACTS` fact, on either side of the diff (plan 40-21). The rewrite's own such clauses are dispositioned in `docs/audit/29-style-dispositions/40-20.md`, and the named human read them. The recorded base and the `role_standin` key are unchanged.
