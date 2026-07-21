---
phase: quick-260721-hjm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agent-factory/README.md
  - README.md
  - install/README.md
  - docs/faq.md
  - docs/catalog/README.md
  - CONTRIBUTING.md
autonomous: true
requirements: [DOC-AUDIT]

must_haves:
  truths:
    - "agent-factory/README.md contains NO stale phase-gating claims (no 'ships in Phase N', 'lands in Phase N', 'does not exist yet', 'until it ships', 'until then') — AGENTS.md, roles, workflows, and the installer all ship now"
    - "The Install section of agent-factory/README.md points at the real installer (node install/install.js, Node 22+) and cross-references install/README.md — the 'installers ship in Phase 5 / UNKNOWN-verify install commands' text is gone"
    - "Version strings agree with agent-factory/VERSION (0.1.0) everywhere they appear in user docs (README.md, install/README.md, .claude-plugin/plugin.json)"
    - "docs/catalog/README.md role/workflow counts match the actual kit — a regenerate produces no diff"
    - "Every 'UNKNOWN - verify' marker survives; no command is fabricated"
    - "grugbrain.dev attribution + the non-affiliation disclaimer remain visible in README.md; all safety/compliance/money text stays clear voice (no caveman voice added to it)"
  artifacts:
    - agent-factory/README.md
    - docs/catalog/README.md
  key_links:
    - "README.md Quickstart step 3 link -> agent-factory/README.md (the linked deep-dive guide must be current)"
---

<objective>
Audit grugops's user-facing documentation against current v2.0 reality (TypeScript tooling layer, Node 22+ prerequisite, single `install/install.js` installer, plugin + standalone forms, shared verified context replacing handoffs) and tighten prose for concision — without fabricating any command or weakening any brand/safety invariant.

Purpose: The deep-dive guide the root README links to (`agent-factory/README.md`) still tells users that AGENTS.md, the roles/workflows, and the installer "ship in a later phase / do not exist yet." All of that shipped. A new user following that guide is actively misled. This audit brings the linked guide to current reality and sweeps the rest of the user-facing set for version/claim drift.

Output: Corrected `agent-factory/README.md`; a regenerated (or verified-current) catalog; any drifted version strings reconciled; a short audit note (returned inline, not written as a report file) recording what changed, what was verified clean, and the one known gap (absent CHANGELOG.md).
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Source-of-truth docs to align against (already current — do NOT rewrite these):
@AGENTS.md
@install/README.md

# Primary audit target and its linking entry point:
@agent-factory/README.md
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bring agent-factory/README.md to current v2.0 reality</name>
  <files>agent-factory/README.md</files>
  <action>
This file is the "go deep" guide that README.md Quickstart step 3 links to. It is stale in four concrete ways; fix all four, then tighten.

1. Remove every phase-gating claim. The parenthetical "(+ portable AGENTS.md, Phase 3)" / "(ships in Phase 3)" in the Start-here note and the tools table, the whole "> Note:" block that says the AGENTS.md substrate "lands in Phase 3 ... does not exist yet ... Until it ships, point your agent directly at ...", and the Install section's "The installers themselves ship in Phase 5 — until then, use the minimal markdown path" plus "The exact install commands ... will be documented with the installers in Phase 5. UNKNOWN - verify" — all describe shipped work as unbuilt. AGENTS.md exists (repo root), the roles and workflows exist under agent-factory/, and install/install.js exists. Delete the "does not exist yet / until it ships / ships in Phase N" framing entirely and state the current truth: the portable AGENTS.md substrate ships now at the repo root; the roles and workflows ship under agent-factory/; the installer ships at install/install.js.

2. Rewrite the Install section to match install/README.md (the authoritative installer doc). The minimal markdown path stays (copy AGENTS.md + agent-factory/ and start at the Orchestrator). For the scripted path, name the real command `node install/install.js` and state the Node 22+ prerequisite, then cross-reference install/README.md for the full flag set (--target, --yes, DRY_RUN, --symlink, --migrate, --update, --prune-old-kit) and the two-root layout rather than restating it. Keep the Claude Code plugin form's install commands marked `UNKNOWN - verify` (plugin/marketplace schema still moves — that marker is correct and must stay).

3. Update the "Usage across the five tools" table: drop the "(+ portable AGENTS.md, Phase 3)" / "Phase 3" parentheticals since AGENTS.md now exists. Keep the current v2.0 dispatch model as-is (Claude Code: coordinator spawns role agents; the four other CLIs: sequential role-load, no spawn) — that reflects the v2.0 parallel-first decision and is correct. Likewise drop the "adapters ... ship in Phase 5 under agent-factory/packaging/" future-tense framing; adapters ship now (installed by install/install.js).

4. Reconcile the work-mechanism prose to match AGENTS.md's current terminology. AGENTS.md describes roles pulling "the shared verified context" and publishing "typed notes" per Workflow 16 — v2.0 clean-replaced the old handoff-packet relay. Where this guide describes HOW roles pass work ("demands handoff packets", "demanding a handoff packet at each step so the next role inherits ...", "Roles pull ... same handoffs"), align it to the shared-verified-context / typed-notes / Workflow 16 model AGENTS.md uses as the source of truth. Do not chase the loose word "handoff" everywhere; only fix the passages that describe the mechanism, so the guide and AGENTS.md agree.

Then tighten for concision: the guide is verbose. Preserve intact — the Orchestrator start-here instruction, the copy-paste Orchestrator prompts, the zero-config baseline (mode=lean/cadence=kanban/autonomy=pr), the config-dial description, and the caveman voice where it already lives. Do not touch attribution/safety framing tone. This is a KIT file (agent-factory/ = read-only kit per AGENTS.md) but it is a user-facing README shipped with the kit and edited at source here, so editing it in this source checkout is correct.
  </action>
  <verify>
    <automated>test $(grep -icE 'ships in Phase|lands in Phase|does not exist yet|until it ships|until then' agent-factory/README.md) -eq 0</automated>
  </verify>
  <done>
agent-factory/README.md has zero stale phase-gating phrases; its Install section names `node install/install.js` (Node 22+) and cross-references install/README.md; the tools table has no "Phase 3" parentheticals; the work-mechanism prose matches AGENTS.md (shared verified context / typed notes / Workflow 16); the plugin-form install commands remain `UNKNOWN - verify`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Cross-doc consistency + claim-verification sweep</name>
  <files>README.md, install/README.md, docs/faq.md, docs/catalog/README.md, CONTRIBUTING.md</files>
  <action>
A read-and-verify pass across the remaining user-facing docs; edit ONLY where you find real drift. Do not rewrite accurate prose.

1. Version consistency. Confirm every version string in user docs equals agent-factory/VERSION. Check: README.md ("grugops version 0.1.0"), install/README.md ("Version: 0.1.0"), and .claude-plugin/plugin.json ("version": "0.1.0"). Read agent-factory/VERSION first, then grep the docs. If any string disagrees with VERSION, fix the doc string to match VERSION (VERSION is the source of truth). At time of audit all read 0.1.0 — if still true, this is verify-only, no edit.

2. Catalog claim verification. docs/catalog/README.md claims "17 role personas and 19 workflows" and is a GENERATED file ("do not hand-edit — re-run: node scripts/generate-catalog.js"). Verify by regenerating: run `node scripts/generate-catalog.js`, then `git diff --stat docs/catalog/README.md`. If there is no diff, the claim is verified current (the 18 role files include the underscore-prefixed `_role-switch-protocol.md`, a non-persona helper the generator excludes → 17 personas is correct; 19 workflows = files 00–18). If there IS a diff, the committed catalog was stale — keep the regenerated output (never hand-edit it) and note it in the audit summary. Never edit docs/catalog/README.md by hand.

3. No-fabrication invariant. Grep every user doc for `UNKNOWN - verify` and confirm the count did not drop versus before your edits (Task 1 must not have removed any). The AGENTS.md command slots, the plugin/marketplace install commands, and the catalog's UNKNOWN-verify cadence cells must all still read `UNKNOWN - verify`. Never replace an UNKNOWN marker with a guessed command.

4. Brand + safety invariants. Confirm, across README.md and the other user docs: lowercase `grugops` throughout (no "GrugOps"/"Grugops" except where a proper sentence-start or the deliberate "Grug Brained Developer"/"Grug children's book" references appear); the grugbrain.dev attribution AND the non-affiliation disclaimer are both still present and visible in README.md; and all safety / production-deploy / compliance / money text stays in clear voice — never add caveman voice to it. docs/faq.md's affiliation answer and README.md's Acknowledgements + disclaimer must remain intact.

5. Known-gap flag (do NOT create the file). CLAUDE.md's stack names "Keep a Changelog 1.1.0" as the CHANGELOG format and the Release Manager role emits it, but there is no root CHANGELOG.md. grugops is pre-1.0 (0.1.0) with no cut release, so absence is plausibly intentional. Record this as a known gap in the audit summary; do NOT fabricate a CHANGELOG.md (that would be inventing release history).

6. Examples scan (flag-only, do NOT rewrite). Grep examples/*.md for stale phase-gating phrases (same set as Task 1's grep). These files are captured "REAL proof" walkthroughs referenced by docs/dogfood-human-runbook.md — rewriting them for concision would corrupt the proof. If the grep finds stale references, flag them in the audit summary for a separate follow-up; do not edit examples/ in this task.

7. Light concision tightening (optional, safe). Where a user doc has obviously redundant prose and tightening changes no claim, tighten it. Do not touch install/README.md's flag documentation (it is precise and current) or any safety text.

Return the audit summary inline in the execution result: what changed, what was verified clean, the catalog regenerate outcome, any examples flags, and the CHANGELOG gap.
  </action>
  <verify>
    <automated>V=$(cat agent-factory/VERSION); grep -q "$V" README.md && grep -q "$V" install/README.md && grep -q "\"version\": \"$V\"" .claude-plugin/plugin.json && node scripts/generate-catalog.js >/dev/null 2>&1 && git diff --quiet docs/catalog/README.md && echo OK</automated>
  </verify>
  <done>
Version strings across README.md, install/README.md, and plugin.json all equal agent-factory/VERSION; regenerating the catalog produces no diff (counts verified current); no `UNKNOWN - verify` marker was dropped; grugbrain.dev attribution + non-affiliation disclaimer intact in README.md; safety text stays clear voice; the CHANGELOG absence and any examples flags are recorded in the audit summary (no CHANGELOG.md fabricated, no examples/ file rewritten).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| repo docs -> new user's understanding | Docs are the only contract a first-time installer trusts; a false claim (a fabricated command, a stale "does not exist yet", a missing disclaimer) misleads a human with no way to detect it |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-DOC-01 | Tampering | An `UNKNOWN - verify` slot replaced by a guessed command | high | mitigate | Task 2 step 3 asserts the UNKNOWN-verify count does not drop; no command is invented (no-fabrication constraint) |
| T-DOC-02 | Repudiation | grugbrain.dev attribution or the non-affiliation disclaimer removed while tightening | high | mitigate | Task 2 step 4 verifies both remain visible in README.md; disclaimer is a legal/brand invariant, never trimmed for concision |
| T-DOC-03 | Information disclosure | Caveman voice injected into safety / compliance / money text | medium | mitigate | Task 2 step 4 confirms safety text stays clear voice; voice-discipline is a hard project constraint |
| T-DOC-04 | Tampering | Hand-editing the generated catalog instead of regenerating | low | mitigate | Task 2 step 2 regenerates via `node scripts/generate-catalog.js` and diffs; never hand-edits the generated file |
</threat_model>

<verification>
- `grep -icE 'ships in Phase|lands in Phase|does not exist yet|until it ships|until then' agent-factory/README.md` returns 0
- Same grep across README.md, docs/faq.md, install/README.md, docs/catalog/README.md returns 0 (already clean at audit time; must stay clean)
- `node scripts/generate-catalog.js` then `git diff --quiet docs/catalog/README.md` succeeds (catalog counts current)
- Version strings in README.md, install/README.md, .claude-plugin/plugin.json all equal `agent-factory/VERSION`
- `UNKNOWN - verify` occurrence count across user docs is unchanged or higher versus pre-audit (no marker removed)
- README.md still contains the grugbrain.dev attribution and the non-affiliation disclaimer
</verification>

<success_criteria>
- agent-factory/README.md tells a new user the truth: AGENTS.md, the roles/workflows, and the installer all exist now; the Install section names `node install/install.js` (Node 22+) and cross-references install/README.md; the plugin-form commands stay `UNKNOWN - verify`.
- The work-mechanism prose in agent-factory/README.md matches AGENTS.md (shared verified context / typed notes / Workflow 16), not the retired handoff-packet relay.
- Every other user-facing doc is verified consistent (version, catalog counts) or corrected where drifted; no command fabricated; brand + safety + voice invariants intact.
- The audit summary returned inline records: what changed, what was verified clean, the catalog regenerate outcome, any examples/ flags, and the known CHANGELOG.md gap.
</success_criteria>

<output>
Create `.planning/quick/260721-hjm-go-over-user-facing-documentation-audit-/260721-hjm-SUMMARY.md` when done.
</output>