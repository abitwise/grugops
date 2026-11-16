# Third-party skills

A skill is a folder with a `SKILL.md` file that a coding agent can load for a task. grugops recommends no third-party skill, and no grugops role declares one.

## Read this first

Any skill you install is third-party code you vet yourself. grugops never vendors or installs a skill, and `install.js --check` only reports a declared skill it cannot find.

A skill can pre-approve tools for itself. Whatever a skill pre-approves, branch protection on your git host stays the hard floor.

The kit's `AGENTS.md` has one line that says which rules win over a skill's text; read it there. An install never writes over a repository's own `AGENTS.md`, so in a repository that already had one, that line is absent unless you add it.

## Recommended skills

grugops recommends no third-party skill.

A maintainer reviewed six candidates against grugops's rules for merging, branching, planning, telemetry, network use and runtime needs, and declined the four skills the review proposed, for security, complexity, performance and licensing reasons. The review, its evidence and the versions it read are recorded in [`.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`](../.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md).
