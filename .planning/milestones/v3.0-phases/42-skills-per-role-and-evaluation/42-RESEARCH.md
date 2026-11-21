# Phase 42: Skills per role and evaluation - Research

**Researched:** 2026-11-16
**Domain:** Third-party agent skills (evaluation, per-role declaration, per-host discovery), Claude Code permission order, the `install --check` doctor
**Confidence:** MEDIUM overall. HIGH for the repo-internal facts, the Claude Code docs and the live permission probe. MEDIUM for the other five hosts' skill paths, which are cited from vendor docs with no live run. LOW for anything marked `[ASSUMED]`.

## Summary

Both research-flag questions now have answers. **(a) A skill's `allowed-tools` does not override a matching `permissions.ask` rule on Claude Code.** A live probe on Claude Code 2.1.325 showed it. In `-p` mode a project skill pre-approved `Bash(node -e *)`. With a matching ask rule in the project's `.claude/settings.json`, which is the surface grugops's installer writes, the command was denied. Without the ask rule, the same skill ran the command. Without `allowed-tools`, it was denied. The docs agree: "Rules are evaluated in order: deny, then ask, then allow", and for injected commands "Deny and ask rules: a command that one of them matches still aborts". The docs never state the skill-grant-vs-ask order outright for ordinary tool calls, so the result rests on the probe plus the documented order. Interactive mode was not probed. **(b) Each host's skill paths are now cited from its own docs (retrieved 2026-11-16).** Two of them differ from CONTEXT D-24's working assumption. Antigravity CLI's global skills live under `~/.gemini/...`, not `~/.agents/skills/`. OpenCode also reads `.opencode/skills/` and `~/.config/opencode/skills/`.

Three findings change the plan. Each one needs a human decision, and none should be settled quietly.
1. **On Claude Code, a spawned grugops role agent cannot invoke any skill.** Every generated adapter has a `tools:` allowlist without `Skill`. The docs say: "To prevent a subagent from invoking skills entirely, omit `Skill` from the `tools` list". So in Full-tier spawn mode, the Designer and Frontend/UI always take the fallback. SKILL-04 ("uses ui-ux-pro-max when it is installed") is met only in sequential mode, unless a capability is added. D-08 says any capability change is a separate, explicit decision.
2. **Three of the six candidates are not skills at all.** `code-simplifier` is a subagent, and `commit-commands` and `feature-dev` are slash commands plus agents. None has a `<name>/SKILL.md` directory, so D-03's bare-name model and the doctor's lookup cannot represent them.
3. **The `--check` doctor cannot call `roleSkillsOf` directly.** `install/` imports nothing from `scripts/` (D-18/D-28). D-24's "one parser" rule must be met by spawning a committed reader, the pattern the installer already uses for its resolution probe.

The evaluation itself (SKILL-02) has a preliminary shape. frontend-design passes every floor as a whole plugin. ui-ux-pro-max passes as a sub-skill: it uses only the Python 3 standard library and searches local catalogs. Its plugin bundles six other skills, though, and one of them documents a `GEMINI_API_KEY`/`google-genai` network path. superpowers fails as a whole plugin. A `SessionStart` hook injects `using-superpowers` (the "1% rule") into every session, and a user cannot turn off individual plugin skills, so even its passing sub-skills (`systematic-debugging`, `verification-before-completion`) come with that process authority. These are research findings for the executor's `42-EVALUATION.md`. The verdicts belong to that record and the human's ratification (D-15).

**Primary recommendation:** Plan in four waves:
- **Wave 1:** register `docs/skills.md` in the claim-gated sets first, and write `42-EVALUATION.md` from evidence read at a pinned SHA.
- **Wave 2:** a human checkpoint to ratify each recommendation by typed name, and to rule on the `Skill`-grant question.
- **Wave 3:** the role edits, the `AGENTS.md` line, `docs/skills.md`, and the `designer.md` + WF14 rule.
- **Wave 4:** the doctor, which spawns a committed `roleSkillsOf` reader, checks a derived per-host path table, prints uncounted advisory lines, and adds the `claude --version` probe. Test it under a scratch `HOME` and `PATH`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Role skill declarations
- **D-01:** A role's `skills:` line names **third-party skills only**: those the evaluation passes and the human ratifies. grugops's own skills (`grugops-gate`, `-plan` and the others) are workflow entry points and are not listed.
- **D-02:** A role with no ratified skill gets **no `skills:` key and no `## Skills` section**. The parser already reads an absent key as the empty list. SKILL-01 / success criterion 1 ("each role lists the skills it may use") is met by declaring nothing for such a role. The verifier should read it that way, not require a section in all 19 roles.
- **D-03:** Plugin-namespaced skills are written as the **bare kebab name**, which is the `SKILL.md` directory name (e.g. `test-driven-development`, not `superpowers:test-driven-development`). The grammar is unchanged. `docs/skills.md` names the plugin and the pin for each skill.
- **D-04:** The fallback is **inline, per role**. Each `## Skills` row reads: situation → skill → what to do without it (the role's own rule or a checklist link). The section carries one line: record in the note whether the skill ran, and never claim it ran.
- **D-05:** Run-time discovery: a role uses a skill **only if the host shows it among the available skills**. Otherwise it takes the fallback at once. It **never searches the disk** for a skill, the same rule as "kit dir absent → STOP, do not hunt".
- **D-06:** `_role-switch-protocol.md` gets **one short step**: skills come from the host's own skill list, and an absent skill means use the role's fallback. The per-host path table lives in `docs/skills.md` and/or `install/README.md`, never in the protocol.
- **D-07:** A note records skill use **only when the situation in a declared `## Skills` row comes up**: either "used <skill>" or "<skill> not available; used fallback". There is no skills line otherwise.
- **D-08:** A role lists a skill **only if its existing capabilities cover what the skill does**. Any capability change is a separate, explicit decision recorded in this phase, never implied by a skill row. The Designer and Frontend/UI already have `read edit shell`.

### Evaluation and record
- **D-09:** The evaluation judges each of the six against the floors (merge, branching, planning authority, telemetry, network, runtime deps) **as a whole plugin, then per sub-skill**. Only sub-skills that pass on their own can be recommended. For example, superpowers `test-driven-development` or `systematic-debugging` may pass, while `using-superpowers`, `writing-plans`, `using-git-worktrees` and `finishing-a-development-branch` fail.
- **D-10:** The candidate list is **closed at the six SKILL-02 names**: superpowers, code-simplifier, feature-dev, commit-commands, frontend-design and ui-ux-pro-max.
- **D-11:** Record: the full matrix and evidence go in **`.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`**, shaped like `35-DECISION.md`. A **short public `docs/skills.md`** lists only the recommended skills with pins, install commands, the per-host skill paths (D-06) and a "third-party code you vet yourself" notice. `docs/skills.md` joins the claim registry's checked file set **before** it is written, matching the Phase 43 STORY-04 discipline.
- **D-12:** Pins are **tag plus the exact commit SHA** the skill was evaluated at (e.g. `v7.0.0 @ <sha>`). Install commands use the tag where the host installer cannot pin a SHA. "latest" is never used.
- **D-13:** A skill whose frontmatter pre-approves tools (`allowed-tools: Bash` or similar) is **not recommended until** the `allowed-tools` vs `permissions.ask` evaluation order is verified from Claude Code docs. If it cannot be verified, the record says `UNKNOWN - verify` and the skill stays unrecommended. The docs say the git-host floor is the real control.
- **D-14:** The precedence rule is stated **once, as one line in `AGENTS.md`**: grugops roles, workflows and hard limits outrank any skill's text, and a skill supplies technique, never process (no branching, merging, planning artifacts or commit cadence). Roles, `docs/skills.md` and the protocol point to it and never restate it. AGENTS.md is 8,582 B today, under the 20,480 B WARN.
- **D-15:** **A named human ratifies each recommendation by typed name** before any role declares it, using the same typed-name acceptance as UAT ("accepted by Olger" only from a reply ending with the typed name). The plan needs a human checkpoint between the evaluation and the role edits. — **Reversibility:** reversible — a de-ratified skill is removed from the role and from docs/skills.md.
- **D-16:** Re-evaluation happens **only on an explicit trigger**: someone wants to bump a pin, or an upstream security advisory hits a pinned skill. The record names both triggers, like 35-DECISION's revisit trigger. There is no calendar or per-release check.

### ui-ux-pro-max and design-system/
- **D-17:** **The Designer and Frontend/UI both declare ui-ux-pro-max** if it is ratified. The Designer uses it for system-level searches (style, palette, type, accessibility bar). Frontend/UI uses it for per-ticket component and stack lookups.
- **D-18:** **Only the user runs `--persist`** (and never `--force`). Roles run search queries only, which write nothing. When a role thinks a persisted design system would help, it says so in its note and gives the command for the user to run. grugops never writes `design-system/` under any condition.
- **D-19:** When `design-system/` and the Designer's published notes disagree, **`design-system/` wins**. The Designer aligns its notes to it and records the conflict in a note for the human, never overriding the user's file. Frontend/UI keeps reading the Designer's notes as today.
- **D-20:** Roles read `design-system/` **only when ui-ux-pro-max is present** (user's choice over "always read"). The never-write rule in D-18 is unconditional and does not depend on the skill.
- **D-21:** Frontend/UI's fallback is **today's behavior**: the Designer's notes, the five states, WCAG 2.2 AA and the visual baseline, plus a note that the skill was not available (D-07). No new fallback checklist.
- **D-22:** If **frontend-design** is also ratified, both roles may list both skills, in order: ui-ux-pro-max for catalog lookups, frontend-design for aesthetic direction (avoiding a generic look). Either one absent means its fallback.
- **D-23:** The `design-system/` rule (read when the skill is present, never write, user file wins) is written **in `designer.md` and the matching WF14 step only**. Frontend/UI needs no separate rule because it reads the Designer's notes. There is no general rule in the protocol or AGENTS.md.

### Doctor (`install --check`)
- **D-24:** Search scope is **per installed host, from one derived table**. For each host in the install record, check that host's documented project and user skill dirs: on Claude Code, `.claude/skills/`, `~/.claude/skills/` and installed plugins; on the others, `.agents/skills/` and `~/.agents/skills/`, plus any host-specific dir research confirms. A host whose path is `UNKNOWN - verify` gets a "cannot check" line, not a false WARN. The declared skills are read through `roleSkillsOf`, never by a second parser.
- **D-25:** A missing-skill finding is **advisory and exempt from `--strict`**: it never changes the exit code. That follows SKILL-05 ("never fails") literally. The doctor never installs anything.
- **D-26:** The message is one line per skill per host, naming the skill, the declaring roles and the host, and pointing to `docs/skills.md`. For example: `WARN skill ui-ux-pro-max (designer, frontend-ui) not found for claude-code; optional, see docs/skills.md`. No install command appears inline, so the pin lives in one place.
- **D-27:** **The `claude --version` probe deferred by 39 D-22 is folded in.** When Claude Code is an installed host, it warns below v2.1.293 (the junior/haiku floor). It is advisory with the same `--strict` exemption as D-25. When `claude` is absent or its output can't be parsed, the doctor says it cannot check and never guesses.

### Claude's Discretion
- The exact `## Skills` row layout and wording within the role byte budget, and which roles end up with a section (that follows from ratification).
- How the doctor finds installed Claude Code plugin skills (plugin cache layout, `installed_plugins.json` or another documented source), within D-24's "documented paths only" rule.
- How the doctor runs `claude --version` safely (exec form, timeout, no shell), and how it parses the version.
- Where the per-host skill-path table lives: `docs/skills.md`, `install/README.md` or both, without duplicating pins.
- The shape of `42-EVALUATION.md`: the matrix columns and the evidence format per floor.

### Deferred Ideas (OUT OF SCOPE)
- **IN-04** (Phase 39 review: the W1 cross-place test checks that phrases are present, not which value they apply to) goes to the backlog. It is a test-quality item, not doctor work.
- Evaluating ponytail-review or any skill beyond the six goes to a future evaluation, triggered as in D-16.
- Widening the `skills:` grammar to `plugin:skill` stays out. It would need a safety-authority change to a per-key alphabet.
- A general "user design artifacts are read-only" rule for every role in the protocol or AGENTS.md: not now (D-23).
- Re-checking pins on a calendar or at every release: rejected for now (D-16).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKILL-01 | Each role lists the skills it may use, with a built-in fallback checklist for when a skill is absent; the role-switch protocol tells non-Claude hosts how to find skills | Per-host path table (§ Per-host skill discovery); `## Skills` placement rule (heading-order guard); per-file byte headroom table; the `Skill` grant finding (§ Pitfall 1); protocol step placement (§ Pitfall 6) |
| SKILL-02 | A written evaluation of the six against the floors decides which are recommended | Preliminary floor findings per candidate (§ Evaluation evidence), the not-a-skill finding, whole-plugin installation units, pins available per source |
| SKILL-03 | Recommended skills documented as optional, pinned installs; never vendored or installed; one precedence rule stated once | Pinning mechanics per host (`owner/repo#ref`, auto-update defaults, npm CLI version); `docs/skills.md` claim-gate join; AGENTS.md reach caveat (§ Pitfall 8) |
| SKILL-04 | Frontend/UI uses ui-ux-pro-max when installed; `design-system/` is a user artifact grugops reads but never writes | ui-ux-pro-max `--persist` / `--output-dir` / `--force` contract quoted from SKILL.md at v2.15.0; the skill's own text tells agents to persist (§ Pitfall 5); spawn-mode `Skill` gap (§ Pitfall 1) |
| SKILL-05 | `install --check` warns (never fails, never installs) when a declared skill is not found | Doctor counters and exit matrix; uncounted advisory class; spawn-a-reader pattern; Claude Code plugin skill resolution via `installed_plugins.json` + `plugin.json` `skills`; hermetic test needs (`HOME`, `PATH`) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Tooling is TypeScript compiled by `tsc` to committed `.js`, freshness-checked. Node 22+ is a hard prerequisite. Host machines run the committed `.js` with zero runtime dependencies. The installer uses only the Node stdlib (`node:fs`, `node:path`, `node:os`, `node:child_process`).
- **Safety:** agents never merge a protected branch or deploy to production without named human confirmation. The git host is the hard floor. The Claude Code ask rules are a speed bump and not a security boundary.
- **Single-source:** role text lives once, and adapters are thin pointers.
- **Zero-config first:** every role honors `factory.config.json` when present and runs lean without it.
- **Voice:** clear, compact, plain English in role prompts and docs. No grug voice in role instructions, security findings or disclaimers.
- **Installers:** idempotent, additive, dry-run-capable and reversible. They never overwrite or delete user content, and never install third-party content (this phase's anti-feature list).
- **No fabrication:** unknown is `UNKNOWN - verify`. Never fake a passing gate, test or citation. Never claim a skill ran.
- **Minimal AGENTS.md:** short and high-signal. Codex has a 32 KiB cap, and the guard WARNs at 20,480 B and FAILs at 28,672 B.
- **Brand:** always lowercase `grugops`.
- **GSD workflow enforcement:** edits go through a GSD command.
- **User memory:** in UAT, run the checks yourself and surface only what needs a human. The full suite needs over 600 s, and `/tmp` quota can give false EDQUOT failures, so prefer targeted vitest runs. Write "accepted by Olger" only from a reply ending with his typed name. This ties into D-15.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skill declaration (`skills:` line) | Kit markdown (role frontmatter) | Parser (`scripts/canonical-frontmatter.ts` `roleSkillsOf`) | Single source of truth in the role. The parser is the only reader. |
| Skill use at run time | Host coding-agent CLI (its skill list and Skill tool) | Role text (situation → skill → fallback) | grugops supplies the rule. The host supplies discovery and invocation (D-05). |
| Precedence rule | Kit markdown (`AGENTS.md`, one line) | — | Stated once (D-14). |
| Evaluation and ratification | Planning record (`42-EVALUATION.md`) | Human checkpoint (typed name) | A supply-chain decision, so the human owns it (D-15). |
| Public install references | Public docs (`docs/skills.md`) | Claim gates (banned-claims, public-docs vocabulary) | The page must be inside the checked sets before it is written (D-11). |
| Missing-skill detection | Installer doctor (`install/install.ts --check`) | Spawned committed reader in `scripts/` | `install/` imports nothing from `scripts/`, so it spawns the reader. |
| Claude Code version floor | Installer doctor (exec `claude --version`) | — | Advisory only (D-27). |
| `design-system/` artifact | User's repository (written only by the user's `--persist`) | Designer role (reads it when the skill is present) | User artifact (D-18..D-20, D-23). |

## Standard Stack

This phase adds **no dependency** to grugops. The "stack" is the set of third-party skills under evaluation and the facts about where hosts find them.

### Candidates and the pins available today (evidence for D-12)

| Candidate | Shape | Source / license | Version and pin evidence | Install unit |
|-----------|-------|------------------|--------------------------|--------------|
| superpowers | Plugin: 15 skills + a `SessionStart` hook | github.com/obra/superpowers, MIT `[VERIFIED: gh api repos/obra/superpowers]` | tag `v7.0.2` @ `22f0b463e7a5e579904dd6211a520321035526f7` `[VERIFIED: gh api .../tags]`. The `claude-plugins-official` marketplace pins the same SHA as a `url` source `[VERIFIED: local marketplace.json]` | Whole plugin. Plugin skills cannot be turned off one by one: "Plugin skills are not affected by `skillOverrides`. Manage those through `/plugin` instead." `[CITED: code.claude.com/docs/en/skills]` |
| frontend-design | Plugin: 1 skill (`skills/frontend-design/SKILL.md`), no hooks, no scripts | anthropics/claude-plugins-official, Apache-2.0 `[VERIFIED: local LICENSE + gh api]` | `plugin.json` `"version": "1.1.1"`. Latest commit touching the path: `30202c767cfaf325212b3921ab484f83adaec850` (2026-10-26). **The repo has 0 tags** `[VERIFIED: gh api .../tags → 0]`, so D-12's "tag" is unavailable. Pin = plugin version + SHA. | Whole plugin = one skill |
| ui-ux-pro-max | Plugin: **7 skills** (`ui-ux-pro-max`, plus `banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling` authored by "claudekit"). Manifest key `"skills": "./.claude/skills/"` | github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT `[VERIFIED: gh api]` | Latest tag `v2.15.0` @ `a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5`. But `plugin.json` and `marketplace.json` inside that tag both say `"version": "2.13.0"` `[VERIFIED: gh api contents?ref=v2.15.0]`, and Claude Code's cache dir and update detection use the manifest version. `main` @ `e59ff376…` was pushed 2026-11-16. | Whole plugin on Claude Code. Other hosts use the npm CLI `ui-ux-pro-max-cli` (`uipro init --ai <host>`) |
| code-simplifier | **A subagent** (`agents/code-simplifier.md`, `model: opus`). No `SKILL.md`. | claude-plugins-official, `"version": "1.0.0"` | No tags in the repo | n/a: not a skill |
| commit-commands | **Commands** (`commands/commit.md`, `commit-push-pr.md`, `clean_gone.md`). No `SKILL.md`. | claude-plugins-official, `"version": "1.0.1"` | No tags | n/a: not a skill |
| feature-dev | **A command + 3 agents** (`commands/feature-dev.md`, `agents/code-{explorer,architect,reviewer}.md`). No `SKILL.md`. | claude-plugins-official, `"version": "1.0.1"` | No tags | n/a: not a skill |

Sources: the local plugin cache `~/.claude/plugins/cache/anthropic-plugin-directory/{superpowers/7.0.2-22f0b463e7a5,frontend-design/1.1.1-893173fb82a7}`, the marketplace clone `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/*` (read this session), and the ui-ux-pro-max tarball at `v2.15.0` (downloaded as data, not executed).

**Pinning mechanics per host (for `docs/skills.md`):**
- Claude Code can pin a marketplace to a tag: "`owner/repo`. Add `#ref` to pin a branch or tag", for example `/plugin marketplace add your-org/plugins#v1.2.0` `[CITED: code.claude.com/docs/en/plugins/install]`. The docs give no SHA pin for a marketplace add. Auto-update is "On by default: `claude-plugins-official` and the other official marketplace names … Off by default: every other marketplace" `[CITED: same page]`. **So frontend-design (and superpowers, if installed from the official marketplace) auto-updates past any documented pin unless the user turns auto-update off.** `docs/skills.md` must say so.
- ui-ux-pro-max on Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill#v2.15.0`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`. The command shape is `[CITED: install docs]`; the marketplace name `ui-ux-pro-max-skill` is `[VERIFIED: marketplace.json @ v2.15.0]`. The installed version will display as `2.13.0` (manifest drift, above).
- ui-ux-pro-max on other hosts: `npm i -g ui-ux-pro-max-cli@2.15.0`, then `uipro init --ai <host>`. npm shows `latest` = `2.15.0`, published 2026-08-13 `[VERIFIED: npm view]`. The CLI says template installs "use bundled assets" (`--offline` is a "Compatibility flag") `[VERIFIED: cli/src/index.ts @ v2.15.0]`. **The install targets differ from where the hosts read skills:** `copilot` → `.github/prompts/` (not a skills dir), `opencode` → `.opencode/skills/`, `codex`/`antigravity`/`universal` → `.agents/skills/`, `claude` → `.claude/skills/` `[VERIFIED: cli/src/utils/detect.ts @ v2.15.0]`. **There is no `pi` target.** Recommend `--ai universal` for Codex, Copilot and Pi.

## Package Legitimacy Audit

grugops installs no package in this phase. `docs/skills.md` will name one third-party npm package as a user install, so it was audited.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `ui-ux-pro-max-cli` | npm | latest published 2026-08-13 | 25,523/wk | none in npm metadata (the GitHub repo `nextlevelbuilder/ui-ux-pro-max-skill/cli` exists) | [SUS] (`no-repository`) | Flagged. It is named in docs only and never installed by grugops. `docs/skills.md` must carry the "third-party code you vet yourself" notice next to it. |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `ui-ux-pro-max-cli`. `ui-ux-pro-max-cli` [WARNING: flagged as suspicious — verify before using.] Its npm metadata has no `repository` field, and the `cli/package.json` at tag `v2.15.0` says `"version": "2.5.0"` while npm serves `2.15.0`. The planner should put this in the D-15 checkpoint so the human decides whether `docs/skills.md` names the npm path at all, or only the Claude Code marketplace path plus a manual `.agents/skills/` copy.

## Architecture Patterns

### System Architecture Diagram

```
                ┌──────────────────────── evaluation (one-off, human-gated) ────────────────────────┐
 six candidates │ read sources @ pinned SHA ─▶ whole-plugin floors ─▶ per-sub-skill floors ─▶       │
 (D-10)         │ 42-EVALUATION.md matrix ─▶ HUMAN typed-name ratification (D-15) ─▶ ratified set   │
                └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                          │ ratified names only
                 ┌────────────────────────────────────────┼────────────────────────────────────────┐
                 ▼                                        ▼                                        ▼
  role frontmatter `skills: a b`           docs/skills.md (pins, per-host paths,      AGENTS.md: one precedence line
  + `## Skills` rows (situation →          vet-yourself notice) — joins claim         (roles/docs/protocol point to it)
    skill → fallback, record line)         gates BEFORE it is written
                 │
   run time ─────┼──────────────────────────────────────────────────────────────────────────────────
                 ▼
  role activates (role-switch protocol step) ─▶ is <skill> in the HOST's skill list?
          │ yes (and the role can invoke Skill)                    │ no (or spawned adapter lacks `Skill`)
          ▼                                                        ▼
   use skill as technique; grugops rules win                fallback row; note "<skill> not available; used fallback"
   note "used <skill>"                                      (never search disk, never claim it ran)

   doctor (`install.js --check`) ──────────────────────────────────────────────────────────────────
   marker → installed hosts ─▶ spawn committed reader (roleSkillsOf over <kitRoot>/roles) ─▶ {skill → roles}
        ─▶ per host: derived path table ─▶ stat <dir>/<skill>/SKILL.md (+ Claude Code plugin installs)
        ─▶ found: nothing / not found: one uncounted advisory line / path UNKNOWN: "cannot check" line
   Claude Code installed? ─▶ exec `claude --version` (no shell, timeout) ─▶ parse ─▶ < 2.1.293 advisory | cannot check
   exit code: unchanged by any of the above (D-25, D-27)
```

### Recommended file touch map

```
.planning/phases/42-.../42-EVALUATION.md   # new: matrix + evidence + revisit triggers (D-11, D-16)
agent-factory/roles/<role>.md              # only ratified roles: `skills:` + `## Skills` (between Responsibilities and Output)
agent-factory/roles/_role-switch-protocol.md  # one line inside an existing step (see Pitfall 6)
agent-factory/roles/designer.md            # + design-system/ rule (D-23)
agent-factory/workflows/14-ui-design-to-build.md  # + matching step text (D-23)
AGENTS.md                                  # + one precedence line (D-14)
docs/skills.md                             # new public page; corpus membership added FIRST
scripts/check-public-docs-vocabulary.ts    # named part for docs/skills.md; PUBLIC_DOCS_SCAN_COUNT bump
scripts/check-banned-claims.ts             # BANNED_CLAIM_SCAN_COUNT bump (inherits publicDocs part)
scripts/<role-skills-reader>.ts (+ .js)    # new committed reader the doctor spawns (name is planner's choice)
install/install.ts (+ .js)                 # doctor: advisory class, skill check, claude --version probe
install/host-tools.ts (+ .js)              # derived per-host skill-dir table (one authority, next to HOST_TOOLS)
install/README.md                          # replace "does not probe the Claude Code version yet"; skill section
```

### Pattern 1: Uncounted advisory line in the doctor
**What:** The doctor counts FAIL and WARN in module counters, and `--strict` promotes counted WARNs. D-25 and D-27 need lines that never touch either counter.
**Existing code** `[VERIFIED: install/install.ts:1479-1489]`, verbatim:
```ts
let DOC_FAILS = 0;
let DOC_WARNS = 0;
const docReport = (label: string, msg: string): void => console.log(`  ${label.padEnd(14)} ${msg}`);
const docFail = (msg: string): void => {
  docReport("FAIL", msg);
  DOC_FAILS += 1;
};
const docWarn = (msg: string): void => {
  docReport("WARN", msg);
  DOC_WARNS += 1;
};
```
The exit matrix is at `[VERIFIED: install/install.ts:3057-3069]`: `if (DOC_WARNS > 0 && STRICT) { console.log(\`${DOC_WARNS} WARNING(S) (--strict: promoted to failure)\`); return 1; }`. Uncounted labels already in use: `"note"`, `"info"`, `"ok"`, `"reach"` `[VERIFIED: install/install.ts:2305-2386, 2995-3011]`.
**Recommendation:** Call `docReport(<label>, msg)` directly and never `docWarn`. **Do not print the label `WARN` for an uncounted line.** The repo's tests treat `^  (FAIL|WARN)\s` as "counted findings" (`countedRouteLines`, `[VERIFIED: install/kit-route.test.ts:854-855]`). An uncounted line labeled `WARN` breaks that convention and misleads anyone who greps. D-26's example text starts with `WARN`, so the planner must choose: (a) a distinct label such as `advisory` (recommended) with the D-26 wording after it, or (b) keep `WARN` and record that uncounted `WARN` lines exist, updating every counted-line helper. Ask the human, or record the choice as Claude's discretion under D-26.

### Pattern 2: Spawn a committed reader instead of importing `scripts/`
**What:** D-24 requires `roleSkillsOf`, but `install/` "imports nothing from scripts/" `[VERIFIED: install/install.ts:12-18; install/checkpoint-ask-rules.ts:34]`. The installer already reconciles this kind of conflict by spawning: `spawnSync(process.execPath, [join(dir, "scripts", "generate-role-adapters.js")], { encoding: "utf8", env: process.env })` `[VERIFIED: install/install.ts:4854-4857]`, and it reads exactly one JSON line from a probe (`RESOLUTION_PROBE_REL = "grugops-read-resolution.mjs"`) `[VERIFIED: install/install.ts:803-831]`.
**Recommendation:** Add a committed `scripts/<reader>.ts` that takes the kit roles root, admits each role through the canonical admission, calls `roleSkillsOf`, and prints one JSON line (`{ skills: { "<name>": ["<role>", …] }, refusals: [...] }`). The doctor spawns it as `process.execPath` + `join(GRUGOPS_SRC, "scripts", "<reader>.js")` + the kit roles dir, with no `shell`. `GRUGOPS_SRC` defaults to the checkout: `process.env.GRUGOPS_SRC ? resolve(process.env.GRUGOPS_SRC) : resolve(SCRIPT_DIR, "..")` `[VERIFIED: install/install.ts:396-399]`. Read the roles from `DOCTOR_KIT_ROOT` (the kit the target actually uses), not the checkout. Fail closed: a non-zero status, not exactly one line, or bad JSON gives one "cannot check declared skills" line, uncounted, with the reason. A role whose `skills:` is refused belongs to the existing role-frontmatter guard, so the doctor reports the refusal and does not guess.
**Alternative considered:** write a fixed-literal `.mjs` probe into a temp mirror (the render pattern). It needs temp-dir writes under `--check`, which has been a non-writing reader so far, and `/tmp` quota is a known flake source in this repo. Not recommended.

### Pattern 3: One derived per-host skill-dir table
**What:** D-24 wants one table. Keep it beside `HOST_TOOLS` in `install/host-tools.ts`, keyed by host `id`. The ids are `"claude"`, `"codex"`, `"antigravity"`, `"opencode"`, `"copilot"`, `"pi"`, and the names are `"Claude Code"`, `"Codex CLI"`, `"Antigravity CLI"`, `"OpenCode"`, `"GitHub Copilot CLI"`, `"Pi"` `[VERIFIED: install/host-tools.ts:316-443]`. **The D-26 example says `for claude-code`, but the registry id is `claude`**, so print `host.name` or `host.id`, never a third spelling. Pin a test so every `HOST_TOOLS` row has exactly one table entry, and the reverse. The table also feeds `docs/skills.md`'s path table. Either generate that section, or pin it with a test, so the paths are not hand-typed twice.

### Per-host skill discovery (research flag b), retrieved 2026-11-16

| Host (`id`) | Project dirs | User dirs | Plugin / package installs | Invocation | `allowed-tools` | Source |
|---|---|---|---|---|---|---|
| Claude Code (`claude`) | `.claude/skills/<n>/SKILL.md` in the start dir and every parent up to the repo root; nested `<subdir>/.claude/skills/` loads lazily | `~/.claude/skills/<n>/SKILL.md`; managed-settings dir | `<plugin>/skills/<n>/SKILL.md`, shown as `/plugin-name:skill-name`. The plugins root is `~/.claude/plugins` "unless you set `CLAUDE_CODE_PLUGIN_CACHE_DIR`"; `installed_plugins.json` "records each install with its `scope`, `installPath`, and `version`"; a manifest `skills` key "Adds to the default `skills/` scan"; synced plugins live in `synced/` | `/name`; the model uses the Skill tool | Honored, for the invoking turn: "The grant clears when you send your next message" | `[CITED: code.claude.com/docs/en/skills; /plugins/loading; /plugins/manifest-reference]` |
| Codex CLI (`codex`) | `$CWD/.agents/skills`, `$CWD/../.agents/skills` (inside a git repo), `$REPO_ROOT/.agents/skills` | `$HOME/.agents/skills`; `/etc/codex/skills` (admin); bundled system skills | Plugins can bundle skills, but the on-disk location is not documented → `UNKNOWN - verify` | `/skills` or `$name`; implicit by description | Not mentioned | `[CITED: learn.chatgpt.com/docs/build-skills (redirect from developers.openai.com/codex/skills)]` |
| Antigravity CLI (`antigravity`) | `<workspace-root>/.agents/skills/<folder>/` plus each parent folder up to the repo root; legacy `.agent/skills` | `~/.gemini/config/skills/`; CLI only: `~/.gemini/antigravity-cli/skills/` and `~/.gemini/skills/`. **Not `~/.agents/skills/`.** | CLI only: `~/.gemini/config/plugins/<plugin-folder>/skills/` | Auto; each skill becomes a slash command; `/skills reload` | Not mentioned | `[CITED: antigravity.google/docs/skills/]` |
| OpenCode (`opencode`) | `.opencode/skills`, `.claude/skills`, `.agents/skills`, "from the current directory up to the project root" | `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills` | Not documented → `UNKNOWN - verify` | The model calls the `skill` tool; the user types `@skill-id` | Not mentioned. The page lists `name`, `description`, `metadata.opencode/autoinvoke` and `disable-model-invocation` as recognized | `[CITED: opencode.ai/docs/skills/]` |
| GitHub Copilot CLI (`copilot`) | `.github/skills`, `.claude/skills`, `.agents/skills` | `~/.copilot/skills`, `~/.agents/skills` | Plugins can add skills; location undocumented → `UNKNOWN - verify`; `copilot skill list` / `/skills list` | Auto by description, or "/name" in the prompt | **Honored**: "lists tools Copilot may use without asking for confirmation" | `[CITED: docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills]` |
| Pi (`pi`) | `.pi/skills/`, which "loads after project trust is granted"; `.agents/skills/` "from the working directory through its ancestors" (to the repo root) | `<agent-dir>/skills/` (default `~/.pi/agent/skills/`); `~/.agents/skills/` | `skills` setting (`string[]`, paths resolved from the agent dir or project `.pi`) and Pi packages → doctor cannot see them | `/skill:name`; auto by description | "Experimental pre-approved tool list"; runtime behavior unconfirmed | `[CITED: github.com/earendil-works/pi packages/coding-agent/docs/{skills,configuration,settings}.md; docs.pi.dev/latest/skills]` |

Notes for the doctor table:
- The home-dir overrides that grugops's GSD tooling treats as host config roots (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `COPILOT_HOME`, `OPENCODE_CONFIG_DIR`/`XDG_CONFIG_HOME`, `PI_CODING_AGENT_DIR`) are `[ASSUMED]` to also move each host's user skill dir. Only `CLAUDE_CODE_PLUGIN_CACHE_DIR` was cited this session. The safe choice is to check the documented default only, and to print a "cannot check" line, not a false WARN, when a documented override variable is set.
- No host was run live in this session except Claude Code. Copilot, OpenCode, Codex, Pi and `agy` are not installed here (`command -v` found none). Every non-Claude row is docs-only, so the generic "a live run shows the skill in the host's list" claim is `UNKNOWN - verify` per host.
- Name matching: D-03 matches the `SKILL.md` **directory** name. Pi "neither requires nor warns when the declared name differs from the parent directory" `[CITED: Pi docs via search; LOW]`, and a Claude Code plugin skill's frontmatter `name` "replaces the directory name in the last segment of the command" `[CITED: code.claude.com/docs/en/skills]`. So a directory-name lookup is the documented D-03 rule, and the run-time listing can show a different label. The role text must say a skill listed as `<plugin>:<name>` counts as `<name>` (see Pitfall 4).

### Claude Code plugin-skill resolution for the doctor (discretion item)
Use the documented install record:
1. Plugins root = `CLAUDE_CODE_PLUGIN_CACHE_DIR` if set, else `<homedir>/.claude/plugins`.
2. Read `installed_plugins.json` through the bounded `readUserFile` path. Its observed shape on this machine is `{ "version": 2, "plugins": { "<name>@<origin>": [ { "scope", "installPath", "version", "gitCommitSha", "installedAt", "lastUpdated", "directoryRepositoryKey" } ] } }` `[VERIFIED: local file, read 2026-11-16]`. The docs name only `scope`, `installPath` and `version`, so **parse fail-closed**: an unknown shape gives "cannot check Claude Code plugin skills", never "not found".
3. For each entry's `installPath`, the skill dirs are `skills/`, plus any `skills` path(s) from `<installPath>/.claude-plugin/plugin.json` (each must stay inside the plugin root; reject `..`), plus the single-skill form (`SKILL.md` at the root). **ui-ux-pro-max depends on step 3.** Its manifest sets `"skills": "./.claude/skills/"`, so its SKILL.md is at `<installPath>/.claude/skills/ui-ux-pro-max/SKILL.md`. A doctor that checks only `skills/` would print a false "not found" for the flagship SKILL-04 skill.
4. Limits to state in the line or the docs: a marketplace entry's own `skills` list, a disabled-but-installed plugin (`enabledPlugins` false), and `@synced` plugins are not checked. "Found on disk" is not the same as "enabled in this session".

### `claude --version` probe (D-27, discretion item)
- Observed output: `2.1.325 (Claude Code)` `[VERIFIED: ran \`claude --version\` here]`. Parse with an anchored `^(\d+)\.(\d+)\.(\d+)\b` on the first line, compare numerically against `2.1.293`, and treat anything else as "cannot check".
- Use `spawnSync("claude", ["--version"], { encoding: "utf8", timeout: <few s>, shell: false, stdio: ["ignore","pipe","pipe"] })`. The repo's own rule for its node spawns is "`process.execPath` rather than a bare launcher name, so there is no PATH or PATHEXT lookup" `[VERIFIED: install/install.ts:4842-4845]`. A `claude` probe has to look up PATH, so it **executes whatever `claude` is first on PATH**. That is a new exec surface; record it in the threat model.
- Windows: an npm-installed `claude` is usually a `.cmd` shim, and Node refuses to spawn `.cmd`/`.bat` without `shell: true` (the CVE-2024-27980 hardening) `[ASSUMED]`. Never pass `shell: true`. Treat `EINVAL`/`ENOENT` as "cannot check". A native `claude.exe` works without a shell `[ASSUMED]`.
- Run it only when Claude Code is an installed host (from `doctorHosts`).
- Update `install/README.md:2093`, which says verbatim "`install.js --check` does not probe the Claude Code version yet; check it yourself before you rely on the junior level." `[VERIFIED: install/README.md:2085-2093]`. That file is in the banned-claims scan set.

### Anti-Patterns to Avoid
- **Labeling an uncounted line `WARN`.** See Pattern 1.
- **Importing `scripts/canonical-frontmatter.js` from `install/`.** It breaks D-18/D-28 and drags in the frontmatter safety authority's import graph.
- **Writing a second `skills:` parser in the doctor**, for example a regex over role files. D-24 forbids it.
- **Hand-typing per-host paths twice** (in `docs/skills.md` and in the doctor). Derive or pin them.
- **A sixth numbered step in the role-switch protocol.** See Pitfall 6.
- **Putting `## Skills` anywhere except between `## Responsibilities` and `## Output`.** The heading-order guard refuses it (Pitfall 7).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading a role's `skills:` | A regex in `install.ts` | `roleSkillsOf` via a spawned committed reader | One grammar, one parser (D-24, TIER-07). The grammar refuses block lists, quoted values, non-kebab names and repeats. |
| Finding where Claude Code put a plugin | Globbing `~/.claude/plugins/cache/**` | `installed_plugins.json` `installPath` + `plugin.json` `skills` | Documented source. The cache layout `cache/<marketplace>/<plugin>/<version>/` uses the *resolved version*, which can be a SHA or `unknown`. |
| Reading a user file the doctor does not own | `readFileSync` | the existing `readUserFile` (DC-3 bounded read) | Symlinks, FIFOs and oversized files are already handled fail-closed. |
| Version comparison | Lexicographic string compare | Three-integer tuple compare | `2.1.300` vs `2.1.293` compares wrong as strings. |
| Deciding whether a command is a merge or a deploy | Any shell-string parser | Nothing. The git host is the floor (33.1 D-17) | Retired on purpose. A skill's `allowed-tools` must not tempt a parser back in. |
| Vendoring a skill to make the doctor green | Copying SKILL.md into the kit | Nothing. Document the pinned install | Anti-feature: no vendoring, no auto-install. |

**Key insight:** every surface in this phase that looks like detection (does the skill exist, does it pre-approve tools, which version is installed) is owned by a host. grugops reads the host's documented record and reports. It never re-derives host behavior from file contents.

## Runtime State Inventory

Not a rename or refactor phase. One related item: **declaring a skill in a shipped role changes `--check` output for every existing install** on its next doctor run. Advisory lines appear for every installed host where the skill is absent. There is no data migration, but existing doctor tests that compare exact stdout, or that assert no extra lines, will change (see Pitfall 9).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. Skills are read from host dirs, and grugops stores nothing about them. | none |
| Live service config | None | none |
| OS-registered state | None | none |
| Secrets/env vars | `SUPERPOWERS_DISABLE_TELEMETRY` (superpowers' opt-out) and `UI_PRO_MAX_GITHUB_TOKEN`/`GITHUB_TOKEN` (read by `uipro`) are user environment, not grugops's | docs mention only |
| Build artifacts | New committed `.js` for the reader script, plus recompiled `install/*.js`, both freshness-checked | `npm run build` + freshness gates |

## Common Pitfalls

### Pitfall 1: Spawned role agents on Claude Code cannot invoke skills (SKILL-04 gap)
**What goes wrong:** Every generated role adapter has a `tools:` allowlist, for example `tools: Read, Grep, Glob, Edit, Write, Bash` for `grugops-designer` and `grugops-frontend-ui` `[VERIFIED: .claude/agents/grugops-designer.md:4; grep of .claude/agents/*.md]`. Claude Code: "To prevent a subagent from invoking skills entirely, omit `Skill` from the `tools` list or add it to `disallowedTools`." `[CITED: code.claude.com/docs/en/sub-agents]`. So in Full-tier spawn mode the Designer and Frontend/UI never see ui-ux-pro-max, D-05 sends them to the fallback every time, and SKILL-04 holds only in sequential mode (main thread loads the role file).
**Why it happens:** D-08 assumed the existing `read edit shell` capabilities cover what the skill does. The shell part is true, since ui-ux-pro-max runs `python …/search.py`. But invoking a skill is a separate tool grant.
**How to avoid:** Raise it at the D-15 checkpoint as an explicit capability decision (D-08). The options:
- (a) Accept the fallback in spawn mode, and document it per host. No authority change.
- (b) Add `Skill` to the tools of roles that declare skills. This is an adapter-generator and grant-authority change, touching the Phase 27 frontmatter/grant admission surface, KIT-03 and SPAWN-04. It also lets the role agent invoke **any** skill, including superpowers' process skills. Whether a scoped form like `Skill(ui-ux-pro-max)` is valid in a subagent `tools:` line is `UNKNOWN - verify`: permission rules accept `Skill(name)`, and the tools line was not checked.
- (c) Use `skills:` preload. Forbidden by 39 D-28.

**Warning signs:** a UAT transcript where a spawned Designer says "used ui-ux-pro-max". Under (a) that would be fabrication.

### Pitfall 2: A "pass" sub-skill of superpowers brings the whole plugin's process authority
**What goes wrong:** superpowers ships `hooks/hooks.json` with a `SessionStart` hook (`"matcher": "startup|clear|compact"`). It reads `skills/using-superpowers/SKILL.md` and injects it into every session `[VERIFIED: local cache hooks/hooks.json and hooks/session-start]`. That skill says "If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill." `[VERIFIED: skills/using-superpowers/SKILL.md:11]`. Plugin skills cannot be turned off one at a time (`skillOverrides` does not apply to them) `[CITED: code.claude.com/docs/en/skills]`.
**How to avoid:** `42-EVALUATION.md` must judge the **install unit**, not only the SKILL.md. "systematic-debugging passes on its own" and "recommending systematic-debugging means installing a plugin whose hook makes it a second planning authority" are both true. The record states both, and the human decides (D-09, D-15).

### Pitfall 3: Three candidates have no SKILL.md
**What goes wrong:** `code-simplifier` is an agent file, `commit-commands` is three command files, and `feature-dev` is a command plus three agents `[VERIFIED: find over the marketplace clone]`. A `skills:` line naming them cannot be resolved by D-03's directory rule or by the doctor. A grugops role spawning a third-party agent would also break "only the coordinator spawns" (role adapters carry no `Agent` grant).
**How to avoid:** The evaluation records a shape finding ("not a skill; cannot be declared under the D-03 model") beside the floor results, so these three cannot reach `skills:` by accident.

### Pitfall 4: Bare name vs the namespaced name the host shows
**What goes wrong:** D-05 says "use it only if the host shows it among the available skills". Claude Code shows plugin skills as `superpowers:systematic-debugging` and `ui-ux-pro-max:ui-ux-pro-max` `[CITED: skills docs, namespacing]`. A role told to look for `ui-ux-pro-max` might miss `ui-ux-pro-max:ui-ux-pro-max`, or match a project skill with the same bare name.
**How to avoid:** One short clause in the protocol line or the `## Skills` record line: "a listed `<plugin>:<name>` counts as `<name>`". Keep it within budget, and do not restate it in each role.

### Pitfall 5: ui-ux-pro-max's own text tells the agent to persist
**What goes wrong:** The skill says "To save the design system for retrieval across sessions, add `--persist` **and always pass `--output-dir` pointed at the project root**". It also says `--force` is allowed only "with explicit user authorization" `[VERIFIED: SKILL.md @ v2.15.0 lines 88-104]`. A role following the skill could write `design-system/<slug>/MASTER.md`. That breaks D-18, which says only the user runs `--persist`.
**How to avoid:** The `designer.md` hard limit (D-23) and the AGENTS.md precedence line (D-14) must cover it. The role text says: run searches only, never `--persist` or `--force`, and give the user the command. Note that `--design-system` *without* `--persist` writes nothing, which matches D-18's "search queries only". Also, `--persist` without `--output-dir` writes "relative to whatever directory the tool happens to run from" `[VERIFIED: same lines]`, so the user-facing command in the role note should include `--output-dir`.

### Pitfall 6: Adding a sixth protocol step breaks a pinned section name
**What goes wrong:** `_role-switch-protocol.md` has `## The 5 steps`, and `scripts/flow-guidance-text.test.ts:751` reads `section(ROLE_SWITCH, "The 5 steps")` `[VERIFIED: grep]`. A new numbered step means renaming the heading, which breaks that test, and the prose says "run these five steps".
**How to avoid:** Write D-06's "one short step" as an indented line under step 2 ("Read the role's file…"), where the role learns its skills. The heading stays.

### Pitfall 7: Section order and byte ceilings
**What goes wrong:** `ROLE_HEADING_ORDER`: "Any other `## ` heading may sit only between Responsibilities and Output." `[VERIFIED: scripts/check-role-rules.ts:832-843]`. The per-file ceilings are locked measurement baselines ("FAIL WARN") `[VERIFIED: scripts/check-foundation-guards.ts:3524-3544]`. Current headroom:

| Role | Bytes now (`wc -c`) | Ceiling (FAIL WARN, verbatim) | Headroom to WARN / FAIL |
|---|---|---|---|
| designer.md | 2640 | `"2957 2799"` | 159 / 317 B |
| frontend-ui.md | 2996 | `"3356 3176"` | 180 / 360 B |
| software-engineer.md | 4698 | `"4982 4715"` | **17** / 284 B |
| qe-e2e.md | 2628 | `"2944 2786"` | 158 / 316 B |
| tech-lead.md | 3775 | `"4128 3907"` | 132 / 353 B |
| architect-design.md | 2894 | `"3242 3068"` | 174 / 348 B |
| corpus total (20 files) | 60519 | `ROLE_CORPUS_FAIL = 67383`, `ROLE_CORPUS_WARN = 64000` | 3481 / 6864 B |

A `## Skills` heading, two rows and the record line come to about 300-450 B. **The Designer gets the design-system rule (D-23) too**, so it will likely exceed its per-file FAIL. The software-engineer is already 17 B from WARN.
**How to avoid:** The ceilings are locked ("a later phase must not 'fix' it", D-17 Phase 27). A raise needs a recorded, named-human decision (precedent: the tech-lead raise history). Two options: (a) keep each role's text minimal and push the `design-system/` detail into WF14 (Phase 40 D-05: "A role over budget moves detail into the workflow that runs it"), or (b) put a ceiling re-baseline for the affected roles into the D-15 checkpoint. Run `node scripts/check-foundation-guards.js` before committing.

### Pitfall 8: The AGENTS.md precedence line does not reach every host repo
**What goes wrong:** install writes the kit's `AGENTS.md` into a target only when the target has none: "AGENTS.md is never written when the target has one of the user's." `[VERIFIED: install/install.ts:8705]`. In a repo with its own `AGENTS.md`, the D-14 line is not read. Roles "point to it" and would point at nothing.
**How to avoid:** Have the role pointer name the kit path (`<kitRoot>`-relative, as the kit route does) or the specific heading. Otherwise, state the limit in `docs/skills.md`. Also decide whether the line gets a claim anchor in `docs/audit/28-claim-registry.md` (AGENTS.md is a registry file). A precedence rule is a safety-shaped sentence, so registering it is the conservative choice. That is a planner call.

### Pitfall 9: Doctor tests stop being hermetic
**What goes wrong:** `spawnBin` passes `{ ...process.env, … }` and sets `HOME` only when `opts.home` is given `[VERIFIED: install/installer-paths.test-support.ts:392-400]`. The new doctor reads `~/.claude/skills`, `~/.agents/skills`, `~/.claude/plugins/installed_plugins.json` and runs `claude` from `PATH`. On this machine superpowers 7.0.2 and frontend-design 1.1.1 are installed and `claude` 2.1.325 is on PATH, so results would depend on the developer's box.
**How to avoid:** In the new tests, always pass a scratch `home`, a scratch `PATH` (or a fake `claude` script on a scratch PATH for the version cases), and unset `CLAUDE_CODE_PLUGIN_CACHE_DIR`/`XDG_CONFIG_HOME`. Sweep the existing doctor tests for exact-output assertions that the new uncounted lines change.

### Pitfall 10: Copilot honors `allowed-tools`, and grugops writes no Copilot permission rules
**What goes wrong:** On Copilot CLI, `allowed-tools` "lists tools Copilot may use without asking for confirmation" `[CITED: docs.github.com add-skills]`. commit-commands' `commit-push-pr` pre-approves `Bash(git push:*)` and `Bash(gh pr create:*)` `[VERIFIED: local marketplace clone, commands/commit-push-pr.md frontmatter]`. The Claude Code result in this research says nothing about Copilot.
**How to avoid:** `docs/skills.md` and the evaluation say that on hosts without grugops ask rules, a skill's pre-approval stands, and the git host is the floor. This is moot if no recommended skill carries `allowed-tools`: the frontend-design and ui-ux-pro-max SKILL.md frontmatter has none `[VERIFIED: frontmatter read; grep over ui-ux-pro-max .claude/skills → no allowed-tools]`.

## Code Examples

### Live probe: skill `allowed-tools` vs `permissions.ask` (research flag a)
```text
# Claude Code 2.1.325, `claude -p "/grugprobe" --setting-sources project --permission-mode default`
# SKILL.md (project .claude/skills/grugprobe): allowed-tools: Bash(node -e *)
# body: run  node -e "require('fs').writeFileSync('grugprobe-ran.txt','ran')"
A  ask rule via --settings '{"permissions":{"ask":["Bash(node -e *)"]}}'   -> file absent
   "The probe command was denied: Bash permission wasn't granted, so the command didn't run and `grugprobe-ran.txt` wasn't created."
B  no ask rule, allowed-tools present                                      -> file present
   "The command ran: it wrote `ran` to `grugprobe-ran.txt` and wasn't denied."
C  no ask rule, no allowed-tools                                           -> file absent
   "It was denied: the command needs approval, so it didn't run and `grugprobe-ran.txt` wasn't created."
D  ask rule in project .claude/settings.json (the surface grugops writes)  -> file absent
   "The command was denied: Bash permission wasn't granted, so `grugprobe-ran.txt` was not written."
```
B vs C shows the grant is effective. A and D show a matching ask rule beats it. In `-p` mode, ask means deny; interactively it would prompt. This is consistent with the docs: "Rules are evaluated in order: deny, then ask, then allow. … a matching ask rule prompts even when a more specific allow rule also matches the same call." `[CITED: code.claude.com/docs/en/permissions]`. It also matches "Deny and ask rules: a command that one of them matches still aborts" for injected commands `[CITED: code.claude.com/docs/en/skills]`. Scope of the claim: Claude Code 2.1.325, non-interactive, one run each, with the ask-rule form grugops writes (`Bash(<tool> <verb> *)`, `[VERIFIED: install/checkpoint-ask-rules.ts:103-105]`). The interactive prompt path is `[ASSUMED]` to follow the documented order. For D-13 this is enough for the record to say "verified on Claude Code 2.1.325 (-p); the git host stays the floor", rather than `UNKNOWN - verify`. Whether that lifts D-13's bar is the human's call at the checkpoint.

### `roleSkillsOf`: the grammar the reader uses
```ts
// [VERIFIED: scripts/canonical-frontmatter.ts:967-972]
const SKILLS_KEY = "skills";
const KEBAB_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function roleSkillsOf(doc: AdmittedDocument): RoleSkills {
```
It returns `{ ok: true, value: [] }` for an absent key, so D-02 holds as-is. The fixture `scripts/fixtures/role-skills.md` carries `skills: ui-ux-pro-max frontend-design` `[VERIFIED: file read]`. The adapter test already plants `skills: frontend-design` and asserts no adapter carries `^skills:` `[VERIFIED: scripts/generate-role-adapters.test.ts:2329-2350]`, so 39 D-28 stays guarded.

### `docs/skills.md` joins the gates first (D-11)
The public-docs corpus is a hand-authored parts array: `{ name: "root" … }, { name: "examples" … }, { name: "kitReadme" … }, { name: "guarantees" … }` `[VERIFIED: scripts/check-public-docs-vocabulary.ts:480-488]`. A one-file part fails closed when the file is absent (`guaranteesMembers()`, `[VERIFIED: :450-461]`). The two-sided pins are `PUBLIC_DOCS_SCAN_COUNT = 11` `[VERIFIED: scripts/check-public-docs-vocabulary.ts:593]` and `BANNED_CLAIM_SCAN_COUNT = 128` `[VERIFIED: scripts/check-banned-claims.ts:1560]`. Plan it as: commit 1 adds the named part and bumps both counts (watched RED: "is a NAMED member … and does not exist"); commit 2 writes the page (GREEN). `docs/` is otherwise excluded by name from the banned-claims scan (`"**/docs/"` exemption, `[VERIFIED: scripts/check-banned-claims.ts:717-927]`), so membership must go through the corpus part. Verify that `docs/GUARANTEES.md` reached both gates this way before copying the pattern.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Skills only in `.claude/skills/` | Cross-host `.agents/skills/` (Codex, Antigravity, OpenCode, Copilot, Pi) | 2026 (per each host's docs) | One project dir reaches five hosts. Claude Code's docs name no `.agents` path (no observation of support). |
| Antigravity under `~/.gemini/antigravity/skills/` | `~/.gemini/config/skills/` (all surfaces); `~/.gemini/antigravity-cli/skills/` CLI only; old path IDE-legacy | per antigravity.google/docs/skills (2026-11-16) | The doctor's user dir for Antigravity is under `~/.gemini`, not `~/.agents` |
| Skill `allowed-tools` treated as a blanket allow | Per-turn grant ("clears when you send your next message"); ignored under `allowManagedPermissionRulesOnly` (v2.1.282+) | Claude Code v2.1.x | Narrower than the Pitfall 18 worry; ask/deny still win (probe above) |

**Deprecated/outdated:**
- `.planning/research/FEATURES.md` §0.2 says superpowers 7.0.0 under `claude-plugins-official`. Current: 7.0.2 @ `22f0b463…`, installed here via `anthropic-plugin-directory`.
- FEATURES §0.4 gives ui-ux-pro-max as "138k stars, pushed 2026-10-15". Current: 150k, pushed 2026-11-16, latest tag v2.15.0.

## Evaluation evidence (preliminary input for `42-EVALUATION.md`; not verdicts)

| Candidate | Merge | Branching | Planning authority | Telemetry | Network | Runtime deps | Shape note |
|---|---|---|---|---|---|---|---|
| superpowers (whole) | `finishing-a-development-branch` offers merge (FEATURES/PITFALLS 16) | `using-git-worktrees` creates branches | `SessionStart` hook injects `using-superpowers` (1% rule); `writing-plans`, `brainstorming`, `subagent-driven-development`, `requesting-code-review` ("Dispatch a code reviewer subagent") | Brainstorming visual companion loads a logo from the vendor site with the version, opt-out via `SUPERPOWERS_DISABLE_TELEMETRY`, `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` `[VERIFIED: README.md:398-400; skills/brainstorming/scripts/server.cjs:107-112]` | Same | bash hook (`run-hook.cmd`), Node server for brainstorming | Whole-plugin install (Pitfall 2) |
| superpowers sub-skills likely to pass alone | `systematic-debugging` (9,530 B), `verification-before-completion` (3,646 B), `receiving-code-review` (6,203 B): no git writes, dispatch or network in the text `[VERIFIED: grep]`. `test-driven-development` (9,578 B) says "Write code before the test? Delete it. Start over." Judge whether that is technique or a process conflict with the engineer's red-green loop. | | | | | | Still installs the whole plugin |
| frontend-design | none | none | Two-pass design plan inside its own output; no artifacts or commits | none | none | none (one 9,390 B SKILL.md, Apache-2.0) `[VERIFIED: local]` | Auto-updates by default (official marketplace) |
| ui-ux-pro-max (sub-skill) | none | none | Tells the agent to `--persist`; handled by D-18 and the precedence line | none found in `scripts/{search,core,design_system,reasoning_contract}.py` imports | none in the search path (stdlib imports only) `[VERIFIED: import lines @ v2.15.0]`. `validate_data.py` imports `urllib.parse` (parsing only) | **Python 3** (SKILL.md: "Requires Python 3.x, no external dependencies") | Plugin bundles 6 more skills |
| ui-ux-pro-max (whole plugin) | — | — | `brand`, `design`, `slides` and others add more process surfaces | — | `design/references/icon-design.md` documents `GEMINI_API_KEY` + `pip install google-genai`; `design-system/scripts/fetch-background.py` lists pexels image URLs `[VERIFIED: grep @ v2.15.0]` | `ui-styling` needs Node 18+ / `npx shadcn` (its requirements.txt comment) | |
| code-simplifier | — | — | "operate[s] autonomously and proactively" (FEATURES §0.3) | — | — | `model: opus` agent | **Not a skill** |
| commit-commands | stops at the PR (fits) | `commit-push-pr` creates a branch | skips `_commit-convention.md` | — | `git push`, `gh pr create` | `gh` | **Not a skill**; `allowed-tools` pre-approves push |
| feature-dev | — | — | 7-phase pipeline duplicating BA→SA→Architect→Engineer→QE; parallel agents | — | reviewer has `WebFetch, WebSearch` tools | — | **Not a skill** |

The executor must re-read each source **at the SHA it pins** (D-12) and quote the evidence. This table was built from the local cache and the v2.15.0 tarball, and it is a starting map, not the record.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | In interactive mode, a matching ask rule prompts even when a skill's `allowed-tools` lists the command (only `-p` was probed) | Code Examples | Low. It matches the documented order. If wrong, the speed bump is weaker interactively, and the git host still holds. |
| A2 | Host home overrides (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `COPILOT_HOME`, `OPENCODE_CONFIG_DIR`/`XDG_CONFIG_HOME`, `PI_CODING_AGENT_DIR`) move each host's user skill dir | Per-host table | Medium: false advisories on machines that set them. Mitigation: "cannot check" when set. |
| A3 | Node refuses to spawn `claude.cmd` without a shell on Windows; native `claude.exe` works | `claude --version` probe | Low: the outcome is "cannot check", never a wrong verdict |
| A4 | A scoped `Skill(<name>)` entry is or is not valid in a subagent `tools:` line | Pitfall 1 | High if option (b) is chosen. Verify before planning (b). |
| A5 | anthropics/skills (or another non-plugin source) offers frontend-design for non-Claude hosts | not used in recommendations | Low. Docs should say other hosts are `UNKNOWN - verify` unless verified. |
| A6 | Subagents with `Skill` in `tools` see the same skill listing as the main thread (the docs only say they "can still discover and invoke") | Pitfall 1 | Medium for option (b) |

## Open Questions

1. **Does SKILL-04 need to hold in Claude Code spawn mode?** (Pitfall 1)
   - What we know: role adapters lack `Skill`, and the docs say that blocks skill invocation.
   - What's unclear: whether the human accepts fallback-only in spawn mode, or authorizes a grant change.
   - Recommendation: put it to the D-15 checkpoint as a requirement-vs-architecture conflict. CONTEXT's own rule applies: "surface that to the human … not quietly drop it".
2. **Label for uncounted advisory lines** (`WARN` per the D-26 example vs a new label). Recommendation: a new label such as `advisory`, recorded as a discretion choice.
3. **Can any superpowers sub-skill be recommended, given the install unit?** This is the evaluation's call (Pitfall 2), so the human decides.
4. **Should `docs/skills.md` name the npm `ui-ux-pro-max-cli` path** (SUS: no repository field, version mismatch) or only the Claude Code marketplace path plus a manual `.agents/skills/` copy? This is for the human checkpoint.
5. **Byte ceilings for designer.md and any role that gets a section.** Trim into WF14, or re-baseline by a named human? Measure after drafting.
6. **Should the AGENTS.md precedence line get a claim-registry anchor?** It is safety-shaped. Recommendation: yes, `kind: architecture` or `safety`, with the planner deciding the floor mapping.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, tests, installer | ✓ | v26.12.1 locally (CI floor 22+) | — |
| `claude` CLI | D-27 probe tests (use a fake binary), evaluation evidence | ✓ | 2.1.325 | fake `claude` script on a scratch PATH in tests |
| `gh` CLI | reading pins / SHAs for 42-EVALUATION.md | ✓ | authenticated (api calls succeeded) | GitHub web |
| npm | `npm view` for pins | ✓ | — | — |
| python3 | not needed by grugops (ui-ux-pro-max user runtime only) | ✓ | 3.14.4 | — |
| codex / opencode / copilot / pi / agy | live check of per-host skill listing | ✗ | — | docs-cited only. Live runs are human `UNKNOWN - verify` items. |

**Missing dependencies with no fallback:** none for the phase's code. Live per-host verification is human-only.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (dev dep), tests beside sources (`install/*.test.ts`, `scripts/*.test.ts`) |
| Config file | vitest defaults + `tsconfig.tests.json` (typecheck) |
| Quick run command | `npx vitest run install/<file>.test.ts scripts/<file>.test.ts` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (over 600 s; `/tmp` EDQUOT can give false failures, so compare by test name against a baseline) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKILL-01 | Every shipped role's `skills:` admits through `roleSkillsOf`. Declared names ⊆ the ratified set recorded in one place, with the count derived. `## Skills` sits between Responsibilities and Output. Size guards stay green. | unit + guard | `npx vitest run scripts/canonical-frontmatter.test.ts` · `node scripts/check-role-rules.js` · `node scripts/check-foundation-guards.js` | partly (new cases ❌) |
| SKILL-01 | The protocol keeps `## The 5 steps`, and the skills line sits under step 2 | unit | `npx vitest run scripts/flow-guidance-text.test.ts` | ✅ (extend) |
| SKILL-01 | No generated adapter carries `skills:` (39 D-28) | unit | `npx vitest run scripts/generate-role-adapters.test.ts` | ✅ |
| SKILL-02 | `42-EVALUATION.md` exists, names all six, has a row per floor per candidate, and names both revisit triggers | doc check (manual or a small test) | grep / human review | ❌ |
| SKILL-03 | The precedence line appears exactly once in the kit and roles/docs only point to it. `docs/skills.md` is in both claim gates. No "latest" in pins. | unit + gate | `node scripts/check-banned-claims.js` · `node scripts/check-public-docs-vocabulary.js` · new derived-occurrence test | ❌ |
| SKILL-04 | `design-system/` rule only in `designer.md` + WF14; "never write" wording present | unit | new test or extend `check-role-rules` | ❌ |
| SKILL-05 | The doctor prints one advisory line per missing skill per installed host and leaves exit 0 and `--strict` unchanged. Unknown host path → "cannot check". Plugin skill found via `installed_plugins.json` + `plugin.json` `skills` (ui-ux-pro-max layout). `claude --version` below/at/above 2.1.293, unparsable, absent. The fs census is unchanged (installs nothing). | integration (spawned install.js, scratch HOME/PATH) | `npx vitest run install/<new>-skills-doctor.test.ts install/installer-fs-census.test.ts install/kit-route.test.ts` | ❌ |

### Sampling Rate
- **Per task commit:** the targeted vitest files plus the relevant `node scripts/check-*.js` gate.
- **Per wave merge:** `npm run build && npm run typecheck`, the freshness gates (`npm run freshness:adapters`, `check:build-parity`), and all `install/*doctor*`/kit-route tests.
- **Phase gate:** the full suite compared by name against the pre-phase baseline before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `install/skills-doctor.test.ts` (name is planner's choice): scratch `home`, scratch `PATH` with a fake `claude`, a fake `installed_plugins.json` and plugin dirs for both the `skills/` and `./.claude/skills/` layouts.
- [ ] A test fixture role set with declared skills, so the doctor tests do not depend on which shipped roles end up declaring skills.
- [ ] A derived single-occurrence test for the AGENTS.md precedence line.
- [ ] A host-table ↔ `HOST_TOOLS` two-way pin.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | yes | Floors judged per install unit. The git host is the floor. grugops never installs or vendors. |
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | No new grant without a recorded decision (D-08). Spawn grants stay with the coordinator. |
| V5 Input Validation | yes | `installed_plugins.json` and `plugin.json` are untrusted user-home JSON. Use a bounded read (`readUserFile`), shape checks, fail-closed to "cannot check", containment of manifest `skills` paths (no `..`), and kebab-validated skill names only in path joins. |
| V6 Cryptography | no | — |
| V10 Malicious Code (supply chain) | yes | Tag + SHA pins. A "third-party code you vet yourself" notice. Auto-update defaults stated. No `latest`. Re-evaluation triggers (D-16). |
| V12 Files and Resources | yes | The doctor only stats and reads, and writes nothing (fs census test). |
| V14 Configuration | yes | `allowed-tools` vs ask rules (verified); Copilot honors `allowed-tools` with no grugops rules. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A planted `claude` earlier on PATH runs when the doctor runs | Elevation / Tampering | Run only when Claude Code is installed. Exec form, no shell, short timeout, stdin ignored, output parsed strictly, never echoed raw beyond one bounded line. Document it in the threat model. |
| A skill's `allowed-tools` pre-approves `git push` / deploy | Elevation | The ask rule wins on Claude Code (probe). On other hosts, the git host floor. Do not recommend skills that carry `allowed-tools` without recording this. |
| Upstream skill changes after evaluation (auto-update, semantic-release) | Tampering | Pin tag + SHA. Tell users that official-marketplace auto-update is on by default. D-16 triggers. |
| A skill steers process (planning, branching, merge) | Tampering / Repudiation | One AGENTS.md precedence line. Role hard limits. The whole-plugin evaluation. |
| A false "skill used" claim | Repudiation | D-05/D-07 record line. Never claim a skill ran. |
| Path traversal via the manifest `skills` value | Tampering | Containment check against `installPath`. Reject `..` and absolute paths. |
| `installed_plugins.json` as a symlink, FIFO or huge file | DoS | `readUserFile` bounded read (DC-3). |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `scripts/canonical-frontmatter.ts:940-1001`, `install/install.ts` (1470-1560, 2418-2530, 2990-3070, 395-416, 800-845, 4830-4925, 8705), `install/host-tools.ts:240-479`, `install/checkpoint-ask-rules.ts:1-108`, `scripts/check-foundation-guards.ts:3490-3672`, `scripts/check-role-rules.ts:830-850`, `scripts/validate-agent-factory.ts:365-412`, `scripts/check-public-docs-vocabulary.ts:415-593`, `install/installer-paths.test-support.ts:392-410`, `install/kit-route.test.ts:845-900`, the roles `designer.md`, `frontend-ui.md` and `_role-switch-protocol.md`, WF14, `AGENTS.md`, `.claude/agents/*.md` tools lines.
- The live probe on Claude Code 2.1.325 (four runs, outputs quoted above).
- Local plugin sources: superpowers 7.0.2 cache; claude-plugins-official clone (code-simplifier, commit-commands, feature-dev, frontend-design); ui-ux-pro-max tarball @ v2.15.0 (`a38d04c`).
- code.claude.com/docs/en/skills, /permissions, /sub-agents, /plugins/loading, /plugins/install, /plugins/manifest-reference (retrieved 2026-11-16).

### Secondary (MEDIUM confidence; vendor docs, no live run)
- learn.chatgpt.com/docs/build-skills (Codex), antigravity.google/docs/skills/, opencode.ai/docs/skills/, docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills, github.com/earendil-works/pi packages/coding-agent/docs/{skills,configuration,settings}.md, docs.pi.dev/latest/skills (all retrieved 2026-11-16).
- gh api / npm view for tags, SHAs, licenses and publish dates (2026-11-16).

### Tertiary (LOW confidence)
- Web search summaries for Pi and Copilot paths (cross-checked against the primary pages above where possible).

## Metadata

**Confidence breakdown:**
- Standard stack / candidates: HIGH. Sources were read locally and through the GitHub API.
- Architecture (doctor, reader spawn, table): HIGH for the constraints, MEDIUM for the design choices.
- Per-host paths: MEDIUM. Docs-cited; only Claude Code was run.
- Permission order: HIGH for Claude Code `-p` (probe plus documented order), ASSUMED for interactive mode.
- Pitfalls: HIGH. Each is tied to a file and line read this session.

**Research date:** 2026-11-16
**Valid until:** 2026-12-16 for the Claude Code and repo facts. About 7 days for the third-party versions and pins: ui-ux-pro-max was pushed the day of research, and the official marketplace auto-updates.
