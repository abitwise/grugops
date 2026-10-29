---
phase: "39"
plan: "09"
subsystem: kit-workflows
tags: [designer, frontend-ui, ui-design-to-build, design-tokens, checkpoints, style-dispositions, vitest]

requires:
  - phase: 39
    provides: "39-06: the Designer role (designer.md, grugops-designer); 39-08: the WF04 wiring pattern, WORKFLOW_STOP_BULLET_COUNT 47 and the Orchestrator's `design system -> Designer` route"
provides:
  - "WF14 runs the Designer first: a new step 1 sets the design system once per product, on the first UI work in a repo (including a UI ticket with no published guidelines), re-runs only for a UI epic that needs a new direction, and lets a newer Designer decision supersede an older one through its `supersedes` field"
  - "WF14 contract step (now step 2) reads the design tokens (palette, type scale, spacing) from the Designer's published notes and never names a new token; component inventory, five states, WCAG 2.2 AA and visual baseline stay with Frontend/UI"
  - "WF14 flow line, `## Agents involved` (Designer first), `## Inputs required` (the Designer's typed notes), board moves (no Designer transition) and done condition name the Designer"
  - "WF14 stop bullet: a ticket that needs a token the guidelines lack stops for a Designer decision; Frontend/UI never invents a token (untagged)"
  - "frontend-ui.md Reads, Responsibility 2 and Output read the Designer's tokens; 3738 -> 3937 B, under the 3969 FAIL ceiling"
  - "WORKFLOW_STOP_BULLET_COUNT 47 -> 48 by measurement with a dated comment"
affects: [39-10, checkpoints, hook-manifest, WF14, frontend-ui]

actuals:
  tokens: 6752
  tasks: 2
  commits: 2
plan_head_before: c16ffff28a65bdc4c2623624d631c4a463928460
plan_head_after: 0f11ad70fb8f1d263c9510aeb4617f43271bf396

tech-stack:
  added: []
  patterns:
    - "Before writing rows, measure the watched files' findings at HEAD (temporary copy of the HEAD text, gate run, restore) so the rows cover only the clauses the plan introduced and never resolve a pre-phase finding"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-09.md
  modified:
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/roles/frontend-ui.md
    - scripts/checkpoints.ts / .js
    - scripts/tier-kit-text.test.ts
    - hooks/hook-entry.ts / .js (generated)

key-decisions:
  - "frontend-ui.md's ROLE_CEILINGS row did not move: the file is 3937 B, under its 3969 FAIL ceiling (WARN only). The Reads bullet was shortened to `The Designer's published guidelines (pulled per Workflow 16)` to get there; the typed-note kinds (D-24) are stated in WF14's input bullet and step 1"
  - "The missing-token stop is untagged: it hands the ticket to the Designer, a role, not to a human, so the checkpoint roster and every site count stay as they were; only WORKFLOW_STOP_BULLET_COUNT moved (47 -> 48)"
  - "The `supersedes` sentence names the note's own field `per Workflow 16`, because the field is defined in the context-note contract and Workflow 16 is where notes are read"
  - "`## Hard limits` in both files is untouched, so no frozen Hard-limits clause moved"

patterns-established:
  - "WF14 holds the Designer's cadence once, in step 1; frontend-ui.md only says where the tokens come from"

requirements-completed: [TIER-05]

coverage:
  - id: D1
    description: "WF14 runs the Designer step before the Frontend/UI contract step, with the first-UI-work cadence, the no-guidelines case, the new-direction re-run and the `supersedes` ordering"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF14 runs the Designer before Frontend/UI, and Frontend/UI reads the Designer's tokens (TIER-05; D-23..D-26)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The WF14 contract step and frontend-ui.md read the design tokens from the Designer's published notes and never name new ones; Frontend/UI keeps the inventory, five states, WCAG 2.2 AA and visual baseline"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-26: frontend-ui.md reads the Designer's tokens and never tells the role to name them"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (frontend-ui.md WARN at 3937B, no FAIL)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The missing-token stop goes to the Designer, untagged, and the stop-bullet count moved by measurement"
    requirement: TIER-05
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-26 / T-39-17: a token the guidelines lack stops for a Designer decision, untagged, and Frontend/UI never invents one"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (118 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The disposition gate is back at the pre-phase 721 findings"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)' == 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The new WF14 step 1 and the stop bullet read clearly, and the Designer/Frontend-UI split is plain to a reader"
    verification: []
    human_judgment: true
    rationale: "Clarity of the new prose and how a reader understands the ownership split are reader judgements no test asserts"

duration: 32min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 09: The Designer in UI Work Summary

**WF14 now runs the Designer before Frontend/UI. The Designer sets the design system once per product: on the first UI work in a repo, including any UI ticket that arrives with no published guidelines. It re-runs only when a UI epic needs a new direction, and a newer Designer decision supersedes an older one through its `supersedes` field. The per-ticket contract, in WF14 and in frontend-ui.md, reads the palette, type-scale and spacing tokens from the Designer's published notes and never names a new one. A ticket that needs a token the guidelines lack stops and goes to the Designer for a recorded decision.**

## Performance

- **Duration:** about 32 min
- **Started:** 2026-10-29T22:50:21Z
- **Completed:** 2026-10-29T23:22:48Z
- **Tasks:** 2 (Task 1 was the tracer)
- **Files changed:** 8 (1 created)

## Accomplishments

- **WF14, Task 1 (tracer):**
  - The flow is `product context -> Designer design system (once per product) -> Frontend/UI design contract -> Software Engineer build -> QE/E2E verification at the gate`.
  - `## Agents involved` opens with the Designer line, and `## Inputs required` adds the Designer's guidelines, read per Workflow 16 as `decision` and `artifact-ref` notes.
  - New step 1, `Establish the design system once per product (Designer).`, holds the D-25 cadence, the empty case, the typed-note output (D-24) and the `supersedes` ordering.
  - Step 2 (the contract) now says `Read the design tokens (palette, type scale, spacing) from the Designer's published notes. Never name a new token. The contract names the component inventory.` The five states, WCAG 2.2 AA and the visual baseline are unchanged.
  - The old steps 2 to 6 are renumbered 3 to 7. No kit file cites a WF14 step number.
  - Board moves: the Designer causes no board transition and runs at the design step, before Frontend/UI.
- **frontend-ui.md, Task 1:**
  - Reads adds the Designer's published guidelines.
  - Responsibility 2 now starts `Read the design tokens (palette, type scale, spacing) from the Designer's published notes; never name new ones.`
  - Output carries the token references read from the Designer's notes.
  - 3,937 B, under its FAIL ceiling of 3,969; `## Hard limits` is untouched.
- **WF14, Task 2:**
  - New stop bullet: `A ticket needs a token the Designer's guidelines lack → stop and send it to the Designer for a recorded decision. Frontend/UI never invents a token.` It is untagged.
  - Done condition adds `The contract reads its tokens from the Designer's guidelines.`
  - Trace updates and the other stop bullets stayed true after the split and are unchanged.
- **Pins:** `WORKFLOW_STOP_BULLET_COUNT` moved 47 -> 48, by measurement, with a dated comment. The roster and site counts did not move. The hook manifest was regenerated; `docs/GUARANTEES.md` is still fresh.
- **Tests:** ten new tier-kit-text cases (ordering, cadence, `supersedes`, token read, flow/agents/inputs/board, frontend-ui.md, the stop bullet, the done condition).
- **Dispositions:** `docs/audit/29-style-dispositions/39-09.md` has 28 rows, two of them in the frozen `## Stop conditions` with a companion cell.

## Task Commits

1. **Task 1 (tracer): run the Designer once per product before the Frontend/UI contract in WF14.** `ebf42635` (feat)
2. **Task 2: stop a ticket that needs a token the Designer's guidelines lack.** `0f11ad70` (feat)

**Tracer gate:** auto mode is off, `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` is automated only. I re-ran it end to end before Task 2, and it passed: build, 76 tier-kit-text tests, every gate and freshness check, and 721 findings.

## Verification

- `npm run build && npm run typecheck`: ok.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts`: 196 pass.
- These all exit 0 with no FAIL line:
  - `check-foundation-guards` (frontend-ui.md WARN at 3937 B)
  - `validate-agent-factory` (`VALIDATE_KIT_ROOT=.`)
  - `check-imperative-lexicon`, `check-banned-claims`, `check-kit-refs`
  - `check:claim-anchors`, `check:audit-register`, `check:build-parity` (after commit)
  - `freshness`, `freshness:adapters`, `freshness:catalog`, `freshness:hook-manifest`, `freshness:guarantees`
- `check-diff-disposition` prints `721 finding(s)`. With no rows it printed 756 after Task 1, and 724 after Task 2 with only the Task 1 rows.
- Full non-e2e suite (1,356 s): **20 failures in 6 files**, the same set as in deferred-items.md (context-io 7, uat-gate-exit-contract 5, harness-instance-ledger 4, context-io-writer-set 2, canonical-corpus 1, installer-fs-census 1). 10,629 pass, 9 more than before.
- Acceptance criteria, all pass:
  - `Designer` 6 in WF14 (at least 3) and 3 in frontend-ui.md (at least 2);
  - `Name the design tokens` 0 in frontend-ui.md, `names the design tokens` 0 in WF14;
  - `supersedes` 1 and `invents a token` 1 in WF14;
  - the `WORKFLOW_STOP_BULLET_COUNT > 47` node check exits 0.
- `requirements.ready-ids` reported TIER-05 ready.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Wording

- **The Designer's agents line was shortened to fit the 25-word bound.** At 26 words it failed `check-imperative-lexicon`. It now reads `principles, the token system, style direction, the WCAG 2.2 AA bar and generated-design tells to avoid`. The meaning is unchanged.
- **The frontend-ui.md Reads bullet does not name the two note kinds.** With them the file was 3,974 B, past its FAIL ceiling. The plan allowed moving the ceiling by measurement, but staying under it was the cheaper fix. WF14 still names the kinds.

**Total deviations:** none auto-fixed; 2 wording notes. **Impact:** none changes behavior.

## Issues Encountered

- The disposition gate also reports some older findings in these two files: the `memory-bank/plans/` path rewrites, the trace-update rewrites and the frozen `## Commit` clause. They were already part of the 721 before this plan. I measured them at HEAD and wrote no rows for them, so the count lands back on 721 exactly.
- `docs/audit/28-prepass-evidence.md` still has the user's uncommitted change. I did not touch or stage it.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 39-10:** TIER-03 and TIER-06 are still open for it. `WORKFLOW_STOP_BULLET_COUNT` is 48.
- **Human check, end of phase:** read the new WF14 step 1, the step 2 token sentences and the missing-token stop for clarity (D5).

## Self-Check: PASSED

- FOUND: `docs/audit/29-style-dispositions/39-09.md`.
- FOUND: `ebf42635` and `0f11ad70`, both ancestors of HEAD.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
