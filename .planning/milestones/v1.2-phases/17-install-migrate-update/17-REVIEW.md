---
phase: 17-install-migrate-update
reviewed: 2026-06-15T08:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - install/install.ts
  - install/install.test.ts
  - install/uninstall.ts
  - install/README.md
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-06-15T08:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the three new install modes — `--migrate` (MIGR-01), `--update` (UPD-01), and
`--prune-old-kit` (D-10) — plus the supporting `uninstall.ts` and `README.md`. Source reviewed
at `.ts` level (the committed `.js` is a verified-fresh `tsc` build; `npm run freshness`,
`npm run typecheck`, and `npx vitest run install` all pass: 37 pass / 1 intentional skip).

The hard-constraint surfaces the scope notes called out are, on the whole, **sound**:

- **Deletion safety (`--prune-old-kit`) is the single opt-in deletion path** and is correctly
  guarded. The backup-suffix regex `/\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/` is
  tight (a user `mine.bak` / `notes.bak` does not match — verified), and `removeBackup`
  re-checks `isPruneProtected` (defense-in-depth) before any `rmSync`. The live kit, seeded
  state, and user content are never matched or removed (verified end-to-end).
- **Symlink handling in `--migrate` (Pitfall 1)** is correctly fixed: `migratePreSteps` unlinks
  a live symlink adapter dest before re-materializing, so a write never follows the link into a
  source clone (proven by the dedicated test).
- **`--update` downgrade handling** (`isDowngrade`) is conservative and correct — warn-then-proceed
  only on a provable numeric downgrade; any unparseable/equal version yields no false downgrade.
- **Idempotency / no-op (`dirsSameContent`, D-09)** is fail-safe-to-differs (symlinks/errors bias
  toward keeping a backup).

No BLOCKERs found. The findings below are correctness/robustness/doc-accuracy WARNINGs and minor
INFO items. The most important is **WR-01**: the half-state recovery guidance (emitted by the code
*and* repeated in the README) points the user at `--prune-old-kit` to remove a leftover **live**
`agent-factory/`, but prune is — correctly — incapable of removing a live (non-`.bak.<ISO>`,
protected) directory, so the documented recovery is a no-op.

## Warnings

### WR-01: Half-state migrate guidance points at a command that cannot remove the leftover

**File:** `install/install.ts:1169-1175`, `install/README.md:162-166`
**Issue:** When a repo is already migrated (marker present) but still carries a leftover **live**
in-repo `agent-factory/`, the migrate branch prints:

```
This repo is already migrated to the two-root layout, but a leftover in-repo agent-factory/ remains.
Nothing was changed. To remove the leftover in-repo kit, run: node install/install.js --prune-old-kit
```

and README:166 repeats `node install/install.js --prune-old-kit   # remove a leftover in-repo agent-factory/ after migrate`.

But `leftoverKit` is `existsSync(join(TARGET, "agent-factory", "roles", "orchestrator.md"))` — a
**live** directory named `agent-factory/`, with no `.bak.<ISO>` suffix. `pruneOldKit()` only
deletes names matching `GRUGOPS_BACKUP_SUFFIX` (`<name>.bak.<ISO>`), AND `isPruneProtected` lists
`agent-factory` as protected. So the suggested command reports `no grugops backups found to prune
(nothing to do)` and leaves the live `agent-factory/` exactly in place. Reproduced end-to-end:
the leftover survives the suggested prune. The user has no documented way to clear it (the only
real fix — `rm -rf agent-factory/` — is what prune deliberately refuses, and rightly so). The test
`migrate: half-state no-op + warn` (install.test.ts:638) asserts the *hint is printed* but never
asserts the hint actually works, so it locks in the wrong behavior.

**Fix:** Make the guidance honest about what prune can and cannot do. Prune is correct to refuse a
live `agent-factory/`; the message should not promise prune removes it. Either:
```ts
console.log(
  "Nothing was changed. The leftover is a LIVE in-repo agent-factory/ — back it up and remove it",
);
console.log(
  "by hand once you have confirmed the shared kit at " + GRUGOPS_HOME + " is in use (prune only",
);
console.log("removes timestamped .bak.<ISO> backups, never a live kit).");
```
and align README:162-166 + README:233-253 to match. Do NOT make prune delete a live `agent-factory/`
(that would violate never-delete-user-content).

### WR-02: `--update` (and `--prune-old-kit`) prompt the wrong question interactively

**File:** `install/install.ts:152` (with branches at `:423`, `:441`)
**Issue:** `const TARGET = resolveTarget()` runs unconditionally at module top, **before** the
`--update` and `--prune-old-kit` branches. The README states `--update` "is kit-home-only … There
is no `--target` to pass." Yet on an interactive TTY without `--yes`, `resolveTarget()` blocks on
stdin and prints `Install grugops into which repo? [<cwd>]` even for `--update`, which never writes
to a target. The prompt text is wrong for both modes (neither is "installing into a repo"), and for
`--update` the answer is ignored for all kit-home work. Tests never catch this because every test
passes `--yes`.
**Fix:** Skip/short-circuit the prompt for the no-target modes, or move/condition `resolveTarget()`
so `--update` does not prompt at all and `--prune-old-kit` prompts with mode-appropriate text
(e.g. `Prune grugops backups in which repo? [<cwd>]`). Minimal: gate the prompt with
`if (!UPDATE && !PRUNE_OLD_KIT)`.

### WR-03: `copyKit` does not clear a stale `.old.<pid>` before renaming the kit aside

**File:** `install/install.ts:877-885`
**Issue:** `const old = ${KIT_ROOT}.old.${process.pid}` is used as the rename-aside target, but
unlike `tmp` (which is `rmSync`'d at line 879) `old` is **not** cleaned before
`renameSync(KIT_ROOT, old)` at line 885. If a prior `--update`/install with the same PID crashed
between line 885 and the cleanup at 892/897, a stale `agent-factory.old.<pid>` directory survives.
PID reuse is common on Linux/macOS, so the next run's `renameSync(KIT_ROOT, old)` can throw
`ENOTEMPTY`/`EEXIST`, failing the update. The atomicity comment ("never an absent kit") still holds,
but the operation aborts rather than self-healing.
**Fix:** Mirror the `tmp` cleanup — add `rmSync(old, { recursive: true, force: true });` immediately
before line 885 (`if (hadOld) renameSync(KIT_ROOT, old);`).

### WR-04: `materializeAdapter` drops the KIT slot if the source block is unterminated and contains the slot

**File:** `install/install.ts:919-950`
**Issue:** The CR-01 bounded-removal logic buffers an unterminated `MAT_OPEN` block and restores it
at EOF. But if the source adapter has an unterminated open block that *contains* the `MAT_SLOT`
line, the slot is consumed as buffered block content and never triggers KIT injection — the
materialized adapter ends up with **no `KIT="…"` line**, so `/grugops` cannot resolve the shared
kit on first run. Verified: an input of `MAT_OPEN\nMAT_SLOT\nTRAILING\n` produces output with no
`KIT=`. The committed source adapters are well-formed (slot only, no pre-existing block — verified),
so this is defensive only, but the comment claims "lose nothing," which is not true for the slot's
*function*.
**Fix:** Detect the missing-injection case and fail loud rather than silently shipping a
kit-less adapter, e.g. after the loop: `if (!out.some((l) => l.startsWith('KIT="')))` →
report a `verify`/error line naming the adapter so a corrupted source never yields a silently
unresolvable adapter.

### WR-05: DRY_RUN migrate config narration misrepresents the only-if-absent copy semantics

**File:** `install/install.ts:703-705`
**Issue:** Step 1 loops over both legacy config locations. Under a real run, the first existing
config is copied to `.grugops/factory.config.json` and the second is **skipped** (seeded already
present) yet still `.bak`-renamed. Under DRY_RUN the branch prints `would-move user config <legacy>
→ <seededConfig> (original left as .bak)` for **both** legacy configs (verified), implying both are
carried forward to the same destination — which the real run does not do. DRY_RUN's contract is to
"print the plan"; here the plan overstates what happens. It also omits a distinct `would-backup`
line that the real run emits for the original config. Low risk (no mutation), but a DRY_RUN plan
that does not match the real run undermines the preview's purpose on a safety surface.
**Fix:** In the DRY_RUN branch, reflect the only-if-absent semantics — narrate `would-move` only
for the first/absent case and `would-skip (seeded present) + would-backup` for the rest, matching
the real-run report lines.

## Info

### IN-01: README `--prune-old-kit` claim about `factory.config.json.bak` in "both roots" is imprecise

**File:** `install/README.md:245-248`
**Issue:** The README says prune removes "the `factory.config.json.bak.<ISO>` files migrate leaves"
"in both the target repo and the shared kit home." In practice a standalone repo-root
`factory.config.json.bak.<ISO>` only exists when the legacy config was at the repo root; the v1.0
in-repo config `.bak` lives nested inside `agent-factory.bak.<ISO>/config/` and is removed as part
of that directory, and the kit home never contains a `factory.config.json.bak`. The behavior is
correct; the prose over-generalizes.
**Fix:** Reword to "the repo-root `factory.config.json.bak.<ISO>` (when migrate created one) and the
`agent-factory.bak.<ISO>` directories in both roots."

### IN-02: `pruneOldKit` double-processes when `TARGET === GRUGOPS_HOME`

**File:** `install/install.ts:623-639`
**Issue:** The two roots `[TARGET, "target"]` and `[GRUGOPS_HOME, "kit home"]` are iterated
independently. If a user sets `GRUGOPS_HOME` equal to the target repo, each matching backup is
counted twice in `pruned` and (under DRY_RUN) listed twice. No data-safety impact (the real-run
second pass finds the entry already gone), purely cosmetic double-narration / inflated count.
**Fix:** De-duplicate the roots (e.g. `const roots = [...new Set([TARGET, GRUGOPS_HOME])]` mapped
back to labels) before the loop.

### IN-03: `pruned` counter increments even when `removeBackup` refuses or skips

**File:** `install/install.ts:635-642`
**Issue:** `pruned += 1` fires for every name matching the suffix, regardless of whether
`removeBackup` actually deleted it (a protected path is reported `skipped`, DRY_RUN reports
`would-remove`). So the "no grugops backups found to prune (nothing to do)" summary only reflects
*zero matches*, not *zero removals* — a match that was refused still suppresses the "nothing to do"
line. Cosmetic only.
**Fix:** Have `removeBackup` return a boolean and increment `pruned` only on an actual (or would-)
removal, so the summary reflects effective work.

---

_Reviewed: 2026-06-15T08:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
