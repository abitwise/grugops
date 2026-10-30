---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
verified: 2026-10-30T16:30:00Z
status: gaps_found
score: 4/5 roadmap success criteria verified (SC3 partial; 0 behavior-unverified)
covered_files:
  - ".claude/agents/grugops-designer.md"
  - ".claude/agents/grugops-software-engineer-junior.md"
  - ".claude/agents/grugops-software-engineer-mid.md"
  - ".claude/agents/grugops-software-engineer-senior.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-01-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-01-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-02-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-02-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-03-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-03-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-04-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-04-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-05-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-05-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-06-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-06-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-07-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-07-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-08-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-08-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-09-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-09-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-10-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-10-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-11-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-11-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-12-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-12-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-13-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-13-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-14-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-14-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-15-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-15-SUMMARY.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-16-PLAN.md"
  - ".planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-16-SUMMARY.md"
  - "CHANGELOG.md"
  - "agent-factory/checklists/complexity-rubric.md"
  - "agent-factory/config/factory.config.md"
  - "agent-factory/roles/designer.md"
  - "agent-factory/roles/software-engineer.md"
  - "agent-factory/roles/tech-lead.md"
  - "agent-factory/workflows/04-ticket-to-pr.md"
  - "install/README.md"
  - "install/install.ts"
  - "scripts/canonical-frontmatter.ts"
  - "scripts/generate-role-adapters.ts"
  - "scripts/model-tiers.ts"
  - "scripts/tier-kit-text.test.ts"
covered_digest: "v3:sha256:f4bdedfb6b96eedc460bd7cd89a456cd06245a95b72479db1de6e1fa485999f0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: "5/5 roadmap success criteria verified"
  gaps_closed:
    - "G-39-5: level pins re-decided to junior haiku/xhigh, mid sonnet/high, senior opus/medium (LEVELS, three generated adapters, README, CHANGELOG, factory.config.md Absent-means-inherit paragraph, MODEL-01 records); adapters read haiku/xhigh, sonnet/high, opus/medium on disk"
    - "G-39-6: the `models` Refusals and closed-set paragraphs name the real key sets"
  gaps_remaining:
    - "G-39-7 is closed structurally (step 15 is a lead line plus six labelled sub-bullets) but the split introduced CR-01"
  regressions:
    - "CR-01: plan 39-16 reordered step 15 so the move record precedes the re-score stop"
gaps:
  - truth: "SC3 / TIER-04 and the 39-16 must_have 'no change in meaning': a stuck engineer escalates one level once via a failed-attempt note and a queue re-enqueue, and the default `block` re-score stop holds the ticket for a named human before any re-enqueue"
    status: failed
    reason: "In Workflow 04 step 15 the sub-bullet order is now: move limits, then 'Record the move in a new decision note' (Move: escalate), then 'Apply the re-score stop ... At block, stop for a named human'. Before 39-16 (commit bb386762) the stop came first and the note after. Step 16 releases the Orchestrator on 'only once the step 15 move is recorded' and holds for a human only after a `Cause: gate` note. For a `Cause: engineer` block whose re-score calls for two levels, the move note exists before the human is asked, so the Orchestrator can create the pending subtask and spawn the adapter past the default `block` stop. tier-kit-text.test.ts pins the new order, so the regression is test-locked. The 39-16 disposition and must_have claim 'no instruction changed', which the text contradicts."
    artifacts:
      - path: "agent-factory/workflows/04-ticket-to-pr.md"
        issue: "lines 42-44 (order) and 48 (step 16 hold covers only Cause: gate, names no cell)"
      - path: "scripts/tier-kit-text.test.ts"
        issue: "around line 1107: asserts the regressed order"
      - path: "docs/audit/29-style-dispositions/39-16.md"
        issue: "states the split changes no instruction"
    missing:
      - "Move 'Apply the re-score stop' before 'Record the move', and say that at block no move note is written until the human answers"
      - "Give step 16 the matching hold for a re-score stop at `checkpoints.escalate_unadjudicable_result: block`, and name the cell in both holds"
      - "Give the human a way to record a level decision at the re-score stop (today Confirmed: yes/no applies only to a recorded move)"
      - "Update the step-15 order pin in scripts/tier-kit-text.test.ts and the 39-16 disposition"
  - truth: "G-39-5 / 39-15 must_have: factory.config.md states the re-decided pins (haiku/xhigh, sonnet/high, opus/medium) wherever it states level pins"
    status: failed
    reason: "agent-factory/config/factory.config.md line 28 (the `models` row of the field table, the first place a configuring reader looks) still says 'junior `haiku`/`medium`, mid `sonnet`/`medium` and senior `opus`/`high`'. The same document elsewhere (line 125 and the Absent-means-inherit paragraph) says xhigh/high/medium, so it states two different zero-config efforts for the same adapters. No test covers this row (39-REVIEW WR-02)."
    artifacts:
      - path: "agent-factory/config/factory.config.md"
        issue: "line 28 carries the old pins"
    missing:
      - "Change the row to junior haiku/xhigh, mid sonnet/high, senior opus/medium"
      - "Add a pin in scripts/tier-kit-text.test.ts or model-dial-consistency.test.ts so a later re-decision cannot leave the table behind"
deferred: []
advisory:
  - finding: "WR-01 (39-REVIEW): at `notify`/`off` the used-up stop (tagged escalate_unadjudicable_result) no longer stops, but no legal move remains and the 'never retry in a loop' bound in the stop condition and tech-lead.md still reads unconditional"
    category: other
    reason: "The loop bound can be lost or deadlock when the cell is lowered; decide what the used-up stop does at notify/off. Text-confirmed in WF04 lines 41, 44, 67 and tech-lead.md:49. Fold into the CR-01 closure round."
    evidence_status: "text-confirmed; not run"
  - finding: "IN-01, IN-02 (39-REVIEW) and IN-05..IN-10 (39-REVIEW-DISPOSITION)"
    category: other
    reason: "Audit-note supersession pointer, admission-gating wording, and earlier quality follow-ups; no success criterion depends on them"
    evidence_status: "recorded open or deferred in 39-REVIEW-DISPOSITION.md"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "UAT 5 re-run: on Claude Code 2.1.293+ in a scratch repo, spawn grugops-software-engineer-junior, -mid and -senior by name with no model or effort parameter"
    expected: "/tasks shows haiku/xhigh, sonnet/high and opus/medium"
    why_human: "Needs a live host; the on-disk adapter frontmatter is verified, the host's honoring of it is not"
  - test: "UAT 7: read Workflow 04 step 15 as a first-time reader (after CR-01 is fixed)"
    expected: "Score, plan, level, escalation read in order and each named-human stop sits where expected"
    why_human: "Readability is a judgment"
  - test: "UAT 10: on a live host, confirm unscored work is never auto-delegated to a level adapter"
    expected: "A level is reached only when the Tech Lead's plan names it"
    why_human: "Live host; deferred by the human until the milestone lands"
  - test: "UAT 14: spawn grugops-designer in a scratch repo and have it publish a design note"
    expected: "Note is admitted via scripts/context-io.js through Bash, not refused as unsealed"
    why_human: "Live host; deferred by the human until the milestone lands"
---

# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key Verification Report

**Phase Goal:** The kit can match each ticket to the right engineer level: a Tech Lead scores and pre-plans, one engineer role yields three level adapters on Claude Code, a Designer role exists, and roles can declare skills, while every role and adapter set still follows the filesystem
**Verified:** 2026-10-30T16:30:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap-closure round 2 (plans 39-14, 39-15, 39-16)

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | Tech Lead scores on a written rubric, records score and level in a note and the ticket body, pre-plans dev tasks (TIER-01) | VERIFIED | `agent-factory/roles/tech-lead.md` (capabilities read edit shell, 3439 B) and `agent-factory/checklists/complexity-rubric.md` exist; role steps 3-5 score per rubric, name the level, plan; WF04 steps 2-4 carry the Tech Lead step. Text tests in `scripts/tier-kit-text.test.ts` pass. |
| 2 | Three engineer adapters from one `software-engineer.md`: junior haiku/xhigh, mid sonnet/high, senior opus/medium; guidance elsewhere; MODEL-01 re-pinned by recorded decision (TIER-02, TIER-06) | VERIFIED (one stale doc row, see gap 2) | `software-engineer.md` declares `levels: junior mid senior`. Adapters on disk: junior `model: haiku` `effort: xhigh`, mid `sonnet`/`high`, senior `opus`/`medium`; the base `grugops-software-engineer.md` is not tracked. Five suites (488 tests: tier-kit-text, model-tiers, generate-role-adapters, adapter-byte-baseline, model-dial-consistency) pass; `npm run freshness` (88 .js match a rebuild), `npx tsc --noEmit` and `node scripts/check-foundation-guards.js` (ALL CHECKS PASSED) pass. PROJECT.md carries the 2026-10-30 re-decision row. Live host honoring is a human item (UAT 5). |
| 3 | Junior scope rule, D-09 amendment and v2.1.293 floor recorded; a stuck or twice-failed engineer escalates one level once via a `failed-attempt` note and a queue re-enqueue, never a relayed prompt (TIER-03, TIER-04) | PARTIAL | Junior rule present (`software-engineer.md` lines 35-37), D-09 amendment in PROJECT.md line 270. The escalation path exists (WF04 steps 14-16), but the 39-16 split regressed the default `block` re-score stop (gap 1). |
| 4 | Designer role sets design strategy; Frontend/UI reads it for per-ticket contracts (TIER-05) | VERIFIED | `agent-factory/roles/designer.md` (read edit shell) and generated `grugops-designer.md` carry Bash; `frontend-ui.md` lines 22-31 read the Designer's published tokens; WF14 step 1 is the Designer step. Live admission is a human item (UAT 14). |
| 5 | Adapter names, spawn allowlist, counts, tiers, ceilings follow the filesystem; roles may declare `skills:` admitted by the canonical grammar (TIER-06, TIER-07) | VERIFIED | `scripts/canonical-frontmatter.ts` has a role schema admitting `skills` while `CANONICAL_SCHEMA` (adapter keys) does not (D-28); foundation guards (kit counts, model/effort guards, ceilings) pass; KIT-03 and derivation tests pass. 21 adapter files, 20 role files at HEAD. |

**Score:** 4/5 truths verified (SC3 partial: junior rule, D-09 and floor verified; the escalation's human stop regressed)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `agent-factory/roles/tech-lead.md`, `agent-factory/checklists/complexity-rubric.md` | VERIFIED | exist, substantive, wired from WF04 and the Orchestrator |
| `agent-factory/roles/designer.md`, `.claude/agents/grugops-designer.md` | VERIFIED | exist, Bash present |
| `.claude/agents/grugops-software-engineer-junior.md`, `-mid.md`, `-senior.md` | VERIFIED | pins match the re-decision |
| `scripts/model-tiers.ts`, `generate-role-adapters.ts`, `canonical-frontmatter.ts` | VERIFIED | build fresh, tsc clean |
| `agent-factory/workflows/04-ticket-to-pr.md` steps 15-16 | FAILED (gap 1) | order regression |
| `agent-factory/config/factory.config.md` | PARTIAL (gap 2) | line 28 carries stale pins |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| WF04 step 4 | named adapter | WIRED | spawns the adapter the plan note names, no model or effort parameter |
| WF04 step 15 | step 16 re-enqueue | PARTIAL | step 16 holds only for `Cause: gate` at block; the re-score stop has no matching hold |
| WF14 / frontend-ui | Designer notes | WIRED | reads published tokens, missing-token stop |
| LEVELS | adapters | WIRED | freshness green |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase test files | `npx vitest run` on 5 files | 488 passed | PASS |
| Type check | `npx tsc --noEmit` | clean | PASS |
| Build freshness | `npm run freshness` | 88 files match | PASS |
| Foundation guards | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED (WARN tiers only, none from tech-lead.md) | PASS |
| Full non-e2e suite (orchestrator-reported from the 39-16 run) | not re-run here | 10679 pass, 21 fail (20 deferred-items baseline, 1 from the stray untracked `~/`) | NOT RE-RUN |

### Requirements Coverage

| Requirement | Plans | Status | Evidence |
|-------------|-------|--------|----------|
| TIER-01 | 39-05, 39-07, 39-08 | SATISFIED | SC1 |
| TIER-02 | 39-01, 39-02, 39-07, 39-14, 39-15 | SATISFIED (live check pending; stale doc row, gap 2) | SC2 |
| TIER-03 | 39-07, 39-08, 39-12 | SATISFIED | SC3 first half |
| TIER-04 | 39-08, 39-12, 39-16 | PARTIAL | gap 1 |
| TIER-05 | 39-06, 39-09, 39-11 | SATISFIED | SC4 |
| TIER-06 | 39-01, 39-02, 39-03, 39-14 | SATISFIED | SC5 |
| TIER-07 | 39-04 | SATISFIED | SC5 |

All seven IDs map to Phase 39 in REQUIREMENTS.md (marked Complete) and none is orphaned. TIER-04 is marked Complete in the tracker but does not fully hold (gap 1).

### Anti-Patterns Found

No TBD, FIXME or XXX debt markers found in the files read. Findings are the two gaps above plus advisory WR-01.

### Human Verification Required

UAT 5, 7, 10 and 14 (see frontmatter). Re-run UAT 7 after gap 1 is fixed, since step 15 will be reordered.

### Gaps Summary

Two gaps block the phase. Gap 1 (CR-01) is a regression introduced by 39-16: the split moved the move record ahead of the re-score stop, so an engineer-raised ticket whose re-score calls for two levels can be re-enqueued at the default `block` without the named human. This breaks the plan's own "no change in meaning" must-have and TIER-04's safe escalation path, and a test pins the regressed order. Gap 2 (WR-02) is one stale table row in `factory.config.md` that contradicts the G-39-5 pins. Both are small text fixes (reorder two sub-bullets and add one hold clause in step 16; edit one table row and add a pin). WR-01 (the used-up stop at notify/off) should be settled in the same round.

Not touched: `docs/audit/28-prepass-evidence.md` and the `~/` directory.

---

_Verified: 2026-10-30T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
