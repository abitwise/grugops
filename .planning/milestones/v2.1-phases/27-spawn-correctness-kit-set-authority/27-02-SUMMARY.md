---
phase: 27-spawn-correctness-kit-set-authority
plan: 02
subsystem: installer
tags: [installer, uninstaller, kit-set-derivation, KIT-02, D-18, D-06, T-27-06]
requires:
  - "install/install.ts materializeAdapter strip-then-inject core (unchanged, more call sites)"
  - "install/uninstall.ts isProtected denylist + rmdirIfEmpty safety posture (unchanged)"
provides:
  - "srcSkillNames() / srcAdapterFiles() run-time kit-set derivation in install.ts"
  - "srcCarriesSlot() content-based materialize-vs-copy routing (D-06)"
  - "srcSkillNames() / srcAdapterFiles() mirrored derivation in uninstall.ts, returning null on an unreadable source"
  - "a derived-and-target-intersected uninstall removal set (T-27-06)"
  - "synthetic 17-adapter kit-source test fixture (makeSyntheticSrc / runInstallFrom / runUninstallFrom)"
affects:
  - "plan 27-07 — the 17 adapters land with no installer edit"
tech-stack:
  added: []
  patterns:
    - "derive the set, never hand-list it (readdirSync off $GRUGOPS_SRC at each use site)"
    - "route by file content (resolver slot line), never by filename"
    - "derive the removal set from the SOURCE, intersect with the TARGET, remove only the intersection"
    - "null (not []) as the fail-loud signal for an underivable set"
key-files:
  created:
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
decisions:
  - "The doctor's D-03 source-(c) adapter is derived too, not just detectOldLayout's probe — the acceptance criterion forbids any adapter name literal outside comments, and the doctor held one."
  - "srcCarriesSlot tests whole-line equality against MAT_SLOT, matching materializeAdapter's own `line === MAT_SLOT` injection test, so routing and injection can never disagree."
  - "uninstall's derivation helpers return null (not []) on an unreadable source, so 'cannot derive' is distinguishable from 'nothing to remove' and can be reported rather than silently skipped."
  - "The symlink-unlink landmine list includes EVERY derived adapter plus only the slot-carrying skills, per the plan's wording — adapters are protected unconditionally."
metrics:
  duration: ~25 min
  completed: 2026-07-28
status: complete
---

# Phase 27 Plan 02: Installer/Uninstaller Kit-Set Derivation Summary

The installer and uninstaller now derive their adapter and skill sets by reading `$GRUGOPS_SRC` at
run time and route materialize-vs-copy by the resolver slot line in each source body, so the 17
adapters landing in plan `27-07` require no installer edit and an uninstall after that plan cannot
orphan sixteen files or delete a user's own agent.

## What Was Built

**Task 1 — `install.ts` self-derives (commit `f2df96f`).**
The hand-listed `SKILLS` array and the single `AGENT_REL` constant are deleted. Two helpers,
`srcSkillNames()` and `srcAdapterFiles()`, read `$GRUGOPS_SRC/.claude/skills` and
`$GRUGOPS_SRC/.claude/agents` and are called at each use site rather than cached, because the doctor
and the install paths run at different points in the process. Per D-18 the installer does **not**
import `scripts/kit-model.ts` — it stays self-contained and installs whatever exists, while
`kit-model` plus the KIT-03 oracle guarantee at CI time that what exists is correct.

The install call site is a single derived loop per set. Routing is decided by `srcCarriesSlot(src)` —
whole-line equality against `MAT_SLOT` in the source body — so a body carrying the resolver slot is
materialized and anything else is plain-copied. That one rule replaced both the old six-skill copy
loop and its by-name skip of the one resolver skill, removing the last name literal from the code
path. Three more sites became derived: the `adapterDests` symlink-unlink landmine list (every
adapter destination plus every slot-carrying skill destination, so all 17 get the protection the two
hand-named ones had — T-27-07), `detectOldLayout()`'s materialization probe (any derived adapter
carrying a `KIT=` line), and the doctor's D-03 source-(c) adapter.

`materializeAdapter`'s strip-then-inject core and its bounded-removal behaviour on an unterminated
sentinel block are byte-for-byte unchanged — the task only gave them more call sites.

**Task 2 — `uninstall.ts` mirrors the derivation (commit `1171e94`).**
The `SKILLS`/`AGENT_REL` constants here were duplicated literals in a second file, not a code mirror,
so Task 1 alone would have left the uninstaller removing one adapter and orphaning sixteen. The same
`$GRUGOPS_SRC`-rooted derivation was added, and the ordering hazard is honoured explicitly: the
removal set is derived at the very top of the removal sequence, **before** anything is removed,
because the uninstaller also tears down grugops wiring and a later derivation could come back empty.

The derived set is then intersected with what actually exists in the target, and only that
intersection is removed. Deriving from the target's own `.claude/agents` instead would delete the
user's own agent files — the T-27-06 data-loss path. On an unreadable `$GRUGOPS_SRC` the helpers
return `null` rather than `[]`, and the caller reports the condition and skips that removal class
entirely, leaving the files for the user to remove by hand (T-27-09). `isProtected` and
`rmdirIfEmpty` are unchanged.

**Task 3 — regression tests (commit `9054ae3`).**
Two cases driving a synthetic 17-adapter `$GRUGOPS_SRC`, so they pin the derivation itself and are
independent of `27-07`. The update case installs over a target pre-seeded with the old
single-adapter layout (one materialized adapter pointing at a stale kit) and asserts all 17
destination paths — not a sampled subset — each with a materialized `KIT=` line at the resolved kit
root, the stale `KIT=` stripped, D-06 body-content routing holding, and both roots byte-identical on
a second run. The survival case writes `.claude/agents/my-own.md` with no kit counterpart and
asserts it survives with unchanged bytes (keeping its directory) while all 17 grugops adapters go,
plus that `.claude` is removed only when it holds nothing else.

## Verification Evidence

Every command below was run and its real output observed.

| Check | Result |
|---|---|
| `npx vitest run install/` | exit 0 — 43 passed, 1 skipped (baseline was 41 passed, 1 skipped: **+2**) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — 31 files, 816 passed, 1 skipped |
| `npm run build` | exit 0 (`tsc`, `noEmitOnError` — build genuinely succeeded, not stale output) |
| `npm run freshness` | exit 0 — "All build outputs fresh: 26 committed .js file(s) match a fresh tsc rebuild" |
| no adapter name literal in `install.ts` | `grep -v '^//' \| grep -c 'grugops-orchestrator'` → `0` |
| no skill name array in `install.ts` | `grep -v '^//' \| grep -c '"grugops-map"'` → `0` |
| D-18 no kit-model import | `grep -c 'from "../scripts/' install/install.ts` → `0`; the only `scripts/` mentions are two comment lines and the two unrelated `RUNNABLES` entries |
| no adapter name literal in `uninstall.ts` | `grep -v '^//' \| grep -c 'grugops-orchestrator'` → `0` |
| no skill name literal in `uninstall.ts` | `grep -v '^//' \| grep -c '"grugops-ticket"'` → `0` |
| removal set sourced from the kit | `grep -c 'GRUGOPS_SRC' install/uninstall.ts` → `11` (> 1) |
| idempotence into a scratch target | two `node install/install.js --target <tmp>` runs; `/usr/bin/diff -r` against a copy taken after run 1 reported **no differences** |
| dry-run writes nothing | `DRY_RUN=1 … --target <tmp>` exit 0; the only file under the target afterwards was the pre-existing `CLAUDE.md`, and `$GRUGOPS_HOME` was never created |
| dry-run report names every skill and adapter | the `-- adapters --` block listed all 7 skills and the 1 adapter: `would-materialize .claude/skills/grugops/SKILL.md`, six `would-copy` skill lines, `would-materialize .claude/agents/grugops-orchestrator.md` |
| revert makes the survival case fail | a scratch copy of `uninstall.js` with the removal set reverted to target-derived **deleted** `my-own.md` (`my-own.md still exists: false`); the scratch copy was discarded |
| foundation guards (not a gate for this plan) | exit 1 with exactly **one** FAIL — the KIT-03 oracle plan `27-01` deliberately left red. No new failure introduced. |

Note on the dry-run evidence: the plan's acceptance criterion spells the flag `--dry-run`, but the
installer's actual dry-run interface is the `DRY_RUN=1` environment variable (a literal `--dry-run`
argument exits 2 through the unknown-arg branch). The capability was verified through the real
interface; no new flag was added, since adding one is not described in the task's `<action>` and
would expand the installer's CLI surface.

## Deviations from Plan

### 1. [Rule 2 - Missing critical functionality] The doctor's adapter path also had to be derived

- **Found during:** Task 1
- **Issue:** The `<action>` names `detectOldLayout()`'s probe as the site to derive, but `doctor()`
  independently held `join(TARGET, ".claude", "agents", "grugops-orchestrator.md")` as source (c) of
  the D-03 three-source kit-root cross-check. Left alone it would have violated the task's own
  acceptance criterion (`grep -c 'grugops-orchestrator'` must be `0`) and, after `27-07`, would have
  pinned the cross-check to one arbitrary adapter.
- **Fix:** the doctor now takes the first derived target adapter that carries a `KIT=` line, falling
  back to the first derived destination so a FAIL message still names a concrete path. Fail-closed
  posture is unchanged — an absent file, a missing `KIT=` line, or an empty derived set all still
  read as `""` and drive the existing FAIL branch. On today's single-adapter kit the resolved path is
  identical to the old literal, so doctor behaviour is unchanged.
- **Files modified:** `install/install.ts`
- **Commit:** `f2df96f`

### 2. [Process] The tracer feedback gate was run in its autonomous form, not as a human checkpoint

- **Found during:** Task 1 (`type="tracer"`)
- **Issue:** The executor protocol's tracer gate says an interactive run should stop for a
  `checkpoint:human-verify` after committing the tracer.
- **Decision:** the gate was run in its autonomous form instead — the tracer's `<verify>` was re-run
  end-to-end and passed, so execution continued to the expansion tasks. Rationale: the plan declares
  `autonomous: true` and contains no `checkpoint:*` task; the tracer's `<verify>` is entirely
  `<automated>` with no human-observable surface; and `.planning/config.json` sets
  `workflow.human_verify_mode: "end-of-phase"`, which routes human verification to the end of the
  phase. Flagged here so the choice is visible rather than silent.

## Known Stubs

None. Every code path added is wired and exercised by a test.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or schema at a trust boundary was
introduced. The plan's registered threats were mitigated as planned: T-27-06 (source-derived,
target-intersected removal set with a regression fixture), T-27-07 (derived symlink-unlink landmine
list), T-27-09 (`null` fail-loud on an underivable source). T-27-08 was untouched — no
`.claude/settings.json` wiring is written. T-27-SC holds: `package.json` gained no dependency.

## Deferred Issues

One out-of-scope discovery, logged in
`.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md`: `install/install.ts`
carries a literal NUL byte in `dirsSameContent()`'s fail-safe sentinel (`return ["\0differs"];`),
pre-existing in `HEAD`, which makes `grep` classify the file as binary and suppress line output. It
is functionally correct but silently defeats grep-based checks over the installer — it defeated two
of this plan's own acceptance criteria, which had to be run through `/usr/bin/grep -c` and a Node
scan. Not fixed here because the fix touches a fail-safe the plan explicitly says not to redesign.

## Self-Check: PASSED

Files claimed created/modified — all present on disk:

- `FOUND: install/install.ts`
- `FOUND: install/install.js`
- `FOUND: install/uninstall.ts`
- `FOUND: install/uninstall.js`
- `FOUND: install/install.test.ts`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md`

Commits claimed — all present in `git log`:

- `FOUND: f2df96f` — refactor(27-02): install.ts self-derives its adapter and skill sets
- `FOUND: 1171e94` — fix(27-02): uninstall.ts derives its removal set from the kit source
- `FOUND: 9054ae3` — test(27-02): pin the 17-adapter update and user-content survival on uninstall
