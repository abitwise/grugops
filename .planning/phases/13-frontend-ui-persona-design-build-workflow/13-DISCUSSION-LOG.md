# Phase 13: Frontend/UI Persona & Design→Build Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 13-Frontend/UI Persona & Design→Build Workflow
**Areas discussed:** Persona scope & engineer seam, Routing & handoff wiring, Workflow 14 depth & Phase-15 seam, Design-contract source

---

## Persona scope & engineer seam

| Option | Description | Selected |
|--------|-------------|----------|
| Owns UI build end-to-end | frontend-ui owns the whole UI slice incl. writing the components; seam by ticket type; framework-neutral, Vue examples. (Recommended) | |
| Contract-only, engineer codes | frontend-ui owns the design contract + five-states/a11y/visual-baseline SPEC; the existing Software Engineer writes the component code. | ✓ |
| You decide | — | |

**User's choice:** Contract-only, engineer codes
**Notes:** Diverged from the recommendation. frontend-ui is a **design authority**, not a builder — the Software Engineer keeps code authorship. Mirrors the Phase-12 BDD seam (contract authored upstream, engineer implements against it). Captured as D-01. Stack orientation resolved in a follow-up (framework-neutral, Vue examples — D-02).

---

## Routing & handoff wiring

| Option | Description | Selected |
|--------|-------------|----------|
| New classification + handoff stage | Add a `ui-build` classification + routing-matrix row → workflow 14; new `<TICKET>-frontend.md` handoff stage + template; consumes the impl-ready packet + Phase-12 acceptance scenarios; feeds QE. (Recommended) | ✓ |
| Sub-route inside ticket-to-pr | No new classification; route a UI ticket to frontend-ui as a role-switch within workflow 04; reuse the implementation handoff. | |
| You decide | — | |

**User's choice:** New classification + handoff stage
**Notes:** Matches SC3 ("routing matrix **and** classification list"). Captured as D-05/D-06. Handoff template `frontend-handoff.md` → instance `<TICKET-ID>-frontend.md`, stage token `frontend`.

---

## Workflow 14 depth & Phase-15 seam

| Option | Description | Selected |
|--------|-------------|----------|
| Hard gates + reference the gate | Five states as hard checklist gates; WCAG 2.2 AA + axe-core named; visual baseline names Playwright `toHaveScreenshot`, references the gate for enforcement. (Recommended) | |
| Practice-level, tool-neutral | Five states + a11y as guidance bullets; visual baseline tool-neutral; NO Playwright/axe naming — all tooling deferred to Phase 15. | ✓ |
| You decide | — | |

**User's choice:** Practice-level, tool-neutral
**Notes:** Diverged from the recommendation. Workflow 14 stays guidance-level; all tooling + automation wiring deferred to Phase 15 (UIQA). Captured as D-08. The a11y *bar* was carved out in a follow-up — **WCAG 2.2 AA is named** as the acceptance standard (a standard, not a tool — D-09).

---

## Design-contract source

| Option | Description | Selected |
|--------|-------------|----------|
| Self-authored, step 1 | frontend-ui self-authors the contract as step 1 from the product handoff + Phase-12 acceptance scenarios (+ architect-design handoff when present); design-system notion lives inside the contract. (Recommended) | ✓ |
| Consume from architect-design | The existing Architect/Design role authors the contract upstream; frontend-ui consumes it. | |
| You decide | — | |

**User's choice:** Self-authored, step 1
**Notes:** Captured as D-10/D-11. No new upstream role; architect-design's structural handoff is consulted when present, not made a mandatory gate. Design tokens + component inventory live inside `frontend-handoff.md`, not as a separate artifact.

---

## Follow-up turn (consequences of the contract-only + tool-neutral choices)

| Question | Options | User's choice |
|----------|---------|---------------|
| Workflow 14 shape | Author → ref 04 → review **/** Author once, QE verifies **/** You decide | **Author once, QE verifies** (D-03) |
| Accessibility bar | Name WCAG 2.2 AA **/** Generic 'accessible' guidance **/** You decide | **Name WCAG 2.2 AA** (D-09) |
| Stack orientation | Neutral, Vue examples **/** Vue-first **/** You decide | **Neutral, Vue examples** (D-02) |

**Notes:** "Author once, QE verifies" diverged from the recommended two-activation "author → review" — frontend-ui sets the bar once and does NOT re-activate; QE/E2E owns all UI verification at the gate. The contract handoff is the shared memory for both the engineer (build) and QE (verify).

---

## Claude's Discretion

- Exact `frontend-handoff.md` fields (mirror `qe-handoff.md` / `product-handoff.md` terseness; universal `## Scope` / `## Risks` header).
- How senior frontend judgment lands per skeleton section (bounded by the terse-caveman token economy — no bloat).
- Role-size-ceiling fit for `frontend-ui.md`; guard registration mechanics (add to `ROLE_FILES`; confirm WR-05 stays GREEN; decide whether the guard test harness needs a new fixture).
- Workflow 14 frontmatter (`order: 14`, `cadence:` value).
- Exact classification token spelling (`ui-build` vs `ui-design-to-build`) and routing-matrix wording, consistent across `orchestrator.md` + `README.md`.

## Deferred Ideas

- Automated UI/E2E + visual-regression wiring into the gate (Playwright `toHaveScreenshot`, axe-core, `quality.ui_e2e`) → Phase 15 (UIQA-01/02).
- Lint step / test-integrity gate → Phase 15. Security ASVS → Phase 14. Browsable docs catalog → Phase 17.
- A standing design-system file / token registry as a separate artifact — kept inside the contract for now (D-11).
- frontend-ui re-review of the built UI (second activation) — considered and rejected this phase (D-03); QE owns verification.
- TypeScript pivot (project-level, HELD) — unchanged; stays POSIX sh + markdown.
