# Phase 17: Install --migrate / --update - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 17-install-migrate-update
**Areas discussed:** Migrate: from-layout & kit source; --update scope vs plain re-install; Backup & rollback model; Re-run no-op & nothing-to-migrate

---

## Migrate: from-layout & kit source

### Kit source on --migrate
| Option | Description | Selected |
|--------|-------------|----------|
| Fresh from running checkout ($GRUGOPS_SRC) — reuse copyKit() | Same atomic copyKit() as install; in-repo agent-factory/ treated as disposable (backed up, never relocated) | ✓ |
| Relocate the repo's in-repo agent-factory/ up to $GRUGOPS_HOME | Move the exact kit the repo used; preserves out-of-contract edits, second riskier code path | |

### Structural shape of --migrate
| Option | Description | Selected |
|--------|-------------|----------|
| Install run + migrate-specific pre/post steps | Reuse copyKit/materializeAdapter/seedState/writeMarker; migrate is orchestration; single-source | ✓ |
| A distinct standalone code path | Self-contained; more control, duplicates logic, drift risk | |

### Old user-edited config handling (SC3)
| Option | Description | Selected |
|--------|-------------|----------|
| Move old config → .grugops/factory.config.json + leave a .bak | Carries dialed settings forward; satisfies SC3 directly | ✓ |
| Back up old config, seed a fresh default | Safer vs schema drift, but drops user settings | |
| Leave old config untouched; seed only if .grugops/ empty | Minimal touch; risk of editing a dead file | |

### Old-layout detection signal
| Option | Description | Selected |
|--------|-------------|----------|
| In-repo agent-factory/ present AND no .grugops/install.json marker | Simple, robust; pairs with no-op guard | |
| Above, plus symlink/repo-relative adapters as corroborating signals | More precise detection surface | ✓ |
| Old repo-root factory.config.json present | Weaker tell | |

**User's choice:** Fresh-from-checkout; install-run + pre/post; move-config-+-.bak; detect via agent-factory + no-marker + adapter signals.
**Notes:** Multi-signal detection chosen over the minimal single-signal version.

---

## --update scope vs plain re-install

### What --update touches
| Option | Description | Selected |
|--------|-------------|----------|
| Kit-home only — no --target, never touch any repo | Refresh shared kit in place; repos untouched; adapters still resolve | ✓ |
| Kit-home + re-materialize current repo's adapters & marker | Couples update to a target; really a re-install/migrate concern | |

### Reversibility model
| Option | Description | Selected |
|--------|-------------|----------|
| Retain a rollback backup of the prior kit; prune only via --prune-old-kit | Two-stage stage→swap→keep-backup; never-delete-first | ✓ |
| Rely on copyKit()'s existing atomic swap (no retained backup) | Leaner; no on-disk rollback | |

### Downgrade behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Warn in clear voice, then proceed | Honors explicit human-run update; SKEW-01 deferred | ✓ |
| Refuse downgrade unless --force/--allow-downgrade | Safer vs accidental rollback; more friction | |
| Proceed silently | Surprising; works against trace honesty | |

**User's choice:** Kit-home-only; retain rollback backup (prune via --prune-old-kit); warn-then-proceed on downgrade.

---

## Backup & rollback model

### Backup naming convention
| Option | Description | Selected |
|--------|-------------|----------|
| Single stable .bak suffix, overwrite on repeat | One rollback level; bounded disk; idempotent-friendly | |
| Timestamped backups (agent-factory.bak.<ISO>) — full history | Max recoverability; accumulates; complicates no-op | ✓ |
| PID-suffixed (.old.<pid>) | Reuses internal convention; opaque to humans | |

### --prune-old-kit scope
| Option | Description | Selected |
|--------|-------------|----------|
| Removes all grugops-created .bak artifacts; never runs by default | One unified opt-in flag, both roots; never-delete-first | ✓ |
| Separate flags per artifact | Finer control; more flags to document/test | |

### When to create a backup
| Option | Description | Selected |
|--------|-------------|----------|
| Only when displaced content actually differs (skip if byte-identical) | Guarantees a repeated run leaves zero new artifacts | ✓ |
| Always back up then swap | Simpler; weakens no-op guarantee | |

**User's choice:** Timestamped full history; unified --prune-old-kit; back up only when content differs.
**Notes:** Timestamped + only-when-differs are compatible — no-op re-runs create zero backups, so history only grows on real changes. Planner note carried to CONTEXT: ms-precision FS-safe ISO; harness asserts count/glob not exact name; marker stays timestamp-free.

---

## Re-run no-op & nothing-to-migrate

### No old layout + no install (clean repo)
| Option | Description | Selected |
|--------|-------------|----------|
| Hard error: 'nothing to migrate — run a normal install' | Keeps migrate intent explicit | |
| Fall through to a normal fresh install | --migrate as superset; one-command story | ✓ |

### Half-state (marker present + leftover in-repo agent-factory/)
| Option | Description | Selected |
|--------|-------------|----------|
| No-op + warn about the leftover, hint --prune-old-kit | Safe, never-delete-first | ✓ |
| Re-back-up and relocate the leftover automatically | Mutates on a nominal no-op | |
| Hard error — ambiguous state, ask the human | Safest but more friction | |

**User's choice:** Fall through to fresh install when nothing to migrate; no-op + warn on half-state.

---

## Claude's Discretion

- Exact CLI help/usage text, DRY_RUN / --check report wording for the new modes, and whether to print a "run --check to verify" hint after migrate/update. All strings in clear professional voice (installer = safety surface).

## Deferred Ideas

None — discussion stayed within phase scope. SKEW-01 / FIX-01 / PLUGIN-01 remain in REQUIREMENTS.md Future Requirements.
