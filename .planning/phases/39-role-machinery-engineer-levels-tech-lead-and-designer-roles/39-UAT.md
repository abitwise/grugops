---
status: partial
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
source: [39-01-SUMMARY.md, 39-02-SUMMARY.md, 39-03-SUMMARY.md, 39-04-SUMMARY.md, 39-05-SUMMARY.md, 39-06-SUMMARY.md, 39-07-SUMMARY.md, 39-08-SUMMARY.md, 39-09-SUMMARY.md, 39-10-SUMMARY.md, 39-11-SUMMARY.md, 39-12-SUMMARY.md, 39-13-SUMMARY.md]
started: 2026-10-30T11:55:07Z
updated: 2026-10-30T14:35:04.433Z
---

## Current Test

[testing complete]

## Tests

### 1. LEVELS effort rationales argue quality only
expected: In scripts/model-tiers.ts, the LEVELS rationale and each effortRationale (junior, mid, senior) argue only the quality case for that level's model and effort, and make no cost, price, token or speed claim.
result: pass
source_ref: 39-01 D5

### 2. MODEL-01 re-pin against the Phase 39 start tree
expected: The MODEL-01 test (header and the 39-03 SUMMARY Deviations) measures against the Phase 39 start tree. Every adapter is byte-identical to it, the records are empty, the effort rule checks both directions, and the replacement cases are at least as strong as the retired ones.
result: pass
source_ref: 39-03 D4

### 3. Tech Lead role reads well, rubric starting values sensible
expected: agent-factory/roles/tech-lead.md reads clearly in caveman voice. The complexity rubric's starting thresholds (marked LOW confidence) look like sensible defaults for real tickets.
result: pass
source_ref: 39-05 D5

### 4. Designer role reads well, opus tier acceptable
expected: agent-factory/roles/designer.md reads clearly in caveman voice, and you accept its opus tier choice (assumption A7).
result: pass
source_ref: 39-06 D4

### 5. Level adapters run on their pinned model and effort (live)
expected: In a scratch repo on Claude Code 2.1.293 or later, spawn grugops-software-engineer-junior, -mid and -senior by name, passing no model or effort. /tasks shows haiku/medium, sonnet/medium and opus/high respectively.
result: issue
reported: "let's set grugops-software-engineer-junior to haiku / xhigh ; grugops-software-engineer-mid to sonnet / high and grugops-software-engineer-senior to opus / medium"
severity: major
evidence: "Live probe 2026-10-30 on Claude Code 2.1.314 (this repo, read-only task, spawned by name with no model/effort parameter): junior ran claude-haiku-5-5 at effort medium, mid claude-sonnet-5-5 at medium, senior claude-opus-5-5 at high, read from each sub-agent transcript. The pin mechanism works; the values are being re-decided by G-39-5"
source_ref: 39-07 D6

### 6. Levels and factory.config.md wording makes no false claim
expected: The `## Levels` section and the levels wording in agent-factory/config/factory.config.md read clearly and claim no enforcement grugops lacks.
result: issue
reported: "fix what you noticed" (on: factory.config.md line 134 says a `models` key that is not `preset` or `roles` is refused, but `effort` is legal since Phase 34; line 136 says two key sets are closed and omits `models.effort`'s own)
severity: minor
source_ref: 39-07 D7

### 7. WF04 score, plan, level and escalation read clearly
expected: agent-factory/workflows/04-ticket-to-pr.md steps 2-4 and its stop bullets read clearly. A reader follows score, then plan, then the named level, then escalation, and the escalation's human stop sits where they expect it.
result: issue
reported: "please test this and next tests yourself and give me report what can't be tested" (delegated; Claude's reading: steps 2-4 and the stop bullets read clearly, but step 15 is one ~400-word paragraph holding six decisions with both named-human stops buried mid-paragraph)
severity: minor
source_ref: 39-08 D6

### 8. WF14 Designer to Frontend-UI split reads clearly
expected: WF14 step 1 and the missing-design-token stop bullet read clearly. A reader can tell the Designer (product-wide strategy) apart from Frontend-UI (the per-ticket contract), and follows Designer, then contract, then build.
result: pass
note: "checked by Claude on the user's delegation, 2026-10-30"
source_ref: 39-09 D5

### 9. Install README levels, retired adapter and flattening sections
expected: In install/README.md, the level, retired-adapter and flattening sections read clearly to an upgrading user and claim no detection or enforcement grugops lacks (see advisory WR-11).
result: pass
note: "checked by Claude on the user's delegation, 2026-10-30"
source_ref: 39-10 D5

### 10. Auto-delegation honors the level descriptions (live)
expected: On a live Claude Code host, unscored work is never auto-delegated to a level adapter (junior, mid or senior). Each level is reached only when the Tech Lead's plan names it.
result: blocked
blocked_by: other
reason: "i think it is hard to test before milestone is completed since things need to be finished first" (live host check deferred until the milestone's remaining phases land; run in a scratch repo then)
source_ref: 39-11 D3

### 11. Gate-failure path reaches the named-human stop
expected: A first-time reader following WF04 steps 14-16 on a gate failure reaches the named-human stop before any re-enqueue once the self-fix budget is spent.
result: pass
note: "checked by Claude on the user's delegation, 2026-10-30"
source_ref: 39-12 D6

### 12. README says when a note replaces verify / FAIL
expected: install/README.md says when a note replaces the verify / FAIL result (v2.1 or earlier, or an absent or unreadable ledger), and that matches the v2.1 and v2.2 tags.
result: pass
note: "checked by Claude on the user's delegation, 2026-10-30"
source_ref: 39-13 D2

### 13. CHANGELOG [Unreleased] entry
expected: CHANGELOG.md [Unreleased] names the Tech Lead, the Designer, the rubric, the three level adapters (junior floor v2.1.293), the skills: key, the pin change, and the removed grugops-software-engineer adapter with its hand-delete remedy. It picks no version number.
result: pass
note: "checked by Claude on the user's delegation, 2026-10-30"
source_ref: 39-13 D4

### 14. Designer note is admitted on a live host
expected: In the same scratch repo, spawn grugops-designer and have it publish a design note. It reaches scripts/context-io.js through Bash, and the note is admitted, not refused as unsealed.
result: blocked
blocked_by: other
reason: "i think it is hard to test before milestone is completed since things need to be finished first" (live host check deferred until the milestone's remaining phases land; run in a scratch repo then)
source_ref: live designer

### 15. listAgentAdapterSpecs / listAgentAdapterNames derive adapter identity from role `levels`; the live tree derives today's 17 names
expected: listAgentAdapterSpecs / listAgentAdapterNames derive adapter identity from role `levels`; the live tree derives today's 17 names
result: pass
source: automated
coverage_id: 39-01 D1

### 16. Every malformed levels declaration and every case-folded name collision throws naming the role file(s)
expected: Every malformed levels declaration and every case-folded name collision throws naming the role file(s)
result: pass
source: automated
coverage_id: 39-01 D2

### 17. LEVELS table with D-14 pins and levelTableRefusals; resolveAdapterAssignments and zeroConfigAssignments implement the D-14/D-15/D-16 precedence
expected: LEVELS table with D-14 pins and levelTableRefusals; resolveAdapterAssignments and zeroConfigAssignments implement the D-14/D-15/D-16 precedence
result: pass
source: automated
coverage_id: 39-01 D3

### 18. MODEL_TIERS_COUNT derived from preset-governed roles; TIERED coverage judged against presetGovernedStems
expected: MODEL_TIERS_COUNT derived from preset-governed roles; TIERED coverage judged against presetGovernedStems
result: pass
source: automated
coverage_id: 39-01 D4

### 19. The generator emits one adapter per AgentAdapterSpec: level adapters carry the role's tools, the ` Level: <level>.` description, the D-14 model and effort, the `## Levels` body line, and a place in the generated grant; the live tree regenerates byte for byte
expected: The generator emits one adapter per AgentAdapterSpec: level adapters carry the role's tools, the ` Level: <level>.` description, the D-14 model and effort, the `## Levels` body line, and a place in the generated grant; the live tree regenerates byte for byte
result: pass
source: automated
coverage_id: 39-02 D1

### 20. A coordinator role that declares `levels` is refused by the generator naming orchestrator.md, writing nothing
expected: A coordinator role that declares `levels` is refused by the generator naming orchestrator.md, writing nothing
result: pass
source: automated
coverage_id: 39-02 D2

### 21. KIT-03 compares listAgentAdapterNames with the adapter directory and the grant closure; a deleted level adapter, a re-planted base adapter and a hand-added grant name are each red by name, and the unplanted levels mirror is green
expected: KIT-03 compares listAgentAdapterNames with the adapter directory and the grant closure; a deleted level adapter, a re-planted base adapter and a hand-added grant name are each red by name, and the unplanted levels mirror is green
result: pass
source: automated
coverage_id: 39-02 D3

### 22. guard_model_assignment and guard_effort_assignment key every adapter by its adapter stem, accept a per-level override key, and degrade a refused configuration to zeroConfigAssignments
expected: guard_model_assignment and guard_effort_assignment key every adapter by its adapter stem, accept a per-level override key, and degrade a refused configuration to zeroConfigAssignments
result: pass
source: automated
coverage_id: 39-02 D4

### 23. The adapter freshness gate requires each adapter's own zero-config value: a levels mirror is fresh, a committed or announced junior at inherit is red by name
expected: The adapter freshness gate requires each adapter's own zero-config value: a levels mirror is fresh, a committed or announced junior at inherit is red by name
result: pass
source: automated
coverage_id: 39-02 D5

### 24. Only scripts/kit-model.ts declares the agent namespace constant among non-test modules
expected: Only scripts/kit-model.ts declares the agent namespace constant among non-test modules
result: pass
source: automated
coverage_id: 39-02 D6

### 25. ROLE_CEILINGS key set equals the derived role basenames both ways; a role with no ceiling and a ceiling with no role are each red by name, sorted, and the unplanted mirror is green
expected: ROLE_CEILINGS key set equals the derived role basenames both ways; a role with no ceiling and a ceiling with no role are each red by name, sorted, and the unplanted mirror is green
result: pass
source: automated
coverage_id: 39-03 D1

### 26. Every derived role is checked for exactly one Workflow 16 reference
expected: Every derived role is checked for exactly one Workflow 16 reference
result: pass
source: automated
coverage_id: 39-03 D2

### 27. No live-kit adapter, grant or role-row count is a literal 16 or 17 in the listed tests outside the two two-sided pins
expected: No live-kit adapter, grant or role-row count is a literal 16 or 17 in the listed tests outside the two two-sided pins
result: pass
source: automated
coverage_id: 39-03 D3

### 28. ROLE_SCHEMA, admitRole and roleSkillsOf exist; the fixture is admitted and its two skills parse in declaration order
expected: ROLE_SCHEMA, admitRole and roleSkillsOf exist; the fixture is admitted and its two skills parse in declaration order
result: pass
source: automated
coverage_id: 39-04 D1

### 29. Every live roles-directory file is admitted under ROLE_SCHEMA; none declares a skills value; the key union over the corpus plus the fixture equals ROLE_SCHEMA both ways
expected: Every live roles-directory file is admitted under ROLE_SCHEMA; none declares a skills value; the key union over the corpus plus the fixture equals ROLE_SCHEMA both ways
result: pass
source: automated
coverage_id: 39-04 D2

### 30. guard_role_frontmatter admits all roles-directory files on the live tree and is red naming the file and refusal code for a planted flow-list skills line
expected: guard_role_frontmatter admits all roles-directory files on the live tree and is red naming the file and refusal code for a planted flow-list skills line
result: pass
source: automated
coverage_id: 39-04 D3

### 31. Every malformed skills declaration is refused by name: flow list, namespaced name, bare key, quoted value (grammar codes); repeat, non-kebab, empty token, block sequence (roleSkillsOf reasons naming the accepted form)
expected: Every malformed skills declaration is refused by name: flow list, namespaced name, bare key, quoted value (grammar codes); repeat, non-kebab, empty token, block sequence (roleSkillsOf reasons naming the accepted form)
result: pass
source: automated
coverage_id: 39-04 D4

### 32. The adapter authority did not move: CANONICAL_SCHEMA is still the eleven keys, admit() refuses an adapter skills line as unknown-key, and the generator writes no skills line for a role that declares one
expected: The adapter authority did not move: CANONICAL_SCHEMA is still the eleven keys, admit() refuses an adapter skills line as unknown-key, and the generator writes no skills line for a role that declares one
result: pass
source: automated
coverage_id: 39-04 D5

### 33. complexity-rubric.md states the F3 = 2 tags (auth, money, PII, security, migration, concurrency, test integrity), that any one exclusion makes junior impossible, the ordered mapping, the band boundaries, the adjacency rule, unknowns, the record order and the LOW-confidence label
expected: complexity-rubric.md states the F3 = 2 tags (auth, money, PII, security, migration, concurrency, test integrity), that any one exclusion makes junior impossible, the ordered mapping, the band boundaries, the adjacency rule, unknowns, the record order and the LOW-confidence label
result: pass
source: automated
coverage_id: 39-05 D1

### 34. tech-lead.md carries the required sections, one WF16 and one WF18 reference, points at the rubric without restating it, and states the D-04..D-07, D-10, D-17, D-19, D-21 contract
expected: tech-lead.md carries the required sections, one WF16 and one WF18 reference, points at the rubric without restating it, and states the D-04..D-07, D-10, D-17, D-19, D-21 contract
result: pass
source: automated
coverage_id: 39-05 D2

### 35. 18 roles and 18 adapters, the new adapter granted at model: inherit with no effort line, every derived count moved once by measurement
expected: 18 roles and 18 adapters, the new adapter granted at model: inherit with no effort line, every derived count moved once by measurement
result: pass
source: automated
coverage_id: 39-05 D3

### 36. The disposition gate is back at the pre-phase 721 findings with a row for every added clause
expected: The disposition gate is back at the pre-phase 721 findings with a row for every added clause
result: pass
source: automated
coverage_id: 39-05 D4

### 37. designer.md has tier core, capabilities read edit, every required section, one Workflow 16 and one Workflow 18 reference, the D-24/D-25/D-26 contract and the WCAG 2.2 AA bar
expected: designer.md has tier core, capabilities read edit, every required section, one Workflow 16 and one Workflow 18 reference, the D-24/D-25/D-26 contract and the WCAG 2.2 AA bar
result: pass
source: automated
coverage_id: 39-06 D1

### 38. 19 roles and 19 adapters. grugops-designer runs on model: inherit with no effort line and is granted to the coordinator. Every derived count moved once, by measurement
expected: 19 roles and 19 adapters. grugops-designer runs on model: inherit with no effort line and is granted to the coordinator. Every derived count moved once, by measurement
result: pass
source: automated
coverage_id: 39-06 D2

### 39. The disposition gate is back at the pre-phase 721 findings, with a row for every added clause
expected: The disposition gate is back at the pre-phase 721 findings, with a row for every added clause
result: pass
source: automated
coverage_id: 39-06 D3

### 40. software-engineer.md declares `levels: junior mid senior`; Claude Code gets the three level adapters with the D-14 pins and no base adapter; the coordinator grants all 20 derived names
expected: software-engineer.md declares `levels: junior mid senior`; Claude Code gets the three level adapters with the D-14 pins and no base adapter; the coordinator grants all 20 derived names
result: pass
source: automated
coverage_id: 39-07 D1

### 41. MODEL-01: each level adapter equals the baseline base adapter with exactly five transforms; the removal and the three additions are recorded
expected: MODEL-01: each level adapter equals the baseline base adapter with exactly five transforms; the removal and the three additions are recorded
result: pass
source: automated
coverage_id: 39-07 D2

### 42. guard_kit_counts is red by name when the levels line is removed, on `levels: junior mid` and on `levels: junior mid senior lead` (also refused by the generator); green on the unplanted mirror
expected: guard_kit_counts is red by name when the levels line is removed, on `levels: junior mid` and on `levels: junior mid senior lead` (also refused by the generator); green on the unplanted mirror
result: pass
source: automated
coverage_id: 39-07 D3

### 43. The `## Levels` section states the Claude Code adapters, guidance-only levels elsewhere with no model advice, the junior scope and BLOCKED rule, deviation with a recorded reason, and the failed-attempt note per WF04
expected: The `## Levels` section states the Claude Code adapters, guidance-only levels elsewhere with no model advice, the junior scope and BLOCKED rule, deviation with a recorded reason, and the failed-attempt note per WF04
result: pass
source: automated
coverage_id: 39-07 D4

### 44. The D-2 amendment, the v2.1.293 floor, the level keys, D-16 and the run-time flattening paths are documented; the packaging template is count-free
expected: The D-2 amendment, the v2.1.293 floor, the level keys, D-16 and the run-time flattening paths are documented; the packaging template is count-free
result: pass
source: automated
coverage_id: 39-07 D5

### 45. WF04 runs the Tech Lead step right after the unchanged Definition of Ready step, the pull waits for the plan note, and the ticket stays in `Ready for Dev` while the Tech Lead plans
expected: WF04 runs the Tech Lead step right after the unchanged Definition of Ready step, the pull waits for the plan note, and the ticket stays in `Ready for Dev` while the Tech Lead plans
result: pass
source: automated
coverage_id: 39-08 D1

### 46. Named dispatch: the exact adapter, non-fork, no `model` or `effort` parameter, the level never re-decided, other hosts read `## Tech Lead plan`
expected: Named dispatch: the exact adapter, non-fork, no `model` or `effort` parameter, the level never re-decided, other hosts read `## Tech Lead plan`
result: pass
source: automated
coverage_id: 39-08 D2

### 47. orchestrator.md routes the Tech Lead and the Designer, keeps every earlier route, and is 7255 B (at most 7359)
expected: orchestrator.md routes the Tech Lead and the Designer, keeps every earlier route, and is 7255 B (at most 7359)
result: pass
source: automated
coverage_id: 39-08 D3

### 48. Escalation path: failed-attempt note, Blocked naming the Tech Lead, one move with at most one escalation, a new pending/ subtask on the same context, a spawn prompt carrying only the task reference, and a named human at the end with no retry loop
expected: Escalation path: failed-attempt note, Blocked naming the Tech Lead, one move with at most one escalation, a new pending/ subtask on the same context, a spawn prompt carrying only the task reference, and a named human at the end with no retry loop
result: pass
source: automated
coverage_id: 39-08 D4

### 49. Checkpoint counts moved by measurement and the WF05 human stop is intact
expected: Checkpoint counts moved by measurement and the WF05 human stop is intact
result: pass
source: automated
coverage_id: 39-08 D5

### 50. WF14 runs the Designer step before the Frontend/UI contract step, with the first-UI-work cadence, the no-guidelines case, the new-direction re-run and the `supersedes` ordering
expected: WF14 runs the Designer step before the Frontend/UI contract step, with the first-UI-work cadence, the no-guidelines case, the new-direction re-run and the `supersedes` ordering
result: pass
source: automated
coverage_id: 39-09 D1

### 51. The WF14 contract step and frontend-ui.md read the design tokens from the Designer's published notes and never name new ones; Frontend/UI keeps the inventory, five states, WCAG 2.2 AA and visual baseline
expected: The WF14 contract step and frontend-ui.md read the design tokens from the Designer's published notes and never name new ones; Frontend/UI keeps the inventory, five states, WCAG 2.2 AA and visual baseline
result: pass
source: automated
coverage_id: 39-09 D2

### 52. The missing-token stop goes to the Designer, untagged, and the stop-bullet count moved by measurement
expected: The missing-token stop goes to the Designer, untagged, and the stop-bullet count moved by measurement
result: pass
source: automated
coverage_id: 39-09 D3

### 53. The disposition gate is back at the pre-phase 721 findings
expected: The disposition gate is back at the pre-phase 721 findings
result: pass
source: automated
coverage_id: 39-09 D4

### 54. Re-installing the current kit over an older kit's install names the adapter it no longer ships (verify, exit 3), leaves its bytes unchanged, carries its record, and a later uninstall removes it
expected: Re-installing the current kit over an older kit's install names the adapter it no longer ships (verify, exit 3), leaves its bytes unchanged, carries its record, and a later uninstall removes it
result: pass
source: automated
coverage_id: 39-10 D1

### 55. --dry-run names the stale adapter and changes nothing; a user-edited stale adapter is reported as the user's, left byte for byte, and not recorded
expected: --dry-run names the stale adapter and changes nothing; a user-edited stale adapter is reported as the user's, left byte for byte, and not recorded
result: pass
source: automated
coverage_id: 39-10 D2

### 56. --check reports the stale adapter as a FAIL with install's remedy; a clean install gets no such line; a short-checkout --check keeps its WARN tier
expected: --check reports the stale adapter as a FAIL with install's remedy; a clean install gets no such line; a short-checkout --check keeps its WARN tier
result: pass
source: automated
coverage_id: 39-10 D3

### 57. install/README.md documents the level adapters (Claude Code only), the v2.1.293 floor, UNKNOWN - verify effort on Haiku 4.5, that --check does not probe the version, the flattening paths and the stale-adapter remedy, with no hand-typed specialist count
expected: install/README.md documents the level adapters (Claude Code only), the v2.1.293 floor, UNKNOWN - verify effort on Haiku 4.5, that --check does not probe the version, the flattening paths and the stale-adapter remedy, with no hand-typed specialist count
result: pass
source: automated
coverage_id: 39-10 D4

### 58. Designer declares read edit shell; its generated adapter carries tools Read, Grep, Glob, Edit, Write, Bash, with no spawn grant and no mcp__ admission tool
expected: Designer declares read edit shell; its generated adapter carries tools Read, Grep, Glob, Edit, Write, Bash, with no spawn grant and no mcp__ admission tool
result: pass
source: automated
coverage_id: 39-11 D1

### 59. The three level adapters say they are used only when the Tech Lead's plan names them; every other adapter is byte-identical to the MODEL-01 baseline
expected: The three level adapters say they are used only when the Tech Lead's plan names them; every other adapter is byte-identical to the MODEL-01 baseline
result: pass
source: automated
coverage_id: 39-11 D2

### 60. In a brownfield repo the Designer reads memory-bank/brownfield-map.md and the shipped styles as its starting direction; the role stays under its ceiling
expected: In a brownfield repo the Designer reads memory-bank/brownfield-map.md and the shipped styles as its starting direction; the role stays under its ceiling
result: pass
source: automated
coverage_id: 39-11 D4

### 61. Five review findings recorded fixed; diff disposition back at the pre-phase 721
expected: Five review findings recorded fixed; diff disposition back at the pre-phase 721
result: pass
source: automated
coverage_id: 39-11 D5

### 62. After a gate BLOCKED_NEEDS_FIX, WF04 step 15 stops for a named human before the return to Ready for Dev, step 16 waits for that human, and the stop bullet's reference to Workflow 05 is accurate
expected: After a gate BLOCKED_NEEDS_FIX, WF04 step 15 stops for a named human before the return to Ready for Dev, step 16 waits for that human, and the stop bullet's reference to Workflow 05 is accurate
result: pass
source: automated
coverage_id: 39-12 D1

### 63. One escalation and one other move per ticket; a level-raising re-score is the escalation; the used-up stop bullet matches
expected: One escalation and one other move per ticket; a level-raising re-score is the escalation; the used-up stop bullet matches
result: pass
source: automated
coverage_id: 39-12 D2

### 64. The Tech Lead writes the dev tasks before scoring them, in tech-lead.md, WF04 step 2 and the rubric
expected: The Tech Lead writes the dev tasks before scoring them, in tech-lead.md, WF04 step 2 and the rubric
result: pass
source: automated
coverage_id: 39-12 D3

### 65. The engineer's failed-attempt trigger uses WF04's words; a junior stops BLOCKED on every rubric risk tag, F3 = 1 included
expected: The engineer's failed-attempt trigger uses WF04's words; a junior stops BLOCKED on every rubric risk tag, F3 = 1 included
result: pass
source: automated
coverage_id: 39-12 D4

### 66. The Orchestrator routes `ready-ticket dev plan -> Tech Lead`, keeps every earlier route and stays at or under 7,359 B
expected: The Orchestrator routes `ready-ticket dev plan -> Tech Lead`, keeps every earlier route and stays at or under 7,359 B
result: pass
source: automated
coverage_id: 39-12 D5

### 67. Six review findings recorded fixed; diff disposition held at the pre-phase 721
expected: Six review findings recorded fixed; diff disposition held at the pre-phase 721
result: pass
source: automated
coverage_id: 39-12 D7

### 68. install, --dry-run and --check name every unshipped grugops adapter the ledger cannot vouch for in a note, leave its bytes alone, record nothing and keep the clean run's exit status; a ledger-recorded one keeps only its verify / FAIL line
expected: install, --dry-run and --check name every unshipped grugops adapter the ledger cannot vouch for in a note, leave its bytes alone, record nothing and keep the clean run's exit status; a ledger-recorded one keeps only its verify / FAIL line
result: pass
source: automated
coverage_id: 39-13 D1

### 69. One count-free list of run-time flattening settings in factory.config.md, including the mod agent.spawn hook with source and read date; the README names and points
expected: One count-free list of run-time flattening settings in factory.config.md, including the mod agent.spawn hook with source and read date; the README names and points
result: pass
source: automated
coverage_id: 39-13 D3

### 70. All 18 review findings carry a disposition; the phase gate matches the recorded baseline
expected: All 18 review findings carry a disposition; the phase gate matches the recorded baseline
result: pass
source: automated
coverage_id: 39-13 D5

## Summary

total: 70
passed: 65
issues: 3
pending: 0
skipped: 0
blocked: 2

## Gaps

- gap_id: G-39-5
  truth: "The engineer level adapters pin junior haiku/xhigh, mid sonnet/high and senior opus/medium (human re-decision of D-14 during UAT, 2026-10-30), and spawning each by name with no override runs on that model and effort"
  status: failed
  reason: "User reported: let's set grugops-software-engineer-junior to haiku / xhigh ; grugops-software-engineer-mid to sonnet / high and grugops-software-engineer-senior to opus / medium"
  severity: major
  test: 5
  root_cause: "Not a defect: the human re-decided the D-14 level pins during UAT. The shipped LEVELS table (scripts/model-tiers.ts:1510) pins haiku/medium, sonnet/medium, opus/high, and every surface that cites those pins follows it"
  artifacts:
    - path: "scripts/model-tiers.ts"
      issue: "LEVELS effort values and both effortRationale texts per row argue the old pins (senior 'deeper reasoning'); header comments at ~1466 and ~1484 cite D-14 values"
    - path: "scripts/adapter-byte-baseline.test.ts"
      issue: "RECORDED_ADDED level records carry effort literals medium/medium/high"
    - path: ".claude/agents/grugops-software-engineer-{junior,mid,senior}.md"
      issue: "generated adapters carry effort: medium/medium/high; regenerate"
    - path: "scripts/model-tiers.test.ts, scripts/generate-role-adapters.test.ts, scripts/tier-kit-text.test.ts, scripts/check-foundation-guards.test.ts, install/install.test.ts"
      issue: "assertions or fixtures that name the old level efforts"
    - path: "agent-factory/config/factory.config.md, install/README.md, CHANGELOG.md"
      issue: "user-facing text names the old level efforts"
  missing:
    - "Record the re-decision of D-14 (and the effort half of D-2) as a dated decision in PROJECT.md Key Decisions, with the new pins"
    - "Change LEVELS efforts to junior xhigh, mid high, senior medium and rewrite each effortRationale to argue the new effort on quality only (no digit, no cost/speed word)"
    - "Update RECORDED_ADDED effort literals with a reason naming the re-decision; MODEL-01 is not loosened"
    - "Regenerate the level adapters and refresh the compiled .js and freshness outputs"
    - "Update every test, doc and CHANGELOG line that names the old level efforts"
    - "Note that the level efforts no longer equal the tiered effort rule's output (opus high, others medium); record that the divergence is deliberate"
    - "Re-run the live check: /tasks shows haiku/xhigh, sonnet/high, opus/medium"

- gap_id: G-39-6
  truth: "factory.config.md's `models` Refusals and 'What is closed' paragraphs name the block's real closed key sets and claim no refusal grugops does not make"
  status: failed
  reason: "User reported: fix what you noticed (stale `models` key-set wording at factory.config.md lines 134 and 136)"
  severity: minor
  test: 6
  root_cause: "Stale since Phase 34 added `effort` to MODELS_KEYS (scripts/model-tiers.ts:293); the Phase 29.1-08 Refusals sentence (commit cd074846) and the 'Two key sets are closed' sentence were never updated"
  artifacts:
    - path: "agent-factory/config/factory.config.md"
      issue: "line 134: 'a key inside the `models` block that is not `preset` or `roles`' implies `effort` is refused; MODELS_KEYS is preset, roles, effort"
    - path: "agent-factory/config/factory.config.md"
      issue: "line 136: 'Two key sets are closed' omits the `models.effort` block's own keys (EFFORT_KEYS, scripts/model-tiers.ts:360) and its `roles` keys"
  missing:
    - "Line 134: name the three legal `models` keys (`preset`, `roles`, `effort`), matching the refusal message built from MODELS_KEYS"
    - "Line 136: state every closed key set: `models` own keys, `models.roles` keys, `models.effort` own keys and `models.effort.roles` keys"
    - "Run the doc/style disposition and foundation guards that cover factory.config.md (docs/audit/29-style-dispositions) and add any disposition rows they require"

- gap_id: G-39-7
  truth: "WF04 step 15 reads clearly to a first-time reader, with both named-human stops easy to find"
  status: failed
  reason: "User delegated the reading check; Claude found step 15 one ~400-word paragraph holding six decisions"
  severity: minor
  test: 7
  root_cause: "Step 15 of agent-factory/workflows/04-ticket-to-pr.md (line 41) packs the four moves, the per-ticket move limit, the re-score stop (escalate_unadjudicable_result), the gate-failure stop (exhaust_self_fix_budget), the confirmation finding and the board moves into one numbered step"
  artifacts:
    - path: "agent-factory/workflows/04-ticket-to-pr.md"
      issue: "step 15 is a single run-on paragraph; the two human stops sit mid-paragraph"
  missing:
    - "Split step 15 into labelled sub-bullets (moves; limits; re-score stop; gate-failure stop; confirmation record; board move) with no change in meaning"
    - "Keep the workflow under its size ceiling and keep every phrase the WF04 text assertions pin (scripts/tier-kit-text.test.ts) or update them deliberately"

