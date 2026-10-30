---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
verified: 2026-10-30T01:20:00Z
status: gaps_found
score: 4/5 roadmap success criteria fully verified (SC4 FAILED partial on Claude Code; SC3 verified with one open procedure defect)
covered_files:
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
  - "agent-factory/checklists/complexity-rubric.md"
  - "agent-factory/roles/designer.md"
  - "agent-factory/roles/software-engineer.md"
  - "agent-factory/roles/tech-lead.md"
  - "agent-factory/workflows/04-ticket-to-pr.md"
  - "agent-factory/workflows/14-ui-design-to-build.md"
  - "install/install.ts"
  - "scripts/canonical-frontmatter.ts"
  - "scripts/check-foundation-guards.ts"
  - "scripts/generate-role-adapters.ts"
  - "scripts/model-tiers.ts"
covered_digest: "v3:sha256:cea15cecf9b9497b3490f74316add3f723f81c136084d419ffb681efd725c1d3"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
gaps:
  - truth: "A Designer role sets design strategy and guidelines, and the Frontend/UI role reads them for each ticket's UI contract (SC4 / TIER-05)"
    status: failed
    reason: "On Claude Code the generated Designer adapter cannot publish or read the typed Workflow 16 notes that are its whole output. designer.md declares `capabilities: read edit`, so grugops-designer.md carries `tools: Read, Grep, Glob, Edit, Write` and no Bash. Workflow 16 allows only the sanctioned writer (`scripts/context-io.js`); a note written with a file tool is refused as `unsealed`. generate-role-adapters.ts:174-181 records that nested role sessions get no plugin MCP tool and reach the writer in-process through Bash. All 18 other roles carry `shell`. Without Designer notes, Workflow 14 step 2 (Frontend/UI reads tokens) and its missing-token stop have nothing to read on a Claude Code adapter run. Independently confirmed (reviewer finding CR-01 holds)."
    artifacts:
      - path: "agent-factory/roles/designer.md"
        issue: "line 4: `capabilities: read edit` (no `shell`)"
      - path: ".claude/agents/grugops-designer.md"
        issue: "generated; `tools:` has no Bash, so the Designer cannot reach scripts/context-io.js"
      - path: "scripts/tier-kit-text.test.ts"
        issue: "pins `read edit` (reviewer cites ~line 249) and the 39-SECURITY.md T-39-21 row, so the suite passes over a role that cannot do its one job"
    missing:
      - "Change designer.md to `capabilities: read edit shell` (still no `admit`, still no `Agent(...)`), regenerate adapters, update the tier-kit-text test pin and the T-39-21 mitigation wording; or state and test a route to Workflow 16 that works without a shell"
  - truth: "A stuck or twice-failed engineer escalates one level once through a `failed-attempt` note and a queue re-enqueue (SC3 / TIER-04), without bypassing the human stop Workflow 05 sets for an exhausted self-fix budget"
    status: partial
    reason: "The escalation mechanics exist and are tested (failed-attempt note, Blocked move, new pending/ subtask, no model parameter on the spawn, never a relayed prompt). But WF04 steps 14-16 route a gate `BLOCKED_NEEDS_FIX` (self-fix exhausted) to Tech Lead decision then Orchestrator re-enqueue with no human in the numbered steps. Workflow 05 line 70 says 'Stop and hand to a human' for that same event. The only human confirmation is the stop bullet (WF04 line 60), and it claims 'per Workflow 05', which does not say that. An agent following the steps can re-enqueue past a tagged human checkpoint, and the checkpoint census counts the tag as present. Independently confirmed (CR-02 holds as a procedure defect). It does not break the literal SC3 wording and touches neither merge nor deploy, so it is recorded partial, not a total failure."
    artifacts:
      - path: "agent-factory/workflows/04-ticket-to-pr.md"
        issue: "steps 14-16 (lines 40-42) omit the named-human confirmation; stop bullet line 60 cites Workflow 05 inaccurately"
      - path: "agent-factory/workflows/05-pr-quality-gate.md"
        issue: "line 70 names no Tech Lead decision step"
    missing:
      - "Put the named-human stop into step 15/16 on the gate-failure branch before any re-enqueue (keep `checkpoint: exhaust_self_fix_budget`), and make the Workflow 05 reference accurate (amend 05 line 70 or reword WF04 line 60)"
deferred: []
advisory: []
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Install into a scratch repo on Claude Code >= 2.1.293 and spawn each of grugops-software-engineer-junior, -mid and -senior"
    expected: "/tasks shows haiku/medium, sonnet/medium, opus/high respectively"
    why_human: "Needs a live Claude Code host; no automated host exists in CI. Without it the live effort/model behavior is UNKNOWN - verify"
  - test: "Read WF04 steps 2-4 and 14-16 plus the four new stop bullets, and WF14 step 1 plus the missing-token stop"
    expected: "A first-time reader can follow score -> plan -> named level -> escalation, and Designer -> contract -> build"
    why_human: "Reader-clarity judgment"
  - test: "Read install/README.md level and retired-adapter sections; re-check code.claude.com/docs/en/sub-agents for the `agent.spawn` flattening claim"
    expected: "Wording clear to an upgrading user; the claim matches current docs"
    why_human: "Reader judgment plus an external doc the executor did not re-read"
---

# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key — Verification Report

**Phase Goal:** The kit can match each ticket to the right engineer level: a Tech Lead scores and pre-plans, one engineer role yields three level adapters on Claude Code, a Designer role exists, and roles can declare skills, while every role and adapter set still follows the filesystem
**Verified:** 2026-10-30T01:20:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

Most of the phase is real and tested. The TypeScript machinery (level derivation, generator 1:N, keyed ceilings, `skills:` grammar, installer stale-adapter report) is built and wired. The kit text for the Tech Lead, the rubric and the engineer levels is present and consistent. Two defects stand against the success criteria: the Designer adapter on Claude Code cannot publish its notes, and WF04's gate-exhausted escalation steps lose the human stop. The 20 failing tests in the orchestrator's post-merge run are not Phase 39 regressions (see Pre-existing reds).

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tech Lead scores a ticket on a written per-factor rubric, records score and level in a note and in the ticket body, and pre-plans dev tasks (TIER-01) | ✓ VERIFIED | `agent-factory/roles/tech-lead.md` exists (read edit shell, all sections, one WF16 ref). `agent-factory/checklists/complexity-rubric.md` has six factors F1-F6 with 0/1/2 definitions and measures, a mapping with ordered rules, unknowns and record format. Output section: a `decision` note with six scores, sum, level, adapter and dev tasks, plus a `## Tech Lead plan` section in the ticket body. WF04 step 2 wires it in. `tier-kit-text` and guard tests pass. Caveat: WR-07 ordering ambiguity (rubric counts "the dev plan" file list but the role scores before it writes tasks) is a warning, not a failure. |
| 2 | Claude Code gets three engineer adapters from one `software-engineer.md`: junior (haiku, effort medium), mid (sonnet), senior (opus), each with its own effort; other hosts treat level as guidance; MODEL-01 re-pinned by recorded decision (TIER-02, TIER-06) | ✓ VERIFIED | `software-engineer.md` has `levels: junior mid senior`. `.claude/agents/` holds `-junior` (haiku, effort medium), `-mid` (sonnet, medium), `-senior` (opus, high); no base `grugops-software-engineer.md`. `## Levels` says other hosts read the level from `## Tech Lead plan` and the model does not change. `adapter-byte-baseline.test.ts` passes (re-pin by recorded decision). `freshness:adapters` exit 0: 21 adapters, 0 byte differences. Live model/effort honoring is human-only (below). |
| 3 | Junior takes only plan-fixed tasks and never security/migration/concurrency/test-integrity; D-2 amendment and v2.1.293 floor recorded; stuck or twice-failed engineer escalates one level once via `failed-attempt` note and queue re-enqueue, never a relayed prompt (TIER-03, TIER-04) | ⚠️ PARTIAL (see gap 2) | Junior scope in `software-engineer.md` `## Levels` and rubric F3/junior exclusions. D-2 in `.planning/PROJECT.md:270` (status Pending), `factory.config.md:170`, the v2.1.293 floor in `install/README.md:2056` and `factory.config.md`. WF04 steps 14-16 + stop bullets: `failed-attempt`, `Blocked`, new `pending/` subtask, "spawn prompt carries the task reference and nothing else", no `model` parameter. Open: step 14-16 omit the named human on the exhausted-gate branch (CR-02 confirmed); WR-01 (re-plan loop unbounded, re-score is an uncounted second raise) and WR-04 (engineer trigger wording differs from WF04) weaken the "once" bound. |
| 4 | A Designer role sets design strategy and guidelines, and Frontend/UI reads them for each ticket's UI contract (TIER-05) | ✗ FAILED (partial) | `designer.md` exists with correct content; `frontend-ui.md:23,31` and WF14 step 2 read tokens from the Designer's published notes; WF14 step 1 runs the Designer; missing-token stop present. But the Designer cannot publish those notes as a Claude Code adapter: `capabilities: read edit` gives no Bash, and Workflow 16 admits notes only through `scripts/context-io.js` (unsealed otherwise). See gap 1 (CR-01 confirmed). Works only where the role runs in the main thread with a shell (role-switch hosts). |
| 5 | Adapter-name set, coordinator spawn allowlist, role/adapter counts, model/effort tiers and size ceilings follow the filesystem with no hand-typed list; a role can declare `skills:` admitted by the canonical frontmatter grammar (TIER-06, TIER-07) | ✓ VERIFIED | Orchestrator adapter `tools:` Agent(...) lists exactly 20 derived names including designer, tech-lead and the three level adapters. `ROLE_COUNT = 19`, 19 role files on disk, `ROLE_CEILINGS` two-sided key check (`check-foundation-guards.ts:3545-3589`), `LEVELS` table (`model-tiers.ts:1510`). `canonical-frontmatter.ts` carries `skills` in the role schema only; adapter schema unchanged (D-28); `scripts/fixtures/role-skills.md` admitted, adapter with `skills:`, block sequence, quoted scalar refused. check-foundation-guards, validate-agent-factory, freshness:adapters/catalog/hook-manifest/guarantees, lexicon, banned-claims, audit-register, kit-refs, build-parity, typecheck all exit 0 (re-run by this verifier). |

**Score:** 3 fully verified, 1 partial, 1 failed of 5 criteria. 0 truths are behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/roles/tech-lead.md` | Tech Lead role | ✓ VERIFIED | Substantive, wired (adapter generated, spawn grant, WF04 step 2, Orchestrator routing) |
| `agent-factory/checklists/complexity-rubric.md` | Per-factor rubric | ✓ VERIFIED | Six factors, mapping, record; indexed in `checklists/00-index.md` |
| `agent-factory/roles/software-engineer.md` | `levels:` + `## Levels` | ✓ VERIFIED | Three adapters generated |
| `.claude/agents/grugops-software-engineer-{junior,mid,senior}.md` | Pinned level adapters | ✓ VERIFIED | haiku/medium, sonnet/medium, opus/high; fresh |
| `agent-factory/roles/designer.md` | Designer role | ⚠️ HOLLOW on Claude Code | Content good; adapter lacks the tool to publish |
| `scripts/model-tiers.ts` `LEVELS`, `scripts/generate-role-adapters.ts` 1:N | Derivation | ✓ VERIFIED | Tests pass (model-tiers, generate-role-adapters, kit-model) |
| `scripts/canonical-frontmatter.ts` `skills` | Role grammar | ✓ VERIFIED | Tests pass; fixture admitted |
| `install/install.ts` stale-adapter report | Retired-adapter report | ✓ VERIFIED (with WR-06) | `install.test.ts -t "no longer ships"` 7 passed. Silent when ledger not `ok` (WR-06), so the README claim for pre-ledger installs overreaches |
| `.planning/PROJECT.md` D-2 record | Amendment recorded | ✓ VERIFIED | Present (decision row status still "Pending") |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| WF04 step 2 | Tech Lead role + rubric | Named step, Inputs list | WIRED | |
| WF04 step 4 | level adapter | Orchestrator creates pending subtask for the named adapter, spawn with no model/effort | WIRED | |
| WF04 steps 14-16 | WF05 exhaust stop | human confirmation | NOT_WIRED in steps (PARTIAL via stop bullet) | Gap 2 |
| WF14 step 1/2 | Designer notes | WF16 published notes | WIRED in text; BROKEN at the Claude Code adapter | Gap 1 |
| frontend-ui.md | Designer notes | Reads line 23, responsibility line 31 | WIRED | |
| Orchestrator grant | adapters | derived `Agent(...)` list | WIRED | 20 names, derived |
| role frontmatter `levels:` | adapter names/pins | `listAgentAdapterSpecs` + `LEVELS` | WIRED | |

### Data-Flow Trace (Level 4)

Not applicable to runtime data; the phase ships markdown and generators. The one data path that matters, Designer note -> shared context -> Frontend/UI read, is blocked on Claude Code (gap 1).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 10 phase test files (tier-kit-text, model-tiers, generate-role-adapters, canonical-frontmatter, adapter-byte-baseline, checkpoints, kit-model, check-foundation-guards, adapters-freshness, admission-protocol-docs) | `npx vitest run <files>` | 10 files, 1047 tests passed | ✓ PASS |
| Stale-adapter install report | `npx vitest run install/install.test.ts -t "no longer ships"` | 7 passed | ✓ PASS |
| 12 gates | see Truth 5 | all exit 0 | ✓ PASS |
| Live level adapter model/effort | needs live Claude Code | not run | ? SKIP -> human |

### Probe Execution

No phase-declared probe scripts. SKIPPED.

### Pre-existing reds (not Phase 39)

The orchestrator's 20 failures (context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4, uat-gate-exit-contract 5, installer-fs-census 1) were recorded in `deferred-items.md` during plan 39-01. The first five read `.planning/phases/27-*` and `31-*`, which do not exist in the tree at the plan commit `8a530552` either (the tree holds only phases 35-39 and 999.x). installer-fs-census fails on Node v26 `openAsBlobSync`. None touches Phase 39 files. check-diff-disposition (721) and check:flip-manifest are the recorded pre-existing reds. This verifier did not re-run the full suite.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| TIER-01 | 39-05, 39-08 | Tech Lead scores and pre-plans | ✓ SATISFIED | SC1 |
| TIER-02 | 39-01, 39-02, 39-07 | Three Claude Code adapters from one role | ✓ SATISFIED | SC2 (live run human) |
| TIER-03 | 39-05, 39-07, 39-10 | Junior limits, D-2, v2.1.293 floor | ✓ SATISFIED | SC3; WR-02 tightening advised |
| TIER-04 | 39-08 | One-level escalation via failed-attempt + re-enqueue | ⚠️ PARTIAL | Mechanics present; human stop lost in steps (gap 2); WR-01 |
| TIER-05 | 39-06, 39-09 | Designer sets guidelines; Frontend/UI reads them | ✗ BLOCKED on Claude Code | Gap 1 |
| TIER-06 | 39-01, 39-02, 39-03, 39-05, 39-06, 39-07, 39-10 | Derived sets, re-pinned baseline | ✓ SATISFIED | SC5 |
| TIER-07 | 39-04 | `skills:` admitted by grammar | ✓ SATISFIED | SC5 |

All seven IDs are declared in PLAN frontmatter and present in REQUIREMENTS.md (marked `[x]` / Complete). No orphaned requirements. REQUIREMENTS.md marks TIER-04 and TIER-05 Complete; this report finds them not yet fully achieved.

### Anti-Patterns Found

Debt-marker scan not repeated beyond review scope; no unreferenced TBD/FIXME/XXX was reported by the guards. Review findings independently weighed:

| Finding | Verdict by this verifier |
|---------|--------------------------|
| CR-01 Designer lacks shell | CONFIRMED. Blocker for SC4/TIER-05 on Claude Code (gap 1) |
| CR-02 WF04 re-enqueue without human in steps | CONFIRMED as a procedure defect; recorded as partial gap (gap 2). Not a merge/deploy path |
| WR-01 unbounded re-plan; re-score is a second raise | Confirmed in text (`tech-lead.md:34,48`, WF04:41,61). Should fix with gap 2 |
| WR-02 junior stop rule names only four tags | Confirmed (`software-engineer.md:37`). Meets SC3 wording literally; tightening advised |
| WR-03 level adapter descriptions near-identical | Confirmed: all read "Use when: Need code (one ticket). Level: X." Auto-delegation could pick haiku unscored. Advised |
| WR-04 engineer trigger "gate fails a second time" vs WF04 | Confirmed (`software-engineer.md:39`) |
| WR-05 "plan -> Tech Lead" collision | Confirmed (`orchestrator.md:46`) |
| WR-06 report silent when ledger not ok | Confirmed (`install.ts:8586` early return). README overclaim |
| WR-07 rubric scores before plan exists | Confirmed ambiguity; advised |
| WR-08..WR-10, IN-01..IN-06 | Not individually re-verified; none changes a success criterion. WR-10 (no CHANGELOG entry) is release-visible and should be handled before release |

### Human Verification Required

1. **Level adapters under live Claude Code >= 2.1.293.** Spawn each level adapter; expect haiku/medium, sonnet/medium, opus/high in `/tasks`.
2. **Reader clarity** of WF04 steps 2-4 and 14-16 and new stop bullets, and WF14 step 1 plus missing-token stop.
3. **install/README.md** upgrade wording and the `agent.spawn` flattening claim against current sub-agent docs (also WR-09: the two flattening lists disagree).

### Gaps Summary

Gap 1 (blocker): add `shell` to the Designer's capabilities, regenerate the adapters, and move the test pin and T-39-21 wording with it. One token fixes it; the pinned test currently guards the wrong value.

Gap 2 (partial): put the named-human confirmation into WF04 steps 15-16 on the gate-exhausted branch and correct the "per Workflow 05" reference. Bundle WR-01 (bound the Tech Lead's moves; a re-score that raises the level counts as the escalation) and WR-04 (use WF04's trigger wording in the engineer role) since they touch the same text.

Recommended in the same gap-closure round, not blocking: WR-02, WR-03, WR-05, WR-06, WR-07, WR-08, WR-10. The phase is within its four-round gap-closure cap (round 1).

---

_Verified: 2026-10-30T01:20:00Z_
_Verifier: Claude (gsd-verifier)_
