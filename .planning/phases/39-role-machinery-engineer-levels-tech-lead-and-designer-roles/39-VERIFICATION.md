---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
verified: 2026-10-30T09:45:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (0 behavior-unverified; live-host checks routed to human)
covered_files:
  - ".claude/agents/grugops-designer.md"
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
  - "CHANGELOG.md"
  - "agent-factory/checklists/complexity-rubric.md"
  - "agent-factory/roles/designer.md"
  - "agent-factory/roles/software-engineer.md"
  - "agent-factory/roles/tech-lead.md"
  - "agent-factory/workflows/04-ticket-to-pr.md"
  - "install/install.ts"
  - "scripts/canonical-frontmatter.ts"
  - "scripts/generate-role-adapters.ts"
  - "scripts/model-tiers.ts"
covered_digest: "v3:sha256:481e4b334921662c499a9a76875916c5f272fc7dc7c2ab5e652f83cab10da9db"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: "3/5 fully verified (SC3 partial, SC4 failed)"
  gaps_closed:
    - "SC4 / TIER-05 (CR-01): Designer adapter cannot reach the sanctioned writer; closed by plan 39-11 (designer.md now `capabilities: read edit shell`, adapter carries Bash)"
    - "SC3 / TIER-04 (CR-02): WF04 steps 14-16 lose the named-human stop; closed by plan 39-12 (step 15 stops for a named human after a gate BLOCKED_NEEDS_FIX; step 16 waits for that human; WF05 reference made accurate)"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "WR-12: WF04 steps 15-16 return a split or Architect move to Ready for Dev and re-enqueue an engineer, contradicting the stop-condition bullets for those two moves"
    category: other
    reason: "Procedure inconsistency on moves outside the SC3 wording (escalate once via failed-attempt + re-enqueue works). Fix in a follow-up round; not a safety path (no merge or deploy)."
    evidence_status: "text-confirmed at 04-ticket-to-pr.md lines 41-42 vs 57-58"
  - finding: "WR-13/WR-14: the move bound (one escalation plus one other move) has an undecided two-level re-score case and counts moves from `decision` notes that carry no `Move:` marker"
    category: other
    reason: "Weakens the once-only bound in edge cases; over-counting fails safe (early stop). Follow-up."
    evidence_status: "text-confirmed (tech-lead.md:34,48; WF04:41,61)"
  - finding: "WR-15/WR-16: the named-human stop lives in WF04 only (tech-lead.md has none), the confirmation is not recorded in a published note, and step 15 ignores the `exhaust_self_fix_budget` dial cell"
    category: other
    reason: "Stops more, never less, than the dial; an auditability and consistency follow-up, not a lost stop."
    evidence_status: "text-confirmed (WF04:41,60)"
  - finding: "WR-11: install/README.md says install and --dry-run print the presence note for an unreadable/malformed ledger, but install refuses first and prints no note (only --check does)"
    category: other
    reason: "Doc overclaim on one sub-case; the main WR-06 case (absent or pre-ledger marker) works. Reword the README and the install.ts comment."
    evidence_status: "reviewer probed by hand; consistent with install.ts STALE KIT ADAPTERS comment"
  - finding: "IN-07..IN-10 (wording duplicate in ledgerSays, narrow junior-exclusion statements in factory.config.md and model-tiers.ts, flattening lists omit maxEffortLevel, three untested presence branches)"
    category: other
    reason: "Quality follow-ups; no success criterion depends on them."
    evidence_status: "per 39-REVIEW.md, all recorded open in 39-REVIEW-DISPOSITION.md"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Install into a scratch repo on Claude Code >= 2.1.293 and spawn each of grugops-software-engineer-junior, -mid and -senior; also spawn grugops-designer and publish a design note"
    expected: "/tasks shows haiku/medium, sonnet/medium, opus/high respectively; the Designer reaches scripts/context-io.js through Bash and its note is admitted (not refused as unsealed); a level adapter is not auto-delegated for unscored work"
    why_human: "Needs a live Claude Code host; no host exists in CI. Live effort/model honoring and auto-delegation behavior are UNKNOWN - verify until run"
  - test: "Read WF04 steps 2-4 and 14-16 plus the stop bullets, and WF14 step 1 plus the missing-token stop"
    expected: "A first-time reader follows score -> plan -> named level -> escalation (with the named-human stop before any re-enqueue after a spent self-fix budget), and Designer -> contract -> build"
    why_human: "Reader-clarity judgment"
  - test: "Read install/README.md level, retired-adapter and flattening sections, CHANGELOG [Unreleased], and re-check code.claude.com/docs/en/sub-agents and the `agent.spawn` flattening claim"
    expected: "Wording clear to an upgrading user and claims no detection or enforcement grugops lacks (see advisory WR-11); the cited precedence facts match current docs"
    why_human: "Reader judgment plus an external doc the executor read once"
---

# Phase 39: Role machinery: engineer levels, Tech Lead and Designer roles, skills key — Verification Report

**Phase Goal:** The kit can match each ticket to the right engineer level: a Tech Lead scores and pre-plans, one engineer role yields three level adapters on Claude Code, a Designer role exists, and roles can declare skills, while every role and adapter set still follows the filesystem
**Verified:** 2026-10-30T09:45:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure round 1 (plans 39-11, 39-12, 39-13)

Both blocking gaps from the first verification are closed in the code at HEAD. All five roadmap success criteria hold. What remains is live-host and reader-judgment checks (status `human_needed`) plus a set of open review warnings that are quality follow-ups, not unmet must-haves.

## Re-verification of the two gaps

**Gap 1 (SC4 / TIER-05, CR-01) — CLOSED.**
- `agent-factory/roles/designer.md` front matter reads `capabilities: read edit shell`.
- `.claude/agents/grugops-designer.md` (generated) reads `tools: Read, Grep, Glob, Edit, Write, Bash`; `grep` finds no `mcp__` and no `Agent(` in it (least privilege kept; no `admit`, no `web`, no spawn grant).
- `freshness:adapters` exits 0, so the adapter is a faithful regeneration, not a hand edit.
- The tier-kit-text suite (which moved its pin from `read edit` to `read edit shell` and added the adapter-tools case) passes.

**Gap 2 (SC3 / TIER-04, CR-02) — CLOSED.**
- `agent-factory/workflows/04-ticket-to-pr.md` step 15 now reads: "After a gate `BLOCKED_NEEDS_FIX`, stop until a named human confirms the move. Return the ticket to `Ready for Dev`." Step 16 says to create the new `pending/` subtask "only once the step 15 move is recorded and, after a gate failure, confirmed by that human".
- The stop bullet no longer says "per Workflow 05" as the Tech Lead step; it says "A named human confirms the Tech Lead's decision before the re-enqueue (step 15). Workflow 05 sets this human stop when the self-fix budget is spent. `checkpoint: exhaust_self_fix_budget`". Workflow 05 line 70 does say "Stop and hand to a human" for `BLOCKED_NEEDS_FIX`, so the reference is now accurate. WF05 was not edited.
- The checkpoint tags stay once each in `## Stop conditions` (`exhaust_self_fix_budget`, `escalate_unadjudicable_result`); `scripts/checkpoints.test.ts` passes.
- The once-bound is now explicit (WR-01): one escalation plus at most one other move; a level-raising re-score is the escalation; options used up -> named human.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tech Lead scores a ticket on a written per-factor rubric, records score and level in a note and the ticket body, and pre-plans dev tasks (TIER-01) | ✓ VERIFIED | `tech-lead.md` and `checklists/complexity-rubric.md` present; WF04 step 2 wires the Tech Lead, now in write-then-score order (WR-07 fixed). `## Tech Lead plan` ticket-body section and `decision` note named in step 2. Guards and tier-kit-text tests pass. |
| 2 | Claude Code gets three engineer adapters from one `software-engineer.md`: junior (haiku, medium), mid (sonnet), senior (opus), each with its own effort; other hosts treat level as guidance; MODEL-01 re-pinned by recorded decision (TIER-02, TIER-06) | ✓ VERIFIED | Adapters on disk: junior `haiku`/`medium`, mid `sonnet`/`medium`, senior `opus`/`high`; no base `grugops-software-engineer.md`. Descriptions now differ per level and end "Level: <level>." with "Use when: the Tech Lead's plan names <adapter>; never for unscored work" (WR-03). `adapter-byte-baseline.test.ts` passes (five-transform level case, pin unchanged). Live model/effort honoring is human-only. |
| 3 | Junior takes only plan-fixed tasks and never security/migration/concurrency/test-integrity; D-2 amendment and v2.1.293 floor recorded; stuck or twice-failed engineer escalates one level once via `failed-attempt` note and queue re-enqueue, never a relayed prompt (TIER-03, TIER-04) | ✓ VERIFIED | Junior exclusions in `software-engineer.md` `## Levels` (now also every rubric risk tag, WR-02) and rubric. D-2 in `.planning/PROJECT.md` (row text present, decision status cell still `Pending` by convention), `factory.config.md:170`, floor at `install/README.md:2063`. WF04 steps 14-16: `failed-attempt` note, `Blocked` move, new `pending/` subtask, "spawn prompt carries the task reference and nothing else", no `model` parameter; named-human stop now in the steps. Advisory WR-12..WR-16 remain (see Advisory). |
| 4 | A Designer role sets design strategy and guidelines, and Frontend/UI reads them for each ticket's UI contract (TIER-05) | ✓ VERIFIED | `designer.md` content plus the shell route (Gap 1). `frontend-ui.md` reads the Designer's published notes; WF14 step 1 runs the Designer, step 2 reads tokens, missing-token stop present. Brownfield Reads bullet added (WR-08). Live publish via Bash is human-only. |
| 5 | Adapter-name set, coordinator spawn allowlist, role/adapter counts, model/effort tiers and size ceilings follow the filesystem with no hand-typed list; a role can declare `skills:` admitted by the canonical grammar (TIER-06, TIER-07) | ✓ VERIFIED | Orchestrator adapter `tools:` lists 20 derived `grugops-*` spawn names; 19 role files on disk; `ROLE_COUNT`, keyed `ROLE_CEILINGS`, `LEVELS` table in place. `canonical-frontmatter.ts` carries `skills` in the role schema only (adapter schema unchanged, D-28), one-line kebab grammar with block-sequence, quoted-scalar, duplicate and bad-token refusals; `scripts/fixtures/role-skills.md` admitted; the skills cases in `canonical-frontmatter.test.ts` pass. |

**Score:** 5/5 truths verified. 0 are behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agent-factory/roles/tech-lead.md`, `checklists/complexity-rubric.md` | Role and rubric | ✓ VERIFIED | Substantive, wired into WF04 and the Orchestrator route |
| `agent-factory/roles/software-engineer.md` + three level adapters | Levels | ✓ VERIFIED | Fresh, pinned |
| `agent-factory/roles/designer.md` + `.claude/agents/grugops-designer.md` | Designer with shell | ✓ VERIFIED | Gap 1 closed |
| `scripts/model-tiers.ts` LEVELS, `scripts/generate-role-adapters.ts` 1:N + level description | Derivation | ✓ VERIFIED | Tests pass; IN-01/IN-02 comments fixed |
| `scripts/canonical-frontmatter.ts` `skills` | Role grammar | ✓ VERIFIED | Tests pass |
| `install/install.ts` retired/unrecorded adapter report | Report-only note | ✓ VERIFIED (with WR-11 doc overclaim) | Presence note text at `install.ts:1015`; `unlinkSync|rmSync` count stays 16 (T-39-30); install/agents-record cases selected by the stale-adapter filters pass |
| `agent-factory/config/factory.config.md` flattening list, `CHANGELOG.md` [Unreleased] | WR-09/WR-10 | ✓ VERIFIED | Tech Lead, Designer, three adapters, `models.roles` keys present in CHANGELOG; no version number picked |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| WF04 step 2 | Tech Lead + rubric | named step | WIRED | |
| WF04 step 4 | level adapter | pending subtask for named adapter, no model/effort | WIRED | |
| WF04 steps 14-16 | WF05 exhaust stop | named human in step 15, tag in stop bullet | WIRED | Gap 2 closed |
| WF14 steps 1-2 | Designer notes | WF16 published notes | WIRED | Designer adapter now has Bash |
| designer adapter | `scripts/context-io.js` | Bash | WIRED | tools line carries Bash |
| Orchestrator grant | adapters | derived `Agent(...)` list, 20 names | WIRED | |
| role `levels:` / `skills:` | adapter names/pins / grammar | `listAgentAdapterSpecs`, `LEVELS`, `admitRole` | WIRED | |

### Data-Flow Trace (Level 4)

Phase ships markdown and generators; no runtime data source. The one data path that matters, Designer note -> shared context -> Frontend/UI read, was blocked at the adapter (Gap 1) and is now reachable; its live run is a human check.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase test files (canonical-frontmatter, tier-kit-text, generate-role-adapters, adapter-byte-baseline, model-tiers, kit-model, checkpoints, adapters-freshness) | `npx vitest run <files>` | 8 files, 693 passed | ✓ PASS |
| Stale/unrecorded adapter + census cases | `npx vitest run install/install.test.ts install/agents-record.test.ts -t "no longer ships\|cannot tell\|census\|REMOVAL"` | 37 passed | ✓ PASS |
| Build gate | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Gates: foundation-guards, imperative-lexicon, banned-claims, kit-refs, audit-register, validate-agent-factory (`VALIDATE_KIT_ROOT=.`) | node scripts/... | all `ALL CHECKS PASSED` | ✓ PASS |
| Freshness: adapters, catalog, hook-manifest, guarantees, host-entries, skill-twins; check:build-parity | `npm run -s ...` | all exit 0 | ✓ PASS |
| Diff disposition | `node scripts/check-diff-disposition.js` | 721 finding(s), the expected pre-existing count | ✓ PASS |
| Live level adapter model/effort; Designer publishing under a real host | needs live Claude Code | not run | ? SKIP -> human |

The full non-e2e suite was not re-run by this verifier. The orchestrator's run (20 failed | 10660 passed) lists all 20 failures in the six files in `deferred-items.md`; those read archived phase directories or a Node 26 fs export and do not touch phase 39 files.

### Probe Execution

No phase-declared probe scripts. SKIPPED.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| TIER-01 | 39-05, 39-08, 39-12 | Tech Lead scores and pre-plans | ✓ SATISFIED | SC1 |
| TIER-02 | 39-01, 39-02, 39-07, 39-11, 39-13 | Three Claude Code adapters from one role | ✓ SATISFIED | SC2 (live run human) |
| TIER-03 | 39-05, 39-07, 39-10, 39-12, 39-13 | Junior limits, D-2, v2.1.293 floor | ✓ SATISFIED | SC3 |
| TIER-04 | 39-08, 39-12 | One-level escalation via failed-attempt + re-enqueue | ✓ SATISFIED | SC3; named-human stop in the steps; advisory WR-12..WR-16 |
| TIER-05 | 39-06, 39-09, 39-11 | Designer sets guidelines; Frontend/UI reads them | ✓ SATISFIED | SC4; Gap 1 closed |
| TIER-06 | 39-01, 39-02, 39-03, 39-05, 39-06, 39-07, 39-10, 39-13 | Derived sets, re-pinned baseline | ✓ SATISFIED | SC5 |
| TIER-07 | 39-04 | `skills:` admitted by grammar | ✓ SATISFIED | SC5; see note below |

All seven IDs are declared in PLAN frontmatter and present in REQUIREMENTS.md. No orphaned requirements.

**TIER-07 bookkeeping.** TIER-07 is satisfied in code (`ROLE_SCHEMA`/`admitRole` with the `skills` grammar, fixture admitted, refusal cases tested, adapter schema unchanged) and plan 39-04's SUMMARY lists it under `requirements-completed`. REQUIREMENTS.md still shows `- [ ] **TIER-07**` (line 52) and "Gaps Found" in the traceability row (line 145). That is stale: commit `252d7dd0` reverted the premature "Complete" marks after the first verification, and the 39-11/12/13 executors only re-ticked IDs their own plans carried (TIER-07 belongs to no gap-closure plan). Recommended action for the orchestrator: flip TIER-07 to `[x]` / `Complete` in REQUIREMENTS.md when closing the phase. This verifier did not edit it.

### Anti-Patterns Found

No unreferenced TBD/FIXME/XXX flagged by the foundation guards or imperative-lexicon/banned-claims checks. Open review warnings weighed as follows (all recorded `open` in `39-REVIEW-DISPOSITION.md`; 0 critical):

| Finding | Severity here | Why not a gap |
|---------|---------------|---------------|
| WR-11 README overclaims the malformed/unreadable-ledger presence note | Warning (doc) | Main WR-06 case (absent/pre-ledger marker) works and is tested; install still refuses and names the marker problem for the malformed case. Reword the README and comment. |
| WR-12 split/Architect moves re-enqueue an engineer in steps 15-16 | Warning (procedure) | Real inconsistency with the stop bullets, but outside SC3's wording (escalate once via failed-attempt + re-enqueue) and no merge/deploy path. Should be fixed in a later round. |
| WR-13/WR-14 move-bound edges and uncountable notes | Warning | Bound exists in text and fails safe when over-counted; hardening, not absence. |
| WR-15/WR-16 human stop only in WF04, confirmation unrecorded, dial ignored | Warning | Stop is present and in the numbered steps (the exact Gap 2 ask); it errs toward stopping more. Auditability follow-up. |
| IN-07..IN-10 | Info | Wording, tests and list completeness. |

These are quality follow-ups. None leaves a must-have or requirement unmet at the success-criterion wording. They should be carried to a follow-up round or an explicit human deferral before release; WR-12 and WR-15 are the most worth fixing because they touch the escalation procedure and its audit trail.

### Human Verification Required

1. **Level adapters and Designer under live Claude Code >= 2.1.293.** Spawn each level adapter and the Designer. Expect haiku/medium, sonnet/medium, opus/high in `/tasks`; the Designer publishes a typed note through `scripts/context-io.js`; level adapters are not auto-picked for unscored work. Why human: needs a live host.
2. **Reader clarity** of WF04 steps 2-4 and 14-16 and the stop bullets, and WF14 step 1 plus the missing-token stop. Why human: judgment.
3. **install/README.md, CHANGELOG and the flattening facts.** Wording for an upgrading user (including the WR-11 sub-case) and a re-check of the cited Claude Code docs. Why human: judgment plus an external source.

### Gaps Summary

No gaps. Both blockers from the first verification are closed and verified in the code. The phase goal is achieved at the level the automated checks can reach; the live-host behavior of the three level adapters and the Designer's Bash publishing route is the remaining human check. Open review warnings WR-11..WR-16 and IN-07..IN-10 are recorded as advisory follow-ups. Housekeeping: flip TIER-07 to Complete in REQUIREMENTS.md. Gap-closure round 1 of the four-round cap is spent.

---

_Verified: 2026-10-30T09:45:00Z_
_Verifier: Claude (gsd-verifier)_
