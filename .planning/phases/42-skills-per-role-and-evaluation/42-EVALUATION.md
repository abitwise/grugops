# [v3.0, Phase 42] Third-party skills: evaluation against grugops's floors

**Recorded:** 2026-11-16 · **Requirement:** SKILL-02 · **Pins read on:** 2026-11-16 (with `gh api` and `npm view`; sources read as data at the pinned commit, never run)

## Decision

Task 3 of plan 42-01 writes this paragraph last, once every candidate has a verdict.

## Floors

A candidate or sub-skill passes a floor only when its text and files, read at the pinned commit, meet the rule below. Each floor is pass or fail on its own; there is no partial pass. A floor that cannot be read is `UNKNOWN - verify`, and an `UNKNOWN - verify` floor is not a pass.

- **Merge:** the text never merges, or offers to merge, a branch.
- **Branching:** the text never creates, switches or deletes a branch or worktree.
- **Planning authority:** the text never writes planning artifacts, sets commit cadence, dispatches agents, or claims precedence over the host's or grugops's process, including through a hook that injects text into every session.
- **Telemetry:** nothing sends usage or identity data anywhere.
- **Network:** nothing in the skill's run path opens a network connection (fetch, curl, an API key, a remote image) during normal use.
- **Runtime deps:** anything the skill needs at run time beyond the host CLI (Python 3, Node, `gh`, `npx`) is named. "None" passes. A named runtime is recorded and judged against grugops's zero-runtime-deps posture for the user's machine.

A candidate or sub-skill that passes all six floors is **recommendable**. Nothing is **recommended** until a named human ratifies it in plan 42-04 (D-15).

**Cell format.** A floor cell reads `pass`, `fail` or `UNKNOWN - verify`, then a short quote in backticks and `path@<first 12 hex of the SHA>:line`. Where a pass rests on the absence of any matching line, the cell names the search and the files it covered, because an absence cannot be quoted. The full SHA appears once per candidate, in § Candidates and pins.

## Candidates and pins

The six candidates are the SKILL-02 names, in the SKILL-02 order, and no others (D-10). Every pin was read on 2026-11-16. A source that moves after that date does not change this record until a trigger in § Revisit triggers fires.

| Candidate | Shape | Source and license | Pin | Pin read on | Install unit |
|---|---|---|---|---|---|
| superpowers | Plugin: 15 skill directories under `skills/`, a `SessionStart` hook (`hooks/hooks.json`, `hooks/session-start`, `run-hook.cmd`), and plugin manifests for several hosts | github.com/obra/superpowers, MIT (`gh api repos/obra/superpowers` → `MIT`; `LICENSE@22f0b463e7a5:1` `MIT License`) | tag `v7.0.2` @ `22f0b463e7a5e579904dd6211a520321035526f7` (annotated tag object `c62ffea8267a70de07583e153544d355b6748a56` dereferenced to that commit with `gh api repos/obra/superpowers/git/tags/<object>`). `.claude-plugin/plugin.json@22f0b463e7a5:4` `"version": "7.0.2"`. The `claude-plugins-official` marketplace entry pins the same commit: `"source": "url"`, `"sha": "22f0b463e7a5e579904dd6211a520321035526f7"`. The local plugin cache `superpowers/7.0.2-22f0b463e7a5/` matches the tag tarball byte for byte (`diff -r`). | 2026-11-16 | Whole plugin, per host. Claude Code: `/plugin install superpowers@claude-plugins-official` (`README.md@22f0b463e7a5:65`). Antigravity CLI: `agy plugin install https://github.com/obra/superpowers` (`README.md@22f0b463e7a5:89`, no ref). Copilot CLI: `copilot plugin install superpowers@superpowers-marketplace` (`README.md@22f0b463e7a5:185`). Codex CLI: the openai/plugins marketplace (`README.md@22f0b463e7a5:106`). OpenCode: "Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md" (`README.md@22f0b463e7a5:232`, follows `main`, not a pin). Pi: `pi install git:github.com/obra/superpowers` (`README.md@22f0b463e7a5:242`, no ref). Plugin skills cannot be turned off one at a time on Claude Code (42-RESEARCH § Pitfall 2, citing code.claude.com/docs/en/skills). |
| code-simplifier | Plugin: one agent file (`agents/code-simplifier.md`). No `SKILL.md`. | anthropics/claude-plugins-official, Apache-2.0 (`gh api repos/anthropics/claude-plugins-official` → `Apache-2.0`) | plugin version `1.0.0` (`plugins/code-simplifier/.claude-plugin/plugin.json`) @ `aecd4c852f10b466245f18383fa6aad8c0b10d57`, the latest commit touching `plugins/code-simplifier` (committed 2026-02-20); no tag: the repository has none (`gh api repos/anthropics/claude-plugins-official/tags` → 0 entries). | 2026-11-16 | Whole plugin. Claude Code: `/plugin install code-simplifier@claude-plugins-official`. No other host route named. Not a skill (§ Shape findings). |
| feature-dev | Plugin: one command (`commands/feature-dev.md`) and three agents (`agents/code-architect.md`, `code-explorer.md`, `code-reviewer.md`). No `SKILL.md`. | anthropics/claude-plugins-official, Apache-2.0 | plugin version `1.0.1` (`plugins/feature-dev/.claude-plugin/plugin.json`) @ `30202c767cfaf325212b3921ab484f83adaec850`, the latest commit touching `plugins/feature-dev` (committed 2026-10-26); no tag: the repository has none. | 2026-11-16 | Whole plugin. Claude Code: `/plugin install feature-dev@claude-plugins-official`. No other host route named. Not a skill (§ Shape findings). |
| commit-commands | Plugin: three commands (`commands/commit.md`, `commit-push-pr.md`, `clean_gone.md`). No `SKILL.md`. | anthropics/claude-plugins-official, Apache-2.0 | plugin version `1.0.1` (`plugins/commit-commands/.claude-plugin/plugin.json`) @ `30202c767cfaf325212b3921ab484f83adaec850`, the latest commit touching `plugins/commit-commands` (committed 2026-10-26); no tag: the repository has none. | 2026-11-16 | Whole plugin. Claude Code: `/plugin install commit-commands@claude-plugins-official`. No other host route named. Not a skill (§ Shape findings). |
| frontend-design | Plugin: one skill (`skills/frontend-design/SKILL.md`, 9,390 B), plus `plugin.json`, `README.md`, `LICENSE` and the skill's `LICENSE.txt`. No hooks, agents, commands or scripts. | anthropics/claude-plugins-official, Apache-2.0 (`plugins/frontend-design/LICENSE@30202c767cfa:2` `Apache License`; `skills/frontend-design/SKILL.md@30202c767cfa:4` `license: Complete terms in LICENSE.txt`) | plugin version `1.1.1` (`plugins/frontend-design/.claude-plugin/plugin.json@30202c767cfa:4` `"version": "1.1.1"`) @ `30202c767cfaf325212b3921ab484f83adaec850`, the latest commit touching `plugins/frontend-design` (committed 2026-10-26); no tag: the repository has none, so D-12's tag is unavailable and the pin is the plugin version plus the SHA. | 2026-11-16 | Whole plugin, which is this one skill. Claude Code: `/plugin install frontend-design@claude-plugins-official`. The official marketplace auto-updates by default ("On by default: `claude-plugins-official` and the other official marketplace names", 42-RESEARCH § Pinning mechanics, citing code.claude.com/docs/en/plugins/install), so an installed copy moves past this pin unless the user turns auto-update off. Other hosts: `UNKNOWN - verify` (no route read). |
| ui-ux-pro-max | Plugin: seven skills under `.claude/skills/` (`banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`, `ui-ux-pro-max`). Manifest key `"skills": "./.claude/skills/"` (`.claude-plugin/plugin.json@a38d04c3d5c2:20`). Also ships a CLI (`cli/`). | github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT (`gh api` → `MIT`; `LICENSE@a38d04c3d5c2:1` `MIT License`) | tag `v2.15.0` @ `a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5` (lightweight tag; `gh api .../git/ref/tags/v2.15.0` → that commit). **Manifest version differs from the tag and is recorded as read, not reconciled:** `.claude-plugin/plugin.json@a38d04c3d5c2:4` `"version": "2.13.0"`, `.claude-plugin/marketplace.json@a38d04c3d5c2:9` and `:16` `"version": "2.13.0"`. `cli/package.json@a38d04c3d5c2:3` `"version": "2.5.0"`. npm `ui-ux-pro-max-cli`: `version` `2.15.0` (dist-tag `latest`, published 2026-08-13T17:10:39Z); the `repository` field is absent from `npm view ui-ux-pro-max-cli version repository --json`. `main` was at `e59ff376a41f7ca47b7541ad5c116495cbade3ee` (pushed 2026-11-16T04:10:04Z); this record pins the tag, not `main`. | 2026-11-16 | Whole plugin on Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill#v2.15.0`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` (marketplace name: `.claude-plugin/marketplace.json@a38d04c3d5c2:2` `"name": "ui-ux-pro-max-skill"`); the installed version displays as `2.13.0`. Other hosts: the npm CLI, `uipro init --ai <host>`; its targets are `.claude/skills/`, `.agents/skills/` (codex, antigravity, universal), `.github/prompts/` (copilot) and `.opencode/skills/` (`cli/src/utils/detect.ts@a38d04c3d5c2:96`, `:102`, `:104`, `:108`, `:118`, `:134`). |

## Whole-plugin matrix

Each row judges the install unit: everything a user gets when they install the candidate, not one `SKILL.md` (D-09). Task 2 of plan 42-01 fills the superpowers, code-simplifier, feature-dev and commit-commands rows; Task 3 fills the ui-ux-pro-max row.

| Candidate | Merge | Branching | Planning authority | Telemetry | Network | Runtime deps | Shape note | Verdict |
|---|---|---|---|---|---|---|---|---|
| frontend-design | `pass` no match for `merge`, `branch`, `worktree` or `git ` in any of the plugin's five files (`plugins/frontend-design/**@30202c767cfa`) | `pass` same search, no match; the skill writes only the page it is asked to build (`skills/frontend-design/SKILL.md@30202c767cfa:53` `Only after you've confirmed the relative uniqueness of your design plan should you start to write the code`) | `pass` its "plan" is a design plan inside its own answer, not a planning artifact, commit or dispatch: `First, brainstorm a short design plan based on the client's design brief` (`skills/frontend-design/SKILL.md@30202c767cfa:47`). No hook, agent or command file exists in the plugin. It also says the brief wins: `the brief's own words always win` (`:45`) | `pass` no match for `telemetry`, `http`, `fetch`, `curl` or an API key in `SKILL.md` or `plugin.json` (`plugins/frontend-design/**@30202c767cfa`) | `pass` no URL or network call in the run path (`SKILL.md`); the only URL is a documentation link in the README, which the host does not load as skill text: `See the [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/...)` (`plugins/frontend-design/README.md@30202c767cfa:26`) | `pass` none: the plugin is markdown and JSON only (`plugin.json`, `README.md`, `LICENSE`, `skills/frontend-design/SKILL.md`, `LICENSE.txt`) | A skill: `skills/frontend-design/SKILL.md`, frontmatter `name: frontend-design` (`:2`). No `allowed-tools` in its frontmatter (`:1-5`). Official marketplace: auto-update on by default | **Recommendable** (all six floors pass). Not recommended until 42-04 ratifies it. |
| superpowers | Task 2 fills this row. | | | | | | | |
| code-simplifier | Task 2 fills this row. | | | | | | | |
| feature-dev | Task 2 fills this row. | | | | | | | |
| commit-commands | Task 2 fills this row. | | | | | | | |
| ui-ux-pro-max | Task 3 fills this row. | | | | | | | |

Two lines in frontend-design were weighed and judged technique, not process. `If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint` (`SKILL.md@30202c767cfa:13`) reads memory and writes nothing. `if you have a space to quickly jot down notes about what you've tried, it can help you in future passes` (`:59`) is conditional and names no file; under the precedence line (D-14) the role's own note is that space, and the skill creates no artifact of its own.

## Per-sub-skill matrix

One table per plugin that ships skills. A sub-skill is "passes alone" only when all six floors pass on its own text. "What the install unit adds" is what installing the whole plugin brings along with the sub-skill (D-09). Rows are sorted by sub-skill directory name. Task 2 of plan 42-01 adds the superpowers table; Task 3 adds the ui-ux-pro-max table.

### frontend-design (pin `30202c767cfa`)

| Sub-skill | Merge | Branching | Planning authority | Telemetry | Network | Runtime deps | allowed-tools | Verdict alone | What the install unit adds |
|---|---|---|---|---|---|---|---|---|---|
| frontend-design | `pass` no match for `merge`, `branch` or `git ` (`skills/frontend-design/SKILL.md@30202c767cfa`) | `pass` same search, no match | `pass` `Work in two passes. First, brainstorm a short design plan` (`:47`), a plan inside its own answer | `pass` no match for `telemetry`, `http`, `fetch` or `curl` | `pass` no URL in the file | `pass` none | none (frontmatter `:1-5` holds `name`, `description`, `license` only) | **Passes alone** | Nothing else: the plugin is this one skill. The install brings official-marketplace auto-update, on by default. |

## Shape findings

Task 2 of plan 42-01 fills this section (code-simplifier, commit-commands, feature-dev).

## allowed-tools and the ask rules

Task 3 of plan 42-01 fills this section.

## Proposed recommendations

Task 3 of plan 42-01 fills this section.

## Requirement conflicts

Task 3 of plan 42-01 fills this section.

## Revisit triggers

Task 3 of plan 42-01 fills this section.

## Ratification

Task 3 of plan 42-01 fills this section.
