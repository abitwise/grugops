---
phase: 17-install-migrate-update
verified: 2026-06-15T11:15:00Z
status: passed
score: 13/13 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 13/13
  gaps_closed:
    - "WR-01: Half-state migrate recovery hint now honest — tells user to remove live agent-factory/ by hand; explicitly states prune only removes .bak.<ISO> backups, never a live kit. README aligned. Test renamed and strengthened: asserts honest wording, asserts --prune-old-kit is NOT mentioned, and end-to-end proves the leftover survives a prune run."
    - "WR-02: resolveTarget() now gates the interactive prompt — --update returns the default silently (no prompt at all); --prune-old-kit asks its own mode-appropriate question ('Prune grugops backups in which repo?'); only the normal install path reaches the original 'Install grugops into which repo?' prompt."
  gaps_remaining: []
  regressions: []
gaps: []
---

# Phase 17: Install --migrate / --update Verification Report

**Phase Goal:** Ship the deferred install migrate/update story as an independent track — RED-harness-first, additive, reversible, never-delete-first modes to move an already-installed in-repo layout to the two-root layout (--migrate) and refresh the central kit in place (--update), plus a single opt-in deletion path (--prune-old-kit). Per D-13 supersession: there is no install.sh — modes are flags on the single TS installer (`node install/install.js --migrate|--update|--prune-old-kit`); the committed install/install.js must pass `npm run freshness`. SC3 restore is the DOCUMENTED manual `.bak` rename, not automated uninstall-restore logic.
**Verified:** 2026-06-15T11:15:00Z
**Status:** passed
**Re-verification:** Yes — after WR-01 and WR-02 fix (commit d9dfd07)

## Re-verification Focus: WR-01 and WR-02

### WR-01: Half-state migrate recovery hint (RESOLVED)

**Fix verified in `install/install.ts` lines 1181-1190:**

The `leftoverKit` branch no longer mentions `--prune-old-kit`. The four `console.log` calls now say:
- "...a leftover LIVE in-repo agent-factory/ remains."
- "Nothing was changed. Once you have confirmed the shared kit at ${GRUGOPS_HOME} is in use,"
- "back up and remove the leftover agent-factory/ by hand — prune only removes timestamped"
- ".bak.<ISO> backups, never a live kit, so it cannot clear this one."

**Fix verified in `install/install.test.ts` (renamed test `migrate: half-state no-op + honest leftover guidance`):**

The test now asserts:
- `r.stdout` contains "by hand" — honest recovery path
- `r.stdout` contains "never a live kit" — explicit clarification of prune scope
- `r.stdout` does NOT contain "--prune-old-kit" — the misleading hint is gone
- After running `--prune-old-kit`, `existsSync(join(target, "agent-factory", "roles", "orchestrator.md"))` is `true` — end-to-end proof the leftover survives prune exactly as the guidance claims

**Fix verified in `install/README.md` (lines 159-167):** README no longer shows `node install/install.js --prune-old-kit # remove a leftover in-repo agent-factory/ after migrate`. Replaced with prose stating the leftover must be removed by hand and that `--prune-old-kit` does not clear it (prune only removes timestamped `.bak.<ISO>` backups, never a live kit, by design).

**Fix verified in committed `install/install.js`:** Python string search confirms "by hand", "live kit", and "Prune grugops" all present in the compiled output. `npm run freshness` exits 0 — 10 committed `.js` files match a fresh tsc rebuild.

### WR-02: resolveTarget() prompt gating (RESOLVED)

**Fix verified in `install/install.ts` lines 147-156 (within `resolveTarget()`):**

Before the existing "Install grugops into which repo?" prompt, two early-return guards now run:
- `if (UPDATE) return toPosix(def);` — takes the default silently, no prompt
- `if (PRUNE_OLD_KIT) { process.stdout.write("Prune grugops backups in which repo? ..."); ... }` — mode-appropriate prompt, then return

The original "Install grugops into which repo?" prompt is only reached for the normal install path. The misleading prompt for no-target modes is eliminated.

**Behavioral verification:** 37 tests pass / 1 intentional skip after the fix. Tests were not changed to cover the interactive TTY path (tests always pass `--yes` which bypasses `isTTY` guards — this is the established pattern), but the code path is clearly gated at the source level.

### Regression check: 13/13 must-haves still hold

`npx vitest run install` after commit d9dfd07: **37 passed / 1 skipped**. No regression in any of the 21 supporting truths. `npm run freshness`: exit 0. `npm run typecheck`: clean (no output, exit 0).

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | D-13 honored: there is NO install.sh — the new modes are flags on the single TypeScript installer and run as `node install/install.js --migrate\|--update\|--prune-old-kit` | VERIFIED | `install/install.sh` does not exist. All 3 flags recognized in install.ts arg-parse loop (lines 88-93). |
| 2 | The 3 new flags --migrate, --update, --prune-old-kit are recognized by the arg-parse loop; an unknown arg still exits 2 | VERIFIED | `let MIGRATE/UPDATE/PRUNE_OLD_KIT` declared; exact string matches precede the `process.exit(2)` branch. Test `migrate: old-layout fixture is shaped correctly` + the unknown-arg test both pass. |
| 3 | backupIfDiffers() creates a timestamped backup ONLY when the displaced content differs (D-09 differs-only no-op guard); millisecond-ISO, filesystem-safe (no ':') | VERIFIED | `isoStamp()` uses `replace(/:/g, "-")`. `backupIfDiffers()` calls `dirsSameContent` before any rename; `sameContent` used for files. Both functions exist at exactly 1 occurrence each (comment-stripped). |
| 4 | copyKit() accepts a retainBackup flag that renames the displaced kit to a timestamped backup instead of deleting it — single-source, no forked path | VERIFIED | `function copyKit(retainBackup = false)`. Default path (install) calls `rmSync(old)`. `--update` path calls `copyKit(true)`, renames to `.bak.<ISO>` only when `!dirsSameContent(old, KIT_ROOT)`. |
| 5 | makeOldLayoutFixture() produces the v1.0 migrate-from shape: in-repo agent-factory/, repo-relative adapters, NO .grugops/install.json marker | VERIFIED | Function exists in install.test.ts (line 90). Test `migrate: old-layout fixture is shaped correctly` (line 540) passes. |
| 6 | DRY_RUN=1 short-circuits backupIfDiffers and copyKit(retainBackup) with would-* lines | VERIFIED | `if (DRY_RUN) { report("would-backup", ...); return true; }` in backupIfDiffers. `if (DRY_RUN) { report("would-copy", ...); return; }` in copyKit. Test `DRY_RUN: new modes mutate nothing` passes (1/38). |
| 7 | SC1: --migrate converts an old in-repo layout to two-root additive-then-relocate; the displaced agent-factory/ is renamed to a timestamped backup, never deleted | VERIFIED | `detectOldLayout()` + `migratePreSteps()` + migrate branch wired. `backupIfDiffers(join(TARGET,"agent-factory"),...)` renames aside. Test `migrate: converts old in-repo layout to two-root` passes (1/38). |
| 8 | SC1: a second --migrate is a true no-op (D-09/D-12) | VERIFIED | `isMigrated` branch exits 0 without re-running install. Test `migrate: a second migrate is a no-op` passes (1/38). |
| 9 | SC1/D-11: --migrate on a clean repo falls through to a normal fresh install | VERIFIED | `isClean` branch falls through to the install run. Test `migrate: clean repo falls through to fresh install` passes (1/38). |
| 10 | SC1/D-12: --migrate on an already-migrated repo with a leftover agent-factory/ warns + gives honest recovery guidance (WR-01 fixed) | VERIFIED | Code warns "by hand", names prune limitation. Test `migrate: half-state no-op + honest leftover guidance` asserts honest wording, asserts no `--prune-old-kit` mention, proves leftover survives prune. Passes (1/38). |
| 11 | SC3/D-04: a user-edited config survives migration — moved to .grugops/factory.config.json; BOTH legacy locations checked | VERIFIED | `migratePreSteps()` loops over both `factory.config.json` (repo-root) and `agent-factory/config/factory.config.json` (v1.0 in-repo). Tests `migrate: user-edited config survives` pass for both locations. |
| 12 | SC3: uninstall-after-migrate + the DOCUMENTED manual .bak rename restores pre-migrate state | VERIFIED | Test `migrate: uninstall-after-migrate restores pre-migrate state` passes (1/38). README documents exact manual steps. uninstall.ts unchanged except clear-voice comment. |
| 13 | SC3/CR-01: bounded marker-strip — an unterminated open marker loses no following lines | VERIFIED | `materializeAdapter` CR-01 implementation confirmed (lines 919-950): unterminated block restores buffered lines at EOF. Test `migrate: bounded marker-strip` passes (1/38). |
| 14 | LANDMINE (Pitfall 1): a symlink .claude adapter migrate does NOT write through the symlink and corrupt the source clone | VERIFIED | `migratePreSteps()` step 3 calls `rmSync(dest, {force:true})` for any `isSymlink(dest)` before re-materializing. Test `migrate: symlink adapter does not corrupt source clone` passes (1/38). |
| 15 | SC2/UPD-01: --update refreshes the central $GRUGOPS_HOME kit in place (two-stage, reversible) and leaves per-repo state UNTOUCHED (D-05) | VERIFIED | `--update` branch fires EARLY (before self-checkout guard), calls only `updateKitHome()` → `copyKit(true)`. No seedState, no materializeAdapter, no marker write. Test `update: refreshes kit, leaves per-repo state untouched` passes (4/38). |
| 16 | SC2/D-06: --update retains the displaced kit as a timestamped backup (copyKit(retainBackup=true)) | VERIFIED | `copyKit(true)` renames displaced kit to `${KIT_ROOT}.bak.<ISO>` when it differs. Test `update: displaced kit retained as backup` passes (4/38). |
| 17 | SC2/D-07: --update on a downgrade warns in clear voice with the version delta, then proceeds | VERIFIED | `isDowngrade()` + `updateKitHome()` implements warn-then-proceed. `readKitVersion()` reads both installed and source versions. Test `update: downgrade warns then proceeds` passes (4/38). |
| 18 | SC2: the doctor still names the specific unresolved path on failure (not regressed) | VERIFIED | Test `doctor: a missing kit` passes (1/38). |
| 19 | D-10: --prune-old-kit removes ONLY grugops-created .bak backups in both roots; the default path never prunes | VERIFIED | `GRUGOPS_BACKUP_SUFFIX = /\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/` anchored. `isPruneProtected()` guards. Test `prune: removes only grugops backups, default preserves` passes (2/38). `mine.bak` confirmed non-matching. |
| 20 | Contract: --update / --prune-old-kit honor DRY_RUN=1 | VERIFIED | DRY_RUN arms present in the shared `DRY_RUN: new modes mutate nothing` test case, which passes. |
| 21 | --update branches EARLY (kit-home-only) BEFORE the self-checkout guard; --prune-old-kit honors isProtected()-style guards | VERIFIED | `if (UPDATE)` at line 423, `if (PRUNE_OLD_KIT)` at line 441, both before `if (!ALLOW_SELF)` self-checkout guard at line 456. `isPruneProtected()` mirrors uninstall.ts denylist. |

**Score:** 13/13 primary truths verified (21 supporting truths all pass). 37 test cases pass, 1 intentional skip (D-08 retired parity check).

### Deferred Items

None. All phase success criteria are addressed within this phase.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/install.ts` | isoStamp(), backupIfDiffers(), copyKit(retainBackup), 3 new arg-parse cases, detectOldLayout(), migratePreSteps(), updateKitHome(), pruneOldKit() | VERIFIED | All 12 required functions/constants present. WR-01 fix: half-state branch reworded. WR-02 fix: resolveTarget() gated. |
| `install/install.js` | Committed compiled output; must pass freshness gate | VERIFIED | `npm run freshness` exits 0: "All build outputs fresh: 10 committed .js file(s) match a fresh tsc rebuild." Fix strings ("by hand", "live kit", "Prune grugops") confirmed present in compiled output. |
| `install/install.test.ts` | makeOldLayoutFixture() + all migrate/update/prune test cases | VERIFIED | makeOldLayoutFixture() at line 90. Half-state test renamed and strengthened with 3 new assertions + end-to-end prune proof. 37 pass / 1 skip. |
| `install/README.md` | --migrate, --update, --prune-old-kit sections with .bak restore steps; honest half-state guidance | VERIFIED | WR-01 fix: README:159-167 no longer references `--prune-old-kit` as the half-state recovery. Replaced with "remove by hand" prose + explicit prune scope explanation. |
| `install/uninstall.ts` | Minimal change only (comment + rebuild) | VERIFIED | Only clear-voice comment added near removeMarker() (lines 394-401). No new flag, no rollback logic. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| install/install.test.ts | install/install.js | spawnSync drives the committed .js (not the .ts) | VERIFIED | runInstall() uses `spawnSync("node", [INSTALL_JS, "--yes", ...args])` where INSTALL_JS = `join(import.meta.dirname, "install.js")`. |
| install/install.ts (copyKit retainBackup) | install/install.ts (dirsSameContent / isoStamp) | retain path calls shared backup logic | VERIFIED | `copyKit(retainBackup=true)` → `!dirsSameContent(old, KIT_ROOT)` → `renameSync(old, ${KIT_ROOT}.bak.${isoStamp()})`. Single-source. |
| install/install.ts (--migrate branch) | install/install.ts (copyKit→materializeAdapter→seedState→writeMarker) | migrate reuses unchanged install run after pre-steps (D-02) | VERIFIED | `if (MIGRATE)` block at line 1177 calls `migratePreSteps()` for old layout then falls through to the existing `// --- run ---` block. No forked install sequence. |
| install/install.ts (migrate pre-steps) | symlink adapter dest | rmSync/unlink before materializeAdapter | VERIFIED | `migratePreSteps()` step 3 (lines 728-741): `if (!isSymlink(dest)) continue; ... rmSync(dest, { force: true })`. |
| install/install.ts (--update branch) | install/install.ts (copyKit(retainBackup=true)) | update is copyKit with retain flag | VERIFIED | `updateKitHome()` calls `copyKit(true)`. `copyKit` calls are: `copyKit(retainBackup = false)` (signature), `copyKit(true)` (--update), `copyKit(true)` (updateKitHome internal), `copyKit(false)` (default install site). |
| install/install.ts (--prune-old-kit branch) | grugops-specific .bak.<ISO> name-shapes under both roots | GRUGOPS_BACKUP_SUFFIX anchored matcher | VERIFIED | `GRUGOPS_BACKUP_SUFFIX` regex anchored at end-of-string to `.bak.YYYY-MM-DDTHH-MM-SS.mmmZ`. Prune iterates `[TARGET, GRUGOPS_HOME]` and only removes matching names. |
| install/install.ts (resolveTarget) | --update / --prune-old-kit no-target modes | Early-return guards gate the install prompt (WR-02) | VERIFIED | Lines 151-156: `if (UPDATE) return toPosix(def)` (silent default); `if (PRUNE_OLD_KIT) { stdout.write("Prune grugops backups in which repo?...") }`. Generic install prompt only reached for normal install path. |

### Data-Flow Trace (Level 4)

Not applicable. This phase produces installer tooling (CLI scripts + tests), not components that render dynamic data. No UI, no API routes, no state/props rendering path.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 37 install test cases pass (post-fix) | `npx vitest run install` | 37 passed / 1 skipped | PASS |
| Freshness gate (post-fix) | `npm run freshness` | exit 0 — 10 committed .js match fresh tsc rebuild | PASS |
| TypeScript typecheck (post-fix) | `npm run typecheck` (tsc --noEmit) | Clean (no output, exit 0) | PASS |
| WR-01 fix: half-state honest guidance test | `npx vitest run install -t "half-state"` | 1 passed / 37 skipped | PASS |
| migrate cases (10, post-fix) | `npx vitest run install -t "migrate"` | All pass | PASS |
| update cases (4) | `npx vitest run install -t "update"` | 4 passed / 34 skipped | PASS |
| prune cases (2) | `npx vitest run install -t "prune"` | 2 passed / 36 skipped | PASS |
| DRY_RUN new modes | `npx vitest run install -t "DRY_RUN: new modes mutate nothing"` | 1 passed / 37 skipped | PASS |
| doctor not regressed | `npx vitest run install -t "doctor: a missing kit"` | 1 passed / 37 skipped | PASS |

### Probe Execution

No conventional probe scripts (`scripts/*/tests/probe-*.sh`) found or declared for this phase. The Vitest suite is the primary behavioral gate. Step 7c: SKIPPED (no probe scripts declared).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MIGR-01 | 17-01, 17-02 | `install.sh --migrate` (D-13 superseded: `node install/install.js --migrate`) converts old in-repo layout to split two-root, additive-then-relocate, never delete-first, re-run is no-op | SATISFIED | --migrate branch fully wired: detectOldLayout() + migratePreSteps() + fall-through to install run. 10 migrate test cases pass. Per D-13, `install.sh` is superseded by `node install/install.js`; the REQUIREMENTS.md text references the old form, but the phase goal explicitly documents this D-13 supersession. |
| UPD-01 | 17-01, 17-03 | `install.sh --update` (D-13 superseded: `node install/install.js --update`) refreshes central $GRUGOPS_HOME kit in place, two-stage/reversible; doctor names unresolved path | SATISFIED | --update branch wired early: updateKitHome() → copyKit(true). Doctor not regressed (test passes). 4 update test cases pass. |

Both requirements marked Complete in REQUIREMENTS.md traceability table (Phase 17).

### Anti-Patterns Found

No blockers. Post-fix anti-pattern scan: the two warnings that drove the `human_needed` status (WR-01, WR-02) are now resolved in source and tests. The remaining review items (WR-03, WR-04, WR-05, IN-01, IN-02, IN-03) were not fixed by this commit — they remain as known robustness/cosmetic items documented in 17-REVIEW.md. None contain `TBD`/`FIXME`/`XXX` debt markers; none block the phase goal.

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `install/install.ts` (WR-01) | Half-state recovery hint — FIXED in commit d9dfd07 | RESOLVED | Honest guidance now in source, README, and test. |
| `install/install.ts` (WR-02) | resolveTarget() prompt gating — FIXED in commit d9dfd07 | RESOLVED | `--update` takes default silently; `--prune-old-kit` uses mode-appropriate prompt. |
| `install/install.ts:877-885` | WR-03: `copyKit` does not clear a stale `.old.<pid>` before rename-aside | WARNING (known) | Potential ENOTEMPTY on PID reuse. Not fixed in this commit; documented in 17-REVIEW.md. |
| `install/install.ts:919-950` | WR-04: `materializeAdapter` drops KIT slot if unterminated source block contains the slot | WARNING (known) | Defensive gap only; committed adapters are well-formed. Not fixed in this commit. |
| `install/install.ts:703-705` | WR-05: DRY_RUN migrate config narration misrepresents only-if-absent semantics | WARNING (known) | DRY_RUN preview overstates what happens. Not fixed in this commit. |

### Human Verification Required

None. WR-01 and WR-02 are resolved in code, tests, and docs. No outstanding items require human judgment.

### Gaps Summary

No gaps. The fix commit (d9dfd07) resolved both items that blocked promotion from `human_needed` to `passed`:

- WR-01: The half-state migrate hint is now honest — it tells the user to remove the leftover by hand and explicitly states prune only removes `.bak.<ISO>` backups, never a live kit. The test is renamed, strengthened with three new assertions, and includes an end-to-end proof that `--prune-old-kit` does not remove the live leftover.
- WR-02: `resolveTarget()` now gates the interactive prompt so `--update` takes the default silently and `--prune-old-kit` shows its own mode-appropriate question; the generic "Install grugops into which repo?" prompt only fires for the normal install path.

All 13 primary must-haves remain VERIFIED. 37 test cases pass / 1 intentional skip. Freshness gate passes. TypeScript typecheck clean.

---

_Verified: 2026-06-15T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after WR-01/WR-02 fix (commit d9dfd07)_
