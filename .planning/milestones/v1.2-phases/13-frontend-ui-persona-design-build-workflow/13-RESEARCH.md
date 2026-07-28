# Phase 13: Frontend/UI Persona & Design→Build Workflow - Research

**Researched:** 2026-06-11
**Domain:** Authoring markdown kit artifacts (a 17th role + a 14th workflow + a handoff template + orchestrator wiring + a foundation-guard registration) into grugops's introspective, no-runtime agent factory.
**Confidence:** HIGH — every claim below is grounded in files read this session (role skeleton, workflows 04/05, handoff templates, the guard script + its test harness, the orchestrator registry, the existing accessibility checklist, the v1.2 research + audit). No external package research applies (grugops installs nothing; D-08/D-09 defer all tooling to Phase 15).

## Summary

This phase is pure markdown authoring against a frozen, mechanically-guarded substrate. It adds (1) `agent-factory/roles/frontend-ui.md` — a 17th role on the uniform 9-section skeleton, design-authority/contract-only, no spawn tool; (2) `agent-factory/workflows/14-ui-design-to-build.md` — a practice-level, tool-neutral design→build workflow that *references* workflow 04 (build) and 05 (gate) rather than restating them; (3) `agent-factory/handoffs/frontend-handoff.md` — the design-contract template feeding the engineer (build) and QE (verify); and (4) the orchestrator wiring (a `ui-build` classification token, a routing-matrix row, a workflow-map row) plus the foundation-guard registration (`frontend-ui.md` joins `ROLE_FILES`, gaining a `role_ceiling()` case entry).

The two highest-risk mechanical traps are both in `scripts/check-foundation-guards.sh`, not in the prose. First: adding `frontend-ui.md` to `ROLE_FILES` WITHOUT adding a matching `role_ceiling()` `case` entry makes `guard_role_size` hit its `*) echo ""` branch and FAIL with "no documented ceiling" — the role MUST be authored, byte-measured, then given its own FAIL=+12%/WARN=+6% case line. Second: `orchestrator.md` sits at **6661B against a 6664B WARN / 7041B FAIL ceiling** — only **3B to WARN, 380B to FAIL**. The UI-03 edits (new classification token, routing-matrix row, workflow-map row, "15"→"16" text) will blow past 380B and turn the build RED unless the orchestrator's ceiling is raised in the SAME plan that adds the wiring.

**Primary recommendation:** Author `frontend-ui.md` terse (~2.6–3.3KB, in the qe-e2e/software-engineer band), then in one coordinated guard edit: add it to `ROLE_FILES`, add its `role_ceiling()` case, AND raise `orchestrator.md`'s ceiling to cover its post-wiring size. Keep workflow 14 tool-neutral (NO Playwright/axe-core/toHaveScreenshot in the body) except the one named standard — WCAG 2.2 AA — which is a bar, not a tool. Reference 04 and 05 by filename exactly as 04 already references 05.

> **Material discovery (single-source opportunity):** `agent-factory/checklists/accessibility-checklist.md` **already exists** (kind: checklist, tier: enterprise). It lists semantic structure/labels, keyboard-reachable + visible focus, color contrast, alt text, form error+label association, and a "target standard (**e.g.** WCAG 2.2 AA) noted" line — but it is referenced **only** by `agent-factory/checklists/00-index.md`, by **no role and no workflow**. This means D-09 ("the contract names WCAG 2.2 AA as the a11y bar") is best implemented as **reference-not-restate**: the new role / workflow / handoff should POINT to this checklist (and promote WCAG 2.2 AA from its current "e.g." example toward the named bar), rather than re-enumerating a11y items. This avoids single-source drift (PITFALLS P4) and keeps the new artifacts terse (token economy). The planner should decide whether the workflow's a11y step references the checklist by filename, and whether the checklist's "e.g. WCAG 2.2 AA" line is tightened to assert the standard. See Don't Hand-Roll + Assumptions A6. (Note: the checklist is `tier: enterprise`; workflow 14 is `cadence: both` — referencing an enterprise-tier checklist as the a11y *practice hub* is fine since the WCAG bar applies whenever UI changes, but keep the reference framed so lean users aren't gated by enterprise ceremony.)

## Architectural Responsibility Map

grugops has no application tiers; the "tiers" here are the kit's own artifact layers. This map assigns each phase capability to the artifact that owns it, for the planner's sanity-check.

| Capability | Primary Tier (artifact) | Secondary Tier | Rationale |
|------------|------------------------|----------------|-----------|
| Senior frontend persona + judgment | `roles/frontend-ui.md` | — | The persona lives once; the role file is the single source (D-01). |
| Design contract authoring (step 1) | `workflows/14-…md` routes it; `handoffs/frontend-handoff.md` carries it | `roles/frontend-ui.md` | Workflow routes the activation; the handoff template is the artifact filled. |
| Five-states / a11y / visual-baseline acceptance | `handoffs/frontend-handoff.md` (the contract fields) | `workflows/14-…md` (the practice steps); `checklists/accessibility-checklist.md` (the a11y item hub) | The bar is data in the handoff; the workflow walks the practice; the existing a11y checklist is the item-level hub to reference (D-04/D-11/D-09). |
| Component build | referenced workflow `04-ticket-to-pr.md` | `roles/software-engineer.md` | Engineer owns code; workflow 14 references 04, never restates it (D-01/D-03). |
| Verification of built UI against contract | referenced workflow `05-pr-quality-gate.md` | `roles/qe-e2e.md` | QE owns ALL verification at the gate; frontend-ui does NOT re-activate (D-03). |
| Routing UI work to the persona | `roles/orchestrator.md` (classification list + routing matrix + workflow-map table) | `README.md` (prose consistency only) | The orchestrator is the single workflow/classification registry (D-05). |
| No-spawn activation | `roles/_role-switch-protocol.md` (referenced, unchanged) | `roles/frontend-ui.md` (the `## Activates when` + footer reference) | The protocol is the single source for HOW a role activates; the new role points to it. |
| Mechanical guard coverage | `scripts/check-foundation-guards.sh` (`ROLE_FILES` + `role_ceiling()`) | `scripts/check-foundation-guards.test.sh` | The 17th role joins the existing 3 role-guards; the harness mirrors all role inputs. |

## Standard Stack

**Not applicable in the conventional sense.** grugops installs no packages, adds no npm/PyPI deps, and ships no runtime (CLAUDE.md hard constraint; REQUIREMENTS.md Out-of-Scope row "Adding npm runtime dependencies to grugops itself"). The phase's only "stack" is the existing markdown kit + POSIX-sh guard. **No `## Package Legitimacy Audit` is required** — zero external packages are installed by this phase.

The tools grugops *recommends to its users* (Vue, Playwright, axe-core) are already documented in `.planning/research/STACK.md` and are **deliberately NOT named in workflow 14's body** (D-08). They remain available to the persona's worked examples (D-02, Vue) but the workflow stays tool-neutral.

| "Library" (kit artifact) | Version/anchor | Purpose | Why standard |
|--------------------------|----------------|---------|--------------|
| 9-section role skeleton | uniform across all 16 roles | The fixed shape `frontend-ui.md` slots into | Every role uses it; `guard_caveman_preserved` + `guard_voice` assume the `## Caveman prompt` fence [VERIFIED: read qe-e2e.md, guard script] |
| `_role-switch-protocol.md` | unchanged | No-spawn activation mechanism the new role references | Single source for HOW a role activates; WR-05 guard enforces no-spawn [VERIFIED: read _role-switch-protocol.md, guard_wr05] |
| Workflow frontmatter `kind/order/cadence` | `cadence: both` for delivery workflows | Workflow 14's frontmatter | All delivery workflows (00–07,09,11) use `cadence: both`; only 08/10 use `scrum`, 12/13 use `tier: enterprise` [VERIFIED: read all 14 workflow frontmatters] |
| Handoff template convention | `<name>-handoff.md` → `<TICKET-ID>-<stage>.md` | `frontend-handoff.md` → `<TICKET-ID>-frontend.md` | qe-handoff.md→`-qe`, product-handoff.md→`-product` [VERIFIED: read templates + _role-switch-protocol.md step 4] |
| `accessibility-checklist.md` | existing, `tier: enterprise`, names "e.g. WCAG 2.2 AA" | The a11y item hub the new artifacts reference (D-09) | Already in the kit; referenced only by the checklist index today — a single-source hub to point to, not re-enumerate [VERIFIED: read this session] |

### The ONE standard named in the workflow (D-09 exception)

| Standard | Anchor | Why named (and why it's not a tool) |
|----------|--------|-------------------------------------|
| **WCAG 2.2 AA** | W3C Recommendation | A requirement *standard* gives the engineer + QE a concrete, citable acceptance bar. "Be accessible" is unverifiable; "meet WCAG 2.2 AA" is. Tooling that *checks* it (axe-core) stays deferred to Phase 15. The kit already names "e.g. WCAG 2.2 AA" in `accessibility-checklist.md` — promote it to the bar. [CITED: D-09; clear-voice topic per two-voice discipline] |

## Architecture Patterns

### System Architecture Diagram — the design→build→verify flow workflow 14 encodes

```
  product-handoff (## Acceptance scenarios, G/W/T)  ─┐
  implementation-ready-packet                        ├──►  STEP 1: frontend-ui ACTIVATES (role-switch, no spawn)
  architecture-handoff (## Module map, when present) ─┘         │  authors the UI/design contract ONCE
                                                                ▼
                                            frontend-handoff.md  →  plans/handoffs/<TICKET-ID>-frontend.md
                                            (design tokens · component inventory · five-states
                                             acceptance · WCAG 2.2 AA bar · visual-baseline expectation)
                                                                │
                                  ┌─────────────────────────────┴──────────────────────────────┐
                                  ▼ (build)                                                      ▼ (verify)
                    STEP 2: ENGINEER builds components                            STEP 3: QE/E2E verifies built UI
                    ── references workflow 04-ticket-to-pr.md ──                  ── references workflow 05-pr-quality-gate.md ──
                    (inner red-green loop; frontend-ui does NOT                    (five states · a11y · visual baseline
                     write component code — D-01)                                  checked against the contract — D-03)
                                  │                                                              │
                                  └──────────────────────────────┬───────────────────────────── ┘
                                                                 ▼
                                            Orchestrator gate recommendation (human holds merge)
```

Trace the primary use case left-to-right: inputs feed a single frontend-ui activation that writes the contract; the contract then fans out to the engineer (build, via 04) and QE (verify, via 05). frontend-ui appears exactly once. This is the Phase-12 BDD seam mirrored: author the contract once, build against it, verify against it — no double ownership, no re-activation (D-01/D-03).

### Recommended file structure (what this phase creates/edits)

```
agent-factory/
├── roles/
│   ├── frontend-ui.md            # NEW — 17th role, 9-section skeleton, no spawn (UI-01)
│   ├── orchestrator.md           # EDIT — +ui-build classification, +matrix row, +workflow-map row, 15→16 (UI-03)
│   └── _role-switch-protocol.md  # UNCHANGED — referenced by the new role
├── workflows/
│   └── 14-ui-design-to-build.md  # NEW — practice-level, tool-neutral, refs 04+05 (UI-02)
├── handoffs/
│   └── frontend-handoff.md       # NEW — design-contract template → <TICKET-ID>-frontend.md (D-06)
├── checklists/
│   └── accessibility-checklist.md # EXISTING — reference for the a11y bar (optional tighten of "e.g." → bar)
└── README.md                     # EDIT (minimal/optional) — keep prose consistent if it ever lists workflows
scripts/
├── check-foundation-guards.sh        # EDIT — +frontend-ui.md to ROLE_FILES; +role_ceiling() case; RAISE orchestrator ceiling
└── check-foundation-guards.test.sh   # EDIT — add frontend-ui.md to GUARD_INPUTS (mirror list)
```

### Pattern 1: Reference-not-restate (single-source)

**What:** Workflow 14 names workflows 04 and 05 by filename and points to them; it never inlines their steps. Same discipline for the a11y checklist hub.
**When to use:** Anywhere a workflow needs another workflow's loop or a checklist's items.
**Example (the exact pattern 04 already uses to reference 05):**
```markdown
# Source: agent-factory/workflows/04-ticket-to-pr.md line 28 [VERIFIED: read this session]
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop,
   the bounded self-fix, and the terminal result live there — this workflow references that
   gate and does not restate it.
```
Workflow 14 should produce two such references: one to `04-ticket-to-pr.md` for the component build (D-03: "references workflow 04 for the build rather than restating the engineering loop") and one to `05-pr-quality-gate.md` for verification (D-03: "QE/E2E owns ALL verification… workflow 14 references 05"). Optionally a third reference to `accessibility-checklist.md` for the a11y step (single-source the items). Phase 12 set the precedent of using *visible filenames*, not internal `§14`/`Phase N` labels — follow that.

### Pattern 2: The `## Agents involved` block references the protocol

**What:** Every workflow's agents block points to `_role-switch-protocol.md` with the standard one-liner.
**Example (verbatim from 04 and 05):**
```markdown
Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`):
one window, drop prior context, the handoff is the only memory.
```
Workflow 14's `## Agents involved` lists frontend-ui (authors the contract), Software Engineer (builds — see 04), QE/E2E (verifies — see 05), and carries this exact line.

### Pattern 3: Role file inputs are named in `## Reads` and `## Output`

**What:** A role's `## Reads` names the input handoff(s); `## Output` names the template it fills + the instance path; both cite the universal-header `## Scope` / `## Risks`.
**Example (qe-e2e.md `## Output`, the template to mirror):**
```markdown
# Source: agent-factory/roles/qe-e2e.md line 35 [VERIFIED]
Read the `qe-handoff.md` template from `agent-factory/handoffs/` (KIT, read-only), fill it
per ticket (…), and write the filled instance to `plans/handoffs/<TICKET-ID>-qe.md` (STATE,
this repo); cite the universal-header `## Scope` / `## Risks` as authoritative.
```
frontend-ui.md's `## Output` mirrors this for `frontend-handoff.md` → `plans/handoffs/<TICKET-ID>-frontend.md`.

### Anti-Patterns to Avoid

- **Naming tools in workflow 14's body** (Playwright, `toHaveScreenshot`, axe-core, Vitest): violates D-08; defer to Phase 15. The ONE exception is WCAG 2.2 AA (a standard, D-09).
- **frontend-ui writing/owning component code or re-activating to review:** violates D-01/D-03. The persona is a design authority; the engineer builds; QE verifies. One behavior, one owner.
- **Re-enumerating a11y items already in `accessibility-checklist.md`:** violates single-source (P4); reference the checklist instead.
- **Granting an `Agent`/`Task` tool** in any frontmatter or footer: trips `guard_wr05` and breaks single-window load (the new role isn't in the WR-05 scan set, but the principle is hard-locked and the role-switch protocol forbids it).
- **Caveman voice in the WCAG 2.2 AA / accessibility / safety lines:** violates the two-voice discipline; those lines are clear-voice (`guard_voice` scans them once the role joins `ROLE_FILES`).
- **Restating 04/05 steps inside workflow 14:** violates single-source; reference by filename only.
- **Adding the role to `ROLE_FILES` without a `role_ceiling()` case:** guaranteed `guard_role_size` FAIL ("no documented ceiling"). See Pitfall 1.
- **Adding the orchestrator wiring without raising its ceiling:** guaranteed FAIL (3B headroom). See Pitfall 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| How a role activates | A new activation description in frontend-ui.md | Reference `_role-switch-protocol.md` | Single source for activation; re-describing it forks the rule [VERIFIED: protocol says "Every entry point references THIS file by path. Nobody else inlines the steps."] |
| The build loop | A UI-specific engineering loop in workflow 14 | Reference `04-ticket-to-pr.md` | D-03; the engineer's loop (incl. TDD double-loop) lives in 04 |
| The verification/gate loop | A UI verification loop in workflow 14 | Reference `05-pr-quality-gate.md` | D-03; 05 is the single-source backpressure loop |
| The a11y item list | A fresh accessibility checklist inside the role/workflow/handoff | Reference the existing `agent-factory/checklists/accessibility-checklist.md`; name WCAG 2.2 AA as the bar | The checklist already exists (semantic/labels, keyboard/focus, contrast, alt text, form labels, "target standard") and is unreferenced by any role/workflow — pointing to it closes a single-source gap [VERIFIED: read this session] |
| The universal handoff header | A bespoke Source/Scope/Risks header | Inherit `universal-handoff.md`'s `## Source … ## Next action` block | Every handoff carries it; product/qe handoffs prepend it before their body [VERIFIED: read all three templates] |
| The acceptance contract machinery | A new G/W/T mechanism | Consume the existing product-handoff `## Acceptance scenarios` block | Phase 12 already ships it; the design contract sits *beside* it (D-04/D-10) |
| The role-size ceiling | A flat byte number | A per-file `role_ceiling()` case at +12%/+6% of the authored baseline | The guard is per-file by design (orchestrator's legit 6.6KB would punish or license others) [VERIFIED: read role_ceiling() comments] |

**Key insight:** Every "loop", "mechanism", or "checklist" this phase might be tempted to write already exists in another file (04, 05, the role-switch protocol, the universal handoff, the product `## Acceptance scenarios`, and the accessibility checklist). The phase's job is to *route to* them, not reproduce them. The only genuinely new prose is the persona's judgment and the contract's five-states/tokens/visual-baseline fields.

## Runtime State Inventory

This is a rename/refactor-adjacent phase (it *registers* a new artifact into scan sets and counters). The grep-finds-files-not-state discipline applies to the registration surfaces.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — grugops has no datastore; all state is in-repo markdown. Verified: no DB, no collection names. | none |
| Live service config | None — no external service holds a role/workflow count. | none |
| OS-registered state | None — no OS registration of roles. | none |
| Secrets/env vars | None — no env var names this phase. | none |
| Build artifacts / counters that DON'T auto-update from adding a file | **(1)** `orchestrator.md:35` literal **"all 15 request types"** → must become **16** (a count, not auto-derived). **(2)** `orchestrator.md` responsibility-3 classification list (15 tokens) → add `ui-build` (16th). **(3)** `orchestrator.md` routing matrix → add a row. **(4)** `orchestrator.md` workflow-map table (13 numbered rows) → add `ui-build → 14-ui-design-to-build.md`. **(5)** `scripts/check-foundation-guards.sh` `ROLE_FILES` (16 files) → add `frontend-ui.md` (17th) AND a `role_ceiling()` case. **(6)** `scripts/check-foundation-guards.test.sh` `GUARD_INPUTS` mirror list (16 roles) → add `frontend-ui.md` or every hermetic mirror case FAILs on the missing file. **(7)** The guard's own comment/pass strings say **"all 16 roles"** (line ~329) — cosmetic, but the audit doc counts also reference 16 roles/14 workflows. | code/text edits — each is a hand-maintained counter or list that adding a file does NOT auto-update |

**The canonical question answered:** After `frontend-ui.md` and `14-ui-design-to-build.md` exist on disk, the items still carrying the old "16 roles / 13 numbered workflows / 15 request types" counts are: orchestrator.md (4 edit sites + the "15" literal), the guard script (`ROLE_FILES` + `role_ceiling()` + a cosmetic "all 16" pass string), and the guard test harness (`GUARD_INPUTS`). The README does NOT enumerate roles or workflows and does NOT carry the routing matrix (verified by grep), so its "keep prose consistent" obligation (D-05) is minimal — likely a no-op unless a future README edit added a list. The existing `accessibility-checklist.md` already exists and needs only an optional reference/tightening, not creation.

## Common Pitfalls

### Pitfall 1: `guard_role_size` "no documented ceiling" FAIL (the #1 trap)

**What goes wrong:** You add `frontend-ui.md` to `ROLE_FILES` but forget the `role_ceiling()` `case` entry. The guard looks up the basename, hits `*) echo ""`, sees an empty ceiling, and emits `fail "$f has no documented ceiling (unknown role — update role_ceiling)"`. The build goes RED.
**Why it happens:** `ROLE_FILES` and `role_ceiling()` are two separate edits in the same file; the coupling is implicit. The 16 current roles all have cases; a 17th without one is undocumented.
**How to avoid:** Author `frontend-ui.md` first, measure its bytes (`wc -c`), then add `frontend-ui.md) echo "<FAIL> <WARN>" ;;` to `role_ceiling()` where FAIL = round(bytes × 1.12) and WARN = round(bytes × 1.06), matching the documented +12%/+6% formula. Add it to `ROLE_FILES` in the SAME edit. Then run `sh scripts/check-foundation-guards.sh` — must be GREEN.
**Warning signs:** Guard output contains "no documented ceiling"; a `ROLE_FILES` edit without a paired `role_ceiling()` edit.

### Pitfall 2: orchestrator.md trips its OWN size ceiling after the UI-03 wiring

**What goes wrong:** orchestrator.md is **6661B**; its ceiling is **WARN 6664 / FAIL 7041** (3B / 380B headroom). Adding a `ui-build` classification token, a routing-matrix row (~30–40B), a workflow-map row (~50B), and changing "15"→"16" easily adds 150–400B+ — tipping past FAIL → RED build.
**Why it happens:** The orchestrator is already the largest role (legit: it carries the routing matrix + WIP/DoR + XL-split + workflow table no other role has). Its ceiling was set at +12% off the *Phase-11* baseline, with almost no room for the Phase-13 additions it must now carry.
**How to avoid:** In the SAME guard edit that adds `frontend-ui.md`, **raise orchestrator.md's `role_ceiling()` case** from `"7041 6664"` to cover the post-wiring size with the standard +12%/+6% headroom off the *new* orchestrator baseline. Re-measure orchestrator.md after the UI-03 edits, then set FAIL/WARN off that. Document the bump in the case comment (the guard already documents per-role headroom rationale, e.g. ba-pm's PERS-02 note — add a Phase-13 routing note). Keep the orchestrator edits terse (caveman in the body; the matrix/map rows are minimal) to need the smallest bump.
**Warning signs:** orchestrator.md ≥ 7041B; guard output "role bloated (senior != verbose)" on orchestrator.md.

### Pitfall 3: Voice-discipline leak on the a11y/accessibility lines

**What goes wrong:** The WCAG 2.2 AA bar, accessibility guidance, and any safety line written in caveman voice → `guard_voice` (which scans `frontend-ui.md` once it's in `ROLE_FILES`) flags a marker, OR the clear-voice topic reads as a joke and erodes trust (PITFALLS Pitfall 3).
**Why it happens:** A single author rewriting the persona defaults to one register; the caveman block bleeds into the body.
**How to avoid:** Two-voice discipline — grug in the `## Caveman prompt` fence + punchy body; **clear professional voice** on the WCAG 2.2 AA bar, accessibility, and any safety/escalation line. Confirm `guard_voice` GREEN after authoring. Note the guard's `\bgrug\b` word-boundary already tolerates `.grugops/` and the `/grug` brand command, so legitimate clear-voice references are fine.
**Warning signs:** lowercase-only caveman phrasing in an accessibility line; `guard_voice` failing on frontend-ui.md.

### Pitfall 4: `guard_caveman_preserved` FAIL — the new block is too thin

**What goes wrong:** The new `## Caveman prompt` block has only a single `You are Frontend/UI.` opener (or zero `^You` lines) → `guard_caveman_preserved` requires **≥2 `^You`-cadence lines OR ≥1 bare grug idiom** (the WR-01 fix) and FAILs "sanded to prose."
**Why it happens:** The author writes a minimal one-line caveman block to save bytes.
**How to avoid:** Write the caveman block as ≥3–5 clipped second-person imperatives (`You are Frontend/UI.` / `You author the design contract.` / `You do not write the code.` / `You name the five states.` / `You set the a11y bar.`), matching every existing clean block (all carry ≥4 `^You` lines, verified 2026-06-11).
**Warning signs:** caveman block with <2 `^You` lines; guard output "sanded to prose / no caveman marker."

### Pitfall 5: Test-harness mirror missing the 17th role

**What goes wrong:** You add `frontend-ui.md` to `ROLE_FILES` (production guard) but NOT to `GUARD_INPUTS` in `check-foundation-guards.test.sh`. Every hermetic mirror case copies only the 16 listed inputs; the guard run inside the mirror then FAILs on the missing 17th role (presence-check fail-red), and the harness's planted-violation/smoke cases break.
**Why it happens:** Two parallel lists in two files; the test's `GUARD_INPUTS` is the mirror manifest, not auto-derived from `ROLE_FILES`.
**How to avoid:** Add `agent-factory/roles/frontend-ui.md` to `GUARD_INPUTS` in the test harness in the same change. (No NEW fixture/case is needed — the discretion note in 13-CONTEXT is correct: the 17th file just joins the existing scan; the existing planted-violation cases already prove each guard can fail. Only the mirror manifest needs the one-line addition.)
**Warning signs:** Test harness smoke run fails after the role is added; "required role file missing" in a mirror case.

### Pitfall 6: Renumbering the frozen 00–13 workflow ordinals

**What goes wrong:** Inserting the UI workflow anywhere but as `14` renumbers the frozen 00–13 ordinals → breaks every reference (orchestrator workflow-map, README copy-paste prompts, cross-workflow references).
**Why it happens:** A tidy-minded urge to slot UI "next to" engineering (04).
**How to avoid:** The new file is **`14-ui-design-to-build.md`** with frontmatter `order: 14`. 00–13 are frozen (CONTEXT.md, REQUIREMENTS.md). It appends; it never inserts.
**Warning signs:** Any change to a 00–13 filename or `order:` value.

## Code Examples

Verified patterns from files read this session.

### frontend-handoff.md — recommended field set (mirrors qe/product handoffs)

```markdown
# Pattern Source: universal-handoff.md (header) + qe-handoff.md (body shape) + D-09/D-11 [VERIFIED]
---
kind: handoff
stage: frontend
---
# Handoff: frontend

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
## Inputs used        # product-handoff ## Acceptance scenarios; implementation-ready-packet; architecture-handoff when present (D-10)
## Decisions
## Risks
## Trace updates   # (v2) IDs/files this links in plans/traceability.md
## Next agent        # Software Engineer (build, see workflow 04), then QE/E2E (verify, see workflow 05)
## Next action

---

## Design tokens          # lightweight design-system: color/spacing/type scale, not a separate artifact (D-11)
## Component inventory    # the components this ticket needs + their roles (D-11)
## Five-states acceptance # per component: loading / empty / error / success / partial-data — the acceptance bar QE verifies (D-04)
## Accessibility bar      # WCAG 2.2 AA — the named acceptance standard (D-09; clear voice); items per accessibility-checklist.md
## Responsive / performance budget  # breakpoints + a budget note (senior habit; terse)
## Visual-baseline expectation      # tool-neutral: a stable reference of the rendered component is expected at the gate (D-08 — NO tool named)
## Verification owner     # QE/E2E at the gate (05); frontend-ui does NOT re-verify (D-03)
```
Notes: every section terse (match qe-handoff's clipped style). The five-states + WCAG + visual-baseline are the contract QE reads to verify (D-04). The a11y bar names WCAG 2.2 AA and points to `accessibility-checklist.md` for the item list rather than re-enumerating it. Visual-baseline is described tool-neutrally (D-08). Keep it inside ONE handoff — no standing design-system file (D-11).

### Workflow 14 frontmatter + step skeleton

```markdown
# Pattern Source: 04/05 frontmatter + D-03/D-08 [VERIFIED]
---
kind: workflow
order: 14
cadence: both
---
# Workflow: UI design to build

## When to use
When a ticket needs UI/frontend work — a design contract authored once, then built and verified.

## Agents involved
- Frontend/UI — authors the UI/design contract (writes plans/handoffs/<TICKET-ID>-frontend.md).
- Software Engineer — builds the components against the contract (see 04-ticket-to-pr.md).
- QE/E2E — verifies the built UI against the contract at the gate (see 05-pr-quality-gate.md).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`):
one window, drop prior context, the handoff is the only memory.

## Steps
1. Frontend/UI authors the UI/design contract from the product handoff's `## Acceptance scenarios`,
   the implementation-ready packet (and `architecture-handoff.md` when present) — design tokens,
   component inventory, the five states (loading/empty/error/success/partial-data), the WCAG 2.2 AA
   accessibility bar, and a tool-neutral visual-baseline expectation. One activation; no re-review.
2. The Software Engineer builds the components against the contract — see
   `agent-factory/workflows/04-ticket-to-pr.md` for the engineering loop; this workflow references it
   and does not restate it.
3. Walk the five states as a practice for each component (guidance, not a hard gate — D-08).
4. Meet the accessibility bar: WCAG 2.2 AA (the named standard; items per
   `agent-factory/checklists/accessibility-checklist.md`; tooling deferred).
5. Establish the visual baseline (a stable reference of the rendered component — described tool-neutrally).
6. Verify the built UI against the contract per `agent-factory/workflows/05-pr-quality-gate.md` —
   QE/E2E owns this; this workflow references the gate and does not restate it.

## Board moves / Handoffs produced / Trace updates / Done condition / Commit
# mirror 04/05's closing sections, terse; the new handoff is <TICKET-ID>-frontend.md
```
Steps 3–5 stay practice-level/tool-neutral (D-08); step 4 names WCAG 2.2 AA (D-09) and points to the existing a11y checklist; steps 2 and 6 reference 04 and 05 by filename (D-03, single-source). Author terse.

### Orchestrator wiring — the four edit sites (UI-03)

```markdown
# Source: orchestrator.md lines 35, 40-43, 51-66, 90-108 [VERIFIED read this session]

# (1) line 35: "...the entry point for all 15 request types..." → "...all 16 request types..."

# (2) responsibility 3 classification list — append the 16th token:
   `… | release | incident | install | ui-build`

# (3) routing matrix — add a row (clear, aligned):
   Need UI/frontend          -> Frontend/UI

# (4) workflow-map table — add a row (keeps 00–13 frozen; new file is 14):
   | ui-build | `14-ui-design-to-build.md` |
```
Token spelling: **`ui-build`** (D-05, matches the verb-noun classification style of the other 15 tokens; `ui-design-to-build` is the *workflow* name, `ui-build` is the *classification*). Keep all three orchestrator sites + the count consistent. Then re-measure orchestrator.md and raise its `role_ceiling()` case (Pitfall 2).

### Foundation-guard registration

```sh
# Source: check-foundation-guards.sh ROLE_FILES (line 186) + role_ceiling() (line 364) [VERIFIED]

# (a) add to ROLE_FILES (the shared 16→17 scan set for all three role guards):
ROLE_FILES="… \
agent-factory/roles/frontend-ui.md \
…"

# (b) add a role_ceiling() case — FAIL = round(authored_bytes × 1.12), WARN = × 1.06:
    frontend-ui.md)        echo "<FAIL> <WARN>" ;;   # Phase 13 — 17th role (UI-01)

# (c) RAISE orchestrator's ceiling for the UI-03 wiring (re-measure first):
    orchestrator.md)       echo "<NEW_FAIL> <NEW_WARN>" ;;  # +Phase-13 routing (ui-build classification + matrix + map row)

# (d) update the cosmetic pass string "all 16 roles" → "all 17 roles" (guard_caveman_preserved, ~line 329)
```
Then add `agent-factory/roles/frontend-ui.md` to `GUARD_INPUTS` in `check-foundation-guards.test.sh` (Pitfall 5). Run BOTH `sh scripts/check-foundation-guards.sh` and `sh scripts/check-foundation-guards.test.sh` — both must be GREEN.

## State of the Art

| Old (pre-Phase-13) | New (Phase-13) | When | Impact |
|--------------------|----------------|------|--------|
| 16 roles | 17 roles (frontend-ui added) | Phase 13 | `ROLE_FILES`, orchestrator count, audit-doc counts reference 16→17 |
| 13 numbered workflows (00–13) | 14 (adds 14-ui-design-to-build) | Phase 13 | 00–13 frozen; appends as 14 |
| 15 request classifications | 16 (adds ui-build) | Phase 13 | orchestrator classification list + matrix + map + "15"→"16" |
| `accessibility-checklist.md` referenced only by the checklist index | Referenced by the UI role/workflow/handoff; WCAG 2.2 AA named as the bar | Phase 13 | Closes a single-source gap — the existing a11y checklist becomes the item hub for the UI flow |
| UI folded into generalist engineer | Dedicated design-authority persona + design→build flow | Phase 13 | Closes audit GAP-3 |

**Deprecated/outdated:** Nothing deprecated. This phase is purely additive. (Phase 11 already retired WR-05 debt and confirmed the spawn-free frontmatter — the new role inherits that locked no-spawn posture.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The README does not need a routing-matrix/workflow-list edit (it carries neither today). | Runtime State Inventory; D-05 | LOW — if a future README list exists, add a row; grep this session found none. |
| A2 | No NEW test fixture/case is needed in the harness — only the `GUARD_INPUTS` mirror line. | Pitfall 5 | LOW — matches the CONTEXT discretion note; the existing planted-violation cases already prove each guard fails. The planner could optionally add a "17th role present" smoke assertion, but it's not required. |
| A3 | `cadence: both` is correct for workflow 14 (a delivery workflow, both kanban and scrum). | Standard Stack | LOW — all non-scrum-only/non-enterprise delivery workflows use `both`; UI build is not scrum- or enterprise-gated. |
| A4 | Token spelling `ui-build` (not `ui-design-to-build`) for the classification. | Code Examples | LOW — D-05 names the classification `ui-build` and the workflow `14-ui-design-to-build.md`; consistent with the other 15 tokens. Planner should lock the spelling once across all sites. |
| A5 | frontend-ui.md authored size lands in the ~2.6–3.3KB band (qe-e2e=3220B, software-engineer=3295B, system-analyst=2638B). | Standard Stack / Pitfall 1 | LOW — a contract-authority role with no build loop should be comparable to qe-e2e; the actual ceiling is set off the *authored* size, so any size is fine as long as the case entry matches. |
| A6 | Referencing the existing `accessibility-checklist.md` (rather than re-listing a11y items) is the right single-source move, and tightening its "e.g. WCAG 2.2 AA" to the asserted bar is in-scope and desirable. | Summary callout; Don't Hand-Roll | LOW–MEDIUM — referencing it is clearly correct (P4 single-source). Whether to *edit* the checklist's "e.g." wording or its `tier: enterprise` framing is a small planner decision; the checklist is enterprise-tier so the planner should ensure lean UI work isn't accidentally gated by enterprise ceremony. If the planner prefers to leave the checklist untouched and only name WCAG 2.2 AA in the new artifacts, that also satisfies D-09. |

**If this table is empty:** It is not — all six assumptions are LOW (or LOW–MEDIUM for A6) and resolvable by the planner during authoring (measure-then-set for ceilings, lock-once for the token spelling, decide-once on the checklist edit).

## Open Questions (RESOLVED at planning)

1. **Exact orchestrator ceiling bump magnitude.**
   - What we know: orchestrator.md is 6661B; ceiling FAIL 7041 / WARN 6664; the UI-03 edits will add ~150–400B.
   - What's unclear: the precise post-wiring byte count (depends on row wording).
   - Recommendation: author the orchestrator edits terse, re-measure with `wc -c`, then set FAIL = round(new × 1.12) / WARN = round(new × 1.06). Do this in the same plan/task as the wiring so the guard never goes red mid-phase.
   - **RESOLVED:** adopted in Plan 13-03 Task 2 (measure-then-set in the same plan as the UI-03 wiring).

2. **Whether to add a forward-pointer to Phase-15 tooling in workflow 14.**
   - What we know: D-08 forbids naming tools in the workflow *body*; Phase 12 used light forward-pointers elsewhere.
   - What's unclear: whether a single neutral line like "(automated visual/a11y wiring lands later)" is wanted or is itself a leak.
   - Recommendation: omit tool names entirely; if a pointer is wanted, keep it tool-neutral and phase-neutral ("automation of these checks is a later concern"). Default: no pointer, to stay clean.
   - **RESOLVED:** adopted in Plan 13-02 — no Phase-15 forward-pointer; body stays tool-neutral.

3. **Whether to edit `accessibility-checklist.md` or only reference it.**
   - What we know: it exists, is enterprise-tier, names "e.g. WCAG 2.2 AA", and is referenced only by the checklist index.
   - What's unclear: whether D-09's "name WCAG 2.2 AA as the bar" implies tightening the checklist's "e.g." or just naming the bar in the new artifacts.
   - Recommendation: name WCAG 2.2 AA in the new role/workflow/handoff AND reference the checklist for the item list; optionally tighten the checklist's "e.g." to "target standard: WCAG 2.2 AA" while keeping it tier-agnostic so lean UI tickets still get the a11y bar without enterprise gating. A6.
   - **RESOLVED:** adopted in Plans 13-01/13-02 — name WCAG 2.2 AA in the new artifacts and reference the checklist (reference-not-restate).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX sh | Running the foundation guard + its test harness | ✓ (verified — both ran GREEN this session) | system sh | — |
| `wc`, `grep`, `awk` | The guards (read-only) | ✓ | system | — |

No external dependencies. The phase is markdown authoring + two POSIX-sh edits; both guard scripts execute today (confirmed GREEN this session: `ALL CHECKS PASSED` for both `check-foundation-guards.sh` and `check-foundation-guards.test.sh`).

## Validation Architecture

Nyquist validation is enabled for this phase. grugops has no app test runner; validation is the **foundation-guard scripts + grep-able structural checks** over the kit. Each success criterion maps to a mechanical or structural assertion.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX-sh guard scripts (no npm test runner — grugops ships none) |
| Config file | none — guards are self-contained scripts |
| Quick run command | `sh scripts/check-foundation-guards.sh` |
| Full suite command | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command / Structural Check | Exists? |
|--------|----------|-----------|--------------------------------------|---------|
| UI-01 | 17th role exists, 9-section skeleton, no spawn | guard + grep | `sh scripts/check-foundation-guards.sh` GREEN (covers voice/caveman/size for frontend-ui once in ROLE_FILES); `grep -L 'kind: role' agent-factory/roles/frontend-ui.md` empty; `grep -iE '(tools\|allowed-tools):.*\b(Agent\|Task)\b' agent-factory/roles/frontend-ui.md` empty | ✅ guard exists; role authored in this phase |
| UI-01 | No-spawn stays GREEN | guard | `guard_wr05` PASS (frontend-ui grants no spawn tool; WR-05 scan set unchanged) | ✅ |
| UI-01 | Caveman block present + markered | guard | `guard_caveman_preserved` PASS for frontend-ui.md (≥2 `^You` lines or grug idiom) | ✅ |
| UI-01 | Role stays terse | guard | `guard_role_size` PASS for frontend-ui.md (case entry present, under ceiling) | ✅ |
| UI-02 | Workflow 14 walks contract→build→5 states→a11y→visual baseline | structural grep | `test -f agent-factory/workflows/14-ui-design-to-build.md`; `grep -q 'order: 14'`; `grep -qi 'loading.*empty.*error.*success.*partial\|five states'`; `grep -q 'WCAG 2.2 AA'`; `grep -q '04-ticket-to-pr.md'` AND `grep -q '05-pr-quality-gate.md'` (reference-not-restate) | ✅ structural checks; author in phase |
| UI-02 | References 05 (and 04), does not restate | structural grep | `grep -c '05-pr-quality-gate.md' agent-factory/workflows/14-ui-design-to-build.md` ≥1; absence of the gate's step labels (`install -> lint -> typecheck`) | ✅ |
| UI-03 | Orchestrator routes UI work | structural grep | `grep -q 'ui-build' agent-factory/roles/orchestrator.md` (classification list); `grep -qi 'Frontend/UI' agent-factory/roles/orchestrator.md` (matrix row); `grep -q '| ui-build | .14-ui-design-to-build.md' agent-factory/roles/orchestrator.md` (workflow-map row); `grep -q 'all 16 request types' agent-factory/roles/orchestrator.md` (count updated) | ✅ |
| UI-03 | 00–13 not renumbered | structural | `ls agent-factory/workflows/` shows 00–13 unchanged + new 14 | ✅ |
| (registration) | 17th role registered in guard + harness | guard | both guard scripts GREEN; `grep -q 'frontend-ui.md' scripts/check-foundation-guards.sh` (ROLE_FILES + role_ceiling case) and `scripts/check-foundation-guards.test.sh` (GUARD_INPUTS) | ✅ |

### Sampling Rate
- **Per task commit:** `sh scripts/check-foundation-guards.sh` (fast; all 6 guards over the tree).
- **Per wave merge:** `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` (adds the fail-proof harness + config byte-identity).
- **Phase gate:** both scripts GREEN + the UI-01/02/03 structural greps pass before `/gsd-verify-work`.

### Wave 0 Gaps
- None new. Existing guard infrastructure covers UI-01 mechanically (once frontend-ui joins ROLE_FILES) and UI-02/UI-03 via grep-able structural checks. The only authoring obligation that affects validation is the paired `ROLE_FILES` + `role_ceiling()` edits (Pitfall 1) and the orchestrator ceiling raise (Pitfall 2) — both are guard-script edits the per-commit run will catch if missed.
- *(If a stronger UI-03 check is wanted, the planner may add a tiny structural assertion to the harness verifying the workflow-map row count went 13→14 and the classification list went 15→16 — optional, A2.)*

## Security Domain

`security_enforcement` is not disabled for this phase, but the phase ships **no executable code paths, no auth, no data handling, no crypto, no input parsing** — it authors markdown and edits two POSIX-sh guard scripts (read-only: `grep`/`wc`/`awk`/`test`, no writes, no `--fix`, no network).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — no auth surface |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation | no | the guard scripts read fixed repo-relative paths, no user input |
| V6 Cryptography | no | n/a — never hand-rolled because never present |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Re-arming spawn (single-window bypass) | Elevation of Privilege | No `Agent`/`Task` grant in the new role (role-switch protocol; WR-05 posture locked) — the new role grants no tools at all |
| Voice leak in safety/accessibility text undermining a real warning | (trust integrity) | Two-voice discipline: clear voice on WCAG 2.2 AA + safety lines; `guard_voice` enforces |
| Fabricated guard-pass (a guard that can only pass) | Tampering / Repudiation | The fail-proof harness (`check-foundation-guards.test.sh`) plants real violations and asserts each guard fails red — no-fabrication contract holds for the 17th role too |

The single genuine "security-adjacent" property of this phase is preserving the **no-spawn single-window** invariant (CLAUDE.md hard safety constraint) — satisfied by authoring frontend-ui.md with no tool grants and referencing `_role-switch-protocol.md`. The never-merge/never-deploy human stop is untouched.

## Sources

### Primary (HIGH confidence — files read this session)
- `agent-factory/roles/qe-e2e.md` — closest-analog role; the 9-section skeleton + `## Output` template + outer-loop ownership line.
- `agent-factory/roles/_role-switch-protocol.md` — the no-spawn activation mechanism + the 5 steps + the handoff-is-only-memory invariant.
- `agent-factory/roles/orchestrator.md` — the classification list (15 tokens), routing matrix, workflow-map table (13 rows), and the "all 15 request types" literal (line 35) — the exact UI-03 edit sites.
- `agent-factory/workflows/04-ticket-to-pr.md` + `05-pr-quality-gate.md` — the reference-not-restate pattern (04 references 05), frontmatter (`kind/order/cadence: both`), `## Agents involved` protocol line.
- `agent-factory/handoffs/{universal,qe,product,implementation-ready-packet,architecture}-handoff.md` — the header inheritance + terse field style frontend-handoff.md mirrors; product's `## Acceptance scenarios` block (the contract input, D-10).
- `agent-factory/checklists/accessibility-checklist.md` — the existing a11y item hub (names "e.g. WCAG 2.2 AA"), referenced only by the checklist index today — the single-source target for D-09.
- `scripts/check-foundation-guards.sh` — `ROLE_FILES` (line 186), `role_ceiling()` (line 364, the per-file ceiling + the `*) echo ""` undocumented-role FAIL), orchestrator's 7041/6664 ceiling, the voice/caveman/size guards. Ran GREEN this session.
- `scripts/check-foundation-guards.test.sh` — `GUARD_INPUTS` mirror manifest (16 roles); the hermetic mirror-and-mutate harness; ran GREEN this session.
- `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` — GAP-3 (the hole this phase closes); the 16-roles/14-workflows scope counts.
- `.planning/phases/{11,12}-*/…-CONTEXT.md` — the senior-persona-in-place mechanism (no new section, terse caveman = token economy) and the BDD seam (QE outer / engineer inner; product `## Acceptance scenarios`) the contract plugs into.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — the Vue/Playwright tools grugops *recommends to users* (deferred to Phase 15 for the workflow body; Vue is the persona's worked example, D-02).
- `.planning/research/PITFALLS.md` — voice-drift (P3), single-source fork (P4), prompt bloat (P5), config-dial (P6), WR-05 regen (P1) — the cross-cutting hazards the guards already protect against.

### Tertiary (LOW confidence)
- None. All claims trace to files read this session; no unverified web findings were needed (the phase installs nothing).

## Metadata

**Confidence breakdown:**
- Standard stack (kit artifacts): HIGH — every shape verified against a read file; no external packages.
- Architecture (the design→build→verify flow + reference-not-restate): HIGH — mirrors the verified 04↔05 pattern and the Phase-12 seam.
- Pitfalls (guard mechanics): HIGH — the `role_ceiling()` FAIL branch, the 3B/380B orchestrator headroom, and the test mirror manifest were each read/measured this session; both guard scripts executed GREEN.

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (stable — the kit substrate and guard mechanics are frozen for v1.2; re-verify only if Phases 14/15 land before this phase and change the role/workflow counts).
