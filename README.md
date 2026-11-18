```text
          ____ ______ __  ______ ____  ____  _____       (
         / __ `/ ___/ / / / __ `/ __ \/ __ \/ ___/      )\
    ____/ /_/ / /  / /_/ / /_/ / /_/ / /_/ (__  )    ( /  )
   /____\__, /_/   \__,_/\__, /\____/ .___/____/      /   (
       /____/           /____/     /_/              (  /\  )
                                                     \/  \/
```

<!-- claim: C-28-069 -->
# grugops — Specialist agents. Shared context. Coordinated work.

<!-- claim: C-28-070 -->
grugops gives the coding agent you already use a team of specialist roles for software delivery. One Orchestrator splits each request into subtasks on a shared queue and claims each one for a role agent, which does one job within hard limits and publishes what it found as notes to a shared verified context. A quality gate checks the work and makes a recommendation, and the workflows stop at a pull request and leave merge and deploy to a person. The roles, workflows, board and trace are plain markdown files you can read and diff.

## Quickstart

<!-- claim: C-28-004 -->
grugops version `2.2.0`.

<!-- claim: C-28-005 -->
1. **Install** — clone grugops once, then run its idempotent, additive, reversible installer (Node 22+) against the project you want it in:

   ```bash
   git clone https://github.com/abitwise/grugops.git ~/grugops
   node ~/grugops/install/install.js --target /path/to/your-project
   ```

   From inside the project you can drop `--target`. The installer refuses to install into the grugops checkout itself. The shared kit lands in `~/.grugops`; your project gets only per-repo state.

<!-- claim: C-28-006 -->
   The installer never overwrites or deletes your content; re-running it is safe, and `node ~/grugops/install/uninstall.js --target /path/to/your-project` removes only what was added. Set `DRY_RUN=1` to preview the changes first.

2. **Drive it** — start a session in your coding agent; what to type on each host is the start table in [docs/usage.md](docs/usage.md#start-a-session), and every flag is in [install/README.md](install/README.md).

## How it works

- [You make a request](docs/how-it-works.md#you-make-a-request) in the coding agent you already use.
- [The Orchestrator splits it](docs/how-it-works.md#the-orchestrator-splits-the-request) into subtasks on a [shared queue](docs/how-it-works.md#the-queue-and-claims).
- [Role agents do one job each and publish notes](docs/how-it-works.md#role-agents-publish-notes) to the shared verified context.
- [A gate checks the work](docs/how-it-works.md#the-gate-recommends) and makes a recommendation.
- [A person decides on merge and deploy](docs/how-it-works.md#a-person-merges-and-deploys).

## Where to go next

- [The core concept](docs/concepts.md): the ideas behind the kit.
- [How grugops works](docs/how-it-works.md): one request, step by step.
- [Usage](docs/usage.md): start a session and get each job done.
- [Reference](docs/reference/README.md): every role, workflow and skill.
- [Install guide](install/README.md): every installer flag.

## Safety guarantees

<!-- generated: guarantees-pointer -->
Which safety claims still hold on this repository, joined to the live checkpoint matrix: [`docs/GUARANTEES.md`](docs/GUARANTEES.md).

## Changelog

<!-- claim: C-28-009 -->
The release history lives in [`CHANGELOG.md`](CHANGELOG.md) and follows Keep a Changelog.

## Acknowledgements

grugops is inspired by **The Grug Brained Developer** (https://grugbrain.dev) by Carson Gross —
the philosophy of fighting complexity with simplicity. grugops is an independent project and is
not affiliated with or endorsed by the author; we simply stand in that lineage. Thank you, grug.

---

_grugops is an independent, open-source developer tool. "grugops" uses "grug" in the
software-culture sense (the grug-brained-developer philosophy). grugops is **not affiliated
with, endorsed by, or connected to** the "Grug" children's book series by Ted Prior or its
publishers. All grugops artwork is original._
