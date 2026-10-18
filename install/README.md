# Installing grugops

grug build factory once. grug not install it a different hard way for each tool. so installing is
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

1. Copy the portable `AGENTS.md` and the `agent-factory/` folder into your repo. The folder carries
   `LICENSE` (the MIT license) and `NOTICE` (the attribution and non-affiliation statements). They
   stay with the copy: the MIT license asks that its notice go with every copy of grugops.
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

The flags name the agents to install for: one flag per supported agent (`--claude`, `--codex`,
`--antigravity`, `--opencode`, `--copilot`, `--pi`), and there is no all-agents flag. Each run writes
the shared files and the entries of the agents it is for (see "What the installer touches" below).

```sh
# Install into a chosen repo (run from the grugops checkout; the target can be anywhere) for Claude Code:
node install/install.js --target /path/to/repo --claude

# For Codex CLI and OpenCode:
node install/install.js --target /path/to/repo --codex --opencode

# Install into the current repo (prompts to confirm the target first):
node install/install.js --pi

# Unattended / CI (take the default target, no prompt). A first unattended install names its
# agents; see "Which agents an unattended install is for":
node install/install.js --yes --claude

# Preview first — prints the plan, changes NOTHING on disk (in either root):
DRY_RUN=1 node install/install.js

# Put the shared kit somewhere other than ~/.grugops:
GRUGOPS_HOME=/opt/grugops node install/install.js --target /path/to/repo

# Re-install with no terminal (an agent, CI) over grugops skills or adapters you edited:
# back each edited file up next to itself, then refresh the whole kit (see "Re-installing"):
node install/install.js --yes --backup-edited-kit --target /path/to/repo
```

A command the installer or the uninstaller prints (for example the one the `install INCOMPLETE`
banner gives, the one a `--check` note gives for an agent with nothing installed, or the one a
`left` or `verify` line gives to finish an uninstall) names the script by its absolute path, so it
runs from any directory, and states before `node` every value the script would otherwise take from
your shell. An install command starts with `GRUGOPS_HOME=<dir> INSTALL_MODE=<copy or symlink>
GRUGOPS_SRC=<dir> node`, and an uninstall command with `GRUGOPS_HOME=<dir> GRUGOPS_SRC=<dir> node`
(the uninstaller reads no `INSTALL_MODE`). The default kit home `~/.grugops`, a copy install and the
checkout the script is in are stated too, and no printed command carries `--symlink`, so a
`GRUGOPS_HOME`, `INSTALL_MODE` or `GRUGOPS_SRC` exported in your shell does not change what a
printed command does.
`install.js --check` reads the install marker it checks (`.grugops/install.json`). When that marker
is install's own record for this directory, the install commands `--check` prints carry the kit home
and install mode the marker records, whatever kit home or mode the `--check` run was given, and
`--check` reads that kit home for its own checks too (see "How a host finds the kit after a scripted
install"). With no marker it can use, they carry the kit home and mode of the `--check` run itself.
An install, `--migrate`, `--update` or `--prune-old-kit` run prints commands with the kit home and
mode it was run with (`GRUGOPS_HOME`, else `~/.grugops`; `--symlink` or `INSTALL_MODE`, else copy).
An uninstall command the uninstaller prints to finish or repeat a run (on a `left` line, a `verify`
line or the `uninstall INCOMPLETE` banner) states the kit home install recorded when the marker is
install's own record for this directory, else the kit home the uninstaller was run with
(`GRUGOPS_HOME`, else `~/.grugops`). The uninstaller removes only what the install record in the
target names; the kit home decides only the install command it prints over a marker it cannot use,
which states the kit home the uninstaller was run with and `INSTALL_MODE=copy`.
`GRUGOPS_SRC=<dir>` names the kit checkout the run used (`GRUGOPS_SRC`, else the checkout the script
is in), so the command renders from, and reports against, that checkout. The `--check` warning
about stale adapters names one checkout, the one it compared the adapters against, and its install
command renders from that checkout.

### Re-installing over an existing install (your edits to the kit files, D-32)

Before it writes any grugops skill or adapter file (`.claude/skills/grugops*/SKILL.md` and
`.claude/agents/grugops-*.md`), install checks each one it would replace against its record of what
it wrote there (its entry in the install ledger in `.grugops/install.json`). If you edited any of them, install
lists them (an `edited-kit` line each) and, at a terminal, asks whether to back them up and overwrite
the whole kit, `[y/N]`, default no.

- **Yes:** each edited file is first copied next to itself as `<file>.grugops-edited-<UTC stamp>`
  (for example `grugops-qe-e2e.md.grugops-edited-2026-09-30T10-54-21.203Z`), then the whole kit is
  refreshed. Install records each backup it makes in the install ledger, with a record of its content
  and the edited file's permission bits, so a `0600` file gets a `0600` backup. Uninstall never removes
  a backup: it reports each recorded one `left` by its record, as install's backup of your content. A
  file with such a name and no record (made before this release, or not by install) is reported `left`
  as one whose name matches the pattern, without claiming install made it. `--prune-old-kit` never
  removes these backups.
- **No:** nothing in the kit changes. The run exits `3` with a `verify` line naming the files.
- **No terminal, or `--yes`:** install asks nothing and changes nothing in the kit. `--yes` answers
  only the target question, never whether an edit may be overwritten. The run exits `3` and tells you
  to re-run with **`--backup-edited-kit`**, the explicit opt-in that gives the yes answer without a
  prompt.
- **`DRY_RUN=1`** asks nothing and lists each backup it would make (`would-back-up`). Without
  `--backup-edited-kit` it exits `3`, as the real unattended run would; with it, it previews the
  backups and the kit write and exits `0`.

With no usable record (no marker, a marker that is not this directory's record, including one written
before this release, or a damaged install ledger in `.grugops/install.json`), a skill or adapter counts as edited when it differs from
its kit source file, so the first re-install over an older install asks once. Measured on an install
made by the 2.1.0 installer: one file, the Orchestrator wrapper, differs and is listed. A `--migrate`
over the old single-root layout is the same case: its skills and adapters have no record, so an
unattended `--migrate` needs `--backup-edited-kit` and refuses the whole migration without it.

When the kit is not refreshed (no answer, the answer no, or a refusal), nothing in the kit changes,
and the other steps still run (the runnables, the pointer blocks, the settings). The marker keeps
the kit version it had, so after a newer kit was copied to the shared kit home, `install.js --check`
warns `kit-version skew` until a refresh succeeds. Install checks every kit file and renders every
adapter before it writes the first one, so a refusal never leaves some kit files new and others old.
One residual remains (T-33.1-312): if the operating system itself fails partway through the kit write
(a full disk, or a permission error after every check passed), some kit files can already be
written. Install reports each file that failed as a counted `verify` line naming it, and the next
run's checks see that state and check it again.

The shared kit home is different. The kit home keeps a record of what install wrote there,
`${GRUGOPS_HOME:-$HOME/.grugops}/.grugops-kit.json`. A re-install replaces the `agent-factory/` that
record names with a fresh copy of the kit, so an edit you made inside the shared kit install wrote is
overwritten, with no backup and no question. That is accepted for now (human decision, 2026-09-30); a
backup of kit-home edits is deferred. Keep your own changes in the target repository, not in the
shared kit home. Anything else at that path is kept: an `agent-factory/` the record does not name (one
of your own, or a kit home written by an installer from before the record existed), a symbolic link,
or a file is renamed aside to `agent-factory.bak.<ISO>` beside it, never deleted, and the backup is
recorded in `.grugops-kit.json`. So the first re-install over a kit home written before this release
leaves one such backup. `--prune-old-kit` removes it while it is unchanged (see "Pruning old
backups"), or you can remove it by hand once you no longer need it.

A grugops skill or adapter file that is already in the repository, byte for byte what install would
write (a copy you made by hand, for example), is not install's unless an earlier install recorded
writing it. Install leaves such a file as it is, reports it `left`, and records nothing for it, so
the uninstaller leaves it too. Only a file the install ledger already lists, and that still holds what
the ledger records, keeps its record on a re-install.

### Command-line contract — choosing agents

The agent flags and the choice they make are a published contract (34.1 D-25); a change to any of
these is a breaking change.

- **One flag per supported agent.** The flag is `--` followed by the agent's id in the registry
  (`agentFlag` in `install/host-tools.ts`): `--claude`, `--codex`, `--antigravity`, `--opencode`,
  `--copilot` and `--pi`. A new agent gets its flag from its registry row. There is **no all-agents
  flag**: `--all` is an unknown argument (exit `2`).
- **With agent flags,** the run is for exactly the agents named. Install only adds: naming fewer
  agents than are installed keeps the others' files and records.
- **With no agent flag, at a terminal** (standard input and standard output both terminals, and no
  `--yes`), the installer shows the agent checkbox list ("The agent list at a terminal").
- **With no agent flag, unattended** (`--yes`, or a standard input or output that is not a
  terminal), the run is for the agents recorded in `.grugops/install.json`; else, for an install made
  before that record existed, Claude Code, Copilot and Pi; else the agents detected in the repository.
  With none of these it writes nothing and exits `1` ("Which agents an unattended install is for").
  When `.grugops/install.json` is a file install cannot use, it exits `3` instead, with its `verify`
  line about the file (see the exit codes below).
- **Agent flags with a mode.** An agent flag combined with `--check`, `--update` or `--prune-old-kit`
  is bad usage: exit `2`, nothing read or written. `--check` reads the agents from the install record
  instead.
- **Uninstall takes the same agent flags.** `node install/uninstall.js --codex` removes only what the
  install ledger records for the agents named; with no agent flag it removes everything install
  recorded ("Removing one agent" under Undo).

### Exit codes — what the installer tells a script

If you chain anything after the installer (`node install/install.js --yes && next-step`, a CI
step, a Makefile), read the exit code. Both `install.js` and `uninstall.js` use the same list:

| Code | Meaning |
|------|---------|
| `0` | **complete** — every class installed (or removed); the run printed `== install complete ==` (or `== uninstall complete ==`). The **non-install modes** exit `0` too, and each prints its **own** closing line rather than the install banner — `--check` on a clean doctor prints `ALL CHECKS PASSED`, `--update` prints `== update complete ==` only when the kit was copied, `--prune-old-kit` prints `== prune complete ==`, and a `--migrate` on an already-migrated repo says what it changed (the `plans/handoffs/` backup it made, named, and whether it was recorded in `.grugops/install.json`) or that nothing was changed. All four are **`install.js` only**. `uninstall.js` also exits `0` when it left a recorded file you edited: it then prints `== uninstall complete — N recorded item(s) left in place; .grugops/install.json kept to record them ==` (see Undo). An uninstall that removes some agents (`--codex`, …) adds which agents it removed and which stay installed to its closing line (see "Removing one agent" under Undo). So do not test for the install banner to decide a run succeeded; test the exit code. |
| `1` | **refused or aborted** — the run changed nothing. The self-checkout guard (the target looks like the grugops source checkout) is the usual cause, and **both binaries implement it**: each writes a refusal to stderr naming `--allow-self`, and neither writes nor removes anything. `install.js` also refuses a kit home that overlaps the target (see the kit-home paragraph below), refuses when no agent was named, none is recorded and none was detected (see "Which agents an unattended install is for"), and refuses when the agent list at a terminal is cancelled with Ctrl-C or confirmed with no agent checked (see "The agent list at a terminal"); each of these selection refusals names every agent flag. When `.grugops/install.json` is a file install cannot use, these selection refusals exit `3` instead, with the `verify` line about the file (row `3`). `--check` also reports `1` on a doctor FAIL — that half is **`install.js` only**, because `uninstall.js` has no doctor mode. |
| `2` | **bad usage** — an unknown argument, `--target` with no value, or (`install.js` only) an agent flag (`--claude`, `--codex`, …) combined with `--check`, `--update` or `--prune-old-kit`. Nothing was read or written. |
| `3` | **incomplete** — the run went ahead but could not finish a whole class, and printed `== install INCOMPLETE — N item(s) need verification ==` (`uninstall.js` prints the same line with `uninstall` in place of `install`, `--update` with `update`, `--migrate` with `migrate`, and `--prune-old-kit` with `prune`). Every `verify` line in the output names what was left undone and the remedy for it. `install.js` also exits `3`, and stops before it writes anything in the repository or the kit home, when `.grugops/install.json` is a file it cannot use, whether or not an agent was named or could be chosen: a file install never wrote, one it cannot read, or one whose install ledger is malformed (see the paragraph under Undo that opens "The marker is install's record for one directory"). |

Code `3` is the important one: grug not lie about finish. A run that could not read a source
directory, that refused an adapter (a `models` block the resolver refuses is one way), or that could
not render the adapters at all (a partial checkout missing the modules the render needs is one way),
installed **nothing for that class** — so it does not
claim completion, and it does not return the success code either. A path the installer would write
that is not what it expects is another way: a FIFO, a directory, a device or a symbolic link where a
file goes (a dangling link included), a file with more than one name (a hard link: a write through
one name would change the file under the others, which may be outside the repository), or a regular
file, a FIFO or a symbolic link where a directory goes. That path is skipped with a `verify` line
naming it and left exactly as it was, nothing is written through it, and the rest of the install
still runs. The skills and adapters under `.claude/` are one class, the kit, and the kit is written
whole or not at all: the installer checks every kit source, the adapter render and every kit
destination before it writes the first kit file, and if any of them is refused, no skill or adapter
is written, linked or unlinked in that run and every kit file already there is left exactly as it
was. A mix of new skills and old adapters is never left behind. The other classes still run. The
checks before the first kit write also cover a kit destination this process cannot write (a
read-only file, or a read-only directory it would be created in), a destination longer than the
platform allows (a path of 1024 bytes or more on macOS, 4096 on Linux, or a name over 255 bytes),
two kit names that differ only by letter case or Unicode normalisation (one file on the macOS and
Windows default filesystems), and a kit source directory the installer could not fully examine (an
unreadable nested directory, a symbolic-link cycle, or its walk bound). A symbolic link at a
resolver skill or adapter is replaced by the rendered file only when it is install's own link (the
link an earlier `--symlink` install made, pointing at this checkout's source for that file), on any
run; any other link there refuses the kit. A run that writes no kit file, for any reason (a
refusal, no answer, a failed backup), writes the marker's kit record back exactly as it found it: the
kit-file entries of the install ledger in `.grugops/install.json` unchanged, and the previous kit version, kit root, kit
home and install mode, because the kit in `.claude` is still the previous one. So undoing what caused
the refusal (removing what you put at a kit path, restoring an edited file to what install wrote) is
enough for the next run and for the uninstaller. With no earlier kit version to keep (no marker, or
a marker whose `kitVersion` is not a string), none is recorded, and `--check` warns that the kit
version is unknown. A re-install never overwrites a kit file you
edited without your answer (D-32): at a terminal it lists the edited files and asks whether to back
them up (as `<file>.grugops-edited-<UTC stamp>`, which the uninstaller never removes) and refresh the
whole kit; without a terminal, or with `--yes`, it writes no kit file and names
`--backup-edited-kit`, the flag that gives that answer. A backup is written in full under a name
ending in `.incomplete` and only then given its backup name, so a backup name never holds a partial
copy. If a backup fails partway (a full disk), the partial copy is removed and no kit file is
written; if it cannot be removed, the `verify` line names it as incomplete. The uninstaller removes
neither kind of file. Install records each whole backup it makes, so the uninstaller reports a recorded
backup `left` by its record; a backup name with no record, and every `.incomplete` name, it reports
only as one whose name matches that pattern, and leaves it. The one gap is an error while the kit is being
written that the checks could not see (a disk that fills up, for example): that file is a `verify`
line and the run goes on to the next. The uninstaller applies the same rule to every file it edits, and it never reads a
hard-linked `.grugops/install.json` as this repository's marker. **A chained command stops
here.** That is deliberate: proceeding over a partial install is how a broken install reaches
production looking fine. Read the `verify` lines, fix the source, re-run (the installer is
idempotent, so re-running is safe). The uninstaller keeps `.grugops/install.json` after a run that
could not finish, so re-running it after the fix finishes the reversal (see "When uninstall keeps
`.grugops/install.json`" under Undo).

Code `1` from `install.js` can also mean the **kit-home overlap refusal**. The kit is written to
`${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory`, and install refuses, before it writes anything, when
that kit home and the target overlap: the kit root is the target, either lies inside the other, or the
kit home is the target or lies inside it (for example `GRUGOPS_HOME` set to the repository, or to a
directory inside it). The paths are compared after resolving symbolic links, and a path whose real
location cannot be read is refused as well. The refusal is always on: `DRY_RUN=1` does not exempt it
and `--allow-self` does not override it. It writes one sentence to stderr, prints nothing on stdout,
and changes nothing in the target or the kit home. The remedy is to set `GRUGOPS_HOME` to a directory
outside the repository. A target inside the kit home but outside its `agent-factory/` (for example
`GRUGOPS_HOME=$HOME` with the repository at `$HOME/code/repo`) is not an overlap.

Code `1` from `uninstall.js` means the **self-checkout refusal**: the target you named is the
grugops source checkout itself (or a second checkout of it — it carries `install/install.js` and
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

`--target` needs a value. `--target` given last, `--target=` with nothing after it, and `--target`
followed by another option are bad usage in both binaries (exit `2`, with a usage line), and nothing
is read or written; neither falls back to `TARGET=` or the current directory. For a path that begins
with `--`, write `--target=<path>`.

When run interactively without `--target`, the installer asks *"Install grugops into which
repo? [<default>]"* and waits for confirmation. For unattended runs (CI, scripts), pass
**`--yes`** (or `-y`) to take the default target without prompting; a non-TTY stdin is treated
the same way, so a piped or redirected invocation never hangs on the prompt.

#### Which agents an unattended install is for

Each agent has its own flag: `--claude` (Claude Code), `--codex` (Codex CLI), `--antigravity`
(Antigravity CLI), `--opencode` (OpenCode), `--copilot` (GitHub Copilot CLI) and `--pi` (Pi). There is
no all-agents flag. With one or more of them, the run chooses exactly the agents named. With none,
`--yes` (or a run with no terminal) chooses, in this order:

1. **The agents recorded in `.grugops/install.json`.** Every install records, in the `agents` field,
   the agents chosen for that repository and not yet removed. Naming fewer agents later never removes
   one from the record: install only adds. That includes an agent none of whose files could be
   written: the next unattended run chooses it again, so a fixed cause is retried. Uninstall drops an
   agent from the record only once nothing install recorded for it is left in place. If the `agents`
   list is edited to leave out an agent whose files the install ledger still records (a file, a
   pointer block or a settings entry install wrote; a directory alone does not count), the next
   install records that agent again. For the agent skill two agents share,
   `.agents/skills/grugops/SKILL.md` (`--codex` and `--antigravity`), it records both, because the
   ledger cannot tell which of the two the file was installed for; an uninstall with both flags then
   removes the file.
2. **An install made before this release** (its `.grugops/install.json` has an install ledger but no
   `agents` field) counts as Claude Code, Copilot and Pi, the agents those installs wrote files for.
   Its old Gemini settings record does not choose Antigravity.
3. **The agents detected in the repository**, when nothing is recorded. This covers a repository
   never installed into, and a v2.1.0 install, which kept no install ledger. An agent is detected
   when its signal, a path relative to the repository root, is present:

   | Agent | Detected by |
   |-------|-------------|
   | Claude Code | `.claude` |
   | Codex CLI | `.codex` |
   | Antigravity CLI | `.gemini` (`UNKNOWN - verify`: it is the old Gemini CLI signal, and no project-level `.gemini/` use by Antigravity CLI was found in its documentation) |
   | OpenCode | `opencode.json` |
   | GitHub Copilot CLI | `.github/copilot-instructions.md` only; a bare `.github/` directory, which most GitHub repositories have, chooses nothing |
   | Pi | `.pi` |

   So a `.gemini` directory (for example one an earlier Gemini CLI setup left) chooses Antigravity
   CLI, and a `.pi` directory chooses Pi.
4. **Nothing recorded and nothing detected:** the installer writes nothing, exits `1`, and its
   stderr message names every agent flag to pass. When `.grugops/install.json` is a file install
   cannot use, it exits `3` instead, with its `verify` line about the file in place of that message.

The run banner's `agents:` line names each chosen agent and why it was chosen (named by flag,
recorded, installed before this release, or detected with its signal), so a choice made by detection
is visible. A run at a terminal with no agent flag asks instead; see the next section.

#### The agent list at a terminal

With a terminal on both standard input and standard output, no agent flag and no `--yes`, the
installer shows a checkbox list of every supported agent instead of choosing in the order above:

```text
Choose the coding agents to install grugops for (arrows or j/k move, space toggles, Enter confirms, Ctrl-C cancels):
> [x] Claude Code  (detected: .claude)
  [ ] Codex CLI
  [ ] Antigravity CLI
  [ ] OpenCode
  [ ] GitHub Copilot CLI
  [ ] Pi
```

- **What starts checked:** the agents installed in the repository (steps 1 and 2 above) and the
  agents detected in it (step 3). Each says why: `(installed)`, `(detected: <signal>)`, or both.
- **Keys:** the arrow keys or `j` and `k` move, space toggles the agent under `>`, and Enter
  confirms. The run banner's `agents:` line then names each checked agent with the reason `chosen at
  the prompt`.
- **Unchecking an installed agent does not remove it.** Install only adds: the agent's files stay,
  and the closing notes name the agents left installed and the uninstall command that removes one.
  An agent recorded as chosen with nothing installed here is named apart, with the command that
  installs it and the command that takes it out of the record.
- **Nothing checked, or Ctrl-C:** confirming with no agent checked, or pressing Ctrl-C at the list,
  exits `1` and writes nothing. The message names every agent flag, as the refusal in step 4 does.
  When `.grugops/install.json` is a file install cannot use, it exits `3` instead, with its `verify`
  line about the file.
- **What skips the list:** any agent flag, `--yes`, or a standard input or output that is not a
  terminal (a pipe, a redirect, CI). The run then chooses in the order above.

The list puts the terminal in raw mode and hides the cursor while it is on screen. When it ends,
whether by Enter, Ctrl-C or an error, it shows the cursor again and turns raw mode off, and it does
both even if one of those two steps fails. If the installer is killed by a signal while the list is
open, the cursor can stay hidden; `tput cnorm` (or `reset`) shows it again.

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

What an install writes in the **target repo** depends on the agents it is for: there is one flag per
supported agent (`--claude`, `--codex`, `--antigravity`, `--opencode`, `--copilot`, `--pi`) and no
all-agents flag, and a run with no flag asks at a terminal ("The agent list at a terminal") and
otherwise chooses as "Which agents an unattended install is for" says.
Some files are shared by every agent and written on every install; the rest belong to one agent and
are written only when that agent is chosen.

**Shared, written on every install** (whatever agents are chosen):

- `AGENTS.md` — copied from the kit (or linked, under `--symlink`) when the target has none, and
  refreshed when it is install's own unedited copy (see the paragraph on re-installs below), and
  recorded in the install ledger in `.grugops/install.json`. Its "Kit vs state" rule names the
  kit route (see "How a host finds the kit after a scripted install" below). An `AGENTS.md` you
  wrote, or install's copy that you edited, is never written
- `tools/grugops/` — the kit's runnable checks, including the read-only git-host check
  `tools/grugops/host-protection.js` (§5), and `tools/grugops/LICENSE`, the MIT license for the
  programs copied there. The license is recorded and removed like them, and a file you already have
  at that path is never written. Install writes no `NOTICE` and no other license file into your repo
- **seeded per-repo state** (skip-if-exists, never clobbered): `.grugops/factory.config.json`,
  the `.grugops/install.json` marker, `plans/`, and `memory-bank/`
- `.gemini/settings.json` — install never reads or writes it (34.1 D-12: Gemini CLI is
  discontinued, and its registry row is now Antigravity CLI, which reads `AGENTS.md` with no settings
  entry). An install made before that change may have added `"AGENTS.md"` to the file's
  `context.fileName` and recorded what it did in the install ledger in `.grugops/install.json`; a
  re-install carries that record unchanged, and the uninstaller reverses the recorded change from the
  ledger, only while the file still holds what install recorded (see the paragraph on the Gemini
  settings file below)

**Claude Code** (`--claude`), only when Claude Code is chosen. An install that does not choose it
writes no path under `.claude/` and no `CLAUDE.md`:

- `.claude/skills/grugops*/SKILL.md` — the seven standalone skills
- `.claude/agents/grugops-*.md` — the Orchestrator subagent wrapper and the role adapters (17
  files in this release)
- the two **resolver adapters** (`.claude/skills/grugops/SKILL.md` and the orchestrator
  wrapper) have the resolved absolute kit path **materialized** into them, so `/grugops`
  resolves the shared kit on first run with no path error
- for every skill and adapter file above, install records in the install ledger in
  `.grugops/install.json` what it wrote there (a sha256 of the bytes, or the target of a `--symlink` link), so
  uninstall removes only a file that still holds exactly that, and a re-install asks before it
  overwrites one you edited (see "Re-installing" above). A file that was already there, byte for
  byte what install would write, and that no earlier record of install's names, is left and not
  recorded, so uninstall leaves it
- a one-line **start-here** pointer block in `CLAUDE.md` (appended behind a sentinel; your
  existing content is preserved). After its start-here sentence the line names the kit route, the
  `kitRoot` field of `.grugops/install.json`. When `CLAUDE.md` does not exist, install creates it and records
  that in the install ledger in `.grugops/install.json`; the block it appended is recorded there
  too. A `CLAUDE.md` that is a symbolic link (the common `CLAUDE.md -> AGENTS.md`
  setup included) or a hard link is not written through: install reports a `verify` line (exit
  `3`), leaves it and the file it points at unchanged, and adds no pointer; add the line by hand if
  you want it. Install records no block for it, so the uninstaller leaves it too, reports it `left`,
  and that does not change its exit code. To have install add the pointer instead, replace the link
  with a regular file before you install: Claude Code documents a `CLAUDE.md` holding the import
  line `@AGENTS.md` as the alternative to a `CLAUDE.md -> AGENTS.md` link
  ([code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)), and install appends
  its block to that file as to any other
- `.claude/settings.json` — the Claude Code ask rules described in §5 are added to
  `permissions.ask` (additive and in place: every other byte of the file is kept, and the added
  rules are recorded so uninstall removes exactly those)

**Codex CLI** (`--codex`) and **Antigravity CLI** (`--antigravity`), only when one of them is chosen:

- `.agents/skills/grugops/SKILL.md` — one skill file, written once when Codex CLI, Antigravity CLI or
  both are chosen. Both read it from `.agents/skills/`: Codex users type `$grugops`, or pick it from
  `/skills`; Antigravity CLI offers each skill as a slash command, so this one is `/grugops` (per
  antigravity.google/docs/skills/, retrieved 2026-10-11). It is written by the same rules as the Pi
  template: the same pointer (the start-here sentence and the kit route) under the frontmatter the
  host reads, with no role text; install records the file and only the directories this install
  created; a file already at the path that is not install's own unedited copy is left untouched and
  not recorded; `DRY_RUN=1` lists it as `would-add`. Uninstalling one of the two leaves the file while
  the other is still installed (see "Removing one agent" below)
- `.agents/agents/grugops-orchestrator.md` — Antigravity CLI's launch agent, picked as the primary
  agent in the `/agents` panel (see "Using grugops on Antigravity CLI"). It is Antigravity CLI's
  only: an install for Codex CLI alone does not write it, and uninstalling Codex CLI keeps it. It is
  a pointer with no role text, under the frontmatter Antigravity CLI reads, and
  install writes it by the same rules as the skill: created where nothing is, install's own unedited
  copy refreshed, and anything else (a file you wrote, or install's copy that you edited) left
  untouched and not recorded, so the uninstaller leaves it too. Install records it in the install
  ledger in `.grugops/install.json`, with only the directories this install created, and
  `DRY_RUN=1` lists it as `would-add`. Nothing makes it the session default

**OpenCode** (`--opencode`), only when OpenCode is chosen:

- `.opencode/commands/grugops.md` — a command OpenCode reads from `.opencode/commands/`
  (`/grugops <request>`), written by the same rules as the skill above
- `.opencode/agents/grugops-orchestrator.md` — OpenCode's launch agent, a primary agent started
  with `opencode --agent grugops-orchestrator` (see "Using grugops on OpenCode"). It is a pointer with
  no role text, under the frontmatter OpenCode reads, and
  install writes it by the same rules as the skill: created where nothing is, install's own unedited
  copy refreshed, and anything else (a file you wrote, or install's copy that you edited) left
  untouched and not recorded, so the uninstaller leaves it too. Install records it in the install
  ledger in `.grugops/install.json`, with only the directories this install created, and
  `DRY_RUN=1` lists it as `would-add`. Nothing makes it the session default: install writes no
  `default_agent` into `opencode.json`
- `opencode.json` — the OpenCode `external_directory` rule, so OpenCode does not ask its
  `external_directory` question before a tool call on the kit path. OpenCode asks before a tool call
  touches a path outside the working directory unless a `permission.external_directory` rule allows
  it. The rule allows every tool call OpenCode gates by `external_directory` on the kit path, edits
  included; whether OpenCode's separate `edit` permission still asks before an edit there is
  `UNKNOWN - verify`. Install prints that sentence as a `note` whenever it writes, finds or proposes
  the rule. Install adds one rule for the kit root, home-relative, for example `"~/.grugops/agent-factory/**": "allow"`. It is appended as the last
  member of `permission.external_directory`, because OpenCode uses the last matching rule
  (opencode.ai/docs/permissions/, retrieved 2026-10-11). Install creates `opencode.json` holding only
  that rule when the repository has none, and adds `permission` or `external_directory` when either is
  absent; every other byte of your file is kept. The rule is recorded in the install ledger in
  `.grugops/install.json`, and uninstall takes out exactly that rule (and the file, `permission` or
  `external_directory` install created, once empty again) only while `external_directory` is still
  what install left there; a rule you added there since makes uninstall leave the file byte for byte
  and say so. A rule for the same pattern already there is yours: install adds nothing and records
  nothing. Install writes no rule, and prints the rule to add by hand as a `note`, when the kit is not
  under your home directory (no absolute path is written into the file), when the kit path holds a
  glob or control character, when `opencode.json` is JSONC (comments or trailing commas: OpenCode
  accepts them, install edits strict JSON only), has a duplicate key or a `permission` or
  `external_directory` that is not an object, is a link or a special file, or when only
  `opencode.jsonc` exists (install does not create a second config file). OpenCode still reaches the
  kit then; it asks before each tool call on the kit path. How this project rule combines with an `external_directory`
  rule in your global OpenCode config is `UNKNOWN - verify`

**GitHub Copilot CLI** (`--copilot`), only when Copilot is chosen:

- a `.github/copilot-instructions.md` pointer block for GitHub Copilot CLI, by the same rules as `CLAUDE.md` and naming
  the same kit route: when the file does not exist, install creates it and records that, and the
  block, in the install ledger in `.grugops/install.json`
- `.github/agents/grugops-orchestrator.agent.md` — GitHub Copilot CLI's launch agent, a custom agent
  started with `copilot --agent grugops-orchestrator` or picked with `/agent` (see "Using grugops on
  GitHub Copilot CLI"). It is a pointer with no role text, under the frontmatter Copilot CLI reads,
  and install writes it by the same rules as the skill: created where nothing is, install's own unedited
  copy refreshed, and anything else (a file you wrote, or install's copy that you edited) left
  untouched and not recorded, so the uninstaller leaves it too. Install records it in the install
  ledger in `.grugops/install.json`, with only the directories this install created, and
  `DRY_RUN=1` lists it as `would-add`. Nothing makes it the session default

**Pi** (`--pi`), only when Pi is chosen:

- `.pi/prompts/grugops.md` — a short Pi prompt template, written when Pi is chosen. It is a
  pointer: it tells Pi to read `AGENTS.md`, then
  `agent-factory/roles/orchestrator.md`, and act as the Orchestrator, it names the kit route (the
  `kitRoot` field of `.grugops/install.json`), and it passes your request through. It holds no role
  text. Install records the file in the install ledger in `.grugops/install.json`, and records the
  `.pi` and `.pi/prompts` directories only when this install created them. A file already at that
  path that is not install's own unedited copy (one you wrote, or install's that you edited) is left
  untouched and not recorded, so the uninstaller leaves it too. `DRY_RUN=1` lists the template as
  `would-add` and writes nothing. How to use it, and what Pi asks first, is in "Using grugops on Pi"
  below
- `.pi/grugops-orchestrator.md` — Pi's launch file, passed as
  `pi --append-system-prompt .pi/grugops-orchestrator.md` (see "Using grugops on Pi"). The flag reads
  the file into Pi's system prompt without Pi's project-trust check, so only use it in a repository
  you trust. It is a
  pointer with no role text and no frontmatter, and
  install writes it by the same rules as the skill: created where nothing is, install's own unedited
  copy refreshed, and anything else (a file you wrote, or install's copy that you edited) left
  untouched and not recorded, so the uninstaller leaves it too. Install records it in the install
  ledger in `.grugops/install.json`, with only the directories this install created, and
  `DRY_RUN=1` lists it as `would-add`. Nothing makes it the session default: Pi reads it only when
  the flag names it, and install never writes `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`

Whether Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI or Pi loads its entry in a live
session is `UNKNOWN - verify` until a live run shows it. The Pi template, the skill, the command and
the launch agents (the Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi files above; Codex CLI
has none) are copied from committed files in the kit, which `scripts/generate-host-entries.ts`
renders from one pointer file, `agent-factory/packaging/host-entry.pointer.md`.

**Install only adds.** Naming fewer agents than are installed in a repository keeps every other
agent's files byte for byte and keeps their records in `.grugops/install.json`; install never removes
an agent's files because it was not named. The run's closing notes name the agents left installed
and give the uninstall command that removes one (see "Removing one agent" below). An agent recorded
as chosen that has nothing installed here (the install ledger records nothing of install's for it,
and its entry file is not present, as when an earlier run refused its every write) is never called
left installed: the closing notes name it on its own line, with the install command that installs it
and the uninstall command that takes it out of the record. For each agent the
run was for, the closing notes also name what the install record holds for it and how that host's
documentation says to start grugops. They give a host's launch form (for example
`opencode --agent grugops-orchestrator`) only when install wrote its launch file in this run or
already owns the file there. When that file is your own, or install could not write it, the notes say
so and give no launch form, because the form would start that file and not the grugops
Orchestrator. grugops has not run those invocations on a live host, and the notes say
`UNKNOWN - verify`.

On a re-install, install replaces its own copy of the `CLAUDE.md` block, the Copilot block, each
whole-file host entry above (the Pi template, the agent skill, the OpenCode command and the launch
agents) and an
`AGENTS.md` it created when the install ledger record for it still holds (nobody edited it since) and its text is not the current text, and records the new bytes, so uninstall
still removes exactly what install wrote; `DRY_RUN=1` lists such a file as `would-refresh`. A file
you wrote or edited is never written: when it lacks the kit route, install prints a `note` that
names it, the hosts it leaves without a route to the kit, and the sentence to add.

In the **shared kit root** (`${GRUGOPS_HOME:-$HOME/.grugops}`):

- `agent-factory/` — the read-only kit, copied once and shared across repos. A re-install replaces
  the kit the kit-home record names with a fresh copy, so an edit made inside it is overwritten (see
  "Re-installing" above)
- `.grugops-kit.json` — the kit-home record: the kit home's real path, and what install wrote there
  (the kit, and each backup it made with a record of its content)
- `agent-factory.bak.<ISO>` — anything at `agent-factory/` that the record does not name as install's
  kit (a directory of yours, a link, a file) is renamed aside to this name and recorded, never deleted.
  `--update` also keeps a recorded kit that differs from the new one under this name
- `.agent-factory.tmp-XXXXXX` and `.agent-factory.old-XXXXXX` — directories install creates while it
  swaps the kit in, and removes again; one is left only when a step fails, and the `verify` line names
  it

It never overwrites or deletes any file you own. Existing seeded state is left byte-untouched on
re-install (skip-if-exists), and `agent-factory/`, `plans/`, `.planning/`, `docs/`, and `src/`
in your target are never modified beyond the additive edits above: install refuses to run when the
kit home overlaps the target (see the exit-code section above), so the kit is never written into, and
never replaces, anything in your repository. A path the installer reads or
writes that is not what it expects (a FIFO, a directory, a device, a symbolic link it did not make,
or a hard link) is skipped and reported as a `verify` line, never read or written through, so the
installer cannot hang on it (see the exit-code paragraph above).

### How a host finds the kit after a scripted install

The scripted install puts the kit in the shared kit root, not in your repository, so a pointer that
names `agent-factory/roles/orchestrator.md` does not resolve inside the repository after it. Every
install writes the kit root into the `kitRoot` field of `.grugops/install.json`. One sentence, the
kit route (`KIT_ROUTE` in `install/host-tools.ts`), says that the kit root is that directory and
that each `agent-factory/…` path is read under it. The kit's `AGENTS.md` carries the route in its
"Kit vs state" rule, for the hosts that read only `AGENTS.md`, and the `CLAUDE.md` block, the
Copilot pointer and each whole-file host entry (the Pi template, the agent skill, the OpenCode
command and the launch agents `.agents/agents/grugops-orchestrator.md`,
`.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md` and
`.pi/grugops-orchestrator.md`) carry it after their start-here sentence. The route is the same
text on every machine: it names the field, never a path. Inside a Claude Code session the adapters
still name the kit root on their `KIT=` line. With no `.grugops/install.json` (the minimal copy
install, §1), the kit is the repository's own `agent-factory/`.

`node install/install.js --check --target /path/to/repo` follows the route the way an agent does. It
reads every file first and reports afterwards, in this order:

- **The agents it reports on.** `--check` speaks only for the agents installed in the target: the
  agents `.grugops/install.json` records, or, for a marker written before that record existed that
  still holds install's ledger, Claude Code, GitHub Copilot CLI and Pi (the agents every earlier
  install wrote for). Only their files are asked about below, only they get a `reach` line, and only
  their files can give a counted finding; a file that no installed agent reads is not reported.
  A recorded agent with nothing installed here (the install ledger records nothing of install's for
  it, and its entry file, such as `.pi/prompts/grugops.md` for Pi, is not present) gets no `reach`
  line and no counted finding; one `note` names it with the command that writes its entry, for
  example `node /path/to/grugops/install/install.js --target /path/to/repo --pi`. The note says where the
  agent came from: recorded in `.grugops/install.json` as chosen, or, for a marker with no `agents`
  list, counted as installed by an install made before this release. When the install ledger is
  malformed, `--check` cannot tell what install wrote: it reports the ledger as a `FAIL`, gives no
  agent this note, and every recorded agent keeps its `reach` line. An agent whose entry file is there,
  even your own file, keeps its `reach` line. When
  nothing is recorded (no marker, a marker install cannot use here, or an older marker with no
  ledger), `--check` reports the agents detected in the target instead and says so in a `note`. An agent id the marker records and this version does not know is named in
  a `note` and gets no `reach` line. The Claude Code checks (the adapters' `KIT=` line in the
  kit-root cross-check, the stat lines that name an adapter, and adapter staleness) run only when
  Claude Code is installed; without it, the kit-root cross-check compares the marker's `kitRoot` with
  the kit root of the kit home `--check` reads.
- **The kit home it reads.** `--check` reads one kit home for its header (`home:` and `kit:`), its
  kit-root cross-check and its checks of the kit: the kit home install recorded in the marker, or,
  with no marker it can use, the kit home of the `--check` run (`GRUGOPS_HOME`, else `~/.grugops`).
  It is the kit home its printed commands state, so a plain `--check` on an install with another kit
  home does not report a stale or moved install for that reason alone. When the run's own kit home
  is a different one, a `given:` line in the header names it as not used.
  A kit home you moved by hand is reported when `--check` is given the new kit home through
  `GRUGOPS_HOME` and three things show the move: the given kit home holds a kit, its kit-home
  record (`.grugops-kit.json`) was written for the recorded kit home, and nothing is at the recorded
  path. Then the kit-root cross-check prints a `kit home moved` FAIL that names both kit homes. A
  recorded kit home that was deleted, or that is still there without its `agent-factory`, is
  reported as the missing kit, never as moved to another kit home, which another repository may
  use. The moved-kit FAIL's remedy writes no kit: move the kit home back to the recorded one, then
  run the check command the line prints. The line also says that the install commands `--check`
  prints on its other lines copy a kit to the recorded kit home, so following one before the move
  back leaves a second kit. A plain `--check`, given no
  `GRUGOPS_HOME`, does not detect a moved kit home: it fails on the absent kit, and its install
  commands copy a kit to the recorded kit home.

- **The route target.** It reads `kitRoot` and reports a FAIL when
  `<kitRoot>/roles/orchestrator.md` is not a readable file.
- **The files each host reads here.** The files that can give a host's default session the route
  are `AGENTS.md`, `CLAUDE.md`, `.agents/skills/grugops/SKILL.md`, `.opencode/commands/grugops.md`,
  `.github/copilot-instructions.md` and `.pi/prompts/grugops.md`. A host counts a file only when it
  reads that file in this repository. Antigravity CLI reads `AGENTS.md` natively, with
  no settings entry (antigravity.google/docs/rules/ and antigravity.google/docs/cli/gcli-migration/,
  retrieved 2026-10-11), and the agent skill it shares with Codex CLI. Install detects Antigravity
  CLI by a `.gemini` entry in the target root, the signal the Gemini CLI row used; whether Antigravity
  CLI itself uses a project-level `.gemini/` is `UNKNOWN - verify`, and its documented project
  directory, `.agents/`, is not a detect signal because Codex CLI, GitHub Copilot CLI, OpenCode and Pi
  read it too and install creates it.
- **The launch files.** A launch file (`.agents/agents/grugops-orchestrator.md`,
  `.opencode/agents/grugops-orchestrator.md`, `.github/agents/grugops-orchestrator.agent.md` or
  `.pi/grugops-orchestrator.md`, each one host's own) is read only by a session started with it,
  never by a default session or a typed `/grugops`. Codex CLI has none. So it is not a route carrier:
  no `reach` line names it, and a file a default session reads that lacks the route is counted
  whatever the launch file holds. `--check` gives each launch file of an installed agent a line of
  its own, worded "a session started with" that host's launch form: `ok` when it carries the route;
  a FAIL when it is install's own copy from an earlier install without the route, whose remedy is to
  re-run `install.js`; a WARN when install will not write the route into it (your own file, or a
  link) or it could not be read; and an uncounted `note` when it is not present.
- **The files without the route.** Such a file is counted only when it leaves some host without a
  route: a host that reads it reads no other file holding the route and, for Claude Code, has no
  adapter route. `--check` names re-running `install.js` exactly when an install run on the same
  state would write the file: refresh install's own copy, append install's block to `CLAUDE.md` or
  the Copilot pointer when the file has none, or create an absent file. Install and `--check` ask
  the same rule (`installWouldWrite` in `install/install.ts`). Otherwise the line gives the reason
  and the remedy. A counted file is reported as follows:
  - install's own unedited copy from an earlier install, which re-running `install.js` would
    replace, is a FAIL whose remedy is to re-run `install.js`;
  - `CLAUDE.md` or `.github/copilot-instructions.md` with neither install's block nor the route is a
    WARN whose remedy is to re-run `install.js`, which appends install's start-here block, and the
    block carries the route;
  - the `AGENTS.md` link a `--symlink` install made (the install ledger records the link) is a WARN
    whose remedy is to remove the link at `AGENTS.md` and re-run `install.js`, which links or copies
    the current kit `AGENTS.md`. The file the link points to is in a grugops checkout outside the
    repository, so it is never the file to edit. A re-install gives the same reason and remedy
    (`linkOwnership` in `install/install.ts`);
  - any other file without the route (your own, install's copy that you edited, a link install did
    not make, a file that holds a second copy of install's block) is a WARN that gives the reason
    install will not write the route into it and quotes the sentence to add, after the start-here
    sentence if the file has one;
  - an absent file is a WARN, which names re-running `install.js` only when install would create the
    file there, and otherwise the reason install will not;
  - a file that cannot be read (a directory, a FIFO, a device or an oversized file) is a WARN that
    says no verdict was reached on it.
- **Files whose hosts have the route another way.** A file without the route whose hosts all reach
  the Orchestrator through another file, or, for Claude Code, through its adapters, is an uncounted
  `note` that says how each of those hosts has the route and keeps the remedy. `--check --strict`
  does not fail on it.
- **The `reach` lines.** Last, it prints one `reach` line per installed agent, saying whether that
  host reaches the Orchestrator and through which of these files (for Claude Code, also through the
  adapters' `KIT=` line). A host that cannot reach always has a counted finding behind it, and a
  counted finding always has a host that cannot reach behind it.

**The shared skill and the agents that were not chosen.** An install for `--codex` or
`--antigravity` puts `.agents/skills/grugops/SKILL.md` in the repository, and three other agents
read that directory too: GitHub Copilot CLI
(docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills), OpenCode
(opencode.ai/docs/skills/) and Pi (`github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md`),
all retrieved 2026-10-11. So, when Codex CLI or Antigravity CLI is chosen, Copilot CLI, OpenCode
and Pi can see that skill even when they were not chosen. With Claude Code also installed, OpenCode
and Copilot CLI read both `.claude/skills/` and `.agents/skills/`, so they see two skills named
`grugops` (`.claude/skills/grugops/` and `.agents/skills/grugops/`); which one they offer is
`UNKNOWN - verify`, and the live check that would show it is queued for phase 34.1
(`.planning/phases/34.1-per-agent-installer/34.1-VALIDATION.md`, "Manual-Only Verifications").

The `reach` lines report what the files say, not a run of the host. Whether a live host other than Claude Code follows them is
`UNKNOWN - verify` until a run on that host shows it; those runs are backlog item 999.4 in
`.planning/ROADMAP.md`.

### Using grugops on Codex CLI

Install Codex CLI itself; grugops does not install it. An install that chooses Codex CLI (`--codex`)
writes `.agents/skills/grugops/SKILL.md`, a skill. Codex CLI reads repository skills from
`.agents/skills/`, and a skill is not a slash command there: type `$grugops <request>` to mention the
skill, or pick `grugops` from the `/skills` list. (Source: learn.chatgpt.com/docs/build-skills,
retrieved 2026-10-11.)

The skill is a pointer, with no role text: it sends Codex to `AGENTS.md` and then
`agent-factory/roles/orchestrator.md`, and it names the kit route, the `kitRoot` field of
`.grugops/install.json` (see "How a host finds the kit after a scripted install" above). Codex CLI also
reads `AGENTS.md` itself, and the kit's `AGENTS.md` carries the same route.

- **What is not known.** Whether Codex CLI asks for project trust before it loads a repository skill
  is `UNKNOWN - verify`: its skills documentation says nothing about it. Whether Codex follows the
  route to the Orchestrator on a live run is `UNKNOWN - verify` until the live run queued as a human
  check for phase 34.1 passes (`.planning/phases/34.1-per-agent-installer/34.1-VALIDATION.md`,
  "Manual-Only Verifications").
- **The same file serves Antigravity CLI.** Antigravity CLI reads `.agents/skills/` too, so an install
  for either agent writes the one file, and uninstalling one of them keeps it while the other is still
  installed (see "Removing one agent" under Undo).
- **Safety on Codex CLI** is in §5, "Other tools": the git host is the hard floor there.

### Using grugops on Antigravity CLI

Install Antigravity CLI itself (its binary is `agy`); grugops does not install it. An install that
chooses Antigravity CLI (`--antigravity`) writes `.agents/skills/grugops/SKILL.md`, the same skill
file Codex CLI reads. Antigravity CLI loads workspace skills from `<workspace-root>/.agents/skills/`
and turns each skill into a slash command, so start it at the repository root and type
`/grugops <request>`. (Source: antigravity.google/docs/skills/, retrieved 2026-10-11.) It also reads
`AGENTS.md` natively, with no settings entry (antigravity.google/docs/rules/ and
antigravity.google/docs/cli/gcli-migration/, retrieved 2026-10-11), and install never reads or writes
`.gemini/settings.json` or `.gemini/skills/`.

The skill is a pointer, with no role text: it sends Antigravity to `AGENTS.md` and then
`agent-factory/roles/orchestrator.md`, and it names the kit route, the `kitRoot` field of
`.grugops/install.json`. The kit is outside the repository after a scripted install.

**Starting the session as the Orchestrator.** The same install also writes the launch agent
`.agents/agents/grugops-orchestrator.md`, a workspace custom agent. Its frontmatter has four fields:
`name: grugops-orchestrator`, a `description`, `mainAgent: true` and `subagent: false`. Its body is
the same pointer, with no role text. Antigravity CLI reads workspace custom agents from
`.agents/agents/<name>.md`, and you pick one as the primary agent in the `/agents` panel: pick
`grugops-orchestrator` there. (Source: antigravity.google/docs/subagents/, retrieved 2026-10-18.)
`subagent: false` keeps it from being called through the `invoke_subagent` tool. agy 1.3.5 `--help` also
lists `agy --agent grugops-orchestrator` ("Agent for the current CLI session"), but whether that flag
resolves a workspace agent file is `UNKNOWN - verify`, so this guide leads with the panel. The
session still loads roles one at a time (the sequential role-load model, §6 "Degraded"): a launch
agent does not give it the spawning of Claude Code's Full tier. The launch agent is Antigravity
CLI's only: an install for Codex CLI alone does not write it, and uninstalling Codex CLI keeps it
(see "Removing one agent" under Undo).

- **What is not known.** Whether Antigravity CLI reads the kit outside the workspace, and whether it
  asks permission before each such read, is `UNKNOWN - verify`. The detect signal install uses for
  Antigravity CLI, a `.gemini` entry in the repository root, is `UNKNOWN - verify` (see "Which agents
  an unattended install is for"). Whether it follows the route to the Orchestrator on a live run is
  `UNKNOWN - verify` until the live run queued as a human check for phase 34.1 passes
  (`.planning/phases/34.1-per-agent-installer/34.1-VALIDATION.md`, "Manual-Only Verifications").
- **Safety on Antigravity CLI** is in §5, "Other tools": its approval behaviour is `UNKNOWN - verify`,
  and the git host is the hard floor.

### Using grugops on OpenCode

Install OpenCode itself; grugops does not install it. An install that chooses OpenCode (`--opencode`)
writes the command `.opencode/commands/grugops.md`. OpenCode loads project commands from
`.opencode/commands/` and names each after its file, so start it at the repository root and type
`/grugops <request>`. (Source: opencode.ai/docs/commands/, retrieved 2026-10-11.) The command is a
pointer, with no role text: it sends OpenCode to `AGENTS.md` and then
`agent-factory/roles/orchestrator.md`, and it names the kit route, the `kitRoot` field of
`.grugops/install.json`.

**Starting the session as the Orchestrator.** The same install also writes the launch agent
`.opencode/agents/grugops-orchestrator.md`, a primary agent: its frontmatter is a `description` and
`mode: primary`, and its body is the same pointer, with no role text. OpenCode reads per-project
agents from `.opencode/agents/` and names each after its file (opencode.ai/docs/agents/, retrieved
2026-10-18). Start it from the repository root with `opencode --agent grugops-orchestrator`, which
opencode.ai/docs/cli/ (retrieved 2026-10-18) lists for the default command. OpenCode v2.0.28's
`opencode --help` does not list `--agent` on the default command, so whether the terminal interface
takes the flag is `UNKNOWN - verify`. In a running session, Tab switches between primary agents
(opencode.ai/docs/agents/), so you can Tab to `grugops-orchestrator` instead. Install leaves
OpenCode's default agent as it is: it writes no `default_agent` into `opencode.json`. The session still loads roles one at a time (the
sequential role-load model, §6 "Degraded"): a launch agent does not give it the spawning of Claude
Code's Full tier.

- **The OpenCode `external_directory` rule.** The kit is outside the repository, and OpenCode asks before a tool call
  touches a path outside its working directory. So install also adds one rule to the project
  `opencode.json`, a `permission.external_directory` allow rule for the kit root, written
  home-relative (opencode.ai/docs/permissions/, retrieved 2026-10-11). Install writes no rule, and
  prints the rule to add by hand as a `note`, when the kit is not under your home directory, when the
  kit path holds a glob or control character, when `opencode.json` is JSONC, has a duplicate key or a
  `permission` or `external_directory` that is not an object, is a link or a special file, or when
  only `opencode.jsonc` exists. OpenCode then still reaches the kit, asking before each tool call on
  the kit path. The rule allows every tool call OpenCode gates by `external_directory` on the kit
  path, edits included; whether OpenCode's separate `edit` permission still asks before an edit there
  is `UNKNOWN - verify`. The full rule is under "What the installer touches (per-repo), and only
  this".
- **What is not known.** How this project rule combines with an `external_directory` rule in your
  global OpenCode config is `UNKNOWN - verify`, and so is whether it applies to a session started as
  the `grugops-orchestrator` agent. OpenCode also reads skills from `.claude/skills/` and
  `.agents/skills/` (opencode.ai/docs/skills/, retrieved 2026-10-11); which `grugops` it offers when
  more than one is present is `UNKNOWN - verify` (see "How a host finds the kit after a scripted
  install"). Whether OpenCode follows the route to the Orchestrator on a live run is
  `UNKNOWN - verify` until the live run queued as a human check for phase 34.1 passes
  (`.planning/phases/34.1-per-agent-installer/34.1-VALIDATION.md`, "Manual-Only Verifications").
- **Safety on OpenCode** is in §5, "Other tools": the OpenCode `external_directory` rule governs no
  command, and the git host is the hard floor.

### Using grugops on GitHub Copilot CLI

Install GitHub Copilot CLI itself; grugops does not install it. An install that chooses Copilot
(`--copilot`) writes two files and no command. It appends a start-here pointer block to
`.github/copilot-instructions.md`, creating the file when there is none. Copilot CLI reads that file
together with `AGENTS.md` and its other instruction files
(docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions, retrieved
2026-10-11), so in a default session its instructions point it at `AGENTS.md`, then
`agent-factory/roles/orchestrator.md` and the kit route. Ask it for the work you want done.

**Starting the session as the Orchestrator.** The same install writes the custom agent
`.github/agents/grugops-orchestrator.agent.md`: its frontmatter is `name: grugops-orchestrator` and a
`description`, and its body is the same pointer, with no role text. Copilot CLI reads project custom
agents from `.github/agents/`, one Markdown file with an `.agent.md` extension each, and the agent's
ID is the file name without that extension. Start a session as it with
`copilot --agent grugops-orchestrator`, or pick it with `/agent` in an interactive session. (Source:
docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli,
retrieved 2026-10-18.) The file sets no `tools`, and an agent with `tools` unset gets all tools; it
sets no `target` either, so Copilot's cloud agent and VS Code see the same file (Source:
docs.github.com/en/copilot/reference/custom-agents-configuration, retrieved 2026-10-18). An agent
file is not a command. The session still loads roles one at a time (the sequential role-load model,
§6 "Degraded"): a launch agent does not give it the spawning of Claude Code's Full tier.

- **A skill when the shared skill is installed.** Copilot CLI also reads project skills from
  `.agents/skills/`, and a skill is used by its name preceded by a forward slash
  (docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills, retrieved
  2026-10-11). So an install for `--codex` or `--antigravity`, which writes
  `.agents/skills/grugops/SKILL.md`, would give Copilot CLI `/grugops` as well.
- **What is not known.** grugops has made no live run on Copilot CLI: whether it follows the pointer,
  the skill or the launch agent to the Orchestrator is `UNKNOWN - verify`, and so is which `grugops`
  skill it offers when Claude Code's `.claude/skills/grugops/` is also present.
- **Safety on GitHub Copilot CLI** is in §5, "Other tools": the git host is the hard floor.

### Using grugops on Pi

Install Pi itself from [pi.dev](https://pi.dev); grugops does not install it. Start Pi from the
repository root and type `/grugops <request>`. Pi turns the template `.pi/prompts/grugops.md` into
the `/grugops` command, and the command sends Pi to `AGENTS.md` and then
`agent-factory/roles/orchestrator.md` with your request.

After a scripted install, the template also names where the kit is: the `kitRoot` field of
`.grugops/install.json`, which every install writes, with `agent-factory/roles/orchestrator.md` read
as `<kitRoot>/roles/orchestrator.md` (see "How a host finds the kit after a scripted install"
above). `AGENTS.md` carries the same route. `node install/install.js --check --target /path/to/repo`
prints a `reach` line for Pi that says whether these files lead to the Orchestrator. Whether Pi
follows the route on a live run is `UNKNOWN - verify` until the re-run recorded in
`.planning/phases/34-model-effort-dial-pi-support/34-UAT.md`.

- **Start Pi from the repository root.** Pi looks for the `.pi/prompts` directory only in the
  directory it was started in, so `/grugops` is missing when Pi starts in a subdirectory.
  `AGENTS.md` still loads from any subdirectory, because Pi reads context files from the working
  directory and every directory above it. (Source:
  `github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/prompt-templates.md` and
  `configuration.md` § Context files; retrieved 2026-10-06.)
- **Pi asks for project trust first.** Pi loads project prompt templates only after you grant
  project trust, so it asks for that decision when it starts in a repository that holds the
  template. In print, JSON and RPC modes with the default `defaultProjectTrust: "ask"`, Pi skips
  project templates, and `/grugops` is not available there. (Source:
  `github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md` and
  `prompt-templates.md`; retrieved 2026-10-06.)
- **Starting Pi as the Orchestrator.** The same install writes the launch file
  `.pi/grugops-orchestrator.md`: the same pointer, with no role text and no frontmatter, because Pi
  appends the whole file to its system prompt. Start Pi at the repository root with
  `pi --append-system-prompt .pi/grugops-orchestrator.md`. Pi 1.1.0 `--help` says the flag appends
  "text or file contents" to the system prompt. Four facts from Pi's resource loader
  (`github.com/earendil-works/pi` `packages/coding-agent/src/core/resource-loader.ts` @ 482c1381,
  retrieved 2026-10-18) matter here. First, Pi reads the file only when the flag names it; it never
  loads `.pi/grugops-orchestrator.md` on its own. Second, the path is read against the directory Pi
  starts in, and a path that does not name an existing file is appended silently as the literal
  text `.pi/grugops-orchestrator.md`, so started from a subdirectory Pi gets no pointer and gives no
  error. Third, passing the flag skips your own `.pi/APPEND_SYSTEM.md`, and the global one, for that
  session. Fourth, the flag's file is read whether or not you granted project trust; only the files
  Pi finds on its own wait for trust.
  **Warning: `--append-system-prompt` reads the repository file into Pi's system prompt without Pi's
  project-trust check, so only use this command in a repository you trust.** In a repository someone
  else can change, read `.pi/grugops-orchestrator.md` before you start Pi this way. The session still loads roles one at a time (the sequential
  role-load model, §6 "Degraded"): a launch file does not give Pi the spawning of Claude Code's
  Full tier. Whether a live Pi session started this way reaches the Orchestrator is
  `UNKNOWN - verify`.
- **What grugops does not write for Pi.** grugops never writes `.pi/SYSTEM.md`,
  `.pi/APPEND_SYSTEM.md` or `.pi/settings.json`, and writes no Pi-specific skill and no Pi
  extension. It adds two files under `.pi/`: the template `.pi/prompts/grugops.md` and the launch
  file `.pi/grugops-orchestrator.md`, which Pi reads only when `--append-system-prompt` names it, so
  no Pi session becomes the Orchestrator unless you start it that way. When the same install also
  chooses
  `--codex` or `--antigravity`, the shared `.agents/skills/grugops/SKILL.md` is in the repository,
  and Pi loads skills from `.agents/skills/` too and offers that one as `/skill:grugops`
  (`github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md`, retrieved
  2026-10-11). It does not collide with the template's `/grugops`.
- **The model and effort dials do not reach Pi.** The scope of both dials is stated once, in
  `agent-factory/packaging/subagent.frontmatter.md`, section "Host-CLI scope of the model and
  effort dials". Read it there.
- **Safety on Pi** is in §5, "Other tools": the git host is the only hard control there.

Pi's own conventions, with their sources, are recorded in `agent-factory/packaging/adapters.md`,
section "Pi (pi.dev) conventions".

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

`uninstall.js` reverses what the install ledger in `.grugops/install.json` records, whichever
grugops version or checkout you run it from. It removes **only** the grugops-owned wiring install
added to the target: the skills, the Orchestrator wrapper and the materialized resolver adapters that
still hold what install wrote to them (see the kit-file record below), the sentinel-delimited
`CLAUDE.md` and Copilot pointer blocks (the rest of those files stays exactly as it was), the
`AGENTS.md` entry an install made before 34.1 D-12 added to the Gemini settings (or, in a Gemini
settings file such an install created, the `context.fileName` list it wrote), the Claude Code ask
rules it added (§5; a rule you had before
install stays), the runnable checks under `tools/grugops/` that still hold what it wrote, and the
`.grugops/install.json` marker once nothing it records is left. It removes the Pi template
`.pi/prompts/grugops.md` only while the template still holds what install wrote, and removes
`.pi/prompts` and `.pi` only when install created them and they are empty. The agent skill
`.agents/skills/grugops/SKILL.md` and the OpenCode command `.opencode/commands/grugops.md` are removed
by the same rule, and the OpenCode `external_directory` rule install added to `opencode.json` is taken out as described
under "What the installer touches (per-repo), and only this".

#### Removing one agent

```sh
node install/uninstall.js --target /path/to/repo --codex
```

`uninstall.js` takes the same per-agent flags as `install.js` (`--claude`, `--codex`, `--antigravity`,
`--opencode`, `--copilot`, `--pi`, one per agent in the registry). With one or more of them, it removes
only what the install ledger records for the agents you name, and every removal still checks the
record first, as described below.

- **A file two agents share stays while either of them is installed.** Codex CLI and Antigravity CLI
  both read `.agents/skills/grugops/SKILL.md`, so `--codex` leaves it while Antigravity CLI is
  installed. Removing the last of the two removes it, and the `.agents` directories install created
  with it.
- **A launch agent belongs to its host alone.** `--antigravity` removes
  `.agents/agents/grugops-orchestrator.md`, and the `.agents/agents` directory when install created
  it, even while Codex CLI stays installed; `--codex` leaves it. `--opencode`, `--copilot` and `--pi`
  each remove only their own launch file.
- **The shared files go only with a flag-less uninstall, or when you remove the last installed
  agent.** These are the kit's `AGENTS.md` copy, the runnables under `tools/grugops/`, the install
  marker, and the Gemini settings change an install made before 34.1 D-12.
- **The marker is kept and lists the agents that stay.** The entries this run removed leave the
  install ledger in `.grugops/install.json`, and its `agents` list drops the agents you removed. The
  closing line names both sets, for example `== uninstall complete — agents removed: Codex CLI; still
  installed: Claude Code ==`.
- **An agent whose recorded file you edited stays in the `agents` list.** The run leaves that file
  byte for byte, names it on a `left` line, and prints the command that finishes the reversal, for
  example `node /path/to/grugops/install/uninstall.js --target /path/to/repo --claude`. Run it once
  you have removed or restored the file. Until then the closing line names the agent as not finished, for example
  `== uninstall complete — 1 recorded item(s) left in place; .grugops/install.json kept to record
  them — agents removed: none; not finished, still recorded: Claude Code; still installed: Codex CLI ==`.
  To keep the edited file instead, take its entry out of the `ledger` list in `.grugops/install.json`
  by hand and run the printed command; never delete the marker, which still records the agents that stay.
- **A flag-less uninstall that leaves a recorded file prints the flag-less command.** The agents
  that own the file stay recorded; a file no agent owns (the kit's `AGENTS.md` copy, `tools/grugops/`)
  keeps no agent recorded. Run the printed command once the file is removed or restored.
- **A `verify` line that asks you to fix something first prints the same command, by the script's
  absolute path.** A `.claude/settings.json` that is not a JSON object, or a malformed install ledger, is left
  untouched; the `verify` line names the cause and the same command, `--target` and agent flags
  included, to run again once the cause is fixed. It never tells you to run a flag-less uninstall
  after a per-agent one: a flag-less uninstall removes every agent.
- **A flag for an agent that is not installed here changes nothing.** A `note` line says so, and the
  run exits `0`. "Installed" here means what the marker records: its `agents` list, the agents
  chosen for the repository and not yet removed, or, for an install made before 34.1, the agents
  described in "Which agents an unattended install is for". It never means what is on disk.

**The record decides, not the kit source.** The uninstaller walks every entry of the install ledger
and reverses each one only while it still holds what install recorded. A recorded file that still
holds what install wrote (its bytes and mode, or its link) is removed and named on a `removed` line,
even when the checkout you run the uninstaller from no longer ships it or ships other bytes (another
grugops version, or another checkout). A recorded file you edited is left byte for byte and named on
a `left` line. A grugops-shaped file with no record (a skill or adapter name, `AGENTS.md`, a
runnable, a pointer block or a settings file install has no record of) is left and named on a `left`
line, and nothing is removed on its name or its bytes. The kit source of the checkout you run the
uninstaller from is read only to word those `left` lines; if it cannot be read, a `note` line says
that report was skipped, and nothing else changes, because no removal depends on it. A `--symlink`
install is reversed from any checkout: the record keeps each link's own target.

A file is deleted only on install's own record. Install records in the install ledger in
`.grugops/install.json` each file it created where nothing was before: `CLAUDE.md` and
`.github/copilot-instructions.md` when it created them to hold its pointer block, the `AGENTS.md`
it copied or linked in, and the runnables under `tools/grugops/`. The uninstaller deletes `CLAUDE.md`
or the Copilot file only when that record lists it, it removed the grugops block from it in this
run, and the file is blank afterwards. It deletes `AGENTS.md` or a runnable only when the record
lists it and it is still the copy (or, for `AGENTS.md`, the link) install made. The record decides
every file alone: one that still holds what install wrote is removed even when the checkout you run the
uninstaller from no longer ships it or ships other bytes, and one that does not is left. The record keeps
what install wrote to each file (a sha256 of the bytes and the file's mode as install left it, or the
target of the link), and a file is deleted only while it still holds exactly that: a file you edited
or replaced since, or whose mode you changed (`chmod`), is left and reported. A record written before
the mode was recorded has only the sha256; the uninstaller then compares the bytes alone and its
`removed` line says so. The same holds for the skill and adapter records in the install ledger in
`.grugops/install.json` and for a Gemini
settings file an install made before 34.1 D-12 created. A re-install keeps an earlier entry only while the file still holds what the record says
and the re-install did not have to add its pointer block to it, so a file you deleted and then made
again yourself is dropped from the record and left by the uninstaller. A file whose bytes are
exactly the ones install wrote holds nothing of yours, so it is treated as install's. Byte identity is
never the record, though: a skill or adapter file that was already in the repository, byte for byte
what install would write, is not recorded by install (it reports it `left`), so the uninstaller
leaves it too. A file the
record does not list is left in place and reported as `left` with the reason, even when it is blank
or byte-identical to the kit: in a repository you never ran the installer on (for example after the
minimal copy path in §1) nothing is removed. A marker with no install ledger (an install made before
this release, or by an earlier build of it) is not a record the uninstaller can use, so the blank
pointer files, `AGENTS.md` and the runnables it created are left; remove them by hand if you do not
want them. A malformed install ledger is a `verify` finding on both sides (exit `3`), and the
uninstaller then deletes none of these files.

The pointer blocks are removed only on install's record as well. Install appends a newline and then
the block lines (the open marker line, the pointer line and the close marker line) to the end of
`CLAUDE.md` and of the Copilot file. It records in the install ledger in `.grugops/install.json` a
sha256 of the block lines and what that newline did: it made a blank line (the file was absent, empty
or ended with a newline) or it ended your last line (the file had no final newline). The uninstaller
removes a block only when that record lists the file and the file holds exactly one copy of those
lines, and it removes exactly those lines. It removes the newline before them only when the block is
still at the end of the file, where install put it, and the file agrees with the record: the line
before the block is blank, or the record says the newline ended your last line. So install followed
by uninstall gives back an untouched file byte for byte. If you moved the block, or added text after
it, its lines are removed and the newline before them stays (the line says so), because which newline
install added can no longer be shown; if you deleted the blank line before it, the newline that ends
your line stays. No two of your lines are ever joined, and your file keeps its final newline. A block
is left exactly as it is and reported `left` when it no longer matches the record (a line added,
edited or removed inside it, its line ends converted, spaces added, a marker line missing), when the
file holds two copies of it, or when there is no record of it: a repository you never ran the
installer on (no marker), or a marker that is not this directory's record (see the marker paragraph
below). Remove the grugops lines by hand in that case, keeping any line of your own. A re-install that
finds its block already there keeps the record as it was. A malformed install ledger is a `verify`
finding on both sides (exit `3`), and the uninstaller then removes no block.

The grugops skills and adapters (`.claude/skills/<name>/SKILL.md` and `.claude/agents/<file>.md`)
are removed the same way, on install's record in the install ledger in `.grugops/install.json`.
Install records what it wrote to each
one: a sha256 of the bytes it wrote (or found already identical), or the target of the link a
`--symlink` install made. The uninstaller removes a skill or adapter only while it still holds
exactly that, so one you edited is left byte for byte and reported `left`. A re-install that writes
the kit keeps an earlier entry only while the file still holds it; one that writes no kit file keeps
the kit-file records as they were. In a repository with no marker (you never ran the
installer there) no skill or adapter is removed, not even a byte-identical copy of the kit's, and the
same holds for a skill or adapter the install ledger has no record of: byte identity with the kit
source is never a record. A skill or adapter that is a hard link (the
same file under a second name) is left and reported, with or without a record. A malformed install
ledger is a `verify` finding on both sides (exit `3`), and the uninstaller then removes no skill or adapter.
A marker with a duplicate key is not read at all, by either side: which of the two values is the
record is not known.

The Gemini settings file is changed only as install's record in the install ledger in
`.grugops/install.json` says. Install no longer writes that file or that record (34.1 D-12); what
follows is how the uninstaller reverses a record an install made before that change. Such an install
recorded whether it created the file, or appended `"AGENTS.md"` to `context.fileName` and what shape
it found there (no `fileName`, a string, or an array; and whether `context` was there), and a sha256
of `context.fileName` as it left it. The uninstaller acts only while `context.fileName` is still
exactly that list. In a file install found, it then removes the last `"AGENTS.md"` element from the
array and restores the shape install found: a string becomes the string again, and a `fileName` or
`context` install added is removed again. In a file install created, the whole list is install's
(install wrote `["AGENTS.md", "GEMINI.md"]` at once), so it removes `context.fileName`, with both
`AGENTS.md` and `GEMINI.md`, and the `context` object too when nothing else is in it; every key you
added stays. Only what install wrote and the separator next to it are removed; every other byte
stays. It deletes the whole file only when install created it and it still holds exactly the bytes
install wrote, or when nothing is left once install's list is removed and what is left is byte for
byte what is left of the file install wrote, with the mode install recorded; after a whitespace or
line-end edit or a `chmod` of yours, install's list is still removed and the file is kept. If you changed `context.fileName` after install (for example removed install's entry and
later wrote your own list, even one that names `AGENTS.md`), which entry is install's is not known:
the file is left byte-identical and reported `left`, and you remove the entry by hand if grugops
added it. With no record of an added entry, nothing in the file is changed: a repository you never
ran the installer on (with no marker), an install made before this release (`left`; remove the
entry by hand if grugops added it), a file that already listed `AGENTS.md` when install found it,
and a file install could not read or merge when it ran (both reported `skipped`). A re-install
carries an earlier record unchanged and never reads the file (34.1 D-12), so what decides is the
uninstaller's own check that `context.fileName` is still exactly the recorded list. A malformed
install ledger is a `verify` finding on both sides (exit `3`): install stops before it writes anything,
this file included, and the uninstaller leaves the file.

A symbolic link at one of those paths is removed only when it is exactly the link install's record
names: a `--symlink` install records the target of each link it made, and the link is removed while
it still points there, whichever checkout you run the uninstaller from. A copy install records the
copy, so any link put there since, even one that points at the kit source, is not the link install
made. That link, and any other (a dangling one, a loop, a link to a device, to a FIFO, or to a file or
directory elsewhere), is left in place, is not followed, and is reported as a `verify` finding (exit
`3`); remove it by hand if it is grugops's. That `verify` is reported only for a path install has a record
for. At a path with no record (a repository you never ran the installer on, or a path the record does
not list) a link, a special file, or a path under a linked directory (a `.claude` or `tools` that is
a link to a directory of yours, for example) is left, reported `left` or `skipped` with the reason,
and does not change the exit code; the same holds for `CLAUDE.md` or the Copilot file (the common `CLAUDE.md ->
AGENTS.md` link), and for `.claude/settings.json` when the ask-rule record claims no rule. A runnable
is never a link, so a link under `tools/grugops/` is always left. A path is reported `removed` only
when it is gone afterwards.

The marker is install's record for one directory. Install writes into it `target`, the real path of
the directory it installed into (every symbolic link on the way resolved). Both the installer and the
uninstaller use a marker only when its fields hold install's values (`grugopsHome` and `kitRoot`
non-empty absolute paths, `installMode` `copy` or `symlink`, `kitVersion` a string when it is there)
and its `target` is this directory. A JSON object at `.grugops/install.json` whose fields do not hold
those values is not used as install's marker: the uninstaller uses none of the records in it, removes
nothing on it, leaves it in place, and reports a `verify` finding (exit `3`); the installer stops
before it writes anything, in the repository or the kit home, leaves the file byte for byte, and exits
`3` too, with its `verify` line about the file. A `DRY_RUN` run shows the same stop. The installer's
closing line names the install command with the agents you named by agent flag or at the agent list. When you named
none (the agents came from the record or from detection, or none could be chosen), it names the
install command with no agent flag, which, once the file is fixed, shows the agent list at a terminal
and otherwise chooses as "Which agents an unattended install is for" says. A `--migrate` run ends with
`== migrate INCOMPLETE` and the `--migrate` command instead, naming agents the same way. Over a file install
never wrote, the closing names no command. When the object holds none of
install's fields (`grugopsHome`, `kitRoot`, `installMode`, `target`, `ledger`), install never wrote it:
`--check`, the installer and the uninstaller say in their line about it that it was not written by
install and, if it is yours, to leave it; that line names no next step and offers no removal.
Otherwise they name the field to fix by hand (see below). Install's marker for
another directory is not this directory's record either: a `.grugops/` copied from another repository,
a repository you moved, renamed or copied after installing, a marker written before this release
(it has no `target`), and a marker with no install ledger. The uninstaller then uses none of its
records, changes nothing, and exits `3` with a `verify` line that gives the remedy. If it is the same
repository moved or renamed, set `"target"` in the marker to the path the line names and run the
uninstall command the line prints again. Otherwise, and for a marker with no `target` or no install
ledger, the line prints two commands to run in order. The first is the install command, with the agent
flags you gave the uninstaller, `GRUGOPS_HOME=<dir>` stating the kit home you ran the uninstaller with
(`GRUGOPS_HOME`, else `~/.grugops`), and `INSTALL_MODE=copy`. The line names that kit home as the place
the install command copies the kit into. The install command never takes a kit home or an install mode
from the marker: the marker is not this directory's record, and in a cloned repository it can name
another person's path. After an earlier symlink install, the install command is still a copy install
that finishes, and the new marker records a copy install. If you gave no agent flag, the line also
says what install does without one: it chooses the agents detected here, shows the agent list at a
terminal, or refuses and names the agent flags.
The second is the uninstall command you ran. The install replaces that marker with one for this
directory and carries none of its records (it says so in a `note` line). The uninstaller then reports what an earlier install made here as
`left` and leaves it, including the grugops skill, OpenCode command and Pi prompt template files of
the agents it removes; remove them by hand. While the marker cannot be used, which agents are
installed here is unknown, and the run says so on the `agents to remove` line, in the `note` line for
each agent flag, and in the closing line; it never says that an agent is not installed. `--check`
warns about such a marker, and its warning names the kit home its install command copies the kit into.
`INSTALL_MODE` other than `copy` or `symlink` is refused as bad usage (exit `2`) before anything is
written.

The marker is removed only when it is install's marker for this directory, its install ledger is
well-formed, and nothing it records is left (see the next paragraph). It is never read through a symbolic link: a link at
`.grugops/install.json`, or a `.grugops` that is itself a link, makes the marker unreadable, so no
record from another repository is believed. A marker that cannot be read (not JSON, too large, a
FIFO, a directory, a link) or that holds a malformed install ledger is reported as a `verify` finding,
is left in place byte for byte, and the run exits `3`: one malformed entry makes the whole ledger
unusable, so nothing is removed or edited on it. The installer stops before it writes anything over
such a marker, in the repository or the kit home, so it never writes a file it cannot record; a
`DRY_RUN` run shows the same stop. `--check` fails on such a marker (a doctor FAIL,
exit `1`): one that cannot be read is named as unreadable, never as "not installed", and as present
only when something is at its path (a `.grugops` that is a regular file or a symbolic link to nothing
leaves nothing there, so the line names the marker's path and the cause), and a malformed install
ledger is named in a `FAIL` line with the entry and the reason.

A marker that `--check`, the installer or the uninstaller cannot use is still the record of the agents
installed here, whatever the cause, with one exception: a JSON object that holds none of the five
fields `grugopsHome`, `kitRoot`, `installMode`, `target` and `ledger` was not written by install, and
each of them says so and, if it is yours, to leave it, in a line that names no next step and offers no
removal. Any other unusable marker is still that record: it cannot be read (for example mode 000, a
FIFO, a directory or a link), it is not JSON (for example a trailing comma) or not a JSON object, a key in it appears more than
once, its bytes are not text install writes, a field holds a value install never writes or a field
install writes is missing (for example `agents` edited by hand), it holds a retired record, or its
install ledger is malformed (for example one entry with a kind install never writes). Each of them names
the cause it saw and what to fix by hand, and says never to delete the marker; none of them offers to
remove it. After the fix, run the command the `--check` or uninstall line prints, or run the installer
again.

**When uninstall keeps `.grugops/install.json`.** The marker is the only record of what install
wrote, so the uninstaller removes it only when everything install recorded writing is gone: every
file it recorded was removed or was already gone, and every pointer block, Gemini entry and ask rule
it recorded was reversed or was already gone. A run that could not remove something it has a record
for (a `verify` line; for example under a directory you made read-only) keeps the marker and exits
`3`. A run that left a recorded file because you edited it keeps the marker too, exits `0`, and ends
with
`== uninstall complete — N recorded item(s) left in place; .grugops/install.json kept to record them ==`.
Either way the kept marker is rewritten to list only what is still there: what the run
removed or reversed is taken out of it, so a later run cannot act on a record of it. Fix the cause,
or remove or restore the file a `left` line names, and run the command the run printed (the `left`
line about the marker and the closing lines name it, with your `--target` and the agent flags still
to finish): it finishes the reversal, and it removes the marker once the marker records nothing more. To keep the
edited file instead, after any uninstall, take its entry out of the `ledger` list in `.grugops/install.json` by hand,
then run the command the run printed; it finishes the reversal and leaves your file, and after a flag-less uninstall it
also removes the marker once nothing else is recorded. Never delete the marker: after a flag-less uninstall it is still
the record of what install made here, and after an uninstall with agent flags it is still the record of the agents that
stay. A `CLAUDE.md` or
Copilot file install created, whose grugops block was removed and which still holds lines of yours,
does not keep the marker: what is left in it is yours. Directories and backups install recorded do
not keep the marker either. A directory holds nothing of install's own (its files are their own
entries), `tools/` is never removed, and a recorded directory that is not empty holds files that are
not install's; a backup holds your content, which the uninstaller never removes. A kept marker still
lists those that are present. Once the uninstaller removes the marker, the backups install recorded
are on no record any more, so `--prune-old-kit` can no longer remove them; run `--prune-old-kit`
before you uninstall if you want grugops to remove its backups. (This narrows decision D-33 (b),
which keeps the marker while any recorded entry is left, to the entries that hold content install
wrote; the repository owner has yet to confirm the narrowing.)

A `DRY_RUN=1 node install/uninstall.js` preview changes nothing. It counts each file it would
remove as removed, so it names the directories the real run would empty and then remove, and never
a directory the real run keeps.

The uninstaller removes an empty directory only when install created it, which install records in
the install ledger in `.grugops/install.json`, and only when the same run emptied it by removing what
install put there. A directory's name is not a record: an empty directory you made yourself, for
example `.github/`, `.gemini/` or even `.claude/skills/grugops/`, is left in place and reported as
`left`, in the real run and in the preview. A recorded directory that is already empty when the
uninstaller reaches it (you emptied it, or deleted it and made it again) is left and reported too,
and a re-install that finds a recorded directory empty drops it from the record. An install whose
marker has no install ledger has no record of its directories, so every empty directory it created is
left; remove them by hand if they are empty and you do not want them. If the install ledger is
malformed or the marker cannot be read, the uninstaller reports a `verify` finding, removes no empty
directory, and exits `3`. `tools/` is always left, even when install created it: a project is likely to use a directory
of that name itself.

**In short, uninstall acts only on a record, and leaves everything else:**

- It walks every entry of the install ledger in `.grugops/install.json`, so no recorded file is
  removed or left without a line naming it, whichever grugops version or checkout runs it. The kit
  source of that checkout never decides what is removed.

- It changes `.gemini/settings.json` only as the record an install made before 34.1 D-12 left in the
  install ledger in `.grugops/install.json` says (install no longer writes that file): it removes the
  entry install added and restores the shape install found, or, in a file
  install created, removes the `context.fileName` list it wrote (`AGENTS.md` and `GEMINI.md`) and
  the `context` object when nothing else is in it, keeping every other key; or it leaves the file as
  it is when the list was changed. It deletes the file only when install created it and it is
  unchanged, or holds nothing else once what install wrote is removed (byte for byte, with the mode
  install recorded).
- It deletes `CLAUDE.md` or `.github/copilot-instructions.md` only when install created the file
  (recorded in the install ledger in `.grugops/install.json`), the file held exactly what install
  wrote, and it is blank once the recorded grugops block is removed. Otherwise it removes only the block, and only while the block is
  exactly what install appended.
- It removes a grugops skill or adapter file (`.claude/skills/grugops*/SKILL.md`,
  `.claude/agents/grugops-*.md`) only while that file is still exactly what install wrote: its
  recorded content, or its recorded link (in the install ledger in `.grugops/install.json`). A file you
  edited, or whose mode you changed,
  is left in place and reported `left`. So is every file whose name matches the backup name a
  re-install gives an edited kit file (`<file>.grugops-edited-<UTC stamp>`); nothing records those
  backups, so uninstall never removes or claims one and says only that the name matches.
- It removes the Claude Code ask rules install recorded adding (in the install ledger in
  `.grugops/install.json`), and deletes
  `.claude/settings.json` only when install created it, its mode is the one install recorded, and
  once those rules are removed what is left is byte for byte what is left of the file install wrote.
  A whitespace or line-end edit of yours (an extra final newline, CRLF) keeps the file.
- It removes `.grugops/install.json` only when it reads as grugops's install marker for this
  directory, its install ledger is well-formed, and nothing it records is left. A run that could not
  finish, or that left a file you edited, keeps the marker, rewritten to list what is left, so a
  re-run can finish the reversal.
- A file with no install record is left untouched and reported (`left` or `skipped`, with the
  reason), whatever is at the path (a link, a special file), and that does not change the exit code.
- A path uninstall reads that is not a regular file (a FIFO, a directory, a device) is skipped and
  reported, never read, so install and uninstall cannot hang on it.
- An unreadable record, or a malformed one, is a `verify` finding and exit `3`, and so is a path
  install has a record for that the uninstaller cannot read.

Two known exceptions in the ask-rule record are kept by the repository owner's decision (red-team
items 12 and 13 of phase 33.1, decision D-31 of 2026-10-01, stated here so the list above is not
read as covering them). The uninstaller
removes an ask rule by its name in the record and does not check `permissions.ask` against what
install left there, so a rule you deleted after install and later added again yourself, with the same
text, is removed. And a re-install over a `.claude/settings.json` it cannot read (a hard link, for
example) resets the ask-rule record to claim nothing, so the next uninstall leaves grugops's rules in
the file and says there is no record that install added them; remove them by hand.

**An install made before this release** (2.1.0 and earlier) wrote a marker with no install ledger
and no `target`. The uninstaller does not use it: it changes nothing, exits `3`, and its `verify`
line gives the remedy: re-run the installer here, then the uninstaller. Re-running the installer
replaces the marker with one for this directory that carries the install ledger; what the earlier
install made has no record in it, so a later uninstall leaves those files (the pointer blocks,
`AGENTS.md`, the earlier runnables, the Gemini entry, the kit files it did not rewrite) and reports
them, for you to remove by hand.

**One install ledger (D-33).** The marker keeps one install ledger, the field `ledger` in
`.grugops/install.json`, a list of what install created, wrote or changed. A marker written by an
earlier build of this release, before the ledger, is read as no record: uninstall changes nothing
and exits `3` with the remedy (re-run the installer, then the uninstaller). No released version wrote
that shape.

It deliberately does **not** touch:

- the **shared kit** at `${GRUGOPS_HOME:-$HOME/.grugops}` — other repos depend on it, so
  removing it is a manual `rm -rf ~/.grugops` you run yourself when you want it gone everywhere
- your **seeded per-repo state** — `.grugops/factory.config.json`, `plans/`, and `memory-bank/`
  become your content once seeded (they may hold real work), so they survive uninstall
- an **empty directory you made yourself** — only a directory install created (recorded in the
  install ledger in `.grugops/install.json`) is removed
- a **file install did not create** — a blank `CLAUDE.md` or Copilot file, or a copy of the kit's
  `AGENTS.md` or runnables, is removed only when the install ledger in `.grugops/install.json`
  records that install created it
- a **Gemini settings, Copilot instructions or `CLAUDE.md` file install has no record of creating
  or changing** — it is left byte for byte
- a **grugops skill or adapter file you edited** — it no longer holds what the install ledger in
  `.grugops/install.json` records, so it
  is left and reported
- every **backup install recorded** (the `--migrate` backups and the backups of edited kit files): each
  is reported `left` by its record; only `--prune-old-kit` removes one, and only some kinds (see
  "Pruning old backups")
- every file with a **`.grugops-edited-` backup name** (a re-install's backup of an edited kit file,
  or a file of yours with that name)
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
  A resolver adapter or skill that is a symbolic link is replaced by a real file only when it is
  the link an earlier `--symlink` install made (it points at this checkout's own source for that
  file). That link is removed only in a run that writes the kit. Any other link there is left in
  place and nothing is written through it.

Each backup `--migrate` makes (the in-repo kit, each legacy config, `plans/handoffs/`, and the backups of
kit files you edited) is recorded in the install ledger in `.grugops/install.json`, with a record of its
content. `--prune-old-kit` can later remove the in-repo kit and config backups while they are unchanged;
it never removes the handoffs backup or a backup of an edited kit file.

`--migrate` is **whole or not at all**. Before it changes anything, it checks the config it would
carry forward and builds the whole kit plan, rendering the adapters with that carried config (so a
`DRY_RUN=1` preview shows the models the real run installs). If anything is refused (a `models`
value the resolver refuses, a link at an adapter path that is not install's own, a config path that
is not a regular file, or any other kit refusal above), **nothing is migrated**: no config is moved,
`agent-factory/` and `plans/handoffs/` are not backed up, no kit file is written and no marker is
written, and the run exits `3` with a `verify` line for each refusal. The repository is still the
old layout, so fix what the `verify` lines name (edit the legacy config, or remove the link if it is
yours to remove) and re-run `--migrate`: it then performs the whole migration. A plain re-install
(without `--migrate`) also replaces install's own links, so a repository an earlier release left
half-migrated (a marker, the old links still in place) is completed by re-running the installer.

The `plans/handoffs/` backup runs on **every** `--migrate` (whether your repo is on the old layout
or already on the current two-root layout), because the handoffs dir can accumulate regardless of
layout state. When `plans/handoffs/` is absent it is a clean no-op (`--migrate` reports *nothing to
migrate* and changes nothing).

It is **idempotent and re-run-safe**: running `--migrate` a second time on an already-migrated
repo does nothing. If a stray **live** in-repo `agent-factory/` is left behind after migration,
`--migrate` tells you — and tells you to remove it **by hand** once you have confirmed the shared
kit at `${GRUGOPS_HOME:-$HOME/.grugops}` is in use. `--prune-old-kit` does **not** clear it: prune
removes only backups install recorded, never a live kit (it refuses to delete user content by
design).

A `--migrate` on a clean repo (no old layout) simply falls through to a normal fresh install.

#### Rolling a migrate back (the manual restore)

A migrate is reversible by hand. To return a repo to its pre-migrate state:

1. **Remove the grugops wiring.** Run the uninstall, which removes only the grugops-owned
   adapters, the sentinel blocks, and the `.grugops/install.json` marker (it preserves the
   migrate backups and the seeded config, and reports each backup `left` by its record in the
   install ledger). Do not run `--prune-old-kit` before you restore: it removes the in-repo kit and
   config backups this restore needs:

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
refreshes the one shared kit that every installed repo resolves against. A kit that could not be
copied (the kit home cannot be read or written, say) is a `verify` line, and the run ends with
`== update INCOMPLETE — N item(s) need verification ==` and exit code `3`.

So `--update` is **not** how a change reaches a repo's `.claude/agents/` sub-agent adapters. Those are
rendered per repo at install time, from that repo's own `.grugops/factory.config.json`. A `models`
edit — or a kit-side adapter change — reaches an installed repo by **re-running the install from the
checkout against that repo**: `node install/install.js --target /path/to/repo`. The re-run is
idempotent, so an adapter that would not change is left alone and reported as identical. To see what
an edit has not reached yet without writing anything, run
`node install/install.js --check --target /path/to/repo`; it names every stale adapter.

It is **reversible**: the displaced kit is retained as a timestamped `agent-factory.bak.<ISO>`
backup under the kit home (renamed aside, never deleted, and recorded in `.grugops-kit.json`)
whenever the new kit differs from it. If the kit is already identical, the update leaves no backup
behind. Anything at `agent-factory/` that the kit-home record does not name as install's kit (a
directory of yours, a link, a file, or a kit written by an installer from before the record existed)
is always kept the same way, whether or not it differs. `--update` has no target, so the kit-home
overlap refusal does not apply to it; the record is what keeps it from deleting anything install did
not write.

If the checkout you run `--update` from is **older** than the kit already installed (a downgrade),
`--update` prints a clear warning naming both versions and then **proceeds** — it refreshes the kit
to the older version (retaining the newer one as the timestamped backup) rather than refusing. If
that was not what you intended, the backup is right there to restore.

### Pruning old backups (`--prune-old-kit`)

Both `--migrate` and `--update` leave **timestamped backups** behind on purpose, so a refresh or a
migration is always reversible. Install records each backup it makes. When you no longer need them,
`--prune-old-kit` removes the ones install recorded, and only those:

```sh
node install/install.js --prune-old-kit
# preview which backups would be removed (deletes NOTHING):
DRY_RUN=1 node install/install.js --prune-old-kit
```

This is the **single, opt-in deletion path** in grugops, and it is deliberately narrow:

- It removes **only backups install recorded**: the in-repo kit (`agent-factory.bak.<ISO>`) and legacy
  config (`factory.config.json.bak.<ISO>`) backups `--migrate` makes in the target, recorded in
  `.grugops/install.json`, and the kit backups install and `--update` make in the kit home
  (`agent-factory.bak.<ISO>`), recorded in `.grugops-kit.json` there.
- It removes a recorded backup only while it is **still exactly as install left it**, compared with its
  recorded content: every file's bytes and permission bits, every link's target, and every name in a
  directory. A backup you changed since, even by one added file, is left and named with the reason. A
  backup whose content install could not read in full when it made it is never removed.
- It **never** removes a `plans/handoffs.bak.<ISO>` backup or a backup of a kit file you edited
  (`<file>.grugops-edited-<ISO>`), because those hold your content. It names each one `left`.
- **Anything else named like a backup is left and named.** A name is not proof that grugops made a file:
  your own `thesis.bak.<ISO>/` or `budget.xlsx.bak.<ISO>` has the same shape. A backup grugops made
  before this release has no record either, so prune leaves it too (`not recorded by install`). Check
  such a backup and remove it by hand when you no longer need it.
- A kit-home backup install made of something that was not its kit (a directory of yours at
  `agent-factory/`; its `backed-up` line said so) is a recorded backup like the others, so prune removes
  it while it is unchanged. Move anything you want to keep out of such a backup before you prune.
- After it removes a backup, prune takes that backup's entry out of the record that listed it. If the
  record cannot be rewritten (it changed while prune ran, or it is read-only), a `verify` line names the
  entries it still lists, and the run exits `3`; a later prune finds those paths gone and leaves the
  entries.
- It **never** runs on the default install path. Deletion happens only when you pass this flag
  (grugops never deletes first).
- It never touches the **live** `agent-factory/` kit, your seeded `.grugops/` state, `plans/`,
  `.planning/`, `docs/`, `src/`, or any other content you own (the same protected-path guard the
  uninstaller uses), even if a record names a path there.
- A recorded backup that is a symbolic link is removed as a link, never followed. A backup is reported
  `removed` only when it is gone afterwards; one that could not be removed is a `verify` finding, and the
  run prints `== prune INCOMPLETE — N item(s) need verification ==` and exits `3`.

**Run `--prune-old-kit` before you uninstall** if you want grugops to remove its backups. The
uninstaller never removes a backup and reports each recorded one `left`, but once it has removed
everything else it removes `.grugops/install.json`, and with it the record of the target's backups.
Prune then finds them unrecorded and leaves them.

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
- [ ] dismisses stale approvals when new commits are pushed;
- [ ] requires approval of the most recent push;
- [ ] blocks force pushes;
- [ ] restricts deletions;
- [ ] does not let the account the agent works under bypass it.

The two stale-approval lines (decision 33.1 D-33) close a gap on a repository with more than one
person: without them, an agent could push new commits after a human approved and then merge on the
old approval. With classic branch protection, turn on "Dismiss stale pull request approvals when new
commits are pushed" and "Require approval of the most recent reviewable push". With a ruleset, turn
on the options with the same names in the ruleset's "Require a pull request before merging" rule.
The check reads each setting from the host. A setting that is on counts, a setting that is off reads
`unprotected`, and a setting the host's answer does not show reads `UNKNOWN - verify`.

To meet the last line with classic branch protection, turn on "Do not allow bypassing the above
settings" (include administrators) and list no one under "Allow specified actors to bypass required
pull requests". With a ruleset, keep the account your agent works under (and any role or team it
belongs to) off the ruleset's bypass list. The check reads this from the host: a ruleset counts only
when GitHub reports that the checked account can never bypass it. The line says only what the check
can read (decision 33.1 D-31). With classic branch protection the check also requires the
protection to include administrators (`enforce_admins`). With a ruleset it reads only whether the
account it runs under can bypass the ruleset, not who else can. So keep the administrator role, and
any team the agent's account belongs to, off the ruleset's bypass list yourself. On a repository with one human
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
rulesets, so the check does not compare it with a branch's ruleset rules. When that answer reports
`false` and the classic protection endpoint returns no protection record, the branch is judged by
its ruleset rules alone: if they show every item, it reads `protected`. Whether GitHub's
`protected` value counts rulesets has not been measured on a live host. A ruleset counts only when
it belongs to the repository the check inspected: a repository ruleset must name that repository
(`owner/name`) as its source, and an organization ruleset its owner, spelled exactly as the
repository line spells them. A ruleset whose source is an enterprise or any other owner reads `UNKNOWN - verify` for the
lines it would show.

For production, keep a deployment environment that:

- [ ] has the name your deploy jobs use;
- [ ] requires at least one reviewer;
- [ ] prevents self-review;
- [ ] does not let administrators bypass its protection rules;
- [ ] allows deployments only from protected branches.

On GitHub these are the environment's "Required reviewers" setting with at least one reviewer
named and "Prevent self-review" turned on, "Allow administrators to bypass configured protection
rules" turned off, and deployment branches set to "Protected branches only". GitHub documents
"Protected branches only" for branch protection rules, and states that when no branch has them,
every branch can deploy
([Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).
GitHub also documents that on the Free, Pro and Team plans required reviewers are available only for
public repositories.

**The check does not read the production environment (decision 33.1 D-31).** Its environment line
always reads `UNKNOWN - verify`, by design, whatever the environment's settings are. Confirm each
line of the production list above yourself, in the environment's settings on your git host. The
release record (workflow 12) states that only the named human's confirmation vouches for the deploy
floor, and that confirmation stays mandatory.

The environment line still names the environment it is about, although the check does not read that
environment (33.1 D-31). The check finds the name in this order: the `--env <name>` flag; else the
last entry of `environments` in `.grugops/factory.config.json`; else the last entry of
`environments` in `agent-factory/config/factory.config.json`; else `production`. Both files are
read relative to the directory the check runs in. A file that cannot be parsed, or whose
`environments` is not a list ending in a name, is skipped. So is a path that is not a regular file of
at most 1 MiB, such as a directory or a named pipe: the check does not read it.

#### Check it

```sh
node tools/grugops/host-protection.js
```

The installer places this script in your repository. It asks the git host, through read-only
`gh api` GET requests, whether the default branch, `main`/`master` and any branch you name with
`--branch <name>` (repeatable) are protected. It prints one line per branch with one of three words:

- `protected` — the host showed positive evidence for every item of the branch checklist above,
  from rules the account the check runs under cannot bypass.
- `unprotected` — the host answered, and at least one item is missing or can be bypassed by that
  account.
- `UNKNOWN - verify` — the check could not tell: no `gh`, not authenticated, no permission to read
  the setting, or an ambiguous answer. Treat it as not verified. It never counts as protected.

After the branch lines comes one line for the production environment,
`environment <name>: UNKNOWN - verify — not checked by design …`. It is not a verdict: the check
does not read the environment (decision 33.1 D-31), and the production list above is yours to
confirm.

Before the target lines, the check prints the repository it inspected, `repository <owner>/<name>`,
as gh resolved `{owner}/{repo}` (the `GH_REPO` variable, `gh repo set-default`, or the git remotes).
In a fork clone, confirm that it names the repository your agent pushes to. When the host does not
name the repository, or names it inconsistently (its `full_name` and `url` disagree, or its `name`,
`owner` or `html_url` names another), the line reads
`repository UNKNOWN - verify` and every branch reads `UNKNOWN - verify`. The check reads that `url`
only in its plain form, `https://api.github.com/repos/<owner>/<name>`, or
`https://<host>/api/v3/repos/<owner>/<name>` on GitHub Enterprise Server; any other form, including
an API host other than `api.github.com` without the `/api/v3` prefix, reads
`repository UNKNOWN - verify`. Other urls in the host's answers that name a repository (a protection
record's `url`, a branch's `protection_url`) must name the same one, or the lines they feed read
`UNKNOWN - verify`.

Exit codes count branches: `0` every inspected branch is protected; `1` at least one branch is
unprotected; `2` otherwise, including when the check could not run. The environment line does not
change the exit code, so exit `0` says nothing about the production environment
(decision 33.1 D-31). A command line the check cannot read (an unknown argument, or `--branch`, `--env` or
`--gh-script` with no value) exits `2` before any request to the host. `--json` adds the repository
name (`repository`, or null) and the full record of every call it made, and arrives whole when piped
to another program. The check is read-only and needs an authenticated `gh` (`gh auth status`). The
PR quality gate (workflow 05) and the release (workflow 12) run it and record the result; the
release still needs the named human confirmation whatever the check reports.

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
`--check` reports whether each recorded rule is still present. The record also keeps a sha256 of
the `permissions.ask` list as install left it. A re-install keeps the earlier record of which rules
install added only while that list is unchanged. If you changed the list, or deleted the file and
wrote your own, every rule already in it is treated as yours, reported so, and left by uninstall; a
key you add beside the list does not change this. If `.claude/settings.json` cannot be parsed, the
installer leaves it untouched, records no rule as its own, and exits `3`. If `.grugops/install.json` cannot be
read, or its ask-rule ledger is malformed, that is a `verify` finding (exit `3`) on both sides:
install then stops before it writes anything, so it adds no rule and leaves the ledger as it found
it, and uninstall removes no rule. When
the installer adds rules to an existing `.claude/settings.json`, it inserts them into the file's
text in place: every other byte (numbers as written, key order, spacing, line ends) is kept, and
uninstall removes exactly what install inserted, so install followed by uninstall gives back the
file byte for byte. A settings file with a comment, a trailing comma, bytes that are not UTF-8, or
more than one `permissions` or `permissions.ask` key is left untouched and is a `verify` finding
(exit `3`).

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

grugops generates no approval configuration for the governed commands on Codex CLI, Antigravity
CLI, OpenCode, GitHub Copilot CLI or Pi. (For OpenCode, install writes only the OpenCode
`external_directory` rule in `opencode.json` described under "What the installer touches
(per-repo), and only this". It is not an approval rule for the governed commands: it allows every
tool call OpenCode gates by `external_directory` on the kit path, edits included.) Codex CLI, OpenCode and GitHub Copilot CLI each have their own approval mode,
which you configure yourself; Pi has none (see its entry below); for Antigravity CLI it is
`UNKNOWN - verify` (see its entry below). The notes below come from each tool's documentation and are **not
verified by grugops**; confirm them against the current docs before you rely on them. On every
tool, the git host is the hard floor.

- **OpenCode** — `permission.bash` in `opencode.json` takes command patterns mapped to `allow`,
  `ask` or `deny`, and the last matching rule wins (opencode.ai/docs/permissions). Not verified by
  grugops.
- **GitHub Copilot CLI** — `--deny-tool` denies a tool or a shell command pattern (for example
  `--deny-tool='shell(git push)'`), and deny rules take precedence over allow rules
  (docs.github.com/en/copilot/how-tos/copilot-cli/allowing-tools). Not verified by grugops.
- **Antigravity CLI** — whether it asks for approval before it runs a command, and how a rule
  for a specific command would be written, is `UNKNOWN - verify`: grugops has not researched it.
  Its settings file is user-level, `~/.gemini/antigravity-cli/settings.json`
  (antigravity.google/docs/cli/gcli-migration/, retrieved 2026-10-11). Check the current Antigravity
  documentation before relying on it.
- **Codex CLI** — approval policies and sandbox modes decide when Codex asks before it runs a
  command. The syntax for a rule that matches a specific command is `UNKNOWN - verify`; check the
  current Codex documentation before relying on it.
- **Pi** — Pi can read, change and run files with the permissions of the account that started it,
  and it does not ask for approval before every tool call
  (`github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md`, retrieved
  2026-10-06). On Pi, the git host in (a) is therefore the only hard control on merge and deploy.
  A Pi extension can block a tool call
  (`github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md`, retrieved
  2026-10-06), but grugops ships none. Not verified by grugops.

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

Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi have no host spawn mechanism that
this kit uses. The launch agents install writes for Antigravity CLI, OpenCode, GitHub Copilot CLI
and Pi make the Orchestrator pointer the session's main agent when you start the session with one,
but they give that session no `Agent` tool this kit uses, and Codex CLI gets no launch agent. A
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

For the same reason no other host gets a setting that makes a launch agent its default: install
writes no `default_agent` (and no `agent` key) into `opencode.json`, and never writes `.pi/SYSTEM.md`
or `.pi/APPEND_SYSTEM.md`, which Pi finds and loads on its own. A launch agent on Antigravity
CLI, OpenCode, GitHub Copilot CLI or Pi takes effect only in a session you start or pick it in, and
Codex CLI has none.

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

The recipe covers the pinned browser-MCP setup for every supported host CLI — Claude Code, Codex
CLI, Antigravity CLI (where the exact entry is `UNKNOWN - verify`), OpenCode, GitHub Copilot CLI and
Pi — and the statement that the attended
Claude-in-Chrome lane is optional, human-stamped, and absent by design on every host other than
Claude Code.

**grugops installs nothing for this.** The MCP server is fetched by your own coding agent through
`npx` at the pinned version, so `package.json` gains no dependency and the installer writes no MCP
configuration into your repository. Browser binaries remain your repository's own prerequisite.

---

## Attribution

grugops borrows its voice in homage to [grugbrain.dev](https://grugbrain.dev). grugops is **not
affiliated with, endorsed by, or sponsored by** grugbrain.dev or its author. The joke earns
trust; it never replaces the explanation, and it stays out of the safety, money, and
compliance text — which is always plain.
