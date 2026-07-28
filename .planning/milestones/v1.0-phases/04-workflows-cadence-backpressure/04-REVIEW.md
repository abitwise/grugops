---
phase: 04-workflows-cadence-backpressure
reviewed: 2026-06-03T13:10:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - agent-factory/workflows/00-bootstrap-greenfield.md
  - agent-factory/workflows/01-bootstrap-brownfield.md
  - agent-factory/workflows/02-idea-to-epics.md
  - agent-factory/workflows/03-epic-to-tickets.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/workflows/07-backlog-refinement.md
  - agent-factory/workflows/08-sprint-planning.md
  - agent-factory/workflows/09-daily-sweep.md
  - agent-factory/workflows/10-sprint-review.md
  - agent-factory/workflows/11-retro.md
  - agent-factory/workflows/12-release.md
  - agent-factory/workflows/13-incident.md
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-03T13:10:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed all 14 numbered workflow prompt files (`00-`..`13-`) against the project's hard
invariants in `CLAUDE.md`, the Phase-4 plans, and the runnable acceptance harness
`check-structure.sh`. These are markdown role-prompt guardrails, not executable code, so the
review targets the invariants that matter for this kit: no-fabrication, merge/deploy safety,
single-source backpressure, voice discipline, frozen-path drift, and cross-file consistency.

**The structural harness (`check-structure.sh`, V-01..V-13) passes ALL 13 invariants
(EXIT=0).** I ran it; output: `ALL CHECKS PASSED`. I also independently confirmed the
safety-critical invariants by direct read rather than trusting the token-presence greps:

- **No fabricated commands.** No workflow hard-codes a real gate command (`npm`/`pnpm`/`yarn`/
  `make`/`go test`/`pytest`/`cargo` all absent). `05-pr-quality-gate.md:29` correctly pulls
  gate commands from `AGENTS.md` slots and records `UNKNOWN - verify` when a command is unknown.
- **Merge/deploy safety holds.** `04-ticket-to-pr.md:47` honors `autonomy=pr` and states "it
  never merges." `05-pr-quality-gate.md:32,51` makes the gate emit a *recommendation* a human
  reviews, never auto-merges, never deploys. `12-release.md` requires a named human approval +
  named human confirmation (lines 26, 41), keyed to `production_requires_human_confirmation`,
  and explicitly states three times that the workflow "never deploys prod itself."
- **Single-source backpressure holds.** `READY_FOR_HUMAN_REVIEW` and the full §14 loop appear
  ONLY in `05`. `04-ticket-to-pr.md:26` references `05-pr-quality-gate.md` and does not restate
  the loop. Verified by grep: `05` is the sole home of the terminal token.
- **Voice discipline holds.** Every caveman aphorism in a safety-bearing file (`05`, `12`, `13`)
  is *adjacent flavor*; the actual safety rule is stated in clear voice (e.g. `12:26`, `12:41`,
  `05:32`, `05:51`). The joke does not replace or muddy any safety/money/compliance explanation.
- **No frozen-path drift.** No workflow cites a `plans/*-handoff` path; every `*-handoff` token
  is one of the frozen 16, all resolving to real files under `agent-factory/handoffs/`. All
  cited checklist, memory-bank, config, board, metrics, and traceability paths resolve on disk.
- **Config fidelity.** Every config value quoted in the workflows matches
  `factory.config.json`: `self_fix_attempts=2`, `coverage_threshold=0.8`,
  `mandatory_gates=["lint","typecheck","unit","build"]`, `e2e_when="ui-or-critical-path"`,
  `blocked_escalation_days=2`, `sprint_length_days=10`.

The findings below are the residue an adversarial pass surfaced that the token-presence harness
structurally cannot catch: three cross-file *semantic* (board-choreography / input-conditionality)
inconsistencies and two minor quality notes. None are blockers. None compromise a safety
invariant. They are board-flow gaps and a wording mismatch that will confuse a reader following
a ticket across the column lifecycle, and are worth tightening before the kit is dogfooded.

## Warnings

### WR-01: Board-column flow gap — no workflow owns the `In Review`/`In Security/NFR -> Ready for UAT` transition

**File:** `agent-factory/workflows/05-pr-quality-gate.md:35`, `agent-factory/workflows/06-uat-pack.md:28`
**Issue:** The board (`plans/board.md`) defines a linear column flow that includes
`In Review -> In Security/NFR -> Ready for UAT -> In UAT`. `05`'s Board-moves section ends the
gate at `In Review` / `In Security/NFR` ("The gate does not move work to `Done`"), and `06`'s
Board-moves section *begins* at `Ready for UAT -> In UAT` ("the UAT Planner moves the ticket
`Ready for UAT -> In UAT`"). No workflow narrates who moves a ticket *into* `Ready for UAT`
(i.e. the `In Review`/`In Security/NFR -> Ready for UAT` exit). The board's exit-owner table
assigns `Ready for UAT` exit to the UAT Planner and `In Security/NFR` exit to Security/NFR, but
neither workflow's prose declares the hand-off that lands a ticket in `Ready for UAT`. A reader
tracing a ticket through the lifecycle hits a gap between `05` and `06`. (Note: the harness only
greps for the literal column tokens being *present*, so it cannot detect a missing transition.)
**Fix:** Add one line to `05`'s Board moves (or `06`'s) naming the owner of the
`In Security/NFR -> Ready for UAT` move, e.g. in `05`:
```markdown
On a passing gate (and a cleared Security/NFR review when triggered), the QE/E2E exit moves
the ticket from `In Review` (or `In Security/NFR`) to `Ready for UAT`, where UAT picks it up.
```

### WR-02: Board-column flow gap — no workflow owns the `Ready -> In Analysis`/`In Design` entry

**File:** `agent-factory/workflows/03-epic-to-tickets.md:28`, `agent-factory/workflows/02-idea-to-epics.md:26`
**Issue:** The board places `In Analysis` and `In Design` between `Ready` and `Ready for Dev`.
`03` says a ticket "whose behavior needs analysis sits in `In Analysis`; the System Analyst
owns that exit" and separately that "BA/PM moves a Definition-of-Ready-met ticket to `Ready`."
Neither `02`, `03`, nor `07-backlog-refinement.md` states who moves a ticket *into* `In Analysis`
or `In Design` (the entry to the analysis/design lane). `04-ticket-to-pr.md:31` then jumps
straight from `Ready for Dev`. As with WR-01, the column is referenced but the entry transition
has no named owner, leaving the analysis-lane entry undocumented across the file set. This is a
consistency gap, not a contradiction — but it weakens the "the board never lies" contract the
sweep (`09`) is supposed to be able to reconcile against.
**Fix:** In `03`'s Board moves, name who routes a Ready/Backlog ticket into `In Analysis` when
behavior is unclear (likely the Orchestrator or BA/PM), e.g.:
```markdown
When a ticket's behavior is unclear, the Orchestrator routes it from `Ready` into `In Analysis`;
the System Analyst owns the `In Analysis` exit back to `Ready`/`Ready for Dev`.
```

### WR-03: `06-uat-pack.md` lists `security-nfr-handoff.md` as an unconditional required input, contradicting `04`/`05`

**File:** `agent-factory/workflows/06-uat-pack.md:17`
**Issue:** `06` Inputs-required reads: "The completed feature and the `security-nfr-handoff.md`
that gated it." This phrases the security/NFR handoff as an *always-present* gating input. But
`04-ticket-to-pr.md:34` and `05-pr-quality-gate.md:13,38` correctly treat
`security-nfr-handoff.md` as produced only "when/if triggered" — and the config ships
`mode=lean` with `compliance_regime: []`, in which (per `plans/board.md`) the `In Security/NFR`
column "may be skipped unless a trigger fires." For a feature that never tripped a risk surface,
`security-nfr-handoff.md` will not exist, so listing it as a required UAT input is inconsistent
with the rest of the chain and could make a UAT Planner block on a handoff that legitimately
isn't there. (Token-presence harness V-12 only checks the name is in the frozen 16 — it cannot
detect the conditionality mismatch.)
**Fix:** Make the dependency conditional to match `04`/`05`:
```markdown
- The completed feature and, if a risk surface was triggered, the `security-nfr-handoff.md`
  that gated it.
```

## Info

### IN-01: `08-sprint-planning.md` cites spec anchor `§6.2` without naming the source document

**File:** `agent-factory/workflows/08-sprint-planning.md:24`
**Issue:** Step 4 says 'Write `plans/sprints/SPRINT-xx.md` in the §6.2 format'. `§6.2` is a real
anchor in the build's source spec (`docs/initial/agent_factory_builder_spec_v2.md`, confirmed in
`04-RESEARCH.md`), and 08 *does* reproduce the full field list inline immediately after — so this
is not a dangling/fabricated citation and not a correctness defect. But a downstream reader (or an
agent running the kit) has no access to that spec section; the bare `§6.2` is meaningless to them.
Since the field list is reproduced inline anyway, the anchor adds no value and risks reading as a
broken reference.
**Fix:** Drop the bare anchor and lean on the inline list: "Write `plans/sprints/SPRINT-xx.md`
with these fields (reproduce exactly):" — or name the source if you keep it.

### IN-02: `06-uat-pack.md` and `12-release.md` both own a `-> Done`/`Ready to Release` move with a lean shortcut that bypasses the documented release flow

**File:** `agent-factory/workflows/06-uat-pack.md:28,43`
**Issue:** `06` states the ticket moves "to `Ready to Release` (or directly to `Done` in lean
mode)." This is the intended lean shortcut (lean mode has no enterprise release gate), and it is
internally consistent with `board.md` ("Done | merged + released (or merged, lean)"). It is
called out here only as a cross-reference note: a reader skimming `12-release.md` (which owns
`Ready to Release -> Done`) should be aware that in lean mode `06` closes the ticket and `12`
never runs. No fix required; consider a one-clause pointer in `06` ("in enterprise mode, `12`
cuts the release") for navigability.
**Fix:** Optional — add "; in enterprise mode `12-release.md` takes it from `Ready to Release`."

---

_Reviewed: 2026-06-03T13:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
