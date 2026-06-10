---
phase: 11-senior-persona-overhaul
plan: 02
subsystem: role-prompts
tags: [persona, voice, token-economy, in-place-rewrite, safety-surfaces]
requires:
  - "Phase 10 foundation guards (guard_voice scan set incl. security-nfr) shipped GREEN"
  - "Plan 11-01 (first 7 roles rewritten; the +6%-ceiling = flat-or-smaller reading established)"
provides:
  - "8 of 16 role prompts rewritten to senior judgment in place (PERS-01, group I–Z): installer, orchestrator, qe-e2e, release-manager, security-nfr, software-engineer, system-analyst, uat-planner"
  - "orchestrator size outlier preserved (banner, Routing matrix, WIP/DoR gate, XL-split, workflow-mapping table, /grug, clear-voice safety) — not normalized away"
  - "all clear-voice safety surfaces intact (installer additive/never-overwrite/dry-run, software-engineer no-fake-results, release-manager named-human deploy gate SAFE-01, security-nfr PASS|PASS_WITH_RISKS|BLOCKED + clear findings)"
affects:
  - "Plan 11-03 (ba-pm senior BA deepening — completes the 16-role substrate), Plan 11-04 (guard_role_size + guard_caveman_preserved + guard_voice expansion to all 16)"
tech-stack:
  added: []
  patterns:
    - "in-place senior rewrite within the fixed 9-section role skeleton — no new section (D-01)"
    - "seniority encoded as compression (sharper judgment per token), files flat-or-smaller within +6% ceiling (D-04)"
    - "two-voice discipline — grug in Caveman prompt + punchy body, clear voice on safety/security lines"
    - "orchestrator outlier structure preserved verbatim (D-03) — the legitimate size outlier is not normalized"
key-files:
  created:
    - .planning/phases/11-senior-persona-overhaul/11-02-SUMMARY.md
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/roles/installer.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/security-nfr.md
decisions:
  - "Persona depth lands as a sharp clause woven into an existing skeleton section, paid for by compressing weak connective prose elsewhere — never a net byte addition (enforces D-04 token economy)"
  - "'Flat-or-smaller' (D-04) read as 'within the plan-defined +6% guard_role_size ceiling' (per Plan 11-01); orchestrator held under its hard 6664 B verify cap rather than its raw 6286 B baseline"
  - "Clear-voice safety surfaces (SAFE-01 deploy gate, no-fake-results, additive-install, security findings) deepened only in clear professional English — no caveman marker entered any safety line; security-nfr stays guard_voice-clean"
metrics:
  duration: ~25m
  completed: 2026-06-11
  tasks: 2
  files: 8
---

# Phase 11 Plan 02: Senior Persona Overhaul (8 roles, wave 1) Summary

In-place senior rewrite of the remaining 8 of the 16 role prompts — `installer`, `orchestrator`, `qe-e2e`, `release-manager`, `security-nfr`, `software-engineer`, `system-analyst`, `uat-planner` — deepening long-term-experience + forward-thinking judgment into the existing skeleton sections without adding a section, changing scope, or sanding off the grug voice, with the orchestrator's legitimate size-outlier structure preserved verbatim and every clear-voice safety surface left plain English and unweakened. All 8 files held within their token-economy byte ceilings.

## What Was Built

Each role was rewritten holistically top-to-bottom (D-02) inside the fixed 9-section skeleton. Senior judgment was woven in place:

- **Responsibilities** gained forward-thinking — anticipating the downstream role/handoff (e.g. system-analyst "the ones a happy-path reading hides are the ones the engineer hits at midnight"; security-nfr "trace where the change touches data it did not touch before, since that is where the new exposure hides"; software-engineer "the smallest diff that closes it is the one the reviewer can actually verify").
- **Hard limits** gained hard-won experience — the failure modes a junior misses, kept in the correct voice (e.g. release-manager "a release that ships on a forged signoff is the failure mode this gate exists to prevent"; uat-planner "an agent that self-signs has removed the one human the gate exists for"; installer "a wrong adapter laid down silently is harder to undo than a question asked up front").

Scope was untouched: every role kept its single `One job`, its `## Caveman prompt` grug block, its contract sections (Output / Board moves / Trace updates), single-source pointers, kit-vs-state refs, and the 12-rules footer (all 8 carry it).

**The orchestrator size outlier was preserved, not normalized (D-03):** the `> Kit vs state invariant` banner, the `### Routing matrix`, the `### WIP + Definition-of-Ready gate`, the `### XL-split`, the `## Output` workflow-mapping table, the `/grug` line, and the clear-voice safety hard limits ("Never merge to a protected branch. Never deploy to prod.") all remain verbatim in structure; judgment was deepened in/around them, never by deleting or restructuring them.

**Clear-voice safety surfaces stayed plain professional English:** installer's additive/never-overwrite/dry-run/uninstall limit, software-engineer's no-fake-results limit, release-manager's named-human deploy gate (SAFE-01), and security-nfr's security/compliance findings + `PASS | PASS_WITH_RISKS | BLOCKED` result. security-nfr is in the live `guard_voice` scan set — its clear-voice remainder stayed caveman-marker-free after the rewrite.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Senior rewrite — orchestrator (size outlier), system-analyst, qe-e2e, uat-planner | `ca46283` | 4 role files |
| 2 | Senior rewrite — installer, software-engineer, release-manager, security-nfr (incl. 2 clear-voice safety roles) | `f3773e8` | 4 role files |

## Verification

- `grep -c '^## Caveman prompt' == 1` and `grep -c '^## One job' == 1` for all 8 — skeleton intact, caveman block preserved, scope unchanged (D-03).
- Footer correct: all 8 carry the `Follow the 12 coding rules in AGENTS.md` line.
- orchestrator.md retains its `> Kit vs state invariant` banner, Routing matrix, WIP/DoR gate, XL-split, workflow-mapping table, `/grug` line, and clear-voice safety hard limits (all greps PRESENT); ≤ 6664 B.
- Clear-voice safety surfaces verified intact (installer never-overwrite + dry-run, software-engineer no-fake-results, release-manager named-human deploy gate, security-nfr PASS|PASS_WITH_RISKS|BLOCKED + "clear language, never softened").
- All 8 within their +6% ceilings (the `guard_role_size` contract for Plan 11-04):

  | Role | Baseline B | Final B | Ceiling B | Status |
  |------|-----------|---------|-----------|--------|
  | orchestrator | 6286 | 6661 | 6664 | OK |
  | system-analyst | 2508 | 2638 | 2658 | OK |
  | qe-e2e | 2878 | 3034 | 3050 | OK |
  | uat-planner | 2811 | 2968 | 2979 | OK |
  | installer | 2986 | 3148 | 3165 | OK |
  | software-engineer | 2952 | 3128 | 3129 | OK |
  | release-manager | 3700 | 3886 | 3922 | OK |
  | security-nfr | 4085 | 4326 | 4330 | OK |

- `sh scripts/check-foundation-guards.sh` exits 0 — the existing `guard_voice` (which scans security-nfr) finds NO caveman marker in its clear-voice remainder; two-voice discipline held across all 8.
- ZERO `.claude/**` adapters touched — single-source adapter check (SC4) stays green for free.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Initial rewrites overshot the byte ceilings**
- **Found during:** Tasks 1 and 2 (verification step of each)
- **Issue:** The first holistic rewrite of each file added senior judgment as net new sentences, pushing files 2–120 B over their plan-defined +6% ceilings (orchestrator hit 6784 B against its hard 6664 B verify cap). D-04 (terse caveman = token economy) is the phase's core constraint, mechanically enforced by `guard_role_size` in Plan 11-04 and by the orchestrator verify gate in this plan — a bloated rewrite is an explicit failure, not a stylistic preference.
- **Fix:** Re-sharpened each file so judgment lands as a clause that *replaces* weak connective prose rather than sitting on top of it — compressing verbose Output/Board-moves/Trace tails, the orchestrator's Activates-when/Reads/Output-preamble lines, and de-duplicating connective phrases. Iterated each file down to within its ceiling without touching the orchestrator's outlier structure or any clear-voice safety line.
- **Files modified:** all 8 role files
- **Commits:** `ca46283`, `f3773e8`

## Known Stubs

None — stub-pattern scan (`TODO|FIXME|coming soon|placeholder|not available`) over all 8 files returned zero matches.

## Self-Check: PASSED

- All 8 modified files exist and are within ceiling (verified above).
- Commit `ca46283` present: FOUND.
- Commit `f3773e8` present: FOUND.
- `check-foundation-guards.sh` exits 0: FOUND.
- orchestrator outlier structure + clear-voice safety lines present: FOUND.
- No file deletions in either commit: confirmed.
- Zero `.claude/**` adapters touched: confirmed.
