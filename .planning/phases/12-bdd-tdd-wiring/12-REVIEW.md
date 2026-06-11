---
phase: 12-bdd-tdd-wiring
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - AGENTS.md
  - agent-factory/checklists/example-mapping.md
  - agent-factory/handoffs/implementation-handoff.md
  - agent-factory/handoffs/implementation-ready-packet.md
  - agent-factory/handoffs/product-handoff.md
  - agent-factory/handoffs/qe-handoff.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/07-backlog-refinement.md
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase wires BDD acceptance scenarios and TDD red-green evidence into the
grugops kit: a new Example Mapping hub, dial-gated `## Acceptance scenarios` blocks
mirrored across the product and QE handoffs, test-first evidence fields in the
implementation and QE handoffs, a TDD double-loop step in workflow 04, a Three Amigos
step in workflow 07, terse pointer lines in the two engineering roles, and a runnable
acceptance command slot in AGENTS.md.

The work is solid against the kit's hardest constraints. I verified each independently:

- **No fabrication:** every new command/runner slot is `UNKNOWN - verify`; runner names
  (cucumber-js/behave/playwright-bdd) appear only as examples in comments, never as hard
  commands. The new red/green evidence fields carry an explicit no-fabrication floor.
- **Dial-gating:** every `bdd` dial comment degrades to lean and every `quality.tdd` dial
  degrades to encouraged when the key is absent — zero-config still runs.
- **No-selectors rule:** every Gherkin/scenario template and the worked discount-code
  example is declarative business language; no `#id`/`.class`/`click`/`navigate to`.
- **Voice discipline:** no caveman leakage onto safety/floor surfaces; the no-fabrication
  floor text is clear voice.
- **Single-source / byte ceilings:** the seam example lives only in example-mapping.md;
  role lines point rather than restate; `check-foundation-guards.sh` reports ALL CHECKS
  PASSED (role-size WARN only, build GREEN).
- The product↔QE `## Acceptance scenarios` block is byte-identical as designed.

The findings below are all consistency/clarity defects in the shipped artifacts — none
break a hard constraint, but two of them undercut the kit's single-source/traceability
value by naming one mechanism two different ways.

## Warnings

### WR-01: Same mechanical-enforcement gate named two different ways in two files shipped together

**File:** `agent-factory/workflows/04-ticket-to-pr.md:28` and `agent-factory/checklists/example-mapping.md:47`
**Issue:** Both changed files reference the future mechanical-enforcement gate that will
bite the BDD/TDD rules (no-second-red, one-behavior-one-layer, no-duplication), but they
name it inconsistently:

- workflow 04, line 28: "Mechanical no-second-red / one-behavior-one-layer enforcement is
  the **§14 gate's** concern, not this step."
- example-mapping.md, line 47: "(Mechanical no-duplication enforcement is the **Phase 15
  gate**; this hub lands the rule.)"

These two sentences land in the same phase and point a reader at the same future
mechanism, yet one calls it "§14 gate" and the other "Phase 15 gate." In a kit whose
entire value proposition is a single-source, traceable trail, two names for one concept
in two co-shipped files is exactly the drift the kit exists to prevent. A reader of the
kit (not the planning corpus) cannot tell whether "§14 gate" and "Phase 15 gate" are the
same thing or two different gates.
**Fix:** Make both references name the same thing. The planning intent (12-03-SUMMARY,
12-03-PLAN) is that mechanical enforcement lands in Phase 15. Align workflow 04 to the
hub's wording:
```markdown
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate
loop, the bounded self-fix, and the terminal result live there — this workflow
references that gate and does not restate it. Mechanical no-second-red /
one-behavior-one-layer enforcement is the Phase 15 test-integrity gate's concern, not
this step.
```

### WR-02: "§14 gate" in workflow 04 conflates the existing PR quality gate with the future enforcement gate

**File:** `agent-factory/workflows/04-ticket-to-pr.md:28`
**Issue:** The new clause attributes mechanical no-second-red / one-behavior-one-layer
enforcement to "the §14 gate." But Step 4 of this same workflow uses "§14 gate" to mean
the *existing* PR quality gate that ships today (`05-pr-quality-gate.md`) — see
12-PATTERNS.md:177 and 12-CONTEXT.md:118, which both equate "§14 gate" with workflow 05.
Workflow 05 as shipped does NOT enforce no-second-red or one-behavior-one-layer; per the
phase's own scope (12-VALIDATION.md:17, 12-RESEARCH.md:55) that enforcement is explicitly
deferred to Phase 15 and "do NOT build new enforcement guards here." So the sentence
assigns a not-yet-existing capability to the gate that ships now. A reader following the
reference to workflow 05 will not find the enforcement the sentence promises — a broken
expectation in the routing contract.
**Fix:** Distinguish the gate-that-routes-today (workflow 05 / the §14 gate) from the
mechanical-enforcement gate that lands later (Phase 15). Recommended same edit as WR-01:
attribute the mechanical no-second-red / one-behavior-one-layer enforcement to "the Phase
15 test-integrity gate," leaving the Step 4 reference to workflow 05 for the gate loop
unchanged. This also resolves WR-01.

### WR-03: Two adjacent near-identical headings in product-handoff with no point-of-use disambiguation

**File:** `agent-factory/handoffs/product-handoff.md:34-35`
**Issue:** The template now carries two consecutive headings that differ by a single word
and share an identical parenthetical:
```markdown
## Acceptance criteria (Given/When/Then)
## Acceptance scenarios (Given/When/Then)
```
The new `## Acceptance scenarios` heading gets a disambiguating dial comment, but
`## Acceptance criteria` (pre-existing) gets none, and nothing at the point of use draws
the seam between them. The planning corpus identified this exact seam — 12-PATTERNS.md:25:
"keep its `Given/When/Then` line ... confirm it does NOT merge with the new scenarios
block (criteria = the bar; scenarios = the contract)" — but that distinction never made
it into the shipped artifact. An agent or human filling this template sees two headings
with the same `(Given/When/Then)` tag and no guidance on what goes where, inviting either
duplication (the same G/W/T pasted twice) or confusion about which is authoritative. The
DoR (`definition-of-ready.md:14`) also tags acceptance criteria "(Given/When/Then)," so
the collision is kit-wide, not local.
**Fix:** Add a one-line disambiguating comment under `## Acceptance criteria` (the bar)
and/or `## Acceptance scenarios` (the runnable contract), e.g.:
```markdown
## Acceptance criteria (Given/When/Then)
<!-- the readiness bar: what "done" means, in G/W/T prose; NOT the runnable scenario block below -->
## Acceptance scenarios (Given/When/Then)
<!-- the executable contract (dial below); one scenario = one observable behavior, run by the host runner -->
```
Keep it terse; the goal is only to stop the two headings reading as a paste-twice
duplication.

## Info

### IN-01: Inconsistent pointer-path form for example-mapping.md / workflow 04 in role files

**File:** `agent-factory/roles/software-engineer.md:46` and `agent-factory/roles/qe-e2e.md:46`
**Issue:** The two new role pointer lines reference their targets with bare/informal
names rather than the kit-relative path form used everywhere else:

- software-engineer.md:46 — "see `example-mapping.md` for the seam" (bare filename, no
  `agent-factory/checklists/` prefix).
- qe-e2e.md:46 — "see workflow 04 for the double-loop" (informal label, no
  `agent-factory/workflows/04-ticket-to-pr.md` path).

Every other reference to these targets uses the full kit-relative path
(`agent-factory/checklists/example-mapping.md` in workflow 04, workflow 07, and
implementation-ready-packet.md). The AGENTS.md "Kit vs state" invariant (AGENTS.md:33-35)
is explicit that kit files resolve from the kit root and an agent must "STOP — do not
hunt" the repo for them; a bare `example-mapping.md` with no directory weakens that
resolvability. This is the *only* role that references a workflow by an informal
"workflow 04" label.

This is filed as Info, not Warning, because (a) the filename is unique within the kit so
resolution is still tractable, and (b) `check-foundation-guards.sh` shows both files
sitting just under the role-size FAIL ceiling (software-engineer.md 3295B, qe-e2e.md
3220B, both WARN), so the terse form was a deliberate byte-saving tradeoff documented in
12-05-SUMMARY. No action required if the byte ceiling forbids the longer form; if any
headroom exists, prefer the full path in software-engineer.md:46 for consistency with the
rest of the kit:
```markdown
You own the inner red-green loop: unit tests prove the logic beneath the acceptance
scenario, never its observable outcome — see `agent-factory/checklists/example-mapping.md`
for the seam.
```

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
