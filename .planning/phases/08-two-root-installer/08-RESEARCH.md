# Phase 8: Two-Root Installer - Research

**Researched:** 2026-06-07
**Domain:** POSIX-sh + Node-stdlib installer refactor for a two-root layout (shared read-only kit at `$GRUGOPS_HOME` + per-repo writable state seeded into a target)
**Confidence:** HIGH

> This is a **synthesis** RESEARCH.md. Milestone-level analysis already exists at
> `.planning/research/{SUMMARY,STACK,ARCHITECTURE,PITFALLS}.md` and the canonical design at
> `docs/design/shared-install.md`. CONTEXT.md states "no additional phase-level research needed."
> Net-new effort below is concentrated in the **Claude's-Discretion design recommendations**
> (install-marker shape, materialization mechanism + re-materialization idempotency, self-checkout
> predicate, seed sub-location + gate-exclusion glob, sh/Node byte-parity for the injected path line).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**State seed scope**
- **D-01:** Seed the **full state-plane skeleton** into the target so `/grugops` works on first run with no bootstrap: `.grugops/factory.config.json` + the install marker, the full `plans/` skeleton (`board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md`, the `epics/features/tickets/sprints/releases/` dirs, and `plans/handoffs/`), and the `memory-bank/` seed (`00-index`..`80-glossary` + `50-decisions/ADR-template.md`). The orchestrator adapter hard-reads `.grugops/factory.config.json`, root `AGENTS.md`, and `plans/board.md` on start — a minimal seed would fail before bootstrap.
- **D-02:** All seeds are **bundled in the kit** so they travel to `$GRUGOPS_HOME` with the kit copy; the installer seeds any target FROM `$GRUGOPS_HOME` (self-contained, works with no grugops source checkout present). Mirrors the existing precedent that the default `factory.config.json` already lives in the kit. Exact seed sub-location is planner discretion.
- **D-03:** The bundled state-seed subtree is **excluded from `scripts/check-kit-refs.sh`'s scan**. Seeds are state TEMPLATES whose `.grugops/…` and `plans/…` refs resolve in the **target**, not the kit root. Phase 8 makes this one gate-exclusion edit.
- **D-04:** Seeding **never overwrites**: every seeded file is skipped if it already exists in the target (never-clobber contract).

**Shared-kit lifecycle**
- **D-05:** On install, the kit at `$GRUGOPS_HOME` is **always (re)copied** from the running checkout — same version → no effective diff (idempotent); newer checkout → shared kit updates in place. **No version negotiation** (SKEW-01 → v1.2). Kit is grugops-owned read-only, so overwriting it is not "user content."
- **D-06:** Uninstall (run from a target) removes **adapters + wiring only**: `.claude` adapters, the CLAUDE.md / Copilot sentinel pointers, the Gemini `context.fileName` entry, and the `.grugops` install marker. It **NEVER** deletes the shared `$GRUGOPS_HOME` kit and **NEVER** deletes seeded state. No `--purge-kit` flag this phase.

**Source-checkout guard**
- **D-07:** The installer **refuses by default** when the target resolves to the grugops source checkout itself (resolved `TARGET == GRUGOPS_SRC`, and/or grugops source markers present), STOPping with a clear message. An explicit `--allow-self` / `--force` override proceeds. Exact detection predicate is planner discretion.

**Carry-forward cleanups (folded into Phase 8)**
- **D-08 (WR-05):** Drop the `Agent` (spawn) tool grant from the two packaging templates (`agent-factory/packaging/subagent.frontmatter.md` and `agent-factory/packaging/slash-command.template.md`). grugops uses single-window sequential role-load by design, NOT sub-agent spawning. These files ship in the kit copied to `$GRUGOPS_HOME`.
- **D-09 (IN-01):** Rewrite stale `agent-factory/config/…` config paths in `agent-factory/README.md` + `agent-factory/config/factory.config.md` to the current `.grugops/factory.config.json` spelling. (Doc prose only; the default config FILE legitimately stays at `agent-factory/config/factory.config.json` as the seed source.)

### Claude's Discretion
- **Install-marker content/shape** — what `.grugops/` records (kit version stamp, materialized absolute kit path, install date/mode). Forward-compatible (Phase 9 doctor reads it); minimal, parse-stable; sh + Node write it identically (byte-parity).
- **Materialization mechanism** — how the absolute `KIT=` line is injected into adapters; the **re-materialization idempotency** rule (re-run = zero diff when `$GRUGOPS_HOME` unchanged; correct update when changed — note the existing `link_or_copy` "identical copy" idempotency check won't apply once the adapter carries an injected line).
- **Which adapters carry the resolver** — confirm which target files get the materialized absolute path vs which merely delegate.
- **Interactive prompt** wording + default, `--target`/`--yes`/non-TTY detection mechanics, exact self-checkout predicate (D-07).
- **Exact kit-bundled seed sub-location** + the gate-exclusion glob (D-02/D-03).
- **`os.homedir()` parity** — `install.mjs` resolves Windows home via `os.homedir()` not `$HOME`; sh/Node kit-root and seeded-target trees stay byte-identical.

### Deferred Ideas (OUT OF SCOPE)
- **`uninstall.sh --purge-kit`** — explicit confirm-gated kit removal. Manual `rm` suffices this phase.
- **Version-skew negotiation** (SKEW-01) — v1.2; Phase 8 always re-copies without comparing versions.
- **Migration** of already-installed in-repo `agent-factory/` + symlink layouts (MIGR-01) — v1.2; never delete-first.
- **Plugin-form kit resolution** via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01) — v2+.
- **`install.test.sh` split rewrite** + `--check` doctor + two-root validator — Phase 9 (INSTALL-05, VAL-02). Phase 8 must leave the existing harness passing but not rewrite it.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INSTALL-03 | `install.sh`/`install.mjs` accept `--target <repo>` + interactive confirm-default prompt + `--yes`/non-TTY bypass; run correctly from any CWD | Arg-parsing + TTY-detection patterns (Architecture Pattern 4); `--target` layers over the existing `TARGET` env override [VERIFIED: codebase grep — `install.sh:36`, `install.mjs:40`]; self-checkout guard (D-07) closes the `--yes`/CI silent-self-install hole |
| INSTALL-04 | Seed per-repo state (`.grugops/factory.config.json` from kit default + install marker/version stamp + `plans/` skeleton incl. `plans/handoffs/`) without clobbering; default mode **copy** (symlink opt-in); idempotent/additive/`DRY_RUN=1`/reversible preserved; `install.mjs` byte-parity (Windows home via `os.homedir()`) | Kit-copy + seed-from-`$GRUGOPS_HOME` flow (Architecture Pattern 1-3); never-clobber via existing `ensure_block`/skip-if-exists discipline (D-04); copy-default flip (D-05); home resolution snippets verified in STACK.md [CITED: .planning/research/STACK.md §Installation] |
</phase_requirements>

## Summary

Phase 8 turns the existing single-root adapter installer into a **two-root** installer: it (1) resolves `${GRUGOPS_HOME:-$HOME/.grugops}`, (2) **copies** the read-only kit there (`$GRUGOPS_HOME/agent-factory/…`), (3) **materializes** the resolved absolute kit path into exactly the adapters that carry the sole-resolver block, and (4) **seeds** the full per-repo state plane into the target without clobbering. This is the direct fix for the three measured dogfood pains (DOG-02): wrong target (`TARGET=$(pwd)`), symlink fragility (`INSTALL_MODE=symlink` default), kit never arrives (installer never touched `agent-factory/`).

The work is heavily **extend-not-rewrite**: `install/install.sh` is a clean, well-factored POSIX base (`do_run`/`mkdirp`/`ensure_block`/`link_or_copy`/`merge_gemini`/`detect_tools`, all under `DRY_RUN` discipline) and `install/install.mjs` mirrors it function-for-function — the byte-parity contract is already established and tested by `install/install.test.sh` (Checks 4/4b). The single hardest net-new mechanism is **adapter materialization**: writing a machine-specific absolute `KIT=` line into the adapters AND making re-runs produce zero diff — because the moment an adapter carries an injected line, the existing `cmp -s src dest` "identical copy" idempotency check in `link_or_copy` no longer holds for those files. The second-hardest is keeping sh and Node **byte-identical** on the injected absolute path (the path string itself can differ if home resolution diverges — `$HOME` vs `os.homedir()`).

**Primary recommendation:** Add a `resolve_grugops_home()` (sh) / `resolveGrugopsHome()` (Node) helper using the verified `${GRUGOPS_HOME:-"$HOME/.grugops"}` / `os.homedir()` snippets; add a `copy_kit` step (atomic write-then-rename of `agent-factory/` into `$GRUGOPS_HOME`); add a `materialize_adapter` helper that replaces a known placeholder line in the 2 resolver adapters (idempotent by content-stamp, not by `cmp`); add a `seed_state` step that copies the kit-bundled seed subtree into the target skipping existing files; flip `INSTALL_MODE` default to `copy`; add `--target`/`--yes`/prompt + the D-07 self-checkout guard. Mirror every change in `install.mjs`. Do NOT touch `install.test.sh` (its split rewrite is Phase 9) — but the new behavior must leave its 7 existing checks green.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home resolution (`$GRUGOPS_HOME`) | Installer (sh + Node) | — | The installer is the only place an absolute kit root is computed; adapters get the *result* materialized, never the resolution logic [CITED: 07-CONTEXT.md D-11/D-12] |
| Kit copy to `$GRUGOPS_HOME` | Installer | Filesystem | grugops-owned read-only cache; overwrite-on-install is not "user content" (D-05) |
| Adapter materialization | Installer | Adapter (carries the injected line + self-heal fallback) | The adapter is the sole resolver; the installer binds the absolute path into it (Mechanism A); the adapter's bash self-heal is Mechanism B [CITED: SUMMARY.md §Architecture] |
| Per-repo state seed | Installer | Target repo (writable) | State is per-project, never shared; seeded once, then owned by the user (D-01/D-04) |
| Kit-vs-state disambiguation | Kit prose + adapter preamble (frozen in Phase 7) | — | Already landed; Phase 8 consumes it, does not change it |
| Reversal (uninstall) | `uninstall.sh` | Target repo | Adapters + wiring + install marker only; never the shared kit or seeded state (D-06) |
| Build-gate exclusion of seeds | `scripts/check-kit-refs.sh` | — | Seeds are target-resolved templates, not kit refs (D-03) |

## Standard Stack

This phase adds **zero dependencies** by hard project constraint (Markdown-only except the two installers + one validator; stdlib-only Node; no `package.json` runtime deps). "Stack" = POSIX builtins + Node 18+ stdlib mechanisms + conventions.

### Core
| Mechanism | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `${GRUGOPS_HOME:-"$HOME/.grugops"}` (POSIX `:-`) | POSIX.1 | sh-side kit-home resolution | Colon form treats empty-string as unset, so `GRUGOPS_HOME=` exported blank in CI still falls back. Matches rustup/cargo/nvm/pyenv/volta `$TOOL_HOME` convention [CITED: .planning/research/STACK.md §Core, HIGH] |
| `os.homedir()` + `path.resolve()` | Node 18+ stdlib | Node-side home (Windows `USERPROFILE`, POSIX `$HOME`) | Identical resolution to Git Bash `$HOME`, so both installers land in the same place; `path.resolve(homedir(), ".grugops")` normalizes `\` vs `/` [CITED: .planning/research/STACK.md §Core, HIGH] |
| `cp -R` (sh) / `fs.cpSync(..., {recursive})` or manual walk (Node) | POSIX / Node 16.7+ | Copy `agent-factory/` → `$GRUGOPS_HOME` | Copy is the only mode behaving identically on all platforms (Git Bash `ln -s` silently deep-copies; Windows symlinks need Developer Mode) [CITED: STACK.md item 4, PITFALLS.md C5, HIGH] |
| `agent-factory/VERSION` stamp | `0.1.0` (current) | Drift signal for the Phase 9 doctor | Already ships; cheapest possible drift detector — single SemVer compare, no manifest/hashing [VERIFIED: codebase — `agent-factory/VERSION` = `0.1.0`] |
| temp-dir-then-`rename` for the kit copy | POSIX / Node | Atomic kit install/update | A concurrent reader never sees a partial kit (PITFALLS.md §Performance — concurrent kit update) [CITED: PITFALLS.md, MEDIUM] |

### Supporting
| Mechanism | Purpose | When to Use |
|-----------|---------|-------------|
| `[ -t 0 ]` (sh) / `process.stdin.isTTY` (Node) | Non-TTY detection for the `--yes` auto-bypass | Any time the interactive prompt would block CI [ASSUMED — standard POSIX/Node idiom, not verified against a cited source this session] |
| `command -v node` (existing, `install.sh:162`) | Detect Node for JSON-merge delegation | Already used by `merge_gemini`; the same fail-safe applies to any JSON the marker write needs [VERIFIED: codebase grep] |
| `getent passwd "$(id -u)"` fallback | Container `$HOME`-unset recovery | OpenShift/arbitrary-UID containers where `$HOME` is unset or `/` [CITED: PITFALLS.md §Integration Gotchas, MEDIUM] — confirm-with-test, do not build speculatively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Copy kit to `$GRUGOPS_HOME` | Symlink kit into target | Rejected by design — the dogfood pain itself; breaks if clone moves; user disliked symlinks (D-05, PITFALLS.md C5). `INSTALL_MODE=symlink` stays opt-in only |
| `.grugops/factory.config.json` (repo) | Repo-root `factory.config.json` | ARCHITECTURE.md once recommended repo-root; **SUPERSEDED** by SHOME-02 → use `.grugops/` [CITED: STATE.md Blockers/Concerns] |
| Materialize absolute path into adapters | Bare `$GRUGOPS_HOME` in adapter prose | An LLM does NOT expand `$GRUGOPS_HOME` in prose — dead string (the DOG-02 failure one layer up). Mechanism A (materialize) + B (bash self-heal) only [CITED: SUMMARY.md, HIGH] |
| `cp -R` whole kit | Per-file `link_or_copy` loop for kit | Kit is ~7 dirs of read-only files; bulk recursive copy is simpler and the kit is grugops-owned so no per-file clobber concern (unlike adapters/state) |

**Installation:** No package install — all mechanisms are stdlib/builtin.

**Version verification:** N/A — no external packages. The only "version" is `agent-factory/VERSION` (`0.1.0`), verified present in the repo.

## Package Legitimacy Audit

**Not applicable.** This phase installs **zero external packages** (hard project constraint: stdlib-only Node, no `package.json` runtime deps, Markdown-only otherwise). No registry, slopcheck, or postinstall surface to audit. The threat model already documents "accept — no external packages" (`install.mjs:4`, threat T-05-05-SC).

## Architecture Patterns

### System Architecture Diagram

```
  user runs:  sh install/install.sh --target ../app        node install/install.mjs --target ../app
                          │                                            │
                          ▼                                            ▼
              ┌───────────────────────────────────────────────────────────────┐
              │  ARG PARSE + RESOLUTION (sh & Node, byte-identical results)     │
              │   --target ../app  →  TARGET (layers over TARGET env)          │
              │   GRUGOPS_SRC      →  the running checkout (script's repo root) │
              │   resolve_grugops_home()  →  ${GRUGOPS_HOME:-$HOME/.grugops}   │
              │                              / resolve(os.homedir(),".grugops")│
              └───────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────────┐   refuse (STOP) unless --allow-self
              │  D-07 self-checkout guard │──► "you probably meant --target <your-repo>"
              │  TARGET == GRUGOPS_SRC ?  │
              └──────────────────────────┘
                          │ ok
            ┌─────────────┼─────────────────────────────────┐
            ▼             ▼                                   ▼
   ┌─────────────┐  ┌──────────────────────────┐   ┌────────────────────────────┐
   │ COPY KIT    │  │ MATERIALIZE ADAPTERS      │   │ SEED STATE (into TARGET)   │
   │ agent-      │  │ into 2 resolver adapters: │   │ from $GRUGOPS_HOME seed     │
   │ factory/ →  │  │  .claude/skills/grugops/  │   │ subtree, SKIP-IF-EXISTS:    │
   │ $GRUGOPS_   │  │  .claude/agents/grugops-  │   │  .grugops/factory.config... │
   │ HOME/agent- │  │  orchestrator.md          │   │  .grugops/<install-marker>  │
   │ factory/    │  │  (inject absolute KIT=    │   │  plans/** incl. handoffs/   │
   │ (atomic     │  │   line; the 6 dash skills │   │  memory-bank/**             │
   │  tmp→rename)│  │   delegate, NOT mater-    │   │                             │
   │             │  │   ialized)                │   │  + adapters/AGENTS.md/      │
   │             │  │                           │   │    CLAUDE.md/Gemini/Copilot │
   │             │  │                           │   │    wiring (EXISTING flow)   │
   └─────────────┘  └──────────────────────────┘   └────────────────────────────┘
            │             │                                   │
            └─────────────┴─────────────────────────────────┘
                          ▼
              ┌──────────────────────────────────┐
              │  TARGET resolves /grugops on      │
              │  first run: adapter → absolute    │
              │  kit path → agent-factory/roles/  │
              │  orchestrator.md ; reads seeded   │
              │  .grugops/factory.config.json +   │
              │  plans/board.md . No path error.  │
              └──────────────────────────────────┘

  DRY_RUN=1 narrates every box above and mutates NOTHING (existing do_run discipline extended).
```

### Component Responsibilities

| File | Phase 8 responsibility |
|------|------------------------|
| `install/install.sh` | Add home-resolve, kit-copy, adapter-materialize, state-seed, `--target`/`--yes`/prompt, self-checkout guard; flip default to copy. Behavioral spec for the Node twin. |
| `install/install.mjs` | Mirror every behavioral change; resolve home via `os.homedir()`; produce byte-identical kit root + seeded target tree. |
| `install/uninstall.sh` | Two-root update (D-06): also remove the `.grugops/` install marker; NEVER touch `$GRUGOPS_HOME` or seeded state. Extend `is_protected()` to cover seeded `.grugops/` state if needed (the marker is grugops-owned but seeded config is user state once filled). |
| `install/README.md` | Document `--target`, copy-default, two-root behavior, `$GRUGOPS_HOME`. |
| `scripts/check-kit-refs.sh` | One edit: exclude the kit-bundled seed subtree from the scan (D-03). |
| `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md` | The 2 materialization targets (carry the full resolver block). The 6 dash skills delegate — NOT materialized. |
| `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/slash-command.template.md` | D-08: drop `Agent` grant + the prose that justifies it. |
| `agent-factory/README.md`, `agent-factory/config/factory.config.md` | D-09: rewrite stale `agent-factory/config/…` config-path prose to `.grugops/factory.config.json`. |

### Pattern 1: Resolve `$GRUGOPS_HOME` once, identically in both installers
**What:** A single helper computes the absolute kit home; both installers must produce the same string for the same env.
**When to use:** First step after arg parse, before any kit/adapter write.
**Example:**
```sh
# install.sh — POSIX. Empty-string falls back like unset (the :- colon form).
# Source: .planning/research/STACK.md §Installation (verified vs POSIX spec)
GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}
KIT_ROOT="$GRUGOPS_HOME/agent-factory"
```
```js
// install.mjs — Node stdlib. Empty string must also fall back.
// Source: .planning/research/STACK.md §Installation (verified vs Node v24 API docs)
import { homedir } from "node:os";
import { resolve } from "node:path";
const GRUGOPS_HOME =
  process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops");
const KIT_ROOT = resolve(GRUGOPS_HOME, "agent-factory");
```
**Parity invariant:** on the same machine, same `GRUGOPS_HOME` (set / unset / empty), both print the same absolute `KIT_ROOT`. [CITED: STACK.md, HIGH]

### Pattern 2: Adapter materialization — replace a known placeholder, idempotent by content
**What:** Inject the resolved absolute `KIT=` line into the 2 resolver adapters. The current adapter source has a slot:
```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
```
[VERIFIED: codebase — present in `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, and `agent-factory/packaging/subagent.frontmatter.md`]

**Recommended mechanism (Claude's Discretion — net-new):** Insert one stamped line *immediately above* the `# 1. (installed)…` comment, wrapped in a unique sentinel so re-materialization is idempotent and updatable:
```sh
# <!-- grugops:materialized-kit -->
KIT="/Users/<resolved>/.grugops/agent-factory"
# <!-- /grugops:materialized-kit -->
```
- **Re-run idempotency:** before injecting, strip any existing `grugops:materialized-kit` block, then inject the freshly-resolved line. If the resolved path is unchanged → byte-identical result → zero diff. If `$GRUGOPS_HOME` changed → the block is replaced with the new path (correct update). This is the sentinel-block pattern already proven by `ensure_block`, adapted to *replace* rather than *append*.
- **Why not reuse `link_or_copy`'s `cmp -s` idempotency:** once an adapter carries an injected line it is NOT byte-identical to the kit source, so the existing "identical copy present → skip" check (`install.sh:119`) would either skip incorrectly or re-copy and lose the injection. Materialized adapters need their OWN copy-then-inject path, separate from the `link_or_copy` used for the 6 delegating skills. [VERIFIED: codebase — `install.sh:114-122`]
- **Scope:** materialize ONLY the 2 standalone adapters that carry the resolver block. The 6 dash skills (`grugops-map/plan/ticket/gate/uat/release`) carry the invariant blockquote + delegate to the Orchestrator and must continue to be laid down by the plain `link_or_copy` path. [VERIFIED: codebase grep — only `grugops-orchestrator.md` + `grugops/SKILL.md` carry `KIT="${GRUGOPS_HOME` and the "wrote above this line" slot]

### Pattern 3: Seed-from-`$GRUGOPS_HOME`, skip-if-exists
**What:** Copy the kit-bundled seed subtree into the target; never overwrite an existing target file.
**When to use:** After kit copy (so the seed source exists at `$GRUGOPS_HOME`).
**Recommended seed sub-location (Claude's Discretion — net-new):** bundle seeds under a dedicated kit subtree, e.g. `agent-factory/seed/` containing `seed/.grugops/factory.config.json`, `seed/plans/**`, `seed/memory-bank/**`. Rationale: a single, gate-excludable glob (`agent-factory/seed/*`), self-contained travel with the kit copy, and clear separation from the live kit dirs. The default config seed maps from the existing `agent-factory/config/factory.config.json` (the recognized precedent, D-02).
**Skip-if-exists rule (D-04):** for each seed file, if the target file already exists → `report skipped`; else copy. Reuse the `[ -f "$dest" ]` guard pattern already used for AGENTS.md (`install.sh:258`). `plans/handoffs/` must be explicitly `mkdirp`'d — it does NOT exist in the repo's own `plans/` skeleton (it is a runtime dir). [VERIFIED: codebase — `plans/handoffs/` absent; `plans/` uses `.gitkeep` placeholders in `epics/features/tickets/sprints/releases`]

### Pattern 4: `--target` + interactive confirm + `--yes`/non-TTY bypass
**What:** Replace the obscure `TARGET=` env var as primary UX; confirm rather than silently default to CWD.
**Recommended shape (Claude's Discretion — net-new):**
```sh
# precedence: --target flag > TARGET env > prompt(default: CWD)
# if not a TTY OR --yes given → take the default without prompting (CI-safe)
if [ "$YES" = "1" ] || [ ! -t 0 ]; then
  TARGET="${TARGET:-$(pwd)}"     # non-interactive: default, no prompt
else
  printf 'Install grugops into which repo? [%s] ' "${TARGET:-$(pwd)}"
  read -r _ans || _ans=""
  TARGET="${_ans:-${TARGET:-$(pwd)}}"
fi
```
**Critical interaction with D-07:** non-TTY/`--yes` must STILL hit the self-checkout guard — otherwise CI silently installs into the clone (the hole D-07 closes). Resolve `TARGET` to an absolute path, then compare against the resolved `GRUGOPS_SRC` before any write.

### Pattern 5: Self-checkout guard (D-07)
**Recommended predicate (Claude's Discretion — net-new):** refuse when EITHER
1. resolved `TARGET` == resolved `GRUGOPS_SRC` (the canonical case), OR
2. the target carries grugops *source* markers: `install/install.sh` AND `agent-factory/VERSION` both present at `$TARGET` (catches a copied/renamed clone).
Override: `--allow-self` (or `--force`). Message: `refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.` Mirror the message byte-for-byte in Node. This is "safety is mechanical, not prose" applied to the installer. [CITED: CONTEXT.md D-07; PITFALLS.md §Security — never glob/hunt]

### Pattern 6: Install marker shape (Claude's Discretion — net-new)
**Recommended:** a small JSON file at `.grugops/install.json` (sits alongside the seeded `.grugops/factory.config.json`), written byte-identically by sh and Node. Minimal, parse-stable, forward-compatible for the Phase 9 doctor:
```json
{
  "kitVersion": "0.1.0",
  "grugopsHome": "/Users/<resolved>/.grugops",
  "kitRoot": "/Users/<resolved>/.grugops/agent-factory",
  "installMode": "copy",
  "installedAt": "2026-06-07T00:00:00Z"
}
```
- `kitVersion` ← read from `$GRUGOPS_HOME/agent-factory/VERSION` (or the source `VERSION`) at install.
- `kitRoot` is the exact absolute path materialized into the adapters — lets the doctor cross-check adapter ↔ marker.
- **Byte-parity:** use the same key order and `JSON.stringify(obj, null, 2) + "\n"` shape the Gemini merge already uses (`install.mjs:158`); the sh side writes the identical literal via `printf` (the established `merge_gemini` parity pattern, `install.sh:203-210`). [VERIFIED: codebase — Gemini merge already proves sh/Node byte-identical JSON]
- **Idempotency caveat:** `installedAt` is a timestamp → re-running install would change one byte, breaking the "zero diff" contract for the marker. **Recommendation:** either (a) skip the marker write if `.grugops/install.json` already records the same `kitVersion` + `grugopsHome` (skip-if-equivalent, not skip-if-exists, since the kit may have updated), or (b) omit `installedAt` from the marker entirely and keep only stable fields. Option (b) is simpler and fully idempotent — prefer it unless the doctor needs install time. The planner must pick one and apply it identically in sh + Node.

### Anti-Patterns to Avoid
- **Bare `$GRUGOPS_HOME` in any materialized path the agent reads as prose** — dead string; only the adapter's *bash* self-heal line may name it (already frozen by Phase 7) [CITED: SUMMARY.md, STATE.md Blockers].
- **Reusing `link_or_copy`'s `cmp -s` idempotency for materialized adapters** — breaks once the injected line exists (Pattern 2).
- **Defaulting home resolution to "look in `.`"** — masks unset-var failure; never fall back to CWD, fall back to `$HOME/.grugops` and fail loud if even that is absent [CITED: PITFALLS.md §Technical Debt].
- **Symlinking the kit as default** — the dogfood pain; copy is the design (D-05).
- **Touching `install.test.sh`** — its split rewrite is Phase 9; Phase 8 must leave its 7 checks green without editing it.
- **Deleting/overwriting `$GRUGOPS_HOME` non-atomically** — a concurrent reader sees a partial kit; use tmp→rename.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent injected-block edit | A bespoke line-counter / awk re-write per re-run | The sentinel-block replace pattern (adapt `ensure_block`/`remove_sentinel_block`) | The awk sentinel strip already exists in `uninstall.sh:119-126` and is battle-tested for "remove exactly this block" [VERIFIED: codebase] |
| Safe JSON write (marker, config) | Hand-rolled sh JSON string-building for complex objects | `JSON.stringify(obj,null,2)+"\n"` in Node; the sh side writes the identical literal via `printf` for the FIXED shape; delegate any *merge* to Node | Pure sh cannot safely merge arbitrary JSON — the existing `merge_gemini` Node-delegation pattern handles this and guarantees byte-parity [VERIFIED: `install.sh:150-212`] |
| Home resolution | `eval`-ing `~` or string-substituting `$HOME` | `${GRUGOPS_HOME:-"$HOME/.grugops"}` (sh) / `os.homedir()` (Node) | A baked-in unexpanded `~` is the nvm #2074 failure mode [CITED: STACK.md item 3] |
| Non-TTY / CI detection | Parsing env vars like `$CI` | `[ -t 0 ]` (sh) / `process.stdin.isTTY` (Node) + explicit `--yes` | Portable, no per-CI special-casing [ASSUMED — standard idiom] |
| Recursive copy | A manual find-loop in sh | `cp -R` (sh) / `fs.cpSync(...,{recursive:true})` (Node) for the grugops-owned kit | Bulk copy is fine for grugops-owned read-only content; per-file guards are only needed where user-clobber is possible (adapters, seed) |

**Key insight:** Almost every primitive this phase needs already exists in `install.sh`/`install.mjs`/`uninstall.sh` (sentinel blocks, Node-delegated JSON, `do_run` dry-run, `cmp` idempotency, protected-path guard). The net-new code is small: home-resolve, kit-copy (atomic), adapter materialize (copy-then-inject, content-idempotent), state-seed (skip-if-exists), arg-parse + guard. Compose existing helpers; do not introduce new abstractions.

## Runtime State Inventory

This phase is mostly **additive code + a kit-copy + a state-seed** rather than a rename, but it DOES introduce a new persistent runtime location (`$GRUGOPS_HOME`) and seeds state, so the inventory matters:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The kit itself becomes a persistent copy at `$GRUGOPS_HOME/agent-factory/` (new runtime location, not in any repo) | New: installer creates it; uninstall must NOT remove it (D-06); doctor (Phase 9) reads `VERSION` + marker there |
| Live service config | None — grugops has no external services. The per-repo `.grugops/factory.config.json` is seeded from the kit default, then user-owned | Seed once, skip-if-exists (D-04) |
| OS-registered state | None — no OS task/daemon/service registration. Verified: grugops is file-only [VERIFIED: CLAUDE.md "not a platform, runtime, database, queue, or hosted service"] | None |
| Secrets/env vars | `$GRUGOPS_HOME` (read at install + by the adapter self-heal). The prod-deploy approval env var must NEVER be set/read/seeded by the installer | None set; carry the existing prohibition verbatim into new code paths [CITED: PITFALLS.md §Security] |
| Build artifacts | `agent-factory/VERSION` (`0.1.0`) is copied into `$GRUGOPS_HOME` and stamped into the install marker; the install marker `.grugops/install.json` is a new artifact | Stamp on install; marker idempotency caveat (Pattern 6) |

**Adapter materialization is the closest thing to a "rewrite":** the installer writes a machine-specific absolute path into 2 adapter files in the *target*. After install, the source adapters in the grugops checkout must stay clean — which is exactly why the D-07 self-checkout guard exists (installing into the clone would dirty the source adapters with a machine path). [CITED: CONTEXT.md D-07]

## Common Pitfalls

### Pitfall 1: Materialized-adapter idempotency break (NET-NEW for this phase)
**What goes wrong:** Re-running install produces a non-zero diff on the 2 materialized adapters (either the injected line is duplicated, or `link_or_copy`'s `cmp` mis-skips, or the path silently fails to update when `$GRUGOPS_HOME` changes).
**Why it happens:** The existing idempotency check (`cmp -s src dest`) assumes the dest is a byte-identical copy of the kit source — false once a line is injected.
**How to avoid:** Give materialized adapters their own copy-then-inject path (Pattern 2): strip any existing `grugops:materialized-kit` sentinel block, then inject the freshly-resolved path. Same path → zero diff; changed path → correct update.
**Warning signs:** `install.test.sh` Check 1 (double-install zero diff) would fail IF it covered materialized adapters — but it currently runs against a fixture without `$GRUGOPS_HOME` kit copy. The planner must add a *separate* assertion (without editing `install.test.sh`) or rely on a Phase-8-local check.

### Pitfall 2: sh/Node byte-parity break on the injected absolute path
**What goes wrong:** `install.sh` materializes `/home/u/.grugops/...` while `install.mjs` materializes `C:\Users\u\.grugops\...` (or a trailing-slash / normalization difference), breaking the parity contract.
**Why it happens:** `$HOME` (sh) and `os.homedir()` (Node) can differ in normalization; `path.resolve` may emit backslashes on Windows.
**How to avoid:** Normalize both to forward-slash POSIX form for the materialized string (the adapter's bash reads it as a sh path); assert the parity in a Phase-8 check on POSIX (`install.test.sh` Check 4/4b proves tree parity but does NOT yet cover `$GRUGOPS_HOME` materialization — note for the planner that full Windows parity is `UNKNOWN - verify` without a Windows runner). [CITED: PITFALLS.md §Performance — two installers drift]
**Warning signs:** different `kitRoot` in the install marker between sh and Node runs on the same box.

### Pitfall 3: Self-checkout guard bypassed in non-TTY/CI
**What goes wrong:** `--yes` or a non-TTY shell skips the prompt AND the guard, silently installing into the clone and dirtying source adapters.
**Why it happens:** Treating the guard as part of the *prompt* path instead of an always-on check.
**How to avoid:** Run the D-07 guard unconditionally after `TARGET` resolution, before any write — independent of TTY/`--yes` (Pattern 5).
**Warning signs:** `git status` in the grugops checkout shows modified `.claude/agents/grugops-orchestrator.md` after a CI install run.

### Pitfall 4: `plans/handoffs/` not seeded
**What goes wrong:** The orchestrator/role-switch protocol writes `plans/handoffs/<ID>-<stage>.md` but the dir doesn't exist → write fails or the agent hunts.
**Why it happens:** `plans/handoffs/` is a runtime dir, absent from the repo's `plans/` skeleton (`.gitkeep` covers the other subdirs, not handoffs).
**How to avoid:** Explicitly `mkdirp "$TARGET/plans/handoffs"` in the seed step (D-01 lists it explicitly). [VERIFIED: codebase — `plans/handoffs/` absent from repo]

### Pitfall 5: Seed subtree fails the kit-ref gate
**What goes wrong:** `scripts/check-kit-refs.sh` scans the bundled seed (`agent-factory/seed/plans/board.md` etc.) and FAILs on legitimate `.grugops/…` / `plans/…` refs that are meant to resolve in the *target*.
**Why it happens:** The gate's SCAN set currently lists `agent-factory/…` dirs broadly enough that a new `agent-factory/seed/` subtree could be caught (or the planner adds it without excluding).
**How to avoid:** D-03 — ensure the seed sub-location is NOT in the gate's explicit `SCAN`/`GH_SCAN` lists (the gate already uses an explicit allowlist, never repo-wide grep, so the fix is "don't add seed paths to SCAN" + document why). [VERIFIED: codebase — `check-kit-refs.sh:45` SCAN is explicit; seeds simply must not be listed]

### Pitfall 6: Uninstall removes seeded state or the shared kit
**What goes wrong:** Two-root uninstall over-reaches and deletes `.grugops/` (now holding user config) or `$GRUGOPS_HOME` (shared across repos).
**Why it happens:** Naively adding `.grugops/` to the removal list.
**How to avoid:** D-06 — remove only the `.grugops/install.json` marker (grugops-owned), never `.grugops/factory.config.json` (user state once seeded) and never `$GRUGOPS_HOME`. Extend `is_protected()` to cover the seeded state dirs. The existing `install.test.sh` Check 3 (frozen `agent-factory/` survives) + plans/ survival already guard the spirit; the planner must add `.grugops/factory.config.json` survival without breaking Check 3.

## Code Examples

### Atomic kit copy (sh — recommended shape)
```sh
# Source: pattern synthesized from PITFALLS.md §Performance (atomic update) + existing do_run/mkdirp
copy_kit() {
  _tmp="$GRUGOPS_HOME/.agent-factory.tmp.$$"
  mkdirp "$GRUGOPS_HOME"
  if [ "$DRY_RUN" = "1" ]; then report would-copy "kit → $KIT_ROOT"; return 0; fi
  rm -rf -- "$_tmp"
  cp -R -- "$GRUGOPS_SRC/agent-factory" "$_tmp"
  rm -rf -- "$KIT_ROOT"            # grugops-owned, read-only; overwrite is not user content (D-05)
  mv -- "$_tmp" "$KIT_ROOT"        # atomic rename into place
  report copied "kit → $KIT_ROOT"
}
```

### Sentinel-block strip-then-inject (the materialization primitive)
```sh
# Source: adapted from uninstall.sh:119-126 (awk sentinel strip) + ensure_block append discipline
# Strips any prior grugops:materialized-kit block, then injects the resolved KIT line above
# the "# 1. (installed)..." slot. Idempotent: same path → byte-identical → zero diff.
```
(The planner derives the exact awk/insert; the strip half already exists verbatim in `uninstall.sh`.)

### Skip-if-exists seed copy (sh)
```sh
# Source: guard pattern from install.sh:258 (AGENTS.md skip-if-present)
seed_file() {  # $1=src(under $KIT_ROOT/seed) $2=dest(under $TARGET) $3=label
  if [ -f "$2" ]; then report skipped "$3 (target already has it — D-04)"; return 0; fi
  if [ "$DRY_RUN" = "1" ]; then report would-add "$3"; return 0; fi
  mkdirp "$(dirname -- "$2")"; cp -- "$1" "$2"; report created "$3"
}
```

## State of the Art

| Old (current installer) | New (Phase 8) | Why |
|-------------------------|---------------|-----|
| `TARGET=$(pwd)` default (`install.sh:36`) | `--target` flag + confirm prompt + `--yes`/non-TTY bypass | Dogfood pain #1 (wrong target) |
| `INSTALL_MODE=symlink` default (`install.sh:40`) | `INSTALL_MODE=copy` default (symlink opt-in) | Dogfood pain #2 (symlink fragility); Windows parity |
| Installer never touches `agent-factory/` (`install.sh:12`) | Installer copies kit to `$GRUGOPS_HOME`, materializes absolute path into adapters | Dogfood pain #3 (kit never arrives) |
| Adapters reference `agent-factory/…` repo-relative (dangling in target) | Adapters carry materialized absolute kit path + bash self-heal | Phase 7 froze the spelling; Phase 8 binds the path |
| No per-repo state seed | Full state-plane seed (`.grugops/`, `plans/**`, `memory-bank/**`) skip-if-exists | `/grugops` works on first run (D-01) |
| `agent-factory/config/…` in packaging templates / README prose | `.grugops/factory.config.json` | D-09 (IN-01); templates grant `Agent` → dropped (D-08) |

**Deprecated/outdated:**
- The packaging templates' `Agent` tool grant — grugops uses single-window sequential role-load, NOT spawning; the grant is a regeneration hazard (D-08, WR-05). Note: the *live* `.claude/agents/grugops-orchestrator.md` already correctly omits `Agent` (`tools: Read, Grep, Glob, Bash, Edit, Write`) — only the *templates* still grant it. [VERIFIED: codebase grep]
- ARCHITECTURE.md's repo-root `factory.config.json` recommendation — superseded by SHOME-02 (`.grugops/`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `[ -t 0 ]` (sh) / `process.stdin.isTTY` (Node) are the right non-TTY detection idioms | Supporting Stack, Pattern 4 | Low — universally standard; if wrong, CI bypass needs an alternate signal (e.g. explicit `--yes` only) |
| A2 | Recommended seed sub-location `agent-factory/seed/` (exact path is planner discretion) | Pattern 3 | Low — any single gate-excludable subtree works; this is a recommendation, not a lock |
| A3 | Install marker at `.grugops/install.json` with the proposed JSON shape | Pattern 6 | Low — shape is forward-compatible; Phase 9 doctor consumes it, so coordinate field names then |
| A4 | Omitting `installedAt` (or skip-if-equivalent) is the simplest way to keep the marker idempotent | Pattern 6 | Medium — if the doctor needs install time, use skip-if-equivalent instead; planner must pick one and mirror in sh+Node |
| A5 | Self-checkout predicate = `TARGET==GRUGOPS_SRC` OR (`install/install.sh` + `agent-factory/VERSION` both present at target) | Pattern 5 | Low — covers the canonical + copied-clone cases; planner may tighten |
| A6 | Full Windows sh/Node path parity for the materialized line is untested without a Windows runner | Pitfall 2 | Medium — mark `UNKNOWN - verify`; normalize to POSIX forward-slash form to minimize risk |

**Note:** Per the package-name provenance rule, all of the above are design recommendations for Claude's-Discretion items, not verified facts. The planner / discuss-phase should confirm A3/A4 (marker shape) and A2 (seed location) since the Phase 9 doctor depends on them.

## Open Questions (RESOLVED)

1. **Marker `installedAt` vs strict idempotency** — **RESOLVED (Option b — omit `installedAt`).**
   - What we know: a timestamp breaks "zero diff on re-run"; the doctor (Phase 9) will read the marker.
   - Resolution: the install marker OMITS `installedAt` entirely and carries only the four stable fields `kitVersion`, `grugopsHome`, `kitRoot`, `installMode` (Pattern 6, Option b). This is fully idempotent — re-install overwrites the marker with byte-identical content when `$GRUGOPS_HOME` is unchanged, and updates correctly when it changes. No skip-if-equivalent branch is needed. Applied IDENTICALLY in sh (`printf` literal) and Node (`JSON.stringify(obj,null,2)+"\n"`), same key order. The Phase 9 doctor does not require install time; if a later phase needs it, it adds a separate field then. (Decided in plan 08-03 Task 2.)

2. **`is_protected()` extension for seeded `.grugops/` state** — **RESOLVED (in plan 08-04 Task 1).**
   - What we know: D-06 says uninstall removes only the marker, never seeded config or the shared kit.
   - Resolution: `is_protected()` protects `.grugops/` broadly so seeded `.grugops/factory.config.json` (user state once seeded) can never be removed; the `.grugops/install.json` marker (grugops-owned) is removed via a narrow, explicitly-named exception (the same shape as the AGENTS.md "grugops-owned only" check), NOT via the generic `remove_file`/`is_protected` path. A `.grugops/factory.config.json` survival assertion lives in the separate `install.two-root.test.sh` harness, never in the frozen `install.test.sh`. (Specified in plan 08-04 Task 1.)

3. **Windows byte-parity of the materialized path** — **`UNKNOWN - verify` (legitimate; no Windows runner).** Without a Windows runner this cannot be verified this session (A6). Mitigation: normalize the materialized path to POSIX forward-slash form so sh and Node emit byte-identical lines on POSIX; flag full Windows parity for a Windows dogfood pass. This remains an honest unknown, not a blocking unresolved question.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| POSIX `sh` | `install.sh` | ✓ | system | — |
| `node` | `install.mjs`, sh JSON-merge delegation | ✓ | (system Node; stdlib-only) | sh defers JSON merge with a `verify` message when Node absent (existing pattern) |
| `cp`, `mv`, `rm`, `mkdir`, `awk`, `grep`, `cmp` | both installers | ✓ | POSIX | — |
| `agent-factory/VERSION` | install marker stamp | ✓ | `0.1.0` | — |
| Windows runner (for parity verification) | Pitfall 2 / A6 verification | ✗ | — | Normalize to POSIX form; flag Windows dogfood as `UNKNOWN - verify` |

**Missing dependencies with no fallback:** none that block the phase (Windows parity is verification-only, not execution-blocking).
**Missing dependencies with fallback:** Node absence → sh defers JSON merge (existing, tested).

## Validation Architecture

> nyquist_validation is `true` in `.planning/config.json` — this section is REQUIRED. [VERIFIED: codebase — `.planning/config.json` `"nyquist_validation": true`]

### Test Framework
| Property | Value |
|----------|-------|
| Framework | POSIX shell harness (no external test framework) — `install/install.test.sh`, `pass()`/`fail()`, content-addressed `snapshot()` diff |
| Config file | none — the harness is self-contained |
| Quick run command | `sh install/install.test.sh` (the existing 7-check harness — Phase 8 must keep it green) |
| Full suite command | `sh install/install.test.sh && sh scripts/check-kit-refs.sh` |

**Hard constraint:** `install/install.test.sh`'s split-aware rewrite is a **Phase 9** deliverable (VAL-02). Phase 8 must (a) NOT edit `install.test.sh`, and (b) leave all 7 of its current checks green. The existing harness runs against a fixture WITHOUT a `$GRUGOPS_HOME` kit copy — so Phase 8's new behavior must be backward-compatible with that fixture shape (e.g. when no kit-copy target is forced, the existing adapter-laydown checks still pass). New Phase-8 assertions belong in a **separate, Phase-8-local harness** (e.g. `install/install.two-root.test.sh`) or as inline checks the planner gates on — NOT folded into `install.test.sh`.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command (hermetic: `GRUGOPS_SRC`/`GRUGOPS_HOME`/`TARGET`/`INSTALL_MODE=copy`/`DRY_RUN`) | File Exists? |
|--------|----------|-----------|-------------------------------------------------|-------------|
| INSTALL-04 | Kit copied to `$GRUGOPS_HOME/agent-factory/` | integration | `GRUGOPS_HOME=$tmp/home GRUGOPS_SRC=$REPO TARGET=$tmp/app sh install/install.sh --yes` then assert `[ -f $tmp/home/agent-factory/roles/orchestrator.md ]` | ❌ Wave 0 |
| INSTALL-04 | Adapters materialized with the resolved absolute kit path | integration | grep the materialized `KIT=` line in `$tmp/app/.claude/agents/grugops-orchestrator.md` equals `$tmp/home/agent-factory` | ❌ Wave 0 |
| INSTALL-04 | State seeded (`.grugops/factory.config.json`, marker, `plans/**` incl. `handoffs/`, `memory-bank/**`) | integration | assert each seeded path exists in `$tmp/app` after install | ❌ Wave 0 |
| INSTALL-04 | Never-clobber: pre-existing seeded file untouched | integration | pre-write `$tmp/app/.grugops/factory.config.json` with a sentinel, install, assert sentinel survives | ❌ Wave 0 |
| INSTALL-04 | Idempotent: double-install (incl. materialized adapters + kit copy + marker) → zero diff | integration | `snapshot` `$tmp/app` + `$tmp/home`, install twice, diff both = empty | ❌ Wave 0 |
| INSTALL-04 | `DRY_RUN=1` mutates neither root | integration | `snapshot` both roots pre/post `DRY_RUN=1 … install.sh`, diff empty | ❌ Wave 0 (extend snapshot to cover `$GRUGOPS_HOME`) |
| INSTALL-04 | Default mode is copy (no symlinks created) | integration | after install, `find $tmp/app $tmp/home -type l` is empty | ❌ Wave 0 |
| INSTALL-04 | sh/Node byte-parity (same kit root + same seeded target tree + same marker) | integration | install sh→$A, node→$B with identical env; `snapshot` + diff both roots = empty | partially — extend `install.test.sh` Check 4 pattern into the new harness |
| INSTALL-03 | `--target ../app` from arbitrary CWD lands in the right place | integration | `cd /tmp && sh $REPO/install/install.sh --target $tmp/app --yes`; assert adapters in `$tmp/app` | ❌ Wave 0 |
| INSTALL-03 | `--yes`/non-TTY installs unattended (no prompt block) | integration | run with stdin from `/dev/null` + `--yes`; assert exit 0, no hang | ❌ Wave 0 |
| INSTALL-03 | Self-checkout guard refuses by default; `--allow-self` overrides | integration | `TARGET=$REPO sh install/install.sh --yes` exits nonzero with the refuse message; `--allow-self` proceeds (against a throwaway clone, never the real repo) | ❌ Wave 0 |
| D-06 | Two-root uninstall removes marker + adapters, NOT kit or seeded config | integration | install, uninstall, assert `$tmp/home/agent-factory` survives, `.grugops/factory.config.json` survives, `.grugops/install.json` gone | ❌ Wave 0 |
| D-03 | Seed subtree excluded from `check-kit-refs.sh` | smoke | `sh scripts/check-kit-refs.sh` exits 0 after seeds are bundled | ✅ (gate exists; assert still green) |
| D-08 | Packaging templates no longer grant `Agent` | smoke | `! grep -q 'Agent' agent-factory/packaging/subagent.frontmatter.md agent-factory/packaging/slash-command.template.md` | ✅ (grep) |
| D-09 | No stale `agent-factory/config/` config-path prose in the two docs | smoke | `! grep -q 'agent-factory/config/factory' agent-factory/README.md agent-factory/config/factory.config.md` (allow the legit file-location mention) | ✅ (grep) |
| regression | Existing 7-check harness stays green | integration | `sh install/install.test.sh` exits 0 | ✅ exists |

### Sampling Rate
- **Per task commit:** `sh install/install.test.sh` (must stay green) + the relevant new Phase-8 assertion.
- **Per wave merge:** `sh install/install.test.sh && sh scripts/check-kit-refs.sh && sh install/install.two-root.test.sh` (new harness).
- **Phase gate:** full suite green + manual `git status` clean in the grugops checkout (proves the self-checkout guard kept source adapters un-materialized).

### Wave 0 Gaps
- [ ] `install/install.two-root.test.sh` — new Phase-8-local harness covering kit-copy + materialization + seeding + never-clobber + idempotency (two roots) + copy-default + self-checkout guard + `--target`/`--yes` + two-root uninstall + sh/Node parity. Must use hermetic `GRUGOPS_HOME`/`GRUGOPS_SRC`/`TARGET`/`INSTALL_MODE=copy` overrides and clean up via `trap … EXIT` (mirror `install.test.sh` `mktemp -d` discipline).
- [ ] Extend the snapshot helper to cover BOTH roots (`$TARGET` and `$GRUGOPS_HOME`) — the existing `snapshot()` only covers one dir.
- [ ] Self-checkout-guard fixture: a throwaway *clone-shaped* dir (carries `install/install.sh` + `agent-factory/VERSION`) so the guard can be exercised without ever pointing at the real repo.
- [ ] No framework install needed (POSIX sh).

*Phase 8 must NOT modify `install/install.test.sh` (Phase 9 owns its rewrite). Net-new tests live in the separate harness above.*

## Security Domain

> `security_enforcement` not explicitly `false` → enabled. This installer's security surface is narrow (local filesystem, no network, no external packages).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | No sessions |
| V4 Access Control | yes | Install kit `0755` dirs / `0644` files owned by the installing user; per-user `~/.grugops` default avoids shared-write surface [CITED: PITFALLS.md §Security] |
| V5 Input Validation | yes | Validate/resolve `--target` and `$GRUGOPS_HOME` to absolute paths before use; never glob/hunt for `agent-factory/` outside the resolved root |
| V6 Cryptography | no | No crypto; no secrets handled (the prod-deploy approval env var is NEVER touched) |
| V12 File & Resources | yes | Atomic tmp→rename kit write; never follow symlinks out of the kit/repo; never overwrite/delete user content (the core install contract) |

### Known Threat Patterns for sh+Node installer
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| World-writable `$GRUGOPS_HOME` → instruction injection into every agent run | Tampering | Per-user `~/.grugops` default; `0755`/`0644` perms owned by the installer [CITED: PITFALLS.md §Security] |
| Agent hunts for a missing kit and reads attacker-planted `agent-factory/` higher in the tree | Spoofing/EoP | The frozen C1 rule: STOP if the resolved kit dir is absent, do not hunt — Phase 8 must keep the materialized-path + self-heal + STOP intact, never add a "search" fallback |
| Installer sets/seeds the prod-deploy approval env var while "setting up" | EoP | Carry the explicit prohibition verbatim into every new code path; never read/write/seed it [VERIFIED: codebase — `install.sh:14,279`, `install.mjs:13`] |
| Self-install into the source clone dirties source adapters with a machine path | Tampering | D-07 self-checkout guard (mechanical, always-on) |
| Non-atomic kit overwrite during a concurrent read | DoS/Tampering | tmp→rename atomic install [CITED: PITFALLS.md §Performance] |

## Project Constraints (from CLAUDE.md)

- **Markdown-only except installers** — `install.sh` (POSIX sh) + `install.mjs` (Node ESM) + the optional validator are the only non-markdown. No new non-markdown files beyond these. [CLAUDE.md Constraints]
- **Safety is mechanical, not prose** — the self-checkout guard (D-07) and the never-touch-prod-deploy-env rule must be enforced in code, not just documented. [CLAUDE.md Safety (hard)]
- **Single-source role text** — adapters are thin pointers; never copy role bodies. Materialization injects ONLY a path line, never role content. [CLAUDE.md Single-source]
- **Zero-config first** — the seed makes `/grugops` work with sensible lean defaults (the seeded `factory.config.json` is the lean baseline); installer must run with no flags too. [CLAUDE.md Zero-config first]
- **Installers: idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content** — every Phase-8 addition (kit copy, materialize, seed, marker) preserves this contract end-to-end across BOTH roots. [CLAUDE.md Installers]
- **No fabrication** — unknown tool commands stay `UNKNOWN - verify` (the existing plugin-install notes already do this); never fake a passing test or gate. [CLAUDE.md No fabrication]
- **`install.sh` ⇄ `install.mjs` byte-parity** — mirror every behavioral change; same kit root, same seeded tree, same marker bytes; Windows home via `os.homedir()`. [CLAUDE.md / INSTALL-04]
- **Brand** — lowercase `grugops`; the materialized marker/paths use `.grugops`/`grugops` consistently. [CLAUDE.md Brand]

## Sources

### Primary (HIGH confidence)
- `docs/design/shared-install.md` (in-repo) — the 3 dogfood pains, kit-vs-state split, path-root convention, installer-changes, rejected alternatives. AUTHORITATIVE for this milestone.
- `.planning/phases/08-two-root-installer/08-CONTEXT.md` — locked decisions D-01..D-09, scope fences, Claude's Discretion.
- `.planning/phases/07-shared-home-foundation-path-rewrite/07-CONTEXT.md` — D-11/D-12 (adapter-only resolution), D-08 (gate logic + allowlist), frozen kit-vs-state convention.
- `.planning/research/{SUMMARY,STACK,PITFALLS}.md` (in-repo) — v1.1 shared-install research; resolution snippets (STACK §Installation), C1-C6 + integration/perf/security pitfalls.
- `install/install.sh`, `install/install.mjs`, `install/uninstall.sh`, `install/install.test.sh`, `scripts/check-kit-refs.sh` (in-repo, read this session) — existing helpers, idempotency mechanisms, protected-path guard, test harness shape.
- `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, the 6 dash skills, `agent-factory/packaging/{subagent.frontmatter.md,slash-command.template.md}` (in-repo grep) — confirmed exactly 2+1 files carry the resolver block; the 6 dash skills delegate.
- `.planning/REQUIREMENTS.md` §Milestone v1.1 — INSTALL-03/INSTALL-04 verbatim; phase mapping.
- `.planning/config.json` — `nyquist_validation: true`.
- `agent-factory/config/factory.config.json` + `agent-factory/VERSION` (`0.1.0`) — seed source + stamp source.
- `CLAUDE.md` (in-repo) — project constraints.

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 7 completion notes; the `.grugops/` config-location supersession; gating-pitfall blockers.
- STACK.md/PITFALLS.md `getent passwd` container fallback + `brew/flutter doctor` exit-code convention (Phase 9-relevant; noted not built here).

### Tertiary (LOW confidence)
- nvm #2074 tilde-not-expanded gotcha (illustrative; behavior independently established from POSIX `:-` semantics).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — stdlib-only; all snippets verified against STACK.md (POSIX spec + Node v24 API docs) and against the live installer code.
- Architecture: HIGH — extends an existing, tested installer; the 2-adapter materialization scope is verified by grep; the two-root flow is the locked design.
- Pitfalls: HIGH — C1-C6 are measured live bugs/structural gaps; the net-new materialized-adapter idempotency pitfall is derived directly from reading `link_or_copy`'s `cmp` check.
- Claude's-Discretion recommendations (marker shape, seed location, materialization mechanism): MEDIUM — these are well-grounded design proposals, flagged in the Assumptions Log for confirmation; Phase 9 doctor depends on the marker shape.

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable — in-repo synthesis; no fast-moving external deps). The only external-version caveat is Windows sh/Node path parity (`UNKNOWN - verify`).
