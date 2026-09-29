# Installing grugops

grug build factory once. grug not install it five different hard ways. so installing is
plain: there is a floor that needs no scripts at all, and a paved path of idempotent,
reversible installers on top. everything below is additive — grugops never overwrites or
deletes a file you own.

**Version: `2.1.0`.** This is the canonical value in `agent-factory/VERSION`; the Claude Code
plugin mirrors it in `.claude-plugin/plugin.json` and the tooling `package.json` carries the same
string. The three bump together, once per release, and the release tag is `v<MAJOR>.<MINOR>`
(`v2.1` for this version). From 2.1.0 on, grugops follows SemVer: a breaking change bumps MAJOR.

Once grugops is installed, **how you start the session decides what the Orchestrator can
actually do.** The three entry tiers, and what each one really enforces, are §6.

---

## 1. The minimal path — just install the markdown (any tool)

The floor works for every supported tool and needs no script:

1. Copy the portable `AGENTS.md` and the `agent-factory/` folder into your repo.
2. Tell your agent: **"start at `agent-factory/roles/orchestrator.md`."**

That is it. The intelligence lives in the host coding agent; grugops only supplies the role,
the guardrail, the memory, the board, the proof, and the gates — all readable markdown. No
runtime, no service, no database.

---

## 2. The scripted path — per-tool conveniences

grugops ships a single installer, `install/install.js` — a Node program (the compiled output of
`install/install.ts`). **Node 22+ is a prerequisite for the scripted path** (the minimal path in
§1 still needs nothing at all). The installer is **idempotent** (run it twice, nothing changes),
**additive** (it only ever appends behind unique sentinels), and **reversible**. It runs the same
way on every platform Node runs on, including Windows.

The installer uses a **two-root** layout, so the kit and your per-repo state stay cleanly
separated:

- **Shared, read-only kit** → copied once to `${GRUGOPS_HOME:-$HOME/.grugops}` (default
  `~/.grugops`). One kit, shared across every repo you install into.
- **Per-repo, writable state** → seeded into the target repo (`.grugops/factory.config.json`,
  the install marker, `plans/`, and `memory-bank/`).

```sh
# Install into a chosen repo (run from anywhere):
node install/install.js --target /path/to/repo

# Install into the current repo (prompts to confirm the target first):
node install/install.js

# Unattended / CI (take the default target, no prompt):
node install/install.js --yes

# Preview first — prints the plan, changes NOTHING on disk (in either root):
DRY_RUN=1 node install/install.js

# Put the shared kit somewhere other than ~/.grugops:
GRUGOPS_HOME=/opt/grugops node install/install.js --target /path/to/repo
```

### Exit codes — what the installer tells a script

If you chain anything after the installer (`node install/install.js --yes && next-step`, a CI
step, a Makefile), read the exit code. Both `install.js` and `uninstall.js` use the same list:

| Code | Meaning |
|------|---------|
| `0` | **complete** — every class installed (or removed); the run printed `== install complete ==` (or `== uninstall complete ==`). The **non-install modes** exit `0` too, and each prints its **own** closing line rather than the install banner — `--check` on a clean doctor prints `ALL CHECKS PASSED`, `--update` prints `== update complete ==`, `--prune-old-kit` prints `== prune complete ==`, and a `--migrate` on an already-migrated repo reports *nothing was changed*. All four are **`install.js` only**. So do not test for the install banner to decide a run succeeded; test the exit code. |
| `1` | **refused or aborted** — the run changed nothing. The self-checkout guard (the target looks like the grugops source checkout) is the usual cause, and **both binaries implement it**: each writes a refusal to stderr naming `--allow-self`, and neither writes nor removes anything. `--check` also reports `1` on a doctor FAIL — that half is **`install.js` only**, because `uninstall.js` has no doctor mode. |
| `2` | **bad usage** — an unknown argument. Nothing was read or written. |
| `3` | **incomplete** — the run went ahead but could not finish a whole class, and printed `== install INCOMPLETE — N item(s) need verification ==` (`uninstall.js` prints the same line with `uninstall` in place of `install`, and `--prune-old-kit` with `prune`). Every `verify` line in the output names what was left undone and the remedy for it. |

Code `3` is the important one: grug not lie about finish. A run that could not read a source
directory, that refused an adapter (a `models` block the resolver refuses is one way), or that could
not render the adapters at all (a partial checkout missing the modules the render needs is one way),
installed **nothing for that class** — so it does not
claim completion, and it does not return the success code either. A path the installer would write
that is not what it expects is another way: a FIFO, a directory, a device or a symbolic link where a
file goes (a dangling link included), or a regular file, a FIFO or a symbolic link where a directory
goes. That path is skipped with a `verify` line naming it and left exactly as it was, nothing is
written through it, and the rest of the install still runs. **A chained command stops
here.** That is deliberate: proceeding over a partial install is how a broken install reaches
production looking fine. Read the `verify` lines, fix the source, re-run (the installer is
idempotent, so re-running is safe).

Code `1` from `uninstall.js` means the **self-checkout refusal**: the target you named is the
grugops source checkout itself (or a second checkout of it — it carries `install/install.ts` and
`agent-factory/VERSION`). Uninstalling there would delete the kit's own committed adapters and
skills under `.claude/`, which are not wiring the installer added but files the repository ships,
so the run stops before removing anything and writes the reason to stderr. Nothing is printed on
stdout and nothing on disk changes. Almost always the fix is to name the repo you meant
(`--target /path/to/your-repo`); if you genuinely do mean the checkout, pass **`--allow-self`**
(or `--force`) — the same override, spelled the same way, that `install.js` uses.

### Choosing the target (`--target`, the prompt, `--yes`)

Where the install lands is resolved in this precedence: **`--target <repo>`** wins, then the
**`TARGET=` env var**, then a **prompt** (defaulting to the current directory). The `--target`
flag means you can install into any repo from any working directory — you no longer have to
`cd` into the repo first.

When run interactively without `--target`, the installer asks *"Install grugops into which
repo? [<default>]"* and waits for confirmation. For unattended runs (CI, scripts), pass
**`--yes`** (or `-y`) to take the default target without prompting; a non-TTY stdin is treated
the same way, so a piped or redirected invocation never hangs on the prompt.

### Copy by default (symlink is opt-in)

The kit and adapters are **copied** by default. Copy is the only mode that behaves identically
on every platform; the previous symlink default was fragile (links broke when the source clone
moved). Symlinks are still available as an opt-in:

```sh
node install/install.js --symlink --target /path/to/repo
# or:
INSTALL_MODE=symlink node install/install.js --target /path/to/repo
```

### The self-checkout guard (`--allow-self`)

By default the installer **refuses** to install into the grugops source checkout itself — if
the target is the grugops repo (or carries its source markers), it stops and tells you that you
probably meant `--target <your-repo>`. This guard always runs, even under `--yes` or a non-TTY,
because it is a mechanical safety check, not a prompt. If you really do mean to install into the
source checkout, pass **`--allow-self`** (or `--force`) to override it.

### What the installer touches (per-repo), and only this

In the **target repo**:

- `.claude/skills/grugops*/SKILL.md` — the seven standalone skills
- `.claude/agents/grugops-orchestrator.md` — the Orchestrator subagent wrapper
- the two **resolver adapters** (`.claude/skills/grugops/SKILL.md` and the orchestrator
  wrapper) have the resolved absolute kit path **materialized** into them, so `/grugops`
  resolves the shared kit on first run with no path error
- a one-line **start-here** pointer block in `CLAUDE.md` (appended behind a sentinel; your
  existing content is preserved)
- `.gemini/settings.json` — `context.fileName` gains `"AGENTS.md"` (read-modify-write; other
  keys are preserved, never clobbered). A settings file that is not a valid JSON object is left
  untouched and reported as a `verify` finding (exit `3`), by the installer and the uninstaller alike
- `.claude/settings.json` — the Claude Code ask rules described in §5 are added to
  `permissions.ask` (additive; your own rules and keys are kept, and the added rules are recorded
  so uninstall removes exactly those)
- `tools/grugops/` — the kit's runnable checks, including the read-only git-host check
  `tools/grugops/host-protection.js` (§5)
- an optional `.github/copilot-instructions.md` pointer
- **seeded per-repo state** (skip-if-exists, never clobbered): `.grugops/factory.config.json`,
  the `.grugops/install.json` marker, `plans/`, and `memory-bank/`

In the **shared kit root** (`${GRUGOPS_HOME:-$HOME/.grugops}`):

- `agent-factory/` — the read-only kit, copied once and shared across repos

It never overwrites or deletes any file you own. Existing seeded state is left byte-untouched on
re-install (skip-if-exists), and `agent-factory/`, `plans/`, `.planning/`, `docs/`, and `src/`
in your target are never modified beyond the additive edits above.

### Undo

```sh
node install/uninstall.js --target /path/to/repo
# preview the reversal first (read the note below before previewing inside a grugops checkout):
DRY_RUN=1 node install/uninstall.js --target /path/to/repo
```

**The self-checkout guard is always on, and `DRY_RUN=1` does not exempt it.** It is a mechanical
safety check rather than a prompt, so pointing either binary at a target that is a grugops source
checkout — *including the preview above* — **exits `1` and prints nothing at all**. An empty preview
there is the refusal, not a reversal with nothing to undo. To preview a reversal inside a grugops
checkout, add **`--allow-self`** (or `--force`), the same override the installer takes.

`uninstall.js` removes **only** the grugops-owned wiring it added to the target: the skills, the
Orchestrator wrapper, the materialized resolver adapters, the sentinel-delimited `CLAUDE.md` and
Copilot pointer blocks (the rest of those files stays exactly as it was), the `AGENTS.md` entry
it added to the Gemini settings, the Claude Code ask rules it added (§5; a rule you had before
install stays), the runnable checks under `tools/grugops/` that are still byte-identical to what it
wrote, and the `.grugops/install.json` marker.

A file is deleted only on install's own record. Install records in `.grugops/install.json`, as
`createdFiles`, each file it created where nothing was before: `CLAUDE.md` and
`.github/copilot-instructions.md` when it created them to hold its pointer block, the `AGENTS.md`
it copied or linked in, and the runnables under `tools/grugops/`. The uninstaller deletes `CLAUDE.md`
or the Copilot file only when that record lists it, it removed the grugops block from it in this
run, and the file is blank afterwards. It deletes `AGENTS.md` or a runnable only when the record
lists it and it is still the copy (or, for `AGENTS.md`, the link) install made. A file the record
does not list is left in place and reported as `left` with the reason, even when it is blank or
byte-identical to the kit: in a repository you never ran the installer on (for example after the
minimal copy path in §1) nothing is removed. An install made before this release has no file ledger,
so the blank pointer files, `AGENTS.md` and the runnables it created are left and reported; remove
them by hand if you do not want them. A malformed file ledger is a `verify` finding on both sides
(exit `3`), and the uninstaller then deletes none of these files. A `CLAUDE.md` or Copilot file whose
grugops open marker has no close marker on a later line is left exactly as it is and reported.

A symbolic link at one of those paths is removed only when it is exactly the link a `--symlink`
install makes: it points at the kit source file of the checkout you run the uninstaller from. Any
other link (a dangling one, a loop, a link to a device, to a FIFO, or to a file or directory
elsewhere) is left in place, is not followed, and is reported as a `verify` finding (exit `3`);
remove it by hand if it is grugops's. A runnable is never a link, so a link under `tools/grugops/` is
always left. A path is reported `removed` only when it is gone afterwards.

The marker is removed only when the uninstaller could read it as the target's own JSON object and
every ledger in it is well-formed. It is never read through a symbolic link: a link at
`.grugops/install.json`, or a `.grugops` that is itself a link, makes the marker unreadable, so no
ledger from another repository is believed. A marker that cannot be read (not JSON, too large, a
FIFO, a directory, a link) or that holds a malformed ledger is reported as a `verify` finding, is
left in place, and the run exits `3`. `--check` names such a marker as present but unreadable (a
doctor FAIL, exit `1`), not as "not installed".

A `DRY_RUN=1 node install/uninstall.js` preview changes nothing. It names a directory for removal
only when that directory is already empty, so the real run can also remove a grugops directory
that it has just emptied and that the preview did not name.

The uninstaller removes an empty directory only when install created it, which install records in
`.grugops/install.json` as `createdDirs`. A directory's name is not a record: an empty directory
you made yourself, for example `.github/`, `.gemini/` or even `.claude/skills/grugops/`, is left in
place and reported as `left`, in the real run and in the preview. An install made before the
directory ledger has none, so every empty directory it created is left and reported; remove them by
hand if they are empty and you do not want them. If the directory ledger is malformed or the marker
cannot be read, the uninstaller reports a `verify` finding, removes no empty directory, and exits
`3`. `tools/` is always left, even when install created it: a project is likely to use a directory
of that name itself.

It deliberately does **not** touch:

- the **shared kit** at `${GRUGOPS_HOME:-$HOME/.grugops}` — other repos depend on it, so
  removing it is a manual `rm -rf ~/.grugops` you run yourself when you want it gone everywhere
- your **seeded per-repo state** — `.grugops/factory.config.json`, `plans/`, and `memory-bank/`
  become your content once seeded (they may hold real work), so they survive uninstall
- an **empty directory you made yourself** — only a directory install created (recorded as
  `createdDirs` in `.grugops/install.json`) is removed
- a **file install did not create** — a blank `CLAUDE.md` or Copilot file, or a copy of the kit's
  `AGENTS.md` or runnables, is removed only when `createdFiles` records that install created it
- `agent-factory/`, `.planning/`, `docs/`, `src/`, or any file you own

### Migrating an existing install (`--migrate`)

If you installed an **older, single-root grugops** (the v1.0 layout, where the kit was vendored
in-repo under `agent-factory/` and your config lived inside it), `--migrate` moves you to the
current two-root layout safely and reversibly:

```sh
node install/install.js --migrate --target /path/to/repo
# preview the migrate plan first (changes NOTHING on disk):
DRY_RUN=1 node install/install.js --migrate --target /path/to/repo
```

`--migrate` is additive-then-relocate and **never deletes** your content. It:

- backs up the displaced in-repo `agent-factory/` to a timestamped
  `agent-factory.bak.<ISO>` directory (it is renamed aside, never deleted);
- backs up any runtime-accumulated **`plans/handoffs/`** directory — the old delivery relay's
  per-stage handoff files — to a timestamped `plans/handoffs.bak.<ISO>` directory (renamed aside,
  **never deleted and never converted**: the originals are preserved verbatim for you, since the
  current grugops trace is note-native and does not parse the legacy handoff format). If a backup
  of that exact name already exists, `--migrate` **aborts that step and leaves your originals
  untouched** rather than overwrite the existing backup;
- carries your **edited config forward** to `.grugops/factory.config.json` and leaves the
  original in place renamed to `<original>.bak.<ISO>`. Both legacy config locations are handled —
  the in-repo `agent-factory/config/factory.config.json` and a repo-root `factory.config.json`;
- copies the fresh shared kit to `${GRUGOPS_HOME:-$HOME/.grugops}` and materializes the resolver
  adapters, exactly like a normal install (it is orchestration around the same install run).

The `plans/handoffs/` backup runs on **every** `--migrate` (whether your repo is on the old layout
or already on the current two-root layout), because the handoffs dir can accumulate regardless of
layout state. When `plans/handoffs/` is absent it is a clean no-op (`--migrate` reports *nothing to
migrate* and changes nothing).

It is **idempotent and re-run-safe**: running `--migrate` a second time on an already-migrated
repo does nothing. If a stray **live** in-repo `agent-factory/` is left behind after migration,
`--migrate` tells you — and tells you to remove it **by hand** once you have confirmed the shared
kit at `${GRUGOPS_HOME:-$HOME/.grugops}` is in use. `--prune-old-kit` does **not** clear it: prune
only removes timestamped `.bak.<ISO>` backups, never a live kit (it refuses to delete user content
by design).

A `--migrate` on a clean repo (no old layout) simply falls through to a normal fresh install.

#### Rolling a migrate back (the manual restore)

A migrate is reversible by hand. To return a repo to its pre-migrate state:

1. **Remove the grugops wiring.** Run the uninstall, which removes only the grugops-owned
   adapters, the sentinel blocks, and the `.grugops/install.json` marker (it preserves the
   migrate backups and the seeded config):

   ```sh
   node install/uninstall.js --target /path/to/repo
   ```

2. **Restore the in-repo kit.** Rename the timestamped backup back over `agent-factory/`. Inside
   that backup, your original config is preserved as a `.bak`; rename it back first:

   ```sh
   cd /path/to/repo
   mv agent-factory.bak.<ISO>/config/factory.config.json.bak.<ISO> \
      agent-factory.bak.<ISO>/config/factory.config.json
   mv agent-factory.bak.<ISO> agent-factory
   ```

   (If your old config lived at the **repo root** instead, rename that `.bak` back too:
   `mv factory.config.json.bak.<ISO> factory.config.json`.)

3. **Remove the migrate-seeded config.** Migrate carried your edited config forward into
   `.grugops/`; remove that copy to return to the single-root shape:

   ```sh
   rm .grugops/factory.config.json
   ```

After these steps your `agent-factory/` kit and your edited config are exactly as they were before
the migrate. All commands are local `mv`/`rm`/`node` — nothing fetches anything.

##### Restoring `plans/handoffs/` and the `git revert` lossless rollback

The migration is **lossless and reversible** because nothing is ever deleted — every relocated
thing lives on as a timestamped `.bak.<ISO>` directory beside the original. To restore your old
delivery-relay handoffs, simply rename the backup back:

```sh
cd /path/to/repo
mv plans/handoffs.bak.<ISO> plans/handoffs
```

If the migration itself was committed to git, you can roll the whole change back with a single
`git revert` of the migration commit, then restore the out-of-band `.bak.<ISO>` directory by hand:

```sh
git revert <migration-commit-sha>     # undoes the committed migration edits
mv plans/handoffs.bak.<ISO> plans/handoffs   # restore the preserved handoffs (kept out-of-band)
```

`git revert` reverses the tracked changes, and because the handoffs were renamed aside (never
deleted) the `.bak.<ISO>` directory survives the revert and carries your original files verbatim —
so the `git revert` + restore is a **lossless** round-trip with no data left orphaned.

### Updating the shared kit (`--update`)

When you pull a newer grugops checkout and want every repo to pick up the new kit, refresh the
**shared kit** in place with `--update`:

```sh
node install/install.js --update
# preview the refresh first (changes NOTHING on disk):
DRY_RUN=1 node install/install.js --update
```

`--update` is **kit-home-only**: it refreshes the read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`
from the running checkout and **does not touch any repo's per-repo state** — it never writes adapters,
seeded `.grugops/` state, or a marker into a target. There is no `--target` to pass; one update
refreshes the one shared kit that every installed repo resolves against.

So `--update` is **not** how a change reaches a repo's `.claude/agents/` sub-agent adapters. Those are
rendered per repo at install time, from that repo's own `.grugops/factory.config.json`. A `models`
edit — or a kit-side adapter change — reaches an installed repo by **re-running the install from the
checkout against that repo**: `node install/install.js --target /path/to/repo`. The re-run is
idempotent, so an adapter that would not change is left alone and reported as identical. To see what
an edit has not reached yet without writing anything, run
`node install/install.js --check --target /path/to/repo`; it names every stale adapter.

It is **reversible**: the displaced kit is retained as a timestamped `agent-factory.bak.<ISO>`
backup under the kit home (renamed aside, never deleted) whenever the new kit differs from it. If the
kit is already identical, the update is a true no-op and leaves no backup behind.

If the checkout you run `--update` from is **older** than the kit already installed (a downgrade),
`--update` prints a clear warning naming both versions and then **proceeds** — it refreshes the kit
to the older version (retaining the newer one as the timestamped backup) rather than refusing. If
that was not what you intended, the backup is right there to restore.

### Pruning old backups (`--prune-old-kit`)

Both `--migrate` and `--update` leave **timestamped backups** behind on purpose (so a refresh or a
migration is always reversible). When you are confident you no longer need them, `--prune-old-kit`
removes them — and **only** them:

```sh
node install/install.js --prune-old-kit
# preview which backups would be removed (deletes NOTHING):
DRY_RUN=1 node install/install.js --prune-old-kit
```

This is the **single, opt-in deletion path** in grugops, and it is deliberately narrow:

- it removes **only** grugops-created backups — the `agent-factory.bak.<ISO>` directories (in both
  the target repo and the shared kit home) and the `factory.config.json.bak.<ISO>` files migrate
  leaves. The match is anchored to the exact `<name>.bak.<ISO-timestamp>` shape grugops creates, so a
  file of your own such as `mine.bak` or `notes.bak` is **never** matched;
- it **never** runs on the default install path — deletion happens only when you pass this flag
  (grugops never deletes first);
- it never touches the **live** `agent-factory/` kit, your seeded `.grugops/` state, `plans/`,
  `.planning/`, `docs/`, `src/`, or any other content you own (the same protected-path guard the
  uninstaller uses);
- a match that is a symbolic link is removed as a link, never followed. A backup is reported
  `removed` only when it is gone afterwards; one that could not be removed is a `verify` finding,
  and the run prints `== prune INCOMPLETE — N item(s) need verification ==` and exits `3`.

### Prove it yourself

```sh
npx vitest run install   # the install/uninstall behavioral gate (single-root + two-root)
```

The harness runs against throwaway temporary fixtures (it never mutates your repo, `$HOME`,
or a real `$GRUGOPS_HOME`) and asserts the contract: a double install produces zero diff,
`DRY_RUN=1` changes nothing in either root, and install-then-uninstall removes the
grugops-owned wiring + the install marker while the shared kit, the seeded state, and
`agent-factory/` all survive untouched.

---

## 3. The Claude Code plugin path (versioned, shareable)

Claude Code can also install grugops as a plugin, which gives you the colon-namespaced
commands (`/grugops:plan`, `/grugops:ticket`, …). The plugin form cannot carry Claude Code
permission rules, so it adds no ask-rule speed bump; only the scripted installer writes those (§5).
In Claude Code:

```
/plugin marketplace add abitwise/grugops   # UNKNOWN - verify against current tool docs
/plugin install grugops@grugops            # UNKNOWN - verify against current tool docs
```

The standalone skills installed by the scripted path use the dash form (`/grugops-plan`); the
plugin form uses the colon form (`/grugops:plan`). Both coexist. Plugin and marketplace schema
move quickly — confirm the exact commands against the current docs
(`code.claude.com/docs/en/plugins`, `code.claude.com/docs/en/plugin-marketplaces`) before you
rely on them. Where a command cannot be confirmed it is marked `UNKNOWN - verify` rather than
guessed.

---

## 4. Self-bootstrap

Once any form is installed, you do not need to remember these steps again. Ask the factory to
install or re-check itself:

```
/grugops install
```

The Orchestrator runs the Installer role, which performs the same additive, idempotent,
never-overwrite install (and can dry-run and uninstall) from inside the agent. It is the same
contract as the scripts above, driven by the agent instead of your shell.

---

## 5. Safety: where each rule is enforced (please read this in plain English)

The hard rule never changes: **grugops never merges a protected branch and never deploys to
production without named human confirmation. Humans decide; agents execute.** How that rule is
*enforced* is a separate question, and this section answers it honestly. There are three tiers.
Only the first one holds whatever command an agent types.

### (a) Hard floor — the git host

Your git host's protection (branch protection or rulesets, and deployment environments) is the only
tier that sees every push and merge, and every deployment that runs through its deployment
environments, whatever command started it. It is the guarantee; the two tiers below sit in front of
it. **grugops never configures your git host for you.** You set it up with the checklist below, and
grugops checks it read-only.

#### Git-host setup checklist

For each protected branch (your default branch, `main`, `master`, and any release branches you
use), add a branch protection rule or a ruleset that:

- [ ] requires a pull request before merging;
- [ ] requires at least one approving review;
- [ ] blocks force pushes;
- [ ] restricts deletions;
- [ ] does not let administrators or the account the agent works under bypass it.

To meet the last line with classic branch protection, turn on "Do not allow bypassing the above
settings" (include administrators) and list no one under "Allow specified actors to bypass required
pull requests". With a ruleset, keep the account your agent works under (and any role or team it
belongs to) off the ruleset's bypass list. The check reads this from the host: a ruleset counts only
when GitHub reports that the checked account can never bypass it. On a repository with one human
identity this has a real cost. A required approval that nobody can bypass means you cannot merge
your own pull requests, because GitHub does not let the author of a pull request approve it. If you
add yourself to a bypass list to get around that, the check reports `unprotected`, because an agent
working under your account could bypass the rule in the same way.

The check counts a branch line only on evidence it can read. With classic branch protection, the
pull-request and approval lines count only when the protection answer includes
`bypass_pull_request_allowances` and that setting lists no user, team or app. GitHub does not
document whether the key is left out when no allowance is set, so an answer without it reads
`UNKNOWN - verify` for those lines and for the last line, never as "no one can bypass". So a branch
protected by classic branch protection alone, whose answer leaves the key out, reads
`UNKNOWN - verify` on those lines even when no one is listed; a ruleset that shows the same items is
read as usual. The check reads up to 100 ruleset
rules for a branch. When GitHub reports that the rule list has a further page, no ruleset counts for
that branch, and only what classic protection shows is read. When GitHub's answer for `main` or
`master` reports `protected` as `false` (or as a value that is neither true nor false) while the
classic protection endpoint returns a protection record for it, the two answers disagree and that
branch reads `UNKNOWN - verify`. GitHub does not document whether that `protected` value counts
rulesets, so the check does not compare it with a branch's ruleset rules; that case is
`UNKNOWN - verify` until it is measured on a live host. A ruleset counts only when it belongs to
the repository the check inspected: a repository ruleset must name that repository (`owner/name`)
as its source, and an organization ruleset its owner, spelled exactly as the repository line spells
them. A ruleset whose source is an enterprise or any other owner reads `UNKNOWN - verify` for the
lines it would show.

For production, keep a deployment environment that:

- [ ] has the name your deploy jobs use;
- [ ] requires at least one reviewer;
- [ ] prevents self-review;
- [ ] does not let administrators bypass its protection rules;
- [ ] allows deployments only from protected branches.

On GitHub these are the environment's "Required reviewers" setting with at least one reviewer named
and the option to prevent self-reviews turned on, "Allow administrators to bypass configured
protection rules" turned off, and deployment branches set to "Protected branches only". A custom
branch policy ("Selected branches and tags") is not read, so the check reports it as
`UNKNOWN - verify`. The check shows the last line only when the same run sees classic branch
protection on at least one branch: a branch it inspects, or the first branch the host lists as
protected. GitHub documents "Protected branches only" for branch protection rules and states that
when no branch has them, every branch can deploy
([Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).
It does not say whether rulesets count there, although its protected-branch list includes branches
protected by rulesets
([REST API endpoints for branches](https://docs.github.com/en/rest/branches/branches)). So a
repository protected by rulesets alone reads `UNKNOWN - verify` for this line; adding a classic
branch protection rule to one branch lets the check show it. When the host lists no protected
branch, the line is not met, because every branch can deploy then. When the host lists no protected
branch but the same run shows protection on some branch (for example a ruleset on your default
branch), the answers disagree and the line reads `UNKNOWN - verify`. A reviewer counts only when the
host names a user or a team with an id; a reviewer entry of any other shape makes the reviewer and
self-review lines `UNKNOWN - verify`. The check knows two other environment protection rule types
from GitHub's REST description, `wait_timer` and `branch_policy`. A protection rule of any other type
next to the required-reviewers rule might be a second reviewer rule, so the reviewer and self-review
lines read `UNKNOWN - verify`. That includes a custom deployment protection rule if GitHub lists one
there, which has not been measured. The check reads up to 100 environments: when GitHub reports that
the list has a further page, or its `total_count` does not match the list, every production line
reads `UNKNOWN - verify`.
GitHub also documents that on the Free, Pro and Team plans required reviewers are available only for
public repositories; on a private repository under those plans the check cannot report the
production environment as `protected`. The check finds the environment name in this order: the
`--env <name>` flag; else the last entry of `environments` in `.grugops/factory.config.json`; else
the last entry of `environments` in `agent-factory/config/factory.config.json`; else `production`.
Both files are read relative to the directory the check runs in. A file that cannot be parsed, or
whose `environments` is not a list ending in a name, is skipped. So is a path that is not a regular
file of at most 1 MiB, such as a directory or a named pipe: the check does not read it.

#### Check it

```sh
node tools/grugops/host-protection.js
```

The installer places this script in your repository. It asks the git host, through read-only
`gh api` GET requests, whether the default branch, `main`/`master`, any branch you name with
`--branch <name>` (repeatable) and the production environment are protected. It prints one line per
target with one of three words:

- `protected` — the host showed positive evidence for every item of the checklist above that
  applies to the target (the branch list for a branch, the production list for the environment),
  from rules the account the check runs under cannot bypass.
- `unprotected` — the host answered, and at least one item is missing or can be bypassed by that
  account.
- `UNKNOWN - verify` — the check could not tell: no `gh`, not authenticated, no permission to read
  the setting, or an ambiguous answer. Treat it as not verified. It never counts as protected.

Before the target lines, the check prints the repository it inspected, `repository <owner>/<name>`,
as gh resolved `{owner}/{repo}` (the `GH_REPO` variable, `gh repo set-default`, or the git remotes).
In a fork clone, confirm that it names the repository your agent pushes to. When the host does not
name the repository, or names it inconsistently (its `full_name` and `url` disagree, or its `name`,
`owner` or `html_url` names another), the line reads
`repository UNKNOWN - verify` and every target reads `UNKNOWN - verify`. The check reads that `url`
only in its plain form, `https://api.github.com/repos/<owner>/<name>`, or
`https://<host>/api/v3/repos/<owner>/<name>` on GitHub Enterprise Server; any other form, including
an API host other than `api.github.com` without the `/api/v3` prefix, reads
`repository UNKNOWN - verify`. Other urls in the host's answers that name a repository (a protection
record's `url`, an environment's `url` and `html_url`, a branch's `protection_url`) must name
the same one, or the lines they feed read `UNKNOWN - verify`.

Exit codes: `0` every target is protected; `1` at least one target is unprotected; `2` otherwise,
including when the check could not run. `--json` adds the repository name (`repository`, or null)
and the full record of every call it made. The
check is read-only and needs an authenticated `gh` (`gh auth status`). The PR quality gate
(workflow 05) and the release (workflow 12) run it and record the result; the release still needs
the named human confirmation whatever the check reports.

### (b) Speed bump — Claude Code ask rules (standalone install only)

The scripted installer (§2) reads `checkpoints.protected_branch_merge` and
`checkpoints.production_requires_human_confirmation` from the first of
`.grugops/factory.config.json` and `agent-factory/config/factory.config.json` that exists in your
repository. When neither exists, or the one it finds cannot be read or parsed, it writes every rule. It adds
Claude Code ask rules to `permissions.ask` in your repository's `.claude/settings.json`:

- `protected_branch_merge` → rules for `git push` and `gh pr merge`;
- `production_requires_human_confirmation` → rules for the deploy and publish tools (kubectl, helm,
  terraform, gcloud, aws, serverless, fly, `vercel --prod`, and the npm, yarn and pnpm publish
  forms).

At `block` (the default), and at any value the installer does not recognise, the rules are
written. At `notify` or `off`, no rules are written. Lowering a checkpoint later does not remove
rules an earlier install wrote: the installer reports how many remain, and uninstall removes them.
The writes follow the installer contract. They are additive (your own rules and keys stay),
idempotent, skipped under `DRY_RUN=1`, and recorded in `.grugops/install.json`, so `uninstall.js`
removes the rules install added and nothing else. It removes one copy of each rule install
recorded, so a copy of the same rule you added yourself stays and is reported as `left`.
`--check` reports whether each recorded rule is still present. If `.claude/settings.json` cannot
be parsed, the installer leaves it untouched and exits `3`. If `.grugops/install.json` cannot be
read, or its ask-rule ledger is malformed, that is a `verify` finding (exit `3`) on both sides:
install then adds no rule and leaves the ledger as it found it, and uninstall removes no rule. One formatting note: when the installer adds rules to an existing
`.claude/settings.json`, it writes the file back as 2-space JSON. Your values and key order are
kept; your original whitespace is not.

**What an ask rule does.** Claude Code asks you before it runs a matching command. In a
non-interactive `claude -p` run, where nobody can answer, a matching command is denied. This was
measured on Claude Code 2.1.283 in six permission configurations, including when the command was
also allow-listed; the evidence and the harness are committed under
`.planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-ASK-P-MODE-EVIDENCE.md`.

**Why it is a speed bump and not a guarantee.** The rules cover the command spellings an agent
usually produces. The Claude Code documentation says that such a Bash rule "covers the invocation
Claude usually produces and isn't a security boundary around the program"
([code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions)). Other
spellings of the same command are not matched. The ask rules are not a security boundary: treat them
as a prompt in front of the git host, not as the thing that stops a merge or a deploy.

**The plugin form has no speed bump.** A Claude Code plugin cannot carry permission rules, so a
plugin-only install (§3) writes no ask rules. Only the scripted installer does. With the plugin
form alone, the git host is your only mechanical tier.

### (c) Prose — the role and workflow rules

Everything else is written rules that the roles read. The Orchestrator and the Release Manager stop
at a pull request, and a named human performs the merge and the production deploy (workflow 12).
Two checkpoints are prose only, and no mechanism enforces them (33.1 D-26):

- `checkpoints.open_pr` — the agent stops at a pull request instead of carrying the change further;
- `checkpoints.test_integrity` — weakened or skipped tests are surfaced at the gate.

Lowering either one in configuration is a decision recorded in git history; nothing blocks it. The
`grugops-release` skill ships with `disable-model-invocation: true`, so Claude Code does not start a
release on its own; a human invokes it.

### What changed: the Bash command guard is retired

Earlier releases shipped a Claude Code hook that tried to recognise production deploys from the
text of a Bash command. It was retired by 33.1 D-17, because no parser of shell text could be
closed: each round of fixes left other ways to write the same command. Mechanical enforcement now
means the git host plus the ask rules above, and grugops makes no promise that depends on reading
shell text. The one hook grugops still ships is the MCP admission gate for the shared verified
context, which checks structured tool calls, not shell text.

### Other tools (documentation only)

grugops generates no approval configuration for Codex CLI, Gemini CLI, OpenCode or GitHub Copilot
CLI. Each has its own approval mode, which you configure yourself. The notes below come from each
tool's documentation and are **not verified by grugops**; confirm them against the current docs
before you rely on them. On every tool, the git host is the hard floor.

- **OpenCode** — `permission.bash` in `opencode.json` takes command patterns mapped to `allow`,
  `ask` or `deny`, and the last matching rule wins (opencode.ai/docs/permissions). Not verified by
  grugops.
- **GitHub Copilot CLI** — `--deny-tool` denies a tool or a shell command pattern (for example
  `--deny-tool='shell(git push)'`), and deny rules take precedence over allow rules
  (docs.github.com/en/copilot/how-tos/copilot-cli/allowing-tools). Not verified by grugops.
- **Gemini CLI** — the policy engine reads TOML policies (`~/.gemini/policies/*.toml`) that match a
  `commandPrefix` and can decide `ask_user`; in non-interactive mode `ask_user` is treated as `deny`
  (geminicli.com/docs/reference/policy-engine). Not verified by grugops.
- **Codex CLI** — approval policies and sandbox modes decide when Codex asks before it runs a
  command. The syntax for a rule that matches a specific command is `UNKNOWN - verify`; check the
  current Codex documentation before relying on it.

Verify the Claude Code permission behaviour against current tool docs
(`code.claude.com/docs/en/permissions`, `code.claude.com/docs/en/settings`) before you depend on it.

---

## 6. Entry paths — the three tiers, and what each one enforces

Installing grugops puts the roles on disk. How you *start* the session decides what the
Orchestrator can actually do with them. There are three tiers, and the Orchestrator announces
which one it is in before it schedules anything. It picks the tier by sensing whether the
`Agent` tool is available to it — never by reading a host name or a version string.

The three names below are the same three the coordinator uses in that runtime announcement
(they live once, in `agent-factory/packaging/subagent.frontmatter.md`), so what you read here
and what you see in a session are one vocabulary, not two.

### Full — `claude --agent grugops-orchestrator`

```sh
claude --agent grugops-orchestrator
```

This is the **full-capability path**. The main thread itself takes on the coordinator's system
prompt and tool restrictions, role agents are scheduled in parallel up to `queue.wip_limit`, and
the enumerated `Agent(...)` grant in the coordinator adapter's frontmatter **is enforced by the
runtime** — on this path only. Claude Code prints the agent name in the session startup header
(`@grugops-orchestrator`); that header is how you confirm the tier is live.

### Reduced — a default session (what the `/grugops` skill entry gets)

The headline entry — `/grugops` in an ordinary Claude Code session — runs in a default main
thread. That session already has the `Agent` tool, so parallel scheduling is available and is
used, up to the same `queue.wip_limit`. But the enumerated grant is **not runtime-enforced
here**: a default session declares no allowlist, so nothing mechanical holds a spawn inside the
16 specialist names. The coordinator says exactly that when it announces the tier, and stays
inside the grant by instruction rather than by enforcement. That is a weaker guarantee than the
full tier, and it is stated plainly rather than softened — you should know which one you have.

### Degraded — no `Agent` tool at all

Codex CLI, Gemini CLI, OpenCode and GitHub Copilot CLI have no host spawn mechanism, and a
Claude Code sub-agent already at the nesting limit has `Agent` withheld from it rather than
erroring. In either case the coordinator drains the same queue at concurrency one, activating
each role in a single window through `agent-factory/roles/_role-switch-protocol.md` — and says
so out loud.

### What the installer deliberately does not write

The installer writes **no main-thread wiring into your repository** — no `.claude/settings.json`
`agent` entry, in any form, not even behind a sentinel. Two reasons, both deliberate:

- Such an entry would make **every** session in that repository run as the grugops coordinator,
  including a session you opened only to fix a typo in a readme.
- Settings files are **your** content, and grugops is additive: it never overwrites what you own.

The one thing the installer does add to `.claude/settings.json` is the ask rules of §5, in
`permissions.ask`. That write is additive (your own rules and keys stay), recorded in
`.grugops/install.json`, and reversed by `uninstall.js`, which removes only the rules install added.

So the flag is the full-capability path this kit documents, and you type it in the sessions where
you want it. What is deliberately **not** claimed here: the platform documents the
enumerated-allowlist rule for the `--agent` flag specifically. Whether the corresponding settings
key enforces that same allowlist is `UNKNOWN - verify` — grugops does not write that key, so
nothing here depends on the answer, and no equivalence is asserted.

### How the adapter is found

Project-scope adapters live in `.claude/agents/`, and Claude Code discovers them by walking up
from your working directory, so every `.claude/agents/` between there and the repository root is
scanned. Identity comes only from the frontmatter `name` field — the filename does not decide it.
All 17 grugops adapters carry the `grugops-` prefix, which keeps their names unique across a tree.
Verify this resolution behavior against current tool docs
(`code.claude.com/docs/en/sub-agents`) before you depend on the details.

---

## 7. Browser UAT — what grugops installs for it (nothing)

Agent-authored browser UAT has one home in the kit:
`agent-factory/checklists/browser-uat-recipe.md`. Read it there rather than here; the substrate
stays short and the detail lives in the file it points at.

The recipe covers the pinned browser-MCP setup for all five host CLIs — Claude Code, Codex CLI,
Gemini CLI, OpenCode, and GitHub Copilot CLI — and the statement that the attended Claude-in-Chrome
lane is optional, human-stamped, and absent by design on the other four hosts.

**grugops installs nothing for this.** The MCP server is fetched by your own coding agent through
`npx` at the pinned version, so `package.json` gains no dependency and the installer writes no MCP
configuration into your repository. Browser binaries remain your repository's own prerequisite.

---

## Attribution

grugops borrows its voice in homage to [grugbrain.dev](https://grugbrain.dev). grugops is **not
affiliated with, endorsed by, or sponsored by** grugbrain.dev or its author. The joke earns
trust; it never replaces the explanation, and it stays out of the safety, money, and
compliance text — which is always plain.
