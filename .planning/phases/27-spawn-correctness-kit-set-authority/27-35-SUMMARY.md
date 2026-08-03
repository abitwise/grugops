---
phase: 27-spawn-correctness-kit-set-authority
plan: 35
subsystem: installer / kit-set derivation
tags: [KIT-02, CR-02, WR-01, D-41, installer, fail-loud, exit-code, cross-site-equality]
status: complete
requires:
  - "install/kit-source.ts srcNestedAdapterFiles — the nested walk whose result type gains the fourth channel"
  - "scripts/kit-model.ts readDirOrThrow — the twin authority's answer to the same predicate"
  - "install/install.test.ts WR-03 equality case (parts 1 and 2) — the case part 3 extends"
provides:
  - "NestedWalkResult.unreadable — a fourth failure channel naming every nested directory the walk could not read"
  - "install.ts unreadable reporting loop — the finding, at exit 3, distinguishing a read failure from an empty directory"
  - "makeUnreadableNestFixture / restrictAndProbe — the shared CR-02 fixture builder and its verified-restriction probe"
  - "WR-03 part 3 — cross-site equality over the unreadable arm, failing from either side"
  - "a four-path exit-tail regression scan (install + uninstall, source + committed) plus a separate precheck assertion"
  - "a pinned count for the six mid-script exit sites, replacing a rotted line-number list"
affects:
  - "install/install.ts, install/uninstall.ts, scripts/coordinator-resolution-precheck.ts — all three exit-after-report tails now set the exit code"
tech-stack:
  added: []
  patterns:
    - "derive the channel, report every channel — a failure the walk can detect but cannot say is a silent drop"
    - "assert the preconditions (neither side is silent) BEFORE the equality, so two silences cannot pass"
    - "extract the path from each side rather than restating a literal into both"
    - "a rotted set literal is DELETED and replaced by a pinned count plus the stable class fact"
    - "a fixture whose restriction may not take is PROBED and skips with its reason printed"
key-files:
  created: []
  modified:
    - install/kit-source.ts
    - install/kit-source.js
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/uninstall.ts
    - install/uninstall.js
    - scripts/coordinator-resolution-precheck.ts
    - scripts/coordinator-resolution-precheck.js
decisions:
  - "D-41 item 1 implemented as a rule with NO exception, including at the root: both bare returns record, and an unreadable ROOT is now reported twice (once by srcAdapterFiles' null branch, once by this channel). The duplication is accepted deliberately — two different reads of the same directory failing independently is two facts, and a rule with no exception cannot be widened by a later author the way the 'already reported' exception was widened into a silence."
  - "The residual note's rotted line-number list is DELETED and NOT requoted as evidence. Quoting it to explain its own deletion still puts numbers in front of a reader who may trust them; the measurement lives in this summary instead. An assertion pins that no line-number-shaped list survives anywhere in install.ts."
  - "WR-03 part 3 asserts substance by EXTRACTION plus a path suffix, not by a naked substring: the authority names an ABSOLUTE path and the installer a RELATIVE one, and `includes('nested')` would pass on a temp path that happened to contain the word."
metrics:
  duration: ~35 min
  completed: 2026-08-03
actuals:
  tokens: 14841
  tasks: 3
  commits: 3
---

# Phase 27 Plan 35: Unreadable-Walk Channel & Exit-Tail Parity Summary

The installer no longer becomes **more** confident when a directory becomes **less** readable: the nested-adapter walk carries a fourth failure channel for directories it cannot read, both formerly-bare returns route through it, and the installer refuses them by name at exit 3 — while all three exit-after-report tails on the installer surface now set the exit code rather than discarding the report they were paired with.

## What was built

**Task 1 — the fourth channel (D-41 item 1, closing CR-02).** `NestedWalkResult` gained `unreadable: string[]`; the `realpathSync` arm at the former `:335-340` and the `readdirSync` arm at the former `:349-354` both record the relative path the walk had reached and return as before; the list sorts on the way out like `cycles`. `install.ts` reports every entry through the same single `verify` channel the cycle and work-bound findings use. The finding states that this is a **read failure and not an empty directory** and gives the remedy that follows from one. The justification that covered only the ROOT read failure is amended to say plainly what it got wrong.

**Task 2 — the equality extended to the arm the twins diverged on (D-41 item 1).** WR-03 part 3 asserts, in order: the authority throws; the installer's unreadable channel is non-empty; the authority's absolute path ends at the relative member the installer recorded, inside the same tree. Fixture shared with task 1.

**Task 3 — the two remaining tails (D-41 item 2, closing WR-01).** `install/uninstall.ts`'s INCOMPLETE branch and `scripts/coordinator-resolution-precheck.ts`'s tail both set the exit code. The uninstaller's parity comment now carries the mechanism that makes its claim true. The installer's known-residual note is scoped to the six mid-script sites and its line-number list is gone. The regression scan runs over four paths; the precheck gets its own assertion; a behavioural case pins the uninstaller's banner surviving a pipe.

## Transcripts

### Task 1 — RED before, against the committed `.js`, WITH its control

```
[arm restricted] process can still read the restricted directory: false
[arm restricted] walk.files            = []
[arm restricted] walk.cycles           = []
[arm restricted] walk.overflow         = null
[arm restricted] walk channel keys     = ["files","cycles","overflow"]
[arm restricted] walk.unreadable       = null
[arm restricted] installer status      = 0
[arm restricted] mentions 'nested'     = false
[arm restricted] mentions 'hidden.md'  = false
[arm restricted] '== install complete' = true
[arm restricted] banner line           = == install complete ==
[arm readable]   walk.files            = ["nested/hidden.md"]
[arm readable]   installer status      = 3
[arm readable]   mentions 'nested/hidden.md' = true
[arm readable]   banner line           = == install INCOMPLETE — 1 item(s) need verification ==
[arm empty]      walk.files            = []
[arm empty]      installer status      = 0
[arm empty]      banner line           = == install complete ==
```

The failure and its control together are the evidence; neither half alone is. **Making the directory less readable made the installer more confident.**

### Task 1 — GREEN after, against the REBUILT committed `.js`

```
[arm restricted] process can still read the restricted directory: false
[arm restricted] walk channel keys     = ["files","cycles","unreadable","overflow"]
[arm restricted] walk.unreadable       = ["nested"]
[arm restricted] installer status      = 3
[arm restricted] mentions 'nested'     = true
[arm restricted] '== install complete' = false
[arm restricted] banner line           = == install INCOMPLETE — 1 item(s) need verification ==
[arm readable]   walk.files            = ["nested/hidden.md"]
[arm readable]   walk.unreadable       = []
[arm readable]   installer status      = 3
[arm readable]   mentions 'nested/hidden.md' = true
[arm readable]   banner line           = == install INCOMPLETE — 1 item(s) need verification ==
[arm empty]      walk.files            = []
[arm empty]      walk.unreadable       = []
[arm empty]      installer status      = 0
[arm empty]      banner line           = == install complete ==
```

The two arms are **distinguishable**, not merely both non-zero: the restricted arm names the DIRECTORY under `COULD NOT READ this directory`, the readable control names the MEMBER under `FLAT BY CONTRACT`. The readable-empty arm produces **no** unreadable finding and exits 0 — the channel reports a read failure and never an absence.

### Task 1 — the skip path, exercised rather than assumed

Forced in a scratch build by handing `restrictAndProbe` a no-op mode, so the branch is known reachable:

```
SKIP: /var/folders/.../T/grugops-4OW9HX/.claude/agents/nested is STILL READABLE after chmod 755
— the runner is privileged (uid 501) or platform darwin does not honour POSIX mode bits. The
fixture does not exist here, so this case asserts nothing rather than asserting vacuously.

 Test Files  1 passed | 34 skipped (35)
```

Scratch edit reverted.

### Task 2 — the new part fails from EITHER side

Both scratch edits made against the **committed `.js`** the case actually drives, then reverted.

Side A — the authority's throw replaced with a silent return (`scripts/kit-model.js`):

```
FAIL  install/install.test.ts > WR-03 part 3: over the UNREADABLE fixture the two sides name the
      SAME directory and neither is silent (CR-02, D-41)
AssertionError: expected 'authority threw: false' to be 'authority threw: true'
Expected: "authority threw: true"
Received: "authority threw: false"
      Tests  1 failed | 74 skipped (75)
```

Side B — the installer's channel write removed (`install/kit-source.js`, readdir arm):

```
FAIL  install/install.test.ts > WR-03 part 3: ...
AssertionError: expected 'installer named an unreadable directo…' to be 'installer named an unreadable directo…'
Expected: "installer named an unreadable directory: true"
Received: "installer named an unreadable directory: false"
      Tests  1 failed | 74 skipped (75)
```

Both scratch edits reverted; `node scripts/freshness.js` clean afterwards.

Observed strings the case asserts against (measured, not guessed):

```
installer walk.unreadable = ["nested"]
authority message: kit-model: cannot read kit directory /var/folders/.../.claude/agents/nested
```

### Task 3 — the committed uninstaller through a PIPE

```
install status = 0
uninstall stdout IS A PIPE (spawnSync stdio=pipe): true
uninstall status                 = 3
captured stdout bytes            = 2075
'== uninstall INCOMPLETE' present = true
'== uninstall complete' present   = false
banner line                      = == uninstall INCOMPLETE — 1 item(s) need verification ==
last captured line               =   Each `verify` line above names what was NOT removed and the remedy for it.
```

Both signals arrive together, and the line **after** the banner arrives too — nothing was dropped at the tail.

### Task 3 — the residual note's line-number drift, recorded here rather than in the note

Measured against `install/install.ts` immediately before the conversions:

| Old note claimed | Measured | Drift |
|---|---|---|
| ~111 | 112 | +1 |
| 509 | 510 | +1 |
| 528 | 529 | +1 |
| 544 | 545 | +1 |
| 576 | 572 | **−4 (opposite direction)** |
| 1386 | 1382 | −4 |

All six had drifted, and not by a constant offset — one moved in the opposite direction to the rest, so no mechanical correction would have recovered the list. Counts at the same moment: unfiltered `grep -c 'process.exit('` = **7**, comment-filtered = **6**. After the plan's three conversions the filtered count is **still 6** at the **same six positions** (112, 510, 529, 545, 572, 1382) — the mid-script sites are untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] The rewritten residual note reinstated the very list it deleted**

- **Found during:** Task 3, caught by this plan's own new assertion rather than by review.
- **Issue:** The first draft of the corrected known-residual note quoted both the old rotted line numbers and the newly measured ones as evidence for deleting the list. The assertion pinning "no line-number list survives in `install.ts`" went red on it.
- **Why it is a bug and not a style point:** a note that reprints stale numbers to explain why it deleted them still puts numbers in front of a reader who may trust them. That is the failure being deleted, not a description of it. The plan's own acceptance criterion says the drift belongs in **a captured transcript**, not in the note.
- **Fix:** the note now states the drift qualitatively (all six had drifted, one in the opposite direction) and points at this summary for the measurement. The assertion was generalised from a wording-specific regex to "no run of three or more line-number-shaped integers anywhere in `install.ts`", so a reintroduced list in any phrasing fails.
- **Files modified:** `install/install.ts`, `install/install.test.ts`
- **Commit:** bb5117b

## Findings — plan literals that did not survive measurement

Per the standing instruction to measure every count the plan states, three of its literals were checked and one class of them was wrong. **Nothing was bent to match a wrong literal; the measured values are what landed.**

| Plan literal | Measured | Disposition |
|---|---|---|
| Six mid-script exit sites at 112, 510, 529, 545, 572, 1382 (vs the note's ~111, 509, 528, 544, 576, 1386) | **Exactly as stated.** Filtered count 6, unfiltered 7. | Plan correct — used as given. |
| "zero failures **at or above the 1015-passing baseline**" | The tip baseline is **1062 passed / 2 skipped** across 35 files, not 1015. 1015 is the round-4 number, three waves stale. | The plan's floor is satisfied but is not the real baseline; the number to hold against is **1062**, and this plan ended at **1068**. Recorded so a later reader does not read 1015 as the current floor. |
| `grep -c 'unreadable'` floors of ≥3 (kit-source.ts) and ≥1 (install.ts) | 14 and 12 matching lines respectively. | Floors cleared with margin. |

## Verification

| Check | Result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — **32** committed `.js` all fresh |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1068 passed / 2 skipped** across 35 files, zero failures (baseline 1062 → **+6**) |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | `PRECONDITIONS HOLD`, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| Live kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills |
| `git diff package.json` | empty — dev-dependency fence unchanged, zero package-manager installs |
| `git status --porcelain` | clean apart from this plan's `files_modified`; no probe used the live checkout as an install or uninstall target; no temp tree left with restricted permissions |

Acceptance greps:

```
install/uninstall.ts:                       process.exit(3)=0   process.exitCode = 3=1
install/uninstall.js:                       process.exit(3)=0   process.exitCode = 3=1
scripts/coordinator-resolution-precheck.ts: process.exit(code)=0  process.exitCode = code=1
scripts/coordinator-resolution-precheck.js: process.exit(code)=0  process.exitCode = code=1
NestedWalkResult channels: files, cycles, unreadable, overflow  (exactly four)
```

## Honest scoping — what is NOT claimed

**The truncation on the two converted tails is UNREPRODUCED.** Both the uninstaller and the precheck emit kilobytes (the piped uninstall captured **2075 bytes**), not the ~1 MB that made the installer's race observable in D-35. The finding closed here is **the incomplete fix** — one of three tail sites converted, under a comment asserting a parity the code did not have — not a measured truncation. The piped case pins that both signals arrive; it does not prove they previously did not.

**Two of the three tail conversions carry no behavioural before/after**, for the same reason. What they carry is the shape assertion across four paths plus the outcome assertion through a pipe.

**T-27-WR01-03 remains an accepted residual, now scoped honestly.** Six mid-script `process.exit()` sites stay as they are: they rely on stop-here semantics, and a blind sweep would let the script run on past a refusal — a worse defect than the one being fixed. The count is pinned so a silent sweep fails.

## Known Stubs

None. No stub, placeholder, TODO or unwired data path was introduced by this plan.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was introduced; every change tightens an existing refusal path or an existing report.

## Self-Check: PASSED

Files claimed created/modified, verified present on disk:

```
FOUND: install/kit-source.ts        FOUND: install/kit-source.js
FOUND: install/install.ts           FOUND: install/install.js
FOUND: install/install.test.ts
FOUND: install/uninstall.ts         FOUND: install/uninstall.js
FOUND: scripts/coordinator-resolution-precheck.ts
FOUND: scripts/coordinator-resolution-precheck.js
```

Commits claimed, verified in `git log`:

```
FOUND: 1e17b5d  fix(27-35): name the nested directory the installer cannot read …
FOUND: ecbae42  test(27-35): extend the cross-site equality case to the UNREADABLE arm …
FOUND: bb5117b  fix(27-35): convert the two remaining exit-after-report tails …
```
