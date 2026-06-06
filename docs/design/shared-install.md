# Design: shared-location install (`$GRUGOPS_HOME`)

> Status: **design / decision capture** — input for a planned phase. No code yet.
> Origin: surfaced by the live CC dogfood (DOG-02), 2026-06-06. Decision: **clean split, build as a phase.**

## Problem (from the dogfood)

Installing grugops into a *new* repo is broken in three ways, all from one root cause:

1. **Wrong target.** `install.sh` defaults `TARGET=$(pwd)` (install.sh:36). Run from inside the clone, it installs into the clone. No `--target` flag and no prompt — the only redirect is the obscure `TARGET=/path` env var. → user "had to change folder to run it."
2. **Symlinks back into the clone.** `INSTALL_MODE=symlink` is the default (D-30). Adapters are symlinked into the clone — fragile (break if the clone moves), confusing in the target's git.
3. **The kit never arrives.** The installer *explicitly* never touches `agent-factory/` (install.sh:12, README:65). It lays down only thin adapters that reference `agent-factory/roles/…`, `agent-factory/config/…`, `agent-factory/workflows/…`, `plans/…` **repo-relative**. Those paths don't exist in the target → the adapters dangle → Claude hunts in the clone.

The README's "minimal path §1" assumes the user *manually* copies `AGENTS.md` + `agent-factory/` first; the scripted path neither does that nor warns when it's missing.

The plugin form does **not** fix this on its own: plugins are copied to a cache, so the same repo-relative references would resolve against the user's repo (no `agent-factory/`) or the cache (no `agent-factory/` unless bundled). Same unsolved question — already flagged open in CLAUDE.md.

## Decision: shared kit at `$GRUGOPS_HOME`, per-repo state in the target

Chosen over "vendor the kit into every repo" (footprint) and "symlink overlay" (the user disliked symlinks). The cost — accepted — is rewriting path-roots across the kit (see blast radius).

### Kit vs state split

`agent-factory/` today mixes **static kit** with **per-project, runtime-writable** content. The split:

| Goes to `$GRUGOPS_HOME` (shared, read-only) | Stays per-repo (writable, in the target) |
|---|---|
| `agent-factory/roles/` | `plans/` — board, tickets, traceability, metrics, sprints, releases, nfr |
| `agent-factory/workflows/` | `memory-bank/` |
| `agent-factory/checklists/` | the project's `factory.config.json` (mode/cadence/autonomy/WIP differ per repo) |
| `agent-factory/packaging/` | **runtime handoffs → `plans/handoffs/`** (roles fill these per request; cannot live in a shared read-only dir, would collide across projects) |
| handoff **templates**, `VERSION`, a **default** `factory.config.json` | |

### Path-root convention

- `$GRUGOPS_HOME` — env var, default `~/.grugops`. **Kit reads** resolve under `$GRUGOPS_HOME/agent-factory/…`.
- **State reads/writes** resolve repo-relative: `plans/…`, the repo's `factory.config.json`, `plans/handoffs/…`, `memory-bank/…`.
- Adapters (`.claude/skills/*`, `.claude/agents/grugops-orchestrator.md`) point at `$GRUGOPS_HOME/agent-factory/…` for the kit, repo-relative for state.

### Blast radius (measured 2026-06-06)

Across **31** role + workflow files, path-roots are intermixed:
- `agent-factory/handoffs/` — **50 refs** → must become `plans/handoffs/` (writes) / `$GRUGOPS_HOME/agent-factory/handoffs/` (template reads)
- `agent-factory/config/` — **32 refs** → repo `factory.config.json`
- `agent-factory/{roles,workflows,checklists}` — ~55 refs → `$GRUGOPS_HOME/…`
- `plans/*`, `memory-bank/*` — already repo-local, unchanged

This re-touches the **role-switch protocol shipped on `grugops/quick-harden-role-switch-autocommit`** — its step 4 says "write the role's handoff file under `agent-factory/handoffs/`" → becomes `plans/handoffs/`. Sequence: merge or rebase that branch first so the phase edits the final protocol text once.

## Installer changes

- `install.sh --target <repo>` + interactive prompt ("Install into which repo? [.]").
- Install/update the kit to `$GRUGOPS_HOME` (**copy**, no symlinks); idempotent.
- Seed per-repo state into the target: the project `factory.config.json` (from the shared default) + `plans/` skeleton incl. `plans/handoffs/`.
- Lay adapters referencing `$GRUGOPS_HOME` for kit, repo for state.
- `--check` **doctor**: verify every path the adapters/roles reference actually resolves (kit at `$GRUGOPS_HOME`, state in repo); fail loudly with the missing path. This is the guard that would have caught all three pains.
- Preserve the contract: additive, idempotent, `DRY_RUN=1`, reversible; never overwrite/delete user content; never set the deploy-approval env var. `install.mjs` mirrors `install.sh`. `uninstall.sh` updated for the two-root layout.

## Validator / test impact

- `scripts/validate-agent-factory.mjs` assumes a single in-repo tree. It must become two-root aware (kit at `$GRUGOPS_HOME`/`VALIDATE_ROOT`, state in repo), or validate the kit and a target independently.
- `scripts/validate.test.sh` + fixtures: update for the split layout.

## Open items for the phase to resolve

- Exact per-repo config location: repo-root `factory.config.json` vs `.grugops/factory.config.json`. (Affects the 32 config refs.)
- `$GRUGOPS_HOME` precedence/override (env > default `~/.grugops`); per-project override?
- How the future **plugin** form maps onto this — `$GRUGOPS_HOME` vs `${CLAUDE_PLUGIN_ROOT}` for the kit root (one resolution rule, two homes).
- **Migration** for already-installed repos (in-repo `agent-factory/` + symlinks → `$GRUGOPS_HOME` + repo state): idempotent, never deletes user state.

## Explicitly not chosen

- **Vendor-into-repo** (copy whole `agent-factory/` per repo) — zero text rewrite, but duplicates the kit everywhere and was rejected on footprint.
- **Symlink overlay** (repo `agent-factory/` whose static subdirs symlink to `$GRUGOPS_HOME`) — near-zero rewrite, but reintroduces the per-repo symlinks the dogfood flagged.
