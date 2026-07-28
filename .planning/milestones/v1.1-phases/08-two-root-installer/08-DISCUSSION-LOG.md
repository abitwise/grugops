# Phase 8: Two-Root Installer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 8-Two-Root Installer
**Areas discussed:** State seed scope, Shared-kit lifecycle, Source-checkout guard, Carry-forward cleanups

---

## State seed scope

### What the installer seeds into the target

| Option | Description | Selected |
|--------|-------------|----------|
| Full state-plane skeleton | Config + marker + full `plans/` skeleton + `memory-bank/` seed; `/grugops` works immediately, no bootstrap first | ✓ |
| Minimal wiring only | Config + marker + empty `plans/handoffs/`; bootstrap workflows create the rest | |
| Board-only middle ground | Config + marker + `plans/handoffs/` + only `plans/board.md` | |

**User's choice:** Full state-plane skeleton.
**Notes:** Decisive because the orchestrator adapter hard-reads `.grugops/factory.config.json`, root `AGENTS.md`, and `plans/board.md` on start — a minimal seed would fail before a bootstrap runs.

### Where the seed files come from

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle seeds in the kit | Default seed copies under the kit travel to `$GRUGOPS_HOME`; installer seeds any target FROM `$GRUGOPS_HOME` (self-contained) | ✓ |
| Seed from source checkout | Installer copies `plans/` + `memory-bank/` from `GRUGOPS_SRC` at install time; only works while the source checkout exists | |

**User's choice:** Bundle seeds in the kit.
**Notes:** Mirrors the existing default-config precedent (`agent-factory/config/factory.config.json` already in the kit). Chosen for self-containment — a machine with only `$GRUGOPS_HOME` must still be able to seed a fresh target.

### Seed subtree vs the Phase-7 `check-kit-refs.sh` gate

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude seeds from the gate | Seeds are state templates; their `.grugops/`/`plans/` refs resolve in the target by design — add to the gate's exclude set | ✓ |
| Hold seeds to the gate | Keep seeds in scan, constrain their contents to gate-clean spelling | |
| You decide | Defer to planner based on the gate's actual scan/exclusion mechanism | |

**User's choice:** Exclude seeds from the gate.
**Notes:** Holding repo-relative state templates to a kit-resolution gate would be a category error and risk false failures.

---

## Shared-kit lifecycle

### Re-install when a kit already exists at `$GRUGOPS_HOME`

| Option | Description | Selected |
|--------|-------------|----------|
| Always (re)copy = update | Copy this checkout's kit over the existing one every run; idempotent on same version, updates in place when newer | ✓ |
| Skip if kit present | Leave any existing kit untouched; install never updates the kit | |
| Version-compare then copy | Copy only if source VERSION differs/newer; warn on downgrade (edges into deferred SKEW-01) | |

**User's choice:** Always (re)copy = update.
**Notes:** Matches the design doc's "install/update the kit; idempotent." No version negotiation — SKEW-01 is deferred to v1.2. Kit is grugops-owned read-only, not user content.

### What uninstall removes vs preserves

| Option | Description | Selected |
|--------|-------------|----------|
| Adapters + wiring only | Remove `.claude` adapters, CLAUDE.md/Copilot pointers, Gemini wiring, install marker; never the shared kit, never seeded state | ✓ |
| Also reverse pristine state | Above, plus remove seeded state still byte-identical to the seed (keep modified) | |
| Add an opt-in --purge-kit flag | Above, plus a confirm-gated flag to remove the shared `$GRUGOPS_HOME` kit | |

**User's choice:** Adapters + wiring only.
**Notes:** The shared kit is used by other repos; seeded state may now hold user work. Shared-kit removal is a manual `rm` this phase.

---

## Source-checkout guard

### Guarding against installing into the grugops source checkout

| Option | Description | Selected |
|--------|-------------|----------|
| Refuse by default + override | Detect target == source checkout, STOP with guidance; explicit `--allow-self`/`--force` to proceed | ✓ |
| Warn loudly, let it proceed | Detect + warn, but the confirm prompt / `--yes` proceeds | |
| Rely on the confirm prompt | No special detection; trust the new confirm-the-default prompt | |

**User's choice:** Refuse by default + override.
**Notes:** Installing into the clone would materialize a machine-specific absolute kit path into the SOURCE adapters (dirtying the repo) and the `--yes`/CI path would silently reproduce the original dogfood failure. Mechanical guard fits grugops's "safety is mechanical, not prose" ethos.

---

## Carry-forward cleanups

### Folding the two Phase-7 carry-forward items (WR-05 + IN-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Fold both into Phase 8 | Fix WR-05 (drop `Agent` grant from the two packaging templates) and IN-01 (rewrite stale `agent-factory/config/` paths in `agent-factory/README.md` + `factory.config.md`) | ✓ |
| Only IN-01 (docs) | Fix just the stale config-path docs; leave WR-05 for later | |
| Defer both | Keep Phase 8 to installer logic only; track both separately | |

**User's choice:** Fold both into Phase 8.
**Notes:** Both touch the kit that Phase 8 copies to `$GRUGOPS_HOME`, so fixing them here keeps the shipped/copied kit correct and the no-spawn rule holding in regenerated adapters. Low blast radius.

---

## Claude's Discretion

- Install-marker content/shape (kit version stamp, materialized kit path, install date/mode) — must be parse-stable and forward-compatible for the Phase 9 doctor; sh + Node write it byte-identically.
- Materialization mechanism: how the absolute `KIT=` line is injected into adapters, plus the re-materialization idempotency rule (zero diff when `$GRUGOPS_HOME` unchanged; correct update when changed).
- Which adapters carry the resolver/materialized path vs which delegate.
- Interactive-prompt wording + default, `--target`/`--yes`/non-TTY mechanics, and the exact self-checkout detection predicate.
- Exact kit-bundled seed sub-location + the gate-exclusion glob.
- `os.homedir()` parity details for the Windows home in `install.mjs`.

## Deferred Ideas

- `uninstall.sh --purge-kit` flag for shared-kit removal — not adopted this phase.
- Version-skew negotiation (SKEW-01) — v1.2.
- Migration of already-installed in-repo layouts (MIGR-01) — v1.2.
- Plugin-form kit resolution via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01) — v2+.
- `install.test.sh` split rewrite + `--check` doctor + two-root validator — Phase 9.
