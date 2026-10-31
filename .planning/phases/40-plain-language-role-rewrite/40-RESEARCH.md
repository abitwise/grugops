# Phase 40: Plain-language role rewrite - Research

**Researched:** 2026-10-31
**Domain:** Markdown role-prompt rewrite under a dense set of TypeScript guards (voice, size, section, disposition, sentence-form, adapter-baseline gates)
**Confidence:** HIGH for the guard map, the measurements and the file lists (every value below was read or run in this session). MEDIUM for the recommended mechanisms (D-29, D-30, the inventory design), which are designs and not yet built.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (already decided, not re-asked)
- Caveman is retired from role text. The grug voice lives only in light brand copy and never in role instructions (PROJECT.md voice discipline, revised v3.0 2026-10-20).
- The caveman flip is the **first plan**, lands as one atomic change (`ROLE_SECTIONS`, `guard_caveman_voice` inverted so no caveman fence can return, `guard_voice` over whole files, `agent-factory/writing-profile.md`, claim C-28-003 re-dispositioned by id, the `CLAUDE.md` Voice discipline constraint), and the inverted guard is seen failing before it passes (PLAIN-01).
- `scripts/voice-model.ts` is hash-pinned in the admission hook's frozen manifest. Change its consumers, never the file.
- [v3.0, D-1]: one corpus total of 67,383 B covers all roles including Tech Lead and Designer, plus a recorded per-file ceiling for each role. Detail moves into workflows.
- [v3.0, D-9]: role text joins the governed writing-profile surfaces. No new ticket keys.
- ponytail rules are rewritten as grugops text (never installed), with MIT attribution in NOTICE and no benchmark numbers (they trip `guard_banned_claims`).

#### Byte budget
- **D-01:** Repeated boilerplate shrinks to a **short pointer line per role** (for example "Context: WF16 read/write, WF18 compaction."). The full wording lives once in the workflow or shared file it points to. Every role keeps its own pointer, because a spawned agent reads only its own role file and the inventory checks each role.
- **D-02:** Per-file ceilings are **allocated first, measured after.** The plan sets a byte target per role before writing, the targets sum to the headroom target (D-03), and the orchestrator gets the largest share. Writers work to their target. Afterwards `ROLE_CEILINGS` is recorded from the measured result.
- **D-03:** **Reserve headroom** for Phases 41 and 42. The rewritten corpus lands at or below about **64 KB**, leaving about 3 KB for Phase 41's orchestrator flow text and Phase 42's per-role skills line.
- **D-04:** A new **corpus-total guard** FAILs above 67,383 B and WARNs above the headroom target (about 64 KB; the planner fixes the exact number from the allocation). The total guard is the hard cap. Per-file ceilings with +12% headroom may sum to more than 67,383 B, and that is fine.
- **D-05:** Role detail that doesn't fit its target moves **into the workflow or checklist that already runs the role** (WF04, WF16 and so on). The role keeps what to do and its limits; the workflow keeps how.
- **D-06:** Workflow files get **no new byte budget.** Each plan summary records the before and after bytes of every workflow or checklist it touched, so the shift is visible.
- **D-07:** **Re-baseline all 19 `ROLE_CEILINGS` entries** (plus the protocol if the guard covers it) from the post-rewrite measurement with the usual +6% WARN / +12% FAIL headroom. Each comment names Phase 40 and the measured bytes. Old history comments are dropped, because those baselines no longer describe the files. The table keeps failing closed on an unknown role and keeps its two-way key check against `listRoles()`.

#### Role skeleton
- **D-08:** Section list after the rewrite: `## One job` · `## Activates when` · `## Reads` · `## Responsibilities` · `## Output` · `## Board moves` · `## Trace updates` · `## Hard limits` · `## Stop when` (new). Headings keep their names because `generate-role-adapters.ts` and `generate-catalog.ts` build adapter descriptions from `## One job` and `## Activates when`. The goal is stated in One job, inputs in Reads, outputs in Output. Optional sections such as the engineer's `## Levels` and `## Do less` stay allowed.
- **D-09:** **Timing of ROLE_SECTIONS edits:** plan 1 (the atomic flip) only removes `## Caveman prompt`. `## Stop when` and `## Activates when` are added to `ROLE_SECTIONS` in the plan that finishes the last role batch, with a red-before-green check.
- **D-10:** `## Stop when` is its own section. Each item pairs a trigger with an outcome: the status the role reports (`BLOCKED`, done, a `failed-attempt` note per WF04) and who the ticket goes to. `## Hard limits` keeps only the never-do rules.
- **D-11:** **Voice:** second person, imperative ("You implement one ticket. Pull the shared context first. Never fake a test result."). No grug words anywhere in role files. The protocol's `▶ entering <ROLE>` announce line stays, because it is an output format, not voice.
- **D-12:** **Drop heading suffixes** (`## Output (file + format)` becomes `## Output`, `## Board moves (which column transitions this role causes)` becomes `## Board moves`). Checked: only code comments in `scripts/validate-agent-factory.ts` (lines 368, 403) mention the suffixes, and the validator matches by prefix.
- **D-13:** "Follow the 12 coding rules in `AGENTS.md`" stays **only in roles that write code or config**: software-engineer, tech-lead, qe-e2e, frontend-ui, installer, agents-md-scribe, greenfield-mapper, orchestrator. The planner confirms the set. Other roles drop it, and the rule inventory records that set as intended rather than as a loss.
- **D-14:** Responsibilities has no fixed item cap. Each item is one action plus its reason in one sentence. A reason clause stays only where it carries real guidance.
- **D-15:** `_role-switch-protocol.md` is rewritten under the same plain-English rules: grug persona phrases ("which grug holds the work", "Fresh head") are removed, and the five steps are kept in its protocol shape, not the role section list.
- **D-16:** **Plan shape:** plan 1 is the atomic caveman flip. Plan 2 writes `software-engineer.md` to the new skeleton as the **reference role**, including the `## Do less` section. That plan ends with a **human checkpoint**, where the user reads and approves voice, shape and length. After that, the remaining roles are rewritten in parallel batches that copy the reference pattern. The planner picks the batch split.
- **D-17:** `orchestrator.md` gets a **full plain rewrite now**, keeping today's flow rules as they are but compacted. Phase 41 adds its flow guidance into the reserved headroom.
- **D-18:** Tech Lead and Designer (drafted in plain English in Phase 39) are **conformed**, not rewritten from scratch: they get `## Stop when`, lose the heading suffixes (and caveman if present), gain the TL do-less rules, and fit their target. Recent wording that already passes is kept.
- **D-19:** When role text moves into a workflow or checklist, **only the moved text** is written in plain English. The rest of that file is untouched.

#### Do-less rules and lean lens
- **D-20:** **The Tech Lead trims the ask, the engineer builds lean.** The Tech Lead does scope-first at planning time: every place the change must reach (callers, tests, fixtures, config, exports), options nobody asked for named and dropped, and the never-cut floor written into the `## Tech Lead plan`. The engineer runs the reuse-before-build ladder while coding, finishes the whole change (callers, tests and fixtures it breaks), leaves one small test for new non-trivial logic, marks `shortcut:` comments and ends with the "Not checked" line.
- **D-21:** In `software-engineer.md` the rules live in an optional **`## Do less`** section (ladder, floor, one-test rule; about 600-800 B). The `shortcut:` marker format and the "Not checked" line go in `## Output`. They must be in the role text itself, because rules in the main session do not reach spawned agents (ponytail's subagent issue #252).
- **D-22:** The "what was skipped" line is a **`Not checked:` line in an `observation` note** published per WF16 with the implementation notes. It is one or two lines on what was skipped on purpose or left unchecked, plus any risk the human must know, and it is never longer than the change (ponytail's v1 lesson). There is no new note kind and no new ticket key.
- **D-23:** The marker format is `shortcut: <the limit>, <when to upgrade>`, a **text rule only.** The lean lens flags a marker with no upgrade trigger. No ledger or script in this phase (deferred).
- **D-24:** The do-less rules are **the same for every engineer level.** The level changes which tasks a role takes, not how disciplined it is. The junior hard exclusions stay as they are.
- **D-25:** The **lean-review lens** in `agent-factory/checklists/pr-review-checklist.md` is **advisory, never blocking on its own**, and every finding needs a concrete case ("no case, no finding", no style-taste findings). Sub-tags: delete, reuse, stdlib/native, yagni, merge, split by job (never by line count). Review priority order puts correctness, safety and tests before lean. No savings or line-count number is ever printed (ponytail-gain's honesty rule and grugops' no-fabrication rule).
- **D-26:** **NOTICE** gets a short adaptation credit: the do-less rules in the engineer and Tech Lead roles and the lean-review lens are adapted from ponytail (`github.com/dietrichgebert/ponytail`), MIT, followed by the MIT permission notice and the copyright line exactly as in ponytail's LICENSE. If the LICENSE can't be read, the copyright line is marked `UNKNOWN - verify`. No benchmark numbers.

#### Rule inventory and safety gates
- **D-27:** The role-rule inventory is **derived by a script and committed**, generated before any role is rewritten. Per role, it records: no-fabrication, `UNKNOWN - verify`, WF16 and WF18 pointers, absent-config fallback, the board transitions the role owns, stop/`BLOCKED` rules, junior exclusions, and the D-13 coding-rules set. A guard reruns the derivation after the rewrite and fails on any lost fact. The set is derived, never hand-listed.
- **D-28:** "Still holds" means the **anchor token plus the meaning.** Fixed tokens must survive exactly per role (`UNKNOWN - verify`, `16-context-read-write.md`, `18-context-compaction.md`, board column names, `BLOCKED`, `failed-attempt`); the prose around them may be reworded. The guard checks tokens and the plan review checks meaning.
- **D-29:** **Board-move partition guard:** derive the `X → Y` transitions from each role's `## Board moves`, and fail on a transition with two owners or a board-contract transition with none. Compare the result with the pre-rewrite inventory. Reuse an existing guard if one already does this.
- **D-30:** **Diff-disposition gate (Phase 29, `scripts/check-diff-disposition.ts`):** record a decision that moves `docs/audit/29-style-dispositions/00-base.md` to the commit just before Phase 40, and that **for role files the role-rule inventory guard stands in for per-clause disposition rows** during this rewrite. Frozen safety clauses in non-role files stay verbatim. Today the gate treats `## Hard limits` sentences as FROZEN by `structuralSections`; the planner works out the exact mechanism (watched-corpus scope, a recorded exception, or similar) so the gate stays mechanical and fails closed. — **Reversibility:** costly — it changes the scope of a Phase 29 safety gate and its recorded base, and undoing it means re-dispositioning every clause changed since.
- **D-31:** **"More detail" is shown** by two things: per role, the derived inventory fact count after the rewrite is at least the count before (new Stop-when items count), and a verifier reader check on each role (can a reader name the goal, inputs, outputs, board moves, limits and stops from the file alone?). The bytes come from removing caveman, boilerplate and flow detail, never facts.
- **D-32:** **Writing-profile gates (PLAIN-07):** when the lexicon or sentence gate flags role text, reword first. A term is added to the lexicon only when it is a grugops name a role must use (a column, a note kind, a config key), and each addition is listed in the plan summary.

### Claude's Discretion
- Batch split and wave layout for the role batches after the reference-role checkpoint.
- The exact per-role byte targets and the exact WARN number (about 64 KB), within D-02/D-03.
- Exact wording of the short pointer lines (D-01) and of the shared text they point to.
- The mechanism for D-30, within its stated constraints.
- Final membership of the D-13 code-or-config role set, recorded in the inventory.

### Deferred Ideas (OUT OF SCOPE)
- A `shortcut:` ledger (a grep of `shortcut:` comments into a report that flags rows with no upgrade trigger, as ponytail-debt does). New tooling; backlog.
- A full plain-English pass over workflows and checklists beyond moved text. Phase 43 docs or a later milestone.
- Applying the Phase 39 "three disputed rounds before a human" rule to other checkpoints. Already a recorded deferred follow-up in 39-UAT.md, not this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAIN-01 | No role carries a caveman block; the voice constraint, the section list, the voice guards, the writing profile, claim C-28-003 and `CLAUDE.md` change together in one atomic change, with the inverted guard seen failing first | § "The atomic flip: every file that changes together", § "Inverted guard design", § "Red-before-green evidence convention", Pitfalls 1-4 |
| PLAIN-02 | All 19 roles and the role-switch protocol are rewritten in clear, compact English that states each role's goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than today | § "Role skeleton rules the guards impose", § "Byte allocation", § "Recommended batch layout", Pitfalls 5-9 |
| PLAIN-03 | A role-rule inventory generated before the rewrite still holds after it | § "Role-rule inventory design", § "Board-move partition (D-29)", measured anchor-token table |
| PLAIN-04 | All role files together stay within 67,383 bytes, enforced by a guard, with a recorded per-file ceiling for each role | § "Byte allocation", § "Corpus-total guard design", measured per-section byte table |
| PLAIN-05 | Engineer and Tech Lead carry grugops-authored "do less" rules adapted from ponytail, MIT attribution in NOTICE, no borrowed benchmark numbers | § "Do-less rules: what to adapt", § "NOTICE", `guard_banned_claims` literal list |
| PLAIN-06 | The PR review checklist has a lean-review lens that flags over-engineering | § "Lean-review lens" |
| PLAIN-07 | Role text is a governed surface of the writing profile (lexicon and sentence gates pass on every role) | § "PLAIN-07: joining the governed corpus", measured 132 findings today |
</phase_requirements>

## Summary

The role text itself is the easy part of this phase. What makes it hard is that about a dozen guards and tests read role text, and each one pins something different: section headings, byte ceilings, the caveman fence, the first sentence of `## One job`, whole phrases in Phase 39 roles, clause uniqueness, and every changed clause against a recorded git base. The plan has to know each consumer before the first role is touched. Every one of them was read or run for this research. The baseline is green except two failures already recorded in Phase 39. `check-diff-disposition` reports **721 findings** and `check:flip-manifest` fails.

Seven facts decide the plan's shape. **(1)** `mirror()` in `scripts/check-foundation-guards.test.ts` throws for any role that has no caveman fence (`normalizeMirroredRole` → `mirror repair: … fence refused`). Plan 1 must rewrite that helper, or most of the 15,506-line suite goes red the moment the fences are removed. **(2)** Adapter descriptions and the catalog are built from the **first sentence of the first line** of `## One job` plus the first sentence of `## Activates when`. `adapter-byte-baseline.test.ts` pins adapter bytes to commit `8a530552…`. Keep both lines byte-identical and add new detail after them, and no generator, adapter or baseline changes. **(3)** Roles are named in `GOVERNED_CORPUS_EXCLUDED_LOCATIONS` today, so the sentence gate never reads them. Measured against today's text, it would report **132 findings over the 20 role-corpus files**. **(4)** Numbered `## Responsibilities` items count as *procedural* sentences to the sentence gate (`ORDERED_MARKER`). That means at most 20 words and no modal (`should may might could would must shall can`). **(5)** `check-diff-disposition.js`, `kit-model.js` and `voice-model.js` are all inside the admission hook's frozen manifest. Editing `check-diff-disposition.ts` for D-30 is allowed, but `npm run generate:hook-manifest` must run again after the last edit. **(6)** The fence-blind test `uat-gate-exit-contract.test.ts:634` pins the old base SHA by design ("the measuring stick did not move"), so D-30 must change that test, the `00-base.md` README sentence and the CI comment together. **(7)** No guard today derives board transitions. The current `## Board moves` texts disagree with each other and with the seed board's `Exit owner` column, at four places listed under Open Questions.

**Primary recommendation:** Build the safety net first and the prose second. Plan 1 does four things in order. It commits the derived role-rule inventory baseline. It lands the D-30 base move and the inventory stand-in, recording the 721 pre-existing findings it retires. It adds a permanent planted-mirror test that shows the inverted voice guard red. Then it lands the atomic flip commit. Plan 2 writes the reference engineer role. Parallel batches follow. One final plan adds `## Stop when` and `## Activates when` to `ROLE_SECTIONS` (with 187 fixture role files), re-baselines `ROLE_CEILINGS`, adds the corpus-total guard and the partition guard, joins roles to the governed corpus, and closes C-28-003.

## Architectural Responsibility Map

This is a repo-tooling and markdown-kit phase with no browser, server or database tier. The map uses this repository's own tiers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role instructions (what to do, limits, stops) | Kit markdown (`agent-factory/roles/`) | Workflows (`agent-factory/workflows/`) for the "how" (D-05) | The role file is the only text a spawned agent is guaranteed to read (D-01, D-21) |
| Voice enforcement (no caveman) | Build-time guard (`scripts/check-foundation-guards.ts`) | `scripts/voice-model.ts` (read-only authority) | voice-model is hash-pinned, so only its consumers change |
| Sentence-form enforcement on roles | Build-time gate (`scripts/check-imperative-lexicon.ts`) | `agent-factory/writing-profile.md` (contract text) | PLAIN-07 / D-9: roles join the governed corpus |
| Section presence | Structure validator (`scripts/validate-agent-factory.ts`) | Fixtures under `scripts/fixtures/*/agent-factory/roles/` | `ROLE_SECTIONS` is prefix-matched presence |
| Byte budget (per file and total) | Build-time guard (`guard_role_size` plus a new total guard) | — | D-04: the total is the hard cap |
| Rule-survival proof | New derived inventory script plus committed baseline | Diff-disposition gate (stand-in arm, D-30) | D-27/D-30 |
| Board-move ownership | New partition guard | Seed board `Exit owner` table (contract) | D-29: nothing derives this today |
| Adapter descriptions and catalog | Generators (`generate-role-adapters.ts`, `generate-catalog.ts`) | Freshness gates plus `adapter-byte-baseline.test.ts` | Read only the first sentence of the first line of `## One job` and `## Activates when` |
| License attribution | `NOTICE` (root) byte-copied to `agent-factory/NOTICE` | `install/installer-kit-home.test.ts` | The test asserts byte identity |

## Project Constraints (from CLAUDE.md)

- Markdown for everything except the tooling layer. The tooling is TypeScript compiled with `tsc` to **committed `.js`**, with a freshness check (`npm run freshness`). Every `.ts` edit needs `npm run build`, and the `.js` is committed with it.
- Zero runtime dependencies on hosts. The only dev dependencies are `typescript`, `vitest` and `@types/node`. This phase adds **no packages**.
- Safety (hard): agents never merge protected branches or deploy to production. Every role's hard limits keep this. The git host is the floor, and role text is a written rule.
- Single-source: role text lives once, and adapters are thin pointers (generated).
- Zero-config first: every role honors `factory.config.json` when present and runs lean on documented defaults when absent. This is the absent-config fallback the inventory must keep.
- Voice discipline. CLAUDE.md still reads "Caveman voice in every role prompt" and **is changed in the atomic flip**. The current PROJECT.md wording is the target (quoted below).
- No fabrication: mark unknowns `UNKNOWN - verify`, and never fake a gate, a test result or a citation.
- Minimal AGENTS.md (not touched by this phase).
- Brand: lowercase `grugops`. Keep the grugbrain.dev attribution and the non-affiliation disclaimer visible (`NOTICE` lines 4-7 are cited by a code comment in `voice-model.ts:383`, so append the new credit below them and do not reflow those lines).
- GSD workflow enforcement: edits happen inside `/gsd-execute-phase`.

## Standard Stack

No new libraries. The phase uses only what the repo already has.

### Core
| Tool | Version (verified) | Purpose | Why |
|------|---------|---------|-----|
| Node.js | v26.12.1 on this machine; `engines: ">=22"` [VERIFIED: `node --version`, package.json] | Runs committed `.js` gates | Project constraint |
| TypeScript | 6.0.3 [VERIFIED: `npx tsc --version`] | Compiles guard changes | Project constraint |
| vitest | 4.1.8 [VERIFIED: `npx vitest --version`] | Permanent red/green cases | Project constraint; `vitest.config.ts` sets `testTimeout: 180_000`, `slowTestThreshold: 5_000` |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed by this phase. No slopsquatting check applies. **Packages removed:** none. **Packages flagged:** none.

## Architecture Patterns

### System Architecture Diagram

```
                    role author edits agent-factory/roles/*.md
                                     |
       +-----------------------------+-----------------------------------+
       |                             |                                   |
       v                             v                                   v
 [generators] (One job 1st      [build-time gates over role text]    [git diff vs recorded base]
  sentence + Activates when       |                                       |
  1st sentence only)              +-> validate-agent-factory: ROLE_SECTIONS presence (prefix)
       |                          +-> check-foundation-guards:            check-diff-disposition
       v                          |     guard_voice (lexicon, whole file)   |  every changed clause in
 .claude/agents/*.md, docs/       |     guard_caveman_voice (INVERTED:      |  watched corpus needs a row;
 catalog, skill twins             |       no fence may exist)               |  role `## Hard limits` = FROZEN
       |                          |     guard_role_clause_uniqueness        |      |
       v                          |     guard_role_size (ROLE_CEILINGS)     |      +-- NEW stand-in arm (D-30):
 freshness gates +                |     NEW corpus-total guard              |          role files admitted iff
 adapter-byte-baseline.test       +-> check-imperative-lexicon:           |          role-rule check passes
 (bytes pinned to 8a530552)       |     guard_sentence_form (NEW roles part)  |          (spawned CLI, fail-closed)
                                  +-> NEW check-role-rules:                     v
                                  |     inventory superset vs committed   721 pre-existing findings
                                  |     baseline; board-move partition    retired by base move (recorded)
                                  +-> check-banned-claims (literal list, scans NOTICE too)
                                  +-> check-kit-refs / check-state-paths / trace-instructions
```

### Recommended Project Structure (new and changed files)
```
scripts/
├── check-role-rules.ts / .js        # NEW (name is a suggestion): derives the inventory, checks partition; --write-baseline mode
├── check-role-rules.test.ts         # NEW: planted-mirror red/green cases
├── check-foundation-guards.ts       # guard_voice / guard_caveman_voice inverted; corpus-total guard; ROLE_CEILINGS rebaseline
├── check-foundation-guards.test.ts  # mirror() normalization rewritten; caveman cases inverted
├── check-imperative-lexicon.ts      # roles part added (final plan), exclusion entry removed, count 49 -> 69
├── check-diff-disposition.ts        # stand-in arm for agent-factory/roles/ (D-30)
├── validate-agent-factory.ts        # ROLE_SECTIONS edits (plan 1 and final plan)
└── voice-model.ts                   # UNCHANGED (hash-pinned)
docs/audit/
├── 40-role-rule-inventory.json      # NEW: committed derived baseline (generated, never hand-edited)
└── 29-style-dispositions/
    ├── 00-base.md                   # base_commit moved + stand-in declaration (D-30)
    ├── README.md                    # the "moving this SHA is not a remedy" paragraph amended with the D-30 exception
    └── 40-NN.md                     # one rows file per plan that edits a workflow
```

### The atomic flip: every file that changes together (PLAIN-01)

These are the files that must be in the **single flip commit**. Each is listed with what it holds today.

| # | File | What changes | Evidence |
|---|------|--------------|----------|
| 1 | `scripts/validate-agent-factory.ts` (+ `.js`) | Remove `"## Caveman prompt"` from `ROLE_SECTIONS`, and update the comment at 368 that cites suffixes | [VERIFIED: scripts/validate-agent-factory.ts:371-380] quoted below |
| 2 | `scripts/check-foundation-guards.ts` (+ `.js`) | Invert `guardCavemanVoice` (any fence is a finding). Make `guardVoice` scan whole files: remove `EXPECTS_CAVEMAN_FENCE`, or set it empty, so every voice file takes the existing "declared none → scan whole" branch. Rewrite the header comments (D-24 transcripts at 3316-3350 describe the old guard). Update the `guard_kit_counts` message at 1649 if the guard is renamed | [VERIFIED: read 2815-3420] |
| 3 | `scripts/check-foundation-guards.test.ts` | **Rewrite `normalizeMirroredRole` / `repairCavemanBlock` / `mirror()`** (lines 425-590). Invert or delete the caveman-specific cases (around 5668-9100: IN-03 neutralization cases, LANG-07 oracle, FORM 4, open-fence cases, the "smoke: real tree is FULLY GREEN" case asserting `caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT}`). Add the permanent red case | [VERIFIED: read 221-660, 8979-9000] |
| 4 | `scripts/voice-model.test.ts` | Case "every live role returns ok with a non-empty interior" (line 540) asserts `readCavemanFence(...).ok === true` for every live role. It must become "every live role returns `missing`" (the test file is not hash-pinned) | [VERIFIED: scripts/voice-model.test.ts:540-590] |
| 5 | All 19 `agent-factory/roles/*.md` | Delete the `## Caveman prompt` section (heading plus fence). In this commit, change nothing else in role prose except what keeps gates green | measured caveman bytes table below |
| 6 | `agent-factory/writing-profile.md` | Line 7-9 ("The caveman voice belongs in the fenced `## Caveman prompt` block…"), the exclusion bullet at 232-233, and the paragraph at 306-308 ("This profile does not govern the fenced caveman blocks…"). Do **not** edit the anchored C-28-045 sentence at 303-304 unless `docs/audit/28-claim-registry.md` changes in the same commit (registry anchor, byte-compared) | [VERIFIED: agent-factory/writing-profile.md, check-claim-anchors run] |
| 7 | `docs/audit/28-claim-registry.md` | Re-disposition C-28-003 by id (mechanism text at line 112 quotes `guard_caveman_voice` and "17 blocks") and its F-28-202 row (line 939) | [VERIFIED: read 105-117, 939] |
| 8 | `CLAUDE.md` line 18 | Replace the Voice discipline bullet with the PROJECT.md:257 wording | [VERIFIED: CLAUDE.md:18, PROJECT.md:257] |
| 9 | `scripts/check-imperative-lexicon.ts` (+ `.js`) | The roles exclusion reason names `guard_caveman_voice`. If the guard is renamed, update the reason string (the entry itself goes in the PLAIN-07 plan) | [VERIFIED: check-imperative-lexicon.ts:299-305] |

Quoted values:

- `ROLE_SECTIONS` today [VERIFIED: scripts/validate-agent-factory.ts:371-380]:
  ```
  const ROLE_SECTIONS = [
    "## One job",
    "## Caveman prompt",
    "## Reads",
    "## Responsibilities",
    "## Output",
    "## Board moves",
    "## Trace updates",
    "## Hard limits",
  ];
  ```
- CLAUDE.md:18 today [VERIFIED]: `- **Voice discipline**: Caveman voice in every role prompt; clear voice in security findings, compliance, money, and disclaimers — Why: the joke earns trust, it never replaces the explanation or muddies a safety topic`
- PROJECT.md:257 target [VERIFIED]: `- **Voice discipline (revised v3.0, 2026-10-20)**: Clear, compact, plain English in every role prompt and doc; the grug voice survives only in light brand and playful copy, never in role instructions, security findings, compliance, money or disclaimers — Why: the caveman rule applied to role prompts alone, so it never lowered input tokens (every other prompt and file stayed plain English), and it made roles harder to understand`
  - **Caution:** the PROJECT.md "Why" contains the phrase "lowered input tokens". It is not in the banned literal list (`fewer tokens`, `token savings`, `saves tokens`, `reduces token count`, `lowers token count`, `token economy`, `token-economy`) [VERIFIED: scripts/check-banned-claims.ts:377-397]. CLAUDE.md sits at the repo root and is scanned by `check-banned-claims` unless excluded. Run `node scripts/check-banned-claims.js` after the edit.
- C-28-003 verbatim anchor, README.md line 14 (Phase 43 owns README) [VERIFIED: docs/audit/28-claim-registry.md:115-117]: `Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.`
- Registry statuses are `true` or `overstated` today, and a non-`true` row needs a `disposition` from `["fixed", "accepted", "deferred"]` [VERIFIED: scripts/audit-model.ts:89] and a `finding_id` matching `F-28-NNN`. A `deferred` row also needs a `target_phase` [VERIFIED: scripts/check-claim-anchors.ts:462-500].

**C-28-003 recommendation.** In plan 1 the "short words" half has no gate any more. The caveman guard is inverted, and roles are not yet governed by `guard_sentence_form`. Two honest options:
- (a) Move the row to `status: overstated`, `disposition: deferred`, `finding_id: F-28-202`, `target_phase: 40`. Close it back to `true` in the PLAIN-07 plan with a mechanism that says the role corpus is governed by `guard_sentence_form` (WP-02 at 20 and WP-03 at 25 words) and that no role carries a caveman fence. Update the F-28-202 table row at each step.
- (b) Keep `true` and rewrite the mechanism in plan 1 to name the inverted guard plus `guard_role_size`. This is weaker, because "short words" would then be unmeasured until PLAIN-07.

Option (a) is the one that follows the repo's "status is measured" rule (D-17 in check-claim-anchors). The README sentence itself stays for Phase 43.

### Inverted guard design (PLAIN-01)

Use only what voice-model already exports (`readCavemanFence`, `countLexiconTokens`, `CAVEMAN_LEXICON`). Do not declare a new fence state machine or a `/^## Caveman prompt/` regex in `check-foundation-guards.ts`. `frontmatter.test.ts:6296-6320` and `:5835` count those constructs in the guard file's source.

- **guard_caveman_voice (inverted):** for each file in the role corpus, `readCavemanFence(text)` must return `{ ok: false, reason: "missing" }`. `ok: true` means a fence is present. `multiple` and `unterminated` mean a malformed fence is present. Each is a finding naming the file and the reason. Keep `reportMeasured` with an independent denominator (`ROLE_COUNT`, plus 1 if the protocol is covered). Note that `missing` is also returned for a bare heading with no fence. If the planner wants a bare `## Caveman prompt` heading refused too, use `unfencedHeadingIndex(text, "## Caveman prompt")` from `scripts/frontmatter.ts:765`. That is a string argument, not a regex, so the source pins do not count it. Run `scripts/frontmatter.test.ts` and `check-foundation-guards.test.ts` afterwards, because they pin which symbols the guard file imports.
- **guard_voice over whole files:** the `else if (verdict.reason === "missing" && !expectsFence)` branch already scans the whole document for `SEC_VOICE_FILES`. Deleting `EXPECTS_CAVEMAN_FENCE` (or making it empty) sends every role down that branch. An `ok: true` verdict on any voice file then hits the existing finding "a ## Caveman prompt fence appeared on a surface declared to carry none". `neutralizePhrases` keeps exempting `/grug`, `grug voice` and `grug wink`. Every other lexicon term fails anywhere in the file.
- **Protocol coverage (recommended):** add `_role-switch-protocol.md` to both scans so that grug words cannot return there. Today it has "head grug", "which grug holds the work" and "the earlier grug's half-thoughts", and none of them is scanned. Derive the set from `listRoleDirEntries(ROOT).filter(f => f.endsWith(".md"))`, which the guard file already imports for `guard_role_frontmatter`. Do not add a kit-model helper, because that would move the hook manifest. The test mirror must then copy the protocol. `GUARD_INPUTS` excludes it, and the test asserts that exclusion at `check-foundation-guards.test.ts:6656-6661`.
- Lexicon terms to keep out of plain role prose [VERIFIED: scripts/voice-model.ts:370-391]: `"grug"`, `"club"`, `"rock"`, `"cave"`, `"smash"`, `"shiny"`, `"brain hurt"`, `"me think"`, `"no think"`, `"big think"`, `"big brain"`, `"spirit"`, `"demon"`, `"swamp"`, `"shiny rock"`, `"sharp stick"`. Matching is word-boundary and case-insensitive. Watch for ordinary English such as "in the spirit of" and "rock-solid".

### Red-before-green evidence convention (how "seen failing first" is recorded here)

The repo practice (Phase 29 D-24, restated in CONTEXT "Established Patterns") is a **permanent test case on a planted mirror, never a quoted transcript**. Transcripts may appear in the SUMMARY and in code comments as extra evidence. Do it this way:
1. Change the guard first and run it against the unchanged tree. It should be RED with 19 of 19 findings (all roles still carry fences). Record the count in the SUMMARY.
2. Add permanent cases to `check-foundation-guards.test.ts`. On the unplanted mirror the gate is GREEN (the control). With a fenced `## Caveman prompt` block planted into one mirrored role, it exits 1 naming that file. With a lexicon token planted outside any fence in a role, `guard_voice` exits 1. If the protocol is covered, add the same plant into the protocol.
3. Delete the fences. The real tree goes green.
4. The same shape applies to D-09 (`ROLE_SECTIONS` additions), the corpus-total guard, the inventory guard, the partition guard and PLAIN-07. Each gets a planted-mirror red case and a green control.

### Role skeleton rules the guards impose (PLAIN-02)

| Rule | Source | Consequence for writers |
|------|--------|-------------------------|
| Keep the **first line's first sentence** of `## One job` byte-identical | `firstSentence()` = first line of the section up to the first `". "` [VERIFIED: generate-role-adapters.ts:200-204, generate-catalog.ts:138-142]; adapters pinned [VERIFIED: adapter-byte-baseline.test.ts:90 `PRE_PHASE_ADAPTER_BASELINE = "8a530552d6c0e815d2959d16a8c06d99cc2d612b"`] | New goal detail goes in a second sentence or on following lines. Rewording "Implement one ticket end to end." into "You implement…" changes 21 adapters, the catalog and the MODEL-01 baseline |
| Keep the `## Activates when` first sentence byte-identical | Same. The description is `${firstSentence(job)} Use when: ${firstSentence(act)}` [VERIFIED: generate-role-adapters.ts:431] | "Need code (one ticket)." stays as written. Do not add "e.g. " before the first period |
| `# Role: <Name>` heading unchanged | catalog name; `technicalNames()` in the lexicon gate; board `Exit owner` names | — |
| `tier-kit-text.test.ts` pins Phase 39 sentences | [VERIFIED: tier-kit-text.test.ts:179-470, 553-650]. Examples: tech-lead has exactly one `16-context-read-write` and one `18-context-compaction`; `## Levels` "sits right after `## Responsibilities`"; exact sentences in TL `## Hard limits` / `## Responsibilities`; `section()` is prefix-matched | Put `## Do less` **after** `## Levels`. Moving a TL hard-limit sentence into `## Stop when` breaks section-scoped asserts, so update those tests on purpose and never weaken them |
| Numbered items are procedural | `procedural = (inSteps && isBullet) \|\| ORDERED_MARKER.test(raw)` [VERIFIED: check-imperative-lexicon.ts:1089] | Every numbered Responsibilities item: at most 20 words per sentence, no modal |
| Modal set | [VERIFIED: scripts/voice-model.ts:420] `modal: ["should", "may", "might", "could", "would", "must", "shall", "can"]` | "At any level you may deviate" fails inside a numbered item. Write it as an unnumbered bullet or as "You deviate from the plan only when…" |
| Sentence bounds | [VERIFIED: check-imperative-lexicon.ts:555-556] `PROCEDURAL_SENTENCE_MAX_WORDS = 20`, `DESCRIPTIVE_SENTENCE_MAX_WORDS = 25` | Lines are split at `.!?` + space. Table cells are measured one by one |
| WP-06 / WP-07 / WP-08 | A sentence starting `This/That/These/Those` + copula/modal/auxiliary; `and/or`; a numbered item starting with an approved step verb followed by `and`/`then` + another approved verb | One action per numbered item (matches D-14) |
| Intra-file clause uniqueness | `guard_role_clause_uniqueness` (normalized clauses of 4+ words, intra-file) | Do not restate a limit in both `## Hard limits` and `## Stop when` |
| No hand-trace instructions | `trace-instructions.test.ts` scans every role for "add to the trace by hand" patterns | `## Trace updates` says the trace is rendered from note refs, never "append a row to traceability.md" |
| `orchestrator.md` kit-vs-state blockquote | `check-state-paths` subtracts exact occurrences of `LEGACY_FALLBACK_CLAUSE` [VERIFIED: install/state-layout.ts:91-92] `"If \`memory-bank/plans/board.md\` is absent and \`plans/board.md\` exists, use \`plans/\` and say once: run \`install --migrate\`. If both exist, use \`memory-bank/plans/\` and say once that \`plans/\` is stale."` | Keep that clause byte-exact or remove every `plans/` mention. A partial reword produces legacy-path sites |
| Backticked paths must resolve | `check-kit-refs` | New pointer lines must name real files |
| Note kinds | [VERIFIED: agent-factory/contracts/context-note.md "The six note kinds"] `claim`, `finding`, `decision`, `failed-attempt`, `observation`, `artifact-ref` | "Not checked:" goes in an `observation` note (D-22) |

### Byte allocation (D-02, D-03, D-04)

Measured on 2026-10-31 [VERIFIED: `wc -c agent-factory/roles/*.md` and a per-section Node measurement this session]. Total **78,011 B** over 20 files.

| File | Now | Caveman | Context I/O + Compaction lines | `## Trace updates` | config `Reads` bullet | heading suffixes | "12 coding rules" line | `## Hard limits` | **Target** |
|------|----:|----:|----:|----:|----:|----:|----:|----:|----:|
| orchestrator.md | 7272 | 237 | 0 (own form) | 253 | 256 | 58 | 43 | 1930 | **5900** |
| software-engineer.md | 4631 | 189 | 367 | 367 | 301 | 58 | 43 | 1054 | **4050** (gains `## Do less` 600-800) |
| security-nfr.md | 5022 | 145 | 367 | 344 | 334 | 58 | 43 | 1242 | **3850** |
| tech-lead.md | 3776 | 170 | 367 | 146 | 246 | 58 | 43 | 1070 | **3500** (gains scope-first) |
| compliance-officer.md | 4378 | 147 | 367 | 342 | 352 | 58 | 43 | 825 | **3350** |
| release-manager.md | 4166 | 160 | 367 | 348 | 246 | 58 | 43 | 885 | **3200** |
| agents-md-scribe.md | 3949 | 178 | 367 | 385 | 246 | 58 | 0 | 783 | **3050** |
| frontend-ui.md | 3937 | 215 | 367 | 253 | 294 | 58 | 43 | 972 | **3050** |
| architect-design.md | 3865 | 156 | 367 | 331 | 246 | 58 | 43 | 703 | **3000** |
| ba-pm.md | 3837 | 174 | 367 | 354 | 246 | 58 | 43 | 760 | **3000** |
| qe-e2e.md | 3706 | 138 | 367 | 329 | 314 | 58 | 43 | 969 | **3000** |
| incident-responder.md | 3666 | 179 | 367 | 356 | 246 | 58 | 43 | 784 | **3000** |
| factory-coach.md | 3625 | 195 | 367 | 315 | 246 | 58 | 43 | 840 | **2950** |
| installer.md | 3458 | 139 | 367 | 342 | 246 | 58 | 43 | 971 | **2850** |
| uat-planner.md | 3447 | 129 | 367 | 344 | 246 | 58 | 43 | 687 | **2850** |
| _role-switch-protocol.md | 3509 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **2700** |
| designer.md | 3078 | 196 | 367 | 146 | 246 | 58 | 43 | 704 | **2700** |
| system-analyst.md | 3077 | 160 | 367 | 309 | 246 | 58 | 43 | 650 | **2650** |
| greenfield-mapper.md | 2929 | 121 | 367 | 243 | 281 | 58 | 43 | 677 | **2500** |
| brownfield-mapper.md | 2683 | 143 | 367 | 281 | 246 | 58 | 43 | 614 | **2350** |
| **Total** | **78011** | 3171 | 6606 | 5465 | 5084 | 1102 | 774 | | **63500** |

- **Recommended constants:** `ROLE_CORPUS_FAIL = 67383` (D-1) and `ROLE_CORPUS_WARN = 64000`. The allocation sums to **63,500**, so writers have 500 B of slack before WARN, and Phases 41-42 have about 3.4 KB before FAIL. [ASSUMED: the targets are a recommendation inside Claude's discretion.]
- **Phase 42 risk:** SKILL-01 adds "the skills it may use, with a built-in fallback checklist" to every role. At about 80-130 B per role that is 1.5-2.5 KB. Phase 41 adds about 150-250 B (one pointer line, RUN-04). The 3.4 KB headroom covers both only if Phase 42 keeps the line short. Say this in the final plan's summary.
- **Savings per typical role (estimate):** caveman ~150 + Context/Compaction lines 367→~130 + Trace updates ~330→~140 + config bullet ~250→~150 (keeping the fallback sentence) + suffixes 58 + coding-rules line 43 (non-code roles) ≈ 800-900 B. The new `## Stop when` costs ~250-400 B. Net is about -450 to -550 per role, which matches the targets.
- **Absent-config fallback sentence cost:** the exact sentence "With no config file present, this role runs lean on the documented defaults in `agent-factory/README.md`." is 107 B × 19. Its exact text is quoted in registry mechanisms C-28-012 and C-28-032 (rows at lines ~231 and ~541) and in F-28-204 and F-28-212. No gate checks it [VERIFIED: grep over scripts/ and install/ found no guard]. Keep it verbatim, which is cheapest for the registry, or shorten it and update those four mechanism texts in the same plan. Recommendation: keep it verbatim, since the D-11 voice tolerates "this role".

### Corpus-total guard design (PLAIN-04)

- Scan set: every `.md` under `agent-factory/roles/` (`listRoleDirEntries(ROOT).filter(f => f.endsWith(".md"))`, 20 files). Assert the set's cardinality two-sided against `ROLE_COUNT + 1` (the protocol) and fail closed naming the members. Report `N B over 20/20 files; FAIL 67383; WARN 64000` with a per-file line.
- It lands in the **final plan**, because today's total (78,011) is above 67,383. Red evidence: (1) a transcript of the guard against the pre-rewrite base (78,011 → FAIL), and (2) a permanent discriminating mirror case. Grow every mirrored role by about 7%, so each file stays under its +12% `ROLE_CEILINGS` FAIL while the total crosses 67,383. That proves the total catches what per-file ceilings cannot (D-4: per-file FAILs sum to about 71 KB).
- `ROLE_CEILINGS` [VERIFIED: scripts/check-foundation-guards.ts:3545-3565]. Keys and values today, comments omitted: `"orchestrator.md": "7570 7165"`, `"security-nfr.md": "5102 4830"`, `"compliance-officer.md": "4813 4555"`, `"release-manager.md": "4765 4510"`, `"agents-md-scribe.md": "4544 4301"`, `"architect-design.md": "4243 4016"`, `"ba-pm.md": "4180 3901"`, `"factory-coach.md": "3839 3633"`, `"frontend-ui.md": "3969 3757"`, `"incident-responder.md": "3802 3598"`, `"installer.md": "3938 3727"`, `"software-engineer.md": "4979 4712"`, `"qe-e2e.md": "3822 3617"`, `"uat-planner.md": "3540 3350"`, `"system-analyst.md": "3170 3000"`, `"tech-lead.md": "4000 3786"`, `"designer.md": "3273 3098"`, `"greenfield-mapper.md": "3045 2882"`, `"brownfield-mapper.md": "2845 2693"`. The format is `"FAIL WARN"`, and the key set is checked two-way against `listRoles()` (19, protocol excluded). Re-baseline as `FAIL = ceil(measured × 1.12)` and `WARN = ceil(measured × 1.06)`, with each comment reading "Phase 40, measured N B". The `ba-pm.md` +20% PERS-02 exception and the tech-lead named-human raise history are dropped per D-07. Mention both drops in the plan summary so the human sees them.
- Intermediate batches shrink files, so the old ceilings never fail mid-phase. Leave the re-baseline to the final plan.
- **Protocol ceiling:** `ROLE_CEILINGS` cannot take a `_role-switch-protocol.md` key without breaking its two-way check against `listRoles()`. The corpus total covers the protocol. A per-file protocol ceiling is optional; if wanted, use a separate one-entry constant with its own fail-closed check.

### Role-rule inventory design (PLAIN-03, D-27, D-28, D-31)

One script, two named predicates, following the `check-imperative-lexicon` pattern of "two named guards over one derived corpus". It is a standalone CLI wired at all three places the repo uses (CI step, `package.json` script `check:role-rules`, test file). It is not imported by `check-diff-disposition`, which keeps the hook closure unchanged.

**Facts per file** (20 files; fenced lines excluded via `fencedLineFlags`, so deleting the caveman fences changes no fact). Each fact is either a closed token from D-28 or a set derived from another kit file:

| Fact | Derivation | Today's measured presence [VERIFIED: grep this session] |
|------|-----------|----------------------|
| `unknown-verify` | contains `UNKNOWN - verify` | 17 roles. **Absent in orchestrator.md and tech-lead.md**. Absent in the protocol |
| `wf16` | contains `16-context-read-write.md` | all 19 roles + protocol |
| `wf18` | contains `18-context-compaction.md` | all 19 roles; not the protocol |
| `wf17` | contains `17-task-claim.md` | orchestrator, protocol |
| `absent-config` | contains `documented defaults` and `agent-factory/README.md` | all 19 roles |
| `blocked` | contains `BLOCKED` | compliance-officer (3), release-manager, security-nfr, software-engineer (2) |
| `failed-attempt` | contains `failed-attempt` | software-engineer, tech-lead |
| `no-fabrication` | a `## Hard limits` line matching the stems `fake`, `invent`, `fabricat` (D-28 token check; meaning checked at plan review) | 18 of 19 roles. **orchestrator.md has none today** |
| `kit-refs` | the set of referenced kit files (`NN-*.md` workflows, `*-checklist.md`, `complexity-rubric.md`, `example-mapping.md`, `contracts/*.md`) | e.g. software-engineer: `04-ticket-to-pr.md`, `complexity-rubric.md`, `example-mapping.md`; frontend-ui: `04-ticket-to-pr.md`, `05-pr-quality-gate.md`, `accessibility-checklist.md` |
| `board-columns` | column names (from the seed board table) appearing in `## Board moves` | see the partition section |
| `junior-exclusions` | software-engineer `## Levels` must name every risk tag in the rubric's F3 = 2 cell (derived from `complexity-rubric.md`) | present today; also pinned by tier-kit-text TIER-03 |
| `coding-rules` | "12 coding rules" + `AGENTS.md` | **all 19 today**. After the rewrite, exactly the D-13 set. This is the one recorded-decision constant, checked two-sided (every listed name is a role; every role carrying the line is listed) |
| `stop-when-items` | number of list items under `## Stop when` | 0 today (new) |

- **Baseline:** `node scripts/check-role-rules.js --write-baseline` writes `docs/audit/40-role-rule-inventory.json` before any role prose changes (plan 1, first task). The guard refuses to run without a baseline (fail closed).
- **Check:** for every file, every baseline fact is still present (set superset), except the intended `coding-rules` removals. The count after must be at least the count before (D-31). Print per-file `facts before N / after M`.
- **Intended removals beyond D-13:** if a writer drops a common `## Reads` bullet (for example `memory-bank/00-index.md` "on start, for orientation", repeated in most roles), that is a lost `kit-refs` fact. Either keep it or record it as an intended removal with the same two-sided treatment. Decide this in plan 2 at the reference checkpoint.

### Board-move partition (D-29)

**No existing guard derives transitions.** `grep "Board moves" scripts/*.ts` hits only the two section-list literals in the validator [VERIFIED]. The contract is the seed board table [VERIFIED: agent-factory/seed/memory-bank/plans/board.md:79-93]:

```
| Column | Entry means | Exit owner | WIP (default) |
|--------|-------------|-----------|---------------|
| Backlog | idea captured | BA/PM | unlimited |
| Ready | Definition of Ready met | BA/PM | 8 |
| In Analysis | behavior being mapped | System Analyst | 2 |
| In Design | structure/ADR being decided | Architect/Design | 2 |
| Ready for Dev | analysis and design recorded as typed notes per Workflow 16, ticket sized | Orchestrator | 6 |
| In Development | code being written | Software Engineer | 3 (== max parallel tickets) |
| In Review | PR + QE running | QE/E2E | 3 |
| In Security/NFR | risk/compliance gate | Security/NFR | 2 |
| Ready for UAT | gates passed | UAT Planner | 4 |
| In UAT | business acceptance | UAT Planner | 4 |
| Ready to Release | UAT signed off | Release Manager | 4 |
| Done | merged + released (or merged, lean) | Orchestrator | unlimited |
| Blocked | waiting on a dependency/decision | (raiser) | visible, time-tracked |
```

Every `Exit owner` except `(raiser)` equals a `# Role:` display name exactly. `check-imperative-lexicon.ts` already parses this table header (`BOARD_TABLE_HEADER`, `boardColumns()`), so reuse that reading pattern. Do not write a second table parser in prose form.

**Recommended mechanism:**
1. The rewrite writes every owned move in `## Board moves` as a code span `` `X → Y` ``, with X and Y members of the derived column set. A role with no move says so with no code span.
2. The guard parses those spans and asserts four things. **No `(X, Y)` pair has two owning roles.** **Every column whose table `Exit owner` is a role has at least one claimed exit `(X, ·)` by that same role.** **A claimed `(X, ·)` whose X is owned by a different role in the table is a finding**, unless it is a recorded backward move (see Open Questions). **Every role's set of claimed from-columns contains its baseline set.**
3. The baseline for board moves comes from today's text in two recognized forms: an explicit `` `X → Y` `` span, and "owns the `X` exit". Store it in the inventory JSON.

**Today's discrepancies the rewrite must resolve** (D-17/D-18 say "keep flow rules"; these need a ruling, see Open Questions):
- `Ready` exit owner is BA/PM in the table, but `ba-pm.md` says "The Orchestrator pulls from `Ready` forward."
- `orchestrator.md` claims `` `… → Done` `` (a wildcard), and `release-manager.md` claims `Ready to Release → Done`. The table gives the `Done` row to the Orchestrator and the `Ready to Release` exit to the Release Manager.
- `tech-lead.md`: "F2 = 2 returns a ticket to `In Design`" is a `Ready for Dev → In Design` move, and the table gives the `Ready for Dev` exit to the Orchestrator. Its "owns the exit of a dev-raised `## Blocked`" conflicts with `Blocked`'s `(raiser)`.
- `frontend-ui.md` and `designer.md` describe positions, not moves.

### D-30: diff-disposition mechanism (recommended)

What the gate does today [VERIFIED: scripts/check-diff-disposition.ts]:
- Base: `00-base.md` frontmatter `base_commit: 4d2b8f079cc43d7d6184729966492789fb4dc05e`, read by `BASE_COMMIT_RE = /^base_commit:[ \t]*([0-9a-f]{40})[ \t]*$/m` (line 268). Rows files are every `*.md` in the directory except `DISPOSITION_NON_ROWS = ["00-base.md", "README.md"]` (line 265).
- Frozen sources: `registryAnchors`, `structuralSections` (role `"## Hard limits"`, workflow `"## Stop conditions"`, workflow `"## Commit"`, lines 491-516) and `positiveGuardLiterals` (9 literals; none sits in a role file. They are adapter-body memory sentences and tier beats).
- The watched corpus is the safety-surface union: 19 roles + 19 workflows + `AGENTS.md`, `README.md`, `agent-factory/README.md` + `_role-switch-protocol.md`. It is pinned by `uat-gate-exit-contract.test.ts` (`WATCHED_CORPUS_MIN + RESIDUE_FROM_REGISTRY_COUNT + 1`).
- **Today: exit 1, "42 watched file(s) changed since 4d2b8f0; 3358 changed clause(s) derived; 2500 disposition row(s) across 64 file(s)", 721 findings** [VERIFIED: ran it]. By kind: 342 workflow + 269 role + 69 root (`README.md` 58, `AGENTS.md` 11) + 10 `agent-factory/README.md` "no disposition row", plus 23 workflow and 8 role "FROZEN by structuralSections". Phase 39 kept this count at exactly 721 as a recorded pre-existing red.
- The checks that guard the base: `uat-gate-exit-contract.test.ts:634` `expect(m![1]).toBe("4d2b8f079cc43d7d6184729966492789fb4dc05e");` (describe "the disposition register's measuring stick did not move", T-31-30-03); the README paragraph "Moving this SHA is not a remedy for a red gate"; the CI comment at `.github/workflows/ci.yml` ~497 "do NOT move the recorded base commit forward". CI checks out with `fetch-depth: 0`.

**Recommended mechanism (fail-closed, mechanical, no narrowing):**
1. **A recorded decision document**, for example `docs/audit/40-disposition-base-move.md` [ASSUMED path]. It states D-30, the old and new SHA, and **the 721-finding breakdown it retires** (the counts above, with a command to reproduce them at the old base). Without that record, the base move deletes evidence silently.
2. **`00-base.md`:** set `base_commit:` to the last commit before plan 1's first content commit (today `61f17569943aace1f61274354c8bdfdee5ee1183`; re-read at execution time, because research and plan commits land after it). Commits that touch only `.planning/` change no watched file, so any of them is equivalent. Add a second frontmatter key, for example `role_standin: scripts/check-role-rules.js` [ASSUMED key name], parsed by its own canonical-form regex like `BASE_COMMIT_RE`.
3. **Gate arm:** when the key is present, every changed clause whose file starts with `agent-factory/roles/` (all 20 files, protocol included) and whose source is `structuralSections` or "no row" is admitted iff one spawn of `node <role_standin> --check` exits 0. Spawn it with `execFileSync`, the same way the gate already calls `git`, so the hook import closure does not grow. If the script is missing, cannot be spawned, or exits non-zero, **every role clause is a finding** naming the stand-in failure. `registryAnchors` and `positiveGuardLiterals` hits are never covered by the stand-in. The PASS line publishes "N role clause(s) admitted by the role-rule inventory stand-in (D-30)". A tree without the key behaves exactly as today, so the synthetic-repo REPRODUCTION 1 case (`check-diff-disposition.test.ts`, role `## Hard limits` reword → FROZEN) stays red unchanged.
4. **Tests:** new permanent cases. Stand-in declared and check script exits 0 → role clause admitted. Stand-in declared and script exits 1 → every role clause is a finding. Stand-in declared but a workflow `## Stop conditions` reword → still FROZEN. Stand-in declared but a registry-anchor change → still needs the registry companion.
5. **Same-commit companions:** amend `uat-gate-exit-contract.test.ts:634` to the new SHA with a D-30 citation, the README paragraph, and the CI comment.
6. **Rebuild and manifest:** `check-diff-disposition.js` is in `DECIDER_MANIFEST` [VERIFIED: hooks/hook-entry.ts:257 `"scripts/check-diff-disposition.js": "ac33078d59949033e57a365bc7174b440202bd456f6b75e22f6c47339a3998a3",`]. After the **last** edit, run `npm run generate:hook-manifest`, then `npm run freshness:hook-manifest`. Phase 39 hit exactly this staleness (39-06 deviation 2).
7. **Scope end:** D-30 says "during this rewrite", but Phases 41 and 42 also edit roles. Recommend recording the stand-in as standing for `agent-factory/roles/` until a later recorded decision ends it, and putting that sentence in the decision document (see Open Questions).

Non-role watched files edited in this phase (workflows that absorb moved text, D-05) still need **one rows file per plan** (`docs/audit/29-style-dispositions/40-NN.md`, seven columns, rows under `## Dispositions`). A `## Stop conditions` or `## Commit` change also needs a filled `companion` cell of at least `2 × CLAUSE_MIN_WORDS` normalized words. D-19 (rewrite only the moved text) keeps the row count small.

### PLAIN-07: joining the governed corpus

- Today roles are excluded by name: `location: "agent-factory/roles/"`, `label: "the role corpus"` [VERIFIED: check-imperative-lexicon.ts:299-305]. `GOVERNED_CORPUS_COUNT = 49` [VERIFIED: :475] covers 19 workflows, 15 checklists, 12 seed templates and 3 contracts.
- **Measured against today's text: 132 findings over the 20 role-corpus files** [VERIFIED: mirror run this session; the caveman fences are skipped as fenced]. By file: security-nfr 13, release-manager 11, software-engineer 10, orchestrator 8, qe-e2e 8, uat-planner 8, agents-md-scribe 7, architect-design 7, ba-pm 7, factory-coach 7, incident-responder 7, installer 7, system-analyst 7, compliance-officer 6, frontend-ui 6, greenfield-mapper 4, brownfield-mapper 3, tech-lead 3, designer 2, protocol 1. By rule: mostly WP-02 and WP-03 lengths, plus WP-05 modal-in-numbered-item (ba-pm, incident-responder, installer ×2, release-manager, security-nfr, software-engineer, system-analyst, uat-planner), WP-08 (factory-coach, release-manager, software-engineer) and one WP-06 in the protocol. The non-role corpus has 0 findings.
- **Land it in the final plan:** add a fifth part `roles` from `listRoleDirEntries(ROOT)` `.md` (20 files). Remove the exclusion entry. Move `GOVERNED_CORPUS_COUNT` 49 → 69 with an "entrant named" comment, following the file's convention. Tests in `check-imperative-lexicon.test.ts` assert `"in 4 derived part(s)"` (line 339), `expect(GOVERNED_CORPUS_COUNT).toBe(49)` (line 764), and plant fixture roles to prove the exclusion (lines 240, 285). Update all of them. Update the writing-profile `## Governed surfaces` table with a `role bodies | build-time gate` row and remove the caveman exclusion bullet (done in plan 1).
- **During batches:** writers check their files with the mirror command below and **reword before touching the gate** (D-32). `guard_imperative_lexicon` measures only `## Steps` bullets, and roles have none, so the lexicon arm visits zero role elements. Adding a term matters only for `technicalNames()` and the approved verb set, so expect zero additions.
- Per-batch sentence check (no code change; prints findings for role files):
  ```bash
  S=$(mktemp -d); cp -r agent-factory "$S/"; for f in agent-factory/roles/*.md; do cp "$f" "$S/agent-factory/contracts/zrole-$(basename "$f")"; done
  CHECK_ROOT="$S" node scripts/check-imperative-lexicon.js | grep "zrole-" ; rm -rf "$S"
  # (the corpus-count FAIL line is expected in this mirror; read only the zrole- findings)
  ```

### Do-less rules: what to adapt (PLAIN-05)

The source is ponytail's prompt, quoted verbatim in `.planning/research/FEATURES.md` §0.1 [CITED: github.com/DietrichGebert/ponytail, retrieved 2026-10-20 by the milestone researcher]. Rewrite it as grugops text. Do not copy sentences.

| Rule | Where | Notes |
|------|-------|-------|
| Scope first: every place the change must reach (callers, tests, fixtures, config, exports); unrequested options named and dropped; the never-cut floor | `tech-lead.md` → written into `## Tech Lead plan` (D-20) | TL Responsibilities ordering is pinned (item 2 "Write the dev tasks", item 3 "Score the dev tasks and the ticket per the rubric."). Add scope-first without renumbering those, or update the WR-07 test on purpose |
| Reuse-before-build ladder (does it need to exist → in this codebase → stdlib/platform → installed dependency → one line → minimum code) | `software-engineer.md` `## Do less` | Each rung as one short unnumbered bullet (unnumbered = descriptive, 25-word bound) |
| Finish the whole change (callers, tests, fixtures it breaks) | engineer `## Do less` | "lazy about the solution, never about the change" |
| Never-cut floor: validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything the user asked for | both | Keep it next to the existing hard limits without restating them (clause uniqueness) |
| One small test for new non-trivial logic (a branch, a loop, a parser, money or security) | engineer `## Do less` | Fits the existing "unit tests prove the logic" hard limit; don't duplicate it |
| `shortcut: <the limit>, <when to upgrade>` | engineer `## Output` (D-21) | Text rule only (D-23) |
| `Not checked:` line in an `observation` note, never longer than the change | engineer `## Output` (D-22) | No new note kind |

- **Banned literals to avoid** in NOTICE, roles and the checklist [VERIFIED: scripts/check-banned-claims.ts:377-397]: `token economy`, `token-economy`, `fewer tokens`, `token savings`, `saves tokens`, `reduces token count`, `lowers token count`, `improves comprehension`, `improve comprehension`, `comprehension benefit`, `easier for the model to understand`, `easier for a language model to understand`, `better understood by the model`, plus the standard-name group. ponytail's benchmark figures (−53% lines, −45% output tokens and so on) are not banned as numbers. They are excluded by D-25, D-26 and the no-fabrication rule, so print no figure at all.

### NOTICE (D-26)

- ponytail LICENSE, read this session [VERIFIED: raw.githubusercontent.com/dietrichgebert/ponytail/main/LICENSE]: "MIT License", then **`Copyright (c) 2026 DietrichGebert`**, then the standard MIT permission and warranty-disclaimer paragraphs. The canonical repository URL is `https://github.com/DietrichGebert/ponytail` (GitHub API `full_name: "DietrichGebert/ponytail"`). GitHub URLs are case-insensitive, so the lowercase form in D-26 also resolves.
- Append below the existing text. Do not reflow lines 1-14, because `voice-model.ts:383` cites "NOTICE:4-7". Then `cp NOTICE agent-factory/NOTICE`: `install/installer-kit-home.test.ts:396-403` asserts `agent-factory/NOTICE` is a byte copy of the root `NOTICE`.
- Suggested shape:
  ```
  The "do less" rules in agent-factory/roles/software-engineer.md and
  agent-factory/roles/tech-lead.md, and the lean-review lens in
  agent-factory/checklists/pr-review-checklist.md, are adapted from ponytail
  (https://github.com/DietrichGebert/ponytail), used under the MIT License:

  Copyright (c) 2026 DietrichGebert

  Permission is hereby granted, free of charge, … [the full MIT text, byte-exact]
  ```
- Land NOTICE in the plan that lands the last adapted text (the TL batch or the lens), so the credit is never ahead of the content.

### Lean-review lens (PLAIN-06)

- `agent-factory/checklists/pr-review-checklist.md` is 472 B today. It has 8 flat bullets and frontmatter `kind: checklist`, `tier: lean` [VERIFIED]. It belongs to the governed corpus (checklists part), so the lens text must already pass `guard_sentence_form`: unnumbered bullets are descriptive (25 words), no `and/or`, no bare demonstrative opener. It is **not** in the diff-disposition watched corpus, so no rows are needed. Consumers: `checklists/00-index.md` and `workflows/05-pr-quality-gate.md`.
- Content per D-25: priority order (correct → safe → tested → lean); advisory, never blocking on its own; "no case, no finding"; no style-taste findings; sub-tags `delete`, `reuse`, `stdlib/native`, `yagni`, `merge`, `split by job`; flag a `shortcut:` marker with no upgrade trigger; never print a savings or line-count number.

### Recommended batch layout (Claude's discretion)

| Plan | Wave | Content | Files |
|------|------|---------|-------|
| 40-01 | 1 | (a) inventory script + committed baseline; (b) D-30 decision, base move, stand-in arm, tests, manifest regen; (c) **one atomic flip commit** (9-row table above) with planted-mirror red cases | scripts, docs/audit, all 19 roles (fence deletion only), writing-profile, registry, CLAUDE.md |
| 40-02 | 2 | Reference role `software-engineer.md` (`## Stop when`, `## Do less`, pointer lines); shared pointer text in WF16 (and WF18 if needed) written once; rows file for the workflow edits; **human checkpoint** | engineer role, WF16/WF18 (moved text only) |
| 40-03..06 | 3 (parallel) | B1 build lane: tech-lead (conform + scope-first), qe-e2e, frontend-ui, designer (conform), plus lean lens + NOTICE. B2 analysis lane: ba-pm, system-analyst, architect-design, uat-planner. B3 gate lane: security-nfr, compliance-officer, release-manager, incident-responder. B4 setup lane: installer, agents-md-scribe, greenfield-mapper, brownfield-mapper, factory-coach | disjoint role sets; **only one batch may touch each workflow** (assign WF04 to B1; if another batch needs WF04, serialize) |
| 40-07 | 3 (parallel) | orchestrator.md (D-17) + `_role-switch-protocol.md` (D-15) | two files |
| 40-08 | 4 | `ROLE_SECTIONS` += `## Activates when`, `## Stop when` (+ 187 fixture role files); `ROLE_CEILINGS` re-baseline; corpus-total guard; partition guard + inventory post-check; PLAIN-07 corpus join; C-28-003 closure; adapters, catalog and freshness confirmation | guards, fixtures, registry |

Each batch keeps `tier-kit-text.test.ts`, `validate.test.ts`, the foundation guards and `check-diff-disposition` green at its own commit.

### Anti-Patterns to Avoid
- **Raising a ceiling to fit.** The repo records such raises as named-human decisions (tech-lead history). Move the detail to a workflow instead (D-05).
- **Narrowing a scan set to reach green** (any of `GOVERNED_CORPUS_COUNT`, `VOICE_FILES`, `ROLE_FILES`, the watched corpus). Every gate's own message forbids it.
- **Hand-listing a derived set** (role names, columns, exclusion terms). D-13 is the single recorded-decision exception and needs a two-sided check.
- **Adding verbs or terms to the approved sets to silence a red** (PITFALLS 11). Reword first (D-32).
- **A second fence or section grammar** in a new script. Use `fencedLineFlags`, `unfencedHeadingIndex` and `sectionEndIndex` from `scripts/frontmatter.ts`.
- **Editing `scripts/voice-model.ts`** in any way, including comments. Its `.js` hash is pinned at `hooks/hook-entry.ts:266`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Find a section's extent | A `## ` regex loop | `unfencedHeadingIndex` + `sectionEndIndex(text, i, 2)` (`scripts/frontmatter.ts:765, 993`) | Fence-aware. The repo has removed three drifting copies |
| Know which lines are fenced | A toggle loop | `fencedLineFlags` (`frontmatter.ts:477`) | Same reason |
| Detect a caveman fence | A heading or fence scan | `readCavemanFence` (voice-model) | It is the one reader. `frontmatter.test.ts` counts fence machines |
| Vacuity-safe PASS lines | `if (n === 0)` | `reportMeasured` from `scripts/vacuity.ts` | Uniform denominator reporting |
| Role and workflow sets | `readdirSync` | `listRoles`, `listRoleDirEntries`, `listWorkflows` from kit-model (already imported) | Derived sets, fail closed on empty |
| Board columns | A new table parser | The `BOARD_TABLE_HEADER` / `unfencedHeadingIndex` reading used by `boardColumns()` in `check-imperative-lexicon.ts:813` (extract a shared export, or copy the pattern with a test pinning equality) | One table reading |
| Clause identity | Your own normalizer | `segmentClauses` / `normalizeSentence` (voice-model) | The disposition gate and the uniqueness guard both use them |
| Hook manifest | Editing `DECIDER_MANIFEST` by hand | `npm run generate:hook-manifest` | Generated region with a freshness gate |

**Key insight:** this repository's recurring failure is a hand-kept set that drifts while gates stay green. Every new check here (inventory, partition, total) must derive its members and assert its cardinality two-sided.

## Runtime State Inventory

This phase is a rewrite and refactor of kit text and guards.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None in this repo's datastores. Role text is read from the kit at run time. **Installed kits** (`kitRoot` recorded in a host repo's `.grugops/install.json`, under a `GRUGOPS_HOME`) keep the old role text until the user runs `node install/install.js --update` | No migration. The CHANGELOG `Unreleased` note can tell users to re-run `--update` |
| Live service config | None. grugops has no hosted service | None. Verified by the project definition |
| OS-registered state | None | None |
| Secrets and env vars | None reference role text | None |
| Build artifacts | Committed `.js` for every edited `.ts` (`npm run build`; `npm run freshness` checks 88 files); `hooks/hook-entry.ts`/`.js` manifest region (regenerate after the last kit-model or disposition edit); generated adapters, catalog, skill twins and host entries (unchanged if the One job and Activates when first sentences are kept, so confirm with `freshness:*`); `docs/audit/28-prepass-evidence.md` is **already modified in the working tree** before this phase. It is a side effect of a test run, not this phase's file, so do not stage it | Rebuild, regenerate, verify freshness; `git status` check before each commit |

## Common Pitfalls

### Pitfall 1: The test mirror throws once fences are gone
**What goes wrong:** `normalizeMirroredRole` throws `mirror repair: <rel> fence refused (missing)` for every role, and nearly every case in `check-foundation-guards.test.ts` fails.
**Why:** `mirror()` repairs and asserts the caveman block so that mirrors are green regardless of tree drift.
**How to avoid:** in the flip commit, reduce the normalization to `dedupeClauses` and drop `repairCavemanBlock` and the two-sided predicate. Replace `voiceRed` with the inverted predicate.
**Warning signs:** hundreds of failures with the "mirror repair" message.

### Pitfall 2: Changing the first sentence of `## One job` or `## Activates when`
**What goes wrong:** 21 adapters, the catalog and skill twins regenerate with new descriptions, and `adapter-byte-baseline.test.ts` fails ("moved against the pinned baseline … Record the change with its reason; do not weaken this comparison (D-3)").
**How to avoid:** keep both first sentences byte-identical. Run `npm run freshness:adapters && npm run freshness:catalog` per batch.

### Pitfall 3: Modals and long sentences in numbered items
**What goes wrong:** PLAIN-07 goes red in the final plan across many files.
**How to avoid:** apply the 20-word and no-modal rule to every numbered line from plan 2 onward, and run the mirror check per batch.

### Pitfall 4: Hook manifest stale after a later edit
**What goes wrong:** `freshness:hook-manifest` fails because `kit-model.js` or `check-diff-disposition.js` changed after the regeneration.
**How to avoid:** regenerate after the last edit to any manifest member (the 13 modules listed at `hooks/hook-entry.ts:254-267`).

### Pitfall 5: Fixtures fail when `ROLE_SECTIONS` grows
**What goes wrong:** the `good`, `warn-only-no-trace` and `bad-ticket-body-column` fixtures are expected to exit 0 or pass, and the bad fixtures are expected to fail for **exactly** their one reason (`validate.test.ts:657-700`). None of the 187 fixture role files (11 fixtures × 17 roles) has `## Activates when` or `## Stop when` [VERIFIED: grep].
**How to avoid:** in the D-09 plan, add both headings, each with one line, to all 187 fixture role files, then confirm the `INTENT` table rows unchanged.

### Pitfall 6: Section-scoped Phase 39 pins break when text moves
**What goes wrong:** `tier-kit-text.test.ts` asserts sentences inside `section(TECH_LEAD, "Hard limits")` and `section(..., "Responsibilities")`. Moving a stop rule into `## Stop when` makes a correct rewrite red.
**How to avoid:** for every moved sentence, update the matching assertion to the new section in the same commit. Never delete an assertion. Exactly one `16-context-read-write` and one `18-context-compaction` per Phase 39 role: the pointer line uses the filenames, so `## Reads` must say "Workflow 16" without the filename.

### Pitfall 7: The base move reads as evidence deletion
**What goes wrong:** a reviewer sees `00-base.md` move, 721 findings vanish, and `uat-gate-exit-contract.test.ts:634` edited, which together look like the T-31-30-03 attack.
**How to avoid:** a decision document with the retired breakdown, D-30 cited in the test, README and CI comment, all in one commit.

### Pitfall 8: Partition guard built on today's inconsistent prose
**What goes wrong:** the guard is red on day one, or it encodes a wildcard (`… → Done`).
**How to avoid:** resolve the four discrepancies (Open Questions) before writing the canonical `` `X → Y` `` spans. The baseline records from-columns, not exact pairs.

### Pitfall 9: Planted-role tests trip the new total guard
**What goes wrong:** existing mirror cases that plant an extra role ("planted 18th role reaches guard_role_size", line 5748) or append bytes to a role and assert `ALL CHECKS PASSED` can now cross 67,383 B or a tighter re-baselined per-file ceiling.
**How to avoid:** in the final plan, run the full `check-foundation-guards.test.ts` and adjust plant hosts or sizes to keep each case's intent. The 93 B plant at line 6662 was moved once already for exactly this reason.

### Pitfall 10: Grug words in plain prose and the protocol
**What goes wrong:** "head grug" stays in the protocol (not scanned today), or "spirit" or "rock" slips into a role. `guard_voice` reds the role, but nothing reds the protocol.
**How to avoid:** cover the protocol in `guard_voice` (recommended) and grep the lexicon before each batch commit.

## Code Examples

### Inverted voice predicate (uses only existing exports)
```typescript
// Source: pattern from scripts/check-foundation-guards.ts guardCavemanVoice (read 2026-10-31)
const verdict = readCavemanFence(readText(f));
if (verdict.ok) {
  findings.push({ file: f, detail: "a ## Caveman prompt fence is present — role text carries no caveman block (PLAIN-01)" });
} else if (verdict.reason !== "missing") {
  findings.push({ file: f, detail: `a malformed ## Caveman prompt fence is present — reason ${verdict.reason} (PLAIN-01)` });
}
// fold through reportMeasured({ label, visited, expected: ROLE_COUNT /* + 1 if the protocol is covered */, findings })
```

### Corpus-total guard (sketch)
```typescript
// [ASSUMED] constant names; ROLE_COUNT and listRoleDirEntries are existing exports
const ROLE_CORPUS_FAIL = 67383; // [v3.0, D-1]
const ROLE_CORPUS_WARN = 64000; // Phase 40 D-03/D-04 headroom target
const corpus = listRoleDirEntries(ROOT).filter((f) => f.endsWith(".md")).map((f) => `agent-factory/roles/${f}`);
if (corpus.length !== ROLE_COUNT + 1) fail(`role corpus derived ${corpus.length} file(s), expected ${ROLE_COUNT + 1}: ${corpus.join(", ")}`);
const total = corpus.reduce((n, f) => n + byteLen(f), 0);
if (total > ROLE_CORPUS_FAIL) fail(`role corpus ${total}B > ${ROLE_CORPUS_FAIL}B (D-1)`);
else if (total > ROLE_CORPUS_WARN) warn(`role corpus ${total}B > ${ROLE_CORPUS_WARN}B headroom target`);
else pass(`role corpus ${total}B over ${corpus.length}/${ROLE_COUNT + 1} files, within ${ROLE_CORPUS_WARN}B`);
```

### Pointer lines (D-01)
```markdown
Context: read and write per `agent-factory/workflows/16-context-read-write.md`; compact per `agent-factory/workflows/18-context-compaction.md`.
```
About 130 B against today's 367 B. The full "single source, referenced not restated" wording lives once in WF16 (written in plan 2 as moved text, D-19).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fenced `## Caveman prompt` block per role, guarded two-sided (lexicon ≥ 2, banned constructions 0) | No block; inverted guard refuses any fence | PROJECT.md revision 2026-10-20; lands in plan 40-01 | `guard_caveman_voice` semantics invert; C-28-003 mechanism rewritten |
| Roles excluded from the writing-profile gates | Roles are a governed surface (`guard_sentence_form`) | PLAIN-07, final plan | +20 corpus members (49 → 69) |
| Per-file ceilings only | Corpus total (67,383 FAIL / ~64,000 WARN) + re-baselined per-file ceilings | Final plan | New guard |
| Per-clause disposition rows for role edits | Role-rule inventory stand-in (D-30) | Plan 40-01 | Gate scope change, recorded |

**Deprecated/outdated:** `docs/audit/29-ceiling-rebaseline.md` and the D-24 transcripts in the guard comments describe pre-Phase-40 baselines. Leave them as history, and say in the new comments that they no longer describe the files.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Per-role byte targets (sum 63,500) and WARN 64,000 | Byte allocation | Writers may not fit (most likely in orchestrator 5,900 and security-nfr 3,850). Adjust at the plan-2 checkpoint |
| A2 | Script name `scripts/check-role-rules.ts`, baseline path `docs/audit/40-role-rule-inventory.json`, decision doc path, `role_standin` key name | Inventory, D-30 | Cosmetic. The planner can rename |
| A3 | Spawning the inventory CLI from the disposition gate is acceptable inside the gate's runtime budget (the gate already spawns `git` many times; about 7 s on Linux and up to about 56 s on Windows) | D-30 | Adds about 1 s. If not acceptable, read a committed check-result file instead (weaker) |
| A4 | Including the protocol in `guard_voice`, the inverted guard and the total guard is wanted | Inverted guard design | If not wanted, protocol grug words stay unguarded (D-15 still removes them by hand) |
| A5 | C-28-003 option (a) (overstated / deferred / target_phase 40, then back to true) is acceptable to the human | Atomic flip | Option (b) leaves "short words" unmeasured for the length of the phase |
| A6 | Batch split B1-B4 plus orchestrator/protocol | Batch layout | Workflow contention if two batches need WF04 |
| A7 | Keeping the absent-config fallback sentence verbatim is preferred over shortening it | Byte allocation | About 1 KB less room. If shortened, four registry mechanism texts need edits |

## Open Questions

1. **Board ownership discrepancies (blocks the partition guard)**
   - What we know: four conflicts between role text and the seed board `Exit owner` column (listed under D-29).
   - What's unclear: who exits `Ready` (BA/PM per the table, or the Orchestrator per ba-pm.md); whether `Done` in lean mode is the Orchestrator's while `Ready to Release → Done` is the Release Manager's; whether the TL's `Ready for Dev → In Design` return and its `Blocked` exit are recorded exceptions to "one owner per from-column".
   - Recommendation: key the partition on exact `(from, to)` pairs. Treat the table as the owner of forward exits. Allow a short, declared list of backward or exception moves (TL `Ready for Dev → In Design`, TL dev-raised `Blocked` exit), each with a test. Write `→ Done` as concrete pairs (`Ready to Release → Done` for the Release Manager; the Orchestrator's lean-mode close from a named column). Ask the human at the plan-2 checkpoint if the table and the text cannot be reconciled without a flow change, because D-17 says flow rules stay as they are.
2. **Does the D-30 stand-in end after Phase 40?**
   - Recommendation: it stands for `agent-factory/roles/` until a later recorded decision ends it, because Phases 41 and 42 edit roles too. Write this into the decision document.
3. **D-13 membership**
   - What we know: every role has `capabilities: read edit shell`, so the set cannot be derived from frontmatter.
   - Recommendation: confirm the eight roles listed. designer and frontend-ui are the borderline ones, because frontend-ui authors a contract and not code. Record the set as the one decision constant in the inventory script, with a two-sided check.
4. **Should orchestrator.md and tech-lead.md gain `UNKNOWN - verify` and no-fabrication lines?**
   - They lack them today, so the inventory will not demand them. Recommendation: add them. "More detail" (D-31) and the CLAUDE.md no-fabrication constraint both support it, and each adds a fact.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 22 | all gates | ✓ | v26.12.1 | — |
| npm | build scripts | ✓ | 11.20.0 | — |
| TypeScript | build | ✓ | 6.0.3 | — |
| vitest | tests | ✓ | 4.1.8 | — |
| git with full history | `check-diff-disposition` | ✓ (local clone reaches `4d2b8f0`) | — | CI uses `fetch-depth: 0` |
| Network (ponytail LICENSE) | D-26 | ✓ (fetched this session) | — | Copyright line already captured above |

**Missing dependencies:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.8 |
| Config file | `vitest.config.ts` (`testTimeout: 180_000`, `slowTestThreshold: 5_000`) |
| Quick run command | `npm run build && npx vitest run scripts/tier-kit-text.test.ts scripts/voice-model.test.ts scripts/validate.test.ts` (measured 26 s, 393 tests) |
| Full suite command | `timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'` (Phase 39: 1363 s; **21 pre-existing failures** in context-io, context-io-writer-set, canonical-corpus, harness-instance-ledger, uat-gate-exit-contract (5), installer-fs-census, and one environmental case in check-foundation-guards caused by the untracked `~/`) |

### Gate commands (from Phase 39's verify table, plus the new ones)
`npm run build && npm run typecheck` · `node scripts/check-foundation-guards.js` · `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` · `node scripts/check-imperative-lexicon.js` · `node scripts/check-banned-claims.js` · `node scripts/check-kit-refs.js` · `npm run check:claim-anchors` · `npm run check:public-docs` · `node scripts/check-audit-register.js` · `node scripts/check-state-paths.js` · `node scripts/check-diff-disposition.js` (today 721 findings; after plan 40-01, exit 0) · `npm run freshness` · `npm run freshness:adapters` · `npm run freshness:catalog` · `npm run freshness:skill-twins` · `npm run freshness:host-entries` · `npm run freshness:hook-manifest` · `npm run freshness:guarantees` · `npm run check:build-parity` · NEW `node scripts/check-role-rules.js`. `npm run check:flip-manifest` stays a recorded pre-existing red.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAIN-01 | Planted fence in a mirrored role → inverted guard exits 1 naming the file; unplanted mirror green; real tree 0 fences | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "caveman"` | ❌ Wave 0 (rewrite existing caveman cases) |
| PLAIN-01 | No live role returns a fence (voice-model control inverted) | unit | `npx vitest run scripts/voice-model.test.ts -t "every live role"` | ✅ (assertion inverts) |
| PLAIN-01 | `ROLE_SECTIONS` no longer requires the caveman heading | unit | `npx vitest run scripts/validate.test.ts` | ✅ |
| PLAIN-02 | Every role has `## Stop when` and `## Activates when`; bad fixtures still fail for exactly one reason | unit | `npx vitest run scripts/validate.test.ts` | ✅ (+187 fixture edits) |
| PLAIN-02 | Phase 39 role pins hold or move on purpose | unit | `npx vitest run scripts/tier-kit-text.test.ts` | ✅ |
| PLAIN-02 | Adapter and catalog bytes unchanged | unit + freshness | `npx vitest run scripts/adapter-byte-baseline.test.ts && npm run freshness:adapters && npm run freshness:catalog` | ✅ |
| PLAIN-02 | Reader check (goal, inputs, outputs, moves, limits, stops) | manual (verifier) | — | manual-only: a meaning judgement (D-31) |
| PLAIN-03 | Inventory superset vs baseline; planted fact removal → red | unit (planted mirror) | `npx vitest run scripts/check-role-rules.test.ts` | ❌ Wave 0 |
| PLAIN-03 | Partition: duplicate owner → red; uncovered table exit → red | unit | `npx vitest run scripts/check-role-rules.test.ts -t "partition"` | ❌ Wave 0 |
| PLAIN-03 | D-30 stand-in admits role clauses only when the check passes; workflow frozen clauses still need companions | unit (real git repos in tmp) | `npx vitest run scripts/check-diff-disposition.test.ts -t "stand-in"` | ❌ Wave 0 |
| PLAIN-04 | Total > 67,383 with every file under its ceiling → red; real tree ≤ 64,000 | unit (planted mirror) | `npx vitest run scripts/check-foundation-guards.test.ts -t "corpus total"` | ❌ Wave 0 |
| PLAIN-04 | `ROLE_CEILINGS` key set two-way; unknown role fails closed | unit | `npx vitest run scripts/check-foundation-guards.test.ts -t "ROLE_CEILINGS"` | ✅ |
| PLAIN-05 | Do-less rules present in engineer and TL; NOTICE byte copy; no banned literal | unit + gate | `npx vitest run install/installer-kit-home.test.ts -t "NOTICE" && node scripts/check-banned-claims.js` + tier-kit-text additions | ✅ / ❌ new tier-kit-text cases |
| PLAIN-06 | Lens present, governed corpus green | gate + unit | `node scripts/check-imperative-lexicon.js` + a new tier-kit-text case for the lens sub-tags | ❌ Wave 0 (case) |
| PLAIN-07 | Roles part in the governed corpus (69); planted 26-word role sentence → red | unit (planted mirror) | `npx vitest run scripts/check-imperative-lexicon.test.ts` | ✅ (assertions move 49→69, 4→5 parts) |

### Sampling Rate
- **Per task commit:** the quick run command plus `node scripts/check-foundation-guards.js && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-diff-disposition.js`, plus the per-batch mirror sentence check.
- **Per wave merge:** all gate commands above, plus `npx vitest run scripts/check-foundation-guards.test.ts scripts/check-diff-disposition.test.ts scripts/check-imperative-lexicon.test.ts scripts/adapter-byte-baseline.test.ts`.
- **Phase gate:** the full non-e2e suite with no failure outside the 21 recorded ones, then `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/check-role-rules.ts` + `.test.ts` + committed baseline JSON (inventory + partition)
- [ ] Rewritten `mirror()` normalization in `check-foundation-guards.test.ts`
- [ ] Inverted caveman cases + corpus-total cases in `check-foundation-guards.test.ts`
- [ ] Stand-in cases in `check-diff-disposition.test.ts`
- [ ] CI step + `package.json` script for the new check

## Security Domain

`security_enforcement` is enabled (absent = enabled), with ASVS level 1. This phase changes safety instruction text and a safety gate's scope. It adds no network, auth or data path.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | indirect | Role hard limits ("never merge a protected branch, never deploy to prod") are written rules; the git host is the floor (CLAUDE.md). The inventory guard must keep them |
| V5 Input Validation | yes (tooling parses markdown and git output) | Bounded walks, canonical-form regexes (like `BASE_COMMIT_RE`), fail-closed refusals; no shell interpolation (`execFileSync` argument arrays) |
| V6 Cryptography | no (the hook manifest uses SHA-256 via the existing generator) | `npm run generate:hook-manifest`; never hand-edit |
| V14 Configuration | yes | Committed `.js` freshness; manifest freshness |

### Known Threat Patterns for this phase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Rewrite silently drops a safety rule (merge/deploy, no-fabrication, `BLOCKED` stop) | Tampering | Derived inventory superset guard + plan-review meaning check (D-28) |
| Stand-in becomes a blanket bypass of the disposition gate | Elevation of privilege / Repudiation | Scope to `agent-factory/roles/` only; never covers registry anchors, positive literals or non-role frozen sections; fails closed when the check script is missing or red; permanent tests from both sides |
| Base move used to hide undispositioned debt | Repudiation | Decision document records the 721 retired findings and how to reproduce them; same-commit test, README and CI amendments |
| Admission-hook closure drift after editing manifest members | Tampering | Regenerate the manifest after the last edit; `freshness:hook-manifest`; `floor-invariance.test.ts` |
| License non-compliance for adapted rules | (legal) | MIT copyright + permission notice byte-exact in NOTICE; byte-copy test |

## Sources

### Primary (HIGH confidence, read or run this session)
- `scripts/validate-agent-factory.ts` (ROLE_SECTIONS 371-380, checkSections), `scripts/check-foundation-guards.ts` (2815-3680: guard_voice, guard_caveman_voice, guard_role_clause_uniqueness, ROLE_CEILINGS, guardRoleSize), `scripts/check-foundation-guards.test.ts` (221-660, 6645-6675, 8979-9000), `scripts/voice-model.ts` (190-300, 360-560), `scripts/voice-model.test.ts` (540-600)
- `scripts/check-diff-disposition.ts` (header, 259-345, 486-660, 1494-1560, 1880-2000); the gate run (721 findings); `docs/audit/29-style-dispositions/00-base.md`, `README.md`; `scripts/uat-gate-exit-contract.test.ts` (610-662); `.github/workflows/ci.yml` (470-512)
- `scripts/check-imperative-lexicon.ts` (1-130, 258-560, 1019-1140, 1296-1500) plus the mirror run (132 role findings); `scripts/check-banned-claims.ts` (377-397, 925-950)
- `hooks/hook-entry.ts` (240-290) `DECIDER_MANIFEST`; `scripts/generate-role-adapters.ts` (200-262, 415-480); `scripts/generate-catalog.ts` (138-142, 255-290); `scripts/adapter-byte-baseline.test.ts` (90, 282-420)
- `scripts/tier-kit-text.test.ts` (34-78, 179-650); `scripts/validate.test.ts` (255-700); `install/installer-kit-home.test.ts` (386-430); `install/state-layout.ts` (91-92)
- `agent-factory/writing-profile.md`, `agent-factory/contracts/context-note.md`, `agent-factory/seed/memory-bank/plans/board.md`, all role files, `agent-factory/checklists/pr-review-checklist.md`, `NOTICE`, `docs/audit/28-claim-registry.md` (105-117, 930-950)
- ponytail LICENSE: `https://raw.githubusercontent.com/dietrichgebert/ponytail/main/LICENSE` and the GitHub API repo record (curl, 2026-10-31)

### Secondary (MEDIUM)
- `.planning/research/FEATURES.md` §0.1 (ponytail rules quoted by the milestone researcher, 2026-10-20), `.planning/research/PITFALLS.md` Pitfalls 9-11, Phase 39 summaries (39-06, 39-20)

### Tertiary (LOW)
- None.

## Metadata

**Confidence breakdown:**
- Guard and test map, measurements: HIGH. Every count was produced by a command run in this session.
- Recommended mechanisms (D-29 partition, D-30 stand-in, inventory): MEDIUM. They are designs and need a plan-checker pass.
- Byte allocation: MEDIUM. It is a reasoned estimate, to be validated at the plan-2 checkpoint.

**Research date:** 2026-10-31
**Valid until:** 2026-11-30, or until any guard file listed above changes
