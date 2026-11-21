# Phase 42: Skills per role and evaluation - Context

**Gathered:** 2026-11-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Each role knows which third-party skills it may use and what to do when one is absent. A written evaluation of six named skills decides which are recommended, and recommended skills are documented only as optional, pinned installs. Frontend/UI and the Designer use ui-ux-pro-max when it is installed and treat its `design-system/` files as user artifacts. `install --check` warns, and never fails or installs, when a declared skill is not found. Requirements: SKILL-01..SKILL-05.

Phase 42 delivers:
- the SKILL-02 evaluation (`42-EVALUATION.md`) and a human ratification of each recommendation;
- `skills:` values and a `## Skills` section in the roles that get a ratified skill, plus one role-switch-protocol step;
- one precedence rule in `AGENTS.md`;
- a public `docs/skills.md` with pinned, optional install references;
- the ui-ux-pro-max path and the `design-system/` rule in the Designer role and WF14;
- the doctor's skill warning, plus the `claude --version` probe Phase 39 deferred here.

Not in this phase: generated reference pages for agents and skills, README and the main docs story (Phase 43); widening the `skills:` grammar; evaluating any skill beyond the six SKILL-02 names.

**Already locked (not re-asked):**
- 39 D-28: `skills:` is a role-side declaration only and is never emitted into a generated adapter, because adapter `skills:` preloads full skill text.
- 39 D-29 and the grammar in `scripts/canonical-frontmatter.ts` (`roleSkillsOf`): one line of space-separated lower-case kebab names. An absent key means no skills.
- 39 D-26: the Designer owns the token system and Frontend/UI owns per-ticket work and reads the Designer's notes.
- Research anti-features: no vendoring, no auto-install, no preloading of third-party skills, no third-party coordinator loops.
- [v3.0, D-1] role corpus budget of 67,383 B. Measured today at 60,519 B for the 19 roles plus `_role-switch-protocol.md`, which leaves about 6.8 KB.

</domain>

<decisions>
## Implementation Decisions

### Role skill declarations
- **D-01:** A role's `skills:` line names **third-party skills only**: those the evaluation passes and the human ratifies. grugops's own skills (`grugops-gate`, `-plan` and the others) are workflow entry points and are not listed.
- **D-02:** A role with no ratified skill gets **no `skills:` key and no `## Skills` section**. The parser already reads an absent key as the empty list. SKILL-01 / success criterion 1 ("each role lists the skills it may use") is met by declaring nothing for such a role. The verifier should read it that way, not require a section in all 19 roles.
- **D-03:** Plugin-namespaced skills are written as the **bare kebab name**, which is the `SKILL.md` directory name (e.g. `test-driven-development`, not `superpowers:test-driven-development`). The grammar is unchanged. `docs/skills.md` names the plugin and the pin for each skill.
- **D-04:** The fallback is **inline, per role**. Each `## Skills` row reads: situation → skill → what to do without it (the role's own rule or a checklist link). The section carries one line: record in the note whether the skill ran, and never claim it ran.
- **D-05:** Run-time discovery: a role uses a skill **only if the host shows it among the available skills**. Otherwise it takes the fallback at once. It **never searches the disk** for a skill, the same rule as "kit dir absent → STOP, do not hunt".
- **D-06:** `_role-switch-protocol.md` gets **one short step**: skills come from the host's own skill list, and an absent skill means use the role's fallback. The per-host path table lives in `docs/skills.md` and/or `install/README.md`, never in the protocol.
- **D-07:** A note records skill use **only when the situation in a declared `## Skills` row comes up**: either "used <skill>" or "<skill> not available; used fallback". There is no skills line otherwise.
- **D-08:** A role lists a skill **only if its existing capabilities cover what the skill does**. Any capability change is a separate, explicit decision recorded in this phase, never implied by a skill row. The Designer and Frontend/UI already have `read edit shell`.

### Evaluation and record
- **D-09:** The evaluation judges each of the six against the floors (merge, branching, planning authority, telemetry, network, runtime deps) **as a whole plugin, then per sub-skill**. Only sub-skills that pass on their own can be recommended. For example, superpowers `test-driven-development` or `systematic-debugging` may pass, while `using-superpowers`, `writing-plans`, `using-git-worktrees` and `finishing-a-development-branch` fail.
- **D-10:** The candidate list is **closed at the six SKILL-02 names**: superpowers, code-simplifier, feature-dev, commit-commands, frontend-design and ui-ux-pro-max.
- **D-11:** Record: the full matrix and evidence go in **`.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`**, shaped like `35-DECISION.md`. A **short public `docs/skills.md`** lists only the recommended skills with pins, install commands, the per-host skill paths (D-06) and a "third-party code you vet yourself" notice. `docs/skills.md` joins the claim registry's checked file set **before** it is written, matching the Phase 43 STORY-04 discipline.
- **D-12:** Pins are **tag plus the exact commit SHA** the skill was evaluated at (e.g. `v7.0.0 @ <sha>`). Install commands use the tag where the host installer cannot pin a SHA. "latest" is never used.
- **D-13:** A skill whose frontmatter pre-approves tools (`allowed-tools: Bash` or similar) is **not recommended until** the `allowed-tools` vs `permissions.ask` evaluation order is verified from Claude Code docs. If it cannot be verified, the record says `UNKNOWN - verify` and the skill stays unrecommended. The docs say the git-host floor is the real control.
- **D-14:** The precedence rule is stated **once, as one line in `AGENTS.md`**: grugops roles, workflows and hard limits outrank any skill's text, and a skill supplies technique, never process (no branching, merging, planning artifacts or commit cadence). Roles, `docs/skills.md` and the protocol point to it and never restate it. AGENTS.md is 8,582 B today, under the 20,480 B WARN.
- **D-15:** **A named human ratifies each recommendation by typed name** before any role declares it, using the same typed-name acceptance as UAT ("accepted by Olger" only from a reply ending with the typed name). The plan needs a human checkpoint between the evaluation and the role edits. — **Reversibility:** reversible — a de-ratified skill is removed from the role and from docs/skills.md.
- **D-16:** Re-evaluation happens **only on an explicit trigger**: someone wants to bump a pin, or an upstream security advisory hits a pinned skill. The record names both triggers, like 35-DECISION's revisit trigger. There is no calendar or per-release check.

### ui-ux-pro-max and design-system/
- **D-17:** **The Designer and Frontend/UI both declare ui-ux-pro-max** if it is ratified. The Designer uses it for system-level searches (style, palette, type, accessibility bar). Frontend/UI uses it for per-ticket component and stack lookups.
- **D-18:** **Only the user runs `--persist`** (and never `--force`). Roles run search queries only, which write nothing. When a role thinks a persisted design system would help, it says so in its note and gives the command for the user to run. grugops never writes `design-system/` under any condition.
- **D-19:** When `design-system/` and the Designer's published notes disagree, **`design-system/` wins**. The Designer aligns its notes to it and records the conflict in a note for the human, never overriding the user's file. Frontend/UI keeps reading the Designer's notes as today.
- **D-20:** Roles read `design-system/` **only when ui-ux-pro-max is present** (user's choice over "always read"). The never-write rule in D-18 is unconditional and does not depend on the skill.
- **D-21:** Frontend/UI's fallback is **today's behavior**: the Designer's notes, the five states, WCAG 2.2 AA and the visual baseline, plus a note that the skill was not available (D-07). No new fallback checklist.
- **D-22:** If **frontend-design** is also ratified, both roles may list both skills, in order: ui-ux-pro-max for catalog lookups, frontend-design for aesthetic direction (avoiding a generic look). Either one absent means its fallback.
- **D-23:** The `design-system/` rule (read when the skill is present, never write, user file wins) is written **in `designer.md` and the matching WF14 step only**. Frontend/UI needs no separate rule because it reads the Designer's notes. There is no general rule in the protocol or AGENTS.md.

### Doctor (`install --check`)
- **D-24:** Search scope is **per installed host, from one derived table**. For each host in the install record, check that host's documented project and user skill dirs: on Claude Code, `.claude/skills/`, `~/.claude/skills/` and installed plugins; on the others, `.agents/skills/` and `~/.agents/skills/`, plus any host-specific dir research confirms. A host whose path is `UNKNOWN - verify` gets a "cannot check" line, not a false WARN. The declared skills are read through `roleSkillsOf`, never by a second parser.
- **D-25:** A missing-skill finding is **advisory and exempt from `--strict`**: it never changes the exit code. That follows SKILL-05 ("never fails") literally. The doctor never installs anything.
- **D-26:** The message is one line per skill per host, naming the skill, the declaring roles and the host, and pointing to `docs/skills.md`. For example: `WARN skill ui-ux-pro-max (designer, frontend-ui) not found for claude-code; optional, see docs/skills.md`. No install command appears inline, so the pin lives in one place.
- **D-27:** **The `claude --version` probe deferred by 39 D-22 is folded in.** When Claude Code is an installed host, it warns below v2.1.293 (the junior/haiku floor). It is advisory with the same `--strict` exemption as D-25. When `claude` is absent or its output can't be parsed, the doctor says it cannot check and never guesses.

### Claude's Discretion
- The exact `## Skills` row layout and wording within the role byte budget, and which roles end up with a section (that follows from ratification).
- How the doctor finds installed Claude Code plugin skills (plugin cache layout, `installed_plugins.json` or another documented source), within D-24's "documented paths only" rule.
- How the doctor runs `claude --version` safely (exec form, timeout, no shell), and how it parses the version.
- Where the per-host skill-path table lives: `docs/skills.md`, `install/README.md` or both, without duplicating pins.
- The shape of `42-EVALUATION.md`: the matrix columns and the evidence format per floor.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and milestone decisions
- `.planning/REQUIREMENTS.md`: SKILL-01..SKILL-05
- `.planning/ROADMAP.md` § Phase 42: goal, success criteria, research flag (`allowed-tools` vs `permissions.ask` evaluation order; per-host skill discovery), the note "No third-party skill is preloaded or made process-defining"
- `.planning/PROJECT.md` § Key Decisions `[v3.0, D-1]` (role corpus budget) and the 2026-10-20 voice row (plain English in role text)

### Prior phase decisions
- `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-CONTEXT.md`: D-22 (the version probe deferred here), D-23 and D-26 (Designer/Frontend split), D-28 and D-29 (the `skills:` key)
- `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-RESEARCH.md` § open questions item 2: plugin-namespaced names (settled by D-03 here)
- `.planning/phases/40-plain-language-role-rewrite/40-CONTEXT.md` D-03 and `40-RESEARCH.md` "Phase 42 risk": the headroom estimate for per-role skills text
- `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`: the shape to follow for `42-EVALUATION.md` (posture, revisit trigger, no vendor figures)

### Research
- `.planning/research/PITFALLS.md` Pitfalls 16, 17 and 18: foreign workflows, portability and fabricated "skill used", supply chain and `allowed-tools`
- `.planning/research/FEATURES.md` §0.2 (superpowers), the code-simplifier / feature-dev / commit-commands / frontend-design rows, §0.4 (ui-ux-pro-max: Python 3, `--persist`, install per host), the "Skills per role" table row and the anti-features table
- `.planning/research/SUMMARY.md` § Phase 42

### Code and kit files touched
- `scripts/canonical-frontmatter.ts`: `roleSkillsOf`, the only parser of `skills:`
- `install/install.ts`: `--check` doctor, `STRICT` handling, install-record (marker) read
- `install/README.md`: the Claude Code v2.1.293 floor text (around line 2085) and the install docs
- `agent-factory/roles/_role-switch-protocol.md`: one new step (D-06)
- `agent-factory/roles/designer.md`, `agent-factory/roles/frontend-ui.md`: the ui-ux-pro-max path
- `agent-factory/workflows/14-ui-design-to-build.md`: the `design-system/` step (D-23)
- `AGENTS.md`: the precedence line (D-14)
- `docs/audit/28-claim-registry.md` and `scripts/check-banned-claims.ts`: the claim registry file set that `docs/skills.md` must join first

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `roleSkillsOf(doc)` in `scripts/canonical-frontmatter.ts` returns the declared names in order, or a refusal reason. The doctor and any guard read through it.
- The `--check` doctor in `install/install.ts` already reads the install record for the installed hosts and has a WARN/`--strict` path. The skill warning needs a separate advisory class that `--strict` does not promote.
- `scripts/kit-model.ts` derives adapter and skill sets from the filesystem. Any new count, such as the number of roles that declare skills, must be derived, not typed.

### Established Patterns
- Derived counts and two-sided pins, never hand-typed lists (TIER-06 practice).
- Role byte ceilings per file plus the corpus total, held by a guard. New `## Skills` sections must fit.
- `UNKNOWN - verify` for any host behavior not confirmed by vendor docs. Never fabricate a "skill ran" or a passing check.
- Decision records under the phase dir (`35-DECISION.md`), with a typed-name human acceptance for supply-chain-level choices.

### Integration Points
- Role frontmatter, then `roleSkillsOf`, which feeds the doctor (this phase) and the generated reference pages (Phase 43).
- Generated adapters must still carry no `skills:` (39 D-28). An existing guard or test enforces it and must stay green.
- `docs/skills.md` becomes a public page under the banned-claims and claim-registry gates.

</code_context>

<specifics>
## Specific Ideas

- Example warning line: `WARN skill ui-ux-pro-max (designer, frontend-ui) not found for claude-code; optional, see docs/skills.md`.
- Example pin format: `superpowers v7.0.0 @ <commit sha>`.
- Note wording: "used <skill>" / "<skill> not available; used fallback".
- If ui-ux-pro-max fails a floor or is not ratified, SKILL-04 cannot be met as written. The plan must surface that to the human as a requirement-vs-evaluation conflict, not quietly drop it.

</specifics>

<deferred>
## Deferred Ideas

- **IN-04** (Phase 39 review: the W1 cross-place test checks that phrases are present, not which value they apply to) goes to the backlog. It is a test-quality item, not doctor work.
- Evaluating ponytail-review or any skill beyond the six goes to a future evaluation, triggered as in D-16.
- Widening the `skills:` grammar to `plugin:skill` stays out. It would need a safety-authority change to a per-key alphabet.
- A general "user design artifacts are read-only" rule for every role in the protocol or AGENTS.md: not now (D-23).
- Re-checking pins on a calendar or at every release: rejected for now (D-16).

</deferred>

---

*Phase: 42-skills-per-role-and-evaluation*
*Context gathered: 2026-11-16*
