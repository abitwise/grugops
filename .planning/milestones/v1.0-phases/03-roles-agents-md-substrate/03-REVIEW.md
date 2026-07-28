---
phase: 03-roles-agents-md-substrate
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - agent-factory/roles/agents-md-scribe.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/brownfield-mapper.md
  - agent-factory/roles/compliance-officer.md
  - agent-factory/roles/factory-coach.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/incident-responder.md
  - agent-factory/roles/installer.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/release-manager.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/roles/uat-planner.md
  - AGENTS.md
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-06-03
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed 16 role-prompt contracts plus the root `AGENTS.md` substrate as
instruction/guardrail artifacts. The kit is in good shape on the disciplines the
brief flagged as highest-risk: the **single-source rule holds** (no role restates
the 12-rule text — every non-Scribe role carries the one-line pointer; the Scribe
correctly omits it and owns the rules), **there is no `plans/*-handoff` path-drift
in any role** (all roles cite the real on-disk `agent-factory/handoffs/...` paths;
the legacy `plans/*-handoff.md` convention survives only in the build spec, which is
out of scope), **caveman voice is confined to fenced `## Caveman prompt` blocks**
(no leakage into safety/compliance/money lines), and the no-fabrication
(`UNKNOWN - verify`) discipline is present in every role.

The defects found are board-flow and cross-reference consistency problems, not
safety softening. The one Critical is a board-transition ownership gap: the
`Ready → In Analysis` move is owned by no role, breaking the documented flow. The
warnings cluster around (a) one safety line in `AGENTS.md` that drops the word
"named" from the human-confirmation guardrail, (b) double-claimed entry into `Done`,
(c) runtime-unresolvable build-spec section references baked into role prompts, and
(d) a `compliance_regime` type mismatch (array in config, treated as a scalar in two
roles).

## Critical Issues

### CR-01: Board flow has an unowned transition — `Ready → In Analysis` is owned by no role

**File:** `agent-factory/roles/ba-pm.md:39`, `agent-factory/roles/orchestrator.md:109-113`, `agent-factory/roles/system-analyst.md:37`
**Issue:** Tracing every role's `## Board moves` against the 13-column flow in
`plans/board.md`, the move **`Ready → In Analysis` is claimed by nobody**. BA/PM
owns `Backlog → Ready` and then explicitly hands off ("the Orchestrator pulls from
`Ready` forward", ba-pm.md:39). But the Orchestrator's board-moves only claim
`Ready for Dev → In Development` and `… → Done` (orchestrator.md:110-113) — it never
claims pulling a ticket from `Ready` into `In Analysis`. The System Analyst owns the
**exit** of `In Analysis` (`In Analysis → In Design`, system-analyst.md:37) but not
the **entry** into it. Result: a ticket that reaches `Ready` has no role authorized
to move it into the analysis stage, stalling the documented lifecycle
(analysis → design → engineering...). This is the kind of guardrail gap that makes an
agent either freeze ("no role owns this move") or improvise a transition outside the
contract — exactly what the board's "EXIT OWNER" discipline exists to prevent.
**Fix:** Assign the `Ready → In Analysis` (and by symmetry `In Design → Ready for
Dev`) pull to the Orchestrator, mirroring how it owns `Ready for Dev → In
Development`. In `orchestrator.md` board-moves, broaden the pull responsibility:
```markdown
## Board moves (which column transitions this role causes)
On `plans/board.md`, the Orchestrator owns the stage-entry pulls and the WIP discipline:
- `Ready → In Analysis` — pulls Definition-of-Ready work into analysis.
- `In Design → Ready for Dev` — promotes design-ready, sized work.
- `Ready for Dev → In Development` — pulls sized, ready work into development.
- `… → Done` — closes a ticket once merged (lean) or after the Release Manager ships (enterprise).
- Enforces the WIP limit on **every** column (refuses to overfill without a written reason).
```
Alternatively, make the entry-pull explicit on each downstream role's `## Board
moves`. Either way, every one of the 13 columns must have a named role that moves a
ticket **into** it, not only out of it.

## Warnings

### WR-01: `AGENTS.md` safety line drops "named" from the human-confirmation guardrail

**File:** `AGENTS.md:73`
**Issue:** The hard safety constraint in `CLAUDE.md` reads "never deploy to
production without **named** human confirmation." `AGENTS.md:73` renders it as "Never
deploy prod without human confirmation" — the word **named** is dropped. The whole
accountability model ("an agent cannot be held accountable; humans decide") rests on
the confirmation being attributable to a *named* human, not an anonymous "yes." The
role layer keeps the stronger wording (release-manager.md:33,49 "a named human
approves"; uat-planner.md:44 "named human signoff"), so the substrate is the weak
link. A softened safety line in the substrate is the line most tools read first.
**Fix:** Restore "named" in `AGENTS.md:73`:
```markdown
- Never merge a protected branch. Never deploy prod without named human confirmation.
```

### WR-02: Entry into `Done` is double-claimed (Orchestrator vs Release Manager) in enterprise mode

**File:** `agent-factory/roles/orchestrator.md:111-112`, `agent-factory/roles/release-manager.md:43`
**Issue:** The Orchestrator claims `… → Done` ("closes a ticket once merged — and
released, in enterprise mode", orchestrator.md:111-112). The Release Manager
independently claims `Ready to Release → Done` ("once a named human approves the
deploy the role moves it to `Done`", release-manager.md:43). In enterprise mode both
roles assert they perform the move **into** `Done`, which contradicts the board's
"single EXIT OWNER per column" discipline and lets two agents race to close the same
ticket (or each assume the other did it, leaving it open). The board table
(plans/board.md:71) lists `Done`'s owner as Orchestrator, agreeing with neither
cleanly.
**Fix:** Make the split explicit and non-overlapping. Recommended: Release Manager
owns `Ready to Release → Done` in enterprise mode; the Orchestrator owns the
merged-and-closed `In Review/Ready for UAT → Done` shortcut in lean mode only. Update
orchestrator.md to scope its claim to lean mode:
```markdown
- `… → Done` — closes a merged ticket in **lean** mode. In enterprise mode the
  Release Manager owns the move into `Done` after a named human approves the deploy.
```

### WR-03: Role prompts cite build-spec section numbers (`§17.1`, `Section 13`) that a runtime agent cannot resolve

**File:** `agent-factory/roles/agents-md-scribe.md:31,38`, `agent-factory/roles/security-nfr.md:31,35`
**Issue:** Several role prompts reference the internal build spec by section number:
agents-md-scribe.md tells the agent to author `AGENTS.md` "to the **§17.1** shape"
(lines 31, 38), and security-nfr.md says deeper compliance "extends the review per
**Section 13**" / "(see **Section 13** — Security, Privacy, and Compliance)" (lines
31, 35). These section numbers only exist in `docs/initial/agent_factory_builder_spec_v2.md`
— a build-time artifact that an agent reading the role prompt at runtime has **not**
loaded and is not pointed to. The instruction is therefore unresolvable: an agent
told to follow "§17.1" or "Section 13" has no in-context definition of either. Role
prompts must be self-contained or point at a file the agent can actually open at
runtime.
**Fix:** Replace spec-section references with either the inline content or a real
runtime path. For the Scribe, the §17.1 shape is already enumerated in the same
sentence ("Mission, How to work here, ... When uncertain") — drop the "§17.1" token
and keep the enumeration. For Security/NFR, replace "per Section 13 / see Section 13"
with a pointer to the runtime checklist that encodes that policy, e.g.
`agent-factory/checklists/compliance-checklist.md`, and let the Compliance Officer
role own the detail (it already does).

### WR-04: `compliance_regime` is an array in config but two roles treat it as a single named scalar

**File:** `agent-factory/roles/compliance-officer.md:20,30`, `agent-factory/roles/security-nfr.md:19`
**Issue:** `factory.config.json` defines `"compliance_regime": []` (an array,
config line 43). compliance-officer.md:20 says "The `compliance_regime` **value**
names the applicable regime (GDPR, SOC 2, ISO 27001, PCI, or sector rules)" and
line 30 "Check the applicable regime **named in** `compliance_regime`" — both phrase
it as a single scalar value. A real config can carry multiple regimes
(`["GDPR","PCI"]`), and an agent following the singular wording may check only one
and silently skip the rest — a compliance gap, which is exactly the failure class
this role exists to prevent.
**Fix:** Phrase the reads/responsibility as a set. e.g. compliance-officer.md:30:
"Check **each** regime listed in `compliance_regime` (GDPR, SOC 2, ISO 27001, PCI, or
sector rules) and assess the controls each requires." Same for the "value names"
phrasing on line 20 ("the regimes listed in `compliance_regime`").

### WR-05: Orchestrator's routing matrix omits role mappings for several of its own 15 classifications

**File:** `agent-factory/roles/orchestrator.md:39-64`
**Issue:** Responsibility 3 classifies a request into one of **15** types
(`greenfield-bootstrap … install`, lines 39-41) and the "Activates when" line
declares "the entry point for **all 15** request types" (line 33). But the Routing
matrix (lines 51-63) is keyed by need-phrases and provides **no** row for
`quality-gate`, `daily-sweep`, `sprint-planning`, `sprint-review`, or `refinement`.
Some are Orchestrator-run workflows with no specialist role, but the matrix never
says so, so an agent that classifies a request as e.g. `daily-sweep` finds no role to
activate and no statement that "no role" is the correct answer. The matrix already
handles this pattern for `install` ("no numbered workflow — handled by the Installer
directly", line 107) but not for the workflow-only classifications.
**Fix:** Add explicit matrix rows (or a note) for the workflow-only classifications,
e.g. "`quality-gate | daily-sweep | sprint-planning | sprint-review | refinement` →
Orchestrator-run workflow; no specialist role activated — see the workflow table."

### WR-06: Architect's board-move names a destination the board does not have

**File:** `agent-factory/roles/architect-design.md:40`
**Issue:** Every other role names its exit transition with the exact board column
names (`X → Y`). The Architect's board-move instead says it "moves it on **so it is
ready for dev**" (architect-design.md:40) — prose, not the board column `Ready for
Dev`, and it never states the transition `In Design → Ready for Dev`. This is the
mirror of CR-01's gap: the move out of `In Design` into `Ready for Dev` is described
only in prose and not owned as a named transition, so it is ambiguous whether the
Architect or the Orchestrator performs it.
**Fix:** Name the transition explicitly and pick an owner consistent with CR-01:
"...once the design is just-enough, the Architect hands off; the Orchestrator then
moves the ticket `In Design → Ready for Dev`." (Or assign the move to the Architect —
but state it as a named transition either way.)

## Info

### IN-01: `AGENTS.md` reading order disagrees with `README.md`

**File:** `AGENTS.md:13-15`
**Issue:** `AGENTS.md` "How to work here" lists the read order as config (1) →
orchestrator (2) → board (3). The README's quoted bootstrap instruction
(agent-factory/README.md:17-18, out of scope but the canonical onboarding text) lists
orchestrator → config → board. The role files consistently say "read config
**first**", so `AGENTS.md` is internally consistent with the roles; the README is the
outlier. Harmonize so a new user gets one order.
**Fix:** Pick one order across `AGENTS.md` and the README. Given every role says
"config first," prefer config → orchestrator → board and align the README.

### IN-02: QE/E2E board-move "toward `In Security/NFR` or UAT" is imprecise

**File:** `agent-factory/roles/qe-e2e.md:38`
**Issue:** QE owns the `In Review` exit and "moves it on toward `In Security/NFR` or
UAT." The exact next column depends on lean-vs-enterprise (Security/NFR may be
skipped in lean per plans/board.md:16), and "UAT" is loose — the actual column is
`Ready for UAT`, not `In UAT`. Minor, but the board uses exact column names
everywhere else.
**Fix:** "...moves it on to `In Security/NFR` (enterprise / when a risk trigger
fires) or, in lean mode with no trigger, to `Ready for UAT`."

### IN-03: Several seeded handoff templates are referenced by no reviewed role

**File:** `agent-factory/handoffs/business-handoff.md`, `agent-factory/handoffs/ticket-ready-packet.md`, `agent-factory/handoffs/refinement-notes.md`, `agent-factory/handoffs/universal-handoff.md`
**Issue:** Cross-referencing the 16 roles against the seeded handoff templates,
`business-handoff.md`, `ticket-ready-packet.md`, and `refinement-notes.md` are
referenced by zero roles, while BA/PM instead outputs `product-handoff.md` and
Software Engineer reads `implementation-ready-packet.md`. The two near-duplicate pairs
(`business-`/`product-handoff`, `ticket-ready-`/`implementation-ready-packet`) suggest
a rename where the old template was left behind. `universal-handoff.md` is the source
of the `## Scope` / `## Risks` universal header that 9 roles cite, so it is used
implicitly even though no role names the file. The handoff templates themselves are
out of this review's file scope; flagged so the orphans are reconciled (and the
`## Scope`/`## Risks` header source is confirmed present — it is, in
universal-handoff.md:15,20).
**Fix:** Either delete the superseded templates (`business-handoff.md`,
`ticket-ready-packet.md`) or wire them into a role; confirm `refinement-notes.md` is
intended as a workflow-only (Phase-4) output and not an orphan.

### IN-04: Mapper output paths (`memory-bank/*-map.md`) are not seeded and not cross-referenced

**File:** `agent-factory/roles/brownfield-mapper.md:34`, `agent-factory/roles/greenfield-mapper.md:35`
**Issue:** Both mappers declare runtime outputs `memory-bank/brownfield-map.md` and
`memory-bank/greenfield-plan.md` "produced at runtime ... template intentionally not
seeded." This is a deliberate choice and correctly stated, but no downstream role
reads these filenames (BA/PM reads "any greenfield/brownfield map in `memory-bank/`"
generically, ba-pm.md:21), so the exact filenames are an unenforced convention. Low
risk; flagged so the runtime filename stays stable when the Phase-4 workflows write it.
**Fix:** None required now. When the Phase-4 bootstrap workflows are authored, have
them write to exactly these paths and have BA/PM cite the filenames so the convention
is anchored.

---

_Reviewed: 2026-06-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
