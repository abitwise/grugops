# Feature Research

**Domain:** Agentic SDLC / multi-agent software-delivery kit (markdown + installers + Claude Code plugin, running on top of coding-agent CLIs)
**Researched:** 2026-06-02
**Confidence:** HIGH on the comparable-tool landscape (verified against current GitHub/docs); MEDIUM on the exact phrasing of the lean↔enterprise dial differentiator (no exact peer found — see note).

---

## Category definition: what these tools are, and what defines the category

This is the "spec-driven / agentic-SDLC kit" category. The members verified during research:

| Tool | What it is | Install | Tools supported | Agents/roles | Governance present? |
|------|-----------|---------|-----------------|--------------|---------------------|
| **BMAD-METHOD** | Multi-agent agile framework; "agent-as-code" | `npx bmad-method install` (Node 20+, Python, uv) | Claude Code, Cursor, "any AI IDE"; web bundles (Gemini Gems, ChatGPT GPTs) | **12+ specialist agents** (Analyst, PM, Architect, SM, Dev, QA, UX…), "Party Mode" multi-persona; **34+ workflows** | Quality gates at every stage transition; story files link back to PRD/architecture; scale-adaptive planning depth. No board/WIP, no formal traceability matrix. |
| **GitHub spec-kit** | Spec-Driven Development toolkit (single-agent, command-driven) | `uv tool install specify-cli` (Python 3.11+, uv) | **30+ agents** (Copilot, Claude, Gemini, Codex, Cursor, opencode, Kiro, Goose…) — switch freely, "no lock-in" | No persistent role agents; a **command pipeline**: `/specify → /plan → /tasks → /implement` plus `/constitution`, `/clarify`, `/analyze`, `/checklist`, `/taskstoissues` | `constitution.md` (principles), quality checklists, cross-artifact `/analyze`, GitHub-issues export. No board, no NFR catalog, no release/incident control. |
| **Agent OS (v2/v3)** | Spec-driven standards + spec-shaping system, Claude-Code-first | Install script (Claude Code primary; adapters for Cursor/Codex/Gemini/Windsurf as sequential prompts) | Claude Code (subagent delegation), Cursor, Codex, Gemini, Windsurf | Single-agent by default; optional multi-agent via Claude Code subagents. 6 phases: Plan Product, Shape Spec, Write Spec, Create Tasks, Implement, Orchestrate | "Standards" layer (3-layer context) + a "Verification" concept. No explicit gates, board, traceability, or release/compliance. |
| **awesome-claude-code-subagents** (VoltAgent et al.) | Curated **catalog** of 100+ Claude Code subagents | `./install-agents.sh` or `claude plugin install <pack>` | Claude Code only | 100+ task-specialist subagents (QA, security, DevOps, architecture, codegen) | None — it is a parts bin, not a process. |
| **GrugCode** (grugbrain.ai) | "LLM coding agent for the grug-brained developer" — anti-complexity coding agent | (hosted/agent product) | Its own agent | Single agent persona | Philosophy-level ("say no to complexity"), not SDLC governance. |

**Adjacent infra (not direct competitors, but they shape expectations):**
- **AGENTS.md** — the cross-tool instruction standard, originated by OpenAI, now governed by the **Linux Foundation's Agentic AI Foundation**. Read natively by Codex CLI, GitHub Copilot, Cursor, Windsurf, Amp, Devin; Claude Code reads it as a *fallback* when no CLAUDE.md exists. Gemini still prefers GEMINI.md. This is grugops's portability substrate and a real, current standard — not a grugops invention.
- **Claude Code plugin system** — versioned bundles of skills/commands/subagents/hooks/MCP, installed via `/plugin` from a Git-hosted `.claude-plugin/marketplace.json`. **PreToolUse hooks** can deny a tool call via exit code 2 — this is the documented, recommended mechanism for guardrails (the grugops "block prod deploy" hook is realistic and current).

**What defines the category (the feature fingerprint every member shares):**
1. A **one-command install** that drops markdown into an existing coding-agent setup.
2. A **structured pipeline from intent → code** (spec/idea → plan/design → tasks/tickets → implement), each step producing a markdown artifact that feeds the next.
3. **Role or phase separation** (even spec-kit, which has no persistent agents, separates the *commands*).
4. **Greenfield + brownfield** support.
5. **Portability across multiple coding agents** (everyone now claims this; spec-kit's "30+ agents" set the bar).
6. **Markdown-first, file-based artifacts** — the spec/plan/tasks live in the repo, in git.
7. **Some notion of a quality check** before "done" (BMAD's gates, spec-kit's `/analyze`+checklists, Agent OS's verification).

grugops sits squarely in this category but pushes hardest on **full lifecycle + delivery OS + governance dial + mechanical safety**, where the others mostly stop at "spec → tasks → code."

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and grugops looks incomplete next to BMAD / spec-kit / Agent OS.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One entry command** (`/grug "<request>"` → orchestrator routes) | spec-kit, BMAD, Agent OS all have a clear single entry; users expect "type one thing, it figures out the step" | LOW | Orchestrator role + slash command. Claude Code auto-namespaces plugin commands as `/<plugin>:<cmd>` — to get literal `/grug`, ship standalone `.claude/commands/` form OR name the plugin `grug`. Verified current behavior. |
| **One-command, safe install** | `npx bmad-method install`, `uv tool install specify-cli`, Agent OS install script are the norm; users will not hand-copy files | MEDIUM | `install.sh` + `install.mjs`. Must be **idempotent, additive, dry-run, reversible** (spec constraint). This is *above* peer baseline — most peers are not reversible/dry-run; lean into it as quality, not novelty. |
| **Greenfield + brownfield bootstrap** | spec-kit explicitly supports 0-to-1, iterative, and legacy-modernization; BMAD spans "brainstorm to deploy". Brownfield (map an existing repo) is the harder, more-valued half | HIGH (brownfield mapping) | greenfield-mapper + brownfield-mapper roles. Brownfield mapping (structure, commands, risks, *safe first tickets*) is where real value lives and where peers are weakest. |
| **Idea → epics → tickets pipeline** | The core spec-driven loop. spec-kit: specify→plan→tasks. BMAD: PRD→architecture→story files | MEDIUM | `02-idea-to-epics`, `03-epic-to-tickets`. Tickets must carry acceptance criteria (Given/When/Then), size, priority, NFR triggers. |
| **Ticket → PR loop with code + tests** | The payoff step. BMAD's Dev agent "implements with tests on a branch"; spec-kit `/implement` | HIGH | `04-ticket-to-pr`. Autonomy dial (diff/branch/pr) is a grugops refinement of the standard loop. |
| **A quality gate before "done"** | BMAD gates at every stage transition; spec-kit `/analyze`+`/checklist`. Users now expect "it checks itself" | MEDIUM | `05-pr-quality-gate` + DoR/DoD checklists. The CI backpressure model (prefetch → implement → gate → bounded self-fix → result) is the concrete form. |
| **Memory / handoff files between steps** | BMAD "story files," spec-kit artifacts, Agent OS 3-layer context — every tool persists context to files | MEDIUM | Handoff templates + memory-bank. This is grugops's "the handoff is the memory" principle; it is table stakes, executed well. |
| **Persistent artifacts in git (the repo is the record)** | All peers write markdown into the repo; users expect to read/review/version it | LOW | board.md, traceability.md, handoffs, ADRs — all markdown. |
| **Cross-tool portability claim** | spec-kit (30+), BMAD (multi-IDE), Agent OS (5 tools) all claim it. A single-tool kit now looks dated | HIGH (to do *well*) | AGENTS.md substrate + thin per-tool adapters for Claude Code, Codex, Gemini, OpenCode, Copilot. "Only the dispatch differs, never the content" is the right model. **Verify per-tool conventions at build time — they move fast.** |
| **Project principles / config** | spec-kit's `constitution.md`, Agent OS "standards", BMAD config. Users expect to set conventions once | LOW | `factory.config.json` + `factory.config.md`. Doubles as the lean↔enterprise dial (differentiator). |
| **Example runs / quickstart** | spec-kit quickstart.md, BMAD docs. Users need to see it work before trusting it | LOW | 5 example runs in spec. Dogfood (run `/grug` on a sample repo idea→PR) is the proof. |
| **Non-affiliation / attribution + README hero** | Public dev-tool norm; plus the grugbrain.dev attribution and Ted-Prior non-affiliation are hard requirements here | LOW | Brand manual supplies copy verbatim. Legal, not optional. |

### Differentiators (Competitive Advantage)

Where grugops can credibly out-position BMAD / spec-kit / Agent OS. Each is grounded in what the peers *lack*.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Lean ↔ enterprise config dial (one flag)** | No verified peer offers a single flag that flips from solo-lite to full governance. BMAD has "scale-adaptive planning depth" (closest analog) but not a release/compliance/gate switch. spec-kit and Agent OS have no enterprise tier. **This is the strongest differentiator.** | MEDIUM | `mode: lean\|enterprise`. Lean = 11 core agents, light DoD, no release/compliance gates unless triggered. Enterprise = +5 roles, full DoD, traceability/NFR/release/compliance mandatory. Every role must honor it; zero-config defaults to lean. |
| **Auditable Kanban/Sprint board + WIP limits in git** | No peer ships a visible board with WIP limits as a state file. BMAD/spec-kit track *artifacts*, not *flow*. "The board is the state" + WIP throttle ("finish before you start") is genuinely novel in this category | MEDIUM | `plans/board.md`, columns with WIP limits from config, ticket front-matter status keeps board+ticket in sync. Both kanban and scrum cadence selectable. |
| **Requirement→code→test→UAT→release traceability matrix** | BMAD story files "link back to PRD/architecture" but there is **no single matrix** answering "why does this code exist and is it tested/accepted?". A real traceability table is an enterprise/audit feature none of the peers formalize | MEDIUM | `plans/traceability.md`, one row per ticket, each role appends its link. Validator can flag rows missing tests. This is the audit story enterprises actually buy. |
| **Mechanical "humans decide / agents never deploy prod" guard** | Everyone *says* humans stay in control; grugops makes it **mechanical** via a Claude Code PreToolUse hook (exit-code-2 deny) + `production_requires_human_confirmation: true`. Verified that PreToolUse can hard-deny tool calls — this is real, not aspirational | MEDIUM | Prompt-level rules + a hook = belt and suspenders. The phrase "an agent cannot be held accountable" is the sales line. Degrades gracefully on tools without hooks (prompt rule only). |
| **True write-once / run-on-5-CLIs portability** | spec-kit claims 30+ but is command-only (no persistent roles); grugops keeps *roles + handoffs + gates* identical across tools and only swaps dispatch. The "single source, thin adapters, never copies" rule prevents the drift that plagues multi-tool kits | HIGH | AGENTS.md core + `packaging/adapters.md`. Risk: keeping it genuinely single-source under five fast-moving tool conventions. Worth the cost — it is the portability moat. |
| **Whole-lifecycle coverage incl. security/NFR/compliance + release + incident** | spec-kit stops at implement; Agent OS at implement/orchestrate; BMAD reaches deployment but without an NFR catalog, compliance officer, or blameless incident loop. grugops covers BA→release→incident→retro | HIGH | NFR catalog (`nfr-catalog.md`), Security/NFR + Compliance roles (GDPR/SOC2/ISO/PCI), Release Manager, Incident Responder, Factory Coach. This is the "complete" pillar. |
| **CI/CD backpressure with bounded self-fix (default 2, then human)** | "Deterministic prefetch → implement → gate → 2 self-fix attempts → STOP" is sharper than peers' open-ended self-correction. Bounded, never-loop-forever, never-fake-a-pass | MEDIUM | Commands come from AGENTS.md (`UNKNOWN - verify` if missing). Result ∈ {READY_FOR_HUMAN_REVIEW, BLOCKED_NEEDS_FIX, SPLIT_REQUIRED}. Directly answers the "agents loop and burn tokens" complaint found in the swarm-criticism literature. |
| **Self-improving factory loop (Factory Coach + metrics + retro)** | The factory is also a product; Coach reads `metrics.md` and writes improvement tickets tagged `factory`. No peer treats the kit itself as a continuously-improved artifact | LOW | Markdown counts, not a metrics platform. Lightweight, distinctive, on-brand. |
| **Grug-brained minimalism (a few strong roles, not a swarm)** | Research confirms the swarm anti-pattern: sequential agents cause "exponential token growth," "cascading hallucinations," reliability degradation. "A few grugs, not a swarm" is a *defensible engineering position*, not just a joke. BMAD ships 12+ agents and 34+ workflows; grugops's 11 core / +5 enterprise is deliberately leaner | LOW (it's a constraint, not a build) | The voice + the constraint reinforce each other. Lean roster also = cheaper to run, easier to read, easier to trust. |
| **Two-voice discipline (caveman in prompts, clear English in security/money/legal)** | A brand/UX differentiator that doubles as a *trust* mechanism: the joke never muddies a safety topic | LOW | Already specified in brand manual. Cheap, memorable, defensible. |

### Anti-Features (Commonly Requested, Often Problematic)

Documented so the roadmap resists scope creep. All five are in the spec's "out of scope" and are correct calls.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Heavyweight platform / runtime / DB / queue / SaaS dashboard** | "Real" enterprise tools have UIs and servers; feels more legitimate | Becomes a thing to operate, host, secure, and maintain — the exact complexity grugops exists to fight. Contradicts "boring on purpose / intelligence lives in the host agent" | File-based markdown + git. The repo *is* the dashboard; the board.md *is* the UI. |
| **30-bot autonomous swarm** | More agents *feels* more capable; BMAD's 12+ sets a "more is better" anchor | Verified failure mode: sequential agents → exponential token growth (CrewAI example), cascading hallucinations, reliability collapse, debugging nightmare. Cost scales badly | A few single-job roles with hard limits + handoff packets. Orchestrator activates only what's needed. |
| **Autonomous merge to protected branch / auto-deploy to prod** | "Full automation" is the dream; competitors imply end-to-end autonomy | Catastrophic if wrong; nobody is accountable; legally/operationally unacceptable for the regulated audience grugops courts. This is the *core* trust position | Agents propose (open PR, prepare release); a **named human** merges/deploys. Enforce mechanically (PreToolUse hook + config flag). |
| **Long machine-generated context files (giant AGENTS.md / per-agent memory dumps)** | "More context = better"; auto-generate everything | Spec note (and emerging consensus): long machine-written context files **measurably lower agent success and raise cost**. The AGENTS.md-Scribe's job is *removal as much as authoring* | Minimal, high-signal AGENTS.md that points to roles/workflows/checklists; push detail into the files it references; mark unknown commands `UNKNOWN - verify`. |
| **Agent marketplace beyond the single-plugin catalog** | Marketplaces look like a growth/platform play; awesome-claude-code's 100+ catalog sets the anchor | Building/curating a marketplace = building a platform = the thing grugops is not. Distracts from the core kit | One plugin + one single-plugin `marketplace.json`. Distribution, not a platform. |
| **Fabricated gate results / faked passing tests / invented commands** | Makes runs look greener; agents are tempted to "complete" the gate | Destroys the entire value prop — "the trace is the proof." A faked pass in a traceability/compliance context is worse than no pass | Never fake. Unknown command → `UNKNOWN - verify`. Gate honestly reports BLOCKED_NEEDS_FIX. Validator checks for completeness, not green-ness. |

---

## Feature Dependencies

```
factory.config.json (the dial)
    └──gates──> mode=lean | enterprise (which roles + which gates activate)
                    └──enables──> enterprise-pack roles (release/compliance/incident/coach)
                    └──enables──> full DoD, NFR catalog, traceability completeness

AGENTS.md substrate
    └──required by──> per-tool adapters (Claude/Codex/Gemini/OpenCode/Copilot)
    └──supplies commands to──> CI/CD backpressure gate (prefetch + gate commands)

Orchestrator (head grug)
    └──requires──> config + board + handoffs (reads all three first)
    └──routes to──> all role agents

Kanban/Sprint board (board.md)
    └──requires──> stable IDs (EPIC/FEAT/ABC/...) + ticket front-matter status
    └──feeds──> metrics.md ──feeds──> Factory Coach (retro / self-improvement)

Traceability matrix (traceability.md)
    └──requires──> stable IDs + each role appending its link
    └──depends on──> BA/PM creating the row at ticket birth
    └──gates (enterprise DoD)──> "row complete through relevant stage"

Mechanical prod-safety guard
    └──best form requires──> Claude Code PreToolUse hook (plugin form)
    └──fallback──> prompt-level rule + config flag (tools without hooks)

Release Manager (enterprise)
    └──requires──> NFR catalog + QE + Security/NFR + UAT evidence + runbook
Incident Responder (enterprise)
    └──feeds──> Factory Coach + backlog (follow-up tickets)
```

### Dependency Notes

- **Everything reads `factory.config.json` first:** the dial is the keystone. Build the config + orchestrator's config-reading behavior early, or every later role has nothing to honor.
- **AGENTS.md must precede adapters and the gate:** the gate's commands come from AGENTS.md; adapters point at it. AGENTS.md substrate is a foundation-phase item, not a polish-phase item.
- **Stable IDs underpin both board and traceability:** without the ID scheme, neither state file can link anything. Define IDs before board/traceability.
- **Board ↔ ticket sync via front-matter:** board.md and the ticket file must never disagree; the status line in front-matter is the mechanism. This is a small but easy-to-get-wrong invariant the validator should check.
- **Mechanical safety has a tool-tiered dependency:** the *strong* form (hook) only exists in the Claude Code plugin form; the standalone/other-tool forms fall back to prompt + config. Roadmap should not block the hook on non-Claude tools.
- **Enterprise roles depend on enterprise artifacts:** Release Manager needs the NFR catalog + evidence trail to exist. If traceability/NFR aren't built, enterprise mode is hollow. Order: core delivery loop → governance artifacts → enterprise roles.
- **Factory Coach depends on metrics.md, which depends on the daily-sweep populating it:** the self-improvement loop is last in the chain.

---

## MVP Definition

The PROJECT.md decision is to **build the full v2 spec in this milestone** (not lean-first). So "MVP" here = the minimum that makes the kit *usable and dogfoodable end-to-end*, with enterprise layered on after the core loop proves out. Treat the bands below as **build/validation ordering within the milestone**, not as a reduced public scope.

### Launch With (v1 — the dogfoodable core)

The acceptance bar from the spec: install via `/grug` on a sample repo, bootstrap, take one ticket idea→PR.

- [ ] **factory.config.json + .md + zero-config defaults** — keystone; every role honors it
- [ ] **Orchestrator + core 11 roles** — the team; reads config/board first, demands handoffs
- [ ] **AGENTS.md substrate (minimal, high-signal)** — portability + gate commands depend on it
- [ ] **Bootstrap workflows (greenfield + brownfield)** — the two front doors
- [ ] **idea→epics→tickets + ticket→PR + quality-gate workflows** — the value loop
- [ ] **Handoff templates + DoR/DoD checklists** — the memory + the gate
- [ ] **board.md + stable IDs + ticket front-matter** — the state (lean: kanban)
- [ ] **CI/CD backpressure (prefetch → gate → bounded self-fix → result)** — the trust mechanism
- [ ] **install.sh + install.mjs (idempotent/additive/dry-run/reversible)** + minimal "just the markdown" path
- [ ] **Claude Code plugin form + PreToolUse prod-safety hook** — mechanical safety differentiator
- [ ] **README hero + acknowledgements + non-affiliation + NOTICE** — legal, non-optional
- [ ] **Dogfood run** — the acceptance proof

### Add After Validation (v1.x — enterprise governance, once the core loop works)

- [ ] **Enterprise-pack roles** (release-manager, compliance-officer, incident-responder, factory-coach, installer) — trigger: core loop validated; enterprise mode flag exists
- [ ] **traceability.md + nfr-catalog.md + metrics.md** — trigger: enterprise demo needs the audit story
- [ ] **definition-of-done-enterprise + compliance/a11y/observability/release-readiness checklists** — trigger: enterprise mode
- [ ] **Release + incident workflows (12, 13)** — trigger: enterprise mode
- [ ] **Scrum cadence + ceremonies (refinement/planning/sprint-review/retro)** — trigger: teams wanting cadence (kanban is the lean default)
- [ ] **Per-tool adapters for Codex / Gemini / OpenCode / Copilot** — trigger: portability claim needs proof beyond Claude Code
- [ ] **Validator script** — trigger: enough structure exists to validate

### Future Consideration (v2+)

- [ ] **Additional compliance regimes / sector packs** — defer until a regulated user asks; avoid speculative governance
- [ ] **Richer metrics / dashboards** — defer; risks becoming a metrics platform (anti-feature). Keep markdown counts.
- [ ] **More example runs / templates** — defer; add as real usage reveals gaps

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Config dial + zero-config defaults | HIGH | MEDIUM | P1 |
| Orchestrator + core 11 roles | HIGH | HIGH | P1 |
| AGENTS.md substrate | HIGH | LOW | P1 |
| Greenfield + brownfield bootstrap | HIGH | HIGH | P1 |
| idea→epics→tickets→PR loop | HIGH | HIGH | P1 |
| Quality gate + CI backpressure | HIGH | MEDIUM | P1 |
| Handoff templates + DoR/DoD | HIGH | LOW | P1 |
| board.md + stable IDs (kanban) | HIGH | MEDIUM | P1 |
| Installers (idempotent/reversible) | HIGH | MEDIUM | P1 |
| Claude Code plugin + prod-safety hook | HIGH | MEDIUM | P1 |
| Brand/legal collateral (README/NOTICE) | MEDIUM | LOW | P1 |
| Lean↔enterprise dial behavior (full) | HIGH | MEDIUM | P1 |
| Traceability matrix | HIGH (enterprise) | MEDIUM | P2 |
| NFR catalog + SLOs | HIGH (enterprise) | MEDIUM | P2 |
| Enterprise-pack roles (5) | MEDIUM | MEDIUM | P2 |
| Enterprise DoD + new checklists | MEDIUM | LOW | P2 |
| Release + incident workflows | MEDIUM | MEDIUM | P2 |
| Scrum cadence + ceremonies | MEDIUM | MEDIUM | P2 |
| Per-tool adapters (Codex/Gemini/OpenCode/Copilot) | HIGH (portability claim) | HIGH | P2 |
| Validator script | MEDIUM | MEDIUM | P2 |
| Factory Coach + metrics loop | MEDIUM | LOW | P2 |
| Additional compliance regimes/packs | LOW (until asked) | MEDIUM | P3 |
| Richer metrics/dashboards | LOW (anti-feature risk) | HIGH | P3 |

**Priority key:** P1 = must have for the dogfoodable launch; P2 = enterprise + portability completeness (this milestone, after core); P3 = defer.

---

## Competitor Feature Analysis

| Feature | BMAD-METHOD | GitHub spec-kit | Agent OS | grugops approach |
|---------|-------------|-----------------|----------|------------------|
| Entry / pipeline | 12+ agents, 34+ workflows, story files | `/specify→/plan→/tasks→/implement` (+constitution/clarify/analyze) | 6 phases (plan→shape→write→tasks→implement→orchestrate) | One `/grug` entry; orchestrator routes through full SDLC. A few roles, not a swarm. |
| Agent count | 12+ (more-is-better) | 0 persistent (command-only) | 1 (optional subagents) | 11 core / +5 enterprise — deliberately lean; backed by swarm-failure evidence |
| Install | `npx bmad-method install` | `uv tool install specify-cli` | install script (Claude-first) | `install.sh` + `install.mjs`, idempotent/additive/dry-run/**reversible** (above peer bar) |
| Tools supported | Claude Code, Cursor, web bundles | 30+ agents | 5 tools (Claude-first) | 5 CLIs via AGENTS.md, "only dispatch differs" — single-source, no drift |
| Greenfield/brownfield | brainstorm→deploy | explicit 0-to-1 / iterative / legacy | spec-shaping (greenfield-leaning) | dedicated greenfield + brownfield mappers; brownfield "safe first tickets" |
| Quality gate | gates at every stage transition | `/analyze` + `/checklist` | "Verification" (unspecified) | CI backpressure: prefetch→gate→bounded self-fix(2)→result; never fake |
| Board / WIP / flow | none | none | none | **board.md with WIP limits** (kanban or scrum) — category-unique |
| Traceability matrix | story↔PRD links (no matrix) | none | none | **traceability.md** requirement→code→test→UAT→release — category-unique |
| NFR / SLO catalog | none | none | none | **nfr-catalog.md** — category-unique |
| Release / incident / compliance | reaches "deploy" | none | none | Release Manager + Incident Responder + Compliance Officer (enterprise) |
| Lean↔enterprise dial | scale-adaptive depth (closest) | none | none | **single `mode` flag** flips roster + gates — strongest differentiator |
| Mechanical prod-safety | prompt-level | prompt-level | prompt-level | **PreToolUse hook** (exit-2 deny) + config flag — mechanical, not hope |
| Self-improvement | none | none | none | Factory Coach reads metrics, writes `factory`-tagged improvement tickets |

---

## Key takeaways for the roadmap

1. **The dial is the keystone and the headline differentiator.** No verified peer flips from solo-lite to full governance on one flag. Build config-reading into the orchestrator and every role from day one; it is both the architecture pivot and the marketing pivot.
2. **Board + traceability + NFR catalog are the category-unique trio.** None of BMAD/spec-kit/Agent OS ship a WIP-limited board, a traceability matrix, or an NFR catalog. These are the auditable-delivery moat — prioritize them as the enterprise differentiators, but only after the core idea→PR loop is dogfoodable.
3. **"A few grugs, not a swarm" is evidence-backed, not just brand.** The multi-agent literature documents token blowup, cascading hallucinations, and reliability loss as agent counts grow. The lean roster is a defensible engineering stance — say so in the docs, citing the failure mode.
4. **Mechanical safety is real and current.** Claude Code PreToolUse hooks can hard-deny tool calls (exit code 2). The "agents never deploy prod" guard can be enforced, not just promised — a genuine trust differentiator for the enterprise audience. Plan graceful fallback (prompt + config) for tools without hooks.
5. **Portability is now table stakes to *claim* but a differentiator to *execute*.** spec-kit's "30+ agents" reset expectations. grugops's edge is keeping roles+handoffs+gates identical and swapping only dispatch (single-source). Budget real effort for the adapter layer and re-verify each tool's conventions at build time — they change fast (AGENTS.md governance moved to the Linux Foundation; Claude Code unified skills/commands in 2026).
6. **Resist the five anti-features actively.** Each (platform, swarm, auto-deploy, long context files, marketplace, faked gates) has a peer or a market pull toward it. The roadmap should treat "did not build X" as a deliverable.

---

## Sources

Comparable tools (verified against current repos/docs, 2026):
- BMAD-METHOD — https://github.com/bmad-code-org/BMAD-METHOD and https://docs.bmad-method.org/ (12+ agents, 34+ workflows, `npx bmad-method install`, story files, stage-transition quality gates)
- BMAD workflow detail — https://reenbit.com/the-bmad-method-how-structured-ai-agents-turn-vibe-coding-into-production-ready-software/ and https://dev.to/jacktt/understanding-the-agents-in-the-bmad-235o (SM/Dev/QA loop, gates before sign-off)
- GitHub spec-kit — https://github.com/github/spec-kit and https://github.github.com/spec-kit/ (slash commands, `uv tool install`, 30+ agents, greenfield/brownfield, constitution/analyze/checklist)
- spec-kit announcement — https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- Agent OS — https://buildermethods.com/agent-os/v2 and https://github.com/buildermethods/agent-os (6 phases, standards layers, Claude-first + adapters, single/multi-agent)
- awesome-claude-code-subagents — https://github.com/VoltAgent/awesome-claude-code-subagents (100+ subagents, install-agents.sh, plugin marketplace)
- awesome-claude-code (curated list) — https://github.com/hesreallyhim/awesome-claude-code

Ecosystem / standards (verified, 2026):
- AGENTS.md standard — https://agents.md/ and https://www.deployhq.com/blog/ai-coding-config-files-guide (originated by OpenAI, now Linux Foundation Agentic AI Foundation; supported by Codex/Copilot/Cursor/Windsurf/Amp/Devin; Claude Code fallback)
- Claude Code plugins/hooks — https://claude.com/blog/claude-code-plugins and https://code.claude.com/docs/en/hooks (plugin bundles, `/plugin` install, marketplace.json, PreToolUse exit-code-2 deny)
- Grug Brained Developer — https://grugbrain.dev/ (Carson Gross / bigskysoftware); GrugCode — https://grugbrain.ai/

Anti-feature / multi-agent evidence (MEDIUM confidence — secondary sources, multiple agree):
- Multi-agent framework tradeoffs — https://aimultiple.com/multi-agent-frameworks and https://galileo.ai/blog/openai-swarm-framework-multi-agents (sequential agents → exponential token growth, cascading hallucinations, reliability degradation)

Project inputs:
- /Users/olgeroeselg/Projects/public/grugops/docs/initial/agent_factory_builder_spec_v2.md
- /Users/olgeroeselg/Projects/public/grugops/docs/initial/grugops_brand_manual.md
- /Users/olgeroeselg/Projects/public/grugops/.planning/PROJECT.md

---
*Feature research for: agentic-SDLC / multi-agent software-delivery kit*
*Researched: 2026-06-02*
</content>
</invoke>
