---
phase: 27-spawn-correctness-kit-set-authority
plan: 25
subsystem: installer
tags: [kit-set-authority, reversibility, set-literal-drift, symlink, structural-fix]
status: complete
requires:
  - "install/install.ts statSync-following derivation (plan 27-22)"
  - "D-28 (user decision, gap-closure round 3) amending D-18"
provides:
  - "install/kit-source.ts — the single derivation of \"what is in the kit source\", imported by both installers"
  - "a round-trip fixture containing a symlinked adapter AND a symlinked skill directory"
  - "a set-literal inventory entry that names the module that exists instead of the pair that does not"
affects:
  - "install/install.ts"
  - "install/uninstall.ts"
  - "scripts/check-foundation-guards.ts"
tech-stack:
  added: []
  patterns:
    - "one authority per predicate — collapse the hand-synced pair rather than re-syncing it"
    - "explicit root argument (D-22), never a module-level environment constant"
    - "prove the fixture has teeth by mutating the helper, not by watching the suite stay green"
key-files:
  created:
    - install/kit-source.ts
    - install/kit-source.js
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
decisions:
  - "Entry 10 of the set-literal inventory is RETIRED, not renumbered — entries 14 and 15 are cited by number in install/install.test.ts and in the phase plans, and silently shifting them would make those citations point at the wrong row. Fourteen live rows under fifteen numbers, stated at the retired row."
  - "uninstall.ts imports only srcSkillNames and srcAdapterFiles. srcNestedAdapterFiles is deliberately excluded: a nested source adapter is refused and never installed, so importing it would invent a removal class for files that were never laid down."
  - "Only the two symlink PLANTS in the round-trip case are win32-conditional, not the whole case — skipping the case on Windows would have deleted Windows coverage of the user-content survival assertions the plan requires kept."
  - "statSync and realpathSync were dropped from install.ts's fs import and readdirSync from uninstall.ts's, because the collapse left them unreferenced. Dead imports in a file whose whole point is auditability are noise."
metrics:
  duration: ~35 min
  completed: 2026-07-31
  tasks: 2
  commits: 2
---

# Phase 27 Plan 25: Collapse the Installer Derivation Pair Summary

The declared byte-identical pair that answered "what is in the kit source" twice — once in
`install/install.ts`, once hand-synced into `install/uninstall.ts` — is now one module,
`install/kit-source.ts`, that both installers import; the reversal can no longer be narrower than
the install, and the round-trip fixture finally contains the symlinked shapes it was already
claiming to cover.

## What Was Built

**`install/kit-source.ts`** — the single derivation. `isFileFollowing`, `isDirFollowing`,
`srcSkillNames`, `srcAdapterFiles` and `srcNestedAdapterFiles` were **moved** (not copied) out of
`install/install.ts`, taking the correct `statSync`-following side as the one that survives. Each
derivation takes the source root as an explicit first argument (D-22), so each importer passes the
`GRUGOPS_SRC` it already resolved and the module reads no environment variable and resolves no root
of its own. The two `Dirent`-based helpers were deleted from `install/uninstall.ts`.

The module deliberately does **not** import `scripts/kit-model.ts`. D-18's actual rationale is
decoupling the installer from the `scripts/` layout, and a shared file *inside* `install/` preserves
that in full — `grep -n 'from "'` over `kit-source.ts` shows only `node:fs` and `node:path`.

The header reasoning was carried across intact — the null-versus-empty fail-loud contract, the WR-02
`statSync` file-ness argument, the flat-directory contract, and the sentence that the installer must
not be the one place a file disappears silently — with the D-28 record added above them, naming
CR-02 and stating that a re-inlined copy in either installer restores the defect.

**The fixture.** The uninstall round-trip case now plants a symlinked adapter in the source
`.claude/agents` and a symlinked skill *directory* in `.claude/skills` whose target holds a real
`SKILL.md`, asserts both are **installed** (so the removal assertions cannot pass vacuously over
files that never arrived), then asserts both are **removed and named as removed**. The WR-02 case's
skill assertion — which previously compared two unmodified derivations over a fixture with no
symlinked skill — now has a symlinked skill in the fixture plus membership on both sides and
cardinality as an integer (7 → 8).

**The record.** Inventory entries #9 and #10 declared the pair. Entry #9 now names
`install/kit-source.ts` and its two importers, carrying the full CR-02 history; entry #10 is retired.

## Key Implementation Details

`srcNestedAdapterFiles` is imported by `install.ts` only. A nested source adapter is refused by the
installer and never installed, so the reversal has nothing to remove — the exclusion is stated in a
comment beside the uninstall import, as the plan required.

`srcCarriesSlot`, `targetAdapterFiles`, `RUNNABLES` and `RUNNABLES_MIRROR` stayed exactly where they
were. `RUNNABLES` is a source-to-dest mapping the inventory dispositions separately at entry #15 for
a different reason, and it is not the pair being collapsed.

## Proof

### RED-before — CR-02 reproduced against the base-commit binaries

Base commit `0eb779da71bc83c7f4ad2a9d29883701ac4d8e1d`. A scratch synthetic source with a symlinked
adapter (`grugops-linked-role.md`) and a symlinked skill directory (`grugops-linked-skill`), then
`node install/install.js --yes` followed by `node install/uninstall.js --target <t>`:

```
=== TARGET AFTER INSTALL ===
grug-engineer.md
grug-orchestrator.md
grugops-linked-role.md
-- skills --
grugops  grugops-gate  grugops-linked-skill

=== UNINSTALL (base sha 0eb779d) ===
-- removing grugops adapters (only what install.js added) --
  removed        .claude/skills/grugops/SKILL.md
  removed        .claude/skills/grugops-gate/SKILL.md
  removed        .claude/agents/grug-engineer.md
  removed        .claude/agents/grug-orchestrator.md
  ...
== uninstall complete ==
uninstall exit: 0

=== TARGET AFTER UNINSTALL ===
grugops-linked-role.md
-- skills --
grugops-linked-skill
```

The banner printed, the exit code was 0, and **both** symlinked shapes survived. Neither was named
as removed nor as skipped — the silent disappearance, on the reversal side.

### GREEN-after — the identical sequence against the rebuilt binaries

```
=== UNINSTALL (rebuilt binaries) ===
  removed        .claude/skills/grugops/SKILL.md
  removed        .claude/skills/grugops-gate/SKILL.md
  removed        .claude/skills/grugops-linked-skill/SKILL.md
  rmdir          .../target/.claude/skills
  removed        .claude/agents/grug-engineer.md
  removed        .claude/agents/grug-orchestrator.md
  removed        .claude/agents/grugops-linked-role.md
  rmdir          .../target/.claude/agents
  rmdir          .../target/.claude
uninstall exit: 0

=== TARGET AFTER UNINSTALL ===
(agents dir gone)  (skills dir gone)  (.claude gone entirely)
```

Both symlinked shapes are named as removed, and the whole `.claude` tree is gone.

### RED-before — the extended round-trip case, against the pre-fix code

With `git checkout 0eb779d -- install/install.ts install/install.js install/uninstall.ts
install/uninstall.js` and `install/kit-source.js` moved aside:

```
 FAIL  install/install.test.ts > KIT-02/T-27-06: a user-authored .claude/agents file survives
       uninstall; all 17 grugops adapters are removed (CR-02: including SYMLINKED source shapes)
AssertionError: expected true to be false // Object.is equality
 ❯ install/install.test.ts:1389:76
    1389|       expect(existsSync(join(target, ".claude", "agents", linkedAdapte…

      Tests  1 failed | 57 passed | 1 skipped (59)
```

The failure names the leftover symlinked adapter. After restoring, `git status --porcelain install/`
showed only ` M install/install.test.ts` — this task's own edit and nothing else.

### The fixture has teeth (the WR-02 concern, answered by mutation not by assertion)

The complaint against the old form was that it "would have passed with the helper unchanged". To
prove the new form would not, `srcSkillNames` in `kit-source.ts` was temporarily reverted to the
`Dirent` shape and the suite re-run:

```
 FAIL  ... > source derivation: a SYMLINKED source adapter is a member of BOTH derivations (WR-02)
AssertionError: expected [ 'grugops-gate/SKILL.md', …(6) ] to deeply equal [ …(7) ]
-   "grugops-linked-skill/SKILL.md",
      Tests  2 failed | 56 passed | 1 skipped (59)
```

Two cases fail. The helper was restored and rebuilt; `npm run freshness` green, tree clean.

### Single definition of each moved helper

`grep -rn "^function <name>\|^export function <name>" install/*.ts` returned exactly one line per
name, all five in `install/kit-source.ts`:

```
install/kit-source.ts:92:export function isFileFollowing(p: string): boolean {
install/kit-source.ts:99:export function isDirFollowing(p: string): boolean {
install/kit-source.ts:113:export function srcSkillNames(srcRoot: string): string[] | null {
install/kit-source.ts:128:export function srcAdapterFiles(srcRoot: string): string[] | null {
install/kit-source.ts:168:export function srcNestedAdapterFiles(srcRoot: string): string[] {
```

### Decoupling holds

`grep -c "kit-model"` → `kit-source.ts:7`, `install.ts:2`, `uninstall.ts:0` — all of them prose in
comments. `grep -n 'from "' install/kit-source.ts` shows only `node:fs` and `node:path`.

### Every call site passes an explicit root; no zero-argument call site remains

```
install/install.ts:226:  const files = srcAdapterFiles(GRUGOPS_SRC);
install/install.ts:892:  const migrateSkillNames = srcSkillNames(GRUGOPS_SRC);
install/install.ts:1413:const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
install/install.ts:1414:const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);
install/install.ts:1415:const SRC_NESTED_ADAPTERS = srcNestedAdapterFiles(GRUGOPS_SRC);
install/uninstall.ts:491:const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
install/uninstall.ts:492:const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);
```

### Zero-dependency execution — proven, not assumed

From an `rsync` copy of the repository with `node_modules` absent (verified absent):

- `node install/install.js --check` → exit **1**, its own doctor verdict (`FAIL grugops not installed
  in <empty target>`). No module-resolution error.
- `node install/uninstall.js --target <empty scratch dir>` → exit **0**, `== uninstall complete ==`.
  No module-resolution error.

The new sibling module resolves relative to the compiled entry point, so both binaries still run on
a host with nothing installed.

### The record matches the tree

`grep -n "kit-source" scripts/check-foundation-guards.ts` → line 110, entry #9. The phrase
`BYTE-IDENTICAL PAIR` no longer appears anywhere in the file. The entry it replaced read, verbatim:

```
//    9  SKILLS / AGENT_REL       install/install.ts              DERIVED via readdirSync self-
//                                                                derivation (D-18). Plan 27-02.
//   10  SKILLS / AGENT_REL       install/uninstall.ts            DERIVED — a SECOND duplicated pair
//                                                                in a second file. Plan 27-02.
```

`git diff scripts/check-foundation-guards.ts | grep -c "RUNNABLES\|roleCeiling"` → **0**: entry #15's
source-to-dest mapping disposition and entry #14's deliberate exemption are untouched.

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` + `npm run freshness` | exit 0 — **32** committed `.js` fresh (was 31; `kit-source.js` is the new one) |
| `npx vitest run install/install.test.ts` | 58 passed / 1 skipped (59) — **identical to the pre-edit count**; this plan moves code and adds assertions to existing cases, it adds no case |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **978 passed / 2 skipped, 35 files** — exactly the orchestrator's baseline |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED`; stdout **byte-identical** to the pre-edit run (85 lines, `diff` empty) — the inventory is a comment and no guard verdict moved |
| `node scripts/adapters-freshness.js` | 17 adapters compared, 0 byte differences, listings set-equal |
| `git status --porcelain` | clean — no scratch install target, kit home or temporary checkout leaked |

## Platform Coverage — read this before trusting the symlink claims

**The symlink claims are proven on the POSIX legs only. Windows behaviour is `UNKNOWN - verify`.**

Creating a symlink on Windows requires the `SeCreateSymbolicLink` privilege, which an unprivileged CI
runner does not hold and which makes `symlinkSync` throw `EPERM` — a plant that cannot be built
asserts nothing. Both new plants therefore carry the same `win32` skip and the same stated reason the
nested symlink case already uses. Only the **plants** are conditional: every pre-existing assertion
in the round-trip case (user-authored file survival, the flat adapter removal loop, the bare-target
companion arm) still runs on Windows. Every transcript above was captured on darwin.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Dead code] Removed fs imports left unreferenced by the collapse**
- **Found during:** Task 1
- **Issue:** Moving the five helpers out left `statSync` and `realpathSync` unused in
  `install/install.ts` and `readdirSync` unused in `install/uninstall.ts`. `tsc` does not flag unused
  imports under this config, so they would have shipped silently.
- **Fix:** Dropped them from the respective `node:fs` import lists. `npx tsc --noEmit` exit 0 after.
- **Files modified:** `install/install.ts`, `install/uninstall.ts`
- **Commit:** `b7c5a74`

### Judgement calls the plan left to the executor

**Entry 10 retired rather than renumbered.** The plan said to "renumber only what the collapse
forces". Renumbering 11-15 down to 10-14 would have broken two live citations by number — entry 15 is
named in `install/install.test.ts`'s runnable-removal block, and entry 14 in the phase plans. The
collapse forces the *row* to go, not the *numbers* of unrelated rows, so #10 is marked `— RETIRED —`
with the reasoning stated in place. The header prose was corrected in the same edit ("the fifteen
rows below" → "the rows below", plus a sentence recording the retirement) so the record does not
overclaim its own shape — the failure mode WR-04 already caught this inventory committing once.

**Both plants conditional, not the whole case.** Skipping the entire round-trip case on `win32` would
have removed Windows coverage of the user-content survival assertions the plan explicitly required
kept. A `canSymlink` boolean guards the plants and their assertions only.

**Install-side assertions added to the round-trip case.** The plan asked for removal assertions. A
removal assertion over a file that was never installed passes vacuously, so `expect(existsSync(...))
.toBe(true)` after the install was added for both plants first. This is the same
"prove-the-fixture-can-fail" discipline the mutation probe applies.

## Known Stubs

None.

## Threat Flags

None. This plan introduces no new network endpoint, auth path, file-access pattern or schema change
at a trust boundary. `install/kit-source.ts` reads the same source tree both installers already read;
T-27-123 (following a symlink out of the source root during derivation) was dispositioned `accept` in
the plan's register and that disposition is unchanged — the source root is the kit the user chose to
install from, and following a link adds no read the run did not already have.

## Self-Check: PASSED

Created files verified present on disk:
- `FOUND: install/kit-source.ts`
- `FOUND: install/kit-source.js`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-25-SUMMARY.md`

Commits verified in `git log`:
- `FOUND: b7c5a74` — refactor(27-25): collapse the installer derivation pair into install/kit-source.ts
- `FOUND: 363a439` — test(27-25): give the round-trip fixture the symlinked shapes it asserts about

Neither commit deleted a tracked file (`git diff --diff-filter=D HEAD~1 HEAD` empty for both).
