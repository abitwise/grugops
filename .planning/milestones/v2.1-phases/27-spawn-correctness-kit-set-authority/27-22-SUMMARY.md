---
phase: 27-spawn-correctness-kit-set-authority
plan: 22
subsystem: installer
tags: [installer, symlinks, derivation-authority, set-literal-drift, wr-02, wr-04]
status: complete
requires:
  - "27-21's installer exit ladder (0/1/2/3) — the new nested-symlink case pins status 3"
  - "27-13's null-vs-empty fail-loud contract in the three source derivations"
  - "scripts/kit-model.ts listAgentAdapters/listSkillAdapters as the authority the installer is asserted equal to"
provides:
  - "statSync-based file-ness and directory-ness in install.ts's three source derivations — the authority's test, in the installer"
  - "a realpath-visited-once guard in srcNestedAdapterFiles, so following links cannot recurse without bound"
  - "two symlinked-source conformance cases (win32-skipped) covering the shape that split the two derivations"
  - "parseMappingBody: a declared-versus-parsed cardinality refusal for TypeScript mapping literals"
affects:
  - "install/install.ts, install/install.js, install/install.test.ts"
  - "any future consumer of the RUNNABLES/RUNNABLES_MIRROR pair — an unreadable entry now fails collection"
tech-stack:
  added: []
  patterns:
    - "one predicate, one implementation: file-ness is statSync's in both the authority and the installer"
    - "derive the CARDINALITY, not just the set — a matcher that under-reads must fail, not cover less"
    - "the count of `[` openings is the shape-independent count of tuple entries the author wrote"
key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
decisions:
  - "a symlink cycle guard (realpath visited-once) was added beyond the plan: following links is what makes a cycle reachable, and an unbounded recursion is a hang, not a narrower set"
  - "the source-side scrapes were ROUTED THROUGH the shared parser rather than given a parallel check — a second implementation of one predicate is the class this phase deletes"
  - "the plan's stated WR-04 RED reproduction does not reproduce; the review's own scenario does. Reported, not reconciled."
metrics:
  duration: ~45m
  completed: 2026-07-30
requirements: [KIT-01, KIT-02]
closes_findings: [WR-02, WR-04]
---

# Phase 27 Plan 22: Installer Derivation Symlink Parity + Self-Checking Mapping Cardinality Summary

The installer and `scripts/kit-model.ts` now answer "what files are in this kit source" the same way
over a symlinked tree, so a symlinked adapter is installed or refused **by name** instead of
vanishing under a completion banner — and `mappingDests` fails loudly on an entry it cannot read
instead of quietly covering fewer runnables.

## Task 1 — WR-02: the installer's source derivation follows symlinks (commit `4a40842`)

### What was built

Three derivations in `install/install.ts` moved off `Dirent` flags and onto `statSync`, through two
new shared helpers `isFileFollowing()` / `isDirFollowing()`:

| Helper | Before | After |
|---|---|---|
| `srcSkillNames()` | `ent.isDirectory()` | `isDirFollowing(join(root, name))` — a symlinked skill directory holding a `SKILL.md` is a skill |
| `srcAdapterFiles()` | `ent.isFile() && .md` | `.md && isFileFollowing(...)` — non-recursive and null-on-unreadable contracts untouched |
| `srcNestedAdapterFiles()` | `ent.isDirectory()` / `ent.isFile()` | `isDirFollowing` / `isFileFollowing`, so a nested symlinked **file** and a file behind a symlinked **directory** are both reached — and therefore both refused by name |

A throwing `statSync` makes the entry a non-member and never aborts the walk, matching how the
surrounding code and `walkFilesRelative()` both treat a vanished entry. The comment beside it states
why that direction is safe: a dangling link is not a file the platform can load either, while
aborting the walk *would* hide every entry after it.

The derivation header gained the invariant in one sentence, verbatim in the source:

> The installer's INSTALL set may deliberately be NARROWER than the authority's set — that is the
> flat-directory contract below — but it may never be BLIND to a member the authority sees, because
> a member it cannot see is a member it cannot refuse by name.

`grep -c "statSync" install/install.ts`: **4 before → 13 after**.

### RED-before / GREEN-after — the synthetic fixtures

```
RED (HEAD before this plan, new cases run against the pre-change install.js)
$ npx vitest run install/install.test.ts -t "WR-02"
 × source derivation: a SYMLINKED source adapter is a member of BOTH derivations ...
   AssertionError: expected [ 'grugops-orchestrator.md', …(16) ]
                   to deeply equal [ 'grugops-linked-role.md', …(17) ]
   - "grugops-linked-role.md"          <- the authority holds it; the installed set does not
 × source derivation: a NESTED SYMLINKED source adapter is refused BY NAME ...
   AssertionError: expected +0 to be 3    <- the run claimed COMPLETE over two invisible plants

GREEN (after)
$ npx vitest run install/install.test.ts
   Tests  57 passed | 1 skipped (58)      <- baseline was 55 passed | 1 skipped (56): exactly +2
```

### RED-before / GREEN-after — the REAL repo source, not just synthetics

A `git archive HEAD` copy of this repo with `grugops-linked-probe.md -> grugops-orchestrator.md`
planted in `.claude/agents`:

```
RED  (HEAD's install.js over that source)
  installed adapters = 17
  occurrences of "grugops-linked-probe" anywhere in the output = 0
  == install complete ==            EXIT=0     <- silently gone

GREEN (this plan's install.js, same source)
  materialized   .claude/agents/grugops-linked-probe.md (KIT=...)
  installed adapters = 18           EXIT=0
  authority over the same tree: count 18, linked? true      <- the two derivations agree
```

### Adversarial probes — a green suite is not the proof for this class

Per the project's standing rule, both bypasses were attempted by hand against the built binary over
real repo sources, not only through the suite.

| Probe | Input | Result |
|---|---|---|
| A — positive control | clean repo source | 17 adapters, 7 skills, `== install complete ==`, exit 0 |
| B — the WR-02 shape | symlinked top-level adapter | **installed** and named in the output; installer 18 == authority 18 |
| C — dangling symlink | `grugops-dangling-probe.md -> ./no-such-target.md` | **non-member**; the derivation did NOT abort — the other 18 still installed, exit 0, complete banner. T-27-112 mitigated as designed. |
| D — symlink **cycle** | `.claude/agents/loop -> ..` | **did not hang** (`timeout 60` returned the real exit, not 124); exit 3; seven `FLAT BY CONTRACT` refusals naming `loop/skills/*/SKILL.md` by path |

Probe D is a defect the plan did not anticipate and the fix would otherwise have introduced — see
Deviations.

### Acceptance criteria

| Criterion | Result |
|---|---|
| RED-before recorded for the symlinked-adapter case | Yes, above — missing member on the installed side |
| GREEN-after, both sets contain the symlinked member | Yes — plus explicit `toContain` on both sides |
| Case count exactly two greater | 56 → 58 total |
| Conformance case at `:1381` unmodified, 17-member pin intact | Yes — `git diff` shows **zero deletions** in `install.test.ts` for this commit |
| `win32` skip with a stated reason | Yes, on both cases |
| `grep -c statSync install/install.ts` strictly greater | 4 → 13 |
| Real repo install still succeeds end to end | Probe A: 17 adapters, 7 skills, completion banner |
| `npm run build` then `npm run freshness` exit 0 | Yes — "All build outputs fresh: 31 committed .js file(s)" |

## Task 2 — WR-04: `mappingDests` derives its own cardinality (commit `d43714c`)

### What was built

`parseMappingBody(file, constName, body)` is now the single place a `[source, dest]` mapping literal
is recovered from TypeScript source, and the single place the refusal lives. It counts the `[`
openings inside the block — the shape-**independent** count of entries the author wrote, since every
entry is a tuple literal that opens exactly one bracket whatever its quoting — and throws when the
pair matcher recovered fewer, naming the file, the constant, both counts and the cause. The matcher
was also widened to single quotes and backticks, and the comment says plainly that this is a
convenience, **not** the guarantee: widening alone only moves the blind spot to the next shape
nobody thought of.

`mappingDests()` and the new `mappingSources()` are two projections of that one parse. The two
hand-written source-side regexes in the mapping-agreement case were **routed through the same
helper** rather than given a parallel declared-versus-parsed check — stated in the comment, with the
reason: the source side had the identical blind spot in a second place, and a second implementation
of one predicate is precisely the failure class this phase exists to delete. The path shapes that
regex encoded inline (`scripts/runnable-ref/` sources, `tools/grugops/` dests) are preserved as
explicit assertions so routing lost none of what it checked.

The three literal `toBe(2)` assertions are unchanged, and the comment records why both are wanted:
the derived cardinality closes the blind spot (the matcher missed an entry that *is* there); the
literal is the somebody-added-one forcing function.

### RED-before — and the plan's stated reproduction does not reproduce

The plan's acceptance criterion asked for a RED transcript from *rewriting one existing `RUNNABLES`
entry* into a single-quoted shape, "confirming both derived sets still come back at two members."
**That does not reproduce, and cannot.** With two entries, rewriting one leaves the old matcher with
**one** member, and the existing `toBe(2)` catches it immediately:

```
PROBE R1 (plan's literal instruction, pre-change mappingDests)
$ npx vitest run install/install.test.ts -t "the same mapping"
  AssertionError: expected [ …(2) ] to deeply equal [ 'tools/grugops/reference-check.js' ]
    1657|  expect(RUNNABLE_RELS.length).toBe(2);
  Tests  1 failed | 57 skipped
```

Reported rather than reconciled. The **review's own** scenario — a third runnable added *to both
files* in an unmatched shape — is the real blind spot, and it reproduces exactly as described:

```
PROBE R2 (the review's scenario, pre-change mappingDests)
  install/install.ts     RUNNABLES        -> parsed 2 ["...reference-check.js","...test-skip-integrity.js"]
  install/uninstall.ts   RUNNABLES_MIRROR -> parsed 2 [ same two ]
  $ npx vitest run install/install.test.ts
    Tests  58 passed | 1 skipped (59)      <- WHOLE SUITE GREEN over a source with three runnables
```

The third runnable was covered by **none** of the five cases driven off `RUNNABLE_RELS`.

### GREEN-after — all three replays

```
R2 replay (third single-quoted entry in BOTH files):
  Tests  2 failed | 56 passed | 1 skipped
    - expected 3 to be 2                 <- the forcing function fires; the entry is now READ
    - expected false to be true          <- and the new runnable is now COVERED by the round-trip case

R1 replay (rewrite one entry single-quoted):
  Tests  1 passed | 58 skipped           <- correct: a legal, now-readable shape loses nothing

Shape the WIDENED matcher still cannot read, applied to the REAL install.ts
(`["scripts/runnable-ref/test-skip-integrity.js" /* mirrored */, "tools/..."]`):
  Error: install.ts: RUNNABLES declares 2 entr(ies) but only 1 were parsed — an entry is in a
  shape this test cannot read, so the set derived here would cover less than the source does
  while every count beside it still passed
  Tests  no tests                        <- fails at COLLECTION; nothing downstream runs on a short set
```

All temporary edits were reverted; `git diff install/install.ts install/uninstall.ts` is empty for
this task and `git status --porcelain` is clean.

### Acceptance criteria

| Criterion | Result |
|---|---|
| RED-before transcript, temporary edit reverted | Yes — plus the honest note that the plan's stated form does not reproduce |
| GREEN-after with a naming message containing file, constant, both counts | Yes, verbatim above |
| Synthetic unmatched-shape case present and passing without touching the real sources | Yes — in-memory block bodies only |
| No `toBe(2)` deleted | Confirmed: the commit's deletions are only the replaced helper signature and the two hand-written regexes |
| `npx vitest run install/install.test.ts` exits 0 | 58 passed, 1 skipped (59) |
| `npx vitest run --exclude '**/scripts/e2e/**'` exits 0 | 976 passed, 2 skipped, 35 files |
| `git diff install/install.ts install/uninstall.ts` shows no change from this task | Confirmed empty |

**One plan miscount, reported:** the plan says "the four literal integer assertions in the
mapping-agreement case." There are **three** (`RUNNABLE_RELS.length`, `mirror.length`,
`srcSideInstall.length`). All three are unchanged.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 31 committed .js file(s) match a fresh tsc rebuild" |
| `npx vitest run install/install.test.ts` | 58 passed, 1 skipped (59); baseline was 55 passed, 1 skipped (56) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **976 passed, 2 skipped, 35 files** |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `git status --porcelain` | clean; every probe fixture was built under the session scratchpad |
| 27-21's `process.exit(3)` tail | untouched — the new nested-symlink case pins status `3` against it |

## Platform coverage — stated plainly

**The symlink claim is proven on the POSIX legs only.** Both new symlink cases carry an explicit
`if (process.platform === "win32") return;` with the reason stated in the case: `symlinkSync` on
Windows requires the `SeCreateSymbolicLink` privilege that an unprivileged CI runner does not hold,
so the fixture cannot be built and the case would assert nothing. All probes above were run on
darwin (the local dev box); the ubuntu CI leg exercises the same POSIX path.

**Windows behaviour of the new derivations is `UNKNOWN - verify`.** Not observed, not claimed. Note
that on Windows a directory *junction* is reported by `statSync().isDirectory()` as a directory,
which is the behaviour the change relies on — but that is reasoning, not a run, and it is recorded
here as reasoning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] A symlink CYCLE would have hung the installer**

- **Found during:** Task 1, reasoning about what following links makes reachable, then confirmed by
  adversarial probe D.
- **Issue:** `srcNestedAdapterFiles()` recurses. Deciding directory-ness by `statSync` (which
  follows links) is exactly what makes a cycle — `.claude/agents/loop -> ..`, or any link back up
  the tree — reachable. Without a guard the walk recurses without bound: the installer hangs or
  blows the stack over a source tree a user could plausibly produce. The plan's threat model covers
  a *broken* link (T-27-112) but not a *cyclic* one.
- **Fix:** `srcNestedAdapterFiles()` keeps a `Set` of `realpathSync`'d directory paths and visits
  each at most once. This removes the hang **without narrowing the set**: a directory already walked
  under an earlier path contributes no member the walk has not already seen. The reasoning is stated
  in a comment beside it, because "skipping a directory" in a derivation whose whole point is not
  being blind needs its justification in the file.
- **Verified:** probe D — `timeout 60` returned exit **3** (not 124), with seven `FLAT BY CONTRACT`
  refusals naming `loop/skills/<name>/SKILL.md` by relative path. Terminated, and loud.
- **Files modified:** `install/install.ts`
- **Commit:** `4a40842`

**2. [Rule 2 — Missing critical functionality] The routed source-side scrape would have lost its shape check**

- **Found during:** Task 2, applying the plan's "route them through the same helper" option.
- **Issue:** The two deleted hand-written regexes encoded a path-shape assertion *inline*
  (`scripts/runnable-ref/…` paired with `tools/grugops/…`). A naive route through `mappingSources()`
  would have silently dropped that check while looking like a pure refactor.
- **Fix:** the shapes are re-asserted explicitly beside the routed call, with a comment saying they
  are what the old regex encoded.
- **Files modified:** `install/install.test.ts`
- **Commit:** `d43714c`

### Corrections to the plan's own text

1. **The WR-04 RED reproduction as written does not reproduce** — rewriting one of two entries drops
   the set to one member and the existing `toBe(2)` fires immediately. The review's scenario (a
   *third* entry, in both files, in an unmatched shape) is the real blind spot and was used instead.
   Both transcripts are recorded above.
2. **"The four literal integer assertions"** — there are three. All three are unchanged.
3. The plan's `read_first` line/anchor references were accurate at HEAD apart from line drift caused
   by 27-21's own edits (the mapping block sits near `:1638`, not `:1516`).

### Deferred

- **`scripts/kit-model.ts`'s `walkFilesRelative()` has the same symlink-cycle exposure** this plan
  just closed in the installer, and every guard and oracle built on it inherits it. Out of scope
  here: the plan's `files_modified` is the installer surface, and touching the shared authority
  mid-phase would put 27-18/19/20/23's landed work at risk. Logged to
  `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md`.

## Known Stubs

None. No placeholder, no TODO, no unwired surface was introduced. Both new derivation helpers and
the mapping parser are called from live code paths and exercised by the suite.

## Threat Flags

None beyond the plan's register. T-27-109 through T-27-112 are all mitigated as specified and
verified by probe rather than by assertion; T-27-113 (following a link outside the source tree)
remains **accepted** on the plan's stated reasoning — the source root is the kit the user chose to
install from, and the installer already reads every file under it.

## Self-Check: PASSED

- `install/install.ts`, `install/install.js`, `install/install.test.ts` — all present, all modified.
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-22-SUMMARY.md` — present.
- Commits `4a40842` and `d43714c` — both present in `git log`.
