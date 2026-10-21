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

## What `--migrate` does in this release

`--migrate` runs its existing steps: on a v1.0 in-repo kit, the move to the shared kit home and the
configuration carry, then the install run; on every repository, the legacy handoffs backup described
below. It does **not** move your planning state yet. On a pre-v3 repository:

- it leaves everything under `plans/` where it is, byte for byte;
- it seeds nothing under `memory-bank/plans/`, so no second, empty board appears beside yours, and it
  prints one `skipped` line saying so;
- it still seeds the files outside `memory-bank/plans/` that a missing file would get (for example
  `.grugops/factory.config.json`), and never overwrites one that is there.

If the layout cannot be read, `--migrate` seeds nothing under `memory-bank/plans/` and prints a `verify`
line naming the path and the error code, so the run ends `INCOMPLETE` (exit `3`). On a repository that is
already on the two-root layout, `--migrate` runs only the handoffs backup and seeds nothing.

Moving the state from `plans/` to `memory-bank/plans/` arrives with the v3 migrate step in a later v3.0
phase. The command to run does not change: `install --migrate`.

## What `install --check` reports

`install --check` prints one `state layout:` line before its file checks:

- **v3 layout:** `ok`, `state layout: memory-bank/plans/`.
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

The `plans/handoffs/` backup runs on **every** `--migrate` (whether your repo is on the old layout
or already on the current two-root layout), because the handoffs dir can accumulate regardless of
layout state. When `plans/handoffs/` is absent it is a clean no-op (`--migrate` reports *nothing to
migrate* and changes nothing).

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

If the migration itself was committed to git, you can roll the whole change back with a single
`git revert` of the migration commit, then restore the out-of-band `.bak.<ISO>` directory by hand:

```sh
git revert <migration-commit-sha>     # undoes the committed migration edits
mv plans/handoffs.bak.<ISO> plans/handoffs   # restore the preserved handoffs (kept out-of-band)
```

`git revert` reverses the tracked changes, and because the handoffs were renamed aside (never
deleted) the `.bak.<ISO>` directory survives the revert and carries your original files verbatim —
so the `git revert` + restore is a **lossless** round-trip with no data left orphaned.
