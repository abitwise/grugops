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

# Re-install with no terminal (an agent, CI) over grugops skills or adapters you edited:
# back each edited file up next to itself, then refresh the whole kit (see "Re-installing"):
node install/install.js --yes --backup-edited-kit --target /path/to/repo
```

### Re-installing over an existing install (your edits to the kit files, D-32)

Before it writes any grugops skill or adapter file (`.claude/skills/grugops*/SKILL.md` and
`.claude/agents/grugops-*.md`), install checks each one it would replace against its record of what
it wrote there (the `kitFiles` ledger in `.grugops/install.json`). If you edited any of them, install
lists them (an `edited-kit` line each) and, at a terminal, asks whether to back them up and overwrite
the whole kit, `[y/N]`, default no.

- **Yes:** each edited file is first copied next to itself as `<file>.grugops-edited-<UTC stamp>`
  (for example `grugops-qe-e2e.md.grugops-edited-2026-09-30T10-54-21.203Z`), then the whole kit is
  refreshed. Uninstall never removes a backup; it reports each one `left`.
- **No:** nothing in the kit changes. The run exits `3` with a `verify` line naming the files.
- **No terminal, or `--yes`:** install asks nothing and changes nothing in the kit. `--yes` answers
  only the target question, never whether an edit may be overwritten. The run exits `3` and tells you
  to re-run with **`--backup-edited-kit`**, the explicit opt-in that gives the yes answer without a
  prompt.
- **`DRY_RUN=1`** asks nothing and lists each backup it would make (`would-back-up`). Without
  `--backup-edited-kit` it exits `3`, as the real unattended run would; with it, it previews the
  backups and the kit write and exits `0`.

With no usable record (no marker, a marker that is not this directory's record, including one written
before this release, or a damaged `kitFiles`), a skill or adapter counts as edited when it differs from
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

The shared kit home is different. A re-install replaces `${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory`
with a fresh copy of the kit, so an edit you made inside the shared kit home is overwritten, with no
backup and no question. That is accepted for now (human decision, 2026-09-30); a backup of kit-home
edits is deferred. Keep your own changes in the target repository, not in the shared kit home.

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
`kitFiles` ledger unchanged (absent if it was absent), and the previous kit version, kit root, kit
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
written; if it cannot be removed, the `verify` line names it as incomplete, and the uninstaller
reports it as an incomplete copy, not as a backup. The one gap is an error while the kit is being
written that the checks could not see (a disk that fills up, for example): that file is a `verify`
line and the run goes on to the next. The uninstaller applies the same rule to every file it edits, and it never reads a
hard-linked `.grugops/install.json` as this repository's marker. **A chained command stops
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
- `.claude/agents/grugops-*.md` — the Orchestrator subagent wrapper and the role adapters (17
  files in this release)
- the two **resolver adapters** (`.claude/skills/grugops/SKILL.md` and the orchestrator
  wrapper) have the resolved absolute kit path **materialized** into them, so `/grugops`
  resolves the shared kit on first run with no path error
- for every skill and adapter file above, install records in `.grugops/install.json`, as
  `kitFiles`, what it wrote there (a sha256 of the bytes, or the target of a `--symlink` link), so
  uninstall removes only a file that still holds exactly that, and a re-install asks before it
  overwrites one you edited (see "Re-installing" above)
- a one-line **start-here** pointer block in `CLAUDE.md` (appended behind a sentinel; your
  existing content is preserved). When `CLAUDE.md` does not exist, install creates it and records
  that in `.grugops/install.json` (`createdFiles`); the block it appended is recorded as
  `appendedBlocks`. A `CLAUDE.md` that is a symbolic link (the common `CLAUDE.md -> AGENTS.md`
  setup included) or a hard link is not written through: install reports a `verify` line (exit
  `3`), leaves it and the file it points at unchanged, and adds no pointer; add the line by hand if
  you want it
- `.gemini/settings.json` — `context.fileName` gains `"AGENTS.md"`, and what install did is
  recorded in `.grugops/install.json` as `geminiSettings` so the uninstaller can reverse exactly
  that. The entry is inserted into the file's text in place: every other byte of the file (numbers
  as written, key order, spacing, line ends, a byte order mark, the final newline or its absence)
  stays as it was, and install followed by uninstall gives back the file byte for byte. A settings
  file that is not a valid JSON object, is not strict JSON (a comment, a trailing comma), is not
  valid UTF-8, has more than one `context` or `context.fileName` key, or whose `context` is not an
  object or whose `context.fileName` is neither a string nor an array of strings, is left untouched
  and reported as a `verify` finding (exit `3`), by the installer and the uninstaller alike
- `.claude/settings.json` — the Claude Code ask rules described in §5 are added to
  `permissions.ask` (additive and in place: every other byte of the file is kept, and the added
  rules are recorded so uninstall removes exactly those)
- `tools/grugops/` — the kit's runnable checks, including the read-only git-host check
  `tools/grugops/host-protection.js` (§5)
- an optional `.github/copilot-instructions.md` pointer, by the same rules as `CLAUDE.md`: when the
  file does not exist, install creates it and records that (`createdFiles`), and the block is
  recorded as `appendedBlocks`
- **seeded per-repo state** (skip-if-exists, never clobbered): `.grugops/factory.config.json`,
  the `.grugops/install.json` marker, `plans/`, and `memory-bank/`

In the **shared kit root** (`${GRUGOPS_HOME:-$HOME/.grugops}`):

- `agent-factory/` — the read-only kit, copied once and shared across repos. A re-install replaces
  it with a fresh copy, so an edit made inside it is overwritten (see "Re-installing" above)

It never overwrites or deletes any file you own. Existing seeded state is left byte-untouched on
re-install (skip-if-exists), and `agent-factory/`, `plans/`, `.planning/`, `docs/`, and `src/`
in your target are never modified beyond the additive edits above. A path the installer reads or
writes that is not what it expects (a FIFO, a directory, a device, a symbolic link it did not make,
or a hard link) is skipped and reported as a `verify` line, never read or written through, so the
installer cannot hang on it (see the exit-code paragraph above).

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
Orchestrator wrapper and the materialized resolver adapters that still hold what install wrote to
them (see the kit-file record below), the sentinel-delimited `CLAUDE.md` and
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
lists it and it is still the copy (or, for `AGENTS.md`, the link) install made. The record keeps
what install wrote to each file (a sha256 of the bytes, or the target of the link), and a file is
deleted only while it still holds exactly that: a file you edited or replaced since is left and
reported. A re-install keeps an earlier entry only while the file still holds what the record says
and the re-install did not have to add its pointer block to it, so a file you deleted and then made
again yourself is dropped from the record and left by the uninstaller. A file whose bytes are
exactly the ones install wrote holds nothing of yours, so it is treated as install's. A file the
record does not list is left in place and reported as `left` with the reason, even when it is blank
or byte-identical to the kit: in a repository you never ran the installer on (for example after the
minimal copy path in §1) nothing is removed. An install made before this release has no file ledger,
so the blank pointer files, `AGENTS.md` and the runnables it created are left and reported; remove
them by hand if you do not want them. A malformed file ledger is a `verify` finding on both sides
(exit `3`), and the uninstaller then deletes none of these files.

The pointer blocks are removed only on install's record as well. Install appends a newline and then
the block lines (the open marker line, the pointer line and the close marker line) to the end of
`CLAUDE.md` and of the Copilot file. It records in `.grugops/install.json`, as `appendedBlocks`, a
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
finds its block already there keeps the record as it was. A malformed `appendedBlocks` is a `verify`
finding on both sides (exit `3`), and the uninstaller then removes no block.

The grugops skills and adapters (`.claude/skills/<name>/SKILL.md` and `.claude/agents/<file>.md`)
are removed the same way, on install's `kitFiles` record. Install records what it wrote to each
one: a sha256 of the bytes it wrote (or found already identical), or the target of the link a
`--symlink` install made. The uninstaller removes a skill or adapter only while it still holds
exactly that, so one you edited is left byte for byte and reported `left`. A re-install that writes
the kit keeps an earlier entry only while the file still holds it; one that writes no kit file keeps
the whole ledger as it was. In a repository with no marker (you never ran the
installer there) no skill or adapter is removed, not even a byte-identical copy of the kit's. A
marker that is this directory's record but has no `kitFiles` (this release always writes it, so only a
hand-edited marker lacks it) makes the uninstaller remove a skill that is byte-identical to the kit
source it runs from and leave every other one, which includes every adapter and the resolver skill,
because install writes the kit path into them. That byte-identity rule is used once: when the
uninstaller keeps such a marker (another record in it is malformed), it writes `"kitFiles": {}` into
it, so a later run removes no skill you copied in by hand. A marker written before this release is not
this directory's record (see the marker paragraph below), so the rule never runs on it. A skill or adapter that is a hard link (the
same file under a second name) is left and reported, with or without a record. A malformed `kitFiles`
is a `verify` finding on both sides (exit `3`), and the uninstaller then removes no skill or adapter.
A marker with a duplicate key is not read at all, by either side: which of the two values is the
record is not known.

The Gemini settings file is changed only as install's `geminiSettings` record says. Install
records whether it created the file, or appended `"AGENTS.md"` to `context.fileName` and what shape
it found there (no `fileName`, a string, or an array; and whether `context` was there), and a sha256
of `context.fileName` as it left it. The uninstaller acts only while `context.fileName` is still
exactly that list. It then removes the last `"AGENTS.md"` element from the array and restores the
shape install found: a string becomes the string again, and a `fileName` or `context` install added
is removed again. Only that entry and the separator next to it are removed; every other byte stays.
It deletes the whole file only when install created it and it still holds exactly the bytes install
wrote. If you changed `context.fileName` after install (for example removed install's entry and
later wrote your own list, even one that names `AGENTS.md`), which entry is install's is not known:
the file is left byte-identical and reported `left`, and you remove the entry by hand if grugops
added it. With no record of an added entry, nothing in the file is changed: a repository you never
ran the installer on (with no marker), an install made before this release (`left`; remove the
entry by hand if grugops added it), a file that already listed `AGENTS.md` when install found it,
and a file install could not read or merge when it ran (both reported `skipped`). A re-install
keeps an earlier record only while `context.fileName` is exactly what install last left there; if
you changed it, the record claims nothing more, says so, and the uninstaller leaves the file. A
re-install that cannot read the file at all (a link, a hard link, a special file, no read
permission, too large, not UTF-8, not strict JSON, a duplicate key) has no evidence either way, so
it keeps the earlier record as it was and says so. A malformed `geminiSettings` is a `verify`
finding on both sides (exit `3`): install does not merge and writes it back as found, and the
uninstaller leaves the file.

A symbolic link at one of those paths is removed only when it is exactly the link a `--symlink`
install makes: it points at the kit source file of the checkout you run the uninstaller from, and
install's record names that link (a copy install records the copy, so a link put there since is
left). Any
other link (a dangling one, a loop, a link to a device, to a FIFO, or to a file or directory
elsewhere) is left in place, is not followed, and is reported as a `verify` finding (exit `3`);
remove it by hand if it is grugops's. A runnable is never a link, so a link under `tools/grugops/` is
always left. A path is reported `removed` only when it is gone afterwards.

The marker is install's record for one directory. Install writes into it `target`, the real path of
the directory it installed into (every symbolic link on the way resolved). Both the installer and the
uninstaller use a marker only when its fields hold install's values (`grugopsHome` and `kitRoot`
non-empty absolute paths, `installMode` `copy` or `symlink`, `kitVersion` a string when it is there)
and its `target` is this directory. A JSON object at `.grugops/install.json` whose fields do not hold
those values is not install's marker: the uninstaller uses none of the records in it, removes nothing
on it, leaves it in place, and reports a `verify` finding (exit `3`); the installer leaves it byte for
byte, writes no marker, adds no Gemini entry and no ask rule, and exits `3` too. Install's marker for
another directory is not this directory's record either: a `.grugops/` copied from another repository,
a repository you moved, renamed or copied after installing, and a marker written before this release
(it has no `target`). The uninstaller then uses none of its records, changes nothing, and exits `3`
with a `verify` line that names both directories. If it is the same repository moved or renamed, set
`"target"` in the marker to the path the line names and re-run the uninstaller. Otherwise re-run the
installer: it replaces that marker with one for this directory and carries none of its records (it
says so in a `note` line), so what an earlier install made here has no record and the uninstaller
leaves it and says so; remove it by hand. `--check` warns about such a marker. `INSTALL_MODE` other
than `copy` or `symlink` is refused as bad usage (exit `2`) before anything is written.

The marker is removed only when it is install's marker for this directory and every ledger in it is
well-formed. It is never read through a symbolic link: a link at
`.grugops/install.json`, or a `.grugops` that is itself a link, makes the marker unreadable, so no
ledger from another repository is believed. A marker that cannot be read (not JSON, too large, a
FIFO, a directory, a link) or that holds a malformed ledger is reported as a `verify` finding, is
left in place, and the run exits `3`. When the marker is kept because one ledger in it is malformed,
the uninstaller takes every entry it removed in this run out of the other ledgers, so a later run
cannot act on a record of something already removed; if it cannot rewrite the marker, that is a
`verify` finding that names those entries. `--check` names such a marker as present but unreadable (a
doctor FAIL, exit `1`), not as "not installed".

A `DRY_RUN=1 node install/uninstall.js` preview changes nothing. It counts each file it would
remove as removed, so it names the directories the real run would empty and then remove, and never
a directory the real run keeps.

The uninstaller removes an empty directory only when install created it, which install records in
`.grugops/install.json` as `createdDirs`, and only when the same run emptied it by removing what
install put there. A directory's name is not a record: an empty directory you made yourself, for
example `.github/`, `.gemini/` or even `.claude/skills/grugops/`, is left in place and reported as
`left`, in the real run and in the preview. A recorded directory that is already empty when the
uninstaller reaches it (you emptied it, or deleted it and made it again) is left and reported too,
and a re-install that finds a recorded directory empty drops it from the record. An install made before the
directory ledger has none, so every empty directory it created is left and reported; remove them by
hand if they are empty and you do not want them. If the directory ledger is malformed or the marker
cannot be read, the uninstaller reports a `verify` finding, removes no empty directory, and exits
`3`. `tools/` is always left, even when install created it: a project is likely to use a directory
of that name itself.

**In short, uninstall acts only on a record, and leaves everything else:**

- It changes `.gemini/settings.json` only as the `geminiSettings` record says: it removes the entry
  install added and restores the shape install found, and it deletes the file only when install
  created it and it is unchanged, or holds nothing else once that entry is removed.
- It deletes `CLAUDE.md` or `.github/copilot-instructions.md` only when install created the file
  (`createdFiles`), the file held exactly what install wrote, and it is blank once the grugops block
  (`appendedBlocks`) is removed. Otherwise it removes only the block, and only while the block is
  exactly what install appended.
- It removes a grugops skill or adapter file (`.claude/skills/grugops*/SKILL.md`,
  `.claude/agents/grugops-*.md`) only while that file is still exactly what install wrote: its
  recorded content, or its recorded link (`kitFiles`). A file you edited is left in place and reported
  `left`, and so is every `.grugops-edited-` backup a re-install made; uninstall never removes a
  backup.
- It removes the Claude Code ask rules install recorded adding (`claudeAskRules`), and deletes
  `.claude/settings.json` only when install created it and nothing else is left in it.
- It removes `.grugops/install.json` only when it reads as grugops's install marker for this
  directory and every ledger in it is well-formed.
- A file with no install record is left untouched and reported, with what to remove by hand.
- A path uninstall reads that is not a regular file (a FIFO, a directory, a device) is skipped and
  reported, never read, so install and uninstall cannot hang on it.
- An unreadable record, or a malformed one, is a `verify` finding and exit `3`.

Two known exceptions in the ask-rule record are open, pending a human decision (red-team items 12
and 13 of phase 33.1, stated here so the list above is not read as covering them). The uninstaller
removes an ask rule by its name in the record and does not check `permissions.ask` against what
install left there, so a rule you deleted after install and later added again yourself, with the same
text, is removed. And a re-install over a `.claude/settings.json` it cannot read (a hard link, for
example) resets the ask-rule record to claim nothing, so the next uninstall leaves grugops's rules in
the file and says there is no record that install added them; remove them by hand.

**An install made before this release** (2.1.0 and earlier) wrote a marker with none of these
records and no `target`. The uninstaller does not use it: it changes nothing, exits `3`, and its
`verify` line gives the remedy. If it is this repository, set `"target"` in the marker to the path the
line names and re-run the uninstaller: measured on an install made by the 2.1.0 installer, it then
removes the six skills that are byte-identical to the kit source, and the marker, and leaves and
reports the rest (every adapter and the resolver skill, which carry the kit path; the pointer blocks;
`AGENTS.md`; the runnables; the Gemini entry; the directories), for you to remove by hand. Re-running
the installer instead replaces the marker with one for this directory; what the earlier install made
has no record in it, so a later uninstall leaves those files (the pointer blocks, `AGENTS.md`, the
earlier runnables, the Gemini entry) and reports them.

It deliberately does **not** touch:

- the **shared kit** at `${GRUGOPS_HOME:-$HOME/.grugops}` — other repos depend on it, so
  removing it is a manual `rm -rf ~/.grugops` you run yourself when you want it gone everywhere
- your **seeded per-repo state** — `.grugops/factory.config.json`, `plans/`, and `memory-bank/`
  become your content once seeded (they may hold real work), so they survive uninstall
- an **empty directory you made yourself** — only a directory install created (recorded as
  `createdDirs` in `.grugops/install.json`) is removed
- a **file install did not create** — a blank `CLAUDE.md` or Copilot file, or a copy of the kit's
  `AGENTS.md` or runnables, is removed only when `createdFiles` records that install created it
- a **Gemini settings, Copilot instructions or `CLAUDE.md` file install has no record of creating
  or changing** — it is left byte for byte
- a **grugops skill or adapter file you edited** — it no longer holds what `kitFiles` records, so it
  is left and reported
- every **`.grugops-edited-` backup** a re-install made of an edited kit file
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
`--check` reports whether each recorded rule is still present. The record also keeps a sha256 of
the `permissions.ask` list as install left it. A re-install keeps the earlier record of which rules
install added only while that list is unchanged. If you changed the list, or deleted the file and
wrote your own, every rule already in it is treated as yours, reported so, and left by uninstall; a
key you add beside the list does not change this. If `.claude/settings.json` cannot be parsed, the
installer leaves it untouched, records no rule as its own, and exits `3`. If `.grugops/install.json` cannot be
read, or its ask-rule ledger is malformed, that is a `verify` finding (exit `3`) on both sides:
install then adds no rule and leaves the ledger as it found it, and uninstall removes no rule. When
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
