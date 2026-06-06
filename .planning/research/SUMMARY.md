# Project Research Summary

**Project:** grugops — Install & Distribution (v1.1 shared-location install milestone)
**Domain:** Shared-home installer refactor for a markdown agent-factory kit (`$GRUGOPS_HOME` kit + per-repo state)
**Researched:** 2026-06-06
**Confidence:** HIGH

## Executive Summary

The v1.1 milestone refactors grugops from a fully-in-repo kit into a shared-home model: one read-only kit at `$GRUGOPS_HOME` (default `~/.grugops`) and per-project writable state seeded into each target repo. This is the established pattern across every comparable developer tool (rustup, nvm, pyenv, volta, oh-my-zsh), and the design decision is locked (`docs/design/shared-install.md`). What the research resolved is the _mechanism_ by which the split actually works in production — and one finding reshapes the entire implementation approach versus the naive reading of the design doc.

The load-bearing correction: **an LLM does not expand `$GRUGOPS_HOME` in prose.** The agent is not a shell; it reads the literal string. Writing `$GRUGOPS_HOME/agent-factory/roles/x.md` in a SKILL body or role file produces a dead string that causes the agent to hunt, hallucinate, or silently fail — this is the DOG-02 failure mode re-created one layer up. The only safe mechanism is (A) the installer materializes the resolved absolute kit path directly into each standalone adapter at install time, plus (B) a one-line bash self-heal fallback inside the adapter. Kit prose itself never names `$GRUGOPS_HOME`. Plugin form is handled identically but by Claude Code's own inline substitution of `${CLAUDE_PLUGIN_ROOT}` — that env var IS expanded in skill/agent content; arbitrary env vars are not.

The research also confirmed three gating pitfalls that must close before any dogfood: dangling-reference reincarnation (C1), migration data-loss (C2), and false-green two-root validator (C3). These are not theoretical — C1 is the exact bug the refactor is fixing, just reincarnated at the prose layer if the rewrite is incomplete. The build order that emerges from combining the four research files is: split-convention documentation → path-rewrite of ~31 files → installer (kit-copy + adapter-materialization) → `--check` doctor → two-root validator → migration → tests. The `grugops/quick-harden-role-switch-autocommit` branch is already merged to main, so the prerequisite "edit the protocol text once" is satisfied.

## Key Findings

### Recommended Stack

The stack for this milestone is stdlib-only by project constraint — no new deps, no `package.json`. All mechanisms are POSIX builtins or Node 18+ stdlib. The conventions to adopt are drawn from the `$TOOL_HOME` dotdir pattern: `${GRUGOPS_HOME:-"$HOME/.grugops"}` in sh (colon form, so empty string falls back like unset), and `process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim() ? resolve(process.env.GRUGOPS_HOME) : resolve(homedir(), ".grugops")` in Node. A literal `~` must never be baked into any value or markdown prose — `~` is shell interactive sugar that an LLM does not expand (the nvm #2074 failure mode). Copy is the install default; symlink is opt-in only.

**Core technologies:**
- `${GRUGOPS_HOME:-"$HOME/.grugops"}` (POSIX sh): single env-var-overridable kit home — matches rustup/nvm/pyenv/volta convention (HIGH)
- `os.homedir()` + `path.resolve()` (Node 18+ stdlib): cross-platform home resolution identical to Git Bash's `$HOME` (HIGH)
- `agent-factory/VERSION` stamp at install: cheapest drift detector — a single VERSION compare, no checksum manifest (MEDIUM)
- `--check` / doctor subcommand: verify every adapter/role-ref resolves; fail with the first missing path — mirrors `brew doctor` / `mise doctor` / `flutter doctor` (MEDIUM convention)

### Expected Features

The MVP that fixes the three dogfood pains is: path-root rewrite + shared-home kit install + `--target`/prompt + `--yes` CI bypass + per-repo seed (skip existing) + `--check` doctor + `DRY_RUN=1` across two roots + `install.mjs` parity + two-root-aware validator. Everything else is P2/P3.

**Must have (P1 — v1.1 launch):**
- Path-root rewrite across ~31 files (~55 kit refs + 50 handoff refs + 32 config refs) — the linchpin; nothing else resolves without it
- Shared-home install to `$GRUGOPS_HOME` (env-overridable, copy not symlink) — fixes "kit never arrives" + "symlinks into clone"
- `--target <repo>` + interactive confirm-the-default prompt — fixes "wrong target"; confirm rather than silently default to CWD (the install-into-clone bug)
- `--yes` / non-interactive (auto-detect non-TTY stdin) — CI bypass; required any time a prompt exists
- Per-repo seed: `factory.config.json` + `plans/` incl. `plans/handoffs/`; skip existing files, never overwrite
- `--check` doctor: kit-exists, every adapter ref resolves, repo state dirs exist, no dangling symlinks; exit non-zero on FAIL; report specific unresolved path + referencing file
- `DRY_RUN=1` across the full two-root flow
- `install.mjs` mirrors `install.sh`; `install.test.sh` proves parity, idempotency, dry-run, uninstall
- Two-root-aware validator update

**Should have (P2 — after core validates):**
- `--update` verb to refresh only the shared kit
- `--migrate` for v1.0 in-repo installs (additive-then-relocate, never delete-first)
- Doctor names specific unresolved path + referencing file (the differentiator vs vague doctors)
- Two-stage `uninstall` (per-repo adapters vs shared kit)

**Defer (P3 / v2+):**
- Doctor version-skew warning (kit VERSION vs repo-recorded version)
- Doctor `--fix` for enumerated safe repairs
- Plugin-form path resolution (`$GRUGOPS_HOME` vs `${CLAUDE_PLUGIN_ROOT}`, one rule two homes)

**Anti-features (protect scope — do not build):**
- No background auto-update — silent kit changes break the trace; explicit `--update` verb only
- No symlink overlay — dogfood explicitly rejected; INSTALL_MODE=symlink is opt-in only
- No vendoring kit into every repo — footprint; rejected in the design
- No interactive TUI / wizard — zero deps, CI-hostile
- No telemetry — local-only, hostile to air-gapped/regulated users
- No doctor auto-fix of user content — `--fix` is enumerated and touches only missing scaffold, never `plans/` or `factory.config.json`

### Architecture Approach

The single resolution rule: the **adapter** is the only place a kit root is bound to an absolute path. Standalone adapters get the absolute path materialized by the installer; plugin adapters use `${CLAUDE_PLUGIN_ROOT}` which Claude Code substitutes inline. Kit prose (roles/workflows) never names `$GRUGOPS_HOME` — it continues to write `agent-factory/...` which is unambiguous once the disambiguation rule is stated in the adapter and AGENTS.md: "`agent-factory/...` = under KIT ROOT (read-only); `plans/...`, `memory-bank/...`, repo `factory.config.json` = THIS repository (read/write)." The handoff split is the most error-prone part: template reads stay `agent-factory/handoffs/` (KIT ROOT); instance writes move to `plans/handoffs/` (repo). One rule, two bindings of KIT ROOT.

**Major components:**
1. **Standalone adapter** (`.claude/skills/*/SKILL.md`, `.claude/agents/grugops-orchestrator.md`) — holds the only absolute kit-root reference; materialized at install time; re-materialized on every re-install; never user-authored
2. **Kit prose** (`agent-factory/roles/`, `agent-factory/workflows/`) — ~31 files rewritten so all handoff writes go to `plans/handoffs/`, all config refs go to repo `factory.config.json`, kit-to-kit refs keep `agent-factory/...` prefix under the disambiguation rule
3. **Installer** (`install.sh` / `install.mjs`) — resolves `$GRUGOPS_HOME`, copies kit there, materializes absolute KIT ROOT into adapters, seeds per-repo state, runs `--check`; copy-default, `--target`/prompt, `--yes`, `DRY_RUN=1`
4. **`--check` doctor** — verifies every adapter/role-referenced path resolves; fails with first missing path; shares resolution rule with the validator
5. **Two-root validator** (`scripts/validate-agent-factory.mjs`) — `KIT_ROOT` + `STATE_ROOT`; cross-root ref check; GOOD/BAD split fixtures incl. unset-`$GRUGOPS_HOME` BAD; back-compat collapse when only `VALIDATE_ROOT` is set
6. **Migration** (`install.sh --migrate`) — additive-then-relocate: copy kit, rescue filled handoffs, seed config, re-materialize adapters, quarantine (never delete) old in-repo `agent-factory/`, run `--check`

**Per-repo config location (confirmed):** repo-root `factory.config.json`. Matches `package.json` ergonomics; avoids a second state root; single fixed repo-relative literal for all 32 refs.

### Critical Pitfalls

1. **C1 — Dangling-reference reincarnation (GATING):** bare `agent-factory/...` refs surviving the rewrite cause silent wrong-root reads. Prevention: (a) build gate — `grep -rn 'agent-factory/'` over shipped kit/adapters returns zero bare refs; (b) installer materializes absolute path into adapters (Mechanism A) with bash self-heal fallback (Mechanism B); (c) `--check` doctor stat's every ref. Agent must be told in prose to STOP — not hunt — if the kit dir is absent. Both path-rewrite and doctor must land before dogfood.

2. **C2 — Migration data-loss (GATING):** `rm -rf agent-factory/` takes user-filled handoffs; leaving them in place strands them silently. Prevention: additive-then-relocate, never delete-first. Rescue filled handoff instances to `plans/handoffs/`, rename (never delete) the old `agent-factory/`. Fixture test: a filled handoff survives migration with content intact. No ship without this test.

3. **C3 — False-green two-root validator (GATING):** validator run inside the grugops dev checkout finds everything green while a real target with dangling refs is broken. Prevention: two explicit roots with no silent fallback to `.`; unset-`$GRUGOPS_HOME` BAD fixture MUST fail; validator and `--check` doctor resolve home identically.

4. **C4 — Single-source erosion:** `$GRUGOPS_HOME` is a derived cache, not an editable source. Prevention: stamp VERSION + provenance; `--update` reports (never silently clobbers) a locally-modified kit file; migration renames the stale in-repo copy out of the agent's glob path.

5. **LLM-in-prose anti-pattern (cross-cutting):** `$GRUGOPS_HOME` in kit prose or skill bodies is a dead string in standalone form and an unexpanded arbitrary env var in plugin form (only `${CLAUDE_PLUGIN_ROOT}` is expanded inline). Prevention: no bare `$GRUGOPS_HOME` in any role, workflow, SKILL body, or AGENTS.md. The adapter holds the only env-var reference.

## Implications for Roadmap

Based on combined research, the forced build order (each step is the next step's input):

### Phase 1: Split Convention + Path Rewrite
**Rationale:** The disambiguation rule and final token spelling must be locked before any automated tool checks them. Every downstream component (installer, doctor, validator, migration) keys off the final `agent-factory/...` vs `plans/handoffs/` vs `factory.config.json` token decisions. The `grugops/quick-harden-role-switch-autocommit` branch is already merged to main — the role-switch protocol can be edited once in this phase. Pure prose editing, no code.
**Delivers:** AGENTS.md + orchestrator preamble with disambiguation rule + bash self-heal line (Mechanism B); all ~31 role/workflow files rewritten; `grep -rn 'agent-factory/'` over shipped artifacts returns zero bare refs
**Addresses:** C1 root cause, anti-pattern LLM-in-prose
**Avoids:** C1 reincarnation, C3 validator keying off wrong tokens

### Phase 2: Installer — Two-Root Install + Adapter Materialization
**Rationale:** Core fix for all three dogfood pains. Must follow Phase 1 because the installer materializes paths that match the rewritten token spelling. `install.sh` and `install.mjs` land together (parity is an existing contract).
**Delivers:** `$GRUGOPS_HOME` resolution (env > default `~/.grugops`); kit copy (idempotent); absolute KIT ROOT materialized into standalone adapters (Mechanism A); per-repo seed; `--target`/prompt + `--yes`/non-TTY; `DRY_RUN=1`; VERSION stamp; `install.mjs` mirrors `install.sh`; `install.test.sh` extended
**Implements:** Installer + standalone adapter components
**Avoids:** C4 (VERSION stamp), C5 (copy-default), CI/container/Windows env-resolution pitfalls

### Phase 3: `--check` Doctor
**Rationale:** The design calls this "the guard that would have caught all three pains." Depends on Phase 1 (to know which refs to verify) and Phase 2 (to know what a good install looks like). Build before the validator and migration because both reuse its resolution logic.
**Delivers:** `--check` mode: kit-exists, every ref resolves, no dangling symlinks, per-repo state exists; exit non-zero on FAIL; specific unresolved path + referencing file; WARN exits 0 / FAIL exits 1; `--check --strict`; shared resolution rule with the validator
**Addresses:** C1 (catches missed bare refs), C3 (shared resolution), C5 (dangling-symlink detection)

### Phase 4: Two-Root Validator + Test Fixtures
**Rationale:** Validator must follow the path-rewrite and doctor. Shares resolution rule with the doctor — building doctor first gives the validator a reference implementation to match. The validator is the structural proof layer; it must not regress on the split.
**Delivers:** `validate-agent-factory.mjs` split into `KIT_ROOT`/`STATE_ROOT`; cross-root ref classification; GOOD/BAD split fixtures incl. unset-`$GRUGOPS_HOME` BAD + bare-ref-wrong-root BAD; back-compat `VALIDATE_ROOT` collapse; `validate.test.sh` updated
**Implements:** Two-root validator component
**Avoids:** C3 false-green (the gating check for the entire milestone)

### Phase 5: Migration (`--migrate`) — P2
**Rationale:** Migration is last because it reuses adapter-materialization (Phase 2), repo-config seeding (Phase 2), and the doctor (Phase 3) to self-verify. Highest-risk operation (C2 data-loss); build when all dependencies are tested and stable. P2 — can ship after the core is dogfooded on fresh installs.
**Delivers:** `--migrate` mode: detect old layout, copy kit, rescue filled handoff instances → `plans/handoffs/`, seed config, re-materialize adapters, quarantine (rename, never delete) old `agent-factory/`, run `--check`; DRY_RUN=1; idempotent; fixture with filled handoff survives; `--prune-old-kit` as explicit non-default
**Addresses:** C2 (additive-then-relocate), C4 (kills stale in-repo copy as a read source)
**Avoids:** C2 data-loss (hard gate: no ship without the survival fixture test)

### Phase Ordering Rationale

- **Convention before code:** the split rule and token spelling must be locked before any automated tool checks them — a missed ref in Phase 1 cascades into all later phases
- **Installer before doctor:** the doctor verifies what the installer produces; shared resolution rule is cleaner to extract after the installer owns it
- **Doctor before validator:** validator and doctor must share the same `$GRUGOPS_HOME` resolution; building doctor first gives the validator a reference implementation to match
- **Validator before migration:** migration's self-verification step calls the doctor and implicitly validates the split; both must be trustworthy before migration ships
- **Migration is P2:** not needed for the core fix to work on fresh installs; defer until core is dogfooded and a real v1.0 repo needs to move
- **Tests are continuous:** `install.test.sh` grows with each phase; do not defer all tests to Phase 5

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1 (rewrite):** mechanical prose editing; token spellings and disambiguation rule are fully designed in the research files; the blast radius is measured (31 files, ~137 refs)
- **Phase 2 (installer):** stdlib-only; patterns are identical to rustup/nvm/oh-my-zsh; the resolution code snippets in STACK.md can be used directly
- **Phase 3 (doctor):** well-documented pattern; exit-code convention fully specified in FEATURES.md
- **Phase 4 (validator):** two-root split design fully specified in ARCHITECTURE.md; back-compat collapse rule is clear

Phases needing attention during planning:
- **Phase 5 (migration):** the additive-then-relocate algorithm is specified but the fixture design for the C2 survival test needs explicit planning before writing code; the `is_protected()` extension for the surgical within-`agent-factory/` case requires careful thought

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All mechanisms are stdlib; POSIX and Node 18+ APIs verified against primary sources; `$TOOL_HOME` dotdir convention verified across rustup/nvm/pyenv/volta |
| Features | HIGH | Table-stakes drawn from named comparables with official docs; anti-features are principled design decisions from the locked design doc; MVP split is clear |
| Architecture | HIGH | LLM-doesn't-expand-env-var finding verified against Claude Code plugin docs; standalone behavior confirmed from live repo grep (137 refs); single-rule-two-homes design is logically complete |
| Pitfalls | HIGH | C1 is a live measured bug (137 bare refs / 31 files); C2 maps directly to the existing never-delete contract; C3 is a structural gap confirmed by reading the current validator source |

**Overall confidence:** HIGH

### Gaps to Address

- **Plugin-form bundling (D-31):** the plugin adapter must bundle `agent-factory/` inside the plugin dir so `${CLAUDE_PLUGIN_ROOT}/agent-factory/...` resolves in the plugin cache. Deferred to the plugin milestone. When designing the `resolve_kit_root()` function in Phase 2, stub the plugin home binding so the plugin milestone can add it without a second rewrite.
- **Per-repo install marker:** exact filename + location for the VERSION stamp (e.g. `plans/.grugops-install.json` holding `{version, grugopsHome, installedAt}`). Decide in Phase 2 alongside the VERSION stamp; LOW friction either way.
- **CI/container `$HOME` unset:** `getent passwd "$(id -u)"` fallback for containers with arbitrary UIDs is documented in PITFALLS.md; confirm-with-test in Phase 2 rather than build speculatively.
- **`2.0.0` vs `0.x` version:** flagged open in STACK.md and CLAUDE.md. This milestone should not change the version. Flag for human decision before the release milestone.
- **Doctor `--check --fix`:** defer; ship detect-and-report first. When added, the allowed fix set must be enumerated and locked to missing scaffold only — never user content.

## Sources

### Primary (HIGH confidence)
- `docs/design/shared-install.md` (in-repo) — locked split decision, blast radius, installer/validator/migration scope
- `code.claude.com/docs/en/plugins-reference` — `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`/`${CLAUDE_PROJECT_DIR}` inline substitution in skill/agent content; arbitrary `${ENV_VAR}` documented for hook/MCP command strings only
- `freedesktop.org — XDG Base Directory Spec v0.8` — confirmed XDG is the rejected alternative; absolute-path-or-ignore rule borrowed
- Node.js v24 API docs (`os.homedir`, `path.resolve`) — cross-platform home resolution behavior
- `rust-lang.github.io/rustup`, `nvm-sh/nvm`, `pyenv`, `volta` docs — `$TOOL_HOME` dotdir convention; `$HOME` not `~` in defaults
- `install/install.sh`, `install/uninstall.sh`, `install/install.test.sh` (in-repo) — existing contract; `is_protected()`, `cmp`, `DRY_RUN`, `CONTRACT VIOLATION` assertions
- `AGENTS.md`, `.claude/skills/grugops/SKILL.md`, `agent-factory/roles/orchestrator.md` (in-repo) — live bare refs measured by grep (137 refs / 31 files)
- `msys2.org`, gitforwindows.org, Windows Dev Blog — Git Bash `ln -s` deep-copy; Windows symlinks need Developer Mode

### Secondary (MEDIUM confidence)
- `brew doctor` exit-code history, `mise doctor`, `flutter doctor`, `npm doctor` — `--check` convention and exit-code design
- AlmaLinux toolbox commit + linuxbash.sh — `getent passwd` fallback for unset `$HOME` in containers
- `kubernetes.io version-skew-policy`, `asdf .tool-versions local-vs-global` — C6 compatibility-window framing
- sanity.io, jhall.io, oneuptime.com — idempotent migration: ADD/COPY first, humans DELETE

### Tertiary (LOW confidence)
- nvm issue #2074 — tilde-not-expanded-in-env-var gotcha; illustrative, behavior independently verified from POSIX spec

---
*Research completed: 2026-06-06*
*Ready for roadmap: yes*
