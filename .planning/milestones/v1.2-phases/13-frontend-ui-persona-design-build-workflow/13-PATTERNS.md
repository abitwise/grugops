# Phase 13: Frontend/UI Persona & Design→Build Workflow - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 5 (3 NEW markdown, 2 EDIT — orchestrator.md + the guard script/test pair counted as one EDIT surface)
**Analogs found:** 5 / 5

> grugops is a markdown agent factory. There is no application code. Every "pattern" below is a **markdown skeleton, frontmatter block, or POSIX-sh `case`/list shape** the new/edited file must mirror byte-faithfully. All excerpts are verbatim from files read this session.

## File Classification

| New/Modified File | Role (artifact kind) | Data Flow | Closest Analog | Match Quality |
|-------------------|----------------------|-----------|----------------|---------------|
| **NEW** `agent-factory/roles/frontend-ui.md` | role (`kind: role`) | contract-authoring (single activation, no spawn) | `agent-factory/roles/qe-e2e.md` | exact (same 9-section skeleton, testing-adjacent, owns a verification-bar) |
| **NEW** `agent-factory/workflows/14-ui-design-to-build.md` | workflow (`kind: workflow`) | design→build→verify, reference-not-restate | `agent-factory/workflows/04-ticket-to-pr.md` (+ `05-pr-quality-gate.md`) | exact (same frontmatter, `## Agents involved` protocol line, references-by-filename pattern) |
| **NEW** `agent-factory/handoffs/frontend-handoff.md` | handoff (`kind: handoff`) | contract carrier (template → instance) | `agent-factory/handoffs/qe-handoff.md` (+ `product-handoff.md`, `universal-handoff.md`) | exact (same universal header, terse field body, same template→`<TICKET-ID>-<stage>.md` convention) |
| **EDIT** `agent-factory/roles/orchestrator.md` | role (registry) | 4 hand-maintained counters/lists | self (current text below is the edit target) | n/a — modify-in-place |
| **EDIT** `scripts/check-foundation-guards.sh` + `.test.sh` | POSIX-sh guard + mirror | scan-set registration (`ROLE_FILES` + `role_ceiling()` case + `GUARD_INPUTS`) | self (existing 16-entry lists below) | n/a — modify-in-place |

---

## Pattern Assignments

### `agent-factory/roles/frontend-ui.md` (NEW — role, contract-authoring)

**Analog:** `agent-factory/roles/qe-e2e.md` (read in full; 3220B, ceiling `3224 3051`). Mirror its exact 9-section skeleton. The skeleton ordering is the frozen one named in CONTEXT D-spec: `One job → Caveman prompt → Reads → Activates when → Responsibilities → Output → Board moves → Trace updates → Hard limits → AGENTS.md footer`.

**Frontmatter** (lines 1-4 — copy verbatim, no tool grant, no `tools:`/`allowed-tools:` key — WR-05 stays GREEN because the role grants nothing):
```markdown
---
kind: role
tier: core
---
# Role: Frontend/UI
```

**`## Caveman prompt` block** (qe-e2e lines 10-17 — the fenced shape `guard_caveman_preserved` scans; MUST have ≥2 `^You` lines — Pitfall 4):
```markdown
## Caveman prompt
```
You are QE/E2E.
You break the feature.
You test happy, sad, and edge paths.
You write E2E where useful with stable selectors.
You avoid flaky tests. You report gaps.
```
```
For frontend-ui, author ≥4 clipped `^You` imperatives (the CONTEXT-suggested set): `You are Frontend/UI.` / `You author the design contract.` / `You do not write the code.` / `You name the five states.` / `You set the accessibility bar.` The block is **caveman voice**; the WCAG 2.2 AA / a11y line elsewhere is **clear voice** (two-voice discipline, Pitfall 3).

**`## Reads` pattern** (qe-e2e lines 19-24 — config-first, then board/index, then the input handoff(s), then traceability):
```markdown
## Reads
- `.grugops/factory.config.json` **first** — `mode` / `cadence` / `autonomy` / `wip_limits` / `quality` / `nfr` / `compliance_regime`. In enterprise mode, enforce the coverage thresholds from `quality`.
- `plans/board.md` and `memory-bank/00-index.md` on start, for orientation.
- The implementation under review and the Software Engineer's filled handoff `plans/handoffs/<TICKET-ID>-implementation.md` — the behavior to break (cite the universal-header `## Scope` / `## Risks`).
- `plans/traceability.md` for the requirement→ticket→code→test→release trail.
```
For frontend-ui, the inputs (per D-10) are: the **product handoff `## Acceptance scenarios`**, the **implementation-ready packet**, and **`architecture-handoff.md` when present** — cite the universal-header `## Scope` / `## Risks`.

**`## Activates when`** (qe-e2e line 25-26 — one terse line; this is where `_role-switch-protocol.md` activation is implied, but the protocol is referenced, never restated):
```markdown
## Activates when
Need tests.
```
frontend-ui: `Need UI/frontend work.` (matches the routing-matrix wording, below).

**`## Output (file + format)` pattern** (qe-e2e line 34-35 — the template→instance contract; THIS is the exact line frontend-ui mirrors for its handoff):
```markdown
## Output (file + format)
Read the `qe-handoff.md` template from `agent-factory/handoffs/` (KIT, read-only), fill it per ticket (test scope, unit/integration/E2E coverage, manual test cases, regression risks, test data, commands run, flaky risk, coverage vs threshold, result, gaps), and write the filled instance to `plans/handoffs/<TICKET-ID>-qe.md` (STATE, this repo); cite the universal-header `## Scope` / `## Risks` as authoritative.
```
frontend-ui: read `frontend-handoff.md` template from `agent-factory/handoffs/`, fill per ticket (design tokens, component inventory, five-states acceptance, WCAG 2.2 AA bar, visual-baseline expectation), write to `plans/handoffs/<TICKET-ID>-frontend.md`; cite the universal-header `## Scope` / `## Risks`.

**`## Hard limits` + outer-loop ownership + footer** (qe-e2e lines 43-48 — the seam line and the mandatory AGENTS.md footer):
```markdown
## Hard limits
Test behavior, do not change it: no production-code fixes, no hidden scope. [...] Never fake a result or a passing check; mark anything unverified `UNKNOWN - verify`.

You own the outer acceptance loop: the handoff's `## Acceptance scenarios` block is the contract, red until the engineer's inner loop closes it — see workflow 04 for the double-loop.

Follow the 12 coding rules in `AGENTS.md`.
```
frontend-ui's seam line (D-01/D-03): it owns the **design contract**, NOT the code (the engineer builds — see workflow 04) and NOT the verification (QE verifies at the gate — see workflow 05); frontend-ui does **not re-activate** to review. Hard limit: no component code, single activation. End with the exact footer line `Follow the 12 coding rules in `AGENTS.md`.`

**`## Board moves` + `## Trace updates`** (qe-e2e lines 37-41): one terse paragraph each, naming the column transition the role causes and the traceability row it appends. frontend-ui authors the contract before `In Development` — it sits at the design step; keep both sections terse.

**Size discipline:** Target the qe-e2e/software-engineer band (qe-e2e=3220B, software-engineer=3295B, system-analyst=2638B per `wc -c` this session). Author terse; the `role_ceiling()` case is set OFF the authored size (measure-then-set, Pitfall 1 — see guard section below).

---

### `agent-factory/workflows/14-ui-design-to-build.md` (NEW — workflow, reference-not-restate)

**Analogs:** `agent-factory/workflows/04-ticket-to-pr.md` (the build workflow it references) and `05-pr-quality-gate.md` (the gate it references). Both read in full this session.

**Frontmatter** (04 lines 1-5 / 05 lines 1-5 — identical shape; only `order` differs; `cadence: both` is correct for a delivery workflow per RESEARCH A3):
```markdown
---
kind: workflow
order: 4
cadence: both
---
# Workflow: Ticket to PR
```
Workflow 14: `order: 14`, `cadence: both`, `# Workflow: UI design to build`. **Do NOT renumber 00–13** (Pitfall 6) — this appends as 14.

**`## Agents involved` + the protocol line** (04 lines 11-17 — the bulleted agents, then the EXACT one-liner pointing to `_role-switch-protocol.md`; this line is verbatim-identical in 04 and 05):
```markdown
## Agents involved
- Orchestrator — checks readiness against the Definition of Ready and pulls the ticket into development.
- Software Engineer — implements the one ticket on a branch (writes `plans/handoffs/<TICKET-ID>-implementation.md`).
- QE/E2E — breaks the feature and reports gaps (writes `plans/handoffs/<TICKET-ID>-qe.md`).
- Security/NFR — reviews risk if the change is triggered (writes `plans/handoffs/<TICKET-ID>-security-nfr.md`).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.
```
Workflow 14's `## Agents involved`: **Frontend/UI** (authors the contract → writes `plans/handoffs/<TICKET-ID>-frontend.md`), **Software Engineer** (builds — see `04-ticket-to-pr.md`), **QE/E2E** (verifies — see `05-pr-quality-gate.md`). Carry the protocol line verbatim.

**★ THE REFERENCE-NOT-RESTATE PATTERN (load-bearing — the whole point of workflow 14)** — how 04 references 05 by filename instead of inlining the gate loop (04 line 28, VERBATIM):
```markdown
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there — this workflow references that gate and does not restate it.
```
And how 05 declares itself the single source (05 line 9, VERBATIM):
```markdown
This workflow is the single source of the backpressure loop: [...] Every other workflow that needs the gate references this file rather than restating the loop.
```
Workflow 14 must produce **two** such references — one to `04-ticket-to-pr.md` for the build (D-03: "references workflow 04 for the build rather than restating the engineering loop"), one to `05-pr-quality-gate.md` for verification (D-03: "QE/E2E owns ALL verification… references 05"). Use the exact "live there — this workflow references that … and does not restate it" phrasing. Optionally a third reference to `agent-factory/checklists/accessibility-checklist.md` for the a11y item list (single-source, RESEARCH Pattern 1).

**`## Steps` body — D-08 tool-neutral, D-09 names ONE standard:** Walk contract → build (ref 04) → five states (loading/empty/error/success/partial-data, as practice not hard gate) → accessibility (name **WCAG 2.2 AA** — the ONLY named standard; clear voice; point to `accessibility-checklist.md`) → visual baseline (tool-neutral, NO Playwright/`toHaveScreenshot`/axe-core) → verify (ref 05). The RESEARCH §"Code Examples" step skeleton (lines 283-300) is the recommended literal text.

**Closing sections** (04 lines 32-54 / 05 lines 36-56 — mirror these terse blocks): `## Board moves`, `## Handoffs produced` (the new `<TICKET-ID>-frontend.md`), `## Trace updates`, `## Done condition`, `## Commit` (with the branch-guard-first / never-merge-never-deploy line). Example `## Commit` shape (04 line 53-54):
```markdown
## Commit
Commit the artifacts this workflow wrote [...] per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch [...]), then `type(scope): summary`. Never merge, never deploy; humans hold both.
```

---

### `agent-factory/handoffs/frontend-handoff.md` (NEW — handoff, contract carrier)

**Analogs:** `agent-factory/handoffs/universal-handoff.md` (the header), `qe-handoff.md` (the terse body field style), `product-handoff.md` (the `## Acceptance scenarios` contract-input block). All three read in full this session.

**Frontmatter + universal header** (qe-handoff lines 1-23 — copy this block VERBATIM, changing only `stage:` and the `# Handoff:` title; this is the `universal-handoff.md` header that every handoff prepends, lines 1-24 of universal):
```markdown
---
kind: handoff
stage: qe
---
# Handoff: qe

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

---
```
frontend-handoff: `stage: frontend`, `# Handoff: frontend`. The `## Scope`/`### In scope`/`### Out of scope` and `## Risks` are the universal header carried verbatim (CONTEXT discretion: "carry the universal-header `## Scope` / `## Risks`").

**Terse body field style** (qe-handoff lines 27-59 — bare `## Heading` lines, no prose; some carry a `# comment` annotation):
```markdown
## Test scope
## Unit/integration/E2E coverage
## Acceptance scenarios (Given/When/Then)
[...]
## Manual test cases
## Regression risks
## Result
## Gaps
```

**The contract-input block to MIRROR** (product-handoff lines 36-48 — the `## Acceptance scenarios` block frontend-ui consumes per D-10; this is the shape of the G/W/T input, NOT re-created in frontend-handoff but READ from the product handoff):
```markdown
## Acceptance scenarios (Given/When/Then)
<!-- bdd dial: off = omit · lean = inline declarative G/W/T below · strict = link selector-free
     scenario files wired to host step definitions; default lean. Declarative business language
     only — NO CSS/HTML/selectors in Given/When/Then; UI detail lives behind step definitions. -->

Scenario: <one observable business behavior>
  Given <business precondition>
  When  <business action>
  Then  <observable business outcome>
```

**Recommended frontend-handoff body fields** (RESEARCH "Code Examples" lines 251-258 — the discretion-locked field set per D-11/D-09/D-04/D-08; append after the universal `---` separator, each terse with a `# comment`):
```markdown
## Design tokens          # lightweight design-system: color/spacing/type scale, not a separate artifact (D-11)
## Component inventory    # the components this ticket needs + their roles (D-11)
## Five-states acceptance # per component: loading / empty / error / success / partial-data — the acceptance bar QE verifies (D-04)
## Accessibility bar      # WCAG 2.2 AA — the named acceptance standard (D-09; clear voice); items per accessibility-checklist.md
## Responsive / performance budget  # breakpoints + a budget note (senior habit; terse)
## Visual-baseline expectation      # tool-neutral: a stable reference of the rendered component is expected at the gate (D-08 — NO tool named)
## Verification owner     # QE/E2E at the gate (05); frontend-ui does NOT re-verify (D-03)
```
Convention check: `<name>-handoff.md` template → `plans/handoffs/<TICKET-ID>-<stage>.md` instance. `frontend-handoff.md` → `<TICKET-ID>-frontend.md`, stage token `frontend` (D-06, matches `qe-handoff.md`→`-qe`).

---

### `agent-factory/roles/orchestrator.md` (EDIT — registry, 4 hand-maintained edit sites)

**Current text is the edit target.** orchestrator.md is **6661B** (`wc -c` this session). Its ceiling is `7041 6664` — **3B to WARN, 380B to FAIL**. The UI-03 edits WILL exceed 380B → **the orchestrator ceiling MUST be raised in the SAME plan** (Pitfall 2).

**Edit site 1 — the request-count literal** (line 35, VERBATIM current text):
```markdown
## Activates when
Any incoming request — the entry point for all 15 request types; every `/grug` request starts here.
```
Change `all 15 request types` → `all 16 request types`. (Structural check UI-03 greps for `all 16 request types`.)

**Edit site 2 — the classification list** (responsibility 3, lines 40-43, VERBATIM current 15-token list):
```markdown
3. Classify request:
   `greenfield-bootstrap` | `brownfield-bootstrap` | `idea-to-epics` | `epic-to-tickets` |
   `ticket-to-pr` | `quality-gate` | `uat` | `refinement` | `sprint-planning` | `daily-sweep` |
   `sprint-review` | `retro` | `release` | `incident` | `install`
```
Append the 16th token `ui-build` (D-05; token spelling locked — `ui-build` is the classification, `ui-design-to-build` is the workflow name).

**Edit site 3 — the routing matrix** (lines 51-66, VERBATIM current 12-row table inside the fenced block):
```markdown
### Routing matrix (request → role)
```
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
```
Add a row (D-05 wording, keep the `->` alignment): `Need UI/frontend          -> Frontend/UI`.

**Edit site 4 — the workflow-map table** (lines 92-109, VERBATIM current 13-row numbered table + the install note):
```markdown
| Classification | Workflow file (named, not inlined) |
|----------------|-------------------------------------|
| greenfield-bootstrap | `00-bootstrap-greenfield.md` |
| brownfield-bootstrap | `01-bootstrap-brownfield.md` |
| idea-to-epics | `02-idea-to-epics.md` |
| epic-to-tickets | `03-epic-to-tickets.md` |
| ticket-to-pr | `04-ticket-to-pr.md` |
| quality-gate | `05-pr-quality-gate.md` |
| uat | `06-uat-pack.md` |
| refinement | `07-backlog-refinement.md` |
| sprint-planning | `08-sprint-planning.md` |
| daily-sweep | `09-daily-sweep.md` |
| sprint-review | `10-sprint-review.md` |
| retro | `11-retro.md` |
| release | `12-release.md` |
| incident | `13-incident.md` |

The `install` classification has **no numbered workflow** — it is handled by the Installer role directly.
```
Add a row: `| ui-build | `14-ui-design-to-build.md` |`. (Structural check greps for `| ui-build | .14-ui-design-to-build.md`.) Keep `agent-factory/README.md` consistent — the line 90-91 note says "must stay consistent with `agent-factory/README.md`"; RESEARCH Runtime State Inventory confirms README does NOT enumerate roles/workflows, so this is likely a no-op (Assumption A1).

---

### `scripts/check-foundation-guards.sh` + `check-foundation-guards.test.sh` (EDIT — scan-set registration)

**★ Pitfall 1 (the #1 trap): three coupled edits in `check-foundation-guards.sh` — ALL THREE or the build goes RED.**

**Edit (a) — `ROLE_FILES`** (lines 186-201, VERBATIM current 16-file list; list is alphabetized; `frontend-ui.md` slots between `factory-coach.md` and `greenfield-mapper.md`):
```sh
ROLE_FILES="agent-factory/roles/agents-md-scribe.md \
agent-factory/roles/architect-design.md \
agent-factory/roles/ba-pm.md \
agent-factory/roles/brownfield-mapper.md \
agent-factory/roles/compliance-officer.md \
agent-factory/roles/factory-coach.md \
agent-factory/roles/greenfield-mapper.md \
agent-factory/roles/incident-responder.md \
agent-factory/roles/installer.md \
agent-factory/roles/orchestrator.md \
agent-factory/roles/qe-e2e.md \
agent-factory/roles/release-manager.md \
agent-factory/roles/security-nfr.md \
agent-factory/roles/software-engineer.md \
agent-factory/roles/system-analyst.md \
agent-factory/roles/uat-planner.md"
```
Add `agent-factory/roles/frontend-ui.md \` (after `factory-coach.md` to keep alpha order). This single line registers the role in all three guards (`guard_voice`, `guard_caveman_preserved`, `guard_role_size`).

**Edit (b) — `role_ceiling()` case** (lines 364-385, VERBATIM current `case` block; note the `*) echo "" ;;` FAIL branch — adding to `ROLE_FILES` WITHOUT a matching case = guaranteed `guard_role_size` FAIL "no documented ceiling"):
```sh
role_ceiling() {
  # $1 = role basename → echoes "FAIL WARN"
  case "$1" in
    orchestrator.md)       echo "7041 6664" ;;
    security-nfr.md)       echo "4576 4331" ;;
    compliance-officer.md) echo "4160 3937" ;;
    release-manager.md)    echo "4144 3922" ;;
    agents-md-scribe.md)   echo "3910 3701" ;;
    architect-design.md)   echo "3617 3423" ;;
    ba-pm.md)              echo "3294 3075" ;;  # PERS-02 BA headroom (+20% / +12%)
    factory-coach.md)      echo "3420 3237" ;;
    incident-responder.md) echo "3387 3206" ;;
    installer.md)          echo "3345 3166" ;;
    software-engineer.md)  echo "3307 3130" ;;
    qe-e2e.md)             echo "3224 3051" ;;
    uat-planner.md)        echo "3149 2980" ;;
    system-analyst.md)     echo "2809 2659" ;;
    greenfield-mapper.md)  echo "2673 2530" ;;
    brownfield-mapper.md)  echo "2487 2354" ;;
    *)                     echo "" ;;
  esac
}
```
Add a case line, computed AFTER authoring & measuring frontend-ui.md: `    frontend-ui.md)        echo "<FAIL> <WARN>" ;;  # Phase 13 — 17th role (UI-01)` where **FAIL = round(authored_bytes × 1.12)**, **WARN = round(authored_bytes × 1.06)** (the documented +12%/+6% formula, lines 347-349).

**Edit (c) — RAISE the orchestrator ceiling** (same `case` block, the `orchestrator.md)` line above): after the 4 UI-03 edits land, re-measure orchestrator.md with `wc -c`, then set FAIL = round(new × 1.12) / WARN = round(new × 1.06) off the NEW baseline. Document the bump in the case comment (precedent: ba-pm's `# PERS-02 BA headroom` note) — e.g. `# +Phase-13 routing (ui-build classification + matrix + map row)`.

**Edit (d) — cosmetic pass string** (line 329, VERBATIM): `pass "caveman: all 16 roles keep a non-empty markered caveman prompt block"` → change `16` to `17`. (Cosmetic; the comments at lines 182-185 and 355-356 still say "16-file list" — update for accuracy, non-blocking.)

**Edit (e) — `GUARD_INPUTS` mirror in `check-foundation-guards.test.sh`** (lines 56-76, VERBATIM current mirror manifest; if you skip this, every hermetic mirror case FAILs on the missing 17th role — Pitfall 5):
```sh
GUARD_INPUTS="AGENTS.md \
.claude/skills/grugops/SKILL.md \
.claude/agents/grugops-orchestrator.md \
agent-factory/packaging/subagent.frontmatter.md \
agent-factory/packaging/slash-command.template.md \
agent-factory/roles/agents-md-scribe.md \
[... 16 role files, alphabetized, same as ROLE_FILES ...]
agent-factory/roles/uat-planner.md"
```
Add `agent-factory/roles/frontend-ui.md \` (after `factory-coach.md`, matching alpha order). No new fixture/case needed (RESEARCH Assumption A2 — the existing planted-violation cases already prove each guard can fail). Verify both scripts GREEN: `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh`.

---

## Shared Patterns

### The role-switch protocol reference (single-source activation)
**Source:** `agent-factory/roles/_role-switch-protocol.md` (unchanged this phase).
**Apply to:** `frontend-ui.md` (`## Activates when` / footer) and `14-ui-design-to-build.md` (`## Agents involved`).
**Verbatim one-liner (identical in 04 + 05):**
```markdown
Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.
```
Never restate the protocol's steps; point to it. No `Agent`/`Task` tool grant anywhere (WR-05).

### The universal handoff header
**Source:** `agent-factory/handoffs/universal-handoff.md` (lines 1-24).
**Apply to:** `frontend-handoff.md` — prepend the `## Source … ## Next action` block before the body, with `## Scope`/`### In scope`/`### Out of scope` and `## Risks` carried verbatim.

### The AGENTS.md footer (every role ends with it)
**Source:** every role file (qe-e2e.md line 48, orchestrator.md line 125).
**Apply to:** `frontend-ui.md` — the last line is exactly:
```markdown
Follow the 12 coding rules in `AGENTS.md`.
```

### Two-voice discipline (caveman vs clear)
**Source:** `guard_voice` markers (guard line 203: `\bgrug\b|\bclub\b|\brock\b|\bcave\b|...`).
**Apply to:** `frontend-ui.md` + `14-ui-design-to-build.md` — caveman in the `## Caveman prompt` fence + punchy body; **clear voice** on the WCAG 2.2 AA / accessibility / safety lines (Pitfall 3). `guard_voice` scans frontend-ui.md once it joins `ROLE_FILES`.

### Reference-not-restate / single-source
**Source:** `04-ticket-to-pr.md` line 28 (references 05); `05-pr-quality-gate.md` line 9 (declares itself the single source).
**Apply to:** `14-ui-design-to-build.md` — reference 04 (build) + 05 (gate) + optionally `accessibility-checklist.md` (a11y items) by filename; never inline their loops/items.

### Measure-then-set the ceiling (per-file byte ceiling)
**Source:** `role_ceiling()` comment block (guard lines 342-359).
**Apply to:** the `frontend-ui.md)` case (off authored size) AND the raised `orchestrator.md)` case (off post-wiring size). FAIL=+12%, WARN=+6%.

---

## No Analog Found

None. Every artifact this phase creates has an exact in-kit analog (all 5 files mapped above). The only genuinely new prose is the persona's design-authority judgment and the contract's design-tokens/component-inventory/five-states/visual-baseline fields — and even those follow the terse field style of `qe-handoff.md`.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | (no orphan files) |

---

## Metadata

**Analog search scope:** `agent-factory/roles/`, `agent-factory/workflows/`, `agent-factory/handoffs/`, `scripts/` (the entire kit substrate — grugops has no other code dirs).
**Files read this session (full or targeted):** `qe-e2e.md`, `04-ticket-to-pr.md`, `05-pr-quality-gate.md`, `qe-handoff.md`, `product-handoff.md`, `universal-handoff.md`, `orchestrator.md`, `check-foundation-guards.sh` (lines 175-204, 320-429), `check-foundation-guards.test.sh` (lines 50-94); `wc -c` measured on orchestrator/qe-e2e/software-engineer/system-analyst.
**Byte facts (verified `wc -c`):** orchestrator.md = 6661B (ceiling 7041/6664 → 3B to WARN, 380B to FAIL — MUST raise). qe-e2e.md = 3220B (band for the new role).
**Pattern extraction date:** 2026-06-11

## PATTERN MAPPING COMPLETE

**Phase:** 13 - Frontend/UI Persona & Design→Build Workflow
**Files classified:** 5
**Analogs found:** 5 / 5

### Coverage
- Files with exact analog: 3 NEW (frontend-ui.md → qe-e2e.md; workflow 14 → 04/05; frontend-handoff.md → qe/product/universal handoffs)
- Files with role-match analog: n/a
- Files edited in-place (self-analog): 2 (orchestrator.md; guard script + test harness)
- Files with no analog: 0

### Key Patterns Identified
- **Uniform 9-section role skeleton** — frontend-ui.md slots into qe-e2e.md's exact heading order; the `## Caveman prompt` fence needs ≥2 `^You` lines (guard_caveman_preserved); footer is always `Follow the 12 coding rules in `AGENTS.md`.`
- **Reference-not-restate** — workflow 14 names `04-ticket-to-pr.md` (build) and `05-pr-quality-gate.md` (gate) by filename using 04's verbatim "…live there — this workflow references that … and does not restate it" phrasing; never inlines them.
- **Coupled guard edits or RED build** — `ROLE_FILES` + `role_ceiling()` case + `GUARD_INPUTS` mirror are three separate hand-maintained lists; adding the role to one without the others FAILs. The orchestrator ceiling (3B/380B headroom) MUST be raised in the same plan as the UI-03 wiring.
- **Handoff template→instance + universal header** — frontend-handoff.md copies universal-handoff.md's header verbatim, mirrors qe-handoff's terse field style, and follows `<name>-handoff.md` → `<TICKET-ID>-frontend.md`.

### File Created
`.planning/phases/13-frontend-ui-persona-design-build-workflow/13-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. The planner can point each plan's action section at the exact analog file + line range + verbatim excerpt above. The two highest-risk mechanical traps (paired `ROLE_FILES`/`role_ceiling()` edits and the orchestrator ceiling raise) are flagged with current byte facts.
