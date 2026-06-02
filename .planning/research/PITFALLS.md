# Pitfalls Research

**Domain:** File-based multi-agent SDLC factory (markdown roles/workflows + per-tool installers + Claude Code plugin) layered on top of 5 coding-agent CLIs
**Researched:** 2026-06-02
**Confidence:** HIGH on tool-format facts (verified against current Claude Code docs, 2026), MEDIUM-HIGH on the rest (spec-derived + corroborating research)

> This file is domain-specific. The generic-advice sections of the template (Performance Traps at scale, generic Integration Gotchas, UX) are folded into domain pitfalls where relevant — a markdown kit has no runtime scale curve, so "performance" here means *agent token cost and success rate*, not RPS.

---

## Critical Pitfalls

### Pitfall 1: Bloated, machine-written context files (AGENTS.md / role files)

**What goes wrong:**
The AGENTS.md substrate and role files grow long, exhaustive, and machine-generated. They restate what a linter/CI already enforces, dump full architecture prose into the substrate, and repeat boilerplate across 16 role files. The result is the exact opposite of the goal: agent success *drops* and token cost *rises* on every single run, because every role reads the substrate first.

**Why it happens:**
The natural instinct when building a "factory" is to be thorough — add every rule, every edge case, every command. A coding agent generating these files (the AGENTS.md Scribe is itself an agent) tends to pad. The spec explicitly warns about this (§5.A.2, §19.10, PROJECT.md constraint "Minimal AGENTS.md") precisely because it is the default failure mode.

**How to avoid:**
- Make the AGENTS.md Scribe role a *removal* role, not just an authoring role — its prompt must say "delete what a linter or CI already enforces" and "push detail into the file it points to" (spec §5.A.2 says exactly this; enforce it).
- Hard target: root AGENTS.md fits on roughly one screen. It points to roles/workflows/handoffs/checklists; it does not inline them.
- Substrate is an *index + safety rules + real commands*, not a manual.
- Roles use the fixed 9-section skeleton (§5) and stay terse caveman voice — the voice constraint doubles as a length constraint.
- Single-source everything (see Pitfall 2) so the same paragraph is not copied 5×.

**Warning signs:**
- AGENTS.md exceeds ~1 screen / ~150 lines, or restates lint rules.
- Role files balloon past the skeleton with prose paragraphs.
- The same guidance text appears verbatim in multiple files.
- Token-per-run climbs in dogfooding; first-pass gate success dips.

**Evidence this is real (not just spec opinion):**
Recent research found **LLM-generated context files reduce task success by ~2–3% vs. no context file at all, while human-written context files *improve* it by ~4%** (InfoQ, Mar 2026 review; Morph "context rot"). "Context rot" — degradation as input grows even below the window limit — is measurable. This validates the spec's claim and raises the stakes: a sloppy auto-generated AGENTS.md is worse than none.

**Phase to address:**
The phase that builds the AGENTS.md Scribe role + root AGENTS.md substrate. Add a length/no-duplication check to the validator (Pitfall 14). Re-verify in the dogfood phase by inspecting the generated AGENTS.md on the sample repo.

---

### Pitfall 2: Adapter drift — role content copied per tool

**What goes wrong:**
To "support 5 tools," role text gets copied into per-tool adapter files (a Claude version, a Codex version, a Gemini version…). Over time the copies diverge: a fix lands in the Claude copy but not the Gemini copy, and the 5 tools quietly behave differently. The single-source promise — "only the dispatch differs, never the content" (spec §16.1, brand §3.3) — is broken.

**Why it happens:**
Copying is the path of least resistance, especially because the tools genuinely differ (Claude Code spawns real sub-agents via the Task tool; Codex/Gemini/OpenCode/Copilot load roles sequentially into one context). It *feels* like each tool needs its own role. It does not — only the dispatch wrapper does.

**How to avoid:**
- Canonical role text lives once in `agent-factory/roles/*.md`. Period.
- Adapters are *thin pointers*: a Claude `.claude/agents/<role>.md` wrapper says "You follow `agent-factory/roles/orchestrator.md` exactly. Read it now." (spec §16.3) — frontmatter + a one-line pointer, never the role body.
- For sequential tools (Codex/Gemini/OpenCode/Copilot), the adapter is just an entry-file pointer into the same role files; no role copies at all.
- The validator checks `adapters.md` exists and that wrappers point at canonical files; add a check that no role body text is duplicated into adapters.

**Warning signs:**
- An adapter file contains role *instructions* rather than a pointer.
- A grep for a distinctive role sentence returns more than one file.
- Fixing a role requires editing more than one place.
- Tools produce different behavior for the same `/grug` request.

**Phase to address:**
The packaging/adapters phase. Lock the "pointer, not copy" rule before any second-tool adapter is written. The first adapter sets the pattern every later one follows.

---

### Pitfall 3: Over-engineering — building a platform when the point is boring markdown

**What goes wrong:**
The "factory" framing tempts the builder toward a runtime: a status DB to hold the board, a queue to dispatch agents, a daemon to run the daily sweep, a metrics service, an orchestration engine. Each one violates the core identity ("not a platform, runtime, database, queue, or hosted service" — PROJECT.md, spec §4) and creates something to operate, defeating "boring on purpose."

**Why it happens:**
Two pulls. (1) Markdown feels too simple to be "real," so the builder reaches for infrastructure to feel legitimate. (2) Enterprise features (traceability, NFR catalog, release control, compliance gates) *sound* like they need machinery — but they are all just more markdown files plus agent discipline.

**How to avoid:**
- Treat the constraint as inviolable: markdown for everything except `install.sh`, `install.mjs`, and one optional Node validator (PROJECT.md). If a feature seems to need a runtime, it is the wrong design — the host coding agent *is* the runtime.
- Board = `plans/board.md` (a markdown file). Metrics = markdown counts, not a metrics platform (spec §6.5 says this explicitly). Traceability = one markdown table. Daily sweep = an on-demand agent pass, not a cron daemon.
- Enterprise = a *flag*, not a tax (spec §0, §21). Lean mode with zero config must stay fast; enterprise gates only activate on `mode=enterprise` or a trigger.
- Reject any dependency beyond Node's stdlib for the installer/validator.

**Warning signs:**
- A `package.json` with runtime dependencies appears (validator should not create one — spec §18).
- Anyone proposes a server, daemon, DB, queue, or background worker.
- Lean-mode users are forced through enterprise ceremonies/gates.
- The installer does more than lay down markdown + thin entry pointers.

**Phase to address:**
Architecture/scaffold phase (set the no-runtime boundary in stone) and every feature phase thereafter (each new capability must be expressible as markdown + agent prompt). The enterprise-pack phase specifically must verify lean users are not taxed.

---

### Pitfall 4: Safety enforced by prompt only, not mechanically

**What goes wrong:**
"Never merge a protected branch / never deploy prod" is written into prompts and AGENTS.md — and that is *all*. A prompt is a request, not a guard; an agent can ignore, misread, or be talked out of it (prompt injection, Pitfall 5b). The PROJECT.md "Safety (hard)" constraint demands this be **mechanical** where possible (a Claude Code PreToolUse hook), "not just by prompt … an agent cannot be held accountable."

**Why it happens:**
Writing a sentence is easy; wiring a hook requires knowing the current hook format (which "moves fast" per the spec). Builders default to the prompt and call it done. Also: hooks only exist on Claude Code, so it feels inconsistent to add a guard that only covers one of five tools — leading to skipping it everywhere.

**How to avoid (VERIFIED against current Claude Code hooks docs, 2026):**
- Ship a `hooks/hooks.json` in the plugin (and/or `.claude/settings.json`) with a **PreToolUse** hook matching the `Bash` tool. The hook script reads JSON on stdin (`tool_input.command`), greps for prod-deploy / protected-branch-merge patterns (`kubectl … apply`, `deploy.*prod`, `git push.*main`, `git merge` into protected, etc.), and **denies**.
- Two valid block mechanisms: exit code `2` with reason on stderr, OR exit `0` with JSON `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}`. Both verified current.
- Use `${CLAUDE_PLUGIN_ROOT}` (plugin) or `${CLAUDE_PROJECT_DIR}` (project) for the script path — do not hardcode absolute paths.
- For the 4 tools without hooks: keep the prompt rule AND set `autonomy=pr` as default (agents open a PR, never merge) AND require `production_requires_human_confirmation: true` in config. Defense in depth, not hook-or-nothing.
- Document clearly that the *mechanical* guard is Claude-Code-only today; on other tools the guard is procedural (PR-only + human confirm). Honesty beats a false sense of safety.

**CAUTION — verified gotcha:** Plugin subagents do **NOT** support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields (current docs, security restriction — they are silently ignored). So a per-subagent hook bundled in the plugin will not fire. The prod-deploy guard must be a **plugin-level `hooks/hooks.json`** (or live in `.claude/settings.json`), not a subagent-frontmatter hook. Getting this wrong yields a guard that silently does nothing — the worst outcome.

**Warning signs:**
- The only place "never deploy prod" appears is prose.
- The hook is defined in a subagent's frontmatter (silently ignored).
- The hook script path is hardcoded, not `${CLAUDE_PLUGIN_ROOT}`-relative.
- No test that the hook actually blocks a sample `kubectl apply`.

**Phase to address:**
The Claude Code plugin phase (build + *test* the PreToolUse hook against sample deploy commands). The config/defaults phase (lock `autonomy=pr` default and `production_requires_human_confirmation: true`). The dogfood phase must confirm the guard fires.

---

### Pitfall 5: Faked results — agents reporting gates/tests/citations that never ran

**What goes wrong:**
An agent writes "lint ✓ typecheck ✓ unit ✓ build ✓ — READY_FOR_HUMAN_REVIEW" without running anything, invents a plausible repo command (`npm test`) that does not exist, or cites a file/line it never read. This is catastrophic for grugops specifically because **"the trace is the proof"** (spec §2, PROJECT.md). A fabricated trace is worse than no trace — it launders a lie into an audit record.

**Why it happens:**
LLMs pattern-complete. Asked to "run the gate and report," a model will happily produce the *shape* of a passing report. If AGENTS.md lists a command that doesn't exist, the agent runs it, sees failure, and may "fix" by reporting success. Confident fabrication is the model's path of least resistance.

**How to avoid:**
- Encode "no fabrication" as a hard limit in *every* role prompt and in AGENTS.md safety rules (spec §17.1, §19.9): "Mark unknown commands `UNKNOWN - verify`. Never fake a passing gate, a test result, or a citation."
- Gate commands come *from AGENTS.md only* — never invented (spec §14). If a command is unknown, the gate records `UNKNOWN - verify`, not a pass.
- DoD (both lean and enterprise) includes a literal line "no fake command results" (spec §9.2) — make it a checklist item the agent must tick against real output.
- The backpressure loop must capture *actual* command output into the implementation handoff ("commands run" field), so a human can see real exit codes.
- Validator forbids faked results structurally where it can (spec §18: "Faking results is forbidden anywhere") — at minimum it flags a `READY` result with no recorded command output.

**Warning signs:**
- A handoff says "tests pass" but has no command output / exit codes.
- AGENTS.md commands are suspiciously generic and never marked `UNKNOWN - verify` even on a fresh/brownfield repo.
- A traceability row claims tests exist but the test files don't.
- Citations reference files/lines that don't exist.

**Phase to address:**
Every role-authoring phase (bake the no-fabrication hard limit into the skeleton). The CI/backpressure-gate phase (capture real output, `UNKNOWN - verify` on unknown commands). The validator phase (flag READY-without-evidence). Confirm in dogfood by checking the generated handoffs contain real command output.

---

### Pitfall 6: Tool-format mistakes (plugin.json / marketplace.json / subagent frontmatter / slash-command namespacing)

**What goes wrong:**
The plugin doesn't load, commands don't appear, or they appear under an unexpected name. The spec itself flags these conventions as fast-moving and says "verify against current tool docs" — and indeed several of the spec's own examples are **stale or imprecise** against the current (2026) Claude Code docs. Shipping them as-is produces a broken plugin.

**Why it happens:**
Plugin/marketplace/subagent formats changed since the spec was written. The spec's examples were "best effort, verify later." If the build phase copies them verbatim without verification, it ships bugs.

**How to avoid — VERIFIED facts against current Claude Code docs (code.claude.com, 2026):**

| Topic | Verified current rule | Spec discrepancy to fix |
|-------|----------------------|--------------------------|
| `plugin.json` location | MUST be at `<plugin>/.claude-plugin/plugin.json`. Only `plugin.json` goes in `.claude-plugin/`. | Spec is correct here — keep it. |
| `plugin.json` directory keys | Components (`commands/`, `agents/`, `skills/`, `hooks/`) live at **plugin root**, auto-discovered. Explicit `"commands"/"agents"/"skills"` path keys are **not required** when using default locations. | Spec's plugin.json lists `"commands": "./commands"` etc. — harmless but unnecessary; default discovery works. Do not put these dirs *inside* `.claude-plugin/` (docs call this the "common mistake"). |
| `commands/` vs `skills/` | Docs now say **`commands/` = flat markdown files (legacy)**; **"Use `skills/` for new plugins"** (skills are `<name>/SKILL.md` folders, model-invoked). | Spec only mentions `commands/`. Decide deliberately: commands give the explicit `/grug` slash-command shape the brand wants; skills are model-invoked. The brand's `/grug` UX argues for `commands/`. Document the choice. |
| Slash-command namespacing | Plugin commands are **always** namespaced `/<plugin-name>:<command>`. Namespace = the `name` field in plugin.json. | **This is the key brand gotcha.** A plugin named `agent-factory` yields `/agent-factory:factory`, NOT `/grug`. Brand §5.2 already caught this: to get literal `/grug` + `/grug-x`, ship standalone `.claude/commands/grug.md` form, OR name the plugin `grug` so commands read `/grug:plan`. You cannot get a bare `/grug` from a plugin. |
| `marketplace.json` location | MUST be `.claude-plugin/marketplace.json` at the marketplace repo root. | Spec is consistent. |
| `marketplace.json` required fields | `name` (kebab-case), `owner` (object), `plugins` (array). Each plugin entry needs at minimum `name` + `source`. | Spec example is valid. Note: certain marketplace names are **reserved** (e.g. `claude-plugins-official`, `anthropic-*`); do not use one. `agent-factory-marketplace` is fine. |
| Subagent frontmatter | Only `name` + `description` are **required**. `name` = lowercase + hyphens, must be unique across the scope (duplicates silently discarded). `model` accepts `sonnet`/`opus`/`haiku`/full-id/`inherit` (defaults to `inherit`). `tools` is a comma-separated list (omit to inherit all). | Spec's `model: inherit` and `tools: Read, Grep, Glob, Bash, Edit, Write` are valid. The `description` drives auto-routing — write it as "Use when…". |
| Plugin subagent restrictions | Plugin subagents **ignore** `hooks`, `mcpServers`, `permissionMode` (security). | Not mentioned in spec. Critical for the safety hook (see Pitfall 4) — the guard must be a plugin-level hook, not subagent frontmatter. |
| Testing | `claude --plugin-dir ./plugin` loads locally; `claude plugin validate` checks structure; `/reload-plugins` hot-reloads. | Spec doesn't mention these — use them in the dogfood/validation phase. |

**Warning signs:**
- `/grug` doesn't appear but `/agent-factory:factory` does (namespacing surprise).
- `claude plugin validate` errors, or the plugin silently doesn't load.
- `commands/` or `agents/` placed inside `.claude-plugin/`.
- Subagent files have duplicate `name` values (one silently dropped).
- A reserved marketplace name was chosen.

**Phase to address:**
The packaging/plugin phase. Open the current docs and `claude plugin validate` before writing any manifest. Resolve the `/grug` namespacing decision (standalone `.claude/` form vs. plugin named `grug`) at the start of this phase — it cascades through the brand collateral.

---

### Pitfall 7: Installer that overwrites, isn't idempotent, or isn't reversible

**What goes wrong:**
`install.sh`/`install.mjs` clobbers a user's existing `CLAUDE.md`, appends duplicate lines on re-run, or leaves no way to undo. This violates the PROJECT.md "Installers" constraint (idempotent, additive, dry-run-capable, reversible; never overwrite/delete user content) — and breaks trust on first contact, the worst moment.

**Why it happens:**
Naive file writes (`>` instead of append-if-missing) overwrite. Re-running an installer that blindly appends produces duplicate pointer lines. Dry-run and uninstall are extra work that gets skipped under time pressure.

**How to avoid:**
- Use the spec's `ensure_line` pattern (§16.5): create the file if missing, append the pointer line *only if absent* (`grep -qF`), never rewrite existing content.
- Symlinks for adapter wrappers (`ln -sf`) so updates flow without copies (reinforces single-source, Pitfall 2).
- Honor `DRY_RUN=1` in both installers — every mutating action prints instead of executing.
- Ship `uninstall.sh` that removes *only* the symlinks/pointer lines it added; never touches `agent-factory/`, `plans/`, or user files.
- The two installers (POSIX + Node) must be behavior-identical; test both. Node path covers Windows.
- Test the idempotency property explicitly: run twice, diff the tree — second run produces zero changes.

**Warning signs:**
- Re-running the installer changes files / adds duplicate lines.
- Any use of `>` (truncate) on a file that might be user-owned.
- No `DRY_RUN` branch; no `uninstall.sh`.
- POSIX and Node installers drift in behavior.

**Phase to address:**
The installer phase. Make "run twice, expect no diff" and "dry-run prints only" explicit success criteria. Verify in dogfood (install onto the sample repo, re-run, uninstall, confirm clean).

---

### Pitfall 8: Caveman voice leaking into safety / security / compliance / legal / money text

**What goes wrong:**
The grug voice ("grug not deploy prod. human say yes.") is charming in role prompts — but it bleeds into a security finding, a compliance control description, a release approval, a disclaimer, or the README opener. Now a serious topic reads as a joke, undermining trust exactly where trust matters, and a legal disclaimer in caveman-speak may not even be legally meaningful.

**Why it happens:**
The voice is fun and the builder is in "grug mode" across the whole repo. The two-register rule (brand §4: grug voice for roles/mascot/playful; clear professional English for pitch/docs/security/compliance/money/legal) is easy to forget mid-flow.

**How to avoid:**
- Encode the register map explicitly (brand §4.3, §11): grug voice ONLY in role prompts, mascot, playful collateral, error/empty-state copy. Clear voice in: README first sentence, security findings, compliance text, release/money topics, ALL legal (NOTICE, disclaimers, attribution).
- Security/NFR and Compliance Officer role *outputs* (findings, control mappings) are clear-voice even though the role *prompt* is grug-voice. Make that distinction in the role files: "you think in grug, you write findings in plain professional English."
- README pattern: plain-English description FIRST, then the wink (brand §4.2).
- Add to CONTRIBUTING and the validator/review: scan disclaimers, NOTICE, compliance/security checklists for lowercase-grug tells.

**Warning signs:**
- A disclaimer, NOTICE, or compliance control reads in lowercase third-person grug.
- A security finding says "danger bad, grug fix."
- The README opens with a joke instead of a plain description.

**Phase to address:**
The brand/collateral phase (README/NOTICE/disclaimer in clear voice) and every role-authoring phase that produces *findings* (Security/NFR, Compliance, Release, UAT, Incident) — those role outputs must be clear-voice. Spot-check in the validation phase.

---

### Pitfall 9: Art / mascot resembling the "Grug" children's-book IP, or missing non-affiliation

**What goes wrong:**
A mascot is created that resembles the "Grug" children's-book character (a haystack / grass-tree creature by Ted Prior), or the README/NOTICE ships without the non-affiliation disclaimer and grugbrain.dev attribution. This is the one pitfall with *legal* (not just quality) consequences — copyright protects the character's expression; imitating it touches that.

**Why it happens:**
"Grug has a mascot" → someone searches "grug" → finds the children's-book art → unconsciously imitates it. Or the disclaimer is treated as boilerplate and dropped to save time.

**How to avoid (brand §6.5, §10):**
- Original art only. The grugops mascot is an original caveman-developer figure (club / stone tablet = AGENTS.md), geometric and minimal. NEVER based on or resembling the children's-book character.
- Ship the non-affiliation disclaimer in README footer AND NOTICE, plus grugbrain.dev / Carson Gross attribution in Acknowledgements (ready-to-paste blocks exist in brand §10.4 — use them verbatim).
- CONTRIBUTING rule (brand §10.3): art PRs must be original and not resemble the book character; maintainers reject otherwise; no copy implying a tie to the books.
- Brand as "grugops" (lowercase), never bare "Grug" or "Grug™".

**Warning signs:**
- Mascot art looks like a haystack/grass creature or any existing "Grug" character.
- README/NOTICE missing the disclaimer or attribution.
- Copy uses "Grug" standalone or implies a book tie.

**Phase to address:**
The brand/collateral phase (README, NOTICE, CONTRIBUTING, wordmark/icon SVGs). The provided SVGs (brand §6.3/§6.4) are already original — use those; do not freelance new character art without the original-only rule front of mind.

---

### Pitfall 10: Board ↔ ticket status drift

**What goes wrong:**
`plans/board.md` says a ticket is "In Review" but the ticket file's `status:`/`column:` front matter says "In Development." Now "the board is the state" (spec §2) is a lie, the daily sweep reports wrong info, and metrics are garbage.

**Why it happens:**
Two sources of truth (board file + per-ticket front matter) updated by different roles at different times. An agent moves a ticket on the board but forgets the ticket file, or vice versa. No automated reconciliation.

**How to avoid:**
- Every role that moves work declares its "Board moves" in its role file (spec §5 skeleton) AND updates the ticket front matter in the same step — make it one atomic responsibility, not two.
- The ticket front matter carries `status` + `column` precisely so "board and ticket never disagree" (spec §6.1) — both must be updated together.
- The daily-sweep workflow (§7.10) is the reconciliation pass — it reads board + ticket files and flags mismatches.
- The validator (§18) checks "every ticket file's status matches its board column" — make this a hard validator failure, not a warning.

**Warning signs:**
- A ticket's `column:` field disagrees with the board section it's listed under.
- A ticket appears in two columns, or in none.
- Daily-sweep reports surprises ("this was supposed to be done").

**Phase to address:**
The Delivery-OS / board phase (define the dual-update-in-one-step rule) and the validator phase (board↔ticket match check). Exercise it in the dogfood ticket→PR run.

---

### Pitfall 11: Incomplete traceability rows

**What goes wrong:**
A ticket has a traceability row, but the Tests / UAT / Release columns stay blank because each role didn't append its link as it finished. "The trace is the proof" collapses — an auditor can't answer "is this tested and accepted?"

**Why it happens:**
Traceability is append-as-you-go across many roles (BA creates the row; Architect adds ADR/NFR; Engineer adds PR/files; QE adds tests; UAT adds result; Release adds REL id — spec §10). Any role skipping its append leaves a hole, and the hole is invisible unless something checks.

**How to avoid:**
- Each role's "Trace updates" section (spec §5 skeleton) names exactly what it must append. Non-optional.
- Enterprise DoD (§9.3) is "not met until the row is complete through the relevant stage."
- The validator (§18) flags "rows missing tests/UAT." Make completeness a gate in enterprise mode.
- Lean mode tolerates a shorter row (no release/UAT) — don't force enterprise completeness on lean users (ties to Pitfall 3).

**Warning signs:**
- A "Done" ticket has empty Tests or UAT cells.
- The validator reports rows missing tests.
- A role completes without touching traceability.md.

**Phase to address:**
The traceability phase and each role-authoring phase (every role gets a concrete "Trace updates" line). Validator phase adds the completeness check. Dogfood verifies a row fills end-to-end.

---

### Pitfall 12: WIP limits ignored / self-fix loops running forever

**What goes wrong:**
(a) The Orchestrator pulls new work past a column's WIP limit, so "finish before you start" breaks and the board floods. (b) The backpressure self-fix loop never terminates — the agent keeps "fixing" a failing gate forever, burning tokens and never escalating to a human.

**Why it happens:**
(a) WIP enforcement is a *judgment* the Orchestrator must make every pull; easy to skip when "just one more" feels fine. (b) "Try to fix it" is open-ended; without a hard counter, an LLM will loop, each round confident the next will pass.

**How to avoid:**
- WIP limits come from config (`wip_limits`); the Orchestrator "refuses to pull new work past a WIP limit without a written reason" (spec §6.1). Encode this as an Orchestrator hard limit, and have the daily sweep flag over-WIP columns.
- Self-fix is **bounded**: a fixed, small number of attempts (default 2 from config `self_fix_attempts`), then STOP and hand to a human — "Do not loop forever" (spec §14). The result is one of `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`; there is no "keep trying" outcome.
- The gate workflow (§7.6, §14) must reference the attempt counter explicitly and emit a terminal result.

**Warning signs:**
- A column exceeds its WIP limit with no written reason.
- The gate transcript shows >2 fix rounds, or no terminal result.
- Token cost on a single ticket balloons.

**Phase to address:**
The Delivery-OS phase (WIP enforcement in Orchestrator). The CI/backpressure phase (bounded self-fix with config counter + terminal result). Verify the loop terminates in the dogfood gate run.

---

### Pitfall 13: Claiming "done" without dogfooding

**What goes wrong:**
The kit is declared complete because all files exist and the validator passes — but nobody actually ran `/grug` on a real repo to take a ticket idea→PR. Files existing ≠ the factory working. The spec's acceptance criteria (§20) and PROJECT.md explicitly require a dogfood run; skipping it ships a kit that looks done and isn't.

**Why it happens:**
Structure-complete feels like done. Dogfooding is slow, requires a throwaway repo and a real coding-agent CLI session, and surfaces embarrassing bugs late — so it's tempting to defer or skip.

**How to avoid:**
- Make dogfooding a required acceptance gate (PROJECT.md: "install grugops via `/grug` on a throwaway sample repo, bootstrap it, take one ticket idea→PR end-to-end").
- The dogfood run exercises the integration points the validator can't: does the AGENTS.md the Scribe generates actually help (Pitfall 1)? Do adapters dispatch correctly (Pitfall 2)? Does the hook block a deploy (Pitfall 4)? Are handoffs real (Pitfall 5)? Does `/grug` resolve to the expected command (Pitfall 6)?
- Test on at least Claude Code (plugin form) plus one sequential tool (Codex or Gemini) to prove "only dispatch differs."

**Warning signs:**
- "Done" claimed with no transcript of a real `/grug` run.
- The validator is the only evidence of correctness.
- No throwaway sample repo was created.

**Phase to address:**
A dedicated dogfood/validation phase, last. It is the only phase that tests behavior end-to-end. Treat its failures as release-blocking.

---

### Pitfall 14: Validator checks structure but misses inconsistency

**What goes wrong:**
`validate-agent-factory.mjs` confirms files exist and have the right sections, then declares the kit valid — while board↔ticket status drift (Pitfall 10), incomplete traceability (Pitfall 11), duplicated adapter content (Pitfall 2), and a bloated AGENTS.md (Pitfall 1) all pass unnoticed. A green validator gives false confidence.

**Why it happens:**
File-existence and section-presence checks are easy to write; cross-file consistency checks are harder. The spec's validator scope (§18) leans toward structure — but it *does* call for board/ticket match and traceability completeness, which must not be dropped.

**How to avoid (extend the spec §18 scope deliberately):**
- Beyond "files exist + sections present": (a) board↔ticket status match (Pitfall 10), (b) traceability row per ticket + flag missing tests/UAT (Pitfall 11), (c) config parses with mode/cadence/autonomy, (d) `plugin.json` has a `name` if present.
- Add consistency checks that catch this file's pitfalls: AGENTS.md length/duplication sanity (Pitfall 1), no role-body text duplicated into adapters (Pitfall 2), `READY` results that lack recorded command output (Pitfall 5).
- The validator checks structure; **it is not a substitute for dogfooding** (Pitfall 13). State this in its output so a green run isn't mistaken for "behaves correctly."
- Never let the validator itself fake a pass (spec §18: "Faking results is forbidden anywhere").

**Warning signs:**
- Validator passes but a manual read finds drift/holes.
- The validator only does `existsSync` checks.
- A green validator is cited as proof the factory *works* (vs. *is structurally present*).

**Phase to address:**
The validator phase. Scope it to consistency, not just presence. The dogfood phase confirms the validator's green actually corresponds to a working kit.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy role text into a per-tool adapter "just for now" | One tool works fast | 5 tools drift; every fix is 5 edits (Pitfall 2) | **Never** — pointer from day one |
| Skip the PreToolUse hook, rely on prompt | Ship plugin sooner | Prod-safety is a hope, not a guard (Pitfall 4) | **Never** for the safety guard; OK to *also* keep prompt as defense-in-depth |
| Auto-generate AGENTS.md and don't trim | Substrate written fast | Measurable ~2–3% success drop + token cost on every run (Pitfall 1) | **Never** — trimming is the Scribe's job |
| Validator does existence checks only | Validator ships fast | False-green hides drift/holes (Pitfall 14) | MVP only if dogfooding is mandatory and consistency checks are a tracked follow-up |
| Inline architecture prose into AGENTS.md | One file to read | Bloat (Pitfall 1); duplicates memory-bank | **Never** — point to memory-bank/30-architecture.md |
| Hardcode hook script path | Works on your machine | Breaks on install elsewhere (Pitfall 4) | **Never** — use `${CLAUDE_PLUGIN_ROOT}` |
| Defer dogfooding to "after launch" | Feels done sooner | Ships a kit that looks done and isn't (Pitfall 13) | **Never** — dogfood is the acceptance gate |

## Integration Gotchas

The "external services" here are the 5 host coding-agent CLIs and the Claude Code plugin system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code plugin | Putting `commands/`/`agents/`/`hooks/` inside `.claude-plugin/` | Only `plugin.json` in `.claude-plugin/`; everything else at plugin root (verified docs) |
| Claude Code commands | Expecting bare `/grug` from a plugin | Plugin commands namespace as `/<name>:<cmd>`; for literal `/grug` use standalone `.claude/commands/` OR name the plugin `grug` |
| Claude Code subagents | Bundling the safety hook in subagent frontmatter | Plugin subagents ignore `hooks`/`mcpServers`/`permissionMode`; use plugin-level `hooks/hooks.json` |
| Claude Code subagents | Duplicate `name` across files | `name` must be unique per scope; duplicates silently discarded |
| Marketplace | Using a reserved marketplace name | Avoid `claude-plugins-official`, `anthropic-*`, etc.; `name` is kebab-case |
| Codex / Gemini / OpenCode / Copilot | Writing per-tool role copies | They read `AGENTS.md` natively (nested supported); adapter is just an entry pointer into the same roles |
| AGENTS.md standard | Treating it as a config DSL with built-in scoping | It's plain markdown the agent reads; "scoping" is just nearest-file-wins via nested AGENTS.md |
| All tools | Assuming sub-agent spawning everywhere | Only Claude Code spawns sub-agents (Task tool); others load roles sequentially — "only dispatch differs" |

## "Looks Done But Isn't" Checklist

- [ ] **AGENTS.md substrate:** Often bloated — verify it's ~1 screen, real commands only (or `UNKNOWN - verify`), no inlined architecture, no lint-rule restating.
- [ ] **Per-tool adapters:** Often contain copied role text — verify each is a thin pointer; grep a distinctive role sentence, expect one hit.
- [ ] **Prod-safety hook:** Often prompt-only — verify a plugin-level `hooks/hooks.json` PreToolUse hook actually blocks a sample `kubectl apply` / `git push main`.
- [ ] **`/grug` command:** Often namespaced unexpectedly — verify the literal command shape matches the brand (`/grug` standalone vs `/grug:plan` plugin) and is documented.
- [ ] **plugin.json:** Often misplaced — verify it's in `.claude-plugin/` and components are at root; `claude plugin validate` passes.
- [ ] **Installer:** Often non-idempotent — verify run-twice produces no diff, dry-run prints only, uninstall reverts cleanly, no user file overwritten.
- [ ] **Handoffs/gates:** Often fabricated — verify "commands run" contains real output/exit codes, not just a ✓.
- [ ] **Board ↔ tickets:** Often drift — verify every ticket's `column:` matches its board section.
- [ ] **Traceability:** Often holey — verify a Done ticket's row is complete through the relevant stage.
- [ ] **Disclaimers/NOTICE:** Often missing or in grug voice — verify non-affiliation + grugbrain.dev attribution present and in clear professional English.
- [ ] **Lean mode:** Often taxed — verify zero-config run skips enterprise gates and ceremonies.
- [ ] **Dogfood:** Often skipped — verify a real `/grug` idea→PR transcript exists on a throwaway repo.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bloated AGENTS.md (1) | LOW | Run the Scribe in removal mode; move detail into pointed-to files; re-dogfood |
| Adapter drift (2) | MEDIUM | Pick the canonical role text, delete copies, replace adapters with pointers; add validator check |
| Over-engineering (3) | HIGH | Rip out runtime; re-express feature as markdown + prompt; the longer it lives, the costlier |
| Prompt-only safety (4) | LOW | Add plugin-level PreToolUse hook + `autonomy=pr` default; test the block |
| Faked results (5) | MEDIUM | Add no-fabrication hard limits + `UNKNOWN - verify` + validator evidence check; audit existing traces |
| Tool-format bug (6) | LOW–MEDIUM | Fix against current docs; `claude plugin validate`; re-resolve `/grug` namespacing |
| Bad installer (7) | LOW | Switch to ensure_line/append-if-missing; add dry-run + uninstall; test idempotency |
| Voice leak (8) | LOW | Rewrite findings/legal in clear voice; add reviewer/validator scan |
| IP-resembling art (9) | LOW–MEDIUM (HIGH if shipped/promoted) | Replace with original art; add disclaimer/NOTICE; the cost rises sharply once public |
| Board drift (10) | LOW | Daily-sweep reconcile; validator board↔ticket check |
| Incomplete trace (11) | LOW | Back-fill rows; enforce per-role Trace updates + validator completeness |
| Runaway self-fix (12) | LOW | Wire the config attempt counter + terminal result into the gate |
| No dogfood (13) | MEDIUM | Run the idea→PR dogfood now; fix what it surfaces before claiming done |
| Weak validator (14) | LOW | Add consistency checks; label green as "structure present, not behavior verified" |

## Pitfall-to-Phase Mapping

> Phase names are indicative — the roadmap will name them. Mapping shows *which kind of phase* prevents each pitfall.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Bloated context files | AGENTS.md Scribe + substrate phase | Validator length/dup check; dogfood inspects generated AGENTS.md |
| 2 Adapter drift | Packaging/adapters phase (first adapter sets pattern) | Grep distinctive role sentence → one hit; validator no-dup check |
| 3 Over-engineering | Scaffold/architecture phase + every feature phase | No runtime deps; lean zero-config run skips gates |
| 4 Prompt-only safety | Plugin phase + config/defaults phase | Hook blocks sample deploy; `autonomy=pr` default set |
| 5 Faked results | Every role phase + CI/backpressure phase + validator phase | Handoffs contain real command output; validator flags READY-without-evidence |
| 6 Tool-format mistakes | Packaging/plugin phase | `claude plugin validate` passes; `/grug` shape confirmed |
| 7 Bad installer | Installer phase | Run-twice no diff; dry-run prints; uninstall reverts |
| 8 Voice leak | Brand/collateral phase + finding-producing role phases | Reviewer/validator scan of legal+findings for grug tells |
| 9 IP/art + disclaimer | Brand/collateral phase | Original art; disclaimer + attribution present |
| 10 Board drift | Delivery-OS/board phase + validator phase | Validator board↔ticket match |
| 11 Incomplete trace | Traceability phase + role phases | Validator flags rows missing tests/UAT |
| 12 WIP / self-fix loop | Delivery-OS phase + CI/backpressure phase | Over-WIP flagged; gate emits terminal result ≤2 rounds |
| 13 No dogfooding | Final dogfood/validation phase | Real `/grug` idea→PR transcript on sample repo |
| 14 Weak validator | Validator phase | Validator catches a deliberately-introduced drift/hole |

## Sources

- `/Users/olgeroeselg/Projects/public/grugops/docs/initial/agent_factory_builder_spec_v2.md` — §5.A.2 (AGENTS.md minimalism), §13–14 (safety/backpressure), §16 (packaging/installers, verified against current docs), §17–18 (substrate/validator), §19 (quality rules), §20 (acceptance) — HIGH (project's own contract)
- `/Users/olgeroeselg/Projects/public/grugops/docs/initial/grugops_brand_manual.md` — §4 (two voices), §5.2 (command/namespacing), §6.5 (mascot), §10 (legal/non-affiliation) — HIGH (project's own brand contract)
- [Claude Code — Create plugins](https://code.claude.com/docs/en/plugins) — plugin.json location, root-level component dirs, namespacing, `commands/` vs `skills/`, `--plugin-dir`/`claude plugin validate`/`/reload-plugins` — HIGH (current official docs, 2026)
- [Claude Code — Create custom subagents](https://code.claude.com/docs/en/sub-agents) — required frontmatter (`name`+`description`), `model: inherit` default, tools list, unique-name rule, plugin subagents ignore `hooks`/`mcpServers`/`permissionMode` — HIGH (current official docs)
- [Claude Code — Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace.json location + required `name`/`owner`/`plugins`, entry `name`+`source`, reserved names, install commands — HIGH (current official docs)
- [Claude Code — Hooks](https://code.claude.com/docs/en/hooks) — PreToolUse matcher/stdin JSON/exit-2-or-permissionDecision-deny, `${CLAUDE_PLUGIN_ROOT}` — HIGH (current official docs)
- [agents.md standard](https://agents.md) — plain-markdown, native readers (Codex/Cursor/Copilot/+20), nested-file precedence, no built-in mechanism — HIGH (official spec site)
- [New Research Reassesses the Value of AGENTS.md Files for AI Coding — InfoQ (Mar 2026)](https://www.infoq.com/news/2026/03/agents-context-file-value-review/) — LLM-generated context files reduce success ~2–3% vs none; human-written improve ~4% — MEDIUM-HIGH (corroborates spec's empirical claim)
- [Context Rot: Why LLMs Degrade as Context Grows — Morph](https://www.morphllm.com/context-rot) — measurable degradation as input grows below window limit — MEDIUM (secondary source, consistent with primary research)

---
*Pitfalls research for: file-based multi-agent SDLC factory*
*Researched: 2026-06-02*
