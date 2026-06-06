# Architecture Research

**Domain:** grugops v1.1 — kit/state split runtime path resolution for an LLM-read markdown agent factory
**Researched:** 2026-06-06
**Confidence:** HIGH (core resolution mechanism verified against current Claude Code plugin docs; standalone behavior verified against the existing repo)

> NOTE: This file was regenerated for the **v1.1 Install & Distribution** milestone. The prior contents documented the v1.0 (build-the-kit) architecture; that work shipped. The question now is the *runtime path-resolution* design for the kit/state split locked in `docs/design/shared-install.md`.

---

## TL;DR — the load-bearing fact

`$GRUGOPS_HOME` is **not** expanded inside markdown prose by any host coding agent. The "agent" is an LLM reading text — it has no CWD-aware loader and does not run a shell over the role file. So the resolution mechanism cannot rely on the agent expanding a shell variable in prose.

Two verified facts make the design tractable:

1. **Standalone form (`.claude/skills/*`, `.claude/agents/*`, plain `AGENTS.md`):** nothing is auto-expanded in the markdown body. The agent reads the literal string. → The kit's absolute path must be **materialized into the adapter at install time** (the installer writes the resolved path), OR the agent must be **instructed to discover it via a Bash call** before reading kit files.
2. **Plugin form:** Claude Code **does** substitute `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `${CLAUDE_PROJECT_DIR}` inline "anywhere they appear in skill content [and] agent content" (code.claude.com/docs/en/plugins-reference, Environment variables section, HIGH). So in plugin form a `${CLAUDE_PLUGIN_ROOT}/agent-factory/...` reference in SKILL.md **does** resolve to the absolute install path before the LLM ever sees it. **But** arbitrary `${ENV_VAR}` (e.g. `${GRUGOPS_HOME}`) is documented as substituted only in hook/monitor/MCP **command** strings — NOT in skill/agent content. So `$GRUGOPS_HOME` written into a SKILL body is a dead string in BOTH forms.

The single resolution rule is therefore: **the *adapter* resolves the kit root to an absolute path; the *kit prose* and *adapter* both address state strictly repo-relative.** The two kit homes (`$GRUGOPS_HOME`, `${CLAUDE_PLUGIN_ROOT}`) differ only in *who* does the resolving — the installer (standalone) or Claude Code's substitution engine (plugin).

---

## Standard Architecture

### System Overview — two roots, one resolution rule

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: host coding agent reads the ADAPTER (the only place a path     │
│         root is resolved to an absolute string)                        │
│                                                                        │
│   standalone .claude/skills/grugops/SKILL.md   (installer-materialized)│
│   standalone .claude/agents/grugops-orchestrator.md                    │
│   plugin     skills/<op>/SKILL.md              (${CLAUDE_PLUGIN_ROOT}) │
└───────────────┬───────────────────────────────────┬──────────────────┘
                │ KIT ROOT (absolute, read-only)     │ STATE ROOT (repo-relative)
                ▼                                     ▼
┌───────────────────────────────────┐   ┌──────────────────────────────────┐
│  KIT HOME  (one of two)            │   │  TARGET REPO  (cwd / project dir) │
│  ─ $GRUGOPS_HOME (~/.grugops)      │   │  plans/board.md                   │
│    standalone install              │   │  plans/traceability.md            │
│  ─ ${CLAUDE_PLUGIN_ROOT}           │   │  plans/tickets/ …                 │
│    plugin install (CC-substituted) │   │  plans/handoffs/   ← RUNTIME write│
│                                    │   │  memory-bank/*                    │
│  agent-factory/roles/              │   │  factory.config.json  (repo root) │
│  agent-factory/workflows/          │   └──────────────────────────────────┘
│  agent-factory/checklists/         │
│  agent-factory/packaging/          │   The agent NEVER expands a shell var
│  agent-factory/handoffs/ (TEMPLATES│   in prose. Kit paths arrive already
│     only — read, never write)      │   absolute (adapter/CC). State paths
│  agent-factory/config/             │   are plain repo-relative literals.
│     factory.config.json (DEFAULT)  │
│  VERSION                           │
└───────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Adapter (standalone)** | Hold the *only* absolute kit-root reference; point at repo-relative state | `.claude/skills/*/SKILL.md` + `.claude/agents/grugops-orchestrator.md`, kit root materialized at install time |
| **Adapter (plugin)** | Same job; kit root written `${CLAUDE_PLUGIN_ROOT}/agent-factory/...`, resolved by CC inline substitution | plugin `skills/<op>/SKILL.md`, plugin `agents/*.md` |
| **Kit prose (roles/workflows)** | Address state strictly repo-relative; reference *other kit files* under the kit root via the single disambiguation rule | the ~31 role/workflow files, rewritten |
| **`$GRUGOPS_HOME` / `${CLAUDE_PLUGIN_ROOT}`** | Name the kit home; never appear un-resolved in front of the LLM | env default `~/.grugops`; CC-managed plugin cache dir |
| **Repo state** | All runtime writes (handoffs, board, trace, memory-bank) + per-repo config | `plans/`, `memory-bank/`, repo `factory.config.json` |
| **Installer** | Resolve `$GRUGOPS_HOME`, copy kit there, materialize the absolute kit root into the standalone adapters, seed repo state, run the `--check` doctor | `install.sh` / `install.mjs` |
| **`--check` doctor** | Verify every adapter/role-referenced path resolves (kit at home, state in repo) | new installer mode |
| **Validator** | Two-root structure check (kit at KIT_ROOT, state in STATE_ROOT) | `scripts/validate-agent-factory.mjs` |

---

## The runtime path-resolution mechanism (the core question)

### Why the agent cannot resolve `$GRUGOPS_HOME` itself

The host agent reads markdown. When a role file says "read `$GRUGOPS_HOME/agent-factory/roles/ba-pm.md`", the LLM sees the literal `$GRUGOPS_HOME/...`. It is not a shell; it does not perform parameter expansion. It *might* helpfully guess `~/.grugops`, but "might guess" is exactly the dangling-path failure mode the dogfood (DOG-02) surfaced. The design must remove the guess.

### Decision: the ADAPTER injects the resolved absolute kit root (primary), with a one-line bash-discovery self-heal (secondary)

Two viable mechanisms; recommend a hybrid that defaults to injection.

**Mechanism A — adapter materializes the absolute path (RECOMMENDED, primary).**
At install, the installer resolves `$GRUGOPS_HOME` (env > default `~/.grugops`) to an absolute path and writes it *into* the standalone adapter text. The adapter the agent reads contains, literally:

```
Act as the grugops Orchestrator. The grugops kit lives at the KIT ROOT:
  /Users/<user>/.grugops/agent-factory/
Read /Users/<user>/.grugops/agent-factory/roles/orchestrator.md, then the project
config at ./factory.config.json (repo root) and ./plans/board.md.
```

- **Pro:** zero ambiguity — the LLM reads a real absolute path; no shell, no guess, no extra tool call. Mirrors what Claude Code already does for the plugin form (CC writes the absolute `${CLAUDE_PLUGIN_ROOT}` in). Parity between the two forms is structural, not accidental.
- **Pro:** the `--check` doctor can verify the exact string in the adapter resolves on disk.
- **Con:** the absolute path is now baked into a per-repo file. If the user moves `~/.grugops` or installs for another user, the adapter is stale → **re-running the installer re-materializes it** (idempotent rewrite of the grugops-owned adapter). The doctor catches a stale path loudly. Acceptable because the adapter is grugops-owned and installer-managed, not user-authored.

**Mechanism B — adapter instructs a bash discovery call (self-heal / tools without injection).**
The adapter layers a deterministic fallback under the injected path:

```
The grugops kit lives at: /Users/<user>/.grugops/agent-factory/
If that path does not exist, resolve the kit root by running:
  echo "${GRUGOPS_HOME:-$HOME/.grugops}"
and use the printed absolute path as KIT ROOT for every kit read below.
```

- **Pro:** survives a moved `~/.grugops` without re-install; honors a per-session `GRUGOPS_HOME` override.
- **Con:** depends on the agent actually making the bash call; spends a tool call; an agent that skips it dangles again. Less deterministic than injection — so it is the *fallback*, not the primary.

**Recommendation:** ship **A as primary** (installer materializes the absolute kit root into every standalone adapter), with **B's bash line as the documented self-heal fallback** inside the adapter. The kit *prose* (roles/workflows) never names `$GRUGOPS_HOME` at all (next section).

### The kit-internal cross-reference convention (the ~55 kit refs)

Roles and workflows reference *each other* (orchestrator → `_role-switch-protocol.md`; a workflow → a role file). These must NOT bake an absolute path (the kit is relocatable and shared) and must NOT use `$GRUGOPS_HOME` (dead string). The convention keeps the edit small:

- The **adapter** binds KIT ROOT to an absolute path once, then states the disambiguation rule.
- The **kit prose** keeps writing bare `agent-factory/roles/<role>.md`, but its *meaning* is now fixed by the rule: "`agent-factory/...` = under KIT ROOT (read-only)."

This is **the single disambiguation rule**, stated once in the adapter and once in `AGENTS.md`:

> **Path rule.** Anything under `agent-factory/` is **kit** — read it from the KIT ROOT (the absolute path named above), never write it. Anything under `plans/`, `memory-bank/`, or the repo-root `factory.config.json` is **state** — read and write it in THIS repository. `plans/handoffs/` is where roles WRITE their handoff packets at runtime; `agent-factory/handoffs/` holds the blank TEMPLATES only.

So the kit-to-kit refs (~55) keep their `agent-factory/...` prefix (now meaning "under KIT ROOT"); the only *semantic* rewrites are the 50 handoff refs (`agent-factory/handoffs/` → `plans/handoffs/` for **writes**; template **reads** stay `agent-factory/handoffs/`) and the 32 config refs (`agent-factory/config/factory.config.json` → repo `factory.config.json`).

### Handoff split (the 50 refs) — read template vs write instance

The role-switch protocol step 4 today says "write the role's handoff file under `agent-factory/handoffs/`." Under the split:

- **TEMPLATE read** (blank packet shape): `agent-factory/handoffs/<name>.md` → KIT ROOT, read-only.
- **INSTANCE write** (filled packet for this request): `plans/handoffs/<name>.md` → repo, writable.

`_role-switch-protocol.md` step 4 becomes: "read the template from `agent-factory/handoffs/<name>.md` (kit), fill it, and **write the instance under `plans/handoffs/`** (repo)." This is the single highest-value prose edit — it is where the read/write root split is most error-prone and where the dogfood would dangle. (Sequence note from the design: merge/rebase `grugops/quick-harden-role-switch-autocommit` first so the protocol text is edited once.)

---

## Per-repo config location decision

**Decision: repo-root `factory.config.json` (NOT `.grugops/factory.config.json`).** Confidence: MEDIUM-HIGH.

| Option | For | Against |
|--------|-----|---------|
| **Repo root `factory.config.json`** (RECOMMENDED) | Visible, greppable; matches how every role already references the dial conceptually; one fewer dir level across 32 refs; mirrors `package.json`/`tsconfig.json` ergonomics; a human reviewer sees the dial immediately | Adds a top-level file to the user's repo (but it is small, human-readable, and per-repo config is the whole point) |
| `.grugops/factory.config.json` | Groups state under one dot-dir; tidy root | Hidden by default; longer path in 32 refs; competes with `plans/` as "where grugops state lives" — two state roots is worse than one |

**Deterministic discovery rule for roles:** the project config is **always** at the repo root as `factory.config.json` (a single fixed repo-relative literal). **Fallback (zero-config-first constraint):** if absent in the repo, roles fall back to the **kit default** at `<KIT ROOT>/agent-factory/config/factory.config.json`, and if that too is unreadable, to documented lean defaults (`mode=lean`, `cadence=kanban`, `autonomy=pr`). The installer seeds the repo `factory.config.json` from the kit default at install, so the common path is "repo config present." Keep all *other* per-repo state under `plans/`/`memory-bank/` — do **not** introduce a `.grugops/` dir; two state roots multiplies the resolution surface the dogfood proved fragile.

---

## The single resolution rule across both kit homes

One rule, two bindings of `KIT ROOT`:

```
KIT ROOT (read-only kit) :=
    standalone  → the absolute path the installer materialized
                  (resolved from $GRUGOPS_HOME, default ~/.grugops),
                  optionally self-healed via `echo "${GRUGOPS_HOME:-$HOME/.grugops}"`
    plugin      → ${CLAUDE_PLUGIN_ROOT}   (Claude Code substitutes this inline in
                  skill/agent content before the LLM reads it — verified HIGH)

STATE ROOT (read/write state) :=
    always      → THIS repository (cwd / project dir). Plain repo-relative literals:
                  plans/…, memory-bank/…, factory.config.json. (Plugin form MAY write
                  ${CLAUDE_PROJECT_DIR} for an absolute repo anchor, but bare
                  repo-relative is enough — the agent's working dir is the repo.)

DISAMBIGUATION (stated in the adapter + AGENTS.md):
    agent-factory/…  ⇒ under KIT ROOT, read-only
    plans/… memory-bank/… factory.config.json ⇒ in THIS repo, read/write
    agent-factory/handoffs/…  ⇒ TEMPLATE (kit, read)
    plans/handoffs/…          ⇒ INSTANCE (repo, write)
```

**Why this is one rule, not two:** the 31 kit files are written once and shared verbatim by both distribution forms (honoring the single-source constraint). The kit prose always says "kit = `agent-factory/...` under KIT ROOT; state = repo-relative." Only the **adapter line that binds KIT ROOT** differs — installer-injected absolute path (standalone) vs `${CLAUDE_PLUGIN_ROOT}` (plugin). The plugin's inline self-expansion means the plugin adapter needs no installer materialization step, but it still obeys the same disambiguation rule.

**Plugin-cache caveat (the open D-31 item):** plugins are copied to a cache; files referenced via `../` outside the plugin dir are NOT copied (verified). Therefore the plugin form must **bundle `agent-factory/` inside the plugin directory** so `${CLAUDE_PLUGIN_ROOT}/agent-factory/...` resolves inside the cached copy. It must NOT point at a repo-relative `agent-factory/` (won't exist in the target) nor at `$GRUGOPS_HOME` (a plugin install has no step to populate it). This is the verification the dogfood must close.

---

## Migration (already-installed repo → split layout)

**Goal:** move a repo with in-repo `agent-factory/` + symlinked adapters to the split layout, idempotently, never deleting user state. Recommend a dedicated `install.sh --migrate` mode (mirrored in `install.mjs`), distinct from a fresh install.

**Algorithm (idempotent, additive, reversible, DRY_RUN-capable):**

1. **Detect prior layout.** In-repo `./agent-factory/` present AND it is the grugops kit (heuristic: `agent-factory/VERSION` + `agent-factory/roles/orchestrator.md`). If absent → no-op, exit clean.
2. **Ensure kit at `$GRUGOPS_HOME`.** Copy the kit from the installer's `GRUGOPS_SRC` to `$GRUGOPS_HOME` if not already current (idempotent — skip identical files). Use the shipped kit as source of truth, not the user's possibly-edited in-repo copy.
3. **Rescue filled handoff INSTANCES.** The old layout wrote runtime handoffs to `agent-factory/handoffs/`. Move any `agent-factory/handoffs/*.md` that **differs from the kit template** to `plans/handoffs/` — never overwrite an existing `plans/handoffs/` file (on collision, leave both and report `verify`). Blank templates matching the kit are ignored (they live in the shared kit now). `plans/`, `memory-bank/` are already repo-local — untouched.
4. **Seed repo config if missing.** If the user kept config at `agent-factory/config/factory.config.json`, copy it to repo-root `factory.config.json` only if the repo root has none (never overwrite). Report the move.
5. **Re-materialize adapters.** Remove the old symlinked adapters that point into the in-repo clone (grugops-owned paths only: `.claude/skills/grugops*`, `.claude/agents/grugops-orchestrator.md`); lay down the new copy-form adapters with the absolute KIT ROOT materialized. Update the `CLAUDE.md` sentinel block's pointer text (repo-relative → KIT ROOT form) — idempotent via the existing sentinel.
6. **Quarantine, do not delete, the old in-repo kit.** Do NOT `rm -rf ./agent-factory/`. Report: "the in-repo `agent-factory/` is now superseded by `$GRUGOPS_HOME`; safe to `git rm` once you confirm — grugops will not delete it for you." Optionally offer a separate, explicit, non-default `--prune-old-kit` that removes only unmodified kit files and refuses if any file differs.
7. **Run the `--check` doctor.** Verify the new layout resolves end to end; fail loudly listing any unresolved path.

**Idempotency:** re-running `--migrate` after success is a no-op (kit current, adapters materialized, handoffs moved, sentinel present). DRY_RUN=1 narrates every step and changes nothing. Honors the installer contract: additive, idempotent, reversible, never deletes user content.

---

## Validator / test impact

### `scripts/validate-agent-factory.mjs` (single-tree assumption to break)

Today `ROOT` is one tree and every check is `join(ROOT, <fixed rel>)` mixing kit and state literals (lines 30-35, 183-213). Split into **two roots**:

- **`KIT_ROOT`** (env `GRUGOPS_VALIDATE_KIT` > default `$GRUGOPS_HOME` > legacy `VALIDATE_ROOT` for back-compat): validates `agent-factory/{roles,workflows,checklists,packaging,handoffs,config}`, `VERSION`. The role/workflow section checks, role-switch-protocol reference, commit-convention, and per-workflow `## Commit` checks all move under `KIT_ROOT`.
- **`STATE_ROOT`** (env `VALIDATE_ROOT` > cwd): validates `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md`, repo `factory.config.json`, the board↔ticket↔trace checks, and the new **`plans/handoffs/`** existence.
- **Config check moves to STATE_ROOT** (`factory.config.json` at repo root), with the kit-default fallback as a separate KIT_ROOT check.
- **New cross-root check (the doctor's structural half):** every `agent-factory/...` path the adapters reference exists under KIT_ROOT; every `plans/...` path exists under STATE_ROOT.
- **Back-compat:** when only `VALIDATE_ROOT` is set (the v1.0 single-tree fixture self-test), default `KIT_ROOT := STATE_ROOT := VALIDATE_ROOT` so the existing GOOD/BAD fixtures still pass against a combined tree. Add new split-layout fixtures.

Keep the file's invariants: stdlib-only, read-only, never fabricates a pass, never creates `package.json`, two-tier ERROR/WARNING with `--strict`, every read wrapped in try/catch.

### `install/install.test.sh` (+ `validate.test.sh`)

- The fixture's "frozen core" file currently lives at `agent-factory/roles/orchestrator.md` in the *target* (proving uninstall never deletes it). Under the split, the kit is not in the target — update the fixture to place the frozen-core sentinel where the new installer touches, and add a **separate `$GRUGOPS_HOME` fixture** the installer copies the kit into.
- New tests: (a) fresh split install lays kit at `GRUGOPS_HOME` + materializes the absolute KIT ROOT into the adapter + seeds repo `factory.config.json` + `plans/handoffs/`; (b) `--check` doctor passes on a good split, fails loudly on a missing kit; (c) `--migrate` on an old-layout fixture moves filled handoffs to `plans/handoffs/`, seeds repo config, re-materializes adapters, never deletes the old in-repo `agent-factory/`; (d) double-`--migrate` is zero-diff; (e) `install.sh` vs `install.mjs` parity on the split tree (extend the existing parity check).
- `INSTALL_MODE`: **copy becomes the default** (drop the D-30 symlink default — the dogfood disliked symlinks); keep `INSTALL_MODE=symlink` as opt-in. Tests already force copy for deterministic diffs — keep that.

---

## Anti-Patterns

### Anti-Pattern 1: writing `$GRUGOPS_HOME` into role/skill prose and hoping the agent expands it
**What people do:** put `read $GRUGOPS_HOME/agent-factory/roles/x.md` in a SKILL body.
**Why it's wrong:** the LLM does not run a shell over prose; standalone expands nothing, and plugin form expands only `${CLAUDE_PLUGIN_ROOT|DATA}`/`${CLAUDE_PROJECT_DIR}` (not arbitrary env vars) in skill/agent content. Dead string in both forms → dangling read (the DOG-02 failure).
**Do this instead:** the installer materializes the absolute KIT ROOT into the standalone adapter; the plugin adapter uses `${CLAUDE_PLUGIN_ROOT}`. Kit prose never names the env var.

### Anti-Pattern 2: two per-repo state roots (`.grugops/` AND `plans/`)
**What people do:** put config under `.grugops/` while state stays under `plans/`.
**Why it's wrong:** doubles the resolution surface the dogfood proved fragile; a role must now know which dot-dir vs which plain dir.
**Do this instead:** repo-root `factory.config.json`; everything else under `plans/`/`memory-bank/`. One config file, one state-dir family.

### Anti-Pattern 3: plugin adapter pointing at `$GRUGOPS_HOME` or a repo-relative `agent-factory/`
**What people do:** reuse the standalone path form in the plugin.
**Why it's wrong:** the plugin is copied to a cache; `../`/repo-relative kit refs aren't copied and `$GRUGOPS_HOME` is never populated by a plugin install.
**Do this instead:** bundle `agent-factory/` inside the plugin dir and address it as `${CLAUDE_PLUGIN_ROOT}/agent-factory/...`.

### Anti-Pattern 4: migration that deletes the old in-repo `agent-factory/`
**What people do:** `rm -rf ./agent-factory` to "clean up."
**Why it's wrong:** violates "never delete user content"; the user may have edited the kit in place.
**Do this instead:** quarantine + report; offer deletion only behind an explicit non-default `--prune-old-kit` that refuses on any diff.

---

## Integration Points

### Files that bind a root (the only places resolution happens)

| Boundary | Binds | Notes |
|----------|-------|-------|
| `.claude/skills/*/SKILL.md` (standalone) | KIT ROOT (installer-materialized absolute) | grugops-owned; re-materialized on every install/migrate |
| `.claude/agents/grugops-orchestrator.md` (standalone) | KIT ROOT (absolute) | same |
| plugin `skills/<op>/SKILL.md`, plugin `agents/*.md` | KIT ROOT = `${CLAUDE_PLUGIN_ROOT}` | CC substitutes inline; bundle `agent-factory/` in the plugin dir |
| `AGENTS.md` (lines 9-23, 66, 113-120) | states the disambiguation rule; kit refs become KIT-ROOT-relative `agent-factory/...`, state refs stay repo-relative | minimal, high-signal — push detail to roles |
| `CLAUDE.md` sentinel pointer | KIT ROOT form of `agent-factory/roles/orchestrator.md` | updated by installer/migrate, idempotent via sentinel |

### What's NEW vs MODIFIED

**New:** `install --migrate` mode; `install --check` doctor; `plans/handoffs/` as the runtime write dir + its seeding; `$GRUGOPS_HOME` resolution + kit-copy step in the installer; two-root awareness + cross-root resolution check in the validator; split-layout fixtures; `--target`/prompt + copy-default.

**Modified:** all ~31 role/workflow files (handoff writes → `plans/handoffs/`; config refs → repo `factory.config.json`; kit-to-kit refs keep `agent-factory/` now meaning "under KIT ROOT"); `_role-switch-protocol.md` step 4 (template-read vs instance-write split); 7 standalone skill adapters + the agent wrapper (materialized KIT ROOT + disambiguation rule); `AGENTS.md` (disambiguation rule, config-at-repo-root); `install.sh`/`install.mjs` (kit-copy + materialize + seed + check + migrate); `uninstall.sh` (two-root aware); validator + tests.

### Suggested build order (respects the dependency chain)

1. **Land the split convention first.** Define + document the single disambiguation rule + KIT ROOT binding (in `AGENTS.md` and a short kit-internal note); confirm config location (repo root — done here). No code yet; this is the contract every later step targets. *Also: merge/rebase `grugops/quick-harden-role-switch-autocommit` first so the protocol text is edited once.*
2. **Rewrite the ~31 kit refs** against the convention: handoff writes → `plans/handoffs/`, template reads stay `agent-factory/handoffs/`; config → repo `factory.config.json`; `_role-switch-protocol.md` step 4 split. Pure prose edit; verifiable by grep + the (soon-updated) validator.
3. **Installer:** `$GRUGOPS_HOME` resolution + copy kit there + materialize absolute KIT ROOT into standalone adapters + seed repo `factory.config.json` + `plans/handoffs/` skeleton + copy-default + `--target`/prompt. `install.mjs` mirrors.
4. **`--check` doctor:** verify every adapter/role-referenced path resolves (kit at home, state in repo); fail loudly with the missing path.
5. **Two-root validator:** split `ROOT` into `KIT_ROOT`/`STATE_ROOT` with back-compat collapse; add the cross-root resolution check; update fixtures + `validate.test.sh`.
6. **Migration (`--migrate`):** built last because it reuses the adapter-materialization + repo-config seeding (steps 3-4) and the doctor (step 4) to self-verify.
7. **Tests last/continuous:** extend `install.test.sh` (split install, doctor pass/fail, migrate idempotency, parity) and re-prove the existing harnesses.

Rationale: convention → refs → installer → doctor → validator → migration. Each step's output is the next step's input; migration and the doctor both consume the materialization logic, so they follow it; the gate is the parity + idempotency proof at the end.

---

## Sources

- code.claude.com/docs/en/plugins-reference — Environment variables: `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`/`${CLAUDE_PROJECT_DIR}` "substituted inline anywhere they appear in skill content, agent content, hook commands, monitor commands, and MCP or LSP server configs"; arbitrary `${ENV_VAR}` documented for hook/monitor/MCP *command* strings only; `${CLAUDE_PLUGIN_ROOT}` changes on update / plugin-cache-copy behavior (HIGH)
- `docs/design/shared-install.md` — locked split decision, blast radius (50 handoff / 32 config / ~55 kit refs across 31 files), installer/validator/migration open items (HIGH, in-repo)
- `agent-factory/roles/orchestrator.md`, `agent-factory/roles/_role-switch-protocol.md` — current repo-relative reference patterns; protocol step 4 handoff-write path (HIGH, in-repo)
- `.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md` — adapters that bind the kit root today (HIGH, in-repo)
- `scripts/validate-agent-factory.mjs`, `install/install.sh`, `install/install.mjs`, `install/install.test.sh` — single-tree validator + installer machinery to make two-root-aware (HIGH, in-repo)
- `AGENTS.md` — current substrate kit/state references (lines 9-23, 66, 113-120) (HIGH, in-repo)

---
*Architecture research for: grugops v1.1 shared-location install — kit/state split runtime path resolution*
*Researched: 2026-06-06*
