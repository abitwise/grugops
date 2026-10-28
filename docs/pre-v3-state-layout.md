# The pre-v3 state layout

Before v3.0, a grugops repository kept its planning state (the board, the ticket, epic, feature, sprint
and release trees, the NFR catalog, the traceability matrix and the metrics file) in a top-level `plans/`
directory. From v3.0 that state lives under `memory-bank/plans/`. A pre-v3 repository keeps its state
under `plans/` until `install --migrate` moves it. This page holds the pre-v3 material you may still
need; the install guide, [install/README.md](../install/README.md), names only the v3 paths.

The pre-v3 layout is supported through v3.x and **removed in v4.0** (see "When the fallback ends" below).

## How the layout is decided

grugops decides the layout from where the board is. Nothing else is read, and no layout marker is
written:

| `memory-bank/plans/board.md` | `plans/board.md` | Layout |
|---|---|---|
| present | absent | v3 (current) |
| absent | present | pre-v3 |
| present | present | both: the v3 layout is used and `plans/` is stale |
| absent | absent | fresh: nothing to fall back to |

A board path the installer cannot read (for example, a directory on the way has no read permission) is
never treated as absent. The installer reports it as unreadable instead, with the path and the error
code, because a board it cannot see may still be there.

## What an agent does on a pre-v3 repository

Every role, adapter and skill carries the same rule, word for word:

> If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale.

The Orchestrator in the shared kit home carries this rule. An unmigrated repository therefore keeps
working after you refresh the kit home with `install --update`: `--update` writes only to the kit home
and leaves the repository unchanged.

## What a plain install does on a pre-v3 repository

A plain install (no `--migrate`) on a pre-v3 repository refuses before it writes anything. It prints one
message on stderr that names `plans/board.md`, `memory-bank/plans/` and the `install --migrate` command
to run (with the agent flags you gave), prints nothing on stdout, and exits `1`. A `DRY_RUN` preview
refuses the same way. If the layout cannot be read, the install refuses the same way and names the
path and the error code.

The refusal applies only to a plain install. `--update`, `--check`, `--migrate` and uninstall are not
refused on a pre-v3 repository.

A plain install also refuses, on any layout, while the `--migrate` staging directory
`memory-bank/.grugops-migrate-v3` exists, because a migrate is running there or was interrupted (see
"The undo" below).

## What `--migrate` does in this release

On a pre-v3 repository, `install --migrate` moves the planning state from `plans/` to
`memory-bank/plans/`, splits the three files that grew too large to read whole (the board, the
traceability matrix and the NFR catalog), and keeps every original file. It then continues into the
normal install run, so the kit, the adapters and the kit tools are refreshed to read the new layout.
The steps below run in this order. If any step fails, the repository is left as it was before the
run.

### The pre-check

Before it writes anything, `--migrate` reads the whole pre-v3 state and plans the whole move. One
pre-check covers the kit steps and the state move, so a v1.0 repository (the kit vendored in-repo
under `agent-factory/`) that also holds a pre-v3 board is migrated in one run: the move to the shared
kit home first, then the state move. If anything is refused, nothing is written, and the run exits
`3` with one `verify` line for each refusal. Fix what the lines name and run `--migrate` again.

The state move is refused when:

- **both layouts exist:** a board at `memory-bank/plans/board.md` and at `plans/board.md`, so the run
  cannot choose which one is your state;
- **the layout is unreadable:** a board path could not be asked about;
- **work is claimed:** `.grugops/queue/claimed/` holds a claimed task, so an agent may be working on
  the state. A keeper file such as `.gitkeep` is not a claim;
- **a migrate is running or was interrupted:** something is at `memory-bank/.grugops-migrate-v3`, the
  staging directory (see "The undo" below);
- **the destination is taken:** something is already at `memory-bank/plans/`, because a rename never
  replaces what is there;
- **a link or a special file is in the way:** a symbolic link, a FIFO, a socket or a device under
  `plans/`, or a link at or on the way to `plans/`, `memory-bank/`, the progress file
  `memory-bank/60-progress.md` or `.grugops/context/`. The state move follows no link;
- **a size bound is passed:** a file over the size bound for one file, or a `plans/` tree with more
  entries than the move can record and prove;
- **the move would cross filesystems:** `plans/` or `memory-bank/` is on another filesystem than the
  repository directory, so the move cannot be a rename;
- **a path would be too long:** a path the move creates is over this platform's path limit;
- **a file cannot be read, or cannot be split safely:** a file that cannot be read whole; a board, NFR
  catalog or ticket that is not valid UTF-8 or mixes LF and CRLF line endings; two ticket files that
  declare the same ticket ID; an NFR with more than one row in the NFR table; an NFR table header with
  no category or target cell; or a file already at a path the NFR split would write;
- **the planned split fails its proof** (see "The proof" below);
- **with `--archive-done-context`, a context folder it would move cannot be recorded.**

The kit refusals that `--migrate` already had (for example a `models` value the resolver refuses, or a
link at an adapter path) still apply; see "Migrating an existing install (`--migrate`)" in
[install/README.md](../install/README.md). If grugops skills or adapters in the repository were edited,
an unattended run also needs `--backup-edited-kit`, as every re-install does.

### The move and where the originals go

`plans/` is renamed whole to `memory-bank/plans/`. Every file that is not split, including each
ticket, epic, feature, sprint, release and UAT file, moves unchanged to the same path under
`memory-bank/plans/`. Nothing is copied, so no second copy of a ticket exists for an agent to find.

The originals of the split files move unchanged to `memory-bank/plans/archive/pre-v3/`:
`board.md`, `traceability.md` and `nfr-catalog.md`. The split outputs are written as new files:

- **The board.** Each row keeps its ticket ID, title and meta text. Only the trailer after them is
  cut. A row that is still over the row budget after the cut is reported by name and size, not
  rewritten. The migrated board carries no `_Updated:` line: every `_Updated:` line goes, unchanged, to
  `memory-bank/plans/archive/pre-v3/board-updates.md`.
- **Board notes.** A row's cut trailer is added, unchanged, as a new `## Board notes` section at the
  end of that ticket's file, after a one-line note that says it came from the pre-v3 board on the
  migration date. The ticket's original file moves unchanged to
  `memory-bank/plans/archive/pre-v3/tickets/{file name}`, and the ticket with the section added is
  written as a new file at `memory-bank/plans/tickets/{file name}`. A ticket that gets no notes is only
  moved.
- **Orphan notes.** A row with no ticket file does not get a new ticket. Its trailer goes, unchanged,
  to `memory-bank/plans/archive/pre-v3/board-orphan-notes.md`, in one `## [ID]` section per row.
- **NFR files.** The NFR catalog becomes one file per NFR at `memory-bank/plans/nfr/NFR-xxx.md`, each
  holding the table's header line, that NFR's row and every section whose heading names only that NFR,
  all unchanged. `memory-bank/plans/nfr-catalog.md` becomes an index with one line per NFR, which copies
  the category and target cells as they are. Sections that name no NFR, or more than one, go to
  `memory-bank/plans/archive/pre-v3/nfr-notes.md`.
- **The traceability matrix.** The hand-written `traceability.md` is not split; its original is kept in
  the archive, and the trace is rendered fresh (see "The trace render" below).

### The roll

After the split, `--migrate` runs the same rollover as `node tools/grugops/state-roll.js`: older rows of
the board's Done column go to `memory-bank/plans/archive/board-done.md`, and dated `## YYYY-MM-DD`
entries in `memory-bank/60-progress.md` go to `memory-bank/plans/archive/progress.md`. When the progress
file is rolled, its original is kept at `memory-bank/plans/archive/pre-v3/60-progress.md`. Standing
sections of the progress file are not moved. A roll that cannot run (for example, the state rules
refuse a row) is skipped with a `note` that names the reason. The rest of the migration still runs.

### The proof

The proof runs before the first rename. It compares the original files with the split outputs, never
with the archived copies. Every non-blank line of the original board and NFR catalog (and of the
progress file, when it is rolled) must appear in the split outputs with the same bytes and the same
number of times, and the outputs must hold no other line. The split outputs are the board, the added
`## Board notes` sections, the orphan notes, the board updates, the NFR files and NFR notes, and the
rolled archives. Only a closed, named set of lines that `--migrate` writes itself (the one-line
provenance notes, the headings it adds and the index lines) is left out. Each archived
original is compared byte for byte with the file it came from. The whole planned tree is built in the
staging directory `memory-bank/.grugops-migrate-v3` on the same filesystem, and it is proven again
there. A failed proof is a refusal, and nothing is written.

After the renames, every original file is checked at its new home: its bytes are identical either
under `memory-bank/plans/archive/pre-v3/` or at its moved path. For a ticket that got notes, the live
file must begin with the original bytes.

### The undo

Each rename is recorded, in order, in `commit-plan.txt` inside the staging directory. If a rename, the
check after the renames or the trace render fails, the renames are undone in reverse order, the files
the run added are taken away, and the repository is as it was before the run. The run names the step
that failed and exits `3`.

If the process is stopped partway (for example, the machine loses power), the staging directory stays
with its `commit-plan.txt`. The next `--migrate` refuses, and so does a plain install. Once no migrate
is running, put back each rename that `commit-plan.txt` lists, move the staging directory aside, and
run `--migrate` again.

### The trace render

After the renames and before the marker, `--migrate` runs the kit's `trace-render.js` against the
repository. It writes `memory-bank/plans/traceability.md` as a fresh index and one trace file per
ticket under `memory-bank/plans/traceability/`, built from the references in sealed notes. Only exit
`0` from the renderer counts as a pass. If the render fails, the move is undone and no marker is
written.

### The marker, written last

The last write of the state move is the layout marker `memory-bank/plans/.layout`, which holds
`layout: v3`. It is written whatever the sizes of the migrated files. The run's closing lists every
file and row that is still over a state budget, with its size and its budget, and says that budgets
do not block the migration. From then on, `node tools/grugops/state-check.js` reports those budget
findings and exits `1` until they are fixed.

### The second run

`--migrate` on a repository that is already on the v3 layout, with a valid marker, prints one `ok`
line and moves nothing. If the marker is absent or not valid, the run prints one `note` and writes no
marker, because it did not migrate that state. On a repository with no board at either path, the state
move prints that there is no planning state to migrate and writes nothing, not even the marker. The
other `--migrate` steps run as before.

### The dry run

`node install/install.js --migrate --dry-run` (the same as `DRY_RUN=1`) runs the pre-check and lists
every step the real run would take: each move, archive, write, appended section, orphan row, roll and
over-budget finding, and the trace render, whose files cannot be previewed. It changes nothing on disk.

### Archiving finished tickets' context folders (`--archive-done-context`)

`--archive-done-context` is valid only with `--migrate`. It renames each finished ticket's context
folder, unchanged, from `.grugops/context/{folder}` to `.grugops/archive/context/{folder}`. The kit
tools read both places. A folder is matched to tickets by its name only, never by its contents: a
ticket ID counts when it is a delimited token in the folder name, in any case (for example
`abc-104-implement` names `ABC-104`). A folder moves only when all of these hold:

- it names at least one known ticket ID, and every ticket ID it names has a row in the Done column of
  the board or in `memory-bank/plans/archive/board-done.md`;
- no live queue entry names it: a pending entry `.grugops/queue/pending/{task}.md` or a claimed entry
  `.grugops/queue/claimed/{task}/` keeps the folder in place. A done entry in `.grugops/queue/done/`
  does not, because it is the record that the task finished;
- nothing is at `.grugops/archive/context/{folder}` yet;
- it is a real directory, not a link.

Every other folder stays where it is, and the run lists each folder it moves and each one it keeps,
with the reason. Each moved folder is checked at its new path after the rename.

On a pre-v3 repository, the folder moves are part of the state move: they are planned in the
pre-check, run after the other renames and before the trace render, and are undone with them. On a
repository already on the v3 layout with a valid marker, the flag moves the folders on its own and
then renders the trace again, because the order in which the renderer reads the two places can change
a trace file. If that render fails, the files it added are taken away and the folders are moved back.
A run that moves nothing renders nothing. On a repository with no board, or a v3 layout without a valid
marker, the flag moves nothing and says so. A second run moves nothing.

## What `install --check` reports

`install --check` prints one `state layout:` line before its file checks:

- **v3 layout:** `ok`, `state layout: memory-bank/plans/`. This is the line a repository gets after
  `--migrate` has moved its state. `--check` does not read the layout marker or measure the state
  budgets; `node tools/grugops/state-check.js` does both.
- **pre-v3 layout:** a `WARN` naming `plans/board.md` and the `install --migrate` command to run. The
  board check reads `plans/board.md`, so the board you are using is the one checked.
- **both:** a `WARN` saying `memory-bank/plans/` is used and `plans/` is stale, and that nothing was
  merged or deleted.
- **unreadable:** a `WARN` naming the path and the error code, saying no verdict was reached.

The layout is never a `FAIL`: a pre-v3 repository still works through the agents' rule above.
`install --check --strict` promotes every `WARN` to a failure (exit `1`), this one included. A
repository with no board at either path gets no layout line; the board check then reports the missing
board as a `FAIL`.

## When both layouts exist

When both `memory-bank/plans/board.md` and `plans/board.md` exist, the v3 layout wins. Agents and the
installer use `memory-bank/plans/`, and the installer prints one `note` that `plans/` is stale. The run
does not count the note as a problem, so it still ends complete. Nothing is merged and nothing is
deleted: both boards keep their bytes. Which of the two you keep is your decision.

## When the fallback ends

The `plans/` fallback is a v3.x transition. Every v3.x release keeps it: the agents' rule, the plain
install refusal and the `install --check` warning. **v4.0 removes it.** Run `install --migrate` on every
pre-v3 repository before you move it to a v4.0 kit; after v4.0, an agent no longer reads `plans/`.

## The legacy handoffs backup `--migrate` makes

Older grugops releases ran a delivery relay that wrote per-stage handoff files into `plans/handoffs/`.
The current grugops trace is note-native and does not use that directory, but a repository that ran an
older release can still hold one. `--migrate` keeps those files for you:

- it backs up any runtime-accumulated **`plans/handoffs/`** directory — the old delivery relay's
  per-stage handoff files — to a timestamped `plans/handoffs.bak.<ISO>` directory (renamed aside,
  **never deleted and never converted**: the originals are preserved verbatim for you, since the
  current grugops trace is note-native and does not parse the legacy handoff format). If a backup
  of that exact name already exists, `--migrate` **aborts that step and leaves your originals
  untouched** rather than overwrite the existing backup.

The `plans/handoffs/` step runs on **every** `--migrate` (whether your repo is on the old layout
or already on the current two-root layout), because the handoffs dir can accumulate regardless of
layout state. When `plans/handoffs/` is absent it is a clean no-op (`--migrate` reports *nothing to
migrate* and changes nothing).

When the same run moves the planning state (a pre-v3 repository, see "What `--migrate` does in this
release" above), no handoffs backup is made. `plans/handoffs/` moves with the rest of `plans/`,
unchanged, to `memory-bank/plans/handoffs/`, and one `ok` line says so. After the state move there is
no `plans/handoffs/`, so later runs have nothing to back up.

A `plans/handoffs.bak.<ISO>` backup that an earlier run made also moves with the state, to
`memory-bank/plans/handoffs.bak.<ISO>`. Its record in the install ledger names the old path, so the
run drops that record and prints one `note` naming the new path. Uninstall and `--prune-old-kit` never
touch the `memory-bank/` root, so the backup stays where it is.

`--migrate` is **whole or not at all**: if anything is refused, nothing is migrated, and
`plans/handoffs/` is not backed up either (see "Migrating an existing install (`--migrate`)" in
[install/README.md](../install/README.md)).

Each backup `--migrate` makes (the in-repo kit, each legacy config, `plans/handoffs/`, and the backups of
kit files you edited) is recorded in the install ledger in `.grugops/install.json`, with a record of its
content. `--prune-old-kit` can later remove the in-repo kit and config backups while they are unchanged;
it never removes the handoffs backup or a backup of an edited kit file.

How the two removal paths treat the recorded handoffs backup:

- **Uninstall** leaves it. Uninstall preserves the migrate backups and reports each backup `left` by its
  record in the install ledger (see "Undo" in [install/README.md](../install/README.md)).
- **`--prune-old-kit`** **never** removes a `plans/handoffs.bak.<ISO>` backup or a backup of a kit file
  you edited (`<file>.grugops-edited-<ISO>`), because those hold your content. It names each one `left`.

### Restoring `plans/handoffs/` and the `git revert` lossless rollback

The migration is **lossless and reversible** because nothing is ever deleted — every relocated
thing lives on as a timestamped `.bak.<ISO>` directory beside the original. To restore your old
delivery-relay handoffs, simply rename the backup back:

```sh
cd /path/to/repo
mv plans/handoffs.bak.<ISO> plans/handoffs
```

If the state move has run since the backup was made, the backup is under `memory-bank/plans/`, so
rename it there instead: `mv memory-bank/plans/handoffs.bak.<ISO> memory-bank/plans/handoffs`.

If the migration itself was committed to git, you can roll the whole change back with a single
`git revert` of the migration commit, then restore the out-of-band `.bak.<ISO>` directory by hand:

```sh
git revert <migration-commit-sha>     # undoes the committed migration edits
mv plans/handoffs.bak.<ISO> plans/handoffs   # restore the preserved handoffs (kept out-of-band)
```

`git revert` reverses the tracked changes, and because the handoffs were renamed aside (never
deleted) the `.bak.<ISO>` directory survives the revert and carries your original files verbatim —
so the `git revert` + restore is a **lossless** round-trip with no data left orphaned.
