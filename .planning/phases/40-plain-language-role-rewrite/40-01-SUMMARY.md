---
phase: 40-plain-language-role-rewrite
plan: 01
subsystem: tooling
tags: [role-rule-inventory, diff-disposition, voice-guard, plain-language, typescript]

requires:
  - phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
    provides: the 19-role corpus (Tech Lead, Designer), ROLE_COUNT 19, the Phase 29 diff-disposition gate and voice guards
provides:
  - scripts/check-role-rules.ts/.js — the derived role-rule inventory (--write-baseline / --check), D13_CODING_ROLES
  - docs/audit/40-role-rule-inventory.json — the committed pre-rewrite baseline at the Phase 40 start commit
  - D-30 role-rule inventory stand-in in check-diff-disposition, base moved to the Phase 40 start commit
  - inverted guard_caveman_voice (refuses any caveman block over 20/20 files) and whole-file guard_voice incl. the protocol
  - every role and the protocol free of the caveman block; CLAUDE.md voice constraint revised; C-28-003 overstated/deferred
affects: [40-02, 40-03, 40-04, 40-05, 40-06, 40-07, 40-08, 40-09, 40-10, phase-41, phase-42]

actuals:
  tokens: 72107
  tasks: 3
  commits: 8
plan_head_before: e8d7802ccf8ebf428a47703f6001327325e3aea3
plan_head_after: 4e53438384cfcf8a08f0d1d3d82cd105640f232a

tech-stack:
  added: []
  patterns:
    - "Derived fact inventory with a committed baseline and a git-object re-derivation test (D-27)"
    - "Declared stand-in key in a recorded base, spawned once from the CLI path, failing closed (D-30)"
    - "Inverted presence guard: a retired section refused in every form (fenced, empty, malformed, bare)"

key-files:
  created:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts
    - docs/audit/40-role-rule-inventory.json
    - docs/audit/40-disposition-base-move.md
  modified:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.test.ts
    - docs/audit/29-style-dispositions/00-base.md
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/validate-agent-factory.ts
    - agent-factory/roles/*.md (19 roles + _role-switch-protocol.md)
    - agent-factory/writing-profile.md
    - docs/audit/28-claim-registry.md
    - CLAUDE.md

key-decisions:
  - "Phase 40 start commit is e8d7802ccf8ebf428a47703f6001327325e3aea3; the inventory baseline's source_commit and the new disposition base both name it"
  - "Role corpus = listRoles() plus the .md members of ROLE_DIR_EXEMPT (the protocol), because listRoleDirEntries excludes the protocol"
  - "D-31 floor discounts an intended D-13 coding-rules removal, so a non-member dropping the line stays green as the plan's own test requires"
  - "The stand-in also refuses clauses equal to a positive guard literal, independent of frozen-text map ordering"
  - "CLAUDE.md voice line ends 'harder to read' instead of 'harder to understand': check-banned-claims bans the comprehension literal"
  - "The WR-03 test keeps its delimiter-counting plant (now over a planted block), so the fence-machine set stays at three without widening any construct"

patterns-established:
  - "Pin moves for a new module are re-derived and recorded with the plan id, never incremented blindly"
  - "Tests that measured a live caveman fence plant the fence into their own mirror copy and keep the exact assertion"

requirements-completed: [PLAIN-01, PLAIN-03]

coverage:
  - id: D1
    description: "Derived role-rule inventory with committed pre-rewrite baseline, red by name on a planted loss, wired into CI and package.json"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts (11 cases incl. git re-derivation at source_commit)"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js (20/20, facts before/after per file)"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-30 base move with decision record and the fail-closed role-rule inventory stand-in"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts -t stand-in (7 cases)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js (exit 0; 12 role clauses admitted after the flip)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Atomic caveman flip: no role carries a caveman block; inverted guard seen red first and held by permanent planted cases; profile, claim and CLAUDE.md changed together"
    requirement: PLAIN-01
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts (PLAIN-01 cases; 337/338, the one failure is the recorded ~/ environmental case)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (caveman voice 0 findings over 20/20)"
        status: pass
    human_judgment: false

duration: 1h 21m
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 01: Role-rule inventory, D-30 stand-in and the atomic caveman flip Summary

**A derived role-rule inventory baseline at the Phase 40 start commit, a fail-closed inventory stand-in in the diff-disposition gate, and one commit that deletes all 19 caveman blocks behind an inverted guard that was run red first.**

## Performance

- **Duration:** 1h 21m
- **Started:** 2026-11-01T08:56:47Z
- **Completed:** 2026-11-01T10:18:00Z
- **Tasks:** 3
- **Files modified:** 49 (git diff --stat e8d7802..HEAD before this SUMMARY)

## Phase 40 start commit

`e8d7802ccf8ebf428a47703f6001327325e3aea3` — recorded with `git rev-parse HEAD` before Task 1, written as
`source_commit` in docs/audit/40-role-rule-inventory.json and as the new `base_commit` in 00-base.md.

## Accomplishments

- `scripts/check-role-rules.ts` derives the D-28 fact set for the 20 role-corpus files; the baseline is committed
  and a test re-derives it from git objects at `source_commit`, so a hand edit to the JSON is red.
- The diff-disposition gate's base moved by recorded decision D-30, and role clauses are admitted only while
  `node scripts/check-role-rules.js --check` exits 0 (fails closed on a missing script, a spawn error, a
  non-zero exit or a malformed key).
- PLAIN-01: `## Caveman prompt` left ROLE_SECTIONS and all 19 roles; guard_caveman_voice refuses any trace of
  the block over 20/20 files; guard_voice scans every voice file whole, the protocol included.

## Recorded evidence

**Pre-move disposition totals (Task 2 step 1, base 4d2b8f0):** exit 1, 42 watched files, 3358 changed clauses,
2500 rows across 64 files, **721 findings**: workflow no-row 342, role no-row 269, root README.md no-row 58,
AGENTS.md no-row 11, agent-factory/README.md no-row 10, workflow FROZEN by structuralSections 23, role FROZEN
by structuralSections 8. After the move: exit 0, clean tree at e8d7802. After the flip: exit 0, 20 watched files,
74 changed clauses, 12 role clauses admitted by the stand-in.

**guard_caveman_voice RED on the unchanged tree (Task 3 step 1, before any fence was deleted):**

```
FAIL  voice: 20 finding(s) over 22 elements      (19 roles: fence present; the protocol: grug on lines 8, 24, 31, 49, 50)
FAIL  caveman voice: 19 finding(s) over 20 elements   (one per role; the protocol carried none)
2 CHECK(S) FAILED
```

After the flip: `voice: 0 findings over 22/22`, `caveman voice: 0 findings over 20/20`.

**uat-gate-exit-contract cases that changed state:** none. The same 5 pre-existing failures (harness
false-result tally x4, round-6 debt criterion x1) before and after Task 2 and after Task 3; one new passing case
(the `role_standin` value pin): 30 passed before, 31 after.

**Bytes (D-06):** agent-factory/writing-profile.md 19,772 B -> 19,427 B. Role corpus (20 files) 78,011 B ->
74,843 B. No workflow or checklist was touched.

## Task Commits

1. **Task 1: role-rule inventory tracer** - `0b7c8686` (feat), census pins `34f720fa`, `8578f8ad`, `de39d871`, `4e534383` (test)
2. **Task 2: D-30 base move and stand-in** - `7625e866` (test, RED), `55753141` (feat, GREEN + base move)
3. **Task 3: atomic caveman flip** - `b4dfa42b` (feat)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `scripts/check-role-rules.ts` / `.js` / `.test.ts` - derived inventory, baseline writer, check, 11 cases
- `docs/audit/40-role-rule-inventory.json` - pre-rewrite baseline (20 files, source_commit e8d7802)
- `scripts/check-diff-disposition.ts` / `.js` / `.test.ts` - ROLE_STANDIN_RE, spawn in main(), 7 stand-in cases
- `docs/audit/29-style-dispositions/00-base.md`, `README.md`, `docs/audit/40-disposition-base-move.md` - D-30 record
- `scripts/uat-gate-exit-contract.test.ts`, `.github/workflows/ci.yml`, `hooks/hook-entry.ts` / `.js` - D-30 companions, CI step, manifest
- `scripts/check-foundation-guards.ts` / `.js` / `.test.ts` - inverted guard, whole-file guard_voice, PLAIN-01 cases
- `scripts/validate-agent-factory.ts` / `.js` - ROLE_SECTIONS without `## Caveman prompt`
- `agent-factory/roles/*.md` - caveman block deleted (19), protocol grug words replaced
- `agent-factory/writing-profile.md`, `docs/audit/28-claim-registry.md`, `CLAUDE.md` - flip companions
- `scripts/check-banned-claims.ts` / `.js` - exempt-extent pin 75 -> 73
- `scripts/voice-model.test.ts`, `scripts/generate-catalog.test.ts`, `scripts/generate-role-adapters.test.ts`,
  `scripts/frontmatter.test.ts`, `scripts/check-claim-anchors.test.ts`, `install/mode-census.test.ts`,
  `package.json` - flipped controls and re-derived pins

## Decisions Made

See `key-decisions` above. The one with the most reach: the baseline records that `brownfield-mapper.md` has
no `no-fabrication` fact today (its rule reads "Record real commands only — an inferred command is worse than
none", which uses none of the fake/invent/fabricate stems). Research counted 18 of 19 roles; the derivation
counts 17 (orchestrator and brownfield-mapper lack it). D-36 adds the rule to orchestrator and tech-lead; a later
role plan should add the token to brownfield-mapper too, or the gap stays as recorded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Role corpus derivation**
- **Found during:** Task 1
- **Issue:** The plan derives the corpus from `listRoleDirEntries(ROOT)` filtered to `.md`, but that lister excludes `_role-switch-protocol.md`, so it yields 19, not ROLE_COUNT + 1.
- **Fix:** corpus = `listRoles()` plus the `.md` names of `ROLE_DIR_EXEMPT` (check-role-rules and the guard both use it).
- **Files modified:** scripts/check-role-rules.ts, scripts/check-foundation-guards.ts
- **Committed in:** 0b7c8686, b4dfa42b

**2. [Rule 1 - Bug] D-31 floor vs intended D-13 removals**
- **Found during:** Task 1
- **Issue:** Read literally, a non-member dropping the coding-rules line also lowers the fact count, so the plan's own "stays green" case would go red on D-31.
- **Fix:** the floor is the baseline count minus intended D-13 removals; the raw before/after numbers are still printed.
- **Committed in:** 0b7c8686

**3. [Rule 3 - Blocking] Census pins moved by the new module**
- **Found during:** Tasks 1-3 (suite runs)
- **Issue:** Adding check-role-rules.ts/.test.ts moved two-sided pins: NON_TEST_MODULE_COUNT, TRIPWIRE_MODULES, scoped corpus, frontmatter consumers, LOCATOR_CONSUMERS, gate-module targets, the locator -1 contract set, the isEntry census and SCRIPTS_TEST_FILE_COUNT.
- **Fix:** each pin re-derived and moved with a recorded reason.
- **Committed in:** 34f720fa, 8578f8ad, de39d871, 4e534383

**4. [Rule 1 - Bug] Stand-in skipped Hard limits clauses**
- **Found during:** Task 2 (GREEN run)
- **Issue:** Structural clauses also sit in the frozen text map under `structuralSections`, so a `textSource === undefined` test admitted nothing.
- **Fix:** admit when textSource is undefined or `structuralSections`, and exclude positive-literal clauses explicitly.
- **Committed in:** 55753141

**5. [Rule 3 - Blocking] check-banned-claims refused two flip edits**
- **Found during:** Task 3
- **Issue:** (a) the writing-profile exempt region shrank 75 -> 73 lines; (b) the PROJECT.md wording carries the banned comprehension literal "understand".
- **Fix:** BANNED_CLAIM_EXEMPT_EXTENT moved to the measured 73 with a recorded reason; CLAUDE.md says "harder to read". check-banned-claims.ts was not in the plan's file list.
- **Committed in:** b4dfa42b

**6. [Rule 3 - Blocking] Guard import set pinned by D-64**
- **Found during:** Task 3
- **Issue:** check-foundation-guards.ts renders a spawn verdict and may import only `stripFencedBlocks` from frontmatter.js, so the plan's `unfencedHeadingIndex` bare-heading test was refused.
- **Fix:** the bare heading is found by comparing the lines `stripFencedBlocks` keeps with the heading string (no regex, no fence machine).
- **Committed in:** b4dfa42b

**7. [Rule 3 - Blocking] Fixtures that measured the live fence**
- **Found during:** Task 3
- **Issue:** generate-role-adapters.test.ts (two siblings) measured qe-e2e.md's fence, like the catalog case; check-role-rules.test.ts deleted a live fence.
- **Fix:** each plants the fence into its own mirror copy at the old position and keeps its exact assertion. The flip commit was amended once to include the adapter fixture, so the flip commit is green on its own.
- **Committed in:** b4dfa42b

**8. [Plan detail] CI step placement**
- The CI step sits after `check-public-docs-vocabulary.js`, not directly after `check-kit-refs.js`, so the existing "pair" comment that joins those two gates stays adjacent to both.

---

**Total deviations:** 8 (2 bugs in the plan's spec, 4 blocking pins/imports, 1 stand-in bug, 1 placement detail).
**Impact on plan:** All needed for correctness or to keep pinned gates honest. No scope creep; no role prose beyond the caveman blocks and the four protocol phrases.

## Issues Encountered

- The full suite (excluding e2e) after the flip: 10739 passed, 24 failed. 20 are the pre-existing failures that
  also fail at e8d7802 in a detached worktree (installer-fs-census 1, canonical-corpus 1, context-io 7,
  context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5). 1 is the recorded environmental
  case caused by the untracked `~/` directory (check-foundation-guards "every remaining floor item's LIVE COUNT",
  7 stray `.js` files under `~/`). The other 3 (mode-census, generate-role-adapters x2) were fixed in 4e534383
  and b4dfa42b.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 40-02 (reference role). Every later plan measures role text with `node scripts/check-role-rules.js`
  against the baseline and cites the Phase 40 start commit e8d7802ccf8ebf428a47703f6001327325e3aea3.
- Role clauses pass the disposition gate only while the inventory check passes; workflow edits still need rows.
- C-28-003 stays overstated/deferred until plan 40-10 joins role bodies to guard_sentence_form.

## Self-Check: PASSED

- FOUND: scripts/check-role-rules.ts, scripts/check-role-rules.js, scripts/check-role-rules.test.ts,
  docs/audit/40-role-rule-inventory.json, docs/audit/40-disposition-base-move.md
- FOUND commits: 0b7c8686, 34f720fa, 7625e866, 8578f8ad, 55753141, de39d871, b4dfa42b, 4e534383

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-01*
