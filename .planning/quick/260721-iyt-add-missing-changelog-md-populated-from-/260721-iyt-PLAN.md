---
phase: quick-260721-iyt
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - CHANGELOG.md
  - README.md
autonomous: true
requirements: [CHANGELOG-ADD]

must_haves:
  truths:
    - "Root CHANGELOG.md exists in Keep a Changelog 1.1.0 format: title, intro line naming Keep a Changelog + SemVer, an `## [Unreleased]` block, and dated version sections newest-first"
    - "Every version section and every bullet is traceable to a real source (git tag, milestone ROADMAP header, milestone-audit doc, or STATE.md) — no invented version, date, or feature"
    - "Version identifiers match the repo's actual git tags (v1.0, v1.1, v1.2) with their documented ship dates; the in-progress v2.0 work lives under `[Unreleased]`, not a fabricated release"
    - "A header note honestly states the artifact SemVer is 0.1.0 (pre-1.0, no public release cut) and that v1.0/v1.1/v1.2 are internal milestone tags"
    - "Changelog prose is clear voice (release notes for humans) — no caveman voice; brand written lowercase `grugops` throughout"
    - "README.md links to CHANGELOG.md from a fitting, natural place; the link reads cleanly and preserves the existing attribution + non-affiliation disclaimer"
  artifacts:
    - CHANGELOG.md
  key_links:
    - "README.md -> CHANGELOG.md (a working relative link a reader can follow)"
---

<objective>
Add the missing root `CHANGELOG.md` (Keep a Changelog 1.1.0 format), populated honestly from the repo's real git tags and milestone/planning docs, and link it from README.md.

Purpose: The docs audit quick task (260721-hjm) flagged the one remaining gap: CLAUDE.md names Keep a Changelog 1.1.0 as the changelog format, but no root CHANGELOG.md exists. grugops has shipped three tagged internal milestones (v1.0, v1.1, v1.2) and is mid-way through the v2.0 decentralized-factory work — none of which is captured in a human-readable changelog. This closes that gap without fabricating a single version, date, or feature.

Output: A traceable `CHANGELOG.md` at the repo root and a natural link to it from README.md.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Link target + its existing structure:
@README.md

# Primary sources to populate the changelog from (read the headers/overviews, not the full bodies):
@.planning/milestones/v1.0-ROADMAP.md
@.planning/milestones/v1.1-ROADMAP.md
@.planning/milestones/v1.2-ROADMAP.md
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create root CHANGELOG.md from real git tags + milestone docs</name>
  <files>CHANGELOG.md</files>
  <action>
Create a NEW root `CHANGELOG.md` in Keep a Changelog 1.1.0 format. This is user-facing release notes, so use CLEAR voice (Keep a Changelog: "changelogs are for humans") — NO caveman voice. Write the brand lowercase `grugops` everywhere. Do NOT fabricate: every date, version, and bullet must trace to a source listed below. If a fact is genuinely unavailable, omit it rather than guess — do not emit placeholder `UNKNOWN - verify` markers in this human-facing document; just leave uncertain items out.

Ground truth already gathered (all verifiable — re-check with `git tag` and the cited docs if in doubt):
- `git tag` returns exactly: `v1.0`, `v1.1`, `v1.2`. There is NO v2.0 tag. The v2.0 work is in progress (phase 26 of 20-26 not yet complete per STATE.md).
- `agent-factory/VERSION` is `0.1.0`. Artifact SemVer deliberately stays 0.1.0 (PROJECT.md D-28) even across the v2.0 architecture pivot — no public release has been cut, no `1.x`/`2.x` version string exists.
- Documented ship dates (from each milestone ROADMAP `**Status:**` header): v1.0 shipped 2026-06-04, v1.1 shipped 2026-06-08, v1.2 shipped 2026-06-16.

Structure the file top-to-bottom:

1. Title `# Changelog`, then the standard Keep a Changelog intro paragraph stating the file follows Keep a Changelog 1.1.0 and Semantic Versioning 2.0.0.

2. A short honest note (2-3 lines, clear voice): grugops is pre-1.0 — the artifact version (`agent-factory/VERSION`) is `0.1.0` and no public release has been cut; `v1.0`/`v1.1`/`v1.2` below are the project's internal milestone tags (matching `git tag`), and the v2.0 decentralized-factory architecture pivot is in progress and therefore listed under `[Unreleased]`.

3. `## [Unreleased]` — the v2.0 "Decentralized Factory — Shared Verified Context" milestone (phases 20-26, in progress). Source: PROJECT.md "Current Milestone: v2.0" goal + the v2.0 roadmap phase titles in `.planning/ROADMAP.md`. Group bullets under Keep a Changelog subsection headings (Added / Changed as applicable). Cover the shipped-so-far substance honestly: a shared, verified, auditable context substrate + concurrency foundation replacing static handoff packets; verify-before-write admission using the §14 quality gate as the un-cheatable verifier; dialable memory/trajectory compaction for token economy; parallel execution with the Orchestrator as decomposer (Claude Code primary; the four non-spawning CLIs degrade to sequential over the same shared context); clean handoff removal + traceability migration; governance-on-a-dial. Add one honest clear-voice line noting the v2.0 dogfood dual-path oracle (phase 26) is not yet complete — A3/DOG-02 live dual-path parity retirement is deferred pending a captured live run (STATE.md).

4. `## [1.2] - 2026-06-16` — "SDLC Depth, Quality Discipline & Browsable Docs" (phases 10-19, 38 plans). Source: v1.2-ROADMAP.md Overview + PROJECT.md v1.2 shipped summary. Map to Keep a Changelog subsections: Added (17th frontend/UI persona; BDD Given/When/Then + TDD red-green test-first, config-dialed; OWASP ASVS 5.0 security-audit workflow + generated leveled checklist; browsable docs catalog with fail-closed freshness gate; Tier-1/Tier-2 auto-UAT harness; install `--migrate`/`--update`); Changed (all 16 roles deepened to senior judgment; the converged un-cheatable §14 quality gate now runs lint + Playwright UI/E2E + visual regression + a structured-justification test-integrity checker; the whole tooling/script layer migrated to a TypeScript zero-build `tsc`-compiled committed-`.js` foundation, Node 22+ prerequisite).

5. `## [1.1] - 2026-06-08` — "Install & Distribution" (phases 7-9, 14 plans). Source: v1.1-ROADMAP.md Overview. Map to: Changed (redesigned install to a shared-location two-root architecture — read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target repo; ~31 role/workflow/adapter files rewritten so every reference resolves to the correct root); Added (a two-root installer that resolves `$GRUGOPS_HOME` + materializes the absolute kit path into standalone adapters; a `--check` doctor; a false-green-proof two-root validator); Fixed (the three v1.0 dogfood pains — the kit never arriving in the target, the wrong target being written, and fragile symlinks).

6. `## [1.0] - 2026-06-04` — "MVP — Full Agent Factory v2" (phases 1-6, 34 plans). Source: v1.0-ROADMAP.md Overview. This is the initial build, so mostly Added: the complete Agent Factory v2 spec — 16 role prompts (Orchestrator + core + enterprise pack) and 14 lifecycle workflows; shared I/O contracts (handoff templates, gate checklists, memory-bank seed); the config dial (`factory.config.json` with lean defaults) + a Kanban/Sprint board + a traceability trail; thin per-tool adapters for the five host CLIs; both Claude Code distribution forms (standalone `.claude/` and plugin + marketplace); idempotent, additive, reversible installers; a mechanical PreToolUse prod-deploy guard hook; a structure validator; and brand/legal collateral — proved end-to-end by an idea-to-PR dogfood across both dispatch paths.

7. At the bottom, add Keep a Changelog link-reference definitions comparing the git tags, e.g. an `[Unreleased]` compare from `v1.2` to HEAD and `[1.2]`/`[1.1]`/`[1.0]` entries. Use the repo's real remote if one exists (`git remote get-url origin`); if there is NO remote, OMIT the URL link-reference block rather than inventing a URL — the bracketed version headings alone are valid and honest.

Keep each milestone's bullets tight and skimmable (a handful per subsection), summarizing what a user gets — not a plan-by-plan dump. Do not copy internal decision IDs (D-NN), phase-internal jargon, or `UNKNOWN - verify` markers into this human-facing file.
  </action>
  <verify>
    <automated>test -f CHANGELOG.md && grep -q '## \[Unreleased\]' CHANGELOG.md && grep -q '## \[1.2\] - 2026-06-16' CHANGELOG.md && grep -q '## \[1.1\] - 2026-06-08' CHANGELOG.md && grep -q '## \[1.0\] - 2026-06-04' CHANGELOG.md && test $(grep -ci 'grug keep it simple\|grug think\|grug like' CHANGELOG.md) -eq 0</automated>
  </verify>
  <done>
Root CHANGELOG.md exists in Keep a Changelog 1.1.0 format with an `[Unreleased]` block (v2.0 in-progress work) and dated `[1.2]`/`[1.1]`/`[1.0]` sections matching the real git tags and documented ship dates. Every entry traces to a git tag or milestone/planning doc; no fabricated version, date, or feature. Prose is clear voice; brand is lowercase `grugops`; the pre-1.0 / VERSION 0.1.0 reality is stated honestly.
  </done>
</task>

<task type="auto">
  <name>Task 2: Link CHANGELOG.md from README.md</name>
  <files>README.md</files>
  <action>
Add a link to the new root `CHANGELOG.md` from README.md in a fitting, natural place. README.md has no dedicated docs table or links section — its structure is: title + intro, `> grug keep it simple.`, a tagline block with an install snippet, `## Quickstart` (3 numbered steps, step 3 "Go deep" links to `agent-factory/README.md`), `## Acknowledgements`, and the non-affiliation disclaimer.

Choose the cleanest of these two placements (executor discretion — pick whichever reads best without bloating the file):
- Add a short `## Changelog` section immediately after `## Quickstart` (before `## Acknowledgements`) with a one-line clear-voice pointer, e.g. a sentence noting the release history lives in [`CHANGELOG.md`](CHANGELOG.md) and follows Keep a Changelog.
- OR extend Quickstart step 3 "Go deep" with a trailing sentence linking [`CHANGELOG.md`](CHANGELOG.md) for the release history.

Use a working relative markdown link `[`CHANGELOG.md`](CHANGELOG.md)`. Keep the brand lowercase `grugops`, clear voice, and do NOT alter or remove the `## Acknowledgements` block, the grugbrain.dev attribution, or the non-affiliation disclaimer. Do not restate the changelog contents in README — just link it.
  </action>
  <verify>
    <automated>grep -q '(CHANGELOG.md)' README.md && grep -qi 'non-affiliation\|not affiliated' README.md</automated>
  </verify>
  <done>
README.md contains a working relative link to `CHANGELOG.md` in a natural section; the link reads cleanly in clear voice; the Acknowledgements attribution and non-affiliation disclaimer are preserved unchanged.
  </done>
</task>

</tasks>

<verification>
- `CHANGELOG.md` exists at repo root and parses as valid Keep a Changelog 1.1.0 (title + intro + `[Unreleased]` + newest-first dated sections).
- Version headings and dates match `git tag` (v1.0/v1.1/v1.2) and the milestone ROADMAP ship dates (2026-06-04 / 2026-06-08 / 2026-06-16); v2.0 work sits under `[Unreleased]`.
- Spot-check that no bullet asserts a feature not present in its cited milestone doc — no fabrication.
- Clear voice throughout the changelog; lowercase `grugops`; pre-1.0 / VERSION 0.1.0 honesty note present.
- README.md links to CHANGELOG.md and preserves attribution + disclaimer.
</verification>

<success_criteria>
Root CHANGELOG.md is present, honest, and traceable to git tags + milestone/planning docs; it uses Keep a Changelog 1.1.0 format and clear voice with the lowercase brand; README.md links to it from a fitting section without disturbing the attribution or non-affiliation disclaimer.
</success_criteria>

<output>
Create `.planning/quick/260721-iyt-add-missing-changelog-md-populated-from-/260721-iyt-SUMMARY.md` when done.
</output>
