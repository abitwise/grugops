# Phase 43: Story and layered docs - Research

**Researched:** 2026-11-17
**Domain:** Docs restructure on a gate-heavy markdown kit: README story, `docs/` pages, a generated reference tree with a freshness gate, claim-registry discipline, shipping docs into the kit home, and a headless milestone UAT
**Confidence:** HIGH for the in-repo mechanics (every gate, pin and path below was opened this session). MEDIUM for effort sizing. One locked decision (D-03) cannot be done with today's registry mechanism; see Open Question 1.

## Summary

All of Phase 43's tools already exist in the tree. The catalog generator (`scripts/generate-catalog.ts`) reads roles and workflows through the one frontmatter and section-locator authority. Its freshness gate (`scripts/catalog-freshness.ts`) regenerates into a temp mirror and compares bytes. `scripts/host-entries-freshness.ts` already shows how to gate a whole generated tree: missing, extra and stale pages each get their own finding. The claim registry gate (`scripts/check-claim-anchors.ts`) derives its scanned documents from the registry's `file` values. So a new page is "inside the checked file set" once a row names it, or once it joins the public-docs corpus that both claim gates read. Phase 42 set that precedent with `docs/skills.md`.

The hard part is the number of gates, pins and tests that already hold today's README, `agent-factory/README.md`, `CLAUDE.md` and `docs/` in place. Each move in this phase turns at least one of them red, so the plan must schedule the paired update in the same commit. The biggest traps found:
1. D-03 asks for `status: dropped` on C-28-002/003. The gate refuses that for a non-safety row, and a dropped row must keep its anchor in the README.
2. `install/host-entry-docs.test.ts` hard-codes `README.md` as the home of the "Start a session" table (START-1, CAUTION-1, LIVE-3).
3. `check-audit-register.ts` pins C-28-001 to `README.md` in `SAFETY_CLAIM_HOMES`.
4. `agent-factory/packaging/subagent.frontmatter.md` cites "`CLAUDE.md` line 83" and a test checks that exact line.
5. `model-dial-consistency.test.ts` turns any shipped doc that names `scripts/model-tiers.ts` into a new dial surface.
6. The kit-home record grammar allows only one kit entry, `agent-factory`, so shipping `docs/` beside it changes the install-marker schema.

**Primary recommendation:** Extend `scripts/generate-catalog.ts` to emit `docs/reference/` (index plus per-role and per-skill pages). Upgrade `scripts/catalog-freshness.ts` to the host-entries tree-compare shape, using `jsImportClosure`. Bring each new page into the public-docs corpus through one derived "shipped docs" rule, in a commit before the page is written. Add one small story gate covering GAP-D1, `/grug` in `CLAUDE.md`, and dead links in shipped docs. Before any registry plan runs, get the human to choose a mechanism for retiring C-28-002/003 (recommended: a new `retired` status).

## Architectural Responsibility Map

This is a docs and tooling phase. The "tiers" here are the repo's own layers, not web tiers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| README story, concepts, how-it-works, usage pages | Hand-written public docs (`README.md`, `docs/*.md`) | Claim registry (`docs/audit/28-claim-registry.md`) | Prose a human writes. Its absolutes are anchored and registered. |
| Per-role and per-skill reference pages and their index | Build-time generator (`scripts/generate-catalog.ts` → `docs/reference/**`) | Freshness gate (`scripts/catalog-freshness.ts`) | Derived from role, skill and host-registry files, so never hand-maintained (D-13..D-17). |
| Which pages exist (membership) | Kit model (`scripts/kit-model.ts` listers and counts) | Host registry (`install/host-tools.ts`) | Derived, never typed (D-17). |
| Honesty enforcement (cost, GAP-D1, `/grug`, dead links) | CI gates (`check-banned-claims`, `check-public-docs-vocabulary`, new story gate) | Reader review (human) | Gates catch literals. A reader catches overstatement. |
| Shipping docs into the kit home | Installer (`install/install.ts` copyKit + `install/install-marker.ts` record) | `install/kit-source.ts` (derived shipped list) | The installer owns what lands in `$GRUGOPS_HOME`. `install/` must not import `scripts/` (33.1 D-18/D-28). |
| Milestone UAT evidence | Headless `claude -p` capture (scratch repo) | Human sign-off by typed name | Agents gather evidence; only a human accepts. |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**README story and length (STORY-01)**
- **D-01:** The README becomes a **short front door**, about 3-4 KB. It contains, in order: the wordmark and the tagline "grugops — Specialist agents. Shared context. Coordinated work." (lowercase brand), a 3-4 sentence story, the quickstart (D-05), the how-it-works bullets (D-06), a "where to go next" list (concepts, how it works, usage, reference, install/README.md), then safety guarantees, changelog and acknowledgements/non-affiliation. The 6-host start table, the long quickstart explanation and the per-skill command list move to `docs/usage.md` (D-10). The words "the simple software factory" appear nowhere in the README.
- **D-02:** **C-28-001** (the long "file-based agent factory" paragraph) **moves with its anchor and id to `docs/concepts.md`** and is re-dispositioned there: the registry row's `file` changes, and the verbatim block and mechanism are re-measured. The README's new story sentences get **new claim ids** in the registry.
- **D-03:** **C-28-002 and C-28-003** are handled by the registry's existing **"a dropped claim is replaced in place (D-18)" rule**: each row stays, its status is `dropped` with a reason and the commit, and no row is deleted. The new tagline and story get new ids (D-02). This also closes the README sentence Phase 40 left for this phase (40-10 SUMMARY: README.md:14, "grug-brained").
- **D-04:** **No grug voice in the README body.** All README prose is plain English. The only grug touch is the art and the grugbrain.dev attribution and non-affiliation section. The `> grug keep it simple.` line is removed.
- **D-05:** **Quickstart is host-neutral**: clone, then `node ~/grugops/install/install.js --target <project>` with no host flag (the checkbox list picks hosts), then one line pointing to the per-host start table in `docs/usage.md` and to `install/README.md`. No host gets a privileged block in the README.
- **D-06:** The README carries **about 5 plain bullets on how it works**, naming the moving parts in the order they act (request → Orchestrator decomposes → queue → role agents claim and publish notes to the shared verified context → gate → a human merges and deploys). Each bullet links into `docs/how-it-works.md`. There is no diagram in the README.

**Main docs layout (STORY-02)**
- **D-07:** Main docs live in **new `docs/` pages**: `docs/README.md` (the docs index), `docs/concepts.md`, `docs/how-it-works.md`, `docs/usage.md`, plus `docs/reference/` (D-14..D-17). `agent-factory/README.md` stays the in-kit "start here" for agents and installed repos.
- **D-08:** **Two pages for concept and mechanics.** `docs/concepts.md` covers the ideas: specialist roles, the shared verified context, the board as state, the gate as backpressure, and humans deciding. C-28-001 lands here (D-02). `docs/how-it-works.md` covers the mechanics: the Orchestrator decomposes the request, the queue, claims, notes admitted to the context, the gate, the trace, the release, and the honest gaps (GAP-D1).
- **D-09:** `docs/usage.md` is **organized by job and is host-neutral**: one section per thing a user wants done (bootstrap a repo, idea to tickets, ticket to PR, run the gate, UAT, release, sprint and daily sweep). Each section shows the request to type, which roles act, what lands on disk and where the human steps in. The per-host start table appears once, at the top.
- **D-10:** **Each topic is written once, in `docs/`.** `agent-factory/README.md` keeps only what an agent or installed repo needs to start (start here, configuration, install) and links out for the rest. Its "Usage across the supported host tools", "How work flows" and "Copy-paste Orchestrator prompts" sections move to the docs pages, or shrink to links. Any registered claim that moves is re-dispositioned by id (STORY-04).
- **D-11:** **The public user docs ship with the kit**, so relative links from `agent-factory/README.md` resolve both in the checkout and in an installed kit home. Only the public user docs ship: `docs/README.md`, `concepts.md`, `how-it-works.md`, `usage.md`, `reference/`, `skills.md`, `GUARANTEES.md` and `faq.md`. They are listed **once, as a derived list in one place** (the kit-model/layout pattern, never a second typed list). `docs/audit/`, `docs/design/`, `docs/initial/`, `dogfood-human-runbook.md` and `pre-v3-state-layout.md` stay checkout-only. Install, `--update`, prune and uninstall treat the shipped docs as kit files and never touch state roots. — **Reversibility:** costly — it changes the installer's kit copy set, install record counts, uninstall and prune lists and the tests pinning them; undoing it means re-pinning all of those.
- **D-12:** **Mermaid diagrams, used sparingly.** `docs/how-it-works.md` has one flow diagram (request → Orchestrator → queue → role agents → notes → gate → human). The same steps are also written as numbered text, because terminals and some viewers show mermaid as source. Other pages use tables and text.

**Reference pages (STORY-03)**
- **D-13:** **One reference page per role**, 19 pages generated from `agent-factory/roles/*.md` (the `_`-prefixed protocol file excluded, as the catalog does today). The Software Engineer page carries a **levels section**: the junior, mid and senior adapter names, the model and effort resolved from the models dial, and the rule that the Tech Lead's plan names the level. The role is the single source, and adapters are never paged separately.
- **D-14:** **Page content: a generated summary plus extracted sections.** A header block holds tier, capabilities, skills (from `roleSkillsOf`), the adapter name(s) per host, and the workflows that name the role. The page then extracts One job, Activates when, Output, Board moves, Hard limits and Stop when from the role file, and links to the full source. Reads and Responsibilities stay in the source only. Any field the generator cannot derive is `UNKNOWN - verify`, never invented.
- **D-15:** **One page per grugops skill op**, 7 pages (`grugops`, `map`, `plan`, `ticket`, `gate`, `uat`, `release`), generated from the plugin `skills/<op>/SKILL.md`. The standalone twin under `.claude/skills/grugops-<op>/` is checked as the same, and the existing skill-twins freshness gate already holds that relation. Each page shows what the op does, its invocation on each host (`/grugops-<op>`, `/grugops:<op>`, `$grugops`, `/grugops` and so on, from the host-entry data, never typed), the workflow(s) it runs, the roles it reaches and its allowed tools.
- **D-16:** **The catalog becomes the reference index.** The same generator emits `docs/reference/README.md` (roles, skills and workflows tables), `docs/reference/agents/*.md` and `docs/reference/skills/*.md`, all under **one freshness gate** that fails on a missing, extra or stale page. `docs/catalog/` is retired and every link to it is updated: either the folder is removed, with a dated note in the CHANGELOG, or it is left as a one-line pointer (planner's choice, D-16a). Workflows stay as table rows linking to their source, with no per-workflow pages.
- **D-17:** Page and index membership is **derived from kit-model** (`ROLE_COUNT`, the role and skill sets), never hand-listed. A role or skill added later gets a page through the generator, or the gate goes red.

**Worked examples (STORY-02)**
- **D-18:** **All five `examples/` walkthroughs are rewritten to v3**: `memory-bank/plans/` paths, the rendered trace (no hand-kept matrix), published notes, Tech Lead scoring and engineer levels where the flow passes through them, and the current commands and file names. Each is linked from its `docs/usage.md` job section. After the rewrite, **`examples/` joins the hand-trace scan set**, which closes the open Phase 37 deferred item ("The worked examples still show the retired hand-kept trace matrix").
- **D-19:** **Examples 01 and 03 (real captures from 2026-06-03) are relabeled as illustrative v3**: they carry the same illustrative honesty banner as 02/04/05, plus one line: "Based on a real run captured 2026-06-03 on v1.0; updated to v3 by hand." The original capture stays in git history and is linked by commit. Nothing still calls them real runs.
- **D-20:** **Five examples are enough.** Each usage job maps to the nearest example. Jobs without one (gate only, UAT, daily sweep) get a short inline example in `docs/usage.md` (the request, what lands on disk, the human step) instead of a new file.

**Honesty sweep and CLAUDE.md (STORY-04, STORY-05)**
- **D-21:** **Every new or moved public page joins the claim registry's checked file set and the public-docs corpus before it is written**: the docs pages, the generated reference pages and `examples/`, which is already in the public-docs corpus. The existing `check-banned-claims` gate then covers cost and token wording on them. Absolute claims on hand-written pages carry `<!-- claim: -->` anchors with new ids.
- **D-22:** **Add one small GAP-D1 check**: any public docs page that describes parallel work must also carry the GAP-D1 sentence (parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify`). The plan also includes a **reader review** for overstated claims the gates cannot catch.
- **D-23:** **Fix every `/grug` in `CLAUDE.md` to what shipped.** The Core Value and the Brand constraint say `/grugops`. In the research block, each `/grug` is corrected to what shipped (plugin `grugops` → `/grugops:<op>`, standalone skills under `.claude/skills/grugops*` → `/grugops`, `/grugops-<op>`, no `commands/` folder), or marked as a historical option that was not taken. **A check fails if `CLAUDE.md` names `/grug` as a whole command word again.** Respect the GSD-managed markers in CLAUDE.md: edit the source those sections are generated from when one exists, so a regeneration does not bring the drift back.

**Milestone UAT (success criterion 6)**
- **D-24:** **Claude runs it headless, and the human signs off.** Install into a scratch repo outside this tree, then drive both checks with `claude --print`, reusing `scripts/capture-live.ts` where it fits. Test 10: several unscored prompts, recording which agent is spawned; a junior, mid or senior adapter must never be reached without a Tech Lead plan naming it. Test 14: spawn `grugops-designer`, have it publish a design note, and capture that the note reaches `scripts/context-io.js` through Bash and is admitted, not refused as unsealed. Transcripts and context-io output are kept as evidence. The human reads them and accepts by typed name. If headless output cannot show a spawn decision, that test becomes a live session the human runs from a short runbook, and the record says why.

**Already locked (not re-asked)** — from the CONTEXT.md domain block, copied verbatim:
- Voice: plain English in docs. The grug voice survives only in light brand copy (Phase 40 voice constraint, CLAUDE.md Constraints).
- Reference pages come from the existing catalog generator, and claim anchors keep their ids (ROADMAP Phase 43 note).
- A new public page joins the claim registry's checked file set before it is written (42 D-11 precedent; STORY-04).
- grugops recommends no third-party skill, and no role declares one (Phase 42 result, `docs/skills.md`). "Skill" in STORY-03 therefore means grugops's own 7 skills.
- No docs mention of host-native code navigation is required (35 D-06).
- Cost non-claim: `agent-factory/writing-profile.md` § C-28-047 and the token-economy literals in `scripts/check-banned-claims.ts`.
- GAP-D1 wording as proven: parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (research SUMMARY Phase 43, PITFALLS Pitfall 20).
- UAT acceptance is written only from a reply that ends with the human's typed name (project memory, 42 D-15 precedent).

### Claude's Discretion
- Exact README wording, the story sentences and the "where next" list, within D-01..D-06 and the writing profile.
- File names inside `docs/reference/` (slug from the role file name, for example) and the index table columns.
- Where the shipped docs land in the kit home. Recommended: `$GRUGOPS_HOME/docs/` next to `agent-factory/`, so `../docs/` from `agent-factory/README.md` resolves the same in the checkout and the kit home.
- How shipped pages link to checkout-only files (for example `docs/skills.md` → `.planning/.../42-EVALUATION.md`): use an absolute repository URL or reword, and add a link check over shipped docs so no link is dead in a kit home.
- Whether retired `docs/catalog/` is deleted or left as a pointer (D-16a).
- How the GAP-D1 check (D-22) and the `/grug` check (D-23) are wired: a new small gate or a part of an existing one, following the repo's derived-set and vacuity patterns.
- How a generated page with no hand-written claims sits in the claim registry's file set without anchors, as long as STORY-04's "inside the checked file set before it is written" holds literally.

### Deferred Ideas (OUT OF SCOPE)
- A new walkthrough of the Tech Lead scoring a ticket and naming the engineer level (considered, not chosen: five examples are enough, D-20).
- A parallel-work walkthrough (wip_limit refill, `now-running.md`): considered, not chosen. It would need GAP-D1 proven first.
- A fresh live re-capture of examples 01 and 03 as real v3 runs: considered, not chosen (D-19 relabels them as illustrative).
- Generated per-workflow reference pages: not required by STORY-03 (D-16 keeps workflows as index rows).
- A full manual honesty sweep of every public doc and the kit: considered, not chosen. D-22 sets the gates plus a reader review of new and changed pages.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORY-01 | The README tells the new story — "grugops — Specialist agents. Shared context. Coordinated work." (lowercase brand) — replacing "the simple software factory" | § README rewrite: claim migration map (C-28-001..009). Pitfalls 1, 2 and 5. Optional durable lock: add `"simple software factory"` to `RETIRED_PROSE_FORMS`. |
| STORY-02 | The main docs explain how grugops works and its core concept, show usage flows with worked examples, and link to every agent and skill page | § Main docs and examples. Pattern 4 (the shipped-docs derivation). Pitfalls 3, 4, 7 and 8. Examples join the hand-trace scan set (Pattern 6). |
| STORY-03 | Every agent and skill has a reference page generated from the role and skill files and kept fresh by a gate | Patterns 1-3: generator extension, per-page derivations, tree freshness gate with `jsImportClosure`. Pitfalls 9-11 on import pins. |
| STORY-04 | Every new public page is inside the claim registry's checked file set before it is written; claims that move are re-dispositioned by id, never deleted | Pattern 5 (corpus join before write). Open Question 1 (retired-claim mechanism). Claim migration map. `SAFETY_CLAIM_HOMES` and `CLAIM_KIND_CARDINALITY` pins. |
| STORY-05 | The docs state open gaps honestly (own-session spawn capture is `UNKNOWN - verify`), make no cost or token-saving claims, and `CLAUDE.md` no longer names `/grug` | Pattern 7 (story gate: GAP-D1, `/grug`, shipped links). Pitfalls 6, 12 and 13. `CLAUDE.md` generation sources. |
| SC-6 (UAT) | Live Claude Code: unscored work never auto-delegated to a level adapter; the designer note reaches `context-io.js` through Bash and is admitted | § Milestone UAT: reuse the `capture-live.js` exports `parseFrames`, `spawnObservations`, `noteRoute`, `authorStamps` and `redactText`. Claude Code 2.1.325 is installed (≥ floor 2.1.293). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Markdown for everything except the tooling layer. Tooling is TypeScript compiled with `tsc` to **committed `.js`** and freshness-checked. A new script is `scripts/<name>.ts` plus its committed `.js` (`npm run freshness`, `npm run check:build-parity`).
- Zero runtime dependencies on host machines. Dev deps stay `{typescript, vitest, @types/node}`. **This phase installs no package.**
- Single-source: role text lives once, adapters are thin pointers. Reference pages are generated *extracts* and must link back to the source.
- Zero-config first: model and effort shown on reference pages must be the zero-config answer, with a note that the models dial can change it.
- Voice discipline: plain English in docs. The grug voice only in light brand copy. Never in security findings, compliance, money or disclaimers.
- Installers: idempotent, additive, dry-run-capable, reversible. Never overwrite or delete user content. Never touch `STATE_ROOTS`.
- No fabrication: an unknown is `UNKNOWN - verify`. Never fake a gate, test result or citation.
- Minimal AGENTS.md: this phase does not grow `AGENTS.md`.
- Brand: always lowercase `grugops`. Keep the grugbrain.dev attribution and non-affiliation disclaimer visible. Original art only.
- Safety (hard): humans hold merge and deploy. The git host is the hard floor and the ask rules are a speed bump. Docs must not overstate this. C-28-023 already records `always` as `overstated`/`accepted`.
- GSD workflow enforcement: edits happen inside `/gsd-execute-phase`.
- `CLAUDE.md` sections between `<!-- GSD:*-start -->` markers are generated from `.planning/PROJECT.md` (project block) and `research/STACK.md` (stack block). [VERIFIED: CLAUDE.md:1,25 — `<!-- GSD:project-start source:PROJECT.md -->`, `<!-- GSD:stack-start source:research/STACK.md -->`]

## Standard Stack

No new libraries. The "stack" is the in-repo authorities the plans must call rather than re-implement.

### Core (in-repo authorities to reuse)
| Module | Purpose | Why it is the standard |
|--------|---------|------------------------|
| `scripts/generate-catalog.ts` | Today emits `docs/catalog/README.md`. Extend it to emit `docs/reference/**`. | ROADMAP note: "Reference pages come from the existing catalog generator". It already reads H1, sections and frontmatter through the authorities. [VERIFIED: scripts/generate-catalog.ts:88-104] |
| `scripts/frontmatter.ts` → `parseFrontmatter`, `unfencedHeadingIndex`, `sectionEndIndex` | Frontmatter and section extent | The ONE section-extent owner (LANG-07). The catalog's import set is pinned to exactly these three. [VERIFIED: scripts/check-foundation-guards.test.ts:855-858 — `.toEqual(["parseFrontmatter", "sectionEndIndex", "unfencedHeadingIndex"])`] |
| `scripts/kit-model.ts` | `listRoles`, `listWorkflows`, `listRoleDisplayNames`, `listAgentAdapterSpecs`, `listPluginSkillAdapters`, `ROLE_COUNT`, `PLUGIN_SKILL_ADAPTER_COUNT` | Membership is derived, never typed (D-17). [VERIFIED: scripts/kit-model.ts:122-123 `export const ROLE_COUNT = 19;` `export const WORKFLOW_COUNT = 19;`; :156 `export const SKILL_ADAPTER_COUNT = 7;`; :167 `export const PLUGIN_SKILL_ADAPTER_COUNT = 7;`; :1183 `export const AGENT_ADAPTER_PREFIX = "grugops-";`] |
| `scripts/role-skills-reader.ts` → `readRoleSkills(kitHome)` | Role `skills:` declarations through `admitRole` and `roleSkillsOf` | D-14 says skills come "from `roleSkillsOf`". Import this bridge rather than `canonical-frontmatter.js` directly (Pitfall 10). [VERIFIED: scripts/role-skills-reader.ts:26,42] |
| `scripts/model-tiers.ts` → `LEVELS`, `zeroConfigAssignments` | Engineer level model and effort at zero config | Reference page for the Software Engineer levels section (D-13). [VERIFIED: scripts/model-tiers.ts:1517-1557 — junior `alias: "haiku"`, `effort: "xhigh"`; mid `alias: "sonnet"`, `effort: "high"`; senior `alias: "opus"`, `effort: "medium"`] |
| `install/host-tools.ts` → `HOST_TOOLS`, `LAUNCH_AGENT_NAME`, `launchInvoke`, `launchLiveNote` | Per-host invocation and launch text | Skill pages show invocation "from the host-entry data, never typed" (D-15). [VERIFIED: install/host-tools.ts:196 `export const LAUNCH_AGENT_NAME = "grugops-orchestrator";`; invoke strings at :329, :345, :370, :389, :411, :441] |
| `scripts/js-import-closure.ts` → `jsImportClosure` | Derive the mirror set for a freshness gate | The modern pattern in `guarantees-freshness.ts`. It replaces the hand-written twin list in `catalog-freshness.ts`, which grows from 3 to about 8 modules. [VERIFIED: scripts/guarantees-freshness.ts:68,134] |
| `scripts/host-entries-freshness.ts` | Precedent for a tree gate with SET then BYTES (EXTRA/MISSING/STALE) | D-16 asks for "fails on a missing, extra or stale page". [VERIFIED: scripts/host-entries-freshness.ts header lines 22-31] |
| `scripts/capture-live.ts` exports | `parseFrames`, `spawnObservations`, `noteRoute`, `authorStamps`, `redactText`, `homeSpellings`, `runCommandBuffered` | D-24 reuse for the UAT driver. [VERIFIED: scripts/capture-live.ts:583,647,898-910,1182,1311,1352,1668] |
| `scripts/vacuity.ts` (`reportMeasured`) | "What was visited" line on a new gate | Repo pattern: fail closed with vacuity reporting. [CITED: 43-CONTEXT.md code_context] |

### Supporting
| Item | Version | Purpose |
|------|---------|---------|
| Node | v26.12.1 on this machine; floor `>=22` | Runs committed `.js`. [VERIFIED: `node --version`; package.json `"engines": {"node": ">=22"}`] |
| TypeScript | 6.0.3 | `tsc` build. [VERIFIED: `npx tsc --version`] |
| vitest | 4.1.8 | Tests. [VERIFIED: `npx vitest --version`] |
| Claude Code CLI | 2.1.325 | UAT host. ≥ the junior-level floor. [VERIFIED: `claude --version`; install/host-tools.ts:549 `export const CLAUDE_CODE_LEVEL_FLOOR = "2.1.293";`] |
| GitHub Mermaid rendering | GitHub-hosted | D-12's diagram: a fenced block tagged `mermaid` renders in Markdown files on GitHub. [CITED: docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending `generate-catalog.ts` | A new `scripts/generate-reference.ts` | Fewer existing pins to move: `generate-catalog.ts` sits in several pinned sets (frontmatter consumers, `isNumberedWorkflowFile` call-site literal, "nothing imports it"). But the ROADMAP says "from the existing catalog generator". **Use: extend in place, and keep it a top-level script that nothing imports.** |
| Hand-listed mirror twins in `catalog-freshness.ts` | `jsImportClosure(ROOT, "scripts/generate-catalog.js")` | The hand list is tolerable today (loud failure). With roughly eight modules the closure derivation is the better default. **Use `jsImportClosure`.** |
| `$GRUGOPS_HOME/agent-factory/docs/` (one tree, no marker change) | `$GRUGOPS_HOME/docs/` (sibling) | The sibling keeps `../docs/` from `agent-factory/README.md` and `../../../agent-factory/roles/x.md` from `docs/reference/agents/x.md` resolving identically in checkout and kit home. The nested option breaks every role-source link. **Use the sibling** (Pattern 8). It costs a marker-schema change. |

**Installation:** none. This phase adds no npm package.

## Package Legitimacy Audit

**Not applicable: this phase installs no external package.** No `npm install`, no new `package.json` dependency. Packages removed due to SLOP: none. Packages flagged SUS: none.

## Architecture Patterns

### System Architecture Diagram

```
                 role files                 skill files                 host registry
       agent-factory/roles/*.md    skills/<op>/SKILL.md (+ .claude twin)   install/host-tools.ts
                 │                          │                                │
                 ▼                          ▼                                ▼
        kit-model listers ──────►  scripts/generate-catalog.js  ◄──── model-tiers LEVELS,
        (roles, workflows,          (top-level script, fixed           role-skills-reader
         adapter specs, skills)      literal OUT dir)                  (roleSkillsOf)
                                            │
                     builds full page set in memory, fails closed on any miss
                                            │
                                            ▼
                         docs/reference/README.md (roles · skills · workflows)
                         docs/reference/agents/<role-stem>.md   × listRoles()
                         docs/reference/skills/<op>.md          × listPluginSkillAdapters()
                                            │
            ┌───────────────────────────────┼─────────────────────────────────┐
            ▼                               ▼                                 ▼
  catalog-freshness.js            public-docs corpus part                installer copyKit
  (mirror via jsImportClosure,    (derived shipped-docs rule)            (shipped-docs rule →
   SET: missing/extra,                   │                               $GRUGOPS_HOME/docs/)
   BYTES: stale) ── CI red        ┌──────┴────────┐
                                  ▼               ▼
                        check-banned-claims   check-public-docs-vocabulary
                        (cost/token literals) (retired vocabulary)
                                  │
  hand-written pages ─────────────┤      new story gate: GAP-D1 sentence, CLAUDE.md `/grug`,
  README, docs/{README,concepts,  │      dead relative links in shipped docs
  how-it-works,usage,faq}.md ─────┘
          │  <!-- claim: C-28-NNN --> anchors
          ▼
  docs/audit/28-claim-registry.md ── check-claim-anchors (bijection + verbatim)
                                  └─ check-audit-register (safety homes, per-kind counts)
```

### Recommended Project Structure

```
docs/
├── README.md               # docs index (new, hand-written)
├── concepts.md             # ideas; C-28-001 lands here (new)
├── how-it-works.md         # mechanics + one mermaid + numbered text + GAP-D1 (new)
├── usage.md                # jobs; host start table once at top; examples linked (new)
├── reference/              # GENERATED — do not hand-edit
│   ├── README.md           # roles, skills, workflows tables (replaces docs/catalog/README.md)
│   ├── agents/<role-stem>.md   # one per listRoles() member, e.g. software-engineer.md
│   └── skills/<op>.md          # one per plugin skill dir: grugops, map, plan, ticket, gate, uat, release
├── skills.md               # existing (ships)
├── GUARANTEES.md           # existing, generated (ships)
├── faq.md                  # existing (ships) — now in the honesty corpus
├── audit/ design/ initial/ dogfood-human-runbook.md pre-v3-state-layout.md   # checkout-only
└── catalog/                # retired (D-16a)
```

### Pattern 1: Extend the catalog generator, keep it a fail-closed top-level script

**What:** Keep `generate-catalog.ts` a top-level script with fixed literal output paths (ASVS V12). Build every page into an in-memory `Map<relPath, text>`. Write nothing until all pages are built, then write each with `writeFileSync`. Before writing, delete any `.md` under `docs/reference/` that the map does not hold, so a removed role leaves no orphan page locally. The freshness gate is still what catches a committed orphan.

**When to use:** All reference output.

**Rules carried over from the current generator** [VERIFIED: scripts/generate-catalog.ts:134-191, 393-456]:
- `firstSentence` splits on `". "` and keeps the period.
- `cell()` escapes `\`, `|` and newlines in authored table cells.
- `sectionBody(text, heading)` composes `unfencedHeadingIndex` with `sectionEndIndex(text, at + 1, 2)`. Reuse it for the six extracted sections. Do not write a regex for section extent.
- Roles sort core first, then by display name. Workflows sort by numeric `order`, and duplicate orders are refused.
- An absent cadence becomes `UNKNOWN - verify`.
- `_`-prefixed role files are skipped.
- The workflow directory read stays `readdirSync(WORKFLOWS_DIR).filter(isNumberedWorkflowFile).sort()` byte for byte. `scripts/kit-model.test.ts:1141` pins that literal call site. [VERIFIED: scripts/kit-model.test.ts:1141]
- Emit a provenance header line: `<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->`.

**Relative links:** from `docs/reference/agents/x.md` the role source is `../../../agent-factory/roles/x.md`. From `docs/reference/README.md` it is `../../agent-factory/...`. Both resolve the same in the kit home if docs ship as a sibling (Pattern 8).

### Pattern 2: Per-page derivations (what is derivable, and from where)

| Field | Derivation | Fallback |
|-------|-----------|----------|
| Role name | `# Role: ` H1 | Fail closed (existing). |
| Tier, capabilities | `parseFrontmatter` keys `tier`, `capabilities`. Count rule: exactly one, as for `tier` today. | Absent capabilities → `UNKNOWN - verify`. |
| Skills | `readRoleSkills(ROOT).skills` inverted to role → skills. A role in `refusals` → `UNKNOWN - verify` plus the reason. Today no role declares one, so every page reads "none declared". | — |
| Adapter name(s) | Claude Code: `listAgentAdapterSpecs()` filtered by `roleFile`. The Software Engineer gives three level adapters and no base adapter. Other hosts: `dispatch === "sequential"` rows → "loaded by the Orchestrator in turn; no per-role adapter". For the Orchestrator page only, add each row's `launchAgent` plus `launchInvoke`/`launchLiveNote`. | Never invent a per-host role file. |
| Levels section (Software Engineer only, keyed on `spec.level !== null`, not on the name) | `LEVELS[i].alias` and `.effort` (zero config). Note that the models dial can change them. Name the Tech Lead's plan rule from the role's `## Levels` section, extracted verbatim. | — |
| Workflows that name the role | For each workflow, the `## Agents involved` bullets whose leading `<Display Name> —` equals a role's `# Role:` name (`listRoleDisplayNames`). | A bullet that matches no role, e.g. WF04's "Receiving role (…)", is ignored and counted in the generator's stdout line. |
| Extracted sections | One job, Activates when, Output, Board moves, Hard limits, Stop when, via `sectionBody`. All 19 roles carry all six. [VERIFIED: heading census of agent-factory/roles/*.md this session] | A missing section → fail closed, like `## One job` today. |
| Skill op: what it does | Plugin `SKILL.md` frontmatter `description`. | — |
| Skill op: allowed tools | Frontmatter `allowed-tools` list. Read through `parseFrontmatter` as a block sequence. | — |
| Skill op: workflows run | `agent-factory/workflows/NN-*.md` paths named in the SKILL body. Validate each against `listWorkflows()`; an unknown path is fail closed. The dispatcher names only WF16, so its page says the Orchestrator picks the workflow, derived from "no workflow other than the ones named". | — |
| Skill op: roles reached | Union of the role display names in those workflows' `## Agents involved`, plus `agent-factory/roles/*.md` paths named in the body. | — |
| Skill op: invocation per host | Claude Code standalone: `/` + the `.claude/skills/<dir>` name, matched to the plugin skill by `listSkillAdapters`. Claude Code plugin: `/` + `.claude-plugin/plugin.json` `name` + `:` + plugin skill frontmatter `name`. Other hosts: only the dispatcher entry exists, so a non-dispatcher op is "through the dispatcher: <`HOST_TOOLS[i].invoke`>". | Copilot `invoke` already carries `UNKNOWN - verify`. Never claim `/grugops-gate` works on OpenCode or Copilot even though `HOST_SKILL_DIRS` lists `.claude/skills` for them (no live run). |

Measured skill bodies [VERIFIED: grep of skills/*/SKILL.md this session]: `gate` → WF05, WF16. `map` → WF00, WF01, WF16. `plan` → WF02, WF03, WF16. `release` → WF12, WF16 and `roles/release-manager.md`. `ticket` → WF04, WF16. `uat` → WF06, WF16. `grugops` → WF16 and `_role-switch-protocol.md` only.

**Twin check (D-15):** the generator must not re-implement the twin relation. `npm run freshness:skill-twins` already holds `.claude/skills/grugops-<op>/SKILL.md` equal to the generated twin of `skills/<op>/SKILL.md`. Page from the plugin source only.

### Pattern 3: Tree freshness gate (rewrite `catalog-freshness.ts` on the host-entries model)

1. `closure = jsImportClosure(ROOT, "scripts/generate-catalog.js")`. Copy the closure into the temp mirror. Copy the data sources too. They are not imports, so list them by hand with the loud-failure note:
   - `agent-factory/roles`
   - `agent-factory/workflows`
   - `skills/`
   - `.claude/skills/`
   - `.claude-plugin/plugin.json`
   - `install/host-tools.js`, if not reached by the closure. It is reached when imported.
2. Spawn the mirrored generator. A non-zero exit means FAILED, never "fresh".
3. **SET:** the committed set is every file under `docs/reference/`, listed with lstat and never followed. Report EXTRA and MISSING by relative path. A non-regular file at an entry path is a named failure. A regeneration that wrote zero files is refused.
4. **BYTES:** compare each rendered page with `Buffer.equals`.
5. Cross-check the derived counts two-sided: agent pages = `ROLE_COUNT`, skill pages = `PLUGIN_SKILL_ADAPTER_COUNT`. Print "compared N pages, M differences" so a run that compared nothing cannot read as success.
6. Keep it standalone (18 D-07), wired at both ends: `.github/workflows/ci.yml` already runs `npm run freshness:catalog` [VERIFIED: .github/workflows/ci.yml:189], and `scripts/catalog-freshness.test.ts` covers it.
7. Update `.gitattributes`: replace `docs/catalog/README.md text eol=lf` with a `docs/reference/**` pin. The global `*.md text eol=lf` already covers it, but keep the explicit generated-output line for parity. [VERIFIED: .gitattributes:17]

### Pattern 4: One derived shipped-docs list (D-11, "listed once")

Declare the rule once, in `install/` (install may not import `scripts/`, but `scripts/` imports `install/host-tools.js` already). Recommended home: `install/kit-source.ts`, beside the other source derivations.

```ts
// Source: pattern of install/host-tools-prose.test.ts exclusions + install/kit-source.ts "explicit root" rule
export const DOCS_SUBPATH = "docs";
export const CHECKOUT_ONLY_DOCS: readonly { readonly path: string; readonly why: string }[] = [
  { path: "docs/audit/", why: "audit records" },
  { path: "docs/design/", why: "design records" },
  { path: "docs/initial/", why: "frozen original spec and brand inputs" },
  { path: "docs/catalog/", why: "retired by Phase 43 D-16" },        // only if kept as a pointer
  { path: "docs/dogfood-human-runbook.md", why: "maintainer runbook" },
  { path: "docs/pre-v3-state-layout.md", why: "migration history" },
];
export function shippedDocs(srcRoot: string): string[] | null { /* walk docs/, keep .md, minus exclusions; null = unreadable */ }
```

All the exclusion paths come from D-11's text [CITED: 43-CONTEXT.md D-11], `[ASSUMED]` as exact spellings. `docs/design/` exists [VERIFIED: `ls docs/design` → `shared-install.md`]. A new public docs page then ships and joins the corpus by existing, and only a checkout-only page needs a line with a reason.

Consumers:
- `copyKit` (Pattern 8).
- `check-public-docs-vocabulary.ts` (a new derived corpus part).
- `check-banned-claims.ts` (it takes the corpus whole through `publicDocsMembers()`, so it needs no new part. Only `BANNED_CLAIM_SCAN_COUNT` moves).
- The story gate's link check.

**Overlap rule:** `docs/GUARANTEES.md` and `docs/skills.md` are already singleton parts (`guarantees`, `skills`) [VERIFIED: scripts/check-public-docs-vocabulary.ts:510-519]. The corpus is a `flatMap`, so the new `docs` part must be `shippedDocs()` minus those two, or the two parts must be folded into it. **Recommend the subtraction:** it is lower churn, and the part-name unions in existing tests stay valid.

### Pattern 5: "Inside the checked file set before it is written" (STORY-04, literal)

The 42-07 precedent [VERIFIED: scripts/check-public-docs-vocabulary.ts:618-627]: commit N adds the corpus part and moves `PUBLIC_DOCS_SCAN_COUNT` and `BANNED_CLAIM_SCAN_COUNT`. That commit's gate run **refuses** with the part's named-member or vacuity message, because the page does not exist yet. Commit N+1 writes the page and the gate goes green with zero hits, which is the admission test.

Apply it per wave:
1. **Join commit:** add the shipped-docs `docs` corpus part. Move the two scan pins, reading the new numbers off the gates' own refusals and adding dated history lines. Paste the RED output into the plan summary.
2. **Write commits:** generated reference pages (via the generator), then hand pages.
3. **Registry rows** for anchors on hand pages: add new rows (C-28-048 and up, contiguous) in the **same commit** as the anchored text. `check-claim-anchors` derives its scanned documents from the rows' `file` values [VERIFIED: scripts/audit-model.ts:1935-1937 `anchoredDocs`], and `check-audit-register` requires every registry-arm file to be in `publicDocsScan()` ∪ kit [VERIFIED: scripts/check-audit-register.ts:264-296]. So the corpus join must come first.

A generated page needs no anchor. It is in the "checked file set" through the corpus part. That is the same standing `docs/GUARANTEES.md` and `docs/skills.md` have today: 0 anchors each, both in the corpus. [VERIFIED: `grep -c "claim:" docs/skills.md docs/GUARANTEES.md` → 0, 0]

### Pattern 6: Examples join the hand-trace scan set (D-18)

The scan set in `scripts/trace-instructions.test.ts` is `gitLsFiles([KIT_DIR, SUBSTRATE])` filtered to `.md`, plus a second, directory-by-directory listing that must equal it. The size is pinned: `const SCAN_SET_SIZE = 80;` [VERIFIED: scripts/trace-instructions.test.ts:75-80, 455].

To add `examples/`:
- Extend both listings, `scanSet()` and `secondListing()`.
- Move the pin 80 → 85 with a dated history line.
- Do it in the commit **after** the five rewrites, or the suite goes red at once (deferred item text). [VERIFIED: .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md]
- Set that deferred item's `status:` to resolved with the plan id.

Known hit ranges to rewrite (37-39 measurement): 05:99-102, 05:131-134, 05:142-147 (05:146 line hit). The matrix sections are 01:133-140, 02:141-148, 03:163-169, 04:143-149 and 05:129-138. [CITED: deferred-items.md 37-39 note]

**Examples 01/03 relabel (D-19):** the original capture commit is `ab0cda98` ("feat(06-05): capture REAL dogfood examples #1 and #3 from out-of-repo sample", 2026-06-04). [VERIFIED: `git log --diff-filter=A` on examples/01 and 03]

**Board corpus rows:** `scripts/board-corpus.ts` transcribes board rows from examples 02 (3 rows) and 05 (1 row) with "source line N" notes. The provenance test checks only the two fixtures, not the examples, so a rewrite does not fail it. Keep those four rows byte-identical if possible, or update the line notes. [VERIFIED: scripts/board-corpus.ts:157-158, 1982-2023; scripts/board-corpus.test.ts:362-385]

### Pattern 7: One small story gate (D-22, D-23, discretion links)

Recommended: `scripts/check-story-docs.ts` → committed `.js`, plus `npm run check:story-docs` (`tsc --outDir .tmp-build && node scripts/check-story-docs.js`), wired at both ends (a ci.yml step and a `.test.ts` that reads the wiring). Three checks, each reporting what it visited and each refusing an empty input:

1. **GAP-D1 (D-22).** Scan set: `publicDocsCorpus()` ∪ `install/README.md`. A file with a word-bounded, case-insensitive `parallel` must contain the GAP-D1 sentence verbatim: "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)". Exact wording per CONTEXT specifics [CITED: 43-CONTEXT.md `<specifics>`]. **Measured today:** the public docs have 0 hits, but `install/README.md:2012` and `:2020` say role agents are "scheduled in parallel" and lack the sentence. Either add the sentence there in this phase or scope the check to the shipped docs plus README. Recommend adding it, which is honest and cheap. [VERIFIED: grep this session]
2. **`/grug` in CLAUDE.md (D-23).** Proposed predicate: `/(?<![\w./-])\/grug(?!ops)(?![A-Za-z0-9_])/`. It matches `/grug`, `/grug:plan` and `/grug-map`. It does not match `/grugops`, `commands/grug.md` or `skills/grug/`. Write historical mentions **without** the slash token, for example "a plugin named `grug`", so the check needs no exemption list. Prove it with planted mutations. `[ASSUMED]` regex. Validate it against the live CLAUDE.md, where it should report the 14 lines found at 10, 22, 47, 65, 69, 91, 102, 111, 112, 129, 131, 133 and 150 before the fix. [VERIFIED: grep this session]
3. **Shipped-docs links (discretion).** For each file in `shippedDocs()` ∪ `agent-factory/README.md`, take every inline link `](target)` outside fenced lines. Use `fencedLineFlags` from `frontmatter.ts`, which adds this module to the frontmatter consumer pin (Pitfall 9). Skip `http(s):`, `mailto:` and `#anchor`. Resolve the rest relative to the file, after dropping any `#fragment`. **Fail** when the target is outside the shipped kit (not under `agent-factory/` and not in `shippedDocs()`) or does not exist. Known dead-in-kit link today: `docs/skills.md:17` → `../.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`. [VERIFIED: grep of docs/skills.md] Also `docs/usage.md` → `../examples/*.md` (examples do not ship per D-11), and any link to `../README.md`, `../install/README.md` or `../CHANGELOG.md`. Use absolute `https://github.com/abitwise/grugops/blob/main/...` URLs for those [VERIFIED: .claude-plugin/plugin.json `"repository": "https://github.com/abitwise/grugops"`], or see Open Question 3.

Optional durable lock for STORY-01: add `"simple software factory"` to `RETIRED_PROSE_FORMS` in `scripts/dead-vocabulary.ts` [VERIFIED: :74-77 holds `"handoff packet"`, `"the handoff is the only memory"`]. That makes every public doc refuse the tagline. `docs/initial/` is outside the corpus, so the brand manual keeps it. The cost: `check-public-docs-vocabulary.test.ts` pins the list with `toEqual`, and the list feeds the kit and foundation guards too, so re-run those.

### Pattern 8: Shipping docs into the kit home (D-11)

Today the kit home holds exactly one tree [VERIFIED: install/install.ts:449-453 — `const GRUGOPS_HOME = GIVEN_KIT_HOME ?? canonicalPathSpelling(resolve(homedir(), ".grugops"));` `const KIT_ROOT = canonicalPathSpelling(resolve(GRUGOPS_HOME, "agent-factory"));` `const KIT_COPY_SOURCE = join(GRUGOPS_SRC, "agent-factory");`]. The kit-home record grammar refuses any other kit entry:

- [VERIFIED: install/install-marker.ts:914 `export const KIT_ENTRY_PATH = "agent-factory";`]
- [VERIFIED: :1156-1158 `case "kit": if (e.path !== KIT_ENTRY_PATH) return \`a kit entry may name only ${KIT_ENTRY_PATH}\`;`]
- [VERIFIED: :1171-1176 backups `must be of ${KIT_ENTRY_PATH}` and `named ${KIT_ENTRY_PATH}.bak.<ISO>`]

The minimum change for a sibling `$GRUGOPS_HOME/docs/`:
1. **Marker schema:** allow kit entries named `agent-factory` or `docs` (a closed `KIT_ENTRY_PATHS` list). Backups `of` either, named `<entry>.bak.<ISO>`. Update `KIT_HOME_BACKUP_NAME`.
2. **copyKit:** generalize to a loop over the two entries, with the same fresh/replace/backup arms, staging dir, dry-run lines (`would-copy`, `would-back-up`), and `recordKitFile`/`entries.push({ path, kind: "kit" })` per entry. The docs source is not a whole directory. It is the `shippedDocs()` subset, so stage by copying each shipped file into `<tmp>/docs/<rel>`, not by `cpSync` of `docs/`.
3. **Prune** (`--prune-old-kit`) removes kit-home backups of either entry. **Uninstall** never touches the kit home (unchanged). [VERIFIED: install/uninstall.ts:1587 "Never remove $GRUGOPS_HOME"]
4. **Doctor (`--check`)**: optionally reports the docs tree stat beside the kit stat.
5. **Tests to re-pin:**
   - `installer-fs-census.test.ts`. Its `install.ts:copyKit:cpSync` row pins `source: 'join(GRUGOPS_SRC, "agent-factory")'` [VERIFIED: install/installer-fs-census.test.ts:495-498].
   - `installer-kit-home.test.ts`
   - `installer-prune.test.ts`
   - `installer-write-set.test.ts`
   - `ledger.test.ts`
   - `marker-binding.test.ts`
   - `installer-dry-run.test.ts`
   - `install/README.md` text describing the kit home.

The symlink install mode needs a decision: does `docs/` link like the kit, or copy? Follow whatever copyKit does for `agent-factory` today. `[ASSUMED]` that symlink mode affects only target-side entries.

### Anti-Patterns to Avoid
- **Typing a count or a list in prose or generator output:** "19 roles", "six hosts" or a hand list of agent pages. Generated text may interpolate `roles.length`. Hand text must not type a count (`host-tools-prose.test.ts` Rule A refuses host counts in all tracked docs).
- **A second section or frontmatter grammar in the generator** (no `new RegExp` over headings). `frontmatter.test.ts` D-50 IN-05 scans source text, comments included, for grammar shapes.
- **Deleting a `<!-- claim: -->` anchor or a registry row to clear red.** The bijection and id contiguity refuse it, and STORY-04 forbids it.
- **Naming `scripts/model-tiers.ts` in any shipped doc** (Pitfall 12).
- **Editing CLAUDE.md in a way that shifts line 83** without updating the citation (Pitfall 6).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section extraction from role files | Regex over `## ` headings | `unfencedHeadingIndex` + `sectionEndIndex` (`frontmatter.ts`) | LANG-07 single owner. Fence-aware. Pinned by tests. |
| Frontmatter reading | Flat `key: value` parser | `parseFrontmatter` | G-29-1 deleted exactly this. |
| Role skills | Reading `skills:` by hand | `readRoleSkills` (`role-skills-reader.ts`) | D-14 names `roleSkillsOf`. The bridge keeps the generator out of the canonical-frontmatter cutover set. |
| Role and skill membership | `readdirSync` filters in the generator | `listRoles`, `listPluginSkillAdapters`, `listAgentAdapterSpecs` | D-17. Two-sided counts. |
| Host invocation text | Typed `/grugops`, `$grugops` strings | `HOST_TOOLS[].invoke`, `launchInvoke`, `launchLiveNote` | `host-entry-docs.test.ts` LIVE-1..3 and CAUTION-1 bind doc text to the registry. |
| Mirror module list | Hand-typed twin array | `jsImportClosure` | Set-literal drift class. |
| Stream-json parsing and spawn detection for UAT | New parser | `parseFrames`, `spawnObservations`, `noteRoute`, `authorStamps`, `redactText` | Proven offline against fixtures (capture-live.test.ts). |
| Guarantees text in README | Hand pointer | Keep the generated `<!-- generated: guarantees-pointer -->` line verbatim | `POINTER_DOCS` requires exactly one pointer in `README.md`, `AGENTS.md` and `agent-factory/README.md`. [VERIFIED: scripts/generate-guarantees.ts:181-185] |

**Key insight:** in this repo every typed set rots while gates stay green, the "set-literal drift" the code comments name over and over. Every list in Phase 43 must be derived, and every pin moved must be read off the gate's own RED output.

## Claim Migration Map (STORY-04)

| Id | Today | Phase 43 action | Paired edits |
|----|-------|-----------------|--------------|
| C-28-001 | README.md, `kind: safety`, `overstated`/`accepted` | Move verbatim with anchor to `docs/concepts.md` (D-02). Change `file`. Rewrite the mechanism's "README.md:4" references. | `SAFETY_CLAIM_HOMES` entry → `docs/concepts.md` [VERIFIED: scripts/check-audit-register.ts:198 `{ claim: "C-28-001", file: "README.md" },`]. `npm run generate:guarantees` (GUARANTEES.md:54 names `README.md`). `npm run generate:safety-surface` (28-safety-surface-exclusions.md:40). Fixture tests that hard-code C-28-001 → README.md are planted fixtures, so check whether they read live (Pitfall 15). |
| C-28-002 | README.md:11, `architecture`, `true` | Retire: the row stays and the text leaves the README. **Mechanism undecided** (Open Question 1). | — |
| C-28-003 | README.md:14, `architecture`, `true` | Same as C-28-002. | — |
| C-28-004 | README version line | Keep in README, verbatim. D-01's order does not name it; place it in the quickstart. | — |
| C-28-005, C-28-006 | README quickstart (indented list items) | Keep verbatim. Both are already host-neutral and match D-05. The verbatim includes the leading spaces, so keep the list structure or re-measure. | — |
| C-28-007 | README plugin-form sentence | Move to `docs/usage.md` with anchor. Change `file` and re-measure the verbatim, since the indentation may change. | — |
| C-28-008 | README "3. **Go deep**…" | Replaced by "where to go next". Retire, same mechanism as C-28-002/003, or keep verbatim as a list item. | — |
| C-28-009 | README changelog sentence | Keep. | — |
| C-28-021..037 | `agent-factory/README.md` | Rows for moved sections ("Usage across hosts": 027-030; "How work flows": 033) move with their anchors to `docs/usage.md` / `docs/how-it-works.md`, or stay if the section shrinks to a pointer. C-28-023 and C-28-032 are safety rows; if they move, update `SAFETY_CLAIM_HOMES`. | `agent-factory/README.md` keeps its guarantees pointer line. |
| New | README story and tagline, absolutes on the new pages | New ids C-28-048 and up, contiguous. `kind` set editorially. | `CLAIM_KIND_CARDINALITY` moves for the kinds added [VERIFIED: scripts/check-audit-register.ts:243-245 — `{ kind: "architecture", count: 33 }`, `{ kind: "install", count: 8 }`]. Update the registry's header annotation with the derived row count. |

The registry statuses today [VERIFIED: scripts/audit-model.ts:131 `export const CLAIM_STATUSES = ["true", "overstated", "false", "dropped"] as const;`]; kinds [VERIFIED: :95 `["safety", "architecture", "install"]`]; anchor form [VERIFIED: :1905 `/^<!-- claim: (C-28-\d{3}) -->$/`].

## Common Pitfalls

### Pitfall 1: D-03's `dropped` status is refused for C-28-002/003
**What goes wrong:** setting `status: dropped` on an `architecture` row fails `check-claim-anchors` with "is `status: dropped` but is not a `kind: safety` row, so it rests on no floor … only a safety row has a floor to lower" [VERIFIED: scripts/check-claim-anchors.ts:313-318]. A dropped row must also **keep its anchor**, and its anchored text must equal `disclosureFor()`'s generated text [VERIFIED: docs/audit/28-claim-registry.md § "A dropped claim is replaced in place (D-18)"; scripts/generate-guarantees.ts:492-517]. `disclosureFor` throws unless a floor is lowered. So D-03 as written cannot pass the gate, and it would also leave a disclosure paragraph in the README.
**How to avoid:** Open Question 1. Get a human decision before the README plan. Recommended: add a fifth status, e.g. `retired`, for a claim withdrawn by a docs rewrite. Its row stays with its original verbatim and a mechanism naming the reason and commit. It is outside the anchor bijection, like the unanchorable rows. The gate checks the verbatim is **absent** from the named file (the inverse of the C-28-038 presence check), keeps id contiguity, and is allowed only for non-safety kinds, or for safety kinds only with a named reason.
**Code touched:**
- `audit-model.ts` (`CLAIM_STATUSES` plus its pinned tests)
- `check-claim-anchors.ts` (`anchoredDocs` input filter, the absence check, the obligations skip)
- the registry doc (a new section beside D-18)
- possibly `check-audit-register.ts`, if per-kind counts should exclude retired rows (recommend no: count all rows)
**Warning signs:** a plan step that says "set status dropped" for a non-safety row.

### Pitfall 2: The "Start a session" table is pinned to README.md
**What goes wrong:** moving the 6-host table to `docs/usage.md` (D-01) breaks:
- `install/host-entry-docs.test.ts` START-1 (`scanStartTable("README.md", …)`)
- CAUTION-1 (`scanCautions("README.md", …)`)
- LIVE-3, which asserts the per-host launch tables are exactly `["CLAUDE.md", "README.md", "agent-factory/packaging/adapters.md"]`

[VERIFIED: install/host-entry-docs.test.ts:584, 641-662, 791-854]
**How to avoid:** in the same commit that moves the table, change those cases to `docs/usage.md` and update the LIVE-3 list. LIVE-3 derives tables by scanning, so the derived set will name `docs/usage.md` once the table lives there. Keep every launch token, `launchLiveNote` text and the Pi caution in the moved table.

### Pitfall 3: Flip-manifest and diff-disposition gates are already red
**What goes wrong:** `node scripts/check-flip-manifest.js` exits 1 on the live tree because its default manifest path moved to `.planning/milestones/v2.1-phases/...` [VERIFIED: ran this session — "FAIL the flip manifest does not exist at …/.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md"]. `check-diff-disposition` has 721+ open findings (37 deferred item). Both run in CI [VERIFIED: ci.yml:517,607]. Its `docsTree` part lists every tracked `docs/**/*.md` except audit, so new docs pages would also be new members if that gate were ever repaired.
**How to avoid:** take a by-name baseline of every CI gate before the first plan. Compare after each plan against that baseline, not against "all green". Do not try to repair these two in this phase. Record them.

### Pitfall 4: README rewrite trips pinned README consumers
**What goes wrong:**
- `POINTER_DOCS` needs the guarantees pointer line in README verbatim. [VERIFIED: generate-guarantees.ts:181-185]
- `skills-kit-text.test.ts` scans README, top-level `docs/*.md`, `install/README.md` and the kit for the skills precedence line, which must occur exactly once (in AGENTS.md). [VERIFIED: scripts/skills-kit-text.test.ts:55-76] New docs pages must not quote it.
- `check-foundation-guards.ts` PIN_SCAN reads `README.md` and all of `docs/` for package-version pins. [VERIFIED: :4218-4219]
**How to avoid:** run those tests on every docs commit (see Validation Architecture).

### Pitfall 5: The wordmark draft carries a cost claim and a typed count
**What goes wrong:** the untracked `brand/readme-art.txt` (the user's draft) contains "Min Tokens", "FAST DELIVERY" and "19 Roles | 3x SWE". [VERIFIED: read this session] That breaks STORY-05 (no token-saving claims, C-28-047), the typed-count rule, and arguably the no-speed-claim stance. `check-banned-claims` would not catch "Min Tokens", because its token literals are only "token economy", "token-economy", "fewer tokens", "token savings", "saves tokens", "reduces token count" and "lowers token count" [VERIFIED: scripts/check-banned-claims.ts:423-429].
**How to avoid:** for D-01's "wordmark", use the existing original SVGs (`brand/wordmark.svg` etc.) or the header ASCII art only. Add a checkpoint asking the human which art goes in and stating that the architecture art's text must change. Never commit `brand/readme-art.txt` as is.

### Pitfall 6: CLAUDE.md line 83 is cited by line number
**What goes wrong:** `agent-factory/packaging/subagent.frontmatter.md:306` says "`CLAUDE.md` line 83". `model-dial-consistency.test.ts` reads that number and checks that CLAUDE.md's line 83 contains `**\`model\`**` and all four aliases. [VERIFIED: scripts/model-dial-consistency.test.ts:938-946; CLAUDE.md:83] D-23 edits at lines 10, 22, 47, 65 and 69 sit above line 83.
**How to avoid:** make every D-23 edit above line 83 a same-line-count replacement, or update the citation in `subagent.frontmatter.md` in the same commit. Check whether that file is an adapter-generator input; if so, run `npm run generate:adapters` / `freshness:adapters`. Also fix the project block's source `.planning/PROJECT.md:11` (Core Value `/grug`), so a GSD regeneration does not bring it back. `PROJECT.md:270` (Brand) already says `/grugops`. `.planning/research/STACK.md` holds no `/grug` [VERIFIED: grep -c → 0]. A stack-block regeneration would replace the whole old v2 stack text with the v3 additions file, so editing CLAUDE.md's stack block in place is safe against `/grug` returning. Record in the plan that the stack block no longer matches its declared source.

### Pitfall 7: Host prose rules apply to every new doc
**What goes wrong:** `host-tools-prose.test.ts` scans every tracked `.md` outside `docs/audit/` and `docs/initial/`. Rule A refuses a host count ("six host CLIs"). Rule B refuses a list of the sequential hosts with exactly one left out. `host-entry-docs.test.ts` refuses a sentence that tells Codex users to type `/grugops`. [VERIFIED: install/host-tools-prose.test.ts header; install/host-entry-docs.test.ts header]
**How to avoid:** name hosts from the registry in generated pages. In hand pages, name all hosts or none. For Codex, always give `$grugops`.

### Pitfall 8: Shipped docs link to checkout-only files
**What goes wrong:** relative links to `.planning/`, `examples/`, `install/README.md`, root `README.md` or `CHANGELOG.md` are dead in `$GRUGOPS_HOME/docs/`.
**How to avoid:** the story gate's link check (Pattern 7). Use absolute repository URLs for checkout-only targets.

### Pitfall 9: Import-set pins on the catalog generator
**What goes wrong:**
- `check-foundation-guards.test.ts` pins the list of non-test modules importing `./frontmatter.js` (14 names) and pins `generate-catalog.ts`'s frontmatter symbols to exactly three. [VERIFIED: :813-858]
- `frontmatter.test.ts` asserts nothing imports `generate-catalog.ts` (`reachedAsDependency.has("generate-catalog.ts")` is false). [VERIFIED: :5320-5327]
- A new story gate that imports `fencedLineFlags` adds a fifteenth frontmatter consumer.
**How to avoid:** keep the generator's frontmatter imports to those three symbols. Keep the generator un-imported: the freshness gate uses `jsImportClosure`, which parses and does not import. Move the consumer pin, re-derived, when the story gate lands.

### Pitfall 10: Importing `canonical-frontmatter.js` puts the generator in the verdict-renderer set
**What goes wrong:** any non-test module that imports `./canonical-frontmatter.js` joins the "cutover" set. It must then take **nothing** from `./frontmatter.js` except `stripFencedBlocks`, and the set is pinned to four names. [VERIFIED: scripts/check-foundation-guards.test.ts:1078-1131] The generator needs `parseFrontmatter`/`sectionEndIndex`/`unfencedHeadingIndex`, so a direct import of `roleSkillsOf` turns that test red.
**How to avoid:** import `readRoleSkills` from `./role-skills-reader.js`. That is a transitive edge, and the cutover filter reads direct imports only. `[ASSUMED]` that no other test pins `role-skills-reader.ts` as spawn-only; verify with a grep at plan time.

### Pitfall 11: The trace scan and corpus pins move by hand-read numbers
**What goes wrong:** `PUBLIC_DOCS_SCAN_COUNT = 12` [VERIFIED: check-public-docs-vocabulary.ts:636], `BANNED_CLAIM_SCAN_COUNT = 129` [VERIFIED: check-banned-claims.ts:1609], `SCAN_SET_SIZE = 80` [VERIFIED: trace-instructions.test.ts:455], and the `PUBLIC_DOCS_CORPUS_PARTS` name union (`"root" | "examples" | "kitReadme" | "guarantees" | "skills"`) each move. The new page count is about 4 hand pages + 1 index + 19 agent pages + 7 skill pages + faq. `faq.md` is not in the corpus today.
**How to avoid:** read each new pin off the gate's RED line, as 42-07 did, and add dated history lines naming the entrants.

### Pitfall 12: `scripts/model-tiers.ts` named in a shipped doc
**What goes wrong:** `model-dial-consistency.test.ts` derives its "dial surface" roster by scanning `agent-factory/**`, `docs/**` and root `*.md` for the literal `scripts/model-tiers.ts`, and requires it to equal three surfaces. [VERIFIED: scripts/model-dial-consistency.test.ts:52-56, 100-125] A Software Engineer reference page or `docs/usage.md` that cites the resolver by path adds a fourth.
**How to avoid:** say "the models dial (`agent-factory/config/factory.config.md`)". Never cite the `.ts` path in docs.

### Pitfall 13: Cost wording outside the literal list
**What goes wrong:** words like "cheaper", "saves money", "fast" or "efficient" pass `check-banned-claims`.
**How to avoid:** the D-22 reader review. Include a checklist line: no cost, token, speed or efficiency benefit stated or implied (C-28-047, writing-profile).

### Pitfall 14: `faq.md` ships but was never swept
**What goes wrong:** `docs/faq.md` says "Agents never merge a protected branch or deploy prod on their own", "a few simple agents" and "deliberately grug-brained". [VERIFIED: read this session] It ships under D-11 but is not in the public-docs corpus today.
**How to avoid:** it joins the corpus through the shipped-docs part. Put it in the reader review: align it with the new story and the C-28-023 "overstated" measurement.

### Pitfall 15: Tests that seed registry fixtures with `README.md`
**What goes wrong:** some tests (`audit-model.test.ts`, `generate-guarantees.test.ts:185`, `generate-safety-surface.test.ts`, `check-banned-claims.test.ts:595`) plant fixture rows naming `README.md`. Most are hermetic fixtures and unaffected. `check-claim-anchors.test.ts:796` loops over `["README.md", "AGENTS.md", "agent-factory/README.md"]` on the real tree. [VERIFIED: grep this session]
**How to avoid:** run the full related suite after the registry move, then fix the real-tree cases only.

## Code Examples

### Section extract (reuse, do not rewrite)
```ts
// Source: scripts/generate-catalog.ts:186-191 (existing; reuse for all six extracted sections)
function sectionBody(text: string, heading: string): string | null {
  const at = unfencedHeadingIndex(text, `## ${heading}`);
  if (at === -1) return null;
  const end = sectionEndIndex(text, at + 1, 2);
  return text.split("\n").slice(at + 1, end).join("\n");
}
```

### Workflows-that-name-a-role derivation (sketch)
```ts
// Source: derived from agent-factory/workflows/*.md "## Agents involved" bullets (verified shape this session)
const names = new Set(listRoleDisplayNames());          // "# Role: " headings
for (const wf of listWorkflows()) {
  const body = sectionBody(read(wf), "Agents involved") ?? "";
  for (const line of body.split("\n")) {
    const m = /^- (.+?) — /.exec(line);                  // display name before the em dash
    if (m && names.has(m[1])) byRole.get(m[1])!.push(wf);
    else if (m) unmatched += 1;                          // e.g. WF04 "Receiving role (…)"; counted, never invented
  }
}
```
`[ASSUMED]`: whether a bullet regex here trips the `frontmatter.test.ts` D-50 IN-05 grammar-site classifier. It targets frontmatter grammar shapes, so check at plan time with the existing test.

### Engineer levels (zero config)
```ts
// Source: scripts/model-tiers.ts:1517-1557 (LEVELS) and kit-model listAgentAdapterSpecs
for (const spec of listAgentAdapterSpecs().filter((s) => s.roleFile === "software-engineer.md" && s.level !== null)) {
  const row = LEVELS.find((l) => l.level === spec.level);   // junior→haiku/xhigh, mid→sonnet/high, senior→opus/medium
  // emit: `| ${spec.name} | ${row.alias} | ${row.effort} |` plus a sentence that the models dial can change both
}
```
Better than a typed `"software-engineer.md"`: select by `spec.level !== null` per role, so any future leveled role gets the section.

## Milestone UAT (success criterion 6, D-24)

- **Environment:** Claude Code 2.1.325 on PATH [VERIFIED]. The scratch repo goes in the session scratchpad or `$HOME/tmp`, outside this tree. Install with `node install/install.js --target <scratch> --claude --yes` (exact non-interactive flag: `[ASSUMED]`; confirm from `install/README.md`).
- **Driver:** a small Node script that imports the committed `scripts/capture-live.js` exports. Run it from the scratchpad, not committed to `scripts/`. A `.js` under `scripts/` without a `.ts` breaks `check:build-parity` and `freshness`. If it must be committed, write `scripts/<name>.ts` and build it.
- **Test 10:** run `claude -p --output-format stream-json --verbose --agent grugops-orchestrator "<unscored prompt>"` for 3-5 unscored prompts (for example "add a /version endpoint", "fix the typo in README"). Feed each transcript to `spawnObservations(parseFrames(text))`. Pass means no `role` in `{grugops-software-engineer-junior, -mid, -senior}` unless the transcript also shows a Tech Lead spawn whose notes name that level. The exact `--agent` plus `-p` combination and its spawn visibility: `[ASSUMED]` (capture-live used a plugin route at local scope). If `spawnObservations` returns `evidence: "none"` for every spawn, fall back to the human runbook (D-24).
- **Test 14:** prompt the session to spawn `grugops-designer` to publish a design note. Then `noteRoute(frames)` (Bash plus `context-io` path, counted as `indirectContextWrites`) and `authorStamps(<scratch>/.grugops/context)`, which lists admitted notes with their `by` stamp. A note the reader refuses is skipped under the `unsealed` arm [VERIFIED: scripts/context-io.ts:2153 `NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished", "unsealed"]`]. Pass means at least one stamp `by: grugops-designer` and zero `unsealed` skips for it.
- **Evidence:** redact with `redactText(text, homeSpellings())` before committing transcripts to the phase dir. Write `43-UAT.md` with `pending human`. Write "accepted by Olger" only from a reply that ends with the typed name (project memory).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `docs/catalog/README.md` single index | `docs/reference/**` tree + index, tree freshness gate | Phase 43 | Retire `docs/catalog/`. Update the `.gitattributes`:17, `vitest.config.ts`:33 and `audit-model.ts`:25 comments, and the `check-banned-claims.ts`:722 comment. |
| Hand-listed mirror twins | `jsImportClosure` | Phase 30 (guarantees-freshness) | Use for catalog-freshness. |
| README as the full manual | README front door + `docs/` layers | Phase 43 | Pins move (Pitfalls 2, 4). |

**Deprecated/outdated:**
- "the simple software factory" tagline (brand manual §2): replaced by "Specialist agents. Shared context. Coordinated work."
- `/grug` command shape in CLAUDE.md: shipped as `/grugops`, `/grugops-<op>`, `/grugops:<op>`, and `$grugops` on Codex.

## Runtime State Inventory

Not a rename phase. The one rename-like item is the kit home content:

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None. The claim registry is a git file. | — |
| Live service config | None found. | — |
| OS-registered state | None. | — |
| Secrets/env vars | `GRUGOPS_HOME` is unchanged; the kit home gains `docs/`. | Code edit only. |
| Build artifacts / installed state | Existing kit homes (`~/.grugops/agent-factory`) on users' machines have no `docs/`. Their `.grugops-kit.json` records only the `agent-factory` entry. | `install --update` must add `docs/` and record it. A kit-home record from before the change must still parse. Verify `readKitHomeRecord` accepts both shapes. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact spellings of the checkout-only exclusion list (from D-11 text) | Pattern 4 | A docs file ships or is held back by mistake. Low: derived and visible. |
| A2 | The `/grug` regex matches exactly the intended command words | Pattern 7 | False red or a missed `/grug`. Prove with mutations. |
| A3 | No test pins `role-skills-reader.ts` as spawn-only (never imported) | Pitfall 10 | One extra pin to move. |
| A4 | A bullet regex in the generator does not trip the D-50 IN-05 grammar-site classifier | Code Examples | Need a different extraction form. |
| A5 | `claude -p --agent grugops-orchestrator` stream-json shows `Agent` tool_use with `subagent_type` for spawned roles | UAT | Test 10 falls back to a human runbook (allowed by D-24). |
| A6 | Installer non-interactive flags for the scratch install | UAT | A command fix at run time. |
| A7 | Symlink install mode affects only target-side entries, not the kit home copy | Pattern 8 | docs/ handling needs a mode branch. |
| A8 | Retiring C-28-002/003/008 via a new `retired` status is acceptable to the human | Pitfall 1 / OQ1 | A blocking decision, so it needs confirmation before the registry plan. |

## Open Questions

1. **How are C-28-002/003 (and C-28-008) retired? This blocks the README plan.**
   - What we know: D-03 names the `dropped` status, but the gate refuses `dropped` on a non-safety row. A dropped row must keep its anchor with generated disclosure text, which requires a lowered floor (Pitfall 1).
   - What's unclear: whether the human accepts a new status (`retired`: row kept, text removed, absence checked) as the honest reading of "re-dispositioned by id, never deleted".
   - Recommendation: add a `checkpoint:decision` as the first task of the registry/README wave. Offer (a) a new `retired` status [recommended], (b) keep the C-28-002/003 anchors in README with their old text (contradicts D-01 and D-04), or (c) move the old text to a "history" page (keeps the retired tagline public).
2. **Which art is "the wordmark" in the README?**
   - What we know: SVG wordmarks exist in `brand/`. The untracked `brand/readme-art.txt` draft has a token claim and typed counts.
   - Recommendation: a human checkpoint. Default to `brand/wordmark.svg` or the header ASCII art only.
3. **Do `examples/` ship too, or do shipped pages link to them by URL?**
   - What we know: D-11 lists what ships, and examples are not on it. D-18 says each example is linked from `docs/usage.md`.
   - Recommendation: absolute GitHub URLs from `docs/usage.md` to the examples. Keep D-11 as written.
4. **Do `agent-factory/README.md` claims C-28-027..030/033 move or stay?**
   - Recommendation: move the sections and their anchors to `docs/usage.md` / `docs/how-it-works.md`, leaving a one-line pointer in `agent-factory/README.md`. This follows D-10 "each topic written once".

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, gates, installer | ✓ | v26.12.1 (floor ≥22) | — |
| tsc | build | ✓ | 6.0.3 | — |
| vitest | tests | ✓ | 4.1.8 | — |
| git | `gitLsFiles` scans, history links | ✓ | 2.53.0 | — |
| Claude Code CLI | UAT (SC-6) | ✓ | 2.1.325 | Human-run live session per D-24 |
| /tmp space | full suite, mirrors | ✓ | 6.6 G free of 15 G | Known EDQUOT false failures; compare by test name (project memory) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.8 (`fileParallelism: false`, `maxWorkers` 1) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run <file(s)>` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (>600 s; compare by test name against a baseline) |

Gate commands (each runs `tsc --outDir .tmp-build` first):
- `npm run freshness:catalog`
- `npm run check:claim-anchors`
- `npm run check:audit-register`
- `npm run check:public-docs`
- `npm run check:banned-claims`
- `npm run freshness:guarantees`
- `npm run freshness:skill-twins`
- `npm run freshness` and `npm run check:build-parity`, after any `.ts` change

**Baseline measured this session:** `check-claim-anchors`, `check-public-docs-vocabulary`, `check-banned-claims`, `check-audit-register` and `catalog-freshness` all exit 0. `check-flip-manifest` exits 1 (pre-existing, Pitfall 3).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORY-01 | README opens with the tagline; no "simple software factory" | unit (text) | `npx vitest run scripts/story-docs.test.ts` (new) + `npm run check:public-docs` if the retired prose form is added | ❌ Wave 0 |
| STORY-01 | Moved and new claims verbatim at anchors | gate | `npm run check:claim-anchors && npm run check:audit-register` | ✅ |
| STORY-02 | Docs index links to every reference page (derived) | unit | `npx vitest run scripts/generate-catalog.test.ts` (extended) | ✅ (extend) |
| STORY-02 | Examples free of hand-trace shapes | unit | `npx vitest run scripts/trace-instructions.test.ts` | ✅ (extend scan set) |
| STORY-02 | Start table and host prose bound to the registry | unit | `npx vitest run install/host-entry-docs.test.ts install/host-tools-prose.test.ts` | ✅ (re-target) |
| STORY-03 | Page per role and skill; missing, extra or stale is red | gate + unit | `npm run freshness:catalog && npx vitest run scripts/catalog-freshness.test.ts` | ✅ (rewrite) |
| STORY-04 | New pages in the corpus before written; pins moved | gate | `npm run check:public-docs && npm run check:banned-claims` | ✅ |
| STORY-04 | Retired rows kept by id; text absent | gate + unit | `npm run check:claim-anchors && npx vitest run scripts/check-claim-anchors.test.ts scripts/audit-model.test.ts` | ✅ (extend) |
| STORY-05 | GAP-D1 sentence wherever "parallel"; CLAUDE.md no `/grug`; no dead shipped links | gate + unit | `npm run check:story-docs && npx vitest run scripts/check-story-docs.test.ts` | ❌ Wave 0 |
| STORY-05 | No cost or token claims | gate | `npm run check:banned-claims` | ✅ |
| STORY-05 | CLAUDE.md line-83 citation intact | unit | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ |
| D-11 | Docs ship to the kit home; record, prune and update | integration | `npx vitest run install/installer-kit-home.test.ts install/installer-prune.test.ts install/installer-fs-census.test.ts install/ledger.test.ts install/installer-dry-run.test.ts` | ✅ (re-pin) |
| SC-6 | Level adapters never auto-delegated; designer note admitted | manual-assisted | headless driver + human typed-name sign-off | ❌ (evidence in phase dir) |

### Sampling Rate
- **Per task commit:** the quick test files for the task plus the gates it touches.
- **Per wave merge:** all gate commands above plus `npm run freshness && npm run check:build-parity`.
- **Phase gate:** full suite compared by test name against the baseline taken before plan 1, plus every CI gate against its baseline exit code.

### Wave 0 Gaps
- [ ] `scripts/check-story-docs.ts` + `.test.ts` (GAP-D1, `/grug`, links) and the `package.json` script and ci.yml step.
- [ ] Shipped-docs derivation (`install/kit-source.ts` export) + unit test.
- [ ] Retired-claim status (after the OQ1 decision) + tests in `check-claim-anchors.test.ts` and `audit-model.test.ts`.
- [ ] Baseline capture of all CI gates and the full suite by test name.

## Security Domain

`security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (installer writes) | Kit-home writes only under `$GRUGOPS_HOME`. Never `STATE_ROOTS`. Self-checkout and overlap guards (install.ts:3681-3704) unchanged. |
| V5 Input Validation | yes | The generator treats role and skill text as untrusted for table cells (`cell()` escaping). Frontmatter goes through the authority. Fail closed on unreadable input. |
| V6 Cryptography | no | — |
| V12 Files and Resources | yes | Fixed literal output paths in the generator (never argv, env or content derived). The freshness gate uses lstat before reads, so it cannot hang on a FIFO. The installer stages in `mkdtemp` and never follows links when backing up. |
| V14 Configuration | yes | No new runtime dependency. Committed `.js` freshness. |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Markdown or table injection from a role or skill file into a generated page | Tampering | `cell()` escaping. Extracted sections copied verbatim from repo-owned files, which are reviewed in git. |
| A generated page hand-edited to state something the role does not | Tampering / Repudiation | Tree freshness gate (byte compare) in CI. |
| Shipped docs overwriting a user's file at `$GRUGOPS_HOME/docs` that install never wrote | Tampering | The same record-ownership backup arm copyKit uses (back up, never overwrite unrecorded content). |
| An overstated safety claim (e.g. "humans always…") on new pages | Repudiation | Anchors + registry rows measured against mechanisms. C-28-023 residual named. Reader review. |
| UAT transcripts leaking home paths | Information disclosure | `redactText` with both home spellings. It fails closed (capture-live hard rule 7). |

## Sources

### Primary (HIGH confidence, files read this session)
- `scripts/generate-catalog.ts`, `scripts/catalog-freshness.ts`: the generator and gate to extend.
- `scripts/kit-model.ts:110-260, 740-1360`: counts, listers, adapter specs.
- `scripts/audit-model.ts:89-131, 1900-2070`: statuses, kinds, anchor grammar.
- `scripts/check-claim-anchors.ts:160-560`: bijection, dropped-row rules.
- `scripts/check-audit-register.ts:185-300`: safety homes, per-kind counts.
- `scripts/check-public-docs-vocabulary.ts:372-640`: corpus parts, pins.
- `scripts/check-banned-claims.ts:417-429, 712-730, 1112-1126, 1395-1414, 1609`: literals, parts, pin.
- `scripts/generate-guarantees.ts:170-185, 492-566`: pointer docs, disclosure, drop consistency.
- `install/install.ts:440-470, 760-800, 4859-4950`, `install/install-marker.ts:912-914, 1140-1180`, `install/host-tools.ts:40-550`: kit home and host registry.
- `install/host-entry-docs.test.ts` header and :578-854, `install/host-tools-prose.test.ts` header, `scripts/model-dial-consistency.test.ts` header and :920-946, `scripts/check-foundation-guards.test.ts:800-870, 1060-1135`, `scripts/frontmatter.test.ts:5300-5330`, `scripts/trace-instructions.test.ts:70-110, 440-515`, `scripts/skills-kit-text.test.ts:55-76`, `scripts/board-corpus.test.ts:180-460`.
- `scripts/capture-live.ts:1-120, 583-700, 1120-1240`, `scripts/context-io.ts:2153`.
- `docs/audit/28-claim-registry.md` (rows C-28-001..009, § D-18, § completeness), `README.md`, `agent-factory/README.md` headings, `CLAUDE.md` `/grug` lines and GSD markers, `.planning/PROJECT.md`, `.planning/research/{SUMMARY,PITFALLS,STACK}.md`, `39-UAT.md` tests 10 and 14, 37 `deferred-items.md`, `.github/workflows/ci.yml`, `.gitattributes`, `vitest.config.ts`, `brand/readme-art.txt`, `docs/faq.md`, `docs/skills.md`.

### Secondary (MEDIUM)
- docs.github.com — "Creating diagrams" (Mermaid fenced blocks render in Markdown files on GitHub): https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams

### Tertiary (LOW)
- None used for decisions.

## Metadata

**Confidence breakdown:**
- Standard stack (in-repo authorities): HIGH. Every module and symbol was read.
- Architecture (generator, gate, corpus, installer patterns): HIGH for the mechanics. MEDIUM for the installer change size, which touches many pinned tests not opened individually.
- Pitfalls: HIGH. Each one is tied to a line read this session. The UAT headless visibility is MEDIUM/ASSUMED.

**Research date:** 2026-11-17
**Valid until:** 2026-12-17, or until any plan in this phase moves a cited pin.
