---
phase: 27-spawn-correctness-kit-set-authority
plan: 28
subsystem: installer
tags: [reversibility, safety-guard, no-fabrication, exit-codes, gap-closure]
status: complete
requires:
  - "install/kit-source.ts (plan 27-25) — the shared derivation both installers import"
  - "install/install.ts's D-07 self-checkout guard (the shape mirrored)"
provides:
  - "install/uninstall.ts — an always-on self-checkout refusal, exit 1, ahead of every removal"
  - "--allow-self / --force on uninstall.js's published command surface, one vocabulary with install.js"
  - "a marker pair built from files a grugops checkout contains TODAY, shared by both guards"
  - "an install/README.md exit-code table whose every row is true of the binaries it covers"
affects:
  - "install/uninstall.ts"
  - "install/install.ts"
  - "install/README.md"
  - "install/install.test.ts"
tech-stack:
  added: []
  patterns:
    - "a guard whose condition cannot fire is the same defect as a refusal that is documented and absent"
    - "refuse at the TARGET boundary, not by widening a protected-path denylist the reversal legitimately empties"
    - "a safety guard needs a negative control, or it can be satisfied by refusing everything"
key-files:
  created: []
  modified:
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.ts
    - install/install.js
    - install/README.md
    - install/install.test.ts
decisions:
  - "The marker pair is install/install.ts + agent-factory/VERSION. agent-factory/VERSION alone is deliberately insufficient: README §1's minimal path tells users to copy agent-factory/ into their own repo, so that half legitimately appears in an ordinary target and refusing on it would break the reversal the guard exists to protect."
  - "The fix is a TARGET-boundary refusal, not widening isProtected() to cover .claude/. .claude/ is the directory the uninstaller legitimately empties in a normal target; protecting it would break every ordinary reversal while closing nothing the guard does not already close."
  - "The guard sits BEFORE the run banner, so a refused run writes zero bytes to stdout — 'it changed nothing' is then unambiguous rather than inferred from the absence of a banner that also prints on success paths."
  - "The equality half normalises with resolve() before comparing. uninstall.ts's abspath() deliberately does not collapse `.`/`..` (sh byte-parity), so a raw string compare would let `--target /path/to/grugops/.` past. TARGET itself is left exactly as computed; only the comparison normalises."
  - "The code-3 row was corrected too, beyond the plan's named bounds, because as written it was true of only one binary — the exact defect class this plan closes."
metrics:
  duration: ~45 min
  completed: 2026-07-31
  tasks: 2
  commits: 2
---

# Phase 27 Plan 28: The Refusal the README Already Published Summary

`install/README.md` promised a code-1 self-checkout refusal for both binaries; `install/uninstall.ts`
had no refusal, no override flag, and no exit-1 path at all. Pointing it at a grugops checkout
deleted the kit's own 17 committed adapters and 7 committed skills and exited 0. The refusal now
exists, the marker that triggers it is built from files that exist, and every row of the exit-code
table is matched to a command that produces it.

## What Was Built

**The uninstaller's self-checkout guard.** Always-on, after `TARGET`/`GRUGOPS_SRC` resolution and
before the run banner, the kit-set derivation and every removal. It refuses when the resolved target
equals the resolved source root **or** when the target carries the source marker pair, writes a
clear-professional-voice refusal to stderr naming what would be destroyed and the override, and exits
`1` — a code this binary had never returned. A refused run prints **nothing** to stdout.

**The override.** `--allow-self` / `--force` added to the argument loop, byte-identical to
`install.ts`'s arm. This is load-bearing, not cosmetic: the loop exits `2` on **any** unparsed
argument, so an override missing from it would be rejected as bad usage before the guard it overrides
could run.

**The dead marker, corrected.** `install.ts`'s guard tested for `install/install.sh` — deleted in
`f9dab9f` when the POSIX installer was retired. That half could never fire; only path-equality
worked, so a *second* checkout named by `--target` from a first was not recognised as source at all.
Both guards now use `install/install.ts` + `agent-factory/VERSION`. `install.ts`'s message, placement,
path-equality half and exit code are untouched.

**The table.** The code-1 row names a refusal both binaries implement and scopes the `--check`
doctor-FAIL half to `install.js`. The code-0 row carries the IN-01 clause with each non-install mode's
actual closing line. The code-3 row is scoped. A new paragraph beside the code-3 paragraph describes
the uninstaller's refusal.

## Proof

A green suite is not accepted as proof for this plan. Every transcript below was captured by running
the command shown.

### Marker verification — run first, before acting on the plan's premise

```
$ ls -la install/install.sh
ls: install/install.sh: No such file or directory

$ git log --oneline --diff-filter=D -- install/install.sh
f9dab9f chore(15-06): delete 13 POSIX/.mjs originals + .test.sh oracles after green-suite gate (D-09)

$ git show --stat f9dab9f -- install/install.sh | tail -2
 install/install.sh | 826 -----------------------------------------------------
 1 file changed, 826 deletions(-)

$ git ls-tree -r HEAD --name-only | grep -c "^install/install.sh$"
0
```

**Conclusion: the plan's premise is correct.** The file the installer's marker test required has been
absent since `f9dab9f`; the marker half of the D-07 guard could not fire. The installer's marker was
therefore corrected, not left alone.

### The marker pair chosen, and the evidence for both directions

Pair: **`install/install.ts` AND `agent-factory/VERSION`**.

*Direction 1 — present in a grugops source checkout today:*

```
PRESENT: install/install.ts
PRESENT: agent-factory/VERSION
```

*Direction 2 — absent from a normal installed target.* Checked against what the installer actually
writes, not intuition. Every `join(TARGET, …)` write in `install.ts` targets `.claude/`, `CLAUDE.md`,
`.gemini/`, `.github/`, `.grugops/`, `plans/`, `memory-bank/` or `tools/grugops/`; the only
`join(TARGET, "install", …)` in the file is the guard's own test:

```
$ grep -n '"install"' install/install.ts
554:    (existsSync(join(TARGET, "install", "install.ts")) &&
```

Checked against the fixtures the installer's own tests build: the only fixture that ever planted an
`install/` directory into a *target* was the D-07 refusal case itself (line 468). `makeFixture()`,
`makeOldLayoutFixture()` and every installed-target fixture plant none.

`agent-factory/VERSION` alone is **not** sufficient and is not used alone — README §1's minimal path
tells users to copy `agent-factory/` into their own repo, so a legitimate target can carry it. This
direction is pinned by a `half-only` control in the marker-half case.

### RED-before — CR-04 reproduced against the base-commit binary

Base commit **`88eb32e3ab2f35fe04f572bd9b65d3446ef32ffd`**. On a `rsync` **throwaway copy** of the
checkout (path printed and asserted before running; the working checkout was never the target):

```
THROWAWAY: /private/tmp/.../scratchpad/red-copy
=== BEFORE ===
adapters: 17
skills:   7

=== RUN (base sha 88eb32e uninstall.js) ===
$ GRUGOPS_SRC=$S2 node $S2/install/uninstall.js --target $S2
exit=0
--- stderr (verbatim) ---
--- end stderr (bytes: 0) ---
== grugops uninstall ==
target: /private/tmp/.../scratchpad/red-copy
source: /private/tmp/.../scratchpad/red-copy
-- removing grugops adapters (only what install.js added) --
  removed        .claude/skills/grugops/SKILL.md
--- removed lines: 28 ---
...
== uninstall complete ==

=== AFTER ===
adapters: 0
skills:   0
```

**No refusal on stderr — zero bytes. Exit 0. 28 `removed` lines under `== uninstall complete ==`.**
The damage went further than the review recorded: `AGENTS.md` was deleted
(`ls: AGENTS.md: No such file or directory`) and the `CLAUDE.md` start-here block was stripped
(`grep -c "grugops — start here" CLAUDE.md` → `0`).

### GREEN-after — the identical invocation against the rebuilt binary

Fresh throwaway copy, same command:

```
=== BEFORE ===
adapters: 17  skills: 7
tree checksum before: d8866015be1f3fe8c1796cab9c4b01670ea07d94adf854f7f381a5eadfcae269

$ GRUGOPS_SRC=$S3 node $S3/install/uninstall.js --target $S3
exit=1
--- stderr (verbatim) ---
refusing: target looks like the grugops source checkout (/private/tmp/.../scratchpad/green-copy) — uninstalling here would delete the kit's own committed adapters and skills under .claude/. You probably meant --target <your-repo>. Pass --allow-self to override.
--- stdout (bytes: 0) ---

=== AFTER ===
adapters: 17  skills: 7
tree checksum after:  d8866015be1f3fe8c1796cab9c4b01670ea07d94adf854f7f381a5eadfcae269
TREE BYTE-IDENTICAL: yes
```

The checksum is a `shasum -a 256` over the sorted per-file hashes of the whole copy (excluding
`node_modules`), taken before and after — the tree is byte-identical, not merely "the adapters are
still there".

### The override is honoured, not rejected

```
$ GRUGOPS_SRC=$S4 node $S4/install/uninstall.js --target $S4 --allow-self
exit=0
stderr bytes=0  contains 'refusing'? 0
== grugops uninstall ==
...
== uninstall complete ==
```

Exit **0**, not 2 — the flag reached the loop rather than being rejected as an unknown argument. And
the loop still rejects what it should:

```
$ node install/uninstall.js --bogus
exit=2
uninstall.js: unknown argument: --bogus
```

### The marker half can fire — the direction equality cannot cover

A target that is **not** the source root but carries the pair:

```
$ GRUGOPS_SRC=$REPO node $REPO/install/uninstall.js --target $SCRATCH/marker-target
exit=1
refusing: target looks like the grugops source checkout (/private/.../marker-target) — uninstalling here would delete the kit's own committed adapters and skills under .claude/. ...
stdout bytes=0
```

This is exactly what the dead `install/install.sh` marker made unreachable.

### The negative control — a normal installed target is unaffected

Two identical fixtures, both installed with the current installer; one reversed by the **base-commit**
binary (`3d96c61e…`, taken from the untouched `install/` of the RED copy), one by the **rebuilt**
binary (`74b120c9…`). Outputs normalised for the target path and diffed:

```
[base] install exit=0 adapters=17 skills=7
[new]  install exit=0 adapters=17 skills=7
--- uninstall (base binary) --- exit=0
--- uninstall (new binary)  --- exit=0
OUTPUT IDENTICAL: yes (59 lines)
TREES IDENTICAL: yes
```

Same exit code, byte-identical removal output, identical resulting trees, and the fixture's
`agent-factory/roles/orchestrator.md`, `plans/board.md` and `CLAUDE.md` all survived. The guard buys
safety without breaking the reversal it protects.

### One vocabulary — the flag literal, quoted from both files

```
install/uninstall.ts:82:  } else if (a === "--allow-self" || a === "--force") {
install/install.ts:95:  } else if (a === "--allow-self" || a === "--force") {
```

Byte-identical.

### RED-before for the new cases (Task 2)

With `git checkout 88eb32e -- install/uninstall.ts install/uninstall.js`:

```
 ❯ install/install.test.ts (63 tests | 2 failed | 60 skipped)
   × CR-04 self-checkout guard: uninstall.js refuses a source-shaped target (exit 1, nothing removed); --allow-self overrides
   × CR-04 marker half: a NON-source-root target carrying the source markers is refused (exit 1)

AssertionError: expected +0 to be 1 // Object.is equality
- Expected  1
+ Received  0
 ❯ install/install.test.ts:533:28
    533|     expect(refused.status).toBe(1);
```

Both refusal cases fail showing the run exiting **0**. The negative control passed against the base
binary — as a control must. Restored with `git checkout HEAD --`; `git status --porcelain install/`
then showed only ` M install/README.md` and ` M install/install.test.ts` — Task 2's own edits and
nothing else. `npx vitest run install/install.test.ts` after restore: **62 passed / 1 skipped**.

### Every exit code matched to a command that produces it

Each row checked one at a time, against a real invocation:

| Code | Binary | Command | Actual |
|------|--------|---------|--------|
| `0` | install.js | `install.js --yes --target <fixture>` | `exit=0`, `== install complete ==` |
| `0` | install.js | `install.js --check` (clean doctor) | `exit=0`, `ALL CHECKS PASSED` |
| `0` | install.js | `install.js --update` | `exit=0`, `== update complete ==` |
| `0` | install.js | `install.js --prune-old-kit` | `exit=0`, `== prune complete ==` |
| `0` | install.js | `install.js --migrate` (already migrated) | `exit=0`, *"Nothing was changed."* |
| `0` | uninstall.js | `uninstall.js --target <installed fixture>` | `exit=0`, `== uninstall complete ==` |
| `1` | install.js | `install.js --yes` into a source-shaped target | `exit=1` |
| `1` | install.js | `install.js --check` on an uninstalled repo | `exit=1` (doctor FAIL) |
| `1` | uninstall.js | `uninstall.js --target <source-shaped>` | `exit=1` |
| `2` | install.js | `install.js --bogus` | `exit=2` |
| `2` | uninstall.js | `uninstall.js --bogus` | `exit=2` |
| `3` | install.js | `install.js --yes` from a source with no `.claude/` | `exit=3`, `== install INCOMPLETE — 2 item(s) need verification ==` |
| `3` | uninstall.js | `uninstall.js` from a source with no `.claude/` | `exit=3`, `== uninstall INCOMPLETE — 2 item(s) need verification ==` |

**This measurement is what forced two corrections beyond the plan's literal wording.** The plan's
IN-01 fix text said the non-install modes "print their own completion banner"; measuring showed
`--check` prints `ALL CHECKS PASSED` and already-migrated `--migrate` prints *"Nothing was changed."*
— neither is a completion banner. The row now names what each mode actually prints. And the code-3
row named only `== install INCOMPLETE ==`, which is true of one binary in a table that claims to
cover both; it is now scoped.

### Doc and code agree on the message

The README's refusal paragraph names the markers (`install/install.ts` and `agent-factory/VERSION`),
the override (`--allow-self` / `--force`), that nothing is printed on stdout, and that nothing on disk
changes. Each was verified by running the refusal and comparing: stderr matches, `stdout bytes=0`, and
the tree checksum is unchanged.

### Diff scope

```
$ git diff --numstat install/install.test.ts   (Task 2)
107	0	install/install.test.ts        → additions only, 0 deletions

$ git diff install/uninstall.ts install/install.ts | wc -l   (Task 2)
0                                                → docs and tests only
```

`git diff install/install.ts` (Task 1) is confined to the marker test and its comment: the
`install.sh` → `install.ts` string, and the block of comment explaining why. The message, placement,
path-equality half, exit code and `--allow-self` arm are byte-unchanged.

### Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` + `npm run freshness` | exit 0 — **32** committed `.js` fresh |
| `npx vitest run install/install.test.ts` | 62 passed / 1 skipped (63) — was 59/1 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **993 passed / 2 skipped, 35 files** — baseline 990/2 plus this plan's 3 cases |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=$(pwd) node scripts/validate-agent-factory.js` | exit 0 |
| `node scripts/adapters-freshness.js` | 17 compared, 0 byte differences, listings set-equal |
| `git status --porcelain` | clean — no throwaway copy, scratch target or temporary checkout leaked |

Every throwaway lived under the session scratchpad, never under the repository. Each destructive run
printed and asserted its resolved path before executing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — no-fabrication] The D-07 fixture's own comment would have become untrue**

- **Found during:** Task 1
- **Issue:** `install/install.test.ts:465-471` plants `install/install.sh` and comments that the
  fixture "trips the source-marker predicate". Once the marker moved to `install/install.ts`, that
  plant tripped nothing — the case still passed, but only on the path-equality half
  (`TARGET === GRUGOPS_SRC` in that fixture), and its comment became a false claim about why. That is
  the same documented-versus-actual defect class this plan exists to close.
- **Fix:** the plant was corrected to `install/install.ts` and the comment records the CR-04 history
  and states plainly that the equality half is what carries the case. No assertion changed.
- **Files modified:** `install/install.test.ts`
- **Commit:** `2c35adc`
- **Note:** this means Task 1 touched `install/install.test.ts`, which the plan listed only under
  Task 2. Task 2's "additions only" criterion is still satisfied for its own diff (107 additions, 0
  deletions), and the installer's refusal case assertions and override arm are unmodified throughout.

**2. [Rule 2 — no-fabrication] The code-3 row was true of only one binary**

- **Found during:** Task 2, while matching each code to a command
- **Issue:** the row named `== install INCOMPLETE — N item(s) need verification ==` in a table whose
  own preamble says both binaries use the same list. `uninstall.js` prints `uninstall INCOMPLETE`.
- **Fix:** a parenthetical scoping the difference. This exceeds the plan's named bound ("confined to
  the code-0 row, the code-1 row and the paragraph"), but the plan's own truth requirement — *"any row
  that is true of only one binary says which"* — is the stronger constraint, and leaving a known
  fabrication to keep a diff bounded would be the defect wearing a different hat. The addition is one
  clause; no row, code or structure was added.
- **Files modified:** `install/README.md`
- **Commit:** `5680321`

**3. [Rule 1 — correctness] The equality half normalises before comparing**

- **Found during:** Task 1
- **Issue:** a verbatim port of `install.ts`'s `TARGET === toPosix(GRUGOPS_SRC)` would be weaker on
  the uninstall side. `install.ts`'s `TARGET` is already `toPosix(resolve(...))`; `uninstall.ts`'s
  `abspath()` deliberately does **not** collapse `.`/`..` (sh byte-parity), so
  `--target /path/to/grugops/.` would have slipped past a raw string compare into the removal
  sequence.
- **Fix:** the comparison resolves locally (`toPosix(resolve(TARGET)) === toPosix(GRUGOPS_SRC)`).
  `TARGET` itself is left exactly as computed, so no other behaviour moves; only the guard's
  comparison normalises, and the reason is recorded beside it.
- **Files modified:** `install/uninstall.ts`
- **Commit:** `2c35adc`

### Judgement calls the plan left to the executor

**Refuse at the TARGET boundary, not by widening `isProtected()`.** The review correctly notes that
`isProtected()` omits `.claude/`. Adding it would be the wrong fix: `.claude/` is precisely the
directory the uninstaller legitimately empties in a normal target, so protecting it would break every
ordinary reversal while closing nothing the target-level guard does not already close. The reasoning
is recorded in the guard's header so a future reader does not re-propose it.

**The guard sits before the run banner.** `install.ts` places its guard before the install banner;
mirroring that here means a refused run writes **zero bytes to stdout**. That is stronger than
placing it after: "the run changed nothing" is then directly observable rather than inferred from the
absence of a completion line. The target path is carried in the stderr message instead, so the
refusal is fully self-describing.

**Four behaviours in three `it` blocks.** The plan's artifact list names four cases: the refusal, its
override arm, the marker half, and the negative control. The override arm is written as arm (b) of the
refusal case — the exact shape `install.ts`'s own D-07 case uses — rather than as a separate block, so
the two guards' cases read the same way. A fifth assertion (the `half-only` control, proving
`agent-factory/VERSION` alone does **not** refuse) was added inside the marker-half case; without it,
"the pair is required" would be an unpinned claim in a comment.

**The override arm asserts the guard, not a success code.** Following the lesson recorded at
`install.test.ts:487-497` (27-21, WR-01): the arm asserts `not 1` (the guard did not refuse), `not 2`
(the flag was recognised rather than rejected as an unknown argument — the load-bearing one), no
refusal on stderr, and that the run banner was reached. It deliberately does not assert `toBe(0)`,
which would couple the arm to whatever the throwaway stub makes the removal sequence conclude.

### Out of scope, encountered and left alone

**IN-02 and WR-03** were not touched and were not encountered incidentally. The
`### The self-checkout guard (--allow-self)` section at `install/README.md:107-113` describes the
guard as the *installer's*; that is still true, merely now incomplete, and expanding it would have
broken the plan's bounded-diff criterion. The new paragraph beside the exit-code table carries the
uninstaller's half. Flagged here rather than fixed.

## Known Stubs

None.

## Threat Flags

None. This plan adds no network endpoint, auth path or schema change at a trust boundary. It narrows
an existing file-access pattern (a destructive path on a user-supplied target) rather than widening
one. The register's six threats are all dispositioned `mitigate` and all are implemented:
T-27-136 (the refusal + byte-unchanged assertion), T-27-137 (the published refusal code + every row
matched to a command), T-27-138 (guard implemented, message compared against the doc), T-27-139 (the
marker pair verified both directions and pinned by its own case), T-27-140 (the negative control),
T-27-141 (the flag in the argument loop, with an override arm asserting `not 2`).

## Self-Check: PASSED

Files verified present on disk:

- `FOUND: install/uninstall.ts`
- `FOUND: install/uninstall.js`
- `FOUND: install/install.ts`
- `FOUND: install/install.js`
- `FOUND: install/README.md`
- `FOUND: install/install.test.ts`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-28-SUMMARY.md`

Commits verified in `git log`:

- `FOUND: 2c35adc` — fix(27-28): give uninstall.js the self-checkout refusal its README publishes (CR-04)
- `FOUND: 5680321` — docs(27-28): make the exit-code table true of both binaries, and pin the refusal (CR-04, IN-01)

Neither commit deleted a tracked file (`git diff --diff-filter=D --name-only <c>~1 <c>` empty for
both).
