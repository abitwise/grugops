---
phase: 29-controlled-language-voice-guard-rebuild
plan: 14
subsystem: voice-guards
tags: [LANG-06, CR-01, IN-01, fence-reader, harness-premise, section-bound]
status: complete
requires:
  - "scripts/voice-model.ts (plan 29-01) — the ONE fence reader and lexicon"
  - "scripts/frontmatter.ts FENCE_DELIMITER_LINE — the single delimiter class"
  - "scripts/kit-model.ts listRoles(kitRoot) — already root-taking; the harness simply was not passing one"
provides:
  - "SECTION_END — the `## ` heading class that bounds the caveman section"
  - "readCavemanFence bounded to its own section; refusals `missing` / `unterminated` by name outside it"
  - "roleNamesIn(root) — the ONE role-membership derivation for the voice harness"
  - "voiceRed(text) / clauseGroups(text) — per-TEXT predicates so a plant's contribution is derived, not declared"
  - "clauseGroupCountIn(root) — the clause derivation parameterized by root, matching voiceRedCountIn"
affects:
  - "guard_voice (check-foundation-guards.ts:2045) and guard_caveman_voice (:2194) — one reader, two consumers, one bound"
  - "plans 29-15..29-19 — every voice claim they make about a mirror now runs on an instrument whose premise is asserted"
tech-stack:
  added: []
  patterns:
    - "One authority per predicate, and the authority's SCOPE is part of the predicate"
    - "Assert the verification harness's own premise (plant a member the real tree does not have)"
    - "Derive the element count independently of the loop that consumes it"
key-files:
  created: []
  modified:
    - scripts/voice-model.ts
    - scripts/voice-model.js
    - scripts/voice-model.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "D-14-A: the fence reader is bounded to its own section — SECTION_END computed ONCE and consulted by BOTH scans"
  - "D-14-B: a `## ` line inside the fence interior refuses `unterminated`, never a shortened interior (fail-CLOSED)"
  - "D-14-C: the voice harness derives role membership from the root it MEASURES; every rootless call site is audited"
  - "D-14-D: CAVEMAN_HEADING_LINE anchored to the whole line — `## Caveman prompted` is not a heading hit"
metrics:
  duration: 14m
  completed: 2026-08-15
actuals:
  tokens: 31000
  tasks: 3
  commits: 3
---

# Phase 29 Plan 14: Section-Bounded Fence Reader & Root-Honest Voice Harness Summary

The caveman fence reader is now bounded to its own section — a de-fenced caveman block can no longer
adopt an unrelated later fenced block, and the harness that proves it derives its role membership from
the root it measures rather than from the repository.

## What Was Built

**CR-01 — the section bound.** `scripts/voice-model.ts`'s module header has always stated the
predicate as "WHERE IS THE **SECTION-ANCHORED** CAVEMAN FENCE"; the implementation was not
section-anchored. After locating the `## Caveman prompt` heading, both scans ran to end of file. A
role whose caveman section was reworded into plain senior prose therefore adopted any later fenced
block as "the caveman block", returned `ok: true`, and both voice guards published a measured number
about the wrong bytes at exit 0.

The fix is a bound, not a heuristic:

- `SECTION_END = /^## /` — a new module constant declared beside the anchor with its reason.
- The section end is computed **once** as the first `## ` line after the heading, defaulting to end of
  file when the caveman section is the document's last.
- **Both** scans are bounded by it. The open scan not finding a delimiter inside the bound is
  `missing` and does not continue past it. The close scan not finding one is `unterminated`.
- `CAVEMAN_HEADING_LINE` re-anchored from `/^## Caveman prompt/` to `/^## Caveman prompt$/`.
- `FENCE_DELIMITER_LINE` stays imported from `scripts/frontmatter.ts` — no second delimiter class, no
  second parser, no second arm.

The construction of the two returned sides is byte-unchanged, which is why the live corpus does not
move.

**IN-01 — the instrument.** `roleTextsIn(root)` called `listRoles()` with no argument: it took the
NAMES from the real repository and read those names FROM `root`. On the live tree the two roots
coincide and the bug is invisible; on a mirror it measures a set the guard did not. This is the
harness that must prove every other fix in this gap-closure round, so it landed first and alone.

## Task 1 — the harness measures the root it is handed (commit `1b90ca7`)

`roleNamesIn(root)` is the one role-membership derivation; `roleTextsIn` is rebuilt on it plus the
existing `rolePath` helper (moved above its first consumer), so the names and the bytes come from one
place and the role directory is spelled once.

`voiceRed(text)` and `clauseGroups(text)` were split out as per-TEXT predicates. That is not tidying:
it is what lets the new premise case derive a plant's **contribution** to each count through the same
authority the fold uses, independently of the loop that consumes it.

`clauseGroupCountIn(root)` is now parameterized to match `voiceRedCountIn(root)`; both live-tree
consumers (`derivedVoiceRedCount`, `derivedClauseGroupCount`) stay pointed at `ROOT` and say so.

### The rootless-call-site class audit (acceptance criterion 2)

`grep -n 'listRoles()' scripts/check-foundation-guards.test.ts`

**Before: 5 code call sites + 1 comment mention (6 lines).**

| Line | Site | Fed | Disposition |
|---|---|---|---|
| 101 | `roleTextsIn` | MIRROR | **Converted** — the reported defect |
| 146 | `DERIVED_ROLE_INPUTS` | live tree | **Deliberate residual** |
| 444 | `allRedMirror` | MIRROR | **Converted** to `roleNamesIn(m)` |
| 504 | `roleAgentNames` | MIRROR | **Converted** to root-taking `roleAgentNames(root)` |
| 4559 | live-tree smoke run | live tree | **Deliberate residual** |
| 4553 | comment | — | n/a |

**After: 2 code call sites + 2 comment mentions (4 lines: 188, 486→`roleNamesIn`, 546→`roleNamesIn`,
4620).**

```
104:// `roleTextsIn(root)` used to call `listRoles()` with NO ARGUMENT — so it took the NAMES from the
188:const DERIVED_ROLE_INPUTS = listRoles().map((f) => `agent-factory/roles/${f}`);
486:  for (const role of listRoles()) {          ← now roleNamesIn(m)
546:  listRoles().map((f) => `grugops-${...}`);  ← now roleNamesIn(root)
4595:// The 17 per-block measurement lines are present and in listRoles() sorted order, so the
4601:    expect(detail.map(...)).toEqual(listRoles());
```

Final state: **2 rootless code call sites remain, both recorded as deliberate live-tree residuals with
their reason stated at the site.**

- **`DERIVED_ROLE_INPUTS` (line 188)** — this is the mirror's COPY MANIFEST. It names which files are
  read out of the live tree and written into a fresh mirror, so the live tree *is* the root under
  measurement. Asking a not-yet-populated mirror for its role set would be circular.
- **The live-tree smoke run (line 4620)** — spawns the guard with no `CHECK_ROOT` override, so the
  tree under measurement *is* the repository; `roleNamesIn(ROOT)` would be the same call with more
  ceremony.

Two call sites which fed a MIRROR were found beyond the reported one and converted:
`allRedMirror` (an unplanted mirror-only role would have left a GREEN file inside an all-red fixture)
and `roleAgentNames` (the same defect one namespace over — `brokenMirror`'s deletion sweep would have
left a mirror-only role's adapter intact, convicting the guard for the wrong reason).

### The premise case

`the voice derivations count a role planted only into the mirror (IN-01 premise)` builds a mirror,
writes an **eighteenth** role file into it (`zz-planted-premise-role.md` — sorts clear of the live
corpus and does not begin with `_`, since `listRoles` drops underscore-prefixed entries by its own
rule and such a plant would prove nothing), and asserts:

1. **Membership** — the mirror's derived set contains the plant, the repository's does not, the
   mirror's set is exactly one longer and strictly larger than the live set.
2. **Number** — `voiceRedCountIn(m)` and `clauseGroupCountIn(m)` each moved by exactly the plant's own
   derived contribution (`voiceRed(PLANTED_TEXT) → 1`, `clauseGroups(PLANTED_TEXT) → 1`), both
   measured through the same authorities before the mirror is touched.
3. **Provenance** — `roleTextsIn(m)` contains the planted bytes and has the same length as the derived
   name set.

**Discrimination proven adversarially, not assumed.** `roleNamesIn` was temporarily mutated back to
`listRoles()` and the case run in isolation:

```
 × the voice derivations count a role planted only into the mirror (IN-01 premise) 76ms
 FAIL  scripts/check-foundation-guards.test.ts > ... > the voice derivations count a role planted only into the mirror (IN-01 premise)
AssertionError: expected [ 'agents-md-scribe.md', …(16) ] to include 'zz-planted-premise-role.md'
 Test Files  1 failed (1)
      Tests  1 failed | 170 skipped (171)
```

The mutation was reverted from a saved copy and re-verified (`const roleNamesIn = (root: string):
string[] => listRoles(root);`).

**Counts:** `npx vitest run scripts/check-foundation-guards.test.ts` — **170 passed before, 171 passed
after**, exit 0.

## Task 2 — bound the caveman fence reader to its own section (commit `9ce32c5`)

### RED transcript — the three new cases against the pre-change committed build

Tests were written first and run against the unmodified `scripts/voice-model.js`:

```
 ❯ scripts/voice-model.test.ts (33 tests | 3 failed) 18ms
     × reads a de-fenced caveman section as missing rather than adopting a later fence 3ms
     × refuses unterminated when a heading line sits inside the fence interior 1ms
     × does not treat a heading that merely starts with the anchor text as the anchor 1ms

 FAIL  ... > reads a de-fenced caveman section as missing rather than adopting a later fence
AssertionError: expected { ok: true, …(2) } to deeply equal { ok: false, reason: 'missing' }
- Expected
+ Received
  {
-   "ok": false,
-   "reason": "missing",
+   "inside": "grug club rock cave",
+   "ok": true,
+   "outside": "You plan business acceptance and record the outcome.
+
+ ## Notes
+ ",
  }

 FAIL  ... > refuses unterminated when a heading line sits inside the fence interior
AssertionError: expected { ok: true, …(2) } to deeply equal { ok: false, reason: 'unterminated' }
- Expected
+ Received
  {
-   "ok": false,
-   "reason": "unterminated",
+   "inside": "grug smash
+ ## Trap
+ you stop",
+   "ok": true,
+   "outside": "",
  }

 FAIL  ... > does not treat a heading that merely starts with the anchor text as the anchor
AssertionError: expected { ok: true, inside: 'grug', …(1) } to deeply equal { ok: false, reason: 'missing' }
- Expected
+ Received
  {
-   "ok": false,
-   "reason": "missing",
+   "inside": "grug",
+   "ok": true,
+   "outside": "",
  }

 Test Files  1 failed (1)
      Tests  3 failed | 30 passed (33)
```

The fourth new case — `every live role returns ok with a non-empty interior — the false-red control` —
**PASSED in this same pre-change run** (it is among the 30). A control that was never green before the
change proves nothing about the change; this one was.

### GREEN transcript — after the bound

```
 Test Files  1 passed (1)
      Tests  33 passed (33)
   Duration  198ms
```

### Acceptance probes

```
sectionEnd non-comment count: 4          (criterion: >= 3 — the bound is computed once, consulted by both scans)
probe1 (de-fenced + later fence  → missing)      exit=0
probe2 (heading inside interior  → unterminated) exit=0
probe3 (`## Caveman prompted`    → missing)      exit=0
```

### The live corpus did not move — byte-identity, both directions

A capture script reads all 17 role files through `listRoles` and calls the reader, emitting both sides
per file. Run against the pre-change build and the post-change build:

```
pre  sha256: 13f56b2294b9c0d1e8ddc7952e61e5cf0c473246b76b688db6f92b1110ac15e4
post sha256: 13f56b2294b9c0d1e8ddc7952e61e5cf0c473246b76b688db6f92b1110ac15e4

roles: 17 | identical two sides AND non-empty interior: 17 | mismatched: []
successes post: 17  refusals post: 0
```

**17/17 roles: same `inside`, same `outside`, non-empty interior, zero refusals.** Derived from the
live tree, not pinned as literals.

The structural reason, measured before the tightening: every live role's heading is exactly
`## Caveman prompt`, and every role's two fence delimiters lie strictly inside the section bound.
`orchestrator.md` is the one file with later fences (heading at index 12, section end at 20, fences at
13/18 **and 43/52**) — the precondition CR-01 exploits, and the bound now excludes 43/52.

### Gate output byte-identity

```
node scripts/check-foundation-guards.js   exit=0 (both)
pre : a1ef20b0bf28f3beb6eab6624c33bdaa21002cb6b434ee173722a1154e1cdc71
post: a1ef20b0bf28f3beb6eab6624c33bdaa21002cb6b434ee173722a1154e1cdc71
cmp: BYTE-IDENTICAL
```

### Full-gate cases added

- `the full gate exits 1 on a de-fenced role carrying a later lexicon-bearing fence` — plants into a
  mirror through `roleNamesIn(m)`, asserts its own premise first (`readCavemanFence(after)` is
  `{ok:false, reason:'missing'}`, exactly two delimiters exist, the later block carries
  `>= CAVEMAN_LEXICON_MIN` lexicon terms), then asserts exit 1, both guards naming the file with
  `reason missing`, no `ALL CHECKS PASSED`, and **no measurement line for that role at all**.
- `an UNMODIFIED mirror still exits 0 under the section bound — the false-red control`.

### Freshness

```
npm run build      OK
npm run typecheck  exit=0  (tsc --noEmit && tsc -p tsconfig.tests.json)
npm run freshness  exit=0  — All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
second `npm run build` → `git status --porcelain` UNCHANGED
```

`scripts/voice-model.js` was rebuilt and committed in the same commit as `scripts/voice-model.ts`.

## Task 3 — adversarial self-reproduction and the regression floor

**Hermetic, not live-tree.** `git archive HEAD | tar -x` exported 1526 files into a temp directory.
`agent-factory/roles/uat-planner.md` — the reviewer's own host — was de-fenced (heading kept at line
11, fence 12/16 replaced by senior prose) and a later `## Notes` fenced block carrying four lexicon
terms appended. A second copy of that tree had **only** `scripts/voice-model.js` replaced by the
pre-29-14 committed build (`c1190e2dbe4eb38d…` vs HEAD `cda2abf6bc3ddfbb…`), so the two runs differ in
exactly one file. Both were then pointed at the *identical* planted root via `CHECK_ROOT`.

### PRE-FIX build, planted tree — the bypass

```
$ CHECK_ROOT=$PLANT node $PREFIX/scripts/check-foundation-guards.js
EXIT=0
[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
[guard_caveman_voice] every role's caveman block carries >= 2 of the 16 committed lexicon terms AND zero banned constructions — both arms required (D-06, D-07, D-08)
        uat-planner.md: tokens 4 / content words 4, banned 0
  PASS  agent-factory/roles/uat-planner.md 3298B within ceiling
== Result ==
ALL CHECKS PASSED
```

`tokens 4 / content words 4` is the guard measuring `## Notes`, not the caveman section — a published
number about the wrong bytes, with the gate green. This reproduces the reviewer's transcript exactly.

### POST-FIX build (committed HEAD), same planted tree — the bypass is closed

```
$ CHECK_ROOT=$PLANT node $REPO/scripts/check-foundation-guards.js
EXIT=1
[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
  FAIL  voice-discipline violation:
agent-factory/roles/uat-planner.md: ## Caveman prompt fence refused — reason missing; the clear-voice remainder was not determined, so this file was NOT scanned
[guard_caveman_voice] every role's caveman block carries >= 2 of the 16 committed lexicon terms AND zero banned constructions — both arms required (D-06, D-07, D-08)
  FAIL  caveman voice: 1 finding(s) over 17 elements
  agent-factory/roles/uat-planner.md: ## Caveman prompt fence refused — reason missing
== Result ==
2 CHECK(S) FAILED
```

Both consumers name the file **and the reason (`missing`)**, so the finding says why rather than only
that. The wrong-bytes measurement line is gone entirely.

### Four gates, on the clean tree

Re-run *after* the `.planning/` state writes (STATE.md is a scanned input for two of these):

```
check-foundation-guards.js   exit=0  (0s)
check-imperative-lexicon.js  exit=0  (0s)
check-banned-claims.js       exit=0  (0s)
check-diff-disposition.js    exit=0  (1s)
```

### Regression lane

```
$ npx vitest run --exclude '**/scripts/e2e/**'
 Test Files  51 passed (51)
      Tests  1732 passed | 2 skipped (1734)
   Duration  102.74s
REGRESSION_EXIT=0
```

Against the recorded baseline of **51 files / 1725 passed / 2 skipped**: file count unchanged, passed
count **+7** — exactly the seven new cases (4 in `voice-model.test.ts`, 3 in
`check-foundation-guards.test.ts`), skips unchanged. No test was removed or weakened to reach green.

The bare test script was never invoked; every run in this plan used the `--exclude '**/scripts/e2e/**'`
form or a single named file.

### Working tree at task end

```
$ git status --porcelain
 M .planning/STATE.md
 M human-notes.txt
?? .gsd/
?? .planning/phases/29.1-per-role-model-assignment/
```

**No plant residue.** The reproduction never touched the live tree — the plant lived entirely in an
exported temp copy — so no revert was necessary and none could be forgotten.

The plan predicted exactly three pre-existing entries (`human-notes.txt`, `.gsd/`,
`.planning/phases/29.1-per-role-model-assignment/`). A **fourth**, ` M .planning/STATE.md`, was already
present when this plan began (the orchestrator's session write at `2026-08-14T20:56:45Z`) and is
carried into this plan's own documentation commit. It is not plant residue.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `gsd-tools state.advance-plan` wrote a wrong plan position and regressed the phase count**

- **Found during:** state updates, after Task 3
- **Issue:** `state.advance-plan` rewrote `Plan: 13 of 13` → `Plan: 2 of 19` (it advanced from a
  stale `1`, not from `14`) and dropped `progress.completed_phases` from `3` to `2`. The pre-existing
  `13 of 13` line was itself stale — the phase grew to 19 plans in gap-closure round 1.
  `roadmap.update-plan-progress` separately produced the mangled line
  `**Plans**: 13/19 plans executed — 13/13 executed; …`.
- **Fix:** corrected by hand to `Plan: 14 of 19 complete — next 29-15`, `completed_phases: 3`,
  `completed_plans: 88`, ROADMAP row `14/19`, and the Plans line restored to
  `**Plans**: 19 plans — 14/19 executed; gap-closure round 1 adds 6 (29-14 .. 29-19, waves 13-18)`.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Commit:** the documentation commit below.

This is the known GSD counter quirk already recorded in project memory (`gsd milestone.complete
over-scopes`, `GSD roadmap premature-complete`) — a tooling artifact, not a code defect.

### Recorded decisions, not deviations

**Task 1 is `type="tracer"` and its feedback gate was satisfied automatically rather than by a human
checkpoint.** The plan frontmatter declares `autonomous: true`, the plan contains no `checkpoint:*`
task, and the tracer's `<verify>` is a fully automated vitest run. That verify was run
(`171 passed`, exit 0) *and* adversarially shown to discriminate (the mutation transcript above)
before any expansion task began — which is the substance the gate exists to establish. No expansion
work was poured onto an unproven slice.

**`requirements.mark-complete LANG-06` intentionally left LANG-06 unchecked.** The command reported
`write_set_complete: false` and `.planning/REQUIREMENTS.md` is unchanged. This is correct, not a
failure: the plan's own edge accounting assigns two LANG-06 truths to this plan and a third to 29-18,
so LANG-06 is not closed until 29-18 lands.

### Threat register — dispositions honoured

| Threat ID | Disposition | Evidence in this plan |
|---|---|---|
| T-29-40 | mitigate | The section bound; 3 reader cases + 1 full-gate case; both consumers see one verdict |
| T-29-41 | mitigate | `roleNamesIn(root)` + the planted-18th-role premise case, shown to discriminate |
| T-29-42 | mitigate | Both scans remain single-pass line loops over a bounded index range; `SECTION_END` is a literal-anchored `/^## /` with no quantifier; `FENCE_DELIMITER_LINE` still imported. The backtracking floor case still passes (176 clauses in 1 ms) |
| T-29-43 | mitigate | Hermetic `git archive` export; the live tree was never planted into; working tree verified |
| T-29-44 | mitigate | `npm run build` in the same task as the source edit, `.js` committed with `.ts`, freshness 48/48 |
| T-29-SC | accept | Zero packages installed; `package.json` untouched and not in `files_modified` |

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced. No test was
skipped and every `<verify>` in the plan was run.

## Threat Flags

None. This plan adds no network endpoint, auth path, file-access pattern or schema at a trust
boundary; it narrows the scope of an existing pure-function reader over local markdown.

## Verification Against the Plan

| Plan verification item | Result |
|---|---|
| Harness derives membership from the root it measures, proven by a planted extra role | PASS — premise case; discrimination shown by mutation |
| Reader refuses `missing` on a de-fenced section carrying a later fence | PASS — probe1 exit 0, case green, was RED before |
| Reader refuses `unterminated` on a heading line inside the fence interior | PASS — probe2 exit 0, case green, was RED before |
| All 17 live roles identical two sides before and after; gate output byte-identical | PASS — sha256 match on both artifacts |
| Bypass exits 1 post-fix and exited 0 pre-fix, both transcripts recorded | PASS — recorded verbatim above |
| Four gates exit 0; regression at or above baseline; freshness and typecheck exit 0 | PASS — 0/0/0/0; 51 files / 1732 passed / 2 skipped; 48/48 fresh |

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — IN-01, root-honest harness | `1b90ca7` | `scripts/check-foundation-guards.test.ts` |
| 2 — CR-01, section bound | `9ce32c5` | `scripts/voice-model.ts`, `scripts/voice-model.js`, `scripts/voice-model.test.ts`, `scripts/check-foundation-guards.test.ts` |
| 3 — reproduction + regression floor | (no source change; recorded here) | — |

## Self-Check

- `scripts/voice-model.ts` — FOUND (`SECTION_END` present, non-comment `sectionEnd` count 4)
- `scripts/voice-model.js` — FOUND (rebuilt, freshness 48/48)
- `scripts/voice-model.test.ts` — FOUND (33 tests, 4 new)
- `scripts/check-foundation-guards.test.ts` — FOUND (173 tests, 3 new)
- commit `1b90ca7` — FOUND
- commit `9ce32c5` — FOUND

## Self-Check: PASSED
