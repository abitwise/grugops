# Phase 34: Model Effort Dial & Pi Support - Research

**Researched:** 2026-10-06
**Domain:** TypeScript tooling (config resolver, adapter generator, installer and ledger), Claude Code sub-agent frontmatter, Pi (pi.dev) host conventions, set-literal drift control
**Confidence:** HIGH for the codebase map and the vendor facts read from primary sources; MEDIUM for the design recommendations; three items need a human decision before planning (see Open Questions Q1 to Q3)

## STOP — premise contradicted

**None. The D-01 premise holds.** The re-fetch of `code.claude.com/docs/en/sub-agents` on 2026-10-06 carries the `effort` row exactly as D-01 quotes it (verbatim in "Primary-source findings" below). The dial is not scoped down. No return to the human is needed on criterion 1.

Three other facts found during research do conflict with locked decisions or with each other. They are not premise contradictions, but the planner cannot resolve them alone. Each is set out in Open Questions:

- **Q1.** D-06 (zero-config adapters byte-identical) and D-11 (no stale "four" anywhere) collide inside the generated coordinator adapter. It says "the four non-Claude-Code CLIs" (`scripts/generate-role-adapters.ts:516`), and the frozen byte baseline pins that text.
- **Q2.** Any adapter that carries an `effort:` line is refused by the canonical frontmatter reader (`CANONICAL_SCHEMA` has no `effort` key). The guard D-06 requires has to read adapters through that reader. Widening it is a safety-authority change. The precedent for one is D-33-R3-02.
- **Q3.** D-10 names the Pi template `/grug`, while every user-facing doc and the shipped Claude Code skill use `/grugops`.

## Summary

The phase has two halves that share almost nothing, plus one enabling change.

**The effort half** extends one module (`scripts/model-tiers.ts`). Its closed-tuple, derived-union, refusal-by-name and discriminated-result patterns already state what every new rule needs. Claude Code honours `effort` in sub-agent frontmatter (`low`, `medium`, `high`, `xhigh`, `max`; the default inherits from the session). It falls back to "the highest supported level at or below the one you set" when a model lacks a level, so D-08's "write it, document it" has a cited behaviour to document.

Four mechanisms pull against D-06's "byte-identical", and they decide the shape of the work:
- **No line for `inherit`.** An `inherit` effort must emit no line at all.
- **One early return.** `readModelsBlock` returns early when `models.roles` is absent. An `effort` block read after that point would be silently dropped. This is the WR-01 consumption defect again.
- **The canonical reader.** `admit()` refuses the `effort` key.
- **The freshness pin.** The freshness pin announces only the model resolution. Unless effort gets its own announcement, the freshness gate repeats the CR-01 defect: the run announces one resolution while emitting the output of another.

**The Pi half** fits the installer's existing machinery with no new ledger kind:
- **Write path.** One whole-file create at `.pi/prompts/<name>.md`, using `readForWrite` → `writeTargetFile(..., "create")` → `recordCreatedFile`.
- **Ledger and uninstall.** It is ledgered as a kit-false `file` entry plus `dir` entries for `.pi/` and `.pi/prompts/`. Uninstall reverses it through the generic `walkLedger` → `reverseFile`/`reverseDir`, which already runs `owns(path)` first.
- **Pi's conventions, from its source.** Pi loads project prompt templates from `<cwd>/.pi/prompts/*.md` (direct children only, after project trust). It loads one context file per directory, preferring `AGENTS.md` over `CLAUDE.md`. It has no sub-agents.
- **Safety statement.** Pi "does not ask for approval before every tool call". The install guide's safety section must say plainly that on Pi only the git host floor holds.

**The enabling change (D-11)** is where most of the edits land. Measured on the tree:
- **Breadth.** 45 shipped files (outside `.planning/`, `docs/audit/`, `docs/initial/`, `*.js` and `CHANGELOG.md`) name one of the four non-Claude tools.
- **Per-host tables.** Three files carry per-host tables with bold tool rows (5 rows each).
- **Count phrases.** About 25 shipped lines carry a count phrase ("five tools", "the four non-spawning CLIs", "other four").
- **Hand-listed sets in code.** Two code sites hand-list the tool set: `detectTools()` and `ASYM_ROWS` in `scripts/check-uat-oracles.ts`.
- **Registry location.** The registry must live in `install/`, because `install/` imports nothing from `scripts/` (D-18/D-28). `scripts/` may import from `install/`, though no production script does today.

**Primary recommendation:** Do the effort half in `scripts/model-tiers.ts` itself, so the generator's import closure and the two hand-written twin lists (`GENERATOR_TWINS`, the freshness mirror) do not move. Put the host-tool registry in a new `install/host-tools.ts` and derive `detectTools()`, `ASYM_ROWS`, the validator check and a prose-count test from it. Make the Pi template a recorded whole-file create that rides the existing ledger. Settle Q1 to Q3 with the human before any plan writes code.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Success criterion 1 — the effort premise (pre-checked during discussion)
- **D-01:** Claude Code sub-agent frontmatter DOES honour an `effort` key. Discussion-time check of
  code.claude.com/docs/en/sub-agents (fetched 2026-10-06), frontmatter reference table: `effort` — "Effort
  level when this subagent is active. Overrides the session effort level. Default: inherits from session.
  Options: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model". The same page:
  extended thinking on/off is inherited from the session as of v2.1.198 and "There is no per-subagent
  thinking setting". The researcher re-fetches and cites this as the criterion-1 evidence (and records the
  minimum Claude Code version that introduced the field, or `UNKNOWN - verify`); the dial is therefore NOT
  scoped down to a fallback mechanism. If the re-fetch contradicts this, stop and return to the human.

### Effort setting shape
- **D-02:** The effort setting lives in a sub-block INSIDE `models`: `models.effort` with its own two keys,
  `preset` and `roles` (sparse per-role manual overrides). A `roles` entry beats the preset for that role —
  the same tie-breaking contract the model alias already has. The `models` block's closed key set grows from
  `{preset, roles}` to `{preset, roles, effort}`; `models.effort`'s own key set is closed to
  `{preset, roles}`. — **Reversibility:** one-way — it is a published config-key contract users write into
  `.grugops/factory.config.json`; renaming it later breaks their files.
- **D-03:** Effort value vocabulary is closed: `inherit` plus Claude Code's five levels `low`, `medium`,
  `high`, `xhigh`, `max`. Exact-string membership, refused by name on any unknown key or value (quoting the
  legal set back), case-varied keys refused rather than folded, degenerate block (`null`, array, string,
  number) refused rather than read as absent, unknown-key refusal decided before any legal sibling is read,
  refusal writes nothing and never falls back to a pinned value. Every rule mirrors the existing `models`
  refusals in `agent-factory/config/factory.config.md` §"`models` sub-fields".
- **D-04:** Effort preset vocabulary is closed: `none` and `tiered`. Effort `tiered` assigns `high` to the
  judgment roles and `medium` to the execution roles, using the SAME role split as the model `tiered` table —
  derived from that table, never re-typed as a second hand list — with a per-role rationale recorded (quality
  grounds), and no cost or limit-saving claim (MODEL-07 rule: measured with `scripts/measure-cost.ts` or
  `UNKNOWN - verify`).
- **D-05:** The model `tiered` preset stays MODEL-ONLY. Selecting `models.preset: "tiered"` does not change
  any role's effort; effort is chosen independently through `models.effort`. Reason: folding effort into the
  model preset would silently change adapters for every user already on `tiered`.
- **D-06:** Absent `models.effort` (or absent `models` entirely) resolves every role's effort to `inherit`,
  and an `inherit` effort emits NO `effort:` line in the adapter (the documented default is "inherits from
  session"), so a zero-config repository's adapters stay byte-identical to today. The existing adapter
  byte-baseline and dial-consistency guards extend to the effort field: the emitted effort of every adapter
  equals the resolved config, derived from the role set with an asserted count, never compared against a
  hand-listed expectation.
- **D-07:** Same two-location, first-existing-file-wins-whole precedence as the model alias
  (`.grugops/factory.config.json` then `agent-factory/config/factory.config.json`), read by the same reader in
  `scripts/model-tiers.ts` — one resolver, one reader, no second config grammar. Documentation lands in
  `agent-factory/config/factory.config.md` (the dial) and `agent-factory/packaging/subagent.frontmatter.md`
  (the emitted field), single authority each, not restated elsewhere.

### Effort level × model compatibility
- **D-08:** grugops keeps NO model→allowed-effort capability table and refuses no model/effort pair (e.g.
  `haiku` + `max` is written as configured). Such a table would rot the way full model ids would (the reason
  MODEL-04 refused them). The researcher establishes from Claude Code's primary docs what happens when a
  sub-agent's effort level is not available on its model (fallback, clamp, error) and cites it, or records
  `UNKNOWN - verify`; `factory.config.md` states that behaviour plainly, so the field is never written and
  silently ignored without the user being told.

### Windows dependency
- **D-09:** Phase 34 PROCEEDS although its ROADMAP dependency ("Windows leg green before a sixth adapter
  lands") is unmet: CAP-02 is not met, WINDOWS.md rows 274 (board-watch-live EPERM) and 315 (win32 chmod
  skips) are open. Condition: no test added or changed by this phase may be red on `windows-latest`,
  measured on a pushed CI run (the push is the human's act). The ROADMAP Phase 34 "Depends on" line is
  rewritten to state this honestly, recorded as this decision. Rows 274/315 stay open and owned elsewhere.

### Pi support
- **D-10:** Pi install footprint = the Codex/OpenCode baseline PLUS a thin `/grug` prompt template:
  tool detection, the AGENTS.md entry-file table row, README/install docs, validator coverage, tests in the
  same installer lane as the other five tools, and a project-level prompt template that points at the
  Orchestrator (pointer text only, never a copy of role text — single-source rule). The template ships only
  if research confirms from Pi's primary docs that Pi loads project-level prompt templates and where (likely
  under `.pi/`; `UNKNOWN - verify` until cited). If no project-level location exists, Pi ships the baseline
  only and the docs say why. No Pi skill package. grugops never writes Pi's `SYSTEM.md`.
- **D-12:** The model and effort dials do not reach Pi. Pi has no sub-agents (pi.dev: "No sub-agents"), and
  grugops emits no per-agent definition for it — stated as a property of what this kit emits, the same way
  MODEL-06 states it for the other four non-Claude tools, with every vendor clause carrying a named source.
  Pi's own thinking-level setting is not configured by grugops.
- **D-13:** Pi's install path meets the full installer contract and the Phase 33.1 ledger rules: idempotent,
  additive, dry-run-capable, reversible; every file it creates is recorded in the install ledger
  (`.grugops/install.json`) and uninstall removes only what the ledger says install wrote (owns(path)
  authority, D-33 of 33.1); a pre-existing user file at the template path is never overwritten. Zero runtime
  dependencies.

### Host-tool set ownership
- **D-11:** One registry of supported host tools owns the set (name, detection signal, entry file, adapter
  the installer lays down). Installer detection (`detectTools()` in `install/install.ts`), the validator, and
  every doc/test that enumerates the tools derive from it, and a test asserts its count — so a stale "five"
  or a sixth tool missing from one list fails red. Prose that says "five" is found by derivation, not by a
  hand grep list (set-literal drift is a known failure class in this repo).

### Claude's Discretion
- Exact TypeScript module/location of the host-tool registry, and how docs prose is checked against it.
- Plan order and wave split between the effort half and the Pi half (they are independent).
- Wording of refusal messages, as long as each names the offending value and quotes the legal set.
- Whether the effort resolved-preset is announced on the generator's stdout line like the model preset
  (`RESOLVED_PRESET_PREFIX` pattern) — if added, it uses the one grammar `adapters-freshness.ts` already reads.

### Deferred Ideas (OUT OF SCOPE)
- Fixing WINDOWS.md rows 274 and 315 (Windows leg green, CAP-02) — carried open, not this phase.
- A Pi skill package, or configuring Pi's own thinking level — not now; revisit if Pi users ask.
- A per-model effort capability check — rejected for this phase (D-08); revisit only if Claude Code publishes a machine-readable capability source.
</user_constraints>

## Proposed Requirement IDs

The ROADMAP says "TBD (to be enumerated at plan time)". Below are IDs in REQUIREMENTS.md's existing style: `### FAMILY — Title`, then `- [ ] **FAM-NN**: ...`, then a traceability row `| FAM-NN | Phase 34 | Pending |`. The planner assigns them and adds them to REQUIREMENTS.md, together with a coverage-by-phase row `| 34 | Model Effort Dial & Pi Support | EFFORT-01..05, HOST-01..02, PI-01..04 | 11 |`.

| ID | Proposed text (short form) | Success criterion | CONTEXT decisions |
|----|----------------------------|-------------------|-------------------|
| EFFORT-01 | Before any effort design ships, the `effort` sub-agent frontmatter key is verified against a cited vendor page, the minimum Claude Code version is recorded (or `UNKNOWN - verify`), and the unsupported-level behaviour is cited | SC-1 | D-01, D-08 |
| EFFORT-02 | `models.effort` exists with closed key set `{preset, roles}`; `MODELS_KEYS` grows to `{preset, roles, effort}`; every refusal rule of the `models` block holds for the sub-block (by name, exact equality, case-varied keys refused, degenerate shapes refused, unknown key decided before siblings, refusal writes nothing) | SC-2 | D-02, D-03, D-07 |
| EFFORT-03 | Closed vocabularies `inherit, low, medium, high, xhigh, max` and presets `none, tiered`. Effort `tiered` derives its role split from the model `TIERED` table (judgment → `high`, execution → `medium`), carries a per-role quality rationale and makes no cost claim. The model `tiered` preset changes no effort | SC-2 | D-03, D-04, D-05 |
| EFFORT-04 | Absent effort resolves every role to `inherit`, which emits no `effort:` line. The zero-config adapters stay byte-identical to the frozen baseline. A derived guard with an asserted count proves every adapter's emitted effort equals the resolved config, and the generator's run announces the effort resolution, which the freshness gate asserts | SC-3 | D-06 |
| EFFORT-05 | `factory.config.md` (the dial) and `subagent.frontmatter.md` (the emitted field) are the single authorities. The docs state the cited fallback behaviour, the environment-variable and `maxEffortLevel` precedence, and the Claude-Code-only reach | SC-2 | D-07, D-08, D-12 |
| HOST-01 | One registry (`install/host-tools.ts`) owns the supported host-tool set (id, name, detection signal, entry files, adapter kind) with an asserted count. `detectTools()`, the validator, `ASYM_ROWS` and every per-host doc table derive from it. A derived scan fails red on a host count word in shipped prose | SC-4 | D-11 |
| HOST-02 | No test added or changed by this phase is red on `windows-latest`, measured on a pushed CI run. The ROADMAP "Depends on" line states this | SC-5 | D-09 |
| PI-01 | Pi's project-instruction, prompt-template, skills, trust and detection conventions are recorded from primary sources (with URL and date) in the packaging docs and the per-tool entry-file table | SC-4 | D-10 |
| PI-02 | Pi ships as a registry entry, tool detection, entry-file table rows, README/install-guide sections, validator coverage, and one pointer-only project prompt template at `.pi/prompts/<name>.md`. grugops never writes `.pi/SYSTEM.md`, `.pi/settings.json` or a Pi skill | SC-4 | D-10, D-11 |
| PI-03 | The Pi path is idempotent, additive, dry-run-capable and reversible. The template and its directories are ledgered (`file` plus `dir`), uninstall removes only what `owns(path)` confirms, and a pre-existing user file at the path is never overwritten. It is covered by the derived DC-1/DC-2/DC-3 class tests in the same installer lane. Zero runtime dependencies | SC-5 | D-13 |
| PI-04 | The model and effort dials' non-reach of Pi is stated as a property of what the kit emits, with a cited vendor clause. Pi's safety tiers are documented (git-host floor; no default approval prompt) | SC-4 | D-12 |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EFFORT-01 | Premise verified, version floor and fallback cited | Primary-source findings §A (sub-agents row verbatim, changelog 2.1.78 / 2.1.267, model-config fallback sentence) |
| EFFORT-02 | `models.effort` sub-block with closed keys and refusals | Architecture §E1 (reader changes), Pitfall 1 (early return), Pitfall 6 (consumption probe) |
| EFFORT-03 | Closed vocabularies; tiered derived from `TIERED` | Architecture §E2 (derivation by `alias === "opus"`; `effortRationale` field) |
| EFFORT-04 | Zero-config byte identity plus derived guard plus announcement | Architecture §E3 to §E5; Pitfalls 2, 3, 4; Open Question Q2 |
| EFFORT-05 | Two single-authority docs, fallback and precedence stated | Primary-source findings §A; Pitfall 7 (marker substring collision); Pitfall 8 (pinned `UNKNOWN - verify` count) |
| HOST-01 | Registry plus derived consumers plus prose scan | Host-tool inventory (§H); Architecture §R; Open Question Q1 |
| HOST-02 | No new Windows reds | Windows risk table (Validation Architecture) |
| PI-01 | Pi conventions recorded from primary sources | Primary-source findings §B |
| PI-02 | Pi footprint and pointer template | Architecture §P1, §P2; Open Question Q3 |
| PI-03 | Installer contract and ledger | Architecture §P3; Pitfall 9 (pinned path counts); Pitfall 10 (detection-gated write escapes the derived set) |
| PI-04 | Dials-don't-reach-Pi statement; Pi safety tiers | Primary-source findings §B (README line 19, security.md); Pitfall 11 (cited-host clause shape) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** tooling in TypeScript, compiled with `tsc` to committed `.js`, freshness-checked (`npm run check:build-parity`). Node 22+. Dev deps only `{typescript, vitest, @types/node}`. **Zero runtime dependencies on hosts.**
- **Safety (hard):** agents never merge a protected branch or deploy to production without a named human. The git host is the hard floor; host CLI prompts are a speed bump. → The Pi rows in the safety tables must say what holds on Pi.
- **Single-source:** role text lives once; per-tool adapters are thin pointers, never copies. → The Pi template is pointer text only.
- **Zero-config first:** every role honours `factory.config.json` when present and runs lean when absent. → Absent effort = `inherit` = no line.
- **Voice discipline:** caveman voice in role prompts only; **clear voice in security, compliance, money and disclaimers**. Effort is a money-adjacent topic, so use clear voice and no cost claims (MODEL-07).
- **Installers:** idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content.
- **No fabrication:** unknown → `UNKNOWN - verify`; never fake a gate or citation.
- **Minimal AGENTS.md:** keep it short; push detail into pointed-to files. Do not add a Pi section to AGENTS.md. The "AGENTS.md entry-file table" in D-10 is the `### 6. AGENTS.md + per-tool entry files` table in **CLAUDE.md** (and its GSD source `.planning/research/STACK.md`), not a table inside AGENTS.md. [VERIFIED: `grep` of AGENTS.md finds no per-tool table; CLAUDE.md lines 100-107 carry it]
- **Brand:** always lowercase `grugops`.
- **Docs links:** cite `code.claude.com/docs/en/*`, never `docs.claude.com`.
- **GSD workflow:** edits only through GSD commands. **Regression command is `npx vitest run --exclude '**/scripts/e2e/**'`; never plain `npm test`** (it runs the live paid e2e lane).
- **CLAUDE.md is partly GSD-generated** (`<!-- GSD:project-start source:PROJECT.md -->`, `<!-- GSD:stack-start source:research/STACK.md -->`). An edit to the CLAUDE.md §6 table or the "five tools" line in the Constraints block must also be made in `.planning/research/STACK.md` / `.planning/PROJECT.md`, or the next regeneration reverts it. [VERIFIED: CLAUDE.md lines 1, 25, 168]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Effort config parse and validate | Tooling library (`scripts/model-tiers.ts`, pure plus one reader) | — | D-07: one reader, one resolver; already the model dial's authority |
| Effort emission into adapters | Build-time generator (`scripts/generate-role-adapters.ts`) | Installer (renders a target's adapters by spawning the generator in a mirror) | The generator is the one emitter of frontmatter; the installer never re-implements it |
| Effort correctness proof | CI gates (`check-foundation-guards.ts`, `adapters-freshness.ts`, byte baseline) | vitest oracles | Committed-bytes vs configuration is a second opinion the generator cannot move |
| Effort behaviour at run time | Host CLI (Claude Code) | — | Claude Code applies the fallback and env-var precedence; grugops only writes the field |
| Host-tool set authority | Installer module (`install/host-tools.ts`) | Consumed by scripts/ (validator, oracles, tests) | `install/` may not import `scripts/` (D-18/D-28), so the authority must sit in `install/` |
| Pi detection and template write | Installer (`install/install.ts`) | Ledger (`install/install-marker.ts`) | Every target write is gated by `readForWrite` and recorded |
| Pi template reversal | Uninstaller (`install/uninstall.ts` `walkLedger`) | `owns(path)` | Generic `file`/`dir` reversal; no new kind |
| Pi run-time behaviour (trust, template expansion) | Host CLI (Pi) | — | grugops writes one file; Pi decides whether to load it |

## Primary-source findings

### §A. Claude Code `effort` (criterion 1, D-01, D-08)

| Claim | Evidence | Tag |
|-------|----------|-----|
| Sub-agent frontmatter `effort` row, verbatim: "Effort level when this subagent is active. Overrides the session effort level. Default: inherits from session. Options: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model" | code.claude.com/docs/en/sub-agents, fetched 2026-10-06 | [CITED: code.claude.com/docs/en/sub-agents] |
| "As of v2.1.198, subagents also inherit the main conversation's extended thinking configuration … **There is no per-subagent thinking setting.**" | same page | [CITED: code.claude.com/docs/en/sub-agents] |
| Fallback (D-08), verbatim: "If you set a level the active model does not support, Claude Code falls back to the highest supported level at or below the one you set. For example, `xhigh` runs as `high` on Opus 4.6." | code.claude.com/docs/en/model-config, section "Adjust effort level", fetched 2026-10-06 | [CITED: code.claude.com/docs/en/model-config] |
| The model support table is introduced by: "The available effort levels depend on the model. Models not listed here do not support effort:". The rows list Fable 5.1/5, Opus 5.5, Sonnet 5.5, Opus 5, Sonnet 5, Opus 4.8, Opus 4.7 (all five levels) and Opus 4.6, Sonnet 4.6 (no `xhigh`). **Haiku is not listed** | same page | [CITED: code.claude.com/docs/en/model-config] |
| What Claude Code does with a sub-agent `effort:` on a model that supports **no** effort (for example `haiku`): **`UNKNOWN - verify`**. Indirect hint only: changelog 2.1.113 fixed "`output_config.effort` causing 400 errors on subagent calls to models that don't support effort", which suggests the field is normally not sent. That is an inference, not a documented behaviour | changelog | [ASSUMED] |
| Precedence, verbatim: "Frontmatter effort applies when that skill or subagent is active, overriding the session level but not the environment variable." (`CLAUDE_CODE_EFFORT_LEVEL` beats the adapter's `effort:`) | model-config | [CITED: code.claude.com/docs/en/model-config] |
| `maxEffortLevel` setting (top-level or per model under `modelSettings`) "caps the effort level on every provider" — added in 2.1.267 | GitHub CHANGELOG.md, 2.1.267 | [CITED: raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md] |
| Earliest changelog entry naming agent `effort:` frontmatter: **2.1.78** "Added `effort`, `maxTurns`, and `disallowedTools` frontmatter support for plugin-shipped agents". No entry introducing it for standalone `.claude/agents/` files was found. **Minimum version for standalone sub-agent `effort`: `UNKNOWN - verify`** (the 2.1.78 wording suggests standalone agents already had it; that is an inference) | CHANGELOG.md (931,749 bytes, head 2.1.291, fetched 2026-10-06) | [CITED] for 2.1.78; [ASSUMED] for the inference |
| **Reliability floor:** 2.1.267 "Fixed `effort:` frontmatter on custom commands, skills, and subagents being ignored on models whose default effort is still pinned (Opus 4.7, Opus 4.8, Fable 5)". Before 2.1.267, a grugops `effort:` line was **silently ignored** on those three models | CHANGELOG.md 2.1.267 | [CITED: CHANGELOG.md] |
| The `model` row now lists `sonnet`, `opus`, `haiku`, **`fable`**, a full id, or `inherit`. This **resolves assumption A1** (the alias vocabulary) against a vendor page. It also shows a fifth alias (`fable`) that `MODEL_ALIASES` does not carry. Out of scope; see Open Question Q6 | sub-agents page | [CITED: code.claude.com/docs/en/sub-agents] |
| Local Claude Code version on this machine: `2.1.290 (Claude Code)` | `claude --version` | [VERIFIED: local probe] |

**What `factory.config.md` must state (D-08), drafted from the citations above:** the dial writes the level as configured. On a model that lacks that level, Claude Code runs the highest level it supports at or below it. On a model that supports no effort at all, the behaviour is `UNKNOWN - verify`. A `CLAUDE_CODE_EFFORT_LEVEL` environment variable overrides the adapter's level. A `maxEffortLevel` setting caps it. Claude Code before 2.1.267 ignored the field on Opus 4.7, Opus 4.8 and Fable 5.

### §B. Pi (D-10, D-12)

Sources: `github.com/earendil-works/pi`, branch `main`, head `9ad08310…`, fetched 2026-10-06 through the GitHub API. Read from both `packages/coding-agent/docs/*.md` **and the loader source** (`src/core/resource-loader.ts`, `src/core/prompt-templates.ts`, `src/config.ts`, `package.json`). The npm package `@earendil-works/pi-coding-agent` is at `1.0.4` (published 2026-10-05).

| Claim | Evidence | Tag |
|-------|----------|-----|
| **Project prompt templates load from `<cwd>/.pi/prompts/`** — "Project: cwd/{CONFIG_DIR_NAME}/prompts/" with `CONFIG_DIR_NAME` = `pkg.piConfig?.configDir \|\| ".pi"` and `package.json` `"piConfig": { "configDir": ".pi" }` | `prompt-templates.ts` (`loadPromptTemplates`), `config.ts:581`, `package.json`; `configuration.md` table row "`.pi/prompts/` — Project prompt templates exposed as slash commands" | [VERIFIED: Pi source + CITED: configuration.md] |
| **Resolved from cwd, not from the repo root.** `projectPromptsDir = resolve(resolvedCwd, CONFIG_DIR_NAME, "prompts")`; no ancestor walk (unlike context files). Pi started in a subdirectory does not see `<repo>/.pi/prompts/` | `prompt-templates.ts` | [VERIFIED: Pi source] |
| "Conventional prompt directories load direct `.md` children only." | `prompt-templates.md` | [CITED: prompt-templates.md] |
| "The filename becomes the command name": `.pi/prompts/review.md` → `/review`. Frontmatter keys read: `description` (else the first non-empty line, 60 chars) and `argument-hint` | `prompt-templates.md`; `prompt-templates.ts` lines reading `frontmatter.description` and `frontmatter["argument-hint"]` | [VERIFIED: Pi source] |
| Substitutions: `$1`, `$2`, `$@` **or `$ARGUMENTS`**, `${1:-default}`, `${@:-default}`, `${@:N}`, `${@:N:L}`; shell-like quoting | `prompt-templates.md` table | [CITED: prompt-templates.md] |
| **Project templates load only after project trust.** "Project templates become commands in the editor after trust is granted." `security.md`: Pi requires a trust decision when it finds "`.pi/extensions`, `.pi/skills`, `.pi/prompts`, or `.pi/themes`"; "A bare `.pi` directory does not require project trust." In print/JSON/RPC modes with the default `defaultProjectTrust: "ask"`, protected resources are **skipped** | `prompt-templates.md`, `security.md` | [CITED: security.md] |
| **Context files:** one per directory, first match of `["AGENTS.override.md", "AGENTS.md", "AGENTS.MD", "CLAUDE.md", "CLAUDE.MD"]`, read from the agent dir and from cwd plus every ancestor (ancestor-first order). In a repo holding both `AGENTS.md` and `CLAUDE.md`, Pi reads **`AGENTS.md` only**. "Context-file discovery does not require project trust." | `resource-loader.ts` `loadContextFileFromDir` / `loadProjectContextFiles`; `configuration.md` §Context files | [VERIFIED: Pi source] |
| Agent (user) dir: `~/.pi/agent`, overridable by `PI_CODING_AGENT_DIR`; user templates at `~/.pi/agent/prompts/` | `config.ts:601-645`, `environment-variables.md:81` | [VERIFIED: Pi source] |
| Project `.pi/` holds `settings.json`, `mcp.json`, `SYSTEM.md`, `APPEND_SYSTEM.md`, `extensions/`, `skills/`, `prompts/`, `themes/` | `configuration.md` | [CITED: configuration.md] |
| Skills: Agent Skills spec; locations `~/.pi/agent/skills/`, `.pi/skills/`, `~/.agents/skills/`, `.agents/skills/` (ancestor walk to the repo root). Pi does **not** read `.claude/skills/` | `skills.md:61` | [CITED: skills.md] |
| **No sub-agents:** README line 19 "Pi ships with powerful defaults but skips features like sub-agents and plan mode."; pi.dev: "No sub-agents" … "Spawn Pi instances via tmux, or build your own with extensions, or install a package that does it your way." | `packages/coding-agent/README.md`; pi.dev | [VERIFIED: Pi README] [CITED: pi.dev] |
| **Safety:** "Pi can read, change, and execute files with the permissions of the account that started it, and it does not ask for approval before every tool call." An extension's `tool_call` handler "can … block execution" and can `ctx.ui.confirm` | `security.md:3`; `extensions.md:105,169-175` | [CITED: security.md, extensions.md] |
| Binary `pi` (`"bin": { "pi": "dist/bundle/cli.js" }`); `pi --version`; install `npm install -g --ignore-scripts @earendil-works/pi-coding-agent` | `package.json`; `cli.md:245`; pi.dev | [VERIFIED: npm view + Pi package.json] |
| Built-in slash commands do not include `/grug` or `/grugops` (list: `/settings`, `/model`, `/thinking`, … `/trust`, `/reload`, `/quit`) | `slash-commands.md` | [CITED: slash-commands.md] |
| Browser MCP registration on Pi: `pi mcp add <server> [options] -- <command> [args...]` writes `~/.pi/agent/mcp.json` (or `.pi/mcp.json` with `--local`) | `cli.md` §MCP commands | [CITED: cli.md] |
| Pi does not appear in this repo's local environment (`command -v pi` empty, no `~/.pi`) | local probe | [VERIFIED: local probe] |

**D-10 gate outcome:** Pi **does** load project-level prompt templates, from `.pi/prompts/` (cited above). The template ships.

**Detection signal (registry):** a `.pi` entry in the target root. That matches the other five, which all test a target-root path (`.claude`, `.codex`, `.gemini`, `opencode.json`, `.github`). A user-level `~/.pi/agent` exists only on machines with Pi configured. Following the precedent, do not consult it.

## Standard Stack

No new library. Every change uses Node stdlib plus the in-repo authorities.

### Core (existing, reused)
| Module | Purpose | Why it is the one to use |
|--------|---------|--------------------------|
| `scripts/model-tiers.ts` | Effort vocabularies, reader, resolver, announcement grammar | D-07; already the dial's one reader; `quoteValue`/`describeShape` are module-private and must not be copied |
| `scripts/generate-role-adapters.ts` | Emits `effort:` | The one frontmatter emitter |
| `scripts/canonical-frontmatter.ts` `admit()` | Reads committed adapters for the guard | The adapter-verdict authority since plan 27-65 (D-15) |
| `install/user-file.ts` `readForWrite` / `readUserFile` | Gate every target read/write (DC-3) | One bounded reader; refuses FIFO, directory, link and device |
| `install/install-marker.ts` `owns()`, ledger kinds | Record and reverse the Pi template | One record, one authority (33.1 D-33) |
| `scripts/kit-model.ts` `listRoles()`, `ROLE_COUNT` | Role set with asserted count | KIT-01 |

### Dev/test (existing)
| Tool | Version | Purpose |
|------|---------|---------|
| typescript | `~6.0.3` (package.json) | `tsc` build to committed `.js` |
| vitest | `~4.1.8` | Oracles; drives the committed `.js` |
| @types/node | `~22` | types only |

**Installation:** none. `npm ci` already provides the dev deps. The phase adds no dependency. [VERIFIED: package.json read this session]

## Package Legitimacy Audit

This phase installs **no** package into grugops. The one external package it names is the **user's host CLI**, referenced in docs only (the Pi install line in README/install docs). grugops never installs it.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@earendil-works/pi-coding-agent` | npm | latest version published 2026-10-05 (package older) | ~5.2M/wk | github.com/earendil-works/pi (matches official README and pi.dev) | SUS (`too-new`, because the latest **version** is one day old) | Docs mention only; **not installed by grugops**. No postinstall script (`npm view … scripts.postinstall` empty), and pi.dev's own install line uses `--ignore-scripts`. No checkpoint needed unless a plan installs it, which none should |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@earendil-works/pi-coding-agent`. The flag is version recency, not package age. It is not installed by any plan.

## Host-tool inventory (D-11) — derived, with counts

Measured 2026-10-06 with `git grep` over tracked files. Exclusions are declared: `.planning/` is history, `docs/audit/` is audit records, `docs/initial/` holds the frozen spec and brand inputs, `*.js` are build outputs that follow their `.ts`, and `CHANGELOG.md` is history.

**1. Code sites that hand-list the tool set (must derive from the registry):**

| Site | Current literal | Read |
|------|-----------------|------|
| `install/install.ts:2589-2597` `detectTools()` | see verbatim below | [VERIFIED: Read install/install.ts:2589-2597] |
| `scripts/check-uat-oracles.ts:247-258` `ASYM_TABLE_FILES` + `ASYM_ROWS` | see verbatim below | [VERIFIED: Read scripts/check-uat-oracles.ts:245-258] |
| `scripts/model-dial-consistency.test.ts:285` `OTHER_HOST_CLI_COUNT = 4` plus the pinned `SCOPE_SENTENCE` (lines 230-235), `CITATION_BLOCK_HEADING` (241), `RESIDUAL_ANCHORS` R3 (263) | the scope-sentence oracle | [VERIFIED: Read scripts/model-dial-consistency.test.ts:196-265] |
| `install/install.ts:5417` console line "The other four CLIs get documentation only." | prose inside the installer's output | grep |
| `scripts/generate-role-adapters.ts:516` coordinator body "the four non-Claude-Code CLIs" → emitted into `.claude/agents/grugops-orchestrator.md:38` | **byte-pinned** (Q1) | [VERIFIED: Read generate-role-adapters.ts full file] |

```ts
// install/install.ts:2589-2597 (verbatim)
function detectTools(): string {
  const found: string[] = [];
  if (existsSync(join(TARGET, ".claude"))) found.push("claude");
  if (existsSync(join(TARGET, ".codex"))) found.push("codex");
  if (existsSync(join(TARGET, ".gemini"))) found.push("gemini");
  if (existsSync(join(TARGET, "opencode.json"))) found.push("opencode");
  if (existsSync(join(TARGET, ".github"))) found.push("copilot");
  return found.length ? found.join(" ") : "none-detected";
}
```

```ts
// scripts/check-uat-oracles.ts:247-258 (verbatim)
const ASYM_TABLE_FILES = [
  "agent-factory/packaging/adapters.md",
  "agent-factory/README.md",
];
const ASYM_ROWS: { label: string; rowRe: RegExp }[] = [
  { label: "Codex CLI", rowRe: /^\|\s*\*\*Codex CLI\*\*/ },
  { label: "Gemini CLI", rowRe: /^\|\s*\*\*Gemini CLI\*\*/ },
  { label: "OpenCode", rowRe: /^\|\s*\*\*OpenCode\*\*/ },
  { label: "GitHub Copilot CLI", rowRe: /^\|\s*\*\*GitHub Copilot CLI\*\*/ },
  { label: "Claude Code", rowRe: /^\|\s*\*\*Claude Code\*\*/ },
```

**2. Per-host markdown tables with bold first-cell tool rows** (pattern `^\| *\*\*(tool)\*\*`): `agent-factory/packaging/adapters.md` (5 rows), `agent-factory/README.md` (5), `CLAUDE.md` (5; source `.planning/research/STACK.md`). A non-bold per-host table sits at `agent-factory/checklists/browser-uat-recipe.md:57-61` (5 rows: the browser-MCP registrations), and adapters.md's safety table has one combined row "Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI".

**3. Shipped lines enumerating two or more non-Claude tools (prose):** 23 files. Per file: `scripts/context-io.ts` 7, `install/README.md` 4, `agent-factory/packaging/subagent.frontmatter.md` 4, `CLAUDE.md` 2, `agent-factory/packaging/adapters.md` 2, and 1 each in `README.md`, `docs/faq.md`, `examples/01-greenfield-bootstrap.md`, `agent-factory/README.md`, `agent-factory/config/factory.config.md`, `agent-factory/checklists/browser-uat-recipe.md`, `agent-factory/roles/_role-switch-protocol.md`, `agent-factory/workflows/16-context-read-write.md`, `scripts/check-uat-oracles.ts`, `scripts/model-dial-consistency.test.ts`, `scripts/context-io.test.ts`, and five install tests (`installer-dry-run`, `installer-never-installed`, `record-truth`, `uninstall-removal`, `installer-fs-census`). Those test lines list Gemini/Copilot **paths**, not the tool set. Any file naming one or more of the four tools: 45 (same exclusions).

**4. Host count phrases in shipped surfaces** (regex `(two|three|four|five|six)[ -](qualifier )*(host[- ])?(clis|hosts|host tools|tools)` plus `(four|five) non-` and `(four|five)[ -]tool`, case-insensitive, with false positives such as "five arms" removed by reading). The host-related hits:

| File:line | Text (abridged) |
|-----------|-----------------|
| `.claude/agents/grugops-orchestrator.md:38` (generated) | "the four non-Claude-Code CLIs" |
| `scripts/generate-role-adapters.ts:516` (emitter) | same |
| `agent-factory/packaging/subagent.frontmatter.md:125, 235, 247, 258, 260, 290` | "four non-Claude-Code CLIs", "four non-spawning CLIs", "The other four CLIs", "other four host CLIs", "each of the other four", "emit for the other four" |
| `agent-factory/packaging/adapters.md:41, 53, 74` | "The four non-spawning CLIs (Codex, Gemini, OpenCode, Copilot)", "the four non-spawning CLIs stay", "the four non-Claude-Code host CLIs" |
| `agent-factory/packaging/adapters.md` heading | "## The 5-tool dispatch map" (digit form) |
| `agent-factory/packaging/slash-command.template.md:101` | "the four non-spawning host CLIs" |
| `agent-factory/roles/_role-switch-protocol.md:11, 54` | "the four non-spawning host CLIs", "the four non-spawning CLIs" |
| `agent-factory/README.md:39, 58` | "## Usage across the five tools", "the four non-spawning CLIs" (claims C-28-027..029) |
| `agent-factory/contracts/context-note.md:149` | "the four non-CC CLIs" |
| `agent-factory/checklists/browser-uat-recipe.md:53, 500, 506` | "The five host-CLI registrations", "Absence on the other four hosts", "all five hosts" |
| `agent-factory/workflows/16-context-read-write.md:32, 60` | non-CC host phrasing inside long lines |
| `README.md:65` | "any of the five host tools" |
| `CLAUDE.md:16` (source PROJECT.md) | "avoid drift across five tools" |
| `install/README.md:1206, 1208` | "all five host CLIs", "the other four hosts" |
| `install/install.ts:5417` | "The other four CLIs get documentation only." |
| `hooks/admission-guard.ts:33`, `scripts/admission-server.ts:35`, `scripts/dead-vocabulary.ts:16`, `scripts/context-io.ts` (10 comment/runtime-string sites incl. 5735, 5802), `scripts/context-io.test.ts` (5), `scripts/check-uat-oracles.ts:244, 318, 375`, `scripts/check-uat-oracles.test.ts:120`, `scripts/model-dial-consistency.test.ts:232` | code comments, runtime residual strings and test literals |

**Recommendation for the prose check (discretion area):** a test that derives its scan set (every tracked `*.md` outside the declared exclusions, plus the generated `.claude/agents/*.md`) and fails on a **host count word**: any number word or digit directly before a host noun phrase (`host CLIs`, `host tools`, `hosts`, `CLIs`, `tools`, `non-spawning CLIs`, `non-Claude-Code CLIs`, `non-CC CLIs`, `N-tool`). Shipped prose then says "every supported host CLI" or "the non-Claude-Code host CLIs" and never a number, so the count can never go stale. Two-sided premise: the scan set is non-empty and its size is asserted. A planted "the five tools" line in a scratch copy must go red (mutation proof). Code comments and runtime strings in `.ts` are rewritten by hand from the list above. The test does not scan them, because their wording is pinned by other tests (context-io residual strings).

## Architecture Patterns

### System Architecture Diagram

```
                 .grugops/factory.config.json  (first existing file wins whole)
                 agent-factory/config/factory.config.json
                                 │
                                 ▼
             ┌──────────── readModelsConfig(root, stems) ────────────┐
             │  models keys closed {preset, roles, effort}           │
             │  models.effort keys closed {preset, roles}            │
             │  refusal ──► {ok:false, reason}  (writes nothing)     │
             └──────────────┬────────────────────────────┬───────────┘
                            │ model half                 │ effort half
                            ▼                            ▼
                 resolveModels(stems,…)        resolveEfforts(stems,…)
                 (TIERED alias table)          (split derived from TIERED: opus→high, else medium)
                            │                            │
                            └────────────┬───────────────┘
                                         ▼
                     generate-role-adapters (build-everything-then-write)
                       model: <alias>          always one line
                       effort: <level>         ONLY when level != inherit
                       stdout: resolved model preset/assignment lines
                               resolved effort preset/assignment lines (new)
                                         │
             ┌───────────────────────────┼─────────────────────────────┐
             ▼                           ▼                             ▼
   .claude/agents/*.md        adapters-freshness (mirror,       install.js renders a TARGET's
   (committed, zero-config)   asserts zero-config model AND     adapters by spawning the generator
             │                effort announcements)             in a mirror with the target config
             ▼
   guard_model_assignment / guard_effort_assignment
   (admit() reads committed bytes; expectation recomputed from config + derived stems)

   ───────────────────────────── Pi half ─────────────────────────────
   install/host-tools.ts (registry, HOST_TOOL_COUNT)
        ├──► detectTools()             "tools detected: … pi"
        ├──► check-uat-oracles ASYM_ROWS, validator table check, host-prose scan test
        └──► Pi adapter kind "prompt-template"
                   │
                   ▼
   readForWrite(TARGET, .pi/prompts/<name>.md)
        create  ──► writeTargetFile(…, "create") ──► recordCreatedFile ──► ledger file entry
                    mkdirp records .pi, .pi/prompts in CREATED_DIRS ──► ledger dir entries
        ok      ──► skipped (never overwrite; a previous ledger entry carries forward only while it still holds)
        blocked ──► verify (exit 3)
                   │
   uninstall.js walkLedger ──► reverseFile (owns + content still matches) ──► reverseDir (only if emptied)
```

### Recommended file touch map

```
scripts/model-tiers.ts                 + EFFORT_LEVELS, EFFORT_PRESET_NAMES, EFFORT_KEYS, MODELS_KEYS += "effort",
                                         RoleTier.effortRationale, effort derivation, resolveEfforts,
                                         inheritEffortForEveryStem, readModelsBlock effort parse,
                                         effort announcement grammars
scripts/generate-role-adapters.ts      + resolve effort at top level, Adapter.effort, conditional emit, announce
scripts/adapters-freshness.ts          + assert effort announcements (zero-config) and emit a mirrored effort verdict
scripts/check-foundation-guards.ts     + guard_effort_assignment (or an extended guard_model_assignment)
scripts/canonical-frontmatter.ts       + "effort" in CANONICAL_SCHEMA (ONLY after Q2 is decided)
install/host-tools.ts (NEW)            registry + HOST_TOOL_COUNT; pure data, no node:fs import
install/install.ts                     detectTools() from registry; writePiPromptTemplate(); optional effort cross-check
scripts/check-uat-oracles.ts           ASYM_ROWS derived from the registry
scripts/validate-agent-factory.ts      dispatch-map rows set-equal to the registry (new scripts→install import edge)
docs: factory.config.md, subagent.frontmatter.md, adapters.md, slash-command.template.md,
      _role-switch-protocol.md, context-note.md, workflow 16, agent-factory/README.md, README.md,
      install/README.md, docs/faq.md, browser-uat-recipe.md, CLAUDE.md (+ .planning/research/STACK.md,
      .planning/PROJECT.md), docs/audit/28-claim-registry.md (verbatim claim blocks), CHANGELOG [Unreleased]
tests: model-tiers.test.ts, generate-role-adapters.test.ts, adapters-freshness.test.ts,
      check-foundation-guards.test.ts, canonical-frontmatter.test.ts, model-dial-consistency.test.ts,
      adapter-byte-baseline.test.ts (only if Q1 = reword), install tests (re-pins), NEW host-tools test
```

### The in-repo values the design plugs into (verbatim, read this session)

```ts
// scripts/model-tiers.ts:165   [VERIFIED: Read scripts/model-tiers.ts:165]
export const MODEL_ALIASES = ["inherit", "opus", "sonnet", "haiku"] as const;
// scripts/model-tiers.ts:225
export const PRESET_NAMES = ["none", "tiered"] as const;
// scripts/model-tiers.ts:275
export const MODELS_KEYS = ["preset", "roles"] as const;
// scripts/model-tiers.ts:312-315
export const MODELS_CONFIG_CANDIDATE_RELS = [
  ".grugops/factory.config.json",
  "agent-factory/config/factory.config.json",
] as const;
// scripts/model-tiers.ts:374
export const RESOLVED_PRESET_PREFIX = "generate-role-adapters: resolved model preset: ";
// scripts/model-tiers.ts:451
export const MIRRORED_RESOLVED_PRESET_PREFIX = "Mirrored generator resolved model preset: ";
// scripts/model-tiers.ts:497
export const RESOLVED_ASSIGNMENT_PREFIX = "generate-role-adapters: resolved model assignment: ";
// scripts/model-tiers.ts:500
const RESOLVED_ASSIGNMENT_KEYS = ["roles", "overrides", "aliases"] as const;
// scripts/model-tiers.ts:802
export const MODEL_TIERS_COUNT = ROLE_COUNT;
```

`TIERED` (`scripts/model-tiers.ts:643-779`, read this session) assigns `alias: "opus"` to exactly four stems — `architect-design`, `compliance-officer`, `orchestrator`, `security-nfr` — and `alias: "sonnet"` to the other thirteen. No row is `haiku`. [VERIFIED: Read scripts/model-tiers.ts:643-779]

```ts
// scripts/generate-role-adapters.ts:143-145 and :538 (verbatim)   [VERIFIED: Read]
const ROOT = join(import.meta.dirname, "..");
const ROLES_DIR = join(ROOT, "agent-factory/roles");
const OUT_DIR = join(ROOT, ".claude/agents");
  lines.push(`model: ${a.model}`);
```

```ts
// scripts/canonical-frontmatter.ts:177-188 (verbatim)   [VERIFIED: Read scripts/canonical-frontmatter.ts:140-260]
export const CANONICAL_SCHEMA: readonly string[] = [
  "allowed-tools",
  "argument-hint",
  "coordinator",
  "description",
  "disable-model-invocation",
  "kind",
  "model",
  "name",
  "tier",
  "tools",
];
```

```ts
// install/install.ts:436-441 (verbatim)   [VERIFIED: Read install/install.ts:436-448]
const GENERATOR_TWINS: string[] = [
  "scripts/generate-role-adapters.js",
  "scripts/kit-model.js",
  "scripts/frontmatter.js",
  "scripts/model-tiers.js",
];
// install/install.ts:448
const GENERATOR_KIT_SOURCES: string[] = ["agent-factory/roles", "agent-factory/packaging"];
// install/install.ts:1659-1662
const COPILOT_REL = ".github/copilot-instructions.md";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
const COPILOT_PTR =
  "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
```

```ts
// install/install-marker.ts:518, 527-530 (verbatim)   [VERIFIED: Read install/install-marker.ts:516-531]
export const LEDGER_KINDS = ["dir", "file", "block", "gemini", "ask-rules", "backup", "kit"] as const;
export const KINDS_BY_SCOPE: Readonly<Record<LedgerScope, readonly LedgerKind[]>> = {
  target: ["dir", "file", "block", "gemini", "ask-rules", "backup"],
  "kit-home": ["backup", "kit"],
};
```

```ts
// scripts/check-foundation-guards.ts:1488-1489 (verbatim)   [VERIFIED: Read]
const AD_WARN = 3072; // 3 KiB
const AD_FAIL = 4096; // 4 KiB
```

### Pattern E1: the effort sub-block in the one reader (D-02, D-03, D-07)

**What:** extend `readModelsBlock` (`scripts/model-tiers.ts:1426-1573`) so that `models.effort` is adjudicated in the same function, after the `models` key-set check and **without** depending on `models.roles` being present.

**The trap (Pitfall 1):** line 1523 reads `if (rawRoles === undefined) return { ok: true, value: { preset, overrides, source: path } };`. Effort parsing placed after this line is never reached by `{"models":{"effort":{…}}}`. Restructure so that each sub-read produces a local, and one `return` sits at the end.

**Order inside `models.effort`** (mirrors the model block exactly):
1. `effort === undefined` → `{preset: "none", overrides: empty}`.
2. `null` / array / non-object → refusal naming the shape (Pitfall 2 of 29.1: degenerate is not absent).
3. Unknown keys against `EFFORT_KEYS = ["preset", "roles"]`, all named, sorted, **before** any value is read.
4. `effort.preset` by exact equality against `EFFORT_PRESET_NAMES`.
5. `effort.roles`: object shape; **every key** against the derived stems before any value is read; values by exact equality against `EFFORT_LEVELS`.

**Return shape:** add `effort: { preset: EffortPresetName; overrides: ReadonlyMap<string, EffortLevel> }` to `ModelsConfig`. `zeroConfigModels()` returns the inherit effort too, so the four zero-config arms stay one function.

### Pattern E2: closed vocabularies and the derived tiered split (D-03, D-04, D-05)

```ts
// Source: scripts/model-tiers.ts patterns (closed tuple → derived union); names are [ASSUMED] (discretion)
export const EFFORT_LEVELS = ["inherit", "low", "medium", "high", "xhigh", "max"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];
export const EFFORT_PRESET_NAMES = ["none", "tiered"] as const;   // a SEPARATE tuple from PRESET_NAMES
export type EffortPresetName = (typeof EFFORT_PRESET_NAMES)[number];
export const EFFORT_KEYS = ["preset", "roles"] as const;
export const MODELS_KEYS = ["preset", "roles", "effort"] as const;  // D-02

// The split is DERIVED from TIERED's own alias column, never a second stem list (D-04):
//   a row whose alias is "opus" is a judgment role  → "high"
//   every other row is an execution role            → "medium"
// Per-role rationale: add a REQUIRED `effortRationale: string` to RoleTier, so a row without one
// does not compile (the D-10 mechanism of 29.1) and the reason cannot come apart from the row.
```

- **Why a separate `EFFORT_PRESET_NAMES`** and not a reuse of `PRESET_NAMES`: they are two closed sets that happen to have equal members today. A third model preset must not silently become a legal effort preset. Add a test that asserts both are declared and that each is documented at its own site.
- **Why `effortRationale` on the row** and not a `Record<stem, string>`: a keyed record is a second hand-typed stem list. That is the set-literal drift class, and it would need its own two-sided coverage check. The existing "no digit in a rationale" test (MODEL-07) must extend to the new field.
- **D-05 test:** `{"models":{"preset":"tiered"}}` resolves effort `inherit` for all 17 roles and emits no `effort:` line.
- **Fact for the rationale wording (no cost claim):** model-config documents that Opus 5.5 and Sonnet 5.5 default to `medium` effort and most other models to `high`. A `medium` row therefore does not change behaviour on some session models and lowers it on others. State the quality argument only. [CITED: code.claude.com/docs/en/model-config]

### Pattern E3: emit nothing for inherit (D-06)

```ts
// in render(), directly after the model line (slot choice is ASSUMED/discretion; any slot is
// byte-neutral for zero-config because inherit emits nothing):
lines.push(`model: ${a.model}`);
if (a.effort !== "inherit") lines.push(`effort: ${a.effort}`);
```

Resolve effort at top level, **before** the build loop, exactly as the model alias is resolved (T-27-32: a refusal must reach `fail` before a byte is written). Look effort up by stem. A miss is refused by name.

**Size:** the coordinator adapter measures **3013 bytes** today [VERIFIED: `wc -c`]. The largest effort line, `effort: medium\n`, is 15 bytes, which gives 3028 against the 3072 warn tier. That fits. Note that `subagent.frontmatter.md` still says "3055 bytes … 17 bytes of warn-tier headroom", and that number is stale against the tree (it was measured before later edits). Re-measure and correct it in the same change if the doc is touched.

### Pattern E4: announce the effort resolution (discretion item, recommended YES)

The CR-01 lesson (`generate-role-adapters.ts:564-588`): a run that announces only one of its inputs lets the freshness gate certify a configured output as zero-config. Add two grammars beside the model ones in `model-tiers.ts`, each with an anchored reader:

- `generate-role-adapters: resolved effort preset: <name>`
- `generate-role-adapters: resolved effort assignment: {"roles":N,"overrides":N,"levels":[…]}`

Wording is [ASSUMED]. The prefixes must not be prefixes of each other, and must not be prefixes of the model ones. Anchored-at-byte-0 readers make that safe. **Do not** add a key to the model payload (`RESOLVED_ASSIGNMENT_KEYS` is closed, and the installer's probe at `install/install.ts:3069-3096` parses `roles/overrides/aliases`). Separate lines keep every existing model-grammar test and the installer probe unchanged. `adapters-freshness.ts` then requires exactly one effort preset line equal to `none` and one effort assignment whose `levels` equals the set derived from `inheritEffortForEveryStem`. It adds a mirrored effort verdict line through its own grammar, as WR-04 did.

### Pattern E5: the second opinion on the emitted effort (D-06)

Add `guard_effort_assignment` (or extend `guard_model_assignment`) in `scripts/check-foundation-guards.ts`, with the same posture:
- read the **committed** bytes through `admit()`;
- recompute the expectation from `readModelsConfig` plus `resolveEfforts` over `ROLE_FILES`-derived stems;
- vacuity and element-count floors;
- both degraded branches **block** (no `warn()`), the WR-07 lesson.

The per-adapter rule: expected `inherit` ⇒ zero `effort` values in the admitted map; expected level `L` ⇒ exactly one value equal to `L`; more than one ⇒ a cardinality finding.

**This guard cannot exist until `effort` is in `CANONICAL_SCHEMA` (Q2).** Without it, `admit()` refuses every configured adapter `[unknown-key]`. Then `guardReferentialIntegrity` and `guard_model_assignment` go red the moment a developer configures effort in this checkout and regenerates.

### Pattern R: the host-tool registry (D-11)

```ts
// install/host-tools.ts — pure data, NO node:fs import (installer-fs-census scans every install/*.ts).
// Field names/shape are [ASSUMED] (discretion). Values for the first five are the verbatim detectTools()
// literals and the verbatim ASYM_ROWS labels; Pi's values are cited in §B.
export const HOST_TOOLS = [
  { id: "claude",   name: "Claude Code",        detect: ".claude",       adapter: "claude-kit" },
  { id: "codex",    name: "Codex CLI",          detect: ".codex",        adapter: "none" },
  { id: "gemini",   name: "Gemini CLI",         detect: ".gemini",       adapter: "gemini-settings" },
  { id: "opencode", name: "OpenCode",           detect: "opencode.json", adapter: "none" },
  { id: "copilot",  name: "GitHub Copilot CLI", detect: ".github",       adapter: "copilot-pointer" },
  { id: "pi",       name: "Pi",                 detect: ".pi",           adapter: "pi-prompt-template" },
] as const;
export const HOST_TOOL_COUNT = 6;   // asserted two-sided against HOST_TOOLS.length by a test
```

- **`detectTools()`** maps over `HOST_TOOLS` in declaration order. That keeps the output byte-identical for the existing five (no test covers that line today; add one).
- **Entry files per tool** belong in the registry too (D-11 names "entry file"). They feed the doc-table check, but nothing reads them at run time.
- **Consumers:** `check-uat-oracles.ts` builds `ASYM_ROWS` from `HOST_TOOLS` (Claude Code is the spawn row; every other row needs no-spawn wording, which Pi must carry). `validate-agent-factory.ts` checks that the `adapters.md` dispatch-map bold rows equal the registry names, two-sided. A new test `install/host-tools.test.ts` asserts the count, unique ids and names, the detection mapping (plant each signal in a scratch target → the `tools detected:` line names exactly that id), the table-row set equality in every file with a bold tool row, and the prose count-word scan.
- **Import edge:** `scripts/*.ts` → `../install/host-tools.js` is new. No production script imports from `install/` today [VERIFIED: grep], though `scripts/check-kit-refs.test.ts` does. It does not break D-18, which constrains `install/` → `scripts/` only. Flag it in the plan as a deliberate new edge (Assumption A5).

### Pattern P1/P2: the Pi prompt template (D-10)

- **Path:** `.pi/prompts/<name>.md` (name: Q3).
- **Body:** pointer text only, single-sourced from the existing start-here sentence (reuse the `COPILOT_PTR` constant rather than writing a fourth spelling), plus `$ARGUMENTS`:

```markdown
---
description: Route a software-delivery request through the grugops Orchestrator.
argument-hint: "<request>"
---
grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.
Request: $ARGUMENTS
```

Wording is [ASSUMED]. `description`, `argument-hint` and `$ARGUMENTS` are cited Pi features. Never write `.pi/SYSTEM.md`, `.pi/APPEND_SYSTEM.md`, `.pi/settings.json`, `.pi/skills/` or `.pi/extensions/` (D-10).

### Pattern P3: the Pi install write rides the existing ledger (D-13)

```ts
// Shape only — mirrors mergeGemini's create path and the AGENTS.md block (install/install.ts ~2449, ~5000).
function writePiPromptTemplate(): void {
  const rel = PI_TEMPLATE_REL;                         // ".pi/prompts/<name>.md", POSIX
  const file = join(TARGET, ...rel.split("/"));
  const cur = readForWrite(TARGET, file);              // DC-3: never reads a FIFO/dir/link
  if (cur.state === "blocked") { verify(`${rel}: ${blockedAt(cur, file)} — left untouched.`); return; }
  if (cur.state === "ok") { report("skipped", `${rel} (a file is already there — left untouched)`); return; }
  if (DRY_RUN) { report("would-add", rel); return; }   // decide BEFORE the DRY_RUN branch
  if (writeTargetFile(file, PI_TEMPLATE_TEXT, "create", rel)) {   // "wx": never overwrites
    recordCreatedFile(file, writtenFileRecord(file, PI_TEMPLATE_TEXT)); // kit-false `file` entry
    report("created", rel);
  }
}
```

- **Idempotence:** on re-run the file reads `ok` → `skipped`. `nextLedgerEntries` carries the previous kit-false entry forward **only while `recordHolds`** (`install/install.ts:4243-4270`), so a user edit drops the claim.
- **Directories:** `mkdirp` records `.pi` and `.pi/prompts` in `CREATED_DIRS` only when this run created them. A user's existing `.pi/` is never claimed.
- **Uninstall:** no code needed. `walkLedger` (`install/uninstall.ts:1657-1676`) calls `reverseFile` (which asks `owns(LEDGER, TARGET, path, "file")` first) and then `reverseDir`, deepest first, only if it emptied the directory. Optional: a report-only `left` line for an unrecorded file at the template path, matching `reportUnrecordedKitPaths`.
- **No new ledger kind:** `KINDS_BY_SCOPE.target` already has `dir` and `file`.

### Anti-Patterns to Avoid

- **A new module for effort** (for example `scripts/effort-tiers.ts`). It forces edits to the two hand-written twin lists (`install/install.ts:436-441`, `scripts/adapters-freshness.ts:215-230`), whose failure direction is loud but costly. It also splits D-07's "one reader".
- **Folding effort into the model `RESOLVED_ASSIGNMENT` payload.** That changes a closed grammar three consumers read.
- **A `Record<stem, effort>` table for `tiered`.** A second stem list breaks D-04.
- **A sentinel block appended into `.pi/prompts/<name>.md`.** That would edit a user's own template. Use the whole-file create only.
- **Gating the Pi write on detection without adding a derivation variant** (Pitfall 10).
- **Writing "six" anywhere in prose.** That re-creates the stale-count problem with the next host.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading a user path safely | `existsSync` + `readFileSync` | `readForWrite` / `readUserFile` (`install/user-file.ts`) | DC-3: a FIFO hangs a plain read |
| Creating a target file | `writeFileSync` | `writeTargetFile(…, "create")` | Exclusive `wx`, mkdirp walk with lstat, counted verify |
| Recording what install wrote | a new marker field | `recordCreatedFile` + `writtenFileRecord` → ledger `file` | 33.1 D-33: one ledger; a seventh record is the WR-01 class |
| Deciding removal | path or byte checks in uninstall | `owns()` via `walkLedger` | DC-2 |
| Quoting a value into a refusal | `JSON.stringify` | module-private `quoteValue` / `describeShape` | R3-WR-02: four throwing shapes |
| Parsing adapter frontmatter in a guard | regex on `effort:` lines | `admit()` | D-15 one authority |
| The role set | `readdirSync(agent-factory/roles)` | `listRoles()` + `ROLE_COUNT` | KIT-01 |
| Announcement parsing | `indexOf` | an anchored-at-byte-0 reader (`anchoredValuesIn`) | WR-03 |

**Key insight:** every problem in this phase already has an authority in the tree that has survived several gap rounds. Any second implementation is, by this repo's own history, the next finding.

## Runtime State Inventory

The phase is not a rename, but D-11 changes a set that runtime artifacts carry, so the five categories are answered.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Target repos' `.grugops/install.json` ledgers hold no host-tool list. Ledger entries are paths, and Pi adds new paths only on a re-install. `.grugops/factory.config.json` gains an optional `models.effort` key that users write. No migration | None (code edit only) |
| Live service config | None. grugops has no service | None — verified by architecture (no runtime/service) |
| OS-registered state | None | None |
| Secrets/env vars | `CLAUDE_CODE_EFFORT_LEVEL` (a user's own env var) overrides the emitted effort. That is not a grugops secret, but `factory.config.md` must document it | Docs only |
| Build artifacts | Committed `.js` twins of every edited `.ts` (`npm run build`, `check:build-parity`). Already-installed target repos keep their old adapters until `node install/install.js --target <repo>` re-runs. `install --check` names stale adapters because the doctor compares fully rendered bytes | Rebuild and commit `.js`; docs state "re-run install to deliver an effort edit" (already true for models) |

## Common Pitfalls

### Pitfall 1: the `roles`-absent early return swallows `effort`
**What goes wrong:** `{"models":{"effort":{"preset":"tiered"}}}` resolves to zero-config with no message.
**Why:** `readModelsBlock` returns at `if (rawRoles === undefined) return …` (`model-tiers.ts:1523`).
**How to avoid:** restructure to a single return. Extend the existing "every member of MODELS_KEYS is CONSUMED" probe table (`model-tiers.test.ts`, the WR-01 consumption case) with an `effort`-only probe. That test asserts its probe table covers `MODELS_KEYS` in both directions, so adding `effort` to the tuple without a probe goes red by design.
**Warning sign:** a generator run under an effort-only config announces an effort assignment of `["inherit"]`.

### Pitfall 2: `admit()` refuses `effort` (Q2)
**What goes wrong:** every configured adapter is `[unknown-key]`. `guardReferentialIntegrity` and the effort guard go red. The zero-config tree hides this because no live file carries the key.
**And the converse:** adding `effort` to `CANONICAL_SCHEMA` turns `scripts/canonical-frontmatter.test.ts` "the key union across the live corpus equals CANONICAL_SCHEMA, in both directions" red with "the exported schema carries key(s) no live file uses: effort". Under D-06 no live file ever will.
**How to avoid:** a recorded human decision (precedent D-33-R3-02 for `_`). Recommended shape: the measured corpus becomes the live scan **plus** the adapters a generator run emits under a configured effort preset in a scratch mirror. The schema stays measured, not guessed. All five levels are lowercase letters inside `PLAIN_SCALAR_ALPHABET`, so no alphabet change is needed.

### Pitfall 3: the freshness pin certifies a configured run (CR-01 again)
**What goes wrong:** the mirror run emits `effort:` lines while announcing a zero-config **model** resolution. The gate reads only model lines.
**How to avoid:** Pattern E4. Assert the effort announcements too, and mutation-prove that a mirror carrying an effort config fails.

### Pitfall 4: the coordinator body's "four" is byte-pinned (Q1)
**What goes wrong:** D-11's prose fix changes `grugops-orchestrator.md:38`. `adapter-byte-baseline.test.ts` admits exactly one divergence (the `admit` grant, D-33-R3-02), so it goes red.
**How to avoid:** human decision. The recommended answer is to reword it to "the non-Claude-Code host CLIs" and admit a second divergence in `adapter-byte-baseline.test.ts`. Derive its expected line from the **frozen baseline line** by a declared transform (removing the word "four "), never from the generator. Record it as a new decision (D-14).

### Pitfall 5: the generator stub must keep working
The generator's substituted-twin tests wrap `model-tiers.js` with `export * from "./model-tiers.real.js"` (`generate-role-adapters.test.ts:1136-1141`). New exports are re-exported automatically. Write effort stubs (for example `resolveEfforts` answering a fixed level) the same way, and never hand-author a whole twin.

### Pitfall 6: consumption ≠ presence for `EFFORT_KEYS`
The `MODELS_KEYS` comment (model-tiers.ts:261-274) records that widening a closed tuple adds no reader. The same consumption probe must exist for `EFFORT_KEYS` (`preset`, `roles`): each member, driven alone, must move the answer.

### Pitfall 7: doc-marker substring collision in `model-dial-consistency.test.ts`
`declaredSets(text, marker)` uses `text.indexOf(marker)` (`model-dial-consistency.test.ts:415-432`), and `CLOSED_SET_DECLARATION_SITES = 2` (line 201). A doc line such as "effort preset allowed set: `none`, `tiered`" **contains** "preset allowed set:" and would be counted as a third model-preset site. The pin goes red, or if the counts happen to line up, the line is silently mis-attributed (the members are equal, so a membership check cannot tell). **Use markers that are not substrings of the existing ones**, for example "allowed effort presets:" and "allowed effort levels:". Add parallel two-direction cases against `EFFORT_PRESET_NAMES` and `EFFORT_LEVELS`.

### Pitfall 8: pinned counts and headings in the packaging authority
- **Pinned marker count.** `UNKNOWN_VERIFY_MARKER_COUNT = 1 + RESIDUAL_ANCHORS.length` (`model-dial-consistency.test.ts:277`) pins the `UNKNOWN - verify` markers in `subagent.frontmatter.md`. Put the effort `UNKNOWN - verify` items (the no-effort-model behaviour, the version floor) in **`factory.config.md`** (D-08 says that file states the behaviour), or move the pin in the same commit.
- **Pinned heading.** `SCOPE_SECTION_HEADING = "## Host-CLI scope of the model dial"` is cited by heading from `factory.config.md` and checked to exist. Rename only in one commit with both sides and the test.
- **Pinned scope sentence.** `SCOPE_SENTENCE` hard-codes "other four host CLIs", and `OTHER_HOST_CLI_COUNT = 4` is derived from its enumerating clause. Pi has **no** per-agent `model` field (no sub-agents), so Pi must not be added to the "although … each accept a per-agent `model` field" clause. Add a separate cited Pi clause (README line 19 / pi.dev) and remove the count word "four".

### Pitfall 9: installer pinned path counts move
`deriveWritePaths` derives the write set from real install runs, so an unconditional Pi write adds one file and two directories. These pins move and must be re-pinned with a reason, as each header requires:
- `WRITE_PATH_COUNT = 85` (`install/installer-never-installed.test.ts:89`) → expected 88;
- `INSTALLED_FILE_COUNT = 58` (`install/installer-user-edit.test.ts:126`) → expected 59;
- `READ_PATH_COUNT = 60` (`install/installer-special-files.test.ts:86`) → expected 61.

Also likely to move: `REMOVABLE_COUNT = 33` (`record-truth.test.ts:314`), `RECORDED_FILE_COUNT = 31` (`installer-cross-version.test.ts:35`), and the per-variant breakdown comments. The exact deltas are [ASSUMED]. Measure after the change, and never edit a number without the derived log line that justifies it.

### Pitfall 10: a detection-gated Pi write escapes the class tests
If the template is written only when `.pi` exists, the default derivation variant (empty target) never writes it. The DC-2 and DC-3 class tests then never plant at its path. Either write unconditionally, as `CLAUDE.md`, the Gemini settings and the Copilot pointer already are, or add a `pi-detected` variant to `VARIANTS` in `install/installer-paths.test-support.ts:279`. Recommended: unconditional, for parity with the Copilot pointer. Side effect, to be documented: Pi then asks for project trust in every installed repo, because `.pi/prompts` is a trust-protected resource.

### Pitfall 11: claim-anchor registry and GSD-generated sources
- **Verbatim claims.** `agent-factory/README.md:39-58` (claims C-28-027/028/029) and `README.md:4` (C-28-001) are verbatim-pinned by `node scripts/check-claim-anchors.js` against `docs/audit/28-claim-registry.md`. Update the registry's line ranges and verbatim blocks in the same commit.
- **GSD-generated sections.** The CLAUDE.md §6 table and the "five tools" constraint line regenerate from `.planning/research/STACK.md` and `.planning/PROJECT.md`.

### Pitfall 12: tests drive the committed `.js`
Nearly every oracle imports `./x.js`. After editing `.ts`, run `npm run build` before vitest, and commit both `.ts` and `.js`. `npm run check:build-parity` fails on drift.

### Pitfall 13: Pi template only works from the repo root
Pi resolves `.pi/prompts` against cwd and does not walk ancestors (§B). The install guide must say "start Pi from the repository root to get the command". Context files (AGENTS.md) still load from any subdirectory.

### Defect classes from the 33.1 brief — where each can bite this phase
| Class | Where it can bite | Required test (class, not site) |
|-------|-------------------|--------------------------------|
| DC-1 missing evidence read as proof | effort guard reading an absent `effort` key as "agrees"; announcement readers reading an absent line as `none`; `readModelsConfig` treating a degenerate `effort` as absent | absent / duplicate / garbled `effort` lines in adapters → named findings; absent announcement → named finding (not consent); degenerate `effort` block → refusal |
| DC-2 delete by presence | uninstall of `.pi/prompts/<name>.md` or `.pi/` | the derived never-installed test (user file at every write path, the Pi path included by derivation) and the derived user-edit test, with counts re-pinned |
| DC-3 unbounded read | the Pi template path; also **`readModelsConfig` itself** uses `existsSync` + `readFileSync` on `.grugops/factory.config.json` (`model-tiers.ts:1620-1624`), and a FIFO there hangs the generator. This is pre-existing, but this phase extends that reader | special-files test covers the Pi path by derivation. Recommend (planner decides scope) routing the config read through a bounded regular-file read; the generator lives in `scripts/` and cannot import `install/user-file.ts` without a new edge. Disclose as a residual if not fixed |
| Set-literal drift | `ASYM_ROWS`, `detectTools`, `OTHER_HOST_CLI_COUNT`, count-word prose, `EFFORT_PRESET_NAMES` vs `PRESET_NAMES`, a stem-keyed effort table | registry count test; derived prose scan; derivation of the effort split from `TIERED` |

## Code Examples

### Effort resolution (shape)
```ts
// Source: mirrors resolveModels (scripts/model-tiers.ts:1037-1303). Names are ASSUMED (discretion).
export function resolveEfforts(
  stems: readonly string[],
  options?: { readonly preset?: EffortPresetName; readonly overrides?: ReadonlyMap<string, EffortLevel> },
): { ok: true; value: ReadonlyMap<string, EffortLevel> } | { ok: false; reason: string } {
  // Floor 0: preset validated BEFORE defaulting (only strictly-undefined → "none") — WR-02 lesson.
  // Floor 0b: overrides must be a Map or undefined — R2-WR-01 lesson.
  // Floor 1: empty stems refused. Floor 2: duplicate stem refused by name.
  // Base: "tiered" → for each sorted stem, TIERED row alias "opus" ? "high" : "medium";
  //       a stem with no TIERED row is refused by name (never a fallback to inherit).
  //       "none" → "inherit" for every stem.
  // Overrides: value must pass isEffortLevel; key must be a covered stem; override wins.
}
```

### Zero-config byte check (what EFFORT-04's case asserts)
```ts
// In generate-role-adapters.test.ts: a mirror with NO config emits zero lines starting "effort: ",
// and a mirror with {"models":{"effort":{"roles":{"<stem>":"max"}}}} emits exactly one, in that
// stem's adapter only. Count lines with text.split("\n").filter((l) => l.startsWith("effort: ")).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `effort:` frontmatter ignored on Opus 4.7, Opus 4.8, Fable 5 | honoured | Claude Code 2.1.267 | Docs must name 2.1.267 as the practical floor for those models |
| no effort cap setting | `maxEffortLevel` caps every provider | 2.1.267 | A user's cap silently lowers the dial's level; document it |
| top-level `effortLevel` | per-model levels under `modelSettings`; top-level `effortLevel` does not apply to Opus 5.5 | 2.1.257+ | Session effort varies by model, which is why `inherit` is the right default |
| `model:` aliases `sonnet/opus/haiku/inherit` | adds `fable` | (sub-agents page, 2026-10-06) | `MODEL_ALIASES` lacks `fable`; out of scope (Q6) |
| Pi prompt templates user-level only | user plus project (`.pi/prompts`) behind project trust | current Pi `main`, 1.0.4 | D-10 template ships |

**Deprecated/outdated in this repo:** the "3055 bytes / 17 bytes headroom" sentence in `subagent.frontmatter.md` (measured 3013 today). Assumption A1 ("alias vocabulary not re-verified") is now resolvable against the sub-agents page.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude Code's behaviour for `effort:` on a model that supports no effort (Haiku) is unknown; the changelog only hints the field is not sent | §A | Docs must say `UNKNOWN - verify`; if it errors at run time, `haiku` + effort breaks a role at launch |
| A2 | Standalone `.claude/agents/` `effort` predates 2.1.78 (inferred from the plugin-agent entry's wording) | §A | Version floor in docs could be wrong; keep `UNKNOWN - verify` |
| A3 | Expected re-pin deltas: WRITE_PATH_COUNT +3, INSTALLED_FILE_COUNT +1, READ_PATH_COUNT +1; REMOVABLE/RECORDED counts may move | Pitfall 9 | Wrong numbers; mitigated by measuring, never guessing |
| A4 | Registry field names, the effort constant names, the announcement prefixes and the template wording | Patterns R, E2, E4, P2 | Cosmetic; discretion areas |
| A5 | A new `scripts/` → `install/` import edge (validator, oracle) is acceptable | Pattern R | If a guard or census forbids it, keep the registry check in tests only and have the validator check presence |
| A6 | An unconditional Pi template write (Copilot parity) is acceptable UX, although it triggers Pi's trust prompt in every installed repo | Pitfall 10 | User may prefer detection-gated; then add a derivation variant |
| A7 | Effort `medium` for execution roles makes no cost claim; the quality rationale is judged by the human | Pattern E2 | MODEL-07 dispute; rationale text needs human review |

## Open Questions (human decisions before planning)

1. **Q1 — Coordinator body "the four non-Claude-Code CLIs" (D-06 vs D-11).**
   - What we know: the line is emitted into `grugops-orchestrator.md:38`. The frozen byte baseline admits exactly one divergence. With Pi the sentence is stale.
   - Recommendation: reword to "the non-Claude-Code host CLIs" (no count) and record a decision (D-14) that the zero-config **effort** half is byte-neutral while this one body line changes by a declared transform of the baseline. The alternative is to leave the stale count in the adapter and exempt it from the prose scan, which contradicts D-11.
2. **Q2 — Widen `CANONICAL_SCHEMA` with `effort`.**
   - What we know: without it, no guard can read a configured adapter. With it, the corpus-equality test reds unless the measured corpus includes configured generator output.
   - Recommendation: widen, with the corpus extended by a configured-mirror generator run, recorded as a decision like D-33-R3-02. This is the gate for EFFORT-04.
3. **Q3 — Template name: `/grug` (D-10 literal) or `/grugops`.**
   - What we know: README and the Claude Code skill use `/grugops` everywhere (10 spellings, 0 bare `/grug` entry commands). `/grug` matches the brand's original shape. Neither collides with a Pi built-in.
   - Recommendation: `/grugops` (`.pi/prompts/grugops.md`) for one command across hosts, confirmed by the human because it differs from D-10's wording.
4. **Q4 — Unconditional or detection-gated Pi write** (Pitfall 10; A6). Recommendation: unconditional.
5. **Q5 — Does this phase bound the DC-3 read in `readModelsConfig`?** It is pre-existing, but this phase extends the reader. Recommendation: disclose as a residual unless it is cheap. A bounded reader in `scripts/` would be a second implementation of `readUserFile`.
6. **Q6 (out of scope, noting only)** — `fable` is now a documented alias, and A1 is now citable. Changing `MODEL_ALIASES` or the pinned `UNKNOWN - verify` count is not in this phase's criteria. Recommend a backlog item.
7. **Pre-existing, inherited by Pi (not this phase's to fix):** on the non-Claude hosts the shared kit lives at `~/.grugops/agent-factory`, while AGENTS.md says "The kit root is resolved by the adapter only". Those hosts have no resolver adapter, so whether a scripted install leaves them able to find `agent-factory/roles/orchestrator.md` is `UNKNOWN - verify` [ASSUMED gap]. A Pi template could carry the resolver slot, but that makes it a third resolver adapter (the slash-command template's "ONLY two adapters" rule). Recommendation: keep the plain pointer; raise the gap as a backlog item.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, tests, installer | ✓ | v24.12.0 (engines `>=22`) | — |
| npm / `npx vitest` | tests | ✓ | via `npm ci` | — |
| git | baseline test (`git ls-tree`, `git show`), prose scan | ✓ | — | — |
| Claude Code CLI | not needed by any planned test; live e2e excluded | ✓ | 2.1.290 | — |
| Pi CLI (`pi`) | **not needed**: grugops writes a file, and no test runs Pi | ✗ | — | Tests assert the file and ledger, not Pi's behaviour; any live Pi check is a human UAT item |
| `mkfifo` | DC-3 Pass F | ✓ (darwin/ubuntu) | — | win32 skips Pass F (existing pattern); Pass D (directory) runs everywhere |
| windows-latest runner | D-09 measurement | CI only | — | The human pushes; the result is recorded in a summary |

**Missing dependencies with no fallback:** none.
**Missing with fallback:** Pi CLI (behaviour is cited from source, not run).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest `~4.1.8` (globals false; tests import the committed `.js`) |
| Config file | `vitest.config.ts`; `tsconfig.json`, `tsconfig.tests.json`, `tsconfig.fixtures.json` |
| Quick run command | `npm run build && npx vitest run scripts/model-tiers.test.ts scripts/generate-role-adapters.test.ts` (substitute the files a task touches) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (NEVER `npm test`) |
| Build/parity | `npm run build && npm run check:build-parity && npm run typecheck` |
| CI gates (ubuntu) | `npm run freshness:adapters`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-claim-anchors.js`, `node scripts/check-banned-claims.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EFFORT-01 | citation and version floor present in the dial docs | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ (extend) |
| EFFORT-02 | every refusal by name: unknown key in `models` and in `effort`, case-varied key, degenerate block, unknown stem, illegal level, key decided before siblings; effort-only block is consumed | unit | `npx vitest run scripts/model-tiers.test.ts` | ✅ (extend) |
| EFFORT-03 | tiered: high exactly on TIERED's opus rows (derived), medium elsewhere; `effortRationale` required and digit-free; model `tiered` leaves effort inherit | unit | `npx vitest run scripts/model-tiers.test.ts` | ✅ (extend) |
| EFFORT-04 | zero-config: no `effort:` line; baseline still byte-equal (one or two admitted divergences); configured mirror emits exactly the resolved lines; announcements present and asserted; guard red on hand-edited, absent or duplicated `effort` | integration (mirror spawn) | `npx vitest run scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts scripts/check-foundation-guards.test.ts scripts/canonical-frontmatter.test.ts` + `npm run freshness:adapters` + `node scripts/check-foundation-guards.js` | ✅ (extend) |
| EFFORT-05 | closed sets documented at their sites, two-directional, with non-colliding markers; scope statement names Pi with a citation | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ (extend) |
| HOST-01 | registry count; detection per signal; every bold-row table set-equal; `ASYM_ROWS` derived; no host count word in the derived prose corpus (mutation-proved) | unit + corpus | `npx vitest run install/host-tools.test.ts scripts/check-uat-oracles.test.ts` + `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ❌ Wave 0 (`install/host-tools.test.ts`) |
| HOST-02 | no new windows red | CI | pushed run, `test (windows-latest)` conclusion recorded | manual (human push) |
| PI-01 | Pi conventions recorded with sources | doc oracle (registry ↔ docs) | `npx vitest run install/host-tools.test.ts` | ❌ Wave 0 |
| PI-02 | template created with the exact pointer bytes; never written when a file is there; DRY_RUN names `would-add` and writes nothing | integration (installer) | `npx vitest run install/install.test.ts install/installer-dry-run.test.ts` | ✅ (extend) |
| PI-03 | ledger `file` + `dir` entries; uninstall removes only recorded and unchanged; user file at the path survives (never-installed and user-edit classes); FIFO/dir at the path → verify within timeout | integration (class tests) | `npx vitest run install/installer-never-installed.test.ts install/installer-user-edit.test.ts install/installer-special-files.test.ts install/installer-write-set.test.ts install/uninstall-removal.test.ts` | ✅ (re-pin counts) |
| PI-04 | scope sentence and the Pi safety rows present, with citations | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts install/host-tools.test.ts` | ✅/❌ |

### Windows risk for new or changed tests (D-09)
| Risk | Where | How existing tests avoid it |
|------|-------|-----------------------------|
| Path separators in ledger and report assertions | Pi path tests | Compare ledger `path` with POSIX strings (`.pi/prompts/x.md`); build filesystem paths with `join`; `targetRel` already POSIX-normalizes |
| FIFO planting | DC-3 at the Pi path | Pass F skips on win32 with the reason printed; Pass D (directory) runs |
| chmod-dependent cases | none should be added | WINDOWS.md row 315 pattern: skip on win32 and as root, reason printed |
| `renameSync` over a watched/open file (EPERM) | none should be added | row 274; avoid rename-over in new tests |
| Symlink creation | only if a test plants a link at the Pi path | existing `if (process.platform === "win32") return;` (`install/install.test.ts:2293`) |
| CRLF | none: `.gitattributes` pins `*.md`, `*.ts`, `*.js` to LF | — |
| `git ls-files` in the prose scan | host-tools test | Use `spawnSync("git", [...])` output split on "\n" and trimmed; `git` exists on windows-latest |

### Sampling Rate
- **Per task commit:** `npm run build && npx vitest run <touched test files>`
- **Per wave merge:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run check:build-parity && npm run typecheck` + `npm run freshness:adapters` + `node scripts/check-foundation-guards.js`
- **Phase gate:** full suite green, all CI gates green, the claim-anchor gate green, and the windows-latest result from a human-pushed run recorded (D-09)

### Wave 0 Gaps
- [ ] `install/host-tools.ts` + `install/host-tools.test.ts`: the registry, count, detection mapping, table set equality, prose count scan with mutation proof
- [ ] A `detectTools()` behaviour case (no test covers the `tools detected:` line today) [VERIFIED: grep finds none]
- [ ] Q1/Q2/Q3 answered (human checkpoint) before EFFORT-04 and PI-02 plans run

## Security Domain

`security_enforcement` is absent from the config, so it is treated as enabled. ASVS level 1, block on high.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (indirect) | Human-held merge/deploy unchanged; Pi row documents git host as the only floor |
| V5 Input Validation | yes | Closed allow-lists by exact string equality (`EFFORT_LEVELS`, `EFFORT_PRESET_NAMES`, `EFFORT_KEYS`, derived stems); never a regex; refusal by name |
| V6 Cryptography | no (sha256 content records already exist; no new use) | — |
| V12 Files and Resources | yes | `readForWrite`/`writeTargetFile` (no link following, `wx` create, bounded regular-file reads); config keys never joined onto a path; fixed literal template path |
| V14 Configuration | yes | Zero-config default `inherit`; refusal writes nothing |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| YAML injection into adapter frontmatter through an effort value | Tampering | Value must be a member of the 6-string tuple (all lowercase letters); `admit()` alphabet as a second floor |
| Path traversal through a `models.effort.roles` key | Tampering | Key compared against derived stems before any use; never joined onto a path |
| Symlink or FIFO at `.pi/prompts/<name>.md` redirecting or hanging the write | Tampering / DoS | `readForWrite` → blocked → verify; exclusive create |
| Overwriting or deleting a user's own Pi template | Tampering | create-only; `owns(path)` + content match before removal |
| Prompt injection via the shipped template | Elevation | Fixed literal pointer text; no user or config input reaches it |
| User believes effort applies when env var or `maxEffortLevel` overrides it | Repudiation / misconfiguration | Documented precedence in `factory.config.md` (D-08) |
| Pi runs tools with no approval prompt | Elevation | State it plainly (cited); git-host floor is the hard rule; extensions mentioned, none shipped |

## Sources

### Primary (HIGH confidence; vendor docs or vendor source read this session)
- code.claude.com/docs/en/sub-agents (fetched 2026-10-06): frontmatter table (`effort`, `model` rows), extended-thinking paragraph
- code.claude.com/docs/en/model-config (fetched 2026-10-06): "Adjust effort level" table, fallback sentence, frontmatter-vs-env precedence, defaults, `effortLevel`/`modelSettings`
- raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md (fetched 2026-10-06; head 2.1.291): entries 2.1.78, 2.1.113, 2.1.149, 2.1.222, 2.1.267, 2.1.288
- github.com/earendil-works/pi `main` @ `9ad08310…` (fetched 2026-10-06 via GitHub API): `packages/coding-agent/README.md`, `docs/{prompt-templates,configuration,settings,skills,security,slash-commands,cli,extensions,mcp,environment-variables,usage,how-pi-works,windows}.md`, `src/core/resource-loader.ts`, `src/core/prompt-templates.ts`, `src/config.ts`, `package.json`
- pi.dev (fetched 2026-10-06): "No sub-agents", install line
- npm registry: `@earendil-works/pi-coding-agent` 1.0.4, bin `pi`, no postinstall

### Codebase (read this session)
- `scripts/model-tiers.ts` (full), `scripts/generate-role-adapters.ts` (full), `scripts/canonical-frontmatter.ts:140-260`, `scripts/check-foundation-guards.ts:1486-1489, 1861-2170`, `scripts/adapters-freshness.ts:1-240`, `scripts/adapter-byte-baseline.test.ts:1-120`, `scripts/model-dial-consistency.test.ts:1-80, 196-330, 415-432, 858-870`, `scripts/check-uat-oracles.ts:230-380`, `scripts/validate-agent-factory.ts:290-320, 760-800`, `install/install.ts` (detectTools, GENERATOR_TWINS, pointer constants, mergeGemini, mkdirp, writeTargetFile, CREATED_*, nextLedgerEntries, the agents loop), `install/install-marker.ts:1-140, 516-531`, `install/uninstall.ts:519-523, 1657-1777`, `install/user-file.ts:259-271`, installer test headers and pins, `agent-factory/packaging/{subagent.frontmatter,adapters,slash-command.template}.md`, `agent-factory/config/factory.config.md` (models section), `AGENTS.md`, `README.md`, `agent-factory/README.md`, `install/README.md` (§2, §5, §6), `.github/workflows/ci.yml`, `.gitattributes`, `package.json`, `.planning/config.json`, `.planning/WINDOWS.md` rows 274/315, `docs/audit/28-claim-registry.md` (C-28-001/027/028/029)

### Tertiary (LOW, flagged)
- Inferences from changelog wording (A1, A2), marked [ASSUMED]

## Metadata

**Confidence breakdown:**
- Vendor facts (Claude Code effort, Pi paths and behaviour): HIGH. Read from vendor docs, and for Pi from the loader source.
- Codebase map and pitfalls: HIGH. Every load-bearing value was read this session and is quoted above.
- Design recommendations (module placement, guard shape, registry shape): MEDIUM. They follow established in-repo patterns, but three need human decisions (Q1 to Q3).
- Installer count deltas: LOW until measured (A3).

**Research date:** 2026-10-06
**Valid until:** 2026-10-20 for the vendor facts (Claude Code ships near-daily; Pi's latest release is one day old); 30 days for the codebase map.
