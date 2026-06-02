# Architecture Research

**Domain:** Portable, file-based, multi-agent SDLC factory (markdown role prompts + workflows + handoffs + state files + per-tool adapters, installed on top of a host coding-agent CLI)
**Researched:** 2026-06-02
**Confidence:** HIGH for Claude Code sub-agent/plugin mechanics (verified against current code.claude.com docs) and the file-based architecture (derived directly from the spec). MEDIUM for cross-tool AGENTS.md status (web sources, dated Feb–May 2026, consistent). The architecture below is opinionated synthesis of the spec + verified tool mechanics.

---

## The One Big Idea

There is **no runtime to architect.** grugops is data, not a program. The "system" is a set of markdown files laid out so a host coding agent (Claude Code, Codex, Gemini, OpenCode, Copilot) reads them in a disciplined order. The architecture is therefore about **information layout and read-order contracts**, not about services, processes, or APIs.

Three load-bearing inversions follow from that:

1. **The intelligence is rented, not built.** The LLM in the host tool is the CPU. grugops supplies role (program), workflow (control flow), handoff (call stack / message passing), board + traceability (mutable state), config (feature flags), and gate (assertions). Architecting grugops = designing a *file protocol* the host agent will follow.
2. **Portability is a content/dispatch split, not a build target.** One canonical core is read byte-for-byte identically by every tool. Only the *entry mechanism* and *whether roles run as spawned sub-agents or sequential context-loads* differ. This is the central architectural constraint and the thing most likely to be violated by accident (see Anti-Pattern 1).
3. **Consistency is enforced by convention + a validator, not by a database.** "board.md agrees with ticket front-matter" is an invariant maintained by role discipline and checkable by a stateless Node script — there is no transaction, no lock, no source of truth except the files in git.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  HOST CODING AGENT (the runtime — NOT shipped by grugops)              │
│  Claude Code | Codex CLI | Gemini CLI | OpenCode | Copilot CLI         │
└───────────────────────────────┬──────────────────────────────────────┘
                                 │ reads (dispatch layer — THIN, per-tool)
        ┌────────────────────────┼─────────────────────────┐
        ▼                        ▼                          ▼
  .claude/agents/*          AGENTS.md (native)        GEMINI.md pointer
  .claude/commands/        ~/.codex, .github, etc.    .github/copilot-instr
  .claude-plugin/          (Codex/OpenCode/Copilot    (one-line "read
   (spawn sub-agents)       read AGENTS.md directly)    AGENTS.md")
        └────────────────────────┼─────────────────────────┘
                                 │ all point at ONE canonical core
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PORTABLE CORE  (single-source markdown — identical for every tool)    │
│                                                                        │
│  AGENTS.md ──────────► substrate / index (minimal, high-signal)        │
│                                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ roles/*.md   │  │ workflows/*.md│  │ handoffs/*.md│  │checklists/│ │
│  │ THE PROGRAM  │  │ CONTROL FLOW  │  │ THE MESSAGES │  │ THE GATES │ │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │   read by host    │   followed by   │   produced by  │       │
│  ┌──────┴───────────────────┴─────────────────┴────────────────┴────┐ │
│  │ config/factory.config.json  ── THE DIAL (read first, every run)   │ │
│  └───────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────┬────────────────────────────────────┘
                                     │ writes / reconciles
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STATE PLANE  (mutable, git-tracked — the audit trail)                 │
│                                                                        │
│  plans/board.md        ◄── single source of WIP truth (columns+limits) │
│  plans/tickets/*.md    ◄── per-ticket front-matter (MUST match board)  │
│  plans/traceability.md ◄── req → ticket → code → test → UAT → release  │
│  plans/nfr-catalog.md  ◄── NFR/SLO targets (IDs referenced by trace)   │
│  plans/metrics.md      ◄── throughput/cycle/rework/escaped defects     │
│  plans/sprints/*  releases/*  epics/*  features/*                      │
│                                                                        │
│  memory-bank/*         ◄── long-term memory + ADRs (50-decisions/)     │
└──────────────────────────────────────────────────────────────────────┘
        ▲                                          │
        │ checked (structure only, no behavior)    │ guarded (mechanical)
   scripts/validate-agent-factory.mjs       .claude-plugin hooks/ (PreToolUse
   (board↔ticket match, trace completeness)  blocks prod deploy / protected merge)
```

### Component Responsibilities

| Component | Responsibility (what it owns) | Form |
|-----------|-------------------------------|------|
| **AGENTS.md** (root) | The substrate/index. Names the read-order contract ("start at orchestrator, read config, then board"), real commands, safety rules. Deliberately minimal — long machine-written context *lowers* agent success. | One markdown file |
| **roles/*.md** | The program. One job, hard limits, defined Reads/Output/Board-moves/Trace-updates per role. The intelligence. | 16 markdown files (11 core + 5 enterprise) |
| **workflows/*.md** | Control flow. Ordered steps wiring roles into a lifecycle/ceremony, declaring board moves, handoffs produced, trace + metrics emitted, stop/done conditions. | 14 markdown files |
| **handoffs/*.md** | The messages / inter-role memory. Copy-paste packet templates; a completed packet is the call-return value between roles. | 16 templates |
| **checklists/*.md** | The gates. DoR/DoD/PR/security/compliance/a11y/observability/release-readiness criteria, applied by mode. | 10 checklists |
| **config/factory.config.json** (+ `.md` twin) | The dial. mode/cadence/autonomy/WIP/thresholds/regime. Read first, every run. Zero-config defaults baked into the orchestrator role. | 1 JSON + 1 MD |
| **plans/board.md** | Single source of WIP truth. Columns, WIP limits, ticket placement. | 1 markdown file |
| **plans/tickets/*.md** | Per-ticket detail + status front-matter that **must agree** with the board. | N markdown files |
| **plans/traceability.md** | The proof. One row per ticket linking requirement→ticket→code→test→UAT→release. | 1 markdown table |
| **plans/nfr-catalog.md / metrics.md** | NFR/SLO targets (IDs); flow metrics counts. | 2 markdown files |
| **memory-bank/*** | Long-term memory: brief, product, architecture, progress, runbook, glossary; ADRs as individual files in `50-decisions/`. | Seed files + ADR dir |
| **Dispatch adapters** (`packaging/` + per-tool entry files) | THIN bridge: entry file each tool reads + spawn-vs-sequential mapping + slash-command mechanism. Never copies role content. | Templates + generated pointers/symlinks |
| **install/** | Idempotent, additive, dry-run, reversible installers (`install.sh` + `install.mjs`) that lay down only the adapters. | 2 scripts + uninstall |
| **scripts/validate-agent-factory.mjs** | Structure + consistency checker (board↔ticket, trace completeness, required sections). No behavior, never fakes. | 1 optional Node script |
| **.claude-plugin/ hooks/** | Mechanical safety (PreToolUse guard blocks prod deploy / protected-branch merge). | Plugin manifest + hooks |

---

## Recommended Project Structure

The spec §3 layout is correct and should be followed. The architecture annotations below mark **dependency direction** (what reads/depends on what) — this drives build order.

```
/
  AGENTS.md                         # SUBSTRATE — points to everything below; depends on roles existing
  CLAUDE.md / GEMINI.md (generated) # DISPATCH pointers — one line, "read AGENTS.md"

  agent-factory/
    config/
      factory.config.json           # DIAL — foundational; roles read it first
      factory.config.md             # human twin of the dial
    roles/*.md                      # PROGRAM — depends on: config schema, handoff names, board columns
    workflows/*.md                  # CONTROL FLOW — depends on: roles + handoffs + checklists existing
    handoffs/*.md                   # MESSAGES — shared dep of roles AND workflows; build early
    checklists/*.md                 # GATES — shared dep; build early
    examples/*.md                   # depends on: everything (illustrative, build late)
    packaging/                      # DISPATCH templates — depends on roles existing
      adapters.md                   #   per-tool map + entry-file templates
      subagent.frontmatter.md       #   Claude Code wrapper template
      slash-command.template.md
      claude-agents/*.md            #   (generated) thin wrappers, one per role
      claude-commands/factory.md

  install/                          # depends on: packaging templates
    install.sh  install.mjs  uninstall.sh  README.md

  .claude-plugin/                   # DISTRIBUTION — depends on agents/commands existing
    plugin.json                     #   ONLY this file lives here
    marketplace.json                #   single-plugin catalog (also in .claude-plugin/)

  agents/  commands/  hooks/  skills/   # plugin-root components (NOT inside .claude-plugin/)

  memory-bank/                      # MEMORY — substrate dep; seed early, ADRs accrete
    00-index.md ... 80-glossary.md
    50-decisions/ADR-000X-*.md

  plans/                            # STATE PLANE — board first, others reference it
    board.md  traceability.md  nfr-catalog.md  metrics.md
    sprints/  releases/  epics/  features/  tickets/

  scripts/validate-agent-factory.mjs   # depends on: all of the above (build last)
```

### Structure Rationale

- **`config/` is foundational** — every role reads it first. Its *schema* (field names, defaults) must be frozen before role files are written, because roles reference `mode`/`cadence`/`autonomy`/`wip_limits` by name. Treat the config schema as the API contract roles code against.
- **`handoffs/` and `checklists/` are shared dependencies** of both roles and workflows. A role's "Output" section names a handoff template; a workflow's "Handoffs produced" lists them; checklists are the gate criteria roles apply. Build these *before* roles so role files can reference real filenames, not placeholders.
- **`roles/` before `workflows/`** — a workflow is an ordered composition of roles; it cannot be written coherently until the roles it sequences exist and their I/O contracts are fixed.
- **`packaging/` and `install/` after `roles/`** — adapters are thin pointers *to role files*. They cannot be generated correctly until the role filenames and the orchestrator's read-order contract are final.
- **`plans/board.md` before other state files** — traceability, sprints, and metrics all reference ticket IDs that live on the board; the board's column vocabulary is also referenced by every role's "Board moves" section.
- **`scripts/validate-*` and `examples/` last** — the validator asserts the *finished* structure (board↔ticket match, required sections); examples narrate the *finished* flow. Both are verification artifacts, not building blocks.

---

## Architectural Patterns

### Pattern 1: Single-source content, thin generated/symlinked dispatch

**What:** Role text lives exactly once in `agent-factory/roles/*.md`. Per-tool adapters are *pointers* (a symlink, or a 3-line wrapper that says "follow `agent-factory/roles/orchestrator.md` exactly"), never copies. The canonical rule from the brand manual and spec §16: **"only the dispatch differs, never the content."**

**When to use:** Always, for every piece of role/workflow/handoff/checklist text. This is the project's defining constraint.

**Trade-offs:** Symlinks are zero-drift (the adapter *is* the source) but break on Windows checkouts without symlink support and are not copied into the Claude Code plugin cache (plugins copy their directory; `../` references won't resolve — verified in current docs). Generated 3-line pointer wrappers work everywhere and survive the plugin cache, but they duplicate the *pointer* (not the content) and need regeneration if filenames change. **Recommendation: ship pointer-wrappers as the portable default** (a wrapper whose entire body is "read and obey `<canonical path>`"), and offer symlinks as an install-time optimization on POSIX. The content still lives once; only an indirection line is repeated.

**Example (Claude Code thin sub-agent wrapper — verified frontmatter fields):**
```markdown
---
name: factory-engineer
description: Implements one ticket from a complete handoff. Use to take a Ready-for-Dev
  ticket through code + tests on a branch. Routes back to the Orchestrator for the gate.
tools: Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
You follow `agent-factory/roles/software-engineer.md` exactly. Read it now, then the config,
the ticket, and the implementation-ready packet. Produce plans/implementation-handoff.md and
update the board + traceability. Never merge a protected branch. Never deploy prod.
```
The role *intelligence* is in `software-engineer.md`; the wrapper only bridges Claude Code's spawn mechanism. The `description` field is load-bearing — it is exactly how Claude Code auto-routes work to this sub-agent (verified: "Claude uses each subagent's description to decide when to delegate").

### Pattern 2: Read-order contract as the universal interface

**What:** Every entry file, in every tool, enforces one sentence: *"All work starts with `agent-factory/roles/orchestrator.md`. Read `AGENTS.md`, then the orchestrator role, then `config/factory.config.json`, then `plans/board.md`."* This single contract is what makes five different dispatch mechanisms behave identically.

**When to use:** It is the seam between the (varying) dispatch layer and the (identical) core. Bake it into AGENTS.md, every generated pointer, the orchestrator wrapper, and the slash command.

**Trade-offs:** Relies on the host agent honoring instructions (no hard enforcement outside Claude Code hooks). Mitigation: keep it short and put it first; long substrates lower compliance.

### Pattern 3: Orchestrator-as-dispatcher with two physical realizations

**What:** The same logical workflow is realized two ways depending on tool capability:
- **Spawn mode (Claude Code):** Orchestrator runs as the main thread (via the plugin `settings.json` `agent` key, or `claude --agent factory-orchestrator`) and **spawns** role sub-agents through the Agent tool (renamed from `Task` in v2.1.63; `Task` still works as an alias — verified). Each sub-agent gets a fresh isolated context and returns a summary (the handoff).
- **Sequential mode (Codex/Gemini/OpenCode/Copilot):** Orchestrator is a single agent that **loads the relevant role file into its own context** when it would otherwise "wake" that role, then continues.

Crucially, **both produce the same handoff packets, hit the same gates, and write the same board/trace updates.** The handoff file is the interface; spawn-vs-sequential is an implementation detail beneath it.

**When to use:** Spawn mode whenever the host supports real sub-agents (currently only Claude Code among the five). Sequential everywhere else.

**Trade-offs:** Spawn mode preserves the main context (verbose work stays in the sub-agent) but **sub-agents cannot spawn sub-agents** (verified) — so the orchestrator must be the *only* spawner; roles are leaves. This maps perfectly to grugops's "head grug routes, single-job grugs execute" design. Sequential mode pollutes one context with all role text but needs zero spawn machinery and is the lowest common denominator. Designing handoffs as the contract means a workflow author never has to know which mode is in play.

**Example (the equivalence that must hold):**
```
WORKFLOW 04-ticket-to-pr  ── identical steps & outputs in both modes ──
  spawn mode:        Orchestrator --Agent--> factory-engineer --> implementation-handoff.md
                     Orchestrator --Agent--> factory-qe        --> qe-handoff.md
  sequential mode:   Orchestrator reads software-engineer.md   --> implementation-handoff.md
                     Orchestrator reads qe-e2e.md              --> qe-handoff.md
  BOTH:  board: Ready for Dev -> In Development -> In Review; trace row updated; same gate result
```

### Pattern 4: Backpressure loop encoded as a deterministic workflow (no runtime)

**What:** The §14 loop — *deterministic prefetch → implement on branch → gate (install/lint/typecheck/unit/build/e2e, commands sourced from AGENTS.md) → bounded self-fix (default 2 from config) → result* — is encoded purely as ordered, numbered steps in `workflows/05-pr-quality-gate.md`, with the orchestrator role enforcing the loop bound. There is no scheduler; the "loop" is a workflow instruction the agent follows: *"if the gate fails and attempts < self_fix_attempts, fix and re-run; else STOP and emit BLOCKED_NEEDS_FIX."*

**When to use:** Every code-producing path (04→05). It is the mechanism that lets humans review architecture instead of typos.

**Trade-offs:** Bounded by the host agent's willingness to count attempts and stop — markdown can't force a hard stop. Two mitigations make it robust: (a) make the bound explicit and small in config (`self_fix_attempts: 2`) and restate it in the workflow's Stop conditions; (b) require the gate to record `UNKNOWN - verify` rather than fabricate a pass when a command is missing from AGENTS.md (a no-fabrication invariant, not a runtime check). The three terminal results — `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED` — are the workflow's return type.

**Example (workflow step encoding):**
```markdown
## Steps
1. Prefetch: read ticket, handoffs, AGENTS.md Commands section, prior ADRs, touched files.
2. Implement on branch (autonomy=branch|pr).
3. Run gate in order: install -> lint -> typecheck -> unit -> build -> e2e
   (commands ONLY from AGENTS.md; unknown -> record "UNKNOWN - verify", never fake a pass).
4. If gate fails AND fix_attempts < config.quality.self_fix_attempts: fix, fix_attempts++, goto 3.
5. Else emit result: READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED.
## Stop conditions
- fix_attempts == self_fix_attempts and gate still red -> STOP, hand to human.
```

### Pattern 5: Mechanical safety via host hooks, not prompts

**What:** "Agents never merge a protected branch or deploy prod without human confirmation" is enforced by a Claude Code `PreToolUse` hook (a matcher on Bash that blocks `kubectl ... apply`, `git push` to protected refs, deploy commands) — exit code 2 blocks the call. The prompt-level rule remains as defense-in-depth, but the hook is the guarantee.

**When to use:** Wherever the host supports hooks (Claude Code). On tools without hooks, the rule degrades to prompt-only — document this honestly as a portability limitation.

**Trade-offs:** Only Claude Code among the five has the hook mechanism, so mechanical enforcement is tool-specific (acceptable: it's the recommended/native tool, and the brand promise "humans decide, agents execute" is strongest there). Plugin sub-agents **cannot** declare `hooks`/`mcpServers`/`permissionMode` in frontmatter (verified) — so the prod-deploy guard must live in the plugin's `hooks/hooks.json` (session-level), not in a sub-agent file.

---

## Data Flow

### State write/reconcile flow (how board, tickets, and trace stay consistent)

```
[Role completes a unit of work]
        │
        ├─► writes its handoff packet            (handoffs/*.md — the message)
        │
        ├─► moves the ticket on plans/board.md   (column transition it OWNS, per role's "Board moves")
        │       └─ updates ticket front-matter:  status: + column:  (MUST equal board column)
        │
        ├─► appends its link to traceability.md   (Architect→ADR/NFR; Engineer→PR/files;
        │                                           QE→tests; UAT→result; Release→REL id)
        │
        └─► (daily-sweep / retro) updates metrics.md and memory-bank/60-progress.md
        ▼
[Orchestrator daily-sweep reconciles]  ── reads board + open handoffs, fixes drift, escalates blocked
        ▼
[validate-agent-factory.mjs]  ── stateless check: every ticket file's column == its board column;
                                  every ticket has a trace row; flags rows missing tests/UAT
```

### The consistency model (explicit)

This is the crux of the downstream question. There is **no database and no transaction**, so consistency rests on three layers:

1. **Single-writer-per-transition convention.** Each board column has exactly one *exit owner* role (spec §6.1: Backlog/Ready→BA/PM, In Development→Software Engineer, In Review→QE/E2E, etc.). Only the exit owner moves a ticket out of its column. This makes concurrent contradictory edits a role-discipline violation, not a race condition — and in spawn mode the orchestrator serializes role activation anyway.

2. **Redundant-but-mirrored state with a designated source of truth.** `plans/board.md` is the **single source of WIP truth**; each `plans/tickets/<ID>.md` carries `status:` + `column:` front-matter that must *mirror* it. Mirroring (not normalizing) is deliberate — both humans and agents read tickets and the board independently. The invariant "ticket.column == board column" is what the validator checks. The board is authoritative on conflict.

3. **Append-mostly, monotonic traceability.** Each role *appends* its link to the trace row as work progresses (BA/PM creates the row at ticket birth; later roles fill cells left→right). A row is "complete through the relevant stage" as a DoD criterion — enterprise DoD is *not met* until the row reaches the required stage. The validator flags incomplete rows. Because cells only fill forward, there's no update-conflict surface.

**ID schemes are the join keys** (spec §10): `EPIC/FEAT/ABC/ADR/NFR/RISK/REL/INC`, prefix from config (`id_prefix`, default `ABC`). These stable IDs are the only thing linking board ↔ ticket ↔ trace ↔ NFR catalog ↔ release — they function as foreign keys across the markdown "tables." Getting the ID scheme right early is load-bearing for every downstream consistency check.

### Handoff / memory model (three time horizons)

```
SHORT-TERM (this unit of work):   handoffs/*.md          ── inter-role message, the "call return value"
MEDIUM-TERM (this project):       plans/* (board, trace) ── live state + audit trail
LONG-TERM (institutional):        memory-bank/*          ── brief, product, arch, progress, runbook, glossary
                                  memory-bank/50-decisions/ADR-000X-*.md  ── one ADR per file, immutable-ish
```
- **Handoffs are the working memory between roles.** A completed packet (universal header + per-role body) is what one role hands the next; in spawn mode it is literally the sub-agent's returned summary. Designing the universal handoff header (with the v2 `Ticket ID` and `Trace updates` fields) first lets every role and workflow reference a stable contract.
- **memory-bank is the seed + long memory.** Seed structure (`00-index` → `80-glossary`) is written at bootstrap; it persists across all work. ADRs are **individual files** (not one growing log) so each decision is independently linkable from a trace row (`ADR-000x`) and diff-friendly. Note: Claude Code sub-agents also support an optional native `memory:` directory — but grugops should keep its memory in `memory-bank/*` so it stays portable across all five tools, not tool-specific.

---

## Build Order (dependency-aware sequence)

Derived from the read/depend arrows above. Each stage's outputs are the next stage's inputs. This is the recommended phase backbone for the roadmap.

```
STAGE 0  SUBSTRATE + DIAL + STATE SKELETON   (everything else references these)
  - config/factory.config.json schema + .md twin (FREEZE field names + zero-config defaults)
  - ID scheme + prefix convention (join keys for all state)
  - plans/board.md (column vocabulary + WIP-limit format)  ← referenced by every role's "Board moves"
  - empty state files: traceability.md, nfr-catalog.md, metrics.md; sprints/ releases/ epics/ features/ tickets/
  - root AGENTS.md substrate (read-order contract, safety rules) — minimal
  WHY FIRST: config schema, board columns, and IDs are the vocabulary every later file cites by name.

STAGE 1  SHARED DEPENDENCIES   (referenced by both roles and workflows)
  - handoffs/*.md (universal header FIRST, then per-role + packets)
  - checklists/*.md (DoR, DoD lean, DoD enterprise, PR, security/NFR, compliance, a11y, observability, release-readiness, UAT)
  - memory-bank/* seed files + 50-decisions/ ADR convention
  WHY HERE: roles name their Output handoff and apply checklists; build the targets before the referencers.

STAGE 2  ROLES   (the program)
  - core 11: orchestrator FIRST (defines routing + read-order it enforces), then mappers, ba-pm,
    system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner, agents-md-scribe
  - enterprise 5: release-manager, compliance-officer, incident-responder, factory-coach, installer
  WHY HERE: each role references config fields, board columns, handoff names, checklist names (Stages 0–1).
            Orchestrator must come first; it is the contract the others slot into.

STAGE 3  WORKFLOWS   (control flow composing roles)
  - lifecycle/bootstrap: 00-bootstrap-greenfield ... 06-uat-pack
  - ceremonies: 07-refinement ... 11-retro
  - enterprise: 12-release, 13-incident
  WHY HERE: a workflow is an ordered composition of existing roles + handoffs + board moves + gates.

STAGE 4  DISPATCH / PACKAGING / INSTALL   (thin adapters pointing at finished roles)
  - packaging/: adapters.md, subagent.frontmatter.md, slash-command.template.md, generated claude-agents/*, claude-commands/factory.md
  - .claude/ standalone form (thin wrappers + /grug command + one-line CLAUDE.md)
  - .claude-plugin/ form (plugin.json + marketplace.json + agents/ commands/ hooks/), incl. PreToolUse prod-deploy guard
  - per-tool pointers (GEMINI.md, .github/copilot-instructions.md); Codex/OpenCode read AGENTS.md natively
  - install/install.sh + install.mjs + uninstall.sh (idempotent, additive, dry-run, reversible)
  WHY HERE: adapters are pointers to role files; their content can't be finalized until role paths + the
            orchestrator read-order are frozen (Stage 2). Safety hook lives at plugin/session level, not in sub-agent frontmatter.

STAGE 5  VERIFICATION + COLLATERAL + DOGFOOD   (asserts the finished system)
  - scripts/validate-agent-factory.mjs (structure + board↔ticket + trace completeness + packaging presence)
  - examples/* (narrate finished flows: greenfield, brownfield, ticket→PR, sprint cycle, release run)
  - brand/docs collateral (README hero, NOTICE, CONTRIBUTING, wordmark/icon SVGs, FAQ)
  - DOGFOOD: install via /grug on a throwaway repo, bootstrap, take one ticket idea→PR end-to-end
  WHY LAST: the validator and examples describe a complete structure; dogfood exercises the whole chain.
```

**Ordering rationale in one line each:**
- *Config + IDs + board before roles* — roles cite them by name; changing them later forces a rewrite of every role.
- *Handoffs + checklists before roles* — they are the I/O contracts roles declare.
- *Roles before workflows* — workflows sequence roles; orchestrator before all (it is the routing contract).
- *Adapters after roles* — adapters are pointers to role files and the read-order contract.
- *Validator + examples + dogfood last* — they assert and exercise the finished whole.

---

## Scaling Considerations

"Scale" here is **file/repo growth and multi-tool/multi-package reach**, not user load (there is no server).

| Scale | Architecture adjustments |
|-------|--------------------------|
| Solo founder, single repo (lean, kanban) | Zero config; core 11 roles; board + light DoD only; skip Security/NFR + Release columns unless a trigger fires. Markdown-only is plenty. |
| Small team, one repo, enterprise flag on | Enterprise pack active; full DoD; traceability completeness enforced; NFR catalog + compliance/a11y/observability gates; scrum cadence optional with `sprints/` files. |
| Monorepo, many packages (`repo_strategy: mono`) | Nested `AGENTS.md` per package pointing back to the root factory; one board or per-area boards; IDs still global. Watch board.md size — split by area if a single board file gets unwieldy. |
| Polyrepo / mixed-CLI org (`repo_strategy: poly`) | One AGENTS.md per repo + a root index; the *same* portable core copied (or git-subtree'd) per repo; plugin/marketplace distribution becomes the update channel so every repo tracks one version. |

### Scaling priorities (what strains first)

1. **First strain — board.md and traceability.md as single files.** Hundreds of tickets make these large to read/diff. Fix: archive Done tickets to a `plans/archive/`, keep the live board lean; the validator should ignore archived rows. WIP limits naturally cap In-flight rows.
2. **Second strain — content drift across tools.** As tools add features, the temptation to special-case role *content* per tool grows. Fix: hold the line — any per-tool difference goes in the dispatch layer or is documented as a known limitation; the validator can assert adapters are pointers (no large bodies) by size/heuristic.
3. **Third strain — Claude Code feature churn.** Sub-agent/plugin conventions move fast (Task→Agent rename, skills/ superseding commands/, AGENTS.md support still pending). Fix: isolate every tool-version-specific assumption in `packaging/adapters.md` marked "verify against current tool docs," so updates touch one file.

---

## Anti-Patterns

### Anti-Pattern 1: Copying role text into per-tool adapters

**What people do:** Paste the orchestrator/engineer prompt into `.claude/agents/*.md`, `GEMINI.md`, Codex config, etc., "so each tool has what it needs."
**Why it's wrong:** Five copies drift the moment one is edited. This violates the single hardest constraint in the spec and the brand promise ("only the dispatch differs, never the content"). It also makes the validator's job impossible and turns a content edit into a five-file change.
**Do this instead:** Adapter bodies are pointers only — *"follow `agent-factory/roles/<role>.md` exactly; read it now."* Content lives once. Use symlinks where supported, pointer-wrappers everywhere else (and inside the plugin cache, since plugins copy their dir and can't reach `../`).

### Anti-Pattern 2: A fat, machine-generated AGENTS.md

**What people do:** Auto-dump every command, every rule, every role summary into AGENTS.md "to be thorough."
**Why it's wrong:** Long machine-written context files measurably *lower* agent success and raise cost (spec §5.A.2, §17.1). It also duplicates content that belongs in role/workflow files — re-introducing drift.
**Do this instead:** Keep AGENTS.md minimal and high-signal: mission, the read-order contract, real commands (unknown → `UNKNOWN - verify`), safety rules, and pointers. Push all detail into the files it references. The AGENTS.md Scribe's job is *removal* as much as authoring.

### Anti-Pattern 3: Letting board.md and ticket front-matter diverge

**What people do:** Move a ticket on the board but forget the ticket file's `status:`/`column:` (or vice versa); or let two roles edit the same ticket's column.
**Why it's wrong:** The board is the single source of WIP truth; divergence breaks the audit trail and the validator, and makes the daily sweep lie.
**Do this instead:** Enforce single-writer-per-transition (only the column's exit owner moves it), mirror status in both places on every move, run the daily-sweep reconciliation, and let the validator hard-fail on `ticket.column != board column`.

### Anti-Pattern 4: An unbounded self-fix loop ("just keep trying until green")

**What people do:** Tell the agent to fix-and-rerun the gate until it passes.
**Why it's wrong:** Burns tokens, hides real blockers, and can fabricate a pass on a missing command. Defeats backpressure (the point is to hand *architecture* to humans, not loop on typos forever).
**Do this instead:** Bound the loop in config (`self_fix_attempts: 2`), restate the bound in the workflow Stop conditions, emit `BLOCKED_NEEDS_FIX`/`SPLIT_REQUIRED` on exhaustion, and record `UNKNOWN - verify` rather than faking a pass.

### Anti-Pattern 5: Enforcing prod safety by prompt only

**What people do:** Rely on "never deploy prod" in the role text.
**Why it's wrong:** A prompt is a hope, not a guarantee; "humans decide, agents execute" must be mechanical to mean anything (PROJECT.md constraint).
**Do this instead:** Ship a Claude Code `PreToolUse` hook (plugin `hooks/hooks.json`, session-level — sub-agent frontmatter can't carry hooks in plugins) that blocks prod-deploy / protected-branch commands by exit code 2. Keep the prompt rule as backup. Document honestly that non-hook tools degrade to prompt-only.

### Anti-Pattern 6: Building workflows before roles (or roles before the config schema)

**What people do:** Write the lifecycle workflows first because they feel like "the product."
**Why it's wrong:** A workflow references roles, handoffs, board columns, and config fields that don't yet exist; you end up rewriting against placeholders and inviting inconsistency.
**Do this instead:** Follow the dependency order — config schema + board + IDs → handoffs + checklists → roles (orchestrator first) → workflows → adapters → validator/examples/dogfood.

---

## Integration Points

### External "services" (host tools — the runtime)

| Tool | Integration pattern | Notes / gotchas (verified mid-2026) |
|------|---------------------|--------------------------------------|
| **Claude Code** | Native sub-agents (spawn via Agent tool) + plugin + hooks | `Task` tool renamed `Agent` in v2.1.63 (`Task` still aliases). Sub-agents **cannot spawn sub-agents** → orchestrator is sole spawner, roles are leaves. Auto-routing is driven by the sub-agent `description` field. Plugin commands/skills namespace as `/<plugin>:<cmd>`; bare `/grug` requires standalone `.claude/commands/grug.md` OR naming the plugin `grug` (→ `/grug:plan`). Plugin sub-agents can't declare `hooks`/`mcpServers`/`permissionMode`. AGENTS.md support still pending → use one-line CLAUDE.md pointer. `settings.json` `agent` key can make the orchestrator the default main thread. `${CLAUDE_PLUGIN_ROOT}` for bundled script paths. Plugins are copied to a cache — no `../` references; use symlinks if sharing files. |
| **Codex CLI** | Reads `AGENTS.md` natively (root + nested; `~/.codex/AGENTS.md` global) | No adapter needed; AGENTS.md must point to roles. Sequential role-load (no spawn). |
| **Gemini CLI** | `GEMINI.md` pointer | One-line "read AGENTS.md and orchestrator role." Sequential. |
| **OpenCode** | Reads `AGENTS.md` (+ its own agent config) | Native AGENTS.md; optional native-agent mapping. Sequential or its own agents. |
| **GitHub Copilot CLI** | `AGENTS.md` + optional `.github/copilot-instructions.md` | Reads AGENTS.md; optional instructions pointer. Sequential. |

**AGENTS.md status (MEDIUM confidence, web sources Feb–May 2026):** AGENTS.md is now stewarded by the Linux Foundation's Agentic AI Foundation and is the de-facto cross-tool standard; Codex, Copilot, Cursor, OpenCode, Gemini (configurable) read it. **Claude Code still uses CLAUDE.md** (native AGENTS.md support pending) — so the spec's "one-line CLAUDE.md → read AGENTS.md" bridge remains the correct approach today.

### Internal boundaries

| Boundary | Communication | Considerations |
|----------|---------------|----------------|
| Dispatch layer ↔ Portable core | The read-order contract (one sentence) | The only seam where tools differ; keep it thin and identical in wording everywhere. |
| Role ↔ Role | Handoff packet (file) | The packet is the interface; spawn-vs-sequential is invisible below it. Universal header is the shared schema. |
| Role ↔ State plane | board.md / traceability.md / tickets via stable IDs | Single-writer-per-transition; IDs are the join keys; mirror status in board + ticket. |
| Workflow ↔ Gate | Checklist criteria + config thresholds | DoD lean vs enterprise selected by `mode`; gate commands sourced only from AGENTS.md. |
| Core ↔ Safety | PreToolUse hook (Claude Code) | Mechanical block for prod/merge; degrades to prompt on non-hook tools (document it). |

---

## Confidence Notes & Open Questions

- **HIGH:** Claude Code sub-agent frontmatter fields, auto-routing via `description`, Agent-tool rename, sub-agents-can't-spawn, plugin directory layout (components at plugin root, only `plugin.json` in `.claude-plugin/`), `marketplace.json` at `.claude-plugin/marketplace.json`, plugin command namespacing, `settings.json` `agent` key, plugin caching (no `../`). All verified against current code.claude.com docs (2026).
- **MEDIUM:** Cross-tool AGENTS.md adoption and Claude Code's "still pending" status — consistent across multiple dated web sources but not from a single canonical registry. Re-verify per-tool before finalizing each adapter (mark adapters.md "verify against current tool docs," as the spec already instructs).
- **Open question for the roadmap:** the `/grug` vs `/grug:plan` command-shape decision (standalone `.claude/commands/` for the literal `/grug` vs plugin form that namespaces) is a packaging-layer choice with brand implications; the spec already flags shipping *both* forms. This belongs in the Stage 4 packaging phase, not earlier.
- **Open question:** symlink vs pointer-wrapper default for non-Claude tools on Windows — recommend pointer-wrappers as the portable default; confirm during dogfood.

## Sources

- Claude Code — Create custom subagents: https://code.claude.com/docs/en/sub-agents (HIGH; frontmatter fields, auto-routing, Agent-tool rename v2.1.63, no nested spawning)
- Claude Code — Create plugins: https://code.claude.com/docs/en/plugins (HIGH; plugin structure, components at root not in `.claude-plugin/`, `settings.json` agent key, skills vs commands)
- Claude Code — Create and distribute a plugin marketplace: https://code.claude.com/docs/en/plugin-marketplaces (HIGH; `.claude-plugin/marketplace.json` schema, add/install commands, plugin caching no `../`)
- AGENTS.md cross-tool status: https://vibecoding.app/blog/agents-md-guide and https://www.deployhq.com/blog/ai-coding-config-files-guide (MEDIUM; AAIF stewardship, Claude Code AGENTS.md pending → CLAUDE.md)
- grugops spec v2 §3/§6/§10/§11/§14/§16/§17 (project contract) and PROJECT.md / brand manual §7.2 (single-source + "only dispatch differs" framing) — primary design source

---
*Architecture research for: portable file-based multi-agent SDLC factory (grugops)*
*Researched: 2026-06-02*
