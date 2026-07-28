# Phase 3: Roles & AGENTS.md Substrate - Research

**Researched:** 2026-06-03
**Domain:** Markdown role-prompt authoring (reproduce-from-spec) + AGENTS.md open-standard substrate
**Confidence:** HIGH (all content is spec-fixed and verified line-by-line against on-disk files; near-zero external-research surface)

## Summary

This is a **reproduce-from-spec, markdown-authoring** phase. It writes 16 role-prompt template files (`agent-factory/roles/*.md`) to a fixed 9-section skeleton, plus the root `AGENTS.md` substrate. The governing decisions (D-00, D-15) are: **reproduce spec-given content VERBATIM; derive the thin connective tissue from frozen Phase-1/2 paths; INVENT NOTHING.** Every caveman prompt, the Orchestrator routing matrix, the §17.1 AGENTS.md skeleton, and Karpathy's 12 rules already exist in source files — this phase copies and wires them, it does not author behavior from scratch.

The single highest-value output of this research is the **staged verbatim source material** below: every role's caveman prompt with exact source line ranges, the complete Orchestrator contract, the §17.1 skeleton, the 12 rules, the Commands slot table, and a confirmed inventory of frozen on-disk paths each role must cite. The planner and executors should not need to re-page through the 1500+-line spec — the load-bearing extracts are reproduced here with `[VERIFIED: on-disk]` provenance and source coordinates.

**Primary recommendation:** Plan in build-order — Orchestrator first (defines the routing contract the other 15 slot into) → 10 remaining core roles → 5 enterprise roles → root `AGENTS.md` last (the Scribe owns the 12 rules; AGENTS.md points at all roles). For each role: paste the spec's caveman prompt verbatim into `## Caveman prompt`, then derive the other 8 sections tersely (one screen) citing only the frozen filenames confirmed in this document. There is **one drift to resolve before authoring** (handoff path prefix — see Frozen Paths section): the spec §5 output lines say `plans/<name>-handoff.md`, but the actual on-disk templates live in `agent-factory/handoffs/`. Roles must cite the real on-disk location.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-00 (LOCKED — copy verbatim, do NOT redesign):** The spec is authoritative for content it already specifies. Reproduce exactly: §5 skeleton (9 headings in order), §5.A.1–11 / §5.B.1–5 caveman prompts (each `You are <name>…` block verbatim as `## Caveman prompt`), the Orchestrator routing matrix / responsibilities / `Orchestrator Decision` output sections / hard limits / each role's `Output (file+format)` line + activation triggers, §17.1 AGENTS.md shape, and Karpathy's 12 rules (verbatim from `.planning/research/AGENTS-MD-BEST-PRACTICES.md`, clear voice).
- **D-04 (Shipped-kit identity):** `agent-factory/roles/*` and root `AGENTS.md` are the user-facing kit TEMPLATE — generic, project-agnostic. grugops's OWN build state stays in `.planning/`; do not conflate.
- **D-05 (root AGENTS.md is Phase-3-owned):** Phase 1 deferred it; this phase creates it.
- **D-13 (Minimal frontmatter precedent):** Phase 2 put `kind:` + tier YAML on handoffs/checklists; Phase 3 extends to roles (D-16).
- **Phase-2 Key Decision (duplicate headers):** the universal-header `## Scope` / `## Risks` are authoritative; duplicate §5.A body sections in `business-handoff.md` / `implementation-handoff.md` are tolerated. Role authors cite the universal-header sections.
- **Voice (brand + D-00):** grug/caveman voice in role prompts; clear/professional voice for the Karpathy rules, safety rules, and any security/compliance/money text (D-21).
- **D-15 (Lean-derived bodies):** reproduce the caveman prompt verbatim; derive the other 8 sections tersely from spec + frozen Phase-1/2 contracts, inventing nothing. One screen per role. `Reads`/`Output`/`Board moves`/`Trace updates` cite real frozen filenames + section names — no parallel/invented names. Honors Karpathy rules 5–7.
- **D-16 (Role frontmatter):** each role file carries `kind: role` + `tier: core | enterprise`. `tier: core` for the 11; `tier: enterprise` for the 5. Exact 2–3-field set/order is Claude's discretion.
- **D-17 (Universal v2 lines, consistent standard):** the three v2 additions — read `agent-factory/config/factory.config.json` first; move `plans/board.md` on column change; append to `plans/traceability.md` — rendered the SAME way across all 16 roles (in `Reads` / `Board moves` / `Trace updates`), not per-role bespoke.
- **D-18 (Generic §17.1 template + UNKNOWN command slots):** root `AGENTS.md` is the shipped generic substrate per §17.1. Its Commands section ships the file-scoped slot table (12 slots), with flags, preferring single-file variants, every value `UNKNOWN - verify`. The Phase-4 bootstrap workflow / Scribe fills real commands per project — never fabricated here. Under the 32 KiB Codex cap. grugops's OWN real commands are NOT special-cased — they stay `UNKNOWN - verify` like any project's.
- **D-19 (Single-source 12 rules):** the 12 rules (4 principles) live verbatim, once, in `AGENTS.md` (clear voice). The AGENTS.md Scribe owns/maintains them (its job per §5.A.2; it may echo in grug voice in its own body). The other 15 roles inherit via `AGENTS.md` with a short pointer; they do NOT restate the rules.
- **D-20 (Encode the contract now; name workflows, don't inline them):** the Orchestrator encodes the routing matrix, request-type classification list, WIP+DoR gate, XL-split (`SPLIT_REQUIRED`), `# Orchestrator Decision` output format, and hard limits. References Phase-4 workflow files by name (`00-bootstrap-greenfield`, `04-ticket-to-pr`, `05-pr-quality-gate`) WITHOUT inlining steps. Role text stays dispatch-neutral (spawn-vs-sequential is a Phase-5 packaging concern). "Only the dispatch differs, never the content."
- **D-21 (AGENTS.md voice split):** clear voice for Mission, Safety rules, the 12 rules, the Commands/Delivery/DoR·DoD pointers. A light grug wink permitted in non-safety framing prose (e.g., Mission), NEVER in the safety rules, 12 rules, or anything a reader must act on precisely.
- **D-22 (Enterprise `Activates when`):** each enterprise role states `mode=enterprise` OR its §5.B trigger — Release Manager: a release request; Compliance Officer: `compliance_regime` set OR personal/financial/health/payment data present; Incident Responder: a production incident OR failing SLO; Factory Coach: end of sprint OR on-demand; Installer: an install/adapter request. Wording discretionary, trigger preserved.
- **D-23 (Board-moves granularity):** each role states the column transitions IT causes at role granularity (e.g., Engineer: `In Development → In Review`). Phase-4 workflows sequence the full path. No workflow step sequences inlined into role files.

### Claude's Discretion

- Exact frontmatter field names/order within D-16's 2–3-field block (e.g. whether to add `id` or `activates`).
- Exact wording of derived `Reads` / `Responsibilities` / `Board moves` / `Trace updates` bullets, as long as they cite frozen names and invent nothing.
- Whether each role opens `Reads` with a shared one-line preamble (config → board → memory-bank-on-start → role inputs) or states reads inline — pick the lower-drift option.
- Exact one-line wording the 15 non-Scribe roles use to point at `AGENTS.md` for the 12 rules.
- Exact slot labels / ordering in the `AGENTS.md` Commands table, and whether the Mission line carries a grug wink (D-21 permits it).
- How enterprise roles phrase `mode=enterprise OR <trigger>` (D-22), preserving the spec trigger.

### Deferred Ideas (OUT OF SCOPE)

- **Workflow files** that sequence roles' board moves / handoffs / trace updates + the bounded quality-gate loop → Phase 4 (FLOW-01..05, GATE-01, BOARD-02/03, SAFE-01).
- **Dispatch mechanics** (Claude subagent spawn vs portable sequential load; Orchestrator-as-main-thread `settings.json agent:`), thin per-tool wrappers, mechanical prod-deploy hook → Phase 5. Role text stays dispatch-neutral (D-20).
- **Filling real commands** into AGENTS.md's `UNKNOWN - verify` slots → per-project at runtime by Phase-4 bootstrap / Scribe, never fabricated here (D-18).
- **Runtime role outputs** (`memory-bank/brownfield-map.md`, `memory-bank/greenfield-plan.md`) → produced when Mapper roles run under Phase-4 bootstrap, not seeded in Phase 3.
- **Phase-6 validator's exact section-presence checks** → Phase 6 (VAL-01).
- **Final version string + commands/-vs-skills/ form** → Phase 5 open decisions.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROLE-01 | All 11 core role prompts exist, 9-section skeleton, caveman voice; each reads config first, updates board on column change, appends traceability | Roles Inventory table (rows 1–11) gives verbatim-prompt source lines, emitted handoff, board transition, activation trigger per role. §5 skeleton (spec L311–322) reproduced. D-17 universal-v2-lines standard defined. |
| ROLE-02 | All 5 enterprise role prompts exist, same skeleton+voice, activate only on `mode=enterprise` or trigger | Roles Inventory rows 12–16; D-22 `Activates when` triggers extracted verbatim from §5.B (spec L508–566). |
| ROLE-03 | Orchestrator encodes full routing matrix + request-type classification, enforces WIP+DoR before pulling work, splits XL, holds hard limit (never merge protected branch / deploy prod) | Full Orchestrator Contract section: routing matrix (spec L364–378), 9 responsibilities (L347–360), 15-item classification (L351–353), `# Orchestrator Decision` 10-section output (L380), hard limits (L384–386). XL-split + WIP from §6.1/§6.3 (on-disk board.md confirms). |
| AGENTS-01 | Root `AGENTS.md` follows §17.1 shape, minimal/high-signal, <32 KiB, file-scoped commands with flags, `UNKNOWN - verify` | §17.1 skeleton reproduced verbatim (spec L1453–1496). Commands slot table (best-practices file §C). Size-cap discipline noted. |
| AGENTS-02 | AGENTS.md (and the Scribe role) embeds Karpathy's 12 rules under 4 principles, clear voice; Scribe owns them | 12 rules reproduced verbatim (best-practices file §A, L11–34). D-19 single-source placement. §5.A.2 Scribe ownership confirmed. |
</phase_requirements>

## Architectural Responsibility Map

This phase has no runtime tiers (it ships markdown templates), so the "tier" here is **which artifact owns each capability** — the key sanity-check for the planner is single-source ownership (no duplication, no invention).

| Capability | Primary Owner | Secondary | Rationale |
|------------|--------------|-----------|-----------|
| Routing / classification / WIP+DoR gate / XL-split / hard limits | `orchestrator.md` | — | §5.A.1 is the routing contract; the other 15 roles slot into it (D-20). Authored first. |
| The 12 Karpathy rules (verbatim, clear voice) | root `AGENTS.md` | `agents-md-scribe.md` (owns/maintains; may echo in grug voice) | D-19 single-source: live once in AGENTS.md; 15 roles inherit via a one-line pointer. |
| Each specialist's behavior + emitted handoff + board move | the role's own `roles/*.md` | the Phase-2 handoff template it names | D-15: role states what it causes; the handoff template (frozen Phase 2) defines the output format. |
| Sequencing roles' board moves into a full path | Phase-4 workflows (OUT OF SCOPE) | — | D-23/D-20: roles state role-granularity transitions only; workflows sequence them. |
| Real command values | per-project runtime (Phase-4 bootstrap / Scribe) | — | D-18: ship `UNKNOWN - verify` slots; never fabricate. |
| Config dial the roles read | frozen `factory.config.json` (Phase 1) | — | D-17: every role reads it first; roles cite, never redefine. |
| Board state + traceability the roles transition/append | frozen `plans/board.md` + `plans/traceability.md` (Phase 1) | — | D-17/D-23: roles cite the frozen columns + matrix columns. |

## Standard Stack

Markdown only. No packages installed in this phase. No registries to verify.

### Core
| Artifact format | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| Markdown (CommonMark) + YAML frontmatter | n/a | All 16 role files + root AGENTS.md | The whole kit is readable, diffable, git-native markdown (CLAUDE.md constraint: "Markdown for everything except installers"). |
| AGENTS.md open standard | LF-stewarded, plain markdown (no schema) | The portable substrate every host tool reads | "Just standard Markdown. Use any headings you like." Codex enforces a 32 KiB cap (`project_doc_max_bytes`) — the only hard constraint on the file. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-role frontmatter `kind: role` + `tier:` | No frontmatter | D-16 requires it — gives the Phase-6 validator + Phase-5 wrappers a stable machine key. Not optional. |
| Single-source 12 rules in AGENTS.md | Restating in each role | D-19 forbids restatement (drift). One source, 15 pointers. |

**Installation:** None. This phase writes files only; it installs nothing.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** It authors markdown template files into an existing repo tree. No npm/PyPI/crates dependency is added. slopcheck / registry verification is moot. (Confirmed: the only "dependencies" are pre-existing on-disk Phase-1/2 files, inventoried below.)

---

## Roles Inventory (slice this into per-role plans)

Each row gives everything a per-role plan needs. **Source lines are into `docs/initial/agent_factory_builder_spec_v2.md`.** Caveman-prompt blocks are reproduced verbatim in the next two sections; this table is the index. `[VERIFIED: on-disk]` = the cited frozen output/handoff file exists on disk (confirmed in Frozen Paths section).

> **Handoff path note (drift — read first):** Spec §5 output lines write `plans/<name>-handoff.md`. The **actual on-disk templates live in `agent-factory/handoffs/<name>.md`** (no `plans/` prefix, no `-handoff` suffix variance). The "Emitted handoff (on disk)" column below gives the REAL path roles must cite. See Frozen Paths → Drift.

### Core roles (tier: core) — ROLE-01

| # | Role / file | Prompt src lines | Emitted output (real on-disk path) | Board transition (role granularity, D-23) | Activates when |
|---|-------------|------------------|-------------------------------------|--------------------------------------------|----------------|
| 1 | Orchestrator — `orchestrator.md` | §5.A.1, L332–343 (prompt); L347–386 (full contract) | `# Orchestrator Decision` (inline output, not a handoff file) | Owns exits for **Ready for Dev → In Development** (pulls sized work) and **Done** (closes); enforces every column's WIP | Any incoming request — routes all 15 request types |
| 2 | AGENTS.md Scribe — `agents-md-scribe.md` | §5.A.2, L391–398 (prompt); L400 (v2 note) | root `AGENTS.md` (and owns the 12 rules within it) | none (substrate authoring, not board flow) | Need AGENTS.md created/updated (routing matrix: "Need AGENTS.md") |
| 3 | Brownfield Mapper — `brownfield-mapper.md` | §5.A.3, L405–408 | `memory-bank/brownfield-map.md` (runtime output; template not seeded — Phase-4) | none (maps; doesn't move tickets) | Need repo mapping of an existing repo |
| 4 | Greenfield Mapper — `greenfield-mapper.md` | §5.A.4, L415–420 | `memory-bank/greenfield-plan.md` (runtime output; not seeded — Phase-4) | none (shapes empty land; first tickets land in Backlog) | Need repo mapping / shaping of empty land |
| 5 | BA/PM — `ba-pm.md` | §5.A.5, L427–431 | `agent-factory/handoffs/product-handoff.md` + `plans/epics/*` `plans/features/*` `plans/tickets/*` | **Backlog → Ready** (owns Ready exit; sizes+prioritizes at refinement) | Need product clarity |
| 6 | System Analyst — `system-analyst.md` | §5.A.6, L439–442 | `agent-factory/handoffs/system-handoff.md` | **(In Analysis exit)** → moves into design readiness | Need flows or system rules |
| 7 | Architect/Design — `architect-design.md` | §5.A.7, L450–453 | `agent-factory/handoffs/architecture-handoff.md` + ADRs in `memory-bank/50-decisions/ADR-000X-*.md`; updates `plans/nfr-catalog.md` | **(In Design exit)** → ready for dev | Need structure or tradeoffs |
| 8 | Software Engineer — `software-engineer.md` | §5.A.8, L461–466 | `agent-factory/handoffs/implementation-handoff.md` | **In Development → In Review** | Need code (one ticket) |
| 9 | QE/E2E — `qe-e2e.md` | §5.A.9, L473–478 | `agent-factory/handoffs/qe-handoff.md` | **In Review** exit (PR+QE) → toward Security/NFR or UAT | Need tests |
| 10 | Security/NFR — `security-nfr.md` | §5.A.10, L485–489 | `agent-factory/handoffs/security-nfr-handoff.md` | **In Security/NFR** exit → Ready for UAT | Triggers (spec L490): auth, 2FA, biometrics, payments, banking, investment data, personal data, GDPR, public API, file upload, admin action, DB migration, queue/event, external integration, perf-sensitive flow |
| 11 | UAT Planner — `uat-planner.md` | §5.A.11, L496–499 | `agent-factory/handoffs/uat-handoff.md` | **Ready for UAT → In UAT** and owns **In UAT** exit | Need business acceptance |

### Enterprise roles (tier: enterprise) — ROLE-02

| # | Role / file | Prompt src lines | Emitted output (real on-disk path) | Board transition (role granularity) | Activates when (D-22, verbatim trigger) |
|---|-------------|------------------|-------------------------------------|-------------------------------------|------------------------------------------|
| 12 | Release Manager — `release-manager.md` | §5.B.1, L511–516 | `plans/releases/REL-xxxx.md` + `agent-factory/handoffs/release-handoff.md` | owns **Ready to Release** exit → Done (after human approval) | `mode=enterprise` OR a release request |
| 13 | Compliance Officer — `compliance-officer.md` | §5.B.2, L523–528 | appends to `agent-factory/handoffs/security-nfr-handoff.md` + fills `agent-factory/checklists/compliance-checklist.md` per ticket | none (gate within In Security/NFR) | `mode=enterprise` OR `compliance_regime` set OR personal/financial/health/payment data present |
| 14 | Incident Responder — `incident-responder.md` | §5.B.3, L535–540 | `agent-factory/handoffs/incident-postmortem.md` (blameless) | none (post-release; feeds backlog + retro) | `mode=enterprise` OR a production incident OR failing SLO |
| 15 | Factory Coach — `factory-coach.md` | §5.B.4, L547–552 | `agent-factory/handoffs/retro-notes.md` + improvement tickets in `plans/tickets/` tagged `factory` | none (reads metrics; writes factory tickets) | `mode=enterprise` OR end of sprint OR on-demand |
| 16 | Installer — `installer.md` | §5.B.5, L559–564 | tool-specific adapter/entry files (per §16) + install report | none (tooling, not board flow) | `mode=enterprise` OR an install/adapter request |

**Verbatim-prompt note:** "verbatim" = the `text` block exactly as in the spec, reproduced as the role's `## Caveman prompt`. The line numbers are the body of each fenced `text` block (excluding the fence markers). Reproduce the prompt lines themselves; do not reproduce the spec's surrounding fences/labels.

---

## Verbatim Caveman Prompts (all 16 — stage for direct paste)

> Every block below is `[VERIFIED: on-disk]` against `docs/initial/agent_factory_builder_spec_v2.md`. Paste each verbatim into the role's `## Caveman prompt` section.

### Core

**1. Orchestrator** (L332–343)
```
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

**2. AGENTS.md Scribe** (L391–398)
```
You are AGENTS.md Scribe.
You write rules for future agents.
You keep rules short and high-signal.
You include real commands only.
You remove what a linter or CI already enforces.
You include safety, repo map, and the done definition.
You do not invent fake commands.
```

**3. Brownfield Mapper** (L405–408)
```
You are Brownfield Mapper.
You inspect the existing repo.
You find structure, commands, architecture, tests, risks.
You do not refactor. You do not fix. You only map.
```

**4. Greenfield Mapper** (L415–420)
```
You are Greenfield Mapper.
You shape empty land.
You choose boring stack unless told.
You create the folder and docs plan and a first architecture sketch.
You do not overbuild.
```

**5. BA/PM** (L427–431)
```
You are BA/PM.
You find user, pain, value.
You cut scope. You protect MVP. You say no to bloat.
You make epics, features, tickets with acceptance criteria.
```

**6. System Analyst** (L439–442)
```
You are System Analyst.
You take product tickets.
You map flows, actors, states, inputs, outputs, edge cases.
You do not choose framework. You do not code.
```

**7. Architect/Design** (L450–453)
```
You are Architect.
You make structure and boundaries.
You expose tradeoffs. You write ADRs.
You keep design just enough. You prefer boring tech. You protect future change.
```

**8. Software Engineer** (L461–466)
```
You are Software Engineer.
You implement one ticket.
You read the handoff first.
You make a small diff. You add tests. You run checks. You update docs.
You stop if scope grows or architecture must change.
```

**9. QE/E2E** (L473–478)
```
You are QE/E2E.
You break the feature.
You test happy, sad, and edge paths.
You write E2E where useful with stable selectors.
You avoid flaky tests. You report gaps.
```

**10. Security/NFR** (L485–489)
```
You are Security/NFR.
You look for danger.
You check auth, data, secrets, performance, reliability, logs, compliance notes.
You do not gold-plate.
```

**11. UAT Planner** (L496–499)
```
You are UAT Planner.
You speak business.
You make test scenarios, signoff checklist, test data, pass/fail.
You do not code.
```

### Enterprise

**12. Release Manager** (L511–516)
```
You are Release Manager.
You cut releases, not corners.
You set the version. You write release notes and the changelog.
You make a deploy plan and a rollback plan.
You require approval. You never deploy prod yourself.
```

**13. Compliance Officer** (L523–528)
```
You are Compliance Officer.
You protect people and the audit trail.
You classify data. You map PII flow.
You check the regime: GDPR, SOC2, ISO 27001, PCI, sector rules.
You write down controls and gaps. You do not invent legal advice.
```

**14. Incident Responder** (L535–540)
```
You are Incident Responder.
You stop the bleeding first.
You find blast radius. You propose mitigation and rollback.
You write a blameless postmortem.
You turn lessons into tickets.
```

**15. Factory Coach** (L547–552)
```
You are Factory Coach.
You read the metrics, not the vibes.
You run the retro.
You find waste, rework, escaped defects, slow gates.
You write improvement tickets for the factory itself.
```

**16. Installer** (L559–564)
```
You are Installer.
You make this factory usable in the current tool.
You detect the host coding agent.
You lay down the right adapter and entry file.
You are additive. You never overwrite user content. You support dry-run and uninstall.
```

---

## The Orchestrator Contract (ROLE-03 / D-20) — full extract from §5.A.1

The Orchestrator is authored **first**. All extracts below are `[VERIFIED: on-disk]` from the spec.

### The §5 skeleton (every role file — L311–322, verbatim headings in order)
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
**Note:** the section is `## Output (file + format)` — keep the parenthetical. `## Board moves` and `## Trace updates` carry parentheticals in the spec; the **validator (§18) checks for the bare names** (`Board moves`, `Trace updates`) so either form passes a `contains` check, but reproduce the spec's parenthetical form for fidelity.

### Responsibilities (L347–360, verbatim)
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

### Request-type classification list (15 items — from responsibility 3, D-20)
`greenfield-bootstrap | brownfield-bootstrap | idea-to-epics | epic-to-tickets | ticket-to-pr | quality-gate | uat | refinement | sprint-planning | daily-sweep | sprint-review | retro | release | incident | install`

### Routing matrix (L364–378, verbatim)
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

### `# Orchestrator Decision` output sections (L380, verbatim — 10 sections, in order)
`Request type` · `Mode/Cadence/Autonomy in effect` · `Activated agents` · `Why` · `Required inputs` · `Workflow` · `Board moves` · `Expected handoffs` · `Stop conditions` · `Next action`

### Hard limits (L384–386, verbatim)
```text
Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason.
```

### WIP / Definition-of-Ready gate (from §6.1 + on-disk `plans/board.md`)
- WIP limits come from config `wip_limits` (frozen lean defaults on disk: Ready 8, In Analysis 2, In Design 2, Ready for Dev 6, In Development 3, In Review 3, In Security/NFR 2, Ready for UAT 4, In UAT 4, Ready to Release 4; Backlog/Done unlimited; Blocked visible+time-tracked).
- The Orchestrator **refuses to pull new work past a WIP limit without a written reason** (responsibility 5 + hard limit 3).
- **Definition of Ready gate** (responsibility 7): stop work if input is not ready — cite `agent-factory/checklists/definition-of-ready.md`.

### XL-split (`SPLIT_REQUIRED`) (responsibility 8 + §6.3 on-disk board.md)
- Sizing `XS=1 S=2 M=3 L=5 XL=8`; **XL must be split**; the Orchestrator enforces "no XL into dev." Emit `SPLIT_REQUIRED` when a ticket is XL. Note `SPLIT_REQUIRED` is also a quality-gate result token (GATE-01, Phase 4) — keep the Orchestrator's usage to the sizing gate.

### Phase-4 workflow filenames the Orchestrator references BY NAME (do NOT inline — D-20)
Confirmed from spec §3 tree (L173–185) and §7 (L736–779). These 14 files do not exist yet (Phase 4) — the Orchestrator names them in its `Workflow` decision line / routing without inlining their steps. The on-disk `agent-factory/README.md` already maps the copy-paste prompts to these numbers, so the Orchestrator must stay consistent with it:

| # | Workflow file | Classification it serves |
|---|---------------|--------------------------|
| 00 | `00-bootstrap-greenfield.md` | greenfield-bootstrap |
| 01 | `01-bootstrap-brownfield.md` | brownfield-bootstrap |
| 02 | `02-idea-to-epics.md` | idea-to-epics |
| 03 | `03-epic-to-tickets.md` | epic-to-tickets |
| 04 | `04-ticket-to-pr.md` | ticket-to-pr |
| 05 | `05-pr-quality-gate.md` | quality-gate |
| 06 | `06-uat-pack.md` | uat |
| 07 | `07-backlog-refinement.md` | refinement |
| 08 | `08-sprint-planning.md` | sprint-planning (scrum) |
| 09 | `09-daily-sweep.md` | daily-sweep (both cadences) |
| 10 | `10-sprint-review.md` | sprint-review (scrum) |
| 11 | `11-retro.md` | retro (both; light in lean) |
| 12 | `12-release.md` | release (enterprise) |
| 13 | `13-incident.md` | incident (enterprise) |

**Mapping completeness:** 15 classifications → 14 workflow files. The asymmetry is intentional — `install` is a classification with **no numbered workflow** (handled by the Installer role + `/factory:install` self-bootstrap, §16.7), not a lifecycle workflow. Every other classification maps 1:1.

---

## §17.1 Root AGENTS.md Skeleton (AGENTS-01 / D-18) — verbatim extract (L1453–1496)

Reproduce this shape. Fill the Commands subsections from the slot table below; everything else stays as written, in clear voice (D-21; a light grug wink permitted only in Mission).

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

**Section-name reconciliation (objective named 9 slots):** the objective's "Mission / How to work here / Role·workflow·handoff files / Commands / Delivery / Safety rules / DoR·DoD / Memory bank & plans / When uncertain" maps 1:1 to the spec's 9 `##` headings above. There is **no separate "12 rules" heading in the §17.1 skeleton** — D-19 places the 12 rules in AGENTS.md, so the planner must **decide where they slot**: the lowest-invention option is a new `## Coding rules (the 12)` section (clear voice) OR fold them under a behavioral-guardrails area near Safety rules. This is a small authoring decision flagged in Open Questions — it does not contradict §17.1 (the standard says "use any headings you like"), but it is an addition beyond the literal skeleton, so it must be a deliberate, minimal placement.

**Size discipline:** Codex caps AGENTS.md at 32 KiB (`project_doc_max_bytes`). The skeleton + 12 rules + slot table is well under this (a few KiB). Push detail into the files it points to (D-18 / §5.A.2). Do not inline role bodies or workflow steps.

---

## Karpathy's 12 Rules (AGENTS-02 / D-19) — verbatim from `.planning/research/AGENTS-MD-BEST-PRACTICES.md` (L11–34)

Reproduce verbatim in **clear voice**, **once**, in `AGENTS.md`. The AGENTS.md Scribe owns them; the other 15 roles point at them with one line (do not restate — D-19).

### Principle 1 — Think Before Coding
1. **State assumptions explicitly.** If uncertain, ask.
2. **Present multiple interpretations.** If multiple readings exist, surface them — don't pick silently.
3. **Push back when warranted.** If a simpler approach exists, say so.
4. **Stop when confused.** Name what's confusing. Ask.

### Principle 2 — Simplicity First
5. **Only requested features.** No features beyond what was asked.
6. **No single-use abstractions.** Don't abstract one-off code.
7. **No unrequested flexibility.** No "configurability" that wasn't requested.
8. **No impossible-scenario handling.** No error handling for cases that can't occur.
- Heuristics: "If you write 200 lines and it could be 50, rewrite it." Ask whether a senior engineer would call it overcomplicated; simplify if yes.

### Principle 3 — Surgical Changes
9. **Preserve adjacent code.** Don't "improve" unrelated code, comments, or formatting.
10. **Don't refactor working code.** Leave functioning logic untouched.
11. **Match existing style**, even if you'd do it differently.
12. **Flag, don't delete, pre-existing dead code.** Mention it; don't remove it unless asked.
- Corollary: remove only the imports/variables/functions YOUR edits made unused. Every changed line connects directly to the request.

### Principle 4 — Goal-Driven Execution
- Transform tasks into **verifiable goals** with specific checks.
- For multi-step work, outline a brief plan with steps and verification points.
- "Strong success criteria let you loop independently." Give the agent success criteria, not step-by-step commands, and let it loop until they're met.

> Note: Principle 4 in the source is prose-form (not numbered 13–16); the "12 rules" are rules 1–12 across Principles 1–3, with Principle 4 as the framing fourth principle. ROLE/AGENTS-02 calls this "12 rules grouped under four principles" — reproduce all four principles exactly as above.

## Commands Slot Table (AGENTS-01 / D-18) — from best-practices file §C (L60–73)

The Commands section ships these 12 slots, **with flags, preferring single-file variants, every real value `UNKNOWN - verify`** (the Example column is illustrative ONLY — do NOT ship the examples as real commands; ship `UNKNOWN - verify`). Slot labels/ordering are Claude's discretion; map them onto the §17.1 `### Install/Development/Test/Lint/Typecheck/Build/E2E` subheadings (the slot table is finer-grained than the skeleton's 7 subheadings — fold single-file variants under their parent).

| # | Slot | Example (illustrative — ship `UNKNOWN - verify`, NOT this) |
|---|------|------------------------------------------------------------|
| 1 | Install / bootstrap | `npm install` |
| 2 | Dev / run | `npm run dev` |
| 3 | Build (use sparingly) | `npm run build` |
| 4 | Test (all) | `npm test` |
| 5 | Test (single file) | `npx vitest run path/to/file.test.ts` |
| 6 | Lint (all) | `npm run lint` |
| 7 | Lint (single file, autofix) | `npx eslint --fix path/to/file.ts` |
| 8 | Format (single file) | `npx prettier --write path/to/file.ts` |
| 9 | Typecheck (single file) | `npx tsc --noEmit path/to/file.ts` |
| 10 | E2E | `npx playwright test` |
| 11 | Docs build / link-check | `npm run docs:build` |
| 12 | Clean / reset | `npm run clean` |

**D-18 critical reminder:** grugops's OWN real commands (Phase-6 validator, Phase-5 installers) do NOT exist yet and are intentionally NOT special-cased. They stay `UNKNOWN - verify` slots like any installed project's. Do not fabricate `node scripts/validate-agent-factory.mjs` or similar — those are future artifacts.

---

## Frozen Paths Confirmed On Disk (cite these; flag drift)

> Every path below was listed/read on disk this session. `[VERIFIED: on-disk]` = the file exists now. Roles cite these EXACT paths in their `Reads` / `Output` / `Board moves` / `Trace updates` (D-15, D-17). **Do not invent parallel names.**

### Phase-1 plans (roles cite by name; do NOT redefine)
| Path | Exists | Roles that cite it |
|------|--------|--------------------|
| `agent-factory/config/factory.config.json` | ✓ | ALL 16 — `Reads` first (D-17). Has `mode`/`cadence`/`autonomy`/`wip_limits`/`quality`/`nfr`/`compliance_regime` (verified). |
| `agent-factory/config/factory.config.md` | ✓ | twin doc; referenced if a role explains config |
| `plans/board.md` | ✓ | ALL — `Board moves` (D-17/D-23). 13 columns confirmed (Backlog…Blocked). |
| `plans/traceability.md` | ✓ | ALL — `Trace updates` (D-17). Columns: Ticket·Title·Epic·Feature·NFRs·Code·Tests·UAT·Release·Status. |
| `plans/nfr-catalog.md` | ✓ | Architect seeds; Security/NFR checks; Release Manager attaches evidence |
| `plans/metrics.md` | ✓ | Factory Coach reads (§5.B.4) |
| `plans/epics/` `plans/features/` `plans/tickets/` | ✓ (`.gitkeep`) | BA/PM writes tickets; Factory Coach writes `factory`-tagged tickets |
| `plans/releases/` | ✓ (`.gitkeep`) | Release Manager writes `REL-xxxx.md` |
| `plans/sprints/` | ✓ (`.gitkeep`) | scrum cadence (Phase-4 territory; roles reference for sprint-planning) |

### Phase-2 handoffs (the REAL `Output` targets — note the on-disk path)
All under `agent-factory/handoffs/` `[VERIFIED: on-disk]`: `universal-handoff.md` (header all inherit; `kind: handoff`, has `## Source/Goal/Scope/Inputs used/Decisions/Risks/Trace updates/Next agent/Next action` + `Ticket ID:` field), `product-handoff.md`, `system-handoff.md`, `architecture-handoff.md`, `implementation-handoff.md`, `qe-handoff.md`, `security-nfr-handoff.md`, `uat-handoff.md`, `release-handoff.md`, `incident-postmortem.md`, `retro-notes.md`, `business-handoff.md`, `ticket-ready-packet.md`, `implementation-ready-packet.md`, `refinement-notes.md`, `sprint-plan.md`.

### Phase-2 checklists (DoR/DoD targets the Orchestrator + roles cite)
All under `agent-factory/checklists/` `[VERIFIED: on-disk]`, governed by `00-index.md` (mode-gating rule confirmed): `definition-of-ready.md`, `definition-of-done.md`, `definition-of-done-enterprise.md`, `pr-review-checklist.md`, `security-nfr-checklist.md`, `compliance-checklist.md`, `accessibility-checklist.md`, `observability-slo-checklist.md`, `release-readiness-checklist.md`, `uat-checklist.md`. (Index frontmatter pattern `kind: checklist` + `tier:` frozen by Phase-2 D-14.)

### memory-bank (read-on-start contract)
`[VERIFIED: on-disk]`: `memory-bank/00-index.md` (read-on-start; `kind: index`; states "Roles read this bank on start", "`60-progress.md` = running plan-of-record kept by daily sweep", "`50-decisions/` captures ADRs"), `50-decisions/ADR-template.md` (`kind: adr-template`; sections Status/Context/Decision/Alternatives/Consequences/Rollback — the Architect's ADR target → `ADR-000X-<slug>.md`), plus `10-project-brief`…`80-glossary` + `70-runbook.md` (Release Manager reads). `brownfield-map.md` / `greenfield-plan.md` are NOT on disk — runtime Mapper outputs (Phase-4), correctly absent.

### README consistency target
`agent-factory/README.md` `[VERIFIED: on-disk]`: "Start here → `agent-factory/roles/orchestrator.md`" pointer + the 8 copy-paste Orchestrator prompts (bootstrap-brownfield, greenfield, refine #07, sprint #08, daily sweep #09, ticket-to-pr #04, gate #05, UAT #06, release #12). **The Orchestrator role + routing this phase writes MUST stay consistent with these workflow numbers and the "all work starts at orchestrator.md" rule.** The README also already states AGENTS.md "lands in Phase 3" — this phase fulfils that note.

### root AGENTS.md
**Does NOT exist on disk** (confirmed — only `agent-factory/roles/.gitkeep` and no repo-root `AGENTS.md`). Phase-3-owned per D-05; this phase creates it. (Note: repo root has `CLAUDE.md` — grugops's own dev instructions — which is a DIFFERENT file and must not be touched; the new `AGENTS.md` is the shipped generic substrate per D-04.)

### Drift / inconsistencies flagged (resolve before authoring)

1. **Handoff path prefix (HIGH — affects 8+ roles).** Spec §5 output lines write `plans/product-handoff.md`, `plans/system-handoff.md`, `plans/architecture-handoff.md`, `plans/implementation-handoff.md`, `plans/qe-handoff.md`, `plans/security-nfr-handoff.md`, `plans/uat-handoff.md`, `plans/release-handoff.md`. The **actual on-disk templates live in `agent-factory/handoffs/`** (no `plans/` prefix). CONTEXT.md §canonical_refs confirms the real location is `agent-factory/handoffs/*`. **Resolution (D-15: cite real frozen names):** roles cite `agent-factory/handoffs/<name>.md` as the template/format and may note the instance is filled per-ticket. The §17.1 AGENTS.md skeleton itself points "Handoffs: agent-factory/handoffs/" — so the on-disk location is authoritative. Do NOT reproduce the spec's `plans/`-prefixed paths.

2. **`retro-notes.md` location (LOW).** §5.B.4 writes `handoffs/retro-notes.md`; on disk it is `agent-factory/handoffs/retro-notes.md`. Consistent — same `agent-factory/handoffs/` location, spec just abbreviates the prefix. No action beyond using the full on-disk path.

3. **Duplicate handoff body sections (LOW — already decided).** Phase-2 Key Decision: `business-handoff.md` / `implementation-handoff.md` carry duplicate §5.A body sections under the universal `## Scope`/`## Risks`. Roles cite the **universal-header** sections (authoritative). No new action; carry the Phase-2 decision.

4. **Validator section list omits "Activates when" (INFO).** Spec §18 (L1539) lists the validator's required role sections as: One job, Caveman prompt, Reads, Responsibilities, Output, Board moves, Trace updates, Hard limits — **8 sections, NOT including `Activates when`**. The §5 skeleton (L311–322) has 9 sections (it DOES include `Activates when`). **Author all 9** (the skeleton is the authoring contract, D-00); the validator simply doesn't gate on the 9th. The Validation Architecture below checks all 9 for completeness, exceeding the future validator. No drift to "fix" — just don't drop `Activates when` thinking the validator covers it.

---

## Runtime State Inventory

This phase is **additive markdown authoring**, not a rename/refactor/migration. It creates new files (`agent-factory/roles/*.md`, root `AGENTS.md`) and touches no existing runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastores; this kit ships markdown templates only. | none |
| Live service config | None — no external services configured by this phase. | none |
| OS-registered state | None — no tasks/daemons/registrations. | none |
| Secrets/env vars | None — roles' AGENTS.md safety rule says "do not read or expose secrets," but the phase introduces no secret keys. | none |
| Build artifacts | None — no compiled/installed artifacts; grugops's own validator/installers do not exist yet (Phase 5/6) and are intentionally `UNKNOWN - verify` slots (D-18). | none |

**Confirmed:** the only "existing state" relevant here is the frozen Phase-1/2 on-disk files (inventoried above) — they are READ-cited, never modified. `agent-factory/roles/` currently holds only `.gitkeep`; root `AGENTS.md` is absent. Phase 3 populates both additively, touching nothing in `docs/`, `.planning/`, `.claude/`, `CLAUDE.md`, or frozen Phase-1/2 files.

## Architecture Patterns

### Authoring flow (conceptual — how content flows into the 16 files + AGENTS.md)

```
SOURCES (read-only)                          AUTHORING (this phase, additive)              CONSUMERS (later phases)
─────────────────────                        ─────────────────────────────                ───────────────────────
spec §5 caveman prompts ──verbatim──┐
spec §5.A.1 routing contract ───────┼──────► roles/orchestrator.md (FIRST) ──┐
                                    │                                         │  routing contract
frozen plans/* paths ───cite────────┼──────► roles/<10 core>.md ─────────────┤  the other 15 slot into ──► Phase-4 workflows
frozen handoffs/* paths ─cite (real)┤                                         │                              (sequence board moves)
frozen checklists/* paths ─cite─────┼──────► roles/<5 enterprise>.md ─────────┤
frozen memory-bank/* paths ─cite────┘                                         │  kind:role + tier ────────► Phase-5 wrappers
                                                                              │                              (thin pointers)
best-practices §17.1 skeleton ──verbatim──► AGENTS.md (LAST) ◄────12 rules────┘  9-section skeleton ───────► Phase-6 validator
best-practices 12 rules ────verbatim──────► (Scribe owns; 15 roles point at it)  AGENTS.md shape + 32KiB     (section-presence)
best-practices Commands slots ─UNKNOWN────► AGENTS.md Commands (all UNKNOWN-verify)
```

### Recommended file layout (already fixed by spec §3 / on disk)
```
agent-factory/roles/          # 16 role files land here (currently only .gitkeep)
  orchestrator.md             # authored FIRST — the routing contract
  agents-md-scribe.md         # owns the 12 rules in AGENTS.md
  brownfield-mapper.md  greenfield-mapper.md  ba-pm.md  system-analyst.md
  architect-design.md  software-engineer.md  qe-e2e.md  security-nfr.md  uat-planner.md
  release-manager.md  compliance-officer.md  incident-responder.md  factory-coach.md  installer.md
AGENTS.md                     # repo root — authored LAST (does not exist yet)
```

### Pattern 1: Reproduce-then-derive (D-08 → D-15)
**What:** Paste spec-given content verbatim (caveman prompt, routing matrix, §17.1 skeleton, 12 rules); derive the other sections tersely from frozen paths; invent nothing.
**When to use:** every role file and AGENTS.md in this phase.
**Example:** Software Engineer file = verbatim prompt (L461–466) + derived `Reads` (config first → `agent-factory/handoffs/implementation-ready-packet.md` / the ticket) + derived `Output` (`agent-factory/handoffs/implementation-handoff.md`) + `Board moves` (`In Development → In Review`) + `Trace updates` (append PR/files to `plans/traceability.md`) + `Hard limits` (the spec's "no big rewrites…no fake test results", L468).

### Pattern 2: Single-source the 12 rules + a one-line pointer (D-19)
**What:** the 12 rules live once in AGENTS.md; the 15 non-Scribe roles add ONE line pointing there (Claude's-discretion wording, e.g. "Follow the 12 coding rules in AGENTS.md.").
**When to use:** every non-Scribe role's body. The Scribe role body owns/maintains them and may echo in grug voice.

### Pattern 3: Consistent universal-v2 lines across all 16 (D-17)
**What:** render the three v2 additions identically everywhere — `Reads`: "read `agent-factory/config/factory.config.json` first"; `Board moves`: transition `plans/board.md`; `Trace updates`: append to `plans/traceability.md`. Not per-role bespoke wording.

### Anti-Patterns to Avoid
- **Inlining workflow steps into the Orchestrator** — D-20 forbids it; name the workflow file, don't sequence it. (Sequencing is Phase 4.)
- **Restating the 12 rules in each role** — D-19 forbids it (drift). One source, pointers.
- **Inventing parallel filenames** (e.g. `roles/handoffs/...` or `plans/product-handoff.md` when on disk it's `agent-factory/handoffs/product-handoff.md`) — cite frozen on-disk names only.
- **Fabricating real commands in AGENTS.md** — every command slot ships `UNKNOWN - verify` (D-18); never invent `node scripts/...`.
- **Adding dispatch detail to role text** — spawn-vs-sequential is Phase-5; role text stays dispatch-neutral (D-20).
- **Grug voice in safety/12-rules/compliance** — clear voice only there (D-21).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role behavior text | A reinvented prompt per role | The spec's verbatim caveman prompt | D-00/D-15: content is spec-fixed; reinventing = drift + scope creep |
| The routing contract | A new routing scheme | §5.A.1 routing matrix + classification (verbatim) | D-20: this IS the contract the other 15 slot into |
| AGENTS.md shape | A custom substrate layout | §17.1 skeleton (verbatim) | AGENTS-01: the validator + every host tool expect this shape |
| The 12 coding rules | A paraphrase | The verbatim rules from the best-practices file | AGENTS-02/D-19: single-source, verbatim, clear voice |
| Command values | Guessed commands | `UNKNOWN - verify` slots | D-18: faking commands violates the no-fabrication constraint |
| Handoff/checklist/board formats | New formats | The frozen Phase-1/2 templates, cited by name | D-15: those contracts are frozen; cite, don't redefine |

**Key insight:** In this phase, "building" almost always means "copying and wiring." The failure mode is INVENTION, not insufficient cleverness. Every section a role contains either reproduces spec text or cites a confirmed frozen path.

## Common Pitfalls

### Pitfall 1: Citing the spec's `plans/`-prefixed handoff paths
**What goes wrong:** a role's `Output` says `plans/product-handoff.md`, but the real template is `agent-factory/handoffs/product-handoff.md`.
**Why it happens:** the spec §5 output lines predate the Phase-2 placement decision; the on-disk truth diverged.
**How to avoid:** always cite `agent-factory/handoffs/<name>.md` (confirmed on disk; matches the §17.1 "Handoffs: agent-factory/handoffs/" pointer).
**Warning signs:** any role `Output` line beginning `plans/...-handoff.md`.

### Pitfall 2: Dropping `Activates when` because the validator doesn't check it
**What goes wrong:** authoring only the 8 validator-checked sections, omitting `Activates when`.
**Why it happens:** §18 validator lists 8 sections; §5 skeleton has 9.
**How to avoid:** author all 9 skeleton sections (D-00 authoring contract). The validator is a floor, not the spec.
**Warning signs:** a role file with no `## Activates when`.

### Pitfall 3: Restating or paraphrasing the 12 rules in roles
**What goes wrong:** rules drift across 16 files; single-source constraint broken.
**Why it happens:** wanting each role "self-contained."
**How to avoid:** rules live ONCE in AGENTS.md; roles point with one line (D-19).
**Warning signs:** any role body containing rule text instead of a pointer (except the Scribe, which may echo in grug voice).

### Pitfall 4: Inlining workflow steps into the Orchestrator
**What goes wrong:** Phase-4 step sequences leak into role text; double-source when workflows ship.
**Why it happens:** the Orchestrator "feels" like it should describe the flow.
**How to avoid:** name the workflow file (`04-ticket-to-pr`), state the role-granularity board move, stop (D-20/D-23).
**Warning signs:** numbered step lists in `orchestrator.md` that mirror a workflow.

### Pitfall 5: Grug voice bleeding into safety / 12-rules / compliance
**What goes wrong:** safety rules or compliance text in caveman voice — undermines trust on the topics that most need precision.
**Why it happens:** the role prompts are all grug voice; the boundary is easy to miss.
**How to avoid:** clear voice for the 12 rules, AGENTS.md Safety rules, and any security/compliance/money text (D-21, brand §4.3). Grug voice stays in the caveman-prompt blocks and (lightly) the AGENTS.md Mission.
**Warning signs:** "grug not deploy prod" phrasing inside the AGENTS.md Safety rules or 12 rules (those must be clear voice).

## State of the Art

Not applicable in the usual sense — this is reproduce-from-spec, not an evolving-ecosystem decision. The one currency note from CLAUDE.md / research SUMMARY: AGENTS.md is now a Linux-Foundation-stewarded open standard (~60k repos, formalized Aug 2025) with a Codex 32 KiB cap. The §17.1 skeleton and the file-scoped-commands best practice are the current recommended shape — already captured in the best-practices file. No newer practice supersedes them for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Source line numbers (e.g. Orchestrator prompt L332–343) are stable for `agent_factory_builder_spec_v2.md` as read this session. | Roles Inventory / verbatim blocks | LOW — the verbatim TEXT is reproduced inline here, so even if line numbers shift, the content is staged. Treat line numbers as a convenience pointer, not the source of truth. |
| A2 | The 12 rules' Principle 4 being prose (not numbered 13–16) satisfies "12 rules under 4 principles." | Karpathy 12 rules | LOW — matches REQUIREMENTS.md AGENTS-02 phrasing exactly (rules 1–12 across Principles 1–3; P4 = framing). Reproduce as-is. |

**All other claims are `[VERIFIED: on-disk]`** — read directly from the spec, the best-practices file, or the frozen Phase-1/2 files this session.

## Open Questions (RESOLVED)

1. **Where do the 12 rules slot inside AGENTS.md?** — **RESOLVED:** add a minimal new `## Coding rules (the 12)` section in clear voice, adjacent to Safety rules. Adopted by Plan 03-08.
   - What we know: D-19 says they live once in AGENTS.md (clear voice); the §17.1 skeleton has no explicit "12 rules" heading.
   - What's unclear: the exact heading/placement (a new `## Coding rules` section vs folding near `## Safety rules`).
   - Recommendation: add a minimal new `## Coding rules (the 12)` section in clear voice (the agents.md standard explicitly permits any headings). Keep it adjacent to Safety rules. Flag for the planner as a small, deliberate addition beyond the literal skeleton — not an invention of behavior, just a placement. (Claude's discretion per CONTEXT.md allows the exact pointer wording; this placement is the parallel AGENTS.md-side choice.)

2. **Does the Orchestrator's `Board moves` enumerate every column it touches, or only the exits it owns?** — **RESOLVED:** state the two exits it owns plus a one-line WIP-enforcement note. Adopted by Plan 03-01.
   - What we know: §6.1 names the Orchestrator as exit owner for `Ready for Dev` and `Done`; it also enforces WIP across all columns.
   - What's unclear: D-23 says "transitions IT causes" — the Orchestrator causes the pull into In Development (from Ready for Dev) and the close to Done; it gates (not transitions) the others.
   - Recommendation: state the two exits it owns (`Ready for Dev → In Development`, `… → Done`) plus a one-line note that it enforces WIP on all columns. Lower-invention than enumerating every transition. Planner confirms.

## Environment Availability

**SKIPPED (no external dependencies).** This phase is pure additive markdown authoring — no tools, runtimes, services, package managers, or external CLIs are required to produce `agent-factory/roles/*.md` or root `AGENTS.md`. The only "dependencies" are the frozen on-disk Phase-1/2 files, all confirmed present in the Frozen Paths section. The optional 32 KiB AGENTS.md check (`wc -c AGENTS.md`) needs only standard shell utilities.

## Validation Architecture

> Nyquist validation is enabled (`workflow.nyquist_validation: true`). This is a markdown-template phase, so validation is framed as **structural section-presence / verbatim-fidelity / size-cap / no-fabrication / frozen-path-citation** checks — not runtime tests. These mirror what the Phase-6 validator (VAL-01) will later enforce, so building them now de-risks Phase 6.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | Shell-based structural checks (grep/wc/jq) — NO test runner exists or is needed (markdown phase). Phase-6 ships the real `scripts/validate-agent-factory.mjs` (Node); it does not exist yet (D-18 — `UNKNOWN - verify`). |
| Config file | none — see Wave 0 |
| Quick run command | per-file grep of the 9 skeleton headings (see map) |
| Full suite command | a combined shell script (Wave 0) checking all 16 roles + AGENTS.md shape + 32 KiB cap |

### Phase Requirements → "Test" Map
| Req ID | Behavior | Check type | Automated command | Exists? |
|--------|----------|-----------|-------------------|---------|
| ROLE-01 | 11 core role files exist, each with all 9 skeleton sections | structural | `for f in orchestrator agents-md-scribe brownfield-mapper greenfield-mapper ba-pm system-analyst architect-design software-engineer qe-e2e security-nfr uat-planner; do grep -L -e '## One job' -e '## Caveman prompt' -e '## Reads' -e '## Activates when' -e '## Responsibilities' -e '## Output' -e '## Board moves' -e '## Trace updates' -e '## Hard limits' agent-factory/roles/$f.md; done` (any path printed = a missing section) | ❌ Wave 0 |
| ROLE-01 | each core role has `kind: role` + `tier: core` frontmatter (D-16) | structural | `grep -l 'tier: core' agent-factory/roles/*.md \| wc -l` (expect 11) | ❌ Wave 0 |
| ROLE-01 | each role reads config first / moves board / appends trace (D-17) | content | `grep -L 'factory.config.json' agent-factory/roles/*.md; grep -L 'plans/board.md' agent-factory/roles/*.md; grep -L 'plans/traceability.md' agent-factory/roles/*.md` (no output = all present) | ❌ Wave 0 |
| ROLE-02 | 5 enterprise role files exist with `tier: enterprise` + skeleton | structural | `grep -l 'tier: enterprise' agent-factory/roles/*.md \| wc -l` (expect 5); same 9-section grep over the 5 | ❌ Wave 0 |
| ROLE-02 | each enterprise role states `mode=enterprise` OR its trigger (D-22) | content | `grep -L 'enterprise' agent-factory/roles/{release-manager,compliance-officer,incident-responder,factory-coach,installer}.md` (no output = present) | ❌ Wave 0 |
| ROLE-03 | Orchestrator carries routing matrix + 15-item classification + WIP/DoR + SPLIT_REQUIRED + hard limits | content / verbatim | grep for `SPLIT_REQUIRED`, `definition-of-ready`, `Never merge`, the 13 routing arrows, and the 15 classification tokens in `orchestrator.md` | ❌ Wave 0 |
| ROLE-03 | Orchestrator names Phase-4 workflows without inlining steps | content | `grep -c '0[0-9]-\|1[0-3]-' agent-factory/roles/orchestrator.md` (workflow names present); manual: no numbered step-sequence bodies | ❌ Wave 0 |
| AGENTS-01 | root AGENTS.md exists, has the §17.1 headings, < 32 KiB | structural / size | `test -f AGENTS.md && grep -e '## Mission' -e '## How to work here' -e '## Commands' -e '## Safety rules' -e '## When uncertain' AGENTS.md && [ $(wc -c < AGENTS.md) -lt 32768 ]` | ❌ Wave 0 |
| AGENTS-01 | every Commands slot is `UNKNOWN - verify` (no fabricated commands) | no-fabrication | `grep -c 'UNKNOWN - verify' AGENTS.md` (expect ≥ the slot count); manual scan for any real `npm/npx/node` command | ❌ Wave 0 |
| AGENTS-02 | the 12 rules (4 principles) appear verbatim in AGENTS.md, clear voice | verbatim | grep for each principle heading + a distinctive phrase per rule (e.g. `State assumptions explicitly`, `No single-use abstractions`, `Flag, don't delete`); confirm rules appear ONLY in AGENTS.md + Scribe (not the other 14 roles) | ❌ Wave 0 |
| AGENTS-02 | the 15 non-Scribe roles point at AGENTS.md for the rules (don't restate) | content | confirm no non-Scribe role contains rule text (e.g. `grep -l 'single-use abstraction' agent-factory/roles/*.md` returns only AGENTS-related files) | ❌ Wave 0 |
| (cross) | no role cites a `plans/...-handoff.md` path (drift guard) | content | `grep -l 'plans/.*-handoff' agent-factory/roles/*.md` (expect NO output — all handoffs cite `agent-factory/handoffs/`) | ❌ Wave 0 |
| (cross) | no fabricated/invented filenames; only frozen on-disk paths cited | content | spot-check cited paths resolve: extract cited `agent-factory/...` and `plans/...` paths and `test -e` each | ❌ Wave 0 |

### Sampling Rate
- **Per role authored:** run the 9-section grep + frontmatter check + the three D-17 universal-line greps for that file.
- **Per wave merge:** run the full structural suite over all files authored so far + the drift guard (`plans/...-handoff` must be empty).
- **Phase gate:** full suite green (all 16 roles 9/9 sections; AGENTS.md §17.1 shape + <32 KiB + all-UNKNOWN commands + 12 rules verbatim single-sourced) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` (or inline in VALIDATION.md) — the combined structural/verbatim/size/no-fabrication/drift script above. No test runner or framework install needed; pure POSIX shell + grep/wc.
- [ ] (No framework to install — markdown phase. The future Node validator is Phase-6/VAL-01 and is intentionally `UNKNOWN - verify` here per D-18.)

*Note: every check is `❌ Wave 0` because the role files + AGENTS.md don't exist yet — that's expected for a greenfield authoring phase. The checks are the acceptance criteria, runnable the moment each file lands.*

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`. This phase authors markdown templates and installs/runs no code, so most ASVS categories are not implicated as runtime controls. The relevant security content is what the role TEXT must correctly STATE (the safety/compliance guardrails), not code this phase executes.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control (as stated in the authored text) |
|---------------|---------|---------------------------------------------------|
| V2 Authentication | no (no auth code) | Security/NFR role lists auth/2FA/biometrics as activation triggers (spec L490) — text only |
| V3 Session Management | no | n/a — no sessions |
| V4 Access Control | no (no runtime) | the hard limit "never merge a protected branch / deploy prod without human confirmation" is the human-gate control, stated in Orchestrator + AGENTS.md Safety rules |
| V5 Input Validation | no (no inputs processed) | Security/NFR + System Analyst role text references validation rules; not executed here |
| V6 Cryptography | no | n/a — never hand-roll; not in scope |
| V7 Error/Logging | no | AGENTS.md Safety rule: no fake results; roles state "logging/monitoring" in Security/NFR output — text only |
| V14 Config | partial (as authored text) | AGENTS.md Safety rules: "Do not read or expose secrets," "Do not run destructive commands" — the verbatim §17.1 safety block |

### Known Threat Patterns for this phase (markdown authoring)
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated commands in AGENTS.md leading an agent to run a wrong/destructive command | Tampering | D-18: ship `UNKNOWN - verify`, never invent commands; AGENTS.md Safety rule "Do not run destructive commands" |
| Grug voice muddying a safety/compliance instruction (precision loss on a safety topic) | Repudiation / Info-integrity | D-21 + brand §4.3: clear voice for safety rules, the 12 rules, security/compliance/money |
| Role text weakening the human-gate ("never deploy prod without human confirmation") | Elevation of Privilege | Reproduce the hard limit verbatim in Orchestrator (L384–386), Release Manager (L515–518), and AGENTS.md Safety rules; do not soften |
| Secret exposure guidance missing | Info Disclosure | Reproduce the §17.1 Safety rule "Do not read or expose secrets" verbatim |

**Net:** the security work in this phase is **fidelity of the stated guardrails** — reproduce the safety rules and hard limits verbatim and in clear voice, never soften or fabricate. No code-level controls are introduced.

## Sources

### Primary (HIGH confidence — read on disk this session)
- `docs/initial/agent_factory_builder_spec_v2.md` — §5 skeleton (L305–323), §5.A core roles (L325–503), §5.B enterprise (L504–566), §6.1/6.3/6.4 board+sizing+blocked (L574–693), §16.7 self-bootstrap (L1441–1443), §17.1 AGENTS.md (L1447–1496), §17.2 README+prompts (L1498–1516), §18 validator (L1533–1549), §3 workflow filenames (L173–185), §7 workflow headings (L715–779).
- `.planning/research/AGENTS-MD-BEST-PRACTICES.md` — Karpathy 12 rules verbatim (L7–34), AGENTS.md 6-area structure (L38–50), file-scoped Commands slot table (L54–73).
- `docs/initial/grugops_brand_manual.md` — voice rules §4.1/4.2/4.3 (L105–161): grug voice for role prompts, clear voice for security/compliance/money/safety.
- On-disk frozen files: `agent-factory/config/factory.config.json`, `plans/board.md`, `plans/traceability.md`, `agent-factory/README.md`, `agent-factory/handoffs/*` (16), `agent-factory/checklists/*` (10 + `00-index.md`), `memory-bank/00-index.md` + `50-decisions/ADR-template.md`.
- `.planning/phases/03-roles-agents-md-substrate/03-CONTEXT.md` — the binding decision set (D-00, D-04, D-05, D-13..D-23).
- `.planning/REQUIREMENTS.md` — ROLE-01/02/03, AGENTS-01/02.
- `./CLAUDE.md` — project constraints (single-source, voice discipline, minimal-AGENTS, no-fabrication, brand, safety-hard).

### Secondary / Tertiary
- None. This phase is reproduce-from-spec; no external web sources were needed (all content is fixed by the on-disk spec/brand/best-practices files). No `[CITED]`/`[ASSUMED]` external claims.

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Markdown for everything (no installers/validator in this phase).
- **Safety (hard):** agents never merge a protected branch / deploy prod without named human confirmation — reproduce this verbatim in the Orchestrator hard limits, Release Manager, and AGENTS.md Safety rules; never soften.
- **Single-source:** role text lives once; the 12 rules live once in AGENTS.md (D-19). No copies/restatements.
- **Zero-config first:** every role reads `factory.config.json` first and honors defaults when absent (D-17 / CONFIG-03).
- **Voice discipline:** caveman voice in role prompts; clear voice in safety, security, compliance, money, the 12 rules.
- **No fabrication:** unknown commands marked `UNKNOWN - verify`; never fake a passing gate/test/citation.
- **Minimal AGENTS.md:** keep the substrate short and high-signal; push detail into the files it points to; under 32 KiB.
- **Brand:** always lowercase `grugops`.
- **GSD workflow:** file edits happen through a GSD command (this phase is `/gsd-execute-phase` territory).

## Metadata

**Confidence breakdown:**
- Verbatim source extraction (prompts, routing matrix, §17.1, 12 rules): HIGH — read line-by-line on disk; reproduced inline.
- Frozen-path inventory + drift detection: HIGH — every path listed/read on disk this session; the one HIGH-impact drift (handoff path prefix) is identified with a resolution.
- Roles inventory (handoff/board/trigger mapping): HIGH — derived directly from spec §5 + §6.1 + on-disk files.
- Validation architecture: HIGH — checks mirror the spec §18 validator + the 9-section skeleton; runnable shell.
- AGENTS.md 12-rules placement: MEDIUM — the §17.1 skeleton has no explicit slot; recommended a minimal new heading (Open Question 1).

**Research date:** 2026-06-03
**Valid until:** stable (reproduce-from-spec; valid as long as the frozen spec/brand/best-practices files and Phase-1/2 outputs are unchanged). Re-verify only if those source files change.
