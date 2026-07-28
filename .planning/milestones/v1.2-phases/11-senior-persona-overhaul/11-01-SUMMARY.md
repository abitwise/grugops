---
phase: 11-senior-persona-overhaul
plan: 01
subsystem: role-prompts
tags: [persona, voice, token-economy, in-place-rewrite]
requires:
  - "Phase 10 foundation guards (guard_voice scan set incl. compliance-officer + incident-responder) shipped GREEN"
provides:
  - "7 of 16 role prompts rewritten to senior judgment in place (PERS-01, group A–H minus ba-pm)"
  - "senior-judgment substrate the later v1.2 content phases (12–17) author into"
affects:
  - "Plan 11-02 (remaining 9 roles), Plan 11-03 (ba-pm senior BA), Plan 11-04 (guard_role_size + guard_caveman_preserved + guard_voice expansion)"
tech-stack:
  added: []
  patterns:
    - "in-place senior rewrite within the fixed 9-section role skeleton — no new section (D-01)"
    - "seniority encoded as compression (sharper judgment per token), files flat-or-smaller within +6% ceiling (D-04)"
    - "two-voice discipline — grug in Caveman prompt + punchy body, clear voice on safety/compliance lines"
key-files:
  created: []
  modified:
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/incident-responder.md
decisions:
  - "Persona depth lands as a sharp clause woven into an existing section, paid for by compressing weak connective prose elsewhere — never as a net addition (enforces D-04 token economy)"
  - "Each file held within its plan-defined +6% ceiling (the guard_role_size contract Plan 11-04 will enforce); 'flat-or-smaller' read as 'within ceiling', not 'below raw baseline'"
metrics:
  duration: ~20m
  completed: 2026-06-11
  tasks: 2
  files: 7
---

# Phase 11 Plan 01: Senior Persona Overhaul (7 roles, wave 1) Summary

In-place senior rewrite of 7 of the 16 role prompts — `agents-md-scribe`, `architect-design`, `brownfield-mapper`, `compliance-officer`, `factory-coach`, `greenfield-mapper`, `incident-responder` — deepening long-term-experience + forward-thinking judgment into the existing skeleton sections without adding a section, changing scope, or sanding off the grug voice, and keeping every file within its token-economy byte ceiling.

## What Was Built

Each role was rewritten holistically top-to-bottom (D-02) inside the fixed 9-section skeleton. Senior judgment was woven in place:
- **Responsibilities** gained forward-thinking — anticipating the downstream role's needs and what breaks later (e.g. architect "drawing the seams where change is most likely, so tomorrow's edit is local, not a rewrite"; incident-responder "the radius is usually wider than the first alert suggests").
- **Hard limits** gained hard-won experience — the failure modes a junior misses (e.g. greenfield "a stack chosen to impress is one the team fights for a year"; factory-coach "a flattering retro that hides the regression is the most expensive kind").

Scope was untouched: every role kept its single `One job`, its `## Caveman prompt` grug block, its contract sections (Output / Board moves / Trace updates), single-source pointers, kit-vs-state refs, and the 12-rules footer where it had one. `agents-md-scribe` correctly keeps NO footer (it owns the rules) and retains its two clear-voice voice-meta lines unchanged.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Senior rewrite — agents-md-scribe, architect-design, brownfield-mapper, factory-coach | `ea7c8b0` | 4 role files |
| 2 | Senior rewrite — greenfield-mapper, compliance-officer, incident-responder (incl. 2 clear-voice safety roles) | `01aade3` | 3 role files |

## Verification

- `grep -c '^## Caveman prompt' == 1` for all 7 — caveman block preserved (D-06 protects this in Plan 11-04).
- `grep -c '^## One job' == 1` for all 7 — skeleton intact, scope unchanged (D-03).
- Footer correct: `agents-md-scribe` has NO `Follow the 12 coding rules` line; the other 6 carry it.
- All 7 within their +6% ceilings (the `guard_role_size` contract for Plan 11-04):

  | Role | Baseline B | Final B | Ceiling B | Status |
  |------|-----------|---------|-----------|--------|
  | agents-md-scribe | 3491 | 3689 | 3701 | OK |
  | architect-design | 3229 | 3420 | 3423 | OK |
  | brownfield-mapper | 2220 | 2348 | 2354 | OK |
  | factory-coach | 3053 | 3235 | 3237 | OK |
  | greenfield-mapper | 2386 | 2526 | 2530 | OK |
  | compliance-officer | 3714 | 3929 | 3937 | OK |
  | incident-responder | 3024 | 3202 | 3206 | OK |

- `sh scripts/check-foundation-guards.sh` exits 0 — the existing `guard_voice` (which scans compliance-officer + incident-responder) finds NO caveman marker in their clear-voice remainder; two-voice discipline held.
- ZERO `.claude/**` adapters touched — single-source adapter check (SC4) stays green for free.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Initial rewrites overshot the byte ceilings**
- **Found during:** Tasks 1 and 2 (verification step of each)
- **Issue:** The first holistic rewrite of each file added senior judgment as net new sentences, pushing every file 45–304B over its plan-defined +6% ceiling. D-04 (terse caveman = token economy) is the phase's core constraint and is mechanically enforced by `guard_role_size` in Plan 11-04 — a bloated rewrite is an explicit failure, not a stylistic preference.
- **Fix:** Re-sharpened each file so judgment lands as a clause that *replaces* weak connective prose rather than sitting on top of it — compressing verbose Output/Board-moves/Trace tails and de-duplicating Hard-limits lines that restated Responsibilities. Iterated each file down to within its ceiling.
- **Files modified:** all 7 role files
- **Commits:** `ea7c8b0`, `01aade3`

## Known Stubs

None — stub-pattern scan (`TODO|FIXME|coming soon|placeholder|not available`) over all 7 files returned zero matches.

## Self-Check: PASSED

- All 7 modified files exist and are within ceiling (verified above).
- Commit `ea7c8b0` present: FOUND.
- Commit `01aade3` present: FOUND.
- `check-foundation-guards.sh` exits 0: FOUND.
- No file deletions in either commit: confirmed.
