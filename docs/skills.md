# Third-party skills

A skill is a folder with a `SKILL.md` file that a coding agent can load for a task. grugops recommends no third-party skill, and no grugops role declares one.

## Read this first

Any skill you install is third-party code you vet yourself. grugops never vendors or installs a skill, and `install.js --check` only reports a declared skill it cannot find.

A skill can pre-approve tools for itself. Whatever a skill pre-approves, branch protection on your git host stays the hard floor.

The kit's `AGENTS.md` has one line that says which rules win over a skill's text; read it there. An install never writes over a repository's own `AGENTS.md`, so in a repository that already had one, that line is absent unless you add it.

## Recommended skills

grugops recommends no third-party skill.

A maintainer reviewed six candidates against grugops's rules for merging, branching, planning, telemetry, network use and runtime needs, and declined the four skills the review proposed, for security, complexity, performance and licensing reasons. The review, its evidence and the versions it read are recorded in [`.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`](../.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md).

## How a role declares a skill

A role names a skill on one `skills:` line in its frontmatter, by the skill's folder name, for example `skills: example-skill`. Only a skill that passes the evaluation and that a maintainer ratifies is declared.

The role then carries a `## Skills` section with one row per skill, under the header `| Situation | Skill | Without it |`. The last cell is the role's own rule for when the skill is absent.

A role uses a skill only when the host lists it, and otherwise takes that fallback at once. When a row applies, the role's note says `used <skill>` or `<skill> not available; used fallback`, and the role's rule is `Never claim a skill ran.`

A `skills:` line adds no tool to a role. On Claude Code, a role spawned as its own agent has no `Skill` tool, so it always takes the fallback.

## Where each host looks for skills

| Host | Project folders | User folders | Plugin installs | May be moved by |
|---|---|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | each plugin in Claude Code's installed-plugin record | `CLAUDE_CONFIG_DIR` |
| Codex CLI | `.agents/skills/` | `~/.agents/skills/` | `UNKNOWN - verify` | `CODEX_HOME` |
| Antigravity CLI | `.agents/skills/`, `.agent/skills/` | `~/.gemini/config/skills/`, `~/.gemini/antigravity-cli/skills/`, `~/.gemini/skills/` | the `skills/` folder of each plugin under `~/.gemini/config/plugins/` | none |
| OpenCode | `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | `UNKNOWN - verify` | `OPENCODE_CONFIG_DIR`, `XDG_CONFIG_HOME` |
| GitHub Copilot CLI | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `~/.copilot/skills/`, `~/.agents/skills/` | `UNKNOWN - verify` | `COPILOT_HOME` |
| Pi | `.pi/skills/`, `.agents/skills/` | `~/.pi/agent/skills/`, `~/.agents/skills/` | `UNKNOWN - verify` | `PI_CODING_AGENT_DIR` |

Each row comes from that host's documentation, read on 2026-11-16, and is the same list `install.js --check` reads. Project folders are relative to the repository root and user folders to your home directory. No host other than Claude Code was run, so on the others a live run that lists a skill from these folders is `UNKNOWN - verify`, and that the variables in the last column move the user folders is an assumption from the documentation.

## What install.js --check does

For each installed agent, `install.js --check` reads the skills the kit's roles declare and looks for `<folder>/<skill>/SKILL.md` in that host's folders from the table above. A skill it finds gives an `ok` line. A skill it cannot find gives an `advisory` line that names the skill, the roles that declare it and the host. A place it cannot see, such as a user folder that one of the listed variables may move, gives an `advisory` line that says `not checked` and why.

Found means a `SKILL.md` file is there, not that the host loads it. These lines never change the exit code, `--strict` does not promote them, and `--check` installs nothing. When no role declares a skill, as today, it prints no skill line.

## Design-system files

The Designer and Frontend/UI read design-system files in your repository, such as token, theme or style-guide files, and never write them. When those files and the Designer's notes disagree, the files win, and the Designer records the conflict in a note for you. If a skill you install offers to write such files, run that step yourself.

## How these were chosen

The record `.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md` names the six candidates, the six checks, the evidence and the exact versions it read on 2026-11-16. It is reopened only when someone asks to bump an evaluated skill to a newer version, or when an upstream security advisory names an evaluated skill.
