# Phase 17: Install --migrate / --update - Research

**Researched:** 2026-06-15
**Domain:** TypeScript installer extension (file-system migration / kit refresh; reversible, never-delete-first safety surface)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Migrate — from-layout, source & shape**
- **D-01:** On `--migrate`, the new central kit comes **fresh from the running checkout (`$GRUGOPS_SRC`) via the existing atomic `copyKit()`** — NOT by relocating the repo's in-repo `agent-factory/`. The kit is read-only by contract; any local edits to the in-repo copy are out-of-contract and are preserved only as a backup (D-08), never trusted as the new kit source.
- **D-02:** `--migrate` is structurally **a normal install run wrapped with migrate-specific pre/post steps** — reuse `copyKit → materializeAdapter → seedState → writeMarker` verbatim (single-source), and add: detect old layout → back up old `agent-factory/` + old config → (install) → report. Migrate is mostly orchestration; do **not** fork a standalone code path.
- **D-03:** Old-layout **detection signal** = in-repo `agent-factory/` present **AND** no `.grugops/install.json` marker, **plus** symlink / repo-relative `.claude` adapters as corroborating signals. (The self-checkout guard already refuses the grugops *source* repo itself.)
- **D-04:** Old user-edited config (pre-`.grugops/` move, at repo-root `factory.config.json`) is **moved → `.grugops/factory.config.json`** and the original is left as a `.bak`. This carries the user's dialed settings forward — directly satisfies the SC3 "config survives migration, backed up not lost" case. (Not: seed-fresh-default; not: leave-untouched.)

**Update — scope & reversibility**
- **D-05:** `--update` is **kit-home-only**: no `--target`, never touches any repo's adapters/state/marker. Adapters keep resolving because the materialized absolute KIT= path is unchanged (same `$GRUGOPS_HOME`). Matches SC2 "leaving per-repo state untouched."
- **D-06:** "Two-stage, reversible" = stage the new kit alongside, then atomic swap that **retains the displaced kit as a backup** (removed only via `--prune-old-kit`) — rather than `copyKit()`'s current delete-after-rename. This is the one behavioral delta from a plain re-install. (Implementation note: likely parameterize `copyKit()` to retain-vs-delete the displaced kit, keeping it single-source.)
- **D-07:** On a **downgrade** (running checkout VERSION older than the installed kit): **warn in clear professional voice (with the version delta), then proceed** — `--update` is explicit and human-run; no refusal/negotiation (SKEW-01 is deferred). Not silent.

**Backup & rollback model**
- **D-08:** Backups use **timestamped names** (e.g. `agent-factory.bak.<ISO>`) — full history, applied to the displaced in-repo `agent-factory/` (migrate), the displaced kit (update), and the old config. Use **millisecond-precision ISO**, filesystem-safe (strip/replace `:`), to avoid same-second collisions; the Vitest harness asserts backup **count / glob pattern**, never an exact filename, to stay deterministic. The `.grugops/install.json` marker stays **timestamp-free** as before (unchanged).
- **D-09:** A backup is created **only when the displaced content actually differs** (skip if byte-identical). This is what makes a repeated `--migrate` / `--update` a true no-op — zero new artifacts — even with timestamped naming (history only grows on real changes).
- **D-10:** `--prune-old-kit` is **one unified opt-in flag** that removes all grugops-created `.bak`/backup artifacts in both roots. Deletion happens **only** when the flag is passed; the default path always preserves backups (never-delete-first). Not separate per-artifact flags.

**Re-run / no-op / edge behavior**
- **D-11:** `--migrate` on a clean repo (no old in-repo layout AND no existing install) **falls through to a normal fresh install** — `--migrate` is a superset (migrate if there's something to migrate, else install).
- **D-12:** Half-state (marker present = already two-root, but a leftover in-repo `agent-factory/` still exists): **no-op + warn in clear voice about the leftover, hint `--prune-old-kit`**. Never re-mutate on a nominal no-op; never hard-error a recoverable state.

### Claude's Discretion
- Exact CLI help/usage text, `--check`/`DRY_RUN` report wording for the new modes, and whether `--migrate`/`--update` print a "run `--check` to verify" hint at the end — standard approaches, no user preference expressed. Keep all report/warning/error strings in **clear professional voice** (installer is a safety surface, per CLAUDE.md voice discipline).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. SKEW-01 (per-repo kit-version pin + skew warning), FIX-01 (doctor `--fix`), PLUGIN-01 (plugin-form path resolution) remain in REQUIREMENTS.md "Future Requirements", **not** pulled in.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | `install --migrate` converts an already-installed in-repo layout to the split two-root layout — additive-then-relocate, never delete-first (rename-to-backup; deletion only behind explicit `--prune-old-kit`); re-run is a no-op. *(The MIGR-01 "byte-parity sh/Node" clause is SUPERSEDED by D-13 — there is no `install.sh`; mode runs as `node install/install.js --migrate`.)* | `copyKit()` (install.ts:558-575), `materializeAdapter()` (install.ts:581-628), `seedState()` (install.ts:660-678), `writeMarker()` (install.ts:737-757), `readMarker()` (install.ts:185-193), `sameContent()` (install.ts:430-436) — all reusable verbatim or with one retain-flag parameter. Old-layout from-shape confirmed from `git show v1.0` (see Old-Layout Forensics). |
| UPD-01 | `install --update` refreshes the central `$GRUGOPS_HOME` kit in place (two-stage, reversible); the doctor names the specific unresolved path on failure. *(Superseded "install.sh" → `node install/install.js --update`.)* | `copyKit()` is already a two-stage atomic swap; only delta is "retain displaced kit as a timestamped backup" (D-06). The doctor (install.ts:251-363) **already** names the specific unresolved path on failure (SC2) — `--update` need not reimplement it. |
</phase_requirements>

## Summary

Phase 17 adds three flags (`--migrate`, `--update`, `--prune-old-kit`) to the single TypeScript installer (`install/install.ts` → committed `install/install.js`) plus the matching RED-by-design Vitest cases in `install/install.test.ts`. This is **not** a greenfield phase and has **zero external dependencies** — no npm packages, no libraries to research. The work is entirely an extension of existing, verified, in-repo TypeScript that already enforces the additive / idempotent / DRY_RUN / reversible / never-delete-first contract. The baseline is green today: `npm run freshness` reports all 10 committed `.js` fresh, and `npx vitest run install` passes 21 + 1 skipped.

The implementation is dominated by **orchestration, not new mechanism** (D-02). `--migrate` is a normal install run with detect/back-up pre-steps; `--update` is `copyKit()` with one behavioral delta (retain the displaced kit as a backup instead of `rmSync`-ing it, D-06). The two genuinely new pieces of code are (1) a timestamped-backup helper with a differs-only guard (D-08/D-09) and (2) old-layout detection (D-03). The single most dangerous landmine is in `materializeAdapter()`: it does `writeFileSync(dest, …)`, which **follows a symlink and overwrites its target** — for a v1.0 install whose `.claude` adapters are symlinks into the source clone, re-materializing without first unlinking the symlink would corrupt the source clone. The fix is to `rmSync`/unlink any symlink adapter dest **before** re-materializing, and a RED harness case must prove the source clone is untouched.

**Primary recommendation:** Add the three flags to the existing arg-parse loop, branch `--update` early (kit-home-only, before the self-checkout guard) and `--migrate` as a pre/post wrapper around the existing install run (after the guard). Parameterize `copyKit()` with a `retainBackup` flag for D-06. Add one `backupIfDiffers()` helper (ms-ISO, `:` stripped, differs-only) reused by migrate (in-repo `agent-factory/` + old config) and update (displaced kit). Unlink symlink adapter dests before `materializeAdapter()`. Keep every report/warning/error string in clear professional voice. Rebuild with `tsc` and pass `npm run freshness` before committing the `.js`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `--migrate` flag (detect old layout, back up, relocate to two-root) | Installer tooling (`install/install.ts`) | Test harness (`install/install.test.ts`) | The installer is the only mover of files; migration is its mutation surface. |
| `--update` flag (refresh central kit in place) | Installer tooling | Doctor (`--check`, already exists) | Kit lives at `$GRUGOPS_HOME`; only the installer writes there. The doctor verifies after. |
| `--prune-old-kit` flag (delete backups, opt-in) | Installer tooling | — | The single deletion surface; gated behind explicit opt-in (never-delete-first). |
| Timestamped backup naming + differs-only guard | Installer tooling (new helper) | — | Pure file-system helper; lives beside `copyKit`/`sameContent`. |
| Symlink-adapter corruption guard (unlink before materialize) | Installer tooling (`materializeAdapter` caller) | Test harness | Safety-critical; the harness proves the source clone is untouched. |
| Uninstall-after-migrate restore (SC3) | Uninstall tooling (`install/uninstall.ts`) + backup naming contract | Test harness | Reversibility is uninstall's job; migrate must leave backups uninstall can reason about / a documented restore path. |
| Build-output freshness of the new `.js` | Build gate (`scripts/freshness.ts`, `tsc`) | CI | The committed `.js` must be a faithful build of the new `.ts`. |
| RED-by-design behavioral proof | Test harness (`install/install.test.ts`) | — | Nyquist validation: every SC maps to a Vitest assertion. |

## Standard Stack

**No external libraries.** This phase ships zero new dependencies (CLAUDE.md hard constraint: grugops adds no npm runtime deps to itself; host machines run the committed `.js` with zero runtime deps). The only tools involved are the ones already in `package.json`.

### Core (already present — no install)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| TypeScript (`tsc`) | `~6.0.3` (devDep) `[VERIFIED: package.json:16]` | Compile `install.ts` → committed `install.js` | The ratified tooling language (D-13). |
| Node.js runtime | `>=22` (engines) `[VERIFIED: package.json:6]`; local `v24.12.0` `[VERIFIED: node --version]` | Runs the committed `.js`; host prerequisite | `import.meta.dirname` (Node 22+) is used at install.ts:90. |
| Vitest | `~4.1.8` (devDep) `[VERIFIED: package.json:17]` | The behavioral test harness | RED-harness-first via Vitest (Phase 15), not `.test.sh`. |
| `@types/node` | `~22` (type-only devDep) `[VERIFIED: package.json:15]` | Types for `node:fs`/`node:path`/`node:os` | Type-only; never shipped to hosts. |

Node stdlib modules already imported in `install.ts` and sufficient for everything this phase needs: `node:fs` (`existsSync`, `mkdirSync`, `readFileSync`, `writeFileSync`, `cpSync`, `rmSync`, `renameSync`, `readdirSync`, `lstatSync`, `unlinkSync` — note `unlinkSync` is imported in `uninstall.ts:46` and may need adding to the `install.ts` import block for the symlink-unlink fix), `node:path` (`dirname`, `join`, `resolve`), `node:os` (`homedir`).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Parameterizing `copyKit()` with a `retainBackup` flag | A separate `updateKit()` function | Rejected by D-02/D-06 single-source intent — duplicating the atomic temp→rename→swap logic risks the two paths drifting. One parameter keeps it single-source. |
| `rmSync(dest, {force:true})` to clear a symlink dest before materialize | `unlinkSync(dest)` | Equivalent for a symlink; `rmSync(..., {force:true})` is already imported in install.ts and is the repo's idiom (used in `copyKit`). Prefer it for consistency. |
| ms-ISO timestamp with `:` replaced by `-` | epoch-millis integer suffix | Either is filesystem-safe and collision-resistant; D-08 explicitly chose ms-precision ISO. Follow the locked decision. |

**Installation:** None. `npm install` (dev only) is already satisfied; no new packages.

**Version verification:** Confirmed against `package.json` (no registry lookup needed — no new packages). Build/test/freshness loop verified green this session.

## Package Legitimacy Audit

> Not applicable — this phase installs **no external packages**. All code uses Node stdlib and the existing devDependencies (`typescript`, `vitest`, `@types/node`), which were vetted in Phase 15. slopcheck was not run because there is nothing to check.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         node install/install.js <flags>
                                     │
                          ┌──────────┴───────────┐
                          │   arg-parse loop      │  (install.ts:66-87)
                          │   add: --migrate       │
                          │        --update        │
                          │        --prune-old-kit │
                          └──────────┬───────────┘
                                     │
              ┌──────────────────────┼───────────────────────────┐
              │ CHECK?                │ UPDATE? (kit-home-only)    │ default / MIGRATE
              ▼                       ▼                            ▼
        doctor() → exit         ┌──────────────────┐    ┌──────────────────────────┐
        (install.ts:370-372)    │ self-checkout     │    │ self-checkout guard       │
        ALREADY names the       │ guard MAY be      │    │ (install.ts:378-389)      │
        unresolved path (SC2)   │ skipped — update  │    │ migrate operates on a     │
                                │ has no --target,  │    │ USER repo → guard applies │
                                │ touches only HOME │    └────────────┬─────────────┘
                                └────────┬─────────┘                 │
                                         ▼                MIGRATE pre-steps (D-02/D-03):
                          copyKit(retainBackup=true)      ┌──────────────────────────┐
                          (D-06: stage new kit,           │ detect old layout (D-03): │
                           rename displaced kit aside      │  in-repo agent-factory/   │
                           as agent-factory.bak.<ISO>      │  AND no install.json      │
                           ONLY IF differs (D-09),         │  marker AND repo-relative │
                           atomic swap, KEEP backup)       │  /symlink .claude adapters│
                                         │                 ├──────────────────────────┤
                          warn-then-proceed on             │ already-migrated? (D-12)  │
                          downgrade (D-07)                  │  → no-op + warn, hint     │
                                         │                 │  --prune-old-kit, EXIT    │
                                         ▼                 ├──────────────────────────┤
                                  per-repo state           │ nothing to migrate? (D-11)│
                                  UNTOUCHED (SC2)           │  → fall through to fresh   │
                                         │                 │  install (no pre-steps)    │
                                         ▼                 ├──────────────────────────┤
                                  report + (opt) hint      │ else: backup old           │
                                  "run --check"            │  agent-factory/ (ISO,      │
                                                           │  differs-only D-09);       │
                                                           │  move root factory.config  │
                                                           │  → .grugops/ + leave .bak  │
                                                           │  (D-04); UNLINK symlink    │
                                                           │  adapter dests (LANDMINE)  │
                                                           └────────────┬─────────────┘
                                                                        ▼
                                                  ── normal install run (UNCHANGED) ──
                                                  copyKit → materializeAdapter (×N) →
                                                  seedState → materializeRunnable →
                                                  writeMarker → report
                                                                        │
                                                                        ▼
                                            re-run = no-op: marker now present →
                                            D-12 path → no new artifacts (D-09 differs-only)
```

```
  node install/install.js --prune-old-kit   (D-10, opt-in, the ONLY deletion path)
            │
            ▼
  glob both roots for grugops-created *.bak.* / backup artifacts → rmSync each
  (never runs by default; default path always preserves backups — never-delete-first)
```

### Recommended Project Structure
No new files except test additions. All production code lands in existing files:
```
install/
├── install.ts        # add 3 flags + backupIfDiffers() helper + copyKit(retainBackup)
│                     #   + migrate pre-steps + symlink-unlink fix; rebuild → install.js
├── install.js        # committed compiled output — MUST pass `npm run freshness`
├── uninstall.ts      # SC3: ensure uninstall-after-migrate restores pre-migrate state
│                     #   (backups are NOT grugops-removed by uninstall; document restore path)
├── uninstall.js      # rebuilt if uninstall.ts changes
├── install.test.ts   # add the RED-by-design migrate/update/prune cases
└── README.md         # add --migrate / --update / --prune-old-kit user docs
```

### Pattern 1: Reuse the atomic swap; add a retain flag (D-06)
**What:** `copyKit()` (install.ts:558-575) already does true-atomic: build new kit in `tmp`, rename existing kit aside to `old`, atomic-rename `tmp` → `KIT_ROOT`, then `rmSync(old)`. For `--update`, the only delta is to **keep** `old` (renamed to a timestamped backup) instead of `rmSync`-ing it, and only when it differs (D-09).
**When to use:** `--update` and `--migrate` (migrate's kit copy is D-01: fresh from source via the same `copyKit`).
**Example:**
```typescript
// Source: install/install.ts:558-575 (current copyKit — the pattern to parameterize)
function copyKit(): void {
  if (DRY_RUN) { report("would-copy", `kit → ${KIT_ROOT}`); return; }
  mkdirp(GRUGOPS_HOME);
  const tmp = `${GRUGOPS_HOME}/.agent-factory.tmp.${process.pid}`;
  const old = `${KIT_ROOT}.old.${process.pid}`;
  rmSync(tmp, { recursive: true, force: true });
  cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, { recursive: true });
  if (existsSync(KIT_ROOT)) renameSync(KIT_ROOT, old);   // ← displaced kit
  renameSync(tmp, KIT_ROOT);                              // ← atomic swap
  rmSync(old, { recursive: true, force: true });          // ← D-06: RETAIN instead, if differs
  report("copied", `kit → ${KIT_ROOT}`);
}
// D-06/D-09 shape: when retainBackup && existsSync(old) && kit content differs,
//   renameSync(old, `${KIT_ROOT}.bak.${isoStamp()}`) and report it; else rmSync(old) as today.
// Differs check: compare the displaced kit against the freshly staged tmp BEFORE the swap
//   (e.g. compare VERSION files, or a recursive content compare) — a true no-op leaves zero new
//   artifacts even with timestamped naming.
```

### Pattern 2: Migrate as orchestration around the unchanged install run (D-02)
**What:** Do not fork a code path. Run detect → back up → (the existing install sequence verbatim) → report. The marker written at the end (writeMarker, install.ts:737) becomes the already-migrated signal so a re-run takes the D-12 no-op path.
**When to use:** `--migrate`.
**Example:**
```typescript
// Source: derived from install.ts:768-820 (the existing run sequence is reused unchanged)
// MIGRATE pre-steps run BEFORE the "-- kit --" block; the rest of the file runs as-is.
//   1. detectOldLayout(TARGET)  → see Pattern 3
//   2. if already-migrated (marker present + leftover agent-factory/) → D-12 no-op + warn, exit 0
//   3. if nothing to migrate (no old layout, no install) → fall through (D-11), no pre-steps
//   4. else: backupIfDiffers(join(TARGET,"agent-factory"), …) ;
//            move root factory.config.json → .grugops/factory.config.json + leave .bak (D-04) ;
//            unlink any SYMLINK .claude adapter dests (LANDMINE — Pitfall 1)
//   then copyKit → materializeAdapter ×N → seedState → materializeRunnable → writeMarker
```

### Pattern 3: Fail-closed detection mirroring `readMarker` (D-03)
**What:** Old layout = in-repo `agent-factory/` present AND `readMarker()` returns null (no `.grugops/install.json`), corroborated by repo-relative/symlink `.claude` adapters (no `grugops:materialized-kit` block). `readMarker` (install.ts:185-193) already returns `null` fail-closed for absent/garbled markers — reuse it.
**When to use:** the `--migrate` branch only.
**Example:**
```typescript
// Source: install.ts:185-193 (readMarker — reuse) + install.ts:231 (kitReal pattern)
// detectOldLayout: in-repo kit present AND no two-root marker.
//   const hasInRepoKit = existsSync(join(TARGET, "agent-factory", "roles", "orchestrator.md"));
//   const marker = readMarker(join(TARGET, ".grugops", "install.json"));  // null = not two-root
//   const orchAdapter = join(TARGET, ".claude", "agents", "grugops-orchestrator.md");
//   const adapterMaterialized = readAdapterKit(orchAdapter) !== "";        // install.ts:198-220
//   isOldLayout  = hasInRepoKit && marker === null && !adapterMaterialized;
//   isMigrated   = marker !== null;            // → D-12 if leftover agent-factory/ also present
//   isClean      = !hasInRepoKit && marker === null;   // → D-11 fall-through to fresh install
```

### Pattern 4: Timestamped, differs-only backup helper (D-08/D-09)
**What:** One helper used for the in-repo `agent-factory/`, the displaced kit, and the old config. Compute an ms-ISO stamp with `:` replaced; rename-aside only if the content differs from what will replace it.
**Example:**
```typescript
// ms-ISO, filesystem-safe (strip/replace ":"). new Date().toISOString() → e.g.
//   "2026-06-15T09:16:37.123Z"  →  "2026-06-15T09-16-37.123Z"
const isoStamp = (): string => new Date().toISOString().replace(/:/g, "-");
// backupIfDiffers(path, replacement): if path is byte-identical to replacement → skip (D-09,
//   true no-op); else renameSync(path, `${path}.bak.${isoStamp()}`) and report. Honor DRY_RUN.
//   For a directory, "differs" is a recursive content compare (or a cheap VERSION compare for the
//   kit). For the single config file, reuse sameContent() (install.ts:430-436).
```

### Anti-Patterns to Avoid
- **`writeFileSync` through a live symlink dest:** the #1 corruption risk this phase. `materializeAdapter` (install.ts:626) writes the dest; if the dest is a symlink into the source clone (v1.0 default — Old-Layout Forensics), it overwrites the source. **Always `rmSync`/unlink a symlink dest first.**
- **Forking a standalone migrate/update code path:** violates D-02 single-source; the two paths will drift. Wrap and parameterize instead.
- **Deleting backups on the default path:** violates never-delete-first + D-10. Deletion is `--prune-old-kit` only.
- **Asserting an exact backup filename in tests:** non-deterministic (timestamp). Assert count / glob (D-08).
- **Re-mutating on a nominal no-op (D-12 half-state):** never re-run install steps when the marker is already present; warn and exit 0.
- **Adding `version`-negotiation to `--update`:** SKEW-01 is deferred (D-07); downgrade is warn-then-proceed, never refuse.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic kit swap | A bespoke copy-then-replace for `--update` | Parameterized `copyKit()` (install.ts:558) | Already true-atomic (no absent-kit window); duplicating risks drift. |
| Marker read / already-migrated detection | A new JSON reader | `readMarker()` (install.ts:185) | Fail-closed for absent/garbled markers already. |
| Materialized-kit detection on an adapter | A new sentinel parser | `readAdapterKit()` (install.ts:198) | Already extracts the `KIT=` line from the sentinel block, fail-closed. |
| Byte-content compare (differs-only, D-09) | A new diff | `sameContent()` (install.ts:430) for files; the test harness's content-addressed `snapshot()` pattern for trees | Existing, tested helpers. |
| Bounded sentinel-strip (CR-01) | Re-implementing the strip in migrate | `materializeAdapter()` (install.ts:581-628) — already CR-01-bounded | Migrate reuses it verbatim; must not regress the bounded-removal behavior. |
| DRY_RUN / report plumbing | New logging | `report()` (install.ts:416) + the `DRY_RUN` short-circuit idiom | Every mutation already narrates a `would-*` line; new modes must follow. |

**Key insight:** The phase's value is **orchestration discipline**, not new file-system mechanism. Almost every primitive already exists and is tested; the risk is in wiring them safely (symlink unlink, differs-only, marker-gated no-op), not in inventing new ones.

## Runtime State Inventory

> This phase mutates the host file system (migrate relocates an in-repo layout; update swaps the central kit). It is a migration phase, so the inventory applies — but the "state" is **on a host user's machine at run time**, not in this repo.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None in this repo. At host run time, migrate relocates the host's in-repo `agent-factory/` (backed up, D-08) and moves the host's edited config (D-04). | Code: implement backup + move. No datastore involved. |
| Live service config | None. grugops ships no runtime/service; the central kit at `$GRUGOPS_HOME` is plain files. `--update` refreshes it in place. | None. |
| OS-registered state | None — no scheduled tasks, no daemons, no registered services. | None. |
| Secrets/env vars | The installer reads `GRUGOPS_HOME`, `GRUGOPS_SRC`, `TARGET`, `INSTALL_MODE`, `DRY_RUN` (install.ts:91-141). The new modes reuse the same vars; **no new env var**, and the deploy-approval var is NEVER set (hard constraint, install.ts:828). | None new — verified by reading the arg/env handling. |
| Build artifacts | The committed `install/install.js` (and `uninstall.js` if touched) are build outputs of the `.ts`; they go **stale** the moment the `.ts` changes and must be rebuilt with `tsc` and pass `npm run freshness` (scripts/freshness.ts) before commit. | `npm run build` (`tsc`) then `npm run freshness`; commit the regenerated `.js`. |

**Nothing found in categories Stored data (this repo) / Live service config / OS-registered state:** confirmed — grugops is a markdown+stdlib kit with no runtime, verified by reading CLAUDE.md constraints and the installer source.

## Old-Layout Forensics (the migrate "from" shape — VERIFIED from git history)

The D-03 detection signal is grounded in what v1.0 actually produced. Verified via `git show v1.0:…`:

- **Vendored kit in-repo:** v1.0 installed nothing to `$GRUGOPS_HOME`; the kit lived in-repo at `agent-factory/`. Config lived at `agent-factory/config/factory.config.json` (inside the vendored kit). `[VERIFIED: git ls-tree v1.0 → agent-factory/config/factory.config.json]`
- **Symlink-default adapters:** v1.0 `install.sh` set `INSTALL_MODE=${INSTALL_MODE:-symlink}` (line 40) and used `link_or_copy` (ln -sf, line 132) for `.claude/skills/*` and `.claude/agents/grugops-orchestrator.md`. `[VERIFIED: git show v1.0:install/install.sh:40,132,250,254]` → **this is the symlink landmine source.**
- **Repo-relative adapter references, no `KIT=` block:** v1.0 `.claude/skills/grugops/SKILL.md` and `.claude/agents/grugops-orchestrator.md` reference `agent-factory/roles/…`, `agent-factory/config/factory.config.json`, `agent-factory/workflows/` **repo-relative** — no `grugops:materialized-kit` block. `[VERIFIED: git show v1.0:.claude/skills/grugops/SKILL.md:12-16, v1.0:.claude/agents/grugops-orchestrator.md:7-10]`
- **No `.grugops/install.json` marker:** v1.0 wrote no two-root marker. `[VERIFIED: git show v1.0:install/install.sh` — no `install.json` marker write; "marker" there refers to tool-detection markers, lines 47/54/219]`

This confirms D-03 precisely: **in-repo `agent-factory/` present AND `readMarker()` == null AND `readAdapterKit()` == "" (no materialized block)** uniquely identifies the v1.0 old layout vs a clean repo (no agent-factory/) vs an already-migrated repo (marker present).

> **⚠️ FLAG FOR PLANNER (D-04 config-path discrepancy):** CONTEXT D-04 states the old user-edited config is "at repo-root `factory.config.json`". Git history shows v1.0 actually seeded the config at **`agent-factory/config/factory.config.json`** (inside the vendored kit), not at repo-root. There may also have been a later v1.0.x/transition shape with a root-level config. The planner/implementer should:
> 1. Handle BOTH plausible old config locations (`factory.config.json` at repo-root AND `agent-factory/config/factory.config.json`), or
> 2. Confirm with the user which old shape is the migrate target.
> The two-root target is unambiguous: `.grugops/factory.config.json` `[VERIFIED: install.ts:304, seed/.grugops/factory.config.json]`. This is the one place the locked decision text and the historical artifact disagree — do not silently pick one.

## Common Pitfalls

### Pitfall 1: `materializeAdapter` writes THROUGH a symlink and corrupts the source clone
**What goes wrong:** `materializeAdapter` does `writeFileSync(dest, out.join("\n"))` (install.ts:626). For a v1.0 install, `dest` (e.g. `.claude/agents/grugops-orchestrator.md`) is a **symlink into the source clone**. `writeFileSync` follows the link and overwrites the source file — corrupting the grugops checkout itself during a user's migrate.
**Why it happens:** `writeFileSync` follows symlinks by default; the old layout's symlink-default (`INSTALL_MODE=symlink`, v1.0) makes this the common case, not the edge case.
**How to avoid:** In the migrate pre-steps, before re-materializing, detect each adapter dest with `isSymlink()` (install.ts:422-428) and `rmSync(dest, {force:true})` / `unlinkSync(dest)` it first. Then `materializeAdapter` writes a fresh regular file. **A RED harness case must point an adapter symlink at a fixture "source clone" file and assert that file is byte-unchanged after migrate.**
**Warning signs:** A migrate test where the source-clone fixture file changes content; a real dogfood where the grugops repo's own adapter files mutate after running migrate elsewhere.

### Pitfall 2: Timestamped backups break idempotency unless gated differs-only
**What goes wrong:** With timestamped names, every re-run creates a NEW `agent-factory.bak.<ISO>` even when nothing changed → idempotency violation (SC1/SC3 "re-run is a no-op").
**Why it happens:** A fresh timestamp every run defeats skip-if-exists.
**How to avoid:** D-09 differs-only — back up only when the displaced content actually differs from its replacement; a true no-op produces zero new artifacts. Plus the marker-gated D-12 path means a second migrate doesn't reach the backup step at all (marker now present).
**Warning signs:** Backup count grows on repeated identical runs; the idempotency test (snapshot equality) fails on the second run.

### Pitfall 3: Stale committed `.js` (freshness gate) after editing `.ts`
**What goes wrong:** Editing `install.ts` without rebuilding leaves `install.js` stale; `npm run freshness` fails red (scripts/freshness.ts:112-119), and worse, the harness drives the **committed `.js`** (install.test.ts:49 — `INSTALL_JS = install.js`), so tests run against OLD behavior and may pass deceptively while the `.ts` is wrong.
**Why it happens:** The build is a manual `tsc` step; the harness intentionally tests the shipped artifact, not the source.
**How to avoid:** After every `.ts` edit: `npm run build` (tsc) → `npm run freshness` → `npx vitest run install`, in that order. The freshness gate rebuilds to a temp dir and byte-compares (verified green this session: "All build outputs fresh: 10 committed .js file(s)").
**Warning signs:** Tests green but behavior wrong; `STALE: install/install.js` in freshness output.

### Pitfall 4: Placing the `--update` branch on the wrong side of the self-checkout guard
**What goes wrong:** `--update` is kit-home-only (D-05) and has no `--target`; routing it through the self-checkout guard (which refuses when TARGET looks like the source, install.ts:378-389) could wrongly block or mis-handle it. Conversely, `--migrate` operates on a USER repo and MUST keep the guard.
**Why it happens:** The guard and doctor branch at specific points (doctor at install.ts:370 before the guard; guard at 378). The new branches must be placed deliberately.
**How to avoid:** Branch `--update` early — alongside / after the `--check` early-exit (install.ts:370), BEFORE the self-checkout guard, since update never touches a target. Keep `--migrate` AFTER the guard (it mutates a user repo). The CONTEXT code_context note flags exactly this.
**Warning signs:** `--update` refused with a `--allow-self` message; `--migrate` skipping the guard.

### Pitfall 5: Over-broad `--prune-old-kit` glob deletes user files
**What goes wrong:** A loose glob (e.g. `*.bak`) could match a user's own `something.bak`. Pruning is the one deletion path — it must match ONLY grugops-created backups.
**Why it happens:** Generic backup naming overlaps with common user backup conventions.
**How to avoid:** Use a grugops-specific, unambiguous backup suffix (e.g. `agent-factory.bak.<ISO>` and `factory.config.json.bak.<ISO>` / a `.grugops/`-namespaced backup), and prune only those exact name-shapes. Honor `isProtected()`-style guards (uninstall.ts:110-119) so prune never touches `plans/`, `.planning/`, etc. Honor DRY_RUN.
**Warning signs:** Prune removes a non-grugops `.bak`; prune touches a protected dir.

### Pitfall 6: Uninstall-after-migrate doesn't restore pre-migrate state (SC3)
**What goes wrong:** SC3 requires uninstall-after-migrate to restore the pre-migrate state. But `uninstall.ts` deliberately does NOT remove `agent-factory/`, `.grugops/factory.config.json`, or the shared kit (they're protected, uninstall.ts:110-119, 489-491). After migrate, the pre-migrate state lives in the timestamped backups — uninstall as written won't restore them.
**Why it happens:** Uninstall's contract is "remove only grugops-owned wiring + the marker"; it is not a migrate-rollback.
**How to avoid:** Decide the SC3 mechanism explicitly (see Open Questions Q1): EITHER (a) a documented manual restore path (rename the `.bak` back; the safest, smallest-blast-radius option, consistent with never-delete-first), OR (b) uninstall detects migrate backups and offers/performs a restore. The CONTEXT explicitly says "coordinate the backup naming/location so restore is possible (or document the restore path)." Whatever is chosen, the SC3 harness case must assert the resulting state matches the pre-migrate snapshot.
**Warning signs:** The SC3 test's post-uninstall snapshot ≠ the pre-migrate snapshot.

## Code Examples

Verified patterns from the existing installer (the phase's source of truth):

### Atomic swap with retain (the D-06 delta point)
```typescript
// Source: install/install.ts:570-573 (the three lines that change for --update)
if (existsSync(KIT_ROOT)) renameSync(KIT_ROOT, old);  // displaced kit set aside
renameSync(tmp, KIT_ROOT);                             // atomic swap (new kit live)
rmSync(old, { recursive: true, force: true });         // ← D-06: rename to timestamped .bak if differs
```

### Fail-closed marker read (reuse for already-migrated detection)
```typescript
// Source: install/install.ts:185-193
function readMarker(markerFile: string): InstallMarker | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(markerFile, "utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as InstallMarker;
  } catch {
    return null;
  }
}
```

### Symlink detection (reuse before the unlink fix)
```typescript
// Source: install/install.ts:422-428
const isSymlink = (p: string): boolean => {
  try { return lstatSync(p).isSymbolicLink(); }
  catch { return false; }
};
```

### Hermetic harness helpers (the patterns new RED cases follow)
```typescript
// Source: install/install.test.ts — makeFixture (66-77), snapshot (83-104),
//   runInstall (108-114), runUninstall (117-123), afterEach cleanup (59-64).
// New cases reuse these verbatim: build a fixture, drive the COMMITTED install.js via spawnSync
// with --migrate/--update/--prune-old-kit, snapshot BOTH roots, assert glob/count not filenames.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dual POSIX `install.sh` + Node `install.mjs` byte-parity pair | Single TS `install.ts` → committed `install.js` (Node 22+ host prereq) | Phase 15 / D-13 (2026-06-13) | MIGR-01/UPD-01/ROADMAP-SC1 "byte-parity sh/Node" wording is SUPERSEDED. Modes run as `node install/install.js --migrate\|--update`. |
| `.test.sh` shell harnesses | Vitest suite (`install.test.ts`) driving the committed `.js` | Phase 15 | RED-by-design cases land in `install.test.ts`; no `.test.sh`. |
| Symlink-default adapters (`INSTALL_MODE=symlink`, v1.0) | Copy-default (`INSTALL_MODE=copy`, D-05) | v1.1 (Phase 7-9) | Old symlink installs are exactly the migrate-from shape; the symlink landmine (Pitfall 1) exists because of the v1.0 default. |
| Vendored in-repo `agent-factory/` per repo | Two-root: read-only kit at `$GRUGOPS_HOME`, per-repo state in target | v1.1 (Phase 7-9) | The migrate target layout. |

**Deprecated/outdated:**
- `install.sh` / `install.mjs` / `*.test.sh`: deleted in Phase 15 (commit f9dab9f). Do not reference them as live; cite git history only.
- "byte-parity sh/Node" in MIGR-01 / UPD-01 / ROADMAP SC1 / shared-install.md: historical wording, superseded by D-13.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The old-layout `agent-factory/` to back up is the in-repo vendored kit at `TARGET/agent-factory/` (confirmed for v1.0). | Old-Layout Forensics / D-03 | LOW — verified from git v1.0. A non-v1.0 hand-rolled layout could differ, but D-03's signal (in-repo kit + no marker) is robust. |
| A2 | `--update` can branch before the self-checkout guard safely because it has no target and only touches `$GRUGOPS_HOME`. | Pitfall 4 | LOW — follows directly from D-05 (kit-home-only). Planner places the branch precisely. |
| A3 | The SC3 restore mechanism is a documented manual `.bak`-rename path (Option a), not an automated uninstall-restore. | Open Q1 / Pitfall 6 | MEDIUM — this is a design choice the planner/user must ratify; both options satisfy SC3 if the harness asserts the resulting state. |
| A4 | A "differs" check for a directory kit can use a cheap signal (VERSION compare) plus/or a recursive content compare. | Pattern 4 / D-09 | LOW — VERSION compare is the fast path; a full content compare is the safe path. Planner picks; either keeps no-op idempotent. |

**Note:** The D-04 config-path discrepancy is tracked above as an explicit FLAG FOR PLANNER (not an assumption) because the locked decision text and the historical artifact disagree — it needs a decision, not a guess.

## Open Questions

1. **SC3 restore mechanism — manual `.bak` rename vs automated uninstall-restore?**
   - What we know: `uninstall.ts` protects `agent-factory/` and `.grugops/factory.config.json` (won't delete them), so after migrate the pre-migrate state lives in the timestamped backups. CONTEXT says "coordinate naming/location so restore is possible (or document the restore path)."
   - What's unclear: whether SC3 is satisfied by a documented manual restore (rename `agent-factory.bak.<ISO>` → `agent-factory/`, restore the config `.bak`) or requires uninstall to perform the restore.
   - Recommendation: Default to the **documented manual restore path** (Option a) — smallest blast radius, consistent with never-delete-first and uninstall's "remove only what we added" contract. The SC3 harness asserts that after the documented restore, the snapshot equals the pre-migrate snapshot. Surface to the user during discuss if they want automated restore.

2. **D-04 old config location (see FLAG FOR PLANNER).**
   - What we know: two-root target is `.grugops/factory.config.json`; v1.0 used `agent-factory/config/factory.config.json`; CONTEXT D-04 names repo-root `factory.config.json`.
   - What's unclear: which old location is canonical for the migrate move.
   - Recommendation: Handle both plausible source locations, or confirm with the user. Do not silently pick one.

3. **"Differs" granularity for the kit (D-09).**
   - What we know: a true no-op must create zero backups; a VERSION compare is cheap, a full recursive content compare is exact.
   - What's unclear: whether VERSION alone is sufficient (a kit edit without a VERSION bump would be missed).
   - Recommendation: Use a recursive content compare (reuse the harness's content-addressed approach) for correctness; VERSION compare only as an optimization. Planner decides; lean exact.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running the installer + harness + freshness gate | ✓ | v24.12.0 (≥22 required) | — |
| `tsc` (TypeScript) | Building `.ts` → committed `.js` | ✓ | `~6.0.3` devDep | — |
| Vitest | The behavioral harness | ✓ | `~4.1.8` devDep | — |
| `git` | Old-layout forensics (research only; not a runtime dep) | ✓ | n/a | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. Baseline verified green this session (`npm run freshness` → "All build outputs fresh: 10 committed .js"; `npx vitest run install` → 21 passed, 1 skipped).

## Validation Architecture

> Nyquist validation is ENABLED for this phase (`workflow.nyquist_validation: true` `[VERIFIED: .planning/config.json]`). The plan-phase orchestrator generates VALIDATION.md from this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `~4.1.8` `[VERIFIED: package.json:17]` |
| Config file | `vitest.config.ts` (`defineConfig({ test: {} })`, globals:false → import test fns explicitly) `[VERIFIED]` |
| Quick run command | `npx vitest run install` |
| Full suite command | `npm test` (`vitest run`) |
| Build/freshness gate (must pass before commit) | `npm run build && npm run freshness` |

The harness drives the **committed `install.js` / `uninstall.js`** (not the `.ts`) via `spawnSync` into `mkdtempSync` fixtures, snapshots BOTH `$TARGET` and `$GRUGOPS_HOME` with the content-addressed `snapshot()` helper, and cleans up in `afterEach`. New cases reuse `makeFixture()`, `snapshot()`, `runInstall()`, `runUninstall()` and add `runInstall(target, home, "--migrate")` etc.

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | Harness pattern (file:line) | File Exists? |
|----------|----------|-----------|-------------------|------------------------------|--------------|
| SC1 / MIGR-01 | `--migrate` converts old in-repo layout → two-root (additive-then-relocate; old kit renamed to timestamped backup, not deleted) | integration | `npx vitest run install -t "migrate: converts old in-repo layout to two-root"` | new case; build old-layout fixture (vendored `agent-factory/` + repo-relative adapters, NO marker) like `makeFixture` (66-77); assert two-root marker now present + kit at `$GRUGOPS_HOME` + a `agent-factory.bak.*` glob in target | ❌ Wave 0 |
| SC1 | `--migrate` re-run is a no-op (zero new artifacts) | integration | `npx vitest run install -t "migrate: a second migrate is a no-op"` | snapshot-equality after two migrates (mirror idempotency case 138-158); assert backup count unchanged (glob, not filename, D-08) | ❌ Wave 0 |
| SC1 / D-11 | `--migrate` on a clean repo falls through to a fresh install | integration | `npx vitest run install -t "migrate: clean repo falls through to fresh install"` | run `--migrate` on a bare fixture; assert two-root install result == plain install result | ❌ Wave 0 |
| SC1 / D-12 | `--migrate` on an already-migrated repo with leftover `agent-factory/` is a no-op + warns | integration | `npx vitest run install -t "migrate: half-state no-op + warn"` | install first (marker present) + plant leftover `agent-factory/`; assert exit 0, stdout warns + hints `--prune-old-kit`, snapshot unchanged | ❌ Wave 0 |
| SC2 / UPD-01 | `--update` refreshes `$GRUGOPS_HOME` in place; per-repo state UNTOUCHED | integration | `npx vitest run install -t "update: refreshes kit, leaves per-repo state untouched"` | install; snapshot `$TARGET`; run `--update`; assert `$TARGET` snapshot unchanged, kit at home refreshed | ❌ Wave 0 |
| SC2 / D-06 | `--update` retains the displaced kit as a timestamped backup (reversible) | integration | `npx vitest run install -t "update: displaced kit retained as backup"` | change the source VERSION; `--update`; assert a `agent-factory.bak.*` glob exists under `$GRUGOPS_HOME` | ❌ Wave 0 |
| SC2 / D-07 | `--update` on a downgrade warns then proceeds | integration | `npx vitest run install -t "update: downgrade warns then proceeds"` | install a newer kit VERSION; run `--update` from an older source; assert exit 0 + stdout warns with version delta | ❌ Wave 0 |
| SC2 | doctor names the specific unresolved path on failure (ALREADY EXISTS — confirm not regressed) | integration | `npx vitest run install -t "doctor: a missing kit"` | EXISTING case install.test.ts:383-395 | ✅ exists |
| SC3 | A user-edited config survives migration (moved to `.grugops/`, original `.bak` retained, D-04) | integration | `npx vitest run install -t "migrate: user-edited config survives"` | plant an edited old config; `--migrate`; assert `.grugops/factory.config.json` has the edited content + a `.bak` exists (mirror never-overwrite case 254-261) | ❌ Wave 0 |
| SC3 | uninstall-after-migrate restores pre-migrate state | integration | `npx vitest run install -t "migrate: uninstall-after-migrate restores pre-migrate state"` | snapshot pre-migrate; migrate; uninstall (+ documented restore per Open Q1); assert snapshot == pre-migrate (mirror round-trip case 187-217) | ❌ Wave 0 |
| SC3 / CR-01 | bounded marker-strip — no unterminated-marker over-deletion | integration | `npx vitest run install -t "migrate: bounded marker-strip"` | plant an adapter with an UNTERMINATED `grugops:materialized-kit` open marker; migrate; assert no following lines lost (CR-01, mirrors the install.ts:594-625 / uninstall.ts:269-272 buffered-restore logic) | ❌ Wave 0 |
| Pitfall 1 (LANDMINE) | symlink adapter migrate does NOT corrupt the source clone | integration | `npx vitest run install -t "migrate: symlink adapter does not corrupt source clone"` | create a `.claude` adapter symlinked to a fixture "source" file; migrate; assert the source file is byte-unchanged (this is the RED-by-design proof the LANDMINE is fixed) | ❌ Wave 0 |
| D-10 | `--prune-old-kit` removes ONLY grugops backups; default never prunes | integration | `npx vitest run install -t "prune: removes only grugops backups, default preserves"` | create backups via migrate/update + plant a user `mine.bak`; run `--prune-old-kit`; assert grugops `.bak.*` gone, user file + protected dirs intact; assert default run never deletes | ❌ Wave 0 |
| Contract | `--migrate`/`--update`/`--prune-old-kit` honor DRY_RUN (mutate nothing) | integration | `npx vitest run install -t "DRY_RUN: new modes mutate nothing"` | mirror DRY_RUN case 162-182 for each new mode | ❌ Wave 0 |
| Contract | unknown-arg still exits 2 (regression guard for the new flags) | integration | `npx vitest run install -t "unknown-arg"` | EXISTING case 431-436 (confirm the 3 new flags are recognized, others still exit 2) | ✅ exists (extend) |

### Sampling Rate
- **Per task commit:** `npx vitest run install` (the install suite) + `npm run freshness` (the committed `.js` must be fresh — non-negotiable; the harness runs the `.js`).
- **Per wave merge:** `npm test` (full suite) + `npm run freshness`.
- **Phase gate:** Full suite green + freshness green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] No new test FILE needed — all new cases append to `install/install.test.ts` (covers SC1/SC2/SC3 + Pitfall 1 + D-10 + DRY_RUN). The harness helpers (`makeFixture`, `snapshot`, `runInstall`, `runUninstall`) already exist and are reused.
- [ ] An **old-layout fixture builder** is the one genuinely new test helper: a `makeOldLayoutFixture()` that produces a vendored in-repo `agent-factory/` + repo-relative (and a variant with symlink) `.claude` adapters + NO `.grugops/install.json` marker — the migrate-from shape. Add it beside `makeFixture` (install.test.ts:69).
- [ ] Framework install: none — Vitest is already a devDependency and the suite is green.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high` `[VERIFIED: .planning/config.json]`. This is a local file-system installer, not a network/auth surface, so most ASVS categories are N/A; the live concerns are input/path validation and safe file operations.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface — local CLI. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | partial | The `isProtected()` denylist (uninstall.ts:110-119) and the self-checkout guard (install.ts:378-389) gate which paths may be mutated; `--prune-old-kit` must honor these. |
| V5 Input Validation | yes | All paths resolved to absolute before use (`resolve`/`toPosix`, install.ts:103-141); unknown args exit 2; new flag values validated; backup globs scoped to grugops-specific name-shapes (Pitfall 5). |
| V6 Cryptography | no | No crypto in the installer (the harness uses sha256 only for content-addressed snapshots, not security). |

### Known Threat Patterns for a file-system installer

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Symlink-following write corrupts a file outside the intended dir (the source clone) | Tampering | Unlink symlink dests before `writeFileSync` (Pitfall 1) — the headline security/safety fix of this phase. |
| Over-broad delete (`--prune-old-kit`) removes user content | Tampering / DoS | Grugops-specific backup name-shapes + `isProtected()`-style guards + DRY_RUN (Pitfall 5). |
| Migrate/update mutating an unintended target | Tampering | Self-checkout guard for migrate (keeps it); `--update` is kit-home-only (no target); paths resolved absolute first. |
| Setting the prod deploy-approval env var | Elevation of Privilege | HARD CONSTRAINT — the installer NEVER sets it (install.ts:828); the new modes must not either. |
| Silent loss of user content on marker strip | Tampering | CR-01 bounded removal (already in `materializeAdapter`, install.ts:594-625) — must not regress; covered by a RED case. |

All security findings / warnings in clear professional voice (CLAUDE.md hard rule for the installer safety surface; caveman voice is forbidden in install report/warn/error strings).

## Project Constraints (from CLAUDE.md)

| Constraint | Bearing on this phase |
|------------|------------------------|
| Tech stack: Markdown everywhere EXCEPT the TS tooling layer | All code lands in `install/*.ts`; docs in `install/README.md` (markdown). No exception. |
| Committed `.js` compiled with `tsc`, freshness-checked, must not drift | Rebuild + `npm run freshness` after every `.ts` edit; the gate fails red on drift (verified). |
| Node 22+ hard install prerequisite | Modes run as `node install/install.js --…`; uses `import.meta.dirname` (22+). |
| Zero runtime deps on host; dev deps `{typescript, vitest, @types/node}` only | No new packages — Node stdlib only. |
| Installer is a safety surface → CLEAR PROFESSIONAL VOICE in all report/warn/error strings (NOT caveman) | Every new report/warning/error string clear voice (Claude's Discretion confirms this). |
| Additive · idempotent · DRY_RUN · reversible · never-overwrite/never-delete user content | The migrate/update contract; backups retained by default, deletion only via `--prune-old-kit`; differs-only keeps re-runs no-op. |
| Never set the prod deploy-approval env var | The new modes must not set it (none of them deploy). |
| Installers: idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content | Restates the same contract — the spine of SC1/SC2/SC3. |
| No fabrication; unknown commands `UNKNOWN - verify` | The README's plugin commands already carry `UNKNOWN - verify` (install.ts:824-825); new docs follow suit if any command is unverified. |
| GSD workflow enforcement (no direct edits outside a GSD command) | Implementation goes through `/gsd-execute-phase`. |

## Sources

### Primary (HIGH confidence)
- `install/install.ts` (full read) — `copyKit` (558-575), `materializeAdapter` (581-628, incl. CR-01 bounded removal 594-625), `seedState`/`seedFile`/`listSeedFiles` (631-678), `writeMarker`/`readMarker`/`InstallMarker` (174-193, 737-757), `detectTools` (542-550), arg-parse loop (66-87), `resolveGrugopsHome`/`KIT_ROOT`/`toPosix` (99-109), doctor (`--check`) (251-372), self-checkout guard (378-389), `report`/`DRY_RUN`/`sameContent`/`isSymlink`/`mkdirp`/`linkOrCopy` (416-488), `materializeRunnable`/`RUNNABLES` (700-732), run sequence (760-830), `readAdapterKit` (198-220).
- `install/uninstall.ts` (full read) — `isProtected` denylist (110-119), `removeSentinelBlock` CR-01 bounded restore (200-277), `removeMarker` (393-405), arg loop (60-72), preserved-paths contract (489-491).
- `install/install.test.ts` (full read) — `makeFixture` (66-77), `snapshot` (83-104), `runInstall`/`runUninstall` (108-123), `afterEach` (59-64), idempotency (138-158), DRY_RUN (162-182), round-trip (187-217), never-overwrite config (254-261), doctor matrix (371-413), unknown-arg (431-436), D-08 retired-parity skip (131-134), symlink AGENTS.md preservation (334-348).
- `scripts/freshness.ts` (full read) — rebuild-to-temp + byte-compare gate; `npm run freshness` verified green ("All build outputs fresh: 10 committed .js").
- `package.json`, `tsconfig.json`, `vitest.config.ts` — build/test/freshness scripts, Node ≥22 engines, dev deps, `tsc` targets (es2022, newLine lf, noEmitOnError).
- `docs/design/shared-install.md` — two-root design + "Open items → Migration for already-installed repos" (line 76) — this phase; tooling note confirms D-13 supersession.
- `.planning/phases/17-install-migrate-update/17-CONTEXT.md` — D-01..D-12, code_context LANDMINE, canonical refs.
- `.planning/REQUIREMENTS.md` (MIGR-01, UPD-01, Future SKEW/FIX/PLUGIN), `.planning/ROADMAP.md` (Phase 17 SC1-3), `.planning/config.json` (nyquist/security flags).
- `git show v1.0:install/install.sh` / `:.claude/skills/grugops/SKILL.md` / `:.claude/agents/grugops-orchestrator.md` / `git ls-tree v1.0` — old-layout forensics (symlink default, repo-relative refs, in-repo `agent-factory/config/factory.config.json`, no marker).

### Secondary (MEDIUM confidence)
- None — no web sources needed; all evidence is in-repo or in git history.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external packages; everything verified against package.json + a green build/test/freshness run.
- Architecture: HIGH — derived directly from the existing, fully-read installer source with file:line evidence.
- Pitfalls: HIGH — the symlink landmine, freshness-staleness, and idempotency-vs-timestamp pitfalls are all grounded in read code + git-verified old-layout shape.
- Old-layout forensics: HIGH — confirmed via `git show v1.0`.
- D-04 config path: MEDIUM — CONTEXT text and git history disagree on the old config location; flagged for the planner.
- SC3 restore mechanism: MEDIUM — a design choice (manual vs automated) the planner/user should ratify.

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (stable — in-repo TypeScript, no fast-moving external deps; revisit only if the installer source changes before planning).
