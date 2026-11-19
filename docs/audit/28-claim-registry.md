# Phase 28 — Claim Registry (AUDIT-03)

Every public claim in `README.md`, `AGENTS.md`, `agent-factory/README.md` and
`agent-factory/writing-profile.md`, given an id, mapped to the safety floor whose lowering would
falsify it, and measured against a named mechanism.

**42 rows as committed by plan 29-02** — 38 from Phase 28, plus C-28-039..C-28-042, the writing
profile's own four falsifiable claims about what it achieves. The id band is unchanged on purpose:
a second registry is the defect D-15 refused, and a document that asserts what it achieves is
exactly the class this registry exists to hold, whichever phase authored it.

**Annotation, plan 29.1-06 — the derived current count, ADDED rather than substituted.** The dated
sentence above is a historical statement scoped to plan 29-02 and is left standing. As committed by
this plan the registry carries **47 rows**: the 42 that sentence records, plus `C-28-043`..`C-28-046`
from plan 29-52, plus `C-28-047`, the model dial's cost denial. The number was DERIVED from
`readRegistry().claims.length` at this plan's commit rather than incremented by hand, and
`scripts/audit-model.test.ts` re-derives it on every run against an independently written
unfenced-heading count. This plan also inserted a section into `agent-factory/writing-profile.md`
ABOVE `## Disclaimer and honesty floor`, so the advisory `line` values earlier plans recorded for the
writing-profile rows beneath that heading now name an earlier tree. That is what `line` being
advisory and not asserted means in practice — the gate compares text AT ANCHORS and never a line
number.

**Annotation, plan 43-09 — the derived current count, ADDED rather than substituted.** The two dated
sentences above stand as written. As committed by this plan the registry carries **55 rows**: the 47
the plan 29.1-06 annotation records, plus `C-28-048`..`C-28-055`, the absolutes on the new mechanics
page `docs/how-it-works.md`. The number was DERIVED from `readRegistry().claims.length` at this
plan's commit. `C-28-033` moved to that page byte for byte from `agent-factory/README.md` and kept
its id, so it adds no row. This file's opening sentence names the four documents Phase 28 audited;
the rows now also name the shipped user docs that plan 43-02 joined to the public-docs corpus.

**Annotation, plan 43-09 task 3 — the derived current count after the core-concept page, ADDED
rather than substituted.** The sentence above records 55 rows at the mechanics page's commit. As
committed with `docs/concepts.md` the registry carries **60 rows**: those 55 plus `C-28-056`..`C-28-060`,
the absolutes on the core-concept page. The number was DERIVED from `readRegistry().claims.length`
at that commit.

**Annotation, plan 43-10 — the derived current count after the usage page, ADDED rather than
substituted.** The sentences above stand as written. As committed with the host usage, commands
and prompts moved into `docs/usage.md`, the registry carries **61 rows**: the 60 above plus
`C-28-061`, the command sentence on that page. The number was DERIVED from
`readRegistry().claims.length` at that commit. `C-28-007` and `C-28-027`..`C-28-030` moved to that
page and kept their ids, so they add no row.

**Annotation, plan 43-10 task 3 — the derived current count after the usage page's jobs, ADDED
rather than substituted.** The sentence above records 61 rows at the moves' commit. As committed
with the `## Jobs` section of `docs/usage.md` the registry carries **68 rows**: those 61 plus
`C-28-062`..`C-28-068`, the human step of each job. The number was DERIVED from
`readRegistry().claims.length` at that commit.

**Annotation, plan 43-11 — the derived current count after the README rewrite, ADDED rather than
substituted.** The sentences above stand as written. As committed with the new README opening the
registry carries **70 rows**: the 68 above plus `C-28-069` (the tagline) and `C-28-070` (the story).
The number was DERIVED from `readRegistry().claims.length` at that commit. `C-28-002` and `C-28-003`
are now `status: retired` (D-25): their rows and ids stay, so they add and remove no row.
Plan 43-11 task 2 then retired `C-28-008` and moved `C-28-001` to `docs/concepts.md` with its id:
the count stays **70 rows**.

**Annotation, plan 43-12 — the derived current count after the FAQ rewrite, ADDED rather than
substituted.** The sentences above stand as written. As committed with the rewritten `docs/faq.md`
the registry carries **72 rows**: the 70 above plus `C-28-071` (how grugops differs) and `C-28-072`
(the enterprise answer, which names the git host as the hard floor). The number was DERIVED from
`readRegistry().claims.length` at that commit.

**Annotation, plan 43-12 task 3 — the derived current count after the reader review, ADDED rather
than substituted.** The sentence above records 72 rows at the FAQ's commit. As committed with the
reader review the registry carries **74 rows**: those 72 plus `C-28-073` and `C-28-074`, two
paragraphs of `docs/usage.md` that moved from README.md unanchored and carry absolutes. The number was
DERIVED from `readRegistry().claims.length` at that commit.

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
| `status` | `true` \| `overstated` \| `false`, **measured** against `mechanism` (D-17); `dropped` — see § *A dropped claim is replaced in place (D-18)*; or `retired` — see § *A retired claim leaves the page and keeps its row (D-25)*. |
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

- file: docs/concepts.md
- line: 8
- kind: safety
- depends_on: open_pr, production_requires_human_confirmation, protected_branch_merge
- status: true
- mechanism: Three assertions in one hard-wrapped line, each measured separately, and the row takes the WORST of the three — which is why fixing two of them moves this row from `false` to `overstated` rather than to `true`. (1) `handoff packets` — was FIXED in 28-05; the phrase now reads `a shared verified context`, which is the artifact class that actually ships (`.grugops/context/<task>/notes/`, sole writer `scripts/context-io.ts`). (2) The linear arrow chain `business analysis → … → release` — was FIXED in 28-05; the sentence now states decompose-and-enqueue over a shared queue with the shared verified context as the only memory, matching `AGENTS.md:21` and `agent-factory/roles/orchestrator.md`'s § *Responsibilities* items 4 to 7 (`Split the request into subtasks.`, then the enqueue, the Workflow 17 pointer and the gate) and its § *Hard limits* (`Never relay data between agents; the shared verified context is the only channel.`) (quotes refreshed in plan 40-10 to the plain-English text plan 40-07 wrote). (3) The humans-decide sentence — REWORDED in phase 43 (reader-review finding F-07; human decision in the 43-13 UAT, 2026-11-18, `.planning/phases/43-story-and-layered-docs/43-UAT.md`). It read `Humans always hold merge and deploy` and was measured `overstated` and `accepted` under F-28-201: the failing word was `always`, and the mechanism it was measured against named a guard 33.1 D-17 later retired. It now reads `Merge and deploy are human decisions. Your git host enforces them through branch protection and required reviewers, which you set up; on Claude Code, grugops's ask rules are a speed bump.` and is measured against the three tiers `docs/GUARANTEES.md` § *Where each floor is enforced* publishes (33.1 D-21). PROSE: the roles stop at a pull request and leave merge and deploy to a person (`agent-factory/roles/orchestrator.md` § *Hard limits*, `Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans.`; `agent-factory/workflows/05-pr-quality-gate.md` step 6; `agent-factory/workflows/12-release.md` step 6). HARD FLOOR: the git host, through branch protection or rulesets on protected branches and deployment environments with required reviewers for production, which the human sets up with the checklist in `install/README.md` § 5 (a); grugops never configures the host, and `tools/grugops/host-protection.js` reports the branch items read-only while its production line reads `UNKNOWN - verify` by design (33.1 D-31). SPEED BUMP: the Claude Code `permissions.ask` rules the standalone installer writes (`install/README.md` § 5 (b)); they are not a security boundary, and the plugin form and the other host CLIs carry none, which is why the sentence scopes them to Claude Code. The sentence names the git host as the enforcing tier, says the human sets that protection up, and carries no absolute, so it holds wherever the human has or has not configured the host: it promises enforcement only through the protection the human sets up. The Bash command guard the old measurement cited (`hooks/guard.ts`, wired by `hooks/hooks.json`) was retired by 33.1 D-17 and is not part of this measurement. All three assertions now hold, so the row is `true` and F-28-201 closes; a `true` row carries no `disposition` and no `finding_id`. Plan 34-08 added Pi to the host list in parentheses, so the list names every row of the host registry (`install/host-tools.ts` `HOST_TOOLS`); the three measured assertions are unchanged. Plan 34.1-04 (D-12) replaced Gemini CLI with Antigravity CLI in that list, following the registry row; the three measured assertions are unchanged. Since plan 41-06 (D-04), the Orchestrator runs the claim command at dispatch in the agent's name; the record names the agent, so `agents claim that work` holds as ownership, and Phase 43 owns any rewording. Plan 43-11 (D-02) moved this anchor and paragraph byte for byte from README.md to docs/concepts.md § In one paragraph, keeping the id; the three measured assertions are unchanged, and `SAFETY_CLAIM_HOMES` in `scripts/check-audit-register.ts` names docs/concepts.md as its home. The phase 43 F-07 reword kept the id, the file and the anchor; only assertion (3) changed.

```
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi). One Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them. It is lean by default and scales to enterprise governance on a single config flag. Merge and deploy are human decisions. Your git host enforces them through branch protection and required reviewers, which you set up; on Claude Code, grugops's ask rules are a speed bump.
```

### C-28-002

- file: README.md
- line: 11
- kind: architecture
- depends_on: —
- status: retired
- mechanism: Retired by plan 43-11 (D-25) because the README rewrite (D-01) removed it: the README now opens with the tagline `# grugops — Specialist agents. Shared context. Coordinated work.` (C-28-069) and a plain story (C-28-070), and the words `simple software factory` are gone. The text last stood at `863c81b1` in README.md. While it stood it was measured as follows. `kit-model.listRoles()` returns 17 role files spanning business analysis through release and `listWorkflows()` returns 19 workflow files (measured 2026-08-12); `install/install.ts` lays adapters for all five named host CLIs. The sentence lists lifecycle COVERAGE, not a routing order, so it is not the D-10 linear-pipeline claim.

```
**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.
```

### C-28-003

- file: README.md
- line: 14
- kind: architecture
- depends_on: —
- status: retired
- mechanism: Retired by plan 43-11 (D-25) because the README rewrite (D-01, D-04) removed it: the README now opens with the tagline (C-28-069) and a plain story (C-28-070), and keeps the grug touch only in the art, the grugbrain.dev attribution and the non-affiliation section. This closes the `grug-brained` sentence Phase 40 left to Phase 43 (40-10). The text last stood at `863c81b1` in README.md. While it stood it was measured as follows. Restored to `true` by id in plan 40-10 (decision D-34), on the gate output below rather than on assertion. All three halves are measured. `one job` holds — every one of the 19 role files carries a `## One job` section. `hard limits` holds — every one of the 19 carries a `## Hard limits` section, `orchestrator.md` states the coordinator width and claim caps there, and `guard_role_clause_uniqueness` in `scripts/check-foundation-guards.ts` reports `role clause uniqueness: 0 findings over 19/19 elements`. `short words` holds again, now as plain English measured by the writing profile: role bodies are a governed surface of `agent-factory/writing-profile.md`, and `guard_sentence_form` in `scripts/check-imperative-lexicon.ts` governs the role corpus as its fifth part, 20 files (the 19 roles plus `_role-switch-protocol.md`). It bounds a procedural sentence at 20 words (WP-02) and a descriptive one at 25 (WP-03), refuses a modal in a numbered item (WP-05), and reports `corpus: 69 file(s) in 5 part(s) — workflows 19, checklists 15, seedTemplates 12, contracts 3, roles 20` and `sentence form — governed file(s): 0 findings over 69/69 elements`. Its one finding on the first run, the 34-word `## Activates when` sentence of `security-nfr.md`, was reworded rather than exempted (D-32). The caveman voice stays retired: `guard_caveman_voice` reports `caveman voice: 0 findings over 20/20 elements`. The README sentence's `grug-brained` wording is unchanged and left to Phase 43; this row measures the three named halves. WHAT THIS ROW STILL DOES NOT CLAIM, `UNKNOWN - verify`: that short sentences are *effective*. Nothing here asserts a token, comprehension or model-behaviour benefit — see C-28-042.

```
Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.
```

### C-28-004

- file: README.md
- line: 26
- kind: architecture
- depends_on: —
- status: true
- mechanism: `.claude-plugin/plugin.json` `version` is `2.1.0`, `agent-factory/VERSION` is `2.1.0` and `package.json` `version` is `2.1.0` — the three version artifacts agree. `CHANGELOG.md:8-13` is the mechanism that reconciles the apparent conflict with `git tag`: it states that the artifact version is `0.1.0`, that no public release has been cut, and that `v1.0`/`v1.1`/`v1.2`/`v2.0` are internal milestone tags rather than published SemVer releases. RECORDED RESIDUAL, adjacent but not this claim's defect: `CLAUDE.md`'s stack table names a root `VERSION` file that does not exist on disk.

```
grugops version `2.2.0`.
```

### C-28-005

- file: README.md
- line: 29
- kind: install
- depends_on: —
- status: true
- mechanism: `install/install.ts` and `install/uninstall.ts` both ship with committed `.js`; `DRY_RUN` is read at 37 sites; `install/install.test.ts` carries the idempotence and non-overwrite cases. `Node 22+` matches the documented hard prerequisite in `CLAUDE.md` and `install/README.md`.

```
1. **Install** — clone grugops once, then run its idempotent, additive, reversible installer (Node 22+) against the project you want it in:
```

### C-28-006

- file: README.md
- line: 39
- kind: install
- depends_on: —
- status: true
- mechanism: Two absolutes measured against `install/install.test.ts`, which carries the re-run-is-safe and does-not-overwrite cases, and against `install/uninstall.ts`, which removes only paths the installer recorded as added. `DRY_RUN=1` is honoured at 37 sites in `install/install.ts`.

```
   The installer never overwrites or deletes your content; re-running it is safe, and `node ~/grugops/install/uninstall.js --target /path/to/your-project` removes only what was added. Set `DRY_RUN=1` to preview the changes first.
```

### C-28-007

- file: docs/usage.md
- line: 80
- kind: architecture
- depends_on: —
- status: true
- mechanism: `only the dispatch differs, never the content` is held MECHANICALLY, not by prose: the seven dash-standalone skills under `.claude/skills/grugops*` and the seven colon-namespaced plugin skills under `skills/` are generated from one source by `scripts/generate-skill-twins.ts` and byte-gated by `npm run freshness:skill-twins`, so a content divergence between the two forms is unrepresentable in a green build. Moved to docs/usage.md § Commands by plan 43-10 (D-09, D-28) with its anchor; the three-space list indent it carried inside README.md Quickstart step 2 went, so this verbatim block was re-measured in the same commit, and `the same operations` now refers to the example-command fence directly above it, which moved with it. The words are unchanged.

```
In the versioned Claude Code plugin form the same operations are namespaced with a colon — `/grugops:<op>` (for example `/grugops:plan`, `/grugops:ticket`, `/grugops:release`). Both forms coexist; only the dispatch differs, never the content.
```

### C-28-008

- file: README.md
- line: 65
- kind: architecture
- depends_on: —
- status: retired
- mechanism: Retired by plan 43-11 (D-25) because the README rewrite (D-01) removed it: the `## Where to go next` list replaces the "Go deep" step, linking docs/concepts.md, docs/how-it-works.md, docs/usage.md, docs/reference/README.md and install/README.md. The text last stood at `65ec4751` in README.md. While it stood it was measured as follows. `agent-factory/README.md` exists and its § `Usage across the supported host tools` table carries one row per registry host (`install/host-tools.ts` `HOST_TOOLS`), each naming its entry file and its role dispatch. Plan 34-06 made the count derived rather than written: `install/host-tools.test.ts` ("every per-host table equals the registry") holds the table to the registry two-sided, and `scripts/check-uat-oracles.ts` builds its asymmetric rows from the registry. Plan 34-08 made the claim text count-free (`any supported host tool`) and updated this verbatim block in the same commit. Plan 43-10 (D-10) moved that table to docs/usage.md § Usage across the supported host tools; agent-factory/README.md keeps the heading with a pointer line to it, and its § Start here still tells any host tool to start at `agent-factory/roles/orchestrator.md`, so the guide still explains how to point a host tool at the Orchestrator. The derivation and the two checks above now read docs/usage.md.

```
3. **Go deep** — the internal start-here guide explains how to point any supported host tool at the Orchestrator and walk a ticket from idea to PR. See **[`agent-factory/README.md`](agent-factory/README.md)**.
```

### C-28-009

- file: README.md
- line: 56
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
- depends_on: open_pr, production_requires_human_confirmation, protected_branch_merge
- status: overstated
- mechanism: Two assertions, and the row takes the worse of them. (1) The self-contradiction is FIXED in 28-05: this line now states `decomposes each request into subtasks and enqueues them on a shared queue`, which is the same fact `AGENTS.md:21` states as `the Orchestrator sequences by decompose→enqueue`. The two lines agreed nowhere before and agree exactly now. (2) `Humans decide; agents execute` is UNCHANGED and still carries the overstatement measured in full at C-28-023 — the mechanical guard is Claude-Code-plugin-only and the same-uid / no-hook forgery residual is irreducible. Accepted here on the same basis and with the same named residual as C-28-023 / F-28-208. The motto is the project's own framing of the `autonomy=pr` floor and was deliberately not reworded; the residual is recorded rather than papered over. Since plan 41-06 (D-04), the Orchestrator runs the claim command at dispatch in the agent's name; the record names the agent, so `agents claim that work` holds as ownership, and Phase 43 owns any rewording.
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
- mechanism: `the dial (mode, cadence, checkpoints, WIP limits)` holds — all four keys are present in `agent-factory/config/factory.config.json`. Plan 30-06 retired the `autonomy` scalar and this claim's text moved with it; the fourth key named is now the enforced `checkpoints` matrix rather than the documentary scalar, and the structure validator refuses a configuration that still carries the old key. `Runs lean with documented defaults when absent` NOW HOLDS TOO. The defaults are documented (`agent-factory/config/factory.config.md` carries a per-field lean-default column, and `agent-factory/README.md` § Configuration carries the public statement registered as C-28-032), and Phase 29 added one when-absent fallback sentence to the `## Reads` section of every in-set role file, reading "With no config file present, this role runs lean on the documented defaults in agent-factory/README.md." So the fallback now rests on a role instruction rather than on an agent inferring it. Measured at 17 of 17 by two independent methods — `grep -lc` in forced text mode, and a Node directory walk using `String.includes` — where the 2026-08-12 measurement was ZERO. THE DENOMINATOR IS 17, NOT THE 18 FILES ON DISK: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `agent-factory/roles/_role-switch-protocol.md` is out of set for counting; it is a protocol document rather than a role an agent is activated as, and it reads no config, so its exclusion is principled rather than incidental. A later reader who counts 18 markdown files under `agent-factory/roles/` must not correct this number back. RESIDUAL, `UNKNOWN - verify`: the sentence is an instruction in every role file, and no gate asserts that an agent reading it actually behaves that way at run time.

```
1. `.grugops/factory.config.json` — the dial (mode, cadence, checkpoints, WIP limits). Runs lean with documented defaults when absent.
```

### C-28-013

- file: AGENTS.md
- line: 21
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured against `agent-factory/roles/orchestrator.md`, which carries the classification step, the role-activation step, the requirement that each role publish typed notes, and the board update; § *Trace updates* says `tools/grugops/trace-render.js` renders the trace from published note refs (reworded in plan 37-18, v3.0 D-6). `activates` is the still-correct v2.0 verb; this line does NOT assert the linear routing order C-28-010 measures false.

```
The Orchestrator classifies the request, activates the right specialist role(s), requires published notes from each, updates the board, and produces the next action; the trace is rendered from those notes.
```

### C-28-014

- file: AGENTS.md
- line: 26
- kind: architecture
- depends_on: —
- status: true
- mechanism: `agent-factory/workflows/16-context-read-write.md` exists and is the pull/publish contract this line names; `orchestrator.md` § *Hard limits* independently states `Never relay data between agents; the shared verified context is the only channel.` (quotes refreshed in plan 40-10 to the plain-English text plan 40-07 wrote). This is the CORRECT v2.0 statement, and it is the line that makes `AGENTS.md:5` self-contradictory.

```
Roles pull the shared verified context they need and publish their work output as typed notes — per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`). The shared context is the inter-role memory; the Orchestrator sequences by decompose→enqueue.
```

### C-28-015

- file: AGENTS.md
- line: 37-40
- kind: architecture
- depends_on: —
- status: true
- mechanism: The KIT/STATE split is enforced mechanically by `scripts/check-kit-refs.ts` (Assertions 1-3 over the shipped kit) and by the installer's two-root layout; `agent-factory/workflows/16-context-read-write.md` exists; `install/install.ts --check` is the re-run this block names. The route in the fourth line (phase 34 D-26, plan 34-27) is `KIT_ROUTE` in `install/host-tools.ts`, carried byte for byte (`install/host-tools.test.ts` asserts it once, in this section); `writeMarker` in `install/install.ts` records the kit root as `kitRoot` in `.grugops/install.json` on every install; the doctor's kit-route check (`kitRouteFindings`, run by `--check`) follows `kitRoot` to `roles/orchestrator.md` and asks each route carrier whether it carries the route; `install/kit-route.test.ts` follows the route independently after an install whose kit lives in a separate kit home. The `KIT=` line is the materialized kit root in the Claude Code adapters, which `--check` cross-checks against the marker's `kitRoot` (D-03). NOTE, recorded in `## Two-sided completeness (D-14)` rather than as a finding: line 29 calls this block `a resolution and safety rule`, yet no member of `SAFETY_FLOORS` holds it, so its `kind` is `architecture` — a fifth floor cannot be invented, because `audit-model.test.ts` pins `SAFETY_FLOORS.length` two-sided at 4.

```
- `agent-factory/…` = **KIT** — read-only, resolved from the kit root; NEVER written.
- `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = **STATE** — read/write in THIS repo.
- Roles read and write the shared verified context only via Workflow 16 (`agent-factory/workflows/16-context-read-write.md`) — referenced, never restated.
- A Claude Code adapter names the kit root on its `KIT=` line. After a scripted install the grugops kit is not in this repository: its root is the directory named by the `kitRoot` field of `.grugops/install.json`, and each `agent-factory/…` path is read under it, so `agent-factory/roles/orchestrator.md` is `<kitRoot>/roles/orchestrator.md`. With no `.grugops/install.json` (the minimal copy install), the kit is this repository's own `agent-factory/`. If the resolved kit dir is absent: **STOP — do not hunt** the repo for `agent-factory/…`. Re-run the installer (`node install/install.js` or `node install/install.js --check`).
```

### C-28-016

- file: AGENTS.md
- line: 43
- kind: architecture
- depends_on: —
- status: true
- mechanism: A one-line restatement of C-28-015's block, measured against the same mechanisms. It is registered separately rather than folded in because it is a distinct anchorable location: a Phase 29 rewrite that updated one and not the other would leave this document asserting the invariant twice in two different ways, and only a per-location row makes that visible.

```
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE in this repo. If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt.
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
- mechanism: re-stated 2026-09-26 for 33.1 D-17, D-26 (the Bash command guard, its deploy approval and the two-key floor grants were retired). Three tiers now hold these rules. (1) HARD FLOOR — the git host: branch protection or rulesets on protected branches (pull request, review, no force push) hold `protected_branch_merge`, and a production deployment environment with a required reviewer holds `production_requires_human_confirmation`, for every host CLI and both install forms, but only where the human has configured them; grugops never configures the host and checks it read-only with `tools/grugops/host-protection.js` (33.1 D-19). (2) SPEED BUMP — the standalone installer translates those two `checkpoints` cells into Claude Code `permissions.ask` rules in `.claude/settings.json` (33.1 D-18); they make Claude Code ask before a matched command, they are not a security boundary, and the plugin form and the other four CLIs carry none. (3) PROSE — `test_integrity` has no mechanical tier; it is held by the gate workflow's text (33.1 D-26). THE OVERSTATEMENT IS STILL SCOPE: the sentences are absolutes, and the hard floor holds only on a host where protection is configured; elsewhere the rules are held by prompt and, in the standalone Claude Code form, by the speed bump. Re-stated 2026-10-05 for 33.1 D-31 (Q4): the host check answers for the branch items only; its production environment line reads `UNKNOWN - verify` by design, so the production floor is the environment the human configures and the named human's confirmation, which grugops does not verify.
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
- line: 154-155
- kind: architecture
- depends_on: —
- status: true
- mechanism: Measured against `agent-factory/seed/`: `memory-bank/` carries `00-index.md`, `10-project-brief.md`, `20-product.md`, `30-architecture.md`, `40-contributing.md` and `60-progress.md`; `plans/` carries `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` and the `sprints/`, `releases/`, `epics/`, `features/`, `tickets/`, `traceability/` and `nfr/` directories (the last two named in plan 37-18: per-ticket trace files and one file per NFR). Every artifact this line names exists in the seed the installer walks.

```
- `memory-bank/*` — the agent-maintained working memory: read on start; `60-progress.md` is the running plan-of-record, `50-decisions/` holds ADRs, plus project brief, product, architecture, contributing, runbook, glossary.
- `memory-bank/plans/*` — the delivery state: `board.md` (status), `traceability.md` (rendered index; per-ticket trace files under `traceability/`), `nfr-catalog.md` (index; one file per NFR under `nfr/`), plus `sprints/`, `releases/`, `epics/`, `features/`, `tickets/`.
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
- mechanism: FIXED in 28-05. The arrow chain `business analysis → product → … → release` described the linear relay v2.0 replaced, and D-10 records that no grep can hold it because `routes` is still-correct English at three live sites — it was registry material by construction. The passage now states decompose-and-enqueue over a shared queue, with the roles named as a comma list of what the Orchestrator draws on rather than as a chain it walks, and it states the non-relay invariant explicitly. Measured against `agent-factory/roles/orchestrator.md` § *Responsibilities* items 4 and 5 (`Split the request into subtasks.` and `` Enqueue each subtask as a thin `pending/` file holding only a `ref:` to its `.grugops/context/` folder. ``) and § *Hard limits* (`Never relay data between agents; the shared verified context is the only channel.`), and against `AGENTS.md:21` (quotes refreshed in plan 40-10 to the plain-English text plan 40-07 wrote). The verb `routes` was NOT removed from the repository: D-10's three live sites are untouched. Since plan 41-06 (D-04), the Orchestrator runs the claim command at dispatch in the agent's name; the record names the agent, so `agents claim that work` holds as ownership, and Phase 43 owns any rewording.

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
- line: 15-21
- kind: safety
- depends_on: open_pr, production_requires_human_confirmation, protected_branch_merge
- status: true
- mechanism: THIS ROW WAS D-19 ITEM 4 AND `docs/audit/28-residual-sizing.md` TABLE ROW 4 BECOMING A REGISTRY ROW, and it was measured `overstated` and `accepted` under F-28-208 until phase 43. REWORDED in phase 43 (reader-review finding F-07; human decision in the 43-13 UAT, 2026-11-18, `.planning/phases/43-story-and-layered-docs/43-UAT.md`). The old text, `Humans always hold merge and deploy.`, was measured against `factory.config.json` `autonomy: "pr"` (a scalar plan 30-06 retired), the Bash guard `hooks/guard.ts` wired as a Claude-Code-plugin-only hook (retired by 33.1 D-17), and the irreducible same-uid / no-hook / direct-filesystem forgery residual; the word that failed was `always`. The new text says merge and deploy are human decisions, that the git host enforces them through branch protection and required reviewers the human sets up, and that on Claude Code the ask rules are a speed bump, and it links `docs/GUARANTEES.md` (relative link `../docs/GUARANTEES.md`, which resolves from `agent-factory/`, as the same page's § Configuration link does). It is measured against the three tiers `docs/GUARANTEES.md` § *Where each floor is enforced* publishes (33.1 D-21). PROSE: the roles stop at a pull request and leave merge and deploy to a person (`agent-factory/roles/orchestrator.md` § *Hard limits*, `Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans.`; `agent-factory/workflows/05-pr-quality-gate.md` step 6; `agent-factory/workflows/12-release.md` step 6). HARD FLOOR: the git host, through branch protection or rulesets on protected branches and deployment environments with required reviewers for production, which the human sets up with the checklist in `install/README.md` § 5 (a); grugops never configures the host, and `tools/grugops/host-protection.js` reports the branch items read-only while its production line reads `UNKNOWN - verify` by design (33.1 D-31). SPEED BUMP: the Claude Code `permissions.ask` rules the standalone installer writes (`install/README.md` § 5 (b)); they are not a security boundary, and the plugin form and the other host CLIs carry none, which is why the sentence scopes them to Claude Code. The sentence names the git host as the enforcing tier, says the human sets that protection up, and carries no absolute, so it holds wherever the human has or has not configured the host: it promises enforcement only through the protection the human sets up. The Bash command guard the old measurement cited (`hooks/guard.ts`, wired by `hooks/hooks.json`) was retired by 33.1 D-17 and is not part of this measurement. Measured `true`; F-28-208 closes, and a `true` row carries no `disposition` and no `finding_id`. THE OLD MEASUREMENT IS NOT WITHDRAWN FOR THE COPIES THAT CITE IT: C-28-010 (`Humans decide; agents execute`) and C-28-038 (the plugin manifest `description`, which still reads `humans always hold merge and deploy`) are unchanged and still cite "the overstatement measured in full at C-28-023"; that measurement is this row's text at commit `b991ea34` (`git show b991ea34:docs/audit/28-claim-registry.md`), and the residual it names stays row 4 of `docs/audit/28-residual-sizing.md`. Rewording those copies is outside the F-07 decision. `line` was stale at 13-14 and now records the claim text, 15-18. RE-MEASURED 2026-11-19 by plan 43.1-07 (phase 43.1 decisions D-03 and D-04, closing the WR-02 part of deferred item D68 and part of D693). Two changes, the rest of the text byte for byte. (1) D-04: the third sentence ended `which you set up; on Claude Code, grugops's ask rules are a speed bump.`; a new sentence now says `A required reviewer gates a deploy only when the deploy credentials live solely in the production environment's secrets.`, measured against the `production_requires_human_confirmation` `enforcement.hardFloor` in `scripts/audit-model.ts`, `docs/GUARANTEES.md` § *Where each floor is enforced* and `install/README.md` § 5 (a) with its production checklist item `keeps the deploy credentials to itself`, all three of which carry the same condition since plan 43.1-05 (read 2026-11-19 with `grep -n "deploy credentials live solely in"`). (2) D-03: the link sentence said the page shows which safety claims hold `on this repository`, but `docs/GUARANTEES.md` is rendered by `scripts/generate-guarantees.ts` from the grugops source checkout (`DEFAULT_ROOT` is the script's parent directory) and ships in every kit home. It now says the page covers the grugops source checkout at its default settings (its § *Where the checkpoints are held* reads `all checkpoints at default`, read 2026-11-19 after `npm run generate:guarantees`) and that a user's own floors are set in `.grugops/factory.config.json`, the seeded per-repo config (`install/README.md`, per-repo state). The sentence names no command that reports a user's own floors; whether any command does is `UNKNOWN - verify`. The floors, the tiers and the human decisions are unchanged and the deploy clause now carries its condition, so the row stays `true`. `line` was 15-18 and is now 15-21.

```
the role, the guardrail, the memory, the state, the dial, the proof, and the gates. Merge and
deploy are human decisions. Your git host enforces them through branch protection and required
reviewers, which you set up. A required reviewer gates a deploy only when the
deploy credentials live solely in the production environment's secrets. On Claude Code,
grugops's ask rules are a speed bump. [`docs/GUARANTEES.md`](../docs/GUARANTEES.md) shows which
safety claims hold in the grugops source checkout at its default settings. Your own floors are
set in `.grugops/factory.config.json`.
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
- line: 27-30
- kind: architecture
- depends_on: —
- status: true
- mechanism: Each named step is present in `agent-factory/roles/orchestrator.md`: the config read, the classification, the WIP-limit respect, the role activation, the requirement to publish typed notes into the shared verified context (Workflow 16), and the board update; the closing sentence is measured against § *Trace updates*, where `tools/grugops/trace-render.js` renders the trace from published note refs (reworded in plan 37-18, v3.0 D-6). `publish typed notes into the shared verified context` is the corrected v2.0 wording, not the deleted relay.

```
The Orchestrator reads the config, classifies your request, respects the board's WIP limits,
activates the right specialist roles, requires each to publish typed notes into the shared
verified context, updates the board, and produces the next action. The trace is rendered
from those notes.
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

- file: docs/usage.md
- line: 35-38
- kind: architecture
- depends_on: —
- status: true
- mechanism: FIXED in 28-05. The sentence asserted sameness of a DELETED artifact class — `handoffs` — and `scripts/check-public-docs-vocabulary.js` deliberately could not flag it, because the bare word is not a `RETIRED_PROSE_FORMS` literal and D-10 forbids widening the matcher to chase it. The noun is now `workflows`, and the parity assertion is measured against what actually ships identically: `agent-factory/roles/` and `agent-factory/workflows/` are copied whole to the kit root of every install by `install/install.ts`'s `cpSync` of the `agent-factory` tree, so no host tool receives a different role or workflow body. The companion clause `only the dispatch differs, never the content` is held mechanically by `scripts/generate-skill-twins.ts` and `npm run freshness:skill-twins` (see C-28-007). The spawn-versus-load sentence that follows is unchanged and independently correct against `orchestrator.md` § *Hard limits*. Moved to docs/usage.md § Usage across the supported host tools by plan 43-10 (D-10, D-28), byte for byte with its anchor; agent-factory/README.md keeps the heading and one pointer line. The text and its measurement are unchanged.

```
grugops works on Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, and Pi. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
workflows, and the gates are identical everywhere. The only difference is whether the host
tool can *spawn* sub-agents or must *load* role files into context one at a time.
```

### C-28-028

- file: docs/usage.md
- line: 41-48
- kind: architecture
- depends_on: —
- status: overstated
- mechanism: CARRIED-IN CANDIDATE, RE-MEASURED RATHER THAN TRANSCRIBED. The table's Claude Code row advertises `Coordinator spawns role agents — the coordinator: true adapter holds the grant`. What holds: `.planning/REQUIREMENTS.md` records SPAWN-01 `[x]` (all 17 adapters exist, generated) and SPAWN-02 `[x]` (byte-gated). What does NOT hold: KIT-03, SPAWN-03 and SPAWN-04 are all still `[ ]`, and SPAWN-03's own text states that the current subagent placement makes the grant a no-op. `28-CONTEXT.md` records that Phase 27 closed by named user override rather than by a verification round. The grant exists; the spawn path's correctness is advertised ahead of its verification. Registered whole-table because an anchor between two pipe rows would split the rendered table. PLAN 34-06 (D-11): the table now carries one row per registry host (`install/host-tools.ts` `HOST_TOOLS`), Pi included, and the Pi row reads `Sequential role-load — no spawn` because Pi ships no sub-agents. The asymmetric dispatch-table oracle in `scripts/check-uat-oracles.ts` builds its rows from the registry, so a missing, duplicated or spawn-worded host row fails red by name, and `install/host-tools.test.ts` ("every per-host table equals the registry") holds the table's host names and entry-file cells to the registry two-sided. Plan 34.1-04 (D-12) replaced the Gemini CLI row with an Antigravity CLI row and named the entry each of Codex CLI, Antigravity CLI and OpenCode gets after plan 34.1-01 (the shared agent skill `.agents/skills/grugops/SKILL.md`, and the OpenCode command `.opencode/commands/grugops.md`); the overstated Claude Code row is unchanged. Moved to docs/usage.md § Usage across the supported host tools by plan 43-10 (D-10, D-28), byte for byte with its anchor; agent-factory/README.md keeps the heading and one pointer line. The text and its measurement are unchanged. `scripts/check-uat-oracles.ts` `ASYM_TABLE_FILES` and `install/host-tools.test.ts` `FLOOR` name docs/usage.md in the same plan; the oracle reads only a table whose header names a dispatch column, so the page's start table is not read as dispatch rows.
- disposition: accepted
- finding_id: F-28-210

```
| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`)             | Coordinator spawns role agents — the `coordinator: true` adapter holds the grant |
| **Codex CLI**         | `AGENTS.md` (+ `.agents/skills/grugops/SKILL.md` skill) | Sequential role-load — no spawn                   |
| **Antigravity CLI**   | `AGENTS.md` (+ the same `.agents/skills/grugops/SKILL.md` skill) | Sequential role-load — no spawn          |
| **OpenCode**          | `AGENTS.md` (+ `.opencode/commands/grugops.md` command) | Sequential role-load (or its own native agents)   |
| **GitHub Copilot CLI**| `AGENTS.md` (+ `.github/copilot-instructions.md`)| Sequential role-load — no spawn                          |
| **Pi**                | `AGENTS.md` (+ `.pi/prompts/grugops.md` template) | Sequential role-load — no spawn                          |
```

### C-28-029

- file: docs/usage.md
- line: 51-54
- kind: architecture
- depends_on: —
- status: true
- mechanism: FIXED in 28-05. `same handoffs` asserted parity of the deleted artifact class — the same defect as C-28-027, at a second location in the same file, which is why both had to move together. The clause now reads `same workflows, same gates, same shared verified context`, naming the memory channel that replaced the relay rather than the relay itself; the parity is measured against the same `cpSync` of the whole `agent-factory` tree that C-28-027 cites. The spawn-versus-load distinction the passage draws was already correct and is unchanged — it matches `orchestrator.md` § *Responsibilities* item 6, which points at Workflow 17, and Workflow 17 step 4: `Where the `Agent` spawn tool exists, spawn that adapter with the task reference and nothing else.` and `Where the tool does not exist, switch role per `agent-factory/roles/_role-switch-protocol.md`.` (re-pointed in plan 41-06, D-12, when the spawn and drain text left the role). Moved to docs/usage.md § Usage across the supported host tools by plan 43-10 (D-10, D-28), byte for byte with its anchor; agent-factory/README.md keeps the heading and one pointer line. The text and its measurement are unchanged.

```
On Claude Code the coordinator (the `coordinator: true` orchestrator adapter) spawns a role
agent when it would otherwise "wake" that role. On the non-spawning host CLIs the Orchestrator
is a single agent that *loads the relevant role file into context* at that moment. Same roles,
same workflows, same gates, same shared verified context — only the dispatch differs.
```

### C-28-030

- file: docs/usage.md
- line: 57-60
- kind: install
- depends_on: —
- status: true
- mechanism: `install/install.ts` lays down `.claude/agents/` role adapters, `.claude/skills/` dash-standalone skills, `skills/` plugin skills, and the per-tool entry-file pointers; `agent-factory/packaging/` carries the three templates (`adapters.md`, `slash-command.template.md`, `subagent.frontmatter.md`) they are generated from. The adapters ship now, as the sentence says. Moved to docs/usage.md § Usage across the supported host tools by plan 43-10 (D-10, D-28), byte for byte with its anchor; agent-factory/README.md keeps the heading and one pointer line. The text and its measurement are unchanged. `This table` still names the dispatch table directly above it.

```
The detailed per-tool **adapters** (thin wrappers, slash commands, entry-file pointers, and
the Claude Code plugin form) ship now — the installer (`node install/install.js`) lays them
down. This table is the usage overview; the adapters are the mechanical conveniences layered
on top.
```

### C-28-031

- file: agent-factory/README.md
- line: 72-77
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
- line: 80-83
- kind: safety
- depends_on: open_pr, protected_branch_merge
- status: true
- mechanism: The baseline holds exactly: `factory.config.json` carries `mode: "lean"`, `cadence: "kanban"` and a `checkpoints` object whose cells sit at their documented defaults. Plan 30-06 retired the `autonomy` scalar; this claim's text moved with it, and the baseline it names is now the matrix's defaults rather than a single grade. THE CAUSAL CLAUSE `because every role falls back to these same documented defaults when the file is absent` was the overstatement, and it NOW HOLDS: Phase 29 added one when-absent fallback sentence to the `## Reads` section of every in-set role file, reading "With no config file present, this role runs lean on the documented defaults in agent-factory/README.md." — and it points at the § Configuration section of this same document, which is where this claim lives. Measured at 17 of 17 by two independent methods (`grep -lc` in forced text mode and a Node directory walk using `String.includes`), where the 2026-08-12 measurement was ZERO. The word `every` in the claim is therefore satisfied over the set the kit actually activates. THE DENOMINATOR IS 17, NOT THE 18 FILES ON DISK: `kit-model.listRoles()` drops underscore-prefixed entries by derivation, so `agent-factory/roles/_role-switch-protocol.md` is out of set for counting; it is a protocol document rather than a role an agent is activated as, and it reads no config, so its exclusion is principled rather than incidental. A later reader who counts 18 markdown files under `agent-factory/roles/` must not correct this number back. This is the same mechanism as C-28-012, stated more strongly here, and the two rows close together. RESIDUAL, `UNKNOWN - verify`: no gate asserts that an agent reading the instruction behaves that way at run time.

```
The **zero-config baseline** is `mode=lean`, `cadence=kanban`, and every `checkpoints`
cell at its documented default. grugops runs lean with no config at all, because every role
falls back to these same documented defaults when the file is absent. Edit the dial to scale
up to enterprise governance (scrum cadence, compliance regimes, release gates) on a single flag.
```

### C-28-033

- file: docs/how-it-works.md
- line: 78-89
- kind: architecture
- depends_on: —
- status: true
- mechanism: FIXED in 28-05. Three assertions, measured separately. The board HOLDS, unchanged — `agent-factory/seed/plans/board.md` ships WIP-limited columns and `factory.config.json` `wip_limits` names all ten. Traceability HOLDS, reworded in plan 37-18 (v3.0 D-6) — `tools/grugops/trace-render.js` renders one file per ticket under `memory-bank/plans/traceability/` from published note refs, with the requirement→ticket→code→test→UAT→release link shape (that arrow chain is a LINK SHAPE, not a routing order, and was correctly left standing), and a one-line-per-ticket index in `traceability.md`; measured against `scripts/trace-model.ts` and the seed's `plans/traceability/` directory. THE LIFECYCLE BULLET WAS THE DEFECT and is the one that moved: it narrated `the Orchestrator routes each request through the relevant stages (analysis → design → … → release)`, the third D-10 arrow-chain site, found by the anchor pass and reached by neither the drift guard nor the task-1 read. It now states decompose-and-enqueue for `whichever stages the work actually needs`, states that the Orchestrator claims at dispatch in the role's name (reworded in plan 41-06, D-04, and measured against Workflow 17 steps 3 and 4), and closes on `never a relay from the role before it` — measured against `orchestrator.md` § *Responsibilities* step 4, `agent-factory/workflows/17-task-claim.md` (the pending → claimed → done transitions and `Coordination is ONLY through the on-disk substrate — never relay data agent-to-agent`), and `agent-factory/workflows/16-context-read-write.md` (pull-before-act, publish-after-verify). The already-correct Workflow 16 clause is retained verbatim. Registered as one slice because an anchor between two list items would split the rendered list. Moved byte for byte from agent-factory/README.md to docs/how-it-works.md by plan 43-09 (D-28); the bullets and their measurement are unchanged. REWORDED 2026-11-19 by plan 43.1-07 (phase 43 reader-review finding F-09, `.planning/phases/43-story-and-layered-docs/43-READER-REVIEW.md`; the F-09 part of deferred item D67). The traceability assertion ended `so every shipped change is accountable end to end`, an outcome stronger than the rendered trace; it now ends `so each shipped change leaves a trail from requirement to release`, which says what `tools/grugops/trace-render.js` renders (the requirement→ticket→code→test→UAT→release link shape measured above) and no more. `exactly what it needs` in the lifecycle bullet is kept word for word, per the human decision of 2026-11-04 (D-04, `docs/audit/29-style-dispositions/41-06.md`). Every other byte is unchanged, so the three measurements above stand and the row stays `true`.

```
- **The board** — `memory-bank/plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — the audit trail, rendered per ticket from published note refs. Each ticket's
  file under `memory-bank/plans/traceability/` links requirement → ticket → code → test → UAT →
  release, and `memory-bank/plans/traceability.md` indexes them one line per ticket, so each
  shipped change leaves a trail from requirement to release.
- **The lifecycle** — the Orchestrator decomposes each request into subtasks and enqueues
  them for whichever stages the work actually needs (analysis, design, engineering, QE,
  security/NFR, UAT, release); it claims each subtask at dispatch in its role's name, and
  the role pulls the shared verified context and publishes typed notes back into it
  (Workflow 16), so the next role inherits exactly what it needs — never a relay from the role before it.
```

### C-28-034

- file: agent-factory/README.md
- line: 142-144
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
- line: 147-149
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
- line: 156-158
- kind: install
- depends_on: —
- status: true
- mechanism: All seven named flags were grepped in `install/install.ts` and all seven are present: `--target` (8 sites), `--yes` (5), `DRY_RUN` (37), `--symlink` (3), `--migrate` (17), `--update` (20), `--prune-old-kit` (13). `install/README.md` exists at the linked path. Plan 43-03 changed only the link target, from `../install/README.md` to the repository URL, because `install/` does not ship in the kit home.

```
See **[`install/README.md`](https://github.com/abitwise/grugops/blob/main/install/README.md)** for the full flag set (`--target`,
`--yes`, `DRY_RUN`, `--symlink`, `--migrate`, `--update`, `--prune-old-kit`) and the two-root
kit/state layout.
```

### C-28-037

- file: agent-factory/README.md
- line: 161-163
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
- depends_on: open_pr, production_requires_human_confirmation, protected_branch_merge
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
- line: 257-262
- kind: architecture
- depends_on: —
- status: true
- mechanism: `node scripts/check-banned-claims.js` — exit 0 over 117 derived documents (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, minus 1 overlap), 22 pinned literals across 3 groups, one named exemption region asserted two-sided, and every suppressed occurrence inside one of 6 registry-anchored blocks frozen byte-for-byte against this file (D-54). THE CORPUS AND LITERAL FIGURES ARE RE-DERIVED, NOT RECOMPUTED: this row carried `82 derived documents` and `20 pinned literals` from Phase 28, both superseded by corpus growth; the values above are read off the gate's own second PASS line at plan 29-58, and the superseded values are recoverable from this file's history. WHAT THIS ROW CLAIMS IS THE PREDICATE THE GATE PUBLISHES (D-55, narrowed by plans 29-56 and 29-58): whether any of the 22 pinned literals appears on any single physical line of the 117 derived documents, outside the registry-anchored blocks of one named exemption region — NOT that three prohibitions hold over the shipped kit and the public documents, which is the wider sentence this row and its verbatim used to carry. The gate was watched FAILING first (D-44): exit 1 with 3 findings over 82 documents at commit 20982a0, exit 0 at commit 0fafbaf, with the gate itself byte-unchanged across the transition. Those D-44 figures are HISTORY, measured on the corpus of the day, and are deliberately NOT restated at today's size. Two of those three findings were NOT planted — the kit already claimed the caveman voice is a token economy applied to memory, which project measurement on 2026-07-28 disproved on this artifact. RECORDED RESIDUALS, TWO of them, carried in the gate's source and in the profile's own prose rather than claimed away, both `UNKNOWN - verify`: (1) a brand-new conformance claim written without any pinned literal is not mechanically detectable, because no grep recognizes an assertive sentence written in new words; (2) `V-29-57-01` — matching is decided one physical line at a time, so a pinned multi-word literal hard-wrapped across a line boundary is not matched. The second is OPEN and DIRECTED **FAIL-OPEN**, with its reach, its live count and its reproduction derived at `docs/audit/29-round8-residuals.md` §4; this row CITES those figures rather than restating them, so there is one place they are derived. Its named remedy is declined for this phase by `D-56`, and the standing refusal to normalize whitespace before comparing is kept with its own reason — a refusal is not a closure, which is why the axis carries an id.

```
**Conformance with ASD-STE100 is not claimed, not checked, and not implied. No token-economy win is
claimed. No comprehension benefit is claimed.** `guard_banned_claims` decides one question about
those three: whether any of its pinned literals appears on any single physical line of the document
set it derives, outside the registry-anchored blocks of one named exemption region. It was watched
failing on a real claim in a real file before it was allowed to pass. A green run from it says what
it measured, and says nothing about the standard.
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

### C-28-047

- file: agent-factory/writing-profile.md
- line: 238-242
- kind: architecture
- depends_on: —
- status: true
- mechanism: THE MECHANISM THAT HOLDS THESE BYTES is `scripts/check-claim-anchors.js`'s live byte comparison at the anchor. It holds THE SENTENCE and it does not hold THE TOTALITY: it proves this block has not moved and its text has not changed, and it proves nothing whatever about any other sentence in the kit. THE DIRECTION IS FAIL-OPEN, AND IT IS DERIVED HERE RATHER THAN INHERITED FROM RESEARCH. `BannedClaimGroup` in `scripts/check-banned-claims.ts` was read at this plan's commit and holds EXACTLY THREE members — `standard-name`, `token-economy` and `comprehension` — across 22 pinned literals. THERE IS NO COST GROUP AND NO COST LITERAL. So a sentence asserting that a tier assignment saves money, lowers spend or extends a usage limit passes every gate in this repository today: green, with the file that carries it never named. That is the fail-open direction, and it is DISCLOSED rather than implied by the presence of a registry row. THE DECLINING DECISION IS `D-16`, AND ITS REASON IS ON THE RECORD RATHER THAN LEFT AS TASTE. A fourth group was considered and refused. `scripts/check-banned-claims.ts`'s own header demands an ADMISSION MEASUREMENT before any literal is added — candidate literals run over the derived document corpus with per-file hits recorded, and any literal striking live correct text refused — and the measurements that module keeps are why the answer was no: a six-stem conformance list was defeated by four ordinary English verbs (`follows`, `meets`, `adheres to`, `is written in`, each ZERO findings with the planted file never named), and the seven-stem verb list that replaced six comprehension substrings was defeated by five phrasings in the next round. Phase 29's eight-round record is that a literal list over free prose buys ONE AXIS PER ROUND and ships a new residual each time, and `D-59` settled the shape: an open-set totality is not a decidable predicate, so it is held as CONTENT with a disclosed backstop rather than as one more widening of a matcher. WHAT REMAINS MECHANICAL, stated so the split is legible: MODEL-07 has two halves and only the totality half is content-held. The DISPUTABILITY half is a type and a check — `D-10` makes `rationale` a REQUIRED field on every `TIERED` row in `scripts/model-tiers.ts`, a row written without one does not compile (TS2741, demonstrated in plan 29.1-01), and a row whose reason is BLANKED fails generation, proven RED BY STEM NAME in plan 29.1-02's discrimination proof (c). The PRECISION half is that `scripts/measure-cost.ts` and its committed `.js` are BYTE-UNCHANGED across this phase — its standing `UNKNOWN - verify` remains the honest answer and no measurement was taken (`D-14`) — and that every `TIERED` rationale is asserted at run time to carry no digit, so a price or a percentage cannot enter that field without a red case. WHERE THIS CLAIM SITS, AND WHY THAT IS THE STRONGER PLACE: the block is OUTSIDE `check-banned-claims`'s one named exemption region, so its bytes are SCANNED by that gate rather than exempted from it. It earns no carve-out because it needs to name no banned topic to make its denial. THE RESIDUAL, NAMED: a refusal is not a closure. This axis carries an id because the fail-open direction above is OPEN, not because anything closed it.

```
grugops ships a per-role model dial, and every tier it assigns is a quality decision about what a
thinner model would degrade past for that role. The kit makes no claim that any tier assignment
reduces cost, lowers spend, or extends a usage limit. No such saving has been measured here, and no
figure for one is published anywhere in this kit. Any future statement of one carries
`UNKNOWN - verify` until `scripts/measure-cost.ts` produces a real capture.
```

### C-28-048

- file: docs/how-it-works.md
- line: 31
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21) on the new mechanics page. One assertion: every request reaches the Orchestrator first. Measured against `agent-factory/roles/orchestrator.md` § Activates when, which reads `Any incoming request — every /grugops starts here.`, and against `AGENTS.md` line 11, `All work starts with the Orchestrator`. The second sentence quotes the role file's own wording, so the claim is about what the kit text says; whether a host session follows that route on a live run is the open gap the page's § Open gaps names (C-28-055).

```
Every request goes to the Orchestrator first. Its role file says so in one line: any incoming request activates it.
```

### C-28-049

- file: docs/how-it-works.md
- line: 38
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Three assertions, each measured against kit text. The role file tells the Orchestrator never to do a task's work: `agent-factory/roles/orchestrator.md` § Hard limits, `It never claims with itself as owner and never does a task's work. Where the Agent tool does not exist, it does the work only after a role switch.` It hands each subtask to a role agent where it can spawn: `agent-factory/workflows/17-task-claim.md` step 4. It switches role where it cannot: the same step 4 and `agent-factory/roles/_role-switch-protocol.md`. The sentence says the role file TELLS it, so it claims an instruction, not a mechanical refusal; no code stops an Orchestrator doing the work.

```
The Orchestrator's role file tells it never to do a task's work itself. On a host where it can start other agents, it hands each subtask to a role agent. On a host where it cannot, it switches into the role first, by the [role-switch protocol](../agent-factory/roles/_role-switch-protocol.md), and does the work as that role.
```

### C-28-050

- file: docs/how-it-works.md
- line: 45
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Two assertions. The claim is atomic and a lost race prints `lost`: `scripts/claim.ts` `claimTask` makes `claimed/<task>` with a non-recursive `mkdirSync`, a second claimant gets `EEXIST` and the claim is lost, not an error; `agent-factory/workflows/17-task-claim.md` step 3 tells the Orchestrator to take the next pending task on a `lost <task>` line. `claim.js done` refuses while no sealed note was written since the claim: `scripts/runnable-ref/claim.ts` prints `not-done <task>: no sealed note in ... since <at>` and exits 1, and Workflow 17 step 7 states the same refusal.

```
A claim is atomic: when two claims race for one subtask, one wins, the other prints a `lost` line, and the Orchestrator takes the next task. When the role finishes, `claim.js done` moves the subtask to `done/`, and it refuses while the task's context folder holds no sealed note written since the claim.
```

### C-28-051

- file: docs/how-it-works.md
- line: 52
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Measured against `agent-factory/workflows/16-context-read-write.md` and `agent-factory/workflows/17-task-claim.md`. `note.js read` prints each sealed note in full: WF16 step 1. `note.js add` is the host copy of `context-io.ts` `appendNote`, the one sanctioned writer: WF17 step 6 and WF16 step 3. A note written by any other route is refused on read as `unsealed`: WF16 step 3. A `finding` is admitted only with a `§14-gate#<id>` or `human:<name>` stamp: WF16 step 3, and `context-io.ts` hard-rejects a stampless finding per WF16 step 4; `only` is a necessary condition, and the page does not claim every stamped finding is admitted (scripted hosts refuse gate stamps, WF16 step 3, residual R-41-10). The honest degrade to a `claim` with `confidence: UNKNOWN - verify`: WF16 step 4. Roles do not pass data to each other: WF17 step 6, `Coordination is ONLY through the on-disk substrate — never relay data agent-to-agent`, and `orchestrator.md` § Hard limits, `Never relay data between agents`.

```
A role agent starts by reading the shared verified context for its task with `node tools/grugops/note.js read <folder>`, which prints each sealed note in full ([Workflow 16](../agent-factory/workflows/16-context-read-write.md)). It does its one job, then records what it found with `note.js add`, the host copy of `context-io`, the one sanctioned writer of the shared context. A note written any other way, by an editor, a file-writing tool or a heredoc, is refused on read as `unsealed`. A `finding`, a verified result, is admitted only with a real stamp: a green gate verdict or a named human. A softer result goes in as a `claim` or an `observation`, and an unverified one carries `confidence: UNKNOWN - verify`. Roles do not pass data to each other: the next role reads what the last one published.
```

### C-28-052

- file: docs/how-it-works.md
- line: 57
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Measured against `agent-factory/workflows/05-pr-quality-gate.md` and `agent-factory/roles/orchestrator.md`. The Orchestrator runs the gate before a ticket advances: orchestrator.md § Responsibilities item 7. The read-only git-host check runs first, then the order `install -> lint -> typecheck -> unit -> build -> uat-spec-integrity -> e2e -> test-integrity`: WF05 step 3; the end-to-end lane and the spec-integrity step both ride `quality.ui_e2e`. The bounded self-fix budget, `self_fix_attempts`, default `2`, then a human: WF05 step 4 and `agent-factory/config/factory.config.md`. Exactly one terminal result of three: WF05 step 5. The gate never merges and hands the change to a person: WF05 § Agents involved, `The Orchestrator recommends; it never auto-merges`, and WF05 step 6, `This step is human-only`. The sentence is about the gate's own steps; it asserts no merge outcome on a repository, which C-28-054 and docs/GUARANTEES.md cover.

```
Before a ticket advances, the Orchestrator runs the [PR quality gate](../agent-factory/workflows/05-pr-quality-gate.md). It first runs a read-only check of the git host's branch protection, then install, lint, typecheck, unit tests, build and the end-to-end checks the config turns on, then a test-integrity check on skipped tests. When a check fails, the agent gets a small, fixed number of self-fix attempts (`self_fix_attempts`, two by default), then stops and hands the problem to a person. The gate ends in exactly one result: `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX` or `SPLIT_REQUIRED`. That result is a recommendation. The gate itself never merges: its last step hands the change to a person.
```

### C-28-053

- file: docs/how-it-works.md
- line: 68
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Measured against `agent-factory/workflows/12-release.md` step 6: `Record a named human approval, then a named human confirms the production action. The step is keyed to production_requires_human_confirmation: true. Run node tools/grugops/host-protection.js before the named human confirms the production action.` The sentence is stated at the checkpoint's DEFAULT (`block`, `agent-factory/config/factory.config.md`) and points to docs/GUARANTEES.md for where the checkpoint is held, so lowering the floor does not falsify it; that is why it is `architecture` with no `depends_on`, and not a `safety` row. It describes the workflow's text, not a deploy outcome. RE-MEASURED 2026-11-19 by plan 43.1-07 (phase 43.1 decision D-03, the WR-02 part of deferred item D68). The last sentence said docs/GUARANTEES.md shows where the checkpoint is held `on this repository`; the page is rendered by `scripts/generate-guarantees.ts` from the grugops source checkout (`DEFAULT_ROOT` is the script's parent directory) and ships in every kit home, so it does not describe the reader's own repository. It now says the page shows where the checkpoint is held in the grugops source checkout at its default settings (the page's § *Where the checkpoints are held* reads `all checkpoints at default`, read 2026-11-19 after `npm run generate:guarantees`), and a new sentence says the reader's own setting is in `.grugops/factory.config.json`, the per-repo config the installer seeds (`install/README.md`, `Per-repo, writable state`). No command is claimed to report the reader's own setting; whether one does is `UNKNOWN - verify`. The workflow measurement above is unchanged, so the row stays `true`. `line` stays 68.

```
Step 6 is the human step, and it is keyed to the `production_requires_human_confirmation` checkpoint. At that checkpoint's default, the workflow records a named person's approval, runs the read-only git-host check, and waits for a named person to confirm the production action. [GUARANTEES.md](GUARANTEES.md) shows where that checkpoint is held in the grugops source checkout at its default settings. Your own setting is in `.grugops/factory.config.json`.
```

### C-28-054

- file: docs/how-it-works.md
- line: 73
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). It names where each control lives and asserts no merge or deploy outcome, so it is `architecture`, not `safety`. The workflows and role files tell agents to stop at a pull request and leave merge and deploy to people: `agent-factory/roles/orchestrator.md` § Hard limits and `agent-factory/workflows/05-pr-quality-gate.md` step 6. That this is prose that holds only as well as an agent follows it: docs/GUARANTEES.md § Where each floor is enforced, `Prose is the role and workflow text an agent reads; it is a written rule and nothing more.` The git host is the hard floor, through branch protection or rulesets and deployment environments with required reviewers: the same section and `install/README.md` § 5 (a). The Claude Code ask rules are a speed bump written by the standalone installer, not a security boundary: `install/README.md` § 5 (b) and CLAUDE.md § Constraints, Safety (hard). RE-MEASURED 2026-11-19 by plan 43.1-07 (phase 43.1 decisions D-03 and D-04; deferred items D68 (WR-02) and D693). (1) D-04: `That is the hard floor.` now continues `and for a deploy it holds only when the deploy credentials live solely in the production environment's secrets`, measured against docs/GUARANTEES.md § Where each floor is enforced and `install/README.md` § 5 (a) with its production checklist item `keeps the deploy credentials to itself`, which carry the same condition since plan 43.1-05 (read 2026-11-19 with `grep -n "deploy credentials live solely in"`). (2) D-03: the last sentence said docs/GUARANTEES.md shows which safety claims hold `on this repository`; the page is rendered by `scripts/generate-guarantees.ts` from the grugops source checkout (`DEFAULT_ROOT` is the script's parent directory) and ships in every kit home, so it does not describe the reader's own repository. It now says the page covers the grugops source checkout at its default settings, and a new sentence says the reader's own floors are set in `.grugops/factory.config.json`. No command is claimed to report them (`UNKNOWN - verify`). The block still names where each control lives and asserts no merge or deploy outcome, so it stays `architecture` and `true`.

```
The workflows and role files tell agents to stop at a pull request and to leave merge and deploy to people. That is written text, and it holds only as well as an agent follows it. What stops a merge or a deploy mechanically is set on your git host: branch protection or rulesets on protected branches, and deployment environments with required reviewers for production. That is the hard floor, and for a deploy it holds only when the deploy credentials live solely in the production environment's secrets. On Claude Code, the standalone installer also writes ask rules, so the CLI asks before the usual merge and deploy commands; they are a speed bump, not a security boundary. [GUARANTEES.md](GUARANTEES.md) shows which safety claims hold in the grugops source checkout at its default settings. Your own floors are set in `.grugops/factory.config.json`.
```

### C-28-055

- file: docs/how-it-works.md
- line: 94-96
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21, D-22). Three list items registered as one slice, because an anchor between two list items would split the rendered list. Item 1 is the GAP-D1 sentence, byte for byte the `GAP_D1_SENTENCE` that `scripts/check-story-docs.ts` requires on any public page that says parallel; parallel scheduling up to `queue.wip_limit` on a host with a spawn tool is measured against `agent-factory/workflows/17-task-claim.md` steps 2 to 4 and `install/README.md` § 6 Full, and the own-session capture stays `UNKNOWN - verify`. Item 2: `install/README.md` § 6 Degraded names the same five hosts as having no host spawn mechanism this kit uses, and the coordinator drains the queue at concurrency one through the role-switch protocol. Item 3: each of the five `Using grugops on` sections of `install/README.md` states that whether the session follows the route to the Orchestrator on a live run is `UNKNOWN - verify`, and records which launch forms a person checked live.

```
- Role agents run in parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1).
- Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi have no spawn tool this kit uses, so the Orchestrator loads the roles there one at a time, in one session.
- Whether a session on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI or Pi follows the route from its entry file to the Orchestrator on a live run is `UNKNOWN - verify`. The [install guide](https://github.com/abitwise/grugops/blob/main/install/README.md) says what a person checked live on each host.
```

### C-28-056

- file: docs/concepts.md
- line: 8
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21) on the core-concept page. Three assertions. Each role file carries one job, what it reads, what it writes, its board moves and its hard limits: `scripts/validate-agent-factory.ts` `ROLE_SECTIONS` requires `## One job`, `## Reads`, `## Output`, `## Board moves` and `## Hard limits` (among others) in every role file `kit-model.listRoles()` returns. The Orchestrator draws on the roles the work needs: `agent-factory/roles/orchestrator.md` § Responsibilities items 3 to 6 and its routing matrix; the named areas are examples, `among others`, and no count is typed. Every role has a reference page with its one job and a link to its role file: `scripts/generate-catalog.ts` writes `docs/reference/agents/<stem>.md` for every `listRoles()` member with the one-job text and the role-file link, and `npm run freshness:catalog` holds the pages to a fresh regeneration. The wording holds both before and after plan 43-14 widens those pages.

```
Each role is one markdown file with one job, the files it reads, what it writes, where it moves work on the board, and the hard limits it must not cross. The Orchestrator splits each request into subtasks and draws on the roles the work needs: business analysis and product, system analysis, architecture and design, engineering, QE and end-to-end tests, security, compliance, UAT and release, among others. The [reference](reference/README.md) has a page for every role, with its one job and a link to its role file.
```

### C-28-057

- file: docs/concepts.md
- line: 15
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Measured against `agent-factory/roles/orchestrator.md` § Hard limits (`Never relay data between agents; the shared verified context is the only channel`), `agent-factory/workflows/17-task-claim.md` step 6 (`Coordination is ONLY through the on-disk substrate`), `agent-factory/workflows/16-context-read-write.md` steps 1, 3 and 4, and `agent-factory/contracts/context-note.md` § The six note kinds, which lists exactly `claim`, `finding`, `decision`, `failed-attempt`, `observation` and `artifact-ref`. The sanctioned writer and the `unsealed` refusal: WF16 step 3. A stampless `finding` is hard-rejected and never silently rewritten, and a soft result goes in as a `claim` or `observation`: WF16 steps 3 and 4. The sentence defines `verified` as checked at admission and does not say every note is a proven result, which the `claim` kind would contradict.

```
The shared verified context is the only memory between roles. Roles do not hand data to each other: a role reads the notes for its task before it starts, and publishes typed notes when it is done. Each note is one of six kinds: a `finding`, a `claim`, a `decision`, a `failed-attempt`, an `observation` or an `artifact-ref`. A note enters the context only through the sanctioned writer, and a note written any other way is refused on read. "Verified" means the writer checks each note on the way in: a `finding` without a real stamp from a green gate run or a named person is refused, and a softer result is recorded as a `claim` or an `observation` instead of passing as a finding.
```

### C-28-058

- file: docs/concepts.md
- line: 22
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). The board's location and that the column is the status: the same measurement as C-28-033's board bullet, `install/state-layout.ts` `BOARD_REL` = `memory-bank/plans/board.md`. Per-column limits: `agent-factory/config/factory.config.md` § `wip_limits` sub-fields, ten columns from `Ready` to `Ready to Release`. The Orchestrator's rule: `agent-factory/roles/orchestrator.md` § Hard limits, `Never pull past a WIP limit or exceed the queue width without a written reason`; the sentence keeps the written-reason exception and says the role file TELLS it, an instruction, not a mechanical refusal.

```
The board, `memory-bank/plans/board.md`, is a markdown file in your repository. Each ticket sits in one column, from Ready to Done, and the column is its status. Each column has a work-in-progress limit, set by `wip_limits` in the config, and the Orchestrator's role file tells it never to pull work past one without a written reason.
```

### C-28-059

- file: docs/concepts.md
- line: 29
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). Measured against `agent-factory/workflows/05-pr-quality-gate.md`. The checks and their source: step 3, order `install -> lint -> typecheck -> unit -> build -> uat-spec-integrity -> e2e -> test-integrity`, with `The commands come from the root AGENTS.md command slots — they are never invented`. The unknown-command sentence quotes step 3: `If a command is unknown, the gate records UNKNOWN - verify rather than faking a pass.` The bounded self-fix budget, then a person: step 4 and `self_fix_attempts` in `agent-factory/config/factory.config.md`. A recommendation, not a merge: § Agents involved, `The Orchestrator recommends; it never auto-merges`, and step 6.

```
The gate is the PR quality gate. It runs your repository's own checks, install, lint, typecheck, unit tests, build and the end-to-end checks the config turns on, with the commands taken from `AGENTS.md`. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. A failing check sends the work back: the agent gets a small, fixed number of self-fix attempts, then stops and hands the problem to a person. The gate's result is a recommendation for a person, not a merge.
```

### C-28-060

- file: docs/concepts.md
- line: 36
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-09 (D-08, D-21). It names where each control lives and how strongly it holds, and asserts no merge or deploy outcome, so it is `architecture`, not `safety`; the opening is stated as design intent (`is designed so that`) and is measured against CLAUDE.md § Core Value, not against a floor. Stop at a pull request and leave review and merge to a person: `agent-factory/roles/orchestrator.md` § Hard limits and `agent-factory/workflows/05-pr-quality-gate.md` step 6. The release sentence is stated at the checkpoint's default, as C-28-053 is: `agent-factory/workflows/12-release.md` step 6, keyed to `production_requires_human_confirmation`, so lowering that floor does not falsify it. Written rules only: docs/GUARANTEES.md § Where each floor is enforced, `Prose ... is a written rule and nothing more`. The hard floor is the git host, and grugops never configures it: the same section (`grugops never configures the git host`) and `install/README.md` § 5 (a). The ask rules are a speed bump, not a security boundary: `install/README.md` § 5 (b) and CLAUDE.md § Constraints, Safety (hard). The page avoids the word `always`, the word C-28-023 measured `overstated`.

```
grugops is designed so that people make the merge and release decisions. The role files and workflows tell agents to stop at a pull request and leave the review and the merge to a person. A release waits for a named person's approval and a named person's confirmation of the production action, at the default setting of the `production_requires_human_confirmation` checkpoint. Those are written rules, and they hold only as well as an agent follows them. The hard floor is your git host: branch protection or rulesets on protected branches, and deployment environments with required reviewers for production. grugops never configures your git host; you set those protections yourself. On Claude Code, the standalone installer also writes ask rules, so the CLI asks before the usual merge and deploy commands; they are a speed bump, not a security boundary.
```

### C-28-061

- file: docs/usage.md
- line: 65
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). On Claude Code each of the seven skills has its own command: `.claude/skills/` holds the dash-standalone skills `grugops`, `grugops-map`, `grugops-plan`, `grugops-ticket`, `grugops-gate`, `grugops-uat` and `grugops-release`, and `skills/` holds their plugin twins, generated by `scripts/generate-skill-twins.ts` and held equal by `npm run freshness:skill-twins`. On every other host a skill other than the dispatcher has no command of its own: `scripts/generate-catalog.ts` writes each `docs/reference/skills/<op>.md` § Invocation from `install/host-tools.ts` `HOST_TOOLS`, prefixing a non-Claude-Code row with `Through the dispatcher: `, and the page says to start the dispatcher and ask for the work. Each command in the list under the fence links that page. The start table it links is § Start a session on the same page.

```
On Claude Code each grugops skill has its own command. On another host, start grugops from the [start table](#start-a-session) and name the job in your request; the page linked after each command below shows how to start that skill on each host.
```

### C-28-062

- file: docs/usage.md
- line: 113
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). Stated at the checkpoint's default, as C-28-053 is, so lowering the floor does not falsify it. `agent-factory/workflows/01-bootstrap-brownfield.md` § Stop conditions: Security/NFR returns `BLOCKED` on a high-risk finding -> stop, `Do not cut first tickets that build on a blocked risk; resolve the finding first`, `checkpoint: proceed_past_blocked_risk`; `agent-factory/config/factory.config.md` gives that checkpoint the default `block`. The second sentence: workflow 01's `The repo cannot be mapped ... stop and request access or context` and `agent-factory/workflows/00-bootstrap-greenfield.md`'s `The idea is too vague to map — stop and request the missing clarity from the requester`.

```
**Where you step in:** if the high-risk scan of an existing repository returns `BLOCKED`, the run stops, and no first ticket that builds on that risk is cut until it is resolved, at the default setting of the `proceed_past_blocked_risk` checkpoint. If the idea or the repository is too unclear to map, the run stops and asks you for what is missing.
```

### C-28-063

- file: docs/usage.md
- line: 131
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). `agent-factory/workflows/02-idea-to-epics.md` § Stop conditions: `The idea is too vague to scope — stop and request the missing clarity from the requester. Do not invent the user, the pain, or the value.` `agent-factory/workflows/03-epic-to-tickets.md` step 6: `A ticket sized XL is not pulled into dev — emit SPLIT_REQUIRED and split it first`, and `agent-factory/workflows/07-backlog-refinement.md` step 4: `no XL ticket enters dev`.

```
**Where you step in:** if the idea is too vague to scope, the run stops and asks you for the user, the pain or the value instead of inventing them. A ticket sized `XL` is marked `SPLIT_REQUIRED` and goes back for splitting before development.
```

### C-28-064

- file: docs/usage.md
- line: 149
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). Stated as what the workflow tells the agent and at the checkpoint's default, as C-28-053 and C-28-060 are, so it asserts no merge outcome and lowering a floor does not falsify it. `agent-factory/workflows/04-ticket-to-pr.md` § Done condition: `the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.` Its § Stop conditions: the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix -> `A named human confirms the Tech Lead's move before the ticket leaves Blocked`, `checkpoint: exhaust_self_fix_budget`, whose default in `agent-factory/config/factory.config.md` is `block`.

```
**Where you step in:** the workflow tells the agent to open a branch and a pull request and to stop there; you review and merge. If the gate still fails after its self-fix attempts, a named person confirms the Tech Lead's next move before the ticket leaves `Blocked`, at the default setting of the `exhaust_self_fix_budget` checkpoint.
```

### C-28-065

- file: docs/usage.md
- line: 176
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). `agent-factory/workflows/05-pr-quality-gate.md` step 6: `A human reviews the PR against agent-factory/checklists/pr-review-checklist.md. A human merges.`, and its § Done condition: `This workflow emits a recommendation that a human reviews; it never auto-merges and never deploys.` The sentence asserts what the gate produces and who decides, not that a merge happens, as C-28-059 does.

```
**Where you step in:** the result is a recommendation for a person, not a merge: you review the pull request against `agent-factory/checklists/pr-review-checklist.md` and decide whether to merge it.
```

### C-28-066

- file: docs/usage.md
- line: 200
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). Stated at the checkpoint's default. `agent-factory/workflows/06-uat-pack.md` step 5 (`Obtain the named human's signoff on the scenarios`) and § Stop conditions: `The acceptance criteria are missing or ambiguous — stop and route the ticket back; never self-sign or fake a pass. A named human signoff is required.`, `checkpoint: sign_off_acceptance`, whose default in `agent-factory/config/factory.config.md` is `block`.

```
**Where you step in:** a named person signs off on the scenarios, at the default setting of the `sign_off_acceptance` checkpoint. If the acceptance criteria are missing or unclear, the run stops and sends the ticket back; the workflow tells the agent never to sign off for you.
```

### C-28-067

- file: docs/usage.md
- line: 214
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). Stated at the checkpoint's default, in the words of the release sentence of C-28-060, so lowering the floor does not falsify it and it names no deploy outcome. `agent-factory/workflows/12-release.md` step 6 (`Record a named human approval, then a named human confirms the production action. The step is keyed to production_requires_human_confirmation: true`) and its § Agents involved: `The Release Manager prepares the release and requires approval; it never deploys prod itself.` The link names docs/GUARANTEES.md, where the enforcement of each floor is joined to the live checkpoint matrix.

```
**Where you step in:** a release waits for a named person's approval and a named person's confirmation of the production action, at the default setting of the `production_requires_human_confirmation` checkpoint; the Release Manager prepares the release and does not deploy production. See [the safety guarantees](GUARANTEES.md) for where each control is enforced.
```

### C-28-068

- file: docs/usage.md
- line: 241
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-10 (D-09, D-21). `agent-factory/workflows/09-daily-sweep.md` step 7 (escalate anything blocked longer than `factory.config.json#blocked_escalation_days`, move its row into `Blocked`, name the blocker) and § Stop conditions: escalate it `and raise it for a human to clear`, `checkpoint: escalate_stale_blocker`; `A WIP limit is already breached — do not recommend a new pull into that column`, `checkpoint: exceed_wip_limit`. Both checkpoints default to `block` in `agent-factory/config/factory.config.md`.

```
**Where you step in:** a ticket blocked longer than `blocked_escalation_days` moves to `Blocked` with its blocker named and is raised for a person to clear, and the sweep recommends no new pull into a column whose WIP limit is already breached.
```

### C-28-069

- file: README.md
- line: 10
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-11 (D-01, D-02). The tagline names three parts the kit ships. `Specialist agents`: `agent-factory/roles/` holds 19 role files, each with a `## One job` section, and `agent-factory/roles/orchestrator.md` § One job routes each subtask "to the right role agent over the shared queue". `Shared context`: Workflow 16 (`agent-factory/workflows/16-context-read-write.md`) is the shared verified context roles read before work and publish typed notes to, and the Orchestrator's § Hard limits says "the shared verified context is the only channel". `Coordinated work`: one Orchestrator splits each request into subtasks, and Workflow 17 (`agent-factory/workflows/17-task-claim.md`) is the queue it claims them on. It states no merge or deploy outcome, no count and no cost, token or speed benefit.

```
# grugops — Specialist agents. Shared context. Coordinated work.
```

### C-28-070

- file: README.md
- line: 13
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-11 (D-01, D-02). Four sentences, each measured against the kit. (1) `a team of specialist roles for software delivery` on the coding agent you already use: the roles under `agent-factory/roles/` span business analysis through release, and the installer lays an adapter for each host in `install/host-tools.ts` `HOST_TOOLS`. (2) `agent-factory/roles/orchestrator.md` § One job ("Decompose each request into subtasks and route each to the right role agent over the shared queue"); its § Hard limits says it claims a queue task only at dispatch and only in the name of the adapter it starts, per Workflow 17 (`agent-factory/workflows/17-task-claim.md`); `one job within hard limits` is the `## One job` and `## Hard limits` section every one of the 19 role files carries; `publishes what it found as notes to a shared verified context` is Workflow 16 (`agent-factory/workflows/16-context-read-write.md`). (3) Workflow 5 (`agent-factory/workflows/05-pr-quality-gate.md`): "The Orchestrator recommends; it never auto-merges"; Workflow 4 (`agent-factory/workflows/04-ticket-to-pr.md`) § Done condition: "the agent opens a branch and a PR; it never merges. Humans hold merge and deploy." The sentence says what the workflows tell the agent; it asserts no merge or deploy outcome, and docs/how-it-works.md § A person merges and deploys (C-28-054) names the git host as the hard floor. (4) Role, workflow, board (`memory-bank/plans/board.md`) and trace (`memory-bank/plans/traceability/`) files are markdown. No sentence states a count, a cost, token or speed benefit.

```
grugops gives the coding agent you already use a team of specialist roles for software delivery. One Orchestrator splits each request into subtasks on a shared queue and claims each one for a role agent, which does one job within hard limits and publishes what it found as notes to a shared verified context. A quality gate checks the work and makes a recommendation, and the workflows stop at a pull request and leave merge and deploy to a person. The roles, workflows, board and trace are plain markdown files you can read and diff.
```

### C-28-071

- file: docs/faq.md
- line: 11-15
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-12 (D-21, D-22). Each sentence measured against the kit. (1) Runs on the coding agent you already use: the installer lays an adapter per host in `install/host-tools.ts` `HOST_TOOLS` and ships no runtime of its own (CLAUDE.md § Constraints, Tech stack). (2) One markdown file per role with one job and hard limits: every one of the 19 files under `agent-factory/roles/` (the `_role-switch-protocol.md` helper aside) carries `## One job` and `## Hard limits`, as C-28-070 measured. (3) Roles do not hand data to each other: `agent-factory/roles/orchestrator.md` § Hard limits, "Never relay data between agents; the shared verified context is the only channel", and Workflow 16 (`agent-factory/workflows/16-context-read-write.md`), as C-28-057 measured on docs/concepts.md. (4) The board is `memory-bank/plans/board.md` and the trace is rendered into `memory-bank/plans/traceability/`, both in the target repository. The answer names no other framework, no host count, and no cost, token or speed benefit.

```
Q: How is it different from other agent frameworks?
A: It runs on the coding agent you already use instead of replacing it. Each role is one markdown
   file with one job and hard limits, so you can read the rules an agent was given. Roles do not
   hand data to each other; they read and publish notes in the shared verified context. The board
   and the trace are files in your repository, so you can review them like any other change.
```

### C-28-072

- file: docs/faq.md
- line: 24-35
- kind: architecture
- depends_on: —
- status: true
- mechanism: Added by plan 43-12 (D-21, D-22). It replaces the old answer's unqualified sentence that agents never merge a protected branch or deploy prod on their own (last at `f41f49c8`). It names where each control lives and asserts no merge or deploy outcome, so it is `architecture`, not `safety`, as C-28-054 and C-28-060 are. `enterprise` mode runs the release and incident workflows: `agent-factory/workflows/12-release.md` and `agent-factory/workflows/13-incident.md` (`tier: enterprise`, "it runs whenever `mode=enterprise`"); `mode` is a key of `agent-factory/config/factory.config.md`. Security and compliance roles: `agent-factory/roles/security-nfr.md` and `agent-factory/roles/compliance-officer.md`. The release waits for a named person's approval at the checkpoint's default: Workflow 12 step 6 and § Failure handling, keyed to `production_requires_human_confirmation`, so lowering that floor does not falsify the sentence. The trace links each requirement to its code, tests and release: `memory-bank/plans/traceability/` files rendered by `tools/grugops/trace-render.js` with the requirement → ticket → code → test → UAT → release link shape (as C-28-033 measured), and Workflow 12, "Every shipped change then traces back through its UAT, test, and implementation refs to its product ticket". Reworded in plan 43-12's reader review from one long list sentence into four shorter ones; no fact changed. Stop at a pull request and leave merge and deploy to people: `agent-factory/roles/orchestrator.md` § Hard limits and `agent-factory/workflows/05-pr-quality-gate.md` step 6. Written rules only: docs/GUARANTEES.md § Where each floor is enforced. The hard floor is the git host, and grugops never configures it: the same section and `install/README.md` § 5 (a). The answer avoids the word `always`, the word C-28-023 measured `overstated`. RE-MEASURED 2026-11-19 by plan 43.1-07 (phase 43.1 decisions D-03 and D-04; deferred items D68 (WR-02) and D693). (1) D-04: after the hard-floor sentence a new sentence says `For a deploy, that floor holds only when the deploy credentials live solely in the production environment's secrets.`, measured against docs/GUARANTEES.md § Where each floor is enforced and `install/README.md` § 5 (a), which carry the same condition since plan 43.1-05 (read 2026-11-19 with `grep -n "deploy credentials live solely in"`). (2) D-03: the last sentence said docs/GUARANTEES.md shows which safety claims hold `on this repository`; the page is rendered by `scripts/generate-guarantees.ts` from the grugops source checkout (`DEFAULT_ROOT` is the script's parent directory) and ships in every kit home, so it does not describe the reader's own repository. It now says the page covers the grugops source checkout at its default settings, and a new sentence says the reader's own floors are set in `.grugops/factory.config.json`. No command is claimed to report them (`UNKNOWN - verify`). The answer still names where each control lives and asserts no merge or deploy outcome, so it stays `architecture` and `true`. `line` was 24-33 and is now 24-35.

```
Q: Is it serious enough for enterprise use?
A: It has the parts a regulated team asks for. The config dial's `enterprise` mode runs the release
   and incident workflows, and there are security and compliance roles. A release waits for a named
   person's approval at the default checkpoint setting, and the trace links each requirement to its
   code, tests and release. The role files and workflows tell agents to stop at a pull request and
   to leave merge and deploy to people. Those are written rules, and they hold only as well as an
   agent follows them. The hard floor is your git host: branch protection or rulesets on protected
   branches, and deployment environments with required reviewers for production. For a deploy,
   that floor holds only when the deploy credentials live solely in the production environment's
   secrets. grugops never configures your git host; you set those protections yourself.
   [GUARANTEES.md](GUARANTEES.md) shows which safety claims hold in the grugops source checkout at
   its default settings. Your own floors are set in `.grugops/factory.config.json`.
```

### C-28-073

- file: docs/usage.md
- line: 29
- kind: architecture
- depends_on: —
- status: true
- mechanism: Registered by plan 43-12's reader review (D-22). The paragraph moved byte for byte from README.md in plan 43-10 and was unanchored there too. `claude --agent grugops-orchestrator` makes the Orchestrator the main thread: `install/README.md` § 6, "The main thread itself takes on the coordinator's system prompt and tool restrictions", and Claude Code prints `@grugops-orchestrator` in the startup header. Claude Code enforces the list of role agents it may spawn on that path: the adapter `.claude/agents/grugops-orchestrator.md` carries an enumerated `tools: Agent(grugops-…)` grant, and `install/README.md` § 6 says that grant "is enforced by the runtime — on this path only", and § 6 points to the platform's documentation (`code.claude.com/docs/en/sub-agents`) for the rule. With plain `/grugops` the session is a default one and the list is held by instruction only: the same section's Reduced tier. It states no merge or deploy outcome and no cost, token or speed benefit.

```
Why `--agent`: the Orchestrator is the main thread, and Claude Code enforces the list of role agents the Orchestrator may spawn. With plain `/grugops` the session is a default one, so that list is held by instruction only. `install/README.md` §6 calls these the Full and Reduced tiers.
```

### C-28-074

- file: docs/usage.md
- line: 32
- kind: architecture
- depends_on: —
- status: true
- mechanism: Registered by plan 43-12's reader review (D-22). The paragraph moved byte for byte from README.md in plan 43-10 and was unanchored there too. The `--claude` install writes `.claude/agents/grugops-orchestrator.md`: `install/install.ts` `targetAdapterFiles` maps the derived adapter set into the target's `.claude/agents/`, and the file is committed at that path in this repository's own install. The plugin form ships no agents: `.claude-plugin/plugin.json` declares no `agents` path and the plugin root has no `agents/` folder. The installer never writes the `agent` settings key: `grep -n '"agent"' install/*.ts` (tests excluded) printed nothing on 2026-11-18, so no install code path writes it. Whether that key enforces the same list is `UNKNOWN - verify`, as `install/README.md` § 6 states ("grugops does not write that key, so nothing here depends on the answer").

```
`claude --agent grugops-orchestrator` needs an install that chose Claude Code (`--claude`, or Claude Code ticked in the checkbox list), because that install writes `.claude/agents/grugops-orchestrator.md`. The Claude Code plugin form ships no agents, so it gives the commands only. To start every session in a project this way, you can set `"agent": "grugops-orchestrator"` in your own `.claude/settings.json`. The installer never writes that key, and whether it enforces the same list is `UNKNOWN - verify` (`install/README.md` §6).
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

## A dropped claim is replaced in place (D-18)

`dropped` is the fourth `status` value, added by Phase 30 plan 30-09. A row is `dropped` when a
safety floor it rests on has been **lowered** on this repository, so the public sentence the row
names has stopped being true here.

It is not a measurement verdict like the other three. `true`, `overstated` and `false` record what
an auditor measured a sentence against; `dropped` records that the **configuration moved out from
under a sentence that was standing**. Nothing about the sentence changed — what held it changed.

**The claim is REPLACED IN PLACE, never deleted, struck through or quietly reworded.**

- The **anchor stays** where it was. The registry **row stays**, with its `mechanism` and its
  original fenced verbatim, so the record still shows what was claimed.
- The **anchored text becomes generated disclosure text** naming the checkpoint, the value it is
  held at, its documented default, and the authorizing name. That text is produced by
  `disclosureFor()` in `scripts/generate-guarantees.ts` and is a pure function of the row and the
  live matrix.
- `scripts/check-claim-anchors.js` compares a dropped row's anchored region against **that generated
  text**, not against a string somebody copied into this file, so the published prose and the
  mechanism cannot drift apart. A hand-written disclosure is red.
- The **anchor-to-row bijection and the claim-id contiguity are unchanged** by a drop, in both
  directions. A drop that broke either would be the silent deletion this decision forbids.

**The drop and the matrix must agree in BOTH directions**, enforced by `dropConsistencyRefusals()`:

| The registry says | The live matrix says | Verdict |
|---|---|---|
| `dropped` | every floor the row rests on is at its documented default | **refused** — a retraction of a sentence that is still true |
| not `dropped` | a floor the row rests on is lowered | **refused** — an overstated claim left standing after its mechanism was lowered |
| `dropped` | a floor the row rests on is lowered | green, and the render marks the row **DROPPED** |

One direction alone would let this registry and the checkpoint matrix drift apart in silence, which
is the state the mechanism exists to make impossible.

**Why a `dropped` row carries no `disposition` and no `finding_id`.** Every other non-`true` status
must carry both, because a claim nobody decided about otherwise stays **standing** in a shipped
document. A dropped claim's text has been mechanically replaced, so that obligation is discharged by
a stronger mechanism rather than waived — and reaching `dropped` at all requires lowering a real
floor in the live configuration, which needs a second key the configuration cannot carry.

**As committed by plan 30-09: zero rows are `dropped`.** Nothing on this tree lowers a floor, so
every row below still stands at the status it was measured at. The mechanism is here before it is
needed, which is the only order in which it can be trusted.

## A retired claim leaves the page and keeps its row (D-25)

`retired` is the fifth `status` value, added by Phase 43 plan 43-01. A row is `retired` when the
docs **withdrew** the claim: a rewrite took the sentence off the page on purpose. No safety floor was
lowered and nothing replaces the sentence.

**The row stays; the text goes.**

- The registry **row stays**, with its id, its `mechanism` and its original fenced verbatim, so the
  record still shows what was once claimed. The id is **never reused**: a new sentence gets a new id
  and a new row.
- The claim's **text and its anchor leave** the file the row names. `scripts/check-claim-anchors.js`
  checks both are **absent**: it fails when the verbatim bytes are still in the file, and when a
  `<!-- claim: <id> -->` anchor for the row is still in it. A retired row is left out of the
  anchor-to-row bijection, because it owes the file no anchor.
- The row is judged against its **named file only**. The same sentence in another file is that
  file's business, not this row's.
- A **missing file fails**. A file that does not exist contains no text, so it would prove nothing
  about absence; the row must name the file the text was withdrawn from, as it exists on this tree.
- The `mechanism` gives the **reason and the last commit where the text stood**, as a backticked hex
  token of 7 to 40 characters (for example `` `a067c6e` ``), so `git show <commit>:<file>` still
  shows the withdrawn text. A retired row without one fails.
- The **claim-id contiguity is unchanged**: the row is kept, so its id stays in the sequence.

**A safety row cannot be retired.** Retiring needs no lowered floor and leaves no disclosure, so on
a safety row it would take a `false` or `overstated` safety sentence off a public page with no trace a
reader can see. A safety claim leaves a page only through `dropped`, with the generated disclosure at
its anchor. The gate refuses `retired` on any `kind: safety` row by name.

**Why a `retired` row carries no `disposition` and no `finding_id`.** Those fields exist so a claim
nobody decided about does not stay standing in a shipped document. A retired claim was decided: it
was withdrawn, and the gate checks it is gone. A withdrawn sentence is not a finding, so it carries
no finding id.

**A retired row still counts in its kind's cardinality.** `scripts/check-audit-register.js` counts
every row of each kind, retired ones included, because retiring a row does not delete it.

**As committed by plan 43-01: zero rows are `retired`.** Plan 43-11 retires the first ones when it
removes their text from `README.md`.

**As committed by plan 43-11 task 1: two rows are `retired`,** `C-28-002` and `C-28-003`, the old
tagline and the `grug-brained` sentence the README rewrite removed. **As committed by plan 43-11 task 2: three
rows are `retired`,** adding `C-28-008`, the "Go deep" step the `## Where to go next` list replaced.

## Two-sided completeness (D-14)

Every safety floor has at least one claim mapped to it, and every `kind: safety` claim names at
least one floor. Both directions are asserted at run time by `scripts/check-claim-anchors.js`; the
lists below are the same fact in a form a reader can check.

| Floor | Held by | Claims mapped to it |
|---|---|---|
| `open_pr` | `factory.config.json` `checkpoints.open_pr` (live value `block`) | C-28-001, C-28-010, C-28-023, C-28-032, C-28-038 |
| `test_integrity` | `factory.config.json` `checkpoints.test_integrity` (live value `block`) | C-28-018 |
| `production_requires_human_confirmation` | `factory.config.json` `checkpoints.production_requires_human_confirmation` (live value `block`) | C-28-001, C-28-010, C-28-018, C-28-023, C-28-038 |
| `protected_branch_merge` | `factory.config.json` `checkpoints.protected_branch_merge` (live value `block`) | C-28-001, C-28-010, C-28-018, C-28-023, C-28-032, C-28-038 |

**The `autonomy` floor was RETIRED here, and the rows it backed were not deleted (Phase 30, plan
30-02, D-05/D-06).** Every row above that reads `open_pr` read `autonomy` until this remap. The
scalar was documentary — no hook enforced it — and Phase 30 replaced it with the enforced
per-checkpoint matrix, splitting its `diff | branch | pr` grade into two stops: `commit_to_branch`
(a roster member, not a floor) and `open_pr` (floor-tier). `open_pr` is the floor because stopping
at a pull request is the thing the public "a human holds the merge" sentences actually rest on, and
it is what four of the six `kind: safety` rows assert. C-28-032, which named `autonomy` alone, now
names `open_pr, protected_branch_merge` — the two floors its zero-config-baseline sentence rests on
once the grade is split. **No claim was deleted or struck through by this remap; the anchors and the
audit trail are unchanged.** The claim TEXT is untouched here on purpose — whether any of these
sentences must now be recorded `dropped` is measured separately.

`protected_branch_merge` was recorded above as a **hard limit with no config key** until Phase 30
gave it the cell `checkpoints.protected_branch_merge`. That cell does not make the floor dialable by
an agent: lowering it below `block` needed a second key the config cannot carry — a human-set
session variable the hook read — so a config edit alone changed nothing. **2026-09-26: that
second key and the hook that read it were retired by 33.1 D-17 and D-26.** The cell is now read by
the standalone installer, which writes Claude Code ask rules from it (a speed bump), and the hard
floor for a protected-branch merge is the git host's branch protection (33.1 D-18, D-19).

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
| F-28-201 | C-28-001 | **true** | — | 28-05 — `README.md` drift rewritten; phase 43 F-07 — the `always` sentence reworded to the git-host floor; CLOSED |
| F-28-202 | C-28-003 | **true** | — | 40-10 — role bodies governed by guard_sentence_form; caveman blocks retired in 40-01; CLOSED |
| F-28-203 | C-28-010 | overstated | accepted | 28-05 — `AGENTS.md:6` now agrees with `AGENTS.md:21`; the *"humans decide"* residual is C-28-023's |
| F-28-204 | C-28-012 | **true** | — | 29-05/29-06/29-07 — the D-30 when-absent fallback sentence now stands in the `## Reads` section of 17 of 17 in-set role files; CLOSED |
| F-28-205 | C-28-018 | overstated | accepted | the mechanical guard is Claude-Code-plugin-only; residual named in the row. 2026-09-26: the guard this finding describes was retired by 33.1 D-17 |
| F-28-206 | C-28-021 | **true** | — | 28-05 — the `handoff packet` hit the drift guard reported; CLOSED |
| F-28-207 | C-28-022 | **true** | — | 28-05 — the linear-pipeline claim; CLOSED |
| F-28-208 | C-28-023 | **true** | — | phase 43 F-07 — the `always` sentence reworded to the git-host floor; CLOSED. The residual it named stays row 4 of `docs/audit/28-residual-sizing.md` |
| F-28-209 | C-28-027 | **true** | — | 28-05 — *"the roles, the handoffs, and the gates are identical everywhere"*; CLOSED |
| F-28-210 | C-28-028 | overstated | accepted | KIT-03 / SPAWN-03 / SPAWN-04 are still `[ ]` |
| F-28-211 | C-28-029 | **true** | — | 28-05 — *"same handoffs"*; CLOSED |
| F-28-212 | C-28-032 | **true** | — | 29-05/29-06/29-07 — *"every role falls back"* now measures 17 of 17 in-set role files, against the derived denominator `listRoles()` produces; CLOSED |
| F-28-213 | C-28-038 | overstated | accepted | 28-05 — the manifest `description` was rewritten by hand; **unanchorable**, so no gate catches a future missed flip — see the section above |
| F-28-214 | C-28-033 | **true** | — | 28-05 — a **third** D-10 arrow-chain site, in the § *How work flows* lifecycle bullet, that neither the drift guard nor the task-1 sweep reached; CLOSED |

**Annotation, phase 43 F-07 (2026-11-18) — two findings closed, ADDED rather than substituted.** The counts and the paragraph above the table are dated to 28-05 and stand as written. The human decided in the 43-13 UAT to reword the two anchored `always` safety sentences, C-28-001 and C-28-023. Both now name the git host as the enforcing tier and the Claude Code ask rules as a speed bump, and both rows are measured `true`, so F-28-201 and F-28-208 close. C-28-010 and C-28-038 are unchanged and stay `overstated`; their rows cite the measurement C-28-023 carried before the reword, which is kept in git history at `b991ea34`.

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
| `AGENTS.md` § *Role / workflow files*, the skills precedence line (plan 42-03, D-14) | An imperative addressed to the agent, like the coding rules row above: it tells the agent which text wins over a skill's text. It asserts nothing about what grugops guarantees, refuses or holds. |
| `AGENTS.md` § *Commands* `UNKNOWN - verify` slots | Explicit non-claims by construction — the marker exists to say *nothing is being asserted here*. The rule governing them (`AGENTS.md:40`) is registered as C-28-017. |
| fenced code blocks in both READMEs | Not anchorable without rendering the anchor visibly; covered by the prose rows that introduce them. See § *One claim per anchorable region* item 3. |
