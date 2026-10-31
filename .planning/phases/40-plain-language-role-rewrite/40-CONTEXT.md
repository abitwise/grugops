# Phase 40: Plain-language role rewrite - Context

**Gathered:** 2026-10-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Retire the caveman voice from role text in one atomic change, then rewrite all 19 role files and `_role-switch-protocol.md` in clear, compact, second-person English. Every role states its goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than today, and every load-bearing rule survives (no-fabrication, `UNKNOWN - verify`, WF16/WF18 pointers, absent-config fallback, board-move ownership as a partition). The whole role corpus fits 67,383 B under a guard, with a recorded per-file ceiling for each role. The engineer and Tech Lead roles gain grugops-authored "do less" rules adapted from ponytail (MIT, credited in NOTICE), and `pr-review-checklist.md` gains an advisory lean-review lens. Role text becomes a governed surface of the writing profile (PLAIN-01..07).

Not in this phase: orchestrator flow guidance (in-flight log, refill, fresh session; Phase 41), skills per role (Phase 42), README and docs (Phase 43, including the `CLAUDE.md` `/grug` drift, STORY-05), and any plain-English pass over workflows beyond the text moved into them.

**Starting point measured 2026-10-31:** the 20 role-corpus files total **78,011 B**, so the rewrite must cut about 10.6 KB (14%). Measured shares of that: caveman blocks 3,171 B; the "Context I/O / Compaction" WF16/WF18 lines 6,606 B (18 files); `## Trace updates` sections 5,465 B (19 files); the `factory.config.json` read lines 5,084 B (19 files).

</domain>

<decisions>
## Implementation Decisions

### Carried forward (already decided, not re-asked)
- Caveman is retired from role text. The grug voice lives only in light brand copy and never in role instructions (PROJECT.md voice discipline, revised v3.0 2026-10-20).
- The caveman flip is the **first plan**, lands as one atomic change (`ROLE_SECTIONS`, `guard_caveman_voice` inverted so no caveman fence can return, `guard_voice` over whole files, `agent-factory/writing-profile.md`, claim C-28-003 re-dispositioned by id, the `CLAUDE.md` Voice discipline constraint), and the inverted guard is seen failing before it passes (PLAIN-01).
- `scripts/voice-model.ts` is hash-pinned in the admission hook's frozen manifest. Change its consumers, never the file.
- [v3.0, D-1]: one corpus total of 67,383 B covers all roles including Tech Lead and Designer, plus a recorded per-file ceiling for each role. Detail moves into workflows.
- [v3.0, D-9]: role text joins the governed writing-profile surfaces. No new ticket keys.
- ponytail rules are rewritten as grugops text (never installed), with MIT attribution in NOTICE and no benchmark numbers (they trip `guard_banned_claims`).

### Byte budget
- **D-01:** Repeated boilerplate shrinks to a **short pointer line per role** (for example "Context: WF16 read/write, WF18 compaction."). The full wording lives once in the workflow or shared file it points to. Every role keeps its own pointer, because a spawned agent reads only its own role file and the inventory checks each role.
- **D-02:** Per-file ceilings are **allocated first, measured after.** The plan sets a byte target per role before writing, the targets sum to the headroom target (D-03), and the orchestrator gets the largest share. Writers work to their target. Afterwards `ROLE_CEILINGS` is recorded from the measured result.
- **D-03:** **Reserve headroom** for Phases 41 and 42. The rewritten corpus lands at or below about **64 KB**, leaving about 3 KB for Phase 41's orchestrator flow text and Phase 42's per-role skills line.
- **D-04:** A new **corpus-total guard** FAILs above 67,383 B and WARNs above the headroom target (about 64 KB; the planner fixes the exact number from the allocation). The total guard is the hard cap. Per-file ceilings with +12% headroom may sum to more than 67,383 B, and that is fine.
- **D-05:** Role detail that doesn't fit its target moves **into the workflow or checklist that already runs the role** (WF04, WF16 and so on). The role keeps what to do and its limits; the workflow keeps how.
- **D-06:** Workflow files get **no new byte budget.** Each plan summary records the before and after bytes of every workflow or checklist it touched, so the shift is visible.
- **D-07:** **Re-baseline all 19 `ROLE_CEILINGS` entries** (plus the protocol if the guard covers it) from the post-rewrite measurement with the usual +6% WARN / +12% FAIL headroom. Each comment names Phase 40 and the measured bytes. Old history comments are dropped, because those baselines no longer describe the files. The table keeps failing closed on an unknown role and keeps its two-way key check against `listRoles()`.

### Role skeleton
- **D-08:** Section list after the rewrite: `## One job` · `## Activates when` · `## Reads` · `## Responsibilities` · `## Output` · `## Board moves` · `## Trace updates` · `## Hard limits` · `## Stop when` (new). Headings keep their names because `generate-role-adapters.ts` and `generate-catalog.ts` build adapter descriptions from `## One job` and `## Activates when`. The goal is stated in One job, inputs in Reads, outputs in Output. Optional sections such as the engineer's `## Levels` and `## Do less` stay allowed.
- **D-09:** **Timing of ROLE_SECTIONS edits:** plan 1 (the atomic flip) only removes `## Caveman prompt`. `## Stop when` and `## Activates when` are added to `ROLE_SECTIONS` in the plan that finishes the last role batch, with a red-before-green check.
- **D-10:** `## Stop when` is its own section. Each item pairs a trigger with an outcome: the status the role reports (`BLOCKED`, done, a `failed-attempt` note per WF04) and who the ticket goes to. `## Hard limits` keeps only the never-do rules.
- **D-11:** **Voice:** second person, imperative ("You implement one ticket. Pull the shared context first. Never fake a test result."). No grug words anywhere in role files. The protocol's `▶ entering <ROLE>` announce line stays, because it is an output format, not voice.
- **D-12:** **Drop heading suffixes** (`## Output (file + format)` becomes `## Output`, `## Board moves (which column transitions this role causes)` becomes `## Board moves`). Checked: only code comments in `scripts/validate-agent-factory.ts` (lines 368, 403) mention the suffixes, and the validator matches by prefix.
- **D-13:** "Follow the 12 coding rules in `AGENTS.md`" stays **only in roles that write code or config**: software-engineer, tech-lead, qe-e2e, frontend-ui, installer, agents-md-scribe, greenfield-mapper, orchestrator. The planner confirms the set. Other roles drop it, and the rule inventory records that set as intended rather than as a loss.
- **D-14:** Responsibilities has no fixed item cap. Each item is one action plus its reason in one sentence. A reason clause stays only where it carries real guidance.
- **D-15:** `_role-switch-protocol.md` is rewritten under the same plain-English rules: grug persona phrases ("which grug holds the work", "Fresh head") are removed, and the five steps are kept in its protocol shape, not the role section list.
- **D-16:** **Plan shape:** plan 1 is the atomic caveman flip. Plan 2 writes `software-engineer.md` to the new skeleton as the **reference role**, including the `## Do less` section. That plan ends with a **human checkpoint**, where the user reads and approves voice, shape and length. After that, the remaining roles are rewritten in parallel batches that copy the reference pattern. The planner picks the batch split.
- **D-17:** `orchestrator.md` gets a **full plain rewrite now**, keeping today's flow rules as they are but compacted. Phase 41 adds its flow guidance into the reserved headroom.
- **D-18:** Tech Lead and Designer (drafted in plain English in Phase 39) are **conformed**, not rewritten from scratch: they get `## Stop when`, lose the heading suffixes (and caveman if present), gain the TL do-less rules, and fit their target. Recent wording that already passes is kept.
- **D-19:** When role text moves into a workflow or checklist, **only the moved text** is written in plain English. The rest of that file is untouched.

### Do-less rules and lean lens
- **D-20:** **The Tech Lead trims the ask, the engineer builds lean.** The Tech Lead does scope-first at planning time: every place the change must reach (callers, tests, fixtures, config, exports), options nobody asked for named and dropped, and the never-cut floor written into the `## Tech Lead plan`. The engineer runs the reuse-before-build ladder while coding, finishes the whole change (callers, tests and fixtures it breaks), leaves one small test for new non-trivial logic, marks `shortcut:` comments and ends with the "Not checked" line.
- **D-21:** In `software-engineer.md` the rules live in an optional **`## Do less`** section (ladder, floor, one-test rule; about 600-800 B). The `shortcut:` marker format and the "Not checked" line go in `## Output`. They must be in the role text itself, because rules in the main session do not reach spawned agents (ponytail's subagent issue #252).
- **D-22:** The "what was skipped" line is a **`Not checked:` line in an `observation` note** published per WF16 with the implementation notes. It is one or two lines on what was skipped on purpose or left unchecked, plus any risk the human must know, and it is never longer than the change (ponytail's v1 lesson). There is no new note kind and no new ticket key.
- **D-23:** The marker format is `shortcut: <the limit>, <when to upgrade>`, a **text rule only.** The lean lens flags a marker with no upgrade trigger. No ledger or script in this phase (deferred).
- **D-24:** The do-less rules are **the same for every engineer level.** The level changes which tasks a role takes, not how disciplined it is. The junior hard exclusions stay as they are.
- **D-25:** The **lean-review lens** in `agent-factory/checklists/pr-review-checklist.md` is **advisory, never blocking on its own**, and every finding needs a concrete case ("no case, no finding", no style-taste findings). Sub-tags: delete, reuse, stdlib/native, yagni, merge, split by job (never by line count). Review priority order puts correctness, safety and tests before lean. No savings or line-count number is ever printed (ponytail-gain's honesty rule and grugops' no-fabrication rule).
- **D-26:** **NOTICE** gets a short adaptation credit: the do-less rules in the engineer and Tech Lead roles and the lean-review lens are adapted from ponytail (`github.com/dietrichgebert/ponytail`), MIT, followed by the MIT permission notice and the copyright line exactly as in ponytail's LICENSE. If the LICENSE can't be read, the copyright line is marked `UNKNOWN - verify`. No benchmark numbers.

### Rule inventory and safety gates
- **D-27:** The role-rule inventory is **derived by a script and committed**, generated before any role is rewritten. Per role, it records: no-fabrication, `UNKNOWN - verify`, WF16 and WF18 pointers, absent-config fallback, the board transitions the role owns, stop/`BLOCKED` rules, junior exclusions, and the D-13 coding-rules set. A guard reruns the derivation after the rewrite and fails on any lost fact. The set is derived, never hand-listed.
- **D-28:** "Still holds" means the **anchor token plus the meaning.** Fixed tokens must survive exactly per role (`UNKNOWN - verify`, `16-context-read-write.md`, `18-context-compaction.md`, board column names, `BLOCKED`, `failed-attempt`); the prose around them may be reworded. The guard checks tokens and the plan review checks meaning.
- **D-29:** **Board-move partition guard:** derive the `X → Y` transitions from each role's `## Board moves`, and fail on a transition with two owners or a board-contract transition with none. Compare the result with the pre-rewrite inventory. Reuse an existing guard if one already does this.
- **D-30:** **Diff-disposition gate (Phase 29, `scripts/check-diff-disposition.ts`):** record a decision that moves `docs/audit/29-style-dispositions/00-base.md` to the commit just before Phase 40, and that **for role files the role-rule inventory guard stands in for per-clause disposition rows** during this rewrite. Frozen safety clauses in non-role files stay verbatim. Today the gate treats `## Hard limits` sentences as FROZEN by `structuralSections`; the planner works out the exact mechanism (watched-corpus scope, a recorded exception, or similar) so the gate stays mechanical and fails closed. — **Reversibility:** costly — it changes the scope of a Phase 29 safety gate and its recorded base, and undoing it means re-dispositioning every clause changed since.
- **D-31:** **"More detail" is shown** by two things: per role, the derived inventory fact count after the rewrite is at least the count before (new Stop-when items count), and a verifier reader check on each role (can a reader name the goal, inputs, outputs, board moves, limits and stops from the file alone?). The bytes come from removing caveman, boilerplate and flow detail, never facts.
- **D-32:** **Writing-profile gates (PLAIN-07):** when the lexicon or sentence gate flags role text, reword first. A term is added to the lexicon only when it is a grugops name a role must use (a column, a note kind, a config key), and each addition is listed in the plan summary.

### Claude's Discretion
- Batch split and wave layout for the role batches after the reference-role checkpoint.
- The exact per-role byte targets and the exact WARN number (about 64 KB), within D-02/D-03.
- Exact wording of the short pointer lines (D-01) and of the shared text they point to.
- The mechanism for D-30, within its stated constraints.
- Final membership of the D-13 code-or-config role set, recorded in the inventory.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and decisions
- `.planning/ROADMAP.md` § "Phase 40: Plain-language role rewrite" — goal, success criteria 1-5, notes (D-1, caveman flip first, `voice-model.ts` hash-pinned)
- `.planning/REQUIREMENTS.md` lines 56-62 — PLAIN-01..07
- `.planning/PROJECT.md` — Key Decisions `[v3.0, D-1]`, `[v3.0, D-9]`, the 2026-10-20 caveman-retirement row, the revised Voice discipline constraint
- `.planning/research/SUMMARY.md` — Phase 40 delivery list (line ~117), D-1 rationale (line ~163), pitfall 4 (role rewrite drops load-bearing rules)
- `.planning/research/PITFALLS.md` — rewrite and caveman-flip pitfalls, rule inventory as oracle
- `.planning/research/FEATURES.md` § 0.1 — ponytail rules quoted verbatim, review lenses, honesty boundary, subagent lesson
- `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-CONTEXT.md` — Tech Lead plan shape, levels, junior exclusions, what was deferred to Phase 40

### Files the rewrite changes
- `agent-factory/roles/*.md` (19 roles) and `agent-factory/roles/_role-switch-protocol.md`
- `agent-factory/checklists/pr-review-checklist.md` — gets the lean lens
- `agent-factory/checklists/complexity-rubric.md` — level scope the engineer and TL refer to
- `agent-factory/NOTICE` — ponytail MIT attribution
- `agent-factory/writing-profile.md` — line 8 places caveman in the `## Caveman prompt` block; role text becomes a governed surface
- `CLAUDE.md` — Constraints › Voice discipline ("Caveman voice in every role prompt") changes in the atomic flip
- `docs/audit/28-claim-registry.md` § C-28-003 (line 105) and finding F-28-202 (line 939) — re-dispositioned by id

### Guards and generators
- `scripts/validate-agent-factory.ts` — `ROLE_SECTIONS` (line ~371)
- `scripts/check-foundation-guards.ts` — `guard_caveman_voice`, `guard_voice`, `guard_role_size`, `ROLE_CEILINGS` (line ~3545), `guard_role_clause_uniqueness`, kit-count consumers (line ~1649)
- `scripts/voice-model.ts` — hash-pinned; read but **do not edit**
- `scripts/check-diff-disposition.ts` and `docs/audit/29-style-dispositions/00-base.md` — D-30
- `docs/audit/28-safety-surface-exclusions.md` — the protected-file list the disposition gate rests on
- `scripts/generate-role-adapters.ts` (lines ~415-480) and `scripts/generate-catalog.ts` (line ~263) — read `## One job` and `## Activates when`; adapters and catalog regenerate after the rewrite
- `scripts/kit-model.ts` — `ROLE_COUNT`, `LEVELED_ROLE_COUNT`

### Workflows that absorb moved detail
- `agent-factory/workflows/16-context-read-write.md`, `agent-factory/workflows/18-context-compaction.md`, `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/workflows/17-task-claim.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ROLE_CEILINGS` + `guardRoleSize()` in `scripts/check-foundation-guards.ts`: the per-file guard to re-baseline. The corpus-total guard can sit beside it over the same derived `ROLE_FILES` set.
- `generate-role-adapters.ts` already refuses a role without `## One job` / `## Activates when`. Keeping those headings means no generator change; only regenerated outputs and fixtures change.
- `scripts/check-diff-disposition.ts` already derives changed clauses from git against a recorded base. D-30 changes its scope for role files rather than building a new gate.
- Existing pattern of "derive the set, assert the count" with planted-file tests in `check-foundation-guards.test.ts`, for the inventory guard and the partition guard.

### Established Patterns
- Red-before-green evidence as a permanent test case on a planted mirror (Phase 29 D-24 practice), never a quoted transcript.
- Hand-kept sets are the repo's known failure class. The inventory and partition sets must be derived.
- Ceilings use +6% WARN / +12% FAIL over a measured baseline; tables fail closed on an unknown key.
- Committed `.js` compiled from `.ts` with a freshness check, so any guard change rebuilds the `.js`.

### Integration Points
- Adapter outputs for all six hosts and `docs/catalog` regenerate from the new role text, and their freshness gates must pass.
- The admission hook's frozen manifest pins `voice-model.ts`; the inverted caveman guard changes how it uses the model, not the model file.

</code_context>

<specifics>
## Specific Ideas

- The user wants one checkpoint on the reference role before the batch rewrite starts. That is the single place to judge voice, shape and length.
- Rules in the role text are written as "You …" imperatives, the same style the Phase 39 Tech Lead and Designer drafts already use.
- ponytail's two lessons apply directly: the explanation must never be longer than the change (cap on the "Not checked" line), and the do-less text itself must stay compact.

</specifics>

<deferred>
## Deferred Ideas

- A `shortcut:` ledger (a grep of `shortcut:` comments into a report that flags rows with no upgrade trigger, as ponytail-debt does). New tooling; backlog.
- A full plain-English pass over workflows and checklists beyond moved text. Phase 43 docs or a later milestone.
- Applying the Phase 39 "three disputed rounds before a human" rule to other checkpoints. Already a recorded deferred follow-up in 39-UAT.md, not this phase.

</deferred>

---

*Phase: 40-plain-language-role-rewrite*
*Context gathered: 2026-10-31*
