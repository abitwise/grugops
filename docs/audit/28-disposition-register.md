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

### The D-01 count amendment — "18 roles" corrected to 17 at three sites

**Made by plan 28-07, 2026-08-12.** `ROADMAP.md`'s phase entry, its success criterion 1, and
`REQUIREMENTS.md`'s AUDIT-01 text each described this phase as a pass over *"18 roles + 19
workflows"*. The derivation returns **17**: `kit-model.listRoles()` drops `_`-prefixed entries, so
`_role-switch-protocol.md` is out of set for counting. All three now say 17, and **each carries the
derivation rule in the same sentence as the number** — a bare `17` beside 18 files on disk invites
the next reader to "fix" it back, which is how the count became wrong in the first place. A fourth
site, the D-01 note under the phase's success criteria, instructed the amendment and now records
that it was made.

**Why this is recorded here and not as a Table B row.** The plan directs recording the amendment as
a finding row with disposition `fixed`. That is structurally impossible, and the refusal was watched
on a mirror before anything was written to the tree:

```
audit-model: refusing to parse docs/audit/28-disposition-register.md — Table B's row at line 387
(F-28-040) names file ".planning/ROADMAP.md", which has no row in Table A. A finding against a file
the register does not audit cannot be counted by either D-03 equality. If the note is about a file
with no Table A row, it belongs in `## Recorded couplings and out-of-set notes`, which exists for
exactly that case
```

The parse authority names this section as the correct home, so that is where the record went. This
is the **third** plan in the phase to meet this same instruction class — 28-04 was told to file claim
findings in Table B, 28-06 was told to renumber `F-28-A`…`F-28-G` into it, and this plan was told to
file a `.planning/` amendment. One constraint, three plans, three refusals, and the grammar was not
widened once.

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

### `28-08-PLAN.md` mislocates residual 2 — F-28-041, and why it is recorded rather than followed

**Recorded by plan 28-08, 2026-08-12.** This note lives here for the reason the section header
states: it names `.planning/phases/28-kit-consistency-audit/28-08-PLAN.md`, a file with no Table A
row. **Fourth plan in the phase to meet this constraint** — 28-04 was told to file claim findings in
Table B, 28-06 to renumber `F-28-A`…`F-28-G` into it, 28-07 to file a `.planning/` amendment, and now
this. Four plans, four times the grammar was not widened.

**The finding.** `28-08-PLAN.md` task 1 directs its executor to *"read the region of
`scripts/canonical-frontmatter.ts` the bypass reaches"*, and the plan's `files_modified`,
`must_haves`, `key_links` and threat register are written throughout as though residual 2 — the
byte-round-trip adjacency — lives in the canonical admission reader. **It does not.** Plan 28-02
measured the live class at `scripts/context-io.ts:400-403`, reached from `:508`, and computed the
import closures that put the two modules in disjoint graphs. The plan text predates that measurement
and was never reconciled to it.

**Recomputed in 28-08's own session by an independently written walker**, because inheriting the
number would be the defect this phase is auditing for:

```
closure(scripts/context-io.ts)            = 1: context-io.ts
closure(scripts/compactor.ts)             = 2: compactor.ts, context-io.ts
closure(scripts/canonical-frontmatter.ts) = 2: canonical-frontmatter.ts, frontmatter.ts
closure(scripts/frontmatter.ts)           = 1: frontmatter.ts
```

Disjoint in both directions, reproducing 28-02's result.

**Why the plan was not followed on this point.** There is no bypass in
`scripts/canonical-frontmatter.ts` to reproduce, so there is nothing there to fix. Editing a
safety-critical parser that took Phase 27 twelve rounds to close — two of which shipped a new
regression inside their own fix — in order to satisfy a plan sentence rather than a measured defect
is precisely what D-64 forbids, and the plan's own prohibitions say so: *"If the only fix you can
find is a widening, stop and record that as the finding rather than shipping it — that outcome is a
legitimate result of this task."* `git diff` on `scripts/canonical-frontmatter.ts` and
`scripts/frontmatter.ts` is empty across every commit of plan 28-08.

**What was done instead.** D-22's four-part bar was applied at full strength to the defect that does
exist, in `scripts/context-io.ts`. See `docs/audit/28-residual-sizing.md` §
*Residual 2 — reproduction at fix time (28-08)* for the reproduction, the loader differential, and
the three structural answers.

**One part of that bar is NOT satisfied, and it is recorded here rather than in a summary that a
later reader may not open.** D-22 part 3 requires **two independent red teams** — adversarial passes
by agents that did not author the fix. Plan 28-08's executor had no agent-spawning tool available in
its tool set, so no independent pass was commissioned. What exists is a five-attempt adversarial pass
run by the fix's **author**, which is explicitly the thing the plan's own threat register calls
insufficient (T-28-50: *"a red team run by the fix's author reviews the author's own assumptions"*).
The pass and its results are recorded in `28-08-SUMMARY.md`, labelled as non-independent. **The
independence gap is real and is the central question at this plan's blocking checkpoint.**

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
| agent-factory/workflows/00-bootstrap-greenfield.md | workflow | yes | yes | 0 | The greenfield entry point and one of only two workflows that stand up the project plane rather than move a ticket through it. Read against all six categories and found in order: the five named agents all resolve to `listRoles()` members, `memory-bank/greenfield-plan.md` is correctly named as a runtime output the Greenfield Mapper writes rather than a seeded template (which is why the pre-pass flagged it and why that hit is a false positive), and the `Backlog -> Ready` / `In Analysis` / `In Design` exits it assigns match `seed/plans/board.md` owner for owner. Its `Metrics emitted` section is the honest one in the corpus — it says none beyond seeding rather than inventing a bootstrap metric, which is exactly the mistake workflows 02 and 03 make. One near-miss adjudicated and not raised: listing `.grugops/factory.config.json` under Inputs while step 6 confirms its presence looks circular, but the installer seeds that file at `install/install.ts:862` before any bootstrap runs, so the input is genuinely present. |
| agent-factory/workflows/01-bootstrap-brownfield.md | workflow | yes | yes | 0 | The brownfield twin of workflow 00 and structurally parallel to it section for section. Checked and in order: the Security/NFR result set `PASS` or `PASS_WITH_RISKS` or `BLOCKED` matches the vocabulary `15-security-audit.md` uses for the same role, the `In Security/NFR` exit it assigns matches the seeded board, and its stop condition on a `BLOCKED` scan is a real gate rather than advice. It is the only bootstrap workflow that names a role in Steps which it does not name in `Agents involved` -- BA/PM appears at step 5 but not in the agent list, a gap the reader notices and which is one line to close, recorded here rather than raised as a finding because the surrounding sentence already makes the ownership unambiguous and Phase 29 LANG-05 owns the `Agents involved` block shape. Its `UNKNOWN - verify` posture on command slots is the strongest in the workflow corpus and states its own reason. |
| agent-factory/workflows/02-idea-to-epics.md | workflow | yes | yes | 1 | The smallest workflow in the kit at 2716B and the cleanest single-role one -- BA/PM alone, four steps, no cross-role seam. Its INVEST-adjacent instructions are concrete, `plans/epics/` resolves, and the `Backlog -> Ready` exit matches the seeded board. Its one defect is in the section a reader skims: `Metrics emitted` instructs recording `Throughput` and `Lead time` at the moment epics land in `Backlog`, and both of those metrics are defined in `seed/plans/metrics.md` as terminating at `Done` (F-28-023). That is the first of the corpus-wide metric mis-assignments this read found, and it is the clearest instance because workflow 00 -- which seeds the very same board -- explicitly declines to emit a metric at the same moment. |
| agent-factory/workflows/03-epic-to-tickets.md | workflow | yes | yes | 1 | The ticket-cutting workflow, and the one whose sizing and priority vocabulary had to be checked against three separate authorities: the `XS`/`S`/`M`/`L`/`XL` scale matches `orchestrator.md:71` and `seed/plans/board.md:110`, `P0`-`P3` matches the live config `priority_scheme`, and the `SPLIT_REQUIRED` signal matches the orchestrator's XL-split rule word for word. `definition-of-ready.md` resolves and is named at both the step and the stop-condition level, so the gate is not merely mentioned. Its `In Analysis` exit matches the board. The single finding is the same `Throughput` mis-assignment workflow 02 carries, at a different moment in the same lifecycle (F-28-024) -- recorded per site rather than folded into one row, because a reader arriving at this file needs its own row to say so. |
| agent-factory/workflows/04-ticket-to-pr.md | workflow | yes | yes | 2 | The main delivery path and the workflow most other files reference. Its discipline is real: it names workflow 05 for the gate and explicitly refuses to restate the loop, which is the anti-duplication posture LANG-05 will want preserved rather than collapsed. The `quality.tdd` dial values `off` / `encouraged` / `required` and the default `encouraged` match the live config exactly, the double-loop and contract-vs-logic seam rules are stated with a pointer to `example-mapping.md` rather than a copy, and the full `Ready for Dev -> In Development -> In Review (-> In Security/NFR)` path matches the seeded board owner for owner. Both findings sit in text a reader is likely to trust and should not: a forward promise of mechanical enforcement that no phase owns (F-28-025) and an HTML comment carrying a grugops-internal decision id into a shipped file (F-28-026). |
| agent-factory/workflows/05-pr-quality-gate.md | workflow | yes | yes | 3 | By far the largest file in the audit set at 13831B -- nearly three times the workflow median -- and the densest safety surface in the corpus after the compliance role. It is the single source of the backpressure loop and it earns that billing: the three terminal results, the human-only short-circuit, the bounded `self_fix_attempts` budget, the green-verdict-only emission rule and the no-faked-pass escape hatch are each stated once and correctly, and the `mandatory_gates` / `coverage_threshold` / `ui_e2e` / `self_fix_attempts` / `gate_enforcement` / `test_integrity` keys all resolve in the live config. Its three findings are all about the boundary between grugops-the-repository and grugops-the-installed-kit: config defaults restated inline where a host may have dialled them (F-28-027), the verdict emitter named at a path no host install materializes (F-28-028), and a Tier-2 lane whose `npm run test:e2e` means something different in a host repo than it does here (F-28-029). |
| agent-factory/workflows/06-uat-pack.md | workflow | yes | yes | 2 | The human-signoff workflow and the business-acceptance gate, paired with `uat-planner.md` which carries the least substitutable safety sentence in the kit. Its stop condition and done condition both make the named human signoff non-optional and it never offers a self-sign path, which is the property that matters most here. `uat-checklist.md` resolves and it uses the correct non-writing verb for a kit checklist. Its two findings are both about where a ticket goes next rather than about acceptance itself: the lean-mode shortcut makes this the third file claiming the `Done` exit against a board that names one owner (F-28-030), and its `Lead time` emission double-counts with workflow 12 for the same ticket in enterprise mode (F-28-031). |
| agent-factory/workflows/07-backlog-refinement.md | workflow | yes | yes | 0 | The refinement ceremony, and the workflow that reads its dial most carefully in the whole corpus -- step 3 reads `bdd` inline and enumerates all three values with the absent-means-lean fallback spelled out, which is the exact when-absent branch that ZERO of the seventeen roles state (the corpus-side gap recorded as F-28-009). It is the counter-example that proves that gap is a defect rather than a house style. Everything else checks: `definition-of-ready.md` and `example-mapping.md` both resolve, the `Backlog -> Ready` exit matches the seeded board and BA/PM owns it there too, `priority_scheme` and tshirt sizing match the live config, and `Metrics emitted` correctly declines to invent a refinement metric and says why. No finding. |
| agent-factory/workflows/08-sprint-planning.md | workflow | yes | yes | 2 | One of only two `cadence: scrum` workflows, and it gates itself honestly -- it states at the top that the Orchestrator selects it only when `config.cadence=scrum` and that in kanban it never fires, so a lean reader knows immediately it does not apply. Its stop condition routes a thin `Ready` column back to workflow 07 by name rather than inventing work, which is the correct backpressure. Its two findings are the two numbers it depends on: a field list deferred to a spec section that ships in no install (F-28-032), and `sprint_length_days` read as the capacity the pull is bounded by when the config documents it as a duration and supplies no capacity key at all (F-28-033). Those are the same two questions an agent must answer to run step 2, which is why both are recorded rather than one. |
| agent-factory/workflows/09-daily-sweep.md | workflow | yes | yes | 0 | The reconciliation and throttle pass, and the workflow with the most checkable claim in the corpus: it names thirteen board columns as the frozen set, and those thirteen match `seed/plans/board.md` exactly -- same members, same order, verified as an ordered set equality at run time rather than by eye. That is worth stating because it is the one place a workflow enumerates a set that lives elsewhere and gets it right, where workflow 05 restates config values and this file does not. Its three named config keys resolve, `blocked_escalation_days` default 2 matches the live value, and its metric emissions (`Cycle time`, `WIP`, `Blocked time`) are the three the frozen metric set actually defines for in-flight work -- the only workflow in the corpus whose metric choices survive checking against `seed/plans/metrics.md` definitions unchanged. No finding. |
| agent-factory/workflows/10-sprint-review.md | workflow | yes | yes | 1 | The scrum closing ceremony and the other `cadence: scrum` file, gated with the same honest never-fires-in-kanban sentence workflow 08 carries. It is disciplined about not creating artifacts -- it appends to the existing sprint file and says do not start a new file, it authors no new trace rows, and it confirms rather than mints `Done` transitions, which keeps it clear of the `Done` ownership collision workflows 06 and 12 each walk into. `Velocity` is the correct frozen-set metric for a scrum close. Its one finding is a single parenthetical in `Board moves` that offers two different destinations for a carry-over item without a rule for choosing (F-28-034). |
| agent-factory/workflows/11-retro.md | workflow | yes | yes | 0 | The improvement loop, owned by the Factory Coach alone. Its central claim was checked rather than accepted: it calls `plans/metrics.md` the frozen 9 and that file defines exactly nine metrics, and the three it names as examples (`Throughput`, `Cycle time`, `Rework rate`) are all members. It correctly claims no board transition of its own and routes its improvement tickets into `Backlog` like any other captured work. Its stop condition is unusually good -- when there is not enough metric history it says to record that and defer rather than invent a waste, which is the no-fabrication floor applied to the one role whose output is an opinion about the factory. No finding. |
| agent-factory/workflows/12-release.md | workflow | yes | yes | 0 | The workflow that holds the production gate, and it holds it in four independent places -- step 6, `Board moves`, the stop condition and the done condition each restate that a named human approves and confirms, and the `Commit` section closes by saying the commit records the release and does not deploy it. That repetition is deliberate rather than sloppy: it is the one gate where a reader skipping a section must still hit the rule, and it is load-bearing text no style pass may compress. `production_requires_human_confirmation` matches the live config at `true`, the three-value status set `READY_TO_RELEASE`, `BLOCKED`, `RELEASED` matches `release-manager.md` exactly, and `release-readiness-checklist.md` and `plans/nfr-catalog.md` both resolve. Its `Ready to Release -> Done` transition is the same collision F-28-015 records against the role and F-28-030 records against workflow 06; recorded there, not duplicated here. No finding of its own. |
| agent-factory/workflows/13-incident.md | workflow | yes | yes | 0 | The post-release enterprise workflow, and one of only two files whose frontmatter carries `tier: enterprise` instead of a `cadence` key -- a shape difference from the other seventeen that was checked against `scripts/validate-agent-factory.ts` and is not a violation, since the validator asserts section headings and not frontmatter keys. Its ordering is its safety property: mitigate before analysis, stated in the step list, in the stop condition and in the role. `memory-bank/70-runbook.md`, `plans/releases/` and `plans/nfr-catalog.md` all resolve, and `Escaped defects` is the correct frozen-set metric for a prod incident. One candidate finding was drafted and then killed by checking its premise -- the `INC-xxxx` id this file mints looked absent from the trace schema, but `seed/plans/traceability.md:26` defines it, one line past where a shorter read would have stopped. No finding. |
| agent-factory/workflows/14-ui-design-to-build.md | workflow | yes | yes | 0 | The UI path, and the workflow that delegates hardest -- it points at workflow 04 for the build and workflow 05 for the gate and restates neither loop, and it says so explicitly at both steps. `WCAG 2.2 AA` matches the live config `nfr.a11y_target` of `WCAG-2.2-AA` and the same bar in `frontend-ui.md`, the five states are named identically in both files, and `accessibility-checklist.md` resolves. It carries no `Metrics emitted` section, which was checked against the validator rather than assumed a defect: `WORKFLOW_SECTIONS` at `scripts/validate-agent-factory.ts:217` omits it deliberately with the comment that it is bonus and not asserted, so its absence here and in workflows 15 through 18 is sanctioned. Its four stop conditions are the most complete in the corpus and each names what must not be done rather than only when to stop. No finding. |
| agent-factory/workflows/15-security-audit.md | workflow | yes | yes | 0 | The deep ASVS audit, and the file carrying the corpus's most falsifiable numeric claim -- that the filtered set is 70 requirements at L1, 253 at L2 and 345 at L3. Counted from the generated checklist at run time: 345 requirement rows, 70 at L1, cumulative 253 at L2 and 345 at L3. The claim is exactly right, and it is right because the checklist is generated from pinned ASVS 5.0 rather than hand-transcribed. The read-time-filter statement is equally checkable and equally correct -- the checklist file says the same thing in its own header and is not regenerated when the dial moves. `security.asvs_level` and `security.block_on` resolve to `L1` and `high` in the live config, and the severity map matches `security-nfr.md`. Its cleanest property is that it refuses to block: enforcement is deferred to workflow 05 by name, in the steps and again in a stop condition. No finding. |
| agent-factory/workflows/16-context-read-write.md | workflow | yes | yes | 2 | The first of the three seam workflows and the second-largest file in the audit set at 9255B. It is the single source of the admission protocol -- read-before-act, write-after-verify, and the three admission outcomes stated once -- and it is the file every other workflow and role defers to for note I/O. Its honesty is unusually good in the places that matter: it names the `§14-gate` self-attestation carve-out as a carve-out, calls any other note authored by that identity a structural FAIL, and states plainly that the four non-Claude-Code CLIs are not mechanically un-forgeable. It is also one of the three seams that carry no `_role-switch-protocol.md` reference, which resolves F-28-021's open half by measurement -- a seam has no owning specialist and is passed through by an already-active role, so it has no activation to route, and the correction belongs on the protocol file's claim rather than here. Both findings are about reach rather than about the protocol: the sole sanctioned writer is named at a path no host install materializes (F-28-035), and the hook that makes the human stamp un-forgeable is wired at plugin level only, leaving a fifth surface the sentence does not name (F-28-036). |
| agent-factory/workflows/17-task-claim.md | workflow | yes | yes | 1 | The queue seam, and the file that draws the sharpest distinction in the kit: its `The claim/note seam` section separates the atomic directory-create work CLAIM from the `claim` note KIND and states they share no code path, which is precisely the conflation a reader would otherwise make from the shared word. `Board moves` draws the same line again between the queue and the board and says neither moves the other. The `EEXIST`-means-lost versus any-other-code-is-a-real-error rule is stated at step 2 and again as a stop condition, so a swallowed error is refused twice. `queue.stale_ttl_minutes` resolves in the live config, and the wall-clock-only, no-liveness limit of the sweep is named rather than glossed. Like workflows 16 and 18 it carries no role-switch reference, coherently. Its one finding is that `scripts/claim.js`, the module every step calls by name, is not installed into a host repo (F-28-037). |
| agent-factory/workflows/18-context-compaction.md | workflow | yes | yes | 2 | The third seam and the largest workflow after the quality gate at 9829B. Its `body/structure seam` is the strongest single idea in the workflow corpus -- the agent owns the words and the tool owns the structure, with an explicit instruction never to ask the tool to summarize -- and the carve-out is correctly described as un-dialable at every value of `context.compaction`, which matches how `quality.test_integrity` has no `off`. The dial's three values and the absent-means-`aggressive` default match the live config and `factory.config.md:146` exactly, including the read-at-point-of-use rule. Its two findings are the same host-reach class the other two seams carry, in a sharper form: `scripts/compactor.ts` is the mechanical floor the whole workflow rests on and is not installed (F-28-038), and the claim that the ephemeral tier is gitignored is true of this repository and of no repository the kit is installed into (F-28-039). |
| agent-factory/roles/_role-switch-protocol.md | protocol | no | yes | 2 | The single source for HOW a role activates — five ordered steps plus the invariant that a role's only memory of earlier roles is the shared verified context. It is out-of-set for COUNTING because `listRoles()` drops underscore-prefixed entries by derivation, which is what makes the role count 17 rather than the 18 files on disk; it is in-set for READING because a derivation not reaching a file is not a reason to leave it unread, and this file was the likeliest drift carrier in the tree. The read settles that: the carried-in candidate is REFUTED — step 4 no longer demands a handoff file, it says "RECORD the work output as typed notes per Workflow 16", and the file carries zero occurrences of `handoff` in any form, including forms `RETIRED_PATH_FORMS` cannot match. What the read did find is two claims the file makes about the rest of the kit that no longer hold (F-28-021, F-28-022). It is a safety surface: it states the coordinator-only spawn rule and the shared-context-is-the-only-channel invariant, both admission text. |

**`—` is the unfilled `safety_surface` marker**: the parser admits it and the gate refuses to pass
while any row still carries it. Writing `no` into an unread row would record a verdict nobody
reached, and writing an unparseable value would make the register unreadable rather than incomplete.
D-18 derives Phase 29's LANG-02 exclusion list from this column unioned with the claim registry's
`kind: safety` rows, so an unearned `no` here becomes a missing exclusion two phases later. **Plan
28-06 filled the 17 role rows and the protocol row; plan 28-07 filled the 19 workflow rows. No row
carries the marker any more, and the gate is green for that reason and no other.**

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

**The workflow half came out the same way, and the prediction 28-06 made was correct: the column is
now `yes` on all 37 rows, `no` on none.** This was measured rather than assumed. Every one of the 19
workflows carries permission-bearing or no-fabrication text, and the least of them carries it in the
`## Commit` section alone — *"Never merge, never deploy; humans hold both"* appears in every workflow
file in the corpus, so the flag is forced by a sentence each file already ships rather than chosen by
a reader's judgement. The densest are `05-pr-quality-gate.md` (the human-only short-circuit, the
no-faked-pass floor, the green-verdict-only emission rule), `12-release.md` (the human deploy gate,
restated in four sections) and `16-context-read-write.md` (the whole admission protocol).

**So D-18's derived exclusion list is every file in the audit set, and that is the honest output
rather than a failure of the measurement.** What it means for Phase 29 is what 28-06 already wrote
one paragraph above and what this plan can only confirm from the other half of the corpus: a
per-file flag cannot narrow LANG-02's work, because the question LANG-02 actually faces is which
*sentences* are load-bearing. Recording 37 honest `yes` values and saying plainly that the resulting
list excludes everything is a smaller error than inventing a `no` to make the list look selective.

## What plan 28-07 re-verified rather than accepted (D-19)

**Every `fixed` disposition recorded anywhere in this phase was re-checked against the tree**, on the
standing lesson that a summary claiming a fix and a fix are different things. **Four register rows
were checked and four held**, each by reading the file and by a counter-check that the pre-fix text
is absent: F-28-011 (`agents-md-scribe.md:41` now reads *"the other 16 roles"*, and 16 role files
carry the pointer), F-28-013 (`compliance-officer.md:36` now reads *"and works through"*, and no file
in the kit instructs filling a kit path), F-28-016 and F-28-017 (both `Phase-4` labels gone; zero
occurrences of `Phase-4` remain anywhere under `agent-factory/roles/`).

**Beyond the register**, the fixes the other plans recorded were re-verified the same way rather than
inherited: the claim registry holds **zero** `false` rows and `check-claim-anchors.js` exits 0 with
37 byte-identical verbatim comparisons, so 28-05's eight prose corrections are confirmed by a byte
compare and not by its own account of them; both hygiene directories are gone from the tree;
`check-public-docs-vocabulary.js` exits 0 with `RETIRED_PATH_FORMS` and `PUBLIC_DOCS_SCAN_COUNT`
unchanged; the D-19 item 6 pins read `1.62.1` and `4.12.1` at all three sites; and D-19 item 7's
three `WR05_BEATS` regexes each carry a consuming `[\s\S]` atom after their lookaheads with the named
`WR05_MAX_LINE_BYTES` bound present, with the foundation gate returning in **106 ms**.

**The eight D-19 standing items each carry a closed disposition** in
`docs/audit/28-residual-sizing.md`. One reconciliation is recorded here rather than by editing that
document, which is outside this plan's scope: **item 8's disposition names plans 28-03 and 28-06 as
the recorders of the determinism findings, and the correct list is 28-06 and 28-07.** Plan 28-03
built the machinery and recorded no finding; 28-06 recorded four category-6 findings and 28-07
recorded two more (F-28-033, F-28-034), for six in total. The disposition itself — record-only,
deferred to Phase 29 — is unchanged and correct.

## F-28-021's open half, answered by reading rather than left open

28-06 recorded that `_role-switch-protocol.md:17-18` asserts every workflow references it by path,
measured that **16 of 19 do** and that `16-context-read-write.md`, `17-task-claim.md` and
`18-context-compaction.md` do not, and deferred the correction because those three were 28-07's
unread set. They have now been read, and **the answer is that the claim should be weakened, not that
the three files should gain the reference.** All three are seam workflows and each says so in its own
`## Agents involved` block — *"a seam workflow, not an SDLC stage: it has no owning specialist and no
queue of its own"* — and a role does not activate INTO a seam, it passes through one while already
active. There is no role switch to route, so the reference would name a protocol the file never
invokes. **No new finding was minted for this**, because the defect is a sentence in
`_role-switch-protocol.md` and F-28-021 already holds that row; recording a duplicate against three
workflows would have made one defect look like four and put the fix in the wrong file.

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
| F-28-023 | agent-factory/workflows/02-idea-to-epics.md | 4 | deferred | 29 | `## Metrics emitted`, line 34: "Record `Throughput` and `Lead time` in `plans/metrics.md` as epics land in `Backlog`." Both names are members of the frozen metric set and both are defined there as terminating at `Done` — `seed/plans/metrics.md:17` defines `Throughput` as "tickets reaching Done per period" and line 19 defines `Lead time` as "Backlog -> Done, median". An epic ENTERING `Backlog` starts the lead-time clock; it completes nothing and it is not a ticket reaching Done. Measured against the definitions rather than against the metric names, which is why the pre-pass could not see it. Workflow 00, which seeds the very same board, declines to emit a metric at the same moment and says why — so the correct behaviour already exists one file away. Deferred: choosing between deleting the emission and defining an intake counter is a design call about the frozen metric set, and an audit that adds a tenth metric has stopped auditing. |
| F-28-024 | agent-factory/workflows/03-epic-to-tickets.md | 4 | deferred | 29 | `## Metrics emitted`, line 36: "Record `Throughput` in `plans/metrics.md` as tickets are created." Same defect as F-28-023 at a different moment in the same lifecycle: `Throughput` is defined at `seed/plans/metrics.md:17` as tickets reaching `Done` per period, and creating a ticket is the opposite end of the flow. Recorded as its own row rather than folded into F-28-023 because the two sit in different files and Phase 29 LANG-02 acts per file — a reader arriving at this file needs its own row to say so, which is the same reason F-28-016 and F-28-017 were recorded separately for one defect in two mapper roles. |
| F-28-025 | agent-factory/workflows/04-ticket-to-pr.md | 3 | deferred | 29 | Step 4, line 28: "Mechanical no-second-red / one-behavior-one-layer enforcement is planned for that quality gate (`agent-factory/workflows/05-pr-quality-gate.md`); this step does not enforce it." MEASURED: `05-pr-quality-gate.md` contains zero occurrences of either term, and a repository-wide grep outside `.planning/` returns exactly one hit — this sentence itself. The deferral target was Phase 15, recorded only in archived v1.2 planning documents (`12-03-PLAN.md`, `12-SECURITY.md`); `ROADMAP.md:65` shows Phase 15 completed 2026-06-13 as the TypeScript migration, and no roadmap phase or requirement names this enforcement. So a shipped kit file tells a host user that a mechanical check is coming, the phase it was deferred to has shipped without it, and the only record of the deferral lives in a directory archived at milestone close. Deferred rather than fixed because the honest correction is either to delete the promise or to give it an owner, and giving it an owner is a roadmap decision this phase may not take. |
| F-28-026 | agent-factory/workflows/04-ticket-to-pr.md | 5 | deferred | 29 | `## Trace updates`, line 37, an HTML comment: "The acceptance scenarios are carried forward to the UAT pack and release — they flow forward, NOT rewritten here. A deeper UAT-BDD treatment is its own later concern (D-13)." The carry statement is correct and useful. The `(D-13)` is a grugops-internal phase-12 decision id shipped into a host repository, where it resolves to nothing — the decision lives in `.planning/milestones/v1.2-phases/12-bdd-tdd-wiring/`, which is archived and was never installed. It is also invisible in any rendered view, so the one reader who could act on it is an agent reading raw bytes. Same class as the `Phase-4` labels fixed under F-28-016 and F-28-017, but NOT fixed the same way: those were dangling labels inside a live sentence, this is a whole comment whose keep-or-delete question is about whether the carry rule should be visible prose instead, which is LANG-02's call. |
| F-28-027 | agent-factory/workflows/05-pr-quality-gate.md | 4 | deferred | 29 | Step 3, line 31 restates three config values inline: `mandatory_gates` as `["lint","typecheck","unit","build"]`, `coverage_threshold` as `0.8`, and `ui_e2e` as `"ui-or-critical-path"`. All three were compared against `agent-factory/config/factory.config.json` and all three match the shipped defaults today, so this is a LATENT defect rather than a live one — and that is exactly why it is worth a row. These are a duplicated set literal inside a workflow whose own step says the values are config-dialed: a host that lowers `coverage_threshold` or removes a gate leaves this sentence asserting the shipped default as the floor, and nothing reds. This is the hand-maintained-set-drift class this repository has diagnosed as one of its two systemic failure modes, sitting inside the phase auditing for it. Workflow 09 shows the alternative — it names its config keys and does not restate their values. Deferred: the fix is a prose rewrite of a shipped step, which is LANG-02's. |
| F-28-028 | agent-factory/workflows/05-pr-quality-gate.md | 2 | deferred | 29 | Step 5, lines 47 and 49, and the `## Commit` section at line 74, delegate verdict emission to `scripts/context-io.ts` ("`node scripts/context-io.js` exposes it") and forbid an inline write. MEASURED: `install/` contains ZERO references to `context-io` — the installer's `RUNNABLES` list at `install/install.ts:1215-1217` materializes exactly two files into a host repo, `tools/grugops/reference-check.js` and `tools/grugops/test-skip-integrity.js`, and the kit `cpSync` at line 1065 copies `agent-factory/` only. `package.json` is `private: true`, so a host cannot install it either. Under the Claude Code PLUGIN form the file does exist, at `${CLAUDE_PLUGIN_ROOT}/scripts/context-io.js` — a path this workflow never names. So on the standalone install form and on the four non-Claude-Code CLIs the sole sanctioned emitter is absent, and the step's own prohibition on an inline write leaves no sanctioned path at all. Same defect class as F-28-035, F-28-037 and F-28-038; four files, one root cause. |
| F-28-029 | agent-factory/workflows/05-pr-quality-gate.md | 5 | deferred | 29 | Step 3, line 41: the Tier-2 auto-UAT lane is specified as `npm run test:e2e`. That script exists in THIS repository's `package.json` and is grugops's headless `claude --print` lane. In a host repository `npm run test:e2e` is the host's own end-to-end suite, an entirely different thing, and the step gives it no not-present fallback — unlike the Tier-1 step directly above it at line 39, which explicitly says the script "ships with grugops's own tooling, not every host" and records `UNKNOWN - verify` when absent. So two adjacent steps in one list treat the same host boundary in opposite ways, and the more dangerous of the two is the one that stays silent: an agent running the host's real e2e suite under a step described as "dev/CI-only" and "self-skips on unauth" will not get the loud skip the paragraph promises. Recorded as strangeness rather than as a reference defect because the string resolves in both repositories and means different things in each. |
| F-28-030 | agent-factory/workflows/06-uat-pack.md | 4 | deferred | 29 | `## Board moves` line 30 and `## Done condition` line 42: "the ticket moves to `Ready to Release` (or directly to `Done` in lean mode)". This makes the UAT Planner the THIRD claimant on the `Done` exit against a board that names one owner. `seed/plans/board.md:71` names `Done`'s exit owner as Orchestrator; `orchestrator.md:80` claims `… → Done` for itself; `release-manager.md:43` claims it after a named human approves, which is F-28-015; and this file claims it in lean mode. Workflow 05 line 57 states the rule the other three are measured against — "The gate does not move work to `Done` — only a human-approved merge (and released, in enterprise mode) does." Recorded separately from F-28-015 because that row names the role file and this names a workflow, and the two are corrected in different files; the two should be corrected together so one ownership rule lands everywhere at once. Deferred for the reason F-28-015 gives: choosing the owner is a design decision about release authority. |
| F-28-031 | agent-factory/workflows/06-uat-pack.md | 4 | deferred | 29 | `## Metrics emitted`, line 36: "Record `Lead time` in `plans/metrics.md` as the ticket clears acceptance." `12-release.md:40` records the same metric for the same ticket "as the release clears". `Lead time` is defined at `seed/plans/metrics.md:19` as "Backlog -> Done, median" — one value per ticket — so in enterprise mode, where a ticket passes through both workflows, it is written twice from two different clock stops and the second is the correct one. In lean mode, where UAT exits to `Done` directly, this file's emission is the right one. The defect is that neither file states its mode condition, so the double-count is invisible from either side. Same family as F-28-023 and F-28-024 and found the same way, by reading the frozen definitions rather than the metric names. |
| F-28-032 | agent-factory/workflows/08-sprint-planning.md | 2 | deferred | 29 | Step 4, line 26: "Write `plans/sprints/SPRINT-xx.md` in the §6.2 format — reproduce the field list exactly". The section number was checked rather than assumed and it is CORRECT — `docs/initial/agent_factory_builder_spec_v2.md` §6.2 spans lines 635-678 and the sprint field list sits at 659-676, inside it, with §6.3 starting at 679. The defect is only that the document does not ship: the installed kit root is `$GRUGOPS_HOME/agent-factory` (`install/install.ts:136`) and `docs/` is not under it, so a host agent has nothing to open. Third instance of the same class, after F-28-012 (§17.1) and F-28-014 (Section 13), and the least severe of the three because this step immediately reproduces the nine fields inline — the reference is redundant rather than load-bearing, which is also why the honest fix is to delete it and is a prose edit LANG-02 owns. |
| F-28-033 | agent-factory/workflows/08-sprint-planning.md | 6 | deferred | 29 | `## Inputs required` line 19 names "capacity (`sprint_length_days`, default 10)" and step 2 says to "Pull from the `Ready` column by priority, up to capacity … (Orchestrator respects `sprint_length_days` …)", while the sprint file's own `Capacity` field at line 29 is defined as "points or ticket count". `sprint_length_days` is documented at `agent-factory/config/factory.config.md:19` as "Sprint length in days" and the live config sets it to 10. A duration is not a point budget, and no key in the config supplies one. Two agents planning the same sprint from the same `Ready` column and the same config therefore commit different amounts of work — one reading 10 as ten days of unspecified capacity, one as ten points, one as ten tickets. RECORD-ONLY (D-07 category 6). |
| F-28-034 | agent-factory/workflows/10-sprint-review.md | 6 | deferred | 29 | `## Board moves`, line 31: "Carry-over items stay where they sit (or return to `Ready` at the next planning), recorded as Carried out in the sprint file." The parenthetical offers a second destination with no rule for choosing between them and no actor named for the choice. The two outcomes are materially different — an item left in `In Development` holds a WIP slot that workflow 09's throttle counts, while an item returned to `Ready` frees it and re-enters workflow 08's pull by priority — so the ambiguity has a measurable effect on the next sprint's capacity, not merely on wording. Neither `08-sprint-planning.md` nor `09-daily-sweep.md` settles it from their side. RECORD-ONLY (D-07 category 6). |
| F-28-035 | agent-factory/workflows/16-context-read-write.md | 2 | deferred | 29 | Line 11 states the load-bearing rule: "The only sanctioned writer of the shared context is `scripts/context-io.ts` (compiled to `scripts/context-io.js`). No role and no workflow writes the `.grugops/context/` path by any other path." Steps 1, 3 and 4 and the stop conditions each call it by that path. MEASURED: the installer never materializes it — `grep -rn "context-io" install/` returns zero, `RUNNABLES` at `install/install.ts:1215-1217` ships two unrelated files, and the kit `cpSync` copies `agent-factory/` only. This is the most consequential instance of the class because the rule is stated as an absolute and the stop condition at line 48 refuses the only remaining alternative ("The only way to record the result would be to hand-write the `.grugops/context/` path → stop"), so a host agent following this workflow correctly must stop and can never record anything. The kit is also silent about where the module comes from: `AGENTS.md` and `agent-factory/README.md` name it zero times. Deferred rather than fixed because the correction is either a packaging change or a documented host prerequisite, and both are architectural. |
| F-28-036 | agent-factory/workflows/16-context-read-write.md | 3 | deferred | 29 | Step 3, line 32 asserts that the `human:<name>` stamp "is made un-forgeable by the separate PER-CALL PreToolUse `admission-guard` hook", qualified as "the Claude Code primary tier", and closes by naming the degradation: "the four non-CC CLIs degrade to the in-script `admit()` refusal plus a prompt-level 'stop, ask a named human,' documented honestly as not mechanically un-forgeable". That qualification is real and is most of the honesty this row needs. What it misses is a FIFTH surface: `hooks/hooks.json` wires `admission-guard.js` as a PLUGIN-level PreToolUse hook and that is the only hook wiring in the repository, so the guard does not fire in the standalone `.claude/` install form either — a Claude Code user on the standalone path reads "Claude Code primary tier" and gets the degraded one. Exactly the shape 28-04 measured for the prod-deploy guard at C-28-023, where `install/install.ts:1571` prints in the installer's own output that the guard is plugin-only. Deferred: the correction is one clause in a shipped safety sentence, and LANG-03 must not reword this file without it. |
| F-28-037 | agent-factory/workflows/17-task-claim.md | 2 | deferred | 29 | Steps 2, 3, 5 and 6 and two stop conditions call `scripts/claim.js` by name — `claimTask`, `transition` and `sweepStale` — and step 2 makes the atomic `mkdirSync` the definition of ownership, so the module is not a convenience but the concurrency net the whole substrate rests on. MEASURED: `grep -rn "claim\.js" install/` returns zero and the module is absent from `RUNNABLES`, so it is not installed into a host repo. Same root cause as F-28-028, F-28-035 and F-28-038. Recorded per file rather than once because each names a DIFFERENT module and Phase 29 acts per file, which is the distinction that separates this from F-28-009's single corpus-wide row for one identical sentence repeated seventeen times. |
| F-28-038 | agent-factory/workflows/18-context-compaction.md | 2 | deferred | 29 | Step 3 hands the proposed promoted set to `scripts/compactor.ts` and calls it "the mechanical floor the tool enforces", instructing the reader not to re-implement the field set as protocol the agent self-polices but to "run the checker and honor its refusal"; the first stop condition is the checker refusing. Step 4 additionally requires promotion "ONLY via `scripts/context-io.ts` `appendNote`". MEASURED: neither module is installed — `grep -rn "compactor" install/` returns zero and `RUNNABLES` ships neither. The consequence here is sharper than for the sibling findings: this workflow's entire safety argument is that the un-cheatable floor is mechanical rather than self-policed, and on a host install there is no mechanism, so the agent self-polices exactly the way the step forbids. Fourth and last file in the class. |
| F-28-039 | agent-factory/workflows/18-context-compaction.md | 3 | deferred | 29 | Line 33 states the local tier is "never committed" and the `## Commit` section at line 72 asserts as fact: "The ephemeral `threads/` tier is gitignored and is never committed." MEASURED: the rule that makes this true is `.gitignore:12` in the grugops repository (`**/.grugops/context/*/threads/`), and the installer writes no `.gitignore` into a target — `grep -rn "\.gitignore" install/*.ts` returns zero hits that write one. So the sentence is true of this repository and false of every repository the kit is installed into. It is worse than an inert stale claim because the same section instructs committing the surrounding `notes/` and `index.*` artifacts, so an agent staging that directory sweeps in the verbose per-agent trajectory the workflow just told it is local-only and ephemeral — the opposite of the two-tier property. Deferred rather than fixed: the honest correction is either a seeded ignore rule at install time or a restatement of the claim, and the first is an installer change outside this plan. |

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
