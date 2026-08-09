---
phase: 27-spawn-correctness-kit-set-authority
verified: 2026-08-09T16:30:00Z
status: gaps_found
score: 6/10 requirements verified clean (4 FAILED or structurally-undermined — KIT-03, SPAWN-03, SPAWN-04 each carrying a live independently-reproduced spawn-grant bypass at the gate, plus SPAWN-02 carrying the same underlying parser defect as an unresolved dependency)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/10 (round 5, 2026-08-03T07:00:00Z)
  gaps_closed:
    - "KIT-02 round-5 (hooks/outputStyles/mcpServers/lspServers/experimental.* plugin-root component directories in no scan set) — CLOSED. scripts/kit-model.ts now carries PLUGIN_MANIFEST_COMPONENT_SCHEMA (9 entries) partitioned by partitionPluginComponentClaims into forbidden (7) + covered-elsewhere (1, skills via listPluginSkillAdapters) + exempt-by-name (1, hooks, with a stated reason) — verified directly in scripts/kit-model.ts:244-409 and the guardKitCounts() PASS line, which now names the 9/7/1/1 partition."
    - "IN-04 round-7/8 (a foreign key claimed by two buckets reported twice, feeding a set-equality guard message with a phantom duplicate) — CLOSED per 27-46-SUMMARY.md: the foreign arm de-duplicated with a stated first-occurrence order, proven behaviour-preserving by a byte-identical guardKitCounts() PASS line (same sha256) before and after."
    - "WR-02 round-7/8 (parseFrontmatter's fence strip deleted lines before the frontmatter region was located, truncating/mangling real grants) — CLOSED STRUCTURALLY per 27-45-SUMMARY.md: the deletion was removed from the entry point entirely (locate-then-flatten, no strip); a column-0 fence inside the region is now a named refusal, adjudicated against libyaml; a 15-shape adversarial probe found five additional truncated-success shapes, all closed by the same edit."
    - "IN-01 round-7 (an unreachable defensive branch, checkGrantOccurrenceBalance's fourth-kind arm, never exercised by any case) — CLOSED per 27-45-SUMMARY.md: extracted as an exported pure function reachable from a test-constructed fourth kind; wording proven byte-unchanged apart from a forced identifier rename."
    - "IN-05 round-7 (multi-document YAML streams undocumented; unclear what the module does with a second frontmatter region) — RECORDED per 27-45-SUMMARY.md: the module header now states measured module vs libyaml behaviour (module reads region 1 only; libyaml treats the stream as 6 documents on the measured example), carries an explicit UNKNOWN - verify against the platform, and the module is deliberately NOT changed to read further regions."
    - "the eighth spelling of the founding failure (stripComment's crossing predicate re-derived per call site, three independent seedings of one fact) — CLOSED per 27-43-SUMMARY.md: the three seeding sites became one unconditional assignment each reading a single walk-computed ScalarState; nodeStartQuote deleted; seven RED-before/GREEN-after rows reproduced with a libyaml column, plus three live shipped-surface reproductions (skills/plan/SKILL.md + its distribution twin, and .claude/agents/grugops-qe-e2e.md) flipping exit 0 -> exit 1."
    - "WR-01 round-7 (the D-49 sweep's completeness claim rested on the product of two hand-listed axes, never checked against a real loader) — CLOSED per 27-44-SUMMARY.md: a 312-cell generated corpus is checked in one process against /usr/bin/ruby -ryaml, with the disagreement set asserted EQUAL (not subset) to two named, bounded, safe-direction exemptions, and the unsafe direction asserted empty independently of the exemption machinery."
  gaps_remaining:
    - "KIT-03 / SPAWN-04 — the SAME frontmatter-module node-start defect that round 8 closed for the ENUMERATED families (D-51/D-52) is, per the round-8 code review (27-REVIEW-GAPS-8.md CR-01/CR-02), still not total over YAML's own grammar: four more node-start positions (block-mapping key:value on an indented line, compact nested sequence `- - `, block explicit key `? ` at depth 0, JSON-like `:` adjacency in a flow mapping) reproduce the identical silent no-grant bypass at the gate, and a `nodeOnKeyLine` defect invents/truncates names on the success arm feeding the KIT-03 closure equality and coordinator-resolution-precheck. This is a NEW round-8 finding, not a round-5 regression, but it is the same class of gap round 5 flagged (KIT-03/SPAWN-04 carrying a live reproduced bypass) recurring under round 8's own fix."
    - "SPAWN-03 — UNKNOWN - verify against the real Claude Code platform remains open; the round-8 SUMMARYs record it explicitly and no live capture has landed (deferred to Phase 33 / GAP-D1)."
  regressions: []
gaps:
  - truth: "On Claude Code the coordinator's Agent(<allowlist>) grant is honored by the runtime, and no non-coordinator adapter carries the Agent tool at all — a mechanism that holds on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04)"
    status: failed
    reason: >
      Independently reproduced by the orchestrator this session (not merely reviewer-claimed) on
      hermetic `git archive HEAD` mirrors, planting `allowed-tools: "Read, # x,` / `  Agent(grugops-orchestrator)"`
      (Family A/C/F shapes — block-mapping nested value, flow-map JSON adjacency, block explicit key)
      into BOTH distribution twins of the non-coordinator skill `plan` (`skills/plan/SKILL.md` and
      `.claude/skills/grugops-plan/SKILL.md`). Control (one-line grant): exit 1, `FAIL WR-05
      coordinator-spawn-grant violation`. All three planted families: exit 0, `ALL CHECKS PASSED`.
      Ruby/psych/libyaml independently confirms the grant is real in the loaded document. This is the
      ninth consecutive round in which a module-no-grant / loader-grant bypass survived a green suite,
      per 27-REVIEW-GAPS-8.md CR-01.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "stripComment's mayBegin (node-start) predicate is gated to four flow-only spellings (frontmatter.ts:650-679, startsNode at :1044); YAML defines at least four more node-start positions outside that union, all reproduced end to end at the gate."
    missing:
      - "A structural fix to the walk's node-start answer (per CR-01's proposed remedy: derive mayBegin from structural position rather than adding a fifth enumerated arm) plus a corpus that can express block-mapping, compact-nested-sequence, block-explicit-key and JSON-adjacency shapes (WR-01 in 27-REVIEW-GAPS-8.md: the current 312-cell corpus structurally cannot build any of the four)."
  - truth: "The referential-integrity oracle's set equality (coordinator grant == adapter directory == role corpus) is sound because a name is never silently dropped or altered when computing the grant closure. (KIT-03)"
    status: failed
    reason: >
      guard_referential_integrity (KIT-03) computes its grant-closure set via the SAME
      grantedAgentNames()/frontmatter.ts path guard_wr05 consumes (verified by reading
      scripts/check-foundation-guards.ts:2096-2185, which states this explicitly: "The grant closure
      and the coordinator marker are both read through scripts/frontmatter.ts — the SAME module
      guard_wr05 reads"). CR-02 (27-REVIEW-GAPS-8.md) reproduces an invented-name defect
      (`nodeOnKeyLine` never raised for a value whose node begins on a continuation line) that feeds
      "straight into the KIT-03 closure equality" per the review's own text, and states the module's
      promise "a name is never silently dropped or altered" is false. On today's ACTUAL
      `.claude/agents/grugops-orchestrator.md` the grant is single-line (verified directly: `tools:
      Agent(grugops-agents-md-scribe, ..., grugops-uat-planner), Read, Grep, Glob, Edit, Write, Bash`
      on one line), so the live closure computes correctly today and `guard_referential_integrity`
      genuinely PASSES ("17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)",
      confirmed by direct execution this session). The failure is in the SOUNDNESS CLAIM the oracle
      makes about itself ("this guard's soundness depends entirely on the derivation seeing what the
      platform loads") rather than in today's committed grant text — but that claim is the whole basis
      SC2 asks to be trusted, and it is demonstrably false for any future multi-line grant edit.
    artifacts:
      - path: "scripts/frontmatter.ts"
        issue: "cur.nodeOnKeyLine is written exactly once (frontmatter.ts:1161), on the key line only; a value whose node begins on the first continuation line is never marked, so startsNode stays true for every subsequent continuation line, inventing/truncating names."
    missing:
      - "CR-02's proposed fix: rename to nodeStarted, set it at both places a scalar's node can begin (key line and first content-bearing continuation), with the stated block-sequence exception; add a grantedAgentNames-level (name-set) assertion to the differential harnesses per WR-03, since both current harnesses only check token presence and cannot see a divergent name set."
deferred:
  - truth: "SPAWN-03's real-platform confirmation that the main-thread coordinator's Agent(<allowlist>) grant is actually honored by Claude Code at runtime (as opposed to being confirmed only by reading the platform's own published sub-agent documentation)."
    addressed_in: "Phase 33"
    evidence: "ROADMAP.md Phase 33: 'Live Capture & Windows Portability — the captured live run that proves spawning and discharges GAP-D1'; the standing-obligations table (# 1, GAP-D1) explicitly assigns 'one captured live dual-path run' to Phase 33 (CAP-01)."
human_verification:
  - test: "Start a real Claude Code session with `claude --agent grugops-orchestrator` (or the equivalent main-thread wiring) on this repository and observe whether the Orchestrator's Agent(<allowlist>) grant is actually runtime-enforced — i.e., that it can spawn a role subagent and that a role subagent cannot spawn a further subagent."
    expected: "The coordinator, running as the main-thread agent, successfully invokes the Agent tool to delegate to a named role subagent; a role subagent invoked this way has no Agent tool available to it."
    why_human: "This is a live-platform runtime behavior claim (documented in agent-factory/roles/orchestrator.md and agent-factory/packaging/adapters.md as 'the grant is honored only because the Orchestrator is main-thread') that no static grep or gate can confirm; the phase's own SUMMARYs mark it UNKNOWN - verify and defer the capture to Phase 33 / GAP-D1."
  - test: "Decide whether to retire the 27-43 acceptance criterion 'scripts/validate-agent-factory.ts goes from exit 0 to a named non-zero failure on the non-coordinator adapter surface' (carried forward, open, owned by no plan across 27-43 through 27-46)."
    expected: "A human decision: either retire the criterion (the standing recommendation in all four round-8 SUMMARYs, on the grounds that the validator has zero occurrences of spawn/frontmatter/wr05 and is not a spawn-grant surface at all — measured, not assumed), or explicitly require a second spawn-grant predicate be added to the validator (which every round-8 plan's own prohibitions and this module's founding discipline argue against)."
    why_human: "This is a scope/acceptance-criterion decision, not a code defect; no plan in the phase owns it, and forcing a resolution mechanically would itself create the weaker-duplicate-predicate shape the phase has spent eight rounds deleting."
---

# Phase 27: Spawn Correctness & Kit-Set Authority Verification Report

**Phase Goal:** Role agents actually execute in their own sessions on Claude Code — and every guard and validator scan set is derived from the filesystem *before* the 17 new adapter files exist, so they land inside the guards rather than outside them.
**Verified:** 2026-08-09T16:30:00Z
**Status:** gaps_found
**Re-verification:** Yes — after round-8 gap closure (27-43…27-46), replacing the stale round-5 record.

## Goal Achievement

### Observable Truths (by roadmap Success Criterion)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every scan set (`WR05_SCAN`→`SPAWN_GRANT_SCAN`, `ADAPTERS`, `CTX_WORKFLOWS`→`WORKFLOW_FILES`, validator role/workflow lists) resolves through `kit-model.ts` with an asserted count; no stale literal survives. (KIT-01, KIT-02) | ✓ VERIFIED | Read directly: `check-foundation-guards.ts` imports `listRoles`/`listWorkflows`/`listAgentAdapters` from `kit-model.ts` and derives `ROLE_FILES` (:1762), `SPAWN_GRANT_SCAN` (:511, renamed off the old hand-listed `WR05_SCAN`), `ADAPTERS` (:390). `validate-agent-factory.ts` imports `listRoles`/`listWorkflows` and derives `WORKFLOWS`/`ROLES` (:171,183) rather than hand-listing. `install/kit-source.ts` states its policy is defined by `kit-model.listAgentAdapters`, and `install.test.ts` compares the installed set against that same authority. `guardKitCounts()` prints and asserts the two-sided counts (17/19/7/7, 33-member scan) at guard run time — confirmed by executing `node scripts/check-foundation-guards.js` this session (exit 0, `PASS kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters ...`). Round 5's specific KIT-02 gap (hooks/outputStyles/mcpServers/lspServers outside any scan set) is closed: `PLUGIN_MANIFEST_COMPONENT_SCHEMA` now carries 9 entries partitioned 7 forbidden + 1 covered-elsewhere + 1 exempt-by-name (`hooks`), confirmed in `kit-model.ts:244-409` and the guard's own PASS line naming the 9/7/1/1 partition. |
| 2 | The referential-integrity oracle fails RED against a broken tree and turns GREEN only when the three sets (coordinator grant, adapter directory, role corpus) are truly the same set. (KIT-03) | ✗ FAILED (soundness undermined, not today's tree) | `guard_referential_integrity` genuinely PASSES today: executed `node scripts/check-foundation-guards.js` this session, confirmed `PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)`, and confirmed the real coordinator file's grant is a single-line `tools: Agent(...)` value (not vulnerable to the currently-known multi-line bypass shapes). But the oracle computes its closure through the identical `frontmatter.ts` parser CR-01/CR-02 (27-REVIEW-GAPS-8.md) prove is not total and can invent/drop names on its own success arm — the review states this "is fed straight into the KIT-03 closure equality," directly contradicting the module's own promise ("a name is never silently dropped or altered") that the oracle's trustworthiness depends on. See Gaps. |
| 3 | All 17 role adapters exist, are generated thin pointers (not copies), and a byte difference between a committed adapter and a fresh regeneration fails the freshness gate closed. (SPAWN-01, SPAWN-02) | ✓ VERIFIED | `ls .claude/agents/*.md` = 17 files, each 28 lines (43 for the coordinator) of pointer prose (`Read agent-factory/roles/<role>.md now and act as that role. The role file does the thinking; this adapter only points at it.`) with a `GENERATED — do not hand-edit` banner — confirmed by reading `grugops-software-engineer.md` in full. `node scripts/adapters-freshness.js` run this session: exit 0, `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s)`. Live fail-closed test performed this session: appended one byte to a committed adapter → `node scripts/adapters-freshness.js` → exit 1, `STALE: 1 of 17 committed adapter(s) differ from a fresh regeneration: grugops-software-engineer.md`; reverted, re-ran → exit 0; working tree confirmed clean afterward (`git status --porcelain` empty). |
| 4 | On Claude Code the coordinator runs main-thread so its grant is runtime-honored, and no non-coordinator adapter carries the `Agent` tool at all — a mechanism holding on both the main-thread and subagent paths. (SPAWN-03, SPAWN-04) | ✗ FAILED | Already established by direct orchestrator reproduction this session (see task preamble): a live `Agent(grugops-orchestrator)` grant hidden in three distinct YAML node-start shapes, planted into both distribution twins of the non-coordinator `plan` skill on hermetic mirrors, reaches the loaded document (confirmed via `/usr/bin/ruby -ryaml`) while the foundation gate reports `ALL CHECKS PASSED` at exit 0 — the control (identical grant, one line) correctly exits 1. Ninth consecutive round with this class of bypass surviving a green suite (27-REVIEW-GAPS-8.md CR-01). SPAWN-03's main-thread runtime-honoring claim itself remains `UNKNOWN - verify` against the real platform (deferred to Phase 33/GAP-D1, per the phase's own SUMMARYs and ROADMAP.md's standing-obligations table). |
| 5 | `guard_adapter_body` reds on pre-v2.0 handoff/single-window prose; `orchestrator.md` stays below its 7570-byte FAIL ceiling (ceiling unchanged); the advertised Claude Code floor reads v2.1.219+ at depth 3 everywhere. (SPAWN-05, SPAWN-06, SPAWN-07) | ✓ VERIFIED | Executed `node scripts/check-foundation-guards.js` this session: `PASS SPAWN-05: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary...`; `PASS agent-factory/roles/orchestrator.md 7090B within ceiling` (ceiling constant unchanged: `check-foundation-guards.ts:1967` still reads `"7570 7165"`, and `orchestrator.md` at 7090B is below both figures — 480B of margin against 7570B, up from round-5's 8B). `grep -rn "grugops-orchestrator.md:25\|single-window\|handoff packet\|routing Orchestrator"` across `agent-factory/roles/*.md` and `.claude/agents/*.md` returns zero matches — the surviving reference the roadmap names is gone. `grep -rn "v2.1.219\|depth 3\|CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH\|v2.1.217"` across shipped docs confirms consistent wording (`agent-factory/roles/orchestrator.md:88`, `agent-factory/packaging/adapters.md:35,47`, `REQUIREMENTS.md:36`) — depth 3 on v2.1.219+, with 217–218 documented as a known-bad depth-1 window, no lingering "depth 5" claim found. |

**Score:** 3/5 roadmap success criteria cleanly verified; 2/5 (criteria 2 and 4) FAILED with reproduced evidence, both traced to the same underlying `scripts/frontmatter.ts` node-start defect family (CR-01/CR-02).

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SPAWN-03's real-platform confirmation that the main-thread grant is runtime-honored (as opposed to confirmed only against the platform's published docs) | Phase 33 | ROADMAP.md standing-obligations table, item 1 (GAP-D1 → Phase 33 CAP-01): "one captured live dual-path run → flip A3/DOG-02" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/kit-model.ts` | Sole filesystem-derivation authority for roles/workflows/adapters with asserted counts | ✓ VERIFIED | 967 lines; exports `ROLE_COUNT=17`, `WORKFLOW_COUNT=19`, `SKILL_ADAPTER_COUNT=7`, `PLUGIN_SKILL_ADAPTER_COUNT=7`, `SPAWN_GRANT_SCAN_COUNT=33`; `listRoles`/`listWorkflows`/`listAgentAdapters`/`listSkillAdapters`/`listPluginSkillAdapters`/`spawnGrantScan` all `readdirSync`-backed |
| `.claude/agents/grugops-<role>.md` × 17 | Generated thin-pointer adapters | ✓ VERIFIED | All 17 present, 28 lines each (43 for coordinator), banner-marked GENERATED, freshness gate exit 0 |
| `scripts/adapters-freshness.ts` (compiled `.js`) | Byte-gates adapters against fresh regeneration | ✓ VERIFIED | Live-tested this session: fails closed on a 1-byte plant, passes clean on revert |
| `scripts/check-foundation-guards.ts` `guard_referential_integrity` (KIT-03) | Three-way set-equality oracle, no exception list | ⚠️ WIRED but soundness-compromised | Passes on today's tree; its closure computation shares the CR-01/CR-02-affected `frontmatter.ts` code path |
| `scripts/check-foundation-guards.ts` `guard_wr05` | Rogue-spawner / spawn-grant enforcement | ✗ BYPASSED | Live reproduced bypass, exit 0 on a real hidden grant (see Gaps) |
| `agent-factory/roles/orchestrator.md` | ≤7570B FAIL ceiling, ceiling unchanged | ✓ VERIFIED | 7090B, ceiling constant unchanged in source |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `check-foundation-guards.ts` | `kit-model.ts` | `import { listRoles, listAgentAdapters, ... }` | ✓ WIRED | Confirmed by grep and by the guard's own printed derivation counts |
| `validate-agent-factory.ts` | `kit-model.ts` | `import { listRoles, listWorkflows }` | ✓ WIRED | `deriveKitNames(listWorkflows, ...)`, `deriveKitNames(listRoles, ...)` |
| `install/kit-source.ts` | `kit-model.ts` | policy comment + `install.test.ts` cross-check | ✓ WIRED | `install.test.ts` imports `listAgentAdapters`/`listSkillAdapters` and asserts the installed set matches |
| `guard_referential_integrity` (KIT-03) | `guard_wr05` | shared `scripts/frontmatter.ts` grant-closure computation | ⚠️ WIRED, shared defect | Both consumers demonstrably share the same not-total node-start predicate; a defect in one is a latent defect in both |
| `adapters-freshness.ts` | `generate-role-adapters.ts` | fresh regeneration + byte compare | ✓ WIRED | Live-tested this session |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Kit-model counts assert correctly at guard run time | `node scripts/check-foundation-guards.js` | `PASS kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17/19/7/7)`; exit 0 | ✓ PASS |
| Referential-integrity oracle passes on today's real tree | (same run) | `PASS KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)` | ✓ PASS (see Gaps for soundness caveat) |
| Adapter freshness gate fails closed on a byte plant | append 1 byte to a committed adapter; `node scripts/adapters-freshness.js` | exit 1, `STALE: 1 of 17 committed adapter(s) differ from a fresh regeneration` | ✓ PASS |
| Adapter freshness gate clean after revert | revert the byte, re-run | exit 0, `0 byte difference(s)` | ✓ PASS |
| guard_wr05 catches a one-line rogue spawn grant | plant `allowed-tools: "Read, Agent(grugops-orchestrator)"` on one line in a non-coordinator surface (control, from the orchestrator's pre-established reproduction) | exit 1, `FAIL WR-05 coordinator-spawn-grant violation` | ✓ PASS |
| guard_wr05 catches the SAME grant folded across a YAML node-start shape (block mapping / flow JSON adjacency / block explicit key) | same plant, folded (Family A/C/F, pre-established) | exit 0, `ALL CHECKS PASSED` | ✗ FAIL — this is the phase-blocking gap |
| `orchestrator.md` under its byte ceiling | `wc -c agent-factory/roles/orchestrator.md` | 7090B against unchanged 7570B ceiling constant | ✓ PASS |
| No pre-v2.0 handoff/single-window prose survives | `grep -rn "grugops-orchestrator.md:25\|single-window\|handoff packet\|routing Orchestrator"` over adapters/roles | zero matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| KIT-01 | 27-01, 27-10 | `kit-model.ts` sole filesystem authority, asserted counts, replaces 5 stale hard-coded lists | ✓ SATISFIED | `kit-model.ts` present with `readdirSync`-backed listers and asserted `*_COUNT` constants; every named consumer (guards, validator, installer) imports it. REQUIREMENTS.md's own `[ ]` checkbox is stale (not updated since round 5); code evidence contradicts the unchecked box. |
| KIT-02 | 27-01, 27-03, 27-04, 27-10, 27-11, 27-13 | Every guard/validator scan set derived from `kit-model.ts`, never hand-listed | ✓ SATISFIED | `SPAWN_GRANT_SCAN`, `ADAPTERS`, `ROLE_FILES`/`WORKFLOW_FILES`, validator `ROLES`/`WORKFLOWS` all confirmed derived. Round-5's hooks/outputStyles gap closed via `PLUGIN_MANIFEST_COMPONENT_SCHEMA` (9-entry partition). Round-8's own de-duplication defect (IN-04) closed with a byte-identical-output proof (27-46-SUMMARY.md). |
| KIT-03 | 27-01, 27-07, 27-10, 27-12, 27-19 | Referential-integrity oracle, RED-before/GREEN-after, no exception list | ✗ BLOCKED | Passes on today's tree, but its closure computation is proven (CR-02, 27-REVIEW-GAPS-8.md) to share a name-inventing/dropping defect with `guard_wr05`, directly contradicting the "a name is never silently dropped or altered" promise the oracle's trust depends on. |
| SPAWN-01 | 27-06, 27-07, 27-15 | 17 role adapters, generated thin pointers, never copies | ✓ SATISFIED | 17 files confirmed on disk, 28-line pointer bodies, GENERATED banner. |
| SPAWN-02 | 27-07, 27-11 | Freshness gate byte-gates adapters, fail-closed on drift | ✓ SATISFIED (mechanism); ⚠️ same shared risk as KIT-03/SPAWN-04 | Live-tested fail-closed and clean-pass this session. Not itself defeated by CR-01/CR-02 (it does a raw byte compare, not a semantic frontmatter parse), but its upstream generator/guard chain shares the affected module. |
| SPAWN-03 | 27-09 | Coordinator wired main-thread so grant is runtime-honored | ✗ BLOCKED (platform claim unconfirmed) + upstream mechanism bypassed | Documentation and in-repo half present (`agent-factory/roles/orchestrator.md:88`, `packaging/adapters.md`); real-platform confirmation explicitly `UNKNOWN - verify`, deferred to Phase 33/GAP-D1. Also: the mechanism SPAWN-03 depends on (a trustworthy grant) is the one CR-01 defeats. |
| SPAWN-04 | 27-08, 27-12 | Non-coordinator adapters omit `Agent` entirely; mechanism holds both paths | ✗ BLOCKED | Directly reproduced live bypass at the gate (CR-01): a non-coordinator surface can carry a spawn grant undetected by `guard_wr05` when folded into one of four YAML node-start shapes. |
| SPAWN-05 | 27-08, 27-14 | `guard_adapter_body` reds on pre-v2.0 prose | ✓ SATISFIED | Confirmed PASS this session; zero stale-reference grep hits. |
| SPAWN-06 | 27-05 | `orchestrator.md` below 7570B ceiling, ceiling unchanged | ✓ SATISFIED | 7090B measured; ceiling constant `"7570 7165"` unchanged in source. |
| SPAWN-07 | 27-05 | Claude Code floor corrected to v2.1.219+/depth 3 everywhere, 217–218 documented as known-bad | ✓ SATISFIED | Consistent wording confirmed across `orchestrator.md`, `packaging/adapters.md`, `REQUIREMENTS.md`; no stale "depth 5" reference found. |

No orphaned requirements: all 10 IDs (KIT-01..03, SPAWN-01..07) map to Phase 27 in `.planning/REQUIREMENTS.md`'s traceability table and are each claimed by at least one of the 46 plans in this phase directory.

### Anti-Patterns Found

None blocking. `grep -n "TBD|FIXME|XXX"` over the round-8-touched files (`scripts/frontmatter.ts`, `scripts/kit-model.ts`, `scripts/frontmatter.test.ts`, `scripts/kit-model.test.ts`, `scripts/generate-role-adapters.test.ts`) returns only `U+XXXXX` code-point-label text in comments/tests — not debt markers. No `TODO`/`HACK`/`PLACEHOLDER` or stub-shaped returns found in the artifacts reviewed for this round.

### Human Verification Required

1. **Real-platform main-thread spawn confirmation (SPAWN-03).** See frontmatter `human_verification`. Deferred by design to Phase 33 (GAP-D1); recorded here so it is not lost at phase boundary.
2. **`validate-agent-factory.ts` criterion disposition.** A human decision on whether to retire the unsatisfiable 27-43 acceptance criterion, carried open across four SUMMARYs with a consistent "retire it" recommendation and no plan ownership.

### Gaps Summary

The phase closed all eight round-7 findings (KIT-02's plugin-component gap, WR-01, WR-02, IN-01, IN-04, IN-05, and the two round-7 CRs) with measured, reproduced evidence — the round-8 SUMMARYs (27-43 through 27-46) are unusually well-evidenced, with RED/GREEN transcripts against a real YAML loader, live shipped-surface reproductions, and byte-identical-output proofs for behaviour-preserving refactors. That work is real and verified directly against the code, not accepted on SUMMARY narrative.

But the round-8 code review (27-REVIEW-GAPS-8.md, read in full for this verification) independently reproduces a NINTH bypass of the same class the phase exists to close: `scripts/frontmatter.ts`'s node-start detection, while now correct for the flow-collection shapes D-51 enumerated, is still not total over YAML 1.2's grammar. Four more node-start positions (block-mapping value on an indented line, compact nested sequence, block explicit key at depth 0, JSON-adjacent flow-mapping key) produce the identical silent no-grant bypass, reproduced end to end at the gate on hermetic mirrors this session — not merely asserted by the reviewer. A second, independent defect in the same module (`nodeOnKeyLine` never raised for a continuation-started scalar) invents or truncates names on the module's own success arm, and that defective name set is what both `guard_wr05` and the KIT-03 referential-integrity oracle consume.

This means Success Criterion 4 (SPAWN-03/SPAWN-04) is not met — the mechanism the criterion asks to hold ("no non-coordinator adapter carries the Agent tool ... a mechanism that holds on both paths") is defeated live at the gate. It also means Success Criterion 2 (KIT-03)'s trust basis is undermined even though the oracle happens to pass on today's committed, single-line coordinator grant: the criterion asks the oracle to be trustworthy evidence that the three sets agree, and the review shows that trust is not yet earned by the underlying parser. Everything else — KIT-01, KIT-02, SPAWN-01, SPAWN-02 (as a mechanism), SPAWN-05, SPAWN-06, SPAWN-07 — is independently verified against the codebase in this report and holds.

The phase cannot be marked `passed` while a live, reproduced, gate-level spawn-grant bypass exists on non-coordinator surfaces. This is not a documentation or scope gap; it is the exact founding defect (a role or surface silently carrying spawn capability the guards do not see) that Phase 27 was chartered to close, recurring for the ninth consecutive round under a fix that closed eight of nine.

---

_Verified: 2026-08-09T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
