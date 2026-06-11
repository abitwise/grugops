# Phase 12: BDD + TDD Wiring - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 11 (10 modified, 1 new) + 1 verify-only
**Analogs found:** 11 / 11 (every touch file has an in-kit analog)

> grugops ships **no runtime**. Every "file" here is a markdown artifact: a handoff template, a workflow, a role prompt, a checklist hub, AGENTS.md, or the config-dial doc. All excerpts below are **markdown structure** (headings, terse field rows, dial-read parentheticals, pointer lines, the two-voice `## Caveman prompt` block) — never functions or classes. The planner copies the *shape*, not prose volume. The single hardest constraint is the role-file byte ceiling (see Shared Patterns → Byte ceiling).

## File Classification

| Touch file | Artifact role | Action | Closest analog | Match quality |
|------------|---------------|--------|----------------|---------------|
| `agent-factory/checklists/example-mapping.md` | checklist-hub | **NEW** | `agent-factory/checklists/definition-of-ready.md` | exact (same hub type) |
| `agent-factory/handoffs/product-handoff.md` | handoff template | edit-in-place | self (`## Acceptance criteria` line 30 + `## Test notes` line 33) | exact |
| `agent-factory/handoffs/qe-handoff.md` | handoff template | edit-in-place | `product-handoff.md` (scenarios block) + self (`## Result` line 35) | exact |
| `agent-factory/handoffs/implementation-handoff.md` | handoff template | edit-in-place | self (`## Tests added` / `## Commands run` lines 31-32) | exact |
| `agent-factory/handoffs/implementation-ready-packet.md` | handoff template | edit-in-place | self (`## Test strategy` line 39 already exists) | exact |
| `agent-factory/workflows/07-backlog-refinement.md` | workflow | edit-in-place | self (Step 2/4 + the DoR pointer lines 21/29) | exact |
| `agent-factory/workflows/04-ticket-to-pr.md` | workflow | edit-in-place | self (Step 3-4 + the gate-05 reference Step 4) | exact |
| `agent-factory/roles/software-engineer.md` | role-prompt | edit-in-place | self (`## Responsibilities` + `## Hard limits`) | exact — **byte ceiling ~2 B** |
| `agent-factory/roles/qe-e2e.md` | role-prompt | edit-in-place | self + `software-engineer.md` (mirror structure) | exact — **byte ceiling ~17 B** |
| `AGENTS.md` | AGENTS.md (command set) | edit-in-place | self (`### Test` / `### E2E` command slots lines 49-72) | exact |
| `agent-factory/config/factory.config.md` | config-read (dial convention) | **read-only** (source of dial pattern) | `qe-e2e.md` line 20 + workflow 05 step 3 | exact |

**Verify-only (no edit):** `agent-factory/checklists/definition-of-ready.md` — keep its `Given/When/Then` line (DoR D-09); confirm it does NOT merge with the new scenarios block (criteria = the bar; scenarios = the contract).

**Measured byte sizes (2026-06-11, `wc -c`):** `software-engineer.md` 3128 B · `qe-e2e.md` 3034 B · `ba-pm.md` 3291 B (DO NOT TOUCH — ~3 B below FAIL) · `definition-of-ready.md` 857 B · `AGENTS.md` 6051 B.

---

## Pattern Assignments

### `agent-factory/checklists/example-mapping.md` (checklist-hub, NEW)

**Analog:** `agent-factory/checklists/definition-of-ready.md` — the single-source terse hub (857 B) that `ba-pm.md` and workflow 07 both *point to*. Copy this exact shape: YAML frontmatter, one `#` title, a one-line "what/when this applies" lead, then a flat bullet list. NOT a wall of text.

**Frontmatter + lead pattern** (`definition-of-ready.md` lines 1-9):
```markdown
---
kind: checklist
tier: lean
---
# Definition of Ready

A ticket is ready to start when every check below holds. The Orchestrator applies this
checklist before handing a ticket to engineering; `ticket-ready-packet.md` carries one
field per check so the two stay aligned.
```

**Terse-bullet body pattern** (`definition-of-ready.md` lines 11-20) — every item one line, no sub-prose:
```markdown
- problem clear — the user, the pain, and the value are stated, not assumed
- scope and out-of-scope clear
- story is INVEST-shaped — independent, negotiable, valuable, estimable, small, testable
- acceptance criteria clear (Given/When/Then), testable and measurable — a number, a state, or an observable outcome, never "works"/"looks right"
```

**What to fill in (from RESEARCH Code Examples + D-04/05/06):** keep it ~DoR-sized; a dial-read HTML comment line (`<!-- bdd dial: off = skip · lean = BA self-runs all three voices · strict = named participants. -->`), the discovery-first rule line, the three-voices line, the four-card bullet list (story/rule/example/question), a "Done when" line, AND the contract-vs-logic seam worked example (D-09) lives HERE or in workflow 04 — never in a role file (byte ceiling). All example scenarios must be **declarative business language, no selectors** (Pitfall 3).

---

### `agent-factory/handoffs/product-handoff.md` (handoff template, edit-in-place)

**Analog:** itself — the template is a list of empty `## Heading` slots (no inline data; "empty-but-shaped"). The new `## Acceptance scenarios (Given/When/Then)` block rides *alongside* the existing fields, inserted after the criteria line.

**Existing field-slot pattern** (lines 27-34) — bare headings, the `(Given/When/Then)` parenthetical already in use:
```markdown
## User value
## Scope
## Out of scope
## Acceptance criteria (Given/When/Then)
## Dependencies
## Risks
## Test notes
## Security/NFR triggers
```

**Insert convention:** new block goes **after line 30** (`## Acceptance criteria (Given/When/Then)` STAYS as the terse DoR-style bar; scenarios = the executable contract, D-02). Use the tiered shape from RESEARCH (a dial-read HTML comment `<!-- bdd dial: off = omit · lean = inline declarative G/W/T · strict = link selector-free scenario files ... Declarative business language only — NO selectors. Executable-or-absent. -->` + a `Scenario:/Given/When/Then` skeleton). Match the template register: shaped, empty, no fake data.

---

### `agent-factory/handoffs/qe-handoff.md` (handoff template, edit-in-place)

**Analog:** `product-handoff.md` for the scenarios block (mirror it 1:1); itself for the evidence slot. qe-handoff has NO scenario block today.

**Existing slot pattern** (lines 27-36) — the second-half template headings the new blocks slot among:
```markdown
## Test scope
## Unit/integration/E2E coverage
## Manual test cases
## Regression risks
## Test data
## Commands run
## Flaky risk
## Coverage vs threshold
## Result
## Gaps
```

**Insert convention:** add the same `## Acceptance scenarios (Given/When/Then)` block (mirror product-handoff, D-02) near `## Unit/integration/E2E coverage` (line 28); add the **acceptance-side** red/green evidence (D-10) near `## Result` (line 35). QE owns the outer loop (D-07), so the acceptance red/green lives here, not in implementation-handoff.

---

### `agent-factory/handoffs/implementation-handoff.md` (handoff template, edit-in-place)

**Analog:** itself — the existing evidence section. Do NOT invent a new artifact; **extend** the `## Tests added` / `## Commands run` pair (D-10, "extend, don't invent").

**Existing evidence-slot pattern** (lines 27-36):
```markdown
## Ticket
## Branch
## Files changed
## Behavior changed
## Tests added
## Commands run
## Migration notes
## Docs updated
## Risks
## Remaining work
```

**Insert convention:** add the tiered **test-first / red-green evidence** field near `## Tests added` (line 31). Use the RESEARCH shape — a `quality.tdd` dial comment (`off = omit · encouraged = honest "tests written" · required = red→green`) + a **no-fabrication floor** comment in clear voice (`if a step was not run, write UNKNOWN - verify; NEVER record a red/green that did not happen`) + `Red:` / `Green:` / `Layer:` lines. The floor line is clear voice (safety), not caveman.

---

### `agent-factory/handoffs/implementation-ready-packet.md` (handoff template, edit-in-place)

**Analog:** itself — **`## Test strategy` already exists at line 39.** No new heading. Extend it with the terse TDD line (D-11).

**Existing heading + the established reference-comment pattern** (lines 27-40) — note the `<!-- reference ... -->` pointer-comment convention already used in this file:
```markdown
<!--
  The engineer's start bundle. Pulls together what an engineer needs before the first diff.
  Clear voice; empty-but-shaped; no fake data.
-->

## Ticket ID
## Branch target
## Relevant ADRs
<!-- reference memory-bank/50-decisions/ -->
## API/data contracts and system context
<!-- reference architecture-handoff.md and system-handoff.md -->
## Files likely touched
## Test strategy
## Commands to run
```

**Insert convention:** under the existing `## Test strategy` heading, add ONE terse line (which unit tests prove the behavior, which layer owns what — feeds the inner loop + the D-09 seam). Reuse the file's `<!-- reference ... -->` comment style if a pointer is wanted. Clear voice, empty-but-shaped.

---

### `agent-factory/workflows/07-backlog-refinement.md` (workflow, edit-in-place)

**Analog:** itself — the numbered `## Steps` list + the single-line pointer-to-hub convention (it already points to `definition-of-ready.md` twice, lines 21 and 29). The Three Amigos step is a **dial-gated pointer**, not an inlined ceremony.

**Existing pointer-to-hub convention** (lines 21 + 29) — reference-not-embed; name the hub path, do not restate it:
```markdown
- `agent-factory/checklists/definition-of-ready.md` — the bar each item must meet before it can be promoted.
```
```markdown
6. Promote items that meet `agent-factory/checklists/definition-of-ready.md` into the `Ready` column; record the refinement by filling the `refinement-notes.md` template ...
```

**Existing numbered-step pattern** (lines 24-29) — the insertion point is between Step 2 (clarify to INVEST) and Step 4 (size):
```markdown
2. Clarify each item to INVEST shape — user value, scope, and acceptance criteria that are testable and measurable ...; pull in the System Analyst when behavior is unclear ...
3. Split `XL` work into smaller tickets ...
4. Size each item (`XS`–`XL`) and prioritize it (`P0`–`P3`) ...
```

**Insert convention:** add ONE new dial-gated step after "clarify to INVEST" (per RESEARCH Open Question 2: discovery after INVEST-shape, before sizing) that **points to** `example-mapping.md` and reads the `bdd` dial inline (see Shared Patterns → Dial-read). Single pointer line — never restate the four-card ceremony here. The Phase-11 senior-BA INVEST step stays untouched.

---

### `agent-factory/workflows/04-ticket-to-pr.md` (workflow, edit-in-place)

**Analog:** itself — the numbered `## Steps` list + the **reference-not-restate** convention it already uses for the §14 gate (Step 4 points to workflow 05 and explicitly says it "does not restate it").

**Existing reference-not-restate convention** (line 28) — THE pattern to copy for the TDD step's relationship to the gate:
```markdown
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there — this workflow references that gate and does not restate it.
```

**Existing engineer-implements step** (line 27) — the TDD red-green step slots into / around this:
```markdown
3. The Software Engineer implements the one ticket on a branch — a small diff, with tests.
```

**Insert convention:** add the TDD red-green + double-loop rule (D-08) into/around Step 3 (per RESEARCH): write failing unit test → minimal code → green → refactor; the outer acceptance scenario stays red until the inner loop closes it; **no second acceptance scenario goes red before the first is green**. The contract-vs-logic seam worked example (D-09) may live here OR in `example-mapping.md` — NOT in a role file. Enforcement stays in gate 05 (Phase 15) — reference, do not restate.

---

### `agent-factory/roles/software-engineer.md` (role-prompt, edit-in-place) — **BYTE CEILING ~2 B**

**Analog:** itself. The new lines are SINGLE terse lines added to `## Responsibilities` and/or `## Hard limits` that **point to** workflow 04 / `example-mapping.md` — they do NOT restate the loop. CRITICAL: 3128 B, WARN 3130 / FAIL 3307 → ~2 B headroom before WARN, ~179 B before FAIL. A sentence trips WARN; a paragraph trips FAIL.

**Two-voice block to preserve** (lines 10-17) — the `## Caveman prompt` fenced block; `guard_caveman_preserved` needs ≥2 `^You` lines or a grug idiom; do NOT flatten it, do NOT add caveman markers outside it:
```markdown
## Caveman prompt
```
You are Software Engineer.
You implement one ticket.
You read the handoff first.
You make a small diff. You add tests. You run checks. You update docs.
You stop if scope grows or architecture must change.
```
```

**Existing terse responsibility-line style** (line 30) — the model for a sharp, pointer-shaped inner-loop line:
```markdown
2. Add tests for the behavior changed, run the checks, update the docs it touches — the test skipped now is the regression someone debugs later.
```

**Existing clear-voice no-fabrication line** (line 46) — the register the red/green honesty line must match (clear voice, not caveman):
```markdown
Report test results exactly as they ran — passes, failures, and skips. Never fake a test result, a passing check, or a command output; a green that was never run is the most expensive lie in the trace. Mark anything unverified `UNKNOWN - verify`.
```

**Insert convention:** add the FEWEST, sharpest words — one inner-loop ownership + red-green pointer line (caveman-OK in body) and/or one seam hard-limit line that POINTS to workflow 04 / the hub. The worked seam example does NOT live here (no headroom). After editing, run `sh scripts/check-foundation-guards.sh` and confirm GREEN (WARN does not fail the build; FAIL does). If a needed line trips FAIL, move detail to the workflow and leave a pointer.

---

### `agent-factory/roles/qe-e2e.md` (role-prompt, edit-in-place) — **BYTE CEILING ~17 B**

**Analog:** `software-engineer.md` (mirror its structure) + itself. 3034 B, WARN 3051 / FAIL 3224 → ~17 B before WARN, ~190 B before FAIL. Slightly more room than software-engineer but still single-line-only.

**Existing dial-read line to MIRROR** (line 20) — this is also the canonical **dial-read parenthetical** convention (see Shared Patterns):
```markdown
- `.grugops/factory.config.json` **first** — `mode` / `cadence` / `autonomy` / `wip_limits` / `quality` / `nfr` / `compliance_regime`. In enterprise mode, enforce the coverage thresholds from `quality`.
```

**Existing terse hard-limit + no-fabrication line** (line 44) — the register for the new outer-loop / acceptance-contract line:
```markdown
Test behavior, do not change it: no production-code fixes, no hidden scope. Prefer stable selectors and report the gaps you cannot cover. Report results exactly as they ran ...; mark anything unverified `UNKNOWN - verify`.
```

**Insert convention:** add ONE terse outer-loop ownership / acceptance-contract line (D-07/08) — QE owns the outer acceptance loop; points to workflow 04 / the QE handoff scenarios block. Keep the `## Caveman prompt` block (lines 10-17) intact. Run the foundation guards after editing.

---

### `AGENTS.md` (command set, edit-in-place)

**Analog:** itself — the `### `-subheading command slots under `## Commands`, each a `- Label: \`UNKNOWN - verify\`` bullet. The new acceptance/BDD slot is ONE line in this exact shape. 6051 B, WARN 20480 — ample budget, but stay one line (single-source; runner NAMES go in the workflow, not here, D-12).

**Existing command-slot pattern** (lines 49-72) — the `UNKNOWN - verify` placeholder + the no-fabrication rule that governs it:
```markdown
### Test

- Test (all): `UNKNOWN - verify`
- Test (single file): `UNKNOWN - verify`
```
```markdown
### E2E

- E2E: `UNKNOWN - verify`
```

**Existing governing rule** (line 39) — the convention the new slot inherits:
```markdown
Real commands only, with flags, preferring fast single-file variants. If a command is unknown, ship `UNKNOWN - verify` — never fabricate. Do not enforce here what a linter or CI already enforces.
```

**Insert convention:** add either a new `### Acceptance` micro-slot or one extra bullet under `### Test` (RESEARCH Open Question 1 — planner picks; both trivially under budget). Value is `UNKNOWN - verify`; host runner names (cucumber-js / behave / bddgen && playwright test) go ONLY in a trailing HTML comment or the workflow — never as a hard command here (D-12, avoids per-stack bloat). Do NOT touch the 5 per-tool adapters.

---

## Shared Patterns

### Dial-read with degrade-to-lean (the zero-config convention)
**Source:** `agent-factory/roles/qe-e2e.md` line 20 + `agent-factory/workflows/05-pr-quality-gate.md` step 3 + `agent-factory/config/factory.config.md` "Zero-config defaults" (lines 101-111).
**Apply to:** every new BDD/TDD behavior — `bdd` absent → `lean`; `quality.tdd` absent → `encouraged`.

The kit's convention is a **short inline parenthetical** that names the key and its tiers, NOT a code block or a separate config-reading section. Two concrete forms in use:

Role/workflow inline form (qe-e2e.md line 20):
```markdown
- `.grugops/factory.config.json` **first** — `... quality ...`. In enterprise mode, enforce the coverage thresholds from `quality`.
```
Workflow inline-with-default form (workflow 05 step 3 — names the key AND its literal default):
```markdown
`coverage_threshold` (`0.8`) is the coverage floor; `ui_e2e` (`"ui-or-critical-path"`) decides when e2e runs.
```
The degrade-to-lean guarantee is stated ONCE in the config doc (do not re-prove it per file):
```markdown
... every one of the eight keys ... degrades to its documented lean default when the key — or the whole file — is absent. A missing key is never an error; it is read as its lean default.
```
**For the planner:** new dial reads use the inline-parenthetical-naming-the-default form (`bdd` off/lean/strict, lean default; `quality.tdd` off/encouraged/required, encouraged default). In handoffs/hub, encode the tiers as an HTML comment beside the block (RESEARCH Code Examples). NEVER add a new key or re-shape the frozen Phase-10 keys.

### No-fabrication floor (clear voice)
**Source:** `software-engineer.md` line 46 · `qe-e2e.md` line 44 · `AGENTS.md` line 39.
**Apply to:** the test-first evidence field (D-10) and the executable-or-absent rule (D-01).
The convention: a clear-voice sentence ending in the literal token `UNKNOWN - verify`. This is a **safety line — clear voice, never caveman** (two-voice discipline). Never record a red/green that did not run.

### Two-voice + the `## Caveman prompt` block
**Source:** `software-engineer.md` lines 10-17 · `qe-e2e.md` lines 10-17.
**Apply to:** both role edits.
Grug caveman lives INSIDE the fenced `## Caveman prompt` block (keep ≥2 `^You` lines / a grug idiom — `guard_caveman_preserved`) and in the punchy body; clear professional voice in every safety/no-fabrication line. Do NOT leak a caveman marker (`grug`, `smash`, `shiny`, `me think`) into a clear-voice line — `guard_voice` greps for it and fails red.

### Byte ceiling (the hard constraint that shapes every role edit)
**Source:** RESEARCH Pitfall 1 + measured `wc -c`.
**Apply to:** `software-engineer.md` (~2 B headroom) and `qe-e2e.md` (~17 B headroom).
Add the fewest, sharpest words; prefer a single pointer line over restating the loop. The worked seam example and the four-card ceremony live in the hub/workflow, NEVER in a role. After every role edit: `sh scripts/check-foundation-guards.sh` → GREEN (WARN tolerable, FAIL = build red). **`ba-pm.md` is NOT a touch target** (~3 B below FAIL — RESEARCH A2); leave it untouched.

### Reference-not-embed / single-source
**Source:** workflow 04 step 4 (gate ref) + workflow 07 lines 21/29 (DoR pointer) + `implementation-ready-packet.md` `<!-- reference ... -->` comments.
**Apply to:** every workflow/role/AGENTS.md edit.
Depth lands ONCE under `agent-factory/`; workflows and roles POINT to it. Host runner names live only in the workflow/checklist. The 5 per-tool adapters are NEVER touched (they are pointer-sized; `guard_adapter_size` fails on bloat).

### Empty-but-shaped handoff template register
**Source:** all four handoff templates (bare `## Heading` slots, no inline data) + `implementation-ready-packet.md` lines 27-30 ("empty-but-shaped; no fake data").
**Apply to:** all four handoff edits.
New blocks are headings + an optional dial-read/floor HTML comment + a skeleton (`Scenario:/Given/When/Then`, `Red:/Green:/Layer:`) — never pre-filled with sample data.

---

## No Analog Found

None. Every Phase 12 touch file has a direct in-kit analog (most are edits to themselves; the one NEW file mirrors `definition-of-ready.md`). The planner should prefer these real analogs over RESEARCH's generic Code Examples for *structure* — but RESEARCH's Code Examples remain the authoritative source for the *content* of the new blocks (tier comments, the seam worked example, the four-card hub body), since that content is genuinely new.

## Metadata

**Analog search scope:** `agent-factory/checklists/`, `agent-factory/handoffs/`, `agent-factory/workflows/`, `agent-factory/roles/`, `agent-factory/config/`, `AGENTS.md`.
**Files scanned:** 11 touch files read in full + 2 reference workflows (05, 06) + the config-dial doc + byte-ceiling measurement (`wc -c`).
**Pattern extraction date:** 2026-06-11
