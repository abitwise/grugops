# Phase 17: Install --migrate / --update - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the two deferred installer modes as **flags on the single TypeScript installer** (`install/install.ts` → committed `install/install.js`):

- **`--migrate`** — convert an already-installed **old in-repo layout** (vendored `agent-factory/` + repo-relative/symlink adapters, the v1.0-era install) to the **two-root layout** (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target). Additive-then-relocate, never-delete-first, idempotent (re-run is a no-op).
- **`--update`** — refresh the central `$GRUGOPS_HOME` kit **in place**, two-stage and reversible, leaving per-repo state untouched.
- **`--prune-old-kit`** — opt-in companion flag that removes the backups the above two modes leave behind (never runs by default).

Plus the **RED-by-design Vitest harness** (`install/install.test.ts`) that proves the safety contract.

**In scope:** the three flags, their backup/rollback behavior, detection/no-op logic, and the test harness.
**Out of scope (new capabilities → other phases/backlog):** per-repo kit-version pin + skew warning (SKEW-01, deferred), doctor `--fix` (FIX-01, deferred), plugin-form path resolution (PLUGIN-01, deferred). Any change to the install/uninstall *contract* itself beyond adding these modes.

</domain>

<decisions>
## Implementation Decisions

### Migrate — from-layout, source & shape
- **D-01:** On `--migrate`, the new central kit comes **fresh from the running checkout (`$GRUGOPS_SRC`) via the existing atomic `copyKit()`** — NOT by relocating the repo's in-repo `agent-factory/`. The kit is read-only by contract; any local edits to the in-repo copy are out-of-contract and are preserved only as a backup (see D-08), never trusted as the new kit source.
- **D-02:** `--migrate` is structurally **a normal install run wrapped with migrate-specific pre/post steps** — reuse `copyKit → materializeAdapter → seedState → writeMarker` verbatim (single-source), and add: detect old layout → back up old `agent-factory/` + old config → (install) → report. Migrate is mostly orchestration; do **not** fork a standalone code path.
- **D-03:** Old-layout **detection signal** = in-repo `agent-factory/` present **AND** no `.grugops/install.json` marker, **plus** symlink / repo-relative `.claude` adapters as corroborating signals. (The self-checkout guard already refuses the grugops *source* repo itself.)
- **D-04:** Old user-edited config (pre-`.grugops/` move, at repo-root `factory.config.json`) is **moved → `.grugops/factory.config.json`** and the original is left as a `.bak`. This carries the user's dialed settings forward — directly satisfies the SC3 "config survives migration, backed up not lost" case. (Not: seed-fresh-default; not: leave-untouched.)

### Update — scope & reversibility
- **D-05:** `--update` is **kit-home-only**: no `--target`, never touches any repo's adapters/state/marker. Adapters keep resolving because the materialized absolute KIT= path is unchanged (same `$GRUGOPS_HOME`). Matches SC2 "leaving per-repo state untouched."
- **D-06:** "Two-stage, reversible" = stage the new kit alongside, then atomic swap that **retains the displaced kit as a backup** (removed only via `--prune-old-kit`) — rather than `copyKit()`'s current delete-after-rename. This is the one behavioral delta from a plain re-install. (Implementation note: this likely means parameterizing `copyKit()` to retain-vs-delete the displaced kit, keeping it single-source.)
- **D-07:** On a **downgrade** (running checkout VERSION older than the installed kit): **warn in clear professional voice (with the version delta), then proceed** — `--update` is explicit and human-run; no refusal/negotiation (SKEW-01 is deferred). Not silent.

### Backup & rollback model
- **D-08:** Backups use **timestamped names** (e.g. `agent-factory.bak.<ISO>`) — full history, applied to the displaced in-repo `agent-factory/` (migrate), the displaced kit (update), and the old config. **Planner notes:** use **millisecond-precision ISO**, filesystem-safe (strip/replace `:`), to avoid same-second collisions; the Vitest harness asserts backup **count / glob pattern**, never an exact filename, to stay deterministic. The `.grugops/install.json` marker stays **timestamp-free** as before (unchanged).
- **D-09:** A backup is created **only when the displaced content actually differs** (skip if byte-identical). This is what makes a repeated `--migrate` / `--update` a true no-op — zero new artifacts — even with timestamped naming (history only grows on real changes).
- **D-10:** `--prune-old-kit` is **one unified opt-in flag** that removes all grugops-created `.bak`/backup artifacts in both roots. Deletion happens **only** when the flag is passed; the default path always preserves backups (never-delete-first). Not separate per-artifact flags.

### Re-run / no-op / edge behavior
- **D-11:** `--migrate` on a clean repo (no old in-repo layout AND no existing install) **falls through to a normal fresh install** — `--migrate` is a superset (migrate if there's something to migrate, else install).
- **D-12:** Half-state (marker present = already two-root, but a leftover in-repo `agent-factory/` still exists, e.g. an unpruned/interrupted prior migrate): **no-op + warn in clear voice about the leftover, hint `--prune-old-kit`**. Never re-mutate on a nominal no-op; never hard-error a recoverable state.

### Claude's Discretion
- Exact CLI help/usage text, `--check`/`DRY_RUN` report wording for the new modes, and whether `--migrate`/`--update` print a "run `--check` to verify" hint at the end — standard approaches, no user preference expressed. Keep all report/warning/error strings in **clear professional voice** (installer is a safety surface, per CLAUDE.md voice discipline).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The installer being extended (primary)
- `install/install.ts` — the single TS installer (D-13). Reuse `copyKit()` (atomic temp→rename-aside→swap), `materializeAdapter()` (strip-then-inject, bounded CR-01 removal), `seedState()`, `writeMarker()`, `detectTools()`, the arg-parse loop, `resolveGrugopsHome`/`KIT_ROOT`, the `--check` doctor, and the self-checkout guard. **The new flags are added here.**
- `install/install.js` — committed compiled output users run; must be rebuilt (`tsc`) and pass the freshness gate (`scripts/freshness.ts`).
- `install/uninstall.ts` — marker/sentinel-strip logic; SC3 requires **uninstall-after-migrate restores pre-migrate state**, so migrate's backups must be uninstall-aware/restorable.
- `install/install.test.ts` — the Vitest behavioral harness; the new RED-by-design cases land here (config survives, re-run no-op, uninstall-after-migrate restore, bounded marker-strip).
- `install/README.md` — user-facing install docs; add the `--migrate` / `--update` / `--prune-old-kit` sections.

### Requirements & design contract
- `.planning/REQUIREMENTS.md` — **MIGR-01**, **UPD-01** (note: their "byte-parity sh/Node" wording is **superseded by D-13** — see carried-forward note below).
- `.planning/ROADMAP.md` — Phase 17 goal + Success Criteria (SC1/SC2/SC3). SC1's "byte-parity sh/Node" is superseded by D-13.
- `docs/design/shared-install.md` — the two-root design + its "Open items" → "Migration for already-installed repos" is exactly this phase. Read the tooling note (TS pivot superseded the dual sh/Node installer).

### Tooling foundation
- `package.json`, `scripts/freshness.ts`, `vitest.config.ts` — the build/test/freshness loop the new code must pass.

### Carried-forward decisions (already locked — do NOT re-litigate)
- **D-13 (Phase 15):** single TS installer; there is **no `install.sh`**; modes run as `node install/install.js --migrate|--update`. The "byte-parity sh/Node" criterion in MIGR-01 / ROADMAP SC1 / shared-install.md is **superseded**.
- **CLAUDE.md hard contract:** additive · idempotent · `DRY_RUN=1` · reversible · never-overwrite/never-delete user content · never set the prod deploy-approval env var.
- **v1.1 CR-01 bounded marker-strip:** any sentinel/marker stripping must be bounded (no unterminated-marker over-deletion) — already implemented in `materializeAdapter`; migrate/update must not regress it.
- **RED-harness-first via Vitest** (Phase 15), not `.test.sh`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `copyKit()` (`install/install.ts`): atomic kit refresh (build temp → rename existing aside → atomic rename → remove old). `--update` = this, but **retain** the displaced kit as a timestamped backup instead of removing it (D-06).
- `materializeAdapter()`: strip-then-inject of the KIT= block with **bounded CR-01 removal**. Migrate reuses it to rewrite old adapters to two-root form.
- `seedFile()` / `seedState()`: per-file skip-if-exists seeding — migrate reuses for state, naturally idempotent.
- `writeMarker()` / `readMarker()`: the `.grugops/install.json` marker is the **already-migrated signal** (D-03) and is timestamp-free (keep it so, D-08).
- The `--check` doctor + its D-03 three-source kit-root cross-check already "names the specific unresolved path on failure" (SC2) — `--update` need not reimplement this; existing `--check` covers it.
- `sameContent()`: byte-compare helper — use for D-09 (back up only when content differs).

### Established Patterns
- Arg parsing is a simple `for` loop over `argv` with `--flag` / `--flag=value`; unknown args exit(2). Add `--migrate`, `--update`, `--prune-old-kit` here.
- Reports go through `report(label, msg)` greppable lines; DRY_RUN short-circuits every mutation with a `would-*` line. New modes must honor both.
- The doctor branches **before** the self-checkout guard and all mutations. Decide where the migrate/update branches sit relative to the self-checkout guard (migrate operates on a user repo, so the guard still applies; update is kit-home-only and may branch earlier — planner to place precisely).

### Integration Points
- ⚠️ **LANDMINE — symlink adapters (must handle):** old-layout `.claude` adapters may be **symlinks into the source clone** (old D-30 symlink default). `materializeAdapter()` does `writeFileSync(dest, …)`, which **follows a symlink and would overwrite the source clone file**. `--migrate` MUST `rmSync`/unlink any symlink adapter dest **before** re-materializing. Never write through a symlink. Add a RED harness case proving the source clone is untouched.
- `uninstall.ts` ↔ migrate backups: SC3 wants uninstall-after-migrate to restore pre-migrate state — coordinate the backup naming/location so restore is possible (or document the restore path).

</code_context>

<specifics>
## Specific Ideas

- All three SC3 harness cases are mandatory and RED-by-design: (1) a user-edited config survives migration (moved to `.grugops/`, original `.bak` retained — D-04); (2) a re-run is a no-op (D-09/D-11/D-12 — zero new artifacts); (3) uninstall-after-migrate restores the pre-migrate state; plus a bounded marker-strip case and the symlink-adapter-no-corruption case.
- `--migrate` semantics summary for the planner: detect old layout (D-03) → if already migrated, no-op + warn (D-12) → if nothing to migrate, fall through to install (D-11) → else back up old `agent-factory/` (timestamped, only-if-differs) + move old config to `.grugops/` (+ `.bak`) + unlink symlink adapters → run the install steps → report.
- `--update` semantics summary: kit-home-only (no target) → stage new kit → if differs, retain displaced kit as timestamped backup + atomic swap (D-06/D-09) → warn-then-proceed on downgrade (D-07) → refresh kit, leave repos untouched.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (SKEW-01 / FIX-01 / PLUGIN-01 remain in REQUIREMENTS.md "Future Requirements", not pulled in.)

</deferred>

---

*Phase: 17-install-migrate-update*
*Context gathered: 2026-06-15*
