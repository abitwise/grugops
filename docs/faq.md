# grugops FAQ

Q: What is grugops?
A: A kit of markdown files that gives the coding agent you already use a team of specialist roles
   for software delivery. One Orchestrator splits each request into subtasks, a role agent does
   each one within hard limits, and the roles share what they find as notes in a shared verified
   context. [The core concept](concepts.md) explains the ideas, and
   [How grugops works](how-it-works.md) follows one request from start to finish.

<!-- claim: C-28-071 -->
Q: How is it different from other agent frameworks?
A: It runs on the coding agent you already use instead of replacing it. Each role is one markdown
   file with one job and hard limits, so you can read the rules an agent was given. Roles do not
   hand data to each other; they read and publish notes in the shared verified context. The board
   and the trace are files in your repository, so you can review them like any other change.

Q: Does it lock me in?
A: The kit is plain markdown built on the AGENTS.md open standard. The installer adds a thin
   adapter for each supported host, listed in the [start table](usage.md#start-a-session), and the
   role text stays in one place. The uninstaller removes what the installer added to your project,
   and your board, tickets and trace stay in your repository as markdown.

<!-- claim: C-28-072 -->
Q: Is it serious enough for enterprise use?
A: It has the parts a regulated team asks for. The config dial's `enterprise` mode runs the release
   and incident workflows, and there are security and compliance roles. A release waits for a named
   person's approval at the default checkpoint setting, and the trace links each requirement to its
   code, tests and release. The role files and workflows tell agents to stop at a pull request and
   to leave merge and deploy to people. Those are written rules, and they hold only as well as an
   agent follows them. The hard floor is your git host: branch protection or rulesets on protected
   branches, and deployment environments with required reviewers for production. For a deploy,
   that floor holds only when every production deploy runs as a job that references the production
   environment and the deploy credentials live solely in that environment:
   a stored deploy secret lives only in its secrets, and an OIDC trust policy
   accepts only tokens whose subject names this repository and that environment.
   grugops never configures your git host; you set those protections yourself.
   [GUARANTEES.md](GUARANTEES.md) shows which safety claims hold in the grugops source checkout at
   its default settings. Your own floors are set in `.grugops/factory.config.json`.

Q: Why "grug"?
A: It's named for *The Grug Brained Developer* (https://grugbrain.dev) by Carson Gross, an essay
   about fighting complexity with simplicity. Each agent is deliberately grug-brained: one job,
   hard limits. grugops is an independent project and is not affiliated with or endorsed by the
   author.

Q: Is grugops connected to the "Grug" children's books?
A: No. grugops is an independent developer tool. It uses "grug" in the software-culture sense
   (the grug-brained-developer meme), and has no affiliation with the children's book series.
