# Phase 28 — Claim Registry (AUDIT-03)

Every public claim in `README.md`, `AGENTS.md`, `agent-factory/README.md` and
`agent-factory/writing-profile.md`, given an id, mapped to the safety floor whose lowering would
falsify it, and measured against a named mechanism.

**42 rows as committed by plan 29-02** — 38 from Phase 28, plus C-28-039..C-28-042, the writing
profile's own four falsifiable claims about what it achieves. The id band is unchanged on purpose:
a second registry is the defect D-15 refused, and a document that asserts what it achieves is
exactly the class this registry exists to hold, whichever phase authored it.

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
- status: overstated
- mechanism: Three assertions in one hard-wrapped line, each measured separately, and the row takes the WORST of the three — which is why fixing two of them moves this row from `false` to `overstated` rather than to `true`. (1) `handoff packets` — was FIXED in 28-05; the phrase now reads `a shared verified context`, which is the artifact class that actually ships (`.grugops/context/<task>/notes/`, sole writer `scripts/context-io.ts`). (2) The linear arrow chain `business analysis → … → release` — was FIXED in 28-05; the sentence now states decompose-and-enqueue over a shared queue with the shared verified context as the only memory, matching `AGENTS.md:21` and `agent-factory/roles/orchestrator.md`'s § *Responsibilities* step 4 (`Decompose → enqueue → schedule → gate → sweep`) and its § *Hard limits* (`does NOT relay data between agents — the shared verified context is the only channel`). (3) `Humans always hold merge and deploy` — UNCHANGED and still overstated, for exactly the reason measured in full at C-28-023: the failing word is `always`, the mechanical guard is Claude-Code-plugin-only (`hooks/hooks.json`, `install/install.ts:1571`), and `.planning/PROJECT.md` records an irreducible same-uid / no-hook / direct-filesystem forgery residual. It is backstopped by the `autonomy=pr` floor, which is why it is overstated rather than false. Assertion (3) is ACCEPTED here on the same basis and with the same named residual as C-28-023 / F-28-208; it was deliberately not reworded, because C-28-023 registers the identical claim and is an `accepted` row this plan is not permitted to touch.
- disposition: accepted
- finding_id: F-28-201

```
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.
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
- status: true
- mechanism: All three halves now hold, and the third is measured rather than asserted. `one job` holds — every role file carries a `## One job` section, and Phase 29 rewrote all 17 to a single act of at most 20 words. `hard limits` holds — every role file carries a `## Hard limits` section, `orchestrator.md` states the coordinator width/claim caps there, and `guard_role_clause_uniqueness` reports `0 findings over 17/17 elements`, which is the observable half of the rule that a prohibition is stated in that section and nowhere else. `short words` — the grug-brained voice — is the half that failed in Phase 28 and it NOW HOLDS: `guard_caveman_voice` in `scripts/check-foundation-guards.ts` requires each role's fenced caveman block to carry at least `CAVEMAN_LEXICON_MIN` (2) distinct terms of the 16-term committed lexicon declared in `scripts/voice-model.ts` AND zero banned constructions (article, copula, modal, subordinator), and it reports `0 findings over 17/17 elements` with a published per-block measurement line — every block measures 3 to 5 distinct lexicon terms against the floor of 2, and 11 of the 17 blocks carry the literal token `grug` where the 2026-08-12 measurement found ZERO. The guard was watched failing RED on all 17 blocks in plan 29-01 before it was allowed to pass, so a green run from it is a measurement and not a construction. THE SET IS 17, NOT THE 18 FILES ON DISK: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `agent-factory/roles/_role-switch-protocol.md` is out of set for counting and correctly carries no caveman block — it is a protocol document rather than a role an agent is activated as, which makes its exclusion principled rather than incidental. A later reader who counts 18 markdown files under `agent-factory/roles/` must not correct this number back. The 17 blocks total 2,329 bytes of fence interior, down from 3,528 before the Phase 29 rewrite. The figure this row carried through Phase 28 was produced by a different extractor over 18 files, and no command in this tree reproduces it, so it is corrected rather than carried forward; the superseded value is recoverable from this file's history and is recorded in plan 29-07's summary. Reproduce the current figure with: `node -e 'const{readCavemanFence}=require("./.tmp-build/scripts/voice-model.js");const{listRoles}=require("./.tmp-build/scripts/kit-model.js");const fs=require("fs"),p=require("path");let t=0,n=0;for(const f of listRoles(".")){t+=Buffer.byteLength(readCavemanFence(fs.readFileSync(p.join("agent-factory/roles",p.basename(f)),"utf8")).inside,"utf8");n++}console.log(n,t)'` — it prints `17 2329`. WHAT THIS ROW STILL DOES NOT CLAIM, `UNKNOWN - verify`: that the voice is *effective*. It is measured against a committed lexicon and a closed banned-construction set, and nothing here asserts a token, comprehension or model-behaviour benefit — see C-28-042.

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
- status: overstated
- mechanism: Two assertions, and the row takes the worse of them. (1) The self-contradiction is FIXED in 28-05: this line now states `decomposes each request into subtasks and enqueues them on a shared queue`, which is the same fact `AGENTS.md:21` states as `the Orchestrator sequences by decompose→enqueue`. The two lines agreed nowhere before and agree exactly now. (2) `Humans decide; agents execute` is UNCHANGED and still carries the overstatement measured in full at C-28-023 — the mechanical guard is Claude-Code-plugin-only and the same-uid / no-hook forgery residual is irreducible. Accepted here on the same basis and with the same named residual as C-28-023 / F-28-208. The motto is the project's own framing of the `autonomy=pr` floor and was deliberately not reworded; the residual is recorded rather than papered over.
- disposition: accepted
- finding_id: F-28-203

```
This repo runs a file-based agent factory for software delivery. One Orchestrator (the head grug) decomposes each request into subtasks and enqueues them on a shared queue; a few single-job grug agents claim that work and execute within hard limits. The role is the intelligence. The workflow is the guardrail. The shared verified context is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.
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
- status: true
- mechanism: `the dial (mode, cadence, autonomy, WIP limits)` holds — all four keys are present in `agent-factory/config/factory.config.json`. `Runs lean with documented defaults when absent` NOW HOLDS TOO. The defaults are documented (`agent-factory/config/factory.config.md` carries a per-field lean-default column, and `agent-factory/README.md` § Configuration carries the public statement registered as C-28-032), and Phase 29 added one when-absent fallback sentence to the `## Reads` section of every in-set role file, reading "With no config file present, this role runs lean on the documented defaults in agent-factory/README.md." So the fallback now rests on a role instruction rather than on an agent inferring it. Measured at 17 of 17 by two independent methods — `grep -lc` in forced text mode, and a Node directory walk using `String.includes` — where the 2026-08-12 measurement was ZERO. THE DENOMINATOR IS 17, NOT THE 18 FILES ON DISK: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `agent-factory/roles/_role-switch-protocol.md` is out of set for counting; it is a protocol document rather than a role an agent is activated as, and it reads no config, so its exclusion is principled rather than incidental. A later reader who counts 18 markdown files under `agent-factory/roles/` must not correct this number back. RESIDUAL, `UNKNOWN - verify`: the sentence is an instruction in every role file, and no gate asserts that an agent reading it actually behaves that way at run time.

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
- status: true
- mechanism: FIXED in 28-05. `handoff packets` named the seventeen static templates deleted in Phase 24 and was the one occurrence in this file a grep COULD hold — the hit `scripts/check-public-docs-vocabulary.js` reported at `agent-factory/README.md:5` against the `handoff packet` literal in `scripts/dead-vocabulary.ts`. The phrase now reads `a shared verified context`, measured against the artifact that ships: `.grugops/context/<task>/` with `notes/` as the source of truth and `index.md` / `index.jsonl` as derived renders, sole sanctioned writer `scripts/context-io.ts`, schema `agent-factory/contracts/context-note.md`. Every other item the sentence lists was re-verified unchanged — `agent-factory/roles/` (18 files), `agent-factory/workflows/` (19), `agent-factory/checklists/`, `agent-factory/config/factory.config.json`, `agent-factory/seed/plans/board.md` and `traceability.md` all ship. The gate now reports zero hits in this file.

```
grugops is a file-based **agent factory** for software delivery. It is a small kit of
markdown — role prompts, workflows, a shared verified context, checklists, a config dial,
a visible Kanban/Sprint board, and a traceability trail — that drops on top of a coding-agent CLI you
```

### C-28-022

- file: agent-factory/README.md
- line: 8-11
- kind: architecture
- depends_on: —
- status: true
- mechanism: FIXED in 28-05. The arrow chain `business analysis → product → … → release` described the linear relay v2.0 replaced, and D-10 records that no grep can hold it because `routes` is still-correct English at three live sites — it was registry material by construction. The passage now states decompose-and-enqueue over a shared queue, with the roles named as a comma list of what the Orchestrator draws on rather than as a chain it walks, and it states the non-relay invariant explicitly. Measured against `agent-factory/roles/orchestrator.md` § *Responsibilities* step 4 (`Decompose → enqueue → schedule → gate → sweep (the spine)` — subtasks enqueued as thin `pending/` files holding only a `ref:`) and § *Hard limits* (`does NOT relay data between agents — the shared verified context is the only channel`), and against `AGENTS.md:21`. The verb `routes` was NOT removed from the repository: D-10's three live sites are untouched.

```
already use. One **Orchestrator** decomposes each request into subtasks and enqueues them on
a shared queue, drawing on whichever specialist roles the work needs (business analysis,
product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT,
release), while a few single-job "grug" agents claim that work and execute within hard
limits. No agent hands data to another — the shared verified context is the only channel.
The intelligence lives in the host coding agent; grugops only supplies
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
- status: true
- mechanism: FIXED in 28-05. The sentence asserted sameness of a DELETED artifact class — `handoffs` — and `scripts/check-public-docs-vocabulary.js` deliberately could not flag it, because the bare word is not a `RETIRED_PROSE_FORMS` literal and D-10 forbids widening the matcher to chase it. The noun is now `workflows`, and the parity assertion is measured against what actually ships identically: `agent-factory/roles/` and `agent-factory/workflows/` are copied whole to the kit root of every install by `install/install.ts`'s `cpSync` of the `agent-factory` tree, so no host tool receives a different role or workflow body. The companion clause `only the dispatch differs, never the content` is held mechanically by `scripts/generate-skill-twins.ts` and `npm run freshness:skill-twins` (see C-28-007). The spawn-versus-load sentence that follows is unchanged and independently correct against `orchestrator.md` § *Hard limits*.

```
grugops works on Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
workflows, and the gates are identical everywhere. The only difference is whether the host
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
- status: true
- mechanism: FIXED in 28-05. `same handoffs` asserted parity of the deleted artifact class — the same defect as C-28-027, at a second location in the same file, which is why both had to move together. The clause now reads `same workflows, same gates, same shared verified context`, naming the memory channel that replaced the relay rather than the relay itself; the parity is measured against the same `cpSync` of the whole `agent-factory` tree that C-28-027 cites. The spawn-versus-load distinction the passage draws was already correct and is unchanged — it matches `orchestrator.md` § *Hard limits*: `PARALLEL where Agent is available; SEQUENTIAL where it is not (concurrency-1, same queue, degrade-never-break)`.

```
On Claude Code the coordinator (the `coordinator: true` orchestrator adapter) spawns a role
agent when it would otherwise "wake" that role. On the four non-spawning CLIs the Orchestrator
is a single agent that *loads the relevant role file into context* at that moment. Same roles,
same workflows, same gates, same shared verified context — only the dispatch differs.
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
- status: true
- mechanism: The baseline triple holds exactly: `factory.config.json` carries `mode: "lean"`, `cadence: "kanban"` and `autonomy: "pr"`. THE CAUSAL CLAUSE `because every role falls back to these same documented defaults when the file is absent` was the overstatement, and it NOW HOLDS: Phase 29 added one when-absent fallback sentence to the `## Reads` section of every in-set role file, reading "With no config file present, this role runs lean on the documented defaults in agent-factory/README.md." — and it points at the § Configuration section of this same document, which is where this claim lives. Measured at 17 of 17 by two independent methods (`grep -lc` in forced text mode and a Node directory walk using `String.includes`), where the 2026-08-12 measurement was ZERO. The word `every` in the claim is therefore satisfied over the set the kit actually activates. THE DENOMINATOR IS 17, NOT THE 18 FILES ON DISK: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `agent-factory/roles/_role-switch-protocol.md` is out of set for counting; it is a protocol document rather than a role an agent is activated as, and it reads no config, so its exclusion is principled rather than incidental. A later reader who counts 18 markdown files under `agent-factory/roles/` must not correct this number back. This is the same mechanism as C-28-012, stated more strongly here, and the two rows close together. RESIDUAL, `UNKNOWN - verify`: no gate asserts that an agent reading the instruction behaves that way at run time.

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
- status: true
- mechanism: FIXED in 28-05. Three assertions, measured separately. The board HOLDS, unchanged — `agent-factory/seed/plans/board.md` ships WIP-limited columns and `factory.config.json` `wip_limits` names all ten. Traceability HOLDS, unchanged — `agent-factory/seed/plans/traceability.md` ships with the requirement→ticket→code→test→UAT→release row shape (that arrow chain is a TABLE ROW SHAPE, not a routing order, and was correctly left standing). THE LIFECYCLE BULLET WAS THE DEFECT and is the one that moved: it narrated `the Orchestrator routes each request through the relevant stages (analysis → design → … → release)`, the third D-10 arrow-chain site, found by the anchor pass and reached by neither the drift guard nor the task-1 read. It now states decompose-and-enqueue for `whichever stages the work actually needs`, adds the claim step, and closes on `never a relay from the role before it` — measured against `orchestrator.md` § *Responsibilities* step 4, `agent-factory/workflows/17-task-claim.md` (the pending → claimed → done transitions and `Coordination is ONLY through the on-disk substrate — never relay data agent-to-agent`), and `agent-factory/workflows/16-context-read-write.md` (pull-before-act, publish-after-verify). The already-correct Workflow 16 clause is retained verbatim. Registered as one slice because an anchor between two list items would split the rendered list.

```
- **The board** — `plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — `plans/traceability.md` is the audit trail: one row per requirement,
  linking requirement → ticket → code → test → UAT → release, so every shipped change is
  accountable end to end.
- **The lifecycle** — the Orchestrator decomposes each request into subtasks and enqueues
  them for whichever stages the work actually needs (analysis, design, engineering, QE,
  security/NFR, UAT, release); each role claims its subtask, pulls the shared verified
  context and publishes typed notes back into it (Workflow 16), so the next role inherits
  exactly what it needs — never a relay from the role before it.
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
- status: overstated
- mechanism: ADJUDICATED AS A CLAIM AND REGISTERED, WITH ITS FRESHNESS RESIDUAL NAMED — see the section below. The manifest `description` is public and shipped: it is what a user reads in the plugin manager. It carried the SAME two defects measured at C-28-001 and C-28-010, and the deferral named 28-05 as its target because no gate can reach it. THE DEFERRAL WAS DISCHARGED IN 28-05, BY HAND, IN THE SAME COMMIT AS THE FOUR ANCHORED DOCUMENTS. (1) `The Orchestrator routes work through the full lifecycle` — FIXED; the description now states decompose-and-enqueue on a shared queue with the shared verified context as the only memory between roles, matching `AGENTS.md:21` and `orchestrator.md` § *Responsibilities* step 4. (2) `humans always hold merge and deploy` — UNCHANGED and still overstated for the reason measured in full at C-28-023; accepted here on the same basis and with the same named residual as C-28-023 / F-28-208. The row therefore takes the worse of the two and lands `overstated`, not `true`. `.claude-plugin/plugin.json` was re-parsed as JSON after the edit and remains well formed.
- disposition: accepted
- finding_id: F-28-213

```
  "description": "grugops — a file-based agent factory for disciplined software delivery. The Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, with a shared verified context as the only memory between roles; humans always hold merge and deploy.",
```

### C-28-039

- file: agent-factory/writing-profile.md
- line: 158-164
- kind: architecture
- depends_on: —
- status: true
- mechanism: Three assertions about grugops's own IP posture, each measured separately. (1) NO SPECIFICATION TEXT WAS AVAILABLE TO REPRODUCE, and the evidence is first-hand: `pdftotext -f 1 -l 14` against the official ASD-STE100 Issue 9 distribution returns `Permission Error: Copying of text from this document is not allowed.` — the publisher's own machine-readable copy-text permission bit — and NO attempt was made to bypass it (29-RESEARCH §C-2, command output 2026-08-13). A project whose value proposition is the trace does not circumvent a rights holder's technical measure to author a document about honest claims. (2) NO PART OF THE CONTROLLED DICTIONARY IS INCLUDED: the profile adopts no general word list at all — the one set it names, the approved step verbs, is grugops-authored and seeded from verbs this repository's own procedural steps already use in bare imperative position (29-RESEARCH §B-2), and the rule table's ten entries are written in grugops's own words against this repository's own measured corpus. (3) THE NOT-AFFILIATED / NOT-CERTIFIED HALF is the position ASD and STEMG publish themselves — `ASD and the STEMG DO NOT endorse or certify any company, organization, or individual that sells tools claimed to be 'fully compliant' with ASD-STE100` (asd-ste100.org/STE_faq.html) — so the denial restates the rights holder's own statement rather than asserting anything about it. It is modelled on this project's existing house wording at `NOTICE:4-7`. The 53-rules / Issue 9 / January 2025 citation is a widely published fact about the standard (asd-ste100.org/about_STE.html), not an extract from it, and it corrects the `~65 rules` figure this project's older planning prose carried.

```
The grugops writing profile is an independent work, authored by grugops. It is **derived from** the
ideas of ASD-STE100 Simplified Technical English Issue 9, and it is **not** ASD-STE100. grugops is
not affiliated with, sponsored by, endorsed by, or certified by ASD (Aerospace, Security and Defence
Industries Association of Europe) or the Simplified Technical English Maintenance Group (STEMG), and
neither body endorses or certifies any software tool. **No part of the ASD-STE100 specification text
is reproduced here, in whole or in part, and no part of its controlled dictionary is included,
vendored or redistributed.** The rules above are grugops's own, written for this kit.
```

### C-28-040

- file: agent-factory/writing-profile.md
- line: 94-96
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured 2026-08-13 over the profile document: it contains ZERO of the 17 role display names and ZERO of the 19 workflow display names that the derivation commands named in the same section return (`grep -h '^# Role: ' agent-factory/roles/*.md` and `grep -h '^# Workflow: ' agent-factory/workflows/*.md`). The three apparent config-key matches — `mode`, `quality`, `context` — are substrings of ordinary English words in the surrounding prose (`model`, `quality/trace surface`, `shared verified context`), not pasted list members. The section states the set by COMMAND and enumerates it nowhere, which is what makes the claim checkable: re-running the commands is the check, and a pasted copy would be visible as a literal list.

```
The project set is **derived, never listed**. Pasting the members into this document would create the
stale copy this milestone exists to eliminate: the document would keep reading as authoritative while
the kit moved underneath it.
```

### C-28-041

- file: agent-factory/writing-profile.md
- line: 32-37
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured 2026-08-13 on the document itself. `grep -oE 'WP-[0-9]{2}' agent-factory/writing-profile.md | sort -u` returns 10 ids, contiguous WP-01..WP-10; `grep -cE 'WP-[0-9]{2}.*(decidable|advisory)'` returns 10, so every id carries exactly one mark and no id is unmarked. The claim asserts what the MARK MEANS and states outright that `guard_imperative_lexicon` and `guard_sentence_form` land later in this same phase — so it does not assert a check that has not been performed, which is why this row is `true` rather than `overstated`. When plan 29-03 lands those two guards, the sentence about them becomes a statement about a live build and this row's mechanism gains a command; the sentence itself needs no rewrite, which is the point of phrasing it against the build rather than against an intention.

```
Each rule is marked **decidable** or **advisory** in the table below, and the mark is the whole of
the promise. A decidable rule is one a gate can decide; an advisory rule is checked by a human at
review and by nothing else. The gates that decide the decidable subset are `guard_imperative_lexicon`
and `guard_sentence_form`, and they land with the corpus rewrite in this same phase — until they do,
the decidable mark states which rules are gateable and not which rules are gated. `UNKNOWN - verify`
against the build rather than against this sentence.
```

### C-28-042

- file: agent-factory/writing-profile.md
- line: 175-179
- kind: architecture
- depends_on: —
- status: true
- mechanism: `node scripts/check-banned-claims.js` — exit 0 over 82 derived documents (73 kit markdown files + 10 public documents − 1 overlap), 20 pinned literals across 3 groups, one named exemption region asserted two-sided. The gate was watched FAILING first (D-44): exit 1 with 3 findings over 82 documents at commit 20982a0, exit 0 at commit 0fafbaf, with the gate itself byte-unchanged across the transition. Two of those three findings were NOT planted — the kit already claimed the caveman voice is a token economy applied to memory, which project measurement on 2026-07-28 disproved on this artifact. RECORDED RESIDUAL, carried in the gate's source and in the profile's own prose rather than claimed away: a brand-new conformance claim written without any pinned literal is not mechanically detectable (`UNKNOWN - verify`), and a pinned literal hard-wrapped across a line boundary is not matched — the answer to which is deliberately NOT to normalize whitespace before comparing.

```
**Conformance with ASD-STE100 is not claimed, not checked, and not implied. No token-economy win is
claimed. No comprehension benefit is claimed.** `guard_banned_claims` holds all three prohibitions
mechanically over the shipped kit and the public documents, and it was watched failing on a real
claim in a real file before it was allowed to pass. A green run from it says what it measured, and
says nothing about the standard.
```

### C-28-043

- file: agent-factory/writing-profile.md
- line: 247-250
- kind: architecture
- depends_on: —
- status: true
- mechanism: A CITATION AND A DENIAL, measured as two separate facts. (1) The 53-rules / nine-sections / Issue 9 / January 2025 figures are a widely published fact ABOUT the standard, taken from the rights holder's own public page (asd-ste100.org/about_STE.html) and cited as such; they are not an extract from the specification text, which is what makes the sentence a citation rather than a reproduction. (2) The no-bypass half denies rather than asserts, and its evidence is first-hand and negative: `pdftotext -f 1 -l 14` against the official Issue 9 distribution returns `Permission Error: Copying of text from this document is not allowed.` and NO attempt was made to defeat that bit (29-RESEARCH §C-2, command output 2026-08-13). THE MECHANISM THAT NOW HOLDS THESE BYTES is `scripts/check-claim-anchors.js`, which byte-compares this block against the document live, and `scripts/check-banned-claims.js`, which as of D-54 suppresses a banned-claim occurrence inside the one named exemption region ONLY on a line inside a registry-anchored block whose bytes still match this row. This block carries one `standard-name` occurrence; before D-54 those bytes were exempt by POSITION alone and any sentence could be substituted for them at equal count.

```
ASD-STE100 Issue 9 comprises 53 writing rules in nine sections and was published in January 2025.
That is a widely published fact about the standard, cited as such; it is not an extract from it. No
technical protection measure on any distribution of the specification was bypassed to write this
document.
```

### C-28-044

- file: agent-factory/writing-profile.md
- line: 253-254
- kind: architecture
- depends_on: —
- status: true
- mechanism: A REPORT MARKED `UNKNOWN - verify` AND EXPLICITLY NOT ADOPTED. The sentence attributes a trademark-registration report to a third party, marks it unverified against the register, and then states that nothing here asserts it — so the measurement is that the row's own text refuses to make the claim it names, which is the honest form for a fact this project has not checked. No EU trademark register lookup was performed and the row does not claim one was. THE MECHANISM THAT NOW HOLDS THESE BYTES is `scripts/check-claim-anchors.js`'s live byte comparison plus D-54's frozen-block conjunction in `scripts/check-banned-claims.js`: this block carries one `standard-name` occurrence, and without the freeze the `UNKNOWN - verify` hedge could be replaced by a live assertion at the same occurrence count.

```
A third party reports that ASD-STE100 is a registered EU trademark. That report is `UNKNOWN - verify`
against the register, and nothing here asserts it.
```

### C-28-045

- file: agent-factory/writing-profile.md
- line: 281-282
- kind: architecture
- depends_on: —
- status: true
- mechanism: A DISPROOF RECORDED AS A DISPROOF, which is the strongest reason these particular bytes needed freezing. Project measurement on 2026-07-28 found the fenced caveman blocks RESTATE rather than compress — measured 58 bytes LONGER than the line each duplicates, at roughly 6% of role bytes — so the token-economy rationale this project once held is disproven ON THIS ARTIFACT and the sentence records that rather than restating it. THE MECHANISM THAT NOW HOLDS THESE BYTES is `scripts/check-claim-anchors.js`'s live byte comparison plus D-54's frozen-block conjunction in `scripts/check-banned-claims.js`. This block carries one `token-economy` occurrence, and it is the exact shape round 6's CR-01 reproduced: a denial of the token-economy claim, sitting inside the region, exchangeable before D-54 for a live assertion of that claim with `suppressed` unmoved at 14 and all seven gates green.

```
Caveman-as-token-economy is **disproven on this artifact by measurement** and must not be restated.
The measured finding stands: the fenced blocks restate rather than compress.
```

### C-28-046

- file: agent-factory/writing-profile.md
- line: 292-293
- kind: architecture
- depends_on: —
- status: true
- mechanism: AN ABSENCE-OF-EVIDENCE STATEMENT, measured as an absence rather than asserted as a negative result. No published study either supporting or refuting a comprehension benefit of controlled language for a language model was located (29-RESEARCH §A), so the kit ships neither direction and this sentence says so. The claim it makes is about GRUGOPS — that the kit does not ship the claim — which is checkable against the kit, and `scripts/check-banned-claims.js` is what checks it. THE MECHANISM THAT NOW HOLDS THESE BYTES is that same gate's D-54 frozen-block conjunction plus `scripts/check-claim-anchors.js`'s live byte comparison. This block carries two `comprehension` occurrences and is the second half of round 6's CR-01 reproduction: the comprehension denial was, before D-54, substitutable for a live comprehension claim at the same occurrence count inside the section whose stated purpose is to deny it.

```
There is no evidence that controlled language improves comprehension for a language model. The kit
does not ship that claim, and this profile does not make it.
```

## The unanchorable claim — `.claude-plugin/plugin.json`

C-28-038 above is registered like every other row and is **excluded from the D-16 bijection by
construction**, because a JSON file cannot carry an HTML comment. Its **position** is therefore
unheld. Its **text is not**: see *What changed after the 28 code review* below.

**This is an honest gap, recorded, not a reason to leave the claim unregistered.** The file is
public and shipped: it is the manifest a user installs from the marketplace, and its `description`
carried the *same* linear-pipeline claim C-28-001 and C-28-010 measured false. Concretely, the
residual was this: if plan 28-05 rewrites `README.md:4` and forgets `plugin.json`, the verbatim gate
catches the README and says nothing about the manifest. The gate prints the count of unanchorable
rows in its PASS line for exactly that reason — so the exclusion is visible on every run rather than
silent.

**What 28-05 did about it, recorded because nothing mechanical records it.** The named residual was
the whole reason this row existed, so 28-05 rewrote `.claude-plugin/plugin.json`'s `description`
in the SAME COMMIT as `README.md`, `AGENTS.md`, `CLAUDE.md` and `agent-factory/README.md`, and
verified it by hand rather than by gate: the manifest was re-parsed as JSON, and its `description`
was diffed against this row's verbatim block character for character.

**What changed after the 28 code review (WR-08), and what did not.** The paragraph above used to end
*"The residual is unchanged for the next editor. A future rewrite of `README.md:4` that forgets the
manifest will still pass every gate in this repository green."* **That sentence is no longer true,
and it is corrected here rather than left standing.** The exclusion's stated reason — a JSON file
cannot carry an HTML comment — justifies dropping the **anchor** requirement, and it never justified
dropping the **verbatim** requirement, which needs no anchor at all.
`scripts/check-claim-anchors.js` now **presence-checks** every unanchorable row: it reads the named
file as raw bytes and refuses when the row's verbatim block is not present in it, counting the row as
a performed comparison rather than merely printing its number. A future rewrite that forgets the
manifest now fails red.

**The residual that remains, stated precisely.** Presence is not position, and presence is not
uniqueness. The gate cannot say *where* in the file the text sits, and it cannot say that the file
carries no **second, contradicting** claim — the same limit the anchored rows have and this
registry's `## What this registry does not catch (D-16)` section already names. `UNKNOWN - verify`
whether a position check for JSON is worth having; it would need a path expression into the parsed
document rather than a line number, which is a different mechanism from the one this registry uses.

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

Every row whose `status` is not `true` carries a `disposition` and a `finding_id`. **As committed by
28-05, nine rows qualify — 0 `false` and 9 `overstated` out of 38; plan 29-02's four additions are
all `true`, so the figures stand at 9 of 42.** Five rows that 28-04 recorded
`false` are now `true`; three that 28-04 recorded `false` are now `overstated`, for the reason the
next paragraph names.

**Why three drift rows landed `overstated` and not `true`.** C-28-001, C-28-010 and C-28-038 are
each a hard-wrapped region carrying MORE THAN ONE assertion, and each row's own rule — stated in its
`mechanism` since 28-04 — is that it takes the WORST of them. 28-05 fixed the drift assertion in all
three. The remaining assertion in each is the *"humans always hold merge and deploy"* / *"humans
decide; agents execute"* absolute, which C-28-023 already measures `overstated` and disposes
`accepted` against an irreducible same-uid / no-hook forgery residual. Recording these three `true`
would have required either rewording a sentence C-28-023 registers as an `accepted` row this plan
must not touch, or asserting a status the row's own worst-of rule refuses. Both were declined. The
drift is fixed; the residual is named, and it is the same one residual in all four places.

| Finding | Claim | Status | Disposition | Where it is answered |
|---|---|---|---|---|
| F-28-201 | C-28-001 | overstated | accepted | 28-05 — `README.md` drift rewritten; the `always` residual is C-28-023's, named in the row |
| F-28-202 | C-28-003 | **true** | — | 29-07 — the voice was rebuilt across all 17 blocks and `guard_caveman_voice` reports `0 findings over 17/17 elements`, watched RED on all 17 in 29-01 first; CLOSED |
| F-28-203 | C-28-010 | overstated | accepted | 28-05 — `AGENTS.md:6` now agrees with `AGENTS.md:21`; the *"humans decide"* residual is C-28-023's |
| F-28-204 | C-28-012 | **true** | — | 29-05/29-06/29-07 — the D-30 when-absent fallback sentence now stands in the `## Reads` section of 17 of 17 in-set role files; CLOSED |
| F-28-205 | C-28-018 | overstated | accepted | the mechanical guard is Claude-Code-plugin-only; residual named in the row |
| F-28-206 | C-28-021 | **true** | — | 28-05 — the `handoff packet` hit the drift guard reported; CLOSED |
| F-28-207 | C-28-022 | **true** | — | 28-05 — the linear-pipeline claim; CLOSED |
| F-28-208 | C-28-023 | overstated | accepted | **D-19 item 4** — the irreducible same-uid / no-hook forgery residual |
| F-28-209 | C-28-027 | **true** | — | 28-05 — *"the roles, the handoffs, and the gates are identical everywhere"*; CLOSED |
| F-28-210 | C-28-028 | overstated | accepted | KIT-03 / SPAWN-03 / SPAWN-04 are still `[ ]` |
| F-28-211 | C-28-029 | **true** | — | 28-05 — *"same handoffs"*; CLOSED |
| F-28-212 | C-28-032 | **true** | — | 29-05/29-06/29-07 — *"every role falls back"* now measures 17 of 17 in-set role files, against the derived denominator `listRoles()` produces; CLOSED |
| F-28-213 | C-28-038 | overstated | accepted | 28-05 — the manifest `description` was rewritten by hand; **unanchorable**, so no gate catches a future missed flip — see the section above |
| F-28-214 | C-28-033 | **true** | — | 28-05 — a **third** D-10 arrow-chain site, in the § *How work flows* lifecycle bullet, that neither the drift guard nor the task-1 sweep reached; CLOSED |

**A `true` row carries no `disposition` and no `finding_id`, by the gate's own rule** — the
`—` cells above are the finding closing, not a field left blank. The finding id stays in this table
so the closure is quotable; the row it names no longer needs one.

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
