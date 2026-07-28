# Phase 12: BDD + TDD Wiring - Research

**Researched:** 2026-06-11
**Domain:** Markdown agent-factory kit — wiring a test-first contract (BDD given-when-then + TDD red-green double-loop) into existing role prompts, workflows, checklists, and handoff templates, both config-dialed. NO runtime: every "feature" is markdown text; the host project supplies the test runner.
**Confidence:** HIGH on the local-kit anchors and the dial contract (read directly from the tree); HIGH on the BDD/TDD/Example-Mapping practices (cross-verified against Cucumber's own docs + multiple authoritative sources); MEDIUM on the exact strict-tier scenario-file layout (host-specific — `UNKNOWN - verify` per project, per D-01).

## Summary

Phase 12 is a **content-wiring** phase, not a greenfield build. Five requirements (BDD-01/02/03, TDD-01/02) land as edits to named markdown files plus exactly one NEW file (`example-mapping.md`). The `bdd` (off|lean|strict) and `quality.tdd` (off|encouraged|required) keys already exist in `factory.config.md` with frozen enums and lean defaults (Phase 10); this phase makes them **drive behavior**. The headline is the **non-conflict double-loop**: QE owns the outer acceptance loop (the business-readable Given/When/Then contract, written first, passes over days), the engineer owns the inner unit loop (red-green-refactor, passes over minutes), and the two are *layered, not competing* via a contract-vs-logic seam (BDD asserts the observable business behavior; TDD asserts the internal logic/edge cases beneath it — never the same outcome twice).

The dominant constraint is **single-source / reference-not-embed**: every new behavior lands ONCE under `agent-factory/`, the five per-tool adapters are never touched, and detail lives in the workflow/checklist the agent is routed to just-in-time so role prompts and AGENTS.md stay terse. The second dominant constraint is the **role-file byte ceiling**: three of the role files this phase edits (`software-engineer.md`, `qe-e2e.md`, `ba-pm.md`) are already within ~20 bytes of their `guard_role_size` WARN threshold and ba-pm.md is 3 bytes below its FAIL ceiling — new role-prompt lines must be surgically terse or the build goes red. The third is **no fabrication**: the test-first evidence field and executable-or-absent contract must never record a red/green that did not run (`UNKNOWN - verify`).

Mechanical enforcement (executable-or-absent, no-unjustified-skip, one-behavior-one-layer) is **explicitly Phase 15**. Phase 12 lands the *rules + artifacts* and keeps them machine-readable enough for a later gate to check — but does NOT build the gate. The validation surface for this phase is therefore mostly structural greps (block-present, rule-line-present, pointer-present, dial-degrade-to-lean) plus prose-judgment review (scenario quality, the worked seam example).

**Primary recommendation:** Wire each behavior at the workflow/checklist stage as a terse pointer to single-sourced hubs; add the `## Acceptance scenarios (Given/When/Then)` block to product + QE handoffs with a tier-aware (off/lean/strict) shape and a hard no-selectors rule line; create the terse `example-mapping.md` hub mirroring `definition-of-ready.md` and point workflow 07 at it behind the `bdd` dial; add the TDD red-green + double-loop step to workflow 04 with hard-limit lines in software-engineer.md and qe-e2e.md (watch the byte ceiling); add a tiered test-first evidence field with the `UNKNOWN - verify` floor; name host runners (Cucumber / Behave / playwright-bdd) ONLY in the workflow/checklist; add a one-line acceptance command slot to AGENTS.md under the byte budget.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Area 1 — Scenario artifact form (BDD-01)**
- **D-01:** Tiered artifact form across the `bdd` dial. `off` = no scenarios; `lean` = inline declarative Given/When/Then inside the product + QE handoffs (markdown only; the host wires execution); `strict` = separate selector-free scenario files referenced from the handoff and wired to host step definitions. Matches the existing `strict` definition in `factory.config.md` ("executable given-when-then specs required").
- **D-02:** A distinct `## Acceptance scenarios (Given/When/Then)` block added to BOTH `product-handoff.md` and `qe-handoff.md` (qe-handoff has no scenario block today). The existing `## Acceptance criteria (Given/When/Then)` field in product-handoff STAYS as the terse DoR-style bar — criteria = the bar, scenarios = the executable contract.
- **D-03:** Hard no-selectors rule. A standing rule in the scenario template + a workflow reminder: declarative business language only — no CSS/HTML/selectors in Given/When/Then; UI detail lives behind step definitions.

**Area 2 — Three Amigos / Example Mapping placement (BDD-02)**
- **D-04:** Separate `agent-factory/checklists/example-mapping.md` hub (Three Amigos + Example Mapping) that `07-backlog-refinement.md` points to — mirrors the Phase 11 pattern where `definition-of-ready.md` is the single-source hub.
- **D-05:** The `bdd` dial gates the step in tiers: `off` = no Three Amigos step; `lean` = BA self-runs it, playing all three voices (product decides scope, QE generates edge cases, engineer adds detail); `strict` = a real ceremony with named participants + executable scenarios required.
- **D-06:** Example Mapping before scenarios. The step runs Example Mapping (rules / examples / open questions) in the discovery conversation FIRST; the declarative G/W/T scenarios are written AFTER, not live during the workshop. Encoded as a rule line — the value is the discovery conversation, not the syntax.

**Area 3 — Double-loop & layer ownership (TDD-01)**
- **D-07:** QE owns the outer loop, engineer owns the inner loop. The BDD scenario (the contract and the "outer red") is QE/business-owned — lands in `qe-e2e.md` + the QE handoff. The unit red-green-refactor (inner loop) is engineer-owned — lands in `software-engineer.md` + workflow 04.
- **D-08:** Double-loop rules live in the workflow step + role hard-limits. A TDD red-green step in `04-ticket-to-pr.md` (write failing unit test → minimal code → green → refactor; the outer acceptance scenario stays red until the inner loop closes it; no second acceptance scenario goes red before the first is green) PLUS terse hard-limit lines in `software-engineer.md` and `qe-e2e.md`. The workflow routes, the role enforces.
- **D-09:** The "one behavior, one layer" rule is drawn as a contract-vs-logic seam + a worked example. BDD acceptance asserts the observable business behavior (the contract; one scenario = one behavior); TDD unit asserts the internal logic and edge cases beneath it — the unit layer never re-asserts the same observable outcome. Encoded as a rule line + one short worked example. Mechanical enforcement of no-duplication is DEFERRED to the Phase 15 test-integrity gate.

**Area 4 — TDD evidence & host-runner recommendation (TDD-01/02)**
- **D-10:** Tiered test-first evidence with a no-fabrication floor. Add a test-first / red-green evidence field to the implementation handoff (+ the acceptance side in the QE handoff). `off` = no field; `encouraged` = record "tests written for the changed behavior" honestly; `required` = record the red-then-green sequence as the engineer actually ran it. Floor: if a step wasn't run, mark `UNKNOWN - verify` — never claim a red/green that didn't happen.
- **D-11:** Upfront TDD test-strategy in the ready packet. `implementation-ready-packet.md` gains a terse test-strategy line the engineer reads before coding — which unit tests prove the behavior, which layer owns what.
- **D-12:** AGENTS.md acceptance slot + workflow-level runner refs. Add a minimal acceptance/BDD command slot to AGENTS.md's command set (one line, alongside unit/e2e — stays under the byte-budget guard). Name example host runners (Cucumber / Behave / Playwright-BDD) ONLY in the workflow/checklist, not in AGENTS.md or role prompts; `UNKNOWN - verify` when absent.

**Default-decided (Claude locks with research-grounded defaults)**
- **D-13:** Scope the wiring to product + QE handoffs + workflows 04/07. UAT carry (`06-uat-pack.md`) and the upstream `02/03` carry are handled as light references (a forward-pointer that scenarios flow forward), NOT a deep BDD rewrite. Planner may add a one-line carry reference where natural.
- **D-14:** Scenario→trace linkage is additive, comment-documented convention — one scenario can map to one traceability row, recorded via the existing comment-documented convention (NOT a schema rename of `plans/traceability.md`). Keep it lean at the lean tier; 1:1 linkage is the enterprise direction.

### Claude's Discretion
- Exact handoff field wording + ordering for the new `## Acceptance scenarios` block (D-02) and the test-first evidence field (D-10) — keep terse, match existing template style.
- The `example-mapping.md` hub's exact content (D-04) — the rules/examples/questions structure + the three-voices checklist; keep it a terse hub like `definition-of-ready.md`, not a wall of text.
- The worked example for the contract-vs-logic seam (D-09) — pick a small, stack-neutral example (one observable behavior + the units beneath it).
- The exact AGENTS.md slot name + line (D-12) — `acceptance:` vs `bdd:`; one line under the byte budget.
- Caveman-voice phrasing of the new role-prompt hard-limit lines (D-08) — punchy grug in the body, clear voice in any safety line; respect `guard_role_size`.
- Whether `strict` scenario files get a recommended location/extension convention (D-01) — selector-free, host-tool-agnostic; `UNKNOWN - verify` the host's actual BDD layout.

### Deferred Ideas (OUT OF SCOPE)
- **Mechanical enforcement** of executable-or-absent, no-unjustified-skip, "one behavior, one layer" — Phase 15 (test-integrity gate). Phase 12 lands rule + artifacts only.
- Lint step + UI/E2E (Playwright visual/a11y) in the §14 gate — Phase 15.
- Frontend/UI senior persona + UI design→build workflow — Phase 13.
- OWASP ASVS-anchored security audit — Phase 14.
- Deep BDD rewrite of `06-uat-pack.md` + upstream `02/03` carry — Phase 12 adds only a light forward-pointer (D-13).
- Mutation-testing step / `quality.mutation_testing` key — NOT adopted this phase (no new keys; no runtime).
- 1:1 scenario→trace schema columns — kept as additive comment-documented convention (D-14).
- TypeScript pivot — HELD; Phase 12 stays markdown + POSIX sh. Do not smuggle it in.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **BDD-01** | Acceptance behavior expressed as given-when-then scenarios forming the business→engineer contract, carried in product + QE handoffs (declarative, executable-or-absent — no Gherkin nobody runs) | New `## Acceptance scenarios (Given/When/Then)` block in `product-handoff.md` + `qe-handoff.md` (D-02), tiered off/lean/strict (D-01), with the hard no-selectors rule (D-03). Declarative-vs-imperative practice verified — see Pattern 1 + Pitfall 1. |
| **BDD-02** | A Three Amigos / Example Mapping step folded into backlog refinement, producing scenarios before code | New `example-mapping.md` hub (D-04) mirroring `definition-of-ready.md`; pointer folded into `07-backlog-refinement.md` (sits on top of the Phase-11 senior-BA ceremony). Example-Mapping-before-Gherkin practice verified — see Pattern 2. |
| **BDD-03** | BDD depth is config-dialed (off \| lean \| strict) | `bdd` key already in `factory.config.md` (frozen); each new behavior reads it and degrades to `lean` when absent (D-01/D-05). See Pattern 4 (dial-read degrade-to-lean). |
| **TDD-01** | Engineering workflow drives test-first red-green-refactor at the unit layer, with the double-loop rule (no second acceptance scenario red before the first is green; one behavior owned by exactly one test layer) | TDD red-green step in `04-ticket-to-pr.md` + double-loop/no-second-red rule (D-08); contract-vs-logic seam + worked example (D-09); QE-outer/engineer-inner ownership (D-07). Double-loop practice verified — see Pattern 3. |
| **TDD-02** | TDD strictness is config-dialed (off \| encouraged \| required) | `quality.tdd` key already in `factory.config.md` (frozen); tiered evidence field reads it (D-10), degrades to `encouraged` when absent. See Pattern 4. |
</phase_requirements>

## Architectural Responsibility Map

> grugops ships no software tiers — the "tiers" here are kit file-types. This map assigns each phase capability to the file-type that OWNS it (where the content lives once) vs. where it is referenced.

| Capability | Primary Tier (owns content) | Secondary Tier (references) | Rationale |
|------------|----------------------------|----------------------------|-----------|
| BDD acceptance contract (G/W/T block + no-selectors rule) | Handoff templates (`product-handoff.md`, `qe-handoff.md`) | Workflow 04/07 (point to it), DoR (criteria line stays) | The scenario is a handoff field — it travels role→role as data. The rule lives in the template so it is read every time the block is filled. |
| Three Amigos / Example Mapping ceremony | Checklist hub (`example-mapping.md`, NEW) | Workflow 07 (single pointer, dial-gated) | Single-source hub pattern (mirrors `definition-of-ready.md`); keeps workflow 07 terse + reusable (D-04). |
| Double-loop red-green sequence | Workflow 04 (`04-ticket-to-pr.md`) | Roles (`software-engineer.md`, `qe-e2e.md`) carry terse hard-limits | "The workflow routes, the role enforces" (D-08). Sequence detail belongs in the workflow stage the engineer is routed to; the role carries only the one-line guardrail. |
| Contract-vs-logic seam + worked example | Roles + workflow (rule line) — recommend the worked example live in `example-mapping.md` or workflow 04 | software-engineer.md (1-line seam guardrail) | The worked example is prose that must NOT bloat a role file (byte ceiling). Put the example in the hub/workflow; the role carries only the seam rule. |
| Test-first evidence field | Handoff templates (`implementation-handoff.md`, `qe-handoff.md`) | Roles record into it | Evidence is a handoff field (data), tiered off/encouraged/required, with the `UNKNOWN - verify` floor (D-10). |
| TDD test-strategy line | Handoff template (`implementation-ready-packet.md`) | software-engineer.md reads it before coding | Read-before-coding strategy is a packet field the engineer consumes (D-11). |
| `bdd` / `quality.tdd` dial reads | Config (`factory.config.md` — already frozen) | Every behavior above reads `.grugops/factory.config.json` first | Dial-awareness pattern; degrade-to-lean when absent (Phase 10 contract). |
| Host-runner names + acceptance command | Workflow/checklist (names) + AGENTS.md (one command slot) | NEVER in role prompts or the 5 adapters | Reference-not-embed: names are tool-specific dispatch detail, kept out of always-loaded prompts (D-12, Pitfall 5). |

## Standard Stack

> grugops installs nothing. The "stack" is the existing kit file-types this phase edits, plus the **host-project BDD runners grugops NAMES but never bundles**. There are no grugops dependencies to add.

### Core (kit files this phase touches — all MODIFIED in place except one NEW)

| File | Action | Purpose | Anchor for the new content |
|------|--------|---------|----------------------------|
| `agent-factory/handoffs/product-handoff.md` | MODIFY | Add `## Acceptance scenarios (Given/When/Then)` block (D-02) | Insert after the existing `## Acceptance criteria (Given/When/Then)` line (currently line 30) — criteria stays as the bar, scenarios = the contract. |
| `agent-factory/handoffs/qe-handoff.md` | MODIFY | Add `## Acceptance scenarios` block (D-02) + acceptance-side red/green evidence (D-10) | Add near `## Unit/integration/E2E coverage` / `## Result` (lines 28/35); QE owns the outer loop (D-07). |
| `agent-factory/handoffs/implementation-handoff.md` | MODIFY | Add tiered test-first / red-green evidence field (D-10) | Extend the existing `## Tests added` / `## Commands run` evidence section (lines 31-32) — do NOT invent a new artifact. |
| `agent-factory/handoffs/implementation-ready-packet.md` | MODIFY | Add terse TDD test-strategy line (D-11) | The packet already has `## Test strategy` (line 39!) — extend that existing heading with the tiered red-green-which-unit-proves-it line. No new heading needed. |
| `agent-factory/checklists/example-mapping.md` | **NEW** | Three Amigos + Example Mapping hub (D-04) | Mirror `definition-of-ready.md` structure (857 B, terse bullet hub). |
| `agent-factory/workflows/07-backlog-refinement.md` | MODIFY | Fold in the Three Amigos / Example Mapping step pointing to the new hub (D-04/05/06) | Insert a step between current Step 2 (clarify to INVEST) and Step 4 (size), dial-gated by `bdd`; point to `example-mapping.md`. Phase-11 senior-BA ceremony stays. |
| `agent-factory/workflows/04-ticket-to-pr.md` | MODIFY | Add TDD red-green step + double-loop / no-second-red rule (D-08) | Insert into/around Step 3 (engineer implements with tests); references gate workflow 05 stays unchanged. |
| `agent-factory/roles/software-engineer.md` | MODIFY | Inner-loop ownership + red-green + contract-vs-logic-seam hard-limit lines (D-07/08/09) | Add terse lines to `## Responsibilities` / `## Hard limits`. **CRITICAL: 3128 B, WARN ceiling 3130 B — ~2 bytes of headroom.** See Common Pitfalls / byte-ceiling. |
| `agent-factory/roles/qe-e2e.md` | MODIFY | Outer-loop ownership + acceptance-contract lines (D-07/08) | Add terse lines. **3034 B, WARN ceiling 3051 B — ~17 bytes headroom.** |
| `AGENTS.md` | MODIFY | Add a minimal acceptance/BDD command slot (D-12) | Add one line under `### Test` or a new `### Acceptance` micro-slot. 6051 B now; WARN 20480 — ample budget. |
| `agent-factory/checklists/definition-of-ready.md` | NO CHANGE (verify only) | Keep the Phase-11 G/W/T line; ensure no conflict with the new scenarios block | DoR `acceptance criteria (Given/When/Then)` line is the bar; scenarios are the contract — they coexist, do not merge. |

### Supporting — host BDD runners (NAMED in workflow/checklist only, NEVER bundled)

| Runner | Verified version | Ecosystem | Where grugops may name it | Layout convention (for `strict` tier reference) |
|--------|------------------|-----------|---------------------------|-------------------------------------------------|
| Cucumber.js | `@cucumber/cucumber` 13.0.0 [VERIFIED: npm registry — name from WebSearch, mark host-choice] | Node/TS | workflow 07 / 04 host-runner ref, AGENTS.md command slot | `features/*.feature` + `features/step_definitions/`; run `cucumber-js`. `UNKNOWN - verify` per host. |
| Behave | `behave` 1.3.3 [VERIFIED: PyPI — name from WebSearch] | Python | same | `features/*.feature` + `features/steps/`; run `behave`. `UNKNOWN - verify` per host. |
| playwright-bdd | `playwright-bdd` 9.0.0 [VERIFIED: npm registry] | Node/TS (Playwright) | same | `features/*.feature` + `steps/`; config via `defineBddConfig()` in `playwright.config.ts`; generated tests to `.features-gen/`; run `bddgen && playwright test`. [CITED: deepwiki.com/vitalets/playwright-bdd] |

> **These are recommendations to the HOST project, not grugops dependencies.** grugops emits scenarios + discipline + a command SLOT; the host's chosen runner executes them. The phase installs nothing. The REQUIREMENTS.md "Out of Scope" row is explicit: *"Cucumber.js as the BDD runner — playwright-bdd chosen"* for grugops's own future v1.2 stack examples, but the host is free to use any; name them as examples, `UNKNOWN - verify` the host's actual choice.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tiered off/lean/strict scenario form (D-01) | Single always-inline form | Rejected by CONTEXT — tiering gives `strict`'s "executable-or-absent" real teeth (separate selector-free files) while keeping `lean` light; matches the frozen `strict` config definition. |
| Separate `example-mapping.md` hub (D-04) | Inline the ceremony into workflow 07 | Rejected — inlining bloats the workflow + breaks single-source; the hub mirrors the Phase-11 `definition-of-ready.md` pattern and stays reusable. |
| Naming runners in workflow/checklist (D-12) | Fully tool-agnostic (no names) | Rejected — without a named runner + command slot, "executable-or-absent" is not actually runnable; naming in the workflow (not AGENTS.md/roles) keeps it single-source and avoids prompt bloat. |
| Additive comment-documented trace convention (D-14) | New `BDD`/`Scenario` trace columns | Rejected this phase — the trace header is frozen; column churn ripples through the validator. Additive convention is lean; columns are the enterprise direction (deferred). |

**Installation:** None. grugops adds no packages. Host runners are named as examples only.

## Package Legitimacy Audit

> **Not applicable — this phase installs NO external packages.** grugops is markdown + stdlib-only POSIX sh with zero npm/pip/cargo dependencies (CLAUDE.md hard constraint; REQUIREMENTS.md "Out of Scope": *"Adding npm runtime dependencies to grugops itself … grugops is markdown + stdlib-only scripts"*). The three host runners below are NAMED in workflow prose as examples for the host project to choose; grugops never declares, installs, or bundles them.

| Runner | Registry | Verified version | Role in grugops | Disposition |
|--------|----------|------------------|-----------------|-------------|
| `@cucumber/cucumber` | npm | 13.0.0 | Named example only — host installs if chosen | Not a grugops dependency — no audit needed |
| `behave` | PyPI | 1.3.3 | Named example only | Not a grugops dependency |
| `playwright-bdd` | npm | 9.0.0 | Named example only (REQUIREMENTS preferred host runner) | Not a grugops dependency |

**Packages removed due to slopcheck [SLOP] verdict:** none — no packages are installed.
**Packages flagged as suspicious [SUS]:** none.

*Registry existence was verified (`npm view` / `pip index versions`) to confirm the names grugops prints in prose are real and not slopsquatted hallucinations. The names originate from WebSearch + REQUIREMENTS.md, so they are tagged for host-choice confirmation rather than as grugops-verified dependencies. No `checkpoint:human-verify` install gate is needed because nothing is installed.*

## Architecture Patterns

### System Architecture Diagram — the BDD↔TDD double-loop and how scenarios flow

```
BACKLOG REFINEMENT (workflow 07)                        bdd dial gates this whole block
   │
   │  [if bdd != off]  Three Amigos / Example Mapping  ──▶ example-mapping.md (NEW hub)
   │     • discovery conversation FIRST:                    yellow=story  blue=rules
   │       rules / examples / open questions                green=examples  red=questions
   │     • lean: BA self-runs all 3 voices                  (D-06: write G/W/T AFTER, not live)
   │     • strict: named participants
   │                          │
   │                          ▼  (scenarios written after the workshop)
   │     declarative Given/When/Then  (D-03: NO selectors — business language only)
   ▼
PRODUCT HANDOFF ──▶ ## Acceptance criteria (the bar)  +  ## Acceptance scenarios (the contract)
   │                                                          │
   │  carried forward (D-13 light pointer)                    │ = the OUTER red (QE-owned, D-07)
   ▼                                                          ▼
IMPL-READY PACKET ──▶ ## Test strategy (+TDD: which units prove it, which layer owns what, D-11)
   │
   ▼
TICKET → PR (workflow 04)
   │
   │   ┌──────────── INNER LOOP (engineer-owned, D-07) — minutes ────────────┐
   │   │  write FAILING unit test  ──▶  minimal code  ──▶  GREEN  ──▶ refactor │
   │   │      ▲                                                      │         │
   │   │      └──────────────  repeat per unit behavior  ◀───────────┘         │
   │   └────────────────────────────────────────────────────────────────────┘
   │   OUTER acceptance scenario stays RED until the inner loop closes it.
   │   RULE (D-08): no SECOND acceptance scenario goes red before the first is green.
   │   SEAM (D-09): BDD asserts the observable business outcome (once);
   │                TDD asserts internal logic + edge cases beneath it (never the same outcome).
   ▼
IMPLEMENTATION HANDOFF ──▶ tiered test-first evidence (off | "tests written" | red→green sequence)
   │                         FLOOR: a step not run = `UNKNOWN - verify` (D-10, never fake red/green)
   ▼
QE HANDOFF ──▶ ## Acceptance scenarios (mirror) + acceptance-side red/green evidence
   │             QE automates the OUTER loop against the host runner (Cucumber/Behave/playwright-bdd)
   ▼
(forward, D-13 light pointer)  →  UAT pack (06) / release — scenarios flow forward, NOT rewritten here

quality.tdd dial gates the evidence tier:  off = no field · encouraged = honest "tests written" · required = red→green sequence
```

### Recommended file layout (deltas only — additive to today's tree)

```
agent-factory/
├── handoffs/
│   ├── product-handoff.md            # MOD — + ## Acceptance scenarios block (after criteria line)
│   ├── qe-handoff.md                 # MOD — + ## Acceptance scenarios + acceptance red/green evidence
│   ├── implementation-handoff.md     # MOD — + tiered test-first evidence (extend Tests added/Commands run)
│   └── implementation-ready-packet.md# MOD — extend existing ## Test strategy with TDD line
├── checklists/
│   ├── example-mapping.md            # NEW — Three Amigos + Example Mapping hub (terse, ~DoR-sized)
│   └── definition-of-ready.md        # NO CHANGE — keep the G/W/T line (verify no conflict)
├── workflows/
│   ├── 07-backlog-refinement.md      # MOD — + dial-gated Three Amigos step → example-mapping.md
│   └── 04-ticket-to-pr.md            # MOD — + TDD red-green step + double-loop rule (refs gate 05)
└── roles/
    ├── software-engineer.md          # MOD — terse inner-loop + seam hard-limit (BYTE CEILING ~2B headroom!)
    └── qe-e2e.md                     # MOD — terse outer-loop hard-limit (BYTE CEILING ~17B headroom!)
AGENTS.md                             # MOD — one acceptance/BDD command slot (ample byte budget)
```

### Pattern 1: Declarative-not-imperative Given/When/Then (the no-selectors rule, D-03)

**What:** Scenarios describe WHAT the user does and the business outcome, never HOW (no UI navigation, no `click #submit`, no CSS/HTML). UI detail is pushed behind step definitions in the host runner.
**When to use:** Every `## Acceptance scenarios` block at every tier.
**Why:** LLMs reliably produce syntactically-correct-but-imperative Gherkin — a verified failure mode (PITFALLS Pitfall 8). Declarative scenarios are stable (business rules change less than UI), read as living documentation, and keep one scenario = one behavior.

```gherkin
# Source: cucumber.io/docs/bdd/better-gherkin + itsadeliverything.com (declarative vs imperative)
# DECLARATIVE (correct — business language, no selectors):
Scenario: A returning customer sees their saved cart
  Given a customer with items saved in their cart
  When they sign in
  Then their saved cart is restored

# IMPERATIVE (WRONG — the failure mode D-03 forbids):
Scenario: Saved cart
  Given I navigate to "/login"
  When I fill "#email" with "a@b.com" and click ".btn-submit"
  Then I see element ".cart-item" with count "3"
```

### Pattern 2: Example Mapping BEFORE Gherkin (the discovery-first rule, D-06)

**What:** The Three Amigos run a discovery conversation using four card colors, THEN a pair writes the declarative Gherkin afterward — not live in the workshop.
**When to use:** The refinement step in workflow 07, behind the `bdd` dial.
**Why:** "Most experienced BDD teams don't [write Gherkin live] anymore … green example cards are turned into feature files" [CITED: cucumber.io/blog/bdd/example-mapping-introduction]. The value is the shared-understanding conversation, not the syntax (PITFALLS Pitfall 8 — dead Gherkin / ceremony-over-substance).

```text
# Source: cucumber.io/blog/bdd/example-mapping-introduction + Matt Wynne
Example Mapping card colors (the hub structure for example-mapping.md):
  YELLOW  = the user story (the thing being mapped)
  BLUE    = a rule / acceptance constraint (summarizes a set of examples)
  GREEN   = a concrete example under a rule  → later becomes a Gherkin scenario
  RED     = an open question nobody can answer yet (defer, don't block)

Three voices (D-05 lean = BA plays all three):
  PRODUCT decides scope · QE generates edge cases · ENGINEER adds technical detail
Order (D-06): map rules/examples/questions FIRST → write declarative G/W/T AFTER.
```

### Pattern 3: The non-conflict double-loop (D-07/D-08)

**What:** Two concentric loops at different timescales and owners. Outer = BDD acceptance (QE/business-owned, days). Inner = TDD unit red-green-refactor (engineer-owned, minutes). The outer scenario stays red until the inner loop closes it.
**When to use:** Workflow 04 (the step) + role hard-limits (the guardrail).
**Why:** This is the headline non-conflict story — BDD and TDD are layered, not competing. The single load-bearing rule: **never write a second failing acceptance test before the first is green** [CITED: justin.searls.co dual-loop BDD; sammancoaching.org double-loop TDD].

```text
# Source: FEATURES.md theme deep-dive (a) + justin.searls.co + sammancoaching.org
OUTER (acceptance, QE-owned):  one failing scenario at a time
   └─ stays RED ──┐
                  │   INNER (unit, engineer-owned), repeated per unit behavior:
                  │      1. write a failing unit test   (red)
                  │      2. minimal code to pass         (green)
                  │      3. refactor                     (still green)
                  └─◀ when the inner loop satisfies the scenario, the OUTER goes green
RULE: no second acceptance scenario goes red before the first is green.
```

### Pattern 4: Dial-read with degrade-to-lean (the zero-config contract)

**What:** Every new behavior reads `.grugops/factory.config.json` first and falls back to the documented lean default when the key — or the whole file — is absent.
**When to use:** Every behavior this phase wires. `bdd` absent → `lean`; `quality.tdd` absent → `encouraged`.
**Why:** Zero-config-first is a hard constraint; a missing key is never an error, it is read as its lean default (factory.config.md "Zero-config defaults").

```text
# bdd (off | lean | strict), default lean:
  off    → no scenarios block content, no Three Amigos step
  lean   → inline declarative G/W/T in handoffs; BA self-runs Three Amigos
  strict → separate selector-free scenario files + named ceremony + executable specs
# quality.tdd (off | encouraged | required), default encouraged:
  off        → no test-first evidence field
  encouraged → record "tests written for the changed behavior" honestly
  required   → record the red→green sequence as actually run
```

### Anti-Patterns to Avoid

- **Inlining capability prose into the 5 per-tool adapters** (PITFALLS Pitfall 4): the new BDD/TDD content lands ONCE under `agent-factory/`; adapters stay pointer-sized. The `guard_adapter_size` guard fails red on a bloated adapter. Only AGENTS.md gains a command slot (and that is single-source too).
- **Embedding the full Gherkin/Example-Mapping/double-loop detail into role prompts** (PITFALLS Pitfall 5): role prompts stay terse and POINT to the workflow/checklist; the `guard_role_size` per-file byte ceiling fails red on bloat (and three target roles are already at the ceiling — see Common Pitfalls).
- **Dead Gherkin** (PITFALLS Pitfall 8): scenarios that no host step definition runs. The `strict` tier ties files to host step defs; the executable-or-absent rule forbids Gherkin nobody runs. (Mechanical detection is Phase 15 — Phase 12 lands the rule.)
- **BDD/TDD duplication** (PITFALLS Pitfall 8): the same observable outcome asserted at both the acceptance and unit layers. The contract-vs-logic seam (D-09) is the explicit rule against it.
- **Building the Phase-15 enforcement gate here:** do NOT add mechanical guards for executable-or-absent / no-unjustified-skip / one-behavior-one-layer. Phase 12 ships RULES + ARTIFACTS only; keep artifacts machine-readable for the later gate.
- **Faking a red/green** (PITFALLS Pitfall 7 + the no-fabrication floor): the evidence field records `UNKNOWN - verify` when a step wasn't run; never a fabricated red→green.
- **Re-shaping the `bdd` / `quality.tdd` keys:** the keys, enums, lean defaults, and enterprise-escalation rows are FROZEN (Phase 10). Phase 12 reads them; it does not add or re-shape keys.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| A BDD runner / Gherkin executor | A grugops-bundled scenario runner | NAME the host's runner (Cucumber/Behave/playwright-bdd) + a command slot | grugops ships no runtime; bundling breaks markdown-only (REQUIREMENTS Out of Scope). |
| A new config key for BDD/TDD depth | New `bdd`/`tdd` keys or enums | The FROZEN Phase-10 `bdd` + `quality.tdd` keys | Keys + enums + lean defaults already shipped; re-shaping them is out of scope (D, CONTEXT). |
| A Three Amigos ceremony inlined per-workflow | Restating the ceremony in workflow 07 | The single-source `example-mapping.md` hub + a pointer | Mirrors `definition-of-ready.md`; avoids single-source drift (Pitfall 4) + workflow bloat. |
| A scenario→trace schema | New trace columns | The additive comment-documented convention (D-14) | The trace header is frozen; column churn ripples through the validator (ARCHITECTURE). |
| A new evidence artifact for TDD | A separate `## TDD log` file | Extend the existing `## Tests added` / `## Test strategy` handoff fields | The handoffs already record tests + commands; extend, don't invent (CONTEXT code_context). |
| Mechanical executable-or-absent enforcement | A grep/guard that fails on dead Gherkin | NOTHING — defer to Phase 15 | Phase 12 lands the rule; the gate that bites is Phase 15 (explicit boundary). |

**Key insight:** In a no-runtime markdown kit, "don't hand-roll" mostly means *don't build the thing the host or a later phase owns*. The phase's whole job is to wire discipline into prose that the host's runner and the Phase-15 gate will later execute and enforce. The single biggest hand-roll risk is re-creating config keys or building the enforcement gate early.

## Runtime State Inventory

> This phase edits markdown templates/workflows/roles only — it changes no stored data, no live-service config, no OS-registered state, no secrets, and produces no build artifacts. But the kit-vs-state split means template edits do NOT retroactively change already-filled handoff instances. Inventory below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — grugops has no datastore. Filled handoff INSTANCES live in `plans/handoffs/<ID>-<stage>.md` (STATE) but those are per-host-repo, not in this kit repo. | None in this repo. The host's already-filled instances keep their old shape until next filled from the new template — this is normal kit-vs-state behavior, not a migration. |
| Live service config | None — no external service holds grugops strings. | None. |
| OS-registered state | None — no tasks, daemons, or registrations. | None. |
| Secrets/env vars | None — this phase touches no secrets, keys, or env var names. | None. |
| Build artifacts | None — markdown is not built. NOTE the guard harness: editing role files changes their byte count, which the `guard_role_size` ceiling checks live (no stale artifact, but a real gate that can fail). | Verify role-file bytes stay under ceiling AFTER edits (`sh scripts/check-foundation-guards.sh`). See Common Pitfalls. |

**Verified by:** reading the full kit tree + `check-foundation-guards.sh`. The only "runtime state" that reacts to this phase's edits is the foundation-guard byte ceiling — a check, not stored data.

## Common Pitfalls

### Pitfall 1: Role-file byte ceiling — adding lines to software-engineer.md / qe-e2e.md / ba-pm.md goes RED

**What goes wrong:** D-08/D-09 add hard-limit lines to `software-engineer.md` and `qe-e2e.md`. The `guard_role_size` guard enforces a per-file two-tier WARN→FAIL byte ceiling. Measured 2026-06-11:
- `software-engineer.md` = **3128 B**, WARN 3130 / FAIL 3307 → **only ~2 bytes below WARN**, ~179 B below FAIL.
- `qe-e2e.md` = **3034 B**, WARN 3051 / FAIL 3224 → ~17 B below WARN, ~190 B below FAIL.
- `ba-pm.md` = **3291 B**, WARN 3075 / FAIL 3294 → **already 216 B OVER WARN, only 3 B below FAIL** (PERS-02 headroom).

A few new sentences trips WARN (advisory) easily; a paragraph trips FAIL (build red). ba-pm.md has essentially zero room — but this phase's CONTEXT does NOT list ba-pm.md as a touch target (the Three Amigos lives in `example-mapping.md` + workflow 07, not in the BA role), so leave ba-pm.md untouched.
**Why it happens:** "Senior judgment" tempts more prose; the terse-caveman token-economy rule exists precisely to resist this (Phase 11 D-04).
**How to avoid:** Add the *fewest, sharpest* words. Prefer a single hard-limit line that POINTS to workflow 04 / `example-mapping.md` rather than restating the double-loop in the role. Put the worked seam example (D-09) in the hub/workflow, NOT in the role. After every role edit, run `sh scripts/check-foundation-guards.sh` and confirm GREEN (or at most WARN, which does not fail the build). If a needed line would trip FAIL, move detail to the workflow and leave a pointer.
**Warning signs:** `guard_role_size` prints `FAIL  …role bloated`; a role edit adds more than ~3 lines of new prose.

### Pitfall 2: Caveman voice leaking into a clear-voice line — or sanding the caveman block off

**What goes wrong:** `guard_voice` greps the clear-voice remainder of each role (everything except the fenced `## Caveman prompt`) for caveman markers (`\bgrug\b`, `smash`, `shiny`, `me think`, …); `guard_caveman_preserved` requires the caveman block to keep ≥2 `^You` lines or a grug idiom. New role lines must: keep grug voice INSIDE the `## Caveman prompt` block, and clear voice in the body/hard-limits — but NOT introduce a caveman marker into a clear-voice line, and NOT flatten the caveman block.
**Why it happens:** A single author rewriting many files defaults to one register (PITFALLS Pitfall 3).
**How to avoid:** Two-voice discipline (CONTEXT): terse grug in the `## Caveman prompt` block + punchy body; clear professional voice in any safety/no-fabrication line (e.g. the `UNKNOWN - verify` floor line is clear voice). Run `guard_voice` + `guard_caveman_preserved` after edits.
**Warning signs:** `guard_voice` FAIL naming a role + line; `guard_caveman_preserved` FAIL "caveman voice sanded to prose".

### Pitfall 3: Imperative Gherkin in the example scenarios (the LLM failure mode)

**What goes wrong:** When authoring the template's example scenarios or the worked seam example, the natural LLM output is imperative ("navigate to /login, click #submit") — exactly what D-03 forbids and Pitfall 8 documents.
**Why it happens:** LLMs optimize for "looks like Gherkin," producing UI-script steps.
**How to avoid:** Every example scenario in the templates/hub is declarative business language (Pattern 1). State the no-selectors rule as a standing line in the scenario template AND a workflow reminder (D-03). Manual prose-judgment review catches this (no guard checks scenario quality in Phase 12).
**Warning signs:** any `#id`, `.class`, `click`, `navigate to "/…"`, or HTML in a Given/When/Then.

### Pitfall 4: Dead Gherkin / executable-or-absent half-implemented

**What goes wrong:** The `strict` tier produces separate scenario files that no host step definition runs — pure ceremony (Pitfall 8). Or the lean tier inlines G/W/T that is never wired to anything.
**Why it happens:** Writing scenarios is easy; wiring them to a runner is the host's job and easy to skip.
**How to avoid:** State "executable-or-absent" as the rule: a scenario is either wired to run (named runner + command slot, D-12) or it is not present — no Gherkin-as-decoration. `UNKNOWN - verify` the host's runner when absent. NOTE: mechanical detection (flagging `.feature` files with no executing steps) is **Phase 15** — Phase 12 lands the rule + the runnable command slot only.
**Warning signs:** a `strict` scenario file with no referenced step-definition path; an acceptance command slot left blank with scenarios present.

### Pitfall 5: BDD/TDD duplication — the seam blurred

**What goes wrong:** The same observable outcome is asserted at both the acceptance layer and the unit layer, doubling maintenance for no added confidence (Pitfall 8).
**Why it happens:** Without an explicit seam, "test the behavior" reads as "test it everywhere."
**How to avoid:** Encode the contract-vs-logic seam (D-09): BDD asserts the observable business outcome once; TDD asserts internal logic + edge cases beneath it. Ship ONE short stack-neutral worked example showing the seam (Code Examples below). Mechanical no-duplication enforcement is Phase 15.
**Warning signs:** an acceptance scenario and a unit test asserting the identical end-state.

## Code Examples

Verified patterns from authoritative sources, adapted to terse markdown the templates will carry.

### The `## Acceptance scenarios` block — tiered shape (product + QE handoffs, D-01/D-02/D-03)

```markdown
<!-- Source: pattern derived from existing product-handoff.md field style + D-01/03 -->
## Acceptance scenarios (Given/When/Then)
<!-- bdd dial: off = omit · lean = inline declarative G/W/T below · strict = link selector-free
     scenario files wired to host step definitions. Declarative business language only —
     NO CSS/HTML/selectors; UI detail lives behind step definitions. Executable-or-absent. -->

Scenario: <one observable business behavior>
  Given <business precondition>
  When  <business action>
  Then  <observable business outcome>

<!-- strict tier: reference the host scenario file + runner instead of inlining, e.g.
     features/<area>.feature  (host runner: UNKNOWN - verify — Cucumber / Behave / playwright-bdd) -->
```

### The contract-vs-logic seam — one short stack-neutral worked example (D-09)

```markdown
<!-- Source: FEATURES.md theme (a) layering + Pitfall 8 (no duplication). Put this in
     example-mapping.md or workflow 04 — NOT in a role file (byte ceiling). -->
Behavior: "A discount code reduces the order total."

OUTER (BDD acceptance — asserts the OBSERVABLE outcome, ONCE):
  Given an order of 100 and a valid 10%-off code
  When the code is applied
  Then the order total is 90

INNER (TDD unit — asserts the LOGIC + EDGE CASES beneath, never re-asserting "total is 90"):
  - percentage math rounds half-up        (unit)
  - an expired code is rejected           (unit)
  - a code below the minimum-spend fails  (unit)
  - stacking two codes is disallowed      (unit)

Seam: the acceptance scenario owns "the total is 90" once; the unit tests own how the
discount engine behaves. Same end-state asserted twice = the duplication smell to avoid.
```

### The tiered test-first evidence field (implementation + QE handoffs, D-10)

```markdown
<!-- Source: extends existing implementation-handoff.md ## Tests added / ## Commands run.
     quality.tdd dial: off = omit · encouraged = honest "tests written" · required = red→green. -->
## Test-first evidence
<!-- Floor (no-fabrication): if a step was not run, write `UNKNOWN - verify`.
     NEVER record a red or green that did not actually happen. -->
- Red (failing test first): <what failed, or `UNKNOWN - verify`>
- Green (minimal code passed): <what passed, or `UNKNOWN - verify`>
- Layer: <unit behavior this proves — distinct from the acceptance scenario it sits under>
```

### The example-mapping.md hub — terse structure (mirror definition-of-ready.md, D-04)

```markdown
<!-- Source: cucumber.io example-mapping + definition-of-ready.md hub style (857 B, terse). -->
# Example Mapping (Three Amigos)
<!-- bdd dial: off = skip · lean = BA self-runs all three voices · strict = named participants. -->

Run the discovery conversation FIRST; write the Given/When/Then AFTER (not live).

Three voices: product decides scope · QE generates edge cases · engineer adds detail.

Map with four cards:
- story (yellow) — the one thing being mapped
- rule (blue) — an acceptance constraint summarizing examples
- example (green) — a concrete case under a rule → later a declarative scenario
- question (red) — an open unknown; defer, don't block

Done when: each rule has ≥1 example, open questions are captured, and the scenarios that
follow are declarative business language (no selectors).
```

### The AGENTS.md acceptance command slot (D-12)

```markdown
<!-- Source: extends the existing AGENTS.md ### Test block; one line, host-agnostic. -->
### Acceptance
- Acceptance / BDD scenarios: `UNKNOWN - verify`   <!-- host runner, e.g. cucumber-js / behave / bddgen && playwright test -->
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Write Gherkin live during the requirements workshop | Example Mapping (rules/examples/questions) first; write declarative G/W/T after | Long-settled BDD practice; Cucumber's own guidance | D-06 encodes this; the value is the conversation, not the syntax. |
| Imperative scenarios driving the UI (click/navigate) | Declarative business-language scenarios; UI detail behind step definitions | Long-settled; reinforced by LLM-Gherkin failure-mode research | D-03's hard no-selectors rule directly counters the LLM imperative tendency. |
| BDD *or* TDD (pick one, or conflate them) | Layered double-loop: outer acceptance (QE) + inner unit (engineer), one failing acceptance at a time | "Dual-loop BDD" articulation (justin.searls.co, sammancoaching.org) | D-07/D-08 — the non-conflict story is the phase headline. |

**Deprecated/outdated:**
- Cucumber.js as grugops's *own* future stack example — REQUIREMENTS prefers playwright-bdd (native Playwright runner gives visual regression + fixtures + parallelism). But for the HOST, name all three as valid examples; the host chooses.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The strict-tier scenario-file layout (`features/` + `steps/`, extension `.feature`) is host-tool-specific and grugops should mark it `UNKNOWN - verify` rather than prescribe one | Standard Stack / D-01 discretion | LOW — CONTEXT D-01 already says keep it host-agnostic; naming a default layout would over-prescribe. Recommendation: do NOT pin a layout; reference the named runner's convention as an example only. |
| A2 | ba-pm.md is NOT a touch target this phase (Three Amigos lives in the hub + workflow 07, not the BA role) | Standard Stack core table / Pitfall 1 | LOW — CONTEXT canonical_refs lists 10 touch files and ba-pm.md is not among them; but if the planner decides a 1-line BA pointer is natural, ba-pm.md has only ~3 B headroom before FAIL — it would need a counter-trim elsewhere or the pointer must be sub-3-byte-net (impractical). Flag: keep the BA out, or expand its ceiling is a Phase-11-guard change (out of scope). |
| A3 | The worked seam example (D-09) should live in `example-mapping.md` or workflow 04, not in software-engineer.md | Architectural Responsibility Map / Pitfall 1 | LOW — putting prose in the role would trip the byte ceiling; the hub/workflow is the natural single-source home. |
| A4 | AGENTS.md slot named `### Acceptance` with one `UNKNOWN - verify` line stays well under budget | Code Examples / D-12 | LOW — AGENTS.md is 6051 B, WARN at 20480; one line adds <120 B. The discretion is `acceptance:` vs `bdd:` naming. |
| A5 | No slopcheck/package-legitimacy gate is required because the phase installs nothing | Package Legitimacy Audit | LOW — verified against CLAUDE.md + REQUIREMENTS Out of Scope (no npm deps). Runner names are prose examples, registry-verified to exist, host-installed if chosen. |

## Open Questions (RESOLVED)

> All three resolved by the inline recommendations below; Phase-12 plans implement them faithfully (confirmed by plan-checker, 2026-06-11). Markers added post-planning.

1. **Exact AGENTS.md slot name — `### Acceptance` vs folding into `### Test` as `Acceptance / BDD: …`**
   - What we know: D-12 says one line under the byte budget, alongside unit/e2e; both shapes satisfy it.
   - What's unclear: whether a new micro-heading or an extra line under `### Test` reads cleaner.
   - Recommendation: a single line — either a new `### Acceptance` micro-slot or an extra bullet under `### Test`. Planner picks; both are trivially under budget. Use `UNKNOWN - verify` as the value (host supplies the real command).
   - **RESOLVED:** plan 12-05 T3 lands the single-line slot under the byte budget with value `UNKNOWN - verify` (host supplies the command).

2. **Whether workflow 07's Three Amigos step sits before or after the Phase-11 senior-BA INVEST step**
   - What we know: D-04/05/06 fold the step ON TOP of the Phase-11 ceremony; D-06 says Example Mapping (discovery) precedes writing scenarios.
   - What's unclear: exact step ordering inside workflow 07's numbered list.
   - Recommendation: place the dial-gated Three Amigos step after "clarify to INVEST" (Step 2) and before "size/prioritize" (Step 4) — discovery happens once the story is INVEST-shaped but before it is sized; scenarios are written after the workshop. Keep it a single pointer line to `example-mapping.md`.
   - **RESOLVED:** plan 12-02 folds the dial-gated Three Amigos step into workflow 07 as a single pointer line to `example-mapping.md`, on top of the Phase-11 ceremony; scenarios written after the workshop.

3. **`strict`-tier scenario-file location/extension convention (D-01 discretion)**
   - What we know: host runners converge on `features/*.feature` + a `steps/`-style sibling, but layouts differ (playwright-bdd uses `defineBddConfig()` + `.features-gen/`; Behave uses `features/steps/`).
   - What's unclear: any single convention grugops could recommend without over-prescribing.
   - Recommendation: do NOT pin a layout. Reference the chosen host runner's own convention as an example and mark `UNKNOWN - verify`. Selector-free is the only hard rule grugops imposes.
   - **RESOLVED:** no layout pinned — plans reference the chosen host runner's own convention and mark `UNKNOWN - verify`; selector-free stays the only hard rule.

## Environment Availability

> grugops itself has zero external dependencies for this phase. The only "tools" are (a) the POSIX-sh guard harness already in the repo, and (b) host BDD runners that the host project — not grugops — installs. Audited for completeness.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX `sh` + `grep`/`wc`/`awk` | The foundation-guard harness (verifies role byte ceiling + voice after edits) | ✓ | system | — |
| `scripts/check-foundation-guards.sh` | Structural verification of this phase's role edits | ✓ | in repo | — |
| Host BDD runner (Cucumber / Behave / playwright-bdd) | The HOST project to execute scenarios — NOT grugops | n/a (host repo) | named, registry-verified (13.0.0 / 1.3.3 / 9.0.0) | `UNKNOWN - verify` when the host has none |

**Missing dependencies with no fallback:** none — the phase is markdown edits verified by the existing harness.
**Missing dependencies with fallback:** the host runner is "missing" by design from grugops's perspective; the fallback is `UNKNOWN - verify` in the command slot.

## Validation Architecture

> Nyquist validation is ENABLED. This is a markdown-only phase: the validation surface is mostly **structural greps** (block/rule/pointer present, dial-degrade-to-lean) plus **named prose-judgment** review (scenario quality, the worked seam). Mirrors the Phase-11 VALIDATION.md style. **Ship-GREEN + no-fabrication floor honored.** Do NOT propose new mechanical guards — enforcement of executable-or-absent / no-skip / one-behavior-one-layer is **Phase 15**; here we name structural checks the executor can run, and flag enforcement as Phase 15.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | POSIX-sh structural greps + the existing `scripts/check-foundation-guards.sh` (no external runner — npm deps Out of Scope) |
| Config file | none — scripts/greps are self-contained |
| Quick run command | `sh scripts/check-foundation-guards.sh` (role byte ceiling + voice after every role edit) |
| Full suite command | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` (guards green + fail-proof) |
| Estimated runtime | ~2-5 s |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command (structural) | File Exists? |
|--------|----------|-----------|--------------------------------|-------------|
| BDD-01 | `## Acceptance scenarios` block present in product-handoff | structural grep | `grep -q '^## Acceptance scenarios (Given/When/Then)' agent-factory/handoffs/product-handoff.md` | ❌ Wave 0 (edit lands it) |
| BDD-01 | `## Acceptance scenarios` block present in qe-handoff | structural grep | `grep -q '^## Acceptance scenarios' agent-factory/handoffs/qe-handoff.md` | ❌ Wave 0 |
| BDD-01 | No-selectors rule line present in the scenario template | structural grep | `grep -qi 'no .*selectors\|business language' agent-factory/handoffs/product-handoff.md` | ❌ Wave 0 |
| BDD-01 | Existing `## Acceptance criteria` line preserved (criteria ≠ scenarios) | structural grep | `grep -q '^## Acceptance criteria (Given/When/Then)' agent-factory/handoffs/product-handoff.md` | ✅ exists today |
| BDD-02 | `example-mapping.md` hub exists | structural test | `test -f agent-factory/checklists/example-mapping.md` | ❌ Wave 0 (NEW file) |
| BDD-02 | Workflow 07 points to the hub | structural grep | `grep -q 'example-mapping.md' agent-factory/workflows/07-backlog-refinement.md` | ❌ Wave 0 |
| BDD-02 | Example-Mapping-before-Gherkin rule line present | structural grep | `grep -qi 'after\|first' agent-factory/checklists/example-mapping.md` (manual confirm intent) | ❌ Wave 0 |
| BDD-03 | `bdd` dial read present (degrade-to-lean) in the new content | structural grep | `grep -q 'bdd' agent-factory/checklists/example-mapping.md` and in handoff/workflow comments | ❌ Wave 0 |
| TDD-01 | TDD red-green step present in workflow 04 | structural grep | `grep -qi 'red.*green\|failing.*test.*first' agent-factory/workflows/04-ticket-to-pr.md` | ❌ Wave 0 |
| TDD-01 | Double-loop / no-second-red rule present | structural grep | `grep -qi 'no second\|outer\|inner' agent-factory/workflows/04-ticket-to-pr.md` | ❌ Wave 0 |
| TDD-01 | Contract-vs-logic seam rule line present (one-behavior-one-layer) | structural grep | `grep -qi 'seam\|one .*layer\|observable' agent-factory/roles/software-engineer.md` | ❌ Wave 0 |
| TDD-01 | Worked seam example present (hub or workflow, NOT role) | structural grep | `grep -qi 'seam\|discount\|observable' agent-factory/checklists/example-mapping.md` (or wf04) | ❌ Wave 0 |
| TDD-02 | Test-first evidence field present in implementation-handoff | structural grep | `grep -qi 'test-first\|red.*green' agent-factory/handoffs/implementation-handoff.md` | ❌ Wave 0 |
| TDD-02 | `quality.tdd` dial read present (degrade-to-encouraged) | structural grep | `grep -qi 'tdd' agent-factory/handoffs/implementation-handoff.md` (comment) | ❌ Wave 0 |
| TDD-02 | No-fabrication floor (`UNKNOWN - verify`) in the evidence field | structural grep | `grep -q 'UNKNOWN - verify' agent-factory/handoffs/implementation-handoff.md` | ✅ pattern exists kit-wide; confirm in the new field |
| (D-11) | TDD test-strategy line in impl-ready packet (extend existing `## Test strategy`) | structural grep | `grep -qi 'unit\|layer\|red.*green' agent-factory/handoffs/implementation-ready-packet.md` | ❌ Wave 0 (heading exists, content added) |
| (D-12) | AGENTS.md acceptance command slot present, under byte budget | structural grep + guard | `grep -qi 'acceptance\|bdd' AGENTS.md && sh scripts/check-foundation-guards.sh` (guard_agents_bytes) | ❌ Wave 0 |
| (cross) | Role byte ceiling stays GREEN after software-engineer.md / qe-e2e.md edits | mechanical guard | `sh scripts/check-foundation-guards.sh` (`guard_role_size`, `guard_voice`, `guard_caveman_preserved`) | ✅ harness exists |
| (cross) | Adapters untouched / pointer-sized (single-source held) | mechanical guard | `sh scripts/check-foundation-guards.sh` (`guard_adapter_size`) | ✅ passes for free |

### Sampling Rate

- **Per task commit:** `sh scripts/check-foundation-guards.sh` (must stay GREEN — especially `guard_role_size` after each role edit) + the structural grep for that task's artifact.
- **Per wave merge:** `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` + the full set of structural greps above.
- **Phase gate:** all structural greps pass AND a human/spot prose-judgment review of (a) scenario declarativeness / no-selectors, (b) the worked seam example's clarity, (c) the example-mapping hub's terseness — before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] No NEW test framework needed — POSIX sh + the existing `check-foundation-guards.sh` cover the mechanical surface; the rest is structural greps + prose review.
- [ ] `agent-factory/checklists/example-mapping.md` — NEW file (BDD-02); its existence is the test.
- [ ] Structural greps above are ad-hoc one-liners the executor runs per task — they do NOT need a new harness (and must NOT become a Phase-15 enforcement guard).
- [ ] Confirm `guard_role_size` headroom BEFORE writing role lines (software-engineer.md ~2 B below WARN; qe-e2e.md ~17 B) — plan the role edits as single terse pointer lines.

*Manual-only (prose-judgment, no guard):* scenario quality / declarativeness, the worked-seam clarity, whether the Three-Amigos hub captures the discovery-first intent, whether the double-loop rule reads correctly. These are spot-review, never faked as mechanical.

## Security Domain

> `security_enforcement` is enabled (config `workflow.security_enforcement: true`, ASVS L1). However, **this phase ships no executable code, no input handling, no auth, no crypto, no data storage, no network surface** — it edits markdown templates/workflows/roles in a no-runtime kit. There is no application attack surface introduced by Phase 12.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | grugops adds no auth; this phase touches none. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No access control surface. |
| V5 Input Validation | no | No code consumes input in this phase; scenarios are prose templates. |
| V6 Cryptography | no | No crypto. |

### Known Threat Patterns for {markdown-kit, no-runtime}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated red/green or executable run that didn't happen (trace-integrity threat — grugops's core value) | Repudiation / Tampering | The no-fabrication floor: `UNKNOWN - verify` when a step wasn't run (D-10). This is the phase's one safety-relevant control, and it is encoded as a rule + handoff field (clear voice). |
| Caveman voice leaking into a safety/no-fabrication line (clarity erosion at the trust moment) | n/a (clarity threat) | Two-voice discipline + `guard_voice`: the `UNKNOWN - verify` floor and any safety line are clear professional voice, not caveman (PITFALLS Pitfall 3). |
| Dead/decorative scenarios giving false assurance of acceptance coverage | Repudiation | Executable-or-absent rule (D-01/Pitfall 8); mechanical detection deferred to Phase 15. Phase 12 lands the rule so the artifact is honest by construction. |

> **Note:** The substantive security ASVS audit + checklist re-anchor is **Phase 14** (SEC-01/02/03) — out of scope here. Phase 12's only security-adjacent obligation is preserving the no-fabrication / trace-integrity floor in the new evidence fields, in clear voice.

## Sources

### Primary (HIGH confidence)
- grugops repo, read directly: `agent-factory/config/factory.config.md` (frozen `bdd` + `quality.tdd` rows, lean defaults, zero-config contract), `handoffs/{product,qe,implementation,implementation-ready-packet}.md`, `workflows/{04-ticket-to-pr,07-backlog-refinement}.md`, `checklists/definition-of-ready.md`, `roles/{software-engineer,qe-e2e,ba-pm,_role-switch-protocol}.md`, `AGENTS.md`, `scripts/check-foundation-guards.sh` (the byte-ceiling + voice guards), `.planning/phases/11-senior-persona-overhaul/11-VALIDATION.md` (validation style) — HIGH.
- `.planning/{REQUIREMENTS,research/FEATURES,research/PITFALLS,research/ARCHITECTURE}.md` + `12-CONTEXT.md` — HIGH (authoritative phase decisions + v1.2 research).
- Role byte sizes measured live 2026-06-11: software-engineer.md 3128 B, qe-e2e.md 3034 B, ba-pm.md 3291 B; AGENTS.md 6051 B — HIGH.
- Registry verification: `@cucumber/cucumber` 13.0.0 (npm), `behave` 1.3.3 (PyPI), `playwright-bdd` 9.0.0 (npm) — HIGH (names confirmed real; host-choice, not grugops deps).

### Secondary (MEDIUM confidence — practice cross-verified against multiple authoritative sources)
- [Writing better Gherkin — Cucumber](https://cucumber.io/docs/bdd/better-gherkin/) + [Declarative vs Imperative Gherkin — It's a Delivery Thing](https://itsadeliverything.com/declarative-vs-imperative-gherkin-scenarios-for-cucumber) — declarative, no-selectors, UI behind step definitions (Pattern 1, D-03).
- [Introducing Example Mapping — Cucumber](https://cucumber.io/blog/bdd/example-mapping-introduction/) + [Introducing Example Mapping — Matt Wynne](https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf) — four card colors, write Gherkin AFTER the workshop (Pattern 2, D-06).
- [The Behavior-Driven Three Amigos — Automation Panda](https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/) + [Three Amigos workshop — John Ferguson Smart](https://johnfergusonsmart.com/three-amigos-requirements-discovery/) — three voices (D-05).
- [Feature Files and Step Definitions — vitalets/playwright-bdd DeepWiki](https://deepwiki.com/vitalets/playwright-bdd/4.1-feature-files-and-gherkin) + [Playwright BDD Guide — TestDino](https://testdino.com/blog/playwright-bdd) — `features/`+`steps/`, `defineBddConfig()`, `.features-gen/` (strict-tier layout reference, D-01).
- [Dual-loop BDD is the new Red-green TDD — justin.searls.co](https://justin.searls.co/posts/dual-loop-bdd-is-the-new-red-green-tdd/) + [Double-Loop TDD — sammancoaching.org](https://sammancoaching.org/learning_hours/bdd/double_loop_tdd.html) — the non-conflict double-loop, one failing acceptance at a time (Pattern 3, D-07/D-08).

### Tertiary (LOW confidence — flagged for host confirmation)
- Strict-tier scenario-file layout/extension: host-tool-specific; recommend `UNKNOWN - verify`, do not pin (Open Question 3 / A1).

## Metadata

**Confidence breakdown:**
- Standard stack (kit-file anchors + dial contract): HIGH — read directly from the tree; keys frozen and confirmed.
- Architecture (touch map, double-loop, single-source/no-spawn constraints): HIGH — grounded in CONTEXT + ARCHITECTURE + the actual files.
- Pitfalls (byte ceiling, voice, imperative Gherkin, dead Gherkin, duplication): HIGH on the local-guard mechanics (measured live), MEDIUM on the external BDD/TDD failure modes (cross-verified).
- Host-runner names/layouts: MEDIUM — names registry-verified, layouts host-specific (`UNKNOWN - verify`).

**Research date:** 2026-06-11
**Valid until:** ~2026-07-11 (stable — the local kit + the BDD/TDD practices are settled; only host-runner versions drift, and grugops names them as examples, not pins).
