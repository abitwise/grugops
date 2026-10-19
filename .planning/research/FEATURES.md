# Feature Research

**Domain:** File-based multi-agent software-delivery kit (role prompts, workflows, shared verified context, board, gates) running on six host coding-agent CLIs. This file covers the v3.0 milestone "Specialist agents. Shared context. Coordinated work."
**Researched:** 2026-10-20
**Confidence:** MEDIUM overall. The prompt and skill text is HIGH: it was read word for word from the source repos and from installed plugin files. Host-platform behavior is HIGH where Claude Code's official docs state it, and `UNKNOWN - verify` for the other five hosts unless noted. Complexity thresholds and the effect of model tiers are LOW to MEDIUM: no independent, measured rubric exists, so the numbers below are starting values that need calibration.

> **How confidence is labelled.** The GSD `classify-confidence` seam returns LOW for unverified `webfetch`/`websearch` and MEDIUM for verified `websearch`. This file uses the following labels. **HIGH** means a primary artifact read verbatim: a file pulled through `gh api repos/.../contents`, an installed plugin file under `~/.claude/plugins/`, or the vendor's own docs page. **MEDIUM** means a self-reported benchmark or secondary coverage that agrees with a primary source. **LOW** means community blogs or skills with no primary confirmation. No LOW claim is used as the basis for a recommendation without saying so.

---

## 0. What comparable systems do (evidence first)

### 0.1 ponytail: the anti-over-engineering rules, quoted

Source: `github.com/dietrichgebert/ponytail`, MIT, 168k stars per the GitHub API, last push 2026-10-18. Read in full: `skills/ponytail/SKILL.md` (the prompt), `AGENTS.md` (the compact copy), `skills/ponytail-review`, `-audit`, `-debt` and `-gain`, `hooks/ponytail-subagent.js`, and two benchmark reports (retrieved 2026-10-20). **HIGH.**

The whole product is **one prompt** of about 3.5 KB. Everything else in the repo exists to load that prompt into different agents. These are its rules, verbatim:

**Persona and output contract**
- "You are a lazy senior developer. The best code is the code never written. You solve the whole problem with the least new code."
- "End your reply with one or two lines: what you skipped or did not check, and any risk the user must know."

**Scope before code ("Before you write")**
- "Read the task and the code it touches. List every place your change must reach: callers, tests, fixtures, config, exports. Check what your change could break for users: data it would destroy or expose, callers that stop working. That is scope. Extra features are not."

**The ladder ("Take the first option that fully works")**
1. "Does it need to exist? Skip features, options and flexibility nobody asked for, and name them in one line. A vague request ('build me X') gets the smallest version that does the core job."
2. "Already in this codebase (a helper, component, service, pattern)? Use it the way the surrounding code does."
3. "Standard library or a platform feature? Use it, unless the project has its own. A house component beats a native widget."
4. "An installed dependency? Use it. Never add a dependency for a few lines."
5. "Can it be one line a reader gets at a glance? One line."
6. "Otherwise: the minimum code that works."

**Rules**
- "Be lazy about the solution, never about the change itself: finish every part the task needs, including the callers, tests and fixtures your change breaks."
- "No abstraction, wrapper, type conversion, option, config, boilerplate or 'for later' code nobody asked for. Keep values in the form the platform already gives you. Deletion beats addition. Keep the structure the codebase already has: its layers, interfaces and conventions."
- "The shortest working diff wins, once you know everything it must touch. A one-liner that needs decoding is not short."
- "Comment only the why the code cannot show, in one line."
- "Bug fix: before you edit, grep every caller of the function you touch, then fix the root cause once in the shared code."
- "Code you move or merge keeps its error handling and validation."
- "Between options of equal size, take the one that is correct on edge cases."
- "Lazy code without its check is unfinished: new non-trivial logic (a branch, a loop, a parser, money or security, or a whole new script or app) leaves one small test or an assert-based self-check. Trivial changes need none."
- "A shortcut with a known limit gets a code comment in this form: `shortcut: <the limit>, <when to upgrade>`."

**The floor**
- "Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs, anything the user asked for."

**Levels:** `lite` ("Build what was asked. Name the smaller option in one line and let the user pick."), `full` (default), and `ultra` ("Also question the request: before building, push back on any part the need does not justify.").

**Companion skills that matter for grugops**
- `ponytail-review` uses the priority order "correct, safe, holds under load, tested, fast, lean". It has six lenses: Bug, Risk, Scale, Missing test, Speed, Lean. The Lean lens has six sub-tags: delete, reuse, stdlib/native, yagni ("abstraction with one implementation, config nobody sets"), merge, split ("Split by job, never by line count"). Evidence rules: "Every finding needs a concrete case … No case, no finding" and "No style taste, no 'consider', no vague worries." Every finding has four parts: What this is, Problem, Fix, If we skip it. It ends with `Verdict:`, `Lean: -<N> lines possible.` and `Not checked:`.
- `ponytail-debt` greps `shortcut:` comments into a ledger and tags rows with no upgrade trigger as `no-trigger`, because "those are the ones that silently rot."
- `ponytail-gain` sets an **honesty boundary**: "NEVER print a per-repo savings number … the unbuilt version was never written, so there is no real baseline to subtract from." This matches grugops' no-fabrication rule.
- `hooks/ponytail-subagent.js` exists because "SessionStart context is parent-thread only and never reaches subagents, so without this every Task-spawned agent runs ponytail-unaware (issue #252)." **Lesson for grugops:** rules that live only in the main session do not reach spawned engineers. They must be in the engineer's own role text or adapter.

**Measured effect (author's own benchmark, MEDIUM).** `benchmarks/results/2026-10-07-agentic.md` ran Opus 5.5 in headless Claude Code on 39 tasks, 5 runs each, 585 sessions. Against the same agent with no skill, it reports: lines of code −53%, output tokens −45%, cost −26%, time −41%. Hidden checks passed 96.7% against 95.6%, so correctness was level: "Less code did not cost correctness or safety. It did not add any either". "A test where the logic needs one" rose from 68% to 98%. One author ran it, with a disclosed method; no independent replication was found.

**Two lessons from ponytail's own history (HIGH, `2026-06-12-caveman-vs-ponytail.md`):**
1. In v1, "ponytail wrote minimal code, then long 'skipped on purpose' essays. Prose ate the code savings." The fix was an output cap ("if the explanation is longer than the code, delete the explanation") plus "never stall on 'do you need X?'".
2. In v3, "the minimalism skill should not be 2× caveman's length." The prompt was cut from 115 to 95 lines to lower the per-invocation read cost. This supports grugops' plan to rewrite roles compactly within today's byte budget.

### 0.2 obra/superpowers 7.0.0: tier routing, dispatch loop, skill selection

Source: installed plugin at `~/.claude/plugins/cache/claude-plugins-official/superpowers/7.0.0/`. The GitHub repo has 302k stars and was last pushed 2026-10-10. **HIGH.**

**Model tier routing** (`subagent-driven-development/SKILL.md` § Model Selection). This is the most concrete published tier rubric found:
- "Use the least powerful model that can handle each role to conserve cost and increase speed."
- "**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model."
- "**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model."
- "**Architecture and design tasks**: use the most capable available model."
- Signals: "Touches 1-2 files with a complete spec → cheap model · Touches multiple files with integration concerns → standard model · Requires design judgment or broad codebase understanding → most capable model."
- **The key small-model failure mode:** "**Turn count beats token price.** … the cheapest models routinely take 2-3× the turns on multi-step work — costing more overall. Use a mid-tier model as the floor for reviewers and for implementers working from prose descriptions. When the task's plan text contains the complete code to write, the implementation is transcription plus testing: use the cheapest tier."
- "**Always specify the model explicitly when dispatching a subagent.** An omitted model inherits your session's model — often the most capable and most expensive — which silently defeats this section."
- Escalation: "Fix-loop escalation (rounds 4-5): use a model at least one tier above the implementer that got stuck." On `BLOCKED`: "If the task requires more reasoning, re-dispatch with a more capable model … **Never** ignore an escalation or force the same model to retry without changes."
- Batching: "When the plan lists several tasks that are each a small, independent edit of the same kind … Compose ONE dispatch brief … send the whole batch to a single subagent."

**Dispatch loop and in-flight tracking**
- Ledger on disk, not in memory: "Conversation memory does not survive compaction. In real sessions, controllers that lost their place have re-dispatched entire completed task sequences — the single most expensive failure observed. Track progress in a ledger file, not only in todos." "After compaction, trust the ledger and `git log` over your own recollection."
- Waiting: "never poll a wait interface with short timeouts, and never sit in one silent, open-ended wait either … wait in bounded stretches (five to ten minutes …), and between stretches post one line of status and reconcile your live children: list them, and chase any that finished without reporting."
- Context hygiene: "Everything you paste into a dispatch prompt — and everything a subagent prints back — stays resident in your context … Hand artifacts over as files." "A real session's dispatch hit 42k chars of which 99% was pasted history."
- Worker contract: there are four report statuses, `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` and `BLOCKED`. "The implementer never dispatches subagents — not helpers, and never a reviewer … every reviewer a worker spawned duplicated the task review the controller dispatched anyway."
- "Never dispatch multiple implementation subagents in parallel (conflicts)." This is superpowers' rule for one plan in one worktree. grugops parallelizes across tickets, not inside one.
- "Rulings, not stalls." Only four things stop the loop: an irreversible action, a security-sensitive action, an external side effect such as a merge, push or publish, and a plan where every path forward is a guess.

**Skill selection** (`using-superpowers`): "If you think there is even a 1% chance a skill might apply … you ABSOLUTELY MUST invoke the skill." Process skills come before implementation skills. Its `<SUBAGENT-STOP>` block reads: "If you were dispatched as a subagent to execute a specific task, ignore this skill." **Description rule** (`writing-skills`): "Description = When to Use, NOT What the Skill Does … Descriptions that summarize workflow create a shortcut agents will take."

### 0.3 Anthropic official plugins (installed copies, HIGH)

| Plugin | What it is | Fit for grugops |
|---|---|---|
| **feature-dev** | A 7-phase command: Discovery, then 2-3 parallel `code-explorer` agents ("Include a list of 5-10 key files to read"), Clarifying Questions ("DO NOT SKIP"), 2-3 parallel `code-architect` agents (minimal / clean / pragmatic), Implementation ("DO NOT START WITHOUT USER APPROVAL"), 3 parallel `code-reviewer` agents, Summary. Agents are pinned to `model: sonnet`. The reviewer reports only "issues with confidence ≥ 80". | Its pipeline **duplicates** grugops' BA, SA, Architect, Engineer and QE chain. Borrow two patterns: the explorer's "return 5-10 key files" output and the reviewer's confidence floor. Do not embed the command. |
| **code-simplifier** | One agent pinned to `model: opus`. It "operate[s] autonomously and proactively, refining code immediately after it's written". It hard-codes example standards ("Prefer `function` keyword over arrow functions", ES-module import sorting). Its balance rules: "Choose clarity over brevity", "Avoid nested ternary operators". | It conflicts with "smallest diff for one ticket" and with following the repo's own conventions. ponytail-review's **Lean** lens covers the same ground with evidence rules. At most, offer it as an optional review-stage skill. |
| **commit-commands** | `/commit`, `/commit-push-pr` ("Create a new branch if on main … Push … `gh pr create`") and `/clean_gone`. | It stops at the PR, which fits "humans hold merge", but it skips grugops' `_commit-convention.md` (`type(scope)` and the `grugops/<workflow>-<id>` branch guard). grugops already owns this, so do not depend on it. |
| **frontend-design** | "Approach this as the design lead at a design studio." A two-pass process: first a design plan as a compact token system ("4–6 named hex values", type roles, layout with ASCII wireframes, principles), then "review that plan against the brief before building". It lists five clusters of generated-design tells, among them the cream/terracotta look, the "SaaS-card kit" and "ALL-CAPS eyebrow" labels. Its quality floor is "responsive down to mobile, visible keyboard focus, reduced motion respected". It says "Spend your boldness in one place." | **Strong fit for the new Designer role** (design strategy and guidelines). No runtime dependency. |

### 0.4 ui-ux-pro-max-skill (`nextlevelbuilder/ui-ux-pro-max-skill`, MIT, 138k stars, pushed 2026-10-15; HIGH)
- The skill is a Python 3 search script (`scripts/search.py`, standard library only) over large CSV and JSON catalogs: `google-fonts.csv` 747 KB, `phosphor-icons-upstream.json` 824 KB, `styles.csv` 149 KB, and 22 stack files. **It requires Python 3 on the host**, which conflicts with grugops' zero-runtime-dependency host rule. It must therefore be a user-installed optional skill and never vendored into the kit.
- Priority order: 1 Accessibility (CRITICAL; "Contrast 4.5:1 … Keyboard nav"), 2 Touch & Interaction, 3 Performance, 4 Style Selection … 10 Charts. "Skip it for pure backend logic … unless the task changes how something **looks, feels, moves, or is interacted with**."
- Query contract: "**Never assume a stack** — a hardcoded default silently misroutes every recommendation." "**Retry once** … If that retry fails, state that no verified match was found … **Do not persist unverified output.**" This lines up with grugops' verify-before-write rule.
- Persistence: `--design-system --persist` writes `design-system/<project-slug>/MASTER.md` plus `pages/<page>.md` overrides. It "skips writing and leaves it untouched unless you also pass `--force` … Never use `--force` without explicit user authorization." The file lands **outside** grugops state (`memory-bank/`, `.grugops/`), so grugops must decide where it lives.
- Install: `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` (Claude Code), or `npm i -g ui-ux-pro-max-cli` then `uipro init --ai <host>`. Codex, Antigravity, Copilot, OpenCode, Gemini and `universal` (`.agents/skills/`) are listed. Pi is not named. `uipro init --dry-run` and `uipro uninstall` exist.

### 0.5 BMAD-METHOD (`bmad-code-org/BMAD-METHOD`, 54k stars, pushed 2026-10-19; HIGH)
- **Agents:** Analyst, PM, PO ("Sofia": tickets, slicing, board, replan), Architect, Developer, and **UX Designer** ("Sally": "translate user needs into interaction design and UX specifications … feeding both architecture and implementation with clear, opinionated design intent"). Each agent is a skill with menu codes. A skill does one of three things: "loads an agent persona, runs a multi-step workflow, or runs a single task."
- **State layout, the closest precedent for grugops' state repair:** each ticket is its own file (`tickets/epic-*/story-*.md`, `bug-*.md`, `spike-*.md`). The plan sits beside the ticket (`<type>-<slug>-plan.md`). The board is **computed** by `tickets.py status` / `next`. A blocked reason is stored on the ticket's plan (`mark … --blocked <reason>`), not on a shared board. Nothing is deleted: "Drop only after a `Dropped:` line in the ticket's Notes … Never delete an entry from an approved `tickets.toml`."
- **Ready-for-dev standard** (`bmad-build/workflow.md`): Actionable ("Every task has a file path and specific action"), Logical (dependency-ordered), Testable (G/W/T), Complete ("No placeholders or TBDs"), Sufficient, Coherent. **Scope standard:** a plan targets "a single user-facing goal within 900–1600 tokens … Below 900 risks ambiguity; above 1600 risks context-rot in implementation agents. Neither limit is a gate."
- **Docs layout:** `docs/start/` → `plan/` → `build/` → `existing-codebases/` → `customize/` → `reference/`. The reference page (`skills-and-agents.md`) has one table of every agent with its skill ID and codes, and one section per core skill giving **Input** and **Output**.

### 0.6 GSD (installed `gsd-core` 1.18.0; HIGH)
- Model profiles per agent: `quality` / `balanced` / `budget` / `adaptive` / `inherit`. Under `balanced` the planner gets opus and the executor sonnet. Under `adaptive`, "Opus for planning and debugging … Sonnet for execution, research, and verification … Haiku for mapping, checking, and auditing (high volume, structured output)". The `inherit` profile is "Required when using non-Anthropic providers".
- Dynamic routing: default tiers `light` / `standard` / `heavy` map to haiku / sonnet / opus. "If orchestrator marks the result a soft failure, it re-spawns with `attempt: 1` → … next_tier_up", with `max_escalations` defaulting to 1. "Hard failures (exceptions) bypass escalation."
- Context-degradation tiers PEAK / GOOD / DEGRADING / POOR at 0-30 / 30-50 / 50-70 / 70%+, with "checkpoint progress immediately" at POOR. The early warning signs it lists are "Silent partial completion", "Increasing vagueness" and "Skipped steps".

### 0.7 Claude Code platform facts that shape the features (`code.claude.com/docs/en/sub-agents`, `/agent-teams`, `/model-config`, retrieved 2026-10-20; HIGH)
- **Per-spawn model and effort:** "When Claude invokes a subagent, it can also pass a `model` parameter for that specific invocation." The order is per-invocation `model`, then frontmatter `model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. "Claude can also pass an `effort` parameter per invocation for non-fork subagents." *Note:* the GSD reference says "Claude Code's Agent tool has no per-spawn effort parameter". The current docs contradict that, so treat GSD as stale on this point.
- **Forks ignore the tier.** "Fork … Model: Same as main session". Fork mode is "on by default from Claude Code v2.1.302". **A junior or haiku engineer started as a fork runs on the Orchestrator's model.** Tier routing needs named, non-fork subagents.
- **The context window follows the model:** "a subagent's context window is sized by its own model, not the parent's."
- **Completion is event-driven:** "A background subagent's results reach Claude as a completion notification in a later turn." While fork mode is on, Claude "can't wait for a subagent" in interactive sessions. A keep-busy loop must therefore refill on each completion notification, not by blocking.
- **Limits:** "when 20 subagents are running … spawning another … fails with `Concurrent subagent limit reached`"; nesting goes "up to three layers below the main conversation"; `SendMessage` resumes a finished subagent with its full history.
- **Skills per agent:** the `skills:` frontmatter "preload[s] into the subagent's context at startup. The full skill content is injected, not only the description." Only the first 32 names are injected. Agent-team teammates ignore `skills:`.
- **Compaction window:** `autoCompactWindow` (setting), `/autocompact 400k`, `--autocompact`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (env, plain integer), and per-subagent `autoCompactWindow` frontmatter (v2.1.296+). The range is 100K to 1M. So 400k is a native setting on Claude Code. Codex has `model_auto_compact_token_limit` in `config.toml` (`developers.openai.com/codex/config-sample`, MEDIUM). The other four hosts are `UNKNOWN - verify`.
- **Effort on haiku:** "Opus 5.5, Sonnet 5.5, Haiku 5.5 … `low`, `medium`, `high`, `xhigh`, `max`". **This resolves** the `UNKNOWN - verify` in `agent-factory/config/factory.config.md` line 168 ("`haiku` is not listed") for the 5.5 generation. Haiku 4.5 is still not listed.
- **Agent teams (experimental) failure modes:** "Sometimes the lead starts implementing tasks itself instead of waiting for teammates"; "The lead can stop early too, deciding the team is finished before all tasks are actually complete"; "Task status can lag: teammates sometimes fail to mark tasks as completed, which blocks dependent tasks". Sizing advice: "Start with 3-5 teammates … Having 5-6 tasks per teammate keeps everyone productive." Teammates "self-claim … the next unassigned, unblocked task".

### 0.8 Other frameworks
- **MetaGPT** ("Code = SOP(Team)"): Product Manager → Architect → **Project Manager (task distribution)** → Engineer → QA, passing documents rather than chat. Its Project Manager is the closest analogue to a Tech Lead that pre-plans tasks. (Secondary sources, MEDIUM.)
- **Aider architect/editor mode** (aider.chat, 2024-09-26): a strong "Architect" describes the solution and a cheaper "Editor" turns it into edits. o1-preview with an o1-mini or DeepSeek editor scored 85.0%, the top result reported then. This is the original evidence that "strong planner + cheap executor" works **when the plan is explicit**. (HIGH for the claim; the result is dated.)
- **MAST** (*Why Do Multi-Agent LLM Systems Fail?*, arXiv 2503.13657v3, NeurIPS 2025, 1600+ traces, κ=0.88) gives orchestration failure rates. The relevant ones: step repetition 15.7%, reasoning-action mismatch 13.2%, unaware of termination conditions 12.4%, disobey task spec 11.8%, incorrect verification 9.1%, no or incomplete verification 8.2%, premature termination 6.2%. (HIGH.) These are general multi-agent failures, not small-model-specific ones.

### 0.9 Complexity rubrics that exist today
- **No independent, measured rubric that maps task features to model tiers was found.** The best primary guidance is superpowers' file-count and spec-completeness signals (0.2). Community "smart routing" skills bar Haiku from "multi-file refactoring of 4+ files … security reviews, auth logic, payments, database migrations" (smithery / openskillindex listings, **LOW**).
- **SWE-bench Verified** labels difficulty by estimated human fix time: "<15 min" (196 easy tasks) up to ">1 hour" (45 hard). The labels are released, but no per-difficulty resolve rate by model was found (openai.com/index/introducing-swe-bench-verified, MEDIUM).
- Haiku 4.5 launch coverage describes "Sonnet handling complex planning while Haiku-powered sub-agents execute at speed" (press quotes of Anthropic, **MEDIUM**). The primary post was not retrieved.

---

## Feature Landscape

### Table Stakes (users of a v3.0 agent factory will expect these)

| Feature | Why Expected | Complexity | Notes / dependencies on existing grugops |
|---|---|---|---|
| **Plain-language, compact role prompts** (caveman blocks retired) | Every comparable (ponytail, superpowers, BMAD, feature-dev) writes roles in plain imperative English. ponytail's own data says prompt length is a per-invocation tax, and its caveman comparison shows caveman-style savings land on *output*, not on role-prompt input. | MEDIUM: 17 roles + `_role-switch-protocol.md`, today 67,383 bytes in total | Must stay within that budget (milestone decision). It touches `guard_imperative_lexicon` / `guard_sentence_form` / `guard_banned_claims` and the writing profile. The voice guard must be inverted or retired by a recorded decision; the v2.1 lesson was that a stale guard stays green. |
| **"Do less" engineering rules inside the engineer role** (ponytail ladder + floor + scope-first + finish-the-change + one-test-for-logic + `shortcut:` marker + "Not checked" line) | ponytail's published effect (−53% LOC, tests where needed 68%→98%, correctness level) is now the benchmark users compare against. The current `software-engineer.md` has only "small diff, no big rewrites". | LOW to write; MEDIUM to make reach spawned agents | ponytail's subagent hook shows main-session rules **do not reach subagents**, so the rules must sit in the role text that the adapter generator emits. ponytail is MIT, so adapt with attribution in NOTICE or rewrite in grugops words. Keep grugops' own floor: never fake a test, `UNKNOWN - verify`, no architecture change without an ADR. |
| **One file per ticket; board is an overview only** | BMAD (ticket per file, plan beside ticket, board computed), Claude Code agent teams (task files) and GSD (per-phase dirs + index) all do this. The dogfood board is 718 KB. | MEDIUM | Depends on: the board contract (`agent-factory/contracts/board.md`), the v2.1 read-only board projector, `--check`, the validator. **Recommendation:** make `board.md` a *generated projection* of ticket-file frontmatter, which enforces "overview only" mechanically instead of by rule. Blocked reasons go in the ticket file, as BMAD's `--blocked <reason>` does. |
| **`plans/` moved under `memory-bank/`** | One state root. It removes the split that roles must remember (today every role "Reads" both). | MEDIUM: about 31 files path-resolve kit vs state (v1.1 grep-to-zero precedent) | Depends on the kit-vs-state invariant in AGENTS.md, the installer seed (`agent-factory/seed/plans`), every role's `Reads` and `Trace updates` sections, and the validator. Do it **before** the role rewrite so roles are rewritten once against the new paths. |
| **NFRs one per file + traceability one per ticket, with index files** | ADR-style one-record-per-file is the industry norm. The dogfood files are 1.9 MB (traceability) and 369 KB (NFR). BMAD caps a plan at 900–1600 tokens to avoid "context-rot". | MEDIUM | `nfr-catalog.md` and `traceability.md` become indexes, one line per record. Depends on: Security/NFR, Compliance, QE, UAT and Release roles; the ASVS generator output; traceability checks in the validator. |
| **Validator-enforced per-file size budgets** | Without a mechanical budget the files regrow. The v2.1 "derive the set, assert the count" lesson applies. | LOW-MEDIUM | Extend `scripts/validate-agent-factory.ts`. Budgets need a stated unit (bytes) and a refusal message that names the file and the split rule. Use BMAD's ~900–1600 tokens per plan as the reference band, not as a gate. |
| **`install --migrate` for existing repos** | Users on v2.x already have bloated files. Installers must be "idempotent, additive, dry-run-capable, reversible" and "never overwrite or delete user content". | HIGH | Depends on the existing `--migrate`/`--update`/`--check` modes. **Conflict to settle:** splitting a 718 KB board *moves* content, while the installer rule forbids deleting user content. Recommendation: write the split files, leave the original untouched beside them as `*.pre-v3.md` (or behind a banner), and report what it did. Finished-ticket folders may only move to an archive folder, never be squashed or pruned (milestone decision; matches BMAD "never delete"). Mandatory `--dry-run` preview. |
| **Orchestrator keeps capacity full** (refill to `queue.wip_limit` whenever an agent finishes) | Every comparable that parallelizes does this: agent-team teammates "self-claim the next unassigned, unblocked task"; superpowers loops "More tasks remain? → Dispatch". The user's reported failure ("does not spin up new subagents when others stop") is MAST FM-3.1 / FM-1.5 (premature termination, unaware of termination conditions) and the agent-teams "lead can stop early" limitation. | MEDIUM | Depends on: the lock-free queue (WF17 `pending/`→`claimed/`→`done/`), `queue.wip_limit` (default 3), `claim_cap`, `stale_ttl_minutes`. The rule to write: *on every completion notification or wave boundary, (1) record the result, (2) close the finished agent, (3) count live agents, (4) claim and dispatch up to `wip_limit` from `pending/` that pass DoR, (5) only then end the turn.* On sequential hosts the same loop runs at concurrency 1. |
| **Close finished agents** | Agent teams expose "shut down teammates" and `TaskStop`. A finished subagent leaves its result resident in the coordinator's context (superpowers: "everything a subagent prints back stays resident"). | LOW | On Claude Code, finished background subagents leave the panel on their own. "Close" there means: move the claim to `done/`, drop the agent from the in-flight log, and never `SendMessage`-resume it for a new ticket, since resume carries its whole old history. On agent teams it means sending a shutdown request. On sequential hosts it means the role-switch protocol's "drop prior context". |
| **Small, kept-clean in-flight log** | superpowers: a ledger on disk is "your recovery map"; losing it is "the single most expensive failure observed". | LOW-MEDIUM | **Derive it; do not hand-maintain it.** The queue's `claimed/` directory already *is* the in-flight set. The log should be a projection of `claimed/` plus agent id, tier and start time, rendered like the board projector. A second hand-written list would drift (the v2.1 set-literal drift lesson). Budget: at most `wip_limit` live rows; finished rows go to the ticket file. |
| **Compaction near 400k input tokens, host-neutral** | GSD has context-degradation tiers. Claude Code exposes `autoCompactWindow` (100K–1M) and Codex `model_auto_compact_token_limit`. Long-running coordinators drift ("Silent partial completion", "Increasing vagueness"). | LOW (guidance) / MEDIUM (if the installer writes host settings) | Milestone decision: guidance only, behavior near-identical across hosts. The rule to write: *checkpoint the in-flight log and ticket files at every refill, so a compaction or `/clear` loses nothing; compact at ~400k or at a wave boundary, whichever is first; after compaction trust the files, not memory.* Optional and flagged for decision: on Claude Code the installer *could* write `autoCompactWindow: 400000`. That would be a host-only mechanism, which the milestone excludes. Note it as a candidate only. |
| **Every agent and skill has a reference page, linked from one main doc** | BMAD's `reference/skills-and-agents.md` lists every agent with its skill ID, and every skill with Input and Output. Diátaxis (tutorials / how-to / reference / explanation) is the de-facto doc model. | MEDIUM | Depends on the v1.2 docs catalog generator and its fail-closed freshness gate. Generate the reference pages from role and skill frontmatter so the list cannot drift. Add Designer and Tech Lead and the three engineer adapters. |

### Differentiators (where grugops can lead)

| Feature | Value Proposition | Complexity | Notes / dependencies |
|---|---|---|---|
| **Tech Lead role with an auditable, written complexity score** | Comparables route models with prose heuristics inside the coordinator (superpowers) or by agent type (GSD). None writes a **per-ticket, per-factor score into the ticket file** where a human can audit it. That fits grugops' trace-is-the-proof value. | MEDIUM | New role, so: adapter generator, derived role sets, docs catalog, routing matrix, DoR checklist. The Tech Lead runs on the strong tier, matching GSD (planner = opus in quality, balanced and adaptive) and feature-dev's architect role. Its output is a dev plan per ticket **meeting BMAD's ready-for-dev standard** (file path and action per task, dependency order, G/W/T, no TBDs), stored beside the ticket file. Rubric in §Rubric below. |
| **One engineer role, three generated adapters (junior = haiku, mid = sonnet, senior = opus, each with its own effort)** | Matches the milestone decision ("tiers are generated adapters over one role"). Comparables pin a model per *agent type* (GSD, feature-dev) or choose per *dispatch* (superpowers). grugops does both: three named agents, each pinned, picked by the score. | MEDIUM | Depends on the `models`/`effort` dials and `scripts/model-tiers.ts`. **Conflict:** decision D-09 ("NO ROLE IS ASSIGNED `haiku` … the behavior gate catches CORRECTNESS, not JUDGMENT") must be amended by a recorded decision. The defensible scope, following superpowers: haiku only for tasks whose plan text already fixes *what* to write, so the judgment happened in the Tech Lead; the §14 gate then checks correctness. Claude Code honors per-agent `model`/`effort`. Codex, OpenCode and Copilot accept per-agent `model` but grugops emits no per-role adapters there today (`subagent.frontmatter.md` § Host-CLI scope). On those hosts the tier is guidance only, so the milestone's "guidance-only where hosts cannot" holds. **Pitfall:** a fork runs on the parent's model, so tiered engineers must be named non-fork spawns. |
| **Escalate one tier on BLOCKED or a second gate failure** | superpowers ("at least one tier above the implementer that got stuck") and GSD (`max_escalations: 1`) both escalate. It is cheap insurance against the "2-3× the turns" small-model failure. | LOW | The Orchestrator records the escalation in the ticket file. Cap at one escalation, then hand back to the Tech Lead to re-split. Never retry the same tier unchanged. |
| **Designer role (design strategy and guidelines) distinct from Frontend/UI (per-ticket contract)** | BMAD separates UX Designer from Developer, and frontend-design's two-pass "design plan → review against brief → build" is a strategy step. grugops' Frontend/UI today does both the token system and the per-ticket five-state contract. Splitting them gives one product-wide source of design truth. | MEDIUM | New role + workflow 14 change. Designer output: principles, token system (palette, type scale, spacing), style direction, accessibility bar (WCAG 2.2 AA, already in Frontend/UI), and a list of "generated-design tells to avoid" (frontend-design's five clusters). Stored once in `memory-bank/` as a master file plus per-page overrides, following ui-ux-pro-max's MASTER.md pattern. Frontend/UI then reads it and writes the per-ticket contract. Runs once per product or epic, not per ticket. |
| **Skills per role, with a declared fallback** | superpowers relies on a "1% rule" in one session. grugops can instead say, *per role*, which skill applies in which situation and what to do when it is not installed. That is portable to all six hosts and never fabricates a capability. | MEDIUM | Each role gets a short `## Skills` table: situation → skill name → fallback ("not installed → follow this role's own rule; record `UNKNOWN - verify` if the skill was required"). On Claude Code the generator may emit `skills:` frontmatter, but preloading injects the *full* skill text, so preload only small grugops-owned skills and name third-party skills instead. Skills reach Codex, Antigravity, Copilot and Pi through `.agents/skills/` (existing install surface); that third-party skills are present there is `UNKNOWN - verify` per host. Write skill descriptions as triggering conditions only (superpowers `writing-skills`). |
| **Frontend/UI uses ui-ux-pro-max when installed** | It adds a searchable, priority-ordered rule base (accessibility first) and stack-specific guidance, plus a "Do not persist unverified output" contract that matches verify-before-write. | LOW (reference) / MEDIUM (path mapping) | It must stay optional: Python 3 is required, so it cannot ship with the zero-dependency kit. Its `--persist` writes `design-system/<slug>/MASTER.md` at the repo root. Decide whether that file is accepted as a referenced artifact (an `artifact-ref` note) or whether the Designer copies decisions into `memory-bank/`. **Recommendation:** treat `design-system/` as a user artifact grugops references and never writes. Fallback when absent: the Designer's guidelines plus `accessibility-checklist.md`. |
| **Lean review lens in the gate / PR review** | ponytail-review's "No case, no finding" and its Lean sub-tags (delete, reuse, stdlib, yagni, merge, split) give review findings a fixed four-part shape. It found 100% of planted problems against 87% with no skill (author's figures, MEDIUM). | LOW | Add to `pr-review-checklist.md` and the QE/E2E role, ordered correct → safe → load → tested → fast → lean. Keep grugops' own clear voice in security findings. |
| **`shortcut:` marker + debt ledger** | It makes "do less" auditable. A deferral can be found later, and markers with no trigger get flagged. | LOW | The convention goes in the engineer role. The ledger can be a grep in the validator or a Factory Coach duty. It ties into traceability ("known debt" per ticket). |
| **Storyline + layered docs** ("grugops — Specialist agents. Shared context. Coordinated work.") | ponytail's README order (hook → numbers → before/after → how it works → the prompt → install → commands table → FAQ) and BMAD's start → plan → build → reference chapters are both what users meet first. grugops' current front door is dense. | MEDIUM | Layers: (1) README: story, a 60-second "how it works" diagram, install, one end-to-end example. (2) `docs/` index: core concept (roles, shared verified context, board, gate, humans decide). (3) Flows: idea→epics, ticket→PR, gate, UAT, release, each with a short real transcript. (4) Reference: one generated page per agent and skill. (5) Explanation: design decisions. Keep the grugbrain.dev attribution and non-affiliation text visible. Never print per-repo savings numbers (ponytail honesty boundary + grugops no-fabrication). |
| **Graph-memory spike (decision only)** | It answers the user's token-cost question with evidence instead of adding infrastructure. | LOW | Graphify parses code locally with tree-sitter and is Python-based. Its "71.5x fewer tokens" is **self-reported**; one independent test reports 5-10x (secondary, LOW). It targets *code navigation* cost. grugops' measured problem is *state-file* bloat, which file splitting and budgets fix directly. Expected decision: no build; record the revisit trigger. A database stays out of scope. |

### Anti-Features (seem good, create problems)

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| **Automatic model router** (an LLM or script picks the tier at spawn time, hidden) | "Make it pick the cheapest model for me" | Not auditable, and it varies across hosts. It contradicts "the trace is the proof". The rubric thresholds are LOW-confidence, so a hidden router would bake in unvalidated numbers. | The Tech Lead writes the score per factor into the ticket. The Orchestrator maps score to adapter by a fixed table. Calibrate against the real outcomes logged in ticket files. |
| **Haiku for judgment roles** (BA/PM, Architect, Security/NFR, Compliance, UAT, Tech Lead, Designer) | Cost | D-09 still holds for these: thin-model output in a judgment artifact "degrades PAST" the behavior gate. superpowers sets mid-tier as "the floor for reviewers and for implementers working from prose descriptions". | Tiering applies to the **engineer role only**, and the junior tier only to fully specified tasks. |
| **Embedding superpowers' `using-superpowers` / `subagent-driven-development` / `executing-plans`, or feature-dev's whole command, inside grugops roles** | "Use the best skills" | Each brings its **own coordinator loop and ledger**. Two orchestrators fight over dispatch, and `subagent-driven-development` says "Never dispatch multiple implementation subagents in parallel", which conflicts with grugops' WIP width. feature-dev waits on the user at several phases and triples the agent count per ticket. | Reference individual *discipline* skills by name (`test-driven-development`, `systematic-debugging`, `verification-before-completion`, `receiving-code-review`) inside the role that needs them. Borrow patterns (ledger, statuses, "return 5-10 key files", confidence floor), not loops. Note that `finishing-a-development-branch` offers merge options: grugops roles must stop at the PR. |
| **Vendoring third-party skills into the kit** (ui-ux-pro-max, ponytail, frontend-design) | One install | ui-ux-pro-max needs Python 3 and about 2 MB of catalog data, which breaks "zero runtime deps on hosts". Vendoring means drift, licensing and update duties. It also makes grugops a skill marketplace, which is out of scope. | Name the skill, give the install command, and keep a fallback. Adapt short MIT rule text (ponytail) into grugops' own words with attribution in NOTICE. |
| **Host-specific keep-busy hooks as *the* mechanism** (`TeammateIdle`, `SubagentStop`, `TaskCompleted` exit-2 loops) | They work on Claude Code | The milestone decided on host-neutral guidance. Agent teams are experimental, with known lag and shutdown problems, and five of the six hosts lack these hooks. | One written refill loop in the Orchestrator role and WF17. A host hook may be a later optional speed-up, recorded as such. |
| **Polling loops / short sleeps while waiting on agents** | "Watch the agents" | superpowers: "never poll a wait interface with short timeouts". It burns turns and context. | Event-driven refill on completion notifications. On hosts without them, a bounded-wait-then-reconcile against `claimed/` plus the stale-claim TTL sweep. |
| **Orchestrator implementing work itself** | Speed, when one task is left | This is an agent-teams documented failure ("lead starts implementing tasks itself"). It breaks role separation and stops refilling. | Hard limit in the Orchestrator role: it decomposes, schedules, gates and sweeps, and never claims a ticket. The sequential role-switch protocol stays the explicit exception on no-spawn hosts. |
| **Engineers spawning their own reviewers or helpers** | Thoroughness | superpowers: "every reviewer a worker spawned duplicated the task review the controller dispatched anyway". It also eats width and depth. | Engineer adapters carry no spawn grant. Only the Orchestrator spawns (already a grugops hard limit). |
| **Resuming a finished engineer for the next ticket** (`SendMessage` reuse) | Saves spawn latency | A resumed agent keeps its whole earlier history and prompt cache, which is context pollution. It also defeats per-ticket tier choice. | A fresh spawn per ticket. Resume only to finish the *same* ticket (for example after `maxTurns` partial output). |
| **Board carrying ticket detail; one giant traceability or NFR file** | Everything in one place | 718 KB / 1.9 MB / 369 KB in the dogfood. Agents load the whole file every read, and BMAD's "context-rot" band is 900–1600 tokens per plan. | Index files plus one record per file, with size budgets. |
| **Squashing, pruning or summarizing finished tickets to save space** | Smaller repo | It destroys the audit trail (milestone decision) and breaks "never delete user content". | Move finished-ticket folders to an archive folder. Indexes keep one line per record. |
| **Printing per-repo "tokens/cost saved" numbers** | Marketing | ponytail's own boundary: there is no baseline in a live repo. It would be a fabricated figure. | Cite published benchmarks as benchmarks. Report only counted facts (shortcut-ledger size, file sizes before and after migration). |
| **code-simplifier running autonomously after every edit** | "Cleaner code" | It is pinned to opus, hard-codes style opinions that conflict with repo conventions, and widens the diff beyond the ticket. | Lean lens at review; optional named skill for the senior tier only. |
| **Renaming grugops** | It was a human-notes idea | Already decided: the lowercase `grugops` brand stays. | New tagline only. |
| **A graph database or vector store for memory** | Token reduction | Out of scope (no DB). It adds a Python or binary dependency, and it does not fix state-file bloat. | Spike → recorded decision. File splitting + indexes + budgets are the fix for the measured problem. |

---

## Rubric (recommended Tech Lead complexity score, measurable)

There is no validated published rubric (§0.9). This one combines superpowers' signals (files touched, spec completeness, judgment), ponytail's "non-trivial logic" list (branch, loop, parser, money, security), the community Haiku bars (4+ files, auth, payments, migrations; LOW), and grugops' existing XS–XL sizing. Each factor is scored 0, 1 or 2 from facts the Tech Lead can write down. **Thresholds are starting values (LOW confidence) to calibrate from logged outcomes.**

| Factor | 0 | 1 | 2 | How to measure |
|---|---|---|---|---|
| **F1 Files touched** (incl. tests/fixtures/config) | 1–2 | 3–5 | 6+ | Count from the dev plan's file list (BMAD "every task has a file path"). |
| **F2 Spec completeness** | Plan names exact files, changes and test cases (transcription + testing) | Files and G/W/T known; approach open | Approach must be designed | Read the dev plan. A score of 2 means the Tech Lead has not finished planning. |
| **F3 Risk surface** | None | Data writes, public interface, config | Auth, money, security, PII, migrations, concurrency | Tag list. Uses ponytail's "never cut" floor and its non-trivial-logic list. |
| **F4 Novelty** | Same shape as existing code (pattern to copy, ponytail ladder rung 2) | New combination of known repo patterns | No precedent in the repo, new dependency or integration | Name the precedent file, or write "none". |
| **F5 Test burden** | Existing test covers it, or one unit test | New tests in one layer | Cross-layer / E2E / new fixtures | From the G/W/T and the test plan. |
| **F6 Blast radius** | One module, few callers | Public signature change, several callers | Shared contract or schema across modules | `grep` caller count (ponytail: "grep every caller"). |

**Score → adapter** (sum 0–12):
- **0–3 → junior** (haiku, low/medium effort). *Only if* F2 = 0 and F3 = 0. This is superpowers' "plan text contains the complete code … use the cheapest tier".
- **4–7 → mid** (sonnet, medium effort).
- **8–12 → senior** (opus, high effort).
- **Overrides:** F3 = 2 → at least mid (the config may require senior). F2 = 2 → not dispatchable: back to the Tech Lead. Size XL → `SPLIT_REQUIRED` (existing rule). Same-shape small edits across files → one batched dispatch (superpowers batching).
- **Escalation:** `BLOCKED` or a second §14 gate failure → re-dispatch one tier up, once. After that, back to the Tech Lead to re-split.
- **Record:** factor values, sum, chosen adapter and any escalation go in the ticket file. Calibration data comes from these records.

**Known small-model failure modes this rubric guards against:**
- More turns on multi-step work, costing more overall (superpowers, HIGH, practitioner observation). Guard: F1/F2/F5 push multi-step work up a tier.
- A smaller context window when the model differs (Claude Code docs, HIGH). Guard: F1 and the per-plan size band.
- Reasoning-action mismatch, step repetition and premature termination in multi-agent runs (MAST, HIGH, not model-specific). Guard: the explicit dev plan and the four-status report contract.
- Judgment errors the correctness gate cannot see (grugops D-09). Guard: junior is restricted to F2 = 0 and F3 = 0.
- A silent tier bypass when an engineer is spawned as a fork, or with no explicit model (Claude Code docs, superpowers "Always specify the model explicitly"). Guard: named non-fork spawns of the tier adapter.

---

## Feature Dependencies

```
State contract repair (plans/ → memory-bank/, ticket-per-file, NFR-per-file, trace-per-ticket, indexes)
    ├──requires──> path resolution update (kit vs state invariant, seed, validator)
    ├──requires──> size budgets in validator
    └──requires──> install --migrate (split, keep originals, archive finished tickets, dry-run)

Plain-language role rewrite
    ├──requires──> state contract repair (rewrite roles once, against the new paths)
    ├──requires──> recorded decision retiring/inverting voice guards
    └──enhances──> ponytail rules in engineer role (written in the same pass)

Tech Lead role
    ├──requires──> ticket-per-file (score + dev plan live beside the ticket)
    ├──requires──> adapter generator + derived role sets (new role count)
    └──enables───> three engineer adapters (score selects adapter)

Three engineer adapters (junior/mid/senior)
    ├──requires──> models/effort dials + model-tiers.ts (amend D-09 by decision)
    ├──requires──> Tech Lead score
    └──requires──> Orchestrator dispatch rule (named, non-fork, explicit model)

Orchestrator flow (in-flight log, close, refill, compact)
    ├──requires──> lock-free queue (WF17) — in-flight log is a projection of claimed/
    ├──requires──> board projector pattern (render, not hand-write)
    └──enhances──> three engineer adapters (refill picks adapter per ticket)

Designer role ──requires──> memory-bank location for design guidelines
    └──enables───> Frontend/UI reads guidelines; ui-ux-pro-max optional
Skills per role ──requires──> role rewrite (## Skills section written in same pass)
Layered docs ──requires──> all new roles/skills exist (generated reference) + catalog generator
Graph-memory spike ──independent── (decision only; can run any time)

CONFLICTS
    haiku junior tier ──conflicts──> D-09 (no haiku) → needs recorded amendment
    migration splits user files ──conflicts──> "never delete user content" → keep originals
    superpowers coordinator skills ──conflict──> grugops Orchestrator (double dispatch)
    ui-ux-pro-max (Python 3) ──conflicts──> zero host runtime deps → optional only
    CC autoCompactWindow install ──conflicts──> "no host-only mechanism" decision
```

### Dependency Notes
- **State repair before role rewrite:** every role's `Reads`, `Board moves` and `Trace updates` sections name `plans/board.md` and `plans/traceability.md`. Rewriting roles first means rewriting them twice.
- **Tech Lead before tiers:** without a written score the tier choice is a guess inside the Orchestrator, which is the anti-feature.
- **In-flight log is derived from the queue:** a separate hand-kept list repeats the v2.1 set-literal drift failure (7 granted names, 0 adapter files). Render it from `claimed/`.
- **The fork pitfall links the Orchestrator and the tiers:** the refill rule must say "spawn the named tier adapter, never a fork", or junior tasks run on the Orchestrator's model.
- **Docs last:** the reference layer is generated from role and skill files, so it has to follow every new role.

---

## MVP Definition

### Launch With (v3.0)
- [ ] State contract repair + size budgets + `--migrate` (dry-run, keeps originals): this fixes the measured, user-visible breakage (718 KB / 1.9 MB / 369 KB files).
- [ ] Plain-language role rewrite within 67,383 bytes, including ponytail rules in the engineer role. This is the core readability and quality goal.
- [ ] Tech Lead with the written rubric, plus three engineer adapters, plus one-tier escalation. This is the cost and quality lever the milestone is named for.
- [ ] Orchestrator refill/close/in-flight/compaction guidance, host-neutral. This fixes the reported stall.
- [ ] Designer role + Frontend/UI reading its guidelines; a `## Skills` section per role with fallbacks.
- [ ] Graph-memory decision record.
- [ ] New storyline + layered docs with generated agent and skill reference.

### Add After Validation (v3.x)
- [ ] Rubric threshold calibration from logged ticket outcomes. Trigger: about 30+ scored tickets in a dogfood repo.
- [ ] Per-role adapters with `model` for Codex / OpenCode / Copilot (they accept the field). Trigger: a live run on that host.
- [ ] Optional Claude Code speed-ups (`autoCompactWindow`, `SubagentStop` refill nudge). Trigger: a recorded decision that relaxes "no host-only mechanism".
- [ ] Shortcut-debt ledger in the validator or Factory Coach.

### Future Consideration (v4+)
- [ ] Graph or code-index memory, only if the spike decision names a trigger that is later met.
- [ ] Agent-teams mode on Claude Code, once it leaves experimental status.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| State contract repair + budgets + migrate | HIGH | HIGH | P1 |
| Plain-language role rewrite (+ ponytail rules) | HIGH | MEDIUM | P1 |
| Orchestrator refill / close / in-flight / compaction | HIGH | MEDIUM | P1 |
| Tech Lead + rubric | HIGH | MEDIUM | P1 |
| Three engineer adapters + escalation | MEDIUM-HIGH | MEDIUM | P1 |
| Layered docs + generated reference | MEDIUM-HIGH | MEDIUM | P1 |
| Designer role | MEDIUM | MEDIUM | P2 |
| Skills per role (+ fallbacks) | MEDIUM | MEDIUM | P2 |
| ui-ux-pro-max integration (optional) | MEDIUM | LOW | P2 |
| Lean review lens | MEDIUM | LOW | P2 |
| Shortcut marker + ledger | LOW-MEDIUM | LOW | P3 |
| Graph-memory spike | LOW (decision) | LOW | P2 (milestone scope) |

## Competitor Feature Analysis

| Feature | superpowers | BMAD | GSD | Claude Code agent teams | grugops v3.0 approach |
|---|---|---|---|---|---|
| Planner / tech lead | `writing-plans`; the controller rules on conflicts | PO slices; ready-for-dev standard; 900–1600-token plans | `gsd-planner` (opus in quality, balanced, adaptive) | The lead splits work; "5-6 tasks per teammate" | Tech Lead role writes a dev plan + per-factor score beside the ticket |
| Model tiers | Per-dispatch prose signals; escalate on stuck | Not tiered (persona per agent) | Per-agent profile table; dynamic routing light/standard/heavy, +1 tier on soft failure | Model named in the spawn prompt or definition | Three generated engineer adapters picked by the written score; +1 tier once |
| In-flight tracking | Ledger file per plan; reconcile live children | `tickets.py status/next` computed from files | STATE.md + per-phase files | Shared task list, file-locked claims | Projection of the queue's `claimed/` (no second list) |
| Keep busy | Loop "More tasks remain? → Dispatch"; bounded waits | Offers next `ready_to_start` row | Wave-based execution | Self-claim next unblocked task; `TeammateIdle` hook | Refill to `wip_limit` on every completion or wave boundary; host-neutral |
| Designer | n/a (uses frontend-design skill) | UX Designer agent (Sally) | UI-SPEC / ui-phase | n/a | Designer (strategy, guidelines) + Frontend/UI (per-ticket contract) |
| Skill selection | "1% rule"; process skills first | Agent = skill + menu codes | `agent_skills` bootstrap per agent type | Teammates load project skills | `## Skills` table per role with fallback; `skills:` preload only for small owned skills |
| Docs | README + per-skill files | start → plan → build → … → reference, Input/Output per skill | `/gsd-help` + reference dir | n/a | README story → concept → flows + examples → generated reference |

## Sources

All retrieved 2026-10-20 unless noted.
- ponytail: `https://github.com/dietrichgebert/ponytail`. Files read verbatim through the GitHub API: `skills/ponytail/SKILL.md`, `AGENTS.md`, `skills/ponytail-review/SKILL.md`, `skills/ponytail-audit/SKILL.md`, `skills/ponytail-debt/SKILL.md`, `skills/ponytail-gain/SKILL.md`, `hooks/ponytail-subagent.js`, `README.md`, `benchmarks/results/2026-10-07-agentic.md`, `benchmarks/results/2026-06-12-caveman-vs-ponytail.md` (HIGH for text; MEDIUM for benchmark numbers, which are self-reported)
- obra/superpowers 7.0.0, installed plugin: `skills/subagent-driven-development/SKILL.md`, `skills/using-superpowers/SKILL.md`, `skills/dispatching-parallel-agents/SKILL.md`, `skills/writing-skills/SKILL.md`; `https://github.com/obra/superpowers` (HIGH)
- Anthropic official plugins (installed, `claude-plugins-official`): `feature-dev/commands/feature-dev.md` + `agents/*.md`, `code-simplifier/agents/code-simplifier.md`, `commit-commands/commands/{commit,commit-push-pr}.md`, `frontend-design/skills/frontend-design/SKILL.md` (HIGH)
- ui-ux-pro-max: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`, `.claude/skills/ui-ux-pro-max/SKILL.md`, `README.md`, repo tree (HIGH)
- BMAD-METHOD: `https://github.com/bmad-code-org/BMAD-METHOD`, `docs/reference/skills-and-agents.md`, `docs/plan/choose-a-planning-path.md`, `skills/bmad-agent-ux-designer/SKILL.md`, `skills/bmad-agent-po/references/board.md`, `skills/bmad-build/workflow.md`, docs tree (HIGH)
- GSD gsd-core 1.18.0, installed: `references/model-profiles.md`, `references/context-budget.md` (HIGH; per-spawn effort claim superseded by the CC docs)
- Claude Code docs: `https://code.claude.com/docs/en/sub-agents`, `https://code.claude.com/docs/en/agent-teams`, `https://code.claude.com/docs/en/model-config` (HIGH)
- Codex config sample: `https://developers.openai.com/codex/config-sample` (`model_auto_compact_token_limit`; MEDIUM, via search summary)
- MAST: `https://arxiv.org/html/2503.13657v3` (HIGH)
- Aider architect/editor: `https://aider.chat/2024/09/26/architect.html` (HIGH, dated 2024)
- SWE-bench Verified difficulty labels: `https://openai.com/index/introducing-swe-bench-verified/` (MEDIUM, via search summary)
- MetaGPT roles/SOP: secondary summaries (`https://pyshine.com/metagpt/`, `https://www.noze.it/en/insights/metagpt-open-source/`) (MEDIUM)
- Haiku 4.5 sub-agent pattern: `https://techcrunch.com/2025/10/15/anthropic-launches-new-version-of-scaled-down-haiku-model`, `https://thenewstack.io/anthropic-launches-claude-haiku-4-5/` (MEDIUM, press)
- Community routing rubrics: `https://smithery.ai/skills/frankxai/model-routing`, `https://openskillindex.com/skills/vibeeval-vibecosystem-smart-model-routing`, `https://www.morphllm.com/comparisons/claude-haiku-vs-sonnet-vs-opus` (LOW; not used as a sole basis)
- Graphify: `https://claudelog.com/claude-code-mcps/graphify`, `https://blog.gopenai.com/graphify-build-a-knowledge-graph-from-your-entire-codebase-without-sending-your-code-to-anyone-1b6924474b50`, `https://www.mindstudio.ai/blog/graphify-claude-code-knowledge-graph-large-codebase-70x` (LOW; claims self-reported)
- Diátaxis: `https://diataxis.fr/` (HIGH)
- grugops internal: `.planning/PROJECT.md` (Current Milestone, Constraints, Out of Scope), `agent-factory/roles/software-engineer.md`, `agent-factory/roles/orchestrator.md`, `agent-factory/roles/frontend-ui.md`, `agent-factory/config/factory.config.md`, `agent-factory/packaging/subagent.frontmatter.md` § Host-CLI scope, `scripts/model-tiers.ts` (D-09 rationale), `human-notes.txt`

---
*Feature research for: grugops v3.0, a file-based multi-agent software-delivery kit*
*Researched: 2026-10-20*
