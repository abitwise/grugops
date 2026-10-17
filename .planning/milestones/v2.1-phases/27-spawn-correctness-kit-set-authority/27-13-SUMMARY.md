---
phase: 27-spawn-correctness-kit-set-authority
plan: 13
subsystem: install
tags: [typescript, installer, uninstaller, fail-loud, reversibility, kit-model, set-authority, KIT-02]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "listAgentAdapters/listSkillAdapters as the recursive adapter authority (27-10); the installer/uninstaller self-derivation (27-02); the set-literal inventory (27-03)"
provides:
  - "one fail-loud contract for one derivation: null on unreadable, [] on empty, in BOTH install.ts and uninstall.ts"
  - "a nested source adapter refused by name rather than silently skipped"
  - "a conditional completion banner in both halves — INCOMPLETE over any verify finding"
  - "the runnable-mirror removal pass, closing the install-without-uninstall reversibility gap (WR-04)"
  - "a printable impossible-path sentinel, restoring byte-oriented search over the installer (IN-01 / deferred D1)"
  - "the `source derivation` conformance assertion: the installer's real installed set == kit-model's authority set, by member AND by integer count"
  - "the `runnable removal` pair assertion: RUNNABLES and RUNNABLES_MIRROR derived from source and asserted equal"
affects: [install, uninstall, check-foundation-guards, 27-verification]

tech-stack:
  added: []
  patterns:
    - "A derivation whose failure mode is silence gets THREE states, not two: cannot-read, read-but-empty, populated — each with its own message, because they need different remedies"
    - "A completion banner is a CLAIM; it is withheld when the run installed nothing for a class"
    - "A deliberate duplicate implementation is bought back with a conformance assertion against the authority, never with a second grammar taught the same rules"
    - "Derive the set, assert the count — applied to the mapping pair this plan itself created, so the test holds no hand-copy of the list"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/uninstall.ts
    - install/uninstall.js
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md

key-decisions:
  - "The sentinel is `\"<<grugops:dirs-differ>>/\"`, not the review's suggested `\"<<differs>>\"`: `<` and `>` are ILLEGAL in a Windows path element and the trailing `/` makes join(root, sentinel) unreadable on POSIX (ENOENT/EISDIR/ENOTDIR). The value reaches join() — not only an inequality compare — when BOTH trees carry a mirrored symlink, so airtightness there is load-bearing, and the printable form keeps it"
  - "The new sentinel is INLINED, not hoisted to a named module-level const: dirsSameContent is reachable from the early --update branch at line 504, so a const declared beside the function at line ~594 would be in the temporal dead zone and throw"
  - "An unreadable source is reported and the run exits 0 — matching the uninstaller exactly. An asymmetric exit code would break the very symmetry this plan exists to create; the banner, not the exit status, carries the honesty"
  - "The installer's nested-adapter detection is implemented LOCALLY (D-18 preserved: zero scripts-layer imports); agreement with kit-model is asserted by a test that compares the installer's REAL installed set against the authority over the same fixture"
  - "tools/ itself is NOT removed even when the pass leaves it empty — grugops owns tools/grugops/, not the generic directory name a project is very likely to own. It is REPORTED as left, per the plan's stated fallback, rather than deleted or passed over silently"
  - "The removal pass mirrors the installer's fixed mapping rather than listing the target's tools/grugops/ — discovering the work from the target would delete the user's files, the same data-loss shape the adapter pass already avoids"

requirements-completed: [KIT-02]

coverage:
  - id: D1
    description: "The installer source and its committed twin are plain text end to end; grep-based verification over the installer no longer degrades silently"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "grep -c \"\" install/install.ts → 1431; install/install.js → 1340; zero 0x00 bytes in either"
        status: pass
      - kind: manual
        ref: "adversarial e2e on the --migrate path: identical trees still report the D-09 no-op; mirrored symlinks still force a backup"
        status: pass
    human_judgment: false
  - id: D2
    description: "The installer and uninstaller hold ONE fail-loud contract: unreadable → null → reported skip; empty → distinct message; populated → install"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "install/install.test.ts -t 'source derivation' (6 cases: conformance, ENOTDIR-unreadable, EACCES-unreadable, empty, nested, unreadable-skills)"
        status: pass
      - kind: manual
        ref: "RED reproduced — re-breaking the null return and the nested walk flips exactly the three dependent cases red"
        status: pass
    human_judgment: false
  - id: D3
    description: "The installer's derivation equals kit-model's authority set by member AND by integer cardinality"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "install/install.test.ts#source derivation: the installer's installed set equals kit-model's authority set, by member AND by count (17 adapters / 7 skills)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A nested source adapter is refused by name; the authority sees it, the install set deliberately does not, and the two differ by exactly the refused member"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "install/install.test.ts#source derivation: a NESTED source adapter is refused by name, not silently skipped (authority 18, installed 17, difference == the plant)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every file the installer writes has a guarded removal counterpart; a user-modified copy survives with a reported skip; no protected path is reachable"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "install/install.test.ts -t 'runnable removal' (6 cases)"
        status: pass
      - kind: manual
        ref: "three re-breaks: byte-identity guard removed → preservation case red; mapping emptied → all five red; entry re-pointed at .planning/ → `refused (protected path)` with the decoy intact"
        status: pass
    human_judgment: false

metrics:
  duration: 55m
  completed: 2026-07-29
  tasks: 3
  files: 8

status: complete
---

# Phase 27 Plan 13: One Fail-Loud Contract, One Reversible Install Summary

Three installer findings that shared one shape — a derivation whose failure mode is silence — are
closed: an unreadable kit source can no longer produce a successful-looking install of nothing, a
nested adapter is refused by name instead of vanishing, every file the installer writes now has a
guarded removal counterpart, and the installer source is searchable by ordinary tools again.

## What Was Built

**Task 1 — `fix(27-13)`, commit `89b0df6`.** `dirsSameContent()`'s symlink fail-safe returned a string
whose first byte was a literal `0x00`. It forced the intended mismatch, but it also made every
byte-oriented tool classify `install/install.ts` — and the committed `install/install.js` — as
**binary** and suppress line output, silently disabling grep-based verification over the installer
(it had already forced two of plan 27-02's acceptance criteria to be checked another way). The value,
and only the value, changed to `"<<grugops:dirs-differ>>/"`. The comparison itself is a load-bearing
fail-safe and was not restructured. `deferred-items.md` D1 now reads CLOSED with the closing plan named.

**Task 2 — `feat(27-13)`, commit `5e32dd1`.** `srcSkillNames()` and `srcAdapterFiles()` now return
**null** on an unreadable source directory, exactly as their uninstaller mirrors already did. Each
call site branches on all three states and reports each distinctly, mirroring the uninstaller's
wording so a reader moving between the two files sees one contract rather than two. `srcNestedAdapterFiles()`
refuses a nested source adapter by its relative path. The closing banner became conditional:
`== install INCOMPLETE — N item(s) need verification ==` whenever a `verify` finding fired.
`targetAdapterFiles()` propagates the null; the two read-only probes (the doctor and `detectOldLayout`)
opt into `?? []` **explicitly**, with the reason written beside each, so the null is visible at every
site rather than swallowed inside the helper.

**Task 3 — `feat(27-13)`, commit `8882780`.** `install/uninstall.ts` gained a `RUNNABLES_MIRROR`
removal pass covering the `tools/grugops/` helpers `materializeRunnable()` writes into the user's
repository. The file previously never mentioned `tools/` at all. The pass is guarded twice — every
candidate goes through `removeFile()` and its `isProtected` denylist, and a file is removed only when
byte-identical to the source it was installed from — and the uninstaller's banner got the same
conditional treatment as the installer's, because the repudiation failure was symmetric.

**Follow-on — `docs(27-13)` `ee541d2` and `test(27-13)` `1bd832f`.** The set-literal inventory's
completeness claim (review WR-04's other half) was repaired with entry 15, and the `RUNNABLES` /
`RUNNABLES_MIRROR` pair — which this plan itself created — was put under a derived-and-counted
assertion instead of a third hand-copy in the test.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 30 committed .js file(s) match a fresh tsc rebuild.` |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run install` | 55 passed, 1 skipped |
| `npx vitest run install -t "source derivation"` | 6 passed |
| `npx vitest run install -t "runnable removal"` | 6 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 34 files, **931 passed**, 2 skipped |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 |
| `grep -c "" install/install.ts` | `1431` (a line count, not a binary-file notice) |
| `grep -c "" install/install.js` | `1340` |
| NUL bytes in `install.ts` / `install.js` | `0` / `0` |
| `grep -c "tools/grugops" install/uninstall.ts` | `7` |
| scratch install → uninstall outside the repo | no grugops-owned file left; seeded state preserved |

Real installer output, quoted verbatim from a hermetic run against a source whose adapter directory
could not be read:

```
  verify         .claude/agents/ — cannot read /tmp/fl/src/.claude/agents, so the install set is unknown. No adapter was installed. Re-run the installer from a complete kit checkout.
== install INCOMPLETE — 1 item(s) need verification ==
```

and against a source carrying a nested adapter:

```
  copied         .claude/agents/top.md
  verify         .claude/agents/nested/deep.md — the adapter directory is FLAT BY CONTRACT, so this nested adapter was NOT installed. …
```

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Green tests were not accepted as evidence. Each guard was re-broken and the RED direction confirmed:

1. **The sentinel's both-sides case, end to end.** The value reaches `join()` — not only an inequality
   compare — when both trees carry a mirrored symlink, so a printable value that could be *read* would
   let the installer declare two differing trees identical and skip a backup. Driven through the real
   `--migrate` path: byte-identical trees still report `skipped (identical — no backup, D-09)`, while
   the same trees plus a mirrored symlink still report `backed-up`. The control matters as much as the
   hazard — without it, "everything differs now" would pass the hazard case for the wrong reason.
2. **The null return and the nested walk re-broken** (`return null` → `return []`; `walk("")` → `[]`),
   rebuilt, re-run: exactly the three dependent `source derivation` cases went red, while the
   conformance, empty and skill cases stayed green. Restored, rebuilt, re-verified.
3. **The byte-identity guard removed** from the removal pass: the user-modified preservation case went
   red — so it genuinely pins T-27-60 and not something incidental.
4. **The mirror mapping emptied** (the exact pre-fix state): all five `runnable removal` cases went red.
5. **A mapping entry deliberately re-pointed at the protected `.planning/` path**, which is the only way
   to make a protected path reachable from this pass. The run printed
   `refused  .planning/reference-check.js (protected path — never removed)` and the decoy survived —
   direct evidence the denylist gates *this* pass, rather than an unreachability argument about it.
6. **An entry added to `install.ts`'s `RUNNABLES` alone**: all six `runnable removal` cases went red,
   the pairing case naming the disagreement.

Two distinct *unreadable* shapes are pinned, not one: a file where the directory should be (ENOTDIR —
deterministic on every platform, and it does not stop being a fixture when the suite runs as root) and
a `chmod 000` directory (EACCES, skipped on win32/root where the fixture cannot exist).

## Deviations from Plan

### 1. [Acceptance-criteria correction] `node install/install.js --help` cannot exit 0 — `--help` is not a flag

Task 1's criterion is "`node install/install.js --help` exits 0, proving the rebuilt twin runs." The
installer's D-12 contract is that **any** unknown argument exits 2, and `--help` is not in the
arg-parse loop; an existing case (`unknown-arg: install.js and uninstall.js both exit 2 on an unknown
flag`) pins that. Adding a `--help` flag to satisfy the literal criterion would change a documented
CLI contract and weaken that test — contorting code to make a check come out right.

The criterion's **intent** — prove the rebuilt twin runs — was satisfied directly and is reported
honestly instead: a hermetic `DRY_RUN=1` install (exit 0), a real install (exit 0) and a `--check`
doctor run (exit 0), all against a scratch target outside the repository.

### 2. [Acceptance-criteria correction] `grep -c 'kit-model' install/install.ts` returns 3, not 0 — and returned 2 before this plan

Task 2's criterion says the count is `0`, glossed as "the installer still does not import the
scripts-layer authority." The literal grep also matches **comments**, and the file carried two
pre-existing comment mentions before this phase touched it (verified: `git show 7f8d016:install/install.ts`
→ 2). The criterion was therefore already unsatisfiable. Task 2's own `<action>` then *requires* a third:
"record in a comment that the policy is defined by the authority and asserted equal by a test."

The intent holds exactly under the import-scoped form, and is reported that way:

| form | result |
|---|---|
| `grep -c "kit-model" install/install.ts` | 3 — all three are comments (lines 181, 182, 244) |
| `grep -n "^import\|require(" install/install.ts` | `node:fs`, `node:path`, `node:os` only |
| `grep -c "kit-model" install/install.test.ts` | 5 — the conformance import and its rationale |

**Zero scripts-layer coupling; D-18 intact.** No comment was deleted to make a number come out right.

### 3. [Rule 2 — missing critical functionality] The uninstaller's completion banner was the same defect wearing the other hat

The plan's truth 2 requires that *neither* half "claims success over a no-op it did not perform." The
uninstaller already reported an unreadable source — and then printed `== uninstall complete ==`
immediately afterwards. Fixing only the installer would have left the identical repudiation on the
other side while claiming the contract was now shared. The `verify()` counter and the conditional
banner were added to `uninstall.ts` too (Task 3, which owns that file).

### 4. [Rule 2 — missing critical functionality] The set-literal inventory's completeness claim

Review WR-04 has two halves; the plan's tasks cover only the uninstaller half. The inventory header
claims to be "the committed record of EVERY enumerating literal the phase found," and omitted
`RUNNABLES`. This plan then created a *second* one (`RUNNABLES_MIRROR`), making the record more
incomplete than it found it. Entry 15 was added with its disposition. Commit `ee541d2`.

### 5. [Rule 2 — missing critical functionality] The mapping pair had no mechanical agreement check

The removal pass turned `RUNNABLES` into a hand-maintained **pair**, and the first draft of the test
carried a third hand-copy of the same list — three copies of one fact, the exact drift class this
milestone exists to delete. The cases now read both literals out of the two sources, assert the dest
sides *and* source sides agree, assert the cardinality as an integer, and drive every other
`runnable removal` case off the derived result. Commit `1bd832f`.

### 6. [Design choice, recorded not buried] The new sentinel is inlined, and it is not the review's suggested value

`dirsSameContent` is reachable from the early `--update` branch at line 504, so a module-level `const`
declared beside the function (~line 594) would sit in the **temporal dead zone** and throw — the file's
own header warns about exactly this hazard for `report`/`mkdirp`/`sameContent`. The sentinel is
therefore inlined at its single use site with the reasoning written beside it.

The review suggested `"<<differs>>"`. That is a legal POSIX filename, and because the value reaches
`join()` in the mirrored-symlink case, a user who created a file with that name in both trees could
defeat the fail-safe. `"<<grugops:dirs-differ>>/"` cannot be read under any on-disk shape (ENOENT /
EISDIR / ENOTDIR) and cannot exist at all on Windows, so it is airtight *and* printable.

### 7. [Scope, stated rather than assumed] `tools/` is left in place, and said so

The plan's instruction is to remove "the containing directory only if it is empty… if there is none,
leave the directory and report that it was left." `tools/grugops/` is rmdir'd when empty. `tools/`
itself — which `mkdirp` created as a side effect — is **not** removed, because grugops owns the
namespaced child and not the generic directory name a project is very likely to own. It is reported:
`left  tools/ (grugops owns tools/grugops/ only — the directory itself is left in place)`, so the one
artifact this pass does not reverse is visible rather than discovered later.

## KIT-02 — closed, with the residuals named

This plan carried the last open claim on KIT-02 (verified: no plan among 27-14…27-17 lists it). The
checkbox in `REQUIREMENTS.md` is now checked. What closes it:

- The four sets the requirement names by hand are all authority-derived (27-01, 27-03, 27-04, 27-10, 27-11).
- The installer's deliberate **second** implementation of the adapter rule (D-18, locked) is bought back
  by a conformance assertion over the same fixture — set equality *and* integer cardinality — so the two
  answers to one filesystem fact cannot drift apart while the suite stays green.
- The remaining literals are dispositioned in the committed inventory, and the one pair that could rot
  silently is now pair-asserted.

Residuals, stated plainly rather than implied closed:

1. **Two implementations of the adapter rule still exist.** That is the locked D-18 exception, not an
   oversight. The conformance case is what buys it back; if a future phase revisits the decision, that
   case and the test's `kit-model` import are what to delete along with the duplicate.
2. **The conformance case runs over a synthetic fixture, not the live tree.** That is the right split —
   the live tree's adapter set is covered by `guard_adapter_size`, `guard_referential_integrity` and
   `adapters-freshness` (27-10 / 27-11); the installer conformance is a contract test, and a fixture is
   what lets it construct the nested and unreadable shapes at all.
3. **The `WR05_SCAN` named in the requirement text is ambiguous.** Inventory entry 13 records that the
   identifier in `check-uat-oracles.ts` is an unrelated list of four `.planning/` tracking documents with
   nothing to derive it from; the kit-set one was renamed `SPAWN_GRANT_SCAN` and derived in 27-03. The
   requirement's wording predates that rename.

The `REQUIREMENTS.md` **traceability table** row for KIT-02 was deliberately left at `Gaps Found`,
matching the precedent 27-12 set for KIT-03: that column reflects the phase-verification pass's
findings, and re-running that pass owns flipping it. Checking the requirement box without touching the
verification column is the honest split.

## Threat Flags

None. No new network endpoint, auth path or schema at a trust boundary was introduced. The one new
file-access pattern — the runnable removal pass — writes nothing and removes only paths built from a
fixed literal mapping joined onto `$TARGET`, with every candidate passing the `isProtected` denylist and
a byte-identity check first; no path in it is taken from argv, env or file content. Register items
T-27-59 through T-27-63 are each mitigated and each pinned by a named case.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced.

## Self-Check: PASSED

- `install/install.ts`, `install/install.js`, `install/install.test.ts`, `install/uninstall.ts`,
  `install/uninstall.js`, `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — all present on disk.
- Commits `89b0df6`, `5e32dd1`, `8882780`, `ee541d2`, `1bd832f` — all present in `git log`.
- Every committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0).
