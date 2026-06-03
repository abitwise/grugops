---
phase: 03-roles-agents-md-substrate
verified: 2026-06-03T13:00:00Z
status: passed
score: 5/5
overrides_applied: 0
re_verification: false
---

# Phase 3: Roles & AGENTS.md Substrate — Verification Report

**Phase Goal:** Write all 16 role prompts to the fixed skeleton (Orchestrator first, defining the routing contract the others slot into) and the minimal AGENTS.md substrate that points at them, so the program and its read-order contract exist before any workflow sequences them.
**Verified:** 2026-06-03
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Orchestrator encodes full routing matrix, classification, WIP/DoR gates, XL-split, hard limit | VERIFIED | 13-arrow matrix in code block matches spec §5.A.1 verbatim; 15 classification tokens present; SPLIT_REQUIRED, definition-of-ready, WIP gate prose all confirmed; hard limit verbatim "Never merge to a protected branch. Never deploy to prod. Never exceed WIP without a written reason." |
| 2 | All 11 core role prompts exist with 9-section skeleton, caveman voice, reads config first, board moves, trace updates | VERIFIED | check-structure.sh: all 11 core roles PASS 9/9 sections; tier: core == 11; factory.config.json / plans/board.md / plans/traceability.md present in all roles; caveman prompts in fenced blocks |
| 3 | All 5 enterprise roles exist, activating on mode=enterprise or trigger, same skeleton and voice | VERIFIED | All 5 files present (compliance-officer, factory-coach, incident-responder, installer, release-manager); tier: enterprise == 5; each has `mode=enterprise` in Activates-when plus a specific trigger |
| 4 | Root AGENTS.md follows §17.1 shape, minimal/high-signal, under 32 KiB, real-command policy stated, all unknown slots marked UNKNOWN - verify | VERIFIED | All 9 §17.1 headings present; 5064 bytes < 32768; 13 UNKNOWN - verify slots; policy line "Real commands only, with flags, preferring fast single-file variants. If a command is unknown, ship UNKNOWN - verify"; no fabricated commands |
| 5 | AGENTS.md (and the Scribe role) embed Karpathy's 12 rules under 4 principles, clear voice, single-source | VERIFIED | All 16 key rule phrases and 4 principle headings verified verbatim against .planning/research/AGENTS-MD-BEST-PRACTICES.md; single-source confirmed (no non-Scribe role contains rule text); Scribe owns/maintains rules; check-structure.sh check [g] passes |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/roles/orchestrator.md` | Routing contract — 13-arrow matrix, 15 classifications, WIP/DoR gate, SPLIT_REQUIRED, 10-section Decision output, verbatim hard limit | VERIFIED | All 9 skeleton sections, verbatim caveman prompt (diff-clean vs spec L332-342), routing matrix matches spec §5.A.1 exactly, hard limits verbatim |
| `agent-factory/roles/agents-md-scribe.md` | Core role, 9-section skeleton, tier: core, owns 12 rules | VERIFIED | 9/9 sections, tier: core, owns 12 rules without inheriting pointer |
| `agent-factory/roles/brownfield-mapper.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/greenfield-mapper.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/ba-pm.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/system-analyst.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/architect-design.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/software-engineer.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/qe-e2e.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/security-nfr.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/uat-planner.md` | Core role, 9-section skeleton, tier: core | VERIFIED | 9/9 sections, tier: core |
| `agent-factory/roles/release-manager.md` | Enterprise role, tier: enterprise, mode=enterprise activation | VERIFIED | 9/9 sections, tier: enterprise, activates on mode=enterprise or release request |
| `agent-factory/roles/compliance-officer.md` | Enterprise role, tier: enterprise, mode=enterprise or compliance_regime activation | VERIFIED | 9/9 sections, tier: enterprise, activates on mode=enterprise or compliance_regime set or PII present |
| `agent-factory/roles/incident-responder.md` | Enterprise role, tier: enterprise, mode=enterprise or incident activation | VERIFIED | 9/9 sections, tier: enterprise, activates on mode=enterprise or production incident or failing SLO |
| `agent-factory/roles/factory-coach.md` | Enterprise role, tier: enterprise, mode=enterprise or end-of-sprint activation | VERIFIED | 9/9 sections, tier: enterprise, activates on mode=enterprise or end-of-sprint or on-demand |
| `agent-factory/roles/installer.md` | Enterprise role, tier: enterprise, mode=enterprise or install request activation | VERIFIED | 9/9 sections, tier: enterprise, activates on mode=enterprise or install/adapter request |
| `AGENTS.md` | §17.1 substrate, 9 headings, < 32 KiB, all UNKNOWN-verify commands, 12 rules verbatim | VERIFIED | All 9 §17.1 headings, 5064 bytes, 13 UNKNOWN-verify slots, verbatim 12 rules |
| `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` | Executable structural harness, encodes full VALIDATION.md suite | VERIFIED | Executable; covers checks a-g; runs ALL CHECKS PASSED |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `orchestrator.md` | `agent-factory/config/factory.config.json` | "Reads first" (D-17) | VERIFIED | Present in Reads section |
| `orchestrator.md` | `agent-factory/checklists/definition-of-ready.md` | WIP+DoR gate prose | VERIFIED | `definition-of-ready` cited in WIP gate section |
| `AGENTS.md` | `agent-factory/roles/orchestrator.md` | "All work starts with the Orchestrator" (How to work here) | VERIFIED | Present at line 9 |
| `AGENTS.md` | Karpathy 12 rules (verbatim) | Single-source in `## Coding rules (the 12)` | VERIFIED | All 4 principles + 12 rules verbatim; Scribe is the owner |
| All 15 non-Scribe roles | `AGENTS.md` | "Follow the 12 coding rules in AGENTS.md" pointer | VERIFIED | All 15 non-Scribe roles carry exactly one pointer line |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Structural harness reports all checks passed | `sh .planning/phases/03-roles-agents-md-substrate/check-structure.sh` | ALL CHECKS PASSED (exit 0) | PASS |
| Caveman prompt verbatim match to spec L332-342 | Python diff check | Zero differences | PASS |
| Routing matrix verbatim match to spec §5.A.1 | 13-row code block identical to spec | Zero differences | PASS |
| 12 Karpathy rules key phrases all present | 16 phrases checked | All 16 verified | PASS |
| AGENTS.md size under Codex cap | `wc -c < AGENTS.md` | 5064 < 32768 | PASS |
| No fabricated commands in AGENTS.md | Scan for npm/npx/node/yarn etc. | No real commands found | PASS |
| No debt markers in role files or AGENTS.md | TBD/FIXME/XXX/TODO scan | None found | PASS |
| Drift guard clean (no role cites plans/*-handoff) | check-structure.sh check [f] | PASS — no role cites plans/*-handoff | PASS |
| Single-source 12 rules (no non-Scribe restatement) | check-structure.sh check [g] | PASS | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| ROLE-01 | 03-02, 03-03, 03-04, 03-05 (via 03-01) | All 11 core role prompts exist with standard skeleton | SATISFIED | 11 files present, all 9/9 sections, tier: core == 11, caveman voice, D-17 universal lines |
| ROLE-02 | 03-06, 03-07 | All 5 enterprise-pack role prompts exist | SATISFIED | 5 files present, all 9/9 sections, tier: enterprise == 5, correct activation conditions. Note: REQUIREMENTS.md traceability table shows "In Progress" but this is a stale entry — the [x] checkbox and actual files confirm completion |
| ROLE-03 | 03-01 | Orchestrator encodes full routing matrix, WIP limits, DoR, XL-split, hard limit | SATISFIED | 13-arrow matrix, 15 classifications, SPLIT_REQUIRED, DoR gate, verbatim hard limit, 10-section Decision output |
| AGENTS-01 | 03-08 | §17.1 shape, minimal, < 32 KiB, UNKNOWN-verify commands | SATISFIED | All 9 §17.1 headings, 5064 bytes, 13 UNKNOWN-verify slots, no fabricated commands |
| AGENTS-02 | 03-08 | Karpathy's 12 rules under 4 principles, clear voice, single-source | SATISFIED | All rules verbatim, Scribe owns them, no non-Scribe restatement |

**Note on REQUIREMENTS.md inconsistency:** The traceability table at the bottom of REQUIREMENTS.md shows ROLE-02 as "In Progress (3/5 roles — release/compliance/incident done in 03-06; factory-coach/installer in 03-07)". This is a stale entry written after plan 06 that was never updated after plan 07 completed. The requirements section itself shows `[x] **ROLE-02**` (checked), and the actual deliverables confirm all 5 enterprise roles are present. No delivery gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER), no stub implementations, no fabricated commands, and no plans/\*-handoff drift detected across all 16 role files and AGENTS.md.

### Advisory Notes from Code Review (03-REVIEW.md)

The following items were flagged in the pre-existing code review (status: issues_found, non-blocking). They are noted here for awareness but do not block the phase goal:

**CR-01 (Critical in review, Advisory here):** The `Ready → In Analysis` board transition is not claimed by any role in its `## Board moves` section. The Orchestrator owns `Ready for Dev → In Development` but not the earlier pull from `Ready` into `In Analysis`. This is a board-flow ownership gap that will need to be resolved when the Phase 4 workflows sequence the roles. SC1 does not require the Orchestrator to own every board transition — it requires it to "enforce WIP limits and DoR before pulling work," which it does. The gap is real and the fix (assigning the pull to the Orchestrator) should be tracked.

**WR-01 (Warning):** `AGENTS.md` safety rule drops "named" from "never deploy to production without named human confirmation" (CLAUDE.md constraint). AGENTS.md faithfully reproduces the spec §17.1 verbatim which does not include "named." The tension is between CLAUDE.md's stricter project-level constraint and the spec §17.1 text. The Orchestrator hard limit also does not use "named" — it follows the spec L384-386 verbatim. This is an advisory tension, not a delivery gap.

**WR-05 (Warning):** The routing matrix omits explicit rows for `quality-gate`, `daily-sweep`, `sprint-planning`, `sprint-review`, and `refinement` (workflow-only classifications with no specialist role activated). The `install` case is handled correctly ("no numbered workflow — handled by the Installer directly"). The others are implied but not stated. Phase 4 workflows will make this explicit.

### Human Verification Required

None. All aspects of this phase — role file content, structure, verbatim fidelity, cross-references, and size constraints — are verifiable programmatically.

### Gaps Summary

No gaps. All 5 success criteria are verified against the actual codebase. The structural harness (`check-structure.sh`) runs ALL CHECKS PASSED. The three advisory issues from the code review are refinements for Phase 4, not Phase 3 delivery failures.

---

_Verified: 2026-06-03T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
