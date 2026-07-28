---
phase: 17-install-migrate-update
plan: 03
subsystem: install-tooling
tags: [installer, update, prune, typescript, backup, deletion-path, tdd, tdz, wave-2]
requires:
  - install/install.ts (single TypeScript installer + the run sequence, Phase 15)
  - "copyKit(retainBackup) / isoStamp() / dirsSameContent() / backupIfDiffers() (Plan 17-01 Wave-0 primitives)"
  - "detectOldLayout() / migratePreSteps() (Plan 17-02 --migrate orchestration — used by the prune test fixture)"
  - "UPDATE / PRUNE_OLD_KIT flag vars (recognized in Plan 17-01)"
provides:
  - "--update (UPD-01): kit-home-only refresh via copyKit(retainBackup=true) — leaves per-repo state untouched (D-05)"
  - "updateKitHome() + readKitVersion() + isDowngrade(): the refresh + downgrade warn-then-proceed (D-07)"
  - "--prune-old-kit (D-10): the SINGLE opt-in deletion path — removes ONLY grugops .bak.<ISO> backups in both roots"
  - "pruneOldKit() + isPruneProtected() + removeBackup() + GRUGOPS_BACKUP_SUFFIX (anchored matcher, Pitfall 5)"
  - "README --update + --prune-old-kit user docs"
affects:
  - install/install.ts
  - install/install.js
  - install/install.test.ts
  - install/README.md
tech-stack:
  added: []
  patterns:
    - "RED-then-GREEN TDD: failing --update + --prune-old-kit cases land before the branches/helpers"
    - "kit-home-only modes branch EARLY (after the doctor early-exit, BEFORE the self-checkout guard) since they have no target (Pitfall 4 / A2)"
    - "--update is single-source: it IS copyKit(retainBackup=true) — no forked refresh path (D-02 spirit)"
    - "never-delete-first: --prune-old-kit is the only deletion surface; the default path never prunes (D-10)"
    - "anchored backup-name matcher (.bak.<ISO>) + isProtected()-style guard — never a loose *.bak (Pitfall 5)"
    - "const-helper relocation above the doctor to keep early branches out of the temporal dead zone (mirrors the MAT_* relocation)"
key-files:
  created:
    - .planning/phases/17-install-migrate-update/17-03-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/README.md
decisions:
  - "D-05 honored: --update is kit-home-only — it branches BEFORE the self-checkout guard, calls only updateKitHome() (no seedState / no materializeAdapter / no marker / no target write); the refreshes-kit-leaves-repo-untouched case snapshots the target and asserts byte equality"
  - "D-06/D-09 honored: --update is copyKit(retainBackup=true) — the displaced kit is retained as a timestamped agent-factory.bak.<ISO> when it DIFFERS, and is a true no-op when identical; a second --update with an unchanged source creates no new backup"
  - "D-07 honored: a downgrade (source VERSION numerically older than the installed kit) warns naming BOTH versions then PROCEEDS — no refusal/negotiation; isDowngrade() is conservative (only a proven dotted-numeric downgrade warns; any unparseable/equal version does not, SKEW-01 deferred)"
  - "D-10 honored: --prune-old-kit is the single opt-in deletion path — GRUGOPS_BACKUP_SUFFIX is anchored to the exact .bak.<ISO> shape (a user mine.bak never matches), every removal is gated by isPruneProtected() (mirrors uninstall.ts:110-119), and the default install path never prunes"
  - "TDZ class fixed (Rule 3): the early --update / --prune-old-kit branches run BEFORE several const-arrow helpers were initialized — report/mkdirp/sameContent/isoStamp/GRUGOPS_BACKUP_SUFFIX were relocated above the doctor (mirroring the existing MAT_* relocation) so the early branches reach copyKit→dirsSameContent→sameContent and pruneOldKit→GRUGOPS_BACKUP_SUFFIX without throwing a ReferenceError"
metrics:
  duration: 14m
  completed: 2026-06-15
  tasks: 2
  files: 4
---

# Phase 17 Plan 03: Install `--update` (UPD-01) + `--prune-old-kit` (D-10) Summary

`--update` refreshes the central `$GRUGOPS_HOME` kit in place as `copyKit(retainBackup=true)` — a
kit-home-only refresh (D-05) that leaves every repo's per-repo state untouched, retains the displaced
kit as a timestamped backup when it differs (D-06) and is a true no-op when identical (D-09), and
warns-then-proceeds on a downgrade naming both versions (D-07). `--prune-old-kit` is the single,
opt-in deletion path (D-10): it removes ONLY grugops-created `.bak.<ISO>` backups in both roots
behind an anchored name-shape matcher and an `isProtected()`-style guard, and never runs on the
default install path. Both modes branch EARLY (after the doctor early-exit, before the self-checkout
guard) since they have no target, honor `DRY_RUN`, and the committed `install.js` is freshness-green.

## What Was Built

**Task 1 — `--update` (D-05/D-06/D-07) (RED → GREEN):**

- **`updateKitHome()`** — the kit-home-only refresh: reads the installed kit VERSION
  (`${KIT_ROOT}/VERSION`) and the running-source VERSION (`${GRUGOPS_SRC}/agent-factory/VERSION`) via
  a shared `readKitVersion()` (head -n 1, fail-closed). On a **proven** downgrade (`isDowngrade()`
  returns true only when both parse as dotted-numeric triples and the source is strictly older) it
  `report`s a clear-voice warning naming **both** versions, then proceeds. It then calls
  `copyKit(true)` (the Plan-01 retain path) — single-source, no forked refresh. It does NOTHING else:
  no target write, no seed, no adapter, no marker (D-05 kit-home-only).
- **The `--update` branch** — wired EARLY, right after the doctor early-exit and **before** the D-07
  self-checkout guard, because `--update` has no target and only writes under `$GRUGOPS_HOME`
  (Pitfall 4 / A2). It prints a `== grugops update ==` banner, calls `updateKitHome()`, prints a
  `--check` hint, and `process.exit(0)` — it never reaches the install run, the guard, or any target
  mutation.
- **3 update cases + the DRY_RUN-update arm** in `install.test.ts`, titles matched to the validation
  map: `update: refreshes kit, leaves per-repo state untouched` (snapshots the target before/after),
  `update: displaced kit retained as backup` (induces a differing installed kit, asserts the
  `agent-factory.bak.*` glob + a no-op second update), `update: downgrade warns then proceeds`
  (newer installed VERSION, exit 0 + both-version warning), and a `--update` arm in the shared
  `DRY_RUN: new modes mutate nothing` case (both roots byte-unchanged, no backup created).

**Task 2 — `--prune-old-kit` (D-10) + README (RED → GREEN):**

- **`pruneOldKit()` + `isPruneProtected()` + `removeBackup()` + `GRUGOPS_BACKUP_SUFFIX`** — the only
  deletion path. `GRUGOPS_BACKUP_SUFFIX` is a tight regex anchored to the exact grugops shape
  (`.bak.` + an isoStamp ISO timestamp, end-anchored) — NOT a loose `*.bak`, so a user `mine.bak`
  never matches (Pitfall 5 / T-17-03-PRUNE). `pruneOldKit()` globs BOTH roots (`$TARGET` and
  `$GRUGOPS_HOME`) for that shape and routes each match through `removeBackup()`, which re-checks
  `isPruneProtected()` (mirrors `uninstall.ts:110-119`) before any `rmSync` and honors `DRY_RUN`
  (`would-remove`). Pruning is reachable ONLY inside the `--prune-old-kit` branch (early, alongside
  `--update`); the default install path never prunes (never-delete-first, T-17-03-DEFDEL).
- **The prune case + the DRY_RUN-prune arm** — `prune: removes only grugops backups, default
  preserves`: builds an old-layout target, `--migrate` (creates the grugops backups), plants a user
  `mine.bak` + a home-root grugops backup, asserts a default (non-prune) install deletes nothing,
  then `--prune-old-kit` removes the grugops `.bak.<ISO>` in both roots while `mine.bak`,
  `.grugops/factory.config.json`, `plans/board.md`, and the live kit all survive. The shared
  `DRY_RUN: new modes mutate nothing` case gained a `--prune-old-kit` arm (both roots unchanged).
- **README** — two new sections: `### Updating the shared kit (--update)` (kit-home-only refresh,
  retain-backup reversibility, downgrade warn-then-proceed) and `### Pruning old backups
  (--prune-old-kit)` (the single opt-in deletion of only the anchored grugops `.bak.<ISO>` shape,
  never default, never the live kit or protected dirs). Clear professional voice; all commands local
  `node`/`mv`/`rm` — nothing marked `UNKNOWN - verify` (none needed).

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | OK (clean tsc compile) |
| `npm run freshness` | exit 0 — 10 committed .js match a fresh tsc rebuild |
| `npm run typecheck` (`tsc --noEmit`) | OK (clean) |
| `npx vitest run install -t "update"` | 4 passed / 34 skipped (the 3 update cases + the in-case no-op assertion) |
| `npx vitest run install -t "prune"` | 2 passed / 36 skipped (the prune case + a glob-helper match) |
| `npx vitest run install -t "doctor: a missing kit"` | 1 passed (SC2 doctor NOT regressed) |
| `npx vitest run install -t "DRY_RUN: new modes mutate nothing"` | 1 passed (migrate + update + prune arms) |
| `npx vitest run install` | 37 passed / 1 skipped (the intentional D-08 retired-parity skip) |
| `npx vitest run` (full project) | 128 passed / 1 skipped |
| `function pruneOldKit` in install.ts (comment-stripped) + install.js | both true |
| `PRUNE_OLD_KIT` in install.ts + install.js | both true |
| `copyKit(true)` call count in install.ts (comment-stripped) | 1 (update uses the retain path) |
| README contains `--update` AND `--prune-old-kit` sections | both true |

Note: per the Plan-01/02 note, the shell `grep` tool returns spurious empty output against
`install.ts` / `install.js` in this environment; all grep-style acceptance checks were verified with
Node `readFileSync` + regex (authoritative), and the behavioral assertions are proven by the Vitest
cases driving the committed `.js`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] const-helper temporal-dead-zone in the EARLY kit-home-only branches**
- **Found during:** Task 1 (running the GREEN `--update` downgrade case) and again in Task 2 (the
  prune smoke test).
- **Issue:** The `--update` and `--prune-old-kit` branches were wired EARLY — by design, before the
  install run and the self-checkout guard, because they have no target (D-05 / Pitfall 4). But
  several helpers they reach transitively were `const` arrow functions / `const` regexes declared
  LATER in the file, so they were in the temporal dead zone at the moment the early branch executed.
  Concretely: `updateKitHome → copyKit → dirsSameContent → sameContent` threw
  `ReferenceError: Cannot access 'sameContent' before initialization`; `copyKit` also reached
  `mkdirp`/`report`; and `pruneOldKit → GRUGOPS_BACKUP_SUFFIX` threw the same. The
  `sameContent` TDZ was especially subtle: `dirsSameContent` CATCHES the throw and returns `false`
  (fail-safe-to-differs), which silently broke the D-09 differs-only no-op — every `--update` forced
  a backup instead of being a no-op on an unchanged kit. Surfaced by the `displaced kit retained as
  backup` case's "second update is a no-op → no new backup" assertion.
- **Fix:** Relocated the five early-needed const helpers — `report`, `mkdirp`, `sameContent`,
  `isoStamp`, and `GRUGOPS_BACKUP_SUFFIX` — into one block above the doctor (the exact pattern the
  file already uses for the `MAT_*` sentinels, which were relocated above the doctor for the same
  TDZ reason). No behavior changed; the helpers are identical, only their declaration position moved
  so the early branches can reach them without a ReferenceError. A comment documents why.
- **Files modified:** install/install.ts (rebuilt install.js)
- **Commits:** d0dd866 (Task 1: report/mkdirp/sameContent/isoStamp), 85d53f9 (Task 2:
  GRUGOPS_BACKUP_SUFFIX)
- **Note:** No production-behavior contract changed — the relocation is a pure ordering fix. The
  observable bug it fixed (every `--update` forcing a backup) is now proven absent by the no-op
  second-update assertion.

## Known Stubs

None. `--update` and `--prune-old-kit` are fully wired (early branches + helpers), the downgrade
warn-then-proceed and the differs-only no-op are proven by RED-by-design cases, and the prune deletion
is the single opt-in surface guarded by the anchored matcher + `isProtected()`-style check. No
placeholder/TODO/empty-default patterns flow to behavior. UPD-01 and D-05/D-06/D-07/D-09/D-10 are all
implemented and asserted.

## Threat Flags

None. The plan's `<threat_model>` enumerated the update/prune surface (over-broad prune glob,
default-path deletion, irreversible refresh, --update touching per-repo state, the deploy-approval
EoP var, package installs); every `mitigate` disposition is implemented and proven by a RED-by-design
case:
- **T-17-03-PRUNE** — anchored `GRUGOPS_BACKUP_SUFFIX` (not `*.bak`) + `isPruneProtected()` guard;
  the prune case asserts a user `mine.bak` + protected dirs survive.
- **T-17-03-DEFDEL** — pruning is reachable only inside the `--prune-old-kit` branch; the prune case
  asserts a default install deletes no backup.
- **T-17-03-UPDREV** — `copyKit(retainBackup=true)` retains the displaced kit when it differs; the
  retained-as-backup case proves the backup exists.
- **T-17-03-UPDTGT** — `--update` branches before the install run + guard and writes only under
  `$GRUGOPS_HOME`; the refreshes-kit-leaves-repo-untouched case snapshots the target and asserts
  equality.
- **T-17-03-EOP** — neither mode touches any deploy path or the deploy-approval env var.
- **T-17-03-SC** — zero external package installs this phase (no legitimacy checkpoint needed).

No NEW security-relevant surface beyond the register was introduced (both modes only move/remove
files on the user's own machine in known roots).

## TDD Gate Compliance

Gate sequence satisfied (RED before GREEN for each task):
- RED: `test(17-03)` — 74e3387 (failing --update cases + update/prune DRY_RUN arms),
  e675dba (failing --prune-old-kit case)
- GREEN: `feat(17-03)` — d0dd866 (Task 1: --update + the TDZ relocation),
  85d53f9 (Task 2: --prune-old-kit + README + the GRUGOPS_BACKUP_SUFFIX relocation)
No REFACTOR commit was needed (the GREEN implementations were minimal and clean; the TDZ relocation
was folded into the GREEN commits as a Rule-3 blocking-issue fix, not a separate refactor).

## Self-Check: PASSED

- Files: install/install.ts, install/install.js, install/install.test.ts, install/README.md,
  17-03-SUMMARY.md — all FOUND.
- Commits: 74e3387 (RED), d0dd866 (GREEN Task 1), e675dba (RED), 85d53f9 (GREEN Task 2) — all FOUND
  in git log.
