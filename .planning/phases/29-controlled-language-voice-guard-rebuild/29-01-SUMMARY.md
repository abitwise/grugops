---
phase: 29-controlled-language-voice-guard-rebuild
plan: 01
subsystem: testing
tags: [typescript, guards, controlled-language, fence-parser, vacuity, voice]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "scripts/frontmatter.ts stripFencedBlocks + the hoisted FENCE_DELIMITER_LINE constant, kit-model.ts listRoles/ROLE_COUNT, and the CHECK_ROOT hermetic-mirror seam in check-foundation-guards.ts"
  - phase: 28-kit-consistency-audit
    provides: "the AP-1 anti-pattern record, the D-24 RED-before-GREEN discipline, and the check-public-docs-vocabulary.ts standalone-gate + synthesized-mirror house form"
provides:
  - "scripts/voice-model.ts — the ONE caveman-fence reader (readCavemanFence), the committed CAVEMAN_LEXICON, the four BANNED_CONSTRUCTIONS token sets, and the one sentence-identity pair normalizeSentence + segmentClauses"
  - "scripts/vacuity.ts — reportMeasured, the single element-level AP-1 rule, folded as FAILS += reportMeasured(...)"
  - "guard_caveman_voice — two-sided, both arms required, per-block measurement line, RED 17/17"
  - "guard_role_clause_uniqueness — intra-file clause identity, RED on 12 groups across 9 of 17 files"
  - "guard_voice migrated to the one reader, output byte-identical to the parent commit"
  - "the discriminating-fixture pattern for a conjunction whose arms fail together, proven against a scratch disjunction build"
affects: [29-02, 29-03, 29-04, 29-05, 29-06, 29-07, 29-13]

actuals:
  tokens: 32133
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One authority per predicate: a second CHECK is justified, a second READER is not"
    - "Measurement as a required argument — reportMeasured cannot be called without a denominator"
    - "Discriminating fixtures for a conjunction whose arms fail together, proven by a scratch build of the wrong operator"
    - "Mirror repair with a re-measured, throwing self-check when the tree at HEAD is deliberately red"

key-files:
  created:
    - scripts/voice-model.ts
    - scripts/voice-model.js
    - scripts/voice-model.test.ts
    - scripts/vacuity.ts
    - scripts/vacuity.js
    - scripts/vacuity.test.ts
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts

key-decisions:
  - "D-22/D-23/D-24: one reader returning a named verdict (missing | unterminated | multiple), composing frontmatter.ts's FENCE_DELIMITER_LINE and forking no state machine"
  - "D-06/D-07: the ^You cadence arm DELETED rather than supplemented; the predicate is a conjunction of a >=2-term lexicon floor and a zero-banned-construction rule"
  - "D-08: the PASS line carries the measurement; the per-block detail line is emitted inside the loop, before the fold"
  - "D-38 Variant C: clause-level segmentation, NFC first — sentence-level equality would have landed the uniqueness guard essentially green"
  - "D-43: three discriminating fixtures, because both arms fail 17/17 independently and the transcript cannot tell a conjunction from a disjunction"
  - "AP-1 closed at the call convention in scripts/vacuity.ts, emitting through fail() and never warn()"
  - "guard_voice's `missing` verdict is handled by a NAMED expectation set (role files require a fence, SEC_VOICE_FILES declare none) rather than a silent continue"

patterns-established:
  - "Set-literal shrink is recorded, not absorbed: deleting a fence machine moves the derived FENCE_MACHINES pin from 4 to 3 and the test says why"
  - "A deliberately-red gate is pinned to the EXACT guards that may be red, so a regression elsewhere is still named"
  - "A fixture harness that repairs its mirror must re-measure with the authority and throw, or it silently becomes a test of the drift"

requirements-completed: [LANG-07]

coverage:
  - id: D1
    description: "scripts/voice-model.ts is the sole caveman-fence reader; both role-prose guards call it and neither holds a fence state machine (LANG-07)"
    requirement: "LANG-07"
    verification:
      - kind: unit
        ref: "scripts/voice-model.test.ts#readCavemanFence — the three refusals (D-23)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#LANG-07 oracle: <form> — guard_voice and guard_caveman_voice name the SAME file for the SAME reason (3 cases)"
        status: pass
      - kind: unit
        ref: "scripts/frontmatter.test.ts#27-53 WR-02 — the set of tracked `.ts` files carrying a FENCE STATE MACHINE is derived, sorted and pinned"
        status: pass
    human_judgment: false
  - id: D2
    description: "guard_caveman_voice is two-sided with both arms required, publishes a per-block measurement over a 17/17 denominator, and fails RED on all 17 current blocks (LANG-06, partial — the rewrite that turns it green is 29-05..07)"
    requirement: "LANG-06"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#FIXTURE A / FIXTURE B / FIXTURE C (RED, RED, GREEN with status asserted explicitly)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#THE CONJUNCTION IS FALSIFIABLE: a scratch build shipping `||` turns fixtures A and B GREEN"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#smoke: real tree is RED on EXACTLY the two new voice guards"
        status: pass
    human_judgment: false
  - id: D3
    description: "guard_role_clause_uniqueness fails on 12 clause groups across 9 of 17 role files, intra-file only (LANG-05, partial — the de-duplication is 29-05..07)"
    requirement: "LANG-05"
    verification:
      - kind: unit
        ref: "scripts/voice-model.test.ts#segmentClauses (D-38 Variant C) — 7 cases including adjacency, encoding, empty and ordering"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#smoke: real tree is RED on EXACTLY the two new voice guards (asserts the 12-group finding count)"
        status: pass
    human_judgment: false
  - id: D4
    description: "One shared element-level vacuity rule is the mechanism; there are no per-guard zero checks (AP-1)"
    verification:
      - kind: unit
        ref: "scripts/vacuity.test.ts (11 cases across all four branches and the channel contract)"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#VACUITY: short mirror names `visited 16 of 17`; scratch empty-loop build names ZERO elements visited"
        status: pass
    human_judgment: false
  - id: D5
    description: "The nine untouched guards, the three Tier-1 oracles and the migrated guard_voice are byte-unchanged against the parent commit"
    verification:
      - kind: other
        ref: "one-shot control: `git archive afea791` to a temp tree, run both committed gates, compare output block by block — 13 blocks, 0 differences (transcript below)"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-08-13
status: complete
---

# Phase 29 Plan 01: One Fence Authority, One Vacuity Rule, Two Rebuilt Role-Prose Guards Summary

**The tree now holds exactly one caveman-fence reader, one element-level vacuity rule, and one sentence-identity function; the two rebuilt role-prose guards were watched failing against the real tree — 17/17 blocks and 12 clause groups — and the conjunction was proven wired by a scratch build of the wrong operator, which the RED transcript alone cannot do.**

## Performance

- **Duration:** 55 min
- **Tasks:** 3
- **Commits:** 3
- **Files changed:** 12 (6 created, 6 modified)

## Accomplishments

- `scripts/voice-model.ts` (348 lines) is the single voice authority. `readCavemanFence` returns a
  two-sided verdict with three named refusal reasons and no third outcome; it composes
  `frontmatter.ts`'s `FENCE_DELIMITER_LINE` (now exported) and declares no state machine.
- `scripts/vacuity.ts` (97 lines) closes AP-1 at the call convention. `reportMeasured` cannot be
  called without a `visited` and an `expected`, refuses at `visited === 0` and at
  `visited !== expected`, and emits only through `fail` — never `warn`, which does not increment
  `FAILS`.
- `guard_caveman_preserved` is gone, replaced by `guard_caveman_voice`: a conjunction of a
  two-term lexicon floor and a zero-banned-construction rule, with the `^You` cadence arm deleted.
- `guard_role_clause_uniqueness` is new: intra-file only, clause-level segmentation, NFC first.
- `guard_voice` migrated to the one reader **in the same commit**, and its output block is proven
  byte-identical to the parent commit's over all 19 voice surfaces.
- `stripCavemanBlock`, `extractCavemanBlock` and `VOICE_MARKERS` are deleted. The tracked
  fence-state-machine set falls from 4 to 3 and the derived pin in `frontmatter.test.ts` moves with
  it, with `voice-model.ts` asserted to match NEITHER classifier arm — the mechanical difference
  between composing the delimiter class and forking the machine.

## Verbatim evidence

### The 17-row voice measurement (guard_caveman_voice, RED)

`node scripts/check-foundation-guards.js`, tree at HEAD, 2026-08-13:

```
[guard_caveman_voice] every role's caveman block carries >= 2 of the 16 committed lexicon terms AND zero banned constructions — both arms required (D-06, D-07, D-08)
        agents-md-scribe.md: tokens 0 / content words 45, banned 3
        architect-design.md: tokens 0 / content words 27, banned 1
        ba-pm.md: tokens 0 / content words 32, banned 2
        brownfield-mapper.md: tokens 0 / content words 27, banned 2
        compliance-officer.md: tokens 0 / content words 41, banned 3
        factory-coach.md: tokens 0 / content words 31, banned 5
        frontend-ui.md: tokens 0 / content words 40, banned 5
        greenfield-mapper.md: tokens 0 / content words 30, banned 4
        incident-responder.md: tokens 0 / content words 28, banned 3
        installer.md: tokens 0 / content words 40, banned 5
        orchestrator.md: tokens 0 / content words 86, banned 7
        qe-e2e.md: tokens 0 / content words 29, banned 2
        release-manager.md: tokens 0 / content words 37, banned 5
        security-nfr.md: tokens 0 / content words 21, banned 1
        software-engineer.md: tokens 0 / content words 37, banned 4
        system-analyst.md: tokens 0 / content words 26, banned 1
        uat-planner.md: tokens 0 / content words 20, banned 1
  FAIL  caveman voice: 17 finding(s) over 17 elements
```

Totals: **0 lexicon tokens over 597 content words, 54 banned constructions, 17 of 17 blocks RED.**
Every block fails BOTH arms — which is precisely why the transcript is not the acceptance evidence.

### The 12-group uniqueness finding set (guard_role_clause_uniqueness, RED)

```
[guard_role_clause_uniqueness] no normalized clause repeats within a single role file — intra-file only (D-20, D-21, D-38)
  FAIL  role clause uniqueness: 12 finding(s) over 17 elements
  agents-md-scribe.md: "do not invent fake commands" x2 at line(s) 19, 50
  architect-design.md: "make structure and boundaries" x2 at line(s) 9, 14
  architect-design.md: "keep design just enough" x2 at line(s) 16, 47
  ba-pm.md: "say no to bloat" x2 at line(s) 15, 48
  compliance-officer.md: "do not invent legal advice" x3 at line(s) 9, 17, 45
  factory-coach.md: "read metrics not vibes" x3 at line(s) 9, 14, 45
  installer.md: "make this factory usable in current tool" x2 at line(s) 9, 14
  installer.md: "detect host coding agent" x2 at line(s) 15, 30
  release-manager.md: "cut releases not corners" x2 at line(s) 9, 14
  software-engineer.md: "stop if scope grows or architecture must change" x2 at line(s) 9, 17
  software-engineer.md: "stop and hand back if scope grows or architecture must change" x2 at line(s) 33, 45
  system-analyst.md: "do not choose framework" x2 at line(s) 16, 44
```

**12 groups across 9 of 17 files**, reproducing 29-RESEARCH §B-3's Variant C measurement exactly,
including both `software-engineer.md` groups — the file the phase cites as its worked example, and
the file sentence-level equality finds nothing in.

### The restricted nine-guard diff (expected: empty)

`git archive afea791` into a temp tree, both committed gates run, output compared block by block:

```
RESTRICTED DIFF parent(afea791) vs HEAD — total differences: 0
the NINE untouched guards: 9 block(s) compared, 0 difference(s)
the three Tier-1 oracles: 3 block(s) compared, 0 difference(s)
guard_voice (MIGRATED to the one reader — byte-identical output is the migration's evidence): 1 block(s) compared, 0 difference(s)

parent blocks: guard_wr05, guard_adapter_body, guard_agents_bytes, guard_adapter_size, guard_kit_counts, guard_distribution_pair, guard_voice, guard_caveman_preserved, guard_role_size, guard_context_writes, guard_referential_integrity, oracleWr05Wording, oracleHooksWiring, oracleDualPathEquivalence
head   blocks: guard_wr05, guard_adapter_body, guard_agents_bytes, guard_adapter_size, guard_kit_counts, guard_distribution_pair, guard_voice, guard_caveman_voice, guard_role_clause_uniqueness, guard_role_size, guard_context_writes, guard_referential_integrity, oracleWr05Wording, oracleHooksWiring, oracleDualPathEquivalence
```

The `guard_voice` row was the one that had to be measured rather than argued: swapping its fence
reader is behaviour-preserving only if the two readers agree on every real role file.

### Exit codes and counts

| measurement | value |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 1** — 2 CHECK(S) FAILED, both the new guards |
| `npm run build` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — **45** committed `.js` pairs (43 + `voice-model` + `vacuity`) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **48 files, 1,643 passed, 2 skipped** (baseline 46 / 1,561 / 2) |
| `git diff --name-only afea791 -- package.json .github/workflows/ci.yml` | empty |
| aggregator wall clock, 3 runs | **0.12 s / 0.09 s / 0.09 s** (pre-plan baseline 0.127 s for 11 guards) |
| guards in the aggregator | 11 → 12 (one replaced, one added) |
| `05-pr-quality-gate.md` (13,831 B) timing case | 132 clauses in **1 ms** |
| `.planning/STATE.md` longest line | **7,994** (§F-2 baseline 7,994 — unmoved) |
| `.planning/STATE.md` longest backslash run | **1** (§F-2 baseline 1 — unmoved) |

Every other repo gate re-run and green: `check-kit-refs`, `check-nul-bytes`, `check-claim-anchors`,
`check-audit-register`, `check-public-docs-vocabulary`, `coordinator-resolution-precheck`,
`validate-agent-factory`, `check-uat-oracles` — all exit 0.

## The falsifiability proof (D-43)

The 17/17 RED transcript proves the guard runs and proves nothing about the conjunction, because
both arms fail 17/17 independently at every N. Measured directly rather than argued:

- A scratch build with `positiveHolds && negativeHolds` replaced by `positiveHolds || negativeHolds`
  turns fixture A (positive holds, negative fails) and fixture B (negative holds, positive fails)
  from exit 1 to **exit 0**.
- Pointed at the same unrepaired mirror, that broken build's `[guard_caveman_voice]` output block is
  **byte-identical** to the committed build's — 17 findings over 17 elements, same 17 detail lines.

So the transcript is necessary evidence and never sufficient; the three fixtures are what make the
conjunction falsifiable. The scratch harness asserts its own mutation applied, so a `replace` that
matched nothing cannot leave the proof passing against an unmutated build.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The derived fence-machine set and its four assertions were stale the moment the two scopers were deleted**

- **Found during:** Task 1, first full suite run.
- **Issue:** `scripts/frontmatter.test.ts` derives the set of tracked `.ts` files carrying a fence
  state machine, pins it at four named members, and carries four further assertions about
  `check-foundation-guards.ts`'s two gated fence sites plus a prose pin requiring that file to SAY it
  carries two more machines. Deleting the machines made all of it false: 37 cases failed.
- **Fix:** the set is re-measured with the file's own classifier and moves to three members behind a
  new `FENCE_MACHINE_COUNT` constant that every cardinality pin now derives from (4 → 3, 5 → 4,
  3 → `COUNT - 1`); the gated-site assertions are inverted to require ZERO gated sites; the prose pin
  is inverted to require the present-tense deletion sentence and forbid the old claim; and a NEW
  assertion proves `voice-model.ts` matches NEITHER classifier arm — the mechanical difference
  between composing the delimiter class and forking the machine. Both recogniser constructs and both
  toggle constructs remain load-bearing on the smaller set, and the per-construct liveness probes and
  the exactly-one-construct-each assertion still pass unchanged.
- **Files modified:** `scripts/frontmatter.test.ts`, `scripts/check-foundation-guards.ts`.
- **Commit:** `73f67c6`

**2. [Rule 2 — Missing critical functionality] `guard_voice` would have failed red on the two security surfaces**

- **Found during:** Task 1, designing the migration.
- **Issue:** `SEC_VOICE_FILES` (`15-security-audit.md`, `security-nfr-checklist.md`) carry no
  `## Caveman prompt` anchor, which `readCavemanFence` correctly calls `missing`. Treating every
  refusal as a finding would have failed the guard on two files that are correct by design; treating
  `missing` as "scan nothing" would have silently stopped scanning two clear-voice safety surfaces.
- **Fix:** a NAMED two-sided expectation set (`EXPECTS_CAVEMAN_FENCE`, derived from `ROLE_FILES`) —
  the `{file, reason}` shape this repository already prefers over a silent `continue`. A role file
  refusing for any reason is a finding; a security surface refusing with `missing` is scanned whole;
  and a security surface that GAINS a fence is also a finding, so the declaration cannot go stale.
- **Files modified:** `scripts/check-foundation-guards.ts`.
- **Commit:** `73f67c6`

**3. [Rule 3 — Blocking] Every hermetic mirror control became a test of the tree's known drift**

- **Found during:** Task 1, first full suite run (33 failing cases).
- **Issue:** the plant cases assert that ONE planted violation turns the gate red and the unplanted
  mirror stays green. With the tree deliberately RED on two guards, a byte-faithful copy of the role
  files is the FAILURE case, not the baseline.
- **Fix:** `mirror()` now normalizes the 17 copied role files — the caveman interior is replaced with
  a conforming block built by interpolating `CAVEMAN_LEXICON`, and the second and later occurrences of
  any repeated clause are marked inside the clause rather than at the end of the line (the repeated
  clause is routinely the FIRST sentence of a `## Hard limits` paragraph, so a line-end suffix would
  have silently done nothing). The builder then RE-MEASURES with the guards' own predicates and
  THROWS if a finding survives. The reasoning and the precedent are `check-public-docs-vocabulary.test.ts`'s,
  quoted in the header. Every other guard input stays byte-faithful.
- **Files modified:** `scripts/check-foundation-guards.test.ts`.
- **Commit:** `73f67c6`

**4. [Rule 1 — Bug] Two real-tree smoke cases asserted a green gate**

- **Found during:** Task 1.
- **Issue:** `smoke: real tree is fully green` and `the sweep leaves NO residue … still exits 0` both
  pinned exit 0 against a tree that is now red by design.
- **Fix:** both inverted into PINS ON THE EXACT TWO rather than relaxations. The smoke case now
  requires exactly two FAIL lines, names both, requires exit 1, and additionally asserts the 17
  per-block detail lines are present and in `listRoles()` order — so the embedded source transcript is
  reproducible and a regression in any of the other nine guards is still reported by name. The sweep
  case asserts the FAIL-line labels are exactly `["caveman voice", "role clause uniqueness"]` and that
  `guard_wr05` still passes.
- **Files modified:** `scripts/check-foundation-guards.test.ts`.
- **Commit:** `73f67c6`

**5. [Rule 1 — Bug] `guard_kit_counts`'s failure message named a guard that no longer exists**

- **Found during:** Task 1. The derived-consumer walk instruction still said
  `guard_caveman_preserved`. Updated to name `guard_caveman_voice` and
  `guard_role_clause_uniqueness`. **Commit:** `73f67c6`

**6. [Rule 1 — Bug] The frontmatter non-test-consumer pin was one short**

- **Found during:** Task 1. `voice-model.ts` is a new non-test importer of `frontmatter.ts`, so the
  pinned consumer list moved 4 → 5. A second assertion was added requiring `voice-model.ts` to import
  exactly `["FENCE_DELIMITER_LINE"]` and nothing else, which is the D-64 Part C shape: consumers that
  take a declaration, not a verdict. **Commit:** `73f67c6`

### Plan-order deviation

**Fixtures A and B landed in Task 1's commit, not Task 2's.** Task 1 deleted
`guard_caveman_preserved`, which retired the two plant cases asserting its `no caveman marker` and
`sanded to prose` messages. Leaving them broken across a commit boundary would have committed a red
suite, so they were replaced in place by the two RED discriminating fixtures. Task 2 then added
fixture C, the falsifiability proof, the four-form parser oracle, both vacuity floors, the repair-block
pin and the timing cases — 198 cases across the two files at Task 2's close.

### Requirement marking correction

`gsd-tools requirements.mark-complete` marks every ID in the plan's `requirements` frontmatter.
LANG-05 and LANG-06 are ALSO claimed by plans 29-05, 29-06 and 29-07 — the rewrites that turn these
guards green — so marking them complete here would have been a fabricated completion. **They were
reverted to Pending; only LANG-07 is marked complete**, which this plan closes on its own.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data path was introduced.

## Residuals recorded rather than closed

- **`UNKNOWN - verify` — D-19's section-ownership rule is NOT mechanically enforced.** Recorded in
  `check-foundation-guards.ts` above the two new guards, with its reason: the only available
  predicate is a prohibition-token list, which is the strict-subset heuristic shape D-03 rejects. It
  would red on `## Responsibilities` bullets that legitimately say "stop and hand back", and would
  miss a prohibition phrased positively. The rule is carried by `guard_role_clause_uniqueness` (the
  observable half — a limit RESTATED) plus deliberate per-file review at rewrite time. A green run
  does not mean it holds.
- **The banned-construction copula set makes the conventional opener `You are <Role>.` illegal in all
  17 blocks.** Intended, per D-07's "zero banned constructions with no exemption", and the single
  largest consequence for plans 29-05..07: every rewritten block says `You <Role>.` An exemption for
  the first line would be a second grammar for one position.
- **The 12 uniqueness groups will mostly clear as a side effect of the D-09 caveman rewrite**, since
  every group has one side inside the block. That is the correct outcome for a REGRESSION guard, and
  it is why the transcript above was captured before the rewrite rather than after.

## Threat Flags

None. This plan installs zero packages (`git diff --name-only afea791 -- package.json` is empty), adds
no network or write path, and both new modules are pure — no `node:fs`, no `process.exit`, no I/O.

## Self-Check: PASSED

Files claimed created, verified present:

```
FOUND: scripts/voice-model.ts
FOUND: scripts/voice-model.js
FOUND: scripts/voice-model.test.ts
FOUND: scripts/vacuity.ts
FOUND: scripts/vacuity.js
FOUND: scripts/vacuity.test.ts
```

Commits claimed, verified in `git log`:

```
FOUND: 73f67c6  feat(29-01): one caveman-fence authority, one vacuity rule, two rebuilt role-prose guards
FOUND: cf72452  test(29-01): three discriminating voice fixtures, the fence parser oracle, both vacuity floors
FOUND: 3cea7ce  docs(29-01): record the byte accounting for a gate that now exits 1 by design
```
