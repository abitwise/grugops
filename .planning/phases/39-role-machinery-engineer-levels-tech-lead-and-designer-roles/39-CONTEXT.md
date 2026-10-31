# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key - Context

**Gathered:** 2026-10-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The kit can match each ticket to the right engineer level. Phase 39 delivers:
- a Tech Lead role that scores each ticket on a written per-factor rubric, names the engineer level and pre-plans the dev tasks (TIER-01);
- one `software-engineer.md` role that yields three generated Claude Code adapters (junior, mid, senior), with the level as guidance on the other five hosts (TIER-02, D-5);
- the junior limits and the escalation path (TIER-03, TIER-04);
- a Designer role that sets product-wide design strategy and guidelines, which Frontend/UI reads for each ticket's UI contract (TIER-05);
- derived role and adapter sets, with no hand-typed lists (TIER-06);
- a `skills:` role frontmatter key the canonical grammar admits (TIER-07).

Not in this phase: the plain-language rewrite of existing roles (Phase 40; the two new roles are drafted in plain English here), orchestrator flow and refill guidance (Phase 41), skill values, the skill evaluation and the doctor's skill warning (Phase 42), and docs pages (Phase 43).

**Already locked (PROJECT.md Key Decisions, not re-asked):** D-1 (one 67,383 B corpus total that includes Tech Lead and Designer, plus a per-file ceiling for each), D-2 (D-09 amended for the engineer junior level only: haiku, effort `medium` (amended to `xhigh` on 2026-10-30, see D-14 amended), plan fixes what to write, never security/migration/concurrency/test integrity, Claude Code v2.1.293 floor), D-3 (level adapters pin model and effort at zero config; the MODEL-01 baseline is re-pinned by recorded decision, the test is not loosened; `models.roles.software-engineer` applies to all three levels), D-5 (level adapters for Claude Code only), D-9 (no `level` ticket key; the level lives in the Tech Lead note and the ticket body).

</domain>

<decisions>
## Implementation Decisions

### Tech Lead: when it runs and what it owns
- **D-01:** The Tech Lead runs on **every ticket, in both lean and enterprise modes**. It is the only thing that picks a level. `tier: core`.
- **D-02:** It sits in **WF04**, right after the Orchestrator's Definition of Ready check (step 1) and before dev. It is not in WF03.
- **D-03:** The Tech Lead adapter runs on **`inherit`** at zero config, like every other judgment role (D-09 still holds for it). It gets a `TIERED` row (opus, `high` effort) with a written rationale for the `tiered` preset. It is never pinned.
- **D-04:** Output: a `decision` note (an existing `NOTE_KINDS` member) holding the per-factor scores, the sum, the chosen level and the dev tasks, plus a short `## Tech Lead plan` section in the ticket body. No new ticket frontmatter keys (D-9). No separate dev-plan file.
- **D-05:** **Boundary with Architect/Design:** the Tech Lead never makes structural decisions. When the approach isn't designed yet (F2 = 2: a new seam, contract or data model is needed), it records the gap and the ticket goes back to `In Design` for the Architect. The Tech Lead plans only on top of the Architect's published notes.
- **D-06:** **Boundary with the Orchestrator:** the Orchestrator keeps the Definition of Ready check unchanged. The Tech Lead runs after it and may return `SPLIT_REQUIRED` when its file-level plan shows an XL ticket or too many files.
- **D-07:** **Test planning boundary:** the Architect owns the per-feature test strategy (layers, seams). The Tech Lead names the concrete test cases and Given/When/Then per ticket in its dev tasks, which is what makes a task fully specified (F2 = 0).
- **D-08:** No new board column for the Tech Lead step. The ticket stays in `Ready for Dev` while the Tech Lead plans, and the Orchestrator moves it to `In Development` once the plan note is published.
- **D-09:** No batching: each engineer dispatch covers exactly one ticket. The "one engineer, one ticket" rule stands.
- **D-10:** **The plan is guidance, not a script.** An engineer at any level may deviate from the Tech Lead's plan somewhat to fit the real code, and records what changed and why in its notes. The ticket goes back only when the engineer is actually **blocked** (see D-18). (The user revised an earlier "junior always stops" answer: deviation is allowed at every level, and being blocked is what sends a ticket back.)

### Rubric and level adapters
- **D-11:** Adopt the research rubric **F1–F6** as **starting values**, labelled LOW confidence and to be calibrated after about 30 scored tickets: F1 files touched, F2 spec completeness, F3 risk surface, F4 novelty, F5 test burden and F6 blast radius, each scored 0/1/2, sum 0–12. Mapping: 0–3 → junior (**only if F2 = 0 and F3 = 0**), 4–7 → mid, 8–12 → senior. Overrides: F3 = 2 → at least mid. F2 = 2 → not dispatchable, back to the Architect (D-05). Size XL → `SPLIT_REQUIRED`. The source table is in `.planning/research/FEATURES.md` § Rubric.
- **D-12:** The rubric text lives in a **new checklist file**, `agent-factory/checklists/complexity-rubric.md`, and `tech-lead.md` points to it, which keeps the role inside its D-1 ceiling. It also needs a row in `checklists/00-index.md`.
- **D-13:** Adapter names: **`grugops-software-engineer-junior`, `grugops-software-engineer-mid`, `grugops-software-engineer-senior`**. They **replace** `grugops-software-engineer`, leaving no base adapter. Adapters: 18 one-to-one + 3 = **21**. Every engineer dispatch names a level.
- **D-14:** Effort: junior `medium` (D-2), mid `medium`, senior `high`. Models: junior `haiku`, mid `sonnet`, senior `opus`. They live in one resolver-owned `LEVELS` table in `scripts/model-tiers.ts`, with a written rationale per row (quality arguments only, no cost claims).
- **D-14 amended (2026-10-30, Phase 39 UAT, G-39-5, human decision):** effort junior `xhigh`, mid `high`, senior `medium`; models unchanged; recorded in PROJECT.md Key Decisions and implemented by plan 39-14.
- **D-15:** **Per-level override keys:** `models.roles.software-engineer` applies to all three levels (D-3), and `models.roles.software-engineer-junior|mid|senior` overrides one level. The reader's legal key set is derived from the filesystem, never typed by hand. The same applies to `models.effort.roles`.
- **D-16:** An explicit **`models.preset: "none"` leaves the level pins in place**. `none` keeps meaning "no tiered preset for the other roles", which preserves the existing `none` ≡ absent equivalence. Only an explicit `models.roles.*` entry changes a level.
- **D-17:** **The Tech Lead names the adapter.** It writes the level in its note and in the ticket section, and the Orchestrator dispatches exactly that adapter by name (a named, non-fork spawn) and never re-decides. On the five non-Claude hosts the single engineer role reads `## Levels` and works within the chosen level's scope, **with no model advice** (grugops cannot switch the model there).

### Escalation path
- **D-18:** Triggers: the engineer reports **BLOCKED**, or the **WF05 gate fails a second time** after the bounded self-fix.
- **D-19:** **The Tech Lead decides every time.** No level-up happens automatically. On a trigger, the engineer publishes a `failed-attempt` note (it holds the trajectory, per WF18) and the ticket moves to **`## Blocked`** with its reason. The Tech Lead owns the exit for blocks raised during dev. It reads the failed-attempt note and chooses one of four moves: **escalate one level (at most once per ticket)**, **re-plan** (and re-score), **split**, or **send back to the Architect**. Its choice is a new decision note, and the ticket returns to `Ready for Dev`. The Orchestrator then re-enqueues the work for the adapter the note names.
- **D-20:** **The Orchestrator never relays data.** It only asks a role to work on X; every fact travels through published notes and the queue (TIER-04: "never a relayed prompt").
- **D-21:** After the Tech Lead's options are used up (the single escalation spent and a re-plan, split or Architect pass also blocked), the ticket **stops for a named human**. No retry loops.
- **D-21 amended (2026-10-31, Phase 39 UAT, G-39-71, human decision):** Once the Tech Lead's options are used up, it hands the ticket to the role whose job covers the cause (BA/PM, the Architect or another suitable role) at every value of `checkpoints.escalate_unadjudicable_result`, at most three times for one cause. A named human is asked only after three disputed rounds on one cause, or when the fix changes a requirement or a rule fundamentally; the human is the stakeholder (Olger Oeselg: "Human's role is stakeholder"). Three disputed rounds on one cause are the no-loop bound: the same cause never goes round a fourth time, and a block with a new cause counts no round. The per-ticket move limits are unchanged. Recorded in PROJECT.md Key Decisions and implemented by plan 39-19.
- **D-22:** Claude Code v2.1.293 floor: **documented only** in Phase 39, in the D-2 amendment record and the install docs. No `claude --version` probe in `--check` (new behavior, `UNKNOWN - verify`); the doctor work belongs to Phase 42.

### Designer
- **D-23:** **The whole role plus the WF14 wiring land in Phase 39.** That covers the Designer role file, its output, WF14 running the Designer before Frontend/UI, and Frontend/UI reading the guidelines. Phase 42 adds only the optional ui-ux-pro-max path and the `design-system/` user-artifact rule (SKILL-04).
- **D-24:** The Designer's guidelines are **published notes only** (typed `decision`/`artifact-ref` notes per WF16, with a verification stamp). No new `memory-bank/` master file, so there is no new layout constant or budget.
- **D-25:** Cadence: **the first UI work in a repo triggers it once per product**. A UI epic re-runs it only when it needs a new direction. Per-ticket UI goes straight to Frontend/UI against the existing guidelines.
- **D-26:** Split of ownership. **The Designer owns the system:** principles, the token system (palette, type scale, spacing), style direction, the product-wide accessibility bar (WCAG 2.2 AA) and generated-design tells to avoid. **Frontend/UI keeps the per-ticket work:** the component inventory, the five states, per-ticket WCAG application and the visual baseline. Frontend/UI **reads** the tokens from the Designer's notes instead of naming them; its role text and WF14 step 1 change to say so.
- **D-27:** The Designer is **`tier: core`** and activates only on UI work, so repos with no UI never run it. Model `inherit` at zero config (a judgment role, D-09).

### `skills:` key
- **D-28:** `skills:` is a **role-side declaration only and is never emitted** into the generated Claude Code adapter's frontmatter (Claude Code's adapter `skills:` field preloads skill text, which Phase 42 forbids). The role text, the Phase 42 doctor and the Phase 43 docs read it.
- **D-29:** Phase 39 delivers **the grammar only**: the parser, the canonical-grammar admission and tests with a fixture. **No shipped role declares a value in 39**; Phase 42 fills them in after the SKILL-02 evaluation.

### Orchestrator and enforcement
- **D-30:** `orchestrator.md` (6,817 B; warn 7,165, ceiling 7,570) must **fit its ceilings without raising them**. Rewrite the routing lines compactly, for example `plan -> Tech Lead; code -> Software Engineer (level from Tech Lead)` and `design system -> Designer`, and trim elsewhere. The dual-path equivalence oracle stays green.
- **D-31:** The junior exclusions are enforced **in text**, in two places: the rubric's F3 rule (any excluded tag makes junior impossible) and the engineer's `## Levels` section, which tells a junior to stop BLOCKED if it meets one. No new validator check that parses note text.

### Claude's Discretion
- How the generator expands one role into N adapters (the `levels:` frontmatter key vs another mechanism), the exact `LEVELS` table shape and its two-sided count pin. Research recommends `levels: junior mid senior` in role frontmatter plus `listAgentAdapterNames()`.
- The `skills:` list grammar (flow-form list vs the space-separated `capabilities` style). Research says flow-form is preferred and the grammar is `UNKNOWN - verify`. Also whether role frontmatter needs a `CANONICAL_SCHEMA` change (ARCHITECTURE.md says role frontmatter is not under it, while TIER-07 says "admitted by the canonical frontmatter grammar"; the researcher resolves which grammar governs).
- Whether `effort` applies to haiku on v2.1.293+. If it is rejected or ignored, the junior adapter omits the line and the D-2 record says so.
- How every derived count moves: `ROLE_COUNT` 17 → 19, adapters 17 → 21, spawn grant 16 → 20 names, `SPAWN_GRANT_SCAN_COUNT`, `TIERED` rows, `roleCeiling()` entries for the two new roles, `TECHNICAL_NAMES_COUNT`, `AUDIT_SET_COUNT`, `WATCHED_CORPUS_MIN`. All are derived from the filesystem, with no hand-typed list (TIER-06).
- The exact layout of the `## Tech Lead plan` section and the decision note.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone decisions and requirements
- `.planning/PROJECT.md` § Key Decisions rows `[v3.0, D-1]`, `[v3.0, D-2]`, `[v3.0, D-3]`, `[v3.0, D-5]`, `[v3.0, D-9]`, and the 2026-10-20 engineer-levels row: the locked decisions this phase implements
- `.planning/REQUIREMENTS.md`: TIER-01..TIER-07 (this phase), and SKILL-01..05 (Phase 42, for the scope boundary)
- `.planning/ROADMAP.md` § Phase 39: goal, success criteria, research flag, gap-closure cap (four rounds)

### Research
- `.planning/research/FEATURES.md` § Rubric: the F1–F6 table, thresholds, overrides, escalation and small-model failure modes (the D-11 source)
- `.planning/research/FEATURES.md` table rows: Tech Lead, three adapters, escalation, Designer, ui-ux-pro-max
- `.planning/research/ARCHITECTURE.md` §3.2–3.3: the `levels:` key, the `LEVELS` table, the 1:N generator, count derivation (roles 17→19, adapters 17→21, grant 16→20), routing matrix edits, Tech Lead output shape
- `.planning/research/SUMMARY.md` § Phase 39 delivers list, § D-1/D-2/D-9
- `.planning/research/PITFALLS.md`: guard and count pitfalls

### Code and kit surfaces
- `scripts/model-tiers.ts`: `MODEL_ALIASES`, `EFFORT_LEVELS`, `TIERED` rows, presets, `MODELS_KEYS`/`EFFORT_KEYS`; where `LEVELS` goes
- `scripts/canonical-frontmatter.ts`: `CANONICAL_SCHEMA`, for the `skills:` admission
- `scripts/frontmatter.ts`: `parseFrontmatter` (returns every occurrence)
- `scripts/adapter-byte-baseline.test.ts`: the MODEL-01 baseline, re-pinned by decision (D-3)
- `scripts/board-model.ts`: closed `TICKET_KEYS` (do not extend, D-9); the board columns, including `Blocked`
- `agent-factory/roles/software-engineer.md`, `architect-design.md`, `frontend-ui.md`, `orchestrator.md`, `_role-switch-protocol.md`
- `agent-factory/workflows/04-ticket-to-pr.md` (Tech Lead step after step 1), `14-ui-design-to-build.md` (Designer before Frontend/UI), `05-pr-quality-gate.md` (second-failure trigger), `16-context-read-write.md` and `18-context-compaction.md` (notes, failed-attempt)
- `agent-factory/checklists/definition-of-ready.md`, `checklists/00-index.md`
- `agent-factory/config/factory.config.md` § models / models.effort: document the per-level stems and the preset-none behavior
- `agent-factory/seed/memory-bank/plans/board.md`: the Blocked column convention (owner = raiser; the Tech Lead owns the exit for dev-raised blocks)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/model-tiers.ts`: already resolves the per-role `model:` and `effort:` from the `models` dial, with a rationale per `TIERED` row. `LEVELS` follows the same row style.
- `NOTE_KINDS` `decision` and `failed-attempt` (`context-io.ts`): cover the Tech Lead output and the escalation record with no new note kind.
- The `Blocked` board column already exists, visible and time-tracked, with no WIP limit, so the escalation status needs no grammar change.
- Checklist pattern (`definition-of-ready.md`): the model for `complexity-rubric.md`.

### Established Patterns
- Adapters are thin generated pointers, freshness-gated (`adapters-freshness.ts`). Hand-writing `model:` into a wrapper is the CLAUDE.md anti-pattern; the resolver table is the sanctioned route.
- Counts and name sets are derived from the filesystem and pinned two-sided. A change moves the fixtures by recorded decision, never by loosening a test.
- Role frontmatter: `kind`, `tier`, `capabilities` (space-separated). The generator refuses duplicate keys.
- Roles reference workflows and checklists rather than restating them, which keeps them inside per-file ceilings.

### Integration Points
- The adapter generator and installer (Claude Code `.claude/agents/`), the coordinator spawn allowlist (`Agent(...)` grant), the docs catalog generator, the orchestrator routing matrix, WF04, WF14, `frontend-ui.md` and `software-engineer.md` (`## Levels`).

</code_context>

<specifics>
## Specific Ideas

- The user asked to check overlap with the Architect role. Result: Architect = structure, ADRs, NFRs and test strategy per feature/epic (the `In Design` exit). Tech Lead = the file-level plan per ticket on top of that. Undesigned approach (F2 = 2) → back to the Architect.
- The user's principle for escalation: "Orchestrator should not relay the data, it should only ask a role to work on X or Y." The ticket's status (Blocked) is the hand-off, and the Tech Lead works from it.
- After the Tech Lead: it may split or send back to the Architect, and a human comes after that.

</specifics>

<deferred>
## Deferred Ideas

- A `claude --version` probe in `install --check` that warns below v2.1.293: Phase 42 (doctor work).
- Batching same-shape small tickets into one dispatch: after rubric calibration data exists.
- Calibrating the rubric thresholds from about 30 logged scored tickets: a future milestone.
- A validator check that cross-checks junior against the F3 tags in note text: not planned. Text enforcement is enough for now.

</deferred>

---

*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Context gathered: 2026-10-29*
