# The pre-v3 state layout

Before v3.0, a grugops repository kept its planning state (the board, the ticket, epic, feature, sprint
and release trees, the NFR catalog, the traceability matrix and the metrics file) in a top-level `plans/`
directory. From v3.0 that state lives under `memory-bank/plans/`. A pre-v3 repository keeps its state
under `plans/` until `install --migrate` moves it. This page holds the pre-v3 material you may still
need; the install guide, [install/README.md](../install/README.md), names only the v3 paths.

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
