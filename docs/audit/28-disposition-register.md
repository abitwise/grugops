# Phase 28 Disposition Register (AUDIT-01)

Every role and workflow in the shipped kit, with a recorded disposition. One row per audited file
in **Table A**; one row per finding in **Table B**. `scripts/check-audit-register.js` enforces the
two D-03 completeness equalities against the derived listers on every CI run, so the completeness of
this register is a **check** rather than a claim.

**This register is filled by the read pass in plans 28-06 and 28-07.** Until then every
`observation` is empty and every `safety_surface` carries the unfilled marker `—`, so the gate is
RED. That is deliberate, and it is the same posture the AUDIT-02 drift guard takes for the same
reason: a completeness gate that goes green the moment it appears has never been watched distinguish
a complete register from an empty one.

**It lives under `docs/` and not under `agent-factory/`,** so it reaches no host repository —
`install/install.ts` copies the whole `agent-factory/` tree into every install, and an internal
audit record is not something a user should find in their own repo. It is a durable repo artifact
rather than a `.planning/` note because Phase 29 declares a dependency on it and `.planning/` is
archived at milestone close, invisible to CI.

## What this register does not prove

**That a file was read is not mechanically provable.** No gate can distinguish a row whose
observation was written after reading the file from one whose observation was written after reading
the file's name. An agent reporting an absence of findings is **narrating**, not demonstrating, and
this register records that limit rather than implying it away.

What the gate **does** prove:

- every file the derived listers return has a row here, by **set equality in both directions** — not
  by a count, which would pass while a decoy displaced a real member;
- the number of findings each file declares agrees with the number of finding rows naming it, and
  the two totals agree — two equalities at two granularities, neither able to absorb the other's
  drift;
- every disposition is one of the three AUDIT-01 names, every deferral names a target phase, every
  acceptance carries a reason, and every category-6 finding is deferred to Phase 29;
- no observation is blank or a bare word standing in for one.

What it **does not** prove: **that any observation is true.** Structure is checkable and truth is
not. The mechanical pre-pass at `docs/audit/28-prepass-evidence.md` narrows the gap — it is
re-runnable, so a regression after this audit is a `diff` rather than an invisible change — but it
answers four greppable questions and the rubric below asks six, two of which no regular expression
can reach. The residual is real, it is not reducible by adding another check, and it is written here
instead of being left for a reader to discover.

## Rubric

Six categories (D-07). Five are settled here; the sixth is record-only.

| # | Category | The question it asks |
|---|---|---|
| 1 | Factual correctness | Does this file describe the architecture that actually ships — decompose rather than route, the shared verified context rather than a relay, the three spawn tiers? |
| 2 | Reference integrity | Does every path, role, workflow, checklist and config key it names resolve on disk? |
| 3 | Claim honesty | Is anything unproven stated as fact, and is `UNKNOWN - verify` present where something is genuinely unknown? |
| 4 | Internal consistency | Do counts, versions, tier names and config keys agree with the schema and with sibling files? |
| 5 | Strangeness | Are there vestigial sections, contradictions, dead options, or text with no remaining reader? |
| 6 | Instruction determinism | Would two agents reading this step reach the same act? |

**Category 6 is RECORD-ONLY.** Its only legal disposition is `deferred` with target phase `29`, and
`scripts/audit-model.js` refuses any other — structurally, not by convention. Phase 29's LANG-02
rewrites this prose for a living, so a determinism finding fixed here is work done twice and a merge
conflict besides. The deeper reason is that an audit which starts rewriting prose has stopped being
an audit; pre-committing the disposition is what keeps this phase from turning into a style pass on
text Phase 29 already owns. What category 6 produces instead is a **located worklist** for LANG-02:
a file, a line, and a stated ambiguity, rather than an instruction to re-read the same 36 files.

## Out-of-set by derivation

`agent-factory/roles/_role-switch-protocol.md` carries `counted: no` and is the only row that does.

**Why it is out of set.** `scripts/kit-model.ts`'s `listRoles()` drops underscore-prefixed entries
by derivation, which is exactly what makes the role count 17 rather than the 18 files on disk. That
derivation is correct and is not being worked around: the file is a protocol, not a role, and the
completeness equality stays honest at the 36 files the two listers actually return.

**Why it is here anyway.** Dropping a file silently because a derivation does not reach it is the
precise failure shape this project keeps hitting — a membership set narrower than the fact it claims
to describe. So it is present, named, and explicitly uncounted, and the gate reports it as an
uncounted row on every run rather than letting its absence pass for completeness.

**Why it is still read once.** `docs/design/shared-install.md` records that its step 4 demanded
*"write the role's handoff file under `agent-factory/handoffs/`"* — an artifact Phase 24 deleted.
That makes it one of the likeliest drift carriers in the tree, and being out of set for counting is
not a reason to leave it unread.

**Equality one filters on `counted: yes` before counting, and that filter is load-bearing rather
than decorative.** `scripts/check-audit-register.test.ts` proves it in both directions: a fixture
planting a second uncounted row keeps equality one green at 36, and a fixture flipping this row to
`counted: yes` turns it red at 37.

## Recorded couplings and out-of-set notes

**A file with no Table A row cannot hold a Table B finding.** The parse authority refuses a finding
whose `file` is absent from Table A — that is the foreign-key direction — and admitting one would
break both D-03 equalities, because a finding counted in the total would have no file row to declare
it. This section exists so the answer to that constraint is never *"widen Table A"*: Table A's
membership is the derived audit set and nothing else.

So notes about files and directories **outside** the audit set live here, in prose, with their
reason. Plan 28-05 fills this section with the Phase 33 / GAP-D1 coupling on
`examples/03-ticket-to-pr.md` and the two deleted hygiene directories.

*(Empty until 28-05.)*

## Table A — audited files

| file | kind | counted | safety_surface | findings | observation |
|---|---|---|---|---|---|
| agent-factory/roles/agents-md-scribe.md | role | yes | — | 0 |  |
| agent-factory/roles/architect-design.md | role | yes | — | 0 |  |
| agent-factory/roles/ba-pm.md | role | yes | — | 0 |  |
| agent-factory/roles/brownfield-mapper.md | role | yes | — | 0 |  |
| agent-factory/roles/compliance-officer.md | role | yes | — | 0 |  |
| agent-factory/roles/factory-coach.md | role | yes | — | 0 |  |
| agent-factory/roles/frontend-ui.md | role | yes | — | 0 |  |
| agent-factory/roles/greenfield-mapper.md | role | yes | — | 0 |  |
| agent-factory/roles/incident-responder.md | role | yes | — | 0 |  |
| agent-factory/roles/installer.md | role | yes | — | 0 |  |
| agent-factory/roles/orchestrator.md | role | yes | — | 0 |  |
| agent-factory/roles/qe-e2e.md | role | yes | — | 0 |  |
| agent-factory/roles/release-manager.md | role | yes | — | 0 |  |
| agent-factory/roles/security-nfr.md | role | yes | — | 0 |  |
| agent-factory/roles/software-engineer.md | role | yes | — | 0 |  |
| agent-factory/roles/system-analyst.md | role | yes | — | 0 |  |
| agent-factory/roles/uat-planner.md | role | yes | — | 0 |  |
| agent-factory/workflows/00-bootstrap-greenfield.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/01-bootstrap-brownfield.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/02-idea-to-epics.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/03-epic-to-tickets.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/04-ticket-to-pr.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/05-pr-quality-gate.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/06-uat-pack.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/07-backlog-refinement.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/08-sprint-planning.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/09-daily-sweep.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/10-sprint-review.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/11-retro.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/12-release.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/13-incident.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/14-ui-design-to-build.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/15-security-audit.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/16-context-read-write.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/17-task-claim.md | workflow | yes | — | 0 |  |
| agent-factory/workflows/18-context-compaction.md | workflow | yes | — | 0 |  |
| agent-factory/roles/_role-switch-protocol.md | protocol | no | — | 0 |  |

**`safety_surface` carries `—` on every row above**, which is the unfilled marker: the parser admits
it and the gate refuses to pass while any row still carries it. Writing `no` into 37 unread rows
would record a verdict nobody reached, and writing an unparseable value would make the register
unreadable rather than incomplete. D-18 derives Phase 29's LANG-02 exclusion list from this column
unioned with the claim registry's `kind: safety` rows, so an unearned `no` here becomes a missing
exclusion two phases later.

## Table B — findings

| finding_id | file | category | disposition | target_phase | reason |
|---|---|---|---|---|---|

**Finding ids are `F-28-NNN`, three zero-padded digits, and the parser refuses anything else.** This
is a canonical form with a refusal outside it rather than a pattern widened once per surprise.

**Note for 28-06 — the seven findings plan 28-02 already recorded use a DIFFERENT id scheme.**
`docs/audit/28-residual-sizing.md` names them `F-28-A` through `F-28-G`, which this canonical form
refuses. They must be entered here as `F-28-001`…`F-28-007` with their original letter id quoted in
the `reason` column, so the trail from the sizing document survives. The grammar is not widened to
admit both spellings: one predicate, one form.
