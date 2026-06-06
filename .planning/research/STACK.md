# Stack Research — v1.1 Shared-Location Install Conventions

**Domain:** Install/path-resolution mechanics for a markdown "agent factory" kit that moves to a shared home (`$GRUGOPS_HOME`, default `~/.grugops`) with per-repo state, resolved identically in POSIX `sh` (`install.sh`) and Node stdlib (`install.mjs`).
**Researched:** 2026-06-06
**Confidence:** HIGH (XDG spec, Node `os`/`path` APIs, and tool-home conventions all verified against primary sources)

> Scope note: this is **not** a library-shopping exercise. The hard constraints forbid new deps, `package.json`, or anything non-markdown beyond the two installers + one validator. So "stack" here = **conventions and stdlib mechanisms** the refactor must adopt. Every recommendation below is dep-free and stdlib-only by construction.
>
> This file supersedes the v1.0 STACK.md (distribution-format research, now mirrored in CLAUDE.md) and is scoped to the v1.1 install redesign only.

---

## TL;DR — the locked answers this milestone needs

1. **Keep `~/.grugops` (a `$TOOL_HOME` dotdir). Do NOT move under XDG (`~/.local/share`, `~/.config`).** Every comparable cross-platform dev tool — rustup, cargo, nvm, pyenv, volta — uses `$TOOL_HOME → ~/.tool`, not XDG. XDG is Linux-desktop-centric, splits one logical home across 3+ dirs, and is widely ignored by exactly grugops's peer class. A single `$GRUGOPS_HOME` is simpler, cross-platform, and matches user expectation. **(HIGH)**
2. **Precedence rule: `$GRUGOPS_HOME` if set-and-non-empty, else `$HOME/.grugops`.** Use `${GRUGOPS_HOME:-"$HOME/.grugops"}` in sh (colon form) and the explicit empty-check in Node. **(HIGH)**
3. **Resolve `$HOME` via the OS, never store a literal `~`.** sh: `$HOME` (Git Bash maps it from `%USERPROFILE%`). Node: `os.homedir()` (POSIX `$HOME`, Windows `USERPROFILE`). A baked-in `~/.grugops` string that is *not* shell-expanded is a known failure mode (nvm #2074). **(HIGH)**
4. **Copy, not symlink — the dogfood was right and Windows proves it.** Git Bash `ln -s` silently deep-copies by default; Windows symlinks need Developer Mode or admin. Copy is the only mode that behaves identically on all platforms. Keep symlink only as an opt-in (`INSTALL_MODE=symlink`). **(HIGH)**
5. **Drift detection = stamp the installed `VERSION` into the target; `--check` compares.** The kit already ships `agent-factory/VERSION` (`0.1.0`). Write the installed version into a small per-repo marker; the doctor reports stale/missing/mismatch. No checksums, no manifest format, no deps. **(MEDIUM — convention choice, not a spec)**

---

## Recommended Stack

### Core Technologies (conventions + stdlib only)

| Technology / Convention | Version | Purpose | Why Recommended |
|------------------------|---------|---------|-----------------|
| **`$GRUGOPS_HOME` env var → `~/.grugops` default** | n/a | The single shared kit root | Matches the dominant cross-platform dev-tool convention (rustup `RUSTUP_HOME→~/.rustup`, cargo `CARGO_HOME→~/.cargo`, nvm `NVM_DIR→$HOME/.nvm`, pyenv `PYENV_ROOT→$HOME/.pyenv`, volta `VOLTA_HOME→~/.volta`). One env var, one home, overridable. (HIGH) |
| **POSIX `${GRUGOPS_HOME:-"$HOME/.grugops"}`** | POSIX.1 | sh-side resolution | The `:-` (colon) operator treats empty-string the same as unset — the safe choice so `GRUGOPS_HOME=` (exported blank in CI) still falls back. (HIGH — POSIX spec) |
| **Node `os.homedir()`** | Node 18+ (stable since v2.3) | Node-side `$HOME` equivalent | "On POSIX, uses `$HOME`…; on Windows, uses `USERPROFILE`." Identical resolution to Git Bash's `$HOME`, so both installers land in the same place. Stdlib `node:os`. (HIGH — Node v24 API docs) |
| **Node `path.resolve()` / `path.join()`** | Node 18+ | Build absolute kit/state paths | `path.resolve(homedir, ".grugops")` normalizes + absolutizes cross-platform (handles `\` vs `/`). Stdlib `node:path`. Already used in `install.mjs`. (HIGH) |
| **Node `fileURLToPath(import.meta.url)`** | Node 18+ | Locate the installer's own dir (the kit source) | Already in `install.mjs:34-39`; the ESM-correct way to get `__dirname`. Keep. (HIGH) |
| **`agent-factory/VERSION` (SemVer string)** | 0.1.0 | Drift signal | Already exists. Stamp it into the target on install; `--check` compares installed-vs-current. The cheapest possible drift detector — no manifest, no hashing. (MEDIUM) |

### Supporting Mechanisms

| Mechanism | Where | Purpose | When to Use |
|-----------|-------|---------|-------------|
| **`--check` / doctor subcommand** | both installers | Verify every kit ref resolves under `$GRUGOPS_HOME` and every state ref resolves in the target; exit non-zero + name the first missing path | Run after install, and as the standalone diagnostic the design calls for (the guard that catches all three dogfood pains). Mirrors `brew doctor` / `flutter doctor` / `npm doctor`. (MEDIUM) |
| **`--target <repo>` flag + interactive prompt** | both installers | Stop defaulting the *kit* target to `$(pwd)`/clone | Replaces the obscure `TARGET=` env var as the primary UX. Keep `TARGET=` honored for non-interactive/CI parity. (HIGH — design §Installer changes) |
| **Per-repo install marker** (e.g. `plans/.grugops-install.json` or a line in an existing state file) | target repo | Record installed kit version + resolved `$GRUGOPS_HOME` at install time | Enables `--check` to detect drift and to re-resolve the home the adapters were written against. Keep it tiny and additive. (LOW — exact filename is an open decision below) |
| **`command -v node`** | `install.sh` | Detect Node for the JSON-merge delegation | Already used (`install.sh:162`). The same fail-safe pattern (defer when Node absent) applies to any JSON the doctor must read. (HIGH) |

### Development / Verification Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **`install/install.test.sh`** | Regression harness for the two-root layout | Already exists (13/13). Must grow cases: env-override precedence, empty-`GRUGOPS_HOME` fallback, copy-default, `--check` pass/fail, idempotent re-run = zero diff. (HIGH) |
| **`scripts/validate-agent-factory.mjs`** | Structure validator, now two-root aware | Per design §Validator: validate kit at `$GRUGOPS_HOME`/`VALIDATE_ROOT` and a target independently. Stays stdlib-only, never fabricates a pass, never writes `package.json`. (HIGH) |
| **`DRY_RUN=1`** | Preview every mutation | Existing contract; extend to cover kit-copy-to-`$GRUGOPS_HOME` and the new marker write. (HIGH) |

---

## Installation (how resolution is wired — stdlib only, copy-paste shape)

The single rule, expressed identically in both languages:

```sh
# install.sh — POSIX. Colon form: empty string falls back like unset.
# NEVER write a literal "~/.grugops" as the default — the tilde is not
# expanded when it lands in an env-var value (nvm #2074). Use $HOME.
GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}

# $HOME is correct on Windows too: Git Bash/MSYS map it from %USERPROFILE%
# when $HOME is unset, so this matches Node's os.homedir() on the same box.
```

```js
// install.mjs — Node stdlib (node:os, node:path). Empty string must also fall back,
// so test truthiness, not just `process.env.X ? ...`.
import { homedir } from "node:os";
import { resolve } from "node:path";

const GRUGOPS_HOME = process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
  ? resolve(process.env.GRUGOPS_HOME)
  : resolve(homedir(), ".grugops");
```

Parity check the two must satisfy: on the same machine, with the same `GRUGOPS_HOME` (set, unset, or empty), both print the same absolute kit root. Add that to `install.test.sh`.

Kit paths then read `"$GRUGOPS_HOME/agent-factory/…"`; state paths stay repo-relative (`plans/…`, `plans/handoffs/…`, the repo `factory.config.json`, `memory-bank/…`) — exactly the split in the design doc.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `~/.grugops` (single `$TOOL_HOME` dotdir) | **XDG dirs** (`$XDG_DATA_HOME/grugops`, `$XDG_CONFIG_HOME/grugops`, `$XDG_STATE_HOME/grugops`) | Only if grugops were a Linux-desktop app that wanted OS backup/sync policies to treat config vs cache vs state differently. It is not: it is a cross-platform CLI kit, the kit is read-only (no real config/cache/state distinction at the home), and XDG would scatter one logical kit across three dirs *and* still need a Windows story. The peer tools (rustup/cargo/nvm/pyenv/volta) all rejected XDG for the same reasons. **Recommendation: do not adopt XDG.** |
| Single `$GRUGOPS_HOME` env var | Per-project override env/flag | A per-project `$GRUGOPS_HOME` override is essentially free (env wins, always) — document it but do not build extra machinery. A *file*-based per-repo override is an open question (below); default answer: not needed. |
| Copy the kit into `$GRUGOPS_HOME` | Symlink the kit | Symlink only as opt-in `INSTALL_MODE=symlink` for a Unix dev who is actively hacking on the kit and wants live edits. Never the default. |
| Stamp `VERSION` + `--check` for drift | Per-file checksum manifest | A checksum manifest is justified only if grugops ever needs to detect *tampering* of the read-only kit. For "is the installed kit stale vs current?" a single VERSION compare is enough and dep-free. |
| `--check` doctor (named first failure) | Full self-healing auto-repair | Auto-repair (re-copy on drift) can be a *follow-up* `--check --fix`. Ship detect-and-report first; repair is additive later. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **XDG Base Directory dirs for the kit home** | Linux-desktop spec (v0.8, 2021); splits one read-only kit across data/config/state; ignored by the entire peer class; no native Windows mapping | Single `$GRUGOPS_HOME` → `~/.grugops` |
| **A literal `~` baked into a default or written into a marker** | `~` is shell *interactive/assignment* sugar; it does NOT expand inside an env-var value or a JSON string (root cause of nvm #2074: `NVM_DIR="~/.nvm"` → "directory does not exist") | `$HOME` in sh, `os.homedir()` in Node — always resolve to an absolute path before storing |
| **`${GRUGOPS_HOME-default}` (no colon)** | Without the colon, an exported-but-empty `GRUGOPS_HOME=` is treated as "set" and you get an empty kit root | `${GRUGOPS_HOME:-"$HOME/.grugops"}` (colon form) |
| **Default `INSTALL_MODE=symlink` (current `install.sh:40`, `install.mjs:43`)** | Dogfood disliked symlinks; Git Bash `ln -s` silently deep-copies; Windows symlinks need Developer Mode/admin → non-deterministic across platforms | Flip the default to `copy`; keep `symlink` as explicit opt-in |
| **Kit target defaulting to `$(pwd)` / clone (current `install.sh:36`)** | The original "installs into the clone" bug; the kit must go to `$GRUGOPS_HOME`, only *state* seeds into the chosen repo | `--target <repo>` for state; `$GRUGOPS_HOME` (env/default) for the kit |
| **Any new npm dependency, `package.json`, or non-stdlib Node module** | Hard project constraint (zero deps, threat T-05-05-SC accepted on that basis) | `node:fs`, `node:path`, `node:os`, `node:url` only — all already imported |
| **`fs.realpathSync`/symlink-following to "guess" the kit when `$GRUGOPS_HOME` is wrong** | Hides misconfiguration; the doctor should fail loudly with the missing path, not silently hunt (that hunting *is* the original bug) | `--check` names the first unresolved path and exits non-zero |
| **`os.userInfo().homedir` as the primary home source** | Reads `/etc/passwd`/registry and can diverge from `$HOME`/`USERPROFILE` that the user actually set; less predictable for "respect the user's env" | `os.homedir()` (env-first), matching sh `$HOME` |

---

## Stack Patterns by Variant

**If running under Git Bash / MSYS2 on Windows (the `install.sh` path on Windows):**
- `$HOME` resolves from `%USERPROFILE%` automatically when unset → `~/.grugops` lands in the Windows user profile, same place `install.mjs`'s `os.homedir()` picks. No special-casing needed.
- Force `INSTALL_MODE=copy` (the new default already does this); do not rely on `ln -s`.
- Because: MSYS deep-copies symlinks by default and native Windows symlinks need elevated/Developer-Mode privileges — copy is the only deterministic mode.

**If running `install.mjs` natively on Windows (no POSIX shell):**
- `os.homedir()` → `%USERPROFILE%` (e.g. `C:\Users\me`), `path.resolve(homedir(), ".grugops")` → `C:\Users\me\.grugops`. `path.join`/`resolve` emit `\` correctly.
- Because: this is the whole reason `install.mjs` exists — the Windows/no-POSIX sibling of `install.sh` (design + file header).

**If the host is a Claude Code *plugin* install (future, flagged open in design):**
- The kit root becomes `${CLAUDE_PLUGIN_ROOT}` instead of `$GRUGOPS_HOME` — "one resolution rule, two homes." Have a single `resolve_kit_root()` that prefers `$GRUGOPS_HOME` when set, else `${CLAUDE_PLUGIN_ROOT}` when present (plugin context), else `~/.grugops`.
- Because: plugins are copied to a cache; the adapters must point at whichever home actually contains `agent-factory/`. Resolve, don't hardcode.

**If `$GRUGOPS_HOME` is set to a relative path:**
- Reject or absolutize it. POSIX XDG precedent: "If an implementation encounters a relative path… it should consider the path invalid and ignore it." Cheapest safe behavior: `path.resolve()` it (Node) / `cd -- "$dir" && pwd` it (sh) so everything downstream is absolute.
- Because: relative kit roots break the moment any role runs from a different cwd.

---

## Version Compatibility

| Item | Compatible With | Notes |
|------|-----------------|-------|
| `os.homedir()`, `path.resolve()`, `path.join()`, `fileURLToPath()` | Node 18+ LTS (all stable well before 18) | Verified against Node v24 API docs; no version risk. Matches the project's stated Node 18+ baseline. |
| `${VAR:-default}` colon expansion | POSIX.1 / any `sh` | Universal; works in dash, bash, busybox, MSYS. |
| `$HOME` mapped from `%USERPROFILE%` | Git for Windows / MSYS2 (current) | Cygwin/MSYS resolution order: existing `$HOME` → `/etc/passwd` → `HOMEDRIVE`/`HOMEPATH` → `/`. For grugops, `$HOME` is set in a normal Git Bash session, so it matches `os.homedir()`. |
| XDG Base Directory Spec | v0.8 (2021-05-08), still current | Confirmed latest. Relevant only as the *rejected* alternative + the absolute-path rule we borrow. |
| `agent-factory/VERSION` (0.1.0) + `plugin.json` version (0.1.0) | SemVer 2.0.0 | Already in sync; the drift stamp reuses this string — no new versioning surface. |

---

## Open Decisions to Flag for Requirements/Roadmap

These are *choices*, not unknowns — each has a recommended default but the human/roadmap should ratify:

1. **Per-repo config location** (design open item): repo-root `factory.config.json` vs `.grugops/factory.config.json`. **Recommendation: repo-root** (matches the 32 existing refs; least rewrite; visible). LOW friction either way.
2. **Install-marker file** for drift/`--check`: filename + location (e.g. `plans/.grugops-install.json` holding `{version, grugopsHome, installedAt}`). **Recommendation: a single small JSON under `plans/`** so it travels with per-repo state and stays out of the kit. Must be additive + gitignorable-or-committable at the user's choice.
3. **Plugin home resolution** (`$GRUGOPS_HOME` vs `${CLAUDE_PLUGIN_ROOT}`): one `resolve_kit_root()` with documented precedence. Defer the *implementation* until the plugin phase, but design the resolver signature now so the rewrite lands once.
4. **`--check --fix` (auto re-copy on drift):** defer to a follow-up; ship detect-and-report first.

## Conflicts With Project Constraints — checked, none

- Zero-dep / no `package.json`: ✅ every mechanism is `node:` stdlib or POSIX builtin.
- Single-source (role text lives once): ✅ shared `$GRUGOPS_HOME` *strengthens* this — the kit exists in exactly one place instead of vendored per-repo.
- Idempotent/additive/dry-run/reversible, never delete user state: ✅ copy-to-home is idempotent (re-copy = same bytes), the marker is additive, `--check` is read-only, migration must preserve `plans/`+`memory-bank/`.
- No fabrication: ✅ `--check` reports real resolved paths; the plugin install lines stay `UNKNOWN - verify`.

---

## Sources

- **freedesktop.org — XDG Base Directory Specification v0.8 (2021-05-08)** — confirmed current version/status, exact variable defaults (`$XDG_DATA_HOME→$HOME/.local/share`, `$XDG_CONFIG_HOME→$HOME/.config`, `$XDG_STATE_HOME→$HOME/.local/state`, `$XDG_CACHE_HOME→$HOME/.cache`), and the absolute-path-or-ignore rule. (HIGH)
- **Node.js v24 API docs (`os.homedir`, `path.resolve`) via Context7 `/websites/nodejs_latest-v24_x_api`** — `os.homedir()` POSIX `$HOME` / Windows `USERPROFILE` behavior; `path.resolve` right-to-left absolutization. (HIGH)
- **The Cargo Book — Cargo Home + Environment Variables; rust-lang/rustup installation docs** — `CARGO_HOME→$HOME/.cargo` (`%USERPROFILE%\.cargo` on Windows), `RUSTUP_HOME→~/.rustup`, env-overrides-default precedence. (HIGH)
- **nvm-sh/nvm env-var docs + issue #2074** — `NVM_DIR→$HOME/.nvm`; the tilde-not-expanded-in-env-var gotcha and the "use `$HOME`, not `~`" fix. (HIGH)
- **pyenv/pyenv README; Volta docs (docs.volta.sh)** — `PYENV_ROOT→$HOME/.pyenv`; `VOLTA_HOME→$HOME/.volta` Unix / `%LOCALAPPDATA%\Volta` Windows — confirming the `$TOOL_HOME` dotdir convention over XDG. (HIGH)
- **msys2.org configuration + gitforwindows.org symbolic-links; Windows Dev Blog "Symlinks in Windows 10"** — Git Bash `ln -s` deep-copies by default; native Windows symlinks need admin/Developer Mode → copy-default justification. (HIGH)
- **POSIX parameter-expansion reference (`${VAR:-word}` vs `${VAR-word}`)** — colon treats empty == unset. (HIGH)
- **npm-doctor / flutter doctor / brew doctor** — the `doctor`/`--check` "verify environment, report status, name fixes, exit non-zero on failure" convention. (MEDIUM)

---
*Stack research for: v1.1 shared-location install ($GRUGOPS_HOME + per-repo state) — conventions & stdlib mechanisms, zero-dep.*
*Researched: 2026-06-06*
