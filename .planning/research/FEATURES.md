# Feature Research

**Domain:** Install/CLI UX for an "install-once, use-per-repo" developer tool (grugops v1.1 shared-location install refactor)
**Researched:** 2026-06-06
**Confidence:** HIGH (behaviors grounded in named, current tools; verified against official docs where load-bearing)

> Scope note: this file covers ONLY the install/CLI UX features the shared-install refactor needs.
> It does NOT cover grugops's agent-factory app features (roles, board, gates). The locked decision
> (kit at `$GRUGOPS_HOME`, per-repo state in the target) is treated as a fixed constraint, not a feature
> to re-decide. Every feature maps to an observable user behavior.
>
> This replaces the v1.0 FEATURES.md (agentic-SDLC kit landscape) — see git history for that prior milestone's research.

## How comparable tools structure "install-once, use-per-repo"

These are the named comparables surveyed. grugops sits closest to **pre-commit** (per-repo opt-in,
config-file-driven, additive into a repo) and **rustup/nvm** (shared home dir overridable by env var),
with distribution aspirations like **Claude Code plugins**.

| Tool | Shared home | Per-repo footprint | Update verb | Doctor/check | Non-interactive |
|------|-------------|--------------------|-------------|--------------|-----------------|
| **pre-commit** | pip/pipx-installed binary | `.pre-commit-config.yaml` + git hook | `pre-commit autoupdate` | `pre-commit install` re-runs idempotently; no formal doctor | config-file driven, CI-native |
| **rustup** | `$RUSTUP_HOME` (default `~/.rustup`), `$CARGO_HOME` | `rust-toolchain.toml` / `rustup override` | `rustup self update` / `rustup update` | no `doctor`; relies on env checks | `-y` on `rustup-init` |
| **nvm** | `$NVM_DIR` (default `~/.nvm`) | `.nvmrc` | re-run install script | none | n/a |
| **asdf / mise** | `~/.asdf` / `~/.local/share/mise` | `.tool-versions` / `mise.toml` (pins versions) | `mise upgrade` / `asdf update` | `mise doctor` | config-file driven |
| **direnv** | shell-installed binary | `.envrc` (requires `direnv allow` to trust) | re-install binary | none | trust is explicit, opt-in |
| **pipx** | `~/.local/pipx` (or `$PIPX_HOME`) | none (global tools) | `upgrade-all` / `reinstall-all` | none | flags |
| **oh-my-zsh** | `$ZSH` (default `~/.oh-my-zsh`) | edits `~/.zshrc` (backs up first) | `omz update` | none | env vars on install |
| **Homebrew** | `$HOMEBREW_PREFIX` | none | `brew update` / `upgrade` | **`brew doctor`** (the canonical doctor) | `--quiet`, env vars |
| **Claude Code plugin** | plugin cache | install ref in settings; `--scope user\|project\|local` | `/plugin marketplace update` | `claude plugin validate` | flags |

The pattern is consistent: **a single env-var-overridable home directory**, **a tiny per-repo
declaration**, **an explicit `update` verb separate from `install`**, and (in the mature tools)
**a `doctor` that diagnoses skew between the two**. grugops's design already matches this shape;
the features below make it real.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes the v1.1 install feel broken or surprising — exactly the dogfood pains.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **`--target <repo>` flag** | Every per-repo installer (pre-commit, npm init) lets you say *where*. The dogfood pain #1 was "had to change folder to run it." | LOW | Observable: `sh install/install.sh --target ../app` seeds `../app`, not the clone. Replaces the obscure `TARGET=` env var (keep env var as a back-compat alias). |
| **Default `--target` to CWD, confirmed by prompt** | npm init / create-* default to CWD and confirm; asdf/mise operate on PWD. | LOW | Observable: bare `install.sh` prompts "Install into which repo? [.]" and waits. Defaulting silently to CWD is what caused the install-into-the-clone bug — so *confirm* the default, don't just take it. |
| **`--yes` / non-interactive mode** | `-y`/`--yes` is the universal CI convention (npm init, rustup-init `-y`). CI cannot answer prompts. | LOW | Observable: `install.sh --target ../app --yes` runs zero prompts, takes the given/default target, exits non-zero if a required value is missing rather than hanging. Also auto-engage when stdin is not a TTY. |
| **Shared-home install with env override** | `$RUSTUP_HOME`, `$NVM_DIR`, `$ZSH`, `$PIPX_HOME` — every shared-home tool lets you relocate. Design already names `$GRUGOPS_HOME` (default `~/.grugops`). | LOW | Observable: `GRUGOPS_HOME=/opt/grugops sh install/install.sh` puts the kit there; adapters resolve to it. Precedence: env > default. |
| **Idempotent kit install** | Re-running `pre-commit install` or the omz installer must be safe. grugops's existing contract. | LOW | Observable: running install twice yields zero net change; the kit at `$GRUGOPS_HOME` is overwritten (it is read-only kit, not user state), per-repo state is never re-clobbered. |
| **Separate `update`/`upgrade` verb for the shared kit** | rustup `self update`, `omz update`, `mise upgrade`, pipx `upgrade-all`, `/plugin marketplace update`. Install ≠ update is a near-universal split. | MEDIUM | Observable: `install.sh --update` (or `update` subcommand) refreshes ONLY the kit at `$GRUGOPS_HOME`, touches no repo state. This is the "install once, refresh the central kit" the milestone asks for. |
| **`--check` / doctor command** | `brew doctor`, `mise doctor` — the expected way to diagnose a half-broken install. The design explicitly calls this "the guard that would have caught all three pains." | MEDIUM | Observable: `install.sh --check` verifies (a) kit exists at `$GRUGOPS_HOME`, (b) every adapter's `$GRUGOPS_HOME/agent-factory/...` ref resolves, (c) per-repo state dirs exist, (d) no dangling symlinks. Prints PASS/FAIL per check; exits non-zero on any FAIL. See exit-code conventions below. |
| **`DRY_RUN=1` / preview** | grugops's existing contract; rare among comparables but a grugops promise. | LOW | Observable: `DRY_RUN=1 install.sh --target ../app` prints the plan, writes nothing — must extend to the new two-root flow. |
| **Per-repo `init`/seed that never clobbers** | pre-commit drops `.pre-commit-config.yaml`; oh-my-zsh backs up `.zshrc`; direnv requires explicit trust. Additive-never-overwrite is grugops's hard constraint. | MEDIUM | Observable: install seeds `factory.config.json` (from shared default) + `plans/` skeleton incl. `plans/handoffs/`; if `factory.config.json` already exists it is **skipped** (reported `skipped (exists)`), never overwritten. |
| **Install report (created/updated/skipped/verify)** | grugops already prints this; users expect to see what changed. | LOW | Observable: each touched path is marked `created` / `copied` / `skipped (exists)` / `verify`. Extend rows to show kit-root vs repo-root. |
| **`uninstall`** | omz `uninstall_oh_my_zsh`, pipx `uninstall-all`, the existing `uninstall.sh`. | MEDIUM | Observable: removes only what install added; the two-root split means it must distinguish "remove the per-repo adapters" from "remove the shared kit" (see two-stage uninstall below). Never deletes `plans/`, `memory-bank/`, the repo's `factory.config.json`. |
| **`install.mjs` mirrors `install.sh`** | grugops's existing single-behavior, two-runtime contract. | MEDIUM | Observable: every flag/behavior above exists identically in the Node installer; `install.test.sh` proves parity. |

### Differentiators (Competitive Advantage)

These align with grugops's Core Value ("the trace is the proof", "humans decide", boring-on-purpose)
and go beyond what the average installer ships. They are where grugops's install UX earns trust.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Doctor that reports the *specific unresolved path*** | Most doctors (`brew doctor`) emit vague warnings. grugops can name the exact dangling ref — "`role orchestrator.md` references `$GRUGOPS_HOME/agent-factory/handoffs/...` which does not exist." Directly answers the dogfood root cause. | MEDIUM | Observable: `--check` output lists each broken reference with the file that made it. This is grugops-shaped because the kit is markdown with knowable internal path refs. |
| **Doctor detects version skew (kit vs repo)** | rustup/mise pin versions; few installers *tell you* when the shared kit drifted from what a repo expects. | MEDIUM | Observable: `--check` compares `$GRUGOPS_HOME/agent-factory/VERSION` to a version recorded in the repo's `factory.config.json` (or a `.grugops/installed-version`) and warns on mismatch. Depends on recording a version at seed time. Keep it a *warning*, not a hard fail (loose-by-default, like mise's loose version preference). |
| **Doctor `--fix` for the safe, obvious repairs** | Goes one step past diagnosis. Bounded and additive only. | MEDIUM | Observable: `install.sh --check --fix` re-seeds a missing `plans/handoffs/` dir or re-lays a dangling adapter — but NEVER touches user content or the deploy-approval env var. Keep the fix set tiny and enumerated. |
| **Migration command for already-installed (v1.0) repos** | Few tools ship a real migrator; grugops has live v1.0 installs (in-repo `agent-factory/` + symlinks) that must move to the two-root layout. Design flags this as an open item. | HIGH | Observable: `install.sh --migrate` (or auto-detected on install) moves the kit to `$GRUGOPS_HOME`, replaces in-repo symlinks/adapters with `$GRUGOPS_HOME`-rooted ones, leaves `plans/`+`memory-bank/`+config untouched, and is idempotent + dry-runnable. Print a summary before acting. |
| **`/grugops install` self-bootstrap stays correct under two roots** | The agent can re-run the install/check from inside the session — a grugops-unique affordance. Already documented; must be updated for the split. | MEDIUM | Observable: in-session `/grugops install` and `/grugops` "check yourself" run the same two-root logic as the scripts, honoring `$GRUGOPS_HOME`. |
| **Honest "verify" flagging on copies** | grugops already flags copy-fallback rows `verify`; under copy-default (no symlinks) this becomes the norm and pairs with `--check` to detect drift. Matches the no-fabrication ethos. | LOW | Observable: copied kit/adapters are flagged so users know `--check` is the way to catch drift later. |

### Anti-Features (Commonly Requested, Often Problematic)

Documenting these prevents scope creep and protects the "boring markdown, not a platform" constraint.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Auto-update / background self-update of the kit** | omz auto-updates; "just keep it fresh" feels nice. | Silent kit changes break the trace/reproducibility, surprise regulated users mid-delivery, and need a daemon/scheduler grugops refuses to be. | Explicit `--update` verb only. The user decides when the central kit moves (matches "humans decide"). |
| **Per-repo version pinning with a lockfile** | mise/rustup pin exact versions; "pin the kit per repo" sounds rigorous. | A lockfile + resolver is real machinery for a markdown kit; introduces a resolution algorithm grugops shouldn't own. The kit is one shared copy, not N versioned copies. | Record the installed version in `factory.config.json`/`.grugops` and let `--check` *warn* on skew (loose, not enforced). Multi-version coexistence is out of scope. |
| **Symlinking the kit into each repo (overlay)** | Near-zero text rewrite; "keep one source." | The dogfood explicitly rejected per-repo symlinks (fragile if the clone moves, confusing in target git). Already "explicitly not chosen" in the design. | Copy the kit to `$GRUGOPS_HOME` once; repos reference it by `$GRUGOPS_HOME` path, not by symlink. |
| **Vendoring the whole `agent-factory/` into every repo** | Zero path rewrite; fully self-contained repos. | Duplicates the kit everywhere; rejected on footprint in the design. | Shared `$GRUGOPS_HOME` kit + tiny per-repo state. |
| **An interactive TUI / wizard / menu** | "Nicer onboarding." | grugops is POSIX sh + Node stdlib, zero deps; a TUI is bloat that fights the boring-on-purpose constraint and breaks CI. | A single confirm prompt + `--yes`. That is the entire interaction budget. |
| **A package-manager-style `grugops` binary on `$PATH`** | "Make it a real CLI." | Becomes a platform/installable binary to maintain across OSes; grugops is a markdown kit dropped on a host agent, not a runtime. | `install.sh` / `install.mjs` invoked by path, plus the in-agent `/grugops install`. No global shim. |
| **Telemetry / "phone home" on install or check** | "Know if installs succeed." | Violates trust, adds a network dependency to a file-only kit, and is hostile to regulated/air-gapped users. | The install report + `--check` are local and visible; that IS the feedback. |
| **Doctor that auto-fixes user content** | "Just make it work." | An over-eager `--fix` that rewrites `factory.config.json` or `plans/` would violate the never-overwrite-user-content hard constraint. | `--fix` is enumerated and touches only missing scaffold/dangling adapters, never user state; never sets the deploy-approval env var. |
| **Global, machine-wide install requiring sudo** | "Install for all users." | Root-owned `$GRUGOPS_HOME` and PATH munging is OS-specific pain; comparables (rustup, pipx, nvm) all default to `$HOME`. | Default `$GRUGOPS_HOME=~/.grugops` (user-owned), env-var overridable for those who want `/opt`. No sudo path. |

## Feature Dependencies

```
$GRUGOPS_HOME kit/state split (LOCKED design)
    └──requires──> Path-root rewrite across ~31 role/workflow files
                       (kit refs → $GRUGOPS_HOME; handoffs → plans/handoffs/; config → repo)

--target <repo> + confirm prompt
    └──requires──> --yes / non-interactive mode  (so the prompt has a CI bypass)

--update (refresh shared kit)
    └──requires──> shared-home install with $GRUGOPS_HOME

--check / doctor
    └──requires──> path-root rewrite (so it knows which refs to verify)
    └──enhances──> --target, --update, --migrate (run it after each to confirm)

Doctor version-skew detection
    └──requires──> version recorded at seed time (factory.config.json / .grugops)

--migrate (v1.0 → two-root)
    └──requires──> shared-home install + per-repo seed + uninstall logic
    └──requires──> --check (to verify the post-migration state resolves)

Two-root-aware validator (scripts/validate-agent-factory.mjs)
    └──requires──> path-root rewrite + kit/state split

install.mjs parity + install.test.sh
    └──enhances──> every flag above (proves sh/mjs identical, proves the contract)
```

### Dependency Notes

- **Path-root rewrite is the linchpin.** Almost every install feature depends on the kit/state
  references being correct first. The 50 handoff refs, 32 config refs, and ~55 kit refs must move
  before `--check`, `--migrate`, and the validator can be meaningful. Sequence the rewrite (and the
  pending `role-switch-protocol` branch merge it touches) **before** the doctor/migration work.
- **`--target` requires `--yes`.** Adding an interactive prompt without a non-interactive bypass
  would break CI — these two ship together.
- **`--check` underpins everything else.** It is both a standalone table-stakes feature and the
  verification step for `--update` and `--migrate`. Build the doctor early; reuse it.
- **Version-skew detection requires recording a version at seed.** If the seed step does not write
  the installed kit version into the repo, the doctor cannot detect skew. Decide the version-record
  location alongside the config-location open item (`factory.config.json` vs `.grugops/`).

## MVP Definition

### Launch With (v1.1 core)

The minimum that fixes the three dogfood pains (wrong target, symlinks-into-clone, kit never arrives).

- [ ] Path-root rewrite + kit/state split — *the root-cause fix; nothing else resolves without it*
- [ ] Shared-home install to `$GRUGOPS_HOME` (env-overridable, copy not symlink) — *fixes "kit never arrives" + "symlinks into clone"*
- [ ] `--target <repo>` + confirm-the-default prompt — *fixes "wrong target"*
- [ ] `--yes` / non-interactive (auto when stdin not a TTY) — *CI path; prompt needs a bypass*
- [ ] Per-repo seed that skips existing files (config + `plans/` incl. `plans/handoffs/`) — *honors never-overwrite*
- [ ] `--check` doctor: kit-exists, every adapter ref resolves, repo state exists, no dangling symlinks; non-zero exit on FAIL — *the guard that catches all three pains*
- [ ] `DRY_RUN=1` works across the new two-root flow — *existing contract*
- [ ] `install.mjs` mirrors `install.sh`; `install.test.sh` proves parity + idempotency + dry-run + uninstall-restores — *existing contract*
- [ ] Two-root-aware validator update

### Add After Validation (v1.x)

- [ ] `--update` verb to refresh only the shared kit — *add once shared-home install is dogfooded; trigger: a kit change needs to reach existing installs*
- [ ] `--migrate` for v1.0 in-repo installs — *trigger: a real v1.0 repo needs to move; can be manual-doc first, scripted second*
- [ ] Doctor names the specific unresolved path + the file that referenced it — *trigger: first time a vague FAIL wastes debugging time*
- [ ] Two-stage `uninstall` (per-repo adapters vs shared kit) — *trigger: a user wants to remove grugops from one repo without nuking the shared kit*

### Future Consideration (v2+)

- [ ] Doctor version-skew warning (kit vs repo-recorded version) — *defer until multiple repos pin against one shared kit and drift is observed*
- [ ] Doctor `--fix` for enumerated safe repairs — *defer; diagnosis-only is safer first*
- [ ] Plugin-form path resolution (`$GRUGOPS_HOME` vs `${CLAUDE_PLUGIN_ROOT}`, one rule two homes) — *defer to the plugin milestone; design flags this open*

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Path-root rewrite + kit/state split | HIGH | HIGH | P1 |
| Shared-home install to `$GRUGOPS_HOME` (copy, env-overridable) | HIGH | MEDIUM | P1 |
| `--target` + confirm prompt | HIGH | LOW | P1 |
| `--yes` / non-interactive | HIGH | LOW | P1 |
| Per-repo seed, skip-existing | HIGH | MEDIUM | P1 |
| `--check` doctor (resolve refs, exit non-zero on FAIL) | HIGH | MEDIUM | P1 |
| `DRY_RUN=1` across two roots | MEDIUM | LOW | P1 |
| `install.mjs` parity + `install.test.sh` | HIGH | MEDIUM | P1 |
| Two-root-aware validator | MEDIUM | MEDIUM | P1 |
| `--update` shared kit | HIGH | MEDIUM | P2 |
| `--migrate` from v1.0 | MEDIUM | HIGH | P2 |
| Doctor names specific unresolved path | HIGH | MEDIUM | P2 |
| Two-stage uninstall | MEDIUM | MEDIUM | P2 |
| Doctor version-skew warning | LOW | MEDIUM | P3 |
| Doctor `--fix` | MEDIUM | MEDIUM | P3 |
| Plugin-form path resolution | MEDIUM | HIGH | P3 |

**Priority key:** P1 = must have for v1.1 launch · P2 = should have, add after core validates · P3 = future.

## Doctor / `--check` design detail (concrete)

What a good doctor reports, drawn from `brew doctor` / `mise doctor` and grugops's specific failure modes:

- **Missing kit:** `$GRUGOPS_HOME/agent-factory/` absent → FAIL, name the expected path and the install command to fix it.
- **Unresolved path refs:** for each adapter/role, every `$GRUGOPS_HOME/agent-factory/...` and repo-relative (`plans/...`, `factory.config.json`, `plans/handoffs/...`) reference is stat'd; any miss → FAIL naming the *referencing file* and the *missing target* (the differentiator vs vague doctors).
- **Broken/dangling symlinks:** any adapter symlink whose target no longer exists → FAIL (this is the exact dogfood symptom of a moved clone).
- **Missing per-repo state:** `plans/` skeleton or `plans/handoffs/` absent → WARN (re-seedable) or FAIL per policy.
- **Version skew (v2+):** kit `VERSION` vs repo-recorded version mismatch → WARN, never hard-fail.

**Exit-code convention** (so CI can gate on it):
- `0` = all checks pass.
- `1` = at least one FAIL (something is broken / a ref does not resolve).
- `2` = WARN-only (skew, re-seedable scaffold) — optional; many tools collapse WARN into 0. Recommendation:
  **WARN → exit 0** (like `brew doctor` when "working fine") and reserve non-zero for true FAIL, so
  `--check` is safe in a non-blocking CI step but still gateable.
- Provide `--check --strict` to turn WARN into non-zero for teams that want a hard gate (mirrors
  `claude plugin validate --strict`).

## CI / non-interactive path (explicit)

- Detect non-TTY stdin and behave as if `--yes` was passed (no hang).
- `--target` is required (or defaults to CWD) under `--yes`; if a required value is genuinely
  missing, exit non-zero with a clear message rather than prompting.
- `GRUGOPS_HOME` respected from the environment so CI can install to a cache dir.
- `--check` is the CI verification step: `install.sh --target . --yes && install.sh --check`.
- `DRY_RUN=1` lets CI preview without writing — useful for PR checks on the installer itself.

## Competitor Feature Analysis

| Feature | pre-commit | rustup / nvm | brew / mise | grugops v1.1 approach |
|---------|-----------|--------------|-------------|------------------------|
| Shared home | binary on PATH | `$RUSTUP_HOME` / `$NVM_DIR` (env-overridable) | `$HOMEBREW_PREFIX` / `~/.local/share/mise` | `$GRUGOPS_HOME` (default `~/.grugops`, env-overridable) |
| Per-repo footprint | `.pre-commit-config.yaml` + hook | `rust-toolchain.toml` / `.nvmrc` | none / `mise.toml` | `factory.config.json` + `plans/` (incl. `plans/handoffs/`) |
| Target selection | runs in repo CWD | per-dir override | PWD | `--target <repo>` + confirm prompt (default CWD) |
| Non-interactive | config-driven, CI-native | `rustup-init -y` | env vars | `--yes` + non-TTY auto-detect |
| Update verb | `autoupdate` | `self update` / `update` | `update`/`upgrade`, `mise upgrade` | `--update` (refresh shared kit only) |
| Doctor | (none formal) | (none) | `brew doctor` / `mise doctor` | `--check` that names the exact unresolved path |
| Uninstall | git hook removal | `self uninstall` | `brew uninstall` | two-stage `uninstall.sh` (adapters vs kit) |
| Never-clobber | additive config | env-scoped | additive | additive; backs off existing files (`skipped (exists)`), like omz's `.zshrc` backup |
| Version pinning | per-hook rev in config | toolchain pin | tool pin | **declined as a feature** — record + warn on skew, no lockfile/resolver |

## Sources

- pre-commit — install per repo, `autoupdate` flow: https://pre-commit.com/ , https://pre-commit.ci/ (HIGH)
- rustup — `$RUSTUP_HOME`/`$CARGO_HOME` override, `self update`, directory overrides, `-y`: https://rust-lang.github.io/rustup/installation/index.html , https://rust-lang.github.io/rustup/overrides.html (HIGH)
- Cargo home / `CARGO_HOME`: https://doc.rust-lang.org/cargo/guide/cargo-home.html (HIGH)
- mise / asdf — `.tool-versions`/`mise.toml`, loose vs pinned versions, `mise doctor`, asdf successor: https://mise.jdx.dev/faq.html , https://mise.jdx.dev/walkthrough.html , https://asdf-vm.com/manage/versions.html (HIGH)
- direnv — explicit `direnv allow` trust model, per-dir `.envrc`, shell hook install: https://direnv.net/ , https://direnv.net/docs/hook.html (HIGH)
- pipx — `upgrade-all`, `reinstall-all`, `uninstall-all`, `$PIPX_HOME`: https://pipx.pypa.io/latest/ , https://manpages.debian.org/unstable/pipx/pipx.1.en.html (HIGH)
- oh-my-zsh — `$ZSH` home, `omz update`, `uninstall_oh_my_zsh` backs up `.zshrc`: https://github.com/ohmyzsh/ohmyzsh , https://github.com/ohmyzsh/ohmyzsh/wiki/FAQ (HIGH)
- Homebrew — `brew doctor` purpose + exit-code history: https://docs.brew.sh/Troubleshooting , https://github.com/Homebrew/legacy-homebrew/issues/43879 (MEDIUM — exit-code behavior has shifted across versions)
- npm init — `-y`/`--yes` non-interactive convention, CI: https://docs.npmjs.com/cli/v11/commands/npm-init/ (HIGH)
- Claude Code plugin marketplaces — `/plugin marketplace update`, version pin (ref/sha/version), `--scope user\|project\|local`, per-marketplace auto-update: https://code.claude.com/docs/en/plugin-marketplaces (HIGH, fetched 2026-06-06)
- grugops design contract `docs/design/shared-install.md` + current `install/README.md` + `install/install.sh` (project files, HIGH)

---
*Feature research for: install/CLI UX of grugops v1.1 shared-location install*
*Researched: 2026-06-06*
