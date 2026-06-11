---
phase: 12
slug: bdd-tdd-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 12-RESEARCH.md § Validation Architecture. This is a **markdown-only** phase —
> the validation surface is mostly **structural greps** (block/rule/pointer present,
> dial-degrade-to-lean) plus **named prose-judgment** review (scenario quality, the worked
> seam). Mechanical *enforcement* of executable-or-absent / no-unjustified-skip /
> one-behavior-one-layer is **Phase 15** (do NOT build new enforcement guards here).
> Ship-GREEN + no-fabrication floor honored.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX-sh structural greps + the existing `scripts/check-foundation-guards.sh` (no external runner — npm deps Out of Scope) |
| **Config file** | none — scripts/greps are self-contained |
| **Quick run command** | `sh scripts/check-foundation-guards.sh` (role byte ceiling + voice after every role edit) |
| **Full suite command** | `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` (guards green + fail-proof) |
| **Estimated runtime** | ~2–5 seconds (read-only greps + hermetic mirror-and-mutate harness) |

---

## Sampling Rate

- **After every task commit:** Run `sh scripts/check-foundation-guards.sh` (must stay GREEN — especially `guard_role_size` after each role edit) + the one structural grep for that task's artifact.
- **After every plan wave:** Run `sh scripts/check-foundation-guards.sh && sh scripts/check-foundation-guards.test.sh` + the full set of structural greps below.
- **Before `/gsd-verify-work`:** All structural greps pass **AND** a human/spot prose-judgment review of (a) scenario declarativeness / no-selectors, (b) the worked seam example's clarity, (c) the example-mapping hub's terseness.
- **Max feedback latency:** ~5 seconds.

---

## Per-Task Verification Map

> Task IDs (`12-NN-T#`) assigned during planning. Each row maps a phase requirement to the
> structural grep / mechanical guard that proves the artifact landed. Rows are keyed by
> requirement until the planner assigns Plan/Wave; "Wave 0" = the edit that lands the artifact.

| Req ID | Behavior | Test Type | Automated Command (structural) | File Exists | Status |
|--------|----------|-----------|--------------------------------|-------------|--------|
| BDD-01 | `## Acceptance scenarios (Given/When/Then)` block present in product-handoff | structural grep | `grep -q '^## Acceptance scenarios (Given/When/Then)' agent-factory/handoffs/product-handoff.md` | ❌ W0 | ⬜ pending |
| BDD-01 | `## Acceptance scenarios` block present in qe-handoff | structural grep | `grep -q '^## Acceptance scenarios' agent-factory/handoffs/qe-handoff.md` | ❌ W0 | ⬜ pending |
| BDD-01 | No-selectors rule line present in the scenario template | structural grep | `grep -qi 'no .*selectors\|business language' agent-factory/handoffs/product-handoff.md` | ❌ W0 | ⬜ pending |
| BDD-01 | Existing `## Acceptance criteria` line preserved (criteria ≠ scenarios) | structural grep | `grep -q '^## Acceptance criteria (Given/When/Then)' agent-factory/handoffs/product-handoff.md` | ✅ today | ⬜ pending |
| BDD-02 | `example-mapping.md` hub exists (NEW file) | structural test | `test -f agent-factory/checklists/example-mapping.md` | ❌ W0 | ⬜ pending |
| BDD-02 | Workflow 07 points to the hub | structural grep | `grep -q 'example-mapping.md' agent-factory/workflows/07-backlog-refinement.md` | ❌ W0 | ⬜ pending |
| BDD-02 | Example-Mapping-before-Gherkin rule line present | structural grep + manual | `grep -qi 'after\|first' agent-factory/checklists/example-mapping.md` (confirm intent) | ❌ W0 | ⬜ pending |
| BDD-03 | `bdd` dial read present (degrade-to-lean) in the new content | structural grep | `grep -q 'bdd' agent-factory/checklists/example-mapping.md` + handoff/workflow comments | ❌ W0 | ⬜ pending |
| TDD-01 | TDD red-green step present in workflow 04 | structural grep | `grep -qi 'red.*green\|failing.*test.*first' agent-factory/workflows/04-ticket-to-pr.md` | ❌ W0 | ⬜ pending |
| TDD-01 | Double-loop / no-second-red rule present | structural grep | `grep -qi 'no second\|outer\|inner' agent-factory/workflows/04-ticket-to-pr.md` | ❌ W0 | ⬜ pending |
| TDD-01 | Contract-vs-logic seam rule line present (one-behavior-one-layer) | structural grep | `grep -qi 'seam\|one .*layer\|observable' agent-factory/roles/software-engineer.md` | ❌ W0 | ⬜ pending |
| TDD-01 | Worked seam example present (hub or workflow, NOT a role file) | structural grep | `grep -qi 'seam\|observable' agent-factory/checklists/example-mapping.md` (or wf04) | ❌ W0 | ⬜ pending |
| TDD-02 | Test-first / red-green evidence field present in implementation-handoff | structural grep | `grep -qi 'test-first\|red.*green' agent-factory/handoffs/implementation-handoff.md` | ❌ W0 | ⬜ pending |
| TDD-02 | `quality.tdd` dial read present (degrade-to-encouraged) | structural grep | `grep -qi 'tdd' agent-factory/handoffs/implementation-handoff.md` (comment) | ❌ W0 | ⬜ pending |
| TDD-02 | No-fabrication floor (`UNKNOWN - verify`) in the evidence field | structural grep | `grep -q 'UNKNOWN - verify' agent-factory/handoffs/implementation-handoff.md` | ⚠ confirm in new field | ⬜ pending |
| D-11 | TDD test-strategy content in impl-ready packet (extend existing `## Test strategy`) | structural grep | `grep -qi 'unit\|layer\|red.*green' agent-factory/handoffs/implementation-ready-packet.md` | ❌ W0 (heading exists) | ⬜ pending |
| D-12 | AGENTS.md acceptance command slot present, under byte budget | structural grep + guard | `grep -qi 'acceptance\|bdd' AGENTS.md && sh scripts/check-foundation-guards.sh` (`guard_agents_bytes`) | ❌ W0 | ⬜ pending |
| cross | Role byte ceiling stays GREEN after software-engineer.md / qe-e2e.md edits | mechanical guard | `sh scripts/check-foundation-guards.sh` (`guard_role_size`, `guard_voice`, `guard_caveman_preserved`) | ✅ harness exists | ⬜ pending |
| cross | Adapters untouched / pointer-sized (single-source held) | mechanical guard | `sh scripts/check-foundation-guards.sh` (`guard_adapter_size`) | ✅ free | ✅ passes for free |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **No NEW test framework** — POSIX sh + the existing `check-foundation-guards.sh` cover the mechanical surface; the rest is ad-hoc structural greps + prose review.
- [ ] `agent-factory/checklists/example-mapping.md` — NEW file (BDD-02); its existence is the test.
- [ ] The structural greps above are per-task one-liners the executor runs — they do **NOT** need a new harness and must **NOT** become a Phase-15 enforcement guard.
- [ ] **Confirm `guard_role_size` headroom BEFORE writing role lines** — `software-engineer.md` ~2 B below WARN, `qe-e2e.md` ~17 B below WARN (measured live 2026-06-11). Plan role edits as single terse pointer lines; the worked seam example lives in the hub/workflow, never in a role file.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scenario quality / declarativeness (no CSS/HTML/selectors; business language) | BDD-01 | No grep can score whether a scenario reads declaratively | Spot-review the new `## Acceptance scenarios` blocks: business behavior only, UI detail behind step definitions |
| The worked contract-vs-logic seam example is clear and followable | TDD-01 | Clarity of a teaching example is judgment, not grep-able | Read the seam example in the hub/workflow: one observable behavior + the units beneath it; the unit layer never re-asserts the observable outcome |
| The example-mapping hub captures discovery-first intent + stays terse | BDD-02 | Terseness + "Example Mapping before Gherkin" intent are judgment | Read `example-mapping.md`: rules/examples/questions structure, three voices, G/W/T written after the workshop; hub-sized like `definition-of-ready.md`, not a wall of text |
| The double-loop / no-second-red rule reads correctly | TDD-01 | Whether the rule communicates the constraint is judgment | Read workflow 04 step: outer acceptance stays red until inner loop closes it; no second acceptance scenario goes red before the first is green |
| No-fabrication floor preserved in clear professional voice | TDD-02 | Two-voice discipline at the trust moment | Confirm the `UNKNOWN - verify` floor + any safety line in the evidence field are clear voice, not caveman |

---

## Validation Sign-Off

- [ ] All mechanical rows map to a `check-foundation-guards.sh` command or a one-line structural grep
- [ ] Sampling continuity: guard run after every task commit; harness + full grep set after every wave
- [ ] Wave 0 covers the NEW `example-mapping.md` file + the role byte-ceiling headroom check
- [ ] No watch-mode flags (scripts/greps are one-shot read-only)
- [ ] Feedback latency < 5s
- [ ] Structural greps pass AND prose-judgment spot review completed before verify
- [ ] No new mechanical enforcement guard authored (executable-or-absent / no-skip / one-layer enforcement is Phase 15)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
