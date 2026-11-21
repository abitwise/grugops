# Phase 35: Graph-memory decision record - Research

**Researched:** 2026-10-20
**Domain:** Planning-record authoring (one decision file + one PROJECT.md Key Decisions row); no code, no packages
**Confidence:** HIGH for every in-repo fact, path and check below (each one was read or run this session). Tool facts are carried from `.planning/research/STACK.md` §(d), not re-checked, and keep that file's own labels (D-08).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Record form and home
- **D-01:** The full record lives in a standalone file, `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`: the tools-evaluated table, the reasoning, the allowed posture, the revisit trigger, and the verification-stamp rule. PROJECT.md (already about 111 KB) gets only one row in its Key Decisions table that points to that file.
- **D-02:** The recorded decision is numbered **D-10**, continuing the v3.0 series D-1..D-9 in PROJECT.md Key Decisions, and its row is tagged `[v3.0, D-10]` like its siblings. Outcome column: the same convention the other v3.0 rows use (planner's call).

#### Revisit trigger
- **D-03:** The decision is reopened only when **both** conditions hold:
  (a) a graph or code-index tool ships as plain files with zero host runtime dependencies (no Python toolchain, no native wheels, no SQLite, no graph DB, no server), **and** its output can carry a verification stamp before it enters the shared context;
  (b) after the Phase 37 byte budgets land, a measured dogfood run shows that code-navigation reads, not state files, are the main token cost.
  Either condition alone does not reopen it.
- **D-04:** There is no date-based or scheduled review. The trigger is event-based only, and no milestone audit step is added.

#### Allowed posture (what a user and a role may do)
- **D-05:** A user may install graphify, CodeGraph or any similar tool themselves. A role may read that tool's output as an exploration aid, the same way it reads grep output. Anything the role learns that way is verified before it enters the shared context, and the tool's output itself never enters it. The posture is stated **only** in the decision record. No role text names a tool or adds a line about derived indexes, so Phases 39–43 add nothing for graph memory.
- **D-06:** The Phase 43 docs get no mention of host-native code navigation (for example Claude Code LSP plugins) because of this decision. Phase 43 can still choose that on its own, but this phase creates no follow-up for it.

#### Vendor claims and evidence
- **D-07:** The record contains **no** token-saving figure of any kind: no vendor figure, no independent-test figure, no "x-fold" multiplier, no percentage. It may say only that vendors self-report savings and that grugops has measured none. `.planning/**` is excluded from `scripts/check-banned-claims.ts` (the `**/.planning/` segment class), so no gate enforces GRAPH-02 here. The verifier has to check it by reading `35-DECISION.md` and the new Key Decisions row, including spellings the gate's literals would miss.
- **D-08:** Tool facts are taken from the research as-of 2026-10-20 (`.planning/research/STACK.md` §(d)) without a fresh web pass. The record carries that date and keeps the research's confidence labels (`LOW`, `UNKNOWN - verify`) as they are, with no upgrades.

### Claude's Discretion
- The internal structure and headings of `35-DECISION.md`, provided it covers everything in GRAPH-01/02 and D-03..D-07.
- Whether to name GSD's own `gsd-graphify` / `.planning/graphs/` in the record to head off the confusion PITFALLS.md Pitfall 19 describes. This was offered as an extra area and not discussed. Including one clarifying sentence is fine; it changes nothing outside `.planning/`.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within phase scope. (Host-native code navigation in the Phase 43 docs was considered, and the user chose not to create a follow-up; see D-06.)
</user_constraints>

<phase_requirements>
## Phase Requirements

Quoted verbatim from `.planning/REQUIREMENTS.md:13-14` [VERIFIED: .planning/REQUIREMENTS.md:13-14, read this session]:

| ID | Description | Research Support |
|----|-------------|------------------|
| GRAPH-01 | "A maintainer can read a recorded decision on graph memory (graphify and comparable tools evaluated) that states: not adopted, nothing built, what a user may do with such a tool themselves, and the trigger for revisiting it" | Tool facts table (§ Verified tool facts), the D-10 row format (§ Key Decisions row format), content check `35-check-content.mjs` (§ Validation Architecture) |
| GRAPH-02 | "The decision states that no graph-tool output enters the shared context without a verification stamp, and repeats no vendor token-saving number as a grugops result" | Stamp wording source (`verified_by`, PROJECT.md:13), the spelling list and the tested `35-check-claims.mjs` (§ Token-claim check), Pitfalls 1–2 |
| Roadmap SC-4 | "No file outside `.planning/` changes in this phase" (`.planning/ROADMAP.md:146`) | Criterion-4 check (§ Criterion 4 check), human-notes.txt pitfall (Pitfall 3) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

These directives apply to this phase. The planner must keep to them.

- **No fabrication:** unknown facts are marked `UNKNOWN - verify`. Never fake a passing gate, a test result or a citation. This applies directly to D-08: no upgrading a `LOW` or `UNKNOWN - verify` label.
- **Voice:** use clear voice for anything about compliance, money and disclaimers. A token-cost statement counts as a money statement. CLAUDE.md still lists a caveman voice for role prompts, but this record is not a role prompt, and the caveman rule was retired for v3.0 (PROJECT.md:266).
- **Brand:** always write lowercase `grugops`.
- **Markdown for everything except the tooling layer.** This phase writes markdown only. The validation helper scripts proposed below live under `.planning/` and are not tooling-layer sources: they are not in `tsconfig.json` `include` and do not match the vitest test glob.
- **GSD workflow enforcement:** edits go through `/gsd-execute-phase`. Config: `commit_docs: true`, `branching_strategy: "none"`, `allow_default_branch_commits: true`, `use_worktrees: false` [VERIFIED: .planning/config.json, read this session].
- **Minimal AGENTS.md:** not touched by this phase (SC-4).

## Summary

This phase writes one markdown file and adds one table row. All the research is about doing that correctly. Three things decide whether the phase passes.

1. **The record must not carry a token-saving figure, and the research it copies from does carry them.** STACK.md §(d) row 135 (the Graphify row, the very row the record has to reproduce) ends with a vendor percentage figure in its last cell. FEATURES.md:169, SUMMARY.md:207 and PITFALLS.md:354/435 carry a vendor multiplier and an independent-test range. STACK.md:33 says the markdown index layer "reduces tokens the same way a code graph does", which is a qualitative saving claim the record must not repeat as a grugops result. Copying STACK.md §(d) row by row would fail GRAPH-02 at once. `.planning/**` is outside every claims gate (`scripts/check-banned-claims.ts:912`), so the only defence is a check written for this phase. A tested one is below: it flags every spelling in a 27-case planted corpus and passes a full draft record.
2. **Success criterion 4 has to be checked per commit, not by a blanket range.** Phase 36 may run in parallel on `main` (`branching_strategy: none`), so a plain `BASE..HEAD` diff could pick up Phase 36's files. The repo's commit-subject convention (`docs(35)`, `docs(35-NN)`, `docs(state): … phase 35 …`) lets a per-commit filter isolate Phase 35. A tested command for it is below.
3. **The PROJECT.md row is safe to add.** Only one consumer reads PROJECT.md: the WR-05 beat oracle in `scripts/check-uat-oracles.ts`. It asserts three beats exist and bounds each line at 262,144 bytes. Neither is affected by appending one row of about 600 bytes after the D-9 row. Nothing counts Key Decisions rows or decision IDs.

Every canonical reference in CONTEXT.md exists at the cited line or section. The drift found is small and is listed under Canonical reference audit.

**Primary recommendation:** one plan in one wave. Task 1 writes `35-DECISION.md` from the verified fact list below, with the vendor-figure cell removed. Task 2 inserts the `[v3.0, D-10]` row directly after the D-9 row (PROJECT.md:265), with Outcome `— Pending`. Task 3 saves the three check scripts under the phase directory and runs them plus the criterion-4 check. Gate the phase on those checks, not on `npm test`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hold the full decision (tools, reasons, posture, stamp rule, trigger) | Planning record (`.planning/phases/35-…/35-DECISION.md`) | — | D-01; planning docs are archived with the milestone and are outside the shipped kit |
| Make the decision findable from the project ledger | Planning ledger (`.planning/PROJECT.md` Key Decisions) | — | D-01/D-02; a one-row pointer only |
| Enforce "no token figure" | Phase-local check script + verifier reading | — | `.planning/**` is outside `check-banned-claims` (D-07) |
| Enforce "no change outside `.planning/`" | git (per-commit diff-tree) | Verifier | SC-4 |
| Shipped kit (`agent-factory/`, `install/`, `skills/`, `docs/`, root files) | **Not touched** | — | D-05/D-06 and SC-4 |

## Standard Stack

Nothing is installed. The phase uses only Markdown, git (2.x present) and Node (v26.11.1 present, which meets the Node 22+ floor) to run three read-only `.mjs` checks that use the stdlib only [VERIFIED: `node --version` run this session].

**Installation:** none.

## Package Legitimacy Audit

Not applicable: this phase installs no external package.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

The record *names* five third-party tools. Naming is not installing, and the record must not tell anyone to install them on grugops's behalf. D-05 only says a user *may* install them.

## Canonical reference audit (CONTEXT.md citations vs the tree)

Each reference below was opened this session.

| CONTEXT citation | Found at | Status |
|---|---|---|
| REQUIREMENTS.md GRAPH-01/02 "lines 11–14" | `:11` heading, `:13-14` the two bullets | OK |
| REQUIREMENTS.md out-of-scope row "line 103" | `:103` | OK, with **content drift**: the row says "Every candidate needs Python, SQLite or a graph DB". That is not true of the MCP memory server (Node + JSONL) or CodeGraph's npm/binary install. STACK.md §(d) reason 1 is the accurate version: "Every candidate adds a runtime (Python or Node packages, or a DB) to the host". The record should give per-tool reasons from STACK.md and must not copy the REQUIREMENTS wording. Editing REQUIREMENTS.md:103 is outside D-01's two writes (see Open Question 2) |
| ROADMAP.md § Phase 35, four success criteria | `:138-148` | OK. `:148` still says "no research phase needed" (the user asked for research anyway) |
| STACK.md §(d) | `:131-146` (table `:133-139`, reasoning `:141-144`, posture `:146`) | OK |
| STACK.md TL;DR item 7 | `:19` | OK |
| STACK.md "row 33" (Markdown index files as the graph) | `:33` | OK, but it contains a qualitative token-reduction sentence. Do not copy it (Pitfall 2) |
| SUMMARY.md § Phase 35 | `:89-92` | OK. It names the token-claim pitfall explicitly as **Pitfall 15** |
| ARCHITECTURE.md §8 | `:271-273` | OK. The "reserve the path" sentence is superseded, as CONTEXT notes |
| PITFALLS.md Pitfall 19 | `:426-437` | OK. Its "How to avoid" asks for "the measurement method stated"; see Pitfall 4 below |
| PITFALLS.md token-claim pitfall "around line 354" | Pitfall 15, heading `:351`, body `:354`, avoid `:357` | OK. Body `:354` itself restates vendor figures |
| FEATURES.md rows 169, 189, 292 | `:169`, `:189`, `:292` | OK. `:169` carries vendor figures |
| PROJECT.md Key Decisions v3.0 rows "around lines 256–269" | v3.0 block `:256-269`; D-1..D-9 exactly `:257-265` | OK |
| check-banned-claims.ts `**/.planning/` "around line 912" | `:912` (inside `BANNED_CLAIM_EXCLUDED_LOCATIONS`, `:909`) | OK |

**Cross-file fact divergence, so the record must follow STACK.md only (D-08).** For Graphify, STACK.md:135 says it writes plain files ("No database: yes") and parses code with tree-sitter ("no LLM" for code). PITFALLS.md:429 says it "writes a graph store and HTML (LOW)" with "LLM concept extraction". The vendor figure also differs: STACK.md quotes a percentage for the paid Graphify Cloud, while FEATURES/SUMMARY/PITFALLS quote a multiplier. Neither figure belongs in the record.

**Decision-ID collision.** PROJECT.md already has a `[v2.0, D-10/D-11]` row (`:302`: the DeLM cost win "stays `UNKNOWN - verify`"), and `scripts/measure-cost.ts:1,8` calls that rule "D-10". The new record should always write its own ID with the milestone tag, `[v3.0, D-10]`. If it cites the v2.0 precedent, it should write `[v2.0, D-10/D-11]` [VERIFIED: .planning/PROJECT.md:302 and scripts/measure-cost.ts:1-12, read this session].

## Verified tool facts the record carries (verbatim from STACK.md §(d), as of 2026-10-20)

Source: `.planning/research/STACK.md:133-139` [VERIFIED: read this session]. The record's date line is "2026-10-20" (STACK.md:4: "**Researched:** 2026-10-20 (every vendor page below was retrieved on this date unless another date is given)"). The labels below are copied exactly. **Do not upgrade any of them** (D-08).

| Tool | Identity / version (verbatim) | Runtime on host (verbatim) | Storage (verbatim) | License (verbatim) | Fit (verbatim, figure removed) |
|---|---|---|---|---|---|
| Graphify | "`Graphify-Labs/graphify`, formerly `safishamsi/graphify`. PyPI `graphifyy` 0.9.92" | "**Python ≥3.10 + uv or pipx**. Dependencies: `networkx`, `numpy`, `rapidfuzz`, `tree-sitter` + about 25 grammar wheels. Optional `[mcp]` extra, git hooks, `watch`. Writes skills into `.claude/skills/` and `.agents/skills/`. Logs every query to `~/.cache/graphify-queries.log`" | "**Files**: `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md`" | "Apache-2.0" | "**No database: yes. Zero runtime deps: no** (Python toolchain + native wheels)." **The sentence after this in STACK.md:135 is a vendor token figure labelled `LOW`. Omit that whole sentence (D-07)** |
| CodeGraph | "`colbymchenry/codegraph` 1.6.2" | "Bundled runtime binary (curl or PowerShell installer) or `npm i -g`. Configures MCP for many hosts" | "**SQLite** (`.codegraph/`). \"SQLite database only\"" | "MIT" | "**No.** It is a database" |
| code-graph-rag | "`vitali87/code-graph-rag`" | "Python + **Memgraph** graph DB (Docker, per the project description: `LOW`, README not read)" | "Graph DB" | "MIT" | "**No**" |
| Serena | "`oraios/serena`" | "Python/uv + language servers" | "None persistent (LSP)" | "GitHub API reports `NOASSERTION`: `UNKNOWN - verify`" | "**No** (runtime + MCP server). Overlaps CC's LSP plugins" (D-06: say nothing more than this, and create no Phase 43 follow-up) |
| MCP memory server | "`@modelcontextprotocol/server-memory` 2.0.0" | "Node, depends on `zod` and `@modelcontextprotocol/server`" | "JSONL file" | "Repo `NOASSERTION`: `UNKNOWN - verify`" | "File-based, but **breaks verify-before-write**: the agent writes memory with no verification stamp" |

What each tool is (STACK.md column 2), safe to carry: Graphify is "A `/graphify` skill + CLI that parses code with tree-sitter (about 40 languages, \"no LLM\" for code) into a knowledge graph. Docs, PDFs and media take a semantic pass that calls the assistant's model or a configured API key. Leiden communities, `query`/`path`/`explain` commands". CodeGraph is "Pre-indexed code graph served to agents over MCP, auto-syncing on change". code-graph-rag is "Graph RAG over a monorepo". Serena is an "LSP-backed MCP toolkit for symbol retrieval and editing". The MCP memory server is "An entity/relation \"knowledge graph\" the agent writes through MCP tools".

Confidence labels to preserve: `LOW` on code-graph-rag's Docker detail, and `UNKNOWN - verify` on the Serena and MCP-servers licenses (also listed in STACK.md:245 Open Questions). STACK.md:5 rates the whole file MEDIUM, and the seam rated its web providers `LOW` (STACK.md:250). The record can say the facts are "as of 2026-10-20, not re-checked".

Reasoning (STACK.md:141-144, verbatim apart from reason 3): reason 1, "Every candidate adds a runtime (Python or Node packages, or a DB) to the host." Reason 2, "A code graph is *derived* data, not memory. If the shared context admitted its output, that output would carry no non-self verification stamp." **Reason 3 opens with the words "The token saving it targets…". Reword it** to say these tools target code-navigation reads, while the measured size problem is state files, which Phase 37's per-file records, indexes and byte budgets address. Do not state a saving.

Posture source (STACK.md:146): "a user may install graphify or CodeGraph themselves. A role may *read* such a tool's output as an exploration aid, the way it uses grep. Nothing from it enters the shared context unverified." D-05 widens this to "any similar tool" and adds "the tool's output itself never enters it".

Where the request came from: `human-notes.txt:38`, "6) graphify or similar graph database to reduce token usage - research this." This file is tracked and outside `.planning/`. **Cite it; never edit it** (Pitfall 3) [VERIFIED: git grep + sed this session; it is the only tracked file outside `.planning/` that names any of the five tools].

Verification-stamp wording source: PROJECT.md:13, "**\"verified\" means passed the §14 behavior gate**, recorded as an auditable `verified_by` stamp that the writing agent cannot forge or self-set" [VERIFIED: .planning/PROJECT.md:13, read this session]. The record can name `verified_by` for GRAPH-02.

GSD-graphify clarifier (discretion item): `gsd-tools graphify status` returned `"graphify is not enabled"`, and `.planning/graphs/` does not exist in this repo [VERIFIED: run this session]. One sentence will do, for example: "GSD, the planning tool used to build grugops, has an optional `gsd-graphify` command that writes `.planning/graphs/`. It is disabled here and is not a grugops feature."

## Key Decisions row format (D-02)

Read from `.planning/PROJECT.md:250-269` [VERIFIED: read this session]:

- Section heading: `## Key Decisions` (`:250`), then the HTML comment (`:252`), then the header `| Decision | Rationale | Outcome |` (`:254`) and the separator `|----------|-----------|---------|` (`:255`). **Three columns.**
- Sibling tag style, verbatim from `:265`: `| **[v3.0, D-9]** Ship \`claim.js\` (queue) as a materialized runnable … | Dogfood agents ran the claim protocol by hand; the ticket key set is a closed grammar. | — Pending |`. The tag is bold, at the start of the Decision cell, followed by one space.
- Outcome convention: **every** v3.0 row (`:256` through `:269`) reads `— Pending` (an em dash, a space, `Pending`). Shipped rows from earlier milestones use `✓ Good — …`, `✓ Shipped …` or `⚠️ Revisit — …`, and those are assigned at milestone close. **Recommend `— Pending`.** It matches the siblings, and the outcome is judged at v3.0 close.
- Placement: **directly after the D-9 row (`:265`)**, before the dated `[v3.0, 2026-10-20]` rows at `:266-269`. That keeps D-1..D-10 together. CONTEXT says "appended"; this placement is still an addition and keeps the series in order. The row check below enforces it.
- Path form: use the repo-root path `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`. At milestone close, phase directories move to `.planning/milestones/v3.0-phases/` (the convention for v1.0 to v2.1: `ls .planning/milestones/` shows `v1.0-phases`, `v1.1-phases`, …), so the path will go stale. Every phase pointer in this ledger shares that problem. Including the file name `35-DECISION.md` keeps the record findable.

Draft row (it passes all three checks below; the wording is the executor's call):

```markdown
| **[v3.0, D-10]** Graph memory is not adopted and nothing is built. Graphify and comparable tools were evaluated; a user may run such a tool themselves, a role may read its output only as an exploration aid, and nothing from it enters the shared context without a verification stamp. Reopened only by the trigger in the record: `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`. | Every candidate adds a host runtime (Python or Node packages, or a database) or lets an agent write memory with no verification stamp; the size problem is in state files, which Phase 37 addresses. | — Pending |
```

## Architecture Patterns

### Data flow for this phase

```
STACK.md §(d) facts ──(remove the vendor figure cell, keep labels)──┐
CONTEXT D-03..D-07 (trigger, posture, stamp, no-figure) ────────────┼──> 35-DECISION.md ──┐
human-notes.txt:38 (origin, read-only) ─────────────────────────────┘                     │
                                                                                          ├─> verifier:
PROJECT.md Key Decisions (row after D-9) <── one-line pointer to 35-DECISION.md ──────────┘    35-check-claims.mjs   (GRAPH-02 figures)
                                                                                               35-check-content.mjs  (GRAPH-01 elements)
                                                                                               35-check-row.mjs      (D-01/D-02 row)
                                                                                               criterion-4 git check (SC-4)
                                                                                               + human reading (qualitative claims)
```

### Recommended `35-DECISION.md` structure (discretion; covers GRAPH-01/02 and D-03..D-07)

1. Title carrying `[v3.0, D-10]`, then a status line: date, requirements, and "facts as of 2026-10-20 from STACK.md §(d), not re-checked; labels kept"
2. Decision: not adopted, nothing built, and no later phase builds, reserves or adds role text (D-05, roadmap goal)
3. Origin: `human-notes.txt` item 6
4. Tools evaluated (as of 2026-10-20): the five-row table with the vendor-figure sentence removed
5. Why: reasons 1 to 3, with reason 3 reworded
6. What a user and a role may do (D-05), stated only here
7. Verification-stamp rule (GRAPH-02): no graph-tool output enters the shared context without a `verified_by` stamp, and the tool's output itself never enters it
8. Vendor claims (D-07): "Vendors self-report token savings. grugops has measured none." No figure
9. Revisit trigger (D-03/D-04): both (a) and (b), either alone does not reopen it, no date-based review. Add how (b) would be measured: `UNKNOWN - verify` (see Pitfall 4)
10. Optional: "Not to be confused with" GSD's `gsd-graphify`

A full draft built on this structure was run through all three checks this session: all three PASS, and the claims check lists 5 numbers to review, none of them a figure. It is not reproduced here, so that nobody copies research wording without reading it. The table and sentences above are what it was made from.

### Anti-patterns to avoid
- **Copying STACK.md §(d) rows verbatim.** Row 135's last cell carries a vendor figure (GRAPH-02 fail).
- **Citing a research source URL.** FEATURES.md:343 lists a source URL whose slug ends in a multiplier. The claims check catches it, but simply do not cite third-party URLs; cite STACK.md §(d).
- **Reserving anything:** a `.grugops/graph/` path, a state-layout entry, a role line, a Phase 43 docs note. ARCHITECTURE.md §8's "reserve the path" is superseded (CONTEXT; roadmap goal "nothing reserved").
- **A dated review, such as "revisit at the next milestone audit".** D-04 forbids it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Which files changed in Phase 35?" | A file list typed into the plan | `git diff-tree` per Phase-35 commit (below) | A typed list is the repo's recorded set-literal-drift failure class |
| A claims gate for `.planning/` | A new `scripts/*.ts` gate or a new `check-banned-claims` scan entry | A phase-local `.mjs` under the phase directory | Anything under `scripts/` changes a file outside `.planning/` (SC-4), and widening the banned-claims scan set is Phase 43/A7 territory |

## Common Pitfalls

### Pitfall 1: The vendor figure comes in through the source table
**What goes wrong:** the executor copies STACK.md:135, or FEATURES.md:169, PITFALLS.md:354 or SUMMARY.md:207, and a vendor percentage or multiplier lands in the record.
**How to avoid:** build the record from the "Verified tool facts" table above, which has the figure sentence removed. Run `35-check-claims.mjs`.
**Warning signs:** `%`, a digit next to `x`, "fold", "times", or "Cloud" in the Graphify row.

### Pitfall 2: A qualitative saving claimed as a grugops result
**What goes wrong:** sentences like "the markdown index reduces tokens the same way" (STACK.md:33), "this cuts token cost" or "grugops's indexes are cheaper" have no number, so every numeric check passes them.
**How to avoid:** the record may say only that vendors self-report savings and that grugops has measured none (D-07). The index layer can be called "the graph grugops owns" (CONTEXT specifics) **with no claim about any saving**. A verifier reads every line that `rg -n -i 'token|cost|cheap|sav|reduc|fewer|less|spend'` prints.
**Warning signs:** verbs such as reduce, cut, save, lower, shrink or slash next to token or cost, outside the self-report sentence.

### Pitfall 3: Editing `human-notes.txt` or any other file outside `.planning/`
**What goes wrong:** the origin note (`human-notes.txt:38`) invites an "answered, see D-10" annotation. Other risks: a `CLAUDE.md` touch, or GSD state tooling. That breaks SC-4.
**How to avoid:** cite the note by path and line only. Run the criterion-4 check before the final commit and again at verification. No GSD workflow regenerates `CLAUDE.md` during execute or verify (a grep of `~/.claude/gsd-core/workflows` this session found no writer outside new-project/profile flows), but the check catches it either way.

### Pitfall 4: Trigger (b) has no stated way to measure it
**What goes wrong:** PITFALLS.md:432 asks for "the measurement method stated". The only cost instrument, `scripts/measure-cost.ts`, parses an aggregate usage object and returns `UNKNOWN - verify` until the usage schema is confirmed (`:1-12`). It cannot split reads into code-navigation and state-file reads.
**How to avoid:** the record says how (b) would be measured is `UNKNOWN - verify`, and why. That keeps D-03 honest without inventing a method. It adds no follow-up work and no reserved path.

### Pitfall 5: Confidence upgrade or date loss
**What goes wrong:** "license: MIT/Apache" written for Serena or the MCP memory server, or the Docker `LOW` caveat dropped, or no as-of date.
**How to avoid:** `35-check-content.mjs` requires `2026-10-20`, at least two `UNKNOWN - verify` and at least one `LOW`. A reader checks that each label sits on the right row.

### Pitfall 6: The plan-phase decision-coverage gate reads a covered decision as uncovered
**What goes wrong:** the §13a gate counts `D-NN` only inside `must_haves`/`truths`/`objective` frontmatter or `<objective>`/`<tasks>`/`<task>`/`<action>`. A `D-NN` cited only in `<success_criteria>`, or glued as `D-01/D-02`, reads as uncovered. Note also that the milestone ID `D-10` is not a CONTEXT decision; the CONTEXT decisions are D-01..D-08.
**How to avoid:** cite each of D-01..D-08 standalone in `must_haves.truths`. This session confirmed that all eight CONTEXT bullets parse (`decisions.cjs extractDecisions` → `D-01..D-08`, all `trackable: true`). Run the gate with an **absolute phase dir**, not the number.

### Pitfall 7: STATE.md writes during execution and the WR-05 oracle
**What goes wrong:** `check-uat-oracles` scans `.planning/STATE.md` and PROJECT.md for the three WR-05 beats, with a 262,144-byte per-line bound (`scripts/check-uat-oracles.ts:128-133`, `WR05_MAX_LINE_BYTES`). Hand-trimming STATE.md, or the state writer's escape-doubling, can break it.
**How to avoid:** do not hand-edit beat lines. Run `node scripts/check-uat-oracles.js` after the final state write.

### Pitfall 8: The planner creates a branch
Seen before in this repo: the planner subagent branched off `main`. After planning, confirm with `git branch --show-current` that the branch is `main`.

## Code Examples

These are the three phase-local checks, tested this session. Recommendation: the executor saves them **under the phase directory**, which keeps SC-4 intact, as `35-check-claims.mjs`, `35-check-content.mjs` and `35-check-row.mjs`, and VALIDATION.md runs them. They are ASCII only (non-ASCII is written as `\uXXXX` escapes), so `check-nul-bytes` stays clean. Neither `tsc` (`include` is `install/**`, `scripts/**`, `hooks/**`) nor vitest (`*.test.*`/`*.spec.*` only) picks them up.

### 35-check-claims.mjs (GRAPH-02, D-07)

Tested this session. It **passes** a full draft record and the draft row (exit 0; 5 REVIEW numbers: `one`, `zero`, `25`, `zero`, `35`, none a figure). It **fails** a planted corpus (exit 1, 27 FAIL lines) made from STACK.md:135, FEATURES.md:169, SUMMARY.md:207, PITFALLS.md:354, the FEATURES.md:343 URL, and the spellings "seventy times", "tenfold", "eighty" + "per cent" across a line break, "one third" of spend, `3×`, fullwidth digits and percent, `&#37;`, and a bare decimal "3.2" on a token line. It also fails with exit 1 on the live tree today, because the record and row do not exist yet. That is the expected RED-before-GREEN.

```javascript
// GRAPH-02 / D-07 check: no numeric token-saving figure in 35-DECISION.md or the [v3.0, D-10] row.
// Usage: node 35-check-claims.mjs [repoRoot]   exit 0 = no FAIL line; exit 1 = a FAIL line (or a missing input).
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2] ?? process.cwd();
const rec = ".planning/phases/35-graph-memory-decision-record/35-DECISION.md";
const rows = readFileSync(join(root, ".planning/PROJECT.md"), "utf8").split("\n").filter((l) => l.includes("[v3.0, D-10]"));
let fails = 0;
const fail = (m) => { fails++; console.log("FAIL " + m); };
if (rows.length !== 1) fail(`PROJECT.md has ${rows.length} lines tagged [v3.0, D-10] (want exactly 1)`);
const subjects = [
  { name: rec, text: readFileSync(join(root, rec), "utf8") },
  { name: "PROJECT.md [v3.0, D-10] row", text: rows.join("\n") },
];
// Normalise before matching: NFKC folds fullwidth digits and the fullwidth percent sign; zero-width
// characters and soft hyphens are dropped; HTML entities and a markdown-escaped percent are decoded.
const norm = (s) => s.normalize("NFKC")
  .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "")
  .replace(/&(?:percnt|#37|#x25);/gi, "%").replace(/&(?:times|#215|#xD7);/gi, "\u00D7")
  .replace(/\\%/g, "%");
const NUM_WORD = "(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|dozen|half|halve[sd]?|double[sd]?|triple[sd]?|quadruple[sd]?|twice|thrice|quarter|third)";
const HARD = [
  ["percent sign or word", /%|\bper\s?cent\b|\bpct\b|\bpercentage\b/iu],
  ["digit multiplier (Nx, x N, \u00D7)", /\p{Nd}\s*x\b|\bx\s*\p{Nd}|\u00D7/iu],
  ["-fold multiplier", /fold\b/iu],
  ["N times / orders of magnitude", new RegExp(`(?:\\p{Nd}+|\\b${NUM_WORD})\\s*times\\b|\\btimes\\s+(?:fewer|less|smaller|cheaper|more)\\b|orders?\\s+of\\s+magnitude`, "iu")],
  ["a figure the v3.0 research quotes", /71[.,]5|\b5\s*(?:-|\u2013|\u2014|to)\s*10\b|\b80\s*%|\b(?:53|45|26)\s*%|\b70\s*x/iu],
];
const COST = /token|cost|spend|saving|cheap|budget|context window|bill/iu;
const NUMW = new RegExp(`\\b${NUM_WORD}\\b`, "iu");
// Numeric shapes that are not figures, stripped before the number-on-a-cost-line test:
// dates, versions, requirement/decision IDs, phase/pitfall/item references, list markers, digits inside identifiers.
const ALLOWED = [
  /\b\d{4}-\d{2}-\d{2}\b/g, /\bv?\d+(?:\.\d+){2,3}\b/g, /(?:>=|\u2265)\s*3\.10\b/g, /\b[A-Z][A-Z0-9]*-\d+\b/g,
  /\b(?:Phase|Phases|Pitfall|item|row|rows|line|lines)\s*\d+(?:\s*(?:-|\u2013|to)\s*\d+)?\b/gi,
  /^\s*\d+\.\s/gm, /[A-Za-z_]\d+/g,
];
const review = [];
for (const { name, text } of subjects) {
  const n = norm(text);
  const lines = n.split("\n");
  const joined = n.replace(/\s*\n\s*/g, " ");
  for (const [label, re] of HARD) {
    let hit = false;
    lines.forEach((l, i) => { if (re.test(l)) { hit = true; fail(`${name}:${i + 1} [${label}] ${l.trim().slice(0, 160)}`); } });
    if (!hit && re.test(joined)) fail(`${name} [${label}] appears only across a line break`);
  }
  lines.forEach((l, i) => {
    let s = l; for (const a of ALLOWED) s = s.replace(a, " ");
    const num = s.match(/\p{Nd}[\p{Nd}.,]*/u)?.[0] ?? s.match(NUMW)?.[0];
    if (!num) return;
    if (COST.test(l)) fail(`${name}:${i + 1} [number "${num}" on a token/cost line] ${l.trim().slice(0, 160)}`);
    else review.push(`${name}:${i + 1}: "${num}"`);
  });
}
console.log(`REVIEW: ${review.length} number(s) left after the allowed shapes; a reader confirms none is a saving figure`);
for (const r of review) console.log("  " + r);
console.log(fails ? `${fails} FAIL(S)` : "PASS no numeric token-saving figure found");
process.exitCode = fails ? 1 : 0;
```

**Spellings it covers** (the list D-07 asks for): digit plus `%`; the words "percent", "per cent", "pct" and "percentage"; digit plus `x` (`70x`, `5-10x`, `1.5x`), `x` plus digit (`x10`), the `×` sign, and `&times;`/`&#215;`; the suffix "-fold" ("tenfold", "70-fold"); "N times" with digits or a number word, "times fewer/less/smaller/cheaper/more", and "order(s) of magnitude"; the research's own figures, by value, including the range with a hyphen, en dash, em dash or "to"; spelled-out numbers from zero to thousand, plus half/halve, double, triple, quadruple, twice, thrice, quarter and third; fullwidth digits and the fullwidth `％` (NFKC); zero-width characters or a soft hyphen splitting a figure; `\%` escapes and `&#37;`/`&percnt;`; a figure wrapped across a line break; and any leftover number on a line that also says token, cost, spend, saving, cheap, budget, context window or bill.

**Blind spots (stated honestly):**
- A **qualitative** saving claim with no number ("much cheaper", "far fewer reads") passes. Pitfall 2 and the reader cover this.
- A number on a line **without** a cost word (for example "reads drop by eighty" with "per cent" on the next line) is caught only by the percent rule or the cross-line rule. A bare "drops by eighty" with no unit goes to REVIEW, not FAIL, so the reader must look at every REVIEW line.
- A figure in a shape the ALLOWED list strips is not tested on a cost line: a three-part version (`1.2.3`), an ID (`ABC-80`), "Phase 80", or digits glued to letters (`gpt5`). Such a figure would also be odd as a claim, but it is a real hole.
- Roman numerals, figures inside images or linked files, and figures that only appear by following a link are not seen.
- The check covers only `35-DECISION.md` and the one `[v3.0, D-10]` row. Older PROJECT.md rows (for example `:292`) already carry DeLM figures and are deliberately out of scope.

### 35-check-content.mjs (GRAPH-01 + D-03/D-05/D-08 presence)

Tested this session: PASS on the full draft; FAIL (7 missing elements) on a stub. Passing is necessary, not sufficient, because a reader still checks the meaning.

```javascript
// GRAPH-01/GRAPH-02 presence check (necessary, not sufficient: a human/verifier still reads the record).
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2] ?? process.cwd();
const t = readFileSync(join(root, ".planning/phases/35-graph-memory-decision-record/35-DECISION.md"), "utf8").normalize("NFKC");
const need = [
  ["names Graphify", /graphify/i], ["names CodeGraph", /codegraph/i], ["names code-graph-rag", /code-graph-rag/i],
  ["names Serena", /serena/i], ["names the MCP memory server", /server-memory|MCP memory server/i],
  ["carries the research date", /2026-10-20/], ["says not adopted", /not adopted/i],
  ["says nothing is built", /nothing is built|build nothing|builds nothing/i],
  ["states the user posture", /user may install/i], ["states read-as-aid", /exploration aid/i],
  ["names the verification stamp", /verified_by|verification stamp/i],
  ["trigger needs both conditions", /\bboth\b/i], ["trigger names Phase 37 budgets", /Phase 37/],
  ["keeps a LOW label", /\bLOW\b/], ["self-report wording", /self-report/i], ["measured none", /measured none|has measured no/i],
];
const fails = need.filter(([, re]) => !re.test(t)).map(([l]) => l);
const unk = (t.match(/UNKNOWN - verify/g) ?? []).length;
if (unk < 2) fails.push(`UNKNOWN - verify appears ${unk} time(s); STACK.md \u00A7(d) carries it for Serena's and the MCP servers repo's licenses (want >= 2)`);
for (const f of fails) console.log("FAIL missing: " + f);
console.log(fails.length ? `${fails.length} FAIL(S)` : "PASS every required element is present (now read it)");
process.exitCode = fails.length ? 1 : 0;
```

### 35-check-row.mjs (D-01/D-02 pointer row)

Tested this session: PASS with the row directly after D-9; FAIL (2 lines) when the row was appended at the end of the file; FAIL on today's tree (no row, no record).

```javascript
// D-01/D-02 pointer-row check. Usage: node 35-check-row.mjs [repoRoot]
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2] ?? process.cwd();
const rec = ".planning/phases/35-graph-memory-decision-record/35-DECISION.md";
const L = readFileSync(join(root, ".planning/PROJECT.md"), "utf8").split("\n");
const fails = [];
const d10 = L.flatMap((l, i) => (l.includes("[v3.0, D-10]") ? [i] : []));
const d9 = L.findIndex((l) => l.startsWith("| **[v3.0, D-9]**"));
if (d10.length !== 1) fails.push(`want exactly 1 line tagged [v3.0, D-10], found ${d10.length}`);
else {
  const row = L[d10[0]];
  if (!row.startsWith("| **[v3.0, D-10]** ")) fails.push("row does not open with `| **[v3.0, D-10]** ` like its D-1..D-9 siblings");
  const cells = row.replace(/\\\|/g, "").split("|").slice(1, -1);
  if (cells.length !== 3) fails.push(`row has ${cells.length} cells, the table has 3 (Decision | Rationale | Outcome)`);
  if (!row.includes("35-DECISION.md")) fails.push("row does not point to 35-DECISION.md");
  if (d9 < 0 || d10[0] !== d9 + 1) fails.push(`row is at line ${d10[0] + 1}; D-9 is at line ${d9 + 1} (expected directly after it)`);
  const start = L.findIndex((l) => l === "## Key Decisions"), end = L.findIndex((l, i) => i > start && l.startsWith("## "));
  if (!(d10[0] > start && d10[0] < end)) fails.push("row is not inside the ## Key Decisions section");
}
if (!existsSync(join(root, rec))) fails.push(`${rec} does not exist`);
for (const f of fails) console.log("FAIL " + f);
console.log(fails.length ? `${fails.length} FAIL(S)` : "PASS pointer row well-formed and placed after D-9");
process.exitCode = fails.length ? 1 : 0;
```

Note on the cell split: a literal `|` inside an inline-code span would be miscounted. The draft row has none.

### Criterion 4 check (SC-4: no file outside `.planning/` changes)

Record `BASE` before the first execution commit. `4f282a25` is the commit just before Phase 35's first commit (`92012e12 docs(35): capture phase context`; `git rev-parse 92012e12^` = `4f282a250d085a1fbe310d2f9459d291cbf910c1`).

```bash
BASE=4f282a25   # parent of Phase 35's first commit
# (1) Per-commit, Phase-35 commits only. This stays correct if Phase 36 commits interleave on main.
bad=$(for c in $(git rev-list "$BASE"..HEAD); do
  s=$(git show -s --format=%s "$c")
  if printf '%s' "$s" | grep -Eq '^[a-z]+\((35|35-[0-9]+|phase-35)\)|[Pp]hase 35([^.0-9]|$)'; then
    git diff-tree --no-commit-id --name-only -r "$c" | grep -v '^\.planning/' | sed "s|^|$c |"
  fi
done)
# (2) Working tree: nothing staged, modified or untracked outside .planning/.
dirty=$(git status --porcelain --untracked-files=all -- . ':(exclude).planning/')
# (3) Whole-range diff. Valid only when no other phase committed in the range.
range=$(git diff --name-only "$BASE"..HEAD -- . ':(exclude).planning/')
if [ -n "$bad$dirty" ]; then echo "FAIL outside .planning/:"; printf '%s\n%s\n' "$bad" "$dirty"; exit 1; fi
[ -n "$range" ] && echo "WARN range diff shows non-.planning files; confirm they belong to another phase's commits: $range"
echo "PASS no Phase 35 commit and no working-tree change touches a file outside .planning/"
```

Run on today's tree: Phase 35 commits found = `dbe232a7`, `92012e12`, both touching `.planning/` only; working tree clean outside `.planning/`; range diff empty. **Failure signal** (demonstrated with `BASE=f572d128^`): the range arm prints `.claude-plugin/plugin.json`, `CHANGELOG.md`, `CLAUDE.md`, `README.md`, … and the check prints `FAIL`. **Blind spot:** a commit whose subject matches neither pattern escapes arm (1). Arm (3) catches it whenever no other phase interleaves, so the executor should use `docs(35-01): …` subjects (the repo convention: 63 `docs(34.1)` subjects plus per-plan `docs(34.1-NN)` subjects).

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| ARCHITECTURE.md §8: "reserve the path" for a derived graph index | Reserve nothing (roadmap goal, CONTEXT) | 2026-10-20 (Phase 35 discuss) | The record must not name a reserved path |
| Pitfall 19 / SUMMARY: the decision lives *in* the Key Decisions table | A standalone record plus a one-row pointer (D-01) | 2026-10-20 | Two writes; the row stays short |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 36 might commit on `main` between Phase 35's commits | Criterion 4 check | Low. The per-commit arm handles it, and the range arm is advisory |
| A2 | GSD's `phase complete` / state tooling writes only under `.planning/` during this phase | Pitfall 3 | Low. Grep-based, not executed; the criterion-4 check would catch a violation |
| A3 | A `.mjs` file under `.planning/phases/35-…/` triggers no repo gate | Code Examples | Low. Checked against `tsconfig.json` `include`, the vitest config and the banned-claims exclusions; `check-nul-bytes` scans tracked files and the scripts are ASCII |

All tool facts are `[CITED: .planning/research/STACK.md §(d)]`, as-of 2026-10-20. They are deliberately not re-verified (D-08).

## Open Questions

1. **Outcome cell: `— Pending` or `✓ Recorded`?**
   - What we know: every v3.0 row uses `— Pending`, and D-02 says "the same convention the other v3.0 rows use".
   - Recommendation: `— Pending`. The outcome is judged at milestone close, like its siblings.
2. **Should REQUIREMENTS.md:103's inaccurate reason ("Every candidate needs Python, SQLite or a graph DB") be corrected?**
   - What we know: it is wrong for the MCP memory server (Node + JSONL; the reason it is excluded is verify-before-write). CONTEXT limits the writes to the record and one row.
   - Recommendation: do not edit it in this phase. The record gives the accurate per-tool reasons. Mention the mismatch in the plan SUMMARY so a human can decide.
3. **Where do the check scripts live?**
   - Recommendation: as files in the phase directory (re-runnable by the verifier). Alternative: inline in VALIDATION.md only. Both keep SC-4 intact.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | criterion-4 check | ✓ | (repo in use) | — |
| node | the three `.mjs` checks, repo gates | ✓ | v26.11.1 | — |
| gsd-tools | commit / state | ✓ | (`~/.claude/gsd-core/bin/gsd-tools.cjs`) | — |

**Missing dependencies:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No new tests. Phase-local Node checks, plus existing repo gates as regression (vitest exists: `vitest.config.ts`) |
| Config file | none for this phase |
| Quick run command | `node .planning/phases/35-graph-memory-decision-record/35-check-claims.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-content.mjs && node .planning/phases/35-graph-memory-decision-record/35-check-row.mjs` |
| Regression command | `node scripts/check-uat-oracles.js && node scripts/check-nul-bytes.js && node scripts/check-banned-claims.js && node scripts/check-foundation-guards.js` (all four exit 0 today; under 1 s each except the banned-claims scan), then `npx vitest run scripts/check-uat-oracles.test.ts scripts/check-nul-bytes.test.ts scripts/check-banned-claims.test.ts` (about 9 s per file, all green today: 56 + 131 tests) |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` is not needed for a docs-only phase. Never run `npm test`: it starts the live e2e lane |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Failure signal | File Exists? |
|--------|----------|-----------|-------------------|----------------|-------------|
| GRAPH-01 | The record names all five tools, says "not adopted" and "nothing is built", states the user posture and read-as-aid, the both-conditions trigger and Phase 37 | presence | `node …/35-check-content.mjs` | `FAIL missing: <element>`, exit 1 | ❌ Wave 0 (created in-phase) |
| GRAPH-01 | Facts keep the as-of date and labels (D-08) | presence + read | `35-check-content.mjs` (date, `LOW`, at least two `UNKNOWN - verify`) + reader checks each label is on its STACK.md row | `FAIL missing: …` / reader finds a mismatch | ❌ Wave 0 |
| GRAPH-01 | No dated review (D-04); no reserved path or role-text follow-up (D-05/D-06) | manual read | `rg -n -i 'reserve\|schedul\|quarterly\|audit\|Phase 4[0-3]\|role text\|LSP' 35-DECISION.md` and read each hit | a hit that schedules, reserves or creates a follow-up | — |
| GRAPH-02 | No numeric token-saving figure in the record or the row | automated | `node …/35-check-claims.mjs` | `FAIL <file>:<line> [<rule>]`, exit 1; each REVIEW line read | ❌ Wave 0 |
| GRAPH-02 | No qualitative saving claimed as a grugops result | manual read | `rg -n -i 'token\|cost\|cheap\|sav\|reduc\|fewer\|less\|spend\|lower\|cut' 35-DECISION.md` and read each hit; only the "vendors self-report … grugops has measured none" sentence and the trigger (b) wording may talk about tokens | a sentence asserting a saving | — |
| GRAPH-02 | Verification-stamp rule present | presence + read | `35-check-content.mjs` ("names the verification stamp") + reader | `FAIL missing: names the verification stamp` | ❌ Wave 0 |
| D-01/D-02 | Exactly one `[v3.0, D-10]` row, 3 cells, directly after D-9, inside Key Decisions, pointing to `35-DECISION.md` | automated | `node …/35-check-row.mjs` | `FAIL <reason>`, exit 1 | ❌ Wave 0 |
| SC-4 | No Phase-35 commit or working-tree change outside `.planning/` | automated | criterion-4 bash block above | `FAIL outside .planning/: <sha> <path>`, exit 1 | n/a (shell) |
| Regression | PROJECT.md readers stay green | automated | `node scripts/check-uat-oracles.js` | `CHECK(S) FAILED` naming a WR-05 beat or `WR05_MAX_LINE_BYTES` | ✅ |

**Known pre-existing reds (not caused by this phase; compare to baseline, do not require green):** `node scripts/check-flip-manifest.js` exits 1 because `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` does not exist (it was archived with v2.1). `node scripts/check-diff-disposition.js` exits 1 with "63 finding(s) over 40 elements" on the watched safety-surface corpus. Both were measured this session, before any Phase 35 write.

### Sampling Rate
- **Per task commit:** the relevant phase-local check (claims + content after Task 1; row after Task 2)
- **Per wave merge:** all three checks + criterion-4 + `node scripts/check-uat-oracles.js`
- **Phase gate:** all of the above + the targeted vitest files + the verifier's reading of every REVIEW line and every hit from the manual `rg` sweeps

### Wave 0 Gaps
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-claims.mjs`: covers GRAPH-02 (save the code above)
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-content.mjs`: covers GRAPH-01
- [ ] `.planning/phases/35-graph-memory-decision-record/35-check-row.mjs`: covers D-01/D-02
- RED-before-GREEN: all three exit 1 on today's tree (no record, no row). Capture that output once before Task 1.

## Security Domain

`security_enforcement: true`, ASVS level 1. No code, endpoint, credential or dependency changes. The security content is the policy itself: graph-tool output is **untrusted derived input**.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (as policy) | Graph-tool output never enters the shared context, and what a role learns from it passes the existing verify-before-write admission (`verified_by` stamp, PROJECT.md:13) |
| V6 Cryptography | no | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unverified derived index becomes memory ("second source of truth", Pitfall 19) | Tampering | Stamp rule in the record; nothing built or reserved |
| A vendor figure restated as a grugops result | Repudiation (the trace stops being proof) | `35-check-claims.mjs` + reader (D-07) |
| Scope creep into the shipped kit | Tampering | Criterion-4 check |
| A confidence label upgraded | Repudiation | `35-check-content.mjs` + reader (D-08) |
| A user-installed tool sends docs to a model or API key and logs queries to `~/.cache/graphify-queries.log` (STACK.md:135) | Information disclosure | Optional: one factual sentence in the posture section. That is the user's own choice, and grugops installs nothing |

## Sources

### Primary (HIGH confidence; read or run this session)
- `.planning/phases/35-graph-memory-decision-record/35-CONTEXT.md`, `35-DISCUSSION-LOG.md`
- `.planning/REQUIREMENTS.md:11-14, 101-110`; `.planning/ROADMAP.md:116-148`; `.planning/PROJECT.md:9-14, 250-305`; `.planning/config.json`
- `.planning/research/STACK.md:1-50, 128-152, 186-278`; `SUMMARY.md:89-92, 150-156, 200-210`; `ARCHITECTURE.md:271-273`; `PITFALLS.md:351-365, 426-437`; `FEATURES.md:169, 189, 292, 343`
- `scripts/check-banned-claims.ts:1-60, 410-429, 715-935`; `scripts/check-uat-oracles.ts:100-260`; `scripts/check-uat-oracles.test.ts:50-70, 455-470`; `scripts/check-foundation-guards.test.ts:300-345`; `scripts/check-flip-manifest.ts:1-60, 425-470`; `scripts/measure-cost.ts:1-40`; `tsconfig.json`; `vitest.config.ts`; `human-notes.txt:30-42`
- Gates run: check-uat-oracles (0), check-nul-bytes (0), check-banned-claims (0), check-foundation-guards (0), check-residual-citations (0), check-public-docs-vocabulary (0), check-claim-anchors (0), check-flip-manifest (1, pre-existing), check-diff-disposition (1, pre-existing); vitest check-uat-oracles + check-nul-bytes (56 passed), check-banned-claims (131 passed)
- `~/.claude/gsd-core/bin/lib/decisions.cjs` `extractDecisions` on 35-CONTEXT.md → D-01..D-08 trackable; `gsd-tools graphify status` → disabled

### Secondary
- None. No web fetch, per D-08.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Nothing to install; Node and git were probed
- Architecture (record + row + placement): HIGH. Read from PROJECT.md
- Checks: HIGH for what they catch (each was run against planted positives and a clean draft); blind spots are listed
- Tool facts: as STACK.md labels them (MEDIUM overall, rows `LOW`/`UNKNOWN - verify` where marked); not re-verified, by decision

**Research date:** 2026-10-20
**Valid until:** the end of Phase 35. The tool facts are frozen as of 2026-10-20 by D-08.
