# Phase 28 Disposition Register (AUDIT-01)

Every role and workflow in the shipped kit, with a recorded disposition. One row per audited file
in **Table A**; one row per finding in **Table B**. `scripts/check-audit-register.js` enforces the
two D-03 completeness equalities against the derived listers on every CI run, so the completeness of
this register is a **check** rather than a claim.

**This register is filled by the read pass in plans 28-06 and 28-07.** It shipped from 28-03 with
every `observation` empty and every `safety_surface` carrying the unfilled marker `—`, so the gate
was RED before a single file had been read. That is deliberate, and it is the same posture the
AUDIT-02 drift guard takes for the same reason: a completeness gate that goes green the moment it
appears has never been watched distinguish a complete register from an empty one. **Plan 28-06 has
filled 18 of the 37 rows — the 17 derived roles and the protocol row. The 19 workflow rows are plan
28-07's and are still unfilled, so the gate is still RED, and it should be.**

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

**What the read found, recorded as a measurement rather than left as a suspicion.** Plan 28-06 read
the file whole and the carried-in candidate is **refuted**: step 4 now reads *"RECORD the work
output as typed notes per Workflow 16"*, and the file carries **zero** occurrences of `handoff`,
case-insensitively, in any form — not the retired path `agent-factory/handoffs/` that
`RETIRED_PATH_FORMS` already asserts to zero across this file's SCAN membership, and not a prose
form naming the retired concept without naming its path, which is the gap nothing covers here and
which was the specific reason D-02 demanded the read. `shared-install.md` records a historical
state; Phase 24's rewrite reached this file. **The value of the read is not that it found nothing —
it is that the absence is now measured rather than assumed, and it found two OTHER claims this file
makes about the rest of the kit that no longer hold (F-28-021, F-28-022).**

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

### `examples/03-ticket-to-pr.md` — the Phase 33 / GAP-D1 coupling, and a PARTIAL OVERLAP

**Recorded by plan 28-05, 2026-08-12.** Standing obligation #1 (`ROADMAP.md:106`) routes GAP-D1 to
Phase 33 / CAP-01: *"one captured live dual-path run → flip A3/DOG-02 + the coupled
`examples/03-ticket-to-pr.md` edit."* Plan 28-05 rewrote part of that same file under D-11, so
Phase 33 must work from the new text, not from the text its obligation was written against.

**What 28-05 changed, and it is disjoint from GAP-D1's surface:**

- the `## Expected notes` line inside the captured `# Orchestrator Decision` block (was
  `## Expected handoffs`, naming two files under the deleted handoff directory), plus a
  clear-voice paragraph directly below the fence recording that the restatement was made and why;
- the § *What the two roles published (real results)* section (was § *Handoffs produced (real
  files)*), re-narrated onto the shared verified context.

Both were guard hits reported by `scripts/check-public-docs-vocabulary.js`. Neither sits inside the
§ *Dual-path parity (DOG-02)* table, which is where GAP-D1's captured output lands.

**Where the two edits are NOT disjoint — the reason this is a finding and not a clean note.** Plan
28-05 was instructed to confirm disjointness by reading, and to record an overlap rather than guess
at it. The reading found one:

| Line | Text | Owner |
|---|---|---|
| § *Dual-path parity* intro | *"the same ticket, the **same handoff filenames**, and the same gate verdict"* | overlaps |
| parity row *"Handoff filenames produced"* | LEFT cell names `implementation-handoff.md`, `qe-handoff.md`; RIGHT cell is `pending human` | overlaps |

The RIGHT cells of that table are exactly what GAP-D1 fills with captured live-run output. The LEFT
cell of the `Handoff filenames produced` row, and the intro sentence, still carry the retired relay
vocabulary and are 28-05's kind of defect. **The overlap is at row granularity: one row, two
owners.**

**28-05 therefore did NOT touch either line, deliberately.** Rewriting a parity dimension's left
cell while its right cell reads *"expect the SAME filenames"* would leave the table asserting a
parity between a rewritten dimension and an unrun capture — a contradiction 28-05 cannot resolve,
because resolving it requires the live run Phase 33 owns. `git diff` for 28-05 changed **zero**
`pending human` lines, which is the mechanical evidence that the GAP-D1 surface is untouched.

**What Phase 33 must do about it.** When CAP-01 fills the parity table from the captured run, it
must ALSO retire the relay vocabulary in that table's intro sentence and in the `Handoff filenames
produced` row — the parity dimension is now *which typed notes each path published into the shared
verified context*, not which filenames it wrote. This is one edit, not two, and doing it in one
pass is why 28-05 left it. **No gate holds this.** `check-public-docs-vocabulary.js` reports zero
hits on this file, because neither line contains an `agent-factory/handoffs/` path or the literal
`handoff packet` — and D-10 forbids widening the matcher to chase the bare word. This paragraph is
the only record that the residual exists.

### `agent-factory/handoffs/` and `agent-factory/examples/` — two deleted hygiene directories

**Deleted by plan 28-05, 2026-08-12, under D-12.** Both are directories, so neither has a Table A
row — Table A is derived from `listRoles()` and `listWorkflows()` and admits only `role` |
`workflow` | `protocol`. The record belongs here for the same reason the coupling above does.

| Directory | Held | Why it was deleted |
|---|---|---|
| `agent-factory/handoffs/` | one empty `.gitkeep`, nothing else | Named for a concept **Phase 24 deleted**: the seventeen static handoff templates were removed and the shared verified context replaced the relay. A directory that ships to every user, named for an artifact class that no longer exists, invites the next reader to put something in it. |
| `agent-factory/examples/` | one empty `.gitkeep`, nothing else | Empty. It has never held content, and the narrative examples live at the repository root in `examples/`, which is a different path and is untouched. |

**Both shipped to every user until now, and that was MEASURED rather than inferred.**
`install/install.ts:1065` does `cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, {recursive: true})`,
and a run against a scratch target with `GRUGOPS_HOME` redirected produced
`agent-factory/handoffs/.gitkeep` and `agent-factory/examples/.gitkeep` in the installed kit. The
listing was read, not assumed.

#### The installer's indifference was measured, not concluded from reading the code

D-12's code-context note expected that no installer literal would need editing. That expectation was
treated as a hypothesis to test. The installer and uninstaller were run against a scratch target
**before** the deletion and again against a fresh scratch target **after** it, with all four outputs
and all four filesystem listings captured:

| Comparison | Result |
|---|---|
| installer stdout, before vs after | **byte-identical, zero lines differ** |
| installer exit code | `0` → `0` |
| installed KIT listing | differs by **exactly four lines** — `./agent-factory/examples`, `./agent-factory/examples/.gitkeep`, `./agent-factory/handoffs`, `./agent-factory/handoffs/.gitkeep`. Nothing else. |
| installed TARGET listing | identical |
| uninstaller stdout, before vs after | **byte-identical, zero lines differ** |
| uninstaller exit code | `0` → `0` |
| TARGET listing after uninstall | identical |

No new warning, no new unreadable-path finding, no changed exit code.

#### The literal grep, recorded with its result whatever that result was

`install/`, `scripts/` and `hooks/` were grepped for any literal naming either directory. **Zero
hits name either directory as a path that is read, written, required or removed.** Every hit is one
of four harmless classes: the `RETIRED_PATH_FORMS` literal in `scripts/dead-vocabulary.ts`, which
asserts **zero** occurrences and is therefore *strengthened* by the deletion; synthetic RED fixtures
in `*.test.ts` that plant the string into hermetic mirrors and never read the real directory;
comments recording Phase 24 and the wave-1 measurement; and `scripts/check-kit-refs.ts:55`, a
comment noting that `agent-factory/examples/` is excluded **by not being listed** — so removing a
non-member cannot change that walk.

**Two near-misses are recorded because a careless reader would score them as hits and be wrong:**

- `install/install.ts:735` — `backupDir(join(TARGET, "plans", "handoffs"), "plans/handoffs/")`. This
  is `plans/handoffs/` in the **target repo's per-repo STATE**, a different path from the kit
  directory deleted here. It is untouched and must stay.
- `scripts/check-public-docs-vocabulary.ts:97` — `const EXAMPLES_DIR = "examples"`. This is the
  **repository-root** `examples/` directory holding the five narrative files, not
  `agent-factory/examples/`. Confusing the two would have predicted that this deletion empties the
  drift guard's scan set. It does not: the guard still derives five members from root `examples/`,
  and `PUBLIC_DOCS_SCAN_COUNT` is still 10.

#### One correction to the code-context note, recorded rather than smoothed over

D-12's note says the installer's `cpSync` and *"the uninstall mirror"* both track by derivation. The
`cpSync` half is right. The uninstall half is **stronger than derivation and differently shaped**:
`install/uninstall.ts` never touches the kit tree at all. Its header states it *"NEVER deletes
agent-factory/, plans/, .planning/, docs/, src/, the seeded per-repo state … [or] the shared kit at
$GRUGOPS_HOME"*, and removing that kit is a manual `rm` with no flag for it. So the uninstaller is
indifferent to this deletion **by construction, not by derivation** — it could not have carried a
literal for either directory, because it removes nothing from the kit whatsoever. The conclusion the
note reached is correct; one of its two stated reasons is not, and the difference is written down
here so the next reader does not inherit it.

## Table A — audited files

| file | kind | counted | safety_surface | findings | observation |
|---|---|---|---|---|---|
| agent-factory/roles/agents-md-scribe.md | role | yes | yes | 2 | Owns the root `AGENTS.md` substrate and is the sole author of the 12 coding rules, which AGENTS.md:108 confirms exist there as 12 rules under four principles. Structurally the odd role out: it is the only one that does NOT carry the `Follow the 12 coding rules in AGENTS.md` pointer, and it says so at line 41 — where it also miscounted its 16 peers as 14 (F-28-011, corrected). Its two `UNKNOWN - verify` sites (lines 34, 50) are the strongest in the corpus: both state the reason a guessed command is worse than none. Its two `§17.1` references (lines 32, 39) point into a spec document the kit does not ship (F-28-012). |
| agent-factory/roles/architect-design.md | role | yes | yes | 1 | A short, well-formed design role. Every reference resolves: `memory-bank/50-decisions/ADR-template.md` and `plans/nfr-catalog.md` both ship in `agent-factory/seed/`, and its board claim on the `In Design` exit matches `seed/plans/board.md:63`. `capabilities: read edit shell web` is one of only two roles granted `web` (with security-nfr), which is consistent with a role that researches technology choices. Its one open question is the ADR threshold: line 31 states a judgement rather than a test (F-28-019). |
| agent-factory/roles/ba-pm.md | role | yes | yes | 0 | The product-intake role, and the only one carrying PERS-02 sizing headroom in the byte-ceiling table. Checked all six rubric questions and found it in order: `definition-of-ready.md` resolves, the `Backlog → Ready` exit it claims matches the seeded board, and its INVEST/Given-When-Then instructions are concrete enough to act on. The XL-split instruction at line 34 initially read as a determinism gap until the premise was measured — the `XS=1 S=2 M=3 L=5 XL=8` scale it depends on is carried by `seed/plans/board.md:110`, which this role's § Reads already names, so no finding was raised. |
| agent-factory/roles/brownfield-mapper.md | role | yes | yes | 1 | The smallest role in the kit (2738B) and already the tightest against its ceiling — it sat at 2746B against a 2693B WARN before this pass. A disciplined read-only mapping role whose hard limits ("Do not refactor. Do not fix. Only map.") are unambiguous. Its one defect was a dangling `Phase-4` build-phase label on its output line, fixed by deletion rather than by widening the sentence (F-28-016); the file is now smaller than it was, and no ceiling was raised or file trimmed to fit. |
| agent-factory/roles/compliance-officer.md | role | yes | yes | 1 | The heaviest compliance surface in the kit and the clearest `safety_surface: yes` in Table A — it names GDPR, SOC 2, ISO 27001 and PCI, gates on `compliance_regime`, marks `BLOCKED` on a missing control, and mandates clear voice over caveman. It also carried the single most consequential defect this read found: line 36 instructed the role to WRITE into the read-only kit (F-28-013, fixed), contradicting the AGENTS.md § Kit vs state invariant its own header quotes. Everything else checks: the checklist resolves, the `In Security/NFR` gate placement matches the board, and the escalate-to-a-named-human rule is intact. |
| agent-factory/roles/factory-coach.md | role | yes | yes | 0 | The retro/metrics role, and the one file whose numeric claims are fully checkable: all nine metric names it cites at line 22 (Throughput, Cycle time, Lead time, WIP, Blocked time, Rework rate, Gate pass rate, Escaped defects, Velocity) were compared one-for-one against `seed/plans/metrics.md:17-25` and match exactly, in the same order, with none missing and none invented. Its bounds are stated rather than left to judgement ("top 1–3 wastes"), and it correctly claims no board transition. No finding. |
| agent-factory/roles/frontend-ui.md | role | yes | yes | 0 | The 17th role (added in Phase 13) and one of eight already in ceiling WARN at 3872B/3757B. Checked and in order: `WCAG 2.2 AA` matches `nfr.a11y_target: "WCAG-2.2-AA"` in the live config and the same bar in workflow 14; `accessibility-checklist.md` resolves; workflows `04-ticket-to-pr.md` and `05-pr-quality-gate.md` both resolve; the five states are named identically here and in workflow 14. Notably the strictest single-activation contract in the kit — it explicitly refuses to re-activate to review its own contract, which is a real scope boundary rather than a slogan. |
| agent-factory/roles/greenfield-mapper.md | role | yes | yes | 1 | The greenfield twin of brownfield-mapper and equally terse; also already in ceiling WARN (2916B/2882B). Its output contract is honest in an unusual way — it states that `memory-bank/greenfield-plan.md` is deliberately NOT seeded in the kit and that the role names an output it will write rather than pre-create, which is exactly the distinction that makes the mechanical pre-pass's unresolvable-reference hit on it a false positive. Carried the same dangling `Phase-4` label as its twin (F-28-017, fixed by deletion). |
| agent-factory/roles/incident-responder.md | role | yes | yes | 0 | An enterprise role with a tight, well-ordered incident contract (mitigate → blast radius → blameless postmortem → tickets). Every path resolves: `memory-bank/70-runbook.md`, `plans/nfr-catalog.md` and `plans/releases/` all ship in the seed. Its hard limit closes on `Production action is always human-confirmed`, which is the `production_requires_human_confirmation` floor stated in role text — the reason this row is `safety_surface: yes` despite the file carrying no security checklist of its own. No finding. |
| agent-factory/roles/installer.md | role | yes | yes | 1 | The role whose subject matter the kit's own tooling has since overtaken: it describes detecting a host agent and laying down adapters, work that `install/install.ts` now performs mechanically. That is not itself a defect — the role remains the human-facing description of the install contract, and its additive / dry-run / reversible / never-overwrite limits match the installer's documented behaviour and CLAUDE.md's installer constraint word for word. What it lacks is any pointer to the per-tool adapter table that does exist and does ship, at `agent-factory/packaging/adapters.md` (F-28-018). |
| agent-factory/roles/orchestrator.md | role | yes | yes | 3 | The largest role (7090B) against the tightest relative ceiling (7165B WARN / 7570B FAIL — 75 bytes of headroom), the file every other role is measured against, and the only role holding the spawn grant. Its classification list and the workflow set line up exactly: 17 classifications, minus `install` which line 75 correctly says has no workflow, equals the 16 workflows numbered 00-15; workflows 16-18 are seams with no classification, which is coherent and stated. `queue.wip_limit`, `queue.claim_cap` and `queue.stale_ttl_minutes` all resolve in the live config and the hard-limit width of 3 matches `wip_limit: 3`. The three findings are all in the § Hard limits paragraph and its § Reads line: a two-mode spawn vocabulary where the shipped architecture has three tiers (F-28-008), no when-absent config branch (F-28-009), and no granularity rule for the decomposition it owns (F-28-010). |
| agent-factory/roles/qe-e2e.md | role | yes | yes | 1 | The outer-acceptance-loop owner, paired with software-engineer.md's inner loop; the two files describe the double loop consistently and each names the other's half. Already in ceiling WARN (3695B/3617B). Its honesty text is the strongest in the corpus on skips — "a skipped test left unexplained is a lie the next gate inherits" — which is the role-side statement of the `quality.test_integrity` floor and the reason this row is a safety surface. One gap: the `quality.ui_e2e` dial that actually decides when E2E runs is named nowhere in this file nor in anything its § Reads points at (F-28-020). |
| agent-factory/roles/release-manager.md | role | yes | yes | 1 | The role that holds the human deploy gate, and it holds it correctly: "Deploy only after a named human approves", "you never deploy prod yourself", and a status set (`READY_TO_RELEASE` / `BLOCKED` / `RELEASED`) that matches workflow 12 exactly. `release-readiness-checklist.md`, `plans/nfr-catalog.md` and `memory-bank/70-runbook.md` all resolve, and it uses the correct non-writing verb ("Work through") for the kit checklist — the precedent that made the compliance-officer fix a re-narration rather than an invention. Its one defect is a board-ownership collision on the `Done` exit (F-28-015). |
| agent-factory/roles/security-nfr.md | role | yes | yes | 1 | The second-largest role (5027B, already in WARN at 4830B) and the densest safety surface after compliance-officer. Its ASVS severity map (L1 fail → high, L2 → medium, L3 → low) and its deference to `security.block_on` both match the live config (`asvs_level: "L1"`, `block_on: "high"`), and its statement that the checklist ships the FULL ASVS set and is filtered at read time rather than regenerated when the dial changes is an unusually precise and verifiable claim — `security-nfr-checklist.md` resolves and workflow 15 says the same thing. Its accepted-risk-needs-a-named-owner rule is load-bearing text no style pass may touch. One finding: two bare "Section 13" references into the unshipped spec (F-28-014). |
| agent-factory/roles/software-engineer.md | role | yes | yes | 0 | The build role, already in ceiling WARN at 3722B/3697B. Checked across all six categories and found in order: the `diff` / `branch` / `pr` autonomy values at line 21 match the enum in `agent-factory/config/factory.config.md:14` exactly; `example-mapping.md` resolves; the `In Development → In Review` exit matches the seeded board; and the inner-loop / outer-loop split is consistent with qe-e2e.md from the other side. Its "a green that was never run is the most expensive lie in the trace" line is the role-level statement of this project's own no-fabrication rule. No finding. |
| agent-factory/roles/system-analyst.md | role | yes | yes | 0 | The smallest core analysis role and already in ceiling WARN (3020B/3000B). Its hand-off is clean in both directions: it consumes BA/PM's published notes and hands to `In Design`, which architect-design.md then claims the exit of — the two files agree and neither claims the other's column. Every reference resolves and the file names no config key it does not read. Its hard limits are permission-bearing ("Do not choose the framework. Do not code.") which is why the row is a safety surface even though the file carries no security text. No finding. |
| agent-factory/roles/uat-planner.md | role | yes | yes | 0 | The human-signoff gate, and the role whose safety text is the least substitutable in the kit: "an agent that self-signs has removed the one human the gate exists for" is the entire justification for the UAT column, and rewording it is precisely the failure D-18's exclusion list exists to prevent. Already in ceiling WARN (3367B/3350B). `uat-checklist.md` resolves; the `Ready for UAT → In UAT` and `In UAT → Ready to Release` moves it claims both match the seeded board; and it uses the correct non-writing verb for the kit checklist in both places it names one. No finding. |
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
| agent-factory/roles/_role-switch-protocol.md | protocol | no | yes | 2 | The single source for HOW a role activates — five ordered steps plus the invariant that a role's only memory of earlier roles is the shared verified context. It is out-of-set for COUNTING because `listRoles()` drops underscore-prefixed entries by derivation, which is what makes the role count 17 rather than the 18 files on disk; it is in-set for READING because a derivation not reaching a file is not a reason to leave it unread, and this file was the likeliest drift carrier in the tree. The read settles that: the carried-in candidate is REFUTED — step 4 no longer demands a handoff file, it says "RECORD the work output as typed notes per Workflow 16", and the file carries zero occurrences of `handoff` in any form, including forms `RETIRED_PATH_FORMS` cannot match. What the read did find is two claims the file makes about the rest of the kit that no longer hold (F-28-021, F-28-022). It is a safety surface: it states the coordinator-only spawn rule and the shared-context-is-the-only-channel invariant, both admission text. |

**`—` is the unfilled `safety_surface` marker**: the parser admits it and the gate refuses to pass
while any row still carries it. Writing `no` into an unread row would record a verdict nobody
reached, and writing an unparseable value would make the register unreadable rather than incomplete.
D-18 derives Phase 29's LANG-02 exclusion list from this column unioned with the claim registry's
`kind: safety` rows, so an unearned `no` here becomes a missing exclusion two phases later. **Plan
28-06 filled the 17 role rows and the protocol row; the 19 workflow rows still carry `—` and are
plan 28-07's**, which is why the gate is still red.

**The column came out uniform across all 18 rows 28-06 filled, and that is stated rather than left
for a reader to notice.** Every role file's `## Hard limits` section carries permission-bearing or
no-fabrication text — "Do not write production code", "never deploy prod yourself", "an agent that
self-signs has removed the one human the gate exists for", "never fake a test result" — and the flag
is per FILE, not per sentence, so one load-bearing sentence makes the file a safety surface. Under
D-18's stated asymmetry (mark `yes` where the judgement is close, because a false `yes` costs Phase
29 nothing and a false `no` costs correct security text) every one of the 18 is `yes`. **The
consequence is real and belongs to Phase 29, not to this register: an exclusion list that excludes
the entire role corpus does not narrow LANG-02's work, it relocates the question to which SENTENCES
are load-bearing** — a granularity this column cannot express and was not built to. Recording 18
honest `yes` values and naming that limit is the correct outcome; manufacturing variance to make the
column look discriminating would be the unearned verdict this register exists to refuse.

## Table B — findings

| finding_id | file | category | disposition | target_phase | reason |
|---|---|---|---|---|---|
| F-28-008 | agent-factory/roles/orchestrator.md | 1 | deferred | 29 | § Hard limits, line 88: "One substrate, two modes ... PARALLEL where `Agent` is available; SEQUENTIAL where it is not". The shipped architecture has THREE announced tiers, and this file carries neither the Full / Reduced / Degraded labels nor the reduced-path disclosure that the enumerated grant is not runtime-enforced. `.claude/agents/grugops-orchestrator.md`, `agent-factory/packaging/adapters.md:35` and `agent-factory/packaging/subagent.frontmatter.md:118` all carry all three. `guard_wr05`'s TIER_BEATS assert them on the coordinator ADAPTER only, so the portable role text — the file that adapter instructs the agent to read — is the one surface where the two-mode vocabulary survives unguarded, on all five host CLIs. NOT fixed here: the file is 7090B against a 7165B WARN / 7570B FAIL ceiling and this plan may neither raise a ceiling nor trim a role to fit one; Phase 29 LANG-08 re-baselines ceilings. |
| F-28-009 | agent-factory/roles/orchestrator.md | 1 | deferred | 29 | § Reads, line 33 instructs reading `.grugops/factory.config.json` **first** and states no when-absent branch. Measured across the whole corpus: ZERO of the 17 roles and the protocol file state a config fallback, while CLAUDE.md's zero-config-first constraint requires roles to "run lean with sensible defaults when absent" and `agent-factory/config/factory.config.md:3` scopes role honouring to "when it is present". Recorded once, here, as the role-corpus-side view of the defect the claim registry records claim-side as F-28-204 (C-28-012) and F-28-212 (C-28-032) — one defect seen from two artifacts, deliberately not 17 duplicate rows and deliberately not silently dropped because another artifact mentions it. |
| F-28-010 | agent-factory/roles/orchestrator.md | 6 | deferred | 29 | § One job (line 11) and § Responsibilities step 4 (line 49) assign the decomposition of a request into subtasks, with no granularity rule, no size bound and no stopping condition. `agent-factory/workflows/17-task-claim.md`, which line 49 points at, governs claim/transition mechanics only (steps 1-6) and says nothing about how large a subtask is. The `XS=1 S=2 M=3 L=5 XL=8` scale at line 71 and at `agent-factory/seed/plans/board.md:110` sizes TICKETS, not subtasks. Two agents decompose the same request differently. RECORD-ONLY (D-07 category 6). |
| F-28-011 | agent-factory/roles/agents-md-scribe.md | 4 | fixed |  | Line 41 said the generic 12-rules pointer is carried by "the other 14 roles". Measured: `grep -l "Follow the 12 coding rules" agent-factory/roles/*.md` returns 16 files — every role except this one, which is the 17 `listRoles()` members minus the Scribe itself. A stale count left from a 15-role kit; the two roles added since (frontend-ui in Phase 13, and the count change) were never reflected. Corrected in place to 16, byte-neutral. |
| F-28-012 | agent-factory/roles/agents-md-scribe.md | 2 | deferred | 29 | Lines 32 and 39 instruct authoring `AGENTS.md` "to the §17.1 shape" and "per §17.1", naming a section without naming a document. It resolves to `docs/initial/agent_factory_builder_spec_v2.md:1449`, which is not part of the kit — the installed kit root is `$GRUGOPS_HOME/agent-factory` (`install/install.ts:136`) and `docs/` is not under it — so an agent reading this role in a host repo has nothing to open. Not a one-line fix: the honest correction is to drop the § reference and rely on the shape line 32 already enumerates inline, which is a rewrite of a shipped sentence and is LANG-02's work. |
| F-28-013 | agent-factory/roles/compliance-officer.md | 1 | fixed |  | Line 36 instructed the role to "fill `agent-factory/checklists/compliance-checklist.md` per ticket" — a WRITE into the read-only kit, directly contradicting `AGENTS.md:43` § Kit vs state ("`agent-factory/…` = read-only KIT ... never written"), which AGENTS.md declares a safety rule and which this role's own header block quotes. It was the only such instruction in the corpus: `release-manager.md:33`, `security-nfr.md:32` and `uat-planner.md:32` all say "work through" for their kit checklists. Re-narrated to "works through" rather than path-swapped — the same sentence already publishes the assessment as typed notes per Workflow 16, so the write it named was never the mechanism, only the wording. |
| F-28-014 | agent-factory/roles/security-nfr.md | 2 | deferred | 29 | Lines 32 and 36 defer compliance work "(see Section 13 — Security, Privacy, and Compliance)" and "per Section 13", a bare section of the same unshipped builder spec F-28-012 names. Same class, different file, and worse here because the sentence it qualifies is the hand-off that decides whether the Compliance Officer is engaged at all. |
| F-28-015 | agent-factory/roles/release-manager.md | 4 | deferred | 29 | § Board moves, line 43: "once a named human approves the deploy the role moves it to `Done`". The seeded board `agent-factory/seed/plans/board.md:71` names the `Done` column owner as **Orchestrator**, and `orchestrator.md:80` claims `… → Done` for itself with the parenthetical "(and released, in enterprise mode)". Two roles claim one exit against a board that names one owner. Deferred rather than fixed because deciding which of the two is correct is a design decision about release authority, and an audit that settles a design question by picking a side has stopped auditing. |
| F-28-016 | agent-factory/roles/brownfield-mapper.md | 2 | fixed |  | Line 35 dated the output to "the Phase-4 brownfield bootstrap workflow" — a grugops-internal build-phase label that names no shipped file and resolves to nothing in a host repo; the kit's workflow is `01-bootstrap-brownfield.md`. Fixed by deleting the label, not by substituting a path: "the brownfield bootstrap workflow" already names the one workflow that exists, and the edit REMOVES 8 bytes from a file that was already in ceiling WARN at 2746B against 2693B. No ceiling was raised and the file was not trimmed to fit one. |
| F-28-017 | agent-factory/roles/greenfield-mapper.md | 2 | fixed |  | The same defect at line 36, "the Phase-4 greenfield bootstrap workflow"; the kit's workflow is `00-bootstrap-greenfield.md`. Fixed identically by deleting the label; also byte-reducing, on a file also already in ceiling WARN (2924B against 2882B). |
| F-28-018 | agent-factory/roles/installer.md | 6 | deferred | 29 | § Responsibilities 1-2 (lines 30-31) say "Detect the host coding agent" and "Lay down the right adapter and entry file for that tool" with no detection procedure and no pointer to the per-tool table that does exist and does ship, at `agent-factory/packaging/adapters.md`. Line 36 says the mechanics are "packaging concerns owned elsewhere" without naming where. The gap is the POINTER, not the artifact — two agents given this file alone would detect differently and lay down different adapters. RECORD-ONLY (D-07 category 6). |
| F-28-019 | agent-factory/roles/architect-design.md | 6 | deferred | 29 | Line 31: "write ADRs for the choices a future maintainer will curse you for if the *why* is missing, not every minor pick" states the ADR threshold as a judgement with no test. `memory-bank/50-decisions/ADR-template.md` supplies a shape, not a trigger, and the one trigger that does exist in the kit — `agent-factory/checklists/definition-of-done-enterprise.md:21`, "ADR written for any structural decision" — is a different test and is not in this role's § Reads. Two agents produce different ADR sets from one design. RECORD-ONLY (D-07 category 6). |
| F-28-020 | agent-factory/roles/qe-e2e.md | 6 | deferred | 29 | Line 31: "Write E2E where it pays for its upkeep" carries no test for when that holds. The dial that actually decides it — `quality.ui_e2e` (`off` / `ui-or-critical-path` / `always`, consumed at `agent-factory/workflows/05-pr-quality-gate.md:35`) — appears zero times in this file and zero times in `seed/plans/board.md`, and this file references workflow 05 zero times, so nothing in its § Reads set reaches the dial either. RECORD-ONLY (D-07 category 6). |
| F-28-021 | agent-factory/roles/_role-switch-protocol.md | 3 | deferred | 29 | Lines 17-18 assert as fact: "Every entry point (the Orchestrator's responsibilities, every workflow's 'Agents involved' block) references THIS file by path. Nobody else inlines the steps." MEASURED FALSE on the first half. 16 of the 19 workflows reference `_role-switch-protocol`; `16-context-read-write.md`, `17-task-claim.md` and `18-context-compaction.md` do not — and all 19 carry an `Agents involved` block, so the exception is not that those three lack the block the sentence keys on. The second half holds: no file inlines the five steps. Deferred rather than fixed because the correction is a choice between weakening the claim and adding the reference to three workflow files, and those three files are plan 28-07's read set — fixing here would settle a question in a file this plan has not read. |
| F-28-022 | agent-factory/roles/_role-switch-protocol.md | 1 | deferred | 29 | Lines 7-15 call the single-window sequential role-load "the default substrate" and present coordinator spawning as what Claude Code "may instead" do, and lines 54-57 repeat the framing. v2.0 reversed that ordering for Claude Code: parallel scheduling is the shipped norm there and sequential is the third of three announced tiers (`agent-factory/packaging/adapters.md:35`). Like `orchestrator.md:88` this file names two modes and carries no tier vocabulary, which matters more here because the Degraded tier is the tier that points AT this file — a reader arriving from the tier announcement finds the tier it came from described as the default. Same class as F-28-008, and the two should be corrected together so one vocabulary lands in both files at once. |

**Finding ids are `F-28-NNN`, three zero-padded digits, and the parser refuses anything else.** This
is a canonical form with a refusal outside it rather than a pattern widened once per surprise.
Findings are banded so two plans never mint one id twice: `F-28-0NN` is this register's Table B,
`F-28-2NN` is the claim registry's (`docs/audit/28-claim-registry.md`).

**`F-28-001` … `F-28-007` are RESERVED AND PERMANENTLY UNUSED, and the reason is a measurement.**
28-03 handed plan 28-06 an obligation to renumber `docs/audit/28-residual-sizing.md`'s `F-28-A` …
`F-28-G` into those seven ids as Table B rows. **That is structurally impossible, and the parse
authority refuses it rather than accepting it.** Every one of the seven names a file OUTSIDE the
derived audit set — `.planning/ROADMAP.md`, `.planning/milestones/…/22-VERIFICATION.md`,
`scripts/context-io.ts`, `scripts/check-uat-oracles.ts`, `.planning/phases/28-…/`, `28-02-PLAN.md`
and `scripts/context-io.ts` again — while Table A holds only `agent-factory/` roles and workflows.
`readRegister()`'s foreign-key arm refuses a finding whose file has no Table A row, and 28-06
watched it do so on a mirror before writing anything:

```
audit-model: refusing to parse docs/audit/28-disposition-register.md — Table B's row at line 166
(F-28-001) names file ".planning/ROADMAP.md", which has no row in Table A.
```

The grammar was **not** widened, the ids were **not** forced into rows, and Table A was **not**
extended to admit them — extending it would break the D-03 equality this phase built and would add
non-kit files to a set whose whole definition is the derived kit. The seven remain findings of
`docs/audit/28-residual-sizing.md`, in that document, under their original letter ids, and the band
is left as a documented hole so a reader following the trail from the sizing document lands on
nothing rather than on an unrelated finding wearing the id they were looking for. This is the same
refusal plan 28-04 met from the other direction when it was told to file claim findings here.
