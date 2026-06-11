# Phase 12: BDD + TDD Wiring - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the **test-first contract** end-to-end into grugops's markdown kit (BDD-01/02/03, TDD-01/02):

1. **BDD acceptance contract (BDD-01)** — declarative given-when-then scenarios (no UI selectors) that form the business→engineer contract, carried in the **product** and **QE** handoff templates, **executable-or-absent** (no Gherkin nobody runs).
2. **Three Amigos / Example Mapping (BDD-02)** — a refinement step folded into `07-backlog-refinement.md` that produces the scenarios **before** code.
3. **BDD depth dialed (BDD-03)** — behavior reads the existing `bdd` key (`off | lean | strict`, lean default), degrading to lean when absent.
4. **TDD double-loop (TDD-01)** — the engineering workflow drives test-first red-green-refactor at the unit layer; the double-loop rule is encoded (no second acceptance scenario goes red before the first is green; **one behavior owned by exactly one test layer** — no BDD/TDD duplication).
5. **TDD strictness dialed (TDD-02)** — behavior reads the existing `quality.tdd` key (`off | encouraged | required`, encouraged default).

**The core constraint that shapes every decision:** grugops ships **no runtime** — every "feature" is markdown (role-prompt text, workflow steps, checklist items, handoff fields, a config knob). Phase 12 supplies the **scenarios + the discipline**; the *host project* supplies the runner. Two more standing constraints: **single-source / reference-not-embed** (wire depth at the workflow stage; never inline into the 5 per-tool adapters or bloat AGENTS.md) and **no fabrication** (never record a red-green or an executable run that didn't happen — `UNKNOWN - verify`).

**In scope:** the `## Acceptance scenarios (Given/When/Then)` block + executable-or-absent tiering in product + QE handoffs; the no-selectors rule; a new `example-mapping.md` checklist hub + its wiring into workflow 07 (dialed); the TDD red-green step in workflow 04 + the double-loop / contract-vs-logic-seam rules in `software-engineer.md` + `qe-e2e.md`; tiered test-first evidence fields + the no-fabrication floor; a test-strategy line in `implementation-ready-packet.md`; a minimal acceptance/BDD command slot in AGENTS.md; making the `bdd` + `quality.tdd` dials actually drive behavior.

**Out of scope (later phases / do NOT pre-empt):**
- **Mechanical enforcement** of executable-or-absent / no-unjustified-skip / "one behavior, one layer" — that is the **Phase 15** test-integrity gate. Phase 12 establishes the **rule + the artifacts**; Phase 15 makes the gate bite.
- **Lint step, UI/E2E (Playwright) in the gate** — Phase 15.
- **Frontend/UI persona + UI design→build workflow** — Phase 13.
- **Security ASVS audit** — Phase 14.
- **Creating config keys** — the `bdd` and `quality.tdd` keys + their enums, lean defaults, and enterprise-escalation contract already shipped in **Phase 10**. Phase 12 only **wires the behavior** behind them; it does not add or re-shape keys.
- **Deep BDD rewrite of UAT / upstream workflows** — see D-13.

**Already locked upstream (carry forward, do NOT re-decide):**
- **DoR keeps its `Given/When/Then` line** (Phase 11, D-09). Phase 12 *adds* Three Amigos / Example Mapping / executable-or-absent / selector-free scenario files **on top of** the senior BA layer already landed. Both phases touch workflow 07 — Phase 12 adds the Three Amigos substep over the senior-BA ceremony from Phase 11.
- **Single-window sequential role-load — NO spawn tool** (D-08). "Owns a loop" means *which role's responsibilities + which workflow stage*, never a spawned sub-agent.
- **Two-voice discipline** — grug caveman in the `## Caveman prompt` block + punchy body; clear voice in safety/escalation lines. New role-prompt lines respect both voices and the role-file size ceiling (Phase 11 D-07 `guard_role_size`).
- **Terse caveman = token economy** (Phase 11 D-04). New prose is sharp and minimal; reference-not-embed keeps role prompts + AGENTS.md from bloating (PITFALLS Pitfall 5).
- **Markdown-only kit / stdlib-only POSIX-sh scripts / no npm deps; kit vs state split; no fabrication.**

</domain>

<decisions>
## Implementation Decisions

### Area 1 — Scenario artifact form (BDD-01)
- **D-01:** **Tiered artifact form across the `bdd` dial.** `off` = no scenarios; `lean` = inline declarative Given/When/Then inside the product + QE handoffs (markdown only; the host wires execution); `strict` = **separate selector-free scenario files** referenced from the handoff and wired to host step definitions. This matches the existing `strict` definition in `factory.config.md` ("executable given-when-then specs required") and gives **executable-or-absent** real teeth at the top level.
- **D-02:** **A distinct `## Acceptance scenarios (Given/When/Then)` block** is added to **both** `product-handoff.md` and `qe-handoff.md` (qe-handoff has no scenario block today). The existing `## Acceptance criteria (Given/When/Then)` field in product-handoff **stays** as the terse DoR-style bar — criteria = the bar, scenarios = the executable contract. Cleanest 1:1 mapping for traceability.
- **D-03:** **Hard no-selectors rule.** A standing rule in the scenario template + a workflow reminder: *declarative business language only — no CSS/HTML/selectors in Given/When/Then; UI detail lives behind step definitions.* Directly counters the verified LLM imperative-Gherkin failure mode (PITFALLS Pitfall 8).

### Area 2 — Three Amigos / Example Mapping placement (BDD-02)
- **D-04:** **Separate `agent-factory/checklists/example-mapping.md` hub** (Three Amigos + Example Mapping) that `07-backlog-refinement.md` points to — mirrors the Phase 11 pattern where `definition-of-ready.md` is the single-source hub that `ba-pm.md` and workflow 07 both reference. Keeps workflow 07 terse + reusable; single-sourced.
- **D-05:** **The `bdd` dial gates the step** in tiers: `off` = no Three Amigos step; `lean` = BA **self-runs** it, playing all three voices (product decides scope, QE generates edge cases, engineer adds detail); `strict` = a real ceremony with **named participants** + executable scenarios required. Honors the dial contract (`off` = no BDD scaffolding).
- **D-06:** **Example Mapping before scenarios.** The step runs Example Mapping (rules / examples / open questions) in the discovery conversation **first**; the declarative G/W/T scenarios are written **after**, not live during the workshop (FEATURES: experienced teams leave the actual G/W/T until after the workshop). Encoded as a rule line — the value is the discovery conversation, not the syntax.

### Area 3 — Double-loop & layer ownership (TDD-01)
- **D-07:** **QE owns the outer loop, engineer owns the inner loop.** The BDD scenario (the contract and the "outer red") is **QE/business-owned** — lands in `qe-e2e.md` + the QE handoff. The unit red-green-refactor (inner loop) is **engineer-owned** — lands in `software-engineer.md` + workflow 04. Different owners, different timescales (days vs minutes) — the non-conflict story.
- **D-08:** **Double-loop rules live in the workflow step + role hard-limits.** A TDD red-green step in `04-ticket-to-pr.md` (write failing unit test → minimal code → green → refactor; the outer acceptance scenario stays red until the inner loop closes it; **no second acceptance scenario goes red before the first is green**) PLUS terse hard-limit lines in `software-engineer.md` and `qe-e2e.md`. The workflow routes, the role enforces.
- **D-09:** **The "one behavior, one layer" rule is drawn as a contract-vs-logic seam + a worked example.** BDD acceptance asserts the **observable business behavior** (the contract; one scenario = one behavior); TDD unit asserts the **internal logic and edge cases** beneath it — the unit layer never re-asserts the same observable outcome. Encoded as a rule line + one short worked example showing the seam. **Mechanical enforcement of no-duplication is deferred to the Phase 15 test-integrity gate** — Phase 12 lands the followable discipline + the seam.

### Area 4 — TDD evidence & host-runner recommendation (TDD-01/02)
- **D-10:** **Tiered test-first evidence with a no-fabrication floor.** Add a test-first / red-green evidence field to the implementation handoff (+ the acceptance side in the QE handoff). `off` = no field; `encouraged` = record "tests written for the changed behavior" honestly; `required` = record the **red-then-green** sequence as the engineer actually ran it. **Floor:** if a step wasn't run, mark `UNKNOWN - verify` — never claim a red/green that didn't happen. (The field also becomes the artifact the Phase 15 gate can later check.)
- **D-11:** **Upfront TDD test-strategy in the ready packet.** `implementation-ready-packet.md` gains a terse **test-strategy** line the engineer reads before coding — which unit tests prove the behavior, which layer owns what (feeds the inner loop + the D-09 seam). FEATURES maps TDD strategy onto the impl-ready packet.
- **D-12:** **AGENTS.md acceptance slot + workflow-level runner refs.** Add a **minimal** acceptance/BDD command slot to AGENTS.md's command set (one line, alongside unit/e2e — stays under the Phase 10 byte-budget guard). Name example host runners (Cucumber / Behave / Playwright-BDD) **only in the workflow/checklist**, not in AGENTS.md or role prompts; `UNKNOWN - verify` when absent. The workflow routes the agent to it just-in-time. This is what makes **executable-or-absent** actually runnable without embedding per-stack config (avoids PITFALLS Pitfall 5 bloat + Pitfall 4 single-source drift).

### Default-decided candidate areas (user chose "ready for context" — Claude decides with research-grounded defaults)
- **D-13:** **Scope the wiring to product + QE handoffs + workflows 04/07** (the requirement's named surfaces). UAT carry (`06-uat-pack.md`) and the upstream `02/03` idea→epics / epic→tickets carry are handled as **light references** (a pointer that scenarios flow forward), **not** a deep BDD rewrite — that keeps the phase scoped to its success criteria and avoids touching the UAT/upstream contracts beyond a forward-pointer. Planner may add a one-line carry reference where natural; deeper UAT BDD is its own later concern.
- **D-14:** **Scenario→trace linkage is additive, comment-documented convention** — one scenario can map to one traceability row, recorded via the existing comment-documented convention (NOT a schema rename of `plans/traceability.md`). Matches ARCHITECTURE's "additively, via comment-documented convention — NOT a schema rename." Keep it lean at the lean tier; 1:1 linkage is the enterprise direction.

### Claude's Discretion (planner/researcher to lock)
- **Exact handoff field wording + ordering** for the new `## Acceptance scenarios` block (D-02) and the test-first evidence field (D-10) — keep terse, match the existing template style.
- **The `example-mapping.md` hub's exact content** (D-04) — the rules/examples/questions structure + the three-voices checklist; keep it a terse hub like `definition-of-ready.md`, not a wall of text.
- **The worked example for the contract-vs-logic seam** (D-09) — pick a small, stack-neutral example (one observable behavior + the units beneath it).
- **The exact AGENTS.md slot name + line** (D-12) — `acceptance:` vs `bdd:`; one line under the byte budget.
- **Caveman-voice phrasing** of the new role-prompt hard-limit lines (D-08) — punchy grug in the body, clear voice in any safety line; respect `guard_role_size` so no role file bloats past its ceiling.
- **Whether `strict` scenario files get a recommended location/extension convention** (D-01) — selector-free, host-tool-agnostic; `UNKNOWN - verify` the host's actual BDD layout.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements, roadmap & milestone scope (authoritative)
- `.planning/ROADMAP.md` § "Phase 12: BDD + TDD Wiring" — the goal + 4 success criteria (declarative G/W/T contract in product+QE handoffs, executable-or-absent; Three Amigos in refinement before code; engineering double-loop with the no-second-red + one-behavior-one-layer rules; `bdd`/`quality.tdd` dialed with lean defaults).
- `.planning/REQUIREMENTS.md` § "Test-First (BDD + TDD)" — **BDD-01/02/03**, **TDD-01/02**. Also § "Out of Scope" — no npm deps; grugops references/recommends test tooling, never bundles a runner.

### v1.2 research (read before planning)
- `.planning/research/FEATURES.md` — the double-loop BDD↔TDD non-conflict story (outer acceptance / inner unit; one failing acceptance test at a time); Three Amigos + Example Mapping; "BDD acceptance = the business→engineer handoff"; the lean-vs-enterprise dial mapping; recommend host BDD runner (don't bundle one).
- `.planning/research/PITFALLS.md` § "Pitfall 8: BDD/TDD cargo-culting" (dead Gherkin, imperative scenarios, coverage-gaming, BDD/TDD duplication — the failure modes D-01/D-03/D-09/D-10 guard against); § "Pitfall 4: single-source drift" (D-12); § "Pitfall 5: prompt/AGENTS.md bloat — reference-not-embed" (D-12); § "Pitfall 6: dial-awareness" (D-05/D-10).
- `.planning/research/ARCHITECTURE.md` — the touch map (handoffs +BDD/+TDD, workflows 04/06/07, dial keys, trace additive convention); the single-source + no-spawn constraints.

### Config-dial contract this phase wires behavior behind (Phase 10 — do NOT re-shape)
- `agent-factory/config/factory.config.md` — the `bdd` row (off/lean/strict, lean default) + the `quality.tdd` row (off/encouraged/required, encouraged default) + the "Enterprise escalation" contract section. Phase 12 wires behavior; the keys + enums + defaults are frozen.

### Files this phase touches (anchors)
- `agent-factory/handoffs/product-handoff.md` — add `## Acceptance scenarios (Given/When/Then)` block (D-02); keep `## Acceptance criteria` as the terse bar.
- `agent-factory/handoffs/qe-handoff.md` — add the `## Acceptance scenarios` block (D-02) + the acceptance-side red/green evidence (D-10); QE owns the outer loop (D-07).
- `agent-factory/handoffs/implementation-handoff.md` — add the tiered test-first / red-green evidence field (D-10).
- `agent-factory/handoffs/implementation-ready-packet.md` — add the terse TDD test-strategy line (D-11).
- `agent-factory/workflows/07-backlog-refinement.md` — fold in the Three Amigos / Example Mapping step pointing to the new hub (D-04/D-05/D-06); sits on top of the Phase 11 senior-BA ceremony.
- `agent-factory/checklists/example-mapping.md` — **NEW** hub (Three Amigos + Example Mapping), terse like `definition-of-ready.md` (D-04).
- `agent-factory/workflows/04-ticket-to-pr.md` — add the TDD red-green step + the double-loop / no-second-red rule (D-08).
- `agent-factory/roles/software-engineer.md` — inner-loop ownership + red-green + contract-vs-logic-seam hard-limit lines (D-07/D-08/D-09); respect `guard_role_size`.
- `agent-factory/roles/qe-e2e.md` — outer-loop ownership + acceptance-contract lines (D-07/D-08).
- `agent-factory/checklists/definition-of-ready.md` — keep the existing G/W/T line (Phase 11 D-09); ensure no conflict with the new scenarios block.
- `AGENTS.md` — add a minimal acceptance/BDD command slot (D-12); stays under the Phase 10 byte-budget guard.

### Prior-phase decisions this phase keys off
- `.planning/phases/11-senior-persona-overhaul/11-CONTEXT.md` — D-09 (prose-only boundary: Phase 11 deepened acceptance **prose**; Phase 12 adds executability + Three Amigos + the double-loop **on top**); D-04/D-07 (token-economy + role-size ceiling the new role lines must respect); the senior BA / DoR substrate.
- `.planning/phases/10-sdlc-coverage-audit-foundation-guards/10-CONTEXT.md` — the `bdd`/`quality.tdd` key shapes + lean defaults (D-12 there) + the byte-budget guard (D-12 here keeps AGENTS.md under it); the audit GAP-1 (executable acceptance contract → Phase 12) this phase closes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`definition-of-ready.md`** is already the terse single-source hub that `ba-pm.md` + `07-backlog-refinement.md` point to — the **direct template** for the new `example-mapping.md` hub (D-04), and it already carries the `Given/When/Then` line the scenarios build on.
- **`product-handoff.md`** already has `## Acceptance criteria (Given/When/Then)`, `## Security/NFR triggers`, `## Test notes` — the new `## Acceptance scenarios` block rides alongside these existing fields (D-02).
- **`implementation-handoff.md`** already records "tests added, commands run" — the tiered test-first field (D-10) extends this evidence section rather than inventing a new artifact.
- **`04-ticket-to-pr.md`** already routes Engineer → QE/E2E → Security/NFR and **references** the §14 gate (`05-pr-quality-gate.md`) without restating it — the TDD step (D-08) slots into the engineer's implementation step; gate enforcement stays in 05 (Phase 15).
- **`07-backlog-refinement.md`** already has BA/PM shaping INVEST stories with testable+measurable acceptance and pulling in System Analyst / Architect — the Three Amigos step (D-05) formalizes the three-voices conversation already implied here.
- **The `bdd` + `quality.tdd` keys + the enterprise-escalation contract** already exist in all three config files + the `.md` twin (Phase 10) — Phase 12 reads them; it does not add keys.

### Established Patterns
- **Reference-not-embed / single-source** — depth lives in the workflow/checklist the agent is routed to just-in-time; role prompts + AGENTS.md stay terse (PITFALLS 4 + 5). New behavior is wired once under `agent-factory/`; the 5 per-tool adapters are NOT touched (they're pointer-sized).
- **Dial-awareness** — every new behavior reads `.grugops/factory.config.json` and degrades to its lean default when the key/file is absent (zero-config stays lean).
- **Two-voice + size ceiling** — grug in the body, clear voice in safety lines; new role lines must not bloat a role file past `guard_role_size` (Phase 11).
- **No fabrication** — `UNKNOWN - verify`; the test-first evidence (D-10) and executable-or-absent (D-01) must never assert a run that didn't happen.

### Integration Points
- **The seam to Phase 15:** Phase 12 lands the *rules + artifacts* (executable-or-absent, the red/green evidence field, the no-duplication seam, the skip discipline implicit in test-first); the **Phase 15 test-integrity gate mechanically enforces** them. Keep the artifacts machine-readable enough for a later gate to check, but do not build the gate here.
- **The substrate from Phase 11:** the senior BA persona + DoR rigor is what the Three Amigos step and the acceptance contract ride on; the senior engineer/QE personas are what the double-loop discipline rides on. Phase 12 is the first content phase to *exercise* the senior substrate.
- **Host project supplies the runner** — grugops emits scenarios + discipline + an AGENTS.md command slot; the host's Cucumber/Behave/Playwright-BDD actually runs them. `UNKNOWN - verify` if the host has none.

</code_context>

<specifics>
## Specific Ideas

- **Tiered "executable-or-absent" was the load-bearing choice (Area 1):** the user picked the tiered form so `strict` produces real, separate, selector-free scenario files wired to host step defs — not just advisory prose — giving the executable-or-absent contract teeth, while `lean` stays inline-markdown light.
- **Single-source hub for Three Amigos (Area 2):** the user chose a separate `example-mapping.md` hub over inlining into workflow 07 — consistent with the Phase 11 `definition-of-ready.md` hub decision; keeps the workflow terse and the ceremony reusable.
- **The non-conflict story matters (Area 3):** the user kept the QE-outer / engineer-inner split AND asked for the contract-vs-logic seam drawn with a worked example — the goal is that BDD and TDD are *layered, not competing*, and the agent can actually tell where the line falls.
- **Honesty floor on TDD evidence (Area 4):** the user chose tiered red-green evidence WITH the no-fabrication floor — the trace must never claim a red/green that didn't run (`UNKNOWN - verify`), consistent with grugops's "the trace is the proof" value.
- **Make executable-or-absent runnable (Area 4):** the user chose to add an AGENTS.md acceptance command slot + workflow-level runner names rather than stay fully tool-agnostic — so there's an actual command the scenarios execute through, without embedding per-stack config.

</specifics>

<deferred>
## Deferred Ideas

- **Mechanical enforcement** of executable-or-absent, no-unjustified-skip, and "one behavior, one layer" — **Phase 15** (test-integrity gate). Phase 12 lands the rule + artifacts only.
- **Lint step + UI/E2E (Playwright visual/a11y) in the §14 gate** — **Phase 15**.
- **Frontend/UI senior persona + UI design→build workflow** — **Phase 13** (visual regression depends on it).
- **OWASP ASVS-anchored security audit** — **Phase 14**.
- **Deep BDD rewrite of `06-uat-pack.md` + upstream `02/03` carry** — out of this phase's scope (D-13); Phase 12 adds only a light forward-pointer. A fuller UAT-BDD treatment, if wanted, is its own later concern.
- **Mutation-testing step / `quality.mutation_testing` key** — FEATURES floated it as an enterprise TDD escalation; NOT adopted this phase (no new keys; grugops can't ship a runtime). Candidate for a future milestone.
- **1:1 scenario→trace schema columns** — Phase 12 keeps linkage as an additive comment-documented convention (D-14); a real schema/column change is not done here.
- **TypeScript pivot (project-level, HELD)** — still held; Phase 12 stays markdown + POSIX sh. Do not smuggle it in.

None of the above is unowned — each maps to a named later phase or a standing held decision.

</deferred>

---

*Phase: 12-BDD + TDD Wiring*
*Context gathered: 2026-06-11*
