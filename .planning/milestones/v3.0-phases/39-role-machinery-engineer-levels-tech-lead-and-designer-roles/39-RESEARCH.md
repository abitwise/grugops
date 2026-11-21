# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key - Research

**Researched:** 2026-10-29
**Domain:** grugops kit authorities (TypeScript tooling layer), adapter generation, guards, role and workflow markdown
**Confidence:** HIGH for the code census and the platform facts (read this session); MEDIUM for the recommended mechanisms (design choices inside Claude's discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Already locked (PROJECT.md Key Decisions, not re-asked):** D-1 (one 67,383 B corpus total that includes Tech Lead and Designer, plus a per-file ceiling for each), D-2 (D-09 amended for the engineer junior level only: haiku, effort `medium`, plan fixes what to write, never security/migration/concurrency/test integrity, Claude Code v2.1.293 floor), D-3 (level adapters pin model and effort at zero config; the MODEL-01 baseline is re-pinned by recorded decision, the test is not loosened; `models.roles.software-engineer` applies to all three levels), D-5 (level adapters for Claude Code only), D-9 (no `level` ticket key; the level lives in the Tech Lead note and the ticket body).

#### Tech Lead: when it runs and what it owns
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

#### Rubric and level adapters
- **D-11:** Adopt the research rubric **F1–F6** as **starting values**, labelled LOW confidence and to be calibrated after about 30 scored tickets: F1 files touched, F2 spec completeness, F3 risk surface, F4 novelty, F5 test burden and F6 blast radius, each scored 0/1/2, sum 0–12. Mapping: 0–3 → junior (**only if F2 = 0 and F3 = 0**), 4–7 → mid, 8–12 → senior. Overrides: F3 = 2 → at least mid. F2 = 2 → not dispatchable, back to the Architect (D-05). Size XL → `SPLIT_REQUIRED`. The source table is in `.planning/research/FEATURES.md` § Rubric.
- **D-12:** The rubric text lives in a **new checklist file**, `agent-factory/checklists/complexity-rubric.md`, and `tech-lead.md` points to it, which keeps the role inside its D-1 ceiling. It also needs a row in `checklists/00-index.md`.
- **D-13:** Adapter names: **`grugops-software-engineer-junior`, `grugops-software-engineer-mid`, `grugops-software-engineer-senior`**. They **replace** `grugops-software-engineer`, leaving no base adapter. Adapters: 18 one-to-one + 3 = **21**. Every engineer dispatch names a level.
- **D-14:** Effort: junior `medium` (D-2), mid `medium`, senior `high`. Models: junior `haiku`, mid `sonnet`, senior `opus`. They live in one resolver-owned `LEVELS` table in `scripts/model-tiers.ts`, with a written rationale per row (quality arguments only, no cost claims).
- **D-15:** **Per-level override keys:** `models.roles.software-engineer` applies to all three levels (D-3), and `models.roles.software-engineer-junior|mid|senior` overrides one level. The reader's legal key set is derived from the filesystem, never typed by hand. The same applies to `models.effort.roles`.
- **D-16:** An explicit **`models.preset: "none"` leaves the level pins in place**. `none` keeps meaning "no tiered preset for the other roles", which preserves the existing `none` ≡ absent equivalence. Only an explicit `models.roles.*` entry changes a level.
- **D-17:** **The Tech Lead names the adapter.** It writes the level in its note and in the ticket section, and the Orchestrator dispatches exactly that adapter by name (a named, non-fork spawn) and never re-decides. On the five non-Claude hosts the single engineer role reads `## Levels` and works within the chosen level's scope, **with no model advice** (grugops cannot switch the model there).

#### Escalation path
- **D-18:** Triggers: the engineer reports **BLOCKED**, or the **WF05 gate fails a second time** after the bounded self-fix.
- **D-19:** **The Tech Lead decides every time.** No level-up happens automatically. On a trigger, the engineer publishes a `failed-attempt` note (it holds the trajectory, per WF18) and the ticket moves to **`## Blocked`** with its reason. The Tech Lead owns the exit for blocks raised during dev. It reads the failed-attempt note and chooses one of four moves: **escalate one level (at most once per ticket)**, **re-plan** (and re-score), **split**, or **send back to the Architect**. Its choice is a new decision note, and the ticket returns to `Ready for Dev`. The Orchestrator then re-enqueues the work for the adapter the note names.
- **D-20:** **The Orchestrator never relays data.** It only asks a role to work on X; every fact travels through published notes and the queue (TIER-04: "never a relayed prompt").
- **D-21:** After the Tech Lead's options are used up (the single escalation spent and a re-plan, split or Architect pass also blocked), the ticket **stops for a named human**. No retry loops.
- **D-22:** Claude Code v2.1.293 floor: **documented only** in Phase 39, in the D-2 amendment record and the install docs. No `claude --version` probe in `--check` (new behavior, `UNKNOWN - verify`); the doctor work belongs to Phase 42.

#### Designer
- **D-23:** **The whole role plus the WF14 wiring land in Phase 39.** That covers the Designer role file, its output, WF14 running the Designer before Frontend/UI, and Frontend/UI reading the guidelines. Phase 42 adds only the optional ui-ux-pro-max path and the `design-system/` user-artifact rule (SKILL-04).
- **D-24:** The Designer's guidelines are **published notes only** (typed `decision`/`artifact-ref` notes per WF16, with a verification stamp). No new `memory-bank/` master file, so there is no new layout constant or budget.
- **D-25:** Cadence: **the first UI work in a repo triggers it once per product**. A UI epic re-runs it only when it needs a new direction. Per-ticket UI goes straight to Frontend/UI against the existing guidelines.
- **D-26:** Split of ownership. **The Designer owns the system:** principles, the token system (palette, type scale, spacing), style direction, the product-wide accessibility bar (WCAG 2.2 AA) and generated-design tells to avoid. **Frontend/UI keeps the per-ticket work:** the component inventory, the five states, per-ticket WCAG application and the visual baseline. Frontend/UI **reads** the tokens from the Designer's notes instead of naming them; its role text and WF14 step 1 change to say so.
- **D-27:** The Designer is **`tier: core`** and activates only on UI work, so repos with no UI never run it. Model `inherit` at zero config (a judgment role, D-09).

#### `skills:` key
- **D-28:** `skills:` is a **role-side declaration only and is never emitted** into the generated Claude Code adapter's frontmatter (Claude Code's adapter `skills:` field preloads skill text, which Phase 42 forbids). The role text, the Phase 42 doctor and the Phase 43 docs read it.
- **D-29:** Phase 39 delivers **the grammar only**: the parser, the canonical-grammar admission and tests with a fixture. **No shipped role declares a value in 39**; Phase 42 fills them in after the SKILL-02 evaluation.

#### Orchestrator and enforcement
- **D-30:** `orchestrator.md` (6,817 B; warn 7,165, ceiling 7,570) must **fit its ceilings without raising them**. Rewrite the routing lines compactly, for example `plan -> Tech Lead; code -> Software Engineer (level from Tech Lead)` and `design system -> Designer`, and trim elsewhere. The dual-path equivalence oracle stays green.
- **D-31:** The junior exclusions are enforced **in text**, in two places: the rubric's F3 rule (any excluded tag makes junior impossible) and the engineer's `## Levels` section, which tells a junior to stop BLOCKED if it meets one. No new validator check that parses note text.

### Claude's Discretion
- How the generator expands one role into N adapters (the `levels:` frontmatter key vs another mechanism), the exact `LEVELS` table shape and its two-sided count pin. Research recommends `levels: junior mid senior` in role frontmatter plus `listAgentAdapterNames()`.
- The `skills:` list grammar (flow-form list vs the space-separated `capabilities` style). Research says flow-form is preferred and the grammar is `UNKNOWN - verify`. Also whether role frontmatter needs a `CANONICAL_SCHEMA` change (ARCHITECTURE.md says role frontmatter is not under it, while TIER-07 says "admitted by the canonical frontmatter grammar"; the researcher resolves which grammar governs).
- Whether `effort` applies to haiku on v2.1.293+. If it is rejected or ignored, the junior adapter omits the line and the D-2 record says so.
- How every derived count moves: `ROLE_COUNT` 17 → 19, adapters 17 → 21, spawn grant 16 → 20 names, `SPAWN_GRANT_SCAN_COUNT`, `TIERED` rows, `roleCeiling()` entries for the two new roles, `TECHNICAL_NAMES_COUNT`, `AUDIT_SET_COUNT`, `WATCHED_CORPUS_MIN`. All are derived from the filesystem, with no hand-typed list (TIER-06).
- The exact layout of the `## Tech Lead plan` section and the decision note.

### Deferred Ideas (OUT OF SCOPE)
- A `claude --version` probe in `install --check` that warns below v2.1.293: Phase 42 (doctor work).
- Batching same-shape small tickets into one dispatch: after rubric calibration data exists.
- Calibrating the rubric thresholds from about 30 logged scored tickets: a future milestone.
- A validator check that cross-checks junior against the F3 tags in note text: not planned. Text enforcement is enough for now.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TIER-01 | Tech Lead role scores complexity on a written per-factor rubric, records score + level in a note and the ticket body, pre-plans dev tasks | § Pattern 9 (new role skeleton and guard obligations), § Pattern 10 (WF04 step), new `complexity-rubric.md` checklist (lexicon gate obligations in Pitfall 7) |
| TIER-02 | One `software-engineer.md` yields three generated Claude Code adapters: junior (haiku, effort medium), mid (sonnet), senior (opus), each with its own effort; guidance on the other five hosts | § Patterns 1–4 (levels key, `LEVELS`, 1:N generator, resolution precedence); platform facts in § State of the Art (effort on Haiku 5.5 verified) |
| TIER-03 | Junior takes only fully specified tasks, never security/migration/concurrency/test-integrity work; D-09 amendment and v2.1.293 floor recorded | § Pattern 10, Pitfall 9 (F3 table lacks "test integrity"), Pitfall 10 (`haiku` is Haiku 4.5 on four providers), § D-2 amendment record sites |
| TIER-04 | Stuck or twice-failed engineer escalates one level once via a `failed-attempt` note and a queue re-enqueue, never a relayed prompt | § Pattern 10, Open Question 1 (conflict with `exhaust_self_fix_budget` checkpoint), Pitfall 11 (per-invocation `model` parameter outranks frontmatter) |
| TIER-05 | Designer role sets design strategy and guidelines; Frontend/UI reads them per ticket | § Pattern 9, § Pattern 10 (WF14), Pitfall 3 (`frontend-ui.md` 19 B under WARN) |
| TIER-06 | Adapter-name set, spawn allowlist, role/adapter counts, model/effort tiers and size ceilings follow the filesystem; MODEL-01 baseline re-pinned by recorded decision | § Derived-Set Census (every hand list and count, with file:line), § Pattern 5 (baseline re-pin), § Pattern 6 (zero-config redefinition), § Pattern 7 (`roleCeiling` as a keyed table) |
| TIER-07 | Roles can declare `skills:` admitted by the canonical frontmatter grammar | § Pattern 8 (probe: canonical grammar refuses flow lists and `:`; admits space-separated and block lists) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Tooling is TypeScript compiled with `tsc` to **committed `.js`**, freshness-checked; hosts run the `.js` with **zero runtime dependencies**; dev deps only `{typescript, vitest, @types/node}`. No new npm package in this phase.
- **Single-source:** role text lives once; adapters are thin generated pointers, never copies. Hand-writing `model:` into a wrapper is a named anti-pattern; a non-default `model:` is legitimate only when resolved by the generator from the `models` dial (`scripts/model-tiers.ts`).
- **Zero-config first:** every role honors `factory.config.json` when present and runs lean when absent.
- **Voice discipline:** caveman voice in role prompts (still enforced by guards until Phase 40's flip), clear voice in security, compliance, money and disclaimers. Tier rationales are quality arguments only.
- **No fabrication:** unknown facts are `UNKNOWN - verify`; never fake a gate, test or citation.
- **Installers:** idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content.
- **Safety (hard):** agents never merge a protected branch and never deploy prod; only the coordinator holds the spawn grant.
- **Brand:** lowercase `grugops`.
- **GSD workflow enforcement:** edits only through a GSD command (`/gsd-execute-phase`).
- Links use `code.claude.com/docs/en/*`, never `docs.claude.com`.

## Summary

The phase is mostly a derivation-plumbing change with a thin layer of new kit prose. Today every consumer assumes **one role stem → one adapter name → one model/effort resolution**: the generator (`generate-role-adapters.ts:375`), the KIT-03 oracle (`check-foundation-guards.ts:3673`), the model and effort guards (`roleStemOf`, `:3658`), the freshness gate's zero-config definition (`adapters-freshness.ts:322,390,614-615`), the MODEL-01 byte baseline (`adapter-byte-baseline.test.ts:356,433,455`, all `toBe(ROLE_COUNT)`), and a test-side re-derivation of the grant (`generate-role-adapters.test.ts` ~2024). Each must switch to one new derivation, `listAgentAdapterNames()` in `kit-model.ts`, which expands roles that declare `levels:`. Model/effort resolution must become **per adapter stem** with level pins that sit outside every preset (D-16).

Three facts change the plan materially and were not in CONTEXT.md or the milestone research. (1) `orchestrator.md` is **7,359 B today, not 6,817 B**: it is already over WARN (7,165) with **211 B** of headroom to FAIL (7,570), so D-30's compact rewrite must net-shrink. `software-engineer.md` (3,639 B, FAIL 3,906) and `frontend-ui.md` (3,738 B, WARN 3,757) also cannot absorb a full `## Levels` or "read the Designer's tokens" paragraph without a recorded ceiling move. (2) The canonical grammar **refuses flow lists** (`[a, b]` → `flow-collection`) and **refuses `:`** in plain scalars, so the milestone research's "prefer flow form" is wrong for TIER-07, and plugin-namespaced skill names (`plugin:skill`) cannot be admitted without a safety-authority decision. (3) On Claude Platform on AWS, Amazon Bedrock, Google Cloud's Agent Platform and Microsoft Foundry the `haiku` alias resolves to **Haiku 4.5, which supports no effort level**; the v2.1.293 floor applies to Haiku 5.5 only.

**Primary recommendation:** Build the derivation first (Wave 1: `levels:` declaration + `listAgentAdapterNames()` + `LEVELS` + per-adapter resolution + zero-config redefinition, with every count moved once and every guard switched), then the generator and baseline re-pin (Wave 2), then the kit prose (Wave 3: two new roles, rubric checklist, WF04/WF14, orchestrator/engineer/frontend-ui edits, docs, register rows, disposition rows). Keep `skills:` out of every adapter by making the canonical module's **default** schema the current adapter schema and admitting role files under an explicit role schema.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Which roles and adapter names exist | Kit-set authority (`scripts/kit-model.ts`) | — | Every guard, generator and test asks it; a second derivation is the set-literal-drift class |
| Level → model/effort pin, rationale | Model resolver (`scripts/model-tiers.ts` `LEVELS`) | Config dial (`.grugops/factory.config.json` `models`) | D-14: one resolver-owned table; the dial overrides |
| Emitting adapters, the coordinator grant | Generator (`scripts/generate-role-adapters.ts`) | Installer (renders in a temp mirror against the target's config) | Adapters are generated, never hand-authored |
| Enforcing set equality, counts, ceilings | Guards (`check-foundation-guards.ts`, `validate-agent-factory.ts`, lexicon, banned-claims, audit register) | Tests (vitest) | Fail-closed CI floor |
| Frontmatter grammar for `skills:` | Canonical admission (`scripts/canonical-frontmatter.ts`) | Convenience reader (`scripts/frontmatter.ts`) for the generator's read | TIER-07 names the canonical grammar |
| Scoring, planning, level choice, escalation choice | Kit text: `tech-lead.md` + `complexity-rubric.md` + WF04 | Shared verified context (decision / failed-attempt notes) | Role is the intelligence; notes are the memory |
| Design system | Kit text: `designer.md` + WF14 | Shared verified context | Notes only (D-24) |
| Model switching per level | Host runtime (Claude Code subagent `model`/`effort`) | — | D-5: Claude Code only; guidance elsewhere |

## Standard Stack

No new library. Everything uses what the repo already ships.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3 (`npx tsc --version`) | Authoring the tooling layer | Ratified D-13 [VERIFIED: local tool] |
| vitest | 4.1.8 (`npx vitest --version`) | Tests | Existing suite [VERIFIED: local tool] |
| Node.js | v26.12.1 local; `engines.node ">=22"` | Running committed `.js` | [VERIFIED: package.json:8] |
| Claude Code | 2.1.312 local (`claude --version`) | Target host for level adapters | Above the v2.1.293 floor [VERIFIED: local tool] |

### In-repo modules this phase extends
| Module | Change |
|--------|--------|
| `scripts/kit-model.ts` | `ROLE_COUNT` 17→19, `SPAWN_GRANT_SCAN_COUNT` 33→37, new `listAgentAdapterNames()` / adapter-stem derivation |
| `scripts/model-tiers.ts` | `LEVELS` table + `LEVEL_COUNT`, per-adapter resolution, legal key set = role stems ∪ adapter stems, zero-config map |
| `scripts/generate-role-adapters.ts` | 1:N emission, level description/body line |
| `scripts/canonical-frontmatter.ts` | role keys + default (adapter) schema split (Pattern 8) |
| `scripts/check-foundation-guards.ts` | KIT-03, model/effort guards on adapter stems; `roleCeiling` → keyed table |
| `scripts/adapters-freshness.ts` | zero-config definition includes level pins |
| `scripts/check-imperative-lexicon.ts`, `scripts/check-banned-claims.ts`, `scripts/checkpoints.ts` | count pins moved by measured run |

**Installation:** none.

## Package Legitimacy Audit

Not applicable: this phase installs no external package. **Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 agent-factory/roles/*.md  (19 roles; software-engineer.md declares `levels: junior mid senior`)
            |
            v
 kit-model.listRoles() ──> kit-model.listAgentAdapterNames()      <── single derivation
            |                    |  grugops-<stem>  or  grugops-<stem>-<level>   (21 names)
            |                    |
            |      +-------------+--------------------------------------------+
            |      |                     |                       |            |
            v      v                     v                       v            v
  model-tiers.readModelsConfig   generate-role-adapters   check-foundation-guards  tests / baseline
  (legal keys = role stems ∪       (one adapter per name;   KIT-03: names ==       (counts derived,
   adapter stems)                   grant = names − coord)   adapter dir == grant   MODEL-01 re-pinned)
            |                            |                   model/effort per
            v                            |                   adapter stem
  resolve per adapter stem:              |
   level adapter: roles[stem-level]      |
     ?? roles[stem] ?? LEVELS[level]     |
   other adapter: roles[stem]            |
     ?? preset(none→inherit|tiered→TIERED)
            |                            |
            +---------> .claude/agents/grugops-*.md  ──> installer renders in temp mirror
                                         |               against the target's config
                                         v
                         Claude Code session: Orchestrator (coordinator, Agent(<20 names>))
                                         |
   ticket ─> DoR (Orchestrator) ─> Tech Lead (score F1–F6 per complexity-rubric.md,
                                      decision note + `## Tech Lead plan`, names adapter)
                                         |
                       F2=2 ─> In Design (Architect) | XL ─> SPLIT_REQUIRED
                                         v
                    Orchestrator spawns the NAMED level adapter (no `model` parameter)
                                         |
                engineer BLOCKED or 2nd gate failure ─> failed-attempt note + `## Blocked`
                                         v
             Tech Lead decision note: escalate once | re-plan | split | Architect
                                         v
             new pending/ task (ref: context) for the adapter the note names
                                         v
                     options exhausted ─> stop for a named human
```

### Recommended Project Structure (new and changed files)
```
agent-factory/
├── roles/tech-lead.md              # NEW (tier: core)
├── roles/designer.md               # NEW (tier: core, UI work only)
├── roles/software-engineer.md      # + `levels:` key, + short `## Levels`
├── roles/frontend-ui.md            # reads Designer tokens
├── roles/orchestrator.md           # compact routing rewrite, must SHRINK
├── checklists/complexity-rubric.md # NEW (F1–F6), governed by the lexicon gates
├── checklists/00-index.md          # + row
├── workflows/04-ticket-to-pr.md    # Tech Lead step, escalation steps, stop bullets
├── workflows/14-ui-design-to-build.md  # Designer before Frontend/UI
├── packaging/subagent.frontmatter.md   # count-free prose, level-adapter shape documented
└── config/factory.config.md        # level stems, preset-none behavior, haiku facts
.claude/agents/                      # regenerated: 21 files; grugops-software-engineer.md DELETED (git rm)
docs/audit/28-disposition-register.md   # + 2 role rows
docs/audit/29-style-dispositions/39-*.md # disposition rows for every changed watched clause
```

### Pattern 1: `levels:` declaration + one adapter-name derivation
**What:** `software-engineer.md` frontmatter carries `levels: junior mid senior` (space-separated, the `capabilities` style). `kit-model.ts` exports the derived adapter set; every consumer asks it.
**When to use:** every place that today computes `` `${AGENT_PREFIX}${stem}` `` or strips the prefix back to a role stem.
**Evidence:** the prefix rule is computed in two production places — `const name = \`${AGENT_PREFIX}${stem}\`;` [VERIFIED: scripts/generate-role-adapters.ts:375] and `const roleNames = ROLE_FILES.map((p) => \`${AGENT_PREFIX}${stem(basename(p))}\`).sort();` [VERIFIED: scripts/check-foundation-guards.ts:3673], with `const AGENT_PREFIX = "grugops-";` declared separately in each file [VERIFIED: generate-role-adapters.ts:153; check-foundation-guards.ts:3651].
**Parsing:** `parseFrontmatter` returns a space-separated value as one string: probed this session, `levels: junior mid senior` → `[["levels",["junior mid senior"]]]` [VERIFIED: probe of scripts/frontmatter.js]. Reading it inside `kit-model.ts` means `kit-model.ts` imports `./frontmatter.js` (new edge; `frontmatter.ts` has no imports, so no cycle). Do **not** write a local line parser: a third frontmatter grammar is pinned red by the D-50 IN-05 case in `scripts/frontmatter.test.ts` [CITED: scripts/frontmatter.ts header].
**Refusals the derivation must name (fail closed, throw like the rest of kit-model):** a `levels` key present more than once; an empty value; a duplicate token; a token that is not lower-case kebab; an expanded name that collides (case-folded) with another role's adapter name (e.g. a future `software-engineer-junior.md` role). Validating tokens against the `LEVELS` table happens in the generator and the model guard (kit-model cannot import model-tiers: `model-tiers.ts` imports `ROLE_COUNT` from `kit-model.js` [VERIFIED: scripts/model-tiers.ts:146], so the reverse import is a cycle).

### Pattern 2: `LEVELS` table, two-sided
**What:** one table in `model-tiers.ts`, row style of `TIERED` (`RoleTier` requires `rationale` and `effortRationale` by type [VERIFIED: scripts/model-tiers.ts:193-207]). Values must come from the closed vocabularies: `export const MODEL_ALIASES = ["inherit", "opus", "sonnet", "haiku"] as const;` [VERIFIED: scripts/model-tiers.ts:165] and `export const EFFORT_LEVELS = ["inherit", "low", "medium", "high", "xhigh", "max"] as const;` [VERIFIED: scripts/model-tiers.ts:314]. Rows per D-14. Pin `LEVEL_COUNT` two-sided and assert `set(declared levels across roles) == set(LEVELS.level)` in both directions. Run the existing digit refusal and the test-side cost/speed vocabulary refusal over `LEVELS` rationales too (`tieredTableRefusals` refuses digits in `effortRationale` [VERIFIED: scripts/model-tiers.ts:1265-1340]).
**Consistency note:** D-14's efforts equal what the `tiered` effort rule would compute — that rule is `value.set(stem, alias === "opus" ? "high" : "medium");` [VERIFIED: scripts/model-tiers.ts resolveEfforts, tiered branch] — so haiku→medium, sonnet→medium, opus→high. Store the effort explicitly in `LEVELS` anyway (D-14 says each level has its own effort).

### Pattern 3: Resolution precedence per adapter stem (recommended)
For a level adapter `grugops-<role>-<level>`: `models.roles["<role>-<level>"]` → else `models.roles["<role>"]` → else `LEVELS[<level>].alias`. Presets never touch a level adapter (D-16: `none` keeps pins; recommend `tiered` keeps them too, since the levels exist to differ). Effort: the same chain through `models.effort.roles`. For every other adapter: unchanged (`roles[stem]` beats preset). Legal config keys = role stems ∪ level adapter stems, derived (D-15). Today the reader refuses any key outside the stem set it is handed: `if (validStems.has(key)) continue; return { ok: false, ... }` [VERIFIED: scripts/model-tiers.ts readModelsBlock], so passing the union is the whole change there.
**TIERED and the leveled role:** recommend removing the `software-engineer` row from `TIERED` (no adapter would ever read it — a dead row is a second answer to one fact) and making `tieredCorpusRefusals` compare the table against the **preset-governed** stems (role stems with no `levels`), derived. Add rows for `tech-lead` (opus, D-03) and `designer` (rationale needed; see Open Question 4). Today `export const MODEL_TIERS_COUNT = ROLE_COUNT;` [VERIFIED: scripts/model-tiers.ts:1244]; that equality no longer holds and must become a derived count, with `guard_model_assignment`'s `TIERED.length !== MODEL_TIERS_COUNT` arm walked.
**Keep `resolveModels` pure and keep one entry point**: generator, guards, freshness gate and installer probe must all compute the per-adapter map the same way. Recommend one exported resolver over adapter specs (`{adapterStem, roleStem, level | null}`) so no consumer rebuilds the chain.

### Pattern 4: Generator 1:N
In `generate-role-adapters.ts`, per role: if it declares levels, push one `Adapter` per level with `name = grugops-<stem>-<level>`, model/effort from the per-adapter resolution, the same `tools` (capabilities are per role), a description that names the level (otherwise three adapters carry the identical routing description `"Implement one ticket end to end. Use when: Need code (one ticket)."` [VERIFIED: .claude/agents/grugops-software-engineer.md:3]), and one generated body line pointing at `## Levels`. The grant stays `adapters.filter((a) => !a.isCoordinator).map((a) => a.name).sort()` [VERIFIED: generate-role-adapters.ts:497-500], so it picks up the level names with no hand list. Keep the collision check (case-folded `seenNames`) over the expanded names.
**The generator only writes; it never deletes** (`writeFileSync` loop, [VERIFIED: generate-role-adapters.ts:603-610]). The committed `.claude/agents/grugops-software-engineer.md` must be removed with `git rm` in the same change, or KIT-03 reports an adapter with no derived name.
**The emitted `effort:` line is written only when not `inherit`** (`if (a.effort !== "inherit") lines.push(\`effort: ${a.effort}\`);` [VERIFIED: generate-role-adapters.ts:573]) — so at zero config exactly the three level adapters carry an `effort:` line.

### Pattern 5: MODEL-01 baseline re-pin by recorded decision
Today the test pins `const PRE_PHASE_ADAPTER_BASELINE = "6f8411effe80b3f22d0d668e1fa40fa78e3a8088";` [VERIFIED: scripts/adapter-byte-baseline.test.ts:82], asserts adapter count `toBe(ROLE_COUNT)` three times (`:356`, `:433`, `:455`), and asserts no zero-config adapter carries an `effort:` line (`const EFFORT_LINE_PREFIX = "effort: ";` [VERIFIED: :58]). Its own comment argues against moving the pin to a tree the generator under test produced. Recommended shape, consistent with D-3's "re-pinned by recorded decision":
1. Move the pin to the **last commit before any Phase-39 generator change** (the "commit this phase started from" practice the file already documents; HEAD at research time is `53e2163c698a8cb646e8b096dab54216708c4ef6` [VERIFIED: git rev-parse HEAD] — the planner takes the real commit at execution). The three prior divergences are then inside the baseline and their transforms retire, with the pre-29.1 pin and its transforms recorded in the decision text.
2. Express Phase 39 as **stated, independent transforms** of that baseline: the 15 untouched specialists byte-identical; the coordinator `tools:` line = baseline grant names − `grugops-software-engineer` ∪ the derived new names (assert the new names equal `listAgentAdapterNames()` minus the coordinator **and** equal a literal list written in the decision record — two sources); the three level adapters = baseline `grugops-software-engineer.md` with the name, description, model, effort and level lines transformed, the model/effort values asserted against the D-14 literals in the test (the decision is the second opinion, not `LEVELS`); the two new role adapters have no baseline and are asserted present with `model: inherit` and no `effort:` line.
3. Replace "no adapter carries `effort:`" with a two-sided statement: exactly the level adapters carry one `effort:` line each, equal to the D-14 value; every other adapter carries none.
4. Every `toBe(ROLE_COUNT)` on adapters becomes the derived adapter count.

### Pattern 6: Zero-config redefinition (the freshness gate)
`adapters-freshness.ts` requires every adapter at one zero-config alias derived from `inheritForEveryStem`: `const ZERO_CONFIG_ALIASES = [...new Set(inheritForEveryStem(["any-stem"]).values())].sort();` [VERIFIED: scripts/adapters-freshness.ts:322] and `checkAnnouncedMap("model", assignment.value.byAdapter, ZERO_CONFIG_ALIASES[0]);` [VERIFIED: :614] (effort at `:390`, `:615`). With level pins this gate goes red on a correct tree. Export one `zeroConfig...` map from `model-tiers.ts` (inherit for non-level adapters, `LEVELS` for level adapters) and make the gate compare each adapter against its own zero-config value. Keep `overrides !== 0` (level pins are base values, not overrides). The same function replaces the guards' degrade target (`resolved = inheritForEveryStem(stems);` in `guardModelAssignment` and `inheritEffortForEveryStem` in `guardEffortAssignment`): degrading to the zero-config answer is the D-11 principle once zero config itself pins levels (see Assumption A5).

### Pattern 7: `roleCeiling` as a keyed table with two-sided key equality
`roleCeiling` is a 17-case `switch` with `default: return "";` [VERIFIED: scripts/check-foundation-guards.ts:3421-3460], and its comment records D-17 (Phase 27): the values are measured baselines and must not be derived. TIER-06 still requires the ceiling **set** to follow the filesystem. Convert to an exported `ROLE_CEILINGS` record (values stay measured, "FAIL WARN" per role) and assert `keys(ROLE_CEILINGS) == listRoles()` both directions: a role with no ceiling stays red (as today) and a stale ceiling for a deleted or renamed role becomes red (impossible to detect with a `switch`). New rows: measure the drafted `tech-lead.md` and `designer.md`, then FAIL = +12 %, WARN = +6 % per the table's documented rule.

### Pattern 8: `skills:` grammar under the canonical admission (TIER-07)
Facts from a probe run this session against the committed `.js` and a scratch copy (repo untouched):
- Current `CANONICAL_SCHEMA` is `"allowed-tools", "argument-hint", "coordinator", "description", "disable-model-invocation", "effort", "kind", "model", "name", "tier", "tools"` [VERIFIED: scripts/canonical-frontmatter.ts:196-208]; `capabilities`, `levels` and `skills` are each refused `unknown-key` today [VERIFIED: probe].
- `admit()` narrows only: `CANONICAL_SCHEMA.filter((k) => options.schema?.includes(k) === true)` [VERIFIED: canonical-frontmatter.ts:573-576].
- With `capabilities`, `levels`, `skills` added on a scratch copy: all 18 files in `agent-factory/roles/` are admitted; `skills: ui-ux-pro-max frontend-design` is admitted; a block list (`skills:` + `  - a`) is admitted; `skills: [a, b]` is refused `flow-collection`; `skills: superpowers:test-driven-development` is refused `plain-scalar-charset` (`:` is outside the alphabet); a bare `skills:` with no items is refused `dangling-empty-key` [VERIFIED: probe].
- `parseFrontmatter` returns a flow list **raw** (`"[ui-ux-pro-max, frontend-design]"`) and a block list comma-joined (`"ui-ux-pro-max, frontend-design"`) [VERIFIED: probe] — another reason not to use flow form.

**Recommendation:** space-separated tokens (same as `capabilities` and `levels`), each token lower-case kebab. Widen `CANONICAL_SCHEMA` to the union (role keys included) as a recorded safety-authority decision (precedent: D-15 widened it by `effort`), **and change `admit(text)`'s default schema to an exported `ADAPTER_SCHEMA` equal to today's 11 keys**, so no existing adapter call site changes behavior and an adapter carrying `skills:` is still refused (`unknown-key`), which enforces D-28 mechanically. Role files are admitted with an explicit `ROLE_SCHEMA` (`kind`, `tier`, `capabilities`, `levels`, `skills`) by a new guard over `listRoles()` (+ the protocol file). The key-union test (`canonical-frontmatter.test.ts:233-288`, two-sided) gains the role corpus plus a `skills` fixture, because no shipped role declares a value (D-29). See Open Question 2 for the plugin-name (`:`) problem this grammar leaves to Phase 42.

### Pattern 9: The two new roles under today's guards
Each new role must satisfy, in Phase 39, everything a role satisfies today:
- Sections (prefix match): `"## One job", "## Caveman prompt", "## Reads", "## Responsibilities", "## Output", "## Board moves", "## Trace updates", "## Hard limits"` [VERIFIED: scripts/validate-agent-factory.ts:369-378], plus `## Activates when` (the generator refuses a role without it [VERIFIED: generate-role-adapters.ts:446-451]) and a `# Role: <Name>` heading (display-name derivation throws without it [CITED: scripts/kit-model.ts readDisplayName]).
- A caveman fence with ≥ `CAVEMAN_LEXICON_MIN` (`export const CAVEMAN_LEXICON_MIN = 2;` [VERIFIED: scripts/voice-model.ts:399]) lexicon terms and **zero** banned constructions (articles, copulas, modals, subordinators), and zero caveman markers outside the fence — `guard_caveman_voice` iterates every role [VERIFIED: check-foundation-guards.ts guardCavemanVoice]. "Drafted in plain English" applies to the body; the fence stays until Phase 40's atomic flip.
- Exactly one `16-context-read-write` reference (after the test's hand list is derived — see Census row C3).
- No intra-file repeated clause (`guard_role_clause_uniqueness`).
- A row in `docs/audit/28-disposition-register.md` (`check-audit-register` compares the register against `listRoles()` [VERIFIED: scripts/check-audit-register.ts runAll]).
- A `ROLE_CEILINGS` entry.
- Frontmatter `capabilities` from the closed vocabulary `read edit shell web plan admit` [VERIFIED: generate-role-adapters.ts:181-193]; `admit` is coordinator-only by design.

### Pattern 10: Kit prose edits
- **WF04:** insert the Tech Lead step after step 1, the escalation steps (engineer publishes `failed-attempt`, moves the ticket to `Blocked` naming the Tech Lead as the owner who can clear it; Tech Lead decision note; new `pending/` subtask for the named adapter), and the "never pass a `model` parameter when spawning a level adapter" rule. `## Steps` bullets must start with an approved step verb, ≤ 20 words, no modals (WP-01, WP-02, WP-05) [CITED: agent-factory/writing-profile.md § The rules].
- **Re-enqueue is a new subtask:** WF17 says a done subtask moves to `done/`; D-7 says `done/` is archive-only, so an escalation is a new `pending/` file whose `ref:` points at the same per-task context.
- **WF14:** Designer step before Frontend/UI (once per product, re-run per UI epic only on a new direction); step 1 changes "names the design tokens" to "reads the tokens from the Designer's notes".
- **Stop conditions:** any new bullet moves `WORKFLOW_STOP_BULLET_COUNT` (`export const WORKFLOW_STOP_BULLET_COUNT = 43;` [VERIFIED: scripts/checkpoints.ts:320]). D-21's "stop for a named human" is a human hand-off, which under this repo's rule earns a `checkpoint:` tag; reusing an existing id moves `CHECKPOINT_SITE_COUNTS[id]` and `export const RECORDED_TOTAL_SITES = 17;` [VERIFIED: checkpoints.ts:750-774]. Recommend reusing `escalate_unadjudicable_result` (its existing use is "agents disagree and cannot resolve it → escalate to a named human" [VERIFIED: agent-factory/workflows/16-context-read-write.md:47]). `checkpoints.js` is in the admission hook's frozen closure, so the hook manifest regenerates.
- **orchestrator.md:** today 7,359 B [VERIFIED: wc -c] against `"7570 7165"` [VERIFIED: check-foundation-guards.ts roleCeiling]. The current routing block is 8 lines inside a fence; the edit must net-shrink by at least the bytes it adds.

### Anti-Patterns to Avoid
- **Typing the 20 grant names or the three level names anywhere outside the decision record and the derivation.** That recreates the v2.1 founding defect (7 granted names, 0 files).
- **Keeping a base `grugops-software-engineer` adapter "for compatibility".** D-13 forbids it; it would need a KIT-03 carve-out.
- **Loosening `adapter-byte-baseline.test.ts`** (e.g. dropping the effort assertion). D-3 forbids it.
- **Adding `skills` to the default adapter schema.** It would admit an adapter preloading skill text (D-28).
- **A model-to-effort capability table.** The module records D-08: no such table, every pair written as configured [VERIFIED: model-tiers.ts EFFORT_LEVELS comment].
- **Cost words in rationales** ("cheaper", "faster", digits). Refused by the digit check and test vocabulary; banned-claims gate.

## Derived-Set Census (TIER-06) — every hand list and count this phase touches

Verified this session by reading the definition (file:line). "Moves to" values marked *measure* must be taken from the gate's own output after the change, never typed ahead.

### A. Literal count pins that move
| # | Site | Verbatim today | Moves to |
|---|------|----------------|----------|
| A1 | `scripts/kit-model.ts:107` | `export const ROLE_COUNT = 17;` | 19 |
| A2 | `scripts/kit-model.ts:183` | `export const SPAWN_GRANT_SCAN_COUNT = 33;` | 37 (agent part 17→21; comment says "17 agent adapters + 7 standalone skill adapters + 7 plugin-form skill adapters + 2 packaging templates") |
| A3 | `scripts/check-imperative-lexicon.ts:884` | `export const TECHNICAL_NAMES_COUNT = 76;` | *measure* (expect 78: role display names "Tech Lead", "Designer") |
| A4 | `scripts/check-imperative-lexicon.ts:467` | `export const GOVERNED_CORPUS_COUNT = 48;` | 49 (`complexity-rubric.md` enters the checklists part) |
| A5 | `scripts/check-banned-claims.ts:1527` | `export const BANNED_CLAIM_SCAN_COUNT = 121;` | *measure* (kit +3 files, claudeAdapters +4; estimate 128, `[ASSUMED]`) |
| A6 | `scripts/checkpoints.ts:320` | `export const WORKFLOW_STOP_BULLET_COUNT = 43;` | + new stop bullets |
| A7 | `scripts/checkpoints.ts:750,774` | `CHECKPOINT_SITE_COUNTS` / `export const RECORDED_TOTAL_SITES = 17;` | + tagged sites |
| A8 | `scripts/model-tiers.ts:1244` | `export const MODEL_TIERS_COUNT = ROLE_COUNT;` | derived count of preset-governed stems (Pattern 3) |
| A9 | NEW in `model-tiers.ts` | — | `LEVEL_COUNT = 3`, two-sided |

### B. Derived from `ROLE_COUNT` — move automatically; verify, do not edit
| Site | Verbatim |
|------|----------|
| `scripts/audit-prepass.ts:91` | `export const AUDIT_SET_COUNT = ROLE_COUNT + WORKFLOW_COUNT + 1;` (37 → 39) |
| `scripts/check-diff-disposition.ts:1461` | `export const WATCHED_CORPUS_MIN = ROLE_COUNT + WORKFLOW_COUNT;` (36 → 38) |
| `scripts/check-foundation-guards.ts:2805` | `const VOICE_FILE_COUNT = ROLE_COUNT + SEC_VOICE_FILE_COUNT;` |

### C. Hand-typed lists and tables
| # | Site | What | Action |
|---|------|------|--------|
| C1 | `check-foundation-guards.ts:3421-3460` | `roleCeiling` switch, 17 cases | keyed table, two-sided key equality (Pattern 7) |
| C2 | `model-tiers.ts:1017` | `TIERED`, 17 rows | + `tech-lead`, `designer`; drop `software-engineer` (recommended) |
| C3 | `scripts/admission-protocol-docs.test.ts:29` | `const ROLE_BASENAMES = [` 17 literal basenames | derive from `listRoles()` — today the two new roles would be silently unchecked for the WF16 reference |
| C4 | `scripts/validate-agent-factory.ts:351` | `const CHECKLISTS = [` 11 names (existence only) | add `complexity-rubric` |
| C5 | `docs/audit/28-disposition-register.md` | one row per role | + 2 rows (`check:audit-register`) |
| C6 | `scripts/check-foundation-guards.test.ts:3664` | `HISTORICAL_GRANT_7` | leave: "deliberately NOT derived" historical fixture |

### D. The one-stem-one-adapter rule, re-derived (switch to `listAgentAdapterNames`)
| Site | Today |
|------|-------|
| `generate-role-adapters.ts:375` | `const name = \`${AGENT_PREFIX}${stem}\`;` |
| `check-foundation-guards.ts:3673` | `roleNames` from `ROLE_FILES` + prefix (KIT-03) |
| `check-foundation-guards.ts:3658` | `roleStemOf(rel)` strips the prefix → role stem; used by model and effort guards |
| `check-foundation-guards.ts` `guardModelAssignment` / `guardEffortAssignment` | `const stems = ROLE_FILES.map(...)`; `adapterRels.length !== stems.length` arm |
| `adapters-freshness.ts:322,390,614,615` | zero-config = inherit everywhere |
| `scripts/generate-role-adapters.test.ts` ~2024 | `expectedGrant` rebuilt as `` `grugops-${f.replace(/\.md$/, "")}` `` from role files |
| `scripts/canonical-frontmatter.test.ts:245` | configured generator run `toBe(ROLE_COUNT)` adapters |
| `scripts/adapter-byte-baseline.test.ts:356,433,455` | adapter count `toBe(ROLE_COUNT)` |

### E. Literal 16/17/33 in tests (replace with derived values)
`kit-model.test.ts:268,1895,1901`; `generate-role-adapters.test.ts:527,1119,1121,2029,2072,2084`; `frontmatter.test.ts:1400,6890,6931`; `generate-catalog.test.ts:189`; `install/install.test.ts` (26 sites, e.g. `:1525`, `:1544`, `:1945`, `:2116`; `SYNTH_ADAPTERS` is already `listAgentAdapters(REPO_ROOT)`); `check-banned-claims.test.ts:3321` (read before changing — may be unrelated). Found with: `grep -rnE "toBe\((16|17|33)\)|toHaveLength\((16|17|33)\)" --include=*.test.ts scripts install hooks`. Some hits (`frontmatter.test.ts:3889`, `context-io-writer-set.test.ts:2475`, `generate-host-entries.test.ts:285`, `installer-fs-census.test.ts:1757`) are unrelated counts.

### F. Pinned import-closure tables (only if `kit-model.ts` imports `frontmatter.js`)
`scripts/board-readonly.test.ts` pins per-entry closures; the `scripts/board-dashboard.js` row lists `scripts/kit-model.js` and would gain `scripts/frontmatter.js` [VERIFIED: board-readonly.test.ts:3246-3256]. The admission-guard manifest already lists `scripts/frontmatter.js` [VERIFIED: hooks/hook-entry.ts manifest]. `GENERATOR_TWINS` already lists it [VERIFIED: install/install.ts:779-784].

### G. Prose counts in shipped text (make count-free, not re-counted)
`agent-factory/packaging/subagent.frontmatter.md:22` "(16 of them)", `:44` "all sixteen specialists", `:74`, `:141` "the real 16 specialist names"; `install/README.md:1964` "16 specialist names"; `agent-factory/config/factory.config.md` models sections (several "absent block resolves every role to `inherit`" sentences become false for level adapters; line 168's "`haiku` is not listed" is now stale — Haiku 5.5 is listed); `docs/catalog/README.md` (generated).

### H. Regenerated artifacts (in this order, then commit)
`npm run build` → `npm run generate:adapters` (+ `git rm .claude/agents/grugops-software-engineer.md`) → `npm run generate:catalog` → `npm run generate:hook-manifest` (kit-model.js and checkpoints.js hashes change; `"scripts/kit-model.js": "308e70…"` [VERIFIED: hooks/hook-entry.ts:264]) → `npm run generate:safety-surface` (if register rows change it) → `npm run generate:guarantees` (if checkpoint sites move) → freshness gates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading `levels:` / `skills:` | A regex over the frontmatter | `parseFrontmatter` (transform) / `admit` (verdict) | A third grammar is pinned red (D-50 IN-05) |
| Adapter name list | A literal array of 21 names | `listAgentAdapterNames()` | Set-literal drift |
| Zero-config expectation | `inherit` hard-coded in a gate | One exported zero-config map in `model-tiers.ts` | Gate and guard must agree |
| Coordinator grant | Hand-edited `tools:` | Generator from the adapter list | Founding v2.1 defect |
| Re-enqueue on escalation | Re-pending a `done/` file | New `pending/` subtask per WF17 | `done/` is archive-only (D-7) |
| Level → model mapping on spawn | `model` parameter on the Agent call | The adapter's frontmatter | The per-invocation parameter outranks frontmatter |

## Runtime State Inventory

The adapter `grugops-software-engineer` is replaced by three names — a rename for every place that loads or records adapters.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Host repos' `.grugops/context/` notes and tickets may name `grugops-software-engineer` or "Software Engineer" as author/owner. Notes are immutable records; the role display name "Software Engineer" stays. | None (no migration of history). New dispatches name a level. |
| Live service config | None — grugops has no hosted service. | None — verified by architecture (no runtime/service). |
| OS-registered state | None — no scheduler/daemon registrations. | None. |
| Secrets/env vars | User env `CLAUDE_CODE_SUBAGENT_MODEL` (+ `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`) or an installed mod's `agent.spawn` hook can flatten all three levels [CITED: code.claude.com/docs/en/sub-agents, fetched 2026-10-29]. | Document in install docs; a `--check` report is Phase 42 doctor work. |
| Build artifacts / installed files | **Already-installed host repos keep `.claude/agents/grugops-software-engineer.md`.** The generator only writes; the installer's adapter set comes from the kit source (`srcAdapterFiles`), so neither install nor `--check` names a target adapter the kit no longer ships (no such scan found in `install/install.ts`; `reportUnrecordedKitPaths` exists only in `install/uninstall.ts` and covers ledger-unrecorded files). Claude Code will still load the stale adapter, and on the Reduced tier (`/grugops`, grant not runtime-enforced) it is spawnable. | Add a derived check: ledger-recorded `.claude/agents/grugops-*.md` entries that are not in the current set → reported by install and `--check` with the remedy. Removing them is a deletion decision (Open Question 3). Wave 0 probe: install current kit into a scratch target with `GRUGOPS_HOME` set, then install the Phase-39 kit, list `.claude/agents/`. |
| In this repo | `.claude/agents/grugops-software-engineer.md` committed | `git rm` in the generator change |

## Common Pitfalls

### Pitfall 1: Orchestrator ceiling already consumed
**What goes wrong:** D-30 assumes 6,817 B; the file is 7,359 B (grew in phases 36-37), already WARN, 211 B from FAIL. **How to avoid:** measure before and after; the routing rewrite must remove more than it adds; move any procedure into WF04. **Warning sign:** `WARN agent-factory/roles/orchestrator.md` byte count rising.

### Pitfall 2: The freshness gate and the baseline go red on a correct tree
**What goes wrong:** both encode "zero config = inherit everywhere". **How to avoid:** Pattern 5 and Pattern 6 land in the same plan as the generator change. **Warning sign:** `freshness:adapters` naming the three level adapters.

### Pitfall 3: `software-engineer.md` and `frontend-ui.md` ceilings
`software-engineer.md` 3,639 B vs `"3906 3697"`; `frontend-ui.md` 3,738 B vs `"3969 3757"` [VERIFIED: wc -c; roleCeiling]. A `## Levels` section with three scopes, the junior exclusions, the deviation rule and the host note will not fit in 267 B. Keep `## Levels` to a few lines pointing at `complexity-rubric.md` and WF04; otherwise record a measured ceiling move per D-1 (Open Question 5).

### Pitfall 4: D-1 corpus already over 67,383 B
The 18 role-directory files total 69,941 B today [VERIFIED: wc -c agent-factory/roles/*.md] (D-1's 67,383 B was "the 18 role files" at `2057ecb8` [CITED: .planning/research/PITFALLS.md Pitfall 10]). Two new roles push it near 77 KB. The guard is Phase 40's (PLAIN-04), but drafting the new roles long makes Phase 40's cut larger. Draft each new role at or below ~3,000 B.

### Pitfall 5: Hook manifest drift
`kit-model.js` and `checkpoints.js` are in the admission hook's hashed closure; editing either without `npm run generate:hook-manifest` fails `freshness:hook-manifest` and the hook refuses at runtime.

### Pitfall 6: `check-diff-disposition` red count grows silently
It is pre-existing red: 721 findings over 40 elements since base `4d2b8f0` [VERIFIED: ran `node scripts/check-diff-disposition.js`; matches 38-11-SUMMARY]. Every changed clause in roles and workflows adds findings. Write rows under `docs/audit/29-style-dispositions/` for each Phase-39 clause (precedent 33.1-08) so the count after the phase equals 721 plus nothing attributable to 39; never move the base.

### Pitfall 7: New checklist and workflow text fail the lexicon gates
`complexity-rubric.md` enters the governed corpus (A4). Procedural sentences ≤ 20 words, descriptive ≤ 25 (`PROCEDURAL_SENTENCE_MAX_WORDS = 20`, `DESCRIPTIVE_SENTENCE_MAX_WORDS = 25` [VERIFIED: check-imperative-lexicon.ts:547-548]); `## Steps` bullets verb-led. Do not add verbs to the approved set to make text pass.

### Pitfall 8: Adapter template double-count
`guard_adapter_body` requires the specialist memory sentence exactly once in the template's raw text [VERIFIED: check-foundation-guards.ts:1451-1460]. Documenting the level shape with a full fenced body would make it twice. Document only the differing lines.

### Pitfall 9: F3 does not list test integrity
The FEATURES rubric F3=2 column reads "Auth, money, security, PII, migrations, concurrency" [CITED: .planning/research/FEATURES.md § Rubric]. D-31 needs every junior exclusion (security, migration, concurrency, **test integrity**) to make junior impossible; add test-integrity work explicitly.

### Pitfall 10: `haiku` is not Haiku 5.5 everywhere
On Anthropic API `haiku` → Haiku 5.5; on Claude Platform on AWS, Amazon Bedrock, Google Cloud's Agent Platform and Microsoft Foundry → Haiku 4.5 [CITED: code.claude.com/docs/en/model-config, fetched 2026-10-29]. Haiku 4.5 is not in the effort table ("Models not listed here do not support effort"). What Claude Code does with `effort: medium` on such a model is not documented: `UNKNOWN - verify`. Record both in the D-2 amendment.

### Pitfall 11: The spawn call can override the level
Subagent model order: "1. The per-invocation `model` parameter 2. The subagent definition's `model` frontmatter … 3. … `CLAUDE_CODE_SUBAGENT_MODEL` … 4. The main conversation's model" [CITED: code.claude.com/docs/en/sub-agents, fetched 2026-10-29]. A fork "still run[s] on the main conversation's model". WF04 and the coordinator text must say: spawn the named level adapter, non-fork, and pass no `model` or `effort` parameter.

### Pitfall 12: `availableModels` substitution
Blocked aliases are substituted (newest allowed version of the family, else the inherited model) with a warning [CITED: code.claude.com/docs/en/sub-agents]. Pinned levels on a restricted account do not fail; they quietly run elsewhere. Document; no gate can see it.

## Code Examples

Sketches only. Every value shown appears in a verbatim quote above or in CONTEXT.md D-13/D-14; shapes are `[ASSUMED]` recommendations.

```ts
// scripts/model-tiers.ts — LEVELS (shape [ASSUMED]; values from D-14 and MODEL_ALIASES / EFFORT_LEVELS)
export interface LevelTier {
  readonly level: string;            // "junior" | "mid" | "senior"
  readonly alias: ModelAlias;        // "haiku" | "sonnet" | "opus"
  readonly effort: EffortLevel;      // "medium" | "medium" | "high"
  readonly rationale: string;        // quality argument, no digit, no cost/speed word
  readonly effortRationale: string;
}
export const LEVELS: readonly LevelTier[] = [
  { level: "junior", alias: "haiku", effort: "medium", rationale: "…", effortRationale: "…" },
  { level: "mid", alias: "sonnet", effort: "medium", rationale: "…", effortRationale: "…" },
  { level: "senior", alias: "opus", effort: "high", rationale: "…", effortRationale: "…" },
];
export const LEVEL_COUNT = 3; // two-sided against LEVELS and against the declared `levels:` tokens
```

```ts
// scripts/kit-model.ts — the one adapter-name derivation (shape [ASSUMED])
import { parseFrontmatter } from "./frontmatter.js";
export function listAgentAdapterNames(kitRoot = DEFAULT_KIT_ROOT): string[] {
  // for each listRoles() file: read `levels` via parseFrontmatter;
  //   none        -> "grugops-<stem>"
  //   "a b c"     -> "grugops-<stem>-a", "-b", "-c"   (refuse dup key, empty, dup token, non-kebab, case-folded collision)
  // sort; refuseEmpty(); throw by name on any refusal (D-21 tier 1)
}
```

```md
<!-- agent-factory/roles/software-engineer.md frontmatter (D-29: no skills value in 39) -->
---
kind: role
tier: core
capabilities: read edit shell
levels: junior mid senior
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `haiku` "not listed" for effort (factory.config.md, fetched 2026-10-06) | "Opus 5.5, Sonnet 5.5, Haiku 5.5, … \| `low`, `medium`, `high`, `xhigh`, `max`"; Haiku 5.5 defaults to `medium` | docs fetched 2026-10-29 | `effort: medium` on junior is valid on Haiku 5.5 [CITED: code.claude.com/docs/en/model-config] |
| No Haiku floor | "Use v2.1.293 or later with Haiku 5.5." | docs fetched 2026-10-29 | The D-2 floor's source [CITED: code.claude.com/docs/en/model-config] |
| `CLAUDE_CODE_SUBAGENT_MODEL` first | per-invocation `model` first, frontmatter second; "Before v2.1.251, `CLAUDE_CODE_SUBAGENT_MODEL` came first" | v2.1.251 | Spawn must not pass `model` [CITED: code.claude.com/docs/en/sub-agents] |
| — | Agent tool per-invocation `effort` parameter "requires Claude Code v2.1.292 or later" | v2.1.292 | Same rule as `model`: do not pass it [CITED: code.claude.com/docs/en/sub-agents] |
| Unsupported level errors? | "falls back to the highest supported level at or below the one you set" | — | No failure on supported models [CITED: code.claude.com/docs/en/model-config] |

**Effort on haiku (the discretion question), answered:** on v2.1.293+ with Haiku 5.5, `effort` applies and `medium` is supported. Keep the `effort: medium` line on the junior adapter. On providers where `haiku` is Haiku 4.5, behavior is `UNKNOWN - verify`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Precedence `roles[stem-level] ?? roles[stem] ?? LEVELS`, presets never touch levels (including `tiered`) | Pattern 3 | A user on `tiered` might expect the old `software-engineer` sonnet row; needs a recorded decision |
| A2 | Dropping the `software-engineer` row from `TIERED` and deriving `MODEL_TIERS_COUNT` | Pattern 3 | If kept, a dead row; if dropped, a test asserting "sonnet to the rest" moves |
| A3 | Re-pin `PRE_PHASE_ADAPTER_BASELINE` to the pre-39 commit with stated transforms | Pattern 5 | Reviewer may read the move as "number bumped to go green"; the decision text must name the two independent sources |
| A4 | Widening `CANONICAL_SCHEMA` + default `ADAPTER_SCHEMA` is the right reading of TIER-07 | Pattern 8 | It is a safety-authority change; needs explicit human sign-off (D-15 precedent) |
| A5 | Degrade target for refused config = zero-config map (level pins included), not inherit | Pattern 6 | D-11 says "never to a pinned tier"; a human must confirm level pins count as zero config, not as a pinned tier |
| A6 | `BANNED_CLAIM_SCAN_COUNT` 121 → 128, `TECHNICAL_NAMES_COUNT` 76 → 78 | Census A3/A5 | Estimates only; take the gate's number |
| A7 | Designer `TIERED` row = opus | Open Question 4 | Quality argument parallels Architect; could be sonnet |
| A8 | Level adapter description carries the level; body gets one generated level line | Pattern 4 | Byte shape is a design choice; the baseline transform must match |

## Open Questions

1. **D-18 "second gate failure" vs the existing human stop.** WF05 already says: self-fix budget exhausted → `BLOCKED_NEEDS_FIX`, "Stop and hand to a human. `checkpoint: exhaust_self_fix_budget`" [VERIFIED: agent-factory/workflows/05-pr-quality-gate.md:70], and that checkpoint defaults to `block` [VERIFIED: checkpoints.ts:149-164]. D-18 sends the second gate failure to the Tech Lead instead. Recommendation: define "fails a second time" as two gate runs on the same ticket each ending `BLOCKED_NEEDS_FIX` for an **agent-fixable** reason; human-only failures (visual baseline, test integrity) never trigger escalation; state in WF04 that the Tech Lead's decision note is recorded before the WF05 human stop is honored. Needs user confirmation because it changes when a human is asked.
2. **Plugin-namespaced skill names.** Claude Code names plugin skills `/plugin-name:skill-name` [CITED: code.claude.com/docs/en/skills]; the canonical alphabet refuses `:`. Phase 39 grammar: bare kebab names. Phase 42 must decide (per-key alphabet widening is a safety-authority change).
3. **Stale `grugops-software-engineer.md` in installed repos.** Report-only (consistent with "the single opt-in deletion path" `--prune-old-kit`, D-10 phase 17) or remove when ledger-owned and byte-unchanged? Recommend report-only in Phase 39.
4. **Designer `TIERED` row and capabilities.** D-27 fixes `inherit` at zero config but not the `tiered` alias. Recommend opus/high (decided once, inherited by every UI ticket). Capabilities: recommend `read edit` (+ `web` if the user wants research); Tech Lead `read edit shell` (needs `grep` caller counts for F6).
5. **Ceiling moves for `software-engineer.md` and `frontend-ui.md`.** Only the orchestrator's is locked. Recommend fitting; otherwise a measured, recorded move per D-1.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 22 | build, guards, tests | ✓ | v26.12.1 | — |
| npm | scripts | ✓ | 11.20.0 | — |
| tsc | build / typecheck | ✓ | 6.0.3 | — |
| vitest | tests | ✓ | 4.1.8 | — |
| git (full history) | baseline test, diff-disposition | ✓ | — | — |
| Claude Code | optional live check of level adapters | ✓ | 2.1.312 | Static checks only |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.8 |
| Config file | `vitest.config.ts` (`fileParallelism: false`) |
| Quick run command | `npm run build && npx vitest run scripts/<file>.test.ts` (many tests spawn committed `.js`; rebuild first) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` |
| Gates | `node scripts/check-foundation-guards.js`, `node scripts/validate-agent-factory.js`, `npm run freshness:adapters`, `npm run freshness:catalog`, `npm run freshness:hook-manifest`, `node scripts/check-imperative-lexicon.js`, `node scripts/check-banned-claims.js`, `node scripts/check-audit-register.js`, `node scripts/check-kit-refs.js`, `npm run check:build-parity`, `npm run typecheck` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TIER-01 | tech-lead.md has required sections, ceiling, register row, one WF16 ref; rubric checklist governed and indexed | guard + unit | `node scripts/validate-agent-factory.js && node scripts/check-foundation-guards.js && npx vitest run scripts/admission-protocol-docs.test.ts` | ✅ (C3 must be derived first) |
| TIER-02 | 21 adapters; three level adapters with D-14 model/effort; grant = 20 names; per-level and role overrides; preset none keeps pins | unit + gate | `npx vitest run scripts/model-tiers.test.ts scripts/generate-role-adapters.test.ts scripts/kit-model.test.ts && npm run freshness:adapters` | ❌ Wave 0 cases |
| TIER-02 | MODEL-01 re-pinned, effort lines exactly on levels | unit | `npx vitest run scripts/adapter-byte-baseline.test.ts` | ✅ (rewrite) |
| TIER-03 | rubric F3 lists the four exclusions; `## Levels` text; D-2 record present | text assertion | `npx vitest run scripts/<new tier-text>.test.ts` | ❌ Wave 0 |
| TIER-04 | WF04 escalation steps name `failed-attempt`, `Blocked`, new pending task, no `model` parameter; stop counts | text + count | `npx vitest run scripts/checkpoints.test.ts` | ✅ (counts) / ❌ (text) |
| TIER-05 | designer.md sections; WF14 order; frontend-ui reads tokens | guard + text | `node scripts/check-foundation-guards.js` | ❌ Wave 0 text case |
| TIER-06 | KIT-03 over derived names; ceiling table two-sided; counts | guard + unit | `npx vitest run scripts/check-foundation-guards.test.ts` | ✅ (extend) |
| TIER-07 | role files admitted under ROLE_SCHEMA; `skills` fixture admitted; adapter with `skills:` refused; flow and `:` refused | unit | `npx vitest run scripts/canonical-frontmatter.test.ts` | ❌ Wave 0 cases |
| RSI | installed target keeps no unreported stale base adapter | integration | `npx vitest run install/install.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the quick command for the touched file + `node scripts/check-foundation-guards.js`
- **Per wave merge:** full suite + all gates above
- **Phase gate:** full suite green; every gate green except the two pre-existing reds (`check-diff-disposition` at its pre-phase count, `check-flip-manifest`), recorded, never marked passing

### Wave 0 Gaps
- [ ] RED cases first: KIT-03 with a `levels:` role (a missing level adapter, a leftover base adapter, a hand-added grant name each red)
- [ ] `ROLE_CEILINGS` two-sided case (stale key red, missing key red)
- [ ] `listAgentAdapterNames` refusals (dup key, empty, dup token, collision)
- [ ] precedence matrix for level resolution (none / tiered / role override / level override / effort)
- [ ] canonical ROLE_SCHEMA / ADAPTER_SCHEMA cases + `skills` fixture
- [ ] derive `ROLE_BASENAMES` in `admission-protocol-docs.test.ts`
- [ ] stale-adapter install probe

## Security Domain

### Applicable ASVS Categories (level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | Spawn grant generated from the derived adapter set; only the coordinator carries `Agent(...)`; level adapters carry no spawn tool |
| V5 Input Validation | yes | Closed allow-lists by exact equality (`MODEL_ALIASES`, `EFFORT_LEVELS`, config keys = derived stems); canonical admission refuses unknown keys, flow collections, `:` |
| V6 Cryptography | no (hook manifest SHA-256 already exists; regenerate, do not hand-edit) | `npm run generate:hook-manifest` |
| V12 Files | yes | No config value or frontmatter value ever becomes a path; adapter names built only from validated kebab tokens |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hand-typed grant name with no adapter (or adapter outside the grant) | Elevation | KIT-03 set equality over derived names |
| Stale base adapter loaded and auto-routed in a host repo | Spoofing | Report from the install ledger (Runtime State Inventory) |
| YAML-significant bytes in a level/skill token reaching emitted frontmatter | Tampering | Kebab-token refusal + closed alias/effort sets |
| Adapter preloading third-party skill text via `skills:` | Tampering | Default adapter schema excludes `skills` (D-28) |
| Spawn-time `model` parameter or env flattening levels | Repudiation | Documented rule; no fabricated claim that levels are enforced |
| Junior on excluded work | Tampering | F3 rule + `## Levels` stop rule (text, D-31) + same §14 gate for every level |

## Sources

### Primary (HIGH confidence)
- Repository files read this session: `scripts/kit-model.ts`, `scripts/model-tiers.ts`, `scripts/generate-role-adapters.ts`, `scripts/canonical-frontmatter.ts`, `scripts/frontmatter.ts`, `scripts/check-foundation-guards.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/adapters-freshness.ts`, `scripts/validate-agent-factory.ts`, `scripts/checkpoints.ts`, `scripts/check-imperative-lexicon.ts`, `scripts/check-banned-claims.ts`, `scripts/check-diff-disposition.ts`, `scripts/check-audit-register.ts`, `scripts/admission-protocol-docs.test.ts`, `hooks/hook-entry.ts`, `install/install.ts`, `install/uninstall.ts`, roles, WF04/05/14/16/17/18, `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/config/factory.config.md`, `agent-factory/writing-profile.md`
- Probes run this session: `parseFrontmatter` and `admit` on list shapes; `admit` with a scratch-widened schema over all role files; `node scripts/check-foundation-guards.js`; `node scripts/check-diff-disposition.js`; `wc -c`
- code.claude.com/docs/en/sub-agents (fetched 2026-10-29): frontmatter `model`/`effort`/`skills`, model resolution order, fork model, `availableModels` substitution, per-invocation `effort` v2.1.292
- code.claude.com/docs/en/model-config (fetched 2026-10-29): effort table incl. Haiku 5.5, fallback rule, v2.1.293 Haiku floor, alias resolution per provider

### Secondary (MEDIUM confidence)
- code.claude.com/docs/en/skills (fetched 2026-10-29): plugin skill namespacing
- `.planning/research/ARCHITECTURE.md` §3, `.planning/research/FEATURES.md` § Rubric, `.planning/research/PITFALLS.md` (cross-checked against code; stale byte figures corrected above)

## Metadata

**Confidence breakdown:**
- Census and counts: HIGH — every site opened and quoted
- Platform facts: HIGH — vendor docs fetched this session
- Mechanisms (precedence, re-pin, schema split): MEDIUM — recommendations inside discretion; four need sign-off (A1, A3, A4, A5)
- Pitfalls: HIGH — measured

**Research date:** 2026-10-29
**Valid until:** 2026-11-12 (Claude Code docs move fast; re-fetch the effort table before recording D-2)
