# Phase 13: Frontend/UI Persona & Design→Build Workflow - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Give grugops a **17th role** — a senior frontend/UI specialist (`agent-factory/roles/frontend-ui.md`) — plus a **UI design→build workflow** (`agent-factory/workflows/14-ui-design-to-build.md`), and wire the **Orchestrator** to route UI work to it. Closes SDLC-audit **GAP-3** (no frontend/UI specialist, no design→build flow). Three jobs (UI-01/02/03):

1. **UI-01** — a senior frontend/UI persona on the standard 9-section role skeleton, activating via `_role-switch-protocol.md` with **no spawn tool** (WR-05 guard passes).
2. **UI-02** — a workflow walking design contract → component build → five states (loading / empty / error / success / partial-data) → accessibility → visual baseline, **referencing** `05-pr-quality-gate.md` rather than restating it.
3. **UI-03** — the Orchestrator routing matrix + classification list route UI work to the new persona; the new role + workflow register in the workflow map **without renumbering the frozen 00–13 ordinals**.

**Nature (introspective, like the whole v1.2 milestone):** all output is markdown. grugops *gives its users* a frontend persona + a workflow and *references/recommends* tools (Vue, Playwright, axe-core) — it installs nothing into itself. No npm deps, no runtime.

**In scope:** the new `frontend-ui.md` role; the new `14-ui-design-to-build.md` workflow; a new `ui-build` request classification + routing-matrix row + workflow-map entry in `orchestrator.md`; a new `frontend-handoff.md` template + `<TICKET>-frontend` handoff stage; registering the new role in the foundation-guard scan set (`ROLE_FILES` 16→17).

**Out of scope (later phases / do NOT pre-empt):**
- **Automated UI/E2E + visual-regression wiring into the gate** (Playwright `toHaveScreenshot`, axe-core, flake-resistance, `quality.ui_e2e`) → **Phase 15 (UIQA-01/02)**. Phase 13 names the *practice* and the *bar*; it does NOT wire automation or name tooling in the workflow body.
- **Lint / test-integrity gate steps** → Phase 15. **Security ASVS** → Phase 14. **Docs catalog** (the new role/workflow get cataloged) → Phase 17.
- **Expanding any existing role's responsibilities.** Software Engineer still writes the code; QE/E2E still verifies. This phase adds a design-authority role, it does not re-scope the engineer or QE.

**Already locked upstream (carry forward, do NOT re-decide):**
- **Single-window sequential role-load — NO spawn tool** (D-08, Phases 7/8/11). The new role activates via `_role-switch-protocol.md`. Re-adding an `Agent`/`Task` grant is Out-of-Scope (REQUIREMENTS.md).
- **Standard 9-section role skeleton** (`One job → ## Caveman prompt → Reads → Activates when → Responsibilities → Output → Board moves → Trace updates → Hard limits → AGENTS.md footer`).
- **Terse caveman voice = token-economy mechanism** (Phase 11 D-04): senior judgment per token, not more prose. The new role keeps a non-empty `## Caveman prompt` block, passes voice-lint, and fits the per-file role-size ceiling — it joins `ROLE_FILES`, feeding all three guards (voice / caveman-preserved / role-size).
- **Two-voice discipline:** grug in the caveman block + punchy body; **clear voice** on accessibility, safety, and any compliance-adjacent lines.
- **Reference, don't restate:** workflow 14 references `05-pr-quality-gate.md` (the gate) and `04-ticket-to-pr.md` (the build) by filename — single-source, the same discipline Phase 12 applied when it dropped internal `§14`/`Phase 15` labels in favor of the visible filenames.
- **Frozen 00–13 workflow ordinals;** new file is `14-ui-design-to-build.md`. **Single-source:** persona lives once under `agent-factory/`; per-tool adapters stay pointer-sized (no role-body copies).
- **Phase-12 test-first seam:** QE/E2E owns the **outer acceptance loop** (`## Acceptance scenarios`, Given/When/Then), the engineer owns the **inner red-green** loop. The new role plugs into this — it does NOT duplicate the acceptance or unit test layers.

</domain>

<decisions>
## Implementation Decisions

### Persona scope & the seam with Software Engineer (Area 1)
- **D-01 (★ load-bearing, user-directed — diverged from the recommended "owns build end-to-end"):** **frontend-ui is a design-authority / contract role — it does NOT write component code.** It authors the **UI/design contract** (the design system, the five-states/a11y/visual-baseline acceptance spec); the **existing Software Engineer writes the components** against that contract. One behavior, one owner — the contract is the spec, the engineer is the builder. This mirrors the Phase-12 BDD seam (product/QE author the acceptance contract, the engineer implements against it).
- **D-02:** **Framework-neutral persona, Vue worked examples.** The persona's principles apply across React/Svelte/Vue; Vue is the concrete worked example, matching grugops's greenfield-default recommended stack (Vue/Playwright). Wide applicability for grugops's users without losing concreteness.

### Workflow 14 shape — who does what, and verification (Area 1+3 consequence)
- **D-03 (★ user-directed — diverged from the recommended "author → review"):** **Single activation, QE verifies.** frontend-ui authors the UI/design contract **once** (one role-switch activation). The engineer then builds — workflow 14 **references workflow 04 (`04-ticket-to-pr.md`)** for the build rather than restating the engineering loop. **QE/E2E owns ALL verification** of the built UI against the contract at the gate — workflow 14 **references `05-pr-quality-gate.md`**. **frontend-ui does NOT re-activate** to review the built result. The design authority sets the bar; QE enforces it.
- **D-04:** **The `<TICKET>-frontend` handoff is the shared memory for both downstream consumers** — the engineer reads it to build, QE reads it to verify the five states + a11y + visual baseline. The contract carries the UI acceptance the same way the product handoff carries the BDD acceptance scenarios.

### Routing & handoff wiring (Area 2)
- **D-05 (as recommended):** **New top-level request classification `ui-build`.** Add it to the Orchestrator's classification list (responsibility 3, the 15→16 request types), add a **routing-matrix row** (`Need UI/frontend → Frontend/UI`), and add a **workflow-map row** (`ui-build → 14-ui-design-to-build.md`). Directly satisfies SC3 ("routing matrix **and** classification list route UI work"). The orchestrator workflow-map table is the canonical registry; keep `agent-factory/README.md` prose consistent.
- **D-06:** **New handoff template `frontend-handoff.md`** under `agent-factory/handoffs/` (KIT), filled to the instance `plans/handoffs/<TICKET-ID>-frontend.md` (STATE), stage token **`frontend`** — matching the existing `<name>-handoff.md` → `<TICKET-ID>-<stage>.md` convention (e.g. `qe-handoff.md` → `<TICKET-ID>-qe.md`). **Consumes:** the implementation-ready packet + the Phase-12 product `## Acceptance scenarios` (+ `architecture-handoff.md` when present, per D-09). **Feeds:** the engineer (build) and QE/E2E (verify).
- **D-07:** **No new dial key.** Phase 13 introduces no config key; the role/workflow honor the existing `quality` dial (zero-config-first). The UI/E2E dial (`quality.ui_e2e`) already exists from Phase 10 and is wired by **Phase 15**, not here.

### Workflow 14 depth & the Phase-15 seam (Area 3)
- **D-08 (★ user-directed — diverged from the recommended "hard gates + name tools"):** **Practice-level, tool-neutral.** The five states (loading/empty/error/success/partial-data) and accessibility are **guidance** in workflow 14 (not hard mechanical gates); the **visual baseline** is described as a practice step **tool-neutrally** — **NO Playwright / `toHaveScreenshot` / axe-core naming in the workflow body.** All tooling + automation wiring is deferred to **Phase 15 (UIQA)**. Workflow 14 walks the full SC2 sequence as practice without pre-empting Phase 15's gate automation.
- **D-09 (the a11y BAR — exception to tool-neutral):** **The contract names WCAG 2.2 AA as the accessibility acceptance bar.** A requirement *standard* is not a *tool* — naming WCAG 2.2 AA gives the engineer + QE a concrete, citable target ("be accessible" is too soft to verify). Tooling (axe-core etc.) still deferred to Phase 15.

### Design-contract source (Area 4)
- **D-10 (as recommended):** **Self-authored as step 1 of workflow 14.** frontend-ui authors the design contract from the **product handoff + Phase-12 acceptance scenarios** (and `architecture-handoff.md`'s structural decisions **when present**). **No new upstream role** — the existing Architect/Design role is consulted via its handoff when it exists, not made a mandatory gate.
- **D-11:** **A lightweight design-system notion lives INSIDE the contract** — design tokens + a component inventory as fields of `frontend-handoff.md`, **not** a separate artifact or a standing design-system file. Keeps the moving parts to one handoff.

### Claude's Discretion (planner/researcher to lock)
- **Exact `frontend-handoff.md` fields** — beyond the design tokens + component inventory (D-11), the five-states acceptance, the WCAG 2.2 AA a11y bar (D-09), and the visual-baseline expectation. Mirror the terse field style of `qe-handoff.md` / `product-handoff.md`; carry the universal-header `## Scope` / `## Risks`.
- **Persona depth landing** — how senior frontend judgment (design-system thinking, the five states as a habit, a11y-first, responsive/performance-budget awareness, anticipating downstream build/test consequences) lands in each skeleton section, bounded by the terse-caveman token economy (no bloat).
- **Role-size ceiling fit** — confirm `frontend-ui.md` fits the per-file ceiling when added to `ROLE_FILES`; the guard is byte-relative (`guard_role_size`), so author terse.
- **Guard registration mechanics** — add `agent-factory/roles/frontend-ui.md` to `ROLE_FILES` in `scripts/check-foundation-guards.sh` (feeds voice / caveman-preserved / role-size); confirm WR-05 spawn-grep stays GREEN (the new role grants no spawn tool). Decide whether `check-foundation-guards.test.sh` needs any new fixture (likely not — the new file just joins the existing 17-file scan).
- **Workflow 14 frontmatter** — `kind: workflow`, `order: 14`, `cadence:` value (match the existing workflow frontmatter pattern).
- **Exact classification token spelling** (`ui-build` vs `ui-design-to-build`) and the routing-matrix wording — keep consistent across `orchestrator.md` (classification list, routing matrix, workflow-map table) and `README.md`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements, roadmap & the audit this phase closes (authoritative)
- `.planning/ROADMAP.md` § "Phase 13: Frontend/UI Persona & Design→Build Workflow" — the goal + 3 success criteria (SC1 senior persona on the skeleton + no spawn; SC2 the design→build workflow referencing the gate; SC3 routing matrix + classification list + workflow-map registration without renumbering 00–13). `UI hint: yes`.
- `.planning/REQUIREMENTS.md` § "Frontend/UI Build" — **UI-01** (senior persona, role-switch, no spawn), **UI-02** (design contract → component build → five states → a11y → visual baseline), **UI-03** (Orchestrator routes UI work). Also § "Out of Scope" — no re-introducing a spawn/`Agent` tool; no npm deps; UI/E2E automation belongs to the gate (Phase 15).
- `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` § "GAP-3 — no frontend/UI specialist and no UI design→build flow" — the exact hole this phase closes (stage 5 engineering, UI specialization).

### v1.2 research (read before planning)
- `.planning/research/STACK.md` — the recommended frontend stack (Vue/Playwright) that grounds the persona's worked examples (D-02) and the tool names deferred to Phase 15.
- `.planning/research/ARCHITECTURE.md` — the no-spawn / single-window constraint and the single-source rule the new role + workflow must not violate.
- `.planning/research/PITFALLS.md` — guard-regeneration + single-source hazards (the new role joining `ROLE_FILES`; reference-not-restate for workflow 14).

### Prior-phase decisions this phase keys off
- `.planning/phases/11-senior-persona-overhaul/11-CONTEXT.md` — the senior-persona mechanism (D-01..D-04: in-place senior judgment, no new section, terse caveman = token economy) the new role is authored to; the 3 foundation guards (voice / caveman-preserved / role-size) and the shared 16-file `ROLE_FILES` scan set the new role joins (16→17).
- `.planning/phases/12-bdd-tdd-wiring/12-CONTEXT.md` — the BDD/TDD seam the frontend contract plugs into: QE owns the outer `## Acceptance scenarios` loop, the engineer the inner red-green; the no-double-ownership rule (D-01/D-03 here mirror it); the product handoff's `## Acceptance scenarios` block frontend-ui consumes (D-10).

### Files this phase touches (anchors)
- **NEW** `agent-factory/roles/frontend-ui.md` — the 17th role, standard 9-section skeleton, no spawn (UI-01).
- **NEW** `agent-factory/workflows/14-ui-design-to-build.md` — the design→build workflow, practice-level/tool-neutral, references `04`/`05` (UI-02, D-03/D-08).
- **NEW** `agent-factory/handoffs/frontend-handoff.md` — the design-contract handoff template → instance `plans/handoffs/<TICKET-ID>-frontend.md` (D-06).
- `agent-factory/roles/orchestrator.md` — add `ui-build` classification (responsibility 3 list), routing-matrix row, and workflow-map table row (UI-03, D-05).
- `agent-factory/roles/_role-switch-protocol.md` — the activation mechanism the new role uses (no change; the role references it).
- `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/workflows/05-pr-quality-gate.md` — referenced (not restated) by workflow 14 for build + verification (D-03).
- `agent-factory/handoffs/product-handoff.md`, `implementation-ready-packet.md` — inputs the contract is derived from (D-10); `qe-handoff.md` — the verifier that reads the contract (D-04).
- `scripts/check-foundation-guards.sh` — add `frontend-ui.md` to `ROLE_FILES`; WR-05 spawn-grep stays GREEN (discretion).
- `agent-factory/README.md` — keep the workflow/role prose consistent with the orchestrator registry (D-05).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The role skeleton is uniform across all 16 roles** (`qe-e2e.md` is the closest analog — testing-adjacent, owns a verification loop). The new `frontend-ui.md` slots into the same skeleton with no structural change.
- **Handoff convention** — `<name>-handoff.md` template → `plans/handoffs/<TICKET-ID>-<stage>.md` instance (e.g. `qe-handoff.md` → `<TICKET-ID>-qe.md`). `frontend-handoff.md` → `<TICKET-ID>-frontend.md` follows it exactly.
- **`universal-handoff.md`** supplies the universal `## Scope` / `## Risks` header every handoff carries — the new template inherits it.
- **`product-handoff.md`** already carries `## Acceptance scenarios (Given/When/Then)` (Phase 12) — the design contract is derived from it (D-10), no new acceptance machinery needed.
- **`05-pr-quality-gate.md`** is the single-source gate every workflow references by filename ("Every other workflow that needs the gate references this file rather than restating the loop") — workflow 14 follows the same reference pattern for both the gate (05) and the build (04).
- **`scripts/check-foundation-guards.sh` `ROLE_FILES`** is the single 16-file list feeding `guard_voice`, `guard_caveman_preserved`, and `guard_role_size`; adding one line registers the new role in all three guards.

### Established Patterns
- **Reference-not-restate / single-source** — workflows name other workflows by file; adapters point, never copy. Workflow 14 must reference 04 + 05, not inline them.
- **Two-voice discipline** — grug in the caveman block + body; clear voice on a11y/safety. The a11y bar (WCAG 2.2 AA) and any safety line are clear-voice; voice-lint enforces it on the new role.
- **One behavior, one owner** (Phase 12) — the design contract is owned by frontend-ui, the code by the engineer, the verification by QE. No double ownership.

### Integration Points
- The Orchestrator is the only workflow registry (`orchestrator.md` workflow-map table) — the new classification + workflow row register there; `README.md` prose is kept consistent.
- The new role joins the Phase-11 guarded substrate (`ROLE_FILES`) — terse-caveman + size-ceiling discipline applies; ship the guard GREEN after authoring.
- The frontend contract is the upstream input to the engineer's build (workflow 04) and the downstream spec QE verifies at the gate (workflow 05) — it sits *beside* the BDD acceptance contract, not on top of it (Phase-12 seam preserved).

</code_context>

<specifics>
## Specific Ideas

- **The two divergences that shaped the phase (user-directed):**
  1. **frontend-ui is contract-only, not a builder** (D-01) — chosen over "owns UI build end-to-end." The persona is a *design authority*; the Software Engineer keeps code authorship. This deliberately keeps the engineer as the single code owner and parallels the BDD contract→build seam.
  2. **Single activation, QE verifies** (D-03) — chosen over "author → engineer builds → frontend-ui reviews." frontend-ui sets the bar once and does not re-activate; QE/E2E enforces the UI acceptance at the gate. Fewer activations, the verification authority stays consolidated in QE.
- **Practice-level / tool-neutral workflow** (D-08) — the user explicitly wants workflow 14 to stay guidance-level and leave all tooling to Phase 15, *except* the a11y standard: **WCAG 2.2 AA is named** as the acceptance bar (a standard, not a tool).
- **Framework-neutral with Vue examples** (D-02) — not Vue-first; principles travel, Vue is the worked example.

</specifics>

<deferred>
## Deferred Ideas

- **Automated UI/E2E + visual-regression in the gate** (Playwright `toHaveScreenshot`, axe-core a11y, flake-resistance, `quality.ui_e2e` dial) → **Phase 15 (UIQA-01/02)**. Phase 13 names the practice + the WCAG 2.2 AA bar only.
- **Lint step / test-integrity gate** → Phase 15. **Security ASVS** → Phase 14. **Browsable docs catalog** (the new role + workflow get cataloged) → Phase 17.
- **A standing design-system file / design-token registry** as a separate artifact — kept inside the contract for now (D-11); a separate artifact is a future idea if the contract proves too heavy.
- **frontend-ui re-review of the built UI** (second activation) — considered and rejected this phase (D-03); QE owns verification. Could revisit if UI-acceptance proves to need a design eye the gate can't supply.
- **TypeScript pivot (project-level, HELD)** — unchanged; Phase 13 stays POSIX sh for the guard line + markdown for the kit. Do not smuggle it in.
  - **SUPERSEDED by the Phase-15 TypeScript pivot (D-13, ratified 2026-06-13).** The pivot is no longer held: grugops's tooling layer is now TypeScript (tsc-compiled committed `.js`, freshness-checked; single Node-required `install.ts`; dev-deps `{typescript, vitest}`; Node 22+ floor). This HELD note is preserved for history; the ratified constraint now lives in CLAUDE.md + PROJECT.md.

None of the above is unowned — each maps to a named later phase or a standing held decision.

</deferred>

---

*Phase: 13-Frontend/UI Persona & Design→Build Workflow*
*Context gathered: 2026-06-11*
