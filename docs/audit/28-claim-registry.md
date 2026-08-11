# Phase 28 — Claim Registry (AUDIT-03)

Every public claim in `README.md`, `AGENTS.md` and `agent-factory/README.md`, given an id, mapped
to the safety floor whose lowering would falsify it, and measured against a named mechanism.

**This is a MAPPING, not a list (D-13).** The question a row answers is not *what is a claim* but
*which public sentences become false if floor F is lowered* — the join Phase 30's AUTO-01 closed
checkpoint set consumes. Phase 30's claim-dropping filters to `kind: safety`; the `architecture` and
`install` rows are here so those claims cannot drift back unnoticed (D-15 — one registry,
kind-tagged, never a second one).

Parsed by `readRegistry()` in `scripts/audit-model.ts` — the one parse authority for both of this
phase's `docs/audit/` artifacts. Enforced by `scripts/check-claim-anchors.js`.

## How to read a row

| Field | Meaning |
|---|---|
| `file` | The public document carrying the claim. |
| `line` | **Advisory, not asserted.** See § *Why `line` is recorded and not checked*. |
| `kind` | `safety` \| `architecture` \| `install`. |
| `depends_on` | The safety floor(s) whose LOWERING would falsify the claim, drawn from `SAFETY_FLOORS`. `—` on a non-safety row. |
| `status` | `true` \| `overstated` \| `false`, **measured** against `mechanism` (D-17). |
| `mechanism` | The specific thing the status was measured against. Never blank — the gate refuses a blank one. |
| `disposition` | `fixed` \| `accepted` \| `deferred`, present when `status` is not `true`. |
| `finding_id` | The `F-28-NNN` name of the finding, present when `status` is not `true`. |
| `target_phase` | The phase a `deferred` disposition names. |
| fenced block | The claim text, **byte for byte** from the source. This is what the verbatim gate compares. |

## Why `line` is recorded and not checked

The gate asserts `file`, anchor presence, and the verbatim text at the anchor. It does **not** assert
the line number. Phase 29 rewrites prose for a living, and an assertive line number would go red on
every unrelated edit above a claim — training people to ignore a red gate, which is the failure mode
this milestone has spent itself fighting. The numbers below are the claim's location in the tree
**as committed by this plan**, anchors included.

## One claim per anchorable region — and what that costs

An anchor is an HTML comment on its own line, and the claim it names is the contiguous line slice
immediately below it. That makes the unit of registration a **region of source**, not a sentence.
Three consequences, recorded rather than left to be discovered:

1. **A hard-wrapped line carrying several assertions yields one row.** `README.md:4` and
   `AGENTS.md:6` are each a single physical line asserting three separate things. The row's
   `status` is the **worst** of the measurements, and `mechanism` names every assertion measured and
   how — so nothing is averaged away, and a reader can see which part failed.
2. **A table and a list are registered whole.** An HTML comment between two pipe rows splits the
   rendered table, and one between two list items splits the rendered list. Since D-16 rests on the
   public face being unchanged, the anchor goes above the whole construct
   (`agent-factory/README.md` § dispatch table, § *How work flows*).
3. **Text inside a fenced code block is not anchorable.** An HTML comment inside a fence renders
   **visibly**. The install commands in `README.md`'s bash fence and the copy-paste prompts in
   `agent-factory/README.md` are therefore covered by the prose rows that introduce them, not by
   rows of their own.

## Claims

### C-28-001

- file: README.md
- line: 4
- kind: safety
- depends_on: autonomy, production_requires_human_confirmation, protected_branch_merge
- status: false
- mechanism: Three assertions in one hard-wrapped line, each measured separately. (1) `handoff packets` — `agent-factory/handoffs/` holds only `.gitkeep`; the seventeen static templates were deleted in Phase 24, so the sentence names an artifact class that does not ship. (2) `One Orchestrator routes work through the full software-delivery lifecycle — business analysis → … → release` — `AGENTS.md:21` states the shipped architecture as decompose→enqueue over a shared verified context, and `agent-factory/roles/orchestrator.md:88` states the Orchestrator `does NOT relay data between agents`; the arrow-chain describes the linear relay v2.0 replaced. (3) `Humans always hold merge and deploy` — independently overstated; see C-28-023 for the full measurement. The row takes the WORST of the three.
- disposition: fixed
- finding_id: F-28-201

```
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.
```

### C-28-002

- file: README.md
- line: 11
- kind: architecture
- depends_on: —
- status: true
- mechanism: `kit-model.listRoles()` returns 17 role files spanning business analysis through release and `listWorkflows()` returns 19 workflow files (measured 2026-08-12); `install/install.ts` lays adapters for all five named host CLIs. The sentence lists lifecycle COVERAGE, not a routing order, so it is not the D-10 linear-pipeline claim.

```
**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.
```

### C-28-003

- file: README.md
- line: 14
- kind: architecture
- depends_on: —
- status: overstated
- mechanism: `one job` holds — every role file carries a `## One job` section. `hard limits` holds — `orchestrator.md:88` states the coordinator width/claim caps as hard limits. `short words` (the grug-brained voice) does NOT hold: the 18 fenced caveman blocks across `agent-factory/roles/*.md` total 4,036 bytes and contain ZERO occurrences of `grug` (measured 2026-08-12); they are plain second-person English. The voice guard passes because it measures sentence SHAPE, not voice.
- disposition: deferred
- finding_id: F-28-202
- target_phase: 29

```
Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.
```

### C-28-004

- file: README.md
- line: 26
- kind: architecture
- depends_on: —
- status: true
- mechanism: `.claude-plugin/plugin.json` `version` is `0.1.0` and `agent-factory/VERSION` is `0.1.0` — the two version artifacts agree. `CHANGELOG.md:8-13` is the mechanism that reconciles the apparent conflict with `git tag`: it states that the artifact version is `0.1.0`, that no public release has been cut, and that `v1.0`/`v1.1`/`v1.2`/`v2.0` are internal milestone tags rather than published SemVer releases. RECORDED RESIDUAL, adjacent but not this claim's defect: `CLAUDE.md`'s stack table names a root `VERSION` file that does not exist on disk.

```
grugops version `0.1.0`.
```

### C-28-005

- file: README.md
- line: 29
- kind: install
- depends_on: —
- status: true
- mechanism: `install/install.ts` and `install/uninstall.ts` both ship with committed `.js`; `DRY_RUN` is read at 37 sites; `install/install.test.ts` carries the idempotence and non-overwrite cases. `Node 22+` matches the documented hard prerequisite in `CLAUDE.md` and `install/README.md`.

```
1. **Install** — run the idempotent, additive, reversible installer (Node 22+) from the repo root:
```

### C-28-006

- file: README.md
- line: 36
- kind: install
- depends_on: —
- status: true
- mechanism: Two absolutes measured against `install/install.test.ts`, which carries the re-run-is-safe and does-not-overwrite cases, and against `install/uninstall.ts`, which removes only paths the installer recorded as added. `DRY_RUN=1` is honoured at 37 sites in `install/install.ts`.

```
   The installer never overwrites or deletes your content; re-running it is safe, and `node install/uninstall.js` removes only what was added. Set `DRY_RUN=1` to preview the changes first.
```

### C-28-007

- file: README.md
- line: 45
- kind: architecture
- depends_on: —
- status: true
- mechanism: `only the dispatch differs, never the content` is held MECHANICALLY, not by prose: the seven dash-standalone skills under `.claude/skills/grugops*` and the seven colon-namespaced plugin skills under `skills/` are generated from one source by `scripts/generate-skill-twins.ts` and byte-gated by `npm run freshness:skill-twins`, so a content divergence between the two forms is unrepresentable in a green build.

```
   In the versioned Claude Code plugin form the same operations are namespaced with a colon — `/grugops:<op>` (for example `/grugops:plan`, `/grugops:ticket`, `/grugops:release`). Both forms coexist; only the dispatch differs, never the content.
```

### C-28-008

- file: README.md
- line: 48
- kind: architecture
- depends_on: —
- status: true
- mechanism: `agent-factory/README.md` exists and its § `Usage across the five tools` table carries exactly five rows — Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI — each naming its entry file and its role dispatch.

```
3. **Go deep** — the internal start-here guide explains how to point any of the five host tools at the Orchestrator and walk a ticket from idea to PR. See **[`agent-factory/README.md`](agent-factory/README.md)**.
```

### C-28-009

- file: README.md
- line: 53
- kind: architecture
- depends_on: —
- status: true
- mechanism: `CHANGELOG.md` exists at the repository root and its lines 5-6 state that the format is based on Keep a Changelog 1.1.0, with the `Unreleased` block and the Added/Changed/Fixed section vocabulary present.

```
The release history lives in [`CHANGELOG.md`](CHANGELOG.md) and follows Keep a Changelog.
```

### C-28-010

- file: AGENTS.md
- line: 6
- kind: safety
- depends_on: autonomy, production_requires_human_confirmation, protected_branch_merge
- status: false
- mechanism: `One Orchestrator (the head grug) routes work through the full lifecycle` is contradicted BY THIS SAME FILE sixteen lines later: `AGENTS.md:21` states `the Orchestrator sequences by decompose→enqueue`. One document asserting both is the drift D-10 records as unreachable by any grep, because `routes` is still-correct English elsewhere. `Humans decide; agents execute` carries the same overstatement measured at C-28-023. The row takes the worst of the two.
- disposition: fixed
- finding_id: F-28-203

```
This repo runs a file-based agent factory for software delivery. One Orchestrator (the head grug) routes work through the full lifecycle; a few single-job grug agents execute within hard limits. The role is the intelligence. The workflow is the guardrail. The shared verified context is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.
```

### C-28-011

- file: AGENTS.md
- line: 11
- kind: architecture
- depends_on: —
- status: true
- mechanism: `agent-factory/roles/orchestrator.md` exists on disk and is the file `.claude/agents/grugops-orchestrator.md` and every per-tool adapter points at.

```
All work starts with the Orchestrator: `agent-factory/roles/orchestrator.md`.
```

### C-28-012

- file: AGENTS.md
- line: 16
- kind: architecture
- depends_on: —
- status: overstated
- mechanism: `the dial (mode, cadence, autonomy, WIP limits)` holds — all four keys are present in `agent-factory/config/factory.config.json`. `Runs lean with documented defaults when absent` is stronger than the mechanism: the defaults ARE documented (`agent-factory/config/factory.config.md` carries a per-field lean-default column), but `factory.config.md:3` scopes role honouring to `when it is present`, and a grep across all 18 role files finds ZERO stating a when-absent fallback (only 4 mention `lean` at all). The fallback rests on an agent inferring it, not on any role instruction.
- disposition: deferred
- finding_id: F-28-204
- target_phase: 29

```
1. `.grugops/factory.config.json` — the dial (mode, cadence, autonomy, WIP limits). Runs lean with documented defaults when absent.
```

### C-28-013

- file: AGENTS.md
- line: 21
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured against `agent-factory/roles/orchestrator.md`, which carries the classification step, the role-activation step, the requirement that each role publish typed notes, and the board/traceability update. `activates` is the still-correct v2.0 verb; this line does NOT assert the linear routing order C-28-010 measures false.

```
The Orchestrator classifies the request, activates the right specialist role(s), requires published notes from each, updates the board and traceability, and produces the next action.
```

### C-28-014

- file: AGENTS.md
- line: 26
- kind: architecture
- depends_on: —
- status: true
- mechanism: `agent-factory/workflows/16-context-read-write.md` exists and is the pull/publish contract this line names; `orchestrator.md:88` independently states `does NOT relay data between agents — the shared verified context is the only channel`. This is the CORRECT v2.0 statement, and it is the line that makes `AGENTS.md:5` self-contradictory.

```
Roles pull the shared verified context they need and publish their work output as typed notes — per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`). The shared context is the inter-role memory; the Orchestrator sequences by decompose→enqueue.
```

### C-28-015

- file: AGENTS.md
- line: 37-40
- kind: architecture
- depends_on: —
- status: true
- mechanism: The KIT/STATE split is enforced mechanically by `scripts/check-kit-refs.ts` (Assertions 1-3 over the shipped kit) and by the installer's two-root layout; `agent-factory/workflows/16-context-read-write.md` exists; `install/install.ts --check` is the re-run this block names. NOTE, recorded in `## Two-sided completeness (D-14)` rather than as a finding: line 29 calls this block `a resolution and safety rule`, yet no member of `SAFETY_FLOORS` holds it, so its `kind` is `architecture` — a fifth floor cannot be invented, because `audit-model.test.ts` pins `SAFETY_FLOORS.length` two-sided at 4.

```
- `agent-factory/…` = **KIT** — read-only, resolved from the kit root; NEVER written.
- `plans/`, `memory-bank/`, `.grugops/` = **STATE** — read/write in THIS repo.
- Roles read and write the shared verified context only via Workflow 16 (`agent-factory/workflows/16-context-read-write.md`) — referenced, never restated.
- The kit root is resolved by the adapter only. If the resolved kit dir is absent: **STOP — do not hunt** the repo for `agent-factory/…`. Re-run the installer (`node install/install.js` or `node install/install.js --check`).
```

### C-28-016

- file: AGENTS.md
- line: 43
- kind: architecture
- depends_on: —
- status: true
- mechanism: A one-line restatement of C-28-015's block, measured against the same mechanisms. It is registered separately rather than folded in because it is a distinct anchorable location: a Phase 29 rewrite that updated one and not the other would leave this document asserting the invariant twice in two different ways, and only a per-location row makes that visible.

```
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt.
```

### C-28-017

- file: AGENTS.md
- line: 48
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured against this file's own § `Commands`: all twelve command slots across Install/Development/Test/Acceptance/Test integrity/Lint/Typecheck/Build/E2E carry `UNKNOWN - verify`, and none carries a fabricated command. The honesty rule is honoured by the section it governs.

```
Real commands only, with flags, preferring fast single-file variants. If a command is unknown, ship `UNKNOWN - verify` — never fabricate. Do not enforce here what a linter or CI already enforces.
```

### C-28-018

- file: AGENTS.md
- line: 100-103
- kind: safety
- depends_on: protected_branch_merge, production_requires_human_confirmation, test_integrity
- status: overstated
- mechanism: `hooks/guard.ts` denies protected-branch pushes (`git push … main|master|release/`, and any force push) and a production-deploy verb set unless the human-set `GRUGOPS_PROD_DEPLOY_APPROVED` is present, and refuses any command that tries to inline-set it, so an agent cannot self-approve; `factory.config.json` carries `production_requires_human_confirmation: true` and `quality.test_integrity: "warn"`. THE OVERSTATEMENT IS SCOPE, measured at `hooks/hooks.json`: the guard is wired as a PLUGIN-level PreToolUse hook, and `install/install.ts:1571` prints in its own installed output that `the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json)` — so on the other four advertised host CLIs, and on the standalone `.claude/` install form, these rules are held by prompt alone. `guard.ts` additionally records env-var indirection as an out-of-scope residual.
- disposition: accepted
- finding_id: F-28-205

```
- Do not read or expose secrets.
- Do not run destructive commands.
- Never merge a protected branch. Never deploy prod without human confirmation.
- Do not change dependencies without reason. No unrelated refactors. No fake results.
```

### C-28-019

- file: AGENTS.md
- line: 108
- kind: architecture
- depends_on: —
- status: true
- mechanism: Counted in this file: rules 1 through 12 are present and consecutively numbered, and the four `### Principle N` headings are present. The count claim and the artifact agree.

```
Andrej Karpathy's coding-agent rules — 12 rules grouped under four principles. Follow them by default. Written in clear voice.
```

### C-28-020

- file: AGENTS.md
- line: 150-151
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured against `agent-factory/seed/`: `memory-bank/` carries `00-index.md`, `10-project-brief.md`, `20-product.md`, `30-architecture.md`, `40-contributing.md` and `60-progress.md`; `plans/` carries `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` and the `sprints/`, `releases/`, `epics/`, `features/`, `tickets/` directories. Every artifact this line names exists in the seed the installer walks.

```
- `memory-bank/*` — the agent-maintained working memory: read on start; `60-progress.md` is the running plan-of-record, `50-decisions/` holds ADRs, plus project brief, product, architecture, contributing, runbook, glossary.
- `plans/*` — the delivery state: `board.md` (status), `traceability.md` (requirement→ticket→code→test→UAT→release), `nfr-catalog.md`, plus `sprints/`, `releases/`, `epics/`, `features/`, `tickets/`.
```

### C-28-021

- file: agent-factory/README.md
- line: 4-6
- kind: architecture
- depends_on: —
- status: false
- mechanism: `handoff packets` names the seventeen static templates deleted in Phase 24; `agent-factory/handoffs/` now holds only `.gitkeep`. This is the hit `scripts/check-public-docs-vocabulary.js` already reports at `agent-factory/README.md:4` against the `handoff packet` literal in `scripts/dead-vocabulary.ts`, and it is the one occurrence in this file that a grep CAN hold.
- disposition: fixed
- finding_id: F-28-206

```
grugops is a file-based **agent factory** for software delivery. It is a small kit of
markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible
Kanban/Sprint board, and a traceability trail — that drops on top of a coding-agent CLI you
```

### C-28-022

- file: agent-factory/README.md
- line: 8-11
- kind: architecture
- depends_on: —
- status: false
- mechanism: The arrow chain `business analysis → product → … → release` describes the linear relay v2.0 replaced with decompose→enqueue over a shared queue. Measured against `AGENTS.md:21` and `agent-factory/roles/orchestrator.md:88`, which state the shipped architecture. D-10 records that this specific claim cannot be held by any grep, because `routes` is still-correct English at three live sites; it is registry material by construction.
- disposition: fixed
- finding_id: F-28-207

```
already use. One **Orchestrator** routes work through the full software-delivery lifecycle
(business analysis → product → system analysis → architecture → engineering → QE/E2E →
security/NFR/compliance → UAT → release), while a few single-job "grug" agents execute
within hard limits. The intelligence lives in the host coding agent; grugops only supplies
```

### C-28-023

- file: agent-factory/README.md
- line: 13-14
- kind: safety
- depends_on: autonomy, production_requires_human_confirmation, protected_branch_merge
- status: overstated
- mechanism: THIS IS D-19 ITEM 4 AND `docs/audit/28-residual-sizing.md` TABLE ROW 4 BECOMING A REGISTRY ROW. Measured three ways. (1) `factory.config.json` `autonomy: "pr"` — agents stop at a pull request and a named human merges; `production_requires_human_confirmation: true`. (2) `hooks/guard.ts` makes the deploy half mechanical rather than prompt-only, and refuses agent self-approval of `GRUGOPS_PROD_DEPLOY_APPROVED`. (3) The word that fails is `always`: `hooks/hooks.json` wires the guard as a PLUGIN-level hook and `install/install.ts:1571` states it is Claude-Code-only, and `.planning/PROJECT.md` records an irreducible same-uid / no-hook / direct-filesystem forgery residual — an agent running as the same uid with no hook can write the filesystem directly, and no in-process mechanism can prevent it. Backstopped by the `autonomy=pr` floor, which is why the claim is overstated rather than false.
- disposition: accepted
- finding_id: F-28-208

```
the role, the guardrail, the memory, the state, the dial, the proof, and the gates. Humans
always hold merge and deploy.
```

### C-28-024

- file: agent-factory/README.md
- line: 19
- kind: architecture
- depends_on: —
- status: true
- mechanism: `agent-factory/roles/orchestrator.md` exists; the quoted start-here instruction names `.grugops/factory.config.json` and `plans/board.md`, both of which the installer seeds from `agent-factory/seed/`.

```
**All work starts at `agent-factory/roles/orchestrator.md`.** Tell your coding agent:
```

### C-28-025

- file: agent-factory/README.md
- line: 25-27
- kind: architecture
- depends_on: —
- status: true
- mechanism: Each named step is present in `agent-factory/roles/orchestrator.md`: the config read, the classification, the WIP-limit respect, the role activation, the requirement to publish typed notes into the shared verified context (Workflow 16), and the board/traceability update. `publish typed notes into the shared verified context` is the corrected v2.0 wording, not the deleted relay.

```
The Orchestrator reads the config, classifies your request, respects the board's WIP limits,
activates the right specialist roles, requires each to publish typed notes into the shared
verified context, updates the board and traceability, and produces the next action.
```

### C-28-026

- file: agent-factory/README.md
- line: 30-35
- kind: architecture
- depends_on: —
- status: true
- mechanism: `AGENTS.md` ships at the repository root; `agent-factory/roles/` holds 18 role files and `agent-factory/workflows/` holds 19 workflow files, which are the frozen paths this note names. `works everywhere` is measured as the minimal markdown-copy path documented in `install/README.md` §1, which requires no scripts and no host-specific adapter.

```
> **Note:** The portable root `AGENTS.md` substrate — the other entry point most host tools
> read automatically — ships now at the repo root, so most tools can pick up grugops from
> `AGENTS.md` directly; pointing your agent at `agent-factory/roles/orchestrator.md` as shown
> above works everywhere. The role prompts ship under `agent-factory/roles/` and the workflow
> bodies under `agent-factory/workflows/`; this guide documents how to use them and the frozen
> paths they live at.
```

### C-28-027

- file: agent-factory/README.md
- line: 40-43
- kind: architecture
- depends_on: —
- status: false
- mechanism: CARRIED-IN CANDIDATE, RE-MEASURED RATHER THAN TRANSCRIBED. `The roles, the handoffs, and the gates are identical everywhere` names `handoffs` as a thing that still exists and is shipped identically; `agent-factory/handoffs/` holds only `.gitkeep`, so the sentence asserts sameness of a deleted artifact class. `scripts/check-public-docs-vocabulary.js` deliberately did NOT flag this line — the bare word `handoffs` is not a `RETIRED_PROSE_FORMS` literal and D-10 forbids widening the matcher to chase it — which is precisely why it is a registry row.
- disposition: fixed
- finding_id: F-28-209

```
grugops works on Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
handoffs, and the gates are identical everywhere. The only difference is whether the host
tool can *spawn* sub-agents or must *load* role files into context one at a time.
```

### C-28-028

- file: agent-factory/README.md
- line: 46-52
- kind: architecture
- depends_on: —
- status: overstated
- mechanism: CARRIED-IN CANDIDATE, RE-MEASURED RATHER THAN TRANSCRIBED. The table's Claude Code row advertises `Coordinator spawns role agents — the coordinator: true adapter holds the grant`. What holds: `.planning/REQUIREMENTS.md` records SPAWN-01 `[x]` (all 17 adapters exist, generated) and SPAWN-02 `[x]` (byte-gated). What does NOT hold: KIT-03, SPAWN-03 and SPAWN-04 are all still `[ ]`, and SPAWN-03's own text states that the current subagent placement makes the grant a no-op. `28-CONTEXT.md` records that Phase 27 closed by named user override rather than by a verification round. The grant exists; the spawn path's correctness is advertised ahead of its verification. Registered whole-table because an anchor between two pipe rows would split the rendered table.
- disposition: accepted
- finding_id: F-28-210

```
| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`)             | Coordinator spawns role agents — the `coordinator: true` adapter holds the grant |
| **Codex CLI**         | `AGENTS.md` (root + nested, global)              | Sequential role-load — no spawn                          |
| **Gemini CLI**        | `GEMINI.md` (or `AGENTS.md` via `context.fileName`) | Sequential role-load — no spawn                       |
| **OpenCode**          | `AGENTS.md` (+ its agent config)                 | Sequential role-load (or its own native agents)          |
| **GitHub Copilot CLI**| `AGENTS.md` (+ `.github/copilot-instructions.md`)| Sequential role-load — no spawn                          |
```

### C-28-029

- file: agent-factory/README.md
- line: 55-58
- kind: architecture
- depends_on: —
- status: false
- mechanism: `same handoffs` at line 49 asserts parity of the deleted artifact class, the same defect as C-28-027 at a second location in the same file. The spawn-versus-load distinction the passage draws is otherwise correct and matches `orchestrator.md:88`'s `PARALLEL where Agent is available; SEQUENTIAL where it is not`.
- disposition: fixed
- finding_id: F-28-211

```
On Claude Code the coordinator (the `coordinator: true` orchestrator adapter) spawns a role
agent when it would otherwise "wake" that role. On the four non-spawning CLIs the Orchestrator
is a single agent that *loads the relevant role file into context* at that moment. Same roles,
same handoffs, same gates — only the dispatch differs.
```

### C-28-030

- file: agent-factory/README.md
- line: 61-64
- kind: install
- depends_on: —
- status: true
- mechanism: `install/install.ts` lays down `.claude/agents/` role adapters, `.claude/skills/` dash-standalone skills, `skills/` plugin skills, and the per-tool entry-file pointers; `agent-factory/packaging/` carries the three templates (`adapters.md`, `slash-command.template.md`, `subagent.frontmatter.md`) they are generated from. The adapters ship now, as the sentence says.

```
The detailed per-tool **adapters** (thin wrappers, slash commands, entry-file pointers, and
the Claude Code plugin form) ship now — the installer (`node install/install.js`) lays them
down. This table is the usage overview; the adapters are the mechanical conveniences layered
on top.
```

### C-28-031

- file: agent-factory/README.md
- line: 69-74
- kind: install
- depends_on: —
- status: true
- mechanism: The `byte-identical` absolute was measured with `cmp agent-factory/seed/.grugops/factory.config.json agent-factory/config/factory.config.json` — identical, exit 0 (2026-08-12). `agent-factory/config/factory.config.md` exists as the field reference. `install/install.ts` walks `seed/**` into the target's `.grugops/`.

```
At runtime the Orchestrator reads the per-repo config dial at `.grugops/factory.config.json`.
The kit ships the lean default as the **seed source** at `agent-factory/seed/.grugops/factory.config.json`
(the installer walks `seed/**` and seeds it into the target's `.grugops/`; D-01/D-02). A
byte-identical copy lives at `agent-factory/config/factory.config.json` as the field-reference
companion to `agent-factory/config/factory.config.md`. The config is visible and editable —
change a value, change the factory's behavior.
```

### C-28-032

- file: agent-factory/README.md
- line: 77-80
- kind: safety
- depends_on: autonomy
- status: overstated
- mechanism: The baseline triple holds exactly: `factory.config.json` carries `mode: "lean"`, `cadence: "kanban"` and `autonomy: "pr"`. THE OVERSTATEMENT IS THE CAUSAL CLAUSE `because every role falls back to these same documented defaults when the file is absent`: a grep across all 18 role files finds ZERO stating a when-absent fallback, and `agent-factory/config/factory.config.md:3` scopes role honouring to `when it is present`. The defaults are documented in one place and no role is instructed to fall back to them. This is the same defect as C-28-012, stated more strongly here.
- disposition: deferred
- finding_id: F-28-212
- target_phase: 29

```
The **zero-config baseline** is `mode=lean`, `cadence=kanban`, `autonomy=pr`. grugops runs
lean with no config at all, because every role falls back to these same documented defaults
when the file is absent. Edit the dial to scale up to enterprise governance (scrum cadence,
compliance regimes, release gates) on a single flag.
```

### C-28-033

- file: agent-factory/README.md
- line: 85-94
- kind: architecture
- depends_on: —
- status: overstated
- mechanism: Three assertions, measured separately. The board HOLDS — `agent-factory/seed/plans/board.md` ships WIP-limited columns and `factory.config.json` `wip_limits` names all ten. Traceability HOLDS — `agent-factory/seed/plans/traceability.md` ships with the requirement→ticket→code→test→UAT→release row shape. THE LIFECYCLE BULLET DOES NOT: `the Orchestrator routes each request through the relevant stages (analysis → design → engineering → QE → security/NFR → UAT → release)` is the SAME arrow-chain relay narration D-10 names, measured against `AGENTS.md:21` and `orchestrator.md:88`. It is `overstated` rather than `false` because the hedge `relevant stages` and the clause that immediately follows — each role pulls the shared verified context and publishes typed notes back into it (Workflow 16) — are the correct v2.0 flow, so the sentence is directionally right while its arrow chain still narrates a sequential pass. FOUND BY THE ANCHOR PASS, NOT BY THE TASK-1 READ: this bullet is a third D-10 site that neither the drift guard nor the initial claim sweep reached. Registered as one slice because an anchor between two list items would split the rendered list.
- disposition: fixed
- finding_id: F-28-214

```
- **The board** — `plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — `plans/traceability.md` is the audit trail: one row per requirement,
  linking requirement → ticket → code → test → UAT → release, so every shipped change is
  accountable end to end.
- **The lifecycle** — the Orchestrator routes each request through the relevant stages
  (analysis → design → engineering → QE → security/NFR → UAT → release); each role pulls the
  shared verified context and publishes typed notes back into it (Workflow 16), so the next
  role inherits exactly what it needs.
```

### C-28-034

- file: agent-factory/README.md
- line: 135-137
- kind: install
- depends_on: —
- status: true
- mechanism: `install/README.md` §1 documents the minimal markdown-copy path and it requires no scripts; `AGENTS.md` and `agent-factory/` are both copyable in isolation, and `agent-factory/roles/orchestrator.md` is the start-here file the quoted instruction names. `That is the floor — no scripts required` is the same floor `CLAUDE.md` states for the Node-free path.

```
The minimal "just install the markdown" path works for any tool: copy the portable
`AGENTS.md` and the `agent-factory/` folder into your repo, then tell the agent *"start at
`agent-factory/roles/orchestrator.md`."* That is the floor — no scripts required.
```

### C-28-035

- file: agent-factory/README.md
- line: 140-142
- kind: install
- depends_on: —
- status: true
- mechanism: One installer ships (`install/install.ts` + committed `install.js`); `DRY_RUN` is honoured at 37 sites; `install/uninstall.ts` is the reversal; `install/install.test.ts` carries the idempotence cases. `Node 22+ is a prerequisite` matches the documented hard prerequisite in `CLAUDE.md` and is scoped correctly to `the scripted path`.

```
For per-tool conveniences (thin sub-agent wrappers, a slash command, entry-file pointers, and
the Claude Code plugin form), grugops ships a single idempotent, additive, dry-run-capable,
reversible installer. **Node 22+ is a prerequisite** for the scripted path:
```

### C-28-036

- file: agent-factory/README.md
- line: 149-151
- kind: install
- depends_on: —
- status: true
- mechanism: All seven named flags were grepped in `install/install.ts` and all seven are present: `--target` (8 sites), `--yes` (5), `DRY_RUN` (37), `--symlink` (3), `--migrate` (17), `--update` (20), `--prune-old-kit` (13). `install/README.md` exists at the linked path.

```
See **[`install/README.md`](../install/README.md)** for the full flag set (`--target`,
`--yes`, `DRY_RUN`, `--symlink`, `--migrate`, `--update`, `--prune-old-kit`) and the two-root
kit/state layout.
```

### C-28-037

- file: agent-factory/README.md
- line: 154-156
- kind: install
- depends_on: —
- status: true
- mechanism: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both ship, and `skills/` carries the seven colon-namespaced operations. The sentence marks its own uncertainty with `UNKNOWN - verify` rather than asserting install commands this repository cannot verify offline — which is the honesty rule `AGENTS.md:40` states, honoured.

```
The Claude Code plugin form (colon-namespaced `/grugops:<op>` commands) installs from the
marketplace; its exact install commands move with the plugin schema, so confirm them against
current tool docs — `UNKNOWN - verify`.
```
### C-28-038

- file: .claude-plugin/plugin.json
- line: 4
- kind: safety
- depends_on: autonomy, production_requires_human_confirmation, protected_branch_merge
- status: false
- mechanism: ADJUDICATED AS A CLAIM AND REGISTERED, WITH ITS FRESHNESS RESIDUAL NAMED — see the section below. The manifest `description` is public and shipped: it is what a user reads in the plugin manager. It carries the SAME two defects measured at C-28-001 and C-28-010. `The Orchestrator routes work through the full lifecycle` is the linear relay v2.0 replaced with decompose→enqueue (`AGENTS.md:21`, `orchestrator.md:88`), and `humans always hold merge and deploy` carries the overstatement measured in full at C-28-023. Status takes the worse of the two.
- disposition: deferred
- finding_id: F-28-213
- target_phase: 28-05

```
  "description": "grugops — a file-based agent factory for disciplined software delivery. The Orchestrator routes work through the full lifecycle; humans always hold merge and deploy.",
```

## The unanchorable claim — `.claude-plugin/plugin.json`

C-28-038 above is registered like every other row and is **excluded from the D-16 bijection by
construction**, because a JSON file cannot carry an HTML comment. Its freshness is held by the
registry row alone.

**This is an honest gap, recorded, not a reason to leave the claim unregistered.** The file is
public and shipped: it is the manifest a user installs from the marketplace, and its `description`
carries the *same* linear-pipeline claim C-28-001 and C-28-010 measure false. Concretely, the
residual is this: if plan 28-05 rewrites `README.md:4` and forgets `plugin.json`, the verbatim gate
catches the README and says nothing about the manifest. The gate prints the count of unanchorable
rows in its PASS line for exactly that reason — so the exclusion is visible on every run rather than
silent.

## Two-sided completeness (D-14)

Every safety floor has at least one claim mapped to it, and every `kind: safety` claim names at
least one floor. Both directions are asserted at run time by `scripts/check-claim-anchors.js`; the
lists below are the same fact in a form a reader can check.

| Floor | Held by | Claims mapped to it |
|---|---|---|
| `autonomy` | `factory.config.json` `autonomy` (live value `pr`) | C-28-001, C-28-010, C-28-023, C-28-032, C-28-038 |
| `test_integrity` | `factory.config.json` `quality.test_integrity` (live value `warn`) | C-28-018 |
| `production_requires_human_confirmation` | `factory.config.json` `production_requires_human_confirmation` (live value `true`) | C-28-001, C-28-010, C-28-018, C-28-023, C-28-038 |
| `protected_branch_merge` | **HARD LIMIT, no config key** — `hooks/guard.ts`'s protected-branch push patterns | C-28-001, C-28-010, C-28-018, C-28-023, C-28-038 |

**A declared safety rule with no floor, recorded rather than papered over.** `AGENTS.md:29` calls
the kit-versus-state block *"a resolution and safety rule, not a joke"*, and `AGENTS.md:31-34`
(C-28-015) asserts that `agent-factory/…` is **NEVER written**. No member of `SAFETY_FLOORS` holds
that rule, so C-28-015 is registered `kind: architecture` — because `depends_on` may only name a
floor, and a fifth floor cannot be invented here: `scripts/audit-model.test.ts` pins
`SAFETY_FLOORS.length` two-sided at 4. **The consequence is concrete: Phase 30's claim-dropping
filters to `kind: safety` and will therefore not reach the kit-write rule.** That is a real gap in
the join, and it is written here rather than resolved by mislabelling a row.

## Findings (AUDIT-01), and why they are not Table B rows

Every row whose `status` is not `true` carries a `disposition` and a `finding_id`. Fourteen rows
qualify — 6 `false` and 8 `overstated` out of 38.

| Finding | Claim | Status | Disposition | Where it is answered |
|---|---|---|---|---|
| F-28-201 | C-28-001 | false | fixed | 28-05 — `README.md` drift rewrite |
| F-28-202 | C-28-003 | overstated | deferred → 29 | the grug voice has drifted out of all 18 caveman blocks; Phase 29 rebuilds the voice guard |
| F-28-203 | C-28-010 | false | fixed | 28-05 — `AGENTS.md:5` contradicts `AGENTS.md:21` |
| F-28-204 | C-28-012 | overstated | deferred → 29 | no role file states a when-absent config fallback |
| F-28-205 | C-28-018 | overstated | accepted | the mechanical guard is Claude-Code-plugin-only; residual named in the row |
| F-28-206 | C-28-021 | false | fixed | 28-05 — the `handoff packet` hit the drift guard already reports |
| F-28-207 | C-28-022 | false | fixed | 28-05 — the linear-pipeline claim |
| F-28-208 | C-28-023 | overstated | accepted | **D-19 item 4** — the irreducible same-uid / no-hook forgery residual |
| F-28-209 | C-28-027 | false | fixed | 28-05 — *"the roles, the handoffs, and the gates are identical everywhere"* |
| F-28-210 | C-28-028 | overstated | accepted | KIT-03 / SPAWN-03 / SPAWN-04 are still `[ ]` |
| F-28-211 | C-28-029 | false | fixed | 28-05 — *"same handoffs"* |
| F-28-212 | C-28-032 | overstated | deferred → 29 | *"every role falls back"* — measured at zero of 18 |
| F-28-213 | C-28-038 | false | deferred → 28-05 | the manifest `description` carries the same drift; **unanchorable**, so the verbatim gate cannot catch a missed flip — see the section above |
| F-28-214 | C-28-033 | overstated | fixed | 28-05 — a **third** D-10 arrow-chain site, in the § *How work flows* lifecycle bullet, that neither the drift guard nor the task-1 sweep reached |

**Why these are NOT rows in `docs/audit/28-disposition-register.md` Table B.** They cannot be.
`readRegister()` refuses a Table B row naming a file with no Table A row, and Table A is the
**derived** audit set — 17 roles + 19 workflows + the one out-of-set protocol file. `README.md`,
`AGENTS.md` and `agent-factory/README.md` are not members of it and cannot become members: Table A's
`kind` is a closed set of `role` \| `workflow` \| `protocol`, and adding public documents would
widen AUDIT-01's derived set inside the phase whose subject is maintained sets rotting. So the claim
findings live **here**, in the artifact that measured them.

**The id band is disjoint on purpose.** These use `F-28-2NN`. Plan 28-06 enters
`docs/audit/28-residual-sizing.md`'s `F-28-A`…`F-28-G` into Table B as `F-28-001`…`F-28-007`. One
canonical form `F-28-NNN`, two reserved bands, no second grammar — the `2NN` band belongs to the
claim registry and the `0NN` band to the disposition register, so no id can name two findings.

## What this registry does not catch (D-16)

**A brand-new claim written without an anchor is not mechanically detectable.** No grep recognizes an
assertive sentence: the difference between *"the installer is idempotent"* and *"the installer feels
tidy"* is semantic, and a matcher that tried to tell them apart would either miss claims or drown a
reader in prose. `UNKNOWN - verify`.

So be precise about what the gate proves. The bijection proves that **registered** claims have not
moved and that their text has not changed. It does **not** prove that no unregistered claim exists.
A Phase 29 rewrite that *adds* a new absolute to `README.md` passes this gate green.

Two further limits, named for the same reason:

- **A row can be structurally perfect and semantically wrong.** `readRegistry()` proves the shape of
  a row and the gate proves its text is still where it says; neither proves the `mechanism` was
  honestly measured. The measurements are recorded in prose beside each row so a later reader can
  re-run them, which is the only real check available.
- **The unanchorable row is outside the bijection.** See § *The unanchorable claim* above.

## Adjudicated as NOT a claim

Recorded so a later reader does not read an omission as an oversight.

| Text | Why it is not registered |
|---|---|
| `README.md` § *Acknowledgements* and the closing italic disclaimer | They assert facts about the project's **relationships and IP posture** — inspiration, non-affiliation, original artwork — not about what grugops does, guarantees, refuses or holds. Registering them would put a legal disclaimer into a set Phase 30 voids by lowering a safety floor, which is a category error. They are load-bearing and must not be removed; they are simply not this registry's subject. |
| `README.md:5` *"> grug keep it simple."* | A motto. Asserts nothing falsifiable. |
| `AGENTS.md` §§ *Coding rules (the 12)*, bullet text | Imperatives addressed to the agent, not assertions about grugops. The **count** claim introducing them (*"12 rules grouped under four principles"*) IS falsifiable and is registered as C-28-019. |
| `AGENTS.md:144` *"Stop. Write the open question…"* | An imperative. |
| `AGENTS.md` § *Commands* `UNKNOWN - verify` slots | Explicit non-claims by construction — the marker exists to say *nothing is being asserted here*. The rule governing them (`AGENTS.md:40`) is registered as C-28-017. |
| fenced code blocks in both READMEs | Not anchorable without rendering the anchor visibly; covered by the prose rows that introduce them. See § *One claim per anchorable region* item 3. |
