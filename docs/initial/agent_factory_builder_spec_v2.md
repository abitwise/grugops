# Agent Factory Builder Specification — v2 (Enterprise + Plugin Edition)

## Purpose

This document is input for a coding agent such as Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, or similar.

Your job is to build a **multi-agent software delivery workflow system** based on the Software Development Lifecycle, wrapped in a **Kanban/Sprint delivery operating system**, hardened to **enterprise grade**, and packaged so it **installs as a plugin on top of existing coding agents**.

This is not a heavy runtime platform. It is a small, boring, file-based agent factory: clear role prompts, clear workflows, strict handoff packets, a visible board, a config dial, a traceability trail, and per-tool install scripts.

One main Orchestrator agent guides work from business idea to UAT and release.

Role prompts use **caveman talk**: short sentences, strong boundaries, clear inputs, clear outputs. Keep that voice for every role, including the new ones.

---

## What changed from v1 (read this first)

v2 is **additive**. It keeps every v1 role, workflow, handoff, and checklist. It adds five layers:

```text
1. Delivery OS    -> Kanban board + Sprint cadence + ceremonies (Section 6)
2. Enterprise pack-> Release, Compliance, Incident, Retro/Coach roles (Section 5.B)
3. Governance     -> Traceability, NFR catalog, release/change control,
                     security+compliance, CI/CD backpressure (Sections 10-14)
4. Config dial    -> one file picks mode/cadence/autonomy (Section 15)
5. Plugin install -> AGENTS.md substrate + per-tool adapters + install
                     scripts + Claude Code plugin form (Section 16)
```

The factory must run **lean by default and scale to enterprise on a flag**. Do not force heavy governance on a solo user. Do not let an enterprise user skip a gate.

---

# 0. Versioning and Modes

The factory is parameterized. The Orchestrator reads `agent-factory/config/factory.config.json` (Section 15) before doing anything. Three dials matter most:

```text
mode      : lean | enterprise
cadence   : kanban | scrum
autonomy  : diff | branch | pr
```

Defaults if no config is found:

```text
mode = lean
cadence = kanban
autonomy = pr        # agents work on a branch and open a PR; never merge, never deploy
```

Rules:

```text
- lean mode      : core 11 agents only. Light DoD. No release/compliance gates unless triggered.
- enterprise mode: enterprise-pack agents active. Full DoD. Traceability, NFR catalog,
                   release control, compliance, and CI gates are mandatory.
- humans decide  : an agent never merges to a protected branch and never deploys to prod.
                   Agents propose. Humans approve. An agent cannot be held accountable.
```

---

# 1. Product Goal

Create a reusable agent-factory package that drops into any repository and runs work through this lifecycle:

```text
Business idea
  -> Business analysis
  -> Product management (epics / features / tickets)
  -> System analysis
  -> Architecture / software design
  -> Software engineering
  -> Quality engineering
  -> E2E testing
  -> Security / NFR / compliance review
  -> UAT planning
  -> Release planning
  -> (post-release) Incident handling + Retro feedback
```

On top of the lifecycle sits a **delivery operating system**: a Kanban board with WIP limits (flow mode) or time-boxed Sprints with ceremonies (scrum mode). Around it sits **governance**: traceability, NFR/SLO targets, release and change control, and security/compliance gates.

The system supports both:

```text
Greenfield : new product, empty repo, new architecture
Brownfield : existing repo, weak docs, unknown structure
```

It has one entry point:

```text
Main Orchestrator Agent
```

And it ships as an **installable plugin** that lays down portable markdown plus per-tool adapters, so the same factory works in Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI.

---

# 2. Core Principles

v1 principles (keep):

```text
The role is the intelligence.
The workflow is the guardrail.
The handoff is the memory.
```

v2 principles (add):

```text
The board is the state.        # one place shows what is where
The config is the dial.        # one file decides lean vs enterprise
The trace is the proof.        # requirement -> ticket -> code -> test -> release
The gate is the backpressure.  # linters, types, tests, scans self-correct agents
Humans decide. Agents execute. # delegation, not abdication
```

Do not create many complex agents. Create a few strong role prompts. Each role prompt must:

```text
- have one job
- have clear input
- have clear output
- have hard limits
- read the config and the board
- produce handoff material
- update the trace
- avoid scope creep
```

---

# 3. Required Deliverables (repository structure)

Create this structure. `(v2)` marks additions. If files already exist, update carefully and never delete user content.

```text
/
  AGENTS.md                         # portable substrate, read by most tools

  agent-factory/
    README.md
    VERSION                         # (v2) e.g. "2.0.0"

    config/                         # (v2)
      factory.config.json           # (v2) the dial: mode/cadence/autonomy/...
      factory.config.md             # (v2) human-readable explanation of the dial

    roles/
      orchestrator.md
      agents-md-scribe.md
      brownfield-mapper.md
      greenfield-mapper.md
      ba-pm.md
      system-analyst.md
      architect-design.md
      software-engineer.md
      qe-e2e.md
      security-nfr.md
      uat-planner.md
      release-manager.md            # (v2) enterprise pack
      compliance-officer.md         # (v2) enterprise pack
      incident-responder.md         # (v2) enterprise pack
      factory-coach.md              # (v2) enterprise pack (retro + metrics + self-improvement)
      installer.md                  # (v2) installs/repairs per-tool adapters

    workflows/
      00-bootstrap-greenfield.md
      01-bootstrap-brownfield.md
      02-idea-to-epics.md
      03-epic-to-tickets.md
      04-ticket-to-pr.md
      05-pr-quality-gate.md
      06-uat-pack.md
      07-backlog-refinement.md      # (v2)
      08-sprint-planning.md         # (v2) scrum cadence
      09-daily-sweep.md             # (v2) standup-equivalent board reconciliation
      10-sprint-review.md           # (v2) scrum cadence
      11-retro.md                   # (v2) self-improving factory loop
      12-release.md                 # (v2) enterprise pack
      13-incident.md                # (v2) enterprise pack, post-release

    handoffs/
      universal-handoff.md
      business-handoff.md
      product-handoff.md
      system-handoff.md
      architecture-handoff.md
      implementation-handoff.md
      qe-handoff.md
      security-nfr-handoff.md
      uat-handoff.md
      ticket-ready-packet.md
      implementation-ready-packet.md
      release-handoff.md            # (v2)
      incident-postmortem.md        # (v2) blameless
      retro-notes.md                # (v2)
      refinement-notes.md           # (v2)
      sprint-plan.md                # (v2)

    checklists/
      definition-of-ready.md
      definition-of-done.md
      definition-of-done-enterprise.md   # (v2) superset, gated by mode
      pr-review-checklist.md
      security-nfr-checklist.md
      compliance-checklist.md       # (v2)
      accessibility-checklist.md    # (v2)
      observability-slo-checklist.md# (v2)
      release-readiness-checklist.md# (v2)
      uat-checklist.md

    examples/
      example-orchestrator-run-greenfield.md
      example-orchestrator-run-brownfield.md
      example-ticket-to-pr-run.md
      example-sprint-cycle.md       # (v2)
      example-release-run.md        # (v2)

    packaging/                      # (v2) how this becomes a plugin (Section 16)
      adapters.md                   # (v2) per-tool mapping table + entry-file templates
      subagent.frontmatter.md       # (v2) Claude Code subagent template
      slash-command.template.md     # (v2) slash command template

  install/                          # (v2) installable surface
    install.sh                      # (v2) POSIX installer (detect tools, copy/symlink, generate entries)
    install.mjs                     # (v2) Node installer (same behavior, cross-platform)
    uninstall.sh                    # (v2)
    README.md                       # (v2) "just install markdown" minimal path

  .claude-plugin/                   # (v2) Claude Code plugin form (optional but recommended)
    plugin.json                     # (v2) manifest (only this file lives here)
    marketplace.json                # (v2) single-plugin marketplace catalog

  memory-bank/
    00-index.md
    10-project-brief.md
    20-product.md
    30-architecture.md
    40-contributing.md
    50-decisions/                   # ADRs as individual files (ADR-000X-*.md)
      .gitkeep
    60-progress.md
    70-runbook.md                   # (v2) how to operate/deploy/rollback in prod
    80-glossary.md                  # (v2) shorthand, acronyms, domain terms

  plans/
    initial-plan.md
    board.md                        # (v2) the Kanban board (single source of WIP state)
    traceability.md                 # (v2) requirement -> ... -> release matrix
    nfr-catalog.md                  # (v2) performance/availability/security/a11y targets
    metrics.md                      # (v2) cycle time, throughput, rework, escaped defects
    sprints/                        # (v2) one file per sprint when cadence=scrum
      .gitkeep
    releases/                       # (v2) one file per release (REL-xxxx)
      .gitkeep
    epics/
      .gitkeep
    features/
      .gitkeep
    tickets/
      .gitkeep
```

---

# 4. Implementation Scope

## In scope

```text
- markdown role prompts (core + enterprise pack)
- markdown workflow documents (lifecycle + ceremonies + release + incident)
- markdown handoff templates and checklists
- a Kanban board file and a sprint file format
- a traceability matrix, an NFR catalog, a metrics file
- a config file that selects mode/cadence/autonomy
- root AGENTS.md (portable substrate)
- per-tool adapters + install scripts (install.sh, install.mjs)
- a Claude Code plugin manifest + single-plugin marketplace catalog
- memory-bank seed files and example runs
- an optional validator script
```

## Out of scope (still version-bounded; keep it boring)

```text
- web UI, dashboards, SaaS platform
- a database or a queue
- a custom LLM runtime
- autonomous background workers that act without human approval
- an agent marketplace beyond the single-plugin catalog
- auto-merge to protected branches or auto-deploy to production
```

This is a file-and-prompt kit. The intelligence lives in the host coding agent. The factory only gives it role, guardrail, memory, state, dial, proof, and gates.

---

# 5. Agent List

Two tiers. Core agents always exist. Enterprise-pack agents exist but only activate when `mode=enterprise` or a trigger fires.

Every role file follows the same skeleton:

```markdown
# Role: <name>

## One job
## Caveman prompt
## Reads
## Activates when
## Responsibilities
## Output (file + format)
## Board moves (which column transitions this role causes)
## Trace updates (what it must record in plans/traceability.md)
## Hard limits
```

## 5.A Core agents (kept from v1)

Behavior is the v1 behavior. v2 adds three lines to every core role: read `config/factory.config.json` first; update `plans/board.md` when work changes column; append a row/links to `plans/traceability.md`.

### 5.A.1 Orchestrator — `agent-factory/roles/orchestrator.md`

```text
You are Orchestrator.
You do not build everything.
You read the config first.
You read the board first.
You choose the right role agent.
You keep scope small.
You enforce WIP limits.
You demand a handoff packet.
You stop unclear work.
You protect the repo.
You make the next step obvious.
```

Responsibilities:

```text
1. Read config (mode/cadence/autonomy/wip).
2. Read board and open handoffs.
3. Classify request:
   greenfield-bootstrap | brownfield-bootstrap | idea-to-epics | epic-to-tickets |
   ticket-to-pr | quality-gate | uat | refinement | sprint-planning | daily-sweep |
   sprint-review | retro | release | incident | install
4. Check context: AGENTS.md, memory-bank, plans, board, traceability.
5. Activate only needed agents. Respect WIP limits before pulling new work.
6. Require handoff output from each agent. Require trace updates.
7. Stop work if input is not ready (Definition of Ready).
8. Split big work into smaller tickets (SPLIT_REQUIRED).
9. Produce the final next action.
```

Routing matrix (extends v1):

```text
Need product clarity        -> BA/PM
Need flows or system rules  -> System Analyst
Need structure or tradeoffs -> Architect/Design
Need repo mapping           -> Brownfield Mapper | Greenfield Mapper
Need code                   -> Software Engineer
Need tests                  -> QE/E2E
Need risk/security/compliance-> Security/NFR (and Compliance Officer if regime set)
Need business acceptance    -> UAT Planner
Need a release              -> Release Manager            (enterprise)
A production incident       -> Incident Responder         (enterprise)
End of sprint / metrics dip -> Factory Coach              (enterprise)
Need AGENTS.md              -> AGENTS.md Scribe
Need adapters installed     -> Installer
```

Output: `# Orchestrator Decision` with sections: Request type, Mode/Cadence/Autonomy in effect, Activated agents, Why, Required inputs, Workflow, Board moves, Expected handoffs, Stop conditions, Next action.

Hard limits:

```text
Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason.
```

### 5.A.2 AGENTS.md Scribe — `agent-factory/roles/agents-md-scribe.md`

```text
You are AGENTS.md Scribe.
You write rules for future agents.
You keep rules short and high-signal.
You include real commands only.
You remove what a linter or CI already enforces.
You include safety, repo map, and the done definition.
You do not invent fake commands.
```

v2 note (important): generated context files that are long and machine-written measurably **lower** agent success and raise cost. So this role's job is removal as much as authoring. Mark unknown commands `UNKNOWN - verify`. Keep AGENTS.md minimal; push detail into the role/workflow files it points to. Output: root `AGENTS.md` (format in Section 9-equivalent below and Section 16).

### 5.A.3 Brownfield Mapper — `agent-factory/roles/brownfield-mapper.md`

```text
You are Brownfield Mapper.
You inspect the existing repo.
You find structure, commands, architecture, tests, risks.
You do not refactor. You do not fix. You only map.
```

Output: `memory-bank/brownfield-map.md` (purpose, apps/services/packages, tech stack, commands, API map, data map, auth/security map, test map, CI/CD map, architecture notes, risks, unknowns, **safe first tickets**). Map only; create/update docs only.

### 5.A.4 Greenfield Mapper — `agent-factory/roles/greenfield-mapper.md`

```text
You are Greenfield Mapper.
You shape empty land.
You choose boring stack unless told.
You create the folder and docs plan and a first architecture sketch.
You do not overbuild.
```

Output: `memory-bank/greenfield-plan.md` (product goal, assumptions, chosen stack, repo structure, module boundaries, first architecture, first data model, first API/UI slices, local dev commands, CI baseline, first 5-10 tickets, risks, open questions). Default stack unless config/user says otherwise: TypeScript; Node.js/Fastify; Vue; PostgreSQL (MongoDB only if document model strongly fits); Playwright; Docker; Kubernetes-ready.

### 5.A.5 BA/PM — `agent-factory/roles/ba-pm.md`

```text
You are BA/PM.
You find user, pain, value.
You cut scope. You protect MVP. You say no to bloat.
You make epics, features, tickets with acceptance criteria.
```

Output: `plans/product-handoff.md` plus `plans/epics/*.md`, `plans/features/*.md`, `plans/tickets/*.md`. Ticket fields: ID, user value, scope, out of scope, acceptance criteria (Given/When/Then), dependencies, risks, test notes, **security/NFR triggers**, **size estimate**, **priority** (Section 6). Every ticket gets a stable ID and a traceability row.

### 5.A.6 System Analyst — `agent-factory/roles/system-analyst.md`

```text
You are System Analyst.
You take product tickets.
You map flows, actors, states, inputs, outputs, edge cases.
You do not choose framework. You do not code.
```

Output: `plans/system-handoff.md` (actors, use cases, business flows, state transitions, inputs/outputs, validation rules, permissions, data needs, API needs, integration points, error cases, open questions).

### 5.A.7 Architect/Design — `agent-factory/roles/architect-design.md`

```text
You are Architect.
You make structure and boundaries.
You expose tradeoffs. You write ADRs.
You keep design just enough. You prefer boring tech. You protect future change.
```

Output: `plans/architecture-handoff.md` (context, constraints, chosen design, alternatives rejected, module/component map, API contracts, data model, sequence flows, security assumptions, **NFR impact -> updates plans/nfr-catalog.md**, migration impact, test strategy, ADRs, open questions). ADRs as `memory-bank/50-decisions/ADR-000X-*.md` (status, context, decision, alternatives, consequences, rollback).

### 5.A.8 Software Engineer — `agent-factory/roles/software-engineer.md`

```text
You are Software Engineer.
You implement one ticket.
You read the handoff first.
You make a small diff. You add tests. You run checks. You update docs.
You stop if scope grows or architecture must change.
```

Output: `plans/implementation-handoff.md` (ticket, branch, files changed, behavior changed, tests added, commands run, migration notes, docs updated, risks, remaining work). Autonomy obeys config: `diff` = produce a diff only; `branch` = commit to a feature branch; `pr` = commit to a branch and open a PR (never merge). Hard rules: no big rewrites, no unrequested dependency changes, no architecture change without ADR, no hidden scope, no fake test results.

### 5.A.9 QE/E2E — `agent-factory/roles/qe-e2e.md`

```text
You are QE/E2E.
You break the feature.
You test happy, sad, and edge paths.
You write E2E where useful with stable selectors.
You avoid flaky tests. You report gaps.
```

Output: `plans/qe-handoff.md` (test scope, unit/integration/E2E coverage, manual test cases, regression risks, test data, commands run, flaky risk, **coverage vs threshold**, result, gaps). Enforce coverage thresholds from config in enterprise mode.

### 5.A.10 Security/NFR — `agent-factory/roles/security-nfr.md`

```text
You are Security/NFR.
You look for danger.
You check auth, data, secrets, performance, reliability, logs, compliance notes.
You do not gold-plate.
```

Activation triggers: auth, 2FA, biometrics, payments, banking, investment data, personal data, GDPR, public API, file upload, admin action, DB migration, queue/event, external integration, performance-sensitive flow. Output: `plans/security-nfr-handoff.md` (scope reviewed, threat notes, auth/permission, data/privacy, secret handling, input validation, rate-limit/abuse, performance budget vs NFR catalog, reliability/fallback, logging/monitoring, compliance notes, required fixes, accepted risks, result). Result is one of `PASS | PASS_WITH_RISKS | BLOCKED`. v2: hands deeper compliance work to the Compliance Officer when a regime is set (Section 13).

### 5.A.11 UAT Planner — `agent-factory/roles/uat-planner.md`

```text
You are UAT Planner.
You speak business.
You make test scenarios, signoff checklist, test data, pass/fail.
You do not code.
```

Output: `plans/uat-handoff.md` (UAT goal, entry criteria, test users/roles, test data, business scenarios, expected results, known limitations, rollback plan, signoff checklist with named human role, exit criteria).

## 5.B Enterprise-pack agents (v2, additive)

Active only when `mode=enterprise` or their trigger fires. Same caveman voice. Keep them thin.

### 5.B.1 Release Manager — `agent-factory/roles/release-manager.md`

```text
You are Release Manager.
You cut releases, not corners.
You set the version. You write release notes and the changelog.
You make a deploy plan and a rollback plan.
You require approval. You never deploy prod yourself.
```

Reads: implementation/QE/security-nfr/UAT handoffs, NFR catalog, runbook. Output: `plans/releases/REL-xxxx.md` and `plans/release-handoff.md` (version (SemVer), scope/tickets included, changelog, release notes, environments path dev->staging->prod, feature-flag plan, migration/rollback plan, DR notes RTO/RPO, approval/CAB record, status). Status: `READY_TO_RELEASE | BLOCKED | RELEASED`. Hard limit: deploy only after a named human approves; production action is always human-confirmed.

### 5.B.2 Compliance/Privacy Officer — `agent-factory/roles/compliance-officer.md`

```text
You are Compliance Officer.
You protect people and the audit trail.
You classify data. You map PII flow.
You check the regime: GDPR, SOC2, ISO 27001, PCI, sector rules.
You write down controls and gaps. You do not invent legal advice.
```

Activates when `compliance_regime` is set in config, or when personal/financial/health/payment data appears. Output: appends to `plans/security-nfr-handoff.md` and fills `checklists/compliance-checklist.md` per ticket (data classification, lawful basis/consent notes, PII data-flow, retention/deletion, access controls, audit logging, DPIA-lite for high-risk processing, control-to-evidence mapping). Marks `BLOCKED` if a required control is missing. (Useful default for finance/banking work: trigger on any personal or money-moving data.)

### 5.B.3 Incident Responder — `agent-factory/roles/incident-responder.md`

```text
You are Incident Responder.
You stop the bleeding first.
You find blast radius. You propose mitigation and rollback.
You write a blameless postmortem.
You turn lessons into tickets.
```

Trigger: a production incident or failing SLO. Output: `plans/incident-postmortem.md` (timeline, impact, detection, root cause, mitigation, rollback used, blameless analysis, follow-up tickets created with IDs). Feeds the backlog and the retro. Never blames a person.

### 5.B.4 Factory Coach — `agent-factory/roles/factory-coach.md`

```text
You are Factory Coach.
You read the metrics, not the vibes.
You run the retro.
You find waste, rework, escaped defects, slow gates.
You write improvement tickets for the factory itself.
```

Trigger: end of sprint, or on demand. Reads `plans/metrics.md`, board history, gate pass/fail. Output: `handoffs/retro-notes.md` and improvement tickets in `plans/tickets/` tagged `factory`. This is the self-improving loop: the factory is also a product; coach makes it better over time.

### 5.B.5 Installer — `agent-factory/roles/installer.md`

```text
You are Installer.
You make this factory usable in the current tool.
You detect the host coding agent.
You lay down the right adapter and entry file.
You are additive. You never overwrite user content. You support dry-run and uninstall.
```

Reads: the repo, presence of `.claude/`, `~/.codex/`, `.gemini/`, `opencode.*`, `.github/`. Output: tool-specific adapter files and entry files per Section 16, plus a short install report (what was created/linked, what was skipped, what to verify). Prefer running `install/install.sh` or `install/install.mjs`; the role exists so a host agent can also do it by hand.

---

# 6. Delivery Operating System — Kanban and Sprint

This is the layer the user asked for. The lifecycle (Section 1) says *what steps* a piece of work goes through. The Delivery OS says *how work flows*: where it sits, how much runs at once, and what rhythm the team and agents follow.

## 6.1 The board (always on)

Single source of WIP truth: `plans/board.md`. Every ticket sits in exactly one column. Each column has a definition and a **WIP limit** (max tickets allowed). The Orchestrator refuses to pull new work past a WIP limit without a written reason.

Columns and the role that owns the exit:

```text
COLUMN            ENTRY MEANS                         EXIT OWNER         DEFAULT WIP
----------------------------------------------------------------------------------
Backlog           idea captured                       BA/PM              unlimited
Ready             Definition of Ready met             BA/PM              8
In Analysis       behavior being mapped               System Analyst     2
In Design         structure/ADR being decided         Architect/Design   2
Ready for Dev     handoffs complete, ticket sized     Orchestrator       6
In Development    code being written                  Software Engineer  3  (== max parallel tickets)
In Review         PR + QE running                     QE/E2E             3
In Security/NFR   risk/compliance gate                Security/NFR       2
Ready for UAT     gates passed                        UAT Planner        4
In UAT            business acceptance                 UAT Planner        4
Ready to Release  UAT signed off                      Release Manager    4
Done              merged + released (or merged, lean) Orchestrator       unlimited
Blocked           waiting on a dependency/decision    (raiser)           visible, time-tracked
```

WIP limits come from config (`wip_limits`); the numbers above are defaults. In lean mode, the Security/NFR and Ready-to-Release columns may be skipped unless a trigger fires.

`plans/board.md` format (boring on purpose — agents and humans both read it):

```markdown
# Board
_Updated: <ISO date> by <role>_

## In Development (WIP 3/3)
- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)

## In Review (WIP 1/3)
- [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)

## Blocked (2)
- [ABC-009] XETRA close dates  (blocked-by: missing market-calendar source, since: 2026-05-30)

## Ready for Dev (WIP 2/6)
- [ABC-015] CSV export
- [ABC-016] Empty-state UI

## Ready (WIP 3/8)
- [ABC-017] ...
...
```

Each ticket file (`plans/tickets/ABC-014.md`) carries a status line in its front matter so board and ticket never disagree:

```text
status: in-development
column: In Development
size: M
priority: P2
epic: EPIC-003
feature: FEAT-007
```

## 6.2 Two cadences (pick one in config)

### Kanban (flow) — `cadence=kanban` (default)

```text
- Continuous pull. No iterations.
- Work moves left->right when its exit owner signs off.
- WIP limits are the throttle. Finish before you start.
- The "daily sweep" workflow reconciles the board and surfaces blockers.
- Optimize for short cycle time and low WIP.
- Best for: solo founder, small team, maintenance, brownfield hardening.
```

### Scrum (sprint) — `cadence=scrum`

```text
- Time-boxed sprints (default length from config, e.g. 1-2 weeks).
- Each sprint has a goal, a committed sprint backlog, and a capacity.
- Ceremonies: refinement, planning, daily sweep, review/demo, retro.
- One file per sprint in plans/sprints/SPRINT-xx.md.
- Track velocity (size points completed) and a simple burndown.
- Best for: enterprise teams reporting on a cadence, multi-stakeholder delivery.
```

`plans/sprints/SPRINT-xx.md` format:

```markdown
# Sprint xx
Goal: <one sentence outcome>
Dates: <start> -> <end>
Capacity: <points or ticket count>

## Committed
- [ABC-014] (M=3)
- [ABC-015] (S=2)

## Added mid-sprint (note why)
## Carried out (note why)

## Velocity: <points completed>
## Burndown: <remaining at day 1..n>
## Notes for retro: ...
```

## 6.3 Sizing and priority (shared by both cadences)

```text
Size  : t-shirt -> points map. XS=1, S=2, M=3, L=5, XL=8. XL must be split.
Priority: P0 (drop everything) .. P3 (someday). Or WSJF if config says so.
Rule  : BA/PM sizes and prioritizes at refinement. Orchestrator enforces "no XL into dev".
```

## 6.4 Blocked policy

```text
- Any agent can move a ticket to Blocked with a "blocked-by" reason and a date.
- The daily sweep counts blocked time and escalates anything blocked > threshold (config).
- A blocker is a decision, a dependency, or a missing input. Name it. Assign a human if needed.
```

## 6.5 Metrics (the coach's fuel)

`plans/metrics.md`, updated by the daily sweep and the retro:

```text
- Throughput     : tickets reaching Done per period
- Cycle time     : Ready for Dev -> Done, median
- Lead time      : Backlog -> Done, median
- WIP            : average tickets in flight
- Blocked time   : total/median time in Blocked
- Rework rate    : tickets bounced back a column (e.g. Review -> Development)
- Gate pass rate : first-pass PASS at quality + security gates
- Escaped defects: bugs found in UAT or prod that tests missed
- Velocity       : (scrum) size points per sprint
```

The Factory Coach reads these and writes improvement tickets. Do not over-instrument; these are markdown counts, not a metrics platform.

---

# 7. Workflow Files

Every workflow file uses this template (v2 adds three fields):

```markdown
# Workflow: <name>

## When to use
## Agents involved
## Inputs required
## Steps
## Board moves            # (v2) which columns change
## Handoffs produced
## Trace updates          # (v2) what gets linked in plans/traceability.md
## Metrics emitted        # (v2) what plans/metrics.md should record
## Stop conditions
## Done condition
```

## Lifecycle + bootstrap (kept from v1)

### 7.1 `00-bootstrap-greenfield.md`
Flow: `idea -> Orchestrator -> Greenfield Mapper -> AGENTS.md Scribe -> BA/PM -> System Analyst -> Architect/Design -> initial tickets`. Done when: AGENTS.md, memory-bank, greenfield-plan, product/system/architecture handoffs, first tickets, **board seeded**, **config present** all exist.

### 7.2 `01-bootstrap-brownfield.md`
Flow: `existing repo -> Orchestrator -> Brownfield Mapper -> AGENTS.md Scribe -> Architect/Design review -> Security/NFR high-risk scan -> safe first tickets`. Done when: AGENTS.md, brownfield-map, memory-bank updated, known commands + risks documented, safe first tickets, board seeded, config present.

### 7.3 `02-idea-to-epics.md`
Flow: `idea -> BA/PM -> product-handoff -> epics`. Done when: MVP scope clear; epics, non-goals, risks written; epics added to Backlog.

### 7.4 `03-epic-to-tickets.md`
Flow: `epic -> BA/PM -> System Analyst (if behavior unclear) -> tickets`. Done when: each ticket has user value, scope, acceptance criteria, test notes, security/NFR triggers, **size**, **priority**, and a **traceability row**.

### 7.5 `04-ticket-to-pr.md`
Flow: `ticket -> Orchestrator readiness check -> Software Engineer -> QE/E2E -> Security/NFR (if triggered) -> final implementation packet`. Board: `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. Done when: code changed per autonomy setting, tests added, commands run, implementation + QE (+ security-nfr) handoffs written, trace updated.

### 7.6 `05-pr-quality-gate.md`
Flow: `implementation -> QE/E2E -> Security/NFR -> Architect/Design (if structure changed) -> Orchestrator recommendation`. Backpressure: run lint/typecheck/test/build/e2e; allow a bounded self-fix loop (Section 14); then a result. Result is one of `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`.

### 7.7 `06-uat-pack.md`
Flow: `feature complete -> UAT Planner -> BA/PM validation -> QE validation -> UAT pack`. Done when: scenarios, test data, pass/fail criteria, signoff checklist, known limitations exist; ticket moves to Ready to Release (or Done in lean).

## Ceremonies (v2)

### 7.8 `07-backlog-refinement.md`
When: regularly, or before planning. Agents: BA/PM (+ System Analyst, + Architect/Design for spikes). Steps: pull top of Backlog, clarify, split XL, size, prioritize, mark security/NFR triggers, push items that meet Definition of Ready into the Ready column. Output: `handoffs/refinement-notes.md`. Keeps the Ready column stocked so dev never starves.

### 7.9 `08-sprint-planning.md` (cadence=scrum)
When: start of sprint. Agents: Orchestrator + BA/PM. Steps: set a one-sentence sprint goal; pull from Ready by priority up to capacity; confirm each item is Ready; write `plans/sprints/SPRINT-xx.md`. Stop if Ready is too thin (run refinement first).

### 7.10 `09-daily-sweep.md` (both cadences)
The standup-equivalent. No meeting — a board reconciliation pass the Orchestrator runs on demand or on a schedule. Steps: read board + open handoffs; for each in-flight ticket note progress/blocker; update `plans/board.md`, `plans/metrics.md`, and `memory-bank/60-progress.md`; escalate anything blocked past threshold; recommend the next pull respecting WIP. Output: a short "sweep report" (yesterday/today/blockers, in agent terms: done/next/blocked).

### 7.11 `10-sprint-review.md` (cadence=scrum)
When: end of sprint. Agents: UAT Planner + BA/PM (+ QE). Steps: assemble what reached Done, validate against acceptance criteria, draft demo/release notes, list carry-over with reasons. Output: review notes appended to the sprint file.

### 7.12 `11-retro.md` (both cadences; light in lean)
When: end of sprint, or monthly in Kanban. Agent: Factory Coach. Steps: read `plans/metrics.md` and board history; identify top 1-3 wastes (rework, blocked time, slow gates, escaped defects); write `handoffs/retro-notes.md`; create 1-3 improvement tickets tagged `factory`. This is where the factory improves itself.

## Enterprise pack (v2)

### 7.13 `12-release.md` (enterprise; optional in lean)
Flow: `Ready to Release -> Release Manager -> approval gate -> deploy plan -> (human-confirmed) deploy -> Done`. Steps: set SemVer, compile changelog + release notes from included tickets, confirm migration + rollback + DR notes, attach NFR/security/compliance evidence, record named approval, then a human confirms the production action. Output: `plans/releases/REL-xxxx.md`, `handoffs/release-handoff.md`. Status: `READY_TO_RELEASE | BLOCKED | RELEASED`.

### 7.14 `13-incident.md` (enterprise; post-release)
Flow: `incident detected -> Incident Responder -> mitigate/rollback -> blameless postmortem -> follow-up tickets`. Steps: assess blast radius, propose mitigation + rollback, capture timeline, write `handoffs/incident-postmortem.md`, create follow-up tickets into Backlog, hand lessons to the Coach. Never blames a person.

---

# 8. Handoff Templates

Keep all v1 templates (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet). Each must be copy-paste usable. The universal header gains two fields in v2:

```markdown
# Handoff: <name>

## Source
Request:
Repo:
Branch:
Ticket ID:        # (v2) for traceability
Date:

## Goal
## Scope
### In scope
### Out of scope
## Inputs used
## Decisions
## Risks
## Trace updates   # (v2) IDs/files this links in plans/traceability.md
## Next agent
## Next action
```

New v2 templates:

### 8.1 `release-handoff.md`
```markdown
# Release Handoff: REL-xxxx
## Version (SemVer)
## Tickets included
## Changelog
## Release notes (business-facing)
## Environments path
dev -> staging -> prod
## Feature flags
## Migration plan
## Rollback plan
## DR notes (RTO / RPO)
## Evidence
QE result: ... | Security/NFR result: ... | UAT signoff: ...
## Approval
Approved by (human role/name): ...
## Status
READY_TO_RELEASE | BLOCKED | RELEASED
```

### 8.2 `incident-postmortem.md` (blameless)
```markdown
# Incident Postmortem: INC-xxxx
## Summary
## Impact (users, data, money, duration)
## Timeline (UTC)
## Detection
## Root cause (systemic, not personal)
## Mitigation taken
## Rollback used
## What went well
## What to improve
## Follow-up tickets (IDs)
```

### 8.3 `retro-notes.md`
```markdown
# Retro: <sprint or period>
## Metrics snapshot
## Top wastes (1-3)
## Keep / Stop / Start
## Improvement tickets created (IDs, tag: factory)
```

### 8.4 `refinement-notes.md`
```markdown
# Refinement: <date>
## Items reviewed
## Split decisions (XL -> children)
## Sizes assigned
## Priorities assigned
## Promoted to Ready (IDs)
## Still blocked / open questions
```

### 8.5 `sprint-plan.md`
Mirror of `plans/sprints/SPRINT-xx.md` (goal, committed items with sizes, capacity). Use when planning is requested as a one-off packet.

---

# 9. Checklists

Keep v1 checklists. Add the enterprise superset and the new gates. The Orchestrator applies `definition-of-done.md` in lean mode and `definition-of-done-enterprise.md` in enterprise mode.

### 9.1 `definition-of-ready.md` (kept)
```text
- problem clear
- scope and out-of-scope clear
- acceptance criteria clear (Given/When/Then)
- dependencies known
- security/NFR triggers marked
- test notes present
- size assigned
- priority assigned
- no major unresolved blocker
```

### 9.2 `definition-of-done.md` (lean, kept)
```text
- ticket scope implemented
- tests added/updated
- lint/typecheck/build run, or reason documented
- e2e run when relevant
- docs updated
- handoff written
- risks documented
- traceability row updated
- no fake command results
```

### 9.3 `definition-of-done-enterprise.md` (v2 superset)
```text
All of lean DoD, plus:
- coverage meets threshold (config)
- accessibility checklist passed where UI changed (WCAG target)
- performance within NFR budget for the touched flow
- security/NFR result is PASS or PASS_WITH_RISKS (never BLOCKED)
- compliance checklist passed where data is sensitive
- dependencies scanned; new deps justified; license check clean; SBOM updated
- secrets scan clean
- observability in place (logs/metrics/traces + alert if user-facing path)
- ADR written for any structural decision
- release notes entry drafted
- traceability complete: requirement -> ticket -> code -> test -> (release)
```

### 9.4 `pr-review-checklist.md` (kept, extended)
```text
- small enough diff; no unrelated refactor
- acceptance criteria met
- tests meaningful, not flaky
- error handling sane; logs safe (no secrets/PII)
- no secrets committed
- migration has a rollback if needed
- security/NFR reviewed when triggered
- (enterprise) coverage + scans + a11y + perf budget satisfied
```

### 9.5 `security-nfr-checklist.md` (kept)
```text
- auth + permissions checked
- input validation checked
- secrets handling checked
- personal/financial data handling checked
- logs do not leak sensitive data
- rate-limit / abuse considered
- performance impact vs NFR catalog
- reliability / fallback considered
- monitoring / audit considered
- GDPR/compliance notes when relevant
```

### 9.6 `compliance-checklist.md` (v2)
```text
- data classified (public / internal / confidential / regulated)
- lawful basis / consent noted (GDPR) where applicable
- PII data-flow mapped (collected -> stored -> shared -> deleted)
- retention + deletion policy noted
- access controls documented
- audit logging present for sensitive actions
- DPIA-lite done for high-risk processing
- control -> evidence mapping recorded (SOC2/ISO 27001/PCI as set)
```

### 9.7 `accessibility-checklist.md` (v2)
```text
- semantic structure / labels
- keyboard reachable + visible focus
- color contrast meets target
- alt text for meaningful images
- forms have error + label association
- target standard (e.g. WCAG 2.2 AA) noted
```

### 9.8 `observability-slo-checklist.md` (v2)
```text
- structured logs (no sensitive data)
- key metrics emitted
- traces on critical path
- alert defined for user-facing failure
- SLO/target referenced from nfr-catalog
- dashboard/runbook link in memory-bank/70-runbook.md
```

### 9.9 `release-readiness-checklist.md` (v2)
```text
- version chosen (SemVer)
- changelog + release notes ready
- migration + rollback verified
- DR (RTO/RPO) acceptable
- QE + security/NFR + UAT evidence attached
- feature flags planned
- named human approval recorded
- production action will be human-confirmed
```

### 9.10 `uat-checklist.md` (kept)
```text
- UAT goal clear
- entry criteria met
- business scenarios listed
- test data ready
- expected results clear
- known limitations listed
- rollback known
- signoff person/role known
- exit criteria clear
```

---

# 10. Traceability and IDs

Enterprise delivery must answer "why does this code exist, and is it tested and accepted?" The factory answers it with stable IDs and one matrix.

ID schemes (set the prefix in config, default `ABC`):

```text
EPIC-xxx     epic
FEAT-xxx     feature
ABC-xxx      ticket (project prefix + number)
ADR-000x     architecture decision
NFR-xxx      non-functional requirement
RISK-xxx     risk
REL-xxxx     release
INC-xxxx     incident
```

`plans/traceability.md` — one row per ticket, links upward and downward:

```markdown
# Traceability Matrix
_Updated: <date>_

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-012| FX conversion | EPIC-003 | FEAT-007 | NFR-002 | #41 / src/fx/* | fx.spec.ts, e2e/fx | UAT-12 pass | REL-0007 | Done |
| ABC-014| Allocation chart | EPIC-003 | FEAT-009 | NFR-005 | #43 / src/charts/* | charts.spec.ts | pending | - | In UAT |
```

Rules:

```text
- BA/PM creates the row when a ticket is born.
- Each role appends its link as it completes work (Architect adds ADR/NFR; Engineer adds PR/files;
  QE adds tests; UAT adds result; Release adds REL id).
- Definition of Done (enterprise) is not met until the row is complete through the relevant stage.
- The validator (Section 18) can check for tickets missing rows or rows missing tests.
```

---

# 11. NFR Catalog and SLOs

`plans/nfr-catalog.md` is the single list of non-functional targets. Architect/Design seeds it; Security/NFR checks against it; Release Manager attaches evidence.

```markdown
# NFR Catalog
_Updated: <date>_

| ID | Category | Target | Applies to | Verified by |
|----|----------|--------|------------|-------------|
| NFR-001 | Performance | p95 API < 300ms | all read endpoints | load test / QE |
| NFR-002 | Availability | 99.9% monthly | public API | SLO dashboard |
| NFR-003 | Reliability | RTO 1h / RPO 15m | primary datastore | DR drill |
| NFR-004 | Security | OWASP ASVS L2 baseline | whole app | SAST/DAST + review |
| NFR-005 | Accessibility | WCAG 2.2 AA | all UI | a11y checklist |
| NFR-006 | Privacy | GDPR-compliant PII handling | user + financial data | compliance checklist |
| NFR-007 | Observability | logs+metrics+traces on critical paths | whole app | observability checklist |
| NFR-008 | i18n | locale-ready strings | UI | review |
| NFR-009 | Maintainability | coverage >= threshold, no XL PRs | whole app | QE + PR review |
```

Categories to consider: performance, scalability, availability, reliability/DR, security, privacy/compliance, accessibility, observability, maintainability, portability, i18n/l10n, cost. Keep targets few and real. Tickets reference NFR IDs in their traceability row; Security/NFR fails a gate if a touched flow violates a referenced target.

---

# 12. Release and Change Management

Owned by the Release Manager (enterprise). In lean mode this collapses to "merge the PR; tag a version if you want."

```text
Environments : dev -> staging -> prod. The factory may prepare any stage.
               A production action is ALWAYS confirmed by a named human.
Versioning   : SemVer (MAJOR.MINOR.PATCH). Breaking -> MAJOR.
Changelog    : Keep-a-Changelog style, generated from included tickets.
Release notes: business-facing summary, drafted at sprint review or release.
Feature flags: prefer flagged rollout for risky changes; record flag + default.
Deploy plan  : steps, order, health checks, owner.
Rollback     : explicit, tested, time-boxed. No release without one.
DR           : RTO/RPO from NFR catalog respected.
Approval     : a named human role signs off (records who). Agent cannot self-approve.
Artifacts    : plans/releases/REL-xxxx.md + handoffs/release-handoff.md.
```

Change control is lightweight by default: the release-readiness checklist plus a recorded approval. Heavier regimes can map this to a CAB step without changing the file shape.

---

# 13. Security, Privacy, and Compliance

Two roles cover this: Security/NFR (always available, trigger-driven) and Compliance Officer (enterprise / sensitive-data-driven). Keep it proportional — no gold-plating — but never skip a triggered control.

Security review surface:

```text
- AuthN / AuthZ : who can do what; least privilege; session/token handling.
- Threat model  : STRIDE-lite per feature (Spoofing, Tampering, Repudiation,
                  Info disclosure, DoS, Elevation). One short pass, not a thesis.
- Input         : validate + encode; injection, SSRF, deserialization, file-upload safety.
- Secrets       : never in code/logs; from env/keychain; secrets scan in gate.
- Supply chain  : dependency scan, license check, SBOM updated on dependency change.
- AppSec scans  : SAST on diff; DAST on running app for public surfaces.
- Logging       : safe logs (no secrets/PII); audit log for sensitive actions.
- Abuse/limits  : rate limiting, lockout, anti-automation where relevant.
```

Privacy / compliance surface (Compliance Officer):

```text
- Data classification: public / internal / confidential / regulated.
- PII data-flow      : collected -> stored -> processed -> shared -> retained -> deleted.
- Lawful basis       : consent or other basis noted (GDPR) where applicable.
- Retention/deletion : policy stated; deletion path exists.
- DPIA-lite          : for high-risk processing (large-scale PII, financial, special category).
- Control mapping    : map satisfied controls to evidence for the active regime
                       (SOC2 / ISO 27001 / PCI-DSS / sector rules from config).
```

Sensible default trigger (good for finance/banking/payment work): activate the full security + compliance path whenever a ticket touches **personal data, money movement, authentication, or a public endpoint**. The Orchestrator sets this from the ticket's security/NFR triggers and the config `compliance_regime`.

Disclaimer to encode in the role: the Compliance Officer documents controls and gaps and flags risk; it does not give legal advice and should recommend human/legal review for regulated decisions.

---

# 14. CI/CD and Backpressure

Backpressure is the automated feedback (linters, type checkers, tests, builds, scans) that lets agents self-correct before a human looks. Without it you review trivial mistakes; with it you review architecture and product. Build the factory around it.

Pattern (proven at scale by one-shot agent pipelines):

```text
1. Deterministic prefetch: BEFORE the model writes code, the Orchestrator gathers context
   (ticket, handoffs, AGENTS.md commands, relevant files, prior ADRs). The agent starts
   focused, not drowning.
2. Implement on a branch (autonomy=branch|pr).
3. Run the gate: install -> lint -> typecheck -> unit -> build -> e2e (commands from AGENTS.md).
4. Bounded self-fix: if the gate fails, the agent gets a small, fixed number of self-fix
   attempts (default 2). After that, STOP and hand to a human. Do not loop forever.
5. Result: READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED.
6. Human reviews the PR. Human merges. Human (or human-confirmed pipeline) deploys.
```

Gate commands are not invented — they come from `AGENTS.md`. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. The self-fix attempt count, coverage threshold, and "which gates are mandatory" come from config. In headless/CI use (e.g. a scheduled run that turns a ticket into a PR), the same gate and the same "two rounds then human" rule apply.

---

# 15. Configuration

`agent-factory/config/factory.config.json` — the Orchestrator reads this first, every run. Keep a human-readable twin at `factory.config.md`.

```json
{
  "version": "2.0.0",
  "mode": "lean",
  "cadence": "kanban",
  "autonomy": "pr",
  "id_prefix": "ABC",
  "repo_strategy": "mono",
  "default_stack": {
    "language": "typescript",
    "backend": "node-fastify",
    "frontend": "vue",
    "db": "postgresql",
    "e2e": "playwright",
    "container": "docker",
    "deploy": "kubernetes-ready"
  },
  "wip_limits": {
    "Ready": 8, "In Analysis": 2, "In Design": 2, "Ready for Dev": 6,
    "In Development": 3, "In Review": 3, "In Security/NFR": 2,
    "Ready for UAT": 4, "In UAT": 4, "Ready to Release": 4
  },
  "sprint_length_days": 10,
  "sizing": "tshirt",
  "priority_scheme": "P0-P3",
  "quality": {
    "coverage_threshold": 0.8,
    "self_fix_attempts": 2,
    "mandatory_gates": ["lint", "typecheck", "unit", "build"],
    "e2e_when": "ui-or-critical-path"
  },
  "nfr": { "a11y_target": "WCAG-2.2-AA", "perf_p95_ms": 300, "availability": "99.9%" },
  "compliance_regime": [],
  "environments": ["dev", "staging", "prod"],
  "production_requires_human_confirmation": true,
  "blocked_escalation_days": 2
}
```

Field meaning (also document in `factory.config.md`):

```text
mode       lean = core agents + light DoD; enterprise = full pack + full gates.
cadence    kanban = flow + WIP; scrum = sprints + ceremonies.
autonomy   diff = produce diffs only; branch = commit to a branch; pr = branch + open PR (never merge).
repo_strategy  mono = nested AGENTS.md per package; poly = one AGENTS.md per repo + root index.
compliance_regime  e.g. ["GDPR","SOC2"]; empty = trigger-only via sensitive-data rules.
production_requires_human_confirmation  must stay true; agents never deploy prod alone.
```

The factory must run with zero config (apply the defaults in Section 0). When config is present, every role honors it.

---

# 16. Plugin Packaging and Installability

This is the second thing the user asked for: ship the factory so it **installs on top of existing coding agents**. The design is one portable core plus thin per-tool adapters plus install scripts. Build all of it.

## 16.1 The portability model

```text
ONE portable core, read the same by every tool:
  AGENTS.md                      <- canonical substrate (cross-tool standard)
  agent-factory/roles/*.md       <- role prompts (the intelligence)
  agent-factory/workflows/*.md   <- guardrails
  agent-factory/handoffs/*.md    <- memory
  agent-factory/checklists/*.md  <- gates
  plans/*, memory-bank/*         <- state, decisions, trace

THIN per-tool adapters, only to bridge differences in:
  - the entry/context file the tool reads
  - whether the tool can SPAWN sub-agents or must load roles SEQUENTIALLY
  - the slash-command mechanism (optional convenience)
```

Key truth to bake into the README and the Installer role: **only the dispatch differs, never the content.** Where a tool supports real sub-agents (Claude Code), the Orchestrator spawns role agents. Where it does not, the Orchestrator is a single agent that *loads the relevant role file into context* when it would otherwise "wake" that agent. Same roles, same handoffs, same gates.

## 16.2 Per-tool adapter map

Generate `agent-factory/packaging/adapters.md` containing this table and the templates below. Treat anything tool-version-specific as "verify against current tool docs" — these conventions move fast.

```text
TOOL              ENTRY FILE IT READS            ROLE DISPATCH            ADAPTER THE INSTALLER LAYS DOWN
------------------------------------------------------------------------------------------------------------
Claude Code       CLAUDE.md (+ AGENTS.md soon)   native sub-agents        .claude/agents/*.md (thin wrappers),
                                                  (Task tool, auto-route)  .claude/commands/factory.md,
                                                                           one-line CLAUDE.md -> import AGENTS.md
                                                                           (OR full plugin form, 16.4)
Codex CLI         AGENTS.md (root+nested,         sequential role-load     none needed (reads AGENTS.md);
                  ~/.codex/AGENTS.md global)      (no spawn)               AGENTS.md must point to roles
Gemini CLI        GEMINI.md                       sequential role-load     one-line GEMINI.md -> "read AGENTS.md
                                                                           and agent-factory/roles/orchestrator.md"
OpenCode          AGENTS.md (+ its agent config)  sequential or its agents none needed (reads AGENTS.md);
                                                                           optional native-agent mapping
GitHub Copilot CLI AGENTS.md + .github/            sequential role-load     ensure AGENTS.md present; optional
                   copilot-instructions.md                                  .github/copilot-instructions.md -> import
```

The single rule the entry file must enforce everywhere:

```text
"All work starts with agent-factory/roles/orchestrator.md.
 Read AGENTS.md, then the orchestrator role, then the config, then the board."
```

## 16.3 Claude Code adapter — standalone form

Thin sub-agent wrappers keep role text single-source. Each `.claude/agents/<role>.md`:

```markdown
---
name: factory-orchestrator
description: Single entry point for the agent factory. Use for any SDLC delivery request — bootstrapping a repo, turning ideas into tickets, implementing a ticket, running a quality gate, planning UAT, or cutting a release. Routes to specialist factory agents.
tools: Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
You follow `agent-factory/roles/orchestrator.md` exactly.
Read it now. Then read `agent-factory/config/factory.config.json`, `AGENTS.md`, and `plans/board.md`.
Then act as the Orchestrator: classify the request, respect WIP limits and config, activate
the right specialist sub-agents, demand handoff packets, update the board and traceability,
and produce the next action. Never merge a protected branch. Never deploy prod.
```

Repeat one wrapper per role (`factory-ba-pm`, `factory-architect`, `factory-engineer`, `factory-qe`, `factory-security-nfr`, `factory-uat`, `factory-release`, ...), each pointing at its canonical role file. The `description` field is how Claude Code auto-routes, so write it as a clear "use when ...".

Slash command `.claude/commands/factory.md`:

```markdown
---
description: Run the software factory. Pass a request, e.g. /factory "implement ticket ABC-014".
argument-hint: "<request>"
---
Act as the factory Orchestrator (agent-factory/roles/orchestrator.md).
Request: $ARGUMENTS
Read config, AGENTS.md, and the board first. Then route and execute per the workflows.
```

One-line `CLAUDE.md` (until native AGENTS.md support lands):

```markdown
# Project rules
Read and follow `AGENTS.md`. All agent work starts at `agent-factory/roles/orchestrator.md`.
```

## 16.4 Claude Code adapter — plugin form (recommended for sharing)

Package the factory as a versioned, installable plugin. Layout (only `plugin.json` lives in `.claude-plugin/`; components sit at the plugin root):

```text
agent-factory-plugin/
  .claude-plugin/
    plugin.json
    marketplace.json          # single-plugin catalog (can also live in a parent repo)
  agents/                     # the sub-agent wrappers from 16.3
  commands/                   # factory.md (and any subcommands)
  skills/                     # optional: package role/workflow docs as skills
  hooks/                      # optional: PreToolUse/PostToolUse guards (e.g. block prod deploy)
  README.md
```

`.claude-plugin/plugin.json` (`name` is the only required field; it namespaces commands as `/agent-factory:factory`):

```json
{
  "name": "agent-factory",
  "version": "2.0.0",
  "description": "File-based SDLC agent factory: orchestrator + lean role agents, Kanban/Sprint delivery, enterprise gates, brownfield/greenfield mapping.",
  "author": { "name": "<you>" },
  "commands": "./commands",
  "agents": "./agents",
  "skills": "./skills"
}
```

`.claude-plugin/marketplace.json` (a marketplace is a git repo with this catalog at its root; users add it with `/plugin marketplace add <repo>` then `/plugin install agent-factory@<marketplace>`):

```json
{
  "name": "agent-factory-marketplace",
  "owner": { "name": "<you>" },
  "plugins": [
    { "name": "agent-factory", "source": "./", "description": "SDLC agent factory v2" }
  ]
}
```

Optional `settings.json` can set `agent` to make the Orchestrator the default main thread when the plugin is enabled. Optional hooks can enforce a guard deterministically (e.g. a `PreToolUse` matcher on Bash that blocks `kubectl ... apply`/deploy commands unless a human-confirm flag is set) — this is how you make "never deploy prod alone" mechanical, not just a prompt. Use `${CLAUDE_PLUGIN_ROOT}` for any bundled script path.

Distribution choices (document all; pick per team): commit the plugin in-repo (project scope, reaches every cloner); host the marketplace repo on any git host; or `git-subdir` if the plugin lives in a subfolder. Standalone `.claude/` (16.3) is best for fast iteration; convert to the plugin form when you want versioned, shareable distribution.

## 16.5 Install scripts

Build two functionally-identical installers. Both must be **idempotent, additive, dry-run-capable, and reversible**, and must never overwrite user content.

`install/install.sh` (POSIX) — skeleton to complete:

```bash
#!/usr/bin/env sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY="${DRY_RUN:-0}"
say() { printf '%s\n' "$*"; }
do_or_echo() { if [ "$DRY" = "1" ]; then say "DRY: $*"; else eval "$*"; fi; }

ensure_line() { # file, line  -> add line if file missing it (never clobber)
  f="$1"; line="$2"
  [ -f "$f" ] || do_or_echo "printf '%s\n' \"$line\" > \"$f\""
  grep -qF "$line" "$f" 2>/dev/null || do_or_echo "printf '%s\n' \"$line\" >> \"$f\""
}

say "Agent Factory installer (dry-run=$DRY)"

# 1) Portable substrate is already in-repo (AGENTS.md + agent-factory/*). Verify.
[ -f "$ROOT/AGENTS.md" ] || say "WARN: AGENTS.md missing — run the AGENTS.md Scribe."

# 2) Claude Code
if [ -d "$ROOT/.claude" ] || command -v claude >/dev/null 2>&1; then
  say "-> Claude Code detected"
  do_or_echo "mkdir -p \"$ROOT/.claude/agents\" \"$ROOT/.claude/commands\""
  # link thin sub-agent wrappers + command from the packaging dir
  for f in "$ROOT/agent-factory/packaging/claude-agents/"*.md; do
    [ -e "$f" ] || continue
    do_or_echo "ln -sf \"$f\" \"$ROOT/.claude/agents/$(basename "$f")\""
  done
  do_or_echo "ln -sf \"$ROOT/agent-factory/packaging/claude-commands/factory.md\" \"$ROOT/.claude/commands/factory.md\""
  ensure_line "$ROOT/CLAUDE.md" "Read and follow AGENTS.md. Work starts at agent-factory/roles/orchestrator.md."
fi

# 3) Codex CLI / OpenCode / Copilot CLI — they read AGENTS.md natively. Just confirm it points to roles.
say "-> Codex/OpenCode/Copilot read AGENTS.md natively (no adapter needed)."

# 4) Gemini CLI — needs GEMINI.md pointer
if [ -d "$ROOT/.gemini" ] || command -v gemini >/dev/null 2>&1; then
  say "-> Gemini CLI detected"
  ensure_line "$ROOT/GEMINI.md" "Read AGENTS.md and agent-factory/roles/orchestrator.md. Start every task as the Orchestrator."
fi

# 5) GitHub Copilot CLI — optional instructions pointer
if [ -d "$ROOT/.github" ]; then
  ensure_line "$ROOT/.github/copilot-instructions.md" "See AGENTS.md. Start at agent-factory/roles/orchestrator.md."
fi

say "Done. Re-run with DRY_RUN=1 to preview. See install/uninstall.sh to revert."
```

`install/install.mjs` (Node, cross-platform) — same behavior, for Windows/no-POSIX:

```js
#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, symlinkSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.env.DRY_RUN === "1";
const say = (...a) => console.log(...a);
const ensureLine = (file, line) => {
  if (!existsSync(file)) { DRY ? say("DRY new", file) : writeFileSync(file, line + "\n"); return; }
  const txt = readFileSync(file, "utf8");
  if (!txt.includes(line)) DRY ? say("DRY append", file) : appendFileSync(file, line + "\n");
};
const link = (src, dst) => { try { DRY ? say("DRY link", dst) : symlinkSync(src, dst); } catch {} };

say(`Agent Factory installer (dry-run=${DRY})`);
if (!existsSync(join(ROOT, "AGENTS.md"))) say("WARN: AGENTS.md missing — run the AGENTS.md Scribe.");

if (existsSync(join(ROOT, ".claude"))) {
  const ad = join(ROOT, ".claude/agents"), cd = join(ROOT, ".claude/commands");
  if (!DRY) { mkdirSync(ad, { recursive: true }); mkdirSync(cd, { recursive: true }); }
  const wrapDir = join(ROOT, "agent-factory/packaging/claude-agents");
  if (existsSync(wrapDir)) for (const f of readdirSync(wrapDir)) link(join(wrapDir, f), join(ad, f));
  link(join(ROOT, "agent-factory/packaging/claude-commands/factory.md"), join(cd, "factory.md"));
  ensureLine(join(ROOT, "CLAUDE.md"), "Read and follow AGENTS.md. Work starts at agent-factory/roles/orchestrator.md.");
}
if (existsSync(join(ROOT, ".gemini")))
  ensureLine(join(ROOT, "GEMINI.md"), "Read AGENTS.md and agent-factory/roles/orchestrator.md. Start as the Orchestrator.");
if (existsSync(join(ROOT, ".github")))
  ensureLine(join(ROOT, ".github/copilot-instructions.md"), "See AGENTS.md. Start at agent-factory/roles/orchestrator.md.");
say("Done. DRY_RUN=1 to preview.");
```

`install/uninstall.sh` removes only the symlinks/entry-pointer lines the installer added; it never deletes `agent-factory/`, `plans/`, or user files.

## 16.6 "Just install the markdown" minimal path

For any tool, the floor is: copy `AGENTS.md` + the `agent-factory/` folder into the repo, then tell the agent "start at `agent-factory/roles/orchestrator.md`." `install/README.md` documents this one-liner for users who don't want scripts. The scripts only add the per-tool conveniences (sub-agents, slash command, entry pointers).

## 16.7 Self-bootstrap

Provide a `/factory:install` path (the Installer role + the command): a user in any supported tool can say "install the factory adapters for this tool," and the Installer detects the host, runs the right install path, and prints a report of what it created, linked, skipped, and what to verify (e.g. `UNKNOWN` commands in AGENTS.md). Additive and dry-run-aware.

---

# 17. AGENTS.md, README, and Examples

## 17.1 Root AGENTS.md (the substrate)

Generated/updated by the AGENTS.md Scribe. Minimal and high-signal — push detail into the files it points to. Required shape:

```markdown
# AGENTS.md

## Mission
This repo runs a file-based agent factory for software delivery.

## How to work here
All work starts with the Orchestrator: `agent-factory/roles/orchestrator.md`.
Read `agent-factory/config/factory.config.json`, then the orchestrator role, then `plans/board.md`.

## Role / workflow / handoff files
- Roles:     agent-factory/roles/
- Workflows: agent-factory/workflows/
- Handoffs:  agent-factory/handoffs/
- Checklists:agent-factory/checklists/

## Commands
### Install
### Development
### Test
### Lint
### Typecheck
### Build
### E2E
(Real commands only. If unknown: "UNKNOWN - verify". Do not enforce here what a linter/CI already enforces.)

## Delivery
Board: plans/board.md   Cadence + WIP: factory.config.json   Traceability: plans/traceability.md

## Safety rules
- Do not read or expose secrets.
- Do not run destructive commands.
- Never merge a protected branch. Never deploy prod without human confirmation.
- Do not change dependencies without reason. No unrelated refactors. No fake results.

## Definition of ready / done
Link the checklists (enterprise DoD applies when mode=enterprise).

## Memory bank & plans
Explain memory-bank/* and plans/* (board, traceability, nfr-catalog, sprints, releases).

## When uncertain
Stop. Write the open question or the assumption. Do not guess silently.
```

## 17.2 `agent-factory/README.md`

Must explain: what the factory is; how to use it in Claude Code / Codex CLI / Gemini CLI / OpenCode / Copilot CLI (the dispatch difference from 16.1); how to start greenfield and brownfield; how to refine, plan a sprint, run the daily sweep, implement a ticket, run the quality gate, plan UAT, and cut a release; how handoffs, the board, and traceability work; and how to install (scripts or the minimal markdown path). Include copy-paste prompts:

```text
Use the Orchestrator. Bootstrap this repo as brownfield. Create AGENTS.md, memory-bank,
  brownfield map, the board, config, and safe first tickets.

Use the Orchestrator. Plan this idea as greenfield: <idea>. Produce product/system/architecture
  handoffs, epics, first tickets, and seed the board.

Use the Orchestrator. Refine the backlog and promote ready items.   # 07
Use the Orchestrator. Plan sprint <n> toward goal: <goal>.          # 08 (scrum)
Use the Orchestrator. Run the daily sweep.                          # 09
Use the Orchestrator. Implement ticket <id> via ticket-to-pr.       # 04
Use the Orchestrator. Run the PR quality gate for current changes.  # 05
Use the Orchestrator. Create the UAT pack for feature <name>.       # 06
Use the Orchestrator. Prepare release <version> for these tickets.  # 12 (enterprise)
```

## 17.3 Examples

Keep the three v1 examples (greenfield bootstrap, brownfield bootstrap, ticket-to-pr) showing input, Orchestrator decision, and expected files/handoffs. Add two v2 examples:

```text
example-sprint-cycle.md   : refinement -> planning -> 2 tickets through ticket-to-pr ->
                            daily sweeps -> review -> retro, with board snapshots and a
                            velocity/metrics line.
example-release-run.md     : a feature reaching Ready to Release -> Release Manager builds
                            REL-0007 (SemVer, changelog, rollback, approval) -> human-confirmed
                            deploy -> Done, with the traceability rows completed.
```

---

# 18. Validation Script (optional but recommended)

If Node/TypeScript, add `scripts/validate-agent-factory.mjs` (or `.ts`) and a package script only if `package.json` exists. It checks structure, not behavior:

```text
- all required role/workflow/handoff/checklist files exist
- role files contain: One job, Caveman prompt, Reads, Responsibilities, Output, Board moves,
  Trace updates, Hard limits
- workflow files contain: When, Agents, Inputs, Steps, Board moves, Handoffs, Trace updates,
  Stop, Done
- config file parses and has mode/cadence/autonomy
- plans/board.md exists and every ticket file's status matches its board column
- plans/traceability.md has a row for every ticket file; flags rows missing tests/UAT
- packaging: adapters.md present; if .claude-plugin/plugin.json exists, it has a name
```

Do not create `package.json` if absent unless asked. Faking results is forbidden anywhere.

---

# 19. Quality Rules for the Coding Agent (building this factory)

```text
1. Keep files small, boring, and readable. Markdown for everything except install scripts.
2. Do not create runtime complexity, fake integrations, or invented repo commands.
3. Preserve existing user files. Prefer additive changes. Installers are idempotent + dry-run.
4. Single-source the role text; adapters are thin pointers, not copies.
5. Honor the config in every role; run lean with zero config.
6. Keep the caveman voice in every role prompt, including the new ones.
7. Make examples practical and the output immediately usable by a host coding agent.
8. Never write a step that merges a protected branch or deploys prod without human confirmation.
9. Mark unknowns as UNKNOWN - verify. Never fabricate a passing gate or a citation.
10. Minimal high-signal AGENTS.md beats a long generated one.
```

---

# 20. Acceptance Criteria (v2)

Done when all of v1's criteria hold, plus:

```text
- config/factory.config.json (+ .md twin) exist; factory runs lean with zero config.
- plans/board.md exists, seeded, with WIP limits from config; ticket statuses match columns.
- plans/traceability.md exists with a row per ticket; enterprise DoD enforces completeness.
- plans/nfr-catalog.md and plans/metrics.md exist.
- Kanban works (flow + WIP) and Scrum works (sprints + ceremonies) selectable by config.
- ceremony workflows exist: refinement, sprint-planning, daily-sweep, sprint-review, retro.
- enterprise-pack roles + workflows exist: release-manager + 12-release, compliance-officer,
  incident-responder + 13-incident, factory-coach + 11-retro, installer.
- enterprise DoD, compliance/a11y/observability/release-readiness checklists exist.
- packaging exists: adapters.md, sub-agent + slash-command templates.
- install/install.sh and install/install.mjs exist, are idempotent, additive, dry-run, reversible.
- Claude Code plugin form exists: .claude-plugin/plugin.json (+ marketplace.json), agents/, commands/.
- the "just install markdown" minimal path is documented.
- the same roles/handoffs/gates work across Claude Code, Codex CLI, Gemini CLI, OpenCode, Copilot CLI;
  only dispatch differs (spawn vs sequential load).
- no existing project content deleted; all markdown clear and consistent.
```

The result must let a user, in any supported tool, paste:

```text
Use agent-factory/roles/orchestrator.md. Bootstrap this repository as brownfield.
Create the config, board, traceability, AGENTS.md, repo map, and safe first tickets.
```

...and in enterprise mode also:

```text
Use the Orchestrator. Take ticket ABC-014 from Ready for Dev to Ready to Release:
implement, test, run the security/NFR + compliance gates, plan UAT, and prepare the release.
Respect WIP and the config. Stop for human review before merge and before any prod action.
```

---

# 21. Design Intent

This factory does not replace human judgment. It creates better context, smaller tickets, safer changes, a visible board, reusable workflows, explicit handoffs, a real traceability trail, disciplined security/NFR/compliance, clean releases, and a self-improving loop.

The agents work like a disciplined delivery team, not random autonomous bots. Humans decide and stay accountable; agents execute within scope; the files are the shared memory and the audit trail. The factory is itself a product: the Coach and the retro make it better every cycle.

Keep the first version lean. Let enterprise be a flag, not a tax. Make it useful today.
