# Phase 43: Story and layered docs - Context

**Gathered:** 2026-11-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A newcomer understands what grugops is and how to use it from three layers: a short README front door, main docs pages (core concept, how it works, usage flows with worked examples), and a generated reference page for every agent (role) and every grugops skill. Every claim on these pages is honest and registered. Requirements: STORY-01..STORY-05, plus success criterion 6, the milestone UAT carried from Phase 39 UAT tests 10 and 14.

Phase 43 delivers:
- a rewritten, short `README.md` that tells the new story (STORY-01);
- new `docs/` pages: an index, concepts, how-it-works and usage, plus five worked examples rewritten to v3 (STORY-02);
- generated reference pages for 19 roles and 7 grugops skills, with an index, from the existing catalog generator, kept fresh by a gate (STORY-03);
- claim registry discipline: new pages enter the checked file set before they are written, and moved claims are re-dispositioned by id (STORY-04);
- the honesty sweep (no cost or token-saving claims, GAP-D1 wording) and the `CLAUDE.md` `/grug` fix (STORY-05);
- shipping the public user docs into the kit home so in-kit links resolve;
- the milestone UAT run with evidence for a typed-name sign-off.

Not in this phase: new roles, skills or workflows; per-workflow reference pages; a third-party skill recommendation (Phase 42 recommended none); a new live parallel-work capture (GAP-D1 stays `UNKNOWN - verify`).

**Already locked (not re-asked):**
- Voice: plain English in docs. The grug voice survives only in light brand copy (Phase 40 voice constraint, CLAUDE.md Constraints).
- Reference pages come from the existing catalog generator, and claim anchors keep their ids (ROADMAP Phase 43 note).
- A new public page joins the claim registry's checked file set before it is written (42 D-11 precedent; STORY-04).
- grugops recommends no third-party skill, and no role declares one (Phase 42 result, `docs/skills.md`). "Skill" in STORY-03 therefore means grugops's own 7 skills.
- No docs mention of host-native code navigation is required (35 D-06).
- Cost non-claim: `agent-factory/writing-profile.md` § C-28-047 and the token-economy literals in `scripts/check-banned-claims.ts`.
- GAP-D1 wording as proven: parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (research SUMMARY Phase 43, PITFALLS Pitfall 20).
- UAT acceptance is written only from a reply that ends with the human's typed name (project memory, 42 D-15 precedent).

</domain>

<decisions>
## Implementation Decisions

### README story and length (STORY-01)
- **D-01:** The README becomes a **short front door**, about 3-4 KB. It contains, in order: the wordmark and the tagline "grugops — Specialist agents. Shared context. Coordinated work." (lowercase brand), a 3-4 sentence story, the quickstart (D-05), the how-it-works bullets (D-06), a "where to go next" list (concepts, how it works, usage, reference, install/README.md), then safety guarantees, changelog and acknowledgements/non-affiliation. The 6-host start table, the long quickstart explanation and the per-skill command list move to `docs/usage.md` (D-10). The words "the simple software factory" appear nowhere in the README.
- **D-02:** **C-28-001** (the long "file-based agent factory" paragraph) **moves with its anchor and id to `docs/concepts.md`** and is re-dispositioned there: the registry row's `file` changes, and the verbatim block and mechanism are re-measured. The README's new story sentences get **new claim ids** in the registry.
- **D-03:** **C-28-002 and C-28-003** are handled by the registry's existing **"a dropped claim is replaced in place (D-18)" rule**: each row stays, its status is `dropped` with a reason and the commit, and no row is deleted. The new tagline and story get new ids (D-02). This also closes the README sentence Phase 40 left for this phase (40-10 SUMMARY: README.md:14, "grug-brained").
- **D-04:** **No grug voice in the README body.** All README prose is plain English. The only grug touch is the art and the grugbrain.dev attribution and non-affiliation section. The `> grug keep it simple.` line is removed.
- **D-05:** **Quickstart is host-neutral**: clone, then `node ~/grugops/install/install.js --target <project>` with no host flag (the checkbox list picks hosts), then one line pointing to the per-host start table in `docs/usage.md` and to `install/README.md`. No host gets a privileged block in the README.
- **D-06:** The README carries **about 5 plain bullets on how it works**, naming the moving parts in the order they act (request → Orchestrator decomposes → queue → role agents claim and publish notes to the shared verified context → gate → a human merges and deploys). Each bullet links into `docs/how-it-works.md`. There is no diagram in the README.

### Main docs layout (STORY-02)
- **D-07:** Main docs live in **new `docs/` pages**: `docs/README.md` (the docs index), `docs/concepts.md`, `docs/how-it-works.md`, `docs/usage.md`, plus `docs/reference/` (D-14..D-17). `agent-factory/README.md` stays the in-kit "start here" for agents and installed repos.
- **D-08:** **Two pages for concept and mechanics.** `docs/concepts.md` covers the ideas: specialist roles, the shared verified context, the board as state, the gate as backpressure, and humans deciding. C-28-001 lands here (D-02). `docs/how-it-works.md` covers the mechanics: the Orchestrator decomposes the request, the queue, claims, notes admitted to the context, the gate, the trace, the release, and the honest gaps (GAP-D1).
- **D-09:** `docs/usage.md` is **organized by job and is host-neutral**: one section per thing a user wants done (bootstrap a repo, idea to tickets, ticket to PR, run the gate, UAT, release, sprint and daily sweep). Each section shows the request to type, which roles act, what lands on disk and where the human steps in. The per-host start table appears once, at the top.
- **D-10:** **Each topic is written once, in `docs/`.** `agent-factory/README.md` keeps only what an agent or installed repo needs to start (start here, configuration, install) and links out for the rest. Its "Usage across the supported host tools", "How work flows" and "Copy-paste Orchestrator prompts" sections move to the docs pages, or shrink to links. Any registered claim that moves is re-dispositioned by id (STORY-04).
- **D-11:** **The public user docs ship with the kit**, so relative links from `agent-factory/README.md` resolve both in the checkout and in an installed kit home. Only the public user docs ship: `docs/README.md`, `concepts.md`, `how-it-works.md`, `usage.md`, `reference/`, `skills.md`, `GUARANTEES.md` and `faq.md`. They are listed **once, as a derived list in one place** (the kit-model/layout pattern, never a second typed list). `docs/audit/`, `docs/design/`, `docs/initial/`, `dogfood-human-runbook.md` and `pre-v3-state-layout.md` stay checkout-only. Install, `--update`, prune and uninstall treat the shipped docs as kit files and never touch state roots. — **Reversibility:** costly — it changes the installer's kit copy set, install record counts, uninstall and prune lists and the tests pinning them; undoing it means re-pinning all of those.
- **D-12:** **Mermaid diagrams, used sparingly.** `docs/how-it-works.md` has one flow diagram (request → Orchestrator → queue → role agents → notes → gate → human). The same steps are also written as numbered text, because terminals and some viewers show mermaid as source. Other pages use tables and text.

### Reference pages (STORY-03)
- **D-13:** **One reference page per role**, 19 pages generated from `agent-factory/roles/*.md` (the `_`-prefixed protocol file excluded, as the catalog does today). The Software Engineer page carries a **levels section**: the junior, mid and senior adapter names, the model and effort resolved from the models dial, and the rule that the Tech Lead's plan names the level. The role is the single source, and adapters are never paged separately.
- **D-14:** **Page content: a generated summary plus extracted sections.** A header block holds tier, capabilities, skills (from `roleSkillsOf`), the adapter name(s) per host, and the workflows that name the role. The page then extracts One job, Activates when, Output, Board moves, Hard limits and Stop when from the role file, and links to the full source. Reads and Responsibilities stay in the source only. Any field the generator cannot derive is `UNKNOWN - verify`, never invented.
- **D-15:** **One page per grugops skill op**, 7 pages (`grugops`, `map`, `plan`, `ticket`, `gate`, `uat`, `release`), generated from the plugin `skills/<op>/SKILL.md`. The standalone twin under `.claude/skills/grugops-<op>/` is checked as the same, and the existing skill-twins freshness gate already holds that relation. Each page shows what the op does, its invocation on each host (`/grugops-<op>`, `/grugops:<op>`, `$grugops`, `/grugops` and so on, from the host-entry data, never typed), the workflow(s) it runs, the roles it reaches and its allowed tools.
- **D-16:** **The catalog becomes the reference index.** The same generator emits `docs/reference/README.md` (roles, skills and workflows tables), `docs/reference/agents/*.md` and `docs/reference/skills/*.md`, all under **one freshness gate** that fails on a missing, extra or stale page. `docs/catalog/` is retired and every link to it is updated: either the folder is removed, with a dated note in the CHANGELOG, or it is left as a one-line pointer (planner's choice, D-16a). Workflows stay as table rows linking to their source, with no per-workflow pages.
- **D-17:** Page and index membership is **derived from kit-model** (`ROLE_COUNT`, the role and skill sets), never hand-listed. A role or skill added later gets a page through the generator, or the gate goes red.

### Worked examples (STORY-02)
- **D-18:** **All five `examples/` walkthroughs are rewritten to v3**: `memory-bank/plans/` paths, the rendered trace (no hand-kept matrix), published notes, Tech Lead scoring and engineer levels where the flow passes through them, and the current commands and file names. Each is linked from its `docs/usage.md` job section. After the rewrite, **`examples/` joins the hand-trace scan set**, which closes the open Phase 37 deferred item ("The worked examples still show the retired hand-kept trace matrix").
- **D-19:** **Examples 01 and 03 (real captures from 2026-06-03) are relabeled as illustrative v3**: they carry the same illustrative honesty banner as 02/04/05, plus one line: "Based on a real run captured 2026-06-03 on v1.0; updated to v3 by hand." The original capture stays in git history and is linked by commit. Nothing still calls them real runs.
- **D-20:** **Five examples are enough.** Each usage job maps to the nearest example. Jobs without one (gate only, UAT, daily sweep) get a short inline example in `docs/usage.md` (the request, what lands on disk, the human step) instead of a new file.

### Honesty sweep and CLAUDE.md (STORY-04, STORY-05)
- **D-21:** **Every new or moved public page joins the claim registry's checked file set and the public-docs corpus before it is written**: the docs pages, the generated reference pages and `examples/`, which is already in the public-docs corpus. The existing `check-banned-claims` gate then covers cost and token wording on them. Absolute claims on hand-written pages carry `<!-- claim: -->` anchors with new ids.
- **D-22:** **Add one small GAP-D1 check**: any public docs page that describes parallel work must also carry the GAP-D1 sentence (parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify`). The plan also includes a **reader review** for overstated claims the gates cannot catch.
- **D-23:** **Fix every `/grug` in `CLAUDE.md` to what shipped.** The Core Value and the Brand constraint say `/grugops`. In the research block, each `/grug` is corrected to what shipped (plugin `grugops` → `/grugops:<op>`, standalone skills under `.claude/skills/grugops*` → `/grugops`, `/grugops-<op>`, no `commands/` folder), or marked as a historical option that was not taken. **A check fails if `CLAUDE.md` names `/grug` as a whole command word again.** Respect the GSD-managed markers in CLAUDE.md: edit the source those sections are generated from when one exists, so a regeneration does not bring the drift back.

### Milestone UAT (success criterion 6)
- **D-24:** **Claude runs it headless, and the human signs off.** Install into a scratch repo outside this tree, then drive both checks with `claude --print`, reusing `scripts/capture-live.ts` where it fits. Test 10: several unscored prompts, recording which agent is spawned; a junior, mid or senior adapter must never be reached without a Tech Lead plan naming it. Test 14: spawn `grugops-designer`, have it publish a design note, and capture that the note reaches `scripts/context-io.js` through Bash and is admitted, not refused as unsealed. Transcripts and context-io output are kept as evidence. The human reads them and accepts by typed name. If headless output cannot show a spawn decision, that test becomes a live session the human runs from a short runbook, and the record says why.

### Decisions made at plan time (human, 2026-11-17, after research)
- **D-25 (supersedes the `dropped` mechanism in D-03):** The registry and the claim-anchor gate get a **new `retired` status**. A retired row stays in the registry with its id, a reason and the commit; its text leaves the file; the gate checks that the retired text is **absent** from the named file. **C-28-002, C-28-003 and C-28-008** are retired this way. `dropped` keeps its current meaning (safety rows only, with generated disclosure). Tests cover the new status in `scripts/check-claim-anchors.test.ts` and `scripts/audit-model.test.ts`. D-03's intent (row kept, never deleted, new ids for the new tagline and story) still holds.
- **D-26:** **The README art comes from the user's draft `brand/readme-art.txt`, cleaned.** Use the header art (the `grugops` lettering and the fire). If the architecture art is used, it carries no token, cost or speed claim ("Min Tokens", "FAST DELIVERY" are removed), no hand-typed count ("19 Roles" is removed or replaced by a generated count), and no provider or host claim that is not verified. None of the draft's "Possible texts" lines are used: each makes a token, speed or parallel claim. The draft file itself is not committed as is; the cleaned art lives in the README (and in a committed `brand/` file if the plan keeps one).
- **D-27 (extends D-11):** **`examples/` ships with the kit too**, alongside the public user docs, so relative links from `docs/usage.md` to the examples resolve both in the checkout and in an installed kit home. It joins the same single derived shipped-docs list as D-11; there is no second typed list.
- **D-28:** **The `agent-factory/README.md` claims C-28-027..030 and C-28-033 move with their sections and anchors** to `docs/usage.md` / `docs/how-it-works.md`, re-dispositioned by id (D-10, STORY-04). `agent-factory/README.md` keeps a one-line pointer for each moved section.

### Claude's Discretion
- Exact README wording, the story sentences and the "where next" list, within D-01..D-06 and the writing profile.
- File names inside `docs/reference/` (slug from the role file name, for example) and the index table columns.
- Where the shipped docs land in the kit home. Recommended: `$GRUGOPS_HOME/docs/` next to `agent-factory/`, so `../docs/` from `agent-factory/README.md` resolves the same in the checkout and the kit home.
- How shipped pages link to checkout-only files (for example `docs/skills.md` → `.planning/.../42-EVALUATION.md`): use an absolute repository URL or reword, and add a link check over shipped docs so no link is dead in a kit home.
- Whether retired `docs/catalog/` is deleted or left as a pointer (D-16a).
- How the GAP-D1 check (D-22) and the `/grug` check (D-23) are wired: a new small gate or a part of an existing one, following the repo's derived-set and vacuity patterns.
- How a generated page with no hand-written claims sits in the claim registry's file set without anchors, as long as STORY-04's "inside the checked file set before it is written" holds literally.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and scope
- `.planning/ROADMAP.md` § Phase 43 — goal, success criteria 1-6, note on the catalog generator and anchor ids
- `.planning/REQUIREMENTS.md` — STORY-01..STORY-05
- `.planning/research/SUMMARY.md` § Phase 43 — delivers list (C-28-002/003, GAP-D1 wording, CLAUDE.md drift, cost sweep)
- `.planning/research/PITFALLS.md` § Pitfall 15 (cost and token claims) and § Pitfall 20 (registry drift, oversold spawning, hand-listed pages, CLAUDE.md `/grug`)

### Claim registry and honesty gates
- `docs/audit/28-claim-registry.md` — rows C-28-001..C-28-047, the row fields, and § "A dropped claim is replaced in place (D-18)"
- `scripts/audit-model.ts` — `readRegistry()`, the registry parse authority
- `scripts/check-claim-anchors.ts` — the anchor and verbatim gate
- `scripts/check-banned-claims.ts` — token-economy literals and the scan set (kit + public docs)
- `scripts/check-public-docs-vocabulary.ts` — `publicDocsCorpus()` / `PUBLIC_DOCS_CORPUS_PARTS` (root, examples, kitReadme, guarantees, skills); new docs pages join here
- `agent-factory/writing-profile.md` — plain-English rules and § C-28-047 (the cost non-claim)

### Reference generator and gates
- `scripts/generate-catalog.ts` — today's catalog generator, to be extended to emit `docs/reference/`
- `scripts/catalog-freshness.ts` — the standalone fail-closed freshness gate (18 D-07: not folded into foundation guards)
- `docs/catalog/README.md` — today's generated index, to be retired (D-16)
- `scripts/kit-model.ts` — `ROLE_COUNT`, `WORKFLOW_COUNT` and the derived role, skill and adapter sets
- `scripts/canonical-frontmatter.ts` — `roleSkillsOf` and the role frontmatter grammar
- `scripts/frontmatter.ts` — the one frontmatter parser
- `scripts/model-tiers.ts` — the models dial resolver for the engineer level section
- `scripts/skill-twins-freshness.ts` — the standalone/plugin skill twin relation
- `scripts/generate-host-entries.ts` — host invocation data for the skill pages
- `agent-factory/roles/*.md`, `skills/*/SKILL.md`, `.claude/skills/grugops*/SKILL.md` — page sources

### Docs and install surfaces being changed
- `README.md` — current front door (C-28-001..C-28-009 anchors)
- `agent-factory/README.md` — the in-kit start-here guide (sections that move under D-10)
- `install/README.md` — per-host "Using grugops on" sections, §5 and §6 (tiers)
- `install/install.ts` — `KIT_COPY_SOURCE` / `copyKit` (only `agent-factory/` ships today; D-11 extends it)
- `scripts/state-layout.ts` — `STATE_ROOTS` (never touched by install, prune or uninstall)
- `docs/skills.md` — third-party skills page (already in the public-docs corpus; links to `.planning/`)
- `CLAUDE.md` — `/grug` mentions at the Core Value, Brand constraint and stack research block (D-23)

### Examples
- `examples/01-greenfield-bootstrap.md` … `examples/05-release-run.md` — the five walkthroughs (D-18, D-19)
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md` — the open item "The worked examples still show the retired hand-kept trace matrix", with the line ranges
- `scripts/trace-instructions.test.ts` — `HAND_TRACE_PATTERNS` and the hand-trace scan set examples/ joins

### Milestone UAT
- `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-UAT.md` — tests 10 and 14 (expected behavior, deferral record)
- `scripts/capture-live.ts` — headless `claude -p` stream-json capture runner, reusable for D-24
- `scripts/context-io.ts` — note admission path for test 14

### Prior phase decisions that apply
- `.planning/phases/42-skills-per-role-and-evaluation/42-CONTEXT.md` — D-11 (registry before writing), the no-recommendation outcome
- `.planning/phases/40-plain-language-role-rewrite/40-10-SUMMARY.md` — C-28-003 left for Phase 43
- `.planning/phases/35-graph-memory-decision-record/35-CONTEXT.md` — D-06 (no code-navigation follow-up)
- `.planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md` — D-20 (operator compaction tips are kit text in WF17; the docs may point to them)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-catalog.ts`: self-discovers roles and workflows, reads the H1, the One job / When to use first sentence and the frontmatter through the one authority, and emits byte-stable output. Extend it rather than writing a second generator.
- `scripts/catalog-freshness.ts`: a mirror-spawn regenerate-to-temp plus `Buffer.equals` drift gate. Extend it to cover the whole `docs/reference/` tree, including missing and extra files.
- `publicDocsCorpus()` in `scripts/check-public-docs-vocabulary.ts`: the one public-docs membership rule. New pages are added as a derived part (the `skills` part from plan 42-07 is the latest precedent).
- `scripts/capture-live.ts`: headless capture with redaction and transcript citation, for the UAT evidence.
- Host-entry generator data: the invocation spellings per host for skill pages.

### Established Patterns
- **Derived, never typed:** counts and sets come from `kit-model.ts`. A number typed in prose or code is the named "set-literal drift" defect. Docs must not type role counts.
- **Fail-closed gates with vacuity reporting** (`scripts/vacuity.ts`, `reportMeasured`): a new check states what it visited.
- **Claims are re-dispositioned, never deleted:** the registry's dropped-in-place rule, and dated history lines rather than rewrites.
- **`UNKNOWN - verify` over fabrication** in generated fields and docs.
- **Committed `.js` built from `.ts`** with the freshness check. New scripts follow the TS → committed JS pattern.

### Integration Points
- The installer kit copy set and the install record, plus uninstall and prune lists (D-11).
- The foundation guards and npm scripts that run the freshness and claim gates.
- The links into `docs/catalog/` that must be updated when it retires (README, agent-factory/README.md, others; grep before removing).
- The CHANGELOG `Unreleased` block for the user-visible docs and install change.

</code_context>

<specifics>
## Specific Ideas

- The tagline is exactly: "grugops — Specialist agents. Shared context. Coordinated work." (lowercase `grugops`).
- The README feels like a front door: short, plain, and pointing onward. The depth lives in `docs/`.
- The GAP-D1 sentence is used as proven: "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)". The word "sessions" never appears next to "parallel" without it.
- Reference pages must be useful to a newcomer without opening the role file for the limits (hence the extracted Hard limits and Stop when sections).

</specifics>

<deferred>
## Deferred Ideas

- A new walkthrough of the Tech Lead scoring a ticket and naming the engineer level (considered, not chosen: five examples are enough, D-20).
- A parallel-work walkthrough (wip_limit refill, `now-running.md`): considered, not chosen. It would need GAP-D1 proven first.
- A fresh live re-capture of examples 01 and 03 as real v3 runs: considered, not chosen (D-19 relabels them as illustrative).
- Generated per-workflow reference pages: not required by STORY-03 (D-16 keeps workflows as index rows).
- A full manual honesty sweep of every public doc and the kit: considered, not chosen. D-22 sets the gates plus a reader review of new and changed pages.

</deferred>

---

*Phase: 43-story-and-layered-docs*
*Context gathered: 2026-11-17*
