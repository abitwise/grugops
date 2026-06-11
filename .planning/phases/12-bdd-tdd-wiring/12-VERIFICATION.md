---
phase: 12-bdd-tdd-wiring
verified: 2026-06-11T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
human_decision:
  resolved: 2026-06-11
  decision: "User chose to apply the advisory code-review fixes before completing the phase — the two human_needed items below were resolved by edit, not deferred."
  actions:
    - "WR-01/WR-02 resolved: 04-ticket-to-pr.md line 28 and example-mapping.md now both name the actual visible gate file (05-pr-quality-gate.md) and describe the enforcement as planned; the internal '§14' and 'Phase 15' references were dropped from shipped kit artifacts. Commit 1dc7bd1."
    - "WR-03 resolved: a disambiguating HTML comment added under '## Acceptance criteria (Given/When/Then)' in product-handoff.md (criteria = the terse bar; scenarios = the executable contract — do not duplicate). Commit 1dc7bd1."
  gates_after_fix: "foundation-guards, kit-refs, validator all exit 0 (GREEN) post-fix."
---

# Phase 12: BDD + TDD Wiring Verification Report

**Phase Goal:** Close the central business→engineer gap with a test-first contract — given-when-then acceptance scenarios produced by a Three Amigos step, driving a red-green TDD double-loop at the unit layer, both config-dialed and layered so no behavior is double-owned.
**Verified:** 2026-06-11
**Status:** passed (initial verdict was human_needed for 2 advisory code-review warnings; user elected to apply the fixes — commit 1dc7bd1 — so the items are resolved, not deferred)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Acceptance behavior is expressed as declarative G/W/T scenarios in product + QE handoffs, forming the business→engineer contract, executable-or-absent, no selectors | VERIFIED | `## Acceptance scenarios (Given/When/Then)` heading present in both handoffs with bdd dial comment (off/lean/strict, default lean), no-selectors rule, and skeleton scenario. Criteria line preserved alongside. No selector tokens in scenario steps. |
| 2 | A Three Amigos / Example Mapping step is folded into backlog refinement producing scenarios before code | VERIFIED | `agent-factory/checklists/example-mapping.md` exists (kind: checklist, tier: lean) with discovery-first rule, four-card structure, and the discount-code worked seam example. `07-backlog-refinement.md` contains a Step 3 dial-gated pointer to the hub. |
| 3 | The engineering workflow drives test-first red-green-refactor at the unit layer with the double-loop rule encoded; no behavior double-owned | VERIFIED | `04-ticket-to-pr.md` Step 3 carries the inner loop (failing test → minimal code → green → refactor), the double-loop rule ("NO SECOND acceptance scenario goes red"), and the contract-vs-logic seam pointer to `example-mapping.md`. `software-engineer.md` and `qe-e2e.md` carry terse hard-limit lines encoding inner/outer ownership. |
| 4 | BDD depth reads `bdd` (off/lean/strict) and TDD strictness reads `quality.tdd` (off/encouraged/required) from `.grugops/factory.config.json`, each degrading to lean/encouraged when absent | VERIFIED | `factory.config.json` has `"bdd": "lean"` and `"quality": { "tdd": "encouraged" }`. All affected artifacts (product-handoff, qe-handoff, example-mapping, workflow 07, workflow 04, implementation-handoff, qe-handoff) carry inline dial-read comments naming both keys with their tiers and explicit degrade-to-lean / degrade-to-encouraged defaults. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/handoffs/product-handoff.md` | Acceptance scenarios block + D-14 trace convention | VERIFIED | Heading `## Acceptance scenarios (Given/When/Then)` present; bdd dial comment (off/lean/strict, default lean); no-selectors rule; declarative G/W/T skeleton; D-14 trace note near `## Trace updates`; criteria line preserved |
| `agent-factory/handoffs/qe-handoff.md` | Mirror of scenarios block + acceptance red/green evidence | VERIFIED | Block heading byte-identical to product-handoff; `## Acceptance red/green evidence` field present near `## Result`; quality.tdd dial comment; UNKNOWN - verify no-fabrication floor |
| `agent-factory/checklists/example-mapping.md` | Three Amigos hub with seam worked example | VERIFIED | Exists, 49 lines, kind: checklist, tier: lean; discovery-first rule; three voices; four-card structure; discount-code OUTER/INNER worked seam example |
| `agent-factory/workflows/07-backlog-refinement.md` | Dial-gated Three Amigos step pointing to hub | VERIFIED | Step 3 reads bdd dial inline; points to `example-mapping.md`; INVEST step preserved; four-card ceremony not restated |
| `agent-factory/workflows/04-ticket-to-pr.md` | TDD red-green step + double-loop rule + D-13 forward-pointer | VERIFIED | Step 3 expanded with inner loop, double-loop rule, seam pointer; gate-05 reference preserved; D-13 HTML comment in Trace updates |
| `agent-factory/handoffs/implementation-ready-packet.md` | TDD test-strategy line under existing heading | VERIFIED | `## Test strategy` heading present (exactly one); HTML comment with inner/outer layer ownership and pointer to `example-mapping.md` |
| `agent-factory/handoffs/implementation-handoff.md` | Tiered test-first evidence field | VERIFIED | `## Test-first evidence` heading; quality.tdd dial comment (off/encouraged/required, default encouraged); UNKNOWN - verify floor in clear voice; Red/Green/Layer skeleton |
| `agent-factory/roles/software-engineer.md` | Terse inner-loop + seam pointer line | VERIFIED | Hard limits line: "You own the inner red-green loop: unit tests prove the logic beneath the acceptance scenario, never its observable outcome — see `example-mapping.md` for the seam." 3295 B < 3307 B FAIL ceiling |
| `agent-factory/roles/qe-e2e.md` | Terse outer-loop / acceptance-contract pointer line | VERIFIED | Hard limits line: "You own the outer acceptance loop: the handoff's `## Acceptance scenarios` block is the contract, red until the engineer's inner loop closes it — see workflow 04 for the double-loop." 3220 B < 3224 B FAIL ceiling |
| `AGENTS.md` | Minimal acceptance/BDD command slot under byte budget | VERIFIED | `### Acceptance` micro-slot with `Acceptance / BDD scenarios: UNKNOWN - verify`; runner names in HTML comment only; 6257 B well under budget |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `product-handoff.md` | `qe-handoff.md` | Byte-identical `## Acceptance scenarios` block | WIRED | `diff` shows identical heading line in both files |
| `07-backlog-refinement.md` | `example-mapping.md` | Single pointer line in Steps | WIRED | `grep -q 'example-mapping.md' 07-backlog-refinement.md` exits 0 |
| `04-ticket-to-pr.md` | `05-pr-quality-gate.md` | Gate reference in Step 4 | WIRED | `grep -q '05-pr-quality-gate.md' 04-ticket-to-pr.md` exits 0 |
| `04-ticket-to-pr.md` | `example-mapping.md` | Seam pointer in Step 3 | WIRED | `grep -q 'example-mapping.md' 04-ticket-to-pr.md` exits 0 |
| `software-engineer.md` | `example-mapping.md` | Pointer in Hard limits | PARTIAL | Bare filename `example-mapping.md` used (no `agent-factory/checklists/` prefix) — see IN-01 in code review. Resolution was deliberate byte-saving tradeoff under the 3307 B FAIL ceiling |
| `qe-e2e.md` | `04-ticket-to-pr.md` | Informal "workflow 04" label in Hard limits | PARTIAL | Informal label rather than full kit-relative path — same IN-01 issue. Both files are at WARN level, not FAIL |

### Data-Flow Trace (Level 4)

Not applicable. This is a markdown-only kit — no runtime data flows. All artifacts are static template/prompt files; "data" is prose content verified by content inspection above.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Foundation guards pass after all role/handoff edits | `sh scripts/check-foundation-guards.sh` | Exit 0, ALL CHECKS PASSED; two WARN for byte ceilings (not FAIL) | PASS |
| Acceptance scenarios block shape identical across both handoffs | `diff <(grep '^## Acceptance scenarios' product-handoff.md) <(grep '^## Acceptance scenarios' qe-handoff.md)` | No diff | PASS |
| All TDD tier words present in implementation-handoff | `grep -qi 'off\|encouraged\|required'` | All three found | PASS |
| No selector tokens in scenario step examples | `grep -nE '#[a-zA-Z]|\.[a-z-]+ |click |navigate to'` on handoffs + example-mapping | Clean (false positive in hub's own rule-statement, not in scenario steps) | PASS |
| No TBD/FIXME/XXX debt markers in any phase-modified file | `grep -nE 'TBD\|FIXME\|XXX'` on all 10 files | Clean | PASS |
| Role byte ceilings respected | `wc -c` on software-engineer.md (3295) and qe-e2e.md (3220) | Both under FAIL ceilings (3307 / 3224) | PASS |
| `bdd` and `quality.tdd` keys present in factory.config.json | `grep '"bdd"\|"tdd"' factory.config.json` | Both found with values "lean" / "encouraged" | PASS |

### Probe Execution

Not applicable. No probe scripts declared or conventional for this phase (markdown-only content changes, no migration/CLI tooling).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| BDD-01 | 12-01, 12-05 | Acceptance behavior as G/W/T contract in product + QE handoffs, executable-or-absent | SATISFIED | `## Acceptance scenarios` block present in both handoffs with no-selectors rule, bdd dial-read, and UNKNOWN - verify floor |
| BDD-02 | 12-02 | Three Amigos / Example Mapping folded into backlog refinement, scenarios before code | SATISFIED | `example-mapping.md` exists; workflow 07 Step 3 is dial-gated pointer to hub |
| BDD-03 | 12-02 | BDD depth config-dialed (off/lean/strict) | SATISFIED | bdd dial comment with three tiers and degrade-to-lean default in all relevant artifacts; `factory.config.json` has `"bdd": "lean"` |
| TDD-01 | 12-03, 12-05 | Engineering workflow drives test-first red-green-refactor, double-loop rule encoded | SATISFIED | workflow 04 Step 3 carries inner loop + double-loop rule + seam pointer; role files carry terse guardrail lines |
| TDD-02 | 12-04 | TDD strictness config-dialed (off/encouraged/required) | SATISFIED | `## Test-first evidence` field in implementation-handoff + acceptance red/green in qe-handoff, both with quality.tdd dial comment and degrade-to-encouraged default |

All 5 requirements claimed by the phase are SATISFIED. No orphaned requirements for this phase in REQUIREMENTS.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-factory/workflows/04-ticket-to-pr.md` | 28 | "§14 gate" used for future mechanical enforcement while the same term elsewhere in the file means the existing workflow-05 gate | WARNING (WR-01 + WR-02 from code review) | A reader following the §14 reference will not find the no-second-red / one-behavior-one-layer enforcement because it has not been built yet (Phase 15). The inconsistent naming with example-mapping.md's "Phase 15 gate" adds ambiguity. Does not block the phase goal — the rule itself is correctly stated; only the attribution is confusing. |
| `agent-factory/handoffs/product-handoff.md` | 34-35 | Two adjacent headings with identical `(Given/When/Then)` parenthetical, no disambiguating comment under `## Acceptance criteria` | WARNING (WR-03 from code review) | Risk of a practitioner pasting the same G/W/T content into both slots (duplication smell). The seam between "criteria = bar" and "scenarios = executable contract" is not surfaced at the point of use. |
| `agent-factory/roles/software-engineer.md` | 46 | Bare `example-mapping.md` filename (no `agent-factory/checklists/` kit-relative prefix) | INFO (IN-01 from code review) | Weaker resolvability per AGENTS.md's "STOP — do not hunt" invariant. Deliberate byte-saving tradeoff documented in 12-05-SUMMARY; file is unique in kit so resolution is still tractable. |
| `agent-factory/roles/qe-e2e.md` | 46 | Informal "workflow 04" label (no full path `agent-factory/workflows/04-ticket-to-pr.md`) | INFO (IN-01 from code review) | Same byte-ceiling tradeoff as above. |

No TBD/FIXME/XXX debt markers found in any phase-modified file.

The two WARNINGs (WR-01/WR-02, WR-03) were identified in the code review and are unresolved in the shipped artifacts. Neither blocks the phase goal — the correctness of the phase's deliverables is not in question. The WARNINGs are clarity/consistency defects that could confuse future practitioners or erode the single-source traceability value.

### Human Verification Required

#### 1. Disambiguating comment missing between adjacent acceptance headings (WR-03)

**Test:** Open `agent-factory/handoffs/product-handoff.md` and read lines 34-35 as a practitioner filling a handoff for the first time. Ask: would you know which heading gets the G/W/T prose (criteria = the bar) versus the runnable scenario block (scenarios = the executable contract)?
**Expected:** A clear seam at the point of use — ideally a one-line HTML comment under `## Acceptance criteria` like `<!-- the readiness bar: what "done" means; NOT the runnable scenario block below -->`. Without it, a user could paste the same content twice or find the template confusing.
**Why human:** This is a template UX judgment. Grep confirms the comment is absent; whether its absence materially harms usability requires a human to read the heading pair in context.

#### 2. Gate naming inconsistency WR-01 + WR-02 (§14 gate vs Phase 15 gate)

**Test:** Open `agent-factory/workflows/04-ticket-to-pr.md` line 28 and `agent-factory/checklists/example-mapping.md` line 47 side by side. One says "§14 gate's concern"; the other says "Phase 15 gate." Ask: would a practitioner consulting the kit know these refer to the same future enforcement mechanism?
**Expected:** Either both name the same thing (e.g., "Phase 15 test-integrity gate"), or the distinction is clear enough that a reader of workflow 04 is not misled into thinking the existing `05-pr-quality-gate.md` already enforces no-second-red / one-behavior-one-layer (it does not).
**Why human:** Whether the inconsistency is benign or misleading depends on how practitioners navigate the kit. The code review (WR-01/WR-02) documents the concern in detail. Fixing it is a two-word edit (`§14 gate` → `Phase 15 test-integrity gate` in workflow 04, line 28); the human needs to decide whether the fix is worth a new commit or acceptable as-is.

### Gaps Summary

No blocking gaps — all 4 observable truths are VERIFIED against the codebase. All 5 requirements (BDD-01 through TDD-02) are SATISFIED. Foundation guards pass (exit 0, two WARN at byte ceilings, both under FAIL).

Two unresolved code-review warnings (WR-01/WR-02 and WR-03) are clarity/consistency defects rather than correctness failures. The phase goal is achieved; these are polish items for the human to decide on:

1. **WR-01/WR-02 (§14 gate vs Phase 15 gate):** A two-character fix in workflow 04 line 28 would unify the two references. Recommend fixing before Phase 13 to prevent the naming drift compounding.
2. **WR-03 (adjacent acceptance headings):** A one-line HTML comment under `## Acceptance criteria` would close the disambiguation gap flagged in the code review.

Both fixes are additive one-liners; neither touches the phase's correctness.

---

_Verified: 2026-06-11_
_Verifier: Claude (gsd-verifier)_
